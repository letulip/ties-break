<script setup lang="ts">
// R10-9 – the career's season-by-season table. Nothing used to survive a season: the engine kept
// exactly ONE recap (`lastSeasonSummary`, overwritten every wrap-up), so "how does this year
// compare to last year?" had no answer anywhere in the app. Schema v14 banks a tiny numeric row
// per finished season (SeasonHistoryEntry: year, end rank, points, W-L, funds delta, closing
// funds, best finish) and this component is the whole surface for it.
//
// It lives on STATS, not Kid: the three tiles at the top of that screen already read rank /
// season points / W-L for the CURRENT season, and this is literally those same figures for every
// season before it – the year-over-year version of the panel the player is already looking at.
// (Kid is identity: portrait, background, play style, and the best-6 that explains her rank.)
//
// Presentation only – no new persisted state: the app's plain «таблички» table plus the existing
// .ph-name/.ph-rank two-line cell pattern (MatchViewer's stats header).
//
// ⚠ U1 GAVE IT A STYLE BLOCK, for a defect and not for a redesign. `docs/specs/ui-inventory.md` §6
// records it as the first of two real bugs the 375px capture pass found: "the season-history table
// scrolls the whole document sideways at 375px (scrollWidth 426 vs a 375 viewport) and the FUNDS
// column is cut off". Reproduced before the fix at a realistic row (a "Quarterfinalist" best-finish
// label, a four-digit rank, a seven-figure balance): documentElement.scrollWidth 452 against
// clientWidth 375, with the FUNDS column's right edge 77px past the right of the screen.
//
// THE CAUSE is two things at once and the fix answers both:
//   1. FIVE COLUMNS OF 12px SIDE PADDING is 120px of the 311px this table gets inside a section on
//      a 375px phone - more than a third of the width spent on gutters. The app's default table
//      inset is right for a two-column table and wrong for a five-column one, so this table sets
//      its own (6px) rather than moving a rule eleven other tables depend on.
//   2. EVEN THEN IT CAN OVERFLOW, because "Quarterfinalist" is one unbreakable word and a career
//      can end a season a million dollars up or down. So the table gets a SCROLLER of its own.
//      Sideways scroll was never the bug - sideways scroll of the whole DOCUMENT was: it moves the
//      tab bar, the sticky button and every other screen element off-centre to read one column.
// The columns are all still there and all still reachable; what changed is who scrolls.
//
// The rules live in this component and not in `src/style.css` because the sheet is the file six
// screens being built in parallel would all touch, and because a table that knows it is five
// columns wide is exactly the kind of thing a component should own. `TierGuide.vue` has the same
// defect (ui-inventory §6, item 2) and wants the same two rules; it is a different surface with a
// different slice and is left to it - noted in the wave report.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { finishLabel } from '../engine/world'
import { seasonYear } from '../shared/dates'
import type { SeasonHistoryEntry } from '../shared/protocol'

const game = useGameStore()

// Newest season first – the comparison the player came for is "this season vs last season", and
// the engine stores the list oldest-first (append-only).
const rows = computed<SeasonHistoryEntry[]>(() => [...(game.snapshot?.seasonHistory ?? [])].reverse())

function formatSigned(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : '+'
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
function formatDollars(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
</script>

<template>
  <section>
    <h2>Season by season</h2>
    <p v-if="!rows.length" class="hint" style="margin-top: 0">
      Her first season is still running – it lands here at the year's wrap-up, and every season
      after it stacks on top.
    </p>
    <template v-else>
      <!-- THE SCROLLER. `tabindex="0"` because a region that scrolls must be reachable without a
           pointer, and `role="group"` + a name so a screen reader says what it has landed in. -->
      <div class="season-history-scroll" tabindex="0" role="group" aria-label="Season by season, scrollable">
        <table>
          <thead>
            <tr>
              <th>Season</th>
              <th>Int. rank</th>
              <th>Pts</th>
              <!-- narrow phones: "W–L" must not break across two lines (the column is the tightest) -->
              <th style="white-space: nowrap">W–L</th>
              <th>Funds</th>
            </tr>
          </thead>
          <tbody>
            <!-- Keyed on the SEASON INDEX, and the header prints the year that index derives to
                 (shared/dates seasonYear – the same function weekLabel uses, so a row and the week
                 labels inside that season always name the same year). Keying on the printed year is
                 what dropped season 5 from this table; see SeasonHistoryEntry.seasonIndex. -->
            <tr v-for="r in rows" :key="r.seasonIndex">
              <th>
                <span class="ph-name">{{ seasonYear(r.seasonIndex) }}</span>
                <!-- Best result of that season, in the same wording the finale card uses. Absent on
                     a season with no tournaments, and on rows the v14 migration backfilled. -->
                <span v-if="r.bestFinish !== undefined" class="ph-rank">{{ finishLabel(r.bestFinish) }}</span>
              </th>
              <td class="num">#{{ r.endRank }}</td>
              <td class="num">{{ r.points }}</td>
              <td class="num" style="white-space: nowrap">{{ r.wins }}–{{ r.losses }}</td>
              <td class="num">
                <span class="ph-name" :class="r.fundsDeltaCents < 0 ? 'negative' : 'positive'">
                  {{ formatSigned(r.fundsDeltaCents) }}
                </span>
                <span class="ph-rank">{{ formatDollars(r.endFundsCents) }} left</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">
        Funds is the season's net – underneath it, what the family had left when the year ended.
      </p>
    </template>
  </section>
</template>

<style scoped>
/* THE 375px FIX (docs/specs/ui-inventory.md §6, defect 1). See the note at the top of the script
   block for the measurement this answers and why the fix is two rules rather than one. */
.season-history-scroll {
  overflow-x: auto;
  /* Belt and braces: a flex/grid child can refuse to shrink below its content without this, and
     this component sits inside whatever a screen puts it in. */
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

/* ⚠ THE RING RULE IS GONE, AND NOTHING REPLACES IT HERE. It said `outline: 2px solid var(--accent)`
   with a 2px offset; src/style.css now declares `:focus-visible` once for the whole app (three files
   had brought their own and all three were 2px - the owner's "thin borders everywhere"). Unlike the
   wizard's select, this element IS the focusable one - the scroller carries the `tabindex` - so the
   global rule reaches it directly and a local copy would only be a second value waiting to drift.
   The fact that mattered is untouched: a horizontally-scrolling table stays keyboard-reachable, and
   it still gets a visible ring - just the app's. */

/* Five columns cannot afford the app's default 12px side inset - that is 120px of a 311px table.
   Scoped, so the eleven other tables in the app keep the inset that is right for them. */
.season-history-scroll th,
.season-history-scroll td {
  padding-left: 6px;
  padding-right: 6px;
}

.season-history-scroll th:first-child,
.season-history-scroll td:first-child {
  padding-left: 0;
}

.season-history-scroll th:last-child,
.season-history-scroll td:last-child {
  padding-right: 0;
}

/* The last row's hairline: the sheet's `tr:last-child td { border-bottom: none }` only reaches the
   `td`s, and this table's first cell in every row is a `th` - so the bottom row was closed by a
   one-column stub of a line under the season year. Visible in the 375px capture, and it is the
   same rule finishing its own job. */
.season-history-scroll tbody tr:last-child th {
  border-bottom: none;
}
</style>
