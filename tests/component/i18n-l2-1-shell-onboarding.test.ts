// L2-1 – THE NET UNDER THE FIRST TWO LANDING BATCHES: RU-01 (the shell) and RU-02A (entry, wizard, tour).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-ui-shell-2026-09.md, docs/localization/ru-onboarding-2026-10.md.
//
// Three questions, asked of the REAL components mounted:
//   1. PARITY. With no catalog the English renders exactly as it shipped – the wiring changed no word (invariant 4).
//      The existing pins over these surfaces stay the main net; these arms cover what had no mounted net at all
//      (the recovery screen, the nav labels and their dots, the wizard's family/coaching/style cards, the tour's
//      eighth mark).
//   2. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed, the locale is flipped, and the woken strings
//      render his Russian: `Дом` on the nav, `Рейтинг` on the Stats tab and on the tour's mark for it, the three
//      family labels on the wizard's cards. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every expected value is READ
//      from ru.json by key, so a wording change in his table moves the test with it and an agent cannot "fix" a
//      string here.
//   3. THE `xx` SWEEP over both surfaces (L1b's harness): no unbracketed text where a string is wired, and the
//      nav / week bar / wizard footer still fit a 375px phone with every label 30% longer. The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import OnboardingTour from '../../src/components/OnboardingTour.vue'
import { useGameStore } from '../../src/stores/game'
import { needRefresh } from '../../src/pwa'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { installCatalog, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { assertInlineRowFits, assertRowFits, demandedWidth, lengthPx, PHONE, setViewport } from './fits'
import { hardcodeLeaks, installPseudoLocale, pseudoCatalog } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every expected value below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const ruOf = (key: string): string => {
  const v = RU[key]
  if (v === undefined) throw new Error(`ru.json has no entry for «${key}» – the importer did not compile its row`)
  return v
}

const exact = (...texts: string[]): RegExp[] => texts.map((t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
  needRefresh.value = false
  vi.restoreAllMocks()
})

// --- the shell, mounted the way round26's span-gate test mounts it --------------------------------------------

interface ShellOptions {
  phase?: 'ready' | 'recovery'
  ready?: boolean
  recovered?: boolean
  stopReasons?: string[]
  vp?: typeof PHONE
}
async function openShell(opts: ShellOptions = {}): Promise<{ w: VueWrapper; game: ReturnType<typeof useGameStore> }> {
  // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
  setViewport(opts.vp ?? PHONE)
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: opts.ready ?? true, phase: opts.phase ?? 'ready' })
  const snapshot = toSnapshot(createWorld('l2-1-shell', DEFAULT_PROFILE))
  if (opts.stopReasons) snapshot.stopReasons = opts.stopReasons as typeof snapshot.stopReasons
  game.snapshot = snapshot
  game.recovered = opts.recovered ?? false
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  const splash = w.findComponent(SplashScreen)
  if (splash.exists()) splash.vm.$emit('done')
  await flushPromises()
  return { w, game }
}

const tabLabels = (w: VueWrapper): string[] => w.findAll('.tab-btn .tab-label').map((e) => e.text())
const tabNames = (w: VueWrapper): (string | undefined)[] => w.findAll('.tab-btn').map((e) => e.attributes('aria-label'))

