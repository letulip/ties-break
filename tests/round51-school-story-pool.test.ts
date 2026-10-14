// ROUND 51 №17 – THE SCHOOL YEARS HAD ONE STORY, AND HE SAW IT THREE TIMES.
//
// His report, 14.10: the net-cord-into-the-coffee sketch (`court-four`) is very good, he has now
// seen it three times, and he asked for more variety in the funny sketches and for them to come
// round more at random.
//
// ⚠⚠ THE DRAW WAS ALREADY RANDOM, WHICH IS WHY THE FIX IS A POOL AND NOT A DICE. The subject and the
// situation are each drawn on their own sub-stream (`seed:life:smalltalk:subject:<week>` and
// `…:situation:<week>`), and the last two conversations are kept off the table. What a school-age
// girl could reach, with none of the career facts that open `line-call`, `march-entry`,
// `coach-real` and `beat-her-conqueror`, was TWO situations: `practice-clicked` and `court-four`.
// With a memory of two the exclusion gives way, oldest first, rather than leave the pool empty,
// and two situations that take turns are an alternation, not a draw.
//
// So four more stories were written (R53–R56 in `docs/specs/small-talk-corpus-2026-09.md`, the
// 14.10 addendum) and NOTHING ELSE moved: not the weekly chance, not the season cap, not the depth
// of the memory. This file pins both halves – that the pool is now wide, and that the shipped
// draw spreads over it.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: the roundtrip net (`round44-corpus-roundtrip.test.ts`) owns
// «the catalogue is the document»; the exclusion tests (`round43-small-talk-exclusion.test.ts`) own
// the memory. This file owns the two facts of this item: the school story cell is no longer one
// row, and `court-four` is no longer the story a school-age girl is handed.
//
// ⚠ NO CYRILLIC IN THIS FILE, by the house rule for source: the Russian lives in `ru.json`, fed by
// `docs/localization/ru-small-talk-situations-c-2026-10.md` §17–§22.
//
// ⚠⚠ MEASURED ON 14.10, and the arms are named so they can be re-run:
//   R51_REPORT=1 npx vitest run --project unit tests/round51-school-story-pool.test.ts
// 120 careers x 624 weeks, a close bond, a bare world – nobody plays a match or hires a coach, so
// the facts behind `line-call`, `coach-real` and `beat-her-conqueror` stay false (`march-entry`
// opens and shuts with the calendar).
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – the control arms ran in an ISOLATED worktree (../tb-b12, detached at
// 0fe15aca, node_modules linked), never in the shared checkout.
// -------------------------------------------------------------------------------------------------
//   ARM 0  THE SHIPPED TREE (55 rows). 1870 school conversations, 914 of them stories. court-four
//          170 = 9.1% of all and 18.6% of stories; the other four 200 / 199 / 183 / 162. 10 of 10 green.
//   ARM 1  THE CATALOGUE WITHOUT THE FOUR – this file copied into the worktree at the commit before
//          (51 rows). The same 1870 conversations (the cadence belongs to the gate and the cap, not
//          the pool) but only 621 stories, and court-four is ALL of them: 621 of 621 = 100.0% of
//          stories, 33.2% of all. 7 of 10 RED – the three census cases, the share, the reachability
//          case and both copy sweeps (which name the missing row). The 3 that must not care stay
//          green: the adult stages, the constants and the memory.
//   ARM 2  THE TWO DIGEST FAMILIES ON THAT SAME PRISTINE TREE – `coach-travel-edge-late-schemas` and
//          `i18n-l3-5-life-beats`: 43 of 43 GREEN there, 9 RED in the shipped tree. So the move in
//          `PRE_WAVE_STRINGS['5/0']` ('cb62362' → '38f6336d') and in the eight «does not travel»
//          byte-identity cases is these four rows' doing and nothing else's. They are NOT re-stamped
//          here: the architect re-stamps the played-career digests once, at the close-out, on the
//          final tree (r51 B11 left the diary's the same way).
//
// ⚠ WHY THE «ALL CONVERSATIONS» BAR IS 20% AND NOT THE STORY BAR'S 40%: the brief guessed the old
// share at ~50% (a pool of two taking turns). Measured, it was 33.2% – the calendar's `march-entry`
// joins the pool in season – so a 40% bar on all conversations would have PASSED on the old
// catalogue and proved nothing. 20% sits between the arms (33.2% before, 9.1% after); the story bar
// (100% before, 18.6% after) keeps its 40%.
import { describe, expect, it } from 'vitest'

import {
  createWorld,
  kidAgeExact,
  lifeLogOf,
  reachableSituations,
  rollSmallTalk,
  SMALL_TALK_EXCLUDE_LAST,
  SMALL_TALK_SITUATIONS,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf } from '../src/engine/spirit'
import { diaryLifeStageFor } from '../src/engine/diary/facts'
import { schoolIsOver } from '../src/engine/kidLife'
import type { BondBand, DiaryLifeStage } from '../src/shared/protocol'

/** The four, in the order the document appends them. The first is a junior event's scene (a gran
 *  walking onto the court); the other three do not depend on her age. */
const NEW_STORIES = [
  'the-gran-with-sunscreen',
  'the-rooster-ringtone',
  'the-coin-and-the-drain',
  'the-gull-in-the-chair',
] as const
const AGE_FREE = NEW_STORIES.slice(1)

// -------------------------------------------------------------------------------------------------
// FIXTURES – round 43's own (ask the ladder for the bond, pose only the voice), and for its reasons.
// ⚠ A BARE world on purpose: no coach, no match, no open entry. That is the career the complaint is
// about, and the only one on which the facts that widen the pool are all false.
// -------------------------------------------------------------------------------------------------

function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

function careerAt(seed: string, voice: Temperament): WorldState {
  const world = createWorld(seed)
  world.bond = bondFor('close')
  world.temperament = voice
  world.lifeLog = []
  return world
}

function stageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    false,
  )
}

