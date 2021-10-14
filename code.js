/* This class contains some simple static utility functions for use elsewhere
 * in the engine. */
class Utils {
  /* Generate a random float value in the given range. */
  static randomFloatInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* Generate a random integer value in the given range. */
  static randomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}


/* This class represents a sprite sheet, which is an image that contains one
 * or more sprites that can be used as backgrounds in a div.
 *
 * The constructor requires you to specify the CSS class that will be used to
 * represent anything that uses this sprite sheet (to associate the appropriate
 * image) as well as the dimensions of the image and the dimensions of the
 * sprites contained within it.
 *
 * All sprites used by any particular sprite sheet are assumed to be the same
 * dimensions. */
class SpriteSheet {
  /* A sprite sheet consists of a css class that is used to display an image,
   * the width and height of that image, and the count of sprites in both
   * dimensions that it contains. */
  constructor(cssClass, sheetInfo, spriteW, spriteH) {
    this.cssClass = cssClass;

    this.width = sheetInfo[0];
    this.height = sheetInfo[1];
    this.spriteCount = sheetInfo[2];

    this.spriteW = spriteW;
    this.spriteH = spriteH || spriteW;

    this.frameWidth = sheetInfo[0] / spriteW;
    this.frameHeight = sheetInfo[1] / spriteH;
  }

  /* Randomly select a frame number from the count of available frames. */
  randomFrame() {
    return Utils.randomIntInRange(0, this.spriteCount);
  }

  /* For any valid frame number in this sprite sheet, return the X position in
   * the image that the frame is at. */
  frameX(frame) {
    return -1 * (frame % this.frameWidth) * this.spriteW;
  }

  /* For any valid frame number in this sprite sheet, return the Y position in
   * the image that the frame is at. */
  frameY(frame) {
    return (-1 * (Math.round(frame / this.frameWidth) % this.frameHeight)) * this.spriteH;
  }
}


/* This class represents an Entity, which is some object or thing in the game
 * world. This can be something with a display on the page, something invisible
 * and just used to notate location, and can also emit sounds.
 *
 * The fundamental property of an entity is that it has a position within some
 * container element. Information as to how to display itself within that
 * container and it's dimensions are optionally available. */
class Entity {
  /* An entity must have a container to display itself inside of, and a position
   * within that container. Optionally, it may also contain a spritesheet as
   * well.
   *
   * A sprite sheet will give the entity a width and a height; without a sprite
   * sheet this must be set manually later. */
  constructor(container, x, y, spriteSheet, frame) {
    this.container = container;
    this.sheet = spriteSheet || null;

    this.element = document.createElement("div");
    this.style = this.element.style;

    // By default we're not dead.
    this.dead = false;

    // If we have a sprite sheet, set up our visual display as well as our
    // dimensions. Otherwise, we have no size.
    if (this.sheet) {
      this.element.className = this.sheet.cssClass;
      this._width = this.sheet.spriteW;
      this._height = this.sheet.spriteH;
    } else {
      this._width = 0;
      this._height = 0;
    }

    // Set up the given frame and position
    this.setFrame(frame || 0);
    this.setPos(x || 0, y || 0);
    this.reposition();
  }

  /* Visually display the entity by adding it to the DOM so that it will
   * render. */
  display() {
    this.container.appendChild(this.element);
  }

  /* Hide the entity by removing it from the DOM so that it will no longer be
   * rendered. */
  hide() {
    this.container.removeChild(this.element);
  }

  /* Set the width of this entity. */
  set width(newW) {
    this._width = newW;
  }

  /* Obtain the current width of this entity. */
  get width() {
    return this._width;
  }

  /* Set the height of this entity. */
  set height(newH) {
    this._height = newH;
  }

  /* Obtain the current height of this entity. */
  get height() {
    return this._height;
  }

  /* Modify the position of this entity within it's container. */
  setPos(x, y) {
    this.x = x;
    this.y = y;
  }

  /* Reposition the entity in the container to the given position; if no
   * position is given, the current entity position is used instead. */
  reposition(x, y) {
    this.style.left = (x ?? this.x) + 'px';
    this.style.top = (y ?? this.y) + 'px';
  }

  /* Adjust the frame to be used for this entity. This only applies to an
   * entity with an attached sprite sheet, and will adjust the background
   * position of the image to display the appropriate sprite. */
  setFrame(frame) {
    this.frame = frame;
    if (this.sheet !== null) {
      this.style.backgroundPosition = this.sheet.frameX(frame) + 'px ' +
                                      this.sheet.frameY(frame) + 'px';
    }
  }

