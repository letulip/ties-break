// ⭐ ROUND-18 #8, MOUNTED – THE BRIEFING APPEARS EXACTLY ONCE AND DOES NOT COME BACK.
//
// The owner asked for a popup before the season of big prizes saying that she really is required to
// be there and that there is a regulation behind it. The regulation is his own (W3-ACT2 §6) and has
// been enforced since v38; `mandatoryBindsRank` was simply never surfaced, so the first thing a
// player ever heard about the regime was a per-event invoice at an entry deadline.
//
// ⚠ WHY MOUNTED, AND WHY THE WATERMARK LIVES IN THE COMPONENT. The whole of this item is a claim
// about a SCREEN over time – it shows the first time the rules bind, and it never shows again – and
// App.vue is mounted by no test in this repo, so a gate kept there could only ever be source-pinned.
// CLAUDE.md: a source pin "breaks on contact with a refactor and proves nothing about behaviour".
// TourBriefingDialog owns the record, so "once, ever" is a thing this file can actually watch happen:
// mount, read, press Continue, mount a FRESH component against the same career, get nothing.
//
// The snapshot is a REAL one built by the real engine, so every word asserted here is the engine's.
//
// ⚠ MUTATION-VERIFIED, each block naming what was broken to watch it fail:
//   * `briefedAt` never consulted (`const briefing = computed(() => snapshot.tourBriefing)`)
//                                                    -> "does not come back" goes red, twice over.
//   * `localStorage.setItem` dropped from `acknowledge()`
//                                                    -> "a reload does not re-open it" goes red
//                                                       while the same-instance assertion stays green,
//                                                       which is why they are separate tests.
//   * the key made global (`tb:tourBriefed`)         -> "a second career gets its own" goes red.
//   * `briefing.lead` replaced by a literal sentence  -> "the words are the engine's" goes red.
//   * `color: var(--ink, #1c1c1e)` on a cost line     -> the contrast block goes red (round-17 #3).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET, IMPORTED FOR ITS `:root` – without it `var(--text)` resolves to
// nothing and every colour assertion below is vacuous. Same reason birthday-dialog.test.ts does it.
import '../../src/style.css'
import { assertLegible } from './contrast'
import TourBriefingDialog from '../../src/components/TourBriefingDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND THIS COMPONENT READS IT AT SETUP. Same finding and the same
// shim as a11y-sweep.test.ts / home-strip-and-mail.test.ts / round20-ui.test.ts: happy-dom is
// configured here without web storage, and supplying the browser's own object is the fix rather than
// weakening the component to suit the runner.
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

/** A real career, ticked, then standing where the regime binds. The two facts `mandatoryBindsRank`
 *  reads are plain persisted state (a counting W result and a rank inside the gate), so this is the
 *  real predicate on a real world rather than a hand-built Snapshot that could drift from the type. */
function boundSnapshot(seed = 'brief-ui', rank = 34): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
  world.kidRankWta = rank
  return toSnapshot(world)
}

function mountWith(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(TourBriefingDialog, { global: { stubs: { teleport: true } } })
}

