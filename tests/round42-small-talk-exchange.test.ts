// ROUND 42 #15 / #24 – THE SMALL-TALK EXCHANGE, AND THE FIVE FINDINGS THAT OUTRANK ITS COPY.
//
// The two complaints, in the owner's own words:
//
//   #15 «выбрал пункт, чтобы она сказала больше, а попап закрылся… может быть мы можем какие-то
//        ситуации сгенерировать и сделать всё-таки какие-то продолжения для диалогов и разные
//        варианты реакции ребенка на разные ответы? Сейчас выглядит как "сказала А, но никогда не
//        сказала Б".»
//   #24 «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
//        разнообразия, это же наша главная фича.»
//
// The spec is `docs/specs/the-small-talk-exchange-2026-09.md`; §8a–§8c are his copy and §8d is the
// five DESIGN findings his review made, which is what this file is mostly about. §A–§C below are the
// machinery; §D is the factual boundary; §E is HIS voice test, built the way he specified rather than
// the obvious way; §F and §G are the two laws the round may not break while fixing anything.
//
// ⚠⚠ WHY §E IS NOT «THE TWO VOICES SHARE NO SENTENCE», WHICH IS WHAT THE FIRST DRAFT PROPOSED. His
// correction, verbatim from §8d.3: those two have different SITUATIONS – a line call and a new flat –
// «and different situations produce different words all by themselves. That demonstrates nothing
// about temperament.» His test is:
//
//     Same event, same facts, same age, same parental choice – four different ways of noticing,
//     disclosing and responding.
//
// ⭐ And «not one shared phrase» is explicitly the WRONG target: «real people all say "Okay", "I
// know", "Good". The difference lives in context, rhythm and what follows. A test asserting disjoint
// vocabulary would fail honest writing and pass four strangers.» So §E asserts the difference AND
// asserts the sharing, and the second half is what stops it passing four strangers.
//
// -------------------------------------------------------------------------------------------------
// THE MUTATION LEDGER – every arm run, and the red it produced. An arm that did not redden is a case
// that was not measuring what its title says.
// -------------------------------------------------------------------------------------------------
//
//   ARM 1   `reachableSituations`' fact clause deleted (`s.fact === null || …` → `true`).
//           **5 RED** · §D's four «⭐⭐⭐ a competitive claim is unreachable when the fact is false»
//           cases, plus «⚠ and the gate is asked at the DRAW» – which is §8d.5 as a behaviour.
//   ARM 2   the shared paragraph dropped from the branch replies (`[shared, said]` → `[said]`).
//           **1 RED** · §B «⭐⭐ a story is TWO beats and every route finishes it (§8d.2)».
//   ARM 3   the label overlay dropped (`smallTalkLabels(...)` → `undefined` at the call site).
//           **1 RED** · §B «⭐⭐ the three answers wear the SITUATION's words (§8d.1)».
//   ARM 4   `drawSmallTalkSubject`'s uniform replaced by a constant 0 (the draw collapsed onto the
//           first reachable subject).
//           **2 RED** · §C «⭐ the subject is a WEIGHTED DRAW – ONE career meets more than one small
//           thing» and «⭐⭐ the situation draw is keyed on the seed and on the week».
//           ⚠⚠ AND THIS ARM CAUGHT THE FILE ITSELF FIRST. The weighted-draw case's ORIGINAL form
//           pooled the subjects seen across four voices and twelve careers, and it stayed GREEN under
//           this arm – different girls reach different subjects, so a pool over all of them varies
//           whatever the draw does. The case was re-written per career, with a `couldVary` control,
//           and only then did the arm redden. Recorded because a mutation ledger whose arms all bite
//           on the first try usually means the arms were chosen to bite.
//   ARM 5   the situation draw's key folded onto the hazard's own key
//           (`:smalltalk:situation:<week>` → `:smalltalk:<week>`).
//           **0 RED HERE, 1 RED IN `tests/wave3-small-talk.test.ts` §B** («⭐ a close home that HITS
//           derives its own three keys»). ⚠ THE FIRST FORM OF §C's KEY CASE WAS VACUOUS and this arm
//           is how that was found: it transcribed the three keys into the test and asserted they were
//           three different strings – the code compared with itself, green under any engine mutation
//           whatsoever. The key COUNT belongs to the file that owns the RNG recorder; what stands
//           here is the behaviour the split keys buy.
//   ARM 6   `court-four`'s `deep` column replaced, line by line, with a copy of its `fiery` column.
//           **4 RED** · §E's «four different ways of NOTICING», «…of DISCLOSING», «…of RESPONDING»
//           and «⚠ and the difference survives the assembler».
//   ARM 7   `court-four`'s `quiet` incident replaced by an unrelated anecdote – the «four strangers»
//           arm, which is the one a disjoint-vocabulary test would have PASSED.
//           **1 RED** · §E «⭐ …and they are the SAME event – the four share the facts».
//   ARM 8   a fourth reply added to `LIFE_BEAT_OPTIONS['small-talk']` priced at `bond: 1`.
//           **4 RED** · §A's «the three stances are total», §B's «every answer earns a second line»
//           and «the three answers wear the SITUATION's words», §F's «every reply is still a literal
//           zero».
//   ARM 9   `SMALL_TALK_FRAME_REGISTER['worry']` moved from `low` to `bright`.
//           **1 RED** · §B «⭐ the parent's frame agrees with the SUBJECT, not with the week».
//   ARM 10  `line-call` given a `stages` entry its opener has no frame for (`college`).
//           **1 RED** · §A «⭐⭐ every declared stage resolves to a frame this situation actually has».
//   ARM 12  `lifeBeatPromptFor` re-deriving the stage from the CURRENT week again
//           (`lifeStageAt(world, row.week)` → `lifeStageOf(world)`) – i.e. the defect put back.
//           **1 RED** · §C «⭐⭐⭐ a soft row survives the week her STAGE changes under it», and the
//           red is the crash itself: «small-talk situation decision:march-entry has no away frame».
//           ⚠⚠ THIS ONE WAS A REAL BUG THE BUILD FOUND IN ITSELF, not a hypothetical. A roof-only
//           scene left unanswered across a stage boundary threw inside `toSnapshot`, which is the
//           object the whole app renders from – a bricked career, three weeks after a conversation
//           nobody answered.
//   ARM 11  the dialog's reply `v-for` narrowed to her FIRST paragraph only (`LifeBeatDialog.vue`).
//           **2 RED in `tests/component/life-beat-dialog.test.ts`** · «⭐⭐⭐ PHASE 2 – her REPLY is on
//           screen» and «⚠⚠ MUTATION PROOF – a reply that outgrows the phone». The story's second
//           beat reaching the SCREEN is a claim only a mounted test can make.
//
// ⚠ ONE MORE CORRECTION THIS FILE EARNED, in §A: «the narration names her» was written with
// `includes('her')`, and «longer than the others» contains `her` – so the one frame that names nobody
// passed, and the exception it was written to record could never have been reached. Word boundaries
// now.
import { describe, expect, it } from 'vitest'

