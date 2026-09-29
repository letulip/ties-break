// ⭐⭐⭐ THE SHOOT/TOURNAMENT COLLISION, OWNED ONCE – W5's T5.11 (26.09), findings F-01 and H-07.
//
// ⚠⚠ FIVE COPIES, NOT THREE. F-01's table has three (`round29-shoot-clash`,
// `component/round29-shoot-clash-ui`, `component/round30-do-both-shoot`) and the intake adds
// `dev-fast-forward`'s as a fourth. Counted at this wave's head, `function clashWorld(` has FIVE
// definitions in `tests/`: W2 wrote two more (`tests/principles-unknown-answers.test.ts:109` and
// `tests/component/principles-w2-blocking-card-refusal.test.ts:253`), each copying a different one of
// the first three and each having to be told the paper's two-shoot shape again.
//
// ⚠⚠ AND THE SIXTH IS NOT A COPY AT ALL, WHICH IS WHAT READING IT SETTLED. `tests/dev-fast-forward.test.ts`
// carries a note naming T5.11 as «where it stops being a fourth copy of `clashWorld`», so it was read
// before anything was written here – and it differs on every axis that matters: it does not pose week
// 216 but walks a QUIET career (`world.season = []`) to an arbitrary week; its paper has its own id
// scheme (`devff-ad-<week>`), its own window (`world.week - 5` to `world.week + 40`) and no 216-relative
// anything; and it takes the entry through the real `enterEvent` command rather than by assigning
// `world.entries`, because that world is about to travel the real save codec into the real worker.
// Folding it in would have changed the fixture it is there to drive. Its comment is re-aimed to say so
// rather than left promising a migration that would be wrong.
//
// ⚠⚠ THE DRIFT THE 23.09 REPAIR PAID FOR, AND WHY IT DECIDES THIS FILE'S DEFAULTS. `5fce54c1` re-aimed
// two of the three copies; the third was found by a full gate and repaired alone in `bc29ac13`, whose
// message is «the third sibling the sweep missed». Every default below therefore NAMES the call site
// whose constant it came from, and every difference that is not a default is passed explicitly at the
// call site rather than absorbed here – a default that quietly replaces a local constant is how a
// migration hides a change instead of proving one.
import { createWorld, type WorldState } from '../../../src/engine/world'
import { adOfferId } from '../../../src/engine/offers'
import { ECONOMY } from '../../../src/engine/economy'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import type { SeasonEvent } from '../../../src/engine/season/types'
import type { AdOfferTerms } from '../../../src/shared/protocol/offers'

/** The shipped watch letter's shape – the ≤200 band's cell and the 52-week, two-shoot ask.
 *
 *  ⚠ INDEX 1 SINCE ROUND 34 #7/#11/#12/#13 (03.09), AND IT IS THE SAME ≤200 CELL. A fifth band was
 *  prepended to `advertising.bands` at ≤400, so every band index moved one to the right; the cheque
 *  itself was lifted tenfold at that rung by the owner's approved table. Four of the five copies
 *  spelled this out locally under the name `WATCH`; `const WATCH = {` is in 6 test files (F-01). */
export const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  maxWtaRank: ECONOMY.advertising.bands[1].maxWtaRank,
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}

/**
 * A SIGNED AD PAPER, posed – `kind: 'ad'` is hand-built in 17 test files (F-01), and this is the
 * `round29-shoot-clash.test.ts:74-116` shape it is hand-built in.
 *
 * `at` is the week the world is STANDING on; the letter is dated ten weeks back, which is where all
 * five copies date it.
 *
 * ⚠ `shootWeeks` DEFAULTS TO THE REAL TWO-SHOOT SHAPE and that default is the 23.09 cancel-share
 * repair speaking: the divisor is the paper's own list now, so a single-week default would read as
 * «the whole campaign in one shoot» and price a cancel at the full cheque. Every one of the five copies
 * carries that same re-aim in its own comment. The caller still names the weeks it cares about.
 *
 * ⚠ `brand` DEFAULTS TO `WATCH.brand` – `ECONOMY…watches.houses[0]` – WHICH IS FOUR OF THE FIVE CALL
 * SITES' OWN CONSTANT (`round29-shoot-clash`, `round29-shoot-clash-ui`,
 * `principles-w2-blocking-card-refusal`, `principles-unknown-answers`). The fifth,
 * `component/round30-do-both-shoot.test.ts:65`, poses `BRAND = 'Nine Bells'` – a house the engine
 * cannot write (`ECONOMY` lists «Quiet Hour», «Halfpast», «Silver Alder») – so it passes its brand
 * EXPLICITLY and its world hash does not move. F-01 leaves whether that was intended as an open
 * question for the owner; keeping the value at the call site is what lets the question stay open
 * instead of being answered by a default.
 */
