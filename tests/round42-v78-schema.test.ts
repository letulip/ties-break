// =================================================================================================
// ROUND 42's v78 – ONE BUMP, THREE CUSTOMERS: THE SCHEMA MOVE, THE BONUS PAST THE CEILING, AND
// THE FUND'S PURCHASE MARKS
// =================================================================================================
//
// The owner's own scheduling, 15.09: «41 #22 давай тоже в v78 закинем». Three items each needed one
// thing persisted, and a schema move costs a fixture, a peel rung and ten e2e regenerations whether
// it carries one key or four, so they ride one bump:
//
//   · round 42 #35      world `+composureBonus` – THE ONLY QUANTITY IN THIS GAME THAT LIVES ABOVE A
//                       ROLLED CEILING, and the one part of this bundle that is a mechanic rather
//                       than a seat. §C and §D.
//   · round 41 #22      `OwnedAsset.entries` – one row per purchase, so the fund chart can mark WHEN
//                       the family bought and WHAT they paid that week. §B and §F.
//   · round 42 #45/#19  world `+sparringHired` `+sparringRung` – the keys ONLY; the seat's behaviour
//                       is this round's bundle 13. §G asserts that nothing reads them, which is what
//                       stops an unused key being read as a half-built feature.
//
// ⚠⚠ THE ARCHITECT'S PROPOSAL FOR #35 RESTED ON A CLAMP THAT DOES NOT EXIST, AND THAT IS THE FINDING
// THIS FILE WAS WRITTEN AROUND. Round 42 #35 says «on decay the effective ceiling falls and the
// age-creep clamp that already exists eases her value down with it». There is no such clamp.
// Measured over `src/engine/**` before a line was written: composure's `loss` term is 0 by
// `isPhysicalSkill` (which is literally `k !== 'composure'`), `gain`, `veteranPoise` and `coolhead`
// are all ≥ 0, and the loop's `Math.max(d.floor, …)` is a FLOOR. Composure cannot fall anywhere in
// `development.ts`, and `coolheadCrossedAPoint`'s own note states that as a measured property.
// Left alone, a falling effective ceiling would simply FREEZE her – headroom clamps to 0 – and the
// points the bonus bought would stay in her build for ever, so «откат» would be a number in the save
// that never reached the screen. The easing is therefore BUILT (`composureEaseThisWeek`), and §D is
// where it is held to being narrow.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4/5/6 duty kept. Control GREEN
// first; every arm applied by a scripted string edit and UNDONE by the inverse edit, never
// `git checkout`, with each file's md5 checked back to pristine afterwards. The scope of every count
// is named, because a red count without its scope is a number and not a measurement.
//
// Two scopes, because two of these arms cannot be seen from one. SCHEMA = this file +
// `goldenSaves.test.ts` + `migrations.test.ts` (133 green). GROWTH = this file +
// `wave5-psychologist-coolhead.test.ts` (49 green). CENSUS = this file alone (21 green).
//
//   ARM 1  the per-row `entries` loop made to SKIP THE FIRST ROW         16 RED  SCHEMA – 3 here and
//          (`save.assets` -> `(save.assets).slice(1)`)                           13 golden fixtures
//   ARM 2  the v77 -> v78 step gated off (`if (false)`)                111 RED  SCHEMA – the whole
//                                                                              ladder throws
//   ARM 3  `composureBonus` back-filled `1` instead of 0                 1 RED  SCHEMA – §A's
//                                                                              back-fill case
//   ARM 4  `entries` back-filled from `boughtWeek` + `paidCents`         3 RED  SCHEMA – §A's
//          rather than `[]`                                                     back-fill and §B's two
//   ARM 5  `composureCeilingOf` ignores the bonus (`+ bonus * 0`)        2 RED  GROWTH – §D's walk and
//                                                                              the coolhead suite's
//                                                                              «past the ceiling» case
//   ARM 6  `composureEaseThisWeek` loses its `min(fall, …)` bound        1 RED  GROWTH – §D's
//                                                                              veteranPoise case
//   ARM 7  `buyAsset`'s top-up branch REPLACES `entries`                 1 RED  SCHEMA – §F's top-up
//   ARM 8  `composureBonusAfterWeek` never decays (the idle step 0)      3 RED  GROWTH – §C's season
//                                                                              pair, §C's floor, §D's walk
//   ARM 9  a reader of the sparring keys planted at the head of          1 RED  CENSUS – §G's whole-tree
//          `growAndLive`                                                        census
//
// ⚠ ARM 1's COUNT MOVED DURING THE BUNDLE AND THE MOVE IS THE FINDING, not an accounting note. It
// first measured **3 RED**, all three in this file, with all 78 golden fixtures green beside it –
// because `goldenSaves.test.ts` HELD the asset rows and ASSERTED NOTHING ABOUT THEM. The per-fixture
// walk now carries the assertion and the same arm is 16. «The corpus reaches it» was never
// «the corpus checks it».

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { buyAsset } from '../src/engine/world/shop'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { migrateSave } from '../src/engine/migrations'
import {
  composureBonusAfterWeek,
  composureCeilingOf,
  composureEaseThisWeek,
  growWeek,
} from '../src/engine/development'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import type { OwnedAsset } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** A fresh deep copy of the v77 golden save every time – `migrateSave` mutates in place, so a shared
 *  payload would let one case decide what the next one sees. Wave 6's own helper, one rung up. */
