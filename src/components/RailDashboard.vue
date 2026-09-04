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
// ⭐⭐⭐ ROUND 36, HIS REVIEW OF THE BUILT WAVE, ITEM #9 – «Плитки дашборда живут прибитые к меню
// выше, Coaching budget несёт больше информации». The first half is one declaration in src/style.css
// (`margin-top: auto` -> 0); the second is read as THE METER'S OWN SET, and D83 in
// docs/specs/responsive-decisions-2026-09.md puts that reading to him with the offer to cut it.
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

// ⭐ REVIEW #9 – THE OTHER THREE OF THE METER'S FOUR, and every one of them comes out of the SAME
// composable the free figure does. There is no arithmetic in this file, which is the property the
// header above is about: mutate `composables/coachingBudget.ts` and the market's meter and this card
// move together, because there is one body of it.
const { committedCents, capCents, freeCents, meterPct } = useCoachingBudget()
const coachingFree = computed(() => formatCents(freeCents.value))
const coachingCommitted = computed(() => formatCents(committedCents.value))
const coachingCap = computed(() => formatCents(capCents.value))

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

    <!-- ⭐⭐⭐ ROUND 36 REVIEW #9 – he asked this card to carry more information (his sentence is in
         the script block above and in docs/rounds/round-36-review.md; a template may carry no
         Cyrillic at all), and what «more» was read as is THE METER'S OWN SET, whole.
         `useCoachingBudget` exposes four things and this card printed one of them; the Coach
         Market's meter prints all four, in this order, and now so
         does the rail. Nothing below is derived here, nothing below is new vocabulary: `committed`
         and `weekly cap` are `.budget-legend`'s own two words on CoachMarketScreen, and the bar is
         `meterPct`, the same computed the meter fills itself from.
         ⚠ THE FREE FIGURE IS UNTOUCHED – same class, same computed, same position – because D45 is
         his ruling about what this card's headline number IS, and #9 asked for more beside it, not
         for a different one. -->
    <Card as="article" class="rail-dash-card">
      <Eyebrow as="h2" class="rail-dash-title">Coaching budget</Eyebrow>
      <p class="rail-dash-figure">{{ coachingFree }}</p>
      <!-- ⚠ THE CLASSES ARE THE METER'S OWN, NOT A SECOND SET. `.budget-bar`, `.budget-legend` and
           `.legend-dot` are declared once in src/style.css and the Coach Market's meter is their
           other consumer, so this card costs the stylesheet nothing and cannot drift from the
           surface it shortcuts to. The only difference is that a 196px strip takes the legend as two
           lines where an 880px screen takes it as one. -->
      <div class="budget-bar"><i :style="{ width: meterPct + '%' }"></i></div>
      <p class="budget-legend"><span class="legend-dot committed"></span>{{ coachingCommitted }} committed</p>
      <p class="budget-legend"><span class="legend-dot cap"></span>{{ coachingCap }} weekly cap</p>
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
