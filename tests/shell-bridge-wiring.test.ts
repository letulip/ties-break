// THE SHELLS' ONE CONTACT WITH src (docs/specs/app-shells-2026-10.md §S3): src/main.ts hands a
// `window.__TIES_SHELL_BRIDGE__` function – when a wrapper defined one BEFORE the bundle ran – to the
// ReportBridge slot in src/feedback.ts. Generic on purpose: ANY shell that defines the global gets the
// slot, so no shell is named in src. Two halves, one file: (1) main.ts wires the slot; (2) the iOS
// shell's own bridge honours the contract F1 documents (shells/ios/bridge/shell-bridge.js).
//
// ⚠ HALF (1) IMPORTS main.ts FRESH FOR EVERY TEST. `reportBridge` is module state, and the global is read
// ONCE at boot, so a test that reused the module registry would be reading the previous test's wiring.
// `vi.resetModules()` + a dynamic import is the whole mechanism; every door main.ts opens at boot (the
// Vue app, pinia, the PWA registration, the audio and art installs) is replaced, so what is left to see
// is the one thing under test.
//
// ⚠ HALF (2) EVALUATES THE BRIDGE AS TEXT, the way a browser would run it: a classic script with `window`
// and `FileReader` in scope, against stand-in Capacitor plugins. No simulator is needed to pin what it
// RETURNS; what a real WKWebView does with the share sheet is the shell's smoke, not a unit test.
//
// ⚠ EACH ARM WAS MUTATED (01.10) AND WATCHED TURN RED, then restored – the table is what to break to
// see it again:
//   the `setReportBridge(...)` call in main.ts  -> deleted             "hands the function the shell defined ..."
//   the `typeof shellBridge === 'function'`     -> deleted             "ignores a global that is not a function"
//   `if (isCancel(err)) return true` in the bridge -> `if (false) ...` "a cancelled sheet counts ..."

import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import type { ReportBridge } from '../src/feedback'

vi.mock('vue', async (importOriginal) => {
  const app = { use: () => app, mount: () => app }
  return { ...(await importOriginal<typeof import('vue')>()), createApp: () => app }
})
vi.mock('pinia', async (importOriginal) => ({
  ...(await importOriginal<typeof import('pinia')>()),
  createPinia: () => ({}),
}))
vi.mock('../src/pwa', () => ({ initPwa: () => {} }))
vi.mock('../src/errorBuffer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/errorBuffer')>()),
  installErrorBuffer: () => {},
}))
vi.mock('../src/audio/sfx', () => ({ installGlobalSfx: () => {} }))
vi.mock('../src/art/autoPreload', () => ({ startArtPreloader: () => {} }))
vi.mock('../src/App.vue', () => ({ default: {} }))
vi.mock('../src/style.css', () => ({}))
// feedback.ts reaches the worker through this client; a unit test never starts one (tests/feedback-f1.test.ts does the same).
vi.mock('../src/worker/client', () => ({ request: vi.fn() }))

