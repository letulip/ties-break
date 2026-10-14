// ⭐⭐⭐ ROUND 51 №8 (14.10) – «ASKING HER COACH WHY» OPENS THE READING OF THE PAIR, AND SHE SAYS HOW IT FEELS.
//
// The owner, on the small-talk beat where she asks whether her coach is any good: asked whether it is only a
// question or tied to the chemistry, was told it was only a question, and answered «вот жаль, что не привязан,
// потому что после такого очень хочется и мне понять "а он ок или не ок"». On 14.10: «давай по рекомендации».
//
// WHAT THIS FILE HOLDS (the mounted half is tests/component/r51-coach-real-hunch.test.ts):
//   A. the OPENED predicate's truth table – `view` in the stint that is running now opens; `more` / `easy`,
//      an older stint, nobody employed, another situation, a legacy row, an unanswered row do not
//   B. the READING – opened and below the bar shows the real number; closed or absent or someone else's pair
//      does not; and the coach's card and the season letter print the SAME value (the parity class)
//   C. ZERO draws and ZERO price – the answer is information, not a price (ruling V2)
//   D. HER HUNCH – exactly one line on exactly one reply of exactly one situation, true to the pair's band,
//      and every other situation x voice x stance byte-identical to what shipped
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real tree, RUN against this file and the mounted one together (28 tests,
// 20 + 8, green unmutated), RED MEASURED, and the file restored with its md5 checked identical (and the whole
// set checked identical after the last arm). Run on the FINAL layout of the code, 14.10:
//   A1  the stint ignored (`row.week > since` -> `row.week >= 0`)        RED 3  older stint · strict week · derivation
//   A2  the comparison made non-strict (`>` -> `>=`)                     RED 2  strict week · derivation
//   A3  any answer opens (the `view` test dropped)                       RED 3  more/easy · parity · mounted «a different answer»
//   A4  the nobody-employed guard removed                                RED 1
//   B1  the coach card's ring NOT routed through `chemistryReadingFor`   RED 3  memo question · parity · mounted ring
//   B2  the season letter NOT routed through it                          RED 1  parity
//   B3  the opening leaks to every coach, not the one in the chair       RED 2  chair only · mounted stranger
//   B4  an absent pair reads 0 when opened                               RED 1
//   C1  a MAIN draw added to the prompt's hunch read                     RED 1  no MAIN draw
//   D1  warm and cold swapped in `chemistryHunch`                        RED 4  bands · prompt reads the pair · mounted en + ru
//   D2  the hunch on every stance (the `respond` gate removed)           RED 3
//   D3  the hunch on every situation (the `coach-real` gate removed)     RED 1  the byte-identical sweep
//   D4  a hunch about nobody (no coach reads «even»)                     RED 1
//   D5  a pronoun and an exclamation mark in the table                   RED 4  table rules · mounted ru · both phone cases
//   E1  one Russian row deleted from src/i18n/ru.json                    RED 3  mounted ru · both Russian phone cases
//   plus an IN-TEST mutation in the mounted phone case (a hunch x60 on an unbounded card must make the fit assertion throw).
// ⚠ THE ONE DIGEST THAT MOVED, AND ITS CONTROL: tests/i18n-l3-5-life-beats.test.ts §8 PICK-STABILITY hashes the strings of
// two played careers; career 5/0 reads '913777ed' where '38f6336d' is pinned, because that career raised a coach-real card
// and its `view` reply now ends with the hunch. With the hunch switched off at its source the whole file is GREEN again
// (35 of 35), so the red is the hunch and nothing else (no pick key, draw count or pool order moved). NOT re-stamped here.
// ⚠ A BOUNDARY PINNED ON THE NAMED CONSTANTS: the band edges are read from `CHEMISTRY_HUNCH_*`, so retuning
// them moves the pin with them on purpose – the MEASUREMENT lives in tools/chemistry-bench.ts B13 and the
// spec amendment (docs/specs/the-chemistry-2026-09.md §16), not here.
// ⚠⚠ ROUND 52 F1 (14.10) – D IS RE-AIMED: THE PROMPT NOW READS HOW SHE FEELS, NOT THE RAW LEVEL. The `view` follow-up's band comes from
// `feelHunch(coachFeel(world))` (good and seems-good warm, off and seems-off cold, unsure and too-early even), so «the card leans the way the
// pair really leans» is now «the way her feel leans»: a CONFIDENT feel is confirmed by the gauge (chem past +-3), a HEDGED one may lean while
// the gauge still says «?». What changed in this file: the prompt case poses a STINT (the founding coach is `week` weeks old, so weeks together =
// the pose's week) instead of a level at week 30 – a clear level at 80 weeks is `good`/`off`, any level under six weeks is `too-early` – and a
// new test finds, by a fixed scan, careers whose TREND alone hedges warm or cold at week 13 with the gauge silent. `chemistryHunch` and its
// constants stay and are still pinned below: they are the feel's CONFIDENT line (`coachFeelStep`), no longer the prompt's reader. The copy
// arms (table rules, the byte-identical sweep, the mounted language cases) are untouched.
// MUTATION ARMS FOR THE RE-AIM (14.10, full table in tests/r52-coach-feel.test.ts): warm and cold swapped in `feelHunch` (M7) RED here 2 unit + 2 mounted; the hub
// reading the RAW level again (M13) RED here 2 – the prompt case and the hedged-feel case, which is the one that CANNOT be satisfied by a band of the level.
import { describe, it, expect } from 'vitest'
import {
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_STANCES,
  SMALL_TALK_STANCE_ID,
  TEMPERAMENTS,
  answerLifeBeat,
  buildSoftBeatInvite,
  coachSinceWeek,
  createWorld,
  hireCoach,
  lifeBeatFollowUps,
  raiseLifeBeat,
  settleStaffLetters,
  toSnapshot,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { chemistryReadingFor, coachReadingOpened } from '../src/engine/world/coachMarket'
import { coachFeel } from '../src/engine/world/coachFeel'
import { coachRealViewedSince } from '../src/engine/world/lifeBeat/smallTalk'
import { COACH_REAL_HUNCH, COACH_REAL_SITUATION_ID, smallTalkSituationIdOf } from '../src/engine/world/lifeBeat/smallTalkCopy'
import { CHEMISTRY_HUNCH_COLD_AT, CHEMISTRY_HUNCH_WARM_AT, chemistryHunch, chemistryReadableAt, chemistryReading, type ChemistryHunch } from '../src/engine/chemistry'
import { staffLetters } from '../src/engine/offers'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type StaffLetterTerms } from '../src/shared/protocol'

const COACH_REAL = SMALL_TALK_SITUATIONS.find((s) => s.id === COACH_REAL_SITUATION_ID)
if (COACH_REAL === undefined) throw new Error('the corpus has no coach-real situation – the hunch has nothing to hang on')
const DETAIL = `${COACH_REAL.subject}:${COACH_REAL.id}`
const VIEW = SMALL_TALK_STANCE_ID.respond
const BANDS: readonly ChemistryHunch[] = ['warm', 'even', 'cold']

/** A career with a coach on the payroll, standing in week `week` (the stint is then 0 -> never changed). */
function posed(seed: string, week = 30): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = week
  if (world.coachId === null) throw new Error('this profile is supposed to start with a coach on the payroll')
  return world
}
const coachOf = (world: WorldState): string => {
  if (world.coachId === null) throw new Error('no coach')
  return world.coachId
}
/** a hireable stranger – the same recipe tests/component/r51-chemistry-info.test.ts uses */
const strangerOf = (world: WorldState): string => {
  const row = toSnapshot(world).coachMarket.find((r) => !r.current && r.lockedPoints === null)
  if (row === undefined) throw new Error('no hireable stranger on this board')
  return row.id
}
/** she raises the situation and the parent answers it (or leaves it) – the REAL commands, week = world.week */
function asked(world: WorldState, answer: string | null, detail = DETAIL): void {
  raiseLifeBeat(world, 'small-talk', detail)
  if (answer !== null) answerLifeBeat(world, answer)
}
const pairOf = (chem: number) => ({ chem, phase: 0, standing: 0 })

