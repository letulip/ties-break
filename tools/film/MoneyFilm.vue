<script setup lang="ts">
// SHE WON - AND WE STILL LOST MONEY. Every figure on screen is the engine's.
//
// ⚠ THE COACH'S SECOND FARE IS NOT IN THIS FILM, BECAUSE IT IS NOT IN THE GAME. There is no
// `coachTravelFareFor`, no `setCoachOnJuniorEvents`, and no second charge anywhere: every
// `fundsCents -=` site in the engine is the entry fee, ONE travel fare, the weekly expense, injury,
// kit or a planner booking. `coachOnEventWeeks`' own comment says it "means travel, and only travel,
// until the travel mechanic is built". The coach still costs the family money through this
// tournament - the retainer is charged straight through the event weeks, deliberately - so the story
// is unchanged and the ledger is real.
//
// ⚠ NOTHING IS WRITTEN HERE. No ledger row, no point, no trophy, no result. The scenario runs
// enterEvent -> tickWeek -> revealTournamentRound -> closeTournament and reads what came out.
import { computed, createApp, nextTick, onMounted, ref, watch } from 'vue'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { useGameStore } from '../../src/stores/game'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { formatCents } from '../../src/shared/money'
import { run } from './scenario'

const SEED = 'won-lost-28'
// ⚠ THE SPEED DEFAULT IS SET IN THE HTML, NOT HERE. `matchDefaults.ts` reads localStorage at module
// init, and ES imports are hoisted above any statement in this file - so a setItem here runs too
// late to be seen. An inline script before the module entry is early enough.
const R = run(SEED) as any
if (!R.ok) throw new Error(R.why)
if (!R.champion) throw new Error('this seed does not win the title')
;(window as any).__filmReport = {
  seed: SEED,
  event: R.event,
  entryFeeCents: R.entryFeeCents,
  travelCents: R.travelCents,
  prizeForChampionCents: R.prizeForChampionCents,
  fundsBefore: R.fundsBefore,
  fundsAfter: R.fundsAfter,
  net: R.net,
  incomeCents: R.incomeCents,
  spendCents: R.spendCents,
  points: R.points,
  matches: R.matches,
  rounds: R.rounds,
  coach: R.coach,
  ledger: R.ledger,
}

/** The final, built exactly as TournamentFlow builds it - same simulate + annotate, same options. */
const finalMatch = (() => {
  const m = R.stages.atFinal?.match
  if (!m) return null
  const opts = { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' }
  return { annotated: annotateMatch(simulateMatch(m.a, m.b, opts), m.a, m.b, opts), a: m.a, b: m.b, surface: m.surface }
})()

const SCENES = [
  { key: 'title', dur: 2.8, steps: [0, 1.5] },
  { key: 'moneyBefore', dur: 3.0 },
  { key: 'event', dur: 4.2, steps: [0, 2.6] },
  { key: 'coach', dur: 4.5 },
  { key: 'draw', dur: 3.5 },
  { key: 'match', dur: 4.0 },
  { key: 'champion', dur: 1.5 },
  { key: 'ledger', dur: 7.0, steps: [0, 1.8, 3.4, 5.0] },
  { key: 'compare', dur: 3.5 },
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
  const S = R.stages
  if (k === 'moneyBefore') game.snapshot = S.beforeEntry
  else if (k === 'event') game.snapshot = s === 0 ? S.beforeEntry : S.afterEntry
  else if (k === 'coach') game.snapshot = S.afterEntry
  else if (k === 'draw') game.snapshot = S.atDraw
  else if (k === 'match') game.snapshot = S.atFinal.snapshot
  else if (k === 'champion') game.snapshot = S.atChampion
  else if (k === 'ledger') game.snapshot = S.afterClose
}

/** The editorial band. Only these words, and never a number the engine did not produce. */
const overlay = computed(() => {
  switch (key.value) {
    case 'moneyBefore': return { title: 'BEFORE ENTRY', sub: '' }
    case 'event': return { title: 'JUNIOR TOUR 30', sub: 'Entry fee and travel out · prize money none' }
    case 'coach': return { title: 'THE COACH', sub: 'Hired – and no fare would send him to a junior event' }
    case 'draw': return { title: 'FIVE ROUNDS.', sub: 'No prize cheque.' }
    case 'match': return { title: 'THE FINAL', sub: `vs ${R.rounds[4].opponent}` }
    case 'champion': return { title: 'CHAMPION', sub: `${R.points} ranking points · no prize money` }
    case 'ledger': return { title: LEDGER_TAGS[sub.value], sub: '' }
    default: return null
  }
})
const LEDGER_TAGS = ['THE LEDGER', 'ENTRY FEE', 'HER TRAVEL', 'PRIZE MONEY: $0']

const money = (c: number) => formatCents(Math.abs(c))
const netLine = computed(() => `${R.net < 0 ? '-' : '+'}${money(R.net)}`)

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

/** The Money screen opens on Spending; the ledger lives behind its History tab. Pressed through the
 *  DOM rather than with the mouse, so no pointer is ever drawn into the frame. */
watch([key, ready], async () => {
  if (key.value !== 'ledger') return
  await nextTick()
  await new Promise((r) => setTimeout(r, 120))
  const tab = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'History')
  if (tab && !tab.classList.contains('active')) tab.click()
})

