<script setup lang="ts">
// SCREEN T - COACH MARKET (docs/design/README.md §T, screenshot T-coach-market.webp).
//
// The surface the coach-tier slice hangs off. Every choice the ladder added - which rung, which
// coach on it, and what either is worth to HER - is unreachable without this screen, which is why
// the owner moved it into this wave rather than leaving it deferred.
//
// THE DESIGN'S THREE DECISIONS, kept:
//   1. A TIER IS A SECTION, NOT A FILTER. Coaches are grouped by rung, cheapest first, each group
//      headed by a coloured dot, a count and a price range. The chips SCROLL to a group rather than
//      filtering the list to nothing, so the gradation is read by scrolling.
//   2. ONE STYLE DROPDOWN, NOT FIVE CHIPS. Defaults to her own style; changing it re-reads every
//      fit pill so the parent can ask "what if she played differently" without committing anything.
//   3. THE CARD'S HEADLINE SIGNAL IS FIT, NOT A TAG LIST. One pill, then what he teaches and what
//      the rung is worth to her - it answers "will he suit my daughter", not "what does he know".
//
// WHAT THE ENGINE OWNS AND THIS SCREEN DOES NOT: fit, price, affordability, the elite gate and the
// uplift projection all arrive on `snapshot.coachMarket`, computed by world.ts coachMarket(). This
// file lays them out and nothing more - the same division UpcomingEvent uses for a tournament, and
// the reason the market and the weekly bill can never disagree about what a coach costs.
//
// THE UPLIFT IS COMPUTED, NEVER WRITTEN DOWN. The owner asked to «подсветить у каждого тира тренера
// на сколько он будет полезен игроку» and sketched "budget 0-2%, middle 1-3%, high 2-4%". Those
// numbers are not in this file, or in any file: engine/coach.ts derives them from HER remaining
// headroom, which is what "всё зависит от ребенка" actually is. A range, never a single number,
// because the weekly luck draw is real spread - and phrased as what a rung CAN add, never a promise.
import { computed, ref, watchEffect } from 'vue'
import { useGameStore } from '../../stores/game'
import ConfirmDialog from '../ConfirmDialog.vue'
import IconButton from '../ui/IconButton.vue'
import { coachPortraitUrl, preloadCoachMarketArt } from '../../art/preload'
import { COACH_TIER_LABEL, coachHoursForPlan, HIREABLE_TIERS, styleFitBetween, type StyleFit } from '../../engine/coach'
import { WEEK_PLAN_PRESETS, type CoachMarketRow, type CoachTier, type PlayStyle } from '../../shared/protocol'
import { formatCents } from '../../shared/money'

const game = useGameStore()
const emit = defineEmits<{ back: [] }>()

const PLAY_STYLE_LABEL: Record<PlayStyle, string> = {
  aggressive: 'Aggressive baseliner',
  counterpuncher: 'Counterpuncher',
  'serve-first': 'Big serve',
  'all-court': 'All-court',
}
// The "specialisations" slot the design puts beside the fit pill. It is the game HE coaches - which
// is both the shortest true answer and the thing the fit pill is computed from, so the row explains
// its own verdict. (An earlier draft put a per-rung blurb here; at 375px it truncated to "Group
// ses…" and pushed the uplift off the row entirely, which is the one number the owner asked for.)
const FIT_LABEL: Record<StyleFit, string> = { great: 'Great fit', good: 'Good fit', off: 'Off-style' }
const FIT_CLASS: Record<StyleFit, string> = { great: 'fit-great', good: 'fit-good', off: 'fit-off' }

/** One decimal, and always a range - the luck band is real spread and the copy must carry it. */
function formatUplift([lo, hi]: [number, number]): string {
  return `+${lo.toFixed(1)}-${hi.toFixed(1)}% a season`
}

// --- the style lens (design decision 2) ---------------------------------------------------------
// `null` means "her own style", which is what the engine already computed the pills against. Pick
// any other style and every pill is re-read client-side from the SAME rule the engine used, so the
// preview can never say something the engine would not.
const styleLens = ref<PlayStyle | null>(null)
const kidStyle = computed<PlayStyle>(() => game.snapshot?.profile.playStyle ?? 'all-court')
const lensStyle = computed<PlayStyle>(() => styleLens.value ?? kidStyle.value)
const STYLE_ORDER: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
function cycleStyle(): void {
  const i = STYLE_ORDER.indexOf(lensStyle.value)
  const next = STYLE_ORDER[(i + 1) % STYLE_ORDER.length]
  styleLens.value = next === kidStyle.value ? null : next
}

