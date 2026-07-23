<script setup lang="ts">
// feat/tournament-experience – the foreground tournament. A full-screen overlay (like onboarding),
// auto-shown whenever the snapshot carries a `pending` reveal. The player walks the kid's bracket
// round by round: a VS pre-match card (watch or skip), a post-match box score, a between-rounds
// path strip, and a champion/eliminated finale. The result is already committed by the engine –
// this is presentation (Q&A 12), never a re-decision.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import MatchViewer from './MatchViewer.vue'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { KID_ID, flipScore } from '../engine/world'
import { formatShortName } from '../shared/format'
import type { MatchOptions, Side } from '../engine/match/types'
import type { WorldMatch } from '../shared/protocol'

const game = useGameStore()
const base = import.meta.env.BASE_URL
const HAPPY_ART = `${base}images/fem-euro-brunnet/fem-euro-brunnet-jun-happy-fs8.webp`
const SAD_ART = `${base}images/fem-euro-brunnet/fem-euro-brunnet-jun-sad-fs8.webp`
const SURFACE_EMOJI: Record<string, string> = { hard: '🔵', clay: '🟠', grass: '🟢' }

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const pending = computed(() => game.snapshot?.pending ?? null)
const profile = computed(() => game.snapshot?.profile ?? null)
const kidShort = computed(() =>
  profile.value ? formatShortName(`${profile.value.kidName} ${profile.value.kidLastName}`) : '',
)
const kidFlag = computed(() => flagEmoji(profile.value?.country ?? ''))
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)

// --- flow state --------------------------------------------------------------
const phase = ref<'pre' | 'post' | 'finale'>('pre')
// The record currently being presented – captured from the pre-match snapshot so the post-match
// card keeps it even after the reveal has advanced the pending pointer to the next round.
const currentMatch = ref<WorldMatch | null>(null)
// The current opponent's rank, captured at pre-match time (before the reveal advances the pending
// pointer to the NEXT round's opponent). Shown under the opponent's name in the post-match stats.
const currentOppRank = ref<number | null>(null)
const replayOpen = ref(false)
// True when the replay was opened from a pre-match card (finishing it advances to the result).
const replayAdvances = ref(false)

function enterPre(): void {
  phase.value = 'pre'
  replayOpen.value = false
  currentMatch.value = pending.value?.kidMatch ?? null
  currentOppRank.value = pending.value?.opponent.rank ?? null
}

// Initialise from the snapshot: resume at the finale after a reload mid-celebration.
if (pending.value?.finished) phase.value = 'finale'
else enterPre()

async function showResult(): Promise<void> {
  if (phase.value !== 'pre') return
  replayOpen.value = false
  await game.tournamentReveal()
  phase.value = 'post'
}

function watchMatch(): void {
  replayAdvances.value = true
  replayOpen.value = true
}
function watchAgain(): void {
  replayAdvances.value = false
  replayOpen.value = true
}
function endReplay(): void {
  replayOpen.value = false
  if (replayAdvances.value) showResult()
}

function next(): void {
  const p = pending.value
  if (!p) return
  if (p.finished) phase.value = 'finale'
  else enterPre()
}
async function skipAll(): Promise<void> {
  await game.tournamentSkip()
  phase.value = 'finale'
}
async function continueFinale(): Promise<void> {
  await game.tournamentClose()
}