describe('L2-1 parity – the English the shell shipped, byte for byte', () => {
  it('the bottom bar: five labels, the same five accessible names, the landmark `Main`', async () => {
    const { w } = await openShell()
    expect(tabLabels(w)).toEqual(['Season', 'Calendar', 'Home', 'Stats', 'Trophies'])
    expect(tabNames(w)).toEqual(['Season', 'Calendar', 'Home', 'Stats', 'Trophies'])
    expect(w.get('nav.tab-bar').attributes('aria-label')).toBe('Main')
    w.unmount()
  })

  it('the storage-recovery screen and the loading line', async () => {
    const { w } = await openShell({ phase: 'recovery', ready: false })
    const screen = w.get('.recovery-screen')
    expect(screen.get('h2').text()).toBe("Saved games can't be reached")
    const hints = screen.findAll('p.hint').map((p) => p.text())
    expect(hints).toEqual([
      "The browser refused to open this game's storage – this can happen in private browsing, when disk is full, or after a browser update.",
      'Nothing has been deleted – if storage comes back, your careers will still be here.',
    ])
    expect(screen.findAll('.recovery-actions button').map((b) => b.text())).toEqual(['Retry', 'Import a save file', 'Start a new career'])
    w.unmount()
    const loading = await openShell({ phase: 'ready', ready: false })
    expect(loading.w.get('.app-loading').text()).toBe('Loading…')
    loading.w.unmount()
  })

  it('the three top notices: update strip, autosave strip, stop toast – words and accessible names', async () => {
    needRefresh.value = true
    const { w } = await openShell({ recovered: true, stopReasons: ['offer'] })
    const update = w.get('.update-banner')
    expect(update.get('span').text()).toBe('New version available')
    expect(update.get('button').text()).toBe('Update')
    const autosave = w.get('.recovered-banner')
    expect(autosave.get('span').text()).toBe('Autosave was damaged – restored the previous one.')
    expect(autosave.get('button').text()).toBe('Dismiss')
    expect(autosave.get('button').attributes('aria-label')).toBe('Dismiss autosave notice')
    const toast = w.get('.stop-toast')
    expect(toast.get('span').text()).toBe('Stopped: a new offer is in her inbox, on Home – answer it before its deadline or it lapses.')
    expect(toast.get('button').text()).toBe('Dismiss')
    expect(toast.get('button').attributes('aria-label')).toBe('Dismiss stop notice')
    w.unmount()
  })

  it('the funds stop speaks the countdown in the shipped English, singular and plural', async () => {
    const { w, game } = await openShell({ stopReasons: ['funds'] })
    const say = async (weeks: number, graceWeeks: number): Promise<string> => {
      game.snapshot = { ...game.snapshot!, debt: { weeks, graceWeeks } as never }
      await flushPromises()
      return w.get('.stop-toast span').text()
    }
    expect(await say(1, 4)).toBe('Stopped: 1 week below zero – 3 before the money runs out for good.')
    expect(await say(2, 4)).toBe('Stopped: 2 weeks below zero – 2 before the money runs out for good.')
    expect(await say(4, 4)).toBe('Stopped: below zero, and out of time.')
    w.unmount()
  })

  it('the three dot sentences (the tab dots are state-driven; the readers are asked directly) and the stop copy table', async () => {
    const { w } = await openShell()
    const vm = w.vm as unknown as {
      TAB_DOT_LABEL: Record<string, () => string>
      STOP_REASON_TEXT: Record<string, () => string>
    }
    expect(vm.TAB_DOT_LABEL.play?.()).toBe('New on the season calendar')
    expect(vm.TAB_DOT_LABEL.home?.()).toBe('Unread news')
    expect(vm.TAB_DOT_LABEL.trophies?.()).toBe('A new trophy in the cabinet')
    expect(Object.keys(vm.TAB_DOT_LABEL).sort(), 'no fourth dot grew a sentence').toEqual(['home', 'play', 'trophies'])
    expect(
      Object.fromEntries(Object.entries(vm.STOP_REASON_TEXT).map(([k, read]) => [k, read()])),
    ).toEqual({
      deadline: 'Stopped: an entry deadline is coming up next week.',
      funds: 'Stopped: funds ran below zero.',
      medical: 'Stopped: she was not cleared to play – withdrawn on medical advice.',
      walkover: 'Stopped: she was too injured to play – walkover, entry fee forfeited.',
      academy: 'Stopped: the academy has reviewed her year – the letter is in her inbox, on Home.',
      offer: 'Stopped: a new offer is in her inbox, on Home – answer it before its deadline or it lapses.',
      'college-league': 'She played the college championship – the matches are in the news feed, and they can be watched.',
    })
    w.unmount()
  })
})

// --- the wizard ------------------------------------------------------------------------------------------------

const wizardStep = (w: VueWrapper): number => {
  const order = ['.ob-welcome', '.ob-fields', '.ob-country', '.ob-family', '.ob-styles', '.ob-summary']
  return order.findIndex((sel) => w.find(sel).exists()) + 1
}
/** Walk the real controls: press the primary control, and when the country gate refuses, pick a tile. */
async function walkTo(w: VueWrapper, target: number): Promise<void> {
  for (let guard = 0; guard < 20 && wizardStep(w) < target; guard++) {
    const cta = w.get('.ob-cta')
    if (cta.attributes('disabled') === undefined) {
      await cta.trigger('click')
      continue
    }
    await w.get('.ob-tile').trigger('click')
  }
  expect(wizardStep(w), `the walk reached step ${target}`).toBe(target)
}
const mountWizard = (): VueWrapper => mount(OnboardingWizard, { attachTo: document.body })

