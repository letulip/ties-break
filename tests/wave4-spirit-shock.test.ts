// =================================================================================================
// WAVE 4, T1 – IT ENDS: THE v75 SCHEMA MOVE, AND THE TWO FIELDS IT CARRIES
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T1, design `docs/plans/the-private-life-build.md`
// §5 step 4. T1 ships TWO seats and deliberately no writer for either: `world.spiritShock` (the mark
// an ending leaves on her – `rollEnds` is T2 and the shock itself is T3) and `WorldEvent.lifeKind?`
// (the feed's life-row discriminator – the two write sites are T5's). So every assertion below is
// about a SHAPE and about what the migration does and does not do to an old save; nothing here
// exercises a behaviour, because the step has none, and that is the claim rather than a shortfall.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence, because this step raises none
// (invariant 4) – the strings are T6's and land through the architect's read.
//
// ⚠⚠ THE TWO FIELDS ARE NOT SYMMETRICAL AND THE FILE IS SHAPED AROUND THAT. `spiritShock` is a WORLD
// key and is back-filled, so it gets the three-part move's full ledger (A). `lifeKind` is an OPTIONAL
// field on a feed ROW and is deliberately NOT back-filled, so what it gets is the pair of assertions
// that a non-back-fill actually needs (B): the migration must not INVENT a stamp, and it must not
// STRIP one. Both directions are asserted because only asserting one of them would leave a migration
// free to fail in the other.
//
// ⚠⚠ EVERY ARM IS RECORDED, the wave-2/wave-3 duty kept verbatim – a net nobody watched fail proves
// nothing, so what was broken and what went red is written down here rather than in a commit message
// nobody re-reads. All five were RUN against this file, red, and re-edited back by hand:
//
//   ARM 1  the v74 -> v75 step's `??=` written as `=`         1 RED – «is idempotent, and never
//          overwrites a shock a save already has»: expected `null` to equal `{week: 300, …}`
//   ARM 2  the v74 -> v75 step deleted entirely               6 RED – every case that walks the
//          ladder throws «Save schema 74 is newer than supported 75»
//   ARM 3  the step back-fills `'met'` onto every `'life'`    1 RED – «invents no stamp on an old
//          row (`e.lifeKind ??= 'met'`)                            row»: `'lifeKind' in row` was true
//   ARM 4  the step strips the field (`delete e.lifeKind`)    1 RED – «keeps a stamp a row already
//                                                                  carries»: expected undefined to be 'met'
//   ARM 5  `spiritShock` hand-edited in the golden fixture    2 RED – «ships a golden fixture of its
//          from `null` to `{week: 1, kind: 'breakup'}`              own shape» AND «the fixture is the
//                                                                  real migration's own output»
//
// ⚠ ARM 5 WENT RED TWICE AND THE LEDGER SAYS SO RATHER THAN ROUNDING IT DOWN – it was predicted as
// one. Both cases read the file, and that pair is the honest shape: the shape case catches an edit
// that puts a wrong VALUE in the fixture, the equality case catches one that puts a value there the
// migration would never have written. A single red would have meant one of the two was redundant.
//
// ⚠ AND THE SIXTH ARM LIVES IN ANOTHER FILE, named here so this ledger is not read as the whole of
// what was watched: dropping the `spiritShock` peel from `careerHashAtSchema`
// (tests/coachTravelEdgeFixtures.ts) takes **13 RED** across every rollback rung in
// tests/coach-travel-edge.test.ts, the new v75 case among them. Its record is in that file's own
// header block, where the constants it guards are.
//
// ⚠⚠ AND ARM 1 IS WHY THIS LEDGER IS RUN AND NOT REASONED – wave 3's T1 recorded exactly this trap
// one rung down and it is re-armed here rather than re-discovered. `migrateSave` MUTATES ITS PAYLOAD
// IN PLACE, so an idempotency line that compares the result with the very field the step just
// replaced compares a thing with itself and stays green under the mutation. The expected value is
// therefore frozen in a separate object BEFORE the call and the payload handed over is a deep copy.
// =================================================================================================
// WAVE 4, T3 – THE SHOCK, AND THE LIFT'S EXIT (sections C, D, E – 12.09)
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T3 and `docs/plans/life-wave-4-rulings-2026-09.md`
// rulings C and D, constants from `docs/specs/who-she-is-2026-09.md` §4's spirit-physics table.
// T1's own ledger stays above, untouched; this is the step that gives both of its fields writers.
//
// ⚠⚠ EVERY NUMBER IN C AND D IS WRITTEN AS A LITERAL, AND THAT IS THE WHOLE DEFENCE OF THE FILE
// RATHER THAN A STYLE. One task ago, T2's corridor built its `predicted` side out of `endsHazardFor`
// – the very function the mutation moved – so both sides moved together and the arm stayed green on
// all four arms; the «an equality comparing two arms to each other is invisible to a mutation that
// moves both» family, third recorded instance in this layer. The temptation here is exact: an
// expectation written `70 - ECONOMY.spirit.shock.breakup.steady` or a clear bar written
// `s.baseline - s.shockClearWithin` would follow the constant wherever a mutation put it. So the
// shock rows are asserted as **48 / 38** (from a lifted 75) and **48 / 36** (from a flat 70), the
// clear bar is asserted as **68**, and the table itself is pinned at **−22 / −34**. The only
// arithmetic below that reads a constant is the one that PROVES the two spellings agree.
//
// ⚠⚠ THE ARM LEDGER FOR C, D AND E – every net below was WATCHED FAIL and the count is MEASURED.
// Control green FIRST (139 passed over this file, tests/spirit.test.ts and tests/wave4-ends.test.ts);
// every arm re-edited back BY HAND, never `git checkout`; all four touched files' md5s checked back
// to pristine afterwards. **No arm came in at 0 RED, so there is no null arm to declare.**
//
//   ARM A  `ECONOMY.spirit.shock.breakup` -> `{steady: -2, intense: -3}`      9 RED
//   ARM B  the shock term moved INSIDE `weekPerturbation` (ruling C's         6 RED
//          double-scale – the row added there and the summand removed)
//   ARM C  the clear bar read against the EFFECTIVE baseline                  3 RED
//          (`s.baseline + s.attachmentLift - …`, ruling D)
//   ARM D  the clear check hoisted ABOVE the `world.spirit` write             4 RED
//   ARM E  `rollEnds` stamping `{week: world.week + 1, …}`                    8 RED
//   ARM F  the shock applied on EVERY live week, not only its own             3 RED
//   ARM G  `rollEnds` not stamping the mark at all (T3's own absence)         9 RED
//   ARM H  a `spiritShock` reader invented in `shared/avatarEmotion.ts`       2 RED
//
// ⚠ ARM C IS THE ENTRY WORTH READING, because one of its three reds is NOT this wave's net: wave 3's
// «attachmentLift is read ONCE – in accrueSpirit's return TARGET – and nowhere else» went red too.
// That guard was written to refuse a SECOND reader of the lift, and reading the lift into the clear
// bar is exactly that – so ruling D is enforced twice over by two waves' pins that were never written
// with each other in mind, which is the cheapest kind of confirmation there is.
//
// ⚠ ARM H IS A MUTATION OF A FILE THIS COMMIT DOES NOT TOUCH, on purpose. §E's last case is a FINDING
// («the wave-2 collision rule does not exist on this tree»), and a finding written as a pin is worth
// nothing unless the pin can fail – so the rule was half-built in `shared/avatarEmotion.ts` and the
// two cases that should have noticed did.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { accrueSpirit, spiritBandOf, temperamentIntensity, MOOD_WORD, TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
import { createWorld, rollEnds, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { idleRead } from '../src/shared/avatarEmotion'
import { ECONOMY } from '../src/engine/economy'
import { isBlackoutWeek } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'
import { migrateSave } from '../src/engine/migrations'
import type { LoveEpisode, WorldEvent } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const SRC = fileURLToPath(new URL('../src/', import.meta.url))

/** A fresh deep copy of the v74 golden save every time – `migrateSave` mutates in place, so a shared
 *  payload would let one case decide what the next one sees. */
const v74 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v74.json`, 'utf8'))

/** A wave-3 career's own feed row, in the shape `deliverKnownPartner` writes it (`world/ledger.ts`
 *  `addEvent`, no `amountCents` – a life beat is never a purchase). The golden corpus holds no `'life'`
 *  row of its own: v74.json was produced by migrating a save older than the layer, so a row of this
 *  kind has to be placed here for B's assertions to have a target at all. */
function lifeRow(id: number, lifeKind?: 'met'): WorldEvent {
  return { id, week: 300, type: 'life', text: 'There is someone.', keep: true, ...(lifeKind ? { lifeKind } : {}) }
}

// -------------------------------------------------------------------------------------------------
// T3's FIXTURES – a real ending, on a week that is nothing else
// -------------------------------------------------------------------------------------------------

/** Source with every comment removed, `tests/spirit.test.ts`'s own helper verbatim: a pin that reads
 *  prose is a pin the next writer repairs by deleting a sentence. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – for §E's whole-tree pins. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** A row of the v74 shape, still open. */
function episode(sinceWeek: number): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek, wants: 'open', partnerId: `p:${sinceWeek}` }
}

/** Does `week` fire NO row of the perturbation table for this girl? `tests/spirit.test.ts`'s `quiet`,
 *  restated here for the same reason: every expectation below is a LITERAL, so the week it is read on
 *  has to be one where the shock is the only thing that happened. */
function quietWeek(world: WorldState, w: number): boolean {
  const over = schoolIsOver(w, world.profile.birthMonth)
  return !isBlackoutWeek(w, over) && birthdayTurning(w, world.profile.birthMonth, world.profile.birthDay) === null
}

/**
 * A career whose romance ENDS, through the hazard's own path, on the first week of a `run`-week
 * stretch that fires no other perturbation row.
 *
 * ⚠⚠ THE ENDING IS THE ENGINE'S AND NEVER THIS FILE'S. A hand-written `{week, kind}` would let every
 * case below pass against a `rollEnds` that had stopped writing the mark at all – the two halves of
 * T3 would each be tested against the other's absence. So the roll is walked (with the episode reset
 * between attempts, so what is measured is the HAZARD and not the slot emptying once) until its own
 * dice fire, and the search throws rather than returning a career that never ended.
 *
 * ⚠ AND THE QUIET RUN IS WHY THE RECOVERY TRACE IS READABLE. The return rule is the recovery, so the
 * weeks after the shock must carry nothing else – an exam fortnight or a birthday inside the window
 * would be perfectly correct engine behaviour and would make a literal expectation a lie about what
 * it was measuring.
 */
function endsOnAQuietRun(temperament: Temperament, run = 24): { world: WorldState; week: number } {
  for (let s = 0; s < 400; s++) {
    const world = createWorld(`t3-shock-${temperament}-${s}`)
    world.temperament = temperament
    for (let w = 300; w < 900; w++) {
      let clear = true
      for (let k = 0; k < run; k++) if (!quietWeek(world, w + k)) { clear = false; break }
      if (!clear) continue
      world.week = w
      world.loveEpisodes = [episode(200)]
      world.spiritShock = null
      rollEnds(world)
      if (world.loveEpisodes[0].endedWeek !== null) return { world, week: w }
    }
  }
  throw new Error(`no ending on a quiet run for ${temperament}`)
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v75's own rung
// =================================================================================================
describe('wave 4 T1 A – v75, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(75)
    const v75 = JSON.parse(readFileSync(`${SAVES}/v75.json`, 'utf8'))
    expect(v75.schemaVersion).toBe(75)
    // ⚠ `toBeNull` rather than `toBeUndefined`, and the difference is the whole shape: the key must be
    // PRESENT and null, because an absent key is the v74 shape and would migrate again on every load.
    expect('spiritShock' in v75, 'the fixture carries the key this version added').toBe(true)
    expect(v75.spiritShock, 'and carries it empty, which is what a career with nothing behind it means')
      .toBeNull()
  })

  it('⭐⭐ back-fills a NULL shock, which is exactly true rather than a bargain with a pruned log', () => {
    const before = v74()
    expect(before.spiritShock, 'the older shape genuinely has no such key').toBeUndefined()
    const migrated = migrateSave(v74())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ A career that predates the layer carries no live shock, because nothing in its past could
    // have shocked her – v74's own claim one rung down, and it is the TRUE value rather than a
    // placeholder for one.
    expect(migrated.spiritShock).toBeNull()
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here
    // (ARM 5). ⚠ This line is the one the NEXT wave will have to re-aim, exactly as this wave re-aimed
    // v74's and wave 3 re-aimed v73's: `migrateSave` always walks to the LADDER'S HEAD, so the direct
    // equality holds only while 75 IS the head. The re-aim is the converging form, not a deletion.
    expect(JSON.parse(readFileSync(`${SAVES}/v75.json`, 'utf8'))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a shock a save already has', () => {
    const once = migrateSave(v74())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // The `??=` said out loud: a save already carrying a live shock keeps it. T3 will produce exactly
    // this shape on a live career, and a second load must not wipe the mark off a girl who is still
    // under her line.
    //
    // ⚠⚠ THE EXPECTED VALUE IS A SEPARATE OBJECT, AND THAT IS THE WHOLE ASSERTION RATHER THAN A
    // TIDINESS – wave 3's ARM 4, re-armed here rather than re-discovered. `migrateSave` MUTATES THE
    // PAYLOAD IN PLACE, so `expect(migrateSave(lived).spiritShock).toEqual(lived.spiritShock)` compares
    // the result with ITSELF: a step written `=` instead of `??=` replaces the value on `lived` and
    // both sides move together, green. The expected shock is therefore frozen in `kept` before the
    // call, and the payload handed over is a deep copy.
    const kept = { week: 300, kind: 'breakup' as const }
    const lived = { ...v74(), schemaVersion: 74, spiritShock: JSON.parse(JSON.stringify(kept)) }
    expect(migrateSave(lived).spiritShock, 'a shock already on the record is kept whole').toEqual(kept)
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes one literal and reaches no sub-stream at all, so
    // the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched by construction
    // rather than by measurement. This asserts the construction.
    const before = JSON.stringify(v74().rngMain)
    expect(JSON.stringify(migrateSave(v74()).rngMain)).toBe(before)
  })

  it('every older fixture reaches v75 carrying the key', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this asks
    // the one question that is about THIS step – the key is PRESENT on all of them, however old, so no
    // reader downstream needs an `undefined` branch beside its `null` one. ⚠ `in` rather than a value
    // check, deliberately: `spiritShock === null` would pass on an absent key too, and «absent» is the
    // exact shape this step exists to abolish.
    for (const v of [0, 25, 35, 60, 70, 72, 73, 74]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8')))
      expect('spiritShock' in migrated, `v${v}.json`).toBe(true)
      expect(migrated.spiritShock, `v${v}.json`).toBeNull()
    }
  }, 30_000)
})

// =================================================================================================
// B. `WorldEvent.lifeKind?` – OPTIONAL, ADDITIVE, AND OWED NO BACK-FILL
// =================================================================================================
describe('wave 4 T1 B – the life-row discriminator, and the back-fill that is deliberately absent', () => {
  it('⭐⭐ invents no stamp on an old row – the migration leaves a `life` row exactly as it found it', () => {
    // ⚠⚠ THE TARGET IS PROVED TO EXIST BEFORE IT IS ASSERTED ABSENT, which is the whole reason this
    // case is shaped this way. «No row carries a stamp» is trivially true of a payload with no `'life'`
    // rows in it at all, and v74.json is exactly such a payload – it was produced by migrating a save
    // older than the layer, so its 401 events hold not one `'life'` row. A negative assertion over
    // nothing is the emptiest kind of green there is.
    const payload = v74()
    const events = payload.events as WorldEvent[]
    payload.events = [...events, lifeRow(9001), lifeRow(9002)]
    const before = (payload.events as WorldEvent[]).filter((e) => e.type === 'life')
    expect(before.length, 'the rows this case is about are really in the payload').toBe(2)
    expect(before.every((e) => !('lifeKind' in e)), 'and they really start unstamped').toBe(true)

    const rows = migrateSave(payload).events.filter((e) => e.type === 'life')
    expect(rows.length, 'both rows survive the ladder').toBe(2)
    for (const row of rows) {
      // ⚠ `in` rather than `=== undefined`: the claim is that the KEY was never written, and a key
      // written as `undefined` would pass a value check while changing the shape a save serialises to.
      expect('lifeKind' in row, 'the migration invented no discriminator').toBe(false)
    }
    // ⚠ AND THIS IS WHAT KEEPS THE FEED HONEST RATHER THAN A TIDINESS POINT. The glyph column reads
    // `lifeKind ?? 'met'` (components/screens/lifeRowGlyphs.ts, T5), so an unstamped row keeps its 🤍;
    // a migration that guessed `'met'` onto every old `'life'` row would be re-deriving a fact from
    // prose and calling the guess a record, which is what v70's draw back-fill refused for the same
    // reason. Some of those rows will be ENDINGS once T2 ships, and nothing in an old save can say so.
  })

  it('⭐⭐ keeps a stamp a row already carries, whole and unchanged', () => {
    // The other direction, and it needs asserting separately: «does not invent» and «does not strip»
    // are two different failures and a migration is free to have either. T5 writes this field, so a
    // save written from that version on arrives here already stamped and must come out the far side
    // identical.
    //
    // ⚠⚠ THE EXPECTED VALUE IS HELD IN A COPY THE CODE UNDER TEST CANNOT REACH – A's ARM-1 lesson
    // applied to a row rather than to a world key. `migrateSave` mutates the payload in place, so an
    // assertion that read the expected stamp back off `payload.events` would be reading whatever the
    // step left there.
    const payload = v74()
    payload.events = [...(payload.events as WorldEvent[]), lifeRow(9001, 'met')]
    const expected = JSON.parse(JSON.stringify(lifeRow(9001, 'met'))) as WorldEvent
    expect(expected.lifeKind, 'the control really carries the stamp').toBe('met')

    const row = migrateSave(payload).events.find((e) => e.id === 9001)
    expect(row, 'the row survives the ladder').toBeDefined()
    expect(row).toEqual(expected)
  })

  it('⚠ is OPTIONAL on the wire, and the compiler is the reader of that claim', () => {
    // ⚠ A COMPILE SHAPE STATED AT RUNTIME, and it is labelled as one rather than dressed up as a net:
    // «`lifeKind` may be omitted» is a property `vue-tsc` checks in `npm run check`, and no runtime
    // mutation of the migration can make this line fail. It is here because a reader who is not a
    // compiler still needs to see the claim written down – the same division of labour
    // `LifeRowGlyphs`' own note describes for its empty-or-total gate.
    const unstamped: WorldEvent = { id: 1, week: 0, type: 'life', text: 'x' }
    const stamped: WorldEvent = { ...unstamped, lifeKind: 'met' }
    expect(unstamped.lifeKind).toBeUndefined()
    expect(stamped.lifeKind).toBe('met')
  })
})

// =================================================================================================
// C. THE SHOCK – −22 / −34, ON THE WEEK IT ENDED, AND **AFTER** THE SCALE (ruling C)
// =================================================================================================
//
// ⚠ THE EIGHT ARMS AND THEIR MEASURED COUNTS ARE IN THIS FILE'S HEADER, above the imports, beside
// T1's own five – one ledger per file rather than one per section.
describe('wave 4 T3 C – what an ending costs her', () => {
  it('⭐⭐ from a LIFTED 75 she lands on 48 steady and 38 intense – the literal week, the literal numbers', () => {
    // ⚠⚠ EVERY NUMBER HERE IS TYPED OUT. 75 is the lifted baseline (70 + 5); the ending frees the slot,
    // so `accrueSpirit`'s target is the FLAT 70 again and the return runs first: a steady girl walks
    // 75 -> 70 (5/wk) and an intense one 75 -> 72 (3/wk), and THEN the week's shock lands on top.
    //   steady   70 − 22 = 48
    //   intense  72 − 34 = 38
    // Written as 48 and 38 rather than as `70 - ECONOMY.spirit.shock.breakup.steady`, which is the
    // shape that stayed green on all four arms one task ago because both sides moved together.
    const landed: Record<string, number> = {}
    for (const t of TEMPERAMENTS) {
      const { world, week } = endsOnAQuietRun(t)
      expect(world.spiritShock, `${t}: the hazard stamped the mark on the week it ended`)
        .toEqual({ week, kind: 'breakup' })
      world.spirit = 75
      accrueSpirit(world)
      landed[t] = world.spirit
    }
    expect(landed.sunny, 'sunny is steady').toBe(48)
    expect(landed.quiet, 'quiet is steady – the same two numbers, because it is the INTENSITY axis').toBe(48)
    expect(landed.fiery, 'fiery is intense').toBe(38)
    expect(landed.deep, 'deep is intense').toBe(38)
  }, 60_000)

  it('⚠⚠ RULING C: it is added AFTER the scale, never through it – a flat 70 lands on 48 and 36', () => {
    // ⚠⚠ THE DISCRIMINATING CASE FOR THE WHOLE RULING, and it needs the FLAT baseline to be readable:
    // from 70 with nobody there the return moves nothing, so the week's only arithmetic is the shock.
    //
    //   as built (added after the scale)      70 − 22 = 48   ·   70 − 34 = 36
    //   through `weekPerturbation` instead    70 − 22×0.8 = 52.4   ·   70 − 34×1.25 = 27.5
    //
    // §4's −22 / −34 are ALREADY intensity-scaled – one base of about −27.5 seen through ×0.8 and
    // ×1.25 – so the second multiplication is the defect, and these four numbers are what tells the
    // two apart. The structural half of the same claim (no `.shock` anywhere inside
    // `weekPerturbation`) is in tests/spirit.test.ts, beside `attachmentLift`'s own guard.
    for (const t of TEMPERAMENTS) {
      const { world } = endsOnAQuietRun(t)
      world.spirit = 70
      accrueSpirit(world)
      const intense = temperamentIntensity(t) === 'intense'
      expect(world.spirit, `${t}: the shock is not scaled a second time (that would read ${intense ? 27.5 : 52.4})`)
        .toBe(intense ? 36 : 48)
    }
  }, 60_000)

  it('⚠ the table is §4\'s own two numbers, and the −27.5 base is a reconstruction rather than the row', () => {
    // The LITERAL table pin – ruling E's lesson from T2 applied one field over: a corridor built out
    // of the constant cannot see the constant move, so the values are written out here.
    expect(ECONOMY.spirit.shock.breakup).toEqual({ steady: -22, intense: -34 })
    // ...and the reconstruction the comment carries, checked as a RELATION so the prose cannot rot:
    // one base of about −27.5 seen through the two perturbation scales. ⚠ It is deliberately a
    // tolerance and not an equality – §4's −34 wins on drift over the derived −34.375, which is the
    // single-source rule and the reason this line does not assert `-27.5 * 1.25`.
    const scale = ECONOMY.spirit.perturbationScale
    expect(ECONOMY.spirit.shock.breakup.steady / scale.steady).toBeCloseTo(-27.5, 1)
    expect(ECONOMY.spirit.shock.breakup.intense / scale.intense).toBeCloseTo(-27.2, 1)
    expect(ECONOMY.spirit.shock.breakup.intense, '−34 and never the derived −34.375').toBe(-34)
  })

  it('⚠⚠ it lands ONCE, on its own week – the week after costs her nothing but the return', () => {
    // ⚠ THE MARK OUTLIVES THE DELTA BY DESIGN, so «is a shock live» and «is the shock landing now» are
    // two questions and only the second one moves a point. A reader that applied the delta while the
    // mark was merely non-null would take −22 every week until she recovered, which is a spiral rather
    // than a break-up: from 48 the next steady week must read 53 (the return, +5) and nothing else.
    const { world } = endsOnAQuietRun('sunny')
    world.spirit = 75
    accrueSpirit(world)
    expect(world.spirit, 'the ending week').toBe(48)
    expect(world.spiritShock, 'and the mark is still live – she is nowhere near back').not.toBeNull()
    world.week += 1
    accrueSpirit(world)
    expect(world.spirit, 'the NEXT week is the return rule alone – 48 + 5, not 48 + 5 − 22').toBe(53)
  }, 60_000)

  it('⚠ bond is untouched by the shock – parent-decision-only, in this wave as in every other', () => {
    // §4a.2, restated where it could be broken cheaply: an ending is not a decision, and a bond line
    // in `accrueSpirit`'s shock term would be scope the owner did not ask for.
    const { world } = endsOnAQuietRun('fiery')
    world.spirit = 75
    world.bond = 64
    accrueSpirit(world)
    expect(world.spirit, 'she takes the shock').toBe(38)
    // ⚠ The 0.5/week regression toward 70 is the STANDING weekly rule and fires on every tick; what is
    // asserted is that the ending added nothing to it. 64 + 0.5 = 64.5 and not one half-point more.
    expect(world.bond, 'and the standing regresses by its own half point, with nothing added').toBe(64.5)
  }, 60_000)
})

// =================================================================================================
// D. THE CLEAR BAR – 68, THE PLAIN BASELINE, AND NEVER ON ITS OWN TICK (ruling D)
// =================================================================================================
describe('wave 4 T3 D – when the mark comes off', () => {
  it('⭐ the bar is 68, and both spellings of it agree', () => {
    // The literal, and then the relation that ties the literal to the constants – in that order, so a
    // mutation that moves either constant is red HERE rather than three cases further down.
    expect(ECONOMY.spirit.baseline - ECONOMY.spirit.shockClearWithin, 'two points under her own 70').toBe(68)
    expect(ECONOMY.spirit.shockClearWithin).toBe(2)
    // ⚠ AND IT IS NOT 73, WHICH IS RULING D IN ONE LINE. The effective baseline while a new attachment
    // is live is 75, and a bar read there would be 73 – held OPEN LONGER because a new romance had
    // arrived, which reads backwards on screen.
    expect(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift - ECONOMY.spirit.shockClearWithin)
      .toBe(73)
  })

  it('⚠⚠ it CANNOT self-clear on the tick that sets it – a TESTED property, not an arithmetic assumption', () => {
    // ⚠⚠ THE ARCHITECT'S OWN INSTRUCTION (ruling D): «from a lifted 75 a steady girl lands 70 − 22 = 48
    // and an intense one 72 − 34 = 38, both far under 68 – but the lift and both shock constants are
    // tunable, so the net belongs in the test file, armed, and not in a comment.» This is that net.
    // It also refuses the other way the property dies: a clear check hoisted ABOVE the spirit write
    // would judge the week on the spirit the shock replaced (75, or 70 after the return) and take the
    // mark off on the very tick that stamped it.
    for (const t of TEMPERAMENTS) {
      const { world, week } = endsOnAQuietRun(t)
      world.spirit = 75
      accrueSpirit(world)
      expect(world.spiritShock, `${t}: the mark survives its own setting tick`).toEqual({ week, kind: 'breakup' })
      expect(world.spirit, `${t}: and it is a long way under 68`).toBeLessThan(68)
    }
  }, 60_000)

  it('⭐⭐ the walk back is the standing return and NOTHING else – the whole trace, per intensity', () => {
    // ⚠⚠ THE RECOVERY SHAPE AS A LITERAL LADDER, because «no special curve» is a negative and a
    // negative needs a shape to be visible against. From a lifted 75, on weeks that fire no other row:
    //
    //   steady   48 53 58 63 68 70 70 …   back at +5, mark off at +4, 2 weeks under the knee
    //   intense  38 41 44 47 50 53 56 59 62 65 68 70 …   back at +11, mark off at +10, 7 under
    //
    // Those are the return rate (5/wk and 3/wk) walking to a target of 70, and nothing in the engine
    // reads the word «recovering». Measured against who-she-is §4's prediction: «~1–2 weeks under the
    // knee steady, ~6–7 intense» and «back ~week 5 / ~week 12». The knee counts HIT (2 and 7, counting
    // the weeks after the shock week); steady's return is exactly 5; intense's is **11, one week
    // earlier than the ~12 §4 predicts** – recorded here rather than rounded, and T7's bench is where
    // the distribution is argued.
    const TRACE: Record<'steady' | 'intense', number[]> = {
      steady: [48, 53, 58, 63, 68, 70, 70, 70, 70, 70, 70, 70],
      intense: [38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 70],
    }
    const CLEARS_AT = { steady: 4, intense: 10 }
    for (const t of TEMPERAMENTS) {
      const { world, week } = endsOnAQuietRun(t)
      const intensity = temperamentIntensity(t)
      world.spirit = 75
      const trace: number[] = []
      const live: boolean[] = []
      for (let k = 0; k < TRACE[intensity].length; k++) {
        world.week = week + k
        accrueSpirit(world)
        trace.push(world.spirit)
        live.push(world.spiritShock !== null)
      }
      expect(trace, `${t}: the ladder is the return rule's own`).toEqual(TRACE[intensity])
      // ⚠ AND THE MARK IS LIVE ON EXACTLY THE WEEKS SHE IS UNDER 68 – the bar restated as a property
      // over the whole walk rather than as one boundary case, so an off-by-one in either direction is
      // red. `>= 68` clears, `67.9` does not.
      expect(live, `${t}: live on exactly the weeks under 68`).toEqual(trace.map((v) => v < 68))
      expect(live.indexOf(false), `${t}: the first week the mark is off`).toBe(CLEARS_AT[intensity])
      expect(trace.filter((v) => v < 60).length - 1, `${t}: weeks under the knee, after the shock week`)
        .toBe(intensity === 'steady' ? 2 : 7)
      expect(trace.indexOf(70), `${t}: back at her own baseline`).toBe(intensity === 'steady' ? 5 : 11)
    }
  }, 60_000)

  it('⚠⚠ RULING D: the bar is her OWN baseline even while somebody new is there', () => {
    // ⚠⚠ THE CASE THE RULING EXISTS FOR, and it is the one a mutation to `s.baseline + s.attachmentLift`
    // can be caught by – every other case in this file has an empty slot, where the two readings agree.
    //
    // She is carrying a mark from an OLD week (so no delta lands this tick) and somebody new has
    // arrived, so the effective baseline is 75 and the effective bar would be 73. Her spirit returns
    // 64.5 -> 69.5, which is over 68 and under 73: the plain bar takes the mark off, the effective one
    // would hold it open BECAUSE of the new romance.
    const world = createWorld('t3-clear-plain')
    world.temperament = 'sunny'
    let w = 400
    while (!quietWeek(world, w)) w++
    world.week = w
    world.loveEpisodes = [episode(w - 20)]
    world.spiritShock = { week: w - 30, kind: 'breakup' }
    world.spirit = 64.5
    accrueSpirit(world)
    expect(world.spirit, 'a steady girl returns five points toward the LIFTED target of 75').toBe(69.5)
    expect(world.spiritShock, '⭐ 69.5 is past 68, so the mark comes off – it is a question about HER').toBeNull()
  })

  it('⚠ a mark that has been cleared is not re-stamped by the weekly pass', () => {
    // The other direction of the same tail: `accrueSpirit` clears and never sets. Only `rollEnds` sets,
    // and it is gated on an attachment actually ending.
    const world = createWorld('t3-no-restamp')
    world.temperament = 'deep'
    let w = 400
    while (!quietWeek(world, w)) w++
    world.week = w
    world.spirit = 40
    world.spiritShock = null
    accrueSpirit(world)
    expect(world.spirit, 'she returns three points and nothing happens to her').toBe(43)
    expect(world.spiritShock, 'and no mark is invented for a girl who is merely low').toBeNull()
  })
})

