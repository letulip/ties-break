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
// ⚠ AND SINCE v47 IT IS TWO TABS - `Her week` and `Coaches` (docs/specs/training-dials.md §9a), and
// SINCE 27.08 IT IS THREE: `Support staff` joined them, at the owner's ask and in his own words -
// «вынеси отдельную вкладку на уровне Her week/Coaches -> Her week/Coaches/Support Stuff». The
// masseur had been the last block of this template, below the whole roster, and he could not find
// the man he had commissioned. See SupportStaffTab.vue for what moved and why it is a LIST.
//
// Two arguments, both settled there and neither re-opened here:
//
//   * IT IS NOT `Self-coaching` / `Coaches`. `COACH_TIERS` is literally
//     ['self','budget','middle','high','elite'] and `coachFactor`, `COACH_EYE`, `COACH_ACCURACY` and
//     `physioQuality` all have a `self` row - ONE ladder, self on the bottom rung, which is the
//     owner's own «ничем не отличается, кроме того, что ничего не стоит». Two tabs on that axis would
//     assert they are different KINDS of thing and hide the one comparison this screen exists to make.
//   * IT IS A SWITCHER AND NOT AN ACCORDION. An accordion expands in place and makes the page longer,
//     which is the longread he is avoiding; the app has no accordion anywhere.
import { computed, ref, watchEffect } from 'vue'
import { useGameStore } from '../../stores/game'
import ConfirmDialog from '../ConfirmDialog.vue'
import HerWeekTab from '../HerWeekTab.vue'
import HouseholdStrip from '../HouseholdStrip.vue'
import SupportStaffTab from '../SupportStaffTab.vue'
import IconButton from '../ui/IconButton.vue'
import SegmentedRow from '../ui/SegmentedRow.vue'
import { coachPortraitUrl, preloadCoachMarketArt } from '../../art/preload'
import { COACH_TIER_LABEL, coachHoursForPlan, HIREABLE_TIERS, styleFitBetween, type StyleFit } from '../../engine/coach'
// ⭐ ROUND-23 #5 / #1 – TWO PURE LOOKUPS, in the same register as `COACH_TIER_LABEL` above and for the
// same reason: they are label tables keyed on data the row already carries, not decisions. `coachBlurb`
// maps a portrait stem to that coach's own description and `coachRoomBand` is the one splitter the engine
// wrote the room note with, read here so the split cannot drift from the join. Neither touches a world,
// draws anything, or knows what a career is - see their notes in the engine for why the blurb could not
// simply ride on `CoachMarketRow` this wave.
import { coachBlurb, coachRoomBand } from '../../engine/world/coachMarket'
// ⭐ ROUND 29 #13 – the ONE function that answers "what does a finish pay the staff", imported for the
// same reason `coachBlurb` above is: it is a pure read of `ECONOMY` with no world in it, and the
// alternative is typing two percentages into a template where nothing could ever check them against
// what `finalizeTournament` actually pays. See the note on `.cm-share-note` in the template.
import { staffResultShareBps } from '../../engine/economy'
// ⚠ `MASSEUR_LOCKED_DETAIL` AND `ECONOMY` LEFT WITH HIM (27.08). Both were imported for the masseur
// card alone and now live in SupportStaffTab.vue; this screen imports no market catalogue, which is
// the state it was in before v59.
import { WEEK_PLAN_PRESETS, type CoachMarketRow, type CoachTier, type PlayStyle } from '../../shared/protocol'
import { formatCents } from '../../shared/money'
// ⭐ ROUND 36 PHASE 6 – the budget meter's own arithmetic, now shared with the rail's dashboard card.
// See the note at its call site below for why it left this file.
import { useCoachingBudget } from '../../composables/coachingBudget'

const game = useGameStore()
const emit = defineEmits<{ back: [] }>()

/** THE HALVES OF ONE DECISION: what she does with her week, and who she does it with.
 *
 *  ⭐⭐ THE THIRD ENTRY IS THE 27.08 FIX, AND IT IS THE OWNER'S OWN LEVEL. He asked for the masseur
 *  «на уровне Her week/Coaches», and this row IS that level - so the fix is one entry here plus the
 *  component behind it, and not a sixth seat in App.vue's bottom bar. Two reasons the bar was never
 *  a candidate: Home's centring is EMERGENT from "five slots, Home third" (App.vue's TABS note, and
 *  tests/round13-nav.test.ts pins `ids[floor(len / 2)] === 'home'`), so a sixth entry moves Home off
 *  the middle and breaks his own order; and this screen is not even IN the bar - it is reached FROM
 *  somewhere, which is what `marketFrom` exists for.
 *
 *  ⚠ AND THE ROW KEEPS ITS PLATE. `appearance="chapter"` (Money, More) is a real idiom for a page's
 *  chapter picker, but the 05.08 ruling behind it named the ledger and the settings, and this row
 *  has carried the default plate since v47. Growing a control he did not ask about would be
 *  inventing a decision inside a fix that is supposed to MOVE something, so the row is untouched. */
const TABS = [
  { value: 'week', label: 'Her week' },
  { value: 'coaches', label: 'Coaches' },
  { value: 'staff', label: 'Support staff' },
] as const

/** ⭐ ROUND-18 #3 – THE SCREEN CHOOSES ITS LANDING TAB, AND A HIRED COACH LANDS ON THE COACHES
 *  (owner, 13.08: «если тренер выбран, при клике на плашку переходить в список тренеров»).
 *
 *  WHAT WAS WRONG, and it was one line: `ref<string>('week')`. Home's coach note is a DOOR – it is a
 *  `button.note-card` that navigates here – so pressing the card with his face and his words on it
 *  opened the training dials, and the man the player had just tapped was one more tap away. The
 *  screen was answering a question nobody had asked.
 *
 *  WHY IT IS NOT A CONSTANT ANY MORE, AND WHY SELF-COACHED KEEPS TODAY'S BEHAVIOUR. `Her week` is
 *  still the right landing when there is nobody to look at: the coaches list is then a shop, not a
 *  status, and the half that is free and always available is the one that should open. So the
 *  landing follows `coachId` and nothing else – the same field `.cm-row.current` is drawn from, so
 *  the tab and the highlighted row can never disagree about whether there is a coach.
 *
 *  ⚠ AND IT MUST NOT FIGHT THE PLAYER, which is why this is a null-able CHOICE plus a fallback and
 *  not a `watch` writing into a plain ref. A watcher on the snapshot would re-land the screen every
 *  time the worker pushed a new one – tick the week, or hire somebody, and the tab the player is
 *  reading jumps out from under them. Here the fallback applies only while the player has chosen
 *  nothing; the first press of either pill pins `chosen` and the screen never second-guesses it
 *  again. The reset is the unmount: App.vue draws this screen with `v-else-if`, so leaving and
 *  re-entering is a fresh instance, and re-entering is exactly when the landing should be re-decided.
 *
 *  It also survives a snapshot that arrives late (`landing` is a computed, not a value read once at
 *  setup) – the screen renders nothing until `game.snapshot` exists, but the ordering is not this
 *  rule's to depend on. */
