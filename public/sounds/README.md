# Match viewer sound effects

These recordings are the owner's own cuts — normalized short clips he recorded and
trimmed himself (not stock/library audio). Drop replacements directly in this folder
(`public/sounds/`) — no subfolders, no manifest edit required beyond `src/audio/sfx.ts`,
which maps each key to its file(s) below.

| key             | file(s)                                                          | played when                                                                 |
|-----------------|-------------------------------------------------------------------|------------------------------------------------------------------------------|
| `hit`           | `hit-1.mp3` … `hit-9.mp3` (random variant each shot)              | a shot's flight starts (racket contact)                                     |
| `out`           | `out.mp3`                                                          | a shot's flight ends and the result is out/net                             |
| `ooh`           | `ooh.mp3`                                                          | a point ends on a converted break point, or a long rally (≥8 shots) winner |
| `oohApplause`   | `ooh-applause.mp3`                                                 | a set ends and was decided by a tiebreak (7-6/6-7)                          |
| `applauseShort` | `applause-short-1.mp3`, `applause-short-2.mp3` (random variant)    | a game ends; a non-tiebreak set ends; a non-final match ends                |
| `applauseFinal` | `applause-final.mp3`                                               | the tournament final's match ends; the champion finale screen (if the final wasn't watched) |
| `takeYourSeats` | `take-your-seats.mp3`                                              | the very first point-start of a playback run (fresh play, restart, Watch again) |
| `click.mp3`     | `click.mp3`                                                        | a viewer control button is pressed (mode/speed/Play/Restart/Watch again)   |

Notes:

- Any file you don't provide yet is simply silent — `sfx.ts` probes for existence before
  ever trying to play a file, remembers a miss, and never retries or logs it. You can add
  files one at a time in any order; nothing else needs to change.
- A key with multiple files (`hit`, `applauseShort`) picks one uniformly at random on
  each play — keep the variants close in feel/loudness so any one of them reads the same
  in context.
- Keep clips short (well under a second for `hit`/`out`/`click`; a couple of seconds is
  fine for `ooh`/`oohApplause`/`applauseShort`/`applauseFinal`/`takeYourSeats`) and
  normalize loudness — playback volume is fixed in code (0.5 by default; `click` and
  `takeYourSeats` play quieter), not per-file.
- `.mp3` only (the code hardcodes the extension). If you need another format, update the
  URL template in `src/audio/sfx.ts`.
