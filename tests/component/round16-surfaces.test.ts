// ROUND 16 - the four surfaces this wave changed, MOUNTED.
//
//   #3  the professional table shows 0 while the results under it show 6   (StatsScreen)
//   #15 the Bills page quotes the retainer and never the rehab rate        (MoneyScreen)
//   #7  the pro-entry allowance appears only once it has run out           (SeasonScreen)
//   #1  the inbox is a popup over the diary page rather than a screen      (InboxSheet)
//
// ⚠ WHY MOUNTED AND NOT PINNED. Every one of the four is a SURFACING defect: in #3 and #15 the
// engine has been right the whole time and the screen did not say so, which is precisely the class
// of bug an engine-side assertion cannot fail on - it is how all four shipped. CLAUDE.md: "Prefer a
// mounted test to a source pin."
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   * `computeLadderView`'s `points === 0 && banked > 0` changed to `false` (i.e. `banked` never
//     set) -> "the table says why it is showing nothing" goes red on the missing sentence.
//   * the same guard changed to a bare `{ banked }` -> "and it is silent once she is on the list"
//     goes red: the note appears beside a real total, which is the opposite claim.
//   * `physioRehabLabel` pointed back at `retainerPerWeekCents` -> "an injured week's real rate is
//     on the Bills page" goes red, because the two bands' top ends differ ($70 vs $120 before the
//     corridor).
//   * `showsProEntries` changed to `() => false` -> the W-card chip test goes red.
//   * `isCappedProTier` swapped for `() => true` -> "and never on a junior card" goes red.
//   * `TakeoverShell` swapped back for the `.dialog-overlay` wrapper -> the inbox test goes red on
//     `.tournament-flow`.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The Season screen's sandbox and the inbox both reach for cues on mount; audio has no business here.
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, KID_ID, isCappedProTier, seasonStartWeek, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { RANKABLE_MIN } from '../../src/engine/season/ranking'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

function mountWith<T>(component: T, snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(component as never, { global: { stubs: { teleport: true } } })
}

async function showTrack(wrapper: ReturnType<typeof mount>, label: string): Promise<void> {
  const button = wrapper.findAll('button').find((b) => b.text().trim() === label)
  expect(button, `the ${label} pill must exist`).toBeTruthy()
  await button!.trigger('click')
}

/** A career carrying `count` scoring W-track results, `points` each. Written through the ledger the
 *  engine folds rather than onto the snapshot, so `rankableTotal` is the thing under test and not a
 *  hand-set number. */
function worldWithProResults(count: number, points: number): WorldState {
  const world = createWorld('round16-pro', DEFAULT_PROFILE)
  world.week = 120
  for (let i = 0; i < count; i++) {
    world.results.push({ playerId: KID_ID, week: world.week - 10 - i, points, tier: 'w35' })
  }
  return world
}

beforeEach(() => {
  setActivePinia(createPinia())
})

// =================================================================================================
// #3 - THE PROFESSIONAL TABLE'S ZERO
// =================================================================================================
//
// The owner: «the professional table shows 0 points after the second match while the result row shows
// 6, and the third match onward counts correctly», filed as a rank/points cache refreshing one event
// late. It is not a cache. `rankableTotal` implements WTA §VIII.A.2.b - a professional appears on the
// rankings only after three scoring tournaments OR ten points - so two results worth six read as zero
// beside a counting-results list showing both of them. Reproduced against the owner's own save in
// tools/round16-read.ts: his first professional result in the window paid 8 and the table showed 0;
// the second took him past ten and the table showed 16.

