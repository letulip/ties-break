# Match viewer sound effects

Drop these ten files directly in this folder (`public/sounds/`) — no subfolders, no
manifest edit required. `src/audio/sfx.ts` maps each key straight to `<key>.mp3` here:

| file          | played when                                                        |
|---------------|---------------------------------------------------------------------|
| `hit.mp3`     | a shot's flight starts (racket contact)                             |
| `grunt.mp3`   | layers on top of `hit` on every 3rd shot of a rally (both players)   |
| `bounce.mp3`  | a shot's flight ends and the ball is in (or a winner)                |
| `out.mp3`     | a shot's flight ends and the result is out/net (replaces `bounce`)   |
| `point.mp3`   | a point concludes                                                    |
| `gasp.mp3`    | a point concludes that converts a break point (replaces `point`)    |
| `game.mp3`    | a game concludes                                                     |
| `set.mp3`     | a set concludes                                                      |
| `win.mp3`     | the match concludes                                                  |
| `click.mp3`   | a viewer control button is pressed (mode/speed/Play/Restart/Watch again) |

Provenance: these clips are short fragments cut from freesound_community recordings
(Pixabay Content License — commercial use OK, no attribution required). The long source
recordings are intentionally NOT checked into this repo, only the cut fragments above.

Notes for whoever adds the files:

- Any file you don't provide yet is simply silent — `sfx.ts` probes for existence before
  ever trying to play a key, remembers a miss, and never retries or logs it. You can add
  the files one at a time in any order; nothing else needs to change.
- Keep them short (well under a second for `hit`/`grunt`/`bounce`/`out`/`click`; a couple
  of seconds is fine for `set`/`win`/`gasp`) and normalize loudness — playback volume is
  fixed at 0.5 in code, not per-file.
- `.mp3` only (the code hardcodes the extension). If you need another format, update the
  URL template in `src/audio/sfx.ts`.
