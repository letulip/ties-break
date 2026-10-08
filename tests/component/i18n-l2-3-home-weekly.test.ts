// L2-3 – THE NET UNDER RU-03: HOME, THE IDENTITY RAIL, THE DASHBOARD CARDS, THE SEASON STRIP, THE NEWS SHELL, THE CALENDAR'S FRAME,
// THIS WEEK AND THE WEEKLY RECAP.  docs/specs/i18n-2026-10.md §8, docs/localization/ru-home-weekly-2026-10.md.
//
// Six questions, asked of the REAL screens mounted and of the REAL catalog:
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The existing Home / Calendar /
//      recap pin families (all green, some through `tTransparent`) are the wide net; what is here is the mounted anchors for the new seams.
//   2. COMPLETENESS. Every CERTAIN string of the nine batch files is a WIRED key – the leftovers are named, each with its reason. A sentence
//      added to these screens without `t()` reddens here instead of rendering English under a Russian locale (ruling 4).
//   3. THE SEAMS THAT WERE ENGLISH LOGIC. The greeting's collision rule no longer slices the English greeting, so it must pick the same
//      BRANCH in any language; the ladder words equal `LADDER_LABEL`; AS19's sentence renders character for character as before.
//   4. THE CONTEXT TAGS. Every tag this wave added is a wired key, renders the bare English, and is the key the mounted site really asks for.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key: an approved row must render his Russian, an unapproved one must render the English and be
//      COUNTED as a miss. As of this wave no RU-03 row is APPROVED, so the second arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed text where a string is wired, and the two tightest surfaces (the dashboard card grid, the recap card)
//      still hold a 375x667 phone with every word longer. The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import RailIdentity from '../../src/components/RailIdentity.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import { ladderName } from '../../src/composables/kidIdentity'
import { rungLine } from '../../src/composables/nextGoal'
import { DAY_LONG, DAY_SHORT } from '../../src/composables/weekDays'
import { LADDER_LABEL } from '../../src/shared/protocol'
import { rankLabel } from '../../src/shared/format'
import type { Snapshot } from '../../src/shared/protocol'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { installMemoryStorage } from './setup'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'
import { hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }

