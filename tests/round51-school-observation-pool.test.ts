// ROUND 51 (CONTINUATION, 14.10) – THE SCHOOL YEARS HAD NO OBSERVATION AT ALL.
//
// The owner, 14.10 (quoted in the second 14.10 addendum of `docs/specs/small-talk-corpus-2026-09.md`):
// the other school subjects are thin too – take them in the same way, in both languages, with the whole
// tone of voice and every ruling as the reference. Builder B12's corpus bench (`npm run bench:smalltalk
// -- --seeds 60`, K4) had measured the cell: school `observation` 0, after-school `observation` 1 – and
// that one (R14, `the-calm-loss`) waits on the fact `played-recently`, so on a career that has played
// nothing it was empty at both stages. The spec's own floor (§3b) is three to four per subject × stage.
//
// THREE ROWS WERE WRITTEN (R57–R59, appended LAST after B12's four stories) and NOTHING ELSE MOVED: not
// the weekly chance, not the season cap, not the depth of the memory, not a subject weight. This file
// pins what the item is: the cell is no longer empty, the real draw reaches each row at both stages, the
// rows keep the addendum's rules, no line collides with another string in `src/`, and every line has
// its Russian.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: `round44-corpus-roundtrip.test.ts` owns «the catalogue is the
// document»; `round51-school-story-pool.test.ts` owns the story cell and the draw share of court-four;
// the exclusion tests own the memory. This file owns the observation cell.
//
// ⚠ NO CYRILLIC IN THIS FILE, by the house rule for source: the Russian lives in `ru.json`, fed by
// `docs/localization/ru-small-talk-situations-c-2026-10.md` §22–§26, and §E below only asks that it is THERE
// (a Cyrillic letter by code point, no Latin letter, the guillemets on a spoken line).
//
// ⚠⚠ THE SRC COLLISION SWEEP (§D) EXISTS BECAUSE OF ONE LINE: round 51 №17's «Nobody argued.» sat in
// `albumCorpus.ts` as well and turned `tests/component/album-mobile.test.ts` red at the closing gate –
// the i18n catalogue joins by English text, so one sentence in two surfaces is one key with two homes.
// Every new line was grepped before it was emitted; this is that grep, kept.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – the control arms ran in an ISOLATED worktree (../tb-e1, detached at HEAD
// 80ac069a = the shipped tree with this item reverted, node_modules linked), never in the shared checkout.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE (58 rows). 120 careers x 832 weeks, a close bond, a bare world: school 1860
//          conversations, 709 of them observations (the-warm-up-friends 231, the-sound-of-a-clean-ball 231,
//          the-fence-says-unlucky 247); after-school 1518 conversations, 318 observations (102 / 116 / 100).
//          12 of 12 green.
//          R51_E1_REPORT=1 npx vitest run --project unit tests/round51-school-observation-pool.test.ts
//   ARM 1  THE CATALOGUE WITHOUT THE THREE – this file copied into the worktree at HEAD (55 rows). The same
//          1860 school conversations and NOT ONE observation among them (the hole, measured). 11 of 12 RED:
//          the three census cases, both draw cases, the four rule and uniqueness cases (each throws «not in
//          the catalogue» and names the row), the src sweep and the Russian sweep. The one that must not
//          care stays green: college and independent.
//   ARM 2  THE DIGEST FAMILIES on the same pristine tree: coach-travel-edge (x4 files), i18n-l3-7-twin and
//          succession-s1-start-year are GREEN at HEAD and 36 tests RED in the shipped tree, so that move is
//          these three rows' and nothing else's; PICK-STABILITY (i18n-l3-5-life-beats) is already red at HEAD
//          for another reason (career 5/0 '913777ed' against '38f6336d') and moves again here ('7ac6e89').
//          None is re-stamped in this change: the architect re-stamps the played-career digests once, at
//          the close-out, on the final tree.
//   ⚠ 14.10, builder E2: the ledger above is of the tree at 58 rows. R60–R62 (two curiosities, one good news) were appended
//          after these three, which moves the draw for every seed (the pool is longer) but none of the arms' claims; the
//          fixtures moved to tests/helpers/schoolTranche.ts with their seeds unchanged.
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
// ⚠ RE-AIMED 14.10 (r51 continuation, builder E2): the career fixtures are the shared helper's now – see the FIXTURES note below.
import { careerAt, walkCareers, type Said } from './helpers/schoolTranche'

