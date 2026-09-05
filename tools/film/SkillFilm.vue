<script setup lang="ts">
// A FILM RIG FOR THE SKILLS PANEL: five talent setups, each grown from age 14 to the plateau.
//
// ⚠ WHAT IS REAL AND WHAT IS FABRICATED, because the difference matters for what the clip claims:
//   REAL – the component (`SkillsRadar.vue`, mounted, not redrawn), the axis scale
//          (`SKILL_CEILING_MAX` = 86), the starting bands (`STARTING_SKILL_BAND`), the headroom band
//          (`ECONOMY.development.potentialBand` = [4, 26]), the age curve, and the growth law itself:
//          each week a skill takes `rate(age)` of the headroom it has left, which is why every
//          contour eases rather than ramps.
//   FABRICATED – only WHERE IN THOSE BANDS each setup sits. The owner asked for the numbers to be
//          simulated rather than played out, so no career is run and no RNG is touched.
//
// The fog is kept. `SkillsRadar` never prints a number by owner ruling, and the band is an honest
// claim (the true value is always inside it), so a demo that switched it off would be showing a
// screen the game does not have. It narrows as she is discovered, which is also the real behaviour.
import { computed, onMounted, ref } from 'vue'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import Card from '../../src/components/ui/Card.vue'
import Eyebrow from '../../src/components/ui/Eyebrow.vue'
import { SKILL_KEYS, STARTING_SKILL_BAND, type SkillKey } from '../../src/engine/development'
import { CEILING_CENTRE_DRIFT, CEILING_FLOOR_HALF, CEILING_MAX_HALF, RADAR_BAND_MAX } from '../../src/engine/radar'
import { ECONOMY } from '../../src/engine/economy'
import type { RadarAxis } from '../../src/shared/protocol'

const START_AGE = 14 // engine/world/age.ts, START_AGE_YEARS
const AGE = ECONOMY.development.ageCurve
const [HEAD_LO, HEAD_HI] = ECONOMY.development.potentialBand
const END_AGE = AGE.plateauStart // 23 – growth is done, the plateau maintains rather than climbs
const WEEKS = (END_AGE - START_AGE) * 52
const SESSIONS_PER_WEEK = 5 // what an ordinary week actually holds; see the exam-week copy

type Skills = Record<SkillKey, number>
interface Tier {
  name: string
  blurb: string
  /** where in STARTING_SKILL_BAND she begins, 0..1 */
  startP: number
  /** where in potentialBand her headroom falls, 0..1 */
  headP: number
  /** per-wing character, in the same 0..1 units, so no contour is a regular pentagon */
  tilt: Partial<Record<SkillKey, number>>
  /** ⚠ COACH LINES ARE COPIED VERBATIM FROM `NOTE_POOL` in engine/radar.ts, not written for the film.
   *  The pool is module-private so it cannot be imported, and the alternative was worse: with every
   *  `note` null the component correctly falls through to "Too early to say – still learning what she
   *  has", which is a true sentence about a stranger and a false one about a girl of twenty-three.
   *  They appear only past half-confidence, which is when the engine would licence them too. */
  notes: Partial<Record<SkillKey, string>>
}

