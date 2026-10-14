// ROUND 52 J1 (14.10) – THE CHECKPOINT THE BOND SHUT, AND THE SILENCE THAT SHOWS.
//
// THE OWNER approved «давай по рекомендациям» (round 52, his answers on the close №1): at a strained or cold bond she does not confide at a stint checkpoint either – the checkpoint talk keeps the bond gate every
// small talk has – AND THE SILENCE SHOWS: a checkpoint the bond shuts leaves a note in the parent's voice on the week's diary scrap, so the player sees what the relationship cost.
//
// WHAT THIS HOLDS, in the order the change was built (docs/specs/small-talk-corpus-2026-09.md, «Round 52 J1»):
//   A. THE FACT      `coachTalkShut` is present on EXACTLY ONE week of a shut checkpoint's window – the first on which the line could be heard (J1b, 14.10; J1 had the window's first week alone) – once per checkpoint, at strained and cold,
//                    and absent when the checkpoint was spoken, at steady and close, on the other window weeks, before week 12 and with nobody employed. It is ABSENT as a key, not undefined-valued. ⚠ In the BARE worlds of this
//                    section no week is away, so the first free week IS the checkpoint week and J1's arms hold as they were; section F poses the away weeks.
//   B. THE SPELLING  «does the bond let her confide» is ONE answer: move the table and the lottery's gate, the checkpoint talk and the fact move together. A BEHAVIOUR test, not a source pin.
//   C. THE LINES     four lines, two per band, their words held as DATA (an oracle read back from the source is a pin that cannot fail); at cold none carries a quotation mark of hers; the coach is never gendered.
//   D. THE LEAD      on the fact's week the silence lines are the pool and the one-in-three coin does not silence it; every OTHER week's coin is exactly the coin it was.
//   E. REAL CAREERS  posed (the bond held for 60 weeks of a stint) and played (the bond left to move): the measurement of the spec's addendum, behind R52_J1_REPORT=1 at scale. ⚠ RE-AIMED BY J1b (14.10): the posed arm reads all four
//                    weeks of every window, and the played arm holds the CAP ORACLE (an earlier week read now from the capped feed = that week read on the day).
//   F. J1b           the fact WAITS for the first week the line can be heard: travel at the window's first week moves the note to the first free week; a window with no free week prints nothing; after the note's week the fact is
//                    absent for the rest of the window (once); a checkpoint spoken inside the window clears it; a refunded trip is a free week and a played tournament is not (one spelling, the diary's own).
//
// ⚠ EVERY ARM IS PROVEN BY MUTATION in the builder's report: drop the bond clause from the fact (A and B go red), drop the lead (D goes red), drop the coin exemption (D goes red) – each restored byte for byte.
// ⚠ J1b's THREE, each proven red and restored byte for byte: drop clause (c) – no earlier hearable week (F goes red: the fact on every later free week, twice per checkpoint); drop clause (b) – the week itself hearable
// (F goes red: the fact on the away weeks); widen the window's bound by one week (F goes red: the all-away window prints on its fifth week).
import { afterAll, describe, expect, it } from 'vitest'
import { WEEK_NOTE_CHANCE, WEEK_NOTES, weekNoteFor } from '../src/engine/diary'
import { COACH_FEEL } from '../src/engine/chemistry'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { bondBandOf } from '../src/engine/spirit'
import { createWorld, hireCoach, lifeLogOf, rollSmallTalk, toSnapshot, type WorldState } from '../src/engine/world'
import { coachSinceWeek } from '../src/engine/world/coachStint'
import { coachTalkCheckpointAt } from '../src/engine/world/coachFeel'
import { KID_ID } from '../src/engine/world/constants'
import { weekAwayOf } from '../src/engine/diary/weekAway'
import { notTravellingWeek } from '../src/engine/diary/weekNotes'
import { COACH_TALK_CHECKPOINT_ROWS, coachTalkCheckpointDue, coachTalkShutRead, smallTalkEligible } from '../src/engine/world/lifeBeat/smallTalk'
import { smallTalkSituationIdOf } from '../src/engine/world/lifeBeat/smallTalkCopy'
import { DEFAULT_PROFILE, type BondBand, type DiaryFacts } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { openCareer, POLICIES, PRESETS, stepCareerWeek } from '../tools/econ-bench'
import { bondFor } from './helpers/schoolTranche'

const REPORT = process.env.R52_J1_REPORT === '1'

type Shut = 'strained' | 'cold'
const SHUT: readonly Shut[] = ['strained', 'cold']
const OPEN: readonly BondBand[] = ['steady', 'close']
const CHECKPOINTS: readonly number[] = [12, 32, 56]
/** J1b – `heardAt` for the BARE worlds of A and B, where nothing is away and every week is a table: «the line can be heard» everywhere, so the first free week of a window is its first week (J1's rule, as a special case). Section F poses the away weeks through the real snapshot. */
const FREE = (): boolean => true

/** The four lines as DATA, copied here and not read back from the source: an oracle that moves with the string it checks is a pin that cannot fail (CLAUDE.md invariant 4). */
const LINES: Record<Shut, readonly string[]> = {
  strained: ['Asked about the coach, she said: "Fine." Nothing after it.', 'She did not mention the coach once. We did not know how to ask.'],
  cold: ['The coach was not mentioned. She had closed up, and we left it alone.', 'Dinner was quiet. Whatever she thinks of the coach, she kept it to herself.'],
}
const ALL_LINES: readonly string[] = [...LINES.strained, ...LINES.cold]

