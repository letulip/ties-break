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
// ⭐⭐⭐ ROUND 34 #14 SHIPPED THE DISPLAY FIX, SO THIS TOOL NOW PRINTS BOTH COLUMNS AT ONCE.
// `ONE-ROW` is the shipped-until-today collapse (`preferredWeekEvent`, one card per week) and
// `STACK` is what the screen draws now (`weekEventStack`, a card for every rung she may enter).
// ⚠ THE TWO ARMS ARE THE SAME WALK, NOT TWO RUNS. Both columns are folded from ONE career at the
// same weeks off the same snapshots, so the before/after cannot be a story about two different
// worlds – the only thing that differs between the columns is the display rule, which is the whole
// of what the item changed. That is the strongest control available for a display-only change, and
// it is why the tool was extended rather than re-run at two commits.
//
// Zero engine changes, zero draws of its own: it reads the world the bench built.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { answerFork, answerRetirement, toSnapshot, type WorldState } from '../src/engine/world'
import { rankIn } from '../src/engine/world/ladder'
import { eventActionable, feedContext, feedShows, preferredWeekEvent, weekEventStack } from '../src/composables/tierState'
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
const WHY = args.includes('--why')
const WHY_BY_TIER = new Map<TierId, Map<string, number>>(TIER_LADDER.map((t) => [t, new Map<string, number>()]))

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
  /** ROUND 34 #14: ...and how many of them the STACKED calendar shows */
  stacked: number
  /** ...and how many it would show if the OUTGROWN clause were dropped – priced, not shipped */
  stackedPlus: number
  hiddenBy: Map<TierId, number>
}

