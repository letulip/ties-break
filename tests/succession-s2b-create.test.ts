// SUCCESSION S2b – `createLegacyWorld`, GENERATION 2'S CREATION PATH
// (docs/specs/succession-2026-10.md §1, §3, §4, §5; engine/world/succession.ts, with one new optional argument on `createWorld`).
//
// ⭐⭐ INVARIANT 5 – THE BENCH, PREDICTED BEFORE IT WAS RUN. This block was written into the file before its first run, B read off the
// constant: `STARTING_FUNDS_CENTS.middle` = 25_000_00 = 2_500_000 cents, the default girl's family. The four bands, whole cents, ONE multiply:
//
//     band    m      predicted fundsCents    predicted feed figure
//     early   1.0     2_500_000               $25,000
//     faded   1.3     3_250_000               $32,500
//     solid   2.0     5_000_000               $50,000
//     held    3.0     7_500_000               $75,000
//
//   · the SAME on all three seeds – the money is a function of the profile's background and the band, never of the seed;
//   · `legacy.savingsSliceCents` equal to the wallet (the amount GRANTED), and the week-0 feed line stating that very figure;
//   · UNCHANGED by the house and the car arriving – nothing is debited for a holding that arrives owned;
//   · no table product needs rounding (B is a multiple of 100 and every multiplier a multiple of 0.1), so the rounding arm poses 1.2345679
//     (2_500_000 x 1.2345679 = 3_086_419.75, which must land on 3_086_420);
//   · the other two backgrounds scale the same way: working 800_000 x m, wealthy 12_000_000 x m.
//
// ⭐⭐ W1 (06.10) – THE BENCH, RE-PREDICTED FOR THE CHILDHOOD DEDUCTION'S RETURN (the owner's ruling 12: «мне кажется нормальной логика вычета, не вижу проблем
// использовать ее и здесь, отличается только начальная сумма для сида по сути, ну и дом, машина и некоторые сбережения на счете»). WRITTEN BEFORE THE ARMS OF §2b
// WERE RUN, from the constants and from three REAL childhoods walked through the card table's own reducers. A career that arrives with its nine years opens on
// the prologue's own arithmetic on the MULTIPLIED base –
//
//     wallet = round( B x m x (1 + reserveSwingShare x moved) ),    moved = clamp( (referenceSpend - spent) / spendSwing, -1, +1 )
//
// with ECONOMY.prologue = { referenceSpendCents: 1_817_500, spendSwingCents: 997_500, reserveSwingShare: 0.2 } and B = 2_500_000 (middle):
//
//     road                  spent       moved      x (1 + 0.2 x moved)
//     the cheapest road       820_000   +1.0000    1.2000
//     a mixed road          1_600_000   +0.2180    1.0436   (87/399 of the swing – the interior point, the one that shows a SHARE and not a flat bonus)
//     the dearest road      2_815_000   -1.0000    0.8000
//
//     band    m      cheapest road   mixed road     dearest road
//     early   1.0     3_000_000       2_609_023      2_000_000
//     faded   1.3     3_900_000       3_391_729      2_600_000
//     solid   2.0     6_000_000       5_218_045      4_000_000
//     held    3.0     9_000_000       7_827_068      6_000_000
//
//   · the early row IS the ordinary start of the same childhood (`createWorld` with the prologue and no legacy): the deduction is the prologue's rule, not a lookalike;
//   · NO prologue (the wizard's skip) is the first block's figure untouched – B x m, rounded once – and every cell of the twelve-cell arm of §2 stands as written.
//
// ⚠ WHAT THE BENCH IS AND IS NOT (S2a's finding 2): no walked career has ever reached the 3.0 band, so the four inputs are POSED – the REAL
// reader's output for a REAL walked bankruptcy with the multiplier set to the band's ruled value. This measures CREATION, not the walk. The
// reader's own mapping (facts -> band) is S2a's measured arm; the one real chain here is the walked bankruptcy -> 1.0 -> an ordinary start.
//
// ⚠ ONE CAREER IS WALKED AND THE REST IS POSED, the way S2a does it: `openCareer` + `stepCareerWeek` out of tools/econ-bench (a bankruptcy
// at about week 141, no child, never on the pro table), a birth pushed on a clone the way wave 10's §A pushes one (no career a suite can
// afford to walk has a child), and the multiplier, the house and the car set on the input. The file says which is which at every case.
//
// ⚠ MUTATION-VERIFIED 06.10 – see the S2b line of the spec's §8 ledger for the counts: the multiplier flattened to 1.0 and the start year
// pinned to 2031, each applied, RUN and restored byte-identical (`cmp`).
import { beforeAll, describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { createWorld, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { kidBirthYear, START_AGE_YEARS } from '../src/engine/world/age'
import { assetEntryPriceCents, deliveredAssets, shopItem, weeklyAssetUpkeepCents } from '../src/engine/world/assets'
import { STARTING_FUNDS_CENTS } from '../src/engine/world/create'
import { bookPractice } from '../src/engine/world/planner'
import { buyAsset } from '../src/engine/world/shop'
import { toSnapshot } from '../src/engine/world/snapshot'
import { createLegacyWorld, legacyInputOf, LEGACY_DAUGHTER_LAG_YEARS, type LegacyInput } from '../src/engine/world/succession'
import { tickWeek } from '../src/engine/world/tick'
import { resumeMain } from '../src/engine/rng'
import { compressWorld, decodeExportFile, decompressWorld, encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_START_YEAR, weekLabel, weekYear } from '../src/shared/dates'
import { formatCents } from '../src/shared/money'
import { DEFAULT_PROFILE, PROFILE_NAME_MAX_CHARS, profileShapeError, type FamilyBackground, type PrologueHandover } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { PROLOGUE_CARDS, TOURNAMENT_ANSWER } from '../src/prologue/cards'
import { EMPTY_RUN, cardFor, isComplete, withEntry, withOrigin, withPick } from '../src/prologue/run'
import { completeRun, handoverOf } from './helpers/completeRun'

/** ⚠ THE CAP IS A BELT, NOT A HORIZON (S2a's note): the walk stops the moment its ending latches. */
const CAP_WEEKS = 1600

let MOTHER: WorldState //  a REAL bankruptcy: no pro table, no recorded child, the early band
let REAL: LegacyInput //   `legacyInputOf(MOTHER)` – a real reader's output, multiplier 1.0

beforeAll(() => {
  const policy = POLICIES[0]
  const { world, rng } = openCareer(PRESETS[5], 1, policy)
  let weeks = 0
  while (world.ending === null && weeks < CAP_WEEKS) {
    stepCareerWeek(world, rng, policy)
    weeks += 1
  }
  MOTHER = world
  REAL = legacyInputOf(world)
}, 300_000)

const SEEDS = ['s2b-alpha', 's2b-beta', 's2b-gamma']
const NAME = 'Mira'
const B = STARTING_FUNDS_CENTS.middle

/** The real input with named fields posed over it – how this file reaches a band no walked career has met. */
const posed = (over: Partial<LegacyInput> = {}): LegacyInput => ({ ...REAL, ...over })
const born = (over: Partial<LegacyInput> = {}, seed = SEEDS[0], name = NAME): WorldState =>
  createLegacyWorld(posed(over), seed, name)
/** A plain `createWorld` as the legacy path would have called it, minus the legacy: same seed, same names, same year. */
const plainTwin = (seed: string, startYear: number): WorldState =>
  createWorld(seed, { ...DEFAULT_PROFILE, kidName: NAME, kidLastName: REAL.surname }, undefined, undefined, undefined, undefined, startYear)

/** The four rows of §4, with the PREDICTED wallet of the header. */
const BANDS = [
  { band: 'early', m: 1.0, cents: 2_500_000 },
  { band: 'faded', m: 1.3, cents: 3_250_000 },
  { band: 'solid', m: 2.0, cents: 5_000_000 },
  { band: 'held', m: 3.0, cents: 7_500_000 },
] as const

const NO_ASSETS = { houseId: null, carId: null } as const

// =================================================================================================
// 0. THE DENOMINATORS – what the walked mother and the constants are, so no later arm runs on a world
//    that is not the one its name says
// =================================================================================================

describe('S2b 0 – the walked mother and the constants are what this file says they are', () => {
  it('a REAL bankruptcy, no recorded child, the floor band; B and the opening age are the constants the prediction was written against', () => {
    expect(MOTHER.ending?.type, 'a REAL bankruptcy latched').toBe('bankruptcy')
    expect(MOTHER.children, 'no birth: the epilogue synthesizes the year').toEqual([])
    expect(REAL.savingsMultiplier, 'the real reader: a forced ending is the floor').toBe(1)
    expect(STARTING_FUNDS_CENTS.middle, 'B – the ordinary start budget of the default girl; if it moved, re-predict the header').toBe(2_500_000)
    expect(DEFAULT_PROFILE.background).toBe('middle')
    expect(START_AGE_YEARS, 'a prologue hands a girl to the world at fourteen – the age the calendar arithmetic adds').toBe(14)
    // ⚠ RE-AIMED 09.10 BY v93 (the localization rig L3-0): S2b still moves no schema – the head moved under it, by another wave's step.
    expect(SAVE_SCHEMA_VERSION, 'S2b moves no schema (the head is v93: the localization rig, not S2b)').toBe(93)
  })
})

// =================================================================================================
// 1. THE CALENDAR
// =================================================================================================

describe('S2b 1 – the calendar: she opens at START_AGE_YEARS, in the year that follows from her birth', () => {
  it('⭐ no recorded child (the REAL epilogue year): the ending year + the lag + her opening age – and `kidBirthYear` inverts it', () => {
    const endingYear = weekYear(MOTHER.ending!.week, MOTHER.startYear)
    expect(REAL.daughterBirthYear, 'the reader\'s synthesized birth year, as S2a measured it').toBe(endingYear + LEGACY_DAUGHTER_LAG_YEARS)
    const world = born()
    expect(world.startYear).toBe(endingYear + LEGACY_DAUGHTER_LAG_YEARS + START_AGE_YEARS)
    expect(kidBirthYear(world.startYear), 'the engine\'s own reader puts her birth where the legacy says').toBe(REAL.daughterBirthYear)
  })

  it('⭐ a REAL child (posed on the walked mother the way S2a poses one): her birth week\'s year + her opening age', () => {
    const mother = structuredClone(MOTHER)
    const bornWeek = mother.ending!.week - 40
    mother.children.push({ bornWeek, sex: 'girl' })
    const input = legacyInputOf(mother)
    expect(input.daughterBirthYear, 'source (a): the recorded girl').toBe(weekYear(bornWeek, mother.startYear))
    const world = createLegacyWorld(input, SEEDS[0], NAME)
    expect(world.startYear).toBe(weekYear(bornWeek, mother.startYear) + START_AGE_YEARS)
    expect(kidBirthYear(world.startYear)).toBe(input.daughterBirthYear)
  })

  it('⭐ literal arithmetic with no reader in the way: born 2060 opens in 2074, and the calendar, the snapshot and the label say so', () => {
    const world = born({ daughterBirthYear: 2060 })
    expect(world.startYear).toBe(2074)
    expect(kidBirthYear(2074)).toBe(2060)
    expect(weekLabel(0, world.startYear)).toBe("W1 '74")
    expect(toSnapshot(world).startYear, 'the snapshot hands the year over').toBe(2074)
    expect(born({ daughterBirthYear: 2060 }).startYear, 'and it is not the year every career has always opened in').not.toBe(DEFAULT_START_YEAR)
  })

  it('a birth year the calendar cannot hold is refused by `createWorld`\'s own guard', () => {
    for (const year of [1800, 2400, 2040.5, Number.NaN]) {
      expect(() => born({ daughterBirthYear: year }), `born ${year}`).toThrow(RangeError)
    }
  })
})

// =================================================================================================
// 2. THE MONEY – the invariant-5 bench
// =================================================================================================

describe('S2b 2 – the money: B x the band, one multiply, whole cents', () => {
  it('the four predicted figures are the header\'s, to the cent (the denominator the arms below lean on)', () => {
    for (const { m, cents } of BANDS) expect(Math.round(B * m), `${m} x B`).toBe(cents)
  })

  for (const { band, m, cents } of BANDS) {
    it(`⭐ ${band} (${m} x B): opens on ${cents} cents on every seed, granted and stated, and never poorer or richer than the corridor`, () => {
      for (const seed of SEEDS) {
        const world = born({ savingsMultiplier: m, ...NO_ASSETS }, seed)
        const ordinary = createWorld(seed).fundsCents
        expect(ordinary, 'the ordinary start of the same family').toBe(B)
        expect(world.fundsCents, `${seed}: B x ${m}`).toBe(cents)
        expect(world.fundsCents, `${seed}: and the multiply is the whole rule`).toBe(Math.round(B * m))
        expect(world.legacy!.savingsSliceCents, `${seed}: the amount GRANTED`).toBe(cents)
        expect(world.events[0].week).toBe(0)
        expect(world.events[0].text, `${seed}: the career's first sentence states the wallet it really opened with`).toContain(formatCents(cents))
        expect(world.fundsCents, 'never poorer than an ordinary start').toBeGreaterThanOrEqual(ordinary)
        expect(world.fundsCents, 'and never past three times it').toBeLessThanOrEqual(3 * ordinary)
      }
    })
  }

  it('⭐ the house and the car arriving move no money: the wallet is the same with or without them, on every band', () => {
    for (const { m, cents } of BANDS) {
      const without = born({ savingsMultiplier: m, ...NO_ASSETS })
      const withBoth = born({ savingsMultiplier: m, houseId: 'house-garden', carId: 'car-good' })
      expect(withBoth.assets, 'both arrived').toHaveLength(2)
      expect(without.assets, 'and the control has none').toHaveLength(0)
      expect(withBoth.fundsCents).toBe(cents)
      expect(withBoth.fundsCents).toBe(without.fundsCents)
      expect(withBoth.legacy!.savingsSliceCents).toBe(cents)
    }
  })

  it('the rounding rule: a multiplier the table never produces still lands on whole cents', () => {
    const world = born({ savingsMultiplier: 1.2345679, ...NO_ASSETS })
    expect(B * 1.2345679, 'the unrounded product has a fraction').not.toBe(Math.round(B * 1.2345679))
    expect(world.fundsCents).toBe(3_086_420)
    expect(Number.isInteger(world.fundsCents)).toBe(true)
    expect(world.legacy!.savingsSliceCents).toBe(3_086_420)
  })

  it('B follows the profile\'s own background – twelve cells, each exactly B(background) x m', () => {
    const backgrounds: FamilyBackground[] = ['working', 'middle', 'wealthy']
    for (const background of backgrounds) {
      for (const { m } of BANDS) {
        const world = createLegacyWorld(posed({ savingsMultiplier: m, ...NO_ASSETS }), SEEDS[0], NAME, { ...DEFAULT_PROFILE, background })
        expect(world.fundsCents, `${background} x ${m}`).toBe(Math.round(STARTING_FUNDS_CENTS[background] * m))
        expect(world.profile.background).toBe(background)
      }
    }
  })

  it('the one REAL chain: a walked bankruptcy -> the real reader -> the real creation opens on exactly an ordinary start', () => {
    const world = createLegacyWorld(REAL, SEEDS[0], NAME)
    expect(world.fundsCents).toBe(createWorld(SEEDS[0]).fundsCents)
    expect(world.legacy!.endingKind).toBe('bankruptcy')
  })
})

// =================================================================================================
// 2b. THE CHILDHOOD'S DEDUCTION RETURNS (06.10, W1 – the owner's ruling 12): the header's twelve predicted figures, measured
// =================================================================================================

/** A REAL childhood through the card table's own reducers – `completeRun`'s road with the pick rule changed, the three tournament asks declined. */
function roadWith(pick: (optionCount: number, age: number) => number): PrologueHandover {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const row of PROLOGUE_CARDS) {
    const card = cardFor(row.age, run)
    if (card.options) run = withPick(run, card.age, card.options[pick(card.options.length, card.age)].id)
  }
  for (const age of [11, 12, 13]) run = withEntry(run, age, TOURNAMENT_ANSWER.decline)
  if (!isComplete(run)) throw new Error('roadWith: the builder no longer yields a finished childhood – the prologue card table moved')
  return handoverOf(run)
}

/** The header's three roads: each with its REAL spend and the four predicted wallets, in `BANDS` order (early, faded, solid, held). */
const ROADS = [
  { name: 'the cheapest road', handover: handoverOf(completeRun('middle')), spent: 820_000, wallets: [3_000_000, 3_900_000, 6_000_000, 9_000_000] },
  { name: 'a mixed road', handover: roadWith((_count, age) => (age % 2 === 0 ? 0 : 1)), spent: 1_600_000, wallets: [2_609_023, 3_391_729, 5_218_045, 7_827_068] },
  { name: 'the dearest road', handover: roadWith((count) => count - 1), spent: 2_815_000, wallets: [2_000_000, 2_600_000, 4_000_000, 6_000_000] },
] as const

describe('S2b 2b – the childhood\'s deduction returns on the multiplied base (the owner\'s ruling 12)', () => {
  it('the three roads and the constants are the ones the header was written against (the denominators the arms below lean on)', () => {
    for (const road of ROADS) expect(road.handover.spentCents, `${road.name}: the real spend of the walked cards`).toBe(road.spent)
    expect(ECONOMY.prologue, 'the reference, the swing and the share – if one moved, re-predict the header').toEqual({
      referenceSpendCents: 1_817_500,
      spendSwingCents: 997_500,
      reserveSwingShare: 0.2,
    })
  })

  for (const road of ROADS) {
    it(`⭐ ${road.name} (spent ${road.spent}): the four bands open on the predicted wallets, on every seed, granted and stated`, () => {
      for (const [i, { band, m }] of BANDS.entries()) {
        const cents = road.wallets[i]
        for (const seed of SEEDS) {
          const world = createLegacyWorld(posed({ savingsMultiplier: m, ...NO_ASSETS }), seed, NAME, undefined, undefined, { prologue: road.handover })
          expect(world.fundsCents, `${seed} · ${band} (${m} x B) on ${road.name}`).toBe(cents)
          expect(world.legacy!.savingsSliceCents, `${band}: the amount GRANTED is the wallet it opened with`).toBe(cents)
          expect(world.events[0].text, `${band}: the first sentence states that wallet`).toContain(formatCents(cents))
        }
      }
    })
  }

  it('⭐ the early band IS the ordinary start of the same childhood – the deduction is the prologue\'s own rule, not a lookalike', () => {
    for (const road of ROADS) {
      const ordinary = createWorld(SEEDS[0], { ...DEFAULT_PROFILE, kidName: NAME, kidLastName: REAL.surname }, undefined, road.handover)
      const early = createLegacyWorld(posed({ savingsMultiplier: 1.0, ...NO_ASSETS }), SEEDS[0], NAME, undefined, undefined, { prologue: road.handover })
      expect(early.fundsCents, road.name).toBe(ordinary.fundsCents)
      expect(early.fundsCents, `${road.name}: and it is the prologue's own function on B`).toBe(prologueFundsCents('middle', road.spent))
    }
  })

  it('the corridor survives the deduction: never poorer than an ordinary start of the SAME childhood, never past three times it', () => {
    for (const road of ROADS) {
      const ordinary = prologueFundsCents('middle', road.spent)
      for (const { m } of BANDS) {
        const world = createLegacyWorld(posed({ savingsMultiplier: m, ...NO_ASSETS }), SEEDS[0], NAME, undefined, undefined, { prologue: road.handover })
        expect(world.fundsCents, `${road.name} x ${m}`).toBeGreaterThanOrEqual(ordinary)
        expect(world.fundsCents, `${road.name} x ${m}`).toBeLessThanOrEqual(3 * ordinary)
      }
    }
  })
})

// =================================================================================================
// 3. HER NAME, HER MOTHER'S BLOCK
// =================================================================================================

describe('S2b 3 – her name and her mother\'s block', () => {
  it('the given name is the caller\'s and the family name is generation 1\'s; the rest of her is the base profile', () => {
    const world = born({ surname: 'Okonkwo' }, SEEDS[0], 'Ife')
    expect(world.profile).toEqual({ ...DEFAULT_PROFILE, kidName: 'Ife', kidLastName: 'Okonkwo' })
    expect(profileShapeError(world.profile), 'a career the engine may open').toBeNull()
    expect(world.events[0].text, 'and the first sentence names her').toContain('Ife')
  })

  it('a base profile from the door is kept whole and only the two names are written over it', () => {
    const base = { ...DEFAULT_PROFILE, country: 'FR', birthMonth: 11, birthDay: 3, playStyle: 'aggressive' as const }
    const world = createLegacyWorld(posed(), SEEDS[0], 'Ife', base)
    expect(world.profile).toEqual({ ...base, kidName: 'Ife', kidLastName: REAL.surname })
  })

  it('⭐ the mother\'s block is persisted whole, in the declared shape, with the amount granted', () => {
    const input = posed({ motherName: 'Vera', motherPeakRank: 17, motherSlamTitles: 0, endingKind: 'plateau', savingsMultiplier: 2.0 })
    const world = createLegacyWorld(input, SEEDS[0], NAME)
    expect(world.legacy).toEqual({
      motherName: 'Vera',
      motherPeakRank: 17,
      motherSlamTitles: 0,
      surname: input.surname,
      endingKind: 'plateau',
      savingsSliceCents: 2 * B,
      heirloomAlbum: input.heirloomAlbum,
    })
    expect(Object.keys(world.legacy!), 'S1\'s declared shape, in its order, with nothing added').toEqual([
      'motherName',
      'motherPeakRank',
      'motherSlamTitles',
      'surname',
      'endingKind',
      'savingsSliceCents',
      'heirloomAlbum',
    ])
  })

  it('a mother who never touched the pro table is carried as null, not dropped', () => {
    expect(REAL.motherPeakRank).toBeNull()
    const world = born()
    expect('motherPeakRank' in world.legacy!).toBe(true)
    expect(world.legacy!.motherPeakRank).toBeNull()
  })

  it('⭐ the album is COPIED in: equal bytes, no shared object, and no live link to the input afterwards', () => {
    const input = posed()
    const world = createLegacyWorld(input, SEEDS[0], NAME)
    expect(world.legacy!.heirloomAlbum).not.toBe(input.heirloomAlbum)
    expect(JSON.stringify(world.legacy!.heirloomAlbum)).toBe(JSON.stringify(input.heirloomAlbum))
    const before = JSON.stringify(world.legacy)
    ;(input.heirloomAlbum as unknown as Record<string, unknown>).poked = true
    input.motherName = 'somebody else'
    expect(JSON.stringify(world.legacy), 'the finished career\'s object can be thrown away').toBe(before)
  })
})

// =================================================================================================
// 4. THE HOUSE AND THE CAR
// =================================================================================================

describe('S2b 4 – the house and the car arrive owned', () => {
  it('⭐ both rows exist, delivered, at the week-0 quote of the generation-2 shelf, and the family paid nothing', () => {
    const world = born({ houseId: 'house-garden', carId: 'car-good' })
    expect(world.assets.map((row) => row.id), 'house first, then car').toEqual(['house-garden', 'car-good'])
    for (const row of world.assets) {
      const item = shopItem(row.id)!
      expect(row.paidCents, `${row.id}: the shop's own quote at week ${world.week}`).toBe(assetEntryPriceCents(world, item))
      expect(row.boughtWeek).toBe(0)
      expect(row.valueCents, `${row.id}: opens at what it is "paid" for, to the cent`).toBe(row.paidCents)
      expect(row.entries, `${row.id}: nothing left the wallet, so there is no purchase mark`).toEqual([])
      expect(row.readyWeek, `${row.id}: delivered – a contract is not a house`).toBeUndefined()
    }
    expect(deliveredAssets(world).map(({ owned }) => owned.id)).toEqual(['house-garden', 'car-good'])
    expect(world.assets[0].paidCents, 'a house quotes the catalogue in whole dollars at week 0').toBe(Math.round(shopItem('house-garden')!.entryCents / 100) * 100)
    expect(world.assets[1].paidCents, 'a car quotes the catalogue').toBe(shopItem('car-good')!.entryCents)
  })

  it('absent when null – and one alone is one row', () => {
    expect(born(NO_ASSETS).assets).toEqual([])
    expect(born({ houseId: 'house-first', carId: null }).assets.map((row) => row.id)).toEqual(['house-first'])
    expect(born({ houseId: null, carId: 'car-sensible' }).assets.map((row) => row.id)).toEqual(['car-sensible'])
  })

  it('⭐ the arrival is the shop\'s own row shape: the keys a real purchase writes, in its order, at its price', () => {
    const shop = createWorld(SEEDS[0])
    shop.fundsCents = 1_000_000_00
    buyAsset(shop, 'car-good')
    const bought = shop.assets[0]
    const arrived = born({ houseId: null, carId: 'car-good' }).assets[0]
    expect(Object.keys(arrived)).toEqual(Object.keys(bought))
    expect(arrived.paidCents, 'the till charged the quote the arrival records').toBe(bought.paidCents)
    expect(arrived.valueCents).toBe(bought.valueCents)
    expect(arrived.boughtWeek).toBe(bought.boughtWeek)
    expect(bought.entries, 'a purchase marks what left the wallet…').toHaveLength(1)
    expect(arrived.entries, '…an arrival marks nothing, because nothing did').toEqual([])
  })
})

// =================================================================================================
// 5. THE ORDINARY PATH IS BYTE FOR BYTE WHAT IT WAS
// =================================================================================================

/** ⚠ S1's DIGESTS, taken from the PRISTINE tree (7df39c35) – the three `default` creations of tests/succession-s1-start-year.test.ts. This
 *  file edited `createWorld` (one optional argument and one `??`), so the plain path is re-measured here against the same table, with the
 *  same normalisation: `startYear` removed, the version set back to 91, sha1, first 16 hex. */
const PRISTINE_H0: Record<string, string> = {
  's1-alpha': '1662620015bc23c9',
  's1-beta': '2376db693585cb49',
  's1-gamma': '5f847e633dd4e992',
}

function v91Digest(world: unknown): string {
  const c = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
  delete c.startYear
  c.schemaVersion = 91
  return createHash('sha1').update(JSON.stringify(c)).digest('hex').slice(0, 16)
}

describe('S2b 5 – a career that never touches the door is what it always was', () => {
  for (const [seed, want] of Object.entries(PRISTINE_H0)) {
    it(`${seed}: the plain creation matches the digest taken before the change, carries no legacy and owns nothing`, () => {
      const world = createWorld(seed)
      expect(world.startYear).toBe(DEFAULT_START_YEAR)
      expect('legacy' in world, 'absent is what generation 1 is').toBe(false)
      expect(world.assets).toEqual([])
      expect(v91Digest(world), 'every byte of the plain world').toBe(want)
    })
  }

  it('an explicit `undefined` wallet is the absent one, byte for byte', () => {
    const a = createWorld('s2b-plain')
    const b = createWorld('s2b-plain', DEFAULT_PROFILE, undefined, undefined, undefined, undefined, DEFAULT_START_YEAR, undefined)
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })

  it('`createWorld`\'s guard on the new argument: whole cents, zero or more – and zero is a wallet, not an absence', () => {
    for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createWorld('s2b-guard', DEFAULT_PROFILE, undefined, undefined, undefined, undefined, 2031, bad), `${bad}`).toThrow(RangeError)
    }
    expect(createWorld('s2b-guard', DEFAULT_PROFILE, undefined, undefined, undefined, undefined, 2031, 0).fundsCents).toBe(0)
    expect(createWorld('s2b-guard', DEFAULT_PROFILE, undefined, undefined, undefined, undefined, 2031, 12_345).fundsCents).toBe(12_345)
  })
})

