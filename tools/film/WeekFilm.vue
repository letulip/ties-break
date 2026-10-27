<script setup lang="ts">
// ONE WEEK, TWO FUTURES - the same Monday planned two ways, run through the REAL weekly engine.
//
// ⚠ WHAT IS REAL. Both branches are `createWorld` -> `planFromWeek` -> `tickWeek` x3 -> `toSnapshot`,
// the same pipeline the worker runs, and every number on screen is whatever that produced. The
// screens are the app's own (HomeScreen, CoachMarketScreen's Her-week tab, KidScreen), mounted
// against those snapshots. NOTHING about condition or skills is written by hand, and no production
// logic is modified: `planShapeError` validates each plan exactly as the `setPlan` handler does.
//
// ⚠ WHAT IS SET BY HAND, and it is only the setup the brief allows: her identity, her age (via the
// starting week), her starting condition, the deterministic seed, self-coaching, and the absence of
// any tournament entry. Everything downstream is the engine's.
//
// ⚠ THE SEED IS CHOSEN, NOT FORCED. Injury and knock stay fully live; the rig searches seeds until
// it finds one where BOTH branches run three consecutive school-free summer weeks with no injury and
// no knock, and `summerBlockWeek()` - the engine's own predicate - is asked of every resolved week
// rather than assumed from the week number.
import { computed, createApp, nextTick, onMounted, ref, watch } from 'vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { planFromWeek, planShapeError, doubledDays, planSessions } from '../../src/engine/plan'
import { summerBlockWeek } from '../../src/engine/world/summer'
import { resumeMain } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type SessionKind } from '../../src/shared/protocol'

