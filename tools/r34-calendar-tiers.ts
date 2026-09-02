// ROUND 34 #14 – WHAT THE CALENDAR GENERATES AT WORLD RANK ~105, AND WHAT IT SHOWS HER.
//
//   npx vite-node tools/r34-calendar-tiers.ts [--target 105] [--seeds 4]
//
// HIS WORDS: «на 105 месте доступны 50, 250, 500 и шлемы, при этом нет 75, 100 и 125. Мне кажется,
// они прячутся на тех же неделях».
//
// THE CLAIM IS PRECISE AND SO IS THE MEASUREMENT. It walks a real career to the target WTA rank,
// then records ONE FULL SEASON week by week through the SHIPPED predicates the two calendar
// surfaces use – `toSnapshot` for the cards, `feedContext` / `feedShows` / `preferredWeekEvent`
// for the row – so the table below cannot disagree with the screen by construction. Per season:
//
//   GENERATED   events `buildSeason` put on the season, by rung
//   IN WINDOW   ...that reached `snapshot.upcoming` at all (the 8-week horizon, walked)
//   SHOWN       ...that any calendar row actually rendered
//   HIDDEN BY   which rung took the slot from it, when it lost one
//
// Zero engine changes, zero draws of its own: it reads the world the bench built.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { answerFork, answerRetirement, toSnapshot, type WorldState } from '../src/engine/world'
import { rankIn } from '../src/engine/world/ladder'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const TARGET = argOf('target', 105)
const BAND = argOf('band', 25)
const SEEDS = argOf('seeds', 4)
const MAX_WEEKS = argOf('max', 20 * WEEKS_PER_YEAR)

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

interface Row {
  generated: number
  inWindow: number
  offered: number
  shown: number
  hiddenBy: Map<TierId, number>
}

function emptyRow(): Row {
  return { generated: 0, inWindow: 0, offered: 0, shown: 0, hiddenBy: new Map() }
}

