<script setup lang="ts">
// Round-6 – Stats tab. Standings content extracted from SeasonScreen.vue's old
// Calendar/Standings segmented control (now removed there – Season is calendar-only).
// A small header row (rank, season points) sits above the same standings table that used
// to live behind the "Standings" sub-tab; content and behavior are otherwise unchanged
// (competition ranks, gap-ellipsis rows, kid highlight, "Your rank: #N").
//
// W-L this season was asked for too but is deliberately left out: it isn't already on the
// Snapshot, and the only client-side approximation (scanning `events`) is unreliable –
// `events` is capped to the most recent 60 and gets pruned, so a mid/late-season count
// would silently undercount without extending the engine, which this item explicitly
// says not to do.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import { formatShortName, rankLabel } from '../../shared/format'

const game = useGameStore()

const standings = computed(() => game.snapshot?.standings ?? [])
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)
const kidPoints = computed(() => game.snapshot?.standings.find((r) => r.isKid)?.points ?? 0)
// 'Unranked' until she's earned a counting result (a point-less kid isn't really ranked; her
// dense position only floats to the top because everyone ties at 0).
const ranked = computed(() => (game.snapshot?.countingResults.length ?? 0) > 0)
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>Stats</h2>
      <div class="stats-header-row">
        <div class="stats-tile">
          <span class="hint">Rank</span>
          <span class="stats-tile-value">{{ rankLabel(kidRank, ranked) }}</span>
        </div>
        <div class="stats-tile">
          <span class="hint">Season points</span>
          <span class="stats-tile-value num">{{ kidPoints }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2>Standings</h2>
      <table>
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
      <p class="hint">Your rank: {{ rankLabel(kidRank, ranked) }}</p>
    </section>
  </template>
</template>
