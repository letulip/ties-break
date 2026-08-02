// THE BOREDOM GUARD - the pro entry cap's ACCEPTANCE TEST (W2-LADDER §5, owner ruling 2: «игрок
// должен иметь возможность играть, если не w-серии то где-то еще, чтобы не скучал»).
//
//   npx vite-node tools/boredom-guard.ts [--seeds N] [--weeks N]
//
// THE CLAIM UNDER TEST, mechanized: across career sweeps, every non-rest, non-blackout week where
// the pro cap refuses a W entry MUST still offer a playable J (age <= 18) or domestic event she
// qualifies for. "Refuses" is read at the last decision moment (the event's deadline week), off
// the engine's own gate (`entryStatus` reason 'capped' via the pro arm); "still offers" is read at
// the same moment about the SAME target week, through the same gate - level 'ok' or 'caution',
// because a fatigue caution is a playable week by the owner's own rule.
//
// ⚠⚠ THE W2-LADDER FINDING, REPORTED RATHER THAN SILENTLY SHIPPED (the spec's own escape hatch:
// "tune cap numbers or report the conflict"). Measured 12 careers x 260 weeks, elite-book maximal
// grinder: 176 cap refusals over 65 non-rest weeks, and 14 of those weeks offer NOTHING else -
// and the classifier shows every one of them is a CALENDAR-COVERAGE gap, not a cap-number
// problem: season offsets 32/40/44 carry W events and NO non-W event at all (the 12-rung
// tierPhase re-spacing left 3-4 W-only weeks a season), and offset 38 carries only a Regional an
// elite girl has outgrown. No value of proPerYearByAge can fix a week with no J or National on
// it. The corner needs the maximal profile to exist at all - at a sane knee-gated appetite the
// cap is never even exhausted (measured: 0 refusals over the same sweep) - and a stranded week
// still offers the planner's practice friendly. CANDIDATE REMEDIES, both outside this wave's
// remit and named for the architect: co-phase the W rungs with their J mirrors in `tierPhase` (so
// a W week always carries its J fallback - one line, but it re-deals the whole world's calendar
// again), or densify the second-half domestic/J coverage (an owner-priced knob, R9-20's). Until
// one lands, this tool exits 1 on violations so the red stays loud in every re-run.
//
// AN ELITE-BOOK CAREER DRIVES THE SWEEP, deliberately - the cap's worst case. A middling career
// never clears the W15 on-ramp by sixteen, never spends a single pro slot, and hands back a
// VACUOUS zero (measured: the first cut of this tool did exactly that - 12 careers, 0 refusals,
// 0 weeks checked). So the driver keeps her books synthetically elite (the L11 smoke's idiom:
// standing rows re-stamped each half-season) and her appetite greedy - every gate but the caps is
// open, the 12/16 allowances burn by mid-season, and the guard measures the weeks the refusals
// actually land on. "Non-rest" is honoured by exclusion: a week her own body blocks everything
// (layoff, the doctor's veto) is a rest week, not a boredom week. If the guard fails on any
// measured week, the cap numbers move or the conflict ships to the owner - never silently
// (§5: "do NOT ship a failing guard silently").

import {
  createWorld,
  enterEvent,
  entryStatus,
  tickWeek,
  skipTournament,
  closeTournament,
  isBlackoutWeek,
  layoffCovering,
  medicalBlock,
  recomputeKidRank,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 12)
const WEEKS = argOf('weeks', 260) // ages 14 -> 19: the whole corridor the 16/17 caps can meter

let cappedRefusals = 0
let cappedWeeks = 0
let violations = 0
const fallbackFamilies = new Map<string, number>()
const violationRows: string[] = []