  /* Play the sound from the associated audio tag, optionally also setting the
   * volume level for the playback. */
  play(snd, volume, restart) {
    if (restart === true) {
      snd.currentTime = 0;
    }

    if (volume !== undefined) {
      snd.volume = volume;
    }

    snd.play();
  }

  /* Give this entity a chance to update its state, based on its own rules.
   * This will be invoked once per frame, and will be given the time delay in
   * milliseconds since the last frame. */
  update(deltaT) {
  }
}


/* This class represents a simple DOM sprite, which allows a div to display
 * based on a sprite that comes from a sprite sheet containing one or more
 * sprite images. */
class Sprite extends Entity {
  /* A sprite must have a base container to attach itself to, a sprite sheet
   * to define it's dimensions, a position and a frame in the sprite sheet to
   * store it's current display state. */
  constructor(container, spriteSheet, frame, x, y) {
    super(container, x, y, spriteSheet, frame);

    // Display ourselves in the container.
    this.display();
  }

  setPos(x, y) {
    super.setPos(x, y);
    this.reposition();
  }
}


/* This class represents a simple sprite container, which allows for holding
 * one or more Sprite instances. This is represented as a dynamically created
 * div which can be used to apply translations and rotations to multiple sprites
 * at once. */
class SpriteContainer extends Entity {
  /* A sprite container must have a base container that it will display inside
   * of and be positioned relative to, a class name to associate with it for
   * animation/styluing purposes, and a position in the display container. */
  constructor(container, className, x, y) {
    super(container, x, y, null, 0);

    // Store the css class name in our selement, since we have no sprite sheet.
    this.element.className = className;

    // Initialize a list of child sprites that we contain, which starts off
    // empty.
    this.sprites = [];

    // Display ourselves in the container.
    this.display();
  }

  setPos(x, y) {
    super.setPos(x, y);
    this.reposition();
  }

  /* On every frame update, send an update request to all registered children
   * so that they can update themselves. */
  update(deltaT) {
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i].update(deltaT);
    }
  }
}


/* A simple sprite subclass that represents the target area at the bottom of the
 * screen. It contains a list of child elements which represent the droppers
 * that have successfuly landed on top of it.
 *
 * It's update loop ensures that only one dropper can be in the list by picking
 * the one with the highest score and discarding the rest. */
class Target extends Sprite {
  /* Create a target; the sprite sheet is presumed to have only a single frame
   * in it, so the constructor is simplified. */
  constructor(container, spriteSheet, x, y) {
    super(container, spriteSheet, 0, x, y);

    // The droppers that are currently sitting on the target.
    this.droppers = [];
  }

  /* Add to the list of droppers that are currently sitting on top of the
   * target. */
  addDropper(dropper) {
    this.droppers.push(dropper);
  }

  /* This dropper landed on the target, but is technically a loser because there
   * is another dropper also on the target that has a higher score. So, we need
   * to make this one a loser. The voluntary flag indicates if the dropper
   * self-ejected itself from the game or not. */
  ditchLoser(dropper, voluntary) {
    dropper.handleLose();

    // This dropper is no longer a winner, but it was still on the target.
    dropper.transmitDropStatus(true, false, voluntary);
  }

  /* Scan all of the droppers currently sitting on the target (if any), and if
   * we find one that has the name provied, mark it as a loser but do so with
   * the voluntary flag so that the back end knows what's up. */
  abdicateDropper(name) {
    for (let i = 0 ; i < this.droppers.length ; i++) {
      if (this.droppers[i].name === name) {
        this.ditchLoser(this.droppers[i], true);
        return this.droppers.splice(i, 1);
      }
    }
  }

  /* On each frame update, verify that we have only a single dropper at most on
   * our surface by finding the highest score and marking all others as a
   * losing dropper. */
  update(deltaT) {
    if (this.droppers.length > 1) {
      let highDropper = undefined;

      // Scan over all droppers and try to find the one with the highest score.
      // Anything we find that's got a lower score than the current dropper
      // gets marked ass a loser.
      for (let i = 0 ; i < this.droppers.length ; i++) {
        if (highDropper === undefined || this.droppers[i].dropScore > highDropper.dropScore) {
          // If we have an existing high score, this dropper is higher, so bye.
          if (highDropper !== undefined) {
            this.ditchLoser(highDropper, false);
          }
          highDropper = this.droppers[i];
        } else {
          this.ditchLoser(this.droppers[i], false);
        }
      }

      // Adjust the list of droppers to contain only the high scorer.
      this.droppers.length = 0;
      this.droppers.push(highDropper);
    }
  }
}


