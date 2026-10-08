// THE TWO LANGUAGE DOORS – mounted (wave L1a, spec §3.4, both ruled 07.10).
//
//   · the More switcher, BESIDE THE SAVE CONTROLS («рядом с сейвом»): a section on the Saves tab, right
//     after the Saves strip, that flips the reactive locale and writes the one preference;
//   · the FIRST-RUN PROMPT, before the splash flow («может даже до всего остального для первого
//     входа»): `AppRoot` puts it in front of `App.vue` on a device that has never answered, and never
//     again after an answer.
//
// ⚠ NO RUSSIAN PRODUCT COPY IS WRITTEN HERE. Where a case needs a catalog it installs bracketed
// stand-ins (`[ru] …`); what is asserted is that the screen draws from the catalog, not what the
// catalog says. The four new English strings are DRAFTS for the owner (invariant 4) and are read here
// off the screen, never re-typed as expectations of their wording.
//
// ⚠ ONE LAUNCH = ONE FRESH MODULE REGISTRY. The first-run state is read from storage when `src/i18n`
// loads, so «never again after a choice» can only be proved by loading the app again: `launch()`
// resets modules and re-imports Vue, Test Utils, AppRoot and the i18n layer TOGETHER (a Test Utils
// from the old registry mounting components from the new one is two Vues). `App.vue` is replaced by a
// stub – the boot flow is not what these cases are about, only that the prompt stands in front of it.
//
// ⚠ MUTATION ARMS (watched red; outputs in the wave report):
//   1. `writeStoredLocale` made a no-op                  -> «never again after a choice» goes red.
//   2. LocalePrompt: `max-height: none` on the card      -> the phone-fit cases go red.
//   3. the switcher section moved to the Play tab        -> «beside the save controls» goes red.
//   4. the Russian pill's @click removed                 -> «flips the reactive locale» goes red.
//   5. AppRoot: the prompt's v-if made `true`            -> the answered / relaunch cases go red.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { installCatalog, locale, resetI18nForTests } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { installMemoryStorage, type MemoryStorage } from './setup'
import { assertDismissReachable, NARROW_PHONE, PHONE, setViewport } from './fits'
import '../../src/style.css'

vi.mock('../../src/App.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return { default: defineComponent({ name: 'AppStub', render: () => h('div', { class: 'app-stub' }, 'app') }) }
})

