<script setup lang="ts">
// Package J – Home hub v2: player card, season strip (Phase 3 teaser), this
// week's training/rest plan (presets from the worker), and a restyled news
// feed off the week log. Replaces the Package I status-table/advance-buttons
// layout; "Advance" moved to App.vue's sticky Next-week bar.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { WEEK_PLAN_PRESETS, type CoachSetup, type PlayStyle, type WorldEvent, type WorldMatch } from '../../shared/protocol'
import type { TierId } from '../../engine/season/types'
import { weekRange } from '../../shared/dates'
import { formatShortName, rankLabel } from '../../shared/format'
import { KID_ID, flipScore, isBlackoutWeek } from '../../engine/world'
import { TIERS } from '../../engine/season/calendar'
import { ECONOMY } from '../../engine/economy'
import MatchReplay from '../MatchReplay.vue'
import WeekRecapCard from '../WeekRecapCard.vue'
import RankHelpDialog from '../RankHelpDialog.vue'
import { playSfx } from '../../audio/sfx'

const game = useGameStore()
const avatarUrl = `${import.meta.env.BASE_URL}avatars/jun.webp`

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
const weekDates = computed(() => weekRange(week.value))

// --- Round 5 item 9 (light): a dismissible week-recap card, shown after a non-tournament
// week resolves. Keyed by week number so it re-appears fresh every week without extra state.
const hasTournamentEventThisWeek = computed(() =>
  (game.snapshot?.events ?? []).some((e) => e.type === 'tournament' && e.week === week.value),
)
const dismissedRecapWeek = ref<number | null>(null)
const showRecap = computed(
  () =>
    !!game.snapshot &&
    week.value > 0 &&
    !hasTournamentEventThisWeek.value &&
    !game.snapshot.pending &&
    dismissedRecapWeek.value !== week.value,
)
function dismissRecap(): void {
  dismissedRecapWeek.value = week.value
}

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

// --- Availability chip (Season-Life slice B, live in slice C): a plain-language read on
// whether she can compete. "Fit" (green) when clear; "School break – exams" (grey) when this
// or next week is a blackout; red with the injury kind + return week while she is out. --
const availabilityChip = computed<{ label: string; tone: 'green' | 'grey' | 'red' } | null>(() => {
  const s = game.snapshot
  if (!s) return null
  if (s.injury) return { label: `Injured: ${s.injury.kind} – back wk ${s.week + s.injury.weeksRemaining}`, tone: 'red' }
  if (isBlackoutWeek(s.week) || isBlackoutWeek(s.week + 1)) return { label: 'School break – exams', tone: 'grey' }
  return { label: 'Fit', tone: 'green' }
})

// --- Physio toggle (Season-Life slice C): reflects/sets snapshot.physioActive, which now
// actually bills a weekly retainer (corridor-scaled to the family's means) and in exchange
// lowers injury risk and shortens recoveries. The cost range is shown next to the toggle. --
const physioActive = computed(() => game.snapshot?.physioActive ?? false)
function togglePhysio(): void {
  game.setPhysio(!physioActive.value)
}
const physioCostLabel = computed(() => {
  const background = game.snapshot?.profile.background
  if (!background) return ''
  const [lo, hi] = ECONOMY.physio.retainerPerWeekCents
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[background]
  return `$${Math.round((lo * cLo) / 100)}–${Math.round((hi * cHi) / 100)}/wk`
})

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
// accent, an untouched one a muted dash, and ITF is still locked. --
const SEASON_STRIP_TIERS: { id: TierId; short: string }[] = [
  { id: 'local', short: 'Local' },
  { id: 'regional', short: 'Regional' },
  { id: 'national', short: 'National' },
  { id: 'itf', short: 'ITF' },
]
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
type TierChipState = 'locked' | 'outgrown' | 'unlocked' | 'reached' | 'idle'
interface TierChip {
  id: TierId
  short: string
  label: string
  state: TierChipState
  title: string
}
const seasonChips = computed<TierChip[]>(() =>
  SEASON_STRIP_TIERS.map(({ id, short }) => {
    const locked = id === 'itf' // ITF stays locked in Phase 3
    const best = game.snapshot?.bestFinishByTier[id]
    const reached = !locked && best !== undefined
    const outgrown = !locked && kidPoints.value > TIERS[id].enterPointBand[1]
    const unlocked =
      !locked && !outgrown && !reached && (game.snapshot?.upcoming ?? []).some((e) => e.tier === id && e.eligible)
    const state: TierChipState = locked
      ? 'locked'
      : outgrown
        ? 'outgrown'
        : unlocked
          ? 'unlocked'
          : reached
            ? 'reached'
            : 'idle'
    const label = locked ? '🔒' : unlocked ? 'Unlocked – enter your first!' : reached ? shortFinish(best!) : '–'
    const title =
      state === 'locked'
        ? 'ITF Junior – locked in Phase 3'
        : state === 'outgrown'
          ? `Outgrown – her best ${short} result stays on the books`
          : state === 'unlocked'
            ? `Eligible now – enter a ${short} event to open the account`
            : `Best ${short} finish`
    return { id, short, label, state, title }
  }),
)

