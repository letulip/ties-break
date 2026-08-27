<script setup lang="ts">
// SUPPORT STAFF – the third chapter of screen T, beside `Her week` and `Coaches`.
//
// ⭐⭐ WHY THIS FILE EXISTS AT ALL, and it is a DEFECT REPORT, not a feature. The owner, 27.08:
// «на счет массажиста: он сейчас находится реально "на дне" страницы коучей, его там никто и никогда
// не найдет (я вот не нашел, кстати) - вынеси отдельную вкладку на уровне Her week/Coaches ->
// Her week/Coaches/Support Stuff (туда же и психолог приедет потом, а я как раз еще арты для них
// сделаю)». He commissioned the masseur, paid a whole wave for him, and then could not find him:
// the block sat at template line 1046 of a 1223-line file, BELOW the entire coach roster, the
// budget meter, the plan regulator and the self-coaching rung. Nothing about his behaviour was
// wrong; the only thing wrong was where he was.
//
// ⭐⭐ AND IT IS A LIST OF PEOPLE, NOT A MASSEUR SCREEN. The psychologist is already sequenced –
// `docs/plans/the-travelling-team-2026-08.md` §5 ships him with the private-life layer's step 5, and
// `docs/backlog/the-private-life-layer.md` #2 carries his shape – and the owner is drawing art for
// both in the same sentence he asked for this tab. A screen built around one man would have to be
// rebuilt for two, so the chapter renders `members`, a v-for, and adding him is ONE ENTRY in that
// array plus his own computed block. ⚠ HE IS NOT BUILT HERE: he does not exist in the engine, there
// is no `psychologistHired` on the snapshot, and inventing one would be the "salary the player
// cannot see working" that the plan's own §5 names as its failure mode.
//
// ⭐ WHAT THE DESCRIPTOR HAS TO CARRY IS DECIDED BY THE ASYMMETRY, which is the plan's §2 and the
// owner's own ruling Б: «массажист ездит, психолог работает дистанционно и стоит только зарплату».
// So the travel switch and the sessions dial are OPTIONAL on a member – a remote seat has neither,
// and the two ARE the design rather than a saving. Everything else (the lock, the line, the price,
// the two confirms) every seat has, which is why those are required fields.
//
// WHAT THIS FILE DOES NOT DECIDE. Every fact below is the SNAPSHOT's – the flag, the gate, the flat
// salary, the room note, the as-if fare – so the card cannot invent a number the engine did not
// derive, and every click is a command the worker re-validates (CLAUDE.md invariant 1). The move
// changed no behaviour and no schema: `masseurHired`, `masseurUnlocked`, `masseurSalaryCents`,
// `masseurSessionsPerWeek`, `masseurTravels`, `masseurTravelFareCents` and `masseurTravelTrips` were
// all already on the snapshot before this file existed.
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import ConfirmDialog from './ConfirmDialog.vue'
import { MASSEUR_LOCKED_DETAIL } from '../engine/world/masseur'
// v59 step 2 - the dial's option table. A static market catalogue in the same register as
// `COACH_TIER_LABEL` next door: labels and prices keyed on nothing the world decides, so reading it
// here cannot leak a derivation the snapshot should own (the card's own price stays the
// snapshot's `masseurSalaryCents`, asserted in tests/component/masseur-card.test.ts).
import { ECONOMY } from '../engine/economy'
import { formatCents } from '../shared/money'

const game = useGameStore()

/** One rung of a member's sessions dial. `priceLabel` is formatted here because the catalogue is
 *  static: what the FAMILY pays is `priceLabel` on the member below, and that one is the snapshot's. */
interface StaffRung {
  sessions: number
  label: string
  priceLabel: string
}

/** ⭐ ONE SEAT ON THE PAYROLL. Required: the lock, the sentence, the price and the two directions –
 *  every seat has those. Optional: the dial and the travel switch, because the psychologist has
 *  neither by the owner's ruling Б and a descriptor that demanded them would force a remote seat to
 *  fake one. */
