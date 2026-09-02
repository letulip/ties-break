// THE TWO AUDIO SWITCHES' NAMES, IN ONE PLACE – the same move `composables/identityCopy.ts` made
// for the wizard's three fields, and for the same reason.
//
// ⚠⚠ THESE ARE NOT NEW STRINGS AND NOT ONE CHARACTER OF THEM CHANGED. Both have shipped in More's
// Sound section since round 4 / round 6; `tests/component/a11y-sweep.test.ts` mounts that screen and
// pins the switches' accessible names as `Sound effects` and `Music`, and it still does. What moved
// is WHERE the literal is written, so that a second surface can carry the same control without a
// second copy of its label – CLAUDE.md invariant 4: «a label is the owner's», and a label declared
// twice is a label that can drift in one copy.
//
// ⭐ THE SECOND SURFACE, 02.09: «вынести выключение звука (или музыки) отдельной пиктограммой в
// правый верхний угол». The childhood prologue is a full-screen takeover with no tab bar, so More –
// and with it every audio switch the game has – is unreachable from the first ten screens a new
// player ever sees, which is exactly where the theme loop starts (SplashScreen calls `start()` on
// the tap that gets you in). `MuteButton.vue` is that icon, and it names itself out of this table
// and reads the flag More's own switch reads. No second preference and no second word for it.
//
// ⚠ AND THERE IS NO THIRD THING HERE. This module is names only: the STATE lives in `audio/sfx.ts`
// and `audio/music.ts`, each on its own localStorage key, and both surfaces call those directly.

export const AUDIO_COPY = {
  /** More's `Sound effects` row (round 4 item 5), on the `tb-muted` key. */
  sfx: 'Sound effects',
  /** More's `Music` row (round-6 item 1), on the `tb-music-muted` key. */
  music: 'Music',
} as const
