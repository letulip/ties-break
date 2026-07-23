<script setup lang="ts">
// Package N – Season tab: the real yearly calendar (Package L/M). Next-8-weeks
// event cards with Enter/Withdraw behind ConfirmDialog, "My entries", a
// standings card, and – when the latest resolved week is a tournament week –
// a bracket card with a Watch -> MatchReplay link per kid match.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import ConfirmDialog from '../ConfirmDialog.vue'
import MatchReplay from '../MatchReplay.vue'
import MatchViewer from '../MatchViewer.vue'
import { simulateMatch } from '../../engine/match/engine'
import { annotateMatch } from '../../engine/match/rally'
import { kidMatchPlayer } from '../../engine/world'
import { formatShortName } from '../../shared/format'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { AnnotatedMatch } from '../../viz/types'
import type { UpcomingEvent, WorldEvent, WorldMatch } from '../../shared/protocol'

const game = useGameStore()

function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

const SURFACE_EMOJI: Record<string, string> = { hard: '🔵', clay: '🟠', grass: '🟢' }

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const upcoming = computed(() => game.snapshot?.upcoming ?? [])
const myEntries = computed(() => upcoming.value.filter((e) => e.entered))

// A passed deadline swaps the Enter button for a muted "Entries closed" pill (round-5
// item 2); an open event only ever disables Enter for insufficient funds.
function entriesClosed(e: UpcomingEvent): boolean {
  return week.value > e.deadlineWeek
}
function fundsShort(e: UpcomingEvent): boolean {
  return fundsCents.value < e.entryFeeCents
}

// --- one shared confirm-popup slot (mirrors MoreScreen's pattern) ------------
interface PendingConfirm {
  message: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
}
const pendingConfirm = ref<PendingConfirm | null>(null)

function askEnter(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message: `Enter ${e.label} (W${e.week}, ${e.surface})? Entry fee ${formatDollars(e.entryFeeCents)}.`,
    confirmLabel: 'Enter',
    onConfirm: () => game.enterEvent(e.id),
  }
}
function askWithdraw(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message: `Withdraw from ${e.label} (W${e.week})? Entry fee ${formatDollars(e.entryFeeCents)} will be refunded.`,
    confirmLabel: 'Withdraw',
    onConfirm: () => game.withdrawEvent(e.id),
  }
}
function runConfirm(): void {
  const action = pendingConfirm.value
  pendingConfirm.value = null
  action?.onConfirm()
}

// --- standings -----------------------------------------------------------------
const standings = computed(() => game.snapshot?.standings ?? [])
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)

// --- this week's tournament: only kid matches are ever recorded as `match`
// events, so the list below IS the kid's path – nothing else to highlight
// against. Rank-movement arrows would need last week's rank, which the
// Snapshot doesn't carry, so they're left out (see report: spec conflict). ---
const thisWeekMatches = computed<WorldEvent[]>(
  () => game.snapshot?.events.filter((e) => e.type === 'match' && e.week === week.value) ?? [],
)
const thisWeekSummary = computed<WorldEvent | null>(
  () => game.snapshot?.events.find((e) => e.type === 'tournament' && e.week === week.value) ?? null,
)

// --- replay overlay --------------------------------------------------------------
const replayMatch = ref<WorldMatch | null>(null)
function watchMatch(e: WorldEvent): void {
  if (e.match) replayMatch.value = e.match
}

// --- Friendly match (Package J, restored per architect ruling: owner-approved –
// sparring now, a training tool in Phase 4). Player A is the kid's ACTUAL current
// build, reconstructed the same deterministic way the worker does (kidMatchPlayer,
// exported from engine/world.ts); the opponent stays the fixed "Top seed" block. --
const exhibitionSurface: Surface = 'clay'
const kidName = computed(() => game.snapshot?.profile.kidName ?? 'Vera')
const exhibitionPlayerA = computed<MatchPlayer>(() =>
  game.snapshot
    ? kidMatchPlayer(game.snapshot)
    : { id: 'kid', name: kidName.value, serve: 50, ret: 50, composure: 50, stamina: 50 },
)
const exhibitionPlayerB: MatchPlayer = { id: 'top-seed', name: 'Top seed', serve: 63, ret: 60, composure: 70, stamina: 65 }
const exhibitionSeed = ref('')
const exhibitionMatch = ref<AnnotatedMatch | null>(null)