interface StaffMember {
  /** Stable id – the v-for key, the `data-staff` hook a test addresses one member by, and what the
   *  two confirms below are keyed on so one dialog serves the whole list. */
  id: string
  name: string
  unlocked: boolean
  hired: boolean
  /** The one line under the name, in whatever state he is in. */
  line: string
  /** The headline weekly figure, already formatted – the SNAPSHOT's, never the catalogue's. */
  priceLabel: string
  hireMessage: string
  releaseMessage: string
  setHired: (hire: boolean) => Promise<void>
  dial?: { label: string; active: number; rungs: StaffRung[]; set: (sessions: number) => Promise<void> }
  travel?: { title: string; sub: string; on: boolean; onLabel: string; offLabel: string; toggle: () => Promise<void> }
}

// --- the masseur (v59, the travelling team step 1) -----------------------------------------------
// The first salaried seat beyond the coach. Every fact on the card is the SNAPSHOT's – the flag, the
// gate, the flat salary, and his room note (the plan's §4 sentence) – so the card cannot invent a
// number the engine did not derive.
const masseurHired = computed(() => game.snapshot?.masseurHired ?? false)
const masseurUnlocked = computed(() => game.snapshot?.masseurUnlocked ?? false)
const masseurSalary = computed(() => formatCents(game.snapshot?.masseurSalaryCents ?? 0))
// The one line under his name, by state. LOCKED prints the ENGINE's own refusal
// (MASSEUR_LOCKED_DETAIL – the sentence `hireMasseur` throws), the R10-16 doctrine: a disabled
// control and the click it refuses must tell one story. HIRED prints the room note. UNHIRED prints
// the pitch – what the salary buys, in the units the player reads, no figures (they are on the
// price beside it).
const masseurLine = computed(() => {
  if (!masseurUnlocked.value) return MASSEUR_LOCKED_DETAIL
  if (masseurHired.value) return game.snapshot?.masseurNote ?? ''
  return 'Table work at home every week, and a hand on every rehab – layoffs end sooner.'
})
// ⭐ v59 step 2 – THE DIAL, the owner's own idea («настройки сколько раз в неделю он дает свои
// услуги»). Three rungs off the market catalogue; the ACTIVE one is the snapshot's, the click is a
// command the engine re-validates, and the card's headline price follows the snapshot because the
// engine prices the rung – this screen sets a dial, it never computes a bill.
const MASSEUR_RUNGS = ECONOMY.masseur.rungs
const masseurSessions = computed(
  () => game.snapshot?.masseurSessionsPerWeek ?? ECONOMY.masseur.defaultSessions,
)
async function setMasseurRung(sessions: number): Promise<void> {
  if (sessions === masseurSessions.value) return
  await game.setMasseurSessions(sessions)
}
const masseurRungLabel = computed(
  () => MASSEUR_RUNGS.find((r) => r.sessions === masseurSessions.value)?.label ?? '',
)
// ...AND THE SEAT (ruling Б: the masseur travels). The coach's own switch idiom on the Coaches tab,
// asked of the next seat over; the sub-line quotes the booked trips off the SNAPSHOT's as-if
// price, so the row can say what the switch costs before it is flipped.
const masseurTravels = computed(() => game.snapshot?.masseurTravels ?? false)
async function toggleMasseurTravel(): Promise<void> {
  await game.setMasseurTravels(!masseurTravels.value)
}
const masseurTravelSub = computed(() => {
  // ⭐ The per-match sentence is the owner's 22.08 pricing rule («на неделе выезда по-матчевая
  // цена заменяет недельную»), on the switch that buys it: a travel week is billed per match at
  // the session rate instead of the weekly figure above – the price READS off the card before the
  // switch is flipped, which is the whole legibility contract of this screen.
  const rule =
    `Table work between rounds – one more fare on every trip to a paying event, and the week is billed per match there (${formatCents(ECONOMY.masseur.perSessionCents)} each) instead of the weekly rate.`
  const trips = game.snapshot?.masseurTravelTrips ?? 0
  if (trips === 0) return rule
  const t = trips === 1 ? '1 trip' : `${trips} trips`
  return `${rule} ${formatCents(game.snapshot?.masseurTravelFareCents ?? 0)} over the ${t} booked.`
})
const masseur = computed<StaffMember>(() => ({
  id: 'masseur',
  name: 'Masseur',
  unlocked: masseurUnlocked.value,
  hired: masseurHired.value,
  line: masseurLine.value,
  priceLabel: masseurSalary.value,
  // Both directions ask, the screen's own doctrine (see the coach's `releasing` next door): a screen
  // that asks before it starts paying somebody and not before it stops is not neutral about the two.
  hireMessage: `Put a masseur on the payroll at ${masseurSalary.value} a week (${masseurRungLabel.value.toLowerCase()})? Cancellable any week, like the coach.`,
  releaseMessage: 'Let the masseur go? The weekly salary stops, and rehab goes back to the clinic alone.',
  setHired: (hire: boolean) => game.hireMasseur(hire),
  dial: {
    label: 'Masseur sessions per week',
    active: masseurSessions.value,
    rungs: MASSEUR_RUNGS.map((r) => ({
      sessions: r.sessions,
      label: r.label,
      priceLabel: formatCents(r.sessions * ECONOMY.masseur.perSessionCents),
    })),
    set: setMasseurRung,
  },
  travel: {
    title: 'Masseur travels to tournaments',
    sub: masseurTravelSub.value,
    on: masseurTravels.value,
    onLabel: 'Masseur travels to tournaments - on. Press to keep the table work at home.',
    offLabel:
      'Masseur travels to tournaments - off. Press to buy one more fare on every trip, for table work between rounds.',
    toggle: toggleMasseurTravel,
  },
}))

