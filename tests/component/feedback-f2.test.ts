// F2 OF THE FEEDBACK WAVE – THE CONTROL, THE DIALOG, AND THE STORE'S FEED INTO THE ERROR RING
// (docs/specs/feedback-channel-2026-09.md). F1's adapter is measured in tests/feedback-f1.test.ts with no DOM; this file MOUNTS THE
// REAL SCREEN, because «the control is reachable and the dialog fits a phone» is a claim about what a player can press, and a
// source grep proves only that a template mentions a name.
//
// ⚠ THE ONLY MOCKS: `assembleReport` and `shareReport` (spies, so a test can say WHICH report went where and WHEN it was made) and
// the worker client's `request` (there is no worker in this runner, and the store's boot arms need it to fail on cue). Every
// constant, both line builders, the ring, the store and MoreScreen are the real ones.
//
// ⚠ THE RING IS MODULE-SCOPE AND SHARED BY THE TESTS IN THIS FILE. The list test counts its rows from a fresh ring, so it runs
// before anything else records one, and the store tests run last – they are the only writers.
//
// ⚠ EACH ARM WAS MUTATED (30.09), ALONE, AND WATCHED TURN RED, then restored byte for byte – the table is what to break to see it again:
//   FeedbackDialog: `await assembleReport()` added inside `send` (assembling ON Send)        -> "assembles once at open, passes THAT object ..."
//   FeedbackDialog: `await Promise.resolve()` ahead of `shareReport(report)`                 -> the same test (the share call is asserted INSIDE the tap: «called 1 times, but got 0»)
//   FeedbackDialog: `const buildLine = appBuildLine()` -> `''`                                -> "lists the build line, the error count ..."
//   FeedbackDialog: `ref(errorTail().length)` -> `ref(0)` and the re-read dropped             -> the same test (the one-row phase)
//   FeedbackDialog: the `file === null` ternary flipped                                       -> "says the no-career sentence ...", the list test and both preparation tests
//   src/feedback.ts: FEEDBACK_ADDRESS -> the brAke spelling (the owner's own typo)            -> the list test (the address as ruled 30.09)
//   MoreScreen: the control's `<button>` removed                                              -> 12 of the 14 tests (everything that opens the dialog)
//   FeedbackDialog: an inline `max-height: none` on the card + a 900px block inside it        -> "its dismiss control sits inside 375x667 ..." (dismiss at y=896..934, cap NONE)
//     ⚠ THE CONTROL ARM: the SAME 900px block with the shared bound KEPT stays GREEN (14 of 14). The shared `.dialog-card` cap absorbs growth by
//     design, so «grow the card» alone is not a mutation of this test – the bound is what it guards.
//   FeedbackDialog: the 'shared' / 'fallback' (file) / 'fallback' (no file) / 'nothing' branch, each broken alone -> the matching outcome test
//   stores/game.ts: the `recordError` line in `run`'s catch dropped                           -> "a failed command lands in errorTail ..."
//   stores/game.ts: the probe line, and the boot-catch line, each dropped alone               -> "a refused boot probe and a crashed boot ..."
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { appBuildLine } from '../../src/composables/buildInfo'
import { errorTail, recordError } from '../../src/errorBuffer'
import {
  assembleReport,
  shareReport,
  FEEDBACK_CLOSE_LABEL as feedbackCloseLabel,
  FEEDBACK_HOLDS_LINE as feedbackHoldsLine,
  FEEDBACK_LABEL as feedbackLabel,
  FEEDBACK_PRIVACY_LINE as feedbackPrivacyLine,
  FEEDBACK_SAVE_LINE as feedbackSaveLine,
  FEEDBACK_SAVE_PENDING_LINE as feedbackSavePendingLine,
  FEEDBACK_SEND_LABEL as feedbackSendLabel,
  REPORT_ATTACH_LINE as reportAttachLine,
  REPORT_NO_CAREER_LINE as reportNoCareerLine,
  REPORT_NO_ERRORS_LINE as reportNoErrorsLine,
  type Report,
} from '../../src/feedback'
import { request } from '../../src/worker/client'
// ⚠ THE APP'S OWN STYLESHEET – without it `.dialog-card`'s height cap is not in the cascade and the fit measurement is vacuous.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'

vi.mock('../../src/feedback', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/feedback')>()
  return { ...actual, assembleReport: vi.fn(), shareReport: vi.fn() }
})
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})

