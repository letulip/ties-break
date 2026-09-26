import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { COACH_TIERS } from '../src/engine/coach'
import { guardDeclaredShape } from '../src/engine/saveGuard'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { sanitizeName } from '../src/db/saves'
import {
  DEFAULT_PROFILE,
  // ⭐⭐ A-05 (26.09): the two DRAFT refusals the `new` case gained, read off the constants and never
  // transcribed – see block 1b.
  DYNASTY_HANDOVER_REFUSAL,
  PROFILE_NAME_MAX_CHARS,
  PROLOGUE_HANDOVER_REFUSAL,
  profileShapeError,
  type PlayerProfile,
  type PrologueHandover,
  type WorkerErrorCode,
} from '../src/shared/protocol'
import { dynastyOf } from './helpers/dynastyHandover'
import { workerHarness } from './helpers/workerHarness'

// =================================================================================================
// ⭐⭐ E-06 (05.09 engine review) – THE THREE WIRE PAYLOADS THE ENGINE USED TO TRUST.
//
// The owner, 06.09: «Движок не имеет фраз отказа для трёх случаев: битая анкета новой карьеры, число
// недель вне диапазона, непригодное имя сейва» – and then «предложи и поправь пожалуйста». So the
// three sentences below are proposed copy, and this file is where they are pinned: a refusal the
// player reads is exactly as much a shipped fact as a label on a button.
//
// CLAUDE.md invariant 1 is what the fix is FOR: "Every command is re-validated engine-side, so a
// stale screen cannot corrupt a career." Three payloads were not.
//
// ⚠ EVERY REFUSAL IS ASSERTED TWICE – the CODE and the SENTENCE – and neither is decoration. The
// code is the branch a test or a future UI takes (`saveGuard.ts`'s own header: "the code exists so
// tests … never match on prose"); the sentence is what the player is actually shown, through
// `stores/game.ts` -> `StoreError.vue` and the wizard's own `<p class="error">`.
//
// ⚠ MUTATION-VERIFIED. What each mutation reddened is written above the block it belongs to.
// =================================================================================================

interface Reply {
  id: number
  ok: boolean
  type?: string
  error?: string
  code?: WorkerErrorCode
  revision?: number
  snapshot?: { week: number; careerId: string }
  slots?: unknown[]
}

let lastRevision = 0
const { send } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

beforeAll(async () => {
  await import('../src/worker/sim.worker')
})

/** A career the worker will accept, so the refusals below are refusals of the PAYLOAD and never of
 *  the state. Returns the revision the worker committed it at. */
async function openCareer(seed: string): Promise<number> {
  const res = await send({ type: 'new', seed, profile: DEFAULT_PROFILE })
  expect(res.ok, `the control career opened: ${res.error ?? ''}`).toBe(true)
  return lastRevision
}

function bad(profile: Partial<Record<keyof PlayerProfile, unknown>>): unknown {
  return { ...DEFAULT_PROFILE, ...profile }
}

