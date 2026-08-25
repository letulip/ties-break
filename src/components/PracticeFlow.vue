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
import TakeoverShell from './ui/TakeoverShell.vue'
import { useKidEmotion } from '../composables/kidEmotion'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../viz/match/matchStats'
import { matchStatMeta, matchStatRows } from '../composables/matchStatTable'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { KID_ID, flipScore } from '../engine/world'
import { occasionOf } from '../viz/preview'
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
     *  that matters here – a friendly is outside the ranking).
     *
     *  ⚠ A FRIENDLY BELONGS TO NEITHER TABLE, so this is not "the rank this match is played in" -
     *  there is no such thing, which is what the "No ranking points" pill on this card already says.
     *  It is HER rank, and the app has exactly one answer to that: `Snapshot.activeLadder`, the
     *  ladder she is competing in. The callers hand it in already resolved (see App.vue and
     *  WeekRecapCard.vue); they used to hand in `snapshot.kidRank`, the ITF alias, which printed an
     *  international number under a girl who had never left the country. NULL means unranked in that
     *  table and the row is simply not drawn. */
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

/**
 * ⭐ ROUND-23 #4 – AND HERE THE ANSWER IS GENUINELY null, WHICH IS WHY IT IS COMPUTED AND NOT OMITTED.
 *
 * A booked friendly has no draw behind it: `resolvePractice` files it under `practice-w<week>`, an id
 * that names no tier, so `occasionOf` returns null and the viewer gives the thinnest intro and the
 * bottom rung's log. That is the truth here – "no draw, nothing on it" – and it is exactly what this
 * screen's own "No ranking points" pill says one row down.
 *
 * ⚠ SO WHY BIND IT AT ALL. Because silence and an answer looked identical, and that is how the same
 * prop went missing on `MatchReplay` for two rounds without anybody noticing: `previewEvent` defaults
 * to null, null is correct for two callers, and nothing distinguishes "I meant null" from "I forgot".
 * Every match surface now derives the same fact through the same function, and a friendly's null is a
 * computed answer.
 */
const previewEvent = computed(() => occasionOf(props.match.eventId, props.match.round))

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

