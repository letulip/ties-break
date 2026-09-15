# `tools/film` – Two talented players. Two very different careers.

A 1080x1080 devlog clip: two REAL careers, side by side, both of them the shipped app reading the
owner's own export files. It is a retrospective of what those two saves record – **not** a replay
from childhood and **not** a controlled seed experiment.

```bash
# both dev servers up first (two ports = two origins = two databases)
#   .claude/launch.json -> tb-devlog-left (5843), tb-devlog-right (5844)
npx vite-node tools/film/careers-read.ts <left.tsave> <right.tsave>   # decode + recheck the table
node tools/film/record-devlog.mjs   /tmp/devlog                       # ~95 s, 2160x2160 webm
node tools/film/assemble-devlog.mjs /tmp/devlog out/two-careers.mp4 public/music/theme.mp3
```

| file | what it is |
| --- | --- |
| `careers-read.ts` | decodes both saves through the shipped door and ASSERTS the brief's table |
| `install-save.ts/.html` | puts one export on one origin's disk, through the shipped codec + `adoptAutosave` |
| `DevlogFilm.vue` + `devlog-film.html/.ts` | the 1080 square: caption lane, two name labels, two windows |
| `record-devlog.mjs` | installs, boots, navigates, measures, crops, holds – and refuses a bad take |
| `assemble-devlog.mjs` | cuts the holds down to the scripted seconds, xfades, lays the theme under |

## What is real, and what the film owns

Everything inside the two windows is the shipped app on the owner's own save. The film navigates the
same screens a player taps – her page, the trophy cabinet, Stats' Professional table – and CROPS
them. It computes no game value and types none.

The film owns exactly three kinds of string, all of them drawn OUTSIDE the windows: the floating
caption, the two name labels with their context line, and the small note under the panels. No
editorial "Saved career record" card was needed in the end: every fact in the script is carried by a
real screen.

## The save files are never touched and never leave the machine

They are read once, passed as base64 into a throwaway browser profile, and installed on two dev
server origins that are not the browser the owner plays in. Nothing is written back; `shasum` before
and after is the check. **No save bytes are in this repository** – both paths are command-line
arguments, and the rendered `out/` is never committed.

## Two origins, because IndexedDB is per origin

Two panels of the same app on one port are two tabs fighting over one database. The left panel is
served on 5843 and the right on 5844 – two dev servers over the same worktree. That also means the
stage cannot script either frame (the right one is cross-origin), so the RECORDER drives both frames
directly and the stage only does layout, crop and copy.

## The ranks that are easy to get wrong

| what | where it lives | Zoe | Alice |
| --- | --- | --- | --- |
| Professional rank NOW | `snapshot.ladders.wta.rank` | **16** | **8** |
| the stale cache | `world.kidRankWta` | 13 | 8 |
| the INTERNATIONAL alias | `snapshot.kidRank` / `seasonHistory[].endRank` | 80 | 94 |
| a season's Professional rank | `seasonHistory[].byTrack.wta.endRank` | 2035 -> 98 | 2035 -> 3 |

`byTrack` is OPTIONAL and its absence means "not recorded", never zero. The field is `endRank`, not
`rank` – a first pass read `byTrack.wta.rank`, got `undefined` on every row, and would have reported
that the professional history was missing.

## Gotchas paid for in takes

- **Root `zoom` inside a frame does NOT move the layout box.** Probed here: `clientWidth`,
  `innerWidth`, `body` and `.tab-bar` all answered 370 at zoom 1 AND at zoom 0.893, with
  `getComputedStyle().zoom` reading the value back. The iframe ELEMENT is the phone's viewport. So
  the frame is a fixed 414 x 896 and the scale is a `transform`, which Chromium re-rasterises sharply.
- **A fresh install cannot reach the import button.** With no careers `App.vue` opens the childhood
  prologue as a full-screen takeover, and More – where `importSave` lives – is behind it. The rig
  installs through `decodeExportFile` + `adoptAutosave` instead, which is the same pair `importSave`
  itself commits with, and the app then boots into the career normally.
- **«Tap the photo – her page lives here» is a ONE-TIME callout** (`.diary-kid-hint`). A walk that
  clicked it reached her page once and then could not find the door. `.diary-avatar-btn` is the door.
- **The Slam shelf's eyebrow is `Slam` in the DOM and `SLAM` on screen** – `text-transform` is CSS.
  Matching on the visible text found nothing.
- **Navigation cannot live inside a scripted shot.** Driving two real apps to a screen, measuring the
  card in both and matching the crop takes seconds. The recorder holds each shot generously and logs
  `holdStart`; the assembler keeps only the scripted seconds out of each hold.
- **`.logo` as a mode class collided with `.logo` as a card class.** The mode lands on `.stage`, so
  the card's `display: flex` beat the stage's own `display: grid` at equal specificity – every grid
  row collapsed and the closing copy sat on top of the wordmark. The card is `.logo-card` now.
- **A `v-if`'d grid child moves its siblings.** With the labels and the note removed on the logo card,
  auto-placement dropped the floor into the labels' 0-tall row. Every child names its own `grid-row`.
- **Two caption lines is a rule, so it is checked rather than eyeballed.** `.cap-line` boxes hug their
  text (flex `align-items: center`), so the recorder can tell a wrapped line from a short one and
  throws on a third line. Two shots tripped it and their copy was shortened.
