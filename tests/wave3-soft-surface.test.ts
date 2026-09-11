// =================================================================================================
// WAVE 3, T15 – THE TIER-1 SOFT SURFACE: SHE CAME BY, AND THE WEEK DID NOT STOP FOR IT
// =================================================================================================
//
// `docs/specs/who-she-is-2026-09.md` §5b's «SOFT BLOCK CONCRETIZED (11.09)» amendment is the ruling
// this file tests; `docs/plans/life-wave-3-builder-2026-09.md` §2 T15 is its build order. The five
// points, because every section below is one of them:
//
//   1. the card is only the INVITATION – it opens the SAME `LifeBeatDialog` on the same prompt
//      contract, and no new dialog exists anywhere (§F here, and the mounted half in
//      tests/component/wave3-soft-card.test.ts);
//   2. soft never stops the week – the kind registry declares `blocking` per kind, TOTAL BY TYPE;
//      `pendingLifeBeat` narrows to blocking rows and the `'life'` StopReason reads only those (§A);
//   3. answerable has a WINDOW – three weeks, DERIVED from `week − row.week`, never stored (§B);
//   4. never lost = the ROW, not the chance – it stands forever, answered or expired with
//      `answer: null`, and bond moves nothing either way (§C);
//   5. one at a time, and the band gate stands – no new raise while a live unanswered soft row
//      exists, the season cap counts raised rows answered or not, close/steady only (§D, §E).
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts SHAPES and BEHAVIOUR, never wording: the card's line is a
// DRAFT for the owner (CLAUDE.md invariant 4), so what is pinned is «the invitation is the engine's
// one line and the dialog owns the rest», never the sentence.
//
// ⚠ AND IT DOES NOT RE-TEST T8. The hazard by band, the season cap, the subject derivation, the
// zero-priced replies and her eighteen drafted lines are `tests/wave3-small-talk.test.ts`'s, which
// T15 re-aimed in three places (§A's queue case, §C's drain case and §H's raise-path guard) with
// their ⚠ notes. This file is the surface T15 built around them.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was RUN, watched fail, and put back.
// =================================================================================================
//
//   ARM 10  ⚠⚠ THE BRIEF'S OWN SPECIFIED ARM – `'small-talk'` marked BLOCKING in
//           `LIFE_BEAT_BLOCKING` (`'small-talk': true`): the hard pause the owner reverted, restored
//           by a one-word table edit.
//           **28 RED** across this file and `tests/wave3-small-talk.test.ts`, 23 green.
//           The two that matter, because they are the behavioural ones:
//           §H of the small-talk file «⚠⚠ ...and a WALKED career raises them while the week NEVER
//           stops for one: dormant-1 week 1: tier 1 stopped a week: expected 'small-talk' not to be
//           'small-talk'», and §A here «⭐⭐ the registry is TOTAL BY TYPE ...: the ruled table: tier 2
//           blocks, tier 1 does not: expected { 'fork-opinion': true, …(2) } to deeply equal
//           { 'fork-opinion': true, …(2) }». Most of the other 26 land on the FIXTURE line
//           (`withSoftRow`'s «the fixture really is waiting: expected null not to be null»), which is
//           the same statement read at the door: a blocking row is not a soft one.
//           ⚠⚠ AND THE ARM CAUGHT A DEAD NET ON ITS FIRST RUN, RECORDED BECAUSE IT IS THE FINDING:
//           the walked-career cases asserted `advanceRefusal(world) !== 'life'` AFTER
//           `drainLifeBeats(world)` – and the drain ANSWERS a blocking row, clearing the refusal
//           before the assertion read it. Both walks (this file's §F and the small-talk file's §H)
//           now assert BEFORE the drain, and on the KIND (`'met'` still blocks and still should).
//           The line above is the re-run.
//
//   ARM 11  the TTL comparison widened – `world.week - row.week <= ttl` in `liveSoftBeat`, so the
//           window runs one week past its ruled end.
//           **4 RED** · §B «⭐⭐⭐ live on the raise week and the two after it, gone on the third:
//           ⚠⚠ raise + 3: the moment has passed: expected { week: 100, kind: 'small-talk', …(2) } to
//           be null», §B's row-persistence and derived-liveness cases on the same boundary, and §D
//           «⭐⭐ no new raise while a live unanswered soft row exists: ⭐ and the week after it expires
//           she may come again: expected false to be true».
//           ⚠ THE LAST ONE IS THE POINT OF RECORDING THIS ARM SEPARATELY FROM ARM 12: the boundary is
//           load-bearing in TWO directions, and a one-week slip shows up in the raise gate as well as
//           in the card.
//
//   ARM 12  the window dropped entirely – `liveSoftBeat` returning the first unanswered non-blocking
//           row whatever its age, which is «never lost» misread as «never expires».
//           **9 RED** · §B's three, §C «⭐⭐⭐ a row that expired unanswered moves neither bond nor
//           spirit: the moment passed unanswered: expected { week: 100, … } to be null», §D's
//           «⚠ an EXPIRED unanswered row does not silence her for ever: long expired: expected
//           { week: 100, … } to be null» and the targeting case, §F's span case, and – the one worth
//           naming – `tests/wave3-small-talk.test.ts` §D «⭐⭐ never a fifth in one season, over forty
//           careers of asking: and the cap really is reached – the sweep could have failed: expected
//           0 to be greater than 0», which is T8's own cap sweep starving because one unanswered row
//           silences the career for ever.
//
//   ARM 13  `answerLifeBeat` reverted to its pre-T15 target – `rows.findIndex((row) => row.answer
//           === null)`, the naive scan.
//           **2 RED** · §D «⭐⭐⭐ an answer goes to the BLOCKING row while one is waiting – never to an
//           expired card: Error: That is not one of the answers this beat offered» (thrown from
//           `answerLifeBeat`: the `'met'` answer was aimed at a three-week-dead small-talk row, whose
//           options do not include it – so the week would have stayed stopped with nothing able to
//           clear it), and §D's drain case.
//           ⚠ THE THROW IS THE MILD FORM. The same mutation on a career whose expired row and whose
//           blocking beat share an option id would have RECORDED the answer against the wrong row
//           silently, which is why the targeting is by kind rather than by luck.
//
//   ARM 14  the raise gate's new clause deleted – `if (liveSoftBeat(world) !== null) return false`
//           removed from `smallTalkEligible`, so a second card can be raised over a live one.
//           **2 RED** · §D «⭐⭐ no new raise while a live unanswered soft row exists: raise + 0: she
//           does not come twice: expected true to be false» and `tests/wave3-small-talk.test.ts` §A
//           «⭐ nothing new while something is still waiting – the queue is the gate: a live soft row
//           refuses: expected true to be false».
//
// ⚠ ALL FIVE WERE REVERTED AND THE ENGINE FILE DIFFED BYTE-FOR-BYTE AGAINST ITS PRE-ARM COPY
// («ENGINE IDENTICAL TO PRE-ARM STATE»), then re-run: 51 green across the two files.
import { describe, expect, it } from 'vitest'

