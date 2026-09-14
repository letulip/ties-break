// THE SPOTLIGHT'S BENCH-SIDE READER – one week of her public life, and what the pass charged for it.
// (v77, wave 6's T9. Shared by `tools/spotlight-bench.ts` and `tools/psy-grid.ts`'s fifth column.)
//
// ⚠⚠ WHY THIS FILE EXISTS AT ALL, AND IT IS THE REPO'S OWN TWO-SIDES-ONE-QUESTION DOCTRINE. Two
// benches need the number a week was CHARGED by the spotlight, and `exposurePressure`
// (engine/spirit.ts) is module-private – it takes five already-resolved values because ruling L
// forbids it re-deriving any of them, so it cannot be called from outside the pass. A bench that
// wants that number has two honest options: export a private engine function for a bench's sake, or
// spell the product ONCE on this side where a disagreement with the engine is visible. This is the
// second, and «once» is the load-bearing word: a copy in each bench is the defect class
// `src/art/venues.ts:150` records, with the two copies free to drift from each other and from the
// engine on the next re-tune.
//
// ⚠ WHAT IS **NOT** COPIED IS EVERY FACTOR. `habituationScale` and `publicLifeShrinkAt` are the
// ENGINE's own exported functions, called here; the other three are read straight off `ECONOMY`. The
// only thing this file spells is the MULTIPLICATION, which is one line and moves with every re-tune
// of any row it reads.
//
// ⚠⚠⚠ RULING G – THE LEDGER IS READ **IN-WEEK**, AND THAT IS A CORRECTNESS PROPERTY OF THIS FILE
// RATHER THAN A STYLE. Four of the five exposure kinds read facts the world keeps forever;
// `'publicLoss'` reads `world.results`, which PRUNES AT 52 WEEKS. A bench that walked a career and
// then asked `exposureEventsOf(world, oldWeek)` afterwards would see every `'stage'` and NO
// `'publicLoss'`, and would report the prune as if it were a fact about her life. So `readSpotWeek`
// is called IMMEDIATELY AFTER each `stepCareerWeek`, about the week that has just closed – zero
// weeks old, deep inside the horizon.
//
// ⚠⚠ AND THAT IS ALSO THE ONLY HONEST MOMENT TO ASK IT, because of ruling U: `finalizeTournament` is
// a WORKER COMMAND and not a tick step, so this week's trophy row and result row are written by
// `stepCareerWeek`'s own `skipTournament`/`closeTournament` tail, AFTER `tickWeek` has returned. A
// read taken before the step, or from inside it, would be a read of a week whose results do not
// exist yet – which is exactly the shape ruling P found starving two of the five kinds.
import { exposureEventsOf, fameAt, psychologistWorksThisWeek, sheIsNewsAt, type ExposureKind, type WorldState } from '../src/engine/world'
import { expressedTemperamentOf, habituationScale, publicLifeShrinkAt, temperamentIntensity, temperamentOpenness, WALLS_AXES } from '../src/engine/spirit'
import { psychologistWorkingRung } from '../src/engine/world/psychologist'
import { ECONOMY } from '../src/engine/economy'

/** The five kinds, in the ledger's own declaration order. */
export const EXPOSURE_KINDS: readonly ExposureKind[] = ['stage', 'shoot', 'publicLoss', 'aired', 'wrongStory']

/** ONE WEEK OF HER PUBLIC LIFE, recorded as the walk runs and indexed by the week that has CLOSED. */
export interface SpotWeek {
  /** `sheIsNewsAt(world, week)` at whatever bar this arm walked under */
  news: boolean
  fame: number
  /** ⚠⚠ IN-WEEK (ruling G) – the events of THIS week, asked the instant the week closed. */
  exposure: ExposureKind[]
  /** `world.spotlightHabituation` at the END of this week – which is the value the NEXT week's pass
   *  reads at its head, because `growHabituation` runs AFTER `accrueSpirit` (the architect's ruling
   *  Q: «the scale must be read with the habituation she came into the week holding»). */
  habituation: number
  /** the rung working «The public life» this week, or `undefined` – the engine's own predicate, which
   *  is `publicLifeRung`'s twin (`psychologistWorksThisWeek` + the focus + the rung). */
  workingRung: 0 | 1 | 2 | undefined
  /** `psychologistWorksThisWeek` – the BILLING predicate, which the never-fired corridor counts on. */
  paid: boolean
  spirit: number
  /** who she is READ AS this week – the two axes `accrueSpirit` keys the product's middle factors on. */
  openness: 'open' | 'private'
  intensity: 'steady' | 'intense'
  /** either wall flipped – ruling H's EITHER-axis freeze, read off the FLAG and never the lean. */
  walled: boolean
}

