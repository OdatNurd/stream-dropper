/* This class contains some simple static utility functions for use elsewhere
 * in the engine. */
class Utils {
  /* Generate a random float value in the given range. */
  static randomFloatInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* Generate a random integer value in the given range. */
  static randomIntInRange(min, max)
  {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}


/* This class represents a sprite sheet, which is an image that contains one
 * or more sprites that can be used as backgrounds in a div.
 *
 * The constructor requires you to specify the CSS class that will be used to
 * represent anything that uses this sprite sheet (to associate the appropriate
 * image) as well as the dimensions of the image and the dimensions of the
 * sprites contained within * it.
 *
 * All sprites are assumed to be the same dimensions. */
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
    return Utils.randomIntInRange(0, this.frameWidth * this.frameHeight);
  }

  frameX(frame) {
    return -1 * (frame % this.frameWidth) * this.spriteW;
  }

  frameY(frame) {
    return (-1 * (Math.round(frame / this.frameWidth) % this.frameHeight)) * this.spriteH;
  }
}

/* This class represents a simple sprite container, which allows for holding
 * one or more Sprite instances. This is represented as a dynamically created
 * div which can be used to apply translations and rotations to multiple sprites
 * at once.
 *
 * The constructor requires you to specify the element in the page that will
 * contain this container, the css class to apply to it, and a location within
 * the container provided that it should be positioned at initially. */
class SpriteContainer {
  constructor(container, className, x, y) {
    this.container = container;

    // Create a div that we can use for our sprite, and give it the
    // appropriate class.
    this.element = document.createElement("div");
    this.element.className = className;

    // Alias a reference to the style of the selement
    this.style = this.element.style;

    this.x = x || 0;
    this.y = y || 0;
    this.reposition();

    // Our child sprites.
    this.sprites = [];

    // Attach to the container.
    this.container.appendChild(this.element);
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

  addChild(sprite) {
    sprite.parent = this;
    this.sprites.push(sprite);
  }

  update() {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update();
    }
  }

  destroy() {
    this.container.removeChild(this.element);
  }
}

/* This class represents a simple DOM sprite. The constructor requires you to
 * specify the containing element, the sprite sheet that will provide the
 * image(s) for this sprite, the frame in the sprite sheet to start with, and
 * a position in the container.
 *
 * The sprite is implemented as a dynamically created div, stored in the passed
 * in container, which uses as it's background image one of the images from the
 * sprite sheet provided. */
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
    this.style.backgroundPosition = this.sheet.frameX(frame) + 'px ' +
                                    this.sheet.frameY(frame) + 'px';
  }

  destroy() {
    this.container.removeChild(this.element);
  }
}

/* This simple subclass of the SpriteContainer is specifically for grouping
 * together a parachute sprite and an emote sprite for dropping. It parents
 * them so that they will move together, and allows for applying a swaying
 * animation as well. */
class ParachuteDropper extends SpriteContainer {
  constructor(container, className, x, y) {
    super(container,className, x, y);
    this.xSpeed = 0;
    this.ySpeed = 0;

    this.width = 120;
    this.height = 162;

    this.landed = false;
    this.deployed = false;
    this.brakeHeight = 0;

    this.parachute = null;
    this.emote = null;
  }

  update() {
    if (this.landed === true) {
      return;
    }

    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // If we're past the braking height, slow down until we hit a good threshold.
    if (this.y >= this.brakeHeight && this.ySpeed > 0.5) {
      this.ySpeed /= 1.05;
    }

    // If we're not deployed yet, but we're on the screen, then deploy now.
    if (this.deployed === false && this.y >= 0) {
      this.deployed = true;

      // Display the parachute and enable the animation that causes it to  scale
      // up into existence.
      if (this.parachute !== null) {
        this.parachute.element.classList.toggle('hide');
        this.parachute.element.classList.toggle('deploy');
      }

      // Start swaying now that the parachute is out.
      this.element.classList.toggle('sway');
    }

    // Bounce on the left and right viewport edges.
    if ((this.x <= 0) || (this.x >= this.container.clientWidth - this.width))
      this.xSpeed = -1 * this.xSpeed;

    // When we touch down, indicate that we've landed so that we stop updating,
    if (this.y >= this.container.clientHeight - this.height) {
      // We're landed, so stop updating.
      this.landed = true;

      // Stop the swaying animation and hide the parachute.
      this.element.classList.toggle('sway');
      if (this.parachute !== null) {
        this.parachute.element.classList.toggle('hide');
      }
    }

    // Ready to reposition ourselves in the viewport now.
    this.reposition();

    // Allow the parachute and emote to update if they need to.
    if (this.parachute !== null) this.parachute.update();
    if (this.emote !== null) this.emote.update();
  }
}

// Get the elements from the DOM that we're going to be interacting with.
// NOTE: None of this code is currently in a DOMReady guard, so this probably
// only works for local testing (which is ok, since that's what we're doing).
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

// Create a dropper wrapper for the emote and parachute that we're about to
// drop in.
const dropper = new ParachuteDropper(viewport, 'dropper', 300, 100);

// Create sprite objects for the emote and the parachute used in the test.
let emote = new Sprite(dropper.element, emoteSheet, emoteSheet.randomFrame());
let parachute = new Sprite(dropper.element, parachuteSheet, parachuteSheet.randomFrame());

// Set the emote position offset so that it appears centered under the
// parachute. It's horizontally centered and vertically 1/4 of it's own height
// off the bottom, so that it overlaps the place where the parachute chords are.
emote.setPos((parachuteSheet.spriteW / 2) - (emoteSheet.spriteW / 2),
              parachuteSheet.spriteH - Math.round(emoteSheet.spriteH / 4));

// Add the class to the parachute that hides it from view
parachute.element.classList.toggle('hide');

// Tell the dropper about it's children so that it can update them later.
dropper.emote = emote;
dropper.parachute = parachute;

// Figure a spawn offset from the left and right sides of the viewport within
// which we will spawn in our character. We don't want to be too close to the
// left or right sides of the screen as we aarrive in, then set the position
// of the dropper. It's positioned vertically to be just off the top of the
// screen.
const dropperXOffs = Math.round(dropper.container.clientWidth / 7) * 2;

dropper.setPos(Utils.randomIntInRange(dropperXOffs, dropper.container.clientWidth - dropperXOffs),
                -162);

// Make the children reposition themselves based on their parent so that they're
// in the correct place to start with.
dropper.update();

// Set the initial speeds; we want to drop very fast with only a small amount of
// left to right as we're coming into the screen. The brake height specifies at
// what point we start slowing down. Visually, this happens at around the time
// the parachute deploys.
dropper.xSpeed = Utils.randomFloatInRange(3, 5);
dropper.ySpeed = Utils.randomFloatInRange(8, 10);
dropper.brakeHeight = Utils.randomIntInRange(1, 8);

// Randomly determine what direction we're moving.
if (Utils.randomFloatInRange(0, 1) <= 0.5) {
  dropper.xSpeed *= -1;
}

// Add the dropper to the sprite list so that the render loop will update it.
sprites.push(dropper);


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

  // Every time the button is clicked the animation state toggles. Whenever it
  // toggles to off, swap the sprites being used for other random sprites. This
  // is a test of the spread sheet.
  if (running === false) {
    emote.setFrame(emote.sheet.randomFrame())
    parachute.setFrame(parachute.sheet.randomFrame())
  }
  if (running === true) {
    renderLoop();
  }
}
