// THE CHEMISTRY BENCH – wave C1's five measurements (docs/specs/the-chemistry-2026-09.md §11).
//
// ⭐⭐ WHAT THIS BENCH EXISTS TO ANSWER is the owner's own governing rule for the whole wave, 16.09:
//
//   «Вариативность и неожиданность – это наши два главных слова, они сделают каждую игру непохожей на
//    другую… Но при этом математика и стабильность – мы можем воспроизвести все вариации и
//    подтвердить, что они возможны.»
//
// That is not a mood, it is a specification with two halves. VARIABILITY means the corners in §1 must
// actually OCCUR. STABILITY means each one is reproducible from its seed and its frequency is
// MEASURED. So B0 does not report a median and call it a design: it names each corner, prints how
// often it happens, and hands over a seed that produces it.
//
// Run: npm run bench:chemistry
//      npm run bench:chemistry -- --seeds 4000 --careers 24 --weeks 312
//      npm run bench:chemistry -- --actuate        (the arms, below – run this before believing B10)
//
// ⚠⚠ THE ACTUATION ARM IS NOT OPTIONAL AND IT RUNS FIRST. Round 42 caught a bench here whose arm was
// a no-op hiding behind a TypeScript cast – `ECONOMY.sponsor as unknown as { gapShare }` kept
// typechecking after the constant was deleted, so the arm wrote a property nothing read and the
// measurement it produced was a fiction. `--actuate` sets `centreScale` to 0 (a flat table) and to an
// absurd 4.0 and prints B10's ratio and the click frequency at each; if those numbers do not move,
// the table is not wired and every other figure below is worthless.
//
// ⚠ THE PREDICTIONS ARE WRITTEN HERE, BEFORE THE RUN, which is invariant 5 and §14's own reason for
// predicting anything at all: «they are written down so the run can embarrass them».
//
//   B0 · corner census           A 1 in 15-30 · B 1 in 6-12 · C 1 in 8-15 · D 1 in 10-20 met,
//                                1 in 25-40 hired · E the majority, 50-70%
//   B7 · the floor column        a PERFECT pair sees a down year about 1 season in 8; a NO-MATCH pair
//                                more often than not. ⚠ The CEILING column is the owner's and is not
//                                this bench's to move; only the floor's middle is fitted here.
//   B9 · do periods appear?      a perfect pair's weekly series shows runs of 8+ weeks on one side of
//                                its mean. A series that alternates every week is white noise wearing
//                                a phase and §3.3 has not been built.
//   B10 · the lookup test        within-cell variance must dominate between-cell by AT LEAST 2:1.
//                                Below that the 4x4 is a strategy-guide entry and the discovery the
//                                owner asked for is gone. ⚠ This bench can veto the table's shape.
//   B11 · the balance check      structural: every temperament has >=1 warm manner and >=1 cold one,
//                                and no manner is best for all four. A failure is a broken game.
//
// ⚠ WHAT THIS BENCH CANNOT MEASURE, said out loud rather than quietly skipped. §1a is explicit that
// the table's PRINCIPLE cannot be validated – «two intense people burn out» is a claim about human
// beings and there is no dataset of coaches' manners against players' temperaments. B10 does not
// confirm the table; it confirms that a player who memorised the whole table still cannot predict a
// pairing, which is the property the owner actually asked for.
//
// ⚠ AND CORNER A IS MEASURED AS ITS PRECONDITION, NOT AS ITS FINISH. «The entry-level coach ends up
// the best-paid on the team» needs §4's tier climb, which ships in wave C2 – no coach's tier moves on
// this tree. What C1 owns is the GATE: is there a career where a budget coach is both the right
// teacher and a genuine click? That is what the A column below counts, and the column says so.

import { ECONOMY } from '../src/engine/economy'
import {
  affinityCentre,
  affinityFor,
  chemistryWeeklyRate,
  COACH_MANNERS,
  createWorld,
  freshCoachPair,
  nextChemistryPhase,
  quietWeek,
  TEMPERAMENTS,
  type ChemistryWeek,
  type Temperament,
} from '../src/engine/world'
import { buildCoachRoster, HIREABLE_TIERS, styleFitBetween } from '../src/engine/coach'
import { availabilityStatus, closeTournament, enterEvent, skipTournament, tickWeek } from '../src/engine/world'
import { SKILL_KEYS } from '../src/engine/development'
import { rngFromSeed } from '../src/engine/rng'
import { spiritBandOf } from '../src/engine/spirit'
import { drainKnock } from './_knocks'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground, type PlayStyle } from '../src/shared/protocol'

