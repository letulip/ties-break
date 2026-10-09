// L3-4 (10.10) – THE DIARY SHOWS ITS REFS, MOUNTED. The unit net (tests/i18n-l3-4-diary-corpora.test.ts) proves the engine writes a CopyRef beside every converted line;
// the only thing it cannot say is whether the SCREEN reads it. This mounts the real screens over a real fresh career whose diary is exactly the fixture given:
//
//   · English: a line with a ref and the same line with only its text are the same bytes on the screen (the formatter's identity path) – the 0-risk half of the wave;
//   · Russian with a catalog: the ref is looked up and the TRANSLATION is drawn, the English is not – the half that makes the wave worth having;
//   · the greeting's collision rule keeps reading the ENGLISH caption (the tag it searches for a time word), whatever the caption shown is;
//   · a week label ("W14 '31") has no ref – it is a formatter's output – and prints as text under every language.
//
// ⚠ FIXTURE SENTENCES AND ASCII MARKERS ON PURPOSE (CLAUDE.md invariant 4): nothing here asserts a shipped sentence, so no wording change can move this file; the "translations" are
// marker strings, never Russian.
// ⚠ PROVEN TO BE ABLE TO FAIL: HomeScreen's memory line put back to `{{ memory.line }}`, the caption to the raw snapshot string, BirthdayDialog's heading back to `{{ prompt.heading }}`
// -> the Russian cases go red (watched, 10.10; output in the wave report).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, decideKnock, pendingBirthday, pendingKnock, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, missCount, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'

installMemoryStorage()

const base = (): Snapshot => toSnapshot(createWorld('l3-4-display', { ...DEFAULT_PROFILE })) as Snapshot

/** the diary of the fixture: every converted line carries a ref whose key is NOT its English, so a screen that read the text instead would show it */
function fixtureDiary(snap: Snapshot): Snapshot['diary'] {
  return {
    ...snap.diary,
    photoLine: 'A fixture caption about the morning.',
    photoLineC: { k: 'fixture caption {0}', p: ['one'] },
    greeting: 'Fixture engine greeting',
    greetingC: { k: 'fixture greeting' },
    conditionNote: 'A fixture note.',
    conditionNoteC: { k: 'fixture note {0}', p: [7] },
    memory: {
      kind: 'echo',
      milestone: null,
      whenLabel: 'one year ago',
      whenLabelC: { k: 'fixture when' },
      stage: snap.diary.memory?.stage ?? 'tween',
      emotion: 'norm',
      line: 'A fixture memory.',
      lineC: { k: 'fixture memory' },
    } as NonNullable<Snapshot['diary']['memory']>,
  }
}

const RU = {
  'fixture caption {0}': 'CAPTION* {0}',
  'fixture greeting': 'GREETING*',
  'fixture note {0}': 'NOTE* {0}',
  'fixture when': 'WHEN*',
  'fixture memory': 'MEMORY*',
}

function openHome(diary: Snapshot['diary']) {
  const game = useGameStore()
  game.$patch({ snapshot: { ...base(), diary } as Snapshot })
  return mount(HomeScreen, { props: { recapFresh: false } })
}
const text = (w: ReturnType<typeof openHome>, sel: string): string => (w.find(sel).element?.textContent ?? '').trim()

