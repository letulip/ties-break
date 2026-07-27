<script setup lang="ts">
// R9-21a – the injury stop is LOUD. A fresh injury used to land as a quiet toast the owner
// missed while week-skipping (he saw the auto-withdrawal three weeks later). This is the
// blocking popup instead (SeasonSummaryDialog pattern): the injury kind, how long she is out,
// what was auto-withdrawn at onset and what came back as refunds – plus an alert sfx from the
// existing framework ('ooh', no new assets). App.vue shows it whenever an advance's stop reasons
// INCLUDE 'injury' (R11-1: one week can stop for several reasons, and a week that also ended the
// season used to swallow this one whole); Continue dismisses it client-side like the season summary.
import { computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { playSfx } from '../audio/sfx'
import type { InjurySeverity } from '../shared/protocol'
import { weekLabel } from '../shared/dates'

defineEmits<{ continue: [] }>()

const game = useGameStore()
const injury = computed(() => game.snapshot?.injury ?? null)
const week = computed(() => game.snapshot?.week ?? 0)

const SEVERITY_LABEL: Record<InjurySeverity, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  severe: 'Severe',
}
const severityLabel = computed(() => (injury.value ? SEVERITY_LABEL[injury.value.severity] : ''))
const backWeek = computed(() => week.value + (injury.value?.weeksRemaining ?? 0))

// What the family pulled out of at onset. F45-2: `rollInjury` no longer cancels every open entry –
// only the ones the LAYOFF SWALLOWS, so this list is usually short and is often empty (entry lists
// close two weeks out, so a 1-2 week absence reaches nothing at all). The copy below has to say
// that plainly: the row is about what was CANCELLED, and it must never read as "your season is
// gone". Presentation-only reads off the snapshot events – no engine extension.
const withdrawnEntries = computed(() =>
  (game.snapshot?.events ?? [])
    .filter((e) => e.week === week.value && e.type === 'entry' && e.text.startsWith('Withdrew from '))
    .map((e) => e.text.slice('Withdrew from '.length)),
)
const refundCents = computed(() =>
  (game.snapshot?.events ?? [])
    .filter((e) => e.week === week.value && e.text.startsWith('Entry refunded'))
    .reduce((s, e) => s + (e.amountCents ?? 0), 0),
)
function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

// The dialog only ever mounts off a real click ("Next week"), so the audio gate is open.
onMounted(() => playSfx('ooh'))
</script>

<template>
  <div v-if="injury" class="dialog-overlay" @click.self="$emit('continue')">
    <div class="dialog-card season-summary injury-stop">
      <p class="season-summary-kicker">Injury – {{ weekLabel(week) }}</p>
      <h2 class="season-summary-title">She's hurt.</h2>
      <table class="season-summary-table">
        <tbody>
          <tr>
            <th>Injury</th>
            <td>{{ injury.kind }}</td>
          </tr>
          <tr>
            <th>Severity</th>
            <td>{{ severityLabel }}</td>
          </tr>
          <tr>
            <th>Out for</th>
            <td>
              ~{{ injury.totalWeeks }} wk{{ injury.totalWeeks === 1 ? '' : 's' }} – back around
              {{ weekLabel(backWeek) }}
            </td>
          </tr>
          <tr>
            <th>Cancelled</th>
            <td>
              <template v-if="withdrawnEntries.length">
                <div v-for="(entry, i) in withdrawnEntries" :key="i">Withdrawn: {{ entry }}</div>
                <div v-if="refundCents > 0" class="positive num">Fees refunded: +{{ formatDollars(refundCents) }}</div>
              </template>
              <template v-else>Nothing – every entry stands</template>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="hint season-summary-note">
        Only the weeks she is out are cancelled – anything from {{ weekLabel(backWeek) }} on is still booked.
      </p>
      <p class="hint season-summary-note">Rest and rehab now – the news feed tracks her recovery.</p>
      <div class="dialog-actions">
        <button class="primary" @click="$emit('continue')">Continue</button>
      </div>
    </div>
  </div>
</template>
