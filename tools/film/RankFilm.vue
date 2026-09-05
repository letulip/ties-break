<script setup lang="ts">
// THREE RANKINGS, ONE CAREER. A real National Series title, then a real Junior Tour 30 semifinal,
// so the two tables can be seen not talking to each other.
//
// ⚠ NOTHING IS SET. Both tournaments are entered with `enterEvent`, played by `tickWeek` and
// resolved by `revealTournamentRound`/`closeTournament`; every rank, point total, counting result
// and W-L is whatever `recomputeKidRank` + `toSnapshot` produced. The summary card reads its numbers
// out of the final snapshot rather than repeating anything typed here.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { LADDER_LABEL } from '../../src/shared/protocol'
import { run } from './rankings'

const SEED = 's5'
const BASE = 62
const R = run(SEED, BASE) as any
if (!R.ok) throw new Error(R.why)
if (!R.natChampion) throw new Error('this seed does not win the National Series')
if (!R.j30Semi) throw new Error('this seed does not reach the Junior Tour semifinal')

const L = (snap: any, t: string) => snap.ladders[t]
const rankText = (l: any) => (l.rank == null ? 'Unranked' : `#${l.rank}`)
;(window as any).__filmReport = {
  seed: SEED,
  skillBase: BASE,
  ageYears: R.afterJ30.ageYears,
  natEventWeek: R.nat.event.week,
  j30EventWeek: R.j30.event.week,
  before: { dom: L(R.startSnap, 'domestic'), itf: L(R.startSnap, 'itf'), wta: L(R.startSnap, 'wta') },
  afterNational: { dom: L(R.afterNational, 'domestic'), itf: L(R.afterNational, 'itf'), wta: L(R.afterNational, 'wta') },
  afterJ30: { dom: L(R.afterJ30, 'domestic'), itf: L(R.afterJ30, 'itf'), wta: L(R.afterJ30, 'wta') },
  natPointsAwarded: R.nat.points,
  j30PointsAwarded: R.j30.points,
}

/** The summary card's three lines, read straight out of the final snapshot. */
const FINAL = {
  national: L(R.afterJ30, 'domestic'),
  international: L(R.afterJ30, 'itf'),
  professional: L(R.afterJ30, 'wta'),
}

const SCENES = [
  { key: 'natWin', dur: 3.7, snap: () => R.nat.atEnd },
  { key: 'statsNat', dur: 4.4, snap: () => R.afterNational, tab: 'National', showCounting: 1900 },
  { key: 'statsIntl', dur: 4.3, snap: () => R.afterNational, tab: 'International' },
  { key: 'statsPro', dur: 2.7, snap: () => R.afterNational, tab: 'Professional' },
  { key: 'door', dur: 4.0, snap: () => R.afterNational },
  { key: 'j30', dur: 4.0, snap: () => R.j30.atEnd },
  { key: 'statsIntl2', dur: 5.4, snap: () => R.afterJ30, tab: 'International', showCounting: 2300 },
  { key: 'summary', dur: 4.0 },
  { key: 'question', dur: 2.5 },
] as const

const game = useGameStore()
const scene = ref(0)
const key = computed(() => SCENES[scene.value].key)
const ready = ref(false)

function paint(i: number) {
  scene.value = i
  const s = SCENES[i] as any
  if (s.snap) game.snapshot = s.snap()
}

const overlay = computed(() => {
  switch (key.value) {
    case 'natWin': return { title: 'NATIONAL SERIES CHAMPION', sub: '+200 National points' }
    case 'statsNat': return { title: 'A MAJOR RESULT AT HOME.', sub: '' }
    case 'statsIntl': return { title: 'BUT ZERO INTERNATIONAL POINTS.', sub: '' }
    case 'statsPro': return { title: 'AND ZERO PROFESSIONAL POINTS.', sub: '' }
    case 'door': return { title: 'NATIONAL RESULTS OPEN THE DOOR.', sub: 'The points do not cross it.' }
    case 'j30': return { title: 'JUNIOR TOUR 30 – SEMIFINAL', sub: '+9 International points' }
    case 'statsIntl2': return { title: 'NOW SHE IS INTERNATIONALLY RANKED.', sub: '' }
    default: return null
  }
})

const marks = (() => { let t = 0; return SCENES.map((s) => { const m = { key: s.key, start: t, end: t + s.dur }; t += s.dur; return m }) })()
const TOTAL = marks[marks.length - 1].end

