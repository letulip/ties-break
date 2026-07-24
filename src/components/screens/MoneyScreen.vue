<script setup lang="ts">
// Package N – Money tab: funds big number + starting budget, a spending BREAKDOWN
// (round-7 item 2: dependency-free SVG donut + per-category rows over a 12-week / this-season
// window, income on its own green row), then the real ledger below it.
//
// The running ledger balance is reconstructed BACKWARDS from the live `fundsCents` (the true
// current total) rather than forward from the snapshot's trailing event window, since events
// are capped/pruned and the window may not reach all the way back to the career's start. The
// breakdown works off the same visible-event window – it is a recent-spending picture, not the
// full-career audit trail.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import type { FamilyBackground, WorldEvent, WorldEventCategory } from '../../shared/protocol'

const game = useGameStore()

// Dollar figures per docs/specs/detour-ui-screens.md; must match
// src/engine/world.ts STARTING_FUNDS_CENTS (wealthy 120k / middle 25k / working 8k).
const STARTING_BUDGET: Record<FamilyBackground, number> = { wealthy: 120_000, middle: 25_000, working: 8_000 }

function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatDollars(dollars: number): string {
  return `$${dollars.toLocaleString('en-US')}`
}

const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatFunds(fundsCents.value))
const startingBudget = computed(() => (game.snapshot ? formatDollars(STARTING_BUDGET[game.snapshot.profile.background]) : ''))

// --- Breakdown (round-7 item 2) -----------------------------------------------
// Expense buckets in a fixed order, each with an accent-family colour for the donut. Positive
// (income) events never slice the donut – they roll into one green row. An expense whose
// category is missing/unknown (pre-round-7 events) falls into 'other'.
type ExpenseCategory = Exclude<WorldEventCategory, 'income' | 'sponsor'>
const EXPENSE_META: { key: ExpenseCategory; label: string; color: string }[] = [
  { key: 'coaching', label: 'Coaching', color: '#d9f24f' },
  { key: 'travel', label: 'Travel', color: '#4fd2f2' },
  { key: 'entry', label: 'Entry fees', color: '#b07cf2' },
  { key: 'gear', label: 'Gear', color: '#f2a54f' },
  { key: 'stringing', label: 'Stringing', color: '#f2668b' },
  { key: 'other', label: 'Other', color: '#8aa0c6' },
]
const EXPENSE_KEYS = new Set<string>(EXPENSE_META.map((m) => m.key))

// NB: must NOT be named `window` – Vue's template compiler treats `window` as the
// browser global (it's on the template global-allowlist), so a ref by that name is
// unreachable from the template: the toggle would silently no-op.
const breakdownWindow = ref<'12w' | 'season'>('12w')
const currentWeek = computed(() => game.snapshot?.week ?? 0)
// 12w: the last 12 weeks; season: from the current season year's first week.
const windowStartWeek = computed(() =>
  breakdownWindow.value === '12w' ? currentWeek.value - 11 : Math.floor(currentWeek.value / 52) * 52,
)
const windowEvents = computed<WorldEvent[]>(() =>
  (game.snapshot?.events ?? []).filter((e) => e.amountCents !== undefined && e.week >= windowStartWeek.value),
)

const incomeCents = computed(() =>
  windowEvents.value.filter((e) => (e.amountCents ?? 0) > 0).reduce((s, e) => s + (e.amountCents ?? 0), 0),
)

interface BreakdownRow {
  key: string
  label: string
  color: string
  cents: number
  pct: number
}
// Expense rows (money OUT), largest first, each with its share of total spend.
const expenseRows = computed<BreakdownRow[]>(() => {
  const totals = new Map<string, number>()
  for (const e of windowEvents.value) {
    const amt = e.amountCents ?? 0
    if (amt >= 0) continue
    const key = e.category && EXPENSE_KEYS.has(e.category) ? e.category : 'other'
    totals.set(key, (totals.get(key) ?? 0) + -amt)
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0)
  if (total === 0) return []
  return EXPENSE_META.filter((m) => (totals.get(m.key) ?? 0) > 0)
    .map((m) => {
      const cents = totals.get(m.key)!
      return { key: m.key, label: m.label, color: m.color, cents, pct: cents / total }
    })
    .sort((a, b) => b.cents - a.cents)
})
const totalExpenseCents = computed(() => expenseRows.value.reduce((s, r) => s + r.cents, 0))