// Five setups across the whole width of the band the engine can roll. The bottom one is not merely
// "less good": ECONOMY's own comment calls it "a girl who was never going to make it, and that has
// to be a career the game can tell".
const TIERS: Tier[] = [
  {
    name: 'Barely a talent',
    blurb: 'Four points of headroom. She improves for nine years, and it is never enough.',
    startP: 0.18,
    headP: 0.03,
    tilt: { stamina: 0.14, composure: -0.1 },
    notes: {
      stamina: 'Long matches suit her. The other girl tires first.',
      composure: 'The big points still get to her.',
    },
  },
  {
    name: 'The late bloomer',
    blurb: 'Starts behind every girl in her group. Does not finish there.',
    startP: 0.06,
    headP: 0.44,
    tilt: { composure: 0.22, serve: -0.12 },
    notes: {
      composure: 'The bigger the point, the calmer she gets. You cannot teach that.',
      serve: 'The serve is the job this year.',
    },
  },
  {
    name: 'A solid junior',
    blurb: 'The middle of the band – a real player, and a ceiling she can feel.',
    startP: 0.5,
    headP: 0.5,
    tilt: { groundstrokes: 0.16, ret: 0.1, serve: -0.14 },
    notes: {
      ret: 'Every serve comes back. That is a whole career on its own.',
      serve: 'The serve is honest. It will not win her matches on its own.',
    },
  },
  {
    name: 'Genuine talent',
    blurb: 'Good at fourteen, and still climbing at twenty-one.',
    startP: 0.74,
    headP: 0.79,
    tilt: { ret: 0.14, stamina: -0.12 },
    notes: {
      ret: 'She returns better than anyone her age I work with.',
      stamina: 'A third set costs her more than it should.',
    },
  },
  {
    name: 'Generational',
    blurb: 'The top of everything the engine can roll. One seed in tens of thousands.',
    startP: 0.94,
    headP: 0.98,
    tilt: { serve: 0.06, groundstrokes: 0.04, composure: -0.06 },
    notes: {
      serve: 'She holds serve in her sleep. That travels.',
      composure: 'Tight sets do not frighten her.',
    },
  },
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Share of REMAINING headroom taken per week at this age – ECONOMY.development.ageCurve, followed
 *  rather than approximated, so the animation's shape is the game's own and not an ease-out I chose. */
function weeklyRate(age: number): number {
  const { growthStart, growthEnd, plateauStart, peakRate, growthEase, plateauRate } = AGE
  if (age <= growthStart) return peakRate
  if (age <= growthEnd) return peakRate * (1 - ((age - growthStart) / (growthEnd - growthStart)) * (1 - growthEase))
  if (age < plateauStart) {
    const t = (age - growthEnd) / (plateauStart - growthEnd)
    return lerp(peakRate * growthEase, plateauRate, t)
  }
  return plateauRate
}

/** Week-by-week from the starting build toward potential. Precomputed once per setup. */
function trajectory(tier: Tier) {
  const start = {} as Skills
  const potential = {} as Skills
  for (const k of SKILL_KEYS) {
    const [lo, hi] = STARTING_SKILL_BAND[k]
    const t = tier.tilt[k] ?? 0
    start[k] = lo + (hi - lo) * clamp01(tier.startP + t)
    potential[k] = start[k] + lerp(HEAD_LO, HEAD_HI, clamp01(tier.headP + t * 0.6))
  }
  const frames: Skills[] = []
  const cur = { ...start }
  for (let w = 0; w <= WEEKS; w++) {
    frames.push({ ...cur })
    const r = weeklyRate(START_AGE + Math.floor(w / 52))
    for (const k of SKILL_KEYS) cur[k] += (potential[k] - cur[k]) * r
  }
  return { start, potential, frames }
}

const TRACKS = TIERS.map(trajectory)

// --- playback -------------------------------------------------------------------------------------
const HOLD_IN = 0.45 // beat on the starting contour before it moves
const GROW = 3.6 // the growth itself
const HOLD_OUT = 0.75 // beat on the finished contour
const PER_TIER = HOLD_IN + GROW + HOLD_OUT
/** The closing question, after every setup and before the logo card. Sora, white, on the app's own
 *  background – `--font-heading` and `--bg`, read from the sheet rather than typed as literals. */
const QUESTION_HOLD = 3.2

const tierIndex = ref(0)
const progress = ref(0) // 0..1 through the current setup's growth
const showQuestion = ref(false) // the closing card, after every setup and before the logo

const tier = computed(() => TIERS[tierIndex.value])
const track = computed(() => TRACKS[tierIndex.value])
const week = computed(() => Math.round(progress.value * WEEKS))
const age = computed(() => START_AGE + Math.floor(week.value / 52))
const season = computed(() => Math.min(END_AGE - START_AGE, Math.floor(week.value / 52) + 1))
const sessions = computed(() => (week.value * SESSIONS_PER_WEEK).toLocaleString('en-US'))
const current = computed(() => track.value.frames[Math.min(week.value, WEEKS)])

const axes = computed<RadarAxis[]>(() =>
  SKILL_KEYS.map((k, i) => {
    // the haze over potential narrows to CEILING_FLOOR_HALF and stops – you learn the range, never
    // the number – and its centre is offset so the midpoint is not the answer either
    const half = lerp(CEILING_MAX_HALF, CEILING_FLOOR_HALF, progress.value)
    const centre = track.value.potential[k] + (i % 2 ? 1 : -1) * CEILING_CENTRE_DRIFT * half
    return {
      key: k,
      shownValue: current.value[k],
      startValue: track.value.start[k],
      band: lerp(RADAR_BAND_MAX, 1.2, progress.value),
      ceilingLo: Math.max(0, centre - half),
      ceilingHi: centre + half,
      note: progress.value > 0.5 ? (tier.value.notes[k] ?? null) : null,
    }
  }),
)

// ⚠ PLAYBACK DOES NOT AUTO-START, and that is deliberate. An rAF loop begun on mount runs while the
// tab is doing anything else: the first verification screenshot caught the whole thing already over,
// showing setup 1 frozen at age 23, because rAF is throttled off-screen and the catch-up frame
// landed past the end. The recorder calls __filmPlay() when it is actually rolling, and __filmSeek()
// puts any single state on screen so a frame can be checked without waiting for it to come round.
const marks: { tier: string; index: number; start: number; end: number }[] = []
TIERS.forEach((t, i) => marks.push({ tier: t.name, index: i, start: i * PER_TIER, end: (i + 1) * PER_TIER }))
const TIERS_END = TIERS.length * PER_TIER
marks.push({ tier: 'question', index: TIERS.length, start: TIERS_END, end: TIERS_END + QUESTION_HOLD })

onMounted(() => {
  const w = window as any
  w.__filmMarks = marks
  w.__filmPlan = { perTier: PER_TIER, holdIn: HOLD_IN, grow: GROW, holdOut: HOLD_OUT, tiers: TIERS.length, question: QUESTION_HOLD }
  w.__filmDone = false

  /** Put one exact state on screen (verification, not playback). Pass i = TIERS.length for the card. */
  w.__filmSeek = (i: number, p: number) => {
    showQuestion.value = i >= TIERS.length
    tierIndex.value = Math.min(TIERS.length - 1, Math.max(0, i))
    progress.value = clamp01(p)
  }

  w.__filmPlay = () => {
    const t0 = performance.now()
    w.__filmT0 = t0
    w.__filmDone = false
    const total = TIERS_END + QUESTION_HOLD
    const frame = () => {
      const t = (performance.now() - t0) / 1000
      if (t >= TIERS_END) {
        // every contour has been shown; hold the question until the card takes over
        showQuestion.value = true
        tierIndex.value = TIERS.length - 1
        progress.value = 1
      } else {
        showQuestion.value = false
        const i = Math.min(TIERS.length - 1, Math.floor(t / PER_TIER))
        tierIndex.value = i
        progress.value = clamp01((t - i * PER_TIER - HOLD_IN) / GROW)
      }
      if (t >= total) {
        w.__filmDone = true
        return
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }
})
</script>

<template>
  <div v-if="showQuestion" class="ask">
    <p class="ask-q">What would be yours?</p>
  </div>

  <div v-else class="film">
    <p class="film-step">Setup {{ tierIndex + 1 }} of {{ TIERS.length }}</p>
    <h1 class="film-name">{{ tier.name }}</h1>
    <p class="film-blurb">{{ tier.blurb }}</p>

    <Card class="film-panel">
      <Eyebrow as="h2">Skills</Eyebrow>
      <SkillsRadar :axes="axes" :title="`Her skills at ${age}`" />
    </Card>

    <div class="film-meter">
      <p class="film-age">Age {{ age }}</p>
      <p class="film-sub">season {{ season }} of {{ END_AGE - START_AGE }} · {{ sessions }} sessions</p>
    </div>
  </div>
</template>

<style scoped>
/* THE CLOSING QUESTION. Sora in white on the app's own background, both taken from the sheet
   (`--font-heading`, `--bg`) rather than typed in, so the card cannot drift from the product. */
.ask {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 30px;
  box-sizing: border-box;
  background: var(--bg);
}
.ask-q {
  margin: 0;
  font-family: var(--font-heading);
  /* ⚠ 600, NOT 700. Only ONE Sora face is self-hosted (`sora-600.woff2`, a single static weight),
     so `font-weight: 700` does not load a bolder file – the browser fakes it by smearing the 600
     outlines, and `document.fonts.check('700 42px Sora')` still answers true, which is why it looks
     verified when it is not. The app's own heading rules use 600 for the same reason. */
  font-weight: 600;
  font-size: 42px;
  line-height: 1.16;
  letter-spacing: -0.01em;
  color: #fff;
  text-align: center;
  text-wrap: balance;
}

/* space-between rather than centre: on a 414x896 frame the panel is ~500px tall, and centring it
   left ~200px of dead black top and bottom. Spreading the three blocks fills the vertical format. */
.film {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 52px 16px 44px;
  box-sizing: border-box;
}
.film-step {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tb-accent, #c6f24e);
  opacity: 0.85;
}
.film-name {
  margin: 2px 0 0;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 600; /* the only self-hosted Sora face – see .ask-q */
}
.film-blurb {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.35;
  opacity: 0.62;
  min-height: 38px;
}
.film-panel {
  padding: 12px 10px 6px;
}
.film-meter {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
}
.film-age {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.film-sub {
  margin: 0;
  font-size: 13px;
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}
</style>