/** A coached world on week 0: the founding coach on the payroll (a stint that began at week 0, so weeks together are the week), an empty life log, the bond posed in `band`. */
function coached(seed: string, band: BondBand): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.temperament = 'fiery'
  world.lifeLog = []
  world.bond = bondFor(band)
  if (world.coachId === null) throw new Error('this profile is supposed to start with a coach on the payroll')
  return world
}

// =================================================================================================
// A. THE FACT
// =================================================================================================
// ⚠ J1b, 14.10 – RE-AIMED. J1's arms said «present on exactly the first week»; the rule is now «on the first week of the window on which the line could be heard». In these worlds nothing is away (no events, school age, no injury), so that week
// IS the first and every arm below holds as it was written, with `FREE` standing for «heard everywhere». The away weeks are section F's.
describe('R52 J1 A – the fact: present on exactly one week of a shut checkpoint (in a bare world the first), and nowhere else', () => {
  it('⭐⭐⭐ present on the checkpoint week and on no other week of its window, nor before it, nor after – at strained and cold, through the snapshot as well', () => {
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) {
        const world = coached(`r52-j1-timing-${band}-${cp}`, band)
        for (let week = cp - 2; week <= cp + 6; week++) {
          world.week = week
          const where = `${band} / checkpoint ${cp} / week ${week}`
          expect(coachTalkShutRead(world, FREE), where).toBe(week === cp ? band : null)
          const facts = toSnapshot(world).diary.facts
          expect(facts.coachTalkShut, where).toBe(week === cp ? band : undefined)
          if (week !== cp) expect('coachTalkShut' in facts, `${where}: the key is ABSENT, not undefined-valued`).toBe(false)
        }
      }
    }
  })

  it('⭐⭐ once per checkpoint by construction: over 80 weeks of a stint a shut bond carries the fact exactly three times, and a steady or close one never does', () => {
    for (const band of [...SHUT, ...OPEN] as const) {
      const world = coached(`r52-j1-once-${band}`, band)
      const weeks: number[] = []
      for (let week = 0; week <= 80; week++) {
        world.week = week
        const read = coachTalkShutRead(world, FREE)
        if (read !== null) weeks.push(week)
        // the open bands are read through the snapshot at the checkpoint weeks too: no key at all
        if (OPEN.includes(band) && CHECKPOINTS.includes(week)) expect('coachTalkShut' in toSnapshot(world).diary.facts, `${band} / week ${week}`).toBe(false)
      }
      expect(weeks, band).toEqual(OPEN.includes(band) ? [] : [...CHECKPOINTS])
    }
  })

  it('⭐⭐ absent when the checkpoint was spoken (and present for a row from before the window – the control), before week 12, and with nobody employed', () => {
    const cp = 32
    const ids = COACH_TALK_CHECKPOINT_ROWS[cp] ?? []
    const detail = `observation:${ids[0]}`
    expect(smallTalkSituationIdOf(detail), 'the fixture detail is read as the checkpoint\'s own situation').toBe(ids[0])
    for (const band of SHUT) {
      const spoken = coached(`r52-j1-spoken-${band}`, band)
      spoken.week = cp
      spoken.lifeLog = [{ week: cp, kind: 'small-talk', detail, answer: 'easy' }]
      expect(coachTalkCheckpointDue(spoken), `${band}: the checkpoint is spoken`).toBeNull()
      expect(coachTalkShutRead(spoken, FREE), `${band}: spoken`).toBeNull()

      const before = coached(`r52-j1-before-${band}`, band)
      before.week = cp
      before.lifeLog = [{ week: cp - 1, kind: 'small-talk', detail, answer: 'easy' }]
      expect(coachTalkShutRead(before, FREE), `${band}: a row raised before the window is not this checkpoint's talk (the control)`).toBe(band)

      const young = coached(`r52-j1-young-${band}`, band)
      for (let week = 0; week < 12; week++) {
        young.week = week
        expect(coachTalkShutRead(young, FREE), `${band}: week ${week}, before the first checkpoint`).toBeNull()
      }

      const nobody = coached(`r52-j1-nobody-${band}`, band)
      hireCoach(nobody, null)
      expect(nobody.coachId, 'the coach is released').toBeNull()
      for (const w of CHECKPOINTS) {
        nobody.week = w
        expect(coachTalkShutRead(nobody, FREE), `${band}: nobody employed, week ${w}`).toBeNull()
      }
    }
  })
})

