// ⭐⭐⭐ ROUND 42 #11 – CAN HE SEE THE COACH'S CUT ON THE SCREEN THAT COUNTS THE MONEY?
//
// THE OWNER, 15.09: «не вижу отчислений тренеру за победы на w серии нигде… мы это сделали вообще?»
//
// ⚠ THE MECHANIC WAS NEVER THE DEFECT. `finalizeTournament` has charged the coach 10% of a title
// cheque and 5% of a lost final since round 24 – gross, on the pro track, the W-series included –
// and `tests/team-share.test.ts` pins that wiring row by row, including the exact W15 text. What was
// missing is that on the Money screen the cents land in a plain `coaching` expense row and dissolve
// into the Coaching category with NOTHING naming them. This file is the naming, measured.
//
// ⚠ MOUNTED, NOT PINNED, and the fixture is a REAL title through the REAL till: `drivenFinish` is
// `tests/team-share.test.ts`'s own harness, carried here – a career ticked into a W15 play week with
// the finish set on `pendingTournament.result.finishes[KID_ID]`, which is exactly the field
// `finalizeTournament` reads. So the figure this screen prints was charged by the engine on a cheque
// the engine decided, and no fixture hand-writes a ledger row.
//
// ⚠ MUTATION-VERIFIED – every arm below was watched failing before it was believed. What each
// mutation reddened is recorded in the handoff for round 42 #11:
//   * `coachShareNote` returns null unconditionally  -> the naming arms go red, the SILENT arm stays
//     green (which is what makes the silent arm worth having).
//   * the `> 0` gate dropped from `coachShareNote`   -> the SILENT arm goes red, alone.
//   * `financeWindow` stops folding `coachCut`       -> the naming arms go red; the no-double-count
//     arm stays green, because the cents really are inside `byCategory.coaching` either way.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, the argument round 26 #16 wrote down for every mounted case over ~1s:
// this file mounts a real screen over a walked career, and GitHub's 2-core box runs it 4-5x slower
// than this machine. 30s can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  closeTournament,
  createWorld,
  openingCoachId,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { ECONOMY, staffPrizeShareCents, staffResultShareBps } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS } from '../../src/engine/season/calendar'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'
// ⭐ HIS STANDING RULE OF 14.09 – the visual pass is a deliverable. §3 says what this instrument can
// and cannot prove.
import { DESKTOP, PHONE, TABLET, availableWidth, boxOf, setViewport, type Viewport } from './fits'

/** The condition.test seed trick, carried verbatim from `tests/team-share.test.ts`: a private injury
 *  sub-stream that cannot fire before `through`, so a random layoff cannot turn the driven play week
 *  into a walkover. */
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

/** A coached career ticked INTO a W15 play week with the finish forced – `tests/team-share.test.ts`'s
 *  `drivenFinish`, which is the harness the charge itself is pinned through. `finish` is
 *  `finalizeTournament`'s own index: 0 = champion. */
