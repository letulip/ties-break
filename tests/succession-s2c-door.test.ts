// ⭐⭐⭐ SUCCESSION S2c – THE DYNASTY DOOR CARRIES THE LEGACY, AT THE WORKER/PROTOCOL SEAM (docs/specs/succession-2026-10.md §8, S2c).
//
// The door is wave 10's own: the ending's second button, the childhood prologue, the ninth card's create command. S2c puts the inheritance on that
// road, and this file measures the half of it that lives behind `postMessage` – the real worker switch, driven the way tests/worker-reply-correlation
// does, over the real engine:
//
//   · THE QUERY      `legacyInput` answers `legacyInputOf`'s own object for the loaded career (parity, field for field), is refused when no career
//                    is loaded, changes nothing (the committed world is equal before and after, the revision is unchanged) and is plain data.
//   · THE CREATION   a `new` carrying a legacy lands the world `createLegacyWorld` builds from the same inputs – the calendar, the wallet, the
//                    holdings, the block – with the nine years and the line's record riding through, and with the origins card SET ASIDE (a
//                    WEALTHY origin on both the profile and the line's handover opens on the ordinary family's budget times the multiplier).
//   · THE PLAIN PATH a `new` with no legacy is the career the worker has always created, whole-world equal to a direct `createWorld`, and wave 10's
//                    own band still applies there – the ruling binds the legacy creation only.
//   · THE REFUSALS   an over-long inherited surname, an inconsistent blob and a forged multiplier are each refused BEFORE a career exists, and the
//                    loaded career is untouched by all three (invariant 1: the worker is the last gate).
//
// ⚠ EXPECTED VALUES COME FROM THE ENGINE AND ITS CONSTANTS, NEVER FROM A LITERAL: the expected world is `createLegacyWorld` itself, built here with
// the arguments the door is supposed to pass, and the named facts are asserted off `STARTING_FUNDS_CENTS`, `START_AGE_YEARS` and
// `LEGACY_FAMILY_BACKGROUND`. A retuned table moves the expectation with it.
// ⚠ NO WORDING IS ASSERTED. The refusal arms read the code and the profile's own limit, never a sentence.
//
// MUTATION-VERIFIED 06.10, each applied, this file run, and the source restored byte-identical (sha256 before = after):
//   · the worker's `createLegacyWorld` branch dropped (`msg.legacy` -> false)        -> 2 red: the creation arm and the refusals arm
//   · the line's handover band not forced (the card's origin honoured)                -> 1 red: the creation arm – the wealthy corner re-opens
//   · the builder's `prologue` pass-through dropped (the nine years thrown away)      -> 1 red: the creation arm
//   · the builder's `dynasty` pass-through dropped (the chain broken)                 -> 1 red: the creation arm
//
// ⭐⭐⭐ RE-AIMED 06.10 (W1 – the owner's ruling 12: «мне кажется нормальной логика вычета, не вижу проблем использовать ее и здесь, отличается только начальная сумма
// для сида по сути…»): the creation arm's wallet used to be the ordinary family's budget times the multiplier, FLAT – the legacy grant REPLACED the prologue's own
// wallet line. The nine years this arm sends are a REAL childhood (`completeRun`, the cheapest road), so the wallet is now `prologueFundsOnBaseCents(B x m, spent)` –
// the prologue's own arithmetic on the multiplied base – and the arm asserts first that the childhood really moved the reserve (a deduction of nothing would leave
// the arm unable to see a mutation that dropped it).
// ⭐⭐⭐ RE-AIMED 13.10 (r51 №5 – THE OWNER'S WORDS: «Династия некорректно передалась в моем случае от миллионерши Алисы к новой со стартовыми 25к и доходом в неделю 425 долларов.
// Мы обсуждали, что должен быть высший тир.»): THE WORKER NO LONGER FORCES THE ORDINARY FAMILY, and this file used to assert that it did. The creation arm below sent a WEALTHY
// origin on the profile and on the line's handover and expected `middle` back, the wallet priced on the middle row ('the wealthy x multiplier corner is closed'), because S2c
// forced `profile.background` and the handover's band to `LEGACY_FAMILY_BACKGROUND` on the architect's reading. No owner ruling stood behind that, and his 05.10 words («она по
// умолчанию в богатой карьере стартует вроде, может быть разве что можно какой-то мультипликатор на начальные деньги … не все миллионы») and the 13.10 message both say the band
// flows. The arm now expects the handover's band on the profile and the wallet priced on THAT row, and its 'corner is closed' assertion is gone with the clamp it measured. The
// block at the foot of the file is the new evidence: the band the engine itself reads off the mother's account reaches the daughter at every edge of its thresholds, against an
// origins card that always disagrees with it, and the numbers the spec's closure note states are pinned there against the engine's own functions.
// The three mutation lines further up are history – the first two describe a clamp that no longer exists. The 13.10 mutations are listed directly under this note.
// MUTATION-VERIFIED 13.10 (r51 №5), each applied by an exact-string swap, this file run, then reversed by the inverse swap (sha256 before = after for the worker and the snapshot builder):
//   · the worker's clamp re-introduced (profile AND handover forced to `middle`)  -> 6 red of 13: the creation arm, the Alice case, exactly-at-the-wealthy-reserve, one cent under the middle
//                                                                                    reserve, the empty account and the Alice's-daughter arm (the two `middle` cases and the numbers pin stay green – a forced middle is their answer)
//   · the snapshot dropping the grant (`openingFundsCents` never built)            -> 7 red of 13: the creation arm and all six band cases, each of which asserts the wire
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createWorld, dynastyHandoverOf, tickWeek, type WorldState } from '../src/engine/world'
import { START_AGE_YEARS } from '../src/engine/world/age'
import { STARTING_FUNDS_CENTS } from '../src/engine/world/create'
import { ECONOMY, prologueFundsOnBaseCents } from '../src/engine/economy'
import { createLegacyWorld, legacyInputOf, LEGACY_SAVINGS_MULTIPLIER, type LegacyInput } from '../src/engine/world/succession'
import { resumeMain } from '../src/engine/rng'
import { decodeExportFile, encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_START_YEAR } from '../src/shared/dates'
import { DEFAULT_PROFILE, PROFILE_NAME_MAX_CHARS, type FamilyBackground, type PlayerProfile, type PrologueHandover } from '../src/shared/protocol'
import { completeRun, handoverOf } from './helpers/completeRun'
import { dynastyOf } from './helpers/dynastyHandover'
import { workerHarness } from './helpers/workerHarness'