// --- THE TRAINING REGULATOR (owner, R3) ---------------------------------------------------------
// The weekly bill is `rate x hours(plan)`, so the plan is HALF the price and a market that shows
// only the other half is lying by omission. The same control the planner uses, on this screen,
// writing through to `world.plan` with the same `setPlan` command - so every price on every row
// reprices from the ENGINE (the snapshot's coachMarket is recomputed at the new plan), not from a
// local copy of the arithmetic that could drift.
//
// ⚠ IT IS THE PLANNER'S PRESET PILLS, NOT A 60-85 SLIDER, and that is deliberate: there is no
// slider anywhere in this app. The "training regulator" is three presets, and they land exactly on
// the sessions the owner's example names - light 4, balanced 5, grind 6. Matching the real control
// keeps one idiom; inventing a fourth one here would make this screen the odd one out AND fire a
// command per drag frame.
const PLAN_ORDER = ['light', 'balanced', 'grind'] as const
const planLabel = (k: (typeof PLAN_ORDER)[number]) =>
  `${k[0].toUpperCase()}${k.slice(1)} ${coachHoursForPlan(WEEK_PLAN_PRESETS[k])}/wk`
const activePlan = computed(() => {
  const p = game.snapshot?.plan
  if (!p) return null
  return PLAN_ORDER.find((k) => WEEK_PLAN_PRESETS[k].train === p.train) ?? null
})
const sessionsNow = computed(() => (game.snapshot ? coachHoursForPlan(game.snapshot.plan) : 0))

// --- DOES HE COME TO TOURNAMENTS (owner, R4) ----------------------------------------------------
// A competition week is not billed as a coaching week by default - she spends it in a draw, not on
// his court - and this buys him for those weeks anyway. It belongs HERE, beside the regulator,
// because this screen is where weekly coach cost is decided and the toggle is the other half of it.
//
// BOTH SEASON NUMBERS ARE SHOWN, because the weekly rate is identical either way and only the WEEK
// COUNT moves; a weekly figure could not tell the two apart. Engine-computed (`coachBilling`), so
// the screen never does this arithmetic itself.
const billing = computed(() => game.snapshot?.coachBilling ?? null)

// ⚠ THE CONTEXT THE UPLIFT NUMBERS ARE RELATIVE TO. The owner watched his coach's number fall from
// 0.5-1.0 to 0.4-0.9 to 0.3-0.7 and asked what it was tied to (his words verbatim are in
// tests/coachTiers.test.ts). The answer is that a rung's worth is a share of her REMAINING headroom,
// so it falls as she fills her ceiling and as the age curve eases - honestly, and until now
// silently. Engine-computed (`coachRoomNote`); this screen only prints it.
const roomNote = computed(() => game.snapshot?.coachRoomNote ?? '')

type SortMode = 'fit' | 'price'
const sort = ref<SortMode>('fit')
function toggleSort(): void {
  sort.value = sort.value === 'fit' ? 'price' : 'fit'
}

// --- rows ---------------------------------------------------------------------------------------
interface Row extends CoachMarketRow {
  fitNow: StyleFit
}
const FIT_RANK: Record<StyleFit, number> = { great: 0, good: 1, off: 2 }

const rows = computed<Row[]>(() =>
  (game.snapshot?.coachMarket ?? []).map((r) => ({
    ...r,
    // Her own style is the engine's answer; any other style is the same rule, re-read here.
    fitNow: styleLens.value === null ? r.fit : styleFitBetween(r.style, lensStyle.value),
  })),
)

