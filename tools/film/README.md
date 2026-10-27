# tools/film – the promo clip rigs

Two vertical clips for GameJolt, both 828x1792 (a native 2x of a 414x896 phone layout), h264/aac,
theme.mp3 from frame one, both closing on the app's own splash as a logo card.

```bash
# 1. the WEEK SHAPES clip – the calendar crossing itself out, once per kind of week
node tools/film/record-weeks.mjs   /tmp/filmweeks        # ~6 min, walks ~50 weeks
node tools/film/assemble-weeks.mjs /tmp/filmweeks out/ties-break-weeks.mp4 public/music/theme.mp3

# 2. the TALENT clip – the skills panel grown from 14 to 23, once per talent setup
node tools/film/record-skills.mjs   /tmp/skillfilm       # ~35 s
node tools/film/assemble-skills.mjs /tmp/skillfilm out/ties-break-talent.mp4 public/music/theme.mp3
```

Both recorders need the dev server up (`npm run dev`); the skills rig is served at
`/tools/film/skill-film.html`.

## Capture: the one flag that matters

Playwright records at **CSS-pixel resolution, 1:1**. Two obvious-looking approaches were measured and
rejected:

| approach | what actually happens |
| --- | --- |
| `deviceScaleFactor: 2` on the context | the page renders 414x896 into the **corner** of the 828x1792 frame, rest padded grey. It drives screenshots, not video. |
| `html { zoom: 2 }` | fills the frame and is sharp, but `matchMedia('(min-width:768px)')` then reports **true** against a 414px layout box – desktop CSS on a phone layout |
| **`--force-device-scale-factor=2`** (browser arg) | ✅ `innerWidth` stays 414, screencast lands at a true 828x1792 |

So the assemblers never scale: the filter chain only sets fps and pixel format.

## The talent rig – what is real and what is simulated

`SkillFilm.vue` mounts the **real** `SkillsRadar.vue`. Real too: the axis scale (`SKILL_CEILING_MAX`
= 86), `STARTING_SKILL_BAND`, `ECONOMY.development.potentialBand` ([4, 26]), and the growth law –
each week a skill takes `rate(age)` of the headroom it has left, straight off
`ECONOMY.development.ageCurve`, which is why every contour eases instead of ramping.

**Simulated: only where in those bands each setup sits.** No career is run and no RNG is touched –
the owner asked for the numbers rather than the playthrough.

Two deliberate choices, both of which look like bugs if you do not know:

- **The fog stays on.** The radar prints no numbers by owner ruling and the band is an honest claim,
  so a demo with it switched off would show a screen the game does not have. It narrows as she is
  discovered, which is the real behaviour.
- **Coach lines are copied verbatim from `NOTE_POOL`** in `engine/radar.ts` (the pool is
  module-private, so it cannot be imported). With every `note` null the component correctly falls
  through to *"Too early to say – still learning what she has"* – a true sentence about a stranger
  and a false one about a girl of twenty-three.

## Gotchas paid for in re-takes

- **Playback does not auto-start.** An rAF loop begun on mount runs while the tab is busy: the first
  verification screenshot caught the whole film already over, setup 1 frozen at age 23. The rig
  exposes `__filmPlay()` and `__filmSeek(i, p)` instead, and the recorder reads `__filmMarks` back so
  no segment boundary is ever guessed.
- **Only ONE Sora face is self-hosted** (`sora-600.woff2`). `font-weight: 700` does not load a bolder
  file – the browser fakes it – and `document.fonts.check('700 42px Sora')` still answers **true**,
  which is exactly why it looks verified when it is not. Use 600.
- **Enumerating week-advance button labels does not work.** A holiday's CTA reads *"Leave on
  vacation"* – not "Holiday", not "Family week". A take that guessed those clicked nothing 170 times
  and filmed one sweep in 200 seconds. `advanceWeek()` finds it structurally instead.
- **`+ Plan week` has textContent `"\n  + Plan week\n"`.** An anchored `/^\+?\s*Plan week$/` matches
  nothing, and the take books no holiday while reporting success.
- **Classify weeks from `.tb-eyebrow`, never a page-wide regex.** An early cut labelled a week
  "exams" while the header plainly said TRAINING WEEK.
- **The splash is an ANIMATION** – at 0.6s only "Ties Break" has painted, "Ace Parent" is still
  easing in at 1.2s – so the logo card enters at 0.25s to buy the whole reveal.
