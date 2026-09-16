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
// ⚠⚠ v76 – HE EXISTS NOW, AND THE PARAGRAPH ABOVE IS KEPT WORD FOR WORD BECAUSE IT PREDICTED ITS OWN
// ENDING CORRECTLY. `psychologistHired` IS on the snapshot (wave 5 T2, the psychologist's year), the
// engine holds the seat, and he cost this file exactly what that paragraph promised: one entry in
// `members`, one computed block, and one field rename on the shared rung descriptor. ⚠ AND THE
// FAILURE MODE IT NAMES IS STILL THE LAW – the card claims NOTHING he cannot yet do. His effects
// arrive per focus (T4-T7); a hired line boasting today would be «you paid and you cannot tell»
// written the other way round.
//
// ⭐ WHAT THE DESCRIPTOR HAS TO CARRY IS DECIDED BY THE ASYMMETRY, which is the plan's §2 and the
// owner's own ruling Б: «массажист ездит, психолог работает дистанционно и стоит только зарплату».
// So the travel switch and the sessions dial are OPTIONAL on a member – a remote seat has neither,
// and the two ARE the design rather than a saving. Everything else (the lock, the line, the price,
// the two confirms) every seat has, which is why those are required fields.
//
// ⚠⚠ v76 – HE ARRIVED, AND ONE HALF OF THAT PARAGRAPH WAS RIGHT AND THE OTHER HALF WAS NOT. The
// travel switch is exactly as optional as it says, and he has none: ruling Б held word for word. The
// DIAL is the half that did not survive contact – `docs/specs/the-psychologists-year-2026-09.md` §3
// gives him THREE RUNGS (a counsellor · a sport psychologist · a tour-grade specialist), so he does
// have a three-way selector under his card. What he has no version of is the thing the masseur's
// dial actually SELLS: a busier calendar. His is one session a week at every rung and the rung buys
// WHO takes the call, so the row is a ROSTER and not a quantity – `StaffRung.value` below carries the
// rung INDEX where the masseur's carries a session COUNT, which is why that field stopped being
// called `sessions` when the second seat arrived. Nothing about the masseur's card changed with it.
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
// ⭐⭐ ROUND-28 #8's FOLLOW-UP – the household's week, the SAME component the Coaches tab mounts.
//
// The owner, having approved the strip there («это хорошо»): «а мы можем эту шкалу на вкладке
// массажиста тоже показывать?» – and his reasoning decides where it goes. A salary on this payroll
// is one of the lines that strip TOTALS, and the dial that sets its size is on this tab, so this was
// the one screen where a rung could be chosen without seeing what the rung does to the week.
//
// ⚠⚠ THE SAME COMPONENT, NOT THE SAME MARKUP. `HouseholdStrip` reads `coachBilling.household` itself
// and takes NO PROPS, so neither tab can hand it a different number and there is no second
// computation to drift. Two tabs quoting one figure from two implementations is the defect class
// this strip was written to fix one level down – see the component's own header.
import HouseholdStrip from './HouseholdStrip.vue'
import { MASSEUR_LOCKED_DETAIL } from '../engine/world/masseur'
// v76 – the second seat's refusal, from the engine that throws it (the R10-16 doctrine, the masseur's
// import one line up asked of the next seat over).
// ⭐ v76 T3 – and the year-focus catalogue beside it. `PSY_FOCUSES` is the ORDER the row renders in,
// `PSY_FOCUS_LABEL` the four names and `PSY_FOCUS_LINE` what each year is for: a STATIC catalogue in
// the same register as `ECONOMY.masseur.rungs` next door, keyed on nothing the world decides, so
// reading it here leaks no derivation the snapshot should own. Everything that IS a derivation – the
// chosen year, which options are live, and the sentence for whatever is closed – comes off the wire.
import {
  PSYCHOLOGIST_LOCKED_DETAIL,
  PSY_FOCUSES,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
} from '../engine/world/psychologist'
import type { PsyFocus } from '../engine/world/state'
// v59 step 2 - the dial's option table. A static market catalogue in the same register as
// `COACH_TIER_LABEL` next door: labels and prices keyed on nothing the world decides, so reading it
// here cannot leak a derivation the snapshot should own (the card's own price stays the
// snapshot's `masseurSalaryCents`, asserted in tests/component/masseur-card.test.ts).
import { ECONOMY } from '../engine/economy'
import { formatCents } from '../shared/money'
// ⭐⭐ ROUND 43 #2 – the seat's own face. One builder, in the module that already owns every other
// portrait path, so the folder is spelled once (`src/art/preload.ts`).
import { supportPortraitUrl } from '../art/preload'

const game = useGameStore()