// =================================================================================================
// 1. THE NEW-CAREER PROFILE
// =================================================================================================
//
// MUTATION-VERIFIED: `profileShapeError` made to `return null` unconditionally -> every row of the
// table below goes red on its sentence, and the two worker arms go red on the code. Deleting the
// `if (badProfile) throw` line in the worker's `case 'new'` alone leaves the table green and reddens
// the worker arms, which is the split the two halves are here to keep.
describe('E-06 – a profile the engine will not open a career on', () => {
  /** ⚠ THE ROWS ARE THE REVIEW'S OWN PROBE, field for field ($S/probe-profile.ts and probe-profile2):
   *  `background: 'nope'` was the one that THREW – a bare `TypeError: undefined is not iterable` out
   *  of `ECONOMY.travelBgFactor[background]` inside `ensureSeason` – and every other row was
   *  ACCEPTED, ticked eight weeks and reloaded through `migrateSave` without complaint. */
  const table: { what: string; profile: unknown; says: string }[] = [
    { what: "background: 'nope'", profile: bad({ background: 'nope' }), says: 'Unknown family background: nope' },
    { what: "coachTier: 'bogus'", profile: bad({ coachTier: 'bogus' }), says: 'Unknown coach tier: bogus' },
    { what: "playStyle: 'bogus'", profile: bad({ playStyle: 'bogus' }), says: 'Unknown play style: bogus' },
    { what: "gender: 'boy'", profile: bad({ gender: 'boy' }), says: 'Unknown gender: boy' },
    { what: "country: 'zz' (lower case)", profile: bad({ country: 'zz' }), says: 'Unknown country: zz' },
    { what: 'country: 4 digits', profile: bad({ country: 'USAA' }), says: 'Unknown country: USAA' },
    // ⭐ ROUND 37 – THE ROW THE ORIGINAL PROBE COULD NOT MAKE RED. `'ZZ'` is a well-formed alpha-2
    // code and was ACCEPTED by the shape rule this gate shipped with; the owner asked for the list
    // («country проверяется на форму, а не по списку»), and the sentence did not have to change to
    // give it to him. The whole of the list behaviour is in tests/r37-playable-countries.test.ts.
    { what: "country: 'ZZ' (well-formed, not a country the game offers)", profile: bad({ country: 'ZZ' }), says: 'Unknown country: ZZ' },
    { what: 'birthMonth: 13', profile: bad({ birthMonth: 13 }), says: 'A birth month is 1 to 12' },
    { what: 'birthMonth: 0', profile: bad({ birthMonth: 0 }), says: 'A birth month is 1 to 12' },
    { what: 'birthMonth: 6.5', profile: bad({ birthMonth: 6.5 }), says: 'A birth month is 1 to 12' },
    // February is 28 here for the reason `daysInBirthMonth` gives: her birth year is not a leap year.
    { what: 'birthDay: 31 in February', profile: bad({ birthMonth: 2, birthDay: 31 }), says: 'A birth day is 1 to 28' },
    { what: 'birthDay: 31 in June', profile: bad({ birthMonth: 6, birthDay: 31 }), says: 'A birth day is 1 to 30' },
    { what: 'birthDay: 0', profile: bad({ birthDay: 0 }), says: 'A birth day is 1 to 30' },
    { what: "kidName: ''", profile: bad({ kidName: '' }), says: 'A first name is needed' },
    { what: 'kidName: three spaces', profile: bad({ kidName: '   ' }), says: 'A first name is needed' },
    { what: "kidLastName: ''", profile: bad({ kidLastName: '' }), says: 'A family name is needed' },
    // ⭐ ROUND 37 – TWENTY, AND IT WAS 200 (owner: «мы же не твиттер… например 20»). The number is
    // written out rather than interpolated on purpose: interpolating it would make this row agree
    // with the constant whatever the constant said, and the row is here to pin the SENTENCE.
    { what: 'kidName: 21 characters', profile: bad({ kidName: 'a'.repeat(21) }), says: 'A first name is at most 20 characters' },
    { what: 'kidLastName: 21 characters', profile: bad({ kidLastName: 'a'.repeat(21) }), says: 'A family name is at most 20 characters' },
    { what: 'no profile at all', profile: null, says: 'A career needs a profile' },
    { what: 'a profile that is a list', profile: [], says: 'A career needs a profile' },
  ]

  it.each(table)('$what is refused: "$says"', ({ profile, says }) => {
    expect(profileShapeError(profile)).toBe(says)
  })

  it('the shipped default, and every rung of the real coach ladder, are accepted', () => {
    expect(profileShapeError(DEFAULT_PROFILE)).toBeNull()
    // ⚠ THE DRIFT CHECK for the module-private enumeration in shared/protocol/profile.ts: a rung
    // added to `engine/coach.ts`'s COACH_TIERS and not to it would refuse a career the coach market
    // can sell. Behavioural on purpose – the list itself is deliberately not exported.
    for (const tier of COACH_TIERS) {
      expect(profileShapeError({ ...DEFAULT_PROFILE, coachTier: tier }), tier).toBeNull()
    }
    // ...and the boundary of the name cap is INSIDE, not outside.
    expect(profileShapeError({ ...DEFAULT_PROFILE, kidName: 'a'.repeat(PROFILE_NAME_MAX_CHARS) })).toBeNull()
  })

  it('⚠ the name cap is INSIDE the save-file spine\'s, so a career it opens can always be imported back', () => {
    // ⚠⚠ THIS ARM ASSERTED AN EQUALITY UNTIL 06.09 AND NOW ASSERTS AN INEQUALITY, WHICH IS A
    // DECISION AND NOT A LOOSENING. The creation cap dropped to 20 on the owner's ask; the SPINE's
    // 200 deliberately did not move, because that rule reads files written by OLDER BUILDS and a
    // career started yesterday under a forty-character name is a legitimate save that has to keep
    // loading. (`MAX_ID_CHARS` is also the `seed` and `careerId` bound – generated career ids run to
    // ~30 characters – so narrowing it would refuse the game's own files on a question that has
    // nothing to do with her name.)
    //
    // What the old equality was really protecting survives whole, and it is the direction below: a
    // name this engine will OPEN a career under is a name the import gate will still ACCEPT. That
    // holds for every cap inside 200 and would break the moment one was raised past it.
    const spine = (kidName: string) =>
      guardDeclaredShape(
        { schemaVersion: 2, seed: 's', week: 0, fundsCents: 0, profile: { kidName } },
        2,
      )
    expect(() => spine('a'.repeat(PROFILE_NAME_MAX_CHARS))).not.toThrow()
    // The longest name the wizard can now produce, and one longer than it, both still import.
    expect(() => spine('a'.repeat(PROFILE_NAME_MAX_CHARS + 1))).not.toThrow()
    // ⚠ AND THE SPINE IS STILL A GATE, at its own number: a save written by no build this game ever
    // shipped is still refused, so «it stayed at 200» does not mean «it stopped checking».
    expect(() => spine('a'.repeat(200))).not.toThrow()
    expect(() => spine('a'.repeat(201))).toThrow(/profile/)
    // ...and the one-way relationship, stated as the thing a future cap change must not break.
    expect(PROFILE_NAME_MAX_CHARS).toBeLessThanOrEqual(200)
  })

  it('the worker refuses it with the code AND the sentence, and no career is adopted', async () => {
    const res = await send({ type: 'new', seed: 'r37-bad-profile', profile: bad({ background: 'nope' }) as PlayerProfile })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('INVALID_COMMAND')
    expect(res.error).toBe('New career: Unknown family background: nope')
    // ⚠ AND `new` IS THE COMMAND THAT PERSISTS ITS PAYLOAD, so "refused" has to mean nothing was
    // written: the refusal must come before `createWorld`/`adoptAutosave`, not after.
    const snap = await send({ type: 'getSnapshot' })
    if (snap.ok) expect(snap.snapshot?.careerId).not.toContain('r37-bad-profile')
  })
})