// Donut segments over a circumference of 100 (r = 100 / 2π). Each segment's dash length is its
// percent; dashoffset walks the accumulated fill so segments sit end-to-end from 12 o'clock.
const DONUT_R = 15.915494309189533
interface DonutSeg {
  color: string
  dasharray: string
  dashoffset: number
}
const donutSegments = computed<DonutSeg[]>(() => {
  let filled = 0
  return expenseRows.value.map((r) => {
    const dash = r.pct * 100
    const seg = { color: r.color, dasharray: `${dash} ${100 - dash}`, dashoffset: 125 - filled }
    filled += dash
    return seg
  })
})
const pctLabel = (pct: number): string => `${Math.round(pct * 100)}%`

interface LedgerRow {
  event: WorldEvent
  balanceAfter: number
}
interface LedgerGroup {
  week: number
  rows: LedgerRow[]
}

const ledgerGroups = computed<LedgerGroup[]>(() => {
  const financial = (game.snapshot?.events ?? []).filter((e) => e.amountCents !== undefined)
  // Walk newest -> oldest: the last (most recent) financial event's balance-after
  // equals the live fundsCents; each older event's balance-after is that running
  // total minus the delta of everything more recent than it.
  let running = fundsCents.value
  const rows: LedgerRow[] = []
  for (let i = financial.length - 1; i >= 0; i--) {
    const event = financial[i]
    rows.push({ event, balanceAfter: running })
    running -= event.amountCents ?? 0
  }
  const byWeek = new Map<number, LedgerRow[]>()
  for (const row of rows) {
    const list = byWeek.get(row.event.week)
    if (list) list.push(row)
    else byWeek.set(row.event.week, [row])
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([week, weekRows]) => ({ week, rows: weekRows }))
})
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Money</h2>
      <div class="big-number" :class="{ negative: fundsCents < 0 }">{{ funds }}</div>
      <table style="margin-top: 12px">
        <tbody>
          <tr>
            <th>Starting budget</th>
            <td class="num">{{ startingBudget }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <div class="breakdown-head">
        <h2 style="margin: 0">Breakdown</h2>
        <div class="option-row breakdown-toggle">
          <button class="option-pill" :class="{ selected: breakdownWindow === '12w' }" @click="breakdownWindow = '12w'">12 weeks</button>
          <button class="option-pill" :class="{ selected: breakdownWindow === 'season' }" @click="breakdownWindow = 'season'">This season</button>
        </div>
      </div>

      <p v-if="!expenseRows.length" class="hint" style="margin: 8px 0 0">No spending in this window yet.</p>

      <div v-else class="breakdown-body">
        <svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Spending by category">
          <circle class="donut-track" cx="21" cy="21" :r="DONUT_R" />
          <circle
            v-for="(seg, i) in donutSegments"
            :key="i"
            class="donut-seg"
            cx="21"
            cy="21"
            :r="DONUT_R"
            :stroke="seg.color"
            :stroke-dasharray="seg.dasharray"
            :stroke-dashoffset="seg.dashoffset"
          />
          <text class="donut-center-num" x="21" y="20.5">{{ formatFunds(-totalExpenseCents) }}</text>
          <text class="donut-center-cap" x="21" y="25">spent</text>
        </svg>

        <div class="breakdown-rows">
          <div v-for="row in expenseRows" :key="row.key" class="breakdown-row">
            <span class="breakdown-swatch" :style="{ background: row.color }"></span>
            <span class="breakdown-label">{{ row.label }}</span>
            <span class="breakdown-pct muted-num">{{ pctLabel(row.pct) }}</span>
            <span class="breakdown-amount num negative">{{ formatFunds(-row.cents) }}</span>
          </div>
        </div>
      </div>

      <div v-if="incomeCents > 0" class="breakdown-income">
        <span class="breakdown-swatch income"></span>
        <span class="breakdown-label">Income</span>
        <span class="breakdown-amount num positive">{{ formatSigned(incomeCents) }}</span>
      </div>
    </section>

    <section>
      <h2>Ledger</h2>
      <p v-if="!ledgerGroups.length" class="hint" style="margin: 0">No transactions yet.</p>
      <div v-for="group in ledgerGroups" :key="group.week" class="ledger-week">
        <p class="ledger-week-label">W{{ group.week }}</p>
        <table>
          <tbody>
            <tr v-for="row in group.rows" :key="row.event.id">
              <td>{{ row.event.text }}</td>
              <td
                class="num"
                :class="{ negative: (row.event.amountCents ?? 0) < 0, positive: (row.event.amountCents ?? 0) > 0 }"
              >
                {{ formatSigned(row.event.amountCents ?? 0) }}
              </td>
              <td class="num muted-num">{{ formatFunds(row.balanceAfter) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
</template>