/** One conversation as the engine stored it, how wide her choice was that week BEFORE the memory
 *  narrowed it, and the stage she was in. */
interface Said {
  detail: string
  pool: number
  stage: DiaryLifeStage
}

/** A career walked week by week, answering every row the moment it is raised – the parent the bench
 *  models, and the only one whose cadence is the shipped one (a live soft row blocks the next). */
function walk(world: WorldState, voice: Temperament, weeks: number): Said[] {
  const out: Said[] = []
  for (let w = 0; w < weeks; w++) {
    world.week = w
    const before = lifeLogOf(world).length
    const stage = stageAt(world, w)
    const pool = reachableSituations(world, voice, stage).length
    rollSmallTalk(world)
    const log = world.lifeLog ?? []
    if (log.length === before) continue
    const row = log[log.length - 1]
    out.push({ detail: row.detail, pool, stage })
    row.answer = 'more'
  }
  return out
}

const CAREERS = 120
const WEEKS = 52 * 12

let memo: Said[][] | null = null
/** Every career's conversations, computed once for the file. */
function careers(): Said[][] {
  if (memo === null) {
    memo = []
    for (let i = 0; i < CAREERS; i++) {
      const voice = TEMPERAMENTS[i % TEMPERAMENTS.length]
      memo.push(walk(careerAt(`r51-17-${i}`, voice), voice, WEEKS))
    }
  }
  return memo
}

function storyIdsAt(world: WorldState, voice: Temperament, stage: DiaryLifeStage): string[] {
  return reachableSituations(world, voice, stage)
    .filter((s) => s.subject === 'story')
    .map((s) => s.id)
}

// =================================================================================================
// A. THE POOL – what a school-age girl on a bare career can be handed
// =================================================================================================

