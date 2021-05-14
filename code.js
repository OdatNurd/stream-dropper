function randomFloatInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomIntInRange (min, max)
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toRadians(degrees)
{
  return degrees * Math.PI / 180;
}

function toDegrees (radians)
{
  return radians * 180 / Math.PI;
}

function normalizeDegrees (degrees)
{
    degrees %= 360;
    if (degrees < 0)
        degrees += 360;
    return degrees % 360;
}


class SpriteSheet {
  constructor(cssClass, sheetW, sheetH, spriteW, spriteH) {
    this.cssClass = cssClass;

    this.width = sheetW;
    this.height = sheetH;

    this.spriteW = spriteW;
    this.spriteH = spriteH || spriteW;

    this.frameWidth = sheetW / spriteW;
    this.frameHeight = sheetH / spriteH;
  }

  randomFrame() {
    return randomIntInRange(0, this.frameWidth * this.frameHeight);
  }
}

class Sprite {
  constructor(container, spriteSheet, frame, x, y) {
    this.container = container;
    this.sheet = spriteSheet;

    // Create a div that we can use for our sprite, and give it the
    // appropriate class.
    this.element = document.createElement("div");
    this.element.className = this.sheet.cssClass;

    // Alias a reference to the style of the selement
    this.style = this.element.style;

    // Set up the position in the viewport and reposition there.
    this.x = x || 0;
    this.y = y || 0;
    this.reposition();

    // Use a default sprite image
    this.setFrame(frame || 0);

    // Attach to the container.
    this.container.appendChild(this.element);
  }

  setParent(parent) {
    this.parent = parent;
    this.parent.child = this;
  }

  setPos(x, y) {
    this.x = x;
    this.y = y;
    this.reposition();
  }

  reposition(x, y) {
    this.style.left = (x || this.x) + 'px';
    this.style.top = (y || this.y) + 'px';
  }

  update() {
    if (this.child !== undefined) {
      this.child.update();
    }
  }

  setFrame(frame) {
    this.frame = frame;
    this.style.backgroundPosition =
      (-1 * (frame % this.sheet.frameWidth) * this.sheet.spriteW + 'px ') +
      (-1 * (Math.round(frame / this.sheet.frameWidth) % this.sheet.frameHeight))
      * this.sheet.spriteH + 'px ';
  }

  destroy() {
    this.container.removeChild(this.element);
  }
}

class EmoteSprite extends Sprite {
  update() {
    if (this.parent !== undefined) {
      this.reposition(this.parent.x + this.x, this.parent.y + this.y);
    }
  }
}

class ParachuteSprite extends Sprite {
  update() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    const offset = this.child !== undefined ? this.child.sheet.spriteH : 0;

    // Bounce at the viewport edges. The sprite origin is in the upper
    // left corner, so for the right and bottom sides we need to take
    // the sprite dimensions into account.
    if ((this.x <= 0) || (this.x >= this.container.clientWidth - this.sheet.spriteW))
      this.xSpeed = -1 * this.xSpeed;

    // If we're moving upwards, bounce down. This should never happen,
    // and how often do we say stuff like that?
    if (this.y <= 0) {
      this.ySpeed = -1 * this.ySpeed;
    }

    if (this.y >= this.container.clientHeight - this.sheet.spriteH - offset) {
      this.xSpeed = 0;
      this.ySpeed = 0;
    }

    this.reposition();

    super.update();
  }
}

const viewport = document.getElementById('viewport');
const stats = document.getElementById('stats');
const button = document.getElementById('button');

let sprites = [];

// For tracking how fast we're going.
let thisFrameTime = new Date().getTime();
let lastFrameTime = 0;
let frameCount = 0;
let elapsedTime = 0;
let fps = 0;

// Is the animation running?
let running = false;

// Create the sprite sheets for our test emotes and the parachute sprites.
const emoteSheet = new SpriteSheet('emote', 280, 224, 56, 56);
const parachuteSheet = new SpriteSheet('parachute', 360, 360, 120, 120);

// Create sprite objects for the emote and the parachute used in the test.
let emote = new EmoteSprite(viewport, emoteSheet, emoteSheet.randomFrame());
let parachute = new ParachuteSprite(viewport, parachuteSheet, parachuteSheet.randomFrame());

// Parent the emote to the parachute so that when the chute moves, it moves
// too. This is actually backwards; the parachute should be parented to the
// emote, but we can fix that later.
emote.setParent(parachute);

// Set up a random position and speed for the parachute.
parachute.setPos(randomIntInRange(0, parachute.container.clientWidth),
                 randomIntInRange(0, 64));

parachute.xSpeed = randomFloatInRange(-5, 5) || 5;
parachute.ySpeed = randomFloatInRange(1, 3);

// Since the emote is parented to the parachute, it's positiopn is an offset from
// the parent, which here is set so that the emote hangs at the bottom of the
// parachute "strings".
//
// We need to do a manual update here, which will make the emote reposition
// itself  under the parachute initially. On future frames, the parachute
// updating will handle that for us. This isn't needed if the simulation starts
// right away, but currently we have a button press.
emote.setPos((parachuteSheet.spriteW / 2) - (emoteSheet.spriteW / 2),
              parachuteSheet.spriteH - Math.round(emoteSheet.spriteH / 4));
emote.update();

// Add the parachute to the list of sprites that should be updated each frame.
// The emote doesn't need to be added because it's parented to the parachute
// and the parent will update it.
sprites.push(parachute);

// Calculate the frame rate, so we can determine how well things are
// performing.
function updateFPS() {
  frameCount++;

  lastFrameTime = thisFrameTime;
  thisFrameTime = new Date().getTime();
  elapsedTime += thisFrameTime - lastFrameTime;
  fps = 1000 / (thisFrameTime - lastFrameTime);

  if (elapsedTime >= 1000)
  {
    stats.innerHTML = `${frameCount} fps`;
    elapsedTime -= 1000;
    frameCount = 0;
  }
}

// Render this frame; this will keep calling itself in a loop as long
// as the animation should be running.
function renderLoop() {
  // Schedule another call for the next frame.
  if (running === true) {
    window.requestAnimationFrame(renderLoop);
  }

  // Update the framerate, then animate the sprites.
  updateFPS();

  for (let i=0; i < sprites.length; i++)
  {
    if (sprites[i].parent === undefined) {
      sprites[i].update();
    }
  }
}

function toggleRender() {
  running = !running;
  button.innerHTML = running === true ? "Click to Stop" : "Click to Start";

  if (running === false) {
    emote.setFrame(emote.sheet.randomFrame())
    parachute.setFrame(parachute.sheet.randomFrame())
  }
  if (running === true) {
    renderLoop();
  }
}
