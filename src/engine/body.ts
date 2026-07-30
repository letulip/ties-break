// WHERE IT HURTS – the anatomy the injury model and the diary have to agree about.
//
// The owner, 30.07, reading the new fortnight-inside-a-layoff lines: «She revised with her leg up on a
// chair - у нас разные есть, не только нога, может как-то это обыграть в записках тоже, что нога на
// спину не показывалась? мелочь, а будет хорошо и внимательно.»
//
// He is right and the bug is mine: that line was licensed on `f.injured !== null`, which is EVERY
// injury, so a girl with a strained wrist revised with her leg up. The honesty pin could not see it,
// and that is the interesting part - `WeekClaims` is a vocabulary of week TYPES (exams, layoff,
// holiday), and "names a body part" is not one of them. A claim system catches a line that lies about
// what KIND of week it was; nothing was watching lines that lie about her BODY.
//
// =================================================================================================
// WHY THIS MODULE EXISTS AT ALL, rather than the lookup living next to the table in world.ts
// =================================================================================================
//
// The table was private to world.ts, and diary.ts CANNOT import world.ts - the dependency runs
// world -> diary and adding the reverse edge would make it a cycle. Same constraint knock.ts, kidLife.ts
// and radar.ts are built around. So the anatomy moves down to a leaf module that both can read, which
// is also the honest place for it: it is a vocabulary, not a rule.
//
// ⚠ THE TABLE MOVED VERBATIM - SAME TWELVE ENTRIES, SAME ORDER, SAME WEIGHTS, and `drawBodyRegion`
// still takes EXACTLY ONE PULL. That is not tidiness, it is the frozen MAIN capture (41550 draws /
// e6b0c709): the region is drawn from the private `seed:injury:<week>` stream, and reordering the table
// or splitting the pull would move that sequence for every existing save. Nothing here is allowed to
// change without a re-capture, which is why the numbers are written as the owner's research left them
// (0.48 * 0.3) instead of pre-multiplied.

import type { Rng } from './rng'

/** Body-region weights (owner research 25.07): ~48% lower-limb / 28% upper / 24% core, with the
 *  WTA skew inside `lower` (girls' pattern = ankle+knee sprains take the majority of the lower
 *  share) and a lumbar bias inside `core` (teen back trouble). Flattened to one cumulative table
 *  so the region costs exactly ONE pull from the private injury generator. */
export const BODY_REGIONS: readonly { part: string; weight: number }[] = [
  { part: 'ankle', weight: 0.48 * 0.3 },
  { part: 'knee', weight: 0.48 * 0.25 },
  { part: 'hamstring', weight: 0.48 * 0.15 },
  { part: 'calf', weight: 0.48 * 0.12 },
  { part: 'foot', weight: 0.48 * 0.1 },
  { part: 'hip', weight: 0.48 * 0.08 },
  { part: 'wrist', weight: 0.28 * 0.25 },
  { part: 'shoulder', weight: 0.28 * 0.25 },
  { part: 'elbow', weight: 0.28 * 0.25 },
  { part: 'forearm', weight: 0.28 * 0.25 },
  { part: 'lower back', weight: 0.24 * 0.75 },
  { part: 'abdominal', weight: 0.24 * 0.25 },
]

export function drawBodyRegion(rng: Rng): string {
  const u = rng() // exactly one pull
  let cum = 0
  for (const region of BODY_REGIONS) {
    cum += region.weight
    if (u < cum) return region.part
  }
  return BODY_REGIONS[BODY_REGIONS.length - 1].part
}

// =================================================================================================
// THE GROUPS – three, and the number is chosen by what the COPY needs to know
// =================================================================================================
//
// Twelve parts, three groups. Not because the medicine groups this way (the research's own split is
// lower / upper / core, which is what these are) but because THREE IS WHAT A SENTENCE CAN TELL APART.
// How she sits at a kitchen table depends on whether the injury is in a leg, an arm or her middle;
// it does not depend on whether it is a calf or a hamstring. A pool of twelve variants per line
// would be a table pretending to be writing, which is the mistake `KNOCK_PARTS` avoids by naming the
// part inside ONE sentence instead.
//
// So the copy layer gets both handles and uses each for what it is good at:
//   `bodyPartOf`  – to NAME it ("Ice on the ankle, twice a day")
//   `bodyGroupOf` – to know what her WEEK looks like ("her leg up on a chair" / "standing up half
//                   the time"), which is the thing the owner caught being wrong.

export type BodyGroup = 'leg' | 'arm' | 'trunk'

/** Which group each region belongs to. Total over `BODY_REGIONS` – the test checks that in both
 *  directions, so a thirteenth region cannot be added without being placed. */
const GROUP_OF: Record<string, BodyGroup> = {
  ankle: 'leg',
  knee: 'leg',
  hamstring: 'leg',
  calf: 'leg',
  foot: 'leg',
  hip: 'leg',
  wrist: 'arm',
  shoulder: 'arm',
  elbow: 'arm',
  forearm: 'arm',
  'lower back': 'trunk',
  abdominal: 'trunk',
}

/**
 * The body part out of an injury `kind`, or null when it names none of the twelve.
 *
 * ⚠ A LOOKUP AGAINST THE TABLE, NOT STRING PARSING, and the difference matters. `kind` is built as
 * `"<part> <descriptor>"` (world.ts, `SEVERITY_DESCRIPTOR`) - so "ankle strain", "lower back
 * soreness". Splitting on the first space would get eleven of the twelve right and quietly answer
 * "lower" for the twelfth. Matching against `BODY_REGIONS` instead means the vocabulary has exactly
 * one owner, multi-word parts work by construction, and an unrecognised kind comes back as NULL
 * rather than as a plausible-looking wrong answer.
 *
 * WHY NULL IS REACHABLE AND MUST STAY REACHABLE: `kind` is a persisted string on saves going back to
 * v10, and test fixtures write things like `{ kind: 'ankle strain' }` by hand. A caller that cannot
 * resolve the part must be able to say nothing rather than guess - which in the copy layer means the
 * group-specific lines are simply not licensed, exactly as `restingKnock` lines are unselectable
 * without a choice.
 */
export function bodyPartOf(kind: string): string | null {
  const k = kind.toLowerCase()
  // Longest first, so "lower back" wins over any future single-word region inside it.
  const parts = [...BODY_REGIONS].map((r) => r.part).sort((a, b) => b.length - a.length)
  return parts.find((p) => k.includes(p)) ?? null
}

/** The group an injury `kind` is in, or null when its part cannot be resolved. */
export function bodyGroupOf(kind: string): BodyGroup | null {
  const part = bodyPartOf(kind)
  return part === null ? null : GROUP_OF[part]
}
