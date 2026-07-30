/**
 * LOAD BENCH – "how many weeks does this family lose, and does the coach rung change it?"
 *
 * WHY IT EXISTS, AND WHY IT EXISTS *FIRST*. docs/specs/coach-as-load-manager.md names exactly one
 * number the slice lives or dies on:
 *
 *   > Weeks lost, per coach rung - to injury layoff, to a knock rested, to a tournament entered too
 *   > tired to win. BEFORE AND AFTER, 120 seeds, both policy arms.
 *
 * There was no "before". Nothing in the repo counted weeks lost by rung, so the spec's own proof was
 * unmeasurable on the day it was agreed. This tool is that ruler, and it is deliberately built and run
 * BEFORE a single engine knob moves - the baseline is worthless once the mechanism it is supposed to
 * bracket already exists.
 *
 * ⚠ AND THE BASELINE IS A REAL PREDICTION, NOT A FORMALITY. The spec's section 4(c) claims the coach
 * does NOTHING about load today - «not a little - nothing» - with one exception, `coachIncludesPhysio`,
 * a boolean true for all four hired rungs equally. If that is right, this bench should show:
 *   * a CLIFF between self and budget (physio arrives), and
 *   * four hired rungs that are flat within noise.
 * A ladder that already slopes across the hired rungs would mean the spec's premise is wrong and the
 * design needs revisiting before it is built. Either answer is worth having; only one of them is a
 * formality.
 *
 * MEASUREMENT ONLY. Imports the engine, reads snapshots, changes nothing. The knock is ANSWERED by the
 * arm's own policy (see POLICIES) because an unanswered knock blocks `advanceWeeks` but not `tickWeek`,
 * so a bench that ignored the prompt would leave `world.knock.choice` null for the whole career and
 * silently measure a game in which no knock ever costs anything.
 *
 * THE THREE WAYS A WEEK IS LOST, each defined against an engine rule rather than a vibe:
 *   layoff   `world.injury !== null`  - she is not cleared to play. The big one.
 *   rested   `knockRestWeek`          - she is at home, earning KNOCK_REST_GROWTH of a week's work.
 *   wasted   a tournament she entered while `condition < minConditionToEnter[tier]` AND lost her first
 *            match in. The spec's "too tired to win", operationalised: the trip was paid for, the week
 *            was spent, and nothing came back. Not every tired entry - only the ones that returned zero.
 *
 * PAIRED SEEDS: the seed is `load-<index>`; THE RUNG IS NOT IN THE SEED, so every rung faces the same
 * calendar, the same cohort and the same girl. Same discipline as the radar bench.
 *
 * Run:  npm run bench:load
 *       npm run bench:load -- --seeds 40 --weeks 208
 */
import {
  availabilityStatus,
  closeTournament,
  createWorld,
  decideKnock,
  enterEvent,
  KID_ID,
  matchesEverPlayed,
  pendingKnock,
  coachLoadViewOf,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { knockRestWeek } from '../src/engine/knock'
import { coachManagesLoad, coachWarnsEntry } from '../src/engine/coachLoad'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CoachTier,
  type KnockChoice,
  type WeekPlan,
} from '../src/shared/protocol'