// =================================================================================================
// B. ONE SPELLING
// =================================================================================================
describe('R52 J1 B – «does the bond let her confide» is ONE answer', () => {
  it('⭐⭐⭐ move the table and the three readers move together: the lottery\'s gate, the checkpoint talk and the fact', () => {
    const table = ECONOMY.life.smallTalkPerWeek as Record<BondBand, number>
    const saved = table.strained
    const read = (chance: number, k: number): { eligible: boolean; fact: string | null; raised: boolean; checkpoint: boolean } => {
      table.strained = chance
      const world = coached(`r52-j1-spelling-${chance}-${k}`, 'strained')
      world.week = 12
      world.coachPairs[world.coachId as string] = { chem: 12, phase: 0, standing: 0 }
      const eligible = smallTalkEligible(world)
      const fact = coachTalkShutRead(world, FREE)
      const before = lifeLogOf(world).length
      rollSmallTalk(world)
      const log = lifeLogOf(world)
      const row = log.length > before ? log[log.length - 1]! : null
      // ⚠ the row must be the CHECKPOINT's own: with the lottery's die at 0.5 an ordinary row can land by chance, and that would not be the clause under test
      return { eligible, fact, raised: row !== null, checkpoint: row !== null && (COACH_TALK_CHECKPOINT_ROWS[12] ?? []).includes(smallTalkSituationIdOf(row.detail) ?? '') }
    }
    try {
      // twelve worlds, not one: a re-spelled clause could still meet a row by luck in any single world (the lottery's die is 0.5 here), but not in all twelve
      for (let k = 0; k < 12; k++) {
        expect(read(0, k), `world ${k}: strained as shipped – the gate shut, the talk not raised, the silence carried`).toEqual({ eligible: false, fact: 'strained', raised: false, checkpoint: false })
        expect(read(0.5, k), `world ${k}: strained opened in the table – the gate open, the CHECKPOINT talk raised, no silence`).toEqual({ eligible: true, fact: null, raised: true, checkpoint: true })
        expect(read(0, k), `world ${k}: and shut again`).toEqual({ eligible: false, fact: 'strained', raised: false, checkpoint: false })
      }
    } finally {
      table.strained = saved
    }
    expect(table.strained, 'the table is put back').toBe(0)
  })
})

