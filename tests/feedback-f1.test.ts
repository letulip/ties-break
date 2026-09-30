// F1 OF THE FEEDBACK WAVE – the error ring, the report and the transport adapter
// (docs/specs/feedback-channel-2026-09.md). No UI here: F2 owns the control, the dialog and the
// strings table, and its mounted tests own "reachable inside 375x667".
//
// ⚠ NO DOM, ON PURPOSE. The unit project is `node`; the module under test takes its doors from
// `globalThis` at CALL time (`navigator`, `document`, `URL.createObjectURL`), so each test stubs
// exactly the doors a path touches and records what came out. The only mock is the worker client:
// `request` is where the Saves strip's own export question is asked (src/stores/game.ts).
//
// ⚠ EACH ARM WAS MUTATED (30.09) AND WATCHED TURN RED, then restored – the table is what to break to
// see it again:
//   ring.length > CAPACITY            -> >=                        "keeps exactly the last 20"
//   the `wired.has(target)` guard     -> deleted                   "lands window errors AND ..."
//   tail rows in assembleReport       -> dropped                   "carries the build line first ..."
//   `[res.bytes]` in the File         -> other bytes               "attaches the Saves strip own bytes"
//   the `whole.length <=` early exit  -> unconditional              "(c) with neither ..."
//   `encodeURIComponent(wellFormed)`  -> bare encodeURIComponent   "(c) survives a cut ..."
//   the `reportBridge !== null` arm   -> never taken               "(b) the bridge ..."
//   a `fetch` call added to (c)       -> present                   "touches no network door ..."
//   an import from ./engine/world     -> present                   "imports nothing from src/engine ..."
//
// ⚠ THE RING IS MODULE-SCOPE AND SHARED BY THE TESTS IN THIS FILE, so no test assumes it is empty:
// each pushes its own uniquely-marked rows and reads only what it pushed.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { codeOf } from './helpers/source'
import { appBuildLine } from '../src/composables/buildInfo'
import { ERROR_BUFFER_CAPACITY, errorTail, installErrorBuffer, recordError } from '../src/errorBuffer'
import {
  FEEDBACK_ADDRESS,
  MAILTO_BODY_MAX,
  REPORT_ATTACH_LINE,
  REPORT_NO_CAREER_LINE,
  REPORT_SUBJECT,
  REPORT_TAIL_HEADING,
  REPORT_TRUNCATED_LINE,
  assembleReport,
  reportBridge,
  setReportBridge,
  shareReport,
  type Report,
} from '../src/feedback'
import { request } from '../src/worker/client'

vi.mock('../src/worker/client', () => ({ request: vi.fn() }))

type Spy = ReturnType<typeof vi.fn>
interface Anchor {
  href: string
  download: string
  click: () => void
}
interface Click {
  href: string
  download: string
}

const FILENAME = 'tennis-sim_42_w7.tsave'
const FAKE_BLOB_URL = 'blob:fake-report-file'
/** Not text on purpose: a NUL and a high byte, so anything that re-encodes it as a string shows. */
const BYTES = new Uint8Array([84, 83, 65, 86, 69, 0, 255, 1, 2, 3])

function exportReply(): unknown {
  return { id: 1, ok: true, type: 'exported', bytes: BYTES.slice().buffer, filename: FILENAME, revision: 3 }
}
const NO_CAREER = { id: 2, ok: false, error: 'No active career', code: 'UNKNOWN', revision: 0 }

const requestMock = vi.mocked(request) as unknown as Spy
/** Every `<a>` the module clicked, in order, as it stood at the click. A download and a mailto are
 *  told apart by `download` and by `href`. */
let clicks: Click[]
let network: Record<'fetch' | 'xhr' | 'beacon' | 'webSocket', Spy>

function stubNavigator(extra: Record<string, unknown> = {}): void {
  vi.stubGlobal('navigator', { sendBeacon: network.beacon, ...extra })
}

function expectNoNetwork(): void {
  for (const [door, spy] of Object.entries(network)) expect(spy, door).not.toHaveBeenCalled()
}

