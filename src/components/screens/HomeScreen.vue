<script setup lang="ts">
// epic/redesign-home, slice A – HOME AS A DIARY PAGE (the owner's redesign, 28.07).
//
// This is docs/specs/family-diary.md D9/D12, the restructure the doc deliberately parked ("SOON,
// after D2 proves the direction"). D2 proved it. The page, top to bottom:
//
//   hero    the emotion painting, FULL-BLEED and melting into the page, carrying everything:
//           the date line and two quiet icons across the top, the greeting, her NAME at 42px, her
//           age, her rank chip, and the diary caption on a frosted chip low on the photograph
//   body    her condition – the ten squares and the engine's WHY line – right under the picture
//   cards   a 2x2 grid: next tournament (with the painted venue), the family budget (+ a 12-week
//           chart), the coach's photograph, and the memory polaroid
//   strips  the tier ladder and the news feed, unchanged in substance, restyled as more diary
//
// THE GEOMETRY IS THE OWNER'S EXPORT, docs/design/screens.dc.html block "A. Home", measured off the
// markup: 398/844 of the device for the hero, 42px/800/-0.025em for her name, 17px card corners on
// a #17212b->#121a22 gradient, 10px/800/0.1em lime kickers, the venue arch at 112x136 with a 100deg
// dissolve, the 68px cream polaroid. Where the export and the OWNER's explicit answers disagree the
// owner wins, and three places he ruled on are marked in the template below.
//
// WHAT THIS SCREEN IS NOT ALLOWED TO DO, and did not do before either: derive a single fact of its
// own. The emotion, the caption, the condition note, the greeting, the memory and the tier states
// are all engine/composable decisions; this file lays them out. That is why the painting and the
// words can never disagree.
//
// The advance button is NOT here – it is App.vue's sticky bar, global on every tab (R13-12).
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import type { WorldEvent, WorldMatch } from '../../shared/protocol'
import type { TierId } from '../../engine/season/types'
import { weekDateLine, weekLabel, weekRange } from '../../shared/dates'
import { formatShortName, rankLabel } from '../../shared/format'
import { KID_ID, flipScore, practiceCaution } from '../../engine/world'
import { ECONOMY } from '../../engine/economy'
import { useKidEmotion } from '../../composables/kidEmotion'
import { facePoint } from '../../art/faceRects'
import { coachUrlFor, portraitUrl as portraitArtUrl } from '../../art/preload'
import { venueArtUrl } from '../../art/venues'
import { TIER_SHORT } from '../../composables/weekAhead'
// R11-5a: the ONE tier-state rule, shared with the Season screen's lock labels + open-tier note.
import { isTierOpen, useTierStates } from '../../composables/tierState'
import MatchReplay from '../MatchReplay.vue'
import RankHelpDialog from '../RankHelpDialog.vue'
import { playSfx } from '../../audio/sfx'

// The shell owns `tab`; the notecards that are doors ASK it to move. One event, no router.
// `recapFresh` is App.vue's own This-week dot rule (composables/weekRecap) – it left the bottom bar
// with the tab and is RENDERED here, on the card that opens that screen.
defineProps<{ recapFresh: boolean }>()
const emit = defineEmits<{ navigate: ['money' | 'week' | 'more'] }>()

