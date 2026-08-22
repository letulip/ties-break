// ROUND 21, THE COACH ITEMS – #7 (the verdict window), #11 (the chosen coach looks chosen) and
// #12 (the affordability gate ignored most of the family's income).
//
// All three are the owner's, 14.08, played on the 128-draw build off his own save. His words are
// quoted verbatim in the engine and in this file's own comments – never in a Vue template, where no
// Cyrillic may appear at all (tests/round13-nav.test.ts enforces it, comments included).
//
// WHAT EACH ITEM HAD TO GET RIGHT, and each is a `describe` below in this order:
//
//   #7a  the pre-reveal plaque says the verdict comes in the OFF-SEASON. «Too early to tell» said
//        only that it was not now, which is why it read as absurd printed in an off-season with the
//        season already played.
//   #7b  no "N weeks of 52". A rolling 52-week bar is the wrong clock for a question the SEASON
//        answers, and printing its progress made the card argue with the calendar beside it.
//   #7c  the window follows WHEN he was hired. He asked whether it already did; it did not – the
//        finding is written out over `coachRevealWeek` in engine/world/coachMarket.ts, and the short
//        version is that the old gate was `weeksTogether >= 52` with no calendar anywhere in it.
//   #11  the coach she HAS carries the accent frame and his portrait stays lit, whatever the family
//        earns. It was the cascade rather than the colour: `.cm-row.blocked` is declared under
//        `.cm-row.current` at the same specificity, so a current-and-unaffordable row lost the frame
//        to a dashed grey border and had its portrait dimmed to 0.45.
//   #12  the gate reads ALL the money that arrives every week, not the parents' line alone.
//
// ⚠ MUTATION-VERIFIED – eight mutations, each applied alone against this file, coach-edge-card and
// the two unit pins (coach-edge, coach-market). `|c|` is this file, `|e|` coach-edge-card.test.ts,
// `|u|` tests/coach-edge.test.ts. Nothing below passed against a broken build, and the three items
// never redden together, which is what says they are three claims:
//
//   * `coachPlaqueLine` returning the old `Too early to tell … N weeks of 52` -> |c| #7a, #7b and
//     all three of #7c, |e| the two shipped plaque pins, |u| three;
//   * the near/far arms SWAPPED -> |c| #7a's copy test and all three of #7c, |u| two. It does NOT
//     redden #7b: both arms still count nothing, which is the separation that keeps "the words" and
//     "the window" apart as claims;
//   * `coachRevealWeek` returning `sinceWeek + 52` – the old rolling bar, i.e. the shipped defect ->
//     |c| #7a's copy test, #7c's far-arm test and #7c's off-season test, |u| the reveal test, the
//     bar test and the re-hire test. It leaves #7b and #7c's "moves itself" test green, so this is
//     the mutation that proves the WINDOW moved and not just the sentence;
//   * the template's `blocked` back to `r.overBudgetCents > 0 || r.lockedPoints !== null` -> |c|
//     #11's class test and its portrait test (the current row lands in the refusal set), and
//     NOTHING else in any file;
//   * the three `.cm-row.current.blocked` rules deleted from style.css -> |c| #11's cascade-lock
//     test ALONE. That is exactly what that test is for: the sheet is the second lock, and a second
//     lock nobody can see fail is not a lock;
//   * BOTH of the two above, i.e. the shipped defect reproduced exactly (plus the ring removed) ->
//     |c| all four of #11 and nothing else. This is the one that says the owner's screen is fixed;
//   * `familyWeeklyIncomeCents` returning the parents' contribution alone – the shipped #12 defect
//     -> |c| all three of #12, and nothing in #7 or #11;
//   * `capCents` back to recovering the cap from an over-budget row -> |c| #12's budget-meter test
//     alone, which is the latent bug the income fix would otherwise have exposed on his own save.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. `.cm-row.current`, `.cm-row.blocked` and `.cm-art` live in src/style.css,
// not in the SFC, so without this every computed value below is the initial one and #11 would pass
// on the exact build it is guarding.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hireCoach, tickWeek, toSnapshot } from '../../src/engine/world'
import { coachRevealWeek } from '../../src/engine/world/coachMarket'
import { rngFromSeed } from '../../src/engine/rng'
import { ECONOMY, parentIncomeForWeekCents } from '../../src/engine/economy'
import { isOffSeasonWeek, OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'
import { parseColor } from './contrast'

/** Refuses to run blind: with no stylesheet every property computes to its initial value, which
 *  would make #11's "the portrait is not dimmed" pass on a build that dims it. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** THE TWO PRE-REVEAL SENTENCES, longhand. Written out rather than imported from the engine so the
 *  WORDS are pinned here too: a change to either has to be deliberate. */
const NEAR = 'Her progress – I will know in the off-season.'
const FAR = 'Her progress – too soon, ask next off-season.'

/** `--accent`, the app's yellow (src/style.css `:root`). Longhand for the same reason. */
const ACCENT: [number, number, number] = [207, 225, 82]
const ACCENT_HEX = '#cfe152'

/** The border colour an element actually paints, as [r, g, b]. */
function borderRgb(el: HTMLElement): [number, number, number] {
  const style = getComputedStyle(el)
  const [r, g, b] = parseColor(style.borderColor || style.borderTopColor)
  return [r, g, b]
}

/** ⚠ AN UNSET `opacity` COMPUTES TO `''` IN HAPPY-DOM, and an unset opacity IS 1 - the same reading
 *  `px()` in coach-edge-card.test.ts takes of an unset margin. Returning a NUMBER rather than the
 *  string keeps "not dimmed" one assertion instead of two, and a junk value still throws rather than
 *  becoming a silent NaN that compares equal to nothing. */
function opacityOf(el: HTMLElement): number {
  const raw = getComputedStyle(el).opacity
  if (raw === '') return 1
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) throw new Error(`opacity computed to ${JSON.stringify(raw)}`)
  return n
}

