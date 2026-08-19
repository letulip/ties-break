// THE ACCESSIBILITY SWEEP, MOUNTED – docs/specs/e2e-coverage.md §12, defects D1/D2/D5/D6/D8/D10/D12,
// and since the dials wave (10.08) D13, D15 and D10's second half – see the block at the bottom.
//
// ⚠ WHY EVERY CLAIM HERE IS A MOUNTED ONE. §12 exists because the e2e layer's selector policy is
// role-and-accessible-name only, and "every element a test could not reach is a real defect". A
// source pin asserting that a file CONTAINS `role="dialog"` would restate the diff and prove
// nothing: what a control is CALLED is computed from the rendered tree - a label two elements away,
// a descendant that folds into the name, an attribute on an element whose role cannot carry it. All
// three of those are what the defects below actually were. So every test reaches the element the way
// a test would, off a real snapshot built by the real engine.
//
// ⚠ HOW AN ACCESSIBLE NAME IS CHECKED. happy-dom computes no accname, so `accName` walks the two
// steps these surfaces use - `aria-label`, then `aria-labelledby` resolved against the tree - and
// falls back to text content, which is what a button with neither gets. It is the same helper
// tests/component/round15-surfaces.test.ts introduced for the coach market, kept identical on
// purpose: two files that disagree about what a name is would be worse than one that is slightly
// simplified.
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   D1  `role="dialog"` removed from KnockDialog -> the dialog test goes red on `undefined`, and so
//       does the Escape test, which asks the same question after a press. That pair is not a
//       duplicate: the second one is what says Escape did not silently answer the knock.
//       `aria-modal` dropped -> the modal test goes red on its own.
//       `useDialogFocus(card)` removed -> "focus lands inside" and "Tab is contained" go red while
//       the role tests stay green, which is why they are separate tests.
//       the Escape arm of `useDialogFocus` deleted -> the wrap-up's Escape test goes red and the
//       knock's "Escape is NOT a way out" test stays green, which is the pair's whole point.
//   D2  `aria-labelledby` removed from one switch -> that switch's name collapses to "OFF" and the
//       five-names test goes red naming it.
//   D5  `role="group"` removed from StatRow -> the ledger test goes red; `rowName` reduced to the
//       label alone -> the "the figure is in the name" test goes red on its own.
//   D6  `role="img"` removed from a rung -> the strip test goes red; `chipName` pinned to return the
//       visible text -> the "the state is in the name" test goes red while the role test passes.
//   D8  the `aria-label` dropped from Home's news table -> red.
//   D10 `role="heading"` removed from the date line -> red.
//   D12 the `:role` binding removed from the trophy cell -> red on the not-yet-won plate only, which
//       is exactly the half of the cabinet the defect was about.
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KnockDialog from '../../src/components/KnockDialog.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import TrophiesScreen from '../../src/components/screens/TrophiesScreen.vue'
import StatRow from '../../src/components/ui/StatRow.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { weekDateLine, weekLabel } from '../../src/shared/dates'
import { latestNewsId } from '../../src/composables/inboxCue'
import type { CareerMeta, KnockPrompt, SeasonSummary, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

// ⚠ THIS RUNNER HAS NO localStorage, AND HomeScreen READS IT AT SETUP. Same finding and the same
// shim as tests/component/home-strip-and-mail.test.ts and round20-ui.test.ts, argued at length
// there: happy-dom is configured here without web storage, and supplying the browser's own object
// is the fix rather than weakening the component to suit the runner.
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

/** A real career through the real protocol, so nothing below is a hand-written shape that can drift
 *  from `Snapshot`. Same fixture discipline as season-screen.test.ts and home-strip-and-mail.test.ts. */
const snapshotAfter = (weeks: number, seed = 'a11y-sweep'): Snapshot => careerSnapshot(weeks, seed)

function withSnapshot(snapshot: Snapshot): void {
  useGameStore().snapshot = snapshot
}

/** The first two steps of the real accessible-name algorithm, which are the only two these surfaces
 *  use, then name-from-content. */
function accName(wrapper: VueWrapper, el: ReturnType<VueWrapper['find']>): string {
  const label = el.attributes('aria-label')
  if (label !== undefined) return label
  const ids = el.attributes('aria-labelledby')
  if (ids !== undefined) {
    return ids
      .split(/\s+/)
      .map((id) => wrapper.find(`#${id}`).text())
      .join(' ')
  }
  return el.text()
}

/** Every element carrying `role`, addressed the way a role-first test addresses one. */
function byRole(wrapper: VueWrapper, role: string) {
  return wrapper.findAll(`[role="${role}"]`)
}

// =================================================================================================
// D1 – THE TWO BLOCKING POPUPS ARE MODALS
// =================================================================================================
// Both stop the app: the knock refuses to let the engine tick until it is answered, the wrap-up sits
// over the week's story. Neither said so, and neither held the keyboard.

const PROMPT: KnockPrompt = {
  part: 'hip',
  repeat: false,
  line: 'She came off court rubbing it.',
  read: 'Her coach thinks a week off would settle it.',
  restCost: 'Rest it: she loses the week’s training.',
  pushCost: 'Train through it: a real chance it becomes an injury.',
}

function mountKnock() {
  withSnapshot({ ...snapshotAfter(4), knockPrompt: PROMPT })
  return mount(KnockDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

function summaryFixture(): SeasonSummary {
  return {
    seasonYear: 2031,
    endRank: 412,
    startRank: 690,
    points: 240,
    wins: 44,
    losses: 19,
    bestResultText: 'Champion',
    fundsDeltaCents: 723_00,
    spentCents: 20_779_00,
    earnedCents: 21_502_00,
    weeksInjured: 0,
    academyCoveredCents: 0,
    rankTrack: 'wta',
    rankInTrack: 993,
  }
}

function mountWrapUp() {
  withSnapshot({ ...snapshotAfter(4), lastSeasonSummary: summaryFixture() })
  return mount(SeasonSummaryDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('D1 - a modal says it is one, and holds the keyboard', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the knock is a dialog, it is modal, and its name is the two lines a reader sees', () => {
    const wrapper = mountKnock()
    const dialogs = byRole(wrapper, 'dialog')
    // The defect, stated: this was zero.
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0].attributes('aria-modal')).toBe('true')
    // Both visible lines, in the order they are read - which week's knock, and which part of her.
    expect(accName(wrapper, dialogs[0])).toBe(`A knock – ${weekLabel(4)} Her hip.`)
    wrapper.unmount()
  })

  it('the wrap-up is a dialog too, named by the season it closes', () => {
    const wrapper = mountWrapUp()
    const dialogs = byRole(wrapper, 'dialog')
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0].attributes('aria-modal')).toBe('true')
    expect(accName(wrapper, dialogs[0])).toBe("Season 2031 · wrap-up That's a season.")
    wrapper.unmount()
  })

  it('focus lands INSIDE the dialog when it opens, and comes back when it closes', async () => {
    // Somewhere to come back to - the app's own case is the week button, which is what had focus
    // when the player pressed it.
    const opener = document.createElement('button')
    opener.textContent = 'Next week'
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const wrapper = mountKnock()
    const inside = wrapper.find('.knock-choice').element
    expect(document.activeElement, 'the dialog opened behind the page it is blocking').toBe(inside)

    wrapper.unmount()
    expect(document.activeElement, 'the keyboard was left on the element the dialog replaced').toBe(opener)
    opener.remove()
  })

  it('Tab is contained: the last control wraps to the first instead of leaving the dialog', async () => {
    const wrapper = mountKnock()
    const choices = wrapper.findAll('.knock-choice')
    expect(choices, 'the knock is two buttons and nothing else').toHaveLength(2)
    const [rest, push] = choices.map((c) => c.element as HTMLElement)

    push.focus()
    await choices[1].trigger('keydown', { key: 'Tab' })
    expect(document.activeElement, 'Tab walked out of a modal and into the page behind it').toBe(rest)

    // ...and backwards, which is the half a one-directional trap gets wrong.
    await choices[0].trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(push)
    wrapper.unmount()
  })

  it('Escape closes the wrap-up - and is NOT a way out of the knock', async () => {
    const wrap = mountWrapUp()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    // The same event the backdrop click emits: one way out, not two.
    expect(wrap.emitted('continue')).toHaveLength(1)
    wrap.unmount()

    // The knock has no exit that is not an answer (its own header argues that at length), so the
    // trap must not hand the keyboard a third option.
    const knock = mountKnock()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(byRole(knock, 'dialog')).toHaveLength(1)
    knock.unmount()
  })
})

