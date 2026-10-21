/**
 * GameConfig: persistent settings + best scores (localStorage, failure-safe).
 */
class GameConfig {
  // test.html keeps its own save so testing never touches real players' scores
  static STORAGE_KEY = window.PUN_TEST_MODE ? 'pun_intended_config_test' : 'pun_intended_config_v2';

  static DEFAULTS = {
    gameMode: 'tiles', // 'tiles' | 'type' | 'mcq'
    roundLength: 10, // fixed: cards per round (10 | 20 | 'all' supported - change ROUND_LENGTH)
    seen: [], // card ids already dealt in the current rotation
    soundEnabled: true, // sound effects
    sfxVolume: 0.8,
    musicEnabled: true,
    // Accessibility
    reduceMotion: false, // no shake/flash, calmer idle animations
    relaxedMode: false, // no speed timer
    colorAssist: false, // colour-blind friendly feedback + ✓/✗ marks
    // First-time tutorial per mode
    tutorialDone: { tiles: false, type: false, mcq: false },
    best: {}, // { 'tiles_10': 1234, ... }
  };

  static state = null;

  static MODES = {
    tiles: 'Letter Tiles',
    type: 'Keyboard',
    mcq: 'Quick Quiz',
  };

  static ROUND_LENGTHS = [10, 20, 'all'];
  /** Cards per round. There is no in-game picker; change it here (10, 20 or 'all'). */
  static ROUND_LENGTH = 10;

  static modeLabel(mode = GameConfig.get('gameMode')) {
    return GameConfig.MODES[mode] || mode;
  }

  static init() {
    GameConfig.state = JSON.parse(JSON.stringify(GameConfig.DEFAULTS));
    try {
      const saved = localStorage.getItem(GameConfig.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        GameConfig.state = {
          ...GameConfig.state,
          ...parsed,
          best: { ...(parsed.best || {}) },
          tutorialDone: { ...GameConfig.DEFAULTS.tutorialDone, ...(parsed.tutorialDone || {}) },
        };
        if (!GameConfig.MODES[GameConfig.state.gameMode]) GameConfig.state.gameMode = 'tiles';
        if (!Array.isArray(GameConfig.state.seen)) GameConfig.state.seen = [];
      }
    } catch (e) {
      console.warn('Unable to load config', e);
    }
    GameConfig.state.roundLength = GameConfig.ROUND_LENGTH;
    delete GameConfig.state.orientation; // the game always follows the device (auto)
  }

  static save() {
    try {
      localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(GameConfig.state));
    } catch (e) {
      console.warn('Unable to save config', e);
    }
  }

  static get(key) {
    return GameConfig.state[key];
  }

  static set(key, value) {
    GameConfig.state[key] = value;
    GameConfig.save();
  }

  static isTutorialDone(mode = GameConfig.get('gameMode')) {
    return !!GameConfig.state.tutorialDone[mode];
  }

  static setTutorialDone(mode, done = true) {
    GameConfig.state.tutorialDone[mode] = done;
    GameConfig.save();
  }

  static bestKey(mode, length) {
    return `${mode}_${length}`;
  }

  static getBest(mode = GameConfig.get('gameMode'), length = GameConfig.get('roundLength')) {
    return GameConfig.state.best[GameConfig.bestKey(mode, length)] || 0;
  }

  /** Stores the score if it beats the current best. Returns true on a new best. */
  static submitScore(mode, length, score) {
    const key = GameConfig.bestKey(mode, length);
    const prev = GameConfig.state.best[key] || 0;
    if (score > prev) {
      GameConfig.state.best[key] = score;
      GameConfig.save();
      return true;
    }
    return false;
  }

  /** Number of cards in a round for a length setting (10, 20 or 'all'). */
  static roundCount(length = GameConfig.get('roundLength')) {
    return length === 'all' ? CARDS_DATA.length : Math.min(length, CARDS_DATA.length);
  }

  static roundLabel(length = GameConfig.get('roundLength')) {
    return length === 'all' ? `all ${CARDS_DATA.length} cards` : `${length} cards`;
  }

  /**
   * Draws a round, favouring cards the player hasn't been dealt yet, so the
   * whole bank rotates through before anything repeats. Persisted across visits.
   */
  static drawDeck(count) {
    const valid = new Set(CARDS_DATA.map((c) => c.id));
    const seen = new Set((GameConfig.get('seen') || []).filter((id) => valid.has(id)));
    const unseen = Utils.shuffle(CARDS_DATA.filter((c) => !seen.has(c.id)));
    let deck = unseen.slice(0, count);
    let nextSeen;
    if (deck.length < count) {
      // Rotation finished mid-round: top up with other cards and start a new rotation
      const used = new Set(deck.map((c) => c.id));
      deck = deck.concat(Utils.shuffle(CARDS_DATA.filter((c) => !used.has(c.id))).slice(0, count - deck.length));
      nextSeen = deck.map((c) => c.id);
    } else {
      nextSeen = [...seen, ...deck.map((c) => c.id)];
    }
    if (nextSeen.length >= CARDS_DATA.length) nextSeen = [];
    GameConfig.set('seen', nextSeen);
    return Utils.shuffle(deck);
  }

  /** The game always follows the device/window shape (auto orientation). */
  static resolveOrientation() {
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
  }

  static getDimensions() {
    return GameConfig.resolveOrientation() === 'portrait'
      ? { width: 1080, height: 1920 }
      : { width: 1920, height: 1080 };
  }
}

GameConfig.init();