/** ⚠ THE ENTRY FEE IS THREE WEEKS UP THE LIST. History runs newest-first, so the W5 travel row is on
 *  screen while the W3 entry fee sits far below the fold - the beat would have annotated a row nobody
 *  could see. Each annotation brings its own row into view AT THE START of its step, so the frame is
 *  still by the time it is meant to be read. */
const LEDGER_ROW_TEXT: (string | null)[] = [null, 'Entry fee', 'Travel to Junior Tour 30', null]
watch(sub, async () => {
  if (key.value !== 'ledger') return
  const want = LEDGER_ROW_TEXT[sub.value]
  if (!want) return
  await nextTick()
  const row = [...document.querySelectorAll('li, tr, div')].find((n) => {
    const t = (n.textContent || '').trim()
    return t.startsWith(want) && t.length < 90
  })
  row?.scrollIntoView({ block: 'center' })
})
</script>

<template>
  <div v-if="ready" class="stage">
    <Transition name="mf">
      <div v-if="key === 'title'" key="title" class="card">
        <p class="card-line">SHE WON</p>
        <p class="card-line">THE TOURNAMENT.</p>
        <template v-if="sub >= 1">
          <p class="card-line accent gap">THE FAMILY</p>
          <p class="card-line accent">LOST MONEY.</p>
        </template>
      </div>

      <div v-else-if="key === 'compare'" key="compare" class="card cmp">
        <p class="cmp-label">BALANCE BEFORE</p>
        <p class="cmp-value">{{ money(R.fundsBefore) }}</p>
        <p class="cmp-label">BALANCE AFTER</p>
        <p class="cmp-value">{{ money(R.fundsAfter) }}</p>
        <p class="cmp-label">NET</p>
        <p class="cmp-value accent">{{ netLine }}</p>
        <p class="cmp-foot">A title, points and experience.<br />No prize money.</p>
      </div>

      <div v-else-if="key === 'question'" key="question" class="card">
        <p class="card-line">WOULD YOU</p>
        <p class="card-line accent">STILL ENTER HER?</p>
      </div>

      <div v-else :key="key" class="screen">
        <MoneyScreen v-if="key === 'moneyBefore' || key === 'ledger'" @navigate="() => {}" />
        <SeasonScreen v-else-if="key === 'event'" @navigate="() => {}" />
        <CoachMarketScreen v-else-if="key === 'coach'" @back="() => {}" />
        <TournamentFlow v-else />
      </div>
    </Transition>

    <!-- ⚠ THE FINAL PLAYS FROM THE FIRST FRAME OF THE FILM, not from the moment it is shown.
         MatchViewer starts at the first point when it MOUNTS, so cutting to a freshly mounted viewer
         showed the opening game of the final and a "Not started" momentum panel. Mounting it here,
         once, and only REVEALING it on its beat means the passage on screen is however far the real
         match has actually got by then. It is the same component playing the same real match. -->
    <!-- ⚠ THE REVEAL IS AN INLINE STYLE, NOT A CLASS. A `.matchlayer.on` rule that plainly declared
         `opacity: 1` computed to 0 on the live element while its z-index from the SAME rule applied,
         so the layer stayed invisible on its own beat. Inline wins outright and cannot be argued with. -->
    <div
      class="matchlayer"
      :style="{ opacity: key === 'match' ? 1 : 0, zIndex: key === 'match' ? 9998 : -1 }"
    >
      <MatchViewer
        v-if="finalMatch"
        :match="finalMatch.annotated"
        :player-a="finalMatch.a"
        :player-b="finalMatch.b"
        :surface="finalMatch.surface"
        :rank-a="null"
        :rank-b="null"
        mode="replay"
        proceed-label="To the result"
      />
    </div>

    <div v-if="overlay" class="ed">
      <p class="ed-title">{{ overlay.title }}</p>
      <p v-if="overlay.sub" class="ed-sub">{{ overlay.sub }}</p>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; min-height: 100vh; background: var(--bg); }