/** ⭐ THE LIST. One entry today; the psychologist is a second entry here and his own computed block
 *  above, and nothing else on this tab has to move for him. */
const members = computed<StaffMember[]>(() => [masseur.value])

// ⚠ ONE CONFIRM PER DIRECTION FOR THE WHOLE LIST, keyed on the member id rather than a boolean per
// person: two seats would otherwise mean four flags and four dialogs in the template, which is the
// per-member refactor this chapter is shaped to avoid. Null means nothing is being asked.
const hiring = ref<string | null>(null)
const releasing = ref<string | null>(null)
// ⚠ THE TWO OPTIONAL CONTROLS ARE PRESSED THROUGH HERE AND NOT INLINE. The template's `v-if`
// narrows `m.dial` / `m.travel` for the bindings it READS, but an inline handler is generated as its
// own closure and the narrowing does not always reach inside it. A member without the control simply
// has nothing to call, which is the same answer the `v-if` already gave.
async function pressRung(m: StaffMember, sessions: number): Promise<void> {
  await m.dial?.set(sessions)
}
async function pressTravel(m: StaffMember): Promise<void> {
  await m.travel?.toggle()
}
const hiringMember = computed(() => members.value.find((m) => m.id === hiring.value) ?? null)
const releasingMember = computed(() => members.value.find((m) => m.id === releasing.value) ?? null)
async function doHire(): Promise<void> {
  const m = hiringMember.value
  hiring.value = null
  await m?.setHired(true)
}
async function doRelease(): Promise<void> {
  const m = releasingMember.value
  releasing.value = null
  await m?.setHired(false)
}
</script>