// =================================================================================================
// E. WHAT MAY READ IT – the exhaustive list, and how Mood shows the shock with ZERO new code
// =================================================================================================
describe('wave 4 T3 E – the readers, and the Mood surface', () => {
  it('⚠⚠ the field is named in exactly five files in src/, and they are the writers and the seat', () => {
    // ⚠ THE T3 BRIEF'S «EXHAUSTIVE LIST», MADE MECHANICAL. The field is persisted FOR wave 5's
    // psychologist; a reader added anywhere else is scope the owner did not ask for, and the cheapest
    // way to notice one is to pin the set. ⚠ `codeOnly`, because `economy.ts` discusses the field in
    // the constant's own prose and a pin that tripped on an explanation would be repaired by deleting
    // the explanation.
    const named = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('spiritShock'))
      .map(([path]) => path)
    // ⚠ THE ORDER IS THE WALK'S, NOT AN ALPHABET'S: `srcFiles` recurses a directory where it meets it,
    // so `engine/world/` is exhausted before `engine/world.ts` («world» sorts before «world.ts»).
    expect(named).toEqual([
      'engine/migrations.ts', // the v74 -> v75 back-fill
      'engine/spirit.ts', // reads it (the delta) and clears it (the tail)
      'engine/world/lifeBeat.ts', // `rollEnds` – the one place it is SET
      'engine/world/state.ts', // the seat itself
      'engine/world.ts', // `createWorld`'s literal – null
    ])
    // ...and it is still NOT on the wire, which is the other half of the same claim: no component,
    // store or composable can be reading a field the snapshot does not carry.
    expect(named.some((p) => p.startsWith('components/') || p.startsWith('stores/') || p.startsWith('composables/')))
      .toBe(false)
  })

  it('⭐⭐ MOOD SHOWS IT, AND THROUGH THE NUMBER – the band, the word and the face all move, zero new code', () => {
    // ⚠⚠ THIS IS WHAT «Mood shows it» IS ON THIS TREE, AND THE HONEST ROAD IS THE ONLY ROAD. The shock
    // puts a lifted girl three rungs down the ladder and every Mood surface reads the ladder:
    // `spiritBandOf` -> `MOOD_WORD` / `MOOD_FACE`, and `idleRead`'s channel decides whether the word is
    // licensed at all (`DiaryFacts.moodWord`, engine/diary.ts). Not one line of that had to be written.
    //
    // The before is asserted too, so the after is a MOVE and not a coincidence: at a lifted 75 she is
    // `bright`, one rung up, and the body channel is level with her at a healthy condition.
    expect(spiritBandOf(75), 'a lifted girl, before').toBe('bright')
    for (const t of TEMPERAMENTS) {
      const { world } = endsOnAQuietRun(t)
      world.spirit = 75
      accrueSpirit(world)
      const band = spiritBandOf(world.spirit)
      expect(band, `${t}: 48 and 38 are both under the knee, which is where «Heavy» lives`).toBe('heavy')
      expect(MOOD_WORD[band], `${t}: and the word is the owner's own`).toBe('Heavy')
      // ⚠ CONDITION 70 IS A BODY THAT HAS NOTHING TO SAY (`conditionDeviation` 0), so the mood channel
      // wins on its own merits rather than on a tired body's absence of an opinion.
      const read = idleRead(false, 70, band)
      expect(read.channel, `${t}: the mood channel speaks`).toBe('mood')
      expect(read.emotion, `${t}: and her life going wrong reads as the sad painting`).toBe('sad')
    }
  }, 60_000)

  it('⚠⚠ THE WAVE-2 «a live shock outranks result joy» RULE DOES NOT EXIST ON THIS TREE, and T3 did not invent it', () => {
    // ⚠⚠ A FINDING, WRITTEN AS A PIN SO IT CANNOT BE FORGOTTEN. The wave-4 brief (§2 T3) and the T3
    // brief both say the face/Mood collision rule «wave 2 already wrote» reads a live `spiritShock` as
    // outranking result joy, and the build plan's collision contract (§4) states it. It was never
    // built: `idleRead` implements injury -> the larger deviation of body vs mood -> ties to the body,
    // and the note over those tables says in as many words that «the existing result logic» is the
    // layer that is UNCHANGED and stays on TOP – R8-6a, «won -> happy; nothing here can override it»,
    // a face the owner ruled on twice.
    //
    // So T3 reported it instead of inventing one. A rule that shows a sad face on the week she won a
    // title is a wording-and-face decision and it is the owner's; this pin records the tree's actual
    // shape, and the step that builds the rule will re-aim it with its own note.
    const emotion = readFileSync(`${SRC}shared/avatarEmotion.ts`, 'utf8')
    expect(codeOnly(emotion), 'the collision code knows nothing about a shock').not.toContain('spiritShock')
    // ...and the result layer really is on top, which is the claim the missing rule would overturn –
    // asserted through the function rather than through the file, so it is a behaviour and not a grep.
    expect(idleRead(false, 70, 'heavy'), 'the IDLE half is where the mood channel may win')
      .toEqual({ emotion: 'sad', channel: 'mood' })
  })
})