const args = process.argv.slice(2)
function flag(name: string, fallback: number): number {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** 24 by default: the spec asks for 120, which takes minutes; 24 is the number that fits an iteration
 *  loop. The figure quoted to the owner is always a full `--seeds 120` run. */
const SEEDS = flag('seeds', 24)
/** 14 -> 18, the career the game actually ships. */
const WEEKS = flag('weeks', 208)
const TIERS: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']

const f1 = (x: number) => x.toFixed(1)
const pad = (s: string, n: number) => s.padEnd(n)
const padL = (s: string, n: number) => s.padStart(n)
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

// =================================================================================================
// THE TWO ARMS
// =================================================================================================
//
// The spec asks for "both policy arms", which in this repo's vocabulary (tools/fatigue-bench.ts
// POLICIES) means the grinder and the ordinary player. The KNOCK ANSWER is what makes them differ in
// the way this bench is about: the grinder trains through everything and buys the loaded injury roll,
// the player takes the week. That is the decision the wave is going to hand to a hired coach, so the
// baseline has to show what it is worth in a player's hands first.

interface Policy {
  id: string
  label: string
  plan: WeekPlan
  /** what he does when the week stops and asks */
  knock: KnockChoice
  /** null = enter everything she is eligible for. A number = skip if condition is under the tier's
   *  own floor plus this margin, i.e. a parent who reads the caution and believes it. */
  entryMargin: number | null
  /** does he skip a trip his HIRED coach advises against? Meaningless on a self-coached career, where
   *  there is nobody to advise - which is exactly why the self row of this arm is the same career as the
   *  `player` arm's, and a fair control for it. */
  followsCoach: boolean
}

const POLICIES: Policy[] = [
  { id: 'grinder', label: 'grinder 85/15, pushes every knock, enters all', plan: WEEK_PLAN_PRESETS.grind, knock: 'push', entryMargin: null, followsCoach: false },
  { id: 'player', label: 'player 75/25, rests every knock, heeds the caution', plan: WEEK_PLAN_PRESETS.balanced, knock: 'rest', entryMargin: 5, followsCoach: false },
  // ⚠ THE THIRD ARM, AND WITHOUT IT HALF THE SLICE IS UNMEASURED. `coachWarnsEntry` produces ADVICE, and
  // advice is worth exactly nothing until somebody acts on it - so both arms above, which enter by their
  // own fixed margin, are blind to whether a better rung gives better advice. This arm is the parent who
  // reads the line on the card and believes it. It is also the only arm in which the four hired rungs can
  // differ on `wasted` at all, because that is the number the advice is about.
  { id: 'listener', label: 'listener 75/25, rests every knock, SKIPS what the coach warns off', plan: WEEK_PLAN_PRESETS.balanced, knock: 'rest', entryMargin: null, followsCoach: true },
]

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Career {
  /** weeks she was laid up */
  layoff: number
  /** weeks she spent resting a knock */
  rested: number
  /** tournaments entered under the tier's condition floor that returned nothing */
  wasted: number
  /** how many separate injuries she picked up */
  injuries: number
  /** how many knocks the week stopped to ask about */
  knocks: number
  /** ...of which the PARENT had to answer. On a self-coached career that is all of them; on a hired one
   *  only the ones the coach escalated. THE SECOND THING THE RUNG SELLS (coachLoad.ts `coachEscalates`):
   *  "you are buying your attention back" is this number, and it is the one measurement the spec did not
   *  ask for because the mechanism that produces it did not exist when the spec was written. */
  taps: number
  /** ...and how many he handled alone. `knocks - taps`, kept explicitly so a run can be read without
   *  arithmetic. */
  handled: number
  /** what she got for the weeks she DID have */
  matches: number
  finalRank: number
  weeks: number
}

function runCareer(seed: string, tier: CoachTier, policy: Policy, weeks: number): Career {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...policy.plan }

  const c: Career = { layoff: 0, rested: 0, wasted: 0, injuries: 0, knocks: 0, taps: 0, handled: 0, matches: 0, finalRank: 0, weeks }
  let lastInjurySince = -1

  for (let w = 0; w < weeks; w++) {
    // His coach's read of her, this week. Null when self-coached: nobody to ask.
    const coachLoad = policy.followsCoach && coachManagesLoad(tier) ? coachLoadViewOf(world) : null
    // --- entries, the way a player makes them ---------------------------------------------------
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      const floor = ECONOMY.availability.minConditionToEnter[e.tier]
      if (policy.entryMargin !== null && world.condition < floor + policy.entryMargin) continue
      // The coach's line on the card, taken at face value. Read at ENTRY time, which is when the player
      // sees it - his condition days or weeks later is not what the card said.
      if (policy.followsCoach && coachLoad !== null && coachWarnsEntry(coachLoad, floor)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* cannot afford / not eligible – the player would see the lock */
      }
    }

    // ⚠ READ THE TIRED-ENTRY STATE *BEFORE* THE TICK, AND FOR THE WEEK THE TICK IS ABOUT TO PLAY.
    // Two off-by-ones live here and the first draft had the second one:
    //   * AFTER the tick her condition is the drained one the week produced, so the question has to be
    //     asked first - otherwise `wasted` inflates on every arm equally, which is worse than a bias
    //     because it looks like a real signal.
    //   * `tickWeek` opens with `world.week += 1`, so at this point `world.week` is the week she has
    //     ALREADY finished. The tournament about to be played is the one scheduled at `week + 1`.
    //     Reading the current week found nothing and reported a flat `wasted: 0.0` across all ten
    //     cells - a clean, plausible, entirely false zero.
    const playing = tournamentAt(world, world.week + 1)
    const tiredEntry =
      playing !== null && world.condition < ECONOMY.availability.minConditionToEnter[playing]

    const injuredBefore = world.injury !== null
    if (injuredBefore) c.layoff++
    if (knockRestWeek(world.knock, world.week)) c.rested++

    tickWeek(world, rng)

    // a NEW injury (the onset week has `sinceWeek === world.week`)
    if (world.injury !== null && world.injury.sinceWeek !== lastInjurySince) {
      lastInjurySince = world.injury.sinceWeek
      c.injuries++
    }
    // ⚠ THE PARENT ONLY ANSWERS WHAT REACHES HIM NOW. On a hired career the coach has already replied by
    // the time the tick returns, so `pendingKnock` is false and this does not fire - which is the routing
    // working, not the bench missing something. `knockHistory` is what counts the knocks themselves.
    if (pendingKnock(world)) {
      decideKnock(world, policy.knock)
      c.taps++
    }

    let wonNothing = false
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      wonNothing = kidWonNothing(world)
      closeTournament(world)
    }
    if (tiredEntry && wonNothing) c.wasted++
  }

  // Every knock this career had, answered by whoever answered it: the retired ones plus any still open.
  c.knocks = world.knockHistory.length + (world.knock ? 1 : 0)
  c.handled = Math.max(0, c.knocks - c.taps)
  const snap = toSnapshot(world)
  c.matches = matchesEverPlayed(world)
  c.finalRank = snap.kidRank
  return c
}