// THE BOX SCORE'S FIVE ROWS ARE THE TOURNAMENT'S FIVE ROWS - one definition, in composables/
// matchStatTable.ts. What used to be here was a `StatRow` interface, the five labels, the side-swap
// and the `km/h` suffix, all written out again character for character in TournamentFlow. A friendly
// and a final report the same match facts, so there is one place that decides what they are.
// The stats themselves are computed ONCE here and read by both computeds below, which is the rule
// serveSpeed.ts and matchClock.ts already live by: two readings of one number is a bug waiting.
const stats = computed(() => computeMatchStats(annotated.value, props.match.a, props.match.b))
const statRows = computed(() => matchStatRows(stats.value, kidSide.value))
const matchMeta = computed(() => matchStatMeta(stats.value))

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
  <!-- ⚠ THE TAKEOVER IS A COMPONENT NOW - the owner's 30.07 ruling, quoted in full on the script
       side (house convention: his words live where Cyrillic is allowed): every match surface is
       one overlay component, no duplicated code. The layer, the header and
       the scroller were written out by hand here, in TournamentFlow and in MatchReplay, and the
       fourth match surface - SeasonScreen's sandbox - did NOT have them, which is how it ended up
       with its control bar under the tab bar. Same classes, same layout, one author: see
       `ui/TakeoverShell.vue`. -->
  <!-- `screen` is the phase (owner, 31.07): the pre-match card, the match and the box score share one
       scroller that is never unmounted between them, so the box score used to open at whatever
       scroll position the match had been left at. -->
  <TakeoverShell title="Practice match" :screen="phase">
    <template #sub>
      <SurfaceMark :surface="match.surface" size="sm" />
      <span class="hint tf-week-dates">{{ weekLabel(week) }} · {{ weekDates }}</span>
    </template>
    <template #exit>
      <!-- ⚠ THE HEADER'S ONE SLOT, AND IT USED TO SAY "Close ✕" ON ALL THREE PHASES (owner, 30.07:
           «what this close stands for? does it skip the game or what? maybe it's redundant?» and
           «let's put To results instead of Close»). What it DID: dismiss the whole friendly and
           return to the app. It never skipped or re-decided anything - the engine committed this
           match during the tick (see the contract at the top of this file) - but on the live phase
           it was the one door that threw away the box score the player had just paid $73 to watch,
           sitting next to a "To result →" that did the useful thing. So the slot now carries the
           useful thing, and on the box score itself it carries nothing at all: "Done" below is
           already the way out, and two exits on one screen is what he was asking about. -->
      <button v-if="phase !== 'post'" class="link" @click="toResult">To result</button>
    </template>

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
      <!-- ⚠ SKIP FIRST, WATCH SECOND - the owner's 30.07 ruling (quoted on the script side): swap
           the skip and watch buttons on the pre-match screen, it reads more logically that way.
           ("watch it" is this screen's own label.) The
           affirmative goes under the thumb, at the right-hand end, which is where every other action
           row in the app already puts it: the box score below, the tournament's pre-match card, and
           the sheet's `.dialog-actions`. Order only - same handlers, same `.primary`, same
           `.sfx-watch`. -->
      <div class="tf-actions">
        <button @click="toResult">Skip to result</button>
        <button class="primary sfx-watch" @click="watchIt">Watch it</button>
      </div>
    </MatchScene>

    <!-- The same viewer a tournament round uses, autoplaying from the first point.
         ⚠ THE HEAD ROW IS GONE, AND IT COST 34px (owner, 30.07: «let's remove practice match sign
         nearby a court since we already have one on top of the screen as a header»). It held two
         things and both were answered elsewhere: a `.tf-replay-round` pill reading "Practice
         match", which the header above says already, and "To result →", which is now the header's
         own slot. So the row had nothing left of its own to carry, and the court starts 34px
         higher (22px of pill + its 12px of air) on every friendly.
         ⚠ AND THE `.tf-card` AROUND IT IS GONE TOO (owner, 30.07: the match screen has a double frame that eats space, drop the outer contour). The viewer already
         draws its own panels - the court, the log and the box score are each a `Card` - so this was
         a border around a border and 34px of padding around nothing. Measured at 375pt: 291 ->
         327px of canvas, 244.4 -> 274.9px of painted court, and 32px of height back. See the same
         note in TournamentFlow.vue; the `v-else-if` moved onto the component so the phase chain is
         untouched and no wrapper is left to grow an edge again.
         ⚠ AND IT IS `mode="replay"` NOW, WHICH FIXES A LIE THIS FILE'S OWN CONTRACT ALREADY NAMED.
         The header at the top of this file says it plainly: the ENGINE resolved this friendly during
         the tick and stored the record, and watching "cannot change the result and draws no RNG the
         engine hasn't already drawn". A blinking red "Live" over a match that is already in the save
         file is the one claim this screen was making that its own comment contradicted. The phase is
         still called 'live' - that is about where the player is in THIS flow, which is a different
         question - and nothing else on the screen moves: the badge goes, and with it the shout,
         because you cannot shout at a match that has already been played. The only genuinely live
         surface in the app is SeasonScreen's sandbox exhibition, which is generated at click time.
         ⚠ AND IT DOES NOT EJECT ANY MORE (R17 #10, `proceed-label`). The friendly is where a
         retirement is cheapest to meet and where the eject was worst: `@finish` fired the instant the
         last beat played, `toResult` swapped the phase in the same flush, and the viewer's own box
         score never painted. Same handler, one press later. -->
    <MatchViewer
      v-else-if="phase === 'live'"
      :match="annotated"
      :player-a="match.a"
      :player-b="match.b"
      :surface="match.surface"
      :rank-a="viewerRankA"
      :rank-b="viewerRankB"
      :preview-event="previewEvent"
      mode="replay"
      proceed-label="To the result"
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
  </TakeoverShell>
</template>

<style scoped>
/* The friendly's own two lines on the F scene's glass plate. MatchScene owns the card, the painting
   and the plate; this is only what is written on it – and it is deliberately the same shape as the
   tournament's pre-match plate, because it is the same object one rung down. */
/* Fills the takeover, same as the tournament's own pre-match scene. */
/* ⚠ NOT `flex: 1` ANY MORE (R15-3) - same reason as TournamentFlow's .tf-scene: the scene is the
   painting's own square since the owner's 01.08 ruling, and stretching a square letterboxes it. */
.pf-scene {
  flex: none;
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