interface TierGroup {
  tier: CoachTier
  label: string
  rows: Row[]
  loCents: number
  hiCents: number
}
const groups = computed<TierGroup[]>(() =>
  HIREABLE_TIERS.map((tier) => {
    const inTier = rows.value.filter((r) => r.tier === tier)
    const sorted = [...inTier].sort((a, b) =>
      sort.value === 'price'
        ? a.weeklyCents - b.weeklyCents
        : FIT_RANK[a.fitNow] - FIT_RANK[b.fitNow] || a.weeklyCents - b.weeklyCents,
    )
    const prices = inTier.map((r) => r.weeklyCents)
    return {
      tier,
      label: COACH_TIER_LABEL[tier],
      rows: sorted,
      loCents: prices.length ? Math.min(...prices) : 0,
      hiCents: prices.length ? Math.max(...prices) : 0,
    }
  }).filter((g) => g.rows.length > 0),
)

// --- the budget meter ---------------------------------------------------------------------------
// The design's three numbers, all real: what she pays now, what a week brings in, and the gap. The
// cap is the parent contribution because that is the money the decision is actually made against -
// a reserve pays for one week of anything, a weekly bill has to fit the week.
const current = computed<Row | null>(() => rows.value.find((r) => r.current) ?? null)
const committedCents = computed(() => current.value?.weeklyCents ?? 0)
const capCents = computed(() => {
  // Recovered from any row: weeklyCents - overBudgetCents === the cap whenever a row is over it.
  const over = rows.value.find((r) => r.overBudgetCents > 0)
  return over ? over.weeklyCents - over.overBudgetCents : 0
})
const freeCents = computed(() => Math.max(0, capCents.value - committedCents.value))
const meterPct = computed(() =>
  capCents.value > 0 ? Math.min(100, Math.round((committedCents.value / capCents.value) * 100)) : 0,
)

const headline = computed(() => {
  const p = game.snapshot?.profile
  if (!p) return ''
  return `${p.kidName} ${p.kidLastName}`.trim()
})

// --- hiring --------------------------------------------------------------------------------------
const pending = ref<Row | null>(null)
const confirmMessage = computed(() => {
  const r = pending.value
  if (!r) return ''
  const now = committedCents.value
  const delta = r.weeklyCents - now
  const change =
    delta === 0
      ? 'Your weekly coaching bill does not change.'
      : delta > 0
        ? `Your weekly coaching bill rises by ${formatCents(delta)}.`
        : `Your weekly coaching bill falls by ${formatCents(-delta)}.`
  return `Hire ${r.name} at ${formatCents(r.weeklyCents)} a week? ${change}`
})
function askHire(row: Row): void {
  if (row.current || row.lockedPoints !== null) return
  pending.value = row
}
async function doHire(): Promise<void> {
  const row = pending.value
  pending.value = null
  if (row) await game.hireCoach(row.id)
}
async function goSelfCoached(): Promise<void> {
  await game.hireCoach(null)
}

// Warm every face HERE and nowhere else: this is the only surface that can show them, which is the
// rule src/art/preload.ts states for the whole coach set. Idempotent, so the watcher is free.
watchEffect(() => preloadCoachMarketArt(rows.value.map((r) => r.id)))

