// Package L – the AI junior cohort. Pure: a cohort is a deterministic function of
// a seed string. driftCohort applies a tiny weekly nudge from a passed RNG (the
// main weekly stream in Package M) – a Phase-4 development placeholder.

import { rngFromSeed, pickInt, type Rng } from '../rng'
import type { AiPlayer } from './types'
// Task 55: the same head-start pricing the kid uses. One number, one meaning - see `applyRelativeAge`.
import { relativeAgeHeadStart } from '../development'

/** THE COHORT'S OWN KNOBS (v20). Kept here rather than in ECONOMY because they describe the WORLD's
 *  population, not the family's money - and because the file that reads them is the only file that
 *  should. The curve deliberately mirrors ECONOMY.development's: she and the field are the same
 *  kind of thing, and the day the two shapes diverge is the day the ladder stops making sense. */
export const COHORT = {
  /** A junior field spans the ones just starting and the ones about to age out. */
  ageBand: [13, 19] as [number, number],
  /** Headroom on top of where she is generated. Wide on purpose: most juniors never become
   *  anything, and a field where everyone is a future champion is a rising tide with extra steps. */
  potentialBand: [1, 22] as [number, number],
  ageCurve: {
    growthEnd: 18,
    plateauStart: 23,
    declineStart: 29,
    /** share of remaining headroom per week while young, before `growth` (0.5..1.5) scales it */
    peakRate: 0.0052,
    plateauRate: 0.0007,
    declineRate: 0.0003,
    declineAccel: 0.25,
  },
} as const

// 44 given names × 210 surnames (R11-13) – a broad pool so 199 juniors read as distinct.
//
// EXPORTED since the living-field slice (01.08): the FIELD tier (season/fieldPros.ts) draws its
// ~300 professionals from the SAME pools, so the world has one naming vocabulary – a W15 field and
// a J30 field read as the same world's people. Export-only change: the array itself is untouched,
// and the APPEND-ONLY / order rules in the SURNAMES note below apply here identically (the cohort
// draw indexes by pool length).
export const FIRST_NAMES = [
  'Aria', 'Bela', 'Camila', 'Dasha', 'Elena', 'Freya', 'Gaia', 'Hana',
  'Ines', 'Jana', 'Kaia', 'Lena', 'Mila', 'Nora', 'Oksana', 'Petra',
  'Quinn', 'Rina', 'Sasha', 'Tara', 'Uma', 'Vera', 'Wren', 'Xenia',
  'Yara', 'Zoe', 'Aiko', 'Bianca', 'Clara', 'Dita', 'Emma', 'Farida',
  'Greta', 'Ilse', 'Juna', 'Kira', 'Luca', 'Marta', 'Nina', 'Olga',
  'Pia', 'Reni', 'Sofia', 'Talia',
]