const args = process.argv.slice(2)
function flag(name: string, fallback: number): number {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = flag('seeds', 3000)
const PAIRS = flag('pairs', 4000)
const WALK_YEARS = flag('walkyears', 400)
const ACTUATE = args.includes('--actuate')

const f1 = (x: number) => x.toFixed(1)
const f2 = (x: number) => x.toFixed(2)
const pct = (x: number) => `${(x * 100).toFixed(1)}%`
const pad = (s: string, n: number) => s.padEnd(n)
const padL = (s: string, n: number) => s.padStart(n)
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
const variance = (xs: number[]) => {
  const m = mean(xs)
  return mean(xs.map((x) => (x - m) * (x - m)))
}
/** «one career in N» – the shape the spec's own predictions are written in */
const signed = (x: number) => (x >= 0 ? `+${f1(x)}` : f1(x))
const oneIn = (p: number) => (p <= 0 ? 'never' : `1 in ${(1 / p).toFixed(1)}`)

// THE CENSUS'S OWN DEFINITIONS, stated here rather than buried in the code, because every one of
// them is a reading of the spec rather than a fact the engine hands over.
//
//   AFFORDABLE  a stated proxy and not a simulation of the family's books: working shops at budget,
//               middle adds middle, wealthy adds high. Elite is nobody's «affordable» rung at
//               fourteen – it is gated on results (`ECONOMY.coach.eliteGate`), which is exactly what
//               makes corner C «the family has to find the money» rather than «the family has not
//               looked».
//   TALENT      a GREAT style fit – «he coaches the game she plays for a living». The tier is the
//               other half of talent and is what `affordable` already ranges over.
//   CHEMISTRY   `click` at A >= +0.60 and `anti` at A <= -0.60 (the corners of §1's matrix), and
//               «workable» at A >= +0.25, which is the affinity at which the pair's drift clears
//               +5 points a year and the relationship is worth having rather than merely not bad.
const AFFORDABLE: Record<FamilyBackground, CoachTier[]> = {
  working: ['budget'],
  middle: ['budget', 'middle'],
  wealthy: ['budget', 'middle', 'high'],
}
const CLICK = 0.6
const ANTI = -0.6
const WORKABLE = 0.25
const STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

interface Career {
  seed: string
  background: FamilyBackground
  style: PlayStyle
  temperament: Temperament
  /** every coach on the shelf, with the two facts the census reads */
  shelf: { tier: CoachTier; great: boolean; a: number }[]
  /** the coach the career actually OPENS with, by the game's own best-fit rule */
  opening: { tier: CoachTier; great: boolean; a: number }
}

function census(i: number): Career {
  const seed = `chem-${i}`
  const background = BACKGROUNDS[i % BACKGROUNDS.length]
  const style = STYLES[Math.floor(i / BACKGROUNDS.length) % STYLES.length]
  const coachTier = AFFORDABLE[background][AFFORDABLE[background].length - 1]
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, playStyle: style, coachTier })
  const shelf = buildCoachRoster(seed, 14).map((c) => ({
    id: c.id,
    tier: c.tier,
    great: styleFitBetween(c.style, style) === 'great',
    a: affinityFor(seed, c.id, world.temperament, c.manner),
  }))
  // the career's own opening coach: `bestFitCoachAt`'s rule – best fit first, cheapest among equals –
  // read off the same shelf so the census cannot disagree with the market about who she starts with.
  const atTier = shelf.filter((c) => c.tier === coachTier)
  const opening = atTier.find((c) => c.great) ?? atTier[0]
  return { seed, background, style, temperament: world.temperament, shelf, opening }
}

