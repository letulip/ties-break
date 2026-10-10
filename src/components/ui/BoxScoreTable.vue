<script setup lang="ts">
// ⭐ THE BOX SCORE'S TABLE, ONCE – F-08's second half (27.09), and it is the last copy in a family
// that has been merged twice already. `PracticeFlow` and `TournamentFlow` had the same `<table>`
// written out character for character (jscpd pair #13: `PracticeFlow.vue:246-258` ↔
// `TournamentFlow.vue:1264-1276`); the five ROWS inside it were merged into
// `composables/matchStatTable.ts` in an earlier round, and both files already carry the note that
// says why – "a friendly and a final report the same match facts, so there is one place that decides
// what they are". The same sentence is true of the frame around them.
//
// ⚠ EVERY STRING AND EVERY CLASS IS LIFTED VERBATIM, and the rendered markup is byte-identical for
// both hosts (invariant 4: this change says nothing new on screen). The only literal text in here is
// the `#` before a rank; the labels are the rows' own and the two names are the hosts'.
//
// ⚠ THE TWO RANK GUARDS WERE SPELLED THREE WAYS AND SELECT ONE SET. TournamentFlow asked
// `kidRank !== null` and `currentOppRank != null`, PracticeFlow asked `kidRank` (truthy) and drew no
// opponent rank at all – so the friendly passes `null` there, which is what "a friendly belongs to
// neither table" already means on that screen. All three agree on every value a rank can take: a
// rank is 1-based everywhere in this app (`rankLabel` takes a separate `ranked` flag rather than
// using 0 for "unranked"), and both props are `number | null`, so neither 0 nor `undefined` is
// reachable and `!= null` is the one rule.
import type { MatchStatRow } from '../../composables/matchStatTable'
import { t } from '../../i18n'

defineProps<{
  /** her short name, as the host already short-formed it */
  kidName: string
  /** the other side's short name */
  oppName: string
  /** her rank in the table this match is played in, or null when it is played in none */
  kidRank: number | null
  /** the opponent's rank, or null – a friendly has none that means anything */
  oppRank: number | null
  /** the five rows, from `matchStatRows` – one definition, already shared */
  rows: MatchStatRow[]
}>()
</script>

<template>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>
          <span class="ph-name">{{ kidName }}</span>
          <span v-if="kidRank != null" class="ph-rank">{{ t('#{rank}', { rank: kidRank }) }}</span>
        </th>
        <th>
          <span class="ph-name">{{ oppName }}</span>
          <span v-if="oppRank != null" class="ph-rank">{{ t('#{rank}', { rank: oppRank }) }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.label">
        <th>{{ row.label }}</th>
        <td class="num">{{ row.kid }}</td>
        <td class="num">{{ row.opp }}</td>
      </tr>
    </tbody>
  </table>
</template>

<!-- ⚠ NO STYLE BLOCK, DELIBERATELY. `table`, `th`, `td`, `td.num`, `.ph-name` and `.ph-rank` are all
     GLOBAL rules in `src/style.css`, and neither host had a scoped rule that reached into this table –
     measured before the move, which is what makes it safe: a scoped rule left behind on either screen
     would have gone dead the moment the markup left it, silently and with no test to say so. -->