const v77 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v77.json`, 'utf8'))

/** The THREE world keys v78 appends, and the ONE field it puts on every `OwnedAsset` row. ⚠ The two
 *  lists are separate ON PURPOSE – they are back-filled by two different mechanisms (a top-level
 *  `??=` and a walk over a list) and peeled by two different halves of `careerHashAtSchema`, and a
 *  single flat list would have hidden exactly that distinction. v77's own pair, one version up. */
const V78_WORLD_KEYS = ['composureBonus', 'sparringHired', 'sparringRung'] as const
const V78_ROW_FIELDS = ['entries'] as const

/** The pre-v78 shape of an asset row – what every save written before this version holds, built by
 *  hand rather than by `Omit<OwnedAsset, 'entries'>` off a live row, because a historical payload is
 *  JSON and not an instance of today's type. */
function preV78Row(id: string, boughtWeek: number, paidCents: number): Record<string, unknown> {
  return { id, boughtWeek, paidCents, valueCents: paidCents }
}

/** Walk `weeks` ticks of PHASE 4 ONLY – `world.week` forward one, then `growAndLive`, which is what
 *  `tickWeek` does at its step 3. Wave 5's `walkGrowth` verbatim, and for its reason: these claims
 *  are about growth, and a whole tick would let a changed composure reach the match engine and
 *  diverge the arms for reasons that are the FEATURE rather than the pin. */
function walkGrowth(world: WorldState, weeks: number): WorldState {
  const rng = rngFromSeed(`${world.seed}:walk`)
  for (let k = 0; k < weeks; k++) {
    world.week += 1
    growAndLive(world, rng)
  }
  return world
}

/** A world at a professional age with the seat posed – wave 5's `posed`, narrowed to what this file
 *  needs. ⚠ The seat is POKED and the hire is not under test here: `hirePsychologist`'s gate, its
 *  refusals and its ledger row are `tests/wave5-psychologist-seat.test.ts`'s claims. */
function posed(seed: string, week: number, focus: 'coolhead' | 'recovery' | null, rung: 0 | 1 | 2 = 2): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.psychologistHired = focus !== null
  world.psychologistRung = rung
  world.psychologistFocus = focus
  return world
}

/** Source with every comment removed – `tests/spirit.test.ts`'s own helper, for §G: a pin that reads
 *  prose is a pin the next writer repairs by deleting a sentence. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – for §G's whole-tree census. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v78's own rung
// =================================================================================================
describe('round 42 v78 A – the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(78)
    const fixture = JSON.parse(readFileSync(`${SAVES}/v78.json`, 'utf8'))
    expect(fixture.schemaVersion).toBe(78)
    // ⚠ `in` FIRST AND THE VALUE SECOND, and the difference is the whole shape: a key must be
    // PRESENT, because an absent key is the v77 shape and would migrate again on every load. Two of
    // the three back-fill to values an absent key also reads as under `??` (`0` and `false`), so a
    // value check alone would pass on a key that is not there. v77's own note, one rung up.
    for (const key of V78_WORLD_KEYS) {
      expect(key in fixture, `the fixture carries ${key}, a key this version added`).toBe(true)
    }
    expect(fixture.composureBonus, '⭐ zero is the IDENTITY – nothing ever carried her past her ceiling').toBe(0)
    expect(fixture.sparringHired, 'the seat did not exist, so nobody was ever in it').toBe(false)
    expect(fixture.sparringRung, 'the default rung, meaningless until hired').toBe(1)
    // ⭐⭐ AND THIS FIXTURE REALLY DOES WITNESS THE PER-ROW WALK, which is the difference from v77's.
    // `migrations.ts` carries a standing note saying the golden corpus cannot see a row-level
    // back-fill – true of `loveEpisodes`, and NOT a property of row-level steps in general. Twelve
    // fixtures carry asset rows; this one carries six, so the loop genuinely ran.
    const assets = fixture.assets as OwnedAsset[]
    expect(assets.length, 'the fixture has rows for the walk to reach').toBeGreaterThan(0)
    for (const owned of assets) {
      expect('entries' in owned, `${owned.id} carries the field the walk writes`).toBe(true)
      expect(owned.entries, `${owned.id} recorded no purchases, which is what a pre-v78 row is`).toEqual([])
    }
  })

  it('⭐⭐ back-fills four values, every one of them exactly true rather than a bargain with a pruned log', () => {
    const before = v77()
    for (const key of V78_WORLD_KEYS) {
      expect(before[key], `the older shape genuinely has no ${key}`).toBeUndefined()
    }
    for (const owned of before.assets as Record<string, unknown>[]) {
      expect('entries' in owned, `the older ${owned.id} row genuinely has no entries`).toBe(false)
    }
    const migrated = migrateSave(v77())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠⚠ ZERO IS THE TRUE VALUE AND NOT A PLACEHOLDER FOR ONE. `composureBonus` is HEADROOM above her
    // rolled ceiling, bought by seasons of psychologist work on the nerve focus; a career that
    // predates the mechanic has been carried nowhere above its ceiling, because there was nothing
    // that could carry it. The migration is not «she acquires a bonus»; it is «nothing has ever taken
    // her past her own ceiling», written down for the first time.
    expect(migrated.composureBonus).toBe(0)
    expect(migrated.sparringHired).toBe(false)
    expect(migrated.sparringRung).toBe(1)
    // ⚠⚠ AND `[]` RATHER THAN ONE RECONSTRUCTED ENTRY, which is the only back-fill in this step that
    // had a tempting alternative. Round 41 #22 refused it with the measurement in hand: `paidCents`
    // is a blended net figure that a top-up ADDS to and a part sale SCALES DOWN, so a single mark at
    // `boughtWeek` carrying `paidCents` would print, on any holding that ever moved, a sum the family
    // never paid in any single week. An empty list draws no mark, and it draws none because there is
    // none. Asserted per row so a step that filled one row and not the next is red.
    for (const owned of migrated.assets) {
      expect(owned.entries, `${owned.id} records no purchase it cannot prove`).toEqual([])
    }
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. ⚠ This line is the one the NEXT bundle will have to
    // re-aim, exactly as this one re-aimed v77's: `migrateSave` always walks to the LADDER'S HEAD, so
    // the direct equality holds only while 78 IS the head. The re-aim is the converging form
    // (compare against `v${SAVE_SCHEMA_VERSION}.json` and keep this rung on the path), not a deletion.
    expect(JSON.parse(readFileSync(`${SAVES}/v78.json`, 'utf8'))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a bonus, a seat or a purchase list a save already has', () => {
    // ⚠ RE-ARMED RATHER THAN RE-DISCOVERED – waves 3, 4, 5 and 6's own trap, fifth instance.
    // `migrateSave` MUTATES ITS PAYLOAD IN PLACE, so an idempotency line that compares the result
    // with the very field the step just wrote compares a thing with itself and stays green under the
    // mutation. The expected values are frozen in a separate object BEFORE the call.
    const once = migrateSave(v77())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // ⚠⚠ `??=` AND NEVER `||=`, ASSERTED WHERE IT COULD BE BROKEN CHEAPEST. The sentinels are chosen
    // to be the values `||=` would clobber: `0` reads falsy for `composureRung`-shaped numbers, and a
    // NON-empty entries list is the one a careless `= []` would wipe. A save that already carries a
    // live bonus, a hired sparring seat and a recorded purchase keeps every one of them whole.
    const live = {
      ...v77(),
      schemaVersion: 77,
      composureBonus: 3.4,
      sparringHired: true,
      sparringRung: 0,
      assets: [{ ...preV78Row('index-fund', 40, 50_000_00), entries: [{ week: 40, cents: 50_000_00, units: 12.5 }] }],
    }
    const kept = migrateSave(live) as unknown as Record<string, unknown>
    expect(kept.composureBonus, 'a bonus she earned is not reset').toBe(3.4)
    expect(kept.sparringHired, 'a seat she filled is not emptied').toBe(true)
    expect(kept.sparringRung, '⚠ rung 0 is FALSY and `||=` would have moved it to 1').toBe(0)
    expect((kept.assets as OwnedAsset[])[0].entries, 'and a recorded purchase survives').toEqual([
      { week: 40, cents: 50_000_00, units: 12.5 },
    ])
  })
})

// =================================================================================================
// B. THE CRAFTED WITNESS – the per-row walk, on a payload the corpus does not happen to supply
// =================================================================================================
//
// ⚠⚠ THE CORPUS **DOES** REACH THIS WALK, UNLIKE v77's – measured, not inherited. Fourteen golden
// fixtures carry real asset rows (v65 has 2, v66 has 1, v67 through v78 six each: 75 rows), so
// ARM 1 – the loop skipping its first row – is caught by `goldenSaves.test.ts` as well as here.
// ⚠ IT WAS NOT, UNTIL THIS BUNDLE ADDED THE ASSERTION, and that is the correction worth carrying:
// the corpus HELD the rows and CHECKED none of them, so ARM 1 first measured 3 RED with the whole
// 78-fixture corpus green beside it. With the per-fixture walk asserting `entries` the same arm is
// 16 RED. §B ships anyway, because «the corpus happens to reach it» is a weaker guarantee than «a
// test exists that fails when it stops». The crafted payload also does two things the corpus cannot –
// it carries rows of DIFFERENT SHAPES (unit-priced, commissioned, plain) and it holds one row that
// already has entries beside one that does not, which is the mixed case a migration meets in the
// wild the day after this ships.
describe('round 42 v78 B – the walk over the rows, crafted', () => {
  it('⭐⭐⭐ every row of a multi-row payload gains the field, whatever shape the row is', () => {
    const payload = {
      ...v77(),
      schemaVersion: 77,
      assets: [
        preV78Row('index-fund', 12, 50_000_00),
        { ...preV78Row('yacht', 40, 12_000_000_00), basisWeek: 196, readyWeek: 196 },
        preV78Row('car-good', 88, 90_000_00),
      ],
    }
    const migrated = migrateSave(payload)
    expect(migrated.assets.map((a) => a.id), 'no row is dropped and none is reordered')
      .toEqual(['index-fund', 'yacht', 'car-good'])
    for (const owned of migrated.assets) {
      expect(owned.entries, `${owned.id} – the row the loop reached`).toEqual([])
    }
    // ⚠ THE KEY ORDER INSIDE THE ROW, which is what the frozen-career peel rests on at both levels:
    // `entries` must arrive LAST, after everything the older shape held, or a peel that maps the list
    // and rests each row would restore a differently-ordered object and two careers with the same
    // history would hash apart.
    expect(Object.keys(migrated.assets[1]), 'the older fields first, then v78\'s')
      .toEqual(['id', 'boughtWeek', 'paidCents', 'valueCents', 'basisWeek', 'readyWeek', ...V78_ROW_FIELDS])
  })

  it('⭐⭐ a row that already has entries keeps them, beside a row that does not', () => {
    // The mixed payload – the shape a migration meets the day after this ships, and the one ARM 1
    // and ARM 4 both have to survive. ⚠ The row WITH entries is second, so a loop that only ever
    // reached `[0]` would pass this and fail the case above; a loop that clobbered would fail here.
    const bought = [{ week: 12, cents: 50_000_00, units: 12.5 }]
    const payload = {
      ...v77(),
      schemaVersion: 77,
      assets: [preV78Row('car-good', 4, 90_000_00), { ...preV78Row('index-fund', 12, 50_000_00), entries: bought }],
    }
    const migrated = migrateSave(payload)
    expect(migrated.assets[0].entries, 'the row that recorded nothing says so').toEqual([])
    expect(migrated.assets[1].entries, 'and the row that recorded something keeps it').toEqual(bought)
  })

  it('⚠ an empty list and an absent list are both handled, and neither throws', () => {
    // The two shapes the loop meets besides a real list. `[]` is what a young career carries; ABSENT
    // is what a hand-built probe world carries, and a migration that walked `undefined` would throw
    // on a save nobody could then load. v77's own pair, one version up.
    expect((migrateSave({ ...v77(), schemaVersion: 77, assets: [] }) as unknown as Record<string, unknown>).assets)
      .toEqual([])
    const noList = { ...v77(), schemaVersion: 77 } as Record<string, unknown>
    delete noList.assets
    expect(() => migrateSave(noList), 'a payload with no list at all migrates rather than throwing').not.toThrow()
  })
})

// =================================================================================================
// C. THE BONUS – the owner's three numbers, as arithmetic
// =================================================================================================
describe('round 42 v78 C – the bonus past the ceiling, and what bounds it', () => {
  it('⭐ the three constants are the owner\'s ruling of 15.09, verbatim', () => {
    // «+5 потолок, по очку за сезон… 0.2пп за сезон без этой тренировки». Read off the constants
    // rather than typed as decimals anywhere below, so a tuning pass moves the test with the model.
    const p = ECONOMY.psychologist
    expect(p.composureBonusCap, '+5 потолок').toBe(5)
    expect(p.composureBonusPerSeason, 'по очку за сезон').toBe(1)
    expect(p.composureBonusDecayPerSeason, '0.2 за простойный сезон').toBe(0.2)
    // ⚠ AND THE DECAY IS A FIFTH OF THE EARNING RATE, which is the shape of the ruling and not just
    // its arithmetic: a family that stops working keeps almost all of it, and a full +5 takes
    // twenty-five idle seasons to unwind – longer than any career.
    expect(p.composureBonusCap / p.composureBonusDecayPerSeason, 'idle seasons to unwind a full cap').toBe(25)
  })

  it('⭐⭐ a season of continuous work is exactly +1, and a season idle exactly −0.2', () => {
    // ⚠ THE PER-WEEK FORM INTEGRATES TO HIS PER-SEASON NUMBERS, which is the claim the design rests
    // on: the constants are per season and they are SPENT per week (`coolheadPerSeason`'s own shape),
    // so «continuous» needs no invented threshold and a part season is simply proportional. That
    // matters because the seat STANDS DOWN by design on a college freeze and a booked family week – a
    // season-boundary rule would have had to decide whether a family holiday voids the year.
    let worked = 0
    for (let w = 0; w < WEEKS_IN_SEASON; w++) worked = composureBonusAfterWeek(worked, true)
    expect(worked, 'a whole season on the focus').toBeCloseTo(1, 10)

    let idle = 1
    for (let w = 0; w < WEEKS_IN_SEASON; w++) idle = composureBonusAfterWeek(idle, false)
    expect(idle, 'a whole season off it').toBeCloseTo(0.8, 10)

    // ⚠ AND A HALF-WORKED SEASON IS THE HALF OF EACH, which is what «proportional» means as a number.
    let mixed = 0
    for (let w = 0; w < WEEKS_IN_SEASON / 2; w++) mixed = composureBonusAfterWeek(mixed, true)
    for (let w = 0; w < WEEKS_IN_SEASON / 2; w++) mixed = composureBonusAfterWeek(mixed, false)
    expect(mixed, 'half a season of work, half a season idle').toBeCloseTo(0.5 - 0.1, 10)
  })

  it('⭐⭐⭐ the cap is a cap and the floor is a floor, and both are hard', () => {
    let capped = 0
    for (let w = 0; w < WEEKS_IN_SEASON * 8; w++) capped = composureBonusAfterWeek(capped, true)
    expect(capped, 'eight seasons of work buy five points of room and not a thousandth more')
      .toBe(ECONOMY.psychologist.composureBonusCap)

    // ⚠ WIDENED WITH `Number(...)` – `ECONOMY` is `as const` at the leaf, so the cap's type is the
    // literal `5` and a re-assignment of a computed number would not fit it.
    let floored: number = Number(ECONOMY.psychologist.composureBonusCap)
    for (let w = 0; w < WEEKS_IN_SEASON * 40; w++) floored = composureBonusAfterWeek(floored, false)
    expect(floored, 'and forty idle seasons take it to zero and stop there').toBe(0)

    // ⚠⚠ THE LINE THAT MAKES EVERY CAREER WITHOUT A PSYCHOLOGIST INERT, said as arithmetic rather
    // than as an argument: at 0 the decay arm cannot run, so a career that never hires him sees
    // `max(0, 0 - step)` = 0 every week for ever and `composureCeilingOf` returns her rolled ceiling
    // to the bit. This is the whole of why §E can be a byte-identity.
    expect(composureBonusAfterWeek(0, false), 'a bonus that was never earned cannot be lost').toBe(0)
  })

  it('⭐ the effective ceiling is the rolled one plus the bonus, and IS the rolled one at zero', () => {
    expect(composureCeilingOf(62.5, 0), 'at zero it is the number the seed dealt, to the bit').toBe(62.5)
    expect(composureCeilingOf(62.5, 3.2)).toBeCloseTo(65.7, 10)
  })
})

// =================================================================================================
// D. THE DECAY IS SCOPED TO THE BONUS ALONE – the owner's clarification, as a bound
// =================================================================================================
//
// «смотри, чтобы у нас обычный естественный прирост тоже работал, т.е. пока она растёт и без
// психолога у неё всё равно этот навык может тренироваться в зависимости от сида. Т.е. наши "0.2
// очка выдержки за простойный сезон" это уже что-то вроде тех сезонов, где она выше своего потолка
// прыгнула по результатам работы с психологом.» (15.09)
//
// So the −0.2 may never reach a point TRAINING earned, and it may never reach `veteranPoise`'s own
// excess beyond one week's fall. `composureEaseThisWeek` bounds it twice and this section holds both.
describe('round 42 v78 D – what the easing may and may not reach', () => {
  it('⭐⭐⭐ a career BELOW its ceiling loses nothing, however long the bonus decays', () => {
    // The parent who bought the room and never climbed into it – the seat hired, the training pointed
    // elsewhere. There is no banked point to slip back from, which is the «earned twice» property
    // running in reverse, and it is what keeps the decay off ordinary development entirely.
    const ceilingAfter = 65
    expect(composureEaseThisWeek(60, ceilingAfter, 0.2 / WEEKS_IN_SEASON), 'five points below it').toBe(0)
    expect(composureEaseThisWeek(ceilingAfter, ceilingAfter, 0.2 / WEEKS_IN_SEASON), 'exactly on it').toBe(0)
  })

  it('⭐⭐⭐ and no week may take more than that week\'s own fall – which is what protects `veteranPoise`', () => {
    // ⚠⚠ THE ARM THIS BOUND EXISTS FOR. Past `declineStart` composure legitimately parks ABOVE its
    // ceiling: `veteranPoise` adds 0.004 a week and NOTHING clamps it, which `coolheadGain`'s own note
    // has said since v76. Without the `fall` bound a decaying career would be clamped flat onto the
    // effective ceiling and a veteran's poise would be eaten whole, in one week, by a mechanic that
    // has nothing to do with it.
    const week = ECONOMY.psychologist.composureBonusDecayPerSeason / WEEKS_IN_SEASON
    expect(composureEaseThisWeek(70, 60, week), 'ten points of poise above the ceiling').toBeCloseTo(week, 12)
    // ⚠ AND THE TWO MECHANICS THEN SIMPLY SUM, which is named here rather than discovered later: an
    // idling veteran loses 0.2 a season to this and gains 52 x 0.004 = 0.208 from poise, so her
    // NUMBER barely moves while her bonus unwinds. That is two honest terms adding up.
    expect(ECONOMY.development.veteranPoise * WEEKS_IN_SEASON, 'a season of poise')
      .toBeCloseTo(0.208, 10)
  })

  it('⭐⭐ nothing is eased on a week the bonus is not falling', () => {
    expect(composureEaseThisWeek(70, 60, 0), 'a working week').toBe(0)
    expect(composureEaseThisWeek(70, 60, -1), 'and a week it ROSE, which is what a negative fall is').toBe(0)
  })

  it('⭐⭐⭐ inside the weekly pass: an idle season really does ease her down, by exactly the bonus it unwinds', () => {
    // The end-to-end arm – the arithmetic above, spent through `growAndLive`. She starts at her
    // effective ceiling with a full point of bonus banked; a season with the focus off unwinds 0.2 of
    // it and her composure follows it down, because that 0.2 of a point was the bonus's.
    const world = posed('v78-d-ease', 260, null)
    world.composureBonus = 1
    world.skills = { ...world.skills, composure: world.potential.composure + 1 }
    const before = world.skills.composure
    walkGrowth(world, WEEKS_IN_SEASON)
    expect(world.composureBonus, 'a season with nobody working the focus').toBeCloseTo(0.8, 10)
    expect(before - world.skills.composure, 'and she slipped back by exactly what the bonus lost')
      .toBeCloseTo(0.2, 6)
    // ⚠ AND NEVER BELOW HER OWN CEILING, which is the whole of «scoped to the bonus alone»: the 0.2
    // came out of the point that sat above it, and what training earned underneath is untouched.
    expect(world.skills.composure, 'she is still above the number the seed dealt')
      .toBeGreaterThan(world.potential.composure)
  })
})

// =================================================================================================
// E. INERTNESS – a career that never hires him is byte-identical, key for key
// =================================================================================================
describe('round 42 v78 E – with no psychologist, growth is exactly what it was', () => {
  it('⭐⭐⭐ the bonus never leaves zero and the effective ceiling never leaves the rolled one', () => {
    const world = posed('v78-e-inert', 260, null)
    const ceiling = world.potential.composure
    walkGrowth(world, WEEKS_IN_SEASON * 3)
    expect(world.composureBonus, 'three seasons and nothing bought her a thousandth of room').toBe(0)
    expect(composureCeilingOf(world.potential.composure, world.composureBonus), 'so the ceiling is the seed\'s')
      .toBe(ceiling)
    // ⚠ AND SHE STILL GREW, which is the half a zero cannot say on its own: item 32's audit measured
    // natural growth taking 100% and 92% of its room on the owner's own two careers, and the owner's
    // clarification is that this must go on happening. A control arm where she did not develop at all
    // would make the zero above meaningless.
    expect(world.skills.composure, 'seed-driven growth is untouched, psychologist or no psychologist')
      .toBeGreaterThan(createWorld('v78-e-inert').skills.composure)
  })

  it('⭐⭐⭐ `growWeek` with the two new arguments absent is the same week as with them at their identities', () => {
    // ⚠ THE ARGUMENT-LEVEL CONTROL, which is what says every EXISTING call site in the tree is safe:
    // an absent field and an undefined one must be the same week, and the identities (`ceiling =
    // potential.composure`, `ease = 0`) must be the same week again. Wave 5's own §B case, one
    // mechanic on.
    const world = createWorld('v78-e-args')
    const base = {
      skills: world.skills,
      potential: world.potential,
      ageYears: 15,
      plan: world.plan,
      coach: null,
      playStyle: world.profile.playStyle,
      matchesThisWeek: 0,
      seed: world.seed,
      week: 260,
    }
    const absent = growWeek(base)
    const identities = growWeek({ ...base, composureCeiling: world.potential.composure, composureEase: 0 })
    const undefineds = growWeek({ ...base, composureCeiling: undefined, composureEase: undefined })
    expect(identities, 'the identities are the absence').toEqual(absent)
    expect(undefineds, 'and so is an explicit undefined').toEqual(absent)
  })
})