describe('L3-4 – Home draws the diary through its refs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    resetI18nForTests()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2033, 5, 6, 9, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('English: the caption, the note and the memory read as the sentence the ref spells (the ref\'s key is a sentence, never a code)', () => {
    const w = openHome(fixtureDiary(base()))
    expect(text(w, '.diary-caption-text')).toBe('fixture caption one')
    expect(text(w, '.condition-note')).toBe('fixture note 7')
    expect(text(w, '.memory-line')).toBe('fixture memory')
    expect(text(w, '.memory-when')).toBe('fixture when')
  })

  it('Russian with a catalog: the translation of the ref is drawn, never the English line beside it', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = openHome(fixtureDiary(base()))
    await nextTick()
    expect(text(w, '.diary-caption-text')).toBe('CAPTION* one')
    expect(text(w, '.condition-note')).toBe('NOTE* 7')
    expect(text(w, '.memory-line')).toBe('MEMORY*')
    expect(text(w, '.memory-when')).toBe('WHEN*')
    for (const english of ['A fixture caption about the morning.', 'A fixture note.', 'A fixture memory.', 'one year ago']) expect(w.text(), english).not.toContain(english)
  })

  it('the greeting\'s collision rule still searches the ENGLISH caption, and the engine\'s word it falls back to is drawn from its ref', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    // 09:00 is "morning"; the English caption says "morning", so Home defers to the engine's greeting – whatever language the caption is SHOWN in
    const w = openHome(fixtureDiary(base()))
    await nextTick()
    expect(text(w, '.diary-caption-text'), 'the caption shown is the translation, which contains no English time word').toBe('CAPTION* one')
    expect(text(w, '.diary-greeting'), 'the collision still fired on the English caption, and the fallback is the ref\'s translation').toBe('GREETING*')
  })

  it('a week label has no ref and prints as text under every language', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const d = fixtureDiary(base())
    const w = openHome({ ...d, memory: { ...d.memory!, whenLabel: "W14 '31", whenLabelC: undefined } })
    await nextTick()
    expect(text(w, '.memory-when')).toBe("W14 '31")
  })

  it('a ref the catalog does not know falls back to the English KEY\'s sentence and is COUNTED, never thrown', async () => {
    installCatalog('ru', {})
    await setLocale('ru')
    const before = missCount()
    const w = openHome(fixtureDiary(base()))
    await nextTick()
    expect(text(w, '.memory-line'), 'English from the key').toBe('fixture memory')
    expect(missCount() - before, 'the untranslated diary lines are a number, not a surprise').toBeGreaterThanOrEqual(3)
  })
})

/** A real career ticked to a real birthday (born 15 June), exactly as tests/component/birthday-dialog.test.ts does it. */
function birthdaySnapshot(): Snapshot {
  const world = createWorld('l3-4-bday-ui', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  if (pendingBirthday(world) === null) throw new Error('the fixture never reached a birthday')
  return toSnapshot(world) as Snapshot
}

describe('L3-4 – the birthday dialog draws the prompt through its refs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    resetI18nForTests()
  })

  const mountDialog = (snap: Snapshot) => {
    useGameStore().snapshot = snap
    return mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
  }

  it('English: the heading, the ask and the four rows are the snapshot\'s own English, byte for byte', () => {
    const snap = birthdaySnapshot()
    const p = snap.birthdayPrompt!
    const w = mountDialog(snap)
    expect(w.get('.season-summary-title').text()).toBe(p.heading)
    expect(w.get('.birthday-ask').text()).toBe(p.ask)
    expect(w.findAll('.birthday-choice-label').map((n) => n.text())).toEqual(p.options.map((o) => o.label))
    expect(w.findAll('.birthday-choice-note').map((n) => n.text())).toEqual(p.options.map((o) => o.note))
    w.unmount()
  })

  it('Russian with a catalog: every sentence of the card is its ref\'s translation, and the English of any of them is gone', async () => {
    const snap = birthdaySnapshot()
    const p = snap.birthdayPrompt!
    const dict: Record<string, string> = { [p.headingC!.k]: 'HEADING* {0}', [p.askC!.k]: 'ASK*' }
    p.options.forEach((o, i) => {
      dict[o.labelC!.k] = `LABEL${i}*`
      dict[o.noteC!.k] = `NOTE${i}*`
    })
    installCatalog('ru', dict)
    await setLocale('ru')
    const w = mountDialog(snap)
    await nextTick()
    expect(w.get('.season-summary-title').text().startsWith('HEADING*')).toBe(true)
    expect(w.get('.birthday-ask').text()).toBe('ASK*')
    expect(w.findAll('.birthday-choice-label').map((n) => n.text())).toEqual(p.options.map((_, i) => `LABEL${i}*`))
    expect(w.findAll('.birthday-choice-note').map((n) => n.text())).toEqual(p.options.map((_, i) => `NOTE${i}*`))
    for (const english of [p.ask, ...p.options.map((o) => o.label)]) expect(w.text(), english).not.toContain(english)
    w.unmount()
  })

  it('the selection survives a locale flip (the card is re-labelled, not rebuilt)', async () => {
    const snap = birthdaySnapshot()
    const w = mountDialog(snap)
    await w.get('button.birthday-choice').trigger('click')
    installCatalog('ru', { [snap.birthdayPrompt!.askC!.k]: 'ASK*' })
    await setLocale('ru')
    await nextTick()
    expect(w.get('.birthday-ask').text()).toBe('ASK*')
    expect(w.get('button.birthday-choice').attributes('aria-checked')).toBe('true')
    w.unmount()
  })
})
