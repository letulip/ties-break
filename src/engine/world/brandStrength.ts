// ⭐⭐⭐ BRAND STRENGTH – round 32 #4, docs/specs/brand-inertia-2026-08.md.
//
// THE OWNER: «А еще интересно, что будет происходить с годами падения в таблице (как у нее сейчас) –
// известность тоже будет падать и стоимость бренда, соответственно?» – and, on being shown the
// answer: «Инерция бренда – звучит интересно, давай попробуем».
//
// ⚠⚠ THE MEASUREMENT THAT FORCED IT, off his own week-933 career projected five years with nothing
// won: $831,382 -> $9,098. A 99% capital loss, and the cause is arithmetic rather than tuning – fame
// halves every 104 weeks, the income goes as fame², and since round 32 #3 the multiple rises with
// fame too, so the WORTH goes as fame³ and falls eightfold every two years. What that models is not
// a brand; it is a live reading of ATTENTION, priced as if it were one. A brand once built holds a
// name, a shelf, a distribution and a customer who already owns two of its shirts.
//
// ⭐⭐ THE SPLIT, stated so a later reader does not collapse it back (spec §4): INCOME IS A FLOW and
// keeps reading fame – this year's noise really does sell this year's shirts. WORTH IS A STOCK and
// reads what is below. Today one number did both jobs and neither well.
//
// ⭐⭐⭐ THE SHAPE, AND IT IS HIS RULING WRITTEN AS ONE LINE («падает, но с полураспадом в годах, плюс
// пол в доле от пика – чтобы карьера, которая реально была большой, никогда не оценивалась по
// минимуму. – да»):
//
//     strength(w) = max over t ≤ w of   fame(t) × max(floorShare, 2^(-(w - t) / halfLifeWeeks))
//
// «The best she has ever been, faded on a half-life measured in YEARS, and never below a share of
// that best.» BOTH HALVES OF HIS RULING FALL OUT OF THE ONE KERNEL: the fade is the half-life, and
// because the kernel floors at `floorShare` the whole expression floors at `floorShare × peak fame`
// – A SHARE OF HER OWN PEAK, personal and not global, which is the half he was explicit about. A
// Slam champion's floor is a large brand; a club player's peak is nothing and her floor is nothing.
//
// ⭐⭐ TWO PROPERTIES HOLD BY CONSTRUCTION RATHER THAN BY A CAP, and they are the two acceptance
// criteria this wave could most easily have broken:
//
//   1. STRENGTH ≥ FAME, ALWAYS – the term at t = w is `fame(w) × 1`. So no career's brand is worth
//      LESS after this wave than before it. Nobody loses money on the merge.
//   2. STRENGTH = FAME AT THE CAP, AND AT EVERY PEAK. Every term is `fame(t) ≤ cap` times a kernel
//      ≤ 1, so strength ≤ cap; with (1) that pins strength to exactly `cap` wherever fame is. THE
//      TOP OF THE SHELF THEREFORE CANNOT MOVE – the same «by construction, not by a cap» argument
//      round 32 #3's ramp endpoint made, and the same proof: re-ask it on every career-week of the
//      bench. The same pinning holds at every week fame is at its own running maximum, so a career's
//      PEAK worth is untouched and only the weeks after it lift.
//
// ⚠⚠ ZERO DRAWS, NO CLOCK, AND NOTHING WRITTEN PER WEEK – the proof `world/fame.ts` and
// `world/brand.ts` both carry, and here it is load-bearing twice over. There is no `Rng` argument in
// this file, no `Math.random`, no `new Date`, and NO TICK WRITES ANYTHING: strength is re-derived
// from records the career already keeps and never prunes, so a load cannot drift it and the frozen
// MAIN capture (41550 / e6b0c709) cannot see it.
//
// ⚠⚠⚠ AND THAT IS WHY THE ONE PERSISTED FIELD IS A PIN AND NOT A STOCK. `WorldState.brandStrengthSeed`
// is written ONCE, by the v68 -> v69 migration, and by nothing else – not `createWorld`, not any
// phase of the tick. See its own doc for the four things that buys; the one that belongs here is
// that a stock nothing writes weekly cannot appear on a career the migration never touched, which is
// what keeps the eighteen frozen career hashes moving by `schemaVersion` alone.
import { ECONOMY } from '../economy'
import { fameAt, fameEventWeeks } from './fame'
import type { WorldState } from '../world'