# `tools/film` – The nine years before the career begins

A 1080x1080 Game Jolt clip: two childhoods of the same girl, side by side, both of them the shipped
`ChildhoodPrologue` running for real.

```bash
# the dev server has to be up (npm run dev -- --port 5841)
node tools/film/probe-prologue.mjs  /tmp/stills          # ~40 s, no video, one still per beat
node tools/film/record-prologue.mjs /tmp/prologuefilm    # ~40 s, 2160x2160 webm
node tools/film/assemble-prologue.mjs /tmp/prologuefilm out/nine-years.mp4 public/music/theme.mp3
# `tools/film` – No good ending. No bad ending.

A 828x1792 devlog clip: all eight career endings, each one latched by the shipped resolver on a real
career, shown on the real epilogue.

```bash
# the dev server has to be up (.claude/launch.json -> tb-endfilm, port 5845)
npx vite-node tools/film/coin-search.ts                    # whose 2% / 1% coin lands – no walking
INDICES=6,7,8,15 npx vite-node tools/film/door-scan.ts      # ...and whose door was open as well
I_PEAK=98 S_PEAK=11 FIXTURE_RUN=build OUT=/tmp/ending-fixtures npx vite-node tools/film/ending-fixtures.ts
node tools/film/record-endings.mjs   /tmp/endfilm /tmp/ending-fixtures   # ~3 min, 1656x3584 webm
node tools/film/assemble-endings.mjs /tmp/endfilm out/no-good-ending.mp4 public/music/theme.mp3 public/sounds/hit-3.mp3
node tools/film/provenance-endings.mjs /tmp/endfilm out/no-good-ending-provenance.md
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
| `prologue-phone.html/.ts` | ONE phone: the real `ChildhoodPrologue` in its own document |
| `PrologueFilm.vue` + `prologue-film.html/.ts` | the 1080-square stage: two frames, captions, timeline |
| `record-prologue.mjs` / `assemble-prologue.mjs` | the take and the cut |
| `probe-prologue.mjs` | the same walk with stills instead of video – run this first |
| `prologue-probe.ts` | dumps the shipped `PROLOGUE_CARDS` and walks both paths through `run.ts` |
| `prologue-worlds.ts` | both childhoods through `createWorld` -> `toSnapshot`, skill by skill |
| `prologue-sweep.ts` | how big the gap between the two paths CAN be, and which constant to pin |
| the `stats` beat | the handover as numbers, over each screen – higher value in the accent, lower in white |
| `fitprobe.mjs` | how tall each card is at 414 logical px (this is why the film scrolls) |
| `zoomtest.mjs` | what root `zoom` does to the layout box and to the media queries |

## What is real

Everything inside the two frames. The film clicks the same `.prologue-answer` buttons a player taps
and reads the walk's state back off the live component; no card copy, price, coach line, radar or
tournament result is typed anywhere in `tools/film`. The strings the stage owns are the editorial
captions, the two path labels, and the line under each label – and that line is the shipped option
label quoted verbatim, because on cards 8, 9 and 10 the walk steps forward the instant the option is
taken and the choice is never on screen long enough to read.

## Two seeds, both pinned, and the second one was nearly missed

`ChildhoodPrologue.freshSeed()` is `prologue-${Math.random()...}` and the store fills an empty career
seed with `${kidName}-${Math.random()...}`. **They are different seeds doing different jobs**: the
first draws the Local Opens and the venue art, the second draws her starting skills and her
potential. `Math.random` is pinned for the life of each phone document, so both are the app's own
generators at one constant and both halves are the same girl.

**The constant is 0.004, and `prologue-sweep.ts` is why.** The first cut ran at 0.5 and the two
handovers printed the SAME two coach sentences. That is not a filming problem: `childhoodArrival`
adds `walk.level + walk.shape` and then CLAMPS into `STARTING_SKILL_BAND` – the same band a fresh
fourteen-year-old is drawn from – so the spread between the cheapest childhood the table allows and
the dearest is capped by `CHILDHOOD.swingPoints`.

**⚠⚠ AND NO SEED CAN WIDEN IT.** Swept over 999 constants: wherever no axis clamps, the gap is
**exactly 2.5400 points on every one of them**, because `arrival = born + level + shape` and the
difference between the two paths cancels `born` entirely. Clamping is the only thing a seed does to
the gap and it can only take points away (1.70 at the worst). A `behind -> ahead` split needs 4.4
and is arithmetically impossible at any seed with any legal pair of childhoods. So the search is not
for a bigger gap – there is not one – but for the constant that makes the most of the handover
differ, because the coach's base sentence, his rung and her play style are all thresholds on WHERE
IN THE BAND her born skills sit.

