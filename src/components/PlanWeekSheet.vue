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
//
// ⚠ AND IT UNBOOKS A FAMILY WEEK TOO (R14-1) – the second half of a decision that shipped without
// it. The owner ruled on 29.07 that the painted vacation card carries NO button: "a booked week is a
// statement, not a control, and cancelling lives where booking does – tap the card and the planner
// opens". The card duly opens this sheet; this sheet never grew the cancel. Every package has art,
// so every card is painted, so no booking was cancellable – the one Cancel that did exist sat on the
// un-painted fallback row, which nothing can reach. It lives here now, where booking lives.
//
// That also retires a DEAD CONTROL of the R10-16 class this planner must never grow: opened on a
// booked week the sheet used to show the Practice tab, whose Book buttons could only ever throw
// `assertPlannable`'s "That week is already a family vacation".
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { ECONOMY, practiceFeeCents, recommendVacationPackage, vacationPackage, vacationPriceCents } from '../engine/economy'
import { practiceCoachRateCents } from '../engine/coach'
import { formatCents } from '../shared/money'
import { ageAtWeek } from '../engine/world'
import { layoffBlock, medicalBlock, practiceCaution, type PracticeCaution } from '../engine/world'
import { isOffSeasonWeek } from '../engine/season/calendar'
import { weekLabel, weekRange } from '../shared/dates'
import { vacationArtUrl } from '../art/weeks'
import { restCostFor, restCostLines } from '../composables/restCost'
import IconButton from './ui/IconButton.vue'
import TakeoverShell from './ui/TakeoverShell.vue'

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
  /** R14-1: the booked week's undo. Emitted, never dispatched – the same routing every other money
   *  decision in this sheet takes, so the refund gets SeasonScreen's ConfirmDialog like the booking
   *  got it. */
  cancelVacation: [{ week: number; packageId: string; label: string; paidCents: number }]
}>()

const game = useGameStore()

// 'free' for a zero fee is THIS SHEET'S copy, not a money contract - the shared formatter would
// print "$0", and a court that costs nothing to book reads better as a word than as a zero.
const feeLabel = (cents: number): string => (cents === 0 ? 'free' : formatCents(cents))

const seed = computed(() => game.snapshot?.seed ?? '')
const background = computed(() => game.snapshot?.profile.background ?? 'middle')
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)
const dates = computed(() => weekRange(props.week))
const offSeason = computed(() => isOffSeasonWeek(props.week))

// --- an ALREADY BOOKED family week (R14-1) ------------------------------------------------
// Read off the SNAPSHOT rather than passed in, for the same reason the prices are: the sheet and
// the calendar card that opened it must not be able to disagree about whether the week is booked.
const booked = computed(() => (game.snapshot?.vacations ?? []).find((v) => v.week === props.week) ?? null)
const bookedLabel = computed(() =>
  booked.value ? (vacationPackage(booked.value.packageId)?.label ?? booked.value.packageId) : '',
)
function askCancelVacation(): void {
  const b = booked.value
  if (!b) return
  emit('cancelVacation', { week: props.week, packageId: b.packageId, label: bookedLabel.value, paidCents: b.paidCents })
}

/** ⚠ A THIRD PANE, NOT A THIRD TAB. `booked` is a fact about the week, not a choice the parent
 *  makes, so it is not offered beside Practice and Vacation – it REPLACES both, and the tab strip
 *  stands down with them. The value is settled at open because the sheet is `v-if`-mounted per
 *  week: SeasonScreen tears it down to raise the confirm, so there is no state to keep in sync. */
const tab = ref<'practice' | 'vacation' | 'booked'>(booked.value ? 'booked' : (props.initialTab ?? 'practice'))
const withCoach = ref(false)