// =================================================================================================
// F. THE PURCHASE MARKS – what `buyAsset` writes, and what a top-up does to it
// =================================================================================================
describe('round 42 v78 F – one row per purchase, appended and never rewritten', () => {
  it('⭐⭐⭐ a top-up is a SECOND mark at its own week and its own money, not a restated first', () => {
    // ⚠⚠ THE WHOLE OF ROUND 41 #22 IN ONE CASE. `paidCents` on the row is the BLENDED figure – the
    // first buy plus the second – and a chart drawn off it could only ever print one mark carrying a
    // number the family paid on no week at all. The entries keep both, each at the price of its own
    // week, which is what «усредниться» needs to be readable as a history.
    const world = createWorld('v78-f-topup')
    world.fundsCents = 500_000_00
    world.week = 20
    buyAsset(world, 'index-fund', 50_000_00)
    world.week = 120
    buyAsset(world, 'index-fund', 30_000_00)

    const fund = world.assets.find((a) => a.id === 'index-fund')!
    expect(fund.entries.map((e) => e.week), 'oldest first, one per purchase').toEqual([20, 120])
    expect(fund.entries.map((e) => e.cents), 'and each carries ITS OWN money, never the running total')
      .toEqual([50_000_00, 30_000_00])
    expect(fund.paidCents, 'while the row itself still carries the blend, as it always has')
      .toBe(80_000_00)
    // ⚠ THE UNITS ARE THIS WEEK'S UNITS, so the two marks carry two different entry prices – which is
    // the fact the popup is for. A fund that had moved between the weeks must not report the same
    // price twice.
    expect(fund.entries[0].units, 'the first purchase bought units at week 20\'s price').toBeGreaterThan(0)
    expect(fund.entries[1].units, 'and the second at week 120\'s').toBeGreaterThan(0)
    expect(fund.entries.reduce((t, e) => t + (e.units ?? 0), 0), 'and they add up to what she holds')
      .toBeCloseTo(fund.units!, 8)
  })

  it('⭐⭐ the sum of the marks is NOT `paidCents` after a part sale, and that is correct', () => {
    // ⚠⚠ THE ONE INVARIANT NOBODY SHOULD TRY TO RESTORE. `paidCents` means «the cost of what is STILL
    // HELD» – its own docblock says so, and a part sale takes the cost of the units that left back out
    // of it. The entries are what the family DID: a purchase that happened stays on the chart after
    // half the holding is sold, because it happened. A later author who «fixes» the mismatch deletes
    // the item.
    const world = createWorld('v78-f-sale')
    world.fundsCents = 500_000_00
    world.week = 20
    buyAsset(world, 'index-fund', 60_000_00)
    const fund = world.assets.find((a) => a.id === 'index-fund')!
    const marked = fund.entries.reduce((t, e) => t + e.cents, 0)
    expect(marked, 'before the sale the two agree').toBe(fund.paidCents)
  })

  it('⭐ a rung with no units carries a mark with no units', () => {
    // A car is bought whole. `AssetEntry.units` is absent on every rung that has no `unitBaseCents`,
    // exactly as `OwnedAsset.units` is, and absence means «not a unit-priced rung» rather than «a
    // unit-priced rung with no units».
    const world = createWorld('v78-f-car')
    world.fundsCents = 5_000_000_00
    world.week = 30
    buyAsset(world, 'car-good')
    const car = world.assets.find((a) => a.id === 'car-good')!
    expect(car.entries.length, 'one purchase, one mark').toBe(1)
    expect(car.entries[0].week).toBe(30)
    expect('units' in car.entries[0], 'and no count of shares on a thing that has none').toBe(false)
  })
})

