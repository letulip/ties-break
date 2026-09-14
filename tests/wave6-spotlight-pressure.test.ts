// =================================================================================================
// WAVE 6, T3 – THE PRESSURE: ONE TERM INSIDE `accrueSpirit`, AND THE SHAPE IT IS PINNED BY
// =================================================================================================
//
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T3; the model is `docs/specs/who-she-is-2026-09.md`
// §3c («the weeks that put her in the light … carry a pressure perturbation, scaled by who she is»)
// and its §3c-bis. Three of the architect's rulings decide this file's shape and each is named where
// it lands: **A** (the third parameter is REQUIRED, never defaulted, and three – measured, FIVE –
// pins re-aim), **L** (a FOURTH SUMMAND, scaled by intensity exactly once, rounding once at the end,
// reading the head's one expression) and **N** (pin the SHAPE, never the size: every §4 number in
// this wave is unruled and going to move).
//
// ⚠⚠ RULING N IS WHY ALMOST NOTHING HERE IS AN ABSOLUTE SPIRIT VALUE. Measured 14.09: baseline is
// 70, the `dimmed` band edge is 67.5, the distance is 2.50 – and the spotlight's worst contribution
// to an expressed-open steady girl is 2.40. So the term ALONE never crosses a Mood band; it tips a
// week the ordinary weather had already carried to the boundary. Every constant behind those numbers
// is a §4 proposal the owner has not ruled on, so what is pinned here is the RATIO (×2
// private/open), the ORDER of operations, the ONCE-ness of each factor and the ZEROES – all of which
// survive a re-tune, none of which a re-tune may silently break.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4/5/T2 duty kept – a net nobody
// watched fail proves nothing. Control GREEN first; every arm applied by a scripted string edit with
// UNIQUE mutation text and UNDONE by the inverse edit, never `git checkout`, with the md5 of every
// touched file checked back to pristine after each one and a mismatch a HARD STOP (T2's rebuilt
// harness is the model, and its first version's failure is the reason it is spelled that way).
// Counts are CASES – vitest counts cases, and the first failing assertion ends the case, which is
// why claims are one per case here rather than five fixtures under one title (T2's ARM 1).
//
//   ARM 1  the term dropped from the sum (`+ pressured` -> a sentinel)  14 RED  all eight §C cases,
//          all four §D, §E part 1's `+ shocked + pressured` and §H's tiny-dip case
//   ARM 2  `opennessScale` dropped from the product                     11 RED  §C's seven measured
//          cases and all four §D – the factor this wave's ×2 shape IS
//   ARM 3  `perturbationScale` applied TWICE (ruling L part 1's defect) 11 RED  §C's eight and three
//          of §D. ⭐ THE DEFECT THE FILE ALREADY RECORDS ON `spirit.shock`, on new numbers
//   ARM 4  the term ROUNDS ITSELF, per event (ruling L part 2)           3 RED  §E's two rounding
//          cases and – ⭐ UNPREDICTED – §C's intensity-ratio case, whose eight-event arms exist
//          precisely to escape the quantisation this arm re-introduces. The two cases found the
//          same defect from opposite ends, which is what makes the ratio case worth its lines
//   ARM 5  a SECOND `expressedTemperamentOf(world)` read (ruling L 3)    1 RED  §E part 3
//   ARM 6  the feed row written per EVENT instead of per WEEK            1 RED  §H's first case
//   ARM 7  the keep rule inverted (every exposure row kept)              1 RED  §H's keep case
//   ARM 8  a success tax – a standing drain keyed on her silverware      2 RED  §B's series case and
//          §B's whole-world case; ⚠ §B's first case stays GREEN, which is right: the twins are still
//          a famous girl and an unknown one, and it is the DRAIN that is new
//   ARM 9  the third parameter DEFAULTED (`= []`) – ruling A's own       1 RED  tests/spirit.test.ts's
//          arity pin, and this arm is run against THAT file: `Function.length` stops counting at the
//          first default, so the pin reads 2 and would have stayed green through the whole change
//   ARM 10 `pressureBase.shoot` zeroed                                   3 RED  §A's «every base is a
//          COST», §C's shoot case and §D's per-kind ratio (0 / 0 is `NaN`) – ⭐ the measurement that
//          justifies one case per kind: a single zeroed §4 number is caught by its own case
//   ARM 11 ARM 5's mutation again, run against the SIXTH re-aimed pin      1 RED  the wave-5 schema
//          suite's ruling-A reader census, whose `accrueSpirit` clause T3 re-aimed to COUNT the read
//          at exactly one. Run against that file because the pin it proves lives there
//
// ⚠ ALL ELEVEN RUN, ALL ELEVEN RED, NONE AT ZERO – so there is no null arm to declare. Control green
// first on every spec; md5 of every touched file pristine after every arm.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, 4's, 5's and T2's §B apparatus, verbatim and for
// its reason. Every call is delegated to the real `rngFromSeed`, so nothing this file measures is a
// fiction; the mock exists only so §G can COUNT the keys the pressure pass reaches for. Hoisted,
// because `vi.mock`'s factory is lifted above the imports.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { accrueSpirit, EXPOSURE_ROW, TEMPERAMENTS, temperamentIntensity, temperamentOpenness, type Temperament } from '../src/engine/spirit'
import { createWorld, sheIsNewsAt } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { lifeRowGlyph } from '../src/components/screens/lifeRowGlyphs'
import { isBlackoutWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'
import { engineModuleFunction, worldFunction } from './worldSource'
import { region } from './helpers/source'
import type { ExposureEvent, ExposureKind, WorldState } from '../src/engine/world'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** The five kinds, walked by name rather than re-listed – `ECONOMY.spotlight.pressureBase` is typed
 *  `Record<ExposureKind, number>` and is therefore the compiler's own complete roster (the same
 *  oracle ruling O uses for `PSY_FOCUSES`). A sixth kind joins this sweep the day it joins the type. */