/** The three, in the order the document appends them. None depends on her age: a warm-up, a sound and a
 *  fence are the same scene at nine and at nineteen. */
const NEW_OBSERVATIONS = ['the-warm-up-friends', 'the-sound-of-a-clean-ball', 'the-fence-says-unlucky'] as const

// -------------------------------------------------------------------------------------------------
// FIXTURES – round 43's own (ask the ladder for the bond, pose only the voice), and for its reasons.
// ⚠ A BARE world on purpose: no match played, no result, no open entry. That is the career the hole was
// measured on, and the only one on which `played-recently` (R14, R34) stays false. (⚠ builder E2, 14.10: it is not
// coach-less – a fresh career has a coach from the first week – and nothing in this file relies on that.)
// ⚠ MOVED 14.10 (r51 continuation, builder E2): `bondFor`, `careerAt`, `stageAt`, `walk` and the 120-career
// walk now live in `tests/helpers/schoolTranche.ts`, which this file and
// `tests/round51-school-curiosity-goodnews-pool.test.ts` both import – a second pasted copy would be the
// shape T5.14 RULE B refuses for its merged families. The seed prefix below (`r51-e1-`) stayed in this file, so
// these are the same careers they were and every number in the ledger above still describes them.
// -------------------------------------------------------------------------------------------------

function observationIdsAt(world: WorldState, voice: Temperament, stage: DiaryLifeStage): string[] {
  return reachableSituations(world, voice, stage)
    .filter((s) => s.subject === 'observation')
    .map((s) => s.id)
}

let memo: Said[][] | null = null
/** Every career's conversations, computed once for the file. */
function careers(): Said[][] {
  if (memo === null) memo = walkCareers('r51-e1-')
  return memo
}

// =================================================================================================
// A. THE POOL – what a school-age girl, and a girl just out of school, can be handed on a bare career
// =================================================================================================