describe('L2-1 parity – the wizard, step by step, in the shipped English', () => {
  it('step 1: the two-beat hero keeps its markup, the three paragraphs, the footer pair', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // the ONE draw: index 1 of the three promises
    const w = mountWizard()
    const h1 = w.get('#ob-hero-title')
    expect(h1.element.textContent).toBe('Raise a Champion.Together.')
    expect(h1.findAll('br')).toHaveLength(1)
    expect(h1.get('span').text()).toBe('Together.')
    expect(w.get('ol.ob-steps').attributes('aria-label')).toBe('Step 1 of 6')
    const paragraphs = w.findAll('.ob-copy p').map((p) => p.text())
    expect(paragraphs).toEqual([
      "You're the parent now – every choice, every dollar, every away tournament is yours to carry.",
      'Your kid can play. What happens next is mostly about you, and it will cost more than you think, sooner than you think.',
      "Rackets, coaches, flights, hotels – the costs are honest, and they don't wait for a breakthrough.",
    ])
    expect(w.get('.ob-cta').text()).toBe('Begin')
    expect(w.get('.ob-quiet').text()).toBe('Skip for now')
    w.unmount()
  })

  it('steps 2 and 3: the identity fields, the dice, the gender pair, the birthday, the country search', async () => {
    const w = mountWizard()
    await walkTo(w, 2)
    expect(w.get('.ob-title').text()).toBe('Who Is Your Player?')
    expect(w.get('.ob-sub').text()).toBe("Let's start with who she is.")
    expect(w.get('label[for="ob-first"]').text()).toBe('First name')
    expect(w.get('#ob-first').attributes('placeholder')).toBe('First name')
    expect(w.get('label[for="ob-last"]').text()).toBe('Last name')
    expect(w.findAll('.ob-dice').map((b) => b.attributes('aria-label'))).toEqual(['Random first name', 'Random last name'])
    expect(w.get('#ob-gender-label').text()).toBe('Gender')
    const pick = w.findAll('.ob-pair .ob-pick')
    expect(pick.map((b) => b.text())).toEqual(['Girl', 'Boy'])
    expect(pick[1]!.attributes('title')).toBe("The boys' tour is coming later")
    expect(w.get('label[for="ob-month"]').text()).toBe('Birthday')
    expect(w.get('#ob-month').attributes('aria-label')).toBe('Birth month')
    expect(w.get('#ob-day').attributes('aria-label')).toBe('Birth day')
    expect(w.findAll('#ob-month option').map((o) => o.text())).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
    ])
    expect(w.get('.ob-note').text()).toBe(
      'Age groups go by year, so an older girl is stronger now – and a younger one has more room later, and loses fewer weeks. The day is for her birthday.',
    )
    await walkTo(w, 3)
    expect(w.get('.ob-title').text()).toBe('Where Are You Starting?')
    expect(w.get('.ob-sub').text()).toBe('Select your country.')
    const search = w.get('.ob-search-input')
    expect(search.attributes('placeholder')).toBe('Search countries...')
    expect(search.attributes('aria-label')).toBe('Search countries')
    expect(w.findAll('.ob-eyebrow').map((e) => e.text())).toEqual(['Popular', 'All countries'])
    expect(w.get('.ob-browse').text()).toBe('Browse all countries')
    await search.setValue('zzzz-no-such-country')
    expect(w.get('.ob-empty').text()).toBe('No country matches that.')
    expect(w.get('.ob-eyebrow').text()).toBe('Results')
    w.unmount()
  })

  it('steps 4 and 5: the family cards (label, budget line, blurb), the coaching pair, the four styles and their chips', async () => {
    const w = mountWizard()
    await walkTo(w, 4)
    expect(w.get('.ob-title').text()).toBe('Family Setup')
    expect(w.get('.ob-sub').text()).toBe('Your resources and support shape the path.')
    expect(w.findAll('.ob-eyebrow').map((e) => e.text())).toEqual(['Family background', 'Coaching'])
    expect(w.get('.ob-stack').attributes('aria-label')).toBe('Family background')
    const rows = w.findAll('.ob-stack .ob-row')
    expect(rows.map((r) => r.get('.ob-row-title').text())).toEqual(['Wealthy', 'Middle class', 'Working class'])
    // the bold figure keeps its own element and the sentence around it reads as it always did
    expect(rows.map((r) => r.get('.ob-row-money').element.textContent)).toEqual([
      '$120,000 starting budget',
      '$25,000 starting budget',
      '$8,000 starting budget',
    ])
    expect(rows.map((r) => r.get('.ob-row-money b').text())).toEqual(['$120,000', '$25,000', '$8,000'])
    expect(rows.map((r) => r.get('.ob-row-blurb').text())).toEqual([
      'Top academies are within reach.',
      'Smart choices, steady progress.',
      'Big dreams, hard mode.',
    ])
    expect(w.get('.ob-pair').attributes('aria-label')).toBe('Coaching')
    expect(w.findAll('.ob-cell').map((c) => [c.get('.ob-cell-title').text(), c.get('.ob-cell-blurb').text()])).toEqual([
      ['Coach yourself', 'Cheaper now, training unlocks later.'],
      ['Hire a coach', 'Pro guidance, and a real weekly bill.'],
    ])
    await walkTo(w, 5)
    expect(w.get('.ob-title').text()).toBe('Choose Play Style')
    expect(w.get('.ob-sub').text()).toBe('This shapes strengths and training focus.')
    expect(w.get('.ob-styles').attributes('aria-label')).toBe('Play style')
    expect(
      w.findAll('.ob-style').map((s) => [s.get('.ob-style-title').text(), s.get('.ob-style-blurb').text(), s.findAll('.ob-chip').map((c) => c.text())]),
    ).toEqual([
      ['Aggressive baseliner', 'Dictate with heavy groundstrokes.', ['Power', 'Consistency']],
      ['Counterpuncher', 'Speed, defense, and endless patience.', ['Defense', 'Stamina']],
      ['Big serve', 'Free points first.', ['Serve', 'Power']],
      ['All-court', 'No weaknesses, no shortcuts.', ['Versatility', 'Balance']],
    ])
    w.unmount()
  })

  it('step 6: the summary sheet, the weight block, the vow, the footer', async () => {
    const w = mountWizard()
    await walkTo(w, 6)
    expect(w.get('.ob-title').text()).toBe('All Set!')
    expect(w.get('.ob-sub').text()).toBe('Here she is. The rest is the two of you.')
    expect(w.get('.ob-art--summary img').attributes('alt')).toBe('Your champion, on the day she first walks into the club')
    expect(w.findAll('.ob-sheet-list dt').map((d) => d.text())).toEqual(['Name', 'Country', 'Birth month', 'Background', 'Coaching', 'Play style'])
    expect(w.findAll('.ob-sheet-list dd')[2]!.text()).toBe('June 15') // the profile's default birthday, through the date label
    expect(w.get('.ob-weight-title').text()).toBe('The weight')
    expect(w.get('.sound-switch-label').text()).toBe('Leave them out')
    expect(w.get('.ob-vow').text()).toBe("Every practice. Every match. Every choice. You've got this.")
    expect(w.findAll('.ob-foot button').map((b) => b.text())).toEqual(['Back', 'Start career'])
    w.unmount()
  })
})

