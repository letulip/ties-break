// L3-7 (10.10) – A STORE ERROR IS DRAWN THROUGH ITS CODE, MOUNTED. The unit net (tests/i18n-l3-7-errors.test.ts) proves the codes exist and meet their sentences; this mounts the real store and the real
// `StoreError` and reads what the player reads:
//   · English: a coded refusal prints the very sentence the worker sent (a code's `t()` key IS that sentence), and the Reload button still follows the cross-tab one;
//   · a probe `ru` catalog: the same refusal prints the TRANSLATION of its sentence, the store's own five too, and the sentence the Saves strip printed is still not printed twice;
//   · an unknown code, no code (a fixture writing `error` by assignment) and a code with variable detail print the raw message.
// ⚠ ASCII MARKERS ON PURPOSE (invariant 4): the "translations" are numbered markers.
// ⚠ PROVEN TO BE ABLE TO FAIL: `StoreError`'s `errorText(game.errorCode, game.error)` put back to `game.error` -> the Russian cases go red (watched, 10.10).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StoreError from '../../src/components/ui/StoreError.vue'
import { CommandRejected, useGameStore } from '../../src/stores/game'
import { guardCompressedSize, guardDeclaredShape, MAX_COMPRESSED_BYTES, SaveFileError } from '../../src/engine/saveGuard'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { isCopyRef, renderCopyRef, SOURCE_LOCALE, type CopyRef } from '../../src/shared/i18n'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'

const RU: Record<string, string> = {
  'That offer has already gone.': 'GONE*',
  'That letter is not in the inbox.': 'NOT-IN-INBOX*',
  'She has already said this one – there is nothing here left to answer': 'LAST-OFFER*',
  'Another tab has newer progress for this career – reload before continuing here.': 'OTHER-TAB*',
  'That action was based on an outdated screen – it was refreshed. Try again.': 'STALE*',
  'The simulation restarted. Try again.': 'RESTARTED*',
  'Simulation restarted from the last saved week.': 'RESTARTED-SAVED*',
  'The simulation crashed. Try again, or reopen the app to continue.': 'CRASHED*',
}

async function refuse(code: ConstructorParameters<typeof CommandRejected>[1], message: string, c?: CopyRef) {
  const game = useGameStore()
  await game.run(async () => {
    throw new CommandRejected(message, code, undefined, c)
  })
  return game
}
const shown = (w: ReturnType<typeof mount>): string => (w.find('p.error').exists() ? w.get('p.error').text().replace(/\s+/g, ' ').trim() : '')

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.documentElement.lang = 'en'
})

