<script lang="ts">
// R9-18: TRUE module scope (a plain script block, compiled once per module – NOT per mount).
// The screen re-mounts on every tab switch (App.vue v-if), so a `<script setup>` ref forgets
// the dismissal and the recap card pops back – the owner's "appears sometimes". Keyed by
// career+week so it can never leak across careers; a page reload re-arms it (acceptable).
// R13-12 moved this mechanism here from HomeScreen.vue, WITH the card it guards.
import { ref as moduleRef } from 'vue'
const dismissedRecapKey = moduleRef<string | null>(null)
</script>

<script setup lang="ts">
// R13-12 – the "This week" tab (the owner's #12). Home became the diary page; the pieces that
// DECIDE and RECAP the week live here now: the week's status (the nearest entered event + this
// week's latest score), the training-plan presets, the planned spend, and the WeekRecapCard.
// Each concern is its own <section>, so the economy wave's future controls (coach settings etc.)
// land as sibling sections instead of a rebuild.
//
// The sticky advance bar is NOT here and must never move here – it is App.vue's, global on every
// tab (R13-12: the R9-9a "no tab can strand the career" guarantee rides on that bar now).
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'
import { WEEK_PLAN_PRESETS, type CoachSetup, type WorldMatch } from '../../shared/protocol'
import { weekLabel, weekRange } from '../../shared/dates'
import { KID_ID, flipScore } from '../../engine/world'
import { recapExists } from '../../composables/weekRecap'
import WeekRecapCard from '../WeekRecapCard.vue'

const game = useGameStore()

const week = computed(() => game.snapshot?.week ?? 0)
const weekDates = computed(() => weekRange(week.value))

// --- Round 5 item 9 / R9-18 – the week-recap card. THE RULE (owner: it appeared
// "sometimes"): the card shows after EVERY resolved non-tournament week – including
// multi-week advances, where it recaps the LATEST resolved week – and never after a
// tournament week (the flow's own cards cover that one) or while a reveal is pending.
// Week 0 (career start) has nothing to recap. A dismissal silences exactly one week.
// R13-12: the EXISTENCE half of the rule moved to composables/weekRecap.ts – the App shell's
// This-week tab dot reads the same predicate, so the card and the dot cannot disagree.
const showRecap = computed(
  () =>
    !!game.snapshot &&
    recapExists(game.snapshot) &&
    dismissedRecapKey.value !== `${game.snapshot.careerId}:${week.value}`,
)
function dismissRecap(): void {
  if (game.snapshot) dismissedRecapKey.value = `${game.snapshot.careerId}:${week.value}`
}

// --- This week: the kid's nearest entered event (soonest upcoming week with
// `entered: true`), or a plain "training week" hint when nothing is entered.
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)

// Round-8 R8-4: once this week's tournament has been played, the status block carries
// the kid's LATEST match score (kid-perspective), read straight off the snapshot's match
// events for the current week – no engine extension. Empty on non-tournament weeks.
function kidScoreOf(m: WorldMatch): string {
  if (!m.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
}
const thisWeekScore = computed<string | null>(() => {
  const events = game.snapshot?.events ?? []
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type === 'match' && e.week === week.value && e.match?.score) return kidScoreOf(e.match)
  }
  return null
})

// --- The plan: preset pills drive game.setPlan(); spend range is a UI-side
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
</script>

<template>
  <template v-if="game.snapshot">
    <section>
      <h2>This week</h2>
      <p class="hint" style="margin: 0 0 8px">{{ weekDates }}</p>
      <div class="this-week-status">
        <span v-if="nearestEntered" class="pill ok">
          {{ nearestEntered.label }} · {{ nearestEntered.surface }} · {{ weekLabel(nearestEntered.week) }}
        </span>
        <span v-else class="hint" style="margin: 0">No event – training week</span>
        <!-- Round-8 R8-4: latest played match score of this week's tournament, once available. -->
        <span v-if="thisWeekScore" class="this-week-score num">Latest match: {{ thisWeekScore }}</span>
      </div>
    </section>

    <section>
      <h2>Training plan</h2>
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
      <!-- R9-8: the plan reads as unbordered plain text, ONE line, with this week's
           tournament name when one is entered (the pill frame is gone). -->
      <p class="this-week-plan">
        Training {{ plan.train }}% · Rest {{ plan.rest }}%<template v-if="nearestEntered">
          · {{ nearestEntered.label }} – {{ weekLabel(nearestEntered.week) }}</template>
      </p>
      <div class="spend-row">
        <span class="hint">Planned spend</span>
        <span class="negative num">${{ spendRange[0] }}–${{ spendRange[1] }}</span>
      </div>
    </section>

    <WeekRecapCard v-if="showRecap" @dismiss="dismissRecap" />
  </template>
</template>
