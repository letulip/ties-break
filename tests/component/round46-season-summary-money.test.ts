// ⭐⭐⭐ ROUND 46 #8 + #19 – THE YEAR-END CARD'S MONEY TILE, MOUNTED.
//
// THE OWNER, 05.10: «В попапе итогов года что-то странное с доход-расход, в расходы явно что-то лишнее
// попадает, а в доходах общее состояние и прирост не учитываются» and «Потраченные суммы на итогах снова не
// соответствуют действительности. А ещё там верстка пляшет. Можно миллионы сокращать до М, например и
// красиво все выстроить.»
//
// ⚠ WHY MOUNTED, AND WHY THE NUMBERS COME FROM THE REAL WRAP. The defect was an engine fold the card
// faithfully printed, so the card's honest test is «it prints THE ENGINE'S numbers» – the world below goes
// through the real `buyAsset` and the real `maybeFireSeasonWrapUp`, and the card is mounted over the summary
// that comes out. Nothing here is a hand-typed figure the card could be right about by accident (the three
// literal strings are the M-form CONTRACT, pinned so a formatter that drifts with the card cannot pass).
//
// FIVE CLAIMS:
//   1. the card prints the engine's figures – the deposit is NOT in «Spent», the shelf and the wealth rows
//      are the engine's own, and the M-form reads «$1.0M» / «-$4.0M» / «$10.4M»;
//   2. a small figure stays in full dollars (and a career that holds nothing shows NO wealth or shelf row);
//   3. a summary banked before this change prints as it always did;
//   4. THE LAYOUT: the tile is one two-column grid, the rows are `display: contents`, the figures cannot wrap;
//   5. THE PHONE: with every new row present, the dismiss control is still inside 375x667
//      (`setViewport(PHONE)` BEFORE the mount – happy-dom caches a media query on the first style read).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { buyAsset, createWorld, maybeFireSeasonWrapUp, toSnapshot, type WorldState } from '../../src/engine/world'
import { accrueFinance } from '../../src/engine/world/ledger'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { SeasonSummary } from '../../src/shared/protocol'
import { formatCentsCompact, formatCentsSignedCompact } from '../../src/shared/money'
// ⚠ THE GLOBAL SHEET, because `.dialog-overlay` (`position: fixed`) and `.dialog-card`'s height cap live in it and the
// phone measurement refuses an overlay that is not fixed. The card's own scoped rules load with the component.
import '../../src/style.css'
import { PHONE, assertDismissReachable, setViewport } from './fits'

/** His scenario through the real engine: a fund deposit that gained, a berth bill and an ordinary year. */
function fundYear(): WorldState {
  const world = createWorld('r46-card-money', { ...DEFAULT_PROFILE })
  world.week = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
  world.financeWeeks = []
  accrueFinance(world, 10, 'prize', 3_000_000_00)
  accrueFinance(world, 11, 'sponsor', 500_000_00)
  accrueFinance(world, 12, 'income', 400_000_00)
  accrueFinance(world, 13, 'coaching', -600_000_00)
  accrueFinance(world, 14, 'travel', -300_000_00)
  accrueFinance(world, 15, 'entry', -100_000_00)
  world.fundsCents = 6_000_000_00 + 4_000_000_00
  buyAsset(world, 'index-fund', 4_000_000_00)
  world.assets.find((a) => a.id === 'index-fund')!.valueCents = 4_400_000_00
  accrueFinance(world, 30, 'shop', -20_000_00)
  maybeFireSeasonWrapUp(world)
  return world
}

/** A modest family that buys nothing, in the dollars the card has always printed. */
function modestYear(): WorldState {
  const world = createWorld('r46-card-modest', { ...DEFAULT_PROFILE })
  world.week = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
  world.financeWeeks = []
  accrueFinance(world, 10, 'prize', 21_502_00)
  accrueFinance(world, 11, 'coaching', -12_000_00)
  accrueFinance(world, 12, 'travel', -8_779_00)
  maybeFireSeasonWrapUp(world)
  return world
}

let mounted: VueWrapper | null = null

function mountCard(world: WorldState, over: Partial<SeasonSummary> | 'legacy' = {}, attach = false): VueWrapper {
  const store = useGameStore()
  const snap = toSnapshot(world)
  const base = snap.lastSeasonSummary!
  store.snapshot = {
    ...snap,
    lastSeasonSummary:
      over === 'legacy' ? { ...base, wealth: undefined } : { ...base, ...over },
  }
  mounted = mount(SeasonSummaryDialog, {
    attachTo: attach ? document.body : undefined,
    global: { stubs: { teleport: true } },
  })
  return mounted
}

/** The printed figure of the row whose label is `key`, or null when the card has no such row. */
function figure(wrapper: VueWrapper, key: string): string | null {
  const row = wrapper.findAll('.season-row').find((r) => r.find('.season-key').text() === key)
  return row ? row.find('.season-val, .season-net').text() : null
}