// =================================================================================================
// D2 – FIVE SWITCHES THAT WERE ALL CALLED "ON" OR "OFF"
// =================================================================================================

/** Two careers on file, so the Careers list has the ambiguity D11 is about: two rows, and one `Load`
 *  and one `Delete` in each. */
function careerRow(kidName: string, week: number): CareerMeta {
  return {
    careerId: `c-${kidName}`,
    kidName,
    country: 'US',
    seed: `seed-${kidName}`,
    createdAt: 0,
    lastPlayedAt: 0,
    week,
  }
}

function mountMore(careers: CareerMeta[] = []) {
  const store = useGameStore()
  store.snapshot = snapshotAfter(4)
  store.careers = careers
  // MoreScreen asks the worker for the career list when it mounts, and there is no worker in this
  // runner. The list is supplied above, so the call has nothing to do here but fail.
  store.refreshCareers = async () => {}
  return mount(MoreScreen, { global: { stubs: { teleport: true } } })
}

describe('D2 - every settings switch is called what its row says', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('all five switches have their own name, and none of them is a state word', () => {
    const wrapper = mountMore()
    const switches = byRole(wrapper, 'switch')
    expect(switches, 'More opens on the Play tab, which holds all five').toHaveLength(5)

    const names = switches.map((s) => accName(wrapper, s))
    // The defect, stated: this list used to be ['ON','ON','ON','ON','ON'] (or OFF), five controls
    // sharing two names between them.
    expect(names).toEqual([
      'Sound effects',
      'Music',
      'Haptics',
      'Open at the end of a week',
      'Cross out the days',
    ])
    // ...and the state is still on the control, where a name cannot carry it.
    for (const s of switches) expect(s.attributes('aria-checked')).toMatch(/^(true|false)$/)
    wrapper.unmount()
  })

  it('the name is the label on screen and not a copy of it - the switch still toggles under it', async () => {
    const wrapper = mountMore()
    const sound = byRole(wrapper, 'switch')[0]
    const before = sound.attributes('aria-checked')

    await sound.trigger('click')

    expect(sound.attributes('aria-checked')).not.toBe(before)
    // The name did not move when the state did - the coach market's defect, checked here too.
    expect(accName(wrapper, byRole(wrapper, 'switch')[0])).toBe('Sound effects')
    wrapper.unmount()
  })
})