interface Reply {
  id: number
  ok: boolean
  type?: string
  error?: string
  code?: string
  revision?: number
  bytes?: ArrayBuffer
  snapshot?: { careerId: string; startYear: number; fundsCents: number; openingFundsCents?: number }
  legacy?: LegacyInput
}

/** Latched off every ok reply, the way tests/worker-reply-correlation.test.ts does. */
let lastRevision = 0
const { send } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

beforeAll(async () => {
  await import('../src/worker/sim.worker')
})

const MOTHER: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Mira', kidLastName: 'Okonkwo' }
const CHILD_SEED = 's2c-gen2:dynasty:2'

/** A lived career, forty weeks in: the finished career as far as the worker can tell (no ending is latched, so the reader prices it at the
 *  floor – tests that need another band pose the multiplier on the blob, as S2b's bench does). */
function finishedCareer(): WorldState {
  const world = createWorld('s2c-finished', MOTHER)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 40; i++) tickWeek(world, rng)
  return world
}

async function load(world: WorldState): Promise<void> {
  const bytes = (await encodeExportFile(world)).slice().buffer as ArrayBuffer
  const reply = await send({ type: 'importSave', bytes })
  expect(reply.ok, `the finished career was not imported: ${reply.error}`).toBe(true)
}

/** The worker's committed world, read the one way a test can: through the real export file. */
async function committedWorld(): Promise<WorldState> {
  const reply = await send({ type: 'exportSave' })
  expect(reply.ok, 'exportSave answered').toBe(true)
  return decodeExportFile(new Uint8Array(reply.bytes!))
}

