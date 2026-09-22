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
// ⭐⭐⭐ v80, WAVE F2 – the third seat's refusal, from the engine that throws it (the R10-16 doctrine,
// asked of one more seat). Nothing else of his is imported: his rung catalogue is `ECONOMY.sparring`
// below, and every live fact is the snapshot's.
import { SPARRING_LOCKED_DETAIL } from '../engine/world/sparring'
import type { PsyFocus } from '../engine/world/state'
// v59 step 2 - the dial's option table. A static market catalogue in the same register as
// `COACH_TIER_LABEL` next door: labels and prices keyed on nothing the world decides, so reading it
// here cannot leak a derivation the snapshot should own (the card's own price stays the
// snapshot's `masseurSalaryCents`, asserted in tests/component/masseur-card.test.ts).
import { ECONOMY } from '../engine/economy'
// ⭐⭐ 17.09 – THE THIRD READER OF ROUND 42 #28's ONE SELECTOR, and it was always the missing rung.
// `psychologistFocusNudge` is read on Home (the Coach-note plate's dot) and on the Coaches screen
// (the Support-staff tab pill); the marker walks him here and then the block he was walked to looked
// exactly as it looks on any other week. His ask: «всё-таки надо подсвечивать весь блок выбора работы
// на год в межсезонье, когда мы приводим пользователя по маркеру с home».
//
// ⚠⚠ ONE DELIBERATE WIDENING, FLAGGED RATHER THAN HIDDEN. Driving the glow off the SHARED selector
// means the block lights whenever the marker is up – including when he opens this tab himself instead
// of following the dot. The alternative is an arrival state carried across two screens, which is a
// second source of truth that can disagree with the dot, and round 42 #28 built this selector
// precisely so the entries on one path cannot disagree. A third entry on that path should not be the
// one that breaks it. If he wants it strictly on arrival that is a one-line change later.
import { psychologistFocusNudge } from '../shared/protocol'
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
  /** ⭐⭐ 17.09 – WHAT THIS RUNG BUYS, in one sentence under its name, and OPTIONAL because exactly
   *  one of the three seats has been given the sentences. `ECONOMY.sparring.rungs[n].note` is the
   *  owner's own set A; the masseur's sessions dial and the psychologist's roster have no drafts he
   *  has seen, so a required field would make this file invent two he never ruled on (invariant 4).
   *  A rung without a note renders nothing at all – no empty element, no reserved line. */
  note?: string
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
  /** ⭐⭐ ROUND 42 #46 – WHAT THIS SEAT'S FARE BUYS, in one standing sentence at the foot of the card.
   *
   *  THE OWNER, 15.09: «можно как-то показывать игроку преимущества всех ездящих специалистов, что он
   *  получает. С главным тренером понятно, а вот с остальными двумя не очень.» The travel switch is a
   *  real price – a second fare, every event week – and the game stated what it bought for exactly one
   *  seat, the coach's.
   *
   *  ⚠ OPTIONAL, AND THE TWO SEATS THAT CARRY NONE CARRY NONE FOR OPPOSITE REASONS. The hitting
   *  partner's own travel sub-line already says which half the fare buys, in the owner's own 17.09
   *  words, so a second sentence here would be a draft he never asked for beside an approved one he
   *  did (invariant 4). The masseur has TWO states and the psychologist has NO switch at all, which is
   *  why this is a plain sentence per state rather than a field on `travel`: the seat with the most to
   *  say about a fare is the one that never pays one.
   *
   *  ⚠ NO NUMBER IN IT, BY ROUND 42 #46's OWN RULE. `tourRecoveryPerRound` is a tuning constant and
   *  printing it would pin copy to a dial; the sentence says the SHAPE – more the further she goes,
   *  nothing on a first-round exit – which stays true when the constant moves. */
  fareLine?: string
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
     *  BEFORE the choice, where the decision is actually taken. Zero new wording.
     *  ⭐⭐ 17.09 – AND EACH OPTION NOW CARRIES THE QUESTION ITS PRESS ASKS (`confirm`), because the
     *  question names the option: a confirmation that did not say WHICH year was about to be bought
     *  would not answer «вдруг человек промахнулся» at all. It rides on the option rather than on the
     *  row for that reason, and it is composed once in `psychologistFocusConfirm`. */
    options: { value: PsyFocus; label: string; line: string; open: boolean; confirm: string }[]
    note: string
    /** ⭐⭐ 17.09 – IS THE MARKER UP FOR THIS ROW. The shared `psychologistFocusNudge` and nothing
     *  else, so the block, Home's dot and the tab pill are three readings of ONE fact. It rides on
     *  the descriptor rather than being read in the markup because this chapter renders `members`:
     *  a seat that one day has a year's work of its own gets the glow by filling this field in. */
    nudge: boolean
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
//
// ⭐⭐ 17.09 – `focusPaddingNote`, HIS OWN WORDS, PARKED HERE FOR THE SAME STANDING REASON. The
// year's-work cards were `padding: 6px 4px` – four pixels at the sides – and the rule that answers
// him (`.staff-focus-option`, in the style block below) points back at this note.
//
// «у психолога в карточках варианта работы на сезон маловато внутренних отступов (тексту очень
// тесно)» (17.09)
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
    `Table work between rounds – one additional fare per trip to a paying event, and the week is billed per match there (${formatCents(masseurRateCents.value)} each) instead of the weekly rate.`
  const trips = game.snapshot?.masseurTravelTrips ?? 0
  if (trips === 0) return rule
  const t = trips === 1 ? '1 trip' : `${trips} trips`
  return `${rule} ${formatCents(game.snapshot?.masseurTravelFareCents ?? 0)} over the ${t} booked.`
})
// ⭐⭐ ROUND 42 #46 – WHAT HIS FARE BUYS, ONE SENTENCE PER STATE, and both are the owner's: he read
// them on 16.09 and ruled «слова массажиста ок». They stand BESIDE the travel sub-line above rather
// than replacing it – that one is the PRICE and the mechanic, this one is the benefit – and 46-b
// stands beside his existing feed sentence («The masseur stays home on tournament weeks – the table
// waits for her return») for the reason the item gives: that line is a one-off event row and this is
// the standing line on the card.
// ⚠ THE SHAPE IS THE TELLABLE PART AND IT IS TRUE OF THE ENGINE: the travelling masseur buys
// `masseurTourRelief`, recovery BETWEEN ROUNDS, scaled by `tourRecoveryPerRound × (matchesPlayed − 1)`
// and capped by the strain she is actually carrying. So it really does pay nothing on a first-round
// exit and most on a deep run, which is what the sentence says and the only thing it says.
const masseurFareLine = computed(() =>
  masseurTravels.value
    ? 'Travels with her: table work between rounds. The deeper the run, the more it buys – a first-round exit buys nothing.'
    : 'Stays home on tournament weeks. One fare saved on every trip.',
)
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
  hireMessage: `Hire a masseur for ${masseurSalary.value} a week (${masseurRungLabel.value.toLowerCase()})? You can end the arrangement any week, like the coach.`,
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
    onLabel: 'Masseur travels to tournaments – on. Press to keep the table work at home.',
    offLabel:
      'Masseur travels to tournaments – off. Press to buy one additional fare per trip, for table work between rounds.',
    toggle: toggleMasseurTravel,
  },
  fareLine: masseurFareLine.value,
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
// ⭐⭐ 17.09 – AND THE SECOND HALF OF THE RE-AFFIRMATION DEFECT LIVED HERE, not in the engine.
// `if (focus === psychologistFocus.value) return` stood at the top of this function and mirrored the
// engine's own guard one layer down, so the owner's «same again this year» was swallowed twice over:
// the screen never sent the command, and the command would not have stamped the season if it had.
// `setPsychologistFocus`'s note in `engine/world/psychologist.ts` carries the whole diagnosis and the
// reason the stamp is not part of the no-op.
// ⚠ THE DIAL AND THE ROSTER KEEP THEIRS, and the difference is the commitment rather than a
// preference: a rung is a price that can be changed any week, so re-pressing the one she is on really
// is nothing. A focus LOCKS the row for the rest of the off-season, so re-pressing it is the year.
async function setPsychologistFocusChoice(focus: PsyFocus): Promise<void> {
  await game.setPsychologistFocus(focus)
}
/** ⭐⭐ 17.09 – THE ASK BEFORE THE YEAR IS SET, his own words: «вдруг человек промахнулся». The pick is
 *  a season-long commitment taken by ONE press on a half-width card, and it closes the row for the
 *  rest of the off-season the moment it lands (`PSYCHOLOGIST_FOCUS_SEASON_REFUSAL`), so a misfire
 *  costs a year and there is no way back.
 *
 *  ⚠ THE EXISTING IDIOM, ASKED OF ONE MORE CONTROL – `hireMessage` / `releaseMessage` already drive
 *  this tab's confirm for the two directions of a hire, and this is a third message through the same
 *  `ConfirmDialog`, not a new component.
 *
 *  ⚠ DRAFT, and it is the only new player-facing sentence this repair adds (invariant 4). The
 *  vocabulary is deliberately the engine's own refusal – «the year's work», «chosen … once a season»,
 *  «the off-season» – so the ask and the sentence it will one day be refused by read as one story.
 *  A confirmation's voice is COMPLETELY LITERAL, which is his rule and why this names the option and
 *  the lock and nothing else. */