import {
  advanceRefusal,
  advanceWeeks,
  answerLifeBeat,
  buildLifeBeatPrompt,
  buildSoftBeatInvite,
  createWorld,
  lifeBeatOptionsFor,
  lifeLogOf,
  liveSoftBeat,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  raiseLifeBeat,
  rollSmallTalk,
  smallTalkEligible,
  smallTalkThisSeason,
  toSnapshot,
  tickWeek,
  LIFE_BEAT_BLOCKING,
  LIFE_BEAT_OPTIONS,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { bondBandOf } from '../src/engine/spirit'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import { DEFAULT_PROFILE, type BondBand, type LifeBeatKind, type LoveEpisode } from '../src/shared/protocol'

const LIFE = ECONOMY.life
const TTL = LIFE.smallTalkTtlWeeks
const OPTIONS = LIFE_BEAT_OPTIONS['small-talk']
const BANDS: readonly BondBand[] = ['close', 'steady', 'strained', 'cold']

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The lowest `bond` that still reads as this band – ASKED OF THE LADDER rather than transcribed,
 *  the same helper wave 3's other four files use for the same reason. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A real career parked at `week`, at a known band, with an empty life. */
function careerAt(seed: string, week: number, band: BondBand = 'close'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.week = week
  world.bond = bondFor(band)
  return world
}

/** A career whose ONE `lifeLog` row is a small-talk row raised at `week`, by the roll itself where
 *  the dice allow and by the engine's own writer otherwise.
 *
 *  ⚠ `raiseLifeBeat` IS THE ENGINE'S OWN ONE WRITER, not a hand-built row: the fixture is the state
 *  `rollSmallTalk` produces, reached without waiting for an 8% die. The roll's own behaviour is
 *  `tests/wave3-small-talk.test.ts`'s subject and is walked end to end in §F below. */
function withSoftRow(seed: string, week: number, band: BondBand = 'close', detail = 'question'): WorldState {
  const world = careerAt(seed, week, band)
  raiseLifeBeat(world, 'small-talk', detail)
  expect(liveSoftBeat(world), `${seed}: the fixture really is waiting`).not.toBeNull()
  return world
}

const episode = (sinceWeek: number, knownWeek: number): LoveEpisode => ({
  id: `p:${sinceWeek}`,
  sinceWeek,
  endedWeek: null,
  knownWeek,
  wants: 'open',
  partnerId: `p:${sinceWeek}`,
})

// =================================================================================================
// A. ⚠⚠ SOFT NEVER STOPS THE WEEK – THE REGISTRY, THE PENDING SET, AND THE `'life'` STOP
// =================================================================================================
//
// ⚠⚠ THE MUTATION ARM THE BRIEF SPECIFIES LIVES HERE (ARM 10): mark `'small-talk'` blocking in
// `LIFE_BEAT_BLOCKING` and the advance-never-stops cases go red. That single word is the whole of
// the difference between what T8 shipped and what §5b ruled, which is why the registry is the thing
// pinned rather than the two stop sites.
describe('wave 3 T15 A – the blocking registry, and what the week waits for', () => {
  it('⭐⭐ the registry is TOTAL BY TYPE, and every kind of the union declares', () => {
    // ⚠ THE KINDS COME FROM THE RECORD THE OPTIONS ARE KEYED ON, so a kind added later cannot be
    // missed by this sweep – it would have to be added to both records, which is the point of both
    // being total. The two readings are compared to each other AND to the literal table, because two
    // derivations agreeing with one another is exactly the defect this wave has already caught once.
    const kinds = Object.keys(LIFE_BEAT_OPTIONS) as LifeBeatKind[]
    expect(Object.keys(LIFE_BEAT_BLOCKING).sort(), 'every kind declares, and no more').toEqual([...kinds].sort())
    for (const kind of kinds) {
      expect(typeof LIFE_BEAT_BLOCKING[kind], `${kind}: declared, never undefined`).toBe('boolean')
    }
    expect(LIFE_BEAT_BLOCKING, 'the ruled table: tier 2 blocks, tier 1 does not').toEqual({
      'fork-opinion': true,
      met: true,
      'small-talk': false,
    })
  })

  it('⭐⭐⭐ a live soft row is NOT pending, and the engine will tick straight past it', () => {
    const world = withSoftRow('soft-not-a-stop', 200)
    expect(pendingLifeBeat(world), 'the pending set is the blocking rows').toBeNull()
    expect(buildLifeBeatPrompt(world), 'so no blocking prompt is assembled for it').toBeNull()
    expect(advanceRefusal(world), '⚠⚠ and the advance is not refused').toBeNull()
    // ...and the week really moves, with the row still standing behind it.
    const rng = resumeMain(world.rngMain)
    const stops = advanceWeeks(world, rng, 1)
    expect(world.week, 'a week was lived').toBe(201)
    expect(stops, '⚠⚠ and `life` is not among the reasons it stopped').not.toContain('life')
    expect(liveSoftBeat(world), 'her row is untouched by the tick').not.toBeNull()
  })

  it('⚠⚠ ...and a BLOCKING row on the same career still stops it – the control', () => {
    // «The week did not stop» is free if nothing could have stopped it. Same world, same predicate,
    // one `'met'` row added: it refuses by name, and the soft row is still there beside it.
    const world = withSoftRow('soft-beside-blocking', 200)
    world.loveEpisodes = [episode(194, 200)]
    raiseLifeBeat(world, 'met', 'p:194')
    expect(advanceRefusal(world), 'THAT is what stops a week').toBe('life')
    expect(pendingLifeBeat(world)!.kind, 'and it is the blocking one that is waiting').toBe('met')
    expect(liveSoftBeat(world)!.kind, '⭐ a soft row and a blocking beat coexist untouched').toBe('small-talk')
  })

  it('⚠ the blocking overlay is decided by the blocking prompt alone – the card is not an overlay', () => {
    // The surface half of the same law, on the composable App.vue reads. A soft row must not put a
    // modal on screen: the player opens one by tapping, and `blockingOverlay` answers «which question
    // is the ENGINE waiting on», which is none.
    const world = withSoftRow('soft-no-overlay', 200)
    const snapshot = toSnapshot(world)
    expect(snapshot.softBeat, 'the invitation is on the snapshot').not.toBeNull()
    expect(snapshot.lifeBeatPrompt, 'and the blocking prompt is not').toBeNull()
    expect(blockingOverlay(snapshot), '⚠⚠ nothing is laid over the app for a soft row').toBeNull()
    // THE CONTROL: the same snapshot with a blocking beat really does name one.
    world.loveEpisodes = [episode(194, 200)]
    raiseLifeBeat(world, 'met', 'p:194')
    expect(blockingOverlay(toSnapshot(world)), 'and a blocking beat really does').toBe('life')
  })
})

// =================================================================================================
// B. ⚠⚠ THE WINDOW – THREE WEEKS, DERIVED FROM `week − row.week`, NEVER STORED
// =================================================================================================
describe('wave 3 T15 B – answerable has a window', () => {
  it('⭐⭐⭐ live on the raise week and the two after it, gone on the third', () => {
    // ⚠ THE BOUNDARY IS WALKED RATHER THAN SAMPLED, and the constant is read from `ECONOMY` so the
    // case follows a ruling that moves instead of pinning 3 twice.
    const world = withSoftRow('ttl-boundary', 100)
    for (let age = 0; age < TTL; age++) {
      world.week = 100 + age
      expect(liveSoftBeat(world), `raise + ${age}: still answerable`).not.toBeNull()
      expect(buildSoftBeatInvite(world), `raise + ${age}: and the card is up`).not.toBeNull()
    }
    world.week = 100 + TTL
    expect(liveSoftBeat(world), `⚠⚠ raise + ${TTL}: the moment has passed`).toBeNull()
    expect(buildSoftBeatInvite(world), 'and the card is gone with it').toBeNull()
    // ...and it does not come back, however long the career runs.
    world.week = 100 + 4 * TTL
    expect(liveSoftBeat(world), 'an expired row stays expired').toBeNull()
  })

  it('⭐⭐ THE ROW PERSISTS UNANSWERED – «never lost» is the row, not the chance', () => {
    const world = withSoftRow('ttl-row-stands', 100)
    world.week = 100 + TTL
    expect(liveSoftBeat(world), 'the window has closed').toBeNull()
    const rows = lifeLogOf(world)
    expect(rows.length, '⚠⚠ and the row is STILL THERE – the honest record that she came').toBe(1)
    expect(rows[0], 'unchanged, and unanswered').toEqual({
      week: 100,
      kind: 'small-talk',
      detail: 'question',
      answer: null,
    })
    // ...and it still counts for the season it happened in (the cap counts RAISED rows).
    world.week = 100
    expect(smallTalkThisSeason(world), 'the cap counts it, answered or not').toBe(1)
  })

  it('⚠ liveness is DERIVED and nothing on the world records it', () => {
    // ⚠⚠ THE DISCIPLINE ASSERTED AS A PROPERTY, not as an absence of a field name: the SAME row, on
    // two worlds differing only in `world.week`, reads live on one and expired on the other. A stored
    // flag cannot do that, and a reader that cached one would fail here.
    const live = withSoftRow('ttl-derived', 100)
    const expired = withSoftRow('ttl-derived', 100)
    expired.week = 100 + TTL
    expect(JSON.stringify(live.lifeLog), 'the two logs are byte-identical').toBe(JSON.stringify(expired.lifeLog))
    expect(liveSoftBeat(live), 'and only the WEEK decides').not.toBeNull()
    expect(liveSoftBeat(expired), '...which is what «derived» means').toBeNull()
    // ⚠ AND A ROW FROM THE FUTURE IS NOT LIVE EITHER – no state the sim produces holds one, so this
    // is the hand-built case, and a negative age reading «live» would be a window nobody could close.
    const ahead = withSoftRow('ttl-future', 100)
    ahead.week = 99
    expect(liveSoftBeat(ahead), 'a row from next week is not waiting today').toBeNull()
  })
})

// =================================================================================================
// C. ⚠⚠ V2's ZERO SURVIVES THE SILENCE – bond moves nothing, answered or not
// =================================================================================================
//
// «Tier-1 replies move nothing» (ruling V2, 09.09) and §5b's amendment: «Bond moves nothing either
// way – V2's zero holds even for the silence». The second half is the one this section exists for:
// an expiry is not a refusal and may not be priced as one.
describe('wave 3 T15 C – the silence costs nothing either', () => {
  it('⭐⭐⭐ a row that expired unanswered moves neither bond nor spirit', () => {
    const world = withSoftRow('v2-silence', 100)
    const bond = world.bond
    const spirit = world.spirit
    // The whole window lived through, week by week, with nobody tapping the card.
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < TTL + 1; i++) advanceWeeks(world, rng, 1)
    expect(liveSoftBeat(world), 'the moment passed unanswered').toBeNull()
    expect(lifeLogOf(world).some((r) => r.week === 100 && r.answer === null), 'and the row stands').toBe(true)
    // ⚠ THE READING: `advanceWeeks` lives real weeks, so `bond`/`spirit` move for the ordinary
    // reasons a week moves them – what may NOT happen is a delta attributable to the silence. So the
    // control is the identical career with no row at all, walked the same weeks with the same dice.
    const control = careerAt('v2-silence', 100)
    const controlRng = resumeMain(control.rngMain)
    for (let i = 0; i < TTL + 1; i++) advanceWeeks(control, controlRng, 1)
    expect(world.bond, '⚠⚠ the silence is free – bond is the same as a career she never came to').toBe(control.bond)
    expect(world.spirit, 'and so is her weather').toBe(control.spirit)
    void bond
    void spirit
  })

  it('⚠ and answering inside the window is free too – the same zero from the other side', () => {
    for (const option of OPTIONS) {
      const world = withSoftRow(`v2-answer-${option.id}`, 100)
      const bond = world.bond
      answerLifeBeat(world, option.id)
      expect(world.bond, `${option.id}: a tier-1 reply moved the standing`).toBe(bond)
      expect(lifeLogOf(world)[0].answer, `${option.id}: something really was answered`).toBe(option.id)
    }
  })
})

