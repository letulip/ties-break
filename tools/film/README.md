# `tools/film` – The nine years before the career begins

A 1080x1080 Game Jolt clip: two childhoods of the same girl, side by side, both of them the shipped
`ChildhoodPrologue` running for real.

```bash
# the dev server has to be up (npm run dev -- --port 5841)
node tools/film/probe-prologue.mjs  /tmp/stills          # ~40 s, no video, one still per beat
node tools/film/record-prologue.mjs /tmp/prologuefilm    # ~40 s, 2160x2160 webm
node tools/film/assemble-prologue.mjs /tmp/prologuefilm out/nine-years.mp4 public/music/theme.mp3
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