function b0(): void {
  const careers = Array.from({ length: SEEDS }, (_, i) => census(i))
  const hits: Record<string, number> = {
    A: 0, B: 0, C: 0, D_met: 0, D_hired: 0, E: 0, E_shelf: 0, opens_click: 0, opens_anti: 0,
  }
  const seedFor: Record<string, string> = {}
  for (const c of careers) {
    const afford = AFFORDABLE[c.background]
    const inReach = c.shelf.filter((x) => afford.includes(x.tier))
    const above = c.shelf.filter((x) => !afford.includes(x.tier))
    const both = (xs: typeof inReach) => xs.some((x) => x.great && x.a >= WORKABLE)

    // A – the PRECONDITION only (C2 owns the finish): a budget coach who is both the right teacher
    //     and a genuine click, which is the pairing that can go on to out-earn the whole team.
    const a = c.shelf.some((x) => x.tier === HIREABLE_TIERS[0] && x.great && x.a >= CLICK)
    // B – she can buy talent, she can buy chemistry, and she cannot buy both in one man.
    const b =
      !both(inReach) && inReach.some((x) => x.great) && inReach.some((x) => x.a >= WORKABLE)
    // C – nobody in reach has both, and somebody above it does.
    const cc = !both(inReach) && both(above)
    // D – «талант + ПРОТИВОПОЛОЖНАЯ химия». Met: such a man is on her affordable shelf. Hired: he is
    //     the man the career actually opens with, which is the only hire C1 can speak for.
    const dMet = inReach.some((x) => x.great && x.a <= ANTI)
    const dHired = c.opening.great && c.opening.a <= ANTI
    // E – THE ORDINARY CAREER, and it is read off THE COACH SHE ACTUALLY WORKS WITH rather than off
    //     her whole shelf. ⚠ THE FIRST RUN READ THE SHELF AND THE NUMBER WAS WRONG BY CONSTRUCTION:
    //     a wealthy family sees twelve coaches, so «not one of the twelve is extreme» is 0.86^12, and
    //     E came out at 30.8% against a prediction of «the majority». But §1's E is «nobody clicks,
    //     nobody repels; she is developed by competence» – a fact about her CAREER, which has ONE
    //     coach in it at a time, and not about a shop window she looked at once. The shelf reading is
    //     kept below as its own row, because «how extreme is her market» is a real and different
    //     question, and it is the one the wave's variability claim is actually answered by.
    const e = c.opening.a < CLICK && c.opening.a > ANTI
    const eShelf = !inReach.some((x) => x.a >= CLICK || x.a <= ANTI)

    const mark = (k: string, on: boolean) => {
      if (!on) return
      hits[k] += 1
      if (!seedFor[k]) seedFor[k] = `${c.seed} (${c.background}, ${c.style}, ${c.temperament})`
    }
    mark('A', a)
    mark('B', b)
    mark('C', cc)
    mark('D_met', dMet)
    mark('D_hired', dHired)
    mark('E', e)
    mark('E_shelf', eShelf)
    mark('opens_click', c.opening.a >= CLICK)
    mark('opens_anti', c.opening.a <= ANTI)
  }

  console.log(`\nB0 · THE CORNER CENSUS – ${careers.length} careers, one seed per corner`)
  console.log(
    `${pad('corner', 44)}${padL('freq', 8)}${padL('rate', 12)}  reproducing seed`,
  )
  const rows: [string, string][] = [
    ['A · a budget coach is BOTH great fit and a click', 'A'],
    ['B · nothing in reach offers both', 'B'],
    ['C · only above her reach offers both', 'C'],
    ['D · the anti-match is on her shelf', 'D_met'],
    ['D · ...and he is the coach she opens with', 'D_hired'],
    ['E · the ordinary career – her own coach is neither', 'E'],
    ['  · ...and the stricter read: her whole SHELF is calm', 'E_shelf'],
    ['  · her opening coach is a CLICK', 'opens_click'],
    ['  · her opening coach is an ANTI-MATCH', 'opens_anti'],
  ]
  for (const [label, key] of rows) {
    const p = hits[key] / careers.length
    console.log(
      `${pad(label, 44)}${padL(pct(p), 8)}${padL(oneIn(p), 12)}  ${seedFor[key] ?? '– NEVER HAPPENED –'}`,
    )
  }
  const zero = rows.slice(0, 6).filter(([, k]) => hits[k] === 0)
  console.log(
    zero.length
      ? `⚠⚠ ${zero.length} CORNER(S) AT ZERO – a failed wave, not a tuning note (spec §11).`
      : '✓ every corner occurs and every one has a reproducing seed.',
  )
}