const chosen = ref<string | null>(null)
const landing = computed<string>(() => (game.snapshot?.coachId ? 'coaches' : 'week'))
const tab = computed<string>({
  get: () => chosen.value ?? landing.value,
  set: (value) => {
    chosen.value = value
  },
})

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

/** WHAT THE PRICE BRACKET BUYS PER MATCH (docs/specs/coach-match-edge.md §4), in the owner's own
 *  shape: «может по-проще "+0.3-0.6% per match" или вроде того, чтобы не менять ничего особо на
 *  карточке, можно даже добавить к текущему рядом подписать возле сезона».
 *
 *  ⚠ IT IS THE RUNG'S CORRIDOR AND NEVER ONE MAN'S NUMBER, which is the whole of §4: a number on an
 *  unhired card turns the market into a shop window with the prices written on the back - hire,
 *  read, fire, repeat until the 0.7 budget coach turns up - and since the value is a property of the
 *  PERSON that search would always succeed. `edgePct` arrives from the engine already cut to the
 *  tier (`COACH_EDGE_CORRIDOR_PP`), so this screen cannot leak an individual value even by mistake.
 *
 *  ONE DECIMAL, because the corridors are stated in tenths and a second digit here would imply the
 *  bracket is measured to a precision it does not have. The realised value below quotes two - it IS
 *  a measurement of one person, and that is exactly the difference the two formats carry. */
function formatEdge([lo, hi]: [number, number]): string {
  return `+${lo.toFixed(1)}-${hi.toFixed(1)}% per match`
}

/** ⭐⭐ ROUND-21 #2, THE LAST OPEN ITEM – WHAT THE RUNG IS WORTH WITH THE COACH ON THE TRIP.
 *
 *  The travel helping shipped in the engine, was measured at 500 paired careers and said NOTHING on
 *  the screen that sells the decision: a family paying a second fare to every W event read exactly the
 *  figure a family that leaves the coach at home reads. This is that figure, doubled - and it is on
 *  the card only when the stance would actually send him, which is the engine's call
 *  (`edgeTravelPct` is null otherwise) and never this screen's.
 *
 *  ⚠ THE COMPONENT DOES NO ARITHMETIC. The doubling is `coachEdgeCorridorPp`, one function beside the
 *  draw it has to stay in step with; this formats a pair the engine already cut. A `* 2` in a template
 *  is how a screen comes to quote a dose the engine has moved on from.
 *
 *  ⚠ IT NAMES THE CONDITION AND NEVER CLAIMS A FLAT DOUBLING. The helping follows the FARE
 *  (`coachTravelFareFor`), which sends him only to rungs that pay prize money unless the junior stance
 *  is open too - so a J-series week doubles nothing even for a family that always sends him.
 *  "travelling with her" is exactly the weeks it applies to, and «doubled» would not be.
 *
 *  ⚠ AND NO PRONOUN NAMES THE COACH (R15-7, owner 09.08): a woman sits on every roster by
 *  construction, so "travelling with him" is not available and "with her" is the daughter, who is the
 *  app's one fixed "she". Same one decimal as the corridor beside it, for the same reason - these are
 *  brackets, and a second digit would imply a precision a bracket does not have. */