describe('round 51 №17 A – the school years have stories to draw', () => {
  it('⭐⭐ school: at least FOUR stories need no career fact – court-four and the four new ones, for every voice', () => {
    const world = careerAt('r51-17-census', 'sunny')
    for (const voice of TEMPERAMENTS) {
      const ids = storyIdsAt(world, voice, 'school')
      expect(ids.length, `${voice}: it was ONE before the item – a pool a memory of two turns into an alternation`).toBeGreaterThanOrEqual(4)
      expect(ids, `${voice}: the five`).toEqual(expect.arrayContaining(['court-four', ...NEW_STORIES]))
    }
  })

  it('after-school: the three age-free stories reach it and the gran – a junior event\'s scene – does not', () => {
    const world = careerAt('r51-17-census', 'deep')
    for (const voice of TEMPERAMENTS) {
      const ids = storyIdsAt(world, voice, 'after-school')
      expect(ids, `${voice}: the three that do not depend on her age`).toEqual(expect.arrayContaining(['court-four', ...AGE_FREE]))
      expect(ids, `${voice}: a gran walking onto a court is not an after-school scene`).not.toContain('the-gran-with-sunscreen')
    }
  })

  it('college and independent: none of the four reaches them – those stages already held twelve stories', () => {
    const world = careerAt('r51-17-census', 'quiet')
    for (const stage of ['college', 'independent'] as const) {
      for (const voice of TEMPERAMENTS) {
        const ids = storyIdsAt(world, voice, stage)
        for (const id of NEW_STORIES) expect(ids, `${voice}/${stage}: ${id}`).not.toContain(id)
        expect(ids.length, `${voice}/${stage}: the adult stories are untouched`).toBe(12)
      }
    }
  })

  it('the four are ordinary rows – ungated, story, four-voiced, with a second beat – and they sit at positions 52 to 55, so the first 51 keep their order (the three observations and the three curiosity and good-news rows of the same day follow them)', () => {
    // ⚠ RE-AIMED 14.10 (r51 continuation, builder E1): «the last four» became «the four before the last three» when R57–R59 (observations, tests/round51-school-observation-pool.test.ts) were appended after them; the order of what was there did not move.
    // ⚠ RE-AIMED AGAIN 14.10 (r51 continuation, builder E2): «the four before the last three» became «the four before the last six» when R60–R62 (tests/round51-school-curiosity-goodnews-pool.test.ts) were appended after the observations; the order of what was there did not move.
    expect(SMALL_TALK_SITUATIONS.slice(-10, -6).map((s) => s.id), 'appended last: a pool of a different length reads a different position, but the order of what was there does not move').toEqual([...NEW_STORIES])
    for (const id of NEW_STORIES) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)!
      expect(s.subject, `${id}: subject`).toBe('story')
      expect(s.fact, `${id}: no career fact behind it – that is what makes it reachable on a bare career`).toBeNull()
      expect(Object.keys(s.voices).sort(), `${id}: four voices`).toEqual([...TEMPERAMENTS].slice().sort())
      for (const voice of TEMPERAMENTS) {
        expect(s.voices[voice]!.shared, `${id}/${voice}: a story is two beats`).toBeDefined()
      }
    }
  })

  it('the tuning constants did not move – the pool was the lever, not these', () => {
    // ⚠ THEY ARE PINNED HERE BECAUSE THE FIX WOULD HAVE BEEN EASY TO MAKE WITH THEM: a shorter memory
    // makes a thin pool repeat less and a bigger one repeat more. The owner's rule (a measured
    // balance change ships with a bench) is why they stay put, and why a change to them is a
    // decision this file refuses to let slip through as a side effect.
    expect(SMALL_TALK_EXCLUDE_LAST, 'the memory of how many she last said').toBe(2)
    expect(ECONOMY.life.smallTalkCapPerSeason, 'the conversations a season holds at most').toBe(4)
  })
})

// =================================================================================================
// B. THE DRAW – the shipped engine, over many careers, spreads across the pool
// =================================================================================================