// =================================================================================================
// D11 – TWO THINGS CALLED "LOAD" ON ONE SCREEN
// =================================================================================================
// The Careers list and the Saves table are the same section of the same tab, so a career's `Load`
// and a slot's `Load` are on screen together, several of each. The visible word stays (a column of
// rows does not want its noun repeated on every button); the NAME says which row it belongs to,
// which is the pattern this screen already kept for `Delete save {name}`.

describe('D11 - no two controls on this screen answer to the same name', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it("every Load and every Delete says whose it is, and the visible word is still the name's first word", async () => {
    const wrapper = mountMore([careerRow('Emma', 120), careerRow('Nina', 40)])
    await wrapper.find('button[aria-label="Saves"]').trigger('click')

    const rows = wrapper.findAll('.career-row .controls button')
    expect(rows.length, 'two careers, a Load and a Delete each').toBe(4)
    const names = rows.map((b) => accName(wrapper, b))
    // The defect, stated: this used to be ['Load','Delete','Load','Delete'].
    expect(names).toEqual([
      'Load career – Emma',
      'Delete career – Emma',
      'Load career – Nina',
      'Delete career – Nina',
    ])
    expect(new Set(names).size).toBe(names.length)
    // ⚠ WCAG 2.5.3: the name EXTENDS the visible word rather than replacing it, so a speech-input
    // user saying what they can read still hits the control.
    for (const button of rows) expect(accName(wrapper, button).startsWith(button.text())).toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// D5 – THE LEDGER WAS ONE RUN OF TEXT
// =================================================================================================

describe('D5 - a money row is a thing a test can ask for', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('StatRow is a named group, and the figure is IN the name', () => {
    const wrapper = mount(StatRow, {
      props: { label: 'Entry fee, W12 ’32', meta: '$51,463', value: '-$120', tone: 'negative' },
    })
    const row = wrapper.find('[role="group"]')
    expect(row.exists(), 'a bare div is what the defect was').toBe(true)
    // Label, running balance, amount - the row's own visible text, in its own order. A name of the
    // label alone would leave the ledger's numbers unreachable, which is the same defect one step on.
    expect(accName(wrapper, row)).toBe('Entry fee, W12 ’32 – $51,463 – -$120')
    wrapper.unmount()
  })

  it('the ledger reaches the screen as rows, each one named', async () => {
    withSnapshot(snapshotAfter(60))
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    // Through the door a player uses: the History segment of the screen's own switcher, addressed by
    // its accessible name.
    await wrapper.find('button[aria-label="History"]').trigger('click')

    const rows = byRole(wrapper, 'group').filter((g) => g.classes().includes('tb-statrow'))
    expect(rows.length, 'sixty weeks of a career leave transactions behind').toBeGreaterThan(3)
    // Every one carries a name, and no two of them are the empty string - which is what the whole
    // ledger amounted to before.
    for (const row of rows) expect(accName(wrapper, row).length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})

// =================================================================================================
// D6 / D8 / D10 – HOME: THE LADDER, THE FEED, AND THE DATE
// =================================================================================================

function mountHome(snapshot: Snapshot) {
  withSnapshot(snapshot)
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

describe('D6 - a rung says which rung and what state it is in', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every chip on the strip is a named image, and the name carries the state the colour was carrying', () => {
    const wrapper = mountHome(snapshotAfter(30))
    const strip = wrapper.find('[role="group"][aria-label="Season ladder"]')
    expect(strip.exists()).toBe(true)

    const chips = strip.findAll('[role="img"]')
    expect(chips.length, 'the strip always draws a window of rungs').toBeGreaterThan(1)
    const names = chips.map((c) => c.attributes('aria-label') ?? '')
    // Every chip names its rung...
    for (const name of names) expect(name).toMatch(/^[^:]+: /)
    // ...and at least one of them says a state that used to live only in a CSS class. A career 30
    // weeks in has rungs it cannot enter yet, so `locked` is the honest canary here.
    expect(names.join(' | '), 'the state was invisible to everyone who cannot see the colour').toMatch(
      /: (locked|reached|outgrown|open)\b/,
    )
    wrapper.unmount()
  })
})

describe('D8 / D10 - the feed tables are named, and the date line is a heading', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it("Home's date line - the app's most-asserted string - has a role", () => {
    const snapshot = snapshotAfter(30)
    const wrapper = mountHome(snapshot)
    const heading = wrapper.find('[role="heading"][aria-level="1"]')
    expect(heading.exists(), 'it was a bare <p>, reachable only as free text').toBe(true)
    // The app's own translation of the week, so this cannot drift into asserting a format the
    // product stopped using - the same argument e2e/journey.ts's `onScreenWeek` makes.
    expect(heading.text()).toContain(weekDateLine(snapshot.week))
    wrapper.unmount()
  })

  it('each week of news is a table that says which week it is', () => {
    const wrapper = mountHome(snapshotAfter(30))
    const tables = wrapper.findAll('table[aria-label]')
    expect(tables.length, 'thirty weeks leave news behind, in groups of a week').toBeGreaterThan(0)
    // The label the app itself prints above the table (`weekLabel`, "W30 '31"), so this cannot drift
    // into asserting a date format the product stopped using.
    for (const table of tables) expect(table.attributes('aria-label')).toMatch(/^News – W\d+ '\d{2}$/)
    // The names are distinct - one anonymous table per week was the defect, and a dozen tables all
    // called "News" would be the same defect wearing a name.
    const names = tables.map((t) => t.attributes('aria-label'))
    expect(new Set(names).size).toBe(names.length)
    wrapper.unmount()
  })
})

// =================================================================================================
// D12 – HALF THE TROPHY CABINET WAS UNREACHABLE
// =================================================================================================

describe('D12 - a cell that does not fold is still a thing with a name', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the not-yet-won plates carry a role their label can attach to', () => {
    // A young career has won nothing, so EVERY cell is a non-foldable one - which is exactly the
    // half of the cabinet the defect made unreachable.
    withSnapshot(snapshotAfter(4))
    const wrapper = mount(TrophiesScreen, { global: { stubs: { teleport: true } } })

    const cells = wrapper.findAll('.trophy-cell')
    expect(cells.length, 'the cabinet draws its shelves whether or not anything is on them').toBeGreaterThan(4)
    const plain = cells.filter((c) => c.element.tagName !== 'BUTTON')
    expect(plain.length, 'nothing is won yet, so nothing folds').toBe(cells.length)

    for (const cell of plain) {
      // The defect: the label was on a <div>, which has no role to carry it.
      expect(cell.attributes('role'), 'an aria-label on a roleless div is inert').toBe('img')
      expect(cell.attributes('aria-label')).toMatch(/not won yet$/)
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// D13 / D15 / D10-ThisWeek – THE THREE CRUMBS THE DIALS WAVE PICKED UP (10.08)
// =================================================================================================
// All three were filed by writing the e2e level, none was worked around in `src/`, and all three sit
// in files this wave was opening anyway. Same discipline as everything above: mounted, off a real
// snapshot, and asserted the way a role-first test reaches an element.
//
// ⚠ MUTATION-VERIFIED, each one watched failing first:
//   D13 `confirm-label` put back to "Sign" -> the distinct-names test goes red naming both controls.
//   D15 `role="img"` dropped from a diary dot -> the marker test goes red; the `aria-describedby`
//       binding dropped -> the "the dot does not rename the button" pair still passes and the
//       "handed over as the description" assertion goes red on its own, which is why they are two.
//   D10 `role="heading"` removed from ThisWeek's date line -> red, and Home's stays green.

describe('D13 - the one irreversible press has a name of its own', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the letter\'s Sign and the confirm\'s Sign are no longer the same name', async () => {
    // A career far enough in to have kit letters waiting; the sheet opens on the list, and a letter
    // has to be OPEN before its Sign exists at all.
    const snapshot = snapshotAfter(30)
    withSnapshot(snapshot)
    const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })

    const row = wrapper.findAll('.inbox-row').find((r) => r.text().length > 0)
    if (!row) {
      // The fixture has no letter this week. Assert the shape at the source rather than silently
      // passing: the label is the fix, and a fixture drought may not hide it.
      expect(readFileSync(resolve(__dirname, '../../src/components/InboxSheet.vue'), 'utf8'))
        .toContain('confirm-label="Sign it"')
      wrapper.unmount()
      return
    }
    await row.trigger('click')
    const sign = wrapper.findAll('button').filter((b) => b.text() === 'Sign')
    expect(sign.length, 'the letter draws exactly one Sign').toBe(1)
    await sign[0].trigger('click')

    const names = wrapper.findAll('button').map((b) => accName(wrapper, b))
    const signish = names.filter((n) => n.startsWith('Sign'))
    // THE DEFECT, STATED: both controls were live, both called exactly "Sign".
    expect(signish.length, 'the letter and its confirm are both on screen').toBe(2)
    expect(new Set(signish).size, 'two live controls answering to one name').toBe(2)
    expect(signish).toContain('Sign it')
    // ...and WCAG 2.5.3: the visible word is still the first word of the name.
    const confirm = wrapper.findAll('button').find((b) => b.text() === 'Sign it')
    expect(confirm, 'the confirm still says what it does').toBeTruthy()
    wrapper.unmount()
  })
})

describe('D15 - the two unread markers on Home are things a test can ask for', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** ⚠ THE DOT HAS TO BE LIT OR THE TEST IS VACUOUS, and neither marker lights itself on a fresh
   *  fixture: `inboxCue`'s watermarks seed themselves to "now" the first time they find no stored
   *  value ("claim nothing", argued in that file). So the player is put BEHIND the newest story,
   *  which is the round20-ui idiom for exactly this, and the letter marker is lit the same way. */
  function homeWithMarkers() {
    const snapshot = snapshotAfter(30)
    withSnapshot(snapshot)
    const careerId = useGameStore().snapshot!.careerId
    localStorage.setItem(`tb:lastSeenBellNewsId:${careerId}`, String(latestNewsId(snapshot) - 1))
    localStorage.setItem(`tb:lastSeenInboxLetter:${careerId}`, '')
    return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
  }

  it('a lit dot is a named image, and it does not rename the button it sits in', () => {
    const wrapper = homeWithMarkers()
    const tools = wrapper.findAll('.diary-tool')
    expect(tools.length, 'the header carries the bell, the envelope and the gear').toBeGreaterThan(2)
    const dots = wrapper.findAll('.diary-tool-dot')
    expect(dots.length, 'this fixture must actually have a marker lit').toBeGreaterThan(0)
    for (const dot of dots) {
      // The defect: a <span> with no role, no text and no label - unreachable by anything.
      expect(dot.attributes('role'), 'an unnamed span is invisible to a screen reader').toBe('img')
      expect((dot.attributes('aria-label') ?? '').length).toBeGreaterThan(0)
    }
    // ...and the buttons still answer to their own words, which is the half D7 established one
    // screen over: a fact that ARRIVES may not rename a control.
    const names = tools.map((t) => accName(wrapper, t))
    expect(names).toContain('Open the inbox')
    expect(names).toContain('Go to the news feed')
    wrapper.unmount()
  })

  it('the marker is handed over as the DESCRIPTION, which is where a changing fact belongs', () => {
    const wrapper = homeWithMarkers()
    const lit = wrapper
      .findAll('.diary-tool')
      .filter((t) => t.find('.diary-tool-dot').exists())
    expect(lit.length).toBeGreaterThan(0)
    for (const tool of lit) {
      const described = tool.attributes('aria-describedby')
      expect(described, 'the dot is spoken, and it is spoken as a description').toBeTruthy()
      expect(wrapper.find(`#${described}`).attributes('role')).toBe('img')
    }
    wrapper.unmount()
  })
})

describe('D10 - ...and the OTHER date line, which was on nobody\'s list', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it("ThisWeek's date line has a role too, and it is the same fix Home took", () => {
    const snapshot = snapshotAfter(30)
    withSnapshot(snapshot)
    const wrapper = mount(ThisWeekScreen, { global: { stubs: { teleport: true } } })
    const heading = wrapper.find('[role="heading"][aria-level="1"]')
    expect(heading.exists(), 'it was a bare <p>, reachable only as free text').toBe(true)
    expect(heading.text()).toContain(weekDateLine(snapshot.week))
    wrapper.unmount()
  })
})
