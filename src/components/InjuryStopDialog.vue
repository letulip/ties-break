<script setup lang="ts">
// R9-21a – the injury stop is LOUD. A fresh injury used to land as a quiet toast the owner
// missed while week-skipping (he saw the auto-withdrawal three weeks later). This is the
// blocking popup instead (SeasonSummaryDialog pattern): the injury kind, how long she is out,
// what was auto-withdrawn at onset and what came back as refunds – plus an alert sfx from the
// existing framework ('ooh', no new assets). App.vue shows it whenever an advance's stop reasons
// INCLUDE 'injury' (R11-1: one week can stop for several reasons, and a week that also ended the
// season used to swallow this one whole); Continue dismisses it client-side like the season summary.
//
// R14-1 – AND IT IS WHERE THE `injury` PAINTING LIVES NOW (owner, 29.07: «травму показываем ТОЛЬКО
// в момент самой травмы в попапе или еще где-то»). Home used to wear that face for the whole
// layoff; it wears `rehab` now, and the picture of the moment she went down belongs to the one
// surface that only exists at that moment. This dialog mounts on the onset week and on no other –
// App.vue gates it on the 'injury' STOP REASON, which the engine reports for the tick that rolled
// it – so the emotion here is a CONSTANT, not a decision, and it deliberately does not reach for
// the emotion composable at all (the same shape OnboardingWizard uses for its fixed jun-norm
// frame). The only thing that varies is her age band.
import { computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { playSfx } from '../audio/sfx'
import type { InjurySeverity } from '../shared/protocol'
import { portraitStage } from '../shared/avatarEmotion'
import { portraitUrl } from '../art/preload'
import { weekLabel } from '../shared/dates'
import { formatCents } from '../shared/money'
import { facePoint } from '../art/faceRects'

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

// The painting of the moment, in her own age band. Already warmed: `injury` stays in the preloaded
// per-band set precisely because this surface and the Memory card can still request it.
const stage = computed(() => portraitStage(game.snapshot?.ageYears ?? 14))
const artUrl = computed(() => portraitUrl(stage.value, 'injury'))
// Framed off the ONE face table, like every other painting the app shows landscape-cropped.
const artStyle = computed(() => {
  const p = facePoint(`${stage.value}-injury`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

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

// The dialog only ever mounts off a real click ("Next week"), so the audio gate is open.
onMounted(() => playSfx('ooh'))
</script>

<template>
  <div v-if="injury" class="dialog-overlay" @click.self="$emit('continue')">
    <div class="dialog-card season-summary injury-stop">
      <img class="injury-stop-art" :src="artUrl" :style="artStyle" alt="" />
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
                <div v-if="refundCents > 0" class="positive num">Fees refunded: +{{ formatCents(refundCents) }}</div>
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
