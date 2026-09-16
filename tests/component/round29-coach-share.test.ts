// ROUND 29 ITEM 13 – WHAT THE COACH TAKES OUT OF A PRIZE CHEQUE, SAID ONCE ON THE COACHES PAGE.
//
// THE OWNER, 28.08: «А мы что-то перечисляем тренеру за финал каких-то турниров в итоге? Мне кажется
// эта информация стоит того, чтобы добавить её на странице тренеров где-то, думать, что она общая
// для всех, так что можно где-то в одном месте написать наверное.»
//
// THE ANSWER IS YES, and it has been paid since round 24: `finalizeTournament` takes
// `staffResultShareBps('coach', finishIdx)` of the GROSS cheque – a title pays `titleBps`, a final
// ⚠ MUTATION-VERIFIED FOR #41, counts read off the runs (control 28/28 green over this file,
// round29p2-coach-cut-weekly and round42-coach-share-money; each mutation applied alone, reverted):
//   * `staffResultShareBps`' tail back to a hard `: 0`      -> **3 red**, one in each of the three
//     files: the semi-final arm here, the memo arm in round29p2, the first-round arm in round42.
//   * coach `finalBps` back to 500 (the tail left at 1000)  -> **1 red**, §2's «and since #41 they are
//     equal» arm here, ALONE – which is what says the two claims are separate.
//   * and in the unit suite, the same two mutations score 3 red and 2 red in tests/team-share.test.ts.
//
// ⚠⚠⚠ ROUND 42 #41 (15.09) RE-AIMED TWO ARMS IN THIS FILE AND LEFT A COPY BLOCKER STANDING. The
// coach now takes ten per cent of EVERY cheque at every finish («10% безусловных отчислений с любых
// призовых, независимо от глубины прохода»), so §2's «the final is the smaller» and §3's «a
// semi-final pays NOTHING» both describe the old rule and are re-aimed in place, each quoting its old
// self. ⚠ THE SCREEN'S OWN SENTENCE STILL SAID «nothing below a final» AND WAS NOT AN AGENT'S TO
// CHANGE (invariant 4) – the ask went into round 42's handoff instead of a quiet rewrite.
//
// ⭐⭐⭐ AND HE ANSWERED IT (15.09): «Every coach here also takes 10% of every prize cheque she
// collects.» So the copy blocker is lifted BY HIM, and three more arms move with it – §1's copy pin
// now holds his sentence (and the ABSENCE of both old clauses), and §2's join reads ONE percentage
// off the screen instead of two. The junior-ladder clause left the sentence and did NOT leave the
// engine: §3's two arms still prove it, which is why they are untouched.
//
// pays `finalBps`, and below a final nothing – on the professional tour only and only when the seat
// is filled. Nothing on any screen said so, which is what he noticed.
//
// ⚠⚠ AND HIS OWN INSTRUCTION IS THE HARD PART: «общая для всех … в одном месте». The share is a
// UNIVERSAL rule and does not vary by coach, so a line on each card would be six copies of one fact
// about none of them. §1 below is therefore a ONCE-ness assertion and not a presence one, and it is
// written so that a page with a single card could not satisfy it by accident.
//
// ⚠⚠ AND THE SECOND HARD PART IS THAT A SENTENCE ABOUT A RULE MUST BE PINNED TO THE RULE. §2 does
// not compare the screen with a constant: it PARSES THE TWO PERCENTAGES OFF THE RENDERED LINE and
// then drives a real tournament to a real title and a real final through `finalizeTournament`,
// asserting that the coach's expense row is that percentage of that cheque. If the copy and the
// engine ever disagree, the disagreement is the failure – which is the defect round-29 #10 turned
// out to be.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// The app's own sheet, for the same reason the household suite attaches it: `.cm-share-note` lives
// in src/style.css and not in the SFC.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  closeTournament,
  createWorld,
  KID_ID,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { openingCoachId } from '../../src/engine/world/coachMarket'
import { ECONOMY, staffResultShareBps } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'

/** The coaches tab of a real career, mounted. */
async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  expect(pill, 'the Coaches tab is on the screen').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

const career = (seed: string): Snapshot => toSnapshot(createWorld(seed, DEFAULT_PROFILE))
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

