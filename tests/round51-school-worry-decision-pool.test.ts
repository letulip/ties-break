// ROUND 51 (CONTINUATION, 14.10) – THE SCHOOL YEARS HAD ONE WORRY AND ONE DECISION, AND BOTH WAITED ON A CAREER FACT.
//
// The owner, 14.10 (quoted in the fourth 14.10 addendum of `docs/specs/small-talk-corpus-2026-09.md`): the other
// school subjects are thin too – take them in the same way, in both languages, with the whole tone of voice and every
// ruling as the reference. Builder B12's corpus bench (`npm run bench:smalltalk -- --seeds 60`, K4) had measured the
// cells, and builders E1 and E2 re-measured them the same day after their rows: the only two cells still under the
// spec's floor (§3b, three to four per subject × stage) were school `worry` 1 and school `decision` 1.
//
// FOUR ROWS WERE WRITTEN (R63–R66, appended LAST after E2's R60–R62) and NOTHING ELSE MOVED: not the weekly chance, not
// the season cap, not the depth of the memory, not a subject weight. This file pins what the item is: the two cells reach
// the floor, the real draw reaches each row at the stages it lists and at no other, the rows keep the addendum's rules, no
// line collides with another string in `src/`, and every line has its Russian.
//
// ⚠⚠ THE ONE FINDING THIS FILE EXISTS FOR: K4 COUNTS A ROW BY THE STAGES IT LISTS AND NOT BY ITS FACT, and each of the two
// cells was held by a GATED row – R46 `line-call` waits on `played-recently`, R47 `march-entry` on `march-entry-open`. So
// «school worry 1» and «school decision 1» were thinner than they read: on a career that has played nothing R46 is never in
// the pool at all, and R47 is in it only in the weeks before a March deadline. §A therefore pins BOTH readings – the K4
// floor (listed rows) and the pool `reachableSituations` really hands a bare career – and it pins that the four new rows
// carry no fact, because a gated fourth row would have lifted the K4 number and nothing else.
// ⚠ AN EARLIER DRAFT OF THIS FILE ASSERTED THAT A BARE CAREER «HELD NO DECISION AT ALL». The first run was red and was right:
// the fresh world's first March entry is open for its first weeks, so R47 IS reachable then. The case now walks the weeks
// and asserts only what is true – the cell is exactly the new rows in every week with the door shut.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: `round44-corpus-roundtrip.test.ts` owns «the catalogue is the document»;
// `round51-school-story-pool.test.ts`, `round51-school-observation-pool.test.ts` and
// `round51-school-curiosity-goodnews-pool.test.ts` own the other four cells; the exclusion tests own the memory. This file
// owns the school worry cell, the school decision cell and – because the two stage-reaching rows also list it – the
// after-school half of both.
//
// ⚠ NO CYRILLIC IN THIS FILE, by the house rule for source: the Russian lives in `ru.json`, fed by
// `docs/localization/ru-small-talk-situations-c-2026-10.md` §30–§35, and §E below only asks that it is THERE
// (a Cyrillic letter by code point, no Latin letter, the guillemets on a spoken line).
//
// ⚠⚠ THE SRC COLLISION SWEEP (§D) EXISTS BECAUSE OF ONE LINE: round 51 №17's «Nobody argued.» sat in
// `albumCorpus.ts` as well and turned `tests/component/album-mobile.test.ts` red at the closing gate –
// the i18n catalogue joins by English text, so one sentence in two surfaces is one key with two homes.
// Every new line was grepped before it was emitted; this is that grep, kept.
//
// ⚠ THE FIXTURES ARE `tests/helpers/schoolTranche.ts`, shared with E1's and E2's files: a pasted copy of the walk would
// be the shape T5.14 RULE B refuses. The seed prefix (`r51-e3-`) is this file's own, so these are different careers from
// theirs.
//
// ⚠ THE SUBJECT MIX. `R51_E3_REPORT=1` prints, for each stage, how many conversations the real draw handed out and the
// share of each subject among them – the figure the owner asked for after the whole school-years tranche (story 49% of
// school talks before it, observation 38% right after E1's rows). It is a MEASUREMENT: nothing below asserts a share of a
// subject, only that all six corpus subjects are drawn at both stages (so the report is never a table of zeros).
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – the control arm ran in an ISOLATED worktree (detached, node_modules linked), never in the shared
// checkout.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE (65 rows). 120 careers x 832 weeks, a close bond, a fresh world: school 1882 conversations, of
//          them 128 worries (the-film-she-has-not-seen 57, the-girl-she-walked-past 71) and 390 decisions (the-maybe-she-gave
//          183, the-match-she-said-she-would-watch 198, R47 the other 9); after-school 1512 conversations, 106 worries (55 of
//          them the-girl-she-walked-past, the school-years film NEVER drawn there) and 330 decisions (77 / 94). 14 of 14 green.
//          R51_E3_REPORT=1 npx vitest run --project unit tests/round51-school-worry-decision-pool.test.ts
//   ARM 1  THE CATALOGUE WITHOUT THE FOUR – this file copied into a detached worktree at HEAD 2ef31844 (61 rows, node_modules
//          linked; tests/helpers/schoolTranche.ts is that commit's own). The SAME 1882 / 1512 conversations (the cadence does
//          not depend on the pool) and NOT ONE of the four drawn: school worries 0 and decisions 23 (1.2%, all R47 while its
//          door was open), after-school worries 97 and decisions 312. 14 of 14 RED – every case, and none by accident of
//          vacuity: the stage claims carry a positive control, the shares a drawn-at-all check, and the sweeps throw «not in
//          the catalogue» naming the row.
//   ARM 2  THREE MUTATIONS OF THE SHIPPED CATALOGUE in that worktree (the generated module and ru.json copied in, one line
//          changed, restored between runs): the film row given fact `played-recently` – 5 of 14 RED (the hole, stage reach,
//          ordinary rows, drawn, shares); the-maybe-she-gave stopped at school – 5 of 14 RED (the K4 floor, stage reach,
//          ordinary rows, drawn, shares); a reply made to say «him» and «today» with an exclamation mark – 2 of 14 RED (the
//          rule sweep and the Russian key).
//   ARM 3  THE PRE-TRANCHE TREE (0fe15aca, the parent of builder B12's story commit; this file and the helper copied in): the
//          SAME 1882 / 1512 conversations; school curiosity 33.4%, story 32.5%, good news 32.4%, decision 1.8%, worry and
//          observation absent. The mix of the final tree is in the spec's fourth 14.10 addendum.
//   ARM 4  THE DIGEST FAMILIES on the shipped tree, named and NOT re-stamped here: 36 tests RED in six files (coach-travel-edge
//          4, -late-schemas 8, -prior-schemas 3, -recent-schemas 10, i18n-l3-7-twin 2 and succession-s1-start-year 9) plus
//          PICK-STABILITY in i18n-l3-5-life-beats. The SAME six files, the same 36 tests by name, are red in the worktree at
//          HEAD 2ef31844 – the tree without this item – so R63–R66 add no red file and remove none. The architect re-stamps
//          them once, at the close-out, on the final tree.
// -------------------------------------------------------------------------------------------------
import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  reachableSituations,
  SMALL_TALK_SITUATIONS,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import type { DiaryLifeStage } from '../src/shared/protocol'
