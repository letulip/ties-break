/**
 * r42-cameo-gap-closer – ROUND 42 #47. THE LOCAL SPONSOR STOPS BEING A LOTTERY AND STARTS CLOSING
 * TRIPS.
 *
 * THE OWNER, 15.09, recovering what he first asked for: «мы не фиксируем эти разрывы, а выдаём в
 * край нужды для закрытия поездок, самый сложный этап J серия, там самые большие расходы», and then
 * the number: «давай что-то вроде 60-80% закрытия попробуем сделать». So the cameo is `shortfall ×
 * U(0.60, 0.80)` on its own purpose-scoped stream – **help is real, and a missed trip stays
 * possible**, which is what separates a sponsor from a safety net.
 *
 * ⚠⚠ THE THREE PRINTS HIS OWN BRIEF ASKS FOR, because a fraction of a gap behaves unlike a flat gift:
 *   §2  how often the family closes the REMAINING share and goes;
 *   §3  how often it cannot and the trip is missed anyway;
 *   §4  what the gift is WORTH in dollars a season, against #43's measured **$1,125**.
 * A percentage of a J-series travel bill may be larger or smaller than the flat draw it replaced,
 * and nobody should be surprised by which.
 *
 * ⚠ IT FOLLOWS THE ENGINE'S OWN TRIP, never a second copy of the rule. `unpayableTrip`
 * (world/phaseFinance.ts) returns the event id as well as the number precisely so this bench can
 * carry that id forward to its week and ask whether she went. A bench that re-derived "which trip
 * the engine meant" would be the liveProb rotation bug wearing a different hat.
 *
 * ⚠ THE ONE APPROXIMATION, NAMED: the probe is asked at the TOP of the week and the engine asks it
 * in phase 2, after the week's training bill has been taken. So the bench's gap is the same trip one
 * bill earlier, and its shortfall is a lower bound on the engine's by that bill. It cannot change
 * WHICH trip is named (the bill does not move a deadline or a gate) and the §2/§3 columns – did she
 * go, or was it missed – are read off the world afterwards and are exact.
 *
 * ⚠⚠ THE ARMS NO LONGER ACTUATE ANYTHING – see `SHIPPED_SHARE`. They mutated `ECONOMY.sponsor.gapShare`
 * in place (the house bench pattern) until #47's second reading deleted that constant on 16.09
 * (`tools/r42-elite-retainer.ts`, `tools/sponsor-cadence.ts`), so BOTH arms contain the reader and
 * only the constant differs – the arm-provenance rule stated the right way round.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law).
 *
 * ZERO RNG DISCIPLINE: the walk is `econ-bench`'s own `openCareer`/`stepCareerWeek`; this file draws
 * nothing itself and constructs no stream. MAIN is reached only by the tick, exactly as a real week
 * reaches it.
 *
 * Run:
 *   npx vite-node tools/r42-cameo-gap-closer.ts
 *   npx vite-node tools/r42-cameo-gap-closer.ts -- --seeds 8 --weeks 312
 */
// ⚠ `ECONOMY` was imported here only for the deleted `gapShare` dial (see `armShare`). The cameo's
// band now lives in `ECONOMY.sponsor.amountCents` and the engine reads it directly; this bench does
// not need to see it, and an unused import is how a dead arm hides.
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { unpayableTrip } from '../src/engine/world/phaseFinance'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET; n = seeds × PRESETS.length careers per arm. */
const SEEDS = argOf('seeds', 6)
/** Six seasons from 14: the whole junior block and the first professional years, which is where the
 *  J-series bill he named actually lands. */
const WEEKS = argOf('weeks', 6 * WEEKS_PER_YEAR)
/** ⚠ `POLICIES[1]` ('player'), the same choice #25, #41 and #19 made: it keeps a reserve and refuses
 *  entries it cannot afford, so «the trip is missed» is a decision this corpus actually makes. The
 *  'grinder' arm keeps no reserve and never misses a trip for money, which would make §3 read 0.0%
 *  for a reason that has nothing to do with the sponsor. */
const POLICY = POLICIES[1]

