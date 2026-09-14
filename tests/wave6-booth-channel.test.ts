// ⭐⭐⭐ v77 T7 – THE BOOTH CHANNEL: THE WEEK THE COMMENTARY SAYS IT OUT LOUD (wave 6, the spotlight –
// C4's boundary, the loop closed). `docs/plans/the-way-she-sounds-2026-09.md` C4 (ruled 10.09),
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T7, the architect's rulings J (the seam), M and P
// (the horizon) and T (the licence reads a stamp and never re-judges it).
//
// WHAT THIS FILE IS ABOUT, IN ONE LINE: on a big-stage match week, while her STANDING is non-quiet
// (the owner's D1, 14.09 – the gate reads the ladder now, never the cabinet), a public fact about her
// private life that has not aired yet and is still inside the news window gets voiced – the episode
// is STAMPED, the week carries an `'aired'` exposure event, the snapshot ships two bits, and
// `buildCommentary` turns them into ONE beat at a changeover. Once aired, never again.
//
// ⚠⚠ THE HONESTY BOUNDARY IS §D AND IT IS THE PIN THAT MATTERS MOST: a fact only the family holds is
// never voiced, at any fame or standing. Everything else here is mechanism; that one is the promise.
//
// =================================================================================================
// THE ARMS – every case below was watched to FAIL on the mutation it is written for
// =================================================================================================
//
//   ARM 1   the licence's `publicWeek !== null` clause deleted – a family-only fact airs, dated from
//           its own `sinceWeek`. ⚠⚠ IT CAME BACK **GREEN** ON THE FIRST DRAFT and that is the most
//           useful thing in this file: every honesty fixture then used the episode helper's default
//           `sinceWeek: 120`, four hundred weeks old, so the NEWS WINDOW refused the row and the
//           cases were measuring a rule they were not about. Dates moved inside the window, and the
//           arm now reddens what it names. **4 RED** · §A's family-only case, §A's «an ending needs
//           both», §D's `'noticed'` and `'known'` arms (the bands D1 renamed «the world is watching»
//           and «watching HARD» into, 14.09).
//
//   ARM 2   the window dropped – `stillNews` true for every age. **3 RED** · §C's far edge, §C's
//           «a stamp in the future» and §C's read-off-the-constant case.
//
//   ARM 3   the window widened by one (`<= window + 1`). **2 RED** · §C's far edge and §C's
//           constant case – the off-by-one no playtest could ever see.
//
//   ARM 4   the once-ness deleted – `airedMetWeek !== null` dropped from the licence.
//           **3 RED** · §A's «a fact that has aired is over with», §B's «once aired, never again»
//           and §B's «met before ended».
//
//   ARM 5   met and ended swapped – the ended pass walked first.
//           **1 RED** · §B's «met before ended».
//
//   ARM 6   ⚠ RE-AIMED BY D1 (14.09) – the mutation it named cannot be written any more: the gate
//           lost its week argument with the fame bar (`newsStandingOf` is present-tense by its own
//           contract – the cached rank IS the last closed fold, so ruling P holds by construction,
//           and `crossingDown`, the fixture built to split the two weeks, went with it). §E's two
//           horizon cases are now the two halves D1 separated: fame without standing is never
//           voiced, and the standing alone speaks – at `'noticed'` too, with an empty cabinet.
//
//   ARM 7   the big-stage gate deleted (`atOrAboveStageBar` ignored). **1 RED** · §B's junior week.
//
//   ARM 8   the stamp moved into `resolveBodyAndPlanner` (the life block, two phases early).
//           **2 RED** · §E's «the life block cannot air» and §E's call-site text.
//
//   ARM 9   `wrong` dropped on the way into the copy (`boothLines` always the true pool).
//           **2 RED** · §G's wrong-story case and §G's four-pools case.
//
//   ARM 10  the sixth parameter of `buildCommentary` ignored (the booth block never pushed).
//           **5 RED** · §G's beat case, the wrong-story case, the four-pools case, the changeover
//           case and the side case. ⚠ §G's house-rules case stays GREEN under it – it iterates over
//           booth beats and an empty list satisfies it – which is why the beat case counts rows
//           rather than inspecting them.
//
//   ARM 12  the booth beat anchored at a SET BREAK – the coach's own anchor – instead of a mid-set
//           changeover. **2 RED** · §G's changeover case and the 250-match case.
//
//   ARM 13  the snapshot's first-match gate removed (`revealed === 0 ? … : null` → the packet on
//           every revealed round). **1 RED** · §F's view case – the guard that stops one mention
//           printing at six changeovers of one tournament week.

