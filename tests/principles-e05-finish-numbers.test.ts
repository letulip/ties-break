// ⭐⭐ T4.4 · E-05 – THE FLOW COMPARES NUMBERS. THE WORDS STAY THE OWNER'S.
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-05): two predicates in
// `TournamentFlow.vue` keyed BEHAVIOUR off the engine's display vocabulary.
//
//   `isRunnerUp = !kidChampion && finishLabel === 'Runner-up'`  drives the finale tone, the silver
//                 trophy flight into the cabinet, the podium poster and one guard
//   `isFinalRound = roundLabel === 'Final'`                     drives the celebration cue and the
//                 viewer's `final-match` prop
//
// Both strings come out of `world/labels.ts` – `finishLabel` and `stageLabel` – and CLAUDE.md
// invariant 4 makes them the owner's to change at any time. Its own corollary is the sharp end: «a
// wording change is the one kind of diff no test catches – the pins assert what the string IS, so they
// move with it and stay green». A sanctioned rename («Runner-up» → «Finalist») would therefore have
// silently stopped the silver trophy flight and hung the wrong poster, with every string pin in the
// repo still green.
//
// ⚠⚠ SO THE FIX IS A PROJECTION AND NOT A NEW WORD. `PendingView` carries `kidFinish` – the very index
// the engine hands its own namer – and `isFinal`, and the screen compares those. No rendered string
// moves: `finishLabel` and `roundLabel` still print exactly what they printed.
//
// ⚠ AND `kidFinish` IS THE INDEX THE LABEL WAS MADE FROM, not «a finish index». That distinction is the
// whole parity claim §1 asserts: the College League CLAMPS the index before naming it
// (`Math.min(kidFinish, COLLEGE_LEAGUE_ROUNDS)`), so a projection of the raw run would have shipped a
// number that disagreed with the word beside it – which is the defect wearing the other hat.
//
// ⚠ THE NATIONS CUP CARRIES `null`, BY CONSTRUCTION. Its `finishLabel` is `nationFinishLabel` – «2nd of
// 8 nations», her NATION's placing – and there is no knockout index behind it. A null rather than an
// invented one is this view's own discipline, stated at `tier`, `drawSize` and `ladder`.
//
// ⚠⚠ THE TOTALITY IS THE COMPILER'S, NOT THIS FILE'S. Both fields are REQUIRED on `PendingView`, so
// `vue-tsc` refuses a fourth builder that forgets them – which is strictly stronger than a source pin
// counting today's three, and is the `PendingView.ladder` widening's own argument («§4's widening is
// what made that a fact of the type rather than a thing a builder has to remember»).
//
// ⚠⚠ THE MUTATION ARM IS IN THE MOUNTED FILE, and it has to be: the arm is «compare the words again»,
// and it can only be told from the fix on a fixture where the words and the numbers disagree. No live
// career can build one – the engine derives the word FROM the number – so
// tests/component/principles-w4-finish-numbers.test.ts poses the state a sanctioned rename creates and
// says so. An arm that cannot distinguish the two is not this arm.
import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  createWorld,
  enterEvent,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, hasAcceptanceList } from '../src/engine/season/calendar'
import { finishLabel, isFinalStage, stageLabel } from '../src/engine/world/labels'
import { componentFile, engineModuleFunction } from './worldSource'
import { codeOf } from './helpers/source'
import type { PendingView } from '../src/shared/protocol'

/** A world paused on the kid's entered tournament, not yet revealed – `tests/tournamentReveal.test.ts`'
 *  own `buildToPending`, including its note about why the rung has to be a points-banded domestic one
 *  (a one-marker grant speaks only to a POINTS BAND, not to an acceptance list, an on-ramp or an age
 *  gate). Copied rather than shared because W5's `tests/helpers/scenarios/` is where that consolidation
 *  is planned (T5.11) and this wave does not own it. */
