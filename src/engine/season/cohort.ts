// Package L — the AI junior cohort. Pure: a cohort is a deterministic function of
// a seed string. driftCohort applies a tiny weekly nudge from a passed RNG (the
// main weekly stream in Package M) — a Phase-4 development placeholder.

import { rngFromSeed, pickInt, type Rng } from '../rng'
import type { AiPlayer } from './types'

// 44 given names × 44 surnames — a broad pool so 199 juniors read as distinct.
const FIRST_NAMES = [
  'Aria', 'Bela', 'Camila', 'Dasha', 'Elena', 'Freya', 'Gaia', 'Hana',
  'Ines', 'Jana', 'Kaia', 'Lena', 'Mila', 'Nora', 'Oksana', 'Petra',
  'Quinn', 'Rina', 'Sasha', 'Tara', 'Uma', 'Vera', 'Wren', 'Xenia',
  'Yara', 'Zoe', 'Aiko', 'Bianca', 'Clara', 'Dita', 'Emma', 'Farida',
  'Greta', 'Ilse', 'Juna', 'Kira', 'Luca', 'Marta', 'Nina', 'Olga',
  'Pia', 'Reni', 'Sofia', 'Talia',
]

// Exported: the kid draws a last name from the same pool (onboarding 🎲 + the v7
// migration default), so juniors and the player share one surname vocabulary.
export const SURNAMES = [
  'Adler', 'Baros', 'Costa', 'Duval', 'Everts', 'Falk', 'Granados', 'Horvat',
  'Ivanova', 'Janssen', 'Kovac', 'Lindqvist', 'Moreau', 'Novak', 'Oberg', 'Petrov',
  'Quaranta', 'Rossi', 'Sato', 'Toma', 'Udall', 'Varga', 'Weiss', 'Xu',
  'Yilmaz', 'Zima', 'Andersen', 'Blanco', 'Chen', 'Dumont', 'Esposito', 'Ferro',
  'Georgiou', 'Haas', 'Ikeda', 'Jelic', 'Kern', 'Larsson', 'Mensah', 'Nagy',
  'Ortiz', 'Pavic', 'Reyes', 'Sanches',
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

const NATION_POOL: string[] = NATION_WEIGHTS.flatMap(([code, w]) => Array<string>(w).fill(code))

function clamp01to100(x: number): number {
  return x < 0 ? 0 : x > 100 ? 100 : x
}

// generateCohort — `size` age-14 juniors, deterministic from `seedStr`. Skills sit
// in the spec bands; growth is a hidden 0.5..1.5 multiplier. Draw order per player
// is fixed (name, name, nation, serve, ret, composure, stamina, growth) so the
// stream count is constant regardless of size.
export function generateCohort(seedStr: string, size = 199): AiPlayer[] {
  const rng = rngFromSeed(seedStr)
  const cohort: AiPlayer[] = []
  for (let i = 0; i < size; i++) {
    const first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
    const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
    const nation = NATION_POOL[pickInt(rng, 0, NATION_POOL.length - 1)]
    const serve = pickInt(rng, 30, 60)
    const ret = pickInt(rng, 30, 60)
    const composure = pickInt(rng, 25, 70)
    const stamina = pickInt(rng, 30, 70)
    const growth = 0.5 + rng() // 0.5 .. 1.5
    cohort.push({ id: `ai-${i}`, name: `${first} ${last}`, serve, ret, composure, stamina, nation, growth })
  }
  return cohort
}

// driftCohort — one tiny in-place nudge per skill: +0..0.05 scaled by growth,
// clamped to [0, 100]. Exactly four draws per player in a fixed order, so the
// weekly draw count never depends on player input (deterministic replay).
export function driftCohort(cohort: AiPlayer[], rng: Rng): void {
  for (const p of cohort) {
    p.serve = clamp01to100(p.serve + rng() * 0.05 * p.growth)
    p.ret = clamp01to100(p.ret + rng() * 0.05 * p.growth)
    p.composure = clamp01to100(p.composure + rng() * 0.05 * p.growth)
    p.stamina = clamp01to100(p.stamina + rng() * 0.05 * p.growth)
  }
}
