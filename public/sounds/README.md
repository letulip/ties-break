# Match viewer sound effects

Drop these seven files directly in this folder (`public/sounds/`) — no subfolders, no
manifest edit required. `src/audio/sfx.ts` maps each key straight to `<key>.mp3` here:

| file          | played when                                   |
|---------------|------------------------------------------------|
| `hit.mp3`     | a shot's flight starts (racket contact)         |
| `bounce.mp3`  | a shot's flight ends (ball lands)               |
| `point.mp3`   | a point concludes                               |
| `game.mp3`    | a game concludes                                |
| `set.mp3`     | a set concludes                                 |
| `win.mp3`     | the match concludes                             |
| `click.mp3`   | reserved — not wired to any UI event yet         |

Notes for whoever adds the files:

- Any file you don't provide yet is simply silent — `sfx.ts` probes for existence before
  ever trying to play a key, remembers a miss, and never retries or logs it. You can add
  the seven files one at a time in any order; nothing else needs to change.
- Keep them short (well under a second for `hit`/`bounce`/`click`; a couple of seconds is
  fine for `set`/`win`) and normalize loudness — playback volume is fixed at 0.5 in code,
  not per-file.
- `.mp3` only (the code hardcodes the extension). If you need another format, update the
  URL template in `src/audio/sfx.ts`.
