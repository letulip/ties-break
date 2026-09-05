<script setup lang="ts">
// WHEN REST BECOMES TRAINING. Real drain, a real medical refusal, a real recovery booking, and a
// real return - every number read back out of the engine.
//
// ⚠ THE BRIEF'S ARITHMETIC WAS OFF BY THE PHYSIO POINT, AND THE FILM SHOWS THE ENGINE'S NUMBERS.
// A match-free Light week returns recoveryBase 8 + the 60/40 slider's 2 + physio 1 = ELEVEN, not
// ten (`accrueCondition`; she carries the opening coach `middle-1`, so `physioActive` is true). So
// the real arc is 14 -> 65 -> 76, not 14 -> 64 -> 74, and every caption below says 11 and 65 and 76.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { formatCents } from '../../src/shared/money'
import { run } from './rest'

const SEED = 'rest-7'
const BASE = 64
const R = run(SEED, BASE) as any
if (!R.ok) throw new Error(R.why)

const C = {
  entry: R.conditionBeforeCentral,
  after: R.conditionAfterCentral,
  drain: R.central.drain,
  afterResort: R.afterResort,
  afterLight: R.afterLightWeek,
}
/** The match-free part of each recovery week, derived rather than typed: the resort week moved her
 *  by the package gain PLUS this, and the plain week that follows moves her by this alone. */
const MATCH_FREE = C.afterLight - C.afterResort
const RESORT_GAIN = C.afterResort - C.after - MATCH_FREE
const kidScore = (m: any) => (m && m.bId === 'kid' ? String(m.score).split(' ').map((s: string) => s.split('-').reverse().join('-')).join(' ') : m?.score ?? '')

;(window as any).__filmReport = {
  seed: SEED, skillBase: BASE, ageYears: R.atWarning.ageYears,
  conditionAtEntry: C.entry, drain: C.drain, conditionAfterMatch: C.after,
  clearanceAfterMatch: R.clearanceAtBlocked, pointsFromCentral: R.central.points,
  centralLabel: R.central.label, centralWeek: R.central.week,
  centralScore: kidScore(R.central.rounds[0]?.match), centralRounds: R.central.rounds.length,
  resortPriceCents: R.resortPriceCents, afterResort: C.afterResort, afterLight: C.afterLight,
  matchFreeRecovery: MATCH_FREE, resortGain: RESORT_GAIN,
  factorAtEntry: R.factorAtEntry, factorAfter: R.factorAfter,
  returned: R.returned ? { label: R.returned.label, week: R.returned.week, condition: R.returned.condition, score: kidScore(R.returned.match) } : null,
  history: R.history.map((h: any) => ({ label: h.label, week: h.week, before: h.conditionBefore, after: h.conditionAfter, drain: h.drain, points: h.points })),
}

const SCENES = [
  { key: 'hook', dur: 2.8 },
  { key: 'falling', dur: 4.2, steps: [0, 1.5, 2.9], snaps: () => [R.history[R.history.length - 2]?.atEnd ?? R.atWarning, R.history[R.history.length - 1]?.atEnd ?? R.atWarning, R.atWarning] },
  // ⚠ NO MOUNTED SCREEN SURFACES THE DOCTOR'S LINE IN THIS STATE. It is a type:'info' row in
  // `snapshot.events` (confirmed present at week 195), but Home shows the coach note and the memory
  // card, ThisWeekScreen shows the plan and the recap, and SeasonScreen shows the calendar - none
  // renders that feed here. So this beat shows the REAL Junior Tour 30 arrival with her condition on
  // it, and the band carries the engine's sentence VERBATIM as a quotation rather than a paraphrase.
  { key: 'warning', dur: 3.8, snap: () => (R.central.rounds[0]?.snapshot ?? R.atWarning) },
  { key: 'tired', dur: 4.5, snap: () => R.central.atEnd },
  // ⚠ SCROLL TO A CARD THAT IS ACTUALLY MEDICALLY LOCKED. The first cut framed an event reading
  // "Closed W39 '34" - a passed deadline, not the doctor - under a caption about the doctor.
  { key: 'locked', dur: 4.7, snap: () => R.atBlocked, findText: 'Not cleared to play' },
  { key: 'recovery', dur: 4.0, snap: () => R.atBlocked },
  { key: 'week1', dur: 5.0, snap: () => R.atAfterResort },
  { key: 'week2', dur: 3.0, snap: () => R.atAfterLight },
  { key: 'return', dur: 5.0, snap: () => (R.returned?.snapshot ?? R.atAfterLight) },
  { key: 'final', dur: 2.5, steps: [0, 1.3] },
] as const

const game = useGameStore()
const scene = ref(0)
const sub = ref(0)
const key = computed(() => SCENES[scene.value].key)
const ready = ref(false)

function paint(i: number, s: number) {
  scene.value = i
  sub.value = s
  const sc = SCENES[i] as any
  if (sc.snaps) game.snapshot = sc.snaps()[Math.min(s, sc.snaps().length - 1)]
  else if (sc.snap) game.snapshot = sc.snap()
}