onMounted(() => {
  const w = window as any
  paint(0)
  ready.value = true
  w.__filmMarks = marks
  w.__filmTotal = TOTAL
  w.__filmDone = false
  w.__filmSeek = (i: number) => paint(i)
  w.__filmPlay = () => {
    const t0 = performance.now()
    w.__filmDone = false
    const frame = () => {
      const t = (performance.now() - t0) / 1000
      let i = marks.findIndex((m) => t >= m.start && t < m.end)
      if (i < 0) i = t >= TOTAL ? SCENES.length - 1 : 0
      if (i !== scene.value) paint(i)
      if (t >= TOTAL) { w.__filmDone = true; return }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }
})

/** The ranking table is behind a SegmentedRow. Pressed through the DOM, so no pointer is drawn. */
watch([key, ready], async () => {
  const want = (SCENES[scene.value] as any).tab as string | undefined
  if (!want) return
  await nextTick()
  await new Promise((r) => setTimeout(r, 360)) // past the crossfade, so only the live screen is present
  const pills = [...document.querySelectorAll('.tab-pill')].filter((b) => b.textContent?.trim() === want)
  const pill = pills[pills.length - 1] as HTMLElement | undefined
  if (pill && pill.getAttribute('aria-pressed') !== 'true') pill.click()

  // ⚠ THE COUNTING RESULTS ARE BELOW THE FOLD. The brief asks for the National title and the J30
  // semifinal to be SEEN in the counting-results table, and the standings push them off screen.
  // Hold the top of the table first, then bring the counting results up once and stop - a frame that
  // is meant to be read is never moving while it is read.
  const scrollAt = (SCENES[scene.value] as any).showCounting as number | undefined
  if (!scrollAt) return
  const mine = scene.value
  setTimeout(() => {
    if (scene.value !== mine) return
    const heads = [...document.querySelectorAll('h2, h3, .tb-eyebrow')]
    const head = heads.reverse().find((n) => /counting results/i.test(n.textContent || ''))
    head?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, scrollAt)
})
</script>

<template>
  <div v-if="ready" class="stage">
    <Transition name="rf">
      <div v-if="key === 'summary'" key="summary" class="card">
        <div class="row">
          <p class="row-label">{{ LADDER_LABEL.domestic }}</p>
          <p class="row-value">{{ rankText(FINAL.national) }} · {{ FINAL.national.points }} points</p>
        </div>
        <div class="row">
          <p class="row-label">{{ LADDER_LABEL.itf }}</p>
          <p class="row-value">{{ rankText(FINAL.international) }} · {{ FINAL.international.points }} points</p>
        </div>
        <div class="row">
          <p class="row-label">{{ LADDER_LABEL.wta }}</p>
          <p class="row-value">{{ rankText(FINAL.professional) }} · {{ FINAL.professional.points }} points</p>
        </div>
        <p class="card-line closing">ONE CAREER.</p>
        <p class="card-line accent">THREE DIFFERENT RECORDS.</p>
      </div>

      <div v-else-if="key === 'question'" key="question" class="card">
        <p class="card-line">WHICH RANKING</p>
        <p class="card-line accent">WOULD YOU CHASE NEXT?</p>
      </div>

      <!-- ⚠ ONE StatsScreen ACROSS ALL THREE TABS. Keying it by scene destroyed and rebuilt it on
           every beat, which reset the switch to National AND left the outgoing copy in the DOM for
           the 300ms crossfade - so the tab press landed on the screen that was leaving and all three
           beats filmed the National table while the captions said otherwise. A stable key keeps the
           real screen mounted and lets the press do what a tap does. -->
      <div v-else :key="key.startsWith('stats') ? 'stats' : key" class="screen">
        <StatsScreen v-if="key.startsWith('stats')" @navigate="() => {}" />
        <SeasonScreen v-else-if="key === 'door'" @navigate="() => {}" />
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
.rf-enter-active, .rf-leave-active { transition: opacity 300ms ease; }
.rf-enter-from, .rf-leave-to { opacity: 0; }
.rf-leave-active { position: absolute; inset: 0; }

.card {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0; padding: 24px 26px; box-sizing: border-box; background: var(--bg); text-align: center;
}
.row { margin-bottom: 20px; }
.row-label {
  margin: 0; font-family: var(--font-heading); font-size: 12px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--tb-accent, #c6f24e);
}
.row-value {
  margin: 3px 0 0; font-family: var(--font-heading); font-weight: 600; font-size: 27px; color: #fff;
  font-variant-numeric: tabular-nums;
}
.card-line {
  margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 29px; line-height: 1.18;
  color: #fff;
}
.card-line.accent { color: var(--tb-accent, #c6f24e); }
.closing { margin-top: 16px; }

/* FIXED and above the takeover: TournamentFlow renders through TakeoverShell, which otherwise
   covers this band entirely. */
.ed {
  position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 18px 18px; z-index: 9999;
  background: linear-gradient(to top, rgba(6, 9, 13, 0.94) 62%, rgba(6, 9, 13, 0));
  border-left: 3px solid var(--tb-accent, #c6f24e); pointer-events: none;
}
.ed-title { margin: 0; font-family: var(--font-heading); font-weight: 600; font-size: 18px; color: var(--tb-accent, #c6f24e); }
.ed-sub { margin: 2px 0 0; font-family: var(--font-body); font-size: 13px; color: #fff; opacity: 0.82; }
</style>