// =================================================================================================
// A. THE OPENED PREDICATE
// =================================================================================================
describe('round 51 №8 A – when is the reading opened', () => {
  it('⭐ `view` on coach-real in the stint that is running opens it – and never before she is asked', () => {
    const world = posed('r51-8-open')
    expect(coachReadingOpened(world), 'nothing asked yet').toBe(false)
    asked(world, null)
    expect(coachReadingOpened(world), 'asked and not answered').toBe(false)
    answerLifeBeat(world, VIEW)
    expect(coachReadingOpened(world)).toBe(true)
  })

  it('`more` and `easy` open nothing – only the parent who decides to ask the coach why has earned it', () => {
    for (const stance of SMALL_TALK_STANCES.filter((s) => s !== 'respond')) {
      const world = posed(`r51-8-${stance}`)
      asked(world, SMALL_TALK_STANCE_ID[stance])
      expect(coachReadingOpened(world), `${stance} (${SMALL_TALK_STANCE_ID[stance]})`).toBe(false)
    }
  })

  it('⭐ an answer from BEFORE the coach changed does not open the new coach – the question was about the person she had then', () => {
    const world = posed('r51-8-older-stint')
    asked(world, VIEW)
    expect(coachReadingOpened(world)).toBe(true)
    world.week = 40
    hireCoach(world, strangerOf(world))
    expect(coachSinceWeek(world), 'the hire is stamped with the week the world stands in').toBe(40)
    expect(coachReadingOpened(world), 'the old stint\'s answer is closed').toBe(false)
    // ...and the NEW stint can be asked again: a later tick's row is this coach's.
    world.week = 44
    asked(world, VIEW)
    expect(coachReadingOpened(world)).toBe(true)
  })

  it('⚠ THE WEEK COMPARISON IS STRICT: a row raised in the week a coach arrived was raised BEFORE them', () => {
    // The tick adds its week first and raises its beats after; a hire is a command stamped with the week the
    // world is then standing in. So the same number on both sides means «she asked, then they changed coach».
    const same = posed('r51-8-same-week')
    asked(same, VIEW)
    hireCoach(same, strangerOf(same)) // same week 30
    expect(coachSinceWeek(same)).toBe(30)
    expect(coachReadingOpened(same), 'asked in week 30, hired in week 30 – the asking came first').toBe(false)

    const later = posed('r51-8-next-tick')
    hireCoach(later, strangerOf(later)) // hired in week 30
    later.week = 31 // the next tick raises her beat
    asked(later, VIEW)
    expect(coachReadingOpened(later), 'raised in the tick after the hire – asked of this coach').toBe(true)
  })

  it('nobody employed is never opened – the parent on the court has no pair to read', () => {
    const world = posed('r51-8-nobody')
    world.week = 25
    hireCoach(world, null)
    expect(world.coachId).toBeNull()
    world.week = 30
    asked(world, VIEW)
    expect(coachReadingOpened(world)).toBe(false)
  })

  it('another situation answered `view` opens nothing, and neither does a legacy row', () => {
    const other = SMALL_TALK_SITUATIONS.find((s) => s.id !== COACH_REAL_SITUATION_ID)!
    const world = posed('r51-8-other-situation')
    asked(world, VIEW, `${other.subject}:${other.id}`)
    expect(coachReadingOpened(world), `${other.subject}:${other.id} answered view`).toBe(false)
    const legacy = posed('r51-8-legacy')
    asked(legacy, VIEW, 'worry')
    expect(coachReadingOpened(legacy), 'a legacy row names no situation').toBe(false)
    expect(smallTalkSituationIdOf('worry')).toBeNull()
    expect(smallTalkSituationIdOf(DETAIL)).toBe(COACH_REAL_SITUATION_ID)
  })

  it('it is a derivation: the same world reads the same, and the scan only looks at rows after the stint it is handed', () => {
    const world = posed('r51-8-derived')
    asked(world, VIEW)
    expect(coachRealViewedSince(world, 29)).toBe(true)
    expect(coachRealViewedSince(world, 30), 'strict').toBe(false)
    expect(coachReadingOpened(world)).toBe(coachReadingOpened(world))
  })
})