// --- Practice tab -------------------------------------------------------------------------
// The off-season is family time – no friendlies there (the engine refuses too), so the tab
// explains itself instead of offering a button that would throw.
// R3: «+ тренер на игру» is HER coach now, so the quote reads his rate through the same pure rule
// the engine charges by (engine/coach.ts practiceCoachRateCents) instead of a flat band. Priced at
// the age she will be in the BOOKED week, which is the week the coach is actually working.
const coachRateCents = computed(() =>
  practiceCoachRateCents(
    seed.value,
    ageAtWeek(props.week),
    game.snapshot?.coachId ?? null,
    game.snapshot?.profile.playStyle ?? 'all-court',
  ),
)
const courtCents = computed(() => practiceFeeCents(seed.value, props.week, background.value, false))
const coachExtraCents = computed(
  () =>
    practiceFeeCents(seed.value, props.week, background.value, true, coachRateCents.value) - courtCents.value,
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

// R12-8b + R12-5b: THE LAYOFF, through the engine's own predicate. The "sheet cannot call that
// helper" era ended when wave A shipped `layoffBlock`, which takes exactly the snapshot facts the
// sheet holds – so the mirror-the-inequality copy this computed used to carry is gone, and the
// sheet, `bookPractice`'s throw and the tournament lock all share ONE window comparison
// (`layoffCoversWeek`). Gates BOTH tabs: a friendly is a match and a laid-up week books nothing.
const layoff = computed(() => {
  const s = game.snapshot
  return layoffBlock({ currentWeek: s?.week ?? 0, injury: s?.injury ?? null, week: props.week })
})
/** The refusal's first words – the same words the tournament card's injured lock uses. */
const layoffNote = computed(() => {
  const s = game.snapshot
  return s?.injury && layoff.value ? `Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}.` : ''
})

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
  /** #8 – true when the quote is 0 BECAUSE the shelf granted it (their own boat), so the price
   *  slot can say why instead of a bare «free» that would read like the staycation's */
  grantedFree: boolean
  gain: number
  buffFactor: number
  returnsTo: number
  affordable: boolean
  recommended: boolean
  /** the package's painting, or null when it has none yet */
  art: string | null
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
        grantedIds: grantedVacationIds.value,
      }),
)

/** ⭐⭐ ROUND 29 #5 -> PART TWO #8, the-shop §3f/§13g – THE VACATION PACKAGES THE SHELF HAS MADE
 *  FREE, off the snapshot.
 *
 *  The owner's idea and his #8 extension are quoted in the economy catalogue rather than here
 *  (this file has a template and Cyrillic may not reach one): the yacht week is on every family's
 *  sheet at a real charter price, and taking delivery of a yacht is what zeroes it.
 *
 *  ⚠ THE ENGINE ANSWERED IT (`shop.vacationIds`) – this sheet never asks what the family owns. The
 *  quote, the recommendation and the booking all price through `vacationPriceCents` with this same
 *  list, so the sheet can show the owner's week free and can never show it free to anybody else –
 *  and `bookVacation` re-prices off the world, so a stale sheet cannot under-charge. */
const grantedVacationIds = computed<string[]>(() => game.snapshot?.shop.vacationIds ?? [])

/** ⚠ W4 – THE PRICE READS AS A PRICE (owner, 30.07: «на вкладке брони отпуска давай суммы сделаем
 *  крупнее и без обводки вокруг, чтобы явно читались»). Nothing about the number CHANGED - it is the
 *  same `vacationPriceCents` quote the engine charges by; what changed is that the template stopped
 *  rendering it as a chip. `.pill` gave it a hairline capsule and 12px of muted grey, which put the
 *  one figure the parent is deciding on at the same visual weight as the "Recommended" badge two
 *  elements to its left - so the row read as a run of three badges - and made it the quietest type on
 *  a card whose whole job is to compare five prices. It is `--fs-value-md`/800 now, with no frame. */
