class Config {
    // The time in milliseconds that the game will run idly before deciding
    // that it's time to hide itself. If there are no active drops after this
    // amount of time expires, the game will suspend itself and restart at the
    // next drop.
    //
    // Setting this to 0 disables this feature, causing the game to run
    // continuously.
    static IdleTime = 1000 * 60 * 1.5;

    // If true, the user is allowed to trigger a cut of their parachute, if they
    // are currently dropping. When cutting is turned on, the CutRange specifies
    // an array of values that indicates what interval of time the drop should
    // happen after it's triggered. This can be null to have cuts be instant.
    static CutAllowed = true;
    static CutRange = [750, 1500];

    // When cuts are enabled, this is the Y position below which the cut cannot
    // be done any longer. Set this value to the height of the overlay to allow
    // a cut anywhere.
    static CutLockout = 1080;
}