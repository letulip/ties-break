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
// App.vue gates it on the injury's own `sinceWeek === week` – so the emotion here is a CONSTANT,
// not a decision, and it deliberately does not reach for the emotion composable at all (the same
// shape OnboardingWizard uses for its fixed jun-norm frame). The only thing that varies is her age
// band.
//
// R16 #18/#19 – AND IT SAYS WHEN AND WHY NOW, because the popup it used to be could only ever fire
// for the weekly roll. The gate moved onto the snapshot (App.vue `showInjuryStop`), so this dialog
// is now the surface for the RETIREMENT too – 61% of this game's injuries, and the door whose worst
// case the owner reported as a scoreline with no explanation attached to it. Two injuries that cost
// the same four weeks are not the same week, and the copy has to be able to tell them apart.
//
// ⭐⭐ R2-02 – AND IT IS A FORMATTER NOW. IT ASKS THE ENGINE A QUESTION; IT DOES NOT READ THE ENGINE'S
// PROSE. Every fact below arrives typed on `snapshot.injuryReport` (see `buildInjuryReport` in
// engine/world/snapshot.ts). This file used to recover four domain facts out of rendered English:
//
//   * the cancelled entries, by `e.text.startsWith(RELEASE_LINE_PREFIX.injury)`, then sliced and
//     `.replace`d to get the tournament's name back out of the sentence;
//   * the money, by a RAW literal `e.text.startsWith('Entry refunded')` – no shared symbol at all;
//   * the forfeited entries, off `upcoming`, which stops at UPCOMING_WEEKS – so a layoff longer
//     than the look-ahead hid its own last forfeits;
//   * (the circumstance was already read off state, and stays that way.)
//
// ⚠ AND THE FIRST OF THOSE HAD ALREADY BITTEN ONCE. The header this replaces recorded it in as many
// words: the filter read `startsWith('Withdrew from ')`, `releasedBy` split that sentence on 05.08
// so the desk's own action would stop being reported as the parent's, and the row that exists to
// say what a layoff COST went blind for a week – a 9-week absence released two Local Opens, refunded
// both fees, and the popup said "Nothing". The fix then was to import the prefix as a SYMBOL rather
// than repeat the spelling, which made a rename break the build instead of the report. It did not
// make the report stop parsing sentences, and the raw `'Entry refunded'` literal three lines below
// it never even got that much. Now the words and the facts are separate things: the engine's feed
// lines are untouched (they are the player's record and the owner's voice), and re-wording any of
// them cannot move a number on this card – `tests/component/injury-cancelled-row.test.ts` mutates
// the engine's own copy and watches the report stay right.
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
const report = computed(() => game.snapshot?.injuryReport ?? null)
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

/** She stopped ON COURT – the one distinction that changes the title as well as the sentence. */
const retired = computed(() => report.value?.kind === 'retired-match' || report.value?.kind === 'retired-friendly')

/** One sentence naming the MOMENT, spelled from the report's `kind`. The engine distinguishes two
 *  doors (`InjuryCause = 'week' | 'retirement'`) and one flag on the match row (a friendly), and
 *  that is exactly the three shapes below – no taxonomy is invented here.
 *
 *  ⚠ 'off-court' IS VAGUE ON PURPOSE, AND NOT LAZINESS. The weekly roll can land on a training week,
 *  a travel week, an arrival week or a family holiday (`injuryVacationFactor` is nonzero – holidays
 *  do sprain ankles), and the engine records which of those it was NOWHERE. "She felt it in
 *  training" would be a sentence this dialog cannot support, on the same honesty rule the commentary
 *  and the diary are held to: say only what the model knows. */
const circumstance = computed(() => {
  const r = report.value
  if (!r || r.kind === 'off-court') return 'Off court – it came on between matches.'
  const against = r.oppName ? ` against ${r.oppName}` : ''
  if (r.kind === 'retired-friendly') return `On court – she had to stop during a practice match${against}.`
  // The round is a fact the draw sheet carries, so it is said when there is one.
  const where = r.stage ? ` in the ${r.stage}` : ''
  return `On court – she had to stop mid-match${against}${where}. The round she had reached is hers.`
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

/** One row of the Cancelled cell: the tournament, and the week it was in. The DTO carries the week
 *  as a NUMBER and this is the only place it becomes words – the engine's own release line spells
 *  the same pair, and the two agreeing is now a property of `weekLabel`, not of a shared prefix. */
function entryLine(row: { label: string; week: number }): string {
  return `${row.label} – ${weekLabel(row.week)}`
}

// F45-2: `rollInjury` no longer cancels every open entry – only the ones the LAYOFF SWALLOWS, so
// this list is usually short and is often empty (entry lists close two weeks out, so a 1-2 week
// absence reaches nothing at all). The copy has to say that plainly: the row is about what was
// CANCELLED, and it must never read as "your season is gone".
const cancelled = computed(() => report.value?.cancelled ?? [])
// ⚠ AND THE OTHER HALF OF ROUND-20 #2: "nothing cancelled" IS NOT "nothing lost". An entry whose
// list has already closed cannot be withdrawn at all – `releaseEntry` requires `world.week <=
// deadlineWeek` – so a layoff that lands on or near the event week cancels NOTHING and she stays on
// the list: the fee is committed, she does not appear, and the week resolves as a walkover. That is
// the shape the owner reported, two weeks running, and the old fallback answered it with
// "Nothing – every entry stands", which is exactly backwards. (⚠ THAT PHRASE IS PINNED – round-11
// followups reads this file for it, so keep it on one line.)
const stranded = computed(() => report.value?.stranded ?? [])
const refundCents = computed(() => report.value?.refundCents ?? 0)

// The dialog only ever mounts off a real click ("Next week"), so the audio gate is open.
onMounted(() => playSfx('ooh'))
</script>

<template>
  <div v-if="injury" class="dialog-overlay" @click.self="$emit('continue')">
    <div class="dialog-card season-summary injury-stop">
      <img class="injury-stop-art" :src="artUrl" :style="artStyle" alt="" />
      <p class="season-summary-kicker">Injury – {{ weekLabel(onsetWeek) }}</p>
      <h2 class="season-summary-title">{{ retired ? 'She had to stop.' : "She's hurt." }}</h2>
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
              <template v-if="cancelled.length">
                <div v-for="row in cancelled" :key="row.id">Withdrawn: {{ entryLine(row) }}</div>
                <div v-if="refundCents > 0" class="positive num">Fees refunded: +{{ formatCents(refundCents) }}</div>
              </template>
              <!-- ROUND-20 #2: nothing was cancelled AND something was still lost. The lists had
                   closed, so she keeps her place and does not appear - which is a walkover and a
                   forfeited fee, not an entry that "stands". -->
              <template v-else-if="stranded.length">
                <div>Nothing – those lists had closed.</div>
                <div v-for="row in stranded" :key="row.id">Forfeited: {{ entryLine(row) }}</div>
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
