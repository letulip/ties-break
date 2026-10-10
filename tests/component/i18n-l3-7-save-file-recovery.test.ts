// L3-7 CLOSE-OUT (10.10) – THE RECOVERY SCREEN READS A REFUSED SAVE THROUGH ITS SENTENCE, MOUNTED. docs/decisions.md 10.10 item 33; the unit net is tests/i18n-l3-7-save-file-errors.test.ts.
//
// `initError` was the leftover L3-7 named: the recovery screen printed the store's raw English for the one boot refusal a Russian player is most likely to meet – a career whose newest autosave was written by a newer build
// («Save schema N is newer than supported M»). The kind (`future-schema`) crossed the boundary since E-05 but names no sentence and no holes; the sentence now rides beside it (`ErrorReply.c`), `init` keeps both beside
// `initError` (`initErrorCode`, `initErrorC`) and the screen asks `errorText(initErrorCode, initError, initErrorC)`. The recovery screen's IMPORT row (a refused file picked from it) reads `saveOp.c` the same way.
//
// ⚠ THE REFUSAL IS THE ENGINE'S OWN, thrown by the shipped `decompressWorld` on a record one build ahead – never a sentence typed here (invariant 4; the same discipline as tests/component/round36-boot-refusal.test.ts).
// ⚠ ASCII MARKERS ARE NUMBERED PROBES, not translations.
// ⚠ PROVEN TO BE ABLE TO FAIL (10.10): `App.vue`'s recovery line put back to `{{ game.initError }}` -> the Russian arms go red; `init`'s `this.initErrorC = this.errorC` removed -> the same; a refusal with no `c`
// is the raw message in both languages.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import { useGameStore } from '../../src/stores/game'
import { request } from '../../src/worker/client'
import { decompressWorld, sha256 } from '../../src/engine/saveCodec'
import { SaveFileError } from '../../src/engine/saveGuard'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { isCopyRef, type CopyRef } from '../../src/shared/i18n'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { gz } from '../helpers/sfe-corpus'
import type { CareerMeta, ToUI } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'

// ⚠ 10.10 – the storage shim is installMemoryStorage() alone (called in beforeEach below): the
// T5.14 shrink-only ratchet refuses a NEW file that spells the block itself, and this file briefly
// carried both – the hand-rolled copy was dead weight over the shared one.
const store = installMemoryStorage()
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})
const mockRequest = vi.mocked(request)

const CAREER: CareerMeta = { careerId: 'c-l37', kidName: 'Vera', country: 'FR', seed: 'l37-boot', createdAt: 1, lastPlayedAt: 2, week: 40 }
const careersReply: ToUI = { id: 0, ok: true, type: 'careers', careers: [CAREER], revision: 3 }
const slotsReply: ToUI = { id: 0, ok: true, type: 'slots', slots: [], revision: 3 }

/** the refusal the SHIPPED database door gives a record written by a build one version ahead */
async function newerBuildRefusal(): Promise<SaveFileError> {
  const payload = await gz(new TextEncoder().encode(JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION + 1 })))
  try {
    await decompressWorld(payload, await sha256(payload))
  } catch (e) {
    if (e instanceof SaveFileError) return e
  }
  throw new Error('decompressWorld accepted a record from a newer build – this fixture is no longer honest')
}
/** the wire reply `errorMsg` builds for it: the English in `error`, the kind in `code`, the sentence in `c` */
const replyFor = (e: SaveFileError, withRef = true): ToUI => ({ id: 0, ok: false, error: e.message, code: e.code, ...(withRef && e.c ? { c: e.c } : {}) })

async function bootWith(loadCareerReply: () => ToUI): Promise<{ wrapper: VueWrapper; store: ReturnType<typeof useGameStore> }> {
  mockRequest.mockImplementation(async (msg) => {
    if (msg.type === 'listCareers') return careersReply
    if (msg.type === 'loadCareer') return loadCareerReply()
    if (msg.type === 'listSlots') return slotsReply
    throw new Error(`unexpected request ${msg.type}`)
  })
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  return { wrapper, store: useGameStore() }
}
const errors = (w: VueWrapper): string[] => w.findAll('.recovery-screen .error').map((p) => p.text().replace(/\s+/g, ' ').trim())