/** B10 – the LOOKUP TEST, and it can veto the table's shape. */
function b10(): { ratio: number; within: number; between: number; click: number } {
  const cells: number[][] = []
  const all: number[] = []
  for (const t of TEMPERAMENTS) {
    for (const m of COACH_MANNERS) {
      const draws: number[] = []
      for (let i = 0; i < PAIRS; i++) draws.push(affinityFor(`b10-${i}`, `coach-${i % 16}`, t, m))
      cells.push(draws)
      all.push(...draws)
    }
  }
  // BETWEEN = the variance of the cells' REALISED means (not of the table's literals – the clamp at
  // the ends moves a centre, and a ratio computed off the constants would flatter itself).
  const between = variance(cells.map(mean))
  // WITHIN = the mean of the cells' own variances.
  const within = mean(cells.map(variance))
  const click = all.filter((a) => a >= CLICK).length / all.length
  return { ratio: within / between, within, between, click }
}

/** B11 – the structural balance check. Not a truth claim: a broken-game check. */
function b11(): void {
  console.log('\nB11 · THE BALANCE CHECK – structural, not statistical')
  console.log(`${pad('temperament', 14)}${COACH_MANNERS.map((m) => padL(m, 12)).join('')}   warm / cold`)
  let ok = true
  for (const t of TEMPERAMENTS) {
    const row = COACH_MANNERS.map((m) => affinityCentre(t, m))
    const warm = row.filter((x) => x > 0).length
    const cold = row.filter((x) => x < 0).length
    if (warm < 1 || cold < 1) ok = false
    console.log(
      `${pad(t, 14)}${row.map((x) => padL(x >= 0 ? `+${f2(x)}` : f2(x), 12)).join('')}   ${warm} / ${cold}`,
    )
  }
  // ...and no manner may be best for all four.
  const bestFor = TEMPERAMENTS.map((t) => {
    const row = COACH_MANNERS.map((m) => affinityCentre(t, m))
    return COACH_MANNERS[row.indexOf(Math.max(...row))]
  })
  const dominant = COACH_MANNERS.filter((m) => bestFor.every((b) => b === m))
  if (dominant.length) ok = false
  console.log(
    ok
      ? '✓ every temperament has a warm manner and a cold one, and no manner is best for all four.'
      : `⚠⚠ BROKEN: ${dominant.length ? `${dominant[0]} is best for all four` : 'a temperament has no warm or no cold manner'}`,
  )
}

/** One pair's weekly series at a fixed affinity. `season` supplies the week's events; the default is
 *  a QUIET week, which is the pure weather – what B9 asks about and what B7's floor is fitted
 *  against. */
function walk(
  affinity: number,
  seed: string,
  years: number,
  season: (week: number) => ChemistryWeek = () => quietWeek('steady'),
): { rates: number[]; phases: number[] } {
  let pair = freshCoachPair()
  const rates: number[] = []
  const phases: number[] = []
  for (let w = 1; w <= years * 52; w++) {
    const phase = nextChemistryPhase(pair.phase, seed, 'walk', w, season(w))
    pair = { ...pair, phase }
    phases.push(phase)
    rates.push(chemistryWeeklyRate(affinity, phase))
  }
  return { rates, phases }
}

// THE THREE RESULT REGIMES B7's second half is measured under. Sizes taken from a real junior/pro
// season rather than invented: ~20 entered events a year, ~1.5 matches an event.
//
// ⚠ THESE ARE SHAPES OF A SEASON, NOT A SIMULATION OF ONE. The weekly tick reads real rows off
// `world.events`; this reads a stylised season so the CHANNEL can be measured on its own, which is
// the only way to answer «can results produce a down year at a perfect pair» without the answer being
// a statement about the calendar.
const SEASON: Record<string, (week: number) => ChemistryWeek> = {
  quiet: () => quietWeek('steady'),
  // she plays, she is fine: 60% of matches won, a title in the year, steady head.
  ordinary: (w) =>
    w % 3 === 0
      ? { wins: 1, losses: 1, titles: w % 52 === 30 ? 1 : 0, band: 'steady' }
      : quietWeek('steady'),
  // a bad year: she wins fewer than she loses, and her head goes with it.
  bad: (w) =>
    w % 3 === 0
      ? { wins: w % 6 === 0 ? 0 : 1, losses: 1, titles: 0, band: 'dimmed' }
      : quietWeek('dimmed'),
  // ⚠ THE BORG CASE – the year the spec names as the thing a good pair must be able to have. Not
  // «slightly worse»: she loses every match she plays, wins nothing, and she is heavy all year.
  disaster: (w) =>
    w % 3 === 0
      ? { wins: 0, losses: 1, titles: 0, band: 'heavy' }
      : quietWeek('heavy'),
}