> **THE RULE, printed above the table before it is read:** no clamped axis on either path, the two
> arrivals on opposite sides of `HANDOVER_BASE_CUTS`, then the most of the handover differing, then
> the widest gap, then the lowest constant. **Four of the five comparable facts is the ceiling** –
> base band, coach sentence, coach rung, play style; the ROOM band can never differ, by construction
> – and 69 of the 999 reach it. The pick is **0.004**. Tournament results were **not** a criterion
> and are whatever it produced – four entered weekends, four defeats.

⚠ The tie-break inside those 69 is presentation, and it is not a tournament result: **0.04** scores
the same four and was the pin until the read-out sheet existed, but at that constant `startingSkills`
draws serve and ret EQUAL, so two of the five rows print the same number twice and the column reads
as a rendering fault. 0.004 draws five distinct values and the same four defeats.

⚠ A first cut restored `Math.random` after the mount. That fixed the prologue seed and left the
career seed random, so the two frames walked one childhood and handed it to **two different girls**
under a caption reading «Same hidden potential». It was caught on the handover frame: the two coach
lines came back different, where the same band and the same seed must produce the same sentence.
`record-prologue.mjs` now compares both snapshots and refuses the take if they disagree.

## Capture

| approach | measured |
| --- | --- |
| `deviceScaleFactor: 2` on the context | page renders into the corner of the frame, rest padded |
| `html { zoom: 2 }` on the TOP-LEVEL document | breaks the phone media queries |
| **`--force-device-scale-factor=2`** | ✅ 1080 CSS stage -> a true 2160x2160 screencast |

The assembler halves it. A supersampled 1080 is worth having on a frame this dense with 14px type.

**Root `zoom` INSIDE a frame is a different lever and it is safe** – `zoomtest.mjs`: at zoom 1 the
card box is 414 px and an h2 is 25 px tall; at 1.15 they are 476 and 29. Same layout, larger raster.
The stage sizes the element to `414 * zoom`, so the layout box stays 414 at every scale, and the
recorder refuses a take where either frame reports `matchMedia('(min-width: 768px)')` true.

## Gotchas paid for in takes

- **The tenth card's decision IS its tournament question.** Answering it satisfies `cardAnswered` and
  the walk steps to eleven, so an unguarded «now answer the ask» tap answered the ELEVENTH card's
  weekend and every later year landed one card early. `year()` re-reads the state and only answers
  the ask if the walk is still on the card it was given.
- **Three cards are taller than the phone**: measured at 414 logical px the fifth is 1150, the
  eleventh 1026 and the twelfth 1112 against an 896-tall frame, so the answers – the whole subject of
  those beats – start below the fold. The film scrolls them, slowly, which is also its only motion.
- **The match viewer holds 3600 / min(speed, 2) ms before its first frame** (`usePlaybackClock`), and
  the first cut of the two-second match beat filmed a live court reading 0-0 with the momentum row
  still saying «Not started». At x4 the clock's own branch skips the hold, so the phone document sets
  `tb-match-speed` **before the module graph loads** – `matchDefaults.ts` reads it once, at import.
- **The stage's grid column is content-sized unless you say otherwise.** With both frames hidden the
  floor collapsed to 0 wide and the logo card – `position: absolute; inset: 0` inside it – collapsed
  with it, so the closing copy wrapped one word per line.
- **The last button tapped keeps its focus ring**, and on the handover that ring lands on one of the
  two halves, which reads as a difference between the paths. Both frames are blurred at every cut.
- **Three layouts in the first four seconds read as a glitch.** The first cut opened on ONE phone for
  ages five to seven and pulled back to two at eight; the owner met it as «strange screen changing …
  can't be read by the viewer because of the speed». It now opens on both frames and never changes
  layout until the match cut. Showing the same card twice is the truthful thing to do there: the two
  childhoods are identical until the eighth card.
- **Side by side, the handover's one differing sentence is 15px in a 1080 frame.** The `compare`
  beat crops both cards to `.handover-read` through `.handover-spent` and STACKS them, which lifts
  the cap on scale from 1.28x (width-bound) to about 2.5x (height-bound). Each strip keeps its own
  height: giving both the taller one's height ran path A – which has no played line – far enough to
  include its «Go on with her» button.