function titledCareer(prefix: string, finish: number, coached: boolean): WorldState {
  const world = createWorld(injuryProofSeed(prefix, 6), DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0 // the pro ladder – `track === 'wta'`, which is what the share gates on
  world.coachId = coached ? openingCoachId(world.seed, { ...world.profile, coachTier: 'middle' }) : null
  world.physioActive = false
  world.season = []
  const event: SeasonEvent = {
    id: `r42-11-${prefix}`,
    week: 5,
    tier: 'w15',
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
  skipTournament(world)
  closeTournament(world)
  return world
}

function mountMoney(snapshot: Snapshot): VueWrapper {
  useGameStore().snapshot = snapshot
  return mount(MoneyScreen, { global: { stubs: { teleport: true } } })
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
const shareLine = (w: VueWrapper) => (w.find('.money-coach-share').exists() ? clean(w.find('.money-coach-share').text()) : null)

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// 1 – THE FIGURE IS ON THE SCREEN, AND IT IS THE ENGINE'S OWN
// =================================================================================================
describe('round 42 #11 – the coach\'s cut is named where the money is counted', () => {
  it('⭐⭐ a coached W15 title puts a named line on the Money screen, carrying the engine\'s cents', () => {
    const world = titledCareer('title', 0, true)
    const prize = TIERS.w15.prizeCents![0]
    // ⚠⚠ REBUILT FROM THE ENGINE'S OWN FUNCTION, never read back off the component or off the
    // snapshot field the component reads – the sibling files' hard-won rule: comparing a render with
    // the computed behind it is a sharing claim and stays green on any arithmetic at all.
    const expected = staffPrizeShareCents('coach', prize, 0)
    expect(expected, 'the fixture really paid the coach something').toBeGreaterThan(0)

    const snap = toSnapshot(world)
    expect(snap.finance.window12w.coachCutCents, 'the window carries what the till charged').toBe(expected)

    const line = shareLine(mountMoney(snap))
    expect(line, 'the Money screen draws no line about the coach\'s share at all').not.toBeNull()
    expect(line, 'the named line does not carry the cents the coach was paid').toContain(formatCents(expected))
    // ...and the rule beside the figure is the ENGINE's, never a typed percentage – round 29 #13's
    // binding rule on the coaches page, applied to the second surface that states it.
    expect(line).toContain(`${staffResultShareBps('coach', 0) / 100}%`)
    expect(line).toContain(`${staffResultShareBps('coach', 1) / 100}%`)
  })

  it('⭐ a LOST FINAL pays the half rate, and the line follows the cheque rather than the title', () => {
    // The second arm exists because a line that only ever fires on a title would answer half his
    // question: «за победы» is what he wrote, and the engine pays a runner-up too.
    const world = titledCareer('final', 1, true)
    const expected = staffPrizeShareCents('coach', TIERS.w15.prizeCents![1], 1)
    expect(expected, 'a final really pays the coach').toBeGreaterThan(0)
    const line = shareLine(mountMoney(toSnapshot(world)))
    expect(line).toContain(formatCents(expected))
  })

  it('⚠ …and it is SILENT on a career that has won nothing – there is nothing to name', () => {
    // The negative half, so the arms above cannot pass on a screen that always draws the line. A
    // first-round exit pays the coach nothing (`staffPrizeShareCents` returns 0 below a final), and
    // that is the honest answer rather than a «$0.00» row.
    const world = titledCareer('early-out', 4, true)
    const snap = toSnapshot(world)
    expect(staffPrizeShareCents('coach', TIERS.w15.prizeCents![4] ?? 0, 4), 'nothing is owed at this finish').toBe(0)
    expect(snap.finance.window12w.coachCutCents, 'and the window agrees').toBe(0)
    expect(shareLine(mountMoney(snap)), 'the screen invented a share nobody was paid').toBeNull()
  })

  it('⚠ a SELF-COACHED family is silent too – an empty seat owes no share', () => {
    const world = titledCareer('self', 0, false)
    expect(world.coachId, 'the fixture really has nobody on the bench').toBeNull()
    const snap = toSnapshot(world)
    expect(snap.finance.window12w.coachCutCents).toBe(0)
    expect(shareLine(mountMoney(snap))).toBeNull()
  })
})

// =================================================================================================
// 2 – A MEMO, NOT A COLUMN ROW: THE CHEQUE IS CHARGED EXACTLY ONCE
// =================================================================================================
//
// ⚠⚠ THE WEEK RECAP RULED THIS ONE WAY ALREADY (round 29 part two #13): the coach's share IS a real
// `coaching` expense written the same tick, so it is already inside Spent – «a fourth row would make
// the column charge one cheque twice». The Money screen's list is that column with percentages on
// it, so the same ruling binds here, and these are the arms that make it checkable rather than
// argued.
describe('round 42 #11 – the named line is a memo and the money is counted once', () => {
  it('⭐⭐ the cents are inside the Coaching row already, and the list gains no row for them', () => {
    const world = titledCareer('once', 0, true)
    const snap = toSnapshot(world)
    const share = snap.finance.window12w.coachCutCents
    expect(share, 'the arm needs a share to be double-counted').toBeGreaterThan(0)

    // The share is INSIDE the coaching bucket – so a screen that added the memo to a column would
    // book it twice. Asked of the window's own totals rather than of the component.
    const coaching = -(snap.finance.window12w.byCategory.coaching ?? 0)
    expect(coaching, 'the share is not inside the coaching category at all').toBeGreaterThanOrEqual(share)

    const wrapper = mountMoney(snap)
    // ⚠ THE COLUMN'S OWN ARITHMETIC IS UNTOUCHED: the rows are the expense categories and nothing
    // else, so a row for the share would show up here as a row the window does not have a category
    // for. `.money-row` is the class every StatRow in the list wears, plus the one income row.
    const rows = wrapper.findAll('.money-list .money-row')
    const labels = rows.map((r) => clean(r.text()))
    expect(labels.some((t) => t.startsWith('Coach\'s results share')), 'the share became a row in the spend column').toBe(false)
    // ...and the memo is outside the list's rows, where the screen already says things out loud.
    expect(wrapper.find('.money-coach-share').exists()).toBe(true)
    expect(wrapper.find('.money-coach-share').element.classList.contains('money-row')).toBe(false)
    // The screen's own «Spent» figure is the window's expense total – unchanged by the memo, which is
    // the whole no-double-count claim in one number.
    expect(clean(wrapper.findAll('.money-cell-figure')[1].text())).toBe(formatCents(-snap.finance.window12w.expenseCents))
  })

  it('⭐ the line names the window it is for, and follows the switcher', async () => {
    const world = titledCareer('window', 0, true)
    const wrapper = mountMoney(toSnapshot(world))
    // The 12-week window is the screen's own default.
    expect(shareLine(wrapper)).toContain('in the last 12 weeks')
    const season = wrapper.findAll('.money-window button.tab-pill').find((b) => clean(b.text()) === 'This season')
    expect(season, 'the season segment of the period switcher').toBeTruthy()
    await season!.trigger('click')
    // ⚠ «this season» is built from the switcher's own label rather than a third spelling of the
    // period – invariant 4's worked example is that very tab, and it is not ours to rephrase.
    expect(shareLine(wrapper)).toContain('this season')
    expect(shareLine(wrapper)).not.toContain('in the last 12 weeks')
  })
})

// =================================================================================================
// 3 – THE VISUAL SWEEP (his standing rule of 14.09)
// =================================================================================================
//
// «визуальную проверку на всех экранах надо тоже заложить в билдера в спеку при внесении правок» –
// the widths are the wave gate's own parity set, 375 / 768 / 900 / 1280.
//
// ⚠ WHAT THIS MEASURES AND WHAT IT DOES NOT. The new line is a WRAPPING paragraph in the category
// column, so it cannot push the page sideways the way a nowrap row can – the failure a paragraph
// really has is being drawn with no box at all (a cascade that never reaches it) or being pinned to
// one line by a stray `white-space`. Both are checked here, through the REAL sheet at each width.
// It is not a screenshot; the pixel pass is in the handoff.
describe('round 42 #11 – the named line is drawn on every width the screen has', () => {
  const WIDE_900: Viewport = { width: 900, height: 1024 }

  for (const vp of [PHONE, TABLET, WIDE_900, DESKTOP]) {
    it(`⭐ the line has a real box and wraps at ${vp.width}x${vp.height}`, async () => {
      // ⚠ setViewport BEFORE the mount – fits.ts's own trap: happy-dom caches a media query on an
      // element's first computed-style read.
      setViewport(vp)
      const world = titledCareer(`fit-${vp.width}`, 0, true)
      useGameStore().snapshot = toSnapshot(world)
      const wrapper = mount(MoneyScreen, {
        global: { stubs: { teleport: true } },
        attachTo: document.body,
      })
      const note = wrapper.find('.money-coach-share')
      expect(note.exists(), 'the line is not on the screen at this width').toBe(true)
      // ⚠⚠ THE `display` CHECK IS THE ONE THAT BITES, AND IT WAS ADDED AFTER A MUTATION WALKED PAST
      // THE OTHERS. `boxOf` stacks children off the cascade and answers a height for a `display:
      // none` element too – so a sheet rule that hid the line at one width scored as a perfect fit.
      // Measured, not reasoned: the first draft of this arm passed under exactly that mutation.
      expect(getComputedStyle(note.element).display, 'a rule hid the line at this width').not.toBe('none')
      expect(note.isVisible(), 'the line is in the tree but not on the screen').toBe(true)
      const room = availableWidth(note.element, vp)
      expect(room, 'the column left it no room at all').toBeGreaterThan(0)
      // A real box through the real cascade – this catches the other half: type that computes to
      // nothing (a zero font-size or line-height) rather than a rule that hides the box outright.
      expect(boxOf(note.element, room).h, 'the line computes to no height').toBeGreaterThan(0)
      // ...and it is inside the category column, with the rows it is about, rather than adrift.
      expect(note.element.closest('.money-list'), 'the line left the column the rows live in').toBeTruthy()
      // ...and it gives ground vertically rather than across, which is why a long sentence here can
      // never be the round-20 #3 failure.
      expect(getComputedStyle(note.element).whiteSpace, 'a wrapping paragraph was pinned to one line').not.toBe(
        'nowrap',
      )
      wrapper.unmount()
      document.body.innerHTML = ''
    })
  }
})
