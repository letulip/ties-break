// WAVE 5 T6 – «LEARNING TO LISTEN»: THE SAME NEWS, READ PLAINLY, AND THE PRICE THAT DOES NOT MOVE.
//
// The spec (docs/specs/the-psychologists-year-2026-09.md §2, the «Learning to listen» row, ⭐ RE-CUT
// 09.09) and the wave-5 brief's §2 T6: at the RAISE of a read-bearing beat – `'met'` with its drawn
// `wants`, `'ended'` with its space-vs-company read – on a week the family is paying a psychologist
// whose chosen year is `'listen'`, one uniform on `seed:psy:listen:<kind>:<week>` against
// `ECONOMY.psychologist.listenClarity[rung]` decides whether the card's HEADING and the KEPT FEED ROW
// say plainly what she wants. Failure is the standing wording, byte for byte.
//
// WHAT THIS FILE IS ORGANISED AROUND, in the order the risks rank:
//   §A  the coin – its constant, its key, and ⚠ the KIND being IN the key (§1f's one value per key)
//   §B  the 48 legible drafts – the rectangle, the four voices, and ⚠⚠ THE CONFIDENTIALITY LINT:
//       he coaches the PARENT and never reports her sessions, so no legible line may name him
//   §C  the stamp – written once at the raise, read by BOTH surfaces, and the ruling-E defect posed:
//       fire him with a beat pending and the wording must not flip under the player
//   §D  ⚠⚠ BYTE IDENTITY. The deltas, the read draw and the priced option set are the same bytes with
//       the focus on and off – deep-equalled across the toggle, never read off the code
//   §E  the streams – zero draws while ineligible (the count-keys net) AND ⚠⚠ a value-level key-by-key
//       world hash over walked careers (ruling L: a key counter cannot see a CONSUMED value)
//   §F  the stand-down in both halves – a college freeze and a booked family week – and the resume
//   §G  the realised clarity, inside the CI of 0.60 / 0.80 / 0.95 (sanity; T10's grid owns the bars)
//
// FIFTEEN MUTATION ARMS, FIFTEEN RED – every one applied and undone by the INVERSE edit (never
// `git checkout`), with every touched file's md5 asserted back to pristine afterwards, the control
// green first (35/35 here), and every number below re-measured on the tree that shipped. ⚠ ONE OF
// THEM WAS A NULL FIRST AND IS RECORDED AS ONE – see ARM 13. What each red SAID:
//
//   ARM 1  the coin reads `psychologistHired && focus === 'listen'` instead of the billing
//          predicate – T4's own defect, posed one focus over.                          **4 RED**
//          «pay nothing, receive nothing: expected true to be undefined», «booked off: …», the
//          college arm of the count-keys net, and the college arm of the key-hash walk («the seat is
//          paid for and buys NOTHING on this walk: expected ['events','lifeLog'] to deeply equal []»).
//   ARM 2  the key drops the KIND (`seed:psy:listen:<week>`).                           **5 RED**
//          «two kinds, two keys, one week: expected ['t6-kinds:psy:listen:1000', …(1)] to deeply
//          equal [Array(2)]», «one raise, one coin», the §A shape case, the missed-coin fixture and
//          the walked value check.
//   ARM 3  `listenClarity` = [0.6, 0.8, 0.8] – the top rung stops beating the middle.   **2 RED**
//          the constant itself and «0.60075 < 0.80675 < 0.80675». ⚠ Two rather than three because
//          the strict-monotonicity line sits BELOW the `toEqual` in the same case, which is the
//          measured number rather than the predicted one.
//   ARM 4  the comparison inverted (`>` the clarity).                                  **16 RED**
//          «rung 0: realised 0.4025 against 0.6 (SEM 0.0077)», the realised-share ladder, the rung
//          monotonicity, and every fixture that expected the seed it chose to be heard.
//   ARM 5  the heading RE-DERIVES the seat instead of reading the row's stamp.          **2 RED**
//          ⚠⚠ THE RULING-E CASE, IN ITS OWN WORDS: «fired with the beat pending – the wording is the
//          week's, not this tick's: expected 'She has told us there is someone' to be 'There is
//          someone, and she has drawn n…'», plus «the prompt reads the stamp and never re-draws it».
//   ARM 6  the stamp written on EVERY raise (`heard: false` when nobody is teaching).   **7 RED**
//          «absent – «nobody was teaching you to listen», true of every older row: expected true to
//          be false», both stand-downs – ⚠ AND TWO IN tests/wave3-soft-surface.test.ts, which is the
//          measured reason the key is written only when somebody is actually teaching: a blanket
//          stamp breaks wave 3's own whole-row deep-equals.
//   ARM 7a a heard beat pays a different bond (`chosen.bond + 1`).                      **1 RED**
//          ⚠⚠ THE FENCE: «warm: a coached parent pays what an uncoached one pays: expected 80 to
//          be 79».
//   ARM 7b the priced SET moves with the stamp (`+1` on every option of a heard row).   **2 RED**
//          «open: the priced set does not know about the seat», on `'met'` and on `'ended'`.
//   ARM 8  the coin switches the HEADING only – the kept row stays ambiguous.           **2 RED**
//          «and so does the row the album keeps» and the walked digest.
//   ARM 9  ⚠⚠ RULING L's ARM – `drawListenHeard` CONSUMES a value on the SAME key (`r(); return
//          r()`), so no key list can see it.                                            **4 RED**
//          THE KEY LISTS STAYED GREEN – the count-keys net and «one raise, one coin» both passed –
//          and the VALUE checks went red: «met@907: the stamp is the FIRST value of its own key:
//          expected true to be false», the §A shape case, and two fixtures. ⚠ MEASURED TWICE: the
//          FIRST version of §E's value check compared the stamp against `drawListenHeard` itself and
//          this arm walked straight through it (1 RED, in §A alone). `heardByStream` – the raw first
//          value of the key, re-derived in the test – is what makes it a net.
//   ARM 10 the coin drawn BEFORE the eligibility short-circuit.                         **3 RED**
//          «{"hired":false}: a false here means ZERO DRAWS, not a discarded one», «one raise, one
//          coin», and «every other stream is reached identically».
//   ARM 11 the legible pool reads `MET_HEADING_HEARD.sunny` whatever the voice – the silent fallback
//          `HeardRead` exists to make impossible.                                       **3 RED**
//          «and not one cell repeats another: expected 42 to be 48», «met heading/open: expected 1
//          to be 4», and the telling lint's own positive control stopped finding its cell.
//   ARM 12 `rollEnds` derives the ends read unconditionally – a new key on the AMBIGUOUS arm. **1 RED**
//          «nobody is teaching him – nothing to be plain about: expected ['t6-react:life:ends:
//          1104:react'] to deeply equal []».
//   ARM 13 ⚠⚠ A MEASURED NULL, THEN A RED, AND BOTH HALVES ARE THE FINDING. The first draft's
//          «with her the easy telling is the whole of it» put back – a cell that claims she spoke,
//          on a heading carried at a bond band where she did not.       **0 RED, then 1 RED**
//          The telling lint held `the telling`, and the draft's own adjective sat in the middle, so
//          the arm walked through a lint written for it. Widened to the shortest honest substring
//          (`telling`), the same arm is «met heading sunny/open claims a telling: «telling» in …».
//   ARM 13b the other first-draft offender – «it was given to us to keep».               **1 RED**
//          «met heading deep/private claims a telling: «was given to us» in …».
//
// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T2/T4/T5's §B apparatus, verbatim.
// Every call is delegated to the real `rngFromSeed`, so any number this file measures is the engine's
// own; the mock exists only so §E can COUNT AND ORDER the keys a pass reached. Hoisted, because
// `vi.mock`'s factory is lifted above the imports.
import { describe, expect, it, vi } from 'vitest'

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

