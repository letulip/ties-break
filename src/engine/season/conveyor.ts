// THE JUNIOR CONVEYOR – somebody is always arriving, and somebody is always finishing.
//
// WHAT IT REPLACES. Since v20 the field has an age and a ceiling, so it stops running away from
// her; what it still does not do is TURN OVER. The same 199 ids that were generated at week 0 are
// the same 199 ids four hundred weeks later, all of them exactly as many years older as she is.
// Measured over ten seasons, the mean rival age walked 16 -> 26 and kept going: one class that
// enrolled together, graduated together and will grow old together. Give it another decade and she
// is the youngest player in a field of forty-year-olds.
//
// That is not a cosmetic problem. A junior tour whose population never renews cannot tell the story
// the game is about – the girls she came up with are supposed to fall away, most of them before
// they are twenty, and each year a new set of thirteen-year-olds is supposed to arrive underneath
// her. The attrition IS the drama: the field she is climbing is made of people who mostly stop.
//
// THE SHAPE, and it is the real one:
//
//   13-18  THE JUNIOR YEARS. Almost nobody leaves. A trickle does - injuries, school, boredom -
//          because a class that loses nobody for six years is a class, not a tour.
//   19     THE CRUNCH. The junior tour ends and every player is asked the same question, which is
//          whether anybody will pay for the next part. The answer is her results: the best keep
//          going, the bottom of the field is simply finished, and the middle is a coin-toss. This
//          is the single biggest event in a player's life and it happens to everyone at once.
//   20-28  THE PROFESSIONAL YEARS. Steady attrition, weighted by standard: a good player has every
//          reason to continue and a fading one runs out of them.
//   29+    THE END. Attrition steepens each year until `hardRetireAge`, where it is certain. The
//          bodies in engine/development.ts's decline curve are the same bodies.
//
// Every departure is replaced the same season by a fresh THIRTEEN-year-old, so the field is exactly
// as big as it always was: draw sizes, entrant bands and the ranking table are untouched, and the
// tick's cost does not move. What changes is the shape of the population inside that fixed number -
// a pyramid instead of a photograph.
//
// RNG DISCIPLINE. Everything here draws from `seed:conveyor:<season>`, a stream created fresh at
// each season boundary and thrown away: ZERO draws on the MAIN weekly stream, so the frozen capture
// (41550 draws / e6b0c709) cannot move. The stream is consumed in one pass, in a fixed order (one
// stay-roll per player in cohort order, then the intake), so the same (seed, season, field) always
// produces the same turnover.
//
// IDENTITY IS THE ONE THING THAT MUST NOT BE RECYCLED. A newcomer gets a brand-new id
// (`ai-s<season>-<n>`), never the id of the player she replaces. `world.results` keeps result rows
// for 52 weeks and they are keyed by playerId: hand a newcomer a departed player's id and she
// inherits that player's ranking points, her fatigue reconstruction and her place in the standings.
// Season-scoped ids cannot collide with the opening field's `ai-<i>` or with any other season's.

import { rngFromSeed } from '../rng'
import { applyRelativeAge, makeJunior, power } from './cohort'
import type { AiPlayer } from './types'

/** THE CONVEYOR'S KNOBS. Probabilities are per SEASON, and every one of them is a chance to
 *  CONTINUE – so a number closer to 1 keeps more of the field alive. */
