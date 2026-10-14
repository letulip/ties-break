// ROUND 51 (CONTINUATION, 14.10) – THE SCHOOL YEARS HAD ONE CURIOSITY AND TWO GOOD NEWS.
//
// The owner, 14.10 (quoted in the third 14.10 addendum of `docs/specs/small-talk-corpus-2026-09.md`): the other
// school subjects are thin too – take them in the same way, in both languages, with the whole tone of voice and every
// ruling as the reference. Builder B12's corpus bench (`npm run bench:smalltalk -- --seeds 60`, K4) had measured the
// cells, and builder E1 re-measured them the same day after his observation rows: school `curiosity` 1, school
// `good-news` 2, after-school `curiosity` 2. The spec's own floor (§3b) is three to four per subject × stage.
//
// THREE ROWS WERE WRITTEN (R60–R62, appended LAST after E1's observations) and NOTHING ELSE MOVED: not the weekly
// chance, not the season cap, not the depth of the memory, not a subject weight. This file pins what the item is: the
// three cells reach the floor, the real draw reaches each row at the stages it lists and at no other, the rows keep the
// addendum's rules, no line collides with another string in `src/`, and every line has its Russian.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: `round44-corpus-roundtrip.test.ts` owns «the catalogue is the document»;
// `round51-school-story-pool.test.ts` owns the story cell and `round51-school-observation-pool.test.ts` the observation
// cell; the exclusion tests own the memory. This file owns the school curiosity cell, the after-school curiosity cell and
// the school good-news cell.
//
// ⚠ K4 COUNTS A ROW BY THE STAGES IT LISTS AND NOT BY ITS FACT: «school curiosity 1» was R48 `coach-real`, a row that also
// waits on `coach-employed`. So §A pins BOTH readings – the K4 floor (listed rows) and the pool `reachableSituations`
// really hands a fresh career – because the draw uses the second. ⚠ A fresh career already HAS a coach (R48 is reachable on
// it, measured when a «not reachable» arm came back red), so the cell held one reachable row and not an empty one; the item
// takes it from one to three on both readings.
//
// ⚠ NO CYRILLIC IN THIS FILE, by the house rule for source: the Russian lives in `ru.json`, fed by
// `docs/localization/ru-small-talk-situations-c-2026-10.md` §26–§30, and §E below only asks that it is THERE
// (a Cyrillic letter by code point, no Latin letter, the guillemets on a spoken line).
//
// ⚠⚠ THE SRC COLLISION SWEEP (§D) EXISTS BECAUSE OF ONE LINE: round 51 №17's «Nobody argued.» sat in
// `albumCorpus.ts` as well and turned `tests/component/album-mobile.test.ts` red at the closing gate –
// the i18n catalogue joins by English text, so one sentence in two surfaces is one key with two homes.
// Every new line was grepped before it was emitted; this is that grep, kept.
//
// ⚠ THE FIXTURES ARE `tests/helpers/schoolTranche.ts`, shared with E1's file: a second pasted copy of the walk would be
// the shape T5.14 RULE B refuses. The seed prefix (`r51-e2-`) is this file's own, so these are different careers from E1's.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – the control arm ran in an ISOLATED worktree (../tb-e2, detached at HEAD 3f6b6661 = the shipped
// tree with this item absent, node_modules linked), never in the shared checkout.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE (61 rows; generated module blob a0333c44). 120 careers x 832 weeks, a close bond, a fresh
//          world: school 1898 conversations, of them 543 curiosities (the-ball-she-let-go 179, sorry-for-a-lucky-point 183,
//          the rest R48 and the other school rows of the subject) and 367 good news (the-older-girl-knew-her-name 184);
//          after-school 1521 conversations, 355 curiosities (82 / 90) and 234 good news, the school-years one NEVER drawn
//          there. 12 of 12 green.
//          R51_E2_REPORT=1 npx vitest run --project unit tests/round51-school-curiosity-goodnews-pool.test.ts
//   ARM 1  THE CATALOGUE WITHOUT THE THREE – this file and tests/helpers/schoolTranche.ts copied into the worktree at HEAD
//          (58 rows; its module is HEAD's blob 52edb34e, and the shipped tree's a0333c44 was not touched by the arm). The
//          SAME 1898 / 1521 conversations (the cadence does not depend on the pool) and NOT ONE of the three drawn: school
//          curiosities 380 and good news 308, after-school 343 and 238, every count of the new ids 0. 12 of 12 RED – every
//          case, and none by accident of vacuity: the negative stage claims carry a positive control, the shares a
//          drawn-at-all check, and the sweeps throw «not in the catalogue» naming the row.
//   ARM 2  THE DIGEST FAMILIES on the shipped tree, named and NOT re-stamped here: 36 tests RED in six files –
//          coach-travel-edge (4 files: late-schemas, prior-schemas, recent-schemas and the plain one), i18n-l3-7-twin and
//          succession-s1-start-year – plus PICK-STABILITY in i18n-l3-5-life-beats (career 5/0 'dd3d0b29' against '38f6336d').
//          The SAME six files and the same 36 (+ PICK-STABILITY = 37) are red in the worktree at HEAD 3f6b6661, the tree
//          without this item, so R60–R62 add no red file and remove none: the new rows lengthen the pool again and every
//          played-career digest moves again. The architect re-stamps them once, at the close-out, on the final tree.
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