describe('TourBriefingDialog – it appears when the regime first binds', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⚠ is NOT up for a career the tour asks nothing of – so nothing below is vacuous', () => {
    const world = createWorld('nobody-ui')
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    const snap = toSnapshot(world)
    expect(snap.tourBriefing, 'the engine agrees she is not bound').toBeNull()
    const w = mountWith(snap)
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(w.findAll('button').length).toBe(0)
    w.unmount()
  })

  it('is up the first time her ranking binds her, and it is a MODAL that says so (a11y D1)', () => {
    const w = mountWith(boundSnapshot())
    const card = w.find('[role="dialog"]')
    expect(card.exists()).toBe(true)
    expect(card.attributes('aria-modal')).toBe('true')
    expect(card.attributes('aria-labelledby')).toBe('tour-briefing-kicker tour-briefing-title')
    expect(w.find('#tour-briefing-title').text()).toBe('The commitment rules now apply.')
    w.unmount()
  })

  it('⚠⚠ THE WORDS ARE THE ENGINE\'S – every sentence on the card comes off the snapshot', () => {
    // The load-bearing one. Each figure in this copy is read from ECONOMY.mandatory by
    // `buildTourBriefing` (tests/tour-briefing.test.ts proves that half); a sentence typed into the
    // template would be free to go on stating a rule the world no longer runs.
    const snap = boundSnapshot()
    const b = snap.tourBriefing!
    const w = mountWith(snap)
    const text = w.text()
    expect(text).toContain(b.lead)
    for (const row of b.requirements) {
      expect(text, `${row.tier} is asked for`).toContain(row.ask)
      expect(text).toContain(row.detail)
    }
    for (const cost of b.costs) expect(text).toContain(cost)
    expect(text).toContain(b.closing)
    // ...and the card states what is required and what declining costs, under those headings.
    expect(text).toContain('What the tour asks for')
    expect(text).toContain('What declining costs')
    w.unmount()
  })

  it('the rung rows are one per requirement, in the engine\'s order', () => {
    const snap = boundSnapshot()
    const w = mountWith(snap)
    const rows = w.findAll('li.tour-briefing-ask')
    expect(rows.length).toBe(snap.tourBriefing!.requirements.length)
    rows.forEach((row, i) => {
      expect(row.text()).toContain(snap.tourBriefing!.requirements[i].ask)
    })
    w.unmount()
  })

  it('⚠ CONTINUE IS THE ONLY WAY OUT – no close, no scrim click, no Escape', async () => {
    // A once-ever beat: acknowledging is what retires it for good, so a stray tap outside the card
    // would silently spend the one showing of rules the player has never been told. Same shape as
    // BirthdayDialog's "no way out that is not an answer", for the same reason.
    //
    // ⚠ THE SCRIM IS TESTED BY PRESSING IT, NOT BY READING AN ATTRIBUTE. `attributes('onclick')` is
    // vacuous on a Vue component – `@click.self` compiles to a listener prop and never reaches the
    // DOM as an attribute, so that assertion passes with the handler wired ON. Measured: restoring
    // `@click.self="acknowledge"` left it green. A trigger cannot be fooled that way.
    const w = mountWith(boundSnapshot())
    const buttons = w.findAll('button')
    expect(buttons.length, 'exactly one control, and it is the acknowledgement').toBe(1)
    expect(w.text()).not.toMatch(/\b(close|cancel|dismiss|not now|later|skip)\b/i)

    await w.find('.dialog-overlay').trigger('click')
    expect(w.emitted('continue'), 'a tap on the scrim spends nothing').toBeUndefined()
    expect(w.find('[role="dialog"]').exists(), 'and the sheet is still up').toBe(true)

    // ⚠ ESCAPE IS DISPATCHED ON `document`, WHERE `useDialogFocus` LISTENS FOR IT (capture phase) –
    // a `trigger('keydown')` on the card never reaches that listener, so asking the card would be
    // the same vacuous test as reading `onclick`. Measured: handing `acknowledge` to
    // `useDialogFocus` leaves the card-scoped version green and this one red.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await w.vm.$nextTick()
    expect(w.emitted('continue'), 'and neither does Escape').toBeUndefined()
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    w.unmount()
  })

  it('⚠ NOTHING ON THE CARD LEANS ON THE PLAYER – the standing ruling, on the surface', () => {
    // «Мы ни за что не наказываем». engine/offers.ts carries the sentence that decides this family's
    // voice: the tour has rules and the GAME has none, and a penalty is a price she chose to pay.
    const w = mountWith(boundSnapshot())
    const text = w.text()
    expect(text).not.toMatch(/should|ought to|make sure|don't forget|failed|failure/i)
    expect(text).not.toMatch(/punish|penalis|penaliz|shame|disappoint/i)
    // The copy rule, on the rendered surface rather than in the file.
    expect(text).not.toContain('—')
    w.unmount()
  })
})