import { createHash } from 'node:crypto'
import {
  answerLifeBeat,
  buildLifeBeatPrompt,
  createWorld,
  deliverKnownPartner,
  drawEndsRead,
  drawListenHeard,
  endedKeptRow,
  endsHazardFor,
  lifeBeatHeading,
  lifeLogOf,
  metKeptRow,
  pendingLifeBeatOptions,
  rollArrival,
  rollEnds,
  rollSmallTalk,
  ENDS_READS,
  ENDS_REGISTERS,
  PARTNER_WANTS,
  TEMPERAMENTS,
  type HeardRead,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf } from '../src/engine/spirit'
import { rngFromSeed } from '../src/engine/rng'
import { psychologistWorkingRung } from '../src/engine/world/psychologist'
import { DEFAULT_PROFILE, type BondBand, type LoveEpisode, type WorldEvent } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 4's `'ended'` file's own, so the two sets of claims are posed the same way
// -------------------------------------------------------------------------------------------------

type Seat = {
  hired: boolean
  rung?: 0 | 1 | 2
  focus?: 'listen' | 'recovery' | 'coolhead' | 'herself' | null
  /** a college freeze covering the week under test */
  college?: boolean
  /** the week under test, and the `weeks` after it, booked off */
  vacation?: number
}

/** A career parked at `week` with an empty life and the seat posed. ⚠ THE SEAT IS POKED AND THE HIRE
 *  IS NOT UNDER TEST HERE – `hirePsychologist`'s gate, its refusals and its ledger row are
 *  tests/wave5-psychologist-seat.test.ts's claims. What T6 adds is a wording draw on a hired seat. */