import { describe, expect, it } from 'vitest'
import {
  airBoothMention,
  atOrAboveStageBar,
  boothMentionDue,
  boothPrivateLifeAt,
  createWorld,
  exposureEventsOf,
  newsStandingOf,
  type WorldState,
} from '../src/engine/world'
import { standHerAt } from './helpers/newsStanding'
import { resolveBodyAndPlanner } from '../src/engine/world/phaseHerWeek'
import { worldFunction } from './worldSource'
import { region } from './helpers/source'
import { ECONOMY } from '../src/engine/economy'
import { fameAt } from '../src/engine/world/fame'
import { buildCommentary, type Beat } from '../src/viz/commentary'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { MatchOptions, MatchPlayer } from '../src/engine/match/types'
import type { AnnotatedMatch } from '../src/viz/types'
import type { LoveEpisode } from '../src/shared/protocol/narrative'

/** The week every fixture is posed at – an adult career's week, far from week 0 so a window and a
 *  «four weeks ago» are expressible without running into negative weeks. */
const WEEK = 500
const WINDOW = ECONOMY.spotlight.newsWindowWeeks
/** A rung at or above the big-stage bar, and one below it – read off the CONSTANT rather than
 *  spelled, so a §4 re-tune of `stageTierMin` moves both sides of every case together. */
const BIG = ECONOMY.spotlight.stageTierMin
const SMALL = 'j30' as const

/** A career the world is NOT watching.
 *
 *  ⚠ THE DEFAULT PROFILE, UNTOUCHED, and it is a fixture-correctness matter rather than laziness:
 *  §E walks a world through the REAL `resolveBodyAndPlanner`, which reaches the kit's wear model,
 *  and a hand-edited profile is how a probe world arrives at a phase missing a field the phase
 *  needs. `createWorld(seed)` is the same builder the leak suite's own probes use. */
function unknown(seed = 'booth-unknown'): WorldState {
  const world = createWorld(seed)
  world.week = WEEK
  return world
}

/** ...and the same career the world IS watching – her STANDING posed at `'known'` (⚠ D1, 14.09: the
 *  gate reads the LADDER now, never the cabinet – top-100 «вполне уверенно», the sponsor ladder's own
 *  analogy). `standHerAt` lays the row two weeks back, inside the fold's 52-week window at every week
 *  this file asks about. ⚠ The old Slam pair is gone WITH the fame bar it fed, and so is its old ⚠
 *  about the trophies doubling as a `'stage'` exposure event: the standing row is a `wta250` below
 *  `stageTierMin` by the helper's own design, so it can never be one. */
function famous(seed = 'booth-famous'): WorldState {
  const world = unknown(seed)
  standHerAt(world, 'known', WEEK - 2)
  return world
}

/** A v77 episode row with every field stated out loud – T1's own rule, and here the four publicity
 *  fields are exactly what a fixture has to pose. */
function episode(over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: 'p:120',
    sinceWeek: 120,
    endedWeek: null,
    knownWeek: null,
    wants: 'open',
    partnerId: 'p:120',
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    ...over,
  }
}

// ⚠ D1 (14.09) RETIRED `crossingDown` – the fixture whose fame crossed the bar BETWEEN the closed
// week and the week being lived. It existed because the old gate took a week and the two spellings
// needed a world to disagree about; `newsStandingOf` takes none (the cached rank IS the last closed
// fold, ruling P by construction), so the fixture is unbuildable and the two §E horizon cases now
// pin the two halves D1 separated instead – see their own banners.

/** A famous career carrying one episode the world learned about `ago` weeks ago. */
function newsWithFact(over: Partial<LoveEpisode> = {}, seed = 'booth-news'): WorldState {
  const world = famous(seed)
  world.loveEpisodes = [episode({ publicWeek: WEEK - 2, ...over })]
  return world
}

// =================================================================================================
// A. THE LICENCE – what the booth may touch, asked of the episode list and nothing else
// =================================================================================================
describe('wave 6 T7 A – the licence, both ways round', () => {
  it('⭐⭐⭐ A FACT ONLY THE FAMILY HOLDS IS NEVER DUE – §0 delta 3, and it is one comparison', () => {
    // The honesty boundary of the whole channel: `publicWeek === null` means the world was never
    // told, and the booth has nothing to repeat. No fame clause sits beside this one and none ever
    // may – see §D, where the same row is asked at two fames.
    //
    // ⚠⚠ THE ROW IS **RECENT**, AND THAT IS THE CASE'S TEETH RATHER THAN A DETAIL – found by ARM 1,
    // which came back GREEN on the first draft. The fixture then carried the helper's default
    // `sinceWeek: 120`, four hundred weeks before the week under test, so a licence with the
    // publicity clause DELETED still said nothing: the news window was quietly doing the work and the
    // case was measuring the wrong rule. Every date here now sits inside the window, so the only
    // thing between this row and the air is `publicWeek === null`.
    const world = famous('booth-private')
    world.loveEpisodes = [episode({ sinceWeek: WEEK - 3, knownWeek: WEEK - 2, endedWeek: WEEK - 1 })]
    expect(boothMentionDue(world, WEEK)).toBeNull()
  })

  it('a public fact inside the window is due, and it names the row it is about', () => {
    const world = newsWithFact()
    const due = boothMentionDue(world, WEEK)
    expect(due?.kind).toBe('met')
    expect(due?.episode.id).toBe('p:120')
  })

  it('...and an ENDING needs BOTH its own week and the world knowing of them at all', () => {
    // The brief's own second licence: `endedWeek !== null && publicWeek !== null`. A relationship
    // the world never learned of does not get an obituary.
    const secret = famous('booth-secret-end')
    secret.loveEpisodes = [episode({ sinceWeek: WEEK - 5, endedWeek: WEEK - 1 })]
    expect(boothMentionDue(secret, WEEK), 'ended, but the world never knew there was anything').toBeNull()

    const known = famous('booth-known-end')
    known.loveEpisodes = [episode({ publicWeek: WEEK - 20, airedMetWeek: WEEK - 19, endedWeek: WEEK - 1 })]
    expect(boothMentionDue(known, WEEK)?.kind).toBe('ended')
  })

  it('⭐⭐ A FACT THAT HAS AIRED IS OVER WITH – the stamps ARE the once-ness', () => {
    const aired = newsWithFact({ airedMetWeek: WEEK - 1 })
    expect(boothMentionDue(aired, WEEK), 'it was voiced last week').toBeNull()
    // ...and the two stamps are independent: the ending is still to come.
    aired.loveEpisodes[0].endedWeek = WEEK
    expect(boothMentionDue(aired, WEEK)?.kind).toBe('ended')
  })
})

