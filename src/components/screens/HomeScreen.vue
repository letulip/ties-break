<script setup lang="ts">
// Package J – Home hub, R13-12: the DIARY page. Player card (photo, phrase, condition + note),
// season strip, a compact next-tournament summary, news, Memory. The This-week block (plan
// presets, planned spend) and the week-recap card moved to their own tab –
// screens/ThisWeekScreen.vue – together with the R9-18 module-scope recap dismissal; "Advance"
// stays in App.vue's sticky Next-week bar (global on every tab).
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import type { PlayStyle, WorldEvent, WorldMatch } from '../../shared/protocol'
import type { TierId } from '../../engine/season/types'
import { weekLabel } from '../../shared/dates'
import { formatShortName, rankLabel } from '../../shared/format'
import { KID_ID, flipScore, practiceCaution } from '../../engine/world'
// R13-3: the calendar week-type predicates left with the availability chip – the D1 note names
// the exam/off-season weeks itself now (engine-licensed), so nothing here re-derives them.
import { ECONOMY } from '../../engine/economy'
import { useKidEmotion } from '../../composables/kidEmotion'
import { facePoint } from '../../art/faceRects'
import { portraitUrl as portraitArtUrl } from '../../art/preload'
import { TIER_SHORT } from '../../composables/weekAhead'
// R11-5a: the ONE tier-state rule, shared with the Season screen's lock labels + open-tier note.
import { isTierOpen, useTierStates } from '../../composables/tierState'
import MatchReplay from '../MatchReplay.vue'
import RankHelpDialog from '../RankHelpDialog.vue'
import { playSfx } from '../../audio/sfx'