function posed(seed: string, week: number, seat: Seat, voice: (typeof TEMPERAMENTS)[number] = 'deep'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.week = week
  world.temperament = voice
  world.psychologistHired = seat.hired
  if (seat.rung !== undefined) world.psychologistRung = seat.rung
  world.psychologistFocus = seat.focus ?? null
  if (seat.college === true) {
    world.college = { fromWeek: week - 10, untilWeek: week + 200, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
  }
  if (seat.vacation !== undefined) {
    world.vacations = Array.from({ length: seat.vacation }, (_, k) => ({ week: week + k, packageId: 'beach', paidCents: 0 }))
  }
  return world
}

/** An attachment, hand-built. ⚠ POKED RATHER THAN ROLLED – wave 4's own fixture doctrine: the arrival
 *  hazard and the disclosure lag are not under test in this file. */
function episode(sinceWeek: number, knownWeek: number | null, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}`, ...over }
}

/** The lowest `bond` that still reads as this band – ASKED OF THE LADDER rather than re-derived from
 *  its cut points, so a band move cannot silently retune this file. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

const lifeRows = (world: WorldState): WorldEvent[] => world.events.filter((e) => e.type === 'life')

/** ⭐⭐ THE COIN'S OUTCOME, COMPUTED FROM THE RAW STREAM RATHER THAN FROM THE ENGINE'S OWN FUNCTION.
 *
 *  ⚠⚠ THAT IS THE WHOLE POINT OF IT, AND IT IS RULING L's LESSON SPELT AS APPARATUS. A fixture that
 *  picked its seed with `drawListenHeard` and then asserted the stamp against `drawListenHeard` is
 *  comparing two arms of one mutation: a term that CONSUMED a value on this key – same key, same key
 *  count, ARM 9 – would move both sides together and every case would stay green. Re-deriving the
 *  first value of the stream here is what makes those cases deterministic nets instead. */
function heardByStream(seed: string, kind: 'met' | 'ended', week: number, rung: 0 | 1 | 2): boolean {
  return rngFromSeed(`${seed}:psy:listen:${kind}:${week}`)() < ECONOMY.psychologist.listenClarity[rung]
}

/** ⭐⭐ A SEED WHOSE LISTEN COIN REALLY LANDS THIS WAY – found by asking the STREAM, never by stubbing
 *  anything. The same shape wave 4 uses for `seedEndingOn`, and for its stated reason: the seed it
 *  returns is one the REAL raise path will produce this outcome on. */
function seedHeard(prefix: string, want: boolean, kind: 'met' | 'ended', week: number, rung: 0 | 1 | 2): string {
  for (let i = 0; i < 20000; i++) {
    const seed = `${prefix}-${i}`
    if (heardByStream(seed, kind, week, rung) === want) return seed
  }
  throw new Error(`no seed in 20000 lands heard=${want} for a ${kind} raise on week ${week} at rung ${rung}`)
}

/** A hash per TOP-LEVEL KEY of the world – `tools/frozen-key-diff.ts`'s instrument, brought
 *  in-process so a control arm is compared key by key over a WALK rather than on an end state
 *  (ruling K: the frozen corpus diffs end states and is blind to a convergent change). */
function keyHashes(world: WorldState): Record<string, string> {
  const record = world as unknown as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of Object.keys(record).sort()) {
    out[key] = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
  }
  return out
}

/** Which keys differ between two walks – named, never counted, so a red says what moved. */
function movedKeys(a: Record<string, string>, b: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].filter((k) => a[k] !== b[k]).sort()
}

/** ⚠ THE PRIVATE LIFE'S FOUR WEEKLY CALLS, IN THE TICK'S OWN ORDER. The order itself is pinned
 *  against `resolveBodyAndPlanner`'s SOURCE in tests/wave4-ended-beat.test.ts («the tick ends, then
 *  arrives, then delivers»), so it is asserted once in the wave rather than twice. */
function walkLife(world: WorldState, weeks: number): WorldState {
  for (let k = 0; k < weeks; k++) {
    world.week += 1
    rollEnds(world)
    rollArrival(world)
    deliverKnownPartner(world)
    rollSmallTalk(world)
  }
  return world
}

/** A life with beats already scheduled into the walk: one romance that was over before the parent
 *  heard of it (the told-late delivery) and two he is told about on their own weeks. Deterministic,
 *  identical in both arms, and enough read-bearing raises for a key-by-key comparison to have
 *  something to compare. */
function plantLife(world: WorldState, base: number): WorldState {
  // ⚠ EIGHT ROWS, AND THE COUNT IS THE NET RATHER THAN THE SCENERY. §E's value check has to be able
  // to see a CONSUMED draw, and a consumed value only flips an outcome about half the time – so a
  // walk with two or three stamps in it can go green by luck. Eight raises is what makes the
  // literal-sequence half of that check load-bearing; the raw-stream half is deterministic anyway.
  world.loveEpisodes = Array.from({ length: 8 }, (_, k) =>
    episode(base - 100 + k * 5, base + 3 + k * 4, k % 2 === 0 ? { endedWeek: base - 99 + k * 5 } : {}),
  )
  return world
}

/** ⚠ THE FIXTURE'S OWN FIELDS, EXCLUDED FROM EVERY WALK COMPARISON AND NAMED SO THE EXCLUSION IS
 *  READABLE. `posed` writes the seat and the stand-down straight onto the world, so these five differ
 *  between an arm and its control BEFORE a week is walked; they are the fixture, never the effect.
 *  Everything else is the claim. */
const POSED_FIELDS = ['psychologistHired', 'psychologistRung', 'psychologistFocus', 'college', 'vacations']

/** What an arm actually MOVED, against the seat-empty control walked the same forty weeks. */
function effectKeys(walked: Record<string, string>): string[] {
  const control = keyHashes(walkLife(plantLife(posed('t6-walk', 900, { hired: false }, 'sunny'), 900), 40))
  return movedKeys(control, walked).filter((k) => !POSED_FIELDS.includes(k))
}

const heardKeys = (): string[] => rngKeys.filter((k) => k.includes(':psy:listen:'))
const frame = (voice: (typeof TEMPERAMENTS)[number], wants: LoveEpisode['wants'] = 'open'): HeardRead => ({ voice, wants })

// =================================================================================================
// A. THE COIN – its constant, its key, and the kind that lives inside the key
// =================================================================================================
describe('wave 5 T6 A – one uniform per read-bearing beat, and what it is keyed on', () => {
  it('⭐ the constant is the spec §2 row, strictly increasing, and every rung is a real probability', () => {
    expect(ECONOMY.psychologist.listenClarity, 'the spec\'s ruled 0.6 / 0.8 / 0.95').toEqual([0.6, 0.8, 0.95])
    const [a, b, c] = ECONOMY.psychologist.listenClarity
    expect(a, 'a counsellor reads her worse than a sport psychologist').toBeLessThan(b)
    expect(b, 'and the tour-grade specialist beats them both').toBeLessThan(c)
    for (const p of ECONOMY.psychologist.listenClarity) {
      expect(p, 'never a certainty – the parent can still miss it at the top rung').toBeLessThan(1)
      expect(p, 'and never a dead rung').toBeGreaterThan(0)
    }
  })

  it('⭐⭐ the draw is ONE uniform on `seed:psy:listen:<kind>:<week>` against the rung\'s clarity', () => {
    for (const kind of ['met', 'ended'] as const) {
      for (const rung of [0, 1, 2] as const) {
        for (let week = 900; week < 906; week++) {
          const seed = `t6-shape-${week}`
          const expected = rngFromSeed(`${seed}:psy:listen:${kind}:${week}`)() < ECONOMY.psychologist.listenClarity[rung]
          expect(drawListenHeard(seed, kind, week, rung), `${kind}/${rung}/${week}`).toBe(expected)
        }
      }
    }
  })

  it('⚠⚠ §1f – THE KIND IS IN THE KEY, so two read-bearing beats in one week are two values', () => {
    // The two keys are two strings...
    const week = 1000
    const seed = 't6-kinds'
    rngKeys.length = 0
    drawListenHeard(seed, 'met', week, 1)
    drawListenHeard(seed, 'ended', week, 1)
    expect(rngKeys, 'two kinds, two keys, one week').toEqual([
      `${seed}:psy:listen:met:${week}`,
      `${seed}:psy:listen:ended:${week}`,
    ])
    // ...and they really disagree somewhere, which is what makes them two FACTS and not two spellings
    // of one. A key that dropped the kind would hand one week's ending and one week's delivery the
    // same outcome for ever, and nothing else in this file could see it.
    const disagrees = Array.from({ length: 400 }, (_, i) => `t6-kinds-${i}`).filter(
      (s) => drawListenHeard(s, 'met', week, 1) !== drawListenHeard(s, 'ended', week, 1),
    )
    expect(disagrees.length, 'the two kinds draw independently').toBeGreaterThan(20)
  })

  it('⚠ the rung moves the BAR and never the dice – a heard beat at rung 0 is heard at every rung', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `t6-mono-${i}`
      if (drawListenHeard(seed, 'met', 1000, 0)) {
        expect(drawListenHeard(seed, 'met', 1000, 1), `${seed}: rung 1`).toBe(true)
        expect(drawListenHeard(seed, 'met', 1000, 2), `${seed}: rung 2`).toBe(true)
      }
    }
  })
})

// =================================================================================================
// B. THE 48 DRAFTS – the rectangle, the four voices, and ⚠⚠ the confidentiality lint
// =================================================================================================

/** Every legible string the focus can print, walked as a rectangle rather than transcribed – so a
 *  cell that is never written is a compile error and a cell that is never SWEPT is impossible. */
function everyLegible(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const voice of TEMPERAMENTS) {
    for (const wants of PARTNER_WANTS) {
      out.push({ where: `met heading ${voice}/${wants}`, text: lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame(voice, wants)) })
      out.push({ where: `met row ${voice}/${wants}`, text: metKeptRow('close', wants, frame(voice, wants)) })
    }
    for (const register of ENDS_REGISTERS) {
      for (const read of ENDS_READS) {
        out.push({ where: `ended heading ${voice}/${register}/${read}`, text: lifeBeatHeading('ended', 'level', 'close', register, read, frame(voice)) })
        out.push({ where: `ended row ${voice}/${register}/${read}`, text: endedKeptRow(register, read, frame(voice)) })
      }
    }
  }
  return out
}

describe('wave 5 T6 B – the legible drafts, and the one thing they may never say', () => {
  it('⭐ the rectangle is complete and it is FORTY-EIGHT – 8 + 8 met, 16 + 16 ended', () => {
    const all = everyLegible()
    expect(all.length, 'the sweep walks every cell of both surfaces').toBe(48)
    expect(new Set(all.map((c) => c.text)).size, 'and not one cell repeats another').toBe(48)
    for (const cell of all) expect(cell.text.length, cell.where).toBeGreaterThan(20)
  })

  it('⭐⭐ the four voices are FOUR on every axis – no girl silently receives another girl\'s reading', () => {
    for (const wants of PARTNER_WANTS) {
      expect(new Set(TEMPERAMENTS.map((v) => lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame(v, wants)))).size, `met heading/${wants}`).toBe(4)
      expect(new Set(TEMPERAMENTS.map((v) => metKeptRow('close', wants, frame(v, wants)))).size, `met row/${wants}`).toBe(4)
    }
    for (const register of ENDS_REGISTERS) {
      for (const read of ENDS_READS) {
        expect(new Set(TEMPERAMENTS.map((v) => lifeBeatHeading('ended', 'level', 'close', register, read, frame(v)))).size, `ended heading/${register}/${read}`).toBe(4)
        expect(new Set(TEMPERAMENTS.map((v) => endedKeptRow(register, read, frame(v)))).size, `ended row/${register}/${read}`).toBe(4)
      }
    }
  })

  it('⚠ the two reads are worded differently on every voice – a legible frame that said one thing for both would price nothing', () => {
    for (const voice of TEMPERAMENTS) {
      expect(lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame(voice, 'open')), `${voice}: met heading`)
        .not.toBe(lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame(voice, 'private')))
      expect(metKeptRow('close', 'open', frame(voice, 'open')), `${voice}: met row`).not.toBe(metKeptRow('close', 'private', frame(voice, 'private')))
      for (const register of ENDS_REGISTERS) {
        expect(lifeBeatHeading('ended', 'level', 'close', register, 'space', frame(voice)), `${voice}/${register}: ended heading`)
          .not.toBe(lifeBeatHeading('ended', 'level', 'close', register, 'company', frame(voice)))
        expect(endedKeptRow(register, 'space', frame(voice)), `${voice}/${register}: ended row`).not.toBe(endedKeptRow(register, 'company', frame(voice)))
      }
    }
  })

  it('⚠⚠⚠ THE CONFIDENTIALITY LINT – he coaches the parent and NEVER reports her sessions', () => {
    // The owner's re-cut of 09.09, and the gravest wording failure this task can produce: «the
    // psychologist says she wants…» would be a leak AND a category error, because what the seat sells
    // is an ear rather than a report. Every legible line is the parent's own trained reading.
    // ⚠ The list is a ratchet in the `BANNED_TAILS` style: adding a phrase tightens it, removing one
    // is the owner's call.
    const LEAK = [
      'psychologist', 'counsellor', 'counselor', 'therapist', 'therapy', 'session',
      'specialist', 'says she', 'said she', 'we were told', 'told us she', 'according to',
      'he says', 'his read',
    ]
    const all = everyLegible()
    // ⚠ THE POSITIVE CONTROL FIRST – a sweep over an empty set passes for ever, and a lint that
    // cannot see the pool is the false comfort this wave has already met twice.
    expect(all.map((c) => c.text), 'the sweep really reaches the pools')
      .toContain('There is someone in her life. It is hers to keep, and we knew it without being asked.')
    for (const cell of all) {
      const lower = cell.text.toLowerCase()
      for (const leak of LEAK) {
        expect(lower.includes(leak), `${cell.where} reports a session: «${leak}» in «${cell.text}»`).toBe(false)
      }
      // R15-7's rule, asserted at the pool as well as by the corpus sweep: nobody in this game is
      // called «he» by a guess, and the partner is gender-free by construction (`LoveEpisode` holds
      // no gender at all).
      expect(cell.text, `${cell.where}: a masculine pronoun`).not.toMatch(/\b(he|his|him|himself)\b/i)
    }
  })

  it('⚠⚠ NOT ONE LEGIBLE CELL CLAIMS SHE SPOKE THIS WEEK – the heading is carried at every bond band', () => {
    // ⚠⚠ THE BAND IS WHY, and it is a reachable defect rather than a scruple: on the dry rung she
    // said NOTHING and the house found out anyway (`MET_DRY`), so a legible frame reading «the easy
    // telling is the whole of it» or «it was given to us to keep» is FALSE on a third of the ladder
    // while looking careful. What every cell names instead is a standing habit of hers
    // (`world.temperament` is a persisted fact) and her drawn read (a persisted draw), and both are
    // true of a week she said nothing.
    //
    // ⚠ THIS LINT IS HERE BECAUSE THE FIRST DRAFT FAILED IT – four met headings and two met rows
    // asserted a telling, under a pool comment that claimed none did. A comment claiming more than
    // the copy delivers is ruling C's rejected shape, one layer over.
    // ⚠ THE ENTRIES ARE THE SHORTEST HONEST SUBSTRING, measured against the first draft rather than
    // guessed at: ARM 13 put «with her the easy telling is the whole of it» back and the first
    // version of this list – which held `the telling` – stayed GREEN on it, because the draft's own
    // adjective sat in the middle. A lint whose entry is longer than it needs to be is a lint with a
    // hole in it, which is `BANNED_TAILS`' own literal-substring discipline read carefully.
    const SPOKE = [
      'telling', 'she said', 'she told', 'she rang', 'she called', 'she mentioned', 'she wrote',
      'brought it up', 'was given to us', 'given it', 'put it down', 'we heard it', 'she admitted',
    ]
    const all = everyLegible()
    expect(all.map((c) => c.text), 'the sweep really reaches the pools')
      .toContain('There is someone, and she has drawn a line round it – she wants it to go no further')
    for (const cell of all) {
      const lower = cell.text.toLowerCase()
      for (const claim of SPOKE) {
        expect(lower.includes(claim), `${cell.where} claims a telling: «${claim}» in «${cell.text}»`).toBe(false)
      }
    }
  })

  it('⚠ house style on all forty-eight: short dash only, no Cyrillic, no number, no price', () => {
    for (const cell of everyLegible()) {
      expect(cell.text, `${cell.where}: the long dash is never used in this repo's copy`).not.toMatch(/—/)
      expect(cell.text, `${cell.where}: Cyrillic in a shipped string`).not.toMatch(/[Ѐ-ӿ]/)
      expect(cell.text, `${cell.where}: a figure in player-facing copy`).not.toMatch(/\d|\$/)
    }
  })

  it('⭐⭐ every legible cell really differs from the standing one it replaces – both arms exist', () => {
    for (const voice of TEMPERAMENTS) {
      for (const wants of PARTNER_WANTS) {
        for (const band of ['close', 'steady', 'strained'] as BondBand[]) {
          expect(lifeBeatHeading('met', 'level', band, 'told-now', 'space', frame(voice, wants)), `${voice}/${wants}/${band}`)
            .not.toBe(lifeBeatHeading('met', 'level', band))
          expect(metKeptRow(band, wants, frame(voice, wants)), `${voice}/${wants}/${band}`).not.toBe(metKeptRow(band, wants))
        }
      }
      for (const register of ENDS_REGISTERS) {
        for (const read of ENDS_READS) {
          expect(lifeBeatHeading('ended', 'level', 'close', register, read, frame(voice)), `${voice}/${register}/${read}`)
            .not.toBe(lifeBeatHeading('ended', 'level', 'close', register, read))
          expect(endedKeptRow(register, read, frame(voice)), `${voice}/${register}/${read}`).not.toBe(endedKeptRow(register, read))
        }
      }
    }
  })

  it('⚠ the ending\'s legible cells END on the STANDING pool\'s own wording of the read – one fact, one sentence', () => {
    // The comment at `ENDED_EVENT_HEARD` says this is deliberate: inventing a second way to say «she
    // wants the room to herself» would put two readings of one draw into the album.
    const tail: Record<string, string> = {
      space: 'she wants the room to herself',
      company: 'she does not want to be on her own with it',
    }
    for (const voice of TEMPERAMENTS) {
      for (const register of ENDS_REGISTERS) {
        for (const read of ENDS_READS) {
          expect(endedKeptRow(register, read, frame(voice)).toLowerCase(), `${voice}/${register}/${read}`)
            .toContain(tail[read])
        }
      }
    }
  })

  it('⚠⚠ the STANDING wording is byte-identical to what shipped – the failure arm moved nothing', () => {
    // ⚠ These six literals are the wave-3 and wave-4 strings, transcribed on purpose: a pin that
    // asked the same function for both halves could not tell «unchanged» from «changed twice».
    expect(lifeBeatHeading('met', 'level', 'close')).toBe('She has told us there is someone')
    expect(lifeBeatHeading('met', 'level', 'steady')).toBe('Something she mentioned this week')
    expect(lifeBeatHeading('met', 'level', 'cold')).toBe('There is someone in her life')
    expect(lifeBeatHeading('ended', 'level', 'close', 'told-now', 'space')).toBe('It is over, and she wants the room to herself')
    expect(metKeptRow('close', 'private')).toBe('She told us there is someone in her life, and asked that it stay between us.')
    expect(endedKeptRow('told-now', 'space')).toBe('It ended this week, and there is nobody in her life now.')
    expect(endedKeptRow('told-late', 'company')).toBe(
      'There had been someone in her life, and it was over before we heard of it. She does not want to be on her own with it.',
    )
  })
})