// =================================================================================================
// C. THE LINES
// =================================================================================================
describe('R52 J1 C – the four lines', () => {
  const carriers = WEEK_NOTES.filter((n) => n.claims.coachTalkShut !== undefined)

  it('exactly four, two per band, once each in the pool, every one a house line about the table', () => {
    expect(carriers, 'exactly the four').toHaveLength(4)
    for (const band of SHUT) {
      expect(carriers.filter((n) => n.claims.coachTalkShut === band).map((n) => n.text), band).toEqual([...LINES[band]])
    }
    const statics = WEEK_NOTES.map((n) => n.text).filter((t): t is string => typeof t === 'string')
    for (const t of ALL_LINES) expect(statics.filter((x) => x === t), `"${t}" must be in the pool exactly once`).toHaveLength(1)
    for (const n of carriers) {
      expect(n.claims.domestic, `"${n.text}" watches her at the table: a house line`).toBe(true)
      expect(n.claims.notTravellingWeek, `"${n.text}" is licensed on a week she did not travel`).toBe(true)
    }
  })

  it('the scrap and the voice: inside 80 characters, no contraction, no long dash, no exclamation, third person, the coach a noun and never a pronoun', () => {
    for (const t of ALL_LINES) {
      expect(t.length, `"${t}"`).toBeLessThanOrEqual(80)
      expect(t, `"${t}" has a contraction`).not.toMatch(/\b\w+'(s|t|re|ll|ve|d|m)\b/i)
      expect(t, `"${t}" has the long dash`).not.toContain('—')
      expect(t, `"${t}" has an exclamation mark`).not.toContain('!')
      expect(t, `"${t}" is not about her`).toMatch(/\b(she|her)\b/i)
      expect(t, `"${t}" names the coach with a pronoun (R15-7)`).not.toMatch(/\b(he|him|his|himself)\b/i)
      expect(t, `"${t}" must name the coach as a noun`).toMatch(/\bthe coach\b/i)
    }
  })

  it('⭐⭐ the flat pool\'s doctrine: at COLD no line carries a quotation mark of hers; at STRAINED only the flat pool\'s own shape does', () => {
    const QUOTE = /["“”«»]/
    for (const t of LINES.cold) expect(t, `a cold line quotes her: "${t}"`).not.toMatch(QUOTE)
    for (const n of carriers.filter((x) => x.claims.coachTalkShut === 'cold')) expect(String(n.text), 'the pool\'s cold line').not.toMatch(QUOTE)
    const quoting = LINES.strained.filter((t) => QUOTE.test(t))
    expect(quoting, 'exactly one strained line quotes her').toEqual(['Asked about the coach, she said: "Fine." Nothing after it.'])
    expect(quoting[0], 'and it is the flat pool\'s shape: one flat word, nothing after it').toMatch(/^Asked about the coach, she said: "Fine\." Nothing after it\.$/)
  })
})

// =================================================================================================
// D. THE LEAD AND THE COIN
// =================================================================================================
describe('R52 J1 D – the silence leads the week, and the coin does not silence it', () => {
  /** The diary facts of a REAL shut checkpoint's first week (week 12 of the stint), normalised to a plain training week at the table – so the licence is the fact's and nothing else's. */
  function tableWeek(band: Shut, extra: Partial<DiaryFacts> = {}): DiaryFacts {
    const world = coached(`r52-j1-table-${band}`, band)
    world.week = 12
    const facts = toSnapshot(world).diary.facts
    const plain: Partial<DiaryFacts> = {
      playedTournament: false,
      travelled: false,
      travelHomeScene: null,
      injured: null,
      knockChoice: null,
      examsWeek: false,
      offSeasonWeek: false,
      vacationWeek: false,
      playedPractice: false,
      lifeStage: 'school',
      schoolOver: false,
    }
    const week: DiaryFacts = { ...facts, ...plain, ...extra }
    return week
  }
  const SEEDS = Array.from({ length: 300 }, (_, s) => `r52-j1-seed-${s}`)

  it('⭐⭐⭐ a plain training week whose coin would have silenced it still prints the silence line – in every seed, in both bands', () => {
    for (const band of SHUT) {
      const f = tableWeek(band)
      expect(f.coachTalkShut, 'the fixture is a shut checkpoint').toBe(band)
      let silencedByCoin = 0
      for (const seed of SEEDS) {
        const coin = rngFromSeed(`${seed}:weeknote:${f.week}`)()
        if (coin >= WEEK_NOTE_CHANCE) silencedByCoin++
        const t = weekNoteFor(f, seed)
        expect(t !== null && LINES[band].includes(t), `${band} / ${seed} / coin ${coin.toFixed(3)}: "${t}"`).toBe(true)
      }
      expect(silencedByCoin, `${band}: coins that would have silenced the week (anti-vacuity: about two in three)`).toBeGreaterThan(120)
    }
  })

  it('⭐⭐ and it LEADS the coach-feel lines: with her feel also heard that week the silence prints and no coach-feel line does – the same week without the silence fact prints one (the control)', () => {
    const FEEL = ['Practice came up three times at dinner. All of it good.', 'She quoted the coach at dinner. Twice.']
    for (const band of SHUT) {
      const heard: DiaryFacts = { ...tableWeek(band), coachFeelRead: 'good' }
      const quiet: DiaryFacts = { ...heard }
      delete quiet.coachTalkShut
      let controlPrinted = 0
      for (const seed of SEEDS) {
        const t = weekNoteFor(heard, seed)
        expect(t !== null && LINES[band].includes(t), `${band} / ${seed}: "${t}" is not the silence`).toBe(true)
        const c = weekNoteFor(quiet, seed)
        if (c !== null && FEEL.includes(c)) controlPrinted++
      }
      expect(controlPrinted, `${band}: without the fact the heard line is licensed and prints on the coin's weeks`).toBeGreaterThan(60)
    }
  })

  it('⭐⭐ the licence: a calendar week at the table (exams, the off-season, a holiday, a friendly, a knock) still speaks the silence; a tournament, a journey, college and a flat of her own do not', () => {
    const cases: [string, Partial<DiaryFacts>, boolean][] = [
      ['an exam week', { examsWeek: true }, true],
      ['the off-season', { offSeasonWeek: true }, true],
      ['a holiday', { vacationWeek: true }, true],
      ['a friendly', { playedPractice: true }, true],
      ['a knock, rested', { knockChoice: 'rest', knockPart: 'ankle' }, true],
      ['after school, still at home', { lifeStage: 'after-school', schoolOver: true, ageYears: 19 }, true],
      ['a tournament', { playedTournament: true }, false],
      ['a journey', { travelled: true }, false],
      ['college', { lifeStage: 'college', schoolOver: true, ageYears: 20 }, false],
      ['a flat of her own', { lifeStage: 'independent', schoolOver: true, ageYears: 24 }, false],
    ]
    for (const band of SHUT) {
      for (const [what, extra, prints] of cases) {
        const f = tableWeek(band, extra)
        for (const seed of SEEDS.slice(0, 60)) {
          const t = weekNoteFor(f, seed)
          expect(t !== null && ALL_LINES.includes(t), `${band} / ${what} / ${seed}: "${t}"`).toBe(prints)
        }
      }
    }
  })

  it('⭐⭐⭐ every OTHER week\'s coin is exactly the coin it was: without the fact a plain training week speaks if and only if its own coin is under the chance', () => {
    let spoke = 0
    for (const band of SHUT) {
      const f = tableWeek(band)
      delete f.coachTalkShut
      for (const seed of SEEDS) {
        const coin = rngFromSeed(`${seed}:weeknote:${f.week}`)()
        const t = weekNoteFor(f, seed)
        expect(t !== null, `${band} / ${seed} / coin ${coin.toFixed(3)}`).toBe(coin < WEEK_NOTE_CHANCE)
        if (t !== null) {
          spoke++
          expect(ALL_LINES.includes(t), `"${t}" is a silence line on a week with no silence fact`).toBe(false)
        }
      }
    }
    expect(spoke, 'the arm saw weeks that spoke (anti-vacuity)').toBeGreaterThan(100)
  })
})

// =================================================================================================
// E. REAL CAREERS – THE MEASUREMENT
// =================================================================================================
// ⚠ J1b (14.10) – RE-AIMED. J1 read the diary at each checkpoint's FIRST week; the fact now waits for the first of the four weeks on which the line could be heard, so the posed arm reads ALL FOUR weeks of every window and keeps, per window:
//   `fact`     the offsets (0..3) that carried the fact            `printed`  the offsets on which a silence line was printed
//   `free`     the offsets on which the licence TRULY held, read off THAT week's own facts (at the table, home, not laid off) – the oracle the built rule is held against. The rule reads today's values for the earlier weeks; this reads each week's own.
// What the arm ASSERTS is what must hold with or without the approximation (once; printed exactly where the fact is; the fact only on a free week; nothing where no week was free; the first week when it was free; never before the first free week),
// and what it COUNTS is what the approximation can cost (a window with a free week that printed nothing; a print after the first free week; two prints). The spec's addendum has the numbers.
interface CpWindow {
  preset: number
  career: number
  band: Shut
  cp: number
  fact: number[]
  printed: number[]
  free: number[]
  away: { travel: number; roof: number; injured: number }
}
const POSED: CpWindow[] = []
const PLAYED = { careers: 0, weeks: 0, coachedWeeks: 0, openWeeks: 0, shutWeeks: 0, printed: 0, shutWindows: 0, factWindows: 0, edgeOpenRoll: 0, edgeShutRoll: 0, capChecked: 0, capMismatch: 0, maxEvents: 0, maxOrdinary4: 0 }

/** Where in the calendar career `career`'s stint begins: spread over the year (0, 5, 10, 15, 20, 24, 29, ...), or all at week 0 with R52_J1_ALIGNED=1 (the first measurement). */
const sinceOf = (career: number): number => (process.env.R52_J1_ALIGNED === '1' ? 0 : (career * 4 + (career % 3)) % 52)

const roofStage = (f: DiaryFacts): boolean => f.lifeStage === 'school' || f.lifeStage === 'after-school'
const travelling = (f: DiaryFacts): boolean => f.playedTournament || f.travelled || f.travelHomeScene !== null

/** One econ-bench career for `weeks` weeks with the bond HELD in `band` (posed before the snapshot and so before the roll of the next step), the real tick, and the diary read at EVERY week of every checkpoint's window. */
function posedStint(preset: number, career: number, band: Shut, weeks: number, since: number): CpWindow[] {
  const policy = POLICIES[0]!
  const { world, rng } = openCareer(PRESETS[preset]!, career, policy)
  if (world.coachId === null) throw new Error(`preset ${preset} is supposed to start with a coach`)
  // ⚠ A STINT THAT BEGAN AT `since`, not always at week 0: a stint from week 0 puts every checkpoint on the SAME three calendar weeks (12, 32, 56) of every career, and the bench calendar is the same in all of them, so a tournament
  // week there is a tournament week in all 24 (the first measurement, all from week 0, read 72% travel for exactly that reason). The bench career walks `since` weeks as it is, then the same coach is let go and hired back (H3's fixture).
  if (since > 0) {
    for (let i = 0; i < since; i++) {
      stepCareerWeek(world, rng, policy)
      drainLifeBeats(world)
    }
    const coach = world.coachId
    if (coach === null) throw new Error(`preset ${preset}/${career}: the coach left during the warm-up`)
    hireCoach(world, null)
    hireCoach(world, coach)
  }
  const bond = bondFor(band)
  const wins = new Map<number, CpWindow>()
  for (let i = 0; i < weeks; i++) {
    world.bond = bond
    if (world.coachId !== null) {
      const together = world.week - coachSinceWeek(world)
      const snap = toSnapshot(world)
      const f = snap.diary.facts
      const cp = CHECKPOINTS.find((c) => together >= c && together < c + COACH_FEEL.periodWeeks)
      const at = `preset ${preset}/${career} ${band} week ${world.week} (${together} together)`
      if (cp === undefined) {
        expect(f.coachTalkShut, `${at}: outside every window`).toBeUndefined()
      } else {
        let w = wins.get(cp)
        if (w === undefined) {
          w = { preset, career, band, cp, fact: [], printed: [], free: [], away: { travel: 0, roof: 0, injured: 0 } }
          wins.set(cp, w)
        }
        const offset = together - cp
        const note = snap.diary.weekNote
        const printed = note !== null && ALL_LINES.includes(note)
        // the licence, re-derived from the facts and not from the engine's predicates
        const free = !travelling(f) && roofStage(f) && f.injured === null
        const fact = f.coachTalkShut !== undefined
        if (fact) w.fact.push(offset)
        if (printed) w.printed.push(offset)
        if (free) w.free.push(offset)
        else if (travelling(f)) w.away.travel++
        else if (!roofStage(f)) w.away.roof++
        else w.away.injured++
        expect(printed, `${at}: "${note}" – a silence line prints exactly where the fact is present`).toBe(fact)
        if (fact) expect(free, `${at}: the fact is only ever on a week that is free by its own facts`).toBe(true)
      }
    }
    stepCareerWeek(world, rng, policy)
    drainLifeBeats(world)
  }
  const out: CpWindow[] = []
  for (const cp of CHECKPOINTS) {
    const w = wins.get(cp)
    if (w === undefined) throw new Error(`preset ${preset}/${career} ${band}: the window of checkpoint ${cp} was never reached`)
    const at = `preset ${preset}/${career} ${band} checkpoint ${cp}: fact ${JSON.stringify(w.fact)} printed ${JSON.stringify(w.printed)} free ${JSON.stringify(w.free)}`
    expect(w.fact.length, `${at}: ONCE per checkpoint`).toBeLessThanOrEqual(1)
    expect(w.printed, `${at}: printed exactly where the fact is`).toEqual(w.fact)
    if (w.free.length === 0) expect(w.fact, `${at}: no free week, no note`).toEqual([])
    if (w.free[0] === 0) expect(w.fact, `${at}: a free first week prints on it`).toEqual([0])
    if (w.fact.length === 1) expect(w.fact[0]!, `${at}: never before the first free week`).toBeGreaterThanOrEqual(w.free[0]!)
    out.push(w)
  }
  return out
}

describe('R52 J1 E – real careers: the bond posed for 60 weeks of a stint, and the bond left to move', () => {
  const POSED_PRESETS = [2, 5]
  const POSED_CAREERS = REPORT ? 12 : 2
  for (const preset of POSED_PRESETS) {
    it(`⭐⭐ posed, preset ${preset}: the fact is on one week at most of each of the three windows of a shut bond, never on an away week, and the note prints exactly there`, () => {
      let reached = 0
      let later = 0
      for (let career = 0; career < POSED_CAREERS; career++) {
        for (const band of SHUT) {
          const wins = posedStint(preset, career, band, 60, sinceOf(career))
          reached += wins.length
          for (const w of wins) {
            POSED.push(w)
            if (w.fact.length === 1 && w.fact[0]! > 0) later++
          }
          expect(wins.map((w) => w.cp), `preset ${preset}/${career} ${band}`).toEqual([...CHECKPOINTS])
        }
      }
      expect(reached, 'the arm reached the windows (denominator)').toBe(POSED_CAREERS * SHUT.length * CHECKPOINTS.length)
      if (REPORT) expect(later, 'anti-vacuity: some windows printed AFTER their first week – the widening did something').toBeGreaterThan(0)
    })
  }

  const PLAYED_PRESETS = REPORT ? [1, 2, 4, 5, 6, 7, 8] : [2, 5]
  const PLAYED_CAREERS = REPORT ? 6 : 2
  const PLAYED_WEEKS = 156
  for (const preset of PLAYED_PRESETS) {
    it(`⭐⭐ played, preset ${preset} (the parent answers each card the week it is raised): at steady or close the fact never appears and no silence line prints; wherever it does appear the bond is the band it names; an earlier week read now is that week as it was`, () => {
      const policy = POLICIES[0]!
      for (let career = 0; career < PLAYED_CAREERS; career++) {
        const { world, rng } = openCareer(PRESETS[preset]!, career, policy)
        let seen = 0
        let rollBand: BondBand = bondBandOf(world.bond ?? ECONOMY.bond.start)
        /** week -> `notTravellingWeek` of that week's own facts, recorded on the day: the oracle the capped feed is held against */
        const recorded = new Map<number, boolean>()
        const shutWindows = new Set<string>()
        const factWindows = new Set<string>()
        PLAYED.careers++
        for (let i = 0; i < PLAYED_WEEKS; i++) {
          const snap = toSnapshot(world)
          const f = snap.diary.facts
          const note = snap.diary.weekNote
          PLAYED.weeks++
          // ⭐ THE CAP ORACLE (J1b): the look-back reads up to three weeks back from a feed `pruneEvents` caps. Each earlier week, read NOW from the capped log by the very helper the diary reads the current week with, must be the week as it was read ON THE DAY.
          recorded.set(world.week, notTravellingWeek(f))
          for (let u = Math.max(0, world.week - (COACH_FEEL.periodWeeks - 1)); u < world.week; u++) {
            const was = recorded.get(u)
            if (was === undefined) continue
            const now = notTravellingWeek(
              weekAwayOf({ events: world.events, milestones: world.milestones, week: u, seed: world.seed, kidId: KID_ID, condition: f.condition, lifeStage: f.lifeStage, birthdayAge: null, injury: null, pendingUnfinished: false }),
            )
            PLAYED.capChecked++
            if (now !== was) PLAYED.capMismatch++
          }
          PLAYED.maxEvents = Math.max(PLAYED.maxEvents, world.events.length)
          PLAYED.maxOrdinary4 = Math.max(PLAYED.maxOrdinary4, world.events.filter((e) => e.week > world.week - COACH_FEEL.periodWeeks && !e.keep && !(e.match !== undefined && !e.friendly)).length)
          if (world.coachId === null) {
            expect('coachTalkShut' in f, `preset ${preset}/${career} w${world.week}: nobody employed`).toBe(false)
          } else {
            PLAYED.coachedWeeks++
            const open = f.bondBand === 'steady' || f.bondBand === 'close'
            const cpNow = coachTalkCheckpointAt(world.week - coachSinceWeek(world))
            const key = `${coachSinceWeek(world)}:${cpNow}`
            if (cpNow !== null && !open && coachTalkCheckpointDue(world) !== null) shutWindows.add(key)
            if (open) {
              PLAYED.openWeeks++
              expect(f.coachTalkShut, `preset ${preset}/${career} w${world.week}: ${f.bondBand}`).toBeUndefined()
              expect(note !== null && ALL_LINES.includes(note), `preset ${preset}/${career} w${world.week}: a silence line at ${f.bondBand}`).toBe(false)
            }
            if (f.coachTalkShut !== undefined) {
              PLAYED.shutWeeks++
              factWindows.add(key)
              expect(f.bondBand, `preset ${preset}/${career} w${world.week}`).toBe(f.coachTalkShut)
              const printed = note !== null && ALL_LINES.includes(note)
              expect(printed, `preset ${preset}/${career} w${world.week}: the fact is printed where it is present ("${note}")`).toBe(true)
              PLAYED.printed++
              // the lag: the roll read LAST week's settled bond, the snapshot reads this tick's
              if (rollBand === 'steady' || rollBand === 'close') PLAYED.edgeOpenRoll++
            } else if (open && cpNow !== null && (rollBand === 'strained' || rollBand === 'cold') && coachTalkCheckpointDue(world) !== null) {
              // shut when the roll ran, OPEN by the time of the snapshot (the band edge), and still unspoken: the talk is raised in a later week of the window. (J1b: any week of the window now, and the snapshot's band must be open –
              // a window week the fact is absent on because the week is AWAY is not an edge.)
              PLAYED.edgeShutRoll++
            }
          }
          rollBand = bondBandOf(world.bond ?? ECONOMY.bond.start)
          stepCareerWeek(world, rng, policy)
          drainLifeBeats(world)
          const log = lifeLogOf(world)
          for (; seen < log.length; seen++) {
            if (log[seen]!.kind === 'small-talk') log[seen]!.answer = 'more'
          }
        }
        PLAYED.shutWindows += shutWindows.size
        PLAYED.factWindows += factWindows.size
      }
    })
  }

  it('⭐⭐ the cap oracle was asked, and the capped feed answers every earlier week as it was on the day (anti-vacuity: the feed held more than a season of rows)', () => {
    expect(PLAYED.capChecked, 'the oracle compared earlier weeks (denominator)').toBeGreaterThan(300)
    expect(PLAYED.capMismatch, `earlier weeks read now from the capped feed that differ from the same week read on the day (max feed ${PLAYED.maxEvents}, widest 4 weeks of ordinary rows ${PLAYED.maxOrdinary4})`).toBe(0)
    expect(PLAYED.maxEvents, 'the feed grew past a season of rows, so the cap was in play').toBeGreaterThan(200)
  })

  afterAll(() => {
    if (!REPORT) return
    const lines: string[] = ['J1B_POSED']
    const tally = (xs: CpWindow[]): string => {
      const n = xs.length
      const printed = xs.filter((x) => x.printed.length === 1).length
      const double = xs.filter((x) => x.printed.length >= 2).length
      const noFree = xs.filter((x) => x.free.length === 0)
      const approxMiss = xs.filter((x) => x.free.length > 0 && x.printed.length === 0).length
      // the approximation can only be an injury (the roof cannot move inside four weeks of a school-age stint, the bond is posed): every miss must have a week that was away by a layoff and not by travel
      const approxMissInjured = xs.filter((x) => x.free.length > 0 && x.printed.length === 0 && x.away.injured > 0).length
      const shifted = xs.filter((x) => x.printed.length === 1 && x.free.length > 0 && x.printed[0] !== x.free[0]).length
      const at = (k: number): number => xs.filter((x) => x.printed.length === 1 && x.printed[0] === k).length
      const ceil = (k: number): number => xs.filter((x) => x.free.length > 0 && x.free[0]! <= k).length
      const travelOnly = noFree.filter((x) => x.away.injured === 0 && x.away.roof === 0).length
      const injured = noFree.filter((x) => x.away.injured > 0).length
      const roof = noFree.filter((x) => x.away.roof > 0 && x.away.injured === 0).length
      return `n=${n} printed=${printed} (${((100 * printed) / n).toFixed(1)}%) double=${double} approxMiss=${approxMiss} (by a layoff earlier in the window: ${approxMissInjured}) shifted=${shifted} noFreeWeek=${noFree.length} [travelOnly=${travelOnly} injuredAmong=${injured} roof=${roof}] printedAtOffset=[${[0, 1, 2, 3].map(at)}] ceilingByOffset=[${[0, 1, 2, 3].map(ceil)}]`
    }
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) lines.push(`  ${band} cp${cp}: ${tally(POSED.filter((h) => h.band === band && h.cp === cp))}`)
      lines.push(`  ${band} ALL: ${tally(POSED.filter((h) => h.band === band))}`)
    }
    lines.push(`  BOTH: ${tally(POSED)}`)
    console.log(lines.join('\n'))
    console.log(`J1B_PLAYED ${JSON.stringify(PLAYED)} coachedYears=${(PLAYED.coachedWeeks / 52).toFixed(2)} notesPerCoachedYear=${(PLAYED.printed / (PLAYED.coachedWeeks / 52)).toFixed(4)}`)
  })
})

