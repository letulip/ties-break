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

async function refuse(code: ConstructorParameters<typeof CommandRejected>[1], message: string) {
  const game = useGameStore()
  await game.run(async () => {
    throw new CommandRejected(message, code)
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