// =================================================================================================
// 1b. ⭐⭐⭐ THE OTHER TWO PAYLOADS OF THE SAME COMMAND (A-05, the principles review 26.09; ruling 8a)
// =================================================================================================
//
// E-06 was fixed for `new.profile` on 05.09 and the three arguments added after it – v84 `trace`,
// v86 `dynasty`, v87 `weightEnabled` – followed the «rides through untouched» precedent instead. So
// the block above is a third of the command: the worker checked the profile and handed `msg.prologue`
// and `msg.dynasty` into `createWorld` unread, and the note that said the dynasty was covered was
// wrong about the one field that mattered – `createWorld` REPLACES the accepted background with
// `dynasty.background` after the check has run.
//
// The two rows below are A-05's own measured payloads. `spentCents: NaN` birthed a career with
// `fundsCents = NaN` that survived four ticks, was written as `null` by the autosave codec and whose
// own export file the import gate then REFUSED; `dynasty.background: 'bogus'` was a bare `TypeError`.
// Both now answer with a sentence and a code, like the profile's seven.
//
// ⚠ THE SENTENCES ARE READ OFF THE EXPORTED CONSTANTS AND NEVER TRANSCRIBED – they are DRAFTS for his
// pass (invariant 4), tabled in docs/plans/principles-fix-strings-2026-09.md and pinned both ways by
// tests/principles-fix-strings-roundtrip.test.ts, so a re-wording moves the doc and the code together
// and leaves these two rows alone.
//
// ⚠ MUTATION-VERIFIED: deleting either `if (bad…) throw` line in the worker's `case 'new'` reddens
// its row here on `ok` (the malformed career is ACCEPTED), while the validators' own tables in
// tests/prologue-handover.test.ts stay green – which is the same split the profile's note above
// describes, and the reason both halves exist.
describe('A-05 – a childhood or an inheritance the engine will not open a career on', () => {
  it('the worker refuses a NaN childhood spend with the code AND the sentence, and adopts nothing', async () => {
    const res = await send({
      type: 'new',
      seed: 'a05-bad-prologue',
      profile: DEFAULT_PROFILE,
      prologue: { years: [], spentCents: Number.NaN } as unknown as PrologueHandover,
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('INVALID_COMMAND')
    expect(res.error).toBe(`New career: ${PROLOGUE_HANDOVER_REFUSAL}`)
    const snap = await send({ type: 'getSnapshot' })
    if (snap.ok) expect(snap.snapshot?.careerId).not.toContain('a05-bad-prologue')
  })

  it('the worker refuses an unknown inherited background the same way', async () => {
    const res = await send({
      type: 'new',
      seed: 'a05-bad-dynasty',
      profile: DEFAULT_PROFILE,
      dynasty: dynastyOf({ background: 'bogus' as never }),
    })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('INVALID_COMMAND')
    expect(res.error).toBe(`New career: ${DYNASTY_HANDOVER_REFUSAL}`)
    const snap = await send({ type: 'getSnapshot' })
    if (snap.ok) expect(snap.snapshot?.careerId).not.toContain('a05-bad-dynasty')
  })

  // ⚠ AND THE CONTROL, WITHOUT WHICH THE TWO ABOVE ARE SATISFIED BY A WORKER THAT REFUSES EVERY `new`.
  // A real inheritance – the shape `dynastyHandoverOf` produces and the ending screen offers – opens a
  // career, and the childhood the cards produce rides beside it.
  it('⚠ ...and a real handover still opens a career, which is what makes the refusals refusals', async () => {
    const res = await send({
      type: 'new',
      seed: 'a05-good-handover',
      profile: DEFAULT_PROFILE,
      prologue: { years: [], spentCents: 0 },
      dynasty: dynastyOf(),
    })
    expect(res.ok, res.error).toBe(true)
    expect(res.snapshot?.week).toBe(0)
  })
})

// =================================================================================================
// 2. THE WEEK COUNT
// =================================================================================================
//
// MUTATION-VERIFIED: `guardWeeks` emptied (`function guardWeeks(): void {}`) -> all four rows red on
// the code; the bound relaxed to `weeks >= 0` -> the 0 row red alone; `Number.isInteger` dropped ->
// the 1.5 and NaN rows red.
describe('E-06 – a week count outside the span the game moves in', () => {
  const refusal = 'Time moves 1 to 52 whole weeks at a time'

  beforeAll(async () => {
    await openCareer('r37-weeks')
  })

  // `NaN` is the row with teeth: it ran ZERO ticks and still committed a revision, i.e. an autosave
  // and a fresh snapshot for a world that had not moved. 1.5 ran `ceil(1.5)` = two weeks of her life
  // for a command that asked for one and a half.
  const spans: { what: string; weeks: number }[] = [
    { what: 'zero weeks', weeks: 0 },
    { what: 'a negative span', weeks: -4 },
    { what: 'a fraction', weeks: 1.5 },
    { what: 'NaN', weeks: Number.NaN },
    { what: 'more than a year', weeks: 53 },
    { what: 'Infinity', weeks: Number.POSITIVE_INFINITY },
  ]

  it.each(spans)('tick refuses $what with the code and the sentence', async ({ weeks }) => {
    const before = lastRevision
    const res = await send({ type: 'tick', weeks, baseRevision: before })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('INVALID_COMMAND')
    expect(res.error).toBe(refusal)
    // Nothing was committed: a refused span must not leave a revision behind it.
    expect(lastRevision).toBe(before)
  })

  it.each(spans)('advance refuses $what with the code and the sentence', async ({ weeks }) => {
    const before = lastRevision
    const res = await send({ type: 'advance', weeks, baseRevision: before })
    expect(res.ok).toBe(false)
    expect(res.code).toBe('INVALID_COMMAND')
    expect(res.error).toBe(refusal)
    expect(lastRevision).toBe(before)
  })

  it('the spans the app really asks for still run: one week, four, and the dev fast-forward\'s 52', async () => {
    for (const weeks of [1, 4, 52]) {
      const res = await send({ type: 'advance', weeks, baseRevision: lastRevision })
      expect(res.ok, `advance ${weeks}: ${res.error ?? ''}`).toBe(true)
    }
  })
})

// =================================================================================================
// 3. THE SAVE NAME
// =================================================================================================
//
// MUTATION-VERIFIED: the `sanitizeName(name) === ''` guard deleted from `writeNamed` -> the first
// arm red ("!!!: expected true to be false" – the write went through). The second arm is the
// CONTROL and stays green under that mutation on purpose: it is what proves the guard refuses only
// the names the sanitiser cannot keep, and leaves two real names as two real slots.
describe('E-06 – a save name the sanitiser cannot keep', () => {
  const refusal = 'A save name needs at least one letter or number'

  beforeAll(async () => {
    await openCareer('r37-names')
  })

  it('is refused with the code and the sentence', async () => {
    // Both of these sanitise to '' and would therefore address the SAME slot, `manual:<careerId>:`.
    for (const name of ['!!!', '   ', 'привет']) {
      expect(sanitizeName(name), `${name} really is unsanitisable`).toBe('')
      const res = await send({ type: 'saveNamed', name })
      expect(res.ok, name).toBe(false)
      expect(res.code, name).toBe('INVALID_COMMAND')
      expect(res.error, name).toBe(refusal)
    }
  })

  it('two names that DO survive the sanitiser are still two slots', async () => {
    const first = await send({ type: 'saveNamed', name: 'Wimbledon 2031' })
    expect(first.ok, first.error ?? '').toBe(true)
    const second = await send({ type: 'saveNamed', name: 'Before the fork' })
    expect(second.ok, second.error ?? '').toBe(true)
    const named = (second.slots ?? []).filter((s) => (s as { slot: string }).slot.startsWith('manual:'))
    expect(named.length).toBeGreaterThanOrEqual(2)
  })
})

// A quiet world for the sanity check below – no open decision, so nothing else can explain a refusal.
function quietCareer(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  return world
}

describe('E-06 – the guards are guards and not a new failure mode', () => {
  it('a career built straight from the default profile still opens and ticks', () => {
    const world = quietCareer('r37-control')
    expect(world.week).toBe(4)
    expect(profileShapeError(world.profile)).toBeNull()
  })
})