describe('R16-3 - the professional table says why it is showing nothing', () => {
  it('reproduces the report: two results, six points, a table reading zero', () => {
    const snap = toSnapshot(worldWithProResults(2, 3))
    expect(snap.ladders.wta.points, 'the table itself').toBe(0)
    expect(snap.ladders.wta.countingResults.length, 'the rows under it').toBe(2)
    // ...and the two disagree by exactly what the minimum is withholding.
    expect(snap.ladders.wta.banked).toBe(6)
  })

  it('the screen prints the rule, the number, and that the results still count', async () => {
    const wrapper = mountWith(StatsScreen, toSnapshot(worldWithProResults(2, 3)))
    await showTrack(wrapper, 'Professional')
    const text = wrapper.text()
    expect(text).toContain('6 pts banked')
    expect(text).toContain(`${RANKABLE_MIN.tournaments} events with points`)
    expect(text).toContain(`${RANKABLE_MIN.points} points`)
    // The half a parent actually needs: the week was not wasted.
    expect(text).toContain('still counts')
  })

  it('...and it is silent the moment she is on the list', async () => {
    // A third scoring event clears §VIII.A.2.b's first arm.
    const snap = toSnapshot(worldWithProResults(3, 3))
    expect(snap.ladders.wta.points, 'now a real total').toBe(9)
    expect(snap.ladders.wta.banked, 'nothing is being withheld').toBeUndefined()
    const wrapper = mountWith(StatsScreen, snap)
    await showTrack(wrapper, 'Professional')
    expect(wrapper.text()).not.toContain('banked')
  })

  it('⚠ and it can never fire on a junior or national table - the rule is the WTA\'s alone', () => {
    const world = createWorld('round16-junior', DEFAULT_PROFILE)
    world.week = 120
    // Two J30 results worth three points each: the same shape that reads zero one table up.
    world.results.push({ playerId: KID_ID, week: 112, points: 3, tier: 'j30' })
    world.results.push({ playerId: KID_ID, week: 110, points: 3, tier: 'j30' })
    const snap = toSnapshot(world)
    expect(snap.ladders.itf.points, 'the junior table has no minimum').toBe(6)
    expect(snap.ladders.itf.banked).toBeUndefined()
    expect(snap.ladders.domestic.banked).toBeUndefined()
  })
})

// =================================================================================================
// #15 - WHAT AN INJURED WEEK COSTS
// =================================================================================================
//
// `resolvePhysio` bills `rehabPerWeekCents` on every week `world.injury !== null`, BEFORE it consults
// the retainer toggle at all; the retainer rate is billed only on a healthy week while the toggle is
// on. The Bills page quoted the retainer and nothing else, so a family with the toggle OFF read the
// physio line as nothing at all on a week that was charging them more than the toggle ever would.

describe('R16-15 - the Bills page quotes the rate an injured week actually pays', () => {
  async function mountBills(snap: Snapshot) {
    const wrapper = mountWith(MoneyScreen, snap)
    const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
    expect(bills, 'the Bills tab control').toBeTruthy()
    await bills!.trigger('click')
    expect(wrapper.text(), 'the Bills tab is really the one showing').toContain('Her kit')
    return wrapper
  }

  /** The band as the screen renders it, corridor-scaled to the family's means. */
  function band(rates: readonly [number, number], background: 'working' | 'middle' | 'wealthy'): string {
    const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[background]
    return `$${Math.round((rates[0] * cLo) / 100)}-${Math.round((rates[1] * cHi) / 100)}/wk`
  }

  it('a fit week shows both rates, and says which one is which', async () => {
    const world = createWorld('round16-bills', DEFAULT_PROFILE)
    const snap = toSnapshot(world)
    const wrapper = await mountBills(snap)
    const text = wrapper.text()
    expect(text).toContain(band(ECONOMY.physio.retainerPerWeekCents, snap.profile.background))
    expect(text, 'the rehab rate is the one that was missing').toContain(
      band(ECONOMY.physio.rehabPerWeekCents, snap.profile.background),
    )
    expect(text).toContain('An injured week bills rehab instead')
    // ⚠ AND THE SENTENCE THAT MAKES IT ACTIONABLE: it is charged whatever the toggle says.
    expect(text).toContain('with or without the retainer')
  })

  it('...and on the week she is actually hurt it says so in the present tense', async () => {
    const world = createWorld('round16-bills-hurt', DEFAULT_PROFILE)
    world.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 4, totalWeeks: 4, sinceWeek: world.week }
    const snap = toSnapshot(world)
    const wrapper = await mountBills(snap)
    expect(wrapper.text()).toContain('She is hurt, so this week bills rehab')
    expect(wrapper.text()).toContain(band(ECONOMY.physio.rehabPerWeekCents, snap.profile.background))
  })

  it('⚠ the two bands really are different, so quoting one for the other was a real understatement', () => {
    expect(ECONOMY.physio.rehabPerWeekCents[1]).toBeGreaterThan(ECONOMY.physio.retainerPerWeekCents[1])
  })
})