function scrollToTier(tier: CoachTier): void {
  document.getElementById(`coach-tier-${tier}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <section class="bare market-head">
      <IconButton class="back-link" variant="bare" icon="back" label="Back" @click="emit('back')" />
      <div>
        <h2 class="market-title">Coach Market</h2>
        <p class="market-sub">
          {{ headline }} &middot; <strong>{{ PLAY_STYLE_LABEL[kidStyle] }}</strong> &middot;
          {{ rows.length }} coaches
        </p>
      </div>
    </section>

    <!-- The budget meter: what she pays now, what a week brings in, and what is left. -->
    <section class="budget-meter">
      <div class="budget-top">
        <span class="budget-label">Coaching budget</span>
        <span class="budget-free"
          ><strong>{{ formatCents(freeCents) }}</strong> /week free</span
        >
      </div>
      <div class="budget-bar"><i :style="{ width: meterPct + '%' }"></i></div>
      <p class="budget-legend">
        <span class="legend-dot committed"></span>{{ formatCents(committedCents) }} committed
        <span class="legend-dot cap"></span>{{ formatCents(capCents) }} weekly cap
      </p>
    </section>

    <!-- THE TRAINING REGULATOR. Half of every price on this screen, so it belongs on it. -->
    <div class="option-row cm-plan">
      <button
        v-for="k in PLAN_ORDER"
        :key="k"
        class="option-pill"
        :class="{ selected: activePlan === k }"
        :disabled="game.busy"
        @click="game.setPlan(WEEK_PLAN_PRESETS[k])"
      >
        {{ planLabel(k) }}
      </button>
    </div>
    <p class="hint cm-plan-note">
      Every price below is {{ sessionsNow }} sessions a week. More of him costs more.
    </p>

    <!-- ⚠ THE TOURNAMENT-TRAVEL TOGGLE IS LOCKED. The owner cancelled the mechanic behind it on 30.07
         after two measurement passes failed to make it worth a fare: nobody travels on the junior tour, the
         coach is a flat weekly cost that produces skill, and the decision belongs to the professional years.
         His words verbatim are in tests/coach-market.test.ts - THIS IS A TEMPLATE, and the app's own rule
         (pinned in tests/round13-nav.test.ts) is that no Cyrillic appears inside one, comments included. I
         put the quote here first and that guard caught it, which is the guard working.

         WHY IT IS DISABLED AND NOT DELETED. Junior tennis has no prize money, so a family cannot decide to
         spend on a coach's fare against what a week might pay back - there is nothing coming back. The
         decision only becomes a decision on the adult tour, where a W15 writes a cheque (see
         docs/specs/adult-tour-and-endings.md §3). Deleting the control would lose the place it belongs;
         locking it says WHEN it arrives, which is also the honest answer to "why can't I press this".
         The engine field stays exactly as it shipped - no schema change, no behaviour change, and every
         existing save keeps whatever it had. -->
    <section v-if="billing" class="cm-travel is-locked">
      <div class="cm-travel-text">
        <p class="cm-travel-title">Coach travels to tournaments</p>
        <p class="cm-travel-sub">
          Not on the junior tour – there is no prize money to weigh it against. It arrives with the
          professional years.
        </p>
      </div>
      <button
        class="cm-switch"
        role="switch"
        :aria-checked="false"
        disabled
        aria-label="Coach travel – available in the professional years"
      >
        <span class="cm-switch-knob"></span>
      </button>
    </section>
    <!-- ⚠ WHAT HE COSTS A WEEK, AND IT IS NOT THE PRICE OF THE TOGGLE. Deleting the toggle's season pair
         took this figure with it, which was too much: "$X without him · $Y with" is meaningless once there
         is no "with", but "he costs $X a week" is true whatever she books and is the one number the
         regulator above is spending. The rows below quote a rate PER COACH; this is what HER coach costs at
         HER plan, which is the number the budget meter draws against. Engine-computed - the screen formats
         cents and derives none.

         ⚠ AND THE SEASON FIGURE IS BESIDE IT NOW (08.08). The retainer runs every week he is not stood
         down, so "a week" no longer tells a parent what a coach costs a YEAR - which is the number the
         reversal actually changed, and the one he is deciding against. `billedWeeks` is the engine's
         own count, so a booked holiday shows up in both figures or in neither. -->
    <p v-if="billing" class="hint cm-travel-cost">
      <strong>{{ formatCents(billing.weeklyCents) }}</strong> a week at her current plan –
      {{ formatCents(billing.seasonCents) }} over {{ billing.billedWeeks }} weeks.
    </p>

    <!-- ⚠ HOW MUCH ROOM IS LEFT IN HER, and it is the context every percentage below is relative to.
         Without it the market is unreadable at the top of a career: the uplift is a share of REMAINING
         headroom, so a girl near her ceiling sees every rung collapse towards zero AND towards each
         other (measured on the owner's save at 93.4% realised: budget +0.1-0.2%, elite +0.2-0.5%, the
         whole ladder inside four tenths of a point). He asked why his coach's number kept falling; this
         is the sentence that answers it, and it is engine-computed so it can never contradict the rows.
         It deliberately quotes no figure - `KidScreen` keeps her ceiling behind a fog of war and this
         must not be the back door through it. -->
    <p v-if="roomNote" class="hint cm-room-note">{{ roomNote }}</p>

    <!-- Tier chips SCROLL to a section rather than filtering the list to nothing (design §T.1). -->
    <div class="controls market-chips">
      <button v-for="g in groups" :key="g.tier" class="tier-chip unlocked" @click="scrollToTier(g.tier)">
        {{ g.label }} <span class="chip-count">{{ g.rows.length }}</span>
      </button>
    </div>

    <div class="controls market-controls">
      <button class="market-drop" :class="{ active: styleLens !== null }" @click="cycleStyle">
        <span class="drop-label">Style</span> <strong>{{ PLAY_STYLE_LABEL[lensStyle] }}</strong>
      </button>
      <button class="market-drop" @click="toggleSort">
        <span class="drop-label">Sort</span> <strong>{{ sort === 'fit' ? 'Best fit' : 'Price' }}</strong>
      </button>
    </div>
    <p v-if="styleLens !== null" class="hint market-lens-note">
      Showing fit against {{ PLAY_STYLE_LABEL[lensStyle] }}, not the game she plays.
    </p>

    <section v-for="g in groups" :key="g.tier" :id="`coach-tier-${g.tier}`" class="bare tier-block">
      <p class="tier-head" :class="`tier-${g.tier}`">
        <span class="tier-dot"></span>
        <span class="tier-name">{{ g.label }} tier</span>
        <span class="tier-count">{{ g.rows.length }} coaches</span>
        <span class="tier-range">{{ formatCents(g.loCents) }}-{{ formatCents(g.hiCents) }} /wk</span>
      </p>

      <!-- The portrait is FULL-BLEED down the left edge, sized by height, masked into the card -
           the same treatment `.coach-card` uses on Home and for the same reason (A2c/d): a strip
           reads as a person standing there, a square reads as an avatar. -->
      <button
        v-for="r in g.rows"
        :key="r.id"
        class="cm-row"
        :class="{ current: r.current, blocked: r.overBudgetCents > 0 || r.lockedPoints !== null }"
        :disabled="r.current || r.lockedPoints !== null"
        @click="askHire(r)"
      >
        <span class="cm-art"><img :src="coachPortraitUrl(r.id)" :alt="r.name" loading="lazy" /></span>
        <span class="cm-body">
          <span class="cm-name">{{ r.name }}</span>
          <span class="cm-meta">
            <span class="fit-pill" :class="FIT_CLASS[r.fitNow]">{{ FIT_LABEL[r.fitNow] }}</span>
            <span class="cm-tags">{{ PLAY_STYLE_LABEL[r.style] }}</span>
          </span>
          <!-- WHAT THE RUNG IS WORTH TO HER, computed from her own headroom. Its own line, because
               it is the number the owner asked for and it must never be the thing that truncates. -->
          <span class="cm-uplift">{{ formatUplift(r.upliftPct) }}</span>
          <!-- WHAT HE DOES ABOUT HER BODY (load slice). The card used to make exactly one claim - the
               development uplift - so the two differences that wave introduced (how good his medical
               team is, and how much of the deciding he takes off you) were spent money with nothing on
               screen to explain it. Prose, not a second number: the measured spread is a few injury
               weeks over four years and printing a figure would promise precision the run cannot back.
               Below the uplift, quieter than it, because the uplift is still the card's headline. -->
          <span class="cm-load">{{ r.loadNote }}</span>
        </span>
        <span class="cm-right">
          <span class="cm-price">{{ formatCents(r.weeklyCents) }}<i>/wk</i></span>
          <span v-if="r.current" class="cm-action is-current">Current</span>
          <span v-else-if="r.lockedPoints !== null" class="cm-action is-locked"
            >{{ r.lockedPoints }} pts short</span
          >
          <span v-else-if="r.overBudgetCents > 0" class="cm-action is-over"
            >{{ formatCents(r.overBudgetCents) }} over</span
          >
          <span v-else class="cm-action is-hire">Hire &rsaquo;</span>
        </span>
      </button>
    </section>

    <!-- The rung below the market: free, and always available. A family that cannot pay has to be
         able to stop paying, so this is never hidden behind affordability. -->
    <section class="self-coach-row">
      <p class="hint" style="margin-top: 0">
        {{
          current
            ? 'You can always take her back onto the court yourself. The weekly bill becomes court time only.'
            : 'You are coaching her yourself. The weekly bill is court time only.'
        }}
      </p>
      <button v-if="current" :disabled="game.busy" @click="goSelfCoached">Coach her yourself</button>
    </section>

    <ConfirmDialog
      v-if="pending"
      :message="confirmMessage"
      confirm-label="Hire"
      @confirm="doHire"
      @cancel="pending = null"
    />
  </template>
</template>