/** The FIRST path at which two worlds differ, or null – a failure that prints one line instead of two whole worlds. `undefined` equals absent. */
function firstDiff(a: unknown, b: unknown, path = '$'): string | null {
  if (a === b) return null
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return `${path}: ${JSON.stringify(a)?.slice(0, 80)} vs ${JSON.stringify(b)?.slice(0, 80)}`
  }
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: array vs object`
  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
  for (const key of [...keys].sort()) {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (av === undefined && bv === undefined) continue
    const diff = firstDiff(av, bv, `${path}.${key}`)
    if (diff !== null) return diff
  }
  return null
}

describe('S2c – the legacy query', () => {
  // ⚠ FIRST IN THE FILE ON PURPOSE: it needs a worker with nothing loaded, and every later case loads a career.
  it('is refused while no career is loaded, and says so', async () => {
    const reply = await send({ type: 'legacyInput' })
    expect(reply.ok).toBe(false)
    expect(reply.error, 'a refusal carries a reason').toBeTruthy()
    expect(reply.type, 'the failure arm has no reply type').toBeUndefined()
  })

  it('⭐⭐⭐ answers `legacyInputOf`\'s own object for the loaded career – and is a pure read', async () => {
    const finished = finishedCareer()
    await load(finished)
    const revisionBefore = lastRevision
    const before = await committedWorld()

    const first = await send({ type: 'legacyInput' })
    const again = await send({ type: 'legacyInput' })

    expect(first.ok, first.error).toBe(true)
    expect(first.type).toBe('legacyInput')
    // PARITY: the wire's object IS the reader's object, field for field, computed on the committed world.
    expect(first.legacy, 'the query answers legacyInputOf, field for field').toEqual(legacyInputOf(finished))
    expect(again.legacy, 'asking twice gives the same answer').toEqual(first.legacy)
    // ...and it is HER, not a default: the blob names the loaded career's mother and family.
    expect(first.legacy!.motherName).toBe(MOTHER.kidName)
    expect(first.legacy!.surname).toBe(MOTHER.kidLastName)

    // A READ: no revision moved and the committed world is equal before and after (so no draw, no commit).
    expect(first.revision, 'a query reports the revision unchanged').toBe(revisionBefore)
    expect(firstDiff(await committedWorld(), before), 'the query changed the world').toBeNull()

    // PLAIN DATA: it crosses `postMessage` as it is, and a structured clone is equal to it.
    expect(structuredClone(first.legacy)).toEqual(first.legacy)
  })
})

describe('S2c – the create command', () => {
  it('⭐⭐⭐ with a legacy lands `createLegacyWorld`\'s world – and sets the origins card aside', async () => {
    const finished = finishedCareer()
    await load(finished)
    // The blob as the door holds it, with the band POSED at 2.0 (a forty-week career earned no ending) and both holdings named.
    const legacy: LegacyInput = { ...legacyInputOf(finished), savingsMultiplier: 2.0, houseId: 'house-garden', carId: 'car-good' }
    // What the ninth card sends: a REAL childhood, and a WEALTHY origin on the profile and on the line's handover – the corner the 06.10 clamp used to close (r51 №5: it is S2b's designed stacking, restored).
    const run = completeRun('wealthy')
    const prologue = handoverOf(run)
    const profile: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Ilka', kidLastName: legacy.surname, background: 'wealthy' }
    const dynasty = dynastyOf({
      generation: 2,
      childSeed: CHILD_SEED,
      background: 'wealthy',
      raisedOnTour: true,
      motherName: { first: legacy.motherName, last: legacy.surname },
    })

    const reply = await send({ type: 'new', seed: CHILD_SEED, profile, prologue, dynasty, weightEnabled: true, legacy })
    expect(reply.ok, reply.error).toBe(true)
    const world = await committedWorld()

    // (1) THE ENGINE'S OWN WORLD for the same inputs, built the way the door promises: nothing forced – the handover's band, the multiplier stacked on it (r51 №5, 13.10).
    const expected = createLegacyWorld(legacy, CHILD_SEED, 'Ilka', profile, reply.snapshot!.careerId, { prologue, dynasty, weightEnabled: true })
    expect(firstDiff(world, expected), 'the worker built something other than createLegacyWorld(…)').toBeNull()

    // (2) THE NAMED FACTS, off the engine's own constants rather than restated as literals.
    expect(world.startYear, 'the calendar is the daughter\'s').toBe(legacy.daughterBirthYear + START_AGE_YEARS)
    expect(reply.snapshot!.startYear, 'and the snapshot says so').toBe(world.startYear)
    expect(world.profile.background, 'the line\'s handover band reached the profile – the wave-10 band, not the ordinary family').toBe('wealthy')
    // ⭐⭐ W1 (06.10, ruling 12) – RE-AIMED from «B x m, flat»; see the header. ⭐⭐ r51 №5 (13.10): B is the WEALTHY row now, the band the handover carries.
    const multipliedBase = STARTING_FUNDS_CENTS[dynasty.background] * legacy.savingsMultiplier
    const deducted = prologueFundsOnBaseCents(multipliedBase, prologue.spentCents)
    expect(deducted, 'the childhood walked here is not the reference one, so its deduction is not nothing').not.toBe(Math.round(multipliedBase))
    expect(world.fundsCents, 'the wallet is the ordinary family\'s budget times the multiplier, with the childhood\'s deduction on it').toBe(deducted)
    // ⚠⚠ r51 №5 (13.10) – THE ASSERTION THAT STOOD HERE WAS «the wealthy x multiplier corner is closed» (the wallet strictly under the un-deducted wealthy base times the multiplier).
    // It measured the clamp and is gone with it: that corner is S2b's designed stacking, and the wallet above (`deducted`, priced on the WEALTHY row) is its exact value. What
    // replaces it is the wire: the Money screen quotes this grant, so the snapshot has to carry it to the cent.
    expect(reply.snapshot!.openingFundsCents, 'the wire quotes the grant that was made').toBe(world.fundsCents)
    expect(world.profile.kidName, 'her given name is the card\'s').toBe('Ilka')
    expect(world.profile.kidLastName, 'her family name is her mother\'s').toBe(legacy.surname)
    expect(world.legacy?.savingsSliceCents, 'the block records the grant that was made').toBe(world.fundsCents)
    expect(world.legacy?.heirloomAlbum, 'the album travelled as a copy').toEqual(legacy.heirloomAlbum)
    expect(world.assets.map((row) => row.id), 'the house and the car arrived owned').toEqual(['house-garden', 'car-good'])

    // (3) THE NINE YEARS AND THE LINE RODE THROUGH – a door that dropped them would add the money and break the story.
    expect(world.prologueTrace, 'the childhood she walked was applied, not discarded').toEqual(prologue.trace)
    expect(world.dynasty?.generation, 'the chain is intact').toBe(2)
    expect(world.dynasty?.motherName).toEqual(dynasty.motherName)
    expect(world.weightEnabled, 'the creation ask\'s answer rode through').toBe(true)

    // (4) NO DRAWS: the stream is the very one a plain `createWorld` of the same arguments has at position zero.
    const twin = createWorld(CHILD_SEED, profile, reply.snapshot!.careerId, prologue, dynasty, true, world.startYear)
    expect(world.rngMain, 'the legacy creation drew from MAIN').toEqual(twin.rngMain)
  })

  it('⭐⭐ without a legacy it is the career the worker has always created – and wave 10\'s band still applies', async () => {
    await load(finishedCareer())
    const prologue = handoverOf(completeRun('wealthy'))
    const profile: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Ilka', background: 'wealthy' }
    const dynasty = dynastyOf({ generation: 2, childSeed: 's2c-plain', background: 'wealthy', raisedOnTour: true })

    const reply = await send({ type: 'new', seed: 's2c-plain', profile, prologue, dynasty, weightEnabled: false })
    expect(reply.ok, reply.error).toBe(true)
    const world = await committedWorld()

    // BYTE-IDENTICAL TO BEFORE: the whole world equals a direct `createWorld` with the arguments the old handler passed.
    const plain = createWorld('s2c-plain', profile, reply.snapshot!.careerId, prologue, dynasty, false)
    expect(firstDiff(world, plain), 'the plain path moved').toBeNull()
    expect(world.startYear, 'the calendar is the default year').toBe(DEFAULT_START_YEAR)
    expect(world.legacy ?? null, 'no inheritance was written').toBeNull()
    expect(reply.snapshot!.openingFundsCents, 'and a career with no legacy has no grant to quote – its Money line keeps the tier base').toBeUndefined()
    expect(world.profile.background, 'the ruling binds the legacy creation only: wave 10\'s band stands here').toBe('wealthy')
  })

  it('⭐⭐ refusals happen BEFORE a career exists – and leave the loaded career untouched', async () => {
    const finished = finishedCareer()
    await load(finished)
    const careerBefore = (await send({ type: 'getSnapshot' })).snapshot!.careerId
    const legacy = legacyInputOf(finished)
    const good: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Ilka', kidLastName: legacy.surname }
    const tooLong = 'K'.repeat(PROFILE_NAME_MAX_CHARS + 10)

    // (a) THE LOCKED CARD'S OWN PROFILE carrying an over-long inherited family name (possible only on a career opened before the cap):
    //     the profile's law refuses it, as it always did, and the legacy changes nothing about that.
    const overLong = await send({ type: 'new', seed: 's2c-long', profile: { ...good, kidLastName: tooLong }, legacy: { ...legacy, surname: tooLong } })
    expect(overLong.ok).toBe(false)
    expect(overLong.code).toBe('INVALID_COMMAND')

    // (b) THE CARD WAS FINE BUT THE BLOB IS NOT (an inconsistent client): the builder's own guard refuses, and it is not a crash.
    const inconsistent = await send({ type: 'new', seed: 's2c-long', profile: good, legacy: { ...legacy, surname: tooLong } })
    expect(inconsistent.ok).toBe(false)
    expect(inconsistent.error).toMatch(new RegExp(`${PROFILE_NAME_MAX_CHARS}`))

    // (c) A MULTIPLIER NO FINISHED CAREER CAN PRODUCE.
    const forged = await send({ type: 'new', seed: 's2c-forged', profile: good, legacy: { ...legacy, savingsMultiplier: 99 } })
    expect(forged.ok).toBe(false)
    expect(forged.error).toMatch(/savingsMultiplier/)

    // None of the three adopted anything: the loaded career is still the one that was loaded.
    expect((await send({ type: 'getSnapshot' })).snapshot!.careerId).toBe(careerBefore)
  })
})

// =====================================================================================================================================================
// ⭐⭐⭐ r51 №5 (13.10) – THE BAND HER MOTHER EARNED REACHES THE DAUGHTER, AND THE MULTIPLIER STACKS ON IT
//
// The handover is the ENGINE'S OWN reading (`dynastyHandoverOf` of a mother whose account is posed – the one number `dynastyBackgroundOf` reads), never a posed band, so the whole
// chain mother's account -> handover -> `new` -> world is walked through the real worker. The origins card the wizard sends ALWAYS disagrees with the band under test (`working`
// for a wealthy line, `wealthy` for the rest): a card that agreed would let a worker that honoured the card pass for one that honoured the handover.
// ⚠ EXPECTED VALUES COME FROM THE ENGINE'S FUNCTIONS (`prologueFundsOnBaseCents`, the tier table, the multiplier table), the same rule as the arms above; the last case pins the
// literal dollar figures the spec's closure note states, because a number written in prose survives a full gate unless a test reads it.
// =====================================================================================================================================================
describe('r51 №5 – the band her mother earned reaches the daughter, and the multiplier stacks on it', () => {
  const BANDS = ECONOMY.startingFundsCents
  const lived = new Map<FamilyBackground, PrologueHandover>()
  /** The nine years, walked ONCE per band and kept: `completeRun` is the slow half of every case. The childhood is lived in the band the handover will carry, as the real door does. */
  function childhoodIn(band: FamilyBackground): PrologueHandover {
    let hand = lived.get(band)
    if (hand === undefined) {
      hand = handoverOf(completeRun(band))
      lived.set(band, hand)
    }
    return hand
  }

  async function openTheLine(kidFundsCents: number, multiplier: number) {
    const mother = finishedCareer()
    mother.kidFundsCents = kidFundsCents
    await load(mother)
    const handover = dynastyHandoverOf(mother)
    const legacy: LegacyInput = { ...legacyInputOf(mother), savingsMultiplier: multiplier }
    const prologue = childhoodIn(handover.background)
    const card: FamilyBackground = handover.background === 'wealthy' ? 'working' : 'wealthy'
    const profile: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Ilka', kidLastName: legacy.surname, background: card }
    const reply = await send({ type: 'new', seed: handover.childSeed, profile, prologue, dynasty: handover, weightEnabled: true, legacy })
    expect(reply.ok, reply.error).toBe(true)
    return { reply, world: await committedWorld(), handover, prologue, card }
  }

  const CASES: { who: string; kid: number; band: FamilyBackground; m: number }[] = [
    { who: 'the owner\'s own Alice – 346,000 dollars on her account, a held record', kid: 346_000_00, band: 'wealthy', m: LEGACY_SAVINGS_MULTIPLIER.held },
    { who: 'exactly at the wealthy reserve', kid: BANDS.wealthy, band: 'wealthy', m: LEGACY_SAVINGS_MULTIPLIER.solid },
    { who: 'one cent under the wealthy reserve', kid: BANDS.wealthy - 1, band: 'middle', m: LEGACY_SAVINGS_MULTIPLIER.solid },
    { who: 'exactly at the middle reserve', kid: BANDS.middle, band: 'middle', m: LEGACY_SAVINGS_MULTIPLIER.faded },
    { who: 'one cent under the middle reserve', kid: BANDS.middle - 1, band: 'working', m: LEGACY_SAVINGS_MULTIPLIER.early },
    { who: 'an empty account', kid: 0, band: 'working', m: LEGACY_SAVINGS_MULTIPLIER.early },
  ]
  for (const c of CASES) {
    it(`⭐⭐⭐ ${c.who}: the line opens ${c.band}, on the ${c.band} row times ${c.m}`, async () => {
      const { reply, world, handover, prologue, card } = await openTheLine(c.kid, c.m)
      expect(handover.background, 'the engine\'s own reading of the mother\'s account is the band under test').toBe(c.band)
      expect(card, 'the origins card disagrees with that band – it must not be what decided').not.toBe(c.band)
      expect(world.profile.background, 'the band reached the profile').toBe(c.band)
      const wallet = prologueFundsOnBaseCents(STARTING_FUNDS_CENTS[c.band] * c.m, prologue.spentCents)
      expect(world.fundsCents, `the wallet is the ${c.band} row times ${c.m}, with the childhood's deduction on it`).toBe(wallet)
      expect(world.legacy?.savingsSliceCents, 'the block records the grant that was made').toBe(world.fundsCents)
      expect(reply.snapshot!.openingFundsCents, 'and the wire quotes it').toBe(world.fundsCents)
    })
  }

  it('⭐⭐⭐ his Alice\'s daughter no longer opens on the middle row – a wealthy base and a wealthy family\'s weekly money', async () => {
    const { world } = await openTheLine(346_000_00, LEGACY_SAVINGS_MULTIPLIER.held)
    expect(world.profile.background).toBe('wealthy')
    expect(world.fundsCents, 'far over the 25,000 he met, and over the wealthy row itself (the multiplier is stacked on it)').toBeGreaterThan(STARTING_FUNDS_CENTS.wealthy)
    expect(ECONOMY.parentIncomeCents[world.profile.background], 'the parents\' weekly money follows the band: 750 a week').toBe(750_00)
    expect(ECONOMY.parentIncomeCents.middle, 'where the 425 he met is the middle row').toBe(425_00)
  })

  it('⭐⭐ the numbers the spec\'s closure note states, read off the engine\'s own functions – the table and the ceiling', () => {
    const m = LEGACY_SAVINGS_MULTIPLIER
    const at = (band: FamilyBackground, mult: number, spent: number) => prologueFundsOnBaseCents(BANDS[band] * mult, spent)
    const REF = ECONOMY.prologue.referenceSpendCents // the reference childhood moves the reserve by nothing
    const LIGHTEST = 0 // far under the reference: `moved` clamps to +1
    const DEAREST = 1e12 // far over it: `moved` clamps to -1
    const row = (band: FamilyBackground) => [m.early, m.faded, m.solid, m.held].map((x) => at(band, x, REF) / 100)
    expect(row('working'), 'working: early / faded / solid / held').toEqual([8_000, 10_400, 16_000, 24_000])
    expect(row('middle'), 'middle').toEqual([25_000, 32_500, 50_000, 75_000])
    expect(row('wealthy'), 'wealthy').toEqual([120_000, 156_000, 240_000, 360_000])
    expect(at('wealthy', m.held, LIGHTEST) / 100, 'THE CEILING: wealthy x held at the lightest childhood').toBe(432_000)
    expect(at('wealthy', m.held, REF) / 100, 'the same line at the reference childhood').toBe(360_000)
    expect(at('wealthy', m.held, DEAREST) / 100, 'and at the dearest').toBe(288_000)
    expect(at('middle', m.held, DEAREST) / 100, 'his live save: a middle base, held, the dearest childhood').toBe(60_000)
    const every = (['working', 'middle', 'wealthy'] as const).flatMap((b) =>
      [m.early, m.faded, m.solid, m.held].flatMap((x) => [LIGHTEST, REF, DEAREST].map((s) => at(b, x, s))),
    )
    expect(Math.max(...every) / 100, 'the ceiling is the top of every band x multiplier x childhood').toBe(432_000)
  })
})