// =================================================================================================
// #7 - THE PRO ALLOWANCE, ON EVERY W CARD
// =================================================================================================

describe('R16-7 - the pro-entry allowance rides on the W cards, not only the spent one', () => {
  /** ⚠ THE v46 GOLDEN SAVE, not a hand-built feed. It is a real sixteen-year-old career mid-season -
   *  `proEntryCap` is the engine's own {used 5, limit 12} and the eight-week horizon holds W and
   *  junior rungs side by side, which is exactly the mix the claim is about. A synthetic `upcoming`
   *  would have gone straight past the feed's own two-type rule and proved nothing about the cards a
   *  player actually sees. */
  function feedSnapshot(): Snapshot {
    const world = migrateSave(
      JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
    ) as WorldState
    return toSnapshot(world)
  }

  /** Every drawn card, paired with the tier its heading names. `TIERS[t].label` is what the card
   *  prints, so the mapping is the catalogue's rather than this file's. */
  function drawnCards(wrapper: ReturnType<typeof mount>) {
    const byLabel = new Map(TIER_LADDER.map((t) => [TIERS[t].label, t]))
    return wrapper.findAll('.event-card').map((c) => ({
      tier: byLabel.get(c.find('.event-tier').text().trim()),
      hasChip: c.find('.pro-entries').exists(),
      text: c.text(),
    }))
  }

  it('every professional card on screen carries the counter, and no junior one does', () => {
    const snap = feedSnapshot()
    const wrapper = mountWith(SeasonScreen, snap)
    const cards = drawnCards(wrapper)
    expect(cards.length, 'the feed must draw cards').toBeGreaterThan(0)
    expect(cards.every((c) => c.tier !== undefined), 'every card names a tier this test can read').toBe(true)
    const pro = cards.filter((c) => isCappedProTier(c.tier!))
    const junior = cards.filter((c) => !isCappedProTier(c.tier!))
    expect(pro.length, 'the fixture must draw at least one professional card').toBeGreaterThan(0)
    expect(junior.length, '...and at least one that is not').toBeGreaterThan(0)
    for (const c of pro) expect(c.hasChip, `${c.tier} card has no allowance chip`).toBe(true)
    for (const c of junior) expect(c.hasChip, `${c.tier} card should not carry it`).toBe(false)
    // ⚠ RE-AIMED, round-17 #2, AND THE FIXTURE IS THE REPRODUCTION. This line used to read
    // `pro entries ${snap.proEntryCap.used} / ${snap.proEntryCap.limit}` – the SNAPSHOT-wide figure –
    // and it passed while being wrong on every card it checked. MEASURED on this very fixture: the
    // v46 save sits at week 155, the LAST week of its season (seasonStart 104), and its whole
    // eight-week horizon (w156..w163) belongs to the NEXT season block (seasonStart 156). The
    // snapshot-wide cap there is `{used 5, limit 12}` and every card's own cap is `{used 1,
    // limit 12}` – so the chip overstated her spent allowance by four on every professional card in
    // the feed, at exactly the moment a player is planning the new season. That is the owner's
    // "pro entries 16/16 carries over into the new season", already frozen in a shipped fixture.
    //
    // The claim is now the CARD's own figure, which is what makes it a real check rather than a
    // tautology against the number the screen happened to be printing.
    for (const c of pro) {
      const event = snap.upcoming.find((e) => e.tier === c.tier && e.proEntryCap !== undefined)!
      expect(c.text, `${c.tier} card must print its OWN season's allowance`).toContain(
        `pro entries ${event.proEntryCap!.used} / ${event.proEntryCap!.limit}`,
      )
    }
  })

  // ⭐ ROUND-17 #2 – THE ALLOWANCE DOES NOT CARRY OVER, and this is the whole of the claim.
  it('⭐ a card in the NEXT season prints the next season\'s allowance, not this season\'s', () => {
    const snap = feedSnapshot()
    // The fixture's own shape, asserted so the test cannot go vacuous if a future fixture moves:
    // she is in the last week of a season and everything ahead of her is in the following one.
    const proCards = snap.upcoming.filter((e) => e.proEntryCap !== undefined)
    expect(proCards.length, 'the fixture must hold professional cards').toBeGreaterThan(0)
    const crossing = proCards.filter((e) => seasonStartWeek(e.week) !== seasonStartWeek(snap.week))
    expect(crossing.length, 'the fixture must cross the year boundary – that is the case').toBeGreaterThan(0)

    // THE BUG: the old chip showed this on every one of them.
    expect(snap.proEntryCap.used, 'this season is well spent').toBe(5)
    // THE FIX: each card is judged against the season the EVENT is in, where almost nothing is spent.
    for (const e of crossing) {
      expect(e.proEntryCap!.used, `w${e.week} must read the next season's ledger`).toBeLessThan(
        snap.proEntryCap.used,
      )
    }
    // ...and it is on screen, not merely on the wire.
    const wrapper = mountWith(SeasonScreen, snap)
    expect(wrapper.text(), 'the stale count must be gone from the feed').not.toContain(
      `pro entries ${snap.proEntryCap.used} / ${snap.proEntryCap.limit}`,
    )
    expect(wrapper.findAll('.pro-entries').length).toBeGreaterThan(0)
  })

  it('⚠ and it goes silent at eighteen, where the tour stops counting', () => {
    const snap = feedSnapshot()
    // ⚠ RE-AIMED with the chip's source, round-17 #2: the number is per-CARD now, so blanking the
    // snapshot-wide field would no longer silence anything. `proPerYearByAge` is unlimited from 18
    // and the protocol spells that MAX_SAFE_INTEGER, on whichever cap the chip reads.
    const unlimited = { used: 20, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER }
    snap.proEntryCap = unlimited
    for (const e of snap.upcoming) if (e.proEntryCap) e.proEntryCap = { ...unlimited }
    const wrapper = mountWith(SeasonScreen, snap)
    expect(wrapper.findAll('.pro-entries').length).toBe(0)
    expect(wrapper.text()).not.toContain('pro entries')
  })

  it('the rungs the chip claims are exactly the ones the tour caps', () => {
    // Not a screen claim: the guard that "every W card" stays a property of the tier catalogue rather
    // than a list somebody has to remember to extend.
    for (const tier of ECONOMY.entryCap.cappedProTiers) {
      expect(TIERS[tier].track, `${tier} is capped but is not professional`).toBe('wta')
    }
  })
})