function psychologistFocusConfirm(label: string): string {
  return (
    `Set the psychologist's work for this season to ${label}? ` +
    'The year\'s work is chosen once a season, and the next choice comes in the next off-season.'
  )
}
// ⭐⭐ 17.09 – THE MARKER, READ HERE EXACTLY AS IT IS READ ON THE OTHER TWO SURFACES: the shared
// selector and nothing local. `HomeScreen.vue` and `CoachMarketScreen.vue` open with this same line,
// which is what makes the dot, the tab pill and the block below three readings of ONE fact rather
// than three predicates that can drift. Nothing about arrival is consulted – see the import's note.
const psychologistNudge = computed(() => psychologistFocusNudge(game.snapshot))
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
  hireMessage: `Hire a psychologist for ${psychologistSalary.value} a week (${psychologistRungLabel.value.toLowerCase()})? You can end the arrangement any week, like the coach.`,
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
      confirm: psychologistFocusConfirm(PSY_FOCUS_LABEL[f]),
    })),
    note: psychologistFocusNote.value,
    nudge: psychologistNudge.value,
    set: setPsychologistFocusChoice,
  },
  // ⭐⭐ ROUND 42 #46 – AND THE SEAT WITH NO SWITCH GETS THE SENTENCE MOST, which is the correction the
  // owner himself made to the first draft and the good kind: it had said the sessions are weekly work
  // at home rather than tournament-side, and his answer was «психолог не ездит, но онлайн созвоны
  // вполне может делать». The engine agrees with him in its own comment – `psychologistWorksThisWeek`
  // says the retainer «runs on a tournament week exactly as the coach's does» and works through a
  // layoff because «an injury is when the head needs the call most» – so the seat has no fare, no
  // stand-down and no gap at all. That is a POSITIVE thing to say rather than an absence to explain,
  // and without it a third seat on the payroll quietly reads as a third fare the player might be
  // missing, which is the exact half of #46 he said he could not tell.
  // ⚠ RE-DRAFT `46-c (v2)`, and it is the one string on this repair he has not yet read in play.
  fareLine: 'No fare to pay: the sessions follow her as calls – at home, on the road, and through a layoff.',
}))