/** The two curiosities, in the order the document appends them. Neither depends on her age: an older player and a net are
 *  the same scene at nine and at nineteen. */
const NEW_CURIOSITIES = ['the-ball-she-let-go', 'sorry-for-a-lucky-point'] as const
/** The good news. «One of the older girls» is a school-years sentence, so this one stops at school. */
const NEW_GOOD_NEWS = ['the-older-girl-knew-her-name'] as const
/** All three, in document order. */
const NEW_ROWS = [...NEW_CURIOSITIES, ...NEW_GOOD_NEWS] as const

// -------------------------------------------------------------------------------------------------
// FIXTURES – round 43's own (ask the ladder for the bond, pose only the voice), now in the shared helper.
// ⚠ A FRESH world with nothing earned: no match played, no result, no open entry – the career on which
// `beat-her-conqueror` (R52) and `played-recently` (R14, R34) stay false. It does have a coach from the first week, so
// `coach-real` (R48) is reachable on it; nothing here poses that away.
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
  if (memo === null) memo = walkCareers('r51-e2-')
  return memo
}

// =================================================================================================
// A. THE POOL – what a school-age girl, and a girl just out of school, can be handed
// =================================================================================================

describe('round 51 (continuation) A – the three cells reach the floor', () => {
  it('⭐⭐ K4\'s own measure: school curiosity, after-school curiosity and school good-news each LIST at least three rows', () => {
    // The spec's §3b floor is «3–4 per subject × stage». Before the item the three cells read 1, 2 and 2.
    expect(listedAt('curiosity', 'school'), 'school curiosity').toEqual(expect.arrayContaining([...NEW_CURIOSITIES]))
    expect(listedAt('curiosity', 'school').length, 'school curiosity was ONE before the item (R48)').toBeGreaterThanOrEqual(3)
    expect(listedAt('curiosity', 'after-school'), 'after-school curiosity').toEqual(expect.arrayContaining([...NEW_CURIOSITIES]))
    expect(listedAt('curiosity', 'after-school').length, 'after-school curiosity was TWO before the item (R48, R23)').toBeGreaterThanOrEqual(3)
    expect(listedAt('good-news', 'school'), 'school good-news').toEqual(expect.arrayContaining([...NEW_GOOD_NEWS]))
    expect(listedAt('good-news', 'school').length, 'school good-news was TWO before the item (R45, R52)').toBeGreaterThanOrEqual(3)
  })

  it('⭐⭐ on a FRESH career, for every voice: the two curiosities reach school and after-school, the good news reaches school', () => {
    const world = careerAt('r51-e2-census', 'sunny')
    for (const voice of TEMPERAMENTS) {
      const schoolCuriosity = idsAt(world, voice, 'school', 'curiosity')
      expect(schoolCuriosity, `${voice}: school curiosity`).toEqual(expect.arrayContaining([...NEW_CURIOSITIES]))
      expect(schoolCuriosity.length, `${voice}: the reachable school curiosities – ONE (R48) before the item`).toBeGreaterThanOrEqual(3)

      const afterSchoolCuriosity = idsAt(world, voice, 'after-school', 'curiosity')
      expect(afterSchoolCuriosity, `${voice}: after-school curiosity`).toEqual(expect.arrayContaining([...NEW_CURIOSITIES, 'the-word-she-keeps-hearing']))
      expect(afterSchoolCuriosity.length, `${voice}: the reachable after-school curiosities – TWO (R48, R23) before the item`).toBeGreaterThanOrEqual(3)

      const schoolGood = idsAt(world, voice, 'school', 'good-news')
      expect(schoolGood, `${voice}: school good-news`).toEqual(expect.arrayContaining([...NEW_GOOD_NEWS, 'practice-clicked']))
      expect(schoolGood, `${voice}: R52 is the strictest gate in the catalogue and a fresh career has not beaten anyone`).not.toContain('beat-her-conqueror')
    }
  })

  it('each row reaches ONLY the stages it lists: the curiosities stop at after-school, the good news stops at school', () => {
    const world = careerAt('r51-e2-census', 'deep')
    for (const voice of TEMPERAMENTS) {
      for (const stage of ['college', 'independent'] as const) {
        for (const id of NEW_ROWS) {
          const subject = (NEW_CURIOSITIES as readonly string[]).includes(id) ? 'curiosity' : 'good-news'
          expect(idsAt(world, voice, stage, subject), `${voice}/${stage}: ${id}`).not.toContain(id)
        }
      }
      expect(idsAt(world, voice, 'after-school', 'good-news'), `${voice}: «one of the older girls» is a school-years sentence – after-school does not claim it`).not.toContain(NEW_GOOD_NEWS[0])
      // ⚠ POSITIVE CONTROL: «not reachable» about a row that is not in the catalogue at all is vacuously true, so the same
      // world must hand each row over where it DOES list the stage.
      for (const stage of ['school', 'after-school'] as const) {
        expect(idsAt(world, voice, stage, 'curiosity'), `${voice}/${stage}: control – the curiosities ARE reachable where they list`).toEqual(expect.arrayContaining([...NEW_CURIOSITIES]))
      }
      expect(idsAt(world, voice, 'school', 'good-news'), `${voice}: control – the good news IS reachable at school`).toContain(NEW_GOOD_NEWS[0])
    }
  })

  it('the three are ordinary rows – ungated, four-voiced, NO second beat, the right subject and stages – and they sit seven from the end (R63–R69 follow them)', () => {
    // ⚠ RE-AIMED 14.10 (r51 continuation, builder E3): «the last three» became «the three before the last four» when R63–R66 (tests/round51-school-worry-decision-pool.test.ts) were appended after them; the order of what was there did not move.
    expect(
      // ⚠ RE-AIMED A FIFTH TIME 14.10 (r52, builder F4): «the last four» became «the last seven» when R67–R69 (tests/r52-coach-feel-talk.test.ts) were appended after R66; the order of what was there did not move.
      SMALL_TALK_SITUATIONS.slice(-10, -7).map((s) => s.id),
      'appended last: a pool of a different length reads a different position, but the order of what was there does not move',
    ).toEqual([...NEW_ROWS])
    for (const id of NEW_ROWS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      const curiosity = (NEW_CURIOSITIES as readonly string[]).includes(id)
      expect(s.subject, `${id}: subject`).toBe(curiosity ? 'curiosity' : 'good-news')
      expect(s.fact, `${id}: no career fact behind it – that is what makes it reachable on a bare career`).toBeNull()
      expect([...s.stages].sort(), `${id}: stages`).toEqual(curiosity ? ['after-school', 'school'] : ['school'])
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: a question she brings and a thing she brings home are not incidents told in two beats`).toBeUndefined()
      }
    }
  })
})

// =================================================================================================
// B. THE DRAW – the shipped engine, over many careers, reaches each row at the stages it lists
// =================================================================================================

describe('round 51 (continuation) B – the shipped draw hands her each of them', () => {
  const drawn = (stage: DiaryLifeStage, subject: string): Said[] =>
    careers().flat().filter((s) => s.stage === stage && s.detail.startsWith(`${subject}:`))
  const count = (xs: readonly Said[], subject: string, id: string): number => xs.filter((s) => s.detail === `${subject}:${id}`).length

  it('⭐⭐⭐ every one of the three is drawn by the real engine at each stage it lists – reachable, not merely listed', () => {
    const report: Record<string, unknown> = {}
    for (const stage of ['school', 'after-school'] as const) {
      const cur = drawn(stage, 'curiosity')
      const good = drawn(stage, 'good-news')
      report[stage] = {
        curiosity: cur.length,
        perCuriosity: Object.fromEntries(NEW_CURIOSITIES.map((id) => [id, count(cur, 'curiosity', id)])),
        goodNews: good.length,
        perGoodNews: Object.fromEntries(NEW_GOOD_NEWS.map((id) => [id, count(good, 'good-news', id)])),
        allConversations: careers().flat().filter((s) => s.stage === stage).length,
      }
    }
    // ⚠ THE DENOMINATOR IS PRINTED BEFORE ANY CLAIM IS MADE ABOUT IT, so that an arm which fails the first expectation below
    // still shows how many conversations it walked: a null result needs a non-empty denominator on BOTH arms.
    if (process.env.R51_E2_REPORT === '1') {
      // eslint-disable-next-line no-console
      console.info(`R51_E2_REPORT ${JSON.stringify(report)}`)
    }
    for (const stage of ['school', 'after-school'] as const) {
      const cur = drawn(stage, 'curiosity')
      // ⚠ ANTI-VACUITY FIRST: a draw of nothing proves nothing. 120 careers walked for sixteen years hold far more than
      // this at the school stage, and after-school is the shorter window of the two.
      expect(cur.length, `${stage}: curiosities walked`).toBeGreaterThan(stage === 'school' ? 250 : 150)
      for (const id of NEW_CURIOSITIES) expect(count(cur, 'curiosity', id), `${stage}: ${id} drawn at least once`).toBeGreaterThan(0)
    }
    const schoolGood = drawn('school', 'good-news')
    expect(schoolGood.length, 'school: good news walked').toBeGreaterThan(200)
    expect(count(schoolGood, 'good-news', NEW_GOOD_NEWS[0]), 'school: the good news drawn at least once').toBeGreaterThan(0)
    // The stage filter holds in the REAL draw too, not only in `reachableSituations`: after-school never hears the school-years sentence.
    expect(count(drawn('after-school', 'good-news'), 'good-news', NEW_GOOD_NEWS[0]), 'after-school: the school-years good news is never drawn').toBe(0)
  })

  it('no one of the three swallows its cell: each is under 65% of the rows of its subject drawn at either stage', () => {
    for (const stage of ['school', 'after-school'] as const) {
      const cur = drawn(stage, 'curiosity')
      for (const id of NEW_CURIOSITIES) {
        expect(count(cur, 'curiosity', id), `${stage}: ${id} was drawn – a share of nothing is not a share`).toBeGreaterThan(0)
        expect(count(cur, 'curiosity', id) / cur.length, `${stage}: ${id} was ${count(cur, 'curiosity', id)} of ${cur.length}`).toBeLessThan(0.65)
      }
    }
    const good = drawn('school', 'good-news')
    expect(count(good, 'good-news', NEW_GOOD_NEWS[0]), 'school: the good news was drawn – a share of nothing is not a share').toBeGreaterThan(0)
    expect(count(good, 'good-news', NEW_GOOD_NEWS[0]) / good.length, `school: the good news was ${count(good, 'good-news', NEW_GOOD_NEWS[0])} of ${good.length}`).toBeLessThan(0.65)
  })
})

// =================================================================================================
// C. THE COPY RULES OF THE ADDENDUM – the ones that are rules rather than wording
// =================================================================================================

describe('round 51 (continuation) C – the three keep the document\'s rules', () => {
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

  it('the sweep has something to sweep – 3 rows x 4 voices x (opener, 3 labels, 3 replies)', () => {
    expect(copyLines().length).toBe(3 * 4 * 7)
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

  it('⭐⭐ none of the 57 new strings appears in any other source file', () => {
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
    expect(checked, 'the strings checked (12 openers + 36 replies + 9 labels)').toBe(57)
  })
})

// =================================================================================================
// E. THE RUSSIAN IS THERE – zero keys without Russian, asked of the rows themselves
// =================================================================================================

describe('round 51 (continuation) E – every new English line has its Russian in ru.json', () => {
  const ru = JSON.parse(readFileSync(new URL('../src/i18n/ru.json', import.meta.url), 'utf8')) as Record<string, string>

  it('⭐⭐ 57 keys, each with a Russian value that is Cyrillic, has no Latin letter, and wears the guillemets on a spoken line', () => {
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
    expect(checked, '12 openers + 36 replies + 9 labels').toBe(57)
  })
})