/** One rung of a member's dial. `priceLabel` is formatted here because the catalogue is static: what
 *  the FAMILY pays is `priceLabel` on the member below, and that one is the snapshot's.
 *
 *  ⚠ `value` IS WHATEVER THAT SEAT'S DIAL IS KEYED ON, and the two seats mean different things by it
 *  – the masseur's sessions per week (2 / 4 / 7), the psychologist's rung index (0 / 1 / 2). It is
 *  only ever compared with `dial.active` and handed back to that member's own `set`, so the card
 *  never has to know which kind it is holding. ⚠ RENAMED FROM `sessions` WHEN THE SECOND SEAT
 *  ARRIVED (v76): a field called `sessions` holding a roster position would be the masseur's own
 *  vocabulary imposed on a seat that has no sessions dial at all. */
interface StaffRung {
  value: number
  label: string
  priceLabel: string
}

/** ⭐ ONE SEAT ON THE PAYROLL. Required: the lock, the sentence, the price and the two directions –
 *  every seat has those. Optional: the dial and the travel switch, because the psychologist has
 *  neither by the owner's ruling Б and a descriptor that demanded them would force a remote seat to
 *  fake one.
 *
 *  ⚠ v76, MEASURED AGAINST THE REAL SECOND SEAT: the TRAVEL half of that sentence held exactly
 *  (ruling Б, «стоит только зарплату») and he carries no `travel` at all. The DIAL half did not – he
 *  has three rungs of his own (the spec's §3 roster) – so what the optionality really buys is a seat
 *  that may skip EITHER control, which is what the header's ⚠⚠ note above records at length.
 *
 *  ⚠ AND T3 ADDED A THIRD OPTIONAL CONTROL RATHER THAN WIDENING EITHER OF THE TWO: the YEAR'S WORK
 *  (`focus`), which only the remote seat has – the masseur's hands do one job and there is nothing
 *  for him to choose. Optionality earning its keep in the other direction, one seat later. */