function buildToPending(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  const event = world.season.find(
    (e) => e.week >= 5 && e.deadlineWeek >= world.week && TIERS[e.tier].track === 'domestic' && !hasAcceptanceList(e.tier),
  )!
  const min = TIERS[event.tier].enterPointBand[0]
  const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.week, 'the tick that ARRIVES at the event week is the one that opens the reveal').toBe(event.week)
  expect(world.pendingTournament, `${seed} reached its tournament`).toBeTruthy()
  return world
}

/** Every pending view a reveal walks through, round by round, plus the finished one. This is the set a
 *  player actually sees, and it is where the Final and the runner-up live. */
function viewsThroughTheReveal(seed: string): PendingView[] {
  const world = buildToPending(seed)
  const out: PendingView[] = []
  let guard = 0
  while (world.pendingTournament && !world.pendingTournament.finished && guard++ < 30) {
    const v = toSnapshot(world).pending
    if (v) out.push(v)
    revealTournamentRound(world)
  }
  const last = toSnapshot(world).pending
  if (last) out.push(last)
  return out
}

/** THIRTY CAREERS, AND THE NUMBER IS MEASURED RATHER THAN CHOSEN. Six gave 9 views and no beaten
 *  finalist at all – a set that cannot reach the state §1's last case asserts is a set that proves
 *  nothing about it. Thirty gives 93 views over draws of 8 AND 16, every round label those can hold
 *  (Round of 32, Round of 16, Quarterfinal, Semifinal, Final) and the finish distribution
 *  {Quarterfinalist 14, Semifinalist 5, Runner-up 4, Champion 4, Round of 16 2, Round of 32 1}. */
const SEEDS = Array.from({ length: 30 }, (_, i) => `e05-${i}`)

describe('E-05 §1: the number and the word are one answer on the tour', () => {
  const views = SEEDS.flatMap((s) => viewsThroughTheReveal(s))

  it('⚠ the fixture really walks a whole draw – the anti-vacuity check first', () => {
    expect(views.length, 'thirty careers, every revealed round of each').toBeGreaterThan(50)
    // A draw walked to its end must pass THROUGH the final, or §2's claim is about nothing.
    expect(views.some((v) => v.roundLabel === 'Final'), 'a Final is on deck somewhere in the set').toBe(true)
    expect(views.some((v) => v.finished), 'and a finished run is in the set').toBe(true)
  })

  it('⭐⭐ `finishLabel` IS `finishLabel(kidFinish)` on every view – the word is made of the number', () => {
    for (const v of views) {
      expect(v.kidFinish, 'the tour always has a knockout index').not.toBeNull()
      // THE PARITY, stated as an identity rather than as two spellings that happen to agree: if this
      // holds, a screen comparing the number cannot behave differently from one reading the word, and
      // the owner may rename the word without moving the behaviour.
      expect(v.finishLabel, `${v.eventId} @ ${v.roundLabel}`).toBe(finishLabel(v.kidFinish!))
    }
  })

  it('⭐⭐ `isFinal` IS «the round on deck is called Final»', () => {
    for (const v of views) {
      expect(v.isFinal, `${v.eventId} @ ${v.roundLabel}`).toBe(v.roundLabel === 'Final')
    }
  })

  it('⭐ `kidChampion` is `kidFinish === 0`, which is what makes the runner-up arm a `=== 1`', () => {
    // The flow's two podium arms read ONE ladder of indices now: 0 is gold, 1 is silver, and there is
    // no third piece of silverware in a knockout draw. Asserted because `isRunnerUp` is
    // `!kidChampion && kidFinish === 1`, and the pair is only coherent if these two agree.
    for (const v of views) expect(v.kidChampion, `${v.eventId}`).toBe(v.kidFinish === 0)
  })

  it('⚠ and she really does lose a final somewhere in the set – the silver case is reachable', () => {
    // Anti-vacuity for the podium arm the mounted file poses: index 1 is a state the engine produces.
    expect(views.some((v) => v.finished && v.kidFinish === 1), 'a beaten finalist').toBe(true)
  })
})