/** B9 – do PERIODS actually appear, or is it noise wearing a phase? */
function b9(): void {
  const { phases } = walk(1, 'b9', WALK_YEARS)
  const m = mean(phases)
  const runs: number[] = []
  let run = 0
  let side = 0
  for (const p of phases) {
    const s = p >= m ? 1 : -1
    if (s === side) run += 1
    else {
      if (run) runs.push(run)
      side = s
      run = 1
    }
  }
  runs.push(run)
  const long = runs.filter((r) => r >= 8).length
  const weeksInLong = runs.filter((r) => r >= 8).reduce((a, b) => a + b, 0) / phases.length
  console.log(`\nB9 · DO PERIODS APPEAR? – ${WALK_YEARS} years of one perfect pair's weather`)
  console.log(`  runs on one side of the mean: ${runs.length}   mean length ${f1(mean(runs))} weeks   longest ${Math.max(...runs)}`)
  console.log(`  runs of 8+ weeks: ${long} of ${runs.length} (${pct(long / runs.length)}), holding ${pct(weeksInLong)} of all weeks`)
  console.log(
    long === 0
      ? '⚠⚠ WHITE NOISE WEARING A PHASE – §3.3 has not been built.'
      : `✓ periods are real: the series spends ${pct(weeksInLong)} of its life inside a run of 8 weeks or more.`,
  )
}

/** B7 – the FLOOR column, which he was explicit about not being sure of. The ceiling column is his. */
function b7(): void {
  console.log(`\nB7 · THE CORRIDOR, MEASURED – ${WALK_YEARS} seasons of weather per affinity, no events`)
  console.log(
    `${pad('affinity', 12)}${padL('floor/yr', 10)}${padL('drift/yr', 10)}${padL('ceil/yr', 10)}` +
      `${padL('median yr', 11)}${padL('best yr', 10)}${padL('worst yr', 11)}${padL('DOWN years', 18)}`,
  )
  for (const a of [1, 0.6, 0.25, 0, -0.25, -0.6, -1]) {
    const { rates } = walk(a, `b7-${a}`, WALK_YEARS)
    const years: number[] = []
    for (let y = 0; y + 52 <= rates.length; y += 52) {
      years.push(rates.slice(y, y + 52).reduce((x, z) => x + z, 0))
    }
    const sorted = [...years].sort((x, z) => x - z)
    const down = years.filter((y) => y < 0).length / years.length
    console.log(
      `${pad(f2(a), 12)}${padL(f1(floorOf(a)), 10)}${padL(f1(driftOf(a)), 10)}${padL(f1(ceilOf(a)), 10)}` +
        `${padL(f1(sorted[Math.floor(sorted.length / 2)]), 11)}${padL(f1(sorted[sorted.length - 1]), 10)}` +
        `${padL(f1(sorted[0]), 11)}${padL(`${pct(down)} (${oneIn(down)})`, 18)}`,
    )
  }

  // ⭐⭐ B7's SECOND HALF, AND IT IS THE HALF THE FIRST RUN SENT US BACK FOR. The table above is the
  // WEATHER ALONE, and at a perfect pair it never produces a down year – which says the Borg year
  // cannot come from the dice. §3.4 already claims it comes from the RESULTS («it is the channel that
  // makes a good pair's bad year possible»), so that claim is measured here instead of assumed.
  console.log(`\nB7b · ...AND WHAT A SEASON'S RESULTS DO TO IT – the same pairs, four result regimes`)
  console.log(
    `${pad('affinity', 12)}${Object.keys(SEASON).map((k) => padL(`${k} yr`, 12)).join('')}   (median season total)`,
  )
  for (const a of [1, 0.6, 0.25, 0, -0.6]) {
    const cells = Object.keys(SEASON).map((k) => {
      const { rates } = walk(a, `b7b-${a}-${k}`, WALK_YEARS, SEASON[k])
      const years: number[] = []
      for (let y = 0; y + 52 <= rates.length; y += 52) years.push(rates.slice(y, y + 52).reduce((x, z) => x + z, 0))
      years.sort((x, z) => x - z)
      return years[Math.floor(years.length / 2)]
    })
    console.log(`${pad(f2(a), 12)}${cells.map((x) => padL(f1(x), 12)).join('')}`)
  }
}