// =================================================================================================
// 1 – IT IS ON THE PAGE, AND IT IS ON IT ONCE
// =================================================================================================

describe('Round 29 #13 §1 – the share is stated once, for the whole page', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the coaches tab carries exactly ONE share note, over a roster of many coaches', async () => {
    const wrapper = await mountCoaches(career('r29-13-once'))
    const notes = wrapper.findAll('.cm-share-note')
    expect(notes, 'the sentence he asked for is drawn').toHaveLength(1)

    // ⚠ THE ONCE-NESS ONLY MEANS ANYTHING AGAINST A CROWD. A page with one coach on it would satisfy
    // "one note" whichever way the copy had been built, so the roster size is asserted first: this
    // is the shape of his «общая для всех, так что можно где-то в одном месте».
    const cards = wrapper.findAll('.cm-row')
    expect(cards.length, 'the market lists a real roster').toBeGreaterThan(3)
    for (const card of cards) {
      expect(card.find('.cm-share-note').exists(), 'no coach card carries its own copy').toBe(false)
    }
    wrapper.unmount()
  })

  // ⚠⚠ RE-AIMED BY ROUND 42 #41 (15.09) – HIS REPLACEMENT WORDING ARRIVED, AND THE PIN MOVED WITH IT
  // AND NOT AHEAD OF IT. The previous form of this case pinned «nothing below a final» under a ⚠ note
  // saying the clause had become false on screen and that repairing it was not an agent's to make
  // (invariant 4: «запрети на уровне документации и спекам агентам самовольно изменять вординг»).
  // The round's handoff asked him; he wrote the sentence; this is that sentence.
  //
  // ⚠ WHAT THE NEW LINE DOES **NOT** SAY IS PINNED TOO, because two conditions left the paper with
  // the old clause: «nothing below a final», which the engine had stopped running, and «nothing on
  // the junior ladder», which is still true of the engine – §3 below still proves it – and simply is
  // not on this sentence any more. A silent re-arrival of either would be a wording change nobody
  // asked for, which is the one kind of diff no other test catches.
  it('...and it says the rule his ruling of 15.09 actually runs – ten per cent of every cheque', async () => {
    const wrapper = await mountCoaches(career('r29-13-copy'))
    const line = clean(wrapper.get('.cm-share-note').text())
    expect(line).toBe(
      `Every coach here also takes ${staffResultShareBps('coach', 2) / 100}% of every prize cheque she collects.`,
    )
    expect(line, 'the depth is gone from the coach`s line').not.toContain('runner-up')
    expect(line, 'and so is the clause the engine had stopped running').not.toContain('nothing below a final')
    wrapper.unmount()
  })

  it('⚠ the household strip and the plan note above it are untouched', async () => {
    // Round-28 #8's strip and the session note are the two things already standing in this column;
    // an added sentence must not have displaced either.
    const wrapper = await mountCoaches(career('r29-13-neighbours'))
    expect(wrapper.find('.budget-household').exists(), 'the round-28 household strip').toBe(true)
    expect(wrapper.find('.cm-plan-note').exists(), 'the sessions-a-week note').toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// 2 – THE NUMBERS ON IT ARE THE ONES THE ENGINE ACTUALLY PAYS
// =================================================================================================

/** THE PERCENTAGE, READ OFF THE SCREEN. Everything in §2 is computed from this rather than from
 *  `ECONOMY`, which is what makes it a join between the copy and the cheque instead of two
 *  independent readings of one constant.
 *
 *  ⚠⚠ RE-AIMED BY ROUND 42 #41 (15.09) – ONE FIGURE WHERE THERE WERE TWO, and the arity is asserted
 *  rather than assumed. The old form returned `{ title, final }` off a line that quoted a title rate
 *  and a final rate; his replacement wording quotes ONE rate, for every cheque, because his ruling
 *  took depth out of the coach's line. The join is unchanged in kind: the cases below still pay real
 *  finishes at the rate the SCREEN prints, which is the only thing that can catch a copy that says
 *  12% while the engine pays 10%. */
async function pctOnScreen(): Promise<number> {
  const wrapper = await mountCoaches(career('r29-13-pcts'))
  const line = clean(wrapper.get('.cm-share-note').text())
  wrapper.unmount()
  const found = [...line.matchAll(/([\d.]+)%/g)].map((m) => Number(m[1]))
  expect(found.length, 'the line quotes exactly one percentage – the every-cheque rate').toBe(1)
  return found[0]
}

/** The condition.test seed trick, as tests/team-share.test.ts uses it: a private injury sub-stream
 *  that cannot fire before `through`, so a random layoff cannot turn the driven play week into a
 *  walkover and quietly make every assertion below vacuous. */
function injuryProofSeed(prefix: string, through: number): string {
  const cap = ECONOMY.availability.injuryChanceCap
  for (let i = 0; i < 400; i++) {
    const seed = `${prefix}-${i}`
    let clean = true
    for (let w = 1; w <= through && clean; w++) {
      if (rngFromSeed(`${seed}:injury:${w}`)() < cap) clean = false
    }
    if (clean) return seed
  }
  throw new Error('no injury-proof seed found')
}

/** A coached career ticked INTO a real play week with the finish forced – `finishes[KID_ID]` is
 *  exactly what `finalizeTournament` reads, so this asks the shipped function the real question. */
function drivenFinish(prefix: string, finish: number, tier: TierId = 'w15'): WorldState {
  const world = createWorld(injuryProofSeed(prefix, 6), DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0 // the professional ladder is open – the track is `wta`
  world.coachId = openingCoachId(world.seed, { ...world.profile, coachTier: 'middle' })
  world.physioActive = false
  world.season = []
  const event: SeasonEvent = {
    id: `r29-13-${prefix}`,
    week: 5,
    tier,
    surface: 'hard',
    travelCostCents: 500_00,
    deadlineWeek: 3,
  }
  world.season.push(event)
  world.entries.push(event.id)
  const rng = rngFromSeed(world.seed)
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.pendingTournament, 'the reveal spawned').not.toBeNull()
  world.pendingTournament!.result.finishes[KID_ID] = finish
  return world
}

const coachRows = (world: WorldState) =>
  world.events.filter((e) => e.week === world.week && e.text.startsWith("Coach's share of the prize money"))

describe('Round 29 #13 §2 – the sentence is pinned to the cheque, not to a constant', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ a REAL title pays the coach exactly the percentage the screen quotes', async () => {
    const pct = await pctOnScreen()
    const world = drivenFinish('title', 0)
    const prize = TIERS.w15.prizeCents![0]
    skipTournament(world)
    const rows = coachRows(world)
    expect(rows, 'a coached professional title writes one coaching row').toHaveLength(1)
    // ⚠ THE EXPECTATION IS BUILT FROM THE SCREEN'S OWN NUMBER. `-Math.round(pct/100 * gross)` is the
    // engine's own arithmetic re-spelled from the printed percentage, so a copy that said 12% while
    // the engine paid 10% fails here and nowhere else in the suite would.
    expect(rows[0].amountCents).toBe(-Math.round((prize * pct) / 100))
    closeTournament(world)
  })

  // ⚠ RE-AIMED BY ROUND 42 #41 (15.09) IN ITS TITLE AND ITS ARITHMETIC, NOT IN ITS CLAIM. It read «a
  // REAL runner-up finish pays the smaller one» and multiplied by the final rate the screen used to
  // quote separately. There is no smaller one any more – «10% безусловных отчислений с любых
  // призовых, независимо от глубины прохода» – so the runner-up is paid at the one rate on screen,
  // which is what this now asserts. Keeping a second finish is the point: a line that only ever
  // joined on a title would answer half of his «за победы».
  it('⭐ a REAL runner-up finish pays the SAME rate, off that rung`s own cheque', async () => {
    const pct = await pctOnScreen()
    const world = drivenFinish('final', 1)
    const prize = TIERS.w15.prizeCents![1]
    skipTournament(world)
    const rows = coachRows(world)
    expect(rows).toHaveLength(1)
    expect(rows[0].amountCents).toBe(-Math.round((prize * pct) / 100))
    closeTournament(world)
  })

  // ⚠⚠ RE-AIMED BY ROUND 42 #41 (15.09), TWICE. Its first form asserted «the final is the smaller»
  // under round 24's «за 2е только по-меньше»; its second asserted that the two rates on screen were
  // the engine's two and equal. His replacement WORDING (the same ruling, one item on) quotes a
  // single rate, so the join is now one figure against the whole table – and the table is asserted
  // flat here, which is where «independent of depth» is actually pinned to the screen.
  it('the rate the screen quotes is the rate the engine holds, at every depth it pays', async () => {
    const pct = await pctOnScreen()
    for (const finishIdx of [0, 1, 2, 7]) {
      expect(pct, `finish ${finishIdx}`).toBe(staffResultShareBps('coach', finishIdx) / 100)
    }
  })
})

