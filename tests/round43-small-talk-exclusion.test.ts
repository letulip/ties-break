// ROUND 43 #8(a) – SHE MAY NOT BRING THE SAME SMALL THING TWICE RUNNING.
//
// His report, 16.09: «Она пришла 2 раза подряд с *the players I've been watching barely talk about
// winning*. Мне кажется этих микро диалогов должно быть много и они точно не должны так часто
// повторяться, иначе в чём смысл.»
//
// ⚠⚠ IT WAS A GUARANTEE AND NOT BAD LUCK, which is why the fix is a mechanism and not a bigger
// catalogue. `rollSmallTalk` drew the subject and the situation fresh every week and excluded
// NOTHING said before, so on a pool of one or two a back-to-back repeat was the likeliest single
// outcome the draw could produce. `docs/specs/small-talk-corpus-2026-09.md` owns the other half –
// fourteen rebuilt situations, DRAFT, with him – and this file owns the mechanism alone.
//
// ⚠⚠ THE MUTATION ARMS THIS FILE WAS BUILT AGAINST – each one applied, run, watched to fail, and
// reverted. The counts are the measured ones, not a forecast:
//   ARM 1  `withoutRecentSituations` returns `[...reachable]` unconditionally (the pre-fix draw).
//          → 6 of 11 red (A1, B1, B4, D, E1, E2): the adjacent repeats come straight back.
//   ARM 2  the degradation loop deleted – `return kept` even when `kept.length === 0`.
//          → 2 red (C1, D): a one-situation career falls through to the legacy generic opener.
//   ARM 3  the degradation drops the NEWEST exclusion first (`recent.shift()` for `recent.pop()`).
//          → 3 red (A1, D, E2): with two reachable and two remembered she is handed back the line
//            his complaint is about, and the older one is banned for nothing.
//   ARM 4  the exclusion applied AFTER the subject draw instead of before (with a fall-back to the
//          unnarrowed subject pool, which is what that ordering forces).
//          → 2 red (A1, E2). ⚠ E1 stayed GREEN under it and is recorded as the weaker half: it is a
//            property of the exclusion alone, and the ORDER is only visible end to end.
import { describe, expect, it } from 'vitest'