// --- the sparring partner (v80, wave F2) ---------------------------------------------------------
// ⭐ THE THIRD SEAT, AND THE SECOND TIME THIS CHAPTER'S OWN PROMISE HAS BEEN KEPT: one entry in
// `members`, one computed block, and nothing else on the tab moved for him. The header's paragraph
// about the psychologist predicted its own ending correctly and so did this one.
//
// Every fact is the SNAPSHOT's, the masseur's rule two blocks up: the flag, the gate, the flat weekly
// contract, the chosen rung and the stance all come off the wire, so the card cannot invent a number
// the engine did not derive and every click is a command the worker re-validates (invariant 1).
//
// ⚠ NO ROOM NOTE, which is the psychologist's own absence for a DIFFERENT reason and worth the
// sentence. His card is quiet because his effects had not shipped yet; this one is quiet because the
// seat's whole work is an ABSENCE – the rust that did not happen – and a standing line claiming it
// every week would be boasting about a counterfactual. The one week he has something to show is her
// first match back from a gap he covered, and that is a feed receipt.
const sparringHired = computed(() => game.snapshot?.sparringHired ?? false)
const sparringUnlocked = computed(() => game.snapshot?.sparringUnlocked ?? false)
const sparringSalary = computed(() => formatCents(game.snapshot?.sparringSalaryCents ?? 0))
// The roster catalogue, read here for the same reason `MASSEUR_RUNGS` and `PSYCHOLOGIST_RUNGS` are:
// it is STATIC – labels and prices keyed on nothing the world decides – so reading it on the screen
// leaks no derivation the snapshot should own. The ACTIVE rung and the headline price are both the
// snapshot's.
const SPARRING_RUNGS = ECONOMY.sparring.rungs
const sparringRung = computed(() => game.snapshot?.sparringRung ?? ECONOMY.sparring.defaultRung)
async function setSparringRungIndex(rung: number): Promise<void> {
  if (rung === sparringRung.value) return
  await game.setSparringRung(rung)
}
const sparringRungLabel = computed(() => SPARRING_RUNGS[sparringRung.value]?.label ?? '')
const sparringTravels = computed(() => game.snapshot?.sparringTravels ?? false)
async function toggleSparringTravel(): Promise<void> {
  await game.setSparringTravels(!sparringTravels.value)
}
// ⚠⚠ THE SUB-LINE SAYS WHICH SHAPE THE SWITCH BUYS AND WHICH IT DOES NOT, because round 42 #48
// MEASURED the answer and it is the opposite of the obvious one: a tournament occupies one week, so
// the weeks she is at home are where nearly all the rust is made and the stay-at-home seat already
// reaches them. A row that sold travel as the valuable half would be the screen lying about a price.
// ⚠ NO NUMBER FROM THE MEASUREMENT ON SCREEN – the 89.4% is a bench figure and would pin copy to a
// dial. The sentence says the SHAPE, which stays true when the constant moves (round 42 #46's rule).
// ⭐⭐ THE LEAD SENTENCE IS HIS, FROM THE 17.09 COPY REVIEW, and it says the same measured shape in
// the terminology sheet's own words: ON TOUR for the place, ONE ADDITIONAL FARE PER TRIP for the
// cost, and «home practice is already covered» for the half round 42 #48 measured. The booked-trips
// clause below it is untouched – it is a figure, not a claim.
const sparringTravelSub = computed(() => {
  const rule =
    'Bring the hitting partner on tour for one additional fare per trip. Home practice is already covered; this extends the arrangement to travel weeks.'
  const trips = game.snapshot?.sparringTravelTrips ?? 0
  if (trips === 0) return rule
  const t = trips === 1 ? '1 trip' : `${trips} trips`
  return `${rule} ${formatCents(game.snapshot?.sparringTravelFareCents ?? 0)} over the ${t} booked.`
})
// The one line under his name, by state – the masseur's three-state shape exactly. LOCKED prints the
// ENGINE's own refusal (SPARRING_LOCKED_DETAIL – the sentence `hireSparring` throws), the R10-16
// doctrine. HIRED and UNHIRED both say what the contract IS, because that is all that is true of him.
// ⭐⭐ BOTH LINES ARE HIS, FROM THE 17.09 COPY REVIEW. «Somebody across the net» is the image he
// singled out as used often enough that it «begins to feel generated», and it is gone from every
// surface of this seat but none: the terminology sheet's words are A REGULAR PRACTICE OPPONENT for
// what he is and MATCH-STYLE PRACTICE for what he does. The hired line says the BENEFIT in the
// sheet's own phrase – helping her keep her timing – rather than restating the mechanic.
// ⭐⭐ AND THE STAND-DOWN LINE IS THE FIRST OF THE TWO STATES HIS 17.09 REVIEW SAID WERE MISSING, in
// his own words. It existed in the engine and on no screen: the college freeze and a booked family
// week suspend the arrangement without cancelling it, so a family at a university was watching a
// salaried seat charge nothing and being told neither half. ⚠ THE FLAG IS THE ENGINE'S
// (`sparringStoodDown`), not this file's OR of two other snapshot booleans – one predicate answers
// the bill and the card, so the screen cannot claim a free week the ledger charged for.
const sparringStoodDown = computed(() => game.snapshot?.sparringStoodDown ?? false)
const sparringLine = computed(() => {
  if (!sparringUnlocked.value) return SPARRING_LOCKED_DETAIL
  if (sparringHired.value && sparringStoodDown.value) {
    return 'The hitting partner remains with the team, but is not working this week. No salary is charged.'
  }
  if (sparringHired.value) return 'Helps her keep her timing during weeks without a match.'
  return 'A regular practice opponent for weeks when she is not competing.'
})
const sparring = computed<StaffMember>(() => ({
  id: 'sparring',
  name: 'Hitting partner',
  portrait: 'sparring',
  unlocked: sparringUnlocked.value,
  hired: sparringHired.value,
  line: sparringLine.value,
  priceLabel: sparringSalary.value,
  // Both directions ask, the screen's own doctrine – see the masseur's pair above.
  // ⭐⭐ BOTH CONFIRMATIONS ARE HIS, AND THE VOICE OF A CONFIRMATION IS **COMPLETELY LITERAL** – his
  // own rule, and the reason these two read plainer than the seat's other lines: «poetic phrases
  // appearing inside confirmations and accessibility labels, where literal clarity matters». HIRE is
  // the verb («Put … on the payroll» is not one), «you can end the arrangement any week» says what
  // «Cancellable» meant, and the release names what actually stops rather than what she is left with.
  hireMessage: `Hire a hitting partner for ${sparringSalary.value} a week (${sparringRungLabel.value.toLowerCase()})? You can end the arrangement any week, like the coach.`,
  releaseMessage: 'Let the hitting partner go? The weekly salary stops, and regular match-style practice between events ends.',
  setHired: (hire: boolean) => game.hireSparring(hire),
  dial: {
    // ⭐⭐ HIS LABEL, AND IT IS THE SECOND OF THE TWO HE OFFERED, BECAUSE THE RUNGS WERE CHECKED. He
    // gave «Hitting partner level» for a game-mechanical tier and «Hitting partner – experience
    // level» for quality and experience. `ECONOMY.sparring.rungs` is the latter without ambiguity:
    // the three labels are «A college hitter», «A journeyman pro» and «A top-100 partner» – a ladder
    // of standing, priced off the $50–80k/yr band in `docs/research/team-economics-2026-09.md` §4,
    // not tier 1/2/3 of a game system. ⚠ And the old label was the last «across the net» on this tab,
    // which he ruled unsuitable for a control: a label must say what the control CHANGES.
    label: 'Hitting partner – experience level',
    active: sparringRung.value,
    rungs: SPARRING_RUNGS.map((r, i) => ({
      value: i,
      label: r.label,
      priceLabel: formatCents(r.weeklyCents),
      // ⭐⭐ 17.09 – HIS RUNG SET A, and the sentence is the CATALOGUE's rather than this file's, the
      // rule every other string on this tab already obeys: `ECONOMY.sparring.rungs` owns the cut and
      // now owns the sentence that describes it, so a re-fit moves both in one edit and the card can
      // never quote a ladder the engine stopped running.
      note: r.note,
    })),
    set: setSparringRungIndex,
  },
  travel: {
    // ⭐⭐ THE TITLE AND BOTH SCREEN-READER LABELS ARE HIS. ⚠⚠ THE LABELS ARE THE HALF THAT MATTERS
    // AND HIS RULE FOR THEM IS ABSOLUTE: «atmospheric but unsuitable as an accessibility label – a
    // screen reader should announce exactly what the control changes». So each one states the state
    // it is in and then the state pressing it produces, in the terminology sheet's words, and neither
    // carries an image. «For a court on the road» is gone: the seat buys a person, not a venue.
    title: 'Tournament travel',
    sub: sparringTravelSub.value,
    on: sparringTravels.value,
    onLabel: 'Hitting partner travel is on. Press to keep the hitting partner at the home club.',
    offLabel: 'Hitting partner travel is off. Press to bring the hitting partner on tour; each trip adds one fare.',
    toggle: toggleSparringTravel,
  },
}))