beforeEach(() => {
  clicks = []
  network = { fetch: vi.fn(), xhr: vi.fn(), beacon: vi.fn(), webSocket: vi.fn() }
  vi.stubGlobal('fetch', network.fetch)
  vi.stubGlobal(
    'XMLHttpRequest',
    class {
      constructor() {
        network.xhr()
      }
    },
  )
  vi.stubGlobal(
    'WebSocket',
    class {
      constructor() {
        network.webSocket()
      }
    },
  )
  vi.stubGlobal('document', {
    createElement: (): Anchor => {
      const a: Anchor = { href: '', download: '', click: () => clicks.push({ href: a.href, download: a.download }) }
      return a
    },
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(FAKE_BLOB_URL)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  stubNavigator() // a device with no Web Share; tests that want one restub
  requestMock.mockReset()
  requestMock.mockResolvedValue(exportReply())
})

afterEach(() => {
  setReportBridge(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the error ring (src/errorBuffer.ts)', () => {
  it('keeps exactly the last 20 – push 25 and the first 5 are gone', () => {
    expect(ERROR_BUFFER_CAPACITY).toBe(20)
    for (let i = 0; i < 25; i++) recordError('error', new Error(`ring-${i}`))
    const tail = errorTail()
    expect(tail).toHaveLength(20)
    expect(tail.map((e) => e.message)).toEqual(Array.from({ length: 20 }, (_, i) => `ring-${i + 5}`))
  })

  it('lands window errors AND unhandled rejections, once each however often it is installed', () => {
    const target = new EventTarget()
    installErrorBuffer(target)
    installErrorBuffer(target)
    const onerror = new TypeError('onerror-boom')
    target.dispatchEvent(Object.assign(new Event('error'), { message: 'onerror-boom', error: onerror }))
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new Error('rejection-boom') }))
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'a plain string' }))
    // A cross-origin script error carries no Error object at all – the message is what there is.
    target.dispatchEvent(Object.assign(new Event('error'), { message: 'Script error.', error: null }))

    const last = errorTail().slice(-4)
    expect(last.map((e) => `${e.kind}:${e.message}`)).toEqual([
      'error:onerror-boom',
      'rejection:rejection-boom',
      'rejection:a plain string',
      'error:Script error.',
    ])
    expect(last[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(last[0].stack?.split('\n').length).toBeLessThanOrEqual(3)
    expect(last[2].stack).toBeUndefined()
  })

  it('hands out copies, never the ring itself', () => {
    recordError('error', new Error('copy-check'))
    const first = errorTail()
    first.length = 0
    const second = errorTail()
    expect(second.at(-1)?.message).toBe('copy-check')
    second[second.length - 1].message = 'tampered'
    expect(errorTail().at(-1)?.message).toBe('copy-check')
  })

  it('never throws, whatever it is handed – it runs inside the error handlers', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const bomb = {}
    Object.defineProperty(bomb, 'message', {
      get() {
        throw new Error('getter bomb')
      },
    })
    for (const value of [undefined, null, 42, 10n, Symbol('s'), circular, bomb, { message: 42 }]) {
      expect(() => recordError('rejection', value)).not.toThrow()
    }
  })
})

describe('the report (assembleReport)', () => {
  it('carries the build line first and the error tail after it, one row per entry, newest first', async () => {
    recordError('error', new Error('MARK-TAIL-OLDER'))
    recordError('rejection', new Error('MARK-TAIL-NEWER'))
    const { text } = await assembleReport()
    const lines = text.split('\n')
    expect(lines[0]).toBe(appBuildLine())
    expect(lines).toContain(REPORT_TAIL_HEADING)
    const rows = lines.filter((l) => l.includes('MARK-TAIL-'))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toContain('MARK-TAIL-NEWER')
    expect(rows[0]).toContain('rejection')
    expect(rows[1]).toContain('MARK-TAIL-OLDER')
    expect(rows[1]).toContain('error')
  })

  it("attaches the Saves strip's own bytes – the worker's exportSave reply, unchanged", async () => {
    const { file } = await assembleReport()
    expect(requestMock).toHaveBeenCalledWith({ type: 'exportSave' })
    expect(file).not.toBeNull()
    const attached = file as File
    expect(attached.name).toBe(FILENAME)
    expect(attached.type).toBe('application/octet-stream')
    expect(new Uint8Array(await attached.arrayBuffer())).toEqual(BYTES)
  })

  it('asks the worker the very question the Saves strip asks, and gives the file its very type', () => {
    // ⚠ A TWIN PIN, and honest about it: `game.exportSave()` downloads inside `runOp` and returns
    // nothing, so it cannot be called for the bytes. These lines are what keeps the two from drifting
    // apart unseen – change the store's message or Blob type and this goes red, and F1's file with it.
    const store = code('src/stores/game.ts')
    const mine = code('src/feedback.ts')
    expect(store).toContain("request({ type: 'exportSave' })")
    expect(mine).toContain("request({ type: 'exportSave' })")
    expect(store).toContain("new Blob([res.bytes], { type: 'application/octet-stream' })")
    expect(mine).toContain("const SAVE_FILE_TYPE = 'application/octet-stream'")
  })

  it('says so when there is no career – a null file, never a throw', async () => {
    for (const arrange of [
      () => requestMock.mockResolvedValue(NO_CAREER),
      () => requestMock.mockRejectedValue(new Error('worker gone')),
    ]) {
      arrange()
      const report = await assembleReport()
      expect(report.file).toBeNull()
      expect(report.text).toContain(REPORT_NO_CAREER_LINE)
      expect(report.text.split('\n')[0]).toBe(appBuildLine())
    }
  })
})