import {
  answerLifeBeat,
  buildSoftBeatInvite,
  createWorld,
  entryStatus,
  lifeBeatSaid,
  lifeLogOf,
  raiseLifeBeat,
  reachableSituations,
  rollSmallTalk,
  smallTalkEligible,
  kidAgeExact,
  KID_ID,
  LIFE_BEAT_OPTIONS,
  SMALL_TALK_SITUATIONS,
  SMALL_TALK_STANCES,
  SMALL_TALK_STANCE_ID,
  SMALL_TALK_SUBJECTS,
  TEMPERAMENTS,
  type SmallTalkSituation,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
import { weekMonth } from '../src/shared/dates'
import { diaryLifeStageFor } from '../src/engine/diary/facts'
import { schoolIsOver } from '../src/engine/kidLife'
import { bondBandOf } from '../src/engine/spirit'
import { player } from './radarFixtures'
import type { BondBand, DiaryLifeStage, WorldEvent } from '../src/shared/protocol'

const OPTIONS = LIFE_BEAT_OPTIONS['small-talk']
const ROOF_STAGES: readonly DiaryLifeStage[] = ['school', 'after-school']

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band, found by ASKING THE LADDER rather than by
 *  re-deriving its cut points – wave3-small-talk.test.ts' own helper, for its own reason. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A career parked at a week with a chosen voice and an empty life. ⚠ A REAL `createWorld`, so the
 *  profile, the seed, the calendar and the event feed are the engine's own; only the temperament is
 *  posed, and it is posed because the catalogue is keyed on it. */
function careerAt(seed: string, week: number, voice: Temperament): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.bond = bondFor('close')
  world.temperament = voice
  world.lifeLog = []
  return world
}

/** The first week this career reads as a given life stage – ASKED of the diary's own single
 *  derivation rather than computed from an age this file would then own a second copy of. The
 *  catalogue gates on the stage, so a case about a call-only scene has to be able to stand her in a
 *  dormitory. ⚠ `inCollege: false` throughout: `college` is a state a test would have to pose, and
 *  `independent` is the away stage every away situation here also declares. */
function weekForStage(world: WorldState, stage: DiaryLifeStage): number {
  for (let w = 60; w < 52 * 30; w++) {
    const read = diaryLifeStageFor(
      kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay),
      schoolIsOver(w, world.profile.birthMonth),
      false,
    )
    if (read === stage) return w
  }
  throw new Error(`no week of this career reads as ${stage}`)
}

/** The stage this career reads as at an arbitrary week – the diary's own derivation, asked directly,
 *  so the boundary case below FINDS the flip rather than assuming where it is. */
function stageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    false,
  )
}

/** Which of a situation's declared stages this file poses it at. ⚠ `college` IS AVOIDED WHERE THERE
 *  IS A CHOICE, because posing it means posing `world.college` – a state with its own rules – and
 *  every away situation in the catalogue declares `independent` beside it. The presence frame is the
 *  same on both, which is the fact that makes the substitution honest (`presenceOf`). */
function poseableStage(s: SmallTalkSituation): DiaryLifeStage {
  const preferred: readonly DiaryLifeStage[] = ['school', 'after-school', 'independent']
  const found = preferred.find((stage) => s.stages.includes(stage))
  if (found === undefined) throw new Error(`${s.id}/${s.voice} declares no stage this file can pose`)
  return found
}

/** One competitive match in the feed, with only the three fields the gate reads standing in for a
 *  real record. ⚠ `friendly` LEFT OFF, not set false: a practice set is excluded by the gate and §D
 *  has its own case for that. */
function matchEvent(id: number, week: number, opponent: string, won: boolean): WorldEvent {
  return {
    id,
    week,
    type: 'match',
    text: 'a match',
    match: {
      round: 0,
      aId: KID_ID,
      bId: opponent,
      winnerId: won ? KID_ID : opponent,
      eventId: `e-${week}`,
      surface: 'hard',
      oppName: 'Opp',
      a: player(KID_ID),
      b: player(opponent),
    },
  }
}

/** Every rendered string of one situation – opener frames, the shared incident, and the six words of
 *  its three branches. Used by the shape sweep and by the voice test. */
function linesOf(s: SmallTalkSituation): string[] {
  return [
    s.opener.roof,
    s.opener.away,
    s.shared,
    ...SMALL_TALK_STANCES.flatMap((stance) => [s.branches[stance].label, s.branches[stance].said]),
  ].filter((line): line is string => line !== undefined)
}

/** The four voice columns of one situation id, in `TEMPERAMENTS` order. Throws rather than skipping,
 *  because §E's whole claim is that all four exist. */
function fourVoicesOf(id: string): SmallTalkSituation[] {
  return TEMPERAMENTS.map((voice) => {
    const found = SMALL_TALK_SITUATIONS.find((s) => s.id === id && s.voice === voice)
    if (found === undefined) throw new Error(`${id} has no ${voice} column`)
    return found
  })
}

