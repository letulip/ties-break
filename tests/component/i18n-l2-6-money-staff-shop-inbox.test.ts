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
import { careerSnapshot, walkWeeks } from '../helpers/career'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { SALE_LABELS } from '../../src/composables/shop'
import { SALE_SENDER } from '../../src/composables/saleLetter'
import type { Offer } from '../../src/shared/protocol'
import { SHELF_TAB_LABELS, openShelfTab, shelfRow } from './shelf'
import { mountInbox, withPost } from './inbox'
import { installMemoryStorage } from './setup'
import { PHONE, assertDismissReachable, availableWidth, demandedWidth, setViewport } from './fits'
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
    // ⚠ 10.10 – named pose gaps: this career spent nothing on Travel in the window (no spend category row), and the back control is aria on an icon.
    const NOT_IN_POSE = new Set(['spend|Travel', 'listing|Withdraw'])
    for (const key of wiredHere) {
      if (NOT_IN_POSE.has(key)) continue
      // ⚠ 10.10 – a PARAMETERISED value renders with its holes filled, so every hole-free SEGMENT must render instead of the raw pattern.
      for (const seg of RU[key]!.split(/\{\d+\}/)) {
        const t = seg.trim()
        if (t !== '') expect(everything, `${key} is approved and wired, so his Russian must render (segment «${t}»)`).toContain(t)
      }
    }
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

  it('an open OfferLetter shell – the foot with its window line and two doors – holds a 375x667 phone with every word longer; the longest sign question still reaches its dismiss (numbers printed)', async () => {
    const measure = (): { label: string; r: ReturnType<typeof widest> }[] => {
      setViewport(PHONE)
      const offer = openCampaign()
      const w = mount(OfferLetter, { props: { offer, week: 40, offers: [offer] }, attachTo: document.body })
      const foot = w.findAll('.offer-foot')[0]
      expect(foot, 'the open letter has a foot').toBeTruthy()
      const out = [{ label: 'the open letter\'s foot (window line + Refuse / Sign)', r: widest(foot!.element) }]
      w.unmount()
      return out
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
    // CLAUDE.md's popup rule, on the longest question this wave wired: the sign question of a four-year campaign, opened from the inbox, under xx
    const offer = openCampaign()
    setViewport(PHONE)
    const sheet = await mountInbox(withPost(coached, [offer], 40), { attachTo: document.body }, [offer])
    await sheet.get('.inbox-open').trigger('click')
    await sheet.get('.offer-sign').trigger('click')
    const fit = assertDismissReachable(document.querySelector('.dialog-overlay .dialog-card')!, document.querySelector('.dialog-overlay .dialog-actions')!, PHONE, 'InboxSheet sign question under xx')
    console.log(`[L2-6 xx] the four-year campaign's sign question under xx: card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)}, ${fit.shape}, dismiss ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${PHONE.height}`)
    sheet.unmount()
  })
})


// =================================================================================================================
// L2-6b – THE SHOP, THE SPONSORS' LETTER SHELL AND THE INBOX
// =================================================================================================================

/** A professional career with a full purse: the shelf is open and every rung is reachable (`shop-tab.test.ts`'s recipe). */
let shopSnap: Snapshot
const shopFixture = (): Snapshot => {
  if (shopSnap) return shopSnap
  const world = createWorld('l26-shop')
  walkWeeks(world, rngFromSeed(world.seed), 20)
  world.bestFinishByTier.wta250 = 3
  shopSnap = toSnapshot(world)
  shopSnap.fundsCents = 60_000_000_00
  return shopSnap
}
async function mountShop(snapshot: Snapshot = shopFixture()): Promise<VueWrapper> {
  const w = mountMoney(snapshot)
  await press(w, 'Shop')
  return w
}