/* This container groups together a parachute sprite, an emote sprite, and the
 * text blocks that represent who the dropper represents from the chat and the
 * eventual score (if required).
 *
 * This allows for all items to be grouped together in a way that allows them to
 * all be transformed and rotated as a group. */
class ParachuteDropper extends SpriteContainer {
  /* Create a dropper inside of the parent container given, ready to display
   * itself at a specific position. The dropper is also associated with the
   * target that it's aiming for. */
  constructor(container, className, x, y, target, parachuteSheet, emoteSheet, name) {
    super(container, className, x, y);

    // Keep a reference to our drop target.
    this.target = target;

    // Create our child items.
    this.parachute = new Sprite(this.element, parachuteSheet, parachuteSheet.randomFrame());
    this.emote = new Sprite(this.element, emoteSheet, emoteSheet.randomFrame());;
    this.nameBox = new SpriteContainer(this.element, 'nickname');
    this.scoreBox = new SpriteContainer(this.element, 'score');


    // Set the emote position offset so that it appears centered under the
    // parachute. It's horizontally centered and vertically 1/4 of it's own height
    // off the bottom, so that it overlaps the place where the parachute chords are.
    this.emote.setPos((parachuteSheet.spriteW / 2) - (emoteSheet.spriteW / 2),
                       parachuteSheet.spriteH - Math.round(emoteSheet.spriteH / 4));

    // Initialize the box that will store the name of this dropper; it should be
    // centered in the overall dropper.
    this.nameBox.setPos(
      (this.element.clientWidth / 2) - (this.nameBox.element.clientWidth / 2),
      this.parachute.height * 0.666
    );

    // Like the name box, initialize the score box. The position is centered and
    // above the name, but has no initial value and will be populated later.
    this.scoreBox.setPos(
      (this.element.clientWidth / 2) - (this.scoreBox.element.clientWidth / 2),
      this.parachute.height * 0.5
    );

    // Create the elements for all of the sounds that we're going to play; the
    // tag attributes come from the configuration, to allow for sounds to be
    // easily swapped out.
    this.sndParachute = this.createAudioElement('Parachute');
    this.sndSnip = this.createAudioElement('Snip');
    this.sndBuzz = this.createAudioElement('Buzz');
    this.sndLand = this.createAudioElement('Land');
    this.sndWinner = this.createAudioElement('Winner');
    this.sndScream = this.createAudioElement('Scream');

    this.element.appendChild(this.sndParachute);
    this.element.appendChild(this.sndLand);
    this.element.appendChild(this.sndWinner);
    this.element.appendChild(this.sndScream);

    // Make the children reposition themselves based on their parent so that they're
    // in the correct place to start with.
    this.update(0);

    // Initialize our dimensions, which never change. They're hard coded based
    // on knowing the size of a parachute and emote sprite and the positioning
    // of those two things in the group.
    this.width = 120;
    this.height = 162;

    // Handle the situation where animations we've applied
    this.element.addEventListener('animationend', e => this.animationEnd(e));

    // With all of our initial setup done, randomize everything for a new drop.
    this.randomize(name);
  }

  /* Creates and returns an audio element set to play the sound configured by
   * the configuration items with the given prefix value. */
  createAudioElement(prefix) {
    const element = document.createElement("audio");

    element.src = Config[`${prefix}Sound`];
    element.preservesPitch = Config[`${prefix}PitchPreserve`];

    const rate = Config[`${prefix}Playback`];
    if (rate !== null) {
      element.playbackRate = Utils.randomFloatInRange(rate[0], rate[1]);
    }

    return element;
  }

  /* Kills this entity by adding it to the entity pool, removing it from the DOM
   * and requesting that the render loop cull it from the list. */
  kill() {
    EntityPool.add(this);
    this.hide();

    // Flag it as dead so the render loop will cull it from the update list.
    this.dead = true;
  }

  /* Whenvever any of the CSS animations we apply to the container finish,
   * this will get invoked to tell us. We use this to take various actions as
   * animations are completed. */
  animationEnd(event) {
    // If we have just finished fading out the dropper as a whole, remove it
    // from the DOM and the sprite list.
    if (event.animationName === 'reapDropper') {
      this.kill();
    }
  }