// =================================================================================================
// B. THE WRITER – the two gates, the stamp, the once-ness, and one fact a week
// =================================================================================================
describe('wave 6 T7 B – `airBoothMention`, and what it refuses', () => {
  it('a junior week is not a big stage, whatever the papers know', () => {
    const world = newsWithFact({}, 'booth-junior')
    airBoothMention(world, SMALL)
    expect(world.loveEpisodes[0].airedMetWeek, 'a J30 has no booth to speak of').toBeNull()
    // ...and the same world at the same week, at a rung that IS one.
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedMetWeek).toBe(WEEK)
  })

  it('a quiet girl is never talked about – the ONE gate every public surface shares (D1, 14.09)', () => {
    const world = unknown('booth-unknown-girl')
    standHerAt(world, 'quiet', WEEK)
    world.loveEpisodes = [episode({ publicWeek: WEEK - 2 })]
    expect(newsStandingOf(world), 'the fixture really is nobody the ladder has heard of').toBe('quiet')
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedMetWeek).toBeNull()
  })

  it('⭐⭐⭐ ONCE AIRED, NEVER AGAIN – a hundred big-stage weeks, one stamp, one event', () => {
    // ⚠ THE WALK IS THE POINT. A single call proves the stamp lands; only a walk proves it lands
    // ONCE, which is the whole of the once-ness claim. The fact stays inside nobody's window for
    // long, so the walk also crosses the window's far edge with the fact already spent.
    const world = newsWithFact({}, 'booth-once')
    // ⚠ D1 (14.09): the standing is kept for the whole walk – the points half of it folds a rolling
    // 52-week window, so a row every 40 weeks means a silent week is never silence bought by a
    // lapsed ledger (the exact fixture defect the old fame plates existed to rule out).
    for (let w = WEEK + 38; w < WEEK + 100; w += 40) standHerAt(world, 'known', w)
    const stamped: number[] = []
    const aired: number[] = []
    for (let w = WEEK; w < WEEK + 100; w++) {
      world.week = w
      expect(newsStandingOf(world), `she is known at ${w}`).toBe('known')
      airBoothMention(world, BIG)
      if (world.loveEpisodes[0].airedMetWeek === w) stamped.push(w)
      for (const e of exposureEventsOf(world, w)) if (e.kind === 'aired') aired.push(w)
    }
    expect(stamped, 'exactly one stamp in a hundred licensed weeks').toEqual([WEEK])
    expect(aired, 'and exactly one exposure event to go with it').toEqual([WEEK])
  })

  it('⭐⭐ MET BEFORE ENDED, and it is two rows rather than one', () => {
    // ⚠ THE SHAPE THAT DECIDES THE SPELLING: the OLDER row has a due ending and the NEWER one a due
    // «met». A single walk returning the first due fact of the first due row would voice the ending;
    // «met before ended» is a rule about the FACTS, not about the rows.
    const world = famous('booth-order')
    world.loveEpisodes = [
      episode({ id: 'p:100', sinceWeek: 100, publicWeek: WEEK - 30, airedMetWeek: WEEK - 29, endedWeek: WEEK - 1 }),
      episode({ id: 'p:400', sinceWeek: 400, publicWeek: WEEK - 1 }),
    ]
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[1].airedMetWeek, 'the new one is the news').toBe(WEEK)
    expect(world.loveEpisodes[0].airedEndedWeek, 'and the ending waits its turn').toBeNull()
    // ⚠ AT MOST ONE FACT A WEEK: a second call in the same week changes nothing, because the fact it
    // would reach for is the one the first call left.
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedEndedWeek, 'still this week, still one fact').toBeNull()
    // ...and the week after, the ending is what is left.
    world.week = WEEK + 1
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedEndedWeek).toBe(WEEK + 1)
  })

  it('it writes the stamp and nothing else – no feed row, no beat, no money', () => {
    const world = newsWithFact({}, 'booth-quiet')
    const before = world.events.length
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedMetWeek).toBe(WEEK)
    // §3c's legibility law is «one row per week, not per event» and that row is T3's, raised on the
    // tick that PRICES this event. A row here would print the same week twice, one tick apart.
    expect(world.events.length, 'the booth does not write the feed').toBe(before)
    expect(world.lifeLog ?? [], 'and it raises no card').toEqual([])
  })
})