// =================================================================================================
// D. ⚠⚠ ONE AT A TIME, AND WHICH ROW AN ANSWER REACHES
// =================================================================================================
describe('wave 3 T15 D – one at a time, and the answer finds the right row', () => {
  it('⭐⭐ no new raise while a live unanswered soft row exists', () => {
    const world = withSoftRow('one-at-a-time', 100)
    for (let age = 0; age < TTL; age++) {
      world.week = 100 + age
      expect(smallTalkEligible(world), `raise + ${age}: she does not come twice`).toBe(false)
    }
    // ...and the season really does re-open the moment the window closes – the positive control, so
    // «never eligible» cannot pass for «one at a time».
    world.week = 100 + TTL
    expect(smallTalkEligible(world), '⭐ and the week after it expires she may come again').toBe(true)
  })

  it('⚠ an EXPIRED unanswered row does not silence her for ever', () => {
    // The failure mode «never lost» invites: a row nobody answered blocking every later conversation
    // because it is still `answer: null`. The window is what stops it, and this is that statement.
    const world = withSoftRow('expired-not-a-lock', 100)
    world.week = 100 + 30
    expect(liveSoftBeat(world), 'long expired').toBeNull()
    expect(smallTalkEligible(world), 'and she is free to come again').toBe(true)
  })

  it('⭐⭐⭐ an answer goes to the BLOCKING row while one is waiting – never to an expired card', () => {
    // ⚠⚠ THIS IS THE DEFECT THE TARGETING EXISTS FOR, and it is the reason `answerLifeBeat` is no
    // longer a `findIndex(answer === null)`: an expired soft row keeps `answer: null` for the rest of
    // the career, so the naive scan would record the parent's word about her ATTACHMENT against a
    // conversation three weeks dead – and leave the beat that stopped the week still stopping it.
    const world = withSoftRow('target-row', 100)
    world.week = 100 + TTL + 5
    world.loveEpisodes = [episode(90, world.week)]
    raiseLifeBeat(world, 'met', 'p:90')
    expect(liveSoftBeat(world), 'the old card is long gone').toBeNull()
    expect(pendingLifeBeat(world)!.kind, 'and the `met` row is what the week is waiting on').toBe('met')

    answerLifeBeat(world, 'wary')
    const rows = lifeLogOf(world)
    expect(rows[0].answer, '⚠⚠ the expired conversation was NOT answered by proxy').toBeNull()
    expect(rows[1].answer, 'the blocking beat was').toBe('wary')
    expect(advanceRefusal(world), 'and the week may move again').not.toBe('life')
  })

  it('⚠ ...and with nothing blocking, the same command answers the live card', () => {
    const world = withSoftRow('target-soft', 100)
    answerLifeBeat(world, OPTIONS[0].id)
    expect(lifeLogOf(world)[0].answer, 'the card the player tapped').toBe(OPTIONS[0].id)
    expect(liveSoftBeat(world), 'and it is no longer waiting').toBeNull()
    expect(buildSoftBeatInvite(world), 'so the card is gone').toBeNull()
  })

  it('⚠ a soft row cannot be answered with another kind\'s option id – re-validation, unchanged', () => {
    const world = withSoftRow('target-revalidate', 100)
    expect(() => answerLifeBeat(world, 'warm')).toThrow(/not one of the answers/)
    expect(() => answerLifeBeat(world, 'back')).toThrow(/not one of the answers/)
    expect(lifeLogOf(world)[0].answer, 'and nothing was recorded').toBeNull()
  })

  it('⚠ the harness helper leaves it alone, and says so through the engine\'s own reading', () => {
    // The `drainLifeBeats` half of the same law, from the tools side: 40 tools walk careers past
    // beats they never meant to price, and a beat that stops nothing needs no draining.
    const world = withSoftRow('drain-skips', 100)
    expect(pendingLifeBeatOptions(world), 'nothing is pending, so nothing is priced').toBeNull()
    expect(drainLifeBeats(world), 'and the walk clears nothing').toBe(0)
    expect(liveSoftBeat(world), '⚠ her row is still waiting rather than swallowed').not.toBeNull()
    // THE CONTROL: the same helper on a blocking row still drains, bond-neutrally.
    world.loveEpisodes = [episode(94, 100)]
    raiseLifeBeat(world, 'met', 'p:94')
    const bond = world.bond
    expect(drainLifeBeats(world), 'a blocking beat is still drained').toBe(1)
    expect(world.bond, 'and the number the harness was measuring did not move').toBe(bond)
  })
})