describe('⭐⭐⭐ round 46 #8 + #19 – the year-end Money tile', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    mounted?.unmount()
    mounted = null
    document.body.innerHTML = ''
  })

  it('prints the ENGINE`S figures: the deposit is not in «Spent», and the shelf and the wealth are shown', () => {
    const world = fundYear()
    const s = world.lastSeasonSummary!
    const card = mountCard(world)

    // parity – every figure is the engine's banked number through the one formatter, nothing re-derived
    expect(figure(card, 'Spent this season')).toBe(formatCentsSignedCompact(-s.spentCents!))
    expect(figure(card, 'Earned this season')).toBe(formatCentsSignedCompact(s.earnedCents!))
    expect(figure(card, 'Funds this season')).toBe(formatCentsSignedCompact(s.fundsDeltaCents))
    expect(figure(card, 'Holdings and upkeep')).toBe(formatCentsSignedCompact(s.wealth!.shelfNetCents))
    expect(figure(card, "Family's portfolio")).toBe(formatCentsCompact(s.wealth!.portfolioCents))
    expect(figure(card, 'Portfolio growth')).toBe(formatCentsSignedCompact(s.wealth!.growthCents!))

    // ⚠⚠ THE M-FORM CONTRACT, LITERALLY – and the first line is the owner's #8/#19: «Spent» reads the
    // consumption ($1.0M), not the $5.0M the unfixed engine banked with the deposit and the berth inside it.
    expect(figure(card, 'Spent this season')).toBe('-$1.0M')
    expect(figure(card, 'Earned this season')).toBe('+$3.9M')
    expect(figure(card, 'Holdings and upkeep')).toBe('-$4.0M')
    expect(figure(card, 'Funds this season')).toBe('-$1.1M')
    expect(figure(card, "Family's portfolio")).toBe('$10.4M')
    expect(figure(card, 'Portfolio growth')).toBe('+$3.3M')
    expect(card.text()).not.toContain('$5.0M')
  })

  it('a sale year reads as a positive shelf row, in the green, rather than as «Earned»', () => {
    const world = fundYear()
    const base = world.lastSeasonSummary!
    const card = mountCard(world, { wealth: { ...base.wealth!, shelfNetCents: 300_000_00 } })
    expect(figure(card, 'Holdings and upkeep')).toBe('+$300,000')
    const row = card.findAll('.season-row').find((r) => r.find('.season-key').text() === 'Holdings and upkeep')!
    expect(row.find('.season-val').classes()).toContain('positive')
  })

  it('a small figure stays in FULL dollars, and a family that holds nothing sees no wealth or shelf row', () => {
    const world = modestYear()
    const card = mountCard(world)
    expect(figure(card, 'Spent this season')).toBe('-$20,779')
    expect(figure(card, 'Earned this season')).toBe('+$21,502')
    expect(figure(card, 'Funds this season')).toBe('+$723')
    expect(figure(card, "Family's portfolio")).toBeNull()
    expect(figure(card, 'Portfolio growth')).toBeNull()
    expect(figure(card, 'Holdings and upkeep')).toBeNull()
    expect(card.text(), 'no M anywhere on a card with no million on it').not.toMatch(/\$[\d.,]+M/)
  })

  it('a summary banked before this change prints exactly as it always did', () => {
    const card = mountCard(modestYear(), 'legacy')
    expect(figure(card, 'Spent this season')).toBe('-$20,779')
    expect(figure(card, "Family's portfolio")).toBeNull()
    expect(figure(card, 'Funds this season')).toBe('+$723')
  })

  it('⭐ THE LAYOUT: one two-column grid, the rows are `contents`, the figures cannot wrap', () => {
    const card = mountCard(fundYear(), {}, true)
    const grid = card.find('.season-money').element
    expect(getComputedStyle(grid).display).toBe('grid')
    const rows = card.findAll('.season-money .season-row')
    expect(rows.length).toBeGreaterThanOrEqual(6)
    for (const row of rows) expect(getComputedStyle(row.element).display).toBe('contents')
    for (const val of card.findAll('.season-money .season-val, .season-money .season-net')) {
      expect(getComputedStyle(val.element).whiteSpace).toBe('nowrap')
    }
    // the old shape is gone from this tile: no wrapping flex rows
    expect(card.find('.season-money.season-rows').exists()).toBe(false)
  })

  it('⭐ THE PHONE: with the shelf and both wealth rows present, the dismiss control is inside 375x667', () => {
    // ⚠ SET BEFORE THE MOUNT – happy-dom caches a media query on the first computed-style read, so a late
    // call would measure the desktop column and the arm could never redden.
    setViewport(PHONE)
    const card = mountCard(fundYear(), { academyCoveredCents: 42_000_00 }, true)
    expect(card.find('.season-money').findAll('.season-row').length, 'the longest version of the tile').toBe(7)
    const dialog = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    assertDismissReachable(dialog, dismiss, PHONE, 'the year-end card with the shelf and wealth rows (round 46 #8/#19)')
  })
})