/** ⚠ INVARIANT 4 – this string is READ, never written. It is the engine's own line and the only
 *  honest way to find a cameo in the feed: `financeWeeks.byCategory.sponsor` cannot tell a cameo
 *  from a retainer or an ad cheque (five call sites book that category). Same reader
 *  `tools/sponsor-cadence.ts` uses. */
const CAMEO_LINE = 'A local sponsor chipped in!'

const m = (c: number): string => `$${Math.round(c / 100).toLocaleString('en-US')}`
const padL = (s: string, n: number): string => s.padStart(n)
const padR = (s: string, n: number): string => s.padEnd(n)
const pct = (num: number, den: number): string => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '–')
const med = (xs: number[]): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

// =================================================================================================
// THE ARMS
// =================================================================================================

interface Arm {
  label: string
  share: [number, number]
}
/** ⚠⚠ RETIRED WITH ITS CONSTANT, 16.09.2026 – ROUND 42 #47's SECOND READING. `ECONOMY.sponsor.gapShare`
 *  no longer exists: the owner's «60-80% закрытия» is a FREQUENCY and this instrument was built to
 *  measure it as a fraction of a sum. The arms below therefore sweep a LOCAL number that nothing in
 *  the engine reads, and every table this tool prints about cheque SIZE is now a historical record of
 *  a mechanic that shipped for one day.
 *
 *  ⭐ WHAT STILL WORKS AND IS WORTH RE-RUNNING: the `unpayableTrip` probe, the need-week census and
 *  the J-series split – those measure the GATE, which survived the correction intact and is the half
 *  the next wave has to re-derive. The coverage question («60-80% of need cases receive help», about
 *  4% today) is `docs/specs/cameo-gap-closer-corrected-2026-09.md` §3 and P1, and this harness is
 *  where it should be measured. Do not delete this file; re-aim it when that bench is written. */
const SHIPPED_SHARE: [number, number] = [0.6, 0.8]
const ARMS: Arm[] = [
  /** ⚠⚠ THE ACTUATION ARM, AND IT IS THE FLOOR RATHER THAN A CEILING. A share of zero writes a
   *  cheque of zero on every week the gate opens, so §2/§3/§4 must collapse – if they do not, this
   *  bench is not reading the mechanic it claims to read and every table below is a null («prove the
   *  arm», CLAUDE.md, in the direction that cannot be faked by a dead wire). */
  { label: '0 · ACTUATION (share 0 – the cheque is nothing)', share: [0, 0] },
  /** ⚠ AND THE OTHER DIRECTION, because a floor alone cannot show the mechanic is SIZED. An absurd
   *  share pays several times the gap; the money and the «went» column must both explode. */
  { label: '0b · ACTUATION (share 3.0 – absurd)', share: [3, 3] },
  /** ⭐ WHAT SHIPS – his number. */
  { label: 'B · HIS RULING – 60-80% of the gap ⭐', share: SHIPPED_SHARE },
  /** ⚠ THE DESIGN'S OWN CONTRAST, and the reason the ceiling is below 1. A share of exactly 1 closes
   *  every gap outright: the §3 column is what «a missed trip stays possible» costs, and this row is
   *  what it would have bought. Not a proposal – a price tag on his sentence. */
  { label: '   1.0 – the safety net he refused', share: [1, 1] },
]

/** ⚠ `ECONOMY` is `as const`; an arm reaches it through the cast the house benches already use. */
/** ⚠⚠ THE DIAL IS GONE AND THE CAST THAT SURVIVED IT WAS A LIE WORTH DELETING. This read
 *  `ECONOMY.sponsor as unknown as { gapShare }` – a cast, so it kept TYPECHECKING after the constant
 *  was deleted, and every arm below went on WRITING a property no engine code reads. A bench whose
 *  actuation is a no-op reports a null result that looks like a measurement, which is the exact
 *  failure CLAUDE.md's «prove the arm contains both the change and its reader» rule exists to stop.
 *  So the write is deleted rather than left casting, and the sweep is now explicitly local. */
