// L3-7 (10.10) – THE KNOCK DIALOG DRAWS THE PROMPT'S FIVE SENTENCES THROUGH THEIR REFS, MOUNTED. The unit net (tests/i18n-l3-7-feeds.test.ts §5) proves `buildKnockPrompt` writes a CopyRef beside every
// sentence; this mounts the real dialog over a real snapshot and reads what the player reads:
//   · English: a ref and its string are the same bytes on the screen (the formatter's identity path), and a prompt with NO refs (every older fixture) prints the strings as before;
//   · a probe `ru` catalog: the sentence of what happened, the coach's read, the named cause and the two costs are the TRANSLATION of their refs, the body part stays the engine's word, and the
//     heading (`Her {0}.`, already a t() call) follows the same catalog.
// ⚠ ASCII MARKERS ON PURPOSE (invariant 4). ⚠ PROVEN TO BE ABLE TO FAIL: the dialog's line put back to `prompt.line` -> the Russian case goes red (watched, 10.10).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import KnockDialog from '../../src/components/KnockDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { buildKnockPrompt } from '../../src/engine/knock'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import type { KnockPrompt, Snapshot, WeekPlan } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'

const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()
const real = (repeat: boolean): KnockPrompt =>
  buildKnockPrompt({ part: 'ankle', repeat, sinceWeek: 9, choice: null, untilWeek: 9 } as unknown as Parameters<typeof buildKnockPrompt>[0], 'l37-knock-display', 62, { train: 85, rest: 50 } as unknown as WeekPlan)

function open(prompt: KnockPrompt) {
  const snap = careerSnapshot(4, 'l37-knock-display') as Snapshot
  useGameStore().snapshot = { ...snap, knockPrompt: prompt }
  return mount(KnockDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}
const text = (w: ReturnType<typeof open>, sel: string): string => flat(w.get(sel).text())

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

describe('L3-7 – the knock dialog draws its five sentences through their refs', () => {
  it('English: with refs or without, the dialog reads the strings the engine composed', () => {
    for (const repeat of [false, true]) {
      const p = real(repeat)
      const withRefs = open(p)
      const read = [text(withRefs, '.knock-line'), text(withRefs, '.knock-read'), text(withRefs, '.knock-why'), flat(withRefs.findAll('.knock-choice-cost')[0]!.text()), flat(withRefs.findAll('.knock-choice-cost')[1]!.text())]
      expect(read).toEqual([p.line, p.read, p.cause, p.restCost, p.pushCost].map(flat))
      withRefs.unmount()
      // a fixture with only strings (every older test): the same screen
      const { lineC, readC, causeC, restCostC, pushCostC, ...bare } = p
      void lineC, void readC, void causeC, void restCostC, void pushCostC
      const plain = open(bare)
      expect([text(plain, '.knock-line'), text(plain, '.knock-read'), text(plain, '.knock-why')]).toEqual([p.line, p.read, p.cause].map(flat))
      plain.unmount()
    }
  })

  it('Russian (a probe catalog): every sentence is the translation of its ref, the part is the engine\'s word, the heading follows the catalog', async () => {
    const p = real(true)
    const RU: Record<string, string> = {}
    let i = 0
    for (const c of [p.lineC, p.readC, p.causeC, p.restCostC, p.pushCostC]) RU[c!.k] = `[T${i++}${c!.p ? ' {0}' : ''}]`
    RU['Her {0}.'] = 'HER <{0}>'
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = open(p)
    expect(text(w, '.knock-line')).toBe('[T0 ankle]')
    expect(text(w, '.knock-read')).toBe('[T1]')
    expect(text(w, '.knock-why')).toBe('[T2 ankle]')
    expect(flat(w.findAll('.knock-choice-cost')[0]!.text())).toBe('[T3]')
    expect(flat(w.findAll('.knock-choice-cost')[1]!.text())).toBe('[T4 ankle]')
    expect(flat(w.get('#knock-dialog-title').text())).toBe('HER <ankle>')
    for (const english of [p.line, p.read, p.cause, p.restCost, p.pushCost]) expect(flat(w.element.textContent ?? '').includes(flat(english)), english).toBe(false)
    w.unmount()
  })
})