// the three corridor anchors, re-read here rather than imported one by one, so the table above prints
// the numbers the engine actually runs on.
// ⚠⚠ THE ONE WRITABLE VIEW OF THE KNOBS, AND ITS SHAPE IS THE LESSON OF ROUND 42's BROKEN ARM.
// `ECONOMY` is deeply readonly, so an arm that retunes a constant has to widen it somehow – and the
// bench that was caught last round did it with `as unknown as { gapShare }`, which kept typechecking
// after the constant it named was DELETED, so the arm wrote a property nothing read. A mapped type
// over `keyof` cannot do that: every name below is still checked against the real block, so removing
// or renaming a knob is a compile error here rather than a silent no-op at runtime.
// ⚠ AND THE NUMERIC KNOBS ARE WIDENED TO `number` RATHER THAN LEFT AT THEIR LITERAL TYPES. `ECONOMY`
// is `as const`, so `centreScale` is typed `0.26` and no arm could ever write anything else; the
// conditional below widens exactly the numbers and leaves the two tables alone.
type Knobs = {
  -readonly [K in keyof typeof ECONOMY.chemistry]: (typeof ECONOMY.chemistry)[K] extends number
    ? number
    : (typeof ECONOMY.chemistry)[K]
}
const CHEM = ECONOMY.chemistry as Knobs
const lerp = (x: number, y: number, t: number) => x + (y - x) * t
const ceilOf = (a: number) => (a >= 0 ? lerp(CHEM.ceilingAtNone, CHEM.ceilingAtPerfect, a) : lerp(CHEM.ceilingAtNone, CHEM.ceilingAtAnti, -a))
const floorOf = (a: number) => (a >= 0 ? lerp(CHEM.floorAtNone, CHEM.floorAtPerfect, a) : lerp(CHEM.floorAtNone, CHEM.floorAtAnti, -a))
const driftOf = (a: number) => (a >= 0 ? lerp(0, CHEM.driftAtPerfect, a) : lerp(0, CHEM.driftAtAnti, -a))

/** ⚠⚠ THE ARM, AND IT RUNS BEFORE ANYTHING IS BELIEVED. Set the table's one scale to 0 and then to an
 *  absurd 4.0 and watch B10's ratio move. If it does not, the table is not wired to the draw and
 *  every figure this bench prints is a fiction – which is exactly what round 42 caught happening. */
function actuate(): void {
  console.log('\n⚠ ACTUATION ARM – proving the table is wired before any measurement is believed')
  const was = CHEM.centreScale
  console.log(`${pad('centreScale', 16)}${padL('within', 10)}${padL('between', 10)}${padL('ratio', 10)}${padL('P(click)', 10)}`)
  for (const scale of [0, was, 4]) {
    CHEM.centreScale = scale
    const r = b10()
    console.log(
      `${pad(f2(scale) + (scale === was ? '  (shipped)' : ''), 16)}${padL(f2(r.within), 10)}${padL(f2(r.between), 10)}` +
        `${padL(r.between < 1e-12 ? 'inf' : f1(r.ratio), 10)}${padL(pct(r.click), 10)}`,
    )
  }
  CHEM.centreScale = was
  console.log(
    '  A flat table (0) must give between = 0 and an identical P(click); an absurd one (4) must ' +
      'collapse the ratio and split the cells. Both move ⇒ the arm is real.',
  )
}

/** ⚠⚠ THE WAVE'S OWN ACTUATION ARM – does any of this reach HER? Paired seeds, two arms in ONE
 *  process, the B arm built by NEUTRALISING the corridor IN PLACE rather than by checking out an
 *  older tree (CLAUDE.md: «the control is your own change reverted, never the previous commit»). With
 *  every corridor anchor at 0 the weekly rate is 0 for every affinity, so the level never leaves 0,
 *  so `coachFactor` returns `developmentFactor[tier] * fitFactor[fit]` to the bit – which is the
 *  arithmetic this engine has run since round 2. If the two arms come out identical, the mechanic is
 *  not wired to development and every corner above is a fact about a number nobody reads. */
