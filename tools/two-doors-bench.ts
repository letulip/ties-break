// THE TWO DOORS' BENCH – `npm run bench:doors`. Round 45,
// docs/specs/the-two-more-doors-2026-09.md, and it exists because of one sentence of his:
//
//     «у обоих не больше 1–2%… это всё-таки событие, которое принудительно заканчивает игру»
//
// ⚠⚠ THE RATE IS THE FEATURE'S HARDEST CONSTRAINT AND IT IS A **DESIGN** CONSTRAINT RATHER THAN A
// REALISM NOTE. A door that ends a career WITHOUT the player choosing it has to be rare enough to
// read as a story rather than as the game being taken away. So this file's headline number is a
// share of **CAREERS**, never of seasons – the two are a decade apart and only the first is what he
// said (spec §5).
//
// ⚠⚠ AND IT REPORTS **THREE** NUMBERS PER DOOR, NOT ONE, BECAUSE A 0% HAS TWO CAUSES AND ONLY ONE OF
// THEM IS A TUNING ANSWER. This is `injuryPriorWeeksOut`'s lesson, written into the instrument
// instead of being re-learned: P1's proposed career-ending-injury rule was predicted at 1-2%,
// measured at 0.0%, and the finding was «it is not rare, it is impossible» – a gate the model could
// not reach. The three columns tell those apart:
//
//   ELIGIBLE   the share of careers whose GATE ever opened, draw ignored. This is EXACTLY the rate
//              the door would fire at if the chance were 1.0, so it is the absurd-value arm computed
//              rather than run – and it is the ceiling every tuning of the chance lives under.
//   EXPECTED   1 - Π(1 - chance) over that career's eligible winters, averaged over all careers.
//              What the shipped chance SHOULD produce, from the eligibility census alone.
//   REALISED   what the shipped engine actually latched, walking the shipped `resolveLeaving`.
//
//   EXPECTED and REALISED agreeing is the wiring proof; ELIGIBLE is what says whether the knob has
//   any room at all. A door whose ELIGIBLE is 0 cannot be tuned to 1-2% by any chance.
//
// ⚠⚠ ONE WALK ANSWERS BOTH, AND THE REASON IS WORTH STATING BECAUSE IT HALVES THE COST. The shipped
// door STOPS the career, so a career that leaves at season 8 can never be seen to be eligible at
// season 11 – the same blind spot the bankruptcy sweep has, and it takes the same fix: the walk
// clears the latch the moment either door sets it (`world.ending = null`) and keeps going, so the
// whole eligibility census is visible. ⭐ AND THE **FIRST** LATCH IS RECORDED BEFORE THE DEFUSE AND
// NEVER OVERWRITTEN – which IS the shipped arm, exactly, because every week up to that latch is
// byte-identical to a walk that stops there (same seed, same policy, same draws; the defuse happens
// strictly after). So REALISED is measured on the shipped engine and the census is measured past it,
// out of one pass.
//
// ⚠ WHAT THE CENSUS MAY CLAIM IS «when would the door have opened»; what it may NOT claim – and
// does not – is what the rest of the career would have become.
//
// ⚠ THE GATE IS ASKED THROUGH THE ENGINE'S OWN VIEW AND THE ENGINE'S OWN PREDICATE
// (`leavingViewOf` / `leavingDoorDue`, both on the `engine/world` barrel), never re-implemented here.
// That is `weeksLostSoFar`'s discipline in `endings-bench.ts`: a bench with its own copy of the rule
// is a bench that can come to disagree with the rule.
import { answerBirthdayNeutral } from './_birthday'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, median, type Preset, type Policy } from './econ-bench'
import {
  answerFork,
  answerRetirement,
  pendingBirthday,
  leavingViewOf,
  activeLadderOf,
  type WorldState,
} from '../src/engine/world'
import { drainLifeBeats } from './_lifeBeats'
import { ENDINGS, DOOR_BY_TEMPERAMENT, leavingDoorDue, peakLeavingDue } from '../src/engine/ending'
import type { CareerEndingType } from '../src/shared/protocol'
import type { Temperament } from '../src/engine/spirit'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { FULL_CAREER_WEEKS, FULL_CAREER_AGE_YEARS } from './endings-bench'