import {
  createWorld,
  lifeLogOf,
  raiseLifeBeat,
  reachableSituations,
  rollSmallTalk,
  withoutRecentSituations,
  kidAgeExact,
  SMALL_TALK_EXCLUDE_LAST,
  SMALL_TALK_SITUATIONS,
  TEMPERAMENTS,
  type SmallTalkSituation,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { bondBandOf } from '../src/engine/spirit'
import { diaryLifeStageFor } from '../src/engine/diary/facts'
import { schoolIsOver } from '../src/engine/kidLife'
import type { BondBand, DiaryLifeStage } from '../src/shared/protocol'

// -------------------------------------------------------------------------------------------------
// FIXTURES – the round-42 file's own, and for its own reasons (ask the ladder, pose only the voice).
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

/** One conversation, as the engine stored it, plus how wide her choice was that week. */
interface Said {
  detail: string
  pool: number
}

/** A career walked week by week, answering every row the moment it is raised – the parent the bench
 *  models, and the only one whose cadence is the shipped one (a live soft row blocks the next). */
function walk(world: WorldState, voice: Temperament, weeks: number): Said[] {
  const out: Said[] = []
  for (let w = 0; w < weeks; w++) {
    world.week = w
    const before = lifeLogOf(world).length
    const pool = reachableSituations(world, voice, stageAt(world, w)).length
    rollSmallTalk(world)
    const log = world.lifeLog ?? []
    if (log.length === before) continue
    const row = log[log.length - 1]
    out.push({ detail: row.detail, pool })
    row.answer = 'more'
  }
  return out
}

/** The situations one voice can reach at all – the only slice a single career ever sees.
 *  ⚠ ROUND 44 – «HAS HER COLUMN» RATHER THAN «IS HERS». A situation is written per voice now, so a
 *  row belongs to up to four girls instead of one; the question the exclusion cares about is
 *  unchanged (which rows are in HER pool) and only the way a row answers it moved. */
function ofVoice(voice: Temperament): SmallTalkSituation[] {
  return SMALL_TALK_SITUATIONS.filter((s) => s.voices[voice] !== undefined)
}

function detailOf(s: SmallTalkSituation): string {
  return `${s.subject}:${s.id}`
}

// =================================================================================================
// A. THE COMPLAINT ITSELF – across real careers, no two running
// =================================================================================================

describe('round 43 #8(a) A – the same small thing does not come twice running', () => {
  it('⭐⭐ over 96 careers, EVERY adjacent pair whose later week had an alternative is different', () => {
    // ⚠ «HAD AN ALTERNATIVE» IS THE HONEST QUALIFIER AND NOT A LET-OFF. The exclusion never empties
    // the pool (§C), so on a week whose reachable set is ONE situation nothing can stop her bringing
    // it again – there is nothing else she could honestly have brought. The claim this case makes is
    // the whole of what a mechanism CAN promise: wherever she had a choice, she did not repeat.
    let pairs = 0
    let bad = 0
    for (let i = 0; i < 96; i++) {
      const voice = TEMPERAMENTS[i % TEMPERAMENTS.length]
      const world = careerAt(`r43-adj-${i}`, voice)
      world.coachId = 'coach-1'
      const said = walk(world, voice, 52 * 14)
      for (let k = 1; k < said.length; k++) {
        if (!said[k].detail.includes(':') || said[k].pool < 2) continue
        pairs++
        if (said[k].detail === said[k - 1].detail) bad++
      }
    }
    expect(pairs, 'the anti-vacuity half – careers with a real choice exist and were counted').toBeGreaterThan(200)
    expect(bad, `${bad} of ${pairs} adjacent pairs repeated a situation she could have avoided`).toBe(0)
  })

  it('⭐ and the defect it replaces was REAL on this very corpus – the same walk with no memory repeats', () => {
    // ⚠ THE CONTROL IS THE ENGINE WITH ITS HISTORY HIDDEN, NOT A SECOND IMPLEMENTATION. Rewriting a
    // raised row's detail to its subject half is exactly a pre-#8(a) row (`smallTalkSituationOf`
    // reads the colon), so `withoutRecentSituations` matches nothing and returns the pool unchanged.
    // Without this case §A above would be green on a catalogue so thin that no repeat was possible,
    // which is the «two arms compared to each other» vacuity this wave has caught before.
    let bad = 0
    for (let i = 0; i < 96; i++) {
      const voice = TEMPERAMENTS[i % TEMPERAMENTS.length]
      const world = careerAt(`r43-adj-${i}`, voice)
      world.coachId = 'coach-1'
      const seen: Said[] = []
      for (let w = 0; w < 52 * 14; w++) {
        world.week = w
        const before = lifeLogOf(world).length
        const pool = reachableSituations(world, voice, stageAt(world, w)).length
        rollSmallTalk(world)
        const log = world.lifeLog ?? []
        if (log.length === before) continue
        const row = log[log.length - 1]
        seen.push({ detail: row.detail, pool })
        row.answer = 'more'
        row.detail = row.detail.split(':')[0]
      }
      for (let k = 1; k < seen.length; k++) {
        if (seen[k].detail.includes(':') && seen[k].pool >= 2 && seen[k].detail === seen[k - 1].detail) bad++
      }
    }
    expect(bad, 'a career with no memory of what it said DOES repeat – the defect is reproducible').toBeGreaterThan(50)
  })
})

// =================================================================================================
// B. THE UNIT – what the exclusion does, asked directly
// =================================================================================================

describe('round 43 #8(a) B – the exclusion itself', () => {
  it('⭐ the last two are gone when there is room for them to be', () => {
    const voice: Temperament = 'deep'
    const pool = ofVoice(voice)
    expect(pool.length, 'the fixture needs three of one voice to have anything to say').toBeGreaterThanOrEqual(3)
    const world = careerAt('r43-unit', voice)
    raiseLifeBeat(world, 'small-talk', detailOf(pool[0]))
    raiseLifeBeat(world, 'small-talk', detailOf(pool[1]))
    const kept = withoutRecentSituations(world, pool)
    expect(kept.map(detailOf)).not.toContain(detailOf(pool[0]))
    expect(kept.map(detailOf)).not.toContain(detailOf(pool[1]))
    expect(kept.length).toBe(pool.length - 2)
  })

  it('⚠ TWO and not three – the window is `SMALL_TALK_EXCLUDE_LAST`, and a third row back is free again', () => {
    const voice: Temperament = 'deep'
    const pool = ofVoice(voice)
    const world = careerAt('r43-window', voice)
    for (let i = 0; i <= SMALL_TALK_EXCLUDE_LAST; i++) raiseLifeBeat(world, 'small-talk', detailOf(pool[i % pool.length]))
    // The OLDEST of the three is outside the window, so it is drawable again.
    const kept = withoutRecentSituations(world, pool).map(detailOf)
    expect(kept, 'the row before the last two is back on the table').toContain(detailOf(pool[0]))
  })

  it('⚠ a LEGACY row names no situation, so it bans nothing', () => {
    const voice: Temperament = 'deep'
    const pool = ofVoice(voice)
    const world = careerAt('r43-legacy', voice)
    // The shipped pre-#24 shape: a bare subject, no colon, no situation behind it.
    raiseLifeBeat(world, 'small-talk', 'worry')
    raiseLifeBeat(world, 'small-talk', 'story')
    expect(withoutRecentSituations(world, pool).length, 'nothing was said that could be repeated').toBe(pool.length)
  })

  it('⚠ rows of OTHER kinds are not her small talk and are not excluded', () => {
    const voice: Temperament = 'deep'
    const pool = ofVoice(voice)
    const world = careerAt('r43-kinds', voice)
    raiseLifeBeat(world, 'small-talk', detailOf(pool[0]))
    raiseLifeBeat(world, 'met', 'someone')
    raiseLifeBeat(world, 'fork-opinion', 'level:money')
    // The two newer rows are not small talk, so the window still reaches her one conversation.
    expect(withoutRecentSituations(world, pool).map(detailOf)).not.toContain(detailOf(pool[0]))
  })
})

// =================================================================================================
// C. IT NEVER EMPTIES THE POOL – the degradation his thin cells need
// =================================================================================================

describe('round 43 #8(a) C – a pool of one still speaks', () => {
  it('⭐⭐ one reachable situation, just said: she says it again rather than falling through to the generic opener', () => {
    const voice: Temperament = 'deep'
    const one = [ofVoice(voice)[0]]
    const world = careerAt('r43-thin', voice)
    raiseLifeBeat(world, 'small-talk', detailOf(one[0]))
    const kept = withoutRecentSituations(world, one)
    expect(kept.length, 'the pool is never emptied – an empty one falls through to the legacy line').toBe(1)
    expect(detailOf(kept[0])).toBe(detailOf(one[0]))
  })

  it('⭐⭐⭐ ROUND 44 – there is no empty cell left to fall through FROM, which is the round\'s own headline', () => {
    // ⚠⚠ THIS CASE USED TO POSE `fiery` AT `college` AS THE EMPTY CELL AND THAT FIXTURE IS NOW FALSE,
    // which is a result rather than a breakage: the corpus spec opened on «a `fiery` girl has ONE
    // situation in the entire game, and none at all after school», and this is where that stops being
    // true. So the case asserts what replaced it – no (voice × stage) cell is empty on a BARE career,
    // with no coach, no feed and no calendar, so every gated situation is refused.
    //
    // ⚠ THE LEGACY FALL-THROUGH IS NOT DELETED FROM THE ENGINE AND IS NOT CLAIMED DEAD. It is the
    // branch `rollSmallTalk` takes when `reachable.length === 0`, and the guard below asserts the
    // degradation cannot MANUFACTURE that state, which is §C's whole subject. What changed is only
    // that no catalogue cell arrives in it.
    const world = careerAt('r43-no-empty-cell', 'fiery')
    world.events = []
    world.coachId = null
    world.season = []
    world.entries = []
    for (const voice of TEMPERAMENTS) {
      for (const stage of ['school', 'after-school', 'college', 'independent'] as const) {
        expect(
          reachableSituations(world, voice, stage).length,
          `${voice}/${stage}: an empty cell – she has nothing to bring`,
        ).toBeGreaterThan(0)
      }
    }
    // ...and the empty-pool guard itself, asked directly, because that is the only way in now.
    expect(withoutRecentSituations(world, []), 'an empty pool stays empty rather than being invented').toEqual([])
  })
})

// =================================================================================================
// D. OLDEST FIRST – the order the degradation gives them up in
// =================================================================================================

describe('round 43 #8(a) D – the oldest exclusion is surrendered first', () => {
  it('⭐⭐ two reachable, two remembered: she is handed the OLDER of them, never the one she just said', () => {
    // ⚠ THIS IS THE CASE THAT DECIDES BETWEEN `pop()` AND `shift()` AND IT IS THE POINT OF THE RULE.
    // Excluding both would empty a pool of two. Giving up the OLDEST leaves the other one, which is
    // not what she said last week. Giving up the NEWEST would hand her back the very line his
    // complaint is about, with the older one banned for no reason at all.
    const voice: Temperament = 'deep'
    const pool = ofVoice(voice).slice(0, 2)
    expect(pool.length).toBe(2)
    const world = careerAt('r43-order', voice)
    raiseLifeBeat(world, 'small-talk', detailOf(pool[0])) // older
    raiseLifeBeat(world, 'small-talk', detailOf(pool[1])) // newest – the one just said
    const kept = withoutRecentSituations(world, pool)
    expect(kept.length, 'the pool is not emptied').toBe(1)
    expect(detailOf(kept[0]), 'the OLDER one comes back, not the newest').toBe(detailOf(pool[0]))
  })
})

// =================================================================================================
// E. THE ORDER OF THE TWO STEPS – narrowed before the subject is drawn, never after
// =================================================================================================

describe('round 43 #8(a) E – the pool is narrowed before the subject draw', () => {
  it('⭐⭐ a subject whose only situation was just said cannot be drawn and then found empty', () => {
    // ⚠ WHAT GOES WRONG IF THE ORDER FLIPS. Four of the six subjects hold exactly ONE situation, so
    // a subject drawn over the UNNARROWED set can be one whose single entry is banned – and the
    // draw is then left choosing between a second read off one key and a silent fall-through. The
    // engine's own guarantee is that the subject is drawn over what survived, so every subject it
    // can name still has something behind it. Asked as a property over every voice and stage.
    for (const voice of TEMPERAMENTS) {
      const pool = ofVoice(voice)
      if (pool.length === 0) continue
      const world = careerAt(`r43-order-${voice}`, voice)
      for (const s of pool) {
        world.lifeLog = []
        raiseLifeBeat(world, 'small-talk', detailOf(s))
        for (const kept of withoutRecentSituations(world, pool)) {
          expect(
            pool.some((p) => p.subject === kept.subject && detailOf(p) !== detailOf(s)) ||
              detailOf(kept) !== detailOf(s),
            `${voice}: every surviving situation is one the narrowed subject walk can reach`,
          ).toBe(true)
        }
      }
    }
  })

  it('⭐ and a real career never raises a row naming a situation it had just named, at any pool width', () => {
    // The end-to-end restatement of the same property, walked rather than argued.
    for (let i = 0; i < 24; i++) {
      const voice = TEMPERAMENTS[i % TEMPERAMENTS.length]
      const world = careerAt(`r43-e2e-${i}`, voice)
      world.coachId = 'coach-1'
      const said = walk(world, voice, 52 * 12)
      for (let k = 1; k < said.length; k++) {
        if (said[k].pool >= 2 && said[k].detail.includes(':')) {
          expect(said[k].detail, `career ${i} repeated with ${said[k].pool} to choose from`).not.toBe(
            said[k - 1].detail,
          )
        }
      }
    }
  })
})