describe('⭐ EXACTLY ONCE – and it does not come back', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('Continue closes it, and the same instance never shows it again', async () => {
    const snap = boundSnapshot()
    const w = mountWith(snap)
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    await w.find('button.primary').trigger('click')
    expect(w.emitted('continue'), 'the shell is told it is done').toHaveLength(1)
    expect(w.find('[role="dialog"]').exists(), 'gone the moment it is read').toBe(false)
    // ...and a later week of the SAME bound career does not bring it back.
    useGameStore().snapshot = { ...snap, week: snap.week + 9 }
    await w.vm.$nextTick()
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    w.unmount()
  })

  it('⭐ ...and a RELOAD does not re-open it – the record outlives the component', async () => {
    // The half a per-instance flag could not keep, and the half the player would notice: the popup
    // has no dismiss beyond Continue, so a briefing that came back on every launch would be the
    // nagging the owner explicitly did not ask for.
    const snap = boundSnapshot()
    const first = mountWith(snap)
    await first.find('button.primary').trigger('click')
    first.unmount()

    setActivePinia(createPinia())
    const second = mountWith(snap)
    expect(second.find('[role="dialog"]').exists(), 'read once, and once only').toBe(false)
    expect(second.findAll('button').length).toBe(0)
    second.unmount()
  })

  it('⚠ a SECOND CAREER gets its own – careers advance independently', async () => {
    // The R9-21b lesson, which every other watermark in this app already carries: a global key would
    // silence a briefing one career has never been shown because another one has.
    const one = boundSnapshot('career-one')
    const two = boundSnapshot('career-two')
    expect(one.careerId).not.toBe(two.careerId)

    const w1 = mountWith(one)
    await w1.find('button.primary').trigger('click')
    w1.unmount()

    setActivePinia(createPinia())
    const w2 = mountWith(two)
    expect(w2.find('[role="dialog"]').exists(), 'a different career has not been briefed').toBe(true)
    w2.unmount()
  })

  it('an UNBRIEFED save is one that has never been told – the default is to show it', () => {
    // The asymmetry, and it is the fix reaching the career that reported the problem: his own save
    // has been inside the top 50 for seasons and carries no watermark, so it gets the briefing once
    // on its next launch. Showing it twice costs a tap; never showing it is the item.
    const snap = boundSnapshot('already-past-it')
    expect(backing.size, 'nothing stored for this career').toBe(0)
    const w = mountWith(snap)
    expect(w.find('[role="dialog"]').exists()).toBe(true)
    w.unmount()
  })
})

describe('⭐ round-17 #3 – every line on the card is legible against what it sits on', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('the lead, the asks and the costs all clear WCAG AA through the real cascade', () => {
    // The lesson BirthdayDialog paid for: `var(--card, #fff)` shipped four unreadable buttons on the
    // one dialog that could not be dismissed, and every structural test in its file passed. This card
    // is the same species – a blocking popup whose only exit is reading it – so the ratio is measured
    // rather than a token name being pinned.
    useGameStore().snapshot = boundSnapshot()
    const w = mount(TourBriefingDialog, { attachTo: document.body })

    assertLegible(document.querySelector('.tour-briefing-lead')!, 'tour-briefing-lead')
    assertLegible(document.querySelector('.tour-briefing-closing')!, 'tour-briefing-closing')

    const asks = document.querySelectorAll('li.tour-briefing-ask')
    expect(asks.length, 'not vacuous – there are rows to measure').toBeGreaterThan(2)
    for (const ask of asks) {
      assertLegible(ask.querySelector('.tour-briefing-ask-what')!, 'tour-briefing-ask-what')
      assertLegible(ask.querySelector('.tour-briefing-ask-detail')!, 'tour-briefing-ask-detail')
    }
    const costs = document.querySelectorAll('.tour-briefing-costs li')
    expect(costs.length).toBeGreaterThan(3)
    for (const cost of costs) assertLegible(cost, 'tour-briefing-cost')
    w.unmount()
  })
})
