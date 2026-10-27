<script setup lang="ts">
// A FILM RIG FOR THE HERO SCREEN: Alice Martin across all five portrait bands.
//
// ⚠ WHAT IS REAL AND WHAT IS SET BY HAND.
//   REAL – the screen itself (`KidScreen.vue`, mounted, not rebuilt), the paintings
//          (`images/fem-euro-brunnet/fem-euro-brunnet-{stage}-norm.webp`), the band boundaries
//          (`portraitStage`: jun <11 · young 11-16 · teen 17-22 · adult 23-30 · milf 31+, the
//          owner's ruling of 27.07), the base snapshot (a real `createWorld` + `toSnapshot`), and
//          every tile's words - school and friends come from `buildKidLife()`, the engine's own
//          generator, called per age. Nothing on screen is copy written for the film.
//   SET BY HAND – her age at each frame, the coach rung, and her condition. That is what makes it a
//          slideshow rather than an eleven-year playthrough.
//
// ⚠ TWO BANDS CANNOT BE REACHED BY PLAYING, which is exactly why this is a rig and not a recording:
//   `jun` is under 11 and START_AGE is 14 (the childhood prologue is not built - `portraitStage`'s
//   own comment says the boundary was set where that prologue will need it), and `milf` starts at 31,
//   past `declineStart` 29 and the retirement fork. The paintings for both exist.
//
// ⚠ PLAIN `norm` FACES ONLY, by request - the adulthood set (graduated / bride / pregnant / retired
//   / farewell) is a separate clip. The portrait follows `snapshot.ageYears` through
//   `portraitStage()`, and the emotion follows `snapshot.diary.facts.emotion`, so setting those two
//   fields is the whole of it: no image path is ever written here.
import { onMounted, ref } from 'vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { buildKidLife } from '../../src/engine/kidLife'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { CoachTier } from '../../src/shared/protocol'

const SEED = 'alice-martin-2031'
const PROFILE = { ...DEFAULT_PROFILE, kidName: 'Alice', kidLastName: 'Martin' }

/** One frame per band. The age is a representative point INSIDE each band, not its edge. */
interface Frame {
  band: string
  age: number
  coach: CoachTier
  condition: number
}
// The coach rung climbs budget -> middle -> high -> elite across the career, starting at `self`
// (which IS the parent - COACH_TIERS is ['self', 'budget', 'middle', 'high', 'elite'] and only the
// last four are hireable). Coach NAMES are never written here: the row is picked out of the world's
// own generated `coachMarket`, so every name on screen is one the engine made.
const FRAMES: Frame[] = [
  { band: 'jun', age: 9, coach: 'self', condition: 92 },
  { band: 'young', age: 14, coach: 'budget', condition: 78 },
  { band: 'teen', age: 18, coach: 'middle', condition: 71 },
  { band: 'adult', age: 26, coach: 'high', condition: 66 },
  { band: 'milf', age: 33, coach: 'elite', condition: 58 },
]

const game = useGameStore()
const base = toSnapshot(createWorld(SEED, PROFILE))
const ready = ref(false)

/** ⚠ WARM EVERY PAINTING BEFORE THE FIRST CUT. The five bands are deliberately OUTSIDE the service
 *  worker's precache (vite.config: all of them at once would more than double the install), so they
 *  are fetched the moment an <img> binds them - which on a crossfade means the new age arrives as an
 *  empty frame. `art/preload.ts` exists for exactly this reason in the app; here it is enough to
 *  hold `ready` until all five have decoded. */
function warm(urls: string[]): Promise<unknown> {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const img = new Image()
          img.onload = img.onerror = res
          img.src = u
        }),
    ),
  )
}

/** The snapshot the Hero screen will render for one band. Only the fields the screen reads for age,
 *  coach, condition and the life tiles are touched; everything else stays as the engine built it. */
function snapshotFor(f: Frame) {
  const s = structuredClone(base) as any
  // ⚠ THE WEEK MUST MATCH THE AGE, INCLUDING BEFORE THE CAREER STARTS. Clamping it to 0 put "8th
  // grade" under a nine-year-old: `schoolTile` derives her cohort from the season year, so a week of
  // 0 always describes the fourteen-year-old she has not become yet. Weeks before week 0 are exactly
  // what the unbuilt childhood prologue would occupy, so the rig lets the number go negative.
  const week = (f.age - 14) * 52
  s.ageYears = f.age
  s.week = week
  s.condition = f.condition
  s.diary.facts.emotion = 'norm' // plain portrait, by request
  s.life = buildKidLife({
    seed: SEED,
    week,
    ageYears: f.age,
    seasonYear: 2031 + Math.floor(week / 52),
    playStyle: PROFILE.playStyle,
    birthMonth: PROFILE.birthMonth,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
  })
  // ⚠ THE COACH TILE READS `coachMarket.find(c => c.current)`, NOT `profile.coachTier` - "who she
  // trains with TODAY", as KidScreen's own comment puts it. Setting the profile rung did nothing and
  // left a middle-tier coach under the self-coached frame. Mark a REAL row of the wanted rung
  // instead, so the name is the engine's.
  s.profile = { ...s.profile, coachTier: f.coach }
  s.coachMarket = (s.coachMarket ?? []).map((c: any) => ({ ...c, current: false }))
  if (f.coach !== 'self') {
    const row = s.coachMarket.find((c: any) => c.tier === f.coach)
    if (row) row.current = true
    else if (s.coachMarket.length) s.coachMarket[0] = { ...s.coachMarket[0], tier: f.coach, current: true }
  }
  return s
}

const SHOTS = FRAMES.map(snapshotFor)
const HOLD = 4.2 // seconds per band
const index = ref(0)

const marks = FRAMES.map((f, i) => ({ band: f.band, age: f.age, index: i, start: i * HOLD, end: (i + 1) * HOLD }))

function show(i: number) {
  index.value = i
  game.snapshot = SHOTS[Math.min(SHOTS.length - 1, Math.max(0, i))]
}

onMounted(async () => {
  const w = window as any
  const bandOf = ['jun', 'young', 'teen', 'adult', 'milf']
  await warm(bandOf.map((b) => `${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-${b}-norm.webp`))
  show(0)
  ready.value = true
  w.__filmMarks = marks
  w.__filmPlan = { hold: HOLD, frames: FRAMES.length }
  w.__filmDone = false
  w.__filmSeek = (i: number) => show(i)
  // ⚠ NOT AUTO-STARTED, for the reason the skills rig is not: an rAF loop begun on mount runs while
  // the tab is busy and the first verification screenshot catches the film already over.
  w.__filmPlay = () => {
    const t0 = performance.now()
    w.__filmDone = false
    const total = FRAMES.length * HOLD
    const frame = () => {
      const t = (performance.now() - t0) / 1000
      show(Math.min(FRAMES.length - 1, Math.floor(t / HOLD)))
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
  <!-- A slideshow, so the ages CROSS-FADE rather than cut: `index` keys the screen, and the leaving
       copy is taken out of flow so both are painted at once. -->
  <Transition name="xfade">
    <KidScreen v-if="ready" :key="index" @navigate="() => {}" />
  </Transition>
</template>

<style>
.xfade-enter-active,
.xfade-leave-active {
  transition: opacity 620ms ease;
}
.xfade-enter-from,
.xfade-leave-to {
  opacity: 0;
}
.xfade-leave-active {
  position: absolute;
  inset: 0;
}
</style>