// =================================================================================================
// C. THE WINDOW – both edges, because an off-by-one here is invisible in play
// =================================================================================================
describe('wave 6 T7 C – the news window, at both of its edges', () => {
  it('⭐⭐ a fact exactly `newsWindowWeeks` old still airs, and one week older never does', () => {
    const edge = newsWithFact({ publicWeek: WEEK - WINDOW }, 'booth-edge')
    expect(boothMentionDue(edge, WEEK)?.kind, `a fact ${WINDOW} weeks old is still news`).toBe('met')

    const old = newsWithFact({ publicWeek: WEEK - WINDOW - 1 }, 'booth-old')
    expect(boothMentionDue(old, WEEK), 'and one week older is not').toBeNull()
    // ⚠ AND IT IS NEVER AIRED, not merely late: the same row a hundred weeks on is still silent.
    old.week = WEEK + 100
    airBoothMention(old, BIG)
    expect(old.loveEpisodes[0].airedMetWeek).toBeNull()
  })

  it('a stamp in the FUTURE is not news yet either – the near edge, for crafted and migrated rows', () => {
    const ahead = newsWithFact({ publicWeek: WEEK + 1 }, 'booth-ahead')
    expect(boothMentionDue(ahead, WEEK), 'the world has not been told yet').toBeNull()
  })

  it('the window is read off the CONSTANT, so a re-tune moves both sides together', () => {
    // ⚠ NOT A TAUTOLOGY: it is the guard against a pin that hard-codes 6 and quietly stops being
    // about the window the day T9 prices it. Asked at the constant ± 1 rather than at a literal.
    expect(typeof WINDOW).toBe('number')
    expect(boothMentionDue(newsWithFact({ publicWeek: WEEK - WINDOW }, 'c-in'), WEEK)).not.toBeNull()
    expect(boothMentionDue(newsWithFact({ publicWeek: WEEK - WINDOW - 1 }, 'c-out'), WEEK)).toBeNull()
  })
})

// =================================================================================================
// D. ⭐⭐⭐ THE HONESTY BOUNDARY – §0 delta 3, asked at every band of the standing
// =================================================================================================
//
// «The booth and every public surface may voice ONLY facts with `publicWeek !== null`, at a fame that
// makes her news – the honest boundary is the world's own PUBLICITY, not the family's walls (C4,
// ruled 10.09). A fact only the family holds is never voiced, AT ANY FAME.»
//
// ⚠ D1 (14.09) MOVED THE GATE UNDER THAT SENTENCE WITHOUT MOVING THE SENTENCE: «at a fame that makes
// her news» is a STANDING now (`newsStandingOf`, the sponsor ladder's own analogy), so «at any fame»
// is pinned as «at any band» – the same family-only row at `'quiet'`, `'noticed'` and `'known'`. The
// top band is the arm that matters – it is the shape a later wave could break by reasoning «she is
// followed enough that it would be out by now».
describe('wave 6 T7 D – a fact only the family holds, at any standing', () => {
  for (const [name, make] of [
    ['quiet – nobody is watching', () => {
      const w = unknown('booth-d-quiet')
      standHerAt(w, 'quiet', WEEK)
      return w
    }],
    ['noticed – the world glances (rank 150, D1\'s «иногда»)', () => {
      const w = unknown('booth-d-noticed')
      standHerAt(w, 'noticed', WEEK - 2)
      return w
    }],
    ['known – the world is watching (rank 50, «вполне уверенно»)', () => famous('booth-d-star')],
  ] as [string, () => WorldState][]) {
    it(`⭐ ${name}: the family's own fact is never voiced`, () => {
      const world = make()
      // ⚠ EVERY DATE INSIDE THE WINDOW – see §A's own ⚠: an old row is refused by the window rather
      // than by the honesty boundary, and a case that cannot tell the two apart proves neither.
      world.loveEpisodes = [episode({ sinceWeek: WEEK - 3, knownWeek: WEEK - 2, publicWrong: true })]
      airBoothMention(world, BIG)
      expect(world.loveEpisodes[0].airedMetWeek, 'the booth invented a story').toBeNull()
      expect(world.loveEpisodes[0].airedEndedWeek).toBeNull()
      expect(boothPrivateLifeAt(world, WEEK), 'and nothing crossed to the UI').toBeNull()
      expect(exposureEventsOf(world, WEEK).map((e) => e.kind)).not.toContain('aired')
    })
  }

  it('...and the standing arms are not vacuous: the SAME world with a public fact does air', () => {
    // ⚠ THE CONTROL THE THREE CASES ABOVE NEED. Without it they would all pass on a booth that never
    // speaks at all, which is exactly the «unable to fail» shape this pair of waves has found
    // sixteen times. (`'known'` here; §E's second horizon case is the `'noticed'` control.)
    const world = famous('booth-d-loud')
    world.loveEpisodes = [episode({ sinceWeek: WEEK - 3, knownWeek: WEEK - 2, publicWeek: WEEK - 1, publicWrong: true })]
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedMetWeek).toBe(WEEK)
    expect(boothPrivateLifeAt(world, WEEK)).toEqual({ kind: 'met', wrong: true })
  })
})