describe('L3-7 – the store keeps the code beside the sentence, and StoreError draws it', () => {
  it('English: a coded refusal is the sentence the worker sent; the store holds its code; the cross-tab one still earns its Reload', async () => {
    const game = await refuse('offer-gone', 'That offer has already gone.')
    expect(game.error).toBe('That offer has already gone.')
    expect(game.errorCode).toBe('offer-gone')
    const w = mount(StoreError)
    expect(shown(w)).toBe('That offer has already gone.')
    w.unmount()

    const conflict = await refuse('SAVE_CONFLICT', 'whatever the worker said')
    expect(conflict.error).toBe('Another tab has newer progress for this career – reload before continuing here.')
    expect(conflict.errorCode).toBe('SAVE_CONFLICT')
    expect(conflict.errorKind).toBe('save-conflict')
    const w2 = mount(StoreError)
    expect(shown(w2)).toBe('Another tab has newer progress for this career – reload before continuing here.Reload')
    expect(w2.get('button').text()).toBe('Reload')
    w2.unmount()
  })

  it('Russian (a probe catalog): the refusal prints the translation of its code\'s sentence, the cross-tab one too (and its Reload), and the engine\'s raw message is never on the screen', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const game = await refuse('offer-not-in-inbox', 'That letter is not in the inbox.')
    const w = mount(StoreError)
    expect(shown(w)).toBe('NOT-IN-INBOX*')
    expect(w.text()).not.toContain('That letter is not in the inbox.')
    w.unmount()
    await refuse('last-offer-not-a-question' as never, 'She has already said this one – there is nothing here left to answer')
    const w2 = mount(StoreError)
    expect(shown(w2)).toBe('LAST-OFFER*')
    w2.unmount()
    await refuse('SAVE_CONFLICT', 'x')
    const w3 = mount(StoreError)
    expect(shown(w3)).toBe('OTHER-TAB*Reload')
    expect(w3.get('button').text()).toBe('Reload')
    w3.unmount()
    expect(game).toBeTruthy()
  })

  it('the store\'s own recovery lines carry their codes (a stale screen, a restart, a crash) and draw their translations', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const game = useGameStore()
    for (const [code, error, marker] of [
      ['STALE_REVISION', 'That action was based on an outdated screen – it was refreshed. Try again.', 'STALE*'],
      ['store-restarted', 'The simulation restarted. Try again.', 'RESTARTED*'],
      ['store-restarted-from-save', 'Simulation restarted from the last saved week.', 'RESTARTED-SAVED*'],
      ['store-crashed', 'The simulation crashed. Try again, or reopen the app to continue.', 'CRASHED*'],
    ] as const) {
      game.error = error
      game.errorCode = code
      const w = mount(StoreError)
      expect(shown(w), code).toBe(marker)
      w.unmount()
    }
  })

  it('no code, an unknown code and a code with variable detail print the raw message (a fixture that writes `error` by assignment keeps working)', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const game = useGameStore()
    game.error = 'A fixture sentence.'
    let w = mount(StoreError)
    expect(shown(w)).toBe('A fixture sentence.')
    w.unmount()
    await refuse('corrupted', 'This save file is damaged – it declares an impossible save version')
    w = mount(StoreError)
    expect(shown(w)).toBe('This save file is damaged – it declares an impossible save version')
    w.unmount()
    await refuse('INVALID_COMMAND', 'Time moves 1 to 52 whole weeks at a time')
    w = mount(StoreError)
    expect(shown(w)).toBe('Time moves 1 to 52 whole weeks at a time')
    w.unmount()
  })

  it('the Saves strip\'s `except` still compares the raw sentence: the one the strip printed is not printed twice, in either language', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    await refuse('offer-gone', 'That offer has already gone.')
    const w = mount(StoreError, { props: { except: 'That offer has already gone.' } })
    expect(shown(w)).toBe('')
    w.unmount()
  })

  it('a save operation that fails carries the code onto its status row', async () => {
    const game = useGameStore()
    await game.runOp('export', async () => {
      throw new CommandRejected('That offer has already gone.', 'offer-gone')
    })
    expect(game.saveOp).toEqual({ op: 'export', status: 'error', message: 'That offer has already gone.', code: 'offer-gone' })
    await game.runOp('export', async () => {
      throw new Error('The disk said no (E-1)')
    })
    expect(game.saveOp).toEqual({ op: 'export', status: 'error', message: 'The disk said no (E-1)' })
  })
})

// ===================================================================================================================
// THE L3-7 CLOSE-OUT (10.10): a refused SAVE FILE rides with its sentence – the kind in `code`, the sentence as a ref in `c`
// ===================================================================================================================
// The refusals are the ENGINE'S OWN (the real guards throw them – no sentence is typed here, invariant 4); the "translations" are numbered ASCII probes.
// ⚠ PROVEN TO BE ABLE TO FAIL (10.10): `StoreError`'s `errorText(game.errorCode, game.error, game.errorC)` put back to the two-argument call -> the Russian arms go red; the store's `this.errorC = err.c` line removed -> the
// same; a stale ref (the first sentence's, left in `errorC` when the next refusal has none) is the raw message because `errorText` checks the ref against the message.
function refusal(run: () => void): SaveFileError {
  try {
    run()
  } catch (e) {
    if (e instanceof SaveFileError) return e
  }
  throw new Error('the guard accepted what this arm needs it to refuse')
}
const SPINE_BAD = (): SaveFileError => refusal(() => guardDeclaredShape({ schemaVersion: SAVE_SCHEMA_VERSION, seed: 'x', week: -1 }, SAVE_SCHEMA_VERSION))
const TOO_BIG_BYTES = MAX_COMPRESSED_BYTES * 2 + 1_234_567
const TOO_BIG = (): SaveFileError => refusal(() => guardCompressedSize(TOO_BIG_BYTES))

