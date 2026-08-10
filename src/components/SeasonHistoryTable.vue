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
import { formatCents, formatCentsSigned } from '../shared/money'
import { LADDER_LABEL, type SeasonHistoryEntry } from '../shared/protocol'
import type { LadderTrack } from '../engine/season/types'

// ⚠ IT FOLLOWS THE TABLE PICKER NOW (v46, R14 group E). The owner, twice, most recently 09.08:
// «Season by season в stats в разных вкладках всё ещё одно и то же показывает.»
//
// He was right and the screen was never the defect – the note at the foot of this table said so
// itself, back in July: Pts and W-L were "banked per season, one number each, with no record of which
// ladder they came from – so telling them apart is a schema decision rather than a copy fix". v46 is
// that schema decision. `SeasonHistoryEntry.byTrack` carries {endRank?, points, wins, losses} per
// table, so this component takes the shown track as a prop and every column under it moves.
const props = defineProps<{ track: LadderTrack }>()

// The rank column's heading. `LADDER_LABEL` is the player-facing name and stays the authority for
// prose; these are its abbreviations, and they exist because this column sits in a five-column table
// on a 375px phone (see the 375px note above). A TOTAL Record, the house rule: a fourth table cannot
// ship until somebody has decided what its column is called.
const RANK_HEAD: Record<LadderTrack, string> = {
  domestic: 'Nat. rank',
  itf: 'Int. rank',
  wta: 'Pro rank',
}

const game = useGameStore()

// Newest season first – the comparison the player came for is "this season vs last season", and
// the engine stores the list oldest-first (append-only).
const rows = computed<SeasonHistoryEntry[]>(() => [...(game.snapshot?.seasonHistory ?? [])].reverse())

/** WHAT A ROW SHOWS, and the whole of the honesty is here. THREE answers, not two – two `kind`s,
 *  because the old row answers differently depending on which tab is asking:
 *
 *   * `split` – a season banked on v46 or later. Every figure is that table's own, and a missing
 *     `endRank` means she was never ranked there (not that she placed nothing).
 *   * `legacy` under INTERNATIONAL – a season banked before v46. Its stored `endRank` IS the ITF rank
 *     (the wrap writes `world.kidRank`), so the rank column is exact; its points and W-L are the three
 *     tables added together and are marked as such.
 *   * `legacy` under NATIONAL or PROFESSIONAL – the same old season, and NO RANK: the only rank it
 *     holds belongs to another table, and «Professional rank #128» over a junior number is the class of
 *     claim that put «Rank #4» on Home against «#128» in Stats. The fold is still shown and still
 *     marked – deleting it would lose the one place a 44-19 season survives.
 *
 * Nothing here invents a per-track figure for an old season, because nothing can: `pruneResults`
 * keeps a rolling 52 weeks, so the results behind those seasons were deleted years ago. The reasoning
 * is recorded once, in the v45 -> v46 step of engine/migrations.ts; this function obeys it. */
function cellsFor(r: SeasonHistoryEntry, track: LadderTrack) {
  const split = r.byTrack?.[track]
  if (split) {
    return {
      kind: 'split' as const,
      rank: split.endRank ?? null,
      points: split.points,
      wins: split.wins,
      losses: split.losses,
    }
  }
  return {
    kind: 'legacy' as const,
    rank: track === 'itf' ? r.endRank : null,
    points: r.points,
    wins: r.wins,
    losses: r.losses,
  }
}

const cells = computed(() => rows.value.map((r) => ({ row: r, ...cellsFor(r, props.track) })))
/** One footnote, and only when a row on screen actually needs it. */
const anyLegacy = computed(() => cells.value.some((c) => c.kind === 'legacy'))
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
        <!-- D8 (docs/specs/e2e-coverage.md §12): every table on this screen answers to a NAME now, so
             `getByRole('table', { name })` reaches it. `aria-label` rather than a `<caption>` because
             the heading above already says "Season by season" on the page and a caption would print it
             twice; the name states which table's figures are inside, which is the fact a reader
             arriving by role cannot otherwise get. -->
        <table :aria-label="`Season by season, ${LADDER_LABEL[track].toLowerCase()} figures`">
          <thead>
            <tr>
              <th>Season</th>
              <!-- The rank column names its TABLE, because the figure under it changed meaning with
                   the picker above. It used to read "Int. rank" on all three tabs. -->
              <th style="white-space: nowrap">{{ RANK_HEAD[track] }}</th>
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
            <tr v-for="c in cells" :key="c.row.seasonIndex">
              <th>
                <span class="ph-name">{{ seasonYear(c.row.seasonIndex) }}</span>
                <!-- Best result of that season, in the same wording the finale card uses. Absent on
                     a season with no tournaments, and on rows the v14 migration backfilled. -->
                <span v-if="c.row.bestFinish !== undefined" class="ph-rank">{{ finishLabel(c.row.bestFinish) }}</span>
              </th>
              <!-- A DASH IS THE ANSWER "no rank in this table", and it is not a zero. Either she was
                   never ranked here (v46 omits `endRank` rather than printing the tie floor every
                   pointless player shares), or the season predates v46 and the only rank it kept
                   belongs to another table. -->
              <td class="num">{{ c.rank === null ? '–' : `#${c.rank}` }}</td>
              <td class="num">{{ c.points }}<span v-if="c.kind === 'legacy'" class="sh-fold">*</span></td>
              <td class="num" style="white-space: nowrap">
                {{ c.wins }}–{{ c.losses }}<span v-if="c.kind === 'legacy'" class="sh-fold">*</span>
              </td>
              <td class="num">
                <span class="ph-name" :class="c.row.fundsDeltaCents < 0 ? 'negative' : 'positive'">
                  {{ formatCentsSigned(c.row.fundsDeltaCents) }}
                </span>
                <span class="ph-rank">{{ formatCents(c.row.endFundsCents) }} left</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- ⚠ THE NOTE THAT USED TO STAND HERE HAS BEEN ANSWERED RATHER THAN REWORDED. It read "Points
           and W-L are the whole season, both tables together", and explained that telling them apart
           was "a schema decision rather than a copy fix". v46 took that decision, so the columns now
           follow the picker and the sentence has nothing left to excuse.

           What is left is FUNDS, which is career-wide by nature (a family has one wallet), and the
           star – shown only while a season banked before v46 is on screen. -->
      <p class="hint">
        Funds is the season's net – underneath it, what the family had left when the year ended. It is
        the family's whole year, not this table's.
      </p>
      <p v-if="anyLegacy" class="hint">
        * Seasons played before this update kept one set of figures for all three tables, so their
        points and W–L are the whole year added together and cannot be split back apart. Their rank is
        shown on the International tab, which is the table it was always measured in.
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

/* The star that marks a pre-v46 season's folded figures. Quiet on purpose – it qualifies a number,
   it is not a second number: the footnote under the table carries the meaning. */
.sh-fold {
  color: var(--muted);
  margin-left: 1px;
}

/* The last row's hairline: the sheet's `tr:last-child td { border-bottom: none }` only reaches the
   `td`s, and this table's first cell in every row is a `th` - so the bottom row was closed by a
   one-column stub of a line under the season year. Visible in the 375px capture, and it is the
   same rule finishing its own job. */
.season-history-scroll tbody tr:last-child th {
  border-bottom: none;
}
</style>
