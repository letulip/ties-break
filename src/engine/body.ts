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
// ⚠ VALUE IMPORT, AND IT ADDS NO CYCLE: `economy.ts` imports `rng`, `shared/dates` and three
// type-only modules, and none of them reaches back here. It is here for ONE knob –
// `availability.recurrence.partTilt` – which belongs with the rest of the recurrence group rather
// than beside this file's two local tilts, because the bench's control arm has to switch the whole
// group off in one place or the arm is not a control.
import { ECONOMY } from './economy'

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
  return drawBodyRegionFrom(rng, BODY_REGIONS)
}

/** The same single pull, walked against ANY table of the same shape.
 *
 *  ⚠ `drawBodyRegion` IS NOW THIS FUNCTION WITH THE SHIPPED TABLE, and that identity is the reason
 *  the extraction is safe: one pull, one cumulative walk, same fallback. The `seed:injury:<week>`
 *  sequence and the frozen MAIN capture (41550 / e6b0c709) cannot see a refactor that changes
 *  neither the number of draws nor their order. */
export function drawBodyRegionFrom(rng: Rng, table: readonly { part: string; weight: number }[]): string {
  const u = rng() // exactly one pull
  let cum = 0
  for (const region of table) {
    cum += region.weight
    if (u < cum) return region.part
  }
  return table[table.length - 1].part
}

// =================================================================================================
// ⚠ AND AN INJURY LANDS WHERE SHE WORKED (docs/specs/match-retirement.md §5) - THE SAME UNIFORM
// =================================================================================================
//
// knock.ts made this argument first, for knocks, and it is repeated here rather than referenced
// because it is the property that has to survive every future edit of this file:
//
//   THE DRAW DOES NOT MOVE. `drawBodyRegionFrom` takes exactly one pull whatever table it is handed;
//   weighting the table changes what that uniform MAPS TO, never what the uniform IS. Zero draws
//   added, on any stream, so nothing that ships today moves and the frozen MAIN capture cannot see
//   this at all. That claim is proved by reproduction in tests/match-retirement.test.ts (the same
//   generator, tapped, gives the same pull count and the same residual sequence under both tables)
//   rather than asserted here.
//
// THREE TILTS, and they answer three different questions about the same body:
//
//   THE WEEK  - what she has been drilling, off `loadedPartShares` (knock.ts's fold over the session
//               grid). Six weeks of serving develops a shoulder; this is what makes the shoulder pay
//               for it. Shares sum to at most 1 per part-set, so a fully aimed week roughly doubles
//               the odds on the four joints that kind of session loads.
//   THE RECORD - the parts he has already sent her back out on (`pushedParts`). A career that keeps
//               pushing does not collect a series of unrelated Fridays; it breaks the shoulder it
//               has been ignoring. Same argument `KNOCK_REPEAT_TAU` makes, applied to WHERE rather
//               than to HOW LIKELY.
//   THE SCARS - and the parts that have already BROKEN (`priorParts`, round 30 #27). The owner:
//               «увеличивать немного вероятность новой такой же травмы». Previous injury is the
//               best-established risk factor in sports-injury epidemiology, ahead of age and load,
//               and it is the one tilt of the three that DECAYS - an ankle sound for three seasons
//               stops being the weak ankle, which is «мы ни за что не наказываем» expressed as a
//               half-life rather than as a promise.
//
// ⚠ IT IS A TILT AND NOT A RISK, exactly as `KNOCK_AIM_TILT` is. Nothing here changes how often she
// gets hurt - `retireHazard` reads in-match fatigue and how fresh she arrived (`retireDurability`,
// 27.08) and nothing else - only where it lands when she does. That is the difference between a
// consequence and a penalty, and it is untouched by the freshness term: that curve moves HOW OFTEN,
// on the other side of this file's boundary.

/** How far a part the week ENTIRELY loaded is tilted. Matches `KNOCK_AIM_TILT` deliberately: it is
 *  the same claim about the same week, and two numbers for one idea would drift apart. */
export const BODY_AIM_TILT = 2.0
/** ...and how far a part already on the record is. Above the aim tilt because it is a stronger
 *  statement: the week is what she did, the record is what has already given way once. */
export const BODY_PUSHED_TILT = 2.6

/** `BODY_REGIONS`, tilted toward what this week loaded and what the career has already broken.
 *
 *  ⚠ RETURNS THE SHIPPED ARRAY ITSELF WHEN NOTHING TILTS IT, and that identity return is load-bearing
 *  for precisely the reason knock.ts states: these twelve weights are written as the owner's research
 *  left them (`0.48 * 0.3`) and sum to 1.0 in decimal but not necessarily in binary, so a
 *  renormalising pass over an all-ones tilt could divide by 0.9999999999999999 and flip a boundary
 *  uniform into the neighbouring part. A career with a generic week and a clean record must walk
 *  byte-identical cumulative sums. */
export function tiltedBodyRegions(
  loaded: ReadonlyMap<string, number>,
  pushed: readonly string[],
  /** ⭐ THE THIRD TILT (round 30 #27): parts this body has ALREADY BEEN INJURED IN, each carrying its
   *  own decayed weight in [0,1] – `recurrencePartLoad` in world/injury.ts builds it off
   *  `injuryHistory` and nothing else. It is the same claim `pushed` makes one line above, made
   *  about a healed injury instead of about an ignored knock, and it is scaled rather than boolean
   *  because an ankle that went last month and an ankle that went three seasons ago are not the same
   *  ankle. Omitted ⇒ empty ⇒ every existing caller and every clean record is byte-identical. */
  priorParts: ReadonlyMap<string, number> = new Map(),
): readonly { part: string; weight: number }[] {
  if (loaded.size === 0 && pushed.length === 0 && priorParts.size === 0) return BODY_REGIONS
  let total = 0
  const tilted = BODY_REGIONS.map((r) => {
    const share = loaded.get(r.part) ?? 0
    const onRecord = pushed.includes(r.part) ? BODY_PUSHED_TILT : 1
    const prior = 1 + (ECONOMY.availability.recurrence.partTilt - 1) * (priorParts.get(r.part) ?? 0)
    const weight = r.weight * (1 + (BODY_AIM_TILT - 1) * share) * onRecord * prior
    total += weight
    return { part: r.part, weight }
  })
  // Renormalise: the tilt REDISTRIBUTES where it lands, it never changes how often.
  return tilted.map((r) => ({ part: r.part, weight: r.weight / total }))
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
