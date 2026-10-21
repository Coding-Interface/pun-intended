/**
 * Utils: small stateless helpers.
 */
class Utils {
  /** Fisher-Yates shuffle, returns a new array. */
  static shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  static pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static lettersOnly(str) {
    return str.replace(/[^A-Z]/gi, '').toUpperCase();
  }

  static formatNumber(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  /** False when the player asked for reduced motion. */
  static motionOK() {
    return !GameConfig.get('reduceMotion');
  }

  static isLandscape(scene) {
    return scene.scale.width > scene.scale.height;
  }
}