describe('L2-1 parity – the tour, first and last mark', () => {
  it('reads the shipped titles, Skip tour and Next / Got it', async () => {
    const w = mount(OnboardingTour, { props: { screen: 'home' }, attachTo: document.body })
    expect(w.get('.coach-tooltip-title').text()).toBe('You are the parent')
    expect(w.get('.coach-tooltip-text').text()).toBe(
      'You do not play the matches – you raise the player. This is Home: her diary for the week, her photo and how she is doing.',
    )
    expect(w.get('.coach-tooltip-actions .link').text()).toBe('Skip tour')
    expect(w.get('.coach-tooltip-actions .primary').text()).toBe('Next')
    const titles: string[] = []
    for (let i = 0; i < 10; i++) {
      await w.get('.coach-tooltip-actions .primary').trigger('click')
      titles.push(w.get('.coach-tooltip-title').text())
    }
    expect(titles).toEqual([
      'Her page', 'News and letters', 'The money is yours', 'This week', 'Season – where you enter', 'Calendar', 'Stats', 'Trophies', 'Settings', 'Now play a week',
    ])
    expect(w.get('.coach-tooltip-actions .primary').text()).toBe('Got it')
    w.unmount()
  })
})

// --- the Russian smoke: the real ru.json, the locale flipped ---------------------------------------------------