describe('E-05 §2: `isFinalStage` is the engine\'s one arithmetic, not a second one', () => {
  it('⚠⚠ the projection does not re-derive «is this the final» – `stageLabel` shares it', () => {
    // Form A inside the engine: `isFinalStage(round, drawSize)` is `stageLabel`'s own `remaining === 2`
    // clause, named and exported, and `stageLabel` CALLS it. Writing `drawSize / 2 ** round === 2` in
    // `snapshot.ts` instead would have been the parity class one layer down – two spellings of one
    // arithmetic, in the same engine, with a display string between them.
    const label = codeOf(engineModuleFunction('world/labels', 'stageLabel'))
    expect(label, 'the namer asks the predicate').toContain('isFinalStage(round, drawSize)')
  })

  it('⭐ the predicate and the namer agree on every round of every shipped draw size', () => {
    const sizes = [...new Set(Object.values(TIERS).map((t) => t.drawSize))].sort((a, b) => a - b)
    expect(sizes.length, 'the catalogue really has draws in it').toBeGreaterThan(0)
    for (const drawSize of sizes) {
      for (let round = 0; 2 ** round <= drawSize; round++) {
        expect(isFinalStage(round, drawSize), `draw ${drawSize}, round ${round}`).toBe(
          stageLabel(round, drawSize) === 'Final',
        )
      }
    }
  })
})

describe('E-05 §3: the fixtures with no knockout index say so', () => {
  it('⚠⚠ the Nations Cup projects `kidFinish: null` – a null, never an invented index', () => {
    // Its `finishLabel` is her NATION's placing («2nd of 8 nations»), so there is no round she reached
    // for a number to name. The compiler makes every builder ANSWER; only a reading of the literal can
    // say the answer is the honest one, which is why this claim is a source claim.
    const src = codeOf(engineModuleFunction('world/snapshot', 'callUpPendingView'))
    expect(src, 'no knockout index behind a national tie').toContain('kidFinish: null')
    expect(src, 'and a rubber is not a final').toContain('isFinal: false')
  })

  it('⚠ the College League projects the index its own label is CLAMPED to', () => {
    // `finishLabel: kidFinish <= 0 ? finishLabel(0) : finishLabel(Math.min(kidFinish, ROUNDS))` – so the
    // raw run index and the named one can differ, and the projection must carry the NAMED one or the
    // screen's number would disagree with the screen's word on the one fixture that clamps.
    const src = codeOf(engineModuleFunction('world/snapshot', 'collegeLeaguePendingView'))
    expect(src, 'one expression, read twice').toContain('finishLabel(namedFinish)')
    expect(src, 'and the projection carries it').toContain('kidFinish: namedFinish')
  })
})

describe('E-05 §4: and the screen no longer compares the owner\'s words', () => {
  it('⚠⚠ `TournamentFlow` keys neither predicate off a display string', () => {
    // NEGATIVE claims about one file, so `componentFile` and never `componentLogic` – and `codeOf`,
    // because this file writes its history in comments that quote the very words banned here (the
    // `HomeScreen.vue` lesson: «do not quote a lock's copy here, not even as an example»).
    const flow = codeOf(componentFile('components/TournamentFlow.vue'))
    expect(flow, 'the runner-up arm compares an index').toContain('kidFinish === 1')
    expect(flow, 'and the final arm reads the engine\'s own flag').toContain('pending.value?.isFinal')
    // The words themselves still PRINT – `{{ pending.kidChampion ? 'Champion' : 'Runner-up' }}` is the
    // poster's status line and is untouched – so the ban is on the COMPARISON, spelled narrowly.
    expect(flow, 'no equality against the finish word').not.toContain("finishLabel === 'Runner-up'")
    expect(flow, 'no equality against the round word').not.toContain("roundLabel === 'Final'")
  })
})