// =================================================================================================
// B. THE READING, AND THE PARITY OF THE TWO SURFACES THAT PRINT IT
// =================================================================================================
describe('round 51 №8 B – the reading', () => {
  it('⭐ opened and below the bar shows the real number, signed; closed shows nothing; absent stays nothing', () => {
    const world = posed('r51-8-reading')
    const id = coachOf(world)
    // 0.4 is under the lowest bar a pair can draw (1), so it is unreadable on every seed.
    expect(chemistryReadableAt(world.seed, id)).toBeGreaterThanOrEqual(1)
    world.coachPairs[id] = pairOf(0.4)
    expect(chemistryReadingFor(world, id), 'closed: the old bar answers').toBeNull()
    asked(world, VIEW)
    expect(chemistryReadingFor(world, id), 'opened: the number').toBe(0.4)
    world.coachPairs[id] = pairOf(-0.4)
    expect(chemistryReadingFor(world, id), 'the sign is the content').toBe(-0.4)
    delete world.coachPairs[id]
    expect(chemistryReadingFor(world, id), 'opened but no pair on the books: nothing to read').toBeNull()
  })

  it('opening is for the coach in the chair only – a stranger\'s pair keeps the old bar', () => {
    const world = posed('r51-8-only-hers')
    const stranger = strangerOf(world)
    world.coachPairs[stranger] = pairOf(0.4)
    asked(world, VIEW)
    expect(coachReadingOpened(world)).toBe(true)
    expect(chemistryReadingFor(world, stranger)).toBeNull()
    expect(toSnapshot(world).coachMarket.find((r) => r.id === stranger)!.chemistry).toBeNull()
  })

  it('a readable pair reads exactly as it always did, opened or not', () => {
    const world = posed('r51-8-readable')
    const id = coachOf(world)
    world.coachPairs[id] = pairOf(40)
    const bare = chemistryReading(world.coachPairs[id], world.seed, id)
    expect(bare).toBe(40)
    expect(chemistryReadingFor(world, id)).toBe(bare)
    asked(world, VIEW)
    expect(chemistryReadingFor(world, id)).toBe(bare)
  })

  it('⭐ THE MEMO QUESTION: the coach card shows the opened number on the FIRST snapshot after the answer, on the same world', () => {
    // Coach-market rows are built fresh by `toSnapshot` (`world/snapshot.ts` memoises the rated field and the
    // tournament preview only). This holds that finding: one world, a snapshot cut before and after.
    const world = posed('r51-8-memo')
    const id = coachOf(world)
    world.coachPairs[id] = pairOf(0.4)
    asked(world, null)
    const before = toSnapshot(world).coachMarket.find((r) => r.current)!
    expect(before.chemistry, 'asked, not yet answered').toBeNull()
    expect(before.chemistryKnown).toBe(true)
    answerLifeBeat(world, VIEW)
    const after = toSnapshot(world).coachMarket.find((r) => r.current)!
    expect(after.chemistry, 'the very next snapshot').toBe(0.4)
  })

  it('⭐ PARITY: the coach card and the season letter print the same value, opened and closed', () => {
    const wrap = WEEKS_PER_YEAR * 4 + 49
    const build = (answer: string | null): WorldState => {
      const world = createWorld('r51-8-parity', DEFAULT_PROFILE)
      world.bestFinishByTier.w15 = 0
      world.week = wrap
      world.seasonHistory.push({
        seasonIndex: 4,
        endRank: 60,
        points: 400,
        wins: 31,
        losses: 14,
        fundsDeltaCents: 0,
        endFundsCents: 0,
        byTrack: {
          domestic: { points: 10, wins: 1, losses: 1, endRank: 40 },
          itf: { points: 90, wins: 10, losses: 5, endRank: 60 },
          wta: { points: 300, wins: 20, losses: 8, endRank: 120 },
        },
      })
      world.coachPairs[coachOf(world)] = pairOf(0.4)
      if (answer !== null) asked(world, answer)
      return world
    }
    const letterChem = (world: WorldState): number | undefined => {
      settleStaffLetters(world)
      const found = staffLetters(world.offers).find((o) => (o.terms as StaffLetterTerms).seat === 'coach')
      if (found === undefined) throw new Error('the wrap-up wrote no coach letter')
      return (found.terms as StaffLetterTerms).chem
    }
    for (const answer of [VIEW, SMALL_TALK_STANCE_ID.invite, null]) {
      const world = build(answer)
      const ring = toSnapshot(world).coachMarket.find((r) => r.current)!.chemistry
      const letter = letterChem(world)
      expect(letter ?? null, `answer ${answer}: the letter reads what the ring reads`).toBe(ring)
      expect(ring).toBe(chemistryReadingFor(world, coachOf(world)))
      expect(ring, `answer ${answer}`).toBe(answer === VIEW ? 0.4 : null)
    }
  })
})