// Exported: the kid draws a last name from the same pool (onboarding 🎲 + the v7
// migration default), so juniors and the player share one surname vocabulary.
//
// R11-13 – GROWN 44 -> 210 (owner: too many juniors sharing a surname). 199 juniors over 44
// surnames is ~4.5 each; over 210 it is ~0.95, and full-name clashes drop with it.
//
// APPEND-ONLY, AND THE ORDER OF THE FIRST 44 IS LOAD-BEARING. `pickSurname` and the cohort draw
// both do `pickInt(rng, 0, SURNAMES.length - 1)` = `floor(rng() * length)`: the pool LENGTH is
// part of the index arithmetic, so growing or reordering the array re-maps every draw. What makes
// that safe here (proved in tests/season/surnames.test.ts):
//   1. Names are PERSISTED, never recomputed. `cohort` (each junior's `name`) lives in WorldState
//      and goes through JSON.stringify in saveCodec; `profile.kidLastName` has been persisted
//      since v7. migrateSave only regenerates a cohort inside the `v < 6` block, and only fills
//      kidLastName when the field is ABSENT – so no existing career is renamed by this change.
//   2. The DRAW COUNT is untouched. `pickInt` consumes exactly one rng() value whatever its range,
//      so generateCohort still spends 8 draws per junior in the same order: skills, nations,
//      growth – and therefore the frozen MAIN-stream capture and kidRank 140 – are byte-identical.
// What is NOT preserved: a NEW career on an OLD seed draws different surnames than it would have
// before (same skills, same results, different names). That is the price of any pool change, and
// the reason this array must only ever be appended to.
export const SURNAMES = [
  // --- the original 44 (v7-era pool). NEVER reorder, NEVER remove. -------------------
  'Adler', 'Baros', 'Costa', 'Duval', 'Everts', 'Falk', 'Granados', 'Horvat',
  'Ivanova', 'Janssen', 'Kovac', 'Lindqvist', 'Moreau', 'Novak', 'Oberg', 'Petrov',
  'Quaranta', 'Rossi', 'Sato', 'Toma', 'Udall', 'Varga', 'Weiss', 'Xu',
  'Yilmaz', 'Zima', 'Andersen', 'Blanco', 'Chen', 'Dumont', 'Esposito', 'Ferro',
  'Georgiou', 'Haas', 'Ikeda', 'Jelic', 'Kern', 'Larsson', 'Mensah', 'Nagy',
  'Ortiz', 'Pavic', 'Reyes', 'Sanches',
  // --- appended R11-13. An international junior field: every tennis region that actually
  // sends 14-year-olds to an ITF calendar, in rough proportion to NATION_WEIGHTS below.
  // Invented-but-plausible: no surname of a real professional player, living or recent.
  'Ahlberg', 'Bjornstad', 'Ekstrom', 'Halvorsen', 'Jokinen', 'Kallio', 'Moller', 'Ostergaard',
  'Saarinen', 'Vikstrom', 'Kalnins', 'Tamm',
  'Ashcroft', 'Brennan', 'Caldwell', 'Ellery', 'Fairbanks', 'Gilroy', 'Hollis', 'Kinsella',
  'Marsden', 'Thorne',
  'Bertrand', 'Chevalier', 'Delaunay', 'Fournier', 'Girard', 'Lemaire', 'Mercier', 'Poirier',
  'Thibault', 'Vasseur',
  'Arrieta', 'Bermudez', 'Delgado', 'Esquivel', 'Figueroa', 'Guzman', 'Herrera', 'Jimenez',
  'Lozano', 'Paredes', 'Quintero', 'Zamora',
  'Almeida', 'Barbosa', 'Carvalho', 'Machado', 'Nogueira', 'Pereira', 'Queiroz', 'Teixeira',
  'Bellini', 'Cattaneo', 'Donati', 'Fabbri', 'Gallo', 'Lombardi', 'Marchetti', 'Perotti',
  'Rinaldi', 'Sartori',
  'Aigner', 'Brandt', 'Eichler', 'Gruber', 'Hellwig', 'Keller', 'Lindner', 'Nussbaum',
  'Rieder', 'Steiner', 'Vogel', 'Zeller',
  'Bakker', 'Claessen', 'Hendriks', 'Kuipers', 'Vandenberg', 'Verbeek', 'Verhoeven', 'Wouters',
  'Balint', 'Dolezal', 'Fiala', 'Janik', 'Kalina', 'Malek', 'Nemec', 'Oravec',
  'Prochazka', 'Sedlak', 'Urban', 'Zeman',
  'Baranowski', 'Cieslak', 'Domanski', 'Grabowski', 'Kaminski', 'Lisowski', 'Ostrowski', 'Pawlak',
  'Bondar', 'Danilov', 'Fedorenko', 'Kolesnyk', 'Lytvyn', 'Melnyk', 'Romanenko', 'Tkachenko',
  'Fotiadis', 'Karras', 'Nikolaidis', 'Papadakis', 'Sideris',
  'Aydin', 'Demir', 'Ozturk', 'Yalcin',
  'Filipovic', 'Kostic', 'Markovic', 'Simic', 'Vukovic',
  'Fujimoto', 'Hasegawa', 'Kobayashi', 'Nakamura', 'Okada', 'Yoshida',
  'Fang', 'Jiang', 'Tang', 'Yuan', 'Choi', 'Yoon',
  'Bhatia', 'Deshpande', 'Iyer', 'Nair', 'Sethi', 'Varma', 'Nguyen', 'Tran',
  'Adeyemi', 'Bello', 'Diallo', 'Eze', 'Kamau', 'Kone', 'Ndiaye', 'Okonkwo',
  'Hamdi', 'Mansouri',
  'Barlow', 'Delaney', 'Fairchild', 'Kingsley', 'Lockhart', 'Nolan', 'Rutledge', 'Sinclair',
  'Vaughn', 'Corrigan', 'Donnelly', 'Pemberton',
]

