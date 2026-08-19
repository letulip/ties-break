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
import { TIERS, TIER_SHORT } from '../../engine/season/calendar'
import { BEST_N_BY_TRACK, RANKABLE_MIN } from '../../engine/season/ranking'
import { finishPhrase } from '../../composables/tierState'
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

// --- THE ARCHIVE (W2-LADDER §4: «закрепить, не мозолить») ----------------------------------------
// Once she has aged out of the junior tour (the J rungs are U18 - TIERS.j30.maxAgeYears, the
// engine's own rule, not a screen's guess), the International tab stops being a live table she can
// no longer move and FREEZES to her final standing: the career is pinned, not erased. The peak is
// the best YEAR-END rank in `seasonHistory` (endRank has always been the ITF fold - world.ts's
// wrap-up writes `world.kidRank`), which is the honest number a closed career keeps; the live
// window under it is still emptying week by week, and watching it drain is exactly the «мозолить»
// the owner asked to stop. Domestic never archives (she keeps that ladder for life, ruling 2) and
// the professional tab is where her live career now is.
const J_MAX_AGE = TIERS.j30.maxAgeYears!
const itfClosed = computed(() => (game.snapshot?.ageYears ?? 0) > J_MAX_AGE)
const archiveShown = computed(() => shown.value === 'itf' && itfClosed.value)
const jPeak = computed<number | null>(() => {
  const ranks = (game.snapshot?.seasonHistory ?? []).map((h) => h.endRank).filter((r) => r > 0)
  return ranks.length ? Math.min(...ranks) : null
})
// `rank: null` IS the answer "not ranked in this table at all" – the engine decides it, so this
// screen no longer counts results to work it out for itself.
const ranked = computed(() => ladder.value?.rank !== null && ladder.value?.rank !== undefined)
const rankText = computed(() => rankLabel(ladder.value?.rank ?? 0, ranked.value))
const points = computed(() => ladder.value?.points ?? 0)
const countingResults = computed(() => ladder.value?.countingResults ?? [])

// ⚠ WHY THE TABLE SAYS 0 WHILE THE RESULTS UNDER IT SAY 6 (round-16 #3, and the owner filed it as a
// cache refreshing one event late). It is the WTA's own eligibility minimum, and the engine has been
// applying it correctly since points-by-the-book: a professional appears on the rankings only once
// she has scored in three tournaments or banked ten points. Until then her total reads zero - beside
// a counting-results list showing every row she has won, which is what makes it read as a bug.
//
// `LadderView.banked` is the engine's own number for what is being withheld (absent unless it IS
// being withheld, on any table); the thresholds are read from `RANKABLE_MIN` so this screen and the
// tournament summary's own sentence (`rankingDeltaSuffix`) quote one rule. Nothing is re-derived
// here: if the engine ever stops withholding, the field goes and the line goes with it.
const banked = computed(() => ladder.value?.banked ?? null)
const bankedNote = computed(() =>
  banked.value === null
    ? null
    : `${banked.value} pts banked. A ${LADDER_LABEL[shown.value].toLowerCase()} ranking needs ` +
      `${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points} points – ` +
      `until then the table shows nothing, and every result below still counts towards it.`,
)