// =================================================================================================
// C. ZERO DRAWS, ZERO PRICE
// =================================================================================================
describe('round 51 №8 C – information, not a price', () => {
  it('⭐ no MAIN draw: the stream is identical with and without the answered row, across snapshot and prompt builds', () => {
    const quiet = posed('r51-8-zero')
    const asker = posed('r51-8-zero')
    asked(asker, VIEW)
    const at = JSON.stringify(asker.rngMain)
    for (let i = 0; i < 3; i++) {
      toSnapshot(asker)
      buildSoftBeatInvite(asker)
    }
    expect(JSON.stringify(asker.rngMain), 'building the card and the snapshot drew nothing').toBe(at)
    expect(at, 'and answering drew nothing either: the same stream as the career that never asked').toBe(JSON.stringify(quiet.rngMain))
  })

  it('the answer moves nothing else: bond, spirit and cash are those of the `more` answer (ruling V2)', () => {
    const run = (stance: string) => {
      const world = posed('r51-8-price')
      asked(world, stance)
      return JSON.stringify({ bond: world.bond, spirit: world.spirit, funds: world.fundsCents })
    }
    expect(run(VIEW)).toBe(run(SMALL_TALK_STANCE_ID.invite))
    expect(run(VIEW)).toBe(run(SMALL_TALK_STANCE_ID.space))
  })
})