// =================================================================================================
// C. THE STAMP – written once at the raise, read by BOTH surfaces, and never re-derived
// =================================================================================================
describe('wave 5 T6 C – the outcome is stamped on the row (ruling E)', () => {
  it('⭐⭐ heard: the row carries `heard: true`, and the heading AND the kept row are the legible ones', () => {
    const week = 1000
    const seed = seedHeard('t6-heard', true, 'met', week, 1)
    const world = posed(seed, week, { hired: true, rung: 1, focus: 'listen' }, 'quiet')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week, { wants: 'private' })]
    deliverKnownPartner(world)

    const row = lifeLogOf(world)[0]
    expect(row.kind, 'the fixture really delivered the arrival').toBe('met')
    expect(row.heard, 'and the week was read plainly').toBe(true)
    expect(buildLifeBeatPrompt(world)!.heading, 'the heading says what she wants')
      .toBe(lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame('quiet', 'private')))
    expect(lifeRows(world)[0].text, 'and so does the row the album keeps')
      .toBe(metKeptRow('close', 'private', frame('quiet', 'private')))
  })

  it('⭐⭐ missed: `heard: false`, and BOTH surfaces are the standing wording, byte for byte', () => {
    const week = 1000
    const seed = seedHeard('t6-missed', false, 'met', week, 0)
    const world = posed(seed, week, { hired: true, rung: 0, focus: 'listen' }, 'quiet')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week, { wants: 'private' })]
    deliverKnownPartner(world)

    expect(lifeLogOf(world)[0].heard, 'he was teaching, and this one got past').toBe(false)
    expect(buildLifeBeatPrompt(world)!.heading).toBe('She has told us there is someone')
    expect(lifeRows(world)[0].text).toBe('She told us there is someone in her life, and asked that it stay between us.')
  })

  it('⚠⚠ nobody teaching: the key is ABSENT, and the row is the four-field object it has always been', () => {
    const week = 1000
    const world = posed('t6-nobody', week, { hired: false }, 'quiet')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week, { wants: 'private' })]
    deliverKnownPartner(world)

    const row = lifeLogOf(world)[0]
    expect('heard' in row, 'absent – «nobody was teaching you to listen», true of every older row').toBe(false)
    expect(row, 'and the row is byte-identical to what every career before this wave wrote')
      .toEqual({ week, kind: 'met', detail: 'p:940', answer: null })
    expect(buildLifeBeatPrompt(world)!.heading).toBe('She has told us there is someone')
  })

  it('⚠ the seat hired for ANOTHER year stamps nothing – the focus is the gate, not the payroll', () => {
    const week = 1000
    const world = posed('t6-other-year', week, { hired: true, rung: 2, focus: 'coolhead' }, 'quiet')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week)]
    deliverKnownPartner(world)
    expect('heard' in lifeLogOf(world)[0]).toBe(false)
  })

  it('⭐⭐⭐ RULING E – fire him with the beat still pending and the wording DOES NOT MOVE', () => {
    // The defect the stamp exists to prevent, posed rather than argued. `buildLifeBeatPrompt` is
    // rebuilt on EVERY snapshot and hire, release and the rung dial all produce one, so a re-derived
    // legibility would flip the heading under the player's eyes while the kept feed row – whose TEXT
    // was persisted at the raise – still said the other thing. One piece of news, two wordings.
    const week = 1000
    const seed = seedHeard('t6-ruling-e', true, 'met', week, 2)
    const world = posed(seed, week, { hired: true, rung: 2, focus: 'listen' }, 'fiery')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week, { wants: 'open' })]
    deliverKnownPartner(world)

    const legible = buildLifeBeatPrompt(world)!.heading
    const keptRow = lifeRows(world)[0].text
    expect(legible, 'the raise was read plainly').toBe(lifeBeatHeading('met', 'level', 'close', 'told-now', 'space', frame('fiery', 'open')))

    world.psychologistHired = false
    expect(buildLifeBeatPrompt(world)!.heading, '⚠⚠ fired with the beat pending – the wording is the week\'s, not this tick\'s').toBe(legible)
    world.psychologistHired = true
    world.psychologistRung = 0
    expect(buildLifeBeatPrompt(world)!.heading, 'and a dropped rung moves nothing either').toBe(legible)
    world.psychologistFocus = 'recovery'
    expect(buildLifeBeatPrompt(world)!.heading, 'nor does next year\'s focus').toBe(legible)
    expect(lifeRows(world)[0].text, 'and the kept row never disagreed with it').toBe(keptRow)
  })

  it('⚠⚠ the coin is drawn ONCE, at the raise – re-assembling the prompt derives no listen key at all', () => {
    const week = 1000
    const seed = seedHeard('t6-once', true, 'ended', week, 1)
    const world = posed(seed, week, { hired: true, rung: 1, focus: 'listen' }, 'sunny')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(900, week, { endedWeek: 950 })]
    deliverKnownPartner(world)
    expect(lifeLogOf(world)[0].heard, 'the fixture really raised a told-late card').toBe(true)

    rngKeys.length = 0
    for (let i = 0; i < 5; i++) buildLifeBeatPrompt(world)
    expect(heardKeys(), 'the prompt reads the stamp and never re-draws it').toEqual([])
  })

  it('⭐ the told-now ending stamps its own row, and the read reaches its kept line only there', () => {
    const week = 1000
    const world = posed('t6-now', week, { hired: true, rung: 2, focus: 'listen' }, 'deep')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(900, 940)]
    deliverKnownPartner(world)
    // the `'met'` receipt, which is what makes the ending below a TOLD-NOW one (ruling A)
    expect(lifeLogOf(world).map((r) => r.kind)).toEqual(['met'])
    answerLifeBeat(world, 'silent')

    // an ending on a week the hazard really fires, found through the engine's OWN stream and its OWN
    // hazard – wave 4's `seedEndingOn` read the other way round, because the seed is fixed here
    const hazard = endsHazardFor('deep')
    let endWeek = week
    while (rngFromSeed(`t6-now:life:ends:${endWeek}`)() >= hazard) endWeek++
    const heard = drawListenHeard('t6-now', 'ended', endWeek, 2)
    world.week = endWeek
    rollEnds(world)
    const ended = lifeLogOf(world).find((r) => r.kind === 'ended')
    if (ended === undefined) throw new Error('the fixture did not end the romance – re-aim the hazard search')
    expect(ended.heard, 'the told-now raise carries its own coin').toBe(heard)
    const row = lifeRows(world).at(-1)!
    expect(row.lifeKind).toBe('ended')
    expect(row.text, heard ? 'the legible told-now row' : 'the standing told-now row').toBe(
      heard
        ? endedKeptRow('told-now', drawEndsRead('t6-now', endWeek, 'deep'), frame('deep'))
        : 'It ended this week, and there is nobody in her life now.',
    )
  })
})