  /* Initially inialize (or re-initialize, if we are reusing this dropper) the
   * options that control the dropper.
   *
   * This is invoked from the constructor to randomize positions, but will also
   * be called when we get pulled out of the sprite pool and re-used. */
  randomize(name) {
    // Ensure that the parachute is hidden until it gets deployed.
    this.parachute.element.classList.add('ghost');
    this.parachute.element.classList.remove('releaseChute');

    // Make sure that the emote is positioned correctly if it was mid-cut
    // during a drop.
    this.emote.element.classList.remove('cut', 'cutDrop');

    // The name box should not be ghosted, which it might be if this dropper
    // was previously a loser.
    this.nameBox.element.classList.remove('ghost');

    // The score box should be hidden and should not be fading in.
    this.scoreBox.element.classList.add('hide');
    this.scoreBox.element.classList.remove('fadeIn');

    // Our element should not be ghosted, faded, swawing or marked as a loser.
    this.element.classList.remove('ghost', 'sway', 'loser', 'reap');

    // Display the name and also save it as a field in the class; external code
    // may want to know our name (say to constrain droppers with the same name)
    // and this makes it easier to pull them out.
    this.nameBox.element.innerText = name;
    this.name = name;

    // Randomize the frame used for the parachute.
    this.parachute.setFrame(this.parachute.sheet.randomFrame());

    // We have not landed yet.
    this.landed = false;

    // Assign a braking height and indicate we've not yet deployed the cute. The
    // brake height specifies at what point we start slowing down. Visually,
    // this happens at around the time the parachute deploys.
    this.brakeHeight = Utils.randomIntInRange(1, 8);
    this.deployed = false;

    // These track whether or not a cut has happened on the chute. When a cut is
    // requested, the flag is set and handling will count down a timer until the
    // cut actually happens. Once the clock runs out, the cut is actually
    // triggered and the chute will be removed and the dropper goes into free
    // fall.
    this.cutRequested = false;
    this.cutTriggered = false;
    this.cutClock = (Config.CutRange === null)
      ? 0
      : Utils.randomFloatInRange(Config.CutRange[0], Config.CutRange[1]);

    // We have not won and we're not complete (and thus, the death clock is empty).
    this.winner = false;
    this.dropComplete = false;
    this.deathClock = 0;

    // We have not scored yet.
    this.dropScore = 0;

    // Figure a spawn offset from the left and right sides of the viewport
    // within which we will spawn in our character. We don't want to be too
    // close to the left or right sides of the screen as we arrive in.  It's
    // positioned vertically to be just off the top of the screen.
    const dropperXOffs = Math.round(this.container.clientWidth / 7) * 2;

    this.setPos(Utils.randomIntInRange(dropperXOffs, this.container.clientWidth - dropperXOffs), -162);

    // Set the initial speeds; we want to drop very fast with only a small amount of
    // left to right as we're coming into the screen.
    this.xSpeed = Utils.randomFloatInRange(3, 5);
    this.ySpeed = Utils.randomFloatInRange(8, 10);

    // this.x = 300;
    // this.y = 200;
    // this.xSpeed = 0;
    // this.ySpeed = 0;

    // Loser: Right edge of emote is coindent with the left edge of the target;
    //        must overlap by at least one pixel.
    // this.x = this.target.x - this.emote.x - this.emote.width;

    // Winner: Now the edge overlaps by 1.
    // this.x = this.target.x - this.emote.x - this.emote.width + 1;

    // Loser: Left edge of emote is coincident with the right edge of the target;
    //        must overlap by at least one pixel.
    // this.x = this.target.x + this.target.width - ((this.parachute.width - this.emote.width) / 2);

    // Winner: Now the edge overlaps by 1
    // this.x = this.target.x + this.target.width - ((this.parachute.width - this.emote.width) / 2) - 1;

    // Winner, best possible score, the emote is perfectly centered in the target.
    // this.x = this.target.x + (this.target.width / 2) - (this.emote.width / 2) - this.emote.x;

    // Winner, random score; only spawns within the range of the target.
    // this.x = Utils.randomIntInRange(
    //   this.target.x - this.emote.x - this.emote.width + 1,
    //   this.target.x + this.target.width - ((this.parachute.width - this.emote.width) / 2) - 1
    //   );

    // If using the above, reset the position to where it currently is now.
    // this.setPos(this.x, this.y);

    // Randomly determine what direction we're moving.
    if (Utils.randomFloatInRange(0, 1) <= 0.5) {
      this.xSpeed *= -1;
    }
  }