const game = useGameStore()
// Diary-1 (D2): the top of Home is the BIG painting – the same emotion-correct 512px art the Kid
// screen shows (already preloaded per band, so this costs zero new bytes), landscape-cropped with
// `object-fit: cover` and steered by the face centre from the ONE crop table (src/art/faceRects.ts),
// so the window shows her face plus the scene around it. The emotion is the ENGINE's decision
// (snapshot.diary), same as the caption under it – image and words cannot disagree by construction.
const { portraitUrl, stage, emotion } = useKidEmotion()
const photoStyle = computed(() => {
  const p = facePoint(`${stage.value}-${emotion.value}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})
// The ONE phrase under her name (D2) – null on a deliberately quiet week. It appears exactly once
// on this page, which is the rule the redesign is most careful about: the greeting above is a time
// of day and never a second copy of it (engine/diary.ts greetingFor).
const photoLine = computed(() => game.snapshot?.diary.photoLine ?? null)
const greeting = computed(() => game.snapshot?.diary.greeting ?? '')
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

// The export puts her FIRST NAME alone at 42px – the biggest type in the app, and the point of the
// whole screen. Her full name still reads on the Kid screen and in every standings row.
const kidFirstName = computed(() => game.snapshot?.profile.kidName ?? '')
const flag = computed(() => flagEmoji(game.snapshot?.profile.country ?? ''))
const ageYears = computed(() => game.snapshot?.ageYears ?? 0)
const week = computed(() => game.snapshot?.week ?? 0)

// --- the header line ---------------------------------------------------------------------------
// "W27 2033 · Jun 3 – Jun 9" – OUR week number, the year written out in full (the header has the
// room the 30px status pill does not) and the week's real calendar days. Composed by
// shared/dates.ts and nowhere else, so no surface can invent a second shape for it.
const dateLine = computed(() => weekDateLine(week.value))

// The bell's dot asserts one FACT and not the "unread" it cannot know: this week put something in
// the feed. (The App shell's unread-news dot is a different thing and lives on the Home TAB, where
// it is only ever true while the player is somewhere else.)
const newsThisWeek = computed(() =>
  (game.snapshot?.events ?? []).some(
    (e) => e.week === week.value && e.type !== 'expense' && e.type !== 'income',
  ),
)
function jumpToNews(): void {
  playSfx('clickSoft')
  document.getElementById('diary-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// --- her rank: the page's one table-number -----------------------------------------------------
// The diary doc's structural decision is that numbers stop being the content – the full numeric
// truth lives on Stats and in the wallet. Her RANK survives on Home as a single chip because it is
// the one number that is a story beat rather than a readout, and because it carries the best-6
// explainer the owner needed twice (round-6). Season points went to Stats with the rest.
const kidRank = computed(() => game.snapshot?.kidRank ?? null)
// 'Unranked' until she's earned a counting result (see rankLabel): a point-less kid isn't really
// ranked, so we don't flash a misleading '#1' on a brand-new career.
const ranked = computed(() => (game.snapshot?.countingResults.length ?? 0) > 0)
const prevKidRank = computed(() => game.snapshot?.prevKidRank ?? null)
// Rank goes UP when the number goes DOWN. null prev (or no change) shows a neutral dash.
const rankMovement = computed<{ dir: 'up' | 'down' | 'flat'; by: number }>(() => {
  const now = kidRank.value
  const prev = prevKidRank.value
  if (now === null || prev === null || now === prev) return { dir: 'flat', by: 0 }
  return now < prev ? { dir: 'up', by: prev - now } : { dir: 'down', by: now - prev }
})

// --- Condition bar (Season-Life slice B): 10 segments driven by the REAL per-week condition,
// round(condition/10) filled. The classic red→green ramp holds when she is fresh; the bar reads
// amber as it approaches a tier floor and red once it drops below the entry floor. --
const CONDITION_SEGMENTS = 10
const condition = computed(() => game.snapshot?.condition ?? 0)
const conditionFilled = computed(() => Math.round(condition.value / 10))
const conditionStatus = computed<'red' | 'amber' | 'ok'>(() => {
  const c = condition.value
  if (c < ECONOMY.availability.minConditionToEnter.local) return 'red' // below the lowest floor
  if (c < ECONOMY.availability.minConditionToEnter.national) return 'amber' // near the higher floors
  return 'ok'
})
function conditionColor(i: number): string {
  if (conditionStatus.value === 'red') return 'hsl(0, 72%, 48%)'
  if (conditionStatus.value === 'amber') return 'hsl(38, 90%, 50%)'
  const hue = ((i - 1) / (CONDITION_SEGMENTS - 1)) * 120 // 0 = red … 120 = green
  return `hsl(${Math.round(hue)}, 72%, 48%)`
}

// R13-3: the practice-strain warning, read off the same pure predicate the planner sheet asks
// (practiceCaution, for "one more match next week"), so the warning and the booking sheet can never
// disagree.
const strainNote = computed<string | null>(() => {
  const s = game.snapshot
  if (!s || s.injury) return null
  const strain = practiceCaution({
    condition: s.condition,
    practiceWeeks: s.practices.map((p) => p.week),
    week: s.week + 1,
  })
  if (strain.level !== 'caution') return null
  return strain.reasons.includes('tired')
    ? 'Worn out – she needs a rest week'
    : `${strain.streakWeeks} match weeks in a row`
})

// --- NEXT TOURNAMENT card ----------------------------------------------------------------------
// The kid's nearest ENTERED event. The card is a door: it opens the This-week screen, which is
// where the plan presets, the planned spend and the week recap live (they left the bottom bar with
// that tab – see App.vue's TABS comment).
const nearestEntered = computed(() => game.snapshot?.upcoming.find((e) => e.entered) ?? null)
const nextTierShort = computed(() =>
  nearestEntered.value ? TIER_SHORT[nearestEntered.value.tier] : '',
)
const nextDates = computed(() => (nearestEntered.value ? weekRange(nearestEntered.value.week) : ''))
const nextTravel = computed(() =>
  nearestEntered.value ? formatFunds(-Math.abs(nearestEntered.value.travelCostCents)) : '',
)
// The painted venue. src/art/venues.ts picks it from the event's own id on a purpose-scoped
// sub-stream, so a tournament's photograph is the same one every render, every reload and every
// replay – and it never promises a surface the engine will not play on.
const nextVenue = computed(() => {
  const e = nearestEntered.value
  const s = game.snapshot
  return e && s ? venueArtUrl(e.tier, e.surface, e.id, s.seed) : ''
})

// --- FAMILY BUDGET card ------------------------------------------------------------------------
// The total is the same live figure the wallet's big number shows; the chart is the engine's
// per-week income/expense series over the SAME trailing 12 weeks the wallet's "12 weeks" breakdown
// folds (snapshot.finance.weekly12 – see world.ts financeSeries). Card and wallet read one ledger,
// so they can never disagree about a week. The whole card opens the wallet.
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
function formatFunds(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}
const funds = computed(() => formatFunds(fundsCents.value))

const CHART_SLOT = 10 // viewBox units per week
const CHART_BASELINE = 50 // income grows up from here, spending down
const CHART_REACH = 46 // the tallest a bar may be, either way
interface ChartBar {
  x: number
  inHeight: number
  outHeight: number
}
const budgetChart = computed<{ width: number; bars: ChartBar[]; any: boolean }>(() => {
  const points = game.snapshot?.finance.weekly12 ?? []
  // ONE scale for both directions: income and spending have to be comparable by eye, or the chart
  // says "she earns as much as she spends" on a week where she earned a tenth of it.
  const peak = Math.max(1, ...points.map((p) => Math.max(p.incomeCents, p.expenseCents)))
  return {
    width: Math.max(1, points.length) * CHART_SLOT,
    any: points.some((p) => p.incomeCents > 0 || p.expenseCents > 0),
    bars: points.map((p, i) => ({
      x: i * CHART_SLOT + 2,
      inHeight: (p.incomeCents / peak) * CHART_REACH,
      outHeight: (p.expenseCents / peak) * CHART_REACH,
    })),
  }
})

// --- COACH card --------------------------------------------------------------------------------
// The owner cut the coach's spoken line (the rotating "Coach's eye" pool went with it) and asked
// for his FACE. Portrait + the word, and deliberately nothing else: a sub-label naming the coaching
// setup would either restate the onboarding or invent a job title nobody wrote, and this page's
// whole discipline is that it asserts only what the facts carry. The default portrait per family
// background is the owner's mapping and lives in src/art/preload.ts with the other art URLs.
const coachPhoto = computed(() =>
  game.snapshot ? coachUrlFor(game.snapshot.profile.background) : '',
)

// --- Season strip: REAL tier progress. Reads the kid's best finish per tier off the snapshot: a
// reached tier shows the short finish label (W/F/SF/QF/R16…) in accent, an untouched one a muted
// dash. The strip is the whole six-rung ladder. R10-7: the short names come from the ONE shared
// table, which the dynamic Next-week button also reads – so the strip and the button can never call
// the same tier two different things. This array only carries the LADDER ORDER.
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
// R11-5a – the AVAILABILITY half of the chip is decided by the shared rule in
// composables/tierState.ts (the same one the Season screen reads, so the two can never disagree),
// and this file only composes it with her ACHIEVEMENT – the best finish she has on the books for
// that tier. Nothing about a band or a threshold is re-derived here.
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
              // "enter your first!" an event the engine will refuse.
              avail.kind === 'unscheduled' || avail.kind === 'capped'
              ? 'waiting'
              : 'unlocked'
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

// --- News: structured events (Package M), non-financial types only (expense/income live on the
// Money ledger). Strictly newest-first: most recent week first, and within a week newest event
// first (descending id). Milestones stay pinned to the top of their week group.
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

// --- Best-6 help popover (round-6): the owner got confused twice by the windowed ranking, so the
// rank chip itself opens a plain explanation (RankHelpDialog). The redesign folded the separate "?"
// button into the chip – one affordance where there used to be two.
const showRankHelp = ref(false)
function openRankHelp(): void {
  playSfx('clickSoft')
  showRankHelp.value = true
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <div class="diary">
      <!-- 1 + 2. THE HERO. Full-bleed, and it carries the header: the photograph IS the top of the
           page, not a picture placed on it. Two scrims do the work – one darkens the top so the
           date and the icons read over any of the 35 paintings, one takes the picture down into the
           page colour so there is no bottom edge at all. -->
      <div class="diary-hero">
        <img class="diary-hero-img" :src="portraitUrl" :style="photoStyle" alt="" />
        <div class="diary-hero-top"></div>
        <div class="diary-hero-fade"></div>

        <header class="diary-head">
          <!-- OWNER'S RULING over the export, which prints a plain calendar date here: our week
               label with the year in full, then the week's real days. shared/dates.ts owns it. -->
          <p class="diary-date">{{ dateLine }}</p>
          <div class="diary-tools">
            <button class="diary-tool" aria-label="Go to the news feed" title="News" @click="jumpToNews">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
              </svg>
              <span v-if="newsThisWeek" class="diary-tool-dot"></span>
            </button>
            <button class="diary-tool" aria-label="Settings" title="Settings" @click="emit('navigate', 'more')">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3.2"></circle>
                <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        <div class="diary-id">
          <!-- The greeting is the ENGINE's word (morning before the week is played, evening once a
               tournament resolves) and it is never a second copy of the caption below. -->
          <p class="diary-greeting">{{ greeting }}</p>
          <p class="diary-name">{{ kidFirstName }}</p>
          <p class="diary-age">{{ ageYears }} years old {{ flag }}</p>
          <button
            class="diary-rank"
            aria-label="How ranking points work"
            title="How ranking points work"
            @click="openRankHelp"
          >
            <span>{{ rankLabel(kidRank ?? 0, ranked) }}</span>
            <template v-if="ranked">
              <span v-if="rankMovement.dir === 'up'" class="rank-move up">&#8593;{{ rankMovement.by }}</span>
              <span v-else-if="rankMovement.dir === 'down'" class="rank-move down">&#8595;{{ rankMovement.by }}</span>
              <span v-else class="rank-move flat">–</span>
            </template>
          </button>
        </div>

        <!-- THE CAPTION – the one phrase the parent wrote about her week, on a frosted chip. It
             appears exactly once on this page. -->
        <div v-if="photoLine" class="diary-caption">
          <span class="diary-caption-dot"></span>
          <p class="diary-caption-text">{{ photoLine }}</p>
        </div>
      </div>

      <!-- Her body, straight under the photograph. D3: HOME speaks words, not percentages – the
           number and its old tooltip live on Stats and in the planner. -->
      <div class="diary-body">
        <div class="condition-blocks">
          <span
            v-for="i in CONDITION_SEGMENTS"
            :key="i"
            class="condition-block"
            :class="{ filled: i <= conditionFilled }"
            :style="i <= conditionFilled ? { background: conditionColor(i) } : undefined"
          ></span>
        </div>
        <!-- D1: one line of WHY, from real facts of the last tick (engine-licensed). -->
        <p class="condition-note">{{ conditionNote }}</p>
        <p v-if="strainNote" class="condition-note warn">{{ strainNote }}</p>
      </div>

      <!-- 3. THE CARD GRID – the visual signature. Two of the four are doors, and they say so by
           lifting under the finger; the two that are not, do not move. -->
      <div class="card-grid">
        <!-- NEXT TOURNAMENT -> the This-week screen (plan presets, planned spend, week recap). -->
        <button
          class="note-card"
          data-tour="next-tournament"
          @click="emit('navigate', 'week')"
        >
          <p class="note-kicker">Next tournament</p>
          <span v-if="recapFresh" class="note-dot" title="A new week recap is waiting"></span>
          <template v-if="nearestEntered">
            <!-- The painted venue, bleeding off the corner under a diagonal dissolve. -->
            <div class="venue-art">
              <img :src="nextVenue" alt="" />
            </div>
            <p class="note-title">{{ nearestEntered.label }}</p>
            <p class="note-meta">
              <span>{{ nextTierShort }} &middot; {{ nearestEntered.surface }}</span>
              <span>{{ nextDates }}</span>
            </p>
            <div class="note-foot">
              <p class="note-foot-label">Travel budget</p>
              <p class="note-figure">{{ nextTravel }}</p>
            </div>
          </template>
          <p v-else class="note-empty">Nothing entered yet – the calendar is on the Season tab.</p>
        </button>

        <!-- FAMILY BUDGET -> the wallet. OWNER'S RULING over the export, which shows this week's
             income/spent rows: the current TOTAL, plus income and spending over the last 12 weeks. -->
        <button class="note-card" @click="emit('navigate', 'money')">
          <p class="note-kicker">Family budget</p>
          <p class="budget-total" :class="{ negative: fundsCents < 0 }">{{ funds }}</p>
          <div class="budget-rule"></div>
          <p class="budget-window">Last 12 weeks</p>
          <svg
            v-if="budgetChart.any"
            class="budget-chart"
            :viewBox="`0 0 ${budgetChart.width} 100`"
            preserveAspectRatio="none"
            role="img"
            aria-label="Money in and out over the last 12 weeks"
          >
            <template v-for="(bar, i) in budgetChart.bars" :key="i">
              <rect
                class="budget-bar-in"
                :x="bar.x"
                :y="CHART_BASELINE - bar.inHeight"
                width="6"
                :height="bar.inHeight"
              />
              <rect class="budget-bar-out" :x="bar.x" :y="CHART_BASELINE" width="6" :height="bar.outHeight" />
            </template>
            <line class="budget-axis" x1="0" :y1="CHART_BASELINE" :x2="budgetChart.width" :y2="CHART_BASELINE" />
          </svg>
          <p v-else class="note-empty">Nothing has moved yet.</p>
        </button>

        <!-- COACH. OWNER'S RULING over the export, which puts a coach's line and a handwritten
             signature beside the photo: his PHOTOGRAPH and the word, nothing invented. -->
        <article class="note-card card-short">
          <div class="coach-art">
            <img :src="coachPhoto" alt="" />
          </div>
          <p class="note-kicker">Coach</p>
        </article>

        <!-- D10: RECENT MEMORY – the painting from the band she was in THEN, on cream paper,
             tilted and tacked to the card. Time, made visible. -->
        <article class="note-card card-short">
          <p class="note-kicker">Recent memory</p>
          <template v-if="memory">
            <div class="memory-polaroid">
              <img :src="memoryArt" :style="memoryStyle" alt="" />
            </div>
            <span class="memory-tack"></span>
            <p class="memory-line">{{ memory.line }}</p>
            <p class="memory-when">{{ memory.whenLabel }}</p>
          </template>
          <p v-else class="note-empty">Too early for memories.</p>
        </article>
      </div>

      <!-- 4. BELOW THE GRID: the ladder and the feed. Same substance, diary chrome. -->
      <section class="diary-strip">
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
            >{{ chip.short }} &middot; {{ chip.label }}</span>
            <span v-if="i < seasonChips.length - 1" class="strip-arrow">&#8594;</span>
          </template>
        </div>
      </section>

      <section id="diary-news" class="diary-strip">
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
    </div>

    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <RankHelpDialog v-if="showRankHelp" @close="showRankHelp = false" />
  </template>
</template>
