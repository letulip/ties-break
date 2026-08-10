// ROUND 14, GROUP C – the owner's items 1, 2 and 9 of 06.08, each proved by a MOUNT.
//
// Same discipline as tests/component/season-screen.test.ts: a real world through the real protocol,
// pushed into a real Pinia store, and the assertion is on what the component RENDERS and what
// clicking it does. Every test in here was mutation-verified – the behaviour was broken, the test
// watched go red, and the behaviour restored.
//
// ⚠ NO WORKER IS SPAWNED. `src/worker/client.ts` creates one lazily, so a pre-filled store touches
// nothing; the store's own command methods are stubbed where a test needs to see one dispatched.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, bookVacation } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { vacationPackage } from '../../src/engine/economy'
import { letterDeletable } from '../../src/composables/inboxMail'
import { enterActionName } from '../../src/composables/eventName'
import { weekRange } from '../../src/shared/dates'
import type { Offer, Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND ITEM 2 IS ABOUT localStorage. The same shim
// tests/component/home-strip-and-mail.test.ts and round20-ui.test.ts already carry, for the same
// reason, quoted in full in the first of them: happy-dom is configured here without web storage,
// every reader in src/ wraps it in try/catch and answers "claim nothing" when it throws, and that
// correct production fallback makes a per-career annotation UNTESTABLE by accident - nothing is
// ever stored, so nothing can ever be read back. The test supplies the browser's own object rather
// than weakening the code to suit the runner.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** A real career, walked `weeks` weeks. */
function worldAfter(weeks: number, seed = 'r14-group-c') {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

/** A career with a family week booked inside SeasonScreen's 8-week feed, plus the week it went on.
 *  The week is FOUND by asking the engine rather than assumed: `assertPlannable` refuses exam weeks,
 *  entered weeks and weeks already carrying a plan, and which of those a given seed lands on is not
 *  this test's business. */
function careerWithVacation(packageId = 'seaside'): { snapshot: Snapshot; week: number } {
  const world = worldAfter(20)
  world.fundsCents = 500_000_00 // the trip must be affordable; the price itself is not under test
  for (let w = world.week + 1; w <= world.week + 8; w++) {
    try {
      bookVacation(world, w, packageId)
      return { snapshot: toSnapshot(world), week: w }
    } catch {
      // that week refuses a trip – try the next one
    }
  }
  throw new Error('no bookable week in the feed horizon')
}

/** ⚠ `import.meta.url` IS NOT A FILE URL IN THIS PROJECT. The `component` project runs under
 *  happy-dom, where it resolves to an http scheme and `new URL(..., import.meta.url)` throws
 *  "The URL must be of scheme file" at COLLECT time - i.e. the whole file reports "no tests" rather
 *  than one red assertion. Vitest's cwd is the repo root, so that is what these resolve against; the
 *  length bounds at every call site are what would catch it if that stopped being true. */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

function mountSeason(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(SeasonScreen, { global: { stubs: { teleport: true } } })
}

// ===========================================================================
// ITEM 1 – a booked vacation can be cancelled, from where booking lives.
//
// The 29.07 ruling put NO control on the painted card ("a booked week is a statement, not a
// control, and cancelling lives where booking does – tap the card and the planner opens"). The
// planner never grew the cancel, and every package has art, so every booking was uncancellable.
// The routing is KEPT and the missing half is built; these tests are that half.
// ===========================================================================
describe('R14-1 – the booked family week is cancellable through the planner', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture really books a trip inside the feed, so nothing below is vacuous', () => {
    const { snapshot, week } = careerWithVacation()
    expect(snapshot.vacations.map((v) => v.week)).toContain(week)
    expect(week).toBeGreaterThan(snapshot.week)
    expect(week).toBeLessThanOrEqual(snapshot.week + 8)
  })

  it('the painted card carries no button of its own – the 29.07 routing is unchanged', () => {
    const { snapshot } = careerWithVacation()
    const wrapper = mountSeason(snapshot)
    const card = wrapper.find('.week-card.vacation')
    expect(card.exists()).toBe(true)
    expect(card.findAll('button')).toHaveLength(0)
    wrapper.unmount()
  })

  it('tapping the card opens the planner ON THE BOOKING, not on a tab whose buttons would throw', async () => {
    // The dead control this replaces: the sheet used to open on Practice for a booked week, and
    // every Book there could only throw assertPlannable's "That week is already a family vacation".
    const { snapshot } = careerWithVacation()
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const sheet = wrapper.findComponent(PlanWeekSheet)
    expect(sheet.exists()).toBe(true)
    expect(sheet.text()).toContain('Cancel the trip')
    // the tab strip stands down with the two panes it switches between
    expect(sheet.find('.plan-tabs').exists()).toBe(false)
    expect(sheet.text()).not.toContain('Court rental')
    wrapper.unmount()
  })

  it('the sheet names the package and the money, so the refund is stated before the press', async () => {
    const { snapshot } = careerWithVacation()
    const label = vacationPackage('seaside')!.label
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const text = wrapper.findComponent(PlanWeekSheet).text()
    expect(text).toContain(label)
    expect(text).toContain('comes back in full')
    wrapper.unmount()
  })

  it('Cancel the trip raises the SAME confirm the fallback row raises, and only then dispatches', async () => {
    const { snapshot, week } = careerWithVacation()
    const store = useGameStore()
    const cancel = vi.spyOn(store, 'cancelVacation').mockResolvedValue(undefined)
    const wrapper = mountSeason(snapshot)
    await wrapper.find('.week-card.vacation').trigger('click')

    const sheetButtons = wrapper.findComponent(PlanWeekSheet).findAll('button')
    const cancelButton = sheetButtons.find((b) => b.text() === 'Cancel the trip')!
    expect(cancelButton).toBeTruthy()
    await cancelButton.trigger('click')

    // ⚠ NOTHING IS SPENT OR REFUNDED ON THE FIRST PRESS. Money always gets a confirm here.
    expect(cancel).not.toHaveBeenCalled()
    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain(vacationPackage('seaside')!.label)
    expect(dialog.text()).toContain('comes back in full')
    // ...and the sheet has stood down, so the confirm is the only thing being decided
    expect(wrapper.findComponent(PlanWeekSheet).exists()).toBe(false)

    const confirm = dialog.findAll('button').find((b) => b.text() === 'Cancel the trip')!
    await confirm.trigger('click')
    expect(cancel).toHaveBeenCalledWith(week)
    wrapper.unmount()
  })

  it('an UNBOOKED week still opens the two-tab planner – the booked pane is not the new default', async () => {
    // The other half of the pair above: no single mutation can satisfy both.
    const world = worldAfter(20)
    const snapshot = toSnapshot(world)
    const wrapper = mountSeason(snapshot)
    const plan = wrapper.findAll('button').find((b) => b.text() === '+ Plan week')
    expect(plan).toBeTruthy()
    await plan!.trigger('click')

    const sheet = wrapper.findComponent(PlanWeekSheet)
    expect(sheet.find('.plan-tabs').exists()).toBe(true)
    expect(sheet.text()).not.toContain('Cancel the trip')
    wrapper.unmount()
  })
})

