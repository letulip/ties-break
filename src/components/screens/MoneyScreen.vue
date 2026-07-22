<script setup lang="ts">
// Package I – Money tab: funds as a big number + starting-budget row + a Phase 5
// placeholder for the detailed ledger.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import type { FamilyBackground } from '../../shared/protocol'

const game = useGameStore()

// Dollar figures per docs/specs/detour-ui-screens.md; must match
// src/engine/world.ts STARTING_FUNDS_CENTS (wealthy 120k / middle 25k / working 8k).
const STARTING_BUDGET: Record<FamilyBackground, number> = { wealthy: 120_000, middle: 25_000, working: 8_000 }

function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatDollars(dollars: number): string {
  return `$${dollars.toLocaleString('en-US')}`
}

const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatFunds(fundsCents.value))
const startingBudget = computed(() => (game.snapshot ? formatDollars(STARTING_BUDGET[game.snapshot.profile.background]) : ''))
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
      <p class="hint">Detailed ledger – Phase 5</p>
    </section>
  </template>
</template>