/* Behind the opaque stage while it warms up, in front of it on its beat. */
.matchlayer {
  position: fixed; inset: 0; z-index: -1; opacity: 0; overflow: hidden; background: var(--bg);
  pointer-events: none;
}
.matchlayer { transition: opacity 300ms ease; }
.screen { min-height: 100vh; }
.mf-enter-active, .mf-leave-active { transition: opacity 300ms ease; }
.mf-enter-from, .mf-leave-to { opacity: 0; }
.mf-leave-active { position: absolute; inset: 0; }

.card {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 24px 26px; box-sizing: border-box; background: var(--bg); text-align: center;
}
.card-line {
  margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 34px; line-height: 1.16;
  letter-spacing: -0.01em; color: #fff;
}
.card-line.accent { color: var(--tb-accent, #c6f24e); }
.gap { margin-top: 18px; }

.cmp { gap: 0; }
.cmp-label {
  margin: 14px 0 0; font-family: var(--font-heading); font-size: 12px; letter-spacing: 0.16em;
  color: #fff; opacity: 0.5;
}
.cmp-value {
  margin: 2px 0 0; font-family: var(--font-heading); font-weight: 600; font-size: 34px; color: #fff;
  font-variant-numeric: tabular-nums;
}
.cmp-value.accent { color: var(--tb-accent, #c6f24e); }
.cmp-foot { margin: 26px 0 0; font-family: var(--font-body); font-size: 15px; line-height: 1.45; color: #fff; opacity: 0.75; }

/* FIXED, not absolute: the screens scroll, and an absolute band sits at the bottom of the stage.
   ⚠ AND ABOVE THE TAKEOVER. TournamentFlow renders through `TakeoverShell`, a full-screen surface
   with its own stacking - it covered both this band and the match layer, so the final beat showed
   the takeover with no band at all. */
.ed {
  position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 18px 18px; z-index: 9999;
  background: linear-gradient(to top, rgba(6, 9, 13, 0.94) 62%, rgba(6, 9, 13, 0));
  border-left: 3px solid var(--tb-accent, #c6f24e); pointer-events: none;
}
.ed-title { margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 19px; color: var(--tb-accent, #c6f24e); }
.ed-sub { margin: 2px 0 0; font-family: var(--font-body); font-size: 13px; color: #fff; opacity: 0.82; }
</style>