// =================================================================================================
// E. THE STEP, AND THE HORIZON – ruling P's own question, answered with a measurement
// =================================================================================================
//
// Ruling P to T7: «your «this week has a big-stage match» read must be honest about which step it
// runs in. If you place the stamp where the match is known, say so and pin the step.»
//
// IT IS PLACED WHERE THE MATCH IS KNOWN – `playHerWeek`'s play arm, tick step 5 – and both halves are
// pinned: the life block (step 3, two phases earlier) provably cannot air, and the call site
// provably takes the entered event's own rung. The gate is still the wave's ONE horizon.
describe('wave 6 T7 E – where the stamp is written, and which week it asks about', () => {
  it('⭐⭐⭐ THE LIFE BLOCK CANNOT AIR: the whole of `resolveBodyAndPlanner` leaves the stamp null', () => {
    // ⚠ BEHAVIOURAL, AND IT IS THE ARM THAT CATCHES A MOVE. A fully licensed world walked through
    // the phase that holds §5-§9 – the arrival, the ends, the leak, the delivery, the small talk and
    // the spirit pass – and nothing in it voices anything, because at that step `world.week` holds
    // no match to voice it at.
    const world = newsWithFact({}, 'booth-life-block')
    resolveBodyAndPlanner(world)
    expect(world.loveEpisodes[0].airedMetWeek, 'the booth spoke two phases before the match').toBeNull()
    // ...and the same world, asked in the arm that has one.
    airBoothMention(world, BIG)
    expect(world.loveEpisodes[0].airedMetWeek).toBe(WEEK)
  })

  it('⭐⭐ the call site is in the PLAY arm and takes the entered event\'s own rung', () => {
    // ⚠ READ THROUGH `region`, WHICH THROWS ON AN ABSENT MARKER – CLAUDE.md's own gotcha about raw
    // `indexOf` slices, where a rotted marker widens a pin to most of a file in silence.
    const play = worldFunction('playHerWeek')
    const arm = region(play, 'chargeTravel(world, enteredThisWeek)', 'resolveMasseur(world)')
    expect(arm, 'the booth is asked in the arm where she actually boarded').toContain(
      'airBoothMention(world, enteredThisWeek.tier)',
    )
    // ...and AFTER the run she is about to watch has been composed.
    const after = region(play, 'world.pendingTournament = computeShadowTournament', 'resolveMasseur(world)')
    expect(after).toContain('airBoothMention(world, enteredThisWeek.tier)')
    // ⚠ AND NOWHERE ELSE IN THE TICK. The life block is the place it must not be.
    expect(worldFunction('resolveBodyAndPlanner'), 'the stamp moved two phases early').not.toContain(
      'airBoothMention',
    )
  })

  it('⚠ the rung is REQUIRED and never defaulted, so a matchless phase cannot call it at all', () => {
    // The structural half of the sentence above: the caller holds the event, so the function cannot
    // be reached from a step where there is no event to hand it. A default would let exactly that
    // compile, which is the one mistake this parameter exists to make impossible.
    expect(airBoothMention.length).toBe(2)
  })

  // ⚠⚠ RE-AIMED 14.09 (D1). The horizon pair – famous THIS week only against famous LAST week only –
  // measured which WEEK the fame gate read, and D1 took the week argument away with the fame bar:
  // `newsStandingOf` is present-tense because the cached rank IS the last closed fold (ruling P by
  // construction, its own contract). What the pair re-states in BANDS is the two halves D1 pulled
  // apart, and it is still two cases and not one, for T6's own §H lesson: a mutation that re-adds a
  // fame clause reddens the first, one that shuts the `'noticed'` band out of the booth reddens the
  // second, and neither failure can hide behind the other.
  it('⭐⭐⭐ FAME WITHOUT STANDING: the booth stays silent, however bright the cabinet (D1, 14.09)', () => {
    // The regression this catches by name: «she is famous enough to talk about» creeping back into
    // the gate. Blinding – a Slam title and a lost final stamped this very week – and quiet, because
    // the ladder has never heard of her; the fame that used to open this gate now opens nothing.
    const today = unknown('booth-horizon-today')
    const slam = (today.trophiesByTier.slam ??= { titles: [], finals: [] })
    slam.titles.push(WEEK)
    slam.finals.push(WEEK)
    standHerAt(today, 'quiet', WEEK)
    today.loveEpisodes = [episode({ publicWeek: WEEK - 1 })]
    expect(fameAt(today, WEEK), '⚠ she really is blinding').toBeGreaterThan(0)
    expect(newsStandingOf(today), '...and the ladder says nobody').toBe('quiet')
    airBoothMention(today, BIG)
    expect(today.loveEpisodes[0].airedMetWeek, 'the booth read her fame, not her standing').toBeNull()
  })

  it('⭐⭐⭐ ...and STANDING WITHOUT FAME: `\'noticed\'` speaks, with not a trophy in the cabinet', () => {
    // ⚠⚠ THE MIRROR, and it carries D1's second half: BOTH non-quiet bands may be voiced (the
    // booth's own big-stage requirement already makes every mention an occasion – the shipped
    // comment's words), so rank 150 with zero fame is enough. A spelling that gated the booth on
    // `'known'` alone – or that kept any fame clause – goes red here and nowhere else.
    const closed = unknown('booth-horizon-closed')
    standHerAt(closed, 'noticed', WEEK - 2)
    closed.loveEpisodes = [episode({ publicWeek: WEEK - 1 })]
    expect(fameAt(closed, WEEK - 1), '⚠ not one lens is pointed at her').toBe(0)
    expect(newsStandingOf(closed), '...and the table says top-200 – D1\'s «иногда»').toBe('noticed')
    airBoothMention(closed, BIG)
    expect(closed.loveEpisodes[0].airedMetWeek, 'the standing is the one gate that counts').toBe(WEEK)
  })
})