// ===========================================================================
// ITEM 9 – onboarding is width-capped on desktop, like every other screen.
//
// It never was, and the reason is structural: the cap lives on `#app`, and the wizard is a
// `position: fixed` takeover pinned to the viewport, so it is the ONE screen outside that frame.
// The fix reuses `#app`'s own declaration through a token rather than inventing a second cap –
// which is why the pin below reads BOTH call sites and asserts they are the same one.
// ===========================================================================
describe('R14-9 – the onboarding wizard wears the app frame', () => {
  beforeEach(() => setActivePinia(createPinia()))

  const wizardSrc = repoFile('src/components/OnboardingWizard.vue')
  const sheet = repoFile('src/style.css')

  it('the shell the cap is written for is the element the wizard actually renders', () => {
    // The mounted half. Scoped SFC styles are not injected by test-utils, so no assertion about
    // WIDTH is possible here – what is provable, and what rots, is that `.ob-shell` still exists
    // and is still the takeover's own child. Rename it in the template and this goes red.
    const wrapper = mount(OnboardingWizard, { global: { stubs: { teleport: true } } })
    const shell = wrapper.find('.onboarding > .ob-shell')
    expect(shell.exists()).toBe(true)
    // and it is the whole wizard, not one pane of it: the step rail, the copy and the footer are
    // all inside the capped box, so nothing runs wider than the column it belongs to.
    expect(shell.find('.ob-steps').exists()).toBe(true)
    expect(shell.find('.ob-foot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('...and it is capped, centred, at the SAME width `#app` uses – one mechanism, not two', () => {
    const scoped = wizardSrc.slice(wizardSrc.indexOf('<style scoped>'))
    expect(scoped.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
    const shellRule = scoped.slice(scoped.indexOf('\n.ob-shell {'), scoped.indexOf('/* --- the step rail'))
    expect(shellRule).toContain('max-width: var(--app-max-width)')
    expect(shellRule).toContain('margin-inline: auto')
    // THE TOKEN IS THE POINT. A hard-coded 880 here would be a second cap that drifts the first
    // time the app frame moves; `#app` has to be reading the same declaration.
    expect(sheet).toContain('--app-max-width: 880px')
    expect(sheet).toMatch(/#app \{\n\s+max-width: var\(--app-max-width\)/)
    expect(scoped).not.toContain('880px')
  })
})

// ===========================================================================
// ITEM 2 – the inbox becomes a mail client.
//
// The owner: a list, unread bold, click to open, a bin per row once read, yes/no on delete.
//
// ⚠ WHAT "DELETE" MEANS, PER STATE, is the part this item had to decide before the bin could be
// drawn, and `letterDeletable` is that decision. Delete is DISMISS FROM THE LIST: the record stays
// in the save, because a letter that lapsed still explains what happened and a signed one is the
// only surface stating the contract she is under. Two states carry no bin at all – a letter still
// inside its deadline (deleting it would delete a decision he can still take) and a signed deal
// still running (its terms are live). The reasoning is on `letterDeletable` itself.
// ===========================================================================
function kitOffer(over: Record<string, unknown> = {}, terms: Record<string, unknown> = {}): Offer {
  return {
    id: 'kit-1',
    kind: 'kit',
    state: 'open',
    week: 100,
    deadlineWeek: 104,
    ...over,
    terms: {
      kind: 'kit',
      tier: 'local',
      brand: 'String House',
      covers: ['strings'],
      kitAllowanceCents: 200_00,
      minEventsPerSeason: 8,
      seasons: 1,
      travelShare: 0,
      ...terms,
    },
  } as unknown as Offer
}

function deskLetter(id = 'desk-1'): Offer {
  return {
    id,
    kind: 'entry',
    state: 'info',
    week: 99,
    deadlineWeek: 99,
    terms: { tier: 'w50', label: 'World Tour 50', eventWeek: 105, freeUntilWeek: 103 },
  } as unknown as Offer
}

function mountInbox(offers: Offer[], week = 102) {
  const base = toSnapshot(worldAfter(6))
  useGameStore().snapshot = { ...base, week, offers, careerId: 'r14-inbox' }
  return mount(InboxSheet, { global: { stubs: { teleport: true } } })
}

const rows = (w: ReturnType<typeof mountInbox>) => w.findAll('.inbox-row')
const openRow = async (w: ReturnType<typeof mountInbox>, i: number) => {
  await rows(w)[i].find('.inbox-open').trigger('click')
}
const backToList = async (w: ReturnType<typeof mountInbox>) => {
  await w.find('button[aria-label="Back to all letters"]').trigger('click')
}

describe('R14-2 – the inbox is a list you open letters from', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('renders one ROW per letter and no open paper at all', () => {
    const wrapper = mountInbox([kitOffer(), deskLetter()])
    expect(rows(wrapper)).toHaveLength(2)
    // the whole complaint: every letter used to be open at once
    expect(wrapper.findAll('.offer-letter')).toHaveLength(0)
    // ...and a row says who wrote and what about, so the pile is readable without opening it
    expect(wrapper.text()).toContain('String House')
    expect(wrapper.text()).toContain('World Tour 50')
    wrapper.unmount()
  })

  it('clicking a row opens THAT letter, and only that one', async () => {
    const wrapper = mountInbox([kitOffer(), deskLetter()])
    await openRow(wrapper, 1) // newest first puts the kit letter (week 100) above the desk's (99)
    expect(wrapper.findAll('.offer-letter')).toHaveLength(1)
    expect(wrapper.text()).toContain('Your entry for the World Tour 50 is confirmed')
    expect(rows(wrapper)).toHaveLength(0)
    // ...and there is a way back to the pile
    await backToList(wrapper)
    expect(rows(wrapper)).toHaveLength(2)
    wrapper.unmount()
  })

  it('every letter starts unread, and opening one is what marks it read', async () => {
    const wrapper = mountInbox([kitOffer(), deskLetter()])
    expect(wrapper.findAll('.inbox-row.unread')).toHaveLength(2)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    expect(wrapper.findAll('.inbox-row.unread')).toHaveLength(1)
    wrapper.unmount()
  })

  it('...and it SURVIVES a remount, because a mail client that forgets is not one', async () => {
    // Per career, in localStorage, never in the save – the discipline inboxCue.ts records at length.
    // App.vue mounts every screen fresh on each tab visit, so a read state that did not persist would
    // come straight back bold on the next visit.
    const wrapper = mountInbox([kitOffer(), deskLetter()])
    await openRow(wrapper, 0)
    await backToList(wrapper)
    wrapper.unmount()

    const again = mountInbox([kitOffer(), deskLetter()])
    expect(again.findAll('.inbox-row.unread')).toHaveLength(1)
    again.unmount()
  })

  it('unread is BOLD, not merely a class nobody paints', () => {
    // Scoped SFC styles are not injected by test-utils, so the class is what the mount can prove and
    // the rule that paints it is pinned in the source it lives in. Two halves of one claim.
    const src = repoFile('src/components/InboxSheet.vue')
    const scoped = src.slice(src.indexOf('<style scoped>'))
    expect(scoped.length).toBeGreaterThan(300)
    const rule = scoped.slice(scoped.indexOf('.inbox-row.unread'))
    expect(rule.slice(0, rule.indexOf('}'))).toContain('font-weight: 700')
  })
})

describe('R14-2 – the bin, and what delete means for each state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const bins = (w: ReturnType<typeof mountInbox>) => w.findAll('.inbox-bin')

  it('no bin until the letter has been read – the owner asked for it "once read"', async () => {
    const wrapper = mountInbox([kitOffer({ id: 'refused-1', state: 'refused' })])
    expect(bins(wrapper)).toHaveLength(0)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    expect(bins(wrapper)).toHaveLength(1)
    wrapper.unmount()
  })

  it('⚠ a letter that can still be ANSWERED never grows one, however often it is opened', async () => {
    // Deleting an answerable offer deletes the decision, not a record of one. Week 102 is inside the
    // deadline of 104, so this letter is still a live choice.
    const wrapper = mountInbox([kitOffer()], 102)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    expect(bins(wrapper)).toHaveLength(0)
    // and the row says so, which is why it is not simply missing a control
    expect(wrapper.text()).toContain('Needs an answer')
    wrapper.unmount()
  })

  it('⚠ nor does a SIGNED deal while it is still running – the letter is the live contract', async () => {
    const running = kitOffer({ id: 'signed-1', state: 'signed', fromWeek: 100, untilWeek: 150 })
    const wrapper = mountInbox([running], 120)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    expect(bins(wrapper)).toHaveLength(0)
    wrapper.unmount()
  })

  it('...and it DOES once that deal has run its course, so nothing is uncleanable for ever', async () => {
    const finished = kitOffer({ id: 'signed-1', state: 'signed', fromWeek: 100, untilWeek: 150 })
    const wrapper = mountInbox([finished], 151)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    expect(bins(wrapper)).toHaveLength(1)
    wrapper.unmount()
  })

  it('the bin asks yes/no, and a NO leaves the row exactly where it was', async () => {
    const wrapper = mountInbox([kitOffer({ id: 'refused-1', state: 'refused' })])
    await openRow(wrapper, 0)
    await backToList(wrapper)
    await bins(wrapper)[0].trigger('click')

    const dialog = wrapper.find('.dialog-card')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('String House')
    expect(rows(wrapper)).toHaveLength(1)

    await dialog.findAll('button').find((b) => b.text() === 'Keep it')!.trigger('click')
    expect(wrapper.find('.dialog-card').exists()).toBe(false)
    expect(rows(wrapper)).toHaveLength(1)
    wrapper.unmount()
  })

  it('a YES takes it off the list – and the LETTER ITSELF is untouched in the save', async () => {
    const wrapper = mountInbox([kitOffer({ id: 'refused-1', state: 'refused' }), deskLetter()])
    await openRow(wrapper, 0)
    await backToList(wrapper)
    await bins(wrapper)[0].trigger('click')
    await wrapper.find('.dialog-card').findAll('button').find((b) => b.text() === 'Delete')!.trigger('click')

    expect(rows(wrapper)).toHaveLength(1)
    // ⚠ THE RECORD SURVIVES. Delete is dismiss-from-the-list: the season summary, the renewal path
    // and "what did I do about that?" all still read this letter off the world.
    expect(useGameStore().snapshot!.offers.map((o) => o.id)).toContain('refused-1')
    wrapper.unmount()
  })

  it('...and it stays off across a remount, without ever reaching the engine', async () => {
    const offers = [kitOffer({ id: 'refused-1', state: 'refused' }), deskLetter()]
    const wrapper = mountInbox(offers)
    await openRow(wrapper, 0)
    await backToList(wrapper)
    await bins(wrapper)[0].trigger('click')
    await wrapper.find('.dialog-card').findAll('button').find((b) => b.text() === 'Delete')!.trigger('click')
    wrapper.unmount()

    const again = mountInbox(offers)
    expect(rows(again)).toHaveLength(1)
    again.unmount()
  })

  it('letterDeletable, stated as a table – the rule the bin is drawn from', () => {
    const at = (o: Offer, week: number) => letterDeletable(o, week)
    // open, inside its deadline: NO. Past it, the letter is already "Expired" and may go.
    expect(at(kitOffer(), 102)).toBe(false)
    expect(at(kitOffer(), 104)).toBe(false)
    expect(at(kitOffer(), 105)).toBe(true)
    // signed: not while it runs, yes once it has
    const signed = kitOffer({ state: 'signed', untilWeek: 150 })
    expect(at(signed, 150)).toBe(false)
    expect(at(signed, 151)).toBe(true)
    // the terminal records: always
    expect(at(kitOffer({ state: 'refused' }), 102)).toBe(true)
    expect(at(kitOffer({ state: 'expired' }), 102)).toBe(true)
    expect(at(deskLetter(), 102)).toBe(true)
  })
})

// ===========================================================================
// DEFECT D4 – `Enter` is ambiguous (docs/specs/e2e-coverage.md §12).
//
// The highest-priority item on that list, and the reason gap 8.1 exists: entering a tournament
// through the UI has no end-to-end coverage at all, because a feed of eight cards renders eight
// buttons whose entire accessible name is the word "Enter". Its own sentence: "Fixing D4 alone
// unlocks 8.1."
//
// ⚠ AND THE VISIBLE LABEL MUST STILL BE IN THE NAME (WCAG 2.5.3, Label in Name) – a speech-input
// user who says "Enter" has to reach the button that reads Enter. So the assertions below check
// BOTH halves: the name identifies the event AND begins with the word on the button.
// ===========================================================================
describe('D4 – every Enter says which tournament it enters', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** A career whose feed really draws an Enter. Which week that is depends on the seed's own
   *  calendar and her band, so it is FOUND rather than assumed. */
  function seasonShowingEnter() {
    for (const weeks of [6, 10, 14, 20, 26, 32, 40, 48]) {
      const snapshot = toSnapshot(worldAfter(weeks))
      const wrapper = mountSeason(snapshot)
      const enters = wrapper.findAll('button').filter((b) => b.text() === 'Enter')
      if (enters.length) return { wrapper, snapshot, enters }
      wrapper.unmount()
    }
    throw new Error('no enterable event in the first 48 weeks of this career')
  }

  it('the fixture really draws one, so the assertions below are not vacuous', () => {
    const { wrapper, enters } = seasonShowingEnter()
    expect(enters.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('names the event and the week – and still begins with the visible word', () => {
    const { wrapper, snapshot, enters } = seasonShowingEnter()
    for (const button of enters) {
      const name = button.attributes('aria-label')
      expect(name, 'an Enter with no accessible name is defect D4 itself').toBeTruthy()
      // WCAG 2.5.3: the accessible name CONTAINS the visible label.
      expect(name!).toContain(button.text())
      expect(name!.startsWith('Enter')).toBe(true)
      // ...and it identifies a real event on this snapshot, by name AND by its dates.
      const named = snapshot.upcoming.filter((e) => name!.includes(e.label))
      expect(named.length, `"${name}" names no event in the snapshot`).toBeGreaterThan(0)
      expect(named.some((e) => name!.includes(weekRange(e.week)))).toBe(true)
    }
    wrapper.unmount()
  })

  it('...and two cards never share one name, which is the whole defect', () => {
    // A season carries the same rung more than once, so the label alone is not an identity - the
    // week is what makes it one. If a career only ever shows a single Enter this is trivially true,
    // so the claim is stated over whatever the feed drew.
    const { wrapper, enters } = seasonShowingEnter()
    const names = enters.map((b) => b.attributes('aria-label'))
    expect(new Set(names).size).toBe(names.length)
    wrapper.unmount()
  })

  it("the CALENDAR's Enter carries the same kind of name – the defect names both screens", async () => {
    // Mounted, not pinned: open a marker, which is the only way to that button, and read the name
    // off the rendered control.
    const snapshot = toSnapshot(worldAfter(12))
    useGameStore().snapshot = snapshot
    const wrapper = mount(CalendarScreen, { global: { stubs: { teleport: true } } })
    const markers = wrapper.findAll('.cal-marker')
    expect(markers.length, 'the calendar drew no enterable marker to open').toBeGreaterThan(0)
    await markers[0].trigger('click')

    const enter = wrapper.findAll('button').find((b) => b.text() === 'Enter')
    expect(enter, 'the marker card has no Enter to name').toBeTruthy()
    const name = enter!.attributes('aria-label')
    expect(name).toBeTruthy()
    expect(name!).toContain(enter!.text())
    expect(name!.startsWith('Enter')).toBe(true)
    const named = snapshot.upcoming.find((e) => name!.includes(e.label) && name!.includes(weekRange(e.week)))
    expect(named, `"${name}" names no event in the snapshot`).toBeTruthy()
    wrapper.unmount()
  })

  it('...and it is literally the same function, so the two surfaces cannot drift', () => {
    // D11's family: duplicate names across live surfaces. One helper, two callers.
    const event = { label: 'World Tour 50', week: 432 }
    expect(enterActionName(event)).toBe(`Enter the World Tour 50, ${weekRange(432)}`)
    for (const rel of ['src/components/screens/SeasonScreen.vue', 'src/components/screens/CalendarScreen.vue']) {
      const src = repoFile(rel)
      expect(src.length).toBeGreaterThan(500)
      expect(src, `${rel} does not read the shared name`).toContain("from '../../composables/eventName'")
    }
  })
})

// ===========================================================================
// DEFECT D9 – the seed input was placeholder-only (docs/specs/e2e-coverage.md §12).
// ===========================================================================
describe('D9 – the friendly-match seed is a NAMED textbox', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('has a real label bound to it, not a placeholder standing in for one', () => {
    const wrapper = mountSeason(toSnapshot(worldAfter(8)))
    const input = wrapper.find('input#friendly-seed')
    expect(input.exists()).toBe(true)

    const label = wrapper.find('label[for="friendly-seed"]')
    expect(label.exists(), 'a placeholder is not a name - it disappears on the first keystroke').toBe(true)
    expect(label.text().length).toBeGreaterThan(0)
    // ...and the placeholder is a hint again rather than the only thing naming the field
    expect(input.attributes('placeholder')).not.toContain('seed')
    wrapper.unmount()
  })
})
