/**
 * AdService: rewarded ads ("watch an ad, get hints").
 *
 * Providers (picked automatically, or force one with AdService.PROVIDER):
 *  - 'h5'   Google H5 Games Ads (AdSense for games). Enable the snippet in
 *           index.html with your ca-pub id; window.adBreak then exists.
 *  - 'mock' A stand-in ad screen with a countdown (AdOverlay) so the flow can
 *           be built and tested before an ad network is connected.
 *  - 'test' Instant reward - used automatically by test.html.
 *
 * To plug in another network (CrazyGames, Poki, GameDistribution, your own
 * PlayLearn SDK...), add a branch in _showWithProvider() that calls its
 * rewarded-ad API and invokes done(true) only when the reward is earned.
 */
class AdService {
  static PROVIDER = 'auto'; // 'auto' | 'h5' | 'mock' | 'test'
  static REWARD_HINTS = 2;
  static MOCK_SECONDS = 5;

  static get provider() {
    if (AdService.PROVIDER !== 'auto') return AdService.PROVIDER;
    if (window.PUN_TEST_MODE) return 'test';
    if (typeof window.adBreak === 'function') return 'h5';
    return 'mock';
  }

  /**
   * Shows a rewarded ad.
   * @param {Phaser.Scene} scene  scene to draw the mock ad on
   * @param {{onReward:Function, onDone:Function}} handlers
   *   onReward(hints) - only when the ad was fully watched
   *   onDone(rewarded:boolean) - always, after the ad closes
   */
  static showRewarded(scene, { onReward, onDone } = {}) {
    if (AdService.busy) return;
    AdService.busy = true;
    Music.duck(true, 0);
    const done = (rewarded) => {
      AdService.busy = false;
      Music.duck(false);
      if (rewarded && onReward) onReward(AdService.REWARD_HINTS);
      if (onDone) onDone(rewarded);
    };
    AdService._showWithProvider(scene, done);
  }

  static _showWithProvider(scene, done) {
    switch (AdService.provider) {
      case 'test':
        scene.time.delayedCall(300, () => done(true));
        break;
      case 'h5': {
        let rewarded = false;
        try {
          window.adBreak({
            type: 'reward',
            name: 'extra-hints',
            beforeReward: (showAdFn) => showAdFn(),
            adViewed: () => (rewarded = true),
            adDismissed: () => (rewarded = false),
            adBreakDone: (info) => {
              const status = info && info.breakStatus;
              // No ad could be shown (no fill, frequency cap...): don't leave the player stuck
              if (status && status !== 'viewed' && status !== 'dismissed') done(true);
              else done(rewarded);
            },
          });
        } catch (e) {
          done(true);
        }
        break;
      }
      default:
        AdService.current = new AdOverlay(scene, AdService.MOCK_SECONDS, done);
    }
  }
}

AdService.busy = false;