// =================================================================================================
// F. THE LOOP – the mention IS an exposure event, and the packet is the stamp read back
// =================================================================================================
describe('wave 6 T7 F – the stamp, the ledger and the wire read one record', () => {
  it('⭐⭐⭐ the mention becomes an `\'aired\'` exposure event of the week it was spoken', () => {
    const world = newsWithFact({}, 'booth-loop')
    expect(exposureEventsOf(world, WEEK).map((e) => e.kind), 'nothing yet').not.toContain('aired')
    airBoothMention(world, BIG)
    expect(exposureEventsOf(world, WEEK).map((e) => e.kind)).toContain('aired')
    // ⚠ AND T3's PASS SEES IT ONE TICK LATER, which is the wave's one clock rather than a lag
    // anybody added: the pressure asks `exposureEventsOf(world, world.week − 1)`.
    world.week = WEEK + 1
    expect(exposureEventsOf(world, world.week - 1).map((e) => e.kind)).toContain('aired')
  })

  it('the packet is the two facts and nothing else, read straight off the stamp', () => {
    const world = newsWithFact({ publicWrong: true }, 'booth-packet')
    airBoothMention(world, BIG)
    expect(boothPrivateLifeAt(world, WEEK)).toEqual({ kind: 'met', wrong: true })
    expect(boothPrivateLifeAt(world, WEEK + 1), 'and it belongs to its own week').toBeNull()
    // ⚠ NO EPISODE CROSSES THE WIRE. The fog law, and the narrowness `DiaryFacts.partnerKnown`
    // records: two bits, no id, no week, no partner.
    expect(Object.keys(boothPrivateLifeAt(world, WEEK)!).sort()).toEqual(['kind', 'wrong'])
  })

  it('⚠ the packet rides the FIRST match of the run and no other, and the two amateur views carry none', () => {
    // ⚠⚠ A SOURCE PIN, AND IT SAYS SO RATHER THAN PRETENDING OTHERWISE. Posing a LIVE reveal takes a
    // career with an entered event, a drawn bracket and a stashed shadow run – the size of fixture
    // `tests/component/round21-coach-travel.test.ts` §2 builds – and what must not drift here is one
    // conditional. The BEHAVIOUR the conditional buys is pinned where it is visible: the mounted test
    // asserts exactly one new row in the log.
    //
    // WHY THE GATE: the stamp is per WEEK and a tournament week is up to six revealed matches, so a
    // packet carried on every round would print the booth's one mention at six changeovers – «once
    // aired, never again» made false by a view that repeated it. `revealedRounds === 0` is her first
    // match of the week, which is where the flow already puts everything belonging to a round's first
    // watch (the badge and the shout).
    expect(worldFunction('pendingView')).toContain(
      'boothPrivateLife: revealed === 0 ? boothPrivateLifeAt(world, world.week) : null',
    )
    // ...and the College League and the Nations Cup are not tour weeks: `airBoothMention` is never
    // called for them, so their views say so in a literal rather than leaving a reader to derive it.
    expect(worldFunction('collegeLeaguePendingView')).toContain('boothPrivateLife: null')
    expect(worldFunction('callUpPendingView')).toContain('boothPrivateLife: null')
  })

  it('the big-stage question has ONE spelling, and the booth asks the ledger\'s own', () => {
    // Two sides of one question is the defect `src/art/venues.ts:150` records; the booth's licence
    // and the `'stage'` exposure kind read the same predicate, so the bar can only ever move once.
    expect(atOrAboveStageBar(BIG)).toBe(true)
    expect(atOrAboveStageBar(SMALL)).toBe(false)
  })
})