// =================================================================================================
// E. ⚠⚠ THE CARD CANNOT EXIST AT strained / cold – THE SILENCE IS STILL THE LINE
// =================================================================================================
describe('wave 3 T15 E – close and steady only', () => {
  it('⭐⭐ a distant home raises nothing, so no card can ever be up on one', () => {
    for (const band of BANDS) {
      const live = ECONOMY.life.smallTalkPerWeek[band] > 0
      expect(smallTalkEligible(careerAt(`band-${band}`, 200, band)), `${band}: the gate`).toBe(live)
      // ...and over eight careers' worth of asking, a silent band never produces a card. ⚠ EIGHT AND
      // NOT ONE, because the positive control is a CHANCE: `steady` is 4%/wk, so a single career's
      // dice miss a whole season 12% of the time and the control would be the flaky half of a case
      // whose negative half is exact.
      let cards = 0
      for (let seed = 0; seed < 8; seed++) {
        const world = careerAt(`band-${band}-${seed}`, 200, band)
        for (let w = 200; w < 200 + 52; w++) {
          world.week = w
          world.lifeLog = []
          rollSmallTalk(world)
          if (buildSoftBeatInvite(world) !== null) cards++
        }
      }
      if (live) expect(cards, `${band}: a live band really does bring one up`).toBeGreaterThan(0)
      else expect(cards, `⚠⚠ ${band}: the silence is still the line`).toBe(0)
    }
  })

  it('⚠ and a career that FALLS to strained keeps the card it already has', () => {
    // ⚠ THE READING, stated because it is a decision rather than an accident: the band decides
    // whether she COMES, never whether what she already said is still answerable. A row raised at
    // `close` on Monday is not deleted by a bad week – «never lost» is the row.
    const world = withSoftRow('band-falls', 200, 'close')
    world.bond = bondFor('strained')
    expect(liveSoftBeat(world), 'the conversation she already started stands').not.toBeNull()
    expect(smallTalkEligible(world), 'but no new one begins').toBe(false)
  })
})