/** A real career at a real rung, ticked through the real engine. Nothing here fakes a gate. */
function career(coachTier: CoachTier, weeks: number, seed = `r21-${coachTier}`) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return { world, rng }
}

async function mountCoaches(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  // A hired career lands on the Coaches tab by itself (round-18 #3); press it anyway so no test
  // silently depends on that rule.
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

const plaqueOf = async (snapshot: Snapshot): Promise<string> => {
  const wrapper = await mountCoaches(snapshot)
  const text = wrapper.find('.cm-row.current .cm-plaque').text()
  wrapper.unmount()
  return text
}

// =================================================================================================
// 7a / 7b – THE VERDICT COMES IN THE OFF-SEASON, AND NOTHING IS COUNTED
// =================================================================================================
describe('#7a/#7b the pre-reveal plaque', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('names the off-season on the rendered card, with the real career behind it', async () => {
    // ⚠ THE REAL DATA, INTERPOLATED. No field is written by hand: the sentence on screen is the one
    // `coachEdgeView` composed for a career four weeks old, and the assertion is against both the
    // string and the snapshot that produced it - so a component printing a constant would pass the
    // first check and fail the second.
    const { world } = career('middle', 4)
    const snapshot = toSnapshot(world)
    expect(snapshot.coachEdge.revealed, 'four weeks is not a season').toBe(false)

    const wrapper = await mountCoaches(snapshot)
    const row = wrapper.find('.cm-row.current')
    expect(row.exists(), 'exactly one card is hers').toBe(true)
    const plaque = row.find('.cm-plaque').text()

    expect(plaque).toBe(NEAR)
    expect(plaque).toBe(snapshot.coachEdge.plaqueLine)
    // #7a: the verdict has a place in the year, and the card says which.
    expect(plaque, 'the sentence names the off-season').toContain('off-season')
    expect(plaque, 'and no longer opens with the line he photographed').not.toContain('Too early to tell')
    wrapper.unmount()
  })

  it('counts no weeks – the "of 52" framing is gone from the card entirely', async () => {
    // #7b. Asserted on the WHOLE plaque rather than on the substring "of 52", so the bar cannot come
    // back wearing a different number ("of 49", "week 12 of the season", a bare countdown).
    const { world } = career('middle', 4)
    const snapshot = toSnapshot(world)
    const wrapper = await mountCoaches(snapshot)
    const plaque = wrapper.find('.cm-row.current .cm-plaque').text()

    expect(plaque, 'no numeral of any kind survives').not.toMatch(/\d/)
    expect(plaque).not.toContain('of 52')
    // ...and the clock the old sentence printed is still on the snapshot - the card simply does not
    // quote it, which is what makes this a copy claim and not an accident of an empty field.
    expect(snapshot.coachEdge.weeksTogether).toBe(4)
    expect(plaque).not.toContain('4')
    wrapper.unmount()
  })
})

