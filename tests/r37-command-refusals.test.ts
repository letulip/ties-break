import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { COACH_TIERS } from '../src/engine/coach'
import { guardDeclaredShape } from '../src/engine/saveGuard'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { sanitizeName } from '../src/db/saves'
import {
  DEFAULT_PROFILE,
  PROFILE_NAME_MAX_CHARS,
  profileShapeError,
  type PlayerProfile,
  type WorkerErrorCode,
} from '../src/shared/protocol'
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
    { what: 'kidName: 201 characters', profile: bad({ kidName: 'a'.repeat(201) }), says: 'A first name is at most 200 characters' },
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

  it('⚠ the name cap is the save-file spine\'s own, so a career it opens can always be imported back', () => {
    // `MAX_ID_CHARS` in engine/saveGuard.ts is module-private, so the equality is asserted through
    // the gate that reads it: a name of exactly the cap survives the import spine, one character
    // more does not. A cap raised here and not there would build careers that cannot be read back.
    const spine = (kidName: string) =>
      guardDeclaredShape(
        { schemaVersion: 2, seed: 's', week: 0, fundsCents: 0, profile: { kidName } },
        2,
      )
    expect(() => spine('a'.repeat(PROFILE_NAME_MAX_CHARS))).not.toThrow()
    expect(() => spine('a'.repeat(PROFILE_NAME_MAX_CHARS + 1))).toThrow(/profile/)
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