<template>
  <!-- ⚠ THE HEAD IS THE MEMBER, NOT THE GROUP, AND THAT IS THE ONE THING THE MOVE CHANGED. The block
       used to be headed «Support staff / $150 /wk» with his name repeated inside the card, because
       the group had exactly one member and no tab of its own. The tab now says «Support staff», so
       that head would have been the same words twice on one screen - and with a second seat it would
       have been the same words twice per person. The head carries who he is and what he costs (the
       coach roster's own tier-head/tier-range idiom, one section up); the card carries what he does
       and the one control. Nothing else about him moved. -->
  <section v-for="m in members" :key="m.id" class="bare staff-block" :data-staff="m.id">
    <p class="tier-head">
      <span class="tier-name">{{ m.name }}</span>
      <span class="tier-range">{{ m.priceLabel }} /wk</span>
    </p>
    <div class="staff-card" :class="{ locked: !m.unlocked }">
      <span class="staff-body">
        <span class="cm-load staff-line">{{ m.line }}</span>
      </span>
      <span class="staff-right">
        <span v-if="!m.unlocked" class="cm-action is-locked">Locked</span>
        <button v-else-if="!m.hired" :disabled="game.busy" @click="hiring = m.id">Hire</button>
        <button v-else :disabled="game.busy" @click="releasing = m.id">Let go</button>
      </span>
    </div>
    <!-- ⭐ v59 step 2: THE DIAL - the owner's own idea, three rungs off the market catalogue.
         Offered from the unlock (choosing the arrangement BEFORE hiring prices the card and the
         confirm honestly); the active rung is the snapshot's, and the headline price above
         follows it because the ENGINE prices the rung. A seat with no dial simply has none. -->
    <div v-if="m.dial && m.unlocked" class="staff-dial" role="radiogroup" :aria-label="m.dial.label">
      <button
        v-for="r in m.dial.rungs"
        :key="r.sessions"
        class="staff-rung"
        :class="{ active: m.dial.active === r.sessions }"
        role="radio"
        :aria-checked="m.dial.active === r.sessions ? 'true' : 'false'"
        :disabled="game.busy"
        @click="pressRung(m, r.sessions)"
      >
        <span class="rung-label">{{ r.label }}</span>
        <span class="rung-price">{{ r.priceLabel }}/wk</span>
      </button>
    </div>
    <!-- ...AND THE SEAT (the owner's ruling B: the masseur travels) - the coach's own switch idiom
         one tab over, asked of the next seat over. Only while HIRED: with nobody on the payroll
         the switch would send nobody anywhere, and a row that looked live would be the control
         lying about itself (the round-20 #1 defect). A remote seat carries no travel at all. -->
    <section v-if="m.travel && m.hired" class="cm-travel staff-travel">
      <div class="cm-travel-text">
        <p class="cm-travel-title">{{ m.travel.title }}</p>
        <p class="cm-travel-sub">{{ m.travel.sub }}</p>
      </div>
      <button
        class="cm-switch"
        role="switch"
        :aria-checked="m.travel.on ? 'true' : 'false'"
        :disabled="game.busy"
        :aria-label="m.travel.on ? m.travel.onLabel : m.travel.offLabel"
        @click="pressTravel(m)"
      >
        <span class="cm-switch-knob"></span>
      </button>
    </section>
  </section>

  <ConfirmDialog
    v-if="hiringMember"
    :message="hiringMember.hireMessage"
    confirm-label="Hire"
    @confirm="doHire"
    @cancel="hiring = null"
  />
  <ConfirmDialog
    v-if="releasingMember"
    :message="releasingMember.releaseMessage"
    confirm-label="Let go"
    @confirm="doRelease"
    @cancel="releasing = null"
  />
</template>

<style scoped>
/* v59 - the staff card, moved here whole with the markup it styles (27.08). Scoped for the
   HomeScreen-documented reason: exactly one surface can want it. It borrows the roster's own text
   classes (.cm-load / .cm-action) so the two card families read as one screen, and only the frame is
   its own: no portrait strip, so the .cm-row grid does not fit, and a plain flex row does.

   ⚠ RENAMED `.masseur-*` -> `.staff-*` IN THE MOVE, and that is the only edit these rules took. A
   psychologist rendered through a rule called `.masseur-card` is the "screen shaped around one
   person" this chapter exists not to be; the declarations themselves are byte-for-byte what shipped
   in v59. */
.staff-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
}
.staff-card.locked {
  opacity: 0.75;
}
.staff-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.staff-line {
  margin-top: 0;
}
.staff-right {
  flex: none;
  display: flex;
  align-items: center;
}
/* v59 step 2 - the dial. Three equal pills under the card; the active one carries the accent the
   segmented rows already use, so the control reads as the same family without borrowing the
   roster's grid. */
.staff-dial {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.staff-rung {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: none;
  font-size: 11px;
  line-height: 1.2;
}
.staff-rung.active {
  border-color: var(--accent, #4da3ff);
  color: var(--accent, #4da3ff);
}
.staff-rung .rung-price {
  font-size: 10px;
  opacity: 0.75;
}
.staff-travel {
  margin-top: 8px;
}
</style>