import { careerAt, walkCareers, type Said } from './helpers/schoolTranche'

/** The two worries, in the order the document appends them. */
const NEW_WORRIES = ['the-film-she-has-not-seen', 'the-girl-she-walked-past'] as const
/** The two decisions. */
const NEW_DECISIONS = ['the-maybe-she-gave', 'the-match-she-said-she-would-watch'] as const
/** All four, in document order. */
const NEW_ROWS = [...NEW_WORRIES, ...NEW_DECISIONS] as const
/** The stages each row lists. A lie about a film is a school-years sentence; a gate, a younger girl who asks for a hit and a
 *  friend's match are the same scene at nine and at nineteen. */
const STAGES_OF: Record<(typeof NEW_ROWS)[number], readonly DiaryLifeStage[]> = {
  'the-film-she-has-not-seen': ['school'],
  'the-girl-she-walked-past': ['school', 'after-school'],
  'the-maybe-she-gave': ['school', 'after-school'],
  'the-match-she-said-she-would-watch': ['school', 'after-school'],
}
/** The six subjects of the corpus. The legacy subjects of the engine's older small talk are NOT in this list. */
/** ⚠ RE-AIMED 14.10 (r52, builder F4): the three coach-feel rows. A fresh world HAS a coach from its first week, so R69 `the-thing-she-cannot-name` joins the school worry cell in
 *  the weeks her feel for the coach is cold – the claims below about the cell being «exactly the new rows» are about the UNGATED rows, so those weeks are read without it. */