// =================================================================================================
// #1 - THE INBOX IS A SCREEN
// =================================================================================================

describe('R16-1 - the inbox covers the screen instead of floating over the diary', () => {
  it('renders through the app\'s one takeover shell, with a header and no backdrop', () => {
    const world = createWorld('round16-inbox', DEFAULT_PROFILE)
    const wrapper = mountWith(InboxSheet, toSnapshot(world))
    // `.tournament-flow` is the takeover vocabulary in src/style.css: `position: fixed; inset: 0`.
    expect(wrapper.find('.tournament-flow').exists(), 'the inbox must be a takeover').toBe(true)
    expect(wrapper.find('.tf-top').exists(), 'a header that does not scroll').toBe(true)
    expect(wrapper.find('.tf-body').exists(), 'a body that does').toBe(true)
    expect(wrapper.find('.tf-title').text()).toBe('Inbox')
    // The popup shell is gone with the popup.
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(wrapper.find('.guide-card').exists()).toBe(false)
  })

  it('...and the close control is still the way out', async () => {
    const world = createWorld('round16-inbox-close', DEFAULT_PROFILE)
    const wrapper = mountWith(InboxSheet, toSnapshot(world))
    const close = wrapper.findAll('button').find((b) => (b.attributes('aria-label') ?? '') === 'Close')
    expect(close, 'the header must carry a close').toBeTruthy()
    await close!.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