/** ⭐ THE LIST. Three entries since v80, and the hitting partner arrived exactly as the psychologist
 *  did and as this line promised twice: one entry here, one computed block above, nothing else on the
 *  tab moved. ⚠ THE MASSEUR STAYS FIRST – he is the seat the owner commissioned, paid a wave for and
 *  then could not find, and the order on this screen is the one thing this chapter exists to get
 *  right. The newest seat goes LAST, which is the order the three arrived in and the order their
 *  portraits were drawn in. */
const members = computed<StaffMember[]>(() => [masseur.value, psychologist.value, sparring.value])

// ⚠ ONE CONFIRM PER DIRECTION FOR THE WHOLE LIST, keyed on the member id rather than a boolean per
// person: two seats would otherwise mean four flags and four dialogs in the template, which is the
// per-member refactor this chapter is shaped to avoid. Null means nothing is being asked.
const hiring = ref<string | null>(null)
const releasing = ref<string | null>(null)
// ⭐⭐ 17.09 – THE THIRD ASK, keyed on the member id AND the year pressed, because unlike the two
// above this control has five answers and the question has to name the one. Null means nothing is
// being asked, exactly as the two do.
const focusing = ref<{ id: string; value: PsyFocus } | null>(null)
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
// ⚠⚠ THE PRESS ASKS, IT DOES NOT SET – 17.09, and the difference is a year of her life. The rung and
// the travel switch above commit on the press because both are reversible the very next week; this
// one closes the row until the next off-season, so it goes through the confirm the two hire
// directions already use.
function pressFocus(m: StaffMember, value: PsyFocus): void {
  if (!m.focus) return
  focusing.value = { id: m.id, value }
}
const hiringMember = computed(() => members.value.find((m) => m.id === hiring.value) ?? null)
const releasingMember = computed(() => members.value.find((m) => m.id === releasing.value) ?? null)
/** The member and the option being asked about, or null. ⚠ RESOLVED THROUGH `members` rather than
 *  captured at the press, so the question a stale ask would print cannot outlive the option it names:
 *  a seat let go with the dialog open finds no member and the card closes with it. */