// --- This week: preset pills drive game.setPlan(); spend range is a UI-side
// mirror of src/engine/world.ts EXPENSE_RANGE × planExpenseFactor(train) – kept
// here as a display estimate, not the source of truth for the actual draw. ---
const PRESET_ORDER = ['grind', 'balanced', 'light'] as const
const PRESET_LABEL: Record<(typeof PRESET_ORDER)[number], string> = {
  grind: 'Grind 85/15',
  balanced: 'Balanced 75/25',
  light: 'Light 60/40',
}
const EXPENSE_RANGE_DOLLARS: Record<CoachSetup, [number, number]> = {
  hired: [250, 700],
  parent: [120, 400],
}

const plan = computed(() => game.snapshot?.plan ?? WEEK_PLAN_PRESETS.balanced)
const activePreset = computed(() => {
  const p = game.snapshot?.plan
  if (!p) return null
  return PRESET_ORDER.find((k) => WEEK_PLAN_PRESETS[k].train === p.train && WEEK_PLAN_PRESETS[k].rest === p.rest) ?? null
})
const spendRange = computed<[number, number]>(() => {
  if (!game.snapshot) return [0, 0]
  const factor = 0.55 + 0.006 * game.snapshot.plan.train
  const [lo, hi] = EXPENSE_RANGE_DOLLARS[game.snapshot.profile.coachSetup]
  return [Math.round(lo * factor), Math.round(hi * factor)]
})

// --- This week: the kid's nearest entered event (soonest upcoming week with
// `entered: true`), or a plain "training week" hint when nothing is entered.
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)

// Round-8 R8-4: once this week's tournament has been played, the card's bottom line carries
// the kid's LATEST match score (kid-perspective), read straight off the snapshot's match
// events for the current week – no engine extension. Empty on non-tournament weeks.
const thisWeekScore = computed<string | null>(() => {
  const events = game.snapshot?.events ?? []
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'match' && e.week === week.value && e.match?.score) return kidScoreOf(e.match)
  }
  return null
})

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
      <div class="player-card-top">
        <img class="player-avatar" :src="avatarUrl" alt="" />
        <div>
          <div class="player-name">{{ kidFullName }} {{ flag }}</div>
          <div class="hint" style="margin-top: 2px">age {{ ageYears }}</div>
        </div>
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
          <tr>
            <th>Season points</th>
            <td class="num">{{ kidPoints }}</td>
          </tr>
          <tr>
            <th>Condition</th>
            <td>
              <div class="condition-cell">
                <div class="condition-blocks" :title="`Condition ${Math.round(condition)}/100`">
                  <span
                    v-for="i in CONDITION_SEGMENTS"
                    :key="i"
                    class="condition-block"
                    :class="{ filled: i <= conditionFilled }"
                    :style="i <= conditionFilled ? { background: conditionColor(i) } : undefined"
                  ></span>
                </div>
                <span v-if="availabilityChip" class="pill avail-chip" :class="availabilityChip.tone">
                  {{ availabilityChip.label }}
                </span>
              </div>
              <label class="physio-toggle">
                <input type="checkbox" :checked="physioActive" :disabled="game.busy" @change="togglePhysio" />
                <span>Physio recovery</span>
                <span class="hint physio-cost">{{ physioCostLabel }}</span>
              </label>
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
              outgrown: chip.state === 'outgrown',
            }"
            :title="chip.title"
          >{{ chip.short }} · {{ chip.label }}</span>
          <span v-if="i < seasonChips.length - 1" class="strip-arrow">→</span>
        </template>
      </div>
    </section>

    <section>
      <h2>This week</h2>
      <p class="hint" style="margin: 0 0 8px">{{ weekDates }}</p>
      <div class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · W{{ nearestEntered.week }}
        </span>
        <span v-else class="hint" style="margin: 0">No event – training week</span>
        <!-- Round-8 R8-4: latest played match score of this week's tournament, once available. -->
        <span v-if="thisWeekScore" class="this-week-score num">Latest match: {{ thisWeekScore }}</span>
      </div>
      <div class="option-row" style="margin-top: 10px">
        <button
          v-for="p in PRESET_ORDER"
          :key="p"
          class="option-pill"
          :class="{ selected: activePreset === p }"
          :disabled="game.busy"
          @click="game.setPlan(WEEK_PLAN_PRESETS[p])"
        >
          {{ PRESET_LABEL[p] }}
        </button>
      </div>
      <div class="controls" style="margin-top: 10px">
        <span class="pill">Training {{ plan.train }}% · Rest {{ plan.rest }}%</span>
      </div>
      <div class="spend-row">
        <span class="hint">Planned spend</span>
        <span class="negative num">${{ spendRange[0] }}–${{ spendRange[1] }}</span>
      </div>
    </section>

    <WeekRecapCard v-if="showRecap" @dismiss="dismissRecap" />

    <section>
      <h2>News</h2>
      <div class="log">
        <p v-if="!newsGroups.length" class="hint" style="margin: 0">No news yet.</p>
        <div v-for="group in newsGroups" :key="group.week" class="news-week">
          <p class="news-week-label">W{{ group.week }}</p>
          <table>
            <tbody>
              <tr v-for="e in group.events" :key="e.id" :class="{ milestone: e.type === 'milestone' }">
                <td v-if="e.type === 'match' && e.match" class="news-match-cell">
                  <button class="news-match-btn sfx-watch" @click="openReplay(e)">
                    <span class="nm-lines">
                      <span class="nm-players">{{ kidShort }} vs {{ oppShort(e.match) }}</span>
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

    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <RankHelpDialog v-if="showRankHelp" @close="showRankHelp = false" />
  </template>
</template>
