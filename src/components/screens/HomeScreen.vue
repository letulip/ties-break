<script setup lang="ts">
// Package J – Home hub v2: player card, season strip (Phase 3 teaser), this
// week's training/rest plan (presets from the worker), and a restyled news
// feed off the week log. Replaces the Package I status-table/advance-buttons
// layout; "Advance" moved to App.vue's sticky Next-week bar.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import { WEEK_PLAN_PRESETS, type CoachSetup, type PlayStyle, type WorldEvent, type WorldMatch } from '../../shared/protocol'
import { weekRange } from '../../shared/dates'
import { formatShortName } from '../../shared/format'
import { KID_ID, flipScore } from '../../engine/world'
import MatchReplay from '../MatchReplay.vue'
import WeekRecapCard from '../WeekRecapCard.vue'

const game = useGameStore()
const avatarUrl = `${import.meta.env.BASE_URL}avatars/jun.webp`

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
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
const prevKidRank = computed(() => game.snapshot?.prevKidRank ?? null)
// Rank goes UP when the number goes DOWN. null prev (or no change) shows a neutral dash.
const rankMovement = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const now = kidRank.value
  const prev = prevKidRank.value
  if (now === null || prev === null || now === prev) return { dir: 'flat', by: 0 }
  return now < prev ? { dir: 'up', by: prev - now } : { dir: 'down', by: now - prev }
})
const kidPoints = computed(() => game.snapshot?.standings.find((r) => r.isKid)?.points ?? 0)

// --- Condition bar (round-5 item 3): 10 segments, classic red→yellow→green gradient.
// Static 8/10 placeholder until Phase 4 wires the real value (title stays "Phase 4"). --
const CONDITION_SEGMENTS = 10
const CONDITION_FILLED = 8
function conditionColor(i: number): string {
  const hue = ((i - 1) / (CONDITION_SEGMENTS - 1)) * 120 // 0 = red … 120 = green
  return `hsl(${Math.round(hue)}, 72%, 48%)`
}

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

// --- Coach's eye: one flavor line per playStyle (static, owner-approved copy) --
const COACH_QUOTES: Record<PlayStyle, string> = {
  aggressive: 'She hits like it owes her money – now we build the legs to match.',
  counterpuncher: 'She never gives you the same ball twice. Patience is her weapon.',
  'serve-first': 'That serve is ahead of her age – free points are a career.',
  'all-court': 'No holes in her game. Now we find the weapon.',
}
const coachQuote = computed(() => (game.snapshot ? COACH_QUOTES[game.snapshot.profile.playStyle] : ''))

// --- Season strip: static tier ladder, real progression is Phase 3 -----------
const SEASON_TIERS = ['Local U14', 'Regional', 'National', 'ITF Juniors']

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
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <section class="player-card">
      <div class="player-card-top">
        <img class="player-avatar" :src="avatarUrl" alt="" />
        <div>
          <div class="player-name">{{ kidName }} {{ flag }}</div>
          <div class="hint" style="margin-top: 2px">age {{ ageYears }}</div>
        </div>
      </div>
      <table style="margin-top: 12px">
        <tbody>
          <tr>
            <th>Junior rank</th>
            <td>
              <span class="rank-value">#{{ kidRank ?? '–' }}</span>
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
            </td>
          </tr>
          <tr>
            <th>Season points</th>
            <td class="num">{{ kidPoints }}</td>
          </tr>
          <tr>
            <th>Condition</th>
            <td>
              <div class="condition-blocks" title="Phase 4">
                <span
                  v-for="i in CONDITION_SEGMENTS"
                  :key="i"
                  class="condition-block"
                  :class="{ filled: i <= CONDITION_FILLED }"
                  :style="i <= CONDITION_FILLED ? { background: conditionColor(i) } : undefined"
                ></span>
              </div>
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
        <template v-for="(tier, i) in SEASON_TIERS" :key="tier">
          <span class="pill" :class="{ ok: i === 0 }">{{ tier }}</span>
          <span v-if="i < SEASON_TIERS.length - 1" class="strip-arrow">→</span>
        </template>
      </div>
      <p class="hint">unlocks in Phase 3</p>
    </section>

    <section>
      <h2>This week</h2>
      <p class="hint" style="margin: 0 0 8px">{{ weekDates }}</p>
      <div class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · W{{ nearestEntered.week }}
        </span>
        <span v-else class="hint" style="margin: 0">No event – training week</span>
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
  </template>
</template>