/** Deterministic surname for a seed – the v7 migration default for `profile.kidLastName`
 *  (uses a purpose-scoped sub-RNG so it never touches the main career streams). */
export function pickSurname(seedStr: string): string {
  const rng = rngFromSeed(seedStr + ':surname')
  return SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
}

// Tennis nations, weighted by rough player-pool depth. Duplicated entries give a
// single pickInt draw the intended skew toward the strong tennis countries.
const NATION_WEIGHTS: Array<[string, number]> = [
  ['US', 10], ['ES', 9], ['FR', 8], ['IT', 7], ['RU', 6], ['DE', 6],
  ['GB', 5], ['AU', 5], ['CZ', 4], ['RS', 4], ['AR', 4], ['HR', 3],
  ['JP', 3], ['CN', 3], ['CA', 3], ['CH', 3], ['GR', 3], ['PL', 3],
  ['NL', 2], ['BE', 2], ['AT', 2], ['BR', 2], ['SE', 2], ['KZ', 2],
  ['DK', 2], ['SK', 2], ['UA', 2], ['RO', 2], ['IN', 2], ['SI', 1],
  ['BG', 1], ['NO', 1], ['HU', 1], ['TN', 1], ['KR', 1], ['PT', 1],
]

// EXPORTED with FIRST_NAMES (living-field, 01.08) and for the same reason: the FIELD tier's
// professionals come from the same tennis nations in the same proportions as the juniors do.
export const NATION_POOL: string[] = NATION_WEIGHTS.flatMap(([code, w]) => Array<string>(w).fill(code))

function clamp01to100(x: number): number {
  return x < 0 ? 0 : x > 100 ? 100 : x
}

/** THE FIELD'S SIZE — one number, named (v35). It was `generateCohort`'s default parameter alone
 *  until the persisted-RNG slice needed it a second time: the MAIN weekly draw budget is
 *  `base costs + 4 × this` (see world.ts `maxMainDraws`), and a plausibility bound derived from a
 *  different 199 than the one the field is built from would be two numbers pretending to be one.
 *  The conveyor replaces leavers one-for-one (season/conveyor.ts), so the size never moves over a
 *  career — which is exactly what lets a draw-count bound be stated per week at all. */
export const COHORT_SIZE = 199

// generateCohort – `size` age-14 juniors, deterministic from `seedStr`. Skills sit
// in the spec bands; growth is a hidden 0.5..1.5 multiplier. Draw order per player
// is fixed (name, name, nation, serve, ret, composure, stamina, growth) so the
// stream count is constant regardless of size.
export function generateCohort(seedStr: string, size = COHORT_SIZE): AiPlayer[] {
  const rng = rngFromSeed(seedStr)
  const cohort: AiPlayer[] = []
  for (let i = 0; i < size; i++) {
    const p = makeJunior(rng, `ai-${i}`)
    // ...and where she sits inside her own year. AFTER the draws, off its own sub-stream: see the note
    // above `juniorBirthMonth` for why it cannot come from `rng`.
    applyRelativeAge(p, seedStr)
    cohort.push(p)
  }
  return cohort
}

/** ONE junior, off the passed generator. Extracted so the conveyor's yearly intake (season/
 *  conveyor.ts) is drawn by the SAME code as the opening field – a girl who arrives in season 4 has
 *  to be the same kind of object as one who was there at week 0, or the field stops being one
 *  population.
 *
 *  ⚠ THE DRAW ORDER IS LOAD-BEARING and is exactly the order generateCohort has always used:
 *  name, name, nation, serve, ret, composure, stamina, growth, [age], head ×4. `pickInt` spends one
 *  value whatever its range, so 13 draws per player when the age is drawn and 12 when it is given.
 *  Reordering re-maps every existing seed's field – see the SURNAMES note above for what that costs.
 *
 *  `ageYears` given ⇒ no age draw (the intake is always 13, so there is nothing to roll). */
