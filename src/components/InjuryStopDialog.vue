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
//
// R16 #18/#19 – AND IT SAYS WHEN AND WHY NOW, because the popup it used to be could only ever fire
// for the weekly roll. The gate moved onto the snapshot (App.vue `showInjuryStop`), so this dialog
// is now the surface for the RETIREMENT too – 61% of this game's injuries, and the door whose worst
// case the owner reported as a scoreline with no explanation attached to it. Two injuries that cost
// the same four weeks are not the same week, and the copy has to be able to tell them apart.
//
// ⚠ THE CIRCUMSTANCE IS READ OFF STATE, NOT OFF THE NEWS TEXT. `WorldEvent.match.retiredId` is the
// persisted fact that she stopped on court – the same field `travelHome` and the season plaque read –
// so this asks the world what happened rather than pattern-matching the sentence the world wrote
// about it. Presentation-only, exactly like the withdrawn-entry list below: no engine extension, no
// schema change, and `InjuryCause` stays private to engine/world/injury.ts where it belongs.
import { computed, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { playSfx } from '../audio/sfx'
import { KID_ID, RELEASE_LINE_PREFIX, INJURY_RELEASE_SUFFIX } from '../engine/world'
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
// WHEN: the layoff's own week, off the injury rather than off "now". They are the same number on the
// week this dialog mounts, and reading the injury is the one that stays true if it ever is not.
const onsetWeek = computed(() => injury.value?.sinceWeek ?? week.value)

// WHY, as far as the model knows. The retirement match she stopped in, if this injury came in by
// that door – `retiredId === KID_ID` is the whole test (see season/types.ts on the field).
const retiredMatch = computed(
  () =>
    (game.snapshot?.events ?? []).find(
      (e) => e.week === onsetWeek.value && e.match?.retiredId === KID_ID,
    ) ?? null,
)
/** One sentence naming the MOMENT: on court mid-match, or a body that gave way between them. */
const circumstance = computed(() => {
  const e = retiredMatch.value
  // ⚠ VAGUE ON PURPOSE, AND NOT LAZINESS. The weekly roll can land on a training week, a travel
  // week, an arrival week or a family holiday (`injuryVacationFactor` is nonzero – holidays do
  // sprain ankles), and the engine records which of those it was NOWHERE. "She felt it in training"
  // would be a sentence this dialog cannot support, on the same honesty rule the commentary and the
  // diary are held to: say only what the model knows.
  if (!e) return 'Off court – it came on between matches.'
  const opp = e.match?.oppName
  return e.friendly
    ? `On court – she had to stop during a practice match${opp ? ` against ${opp}` : ''}.`
    : `On court – she had to stop mid-match${opp ? ` against ${opp}` : ''}. The round she had reached is hers.`
})

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
//
// ⚠⚠ ROUND-20 #2 – THIS FILTER MATCHED A SENTENCE THE ENGINE STOPPED WRITING, AND THE ROW HAS BEEN
// BLIND SINCE 05.08. It read `startsWith('Withdrew from ')`, which was the only line `releaseEntry`
// wrote until `releasedBy` split it in two: the parent's own withdrawal still says "Withdrew from",
// and the DESK's – which is the only kind an injury produces – says "Taken out of ... she is not fit
// for that week". So the one row on this popup whose whole job is to report the layoff's cost could
// only ever see withdrawals the PLAYER made, and reported "Nothing" for every one the injury made.
// Measured on a real career: a 9-week layoff released two Local Opens and refunded both fees, and
// this list came back empty. The prefix is now imported from the engine that writes it: a symbol
// rather than a spelling, so re-wording the row moves BOTH sides at once instead of moving one and
// silencing the other. The coupling is not gone – it is checked, by a test that drives a real injury
// and reads the real rendered cell (tests/component/injury-cancelled-row.test.ts).
const withdrawnEntries = computed(() =>
  (game.snapshot?.events ?? [])
    .filter(
      (e) =>
        e.week === week.value && e.type === 'entry' && e.text.startsWith(RELEASE_LINE_PREFIX.injury),
    )
    // The entry, without the reason clause – it is already standing under the word "Cancelled".
    .map((e) => e.text.slice(RELEASE_LINE_PREFIX.injury.length).replace(INJURY_RELEASE_SUFFIX, '')),
)

// ⚠ AND THE OTHER HALF OF THE SAME ITEM: "nothing cancelled" IS NOT "nothing lost". An entry whose
// list has already closed cannot be withdrawn at all – `releaseEntry` requires `world.week <=
// deadlineWeek` – so a layoff that lands on or near the event week cancels NOTHING and she stays on
// the list: the fee is committed, she does not appear, and the week resolves as a walkover (App.vue's
// `walkover` stop reason). That is the shape the owner reported, two weeks running, and the old
// fallback answered it with "Nothing – every entry stands", which is exactly backwards. These are the
// entries the layoff swallows that are NOT coming back, read off `upcoming` (week+1 onwards, with the
// engine's own `entered` flag) rather than re-derived here.
const strandedEntries = computed(() =>
  (game.snapshot?.upcoming ?? [])
    .filter((u) => u.entered && u.week >= week.value && u.week < backWeek.value)
    .map((u) => `${u.label} – ${weekLabel(u.week)}`),
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
      <p class="season-summary-kicker">Injury – {{ weekLabel(onsetWeek) }}</p>
      <h2 class="season-summary-title">{{ retiredMatch ? 'She had to stop.' : "She's hurt." }}</h2>
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
            <th>How</th>
            <td>{{ circumstance }}</td>
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
              <!-- ROUND-20 #2: nothing was cancelled AND something was still lost. The lists had
                   closed, so she keeps her place and does not appear - which is a walkover and a
                   forfeited fee, not an entry that "stands". -->
              <template v-else-if="strandedEntries.length">
                <div>Nothing – those lists had closed.</div>
                <div v-for="(entry, i) in strandedEntries" :key="i">Forfeited: {{ entry }}</div>
              </template>
              <template v-else>Nothing – the layoff reaches no entry she holds</template>
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