/** The candidate top-N bands for the peak gate, swept in one pass exactly as the bankruptcy grace
 *  window is: the predicate takes the band as a parameter, so «would N have opened» is exact. */
const PEAK_BANDS = [3, 5, 10, 20, 30, 50]

/** One wrap week that COULD have been a collapse – the census the fall's three thresholds are
 *  checked against. Every professional winter with a comparable season behind it lands here,
 *  whether or not it passes, which is what makes the distribution readable. */
interface FallCandidate {
  seasonIndex: number
  prevPoints: number
  points: number
  prevEndRank: number
  endRank: number
  /** points kept, as a share of last season's */
  share: number
  /** how many times numerically larger her place got */
  factor: number
  places: number
}

export interface DoorOutcome {
  seed: string
  preset: string
  temperament: Temperament
  door: 'peak' | 'fall'
  /** ARM A – what the shipped engine latched */
  ending: CareerEndingType | null
  endedAge: number | null
  /** ARM B – the winters her gate opened on, draw ignored */
  eligibleSeasons: number[]
  /** ARM B – the best season-end place she ever held on the PAID table, or null */
  bestWtaRank: number | null
  /** ARM B – how many professional winters she reached at all (the denominator behind the census) */
  proWinters: number
  /** ARM B – would the peak gate have opened at each candidate band */
  peakBand: Record<number, boolean>
  /** ARM B – every comparable professional winter, for the fall's threshold census */
  fallCandidates: FallCandidate[]
  /** did she ever reach the paid table at all – the denominator behind every column above */
  everProfessional: boolean
}

function isWrapWeek(week: number): boolean {
  return week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS
}

/** The questions a walked career answers on its way past them. Lifted from `endings-bench.ts`'s own
 *  `answerWhateverIsOpen` and kept to the same three: the fork (always «continue» here – the other
 *  two answers ARE endings and neither door can be reached through them), her life beats, and the
 *  natural end's offer.
 *
 *  ⚠ THE RETIREMENT ARM IS «plays on», DELIBERATELY, AND IT IS THE CONSERVATIVE CHOICE. «Her words»
 *  takes the plateau offer the moment it arrives, which ends a lot of careers in their middle
 *  twenties – exactly the years the peak door lives in. Refusing every offer but the last keeps
 *  those careers alive to be measured, so the eligibility census is of the LONGEST careers the game
 *  produces. A door that is unreachable on this arm is unreachable, full stop. */