export const CONVEYOR = {
  /** The last age the junior tour carries you for, no questions asked. */
  juniorEndAge: 18,
  /** ...and the trickle that leaves anyway, at any junior age. */
  juniorStay: 0.97,
  /** THE CRUNCH, at juniorEndAge + 1: [weakest, strongest] chance of continuing, read off her
   *  standing in the field. The bottom of a junior cohort does not turn professional. Tuned so
   *  ~40% of each nineteen-year-old class stops, concentrated on the weak: a bottom-quartile junior
   *  has about a 4-in-10 chance of a twentieth year, a top one has 97. */
  crunchStay: [0.25, 0.97] as [number, number],
  /** The professional years, same reading: a good player continues, a fading one stops. ~9 seasons
   *  of mean career, which is what makes half the field adults in the steady state. */
  proStay: [0.88, 0.99] as [number, number],
  /** Past here the chance falls away linearly to zero at `hardRetireAge`, on top of proStay. */
  fadeFromAge: 29,
  /** Nobody plays past this. */
  hardRetireAge: 34,
  /** How sharply standing decides the crunch and the professional years. >1 means the middle of the
   *  field sits closer to the bottom than to the top, which is the right shape: being averagely
   *  good at nineteen is much nearer to stopping than to a career. */
  standingCurve: 1.2,
} as const

/** One season's turnover. `left` and `joined` are the same length by construction – the field size
 *  is a fixture of this game and nothing here is allowed to move it. */
export interface Turnover {
  left: AiPlayer[]
  joined: AiPlayer[]
}

/** Her chance of being in the field again next season, from her age and where she stands in it.
 *  `standing` is 0 for the weakest player in the field and 1 for the strongest. Pure – the caller
 *  owns the draw. */
export function stayChance(ageYears: number, standing: number): number {
  const c = CONVEYOR
  if (ageYears >= c.hardRetireAge) return 0
  const merit = Math.pow(Math.max(0, Math.min(1, standing)), c.standingCurve)
  if (ageYears <= c.juniorEndAge) return c.juniorStay
  if (ageYears === c.juniorEndAge + 1) {
    const [lo, hi] = c.crunchStay
    return lo + (hi - lo) * merit
  }
  const [lo, hi] = c.proStay
  const base = lo + (hi - lo) * merit
  if (ageYears < c.fadeFromAge) return base
  // The last years: whatever her standing, the chance runs out on a schedule.
  const fade = 1 - (ageYears - c.fadeFromAge + 1) / (c.hardRetireAge - c.fadeFromAge + 1)
  return base * Math.max(0, fade)
}

/** ONE SEASON of turnover, applied in place. Call it at the season boundary, AFTER `ageCohort` –
 *  the question is who is still here at her new age, not at her old one. */
export function renewCohort(cohort: AiPlayer[], seedStr: string, seasonIndex: number): Turnover {
  const rng = rngFromSeed(`${seedStr}:conveyor:${seasonIndex}`)

  // Standing is read ONCE, from the field as it stands before anybody leaves, so a player's fate
  // does not depend on the order the departures happen in.
  const ranked = [...cohort].sort((a, b) => power(a) - power(b))
  const standing = new Map<string, number>()
  const denom = Math.max(1, ranked.length - 1)
  ranked.forEach((p, i) => standing.set(p.id, i / denom))

  const left: AiPlayer[] = []
  const survivors: AiPlayer[] = []
  // One draw per player, in cohort order – the count depends on the field SIZE, which never changes,
  // so the stream position where the intake begins is fixed.
  for (const p of cohort) {
    if (rng() <= stayChance(p.ageYears, standing.get(p.id) ?? 0)) survivors.push(p)
    else left.push(p)
  }

  // ⚠ THE INTAKE GETS BIRTH MONTHS TOO, or the effect would decay out of the field. A career runs five
  // seasons and the conveyor replaces the retirees every year, so by season 3 a large share of the ladder
  // arrived through here - and if only the opening cohort had birthdays, the Q1 skew would be diluted away
  // by exactly the mechanism that is supposed to build it. Same call as `generateCohort`, after the draws.
  const joined = left.map((_, n) => {
    const p = makeJunior(rng, `ai-s${seasonIndex}-${n}`, 13)
    applyRelativeAge(p, seedStr)
    return p
  })

  // Rewrite in place: the array identity is held by WorldState and by every caller that took a
  // reference to it before the boundary.
  cohort.length = 0
  cohort.push(...survivors, ...joined)
  return { left, joined }
}
