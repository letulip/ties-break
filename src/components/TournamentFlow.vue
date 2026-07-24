<script setup lang="ts">
// feat/tournament-experience – the foreground tournament. A full-screen overlay (like onboarding),
// auto-shown whenever the snapshot carries a `pending` reveal. The player walks the kid's bracket
// round by round: a VS pre-match card (watch or skip), a post-match box score, a between-rounds
// path strip, and a champion/eliminated finale. The result is already committed by the engine –
// this is presentation (Q&A 12), never a re-decision.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import MatchViewer from './MatchViewer.vue'
import BracketTabs from './BracketTabs.vue'
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
import type { WorldMatch } from '../shared/protocol'

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
// Round-7 (spectate): 'spectate' sits between the kid's post-match card and the finale – once
// she's out (but not champion / runner-up) the flow walks the SUBSEQUENT rounds she isn't in,
// round by round, up to and including the Final, before "Continue" goes home.
const phase = ref<'splash' | 'pre' | 'post' | 'spectate' | 'finale'>('splash')
// The record currently being presented – captured from the pre-match snapshot so the post-match
// card keeps it even after the reveal has advanced the pending pointer to the next round.
const currentMatch = ref<WorldMatch | null>(null)
// The current opponent's rank, captured at pre-match time (before the reveal advances the pending
// pointer to the NEXT round's opponent). Shown under the opponent's name in the post-match stats.
const currentOppRank = ref<number | null>(null)
const replayOpen = ref(false)
// True when the replay was opened from a pre-match card (finishing it advances to the result).
const replayAdvances = ref(false)
// True only while the round being presented is the tournament FINAL. Round-7 item 14: the
// final's embedded MatchViewer suppresses its own match-end applause (`suppressEndApplause`)
// so the celebratory applause is played exactly once, by the finale screen below.
const isFinalRound = computed(() => pending.value?.roundLabel === 'Final')

// --- Round-7 spectate geometry ------------------------------------------------
// The Final's round index (log2(draw) - 1) and the round the kid exited in. Single-elim: she
// plays contiguous rounds 0..bracket.length-1, so her exit round is bracket.length-1 (once
// finished, `bracket` holds all her matches). She reached the Final iff exit === finalRound.
const finalRound = computed(() => (drawSize.value ? Math.log2(drawSize.value) - 1 : 0))
const kidExitRound = computed(() => (pending.value ? pending.value.bracket.length - 1 : -1))
// The round the spectate walk is currently showing (starts at the round after her exit).
const spectateRound = ref(0)
// The default-active tab for the draw: the spectate round while spectating, otherwise the kid's
// latest played round (bracket.length-1).
const bracketActiveRound = computed(() =>
  phase.value === 'spectate' ? spectateRound.value : Math.max(0, (pending.value?.bracket.length ?? 1) - 1),
)
function stageName(round: number): string {
  const remaining = drawSize.value / 2 ** round
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}
const spectateRoundLabel = computed(() => stageName(spectateRound.value))

// The whole draw once finished (through the Final), else the kid's played rounds – rendered as
// the round-tabbed bracket between rounds (post) and during the spectate walk (never over a
// replay or the pre-match card).
const bracketMatches = computed(() => pending.value?.fullBracket ?? [])
const showBracket = computed(
  () => bracketMatches.value.length > 0 && !replayOpen.value && (phase.value === 'post' || phase.value === 'spectate'),
)
// The tournament champion (the Final match's winner) – named on the non-champion finale card,
// where there is no kid portrait to celebrate an AI winner.
const championName = computed(() => {
  const f = bracketMatches.value.find((m) => m.round === finalRound.value)
  if (!f) return ''
  return f.winnerId === f.aId ? f.aName : f.bName
})

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
  // Still in her run -> the next round's pre-match card.
  if (!p.finished) {
    enterPre()
    return
  }
  // Her run is over. Champion or a lost final (runner-up) -> straight to the finale; both are
  // cases where she reached the Final so there's nothing left to spectate. Otherwise she exited
  // early: spectate the SUBSEQUENT rounds she isn't in, starting the round after her exit.
  if (p.kidChampion || kidExitRound.value >= finalRound.value) {
    phase.value = 'finale'
    return
  }
  spectateRound.value = kidExitRound.value + 1
  phase.value = 'spectate'
}
// The spectate walk: advance one round until the Final is shown, then "Continue" -> finale.
function nextSpectateRound(): void {
  if (spectateRound.value < finalRound.value) spectateRound.value++
  else phase.value = 'finale'
}
async function skipAll(): Promise<void> {
  await game.tournamentSkip()
  phase.value = 'finale'
}
async function continueFinale(): Promise<void> {
  await game.tournamentClose()
}

