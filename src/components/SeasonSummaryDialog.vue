<script setup lang="ts">
// Round-7 item 4 – the end-of-season summary popup. Auto-shown on Home when a fresh snapshot
// arrives whose stop reasons include 'season-end' (App.vue owns that trigger, the client-side
// dismiss, and the R11-1 rule that an injury on the same week gets its dialog first);
// reads the structured `lastSeasonSummary` the engine banked at wrap-up time.
//
// U2 – THE OWNER'S RULING (docs/specs/ui-inventory.md §2): tidy it "along the lines of the new
// Weekly Story – они тождественны примерно". They are: this is screen D at season scale. A week
// closes with a painting, four lime-headed cards and a handwritten scrap; a season closes with the
// same cards and the same scrap, because it is the same act – the game stopping to tell the parent
// what just happened before time moves on again.
//
// SO THE TABLE IS GONE, and that is the whole change. The figures were a `<table>` of nine
// label/value rows – "«Таблички» style", as the original note here called it, which was true of the
// app before the redesign and is not true of it now. They are the same nine figures, in the same
// order, grouped into the three things a parent actually asks at the end of a year: where did she
// finish, how did she play, what did it cost. Nothing was added, nothing was dropped, and every row
// that was conditional is still conditional.
//
// WHAT IT DELIBERATELY DOES NOT TAKE FROM D: the painting. A week has one and a season does not –
// there is no season art in the handoff's Assets table and inventing one here would be a redesign,
// not a tidy. The kicker also stays MUTED rather than becoming the lime eyebrow: `src/style.css`
// and `ui/Eyebrow.vue` both say `.season-summary-kicker` is the app's muted label, a different
// object, and recolouring it is the owner's call and he has not made it.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCentsSigned } from '../shared/money'
import { LADDER_LABEL } from '../shared/protocol'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import PaperNote from './ui/PaperNote.vue'
import PrimaryPill from './ui/PrimaryPill.vue'

defineEmits<{ continue: [] }>()

const game = useGameStore()
const summary = computed(() => game.snapshot?.lastSeasonSummary ?? null)

/** W4-SCHOOL: the closing scrap, minus the thing she no longer has. It is the same sentence the
 *  engine writes into the feed on the same week (`world/milestones.ts`), read off the same fact -
 *  `schoolEndsWeek` - so the dialog and the ledger cannot disagree about whether she is at school. */
const closingScrap = computed(() => {
  const snap = game.snapshot
  const over = snap !== null && snap.week >= snap.schoolEndsWeek
  return over
    ? 'Off-season now: rest, family time, and the block where next year gets built.'
    : 'Off-season now: rest, school, family time.'
})


// R11-12a: the owner read the single net-delta line as the season's SPEND and compared it against
// the wallet's "This season" total, which is gross spend – two right numbers that look like one
// wrong one. Spend and income now have their own rows (the same financeWindow fold the Money screen
// reads, over the same window), and the net keeps the bottom line. `undefined` on a summary banked
// before R11-12a, in which case only the net row shows, exactly as before.
const spentCents = computed(() => summary.value?.spentCents)
const earnedCents = computed(() => summary.value?.earnedCents)

// ⚠⚠ WHICH TABLE THIS SEASON WAS PLAYED ON (fix/wallet-and-wrapup, 05.08). The owner, at
// twenty-one, on the W tour: «итоговый рейтинг сломался... и на том же экране всегда показывается
// international, хотя мы уже давно там не играем. Это тоже надо как-то динамично делать в
// зависимости от текущего уровня турнира, ну или доминирующего в этом году.» This card printed
// "Final international rank – Unranked · She has not played a Junior Tour event yet" at a
// professional whose junior rank was #74 and whose world rank was #288.
//
// The engine decides, at the wrap, off the season's own per-track match record
// (`dominantTrackOfSeason`) – so the milestone line in the news and this card can never name two
// different tables for one season. Both fields are optional: a summary banked before this wave
// falls back to exactly what this file did before, the junior table read off the live snapshot.
const rankTrack = computed(() => summary.value?.rankTrack ?? 'itf')
const rankLabel = computed(() => LADDER_LABEL[rankTrack.value].toLowerCase())
const rankInTrack = computed(() => {
  const s = summary.value
  if (!s) return null
  // The legacy path, unchanged and still correct for the season it was written for: `endRank` is the
  // ITF number and the live snapshot says whether she holds an international point at all.
  if (s.rankTrack === undefined) return game.snapshot?.ladders.itf.rank !== null ? s.endRank : null
  return s.rankInTrack ?? null
})
const ranked = computed(() => rankInTrack.value !== null)