const SEED = 'l23-home'
const WEEKS = 40
let base: Snapshot
/** The same career with a rank on the active table, because the chip is drawn only once something counts (`rankChipTrack`) and an unplayed career has none. */
let ranked: Snapshot
const withRank = (snap: Snapshot, rank = 17, prevRank = 21): Snapshot => {
  const track = snap.activeLadder
  return { ...snap, ladders: { ...snap.ladders, [track]: { ...snap.ladders[track], rank, prevRank } } }
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  base ??= careerSnapshot(WEEKS, SEED)
  ranked = withRank(base)
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the mounts ------------------------------------------------------------------------------------------------

function use(snapshot: Snapshot = base): void {
  useGameStore().snapshot = snapshot
}
function mountHome(snapshot: Snapshot = ranked): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(HomeScreen, { props: { recapFresh: true }, global: { stubs: { teleport: true } }, attachTo: document.body })
}
function mountRecap(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(WeekRecapCard, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
function mountCalendar(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(CalendarScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
function mountWeek(snapshot: Snapshot = base): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(ThisWeekScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}

/** Every player-visible string under `root`: text nodes and the four copy attributes, in one string – for «is this word on screen». */
function seen(root: Element): string {
  const parts: string[] = [root.textContent ?? '']
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of ['title', 'aria-label', 'placeholder', 'alt']) {
      const v = el.getAttribute(a)
      if (v) parts.push(v)
    }
  }
  return parts.join('\n')
}

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-3 parity – the English the screens shipped, with no catalog', () => {
  it('Home: the hero controls, the cards, the season strip and the news shell read exactly as they did', () => {
    const w = mountHome()
    const q = (sel: string): Element => w.get(sel).element
    expect(q('[data-tour="kid-avatar"]').getAttribute('aria-label')).toBe('Open her profile')
    expect(q('[data-tour="home-news"]').getAttribute('aria-label')).toBe('Go to the news feed')
    expect(q('[data-tour="home-news"]').getAttribute('title')).toBe('News')
    expect(q('[data-tour="home-settings"]').getAttribute('aria-label')).toBe('Settings')
    expect(q('.diary-age').textContent).toMatch(/^\d+ years old /)
    const text = seen(w.element)
    for (const word of ['Next tournament', 'Family budget', 'Last 12 weeks', 'Coach note', 'Recent memory', 'Season', 'News', 'Season ladder', 'Open the inbox']) {
      expect(text, word).toContain(word)
    }
    expect(w.get('.season-strip').attributes('aria-label')).toBe('Season ladder')
    expect(seen(w.get('.card-grid').element)).toContain('A new week recap is waiting')
    expect(w.get('.diary-rank').attributes('aria-label')).toBe('How ranking points work')
    // the chip: the ladder word and the rank, exactly as `LADDER_LABEL` + `rankLabel` made them
    const ladder = ranked.ladders[ranked.activeLadder]
    expect(w.get('.diary-rank .rank-ladder').text()).toBe(LADDER_LABEL[ranked.activeLadder])
    expect(w.get('#diary-rank-value').text()).toBe(rankLabel(ladder.rank ?? 0, ladder.rank !== null))
    expect(w.get('.diary-rank .rank-move').text()).toBe('↑4')
    w.unmount()
  })

  it('the rail copy shares the three labels with Home – the same words from the same keys', () => {
    use()
    const w = mount(RailIdentity, { global: { stubs: { teleport: true } } })
    expect(w.get('.rail-id-avatar').attributes('aria-label')).toBe('Open her profile')
    w.unmount()
  })

  it('the recap: frame, finance rows, training tile, mood, highlights and the goal scrap', () => {
    const w = mountRecap()
    const text = seen(w.element)
    expect(w.get('.recap-card').attributes('aria-label')).toMatch(/^Week story, /)
    for (const word of ['Finances', 'Income', 'Family income', 'Spent', 'Balance', 'Training', 'On court', 'Rest', 'Mood', 'Energy', 'Highlights', 'Next goal']) {
      expect(text, word).toContain(word)
    }
    expect(w.get('.recap-days').attributes('aria-label')).toMatch(/^\d of 7 days training$/)
    w.unmount()
  })

  it('the calendar: heading, the grid group and every column keep their sentences; the look-ahead keeps its heading', () => {
    const w = mountCalendar()
    expect(w.get('.cal-title').text()).toBe('Calendar')
    expect(w.get('.cal-time-cols').attributes('aria-label')).toMatch(/^The seven days of /)
    const days = DAY_LONG.join('|')
    const kinds = 'on court|in the gym|rest day|practice match|away at the tournament|no tennis|school exams|rehab|at the shoot'
    for (const col of w.findAll('.cal-col')) expect(col.attributes('aria-label')).toMatch(new RegExp(`^(${days}) – (${kinds})$`))
    expect(w.text()).toContain('Weeks after that')
    expect(DAY_SHORT.join(' ')).toBe('MON TUE WED THU FRI SAT SUN')
    w.unmount()
  })

  it('this week: the heading, the plan group and the exit', () => {
    const w = mountWeek()
    const text = seen(w.element)
    expect(text).toContain('This week')
    expect(text).toContain('Training plan')
    expect(text).toContain('Planned spend')
    expect(text).toMatch(/Training \d+% · Rest \d+%/)
    for (const label of ['Grind 85/15', 'Balanced 75/25', 'Light 60/40']) expect(text, label).toContain(label)
    w.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-3 completeness – every string of the batch files is a wired key, and the leftovers are named', () => {
  const FILES = [
    'src/components/screens/HomeScreen.vue',
    'src/components/RailIdentity.vue',
    'src/composables/kidIdentity.ts',
    'src/components/screens/CalendarScreen.vue',
    'src/components/screens/ThisWeekScreen.vue',
    'src/components/WeekRecapCard.vue',
    'src/composables/weekDays.ts',
    'src/composables/nextGoal.ts',
  ]
  /** ⚠ THE ONE LEFTOVER, BY NAME: `Her wedding` is the delta table's row (ru-current-main-delta X03, RU-15), not RU-03's. */
  const LEFTOVER = ['Her wedding']

  it('no CERTAIN string homed in these files is left unwrapped, bar the named leftover', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual(LEFTOVER)
  })

  it('the wave wired what it says: the rows RU-03 names have a wired key each', () => {
    const rows = [
      'Open her profile', 'Go to the news feed', 'Settings', 'How ranking points work', 'bell|Unread news', 'A letter waiting on an answer',
      'Tap the photo – her page lives here', '{age} years old {flag}', 'National', 'International', 'Professional', 'Unranked', '#{rank}',
      'Condition {n} percent, below the entry floor', 'Condition {n} percent, near the higher entry floors', 'Condition {n} percent, fit',
      'Worn out – she needs a rest week', '{n} match weeks in a row', 'Next tournament', 'Travel budget', 'Family budget', 'Coach note', 'Recent memory',
      'Used {used} of {limit}', 'Enter your first!', '{tier}: reached, best finish {finish}', 'Show 1 more level', 'Show {n} more levels',
      '{n} levels hidden ({from} to {to}) – tap to show the whole ladder', 'News – {week}', 'Play {fixture}', 'Finish the year', 'Back on tour now',
      'Calendar', 'The seven days of {dateLine}', 'Notes', 'Weeks after that', 'Entered', 'Tap anywhere to skip', '{day} – {kind}', 'on court', 'at the shoot',
      'On the bench', 'She is out – no training this week.', 'Out with the {injury} – back {week}.', 'Exams this week – no tournaments, and no sessions booked either.',
      'MON', 'SUN', 'Monday', 'Sunday', 'Close this tournament', 'Enter', 'Not enough funds', 'closes {week}', 'wild card',
      'Back to Home', 'Close the week\'s story', 'No event – training week', 'Latest match: {score}', 'Grind 85/15', 'Training {train}% · Rest {rest}%', 'Planned spend', 'Proceed to Home',
      'Week story, {week}', 'Asleep', 'in the airport on the way home', 'recap|Income', 'Family income', 'recap|Spent', 'recap|Balance',
      'Her cut {pct}% – {amount} into her own account.', 'The income above is what the family kept.', 'dot|Training', 'Training', 'Rest', '{n} of 7 days training',
      'recap|Steady', 'Low', 'Hurt', 'On the mend', 'Frustrated', 'A quiet week.', '{ladder} rank up {n} – now #{rank}', '{ladder} rank down {n} – now #{rank}',
      'She played her practice match', 'Watch the replay', 'Next goal', 'Win one match at the {event}', 'Win the {event}', 'Reach the {round} at the {event}', 'Work on her {axis}',
    ]
    const unwired = rows.filter((k) => !CATALOG.keys[k]?.wrapped)
    expect(unwired).toEqual([])
  })
})

// --- 3. the seams that were English logic ----------------------------------------------------------------------

describe('L2-3 seams – the greeting rule, the ladder words and AS19 do not depend on the language', () => {
  const at = (hour: number): void => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2033, 5, 6, hour, 0, 0))
  }
  const withCaption = (photoLine: string): Snapshot => ({ ...base, diary: { ...base.diary, photoLine, greeting: 'ENGINE-GREETING' } })

  it('English: the clock picks the band, and a caption that already says that word hands the greeting to the engine', () => {
    at(9)
    expect(mountHome(withCaption('A long afternoon of drills.')).get('.diary-greeting').text()).toBe('Good morning')
    document.body.innerHTML = ''
    expect(mountHome(withCaption('A quiet morning at the club.')).get('.diary-greeting').text()).toBe('ENGINE-GREETING')
    document.body.innerHTML = ''
    at(23)
    expect(mountHome(withCaption('Lights out early.')).get('.diary-greeting').text()).toBe('Good night')
  })

  it('under xx the SAME branch is taken: the decision is the time word\'s, and only the words read go through the catalog', async () => {
    await installPseudoLocale()
    at(9)
    const open = mountHome(withCaption('A long afternoon of drills.')).get('.diary-greeting').text()
    expect(open, 'the greeting went through the catalog').toMatch(/^⟦.*Good morning/)
    document.body.innerHTML = ''
    const handed = mountHome(withCaption('A quiet morning at the club.')).get('.diary-greeting').text()
    expect(handed, 'the collision still hands the line to the engine, whatever the language').toBe('ENGINE-GREETING')
  })

  it('the chip words are LADDER_LABEL character for character, and the rank shapes are rankLabel\'s', () => {
    for (const track of ['domestic', 'itf', 'wta'] as const) expect(ladderName(track)).toBe(LADDER_LABEL[track])
    for (const rank of [1, 42, 1234]) expect(t('#{rank}', { rank })).toBe(rankLabel(rank, true))
    expect(t('Unranked')).toBe(rankLabel(0, false))
  })

  it('AS19: the gap chip\'s sentence is the old template literal, character for character, for one, two and five hidden rungs', () => {
    const was = (hidden: number, span: string): string => `${hidden} ${hidden === 1 ? 'level' : 'levels'} hidden (${span}) – tap to show the whole ladder`
    const wasLabel = (hidden: number): string => `Show ${hidden} more ${hidden === 1 ? 'level' : 'levels'}`
    expect(t('1 level hidden ({tier}) – tap to show the whole ladder', { tier: 'National' })).toBe(was(1, 'National'))
    for (const n of [2, 5]) {
      expect(t('{n} levels hidden ({from} to {to}) – tap to show the whole ladder', { n, from: 'National', to: 'W15' })).toBe(was(n, 'National to W15'))
      expect(t('Show {n} more levels', { n })).toBe(wasLabel(n))
    }
    expect(t('Show 1 more level')).toBe(wasLabel(1))
  })

  it('the goal scrap\'s three rungs and the skill line keep their English', () => {
    expect(rungLine({ tier: 'regional', finish: 0, firstMatch: true } as never, 'Regional Championship')).toBe('Win one match at the Regional Championship')
    expect(rungLine({ tier: 'regional', finish: 0, firstMatch: false } as never, 'Regional Championship')).toBe('Win the Regional Championship')
  })
})

