<script setup lang="ts">
// feat/tournament-experience – the foreground tournament. A full-screen overlay (like onboarding),
// auto-shown whenever the snapshot carries a `pending` reveal. The player walks the kid's bracket
// round by round: a VS pre-match card (watch or skip), a post-match box score, a between-rounds
// path strip, and a champion/eliminated finale. The result is already committed by the engine –
// this is presentation (Q&A 12), never a re-decision.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import MatchViewer from './MatchViewer.vue'
import { playSfx } from '../audio/sfx'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { TIERS } from '../engine/season/calendar'
import { KID_ID, flipScore } from '../engine/world'
import { formatShortName } from '../shared/format'
import { weekRange } from '../shared/dates'
import type { MatchOptions, Side } from '../engine/match/types'
import type { FullBracketMatch, WorldMatch } from '../shared/protocol'

const game = useGameStore()
const base = import.meta.env.BASE_URL
const HAPPY_ART = `${base}images/fem-euro-brunnet/fem-euro-brunnet-jun-happy-fs8.webp`
const SAD_ART = `${base}images/fem-euro-brunnet/fem-euro-brunnet-jun-sad-fs8.webp`
// Round 5 item 11: a programmatic gold->silver desaturation of jun-happy (sharp
// hue/saturation masking on the trophy) came out patchy/inconsistent on inspection –
// not shipping it (see docs/specs/round5-brand.md). Fallback: the runner-up finale
// reuses the "serious" (focused, composed) art + a silver-styled card frame instead
// of a dedicated artwork.
const SERIOUS_ART = `${base}images/fem-euro-brunnet/fem-euro-brunnet-jun-serious-fs8.webp`
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
// Snapshot.week stays pinned to the event's own week for the whole reveal (tickWeek never
// advances again while paused), so this doubles as the tournament's real date range.
const weekDates = computed(() => weekRange(game.snapshot?.week ?? 0))

// --- Round 5 item 6: pre-tournament splash ------------------------------------
const drawSize = computed(() => (pending.value ? TIERS[pending.value.tier].drawSize : 0))

// Round 5 item 11 fallback: lost the final => silver-styled card, serious art, "Runner-up".
const isRunnerUp = computed(() => !pending.value?.kidChampion && pending.value?.finishLabel === 'Runner-up')
const finalePortrait = computed(() => {
  if (pending.value?.kidChampion) return HAPPY_ART
  if (isRunnerUp.value) return SERIOUS_ART
  return SAD_ART
})

// --- flow state --------------------------------------------------------------
const phase = ref<'splash' | 'pre' | 'post' | 'finale'>('splash')
// The record currently being presented – captured from the pre-match snapshot so the post-match
// card keeps it even after the reveal has advanced the pending pointer to the next round.
const currentMatch = ref<WorldMatch | null>(null)
// The current opponent's rank, captured at pre-match time (before the reveal advances the pending
// pointer to the NEXT round's opponent). Shown under the opponent's name in the post-match stats.
const currentOppRank = ref<number | null>(null)
const replayOpen = ref(false)
// True when the replay was opened from a pre-match card (finishing it advances to the result).
const replayAdvances = ref(false)
// Round-5 sound rewiring: was the round just revealed actually watched through MatchViewer
// (which already plays its own match-end cue), or skipped straight to the result card (no
// match-end cue ever played)? Read once, when the finale screen first shows, to decide
// whether the champion finale needs to supply its own applauseFinal.
const lastRoundWatched = ref(false)
// True only for the round currently being presented being the tournament final – routed into
// the embedded MatchViewer so its match-end cue is the bigger `applauseFinal`, not the regular
// short applause used for every other round.
const isFinalRound = computed(() => pending.value?.roundLabel === 'Final')

function enterPre(): void {
  phase.value = 'pre'
  replayOpen.value = false
  currentMatch.value = pending.value?.kidMatch ?? null
  currentOppRank.value = pending.value?.opponent.rank ?? null
}

function beginFromSplash(): void {
  enterPre()
}

// Initialise from the snapshot: resume at the finale after a reload mid-celebration, resume
// mid-round if a round is already revealed, otherwise this is the FIRST time the flow has
// opened for this tournament -> show the splash first (item 6).
if (pending.value?.finished) phase.value = 'finale'
else if (pending.value && pending.value.bracket.length === 0) phase.value = 'splash'
else enterPre()