/** ⭐ ROUND 29 #5 -> PART TWO #8, §3f/§13g – the yacht week is on EVERY family's sheet now («можно
 *  просто на постоянку добавить в ленту» is quoted in the economy catalogue; no Cyrillic reaches a
 *  file with a template). The filter that hid the `grantedOnly` row is gone rather than inverted:
 *  what the shelf's grant changes is the PRICE – `vacationPriceCents` quotes 0 for a granted
 *  package – so the whole catalogue is the list and the one function prices it. */
const packageRows = computed<PackageRow[]>(() =>
  ECONOMY.vacation.packages.map((p) => {
    const priceCents = vacationPriceCents(seed.value, props.week, p.id, background.value, grantedVacationIds.value)
    return {
      id: p.id,
      label: p.label,
      blurb: p.blurb,
      priceCents,
      // #8's own sentence for the owner: the row is free BECAUSE of the boat, and the price slot
      // says so instead of a bare «free» that would read like the staycation's.
      grantedFree: priceCents === 0 && !!p.freeOnceGranted,
      gain: p.conditionGain,
      buffFactor: p.buffFactor,
      returnsTo: Math.min(ECONOMY.condition.max, condition.value + p.conditionGain),
      // R13-7a: a zero-price package is ALWAYS affordable – the bare `funds >= price` disabled
      // the free staycation's Book at negative funds (the same predicate bookVacation fixed).
      affordable: priceCents === 0 || fundsCents.value >= priceCents,
      recommended: recommendedId.value === p.id,
      // The package's own painting (owner, 29.07). Null is handled by the template - a catalogue
      // entry may exist before its frame does, and a missing picture must not cost the row.
      art: vacationArtUrl(p.id),
    }
  }),
)