/** Boot main.ts against a window carrying `globals`, and return the feedback module that boot wired. */
async function bootWith(globals: Record<string, unknown>): Promise<typeof import('../src/feedback')> {
  vi.resetModules()
  vi.stubGlobal('window', globals)
  await import('../src/main')
  // The same registry main.ts just used: this is the instance it called setReportBridge on.
  return import('../src/feedback')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('main.ts and the shell bridge slot', () => {
  it('hands the function the shell defined before boot to the ReportBridge slot', async () => {
    const bridge = async (): Promise<boolean> => true
    const feedback = await bootWith({ __TIES_SHELL_BRIDGE__: bridge })
    expect(feedback.reportBridge).toBe(bridge)
  })

  it('leaves the slot empty when no shell defined the global', async () => {
    const feedback = await bootWith({})
    expect(feedback.reportBridge).toBeNull()
  })

  it('ignores a global that is not a function', async () => {
    const feedback = await bootWith({ __TIES_SHELL_BRIDGE__: 'not-a-function' })
    expect(feedback.reportBridge).toBeNull()
  })
})

// ---- half (2): the iOS shell's bridge ------------------------------------------------------------

const bridgeSource = readFileSync(new URL('../shells/ios/bridge/shell-bridge.js', import.meta.url), 'utf8')

/** `FileReader` as a browser has it, for the one call the bridge makes: `readAsDataURL`. */
class StandInFileReader {
  result: string | null = null
  error: unknown = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  readAsDataURL(blob: Blob): void {
    void blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`
      this.onload?.()
    })
  }
}

interface Plugins {
  Share?: { share: ReturnType<typeof vi.fn> }
  Filesystem?: { writeFile: ReturnType<typeof vi.fn> }
}

/** Run the script the way a page does and read back the global it defines. `null` = no Capacitor at all. */
function loadBridge(plugins: Plugins | null): ReportBridge {
  const win: Record<string, unknown> = plugins === null ? {} : { Capacitor: { Plugins: plugins } }
  new Function('window', 'FileReader', bridgeSource)(win, StandInFileReader)
  return win.__TIES_SHELL_BRIDGE__ as ReportBridge
}

const TEXT = 'Ties Break 1.2.3 (abc123)\nno errors since boot'
function reportWithFile(): { text: string; file: File } {
  return { text: TEXT, file: new File([new Uint8Array([1, 2, 3])], 'ties break save.tbsave', { type: 'application/octet-stream' }) }
}

describe('the iOS shell bridge', () => {
  it('writes the save to the cache directory and shares its uri with the report text', async () => {
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/ties_break_save.tbsave' })
    const share = vi.fn().mockResolvedValue({ completed: true })
    const bridge = loadBridge({ Share: { share }, Filesystem: { writeFile } })

    await expect(bridge(reportWithFile())).resolves.toBe(true)

    // [1, 2, 3] as base64 is AQID; the name is flattened to something a filesystem takes without `recursive`.
    expect(writeFile).toHaveBeenCalledWith({ path: 'ties_break_save.tbsave', data: 'AQID', directory: 'CACHE' })
    expect(share).toHaveBeenCalledWith({
      title: 'Ties Break 1.2.3 (abc123)',
      text: TEXT,
      files: ['file:///cache/ties_break_save.tbsave'],
    })
  })

  it('with no file it shares the text alone and never touches the filesystem', async () => {
    const writeFile = vi.fn()
    const share = vi.fn().mockResolvedValue({ completed: true })
    const bridge = loadBridge({ Share: { share }, Filesystem: { writeFile } })

    await expect(bridge({ text: TEXT, file: null })).resolves.toBe(true)

    expect(writeFile).not.toHaveBeenCalled()
    expect(share).toHaveBeenCalledTimes(1)
    expect(share.mock.calls[0][0]).toEqual({ title: 'Ties Break 1.2.3 (abc123)', text: TEXT })
  })

  it('a cancelled sheet counts as taken – native iOS resolves it, the web implementation rejects it', async () => {
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/x' })
    const native = loadBridge({ Share: { share: vi.fn().mockResolvedValue({ completed: false }) }, Filesystem: { writeFile } })
    await expect(native(reportWithFile())).resolves.toBe(true)

    const web = loadBridge({ Share: { share: vi.fn().mockRejectedValue(new Error('Share canceled')) }, Filesystem: { writeFile } })
    await expect(web(reportWithFile())).resolves.toBe(true)
  })

  it('any other failure throws, so the app falls through to its own path', async () => {
    const writeFile = vi.fn().mockResolvedValue({ uri: 'file:///cache/x' })
    const sheetFails = loadBridge({ Share: { share: vi.fn().mockRejectedValue(new Error('Error sharing item')) }, Filesystem: { writeFile } })
    await expect(sheetFails(reportWithFile())).rejects.toThrow('Error sharing item')

    const diskFails = loadBridge({
      Share: { share: vi.fn() },
      Filesystem: { writeFile: vi.fn().mockRejectedValue(new Error('disk full')) },
    })
    await expect(diskFails(reportWithFile())).rejects.toThrow('disk full')
  })

  it('resolves false when this shell has no way to send: no Capacitor, no share plugin, or no way to attach the save', async () => {
    await expect(loadBridge(null)(reportWithFile())).resolves.toBe(false)
    await expect(loadBridge({})(reportWithFile())).resolves.toBe(false)

    const share = vi.fn()
    // A report whose save cannot be attached is worse than the fallback, which downloads it.
    await expect(loadBridge({ Share: { share } })(reportWithFile())).resolves.toBe(false)
    expect(share).not.toHaveBeenCalled()
  })
})