async function showResult(watched: boolean): Promise<void> {
  if (phase.value !== 'pre') return
  replayOpen.value = false
  lastRoundWatched.value = watched
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
  if (replayAdvances.value) showResult(true)
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

// Round-5 sound rewiring: the champion finale gets its own celebratory applauseFinal, but
// only when the final round wasn't watched through MatchViewer (which already played that
// cue at its own match-end) – e.g. the player hit "Skip" on the final's pre-match card.
// `{ immediate: true }` also covers resuming straight into an already-finished tournament
// (reload mid-celebration): the fired-once guard still applies, so this plays at most once
// per mount either way. Note: if the final was skipped and then re-watched via "Watch
// again" from the post-match card, this still fires (lastRoundWatched only reflects the
// showResult call) – an acceptable double applause in that edge case, per spec.
let finaleSoundPlayed = false
watch(
  phase,
  (p) => {
    if (p !== 'finale' || finaleSoundPlayed) return
    finaleSoundPlayed = true
    if (pending.value?.kidChampion && !lastRoundWatched.value) playSfx('applauseFinal')
  },
  { immediate: true },
)

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

// --- Round 5 item 5: full draw of every revealed round --------------------------
const showFullDraw = ref(false)
// Conventional "Winner d. Loser 6-4 ..." reading: world.ts already normalises `score` to the
// WINNER's perspective, so this just reorders the two names to match (draw side a/b order
// carries no meaning to the player – who actually won does).
interface FullDrawMatch {
  winnerId: string
  winnerName: string
  loserName: string
  score?: string
  isKidMatch: boolean
}
interface FullDrawRound {
  round: number
  label: string
  matches: FullDrawMatch[]
}
function toDrawMatch(m: FullBracketMatch): FullDrawMatch {
  const winnerIsA = m.winnerId === m.aId
  return {
    winnerId: m.winnerId,
    winnerName: winnerIsA ? m.aName : m.bName,
    loserName: winnerIsA ? m.bName : m.aName,
    score: m.score,
    isKidMatch: m.aId === KID_ID || m.bId === KID_ID,
  }
}
const fullDrawRounds = computed<FullDrawRound[]>(() => {
  const matches = pending.value?.fullBracket ?? []
  const byRound = new Map<number, FullBracketMatch[]>()
  for (const m of matches) {
    const list = byRound.get(m.round)
    if (list) list.push(m)
    else byRound.set(m.round, [m])
  }
  return [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, list]) => ({ round, label: list[0].roundLabel, matches: list.map(toDrawMatch) }))
})
</script>

<template>
  <div v-if="pending" class="tournament-flow">
    <header class="tf-top">
      <div>
        <div class="tf-title">{{ pending.tierLabel }}</div>
        <div class="tf-sub">
          <span class="pill">{{ SURFACE_EMOJI[pending.surface] }} {{ pending.surface }}</span>
          <span class="hint tf-week-dates">{{ weekDates }}</span>
        </div>
      </div>
      <button
        v-if="!pending.finished && phase !== 'finale' && phase !== 'splash'"
        class="link"
        :disabled="game.busy"
        @click="skipAll"
      >
        Skip tournament →
      </button>
    </header>

    <div class="tf-body">
      <!-- Round 5 item 6: pre-tournament splash, the flow's very first screen -->
      <section v-if="phase === 'splash'" class="tf-card tf-splash">
        <img class="tf-portrait" :src="SERIOUS_ART" alt="" />
        <p class="tf-splash-tier">{{ pending.tierLabel }}</p>
        <div class="controls" style="justify-content: center; margin-top: 4px">
          <span class="pill">{{ SURFACE_EMOJI[pending.surface] }} {{ pending.surface }}</span>
          <span class="pill">Draw of {{ drawSize }}</span>
          <span class="pill">{{ drawSize }} entrants</span>
        </div>
        <p class="hint" style="margin-top: 8px">{{ weekDates }}</p>
        <div class="tf-actions">
          <button class="primary" :disabled="game.busy" @click="beginFromSplash">Begin →</button>
        </div>
      </section>

      <template v-else>
        <!-- Path so far -->
        <div v-if="pending.bracket.length" class="tf-strip">
          <div v-for="(r, i) in pending.bracket" :key="i" class="tf-strip-row" :class="{ won: r.kidWon }">
            <span class="tf-strip-round">{{ r.roundLabel }}</span>
            <span class="tf-strip-result">{{ r.kidWon ? 'W' : 'L' }}</span>
            <span class="tf-strip-opp">{{ r.oppName }}</span>
            <span class="tf-strip-score num">{{ r.score }}</span>
          </div>
        </div>

        <!-- Round 5 item 5: the full draw of every round revealed so far, collapsible -->
        <section v-if="fullDrawRounds.length" class="tf-card tf-fulldraw">
          <button class="tf-fulldraw-toggle" @click="showFullDraw = !showFullDraw">
            <span>Full draw</span>
            <span>{{ showFullDraw ? '▲' : '▼' }}</span>
          </button>
          <div v-if="showFullDraw" class="tf-fulldraw-body">
            <div v-for="grp in fullDrawRounds" :key="grp.round" class="tf-fulldraw-round">
              <p class="tf-fulldraw-round-label">{{ grp.label }}</p>
              <div
                v-for="(m, i) in grp.matches"
                :key="i"
                class="tf-fulldraw-match"
                :class="{ 'kid-match': m.isKidMatch }"
              >
                <span class="won">{{ m.winnerName }}</span>
                <span class="tf-fulldraw-vs">d.</span>
                <span>{{ m.loserName }}</span>
                <span v-if="m.score" class="num tf-fulldraw-score">{{ m.score }}</span>
              </div>
            </div>
          </div>
        </section>

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
          :final-match="isFinalRound"
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
          <button class="primary sfx-watch" :disabled="game.busy" @click="watchMatch">Watch match</button>
          <button :disabled="game.busy" @click="showResult(false)">Skip</button>
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
          <button class="sfx-watch" :disabled="game.busy" @click="watchAgain">Watch again</button>
          <button class="primary" :disabled="game.busy" @click="next">Next →</button>
        </div>
      </section>

      <!-- Finale -->
      <section
        v-else
        class="tf-card tf-finale"
        :class="pending.kidChampion ? 'champ' : isRunnerUp ? 'silver' : 'out'"
      >
        <div v-if="pending.kidChampion" class="tf-trophy">🏆</div>
        <div v-else-if="isRunnerUp" class="tf-trophy">🥈</div>
        <img class="tf-portrait" :src="finalePortrait" alt="" />
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
      </template>
    </div>
  </div>
</template>