// =================================================================================================
// 7c – THE WINDOW DEPENDS ON WHEN HE WAS HIRED
// =================================================================================================
describe('#7c the bar moves with the hire', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** THE SECOND-HALF HIRE, through the real commands. Week 182 is season 3 offset 26 – the first
   *  week of the second half – so this season is not his and the bar is a year further down. */
  function secondHalfHire() {
    const { world, rng } = career('middle', 182, 'r21-far')
    const him = world.coachId!
    hireCoach(world, null)
    hireCoach(world, him)
    return { world, rng, him }
  }

  it('a coach hired in the second half gets the far arm, and a season-opening one the near arm', async () => {
    const first = toSnapshot(career('middle', 4).world)
    expect(await plaqueOf(first), 'hired at the top of a season').toBe(NEAR)

    const { world } = secondHalfHire()
    const late = toSnapshot(world)
    expect(late.coachEdge.weeksTogether, 'a fresh partnership').toBe(0)
    expect(await plaqueOf(late), 'hired in the second half').toBe(FAR)
    // The two arms are the same question with the bar in a different place, which is the whole of
    // his ask: one card in two states, not two different cards.
    expect(NEAR.split('–')[0]).toBe(FAR.split('–')[0])
  })

  it('and the card moves itself to the near arm when the new season opens', async () => {
    // «сдвигать эту планку дальше по году» – the sentence follows the calendar rather than being
    // fixed at the hire. Same career, same coach, one season later.
    const { world, rng } = secondHalfHire()
    expect(await plaqueOf(toSnapshot(world))).toBe(FAR)

    // Into season 4, where his verdict actually lands.
    while (world.week < 4 * WEEKS_PER_YEAR) tickWeek(world, rng)
    const next = toSnapshot(world)
    expect(next.coachEdge.revealed, 'still nothing to say').toBe(false)
    expect(await plaqueOf(next), 'the bar is now this season').toBe(NEAR)
  })

  it('and the verdict really does land in an off-season, which is what the copy promises', async () => {
    // ⚠ THE COPY MAY ONLY PROMISE WHAT THE ENGINE PAYS. A card that said "we will know in the
    // off-season" while the gate fired mid-season would be exactly the lie this screen is written
    // against, so the promise is tested against the calendar and against the rendered card.
    const { world, rng } = secondHalfHire()
    const revealWeek = toSnapshot(world).coachEdge.revealWeek
    expect(revealWeek).toBe(coachRevealWeek(182))
    expect(revealWeek).toBe(4 * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS))
    expect(isOffSeasonWeek(revealWeek), 'the bar is an off-season week').toBe(true)

    while (world.week < revealWeek - 1) tickWeek(world, rng)
    expect(await plaqueOf(toSnapshot(world)), 'the week before, still the near arm').toBe(NEAR)

    tickWeek(world, rng)
    expect(world.week).toBe(revealWeek)
    const shown = toSnapshot(world)
    expect(shown.coachEdge.revealed, 'the off-season arrives and so does the verdict').toBe(true)
    const plaque = await plaqueOf(shown)
    expect(plaque).toBe(shown.coachEdge.plaqueLine)
    // ⚠ THE SHAPE, NOT THE OLD WORDS (re-aimed 20.08). This arm's claim is that the REVEAL has landed
    // – the sentence now names a placement instead of promising one – and it used to test that by
    // matching the old "…of that band." tail. The wording was rewritten because the owner could not
    // read it, so the tail is now the price; the claim is unchanged and still fails if the card is
    // still saying "we will know in the off-season".
    expect(plaque, 'a placement, at last').toMatch(/ I had hoped for\.$|the pace I expected\.$/)
    expect(plaque, 'the card is still promising rather than telling').not.toMatch(/off-season/)
    expect(plaque).not.toBe(NEAR)
    expect(plaque).not.toBe(FAR)
  })
})