describe('shareReport – the three backends', () => {
  it('(a) shares the file through the Web Share API and downloads NOTHING', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    stubNavigator({ share, canShare })

    expect(await shareReport()).toBe('shared')
    expect(canShare).toHaveBeenCalledWith({ files: [expect.any(File)] })
    expect(share).toHaveBeenCalledTimes(1)
    expect(share).toHaveBeenCalledWith({
      files: [expect.any(File)],
      text: expect.stringContaining(appBuildLine()),
      title: REPORT_SUBJECT,
    })
    expect(share.mock.calls[0][0].files[0].name).toBe(FILENAME)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(clicks).toEqual([]) // no download and no mailto
  })

  it('(a) a dismissed share sheet is "nothing"; any other refusal falls through to the fallback', async () => {
    const dismissed = Object.assign(new Error('Share canceled'), { name: 'AbortError' })
    stubNavigator({ share: vi.fn().mockRejectedValue(dismissed), canShare: () => true })
    expect(await shareReport()).toBe('nothing')
    expect(clicks).toEqual([])

    const refused = Object.assign(new Error('needs a user gesture'), { name: 'NotAllowedError' })
    stubNavigator({ share: vi.fn().mockRejectedValue(refused), canShare: () => true })
    expect(await shareReport()).toBe('fallback')
    expect(clicks).toHaveLength(2)
  })

  it('(b) the bridge is checked before the fallback – and after the Web Share API', async () => {
    const bridge = vi.fn().mockResolvedValue(true)
    setReportBridge(bridge)
    expect(reportBridge).toBe(bridge)

    expect(await shareReport()).toBe('shared')
    expect(bridge).toHaveBeenCalledTimes(1)
    const sent = bridge.mock.calls[0][0] as Report
    expect(sent.file?.name).toBe(FILENAME)
    expect(sent.text).toContain(appBuildLine())
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(clicks).toEqual([]) // the bridge won: nothing downloaded, no mailto

    // A shell that declines (false) or fails (throws) hands over to the fallback.
    for (const declining of [vi.fn().mockResolvedValue(false), vi.fn().mockRejectedValue(new Error('no plugin'))]) {
      clicks.length = 0
      setReportBridge(declining)
      expect(await shareReport()).toBe('fallback')
      expect(declining).toHaveBeenCalledTimes(1)
      expect(clicks).toHaveLength(2)
    }

    // And where the device CAN share the file, the sheet goes first and the shell is never asked.
    const later = vi.fn().mockResolvedValue(true)
    setReportBridge(later)
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share, canShare: () => true })
    expect(await shareReport()).toBe('shared')
    expect(share).toHaveBeenCalledTimes(1)
    expect(later).not.toHaveBeenCalled()
  })

  it('(c) with neither: downloads the file, then opens a mailto whose ENCODED body is at most 1,800 characters', async () => {
    expect(MAILTO_BODY_MAX).toBe(1800)
    for (let i = 0; i < 20; i++) {
      recordError('error', new Error(`fill-${String(i).padStart(2, '0')} ${'x'.repeat(250)}`))
    }

    expect(await shareReport()).toBe('fallback')
    expect(clicks).toHaveLength(2)
    expect(clicks[0]).toEqual({ href: FAKE_BLOB_URL, download: FILENAME }) // the download comes first
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(File))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(FAKE_BLOB_URL)

    const link = clicks[1].href
    expect(clicks[1].download).toBe('')
    expect(link.startsWith(`mailto:${FEEDBACK_ADDRESS}?subject=${encodeURIComponent(REPORT_SUBJECT)}&body=`)).toBe(true)
    const encodedBody = link.split('&body=')[1]
    expect(encodedBody.length).toBeLessThanOrEqual(MAILTO_BODY_MAX)
    expect(link.length).toBeLessThanOrEqual(2000) // the whole link, the ~2KB the spec warns of
    const body = decodeURIComponent(encodedBody)
    expect(body.startsWith(REPORT_ATTACH_LINE)).toBe(true) // mailto cannot attach: it asks
    expect(body).toContain(appBuildLine())
    expect(body).toContain('fill-19') // the newest row survives ...
    expect(body).not.toContain('fill-00') // ... and what a cut loses is the oldest
    expect(body.endsWith(REPORT_TRUNCATED_LINE)).toBe(true)
  })

  it('(c) with no career there is no download – the mailto alone, saying so – and the sheet is not tried', async () => {
    requestMock.mockResolvedValue(NO_CAREER)
    const share = vi.fn()
    stubNavigator({ share, canShare: () => true })

    expect(await shareReport()).toBe('fallback')
    expect(share).not.toHaveBeenCalled() // the Web Share backend is a FILES share
    expect(clicks).toHaveLength(1)
    const body = decodeURIComponent(clicks[0].href.split('&body=')[1])
    expect(body).toContain(REPORT_NO_CAREER_LINE)
    expect(body).not.toContain(REPORT_ATTACH_LINE)
  })

  it('(c) survives a cut inside an emoji and a lone surrogate, and uses a prepared report as given', async () => {
    // `encodeURIComponent` throws URIError on a lone surrogate; a cut through an emoji makes one.
    const prepared: Report = { text: `\uD83D lone first ${'\u{1F600}'.repeat(900)}`, file: null }
    requestMock.mockReset()

    expect(await shareReport(prepared)).toBe('fallback')
    expect(requestMock).not.toHaveBeenCalled() // a prepared report is not re-assembled
    expect(clicks).toHaveLength(1)
    const encodedBody = clicks[0].href.split('&body=')[1]
    expect(encodedBody.length).toBeLessThanOrEqual(MAILTO_BODY_MAX)
    expect(() => decodeURIComponent(encodedBody)).not.toThrow()
  })
})