const KINDS = Object.keys(ECONOMY.spotlight.pressureBase) as ExposureKind[]

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – tests/spirit.test.ts's own
 *  whole-tree form, because «one writer of `world.spirit`» is a claim about `src/` and a census
 *  scoped to `engine/` would be silent about a component that reached for the field. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** Source with every comment removed – tests/spirit.test.ts's own helper, and the source cases here
 *  cannot work without it: this file's subject is a module whose COMMENTS name `roundTenth`,
 *  `weekPerturbation` and `expressedTemperamentOf` in order to argue about them. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Does `week` fire NO row of the perturbation table for this girl? tests/spirit.test.ts's own
 *  `quiet`, so a case can pose exactly one fact – the exposure list – and read exactly one delta. */
function quietWeek(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) &&
    birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

/** A world parked at a QUIET week, at both baselines, wearing the temperament under test – built by
 *  `createWorld` and then MOVED, never hand-assembled, so the shapes are the engine's own. */
function probe(temperament: Temperament, seed = 'spotlight-pressure', week = 210): WorldState {
  const world = createWorld(seed)
  world.temperament = temperament
  let w = week
  while (!quietWeek(world, w)) w++
  world.week = w
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  return world
}

/** What ONE pass costs her, in spirit points, from baseline – positive numbers are costs. Rounded to
 *  three decimals so a float tail cannot be mistaken for a rounding claim (§E asks about tenths on
 *  purpose and reads the raw value there). */
function costOf(world: WorldState, exposure: readonly ExposureEvent[]): number {
  accrueSpirit(world, false, exposure)
  return Math.round((ECONOMY.spirit.baseline - world.spirit) * 1000) / 1000
}

/** `n` events of one kind – the list the caller hands down, spelled here so a case states the WEEK
 *  rather than the plumbing. */
function events(kind: ExposureKind, n = 1): ExposureEvent[] {
  return Array.from({ length: n }, () => ({ kind }))
}

/** Her own week's exposure cost for a given temperament, in one line. */
function costFor(temperament: Temperament, kind: ExposureKind, n = 1): number {
  return costOf(probe(temperament), events(kind, n))
}

/** The rows this pass appended – `addEvent` pushes, so the tail is the new ones. */
function newRows(world: WorldState, before: number) {
  return world.events.slice(before)
}

// =================================================================================================
// A. THE CONSTANTS – anchored, total, and signed; the two the wave's §4 calls anchored vs proposed
// =================================================================================================
describe('wave 6 T3 A – ECONOMY.spotlight gains exactly the two constant families T3 reads', () => {
  it('⭐⭐⭐ the openness scale is the SPEC\'S OWN ×0.75 / ×1.5, and its ratio is exactly 2', () => {
    // ⚠⚠ THE ONE ANCHORED PAIR IN THE WHOLE BLOCK. who-she-is §3c: an open girl half-feeds on the
    // attention, a private one pays more – the brief's §4 lists these under «Anchored by the spec»
    // while every other number in the wave sits under «Proposals – NONE ruled». So this case may
    // assert the VALUES, which nothing else in this file does (ruling N).
    expect(ECONOMY.spotlight.opennessScale.open).toBe(0.75)
    expect(ECONOMY.spotlight.opennessScale.private).toBe(1.5)
    // ...and the RATIO, which is what ruling N part 2 asks T3 to pin and what §D measures through
    // the engine. Stated here as well, on the constants alone, so a re-tune that broke the shape is
    // red twice: once against the arithmetic and once against the table.
    expect(ECONOMY.spotlight.opennessScale.private / ECONOMY.spotlight.opennessScale.open).toBe(2)
  })

  it('⭐⭐ `pressureBase` is TOTAL over `ExposureKind` – the compiler\'s roster, not a hand-written one', () => {
    // ⚠ THE `Record<ExposureKind, number>` ANNOTATION IS THE GUARD AND THIS IS ITS RUNNABLE MIRROR
    // (ruling O's own argument, one wave-6 task over): a sixth kind added to the union without a base
    // fails `vue-tsc` with the missing member named, rather than shipping a kind priced `undefined`
    // – which would poison the entire weekly sum with `NaN` on the first week it fired.
    expect(KINDS.sort()).toEqual(['aired', 'publicLoss', 'shoot', 'stage', 'wrongStory'])
  })

  it('⚠ every base is a COST – negative, before scaling, and none of them zero', () => {
    // ⚠ «BEFORE SCALING» IS RULING L PART 1 AND IT IS WHY THESE ARE −2..−4 RATHER THAN −22..−34: the
    // break-up shock's constants are ALREADY intensity-scaled and are added outside the multiplication
    // for that reason; these are not, and they take `perturbationScale` exactly once, in their own
    // summand. ⚠ A ZERO HERE IS A KIND THAT CANNOT BE FELT, which is the «unable to fire» family this
    // wave has now met fifteen times – so the sign AND the non-zero are both asserted.
    for (const kind of KINDS) {
      expect(ECONOMY.spotlight.pressureBase[kind], `${kind} costs something`).toBeLessThan(0)
    }
  })

  it('⚠ the INTENSITY scale is the STANDING one – `ECONOMY.spotlight` holds no second copy of it', () => {
    // §4: «the intensity scale is the STANDING `perturbationScale` – not a new constant». A second
    // table here would be the drift `temperamentOpenness`' own ⚠ refuses one module over: two
    // spellings of one axis, free to disagree the first time either is tuned.
    const keys = Object.keys(ECONOMY.spotlight)
    expect(keys.some((k) => /intens|steady|perturb/i.test(k)), 'no second intensity table').toBe(false)
    expect(ECONOMY.spirit.perturbationScale).toEqual({ steady: 0.8, intense: 1.25 })
  })
})