/** ⭐⭐⭐ THE IN-WEEK READ. Call it immediately after `stepCareerWeek`; `world.week` is then the week
 *  that has just closed and every record it needs is written. Pure: reads the world, writes nothing,
 *  draws nothing. */
export function readSpotWeek(world: WorldState): SpotWeek {
  const week = world.week
  const expressed = expressedTemperamentOf(world)
  return {
    news: sheIsNewsAt(world, week),
    fame: fameAt(world, week),
    exposure: exposureEventsOf(world, week).map((e) => e.kind),
    habituation: world.spotlightHabituation ?? 0,
    workingRung: psychologistWorkingRung(world, 'publicLife'),
    paid: psychologistWorksThisWeek(world),
    spirit: world.spirit,
    openness: temperamentOpenness(expressed),
    intensity: temperamentIntensity(expressed),
    walled: WALLS_AXES.some((ax) => world.wallsFlipped[ax]),
  }
}

/** ⭐⭐⭐ WHAT THE PASS RESOLVING WEEK `c` CHARGED HER, in spirit points – negative, or exactly 0 on a
 *  quiet week.
 *
 *  ⚠⚠⚠ THE INDEXING IS RULING P's AND RULING Q's TOGETHER, AND EVERY ONE OF THE FOUR READS BELOW IS
 *  ON A DELIBERATE SIDE OF THE TICK. The first draft of this function had ONE of them wrong, so they
 *  are written out rather than trusted (`src/engine/spirit.ts`'s `accrueSpirit` is the source):
 *
 *    · THE EVENTS come from `exposureEventsOf(world, world.week − 1)` at the call site
 *      (`world/phaseHerWeek.ts`) – so week `c`'s pass pays for week `c − 1`'s cameras. → `before`.
 *    · HER EXPRESSION is read ONCE AT THE HEAD of the pass (`const expressed =
 *      expressedTemperamentOf(world)`, ruling F's «one girl for the whole week»), and `driftWalls` –
 *      the only thing that can FLIP a wall – runs on the line AFTER `accrueSpirit`. So the value the
 *      pass for week `c` reads is the value that stood at the END of week `c − 1`. → `before`.
 *      ⚠ THIS IS THE ONE THE FIRST DRAFT GOT WRONG, and it is wrong only on a FLIP WEEK – the rarest
 *      week in the model and the one where the ×0.75/×1.5 openness factor changes by a factor of two.
 *    · THE HABITUATION is read inside the pass, and `growHabituation` runs AFTER it (ruling Q part 1:
 *      «the scale must be read with the habituation she came into the week holding»). → `before`.
 *    · THE SEAT is `psychologistWorksThisWeek(world)`, evaluated at the call site at step 4 of week
 *      `c`'s own tick – a week-`c` fact. → `now`.
 *
 *  ⚠ THE ONE RESIDUAL IMPRECISION, NAMED RATHER THAN HIDDEN: `readSpotWeek` takes the seat read at the
 *  END of the tick and the pass took it at step 4, so a week on which `growAndLive` (step 7) changes
 *  the college freeze is read one step late. That is a boundary week of a college year and nothing
 *  else; it is stated here because an imprecision nobody wrote down is one the next wave finds as a
 *  bug.
 *
 *  ⚠ THE CHARGE IS ALSO THE WEEK THE PLAYER READS THE DIP. «The cameras were everywhere» is a feed
 *  row on week `c − 1`'s events and a Mood movement on week `c`, so every table built on this
 *  function is indexed by the CHARGE week rather than by the exposure week. */
export function chargeAt(wk: readonly SpotWeek[], c: number): number {
  const now = wk[c]
  const before = wk[c - 1]
  if (now === undefined || before === undefined) return 0
  let total = 0
  for (const kind of before.exposure) {
    total +=
      ECONOMY.spotlight.pressureBase[kind] *
      ECONOMY.spirit.perturbationScale[before.intensity] *
      ECONOMY.spotlight.opennessScale[before.openness] *
      habituationScale(before.habituation) *
      publicLifeShrinkAt(now.workingRung)
  }
  return total
}

/** How many EVENTS the pass resolving week `c` was handed – the denominator of «what one exposure
 *  costs», which is a different question from «what a busy week costs». */
export function eventsChargedAt(wk: readonly SpotWeek[], c: number): number {
  return wk[c - 1]?.exposure.length ?? 0
}