/** The two letters whose terms are short enough to pose by hand – a tournament desk notice and an academy scholarship – and an OPEN clothing campaign. */
function entryLetter(): Offer {
  return { id: 'l26-entry', kind: 'entry', week: 30, deadlineWeek: 30, state: 'info', terms: { kind: 'entry', tier: 'wta250', label: 'Harbour Open', eventWeek: 34, freeUntilWeek: 32 } } as unknown as Offer
}
function academyLetter(): Offer {
  return { id: 'l26-academy', kind: 'academy', week: 31, deadlineWeek: 31, state: 'info', terms: { kind: 'academy', notice: 'arrived', sharePct: 25, grantCents: 1_000_00, sinceWeek: 31 } } as unknown as Offer
}
function openCampaign(): Offer {
  return {
    id: 'l26-ad', kind: 'ad', week: 40, deadlineWeek: 43, state: 'open',
    terms: { kind: 'ad', category: 'clothing', brand: 'Orla', trade: 'We make her kit', cashCents: 100_000_00, termYears: 4, termWeeks: 4 * 52, shootCount: 1 },
  } as unknown as Offer
}

describe('L2-6b parity – the shop, the inbox and the letter shell, with no catalog', () => {
  it('the shop home: the plate, its note, the cheapest rung and the six cards with their hovers', async () => {
    const w = await mountShop()
    const text = flat(w.text())
    expect(text).toContain('The shelf')
    expect(text).toContain("This is the family's own money, and none of it is hers. Nothing here makes her better, faster or fitter - it is what the money becomes once the tennis has stopped needing it.")
    expect(text).toMatch(/You own nothing yet\. The cheapest thing here is .+, from \$[\d,.]+\./)
    // the six cards are the six segments' words with the segments' own hovers (`SHELF_CATEGORY_CARDS` reads them out of `SHELF_TAB_OPTIONS`)
    const HOVER = new Map([
      ['Invest', 'Money that stays money'], ['Business', 'What the family owns that earns – the academy included'], ['Cars', 'The garage'],
      ['Property', 'Somewhere to live'], ['Water', 'Boats, ordered rather than bought'], ['Air', 'The family aeroplane'],
    ])
    const cards = w.findAll('.shelf-cat').map((n) => [n.text().trim(), n.attributes('title')] as const)
    expect(new Map(cards)).toEqual(HOVER)
    expect([...SHELF_TAB_LABELS].sort()).toEqual([...HOVER.keys()].sort())
    w.unmount()
  })

  it('the shelf: every family head and note, the rate lines, the controls, the build wait and the stake words', async () => {
    const w = await mountShop()
    const HEADS = new Map([
      ['Invest', ['Investments', 'Money that stays money. Each one names a minimum, not a price – put in what you like above it.']],
      ['Cars', ['Cars', 'Every one of these is worth less next season than it is today. That is what a car is.']],
      ['Property', ['Property', 'Slow, large, and the end of paying somebody else rent.']],
      ['Business', ['The business', 'The first thing on this shelf that earns. What it brings in follows how known she is – the shoots and the titles – not her ranking.']],
      ['Water', ['On the water', 'Ordered, not bought – the money goes now and the boat comes years later. Every one of them costs a wage a week to keep.']],
      ['Air', ['In the air', 'The family aeroplane. It takes half the fare off every trip to a tournament, and it is kept the way an aeroplane is kept.']],
    ])
    const rates = /^(Gains about \d+% a season|Neither gains nor loses|Loses \d+% a season|Worth [\d.]+ years of what it sells)$/
    for (const [tab, [head, note]] of HEADS) {
      await openShelfTab(w, tab)
      const heads = w.findAll('.shop-family-head').map((n) => n.text())
      expect(heads, tab).toContain(head)
      expect(w.findAll('.shop-family-note').map((n) => n.text()), tab).toContain(note)
      expect(w.findAll('.shop-row-rate').every((n) => rates.test(flat(n.text()))), `${tab}: every rate line is one of the four English shapes`).toBe(true)
      expect(w.findAll('.shop-action').every((n) => ['Put it in', 'Buy it', 'Order it'].includes(n.text().trim())), `${tab}: the controls`).toBe(true)
    }
    await openShelfTab(w, 'Invest')
    expect(w.text()).toMatch(/One unit is \$[\d,.]+ this week/)
    expect(w.text()).toMatch(/How much, from \$[\d,.]+/)
    await openShelfTab(w, 'Water')
    expect(w.findAll('.shop-row-wait').map((n) => flat(n.text())).some((s) => /^Built to order – about (\d+ months|\d+ years|\d+ weeks?) from the week it is ordered\.$/.test(s))).toBe(true)
    expect(w.findAll('.shop-row-upkeep').every((n) => /^\$[\d,.]+ a week to keep$/.test(flat(n.text())))).toBe(true)
    w.unmount()
  })

  it('the shelf questions: a car is bought, a boat is ordered with its keep, and the order of the words is the old one', async () => {
    const w = await mountShop()
    await (await shelfRow(w, 'The sensible estate')).find('.shop-action').trigger('click')
    expect(flat(w.get('.dialog-card').text())).toContain("Buy The sensible estate for $60,000? It comes out of the family's money this week.")
    w.unmount()
    const boat = await mountShop()
    await openShelfTab(boat, 'Water')
    await boat.findAll('.shop-row')[0]!.find('.shop-action').trigger('click')
    expect(flat(boat.get('.dialog-card').text())).toMatch(/^Order .+ for \$[\d,.]+\? The money goes this week and it arrives in \d+ weeks\. It then costs \$[\d,.]+ a week to keep\./)
    boat.unmount()
  })

  it('the secondary market words: List, Sell now, Keep it, Withdraw and the two senders are the English the table drafted', () => {
    expect(SALE_LABELS.list).toBe('List')
    expect(SALE_LABELS.sellNow).toBe('Sell now')
    expect(SALE_LABELS.keep).toBe('Keep it')
    expect(SALE_LABELS.withdraw).toBe('Withdraw')
    expect(SALE_SENDER.buyer).toBe('A buyer')
    expect(SALE_SENDER.market).toBe('The market')
  })

  it('the inbox: the empty states, the title and the way out', async () => {
    const base = coached
    const none = await mountInbox(withPost(base, []), {}, [])
    expect(flat(none.text())).toContain('Nothing yet. Sponsors write to players they have been watching for a season.')
    expect(seen(none.element)).toContain('Close')
    expect(none.html()).toContain('Inbox')
    none.unmount()
  })

  it('the inbox: senders, subjects, the filed line and the sign-offs of a tournament notice and a scholarship', async () => {
    const post = [entryLetter(), academyLetter()]
    const w = await mountInbox(withPost(coached, post, 32), {}, post)
    expect(w.findAll('.inbox-from').map((n) => n.text()).sort()).toEqual(['The academy', 'Tournament desk'])
    expect(w.findAll('.inbox-subject').map((n) => n.text()).sort()).toEqual(['A scholarship – 25% of her travel', 'Entry confirmed – Harbour Open'])
    for (const [letter, who] of [[0, 'Tournament desk'], [1, 'The academy']] as const) {
      const row = w.findAll('.inbox-row').find((r) => r.text().includes(who))!
      await row.get('.inbox-open').trigger('click')
      const paper = flat(w.get('.offer-letter').text())
      expect(paper, String(letter)).toContain(`– ${who}`)
      expect(paper, String(letter)).toMatch(/Filed W\d+ ['’]\d\d\./)
      expect(w.findAll('button[aria-label="Back to all letters"]').length).toBe(1)
      await w.get('button[aria-label="Back to all letters"]').trigger('click')
    }
    w.unmount()
  })

  it('an open campaign: the window in its singular and plural, the doors, the sign question and the bin question', async () => {
    for (const [week, shape] of [[43, /^1 week to decide\. The terms will not change\./], [40, /^4 weeks to decide\. The terms will not change\./]] as const) {
      const offer = openCampaign()
      const w = mount(OfferLetter, { props: { offer, week, offers: [offer] }, attachTo: document.body })
      expect(flat(w.get('.offer-window').text()), `week ${week}`).toMatch(shape)
      expect(w.findAll('.offer-actions button').map((b) => b.text())).toEqual(['Refuse', 'Sign'])
      expect(flat(w.get('.offer-sign-off').text())).toBe('– Orla')
      w.unmount()
    }
    const offer = openCampaign()
    const sheet = await mountInbox(withPost(coached, [offer], 40), { global: { stubs: { teleport: true } } }, [offer])
    expect(sheet.findAll('.inbox-waiting').map((n) => n.text())).toEqual(['Needs an answer'])
    expect(sheet.findAll('.inbox-subject').map((n) => n.text())).toEqual(['Her face in a campaign – $100,000'])
    expect(sheet.findAll('.inbox-meta').map((n) => flat(n.text()))[0]).toMatch(/^W\d+ ['’]\d\d · 4 weeks to decide$/)
    await sheet.get('.inbox-open').trigger('click')
    await sheet.get('.offer-sign').trigger('click')
    expect(flat(sheet.get('.dialog-card').text())).toMatch(/^Sign with Orla\? \$100,000 a year for 4 years – the first year's fee paid to her now, the rest on each anniversary – her face in their campaign to /)
    sheet.unmount()
  })
})

describe('L2-6b completeness and seams', () => {
  const FILES = ['src/components/ShopPanel.vue', 'src/composables/shop.ts', 'src/composables/saleLetter.ts', 'src/components/InboxSheet.vue']
  it('no CERTAIN string homed in the shop, the sender words or the inbox sheet is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped).map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the sites this wave names call t(): the shelf words, the sentences with holes, the sender words and the inbox chrome', () => {
    const SITES: [string, string[]][] = [
      ['src/composables/shop.ts', ['List', 'Sell now', 'Keep it', 'listing|Withdraw', 'Investments', 'Cars', 'Property', 'The business', 'On the water', 'In the air', 'Her academy', 'Invest', 'Business', 'Water', 'Air',
        'Money that stays money', 'The garage', 'Somewhere to live', 'Boats, ordered rather than bought', 'The family aeroplane', '{0}% built – ready {1}',
        'Built to order – about 1 week from the week it is ordered.', 'Built to order – about {0} weeks from the week it is ordered.', 'Built to order – about {0} months from the week it is ordered.',
        'Built to order – about {0} years from the week it is ordered.', 'Worth {0} years of what it sells', 'Loses {0}% a season', 'Neither gains nor loses', 'Gains about {0}% a season',
        '{0} months', '1 year', '{0} years', 'Bought in {0}, {1}', 'Not enough months to draw yet', 'One unit, monthly, from {0} to {1}: {2} to {3}', 'Amount, from {0}',
        'Amount, from {0} – leave it blank to sell all {1}', "Put a further {0} into {1}? It comes out of the family's money this week.", 'It then costs {0} a week to keep.',
        'Order {0} for {1}? The money goes this week and it arrives in {2} weeks.', "Buy {0} for {1}? It comes out of the family's money this week.", 'exactly what it cost', '{0} less than it cost',
        '{0} more than it cost', 'Take {0} out of {1}? That part is {2}, and the rest stays invested.', 'Sell {0} for {1}? That is {2}.', 'It may take {0} weeks or more to sell – there may be no buyer at all.',
        'It may take {0} to {1} weeks to sell.', 'Offers may range from {0} to {1}.', 'Selling now pays {0}, at once.', 'Few buyers can pay this much – it may not sell at all.',
        'The academy sells as one lot – every stage goes together, not the courts alone.', 'Interest has gone quiet · 1 week on the market', 'Interest has gone quiet · {0} weeks on the market',
        'On the market · 1 week', 'On the market · {0} weeks', 'paid {0}']],
      ['src/composables/saleLetter.ts', ['A buyer', 'The market']],
      ['src/components/ShopPanel.vue', ['The shelf', "This is the family's own money, and none of it is hers. Nothing here makes her better, faster or fitter - it is what the money becomes once the tennis has stopped needing it.",
        'You own nothing yet. The cheapest thing here is {0}, from {1}.', 'What you own', '1 thing', '{0} things', 'Which part of the shelf',
        "She takes {0}% of what these earn; the figures below are the family's {1}%. A holding's worth is the whole business.", 'How far back the chart goes', '{0} units at {1} each',
        'One month of prices so far &ndash; the chart starts next month.'.replace('&ndash;', '–'), '{0} a week to keep', 'Brings in {0} a week right now', '{0} has to come first.', 'On order',
        'It cannot be sold before it is delivered, and it costs nothing to keep until then.', 'Worth now', '{0} units – bought at {1} each, {2} now', 'Trading as {0}', 'since you bought it ({0}%)',
        'since you bought it', 'Add more', 'Sell', 'One unit is {0} this week', 'How much, from {0}', 'What is it called', 'or type your own', 'What it is called', 'Put it in', 'Order it', 'Buy it']],
      ['src/components/InboxSheet.vue', ['Inbox', 'Close', 'Back to all letters', 'Nothing yet. Sponsors write to players they have been watching for a season.',
        'Your inbox is clear. Everything you took off the list is still in her history.', 'Nothing waiting on an answer.', 'Needs an answer', 'Delete the letter: {0} – {1}', 'Sign it', 'Delete', 'Keep it',
        'Tournament desk', 'Tour office', 'The academy', 'Her coach', 'Her masseur', 'Her psychologist', 'Her hitting partner', 'Her national federation', 'Order desk',
        'Entry confirmed – {0}', 'Withdrawn by the desk – {0}', 'Withdrawal confirmed – {0}', 'Required event – {0}', 'Penalty points recorded', 'Required season – the top {0}', 'Required season',
        'Entries suspended', 'A scholarship – {0}% of her travel', 'The scholarship has ended', 'Scholarship review – {0}% of her travel', 'Named in the squad – {0}, {1}', 'Her face in a campaign – {0}',
        '{0} is ready', 'Interest in {0} has gone quiet', '{0} – an offer of {1}', 'A raise request – {0}', 'The season on court – {0}', 'The season on the table – {0}', "The season's work in the room – {0}",
        "The season's practice – {0}", 'The kit deal has ended', 'Renewing her kit with us', 'Another year in our kit', 'A kit deal for your daughter', '{0} · 1 week to decide', '{0} · {1} weeks to decide',
        'Take this letter from {0} off your list? Nothing that happened is undone – it stays in her history, it just stops showing here.',
        'Accept the raise? The rate goes from {0} to {1} {2}. This cannot be undone.', 'Sell {0} for {1}? The sale settles this week and cannot be undone.',
        'Sign with {0}? {1} a year, paid to her every year for life – no shoot weeks, no end date. This cannot be undone.', 'A one-time fee of {0}, paid to her now',
        "{0} a year for {1} years – the first year's fee paid to her now, the rest on each anniversary", ', with her shoot weeks on {0}{1} – working weeks, less rest in them', 'and {0} more across the term',
        'Sign with {0}? {1} – her face in their campaign to {2}{3}. This cannot be undone.', 'a season', '{0} seasons', 'Signing ends her campaign with {0} – {1} of fees still to come on it.',
        'Signing ends her campaign with {0}. Every fee it owed her is already banked and stays hers.',
        'Sign with {0}? They cover her {1} for {2} – up to {3}, to {4} – and she must enter at least {5} tournaments a season.{6} This cannot be undone.']],
      ['src/components/OfferLetter.vue', ['– Tournament desk', '– Tour office', '– The academy', '– Her national federation', '– Order desk', '– Her coach', '– Her masseur', '– Her psychologist', '– Her hitting partner',
        'Filed {0}.', '1 week to decide. The terms will not change.', '{0} weeks to decide. The terms will not change.', 'Refuse', 'Sign', 'Decline', 'Accept']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the table names that its own file does not call').toEqual([])
  })

  it('the shelf tabs, the family heads and the secondary market words are getters: they read the catalog when READ', async () => {
    installCatalog('ru', { Invest: 'INVEST*', 'Money that stays money': 'MTSM*', Investments: 'FAMILY*', 'Put it in': 'PUT*', 'listing|Withdraw': 'WD*', 'Sell now': 'NOW*', 'A buyer': 'BUYER*' })
    await setLocale('ru')
    expect(SALE_LABELS.withdraw).toBe('WD*')
    expect(SALE_LABELS.sellNow).toBe('NOW*')
    expect(SALE_SENDER.buyer).toBe('BUYER*')
    const w = await mountShop()
    expect(w.findAll('.shelf-cat').map((n) => n.text().trim())[0]).toBe('INVEST*')
    await openShelfTab(w, 'INVEST*')
    const text = seen(w.element)
    for (const marker of ['FAMILY*', 'PUT*']) expect(text, marker).toContain(marker)
    w.unmount()
  })

  it('the pending counts are counted phrases: one thing, many things; one week, many weeks – each its own whole message', async () => {
    const src = SRC('src/components/ShopPanel.vue')
    expect(src).toContain("t('1 thing')")
    expect(src).toContain("t('{0} things', [shop.ownedCount])")
    installCatalog('ru', { '{0} weeks to decide. The terms will not change.': 'WIN* {0}', '1 week to decide. The terms will not change.': 'ONE*' })
    await setLocale('ru')
    const offer = openCampaign()
    const w = mount(OfferLetter, { props: { offer, week: 43, offers: [offer] } })
    expect(w.get('.offer-window').text()).toBe('ONE*')
    await w.setProps({ week: 40 })
    expect(w.get('.offer-window').text()).toBe('WIN* 4')
    w.unmount()
  })
})

describe('L2-6b context tag – listing|Withdraw (measured against every batch table)', () => {
  it('is a wired key that renders the bare English, and the shelf asks for it, never the bare word the tournament withdrawal owns', async () => {
    expect(CATALOG.keys['listing|Withdraw']?.wrapped).toBe(true)
    expect(t('listing|Withdraw')).toBe('Withdraw')
    installCatalog('ru', { 'listing|Withdraw': 'LISTED*', Withdraw: 'BARE*' })
    await setLocale('ru')
    expect(SALE_LABELS.withdraw).toBe('LISTED*')
    expect(Object.values(SALE_LABELS).some((v) => v === 'BARE*')).toBe(false)
  })
})

describe('L2-6b Russian smoke – the shop and the inbox from the REAL ru.json', () => {
  it('every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const shop = await mountShop()
    const inbox = await mountInbox(withPost(coached, [entryLetter(), academyLetter()], 32), {}, [entryLetter(), academyLetter()])
    const mounted = [shop, inbox]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /ShopPanel|composables\/shop|saleLetter|InboxSheet|OfferLetter/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // ⚠ 10.10 – named pose gap: nothing is OWNED in this pose, so no shelf listing shows its Withdraw control.
    const NOT_IN_POSE_B = new Set(['listing|Withdraw', 'spend|Travel'])
    for (const key of wiredHere) {
      if (NOT_IN_POSE_B.has(key)) continue
      // ⚠ 10.10 – a PARAMETERISED value renders with its holes filled, so every hole-free SEGMENT must render instead of the raw pattern.
      for (const seg of RU[key]!.split(/\{\d+\}/)) {
        const t = seg.trim()
        if (t !== '') expect(everything, `${key} is approved and wired, so his Russian must render (segment «${t}»)`).toContain(t)
      }
    }
    expect(everything).toContain('The shelf')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(15)
    for (const key of ['The shelf', 'Invest', 'Tournament desk']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-6b smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on two mounted surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

describe('L2-6b xx sweep – the shop, the inbox and the letter shell', () => {
  const ENGINE_BORN: RegExp[] = [
    /^W\d+( \d{4}| ['’]\d{2})?$/, /^[−-]?\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/, /^\d+(?:\.\d+)?%$/, /^\d+°?$/, /^#\d+$/, /^[\d,]+$/, /^\d+(?:-\d+)*$/, /^[—–-]$/, /^\?$/, /^%$/, /^·$/,
    // the month axis of a chart («Jan '38») and its price span («$6,688 – $7,147»): `monthLabel` and money, formatters
    /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ['’]\d\d$/, /^\$[\d,.]+ – \$[\d,.]+$/,
    // the units figure the shelf prints in the unit's own spelling («12.5»)
    /^[\d,.]+$/,
  ]
  // the sign-off glue «– » before a brand the letter carries (`– {{ adTerms.brand }}`) is punctuation, not copy
  const prose = (leak: string): string => leak.replace(/^[\p{Extended_Pictographic}‍️\s]+|[\p{Extended_Pictographic}‍️\s]+$/gu, '').trim().replace(/^– (?=\S)/, '')
  const corpusOf = (snap: Snapshot, extra: string[] = []): string => [JSON.stringify(snap), ...extra].join('\n')
  const allow = [...DEFAULT_ALLOW, ...ENGINE_BORN]
  // a string is the engine's when the snapshot carries it: as part of its prose, or – for the short ones (a two-letter monogram on a naming chip) – as an exact JSON value
  const leaksOf = (root: Element, corpus: string): string[] =>
    hardcodeLeaks(root, allow).filter((l) => !((prose(l).length > 2 && corpus.includes(prose(l))) || corpus.includes(JSON.stringify(prose(l)))))
  /** A letter's SHELL: the foot (the window line, the filed line, the doors) and the sign-off. ⚠ L3-2 (10.10) – THE BODY IS CHARGED NOW. The paper's body was the
   *  letter's prose, template-authored and left raw by L2-6b (counted below, not swept); L3-2 found it was class (b) – assembled at render from the persisted
   *  terms, the schema untouched – and wired it, so the sweep below charges the WHOLE paper and `shellLeaks` is kept only to name the shell in the log. */
  const shellLeaks = (root: Element, corpus: string): string[] => Array.from(root.querySelectorAll('.offer-foot, .offer-sign-off')).flatMap((el) => leaksOf(el, corpus))

  it('the shop home and all six shelves, the inbox list and two letters, and an open campaign: nothing the SCREEN wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const snap = shopFixture()
    const corpus = corpusOf(snap)
    const shop = mountMoney(snap)
    await shop.findAll('.money-tabs button')[3]!.trigger('click') // under xx the chapter words are bracketed: Shop is the fourth
    results.push(['shop/home', leaksOf(shop.element, corpus)])
    // under xx the words are bracketed, so the tabs are reached by position: a card opens the first shelf, the segments walk the six
    await shop.findAll('.shelf-cat')[0]!.trigger('click')
    for (let i = 0; i < SHELF_TAB_LABELS.length; i++) {
      await shop.findAll('.shelf-tabs button.tab-pill')[i]!.trigger('click')
      results.push([`shop/${SHELF_TAB_LABELS[i]}`, leaksOf(shop.element, corpus)])
    }
    shop.unmount()
    const post = [entryLetter(), academyLetter(), openCampaign()]
    const inboxSnap = withPost(coached, post, 41)
    const inbox = await mountInbox(inboxSnap, { global: { stubs: { teleport: true } } }, post)
    const inboxCorpus = corpusOf(inboxSnap, [JSON.stringify(post)])
    results.push(['inbox/list', leaksOf(inbox.element, inboxCorpus)])
    const rowCount = inbox.findAll('.inbox-row').length
    expect(rowCount, 'the three letters are listed').toBe(3)
    let bodies = 0
    const rawBody: string[] = []
    for (let i = 0; i < rowCount; i++) {
      await inbox.findAll('.inbox-open')[i]!.trigger('click')
      const shell = shellLeaks(inbox.element, inboxCorpus)
      results.push([`inbox/letter#${i} shell`, shell])
      // L3-2: the body is wired too – the paper as a whole must leave nothing unbracketed under xx (it was 12 paragraphs and lines left raw before)
      const whole = leaksOf(inbox.element, inboxCorpus)
      results.push([`inbox/letter#${i} body`, whole.filter((l) => !shell.includes(l))])
      bodies += whole.length - shell.length
      rawBody.push(...whole.filter((l) => !shell.includes(l)))
      await inbox.get('.inbox-back').trigger('click')
    }
    inbox.unmount()
    expect(rawBody, 'L3-2: no paragraph of the three letters is left raw').toEqual([])
    expect(bodies).toBe(0)
    console.log(`[L2-6b xx] letter bodies left raw (L3-2 wired them; L2-6b counted 12 across the same three letters): ${bodies}`)
    console.log(`[L2-6b xx] leaks: ${JSON.stringify(results.map(([a, b]) => [a, b.slice(0, 6)]))}`)
    for (const [surface, leaks] of results) expect(leaks, `${surface}: copy the SCREEN wrote that did not go through t()`).toEqual([])
  })
})
