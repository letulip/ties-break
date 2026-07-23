<script setup lang="ts">
// Package J – Home hub v2: player card, season strip (Phase 3 teaser), this
// week's training/rest plan (presets from the worker), and a restyled news
// feed off the week log. Replaces the Package I status-table/advance-buttons
// layout; "Advance" moved to App.vue's sticky Next-week bar.
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import { WEEK_PLAN_PRESETS, type CoachSetup, type PlayStyle, type WorldEvent } from '../../shared/protocol'

const game = useGameStore()
const avatarUrl = `${import.meta.env.BASE_URL}avatars/jun.png`

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const kidName = computed(() => game.snapshot?.profile.kidName ?? '')
const flag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const ageYears = computed(() => game.snapshot?.ageYears ?? 0)

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
// income live on the Money ledger). Grouped by week, most recent week first;
// milestones are pinned to the top of their own week group (stable sort keeps
// everything else in emission order).
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
      events: [...list].sort((a, b) => (a.type === 'milestone' ? 0 : 1) - (b.type === 'milestone' ? 0 : 1)),
    }))
})
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
            <td>– <span class="pill">Phase 3</span></td>
          </tr>
          <tr>
            <th>Condition</th>
            <td>
              <div class="condition-blocks" title="Phase 4">
                <span v-for="i in 5" :key="i" class="condition-block" :class="{ filled: i <= 4 }"></span>
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

    <section>
      <h2>News</h2>
      <div class="log">
        <p v-if="!newsGroups.length" class="hint" style="margin: 0">No news yet.</p>
        <div v-for="group in newsGroups" :key="group.week" class="news-week">
          <p class="news-week-label">W{{ group.week }}</p>
          <table>
            <tbody>
              <tr v-for="e in group.events" :key="e.id" :class="{ milestone: e.type === 'milestone' }">
                <td>{{ EVENT_EMOJI[e.type] }} {{ e.text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </template>
</template>