// ⚠ L2-11 (RU-15, 08.10) – PREMISE MOVE, COUNTED: the ten sentence constants are THUNKS over `t()` now (a module constant froze the language the
// module was imported in). No catalog is installed here, so each reads the English it read as a constant – evaluated ONCE, under the old names, and
// every assertion below is unchanged. The words are the module's, not retyped in this file.
const FEEDBACK_CLOSE_LABEL = feedbackCloseLabel()
const FEEDBACK_HOLDS_LINE = feedbackHoldsLine()
const FEEDBACK_LABEL = feedbackLabel()
const FEEDBACK_PRIVACY_LINE = feedbackPrivacyLine()
const FEEDBACK_SAVE_LINE = feedbackSaveLine()
const FEEDBACK_SAVE_PENDING_LINE = feedbackSavePendingLine()
const FEEDBACK_SEND_LABEL = feedbackSendLabel()
const REPORT_ATTACH_LINE = reportAttachLine()
const REPORT_NO_CAREER_LINE = reportNoCareerLine()
const REPORT_NO_ERRORS_LINE = reportNoErrorsLine()

const assembleMock = vi.mocked(assembleReport)
const shareMock = vi.mocked(shareReport)
const requestMock = vi.mocked(request)

const FILENAME = 'tennis-sim_9_w3.tsave'
function reportWith(file: boolean): Report {
  const attached = new File([new Uint8Array([1, 2, 3])], FILENAME, { type: 'application/octet-stream' })
  return { text: 'F2-REPORT-TEXT', file: file ? attached : null }
}

const mounted: Array<{ unmount: () => void }> = []
/** MoreScreen asks the worker for the career list on mount and there is no worker in this runner; the same replacement every other
 *  mounted MoreScreen test makes. ATTACHED, because the fit measurement reads the cascade a player gets. */