// Rank move over the season (rank improves when the number goes DOWN).
//
// ⚠ ITF ONLY, and it is the engine's limit rather than this card's taste: `startRank` is the v17
// capture of `world.kidRank`, i.e. the JUNIOR table, and it cannot be back-filled for any other one
// (see the note in engine/world/milestones.ts). Subtracting a junior start rank from a professional
// finish rank is the cross-currency subtraction `LadderView.prevRank` exists to forbid, so on any
// other track the card reports where she finished and shows no arrow.
const rankMove = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const s = summary.value
  const end = rankInTrack.value
  if (!s || rankTrack.value !== 'itf' || end === null) return { dir: 'flat', by: 0 }
  if (s.startRank === null || s.startRank === end) return { dir: 'flat', by: 0 }
  return s.startRank > end ? { dir: 'up', by: s.startRank - end } : { dir: 'down', by: end - s.startRank }
})
const showRankMove = computed(() => ranked.value && rankTrack.value === 'itf')
</script>

<template>
  <div v-if="summary" class="dialog-overlay" @click.self="$emit('continue')">
    <div class="dialog-card season-summary">
      <p class="season-summary-kicker">Season {{ summary.seasonYear }} · wrap-up</p>
      <h2 class="season-summary-title">That's a season.</h2>

      <div class="season-grid">
        <!-- WHERE SHE FINISHED -->
        <Card class="season-tile" pad="12px 13px">
          <Eyebrow>Ranking</Eyebrow>
          <div class="season-rows">
            <div class="season-row">
              <span class="season-key">Final {{ rankLabel }} rank</span>
              <span class="season-val">
                <span class="rank-value">{{ ranked ? '#' + rankInTrack : 'Unranked' }}</span>
                <template v-if="showRankMove">
                  <span v-if="rankMove.dir === 'up'" class="rank-move up">&uarr;{{ rankMove.by }}</span>
                  <span v-else-if="rankMove.dir === 'down'" class="rank-move down">&darr;{{ rankMove.by }}</span>
                  <span v-else class="rank-move flat">–</span>
                </template>
              </span>
            </div>
            <p v-if="showRankMove && summary.startRank !== null" class="hint season-summary-from">from #{{ summary.startRank }}</p>
            <!-- The junior table keeps its own sentence: "not ranked yet" means something specific
                 and encouraging for a girl who has not left the country. Every other table gets the
                 plain statement, because "she has not played a Junior Tour event" is nonsense said
                 to a professional - which is exactly the bug this replaced. -->
            <p v-else-if="!ranked && rankTrack === 'itf'" class="hint season-summary-from">
              She has not played a Junior Tour event yet. Her national standing is on the Stats tab.
            </p>
            <p v-else-if="!ranked" class="hint season-summary-from">
              No result counted on that table this season. Her other standings are on the Stats tab.
            </p>
            <div class="season-row">
              <span class="season-key">Season points</span>
              <span class="season-val num">{{ summary.points }}</span>
            </div>
          </div>
        </Card>

        <!-- HOW SHE PLAYED -->
        <Card class="season-tile" pad="12px 13px">
          <Eyebrow>Matches</Eyebrow>
          <div class="season-rows">
            <div class="season-row">
              <span class="season-key">Record</span>
              <span class="season-val num">{{ summary.wins }}–{{ summary.losses }}</span>
            </div>
            <div class="season-row">
              <span class="season-key">Best result</span>
              <span class="season-val">{{ summary.bestResultText }}</span>
            </div>
            <div class="season-row">
              <span class="season-key">Lost to injury</span>
              <!-- weeksInjured is optional (pre-slice-C summaries never stored it): default 0 -->
              <span class="season-val num">{{ summary.weeksInjured ?? 0 }} wk</span>
            </div>
          </div>
        </Card>

        <!-- WHAT IT COST -->
        <Card class="season-tile season-tile-wide" pad="12px 13px">
          <Eyebrow>Money</Eyebrow>
          <div class="season-rows">
            <div v-if="spentCents !== undefined" class="season-row">
              <span class="season-key">Spent this season</span>
              <span class="season-val num negative">{{ formatCentsSigned(-spentCents) }}</span>
            </div>
            <div v-if="earnedCents !== undefined" class="season-row">
              <span class="season-key">Earned this season</span>
              <span class="season-val num positive">{{ formatCentsSigned(earnedCents) }}</span>
            </div>
            <!-- v21: the scholarship never shows up in "Earned" – its travel half is a discount on
                 the travel line, not income – so this is the only place the year's help is a number.
                 Hidden at zero: a family nobody backed should not read a row of dashes. -->
            <div v-if="(summary.academyCoveredCents ?? 0) > 0" class="season-row">
              <span class="season-key">Academy covered</span>
              <span class="season-val num positive">{{ formatCentsSigned(summary.academyCoveredCents ?? 0) }}</span>
            </div>
          </div>
          <span class="season-hairline"></span>
          <div class="season-row">
            <span class="season-key">Funds this season</span>
            <span
              class="season-net num"
              :class="{ negative: summary.fundsDeltaCents < 0, positive: summary.fundsDeltaCents >= 0 }"
            >{{ formatCentsSigned(summary.fundsDeltaCents) }}</span>
          </div>
        </Card>
      </div>

      <!-- D's closing scrap. It was already the most human line in this dialog and it was set as a
           grey hint; on paper it reads as what it is – the parent's own note about the year. -->
      <!-- W4-SCHOOL: past her last school year the list is one item shorter, and the engine's own
           off-season note (world/milestones.ts) says the same thing in the same week. -->
      <PaperNote class="season-note" :tilt="-0.5" ruled torn tape>
        {{ closingScrap }}
      </PaperNote>

      <div class="dialog-actions">
        <PrimaryPill @click="$emit('continue')">Continue</PrimaryPill>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Two short cards side by side and the money card under them, full width. D's grid is 2x2 because a
   week has four equal things to say; a season has three, and the one with the most rows in it is
   the one the parent came to read. */