const COACH_FEEL_ROWS = ['the-thing-that-makes-sense', 'practice-feels-different', 'the-thing-she-cannot-name']
const CORPUS_SUBJECTS = ['story', 'observation', 'curiosity', 'good-news', 'worry', 'decision'] as const

function subjectOf(id: (typeof NEW_ROWS)[number]): 'worry' | 'decision' {
  return (NEW_WORRIES as readonly string[]).includes(id) ? 'worry' : 'decision'
}

// -------------------------------------------------------------------------------------------------
// FIXTURES – round 43's own (ask the ladder for the bond, pose only the voice), now in the shared helper.
// ⚠ A FRESH world with nothing earned: no match played, no result, no open entry – the career on which `played-recently`
// (R46's gate) and `march-entry-open` (R47's gate) stay false. That is exactly the career the hole was measured on.
// -------------------------------------------------------------------------------------------------

function idsAt(world: WorldState, voice: Temperament, stage: DiaryLifeStage, subject: string): string[] {
  return reachableSituations(world, voice, stage)
    .filter((s) => s.subject === subject)
    .map((s) => s.id)
}

/** K4's own measure: the rows of a subject that LIST a stage, whatever fact they wait on. */
function listedAt(subject: string, stage: DiaryLifeStage): string[] {
  return SMALL_TALK_SITUATIONS.filter((s) => s.subject === subject && s.stages.includes(stage)).map((s) => s.id)
}

let memo: Said[][] | null = null
/** Every career's conversations, computed once for the file. */
function careers(): Said[][] {
  if (memo === null) memo = walkCareers('r51-e3-')
  return memo
}

// =================================================================================================
// A. THE POOL – what a school-age girl, and a girl just out of school, can be handed
// =================================================================================================