function mountMore() {
  const store = useGameStore()
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  const w = mount(MoreScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
  mounted.push(w)
  return w
}
type More = ReturnType<typeof mountMore>

beforeEach(() => {
  setActivePinia(createPinia())
  assembleMock.mockReset()
  assembleMock.mockImplementation(async () => reportWith(true))
  shareMock.mockReset()
  shareMock.mockResolvedValue('shared')
  requestMock.mockReset()
})

afterEach(() => {
  while (mounted.length > 0) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const dialogEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.dialog-overlay [role="dialog"]')
function dialog(): HTMLElement {
  const el = dialogEl()
  if (el === null) throw new Error('the feedback dialog is not open')
  return el
}
const controls = (): HTMLButtonElement[] => [...dialog().querySelectorAll('button')]
function control(label: string): HTMLButtonElement {
  const found = controls().find((c) => c.textContent?.trim() === label)
  if (found === undefined) throw new Error(`no «${label}» button in the dialog`)
  return found
}
const listed = (): string[] => [...dialog().querySelectorAll('li')].map((li) => li.textContent?.trim() ?? '')
const paragraphs = (): string[] => [...dialog().querySelectorAll('p')].map((p) => p.textContent?.trim() ?? '')

async function tapControl(w: More): Promise<HTMLElement> {
  const button = w.findAll('button').find((b) => b.text() === FEEDBACK_LABEL)
  expect(button, `a «${FEEDBACK_LABEL}» control is on the Saves tab`).toBeTruthy()
  await button!.trigger('click')
  await flushPromises()
  return dialog()
}
async function openDialog(w: More): Promise<HTMLElement> {
  const tab = w.findAll('.more-tabs .tab-pill').find((p) => p.text() === 'Saves')
  expect(tab, 'the Saves tab exists').toBeTruthy()
  await tab!.trigger('click')
  return tapControl(w)
}
async function closeDialog(): Promise<void> {
  control(FEEDBACK_CLOSE_LABEL).click()
  await flushPromises()
}

describe('the control', () => {
  it('sits in More beside the Saves strip – reachable with NO career open – and the tap, not the screen, prepares the report', async () => {
    const w = mountMore()
    expect(useGameStore().snapshot, 'no career is open in this mount').toBeNull()
    await w.findAll('.more-tabs .tab-pill').find((p) => p.text() === 'Saves')!.trigger('click')
    expect(assembleMock, 'opening the tab prepares nothing').not.toHaveBeenCalled()
    expect(dialogEl()).toBeNull()

    const card = await tapControl(w)
    expect(assembleMock).toHaveBeenCalledTimes(1)
    expect(card.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(card.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(FEEDBACK_LABEL)
  })

  it('closes from Close and from the scrim, and every open prepares a FRESH report', async () => {
    const w = mountMore()
    await openDialog(w)
    await closeDialog()
    expect(dialogEl()).toBeNull()

    await tapControl(w)
    expect(assembleMock).toHaveBeenCalledTimes(2)
    document.querySelector<HTMLElement>('.dialog-overlay')!.click() // the scrim itself: `@click.self`
    await flushPromises()
    expect(dialogEl()).toBeNull()
  })
})

describe('Send hands over THE report the dialog prepared', () => {
  it('assembles once at open, passes THAT object to shareReport, and reaches it inside the tap', async () => {
    const made: Report[] = []
    assembleMock.mockImplementation(async () => {
      const r = reportWith(true)
      made.push(r)
      return r
    })
    const w = mountMore()
    await openDialog(w)
    expect(made).toHaveLength(1)

    control(FEEDBACK_SEND_LABEL).click()
    // ⚠ NO `await` BETWEEN THE TAP AND THIS LINE, on purpose: iOS Safari wants `navigator.share` inside the tap's user activation, and
    // an `await` ahead of `shareReport` in the click handler is exactly the gap that loses it. Asserted synchronously.
    expect(shareMock).toHaveBeenCalledTimes(1)
    expect(shareMock.mock.calls[0][0], 'the very object assembleReport returned – not a copy, not a second assembly').toBe(made[0])
    await flushPromises()
    expect(assembleMock, 'Send prepared nothing of its own').toHaveBeenCalledTimes(1)
  })

  it('cannot be pressed before the report is ready, and is the moment it is', async () => {
    let release!: (r: Report) => void
    assembleMock.mockImplementation(
      () =>
        new Promise<Report>((resolve) => {
          release = resolve
        }),
    )
    const w = mountMore()
    await openDialog(w)
    const send = control(FEEDBACK_SEND_LABEL)
    expect(send.disabled).toBe(true)
    expect(listed()[2]).toBe(FEEDBACK_SAVE_PENDING_LINE)
    send.click()
    expect(shareMock, 'a disabled Send shares nothing').not.toHaveBeenCalled()

    release(reportWith(true))
    await flushPromises()
    expect(control(FEEDBACK_SEND_LABEL).disabled).toBe(false)
    expect(listed()[2]).toBe(FEEDBACK_SAVE_LINE)
  })

  it('a preparation that somehow rejects still ends in a pressable Send and the no-career line', async () => {
    assembleMock.mockRejectedValue(new Error('assemble blew up'))
    const w = mountMore()
    await openDialog(w)
    expect(control(FEEDBACK_SEND_LABEL).disabled).toBe(false)
    expect(listed()[2]).toBe(REPORT_NO_CAREER_LINE)
  })
})

describe('the dialog says honestly what will be sent', () => {
  it('lists the build line, the error count – none, one, many – the save, and where it goes', async () => {
    expect(errorTail(), 'a fresh ring: nothing above this test records an error').toHaveLength(0)
    const w = mountMore()
    await openDialog(w)
    expect(paragraphs()).toContain(FEEDBACK_HOLDS_LINE)
    expect(listed()).toEqual([appBuildLine(), REPORT_NO_ERRORS_LINE, FEEDBACK_SAVE_LINE])
    // The address AS RULED 30.09 (the spec's `feedback@ties-break.com`; the brAke spelling was his typo), spelled here on purpose so the
    // constant cannot drift under its own test.
    expect(paragraphs()).toContain('Send it to feedback@ties-break.com')
    expect(paragraphs()).toContain(FEEDBACK_PRIVACY_LINE)

    await closeDialog()
    recordError('error', new Error('F2-LINES-ONE'))
    await tapControl(w)
    expect(listed()[1]).toBe('1 recent error')

    await closeDialog()
    recordError('rejection', new Error('F2-LINES-TWO'))
    recordError('error', new Error('F2-LINES-THREE'))
    await tapControl(w)
    expect(listed()[1]).toBe('3 recent errors')
  })

  it('says the no-career sentence, and not the save line, when the report has no file', async () => {
    assembleMock.mockImplementation(async () => reportWith(false))
    const w = mountMore()
    await openDialog(w)
    expect(listed()[2]).toBe(REPORT_NO_CAREER_LINE)
    expect(dialog().textContent).not.toContain(FEEDBACK_SAVE_LINE)
  })
})

describe('what the dialog does with the outcome of Send', () => {
  async function sendFrom(outcome: 'shared' | 'fallback' | 'nothing', file: boolean): Promise<void> {
    shareMock.mockResolvedValue(outcome)
    assembleMock.mockImplementation(async () => reportWith(file))
    const w = mountMore()
    await openDialog(w)
    control(FEEDBACK_SEND_LABEL).click()
    await flushPromises()
  }

  it("'shared' closes the dialog", async () => {
    await sendFrom('shared', true)
    expect(dialogEl()).toBeNull()
  })

  it("'fallback' swaps the body to the attach instruction, and Close is all that is left", async () => {
    await sendFrom('fallback', true)
    expect(paragraphs()).toContain(REPORT_ATTACH_LINE)
    expect(listed(), 'the list is gone').toEqual([])
    expect(controls().map((b) => b.textContent?.trim())).toEqual([FEEDBACK_CLOSE_LABEL])
  })

  it("'fallback' with no file has nothing to attach – it closes rather than say «attach» over a download that never happened", async () => {
    await sendFrom('fallback', false)
    expect(dialogEl()).toBeNull()
  })

  it("'nothing' – the sheet was dismissed – stays exactly as it was, and Send can be pressed again", async () => {
    await sendFrom('nothing', true)
    expect(dialogEl()).not.toBeNull()
    expect(paragraphs()).not.toContain(REPORT_ATTACH_LINE)
    expect(listed()).toHaveLength(3)
    expect(control(FEEDBACK_SEND_LABEL).disabled).toBe(false)
  })
})

describe('⚠ the dialog fits a phone (CLAUDE.md, round-20 #3)', () => {
  // CLAUDE.md's rule: «any dialog you add or LENGTHEN gets a mounted assertion that its dismiss control's box is inside 375x667».
  // It is a BLOCKING overlay: a card taller than the screen that scrolls nowhere leaves the player nothing to press. The shared
  // `.dialog-card` carries the height cap and the scroller, so the assertion is also that this card KEEPS them – the mutation that
  // turns it red grows the card past the screen AND takes the bound off, because the shared cap alone already absorbs growth.
  it('its dismiss control sits inside 375x667 – in the ready state with the longest save line, and in the attach state', async () => {
    setViewport(PHONE) // ⚠ BEFORE the mount: happy-dom caches a media query on the first computed-style read.
    assembleMock.mockImplementation(async () => reportWith(false)) // the no-career sentence is the longest save line
    const w = mountMore()
    const ready = await openDialog(w)
    expect(ready.classList.contains('dialog-card')).toBe(true)
    const dismiss = ready.querySelector('.dialog-actions')!
    expect(dismiss.contains(control(FEEDBACK_CLOSE_LABEL))).toBe(true)
    assertDismissReachable(ready, dismiss, PHONE, 'the feedback dialog, ready state')

    await closeDialog()
    assembleMock.mockImplementation(async () => reportWith(true))
    shareMock.mockResolvedValue('fallback')
    await tapControl(w)
    control(FEEDBACK_SEND_LABEL).click()
    await flushPromises()
    expect(paragraphs()).toContain(REPORT_ATTACH_LINE)
    const attach = dialog()
    assertDismissReachable(attach, attach.querySelector('.dialog-actions')!, PHONE, 'the feedback dialog, attach state')
  })
})

describe('the store feeds the ring (stores/game.ts – three lines, each on a real failure path)', () => {
  it('a failed command lands in errorTail, and the player still gets the same sentence', async () => {
    const game = useGameStore()
    await game.run(async () => {
      throw new Error('F2-RUN-MARK')
    })
    expect(game.error).toBe('F2-RUN-MARK')
    expect(errorTail().map((e) => e.message)).toContain('F2-RUN-MARK')
  })

  it('a refused boot probe and a crashed boot both land in errorTail, and the recovery screen still gets its own text', async () => {
    const game = useGameStore()
    requestMock.mockResolvedValueOnce({ id: 1, ok: false, error: 'F2-PROBE-MARK', code: 'UNKNOWN', revision: 0 } as never)
    await game.init()
    expect(game.phase).toBe('recovery')
    expect(game.initError).toBe('F2-PROBE-MARK')
    expect(errorTail().map((e) => e.message)).toContain('F2-PROBE-MARK')

    requestMock.mockRejectedValueOnce(new Error('F2-BOOT-MARK'))
    await game.init()
    expect(game.initError).toBe('F2-BOOT-MARK')
    expect(errorTail().map((e) => e.message)).toContain('F2-BOOT-MARK')
  })
})