describe('L3-7 close-out – the store keeps the sentence beside the kind, and StoreError draws it', () => {
  it('the store holds `errorC` beside `errorCode`; English prints the engine\'s own message; a refusal with no ref clears it, so a ref never outlives its sentence', async () => {
    const big = TOO_BIG()
    expect(isCopyRef(big.c)).toBe(true)
    const game = await refuse(big.code, big.message, big.c)
    expect(game.errorCode).toBe('oversized')
    expect(game.errorC).toEqual(big.c)
    const w = mount(StoreError)
    expect(shown(w)).toBe(big.message)
    w.unmount()
    // the next refusal has no ref (a plain engine sentence): `run` resets the ref with the sentence
    await refuse('offer-gone', 'That offer has already gone.')
    expect(game.errorC).toBeNull()
    expect(game.errorCode).toBe('offer-gone')
  })

  it('Russian (a probe catalog): the frame, the holes and the nested clause – each key of the engine\'s own ref – print translated; the engine\'s English is gone from the card', async () => {
    const bad = SPINE_BAD()
    const frame = bad.c as CopyRef
    const clause = (frame.p ?? []).find(isCopyRef) as CopyRef
    const big = TOO_BIG()
    installCatalog('ru', { ...RU, [frame.k]: 'MALFORMED<{0}|{1}>', [clause.k]: 'BETWEEN<{0}|{1}>', [(big.c as CopyRef).k]: 'BIG<{0}|{1}>' })
    await setLocale('ru')
    await refuse(bad.code, bad.message, bad.c)
    let w = mount(StoreError)
    expect(shown(w)).toBe('MALFORMED<week|BETWEEN<0|52000>>')
    expect(w.text()).not.toContain(bad.message)
    w.unmount()
    // a refusal whose holes are a string and a number – re-derived here from the bytes, not read back off the ref
    await refuse(big.code, big.message, big.c)
    w = mount(StoreError)
    expect(shown(w)).toBe(`BIG<${(TOO_BIG_BYTES / (1024 * 1024)).toFixed(1)}|${MAX_COMPRESSED_BYTES / (1024 * 1024)}>`)
    w.unmount()
  })

  it('a clause the catalog does not know falls back to its own English INSIDE the translated frame; a frame it does not know is the engine\'s whole message', async () => {
    const bad = SPINE_BAD()
    const frame = bad.c as CopyRef
    const clause = (frame.p ?? []).find(isCopyRef) as CopyRef
    installCatalog('ru', { [frame.k]: 'MALFORMED<{0}|{1}>' })
    await setLocale('ru')
    await refuse(bad.code, bad.message, bad.c)
    let w = mount(StoreError)
    expect(shown(w)).toBe(`MALFORMED<week|${renderCopyRef(clause, { locale: SOURCE_LOCALE })}>`)
    w.unmount()
    installCatalog('ru', {})
    w = mount(StoreError)
    expect(shown(w)).toBe(bad.message)
    w.unmount()
  })

  it('⚠ a stale ref is ignored: the ref of the PREVIOUS refusal, left in the store beside a new message, never stands over it', async () => {
    const bad = SPINE_BAD()
    const frame = bad.c as CopyRef
    installCatalog('ru', { [frame.k]: 'MALFORMED<{0}|{1}>' })
    await setLocale('ru')
    const game = await refuse(bad.code, bad.message, bad.c)
    // a fixture (or a future writer) that replaces the sentence by assignment and forgets the ref
    game.error = 'A different sentence entirely'
    const w = mount(StoreError)
    expect(shown(w)).toBe('A different sentence entirely')
    w.unmount()
  })

  it('a save operation that fails carries the ref onto its status row (and only when there is one)', async () => {
    const bad = SPINE_BAD()
    const game = useGameStore()
    await game.runOp('import', async () => {
      throw new CommandRejected(bad.message, bad.code, undefined, bad.c)
    })
    expect(game.saveOp).toEqual({ op: 'import', status: 'error', message: bad.message, code: bad.code, c: bad.c })
    await game.runOp('import', async () => {
      throw new CommandRejected('That offer has already gone.', 'offer-gone')
    })
    expect(game.saveOp).toEqual({ op: 'import', status: 'error', message: 'That offer has already gone.', code: 'offer-gone' })
    expect('c' in (game.saveOp ?? {}), 'no empty `c` key rides a refusal that has none').toBe(false)
  })
})