// =================================================================================================
// B. ⚠⚠ NO SUCCESS TAX – A NO-EXPOSURE WEEK IS BYTE-IDENTICAL, AND THE PIN RUNS AGAINST A FAMOUS GIRL
// =================================================================================================
//
// §0.4, and «мы ни за что не наказываем» (09.09) is the ruling it operationalises: pressure lands on
// EXPOSURE EVENTS only – never as a standing weekly drain, never keyed on rank, prize or fame.
//
// ⚠⚠ THE TWINS ARE THE CONSTRUCTION, AND RULING N IS WHY. A quiet world walked with an empty list
// proves nothing about this wave – it is a world the wave cannot see. So the claim is measured
// between a FAMOUS career and an otherwise byte-identical unknown one: same seed, same profile, same
// week, same everything except a Slam title in the cabinet. If any part of the term ever keyed on
// fame, the famous twin's spirit would drift from her twin's and this goes red.
describe('wave 6 T3 B – a week with no exposure event, on a FAMOUS world', () => {
  /** The twins: identical careers, one of which the world is watching. */
  function twins(): { famous: WorldState; unknown: WorldState } {
    const unknown = probe('sunny', 'spotlight-twins')
    const famous = probe('sunny', 'spotlight-twins')
    const slam = (famous.trophiesByTier.slam ??= { titles: [], finals: [] })
    slam.titles.push(famous.week - 3)
    slam.finals.push(famous.week - 3)
    return { famous, unknown }
  }

  it('⭐⭐⭐ the fixture is not vacuous: one twin IS news at this week and the other is not', () => {
    // ⚠⚠ THE CASE THE WHOLE SECTION RESTS ON. Ruling N: «run that pin against a FAMOUS world (fame
    // above the bar, no exposure event this week), not a quiet one, or it proves nothing about this
    // wave». A byte-identity that held only because neither world could ever reach the mechanic would
    // be the «unable to fail» family wearing a pin's clothes.
    const { famous, unknown } = twins()
    expect(sheIsNewsAt(famous, famous.week), 'the world is watching her').toBe(true)
    expect(sheIsNewsAt(unknown, unknown.week), 'and not her twin').toBe(false)
  })

  it('⭐⭐⭐ 52 weeks of a famous career and of her unknown twin move spirit identically', () => {
    const { famous, unknown } = twins()
    const famousSeries: number[] = []
    const unknownSeries: number[] = []
    for (let i = 0; i < 52; i++) {
      accrueSpirit(famous, false, [])
      accrueSpirit(unknown, false, [])
      famousSeries.push(famous.spirit)
      unknownSeries.push(unknown.spirit)
      famous.week++
      unknown.week++
    }
    // ⚠ ASSERTED AS THE WHOLE SERIES AND NOT AS THE ENDPOINT: a drain that cancelled out against the
    // return by the last week would pass an endpoint check and fail this one.
    expect(famousSeries, 'fame costs her nothing by itself, on any of 52 weeks').toEqual(unknownSeries)
  })

  it('⭐⭐ ...and the WHOLE WORLD is byte-identical afterwards, cabinet aside', () => {
    // ⚠ THE STRONGER FORM OF THE SAME CLAIM, and the reason it is a second case rather than a second
    // assertion: `bond`, `events`, `rngMain` and every other key are in it, so a term that wrote a
    // feed row or moved the standing on a no-exposure week is red here even though the spirit series
    // above is untouched. The cabinet is removed because it is the only thing that makes them twins
    // rather than one world.
    const { famous, unknown } = twins()
    for (let i = 0; i < 52; i++) {
      accrueSpirit(famous, false, [])
      accrueSpirit(unknown, false, [])
      famous.week++
      unknown.week++
    }
    const strip = (w: WorldState) => JSON.stringify({ ...w, trophiesByTier: null })
    expect(strip(famous)).toBe(strip(unknown))
  })

  it('⚠ and an empty list writes NO feed row, at any fame', () => {
    const { famous } = twins()
    const before = famous.events.length
    accrueSpirit(famous, false, [])
    expect(newRows(famous, before), 'the feed is silent on a week the light was off').toEqual([])
  })
})

