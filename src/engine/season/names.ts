// Package L – THE WORLD'S NAMING VOCABULARY. Pure data plus one seeded pick, and it imports nothing
// but the RNG: no economy, no development, no calendar.
//
// ⚠ WHY IT IS ITS OWN FILE (TB-07). These pools lived in season/cohort.ts, and coach.ts imported
// SURNAMES from there – which put coach inside a runtime cycle, because cohort imports
// `relativeAgeHeadStart` from development and development imports `coachFactor` / `coachFitFor` /
// `tierOf` straight back from coach. Three modules loaded as one strongly-connected component over
// a list of surnames, which depends on none of them. Nothing about the DATA changed in the move;
// the arrays below are byte-identical to the ones cohort.ts used to hold, which is what makes this
// safe under the append-only rules stated on SURNAMES.
//
// cohort.ts re-exports every symbol here under its historical name, so existing importers
// (season/fieldPros.ts, the onboarding and ending screens, the tests) are untouched.

import { rngFromSeed, pickInt } from '../rng'

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