// --- 4. the context tags ---------------------------------------------------------------------------------------

describe('L2-3 context tags – added where one English needs two Russians (measured against every other batch table)', () => {
  const TAGS: [string, string][] = [
    ['greeting|Good night', 'Good night'],
    ['bell|Unread news', 'Unread news'],
    ['recap|Income', 'Income'],
    ['recap|Spent', 'Spent'],
    ['recap|Balance', 'Balance'],
    ['recap|Steady', 'Steady'],
    ['recap|Happy', 'Happy'],
    ['recap|Focused', 'Focused'],
    ['recap|Tired', 'Tired'],
    ['dot|Training', 'Training'],
  ]
  it.each(TAGS)('%s is a wired key that renders the bare English', (tagged, bare) => {
    expect(CATALOG.keys[tagged]?.wrapped, `${tagged} is not wired`).toBe(true)
    expect(t(tagged)).toBe(bare)
  })

  it('the mounted site asks for the TAGGED key, not the bare one (a stand-in catalog that only knows the tags)', async () => {
    installCatalog('ru', { 'recap|Spent': 'SPENT*', 'recap|Income': 'INCOME*', 'recap|Balance': 'BALANCE*', 'dot|Training': 'TRAIN-DOT*' })
    await setLocale('ru')
    const w = mountRecap()
    const text = seen(w.element)
    for (const word of ['SPENT*', 'INCOME*', 'BALANCE*', 'TRAIN-DOT*']) expect(text, word).toContain(word)
    w.unmount()
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-3 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', {
      'Next tournament': 'NEXT*', 'Family budget': 'BUDGET*', 'Season ladder': 'LADDER*', 'Calendar': 'CAL*', 'Weeks after that': 'AHEAD*', 'This week': 'WEEK*',
      'Training plan': 'PLAN*', 'Finances': 'FIN*', 'Next goal': 'GOAL*', 'Open her profile': 'PROFILE*', 'National': 'NAT*', 'International': 'INT*', 'Professional': 'PRO*',
    })
    await setLocale('ru')
    const home = seen(mountHome().element)
    for (const word of ['NEXT*', 'BUDGET*', 'LADDER*', 'PROFILE*']) expect(home, word).toContain(word)
    const rank = mountHome().get('.diary-rank .rank-ladder').text()
    expect(rank, 'the chip\'s ladder word is read through the catalog').toMatch(/^(NAT|INT|PRO)\*$/)
    document.body.innerHTML = ''
    expect(seen(mountCalendar().element)).toContain('CAL*')
    expect(seen(mountCalendar().element)).toContain('AHEAD*')
    document.body.innerHTML = ''
    const week = seen(mountWeek().element)
    expect(week).toContain('WEEK*')
    expect(week).toContain('PLAN*')
    document.body.innerHTML = ''
    const recap = seen(mountRecap().element)
    expect(recap).toContain('FIN*')
    expect(recap).toContain('GOAL*')
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const mounted = [mountHome(), mountRecap(), mountCalendar(), mountWeek()]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => /HomeScreen|RailIdentity|kidIdentity|CalendarScreen|ThisWeekScreen|WeekRecapCard|weekDays|nextGoal/.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-03 row is approved) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Next tournament')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(20)
    for (const key of ['Next tournament', 'Family budget', 'Calendar', 'Training plan', 'Finances']) {
      expect(missedKeys(), key).toContain(key)
    }
    console.log(`[L2-3 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on four mounted screens: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-3 xx sweep – no unwrapped literal in the frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed BY NAME or by shape: the kid's name, dates and week labels, money, tier names and surfaces (the
   *  engine's / the formatters' words), the engine's own prose (caption, notes, news text, the coach's short read), the calendar grid's block
   *  lexicon (RU-03 §15 – a later commit of this batch, named in the spec note) and numbers. */
  const ENGINE_BORN: RegExp[] = [
    /^[A-Z][a-z]+ [A-Z]\.?$/, /^[A-Z][a-z]+$/, /^[A-Z][a-z]+ [A-Z][a-z]+$/,
    /^W\d+ \d{4}$/, /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d+(?: – [A-Za-z]+ \d+)?(?:, \d{4})?$/, /^\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/,
    /^(?:hard|clay|grass|carpet)$/i, /^(?:Local|Regional|National|Junior|Pro|W\d+|J\d+|WTA|ITF)\b/,
    // the formatter's short names («P. Mansouri» – `formatShortName`), which is the engine's data shaped by shared/format.ts
    /^[A-Z]\. [A-Z][a-z]+$/,
  ]

  /** A leak that IS the engine's prose: the sentence (feed glyph and spacing aside) is written in the snapshot the screen was handed, so it never
   *  passed through a template literal. What is left after this filter is copy the SCREEN wrote. */
  const engineProse = (snap: Snapshot) => {
    const json = JSON.stringify(snap)
    return (leak: string): boolean => {
      const prose = leak.replace(/^[\p{Extended_Pictographic}‍️\s]+/u, '').trim()
      return prose.length > 2 && json.includes(prose) // a single letter is «in» every snapshot and proves nothing
    }
  }
  const screenLeaks = (root: Element, snap: Snapshot): string[] => hardcodeLeaks(root, ENGINE_BORN).filter((l) => !engineProse(snap)(l))

  it('Home: nothing in the hero, the cards, the strip or the news shell is left unbracketed outside the engine\'s own words', async () => {
    await installPseudoLocale()
    const w = mountHome()
    const leaks = screenLeaks(w.element, ranked)
    console.log(`[L2-3 xx] Home: ${hardcodeLeaks(w.element, ENGINE_BORN).length} unbracketed pieces, ${leaks.length} after dropping the snapshot's own prose: ${JSON.stringify(leaks)}`)
    expect(leaks, 'copy the SCREEN wrote that did not go through t()').toEqual([])
    expect(w.get('.diary-age').text(), 'the age line went through the catalog').toMatch(/^⟦/)
    expect(w.get('.diary-rank').attributes('aria-label')).toMatch(/^⟦/)
    expect(w.get('[data-tour="home-news"]').attributes('aria-label')).toMatch(/^⟦/)
    expect(seen(w.get('.card-grid').element)).toMatch(/⟦.*Next tournament/)
    w.unmount()
  })

  it('the recap, This Week and the calendar\'s frame: the labels are bracketed', async () => {
    await installPseudoLocale()
    const recap = mountRecap()
    for (const label of ['Finances', 'Training', 'Mood', 'Highlights', 'Energy']) expect(seen(recap.element), label).toMatch(new RegExp(`⟦${label}`))
    expect(recap.get('.recap-card').attributes('aria-label')).toMatch(/^⟦Week story, /)
    // ⚠ THE ONE NAMED LEFTOVER ON THE RECAP: the seven day initials (M T W T F S S). RU-03 §22 ruled that the Russian recap takes Calendar's
    // two-letter set rather than a second one-letter table; English has one-letter initials, `T` and `S` each stand for two days, so the key
    // design (seven context-tagged keys, or a locale-owned initial) is the owner's to choose – see the L2-3 note in the spec.
    expect(screenLeaks(recap.element, base)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    recap.unmount()
    const week = mountWeek()
    for (const label of ['This week', 'Training plan', 'Planned spend']) expect(seen(week.element), label).toMatch(new RegExp(`⟦${label}`))
    week.unmount()
    const cal = mountCalendar()
    expect(cal.get('.cal-title').text()).toMatch(/^⟦Calendar/)
    expect(cal.get('.cal-time-cols').attributes('aria-label')).toMatch(/^⟦The seven days of /)
    for (const col of cal.findAll('.cal-col')) expect(col.attributes('aria-label'), 'a day column\'s sentence').toMatch(/^⟦/)
    cal.unmount()
  })

  /** TWO NUMBERS PER SURFACE, BOTH `fits.ts`' OWN INSTRUMENT, both as a share of the room the box has on a 375px phone:
   *   · `line` – every text box as it is drawn: a box that cannot wrap (nowrap pill, chip, eyebrow) is charged its whole label, a wrapping one only its chrome;
   *   · `word` – the longest unbreakable word of every box STRETCHED BY 40%, on a probe at the box's own font size (the Russian failure mode:
   *     `Профессиональный` in a pill – xx itself repeats whole words, so it cannot lengthen one).
   *  `chars` is the visible text length, so «xx really made the surface longer» is a number and not a belief. */
  function widest(root: Element): { boxes: number; chars: number; line: { r: number; at: string }; word: { r: number; at: string } } {
    let boxes = 0
    let chars = 0
    const line = { r: 0, at: '' }
    const word = { r: 0, at: '' }
    for (const el of Array.from(root.querySelectorAll('*'))) {
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue ?? '').join(' ').replace(/\s+/g, ' ').trim()
      if (!/\p{L}/u.test(own)) continue
      boxes++
      chars += own.length
      const room = Math.max(1, availableWidth(el, PHONE))
      const lineRatio = demandedWidth(el, room) / room
      if (lineRatio > line.r) Object.assign(line, { r: lineRatio, at: own.slice(0, 28) })
      const longest = own.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '')
      const probe = document.createElement('span')
      // the longest word STRETCHED BY 40%: the pseudo-locale pads with whole repeated words so a label still wraps like prose, which means it
      // never lengthens a single word – and a Russian word does (Professional -> Профессиональный is +33%). This is that case, as a number.
      probe.textContent = longest + longest.slice(0, Math.ceil(longest.length * 0.4))
      probe.style.whiteSpace = 'nowrap'
      probe.style.fontSize = getComputedStyle(el).fontSize
      el.appendChild(probe)
      const wordRatio = demandedWidth(probe, room) / room
      probe.remove()
      if (wordRatio > word.r) Object.assign(word, { r: wordRatio, at: longest })
    }
    return { boxes, chars, line, word }
  }

  it('the dashboard card grid and the recap card hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const surfaces: [string, () => VueWrapper, string][] = [
      ['the dashboard card grid', () => mountHome(), '.card-grid'],
      ['the recap card', () => mountRecap(), '.recap-card'],
    ]
    const english = surfaces.map(([label, mount, sel]) => {
      const w = mount()
      const r = widest(w.get(sel).element)
      w.unmount()
      return { label, ...r }
    })
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = surfaces.map(([label, mount, sel]) => {
      const w = mount()
      const r = widest(w.get(sel).element)
      w.unmount()
      return { label, ...r }
    })
    const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
    console.log(
      '[L2-3 xx] 375x667, share of the box\'s room, English -> xx: ' +
        english
          .map((e, i) => {
            const x = xx[i]!
            return `${e.label}: ${e.boxes} text boxes, ${e.chars} -> ${x.chars} chars; widest line ${pct(e.line.r)} («${e.line.at}») -> ${pct(x.line.r)} («${x.line.at}»); longest word ${pct(e.word.r)} («${e.word.at}») -> ${pct(x.word.r)} («${x.word.at}»)`
          })
          .join(' · '),
    )
    for (const x of xx) {
      expect(x.line.r, `${x.label}: «${x.line.at}» cannot wrap and overflows its box under xx`).toBeLessThanOrEqual(1)
      expect(x.word.r, `${x.label}: the word «${x.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    }
    expect(xx.every((x, i) => x.chars > english[i]!.chars), 'xx made a surface no longer – the measurement did not see the words').toBe(true)
  })
})

void flushPromises
