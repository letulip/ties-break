<script setup lang="ts">
// Season planner (docs/specs/season-planner.md) – the "+ Plan week" sheet.
//
// ONE empty future week, TWO tabs: Practice (a watchable friendly – court fee, the optional
// «+ тренер на игру», the fatigue GUARDRAIL and, under the medical floor, the doctor's hard refusal)
// and Vacation (the shared 6-package catalogue with prices, condition gains and the
// cheapest-that-brings-her-back pre-highlighted).
//
// The sheet books NOTHING itself: it emits the chosen plan and SeasonScreen routes it through the
// same ConfirmDialog an entry uses, so money always gets a confirm and the guardrail warning
// lands INSIDE that confirm. Prices come from the engine's own pure quote functions
// (economy.ts), keyed on (seed, week, package) – exactly what bookVacation/bookPractice charge.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { ECONOMY, practiceFeeCents, recommendVacationPackage, vacationPriceCents } from '../engine/economy'
import { medicalBlock, practiceCaution, type PracticeCaution } from '../engine/world'
import { isOffSeasonWeek } from '../engine/season/calendar'
import { weekLabel, weekRange } from '../shared/dates'

const props = defineProps<{
  week: number
  /** which tab opens first – the rescue prompt and the off-season row open on Vacation */
  initialTab?: 'practice' | 'vacation'
  /** package to pre-highlight (the rescue prompt passes its own pick) */
  highlightPackageId?: string
}>()

const emit = defineEmits<{
  close: []
  bookPractice: [{ week: number; withCoach: boolean; feeCents: number; caution: PracticeCaution }]
  bookVacation: [{ week: number; packageId: string; label: string; priceCents: number; gain: number }]
}>()

const game = useGameStore()