describe('round 51 (continuation) A – the observation cell is no longer empty', () => {
  it('⭐⭐ school: at least THREE observations need no career fact – the three new ones, for every voice', () => {
    const world = careerAt('r51-e1-census', 'sunny')
    for (const voice of TEMPERAMENTS) {
      const ids = observationIdsAt(world, voice, 'school')
      expect(ids.length, `${voice}: it was ZERO before the item`).toBeGreaterThanOrEqual(3)
      expect(ids, `${voice}: the three`).toEqual(expect.arrayContaining([...NEW_OBSERVATIONS]))
    }
  })

  it('after-school: the three reach it too, on a career that has played nothing (R14 waits on a fact)', () => {
    const world = careerAt('r51-e1-census', 'deep')
    for (const voice of TEMPERAMENTS) {
      const ids = observationIdsAt(world, voice, 'after-school')
      expect(ids, `${voice}: the three that do not depend on her age`).toEqual(expect.arrayContaining([...NEW_OBSERVATIONS]))
      expect(ids, `${voice}: R14 waits on played-recently and a bare career has not played`).not.toContain('the-calm-loss')
    }
  })

  it('college and independent: none of the three reaches them, and the ungated adult observations are untouched', () => {
    const world = careerAt('r51-e1-census', 'quiet')
    for (const stage of ['college', 'independent'] as const) {
      for (const voice of TEMPERAMENTS) {
        const ids = observationIdsAt(world, voice, stage)
        for (const id of NEW_OBSERVATIONS) expect(ids, `${voice}/${stage}: ${id}`).not.toContain(id)
        // R33, R35, R36, R37 and R49 need no fact; R14 and R34 wait on `played-recently`.
        expect(ids.length, `${voice}/${stage}: the ungated adult observations`).toBe(5)
      }
    }
  })

  it('the three are ordinary rows – ungated, observation, four-voiced, school and after-school, NO second beat – and they sit three from the end (R60–R62 follow them)', () => {
    // ⚠ RE-AIMED 14.10 (r51 continuation, builder E2): «the last three» became «the three before the last three» when R60–R62 (tests/round51-school-curiosity-goodnews-pool.test.ts) were appended after them; the order of what was there did not move.
    expect(
      SMALL_TALK_SITUATIONS.slice(-6, -3).map((s) => s.id),
      'appended last: a pool of a different length reads a different position, but the order of what was there does not move',
    ).toEqual([...NEW_OBSERVATIONS])
    for (const id of NEW_OBSERVATIONS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      expect(s.subject, `${id}: subject`).toBe('observation')
      expect(s.fact, `${id}: no career fact behind it – that is what makes it reachable on a bare career`).toBeNull()
      expect([...s.stages].sort(), `${id}: stages`).toEqual(['after-school', 'school'])
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: an observation is something she noticed, not an incident told in two beats`).toBeUndefined()
      }
    }
  })
})

// =================================================================================================
// B. THE DRAW – the shipped engine, over many careers, reaches each row at BOTH stages
// =================================================================================================

describe('round 51 (continuation) B – the shipped draw hands her each of them', () => {
  const observationsAt = (stage: DiaryLifeStage): Said[] =>
    careers().flat().filter((s) => s.stage === stage && s.detail.startsWith('observation:'))
  const count = (xs: readonly Said[], id: string): number => xs.filter((s) => s.detail === `observation:${id}`).length

  it('⭐⭐⭐ every one of the three is drawn by the real engine at school AND at after-school – reachable, not merely listed', () => {
    for (const stage of ['school', 'after-school'] as const) {
      const obs = observationsAt(stage)
      // ⚠ ANTI-VACUITY FIRST: a draw of nothing proves nothing. 120 careers walked for sixteen years hold
      // far more than this at the school stage, and after-school is the shorter window of the two.
      if (process.env.R51_E1_REPORT === '1') {
        const per = Object.fromEntries(NEW_OBSERVATIONS.map((id) => [id, count(obs, id)]))
        // eslint-disable-next-line no-console
        console.info(`R51_E1_REPORT ${stage}: ${obs.length} observations drawn; per row ${JSON.stringify(per)}; all conversations at the stage ${careers().flat().filter((s) => s.stage === stage).length}`)
      }
      expect(obs.length, `${stage}: observations walked`).toBeGreaterThan(stage === 'school' ? 150 : 15)
      for (const id of NEW_OBSERVATIONS) {
        expect(count(obs, id), `${stage}: ${id} drawn at least once`).toBeGreaterThan(0)
      }
    }
  })

  it('no one of the three swallows the cell: each is under 60% of the observations drawn at either stage', () => {
    for (const stage of ['school', 'after-school'] as const) {
      const obs = observationsAt(stage)
      for (const id of NEW_OBSERVATIONS) {
        expect(count(obs, id) / obs.length, `${stage}: ${id} was ${count(obs, id)} of ${obs.length}`).toBeLessThan(0.6)
      }
    }
  })
})

// =================================================================================================
// C. THE COPY RULES OF THE ADDENDUM – the ones that are rules rather than wording
// =================================================================================================

describe('round 51 (continuation) C – the three observations keep the document\'s rules', () => {
  // ⚠ BUILT INSIDE THE CASES AND NOT AT COLLECTION: a row missing from the catalogue must be a RED
  // case that names the row, not a collection error that reports «no tests» and hides the arm.
  function copyLines(): { where: string; text: string }[] {
    const lines: { where: string; text: string }[] = []
    for (const id of NEW_OBSERVATIONS) {
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

  it('the sweep has something to sweep – 3 observations x 4 voices x (opener, 3 labels, 3 replies)', () => {
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
    for (const id of NEW_OBSERVATIONS) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
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
    for (const id of NEW_OBSERVATIONS) {
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
    for (const id of NEW_OBSERVATIONS) {
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