// --- THE WINDOW BLOCK (W2-LADDER §3: the owner's «очковое окно возможностей», made visible) ------
// Three facts the rolling window has always had and never said: how full it is against the shown
// table's own width (six, or eighteen on the professional table), the weakest counted value (the
// bar a new result must clear once the window is full), and the NEXT DROP - the oldest counted
// result, what it was, and the week the 52-week window lets it go. All derived from the counting
// list the table below already shows, so the block and the table cannot disagree.
const windowInfo = computed(() => {
  const list = countingResults.value
  const snap = game.snapshot
  if (!list.length || !snap) return null
  const cap = BEST_N_BY_TRACK[shown.value]
  const weakest = Math.min(...list.map((r) => r.points))
  const oldest = list.reduce((a, b) => (b.week < a.week ? b : a))
  // windowedBestSum keeps a result while `week - r.week <= 52`, so it drops AT r.week + 53.
  const dropInWeeks = oldest.week + 53 - snap.week
  const finish = oldest.tier ? TIERS[oldest.tier].points.indexOf(oldest.points) : -1
  const what =
    oldest.tier && finish >= 0
      ? `${TIER_SHORT[oldest.tier]} ${finishPhrase(finish, TIERS[oldest.tier].drawSize)}`
      : 'Oldest result'
  return { cap, counted: list.length, full: list.length >= cap, weakest, what, dropPts: oldest.points, dropInWeeks }
})
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
// AGE_COLUMN – the owner, item 12 of 06.08 and again 09.08: «я просил возраста девочек добавить в
// stats доп колонкой и в турнирах перед матчем тоже можно показывать».
//
// The column is in the standings table below, and the pre-match half is in TournamentFlow.vue. There
// is nothing to compute here: `StandingRow.ageYears` arrives on the snapshot already resolved, which
// is deliberate – it is HER OWN age on both sides of the row (`kidAgeAt` for the kid, the rival's own
// `ageYears` for everybody else) and neither is a band. A screen deriving an age from a week and a
// birth month would be a second clock, which is the thing the 09.08 ruling exists to prevent.
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
        appearance="bare"
        class="stats-ladder-row"
        :options="options"
        group-label="Which ranking table"
      />
      <!-- THE ARCHIVE PLATE (W2-LADDER): a closed junior career is a fact to keep, not a table to
           watch drain. It replaces the live tiles on this tab only - the rule and the peak, and
           nothing that still moves. -->
      <div v-if="archiveShown" class="stats-archive">
        <p class="stats-archive-title">Junior career – closed at {{ J_MAX_AGE + 1 }}</p>
        <p v-if="jPeak !== null" class="stats-archive-peak">Peaked #{{ jPeak }} at year-end</p>
        <p class="hint stats-archive-note">
          The Junior Tour is under-{{ J_MAX_AGE + 1 }}, so this table is hers for good – it cannot
          move again. Her live career is on the Pro tab.
        </p>
      </div>
      <!-- R10-2: the three tiles are captions, not body copy – each label stays on ONE line
           (.stats-tile-label nowraps; the tile padding/gap were trimmed to pay for it) and
           "Season points" is now "Season pts", which is what actually fits at 375px. -->
      <div v-if="!archiveShown" class="stats-header-row">
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
      <!-- ⚠ THE ZERO THAT IS NOT A BUG (round-16 #3). Drawn only while the engine is actually
           withholding her total - `LadderView.banked` is absent otherwise - and placed directly
           under the tiles, because the tile it explains is the one reading 0. -->
      <p v-if="!archiveShown && bankedNote" class="hint stats-banked">{{ bankedNote }}</p>
      <p v-if="!archiveShown" class="hint stats-no-exchange">{{ noExchange }}</p>
    </section>

    <!-- ⚠ IT TAKES THE TRACK NOW (v46). The owner reported twice that this table showed the same
         thing under every tab, and it did, because a `SeasonHistoryEntry` held one rank and three
         folds - see SeasonHistoryTable.vue and the v45 -> v46 migration for what an old row may say. -->
    <SeasonHistoryTable :track="shown" />

    <section v-if="!archiveShown">
      <h2>{{ LADDER_LABEL[shown] }} ranking</h2>
      <!-- D8: the table answers to a name (docs/specs/e2e-coverage.md §12). It says WHICH table,
           because all three render through this one element and a reader arriving by role has no
           other way to tell which one she landed in. -->
      <table v-if="standings.length" :aria-label="`${LADDER_LABEL[shown]} ranking`">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <!-- THE AGE COLUMN - the owner's own ask, twice; his words are quoted at AGE_COLUMN in
                 the script block, where the house convention allows the original. -->
            <th>Age</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in standings" :key="r.playerId">
            <tr v-if="r.gapBefore" class="standings-gap">
              <td colspan="4">…</td>
            </tr>
            <tr :class="{ 'kid-row': r.isKid }">
              <td class="num">{{ r.rank }}</td>
              <td>{{ formatShortName(r.name) }}</td>
              <!-- Her OWN age, whole years - never the band; see StandingRow.ageYears. A dash rather
                   than a zero for a row with nobody behind it: a missing age is not an age of none. -->
              <td class="num">{{ r.ageYears === undefined ? '–' : r.ageYears }}</td>
              <td class="num">{{ r.points }}</td>
            </tr>
          </template>
        </tbody>
      </table>
      <p class="hint">Her rank: {{ rankText }}</p>
      <p v-if="!ranked" class="hint">{{ emptyNote }}</p>
    </section>

    <!-- WHERE THE POINTS CAME FROM. The best-N that add up to the total above, from the SAME table:
         a rank and the results that earned it have to come from one ladder or the explanation
         contradicts the number. This is the "points visualisation" the domestic rungs never had. -->
    <section v-if="!archiveShown && countingResults.length">
      <h2>Counting results</h2>
      <!-- THE WINDOW, said out loud (W2-LADDER §3). One line for where the window stands, one for
           what it is about to let go - the points window of opportunity the owner asked to see
           (his phrase is quoted at `windowInfo` in the script, where the house convention allows
           the original). -->
      <template v-if="windowInfo">
        <p class="hint stats-window-line">
          Counting {{ windowInfo.counted }} of a best-{{ windowInfo.cap }} window.
          <template v-if="windowInfo.full">
            Weakest counted: {{ windowInfo.weakest }} pts – a new result must beat it to raise the total.
          </template>
          <template v-else>The window has room – any scoring result counts in full.</template>
        </p>
        <p class="hint stats-window-drop">
          Next drop: {{ windowInfo.what }}, {{ windowInfo.dropPts }} pts – leaves the window in
          {{ windowInfo.dropInWeeks }} {{ windowInfo.dropInWeeks === 1 ? 'week' : 'weeks' }}.
        </p>
      </template>
      <!-- D8 again: it says WHICH table's results, because the list changes with the picker above and
           a reader arriving by role has no other way to tell which one she is in. -->
      <CountingResultsTable :results="countingResults" :label="`${LADDER_LABEL[shown]} counting results`" />
    </section>
  </template>
</template>

<style scoped>
/* The no-exchange-rate line sits tight under the tiles it qualifies. Local to this screen: the
   shared `.hint` spacing is tuned for standalone paragraphs, and src/style.css is off limits. */
.stats-no-exchange {
  margin-top: 8px;
}

/* The banked line sits between the tiles and the no-exchange note, so the 8px above belongs to
   whichever of the two is first on screen. It is the same quiet `.hint` register: it explains a
   figure, it is not a second figure. */
.stats-banked {
  margin-top: 8px;
}

.stats-banked + .stats-no-exchange {
  margin-top: 4px;
}

/* THE ARCHIVE PLATE (W2-LADDER §4): quiet, final, one card - the visual register of a record
   rather than a readout. Local to this screen; no new design language.
   ⚠ ITS `margin-top: 10px` MOVED TO `.stats-ladder-row` (04.08) - it is not gone, it is now owned by
   the switcher so all three tracks get it. See the note down there for the bug it was causing. */
.stats-archive {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-archive-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.stats-archive-peak {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.stats-archive-note {
  margin: 2px 0 0;
}

/* ⚠ THE PLATE RULING MOVED TO THE CONTROL (DRY-8, 19.08). The owner's 02.08 «Давай просто кнопки
   оставим и всё» is now `SegmentedRow`'s `appearance="bare"` and lives once in `src/style.css` -
   this screen, Money and More had each copied the same four declarations with the same specificity
   note. What stays here is the ONLY thing that is this page's: the gap under the switcher.

   ⚠ AND THE GAP UNDER IT IS THIS RULE'S JOB (owner, 04.08: «На вкладке stats при переключении
   international имеет небольшой отступ снизу, а national и professional нет – надо тоже добавить»).

   WHAT HE WAS SEEING, and it is a real inconsistency rather than a preference. Only ONE arm of this
   screen carried any separation from the pills, and it carried it privately: the ITF archive plate
   declared `margin-top: 10px` on itself, and the archive only ever renders on the International tab
   (`archiveShown` = itf AND aged out of the junior tour). `.stats-header-row` - the three tiles that
   stand in its place on National and Professional - declares no top margin at all, so on those two
   tabs the tiles butt straight against the buttons. Switching tracks therefore MOVED the content by
   10px, which is exactly the kind of jump the plate ruling above was meant to stop.

   THE FIX IS TO MOVE THE DECLARATION, NOT TO COPY IT. `margin-bottom` on the switcher spaces it from
   WHATEVER follows - the tiles, the archive, or whatever a fourth arm one day puts there - so the
   three tabs cannot drift apart again by somebody adding a block and forgetting the number. Copying
   `margin-top: 10px` onto `.stats-header-row` would have fixed today's three arms and left the trap
   armed for the fourth. The archive's own copy is deleted at `.stats-archive` above, with a pointer
   here, so the 10px is stated exactly once. */
.stats-ladder-row {
  margin-bottom: 10px;
}
</style>