- **The read-out sheet cannot take its numbers off the snapshot**, and that is a design decision
  rather than a gap: `RadarAxis.shownValue` is an ESTIMATE that is deliberately wrong while she is
  undiscovered, and the two paths do not even carry the same fog (B played four weekends, so her band
  is narrower), so colouring «higher» off the estimates could paint the wrong half yellow.
  `__phone.facts()` re-runs the shipped `createWorld` over that phone's own live run and profile and
  reads `world.skills` – then compares the rebuilt radar, funds and base band against the live
  snapshot and answers `ok: false` if any of them disagree. The recorder refuses the take on a false
  `ok`: a read-out of a girl who is not on screen is the same class of defect as the two seeds.
  **Potential is never returned by `facts()`**, so the brief's «do not expose hidden potential as a
  number» cannot be broken by accident.
- **A 0.88 scrim is not enough to put a sheet over a card.** Measured on the first still: the coach's
  two sentences ran straight through the money rows and the frame read as two texts fighting. 0.955
  plus a 3px backdrop blur leaves the card as a texture instead of a second column of words.
| `ending-fixtures.ts` | walks real careers and lets the shipped resolvers end them; writes twelve saves |
| `coin-search.ts` | which (seed, door, season) coins land – a pure function, enumerated in ms |
| `door-scan.ts` | which careers had the door OPEN, which is the rare half |
| `install-ending.ts/.html` | puts a fixture on this origin's disk through the shipped codec + `adoptAutosave` |
| `EndingFilm.vue` + `endings-film.html/.ts` | the 828x1792 stage: caption lane, phone window, note |
| `record-endings.mjs` | installs, boots each career, navigates the real epilogue, holds |
| `assemble-endings.mjs` | cuts the holds to the scripted seconds, xfades, theme + one racket impact per movement |

## Nothing is tuned, and the two doors are CAST

`ENDINGS` is read and never written. `resolveLeaving` draws
`rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()` against 0.02 (peak) and 0.01 (fall), so
whether a given career's coin lands is a **fact about that career** – enumerable without walking
anything. `coin-search.ts` lists the landing pairs; `door-scan.ts` then proves the door was open too.
Choosing which career to film by that is casting, and it is the only way to film a 1.72% event on
purpose without touching the 1.72%.

**The peak in the film is a natural latch**: `bench-wealthy-98` reached its twelfth wrap at age 25,
on the paid table, #3 in the world, and the engine latched it inside the tick.

## The two places state was PLACED

Both are in `out/no-good-ending-provenance.md` in full. In short: the fall's two season figures are
the owner's own (`#13`/4,008 → `#59`/1,584), written into that career's season table and then judged
by the shipped `fallLeavingDue`; and her four exit lines are QUOTED off the saves, because
`resolveLeaving` writes them into the diary and an ended career can never reach the news feed.

## Gotchas paid for in takes

- **Five fixtures shared one `careerId`.** The fall's pre-latch save and its four voices are copies of
  one career, so `adoptAutosave` – which keys its slot on `careerId` – had each install overwrite the
  last. The film booted one ended world five times while asking for five different ones. Every fixture
  is stamped `film-<name>` now.
- **A face is not loaded until something asks for it.** The stage opens with an empty caption lane, so
  `document.fonts.check('600 40px Sora')` answered false and the recorder refused a take whose type
  would have been correct the moment the first caption rendered. A hidden probe span keeps Sora
  requested from the first paint, which is what makes the check mean anything.
- **The last retirement offer is not a question.** `answerRetirement(world, false)` THROWS on a `final`
  offer (`LAST_OFFER_NOT_A_QUESTION`), so "ask for one more year, every time" has to mean every offer
  that still has a next one. A walk that did not know it died on the first long career.
- **The fall career takes its own door.** The walk comes back with the ending already latched, so the
  fixture winds the latch back (and removes the diary line it wrote) before placing the owner's rows
  and asking the same resolver again on the same coin.
- **A college ending never reaches the epilogue.** `showCollege` diverts while `collegeProgressOf` is
  non-null, and it is non-null for the whole four years – so the film shows the real college week,
  which is the honest screen for the one ending that resumes.
- **Never `pkill -f vite-node` on this machine.** Other sessions run benches out of other worktrees;
  match your own script's path instead.
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