describe('L2-1 Russian smoke – his approved rows reach the screen', () => {
  it('the nav: Home and the Stats TAB read his rulings; the labels he has not approved yet stay English and count as misses', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const { w } = await openShell()
    const labels = tabLabels(w)
    expect(labels[2], 'Home').toBe(ruOf('Home'))
    expect(labels[3], 'the Stats tab is the NAV key, not the screen heading').toBe(ruOf('nav|Stats'))
    expect(tabNames(w)[2], 'the accessible name ships with the control').toBe(ruOf('Home'))
    expect(tabNames(w)[3]).toBe(ruOf('nav|Stats'))
    // DRAFT rows compile nowhere: Season / Calendar / Trophies and the landmark fall back to English, counted
    expect(labels[0]).toBe('Season')
    expect(missedKeys()).toEqual(expect.arrayContaining(['Season', 'Calendar', 'Trophies', 'Main']))
    expect(missedKeys()).not.toContain('Home')
    expect(missedKeys()).not.toContain('nav|Stats')
    w.unmount()
  })

  it('a mounted shell follows the locale flip: the same tab re-renders when the catalog arrives', async () => {
    const { w } = await openShell()
    expect(tabLabels(w)[2]).toBe('Home')
    installCatalog('ru', RU)
    await setLocale('ru')
    await flushPromises()
    expect(tabLabels(w)[2]).toBe(ruOf('Home'))
    await setLocale('en')
    await flushPromises()
    expect(tabLabels(w)[2]).toBe('Home')
    w.unmount()
  })

  it('the wizard: the three family cards read the labels he approved on 07.10, the draft blurbs stay English', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mountWizard()
    await walkTo(w, 4)
    const rows = w.findAll('.ob-stack .ob-row')
    expect(rows.map((r) => r.get('.ob-row-title').text())).toEqual([ruOf('Wealthy'), ruOf('Middle class'), ruOf('Working class')])
    expect(rows[0]!.get('.ob-row-blurb').text(), 'a DRAFT blurb never shows as Russian').toBe('Top academies are within reach.')
    expect(rows[0]!.get('.ob-row-money').element.textContent).toBe('$120,000 starting budget')
    w.unmount()
  })

  it('the tour: the eighth mark teaches the same word the bar shows', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mount(OnboardingTour, { props: { screen: 'home' }, attachTo: document.body })
    for (let i = 0; i < 7; i++) await w.get('.coach-tooltip-actions .primary').trigger('click')
    expect(w.get('.coach-tooltip-title').text()).toBe(ruOf('nav|Stats'))
    w.unmount()
  })

  it('⚠ THE OPENING PROMISE IS ONE DRAW: flipping the language re-renders the SAME sentence, no second roll', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99) // index 2 of the three
    const w = mountWizard()
    const key = 'She has something. Whether it becomes anything is a question about your time, your money and your nerve.'
    expect(w.findAll('.ob-copy p')[1]!.text()).toBe(key)
    const draws = random.mock.calls.length
    await installPseudoLocale() // any other language will do – the sentence must follow it
    await flushPromises()
    expect(w.findAll('.ob-copy p')[1]!.text(), 'the same promise, in the new language').toBe(pseudoCatalog()[key])
    expect(random.mock.calls.length, 'a locale change consumed no draw').toBe(draws)
    w.unmount()
  })
})

// --- the `xx` sweep over both surfaces -------------------------------------------------------------------------