// =================================================================================================
// D. ⚠⚠ THE FENCE – THE BOND ARITHMETIC IS THE SAME BYTES WITH THE FOCUS ON AND OFF
// =================================================================================================
//
// The wave brief's own pin, and the one that makes this focus a communication coach rather than a
// purchase: «the deltas, the read draw and the priced option set are the same bytes with the focus on
// or off (pin: deep-equal the priced option sets across the toggle)». Read off the RUNNING engine,
// never off the code.
describe('wave 5 T6 D – the focus buys a wording and never a price', () => {
  /** The same world twice, differing in the seat alone. */
  function toggled(seed: string, week: number, build: (world: WorldState) => void): [WorldState, WorldState] {
    const off = posed(seed, week, { hired: false }, 'fiery')
    const on = posed(seed, week, { hired: true, rung: 2, focus: 'listen' }, 'fiery')
    build(off)
    build(on)
    return [off, on]
  }

  it('⭐⭐⭐ `met` – the priced answer set is DEEP-EQUAL across the toggle, on both reads', () => {
    for (const wants of PARTNER_WANTS) {
      const seed = seedHeard(`t6-price-met-${wants}`, true, 'met', 1000, 2)
      const [off, on] = toggled(seed, 1000, (w) => {
        w.bond = bondFor('close')
        w.loveEpisodes = [episode(940, 1000, { wants })]
        deliverKnownPartner(w)
      })
      expect(lifeLogOf(on)[0].heard, `${wants}: the focus really fired`).toBe(true)
      expect(pendingLifeBeatOptions(on), `${wants}: the priced set does not know about the seat`)
        .toEqual(pendingLifeBeatOptions(off))
    }
  })

  it('⭐⭐⭐ `ended` – the same, on both reads and both registers, and the READ itself does not move', () => {
    const seed = seedHeard('t6-price-ended', true, 'ended', 1000, 2)
    const [off, on] = toggled(seed, 1000, (w) => {
      w.bond = bondFor('close')
      w.loveEpisodes = [episode(900, 1000, { endedWeek: 950 })]
      deliverKnownPartner(w)
    })
    expect(lifeLogOf(on)[0].heard, 'the focus really fired').toBe(true)
    expect(pendingLifeBeatOptions(on)).toEqual(pendingLifeBeatOptions(off))
    // ⚠ AND THE READ ITSELF IS THE SAME DRAW ON BOTH SIDES: each arm printed the cell its own pool
    // holds FOR THAT READ, so a focus that had moved the read would show up as a mismatched pair.
    const read = drawEndsRead(seed, 950, 'fiery')
    expect(lifeRows(off)[0].text, 'the standing row carries the read it always did').toBe(endedKeptRow('told-late', read))
    expect(lifeRows(on)[0].text, 'and the legible one carries the SAME read').toBe(endedKeptRow('told-late', read, frame('fiery')))
  })

  it('⭐⭐ HER LINE is byte-identical across the toggle – the legibility is the parent\'s frame alone', () => {
    const seed = seedHeard('t6-said', true, 'met', 1000, 2)
    const [off, on] = toggled(seed, 1000, (w) => {
      w.bond = bondFor('close')
      w.loveEpisodes = [episode(940, 1000, { wants: 'private' })]
      deliverKnownPartner(w)
    })
    expect(buildLifeBeatPrompt(on)!.said).toBe(buildLifeBeatPrompt(off)!.said)
    expect(buildLifeBeatPrompt(on)!.options, 'and the labels on the buttons').toEqual(buildLifeBeatPrompt(off)!.options)
    expect(buildLifeBeatPrompt(on)!.heading, 'only the frame over them moved').not.toBe(buildLifeBeatPrompt(off)!.heading)
  })

  it('⭐⭐⭐ and the same ANSWER costs the same bond on both sides of the toggle', () => {
    for (const optionId of ['warm', 'wary', 'meet', 'silent']) {
      const seed = seedHeard(`t6-bond-${optionId}`, true, 'met', 1000, 2)
      const [off, on] = toggled(seed, 1000, (w) => {
        w.bond = bondFor('close')
        w.loveEpisodes = [episode(940, 1000, { wants: 'private' })]
        deliverKnownPartner(w)
        answerLifeBeat(w, optionId)
      })
      expect(on.bond, `${optionId}: a coached parent pays what an uncoached one pays`).toBe(off.bond)
      expect(lifeLogOf(on)[0].answer, `${optionId}: and the answer landed`).toBe(optionId)
    }
  })
})