function careerArm(): void {
  const careers = flag('careers', 12)
  const weeks = flag('weeks', 260)
  console.log(`\n⭐ THE WAVE'S ACTUATION – ${careers} paired careers x ${weeks} weeks, chemistry ON against the same tree NEUTRALISED`)
  const anchors = ['ceilingAtPerfect', 'ceilingAtNone', 'ceilingAtAnti', 'floorAtPerfect', 'floorAtNone', 'floorAtAnti', 'driftAtPerfect', 'driftAtAnti'] as const
  const saved = Object.fromEntries(anchors.map((k) => [k, CHEM[k]])) as Record<string, number>
  const arms: Record<string, { mean: number[]; chem: number[]; aff: number[]; clock: number[] }> = {}
  for (const arm of ['ON', 'NEUTRALISED']) {
    for (const k of anchors) CHEM[k] = arm === 'ON' ? saved[k] : 0
    const meanSkill: number[] = []
    const clock: number[] = []
    const endChem: number[] = []
    const endPhase: number[] = []
    const aff: number[] = []
    const bands: Record<string, number> = {}
    let w6 = 0
    let l6 = 0
    let t6 = 0
    for (let i = 0; i < careers; i++) {
      const seed = `chem-arm-${i}`
      const background = BACKGROUNDS[i % BACKGROUNDS.length]
      const style = STYLES[i % STYLES.length]
      const world = createWorld(seed, {
        ...DEFAULT_PROFILE,
        background,
        playStyle: style,
        coachTier: AFFORDABLE[background][AFFORDABLE[background].length - 1],
      })
      const rng = rngFromSeed(world.seed)
      // ⭐⭐ THE CLOCK, AND IT IS THE METRIC THIS ARM HAD TO SWITCH TO. The first run measured END
      //     SKILL and reported a click worth +0.03 points against an anti-match worth -0.29, which
      //     reads like a broken mechanic and is really a broken RULER: `growWeek` grows toward
      //     `potential`, so a faster rate does not raise the destination – it arrives sooner. A girl
      //     eight years in is at or near her ceiling on both arms and the two numbers converge. The
      //     spec's own B4 names the honest measure («time to 90% of ceiling») and this is it.
      let ceilingWeek = -1
      const target = 0.9 * mean(SKILL_KEYS.map((k) => world.potential[k]))
      for (let w = 0; w < weeks && !world.ending; w++) {
        // ⚠ SHE HAS TO ACTUALLY COMPETE, or the results channel is never exercised and the arm
        //   measures the weather alone. The first run of this arm reported 0 wins and 0 losses over
        //   208 weeks – a career that entered nothing – which would have made «results do nothing»
        //   a true statement about a bench and a false one about the game. `load-bench.ts`'s own
        //   entry loop, minus the policy dials this arm has no opinion about.
        for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
          if (world.entries.includes(e.id)) continue
          try {
            if (availabilityStatus(world, e).level === 'blocked') continue
            enterEvent(world, e.id)
          } catch {
            /* cannot afford / not eligible – the player would see the lock */
          }
        }
        tickWeek(world, rng)
        drainKnock(world)
        while (world.pendingTournament) {
          if (!world.pendingTournament.finished) skipTournament(world)
          closeTournament(world)
        }
        if (ceilingWeek < 0 && mean(SKILL_KEYS.map((k) => world.skills[k])) >= target) ceilingWeek = world.week
      }
      clock.push(ceilingWeek < 0 ? weeks : ceilingWeek)
      meanSkill.push(mean(SKILL_KEYS.map((k) => world.skills[k])))
      const pair = world.coachPairs[world.coachId ?? '']
      endChem.push(pair?.chem ?? 0)
      endPhase.push(pair?.phase ?? 0)
      const hired = buildCoachRoster(world.seed, 14).find((x) => x.id === world.coachId)
      if (hired) aff.push(affinityFor(world.seed, hired.id, world.temperament, hired.manner))
      const b = spiritBandOf(world.spirit)
      bands[b] = (bands[b] ?? 0) + 1
      const played = world.events.filter((e) => e.type === 'match' && !e.friendly && e.match)
      w6 += played.filter((e) => e.match?.winnerId === 'kid').length
      l6 += played.filter((e) => e.match?.winnerId !== 'kid').length
      t6 += world.events.filter((e) => e.type === 'tournament' && e.finishIdx === 0).length
    }
    if (arm === 'ON') {
      console.log(
        `  diagnostics · mean affinity of the hired pair ${f2(mean(aff))} · mean end phase ${f2(mean(endPhase))}` +
          `\n  career totals over ${weeks} weeks: ${w6} wins, ${l6} losses, ${t6} titles` +
          ` · end bands ${Object.entries(bands).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      )
    }
    arms[arm] = { mean: meanSkill, chem: endChem, aff, clock }
  }
  for (const k of anchors) CHEM[k] = saved[k]
  const on = arms.ON
  const off = arms.NEUTRALISED
  const deltas = on.mean.map((x, i) => x - off.mean[i])
  console.log(`${pad('arm', 16)}${padL('mean skill', 13)}${padL('end chemistry', 16)}`)
  console.log(`${pad('ON', 16)}${padL(f2(mean(on.mean)), 13)}${padL(f1(mean(on.chem)), 16)}`)
  console.log(`${pad('NEUTRALISED', 16)}${padL(f2(mean(off.mean)), 13)}${padL(f1(mean(off.chem)), 16)}`)
  console.log(
    `  per-career skill delta: mean ${f2(mean(deltas))} · best ${f2(Math.max(...deltas))} · worst ${f2(Math.min(...deltas))}` +
      ` · moved on ${deltas.filter((d) => Math.abs(d) > 1e-9).length} of ${deltas.length}`,
  )
  // ⭐ WHO GAINS AND WHO PAYS – the same 24 careers, banded by the affinity they actually drew. The
  //   headline mean above is a population average and hides the whole mechanic; this is the table
  //   that says whether a click is worth having and whether an anti-match costs anything.
  const bands: [string, (a: number) => boolean][] = [
    ['click        A >= +0.60', (a) => a >= CLICK],
    ['good         +0.25..+0.60', (a) => a >= WORKABLE && a < CLICK],
    ['ordinary     -0.25..+0.25', (a) => a > -WORKABLE && a < WORKABLE],
    ['cooling      -0.60..-0.25', (a) => a > ANTI && a <= -WORKABLE],
    ['anti-match   A <= -0.60', (a) => a <= ANTI],
  ]
  const clockDelta = on.clock.map((x, i) => x - off.clock[i])
  console.log(
    `${pad('the hired pair', 26)}${padL('careers', 9)}${padL('end chem', 11)}${padL('skill delta', 13)}${padL('WEEKS TO 90%', 14)}`,
  )
  for (const [label, hit] of bands) {
    const idx = on.aff.map((a, i) => (hit(a) ? i : -1)).filter((i) => i >= 0)
    if (!idx.length) {
      console.log(`${pad(label, 26)}${padL('0', 9)}${padL('-', 11)}${padL('-', 13)}${padL('-', 14)}`)
      continue
    }
    console.log(
      `${pad(label, 26)}${padL(String(idx.length), 9)}${padL(f1(mean(idx.map((i) => on.chem[i]))), 11)}` +
        `${padL(f2(mean(idx.map((i) => deltas[i]))), 13)}` +
        `${padL(signed(mean(idx.map((i) => clockDelta[i]))), 14)}`,
    )
  }
  console.log(
    mean(off.chem) === 0 && deltas.some((d) => Math.abs(d) > 1e-9)
      ? '✓ the arm is real: the neutralised tree accrues exactly 0 and her build moves between the two.'
      : '⚠⚠ NULL ARM – either the neutralisation did not take or nothing reads the number. Do not believe any figure above.',
  )
}

function run(): void {
  console.log('THE CHEMISTRY BENCH – wave C1 (docs/specs/the-chemistry-2026-09.md §11)')
  console.log(`seeds ${SEEDS} · pairs/cell ${PAIRS} · walk ${WALK_YEARS} years`)
  if (ACTUATE) {
    actuate()
    return
  }
  b11()
  const r = b10()
  console.log('\nB10 · THE LOOKUP TEST – variance of realised affinity, WITHIN a cell against BETWEEN cells')
  console.log(`  within-cell  ${f2(r.within)}    between-cell ${f2(r.between)}    RATIO ${f1(r.ratio)} : 1`)
  console.log(`  P(a pair is a click, A >= ${CLICK}) = ${pct(r.click)}  (${oneIn(r.click)} pairs)`)
  console.log(
    r.ratio >= 2
      ? `✓ the draw dominates the table at ${f1(r.ratio)}:1 – a player who memorised the 4x4 still cannot predict a pairing.`
      : `⚠⚠ VETO: ${f1(r.ratio)}:1 is below 2:1 – the 4x4 is a strategy-guide entry and the discovery is gone.`,
  )
  b9()
  b7()
  b0()
  careerArm()
}

run()