// =================================================================================================
// 11 – THE CHOSEN COACH LOOKS CHOSEN
// =================================================================================================
describe('#11 the coach she has', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** An Elite career four weeks in: her own coach is $485.95/wk against $439.73 of weekly income, so
   *  the row is BOTH `current` and unaffordable – the exact state the owner photographed, and the
   *  only state in which #11 has anything to say. */
  async function unaffordableCurrent() {
    assertSheetPresent()
    const { world } = career('elite', 4)
    const snapshot = toSnapshot(world)
    const mine = snapshot.coachMarket.find((r) => r.current)!
    expect(mine.overBudgetCents, 'the fixture really is over budget').toBeGreaterThan(0)
    const wrapper = await mountCoaches(snapshot, true)
    return { wrapper, snapshot, mine }
  }

  it('is never drawn as a refusal, however little the family earns', async () => {
    const { wrapper, snapshot } = await unaffordableCurrent()
    const row = wrapper.find('.cm-row.current')
    expect(row.classes(), 'the frame is on').toContain('current')
    expect(row.classes(), 'and the refusal treatment is not').not.toContain('blocked')

    // THE CONTROL: other rows on the same list ARE over budget and ARE blocked, so this is a
    // statement about the CURRENT row and not about a class that has stopped being applied at all.
    const others = wrapper.findAll('.cm-row').filter((r) => !r.classes().includes('current'))
    const blocked = others.filter((r) => r.classes().includes('blocked'))
    expect(blocked.length, 'the list still refuses what she cannot afford').toBeGreaterThan(0)
    expect(snapshot.coachMarket.filter((r) => !r.current && r.overBudgetCents > 0).length).toBe(blocked.length)
    wrapper.unmount()
  })

  it('carries the accent frame, read through the real cascade', async () => {
    const { wrapper } = await unaffordableCurrent()
    const row = wrapper.find('.cm-row.current').element as HTMLElement
    const style = getComputedStyle(row)
    expect(borderRgb(row), `the frame is the accent, not ${style.borderColor}`).toEqual(ACCENT)
    expect(style.borderStyle === '' || style.borderStyle === 'solid', 'and it is solid, not dashed').toBe(true)
    // The ring is what makes a 1px border read as a frame; it is a box-shadow rather than a second
    // pixel of border so the row's padding box - and the 12px portrait clearance measured off it in
    // coach-edge-card.test.ts §4 - does not move.
    expect(style.boxShadow, 'and it is ringed').toContain(ACCENT_HEX)
    expect(style.boxShadow, 'outside the border box, so no layout moves').toMatch(/^0(px)? 0(px)? 0(px)? 1px /)
    wrapper.unmount()
  })

  it('keeps his portrait lit while every unaffordable stranger is dimmed', async () => {
    const { wrapper } = await unaffordableCurrent()
    const art = (row: Element) => opacityOf(row.querySelector('.cm-art') as HTMLElement)

    const mine = wrapper.find('.cm-row.current').element
    expect(art(mine), 'her own coach is at full opacity').toBe(1)
    // ...and so is his name and his price - the dim was three rules, not one.
    expect(opacityOf(wrapper.find('.cm-row.current').element as HTMLElement)).toBe(1)

    // THE CONTROL AGAIN, and this one is what makes the assertion above mean something: the dimming
    // rule is live in this document and is dimming somebody. Without it "her coach is at opacity 1"
    // would pass just as well on a sheet that had stopped dimming anybody at all.
    const strangers = wrapper
      .findAll('.cm-row')
      .filter((r) => !r.classes().includes('current') && r.classes().includes('blocked'))
    expect(strangers.length, 'somebody on this list is out of reach').toBeGreaterThan(0)
    for (const r of strangers) expect(art(r.element), 'an unaffordable stranger is dimmed').toBeLessThan(1)
    // ...and her own coach is never in that set, whatever the family earns.
    expect(wrapper.findAll('.cm-row.current.blocked').length, 'her coach is not drawn as a refusal').toBe(0)
    wrapper.unmount()
  })

  it('and the sheet itself refuses to un-frame him if the class ever comes back', async () => {
    // ⚠ THE SECOND LOCK, TESTED ALONE. The template no longer puts `blocked` on a current row - but
    // a future edit could, and the failure would be silent. `.cm-row.current.blocked` is four
    // classes against three, so it wins in either source order; this drives the cascade directly
    // because the component (correctly) can no longer produce the combination.
    assertSheetPresent()
    const node = document.createElement('div')
    node.className = 'cm-row current blocked'
    node.innerHTML = '<span class="cm-art"></span><span class="cm-name">x</span>'
    document.body.appendChild(node)
    try {
      expect(borderRgb(node)).toEqual(ACCENT)
      expect(getComputedStyle(node).borderStyle).toBe('solid')
      expect(opacityOf(node.querySelector('.cm-art') as HTMLElement)).toBe(1)
    } finally {
      node.remove()
    }
  })
})