// =================================================================================================
// E. THE STREAMS – ⚠⚠ THE COUNT-KEYS NET **AND** A VALUE-LEVEL CHECK (ruling L)
// =================================================================================================
//
// Ruling L, measured by T5: «a key counter sees KEYS, never CONSUMED VALUES. It proves a stream was
// not REACHED. It cannot prove a stream was not ADVANCED.» T6's coin lives inside a file that already
// draws, so the key net is necessary and NOT sufficient: it is paired below with a key-by-key world
// hash over walked careers, and ARM 9 is the arm that consumes a value without adding a key.
describe('wave 5 T6 E – zero draws while nobody is teaching, and the values under the keys', () => {
  function delivered(seat: Seat, seed = 't6-keys'): WorldState {
    const world = posed(seed, 1000, seat, 'sunny')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, 1000)]
    rngKeys.length = 0
    deliverKnownPartner(world)
    return world
  }

  it('⭐⭐ THE COUNT-KEYS NET – not one `psy:listen` key is derived while the focus is not being worked', () => {
    for (const seat of [
      { hired: false } as Seat,
      { hired: true, rung: 1, focus: null } as Seat,
      { hired: true, rung: 1, focus: 'recovery' } as Seat,
      { hired: true, rung: 2, focus: 'coolhead' } as Seat,
      { hired: true, rung: 2, focus: 'herself' } as Seat,
      { hired: true, rung: 2, focus: 'listen', college: true } as Seat,
      { hired: true, rung: 2, focus: 'listen', vacation: 1 } as Seat,
    ]) {
      delivered(seat)
      expect(heardKeys(), `${JSON.stringify(seat)}: a false here means ZERO DRAWS, not a discarded one`).toEqual([])
    }
  })

  it('⭐ THE POSITIVE CONTROL – working it derives exactly one key, named for the kind and the week', () => {
    delivered({ hired: true, rung: 1, focus: 'listen' })
    expect(heardKeys(), 'one raise, one coin').toEqual(['t6-keys:psy:listen:met:1000'])
  })

  it('⚠ and the ambiguous arm derives no MORE keys than wave 4 did – the whole list is unchanged', () => {
    const off = delivered({ hired: false }, 't6-list')
    const listOff = [...rngKeys]
    const on = delivered({ hired: true, rung: 1, focus: 'listen' }, 't6-list')
    const listOn = [...rngKeys]
    expect(listOn.filter((k) => !k.includes(':psy:listen:')), 'every other stream is reached identically').toEqual(listOff)
    expect(lifeLogOf(on)[0].heard, 'and the focus really fired').toBe(true)
    expect('heard' in lifeLogOf(off)[0]).toBe(false)
  })

  it('⚠⚠ the AMBIGUOUS told-now ending derives no ends-read key – the standing row carries no read', () => {
    // The guard at `rollEnds`' row, asserted rather than commented. The told-now row has never
    // carried the space-vs-company read, so `seed:life:ends:<week>:react` is not on that path – and
    // deriving it unconditionally «for the legible arm» would put a new key into every ending of
    // every career, the frozen corpus included, for a value nothing would print.
    function endingAt(seat: Seat): string[] {
      const world = posed('t6-react', 1000, seat, 'deep')
      world.bond = bondFor('close')
      world.loveEpisodes = [episode(900, 940)]
      deliverKnownPartner(world)
      answerLifeBeat(world, 'silent')
      const hazard = endsHazardFor('deep')
      while (rngFromSeed(`t6-react:life:ends:${world.week}`)() >= hazard) world.week++
      rngKeys.length = 0
      rollEnds(world)
      expect(lifeLogOf(world).some((r) => r.kind === 'ended'), 'the fixture really ended the romance').toBe(true)
      return rngKeys.filter((k) => k.includes(':react'))
    }
    expect(endingAt({ hired: false }), 'nobody is teaching him – nothing to be plain about').toEqual([])
    expect(endingAt({ hired: true, rung: 1, focus: 'recovery' }), 'and a seat working another year is the same').toEqual([])
    // ⭐ THE POSITIVE CONTROL – the legible arm DOES need the read, and derives it exactly once.
    expect(endingAt({ hired: true, rung: 2, focus: 'listen' }).length, 'the legible row reads it once')
      .toBeLessThanOrEqual(1)
  })

  it('⭐⭐⭐ VALUE-LEVEL, KEY BY KEY OVER A WALKED CAREER – with the focus off, NOTHING moves', () => {
    // ⚠⚠ Ruling L's own rule: the key list is necessary and not sufficient, because this term lives
    // inside a file that already draws. Each arm is walked against a control – the same world with the
    // seat empty – and every top-level key is hashed after the walk.
    const arms: [string, Seat][] = [
      ['hired for another year', { hired: true, rung: 2, focus: 'recovery' }],
      ['a college freeze', { hired: true, rung: 2, focus: 'listen', college: true }],
      ['forty weeks booked off', { hired: true, rung: 2, focus: 'listen', vacation: 41 }],
    ]
    for (const [name, seat] of arms) {
      const walked = keyHashes(walkLife(plantLife(posed('t6-walk', 900, seat, 'sunny'), 900), 40))
      expect(effectKeys(walked), `${name}: the seat is paid for and buys NOTHING on this walk`).toEqual([])
    }
  })

  it('⭐⭐⭐ ...and with the focus ON, exactly `events` and `lifeLog` move, and no third key', () => {
    const working = keyHashes(walkLife(plantLife(posed('t6-walk', 900, { hired: true, rung: 2, focus: 'listen' }, 'sunny'), 900), 40))
    expect(effectKeys(working), '⚠⚠ a wording and a stamp – and NOT `bond`, NOT `nextEventId`, NOT `spirit`')
      .toEqual(['events', 'lifeLog'])
  })

  it('⭐⭐⭐ THE VALUE CHECK ITSELF – the walked career\'s heard sequence and its row texts are pinned', () => {
    // ⚠⚠ THIS IS THE HALF A KEY COUNTER CANNOT DO (ruling L / T5's ARM 7a). An extra `rng()` on the
    // SAME key leaves every key list green and moves the VALUE – so the sequence of outcomes over a
    // walk, and the sentences they printed, are what has to be pinned.
    const world = walkLife(plantLife(posed('t6-walk', 900, { hired: true, rung: 1, focus: 'listen' }, 'sunny'), 900), 40)
    const stamps = lifeLogOf(world).filter((r) => r.heard !== undefined)
    expect(stamps.length, 'the walk really raised read-bearing beats').toBeGreaterThanOrEqual(6)
    for (const row of stamps) {
      // ⚠⚠ AGAINST THE RAW STREAM, never against `drawListenHeard` – see `heardByStream`. A check
      // that asked the engine's own function would be two arms of one mutation and ARM 9 would walk
      // straight through it.
      expect(row.heard, `${row.kind}@${row.week}: the stamp is the FIRST value of its own key`)
        .toBe(heardByStream('t6-walk', row.kind as 'met' | 'ended', row.week, 1))
    }
    // ⚠ AND THE SEQUENCE AS A LITERAL, which is the half that survives a rewrite of `heardByStream`
    // itself: eight outcomes in the order the walk produced them.
    expect(stamps.map((r) => `${r.kind}:${r.week}:${r.heard}`), 'the walk\'s own eight outcomes').toEqual(WALK_STAMPS)
    const digest = createHash('sha256')
      .update(JSON.stringify([stamps.map((r) => `${r.kind}:${r.week}:${r.heard}`), lifeRows(world).map((e) => e.text)]))
      .digest('hex')
      .slice(0, 12)
    expect(digest, 'the walk\'s outcomes and the sentences they printed, byte for byte').toBe(WALK_DIGEST)
  })
})

