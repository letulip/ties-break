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
// Presentation only – no new persisted state, no CSS of its own: the app's plain «таблички»
// table plus the existing .ph-name/.ph-rank two-line cell pattern (MatchViewer's stats header).
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
      <table>
        <thead>
          <tr>
            <th>Season</th>
            <th>Rank</th>
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
      <p class="hint">
        Funds is the season's net – underneath it, what the family had left when the year ended.
      </p>
    </template>
  </section>
</template>