function playExhibition(): void {
  const seed = exhibitionSeed.value.trim() || `exhibition-${Date.now().toString(36)}`
  const opts: MatchOptions = { surface: exhibitionSurface, tour: 'wta', seed }
  const result = simulateMatch(exhibitionPlayerA.value, exhibitionPlayerB, opts)
  exhibitionMatch.value = annotateMatch(result, exhibitionPlayerA.value, exhibitionPlayerB, opts)
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <section v-if="thisWeekMatches.length">
      <h2>This week's tournament</h2>
      <p v-if="thisWeekSummary" class="tournament-summary">{{ thisWeekSummary.text }}</p>
      <ol class="bracket-list">
        <li v-for="m in thisWeekMatches" :key="m.id" class="bracket-row">
          <span>{{ m.text }}</span>
          <button v-if="m.match" class="link" @click="watchMatch(m)">Watch ▶</button>
        </li>
      </ol>
    </section>

    <section v-if="myEntries.length">
      <h2>My entries</h2>
      <div class="entries-strip">
        <span v-for="e in myEntries" :key="e.id" class="pill ok">{{ e.label }} · W{{ e.week }}</span>
      </div>
    </section>

    <section>
      <h2>Calendar – next 8 weeks</h2>
      <div class="event-cards">
        <div v-for="e in upcoming" :key="e.id" class="event-card">
          <div class="event-card-top">
            <span class="event-tier">{{ e.label }}</span>
            <span class="pill">{{ SURFACE_EMOJI[e.surface] }} {{ e.surface }}</span>
          </div>
          <p class="hint" style="margin-top: 8px">
            W{{ e.week }} · entry {{ formatDollars(e.entryFeeCents) }} · travel ~{{ formatDollars(e.travelCostCents) }}
          </p>
          <div class="controls" style="margin-top: 8px">
            <span class="pill" :class="{ negative: week > e.deadlineWeek && !e.entered }">closes W{{ e.deadlineWeek }}</span>
            <span v-if="e.entered" class="pill ok">Entered</span>
          </div>
          <div class="controls" style="margin-top: 12px">
            <button v-if="e.entered" :disabled="week > e.deadlineWeek || game.busy" @click="askWithdraw(e)">
              Withdraw
            </button>
            <span v-else-if="entriesClosed(e)" class="pill muted">Entries closed W{{ e.deadlineWeek }}</span>
            <template v-else>
              <button class="primary" :disabled="fundsShort(e) || game.busy" @click="askEnter(e)">Enter</button>
              <span v-if="fundsShort(e)" class="hint" style="margin: 0">Not enough funds</span>
            </template>
          </div>
        </div>
        <p v-if="!upcoming.length" class="hint">No events scheduled in the next 8 weeks.</p>
      </div>
      <p class="hint">
        <span class="pill">🔒 ITF Junior</span> unlocks later
      </p>
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
          <template v-for="(r, i) in standings" :key="r.playerId">
            <!-- Gap between the top-10 block and the around-kid block (dense ranks jump > 1). -->
            <tr v-if="i > 0 && r.rank > standings[i - 1].rank + 1" class="standings-gap">
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
      <p class="hint">Your rank: #{{ kidRank }}</p>
    </section>

    <section>
      <h2>Friendly match</h2>
      <div class="controls">
        <input v-model="exhibitionSeed" type="text" placeholder="seed (optional)" />
        <button class="primary" @click="playExhibition">Play match</button>
        <span class="pill">{{ kidName }} vs Top seed · Clay</span>
      </div>
      <MatchViewer
        v-if="exhibitionMatch"
        :match="exhibitionMatch"
        :player-a="exhibitionPlayerA"
        :player-b="exhibitionPlayerB"
        :surface="exhibitionSurface"
        :rank-a="kidRank"
        :rank-b="null"
        mode="live"
      />
    </section>

    <ConfirmDialog
      v-if="pendingConfirm"
      :message="pendingConfirm.message"
      :confirm-label="pendingConfirm.confirmLabel"
      @confirm="runConfirm"
      @cancel="pendingConfirm = null"
    />
    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
  </template>
</template>