  /* Called from update()
   *
   * Handle the logic related to the dropper if it'a landed at the bottom of
   * the screen and is no longer moving. */
  landed_update(deltaT) {
    // We don't need to do anything special if we're a winner or already done.
    if (this.winner === true || this.dropComplete === true) {
      return;
    }

    // Count up the death clock; when we've hit the threshold, mark ourselves
    // as done and trigger the CSS classes that will make us fade out and off
    // the bottom of the screen.
    this.deathClock += deltaT;
    if (this.deathClock >= 5 * 1000) {
      this.dropComplete = true;
      this.element.classList.toggle('reap');
      this.element.classList.toggle('ghost');
    }
  }

  /* Called from update()
   *
   * Handle the logic related to the dropper if it's chute has been cut. This
   * will count down the cut clock, and trigger the release of the parachute
   * when it actually counts down. */
  cut_update(deltaT) {
    this.cutClock -= deltaT;

    // If the clock is out, we can jettison the parachute now.
    if (this.cutClock <= 0) {
      this.element.classList.remove('sway');
      this.parachute.element.classList.add('ghost', 'releaseChute');

      // Trigger the actual drop from the cut now.
      this.cutTriggered = true;
    }
  }

  /* Called from update()
   *
   * Deploy the chute on this dropper; this triggers the appropriate animations
   * to make the chute look like it's deployed. */
  deploy_chute(deltaT) {
    this.deployed = true;

    // Display the parachute and enable the animation that causes it to  scale
    // up into existence.
    if (this.parachute !== null) {
      this.parachute.element.classList.toggle('ghost');
      this.parachute.element.classList.toggle('deployChute');

      // Play a sound.
      this.play(this.sndParachute, Config.ParachuteVolume);
    }

    // Start swaying now that the parachute is out.
    this.element.classList.toggle('sway');
  }

  /* Cuts the chute on this dropper if it's been deployed, or stops it from
   * actually being deployed if it happens soon enough. */
  cut_chute() {
    if (this.cutRequested === true || this.y > Config.CutLockout) {
      if (this.landed === false) {
        this.play(this.sndBuzz, Config.BuzzVolume);
      }
      return;
    }

    // Visibly make the emote drop slightly, and then play a sound to let the
    // players know that a cut is in progress.
    this.emote.element.classList.add('cut', 'cutDrop');
    this.play(this.sndSnip, Config.SnipVolume);

    // Consider this chute cut now.
    this.cutRequested = true;
  }

  /* Called from update()
   *
   * Called when we land on the bottom of the screen. */
  land(deltaT) {
    // Mark that we've landed and play a sound.
    this.landed = true;
    this.play(this.sndLand, Config.LandVolume);

    // Now that we have landed, we should no longer sway, and our parachute
    // should no longer be visible.
    this.element.classList.remove('sway');

    // If the emote was cut, it had these assigned, so remove them.
    this.emote.element.classList.remove('cut', 'cutDrop');

    if (this.parachute !== null && this.cutRequested === false) {
      this.parachute.element.classList.add('ghost', 'releaseChute');
    }
  }

  /* Every frame, update our state. We continue to drift down the screen until
   * we touch down on the bottom of the screen, at which point we're either
   * marked as a winner or a loser.
   *
   * During the fall we bounce off the side of the screen, and the parachute
   * will slow our descent until our Y speed is at a given threshold. */
  update(deltaT) {
    if (this.landed === true) {
      return this.landed_update(deltaT);
    }

    // If a cut has been requested but hasn't happened yet, tick the clock for
    // it.
    if (this.cutRequested === true && this.cutTriggered === false) {
      this.cut_update(deltaT);
    }

    // Move ourselves on the screen.
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // If we're past the braking height, slow down until we hit a good threshold;
    // this only applies if he chute hasn't been cut.
    if (this.cutTriggered === false && this.y >= this.brakeHeight && this.ySpeed > 0.5) {
      this.ySpeed /= 1.05;
    }

    // If the chute has been cut, then we need to increase ourselves to TERMINAL
    // VELOCITY.
    if (this.cutTriggered === true && this.ySpeed < 12) {
      this.ySpeed *= 1.08;
    }

    // If the parachute is not deployed yet, but we're on the screen, then
    // deploy now.
    if (this.deployed === false && this.cutRequested === false && this.y >= 0) {
      this.deploy_chute(deltaT);
    }

    // Get the relative position of the emote in the dropper so we can use it's
    // bounding as the collision bounds; this is an alias to make the code
    // below look nicer..
    const emoteX = this.x + this.emote.x;
    const emoteY = this.y + this.emote.y;

    // Bounce on the left and right viewport edges.
    if ((emoteX <= 0) || (emoteX >= this.container.clientWidth - this.emote.width))
      this.xSpeed = -1 * this.xSpeed;

    // When we touch down, indicate that we've landed so that we stop updating,
    if (emoteY >= this.container.clientHeight - this.emote.height - (0.25 * this.target.height)) {
      this.land(deltaT);

      // In order to be considered a winner, the emote has to land so that at
      // least one pixel of it's bounding box is touching on the left or the
      // right side of the bounding box of the target.
      if (emoteX > this.target.x - this.emote.width && emoteX < this.target.x + this.target.width) {
        this.handleWin();
      } else {
        this.handleLose();

        // We're not on the target, and we also didn't win. Trigger the back end
        // to tell them the status.
        this.transmitDropStatus(false, false)
      }
    }

    // All moves are finalized, so reposition ourselves in the viewport now.
    this.reposition();

    // Give the parachute and emote a chance to update if they need to.
    if (this.parachute !== null) this.parachute.update(deltaT);
    if (this.emote !== null) this.emote.update(deltaT);
  }