describe('round 51 (continuation) A – the two cells reach the floor, and they reach it on a BARE career', () => {
  it('⭐⭐ K4\'s own measure: school worry and school decision each LIST at least three rows, and so do the after-school cells', () => {
    // The spec's §3b floor is «3–4 per subject × stage». Before the item the school cells read 1 and 1 (R46, R47).
    expect(listedAt('worry', 'school'), 'school worry').toEqual(expect.arrayContaining([...NEW_WORRIES]))
    expect(listedAt('worry', 'school').length, 'school worry was ONE before the item (R46)').toBeGreaterThanOrEqual(3)
    expect(listedAt('decision', 'school'), 'school decision').toEqual(expect.arrayContaining([...NEW_DECISIONS]))
    expect(listedAt('decision', 'school').length, 'school decision was ONE before the item (R47)').toBeGreaterThanOrEqual(3)
    // After-school already held three of each; the rows that reach it only add, and the cells must not fall below the floor.
    expect(listedAt('worry', 'after-school'), 'after-school worry').toContain('the-girl-she-walked-past')
    expect(listedAt('worry', 'after-school').length, 'after-school worry was THREE before the item (R15, R18, R46)').toBeGreaterThanOrEqual(4)
    expect(listedAt('decision', 'after-school'), 'after-school decision').toEqual(expect.arrayContaining([...NEW_DECISIONS]))
    expect(listedAt('decision', 'after-school').length, 'after-school decision was THREE before the item (R9, R43, R47)').toBeGreaterThanOrEqual(5)
  })

  it('⭐⭐⭐ THE HOLE ITSELF: the one row each school cell listed before is GATED – on a bare career the cell is exactly the new rows whenever the gate is shut', () => {
    const lineCall = SMALL_TALK_SITUATIONS.find((s) => s.id === 'line-call')!
    const marchEntry = SMALL_TALK_SITUATIONS.find((s) => s.id === 'march-entry')!
    // ⚠ The two facts K4 does not look at. If either gate is ever lifted, this case is the place that says the hole closed on its own.
    expect(lineCall.fact, 'R46 waits on a match played').toBe('played-recently')
    expect(marchEntry.fact, 'R47 waits on an open entry').toBe('march-entry-open')
    const world = careerAt('r51-e3-census', 'sunny')
    let shutWeeks = 0
    let openWeeks = 0
    // Two years of weeks: the fresh world's first March entry is open for its first weeks and shut after its deadline.
    for (let w = 0; w < 104; w++) {
      world.week = w
      for (const voice of TEMPERAMENTS) {
        const worry = idsAt(world, voice, 'school', 'worry').filter((id) => !COACH_FEEL_ROWS.includes(id))
        expect(worry, `week ${w}/${voice}: R46 needs a match played and a fresh career has played none`).not.toContain('line-call')
        // With nothing played the whole reachable worry cell is the two new rows, in EVERY week.
        expect([...worry].sort(), `week ${w}/${voice}: school worry on a bare career`).toEqual([...NEW_WORRIES].sort())
        const decision = idsAt(world, voice, 'school', 'decision')
        expect(decision, `week ${w}/${voice}: the bare career's school decisions`).toEqual(expect.arrayContaining([...NEW_DECISIONS]))
        if (decision.includes('march-entry')) {
          openWeeks++
          continue
        }
        shutWeeks++
        expect([...decision].sort(), `week ${w}/${voice}: school decision with the March door shut`).toEqual([...NEW_DECISIONS].sort())
      }
    }
    // ⚠ ANTI-VACUITY: both arms of the branch above were walked, or the «exactly the new rows» claim was made about nothing.
    expect(shutWeeks, 'weeks with the March door shut').toBeGreaterThan(0)
    expect(openWeeks, 'weeks with the March door open – R47 does reach a bare career, only briefly').toBeGreaterThan(0)
  })

  it('each row reaches ONLY the stages it lists: nobody in college or independent is handed them, and the film stops at school', () => {
    const world = careerAt('r51-e3-census', 'deep')
    for (const voice of TEMPERAMENTS) {
      for (const stage of ['college', 'independent'] as const) {
        for (const id of NEW_ROWS) expect(idsAt(world, voice, stage, subjectOf(id)), `${voice}/${stage}: ${id}`).not.toContain(id)
      }
      expect(idsAt(world, voice, 'after-school', 'worry'), `${voice}: a lie about a film is a school-years sentence – after-school does not claim it`).not.toContain('the-film-she-has-not-seen')
      // ⚠ POSITIVE CONTROL: «not reachable» about a row that is not in the catalogue at all is vacuously true, so the same
      // world must hand each row over at every stage where it DOES list.
      for (const id of NEW_ROWS) {
        for (const stage of STAGES_OF[id]) {
          expect(idsAt(world, voice, stage, subjectOf(id)), `${voice}/${stage}: control – ${id} IS reachable where it lists`).toContain(id)
        }
      }
    }
  })

  it('the four are ordinary rows – ungated, four-voiced, NO second beat, the right subject and stages – and they sit three from the end (R67–R69 follow them)', () => {
    expect(
      // ⚠ RE-AIMED A FIFTH TIME 14.10 (r52, builder F4): «the last four» became «the four before the last three» when R67–R69 (tests/r52-coach-feel-talk.test.ts) were appended after R66; the order of what was there did not move.
      SMALL_TALK_SITUATIONS.slice(-7, -3).map((s) => s.id),
      'appended last: a pool of a different length reads a different position, but the order of what was there does not move',
    ).toEqual([...NEW_ROWS])
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      expect(s.subject, `${id}: subject`).toBe(subjectOf(id))
      expect(s.fact, `${id}: no career fact behind it – that is the whole point of the item`).toBeNull()
      expect([...s.stages].sort(), `${id}: stages`).toEqual([...STAGES_OF[id]].sort())
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: a worry she brings and a choice she weighs are not incidents told in two beats`).toBeUndefined()
      }
    }
  })
})

// =================================================================================================
// B. THE DRAW – the shipped engine, over many careers, reaches each row at the stages it lists
// =================================================================================================

describe('round 51 (continuation) B – the shipped draw hands her each of them', () => {
  const at = (stage: DiaryLifeStage): Said[] => careers().flat().filter((s) => s.stage === stage)
  const drawn = (stage: DiaryLifeStage, subject: string): Said[] => at(stage).filter((s) => s.detail.startsWith(`${subject}:`))
  const count = (xs: readonly Said[], subject: string, id: string): number => xs.filter((s) => s.detail === `${subject}:${id}`).length
  const subjectsDrawn = (stage: DiaryLifeStage): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const s of at(stage)) {
      const subject = s.detail.split(':')[0]
      out[subject] = (out[subject] ?? 0) + 1
    }
    return out
  }

  it('⭐⭐⭐ every one of the four is drawn by the real engine at each stage it lists – reachable, not merely listed', () => {
    const report: Record<string, unknown> = {}
    for (const stage of ['school', 'after-school'] as const) {
      const worry = drawn(stage, 'worry')
      const decision = drawn(stage, 'decision')
      const all = at(stage).length
      const mix = subjectsDrawn(stage)
      report[stage] = {
        allConversations: all,
        worry: worry.length,
        perWorry: Object.fromEntries(NEW_WORRIES.map((id) => [id, count(worry, 'worry', id)])),
        decision: decision.length,
        perDecision: Object.fromEntries(NEW_DECISIONS.map((id) => [id, count(decision, 'decision', id)])),
        // THE SUBJECT MIX the owner asked for: every subject the draw handed out at this stage, with its share of all of them.
        mix: Object.fromEntries(Object.entries(mix).map(([k, n]) => [k, { n, pct: Math.round((1000 * n) / all) / 10 }])),
      }
    }
    // ⚠ THE DENOMINATOR IS PRINTED BEFORE ANY CLAIM IS MADE ABOUT IT, so that an arm which fails the first expectation below
    // still shows how many conversations it walked: a null result needs a non-empty denominator on BOTH arms.
    if (process.env.R51_E3_REPORT === '1') {
      // eslint-disable-next-line no-console
      console.info(`R51_E3_REPORT ${JSON.stringify(report)}`)
    }
    for (const stage of ['school', 'after-school'] as const) {
      // ⚠ ANTI-VACUITY FIRST: a draw of nothing proves nothing. 120 careers walked for sixteen years hold far more than
      // this at the school stage, and after-school is the shorter window of the two.
      expect(at(stage).length, `${stage}: conversations walked`).toBeGreaterThan(stage === 'school' ? 1500 : 1000)
      const worry = drawn(stage, 'worry')
      const decision = drawn(stage, 'decision')
      // Worry is the rarest subject the draw hands out (the weights are untouched by this item): about one a career at school.
      expect(worry.length, `${stage}: worries walked`).toBeGreaterThan(stage === 'school' ? 80 : 60)
      expect(decision.length, `${stage}: decisions walked`).toBeGreaterThan(stage === 'school' ? 200 : 150)
      for (const id of NEW_WORRIES) {
        if (STAGES_OF[id].includes(stage)) expect(count(worry, 'worry', id), `${stage}: ${id} drawn at least once`).toBeGreaterThan(0)
      }
      for (const id of NEW_DECISIONS) expect(count(decision, 'decision', id), `${stage}: ${id} drawn at least once`).toBeGreaterThan(0)
    }
    // The stage filter holds in the REAL draw too, not only in `reachableSituations`: after-school never hears the school-years sentence.
    expect(count(drawn('after-school', 'worry'), 'worry', 'the-film-she-has-not-seen'), 'after-school: the school-years worry is never drawn').toBe(0)
  })

  it('no one of the four swallows its cell: each is under 65% of the rows of its subject drawn at either stage', () => {
    for (const stage of ['school', 'after-school'] as const) {
      for (const id of NEW_ROWS) {
        if (!STAGES_OF[id].includes(stage)) continue
        const subject = subjectOf(id)
        const xs = drawn(stage, subject)
        expect(count(xs, subject, id), `${stage}: ${id} was drawn – a share of nothing is not a share`).toBeGreaterThan(0)
        expect(count(xs, subject, id) / xs.length, `${stage}: ${id} was ${count(xs, subject, id)} of ${xs.length}`).toBeLessThan(0.65)
      }
    }
  })

  it('all six corpus subjects are drawn at both stages – so the mix the report prints is never a table with an empty column', () => {
    for (const stage of ['school', 'after-school'] as const) {
      const mix = subjectsDrawn(stage)
      for (const subject of CORPUS_SUBJECTS) expect(mix[subject] ?? 0, `${stage}: ${subject} conversations`).toBeGreaterThan(0)
    }
  })
})

// =================================================================================================
// C. THE COPY RULES OF THE ADDENDUM – the ones that are rules rather than wording
// =================================================================================================

describe('round 51 (continuation) C – the four keep the document\'s rules', () => {
  // ⚠ BUILT INSIDE THE CASES AND NOT AT COLLECTION: a row missing from the catalogue must be a RED
  // case that names the row, not a collection error that reports «no tests» and hides the arm.
  function copyLines(): { where: string; text: string }[] {
    const lines: { where: string; text: string }[] = []
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]!
        lines.push({ where: `${id}/${voice}/opener`, text: col.opener })
        for (const stance of ['invite', 'respond', 'space'] as const) {
          lines.push({ where: `${id}/${voice}/${stance}/label`, text: col.branches[stance].label })
          lines.push({ where: `${id}/${voice}/${stance}`, text: col.branches[stance].said })
        }
      }
    }
    return lines
  }

  it('the sweep has something to sweep – 4 rows x 4 voices x (opener, 3 labels, 3 replies)', () => {
    expect(copyLines().length).toBe(4 * 4 * 7)
  })

  it('no masculine pronoun, no «today», no exclamation mark, no digit, no long dash – and no professional is named, so none can be given a pronoun', () => {
    // ⚠ RULES AND NOT WORDING. `tests/coach-voice.test.ts` already refuses a masculine pronoun anywhere
    // outside court-four; the rest are the addendum's own. A coach, an umpire or a teacher in these rows
    // would need an ungendered treatment (house rule R15-7), so the cheapest honest pin is that none appears.
    const rules: [string, RegExp][] = [
      ['masculine pronoun', /\b(he|his|him|himself)\b/i],
      ['today', /\btoday\b/i],
      ['exclamation mark', /!/],
      ['digit', /\d/],
      ['long dash', /—/],
      ['a professional', /\b(coach|umpire|referee|teacher|physio|trainer|psychologist)\b/i],
    ]
    for (const { where, text } of copyLines()) {
      for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
    }
  })

  it('nothing says she is tired, hurt or short of money – those are the engine\'s facts, and a generated row may not assert them', () => {
    // ⚠ Condition (`condition.ts`), injuries and the family budget are the engine's. R66's pull is a long wait and a promise,
    // not fatigue; R64 names no cause for the crying. Two rows that touch the nearest ground carry the words that would break it.
    const rules: [string, RegExp][] = [
      ['tired', /\b(tired|exhausted|worn out|sore)\b/i],
      ['injury', /\b(injur\w*|hurt|ache|aches|pain|swollen)\b/i],
      ['money', /\b(money|pay|paid|cost|costs|price|afford|fare)\b/i],
      ['a result', /\b(won|win|wins|lost|lose|loses|beat|beaten|score|ranking|trophy)\b/i],
    ]
    for (const { where, text } of copyLines()) {
      for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
    }
  })

  it('every opener and reply is unique in the WHOLE corpus – no exact duplicate against any other situation', () => {
    const seen = new Map<string, number>()
    const bump = (s: string): void => void seen.set(s, (seen.get(s) ?? 0) + 1)
    for (const s of SMALL_TALK_SITUATIONS) {
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]
        if (col === undefined) continue
        bump(col.opener)
        if (col.shared !== undefined) bump(col.shared)
        for (const stance of ['invite', 'respond', 'space'] as const) bump(col.branches[stance].said)
      }
    }
    for (const { where, text } of copyLines()) {
      if (where.endsWith('/label')) continue
      expect(seen.get(text), `${where}: «${text}» appears elsewhere in the corpus`).toBe(1)
    }
  })

  it('the three labels of each row are the parent\'s own and are the same in all four voices', () => {
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      for (const stance of ['invite', 'respond', 'space'] as const) {
        const labels = new Set(TEMPERAMENTS.map((v) => s.voices[v]!.branches[stance].label))
        expect(labels.size, `${id}/${stance}: one label for the four voices`).toBe(1)
      }
    }
  })
})

// =================================================================================================
// D. NO LINE COLLIDES WITH ANOTHER STRING IN src/ – the catalogue joins by English text
// =================================================================================================

describe('round 51 (continuation) D – no new line is also a string somewhere else in src/', () => {
  /** Every .ts and .vue file under src/, except the generated catalogue itself (it holds the lines by
   *  definition). The i18n JSON files are generated from the sources and are not sources. */
  function sourceText(): { file: string; text: string }[] {
    const root = new URL('../src/', import.meta.url)
    const out: { file: string; text: string }[] = []
    for (const rel of readdirSync(root, { recursive: true }) as string[]) {
      if (!/\.(ts|vue)$/.test(rel)) continue
      if (rel === 'engine/world/smallTalkCorpus.ts') continue
      out.push({ file: rel, text: readFileSync(new URL(rel, root), 'utf8') })
    }
    return out
  }

  it('⭐⭐ none of the 76 new strings appears in any other source file', () => {
    const files = sourceText()
    // ⚠ ANTI-VACUITY: a scan of an empty list finds nothing and passes.
    expect(files.length, 'source files scanned').toBeGreaterThan(200)
    expect(files.some((f) => f.file === 'engine/world/albumCorpus.ts'), 'the file that collided last time is in the scan').toBe(true)
    let checked = 0
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      const strings = new Set<string>()
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]!
        strings.add(col.opener)
        for (const stance of ['invite', 'respond', 'space'] as const) {
          strings.add(col.branches[stance].label)
          strings.add(col.branches[stance].said)
        }
      }
      for (const line of strings) {
        // The spoken lines carry their quotation marks in the catalogue; a collision is the sentence.
        const bare = line.replace(/^"/, '').replace(/"$/, '')
        const escaped = bare.replace(/'/g, "\\'")
        checked++
        for (const f of files) {
          expect(f.text.includes(bare) || f.text.includes(escaped), `«${bare}» is also in src/${f.file}`).toBe(false)
        }
      }
    }
    expect(checked, 'the strings checked (16 openers + 48 replies + 12 labels)').toBe(76)
  })
})

// =================================================================================================
// E. THE RUSSIAN IS THERE – zero keys without Russian, asked of the rows themselves
// =================================================================================================

describe('round 51 (continuation) E – every new English line has its Russian in ru.json', () => {
  const ru = JSON.parse(readFileSync(new URL('../src/i18n/ru.json', import.meta.url), 'utf8')) as Record<string, string>

  it('⭐⭐ 76 keys, each with a Russian value that is Cyrillic, has no Latin letter, and wears the guillemets on a spoken line', () => {
    let checked = 0
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      const spoken = new Set<string>()
      const labels = new Set<string>()
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]!
        spoken.add(col.opener)
        for (const stance of ['invite', 'respond', 'space'] as const) {
          labels.add(col.branches[stance].label)
          spoken.add(col.branches[stance].said)
        }
      }
      for (const key of [...spoken, ...labels]) {
        const value = ru[key]
        expect(value, `${id}: no Russian for «${key}»`).toBeTypeOf('string')
        expect(value, `${id}: the Russian of «${key}» is the English`).not.toBe(key)
        expect(/[Ѐ-ӿ]/.test(value), `${id}: «${value}» has no Cyrillic letter`).toBe(true)
        expect(/[A-Za-z]/.test(value), `${id}: «${value}» still holds a Latin letter`).toBe(false)
        expect(/[!\d—]/.test(value), `${id}: «${value}» holds an exclamation mark, a digit or a long dash`).toBe(false)
        if (spoken.has(key)) {
          expect(value.startsWith('«') && value.endsWith('»'), `${id}: «${value}» does not wear the guillemets`).toBe(true)
        }
        checked++
      }
    }
    expect(checked, '16 openers + 48 replies + 12 labels').toBe(76)
  })
})