function sweepWeek(world: WorldState): void {
  // The decision moment: events whose entry list closes THIS week.
  const closing = world.season.filter((e) => e.deadlineWeek === world.week)
  const cappedW = closing.filter(
    (e) => TIERS[e.tier].track === 'wta' && entryStatus(world, e).reason === 'capped',
  )
  if (cappedW.length === 0) return
  cappedRefusals += cappedW.length
  const targetWeeks = new Set(cappedW.map((e) => e.week))
  for (const week of targetWeeks) {
    // The guard's own exclusions (§5's "non-rest, non-blackout"): a blackout week offers nothing
    // to anybody, and a week her own body rules out - a layoff covering it, or the doctor's veto
    // today - is a REST week, not a boredom week: nothing the calendar offered could be played.
    if (isBlackoutWeek(week)) continue
    if (layoffCovering(world, week) !== null || medicalBlock(world.condition) !== null) continue
    cappedWeeks++
    const alternatives = world.season.filter((e) => {
      if (e.week !== week || TIERS[e.tier].track === 'wta') return false
      const s = entryStatus(world, e)
      return s.level === 'ok' || s.level === 'caution'
    })
    if (alternatives.length === 0) {
      violations++
      // CLASSIFY the stranding, because "nothing playable" has three different owners: no non-W
      // event scheduled at all (the calendar's fault), every J blocked by the JUNIOR cap (the
      // shipped Appendix-F rule composing with ours - both real allowances spent), or something
      // else (locked bands, outgrown rungs). The receipt reports which rule strands the week.
      const nonW = world.season.filter((e) => e.week === week && TIERS[e.tier].track !== 'wta')
      const reasons = nonW.map((e) => `${e.tier}:${entryStatus(world, e).reason ?? 'ok'}`)
      const jCapped = nonW.some(
        (e) => TIERS[e.tier].track === 'itf' && entryStatus(world, e).reason === 'capped',
      )
      violationRows.push(
        `  seed ${world.seed} week ${week} (offset ${week % 52}): W refused by pro cap; ` +
          (nonW.length === 0 ? 'NO non-W event scheduled' : `others [${reasons.join(', ')}]`) +
          (jCapped ? ' <- the JUNIOR cap strands the J half' : ''),
      )
    } else {
      const strongest = alternatives.sort(
        (a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
      )[0]
      fallbackFamilies.set(
        TIERS[strongest.tier].track,
        (fallbackFamilies.get(TIERS[strongest.tier].track) ?? 0) + 1,
      )
    }
  }
}

/** Keep every book elite so every gate but the two caps stands open - the L11 idiom: standing
 *  rows, re-stamped so the rolling window never ages them out. Pure state, bench-only. */
function stampEliteBooks(world: WorldState): void {
  world.results = world.results.filter((r) => r.playerId !== KID_ID)
  world.results.push({ playerId: KID_ID, week: world.week, points: 1500, tier: 'national' })
  for (let i = 0; i < 4; i++) {
    world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
  }
  // A real W book too, so the acceptance rungs above the on-ramp read a live position for her.
  world.results.push({ playerId: KID_ID, week: world.week, points: 100, tier: 'w100' })
  recomputeKidRank(world)
}

for (let s = 0; s < SEEDS; s++) {
  const world = createWorld(`boredom-${s}`)
  const rng = rngFromSeed(world.seed)
  const strongestFirst = [...TIER_LADDER].reverse()
  stampEliteBooks(world)
  for (let i = 0; i < WEEKS; i++) {
    world.fundsCents = Math.max(world.fundsCents, 1_000_000_00)
    if (world.week % 26 === 0) stampEliteBooks(world)
    // Greedy strongest-first entries, one per week, with a LOW fitness bar (30 - racing tired is
    // the owner's allowed choice) so the 12/16 allowances genuinely run out mid-season.
    if (world.condition >= 30) {
      for (const tier of strongestFirst) {
        const e = world.season.find(
          (x) =>
            x.tier === tier &&
            x.deadlineWeek >= world.week &&
            x.deadlineWeek - world.week <= 2 &&
            !world.entries.includes(x.id) &&
            !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (!e) continue
        try {
          enterEvent(world, e.id)
          break
        } catch {
          /* gate said no - try the next rung down */
        }
      }
    }
    sweepWeek(world)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  console.error(`  career ${s + 1}/${SEEDS} done`)
}

console.log(`BOREDOM GUARD - ${SEEDS} careers x ${WEEKS} weeks (ages 14-19), greedy fit-first policy`)
console.log(`  W entries refused by the pro cap (at their deadline): ${cappedRefusals}`)
console.log(`  distinct non-blackout target weeks those refusals covered: ${cappedWeeks}`)
console.log(`  weeks with NO playable J/domestic alternative: ${violations}  <- MUST be 0 to ship`)
for (const [family, n] of fallbackFamilies) {
  console.log(`  strongest fallback family '${family}': ${n} weeks`)
}
if (violations > 0) {
  console.log('VIOLATIONS:')
  for (const row of violationRows.slice(0, 40)) console.log(row)
  process.exitCode = 1
}