// =================================================================================================
// 6. THE LEGACY APPLICATION DRAWS NOTHING AND MOVES ONLY WHAT IT DECLARES
// =================================================================================================

describe('S2b 6 – no draws: the stream and the world are a plain creation\'s, plus exactly what the legacy declares', () => {
  it('⭐ `rngMain` equals a plain `createWorld`\'s on the same seed and year – every seed, every band, with the holdings arriving', () => {
    for (const seed of SEEDS) {
      for (const { m } of BANDS) {
        const legacy = born({ savingsMultiplier: m, houseId: 'house-first', carId: 'car-sensible' }, seed)
        const plain = plainTwin(seed, legacy.startYear)
        expect(legacy.rngMain, `${seed} x ${m}`).toEqual(plain.rngMain)
        expect(legacy.rngMain.n, 'creation taps no MAIN draw at all').toBe(0)
      }
    }
  })

  it('⭐ every other key of the world is the plain world\'s, byte for byte: only the wallet, the holdings, the opening line and the block differ', () => {
    for (const seed of SEEDS) {
      const legacy = born({ savingsMultiplier: 3.0, houseId: 'house-garden', carId: 'car-good', daughterBirthYear: 2060 }, seed)
      const plain = plainTwin(seed, legacy.startYear)
      expect(Object.keys(legacy), 'the block is the one key added, and it is last').toEqual([...Object.keys(plain), 'legacy'])
      const skip = new Set(['fundsCents', 'assets', 'events'])
      for (const key of Object.keys(plain)) {
        if (skip.has(key)) continue
        expect(JSON.stringify((legacy as unknown as Record<string, unknown>)[key]), `${seed}: ${key}`).toBe(
          JSON.stringify((plain as unknown as Record<string, unknown>)[key]),
        )
      }
      expect(legacy.events.slice(1), 'the feed past its first sentence').toEqual(plain.events.slice(1))
      expect({ ...legacy.events[0], text: '' }).toEqual({ ...plain.events[0], text: '' })
      expect(legacy.fundsCents - plain.fundsCents, '3.0 x B is B plus two B more').toBe(2 * B)
    }
  })

  it('same seed + same legacy blob = the same generation-2 world, byte for byte (§5)', () => {
    const a = born({ houseId: 'house-garden', carId: 'car-good', savingsMultiplier: 1.3 })
    const b = born({ houseId: 'house-garden', carId: 'car-good', savingsMultiplier: 1.3 })
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    expect(JSON.stringify(born({ savingsMultiplier: 1.3 }, SEEDS[1])), 'and another seed is another girl').not.toBe(JSON.stringify(born({ savingsMultiplier: 1.3 }, SEEDS[0])))
  })
})