// --- current match: rebuilt annotated match + box score ----------------------
const annotated = computed(() => {
  const m = currentMatch.value
  if (!m) return null
  const opts: MatchOptions = { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' }
  return annotateMatch(simulateMatch(m.a, m.b, opts), m.a, m.b, opts)
})
const kidSide = computed<Side>(() => (currentMatch.value?.aId === KID_ID ? 0 : 1))
const kidWon = computed(() => currentMatch.value?.winnerId === KID_ID)
const kidScore = computed(() => {
  const m = currentMatch.value
  if (!m?.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
})
const oppName = computed(() => currentMatch.value?.oppName ?? '')
// Short name on both sides for the caption + stats header (round-5 item 9).
const oppShort = computed(() => (oppName.value ? formatShortName(oppName.value) : ''))
// Ranks routed into the inline MatchViewer, mapped to its A/B sides by which side the kid took.
const viewerRankA = computed<number | null>(() => (kidSide.value === 0 ? kidRank.value : currentOppRank.value))
const viewerRankB = computed<number | null>(() => (kidSide.value === 0 ? currentOppRank.value : kidRank.value))

interface StatRow {
  label: string
  kid: string
  opp: string
}
const statRows = computed<StatRow[]>(() => {
  const a = annotated.value
  const m = currentMatch.value
  if (!a || !m) return []
  const s = computeMatchStats(a, m.a, m.b)
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
  const a = annotated.value
  const m = currentMatch.value
  if (!a || !m) return null
  const s = computeMatchStats(a, m.a, m.b)
  return { rally: s.meanRallyLength.toFixed(1), duration: s.durationEstimate }
})
</script>

<template>
  <div v-if="pending" class="tournament-flow">
    <header class="tf-top">
      <div>
        <div class="tf-title">{{ pending.tierLabel }}</div>
        <div class="tf-sub">
          <span class="pill">{{ SURFACE_EMOJI[pending.surface] }} {{ pending.surface }}</span>
        </div>
      </div>
      <button v-if="!pending.finished && phase !== 'finale'" class="link" :disabled="game.busy" @click="skipAll">
        Skip tournament →
      </button>
    </header>

    <div class="tf-body">
      <!-- Path so far -->
      <div v-if="pending.bracket.length" class="tf-strip">
        <div v-for="(r, i) in pending.bracket" :key="i" class="tf-strip-row" :class="{ won: r.kidWon }">
          <span class="tf-strip-round">{{ r.roundLabel }}</span>
          <span class="tf-strip-result">{{ r.kidWon ? 'W' : 'L' }}</span>
          <span class="tf-strip-opp">{{ r.oppName }}</span>
          <span class="tf-strip-score num">{{ r.score }}</span>
        </div>
      </div>

      <!-- Watching a replay (inline) -->
      <section v-if="replayOpen && annotated && currentMatch" class="tf-card">
        <div class="tf-card-head">
          <span class="pill">{{ pending.roundLabel }}</span>
          <button class="link" @click="endReplay">To result →</button>
        </div>
        <MatchViewer
          :match="annotated"
          :player-a="currentMatch.a"
          :player-b="currentMatch.b"
          :surface="currentMatch.surface"
          :rank-a="viewerRankA"
          :rank-b="viewerRankB"
          @finish="endReplay"
        />
      </section>

      <!-- Pre-match VS card -->
      <section v-else-if="phase === 'pre'" class="tf-card tf-vs">
        <p class="tf-round">{{ pending.roundLabel }}</p>
        <div class="tf-vs-grid">
          <div class="tf-side">
            <div class="tf-side-name">{{ kidShort }} {{ kidFlag }}</div>
            <div class="hint" style="margin: 4px 0 0">#{{ kidRank }}</div>
          </div>
          <div class="tf-vs-mid">vs</div>
          <div class="tf-side">
            <div class="tf-side-name">{{ pending.opponent.name }} {{ flagEmoji(pending.opponent.nation) }}</div>
            <div class="hint" style="margin: 4px 0 0">#{{ pending.opponent.rank }}</div>
          </div>
        </div>
        <div class="tf-actions">
          <button class="primary" :disabled="game.busy" @click="watchMatch">Watch match</button>
          <button :disabled="game.busy" @click="showResult">Skip</button>
        </div>
      </section>

      <!-- Post-match box score -->
      <section v-else-if="phase === 'post'" class="tf-card">
        <div class="tf-result-head">
          <span class="tf-badge" :class="kidWon ? 'win' : 'loss'">{{ kidWon ? 'Win' : 'Loss' }}</span>
          <span class="tf-scoreline num">{{ kidScore }}</span>
        </div>
        <p class="hint" style="margin: 0 0 12px">{{ kidShort }} vs {{ oppShort }}</p>
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
                <span v-if="currentOppRank != null" class="ph-rank">#{{ currentOppRank }}</span>
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
        <p v-if="matchMeta" class="hint">Avg rally {{ matchMeta.rally }} shots · ~{{ matchMeta.duration }}</p>
        <div class="tf-actions">
          <button :disabled="game.busy" @click="watchAgain">Watch again</button>
          <button class="primary" :disabled="game.busy" @click="next">Next →</button>
        </div>
      </section>

      <!-- Finale -->
      <section v-else class="tf-card tf-finale" :class="pending.kidChampion ? 'champ' : 'out'">
        <div v-if="pending.kidChampion" class="tf-trophy">🏆</div>
        <img class="tf-portrait" :src="pending.kidChampion ? HAPPY_ART : SAD_ART" alt="" />
        <p class="tf-finale-title">
          {{ pending.kidChampion ? `Champion – ${pending.tierLabel}!` : pending.finishLabel }}
        </p>
        <p class="tf-finale-points">+{{ pending.points }} pts</p>
        <div v-if="pending.bracket.length" class="tf-path">
          <div v-for="(r, i) in pending.bracket" :key="i" class="tf-path-row" :class="{ won: r.kidWon }">
            <span>{{ r.roundLabel }}</span>
            <span>{{ r.kidWon ? 'beat' : 'lost to' }} {{ r.oppName }}</span>
            <span class="num">{{ r.score }}</span>
          </div>
        </div>
        <div class="tf-actions">
          <button class="primary" :disabled="game.busy" @click="continueFinale">Continue</button>
        </div>
      </section>
    </div>
  </div>
</template>
