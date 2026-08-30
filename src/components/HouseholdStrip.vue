<script setup lang="ts">
// ⭐⭐ THE HOUSEHOLD'S WEEK, AS ONE STRIP – round-28 #8 and its follow-up.
//
// THE OWNER, 28.08, on the coaching page's top block: «можно совокупную всю цифру показывать с
// учётом массажиста (и психолога в будущем), и даже на магазин растянуть, т.к. там тоже есть и с
// доходностью инструменты и с расходом». Approved – «это хорошо» – and then, immediately:
// «а мы можем эту шкалу на вкладке массажиста тоже показывать?»
//
// ⭐ HIS FOLLOW-UP IS THE BETTER HALF OF THE IDEA. The masseur's salary is one of the lines this
// strip TOTALS, and the dial that sets it lives on the Support staff tab – so the one screen where
// a player chooses a rung was the one screen that could not see what the rung does to the week.
// Pressing a rung there now moves the OUT figure under his thumb.
//
// ⚠⚠ WHY THIS IS A COMPONENT AND NOT A COPIED BLOCK, which is the whole point of the file. Two tabs
// quoting one figure that can drift apart is a worse defect than not showing the figure at all – and
// it is the EXACT shape of the defect this very strip was written to fix, one level down: the
// coaching meter beside it read the current ROSTER ROW's price instead of `coachBilling.weeklyCents`
// and therefore told a self-coached family it was committing $0.00 a week while it paid court rent.
// A second copy of the layout would be that bug waiting on a template edit.
//
// ⚠⚠ SO IT TAKES NO PROPS, DELIBERATELY. The figures are read HERE, off
// `snapshot.coachBilling.household`, rather than handed in by whichever tab is mounting it. A prop
// would let a caller pass a different number – which is precisely the drift the follow-up is asking
// us to make impossible – and there is nothing for a caller to legitimately vary: the household's
// week is a fact about the household, not about the tab you are looking at it from.
// `tests/component/round28-household-shared.test.ts` mounts BOTH surfaces against ONE world and
// asserts they print the same string, and is mutation-verified to redden together.
//
// ⚠ THE ENGINE DECIDED ALL OF IT (`householdWeekly` in engine/world/coachMarket.ts). Nothing is
// summed in this file: the screen lays out what the worker computed, which is why what a rung costs
// here and what the till charges cannot disagree. Cents in, cents on screen – the money is already
// integer, so there is nothing to round (the owner's standing display ruling has nothing to bite on
// here; `formatCents` is the one formatter).
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { formatCents } from '../shared/money'

const game = useGameStore()

const household = computed(() => game.snapshot?.coachBilling.household ?? null)
const inCents = computed(() => household.value?.incomeCents ?? 0)
const outCents = computed(() => household.value?.outgoingCents ?? 0)
const netCents = computed(() => household.value?.netCents ?? 0)
// The shelf only earns a mention when the family owns something that moves – a "$0.00 shelf" line is
// noise on a phone, and every junior career would carry it for years before the shop even opens.
const shelfCents = computed(() => household.value?.shelfCents ?? 0)
// ⭐⭐ ROUND 29 #5 – AND WHAT THE SHELF COSTS TO KEEP, which is a different sentence from the one
// above and has to be. `shelfCents` is a VALUATION (a car is worth less this week); this is CASH
// that really left the wallet – a yacht's crew, berth, fuel, survey and insurance. It is already
// inside the OUT figure; the line exists so the largest weekly bill in the game has a name on the
// one strip the owner asked for two rounds ago. Silent at zero, exactly as the shelf line is: every
// family that owns nothing with an upkeep is every family that has not commissioned a boat.
const upkeepCents = computed(() => household.value?.upkeepCents ?? 0)
// ⭐⭐ ROUND 29 PART FOUR P7 – AND WHAT THE PARENT'S BUSINESSES BRING IN, which is CASH like the
// upkeep line and unlike the shelf's valuation: the merch brand (follows fame) and the academy's
// built stages (follow the seasons she finished high) really bank these every week
// (`resolveBusinessIncome`). Both are already inside the IN figure – the engine's memo discipline –
// so this line NAMES them and adds nothing. Silent at zero, exactly as the shelf and upkeep lines
// are: every family that never started a business is every junior career for years.
const merchCents = computed(() => household.value?.merchCents ?? 0)
const academyIncomeCents = computed(() => household.value?.academyIncomeCents ?? 0)
const businessCents = computed(() => merchCents.value + academyIncomeCents.value)
const businessLine = computed(() => {
  const parts = []
  if (merchCents.value > 0) parts.push(`merch ${formatCents(merchCents.value)}`)
  if (academyIncomeCents.value > 0) parts.push(`the academy ${formatCents(academyIncomeCents.value)}`)
  return `Their businesses bring in ${formatCents(businessCents.value)} a week of that – ${parts.join(', ')}.`
})
// ⚠ THE SIGN IS IN THE WORD, NOT ONLY IN THE MINUS. A household spending more than it earns is the
// ordinary junior case, and "-$1,234.00 left over" is not a sentence; the magnitude is printed and
// the noun says which way it points.
const netLabel = computed(() => (netCents.value < 0 ? 'short' : 'left over'))
const netMagnitude = computed(() => Math.abs(netCents.value))
</script>

<template>
  <!-- ⚠ ONE ROOT, so a host can place this without an attribute-fallthrough warning, and so the
       ":first-child" rule in style.css can drop the top rule when the strip opens a card (the
       Support staff tab) and keep it when it follows the coaching legend (the Coaches tab).
       ⚠ THE SEPARATOR IS A SHORT DASH. House rule, and no Cyrillic may appear inside a TEMPLATE,
       this comment included – tests/round13-nav.test.ts pins it. (Script blocks carry the owner's
       words verbatim all over this codebase; the fence is the template, not the file.) -->
  <div class="household-strip">
    <p class="budget-household">
      <span class="household-label">Household, every week</span>
      <span class="household-figs">
        <strong>{{ formatCents(inCents) }}</strong> in
        <i>–</i>
        <strong>{{ formatCents(outCents) }}</strong> out
        <i>–</i>
        <strong :class="{ short: netCents < 0 }">{{ formatCents(netMagnitude) }}</strong>
        {{ netLabel }}
      </span>
    </p>
    <p v-if="shelfCents !== 0" class="hint budget-shelf">
      {{
        shelfCents > 0
          ? `The shelf is in that – it adds ${formatCents(shelfCents)} a week at today's rates.`
          : `The shelf is in that – it costs ${formatCents(-shelfCents)} a week at today's rates.`
      }}
    </p>
    <p v-if="upkeepCents > 0" class="hint budget-upkeep">
      {{ `Keeping what they own is ${formatCents(upkeepCents)} a week of that, and it is real money.` }}
    </p>
    <p v-if="businessCents > 0" class="hint budget-business">
      {{ businessLine }}
    </p>
  </div>
</template>
