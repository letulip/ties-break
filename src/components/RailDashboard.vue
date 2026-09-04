<script setup lang="ts">
// ⭐⭐⭐ THE RAIL'S MINI-DASHBOARD – ROUND 36 PHASE 6, AND IT IS THE OWNER'S OWN RULING.
//
// «Надо создать новые компоненты и показывать их только на десктоп», and one sentence later:
// «карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске, т.е. на всех
// страницах». `AC-home-desktop-1024.png` is the reference for the set.
//
// ⚠⚠ THIS IS THE ONE PLACE IN ROUND 36 WHERE «NO NEW COMPONENTS, NO NEW STRINGS» IS SUSPENDED, and
// it is suspended BY HIM, for three cards and nothing else. Everything else in the round still holds:
// no new icon, no engine change, no copy change anywhere else.
//
// -------------------------------------------------------------------------------------------------
// THE THREE CARDS ARE INFORMATION, NOT CONTROLS – HIS CONSTRAINT, IN HIS OWN WORDS
// -------------------------------------------------------------------------------------------------
// «Никаких контролов новых они не поставят, это просто шорт-кат с информацией из внутренних
// разделов.» So there is no `<button>`, no link and no tab stop anywhere below, and that is not a
// stylistic preference – it is the boundary the parity exemption is drawn around. `e2e/parity.spec.ts`
// asserts, BY CONTAINER, that this region holds no interactive role, and reddens if a later phase
// parks one here. If a card ever wants a control, that is a question for him and not an edit.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ NOT ONE OF THE THREE FIGURES IS DERIVED HERE. EVERY ONE READS THE SURFACE THAT OWNS IT.
// -------------------------------------------------------------------------------------------------
// A card is a SHORTCUT to something the app already computes, and a shortcut that recomputes its own
// number is this repo's named recurring disease (see `HouseholdStrip.vue`'s header for the version of
// it that actually shipped). So:
//
//   In the account   `snapshot.fundsCents` through `formatCents` – the app's ONE money formatter
//                    (shared/money.ts), the same two lines Home's Family-budget card and the Family
//                    Budget screen's own «… in the account» line are made of. No arithmetic at all.
//   Coaching budget  `useCoachingBudget().freeCents` – the SAME computed the Coach Market's meter
//                    prints beside the words «Coaching budget». Moved into a composable by this
//                    phase precisely so the rail cannot drift from the meter.
//   My entries       `enteredEvents(snapshot.upcoming)` – the SAME predicate the Season screen's
//                    «My entries» strip filters on, and rendered as the same `label · week` pair.
//
// ⚠ AND EVERY TITLE IS TAKEN OFF THE SURFACE THE DATA LIVES ON, not off the frame – the round's rule
// where the two differ. `In the account` is the Family Budget screen's own phrase, `Coaching budget`
// is `CoachMarketScreen`'s `.budget-label` verbatim, `My entries` is `SeasonScreen`'s own `<h2>`.
// All three already existed in this app; what is new is that they are titles here too.
//
// ⚠ «My entries» IS SILENT WITH NOTHING ENTERED, which is what the strip it shortcuts to already
// does (`v-if="myEntries.length"` on Season). An empty card is a worse answer than no card, and
// «одинаковые на всех страницах» is about the PAGE, not about the state of the career: the set does
// not vary by screen, which is the property he asked for.
//
// ⚠ DESKTOP-ONLY IS A STYLESHEET FACT, NOT A `v-if`. The block is in the DOM at every width and
// `display: none` below 1024 (src/style.css, beside the rail's own rules). A `v-if` on a media query
// would be a second source of truth about the breakpoint, and the round already has one ladder.
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCents } from '../shared/money'
import { weekLabel } from '../shared/dates'
import Card from './ui/Card.vue'
import Eyebrow from './ui/Eyebrow.vue'
import { useCoachingBudget } from '../composables/coachingBudget'
import { enteredEvents } from '../composables/seasonEntries'

const game = useGameStore()

const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const funds = computed(() => formatCents(fundsCents.value))

const { freeCents } = useCoachingBudget()
const coachingFree = computed(() => formatCents(freeCents.value))

const entries = computed(() => enteredEvents(game.snapshot?.upcoming ?? []))
</script>

<template>
  <!-- ⚠ THE CLASS IS THE BOUNDARY. `e2e/parity.spec.ts` subtracts exactly
       `#app > nav.tab-bar > .rail-dash` from every fingerprint and asserts that region holds no
       control; nothing else in the app is exempt from the check. Renaming this class without moving
       the harness's selector fails the boundary test rather than silently widening the hole. -->
  <div v-if="game.snapshot" class="rail-dash">
    <Card as="article" class="rail-dash-card">
      <Eyebrow as="h2" class="rail-dash-title">In the account</Eyebrow>
      <!-- The negative tint is Home's own `.budget-total.negative` rule, on the same figure. -->
      <p class="rail-dash-figure" :class="{ negative: fundsCents < 0 }">{{ funds }}</p>
    </Card>

    <Card as="article" class="rail-dash-card">
      <Eyebrow as="h2" class="rail-dash-title">Coaching budget</Eyebrow>
      <p class="rail-dash-figure">{{ coachingFree }}</p>
    </Card>

    <!-- Silent with nothing entered – the same condition the Season strip carries. -->
    <Card v-if="entries.length" as="article" class="rail-dash-card">
      <Eyebrow as="h2" class="rail-dash-title">My entries</Eyebrow>
      <p v-for="e in entries" :key="e.id" class="rail-dash-figure rail-dash-entry">
        {{ e.label }} · {{ weekLabel(e.week) }}
      </p>
    </Card>
  </div>
</template>