/** ⚠ THE WALK'S OWN FINGERPRINT – the `heard` sequence plus every life row's text, over the forty
 *  weeks §E walks. It is here rather than inline so the number reads as the measurement it is: a
 *  change to any legible draft moves it, which is correct (the drafts are the deliverable), and so
 *  does a CONSUMED draw on an unchanged key, which is the thing the key net cannot see. */
const WALK_DIGEST = '002099f9e455'

/** ⚠ THE EIGHT OUTCOMES THE WALK PRODUCES, IN ORDER – measured, never predicted. Deliberately a
 *  literal list rather than a re-derivation: a term that consumed a value on an unchanged key moves
 *  these and leaves every key list green (ruling L / ARM 9). */
const WALK_STAMPS = [
  'ended:903:true',
  'met:907:false',
  'ended:911:false',
  'met:915:true',
  'ended:919:true',
  'met:923:true',
  'ended:927:true',
  'met:931:true',
]

// =================================================================================================
// F. THE STAND-DOWN – the two weeks the family is not billed, and the week after
// =================================================================================================
describe('wave 5 T6 F – the working week is the billing week (ruling J)', () => {
  function heardOn(week: number, seat: Seat, seed: string): boolean | undefined {
    const world = posed(seed, week, seat, 'quiet')
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(week - 60, week)]
    deliverKnownPartner(world)
    return lifeLogOf(world)[0].heard
  }

  it('⭐⭐ a college freeze stands the work down – no stamp, no draw, and the standing wording', () => {
    const week = 1000
    const seed = seedHeard('t6-freeze', true, 'met', week, 2)
    expect(heardOn(week, { hired: true, rung: 2, focus: 'listen' }, seed), 'the control really reads her').toBe(true)
    expect(heardOn(week, { hired: true, rung: 2, focus: 'listen', college: true }, seed), 'pay nothing, receive nothing').toBeUndefined()
    expect(psychologistWorkingRung(posed(seed, week, { hired: true, rung: 2, focus: 'listen', college: true }), 'listen')).toBeUndefined()
  })

  it('⭐⭐ a booked family week stands it down too, and the week after it works again', () => {
    const week = 1000
    const seed = seedHeard('t6-holiday', true, 'met', week, 2)
    expect(heardOn(week, { hired: true, rung: 2, focus: 'listen', vacation: 1 }, seed), 'booked off').toBeUndefined()
    // the same seat, one week on, with the holiday behind her: the flag survived both stand-downs
    const world = posed(seed, week, { hired: true, rung: 2, focus: 'listen' }, 'quiet')
    world.vacations = [{ week: week - 1, packageId: 'beach', paidCents: 0 }]
    world.bond = bondFor('close')
    world.loveEpisodes = [episode(940, week)]
    deliverKnownPartner(world)
    expect(lifeLogOf(world)[0].heard, 'suspends, never cancels').toBe(true)
  })
})

