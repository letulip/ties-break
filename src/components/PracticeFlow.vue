<script setup lang="ts">
// R10-12 – the booked practice match, watched LIVE. A friendly used to be reachable only as a
// replay: advance the week, find the row in the feed, open MatchReplay ("Watch again ↻"). This is
// the tournament treatment scaled down to one match – a VS card, the live viewer, a box score –
// so a friendly you paid for plays out like a match instead of arriving as history.
//
// Same contract as TournamentFlow (Q&A 12): the ENGINE already resolved this match during the
// tick (world.ts resolvePractice, on the private `seed:practicematch:week` stream) and stored the
// record. simulateMatch is a pure function of (a, b, {surface, tour, seed}), so re-running it here
// under the stored seed reproduces that exact match – winner, sets, every point. Watching cannot
// change the result and draws no RNG the engine hasn't already drawn.
import { computed, ref } from 'vue'
import MatchViewer from './MatchViewer.vue'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { KID_ID, flipScore } from '../engine/world'
import { formatShortName } from '../shared/format'
import { weekRange } from '../shared/dates'
import type { MatchOptions, Side } from '../engine/match/types'
import type { WorldMatch } from '../shared/protocol'

const props = withDefaults(
  defineProps<{
    /** the committed friendly record (event.match on the `friendly: true` match event) */
    match: WorldMatch
    /** the week it was played – the card names it, so an advance-and-watch is never confusing */
    week: number
    /** her standings rank, shown under her name in the box score (the sparring partner has none
     *  that matters here – a friendly is outside the ranking) */
    kidRank?: number | null
  }>(),
  { kidRank: null },
)
const emit = defineEmits<{ close: [] }>()

const SURFACE_EMOJI: Record<string, string> = { hard: '🔵', clay: '🟠', grass: '🟢' }

// 'pre' = the VS card, 'live' = the viewer (autoplaying), 'post' = the box score.
const phase = ref<'pre' | 'live' | 'post'>('pre')

const opts = computed<MatchOptions>(() => ({
  surface: props.match.surface,
  tour: JUNIOR_TOUR,
  seed: props.match.seed ?? '',
}))
const annotated = computed(() => {
  const result = simulateMatch(props.match.a, props.match.b, opts.value)
  return annotateMatch(result, props.match.a, props.match.b, opts.value)
})

const kidSide = computed<Side>(() => (props.match.aId === KID_ID ? 0 : 1))
const kidPlayer = computed(() => (kidSide.value === 0 ? props.match.a : props.match.b))
const oppPlayer = computed(() => (kidSide.value === 0 ? props.match.b : props.match.a))
const kidShort = computed(() => formatShortName(kidPlayer.value.name))
const oppShort = computed(() => formatShortName(oppPlayer.value.name))
const kidWon = computed(() => props.match.winnerId === KID_ID)
// Her-perspective scoreline (the stored score is written a-vs-b).
const kidScore = computed(() => (props.match.bId === KID_ID ? flipScore(props.match.score ?? '') : (props.match.score ?? '')))
const weekDates = computed(() => weekRange(props.week))
const viewerRankA = computed<number | null>(() => (kidSide.value === 0 ? props.kidRank : null))
const viewerRankB = computed<number | null>(() => (kidSide.value === 0 ? null : props.kidRank))

interface StatRow {
  label: string
  kid: string
  opp: string
}
const statRows = computed<StatRow[]>(() => {
  const s = computeMatchStats(annotated.value, props.match.a, props.match.b)
  const k = kidSide.value
  const o: Side = k === 0 ? 1 : 0
  const pair = (v: [number, number]): { kid: string; opp: string } => ({ kid: String(v[k]), opp: String(v[o]) })
  return [
    { label: 'Aces', ...pair(s.aces) },
    { label: 'Double faults', ...pair(s.doubleFaults) },
    { label: 'Winners', ...pair(s.winners) },
    { label: 'Unforced errors', ...pair(s.unforcedErrors) },
    { label: 'Max serve', kid: `${s.serveSpeed.max[k]} km/h`, opp: `${s.serveSpeed.max[o]} km/h` },
  ]
})
const matchMeta = computed(() => {
  const s = computeMatchStats(annotated.value, props.match.a, props.match.b)
  return { rally: s.meanRallyLength.toFixed(1), duration: s.durationEstimate }
})