function formatEdgeTravel([lo, hi]: [number, number]): string {
  return `+${lo.toFixed(1)}-${hi.toFixed(1)}% travelling with her`
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

// ⭐⭐ ROUND-21 #2 – THE SWITCH IS LIVE. Owner, 14.08, THIRD ask (his words verbatim in
// tests/component/round21-coach-travel.test.ts; the app bans Cyrillic in a template, comments
// included, and this is the script side of the same file so the rule is kept here too by habit).
//
// It was locked on 30.07 after three STAT versions of coach travel were measured and all three
// failed, and round-20 #1 answered the SECOND ask by rewriting the sub-line instead of building
// anything. Asking a third time overrules the cancellation. What he asked for is PRESENCE - he
// goes, and it is visible - and that is exactly what flipping this now buys: a second fare per trip
// (`coachTravelFareFor`), a line in the tournament flow, a beat in the running commentary, and a
// line in the week's story. NO STAT MOVES on this branch.
//
// ⚠ SELF-COACHED IS THE ONE REFUSAL LEFT, and it is a fact rather than a gate: there is nobody to
// send, the engine charges nothing and shows nothing (`coachTravelsWithHer`), so the control says so
// rather than pretending the stance means something. The switch still WORKS in that state - the
// stance persists and takes effect the moment she hires somebody - which is what keeps this off the
// app's standing rule against a dead control nobody can explain.
const hasCoach = computed(() => (game.snapshot?.coachId ?? null) !== null)
const travelsOnEventWeeks = computed(() => billing.value?.onEventWeeks ?? false)

/** WHAT SENDING HIM COSTS, in the engine's own words - `travelFareCents` is `coachTravelFareFor`
 *  summed over the trips he would be ON this season, which is the one fare definition in the game.
 *  The rule is always said; the money is said only when there are trips to price it over, because a
 *  $0.00 season total with nothing behind it is worse than no figure at all.
 *
 *  ⭐⭐ 15.08 – AND FOR A FAMILY WITH A SCHOLARSHIP THE RULE IS NO LONGER "TWICE THE FARE" (owner, on
 *  the principle behind it: «очень согласен»). The support pays for HER seat and never for his, so a
 *  covered trip is her discounted seat plus his whole one - the better the scholarship, the LARGER
 *  the share of the trip he is. Quoting a bare multiple to those families would be wrong for exactly
 *  the people who most need to understand the number, so the line says his seat is not covered and
 *  prints BOTH figures. `travelCovered` is the engine's answer to "is anything reducing her travel",
 *  asked of the one fare definition rather than of a list of covers, so this branch cannot go stale
 *  when a third support stream ships.
 *
 *  ⚠⚠ 17.08 – AND THE THIRD SENTENCE IS THE ONE THAT REDUCES **HIS** SEAT, which nothing did until
 *  round-21 #2's last item. A sponsor's travel share now comes off the coach's fare too at the events
 *  that pay prize money, so both sentences above became untrue for those families - one promised
 *  twice the fare and the other promised he travels at the full price. `coachFareCoverPct` is the
 *  engine's own term, printed rather than derived from the totals, and it is checked first because it
 *  is the stronger fact about the money.
 *
 *  ⚠ THE THREE BRANCHES ARE NOT THREE RULES. There is ONE sponsor share and it covers both seats; the
 *  scholarship covers hers alone. The branches exist because those two facts make three different
 *  sentences true for three different families, and a family reading this needs the one that is true
 *  for it - not the union.
 *
 *  ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08) - `buildCoachRoster` puts a woman on every
 *  roster by construction, so "his seat" would print under Sabine Kobayashi. The first draft of this
 *  line said "a trip HE comes on ... HIS seat", and `round15-surfaces.test.ts` caught it MOUNTED on
 *  this exact screen, which is the guard doing precisely its job. "The coach's seat" is the phrase
 *  that survives it, and the daughter is the app's one fixed "she". */
const travelSubLine = computed(() => {
  if (!hasCoach.value) return 'You are coaching her yourself – there is nobody to send. Turn it on and it takes effect when you hire somebody.'
  const b = billing.value
  const covered = b?.travelCovered ?? false
  // ROUND-21 #2, 17.08: a sponsor's travel share now comes off the SECOND seat too at the events that
  // pay prize money, so the two sentences below were both promising something untrue to the families
  // that hold such a deal. This branch is checked FIRST because it is the stronger fact: a family
  // whose contract is paying for the coach needs to be told that before it is told what a scholarship
  // does not do. The percentage is the engine's own term and is never derived from the totals.
  const byBrand = b?.coachFareCoverPct ?? 0
  const rule = byBrand > 0
    ? `Your sponsor pays ${byBrand}% of the second seat at the events that pay prize money – the rest is yours.`
    : covered
      ? 'The support does not pay for the second seat – hers is discounted, the coach travels at the full fare.'
      : 'Twice the fare on every trip – a second seat beside hers.'
  if (!b || b.travelTrips === 0) return rule
  const trips = b.travelTrips === 1 ? '1 trip' : `${b.travelTrips} trips`
  return covered || byBrand > 0
    ? `${rule} Her seats cost ${formatCents(b.travelHerFareCents)} over the ${trips} ahead; the second seat adds ${formatCents(b.travelFareCents)}.`
    : `${rule} ${formatCents(b.travelFareCents)} over the ${trips} she has booked this season.`
})

async function toggleTravel() {
  if (game.busy) return
  await game.setCoachOnEventWeeks(!travelsOnEventWeeks.value)
}

// ⭐⭐ v49 – AND THE SECOND, MORE EXPENSIVE DECISION: THE TRIPS THAT PAY HER NOTHING.
// Owner, 15.08: «делаем тогда», with his own model of whose decision it is (his words verbatim are
// in tests/component/round21-coach-travel.test.ts - THIS IS THE SCRIPT SIDE OF A FILE WHOSE TEMPLATE
// may carry no Cyrillic, comments included, and the rule is kept here by habit).
//
// ⚠ IT IS NESTED AND NOT A SIBLING, because it is meaningless on its own: the fare reads both
// stances, so this alone sends nobody anywhere. Shown only while the first switch is on, which is
// also the honest shape of the decision - a second choice on top of a choice.
//
// ⚠ AND IT WARNS BEFORE THE FIRST FARE, WITHOUT REFUSING ANYTHING. The bench measured what an
// ungated junior fare does (8/30 wealthy·elite and 15/30 middle·middle careers bankrupt, every one in
// the junior years - docs/specs/coach-travel-2026-08.md), and the owner has ruled that outcome is the
// player's own. So the confirm is an INFORMED CHOICE and not a gate: it names the risk in the
// player's own money terms, and then does exactly what it is told. Turning it OFF asks nothing -
// stopping a bill needs no ceremony.
const travelsToJuniors = computed(() => billing.value?.onJuniorEvents ?? false)

const juniorSubLine = computed(() => {
  const b = billing.value
  const rule = 'Junior and domestic events pay no prize money – the fare buys presence, and nothing comes back.'
  if (!b || b.travelJuniorTrips === 0) return rule
  const trips = b.travelJuniorTrips === 1 ? '1 more trip' : `${b.travelJuniorTrips} more trips`
  return `${rule} ${formatCents(b.travelJuniorCents)} over the ${trips} on her card this season.`
})

const askingJuniors = ref(false)
/** The warning, in the two facts a parent can act on: what the bill is FOR, and what it did to the
 *  careers that ran it. Measured over 30 seeds a cell, both cells named, and the ages named too –
 *  every one of those bankruptcies happened before she turned twenty. It ends by handing the
 *  decision back, because it IS his: «есть деньги - едет тренер, нет - не едет, или едет, но быстрее
 *  банкротится». */
const juniorConfirmMessage =
  'Send the coach to junior and domestic tournaments too? Those rungs pay no prize money, so the ' +
  'second fare is a bill against an income she does not have yet. Measured over 30 careers a cell, ' +
  'an unlimited junior fare bankrupted 8 of 30 wealthy families and 15 of 30 middle ones – every one ' +
  'of them before she turned twenty. Your money, your call.'

async function toggleJuniors() {
  if (game.busy) return
  if (travelsToJuniors.value) {
    await game.setCoachOnJuniorEvents(false)
    return
  }
  askingJuniors.value = true
}
async function doSendToJuniors() {
  askingJuniors.value = false
  await game.setCoachOnJuniorEvents(true)
}

// ⚠ THE CONTEXT THE UPLIFT NUMBERS ARE RELATIVE TO. The owner watched his coach's number fall from
// 0.5-1.0 to 0.4-0.9 to 0.3-0.7 and asked what it was tied to (his words verbatim are in
// tests/coachTiers.test.ts). The answer is that a rung's worth is a share of her REMAINING headroom,
// so it falls as she fills her ceiling and as the age curve eases - honestly, and until now
// silently. Engine-computed (`coachRoomNote`); this screen only prints it.
//
// ⭐ ROUND-23 #1 – AND THE BAND IS NOW THE FIRST THING ON THE LINE. The owner asked for the reading to
// be said «более явно» and handed three examples of what he meant, every one of them a band in plain
// words rather than a figure. The engine still decides which band she is in and still refuses to quote
// the ceiling (`KidScreen`'s fog of war); what this pair does is SPLIT the label off the argument so
// the label can be set in bold and read at a glance.
//
// ⚠ THE SPLIT IS PRESENTATION AND NOTHING ELSE. It is on `ROOM_NOTE_SEP` - the engine's own separator,
// imported rather than retyped - and it takes the FIRST occurrence only, so a sentence that happens to
// contain another dash keeps the rest of itself. A note with no separator at all (or an empty one)
// falls through to `band = ''` and the whole string as the body, which is the shipped rendering before
// this change: the split can shorten the line's emphasis, never its content.
const roomNote = computed(() => game.snapshot?.coachRoomNote ?? '')
// ⚠ THE SPLIT MOVED TO THE ENGINE (`coachRoomBand`, 20.08) because Home's coach card needs the same
// clause, and two screens each running their own `indexOf` on one string is how the two drift apart.
//
// ⚠⚠ AND ROUND 24 DELIBERATELY DID **NOT** ADD IT TO THE HIRED COACH'S CARD. It was built there for
// an hour and taken out again on his ruling: «Добавлять на карточку новую информацию не вижу смысла,
// там и так уже много букв.» What he wanted was the PLAQUE'S OWN SENTENCE made readable - he had
// misread "that band" himself - so `PLACEMENT_PHRASE` and both null arms were rewritten in
// `world/coachMarket.ts` instead, and this card gained no new line at all.
const roomBand = computed(() => coachRoomBand(roomNote.value))
// ⚠ THE TAIL IS THE REST OF THE ENGINE'S OWN STRING, separator and all, rather than a body re-joined
// to a separator this file also knows. `band + tail === note` for every possible note, so the line on
// screen is the sentence the engine wrote to the character and a test can assert exactly that - which
// is the check that would catch a screen quietly editing copy it does not own.
const roomTail = computed(() => roomNote.value.slice(roomBand.value.length))

// --- THE PLAQUE: WHAT THE COACH SHE ACTUALLY HAS TURNED OUT TO BE WORTH ------------------------
//
// ⚠ IT GOES ON HIS OWN CARD IN THIS LIST, not on Home's coach note, and the choice is between two
// real candidates. Home's note is a QUOTE - a portrait, a line of his read on her, a handwritten
// sign-off - and it is 166px wide at 375px; it is also the surface that has already been fought over
// twice for text sitting on the portrait (round-17 #14, round-18 #1), so it is the one place on the
// app with no room to spend. The market row, by contrast, is where the corridor is being read: the
// rung's band and the realised number land two lines apart on the same card, which is the entire
// payoff of the budget lottery («есть тихие никому не известные гении?»). A number that appeared
// somewhere else would be a fact with nothing to compare it against.
//
// ⚠ THE ENGINE OWNS THE REVEAL. `coachEdgeView` decides `revealed` from `coachSinceWeek`, which is
// the SAME "weeks together" the radar's fog reads - so a coach cannot be new to his plaque and old
// to her confidence on the same Tuesday. This screen never asks "has it been a season", and since
// §7 it does not ask whether there is anything to show either: it prints the one sentence the engine
// hands it, in both states.
//
// ⚠ AND NEITHER SENTENCE JUDGES THE MAN. A coach who came out in the lower third of his rung is a
// fact reported plainly and one in the upper third is not a fanfare - «мы ни за что не наказываем»
// read as a rule about copy, and the same standing ruling `offers.ts` states for this family: a
// surface explains a price and never leans on the player. Both states are drawn in the same colour
// for exactly that reason - painting the revealed line in the accent would make a low draw read as
// bad news.
//
// ⚠ NOR MAY IT PROMISE THE RADAR. The whole corridor is under half a skill point and the radar's
// visibility floor is 3 (spec §3, TRAINING_FOG_FLOOR), so "you will see it in her game" is a lie the
// screen could not back. The copy stays where the mechanic is: per MATCH.
//
// ⚠ AND THE SENTENCE ITSELF IS THE ENGINE'S (spec §7/§8a). This screen used to compose it, back when
// the reveal was a number: `A season together – the number is +0.74% per match`. The owner threw the
// number out - «как это вообще измеримо, если абстрагироваться от нашей механики?» - and what
// replaced it has two halves that answer to DIFFERENT clocks: the PLACE follows the man (a draw off
// his id that fire-and-rehire cannot move), the CONFIDENCE follows the tenure (which fire-and-rehire
// restarts). Holding both here would be a second copy of that rule, and its failure mode is silent -
// a re-hired coach reading as a different person. So `coachPlaqueLine` composes it beside the reveal
// gate, and this file prints one string and formats nothing. The snapshot no longer carries his
// number at all, which is what makes "no figure for him on any screen" structural rather than a
// habit.
const edge = computed(() => game.snapshot?.coachEdge ?? null)
const plaqueLine = computed<string>(() => edge.value?.plaqueLine ?? '')

// ⭐⭐ ROUND-21 #2, THE LAST OPEN ITEM – AND ONE SENTENCE THAT KEEPS THE SECOND FIGURE HONEST.
//
// The chip on every card says what the rung is worth with the coach on the trip; this says WHEN,
// once, on the card of the coach she actually has. It is the engine's string (`travelLine`, '' when
// this family is not sending him) for the same reason the plaque is: what the doubling is gated on is
// `coachTravelFareFor`, and a screen that phrased the condition itself would be a second copy of a
// rule that lives in the till.
//
// ⚠ IT DOES NOT QUALIFY THE PLAQUE, and it must not be read as doing so. The helping SCALES the
// corridor rather than shifting it, so the upper third of 0.5-0.9 is the upper third of 1.0-1.8 and
// "the upper end of that band" is true of both bands at once. The placement stays a fact about the
// man, which is what §7 protects; this is a fact about the trip.
const travelLine = computed<string>(() => edge.value?.travelLine ?? '')

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

/** WHAT A ROW IS, SAID ONCE (a11y, filed by the e2e sweep 09.08: the coach rows are unlabelled).
 *
 *  ⚠ THE ROW IS A BUTTON WITH SEVEN CHILDREN, which is exactly the problem. Its accessible name was
 *  whatever the name, the pill, the style tag, the uplift range, the load note, the price and the
 *  action word concatenated to - so the one thing a listener needed first (who, and how much) sat
 *  behind two sentences of prose, and the row read as an unpunctuated paragraph. The card is a
 *  DECISION, so its label is the decision: who, which rung, whether the coach suits her, what the
 *  week costs, and what pressing it would do. (No pronoun here either - R15-7 is a rule about this
 *  screen's copy and there is no reason for a new comment to break it.)
 *
 *  It reads the same four facts the card prints, in the card's own words (`FIT_LABEL`,
 *  `COACH_TIER_LABEL`, `formatCents`) rather than a second vocabulary - a label that drifts from the
 *  row it labels is worse than none. The uplift and the load note are deliberately NOT in it: they
 *  are the card's argument, not its identity, and a name a listener has to sit through is the defect
 *  wearing a different hat. */
function rowLabel(r: Row): string {
  const state =
    r.current
      ? 'her coach now'
      : r.lockedPoints !== null
        ? `locked, ${r.lockedPoints} ranking points short`
        : r.overBudgetCents > 0
          ? `over budget by ${formatCents(r.overBudgetCents)}`
          : 'hire'
  return `${r.name}, ${COACH_TIER_LABEL[r.tier]} tier, ${FIT_LABEL[r.fitNow]}, ${formatCents(r.weeklyCents)} a week – ${state}`
}

// --- the budget meter ---------------------------------------------------------------------------
// The design's three numbers, all real: what she pays now, what a week brings in, and the gap. The
// cap is the week's INCOME because that is the money the decision is actually made against - a
// reserve pays for one week of anything, a weekly bill has to fit the week.
//
// ⭐ ROUND-21 #12 – THE CAP COMES OFF THE SNAPSHOT NOW, and it had to. It used to be RECOVERED from
// whichever row happened to be over budget (`weeklyCents - overBudgetCents === the cap`), which is
// exact while some row is over and returns 0 when none is. The owner's own case - «на счету 1млн» -
// is precisely the case where, once the income is read in full, NOTHING is over budget any more:
// the meter would have gone from a wrong number to "$0.00 /week free, $0.00 weekly cap" with a full
// bar beside it. `coachBilling.weeklyIncomeCents` is the same figure the engine cuts every
// `overBudgetCents` from, so the meter and the rows cannot disagree.
const current = computed<Row | null>(() => rows.value.find((r) => r.current) ?? null)
// ⭐⭐ ROUND 36 PHASE 6 – THE METER'S THREE FIGURES MOVED INTO `composables/coachingBudget.ts`, and
// nothing about them changed: the same three lines, the same fields, the same comments, carried
// verbatim. They moved because the owner's rail dashboard now prints `freeCents` under the words
// «Coaching budget» on every page («карточки сквозные, одинаковые, как мини-дашборд живут всегда в
// вертикальной полоске»), and a rail that re-derived this arithmetic would be the SECOND copy of it.
// This screen has already shipped that exact defect once – the note at `HouseholdStrip` below spells
// it out – so the shortcut and the meter read one computed or they can disagree on screen, side by
// side, on a desktop.
const { committedCents, capCents, freeCents, meterPct } = useCoachingBudget()

/** ⭐ ROUND 29 #13 – WHAT A FINISH PAYS HIM, as a percentage, straight off the engine's own rule.
 *
 *  THE OWNER, 28.08, and the second half of his sentence is the design: «А мы что-то перечисляем
 *  тренеру за финал каких-то турниров в итоге? Мне кажется эта информация стоит того, чтобы добавить
 *  её на странице тренеров где-то, думать, что она общая для всех, так что можно где-то в одном месте
 *  написать наверное.»
 *
 *  `finishIdx` is `finalizeTournament`'s own index (0 = champion, 1 = finalist) and these are the
 *  only two the rule pays at all, so the pair below IS the rule rather than a description of it.
 *  Basis points to percent is a display conversion and nothing more - the logic stays in bps, which
 *  is where the engine keeps it. Not computed off a snapshot because it depends on no career: it is
 *  the same sentence for a self-coached family shopping and for one that hired last winter. */
const titleSharePct = staffResultShareBps('coach', 0) / 100
const finalSharePct = staffResultShareBps('coach', 1) / 100

// --- and the household beneath it (round-28 #8) ---------------------------------------------------
// The owner, 28.08, on this exact block: the aggregate figure should be shown with the masseur in it
// (and the psychologist when there is one), and it should stretch to the shop, which has both
// yielding instruments and depreciating ones. His own week at 675 is the case: coaching, facility,
// stringing, physio - and $525.00 of masseur that this block did not know existed.
//
// ⚠ IT IS A SECOND QUESTION, NOT A REPLACEMENT FOR THE FIRST. The meter above answers "can this
// family afford THIS COACH", which is what the screen is for and is round-21 #12's own claim; this
// answers "what does the household take in and pay out in a week". Two figures because they are two
// questions - overwriting the meter with the household total would have silently deleted a shipped
// answer to a different one.
//
// ⚠⚠ AND THE FIGURES ARE NO LONGER READ IN THIS FILE AT ALL. His follow-up - «а мы можем эту шкалу
// на вкладке массажиста тоже показывать?» - put the same strip on the Support staff tab, so the
// whole block moved into `HouseholdStrip.vue`, which reads `coachBilling.household` itself and takes
// no props. That is the anti-drift design and it is not decoration: two tabs quoting one figure from
// two computations is the same defect class this strip was written to fix (the meter above once read
// the current ROSTER ROW's price, and told a self-coached family it committed $0.00 a week).
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
/** ⚠ LETTING HIM GO IS A DECISION AND IT NOW ASKS (owner, 12.08, on the self-coaching route out:
 *  «мы можем в любой момент отказаться от тренера»). It always could - the route is not new and is
 *  not being narrowed. What was missing is that it was the only irreversible-feeling money decision
 *  on this screen with no confirm at all: HIRING opens a dialog naming the new weekly bill, and
 *  RELEASING fired `hireCoach(null)` on the first tap and told the player afterwards, in the feed.
 *  A screen that asks before it starts paying somebody and not before it stops is not neutral about
 *  the two directions.
 *
 *  WHAT THE SENTENCE MAY CLAIM, and it is deliberately only what is certain. `hireCoach(null)` does
 *  three things: it clears `coachId`, it clears `physioActive`, and it writes an `info` row whose
 *  own words are "the weekly bill is court time only" - so the bill clause is the ENGINE's sentence
 *  rather than a second telling of it. And the read goes with the coach: `COACH_EYE` / `COACH_ACCURACY`
 *  drop to their `self` row and `coachSinceWeek` restarts, which is the thing the coach ladder is
 *  actually selling (training-dials.md §7). It does NOT promise he can be re-hired - `coachById`
 *  rebuilds the roster from the seed and HER AGE, so who is on it next season is not this dialog's
 *  to guarantee. */
const releasing = ref(false)
const releaseMessage = computed(() => {
  const name = rows.value.find((r) => r.current)?.name ?? 'your coach'
  // ⚠ NO PRONOUN FOR THE COACH. The roster is mixed and carries no gender - a first draft read "his
  // read of her goes with him" and the screen showed it under Sabine Kobayashi. "She" is safe
  // because "she" is always the daughter, which is this whole app's one fixed referent.
  return (
    `Let ${name} go? She is self-coached from this week: the weekly bill becomes court time only, ` +
    `and the trained eye you were paying for goes too.`
  )
})
async function doRelease(): Promise<void> {
  releasing.value = false
  await game.hireCoach(null)
}

// --- the masseur -------------------------------------------------------------------------------
// ⚠ HE MOVED, WHOLE, TO `SupportStaffTab.vue` ON 27.08 – card, dial, travel switch, both confirms
// and the locked state, with his behaviour untouched. He was on THIS screen because he is the same
// decision family as the coach (people the family pays weekly for her game), and that argument still
// holds: the tab he moved to is a chapter of this screen, not a new destination. What was wrong was
// the ORDER – he was the last block of a 1223-line template, below the whole roster, and the owner
// could not find the man he had commissioned.

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

    <SegmentedRow
      v-model="tab"
      class="cm-tabs"
      :options="TABS"
      group-label="What this screen is about"
    />

    <!-- ⭐ ROUND-18 #4 – THE SELF-COACHING TICK IS A SECOND DOOR ONTO THIS SCREEN'S OWN DECISIONS,
         and neither of its two directions is a new one. TICKING it with a coach hired is letting him
         go, so it opens the confirm that already asks that below (`releaseMessage`) rather than a
         second dialog with a second copy of the price. UNTICKING it cannot hire anybody - a coach is
         a person and the tick names none - so it moves the player to the list where the choosing
         happens. Both handlers are one line here BECAUSE the decisions were already here. -->
    <HerWeekTab v-if="tab === 'week'" @release="releasing = true" @coaches="tab = 'coaches'" />

    <!-- ⭐⭐ THE 27.08 FIX. The masseur used to be the LAST thing in the block below, under the whole
         roster; he is a chapter of his own now, and the psychologist is one entry in its list. -->
    <SupportStaffTab v-else-if="tab === 'staff'" />

    <template v-else>
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

      <!-- ⭐⭐ ROUND-28 #8 – AND THE WHOLE HOUSEHOLD UNDER IT. The meter above is the coaching
           decision; this is the week the family actually has, with the support staff and the shelf
           in it. ⚠ IT IS A COMPONENT AND NOT MARKUP, since his follow-up put the same strip on the
           Support staff tab: one file reads `coachBilling.household`, both tabs mount it, and there
           is no second copy to drift. See HouseholdStrip.vue. -->
      <HouseholdStrip />
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
    <!-- R15-7: no pronoun names a coach on this screen. The roster puts women on every list by
         construction (COACH_FIRST_F), and "More of him costs more" was the copy guessing - on the
         one screen where the player is looking at their faces. The owner's own fix: drop it and join
         the two halves with a dash. -->
    <p class="hint cm-plan-note">
      Every price below is {{ sessionsNow }} sessions a week – more sessions, more money.
    </p>

    <!-- ⭐⭐ ROUND-21 #2 – THE TOURNAMENT-TRAVEL TOGGLE IS LIVE, ON HIS THIRD ASK.
         The owner, 14.08: he reported for the THIRD time that the coach still does not go to
         tournaments. His words in full, and the whole history of the two refusals before this one,
         are in tests/component/round21-coach-travel.test.ts - THIS IS A TEMPLATE, and the app's own
         rule (pinned in tests/round13-nav.test.ts) is that no Cyrillic appears inside one, comments
         included. The same guard caught the 30.07 draft of this very block.

         WHAT CHANGED, AND WHAT DID NOT. The mechanic was cancelled on 30.07 because three versions
         of a coach-travel STAT were built and measured and all three failed (the boolean: +$21k for
         +0.6 skill; a fatigue discount: 2 condition points of ~36; a match-strength edge that made
         elite results WORSE). None of that is reversed here, and no stat is added: what this switch
         buys is PRESENCE, which is what he asked for when asked what to build - he goes, it costs a
         second fare, and the tournament flow, the running commentary and the week's story all say
         so. Re-measuring the three stat arms on the rebuilt bench is a separate arm of this wave.

         ⚠ AND THE ROW NO LONGER REFUSES ANYBODY. It is a `:disabled` binding on nothing at all now -
         the control is live at every age, on every rung, and self-coached families get an honest
         sentence about having nobody to send rather than a dead switch. That is the same standing
         rule the locked version was written to satisfy, finally satisfied by the switch working.
         `tests/component/round21-coach-travel.test.ts` mounts real careers and holds it to that. -->
    <!-- ⚠ HISTORY OF THE LOCKED VERSION, KEPT BECAUSE IT IS WHY THIS TOOK THREE ASKS. The owner
         cancelled the mechanic behind it on 30.07
         after two measurement passes failed to make it worth a fare: nobody travels on the junior tour, the
         coach is a flat weekly cost that produces skill, and the decision belongs to the professional years.
         His words verbatim are in tests/coach-market.test.ts - THIS IS A TEMPLATE, and the app's own rule
         (pinned in tests/round13-nav.test.ts) is that no Cyrillic appears inside one, comments included. I
         put the quote here first and that guard caught it, which is the guard working.

         WHY IT IS DISABLED AND NOT DELETED. Junior tennis has no prize money, so a family cannot decide to
         spend on a coach's fare against what a week might pay back - there is nothing coming back.
         Deleting the control would lose the place it belongs; the row keeps the seat and names the reason,
         which is the honest answer to "why can't I press this".
         The engine field stays exactly as it shipped - no schema change, no behaviour change, and every
         existing save keeps whatever it had.

         ⚠⚠ ROUND-20 #1 – THIS SUB-LINE USED TO SAY "It arrives with the professional years", AND THAT
         WAS THE DEFECT. The owner reported it dead on a professional career on 13.08 (his words are in
         tests/component/coach-travel-row.test.ts - THIS IS A TEMPLATE, and no Cyrillic may appear inside
         one, comments included; tests/round13-nav.test.ts caught the first draft of this note doing it).
         He is deep into one and it was still dead - so the question is whether the PRECONDITION was
         wrong or the SENTENCE was.
         It is the sentence, and the answer is not a near miss: THERE IS NO PRECONDITION ANYWHERE. The
         `disabled` below is a literal, not a binding; there is no handler, no computed, no age gate, and
         nothing in src/ calls `game.setCoachOnEventWeeks` - the command exists through the whole stack
         (store -> protocol -> worker -> engine) with no caller. No week, no age and no ranking can turn
         this on, because the mechanic behind it was cancelled and never replaced.
         docs/decisions.md (08.08) had already written down what that means and nobody acted on it:
         "travel never becomes possible (the row is hardcoded `disabled` and the mechanic is cancelled),
         so a notice saying it is now available would be false. Needs the unlock ruled on first."
         So the row may not promise an arrival. It states the two reasons instead - the junior one, which
         is why it is off now, and the professional one, which is why it is still off later: all three
         versions of the mechanic were built and measured on 30.07 and all three failed (the boolean,
         +$21k for +0.6 skill; a fatigue discount, 2 condition points of ~36; a match-strength edge that
         came out NEGATIVE on rank). Turning it on is a ruling to be taken, not a birthday to wait for.
         `tests/component/coach-travel-row.test.ts` mounts a professional career and holds the row to it. -->
    <section v-if="billing" class="cm-travel">
      <div class="cm-travel-text">
        <p class="cm-travel-title">Coach travels to tournaments</p>
        <p class="cm-travel-sub">{{ travelSubLine }}</p>
      </div>
      <button
        class="cm-switch"
        role="switch"
        :aria-checked="travelsOnEventWeeks ? 'true' : 'false'"
        :disabled="game.busy"
        :aria-label="
          travelsOnEventWeeks
            ? 'Coach travels to tournaments with her – on. Press to send the coach home for competition weeks.'
            : 'Coach travels to tournaments with her – off. Press to buy the second fare on every trip.'
        "
        @click="toggleTravel"
      >
        <span class="cm-switch-knob"></span>
      </button>
    </section>

    <!-- ⭐⭐ v49 – THE NESTED OPTION: THE TRIPS THAT PAY HER NOTHING.
         The owner ruled on 15.08 that this is the player's decision and not the engine's, and that
         the outcome of it is his own too (his words are in the .ts comments and in
         tests/component/round21-coach-travel.test.ts - no Cyrillic may appear in a template, comments
         included, tests/round13-nav.test.ts).

         ⚠ IT APPEARS ONLY WHILE THE FIRST SWITCH IS ON, and that is not decoration: the fare reads
         BOTH stances, so with the first one off this option sends nobody anywhere and a row that
         looked live would be the control lying about itself - the exact defect round-20 #1 was.

         ⚠ AND THE PRESS OPENS A WARNING, NOT A GATE. What a player who ticks this is choosing was
         measured (docs/specs/coach-travel-2026-08.md): an unlimited junior fare bankrupted 8 of 30
         wealthy families and 15 of 30 middle ones, every one of them in the junior years. The dialog
         says so plainly before the first fare is charged and then does as it is told. -->
    <section v-if="billing && travelsOnEventWeeks" class="cm-travel cm-travel-nested">
      <div class="cm-travel-text">
        <p class="cm-travel-title">...and to junior events too</p>
        <p class="cm-travel-sub">{{ juniorSubLine }}</p>
      </div>
      <button
        class="cm-switch"
        role="switch"
        :aria-checked="travelsToJuniors ? 'true' : 'false'"
        :disabled="game.busy"
        :aria-label="
          travelsToJuniors
            ? 'Coach travels to junior and domestic tournaments – on. Press to stop paying the second fare on the trips that pay no prize money.'
            : 'Coach travels to junior and domestic tournaments – off. Press to buy the second fare on those trips too.'
        "
        @click="toggleJuniors"
      >
        <span class="cm-switch-knob"></span>
      </button>
    </section>
    <ConfirmDialog
      v-if="askingJuniors"
      :message="juniorConfirmMessage"
      confirm-label="Send the coach"
      cancel-label="Not yet"
      @cancel="askingJuniors = false"
      @confirm="doSendToJuniors"
    />
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

    <!-- ⭐⭐ ROUND 29 #13 – THE OTHER HALF OF WHAT A COACH COSTS, AND IT IS SAID EXACTLY ONCE.
         The owner asked for the share to be written down on the coaches page, and said himself that
         it is common to every coach so one place would do. His words are verbatim in
         tests/component/round29-coach-share.test.ts and beside `titleSharePct` in the script above -
         THIS IS A TEMPLATE, and no Cyrillic may appear inside one, comments included
         (tests/round13-nav.test.ts is the guard, and it caught the first draft of this very block).

         ⚠ HIS OWN INSTRUCTION IS THE PLACEMENT. The share is a UNIVERSAL rule - `staffResultShareBps`
         reads `ECONOMY.staffShare` and the finish and nothing else, so it is identical for every coach
         on this page and for every coach he could hire instead - so it belongs beside the weekly bill,
         once, and NOT on the cards. A per-card copy would be six identical sentences saying a fact
         about none of them, and would be the second surface for one engine verdict that this repo has
         already paid for four times.

         ⚠⚠ AND THE PERCENTAGES ARE READ OUT OF THE ENGINE, NEVER TYPED HERE. That is the whole
         difference between a sentence and a claim: `staffResultShareBps('coach', 0 | 1)` is the SAME
         function `finalizeTournament` calls when it actually pays him, so a retune of
         `ECONOMY.staffShare` moves this line and the cheque together and they cannot drift apart. Its
         two conditions are on the paper too, because both of them are things a parent would otherwise
         discover by not being charged: below a final it is nothing, and the junior ladder pays no
         prize money to take a share of (`track === 'wta'`). -->
    <p class="hint cm-share-note">
      Every coach here also takes <strong>{{ titleSharePct }}%</strong> of a prize cheque when she
      wins a tour title and {{ finalSharePct }}% when she is runner-up – nothing below a final, and
      nothing on the junior ladder, which pays no prize money.
    </p>

    <!-- ⚠ HOW MUCH ROOM IS LEFT IN HER, and it is the context every percentage below is relative to.
         Without it the market is unreadable at the top of a career: the uplift is a share of REMAINING
         headroom, so a girl near her ceiling sees every rung collapse towards zero AND towards each
         other (measured on the owner's save at 93.4% realised: budget +0.1-0.2%, elite +0.2-0.5%, the
         whole ladder inside four tenths of a point). He asked why his coach's number kept falling; this
         is the sentence that answers it, and it is engine-computed so it can never contradict the rows.
         It deliberately quotes no figure - `KidScreen` keeps her ceiling behind a fog of war and this
         must not be the back door through it.

         ⭐ ROUND-23 #1 - AND THE BAND IS NAMED OUT LOUD IN FRONT OF IT. His words are in the engine
         beside `coachRoomNote` (no Cyrillic in a template, tests/round13-nav.test.ts); the short of it
         is that the reading was true and buried, and he asked to be told it plainly. The label is the
         engine's own first clause, set in bold - the same device `.cm-travel-cost` above uses to put
         the figure a parent is looking for at the front of a sentence. The fog is untouched: the band
         is one of four words-only readings and no digit may appear in either half. -->
    <p v-if="roomNote" class="hint cm-room-note">
      <strong v-if="roomBand" class="cm-room-band">{{ roomBand }}</strong>{{ roomTail }}
    </p>

    <!-- Tier chips SCROLL to a section rather than filtering the list to nothing (design §T.1). -->
    <div class="controls market-chips">
      <button v-for="g in groups" :key="g.tier" class="tier-chip unlocked" @click="scrollToTier(g.tier)">
        {{ g.label }} <span class="chip-count">{{ g.rows.length }}</span>
      </button>
    </div>

    <!-- ⚠ A CONTROL MAY NOT RENAME ITSELF WHEN IT IS PRESSED (a11y, filed by the e2e sweep 09.08).
         Both of these are cycle buttons whose visible text is LABEL + CURRENT VALUE, so the whole
         thing was the accessible name: a screen-reader user pressed "Sort Best fit" and landed on a
         button called "Sort Price", with no way to tell whether the control had changed or the focus
         had moved. `aria-labelledby` pins the name to the STATIC half - "Sort", "Style", which is
         also the visible word a speech-input user would say - and `aria-describedby` hands the
         changing half over as the description, where a value belongs. Nothing moves on screen. -->
    <div class="controls market-controls">
      <button
        class="market-drop"
        :class="{ active: styleLens !== null }"
        aria-labelledby="cm-style-label"
        aria-describedby="cm-style-value"
        @click="cycleStyle"
      >
        <span id="cm-style-label" class="drop-label">Style</span>
        <strong id="cm-style-value">{{ PLAY_STYLE_LABEL[lensStyle] }}</strong>
      </button>
      <button
        class="market-drop"
        aria-labelledby="cm-sort-label"
        aria-describedby="cm-sort-value"
        @click="toggleSort"
      >
        <span id="cm-sort-label" class="drop-label">Sort</span>
        <strong id="cm-sort-value">{{ sort === 'fit' ? 'Best fit' : 'Price' }}</strong>
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
           reads as a person standing there, a square reads as an avatar.

           ROUND-21 #11 - THE COACH SHE HAS IS NEVER "BLOCKED", and that one word is the whole of the
           owner's report. `blocked` paints a refusal: a dashed grey border in place of the accent
           frame, a darker card, a greyed name and price, and the portrait at 0.45 opacity. It was
           being applied on the affordability test alone, so the coach the family ALREADY EMPLOYS
           went grey the moment his rung stopped fitting the week's income - which is a true thing to
           say about a coach you might hire and a false one about the coach you are paying. It is
           also information the row cannot lose: the action word on a current row is "Current" and
           has never been the over-budget figure, so nothing was being said by the dimming that is
           not said in words elsewhere. His quotes are in the .ts comments (no Cyrillic in a
           template, tests/round13-nav.test.ts) - see `familyWeeklyIncomeCents` in
           engine/world/coachMarket.ts and the `.cm-row.current` block in style.css. -->
      <button
        v-for="r in g.rows"
        :key="r.id"
        class="cm-row"
        :class="{ current: r.current, blocked: !r.current && (r.overBudgetCents > 0 || r.lockedPoints !== null) }"
        :disabled="r.current || r.lockedPoints !== null"
        :aria-label="rowLabel(r)"
        @click="askHire(r)"
      >
        <!-- `alt=""` now that the row carries its own label: the portrait's only text was the name,
             which the label already says, and Home's coach card decorates the same way. -->
        <span class="cm-art"><img :src="coachPortraitUrl(r.id)" alt="" loading="lazy" /></span>
        <span class="cm-body">
          <span class="cm-name">{{ r.name }}</span>
          <span class="cm-meta">
            <span class="fit-pill" :class="FIT_CLASS[r.fitNow]">{{ FIT_LABEL[r.fitNow] }}</span>
            <span class="cm-tags">{{ PLAY_STYLE_LABEL[r.style] }}</span>
          </span>
          <!-- ⭐ ROUND-23 #5 - WHO THIS ONE IS. Every other line on this card is a fact about his RUNG
               (the pill is the style table, both bands are tier tables, the load note is a `switch
               (tier)`), so four coaches on a rung printed four identical arguments under four drawn
               names. This is the one line that belongs to the person, keyed on his portrait stem in
               `coachBlurb` - never rolled, so the same face carries the same description in every
               career, exactly as it carries the same style.

               DIRECTLY UNDER THE NAME AND THE PILL, above the figures: it is identity, and identity is
               read before argument. It takes the load note's own treatment rather than a louder one -
               the uplift is still the card's headline and a description must not compete with it. -->
          <span v-if="coachBlurb(r.id)" class="cm-blurb">{{ coachBlurb(r.id) }}</span>
          <!-- WHAT THE RUNG IS WORTH TO HER, computed from her own headroom. Its own line, because
               it is the number the owner asked for and it must never be the thing that truncates.

               ⚠ AND THE PER-MATCH CORRIDOR SITS BESIDE IT, not under it in a block of its own - the
               owner asked for the smallest possible change to this card and for the new figure to be
               written next to the season one. So this is ONE wrapping row rather than two rules: at
               the content column's full width the two read side by side, and on a phone the second
               drops onto its own line, which is the only thing that fits there. It is the RUNG's
               band, never this coach's own number (see `formatEdge`). -->
          <span class="cm-uplift">
            <span class="cm-uplift-season">{{ formatUplift(r.upliftPct) }}</span>
            <span class="cm-edge">{{ formatEdge(r.edgePct) }}</span>
            <!-- ⭐⭐ ROUND-21 #2, THE LAST OPEN ITEM - AND WHAT IT IS WORTH WITH THE COACH ON THE
                 TRIP. The doubling shipped in the engine and this card kept quoting the HOME
                 corridor to a family paying a second fare to every event that pays.

                 ⚠ ONLY WHEN THE FAMILY WOULD ACTUALLY SEND HIM. The engine hands `null` when there
                 is nobody to send or the stance is off (`coachTravelsWithHer`, the same pair the
                 fare is charged on), so a career that leaves the coach at home reads exactly the
                 card it read before - one figure, unchanged.

                 ⚠ STILL THE RUNG AND NEVER THE MAN: twice a price bracket is a price bracket, and
                 the engine cuts both from the tier table without reading a coach id. §4 holds. -->
            <span v-if="r.edgeTravelPct" class="cm-edge-travel">{{ formatEdgeTravel(r.edgeTravelPct) }}</span>
          </span>
          <!-- WHEN THAT SECOND FIGURE APPLIES, said once and on her own coach's card only. The
               helping follows the FARE, which stays home for the rungs that pay no prize money unless
               the family has opened that stance too - so "the corridor is doubled" would be a claim
               about a season she may not be playing, and "twice that on the trips the coach travels
               to" is the true one. The engine writes it; this prints it. -->
          <span v-if="r.current && travelLine" class="cm-travel-edge">{{ travelLine }}</span>
          <!-- THE PLAQUE, and only the coach she actually has has one. Before a full season it says
               so and says when; after it, it carries the realised number for this person. See the
               `plaqueLine` block in the script for why it lives here rather than on Home, and for
               the register both sentences are held to. -->
          <span v-if="r.current" class="cm-plaque">{{ plaqueLine }}</span>
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
      <button v-if="current" :disabled="game.busy" @click="releasing = true">Coach her yourself</button>
    </section>

    </template>

    <ConfirmDialog
      v-if="pending"
      :message="confirmMessage"
      confirm-label="Hire"
      @confirm="doHire"
      @cancel="pending = null"
    />
    <!-- The other direction of the same decision - see `releaseMessage` for what it may and may not
         claim. Its own dialog rather than a second mode of the one above: the two messages are
         computed from different things and merging them would need a discriminator to keep them
         apart, which is more machinery than a second `v-if`. -->
    <ConfirmDialog
      v-if="releasing"
      :message="releaseMessage"
      confirm-label="Coach her yourself"
      @confirm="doRelease"
      @cancel="releasing = false"
    />
  </template>
</template>

<!-- ⭐ ROUND-23 #5 – THE ONE RULE THIS SCREEN OWNS, in the scoped block rather than in src/style.css,
     which is the placement HomeScreen already documents for a rule that belongs to exactly one
     surface (see its module header). It is one declaration set and no other screen can want it: the
     coach description exists only on a market row.

     ⚠ IT IS `.cm-load`'s TREATMENT, DELIBERATELY AND TO THE VALUE. Size, line-height and colour are
     copied from that rule on purpose: the description and the load note are both quiet prose under
     the name, and giving the new one its own weight or its own grey would make the card argue about
     which of two sentences matters more. The one difference is the margin – `.cm-load` opens a 2px
     gap above itself to separate the body note from the FIGURES, and this line sits directly under
     the meta row where `.cm-body`'s own 4px gap is already the separation. -->
<style scoped>
.cm-blurb {
  font-size: 10.5px;
  line-height: 1.35;
  color: var(--muted);
}
</style>