const overlay = computed(() => {
  switch (key.value) {
    case 'falling': return { title: 'EVERY MATCH LEAVES SOMETHING BEHIND.', sub: `Condition ${C.entry}/100` }
    case 'warning': return { title: 'CLEARED. BUT ONLY JUST.', sub: '"…cleared for the Junior Tour 30, but only just. A warning is all it is; nobody can forbid it."' }
    case 'tired': return { title: `CONDITION ${C.entry} → ${C.after}`, sub: `${R.central.points} ranking points` }
    case 'locked': return { title: 'BELOW 15, THE DOCTOR DECIDES.', sub: 'Not cleared to play – a friendly is a match too.' }
    case 'recovery': return { title: 'ONE WEEK WITHOUT A TOURNAMENT.', sub: `Sports recovery resort · ${formatCents(R.resortPriceCents)}` }
    case 'week1': return { title: `${C.after} → ${C.afterResort} CONDITION`, sub: `+${RESORT_GAIN} recovery programme · +${MATCH_FREE} match-free week` }
    case 'week2': return { title: `${C.afterResort} → ${C.afterLight} CONDITION`, sub: 'Rest did not stop development. It made the next block possible.' }
    case 'return': return { title: 'CLEARED TO PLAY.', sub: `Condition ${R.returned?.condition ?? C.afterLight} – above the 70 knee, full match strength` }
    default: return null
  }
})

const marks = (() => { let t = 0; return SCENES.map((s) => { const m = { key: s.key, start: t, end: t + s.dur }; t += s.dur; return m }) })()
const TOTAL = marks[marks.length - 1].end

onMounted(() => {
  const w = window as any
  paint(0, 0)
  ready.value = true
  w.__filmMarks = marks
  w.__filmTotal = TOTAL
  w.__filmDone = false
  w.__filmSeek = (i: number, s = 0) => paint(i, s)
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

/** Bring the real news row into shot. The feed is long and the doctor's line is not at the top. */
watch([key, ready], async () => {
  const want = (SCENES[scene.value] as any).findText as string | undefined
  if (!want) return
  await nextTick()
  await new Promise((r) => setTimeout(r, 380))
  // ⚠ TWO TRAPS IN ONE LINE. The editorial band's own caption begins "Not cleared to play", so the
  // search matched MY overlay and scrolled a fixed element (a no-op). And the real lock renders as
  // `<span class="pill muted lock">🔒 Not cleared to play</span>` - it starts with a PADLOCK, so a
  // `startsWith` never matched it either. Exclude the band, match on `includes`, and scroll the
  // card rather than the pill so the whole locked entry is in shot.
  const node = [...document.querySelectorAll('li, p, div, span, article, section')].find((n) => {
    if ((n as HTMLElement).closest('.ed')) return false
    const t = (n.textContent || '').trim()
    return t.includes(want) && t.length < 200
  })
  const card = (node as HTMLElement | undefined)?.closest('article, li, .tb-card') ?? node
  card?.scrollIntoView({ block: 'center' })
})
</script>

<template>
  <div v-if="ready" class="stage">
    <Transition name="rs">
      <div v-if="key === 'hook'" key="hook" class="card">
        <p class="card-line">THE HARDEST</p>
        <p class="card-line">TRAINING DECISION</p>
        <p class="card-line accent">IS SOMETIMES STOPPING.</p>
      </div>

      <div v-else-if="key === 'final'" key="final" class="card">
        <template v-if="sub === 0">
          <p class="card-line">TWO WEEKS OFF</p>
          <p class="card-line">THE SCHEDULE.</p>
          <p class="card-line accent gap">A CAREER PUT<br />BACK ON IT.</p>
        </template>
        <template v-else>
          <p class="card-line">THE HARDEST TRAINING DECISION</p>
          <p class="card-line accent">IS SOMETIMES STOPPING.</p>
        </template>
      </div>

      <div v-else-if="key === 'recovery'" key="recovery" class="screen">
        <PlanWeekSheet :week="R.central.week + 1" initial-tab="vacation" @close="() => {}" @book-practice="() => {}" @book-vacation="() => {}" />
      </div>

      <div v-else :key="key" class="screen">
        <HomeScreen v-if="key === 'week1' || key === 'week2'" :recap-fresh="false" @navigate="() => {}" />
        <SeasonScreen v-else-if="key === 'locked'" @navigate="() => {}" />
        <TournamentFlow v-else />
      </div>
    </Transition>

    <div v-if="overlay" class="ed">
      <p class="ed-title">{{ overlay.title }}</p>
      <p v-if="overlay.sub" class="ed-sub">{{ overlay.sub }}</p>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; min-height: 100vh; background: var(--bg); }
.screen { min-height: 100vh; }
.rs-enter-active, .rs-leave-active { transition: opacity 300ms ease; }
.rs-enter-from, .rs-leave-to { opacity: 0; }
.rs-leave-active { position: absolute; inset: 0; }

.card {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 24px 26px; box-sizing: border-box; background: var(--bg); text-align: center;
}
.card-line {
  margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 30px; line-height: 1.2;
  letter-spacing: -0.01em; color: #fff;
}
.card-line.accent { color: var(--tb-accent, #c6f24e); }
.gap { margin-top: 16px; }

/* Fixed and above TakeoverShell, which otherwise covers the band entirely. */
.ed {
  position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 18px 18px; z-index: 9999;
  background: linear-gradient(to top, rgba(6, 9, 13, 0.94) 62%, rgba(6, 9, 13, 0));
  border-left: 3px solid var(--tb-accent, #c6f24e); pointer-events: none;
}
.ed-title { margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 18px; color: var(--tb-accent, #c6f24e); }
.ed-sub { margin: 2px 0 0; font-family: var(--font-body); font-size: 13px; color: #fff; opacity: 0.82; }
</style>