function formatDollars(cents: number): string {
  return cents === 0 ? 'free' : `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

const tab = ref<'practice' | 'vacation'>(props.initialTab ?? 'practice')
const withCoach = ref(false)

const seed = computed(() => game.snapshot?.seed ?? '')
const background = computed(() => game.snapshot?.profile.background ?? 'middle')
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)
const dates = computed(() => weekRange(props.week))
const offSeason = computed(() => isOffSeasonWeek(props.week))

// --- Practice tab -------------------------------------------------------------------------
// The off-season is family time – no friendlies there (the engine refuses too), so the tab
// explains itself instead of offering a button that would throw.
const courtCents = computed(() => practiceFeeCents(seed.value, props.week, background.value, false))
const coachExtraCents = computed(
  () => practiceFeeCents(seed.value, props.week, background.value, true) - courtCents.value,
)
const practiceFee = computed(() => (withCoach.value ? courtCents.value + coachExtraCents.value : courtCents.value))
const practiceAffordable = computed(() => fundsCents.value >= practiceFee.value)
// THE GUARDRAIL (bench finding: practising every week is self-destructive). A caution, never a
// block – the parent may push, the game warns.
const caution = computed<PracticeCaution>(() =>
  practiceCaution({
    condition: condition.value,
    practiceWeeks: (game.snapshot?.practices ?? []).map((p) => p.week),
    week: props.week,
  }),
)
// THE DOCTOR'S VETO – the one thing above the guardrail, and the only HARD block on a friendly
// (owner 26.07: he will not let her travel to a tournament at condition 0, so he will not clear her
// for a friendly either). Read through the engine's own `medicalBlock`, i.e. the SAME verdict the
// tournament card's "Not cleared to play" lock renders and the same sentence `bookPractice` would
// throw – so the two surfaces cannot drift, and the button is disabled-with-a-reason instead of
// throwing on click. The week itself stays plannable: the Vacation tab is the answer, and the copy
// says so, because a week where nothing at all is possible is the worst bug this planner has had.
const medical = computed(() => medicalBlock(condition.value))

function askPractice(): void {
  emit('bookPractice', {
    week: props.week,
    withCoach: withCoach.value,
    feeCents: practiceFee.value,
    caution: caution.value,
  })
}

// --- Vacation tab -------------------------------------------------------------------------
interface PackageRow {
  id: string
  label: string
  blurb: string
  priceCents: number
  gain: number
  buffFactor: number
  returnsTo: number
  affordable: boolean
  recommended: boolean
}

/** The pre-highlight: an explicit pick (the rescue prompt), else the CHEAPEST package sufficient
 *  for HER CURRENT condition – the one shared rule in economy.ts, so the sheet, the rescue card
 *  and the bench can never drift apart.
 *  WAVE-2 (bench 26.07): the old rule needed a package clearing 85 and, failing that, highlighted
 *  the most expensive she could afford; the off-season row additionally hard-coded seaside. Both
 *  are gone – seaside took 88% of every booking in the bench, and a family week for a nearly-fresh
 *  kid should recommend the free staycation, not a $1000 hotel. */
const recommendedId = computed<string | null>(() =>
  props.highlightPackageId
    ? props.highlightPackageId
    : recommendVacationPackage({
        seed: seed.value,
        week: props.week,
        background: background.value,
        condition: condition.value,
        fundsCents: fundsCents.value,
      }),
)

const packageRows = computed<PackageRow[]>(() =>
  ECONOMY.vacation.packages.map((p) => {
    const priceCents = vacationPriceCents(seed.value, props.week, p.id, background.value)
    return {
      id: p.id,
      label: p.label,
      blurb: p.blurb,
      priceCents,
      gain: p.conditionGain,
      buffFactor: p.buffFactor,
      returnsTo: Math.min(ECONOMY.condition.max, condition.value + p.conditionGain),
      affordable: fundsCents.value >= priceCents,
      recommended: recommendedId.value === p.id,
    }
  }),
)

function askVacation(row: PackageRow): void {
  emit('bookVacation', {
    week: props.week,
    packageId: row.id,
    label: row.label,
    priceCents: row.priceCents,
    gain: row.gain,
  })
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="plan-sheet">
      <button class="replay-close" aria-label="Close planner" title="Close" @click="emit('close')">✕</button>
      <p class="guide-title">Plan {{ weekLabel(week) }}</p>
      <p class="hint" style="margin-top: -6px">{{ dates }} · condition {{ condition }}/100</p>

      <div class="plan-tabs">
        <button class="option-pill" :class="{ selected: tab === 'practice' }" @click="tab = 'practice'">
          Practice
        </button>
        <button class="option-pill" :class="{ selected: tab === 'vacation' }" @click="tab = 'vacation'">
          Vacation
        </button>
      </div>

      <!-- ---------------- Practice ---------------- -->
      <template v-if="tab === 'practice'">
        <p v-if="offSeason" class="hint">Off-season – family time, no matches. Try the Vacation tab.</p>
        <template v-else>
          <p class="plan-lead">
            A friendly at the club – watchable, no ranking points. One notch of fatigue, and she
            keeps her base recovery but loses the rest bonus for the week.
          </p>
          <div class="plan-line">
            <span>Court rental</span>
            <span class="num negative">{{ formatDollars(courtCents) }}</span>
          </div>
          <label class="physio-toggle">
            <input v-model="withCoach" type="checkbox" />
            + coach for the match ({{ formatDollars(coachExtraCents) }} – the other half is on the
            opponent's family)
          </label>
          <div class="plan-line plan-total">
            <span>Total</span>
            <span class="num negative">{{ formatDollars(practiceFee) }}</span>
          </div>
          <!-- The doctor's veto outranks the guardrail: a hard block, so it replaces the warning
               rather than stacking with it, and it points at the week's remaining options. -->
          <p v-if="medical" class="caution-note">
            {{ medical.detail }} A friendly is still a match, so it is out too at condition
            {{ condition }} – try the Vacation tab, or leave the week to training.
          </p>
          <p v-else-if="caution.level === 'caution'" class="caution-note">{{ caution.detail }}</p>
          <div class="dialog-actions" style="margin-top: 12px">
            <button @click="emit('close')">Cancel</button>
            <button
              class="primary"
              :class="{ risky: !medical && caution.level === 'caution' }"
              :disabled="!!medical || !practiceAffordable || game.busy"
              @click="askPractice"
            >
              {{ medical ? 'Not cleared to play' : caution.level === 'caution' ? 'Book anyway' : 'Book the match' }}
            </button>
          </div>
          <p v-if="!medical && !practiceAffordable" class="hint" style="margin: 6px 0 0">Not enough funds</p>
        </template>
      </template>

      <!-- ---------------- Vacation ---------------- -->
      <template v-else>
        <p class="plan-lead">
          A week away – no tournaments that week, and she comes back fresher. Cancel any time
          before the week starts for a full refund.
        </p>
        <div class="pkg-list">
          <div v-for="row in packageRows" :key="row.id" class="pkg-row" :class="{ recommended: row.recommended }">
            <div class="pkg-head">
              <span class="pkg-label">{{ row.label }}</span>
              <span class="pill" :class="{ ok: row.recommended }">{{ formatDollars(row.priceCents) }}</span>
            </div>
            <p class="hint pkg-blurb">{{ row.blurb }}</p>
            <p class="hint pkg-effect">
              +{{ row.gain }} condition → {{ row.returnsTo }}/100<template v-if="row.buffFactor < 1">
                · injury risk −{{ Math.round((1 - row.buffFactor) * 100) }}% for
                {{ ECONOMY.vacation.buffWeeks }} weeks</template>
            </p>
            <div class="pkg-actions">
              <span v-if="row.recommended" class="pill ok">Recommended</span>
              <button class="primary" :disabled="!row.affordable || game.busy" @click="askVacation(row)">
                Book
              </button>
              <span v-if="!row.affordable" class="hint" style="margin: 0">Out of reach</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