export function makeJunior(rng: Rng, id: string, ageYears?: number): AiPlayer {
  const first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
  const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
  const nation = NATION_POOL[pickInt(rng, 0, NATION_POOL.length - 1)]
  const serve = pickInt(rng, 30, 60)
  const ret = pickInt(rng, 30, 60)
  const composure = pickInt(rng, 25, 70)
  const stamina = pickInt(rng, 30, 70)
  const growth = 0.5 + rng() // 0.5 .. 1.5
  // A junior cohort is not one class: it spans the ones just starting and the ones about to age
  // out. Their ages decide how much growing they have left, which is what turns a flat field into
  // a conveyor - somebody is always arriving and somebody is always finishing.
  const age = ageYears ?? pickInt(rng, COHORT.ageBand[0], COHORT.ageBand[1])
  // Headroom on top of where she already is. Most juniors have a little; a few have a lot.
  const [pLo, pHi] = COHORT.potentialBand
  const head = () => pLo + rng() * (pHi - pLo)
  return {
    id,
    name: `${first} ${last}`,
    serve,
    ret,
    composure,
    stamina,
    nation,
    growth,
    ageYears: age,
    potential: {
      serve: serve + head(),
      ret: ret + head(),
      composure: composure + head(),
      stamina: stamina + head(),
    },
  }
}

// =================================================================================================
// THE RELATIVE AGE EFFECT, FOR THE FIELD (task 55, second half – owner: «давай сделаем месяцы рождения
// когорте, доведём эффект до конца»)
// =================================================================================================
//
// The kid got a birth month and a head start; her rivals were all just "14". So the effect was
// one-sided: she could be behind the field, but the field was internally uniform, and the thing the
// phenomenon is actually famous for - THE TOP OF A JUNIOR LADDER BEING FULL OF JANUARY BIRTHDAYS - could
// not happen, because there were no January birthdays to be full of.
//
// ⚠ AND THE SKEW MUST BE AN OUTPUT, NOT AN INPUT. The temptation is to generate the cohort Q1-heavy,
// because that is what real junior populations look like. That would be drawing the conclusion: the
// over-representation exists BECAUSE the older girls in each band win more, get selected, and survive -
// so the honest model is a UNIFORM birth month plus a mechanism, and then the skew has to earn itself.
// The conveyor is what makes that possible: `renewCohort` sorts by `power` and retires the weakest, so an
// advantage that shows up as strength turns into an advantage in survival without one line saying so.
// If the skew does not appear, the model is wrong and the bench will say which.
//
// =================================================================================================
// ⚠ TWO CONSTRAINTS THIS IS BUILT AROUND, and both would be easy to break silently
// =================================================================================================
//
// 1. `makeJunior`'s DRAW ORDER IS LOAD-BEARING (see its own note): 13 draws per player, and reordering or
//    adding one re-maps every existing seed's entire field. So the birth month CANNOT come off the passed
//    generator. It is derived from its own sub-stream instead, keyed on the career seed and the player id -
//    the same trick `coachById` uses for the roster, and it costs zero draws on any stream the tick walks.
//    That also means NO SCHEMA and NO MIGRATION: every save already in existence gets birth months for
//    free, because they were never stored.
//
// 2. THE HEAD START IS CLAMPED TO HER CEILING, and this one is a real trap. `COHORT.potentialBand` is
//    [1, 22] - a junior can be generated with as little as ONE point of headroom. Adding ~1.1 points on
//    top would put her PAST her own ceiling, and `step()` computes `Math.max(0, ceiling - current)`, so
//    she would stop developing for the rest of her career. A January birthday would have been a curse for
//    the juniors it was supposed to favour, and only for the ones who had no room to grow anyway.
//
//    Clamping is not just the safe answer, it is the RIGHT one, and it is the spec's own argument from
//    §1: "a faster rate mostly means arriving sooner rather than arriving higher". A Q1 junior who is
//    already at her ceiling has simply arrived early. Her ceiling does not move - being born in January
//    must not make anyone able to get BETTER, exactly as it does not for the kid.

/** A rival's birth month, 1-12, uniform. Derived - never stored - so it needs no schema and is stable for
 *  the whole career. Keyed on the career seed AND the id, so two careers do not field the same birthdays.
 *
 *  ⚠ ITS OWN SUB-STREAM, created fresh and thrown away. `makeJunior`'s generator is untouchable (13 draws,
 *  fixed order, every seed's field depends on it), so this is the only safe place a new random fact about
 *  a rival can come from. */
export function juniorBirthMonth(seedStr: string, id: string): number {
  return 1 + Math.floor(rngFromSeed(`${seedStr}:aibirth:${id}`)() * 12)
}