// ⭐⭐ ROUND 29 #1 – THE REST'S OWN PRICE, on the tab where the owner took the decision.
//
// «я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет!» The rule, the measurement behind it
// and the reason it is not a prediction all live in composables/restCost.ts; this is one call.
//
// ⚠ THE VACATION TAB ONLY, AND THAT IS HIS OWN DECISION RATHER THAN A LIMIT OF THE RULE. A friendly
// banks no ranking points either, but a practice week is not rest – it already carries its own
// guardrail two panes up, and a second caution beside it would make the louder one read as noise.
const restNote = computed(() => {
  const cost = restCostFor(game.snapshot, props.week)
  return cost ? restCostLines(cost) : []
})

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
  <!-- ⭐ FULL SCREEN SINCE ROUND-17 #5 (the owner), the same move the Inbox made in round 16 and for
       the same measured reason. This was a `.dialog-overlay` + `.plan-sheet` capped at 420px and
       86vh, holding two tabs, a price table and SIX vacation packages each with a painting, a name,
       a note and a Book button - a scroller inside a card inside a page, on a surface whose whole
       job is comparing six things side by side. `TakeoverShell` is the app's one answer to "a screen
       that covers the tabs" and five surfaces already render through it, so this is a re-home rather
       than a new layout: same tabs, same rows, same controls, same confirms.
       ⚠ AND THE BACKDROP TAP GOES WITH THE BACKDROP. `@click.self` was one of the two exits; there
       is nothing behind a takeover to tap, so the header's close control is the way out - which is
       what every other takeover in the app already does.
       ⚠ `:screen` IS THE SCROLL RESET, and the tabs are exactly what it is for: Practice and
       Vacation are two screens in one scroller, so switching to Vacation from the bottom of the
       Practice tab used to arrive already scrolled past the first package. -->
  <TakeoverShell :title="`Plan ${weekLabel(week)}`" :screen="tab">
    <template #exit>
      <IconButton icon="close" label="Close planner" title="Close" @click="emit('close')" />
    </template>
    <!-- The week's dates and where her condition stands - the two facts every tab is chosen
         against, so they belong to the header rather than to either tab. -->
    <template #sub>{{ dates }} · condition {{ condition }}/100</template>

    <!-- ⚠ ONE WRAPPER, for the reason InboxSheet's has one: `.tf-body` is a flex column with a 16px
         gap, and without a wrapper every paragraph, hint and tab strip becomes a gap-separated band
         instead of a page. -->
    <div class="plan-body">
      <!-- ---------------- Already booked ---------------- -->
      <!-- R14-1: THE UNDO, WHERE THE BOOKING LIVES. The painted vacation card carries no control by
           the owner's 29.07 ruling and opens this sheet instead; this is the half of that routing
           that was never built. Two plain buttons and no primary: leaving a booked trip alone is not
           an action, so nothing here is the recommended one. The refund is stated before the press
           and again on the confirm, because it is the fact that makes this reversible. -->
      <template v-if="tab === 'booked'">
        <!-- "booked for this week" was the first draft and it was ambiguous in the browser: the
             sheet is about a FUTURE week and the title above already names it, so "this week" read
             as the one the player is standing in. -->
        <p class="plan-lead">
          {{ bookedLabel }} – booked, {{ feeLabel(booked!.paidCents) }}. She plays no tournament
          while she is away.
        </p>
        <p class="hint">
          Cancel any time before the week starts and
          {{ booked!.paidCents > 0 ? 'the money comes back in full' : 'nothing is owed either way' }}.
        </p>
        <div class="dialog-actions" style="margin-top: 12px">
          <button @click="emit('close')">Keep it</button>
          <button class="danger" :disabled="game.busy" @click="askCancelVacation">Cancel the trip</button>
        </div>
      </template>

      <div v-if="tab !== 'booked'" class="plan-tabs">
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
            <span class="num negative">{{ feeLabel(courtCents) }}</span>
          </div>
          <label class="physio-toggle">
            <input v-model="withCoach" type="checkbox" />
            + coach for the match ({{ feeLabel(coachExtraCents) }} – the other half is on the
            opponent's family)
          </label>
          <div class="plan-line plan-total">
            <span>Total</span>
            <span class="num negative">{{ feeLabel(practiceFee) }}</span>
          </div>
          <!-- R12-5b: the LAYOFF outranks even the doctor – availabilityStatus ranks injured above
               medical, and the sheet keeps that order. One hard block renders at a time. -->
          <p v-if="layoff" class="caution-note">
            {{ layoffNote }} A friendly is still a match, so the week books nothing until she is
            back – leave it to rest.
          </p>
          <p v-else-if="medical" class="caution-note">
            {{ medical.detail }} A friendly is still a match, so it is out too at condition
            {{ condition }} – try the Vacation tab, or leave the week to training.
          </p>
          <p v-else-if="caution.level === 'caution'" class="caution-note">{{ caution.detail }}</p>
          <div class="dialog-actions" style="margin-top: 12px">
            <button @click="emit('close')">Cancel</button>
            <button
              class="primary"
              :class="{ risky: !layoff && !medical && caution.level === 'caution' }"
              :disabled="!!layoff || !!medical || !practiceAffordable || game.busy"
              @click="askPractice"
            >
              {{ layoff ? 'Injured' : medical ? 'Not cleared to play' : caution.level === 'caution' ? 'Book anyway' : 'Book the match' }}
            </button>
          </div>
          <p v-if="!layoff && !medical && !practiceAffordable" class="hint" style="margin: 6px 0 0">Not enough funds</p>
        </template>
      </template>

      <!-- ---------------- Vacation ---------------- -->
      <!-- ⚠ `v-else-if` RATHER THAN `v-else` since R14-1: a booked week is a third pane, and a bare
           `v-else` would have drawn the package picker underneath it. -->
      <template v-else-if="tab === 'vacation'">
        <p class="plan-lead">
          A week away – no tournaments that week, and she comes back fresher. Cancel any time
          before the week starts for a full refund.
        </p>
        <!-- ⭐ ROUND-17 #11: THE LAYOFF NO LONGER REFUSES A HOLIDAY, and the refusal that used to
             live here is gone rather than restyled. It read "The layoff covers this week, so a
             family trip cannot be booked", which made a twelve-week injury twelve weeks in which the
             parent could plan nothing at all. The owner's reasoning is on `assertPlannable`.
             The layoff is still SAID, because it is a fact about the week worth knowing while
             choosing – it is simply not a block any more. -->
        <p v-if="layoff" class="hint">
          {{ layoffNote }} A week away is still hers to book – the trip is rest, not tennis.
        </p>
        <!-- ⭐⭐ ROUND 29 #1 – WHAT THE WEEK OFF COSTS HER RANKING, BEFORE IT IS BOOKED.
             The owner rested a tired girl and came back to a feed with no Slam in it. The measurement
             and the reason this is two sentences rather than a prediction are on `restCostFor`
             (composables/restCost.ts); the short version is that the points leave her window on their
             own, and a week away is the choice to put nothing in their place.
             ⚠ `caution-note` and not `hint`: this is the practice guardrail's own shape, because it
             is the same kind of statement – a real cost attached to a choice that is still hers. -->
        <p v-if="restNote.length" class="caution-note">
          <span v-for="line in restNote" :key="line" class="rest-cost-line">{{ line }}</span>
        </p>
        <div class="pkg-list">
          <div v-for="row in packageRows" :key="row.id" class="pkg-row" :class="{ recommended: row.recommended }">
            <!-- The frame sits BEHIND the row and dissolves to the left, exactly as it does on the
                 Season feed's cards, so the picker and the feed read as one idea. -->
            <div v-if="row.art" class="pkg-art" aria-hidden="true">
              <img :src="row.art" alt="" />
              <span class="pkg-art-scrim"></span>
            </div>
            <!-- ⚠ THE PRICE LEFT THIS ROW (owner, 30.07: «Vacation price options move to the bottom
                 right corner of the card in list»). It sat here, opposite the package name, which
                 put the one number the parent is deciding on at the FAR END of the headline and left
                 the bottom-right corner - the corner a thumb is already heading for - holding
                 nothing. It is beside Book now: the cost and the commitment read as one gesture, and
                 the title line is a title again. -->
            <div class="pkg-head">
              <span class="pkg-label">{{ row.label }}</span>
            </div>
            <p class="hint pkg-blurb">{{ row.blurb }}</p>
            <p class="hint pkg-effect">
              +{{ row.gain }} condition → {{ row.returnsTo }}/100<template v-if="row.buffFactor < 1">
                · injury risk −{{ Math.round((1 - row.buffFactor) * 100) }}% for
                {{ ECONOMY.vacation.buffWeeks }} weeks</template>
            </p>
            <div class="pkg-actions">
              <span v-if="row.recommended" class="pill ok">Recommended</span>
              <span v-if="!row.affordable" class="hint pkg-unaffordable">Out of reach</span>
              <!-- ⚠ THE PRICE IS NOT A PILL ANY MORE (owner, 30.07 – his words are on `packageRows`
                   in the script). `.pill` is this app's CHIP: a 12px capsule in muted ink with a
                   hairline round it, which is a LABEL treatment, and it was wrong twice over on the
                   one number the parent is choosing between. It is a FIGURE now - see `.pkg-price` in
                   src/style.css for the two rungs and where they come from. -->
              <!-- #8: a week made free by the shelf says WHY – their own boat – so the owner sees
                   the purchase paying off, not a price rounding to nothing. -->
              <span class="num pkg-price" :class="{ ok: row.recommended }">{{
                row.grantedFree ? 'free – their own boat' : feeLabel(row.priceCents)
              }}</span>
              <!-- ⭐ #11: the layoff no longer disables Book. It still must not become a control that
                   can only throw (R10-16), which is why the ENGINE gate came off first – the button
                   is live here exactly because `assertPlannable` will now accept it. -->
              <button class="primary" :disabled="!row.affordable || game.busy" @click="askVacation(row)">
                Book
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </TakeoverShell>
</template>