interface StaffMember {
  /** Stable id – the v-for key, the `data-staff` hook a test addresses one member by, and what the
   *  two confirms below are keyed on so one dialog serves the whole list. */
  id: string
  name: string
  /** ⭐⭐ ROUND 43 #2 – THE SEAT'S PORTRAIT STEM, under `public/images/support-stuff/`. A REQUIRED
   *  field, not an optional one, and that is a claim about the descriptor rather than about today's
   *  two entries: a payroll card with a name, a price, a lock and no face would be the only card of
   *  its family without one, and the `dial` / `travel` / `focus` optionality above is reserved for
   *  controls a seat genuinely does not HAVE (ruling Б). A seat with no art is a seat with no art
   *  YET, which is a reason to draw one rather than a shape for the type to carry.
   *
   *  ⚠ `id` IS NOT REUSED AS THE STEM even though both entries agree today. `id` is the v-for key,
   *  the `data-staff` hook and the confirm dialogs' selector – a UI identity – and the stem is a
   *  FILENAME the owner chose. Tying them would make a rename of either silently 404 the other. */
  portrait: string
  unlocked: boolean
  hired: boolean
  /** The one line under the name, in whatever state he is in. */
  line: string
  /** The headline weekly figure, already formatted – the SNAPSHOT's, never the catalogue's. */
  priceLabel: string
  hireMessage: string
  releaseMessage: string
  setHired: (hire: boolean) => Promise<void>
  dial?: { label: string; active: number; rungs: StaffRung[]; set: (value: number) => Promise<void> }
  travel?: { title: string; sub: string; on: boolean; onLabel: string; offLabel: string; toggle: () => Promise<void> }
  /** ⭐ v76 T3 – THE YEAR'S WORK, and the third optional control on a seat (the masseur has no such
   *  thing: his hands do one job). `chosen` is the snapshot's, `options` carry their own `open` flag
   *  straight off the engine's `psychologistFocusOpen`, and `note` is either the ENGINE's refusal
   *  sentence or the chosen year's catalogue line – never a sentence this file composed. */
  focus?: {
    label: string
    chosen: PsyFocus | null
    /** ⭐⭐ ROUND 42 #18 – EACH OPTION CARRIES ITS OWN SENTENCE NOW: «в пунктах психолога на выбор
     *  немного расписать эффект от работы». `line` is `PSY_FOCUS_LINE[value]` and nothing else – the
     *  same owner-gated catalogue the hired card splices – so the picker says what a year buys
     *  BEFORE the choice, where the decision is actually taken. Zero new wording. */
    options: { value: PsyFocus; label: string; line: string; open: boolean }[]
    note: string
    set: (value: PsyFocus) => Promise<void>
  }
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
// ⭐⭐ ROUND 43 #3 – `priceTypographyNote`, HIS OWN WORDS, PARKED HERE FOR THIS FILE'S STANDING
// REASON: the markup and the styles below may carry no Cyrillic, and tests/round13-nav.test.ts cuts
// this file at the opening markup tag and reads to its END – so the style block is inside the rule
// too. The CSS that answers him points back at this note.
//
// ⚠⚠ AND DO NOT WRITE THAT TAG'S LITERAL NAME ANYWHERE ABOVE IT. The test cuts with the FIRST
// occurrence of the literal, so a comment that merely mentions it moves the region UP and drags every
// legitimate script-side Cyrillic quote in this file into the check. That is how this note failed on
// its first draft: the marker did not rot, it was DUPLICATED, and the helpers throw on an ABSENT
// marker but not on a second one.
//
// «сами цены внутри опций этих специалистов надо сделать покрупнее и можно пожирнее даже» (16.09)
const MASSEUR_RUNGS = ECONOMY.masseur.rungs
// ⭐⭐ ROUND 43 #4 – AND THE SESSION RATE IS THE CAREER'S, NEVER THE CONSTANT. The masseur asks for a
// rise once a year on the payroll, so `ECONOMY.masseur.perSessionCents` is the OPENING price and the
// live one is on the snapshot. Two places below read it – the three rung prices and the travel
// sub-line's per-match figure – and both would otherwise quote a price the family stopped paying,
// beside a weekly total (`masseurSalaryCents`) that is already the real one. ⚠ NOT ONE WORD MOVED
// for this: the sentences are the owner's, and only the number inside them changed source.
// The `??` is the pre-snapshot frame, where the opening price is the honest answer.
const masseurRateCents = computed(
  () => game.snapshot?.masseurPerSessionCents ?? ECONOMY.masseur.perSessionCents,
)
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
    `Table work between rounds – one more fare on every trip to a paying event, and the week is billed per match there (${formatCents(masseurRateCents.value)} each) instead of the weekly rate.`
  const trips = game.snapshot?.masseurTravelTrips ?? 0
  if (trips === 0) return rule
  const t = trips === 1 ? '1 trip' : `${trips} trips`
  return `${rule} ${formatCents(game.snapshot?.masseurTravelFareCents ?? 0)} over the ${t} booked.`
})
const masseur = computed<StaffMember>(() => ({
  id: 'masseur',
  name: 'Masseur',
  portrait: 'masseur',
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
      value: r.sessions,
      label: r.label,
      priceLabel: formatCents(r.sessions * masseurRateCents.value),
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

// --- the psychologist (v76, the psychologist's year – wave 5 T2) ---------------------------------
// ⭐ THE SECOND SEAT, AND THE ENTRY THIS WHOLE CHAPTER WAS SHAPED FOR (the header's own «adding him
// is ONE ENTRY in that array plus his own computed block» – which is what this is, and nothing else
// on the tab moved for him beyond the dial field's rename).
//
// Every fact is the SNAPSHOT's, the masseur's rule one block up: the flag, the gate, the flat
// retainer and the chosen rung all come off the wire, so the card cannot invent a number the engine
// did not derive and every click is a command the worker re-validates (invariant 1).
//
// ⚠ NO TRAVEL SWITCH – ruling Б, and the descriptor's optional `travel` is what makes its absence a
// design rather than a gap. ⚠ AND NO ROOM NOTE, which is the one place his card is QUIETER than the
// masseur's on purpose: `masseurNote` is the plan's §4 sentence about what his hands DID lately, and
// this seat has done nothing yet – every effect he has arrives with the FOCUS that names it (T4-T7).
// A hired line claiming an effect today would be «вы заплатили и не можете этого заметить» written
// the other way round: the card boasting before the engine can pay for it.
const psychologistHired = computed(() => game.snapshot?.psychologistHired ?? false)
const psychologistUnlocked = computed(() => game.snapshot?.psychologistUnlocked ?? false)
const psychologistSalary = computed(() => formatCents(game.snapshot?.psychologistSalaryCents ?? 0))
// The roster catalogue, read here for the same reason `MASSEUR_RUNGS` is: it is STATIC – labels and
// prices keyed on nothing the world decides – so reading it on the screen leaks no derivation the
// snapshot should own. The ACTIVE rung and the headline price are both the snapshot's.
const PSYCHOLOGIST_RUNGS = ECONOMY.psychologist.rungs
const psychologistRung = computed(
  () => game.snapshot?.psychologistRung ?? ECONOMY.psychologist.defaultRung,
)
async function setPsychologistRungIndex(rung: number): Promise<void> {
  if (rung === psychologistRung.value) return
  await game.setPsychologistRung(rung)
}
const psychologistRungLabel = computed(() => PSYCHOLOGIST_RUNGS[psychologistRung.value]?.label ?? '')
// ⭐⭐ v76 T3 – THE YEAR'S WORK. Three facts off the wire and not one of them derivable here, which is
// the whole reason they are on it: the CHOSEN year, the set of years the engine would accept this
// week, and the sentence for whatever is closed. ⚠ Both consent gates read the bond BAND, and the fog
// law forbids `bond` crossing to the UI in any shape – so this card is told which buttons are live
// and what to print, and never why (see `psychologistFocusRefusal`, the one place either is decided).
const psychologistFocus = computed(() => game.snapshot?.psychologistFocus ?? null)
const psychologistFocusOpen = computed(() => game.snapshot?.psychologistFocusOpen ?? [])
// The line under the row: the ENGINE's refusal while anything is closed, otherwise what the running
// year is for – and nothing at all before the first pick, because the four labelled options already
// say what is on offer and a placeholder sentence would be this file inventing copy.
const psychologistFocusNote = computed(() => {
  const detail = game.snapshot?.psychologistFocusDetail ?? ''
  if (detail) return detail
  const chosen = psychologistFocus.value
  return chosen ? PSY_FOCUS_LINE[chosen] : ''
})
async function setPsychologistFocusChoice(focus: PsyFocus): Promise<void> {
  if (focus === psychologistFocus.value) return
  await game.setPsychologistFocus(focus)
}
// The one line under his name, by state – the masseur's three-state shape exactly. LOCKED prints the
// ENGINE's own refusal (PSYCHOLOGIST_LOCKED_DETAIL – the sentence `hirePsychologist` throws), the
// R10-16 doctrine. HIRED and UNHIRED both print what the retainer IS, because that is all that is
// true of him today; the focus row that will say what he WORKS ON is T3's.
const psychologistLine = computed(() => {
  if (!psychologistUnlocked.value) return PSYCHOLOGIST_LOCKED_DETAIL
  // ⭐ THE RUNNING YEAR LIVES HERE (the owner, 14.09: «да, вписывай строку с годом» – wave-5
  // question 9). The four PSY_FOCUS_LINE sentences were on screen ~3 weeks a year, because the
  // note under the focus row correctly prints the engine's refusal whenever a change is closed
  // (R10-16 – that behaviour stays). The hired line is the surface that is visible all 52, so it
  // carries the year: the focus sentence spliced after the retainer's own opening, its first
  // letter lowered – «On retainer – the year goes on …». No focus chosen keeps the plain line.
  if (psychologistHired.value) {
    const focus = psychologistFocus.value
    if (focus !== null) {
      const year = PSY_FOCUS_LINE[focus]
      return `On retainer – ${year.charAt(0).toLowerCase()}${year.slice(1)}`
    }
    return 'On retainer – one call a week, wherever she is.'
  }
  return 'A call a week for her head – the year\'s work is chosen one year at a time.'
})
const psychologist = computed<StaffMember>(() => ({
  id: 'psychologist',
  name: 'Psychologist',
  portrait: 'psychologist',
  unlocked: psychologistUnlocked.value,
  hired: psychologistHired.value,
  line: psychologistLine.value,
  priceLabel: psychologistSalary.value,
  // Both directions ask, the screen's own doctrine – see the masseur's pair above.
  hireMessage: `Put a psychologist on the payroll at ${psychologistSalary.value} a week (${psychologistRungLabel.value.toLowerCase()})? Cancellable any week, like the coach.`,
  releaseMessage: 'Let the psychologist go? The weekly salary stops, and the calls end with the week.',
  setHired: (hire: boolean) => game.hirePsychologist(hire),
  dial: {
    label: 'Psychologist – who takes the weekly call',
    active: psychologistRung.value,
    rungs: PSYCHOLOGIST_RUNGS.map((r, i) => ({
      value: i,
      label: r.label,
      priceLabel: formatCents(r.salaryCents),
    })),
    set: setPsychologistRungIndex,
  },
  focus: {
    label: 'Psychologist – the year\'s work',
    chosen: psychologistFocus.value,
    options: PSY_FOCUSES.map((f) => ({
      value: f,
      label: PSY_FOCUS_LABEL[f],
      // ⭐⭐ ROUND 42 #18 – the catalogue sentence, imported and never re-typed. It is the SAME
      // constant the hired line splices one computed up, so a вычитка pass over `PSY_FOCUS_LINE`
      // moves the picker and the retainer's line together and they cannot drift apart.
      line: PSY_FOCUS_LINE[f],
      open: psychologistFocusOpen.value.includes(f),
    })),
    note: psychologistFocusNote.value,
    set: setPsychologistFocusChoice,
  },
}))

/** ⭐ THE LIST. Two entries since v76, and the psychologist arrived exactly as this line promised he
 *  would: one entry here, one computed block above, nothing else on the tab moved. ⚠ THE MASSEUR
 *  STAYS FIRST – he is the seat the owner commissioned, paid a wave for and then could not find, and
 *  the order on this screen is the one thing this chapter exists to get right. */
const members = computed<StaffMember[]>(() => [masseur.value, psychologist.value])

// ⚠ ONE CONFIRM PER DIRECTION FOR THE WHOLE LIST, keyed on the member id rather than a boolean per
// person: two seats would otherwise mean four flags and four dialogs in the template, which is the
// per-member refactor this chapter is shaped to avoid. Null means nothing is being asked.
const hiring = ref<string | null>(null)
const releasing = ref<string | null>(null)
// ⚠ THE TWO OPTIONAL CONTROLS ARE PRESSED THROUGH HERE AND NOT INLINE. The template's `v-if`
// narrows `m.dial` / `m.travel` for the bindings it READS, but an inline handler is generated as its
// own closure and the narrowing does not always reach inside it. A member without the control simply
// has nothing to call, which is the same answer the `v-if` already gave.
async function pressRung(m: StaffMember, value: number): Promise<void> {
  await m.dial?.set(value)
}
async function pressTravel(m: StaffMember): Promise<void> {
  await m.travel?.toggle()
}
async function pressFocus(m: StaffMember, value: PsyFocus): Promise<void> {
  await m.focus?.set(value)
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
  <!-- ⭐⭐ ROUND-28 #8's FOLLOW-UP – THE HOUSEHOLD'S WEEK, ON THE TAB THAT SETS ONE OF ITS LINES.
       The owner approved the strip on the Coaches tab and asked in the same breath for it here too;
       his words are quoted verbatim in the script block above, where the house fence allows them.
       ⚠ NO CYRILLIC INSIDE A TEMPLATE, THIS COMMENT INCLUDED – tests/round13-nav.test.ts pins it, and
       this very comment carried his sentence for one draft before the guard was run.
       HIS REASONING IS THE GOOD PART. A salary on this payroll is one of the lines that strip totals,
       and the DIAL that decides its size is a few lines down, so this was the one screen where a rung
       could be chosen without seeing what the rung does to the week. Pressing one now moves the OUT
       figure in place.
       ⚠⚠ THE SAME COMPONENT, NOT THE SAME MARKUP. `HouseholdStrip` reads
       `snapshot.coachBilling.household` itself and takes no props, so neither tab can hand it a
       different number and there is no second computation to drift – see its own header, and
       tests/component/round28-household-shared.test.ts, which mounts both surfaces against one world
       and asserts they print the same string.
       ⚠ ABOVE THE ROSTER RATHER THAN BELOW IT, matching where it sits one tab over: the budget is
       the context you read the prices in, and this chapter exists because the owner could not find
       something that was at the bottom of a long page. -->
  <section class="budget-meter staff-budget">
    <HouseholdStrip />
  </section>

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
    <!-- ⭐⭐ ROUND 43 #2: THE SEAT'S FACE, on the coach strip's principle and by his own ruling - the
         market row's treatment since round 42 #3, at a different aspect ratio. His words are quoted
         in the script block above, where the house fence allows them; the arithmetic that re-derives
         the floor for 448x624 is in `.staff-art` below. The strip is `position: absolute`, so it is
         out of the flex flow and the row's gap never applies to it, exactly as `.cm-art` is.
         ⚠ EMPTY `alt`, the coach row's own rule. The picture is decoration beside a name the card
         already prints - a screen reader that read «Masseur» and then «a masseur» would say the seat
         twice, and there is no fact here that is not already in the text.
         ⚠ NO `loading="lazy"` UNLIKE THE MARKET ROW, and the difference is the list length: sixteen
         coach rows are a scroll, two seats are a screen, and a lazy image on a card the player is
         already looking at buys a blank strip rather than a saved request. -->
    <div class="staff-card" :class="{ locked: !m.unlocked }">
      <span class="staff-art"><img :src="supportPortraitUrl(m.portrait)" alt="" /></span>
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
        :key="r.value"
        class="staff-rung"
        :class="{ active: m.dial.active === r.value }"
        role="radio"
        :aria-checked="m.dial.active === r.value ? 'true' : 'false'"
        :disabled="game.busy"
        @click="pressRung(m, r.value)"
      >
        <span class="rung-label">{{ r.label }}</span>
        <span class="rung-price">{{ r.priceLabel }}/wk</span>
      </button>
    </div>
    <!-- ⭐⭐ v76 T3: THE YEAR'S WORK - the second radio group under this seat, and the one that says
         what the retainer is FOR (the spec's own reconciliation: the RUNG buys who takes the call,
         the FOCUS buys what the call is about). Round 40's conventions, the dial's own above.
         ⚠ ONLY WHILE HIRED, and the engine agrees rather than the screen deciding: a year of work
         with nobody on the payroll is refused engine-side, so a row offered before the hire would be
         a control lying about itself (the round-20 #1 defect, and the travel switch's own rule).
         ⚠ AN OPTION IS LIVE ONLY IF THE ENGINE SAYS SO - `open` is `psychologistFocusOpen`, the very
         function the refusal is written from, so a disabled button and the click it refuses cannot
         tell two stories (R10-16). The note under the row is the engine's sentence whenever anything
         is closed, so the card EXPLAINS with the words the command throws.
         ⭐⭐ ROUND 42 #18 - AND EACH OPTION NOW SAYS WHAT THE YEAR IS FOR, under its own name. The
         owner asked for the effect of the work to be spelled out in the choices themselves, and the
         sentences already existed: `PSY_FOCUS_LINE` reached only the hired line's splice, which is
         read AFTER the decision rather than while it is being made. Zero new wording - the sub-line
         is the imported constant, the `.cm-blurb` treatment one tab over. -->
    <div v-if="m.focus && m.hired" class="staff-focus" role="radiogroup" :aria-label="m.focus.label">
      <button
        v-for="f in m.focus.options"
        :key="f.value"
        class="staff-focus-option"
        :class="{ active: m.focus.chosen === f.value }"
        role="radio"
        :aria-checked="m.focus.chosen === f.value ? 'true' : 'false'"
        :disabled="game.busy || !f.open"
        @click="pressFocus(m, f.value)"
      >
        <span class="staff-focus-name">{{ f.label }}</span>
        <span class="staff-focus-blurb">{{ f.line }}</span>
      </button>
    </div>
    <p v-if="m.focus && m.hired && m.focus.note" class="cm-load staff-focus-note">{{ m.focus.note }}</p>
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
  /* ⭐⭐ ROUND 43 #2 – THE RIGHT PADDING STAYS AND THE LEFT ONE GOES, which is `.cm-row`'s own
     `9px 12px 9px 0`: the strip is flush to the card's inner edge and the text is held off it by
     `.staff-body`'s margin instead, so one number owns the clearance. */
  padding: 10px 12px 10px 0;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  /* ⭐⭐ ROUND 43 #2 – THE PORTRAIT NEEDS A CONTAINING BLOCK AND A FLOOR, and both are here.
     `position: relative` is what makes `.staff-art`'s `top: 0; bottom: 0` resolve against THIS
     card's padding box, and `overflow: hidden` is what keeps the strip inside the rounded corner.

     ⚠⚠ 136 IS DERIVED FROM **THIS** RATIO AND IS NOT THE COACH ROW'S 168 COPIED. The guarantee is
     round-18 #2's, one ratio over: the picture is height-driven, the mask reaches transparent exactly
     at the strip's right edge, so the clip is invisible only while the picture is at least as wide as
     the strip. `.staff-art` is `top: 0; bottom: 0` of the PADDING box, so the narrowest picture this
     layout can produce is (floor - 2 borders) x 448/624.
         (136 - 2) x 448/624 = 134 x 0.717949 = 96.20 >= 96   <- the strip, filled
     and 136 is the smallest integer that holds it: 96 x 624/448 + 2 = 135.71.
     ⚠ THE COACH ROW'S ARITHMETIC IS THE SAME SENTENCE WITH THE OTHER MASTER – (196-2) x 162/280 =
     112.24 >= 112 – and 162/280 is 0.579 against this 0.718. A wider figure at the same height fills
     its window sooner, so the floor is LOWER here on a strip of the same width, and reading 168 or
     196 across would have over-floored this card by 32-60px for no guarantee at all.
     ⚠⚠ AND THE MEASURED CONSEQUENCE IS THAT THIS FLOOR BINDS EVERYWHERE, which is a real difference
     from the market row and worth writing down rather than discovering. Swept in Chromium through
     this file's own shipped rules at 320 / 375 / 768 / 900 / 1280, both seats, hired:

         width      320     375     768     900    1280
         card       136     136     136     136     136   <- the floor, at every one
         text col    83.06  138.06  531.06  663.06 1043.06
         picture     96.21 (everywhere, because the height is the floor's)

     The coach row is text-driven PAST its own floor to 208-238px at 375, so its strip is a real
     porthole onto a wider picture; this card's text never reaches 136, so the window is the whole
     96.21px picture and nothing is clipped at all. Both are the same rule - the ratio and the much
     shorter card are why the outcome differs.
     ⚠ THE NARROWEST CASE IS THE ONE TO WATCH AND IT IS CLOSE: at 320px the psychologist's longest
     hired line wraps to 8 lines, 113.4px of text plus 20px of padding and 2 of border = 135.4px,
     which is 0.6px under this floor. One more sentence on that card and it starts to clip - which is
     exactly why `.staff-art img` below carries a real `object-position` rather than a default. */
  position: relative;
  overflow: hidden;
  min-height: 136px;
}
.staff-card.locked {
  /* ⚠ ON THE WHOLE CARD AND SO THE PORTRAIT DIMS WITH IT, which is `.cm-row.blocked .cm-art`'s
     intent reached by the shorter road: a seat the career cannot open yet should read as one
     picture and all. Nothing here needed a second rule. */
  opacity: 0.75;
}
/* ⭐⭐ ROUND 43 #2 – THE STRIP. 96px, the same window the coach roster uses one tab over, and that
   is a deliberate borrowing rather than a coincidence: this chapter already borrows `.cm-load` and
   `.cm-action` so the two card families read as one screen, and a third portrait width on the same
   screen would be the thing that makes them read as two.
   ⚠ `position: absolute` KEEPS IT OUT OF THE FLEX FLOW, so the card's `gap: 10px` never applies to
   it and `.staff-body`'s margin is the only thing that decides the clearance - `.cm-art`'s own
   arrangement, and the reason round-18 #2's feedback loop (a wider strip wraps a line, a taller card
   widens the picture) cannot start here.
   ⚠ THE MASK IS THE COACH STRIP'S, STOP FOR STOP. Its stops are percentages of THIS box, so the fade
   reaches transparent exactly at the clip line - which is what the floor above exists to keep true. */
.staff-art {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 96px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 52%, transparent 100%);
  mask-image: linear-gradient(90deg, #000 0%, #000 52%, transparent 100%);
}
/* ⭐⭐ ROUND 43 #2 – AND IT IS A CLIP, NEVER A STRETCH, which is the A2c/d ruling `.cm-art img`
   inherits and the one thing a `cover` on this box has to prove. `cover` scales by
   max(boxW/imgW, boxH/imgH); while the box is narrower than the picture's own ratio the height term
   wins, the picture is scaled to exactly the box's height and every overflowing pixel is spent
   sideways. "The box is narrower than the ratio" is precisely what the floor above guarantees.

   ⚠⚠ 30% IS MEASURED ON **THESE TWO MASTERS** AND ROUND 42 #3's «8-62%» IS NOT REUSED. That reading
   was taken off the sixteen coach masters - men framed head-on, short hair - and these are two women
   with hair well past the jaw, so it does not transfer. Read here off a percentage grid rendered over
   each 448x624 master, taking the head box as the hair's outline at HEAD height (the top of the hair
   through the chin) rather than the hair that falls onto the shoulders:
       masseur        [0.16, 0.58]        psychologist  [0.20, 0.74]
   so the union both must fit inside is [0.16, 0.74] - 0.58 of the picture's width, against the coach
   masters' 0.54. ⚠ IT IS A READING OFF A GRID AND NOT A PIXEL TRACE: the edges are quoted to two
   decimals and are good to about +/-0.02, which is why the margins below are quoted in units the
   slack swallows.
   ⚠⚠ 38 IS THE p THAT SURVIVES THE MOST, and it is derived rather than aimed. Write the window as
   [L, L+w] in picture fractions, w = strip/picture and L = p(1-w). Containment of [a, b] needs
       (b - w) / (1 - w)  <=  p  <=  a / (1 - w)
   and those two bounds close on each other as the card grows: they MEET at w = b - a = 0.58, where
   the only p that works is a/(1-0.58) = 0.16/0.42 = 0.381. So 38% is the single value that holds over
   the whole reachable range - every window from w = 0.60 (a 160px picture, a 225px card, 1.65x this
   floor) up to the floor's own w = 0.998 - and any other choice narrows that range from one end or
   the other. It is round 42 #3's own rule, «the p that makes the two margins equal», evaluated at the
   worst case rather than at a typical one.
   ⚠ WHY IT MATTERS AT ALL WHEN NOTHING CLIPS TODAY. At the floor the picture IS the strip and every p
   from 0 to 100 shows both heads - so this is the one declaration whose default would look perfect
   now and be wrong the first time a sentence is added (the measured margin at 320px is 0.6px). A card
   grows by one honest sentence at a time, which is CLAUDE.md's own note about dialogs read one box
   over. */
.staff-art img {
  display: block;
  height: 100%;
  width: 100%;
  object-fit: cover;
  object-position: 38% 50%;
}
.staff-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
  /* ⭐⭐ ROUND 43 #2 – 96 (the strip) + 12 of air, which is `.cm-body`'s own pair and the 10-15px band
     the owner negotiated in round-18 (his words are quoted at that rule in src/style.css, and in the
     script block above, because no rule below the markup in this file may carry them).
     ⚠ THE TWO NUMBERS ARE TIED BY A TEST AND NOT BY THIS COMMENT:
     tests/component/round43-staff-portrait.test.ts reads both off the mounted cascade and fails if
     the gap leaves that band. Move one, move the other. */
  margin-left: 108px;
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
  /* ⚠ ROUND 43 #3 – `min-width: 0` is the flex-overflow guard, not a tidy-up: a flex item defaults to
     `min-width: auto`, so without this a wider price label widens the whole row instead of fitting
     inside its third of it. */
  min-width: 0;
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
/* ⭐⭐ ROUND 43 #3 – THE PRICE IS THE THING HE IS COMPARING, so it stopped being the smallest text
   on the pill. His ask of 16.09 is parked in `priceTypographyNote` in the script block above, for
   this file's standing reason: the markup and these styles may carry no Cyrillic, and
   tests/round13-nav.test.ts cuts the file at the opening markup tag and reads to its END.
   It was 10px at 0.75 opacity inside an 11px pill – SMALLER and fainter than the label above it,
   which inverts what the row is for: the label says what a rung is, the price says what it costs,
   and the second is the one being weighed against two others.
   ⚠ TYPOGRAPHY ONLY – not one string moved, which is what makes it safe under invariant 4.
   ⚠⚠ AND THE CONSTRAINT IS NOT THE 2x2 WRAP – that belongs to `.staff-focus` below, which is a
   DIFFERENT element (four focus pills that wrap). This row is `.staff-dial` – `display: flex` with
   `flex: 1` rungs, three across, and it does NOT wrap. Written down because the first draft of this
   note borrowed the neighbour's reason, which is how a wrong constraint gets inherited.
   ⚠ THE REAL RISK IS FLEX OVERFLOW: a flex item's default `min-width: auto` lets a wide child push
   the item past its share, so a bigger price can widen the row rather than shrink to it. `min-width:
   0` on the rung is the guard, and `tabular-nums` keeps every price the same width whatever the
   digits – so the widest pill no longer depends on whether the number is $150 or $1,050.
   Arithmetic at 375px: ~340px of card, three rungs and two 6px gaps leaves ~109px a pill, ~101px of
   content after padding, against about 55px for «$525/wk» at 12px/600. */
.staff-rung .rung-price {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.9;
}
.staff-travel {
  margin-top: 8px;
}
/* ⭐ v76 T3 - the year's work. The dial's own pills, with ONE difference that is the content's and
   not a taste: there are FOUR of them and their names are two and three words long, so the row WRAPS
   into two-by-two rather than squeezing four labels into 375px of phone. `flex-basis` is half the row
   minus the gap, which is what makes the wrap land on 2x2 instead of 3+1. */
.staff-focus {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.staff-focus-option {
  flex: 1 1 calc(50% - 3px);
  padding: 6px 4px;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 8px;
  background: none;
  font-size: 11px;
  line-height: 1.2;
  /* ⭐⭐ ROUND 42 #18 – a name over a sentence, so the two stack inside the one control rather than
     running together on a line. The button was a single word before this item. */
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}
.staff-focus-name {
  font-weight: 600;
}
/* ⭐⭐ ROUND 42 #18 – WHAT THE YEAR IS FOR, in `.cm-blurb`'s treatment to the value (10.5px/1.35,
   `--muted`): quiet prose under a name it captions, never competing with it. The sentence is
   `PSY_FOCUS_LINE`'s and wraps as prose – these are 60-90 characters and the cell is half a phone
   wide, so `nowrap` would be the wrong rule and an ellipsis would hide the half he asked to see. */
.staff-focus-blurb {
  font-size: 10.5px;
  font-weight: 400;
  line-height: 1.35;
  color: var(--muted);
}
.staff-focus-option.active {
  border-color: var(--accent, #4da3ff);
  color: var(--accent, #4da3ff);
}
/* A closed option is dimmed rather than hidden: which years exist is a fact about the game, and
   which are open this week is a fact about this week - the note under the row says which. */
.staff-focus-option:disabled {
  opacity: 0.5;
}
.staff-focus-note {
  margin-top: 6px;
}
/* ⭐ ROUND-28 #8's follow-up – the frame the household strip sits in at the head of this tab. It
   borrows `.budget-meter` (global) for the padding and the radius so the two tabs' strips are the
   same object, and adds only the gap to the first payroll head below it. */
.staff-budget {
  margin-bottom: 12px;
}
</style>