function emptyRow(): Row {
  return { generated: 0, inWindow: 0, offered: 0, shown: 0, stacked: 0, stackedPlus: 0, hiddenBy: new Map() }
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
  const everStacked = new Set<string>()
  const everStackedPlus = new Set<string>()
  const cardsOnWeek = new Map<number, number>()
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
      // ...and the SHIPPED collapse beside it, over the same candidates.
      const stack = weekEventStack(candidates, snap.week)
      for (const c of stack) everStacked.add(c.id)
      // ⚠ THE PRICE OF THE ONE CLAUSE THE RULING EXCLUDED, MEASURED RATHER THAN ARGUED. `weekEventStack`
      // refuses a second card to a rung she has OUTGROWN; this arm is the same rule without that
      // refusal. It is NOT what ships – it is here so the owner can see what the clause costs him on
      // exactly the rungs his item names, because `hasOutgrown` is true of W75/W100 at WTA #111 and
      // that is the single biggest reason the STACK column does not move them.
      for (const c of candidates) if (eventActionable(c, snap.week)) everStackedPlus.add(c.id)
      for (const c of stack) everStackedPlus.add(c.id)
      cardsOnWeek.set(wk, Math.max(cardsOnWeek.get(wk) ?? 0, stack.length))
      // ⚠ WHY A CANDIDATE DID NOT EARN ITS OWN CARD, which is the question the STACK column raises
      // the moment it fails to move a rung the owner named. A rung can lose a week to a taller one
      // AND be un-enterable on it; the display fix reaches the first and cannot reach the second.
      if (WHY && candidates.length > 1) {
        for (const c of candidates) {
          if (stack.some((x) => x.id === c.id)) continue
          const key = c.entered
            ? 'entered'
            : !c.eligible
              ? `not eligible: ${c.ineligibleReason ?? '?'}`
              : snap.week > c.deadlineWeek
                ? 'entries closed'
                : c.outgrown
                  ? 'outgrown'
                  : 'unknown'
          const bucket = WHY_BY_TIER.get(c.tier)!
          bucket.set(key, (bucket.get(key) ?? 0) + 1)
        }
      }
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
    if (everStacked.has(id)) row.stacked++
    if (everStackedPlus.has(id)) row.stackedPlus++
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
  console.log('    rung      generated   offered   ONE-ROW    STACK   hidden by (one-row)')
  for (const t of TIER_LADDER) {
    const r = byTier.get(t)!
    if (r.generated === 0) continue
    const thieves = [...r.hiddenBy.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${TIER_SHORT[k]} x${n}`)
      .join(', ')
    console.log(
      `    ${TIER_SHORT[t].padEnd(9)} ${String(r.generated).padStart(9)} ${String(r.offered).padStart(9)} ` +
        `${String(r.shown).padStart(9)} ${String(r.stacked).padStart(8)}   ${thieves}`,
    )
    const g = GLOBAL.get(t) ?? { generated: 0, shown: 0, stacked: 0, stackedPlus: 0, seasons: 0 }
    GLOBAL.set(t, {
      generated: g.generated + r.generated,
      shown: g.shown + r.shown,
      stacked: g.stacked + r.stacked,
      stackedPlus: g.stackedPlus + r.stackedPlus,
      seasons: g.seasons + 1,
    })
  }
  const weeksWithCards = [...cardsOnWeek.values()].filter((n) => n > 0).length
  const stackedWeeks = [...cardsOnWeek.values()].filter((n) => n > 1).length
  const totalCards = [...cardsOnWeek.values()].reduce((a, b) => a + b, 0)
  console.log(
    `    WEEKS – ${weeksWithCards} of ${WEEKS_PER_YEAR} drew a card, ${stackedWeeks} of them drew MORE THAN ONE; ` +
      `${totalCards} cards against ${weeksWithCards} rows`,
  )
  SEASONS.push({ weeksWithCards, stackedWeeks, totalCards })
}

/** The per-rung fold across every season walked – "rows a season", which is the column bundle B's
 *  table is ordered by and the one that reproduced his «доступны / нет» split. */
const GLOBAL = new Map<TierId, { generated: number; shown: number; stacked: number; stackedPlus: number; seasons: number }>()
const SEASONS: { weeksWithCards: number; stackedWeeks: number; totalCards: number }[] = []

console.log(`ROUND 34 #14 – the calendar at WTA #${TARGET} (+-${BAND}), one full season per career`)
const PRESET_ARG = (() => {
  const i = args.indexOf('--presets')
  return i >= 0 && args[i + 1] ? args[i + 1].split(',').map(Number) : [8, 7, 6, 5]
})()
for (const p of PRESET_ARG) for (let s = 0; s < SEEDS; s++) measureOne(p, s)

// =================================================================================================
// ⭐ THE COLUMN BUNDLE B'S TABLE IS ORDERED BY – rows a season, per rung, before and after.
// =================================================================================================
if (SEASONS.length) {
  console.log('\n==================================================================================')
  console.log(`ROWS A SEASON, over ${SEASONS.length} measured seasons`)
  console.log('  rung      gen/season   ONE-ROW   STACK   delta    (+outgrown, priced not shipped)')
  for (const t of TIER_LADDER) {
    const g = GLOBAL.get(t)
    if (!g || g.seasons === 0 || g.generated === 0) continue
    const per = (n: number) => (n / g.seasons).toFixed(1)
    console.log(
      `  ${TIER_SHORT[t].padEnd(9)} ${per(g.generated).padStart(10)} ${per(g.shown).padStart(9)} ` +
        `${per(g.stacked).padStart(7)}   +${((g.stacked - g.shown) / g.seasons).toFixed(1)}` +
        `        ${per(g.stackedPlus)}`,
    )
  }
  const sum = (k: 'weeksWithCards' | 'stackedWeeks' | 'totalCards') =>
    SEASONS.reduce((a, s2) => a + s2[k], 0) / SEASONS.length
  console.log(
    `\n  a season draws ${sum('weeksWithCards').toFixed(1)} eventful weeks; ${sum('stackedWeeks').toFixed(1)} of them ` +
      `now carry more than one card, ${sum('totalCards').toFixed(1)} cards in all`,
  )
}

if (WHY) {
  console.log('\nWHY A CANDIDATE DREW NO CARD OF ITS OWN – every stacked-week loser, by rung')
  for (const t of TIER_LADDER) {
    const b = WHY_BY_TIER.get(t)!
    if (!b.size) continue
    console.log(`  ${TIER_SHORT[t].padEnd(9)} ${[...b.entries()].sort((a, c) => c[1] - a[1]).map(([k, n]) => `${k} x${n}`).join(', ')}`)
  }
}