/** ⭐ WHAT SHARE OF A PEAK SURVIVES `delta` WEEKS – the years-long fade, FLOORED at
 *  `strength.floorShare` so it lands on a share of that peak rather than on zero.
 *
 *  ⚠ THE FLOOR IS INSIDE THE KERNEL AND NOT APPLIED AFTERWARDS, which is what makes «a share of HER
 *  OWN peak» need no peak bookkeeping at all: the maximum below already contains her peak, and this
 *  hands that term a permanent `floorShare` of itself once the exponential has fallen through it.
 *
 *  ⚠ NEGATIVE IS ZERO. An event in the future has not happened, and a stock is an account of what
 *  has – `decayAt`'s own rule, kept identical so the two curves cannot disagree about the past. */
export function strengthDecayAt(deltaWeeks: number): number {
  if (deltaWeeks < 0) return 0
  const S = ECONOMY.business.merch.strength
  return Math.max(S.floorShare, Math.pow(0.5, deltaWeeks / S.halfLifeWeeks))
}

/** ⭐⭐⭐ THE STOCK, on fame's own 0..cap scale. Pure: reads the world, writes nothing, draws nothing.
 *
 *  ⚠⚠ THE CANDIDATES ARE `fameEventWeeks` AND NOT EVERY WEEK, and that is exact rather than a
 *  sampling. Fame is piecewise-decaying – every term of the floor and of the multiplier is a fixed
 *  step faded by a strictly decreasing curve – so between two of those dates fame can only fall, and
 *  a maximum over any span is attained on one of them or at the span's own end. `week` is therefore
 *  always in the candidate set, which is also what makes property (1) in the header true.
 *
 *  ⚠⚠ AND THE SEED CUTS THE HISTORY, WHICH IS THE WHOLE OF «NO EXISTING CAREER JUMPS». For a career
 *  the v69 migration pinned, weeks at or before `seed.week` are NOT candidates and the seed's own
 *  value stands in for all of them – so at the pinned week the maximum is exactly the fame the career
 *  was reading the day before the update, and the number on his screen does not move. HIS RULING was
 *  that it did not matter («вообще всё равно, игроков нет пока»); this is the cheap half of that
 *  latitude taken, and the expensive half – re-reading a fifteen-season history through a new kernel
 *  and handing a live career a different number – deliberately refused.
 *
 *  ⚠ A CAREER WITH NO SEED READS ITS WHOLE HISTORY, which is every career started after this ships.
 *  A career with no fame reads 0 from every candidate and answers 0: an unknown's brand is still an
 *  unknown's brand, and this feature hands a career that built nothing exactly nothing. */
export function brandStrengthAt(world: WorldState, week = world.week): number {
  // ⚠ A PIN DATED AFTER THE WEEK BEING ASKED ABOUT IS NOT A PIN FOR THAT WEEK. `assetWorthCents`
  // quotes «one more week of holding» by asking at `week + 1`, and a bench reads the week it has
  // just ticked – so both directions are reachable and a pin in the future simply does not apply.
  const seed = world.brandStrengthSeed
  const pinned = seed !== undefined && seed.week <= week ? seed : undefined
  let best = pinned ? pinned.value * strengthDecayAt(week - pinned.week) : 0
  const from = pinned ? pinned.week : -1
  for (const t of fameEventWeeks(world)) {
    if (t <= from || t > week) continue
    const v = fameAt(world, t) * strengthDecayAt(week - t)
    if (v > best) best = v
  }
  // ⚠ THE WEEK ITSELF IS ALWAYS A CANDIDATE, and it is asked here rather than pushed into the list
  // above because `fameEventWeeks` is a list of DATES SOMETHING HAPPENED and this one is a question.
  // It is what makes `strength ≥ fame` an identity: property (1) of the header, and the reason no
  // career can be worth less after this wave than before it.
  if (week > from) {
    const now = fameAt(world, week)
    if (now > best) best = now
  }
  return best
}