/** The tier of the tournament she is entered in for `week`, or null. Read off the entries rather than
 *  the pending state, because the pending state only exists once the tick has created it - which is the
 *  whole reason this is asked before the tick and not after. */
function tournamentAt(world: WorldState, week: number): (typeof world.season)[number]['tier'] | null {
  const e = world.season.find((x) => x.week === week && world.entries.includes(x.id))
  return e ? e.tier : null
}

/**
 * Did she go out without winning anything? One win anywhere means the trip returned something, which is
 * the line `wasted` is drawn on.
 *
 * ⚠ `p.result.matches`, NOT `p.matches` - THE FIRST DRAFT READ A FIELD THAT DOES NOT EXIST. Written as
 * `(p.matches ?? []).filter(...)`, which is valid TypeScript against an `any`-ish path, always produced
 * an empty array, and therefore always answered "she won something". Combined with the week off-by-one
 * it reported a confident `wasted: 0.0` in all ten cells - and 0.0 is a plausible reading here, which is
 * exactly why it survived a first look. The probe that killed it counted the two halves separately:
 * 15 of 30 trips ARE made under the floor, so the zero could only have been mine.
 */
function kidWonNothing(world: WorldState): boolean {
  const p = world.pendingTournament
  if (!p) return false
  const hers = p.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
  if (hers.length === 0) return false
  return !hers.some((m) => m.winnerId === KID_ID)
}

// =================================================================================================
// THE TABLES
// =================================================================================================

function run(): void {
  console.log(`LOAD BENCH – weeks lost per coach rung. ${SEEDS} seeds x ${WEEKS} weeks (14 -> ${14 + Math.round(WEEKS / 52)}), paired.`)
  console.log('Measurement only: no engine number is touched by this file.\n')

  for (const policy of POLICIES) {
    console.log(`=== ${policy.label.toUpperCase()} ===`)
    console.log(
      `${pad('rung', 8)}${padL('layoff', 8)}${padL('rested', 8)}${padL('wasted', 8)}${padL('LOST', 7)}` +
        `${padL('injuries', 10)}${padL('knocks', 8)}${padL('TAPS', 7)}${padL('handled', 9)}${padL('matches', 9)}${padL('rank', 7)}`,
    )
    const lostByTier: Record<string, number> = {}
    for (const tier of TIERS) {
      const cs = Array.from({ length: SEEDS }, (_, i) => runCareer(`load-${i}`, tier, policy, WEEKS))
      const layoff = mean(cs.map((c) => c.layoff))
      const rested = mean(cs.map((c) => c.rested))
      const wasted = mean(cs.map((c) => c.wasted))
      const lost = layoff + rested + wasted
      lostByTier[tier] = lost
      console.log(
        `${pad(tier, 8)}${padL(f1(layoff), 8)}${padL(f1(rested), 8)}${padL(f1(wasted), 8)}${padL(f1(lost), 7)}` +
          `${padL(f1(mean(cs.map((c) => c.injuries))), 10)}` +
          `${padL(f1(mean(cs.map((c) => c.knocks))), 8)}${padL(f1(mean(cs.map((c) => c.taps))), 7)}` +
          `${padL(f1(mean(cs.map((c) => c.handled))), 9)}${padL(f1(mean(cs.map((c) => c.matches))), 9)}` +
          `${padL(f1(mean(cs.map((c) => c.finalRank))), 7)}`,
      )
    }
    // THE HEADLINE THE SPEC ASKS FOR: is there a purchase here at all?
    const spread = lostByTier.self - lostByTier.elite
    const cliff = lostByTier.self - lostByTier.budget
    const acrossHired = lostByTier.budget - lostByTier.elite
    console.log(`\n  self -> elite:  ${f1(spread)} weeks`)
    console.log(`  self -> budget: ${f1(cliff)} weeks   (the physio boolean, which is the ONLY load lever a rung has today)`)
    console.log(`  budget -> elite: ${f1(acrossHired)} weeks   (⚠ the spec predicts ~0: four hired rungs, one identical boolean)\n`)
  }
}

run()