describe('round 51 №17 B – the shipped draw hands her a different story', () => {
  const schoolDraws = (): Said[] => careers().flat().filter((s) => s.stage === 'school')
  const count = (xs: readonly Said[], detail: string): number => xs.filter((s) => s.detail === detail).length

  it('⭐⭐⭐ court-four is no longer the story she is handed: under 40% of the school stories, and under 20% of ALL school conversations', () => {
    const all = schoolDraws()
    const stories = all.filter((s) => s.detail.startsWith('story:'))
    // ⚠ ANTI-VACUITY FIRST: a share of an empty set is a share of nothing. 120 careers x 12 years
    // of weekly rolls hold well over a thousand school conversations on this recipe.
    expect(all.length, 'school-stage conversations walked').toBeGreaterThan(1000)
    expect(stories.length, 'and the story subject was actually drawn in them').toBeGreaterThan(250)
    const four = count(stories, 'story:court-four')
    const shareOfStories = four / stories.length
    const shareOfAll = four / all.length
    if (process.env.R51_REPORT === '1') {
      const per = Object.fromEntries([ 'court-four', ...NEW_STORIES].map((id) => [id, count(stories, `story:${id}`)]))
      // eslint-disable-next-line no-console
      console.info(`R51_REPORT school: ${all.length} conversations, ${stories.length} stories, court-four ${four} = ${(shareOfAll * 100).toFixed(1)}% of all, ${(shareOfStories * 100).toFixed(1)}% of stories; per story ${JSON.stringify(per)}`)
    }
    expect(shareOfStories, `court-four was ${four} of ${stories.length} school stories`).toBeLessThan(0.4)
    expect(shareOfAll, `court-four was ${four} of ${all.length} school conversations`).toBeLessThan(0.2)
  })

  it('every one of the five school stories is drawn by the real engine – the new rows are reachable, not merely listed', () => {
    const stories = schoolDraws().filter((s) => s.detail.startsWith('story:'))
    for (const id of ['court-four', ...NEW_STORIES]) {
      expect(count(stories, `story:${id}`), `${id}: drawn at least once in the school years`).toBeGreaterThan(0)
    }
  })

  it('⭐ the memory still holds: wherever she had at least three to choose from, she did not repeat either of her last two', () => {
    // «AT LEAST THREE» IS THE HONEST QUALIFIER: with the last two banned a pool of three keeps one,
    // so the exclusion can promise the whole of what it says. Below that it gives way by design.
    let pairs = 0
    let bad = 0
    for (const said of careers()) {
      for (let k = 2; k < said.length; k++) {
        if (!said[k].detail.includes(':') || said[k].pool < SMALL_TALK_EXCLUDE_LAST + 1) continue
        pairs++
        if (said[k].detail === said[k - 1].detail || said[k].detail === said[k - 2].detail) bad++
      }
    }
    expect(pairs, 'the anti-vacuity half – conversations with a real choice were counted').toBeGreaterThan(1500)
    expect(bad, `${bad} of ${pairs} repeated one of her last two`).toBe(0)
  })
})

// =================================================================================================
// C. THE COPY RULES OF THE ADDENDUM – the ones that are rules rather than wording
// =================================================================================================

describe('round 51 №17 C – the four stories keep the document\'s rules', () => {
  // ⚠ BUILT INSIDE THE CASES AND NOT AT COLLECTION: a row missing from the catalogue must be a RED
  // case that names the row, not a collection error that reports «no tests» and hides the arm
  // (the first control run of this file, against the 51-row catalogue, did exactly that).
  function copyLines(): { where: string; text: string }[] {
    const lines: { where: string; text: string }[] = []
    for (const id of NEW_STORIES) {
      const s = SMALL_TALK_SITUATIONS.find((r) => r.id === id)
      if (s === undefined) throw new Error(`${id}: not in the catalogue`)
      for (const voice of TEMPERAMENTS) {
        const col = s.voices[voice]!
        lines.push({ where: `${id}/${voice}/opener`, text: col.opener })
        lines.push({ where: `${id}/${voice}/shared`, text: col.shared! })
        for (const stance of ['invite', 'respond', 'space'] as const) {
          lines.push({ where: `${id}/${voice}/${stance}/label`, text: col.branches[stance].label })
          lines.push({ where: `${id}/${voice}/${stance}`, text: col.branches[stance].said })
        }
      }
    }
    return lines
  }

  it('the sweep has something to sweep – 4 stories x 4 voices x (opener, shared, 3 labels, 3 replies)', () => {
    expect(copyLines().length).toBe(4 * 4 * 8)
  })

  it('no masculine pronoun, no «today», no exclamation mark, no digit and no long dash', () => {
    // ⚠ RULES AND NOT WORDING. `tests/coach-voice.test.ts` already refuses a masculine pronoun anywhere
    // outside court-four; the rest are the addendum's own: «today» asserts the same day (the
    // correct form is «this week»), the comedy is not carried by exclamation marks, a number is
    // only ever the kernel's own (written as a word), and the short dash is the house dash.
    const rules: [string, RegExp][] = [
      ['masculine pronoun', /\b(he|his|him|himself)\b/i],
      ['today', /\btoday\b/i],
      ['exclamation mark', /!/],
      ['digit', /\d/],
      ['long dash', /\u2014/],
    ]
    for (const { where, text } of copyLines()) {
      for (const [name, re] of rules) expect(re.test(text), `${where}: ${name} in «${text}»`).toBe(false)
    }
  })
})
