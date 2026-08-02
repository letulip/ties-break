<script setup lang="ts">
// Round-6 – Stats tab. Standings content extracted from SeasonScreen.vue's old
// Calendar/Standings segmented control (now removed there – Season is calendar-only).
// A small header row (rank, season points) sits above the same standings table that used
// to live behind the "Standings" sub-tab; content and behavior are otherwise unchanged
// (competition ranks, gap-ellipsis rows, kid highlight, "Your rank: #N").
//
// W-L this season (round-8, the R6 debt): the engine has tracked world.seasonWins/seasonLosses
// since the season wrap-up work (v10, counted as matches resolve so pruning can't lose them);
// the Snapshot now simply surfaces both, so the header reads them directly – no event scanning.
//
// ⚠ TWO TABLES, AND THIS SCREEN NOW SAYS WHICH ONE IT IS SHOWING (30.07, fix/ranking-truth).
//
// docs/specs/two-ladders.md designed the national table and the ITF table as two currencies with no
// exchange rate between them, and then this screen kept showing ONE table, unlabelled, called
// "Standings" – the ITF one. So a girl with 604 national points and 4 international ones read a
// header saying 4 and a table she did not recognise: the owner's «Tournaments don't give points at
// all: zero in stats. Wins count alright», and the heart of «No points visualisation for
// local-regional-national is super-strange».
//
// It opens on `snapshot.activeLadder` – the ENGINE's answer to which table she is competing in
// (international once she holds a counting result there, national before that), so this screen and
// the Home card cannot disagree – and the other table stays one tap away, because "how far off the
// world am I?" is a real question even before her first international point.
//
// The switch never says "track", "domestic" or "ITF": the words are National and International,
// defined once in `LADDER_LABEL`.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../../stores/game'
import { formatShortName, rankLabel } from '../../shared/format'
import { LADDER_LABEL } from '../../shared/protocol'
import type { LadderTrack } from '../../engine/season/types'
import SegmentedRow from '../ui/SegmentedRow.vue'
// R10-9: the season-by-season history sits right under the header tiles – it is the same three
// figures (rank / points / W-L) for every season she has finished. See SeasonHistoryTable.vue.
import SeasonHistoryTable from '../SeasonHistoryTable.vue'
import CountingResultsTable from '../CountingResultsTable.vue'

const game = useGameStore()

// Which table the player is LOOKING at. Seeded from the engine's `activeLadder`, and re-seeded if
// that changes under her: the week her first international point lands, the screen should follow her
// onto the new ladder rather than leave her on the old one. Her own tap wins from then on.
const shown = ref<LadderTrack>(game.snapshot?.activeLadder ?? 'domestic')
const touched = ref(false)
watch(
  () => game.snapshot?.activeLadder,
  (next) => {
    if (next && !touched.value) shown.value = next
  },
)
const shownModel = computed<string>({
  get: () => shown.value,
  set: (v) => {
    touched.value = true
    shown.value = v as LadderTrack
  },
})

// ⚠ ALL THREE TABLES (01.08, round 15). The switch was hardcoded ['domestic', 'itf'], so her whole
// professional season - seasonRecord.wta and ladders.wta have both been on the snapshot since
// v30/v33 - was invisible on the one screen whose job is tables. A 26-1 W15 record existed nowhere
// in the UI. The tooltip map below is a TOTAL Record on purpose: a fourth LadderTrack member fails
// to compile here until somebody writes its tooltip, and the options list is derived from the map,
// so the switch can never silently trail the type again (the unit guard pins the derivation).
const LADDER_TIP: Record<LadderTrack, string> = {
  domestic: 'Local, Regional and National results. These are the points that open her next tier.',
  itf: 'Junior Tour results only. A national title is worth nothing here – the two tables never meet.',
  wta: 'W15 and up – the paid tour. Junior points never cross over.',
}
const options = computed(() =>
  (Object.keys(LADDER_TIP) as LadderTrack[]).map((t) => ({
    value: t,
    label: LADDER_LABEL[t],
    title: LADDER_TIP[t],
  })),
)

const ladder = computed(() => game.snapshot?.ladders[shown.value])
const standings = computed(() => ladder.value?.standings ?? [])
// `rank: null` IS the answer "not ranked in this table at all" – the engine decides it, so this
// screen no longer counts results to work it out for itself.
const ranked = computed(() => ladder.value?.rank !== null && ladder.value?.rank !== undefined)
const rankText = computed(() => rankLabel(ladder.value?.rank ?? 0, ranked.value))
const points = computed(() => ladder.value?.points ?? 0)
const countingResults = computed(() => ladder.value?.countingResults ?? [])
// This season's W-L, straight off the Snapshot (accumulated at finalizeTournament, reset each
// season wrap-up).
//
// ⚠ IT FOLLOWS THE SWITCH NOW (31.07, the owner: «national/international разделить победы и
// поражения, мне кажется они не должны быть общими»). It used to be the TOTAL, with a comment
// arguing "one figure for both ladders – a win is a win" – and the argument is true about a win and
// false about this screen. Every other figure here changes when the picker at the top does: the
// rank, the points, the standings table, the counting results. One tile that did not move read as a
// claim that those 24 wins were earned in the table currently on screen, which for a domestic career
// is false about all of them.
//
// Every match behind the number is a tournament match, so the split needs no new fact and no guess:
// see `Snapshot.seasonRecord`. Practice friendlies and walkovers are not in either bucket because
// they were never counted at all.
const seasonRecord = computed(() => game.snapshot?.seasonRecord[shown.value] ?? { wins: 0, losses: 0 })
const seasonWins = computed(() => seasonRecord.value.wins)
const seasonLosses = computed(() => seasonRecord.value.losses)

