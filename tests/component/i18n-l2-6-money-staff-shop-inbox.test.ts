// L2-6 – THE NET UNDER RU-06: THE FAMILY BUDGET, THE KIT, THE HOUSEHOLD STRIP AND THE SUPPORT STAFF (commit 1) – then the shop, the sponsors, the academy and the inbox (commit 2).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-money-staff-shop-inbox-2026-10.md.
//
// Six questions, asked of the REAL screens mounted and of the REAL catalog (the L2-3 … L2-5 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The existing money / kit / shop / staff pin
//      families (through `tTransparent` where they assert a spelling) and the whole mounted project are the wide net; what is here are the anchors for
//      the new seams – the cut sentences (bold numbers are markup, so the words around them are their own keys), the counted phrases, the spelled seasons,
//      the covered-lines list, the three kit confirmations and the three trip counts.
//   2. COMPLETENESS. Every CERTAIN string of the batch files is a WIRED key (the leftovers, if any, are named), and the sites this wave says it wired
//      really call `t()`.
//   3. THE SEAMS. The option rows that used to be built once at setup (the four chapters, the two kit tabs, the two periods) follow the locale; the
//      expense categories, the line titles and the covered-line words are getters over `t()`; the spelled seasons are a localized list.
//   4. THE CONTEXT TAGS. Every tag this wave added is a wired key, renders the bare English, and the mounted sites ask for the TAGGED key.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. As of this wave no RU-06 row is APPROVED, so the unapproved arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed text where a string is wired, and the tightest surfaces still hold a 375x667 phone with every word longer.
//      The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import HouseholdStrip from '../../src/components/HouseholdStrip.vue'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import { useGameStore } from '../../src/stores/game'
import { ECONOMY, staffResultShareBps } from '../../src/engine/economy'
import { MASSEUR_LOCKED_DETAIL } from '../../src/engine/world/masseur'
import { PSYCHOLOGIST_LOCKED_DETAIL, PSY_FOCUS_LABEL, PSY_FOCUS_LINE } from '../../src/engine/world/psychologist'
import { SPARRING_LOCKED_DETAIL } from '../../src/engine/world/sparring'
import { formatShortName } from '../../src/shared/format'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { installMemoryStorage } from './setup'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'
import { DEFAULT_ALLOW, hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

const WEEKS = 40
let coached: Snapshot // a middle-tier coach (the default career's): the training bill has a coaching line
let selfCoached: Snapshot // the family coaches her: the court-time-only quote

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  coached ??= careerSnapshot(WEEKS, 'l26-money', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  selfCoached ??= careerSnapshot(WEEKS, 'l26-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the mounts ------------------------------------------------------------------------------------------------

function use(snapshot: Snapshot): void {
  useGameStore().snapshot = snapshot
}
type Deep = Record<string, unknown>
const patched = (snap: Snapshot, over: Deep): Snapshot => ({ ...snap, ...over }) as unknown as Snapshot

function mountMoney(snapshot: Snapshot = coached): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
/** Open a chapter ('Bills', 'History'…) or a sub-tab ('Advs Portfolio') by the label it shows. */
async function press(w: VueWrapper, label: string): Promise<void> {
  const button = w.findAll('button').find((b) => b.text() === label)
  expect(button, `a button labelled «${label}»`).toBeTruthy()
  await button!.trigger('click')
}
function mountHousehold(snapshot: Snapshot = coached): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(HouseholdStrip, { attachTo: document.body })
}
function mountStaff(snapshot: Snapshot): VueWrapper {
  setViewport(PHONE)
  use(snapshot)
  return mount(SupportStaffTab, { global: { stubs: { teleport: true } }, attachTo: document.body })
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
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

const staffSnapshot = (over: Deep = {}): Snapshot =>
  patched(coached, {
    masseurUnlocked: true,
    psychologistUnlocked: true,
    sparringUnlocked: true,
    masseurHired: false,
    psychologistHired: false,
    sparringHired: false,
    ...over,
  })

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-6 parity – the English the screens shipped, with no catalog', () => {
  it('Money, Spending: the frame, the three cells, the periods, the donut and the training bill', () => {
    const w = mountMoney()
    expect(w.get('.money-title').text()).toBe('Family Budget')
    expect(flat(w.get('.money-sub').text())).toMatch(/^-?\$[\d,.]+ in the account · W\d+ ’\d\d$|^-?\$[\d,.]+ in the account · .+$/)
    expect(w.findAll('.money-tabs button').map((n) => n.text())).toEqual(['Spending', 'Bills', 'History', 'Shop'])
    expect(w.findAll('.money-cell-label').map((n) => n.text())).toEqual(['Total income', 'Total spent', 'Balance'])
    // the periods draw their SHORT words on a phone ({ label: 'Last 12 weeks', short: '12 weeks' }); the long one is the title/aria the switcher also carries
    expect(w.findAll('.money-window button').map((n) => n.text())).toEqual(['12 weeks', 'This season'])
    expect(seen(w.element)).toContain('Last 12 weeks')
    expect(w.get('.money-tabs').attributes('aria-label') ?? w.get('.money-tabs [role="group"], .money-tabs').attributes('aria-label')).toBe('Which part of the budget')
    expect(w.get('.money-window').attributes('aria-label')).toBe('Budget period')
    expect(w.get('.donut-center-cap').text()).toBe('spent')
    expect(w.get('.money-cta').text()).toBe('View all transactions')
    expect(flat(w.get('.money-bill-note').text())).toMatch(
      /^Training quotes at \$[\d,.]+ a week – \$[\d,.]+ coaching, \$[\d,.]+ courts\. No week bills exactly that: a session moves, a court books at a busier hour\. Yours runs \$[\d,.]+–\$[\d,.]+\.$/,
    )
    w.unmount()
    const own = mountMoney(selfCoached)
    expect(flat(own.get('.money-bill-note').text())).toMatch(
      /^Court time quotes at \$[\d,.]+ a week – you coach her, so there is no coaching line\. No week bills exactly that: a session moves, a court books at a busier hour\. Yours runs \$[\d,.]+–\$[\d,.]+\.$/,
    )
    own.unmount()
  })

  it('Money, Spending: the expense categories are the thirteen English words, and the coach share names its window in a complete fragment', async () => {
    const CATEGORIES = ['Coaching', 'Courts & facility', 'Travel', 'Entry fees', 'Gear', 'Stringing', 'Fitness & medical', 'Support staff', 'Vacations', 'Practice matches', 'College tuition', 'The shop', 'Other']
    const w = mountMoney()
    const drawn = w.findAll('.money-row .stat-label, .money-row [class*="label"]').map((n) => n.text())
    expect(drawn.filter((s) => CATEGORIES.includes(s)).length, 'at least one category is drawn on the fixture').toBeGreaterThan(0)
    w.unmount()
    const share = staffResultShareBps('coach', 2) / 100
    const withCut = patched(coached, {
      finance: {
        ...coached.finance,
        window12w: { ...coached.finance.window12w, coachCutCents: 1_234_00 },
        season: { ...coached.finance.season, coachCutCents: 5_678_00 },
      },
    })
    const m = mountMoney(withCut)
    expect(flat(m.get('.money-coach-share').text())).toBe(`Coach's results share – $1,234 in the last 12 weeks, already inside Coaching above: ${share}% of every prize cheque.`)
    await press(m, 'This season')
    expect(flat(m.get('.money-coach-share').text())).toBe(`Coach's results share – $5,678 this season, already inside Coaching above: ${share}% of every prize cheque.`)
    m.unmount()
  })

  it('Money: the debt line is cut around its bold numbers – English unchanged, and the singular is its own key', () => {
    for (const [weeks, word] of [[1, 'week'], [3, 'weeks']] as const) {
      const w = mountMoney(patched(coached, { debt: { sinceWeek: 30, weeks, graceWeeks: 6 } }))
      expect(flat(w.get('.money-debt').text()), String(weeks)).toBe(`${weeks} ${word} below zero · ${6 - weeks} before the money runs out for good. One week back in the black clears it.`)
      expect(w.findAll('.money-debt strong').map((n) => n.text())).toEqual([String(weeks), String(6 - weeks)])
      w.unmount()
    }
  })

  it('Money, Bills: the budget card, the retainer note, the two rehab voices and the starting funds', async () => {
    const w = mountMoney()
    await press(w, 'Bills')
    const card = w.get('.money-panel')
    expect(card.text()).toContain('Budget')
    expect(card.text()).toContain('Physio recovery')
    expect(flat(card.text())).toContain('Weekly retainer - lowers injury risk, shortens recoveries and adds a little condition each week. Charged on the weeks she is fit.')
    // ⚠ NO SPACE after the colon: the template's newline between `</template>` and `<b>` is dropped by the compiler, as it always was
    expect(flat(card.text())).toMatch(/An injured week bills rehab instead:\$\d+-\d+\/wk, with or without the retainer above\./)
    expect(flat(card.text())).toMatch(/Started this career with \$[\d,.]+\./)
    const hurt = mountMoney(patched(coached, { injury: { kind: 'knee', untilWeek: 99 } }))
    await press(hurt, 'Bills')
    expect(flat(hurt.text())).toMatch(/She is hurt, so this week bills rehab:\$\d+-\d+\/wk, with or without the retainer above\./)
    hurt.unmount()
    expect(w.findAll('.money-subtabs button').map((n) => n.text())).toEqual(['Her Kit', 'Advs Portfolio'])
    expect(w.get('.money-subtabs').attributes('aria-label')).toBe('Which bills')
    w.unmount()
  })

  it('Money, Her kit: the lines, the wear words, the rungs and the deal – covered lines joined, seasons spelled, the allowance in its own words', async () => {
    const deal = {
      tier: 'mid', brand: 'Kestra', covers: ['strings', 'frame', 'shoes'], allowanceCents: 1_000_00, spentCents: 400_00, remainingCents: 600_00, seasons: 2, fromWeek: 40, untilWeek: 144, minEventsPerSeason: 6,
    }
    const w = mountMoney(patched(coached, { kitDeal: deal }))
    await press(w, 'Bills')
    expect(w.text()).toContain('Her kit')
    expect(w.findAll('.kit-line-name').map((n) => n.text())).toEqual(['Strings', 'Racket', 'Shoes'])
    expect(w.findAll('.kit-line-state').every((n) => ['Fresh', 'Fine', 'Worn', 'Gone'].includes(n.text()))).toBe(true)
    expect(w.findAll('.kit-rung-good').every((n) => /^\d+ good weeks/.test(flat(n.text())))).toBe(true)
    expect(w.findAll('.kit-rung-approx').every((n) => n.text() === 'Around')).toBe(true)
    expect(w.get('.kit-deal-term').text()).toMatch(/^Two seasons · .+ – .+/)
    expect(flat(w.get('.kit-deal-note').text())).toBe('They supply her strings, racquets and shoes, and she enters at least 6 tournaments a season.')
    expect(flat(w.text())).toContain('Allowance left this season')
    expect(flat(w.text())).toContain('$400 of $1,000 used')
    w.unmount()
    const spent = mountMoney(patched(coached, { kitDeal: { ...deal, covers: ['strings', 'frame'], seasons: 5, spentCents: 1_000_00, remainingCents: 0 } }))
    await press(spent, 'Bills')
    expect(spent.get('.kit-deal-term').text()).toMatch(/^5 seasons · /)
    expect(flat(spent.get('.is-spent').text())).toBe(
      "The season's allowance is spent. Her strings and racquets are billed to the family at full price until the new season starts – the deal still keeps them fresh, and it still pays again from the first week of next season.",
    )
    spent.unmount()
  })

  it('Money, Her kit: the three purchase questions – the family pays, the sponsor pays all, the sponsor pays part', async () => {
    const w = mountMoney()
    await press(w, 'Bills')
    const line = coached.kit[0]!
    const ladder = line.rungs.map((r) => r.grade)
    const upIndex = ladder.findIndex((_g, i) => i > ladder.indexOf(line.grade) && !line.rungs[i]!.owned)
    expect(upIndex, 'the fixture has a dearer rung to ask about').toBeGreaterThan(-1)
    const rung = line.rungs[upIndex]!
    await w.findAll('.kit-line')[0]!.findAll('.kit-rung')[upIndex]!.trigger('click')
    const family = flat(w.get('.dialog-card, [role="dialog"]').text())
    expect(family).toContain(`Buy the ${rung.label} for $`)
    expect(family).toContain('? She plays with it from this week, and every replacement is billed at this level.')
    w.unmount()
    for (const [payable, shape] of [
      [0, /^Buy the .+\? Her sponsor covers it in full – \$[\d,.]+ off her allowance\. She plays with it from this week, and every replacement is billed at this level\./],
      [rung.priceCents / 2, /^Buy the .+ for \$[\d,.]+\? Her sponsor covers \$[\d,.]+ of the \$[\d,.]+\. She plays with it from this week, and every replacement is billed at this level\./],
    ] as const) {
      const rungs = line.rungs.map((r, i) => (i === upIndex ? { ...r, payableCents: payable } : r))
      const s = mountMoney(patched(coached, { kit: [{ ...line, rungs }, ...coached.kit.slice(1)] }))
      await press(s, 'Bills')
      await s.findAll('.kit-line')[0]!.findAll('.kit-rung')[upIndex]!.trigger('click')
      expect(flat(s.get('.dialog-card, [role="dialog"]').text()), `payable ${payable}`).toMatch(shape)
      s.unmount()
    }
  })

  it('Money, Advs Portfolio: the open slot, the three gates, the lifetime and the term lines', async () => {
    const rows = [
      { category: 'watches', label: 'Watches', state: 'open', openCashCents: 50_000_00 },
      { category: 'cars', label: 'Cars', state: 'closed', slamTitles: { held: 2, needed: 3 }, seasonsInTop10: { held: 1, needed: 2 } },
      { category: 'drinks', label: 'Drinks', state: 'closed', seasonsInTop10: { held: 1, needed: 4 } },
      { category: 'clothing', label: 'Clothing', state: 'closed', opensAtRank: 20 },
      { category: 'airline', label: 'Airline', state: 'closed' },
      { category: 'fragrance', label: 'Fragrance', state: 'filled', brand: 'Orla', cashCents: 12_000_00, termYears: 1, untilWeek: 120 },
      { category: 'merch', label: 'The capstone', state: 'filled', brand: 'Orla', cashCents: 90_000_00, termYears: 3, untilWeek: 200 },
      { category: 'lifetime', label: 'The lifetime deal', state: 'filled', brand: 'Orla', cashCents: 1_000_00, lifetime: true },
    ]
    const w = mountMoney(patched(coached, { adPortfolio: rows }))
    await press(w, 'Bills')
    await press(w, 'Advs Portfolio')
    const text = flat(w.text())
    expect(text).toContain('The advertising portfolio')
    expect(text).toMatch(/One deal per category – the cheque grows with her standing, the shelf itself does not\. Every fee is written to her at its full value, and the family banks the manager's \d+(\.\d+)?% of it\./)
    expect(text).toMatch(/How known she is – \d+ of 100\. The court sets that floor, and the shoots she has done multiply it; the merch brand sells on it\./)
    expect(text).toContain('Open – nobody signed')
    expect(text).toContain('2 of 3 Slams · 1 of 2 top-10 seasons')
    expect(text).toContain('1 of 4 top-10 seasons')
    expect(text).toContain('Opens inside WTA #20')
    expect(text).toContain('Not open yet')
    expect(text).toContain('$1,000 a year · for life')
    expect(text).toMatch(/\$12,000 a year · one year · runs to W\d+/)
    expect(text).toMatch(/\$90,000 a year · 3 years · runs to W\d+/)
    expect(text).toMatch(/A letter here writes about \$50,000 a year at her standing\./)
    w.unmount()
    const empty = mountMoney(patched(coached, { adPortfolio: [] }))
    await press(empty, 'Bills')
    await press(empty, 'Advs Portfolio')
    expect(flat(empty.get('.money-subtab-empty').text())).toBe(
      `Nothing to show yet – the categories open at ${ECONOMY.advertising.fromAgeYears}, and they fill one letter at a time as she climbs.`,
    )
    empty.unmount()
  })

  it('Money, the academy card and the history chapter: season rows, the legacy note, the ledger frame', async () => {
    const w = mountMoney(patched(coached, { academy: { coveredCents: 3_210_00, sinceWeek: 12 } }))
    await press(w, 'Bills')
    const text = flat(w.text())
    expect(text).toContain('Her academy')
    expect(text).toMatch(/They take \d+(\.\d+)?% off every trip she enters – the travel figures on the calendar and in the ledger are already net of it, and it is reviewed once a year\./)
    expect(text).toContain('Travel they have paid')
    expect(text).toContain('since the last review')
    expect(text).toMatch(/With them since W\d+/)
    w.unmount()
    const history = mountMoney(
      patched(coached, {
        seasonHistory: [
          { seasonIndex: 0, endingFundsCents: 1, spentCents: 12_000_00, earnedCents: 4_000_00 },
          { seasonIndex: 1, endingFundsCents: 2 },
        ],
      }),
    )
    await press(history, 'History')
    const h = flat(history.text())
    expect(h).toContain('Completed seasons')
    expect(h).toMatch(/Season 1 – \d{4}/)
    expect(h).toContain('$4,000 in')
    expect(h).toContain('not recorded')
    expect(h).toContain("Seasons played before this version kept only the year's balance, so what they cost is not on file. Every season from here on records it.")
    expect(h).toContain('All transactions')
    history.unmount()
    const first = mountMoney(patched(coached, { seasonHistory: [] }))
    await press(first, 'History')
    expect(flat(first.text())).toContain('Her first season is still running – it lands here when the year wraps up.')
    first.unmount()
  })

  it('the household strip: both signs, the shelf, the upkeep and the businesses', () => {
    const household = (over: Deep): Snapshot =>
      patched(coached, { coachBilling: { ...coached.coachBilling, household: { incomeCents: 500_00, outgoingCents: 800_00, netCents: -300_00, shelfCents: 0, upkeepCents: 0, merchCents: 0, academyIncomeCents: 0, ...over } } })
    const lose = mountHousehold(household({ shelfCents: -40_00, upkeepCents: 25_00, merchCents: 10_00, academyIncomeCents: 5_00 }))
    expect(lose.get('.household-label').text()).toBe('Household, every week')
    // the `<i>–</i>` separators sit between elements, so the template's newlines around them are dropped by the compiler: «in –$800», as it always was
    expect(flat(lose.get('.household-figs').text())).toBe('$500 in –$800 out –$300 short')
    const notes = lose.findAll('.hint').map((n) => flat(n.text()))
    expect(notes).toEqual([
      "The shelf is in that – it costs $40 a week at today's rates.",
      'Keeping what you own is $25 a week of that, and it is real money.',
      'Their businesses bring in $15 a week of that – merch $10, the academy $5.',
    ])
    lose.unmount()
    const win = mountHousehold(household({ netCents: 200_00, shelfCents: 40_00, academyIncomeCents: 5_00 }))
    expect(flat(win.get('.household-figs').text())).toBe('$500 in –$800 out –$200 left over')
    expect(win.findAll('.hint').map((n) => flat(n.text()))).toEqual(["The shelf is in that – it adds $40 a week at today's rates.", 'Their businesses bring in $5 a week of that – the academy $5.'])
    win.unmount()
  })

  it('the support staff: three seats locked, available and hired – names, prices, lines, dials and the trip counts', async () => {
    const locked = mountStaff(patched(coached, { masseurUnlocked: false, psychologistUnlocked: false, sparringUnlocked: false, masseurHired: false, psychologistHired: false, sparringHired: false }))
    expect(locked.findAll('.tier-name').map((n) => n.text())).toEqual(['Masseur', 'Psychologist', 'Hitting partner'])
    expect(locked.findAll('.cm-action.is-locked').map((n) => n.text())).toEqual(['Locked', 'Locked', 'Locked'])
    expect(locked.findAll('.tier-range').every((n) => /^\$[\d,.]+ \/wk$/.test(n.text()))).toBe(true)
    locked.unmount()
    const open = mountStaff(staffSnapshot())
    expect(open.findAll('.staff-right button').map((n) => n.text())).toEqual(['Hire', 'Hire', 'Hire'])
    const lines = open.findAll('.staff-line').map((n) => n.text())
    expect(lines[0]).toBe('Table work at home every week, and a hand on every rehab – layoffs end sooner.')
    expect(lines[1]).toBe("A call a week for her head – the year's work is chosen one year at a time.")
    expect(lines[2]).toBe('A regular practice opponent for weeks when she is not competing.')
    open.unmount()
    const hired = mountStaff(staffSnapshot({ masseurHired: true, psychologistHired: true, sparringHired: true, sparringStoodDown: true }))
    expect(hired.findAll('.staff-right button').map((n) => n.text())).toEqual(['Let go', 'Let go', 'Let go'])
    expect(hired.findAll('.staff-dial').map((n) => n.attributes('aria-label'))).toEqual(['Masseur sessions per week', 'Psychologist – who takes the weekly call', 'Hitting partner – experience level'])
    expect(hired.get('.staff-focus').attributes('aria-label')).toBe("Psychologist – the year's work")
    expect(hired.findAll('.staff-line').map((n) => n.text())[2]).toBe('The hitting partner remains with the team, but is not working this week. No salary is charged.')
    expect(hired.findAll('.staff-line').map((n) => n.text())[1]).toBe('On retainer – one call a week, wherever she is.')
    expect(hired.get('.staff-fare').text()).toBe('Stays home on tournament weeks. One fare saved on every trip.')
    expect(hired.findAll('.cm-travel-title').map((n) => n.text())).toEqual(['Masseur travels to tournaments', 'Tournament travel'])
    hired.unmount()
  })

  it('the support staff: booked trips – none, one, many – are three whole messages, for the masseur and for the hitting partner alike', async () => {
    const fare = 456_00
    for (const [trips, tail] of [[1, ' $456 over the 1 trip booked.'], [3, ' $456 over the 3 trips booked.']] as const) {
      const w = mountStaff(staffSnapshot({ masseurHired: true, sparringHired: true, masseurTravelTrips: trips, masseurTravelFareCents: fare, sparringTravelTrips: trips, sparringTravelFareCents: fare }))
      const subs = w.findAll('.cm-travel-sub').map((n) => n.text())
      expect(subs[0]).toMatch(/^Table work between rounds – one additional fare per trip to a paying event, and the week is billed per match there \(\$[\d,.]+ each\) instead of the weekly rate\./)
      expect(subs[0]!.endsWith(tail), `masseur ${trips}`).toBe(true)
      expect(subs[1]).toBe(`Bring the hitting partner on tour for one additional fare per trip. Home practice is already covered; this extends the arrangement to travel weeks.${tail}`)
      w.unmount()
    }
    const none = mountStaff(staffSnapshot({ masseurHired: true, masseurTravelTrips: 0 }))
    expect(none.findAll('.cm-travel-sub')[0]!.text().endsWith('instead of the weekly rate.')).toBe(true)
    none.unmount()
  })

  it('the support staff: the three hire questions and the three release questions, word for word', async () => {
    const w = mountStaff(staffSnapshot())
    const asked: string[] = []
    for (let i = 0; i < 3; i++) {
      await w.findAll('.staff-right button')[i]!.trigger('click')
      asked.push(flat(w.get('.dialog-card, [role="dialog"]').text()))
      await w.get('.dialog-actions button').trigger('click')
    }
    expect(asked[0]).toMatch(/^Hire a masseur for \$[\d,.]+ a week \([a-z ]+\)\? You can end the arrangement any week, like the coach\./)
    expect(asked[1]).toMatch(/^Hire a psychologist for \$[\d,.]+ a week \([a-z -]+\)\? You can end the arrangement any week, like the coach\./)
    expect(asked[2]).toMatch(/^Hire a hitting partner for \$[\d,.]+ a week \([a-z0-9 -]+\)\? You can end the arrangement any week, like the coach\./)
    w.unmount()
    const hired = mountStaff(staffSnapshot({ masseurHired: true, psychologistHired: true, sparringHired: true }))
    const let_go: string[] = []
    for (let i = 0; i < 3; i++) {
      await hired.findAll('.staff-right button')[i]!.trigger('click')
      let_go.push(flat(hired.get('.dialog-card, [role="dialog"]').text()))
      await hired.get('.dialog-actions button').trigger('click')
    }
    expect(let_go[0]).toContain('Let the masseur go? The weekly salary stops, and rehab goes back to the clinic alone.')
    expect(let_go[1]).toContain('Let the psychologist go? The weekly salary stops, and the calls end with the week.')
    expect(let_go[2]).toContain('Let the hitting partner go? The weekly salary stops, and regular match-style practice between events ends.')
    hired.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-6 completeness – every string of the batch files is a wired key, and the sites this wave names call t()', () => {
  const FILES = ['src/components/screens/MoneyScreen.vue', 'src/components/HouseholdStrip.vue', 'src/components/SupportStaffTab.vue']
  it('no CERTAIN string homed in these files is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the rows RU-06 names have a wired key each, and the file that owns each really calls t() with it', () => {
    const SITES: [string, string[]][] = [
      ['src/components/screens/MoneyScreen.vue', ['screen|Back to Home', 'Family Budget', '{0} in the account · {1}', 'week below zero', 'weeks below zero', 'before the money runs out for good. One week back in the black clears it.',
        'Which part of the budget', 'Total income', 'Total spent', 'spend|Balance', 'Budget period', 'No spending in this window yet.', 'Income', 'View all transactions', 'spent', 'Budget', 'Physio recovery',
        'Weekly retainer - lowers injury risk, shortens recoveries and adds a little condition each week. Charged on the weeks she is fit.', 'She is hurt, so this week bills rehab:',
        'An injured week bills rehab instead:', ', with or without the retainer above.', 'Started this career with {0}.', 'Which bills', 'Her kit',
        "New kit plays the same whatever it cost – what a better rung buys is TIME before it goes off, and it is billed every time the family replaces it, not once. The shop's price moves a little between replacements, so the figures below are what a rung costs about.",
        'They supply her {0}, and she enters at least {1} tournaments a season.', 'Allowance left this season', '{0} of {1} used', 'At this pace it runs out around {0}.',
        "The season's allowance is spent. Her {0} are billed to the family at full price until the new season starts – the deal still keeps them fresh, and it still pays again from the first week of next season.",
        '{0} good weeks', '({0} left)', 'Around', 'free',
        "Her sponsor keeps this line fresh, but the season's allowance is gone – this one is the family's to buy until next season.",
        "Her sponsor supplies this line and keeps it fresh. Only {0} of the allowance is left, so a dearer rung is part-paid – the struck price is the sticker and the price beside it is the family's share.",
        "Her sponsor supplies this line – they keep it fresh whatever she plays, and they pay for what she buys while {0} of this season's allowance is left.",
        'The advertising portfolio', "One deal per category – the cheque grows with her standing, the shelf itself does not. Every fee is written to her at its full value, and the family banks the manager's {0}% of it.",
        'How known she is – {0} of 100. The court sets that floor, and the shoots she has done multiply it; the merch brand sells on it.', 'Open – nobody signed', '{0} of {1} Slams',
        '{0} of {1} top-10 seasons', 'Opens inside WTA #{0}', 'Not open yet', '{0} a year · for life', '{0} a year ·', 'one year', '{0} years', 'runs to',
        'A letter here writes about {0} a year at her standing.', 'Nothing to show yet – the categories open at {0}, and they fill one letter at a time as she climbs.', 'Her academy',
        'They take {0}% off every trip she enters – the travel figures on the calendar and in the ledger are already net of it, and it is reviewed once a year.', 'Travel they have paid',
        'since the last review', 'With them since {0}.', 'Completed seasons', 'Her first season is still running – it lands here when the year wraps up.',
        "Seasons played before this version kept only the year's balance, so what they cost is not on file. Every season from here on records it.", 'All transactions', 'No transactions yet.',
        'Every prize cheque is split before it reaches this account: her part goes to her, the family banks the rest. The prize rows above are what the family kept, and each one names the share that left.',
        'Buy it', 'Sell it', 'Order it', 'Last 12 weeks', '12 weeks', 'This season', 'this season', 'in the last 12 weeks',
        'Training quotes at {0} a week – {1} coaching, {2} courts. No week bills exactly that: a session moves, a court books at a busier hour. Yours runs {3}–{4}.',
        'Court time quotes at {0} a week – you coach her, so there is no coaching line. No week bills exactly that: a session moves, a court books at a busier hour. Yours runs {1}–{2}.',
        "Coach's results share – {0} {1}, already inside Coaching above: {2}% of every prize cheque.", 'Coaching', 'Courts & facility', 'spend|Travel', 'Entry fees', 'Gear', 'Stringing',
        'Fitness & medical', 'Support staff', 'Vacations', 'Practice matches', 'College tuition', 'The shop', 'Other', 'Season {0} – {1}', '{0} in', 'not recorded', 'Strings', 'Racket', 'Shoes',
        'Fresh', 'Fine', 'Worn', 'Gone', 'strings', 'racquets', 'shoes', '{0} and {1}', 'One season', 'Two seasons', 'Three seasons', 'Four seasons', '{0} seasons',
        'Buy the {0} for {1}? She plays with it from this week, and every replacement is billed at this level.',
        'Buy the {0}? Her sponsor covers it in full – {1} off her allowance. She plays with it from this week, and every replacement is billed at this level.',
        'Buy the {0} for {1}? Her sponsor covers {2} of the {3}. She plays with it from this week, and every replacement is billed at this level.', 'Spending', 'Bills', 'History', 'Shop',
        'Where the money went in the chosen period', 'The recurring costs the family has signed up to', 'Every season, and every transaction', 'What the family can buy with what is left', 'Her Kit',
        'Advs Portfolio', 'What she plays with, and what replacing it costs', 'The advertising categories, filled and open']],
      ['src/components/HouseholdStrip.vue', ['Household, every week', 'in', 'out', 'short', 'left over', 'merch {0}', 'the academy {0}', 'Their businesses bring in {0} a week of that – {1}.',
        "The shelf is in that – it adds {0} a week at today's rates.", "The shelf is in that – it costs {0} a week at today's rates.", 'Keeping what you own is {0} a week of that, and it is real money.']],
      ['src/components/SupportStaffTab.vue', ['Masseur', 'Psychologist', 'Hitting partner', '{0} /wk', '{0}/wk', 'Locked', 'Hire', 'Let go', 'Set it', '{0} over the 1 trip booked.', '{0} over the {1} trips booked.',
        'Table work at home every week, and a hand on every rehab – layoffs end sooner.', 'Travels with her: table work between rounds. The deeper the run, the more it buys – a first-round exit buys nothing.',
        'Stays home on tournament weeks. One fare saved on every trip.', 'Masseur sessions per week', 'Masseur travels to tournaments',
        'Masseur travels to tournaments – on. Press to keep the table work at home.', 'Masseur travels to tournaments – off. Press to buy one additional fare per trip, for table work between rounds.',
        'Let the masseur go? The weekly salary stops, and rehab goes back to the clinic alone.', "Psychologist – who takes the weekly call", "Psychologist – the year's work",
        "Set the psychologist's work for this season to {0}? The year's work is chosen once a season, and the next choice comes in the next off-season.", 'On retainer – {0}',
        'On retainer – one call a week, wherever she is.', "A call a week for her head – the year's work is chosen one year at a time.",
        'Let the psychologist go? The weekly salary stops, and the calls end with the week.', 'No fare to pay: the sessions follow her as calls – at home, on the road, and through a layoff.',
        'Bring the hitting partner on tour for one additional fare per trip. Home practice is already covered; this extends the arrangement to travel weeks.',
        'The hitting partner remains with the team, but is not working this week. No salary is charged.', 'Helps her keep her timing during weeks without a match.',
        'A regular practice opponent for weeks when she is not competing.', 'Let the hitting partner go? The weekly salary stops, and regular match-style practice between events ends.',
        'Hitting partner – experience level', 'Tournament travel', 'Hitting partner travel is on. Press to keep the hitting partner at the home club.',
        'Hitting partner travel is off. Press to bring the hitting partner on tour; each trip adds one fare.',
        'Hire a masseur for {0} a week ({1})? You can end the arrangement any week, like the coach.', 'Hire a psychologist for {0} a week ({1})? You can end the arrangement any week, like the coach.',
        'Hire a hitting partner for {0} a week ({1})? You can end the arrangement any week, like the coach.']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        // the file itself asks for the key (single, double or backtick quotes; escaped apostrophes as the source spells them)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the table names that its own file does not call').toEqual([])
  })
})

// --- 3. the seams ----------------------------------------------------------------------------------------------

describe('L2-6 seams – setup-time rows follow the locale, getter tables read the catalog on every render', () => {
  it('the chapters, the kit tabs and the periods are computeds: flipping the locale re-labels them without a remount', async () => {
    installCatalog('ru', { Spending: 'SPEND*', Bills: 'BILLS*', 'Last 12 weeks': 'TWELVE*', 'This season': 'SEASON*', 'Her Kit': 'KIT*', 'Advs Portfolio': 'ADS*', History: 'HIST*', Shop: 'SHOP*' })
    const w = mountMoney()
    expect(seen(w.element)).toContain('Spending')
    await setLocale('ru')
    await w.vm.$nextTick()
    const after = seen(w.element)
    for (const marker of ['SPEND*', 'BILLS*', 'HIST*', 'SHOP*', 'TWELVE*', 'SEASON*']) expect(after, marker).toContain(marker)
    await press(w, 'BILLS*')
    const bills = seen(w.element)
    for (const marker of ['KIT*', 'ADS*']) expect(bills, marker).toContain(marker)
    w.unmount()
  })

  it('the expense categories, the line titles and the covered-line words are getters: each reads the catalog when it is READ, not when the module loaded', async () => {
    installCatalog('ru', { Coaching: 'COACHING*', 'spend|Travel': 'TRAVEL*', Gear: 'GEAR*', Strings: 'STRINGS*', Racket: 'RACKET*', Shoes: 'SHOES*', 'Fresh': 'FRESH*', strings: 'strings*', racquets: 'racquets*', '{0} and {1}': '{0} AND* {1}' })
    await setLocale('ru')
    const deal = { tier: 'mid', brand: 'Kestra', covers: ['strings', 'frame', 'shoes'], allowanceCents: 1_000_00, spentCents: 400_00, remainingCents: 600_00, seasons: 3, fromWeek: 40, untilWeek: 144, minEventsPerSeason: 6 }
    const w = mountMoney(patched(coached, { kitDeal: deal }))
    const spend = seen(w.element)
    expect(spend).toMatch(/COACHING\*|TRAVEL\*|GEAR\*/)
    await press(w, 'Bills')
    const bills = seen(w.element)
    for (const marker of ['STRINGS*', 'RACKET*', 'SHOES*']) expect(bills, marker).toContain(marker)
    expect(flat(w.get('.kit-deal-note').text())).toContain('strings*, racquets* AND* shoes')
    w.unmount()
  })

  it('a spelled count is a whole message each: the first four seasons are their own English, the rest take the number as a param', async () => {
    const src = SRC('src/components/screens/MoneyScreen.vue')
    for (const key of ['One season', 'Two seasons', 'Three seasons', 'Four seasons']) expect(src).toContain(`() => t('${key}')`)
    expect(src).toContain("t('{0} seasons', [d.seasons])")
    installCatalog('ru', { '{0} seasons': 'MANY* {0}' })
    await setLocale('ru')
    const deal = { tier: 'mid', brand: 'Kestra', covers: ['strings'], allowanceCents: 1_000_00, spentCents: 0, remainingCents: 1_000_00, seasons: 7, fromWeek: 40, untilWeek: 400, minEventsPerSeason: 6 }
    const w = mountMoney(patched(coached, { kitDeal: deal }))
    await press(w, 'Bills')
    expect(w.get('.kit-deal-term').text()).toMatch(/^MANY\* 7 · /)
    w.unmount()
  })

  it('the covered-line list is ONE message with the head and the last as its holes: one, two and three lines in English', async () => {
    const mk = (covers: string[]): Snapshot => patched(coached, { kitDeal: { tier: 'mid', brand: 'Kestra', covers, allowanceCents: 1, spentCents: 0, remainingCents: 1, seasons: 1, fromWeek: 40, untilWeek: 60, minEventsPerSeason: 2 } })
    const said: string[] = []
    for (const covers of [['shoes'], ['strings', 'frame'], ['strings', 'frame', 'shoes']]) {
      const w = mountMoney(mk(covers))
      await press(w, 'Bills')
      said.push(flat(w.get('.kit-deal-note').text()))
      w.unmount()
    }
    expect(said).toEqual([
      'They supply her shoes, and she enters at least 2 tournaments a season.',
      'They supply her strings and racquets, and she enters at least 2 tournaments a season.',
      'They supply her strings, racquets and shoes, and she enters at least 2 tournaments a season.',
    ])
  })
})

// --- 4. the context tags ---------------------------------------------------------------------------------------

describe('L2-6 context tags – added where one English needs two Russians (measured against every other batch table)', () => {
  const TAGS: [string, string][] = [
    ['screen|Back to Home', 'Back to Home'],
    ['spend|Balance', 'Balance'],
    ['spend|Travel', 'Travel'],
  ]
  it.each(TAGS)('%s is a wired key that renders the bare English', (tagged, bare) => {
    expect(CATALOG.keys[tagged]?.wrapped, `${tagged} is not wired`).toBe(true)
    expect(t(tagged)).toBe(bare)
  })

  it('the mounted sites ask for the TAGGED key, not the bare one (a stand-in catalog that only knows the tags and decoys for the bare words)', async () => {
    installCatalog('ru', { 'screen|Back to Home': 'BACK*', 'Back to Home': 'BARE*', 'spend|Balance': 'NET*', Balance: 'BARE*', 'spend|Travel': 'TRIPS*', Travel: 'BARE*' })
    await setLocale('ru')
    const w = mountMoney()
    expect(w.get('.back-link').attributes('aria-label')).toBe('BACK*')
    const spend = seen(w.element)
    expect(spend).toContain('NET*')
    expect(spend, 'the spending chapter never asks for a bare word that has a tag').not.toContain('BARE*')
    w.unmount()
    const travel = mountMoney(patched(coached, { finance: { ...coached.finance, window12w: { ...coached.finance.window12w, byCategory: { travel: -500_00, coaching: -100_00 } } } }))
    expect(seen(travel.element)).toContain('TRIPS*')
    travel.unmount()
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-6 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', {
      'Family Budget': 'BUDGET*', 'Total income': 'INCOME*', 'View all transactions': 'ALLTX*', 'Household, every week': 'HOUSE*', Locked: 'LOCKED*', 'Masseur': 'MASSEUR*', 'Physio recovery': 'PHYSIO*', 'Her kit': 'HERKIT*',
    })
    await setLocale('ru')
    const money = mountMoney()
    for (const word of ['BUDGET*', 'INCOME*', 'ALLTX*']) expect(seen(money.element), word).toContain(word)
    await press(money, 'Bills')
    for (const word of ['PHYSIO*', 'HERKIT*']) expect(seen(money.element), word).toContain(word)
    money.unmount()
    const strip = mountHousehold()
    expect(seen(strip.element)).toContain('HOUSE*')
    strip.unmount()
    const staff = mountStaff(patched(coached, { masseurUnlocked: false, psychologistUnlocked: false, sparringUnlocked: false }))
    const text = seen(staff.element)
    for (const word of ['MASSEUR*', 'LOCKED*']) expect(text, word).toContain(word)
    staff.unmount()
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const money = mountMoney()
    const strip = mountHousehold()
    const staff = mountStaff(staffSnapshot())
    const mounted = [money, strip, staff]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /MoneyScreen|HouseholdStrip|SupportStaffTab/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-06 row is approved) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Family Budget')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(30)
    for (const key of ['Family Budget', 'Total income', 'View all transactions', 'Household, every week', 'Hire']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-6 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on three mounted surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-6 xx sweep – no unwrapped literal in the frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed by SHAPE: week labels, dates, money, per-week bands and bare numbers.
   *  ⚠ NO NAME-SHAPED PATTERNS HERE (L2-5's rule): a name or an engine word is allowed because the SNAPSHOT or an engine table carries it – see `engineProse`. */
  const ENGINE_BORN: RegExp[] = [
    /^W\d+( \d{4}| ['’]\d{2})?$/, /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d+(?: – (?:[A-Za-z]+ )?\d+)?(?:, \d{4})?$/, /^[−-]?\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/,
    // the physio bands (`weeklyBand` builds «$54-91/wk» in the screen – a money shape with an English unit, the formatter's landing, named in the spec note)
    /^\$\d+-\d+\/wk$/, /^\d+(?:\.\d+)?%$/, /^\d+°?$/, /^#\d+$/, /^[\d,]+$/, /^\d+(?:-\d+)*$/, /^[—–-]$/, /^\?$/, /^%$/, /^·$/,
    // the week label with the bracket after a contract term: «W45 '34 (36 weeks left)» (`weekLabel` + `weeksLeftBracket`, shared/dates.ts – RU-13D's formatters)
    /^W\d+ ['’]\d{2} \((?:last week|\d+ weeks? left)\)$/,
  ]
  const ENGINE_PROSE = (snap: Snapshot): ((leak: string) => boolean) => {
    // everything the ENGINE wrote: the snapshot it handed over, plus what the screens read straight from engine tables and constants
    const shorts = Array.from(JSON.stringify(snap).matchAll(/"([A-Z][a-z]+ [A-Z][a-z]+)"/g), (m) => formatShortName(m[1]!))
    const corpus = [
      JSON.stringify(snap),
      ...shorts,
      JSON.stringify(ECONOMY.masseur),
      JSON.stringify(ECONOMY.psychologist),
      JSON.stringify(ECONOMY.sparring),
      MASSEUR_LOCKED_DETAIL,
      PSYCHOLOGIST_LOCKED_DETAIL,
      SPARRING_LOCKED_DETAIL,
      JSON.stringify(PSY_FOCUS_LABEL),
      JSON.stringify(PSY_FOCUS_LINE),
    ].join('\n')
    return (leak) => {
      const prose = leak.replace(/^[\p{Extended_Pictographic}‍️\s]+|[\p{Extended_Pictographic}‍️\s]+$/gu, '').trim()
      // a ledger row's accessible name: the engine's own event text, the running balance and the signed amount, glued by StatRow (a shared ui component)
      const row = prose.match(/^(.+) – -?\$[\d,.]+ – [+−-]\$[\d,.]+$/)
      if (row && corpus.includes(row[1]!)) return true
      return prose.length > 2 && corpus.includes(prose)
    }
  }
  const allow = [...DEFAULT_ALLOW, ...ENGINE_BORN]
  const screenLeaks = (root: Element, snap: Snapshot): string[] => hardcodeLeaks(root, allow).filter((l) => !ENGINE_PROSE(snap)(l))

  const dealSnap = (): Snapshot =>
    patched(coached, {
      debt: { sinceWeek: 30, weeks: 2, graceWeeks: 6 },
      kitDeal: { tier: 'mid', brand: 'Kestra', covers: ['strings', 'frame', 'shoes'], allowanceCents: 1_000_00, spentCents: 400_00, remainingCents: 600_00, seasons: 2, fromWeek: 40, untilWeek: 144, minEventsPerSeason: 6 },
      academy: { coveredCents: 3_210_00, sinceWeek: 12 },
      adPortfolio: [
        { category: 'watches', label: 'Watches', state: 'open', openCashCents: 50_000_00 },
        { category: 'cars', label: 'Cars', state: 'closed', slamTitles: { held: 2, needed: 3 }, seasonsInTop10: { held: 1, needed: 2 } },
        { category: 'merch', label: 'The capstone', state: 'filled', brand: 'Orla', cashCents: 90_000_00, termYears: 3, untilWeek: 200 },
      ],
      seasonHistory: [{ seasonIndex: 0, endingFundsCents: 1, spentCents: 12_000_00, earnedCents: 4_000_00 }, { seasonIndex: 1, endingFundsCents: 2 }],
    })

  it('Money (spending, bills with the kit and the portfolio and the academy, history), the strip and the staff: nothing the SCREEN wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const snap = dealSnap()
    const money = mountMoney(snap)
    results.push(['money/spending', screenLeaks(money.element, snap)])
    await money.findAll('.money-tabs button')[1]!.trigger('click')
    results.push(['money/bills/kit', screenLeaks(money.element, snap)])
    await money.findAll('.money-subtabs button')[1]!.trigger('click')
    results.push(['money/bills/ads', screenLeaks(money.element, snap)])
    await money.findAll('.money-tabs button')[2]!.trigger('click')
    results.push(['money/history', screenLeaks(money.element, snap)])
    money.unmount()
    const strip = mountHousehold(
      patched(coached, { coachBilling: { ...coached.coachBilling, household: { incomeCents: 500_00, outgoingCents: 800_00, netCents: -300_00, shelfCents: -40_00, upkeepCents: 25_00, merchCents: 10_00, academyIncomeCents: 5_00 } } }),
    )
    results.push(['household', screenLeaks(strip.element, coached)])
    strip.unmount()
    const hired = staffSnapshot({ masseurHired: true, psychologistHired: true, sparringHired: true, masseurTravelTrips: 2, masseurTravelFareCents: 300_00, sparringTravelTrips: 1, sparringTravelFareCents: 100_00 })
    const staff = mountStaff(hired)
    results.push(['staff/hired', screenLeaks(staff.element, hired)])
    staff.unmount()
    const open = staffSnapshot()
    const staff2 = mountStaff(open)
    results.push(['staff/open', screenLeaks(staff2.element, open)])
    staff2.unmount()
    console.log(`[L2-6 xx] leaks: ${JSON.stringify(results)}`)
    for (const [surface, leaks] of results) expect(leaks, `${surface}: copy the SCREEN wrote that did not go through t()`).toEqual([])
  })

  /** TWO NUMBERS PER SURFACE, BOTH `fits.ts`' OWN INSTRUMENT, both as a share of the room the box has on a 375px phone (L2-3's `widest`):
   *   · `line` – every text box as it is drawn: a box that cannot wrap is charged its whole label, a wrapping one only its chrome;
   *   · `word` – the longest unbreakable word of every box STRETCHED BY 40%, on a probe at the box's own font size (the Russian failure mode). */
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

  it('the budget donut card and a staff seat hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const measure = (): { label: string; r: ReturnType<typeof widest> }[] => {
      const money = mountMoney()
      const body = money.find('.money-body')
      expect(body.exists(), 'the donut card (.money-body) is on the fixture\'s spending chapter').toBe(true)
      expect(body.find('.money-donut').exists(), 'the donut itself is drawn').toBe(true)
      const a = { label: 'the budget donut card', r: widest(body.element) }
      money.unmount()
      const staff = mountStaff(staffSnapshot({ masseurHired: true }))
      const seat = staff.find('.staff-block')
      expect(seat.exists(), 'a staff seat (.staff-block) is on the fixture').toBe(true)
      const b = { label: 'a hired staff seat', r: widest(seat.element) }
      staff.unmount()
      return [a, b]
    }
    const english = measure()
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = measure()
    const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
    console.log(
      '[L2-6 xx] 375x667, share of the box\'s room, English -> xx: ' +
        english
          .map((e, i) => {
            const x = xx[i]!
            return `${e.label}: ${e.r.boxes} text boxes, ${e.r.chars} -> ${x.r.chars} chars; widest line ${pct(e.r.line.r)} («${e.r.line.at}») -> ${pct(x.r.line.r)} («${x.r.line.at}»); longest word ${pct(e.r.word.r)} («${e.r.word.at}») -> ${pct(x.r.word.r)} («${x.r.word.at}»)`
          })
          .join(' · '),
    )
    for (const x of xx) {
      expect(x.r.line.r, `${x.label}: «${x.r.line.at}» cannot wrap and overflows its box under xx`).toBeLessThanOrEqual(1)
      expect(x.r.word.r, `${x.label}: the word «${x.r.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    }
    expect(xx.every((x, i) => x.r.chars > english[i]!.r.chars), 'xx made a surface no longer – the measurement did not see the words').toBe(true)
  })
})
