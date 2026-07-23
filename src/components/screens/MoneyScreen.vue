<script setup lang="ts">
// Package N – Money tab: funds big number + starting budget (unchanged from
// Package I), plus the real ledger: financial events (those carrying
// `amountCents`) grouped by week, most recent week first, with a running
// balance per row. The running balance is reconstructed BACKWARDS from the
// live `fundsCents` (the true current total) rather than forward from the
// snapshot's trailing event window, since events are capped/pruned and the
// window may not reach all the way back to the career's start.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import type { FamilyBackground, WorldEvent } from '../../shared/protocol'

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
      <h2>Ledger</h2>
      <p v-if="!ledgerGroups.length" class="hint" style="margin: 0">No transactions yet.</p>
      <div v-for="group in ledgerGroups" :key="group.week" class="ledger-week">
        <p class="ledger-week-label">W{{ group.week }}</p>
        <table>
          <tbody>
            <tr v-for="row in group.rows" :key="row.event.id">
              <td>{{ row.event.text }}</td>
              <td class="num" :class="{ negative: (row.event.amountCents ?? 0) < 0 }">
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
