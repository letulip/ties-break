// L3-5 (10.10) – THE LIFE BEAT SHOWS ITS REFS, MOUNTED. The unit net (tests/i18n-l3-5-life-beats.test.ts) proves the engine writes a CopyRef beside every string of a prompt; the only
// thing it cannot say is whether the SCREEN reads it. This mounts the real dialog, the real Home card and the real calendar over a real fresh career whose prompt is exactly the fixture given:
//
//   · English: a string with a ref and the same string with only its text are the same bytes on the screen (the formatter's identity path) – the 0-risk half of the wave;
//   · Russian with a catalog: the ref is looked up and the TRANSLATION is drawn, the English is not – the heading, her line (the composed one too: `{0} {1}` over a frame and an opener),
//     each of her replies and the Home card's line;
//   · a caller with no ref prints the English, as before (every older fixture in the suite is that caller).
//
// ⚠ FIXTURE SENTENCES AND ASCII MARKERS ON PURPOSE (CLAUDE.md invariant 4): nothing here asserts a shipped sentence, so no wording change can move this file; the "translations" are
// marker strings, never Russian.
// ⚠ PROVEN TO BE ABLE TO FAIL: the dialog's heading, her line and her reply put back to the raw strings, the Home card back to `{{ softBeat.card }}`, the calendar's note back to `{{ fridgeNote }}`
// -> the Russian cases go red (watched, 10.10; output in the wave report).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'

installMemoryStorage()

const base = (): Snapshot => toSnapshot(createWorld('l3-5-display', { ...DEFAULT_PROFILE })) as Snapshot

/** a prompt whose every ref key is NOT its English, so a screen that read the text instead would show it */
const PROMPT: LifeBeatPrompt = {
  week: 640,
  kind: 'small-talk',
  heading: 'English heading fixture',
  headingC: { k: 'fixture heading' },
  said: 'English line fixture',
  saidC: { k: '{0} {1}', p: [{ k: 'fixture frame' }, { k: 'fixture opener' }] },
  options: [
    { id: 'invite', label: 'Fixture answer one' },
    { id: 'respond', label: 'Fixture answer two' },
  ],
  followUps: [
    {
      optionId: 'respond',
      said: ['English reply one', 'English reply two'],
      saidC: [{ k: 'fixture reply one' }, { k: 'fixture reply two' }],
      done: 'Fixture done',
    },
  ],
  confirm: 'Fixture proceed',
}

const RU: Record<string, string> = {
  'fixture heading': 'HEADING*',
  '{0} {1}': '{0} / {1}',
  'fixture frame': 'FRAME*',
  'fixture opener': 'OPENER*',
  'fixture reply one': 'REPLY-ONE*',
  'fixture reply two': 'REPLY-TWO*',
  'fixture card': 'CARD*',
}

function openDialog(prompt: LifeBeatPrompt) {
  useGameStore().$patch({ snapshot: { ...base(), lifeBeatPrompt: prompt } as Snapshot })
  return mount(LifeBeatDialog, { global: { stubs: { teleport: true } } })
}
const text = (w: ReturnType<typeof openDialog>, sel: string): string => (w.find(sel).element?.textContent ?? '').replace(/\s+/g, ' ').trim()

describe('L3-5 – the life-beat dialog draws the prompt through its refs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    resetI18nForTests()
  })

  it('English: the heading, her line and her replies read as the sentence the ref spells (a key is a sentence, never a code); the composed line is the two seats joined', async () => {
    const w = openDialog(PROMPT)
    expect(text(w, '#life-beat-heading')).toBe('fixture heading')
    expect(text(w, '#life-beat-said')).toBe('fixture frame fixture opener')
    await w.findAll('.life-beat-choice')[1]!.trigger('click')
    expect(w.findAll('.life-beat-continued').map((p) => p.text())).toEqual(['fixture reply one', 'fixture reply two'])
  })

  it('Russian with a catalog: the translation of each ref is drawn – the composed line translated seat by seat and joined by the `{0} {1}` message – never the English beside it', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = openDialog(PROMPT)
    await nextTick()
    expect(text(w, '#life-beat-heading')).toBe('HEADING*')
    expect(text(w, '#life-beat-said')).toBe('FRAME* / OPENER*')
    await w.findAll('.life-beat-choice')[1]!.trigger('click')
    expect(w.findAll('.life-beat-continued').map((p) => p.text())).toEqual(['REPLY-ONE*', 'REPLY-TWO*'])
    for (const english of ['English heading fixture', 'English line fixture', 'English reply one', 'English reply two']) expect(w.text(), english).not.toContain(english)
  })

  it('a prompt with NO refs prints the English it carries, under either language (every caller that predates the wave)', async () => {
    const bare: LifeBeatPrompt = { ...PROMPT, headingC: undefined, saidC: undefined, followUps: [{ ...PROMPT.followUps[0]!, saidC: undefined }] }
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = openDialog(bare)
    await nextTick()
    expect(text(w, '#life-beat-heading')).toBe('English heading fixture')
    expect(text(w, '#life-beat-said')).toBe('English line fixture')
    await w.findAll('.life-beat-choice')[1]!.trigger('click')
    expect(w.findAll('.life-beat-continued').map((p) => p.text())).toEqual(['English reply one', 'English reply two'])
  })

  it('the soft entrance reads the same refs (the same dialog, one prop apart)', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    useGameStore().$patch({ snapshot: { ...base(), softBeat: { card: 'English card fixture', cardC: { k: 'fixture card' }, prompt: PROMPT } } as Snapshot })
    const w = mount(LifeBeatDialog, { props: { soft: true }, global: { stubs: { teleport: true } } })
    await nextTick()
    expect(text(w, '#life-beat-heading')).toBe('HEADING*')
    expect(text(w, '#life-beat-said')).toBe('FRAME* / OPENER*')
  })
})

describe('L3-5 – Home draws the soft card\'s line through its ref', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    resetI18nForTests()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2033, 5, 6, 9, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  const openHome = () => {
    useGameStore().$patch({ snapshot: { ...base(), softBeat: { card: 'English card fixture', cardC: { k: 'fixture card' }, prompt: PROMPT } } as Snapshot })
    return mount(HomeScreen, { props: { recapFresh: false } })
  }

  it('English: the line is the ref\'s sentence; Russian with a catalog: the translation, never the English', async () => {
    let w = openHome()
    expect(w.find('.soft-beat-line').text()).toBe('fixture card')
    w.unmount()
    installCatalog('ru', RU)
    await setLocale('ru')
    w = openHome()
    await nextTick()
    expect(w.find('.soft-beat-line').text()).toBe('CARD*')
    expect(w.text()).not.toContain('English card fixture')
  })
})