const game = useGameStore()
// Diary-1 (D2): the top of Home is the BIG painting now – the same emotion-correct 512px art the
// Kid screen shows (already preloaded per band, so this costs zero new bytes), landscape-cropped
// with `object-fit: cover` and steered by the face centre from the ONE crop table
// (src/art/faceRects.ts), so the window shows her face plus the scene around it. The owner's ask,
// verbatim: «фоточку на home давай ещё побольше … и кроп … не только на лицо, но и чуть больше из
// кадра захватим». The emotion is the ENGINE's decision (snapshot.diary), same as the phrase
// under the name – image and words cannot disagree by construction.
const { portraitUrl, stage, emotion } = useKidEmotion()
const photoStyle = computed(() => {
  const p = facePoint(`${stage.value}-${emotion.value}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})
// The one phrase under her name (D2) – null on a deliberately quiet week.
const photoLine = computed(() => game.snapshot?.diary.photoLine ?? null)
// The WHY line beside the condition bar (D1).
const conditionNote = computed(() => game.snapshot?.diary.conditionNote ?? '')
// The Memory card (D10): a past milestone + the painting from the band she was in THEN.
const memory = computed(() => game.snapshot?.diary.memory ?? null)
const memoryArt = computed(() =>
  memory.value ? portraitArtUrl(memory.value.stage, memory.value.emotion) : '',
)
const memoryStyle = computed(() => {
  if (!memory.value) return undefined
  const p = facePoint(`${memory.value.stage}-${memory.value.emotion}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

// The player CARD shows the full name (the header keeps the first name only). (round-7 item 5c)
const kidFullName = computed(() => {
  const p = game.snapshot?.profile
  return p ? `${p.kidName} ${p.kidLastName}`.trim() : ''
})
const flag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const ageYears = computed(() => game.snapshot?.ageYears ?? 0)
const week = computed(() => game.snapshot?.week ?? 0)

// R13-12: the week-recap card (and the R9-18 module-scope dismissal that guards it) moved to
// screens/ThisWeekScreen.vue with the rest of the This-week block.

// --- Player-card snapshot: real rank, week-over-week movement, season points ----
const kidRank = computed(() => game.snapshot?.kidRank ?? null)
// 'Unranked' until she's earned a counting result (see rankLabel): a point-less kid isn't
// really ranked, so we don't flash a misleading '#1' on a brand-new career.
const ranked = computed(() => (game.snapshot?.countingResults.length ?? 0) > 0)
const prevKidRank = computed(() => game.snapshot?.prevKidRank ?? null)
// Rank goes UP when the number goes DOWN. null prev (or no change) shows a neutral dash.
const rankMovement = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const now = kidRank.value
  const prev = prevKidRank.value
  if (now === null || prev === null || now === prev) return { dir: 'flat', by: 0 }
  return now < prev ? { dir: 'up', by: prev - now } : { dir: 'down', by: now - prev }
})
const kidPoints = computed(() => game.snapshot?.standings.find((r) => r.isKid)?.points ?? 0)

// --- Condition bar (Season-Life slice B): 10 segments driven by the REAL per-week condition,
// round(condition/10) filled. The classic red→green ramp holds when she is fresh; the bar reads
// amber as it approaches a tier floor and red once it drops below the entry floor. --
const CONDITION_SEGMENTS = 10
const condition = computed(() => game.snapshot?.condition ?? 0)
const conditionFilled = computed(() => Math.round(condition.value / 10))
const conditionStatus = computed<'red' | 'amber' | 'ok'>(() => {
  const c = condition.value
  if (c < ECONOMY.availability.minConditionToEnter.local) return 'red' // below the lowest floor – can't enter anything
  if (c < ECONOMY.availability.minConditionToEnter.national) return 'amber' // approaching the higher-tier floors
  return 'ok'
})
function conditionColor(i: number): string {
  if (conditionStatus.value === 'red') return 'hsl(0, 72%, 48%)'
  if (conditionStatus.value === 'amber') return 'hsl(38, 90%, 50%)'
  const hue = ((i - 1) / (CONDITION_SEGMENTS - 1)) * 120 // 0 = red … 120 = green
  return `hsl(${Math.round(hue)}, 72%, 48%)`
}

// --- R13-3: the availability chip LEFT the condition row (owner: the squares + the D1 note
// already carry it – the "Fit" chip duplicated both and spent the space). The states it knew are
// covered without it: injured / exams / off-season all speak through the engine-licensed D1 note
// ("Out with the ankle soreness – 2 weeks to go." names the kind and the clock), and the chip
// idiom itself lives on where it still earns its place (the Season screen's red layoff chips).
// The ONE thing only the chip knew – the practice-strain warning – folds into the note area
// below as its own amber line, read off the same pure predicate the planner sheet asks
// (practiceCaution, for "one more match next week"), so the warning and the booking sheet can
// never disagree. --
const strainNote = computed<string | null>(() => {
  const s = game.snapshot
  if (!s || s.injury) return null
  const strain = practiceCaution({
    condition: s.condition,
    practiceWeeks: s.practices.map((p) => p.week),
    week: s.week + 1,
  })
  if (strain.level !== 'caution') return null
  // The streak arm is gated on real strain (Wave-2), so the run it names varies – read the
  // count off the same predicate instead of hard-coding "Third".
  return strain.reasons.includes('tired')
    ? 'Worn out – she needs a rest week'
    : `${strain.streakWeeks} match weeks in a row`
})

// R9-5: the physio toggle moved to MoneyScreen's Budget section – it is a spending decision
// (and its row broke the condition cell's layout here anyway).

// --- News match rows (round-5 item 8): "V. Martin vs S. Everts" / kid-perspective score.
const kidShort = computed(() => {
  const p = game.snapshot?.profile
  return p ? formatShortName(`${p.kidName} ${p.kidLastName}`) : ''
})
function oppShort(m: WorldMatch): string {
  return formatShortName(m.oppName)
}
function kidScoreOf(m: WorldMatch): string {
  if (!m.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
}

// --- Coach's eye: a rotating pool of 5 lines per play style (round-7 item 5d). The
// existing owner-approved line is #1 of each pool; the visible line rotates every 4 weeks by
// `Math.floor(week / 4) % 5` – deterministic (same 4-week block -> same line) but no longer
// churning weekly (owner: a coach's read on the kid should settle for a while, not flip). --
const COACH_QUOTES: Record<PlayStyle, [string, string, string, string, string]> = {
  aggressive: [
    'She hits like it owes her money – now we build the legs to match.',
    'First strike on every point – we just need the misses to come down.',
    'When she is on, nobody lives with her. The job is the quiet days.',
    'She wants the short ball so badly – let us make her earn it.',
    'Big cuts, big heart – footwork turns that into wins.',
  ],
  counterpuncher: [
    'She never gives you the same ball twice. Patience is her weapon.',
    'She would rally till dark – now we teach her when to end it.',
    'Nothing rushes her. Next she needs a way to hurt you.',
    'Every ball comes back – opponents beat themselves against her.',
    'Defense first, always – the finishing shot is next.',
  ],
  'serve-first': [
    'That serve is ahead of her age – free points are a career.',
    'She holds serve in her sleep – now we break the return open.',
    'Big first ball, calm eyes. The second serve is the growth area.',
    'On serve she fears no one. Rally tennis is the homework.',
    'Aces buy her time – we spend it teaching the rest of the court.',
  ],
  'all-court': [
    'No holes in her game. Now we find the weapon.',
    'She can play every style – picking one under pressure is the skill.',
    'Comfortable everywhere, dangerous nowhere yet. That changes this year.',
    'She reads the game beautifully – now the hands must catch up.',
    'Versatile and calm. We are hunting for the shot that ends points.',
  ],
}
const coachQuote = computed(() =>
  game.snapshot ? COACH_QUOTES[game.snapshot.profile.playStyle][Math.floor(week.value / 4) % 5] : '',
)

// --- Season strip: REAL tier progress (round-7 item 3). Reads the kid's best finish per
// tier off the snapshot: a reached tier shows the short finish label (W/F/SF/QF/R16…) in
// accent, an untouched one a muted dash. Ladder-up: the strip is the whole six-rung ladder
// (the old locked placeholder is gone – every tier is live now, gated only by points and age).
// R10-7: the short names now come from the ONE shared table (composables/weekAhead.ts), which the
// dynamic Next-week button also reads – so the strip and the button can never call the same tier
// two different things. This array only carries the LADDER ORDER.
const SEASON_STRIP_TIERS: { id: TierId; short: string }[] = (
  ['local', 'regional', 'national', 'j30', 'j60', 'j300'] as const
).map((id) => ({ id, short: TIER_SHORT[id] }))
// finish index -> short label (reuses the finish-index convention: 0 = champion).
function shortFinish(finish: number): string {
  if (finish === 0) return 'W'
  if (finish === 1) return 'F'
  if (finish === 2) return 'SF'
  if (finish === 3) return 'QF'
  return `R${2 ** finish}`
}
// Round-8 R8-8 (owner 25.07) adds two states on top of reached/untouched/locked:
//  - unlocked: never entered but currently ENTERABLE (an upcoming event of the tier is
//    `eligible`) – an accent call-to-action instead of the old grey dash;
//  - outgrown: her windowed points sit past the tier's entry ceiling (same band the entry
//    gate uses) – the card recedes to a dim outline while the name + best result stay accent.
// Ladder-up: `locked` no longer means "a tier we haven't built yet" – it means the AGE gate has
// not opened (the junior tour is 13+). At our start age of 14 nothing is locked; the state stays
// wired for the childhood prologue.
//
// R11-5a – the ladder's WORST state was the dash. Four completely different situations printed the
// same "National · –": she is 100 points short; she is past the level; she can walk into one next
// week; and – the one that cost the owner a whole season of confusion – she can enter it any time but
// none is scheduled inside the 8-week horizon. The AVAILABILITY half of the chip is now decided by
// the shared rule in composables/tierState.ts (the same one the Season screen reads, so the two can
// never disagree), and this file only composes it with her ACHIEVEMENT – the best finish she has on
// the books for that tier. Nothing about a band or a threshold is re-derived here any more.
type TierChipState = 'locked' | 'outgrown' | 'unlocked' | 'waiting' | 'reached' | 'idle'
interface TierChip {
  id: TierId
  short: string
  label: string
  state: TierChipState
  title: string
}
const tierStates = useTierStates()
const seasonChips = computed<TierChip[]>(() =>
  SEASON_STRIP_TIERS.map(({ id, short }, i) => {
    const avail = tierStates.value[i]
    const best = game.snapshot?.bestFinishByTier[id]
    // Her earned result outranks every open state: once a tier is on the books the chip's job is to
    // show the finish, and the availability lives in the tooltip.
    const reached = isTierOpen(avail) && best !== undefined
    const state: TierChipState =
      avail.kind === 'age-locked' || avail.kind === 'locked'
        ? 'locked'
        : avail.kind === 'outgrown'
          ? 'outgrown'
          : reached
            ? 'reached'
            : // 'capped' rides the SAME chip state as 'unscheduled', and deliberately so: both mean
              // "not this week, and not because anything is wrong" – a tier she has every right to
              // that simply is not available to her yet. The padlock would be a lie (the allowance
              // returns when the season turns) and 'unlocked' would be worse still, inviting her to
              // "enter your first!" an event the engine will refuse. The chip prints the shared
              // rule's own note ("Year limit – 14 of 14") and the tooltip carries the reset.
              avail.kind === 'unscheduled' || avail.kind === 'capped'
              ? 'waiting'
              : 'unlocked'
    // Every locked/waiting label is the shared rule's own wording, verbatim – one sentence, two
    // screens. Only the two states this file OWNS (a finish on the books, an outgrown tier she never
    // played) are worded here.
    const label =
      state === 'locked'
        ? `🔒 ${avail.note}`
        : state === 'reached'
          ? shortFinish(best!)
          : state === 'outgrown'
            ? (best !== undefined ? shortFinish(best) : avail.note)
            : state === 'waiting'
              ? avail.note
              : 'Unlocked – enter your first!'
    const title =
      state === 'reached'
        ? `Best ${short} finish · ${avail.title}`
        : state === 'outgrown'
          ? `Outgrown – her best ${short} result stays on the books`
          : avail.title
    return { id, short, label, state, title }
  }),
)

// --- Next tournament (R13-12): the diary keeps a compact summary of the kid's nearest entered
// event (soonest upcoming week with `entered: true`) – the plan controls that used to sit around
// it live on the This-week tab now (screens/ThisWeekScreen.vue), the calendar on Season.
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)

// --- News: structured events (Package M), non-financial types only (expense/
// income live on the Money ledger). Strictly newest-first: most recent week first,
// and within a week newest event first (descending id). Milestones stay pinned to
// the top of their week group (standing owner decision) – the one exception.
const EVENT_EMOJI: Record<string, string> = {
  info: '💬',
  entry: '📝',
  match: '🎾',
  tournament: '🏁',
  milestone: '🏆',
  injury: '🩹',
  recovery: '💪',
}
interface NewsGroup {
  week: number
  events: WorldEvent[]
}
const newsGroups = computed<NewsGroup[]>(() => {
  const events = (game.snapshot?.events ?? []).filter((e) => e.type !== 'expense' && e.type !== 'income')
  const byWeek = new Map<number, WorldEvent[]>()
  for (const e of events) {
    const list = byWeek.get(e.week)
    if (list) list.push(e)
    else byWeek.set(e.week, [e])
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([week, list]) => ({
      week,
      events: [...list].sort((a, b) => {
        const am = a.type === 'milestone' ? 0 : 1
        const bm = b.type === 'milestone' ? 0 : 1
        return am - bm || b.id - a.id // milestones pinned first, then newest-first
      }),
    }))
})

// --- Click a match event -> replay it in the shared MatchReplay overlay ---------
const replayMatch = ref<WorldMatch | null>(null)
function openReplay(e: WorldEvent): void {
  if (e.match) replayMatch.value = e.match
}

// --- Best-6 help popover (round-6): the owner got confused twice by the windowed
// ranking, so a "?" on the Junior rank row opens a plain explanation (RankHelpDialog).
const showRankHelp = ref(false)
function openRankHelp(): void {
  playSfx('clickSoft')
  showRankHelp.value = true
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <section class="player-card">
      <!-- Diary-1 (D2): the living photo card. The full painting, landscape-cropped around her
           face (faceRects), with her name and ONE engine-licensed phrase under it. The 3:2 frame
           is the photo-album print ratio – see style.css .photo-card for the choice. -->
      <div class="photo-card">
        <img class="photo-card-img" :src="portraitUrl" :style="photoStyle" alt="" />
      </div>
      <div class="photo-caption">
        <div class="player-name">{{ kidFullName }} {{ flag }}</div>
        <div class="hint" style="margin-top: 2px">age {{ ageYears }}</div>
        <p v-if="photoLine" class="photo-line">{{ photoLine }}</p>
      </div>
      <table style="margin-top: 12px">
        <tbody>
          <tr>
            <th>Junior rank</th>
            <td>
              <div class="rank-row">
                <span class="rank-value">{{ rankLabel(kidRank ?? 0, ranked) }}</span>
                <template v-if="ranked">
                  <span
                    v-if="rankMovement.dir === 'up'"
                    class="rank-move up"
                    :title="`Up ${rankMovement.by} since last week`"
                  >↑{{ rankMovement.by }}</span>
                  <span
                    v-else-if="rankMovement.dir === 'down'"
                    class="rank-move down"
                    :title="`Down ${rankMovement.by} since last week`"
                  >↓{{ rankMovement.by }}</span>
                  <span v-else class="rank-move flat" title="No change">–</span>
                </template>
                <!-- round-7 item 5a: the "?" sits at the very END of the row (flex spacer). -->
                <button class="rank-help-btn" aria-label="How ranking points work" title="How ranking points work" @click="openRankHelp">?</button>
              </div>
            </td>
          </tr>
          <!-- R10-8: "points" -> "pts". Together with the widened label column (.player-card th
               nowraps and takes exactly the width its labels need) both this row and "Junior rank"
               above stay on ONE line at 375px. -->
          <tr>
            <th>Season pts</th>
            <td class="num">{{ kidPoints }}</td>
          </tr>
          <tr>
            <th>Condition</th>
            <td>
              <div class="condition-cell">
                <!-- D3: HOME speaks words, not percentages – the number (and its old tooltip) live
                     on Stats/the planner. The squares carry the level, the note carries the word
                     (R13-3: the chip that used to sit here duplicated both and is gone). -->
                <div class="condition-blocks">
                  <span
                    v-for="i in CONDITION_SEGMENTS"
                    :key="i"
                    class="condition-block"
                    :class="{ filled: i <= conditionFilled }"
                    :style="i <= conditionFilled ? { background: conditionColor(i) } : undefined"
                  ></span>
                </div>
              </div>
              <!-- D1: one line of WHY, from real facts of the last tick (engine-licensed). -->
              <p class="condition-note">{{ conditionNote }}</p>
              <!-- R13-3: the practice-strain warning, folded out of the removed chip. -->
              <p v-if="strainNote" class="condition-note warn">{{ strainNote }}</p>
            </td>
          </tr>
        </tbody>
      </table>
      <hr class="card-divider" />
      <p class="hint" style="margin: 0 0 4px">Coach's eye</p>
      <p class="coach-quote">&ldquo;{{ coachQuote }}&rdquo;</p>
    </section>

    <section>
      <h2>Season</h2>
      <div class="season-strip">
        <template v-for="(chip, i) in seasonChips" :key="chip.id">
          <span
            class="pill tier-chip"
            :class="{
              ok: chip.state === 'reached',
              muted: chip.state === 'idle',
              locked: chip.state === 'locked',
              unlocked: chip.state === 'unlocked',
              waiting: chip.state === 'waiting',
              outgrown: chip.state === 'outgrown',
            }"
            :title="chip.title"
          >{{ chip.short }} · {{ chip.label }}</span>
          <span v-if="i < seasonChips.length - 1" class="strip-arrow">→</span>
        </template>
      </div>
    </section>

    <!-- R13-12: the diary's compact next-tournament summary – the pill idiom the This-week
         status block used, kept here so Home still answers "what is she building toward?".
         The plan controls and the recap moved to the This-week tab. -->
    <section>
      <h2>Next tournament</h2>
      <div class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · {{ weekLabel(nearestEntered.week) }}
        </span>
        <span v-else class="hint" style="margin: 0">Nothing entered yet</span>
      </div>
    </section>

    <section>
      <h2>News</h2>
      <div class="log">
        <p v-if="!newsGroups.length" class="hint" style="margin: 0">No news yet.</p>
        <div v-for="group in newsGroups" :key="group.week" class="news-week">
          <p class="news-week-label">{{ weekLabel(group.week) }}</p>
          <table>
            <tbody>
              <tr v-for="e in group.events" :key="e.id" :class="{ milestone: e.type === 'milestone' }">
                <td v-if="e.type === 'match' && e.match" class="news-match-cell">
                  <button class="news-match-btn sfx-watch" @click="openReplay(e)">
                    <span class="nm-lines">
                      <span class="nm-players">
                        {{ kidShort }} vs {{ oppShort(e.match) }}
                        <!-- Season planner: a friendly is watchable but pays nothing – say so, so
                             the news feed never passes a practice match off as a real result. -->
                        <span v-if="e.friendly" class="pill muted nm-friendly">practice</span>
                      </span>
                      <span class="nm-score num">{{ kidScoreOf(e.match) }}</span>
                    </span>
                    <span class="watch-cue">Watch</span>
                  </button>
                </td>
                <td v-else>{{ EVENT_EMOJI[e.type] }} {{ e.text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- D10: the Memory card – an anniversary, or the deterministic every-few-weeks echo. The
         painting is from the age band she was in at the milestone's week: time, made visible. -->
    <section v-if="memory" class="memory-card">
      <h2>Memory · {{ memory.whenLabel }}</h2>
      <div class="memory-body">
        <img class="memory-photo" :src="memoryArt" :style="memoryStyle" alt="" />
        <p class="memory-line">{{ memory.line }}</p>
      </div>
    </section>

    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <RankHelpDialog v-if="showRankHelp" @close="showRankHelp = false" />
  </template>
</template>
