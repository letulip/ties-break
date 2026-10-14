// ROUND 52 J1 (14.10) – THE CHECKPOINT THE BOND SHUT, AND THE SILENCE THAT SHOWS.
//
// THE OWNER approved «давай по рекомендациям» (round 52, his answers on the close №1): at a strained or cold bond she does not confide at a stint checkpoint either – the checkpoint talk keeps the bond gate every
// small talk has – AND THE SILENCE SHOWS: a checkpoint the bond shuts leaves a note in the parent's voice on the week's diary scrap, so the player sees what the relationship cost.
//
// WHAT THIS HOLDS, in the order the change was built (docs/specs/small-talk-corpus-2026-09.md, «Round 52 J1»):
//   A. THE FACT      `coachTalkShut` is present on EXACTLY the first week of a shut checkpoint's window – once per checkpoint, at strained and cold – and absent when the checkpoint was spoken, at steady and close, on the
//                    other window weeks, before week 12 and with nobody employed. It is ABSENT as a key, not undefined-valued.
//   B. THE SPELLING  «does the bond let her confide» is ONE answer: move the table and the lottery's gate, the checkpoint talk and the fact move together. A BEHAVIOUR test, not a source pin.
//   C. THE LINES     four lines, two per band, their words held as DATA (an oracle read back from the source is a pin that cannot fail); at cold none carries a quotation mark of hers; the coach is never gendered.
//   D. THE LEAD      on the fact's week the silence lines are the pool and the one-in-three coin does not silence it; every OTHER week's coin is exactly the coin it was.
//   E. REAL CAREERS  posed (the bond held for 60 weeks of a stint) and played (the bond left to move): the measurement of the spec's addendum, behind R52_J1_REPORT=1 at scale.
//
// ⚠ EVERY ARM IS PROVEN BY MUTATION in the builder's report: drop the bond clause from the fact (A and B go red), drop the lead (D goes red), drop the coin exemption (D goes red) – each restored byte for byte.
import { afterAll, describe, expect, it } from 'vitest'
import { WEEK_NOTE_CHANCE, WEEK_NOTES, weekNoteFor } from '../src/engine/diary'
import { COACH_FEEL } from '../src/engine/chemistry'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { bondBandOf } from '../src/engine/spirit'
import { createWorld, hireCoach, lifeLogOf, rollSmallTalk, toSnapshot, type WorldState } from '../src/engine/world'
import { coachSinceWeek } from '../src/engine/world/coachStint'
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
describe('R52 J1 A – the fact: present on exactly the first week of a shut checkpoint, and nowhere else', () => {
  it('⭐⭐⭐ present on the checkpoint week and on no other week of its window, nor before it, nor after – at strained and cold, through the snapshot as well', () => {
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) {
        const world = coached(`r52-j1-timing-${band}-${cp}`, band)
        for (let week = cp - 2; week <= cp + 6; week++) {
          world.week = week
          const where = `${band} / checkpoint ${cp} / week ${week}`
          expect(coachTalkShutRead(world), where).toBe(week === cp ? band : null)
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
        const read = coachTalkShutRead(world)
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
      expect(coachTalkShutRead(spoken), `${band}: spoken`).toBeNull()

      const before = coached(`r52-j1-before-${band}`, band)
      before.week = cp
      before.lifeLog = [{ week: cp - 1, kind: 'small-talk', detail, answer: 'easy' }]
      expect(coachTalkShutRead(before), `${band}: a row raised before the window is not this checkpoint's talk (the control)`).toBe(band)

      const young = coached(`r52-j1-young-${band}`, band)
      for (let week = 0; week < 12; week++) {
        young.week = week
        expect(coachTalkShutRead(young), `${band}: week ${week}, before the first checkpoint`).toBeNull()
      }

      const nobody = coached(`r52-j1-nobody-${band}`, band)
      hireCoach(nobody, null)
      expect(nobody.coachId, 'the coach is released').toBeNull()
      for (const w of CHECKPOINTS) {
        nobody.week = w
        expect(coachTalkShutRead(nobody), `${band}: nobody employed, week ${w}`).toBeNull()
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
      const fact = coachTalkShutRead(world)
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
interface Posed {
  preset: number
  career: number
  band: Shut
  cp: number
  fact: boolean
  printed: boolean
  reason: 'printed' | 'travel' | 'roof' | 'injured' | 'other'
}
const POSED: Posed[] = []
/** REPORT only, and NOT built: for each shut checkpoint, the offset (0..3) of the first week of its window on which a silence note COULD print (at the table, home, not laid off), or null. The architect's widening question. */
const WIDEN: { band: Shut; cp: number; offset: number | null }[] = []
const PLAYED = { careers: 0, weeks: 0, coachedWeeks: 0, openWeeks: 0, shutWeeks: 0, printed: 0, edgeOpenRoll: 0, edgeShutRoll: 0, reasons: {} as Record<string, number> }

/** Where in the calendar career `career`'s stint begins: spread over the year (0, 5, 10, 15, 20, 24, 29, ...), or all at week 0 with R52_J1_ALIGNED=1 (the first measurement). */
const sinceOf = (career: number): number => (process.env.R52_J1_ALIGNED === '1' ? 0 : (career * 4 + (career % 3)) % 52)

const roofStage = (f: DiaryFacts): boolean => f.lifeStage === 'school' || f.lifeStage === 'after-school'
const travelling = (f: DiaryFacts): boolean => f.playedTournament || f.travelled || f.travelHomeScene !== null

/** One econ-bench career for `weeks` weeks with the bond HELD in `band` (posed before the snapshot and so before the roll of the next step), the real tick, and the diary read at every checkpoint's first week. */
function posedStint(preset: number, career: number, band: Shut, weeks: number, since: number): Posed[] {
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
  const out: Posed[] = []
  const first: Record<number, number> = {}
  for (let i = 0; i < weeks; i++) {
    world.bond = bond
    if (world.coachId !== null) {
      const together = world.week - coachSinceWeek(world)
      const snap = toSnapshot(world)
      const f = snap.diary.facts
      const at = CHECKPOINTS.includes(together)
      const win = CHECKPOINTS.find((cp) => together >= cp && together < cp + COACH_FEEL.periodWeeks)
      if (win !== undefined && first[win] === undefined && !travelling(f) && roofStage(f) && f.injured === null) first[win] = together - win
      expect(f.coachTalkShut !== undefined, `preset ${preset}/${career} ${band} week ${world.week} (${together} together)`).toBe(at)
      if (at) {
        const note = snap.diary.weekNote
        const printed = note !== null && ALL_LINES.includes(note)
        // the licence, re-derived from the facts and not from the engine's predicates
        expect(printed, `preset ${preset}/${career} ${band} week ${world.week}: "${note}"`).toBe(!travelling(f) && roofStage(f) && f.injured === null)
        const reason = printed ? 'printed' : travelling(f) ? 'travel' : !roofStage(f) ? 'roof' : f.injured !== null ? 'injured' : 'other'
        out.push({ preset, career, band, cp: together, fact: f.coachTalkShut === band, printed, reason })
      }
    }
    stepCareerWeek(world, rng, policy)
    drainLifeBeats(world)
  }
  for (const cp of CHECKPOINTS) WIDEN.push({ band, cp, offset: first[cp] ?? null })
  return out
}

describe('R52 J1 E – real careers: the bond posed for 60 weeks of a stint, and the bond left to move', () => {
  const POSED_PRESETS = [2, 5]
  const POSED_CAREERS = REPORT ? 12 : 2
  for (const preset of POSED_PRESETS) {
    it(`⭐⭐ posed, preset ${preset}: the fact is on exactly the three checkpoint weeks of a shut bond, and the note prints exactly when she is at the table, home and not laid off`, () => {
      let reached = 0
      for (let career = 0; career < POSED_CAREERS; career++) {
        for (const band of SHUT) {
          const hits = posedStint(preset, career, band, 60, sinceOf(career))
          reached += hits.length
          for (const h of hits) POSED.push(h)
          expect(hits.map((h) => h.cp), `preset ${preset}/${career} ${band}`).toEqual([...CHECKPOINTS])
          expect(hits.every((h) => h.fact), `preset ${preset}/${career} ${band}: the fact carries the band`).toBe(true)
          expect(hits.every((h) => h.reason !== 'other'), `preset ${preset}/${career} ${band}: every unprinted checkpoint has a named reason`).toBe(true)
        }
      }
      expect(reached, 'the arm reached the checkpoints (denominator)').toBe(POSED_CAREERS * SHUT.length * CHECKPOINTS.length)
    })
  }

  const PLAYED_PRESETS = REPORT ? [1, 2, 4, 5, 6, 7, 8] : [2, 5]
  const PLAYED_CAREERS = REPORT ? 6 : 2
  const PLAYED_WEEKS = 156
  for (const preset of PLAYED_PRESETS) {
    it(`⭐⭐ played, preset ${preset} (the parent answers each card the week it is raised): at steady or close the fact never appears and no silence line prints; wherever it does appear the bond is the band it names`, () => {
      const policy = POLICIES[0]!
      for (let career = 0; career < PLAYED_CAREERS; career++) {
        const { world, rng } = openCareer(PRESETS[preset]!, career, policy)
        let seen = 0
        let rollBand: BondBand = bondBandOf(world.bond ?? ECONOMY.bond.start)
        PLAYED.careers++
        for (let i = 0; i < PLAYED_WEEKS; i++) {
          const snap = toSnapshot(world)
          const f = snap.diary.facts
          const note = snap.diary.weekNote
          PLAYED.weeks++
          if (world.coachId === null) {
            expect('coachTalkShut' in f, `preset ${preset}/${career} w${world.week}: nobody employed`).toBe(false)
          } else {
            PLAYED.coachedWeeks++
            const open = f.bondBand === 'steady' || f.bondBand === 'close'
            if (open) {
              PLAYED.openWeeks++
              expect(f.coachTalkShut, `preset ${preset}/${career} w${world.week}: ${f.bondBand}`).toBeUndefined()
              expect(note !== null && ALL_LINES.includes(note), `preset ${preset}/${career} w${world.week}: a silence line at ${f.bondBand}`).toBe(false)
            }
            if (f.coachTalkShut !== undefined) {
              PLAYED.shutWeeks++
              expect(f.bondBand, `preset ${preset}/${career} w${world.week}`).toBe(f.coachTalkShut)
              const printed = note !== null && ALL_LINES.includes(note)
              if (printed) PLAYED.printed++
              const reason = printed ? 'printed' : travelling(f) ? 'travel' : !roofStage(f) ? 'roof' : f.injured !== null ? 'injured' : 'other'
              PLAYED.reasons[reason] = (PLAYED.reasons[reason] ?? 0) + 1
              // the lag: the roll read LAST week's settled bond, the snapshot reads this tick's
              if (rollBand === 'steady' || rollBand === 'close') PLAYED.edgeOpenRoll++
            } else if (CHECKPOINTS.includes(world.week - coachSinceWeek(world)) && (rollBand === 'strained' || rollBand === 'cold') && coachTalkCheckpointDue(world) !== null) {
              // shut when the roll ran, open by the time of the snapshot, and still unspoken: the talk is raised in a later week of the window
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
      }
    })
  }

  afterAll(() => {
    if (!REPORT) return
    const lines: string[] = ['J1_POSED']
    const tally = (xs: Posed[]): string => {
      const n = xs.length
      const c = (r: Posed['reason']): number => xs.filter((x) => x.reason === r).length
      return `n=${n} printed=${c('printed')} travel=${c('travel')} injured=${c('injured')} roof=${c('roof')} other=${c('other')}`
    }
    for (const band of SHUT) {
      for (const cp of CHECKPOINTS) lines.push(`  ${band} cp${cp}: ${tally(POSED.filter((h) => h.band === band && h.cp === cp))}`)
      lines.push(`  ${band} ALL: ${tally(POSED.filter((h) => h.band === band))}`)
    }
    lines.push(`  BOTH: ${tally(POSED)}`)
    console.log(lines.join('\n'))
    const w = (k: number | null): number => WIDEN.filter((x) => (k === null ? x.offset === null : x.offset !== null && x.offset <= k)).length
    console.log(`J1_WIDEN n=${WIDEN.length} firstFreeWeekAtOffset<=0:${w(0)} <=1:${w(1)} <=2:${w(2)} <=3:${w(3)} none-in-window:${w(null)}`)
    console.log(`J1_PLAYED ${JSON.stringify(PLAYED)} coachedYears=${(PLAYED.coachedWeeks / 52).toFixed(2)} notesPerCoachedYear=${(PLAYED.printed / (PLAYED.coachedWeeks / 52)).toFixed(4)}`)
    const f3 = WEEK_NOTES.filter((n) => n.claims.coachFeelRead !== undefined)
    const quoting = f3.map((n, i) => ({ id: `RU09D-CFW-${String(i + 1).padStart(2, '0')}`, step: n.claims.coachFeelRead, quotes: /["“”«»]/.test(String(n.text)) })).filter((x) => x.quotes)
    console.log(`J1_F3_QUOTES ${quoting.length} of ${f3.length}: ${quoting.map((x) => `${x.id}(${x.step})`).join(', ')}`)
  })
})