beforeEach(() => {
  resetI18nForTests(null)
  setActivePinia(createPinia())
  mockRequest.mockReset()
  store.backing.clear()
  document.body.innerHTML = ''
})
afterEach(() => {
  document.documentElement.lang = 'en'
})

describe('L3-7 close-out – the recovery screen: a boot refused with a save file\'s sentence', () => {
  it('English: the screen prints the very message; the store keeps the kind and the ref beside it', async () => {
    const refusal = await newerBuildRefusal()
    expect(isCopyRef(refusal.c), 'the engine\'s refusal carries its sentence').toBe(true)
    const { wrapper, store } = await bootWith(() => replyFor(refusal))
    expect(store.phase).toBe('recovery')
    expect(store.initError).toBe(refusal.message)
    expect(store.initErrorCode).toBe('future-schema')
    expect(store.initErrorC).toEqual(refusal.c)
    expect(errors(wrapper)).toEqual([refusal.message])
    wrapper.unmount()
  })

  it('Russian (a probe catalog): the refusal is the translated frame with its holes filled – and the message is gone from the screen', async () => {
    const refusal = await newerBuildRefusal()
    const c = refusal.c as CopyRef
    installCatalog('ru', { [c.k]: 'NEWER<{0}|{1}>' })
    await setLocale('ru')
    const { wrapper } = await bootWith(() => replyFor(refusal))
    expect(errors(wrapper)).toEqual([`NEWER<${SAVE_SCHEMA_VERSION + 1}|${SAVE_SCHEMA_VERSION}>`])
    expect(wrapper.text()).not.toContain(refusal.message)
    wrapper.unmount()
  })

  it('a worker that sends no ref (a reply from before it existed, or the lone raw lower-layer message) prints the raw message in either language', async () => {
    const refusal = await newerBuildRefusal()
    installCatalog('ru', { [(refusal.c as CopyRef).k]: 'NEWER<{0}|{1}>' })
    await setLocale('ru')
    const { wrapper, store } = await bootWith(() => replyFor(refusal, false))
    expect(store.initErrorC).toBeNull()
    expect(errors(wrapper)).toEqual([refusal.message])
    wrapper.unmount()
  })

  it('a retry that is refused WITHOUT a ref clears the first one: the ref leaves with its sentence (init resets all three)', async () => {
    const refusal = await newerBuildRefusal()
    let reply: ToUI = replyFor(refusal)
    const { wrapper, store } = await bootWith(() => reply)
    expect(store.initErrorC).not.toBeNull()
    reply = { id: 0, ok: false, error: 'The disk said no (E-1)' }
    await store.retryInit()
    await flushPromises()
    expect(store.initError).toBe('The disk said no (E-1)')
    expect(store.initErrorCode).toBe('')
    expect(store.initErrorC).toBeNull()
    expect(errors(wrapper)).toEqual(['The disk said no (E-1)'])
    wrapper.unmount()
  })
})

describe('L3-7 close-out – the recovery screen\'s import row: a refused file picked from it', () => {
  it('reads `saveOp.c` – the translated sentence in Russian, the message in English', async () => {
    const refusal = await newerBuildRefusal()
    const c = refusal.c as CopyRef
    const { wrapper, store } = await bootWith(() => ({ id: 0, ok: false, error: 'The browser said no' }))
    store.saveOp = { op: 'import', status: 'error', message: refusal.message, code: refusal.code, c }
    await flushPromises()
    expect(errors(wrapper)).toContain(refusal.message)
    installCatalog('ru', { [c.k]: 'NEWER<{0}|{1}>' })
    await setLocale('ru')
    await flushPromises()
    expect(errors(wrapper)).toContain(`NEWER<${SAVE_SCHEMA_VERSION + 1}|${SAVE_SCHEMA_VERSION}>`)
    expect(errors(wrapper)).not.toContain(refusal.message)
    wrapper.unmount()
  })
})