// =================================================================================================
// 3 – AND THE TWO EXCLUSIONS IT NAMES ARE TRUE
// =================================================================================================

describe('Round 29 #13 §3 – every cheque, and nothing on the junior ladder', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ⚠⚠ RE-AIMED BY ROUND 42 #41, AND THE CLAIM INVERTED RATHER THAN SOFTENED. It read «a semi-final
  // pays the coach NOTHING – the clause is a rule and not a softener» and asserted zero rows. His
  // 15.09 ruling is that the coach takes ten per cent of EVERY cheque, so a semi-final pays him, and
  // the arm asserts the row that is actually written – at the engine's own rate, never a typed one.
  //
  // ⚠⚠⚠ AND THE SENTENCE ON SCREEN HAS CAUGHT UP. This note used to end «the screen still says
  // "nothing below a final" and no agent may change it (invariant 4) – round 42's handoff carries
  // the ask rather than a quiet rewrite». He answered: «Every coach here also takes 10% of every
  // prize cheque she collects.» The copy pin one describe up now holds that sentence, and it asserts
  // the absence of the old clause so it cannot creep back in unasked.
  it('⭐⭐ ROUND 42 #41 – a semi-final DOES pay the coach, at the same flat rate a title pays', () => {
    const world = drivenFinish('semi', 2)
    skipTournament(world)
    const rows = coachRows(world)
    expect(rows, 'below a final a row is now written').toHaveLength(1)
    const prize = TIERS.w15.prizeCents![2]
    expect(rows[0].amountCents).toBe(-Math.round((prize * staffResultShareBps('coach', 2)) / 10_000))
    expect(staffResultShareBps('coach', 2), 'and the rate has no depth in it').toBe(staffResultShareBps('coach', 0))
    closeTournament(world)
  })

  it('the junior ladder carries no prize table at all, which is why it can pay no share', () => {
    // ⚠ THIS IS THE HONEST PIN FOR THE «junior ladder» CLAUSE. A driven junior title would pass
    // whether or not the `track === 'wta'` guard existed – a share of nothing is nothing – so it
    // would be a dead guard. What makes the sentence true is the catalogue: no non-professional rung
    // has a cheque to take a share OF.
    for (const [id, tier] of Object.entries(TIERS)) {
      if (tier.track === 'wta') continue
      expect(tier.prizeCents, `${id} is not a professional rung and pays no prize money`).toBeUndefined()
    }
  })

  it('⚠ ...and the guard at the call site is LIVE – a junior rung with a cheque still pays nothing', () => {
    // ⚠⚠ THE ONLY WAY TO MAKE THIS CLAIM NON-DEAD. `finalizeTournament` asks `track === 'wta'` BEFORE
    // it computes the share, and with no junior rung carrying a prize table that branch can never be
    // observed: deleting the guard changes nothing, because a share of zero is zero. So the rung is
    // given a cheque for the length of this one test – the same device tests/tour-briefing.test.ts
    // uses on `ECONOMY.mandatory` – and the assertion becomes the guard itself.
    //
    // Mutation-verified: drop `track === 'wta' &&` at world.ts's coach-share line and this reddens.
    const saved = TIERS.j300.prizeCents
    try {
      ;(TIERS.j300 as { prizeCents?: number[] }).prizeCents = [9_000_00, 5_000_00, 2_500_00, 1_200_00]
      const world = drivenFinish('junior-title', 0, 'j300')
      skipTournament(world)
      expect(coachRows(world), 'the junior tour is not the convention`s world').toHaveLength(0)
      closeTournament(world)
    } finally {
      ;(TIERS.j300 as { prizeCents?: number[] }).prizeCents = saved
    }
  })
})