// =================================================================================================
// 7. IT IS AN ORDINARY SAVE
// =================================================================================================

describe('S2b 7 – the created world survives a save round trip with its legacy block intact', () => {
  const make = (): WorldState => born({ houseId: 'house-garden', carId: 'car-good', savingsMultiplier: 3.0, daughterBirthYear: 2060 })

  it('JSON round trip is lossless', () => {
    const world = make()
    expect(JSON.stringify(JSON.parse(JSON.stringify(world)))).toBe(JSON.stringify(world))
  })

  it('⭐ `compressWorld` -> `decompressWorld` keeps the block, the rows, the year and every byte', async () => {
    const world = make()
    const { payload, checksum } = await compressWorld(world)
    const back = await decompressWorld(payload, checksum)
    expect(back.legacy).toEqual(world.legacy)
    expect(back.assets).toEqual(world.assets)
    expect(back.startYear).toBe(2074)
    expect(back.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(JSON.stringify(back)).toBe(JSON.stringify(world))
  })

  it('⭐ the export file (the guarded import path) round-trips the same world', async () => {
    const world = make()
    const back = await decodeExportFile(await encodeExportFile(world))
    expect(back.legacy).toEqual(world.legacy)
    expect(JSON.stringify(back)).toBe(JSON.stringify(world))
  })

  it('and the restored world ticks on exactly as the original does', async () => {
    const a = make()
    const { payload, checksum } = await compressWorld(a)
    const b = await decompressWorld(payload, checksum)
    const ra = resumeMain(a.rngMain)
    const rb = resumeMain(b.rngMain)
    for (let i = 0; i < 10; i++) {
      tickWeek(a, ra)
      tickWeek(b, rb)
    }
    expect(b.rngMain).toEqual(a.rngMain)
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })
})

// =================================================================================================
// 8. SHE PLAYS
// =================================================================================================

describe('S2b 8 – twenty weeks of the generation-2 world', () => {
  it('⭐ no throw, the labels name 2074, the holdings are still hers and the block is untouched', () => {
    const world = born({ daughterBirthYear: 2060, houseId: 'house-garden', carId: 'car-good', savingsMultiplier: 2.0 })
    bookPractice(world, 2, false)
    const block = JSON.stringify(world.legacy)
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 20; i++) tickWeek(world, rng)

    expect(world.week).toBe(20)
    expect(world.startYear, 'the year survives the weeks').toBe(2074)
    expect(world.events.some((e) => e.text === "Practice match booked – W3 '74"), 'the planner prints off the world\'s own year').toBe(true)
    // ⚠ THE BLOCK IS LEFT OUT OF THE SCAN: the mother's album is her own calendar's prose and rightly names 2031's years.
    const { legacy: _block, ...rest } = world
    const labels = [...JSON.stringify(rest).matchAll(/\bW\d{1,2} '(\d\d)/g)].map((m) => m[1])
    expect(labels.length, 'the scan is not vacuous').toBeGreaterThan(0)
    expect(labels.filter((y) => y !== '74'), 'no persisted week label names another year').toEqual([])
    expect(weekLabel(world.week, world.startYear)).toBe("W21 '74")
    expect(toSnapshot(world).startYear).toBe(2074)

    expect(JSON.stringify(world.legacy), 'the mother\'s block is a record, not a ledger').toBe(block)
    expect(world.assets.map((row) => row.id)).toEqual(['house-garden', 'car-good'])
    expect(deliveredAssets(world), 'still delivered').toHaveLength(2)
    expect(weeklyAssetUpkeepCents(world), 'the shop\'s own bill reads the arrived rows: a house and a car are not free to keep').toBeGreaterThan(0)
    expect(weeklyAssetUpkeepCents(born(NO_ASSETS)), 'and a family that owns nothing pays none').toBe(0)
  })
})

// =================================================================================================
// 9. WHAT IT REFUSES
// =================================================================================================

describe('S2b 9 – what createLegacyWorld refuses', () => {
  it('a multiplier outside the table\'s own corridor, or not a number', () => {
    for (const m of [0.99, 3.01, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => born({ savingsMultiplier: m }), `${m}`).toThrow(/savingsMultiplier/)
    }
  })

  it('a house that is not a house, a car that is not a car, a rung that is not on the shelf', () => {
    expect(() => born({ houseId: 'car-good' })).toThrow(/houseId/)
    expect(() => born({ carId: 'house-first' })).toThrow(/carId/)
    expect(() => born({ houseId: 'castle-in-spain' })).toThrow(/houseId/)
  })

  it('a name the profile\'s own law refuses – the given name and the inherited one', () => {
    expect(() => born({}, SEEDS[0], '')).toThrow(/first name/i)
    expect(() => born({}, SEEDS[0], 'x'.repeat(PROFILE_NAME_MAX_CHARS + 1))).toThrow(RangeError)
    expect(() => born({ surname: '' })).toThrow(/family name/i)
  })

  it('a refusal leaves the input exactly as it found it', () => {
    const input = posed({ savingsMultiplier: 9 })
    const before = JSON.stringify(input)
    expect(() => createLegacyWorld(input, SEEDS[0], NAME)).toThrow(RangeError)
    expect(JSON.stringify(input)).toBe(before)
  })
})