export function signedAdPaper(
  world: WorldState,
  opts: {
    at: number
    shootWeeks?: number[]
    termWeeks?: number
    brand?: string
    cashCents?: number
  },
): void {
  const at = opts.at
  const termWeeks = opts.termWeeks ?? WATCH.termWeeks
  world.offers.push({
    id: adOfferId(at - 10),
    kind: 'ad',
    week: at - 10,
    deadlineWeek: at - 7,
    state: 'signed',
    decidedWeek: at - 10,
    fromWeek: at - 10,
    untilWeek: at - 10 + termWeeks - 1,
    terms: {
      brand: opts.brand ?? WATCH.brand,
      cashCents: opts.cashCents ?? WATCH.cashCents,
      termWeeks,
      shootCount: 2,
      shootWeeks: opts.shootWeeks ?? [at + 1, at + 22],
    } as AdOfferTerms,
  })
}

/** A `SeasonEvent` she holds an entry for – 05.09 C.4's fixture, whose `travelCostCents: 100_00` is in
 *  34 test files. The calendar becomes this one event and the entry is taken, because a collision needs
 *  both halves.
 *
 *  ⚠⚠ THE KEY ORDER IS THE FIVE COPIES' OWN AND IT IS LOAD-BEARING, which the hash control found the
 *  hard way: the first version of this helper spread `...event` over a defaults object, so the keys came
 *  out `tier, surface, travelCostCents, deadlineWeek, id, week` and ALL 32 call sites' world hashes
 *  moved – a fixture that behaves identically and serialises differently. `JSON.stringify` sees order,
 *  every save and every frozen hash in this repo goes through it, and a spread is exactly how a field
 *  list quietly reorders itself. So the literal is written out in the copies' order and the overrides
 *  are read from the argument by name. */
export function pushEvent(
  world: WorldState,
  event: { id: string; week: number; tier?: SeasonEvent['tier']; surface?: SeasonEvent['surface']; travelCostCents?: number; deadlineWeek?: number },
): SeasonEvent {
  const full = {
    id: event.id,
    week: event.week,
    tier: event.tier ?? 'local',
    surface: event.surface ?? 'hard',
    travelCostCents: event.travelCostCents ?? 100_00,
    deadlineWeek: event.deadlineWeek ?? event.week - 3,
  } as SeasonEvent
  world.season = [full]
  world.entries = [full.id]
  return full
}

/** Week 216 – offset 8 of season 5, an ordinary in-season adult week. `tests/ad-offer.test.ts`'s own
 *  probe week, for the same reason: one condition varies. */
export const CLASH = 216
/** The week the question can be asked on, and the ONLY one: two of its four answers stop being
 *  possible once the clash week begins. */
export const AT = CLASH - 1

/**
 * ⭐⭐⭐ THE COLLISION, BUILT: a signed campaign that names `CLASH` and an entry she holds for the same
 * week, with the world standing on `AT`.
 *
 * The `shootProbe` idiom of `tests/ad-offer.test.ts`: a fresh world handed a signed deal whose shoot
 * weeks the test controls. Walking a career until a house happened to write AND the dice happened to
 * name a week she was entered in would be testing `chooseShootWeeks` and `rollInjury` at once; what is
 * under test is what the collision DOES.
 *
 * ⚠ `bodyPose` DEFAULTS TO ON, AND THE DEFAULT IS THE MAJORITY'S: three of the five copies set
 * `plan = { train: 60, rest: 40 }`, `physioActive = false` and `condition = 50`
 * (`round29-shoot-clash`, `round30-do-both-shoot`, `principles-unknown-answers`); the two that do not
 * are the two UI copies (`round29-shoot-clash-ui`, `principles-w2-blocking-card-refusal`) and they pass
 * `bodyPose: false`. F-01 proposes this default in those words.
 *
 * ⚠ `untilWeek` WAS WRITTEN THREE WAYS AND IS ONE NUMBER. `AT - 10 + WATCH.termWeeks - 1`,
 * `AT - 10 + termWeeks - 1` and the literal `AT - 10 + 51` are all `AT - 10 + 51`, because every copy
 * runs a 52-week term. Checked rather than argued: the hash control in the report shows no call site
 * moving.
 */
export function clashWorld(
  seed: string,
  opts: {
    shootWeeks?: number[]
    deadlineWeek?: number
    termWeeks?: number
    brand?: string
    bodyPose?: boolean
  } = {},
): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  if (opts.bodyPose ?? true) {
    world.plan = { train: 60, rest: 40 }
    world.physioActive = false
    world.condition = 50
  }
  world.fundsCents = 500_000_00
  pushEvent(world, {
    id: `${seed}-event`,
    week: CLASH,
    // Past the deadline by default – the realistic case, and the one where a withdrawal forfeits.
    deadlineWeek: opts.deadlineWeek ?? AT - 2,
  })
  signedAdPaper(world, {
    at: AT,
    shootWeeks: opts.shootWeeks ?? [CLASH, CLASH + 21],
    termWeeks: opts.termWeeks,
    brand: opts.brand,
  })
  return world
}