// =================================================================================================
// G. THE VIZ – ONE beat, at a changeover, with no draw anywhere near it
// =================================================================================================
function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** The same recipe MatchReplay.vue uses: a seeded match is a pure function of (a, b, opts). */
function fixtureMatch(seed: string): { a: MatchPlayer; b: MatchPlayer; match: AnnotatedMatch } {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

const boothOf = (beats: Beat[]): Beat[] => beats.filter((x) => x.kind === 'booth')

describe('wave 6 T7 G – the beat, and the log without it', () => {
  it('⭐⭐⭐ THE PACKET PUTS EXACTLY ONE BEAT IN THE LOG, and passing nothing puts none', () => {
    let spoken = 0
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`booth-beat-${i}`)
      const base = buildCommentary(match, a.name, b.name)
      const with_ = buildCommentary(match, a.name, b.name, null, null, { side: 0, kind: 'met', wrong: false })
      expect(base.length, 'the match produced no beats at all, so neither arm proves anything')
        .toBeGreaterThan(4)
      expect(boothOf(base), 'a log nobody handed a packet to').toEqual([])
      expect(boothOf(with_).length, 'one mention, never two').toBeLessThanOrEqual(1)
      spoken += boothOf(with_).length
      // ...and the tennis is untouched: every non-booth row is byte-identical to the base log.
      expect(with_.filter((x) => x.kind !== 'booth')).toEqual(base)
    }
    expect(spoken, 'the booth never found a free changeover in twenty matches').toBeGreaterThan(15)
  })

  it('⭐⭐ ...and the beat is BYTE-ABSENT without the packet, not merely quieter', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`booth-absent-${i}`)
      expect(buildCommentary(match, a.name, b.name, null, null, null)).toEqual(
        buildCommentary(match, a.name, b.name),
      )
    }
  })

  it('⭐⭐⭐ THE WRONG STORY AIRS WRONG – `wrong: true` reaches the copy', () => {
    const { a, b, match } = fixtureMatch('booth-wrong')
    const trueRow = boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind: 'met', wrong: false }))[0]
    const wrongRow = boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind: 'met', wrong: true }))[0]
    expect(trueRow, 'the fixture says nothing, so the comparison is empty').toBeTruthy()
    expect(wrongRow).toBeTruthy()
    expect(wrongRow.text, 'the world\'s mistake never reached the line').not.toBe(trueRow.text)
    // The tabloid's own shape – the one place a partner may be described at all (ruling T: the
    // FABRICATION is what licenses the phrase).
    expect(wrongRow.text.toLowerCase()).toMatch(/mystery man|no two of them|not one of them/)
    expect(trueRow.text.toLowerCase(), 'the true story invented a person').not.toContain('mystery man')
  })

  it('the four pools are four pools – each of met/ended × true/wrong says something of its own', () => {
    const { a, b, match } = fixtureMatch('booth-four')
    const say = (kind: 'met' | 'ended', wrong: boolean): string =>
      boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind, wrong }))[0]?.text ?? ''
    const rows = [say('met', false), say('met', true), say('ended', false), say('ended', true)]
    expect(rows.every((r) => r.length > 0), 'one of the four pools is silent').toBe(true)
    expect(new Set(rows).size, 'two of the four facts read the same on air').toBe(4)
  })

  it('it is a DRAFT that obeys the house rules: the row budget, the short dash, no Cyrillic', () => {
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`booth-house-${i}`)
      for (const kind of ['met', 'ended'] as const) {
        for (const wrong of [false, true]) {
          for (const beat of boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind, wrong }))) {
            expect(beat.text.length, 'the row budget is the row budget').toBeLessThanOrEqual(120)
            expect(beat.text, 'the long dash').not.toContain('—')
            expect(beat.text, 'Cyrillic in player-facing copy').not.toMatch(/[Ѐ-ӿ]/)
            // Nothing about how she feels or what it did to her tennis – the file's honesty rule.
            expect(beat.text.toLowerCase()).not.toMatch(/\bshe (?:feels|must be|looks)\b|distract/)
            expect(beat.keyMoment, 'her private life is not a turning point in the tennis').toBe(false)
          }
        }
      }
    }
  })

  it('⭐⭐ it takes a CHANGEOVER the tennis left alone, and never the coach\'s set break', () => {
    // ⚠ TWO CLAIMS IN ONE CASE BECAUSE THEY ARE ONE PROPERTY: the booth declines the contest rather
    // than losing it. A dropped booth beat is a fact the engine has already stamped as aired and
    // charged her for, then never said out loud.
    //
    // ⚠ AND IT IS COUNTED RATHER THAN GUARDED. An `if (booth.length > 0)` here would go green on a
    // booth that never speaks at all – the «unable to fail» shape – so the count comes out of the
    // loop and is asserted: with her coach in the corner taking every set break, the booth still
    // finds a changeover in almost every match.
    let spoke = 0
    for (let i = 0; i < 20; i++) {
      const { a, b, match } = fixtureMatch(`booth-anchor-${i}`)
      const both = buildCommentary(match, a.name, b.name, null, { side: 0 }, { side: 0, kind: 'met', wrong: false })
      const coachOnly = buildCommentary(match, a.name, b.name, null, { side: 0 })
      const booth = boothOf(both)
      // Every coach row the log had without the booth is still there with it.
      expect(both.filter((x) => x.kind === 'coach')).toEqual(coachOnly.filter((x) => x.kind === 'coach'))
      // ...and the booth's own row survived into the resolved log, which is the half a candidate
      // list could not tell us.
      for (const row of booth) expect(both.filter((x) => x.pointIndex === row.pointIndex)).toHaveLength(1)
      spoke += booth.length
    }
    expect(spoke, 'the booth lost its row to the tennis, or never found a changeover').toBeGreaterThan(15)
  })

  it('⭐⭐ THE STAMPED FACT IS NEVER SILENTLY DROPPED – 250 matches, 250 mentions', () => {
    // ⚠⚠ THE CASE THAT MEASURES THE FREE-CHANGEOVER SEARCH, AND ITS LENGTH IS A MEASUREMENT RATHER
    // THAN A ROUND NUMBER. ARM 11 (the search removed, so the booth takes the first changeover
    // contested or not) came back GREEN against twenty matches and green again against a hundred.
    // Swept over three hundred of these scorelines: WITH the search 300 of 300 mentions survive;
    // WITHOUT it six do not – seeds 105, 159, 198, 209, 216 and 222, where the first changeover
    // already held a tennis beat and the booth's row lost the collision. So the walk runs to 250,
    // the shortest prefix that contains more than one of them.
    //
    // ⚠ WHY IT MATTERS AT 2%: the engine has already stamped that fact as aired and charged her
    // spirit for it, and the stamp is once-ever. A dropped row is a fact that was paid for and never
    // said – the one failure this channel cannot have, which is why the booth declines a contested
    // changeover instead of competing for one.
    let spoke = 0
    for (let i = 0; i < 250; i++) {
      const { a, b, match } = fixtureMatch(`booth-never-dropped-${i}`)
      spoke += boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind: 'met', wrong: false })).length
    }
    expect(spoke, 'a fact the engine had already spent was never said out loud').toBe(250)
  })

  it('⭐⭐⭐ ZERO DRAWS IN `src/viz/commentary.ts` – the wave\'s gravest possible finding, pinned', () => {
    // The wave's §6 greps for this at the final gate; it is pinned here so the gate is not the first
    // thing to notice. ⚠ The variety of the booth's line comes from `variant()` – an integer hash of
    // the point index – which is exactly what makes a second wording possible with no dice.
    // ⚠ AIMED AT DRAW CONSTRUCTS AND NOT AT THE WORD «RNG», which this file says out loud a dozen
    // times in its own comments («deterministic phrase variety with no RNG», «STILL ZERO RNG»). A
    // case-insensitive grep for the word reddens on the notes that PROMISE the property, which is a
    // pin that cannot be kept. What cannot appear is a generator, an import of one, or a call to one.
    const src = readFileSync(resolve(__dirname, '../src/viz/commentary.ts'), 'utf8')
    expect(src, 'a draw reached the deterministic narrator').not.toMatch(/Math\.random|mulberry/i)
    expect(src, 'the narrator imported a generator').not.toMatch(/from\s+'[^']*\/rng'/)
    expect(src, 'a generator was constructed or called').not.toMatch(/rngFromSeed|\brng\s*\(|new Rng\b/)
    expect(src, 'the booth\'s variety is not `variant`').toMatch(/lines\[variant\(next, lines\.length\)\]\(names\[privateLife\.side\]\)/)
  })

  it('the booth is silent for a match that is not hers – the side is the view\'s own answer', () => {
    // `CommentaryPrivateLife` carries the side, so a rival's replay (where the component has no
    // `kidSide`) cannot reach this function with a packet at all. What is pinned here is the shape
    // that makes that possible: the side names WHOSE box the line is about.
    const { a, b, match } = fixtureMatch('booth-side')
    const hers = boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 0, kind: 'met', wrong: false }))[0]
    const theirs = boothOf(buildCommentary(match, a.name, b.name, null, null, { side: 1, kind: 'met', wrong: false }))[0]
    expect(hers.text).toContain('Vera')
    expect(theirs.text).toContain('Ines')
  })
})