  /* This is invoked whenever a dropper finishes a drop (success or fail),
   * including when a drop that was previously considered to be a win is now
   * considered to be a loss because someone else landed closer to the center
   * of the target.
   *
   * onTarget:  Did the dropper land on the target? false if the initial drop
   *            didn't hit the target, and true otherwise
   * winner:    Is this drop considered to be a winner? true when a drop hits
   *            the target, false for a dropper that was on the target but got
   *            kicked off.
   * voluntary: Did the dropper get kicked off the target voluntarily? This is
   *            only true when the user abdicates.
   *
   * NOTE: It is possible for this to be invoked "true, true" followed by
   *       "true, false" in close succession, which is an indication that the
   *       dropper landed on the target, but was not the high score.
   * */
  transmitDropStatus(onTarget, winner, voluntary) {
    // this.name is the name of the user that dropped this dropper
    // this.dropScore is the score of this dropper (if landed on the target).
  }

  /* Mark the dropper as a winner. This sets up the appropriate internal state
   * and also updates our display accordingly for being a winner based on the
   * score we actually got. */
  handleWin() {
    this.winner = true;
    this.play(this.sndWinner, Config.WinnerVolume);

    // Calculate our score
    this.dropScore = this.score();

    // Display the score in the text box above our name. This might get redacted
    // away if there's another winner with a higher score.
    this.scoreBox.element.innerText = this.dropScore.toFixed(3);
    this.scoreBox.element.classList.toggle('hide');
    this.scoreBox.element.classList.toggle('fadeIn');

    // Trigger a notification that this dropper landed on the target and is thus
    // a winner; once the target knows about this item, if there is another
    // winner already with a higher score, this may be a short lived result.
    this.transmitDropStatus(true, true);

    // Tell the target that we landed on that we've landed on it, so that it's
    // logic will fire.
    this.target.addDropper(this);
  }

  /* Mark the dropper as a loser. This sets up the appropriate internal state
   * and also visually changes our appearance. */
  handleLose() {
    this.winner = false;
    this.element.classList.toggle('loser');
    this.nameBox.element.classList.toggle('ghost');
  }

  /* Calculate the score for a particular dropper.
   *
   * This assumes that the dropper has landed at the bottom of the screen and
   * that its position has been calculated such that we know that it's
   * definitely a winner. */
  score() {
    // Calculate the positions that are the center of the target and the center
    // of the emote; note that the emote is relative to our bounding box.
    const midTarget = this.target.x + (this.target.width / 2);
    const midEmote = this.x + this.emote.x + (this.emote.width / 2);

    // The maximum possible distance apart that the emote and the center of the
    // target can be if this is a winner.
    const maxDist = (this.target.width / 2) + (this.emote.width / 2);

    // Calculate the score as a percentage of how far apart the two values are
    // from each other. This gives a score of 100 at the center an almost zero
    // score on the edges.
    return 100 - ((Math.abs(midTarget - midEmote) / maxDist) * 100.0);
  }
}


/* A simple class for keeping a pool of previously created entity objects so
 * that they can be reused in the future. */
class EntityPool {
  static pool = [];

  /* Add the given entity to the entity pool. */
  static add(entity) {
    EntityPool.pool.push(entity);
  }

  /* Get an entity out of the pool; this may return undefined if there are no
   * items in the pool. */
  static get() {
    return EntityPool.pool.pop();
  }
}


/* This class drives the entire simulation, and is responsible for the render
 * loop running and moving all of the droppers. */
class DropEngine {
  nameSuffix = 1;