// =================================================================================================
// G. THE REALISED CLARITY – inside the CI of the three ruled numbers (T10's grid owns the real bars)
// =================================================================================================
describe('wave 5 T6 G – the share of beats a coached parent reads plainly', () => {
  it('⭐⭐ each rung lands inside three standard errors of its own constant', () => {
    const N = 4000
    for (const rung of [0, 1, 2] as const) {
      const p = ECONOMY.psychologist.listenClarity[rung]
      const hits = Array.from({ length: N }, (_, i) => drawListenHeard(`t6-ci-${i}`, 'met', 1000, rung)).filter(Boolean).length
      const share = hits / N
      const sem = Math.sqrt((p * (1 - p)) / N)
      expect(Math.abs(share - p), `rung ${rung}: realised ${share.toFixed(4)} against ${p} (SEM ${sem.toFixed(4)})`)
        .toBeLessThan(3 * sem)
    }
  })

  it('⚠ and the ladder is monotone in the realised share, not only in the constant', () => {
    const N = 4000
    const shares = ([0, 1, 2] as const).map(
      (rung) => Array.from({ length: N }, (_, i) => drawListenHeard(`t6-ci-${i}`, 'ended', 1000, rung)).filter(Boolean).length / N,
    )
    expect(shares[0], `${shares.join(' < ')}`).toBeLessThan(shares[1])
    expect(shares[1], `${shares.join(' < ')}`).toBeLessThan(shares[2])
  })
})
