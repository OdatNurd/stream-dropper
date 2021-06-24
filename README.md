Stream Dropper
==============

This is a simple re-implementation of [Parachute Drop](https://www.pixelplush.dev/twitch.html?type=parachute)
by [PixelPlush](https://www.pixelplush.dev/index.html) that was developed live
over a series of streams on my [Twitch Channel](https://twitch.tv/odatnurd).

The intention is to be an open, freely available learning example of how a
simple web based game is put together. As such there is potential for
improvement in the implementation, with the current focus being more on being
as understandable and easy to follow as possible.

For this reason, the project is pure JavaScript/CSS/HTML with no external
frameworks used whatsoever. As distributed here, loading the page up in a  web
browser (tested only in Chrome as OBS uses Chromium as its browser source) will
run the game directly for testing/tweaking/experimenting with it.

With a small amount of extra work, you can also integrate it into your own
Twitch channel, though this requires you to provide the communications layer
between the page running in OBS and the bot itself. More information on this
is available below.


-------------------------------------------------------------------------------


## Premise ##

The premise of the game revolves around a "dropper", which is an avatar/twitch
emote that will parachute it from the top of the screen, deploying it's
parachute and slowly descending, attempting to land on the target available at
the bottom of the screen. Points are scored by landing on the target, with any
existing winner being displaced by anyone that lands closer to the center than
they did.

In the original implementation of the game, the drop is purely random, as is the
scoring. In this implementation, there is an option to "cut" your parachute,
which will cause you to start free falling in an attempt to land on the target.
This adds somewhat of a skill based element to the game as you are required to
judge your relative delay in order to trigger a successful drop.

The game will start out in an idle state, and then spawn in a target when the
first drop attempt is made. Once the game is running, if there are no active
drops within a set period of time (which is configurable), the game will put
itself back into the idle state.


-------------------------------------------------------------------------------


## Implementation ##

The game is implemented as pure JavaScript/CSS/HTML with no frameworks used at
all, and works on the idea of `Sprites`, `Sprite Sheets` and `DOM Sprites`.

In the context of this, a `DOM Sprite` is a simple `<div>` element that is
given a specific class and position, which is animated to move around the
screen (possible with CSS animations applied to give it extra motion like a
sway while dropping). This is in contrast to using a `<canvas>` element, for
example.

A `Sprite Sheet` is an image that contains one or more `Sprite` images in it;
the engine needs to be told the dimensions of the image and the dimensions of
the sprites contained within (56x56 for emotes, 120x120 for parachutes), and
it uses this information to be able to apply a specific background image and
image offset to make a `<div>` appear to contain a specific, single image.

A `Sprite` is a single animated element, which in the context of the game is
a Parachute, an Emote, or the combination of the two together (a "Dropper"),
which allows a single simulation to move and apply animations to both a Sprite
as well as it's attached Parachute.


-------------------------------------------------------------------------------


## Local Testing ##

The page can be loaded directly into a browser, where the page will display a
`Drop` button and a `Cut` button, where the first will initiate a drop and the
second will initiate a cut of the current droppers parachute, if one is
dropping.

The rules of the game state that only one dropper per user is possible at any
one time, so once a drop is begin, the `Drop` button will do nothing unless the
dropper misses the target or the page is reloaded.


-------------------------------------------------------------------------------


## Assets and Configuration ##

The game comes with some predefined assets for the emotes/avatars to use as
droppers, the parachute images, the target image that the droppers are aiming
for, and various sound files for sound effects.

These can be replaced as desired with custom assets. This would be done via a
combination of modifications to `config.js` which has settings that configure
the sounds and the dimensions of the images used and (for the image resources)
changes to `style.css`, where the names of the images used for the various
sprites are attached to the classes that are used to represent the sprites.

The `config.js` file also contains some tuneable parameters that control how
the game runs and what operations are possible.


-------------------------------------------------------------------------------


## Using this in a stream ##

The game can be easily added to a stream by loading the `index.html` page as a
browser source (modifying it to remove the buttons that are used for testing)
and writing some simple glue code to tie the overlay with the bot.


### Sending drop commands ###

The top level code in `code.js` creates an instance of the `DropEngine` class
named `engine`; this contains two methods that you can tie into your bot by
having the bot transmit some sort of message or command to the web page. How
you do this depends on the bot you're using and what sort of integrations it
has, though in all likelyhood this would require some amount of custom code.

```js
  // Start a drop for the user with the given username (you would generally
  // gather this from the user that invokes a chat command). Optionally, you
  // can also provide the emote ID of a twitch emote to use in place of a
  // randomly selected emote from the predefined list. The emote ID is provided
  // to chat bots as users in the chat insert them; see the instructions for
  // your chat bot to determine how to get access to the used emote ID.
  //
  // This will not allow a drop to occur if there is already an active dropper
  // for the name provided, which includes if the dropper is currently sitting
  // on the target as a winner.
  engine.drop(name, emoteId) {
  }
````


```js
  // If the game is configured to allow cutting of parachutes, calling this will
  // attempt to cut the chute of the dropper with the provided name; nothing
  // happens if cutting is not allowed or if there is no dropper by this name.
  //
  // In operation, the cut will cause parachute on the dropper to be "severed",
  // causing the dropper to fall in an uncontrolled manner.
  //
  // config.js has settings to control if this is allowed, the value of an
  // optional random delay between when the command is received and when it
  // actually happens, and a height threshold on the screen below which a cut
  // is no longer allowed.
  //
  // A sound effect is played if a cut would be attempted but cannot be carried
  // out, such as if the cut has already been performed or if the dropper is
  // below the height threshold.
  engine.cut(name) {
  }
```

```js
  // If the game is configured to allow it, calling this will check the target
  // for a dropper that has this name, and eject it willingly from the target.
  //
  // This allows a user that's sitting on the target to abdicate their throne
  // and willingly eject themselves from the target so that they can drop again.
  //
  // config.js has settings to control if this is allowed, so that you can
  // control whether you want it to be possible or not.
  engine.abdicate(name) {
  }
```

### Communicating drops to a chat bot ###

In addition to the above, the `ParachuteDropper` class contains a stub method
named `transmitDropStatus`. The default implementation of this is empty, but
you can add a simple implementation here to send the results of a drop back to
the bot for display in the chat, accumulation on a leader board, etc.

```js
  // This will get called whenever a dropper finishes a drop, whether the drop
  // results in a success (landing on the target) or a failure (landing
  // everywhere else). This includes the case where a dropper has previously
  // landed on the target and is now being ejected because another dropper
  // landed closer to the center.
  //
  //    - onTarget is a boolean that indicates if the dropped landed on the
  //      target or not. This will be false if the initial drop didn't hit the
  //      target, and true otherwise.
  //
  //   - winner is a boolean that indicates if this drop is considered to be
  //     a win. This will be true when any dropper hits a target and false for
  //     a dropper that was on the target previously and got kicked off by
  //     someone landing closer to the center.
  //
  //   - voluntary is a boolean that indicates if being removed from the target
  //     was a voluntary action or not. This will always be false unless the
  //     user abdicated themselves.
  //
  // It's possible for this to be invoked "true, true" (winner landed on the
  // target) immediately followed by "true, false" (landed on the target, but
  // no longer a winner) if there is already someone on the target with a
  // higher score.
  ParachuteDropper.transmitDropStatus(onTarget, winner, voluntary) {
    // this.name is the name of the user that dropped this dropper
    // this.dropScore is the score of this dropper (if landed on the target).
  }
```


-------------------------------------------------------------------------------


## License ##

The MIT License (MIT)

This license applies only to the code for this project; images and other
resource assets are explicitly excluded from this license; see LICENSE-resources
for license information on assets.

Copyright 2020 Terence Martin

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


Kenney Animal Pack (https://kenney.nl/assets/animal-pac)
    Public Domain Dedication CC0 1.0 Universal (CC0 1.0)

Parachute 2d game asset (https://www.gamedeveloperstudio.com/graphics/viewgraphic.php?item=1u5e1f3r0l0n8n2s9q)
    Game developer studio standard license

"access denied buzz" by Jacco18 (https://freesound.org/people/Jacco18/sounds/419023/)
    Public Domain Dedication CC0 1.0 Universal (CC0 1.0)

"Stepping on dry leaf" by BerduSmith (https://freesound.org/people/BerduSmith/sounds/335396/)
    Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0)

"Wing Flap (Flag FLapping) 3a" by ani_music (https://freesound.org/people/ani_music/sounds/244977/)
    Public Domain Dedication CC0 1.0 Universal (CC0 1.0)

"snip.wav" by def (https://freesound.org/people/_def/sounds/346523/)
    Attribution 3.0 Unported (CC BY 3.0)

"Snow Step 3.wav" by morganpurkis (https://freesound.org/people/morganpurkis/sounds/369779/)
    Public Domain Dedication CC0 1.0 Universal (CC0 1.0)

"Water Droplet" by Gabriel Killhour (https://freesound.org/people/gkillhour/sounds/267221/)
    Attribution 3.0 Unported (CC BY 3.0)

"whoppii.wav" by RatSalsa (https://freesound.org/people/RatSalsa/sounds/170208/)
    Public Domain Dedication CC0 1.0 Universal (CC0 1.0)

"wilhelm_scream.wav" by Syna-Max (https://freesound.org/people/Syna-Max/sounds/64940/)
    Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0)