describe('privacy and layering, by construction', () => {
  it('touches no network door – fetch, XHR, sendBeacon, WebSocket – on any path', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share, canShare: () => true })
    expect(await shareReport()) // (a)
      .toBe('shared')

    stubNavigator()
    setReportBridge(vi.fn().mockResolvedValue(true))
    expect(await shareReport()).toBe('shared') // (b)

    setReportBridge(null)
    expect(await shareReport()).toBe('fallback') // (c) with the file
    requestMock.mockResolvedValue(NO_CAREER)
    expect(await shareReport()).toBe('fallback') // (c) with no career
    await assembleReport()

    expect(share).toHaveBeenCalledTimes(1) // the paths really ran
    expectNoNetwork()
  })

  it('imports nothing from src/engine, and names no storage or network API in its code', () => {
    // ⚠ DIRECT IMPORTS ONLY, said out loud: `composables/buildInfo` – the build line, reused not
    // re-derived – imports the save-schema constant from the engine itself. That edge predates F1 and
    // is the Settings footer's; what this arm holds is that these two files add none of their own.
    const errorBuffer = code('src/errorBuffer.ts')
    const feedback = code('src/feedback.ts')
    expect(specifiersOf(errorBuffer)).toEqual([])
    expect(specifiersOf(feedback)).toEqual(['./composables/buildInfo', './errorBuffer', './worker/client'])
    for (const spec of [...specifiersOf(errorBuffer), ...specifiersOf(feedback)]) {
      expect(spec).not.toMatch(/(^|\/)engine(\/|$)/)
    }
    for (const source of [errorBuffer, feedback]) {
      expect(source).not.toMatch(
        /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB)\b/,
      )
    }
  })
})

/** A repo file with its comments taken out – the header prose names the very APIs a pin bans. */
function code(rel: string): string {
  return codeOf(readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8'))
}

/** Module specifiers of `import ... from`, `import 'x'` and `import('x')`, in source order. */
function specifiersOf(source: string): string[] {
  const found: string[] = []
  const re = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const m of source.matchAll(re)) found.push(m[1] ?? m[2] ?? m[3] ?? '')
  return found
}