  /* Set up the overall state for the engine. This does not kick off the render
   * loop though; do to that, you must invoke it manually one time. */
  constructor() {
    // Get the elements from the DOM that we're going to be interacting with.
    this.viewport = document.getElementById('viewport');
    this.button = document.getElementById('button');

    // The list of sprites that we're updating.
    this.sprites = [];

    // For tracking the frame timing and frame rate. This is also used to
    // provide a time delta in update calls to sprites that need time
    // information.
    this.thisFrameTime = new Date().getTime();
    this.lastFrameTime = 0;
    this.elapsedTime = 0;
    this.fps = 0;

    // As long as this is true, the animation loop will keep running. At initial
    // load time, the loop is not running. It starts when the first drop
    // happens.
    //
    // While the loop is running, the idleTime is the amount of time the game
    // has spent rendering frames with no more than two or fewer entities in the
    // sprite list (the target and possibly a winner). When it hits a predefined
    // state, the render loop stops.
    this.running = false;
    this.idleTime = 0;

    // Create the sprite sheets for our test emotes and the parachute sprites.
    this.emoteSheet = new SpriteSheet('emote', Config.EmoteSpriteInfo, 56, 56);
    this.parachuteSheet = new SpriteSheet('parachute', Config.ParachuteSpriteInfo, 120, 120);
    this.targetSheet = new SpriteSheet('target', Config.TargetSpriteInfo, 390, 110);

    // Create the target that the droppers are aiming for.
    this.target = new Target(this.viewport, this.targetSheet);
    this.positionTarget();

    // The engine isn't running at launch, so make sure that the target is
    // hiding.
    this.target.element.classList.add('ghost');

    this.sprites.push(this.target);
  }

  /* Every time this is called, the target is randomly positioned on the screen,
   * near the bottom at a set height and within a range of the whole screen
   * constrained by the size of the emotes used in the dropper. */
  positionTarget() {
    this.target.setPos(
      Utils.randomIntInRange(
        this.emoteSheet.spriteW * 1.5,
        this.viewport.clientWidth - this.targetSheet.spriteW - (this.emoteSheet.spriteW * 1.5)
      ),
      this.viewport.clientHeight - (0.75 * this.targetSheet.spriteH));
  }

  /* Starts the render loop running, including setting up or reinitializing all
   * the variables that are used to track the loop.
   *
   * This kicks off the loop by making an initial render loop call. */
  startRenderLoop() {
    this.positionTarget();
    this.target.element.classList.remove('ghost', 'fadeOut');
    this.target.element.classList.add('fadeIn');
    this.target.setFrame(this.target.sheet.randomFrame());

    // Reset frame timings whenever the loop restarts, since the delta between
    // the last frame and this frame is used to update things, and that can
    // make the idle time expire.
    this.thisFrameTime = new Date().getTime();
    this.lastFrameTime = 0;

    this.running = true;
    this.renderLoop();
  }

  /* Stops a running render loop, doing all of the cleanup needed along with
   * setting the flag that stops the loop from re-starting itself. */
  stopRenderLoop() {
    for (let i = 0 ; i < this.target.droppers.length ; i++) {
      this.target.droppers[i].kill();
    }
    this.target.droppers = [];

    this.target.element.classList.add('ghost', 'fadeOut');
    this.target.element.classList.remove('fadeIn');
    this.running = false;
  }

  /* Bump the internal tracking number that is added to the names of droppers;
   * this is useful for testing in cases where we want more than one dropper
   * to be active at a time. */
  bump() {
    this.nameSuffix++;
  }