// =================================================================================================
// F. J1b – THE FACT WAITS FOR THE FIRST WEEK THE LINE CAN BE HEARD
// =================================================================================================
// THE ARCHITECT'S RULING (14.10, on J1's 54% lost to travel): present on the FIRST week of the window (cp <= w < cp + 4) on which the line could be heard – and on no other week; once per checkpoint, still derived. These arms pose the away weeks as
// PAID TRIPS in the event log (the diary's own `travelled`: the NET travel spend of the week) in a bare world, and read the fact through the real snapshot, so the window, the diary's helper and the world's rule are all in the path.
let eventSeq = 900000
const tripAt = (world: WorldState, week: number): void => {
  world.events.push({ id: ++eventSeq, week, type: 'expense', text: 'A trip', amountCents: -5000, category: 'travel' })
}
const refundAt = (world: WorldState, week: number): void => {
  world.events.push({ id: ++eventSeq, week, type: 'income', text: 'The trip refunded', amountCents: 5000, category: 'travel' })
}
const factAt = (world: WorldState, week: number): 'strained' | 'cold' | undefined => {
  world.week = week
  return toSnapshot(world).diary.facts.coachTalkShut
}

describe('R52 J1b F – the fact waits for the first week the line can be heard, and says it once', () => {
  /** [what, the window offsets that are AWAY (a paid trip), the offset the fact is on – or null when no week of the window is free] */
  const PATTERNS: readonly [string, readonly number[], number | null][] = [
    ['nothing away', [], 0],
    ['the first week away', [0], 1],
    ['two weeks away', [0, 1], 2],
    ['three weeks away', [0, 1, 2], 3],
    ['the second week away, the first is free', [1], 0],
    ['a gap: away, free, away', [0, 2], 1],
    ['only the last week away', [3], 0],
    ['all four weeks away', [0, 1, 2, 3], null],
  ]

  it('⭐⭐⭐ travel at the window\'s first week moves the note to the first free week; a window with no free week prints nothing; after the note\'s week the fact is absent for the rest of the window – and outside the window, a week before and four after', () => {
    let moved = 0
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) {
        for (const [what, away, on] of PATTERNS) {
          const world = coached(`r52-j1b-${band}-${cp}-${what}`, band)
          for (const o of away) tripAt(world, cp + o)
          const seen: number[] = []
          for (let week = cp - 2; week <= cp + 8; week++) {
            world.week = week
            const where = `${band} / checkpoint ${cp} / ${what} / week ${week} (offset ${week - cp})`
            const snap = toSnapshot(world)
            const expected = on !== null && week === cp + on
            expect(snap.diary.facts.coachTalkShut, where).toBe(expected ? band : undefined)
            if (!expected) expect('coachTalkShut' in snap.diary.facts, `${where}: the key is ABSENT, not undefined-valued`).toBe(false)
            if (expected) {
              seen.push(week)
              expect(snap.diary.weekNote !== null && LINES[band].includes(snap.diary.weekNote), `${where}: the note printed is the band's own ("${snap.diary.weekNote}")`).toBe(true)
              if (on > 0) moved++
            }
          }
          expect(seen.length, `${band} / ${cp} / ${what}: once, or never`).toBe(on === null ? 0 : 1)
        }
      }
    }
    // 2 bands x 3 checkpoints x the four patterns whose free week is not the first (1, 2, 3 and the gap) = 24: the arm moved the note in every one of them
    expect(moved, 'anti-vacuity: the arm moved the note off the first week in every window whose first week was away and a later one free').toBe(24)
  })

  it('⭐⭐ a checkpoint spoken inside the window clears it – nothing is printed after the row, and the same window not spoken (the control) prints on its first free week', () => {
    const cp = 32
    const ids = COACH_TALK_CHECKPOINT_ROWS[cp] ?? []
    const detail = `observation:${ids[0]}`
    for (const band of SHUT) {
      // away on the first week; she speaks on the second, the very week the note would print
      const spoken = coached(`r52-j1b-spoken-${band}`, band)
      tripAt(spoken, cp)
      expect(factAt(spoken, cp), `${band}: away on the first week`).toBeUndefined()
      expect(factAt(spoken, cp + 1), `${band}: control – not spoken, the first free week`).toBe(band)
      spoken.lifeLog = [{ week: cp + 1, kind: 'small-talk', detail, answer: 'easy' }]
      for (let week = cp + 1; week <= cp + 3; week++) {
        expect(factAt(spoken, week), `${band} / week ${week}: a checkpoint she spoke prints no silence`).toBeUndefined()
        expect(coachTalkCheckpointDue(spoken), `${band} / week ${week}: spoken`).toBeNull()
      }
      // free on the first week, so the note printed; she speaks later in the window: nothing more, and nothing taken back
      const later = coached(`r52-j1b-later-${band}`, band)
      expect(factAt(later, cp), `${band}: free first week`).toBe(band)
      later.lifeLog = [{ week: cp + 2, kind: 'small-talk', detail, answer: 'easy' }]
      for (let week = cp + 1; week <= cp + 3; week++) expect(factAt(later, week), `${band} / week ${week}`).toBeUndefined()
    }
  })

  it('⭐⭐ ONE SPELLING, THE DIARY\'S OWN: a refunded trip nets to 0 and is a free week, a paid trip and a played tournament are away weeks – and the same answer holds for the week before as for the week itself', () => {
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) {
        const refunded = coached(`r52-j1b-refund-${band}-${cp}`, band)
        tripAt(refunded, cp)
        refundAt(refunded, cp)
        refunded.week = cp
        const facts = toSnapshot(refunded).diary.facts
        expect(facts.travelled, `${band} / ${cp}: the diary reads the NET of the week, a refunded trip is no trip`).toBe(false)
        expect(facts.coachTalkShut, `${band} / ${cp}: and so the first week is free`).toBe(band)
        // the SAME refunded week, now an EARLIER week of the window: the look-back must read it the same way (it is free, so the fact is not repeated)
        expect(factAt(refunded, cp + 1), `${band} / ${cp}: the refunded week was free, so the note had its week`).toBeUndefined()

        const played = coached(`r52-j1b-played-${band}-${cp}`, band)
        played.events.push({ id: ++eventSeq, week: cp, type: 'tournament', text: 'A tournament', finishIdx: 3 })
        played.week = cp
        expect(toSnapshot(played).diary.facts.playedTournament, `${band} / ${cp}: the fixture is a played week`).toBe(true)
        expect(factAt(played, cp), `${band} / ${cp}: a played week is away`).toBeUndefined()
        expect(factAt(played, cp + 1), `${band} / ${cp}: and the note moves to the next`).toBe(band)
      }
    }
  })
})