// The one sentence no arithmetic on this screen can imply, so it has to be said. Total maps, like
// LADDER_TIP above and for the same reason: a fourth table cannot ship without its sentences.
const NO_EXCHANGE: Record<LadderTrack, string> = {
  domestic: 'National points open her next tier. They do not count towards her international ranking.',
  itf: 'Junior Tour points only. National results do not count here.',
  wta: 'Professional points only. Junior and national results do not count here.',
}
const EMPTY_NOTE: Record<LadderTrack, string> = {
  domestic: 'No national results yet – her first Local Open will put her on this table.',
  itf: 'She has not played a Junior Tour event yet, so she has no international ranking. Her national standing is on the other tab.',
  wta: 'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.',
}
const noExchange = computed(() => NO_EXCHANGE[shown.value])
const emptyNote = computed(() => EMPTY_NOTE[shown.value])
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Stats</h2>
      <!-- WHICH TABLE. Above the tiles, because it governs every figure under it. Carries this
           screen's own class because the shared plate comes off here - see .stats-ladder-row. -->
      <SegmentedRow
        v-model="shownModel"
        class="stats-ladder-row"
        :options="options"
        group-label="Which ranking table"
      />
      <!-- R10-2: the three tiles are captions, not body copy – each label stays on ONE line
           (.stats-tile-label nowraps; the tile padding/gap were trimmed to pay for it) and
           "Season points" is now "Season pts", which is what actually fits at 375px. -->
      <div class="stats-header-row">
        <div class="stats-tile">
          <span class="stats-tile-label">{{ LADDER_LABEL[shown] }} rank</span>
          <span class="stats-tile-value">{{ rankText }}</span>
        </div>
        <div class="stats-tile">
          <span class="stats-tile-label">Points</span>
          <span class="stats-tile-value num">{{ points }}</span>
        </div>
        <!-- The label carries the ladder for the same reason the rank tile's does: three tiles that
             all change together must all say what they changed to. "W-L" alone, in a row where the
             two figures beside it are named, reads as the one figure that is about everything. -->
        <div class="stats-tile">
          <span class="stats-tile-label">{{ LADDER_LABEL[shown] }} W–L</span>
          <span class="stats-tile-value num">{{ seasonWins }}–{{ seasonLosses }}</span>
        </div>
      </div>
      <p class="hint stats-no-exchange">{{ noExchange }}</p>
    </section>

    <SeasonHistoryTable />

    <section>
      <h2>{{ LADDER_LABEL[shown] }} ranking</h2>
      <table v-if="standings.length">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in standings" :key="r.playerId">
            <tr v-if="r.gapBefore" class="standings-gap">
              <td colspan="3">…</td>
            </tr>
            <tr :class="{ 'kid-row': r.isKid }">
              <td class="num">{{ r.rank }}</td>
              <td>{{ formatShortName(r.name) }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </template>
        </tbody>
      </table>
      <p class="hint">Her rank: {{ rankText }}</p>
      <p v-if="!ranked" class="hint">{{ emptyNote }}</p>
    </section>

    <!-- WHERE THE POINTS CAME FROM. The best-6 that add up to the total above, from the SAME table:
         a rank and the results that earned it have to come from one ladder or the explanation
         contradicts the number. This is the "points visualisation" the domestic rungs never had. -->
    <section v-if="countingResults.length">
      <h2>Counting results</h2>
      <CountingResultsTable :results="countingResults" />
    </section>
  </template>
</template>

<style scoped>
/* The no-exchange-rate line sits tight under the tiles it qualifies. Local to this screen: the
   shared `.hint` spacing is tuned for standalone paragraphs, and src/style.css is off limits. */
.stats-no-exchange {
  margin-top: 8px;
}

/* ⚠ NO PLATE AROUND THIS SWITCH (owner, 02.08: «Мне не нравится круглая обводка у переключателя
   уровня турниров в stats, без нее было лучше... Давай просто кнопки оставим и всё»). The shared
   `.tab-row` plate - panel fill, hairline, pill radius, 4px inset - comes off THIS instance only:
   the control stays SegmentedRow (same contract, same pills, same lime active fill as the app's
   plainest active state), and every other caller of the plate keeps it. Scoped-over-shared wins on
   specificity ((0,2,0) with the data-v attribute vs the sheet's (0,1,0)), so no !important and no
   sheet edit. `padding: 0` lets the buttons sit flush with the heading above, which is what "just
   buttons" looks like on this page. */
.stats-ladder-row {
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
}
</style>