/**
 * Apply her birth month to a freshly-made junior, IN PLACE. Post-draw arithmetic only.
 *
 * Priced with the KID's measured `SKILL_POINTS_PER_YEAR` rather than a second constant of its own: the two
 * populations are generated on the same scale (juniors 30-70, the kid 35-60) and the whole design principle
 * is that she and the field are the same kind of thing. One number, one meaning.
 *
 * The CEILING IS NOT TOUCHED - see constraint 2 above.
 */
export function applyRelativeAge(p: AiPlayer, seedStr: string): void {
  const bump = relativeAgeHeadStart(juniorBirthMonth(seedStr, p.id))
  p.serve = clamp01to100(Math.min(p.serve + bump, p.potential.serve))
  p.ret = clamp01to100(Math.min(p.ret + bump, p.potential.ret))
  p.composure = clamp01to100(Math.min(p.composure + bump, p.potential.composure))
  p.stamina = clamp01to100(Math.min(p.stamina + bump, p.potential.stamina))
}

/** Her overall standard right now – the mean of the four attributes. The conveyor asks this to
 *  decide who is worth continuing for; nothing else in the engine needs a single "how good is she"
 *  number, which is why it lives here and not in the match model. */
export function power(p: AiPlayer): number {
  return (p.serve + p.ret + p.composure + p.stamina) / 4
}

// driftCohort – the cohort's development, and since v20 it has the same SHAPE as the kid's.
//
// It used to be `+ rng() * 0.05 * growth` per attribute: unbounded, ageless, forever. Measured, the
// top ten climbed about 1.5 a year and never stopped - 57.8 at the kid's 14 to 71.6 at her 23 -
// so no amount of talent or management could ever catch the ladder, because the ladder was a
// rising tide rather than a group of people.
//
// Now every rival has an AGE and a CEILING, and a week's gain is a share of the distance still to
// go, scaled by the same age curve the kid runs on. Juniors climb fast, the mid-twenties hold, the
// thirties decline. The field becomes a conveyor: somebody is always arriving, somebody is always
// finishing, and the top of it is reachable.
//
// EXACTLY FOUR DRAWS PER PLAYER, in the same fixed order as before. This is the constraint the
// change is built around: the weekly draw count must not depend on player input or on world state,
// or the frozen MAIN capture moves. Every number below is arithmetic applied AFTER the draw.
export function driftCohort(cohort: AiPlayer[], rng: Rng): void {
  for (const p of cohort) {
    const rate = aiAgeFactor(p.ageYears) * p.growth
    const decline = aiDeclineFactor(p.ageYears)
    p.serve = clamp01to100(step(p.serve, p.potential.serve, rate, decline, rng()))
    p.ret = clamp01to100(step(p.ret, p.potential.ret, rate, decline, rng()))
    // Composure is the one thing that does not fade – the veteran is slower and calmer.
    p.composure = clamp01to100(step(p.composure, p.potential.composure, rate, 0, rng()))
    p.stamina = clamp01to100(step(p.stamina, p.potential.stamina, rate, decline, rng()))
  }
}

/** One attribute, one week. `roll` is the already-drawn uniform - no draws happen in here. */
function step(current: number, ceiling: number, rate: number, decline: number, roll: number): number {
  const gain = Math.max(0, ceiling - current) * rate * roll
  return current + gain - decline * current
}

/** The cohort's age curve. Deliberately the same shape as the kid's (engine/development.ts) rather
 *  than a second model: the whole point is that she and the field are the same kind of thing. */
export function aiAgeFactor(ageYears: number): number {
  const c = COHORT.ageCurve
  if (ageYears < c.growthEnd) return c.peakRate
  if (ageYears < c.plateauStart) {
    const t = (ageYears - c.growthEnd) / (c.plateauStart - c.growthEnd)
    return c.peakRate * (1 - t) + c.plateauRate * t
  }
  if (ageYears < c.declineStart) return c.plateauRate
  return 0
}

/** What she loses per week past the peak, steepening each year so careers end rather than fade. */
export function aiDeclineFactor(ageYears: number): number {
  const c = COHORT.ageCurve
  if (ageYears < c.declineStart) return 0
  return c.declineRate * (1 + (ageYears - c.declineStart) * c.declineAccel)
}

/** A season has passed: everybody is a year older. Pure arithmetic, no draws, called once a year
 *  from the season boundary - which is what makes the field a conveyor rather than a photograph. */
export function ageCohort(cohort: AiPlayer[]): void {
  for (const p of cohort) p.ageYears += 1
}