const armShare: { value: [number, number] } = { value: [...SHIPPED_SHARE] as [number, number] }

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Cheque {
  week: number
  giftCents: number
  /** the gap the bench saw at the top of that week, and the trip it belonged to */
  gapCents: number
  eventId: string
  eventWeek: number
  /** the rung the named trip is on – §7's whole subject */
  tier: string
  /** did she end up entered in that very event? */
  went: boolean
}

interface CareerRead {
  background: string
  seasons: number
  cheques: Cheque[]
  centsTotal: number
  /** weeks the probe found an unpayable trip at all – the denominator «need» rather than «help» */
  gapWeeks: number
  /** distinct trips the probe named that she never entered, whatever the sponsor did */
  tripsNamed: number
  tripsMissed: number
  /** every named trip's rung, with whether she ever went – §7 */
  namedTiers: { tier: string; went: boolean }[]
}

function runCareer(presetIndex: number, seedIndex: number): CareerRead {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICY)
  const cheques: Cheque[] = []
  let centsTotal = 0
  let gapWeeks = 0
  // eventId -> the rung it is on; resolved at the end against the entries she actually made.
  const named = new Map<string, string>()
  const everEntered = new Set<string>()
  for (let w = 0; w < WEEKS; w++) {
    const trip = unpayableTrip(world)
    let tripTier = ''
    if (trip) {
      gapWeeks++
      tripTier = world.season.find((e) => e.id === trip.eventId)?.tier ?? ''
      named.set(trip.eventId, tripTier)
    }
    stepCareerWeek(world, rng, POLICY)
    if (world.ending) break
    for (const id of world.entries) everEntered.add(id)
    for (const e of world.events) {
      if (e.week === world.week && e.category === 'sponsor' && e.text === CAMEO_LINE) {
        const gift = e.amountCents ?? 0
        centsTotal += gift
        cheques.push({
          week: e.week,
          giftCents: gift,
          gapCents: trip?.shortfallCents ?? 0,
          eventId: trip?.eventId ?? '',
          eventWeek: trip?.eventWeek ?? -1,
          tier: tripTier,
          went: false,
        })
      }
    }
  }
  // ⚠ RESOLVED AFTER THE WALK, NOT DURING IT. `world.entries` is pruned as events pass, so asking
  // «is she in it» on the week the cheque landed would answer about a list that has not been written
  // yet, and asking at the end would answer about a list that has already been emptied. The set
  // above accumulates every id the career was ever entered in, which is the only durable record of
  // «she went» that survives a six-season walk.
  for (const c of cheques) c.went = c.eventId !== '' && everEntered.has(c.eventId)
  let tripsMissed = 0
  const namedTiers: { tier: string; went: boolean }[] = []
  for (const [id, tier] of named) {
    const went = everEntered.has(id)
    if (!went) tripsMissed++
    namedTiers.push({ tier, went })
  }
  return {
    background: preset.background,
    seasons: Math.max(1, Math.ceil(WEEKS / WEEKS_PER_YEAR)),
    cheques,
    centsTotal,
    gapWeeks,
    tripsNamed: named.size,
    tripsMissed,
    namedTiers,
  }
}

function runArm(arm: Arm): CareerRead[] {
  armShare.value = [...arm.share] as [number, number]
  void armShare
  const out: CareerRead[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < SEEDS; s++) out.push(runCareer(p, s))
  }
  return out
}

// =================================================================================================
// THE REPORT
// =================================================================================================

function header(title: string): void {
  console.log(`\n================================================================================`)
  console.log(title)
  console.log('================================================================================')
}