describe('L2-1 xx sweep – no unwrapped literal on the wired surfaces, and the phone still holds the longer text', () => {
  it('the shell strings (recovery, loading, notices, nav) have no leak', async () => {
    await installPseudoLocale()
    needRefresh.value = true
    const { w } = await openShell({ recovered: true, stopReasons: ['offer'] })
    for (const sel of ['.update-banner', '.recovered-banner', '.stop-toast']) expect(hardcodeLeaks(w.get(sel).element), sel).toEqual([])
    const nav = w.get('nav.tab-bar').element
    const leaks = ([...nav.querySelectorAll('.tab-btn')] as Element[]).flatMap((b) => hardcodeLeaks(b))
    expect(leaks, 'the five tabs').toEqual([])
    expect(nav.getAttribute('aria-label')).toMatch(/^⟦Main/)
    w.unmount()
    const recovery = await openShell({ phase: 'recovery', ready: false })
    expect(hardcodeLeaks(recovery.w.get('.recovery-screen').element)).toEqual([])
    recovery.w.unmount()
    const loading = await openShell({ phase: 'ready', ready: false })
    expect(hardcodeLeaks(loading.w.get('.app-loading').element)).toEqual([])
    loading.w.unmount()
  })

  it('the splash has no leak (the product mark is allow-listed by the spec, the instruction is wired)', async () => {
    await installPseudoLocale()
    const w = mount(SplashScreen, { attachTo: document.body })
    expect(hardcodeLeaks(w.element)).toEqual([])
    expect(w.get('.splash').attributes('aria-label')).toMatch(/^⟦Tap to start/)
    w.unmount()
  })

  it('the five-item bottom bar at 375: English, +30%, the xx pad, and the words his table carries (numbers printed)', async () => {
    // ⚠ THE INSTRUMENT'S BLIND SPOT, FOUND BY PRINTING IT: `assertRowFits` charges a label only when the CONTROL says
    // `white-space: nowrap` or the label has no break opportunity. The tab's `nowrap` lives on the CHILD `.tab-label`, and an xx
    // label has a space in it, so the same bar scored 8.0px per tab under xx against 28-45px in English – more slack for longer
    // text. So the nav is charged here per LABEL SPAN (which does declare nowrap) plus the button's own padding, and the method is
    // calibrated against the instrument on the English bar before it is trusted anywhere else.
    const measure = (w: VueWrapper): { room: number; per: number[]; total: number } => {
      const bar = w.get('nav.tab-bar').element
      const cs = getComputedStyle(bar)
      const maxWidth = lengthPx(cs.maxWidth, PHONE.width)
      const room = Math.min(PHONE.width, Number.isFinite(maxWidth) ? maxWidth : Infinity) - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)
      const per = [...bar.querySelectorAll('.tab-btn')].map((btn) => {
        const bcs = getComputedStyle(btn)
        const chrome = (parseFloat(bcs.paddingLeft) || 0) + (parseFloat(bcs.paddingRight) || 0)
        return chrome + demandedWidth(btn.querySelector('.tab-label')!, room)
      })
      return { room, per, total: per.reduce((a, b) => a + b, 0) }
    }
    const english = await openShell()
    const en = measure(english.w)
    const instrument = assertRowFits(english.w.get('nav.tab-bar').element, [...english.w.get('nav.tab-bar').element.querySelectorAll('.tab-btn')], PHONE, 'tab bar (English)')
    // The instrument bills each label at the BUTTON's 11px; the label itself is 10px (`.tab-label`), so the per-label charge is the
    // tighter and truer one: never above the instrument's, and within the 10% that font-size ratio accounts for.
    const instrumentTotal = en.room - instrument
    expect(en.total, 'never above the shared instrument').toBeLessThanOrEqual(instrumentTotal)
    expect(instrumentTotal - en.total, 'and the gap is the 11px-vs-10px ratio, nothing else').toBeLessThan(en.total * 0.12)
    english.w.unmount()

    // the words his table carries for the five tabs: Home and the Stats tab are APPROVED (ru.json), the other three are DRAFT rows
    const doc = readFileSync('docs/localization/ru-ui-shell-2026-09.md', 'utf8').split('\n')
    const cell = (id: string, col: number): string => {
      const line = doc.find((l) => l.startsWith(`| ${id} |`))
      if (!line) throw new Error(`${id} is no longer a row of the shell table`)
      return (line.split('|')[col] ?? '').trim().replace(/^`|`$/g, '')
    }
    const words = { Season: cell('RU01-N01', 4), Calendar: cell('RU01-N02', 4), Home: ruOf('Home'), 'nav|Stats': ruOf('nav|Stats'), Trophies: cell('RU01-N05', 4) }
    resetI18nForTests(null)
    installCatalog('ru', { ...RU, ...words })
    await setLocale('ru')
    const russian = await openShell()
    const ru = measure(russian.w)
    expect(russian.w.findAll('.tab-btn .tab-label').map((e) => e.text()), 'the bar is really drawing his words').toEqual(Object.values(words))
    russian.w.unmount()

    resetI18nForTests(null)
    await installPseudoLocale()
    const pseudo = await openShell()
    const xx = measure(pseudo.w)
    pseudo.w.unmount()

    const plus30 = en.per.map((n) => n * 1.3)
    const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0)
    console.log(
      `[L2-1 xx] five-tab bar at 375 (room ${en.room.toFixed(0)}px): English ${en.total.toFixed(1)}px · English +30% ${sum(plus30).toFixed(1)}px · ` +
        `his words (Season/Calendar/Home/Stats/Trophies as the table carries them) ${ru.total.toFixed(1)}px [${ru.per.map((n) => n.toFixed(0)).join('/')}] · ` +
        `the xx pad ${xx.total.toFixed(1)}px (xx pads a ONE-word label with the whole word again: +100%, not +30%)`,
    )
    expect(en.total).toBeLessThanOrEqual(en.room)
    expect(sum(plus30), 'the bar holds every label 30% longer').toBeLessThanOrEqual(en.room)
    expect(ru.total, 'RU-01 §7 finding 3: the five Russian words fit the real five-item bar at 375px').toBeLessThanOrEqual(ru.room)
    expect(xx.total, 'the xx bar demands more than English – the measurement is not vacuous').toBeGreaterThan(en.total)
  })

  it('the week bar button keeps its label inside its declared minimum under xx (numbers printed)', async () => {
    const english = await openShell()
    const bar = (w: VueWrapper): { slack: number; demand: number; label: string } => {
      const el = w.get('.next-week-bar').element
      const cta = el.querySelector('.next-week-btn')!
      return { slack: assertRowFits(el, [...el.children], PHONE, 'week bar'), demand: demandedWidth(cta, 343), label: (cta.textContent ?? '').trim() }
    }
    const before = bar(english.w)
    english.w.unmount()
    resetI18nForTests(null)
    await installPseudoLocale()
    const pseudo = await openShell()
    const after = bar(pseudo.w)
    pseudo.w.unmount()
    console.log(`[L2-1 xx] week bar at 375: "${before.label}" demands ${before.demand.toFixed(1)}px, slack ${before.slack.toFixed(1)}px -> "${after.label}" demands ${after.demand.toFixed(1)}px, slack ${after.slack.toFixed(1)}px`)
    expect(after.label).not.toBe(before.label)
    expect(after.slack).toBeGreaterThanOrEqual(0)
  })

  it('the wizard, every step: no unwrapped literal (names and country names allow-listed), the footer pair fits the phone', async () => {
    await installPseudoLocale()
    setViewport(PHONE)
    const w = mountWizard()
    const slack: string[] = []
    const names = Object.values(COUNTRY_NAMES)
    // ⚠ THE HERO IS ONE KEY CUT INTO TWO BEATS (RU-02A-H02), so under xx its tail node is the end of a bracketed string and carries
    // no opening bracket of its own: `⟧`-terminated text is allowed. An UNWRAPPED tail (`Together.`) still ends in neither and is reported.
    let allow = [...exact(...names), /⟧$/]
    for (let step = 1; step <= 6; step++) {
      await walkTo(w, step)
      if (step === 2) {
        const first = (w.get('#ob-first').element as HTMLInputElement).value
        const last = (w.get('#ob-last').element as HTMLInputElement).value
        allow = [...allow, ...exact(first, last, `${first} ${last}`)]
      }
      const leaks = hardcodeLeaks(w.get('.onboarding').element, allow)
      expect(leaks, `step ${step}`).toEqual([])
      const foot = w.get('.ob-foot')
      const items = [...foot.element.querySelectorAll('button')]
      if (step > 1) slack.push(`step ${step}: ${assertInlineRowFits(foot.element, items, PHONE, `wizard footer, step ${step}`).toFixed(1)}px`)
    }
    console.log(`[L2-1 xx] wizard footer slack at 375 (Back + primary): ${slack.join(' · ')}`)
    w.unmount()
  })

  it('the tour card has no leak and stays a one-card surface', async () => {
    await installPseudoLocale()
    const w = mount(OnboardingTour, { props: { screen: 'home' }, attachTo: document.body })
    for (let i = 0; i < 11; i++) {
      expect(hardcodeLeaks(w.element), `mark ${i + 1}`).toEqual([])
      await w.get('.coach-tooltip-actions .primary').trigger('click')
    }
    w.unmount()
  })
})