const PROFILE = { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin', coachTier: 'self' as const }
/** Age 16 (START_AGE 14 + floor(130/52) = 2) and season week 26, inside the 25-33 school break. */
const START_WEEK = 130
/** Low enough that recovery has somewhere to show; the 100 ceiling would hide the whole difference. */
const START_CONDITION = 40
const WEEKS = 3

type Week = SessionKind[][]
/** BUILD - six sessions as three doubled days, the arrangement the brief names. */
const PLAN_A: Week = [['serve', 'rally'], [], ['fitness', 'matchplay'], [], ['general', 'serve'], [], []]
/** RECOVER - four single General practices on four separate days, no doubled day anywhere. */
const PLAN_B: Week = [['general'], [], ['general'], [], ['general'], [], ['general']]
/** The A plan being arranged, every intermediate state a LEGAL plan (4-6 sessions, max 2 a day). */
const A_STEPS: Week[] = [
  [['serve'], [], ['fitness'], [], ['general'], [], ['rally']],
  [['serve', 'rally'], [], ['fitness'], [], ['general'], [], []],
  [['serve', 'rally'], [], ['fitness', 'matchplay'], [], ['general'], [], []],
  PLAN_A,
]
const B_STEPS: Week[] = [[['general'], [], ['general'], [], ['general'], [], ['general']]]

function baseWorld(seed: string) {
  const w = createWorld(seed, PROFILE) as any
  w.week = START_WEEK
  w.condition = START_CONDITION
  w.coachId = null // self-coached, so the Her-week grid is genuinely editable
  return w
}
function planned(seed: string, week: Week) {
  const bad = planShapeError(week)
  if (bad) throw new Error(`plan rejected by the engine: ${bad}`)
  const w = baseWorld(seed)
  w.plan = planFromWeek(week)
  return toSnapshot(w)
}
/** Three real weeks on a standing plan. Returns the snapshot AND what the engine said about each. */
function runBranch(seed: string, week: Week) {
  const bad = planShapeError(week)
  if (bad) throw new Error(`plan rejected by the engine: ${bad}`)
  const w = baseWorld(seed)
  w.plan = planFromWeek(week)
  const startCondition = w.condition
  const rng = resumeMain(w.rngMain)
  const log: { week: number; schoolFree: boolean; condition: number; injured: boolean; knock: boolean }[] = []
  for (let i = 0; i < WEEKS; i++) {
    tickWeek(w, rng)
    log.push({ week: w.week, schoolFree: summerBlockWeek(w), condition: w.condition, injured: !!w.injury, knock: !!w.knock })
  }
  return { snapshot: toSnapshot(w), startCondition, endCondition: w.condition, skills: { ...w.skills }, log }
}
const clean = (r: ReturnType<typeof runBranch>) => r.log.every((x) => x.schoolFree && !x.injured && !x.knock)

// --- pick a seed where neither branch is interrupted ------------------------------------------------
let SEED = ''
let A!: ReturnType<typeof runBranch>
let B!: ReturnType<typeof runBranch>
for (let i = 1; i <= 60 && !SEED; i++) {
  const s = `two-futures-${i}`
  try {
    const a = runBranch(s, PLAN_A)
    const b = runBranch(s, PLAN_B)
    if (clean(a) && clean(b)) { SEED = s; A = a; B = b }
  } catch (e) {
    /* try the next seed */
  }
}
if (!SEED) throw new Error('no seed gave three uninterrupted school-free weeks on both branches')

const START_SNAP = planned(SEED, A_STEPS[0])
const A_SNAPS = A_STEPS.map((w) => planned(SEED, w))
const B_SNAPS = B_STEPS.map((w) => planned(SEED, w))

// --- the cut ---------------------------------------------------------------------------------------
const SCENES = [
  { key: 'title', dur: 2.2 },
  { key: 'home', dur: 3.0 },
  { key: 'weekA', dur: 5.6, steps: [0.5, 1.4, 2.3, 3.2] },
  { key: 'resultA', dur: 3.4 },
  { key: 'weekB', dur: 5.6, steps: [0.7] },
  { key: 'resultB', dur: 3.4 },
  { key: 'compare', dur: 4.0 },
  { key: 'question', dur: 2.0 },
] as const

const game = useGameStore()
const scene = ref(0)
const sub = ref(0)
const key = computed(() => SCENES[scene.value].key)
const ready = ref(false)

function paint(i: number, s: number) {
  scene.value = i
  sub.value = s
  const k = SCENES[i].key
  if (k === 'home') game.snapshot = START_SNAP as any
  else if (k === 'weekA') game.snapshot = A_SNAPS[Math.min(s, A_SNAPS.length - 1)] as any
  else if (k === 'weekB') game.snapshot = B_SNAPS[Math.min(s, B_SNAPS.length - 1)] as any
  else if (k === 'resultA') game.snapshot = A.snapshot as any
  else if (k === 'resultB' || k === 'compare') game.snapshot = B.snapshot as any
}

/** The editorial labels. Exactly the words the brief specifies, and nothing that reads as a number. */
const overlay = computed(() => {
  switch (key.value) {
    case 'home': return { title: 'Same player · same seed · same week', sub: '' }
    case 'weekA': return { title: 'PATH A · BUILD', sub: 'More development · less recovery' }
    case 'resultA': return { title: 'BUILD', sub: 'More development · less recovery' }
    case 'weekB': return { title: 'PATH B · RECOVER', sub: 'Less development · more recovery' }
    case 'resultB': return { title: 'RECOVER', sub: 'Less development · more recovery' }
    default: return null
  }
})

/** ⚠ TWO RESULTS ON ONE SCREEN NEED TWO STORES. `KidScreen` reads `useGameStore()`, so two of them
 *  inside this app would both read the SAME snapshot - the first attempt showed 70% under BUILD,
 *  which is RECOVER's number. Each half therefore gets its own Vue app with its own pinia, so each
 *  renders the real screen against its own branch's real snapshot. */
const holderA = ref<HTMLElement | null>(null)
const holderB = ref<HTMLElement | null>(null)
let halvesMounted = false
watch(key, async (k) => {
  if (k !== 'compare' || halvesMounted) return
  await nextTick()
  const main = getActivePinia()
  const half = (el: HTMLElement, snap: unknown) => {
    const p = createPinia()
    setActivePinia(p)
    ;(useGameStore() as any).snapshot = snap
    const app = createApp(KidScreen)
    app.use(p)
    app.mount(el)
  }
  if (holderA.value) half(holderA.value, A.snapshot)
  if (holderB.value) half(holderB.value, B.snapshot)
  if (main) setActivePinia(main) // hand the outer app its own pinia back
  halvesMounted = true
})

const marks = (() => {
  let t = 0
  return SCENES.map((s) => { const m = { key: s.key, start: t, end: t + s.dur }; t += s.dur; return m })
})()
const TOTAL = marks[marks.length - 1].end

onMounted(() => {
  const w = window as any
  paint(0, 0)
  ready.value = true
  w.__filmMarks = marks
  w.__filmTotal = TOTAL
  w.__filmDone = false
  w.__filmSeek = (i: number, s = 0) => paint(i, s)
  w.__filmReport = {
    seed: SEED,
    startWeek: START_WEEK,
    startCondition: START_CONDITION,
    ageYears: (START_SNAP as any).ageYears,
    planA: { sessions: planSessions(PLAN_A), doubled: doubledDays(PLAN_A), plan: planFromWeek(PLAN_A) },
    planB: { sessions: planSessions(PLAN_B), doubled: doubledDays(PLAN_B), plan: planFromWeek(PLAN_B) },
    baseSkills: { ...(baseWorld(SEED).skills) },
    build: { start: A.startCondition, end: A.endCondition, skills: A.skills, weeks: A.log },
    recover: { start: B.startCondition, end: B.endCondition, skills: B.skills, weeks: B.log },
  }
  // ⚠ NOT AUTO-STARTED: an rAF loop begun on mount runs while the tab is busy, and the first
  // verification screenshot then catches the film already over.
  w.__filmPlay = () => {
    const t0 = performance.now()
    w.__filmDone = false
    const frame = () => {
      const t = (performance.now() - t0) / 1000
      let i = marks.findIndex((m) => t >= m.start && t < m.end)
      if (i < 0) i = t >= TOTAL ? SCENES.length - 1 : 0
      const local = t - marks[i].start
      const steps = (SCENES[i] as any).steps as number[] | undefined
      let s = 0
      if (steps) for (let k = 0; k < steps.length; k++) if (local >= steps[k]) s = k
      if (i !== scene.value || s !== sub.value) paint(i, s)
      if (t >= TOTAL) { w.__filmDone = true; return }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }
})
</script>

<template>
  <div v-if="ready" class="stage">
    <Transition name="wf" mode="default">
      <!-- CARDS: editorial, and deliberately nothing like the app's own furniture. -->
      <div v-if="key === 'title'" key="title" class="card">
        <p class="card-line">SAME MONDAY.</p>
        <p class="card-line accent">TWO FUTURES.</p>
      </div>

      <div v-else-if="key === 'question'" key="question" class="card">
        <p class="card-line">WHICH WEEK</p>
        <p class="card-line accent">WOULD YOU CHOOSE?</p>
      </div>

      <!-- COMPARISON: both real result screens, windowed onto the tiles and the radar. -->
      <div v-else-if="key === 'compare'" key="compare" class="cmp">
        <div class="cmp-half">
          <span class="cmp-tag">BUILD</span>
          <div class="cmp-view"><div ref="holderA" class="cmp-slide"></div></div>
        </div>
        <div class="cmp-half">
          <span class="cmp-tag">RECOVER</span>
          <div class="cmp-view"><div ref="holderB" class="cmp-slide"></div></div>
        </div>
        <p class="cmp-line">Neither week is always right.</p>
      </div>

      <div v-else :key="key" class="screen">
        <HomeScreen v-if="key === 'home'" :recap-fresh="false" @navigate="() => {}" />
        <CoachMarketScreen v-else-if="key === 'weekA' || key === 'weekB'" @back="() => {}" />
        <KidScreen v-else @navigate="() => {}" />
      </div>
    </Transition>

    <!-- EDITORIAL OVERLAY: a caption band, not app chrome - it never sits inside a card, it carries
         a lime rule, and it is the only element here the app itself does not own. -->
    <div v-if="overlay" class="ed">
      <p class="ed-title">{{ overlay.title }}</p>
      <p class="ed-sub">{{ overlay.sub }}</p>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; min-height: 100vh; background: var(--bg); }
.screen { min-height: 100vh; }

.wf-enter-active, .wf-leave-active { transition: opacity 300ms ease; }
.wf-enter-from, .wf-leave-to { opacity: 0; }
.wf-leave-active { position: absolute; inset: 0; }

.card {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 24px 28px; box-sizing: border-box; background: var(--bg); text-align: center;
}
.card-line {
  margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 38px; line-height: 1.14;
  letter-spacing: -0.01em; color: #fff;
}
.card-line.accent { color: var(--tb-accent, #c6f24e); }

.cmp {
  height: 100vh; display: flex; flex-direction: column; justify-content: center;
  padding: 20px 12px; box-sizing: border-box; gap: 12px; background: var(--bg);
}
.cmp-half { display: flex; flex-direction: column; gap: 6px; }
.cmp-tag {
  align-self: flex-start; font-family: var(--font-heading); font-weight: 600; font-size: 12px;
  letter-spacing: 0.16em; color: var(--bg); background: var(--tb-accent, #c6f24e);
  padding: 3px 10px; border-radius: 999px;
}
/* A WINDOW ONTO THE REAL SCREEN, not a redraw of it: the slide is a whole KidScreen pushed up so the
   tile row - and with it the condition ring, which is where the branches actually differ - sits at
   the top of a fixed-height frame that clips the rest. */
.cmp-view { height: 203px; overflow: hidden; border-radius: 14px; }
.cmp-slide { margin-top: -368px; }
.cmp-line {
  margin: 2px 0 0; text-align: center; font-family: var(--font-heading); font-weight: 600;
  font-size: 15px; color: #fff; opacity: 0.9;
}

/* FIXED, not absolute: the screens scroll, and an absolutely-placed band sits at the bottom of
   the STAGE rather than the bottom of the frame - i.e. off-screen. */
.ed {
  position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 18px 18px;
  background: linear-gradient(to top, rgba(6, 9, 13, 0.94) 62%, rgba(6, 9, 13, 0));
  border-left: 3px solid var(--tb-accent, #c6f24e);
  pointer-events: none;
}
.ed-title {
  margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 19px; letter-spacing: 0.02em;
  color: var(--tb-accent, #c6f24e);
}
.ed-sub { margin: 2px 0 0; font-family: var(--font-body); font-size: 13px; color: #fff; opacity: 0.82; }
</style>