function measureOne(presetIndex: number, seedIndex: number): void {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[1])
  let found = false
  for (let w = 0; w < MAX_WEEKS; w++) {
    answerWhateverIsOpen(world)
    if (world.ending) break
    stepCareerWeek(world, rng, POLICIES[1])
    const r = rankIn(world, 'wta')
    if (r > 0 && Math.abs(r - TARGET) <= BAND && world.week % WEEKS_PER_YEAR < 2) {
      found = true
      break
    }
  }
  if (!found) {
    console.log(`  seed ${presetIndex}/${seedIndex}: never sat within ${BAND} of #${TARGET} at a season start`)
    return
  }

  const startWeek = world.week
  const rankAtStart = rankIn(world, 'wta')
  const ageAtStart = toSnapshot(world).ageYears
  const byTier = new Map<TierId, Row>(TIER_LADDER.map((t) => [t, emptyRow()]))
  // What the season holds on the coming 52 weeks, before a single row is drawn.
  // ⚠ CAPTURED UP FRONT AND BY ID: `world.season` is pruned as the weeks pass, so an accounting
  // pass over it AFTER the walk sees only the tail.
  const generated = new Map<string, TierId>()
  const seasonWeeks = new Set<number>()
  for (const e of world.season) {
    if (e.week <= startWeek || e.week > startWeek + WEEKS_PER_YEAR) continue
    byTier.get(e.tier)!.generated++
    generated.set(e.id, e.tier)
    seasonWeeks.add(e.week)
  }
  const everInWindow = new Set<string>()
  const everShown = new Set<string>()
  const lostTo = new Map<string, TierId>()
  const everOffered = new Set<string>()
  const shownOnWeek = new Map<number, TierId>()
  let rankLo = rankIn(world, 'wta')
  let rankHi = rankLo

  // THE WINDOW AT THE START – which rungs the engine holds open, and what it says about the rest.
  const snap0 = toSnapshot(world)
  const windowLine = TIER_LADDER.filter((t) => snap0.tierOpen?.[t]).map((t) => TIER_SHORT[t]).join(' ')
  console.log(`\n  ${PRESETS[presetIndex].label}  seed ${seedIndex} – week ${startWeek}, age ${ageAtStart}, WTA #${rankAtStart}`)
  console.log(`    engine window : ${windowLine}`)
  for (const t of TIER_LADDER) {
    if (snap0.tierOpen?.[t]) continue
    const r = snap0.tierRefusal?.[t]
    console.log(`    shut ${TIER_SHORT[t].padEnd(7)}: ${r ? `${r.reason} – ${r.detail ?? ''}` : 'no refusal projected'}`)
  }

  for (let w = 0; w < WEEKS_PER_YEAR; w++) {
    answerWhateverIsOpen(world)
    if (world.ending) break
    const snap = toSnapshot(world)
    const feed = feedContext({
      ageYears: snap.ageYears,
      tierOpen: snap.tierOpen,
      activeLadder: snap.activeLadder,
      upcoming: snap.upcoming,
    })
    for (const e of snap.upcoming) {
      if (e.week > startWeek + WEEKS_PER_YEAR) continue
      everInWindow.add(e.id)
    }
    // ONE ROW PER WEEK, the SeasonScreen's own collapse.
    const weeks = new Set(snap.upcoming.map((e) => e.week))
    for (const wk of weeks) {
      if (wk > startWeek + WEEKS_PER_YEAR) continue
      const candidates = snap.upcoming.filter((e) => e.week === wk && feedShows(e, feed))
      for (const c of candidates) everOffered.add(c.id)
      const picked = preferredWeekEvent(candidates)
      if (!picked) continue
      everShown.add(picked.id)
      shownOnWeek.set(wk, picked.tier)
      for (const c of candidates) if (c.id !== picked.id && !lostTo.has(c.id)) lostTo.set(c.id, picked.tier)
    }
    stepCareerWeek(world, rng, POLICIES[1])
    const r = rankIn(world, 'wta')
    if (r > 0) {
      rankLo = Math.min(rankLo, r)
      rankHi = Math.max(rankHi, r)
    }
  }

  for (const [id, tier] of generated) {
    const row = byTier.get(tier)!
    if (everInWindow.has(id)) row.inWindow++
    if (everOffered.has(id)) row.offered++
    if (everShown.has(id)) row.shown++
    else {
      const thief = lostTo.get(id)
      if (thief) row.hiddenBy.set(thief, (row.hiddenBy.get(thief) ?? 0) + 1)
    }
  }

  if (args.includes('--weeks')) {
    console.log(`    WEEK BY WEEK – ${seasonWeeks.size} eventful weeks of ${WEEKS_PER_YEAR}`)
    const perWeek = new Map<number, TierId[]>()
    for (const [id, tier] of generated) {
      const wk = Number(id.split('-w')[1].split('-')[0])
      perWeek.set(wk, [...(perWeek.get(wk) ?? []), tier])
    }
    for (const wk of [...perWeek.keys()].sort((a, b) => a - b)) {
      const gen = perWeek
        .get(wk)!
        .sort((a, b) => TIER_LADDER.indexOf(b) - TIER_LADDER.indexOf(a))
        .map((t) => TIER_SHORT[t])
        .join(' ')
      const shown = shownOnWeek.get(wk)
      console.log(`      w${String(wk).padStart(4)}  gen [${gen.padEnd(44)}]  shown ${shown ? TIER_SHORT[shown] : '–'}`)
    }
  }
  console.log(
    `    SUMMARY – ${seasonWeeks.size} eventful weeks of ${WEEKS_PER_YEAR}, WTA #${rankLo}..#${rankHi} across the season`,
  )
  console.log('    rung      generated   offered    shown   hidden by')
  for (const t of TIER_LADDER) {
    const r = byTier.get(t)!
    if (r.generated === 0) continue
    const thieves = [...r.hiddenBy.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${TIER_SHORT[k]} x${n}`)
      .join(', ')
    console.log(
      `    ${TIER_SHORT[t].padEnd(9)} ${String(r.generated).padStart(9)} ${String(r.offered).padStart(9)} ` +
        `${String(r.shown).padStart(8)}   ${thieves}`,
    )
  }
}

console.log(`ROUND 34 #14 – the calendar at WTA #${TARGET} (+-${BAND}), one full season per career`)
const PRESET_ARG = (() => {
  const i = args.indexOf('--presets')
  return i >= 0 && args[i + 1] ? args[i + 1].split(',').map(Number) : [8, 7, 6, 5]
})()
for (const p of PRESET_ARG) for (let s = 0; s < SEEDS; s++) measureOne(p, s)