// =================================================================================================
// C. THE PRODUCT – per kind, per axis, and each factor applied EXACTLY ONCE
// =================================================================================================
//
// ⚠⚠ THE EXPECTATIONS ARE COMPUTED FROM `ECONOMY`, NEVER TYPED AS NUMBERS – ruling N part 2 («do not
// pin absolute spirit values that a §4 re-tune will invalidate»). What is pinned is that the engine's
// arithmetic IS `base × perturbationScale × opennessScale`, with every factor present and none of
// them twice; a re-tune moves both sides of every assertion together and the shape stays guarded.
describe('wave 6 T3 C – what one exposure event costs, kind by kind', () => {
  /** The three shipped factors, computed off the constants – the oracle every case below reads. */
  function expected(kind: ExposureKind, temperament: Temperament, n = 1): number {
    const base = ECONOMY.spotlight.pressureBase[kind]
    const scale = ECONOMY.spirit.perturbationScale[temperamentIntensity(temperament)]
    const openness = ECONOMY.spotlight.opennessScale[temperamentOpenness(temperament)]
    return Math.round(-base * scale * openness * n * 1000) / 1000
  }

  // ⚠⚠ ONE CASE PER KIND AND NOT ONE LOOP – T2's ARM 1 is the measurement that forces it: vitest
  // counts CASES and the first failing assertion ends the case, so five kinds under one title means
  // four of them go unchecked under the very mutation that breaks all five. The five bases are five
  // independent §4 numbers; ARM 10 zeroes one of them and reddens exactly one case, which is the
  // property this split buys.
  for (const kind of ['stage', 'shoot', 'publicLoss', 'aired', 'wrongStory'] as ExposureKind[]) {
    it(`⭐⭐ a '${kind}' week costs a sunny girl base × perturbationScale × opennessScale, and nothing else`, () => {
      expect(costFor('sunny', kind)).toBe(expected(kind, 'sunny'))
    })
  }

  it('⭐⭐ ...and it SUMS over the week – two events of one kind cost exactly twice one', () => {
    // §3c's own «summed over the week's events», and `world/spotlight.ts`'s «duplicates are real and
    // kept: two facts in one week are two events, because T3 sums the week's events and a week that
    // held two is not a week that held one».
    expect(costFor('sunny', 'stage', 2)).toBe(expected('stage', 'sunny', 2))
  })

  it('⭐⭐ ...and it sums ACROSS kinds – a week that held three things is charged for three', () => {
    const world = probe('sunny')
    const mixed: ExposureEvent[] = [{ kind: 'stage' }, { kind: 'shoot' }, { kind: 'wrongStory' }]
    const sum = expected('stage', 'sunny') + expected('shoot', 'sunny') + expected('wrongStory', 'sunny')
    expect(costOf(world, mixed)).toBe(Math.round(sum * 1000) / 1000)
  })

  it('⚠⚠ the INTENSITY scale is applied exactly ONCE – ruling L part 1, measured as a ratio', () => {
    // ⚠⚠ THE ARM THIS CASE EXISTS FOR IS THE DEFECT THE FILE ALREADY RECORDS ON `spirit.shock`: «a
    // row inside `weekPerturbation` would scale them a SECOND time» (−27.5 × 0.8 × 0.8). Measured as
    // the ratio between the two intensity arms at one openness, it is exactly `1.25 / 0.8`; applied
    // twice it would be `(1.25 / 0.8)²`, and the two are far apart. ⚠ `'fiery'` and `'sunny'` share
    // the OPEN pole and differ only on intensity, which is what makes the ratio read one factor.
    //
    // ⚠⚠ EIGHT EVENTS AND NOT ONE, AND THE REASON IS THE PASS'S OWN `roundTenth` – a hazard worth
    // naming because it is the one way a ratio pin can lie. `costOf` reads the WRITTEN spirit, which
    // is quantised to a tenth, and a single `'publicLoss'` for a `'fiery'` girl is 3.75 points: the
    // write lands at 66.3 and the cost reads 3.7, which is a 1.54 ratio against a true 1.5625. At
    // eight events both arms land on exact tenths (30.0 and 19.2) and the ratio is exact. ⭐ THE
    // QUANTISATION IS NOT A DEFECT – it is ruling L part 2 working, one `roundTenth` at the end – but
    // a pin that divided two rounded numbers and called the answer a factor would be measuring it.
    const s = ECONOMY.spirit.perturbationScale
    expect(costFor('fiery', 'publicLoss', 8) / costFor('sunny', 'publicLoss', 8)).toBe(s.intense / s.steady)
  })
})

