class Config {
    // The time in milliseconds that the game will run in an idle state before
    // deciding that it's time to hide itself. If there are no active drops
    // after this amount of time expires, the game will suspend itself and
    // restart at the next drop.
    //
    // Setting this to 0 disables this feature, causing the game to run
    // continuously.
    static IdleTime = 1000 * 60 * 1.5;

    // If true, the user is allowed to trigger a cut of their parachute while
    // they are currently dropping. When cutting is turned on, the CutRange
    // specifies an array of values that indicates what interval of time (in
    // milliseconds) the drop should happen after it's triggered. This can be
    // null to have cuts be instant.
    static CutAllowed = true;
    static CutRange = [750, 1500];

    // When cuts are enabled, this is the Y position below which the cut cannot
    // be done any longer. Set this value to the height of the overlay to allow
    // a cut anywhere.
    static CutLockout = 1080;

    // If true, the user is allowed to abdicate their position on the board if
    // they're a winner. When this is set to false, the only way for the user to
    // get ejected from the board is if they get Highlandered or if the idle
    // time is reached (or the page otherwise reloads).
    static AbdicateAllowed = true;

    ////////////////////////////////////////////////////////////////////////////
    // IMAGE CONFIGURATION                                                    //
    ////////////////////////////////////////////////////////////////////////////
    //
    // The settings here tell the code the dimensions and sprite counts of the
    // images being used for the parachute, target and stock emote images.
    //
    // Each setting here configures:
    //     1. The dimensions of the overall image that holds the sprites
    //     2. The number of sprites contained in that sprite sheet
    //
    // The sprites should be packed left to right into the sheet, with full
    // rows of sprites filling the width of the image. If the number of sprites
    // is not an even multiple of the row size, the last row should be missing
    // sprites on it's right hand side.
    //
    // NOTE: The actual images themselves are specified in the CSS.
    ////////////////////////////////////////////////////////////////////////////
    static EmoteSpriteInfo = [280, 224, 20];
    static ParachuteSpriteInfo = [360, 360, 9];
    static TargetSpriteInfo = [390, 110, 1];


    ////////////////////////////////////////////////////////////////////////////
    // SOUND CONFIGURATION                                                    //
    ////////////////////////////////////////////////////////////////////////////
    //
    // All settings here are for controlling the sounds played when various
    // events happen in the game. The configured items are:
    //    1. The sound file to play
    //    2. A random playback rate range; set to null for normal playback
    //    3. Whether pitch is preserved; ignored if playback rate is null
    //    4. Volume level to play back, a range from 0.0 to 1.0.
    ////////////////////////////////////////////////////////////////////////////
    static ParachuteSound = "resources/sounds/parachute.ogg";
    static ParachutePlayback = [0.5, 2];
    static ParachutePitchPreserve = false;
    static ParachuteVolume = 1.0;

    // The sound that plays when we cut the chute and start a free fall drop.
    static SnipSound = 'resources/sounds/snip.ogg';
    static SnipPlayback = [0.5, 2];
    static SnipPitchPreserve = false;
    static SnipVolume = 1.0;

    // The sound that plays when someone requests to cut their chute, but their
    // dropper is below the threshold and they're not allowed to do so.
    static BuzzSound = 'resources/sounds/buzzer.ogg';
    static BuzzPlayback = [0.5, 2];
    static BuzzPitchPreserve = false;
    static BuzzVolume = 1.0;

    // The sound that plays when we eventually land. This is currently random
    // selected, but should probably be based on a selected terrain. There could
    // also be a distinct sound played for not landing on the target at all.
    static LandSound = 'resources/sounds/snow.ogg';
    static LandPlayback = [0.5, 2];
    static LandPitchPreserve = false;
    static LandVolume = 1.0;

    // The sound that plays when this dropper actually lands on the target.
    static WinnerSound = "resources/sounds/whoopee.ogg";
    static WinnerPlayback = [0.75, 2];
    static WinnerPitchPreserve = false;
    static WinnerVolume = 0.5;

    // A wilhelm scream to be played randomly (and infrequently)
    static ScreamSound = "resources/sounds/wilhelm.ogg";
    static ScreamPlayback = [0.75, 2.0];
    static ScreamPitchPreserve = false;
    static ScreamVolume = 1.0;
}