.season-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.season-tile {
  display: flex;
  flex-direction: column;
}

.season-tile-wide {
  grid-column: 1 / -1;
}

.season-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 11px;
}

/* The rows WRAP. A dialog is 360px wide and "Best result / Quarterfinalist" does not fit on one
   line of a half-width card - so the value drops under its label instead of the card scrolling
   sideways, which is the defect the capture pass found twice elsewhere (ui-inventory §6). */
.season-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px 8px;
}

.season-key {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
}

.season-val {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.season-summary-from {
  margin: -4px 0 0;
  font-size: 12px;
}

.season-hairline {
  height: 1px;
  margin: 10px 0;
  background: var(--line);
}

.season-net {
  font-size: 16px;
  font-weight: 800;
}

/* ⚠ THE TYPE IS SET ON THE SHEET, NOT ON THE COMPONENT, since PaperNote's root became a wrapper so
   its tape could survive `torn`'s clip-path. `.tb-paper` declares its own `font-size` (17px), which
   beats a larger one inherited from an ancestor - so this closing line would have quietly dropped
   two points had it stayed where it was. Everything that positions the scrap on the page is still
   the wrapper's. This note is `torn tape` and was the second victim of the same bug. */
.season-note {
  display: block;
  margin: 0 0 16px;
}

.season-note :deep(.tb-paper) {
  font-size: 19px;
  text-align: center;
}
</style>