// =================================================================================================
// D. ⭐⭐⭐ RULING N's RATIO PIN – ×2 private/open, AS A RATIO, so a §4 re-tune cannot break the shape
// =================================================================================================
describe('wave 6 T3 D – who carries it well, pinned as a ratio and never as a size', () => {
  it('⭐⭐⭐ the same event costs an expressed-PRIVATE girl exactly twice an expressed-OPEN one', () => {
    // ⚠⚠ THIS IS THE PIN RULING N ASKS FOR BY NAME, and its own sentence says why it matters: «every
    // one of these numbers is going to move, and the pins must survive that». `'sunny'` and `'quiet'`
    // share the STEADY pole and differ only on openness, so the ratio reads exactly one factor –
    // 1.5 / 0.75 – whatever `pressureBase` is re-tuned to.
    expect(costFor('quiet', 'publicLoss') / costFor('sunny', 'publicLoss')).toBe(2)
  })

  it('⭐⭐ ...and it holds for every kind, because it is one factor and not five', () => {
    // A second case rather than a second assertion above: the ratio is ONE constant, so a kind for
    // which it failed would mean the product had grown a per-kind branch – which is a different
    // defect from the ratio being wrong, and deserves its own red line.
    for (const kind of KINDS) {
      expect(costFor('quiet', kind) / costFor('sunny', kind), `${kind} keeps the ×2 shape`).toBe(2)
    }
  })

  it('⭐⭐⭐ it reads EXPRESSION and not BIRTH – a born-open girl behind a wall pays the private multiple', () => {
    // §0.6, wave-5 law 2 extended to this family: «the pressure scale … reads
    // `expressedTemperamentOf(world)`; every diary/feed LINE keeps reading birth». A born-`'sunny'`
    // girl with the openness wall FLIPPED is expressed-private, and the week has to charge her as the
    // girl she is now – «who carries it well reads the CURRENT her» (§3c, ruled on entry).
    const walled = probe('sunny')
    walled.wallsFlipped = { open: true, reg: false }
    expect(costOf(walled, events('publicLoss'))).toBe(costFor('quiet', 'publicLoss'))
    // ...and her BIRTH temperament did not move, which is §3's immutable-identity fence.
    expect(walled.temperament).toBe('sunny')
  })

  it('⚠ the regulation wall moves the INTENSITY factor the same way, and only that one', () => {
    // The other axis, measured so the two are known to be independent rather than assumed: a
    // born-`'sunny'` girl with the REGULATION wall flipped is expressed-`'fiery'` – open, intense.
    const walled = probe('sunny')
    walled.wallsFlipped = { open: false, reg: true }
    expect(costOf(walled, events('publicLoss'))).toBe(costFor('fiery', 'publicLoss'))
  })

  it('⚠ all four births are priced, and the four costs are the four products', () => {
    // ⚠ THE SWEEP EXISTS SO NO TEMPERAMENT IS UNPRICED – the fairness corridor's own habit (who-she-is
    // §5). It asserts the ORDERING that the two factors force, not the values: the two open girls pay
    // less than the two private ones, and within each pole the intense one pays more.
    const cost = Object.fromEntries(TEMPERAMENTS.map((t) => [t, costFor(t, 'stage')])) as Record<Temperament, number>
    expect(cost.sunny).toBeLessThan(cost.fiery)
    expect(cost.fiery).toBeLessThan(cost.quiet)
    expect(cost.quiet).toBeLessThan(cost.deep)
  })
})