function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeats(world)
    answerFork(world, 'continue')
  }
  drainLifeBeats(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

export function runCareer(preset: Preset, index: number, policy: Policy): DoorOutcome {
  const { world, rng } = openCareer(preset, index, policy)
  const out: DoorOutcome = {
    seed: world.seed,
    preset: preset.label,
    temperament: leavingViewOf(world).temperament,
    door: DOOR_BY_TEMPERAMENT[leavingViewOf(world).temperament],
    ending: null,
    endedAge: null,
    eligibleSeasons: [],
    bestWtaRank: null,
    proWinters: 0,
    peakBand: Object.fromEntries(PEAK_BANDS.map((b) => [b, false])),
    fallCandidates: [],
    everProfessional: false,
  }
  // ⚠ THE FIRST LATCH IS WHAT ARM A REPORTS, EVEN IN ARM B. Defusing keeps the walk going for the
  // census; it does not rewrite what the shipped engine did on the way to the first door.
  let latched = false

  for (let i = 0; i < FULL_CAREER_WEEKS; i++) {
    stepCareerWeek(world, rng, policy)

    if (isWrapWeek(world.week)) {
      // ⚠ THE VIEW AND THE PREDICATE ARE THE ENGINE'S. A census taken off a local re-derivation
      // would be a second copy of the rule, which is the one thing this file may not own.
      const view = leavingViewOf(world)
      if (view.professional) {
        out.proWinters += 1
        if (view.endRank !== null && (out.bestWtaRank === null || view.endRank < out.bestWtaRank)) {
          out.bestWtaRank = view.endRank
        }
        if (leavingDoorDue(view) !== null) out.eligibleSeasons.push(view.seasonIndex)
        for (const band of PEAK_BANDS) if (peakLeavingDue(view, band)) out.peakBand[band] = true
        if (view.endRank !== null && view.prevEndRank !== null && view.prevPoints > 0) {
          out.fallCandidates.push({
            seasonIndex: view.seasonIndex,
            prevPoints: view.prevPoints,
            points: view.points,
            prevEndRank: view.prevEndRank,
            endRank: view.endRank,
            share: view.points / view.prevPoints,
            factor: view.endRank / view.prevEndRank,
            places: view.endRank - view.prevEndRank,
          })
        }
      }
    }

    const latch = world.ending
    if (!latched && latch !== null) {
      latched = true
      out.ending = latch.type
      out.endedAge = latch.ageYears
    }
    // THE ONE-LINE DEFUSE – see the header for what it may and may not claim. `out.ending` above is
    // already frozen at this latch, so the shipped verdict survives the walk continuing past it.
    if (latch !== null && (latch.type === 'peak' || latch.type === 'fall')) world.ending = null
    // ⚠ EVERY OTHER LATCH REALLY IS THE END OF THE WALK. `advanceWeeks` returns `['ending']` behind a
    // terminal latch in the shipped game, so walking on past one would be measuring weeks a player
    // can never reach.
    if (world.ending !== null) break
    answerWhateverIsOpen(world)
  }
  // ⚠ THE PROFESSIONAL WINTERS ARE WHAT MAKE A BLANK LEGIBLE: a career with `proWinters === 0` never
  // reached the paid table at all, which is a finding about the population rather than about a door.
  out.everProfessional = activeLadderOf(world) === 'wta'
  return out
}

function pct(n: number, d: number): string {
  return d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`
}

function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

/** 1 - Π(1 - p) over a career's eligible winters – what a chance of `p` should produce for THAT
 *  career. Averaged over the population it is the EXPECTED column, and it is the thing REALISED has
 *  to agree with for the wiring to be believed. */
function expectedFor(o: DoorOutcome, chance: number): number {
  return 1 - Math.pow(1 - chance, o.eligibleSeasons.length)
}

/** ⭐⭐ THE CHANCE, SWEPT WITHOUT RE-RUNNING – `sweepGrace`'s own trick in `endings-bench.ts`, and it
 *  is exact for the question it answers for the same reason.
 *
 *  ⚠ THE ELIGIBILITY CENSUS DOES NOT DEPEND ON THE CHANCE, and here is the whole of why rather than
 *  an assurance. The gate is read BEFORE the draw and never after it, and the walk defuses the door
 *  the moment it latches – so the only residue a fired-and-defused door leaves behind is two rows in
 *  `world.events` and two ticks of `nextEventId`. Neither is read by any rule or any draw in this
 *  engine (`world.events` is the display ledger; the wrap-up was re-pointed off it years ago,
 *  `maybeFireSeasonWrapUp`'s own note), so the list of winters her gate opened on is the same list at
 *  every p. One pass therefore prices every candidate.
 *
 *  ⚠ WHAT IT MAY CLAIM IS «what career rate would p produce», and no more – the same bounded claim
 *  the grace sweep makes. What it cannot say is how a career that left at season 8 would have spent
 *  season 11, and nothing here asks it to. */
const CHANCE_CANDIDATES = [0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.25]

export function main(argv = process.argv.slice(2)): void {
  const seedsArg = argv.indexOf('--seeds')
  const seeds = seedsArg >= 0 ? Number(argv[seedsArg + 1]) : 20
  const presetsArg = argv.indexOf('--presets')
  // ⚠⚠ `--spread` – ONE PRESET PER BACKGROUND, AND IT EXISTS BECAUSE OF A MEASURED TRAP. `openCareer`
  // builds its seed as `bench-${background}-${index}` – the BACKGROUND and the index, **never the
  // coach tier** – so the nine presets collapse onto three seed families: a default 9 x 8 run walks
  // 72 careers but only **24 distinct seeds**, each of them three, four or two times over. Her
  // temperament and both doors' coins are functions of the seed ALONE, so every seed-derived figure
  // in this report has an effective n of 24 rather than 72, and a rare event can read 0 for no
  // reason but that. (Verified, not inferred: `temperamentFor` over those 24 seeds gives
  // {deep 6, fiery 8, sunny 3, quiet 7}, and replication-weighted that is {19, 26, 7, 20} – the
  // partition table below, career for career.) With `--spread` the careers and the distinct seeds
  // are the same number, at the cost of holding the coach tier fixed inside each background.
  const spread = argv.includes('--spread')
  const oneEach = PRESETS.filter((p, i) => PRESETS.findIndex((q) => q.background === p.background) === i)
  const presets = spread ? oneEach : presetsArg >= 0 ? PRESETS.slice(0, Number(argv[presetsArg + 1])) : PRESETS
  // ⚠⚠ THE DEFAULT IS `player` AND NOT `POLICIES[0]`, WHICH IS THE ONE PLACE THIS BENCH DEPARTS FROM
  // THE HOUSE DEFAULT – MEASURED, NOT PREFERRED. On the `grinder` arm (9 presets x 1 seed) exactly
  // **1 of 9 careers ever reached a professional winter at all**, and her best place ever was #332:
  // both doors read 0.0% at every band down to top 50, for a reason that is about the POLICY and not
  // about the doors. That is the null arm CLAUDE.md warns about – an arm that does not contain the
  // thing being measured – wearing a measurement's clothes. The `player` arm reaches a professional
  // winter in 9 of 9 and a median best place of #16, which is a population these doors exist in.
  // `--policy grinder` still runs it, and the spec records both.
  const policyArg = argv.indexOf('--policy')
  const policy = POLICIES.find((p) => p.id === argv[policyArg + 1]) ?? POLICIES[1]

  console.log('')
  console.log('THE TWO DOORS – leaving at the peak, leaving after the fall (round 45)')
  console.log(
    `  ${presets.length} presets x ${seeds} seeds, policy "${policy.label}", fourteen to ${FULL_CAREER_AGE_YEARS}` +
      `${spread ? ' · --spread (one preset per background)' : ''}`,
  )
  // ⚠ THE EFFECTIVE SAMPLE, PRINTED RATHER THAN LEFT TO BE WORKED OUT. See `--spread` above: the
  // temperament and both coins are seed-derived, so this is the n that governs every rare event here.
  const distinct = new Set(presets.map((p) => p.background)).size * seeds
  console.log(
    `  ${presets.length * seeds} careers, ${distinct} DISTINCT SEEDS – every seed-derived figure below has an effective n of ${distinct}`,
  )
  console.log(
    `  peak: top ${ENDINGS.peakRankBand} on the paid table or a title at the top rung · chance ${(100 * ENDINGS.peakLeavingChance).toFixed(0)}% per eligible winter`,
  )
  console.log(
    `  fall: points <= ${ENDINGS.fallPointsShare} of last season's (floor ${ENDINGS.fallPointsFloor}) AND the place at least x${ENDINGS.fallRankFactor} and +${ENDINGS.fallRankPlaces} · chance ${(100 * ENDINGS.fallLeavingChance).toFixed(0)}%`,
  )
  console.log('')

  const census: DoorOutcome[] = []
  for (const preset of presets) {
    for (let i = 0; i < seeds; i++) census.push(runCareer(preset, i, policy))
  }
  // ⚠ ONE LIST, TWO READINGS – see the header. `ending` / `endedAge` are the SHIPPED verdict (the
  // first latch, frozen before the defuse); everything else is the census past it.
  const shipped = census

  // --- THE HEADLINE: his 1-2%, as a share of CAREERS ---
  console.log('  ── THE TWO DOORS, as shares of ALL careers walked ──')
  console.log('')
  console.log(
    `  ${padEnd('door', 8)}${'girls'.padStart(8)}${'ELIGIBLE'.padStart(10)}${'EXPECTED'.padStart(10)}${'REALISED'.padStart(10)}   median age`,
  )
  for (const door of ['peak', 'fall'] as const) {
    const cen = census.filter((o) => o.door === door)
    const shp = shipped.filter((o) => o.door === door)
    const eligible = cen.filter((o) => o.eligibleSeasons.length > 0).length
    const chance = door === 'peak' ? ENDINGS.peakLeavingChance : ENDINGS.fallLeavingChance
    const expected = cen.length === 0 ? 0 : cen.reduce((s, o) => s + expectedFor(o, chance), 0) / cen.length
    const left = shp.filter((o) => o.ending === door)
    const ages = left.map((o) => o.endedAge ?? 0).sort((a, b) => a - b)
    console.log(
      `  ${padEnd(door, 8)}${String(cen.length).padStart(8)}${pct(eligible, census.length).padStart(10)}${`${(
        (100 * expected * cen.length) /
        Math.max(1, census.length)
      ).toFixed(1)}%`.padStart(10)}${pct(left.length, shipped.length).padStart(10)}   ${
        ages.length ? median(ages).toFixed(0) : '–'
      }`,
    )
  }
  console.log('')
  console.log(`  ⚠ ELIGIBLE is the rate at chance 1.0, computed exactly – the ceiling the knob lives under.`)
  console.log(`    EXPECTED is 1 - Π(1-chance) over each career's eligible winters. REALISED is the shipped walk.`)
  console.log(`    All three are shares of ALL ${census.length} careers, which is the denominator he named.`)
  console.log('')

  // --- ⭐⭐ THE CHANCE, SWEPT: what would each candidate produce, as a share of ALL careers ---
  console.log('  ── THE CHANCE, SWEPT IN ONE PASS (career rate at each candidate) ──')
  console.log('')
  console.log(`  ${padEnd('chance', 9)}${'peak'.padStart(9)}${'fall'.padStart(9)}${'both'.padStart(9)}`)
  for (const p of CHANCE_CANDIDATES) {
    const cell = (door: 'peak' | 'fall') => {
      const cen = census.filter((o) => o.door === door)
      const sum = cen.reduce((s, o) => s + expectedFor(o, p), 0)
      return (100 * sum) / Math.max(1, census.length)
    }
    const a = cell('peak')
    const b = cell('fall')
    const shippedHere =
      p === ENDINGS.peakLeavingChance && p === ENDINGS.fallLeavingChance ? '   <- shipped' : ''
    const inBand = a <= 2 && b <= 2 ? '   both inside his 1-2%' : ''
    console.log(
      `  ${padEnd(`${(100 * p).toFixed(0)}%`, 9)}${`${a.toFixed(2)}%`.padStart(9)}${`${b.toFixed(2)}%`.padStart(
        9,
      )}${`${(a + b).toFixed(2)}%`.padStart(9)}${shippedHere}${inBand}`,
    )
  }
  console.log('')

  // --- THE TEMPERAMENT CENSUS: the partition, and it must be flat ---
  console.log('  ── THE PARTITION: one door per girl, and the four should be a quarter each ──')
  console.log('')
  for (const t of ['sunny', 'fiery', 'quiet', 'deep'] as const) {
    const rows = census.filter((o) => o.temperament === t)
    const eligible = rows.filter((o) => o.eligibleSeasons.length > 0).length
    console.log(
      `  ${padEnd(t, 8)}${'-> ' + padEnd(DOOR_BY_TEMPERAMENT[t], 6)}${String(rows.length).padStart(6)} girls ${pct(
        rows.length,
        census.length,
      )}   eligible ${pct(eligible, Math.max(1, rows.length))}`,
    )
  }
  console.log('')

  // --- THE PEAK'S BAND, SWEPT IN ONE PASS ---
  console.log('  ── THE PEAK GATE: which top-N band would ever have opened ──')
  console.log('')
  const peakGirls = census.filter((o) => o.door === 'peak')
  const ranked = census.map((o) => o.bestWtaRank).filter((r): r is number => r !== null).sort((a, b) => a - b)
  console.log(
    `  ${census.filter((o) => o.proWinters > 0).length}/${census.length} careers reached a professional winter at all; ` +
      `best paid-table place ever held: median ${ranked.length ? median(ranked).toFixed(0) : '–'}, best ${
        ranked.length ? ranked[0] : '–'
      }`,
  )
  console.log('')
  console.log(`  ${padEnd('band', 8)}${'peak girls eligible'.padStart(22)}${'of ALL careers'.padStart(17)}`)
  for (const band of PEAK_BANDS) {
    const hit = peakGirls.filter((o) => o.peakBand[band]).length
    console.log(
      `  ${padEnd(`top ${band}`, 8)}${`${hit}/${peakGirls.length}`.padStart(22)}${pct(hit, census.length).padStart(17)}${
        band === ENDINGS.peakRankBand ? '   <- shipped' : ''
      }`,
    )
  }
  console.log('')

  // --- THE FALL'S THRESHOLDS, AGAINST THE REAL DISTRIBUTION ---
  //
  // ⚠ A CENSUS RATHER THAN A SWEEP, DELIBERATELY. The fall is a conjunction of three terms and a
  // sweep over their product is a table nobody can read; the distribution says where each threshold
  // sits in the corpus, which is what picking a number needs. His own worked example is the anchor
  // printed beside it – #13 -> #59 with 4,008 expiring against 1,584 replacing them.
  const candidates = census.flatMap((o) => o.fallCandidates)
  console.log('  ── THE FALL GATE: every comparable professional winter in the corpus ──')
  console.log('')
  console.log(`  ${candidates.length} winters with a comparable season behind them, over ${census.length} careers`)
  if (candidates.length > 0) {
    const shares = candidates.map((c) => c.share).sort((a, b) => a - b)
    const factors = candidates.map((c) => c.factor).sort((a, b) => a - b)
    const places = candidates.map((c) => c.places).sort((a, b) => a - b)
    console.log(
      `  points kept : median ${median(shares).toFixed(2)} · p10 ${shares[Math.floor(shares.length * 0.1)].toFixed(
        2,
      )} · ${candidates.filter((c) => c.share <= ENDINGS.fallPointsShare).length} winters at or under the shipped ${ENDINGS.fallPointsShare}`,
    )
    console.log(
      `  place factor: median x${median(factors).toFixed(2)} · p90 x${factors[Math.floor(factors.length * 0.9)].toFixed(
        2,
      )} · ${candidates.filter((c) => c.factor >= ENDINGS.fallRankFactor).length} winters at or past the shipped x${ENDINGS.fallRankFactor}`,
    )
    console.log(
      `  places lost : median ${median(places).toFixed(0)} · p90 ${places[Math.floor(places.length * 0.9)].toFixed(
        0,
      )} · ${candidates.filter((c) => c.places >= ENDINGS.fallRankPlaces).length} winters at or past the shipped ${ENDINGS.fallRankPlaces}`,
    )
    const all = candidates.filter(
      (c) =>
        c.prevPoints >= ENDINGS.fallPointsFloor &&
        c.share <= ENDINGS.fallPointsShare &&
        c.factor >= ENDINGS.fallRankFactor &&
        c.places >= ENDINGS.fallRankPlaces,
    )
    console.log(`  ALL FOUR TERMS TOGETHER: ${all.length} winters of ${candidates.length}`)
    console.log(
      `  (his own case reads share 0.40, factor x4.54, 46 places, from 4,008 points – it passes all four with room)`,
    )
  }
  console.log('')

  // --- WHAT THE DOORS DISPLACED ---
  //
  // ⚠ AN ENDING THAT ENDS A CAREER TAKES THAT CAREER FROM SOME OTHER ENDING, and a door that is
  // «rare» in its own column can still be loud in the mix if the endings around it are rarer. The
  // whole distribution is printed so that cannot be inferred wrongly from two numbers.
  console.log('  ── THE WHOLE MIX, shipped arm ──')
  console.log('')
  for (const type of ['stopped', 'college', 'bankruptcy', 'injury', 'natural', 'plateau', 'peak', 'fall'] as const) {
    const rows = shipped.filter((o) => o.ending === type)
    if (rows.length === 0 && type !== 'peak' && type !== 'fall') continue
    console.log(`  ${padEnd(type, 12)}${String(rows.length).padStart(6)}${pct(rows.length, shipped.length).padStart(9)}`)
  }
  const open = shipped.filter((o) => o.ending === null).length
  console.log(`  ${padEnd('(still playing)', 12)}${String(open).padStart(6)}${pct(open, shipped.length).padStart(9)}`)
  console.log('')
}

main()