// =================================================================================================
// F. ⚠⚠ END TO END – THE ROLL RAISES IT, THE SNAPSHOT CARRIES IT, THE ANSWER CLEARS IT, AND NOT ONE
//    WEEK OF IT WAS STOPPED
// =================================================================================================
describe('wave 3 T15 F – a walked career, from the raise to the answer', () => {
  it('⭐⭐⭐ card appears -> open -> answer -> card gone, and the week never stopped for it', () => {
    // A REAL WALK: `tickWeek` + the engine's own commands, at the most generous band, with the
    // blocking drain in the loop so a `'met'` row cannot be what this case is measuring.
    const world = createWorld('t15-end-to-end', DEFAULT_PROFILE)
    const rng = resumeMain(world.rngMain)
    const close = bondFor('close')
    let raisedAt = -1
    for (let w = 0; w < 52 && raisedAt < 0; w++) {
      world.bond = close
      tickWeek(world, rng)
      // ⚠⚠ ON EVERY WEEK, NOT AT THE END, AND **BEFORE THE DRAIN**: a hard pause shows up as a
      // `'life'` refusal on the very week the row is raised, and a drain running first would answer
      // it and clear the refusal – the assertion would then be green under the mutation it exists to
      // catch. ⚠ THE KIND IS WHAT IS ASSERTED, not the absence of a stop: `'met'` still blocks.
      if (advanceRefusal(world) === 'life') {
        expect(pendingLifeBeat(world)!.kind, `week ${world.week}: tier 1 stopped a week`).not.toBe('small-talk')
      }
      drainLifeBeats(world)
      if (liveSoftBeat(world) !== null) raisedAt = world.week
    }
    expect(raisedAt, 'the walk really did bring her to the table').toBeGreaterThan(-1)

    // THE CARD. One line of the engine's, and the conversation behind it on the ordinary contract.
    const invite = buildSoftBeatInvite(world)!
    expect(invite.card.length, 'the invitation is one short line').toBeGreaterThan(0)
    expect(invite.prompt.kind, 'and the dialog it opens is tier 1\'s').toBe('small-talk')
    expect(invite.prompt.options.map((o) => o.id), 'with her parent\'s three replies').toEqual(
      lifeBeatOptionsFor('small-talk', 'open').map((o) => o.id),
    )
    // ⚠ THE INVITATION MAY NOT BE THE CONVERSATION: the card's line is not her line and not the
    // heading – it says she came, and what she came with is behind the tap.
    expect(invite.card, 'the card is not her line').not.toBe(invite.prompt.said)
    expect(invite.card, 'nor the parent\'s frame').not.toBe(invite.prompt.heading)
    // ...and the snapshot the app renders carries exactly that, with no blocking prompt beside it.
    const snapshot = toSnapshot(world)
    expect(snapshot.softBeat, 'the snapshot carries the invitation').toEqual(invite)
    expect(snapshot.lifeBeatPrompt, 'and nothing is blocking').toBeNull()

    // THE ANSWER, through the command the dialog sends.
    const bond = world.bond
    answerLifeBeat(world, invite.prompt.options[0].id)
    expect(world.bond, 'tier 1 is texture, never economy').toBe(bond)
    expect(buildSoftBeatInvite(world), '⭐ the card is gone').toBeNull()
    expect(toSnapshot(world).softBeat, 'and so is the snapshot\'s invitation').toBeNull()
    const row = lifeLogOf(world).find((r) => r.week === raisedAt)!
    expect(row.answer, 'and the row records what he said').toBe(invite.prompt.options[0].id)

    // ⚠ AND THE WEEK AFTER IT IS STILL A WEEK: the advance was never the thing being unblocked.
    // ⚠⚠ `tickWeek` AND NOT `advanceWeeks` FOR THE MOVEMENT HALF, and the reason is a measured trap
    // rather than a preference: this walk uses `tickWeek`, which is TOTAL, so the career can be
    // parked on an unresolved tournament or a knock – states `advanceWeeks` legitimately refuses at
    // entry, for reasons that have nothing to do with her. Written with `advanceWeeks` this case read
    // «expected 23 to be 24» and would have been a case about the tournament desk. The claim about
    // the block contract is made by the refusal predicate itself, on the line above and on every week
    // of the loop.
    expect(advanceRefusal(world), 'nothing was ever waiting on it').not.toBe('life')
    const before = world.week
    tickWeek(world, rng)
    expect(world.week, 'time moved as it always did').toBe(before + 1)
  })

  it('⚠⚠ A SPAN RUNS STRAIGHT THROUGH A LIVE CARD – the stop reasons, not just the refusal', () => {
    // The other half of the block contract: `advanceRefusal` guards the ENTRY, and `advanceWeeks`
    // COLLECTS reasons inside its loop (R11-1: a week that is several things reports all of them).
    // T8's defect showed up in that collection – a four-week span cut to one – so the span is what
    // this case walks.
    //
    // ⚠ THE FIXTURE IS A CAREER WITH NOTHING ELSE IN IT: `createWorld` at week 200 has entered no
    // tournament, so nothing but her can stop this span, and a cut span is therefore attributable.
    const world = withSoftRow('t15-span', 200)
    const rng = resumeMain(world.rngMain)
    const stops = advanceWeeks(world, rng, 4)
    expect(world.week, '⚠⚠ the whole span was lived – T8 cut this to one week').toBe(204)
    expect(stops, 'and `life` is not among the reasons').not.toContain('life')
    // ...and her row lived the span out and expired inside it, still unanswered, still recorded.
    expect(liveSoftBeat(world), 'the window closed during the span').toBeNull()
    expect(lifeLogOf(world)[0], 'and the row is the honest record of it').toEqual({
      week: 200,
      kind: 'small-talk',
      detail: 'question',
      answer: null,
    })
  })

  it('⚠ ...and the SAME span stops dead on a blocking row – the control for the case above', () => {
    // «The span ran through» is free if this fixture's spans always run. So: the identical career,
    // the identical call, with a `'met'` row raised instead of a soft one.
    const world = careerAt('t15-span-control', 200)
    world.loveEpisodes = [episode(194, 200)]
    raiseLifeBeat(world, 'met', 'p:194')
    const rng = resumeMain(world.rngMain)
    const stops = advanceWeeks(world, rng, 4)
    expect(world.week, 'the span was refused at entry – not one week was lived').toBe(200)
    expect(stops, 'and it said why').toContain('life')
  })
})
