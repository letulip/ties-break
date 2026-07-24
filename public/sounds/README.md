# Match viewer sound effects

These recordings are the owner's own cuts — normalized short clips he recorded and
trimmed himself (not stock/library audio). Drop replacements directly in this folder
(`public/sounds/`) — no subfolders, no manifest edit required beyond `src/audio/sfx.ts`,
which maps each key to its file(s) below.

> The looping **background music** track (`public/music/theme.mp3`) is a separate,
> stock-licensed asset — "Clean Sound" from Pixabay under the Pixabay Content License.
> Its provenance lives in `public/music/README.md`; everything in *this* folder is the
> owner's own recordings.

| key             | file(s)                                                          | played when                                                                 |
|-----------------|-------------------------------------------------------------------|------------------------------------------------------------------------------|
| `hit`           | `hit-1.mp3` … `hit-9.mp3` (random variant each shot)              | a shot's flight starts (racket contact) – at every playback speed          |
| `out`           | `out.mp3`                                                          | a shot's flight ends and the result is out/net – ×1 only, throttled to every 3rd occurrence |
| `ooh`           | `ooh.mp3`                                                          | a point ends on a converted break point, or a long rally (≥8 shots) winner – ×1 only |
| `oohApplause`   | `ooh-applause.mp3`                                                 | a set ends and was decided by a tiebreak (7-6/6-7) – ×1 only (×2 uses `applauseShort` instead; ×4 is silent here) |
| `applauseShort` | `applause-short-1.mp3` … `applause-short-5.mp3` (random variant) | a game ends; a non-tiebreak set ends; a non-final match ends (×1); at ×2 also game-end/set-end (incl. tiebreak sets) and match-end (incl. the final); at ×4 only match-end |
| `applauseFinal` | `applause-final-1.mp3`, `applause-final-2.mp3`, `applause-final-3.mp3` (random variant) | the tournament final's match ends; the champion finale screen (if the final wasn't watched) – ×1 only (×2/×4 use `applauseShort` at match-end instead) |
| `takeYourSeats` | `take-your-seats.mp3`                                              | a pre-match beat: on a fresh run (play, restart, Watch again) at ×1 or ×2, it plays BEFORE the clock starts – court visible, static, for ~1.5s – then the timeline begins; silent at ×4 (clock starts immediately, no hold) |
| `click`         | `click.mp3`                                                        | the hit-like tick: tab-bar navigation, and "Watch match"/"Watch"/"Watch again" buttons (marked `.sfx-watch` at their call sites) |
| `clickSoft`     | `click-soft.mp3`                                                   | the plain tick for every other button the app-wide click handler covers, plus the match viewer's mode/speed controls |

The match-viewer sound matrix (`hit`/`out`/`ooh`/`oohApplause`/`applauseShort`/`applauseFinal`/
`takeYourSeats`) is gated by the current playback speed through the single `gatedSfx()` function
in `src/components/MatchViewer.vue` – see the comment there for the full ×1/×2/×4 table. Speed
only thins the match soundscape; it has no effect on the app-wide `click`/`clickSoft` UI ticks.

Notes:

- Any file you don't provide yet is simply silent — `sfx.ts` probes for existence before
  ever trying to play a file, remembers a miss, and never retries or logs it. You can add
  files one at a time in any order; nothing else needs to change.
- A key with multiple files (`hit`, `applauseShort`) picks one uniformly at random on
  each play — keep the variants close in feel/loudness so any one of them reads the same
  in context.
- Keep clips short (well under a second for `hit`/`out`/`click`/`clickSoft`; a couple of
  seconds is fine for `ooh`/`oohApplause`/`applauseShort`/`applauseFinal`/`takeYourSeats`)
  and normalize loudness — playback volume is fixed in code, not per-file. The whole SFX bus
  is scaled by a single master knob `SFX_MASTER` (0.40) so match sound sits under the 0.30
  background music; per-key balance is set by the `KEY_VOICE` map (effective = voice × master):
  `hit` 0.26, `out`/`ooh`/`oohApplause`/`applauseShort` 0.34, `applauseFinal` 0.40,
  `takeYourSeats` 0.32, `click` 0.25, `clickSoft` 0.18. Tune `SFX_MASTER` alone to move the whole
  soundscape relative to the music.
- `.mp3` only (the code hardcodes the extension). If you need another format, update the
  URL template in `src/audio/sfx.ts`.