const focusingOption = computed(() => {
  const asked = focusing.value
  if (!asked) return null
  const member = members.value.find((m) => m.id === asked.id)
  const option = member?.focus?.options.find((o) => o.value === asked.value)
  return member && option ? { member, option } : null
})
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
async function doSetFocus(): Promise<void> {
  const picked = focusingOption.value
  focusing.value = null
  await picked?.member.focus?.set(picked.option.value)
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
         the floor for 368x512 is in `.staff-art` below. The strip is `position: absolute`, so it is
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
        <!-- 17.09: the rung's own sentence, under the name it captions and above the price, and it
             is rendered ONLY where the catalogue supplies one - a seat whose ladder has no approved
             sentences shows no empty line where one would be. -->
        <span v-if="r.note" class="rung-note">{{ r.note }}</span>
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
    <div
      v-if="m.focus && m.hired"
      class="staff-focus"
      :class="{ 'is-nudged': m.focus.nudge }"
      role="radiogroup"
      :aria-label="m.focus.label"
    >
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
    <!-- ROUND 42 #46: what this seat's fare buys, one standing sentence at the foot of the card.
         The owner could tell what the head coach's second fare bought and not what the other two
         seats bought, and the travel switch is a real price on every event week.
         ONLY WHILE HIRED, the same predicate the dial, the year's work and the switch above all
         use: a sentence about what a fare buys is a sentence about somebody already on the payroll,
         and before the hire the card's own line is the pitch.
         LAST IN THE BLOCK for both seats that carry one, which is what makes it read as one
         question asked of the whole payroll - under the switch for the seat that has one, and at
         the foot of the card for the seat whose answer is that there is no switch to pay for.
         A seat with no sentence renders nothing at all - no empty element, no reserved line. -->
    <p v-if="m.fareLine && m.hired" class="cm-load staff-fare">{{ m.fareLine }}</p>
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
  <!-- 17.09: the year's work asks before it is set. The pick locks the row for the rest of the
       off-season, and it is taken by one press on a half-width card - so the same shell that fronts
       the two hire directions fronts this one. Cancel leaves the year exactly as it was. -->
  <ConfirmDialog
    v-if="focusingOption"
    :message="focusingOption.option.confirm"
    confirm-label="Set it"
    @confirm="doSetFocus"
    @cancel="focusing = null"
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
     layout can produce is (floor - 2 borders) x 368/512.
         (136 - 2) x 368/512 = 134 x 0.71875 = 96.31 >= 96   <- the strip, filled
     and 136 is the smallest integer that holds it: 96 x 512/368 + 2 = 135.57.
     ⚠ THE MASTER MOVED 22.09 (wave 10, his ruling - docs/decisions.md 22.09 #6; a .vue carries no
     Cyrillic, so the words live there) – the four files shipped 448x624 until then and were
     downscaled to 368x512 for -36 KiB of install; the ratio moved by half a thousandth
     (0.7179 -> 0.7188), the floor did not, and the derivation above is written against the
     SHIPPED files, which is the only pair the inequality is about.
     ⚠ THE COACH ROW'S ARITHMETIC IS THE SAME SENTENCE WITH THE OTHER MASTER – (196-2) x 162/280 =
     112.24 >= 112 – and 162/280 is 0.579 against this 0.719. A wider figure at the same height fills
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
   each master at its original 448x624 (the shipped files are the same frame downscaled to 368x512,
   and picture FRACTIONS are scale-free, so the reading carries), taking the head box as the hair's
   outline at HEAD height (the top of the hair through the chin) rather than the hair that falls onto
   the shoulders:
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
/* ⭐⭐ 17.09 – WHAT THE RUNG BUYS, in `.staff-focus-blurb`'s treatment one control down (10.5px/1.35,
   `--muted`): quiet prose under the name it captions, never competing with it and never with the
   price. The two captions on this tab are deliberately the same object, because they answer the same
   question about two different ladders.
   ⚠ IT SITS BETWEEN THE NAME AND THE PRICE AND THAT DOES NOT UNDO ROUND 43 #3. That item was about
   TYPOGRAPHY – the price had been 10px at 0.75 opacity, «smaller and fainter than the label above
   it» – and the price is still the largest, boldest text on the pill. What moved is its row, not its
   weight, and the three prices still line up across the dial because the pills stretch to one height.
   ⚠ THE SENTENCES WRAP AS PROSE inside ~101px of pill (three rungs and two 6px gaps across ~340px of
   card, less 2x4px of padding), the same bet `.staff-focus-blurb` already takes at half a phone: 55
   characters in 101px is a slightly LOOSER fit per pixel than its own 90 in ~145px, so `nowrap` would
   be the wrong rule here for the reason it is the wrong rule there. `overflow-wrap` is the guard
   against the one word that cannot break - none of set A's words is close, and the rule costs
   nothing on the day one is. */
.staff-rung .rung-note {
  font-size: 10.5px;
  font-weight: 400;
  line-height: 1.35;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.staff-travel {
  margin-top: 8px;
}
/* ROUND 42 #46 - what the seat's fare buys. `.cm-load` carries the type, exactly as `.staff-line`
   and `.staff-focus-note` do, so this rule owns nothing but the gap above it: the whole point of the
   sentence is that it reads as the same voice as the rest of the card rather than as a new panel. */
.staff-fare {
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
  /* ⭐⭐ 17.09 – HIS OWN COMPLAINT, MEASURED AND ANSWERED. His words are parked in
     `focusPaddingNote` in the script block above, for this file's standing reason: the markup and
     these styles may carry no Cyrillic, and tests/round13-nav.test.ts cuts the file at the opening
     markup tag and reads to its END. It was `6px 4px` – FOUR pixels at the sides – under a 60-90
     character sentence wrapping inside half a phone's width, which is the one place on this tab
     where prose and a narrow box meet.
     ⚠ 10px AND NOT MORE, BECAUSE THE TWO-UP WRAP IS THE CONSTRAINT AND IT IS NOT NEGOTIABLE. The
     basis is `calc(50% - 3px)` and `box-sizing: border-box` is the app's global, so the padding eats
     CONTENT width rather than widening the item: at 375px the card is ~340px, half a row is ~167px,
     and 2x10px of padding plus 2x1px of border leaves ~145px for a sentence that used to have
     ~157px. That is a wrap or two more, never a third column and never an overflow –
     tests/component/round43-staff-focus-block.test.ts holds BOTH halves at 375x667. */
  padding: 8px 10px;
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
/* ⭐⭐ 17.09 – THE WHOLE BLOCK LIGHTS WHILE THE MARKER IS UP, at his ask, and the glow is the HOUSE's
   rather than a new one: round 43 #7 built the soft-beat chip's ring out of the avatar's mood ring
   (`.soft-beat-card` in HomeScreen.vue), and this is that ring asked of a third surface.
   ⭐ THE TWO PROPERTIES THAT MAKE IT THAT RING ARE CARRIED, NOT RE-INVENTED:
     * THE BLOOM IS LISTED FIRST. There is no drop shadow on this container today, so the bloom is
       first by construction – and the rule is written down because the day one is added the bloom has
       to stay ahead of it or the light reads as a second shadow underneath instead of coming off the
       edge. A `box-shadow` list REPLACES rather than extends, so both frames must restate everything.
     * ONLY THE BLOOM MOVES. Radius and alpha breathe; nothing else in the rule changes mid-cycle, and
       the group never goes out.
   ⚠ IT PAINTS AND IT DOES NOT REFLOW. No border, no padding and no margin are touched by the state,
   so the 2x2 wrap and the pills' own boxes are byte-identical lit or unlit – a glow that moved the
   controls under the finger would be a worse answer than no glow.
   ⚠ THE CHIP'S OWN NUMBERS (6px/0.16 to 12px/2px/0.30) rather than the avatar's, because this is a
   block the width of the card and not a 40px circle - the same reason round 43 #7 gave for shrinking
   them once already. */
.staff-focus.is-nudged {
  border-radius: 10px;
  animation: staff-focus-beat 2.8s ease-in-out infinite;
}
@keyframes staff-focus-beat {
  0%,
  100% {
    box-shadow: 0 0 6px 0 rgba(var(--accent-rgb), 0.16);
  }
  50% {
    box-shadow: 0 0 12px 2px rgba(var(--accent-rgb), 0.3);
  }
}
/* ⚠ THE BREATHING STOPS AND THE LIGHT DOES NOT, which is the chip's own killswitch one screen over
   and its stated reason: motion is what the system asked to reduce, the edge light is not motion, and
   taking it away would remove the attention he asked for from exactly the player who most needs the
   block easy to find. */
@media (prefers-reduced-motion: reduce) {
  .staff-focus.is-nudged {
    animation: none;
    box-shadow: 0 0 9px 1px rgba(var(--accent-rgb), 0.22);
  }
}
/* ⭐ ROUND-28 #8's follow-up – the frame the household strip sits in at the head of this tab. It
   borrows `.budget-meter` (global) for the padding and the radius so the two tabs' strips are the
   same object, and adds only the gap to the first payroll head below it. */
.staff-budget {
  margin-bottom: 12px;
}
</style>