// =================================================================================================
// D. HER HUNCH
// =================================================================================================
describe('round 51 №8 D – her hunch', () => {
  it('the bands: warm from the named edge up, cold from its mirror down, even between; a coach with no row is even', () => {
    expect(chemistryHunch(CHEMISTRY_HUNCH_WARM_AT)).toBe('warm')
    expect(chemistryHunch(CHEMISTRY_HUNCH_WARM_AT - 0.01)).toBe('even')
    expect(chemistryHunch(0)).toBe('even')
    expect(chemistryHunch(CHEMISTRY_HUNCH_COLD_AT + 0.01)).toBe('even')
    expect(chemistryHunch(CHEMISTRY_HUNCH_COLD_AT)).toBe('cold')
    expect(chemistryHunch(70)).toBe('warm')
    expect(chemistryHunch(-70)).toBe('cold')
    expect(chemistryHunch(undefined)).toBe('even')
    // The edge sits above the largest bar a pair can draw, so a hunch never leans on a pair the ring calls unreadable.
    expect(CHEMISTRY_HUNCH_WARM_AT).toBeGreaterThan(2.5)
    expect(CHEMISTRY_HUNCH_COLD_AT).toBeLessThan(-2.5)
  })

  it('the table: 4 voices x 3 bands, all different within a voice, and the copy rules the corpus keeps', () => {
    for (const voice of TEMPERAMENTS) {
      const lines = BANDS.map((b) => COACH_REAL_HUNCH[voice][b])
      expect(new Set(lines).size, `${voice}: three bands, three lines`).toBe(3)
      for (const line of lines) {
        expect(line.length, `${voice}`).toBeGreaterThan(0)
        expect(line, `${voice}: no exclamation mark`).not.toContain('!')
        expect(line, `${voice}: no digits`).not.toMatch(/\d/)
        expect(line, `${voice}: the short dash, never the long one`).not.toContain('—')
        expect(line, `${voice}: the coach is never pronoun-ed`).not.toMatch(/\b(he|his|him|himself)\b/i)
      }
    }
  })

  it('⭐ coach-real `view` gains EXACTLY ONE line – the table cell for (voice, band) – and nothing else on any reply moves', () => {
    for (const voice of TEMPERAMENTS) {
      const base = lifeBeatFollowUps('small-talk', DETAIL, voice, 'close')
      expect(base.map((f) => f.optionId)).toEqual(SMALL_TALK_STANCES.map((s) => SMALL_TALK_STANCE_ID[s]))
      for (const band of BANDS) {
        const got = lifeBeatFollowUps('small-talk', DETAIL, voice, 'close', band)
        const view = got.find((f) => f.optionId === VIEW)!
        const was = base.find((f) => f.optionId === VIEW)!
        expect(view.said, `${voice}/${band}`).toEqual([...was.said, COACH_REAL_HUNCH[voice][band]])
        expect(view.said.length).toBe(was.said.length + 1)
        expect(view.saidC, 'each paragraph is a seat: the string is its own catalog key').toEqual(view.said.map((k) => ({ k })))
        expect(view.done).toBe(was.done)
        expect(got.filter((f) => f.optionId !== VIEW), `${voice}/${band}: more and easy are byte-identical`).toEqual(base.filter((f) => f.optionId !== VIEW))
      }
      expect(lifeBeatFollowUps('small-talk', DETAIL, voice, 'close', null), 'no hunch given: the card that shipped').toEqual(base)
    }
  })

  it('⭐ EVERY OTHER situation x voice x stance is byte-identical, whatever hunch is handed in', () => {
    let cells = 0
    for (const s of SMALL_TALK_SITUATIONS.filter((x) => x.id !== COACH_REAL_SITUATION_ID)) {
      for (const voice of TEMPERAMENTS) {
        const detail = `${s.subject}:${s.id}`
        const base = lifeBeatFollowUps('small-talk', detail, voice, 'close')
        for (const hunch of [null, ...BANDS]) {
          expect(lifeBeatFollowUps('small-talk', detail, voice, 'close', hunch), `${detail}/${voice}/${hunch}`).toEqual(base)
          cells += 1
        }
      }
    }
    expect(cells, 'the sweep is not vacuous: every other situation x 4 voices x 4 hunch states').toBe((SMALL_TALK_SITUATIONS.length - 1) * TEMPERAMENTS.length * 4)
    expect(SMALL_TALK_SITUATIONS.length, 'and the corpus is big enough for the sweep to mean something').toBeGreaterThan(40)
    // a legacy row and every other kind
    expect(lifeBeatFollowUps('small-talk', 'worry', 'sunny', 'close', 'warm')).toEqual([])
    expect(lifeBeatFollowUps('fork-opinion', 'tour', 'sunny', 'close', 'warm')).toEqual(lifeBeatFollowUps('fork-opinion', 'tour', 'sunny', 'close'))
    expect(lifeBeatFollowUps('met', 'x', 'sunny', 'close', 'cold')).toEqual([])
  })

  it('⭐ THE PROMPT READS HER FEEL: the card the engine assembles leans the way she feels, in every voice (a clear level after a season-and-a-half or on a coach hired back, and nothing before six weeks while the gauge is quiet)', () => {
    // [level on the books, weeks together (= the pose's week: a founding coach has been here since week 0), the band her feel gives]
    const cases: [number, number, ChemistryHunch][] = [
      [9, 80, 'warm'], //   a clear warm level after 80 weeks: `good`
      [-9, 80, 'cold'], //  ...and a clear cold one: `off`
      [0.4, 3, 'even'], //  under six weeks she has nothing to say, whatever the pair – while the gauge is QUIET
      // ⚠ F1b (14.10): these two used to read 'even' («even if a level were somehow already on the books»). A level of ±9 is a gauge past the hunch line, and a gauge that speaks
      // clearly outranks the clock: a coach hired back keeps the pair and restarts the stint, and ±9 on the books at week 3 is exactly that case. She reads it at once.
      [9, 3, 'warm'],
      [-9, 3, 'cold'],
    ]
    for (const voice of TEMPERAMENTS as readonly Temperament[]) {
      for (const [chem, weeks, band] of cases) {
        const world = posed(`r51-8-prompt-${voice}-${chem}-${weeks}`, weeks)
        world.temperament = voice
        world.coachPairs[coachOf(world)] = pairOf(chem)
        asked(world, null)
        const invite = buildSoftBeatInvite(world)
        if (invite === null) throw new Error('no soft card for the raised row')
        const view = invite.prompt.followUps.find((f) => f.optionId === VIEW)!
        expect(view.said.at(-1), `${voice} chem ${chem} at week ${weeks}`).toBe(COACH_REAL_HUNCH[voice][band])
        const others = invite.prompt.followUps.filter((f) => f.optionId !== VIEW)
        const shipped = lifeBeatFollowUps('small-talk', DETAIL, voice, 'close').filter((f) => f.optionId !== VIEW)
        expect(others.map((f) => f.said), 'the other two replies are the ones that shipped').toEqual(shipped.map((f) => f.said))
        for (const o of others) expect(o.said.join(' '), 'no hunch line on the other two').not.toContain(COACH_REAL_HUNCH[voice][band])
      }
    }
  })

  it('⭐ ROUND 52 – A HEDGED FEEL LEANS HER LINE WHILE THE GAUGE STILL SAYS «?»: the trend alone, at a level under every bar, tips the card warm or cold', () => {
    // 0.4 is under the lowest bar a pair can draw (1), so the ring is unreadable on every seed and the ROUND-51 rule (a band of the raw level)
    // could only ever say «even» here. Round 52's feel can say more: «вроде нормально, но» – and the gauge is what confirms or refutes it later.
    const found: { warm?: string; cold?: string } = {}
    for (let i = 0; i < 80 && (found.warm === undefined || found.cold === undefined); i++) {
      const world = posed(`r52-hedge-${i}`, 13)
      world.coachPairs[coachOf(world)] = pairOf(0.4)
      const feel = coachFeel(world)
      if (feel === 'seems-good' && found.warm === undefined) found.warm = world.seed
      if (feel === 'seems-off' && found.cold === undefined) found.cold = world.seed
    }
    expect(found.warm, 'the fixed scan finds a career whose trend hedges good at week 13').toBeDefined()
    expect(found.cold, 'and one that hedges off').toBeDefined()
    for (const [band, seed] of [['warm', found.warm!], ['cold', found.cold!]] as const) {
      const world = posed(seed, 13)
      const id = coachOf(world)
      world.coachPairs[id] = pairOf(0.4)
      expect(chemistryReading(world.coachPairs[id], world.seed, id), 'the gauge is silent').toBeNull()
      expect(chemistryHunch(0.4), 'and the old rule reads «even» on this level').toBe('even')
      asked(world, null)
      const voice = world.temperament ?? 'sunny'
      const view = buildSoftBeatInvite(world)!.prompt.followUps.find((f) => f.optionId === VIEW)!
      expect(view.said.at(-1), `${seed}: the card leans ${band}`).toBe(COACH_REAL_HUNCH[voice][band])
    }
  })

  it('a coach with no row on the books yet reads even; with nobody employed there is no hunch at all', () => {
    // ROUND 52: «no row on the books» is the first paid week, which is also the first six weeks of the stint, so the case is posed as a coach she has
    // known three weeks – `too-early`, hence «even». (The same absent pair after a long stint reads chem 0 and her trend: `tests/r52-coach-feel.test.ts`.)
    const fresh = posed('r51-8-fresh-coach', 3)
    delete fresh.coachPairs[coachOf(fresh)]
    asked(fresh, null)
    const voice = fresh.temperament ?? 'sunny'
    expect(buildSoftBeatInvite(fresh)!.prompt.followUps.find((f) => f.optionId === VIEW)!.said.at(-1)).toBe(COACH_REAL_HUNCH[voice].even)

    const alone = posed('r51-8-no-coach')
    alone.week = 25
    hireCoach(alone, null)
    alone.week = 30
    asked(alone, null)
    const view = buildSoftBeatInvite(alone)!.prompt.followUps.find((f) => f.optionId === VIEW)!
    const bare = lifeBeatFollowUps('small-talk', DETAIL, alone.temperament ?? voice, 'close').find((f) => f.optionId === VIEW)!
    expect(view.said, 'a hunch about nobody is no hunch: the shipped reply').toEqual(bare.said)
  })
})