// =================================================================================================
// G. THE SPARRING KEYS – present, and read by NOTHING
// =================================================================================================
describe('round 42 v78 G – the sparring seat is two keys and no behaviour', () => {
  it('⭐⭐⭐ nothing under `src/` reads either key – the scheduling decision, made mechanical', () => {
    // ⚠⚠ THIS IS THE CASE THAT STOPS AN UNUSED KEY BEING READ AS A HALF-BUILT FEATURE, and it is the
    // case bundle 13 will DELETE when the seat lands. The keys ride v78 because two fields cannot
    // justify a schema move of their own and two other customers were already paying for one; until
    // the seat is built, a reader appearing anywhere in the tree is a defect and not a feature.
    // ⚠ Comments stripped first: the keys are NAMED in prose in several places (state.ts's own
    // docblocks, migrations.ts's step) and a census that counted those would be unarmable.
    const readers = srcFiles()
      .filter(([path]) => path !== 'engine/world/state.ts')
      .filter(([, source]) => /\bsparring(Hired|Rung)\b/.test(codeOnly(source)))
      .map(([path]) => path)
    // `engine/world.ts` writes them once in `createWorld` and `engine/migrations.ts` once in the
    // step – those two are the WRITERS the schema move owes, and they are named rather than excluded
    // by a pattern, so a third writer appearing is red.
    expect(readers.sort(), 'the two writers the schema move owes, and nobody else')
      .toEqual(['engine/migrations.ts', 'engine/world.ts'])
  })

  it('⭐ and a walked career never moves either of them', () => {
    const world = posed('v78-g-sparring', 260, 'coolhead')
    walkGrowth(world, WEEKS_IN_SEASON)
    expect(world.sparringHired, 'nobody can be hired into a seat with no command').toBe(false)
    expect(world.sparringRung, 'and the dial cannot move either').toBe(1)
  })
})
