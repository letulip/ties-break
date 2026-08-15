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