function watchIt(): void {
  phase.value = 'live'
}
function toResult(): void {
  phase.value = 'post'
}
function close(): void {
  emit('close')
}
</script>

<template>
  <div class="tournament-flow">
    <header class="tf-top">
      <div>
        <div class="tf-title">Practice match</div>
        <div class="tf-sub">
          <span class="pill">{{ SURFACE_EMOJI[match.surface] }} {{ match.surface }}</span>
          <span class="hint tf-week-dates">W{{ week }} · {{ weekDates }}</span>
        </div>
      </div>
      <button class="link" @click="close">Close ✕</button>
    </header>

    <div class="tf-body">
      <!-- The VS card: the friendly is about to be played, exactly like a tournament round. -->
      <section v-if="phase === 'pre'" class="tf-card tf-vs">
        <p class="tf-round">Friendly at the club</p>
        <div class="tf-vs-grid">
          <div class="tf-side">
            <div class="tf-side-name">{{ kidShort }}</div>
            <div v-if="kidRank" class="hint" style="margin: 4px 0 0">#{{ kidRank }}</div>
          </div>
          <div class="tf-vs-mid">vs</div>
          <div class="tf-side">
            <div class="tf-side-name">{{ oppShort }}</div>
            <div class="hint" style="margin: 4px 0 0">sparring partner</div>
          </div>
        </div>
        <div class="controls" style="justify-content: center; margin-top: 4px">
          <span class="pill">No ranking points</span>
        </div>
        <div class="tf-actions">
          <button class="primary sfx-watch" @click="watchIt">Watch it</button>
          <button @click="toResult">Skip to result</button>
        </div>
      </section>

      <!-- Live: the same viewer a tournament round uses, autoplaying from the first point. -->
      <section v-else-if="phase === 'live'" class="tf-card">
        <div class="tf-card-head">
          <span class="tf-replay-round">Practice match</span>
          <button class="link" @click="toResult">To result →</button>
        </div>
        <MatchViewer
          :match="annotated"
          :player-a="match.a"
          :player-b="match.b"
          :surface="match.surface"
          :rank-a="viewerRankA"
          :rank-b="viewerRankB"
          mode="live"
          @finish="toResult"
        />
      </section>

      <!-- Box score: her result, with the honest "no ranking points" line. -->
      <section v-else class="tf-card">
        <div class="tf-result-head">
          <span class="tf-badge" :class="kidWon ? 'win' : 'loss'">{{ kidWon ? 'Win' : 'Loss' }}</span>
          <span class="tf-scoreline num">{{ kidScore }}</span>
        </div>
        <p class="hint" style="margin: 0 0 12px">{{ kidShort }} vs {{ oppShort }} · practice – no ranking points</p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>
                <span class="ph-name">{{ kidShort }}</span>
                <span v-if="kidRank" class="ph-rank">#{{ kidRank }}</span>
              </th>
              <th>
                <span class="ph-name">{{ oppShort }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in statRows" :key="row.label">
              <th>{{ row.label }}</th>
              <td class="num">{{ row.kid }}</td>
              <td class="num">{{ row.opp }}</td>
            </tr>
          </tbody>
        </table>
        <p class="hint">Avg rally {{ matchMeta.rally }} shots · ~{{ matchMeta.duration }}</p>
        <div class="tf-actions">
          <button class="sfx-watch" @click="watchIt">Watch again</button>
          <button class="primary" @click="close">Done</button>
        </div>
      </section>
    </div>
  </div>
</template>