  /* Create and drop a parachute dropper in the viewport, using the given
   * name, or a placeholder name if one is not provided. */
  drop(name, emoteId) {
    // We're about to drop; if the render loop isn't already running, then we
    // should start it now.
    if (this.running === false) {
      this.startRenderLoop();
    }

    name = name || 'SampleNickGoesHere' + this.nameSuffix;

    // if (Utils.randomFloatInRange(0, 1) >= 0.5) {
    //   emoteId = '306898610';
    // }

    // Scan existing droppers to see if there's one with this name. If there is,
    // then this user is not allowed to drop again, so leave.
    for (let i = 0 ; i < this.sprites.length ; i++) {
      if (this.sprites[i].name === name) {
        return;
      }
    }

    // Try to get a dropper out of the pool.
    let dropper = EntityPool.get();
    if (dropper === undefined) {
      dropper = new ParachuteDropper(this.viewport, 'dropper', 0, 0, this.target, this.parachuteSheet, this.emoteSheet, name);
    } else {
      dropper.dead = false;
      dropper.randomize(name);
      dropper.display();
    }

    if (emoteId !== undefined) {
      // For an emote ID, we need to make sure that the standard emote class is
      // gone and that the custom twitch one is applied.
      dropper.emote.element.classList.remove('emote');
      dropper.emote.element.classList.add('twitch-emote');

      // Apply a background image that will load the custom twitch emote.
      dropper.emote.element.style.backgroundImage = `url(https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/2.0)`

      // Make sure that frame 0 is applied, since this might have previously
      // been a standard emote that wasn't on frame 0 and the background
      // position might be wrong.
      dropper.emote.setFrame(0)
    } else {
      // For no emote ID, ensure that we have the appropriate standard emote
      // class applied. We also need to select a frame.
      dropper.emote.element.classList.add('emote');
      dropper.emote.element.classList.remove('twitch-emote');

      // Remove any custom background we may have applied and ensure that we get
      // a random emote picked.
      dropper.emote.element.style.backgroundImage = null;
      dropper.emote.setFrame(dropper.emote.sheet.randomFrame());
    }

    // 5% of the time, play the wilhelm scream sound as we're dropping into the
    // screen. The sound actually starts before the drop begins.
    if (Utils.randomFloatInRange(0, 1) >= 0.95) {
      dropper.play(dropper.sndScream);
    }

    // Add this dropper to the global sprite list so that it will animate.
    this.sprites.push(dropper);
  }

  /* If there is currently an actively dropping dropper with the provided name,
   * cut it's parachute so that it drops quicker. This adds a small amount of
   * skill to the game. */
  cut(name) {
    if (Config.CutAllowed === false) {
      return;
    }

    // A cut can't happen if the render loop isn't running, because in that case
    // there aren't any droppers.
    if (this.running === false) {
      return;
    }

    name = name || 'SampleNickGoesHere' + this.nameSuffix;

    // Scan existing droppers to see if there's one with this name. If there is,
    // then cut it's chute.
    for (let i = 0 ; i < this.sprites.length ; i++) {
      if (this.sprites[i].name === name) {
        return this.sprites[i].cut_chute();
      }
    }
  }

  /* If there is currently a dropper with the name provided sitting on the
   * target, then this will make that dropper abdicate their throne (i.e. they
   * get marked as a Loser), allowing them to play again. */
  abdicate(name) {
    if (Config.AbdicateAllowed === false) {
      return;
    }

    this.target.abdicateDropper(name || 'SampleNickGoesHere' + this.nameSuffix);
  }

  /* Render this frame; this will keep calling itself in a loop as long as the
   * animation should be running. */
  renderLoop() {
    this.lastFrameTime = this.thisFrameTime;
    this.thisFrameTime = new Date().getTime();
    const deltaT = this.thisFrameTime - this.lastFrameTime;
    this.elapsedTime += deltaT;
    this.fps = 1000 / deltaT;

    if (this.elapsedTime >= 1000) {
      this.elapsedTime -= 1000;
    }

    // If we have been idle for an appropriate period of time, then stop the
    // render loop from running; this also needs to kill all items that are
    // sitting on the target.
    if (Config.IdleTime !== 0 && this.idleTime >= Config.IdleTime) {
      this.stopRenderLoop();
    }

    // Trigger an update on all sprites and sprite containers added to the main
    // sprite list. Any containers are responsible for updating their children,
    // if they're not also in this list.
    for (let i = this.sprites.length - 1; i >= 0 ; i--) {
      this.sprites[i].update(deltaT);
      if (this.sprites[i].dead) {
        this.sprites.splice(i, 1);
      }
    }

    // The game is considered to be idle when there are no active droppers,
    // where an active dropper is any dropper currently falling OR any dropper
    // sitting on the target waiting for it's death time (i.e. there is some
    // other dropper that has a higher score).
    //
    // For that reason, we're idle if the sprite count is 1 (target only) or
    // 2 (target, and the number of items sitting on the target are 0).
    this.idleTime = (this.sprites.length == 1 || (this.sprites.length == 2 && this.target.droppers.length == 1))
        ? this.idleTime + deltaT
        : 0;

    // Schedule another call for the next frame as long as we're still running.
    if (this.running === true) {
      window.requestAnimationFrame(() => this.renderLoop());
    } else {
      this.idleTime = 0;
    }
  }
}

/* Initialize the drop engine. */
const engine = new DropEngine();
if (Config.IdleTime === 0) {
  engine.startRenderLoop();
}
