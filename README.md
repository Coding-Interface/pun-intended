# Pun Intended

Phaser 3 picture-pun game. Open `index.html` through any local web server.

## Builds

| File | What it is |
|---|---|
| `index.html` | The real game. |
| `test.html` | **Test mode** – same game plus a QA panel showing the current answer, with SOLVE / WRONG / +5 HINTS / RESET DECK (shortcuts F2, F3, F4 to hide). Uses its own save slot, and ads reward instantly. |

Ship the game with `bash tools/build-release.sh`. It copies everything into `dist/` **except** `test.html`, `css/test.css`, `js/debug/` and `tools/`, and fails if any test code slips into the release.

## Rewarded ads (hints)

When a player runs out of hints, the hint (bulb) button turns into a **TV** button with a +2 badge. See `js/core/AdService.js`:

- **Google H5 Games Ads**: uncomment the snippet in `index.html` and add your `ca-pub-…` id. It's picked up automatically.
- **Other networks** (CrazyGames, Poki, your own SDK): add a branch in `AdService._showWithProvider()`.
- **No network yet**: a stand-in ad screen with a 5-second countdown is shown.

If no ad can be served, the player still gets the hints, so nobody gets stuck.

## Audio

- **Music** is a soft, slow lo-fi loop generated live by `js/core/MusicPlayer.js` (quiet by default, `DEFAULT_VOLUME`). No audio files are needed.
- **Sound effects** come from `js/core/SoundFX.js`.
- Music and sound effects each have their own on/off switch in Settings (gear button on the menu and in game).

## Settings and accessibility

The gear button opens Settings (`js/ui/SettingsPanel.js`):

| Setting | What it does |
|---|---|
| Sound effects | On/off. |
| Music | On/off. |
| Reduce motion | No screen shake, flashes, idle wobble or background animation; less confetti. |
| Relaxed mode | No speed timer (a fixed bonus instead). |
| Colour assist | Blue/orange instead of green/red, plus ✓/✗ marks: a big badge on the card after every answer, marks on tiles, quiz buttons and progress dots. Settings shows a live preview. |

The game pauses (including the speed timer) while Settings, the enlarged card or an ad is open.

## How to Play and tutorials

- The **?** button on the menu opens a 4-page How to Play guide (`js/ui/HowToPlayPanel.js`). Its play button replays the tutorial for the selected mode.
- The **first PLAY in each mode** runs a guided tutorial card (`js/ui/TutorialCoach.js`): spotlight, speech bubble and a pointing hand. It can be skipped at any time. Progress is saved in `tutorialDone`.
- Tutorial cards are set in `GameScene.TUTORIAL_CARD`.

## Orientation and round length

- The game always follows the device (auto orientation); there is no in-game switch. Rotating mid-round keeps the current layout, and the menu re-lays out when the player returns.
- Rounds are 10 cards. Change `GameConfig.ROUND_LENGTH` (10, 20 or `'all'`) to alter it.

## Interface

All buttons are icons drawn in code (`js/ui/Icons.js`, `js/ui/IconButton.js`), so there are no image files to load. Tap the card to enlarge it, and tap again (or press Esc) to close.

## Cards

The art is in `cards/`, one PNG per card, and the data is in `js/data/CardsData.js`. 5×5 sprite sheets are supported too (see the comment at the top of that file).
