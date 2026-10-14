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
// ⚠ 14.10 (r51 continuation – THE OWNER'S CASH-CEILING RULING): «Потолок наследства $288-432k - это мы про наличные говорим? Если да, то я думаю даже что 288 может быть верхним потолком, учитывая еще дом и машину,
// в этот раунд». The opening CASH is capped at $288,000 (`LEGACY_CASH_CEILING_CENTS`, the last step of `legacyOpeningCashCents`); the house and the car arrive on top and are untouched. The numbers pin at the foot
// of this file used to read its table off `prologueFundsOnBaseCents` alone and to call 432,000 «the ceiling»: it now reads the table off the engine's one wallet function, so the cap is SEEN, and the wealthy x held
// trio 432,000 / 360,000 / 288,000 is 288,000 x3. The Alice case's expectation takes the cap from the constant and the economy's own function and never from the seam the world was built by (a seam compared with
// itself cannot go red when its clamp is removed). Predicted vs measured, cell by cell, is the arm after the numbers pin; the boundary arm follows it.
// MUTATION-VERIFIED 14.10 (the one clamp line in `legacyOpeningCashCents` removed by reverse-applying a one-hunk patch, the wallet suites run, the patch re-applied; sha256 of succession.ts before = after):
//   · clamp removed -> 7 red across 3 files: HERE the numbers pin (the wealthy x held trio and the maximum), the predicted-vs-measured arm, the boundary arm and the Alice case (4); tests/succession-s2b-create.test.ts
//     the twelve-cell table and the world-level boundary arm (2); tests/component/r51-money-opening-grant.test.ts the mounted real-career arm (1). S2a's multiplier suite stays green – it never reads the wallet.
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createWorld, dynastyHandoverOf, tickWeek, type WorldState } from '../src/engine/world'
import { START_AGE_YEARS } from '../src/engine/world/age'
import { STARTING_FUNDS_CENTS } from '../src/engine/world/create'
import { ECONOMY, prologueFundsOnBaseCents } from '../src/engine/economy'
import { createLegacyWorld, legacyInputOf, legacyOpeningCashCents, LEGACY_CASH_CEILING_CENTS, LEGACY_SAVINGS_MULTIPLIER, type LegacyInput } from '../src/engine/world/succession'
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
      // ⚠ 14.10: THE CEILING IS PART OF THE WALLET NOW. The expectation builds it from the economy's own function and the exported constant – NOT from `legacyOpeningCashCents`, which built the world. Alice's line is
      // the live case: the cheapest road prices wealthy x held at 432,000 and the ceiling holds it at 288,000.
      const wallet = Math.min(prologueFundsOnBaseCents(STARTING_FUNDS_CENTS[c.band] * c.m, prologue.spentCents), LEGACY_CASH_CEILING_CENTS)
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

  // ⚠ 14.10 – THE OWNER'S CEILING RULING SUPERSEDES THE 432,000 THIS PIN USED TO CALL «THE CEILING»: «Потолок наследства $288-432k - это мы про наличные говорим? Если да, то я думаю даже что 288 может быть
  // верхним потолком, учитывая еще дом и машину, в этот раунд». The table is read through `legacyOpeningCashCents` – the engine's one wallet function, cap included – and no longer off
  // `prologueFundsOnBaseCents` alone, which is exactly what let this pin go on saying 432,000 about a rule that had stopped allowing it. The wealthy x held trio was 432,000 / 360,000 / 288,000 (lightest /
  // reference / dearest childhood) and is 288,000 x3: the whole row lands ON the cap. Every other cell is where it was, and the live-save line below is untouched.
  const m = LEGACY_SAVINGS_MULTIPLIER
  const BAND_NAMES = ['working', 'middle', 'wealthy'] as const
  const REF = ECONOMY.prologue.referenceSpendCents // the reference childhood moves the reserve by nothing
  const LIGHTEST = 0 // far under the reference: `moved` clamps to +1
  const DEAREST = 1e12 // far over it: `moved` clamps to -1
  const at = (band: FamilyBackground, mult: number, spent: number) => legacyOpeningCashCents(band, mult, spent)
  const row = (band: FamilyBackground) => [m.early, m.faded, m.solid, m.held].map((x) => at(band, x, REF) / 100)

  it('⭐⭐ the numbers the spec\'s closure note states, read off the engine\'s own functions – the table and the ceiling', () => {
    expect(row('working'), 'working: early / faded / solid / held').toEqual([8_000, 10_400, 16_000, 24_000])
    expect(row('middle'), 'middle').toEqual([25_000, 32_500, 50_000, 75_000])
    expect(row('wealthy'), 'wealthy – the held cell was 360,000 before the 14.10 ceiling').toEqual([120_000, 156_000, 240_000, 288_000])
    expect(at('wealthy', m.held, LIGHTEST) / 100, 'THE CEILING: wealthy x held at the lightest childhood – was 432,000').toBe(288_000)
    expect(at('wealthy', m.held, REF) / 100, 'the same line at the reference childhood – was 360,000').toBe(288_000)
    expect(at('wealthy', m.held, DEAREST) / 100, 'and at the dearest – 288,000 before and after: the ceiling is where the dearest childhood always landed').toBe(288_000)
    expect(at('wealthy', m.solid, LIGHTEST) / 100, 'wealthy x solid at the lightest childhood is 120,000 x 2.0 x 1.2 – exactly AT the ceiling, unchanged').toBe(288_000)
    expect(at('middle', m.held, DEAREST) / 100, 'his live save: a middle base, held, the dearest childhood').toBe(60_000)
    const every = BAND_NAMES.flatMap((b) => [m.early, m.faded, m.solid, m.held].flatMap((x) => [LIGHTEST, REF, DEAREST].map((s) => at(b, x, s))))
    expect(every, 'the denominator: 3 bands x 4 multipliers x 3 childhoods').toHaveLength(36)
    expect(Math.max(...every) / 100, 'the top of every band x multiplier x childhood – was 432,000').toBe(288_000)
    expect(Math.max(...every), 'and that top IS the constant').toBe(LEGACY_CASH_CEILING_CENTS)
  })

  it('PREDICTED vs MEASURED (invariant 5, 14.10): of the 36 cells the ceiling moves exactly the two wealthy x held ones that were over it – and of the 12 childhood-less ones, one', () => {
    // «Before» is the pre-ceiling arithmetic, the economy's own function; «after» is the engine's wallet function. A cell is listed only if the two differ.
    const moved: string[] = []
    let cells = 0
    for (const band of BAND_NAMES) {
      for (const [name, x] of Object.entries(m)) {
        for (const [childhood, spent] of [['lightest', LIGHTEST], ['reference', REF], ['dearest', DEAREST]] as [string, number][]) {
          cells++
          const before = prologueFundsOnBaseCents(BANDS[band] * x, spent)
          const after = at(band, x, spent)
          if (after !== before) moved.push(`${band} x ${name} @ ${childhood}: ${before / 100} -> ${after / 100}`)
        }
      }
    }
    expect(cells, 'the denominator').toBe(36)
    expect(moved).toEqual(['wealthy x held @ lightest: 432000 -> 288000', 'wealthy x held @ reference: 360000 -> 288000'])
    // No nine years riding along: B x m rounded once – the twelve-cell table of S2b.
    const movedBare: string[] = []
    let bare = 0
    for (const band of BAND_NAMES) {
      for (const [name, x] of Object.entries(m)) {
        bare++
        const before = Math.round(BANDS[band] * x)
        const after = legacyOpeningCashCents(band, x)
        if (after !== before) movedBare.push(`${band} x ${name}: ${before / 100} -> ${after / 100}`)
      }
    }
    expect(bare, 'the denominator').toBe(12)
    expect(movedBare).toEqual(['wealthy x held: 360000 -> 288000'])
  })

  it('THE BOUNDARY (14.10): a computed wallet one cent over the ceiling clamps, one cent under passes through, exactly at stays – with and without the nine years', () => {
    const cap = LEGACY_CASH_CEILING_CENTS
    const B = STARTING_FUNDS_CENTS.wealthy
    const cases: [string, number, number][] = [
      ['one cent over', cap + 1, cap],
      ['exactly at', cap, cap],
      ['one cent under', cap - 1, cap - 1],
    ]
    for (const [label, raw, expected] of cases) {
      // A multiplier that lands the raw wallet on the chosen cent: the engine takes any multiplier in the table's corridor (S2b already feeds it 1.2345679) and rounds once, at the end.
      const bareMultiplier = raw / B
      expect(Math.round(B * bareMultiplier), `${label}: the raw wallet without a childhood really is ${raw} (the denominator the arm leans on)`).toBe(raw)
      expect(legacyOpeningCashCents('wealthy', bareMultiplier), `${label}, no childhood`).toBe(expected)
      // With the lightest childhood riding along (+20 % on the multiplied base): the deduction first, the cap after.
      const childhoodMultiplier = raw / (B * (1 + ECONOMY.prologue.reserveSwingShare))
      expect(prologueFundsOnBaseCents(B * childhoodMultiplier, LIGHTEST), `${label}: the raw wallet with the lightest childhood really is ${raw}`).toBe(raw)
      expect(legacyOpeningCashCents('wealthy', childhoodMultiplier, LIGHTEST), `${label}, lightest childhood`).toBe(expected)
    }
    // The cap clears every band's richest ordinary start (the lightest childhood), so a generation-2 start is never poorer than an ordinary one – the §4 corridor's intent.
    for (const band of BAND_NAMES) expect(cap, `${band}: an ordinary start sits under the cap`).toBeGreaterThan(prologueFundsOnBaseCents(BANDS[band], LIGHTEST))
  })
})