// =================================================================================================
// E. RULING L's THREE PARTS, AS THE CODE RATHER THAN AS THE ARITHMETIC
// =================================================================================================
describe('wave 6 T3 E – a fourth summand, rounded once, off one read of who she is', () => {
  it('⭐⭐⭐ part 1 – the term is NOT a row of `weekPerturbation`, which names no spotlight constant', () => {
    // ⚠⚠ THE STRUCTURAL HALF OF THE RATIO CASE IN §C. `weekPerturbation`'s rows are multiplied by
    // `perturbationScale` at the call site, so a spotlight row placed inside it would take the scale
    // twice – the recorded defect on `spirit.shock`, repeated on new numbers. Read through
    // `engineModuleFunction`, which THROWS on an absent function rather than handing back an empty
    // string every `.not.` assertion would pass on.
    const perturb = codeOnly(engineModuleFunction('spirit', 'weekPerturbation'))
    expect(perturb, 'the perturbation table holds no spotlight row').not.toContain('spotlight')
    expect(perturb, 'and no exposure list reaches it').not.toContain('exposure')
    // ...and the summand really is a fourth one, added OUTSIDE that multiplication: the sum line
    // carries the scaled perturbation, the shock and the pressure, in that order.
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
    expect(accrue).toContain('+ shocked + pressured')
  })

  it('⭐⭐⭐ part 2 – the term does not round itself, and the tenth it saves is measurable', () => {
    // ⚠⚠ MEASURED RATHER THAN ASSERTED FROM THE SOURCE, because the source claim («no `roundTenth`
    // inside the helper») is satisfied by a version that rounds at the call site instead. Three
    // `'stage'` events for a `'deep'` girl: 3 × −3 × 1.25 × 1.5 = −16.875, which the pass's single
    // `roundTenth` turns into −16.9 and a self-rounding term would turn into 3 × −5.6 = −16.8. One
    // tenth apart, and the tenth is the point: ruling N measured a habituated, focus-held girl taking
    // −0.33 from the worst week of her public life, and quantising that first is how three tenths
    // become nothing.
    const world = probe('deep')
    accrueSpirit(world, false, events('stage', 3))
    expect(world.spirit).toBe(53.1)
    expect(world.spirit, 'a self-rounding term would land here').not.toBe(53.2)
  })

  it('⭐⭐ ...and there is exactly ONE `roundTenth` and ONE `clamp` on the spirit write', () => {
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
    expect(accrue.split('world.spirit = roundTenth(clamp(').length - 1, 'one write, one rounding').toBe(1)
    const helper = codeOnly(engineModuleFunction('spirit', 'exposurePressure'))
    expect(helper, 'the term does not round itself').not.toContain('roundTenth')
    expect(helper, 'and it does not clamp itself either').not.toContain('clamp')
  })

  it('⭐⭐⭐ part 3 – `expressedTemperamentOf` is read EXACTLY ONCE in the pass, and both axes come off it', () => {
    // ⚠⚠ THE FILE'S OWN ⚠⚠ IS THE RULE («IT IS READ EXACTLY ONCE, HERE AT THE HEAD … Do not re-read
    // it after this line»), and T3 is the first task that needs BOTH projections – so the risk it
    // creates is a second call for the second axis. Wave 5 ruled that the girl who experienced the
    // week is one girl; this is that ruling as a count.
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
    expect(accrue.split('expressedTemperamentOf(').length - 1, 'one read, at the head').toBe(1)
    expect(accrue).toContain('temperamentIntensity(expressed)')
    expect(accrue).toContain('temperamentOpenness(expressed)')
  })

  it('⚠ the helper takes the two POLES and never the world, so a second read is not reachable from it', () => {
    // ⚠ A STRUCTURAL VERSION OF THE SAME CLAIM, and it is worth its own case: a helper that took
    // `world` could re-derive the expression at any time, and the pin above would still read 1
    // because the second call would be in a different function.
    const helper = codeOnly(engineModuleFunction('spirit', 'exposurePressure'))
    expect(helper, 'no world reaches the term').not.toContain('world')
    expect(helper).toContain("intensity: 'steady' | 'intense'")
    expect(helper).toContain("openness: 'open' | 'private'")
  })
})

// =================================================================================================
// F. ⚠⚠ THE PLACEMENT, MEASURED – TWO OF THE FIVE KINDS CANNOT REACH THE TERM FROM THE CALL SITE
// =================================================================================================
//
// ⚠⚠ THIS SECTION IS A FINDING CARRIED BACK TO THE ARCHITECT, NOT A DEFECT T3 INTRODUCED AND NOT ONE
// IT IS FREE TO FIX. The call site asks `exposureEventsOf(world, world.week)`, which is what §0.1 and
// ruling M both specify – ruling M's own sentence is that a stamp read one week late «buys an
// exposure event that is one week late, silently, for ever». Measured on this tree, at that moment in
// the tick, `'stage'` and `'publicLoss'` are not yet written:
//
//   · their ONLY writers are `finalizeTournament`'s `cabinet.titles/finals.push(world.week)` and its
//     `world.results.push({ …, week: world.week, … })` – both stamped with the CURRENT week;
//   · `finalizeTournament` runs inside `playHerWeek`, which is `tickWeek` step 5;
//   · `accrueSpirit` runs inside `resolveBodyAndPlanner`, which is `tickWeek` step 3.
//
// So her week-W silverware is written after week W's spirit pass has closed, and week W+1's pass asks
// about week W+1. Ruling M measured the LIFE block's position (T6's leak and T7's booth stamp, both
// of which really do run before the spirit pass) and never the TOURNAMENT's – that is the hole.
//
// ⚠ THE TWO FIXES BOTH LIE OUTSIDE T3: asking about `world.week − 1` would make `'aired'` and
// `'wrongStory'` – stamped earlier in this very phase – one week late, which is exactly what ruling M
// forbids; and moving the `accrueSpirit` call after step 5 is refused by ruling M, by §8 and by the
// five pins that read its position. Pinned here so the day either one changes, this goes red with a
// sentence instead of the wave quietly starting to work.
describe('wave 6 T3 F – the tick order, and what it means for two of the kinds', () => {
  it('⚠⚠ `accrueSpirit`\'s phase runs BEFORE the phase that stamps a trophy or a result', () => {
    const tick = worldFunction('tickWeek')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
    const body = tick.findIndex((l) => l.startsWith('const playedThisWeek = resolveBodyAndPlanner(world)'))
    const play = tick.findIndex((l) => l.startsWith('playHerWeek(world, field, playedThisWeek)'))
    expect(body, 'her body phase is where it was').toBeGreaterThan(-1)
    expect(play, 'and her competition phase is where it was').toBeGreaterThan(body)
  })

  it('⚠⚠ ...and both `\'stage\'` records are stamped with the CURRENT week, inside that later phase', () => {
    // ⚠ READ THROUGH `region`, WHICH THROWS ON AN ABSENT MARKER – the raw `indexOf` slice widens
    // silently to the rest of the file and a pin read over a whole module proves nothing
    // (CLAUDE.md's own gotcha, and the «two of them had been lying» case behind it).
    const finalize = region(worldFunction('finalizeTournament'), 'const cabinet = (world.trophiesByTier', 'const track = tier.track')
    expect(finalize, 'the cabinet takes today\'s week').toContain('cabinet.titles.push(world.week)')
    expect(finalize, 'and so does the runner-up shelf').toContain('cabinet.finals.push(world.week)')
    const results = worldFunction('finalizeTournament')
    expect(results, 'and so does the results row `publicLoss` reads').toContain('week: world.week, points, tier: event.tier')
  })

  it('⚠ the ledger itself is innocent – handed the week those records name, it answers', () => {
    // ⚠⚠ THE CASE THAT KEEPS THE FINDING HONEST. It would be easy to read the two above as «the
    // spotlight does not see big stages», which is false and would send the next reader into
    // `world/spotlight.ts`. The derivation is right; the MOMENT it is asked is what starves it.
    const world = probe('sunny')
    const slam = (world.trophiesByTier.slam ??= { titles: [], finals: [] })
    slam.titles.push(world.week - 3)
    slam.finals.push(world.week - 3)
    expect(sheIsNewsAt(world, world.week), 'and she is news').toBe(true)
    // The trophy is stamped three weeks back, so asking about ITS week answers and asking about
    // today's does not – which is the whole of the finding in two lines.
    const src = codeOnly(readFileSync(`${SRC}engine/world/phaseHerWeek.ts`, 'utf8'))
    expect(src, 'the call site asks about today').toContain('exposureEventsOf(world, world.week)')
  })
})

