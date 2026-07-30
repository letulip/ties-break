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
import MatchScene from './MatchScene.vue'
import SurfaceMark from './ui/SurfaceMark.vue'
import { useKidEmotion } from '../composables/kidEmotion'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { KID_ID, flipScore } from '../engine/world'
import { formatShortName } from '../shared/format'
import { weekLabel, weekRange } from '../shared/dates'
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

// ⚠ `SURFACE_EMOJI` IS GONE (owner, 30.07: «Surface type similar icon across every screen – it means
// this icon is not a component»). That exact line - the same three emoji, byte for byte - had been
// pasted into three files, and its hues are not the `--surface-*` tokens the ring mark uses, so the
// same clay court was one orange in the flow and a different orange on the calendar. SurfaceMark.

// ui-inventory §2, the owner's triage: "PracticeFlow – F Match Day does the same job, it follows
// that design". So the card before a friendly is the SAME portrait scene the tournament's pre-match
// card is, down to the glass plate at its foot – one treatment, three callers (see MatchScene.vue).
// Her age band comes from the shared resolver, never from her age here.
const { stage: kidStage } = useKidEmotion()

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
          <SurfaceMark :surface="match.surface" size="sm" />
          <span class="hint tf-week-dates">{{ weekLabel(week) }} · {{ weekDates }}</span>
        </div>
      </div>
      <!-- ⚠ THE HEADER'S ONE SLOT, AND IT USED TO SAY "Close ✕" ON ALL THREE PHASES (owner, 30.07:
           «what this close stands for? does it skip the game or what? maybe it's redundant?» and
           «let's put To results instead of Close»). What it DID: dismiss the whole friendly and
           return to the app. It never skipped or re-decided anything - the engine committed this
           match during the tick (see the contract at the top of this file) - but on the live phase
           it was the one door that threw away the box score the player had just paid $73 to watch,
           sitting next to a "To result →" that did the useful thing. So the slot now carries the
           useful thing, and on the box score itself it carries nothing at all: "Done" below is
           already the way out, and two exits on one screen is what he was asking about. -->
      <button v-if="phase !== 'post'" class="link" @click="toResult">To result →</button>
    </header>

    <div class="tf-body">
      <!-- The VS card: the friendly is about to be played, exactly like a tournament round – which
           is why it is the same F scene, with the club's own label on it. -->
      <MatchScene v-if="phase === 'pre'" class="pf-scene" :stage="kidStage" emotion="serious" label="Friendly at the club">
        <div class="pf-grid">
          <div class="pf-side">
            <div class="pf-name">{{ kidShort }}</div>
            <div v-if="kidRank" class="pf-rank">#{{ kidRank }}</div>
          </div>
          <div class="pf-vs">vs</div>
          <div class="pf-side mirrored">
            <div class="pf-name">{{ oppShort }}</div>
            <div class="pf-rank">sparring partner</div>
          </div>
        </div>
        <div class="controls pf-chips">
          <span class="pill">No ranking points</span>
        </div>
        <div class="tf-actions">
          <button class="primary sfx-watch" @click="watchIt">Watch it</button>
          <button @click="toResult">Skip to result</button>
        </div>
      </MatchScene>

      <!-- Live: the same viewer a tournament round uses, autoplaying from the first point.
           ⚠ THE HEAD ROW IS GONE, AND IT COST 34px (owner, 30.07: «let's remove practice match sign
           nearby a court since we already have one on top of the screen as a header»). It held two
           things and both were answered elsewhere: a `.tf-replay-round` pill reading "Practice
           match", which the header above says already, and "To result →", which is now the header's
           own slot. So the row had nothing left of its own to carry, and the court starts 34px
           higher (22px of pill + its 12px of air) on every friendly.
           ⚠ AND THE `.tf-card` AROUND IT IS GONE TOO (owner, 30.07: «на экране матча у нас двойная
           рамка, она съедает место, давай внешний контур уберем, он не нужен»). The viewer already
           draws its own panels - the court, the log and the box score are each a `Card` - so this was
           a border around a border and 34px of padding around nothing. Measured at 375pt: 291 ->
           327px of canvas, 244.4 -> 274.9px of painted court, and 32px of height back. See the same
           note in TournamentFlow.vue; the `v-else-if` moved onto the component so the phase chain is
           untouched and no wrapper is left to grow an edge again. -->
      <MatchViewer
        v-else-if="phase === 'live'"
        :match="annotated"
        :player-a="match.a"
        :player-b="match.b"
        :surface="match.surface"
        :rank-a="viewerRankA"
        :rank-b="viewerRankB"
        mode="live"
        @finish="toResult"
      />

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

<style scoped>
/* The friendly's own two lines on the F scene's glass plate. MatchScene owns the card, the painting
   and the plate; this is only what is written on it – and it is deliberately the same shape as the
   tournament's pre-match plate, because it is the same object one rung down. */
/* Fills the takeover, same as the tournament's own pre-match scene. */
.pf-scene {
  flex: 1;
}

.pf-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.pf-side {
  min-width: 0;
}

.pf-side.mirrored {
  text-align: right;
}

.pf-name {
  font-size: 14.5px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.pf-rank {
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
}

.pf-vs {
  font-size: 13px;
  font-style: italic;
  color: var(--ink-soft);
}

.pf-chips {
  justify-content: center;
  margin-top: 10px;
}
</style>