// =================================================================================================
// 12 – THE AFFORDABILITY GATE READS ALL OF THE WEEK'S INCOME
// =================================================================================================
describe('#12 what the gate reads', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** His own situation: a real career with a million banked. */
  function millionaire() {
    const { world } = career('elite', 120, 'r21-rich')
    world.fundsCents = 1_000_000_00
    return world
  }

  it('sums the parents\' contribution and the interest the balance earns', () => {
    // ⚠ READ OUT OF REAL STATE, not restated from a constant: the world is built and ticked, the
    // funds are set, and the two components are recomputed here from the SAME inputs the engine had.
    const world = millionaire()
    const snapshot = toSnapshot(world)
    const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
    const interest = Math.round(world.fundsCents * ECONOMY.savings.apyWeekly)

    expect(interest, 'the owner\'s «%» is real money at a million').toBe(600_00)
    expect(interest, 'and it is larger than the parents\' own contribution').toBeGreaterThan(parents)
    // No kit deal is running on this career, so those are the two streams.
    expect(snapshot.coachBilling.weeklyIncomeCents).toBe(parents + interest)
  })

  it('so a millionaire is refused no elite coach – and a broke family still is', () => {
    const world = millionaire()
    const rich = toSnapshot(world)
    const elite = rich.coachMarket.filter((r) => r.tier === 'elite')
    expect(elite.length, 'there are elite coaches to check').toBeGreaterThan(0)
    for (const r of elite) {
      expect(r.overBudgetCents, `${r.name} at ${formatCents(r.weeklyCents)} fits the week`).toBe(0)
      expect(r.lockedPoints, 'and the ranking gate is off, as shipped').toBeNull()
    }

    // ⚠ THE OTHER DIRECTION, ON THE SAME CAREER: empty the account and the interest goes with it, so
    // the same coaches go back over budget by exactly the parents' shortfall. This is what makes the
    // test above a measurement of the INTEREST rather than of a threshold that was simply widened.
    const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
    world.fundsCents = 0
    const broke = toSnapshot(world)
    expect(broke.coachBilling.weeklyIncomeCents).toBe(parents)
    const over = broke.coachMarket.filter((r) => r.tier === 'elite' && r.overBudgetCents > 0)
    expect(over.length, 'with nothing banked the elite rung is out of reach again').toBeGreaterThan(0)
    for (const r of over) expect(r.overBudgetCents).toBe(r.weeklyCents - parents)
  })

  it('and the budget meter draws that cap rather than reverse-engineering one', async () => {
    // ⚠ THE METER USED TO RECOVER THE CAP FROM AN OVER-BUDGET ROW, which returns nothing when no row
    // is over - and fixing the income made HIS case exactly that case. Without the carried figure
    // the screen would have gone from a wrong cap to "$0.00 weekly cap" with a full bar beside it.
    const world = millionaire()
    const snapshot = toSnapshot(world)
    expect(snapshot.coachMarket.every((r) => r.overBudgetCents === 0), 'nothing is over budget here').toBe(true)

    const wrapper = await mountCoaches(snapshot)
    const legend = wrapper.find('.budget-legend').text()
    expect(legend).toContain(`${formatCents(snapshot.coachBilling.weeklyIncomeCents)} weekly cap`)
    expect(legend, 'and it is not a zero').not.toContain('$0.00 weekly cap')

    const free = wrapper.find('.budget-free').text()
    const committed = snapshot.coachMarket.find((r) => r.current)!.weeklyCents
    expect(free).toContain(formatCents(snapshot.coachBilling.weeklyIncomeCents - committed))

    // ...and no card on the screen tells him he is over budget any more.
    expect(wrapper.findAll('.cm-action.is-over').length).toBe(0)
    wrapper.unmount()
  })
})