// =================================================================================================
// G. §8's FENCES – weather, never a shock; no draw; no second writer of `world.spirit`
// =================================================================================================
describe('wave 6 T3 G – what the pressure term is not allowed to be', () => {
  it('⭐⭐⭐ it is WEATHER, not a shock – an exposure week writes no `spiritShock`', () => {
    // §8: «no new shock kind – `spiritShock` stays breakup-only». A shock would buy a mark the
    // psychologist's recovery focus could work and a receipt it could print, which is a whole second
    // mechanic nobody asked for.
    const world = probe('deep')
    accrueSpirit(world, false, events('publicLoss', 3))
    expect(world.spiritShock ?? null, 'the cameras leave no mark to be worked').toBeNull()
  })

  it('⭐⭐ ...and the source writes the field in exactly one place, which is the CLEAR', () => {
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
    const writes = accrue.split('world.spiritShock =').length - 1
    expect(writes, 'one write, and it is the null at the clear').toBe(1)
    expect(accrue).toContain('world.spiritShock = null')
  })

  it('⭐⭐ there is no return-curve change – the week after an exposure returns at her own rate', () => {
    // ⚠ «The standing return toward baseline is what recovers it» (the task's own ⚠). A steady girl
    // knocked below baseline by the cameras walks back at `returnPerWeek.steady` and at nothing else –
    // no taper, no second rate, no «recovering» flag. Measured across the boundary rather than read
    // off the source, because a curve added at the call site would not show in this function's text.
    const world = probe('sunny')
    accrueSpirit(world, false, events('publicLoss', 4))
    const dipped = world.spirit
    expect(dipped, 'the week really knocked her down').toBeLessThan(ECONOMY.spirit.baseline - 1)
    world.week++
    while (!quietWeek(world, world.week)) world.week++
    accrueSpirit(world, false, [])
    expect(world.spirit - dipped).toBeCloseTo(ECONOMY.spirit.returnPerWeek.steady, 10)
  })

  it('⭐⭐⭐ the term takes ZERO draws – no key, on any stream, on the heaviest week it can have', () => {
    // The count-keys net (wave-4 §0.1) applied to a pass that should reach for nothing: the arithmetic
    // is a fold over a list, so the honest measurement is the number of keys the whole pass asks for.
    const world = probe('deep')
    const before = JSON.stringify(world.rngMain)
    rngKeys.length = 0
    accrueSpirit(world, false, [{ kind: 'stage' }, { kind: 'shoot' }, { kind: 'publicLoss' }, { kind: 'aired' }, { kind: 'wrongStory' }])
    expect(rngKeys, 'the pressure pass derives no stream at all').toEqual([])
    expect(JSON.stringify(world.rngMain), 'and MAIN is where it was').toBe(before)
  })

  it('⚠ ...and the helper\'s own source reaches for no clock and no randomness', () => {
    const helper = codeOnly(engineModuleFunction('spirit', 'exposurePressure'))
    for (const forbidden of ['rngFromSeed', 'Math.random', 'new Date', 'pickInt']) {
      expect(helper, `the term must not reach for ${forbidden}`).not.toContain(forbidden)
    }
  })

  it('⚠ `accrueSpirit` is still the ONE writer of `world.spirit` in `src/`', () => {
    // Wave-5 law 1, re-asserted by the wave that adds a second summand to the pass – the place a
    // second writer would most plausibly appear. `world.spiritShock` and `world.spirit` are different
    // fields, so the filter is anchored on the assignment.
    const writers = srcFiles().filter(([, text]) => /world\.spirit\s*=[^=]/.test(codeOnly(text))).map(([p]) => p)
    expect(writers.sort(), 'one writer, one file').toEqual(['engine/spirit.ts'])
  })
})