function main(): void {
  console.log('r42-cameo-gap-closer – round 42 #47: the local sponsor closes a trip, not a lottery')
  console.log(
    `  ${SEEDS} seeds x ${PRESETS.length} presets = ${SEEDS * PRESETS.length} careers per arm, ` +
      `${WEEKS} weeks (${(WEEKS / WEEKS_PER_YEAR).toFixed(0)} seasons from 14), policy '${POLICY.label}'`,
  )
  console.log(`  shipped gapShare = [${SHIPPED_SHARE[0]}, ${SHIPPED_SHARE[1]}]`)

  const runs = ARMS.map((arm) => ({ arm, rows: runArm(arm) }))

  header('§1  THE CADENCE IS UNTOUCHED – the cooldown and the need gate are still the floor')
  console.log('    ⚠ #47 sized the cheque; it did not re-tune when one may be written. What CAN move')
  console.log('      is how often a willing week finds no unpayable trip and therefore writes nothing.')
  console.log(`\n  ${padR('arm', 46)}${padL('cheques/season', 16)}${padL('gap weeks/season', 18)}`)
  for (const { arm, rows } of runs) {
    const seasons = rows.reduce((s, r) => s + r.seasons, 0)
    const cheques = rows.reduce((s, r) => s + r.cheques.length, 0)
    const gaps = rows.reduce((s, r) => s + r.gapWeeks, 0)
    console.log(`  ${padR(arm.label, 46)}${padL((cheques / seasons).toFixed(2), 16)}${padL((gaps / seasons).toFixed(1), 18)}`)
  }

  header('§2  SHE CLOSED THE REST AND WENT – of the trips a cheque was written for')
  console.log('    ⚠ THE DENOMINATOR IS CHEQUES, NOT NEED. «She went» means the family found the last')
  console.log('      20-40% itself and entered THAT event – the one the engine sized the gift against.')
  console.log(`\n  ${padR('arm', 46)}${padL('cheques', 10)}${padL('went', 10)}${padL('share', 10)}`)
  for (const { arm, rows } of runs) {
    const all = rows.flatMap((r) => r.cheques)
    const went = all.filter((c) => c.went).length
    console.log(`  ${padR(arm.label, 46)}${padL(String(all.length), 10)}${padL(String(went), 10)}${padL(pct(went, all.length), 10)}`)
  }

  header('§3  AND THE TRIP IS STILL MISSED SOMETIMES – which is the design, not a shortfall')
  console.log('    ⚠ TWO DIFFERENT QUESTIONS, both printed. «after a cheque» is his: the shop helped')
  console.log('      and it still was not enough. «of every named trip» is the wider one: every trip')
  console.log('      the probe found unpayable, cheque or no cheque, that she never entered.')
  console.log(`\n  ${padR('arm', 46)}${padL('missed after a cheque', 24)}${padL('missed of all named', 22)}`)
  for (const { arm, rows } of runs) {
    const all = rows.flatMap((r) => r.cheques)
    const missedAfter = all.filter((c) => !c.went).length
    const named = rows.reduce((s, r) => s + r.tripsNamed, 0)
    const missed = rows.reduce((s, r) => s + r.tripsMissed, 0)
    console.log(
      `  ${padR(arm.label, 46)}${padL(`${pct(missedAfter, all.length)} (${missedAfter}/${all.length})`, 24)}` +
        `${padL(`${pct(missed, named)} (${missed}/${named})`, 22)}`,
    )
  }

  header('§4  WHAT THE GIFT IS WORTH – dollars a season, against #43\'s measured $1,125')
  console.log('    A percentage of a J-series travel bill may be LARGER or smaller than the flat')
  console.log('    $500-1,500 draw it replaced. This is the column that says which.')
  console.log(`\n  ${padR('arm', 46)}${padL('$/season', 12)}${padL('vs $1,125', 12)}${padL('median cheque', 16)}${padL('median gap', 14)}`)
  const FLAT_BASELINE_CENTS = 1125_00
  for (const { arm, rows } of runs) {
    const seasons = rows.reduce((s, r) => s + r.seasons, 0)
    const cents = rows.reduce((s, r) => s + r.centsTotal, 0)
    const perSeason = cents / seasons
    const all = rows.flatMap((r) => r.cheques)
    const delta = ((perSeason - FLAT_BASELINE_CENTS) / FLAT_BASELINE_CENTS) * 100
    console.log(
      `  ${padR(arm.label, 46)}${padL(m(perSeason), 12)}${padL(`${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`, 12)}` +
        `${padL(m(med(all.map((c) => c.giftCents))), 16)}${padL(m(med(all.map((c) => c.gapCents))), 14)}`,
    )
  }

  header('§5  BY BACKGROUND, at the shipped share – who the gap-closer actually reaches')
  const shipped = runs.find((r) => r.arm.share === SHIPPED_SHARE)!
  console.log(`\n  ${padR('background', 12)}${padL('careers', 9)}${padL('cheques/season', 16)}${padL('$/season', 12)}${padL('went', 9)}${padL('median gap', 14)}`)
  for (const bg of ['working', 'middle', 'wealthy']) {
    const rows = shipped.rows.filter((r) => r.background === bg)
    if (rows.length === 0) continue
    const seasons = rows.reduce((s, r) => s + r.seasons, 0)
    const all = rows.flatMap((r) => r.cheques)
    const went = all.filter((c) => c.went).length
    console.log(
      `  ${padR(bg, 12)}${padL(String(rows.length), 9)}${padL((all.length / seasons).toFixed(2), 16)}` +
        `${padL(m(rows.reduce((s, r) => s + r.centsTotal, 0) / seasons), 12)}${padL(pct(went, all.length), 9)}` +
        `${padL(m(med(all.map((c) => c.gapCents))), 14)}`,
    )
  }

  header('§6  THE J-SERIES YEARS – the stretch he named, seasons 0-3 against 4-5')
  console.log('    «самый сложный этап J серия, там самые большие расходы». If the re-shape does not')
  console.log('    show up here it has not done the thing it was asked for.')
  console.log(`\n  ${padR('block', 16)}${padL('cheques', 10)}${padL('median gap', 14)}${padL('median cheque', 16)}${padL('went', 9)}`)
  for (const [label, from, to] of [['seasons 0-3 (J)', 0, 4], ['seasons 4-5 (pro)', 4, 99]] as [string, number, number][]) {
    const all = shipped.rows
      .flatMap((r) => r.cheques)
      .filter((c) => {
        const season = Math.floor(c.week / WEEKS_PER_YEAR)
        return season >= from && season < to
      })
    const went = all.filter((c) => c.went).length
    console.log(
      `  ${padR(label, 16)}${padL(String(all.length), 10)}${padL(m(med(all.map((c) => c.gapCents))), 14)}` +
        `${padL(m(med(all.map((c) => c.giftCents))), 16)}${padL(pct(went, all.length), 9)}`,
    )
  }

  header('§7  WHICH TRIP THE ENGINE NAMES – and the one limitation this bench cannot pass')
  console.log('    ⚠⚠ THE ENGINE ASKS `entryStatus`, WHICH IS WHAT A PLAYER MAY ENTER. THIS WALK\'S')
  console.log('      POLICY IS STRICTER: `econ-bench`\'s entry loop applies its own EARNED-points')
  console.log('      ranking gate before affordability and so refuses cards a wild card opens. So a')
  console.log('      named trip on a rung above the policy\'s own line is a trip THIS CORPUS would')
  console.log('      never take with any amount of money, and it lands in the «missed» column for a')
  console.log('      reason that has nothing to do with the sponsor. The tier split below is how to')
  console.log('      read §2/§3 honestly; it is a limit of the autopilot, not of the mechanic.')
  console.log(`\n  ${padR('rung', 14)}${padL('named trips', 14)}${padL('went', 10)}${padL('share', 10)}`)
  const tiers = new Map<string, { n: number; went: number }>()
  for (const r of shipped.rows) {
    for (const t of r.namedTiers) {
      const row = tiers.get(t.tier) ?? { n: 0, went: 0 }
      row.n++
      if (t.went) row.went++
      tiers.set(t.tier, row)
    }
  }
  for (const [tier, row] of [...tiers.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`  ${padR(tier || '(gone)', 14)}${padL(String(row.n), 14)}${padL(String(row.went), 10)}${padL(pct(row.went, row.n), 10)}`)
  }

  // ⚠ NOTHING TO RESTORE SINCE 16.09: the dial this bench swept was `ECONOMY.sponsor.gapShare`, and
  // #47's second reading deleted it. The sweep is local-only now, so it cannot poison an importer –
  // which is also why every SIZE table this tool prints is history rather than a measurement.
  console.log(`\n  (no engine dial to restore – gapShare was deleted by #47's second reading, 16.09)`)
}

main()