let storage: MemoryStorage
beforeEach(() => {
  storage = installMemoryStorage()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// =================================================================================================
// THE FIRST-RUN PROMPT
// =================================================================================================

/** Load the app as a fresh page would: new registry, storage as it stands. */
async function launch() {
  vi.resetModules()
  const [vtu, rootModule, i18n] = await Promise.all([
    import('@vue/test-utils'),
    import('../../src/AppRoot.vue'),
    import('../../src/i18n'),
  ])
  // ⚠ THE FLOW IS WHAT THESE CASES MEASURE, NOT THE SHIPPED CATALOG. Until L1b there was no `src/i18n/ru.json`,
  // so choosing Russian settled at once. Now the glob finds the real file and its loader is a genuine dynamic
  // import that takes real ticks – one `flushPromises` no longer settles the language, and the prompt (which
  // waits for it by design) stays up. A stand-in EMPTY catalog keeps the original premise – «an empty catalog
  // still gets there» – and keeps these cases independent of what the owner's approved rows say.
  i18n.registerCatalogLoader('ru', async () => ({}))
  const wrapper = vtu.mount(rootModule.default, { attachTo: document.body, global: { stubs: { teleport: true } } })
  await vtu.flushPromises()
  return { wrapper, i18n, flush: vtu.flushPromises }
}
type Launched = Awaited<ReturnType<typeof launch>>

const prompt = (l: Launched) => l.wrapper.find('.locale-prompt')
const app = (l: Launched) => l.wrapper.find('.app-stub')
const pick = (l: Launched, name: string) => l.wrapper.findAll('.locale-prompt button').find((b) => b.text() === name)!

describe('the first-run prompt – asked once, before the app, never again', () => {
  it('a device that has never answered meets the prompt, and App.vue is not mounted behind it', async () => {
    const l = await launch()
    expect(prompt(l).exists(), 'the prompt is up').toBe(true)
    expect(app(l).exists(), 'nothing of the app (splash, recovery, wizard) is mounted yet').toBe(false)
    expect(storage.backing.has('tb-locale'), 'asking writes nothing').toBe(false)
    l.wrapper.unmount()
  })

  it('it is a labelled modal dialog, and focus lands on its first control', async () => {
    const l = await launch()
    const card = l.wrapper.find('[role="dialog"]')
    expect(card.attributes('aria-modal')).toBe('true')
    const title = document.getElementById(card.attributes('aria-labelledby')!)
    expect(title, 'aria-labelledby resolves to the card\'s own title').toBeTruthy()
    const buttons = l.wrapper.findAll('.locale-prompt button')
    expect(buttons).toHaveLength(2)
    expect(document.activeElement, 'Enter answers the first control').toBe(buttons[0]!.element)
    l.wrapper.unmount()
  })

  it('CHOOSING ENGLISH IS ONE TAP: a single click ends the prompt and starts the app', async () => {
    const l = await launch()
    await pick(l, 'English').trigger('click')
    await l.flush()
    expect(prompt(l).exists()).toBe(false)
    expect(app(l).exists()).toBe(true)
    expect(storage.backing.get('tb-locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    l.wrapper.unmount()
  })

  it('choosing Russian writes the same preference and lets the app through (an empty catalog still gets there)', async () => {
    const l = await launch()
    await pick(l, 'Russian').trigger('click')
    await l.flush()
    expect(prompt(l).exists()).toBe(false)
    expect(app(l).exists()).toBe(true)
    expect(l.i18n.locale.value).toBe('ru')
    expect(storage.backing.get('tb-locale')).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    l.wrapper.unmount()
  })

  it('⚠ NEVER AGAIN AFTER A CHOICE: relaunching with the answer in storage goes straight to the app', async () => {
    const first = await launch()
    await pick(first, 'English').trigger('click')
    await first.flush()
    first.wrapper.unmount()
    document.body.innerHTML = ''
    // …a new page load, storage as the first one left it
    expect(storage.backing.get('tb-locale')).toBe('en')
    const second = await launch()
    expect(prompt(second).exists(), 'the prompt came back after an answer').toBe(false)
    expect(app(second).exists()).toBe(true)
    second.wrapper.unmount()
  })

  it('a returning Russian player boots into the app in Russian, with no prompt and no flash of the prompt', async () => {
    storage.backing.set('tb-locale', 'ru')
    const l = await launch()
    expect(prompt(l).exists()).toBe(false)
    expect(app(l).exists()).toBe(true)
    expect(l.i18n.locale.value).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    l.wrapper.unmount()
  })

  it('a private-mode browser (storage refuses writes) can still answer for the session', async () => {
    storage.mode = 'throws'
    const l = await launch()
    expect(prompt(l).exists()).toBe(true)
    await pick(l, 'English').trigger('click')
    await l.flush()
    expect(prompt(l).exists()).toBe(false)
    expect(app(l).exists()).toBe(true)
    l.wrapper.unmount()
  })

  it('⚠ ALWAYS ANSWERABLE: with the Russian chunk hung, a tap on English still gets through – and the dead request cannot take it back', async () => {
    const l = await launch()
    // Fake time starts AFTER the modules are loaded: Test Utils captured its real scheduler at import.
    vi.useFakeTimers()
    l.i18n.registerCatalogLoader('ru', () => new Promise(() => {}))
    await pick(l, 'Russian').trigger('click')
    await l.flush()
    expect(prompt(l).exists(), 'a pending language does not dismiss the prompt').toBe(true)
    await pick(l, 'English').trigger('click')
    await l.flush()
    expect(prompt(l).exists()).toBe(false)
    expect(app(l).exists()).toBe(true)
    expect(l.i18n.locale.value).toBe('en')
    expect(storage.backing.get('tb-locale')).toBe('en')
    // ...and when the superseded Russian request finally gives up waiting, it changes nothing: the
    // player answered English, and a language does not arrive behind their back four seconds later.
    await vi.advanceTimersByTimeAsync(l.i18n.CATALOG_TIMEOUT_MS + 50)
    await l.flush()
    expect(l.i18n.locale.value, 'the dead request flipped the language after the deadline').toBe('en')
    expect(storage.backing.get('tb-locale')).toBe('en')
    expect(app(l).exists()).toBe(true)
    l.wrapper.unmount()
  })
})

describe('⚠ the prompt is a BLOCKING surface, so it is measured against a phone (round-20 #3)', () => {
  // setViewport(PHONE) goes BEFORE the mount: happy-dom caches a media query on the first computed-style
  // read, so a late call would measure the desktop column and the arm could not redden.
  it.each([
    ['375x667', PHONE],
    ['320x568 (the narrow phone)', NARROW_PHONE],
  ])('both answers are reachable inside %s', async (_name, viewport) => {
    setViewport(viewport)
    const l = await launch()
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement would be vacuous').toBeTruthy()
    const card = document.querySelector('.locale-prompt .dialog-card')!
    const buttons = Array.from(card.querySelectorAll('button'))
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      assertDismissReachable(card, button, viewport, `first-run locale prompt, «${button.textContent}»`)
    }
    l.wrapper.unmount()
    setViewport({ width: 1024, height: 768 })
  })
})

// =================================================================================================
// THE MORE SWITCHER
// =================================================================================================

function mountMore(withCareer: boolean) {
  setActivePinia(createPinia())
  const store = useGameStore()
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  if (withCareer) store.snapshot = careerSnapshot(8, 'i18n-l1a-switcher')
  return mount(MoreScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}
type More = ReturnType<typeof mountMore>

async function openTab(w: More, label: 'Play' | 'Saves' | 'About'): Promise<void> {
  await w.findAll('.more-tabs .tab-pill').find((p) => p.text() === label)!.trigger('click')
}
const switcher = (w: More) => w.find('.locale-switcher')
const pill = (w: More, name: string) => w.findAll('.locale-switcher .option-pill').find((b) => b.text().endsWith(name))!

describe('the More switcher – beside the save controls, flipping the one preference', () => {
  beforeEach(() => {
    resetI18nForTests()
  })

  it('sits on the Saves tab directly after the Saves strip that carries Export and Import', async () => {
    const w = mountMore(true)
    await openTab(w, 'Saves')
    const el = switcher(w).element
    expect(el.tagName).toBe('SECTION')
    const strip = el.previousElementSibling!
    expect(strip.textContent, 'its neighbour is the save controls').toContain('Export to file')
    expect(strip.textContent).toContain('Import from file')
    expect(switcher(w).find('h2').text()).toBe('Language')
    expect(switcher(w).findAll('.option-pill')).toHaveLength(2)
    w.unmount()
  })

  it('needs no career: it is reachable with none open, like the feedback control beside it', async () => {
    const w = mountMore(false)
    await openTab(w, 'Saves')
    expect(useGameStore().snapshot).toBeNull()
    expect(switcher(w).exists()).toBe(true)
    w.unmount()
  })

  it('is NOT on the Play or About tabs – it is the save tab\'s neighbour, not a device-preference row', async () => {
    const w = mountMore(true)
    await openTab(w, 'Play')
    expect(switcher(w).exists()).toBe(false)
    await openTab(w, 'About')
    expect(switcher(w).exists()).toBe(false)
    await openTab(w, 'Saves')
    expect(switcher(w).exists()).toBe(true)
    w.unmount()
  })

  it('English is the selected pill on a fresh device, and the group is named', async () => {
    const w = mountMore(true)
    await openTab(w, 'Saves')
    expect(pill(w, 'English').attributes('aria-pressed')).toBe('true')
    expect(pill(w, 'Russian').attributes('aria-pressed')).toBe('false')
    expect(pill(w, 'English').classes()).toContain('selected')
    expect(switcher(w).find('[role="group"]').attributes('aria-label')).toBe('Language')
    w.unmount()
  })

  it('⚠ tapping Russian flips the REACTIVE locale, writes the preference, and the screen redraws from the catalog', async () => {
    installCatalog('ru', { Language: '[ru] Language', Russian: '[ru] Russian', English: '[ru] English' })
    const w = mountMore(true)
    await openTab(w, 'Saves')
    expect(switcher(w).find('h2').text()).toBe('Language')

    await pill(w, 'Russian').trigger('click')
    await flushPromises()
    expect(locale.value).toBe('ru')
    expect(storage.backing.get('tb-locale')).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    expect(switcher(w).find('h2').text(), 'the heading is drawn from the catalog now').toBe('[ru] Language')
    expect(pill(w, '[ru] Russian').attributes('aria-pressed')).toBe('true')
    expect(pill(w, '[ru] English').attributes('aria-pressed')).toBe('false')

    await pill(w, '[ru] English').trigger('click')
    await flushPromises()
    expect(locale.value).toBe('en')
    expect(storage.backing.get('tb-locale')).toBe('en')
    expect(switcher(w).find('h2').text()).toBe('Language')
    w.unmount()
  })

  it('answering from here ends the first-run question for good (one preference, two doors)', async () => {
    // An empty catalog: the preference is what this case is about, not the shipped file (see `launch`).
    installCatalog('ru', {})
    const w = mountMore(true)
    await openTab(w, 'Saves')
    await pill(w, 'Russian').trigger('click')
    await flushPromises()
    w.unmount()
    const l = await launch()
    expect(prompt(l).exists(), 'the switcher\'s answer is the same preference the prompt reads').toBe(false)
    expect(l.i18n.locale.value).toBe('ru')
    l.wrapper.unmount()
  })
})