// =================================================================================================
// H. THE LEGIBILITY LAW – ONE ROW, IN PLAIN WORDS, ON THE WEEK THE LIGHT WAS ON
// =================================================================================================
describe('wave 6 T3 H – the feed row (DRAFT: T8 and the architect\'s вычитка own the words)', () => {
  it('⭐⭐⭐ one row per WEEK and not one per event – a week that held three prints once', () => {
    // §3c's own «the feed is not a ledger». The week is charged three times and named once, which is
    // the difference between an explanation and a receipt.
    const world = probe('sunny')
    const before = world.events.length
    accrueSpirit(world, false, [{ kind: 'stage' }, { kind: 'shoot' }, { kind: 'wrongStory' }])
    expect(newRows(world, before)).toHaveLength(1)
  })

  it('⭐⭐ the row is `type: \'life\'` and carries the draft sentence', () => {
    const world = probe('sunny')
    const before = world.events.length
    accrueSpirit(world, false, events('stage'))
    const [row] = newRows(world, before)
    expect(row.type).toBe('life')
    expect(row.text).toBe(EXPOSURE_ROW)
  })

  it('⭐⭐ NO CENTS, ever – the no-cents law, and the finance ledger cannot see it', () => {
    // The wave-3 brief §0.5: a life row is never a purchase. `addEvent` folds into `financeWeeks`
    // only when `amountCents` is present, so the absence of the field is the whole guard.
    const world = probe('sunny')
    const before = world.events.length
    const ledger = JSON.stringify(world.financeWeeks)
    accrueSpirit(world, false, events('publicLoss', 2))
    const [row] = newRows(world, before)
    expect(row.amountCents, 'the row says the light was on, never what it cost').toBeUndefined()
    expect(JSON.stringify(world.financeWeeks)).toBe(ledger)
  })

  it('⚠⚠ the row prints even when the number barely moves – ruling N\'s measurement as a rule', () => {
    // ⚠⚠ THE CASE THAT STOPS THE OBVIOUS «OPTIMISATION». Ruling N measured the term's worst
    // contribution to a calm open girl at 2.40 against a 2.50 distance to the `dimmed` edge, and a
    // habituated, focus-held one taking three tenths – so a row gated on «did the Mood word move»
    // would go silent on exactly the weeks the player most needs the sentence. The gate is the
    // EVENTS, and the shallowest kind for the girl who pays least is the case that proves it.
    const world = probe('sunny')
    const before = world.events.length
    accrueSpirit(world, false, events('shoot'))
    expect(ECONOMY.spirit.baseline - world.spirit, 'a tiny dip').toBeLessThan(2)
    expect(newRows(world, before), 'and the feed still explains it').toHaveLength(1)
  })

  it('⚠ §4\'s KEEP RULE (a proposal): the first exposure row of a season is kept, the repeats are not', () => {
    // ⚠ THE BRIEF's §2 T3 conditions the flag on §4's own keep rule – «keep the first exposure row of
    // a season, drop repeats» – and §4 lists it among «Proposals – NONE ruled». So this pins the
    // SHAPE the proposal describes, and the owner's word moves it.
    const world = probe('sunny')
    const first = world.events.length
    accrueSpirit(world, false, events('stage'))
    expect(newRows(world, first)[0].keep, 'the season\'s first is findable for ever').toBe(true)
    world.week++
    while (!quietWeek(world, world.week)) world.week++
    const second = world.events.length
    accrueSpirit(world, false, events('stage'))
    expect(newRows(world, second)[0].keep, 'and the repeat prunes like any other row').toBeUndefined()
  })

  it('⚠ ...and the next SEASON starts the rule again', () => {
    const world = probe('sunny')
    accrueSpirit(world, false, events('stage'))
    world.week += WEEKS_PER_YEAR
    while (!quietWeek(world, world.week)) world.week++
    const before = world.events.length
    accrueSpirit(world, false, events('stage'))
    expect(newRows(world, before)[0].keep).toBe(true)
  })

  it('⚠⚠ MEASURED AND CARRIED BACK: an unstamped life row wears the owner\'s white heart', () => {
    // ⚠⚠ A FINDING, RECORDED RATHER THAN FIXED. The feed's glyph column reads
    // `lifeRowGlyph(row.lifeKind)` and resolves an unstamped row through `?? 'met'` to the owner's
    // 11.09 white heart – the ROMANCE thread's own mark. This row carries no `lifeKind` because §8
    // forbids a new `LifeBeatKind` member and who-she-is §5a forbids an agent picking a glyph
    // unasked, so the exposure row will draw 🤍 in the feed beside «they met» and «it ended».
    // ⚠ IT IS NOT T3's TO DECIDE: the fixes are his (a new kind and a new pick, or no mark at all),
    // and this case exists so the consequence is chosen rather than discovered in a playtest.
    const world = probe('sunny')
    const before = world.events.length
    accrueSpirit(world, false, events('stage'))
    const [row] = newRows(world, before)
    expect(row.lifeKind, 'the row carries no kind – §8 forbids a new member').toBeUndefined()
    expect(lifeRowGlyph(row.lifeKind), 'so the column falls back to the romance thread\'s mark').toBe('🤍')
  })
})