// Round-7 item 14: the finale screen OWNS the celebratory applause whenever the kid PLAYED
// the final – whether she won it (champion) or lost it (runner-up). The final match's viewer
// stays silent at its own match-end (suppressEndApplause), so this is the single applauseFinal,
// fired once here. A kid eliminated EARLIER gets nothing on the (sad) finale: her last match
// already rang its normal short applause at its own match-end. `{ immediate: true }` also
// covers resuming straight into an already-finished tournament (reload mid-celebration); the
// fired-once guard keeps it to at most one play per mount. This replaced the old
// lastRoundWatched double-fire hack.
let finaleSoundPlayed = false
watch(
  phase,
  (p) => {
    if (p !== 'finale' || finaleSoundPlayed) return
    finaleSoundPlayed = true
    if (pending.value?.kidChampion || isRunnerUp.value) playSfx('applauseFinal')
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

        <!-- Round-7 (owner): the draw as a round-tabbed bracket (R32 · R16 · QF · SF · F). The
             active tab defaults to the kid's current round between rounds (post) and to the
             spectate round during the walk. Reused, single component. -->
        <section v-if="showBracket" class="tf-card tf-bracket">
          <p class="tf-bracket-title">Draw</p>
          <BracketTabs :matches="bracketMatches" :draw-size="drawSize" :active-round="bracketActiveRound" />
        </section>

        <!-- Watching a replay (inline) -->
      <section v-if="replayOpen && annotated && currentMatch" class="tf-card">
        <!-- Round-7 crowd-reaction pass: the stage/round label lives here as a pill on the LEFT
             of the head row, level with "To result →" on the right – no longer an absolute pill
             over the court (which obstructed play). -->
        <div class="tf-card-head">
          <span class="tf-replay-round">{{ pending.roundLabel }}</span>
          <button class="link" @click="endReplay">To result →</button>
        </div>
        <MatchViewer
          :match="annotated"
          :player-a="currentMatch.a"
          :player-b="currentMatch.b"
          :surface="currentMatch.surface"
          :rank-a="viewerRankA"
          :rank-b="viewerRankB"
          :suppress-end-applause="isFinalRound"
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
          <button class="sfx-watch" :disabled="game.busy" @click="watchAgain">Watch again</button>
          <button class="primary" :disabled="game.busy" @click="next">Next →</button>
        </div>
      </section>

      <!-- Round-7 spectate: after the kid's exit, walk the rounds she isn't in, up to the Final.
           Her own result stays visible; the draw above (BracketTabs) shows this round. -->
      <section v-else-if="phase === 'spectate'" class="tf-card tf-spectate">
        <p class="tf-spectate-kid">{{ kidShort }} – {{ pending.finishLabel }}</p>
        <p class="tf-round">{{ spectateRoundLabel }}</p>
        <p class="hint">She's out – see how the draw finishes.</p>
        <div class="tf-actions">
          <button class="primary" :disabled="game.busy" @click="nextSpectateRound">
            {{ spectateRound < finalRound ? 'Next round →' : 'Continue' }}
          </button>
        </div>
      </section>

      <!-- Finale -->
      <template v-else>
        <!-- Reached the Final: her own portrait card (champion gold / runner-up silver), unchanged. -->
        <section
          v-if="pending.kidChampion || isRunnerUp"
          class="tf-card tf-finale"
          :class="pending.kidChampion ? 'champ' : 'silver'"
        >
          <div class="tf-trophy">{{ pending.kidChampion ? '🏆' : '🥈' }}</div>
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

        <!-- Exited earlier: no art for an AI champion, so a clean Champion card naming the winner,
             with the kid's own finish line + the tier/surface. -->
        <section v-else class="tf-card tf-finale out">
          <div class="tf-trophy">🏆</div>
          <p class="tf-champ-label">Champion</p>
          <p class="tf-champ-name">{{ championName }}</p>
          <p class="tf-finale-kidline">
            {{ kidShort }} – {{ pending.finishLabel }}
            <span class="tf-finale-kidpts">(+{{ pending.points }} pts)</span>
          </p>
          <div class="controls" style="justify-content: center; margin-top: 4px">
            <span class="pill">{{ SURFACE_EMOJI[pending.surface] }} {{ pending.surface }}</span>
            <span class="pill">{{ pending.tierLabel }}</span>
          </div>
          <div v-if="pending.bracket.length" class="tf-path" style="margin-top: 12px">
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
      </template>
    </div>
  </div>
</template>