// =================================================================================================
// A. THE CATALOGUE – shapes only, never a sentence of his (invariant 4)
// =================================================================================================
describe('round 42 #24 A – the situation catalogue is total where it claims to be', () => {
  it('the sweep has something to sweep (a guard that reads nothing passes everything)', () => {
    expect(SMALL_TALK_SITUATIONS.length).toBeGreaterThan(8)
    expect(new Set(SMALL_TALK_SITUATIONS.map((s) => s.id)).size, 'more than one situation').toBeGreaterThan(5)
  })

  it('⭐⭐ every declared stage resolves to a frame this situation actually has', () => {
    // ARM 10's target. A situation whose `stages` reach a presence its opener has no line for would
    // throw at render time, on a real career, weeks after the commit that widened it.
    for (const s of SMALL_TALK_SITUATIONS) {
      expect(s.stages.length, `${s.id}/${s.voice}: declares no stage at all`).toBeGreaterThan(0)
      for (const stage of s.stages) {
        const roof = ROOF_STAGES.includes(stage)
        const frame = roof ? s.opener.roof : s.opener.away
        expect(frame, `${s.id}/${s.voice}: declares ${stage} and has no ${roof ? 'roof' : 'away'} frame`).toBeTruthy()
      }
      // ...and it really is assembled through the engine rather than read off the object here.
      for (const stage of s.stages) {
        expect(
          lifeBeatSaid('small-talk', `${s.subject}:${s.id}`, s.voice, 'level', 'close', 'open', stage),
          `${s.id}/${s.voice}/${stage}: the assembler could not word it`,
        ).toBeTruthy()
      }
    }
  })

  it('⚠ the corpus shape rules hold – one quoted span, the short dash, no number, no price', () => {
    for (const s of SMALL_TALK_SITUATIONS) {
      for (const frame of [s.opener.roof, s.opener.away]) {
        if (frame === undefined) continue
        expect((frame.match(/"/g) ?? []).length, `one quoted span: ${frame}`).toBe(2)
      }
      for (const line of linesOf(s)) {
        expect(line, `no em-dash: ${line}`).not.toContain('—')
        expect(line, `a price or a number in: ${line}`).not.toMatch(/[$€£]|\bcents?\b|\bdollars?\b|\d/)
        expect(line, `Cyrillic in: ${line}`).not.toMatch(/[Ѐ-ӿ]/)
      }
    }
  })

  it('⚠ the narration outside the quotation names her – with the ONE exception he wrote himself', () => {
    // The corpus rule since wave 1. ⚠ `new-place`'s «A pause on the line, longer than the others.» is
    // HIS sentence and his own verdict on that scene was «the best in the set»; it names nobody, and
    // it is recorded as the exception rather than edited – exactly as the two `Her …` away frames
    // were in the вычитка fold. Naming it here is what keeps a SECOND one from arriving quietly.
    const unnamed: string[] = []
    for (const s of SMALL_TALK_SITUATIONS) {
      for (const frame of [s.opener.roof, s.opener.away]) {
        if (frame === undefined) continue
        // ⚠ WORD BOUNDARIES AND NOT `includes`, WHICH IS A CORRECTION THIS CASE EARNED ON ITS FIRST
        // RUN: «longer than the others» contains `her`, so a substring test called the one frame that
        // names nobody compliant and the exception below could never have been reached.
        const narration = frame.split('"')[0]
        if (!/\b(she|her|hers|herself)\b/i.test(narration)) unnamed.push(`${s.id}/${s.voice}: ${frame}`)
      }
    }
    expect(unnamed.map((u) => u.split(':')[0]), 'exactly one frame names nobody, and it is his').toEqual([
      'new-place/quiet',
    ])
  })

  it('⚠ the three stances are total, and their ids are the three that shipped', () => {
    // The ids are PERSISTED in `LifeBeatRecord.answer`; new words on the buttons may not become new
    // ids, or every answered small-talk row in every shipped save would stop being readable.
    expect(SMALL_TALK_STANCES.map((s) => SMALL_TALK_STANCE_ID[s]).sort()).toEqual(
      OPTIONS.map((o) => o.id).slice().sort(),
    )
    for (const s of SMALL_TALK_SITUATIONS) {
      expect(Object.keys(s.branches).sort(), `${s.id}/${s.voice}: a stance is missing`).toEqual(
        [...SMALL_TALK_STANCES].sort(),
      )
    }
  })

  it('⚠ every subject the catalogue names is one of the six', () => {
    for (const s of SMALL_TALK_SITUATIONS) {
      expect(SMALL_TALK_SUBJECTS, `${s.id}: unknown subject ${s.subject}`).toContain(s.subject)
    }
  })
})

// =================================================================================================
// B. ⭐⭐⭐ THE EXCHANGE – #15's own fix: she says B, and every route finishes what it started
// =================================================================================================
describe('round 42 #15 B – the beat is an exchange', () => {
  /** A career holding one raised situation row, with the prompt the hub would open. ⚠ THE WEEK IS
   *  CHOSEN FOR THE SITUATION'S OWN STAGE, through the diary's single derivation, because a
   *  call-only scene rendered from a kitchen would throw – which is §A's claim, asserted there. */
  function exchange(seed: string, voice: Temperament, situation: SmallTalkSituation) {
    const world = careerAt(seed, 200, voice)
    world.week = weekForStage(world, poseableStage(situation))
    raiseLifeBeat(world, 'small-talk', `${situation.subject}:${situation.id}`)
    return { world, prompt: buildSoftBeatInvite(world)!.prompt }
  }

  it('⭐⭐⭐ every answer earns a second line of hers – the whole of «сказала А, но никогда не сказала Б»', () => {
    const story = fourVoicesOf('court-four')[1]
    const { prompt } = exchange('exchange-1', story.voice, story)
    expect(prompt.followUps.map((f) => f.optionId), 'one reply per stance, in the card\'s own order').toEqual(
      OPTIONS.map((o) => o.id),
    )
    for (const follow of prompt.followUps) {
      expect(follow.said.length, `${follow.optionId}: she says nothing back`).toBeGreaterThan(0)
      expect(follow.done, `${follow.optionId}: no control to close on`).toBeTruthy()
    }
  })

  it('⭐⭐ a story is TWO beats and every route finishes it (§8d.2)', () => {
    // ARM 2's target. «The thing itself is a SHARED continuation; the branch is what the parent does
    // with the aftermath. A branch that leaves the player waiting for B is the shipped defect wearing
    // a new coat.»
    for (const story of fourVoicesOf('court-four')) {
      const { prompt } = exchange(`story-${story.voice}`, story.voice, story)
      for (const follow of prompt.followUps) {
        expect(follow.said.length, `${story.voice}/${follow.optionId}: a story route with one beat`).toBe(2)
        expect(follow.said[0], `${story.voice}/${follow.optionId}: the incident is not shared`).toBe(story.shared)
      }
      // ...and the three aftermaths really are three, so «shared» has not swallowed the branch.
      expect(new Set(prompt.followUps.map((f) => f.said[1])).size, `${story.voice}: three aftermaths`).toBe(3)
    }
  })

  it('⚠ a situation that is NOT a story carries one paragraph per route', () => {
    const plain = SMALL_TALK_SITUATIONS.filter((s) => s.shared === undefined)
    expect(plain.length, 'the anti-vacuity half – there are non-story situations').toBeGreaterThan(3)
    for (const s of plain) {
      const { prompt } = exchange(`plain-${s.id}-${s.voice}`, s.voice, s)
      for (const follow of prompt.followUps) expect(follow.said.length, `${s.id}/${follow.optionId}`).toBe(1)
    }
  })

  it('⭐⭐ the three answers wear the SITUATION\'s words, not the generic three (§8d.1)', () => {
    // ARM 3's target. «Say how we see it» promises a view and then she answers an opinion the player
    // never heard; the fix is that the label names the position the parent is taking.
    for (const s of SMALL_TALK_SITUATIONS) {
      const { prompt } = exchange(`labels-${s.id}-${s.voice}`, s.voice, s)
      expect(prompt.options.map((o) => o.id), `${s.id}/${s.voice}: the ids are the shipped three`).toEqual(
        OPTIONS.map((o) => o.id),
      )
      expect(prompt.options.map((o) => o.label), `${s.id}/${s.voice}: the situation's own words`).toEqual(
        SMALL_TALK_STANCES.map((stance) => s.branches[stance].label),
      )
    }
  })

  it('⭐ the parent\'s frame agrees with the SUBJECT, not with the week', () => {
    // ARM 9's target. Spec §2 cuts the one-to-one between the Mood register and the subject, so the
    // shipped bright heading over a worry would be the card contradicting her own first line.
    // ⚠ THE EXPECTATION IS A TABLE OF ITS OWN and not a call into the engine – wave3-small-talk's
    // `EXPECTED_SUBJECT` lesson, that an equality comparing the code with itself survives the very
    // mutation it was written to catch.
    const FRAME: Record<string, string> = {
      worry: 'She came to us with something on her mind',
      'good-news': 'She came to us with something good this week',
      decision: 'She came to us with something this week',
      curiosity: 'She came to us with something this week',
      observation: 'She came to us with something this week',
      story: 'She came to us with something this week',
    }
    for (const s of SMALL_TALK_SITUATIONS) {
      const { prompt } = exchange(`frame-${s.id}-${s.voice}`, s.voice, s)
      expect(prompt.heading, `${s.id}/${s.voice}: the frame`).toBe(FRAME[s.subject])
    }
    // ...and the three frames really are three, so the table above is not one string four times.
    expect(new Set(Object.values(FRAME)).size, 'three frames in the shipped pool').toBe(3)
  })

  it('⚠ a LEGACY row earns no second line and keeps the three generic words – the shipped card', () => {
    const world = careerAt('legacy-row', 200, 'quiet')
    raiseLifeBeat(world, 'small-talk', 'question')
    const prompt = buildSoftBeatInvite(world)!.prompt
    expect(prompt.followUps, 'the beat that shipped had no second line').toEqual([])
    expect(prompt.options.map((o) => o.label), 'and the three labels that shipped').toEqual(OPTIONS.map((o) => o.label))
    expect(prompt.said, 'and her opener is the legacy pool\'s').toBe(
      lifeBeatSaid('small-talk', 'question', 'quiet', 'level', 'close'),
    )
  })

  it('⚠ the engine re-validates the answer, and an id the card never offered is refused', () => {
    const s = fourVoicesOf('court-four')[0]
    const { world } = exchange('revalidate', s.voice, s)
    expect(() => answerLifeBeat(world, 'not-an-answer')).toThrow(/not one of the answers/)
    answerLifeBeat(world, SMALL_TALK_STANCE_ID.respond)
    expect(lifeLogOf(world)[0].answer, 'and the real one lands').toBe(SMALL_TALK_STANCE_ID.respond)
  })
})

// =================================================================================================
// C. THE DRAW – deterministic, keyed, weighted, and nowhere near MAIN
// =================================================================================================
describe('round 42 #24 C – what she comes with is drawn, not decided', () => {
  it('⭐ the same career on the same week brings the same small thing, over and over', () => {
    const a = careerAt('draw-determinism', 0, 'sunny')
    const b = careerAt('draw-determinism', 0, 'sunny')
    const details: string[][] = [[], []]
    for (const [i, world] of [a, b].entries()) {
      for (let w = 200; w < 460; w++) {
        world.week = w
        world.lifeLog = []
        rollSmallTalk(world)
        const row = lifeLogOf(world)[0]
        if (row !== undefined) details[i].push(`${w}:${row.detail}`)
      }
    }
    expect(details[1], 'same seed, same week, same small thing').toEqual(details[0])
    expect(details[0].length, 'the anti-vacuity half – the span really raised rows').toBeGreaterThan(5)
  })

  it('⭐ the subject is a WEIGHTED DRAW – ONE career meets more than one small thing', () => {
    // ARM 4's target, and this case earned a CORRECTION on its first run. Its first form pooled the
    // subjects seen across four voices and twelve careers and stayed GREEN under ARM 4 (the draw
    // collapsed onto the first reachable subject) – because different girls reach different subjects,
    // so a pool over all of them varies whatever the draw does. That is the «two arms compared to
    // each other» defect this wave has caught before. #24's complaint is about ONE player's career,
    // so ONE career is the unit, and only the careers that have something to choose between are asked.
    let couldVary = 0
    let didVary = 0
    for (const voice of TEMPERAMENTS) {
      for (let i = 0; i < 12; i++) {
        const world = careerAt(`weights-${voice}-${i}`, 0, voice)
        world.coachId = 'coach-1'
        const reachable = new Set(reachableSituations(world, voice, 'school').map((r) => r.subject))
        if (reachable.size < 2) continue
        couldVary++
        const seen = new Set<string>()
        for (let w = 200; w < 720; w++) {
          world.week = w
          world.lifeLog = []
          rollSmallTalk(world)
          const row = lifeLogOf(world)[0]
          if (row !== undefined) seen.add(row.detail.split(':')[0])
        }
        if (seen.size > 1) didVary++
      }
    }
    expect(couldVary, 'the anti-vacuity half – careers with a real choice exist').toBeGreaterThan(10)
    expect(didVary, `a career that could vary and never did is the defect #24 names (${didVary}/${couldVary})`).toBe(
      couldVary,
    )
  })

  it('⭐⭐ the situation draw is keyed on the seed and on the week – it is not a constant', () => {
    // ⚠⚠ THE KEY COUNT ITSELF BELONGS TO `tests/wave3-small-talk.test.ts` §B, which owns the RNG
    // recorder and asserts the three keys by name and in order (ARM 5 reddens there – measured). What
    // this case can honestly say without that recorder is the BEHAVIOUR the keys buy, and its first
    // form said nothing at all: it compared three strings this file had transcribed against each
    // other, which is green under any mutation of the engine whatsoever.
    /** What she came with, week by week, over one span of one career. */
    function walk(seed: string): string[] {
      const world = careerAt(seed, 0, 'deep')
      const out: string[] = []
      for (let w = 200; w < 720; w++) {
        world.week = w
        world.lifeLog = []
        rollSmallTalk(world)
        const row = lifeLogOf(world)[0]
        if (row !== undefined) out.push(`${w}:${row.detail}`)
      }
      return out
    }
    const mine = walk('key-week')
    expect(mine.length, 'the span raised rows – nothing here is vacuous').toBeGreaterThan(8)
    expect(new Set(mine.map((d) => d.split(':').slice(1).join(':'))).size, 'the week moves the answer').toBeGreaterThan(1)
    // ...and a different seed is a different life, walked over the identical weeks.
    const other = walk('key-seed')
    expect(other.length, 'the second career raised rows too').toBeGreaterThan(8)
    expect(other, 'two seeds, two lives').not.toEqual(mine)
  })

  it('⭐⭐⭐ a soft row survives the week her STAGE changes under it – it does not throw, and it does not move house', () => {
    // ⚠⚠ THIS CASE EXISTS BECAUSE THE BUILD FOUND THE BUG, and it bricks a career rather than merely
    // looking wrong. A tier-1 row is SOFT: it lives three weeks and its card is re-assembled on every
    // `toSnapshot`. A situation with only a ROOF frame – «She was straight into it before her bag was
    // down» – has no line at all for a girl on a call. So a row raised in the last weeks before a
    // stage boundary and left unanswered across it would be re-worded at a stage its own copy cannot
    // reach, and the opener assembler throws INSIDE the snapshot the whole app renders from.
    //
    // The fix is `lifeStageAt(world, row.week)`: the scene happened on the row's own week, and a
    // conversation waiting to be heard did not change rooms while it waited.
    const world = careerAt('stage-flip', 0, 'quiet')
    // THE BOUNDARY, FOUND RATHER THAN ASSUMED: the last roof week before this career reads `away`.
    const away = weekForStage(world, 'independent')
    const flip = away - 1
    expect(stageAt(world, flip), 'the week before really is a roof stage').toBe('after-school')
    expect(stageAt(world, away), 'and the week after really is an away one').toBe('independent')
    // A roof-only situation, raised on the last roof week.
    const roofOnly = SMALL_TALK_SITUATIONS.find((x) => x.opener.away === undefined && x.voice === 'quiet')!
    world.week = flip
    raiseLifeBeat(world, 'small-talk', `${roofOnly.subject}:${roofOnly.id}`)
    const atRaise = buildSoftBeatInvite(world)!.prompt.said
    expect(atRaise, 'the raise week words it from the roof').toBe(roofOnly.opener.roof)
    // ⚠ THE ARM IS REAL: asked at the stage she is in NEXT week, the assembler does refuse. That
    // refusal is what used to reach the snapshot.
    expect(
      () =>
        lifeBeatSaid('small-talk', `${roofOnly.subject}:${roofOnly.id}`, 'quiet', 'level', 'close', 'open', 'independent'),
      'the assembler really has no away frame for this scene',
    ).toThrow(/has no away frame/)
    // ⭐ AND THE CARD CROSSES THE BOUNDARY WITHOUT THROWING AND WITHOUT MOVING HOUSE. The row is still
    // inside its three-week window on the far side of the flip, which is exactly the state that used
    // to brick the save.
    let seen = 0
    for (let ahead = 1; ahead <= 2; ahead++) {
      world.week = flip + ahead
      const live = buildSoftBeatInvite(world)
      expect(live, `w+${ahead}: the row left its window early`).not.toBeNull()
      expect(live!.prompt.said, `w+${ahead}: the scene moved house while it waited`).toBe(atRaise)
      seen++
    }
    expect(seen, 'the loop really crossed the boundary').toBe(2)
  })

  it('⚠ the row records the situation, and re-rendering the card does not re-draw it', () => {
    const world = careerAt('stable-situation', 200, 'fiery')
    world.week = 200
    while (world.week < 600 && lifeLogOf(world).length === 0) {
      if (smallTalkEligible(world)) rollSmallTalk(world)
      if (lifeLogOf(world).length === 0) world.week++
    }
    const row = lifeLogOf(world)[0]
    expect(row, 'a row was raised – nothing below is vacuous').toBeTruthy()
    const first = buildSoftBeatInvite(world)!.prompt
    const second = buildSoftBeatInvite(world)!.prompt
    expect(second, 'the same card, twice, from the same row').toEqual(first)
    // ...and a week later, still inside the window, it is still the same small thing.
    world.week++
    expect(buildSoftBeatInvite(world)!.prompt.said, 'the situation is stamped, not re-derived').toBe(first.said)
  })
})

// =================================================================================================
// D. ⭐⭐⭐ THE FACTUAL BOUNDARY (§8d.5) – she may interpret an outcome, never invent one
// =================================================================================================
//
// «Generated situation detail is hers and must stay STABLE across the exchange – the flat, the
// coffee, the dad who put the lid back on. A COMPETITIVE claim touches the authoritative career and
// needs a real fact behind it – entering a particular tournament, missing a scheduled session, a
// decision deadline, beating an opponent, four previous losses to her.»
//
// ⚠ THE CLAIM IS UNREACHABILITY AND NOT A DISCLAIMER: a situation that asserts a career fact must not
// be drawable at all on a week where the fact is false. Each case below poses the FALSE world first
// and the TRUE world second, so the positive control is beside the negative claim.
describe('round 42 #15 D – a competitive claim is unreachable when the fact is false', () => {
  /** Is this situation offered to this girl, at this stage, on this career? */
  function offered(world: WorldState, voice: Temperament, stage: DiaryLifeStage, id: string): boolean {
    return reachableSituations(world, voice, stage).some((s) => s.id === id)
  }

  it('⭐⭐⭐ «How do you know when you\'ve got a real coach» needs a coach', () => {
    const world = careerAt('fact-coach', 200, 'sunny')
    world.coachId = null
    expect(offered(world, 'sunny', 'school', 'coach-real'), 'no coach, no question about one').toBe(false)
    world.coachId = 'coach-1'
    expect(offered(world, 'sunny', 'school', 'coach-real'), 'and with one, she may ask').toBe(true)
  })

  it('⭐⭐⭐ «There was a call today» needs a match in the last weeks', () => {
    const world = careerAt('fact-played', 200, 'fiery')
    world.events = []
    expect(offered(world, 'fiery', 'school', 'line-call'), 'no match, no line call').toBe(false)
    // ⚠ AND A MATCH LONG AGO IS NOT «TODAY» – the window is what makes this a fact rather than a
    // career-long licence.
    world.events = [matchEvent(1, 100, 'ai-9', false)]
    expect(offered(world, 'fiery', 'school', 'line-call'), 'a match a hundred weeks ago is not today').toBe(false)
    world.events = [matchEvent(1, 200, 'ai-9', false)]
    expect(offered(world, 'fiery', 'school', 'line-call'), 'and this week\'s match is').toBe(true)
  })

  it('⭐⭐⭐ «I beat someone I\'ve never beaten» needs the win AND the four losses', () => {
    const world = careerAt('fact-conqueror', 200, 'sunny')
    const id = 'beat-her-conqueror'
    world.events = []
    expect(offered(world, 'sunny', 'school', id), 'no history at all').toBe(false)
    // A win this week over somebody she has never played: «never beaten» is true and «four times» is
    // not, and her line says both.
    world.events = [matchEvent(1, 200, 'ai-7', true)]
    expect(offered(world, 'sunny', 'school', id), 'a win over a stranger is not this scene').toBe(false)
    // Four losses and no win – but no win THIS week either.
    world.events = [1, 2, 3, 4].map((i) => matchEvent(i, 150 + i, 'ai-7', false))
    expect(offered(world, 'sunny', 'school', id), 'four losses and no win is not the scene either').toBe(false)
    // Four losses, then the win.
    world.events = [...[1, 2, 3, 4].map((i) => matchEvent(i, 150 + i, 'ai-7', false)), matchEvent(5, 200, 'ai-7', true)]
    expect(offered(world, 'sunny', 'school', id), 'four losses and then the win – the scene is true').toBe(true)
    // ⚠ AND FIVE LOSSES IS NOT FOUR. «She's beaten me four times. Four!» is a number she says out
    // loud, so the gate counts rather than thresholds – she may interpret the outcome, not invent it.
    world.events = [
      ...[1, 2, 3, 4, 5].map((i) => matchEvent(i, 150 + i, 'ai-7', false)),
      matchEvent(6, 200, 'ai-7', true),
    ]
    expect(offered(world, 'sunny', 'school', id), 'five is not four, and she says the number').toBe(false)
  })

  it('⭐⭐⭐ «I\'m not sure about the March tournament» needs a real March entry with time left', () => {
    // ⚠ EARLY IN THE CAREER AND ON THE REAL CALENDAR. `world.season` is a rolling year the tick keeps
    // filled, so a fresh career holds weeks 0..47 – and March is weeks 8..12 of it, which is the whole
    // reason «the March tournament» can be a FACT at all rather than a month the game never names.
    const world = careerAt('fact-march', 4, 'quiet')
    const id = 'march-entry'
    const open = world.season.filter(
      (e) =>
        weekMonth(e.week) === 3 &&
        e.week > world.week &&
        world.week < e.deadlineWeek &&
        !world.entries.includes(e.id) &&
        entryStatus(world, e).level !== 'blocked',
    )
    expect(open.length, 'the real calendar holds a March tournament she could still enter').toBeGreaterThan(0)
    expect(offered(world, 'quiet', 'school', id), 'and so the decision is a real one').toBe(true)
    // ⚠ NO MARCH AT ALL – there is nothing to be unsure about.
    const keep = open[0]
    world.season = world.season.filter((e) => weekMonth(e.week) !== 3)
    expect(offered(world, 'quiet', 'school', id), 'no March tournament, no decision about one').toBe(false)
    world.season = [...world.season, keep]
    expect(offered(world, 'quiet', 'school', id), 'one back, and the scene is true again').toBe(true)
    // ⚠⚠ THE DEADLINE CLAUSE IS HIS («Say there's time to decide – only when the deadline actually
    // permits it», §8c), and it lives in the GATE so all three stances stay honest rather than the
    // card sometimes showing two. A week ON the deadline is «decide now», which is exactly when that
    // sentence stops being true.
    world.week = keep.deadlineWeek
    expect(offered(world, 'quiet', 'school', id), 'on the deadline there is no time to decide').toBe(false)
    world.week = keep.deadlineWeek - 2
    expect(offered(world, 'quiet', 'school', id), 'and with time left, there is').toBe(true)
    // ...and an entry already made is not a decision she is turning over.
    world.entries = [...world.entries, keep.id]
    expect(offered(world, 'quiet', 'school', id), 'an entry already made is not a decision').toBe(false)
  })

  it('⚠ a DOMESTIC situation asks the career nothing – the flat, the coffee, the lid', () => {
    // The other side of the boundary, and it is what stops the rule being «gate everything». A bare
    // career with an empty feed, no coach and no calendar still meets her stories.
    const world = careerAt('fact-domestic', 200, 'deep')
    world.events = []
    world.coachId = null
    world.season = []
    world.entries = []
    const domestic = SMALL_TALK_SITUATIONS.filter((s) => s.fact === null)
    expect(domestic.length, 'there are domestic situations to be about').toBeGreaterThan(4)
    for (const s of domestic) {
      for (const stage of s.stages) {
        expect(
          reachableSituations(world, s.voice, stage).some((r) => r.id === s.id),
          `${s.id}/${s.voice}/${stage} asked the career for permission it should not need`,
        ).toBe(true)
      }
    }
  })

  it('⚠ and the gate is asked at the DRAW, so a false fact never reaches a rendered card', () => {
    // The strongest form of §8d.5: not «the copy hedges», but «the row cannot exist». A whole career
    // of weeks with an empty feed and no coach raises no row naming a competitive fact.
    const gated = new Set(SMALL_TALK_SITUATIONS.filter((s) => s.fact !== null).map((s) => s.id))
    expect(gated.size, 'there are gated situations to be about').toBeGreaterThan(2)
    for (const voice of TEMPERAMENTS) {
      const world = careerAt(`gate-${voice}`, 0, voice)
      world.events = []
      world.coachId = null
      world.season = []
      for (let w = 200; w < 460; w++) {
        world.week = w
        world.lifeLog = []
        rollSmallTalk(world)
        const row = lifeLogOf(world)[0]
        if (row === undefined) continue
        const id = row.detail.split(':')[1]
        expect(gated.has(id ?? ''), `${voice} w${w}: raised «${row.detail}» on a career that cannot hold it`).toBe(false)
      }
    }
  })
})

// =================================================================================================
// E. ⭐⭐⭐ HIS VOICE TEST (§8d.3) – same event, same facts, same age, same parental choice
// =================================================================================================
//
// «Same event, same facts, same age, same parental choice – four different ways of noticing,
// disclosing and responding.»
//
// ⚠⚠ AND THE HALF THAT STOPS IT PASSING FOUR STRANGERS. «"Not one shared phrase" is the wrong target
// anyway: real people all say "Okay", "I know", "Good".» So the four columns are asserted to be the
// SAME EVENT – the same net cord, the same coffee, the same lid, the same serve she had to hit next –
// and the difference is asserted on TOP of that sameness, never instead of it.
describe('round 42 #24 E – four voices, one event (the owner\'s own test)', () => {
  const COURT = fourVoicesOf('court-four')

  it('the four columns really are the same event, the same facts, the same age', () => {
    // SAME EVENT: one id, one subject. SAME AGE: the same declared stages, so the comparison below is
    // never «a child against an adult». SAME FACTS: no career fact behind any of them, so the four
    // are posed on identical worlds.
    expect(new Set(COURT.map((s) => s.subject)).size, 'one subject').toBe(1)
    expect(new Set(COURT.map((s) => s.stages.join(','))).size, 'one set of stages').toBe(1)
    expect(new Set(COURT.map((s) => s.fact)).size, 'one fact – and it is none').toBe(1)
    expect(COURT.every((s) => s.fact === null), 'domestic, so the four worlds are identical').toBe(true)
    expect(COURT.map((s) => s.voice), 'and all four voices are present').toEqual([...TEMPERAMENTS])
  })

  it('⭐ ...and they are the SAME event – the four share the facts, which is what stops this passing four strangers', () => {
    // ARM 7's target. Every voice's shared paragraph carries the same incident; every voice's
    // aftermath carries the same lid. A rewrite into four unrelated anecdotes reddens HERE, which is
    // the assertion his note asks for and the one a disjoint-vocabulary test would have got backwards.
    for (const s of COURT) {
      const shared = s.shared!
      expect(shared.toLowerCase(), `${s.voice}: the net cord`).toContain('net cord')
      expect(shared.toLowerCase(), `${s.voice}: the coffee`).toContain('coffee')
      expect(shared.toLowerCase(), `${s.voice}: whose coffee`).toContain('dad')
      expect(shared.toLowerCase(), `${s.voice}: a full cup`).toMatch(/full|whole/)
      expect(s.branches.invite.said.toLowerCase(), `${s.voice}: the lid, in the aftermath`).toContain('lid')
      expect(s.branches.respond.said.toLowerCase(), `${s.voice}: she had to serve next`).toContain('serve')
      expect(s.branches.space.said.toLowerCase(), `${s.voice}: nobody fetched the ball`).toContain('ball')
    }
  })

  it('⭐⭐⭐ four different ways of NOTICING – the opener', () => {
    const openers = COURT.map((s) => s.opener.roof!)
    expect(new Set(openers).size, `four voices, four openings:\n${openers.join('\n')}`).toBe(4)
  })

  it('⭐⭐⭐ four different ways of DISCLOSING – the incident itself', () => {
    const shared = COURT.map((s) => s.shared!)
    expect(new Set(shared).size, `four voices, four tellings:\n${shared.join('\n')}`).toBe(4)
  })

  it('⭐⭐⭐ four different ways of RESPONDING – per parental choice, the same choice each time', () => {
    // ARM 6's target, and this is the half the obvious test could never have made: the PARENTAL
    // CHOICE is held fixed, so the only thing left free is who she is.
    for (const stance of SMALL_TALK_STANCES) {
      const said = COURT.map((s) => s.branches[stance].said)
      expect(new Set(said).size, `${stance}: four voices, four answers:\n${said.join('\n')}`).toBe(4)
    }
  })

  it('⚠ and the difference survives the assembler – four prompts, four cards', () => {
    // Not a property of the table read back: four real worlds, identical but for her temperament, at
    // the same week and the same stage, answered with the same stance.
    const cards = COURT.map((s) => {
      const world = careerAt('voice-test', 200, s.voice)
      raiseLifeBeat(world, 'small-talk', `${s.subject}:${s.id}`)
      const prompt = buildSoftBeatInvite(world)!.prompt
      return {
        voice: s.voice,
        said: prompt.said,
        reply: prompt.followUps.find((f) => f.optionId === SMALL_TALK_STANCE_ID.respond)!.said.join(' '),
      }
    })
    expect(new Set(cards.map((c) => c.said)).size, 'four openers on four cards').toBe(4)
    expect(new Set(cards.map((c) => c.reply)).size, 'four replies to the identical parental choice').toBe(4)
  })
})

// =================================================================================================
// F. THE LAWS THE ROUND MAY NOT BREAK – bond-neutral, ungraded, missable
// =================================================================================================
describe('round 42 #15 F – the economy did not move', () => {
  it('⭐⭐ every reply is still a literal zero, and a whole exchange leaves bond byte-identical', () => {
    // ARM 8's target, and it is ruling V2 («tier-1 replies move nothing») asserted through the ENGINE
    // COMMAND on a real raised row rather than against the table alone.
    for (const option of OPTIONS) expect(option.bond, `${option.id} is priced`).toBe(0)
    for (const stance of SMALL_TALK_STANCES) {
      const s = fourVoicesOf('court-four')[2]
      const world = careerAt(`neutral-${stance}`, 200, s.voice)
      raiseLifeBeat(world, 'small-talk', `${s.subject}:${s.id}`)
      const before = world.bond
      answerLifeBeat(world, SMALL_TALK_STANCE_ID[stance])
      expect(world.bond, `${stance} moved the standing`).toBe(before)
    }
  })

  it('⭐ ungraded, and the card cannot point at an answer', () => {
    // §8d.4: «Neutral mechanics do not require every answer to be equally warm… What must be avoided
    // is scoring, a recommendation cue and a consistently superior branch.» The wire is the proof:
    // an option carries an id and a label and nothing else, so there is nowhere for a mark to live.
    const s = fourVoicesOf('court-four')[3]
    const world = careerAt('ungraded', 200, s.voice)
    raiseLifeBeat(world, 'small-talk', `${s.subject}:${s.id}`)
    const prompt = buildSoftBeatInvite(world)!.prompt
    for (const option of prompt.options) expect(Object.keys(option).sort()).toEqual(['id', 'label'])
  })

  it('⚠ ...and ungraded is not «interchangeable» – the three replies are three different things', () => {
    // The other half of §8d.4, and it is the half a neutrality pin usually forgets: «the three
    // branches may honestly produce relief, mild resistance, amusement, uncertainty, a boundary or a
    // changed thought.» Identical replies would be neutral AND empty.
    for (const s of SMALL_TALK_SITUATIONS) {
      const said = SMALL_TALK_STANCES.map((stance) => s.branches[stance].said)
      expect(new Set(said).size, `${s.id}/${s.voice}: two branches say the same thing`).toBe(3)
      const labels = SMALL_TALK_STANCES.map((stance) => s.branches[stance].label)
      expect(new Set(labels).size, `${s.id}/${s.voice}: two answers wear the same words`).toBe(3)
    }
  })
})

// =================================================================================================
// G. §8d.1's OWN SHAPE – a `respond` label names a position, and the reply answers THAT
// =================================================================================================
describe('round 42 #15 G – the respond branch names the parent\'s actual opinion', () => {
  /** The three generic labels §8d.1 names as defective, verbatim from the spec and from the shipped
   *  table. ⚠ TRANSCRIBED, never imported: the claim is about these exact sentences, and an import
   *  would make the case compare the code with itself. */
  const GENERIC_RESPOND = ['Tell her what we think', 'Say how we see it', 'Answer her honestly']

  it('⭐⭐ no situation offers a bare speech act as its respond – with the ONE his revision did not reach', () => {
    // «The label promises a view («Say how we see it» · «Answer her honestly» · «Tell her what worries
    // us») and then her reaction answers an opinion the player never heard.»
    //
    // ⚠⚠ `line-call` IS THE EXCEPTION AND IT IS REPORTED RATHER THAN EDITED. Its «Tell her what
    // worries us» is one of the three strings §8d.1 names – but it lives in §8b, which his 15.09
    // revision did not rewrite, so the sentence standing in the spec is his most recent word on it.
    // Changing it is a wording change nobody asked for (CLAUDE.md invariant 4), so the collision is
    // pinned HERE, by name, and carried to him in the handoff with a draft beside it. The day he
    // rules, this list goes to empty and the case becomes the flat law.
    const offenders = SMALL_TALK_SITUATIONS.filter((s) => GENERIC_RESPOND.includes(s.branches.respond.label))
      .map((s) => `${s.id}/${s.voice}`)
    expect(offenders, 'a respond label promising an unheard view').toEqual([])
    const named = SMALL_TALK_SITUATIONS.filter((s) => s.branches.respond.label === 'Tell her what worries us')
      .map((s) => `${s.id}/${s.voice}`)
    expect(named, 'the one §8d.1 names that his revision did not reach').toEqual(['line-call/fiery'])
  })

  it('⚠ every respond label is a thing the parent SAYS – an imperative, not a category', () => {
    // The positive form of the same finding. «Say the travelling matters too», «Say a good coach
    // explains what they're changing», «Ask whether she's been eating properly» – each one is an act
    // with a content, which is what makes her answer to it answerable.
    for (const s of SMALL_TALK_SITUATIONS) {
      expect(s.branches.respond.label, `${s.id}/${s.voice}: ${s.branches.respond.label}`).toMatch(
        /^(Say|Tell|Ask|Laugh)\b/,
      )
    }
  })

  it('⚠ and where two situations DO share a respond label, her answer to it still differs', () => {
    // ⚠⚠ THE CASE THIS REPLACED WAS WRONG AND HIS COPY IS WHY. It asserted «two situations of one
    // subject never share a respond label» and §8a and §8c both answer good news with «Tell her we're
    // glad» – which is honest writing, not a defect: the parent says the same warm thing about a
    // practice and about a win, and SHE is the one who answers differently. So the claim that
    // actually holds is the one below, and it is the claim §8d.1 was really making.
    // ⚠ PAIRS AND NEVER A JOINED STRING. `npm run pins:check` ratchets against a raw
    // `slice(indexOf(...))` for the reason CLAUDE.md records – it returns -1 on an absent marker and
    // widens silently – and a tuple needs no cutting at all.
    const byLabel = new Map<string, { id: string; said: string }[]>()
    for (const s of SMALL_TALK_SITUATIONS) {
      const key = s.branches.respond.label
      byLabel.set(key, [...(byLabel.get(key) ?? []), { id: s.id, said: s.branches.respond.said }])
    }
    const shared = [...byLabel.entries()].filter(([, rows]) => new Set(rows.map((r) => r.id)).size > 1)
    expect(shared.length, 'the anti-vacuity half – a label really is shared by two situations').toBeGreaterThan(0)
    for (const [label, rows] of shared) {
      const distinctSituations = new Set(rows.map((r) => r.id)).size
      const distinctReplies = new Set(rows.map((r) => r.said)).size
      expect(distinctReplies, `«${label}» is answered identically by two different situations`).toBe(
        distinctSituations,
      )
    }
  })
})
