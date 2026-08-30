// THE WEEK, LAID OUT IN DAYS – what the Calendar screen draws, and the rule behind it.
//
// The owner, on training weeks: today one is "skip, or match + skip", 1-2 clicks and the end-of-week
// screen, which feels thin next to a tournament trip. He asked for the day layout from her training
// plan (4/5/6 sessions a week) shown across the days, with matches marked.
//
// ⚠⚠ THE STANDING RULE OF THIS FILE CHANGED AT v47, DELIBERATELY AND BY AN OWNER RULING – REWRITTEN
// RATHER THAN QUIETLY CONTRADICTED (docs/specs/training-dials.md §9e).
//
// What it used to say, and it was correct for as long as the plan was one scalar: "NOTHING here is
// editable... a per-day editor is not a later refinement of this file, it is the thing this file exists
// instead of." The argument behind it was docs/specs/coach-as-load-manager.md risk (b) – "Weekly load
// sliders are exactly the chore the story screen was designed to avoid" – and that argument still
// stands against SLIDERS. The owner has ruled that the days themselves are the control: «у нас есть
// расписание недели и на каждый день там идут разные тренировки – это и есть ручки... надо сделать
// строчку с названием занятия а ниже набор из 7 галочек на каждый день недели».
//
// WHAT SURVIVES, and it is the whole of what this file is for:
//
//   The ticks are the plan. What the engine reads from them is how many sessions there are, which
//   kinds, which days, and how many share a day – NEVER a time of day. `REST_PRIORITY` and
//   `GYM_PRIORITY` stop being the model and become the PRESET EXPANDER: the arrangement a preset lays
//   down, and the arrangement a migrated career reads back as.
//
// `REST_PRIORITY` and `sessionsForPlan`/`sessionDays` therefore MOVED INTO THE ENGINE (engine/plan.ts)
// and are re-exported below under their historical names – the v46 -> v47 migration has to lay a week
// out and the engine may not import a composable. `weekGrid.ts` is untouched: the sim still has no
// hours, and «Времени суток у движка нет и не будет» stands.
//
// This file is still not a form – the CALENDAR remains a description of a week, and the checkbox matrix
// is a different screen (§9, `Her week` on the Coach Market tab). What changed is where its numbers come
// from: `plan.week`, when the save carries one, rather than `plan.train` read as a percentage.
//
// -------------------------------------------------------------------------------------------------
// WHERE EVERY NUMBER COMES FROM, because a calendar that invents facts is worse than no calendar
// -------------------------------------------------------------------------------------------------
//
// HOW MANY SESSIONS, AND WHICH DAYS: `planWeek(plan)` - the save's own seven-day matrix, or, for a
// career that predates v47, the arrangement that scalar has always been drawn as. Neither number is
// invented here any more. What this file adds is `resolveWeek(..., capacity)`: the plan is a STANDING
// statement and outlives the week it was built in, so three doubled days built in July are laid back
// out across seven single days in September rather than drawn as a week the engine will not run.
//
// ⚠ THE CAPACITY TRAVELS AS DATA (`Snapshot.planDayCapacity`) AND MAY NOT BE RE-DERIVED HERE.
// `summerBlockWeek` refuses a doubled day on an injury, a booked family week, a tournament and a
// rested knock as well as on the calendar - that is not a predicate a screen could reconstruct, which
// is the same argument `CalendarWeek.schoolOver` and `summer` already travel under. Absent, it reads
// as a school day (capacity 1), which is a no-op for every legacy plan: none of them doubles anything.
//
// THE GYM DAY IS WHEREVER FITNESS IS TICKED - owner, 10.08: «либо тренер решает - это и остается в
// текущем варианте, либо родитель галочки проставит - тогда что прокликал, то и ставим». Tuesday
// stops being a convention. The visible consequence for a loaded career is the one §10 of the spec
// predicted and ruled: the migration writes `general` on every session day, so a v46 career opens
// with NO gym day drawn, and the plan tab's first invitation is to decide whether one of them is one.
//
// THE MATCH DAY: a booked practice match takes the week's LAST court day, which is Saturday at every
// plan. Same class of convention as the rest days, same reason.
//
// THE COURT'S COLOUR AND ITS VERDICT: the surface block she is in (`surfaceBlockFor` ->
// `dominantSurface`, the engine's own table) and the engine's own read of that court for her build
// (`surfaceStyleHint`). Neither is re-worded here - the sentence is the engine's, so this screen and
// every event card in the app can never disagree about whether clay suits her.
//
// -------------------------------------------------------------------------------------------------
// WHY IT IS A PURE MODULE AND NOT SETUP CODE IN THE SFC
// -------------------------------------------------------------------------------------------------
// Because it is a RULE with content - a count, a priority order, a precedence between six kinds of
// week - and a rule inside a template is decoration that cannot be tested. The functions below take
// plain facts, so tests/calendar-screen.test.ts pins the layout on values rather than on strings in a
// file. Same argument `composables/weekRecap.ts` makes for the recap predicate.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import {
  SUMMER_WEEKS,
  TIERS,
  TIER_LADDER,
  dominantSurface,
  isExamWeek,
  isOffSeasonWeek,
  isSummerWeek,
  surfaceBlockFor,
} from '../engine/season/calendar'
import { eventIsHers, layoffCoversWeek, masseurWorksInWeek } from '../engine/world'
import {
  DAY_CAPACITY_FREE,
  DAY_CAPACITY_SCHOOL,
  planSessions,
  planWeek,
  resolveWeek,
  sessionDays,
  sessionsForPlan,
} from '../engine/plan'
import { knockGoverns } from '../engine/knock'
import { surfaceStyleHint } from '../engine/match/style'
import { vacationPackage } from '../engine/economy'
// W2-LADDER §4: the two-type feed and the stacked-week pick - the SAME two rules the Season screen
// reads, so the look-ahead markers and the season rows cannot disagree about which events exist.
import { feedContext, feedShows, preferredWeekEvent } from './tierState'
import { weekLabel, weekSpan } from '../shared/dates'
import type { Surface } from '../engine/match/types'
import type { TierDef, TierId } from '../engine/season/types'
import type { SessionKind, Snapshot, UpcomingEvent } from '../shared/protocol'

/** The grid's column heads, Monday first – the same Monday..Sunday span `shared/dates.ts` builds
 *  every date range from, so the columns and the printed dates cannot disagree about which day is
 *  which. */
export const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
/** ...and their long names, for the one sentence that has room to say a day out loud. */
export const DAY_LONG = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

/** ⚠ THE TUESDAY CONVENTION, AND NOTHING DRAWS FROM IT ANY MORE (v47, owner 10.08). The fitness day
 *  used to be claimed in THIS order among the days that were already sessions, which landed it on
 *  Tuesday at all three presets. Since the player ticks Fitness himself, the calendar draws the gym
 *  wherever he ticked it and this order decides nothing - it is kept because `gymDayIndex` below is
 *  the answer to "which day was the drawn gym day BEFORE the plan became a matrix", which is a
 *  question the v46 -> v47 migration's own note (engine/migrations.ts) refers to and the tests pin. */
const GYM_PRIORITY: readonly number[] = [1, 3, 5, 0, 2, 4, 6]

/** WHAT THE PLAN MADE OF ONE DAY: a day off, a day on court, or a day in the gym.
 *
 *  ⚠ ONE DERIVATION, AND IT IS THE REASON `CalendarWeek` CARRIES `planDays` AT ALL. `weekGrid.ts`
 *  used to re-derive the same three-way answer from `sessionDays` + the week's single `gymIndex`,
 *  under a note warning that a second spelling is how the picture and the plan drift apart on the one
 *  week nobody looks at twice. A matrix has no single gym index, so the choice was a second spelling
 *  or none; this is none.
 *
 *  A DOUBLED DAY THAT MIXES THE TWO IS A COURT DAY. The mark answers "what is this day", one word,
 *  and she is on court that day - `DayKind` gained nothing at v47 (spec §9d) and a day that is only
 *  fitness is the only day the gym owns outright. */
export type PlanRole = 'rest' | 'court' | 'gym'
export function planRoleFor(day: readonly SessionKind[]): PlanRole {
  if (day.length === 0) return 'rest'
  return day.every((k) => k === 'fitness') ? 'gym' : 'court'
}

/** What one cell of the grid is. */
export type DayKind =
  /** a session on court */
  | 'court'
  /** the week's one fitness session */
  | 'gym'
  /** the plan's day off */
  | 'rest'
  /** the booked practice match */
  | 'match'
  /** she is away at a tournament – the trip owns the whole week */
  | 'away'
  /** a booked family week, or the off-season: no tennis at all */
  | 'off'
  /** a school-exam blackout */
  | 'school'
  /** the injury layoff covers this week */
  | 'rehab'
  /** ⭐ ROUND 28 #6 – A DAY AT THE SPONSOR'S SHOOT. The ninth kind, and the FIRST one that is not a
   *  whole week: a shoot week keeps her training days and gives up her free ones (see
   *  `shootDaysFor`), so this kind lands on SOME days of an otherwise ordinary week. Everything the
   *  grid does with it follows from that – `weekGrid.ts` shapes the day from its kind exactly as it
   *  shapes a trip day, and every day around it is still the plan's. */
  | 'shoot'

/** THE THREE THINGS THE CROSSING-OUT ANIMATION STOPS FOR (owner: it "runs through, or PAUSES on a
 *  match / an injury / a knock and then continues").
 *
 *  ⚠ ALL THREE ARE KNOWN BEFORE THE TICK, and that is not a coincidence - it is what makes the
 *  animation honest. The days are crossed out on the way INTO a week, so a beat the sim has not
 *  resolved yet (did she get hurt? did she win?) could not be paused on without the screen guessing.
 *  A booked friendly, a live layoff and a live knock are all facts on the snapshot in hand. */
export type DayBeat = 'match' | 'injury' | 'knock'

export interface CalendarDay {
  /** 0 = Monday … 6 = Sunday */
  index: number
  short: string
  kind: DayKind
  /** the beat that makes the animation hold here, or null */
  beat: DayBeat | null
  /** a word under the mark on the days that are not the week's default, or null */
  note: string | null
}

export interface CalendarWeek {
  /** the absolute career week these days belong to */
  week: number
  days: CalendarDay[]
  /** sessions the plan buys (court + gym). ⚠ NOT A DAY COUNT SINCE v47 – a school-free week may put
   *  two on one day, so this can exceed the number of days she trains on. */
  sessions: number
  /** DAYS with court work on them – days, not sessions, and the same for `planDays`'s `gym`. */
  courtDays: number
  /** ⚠ WHAT THE PLAN MADE OF EACH DAY, Monday..Sunday, WHATEVER THIS WEEK'S OWN IDENTITY OVERWROTE
   *  `days[].kind` WITH. On an ordinary week it agrees with `days[].kind` by construction; on the
   *  exam fortnight and the layoff week `days` is flattened to one kind – the week's identity
   *  outranks the plan there – but the plan is still bought and still billed, so the grid needs to
   *  know which days it paid for. `weekGrid.ts` reads this instead of re-deriving it. */
  planDays: PlanRole[]
  /** the block's court, for the grid's tint */
  surface: Surface
  /** the engine's own verdict on that court for her build, or null when it is neutral */
  surfaceNote: string | null
  /** what this week IS, for the grid's eyebrow */
  title: string
  /** the sentence under the grid – the plan, read back as days */
  readout: string
  /** ⚠ IS THIS WEEK THE OFF-SEASON? `off` serves two different weeks - a booked family package and
   *  the off-season - and `days` alone cannot tell them apart, only the display `title` could. The
   *  grid needs the distinction to decide whether a family week carries homework (there is no term
   *  to miss in the off-season), and it may not ask the engine itself: it is presentation, derived
   *  from what it is handed. This file is the one that legitimately talks to the calendar, so the
   *  answer travels as data. */
  offSeason: boolean
  /** IS THIS WEEK INSIDE THE SCHOOL SUMMER HOLIDAYS (R15-8)? Carried as data for the same reason
   *  `offSeason` is - the grid may not ask the calendar itself - and read by the grid to swap the
   *  school furniture of an ORDINARY week for the holidays' light study. See `SUMMER_WEEKS`. */
  summer: boolean
  /** IS SHE PAST HER LAST SCHOOL YEAR IN THIS WEEK (W4-SCHOOL)? Carried as data for the same reason
   *  `offSeason` and `summer` are: the grid may not ask the engine. It is what swaps the eight
   *  o'clock lesson block and the evening homework hour for a professional's day – the owner's own
   *  «и школа с уроками в 22 года всё еще со мной». Per-WEEK, not per-career: the calendar draws
   *  weeks either side of the leaving September and both must be right. */
  schoolOver: boolean
  /** WHICH family package she is on, when she is on one – the catalogue's own id, or undefined on
   *  every other week. Carried as data for the same reason `offSeason` is: `weekGrid.ts` may not
   *  import from the engine, so the composer looks the booking up and the grid only ever reads. */
  vacationId?: string
  /** ⭐ ROUND 28 #1 – THE DAYS THE MASSEUR'S TABLE IS HERS, Monday..Sunday indices, empty when
   *  nobody is hired or the week is one he does not work.
   *
   *  The owner: with a masseur on the payroll, put the massage sessions the chosen TIER buys into
   *  the week's schedule. He was already bought, billed and dialled – `ECONOMY.masseur.rungs` is
   *  2 / 4 / 7 sessions a week – and the week never showed one of them, which is the "you paid and
   *  cannot see it" failure the plan bans specialists for.
   *
   *  ⚠ IT IS EXACTLY `masseurSessionsPerWeek` ENTRIES, or none, and the weeks that get none are the
   *  weeks the ENGINE pays him nothing for – see `masseurDaysFor` and the note above it. Carried as
   *  DATA for the reason `offSeason` and `summer` are: `weekGrid.ts` may not ask the engine. */
  masseurDays: number[]
  /** ⭐ ROUND 28 #4/#6 – THE SPONSOR'S SHOOT, when this week is one of the signed deal's named shoot
   *  weeks and the week is otherwise hers to plan. Null on every other week, and null on the five
   *  weeks whose own identity outranks it – a layoff, a trip, a family week, the off-season and the
   *  exam fortnight (see `calendarWeekFor`'s precedence note).
   *
   *  `days` are the Monday..Sunday indices the shoot took; `brand` is whose it is, so the grid and
   *  the read-out can name it without re-deriving a deal. */
  shoot: { brand: string; days: number[] } | null
  /** ⭐⭐ ROUND 29 P13/P14/P15 – WHAT THIS TRIP IS, when the week is a committed tournament trip.
   *  Null on every other week. See `TripFacts` for what each field decides. */
  trip: TripFacts | null
  /** ⭐ ROUND 29 P15 – HOW LONG NEXT WEEK'S DRAW IS, when she is entered in one and this week's days
   *  are still hers to lend. Null otherwise, which is the answer on almost every week of a career.
   *
   *  ⚠ IT IS A NUMBER AND NOT A VERDICT, deliberately. Whether a draw that long needs to start
   *  travelling on the Sunday before is a LAYOUT question – seven days, a travel day at each end –
   *  and `weekGrid.ts` owns it (`tripKeepsDeparture`). This file's job is the FACT: she is entered,
   *  next week, in a draw of this many rounds. Handing down a boolean would have put the arc's
   *  arithmetic in two files and made them able to disagree about which rungs leave at the weekend.
   *
   *  ⚠ NULL IS THE CONSERVATIVE ANSWER AND FOUR THINGS PRODUCE IT: no event next week, an event she
   *  did not enter, the end of the fixture list – and a week whose own identity outranks the loan.
   *  A trip week, a booked family week, the off-season and a layoff all keep their Sunday: her own
   *  week owns its days, so two big events back to back never fight over one evening and a girl in a
   *  cast is not drawn boarding a plane. */
  nextTripRounds: number | null
  /** Should the days cross themselves out when the week is played? False when another surface owns
   *  the week: a tournament trip has its own flow and its own screens, and a week whose reveal is
   *  already paused is not a week anybody is about to watch pass. */
  animates: boolean
}

/** ⭐⭐ ROUND 29 P15/P13/P14 – THE THREE FACTS THAT SHAPE A TRIP WEEK, carried as DATA for the reason
 *  `offSeason`, `summer` and `masseurDays` are: `weekGrid.ts` may not import from `../engine/`, and a
 *  guard holds it to that. This file is the one that legitimately talks to the engine, so it asks
 *  once and the arc reads.
 *
 *  ⚠ NOTHING HERE IS PERSISTED AND NOTHING HERE IS DRAWN. All three are arithmetic over facts the
 *  save already carries (the entered event's tier, the hire, the travel stance), so the schema is
 *  untouched and no RNG stream – MAIN or sub – is tapped. A week's picture is not a roll. */
export interface TripFacts {
  /** ⭐ P15 – HOW MANY DAYS OF THE WEEK ARE MATCH DAYS: the draw's own round count,
   *  `log2(drawSize)`, which is `runTournament`'s own arithmetic rather than a second table.
   *  The owner asked for exactly this shape – «на локалах 3 дня, National 4 (вроде), основная масса
   *  5, а на 1000 вообще 6 (Шлем 7)» – and the engine's draw sizes produce his numbers without a
   *  taste being exercised anywhere: 8 / 16 / 32 / 64 / 128 are 3 / 4 / 5 / 6 / 7 rounds.
   *
   *  ⚠ IT IS THE DRAW'S ROUNDS AND NOT THE ROUNDS SHE SURVIVES. Seven days are drawn before the week
   *  is played, so this says HOW LONG THE EVENT RUNS, never how far she got – see `tripArcFor`, which
   *  labels every one of them identically for that reason. */
  rounds: number
  /** ⭐ P13 – DID THE MASSEUR MAKE THIS TRIP? The engine's own predicate (`masseurWorksInWeek`) and
   *  the travel stance, asked once. False when nobody is hired, when the college freeze covers the
   *  week, or when he stayed home – and on the last of those the engine still charges the retainer,
   *  which is the truth about both (see `resolveMasseur`). */
  masseur: boolean
  /** ⭐ P14 – DOES THIS RUNG HOLD PRESS CONFERENCES? `tierHoldsPress`, which is a threshold on the
   *  ladder rather than a taste per event. */
  press: boolean
  /** ⭐⭐ ROUND 30 #2 – IS A SPONSOR'S SHOOT RUNNING ON THIS TOURNAMENT WEEK? True on exactly the
   *  weeks the player answered «do both» to round 29 #3's four-way question, and false on every
   *  other trip.
   *
   *  ⚠⚠ THE OWNER PAID FOR THIS AND COULD NOT SEE IT – «Если выбрать Do both для съёмок и турнира,
   *  то в расписании не отображаются съёмки». `answerShootClash`'s «do both» arm charges
   *  `clashConditionPerDay` x 7 and leaves the week standing; `calendarWeekFor`'s trip branch
   *  returned before `shoot` was ever filled in, so the grid drew an ordinary tournament week and
   *  the charge had no picture. See `tripMatchDay` in weekGrid.ts for where the hours go.
   *
   *  ⚠ IT NEEDS NO NEW SNAPSHOT FIELD AND MOVES NO SCHEMA, WHICH IS WHY THE LATCH IS NOT READ HERE.
   *  `shootClashAccepted` is world state and is deliberately not on the wire. It does not have to
   *  be: the other three answers REMOVE the collision – `withdraw` cancels the entry (no `arrival`),
   *  `move-shoot` and `cancel-shoot` take the week out of `shootWeeks` (no `adShoots` row) – so a
   *  week that is BOTH an entered trip and a named shoot week is the «do both» week by construction
   *  once the question has been answered. Before it is answered the clash dialog is blocking the
   *  tick, and what the grid draws is the week the dialog is asking about, which is the right
   *  picture to be looking at while deciding. */
  shoot: boolean
}

/** The snapshot facts the layout reads. A `Pick`, so a test can hand in a plain object – the
 *  `RecapFacts` idiom from composables/weekRecap.ts.
 *
 *  ⚠ `tierOpen`/`ageYears` ARE OPTIONAL ON THE FACTS AND REQUIRED ON THE SNAPSHOT (W2-LADDER §4,
 *  carried into W2-WINDOW's rule unchanged, replacing R15-9's optional latches for the same reason): the live screen always has the
 *  engine's oracle, while the older test fixtures predate it - and a fixture without one must mean
 *  "hide nothing", which is exactly what `feedContext` does with an absent `tierOpen`. Making them
 *  required here would force ceremony onto two dozen fact bags to say the thing absence says. */
export type CalendarWeekFacts = Pick<
  Snapshot,
  'week' | 'plan' | 'profile' | 'injury' | 'knock' | 'vacations' | 'practices' | 'upcoming' | 'arrival' | 'pending'
> &
  Partial<Pick<Snapshot, 'tierOpen' | 'ageYears'>> &
  // round-21 #5: WHICH TABLE IS HERS, so the look-ahead can drop the rungs that pay into one she has
  // left. Optional for the same reason as its two neighbours above - absence means "do not judge the
  // table", which is how every fixture written before it already read.
  Partial<Pick<Snapshot, 'activeLadder'>> &
  // W4-SCHOOL: the week her school years end, so this file can answer the question for ANY week it
  // is asked about rather than only for `snap.week`. Optional for the same reason `ageYears` is –
  // hand-built fixtures pre-date it – and a fixture that omits it gets a schoolgirl, which is what
  // every one of them was written about.
  Partial<Pick<Snapshot, 'schoolEndsWeek'>> &
  // v47: how many sessions ONE DAY of the drawn week may hold (1, or 2 with no school). Optional for
  // the same reason, and absence means a school day – which is a no-op for every plan written before
  // v47, since none of them puts two sessions anywhere.
  Partial<Pick<Snapshot, 'planDayCapacity'>> &
  // ⭐ ROUND 24 #5: the week she leaves for college, so the look-ahead can mark the departure the
  // way it marks every other week identity. Optional for the fixture reason above – absence means
  // no departure is booked, which is what every fixture written before it was about.
  Partial<Pick<Snapshot, 'collegeDepartsWeek'>> &
  // ⭐ AD STEP 2 (§4a): the running endorsement's named shoot weeks, so the look-ahead can mark them
  // the way it marks the departure – a decision already made, visible before it arrives. Optional
  // for the same fixture reason – absence means no deal is running, which is what every fixture
  // written before it was about.
  Partial<Pick<Snapshot, 'adShoots'>> &
  // ⭐ ROUND 28 #1 – THE MASSEUR, so the week can draw the sessions his rung buys. Three facts and
  // no fourth: is he hired, how many sessions the dial is set to, and does he travel (the one thing
  // that decides whether a tournament week has him in it at all). Optional for the fixture reason
  // above – absence means nobody is hired, which is what every fixture written before v59 was about.
  Partial<Pick<Snapshot, 'masseurHired' | 'masseurSessionsPerWeek' | 'masseurTravels'>> &
  // ...and the college freeze, which suspends BOTH of the above. The engine's own rule in both
  // cases: `masseurWorksThisWeek` refuses inside the freeze, and `adShootHolds` swallows a shoot
  // week the freeze covers – «no penalty, no makeup». A calendar that drew either would be the
  // screen billing him for a week the sim gives away. Optional for the fixture reason above.
  Partial<Pick<Snapshot, 'college'>>

/** ⚠ THE SUMMER WINDOW MOVED INTO THE ENGINE (W3-SUMMER) AND IS RE-EXPORTED HERE UNDER ITS HISTORICAL
 *  NAMES, so every existing caller and every test that imports `SUMMER_WEEKS` / `isSummerWeek` from
 *  this module keeps working unchanged.
 *
 *  This file's own note used to defend the window living here: «A DISPLAY FACT, NOT AN ENGINE ONE...
 *  nothing in the sim gates on summer (school itself is furniture the grid draws, not a thing the
 *  engine bills)». That was true and it is not any more. The owner ruled that the holidays are a REAL
 *  training block - «если мы летом сделаем реальную нагрузку с 2 тренировками в день я не вижу
 *  ничего плохого, это как раз частично компенсирует недостаток тренерских недель в другие периоды» -
 *  so the sim now develops and fatigues a summer week differently, and a window the engine gates on
 *  belongs in `season/calendar.ts` beside the exam fortnight and the off-season. The grid still gets
 *  it as DATA on `CalendarWeek`: weekGrid.ts may not import from the engine, and still does not. */
export { SUMMER_WEEKS, isSummerWeek }

/** ⚠ THE PRESET EXPANDER MOVED INTO THE ENGINE AT v47 AND IS RE-EXPORTED HERE UNDER ITS HISTORICAL
 *  NAMES, so every existing caller and every test that imports `sessionsForPlan` / `sessionDays` from
 *  this module keeps working unchanged – the same shape `SUMMER_WEEKS` / `isSummerWeek` took when the
 *  summer window moved (W3-SUMMER), and for the same reason: the v46 -> v47 migration has to lay a week
 *  out, and the engine may not import a composable (CLAUDE.md invariant 1). `REST_PRIORITY` went with
 *  them, so there is still exactly one convention and the save and the calendar cannot drift apart. */
export { sessionsForPlan, sessionDays }

/** The week's one fitness day, or null when the plan buys fewer than two sessions (a single session
 *  a week is on court – there is no week in which the only tennis she does is a gym). */
export function gymDayIndex(sessions: number): number | null {
  if (sessions < 2) return null
  const session = new Set(sessionDays(sessions))
  return GYM_PRIORITY.find((d) => session.has(d)) ?? null
}

/** The week she comes back, as the calendar counts it: she is available at the TOP of this week, so
 *  the layoff window is EXCLUSIVE of it (R10-17, the same off-by-one `layoffCoversWeek` encodes).
 *  Null when she is healthy. */
export function layoffReturnWeek(snap: Pick<Snapshot, 'week' | 'injury'>): number | null {
  return snap.injury ? snap.week + snap.injury.weeksRemaining : null
}

/** ⭐ ROUND 28 #1 – WHICH DAYS THE MASSEUR'S TABLE LANDS ON, given how many sessions the rung buys.
 *
 *  THE RULE IS "THE TABLE FOLLOWS THE WORK": her training days first, in day order, and then the
 *  free ones – so the entry rung (2) is two sessions beside the two hardest days of her week and the
 *  top rung (7) is every day, which is what «Daily» means. It returns EXACTLY `sessions` days (the
 *  rungs are 2 / 4 / 7 and a week has seven days, so the list can never run out), which is what
 *  makes the picture and the bill the same number: what he is paid for is what is drawn.
 *
 *  ⚠ DETERMINISTIC AND PLAN-SHAPED, NEVER DRAWN. Nothing in the masseur touches any RNG stream by
 *  construction (`engine/world/masseur.ts`'s own header), and a calendar that shuffled his days week
 *  to week would be the screen inventing a decision nobody made. */
export function masseurDaysFor(sessions: number, planDays: readonly PlanRole[]): number[] {
  if (sessions <= 0) return []
  const working = planDays.flatMap((role, d) => (role === 'rest' ? [] : [d]))
  const free = planDays.flatMap((role, d) => (role === 'rest' ? [d] : []))
  return [...working, ...free].slice(0, sessions).sort((a, b) => a - b)
}

// =================================================================================================
// ⭐⭐ ROUND 29 P15 / P14 – THE TWO THINGS THE TRIP WEEK NEEDS TO KNOW ABOUT THE RUNG
// =================================================================================================

/** ⭐ P15 – HOW MANY MATCH DAYS THE EVENT RUNS FOR: `log2(drawSize)`, the draw's own round count.
 *
 *  ⚠ IT IS DERIVED FROM THE CATALOGUE, NOT A SECOND TABLE OF NUMBERS, and that is what makes it
 *  checkable rather than a taste. `TierDef.drawSize` is documented as POWERS OF TWO ONLY because
 *  `runTournament` reads `Math.log2(drawSize)` as its round count – so this is the engine's own
 *  arithmetic asked from the outside, and a rung whose draw grows gets a longer week for free.
 *
 *  ⚠ AND IT LANDS ON THE OWNER'S OWN NUMBERS WITHOUT BEING FITTED TO THEM. He asked for «на локалах
 *  3 дня, National 4 (вроде), основная масса 5, а на 1000 вообще 6 (Шлем 7)»; the shipped draws give
 *  local 8 -> 3, regional 16 -> 4, every 32-draw -> 5, wta1000 64 -> 6, slam 128 -> 7. His «вроде»
 *  is answered by the table rather than around it: the FOUR-day rung is `regional`, not `national` –
 *  the National Series is a 32-draw in this game, so it is one of the five-day «основная масса»
 *  alongside the junior tour, the W-series and the WTA 250/500.
 *
 *  ⚠ AN ID THE CATALOGUE DOES NOT KNOW GETS THE COMMON WEEK rather than an exception. Nothing in the
 *  shipped app can produce one – `arrival.tier` is the engine's own – but hand-built fixtures and a
 *  save written by a build with a rung this one lacks both can, and a calendar is not the place to
 *  throw: five rounds is what almost every rung on the ladder is, and it is the same answer
 *  `weekGrid.ts`'s `TRIP_DEFAULT` gives a caller who said nothing at all (a test ties the two to the
 *  catalogue so neither can drift into being a number somebody picked). */
export const TRIP_ROUNDS_FALLBACK = 5
export function tripRoundsFor(tier: TierId): number {
  const def = TIERS[tier] as TierDef | undefined
  return def ? Math.log2(def.drawSize) : TRIP_ROUNDS_FALLBACK
}

/** ⭐ P14 – THE RUNG FROM WHICH A TOURNAMENT PUTS HER IN FRONT OF A MICROPHONE.
 *
 *  The owner scoped this item himself – «на тех уровнях турниров, где это актуально» – and the cut
 *  is the WTA main tour: WTA 250, 500, 1000 and the Slams. Two reasons, and the second is the game's
 *  own:
 *
 *    * the sport's. A tour-level event runs a press room and a player who has played is required in
 *      it; an ITF W15 in a municipal park does not have one, which is his own example.
 *    * ⭐ THE ENGINE ALREADY DREW THIS LINE SOMEWHERE ELSE. `ECONOMY.endorsements` pays an APPEARANCE
 *      FEE from `wta250` up – «$15,000 to be on the poster of a WTA 250 or better» – so the rung
 *      where a tournament starts paying for her presence is exactly the rung where it starts asking
 *      for her time. One line, two mechanics, and this one is the free half of it.
 *
 *  ⚠ A THRESHOLD ON `TIER_LADDER`, NOT A LIST OF FOUR IDS. The ladder is the single source of truth
 *  for "is A above B", so a seventeenth rung slotted above the 250 inherits the press room instead of
 *  silently falling out of a hand-written set – the failure `ART_TIER_ORDER` records having had.
 *
 *  ⚠⚠ AND IT IS FLAVOUR, NOT A MECHANIC. Nothing downstream of this reads a number: it adds one
 *  block to a day that is already drawn, it costs no cents, spends no condition, moves no schedule
 *  and cannot block a week. If that ever stops being true it needs the owner, not a follow-up. */
export const PRESS_FROM_TIER: TierId = 'wta250'
export function tierHoldsPress(tier: TierId): boolean {
  const rung = TIER_LADDER.indexOf(tier)
  return rung >= 0 && rung >= TIER_LADDER.indexOf(PRESS_FROM_TIER)
}

/** ⭐ ROUND 28 #6 – WHICH DAYS THE SHOOT TAKES, and the rule is the ENGINE'S OWN CHARGE DRAWN.
 *
 *  The owner asked for the shoot week to be a COMBINATION – her training days and the shoot's slots
 *  in one week – rather than the shoot eating the week, and his ruling behind the mechanic says the
 *  same thing from the other end: the shoots «надо ... отражать потом в свободных неделях», and the
 *  week stays hers. `accrueCondition` implements exactly that: a shoot week recovers at the TRAVEL
 *  figure, which is to say it keeps her sessions and FORFEITS THE REST – the slider bonus and the
 *  masseur's condition term both come off, and nothing about her training moves.
 *
 *  ⚠⚠ ROUND 29 #3 – AND "THE MASSEUR'S TABLE COMES OFF" IS A SENTENCE ABOUT THE CONDITION SUM AND
 *  NOT ABOUT THE MAN. It used to be written here without that qualifier and this file read it as a
 *  stand-down, which is how `masseurSessions` above grew a `&& !shooting` the engine never had: the
 *  salary is CHARGED on a shoot week (`resolveMasseur` reads `masseurWorksThisWeek`, which knows
 *  nothing about a shoot), so the week he was drawn out of was a week the family paid for. His days
 *  are drawn again. What is unchanged is `accrueCondition`'s arithmetic – its `!shooting` term is
 *  the owner-approved «lights and flights, not his table» and is deliberately NOT touched here.
 *
 *  So the shoot takes the days the plan left FREE, and only those. The picture is then the same
 *  sentence the sim charges for: the training stands, the rest is what went. A plan with no free day
 *  at all still gets one slot – a shoot named in a signed letter happens – and it takes the last day
 *  that is not the booked friendly, because a friendly is a commitment with a date and a shoot day
 *  inside the plan is the thing that gives.
 *
 *  ⚠ `planDays` AND NOT THE LIVED DAYS. On a week she is resting a knock EVERY day reads as rest,
 *  and a shoot that swallowed all seven of them would be the shoot owning the week – exactly what
 *  the mechanic's own design forbids. The plan is what says which days were hers to give. */
export function shootDaysFor(planDays: readonly PlanRole[], matchIndex: number | null): number[] {
  const free = planDays.flatMap((role, d) => (role === 'rest' && d !== matchIndex ? [d] : []))
  if (free.length > 0) return free
  for (let d = planDays.length - 1; d >= 0; d--) if (d !== matchIndex) return [d]
  return []
}

/** Every day the same kind, for the five weeks that are not hers to train through. */
function uniform(kind: DayKind, beat: DayBeat | null, note: string | null): CalendarDay[] {
  return DAY_SHORT.map((short, index) => ({
    index,
    short,
    kind,
    // the beat lands on the FIRST day: a week she is not training is a week whose news is its opening
    beat: index === 0 ? beat : null,
    note: index === 0 ? note : null,
  }))
}

/** THE LAYOUT. Precedence runs from "somebody else owns this week" down to the ordinary training
 *  week, in the same order the app already resolves a week's identity elsewhere: the body first (a
 *  layoff outranks every plan, exactly as `availabilityStatus` puts injured above everything), then
 *  the committed trip, then the bookings, then the calendar's own blackouts.
 *
 *  ⚠ AND THE SHOOT SITS AT THE BOTTOM OF THAT LIST, WHICH IS THE SAME PLACE `lookAheadFor` PUTS IT
 *  (round 28 #6). The two surfaces must not disagree about what a week IS, and the mechanic's own
 *  design settles the order anyway: a shoot week is «not blocked and not double-charged» – a
 *  tournament, a family week or a layoff on a shoot week genuinely happens, and the shoot never
 *  pretends to own the week. So `shoot` is non-null on exactly the branch where the shoot actually
 *  shapes the days: the ordinary week, the one the owner asked to see the combination on. */
export function calendarWeekFor(snap: CalendarWeekFacts, week: number): CalendarWeek {
  const block = surfaceBlockFor(week)
  const surface = dominantSurface(block)
  const surfaceNote = surfaceStyleHint(snap.profile.playStyle, surface)
  // ⚠ THE PLAN, LIVED IN THIS WEEK. See the header: `planWeek` is the save's own matrix (or the
  // arrangement a pre-v47 scalar has always been drawn as) and `resolveWeek` is what a standing plan
  // does when the week it is spent in cannot hold it. Both are the ENGINE's, imported rather than
  // re-spelled, so the days the calendar draws and the days the tick bills can never disagree.
  const capacity = snap.planDayCapacity ?? DAY_CAPACITY_SCHOOL
  const laid = resolveWeek(planWeek(snap.plan), capacity)
  const planDays = laid.map(planRoleFor)
  const sessions = planSessions(laid)
  const session = planDays.flatMap((role, d) => (role === 'rest' ? [] : [d]))
  const courtDays = planDays.filter((role) => role === 'court').length
  // ⭐ ROUND 28 #1/#6 – THE TWO FACTS ABOUT THIS WEEK THAT ARE NOT ABOUT THE PLAN, asked once, above
  // the branches, because the answer is the same in every one of them and a second spelling of
  // either would be the drift this file spends its comments avoiding.
  //
  // ⚠ THE COLLEGE FREEZE KILLS BOTH, and that is the ENGINE's rule read back rather than a UI
  // decision: `masseurWorksThisWeek` refuses inside the freeze and `adShootHolds` swallows a shoot
  // week the freeze covers, so a calendar drawing either would promise work the sim does not do.
  const frozen = snap.college != null && week < snap.college.untilWeek
  // Any live deal of the portfolio can own the week (P6): the first deal naming it lends the name.
  const shootDeal = frozen ? undefined : snap.adShoots?.find((d) => d.weeks.includes(week))
  const shooting = shootDeal !== undefined
  const bookedOff = snap.vacations.some((v) => v.week === week)
  const awayThisWeek = snap.arrival?.week === week
  // ⚠⚠ ROUND 29 #3 – `&& !shooting` STOOD HERE AND IT WAS A RULE ONLY THIS FILE HELD. The engine's
  // `masseurWorksThisWeek` refuses on three states (hired, not frozen, not a booked family week)
  // and a shoot is not one of them, so `resolveMasseur` CHARGED the salary on a shoot week while
  // this line drew none of his days – «вы заплатили и не можете этого заметить», the failure the
  // travelling-team plan bans specialists for, written fifteen lines above where the bug was. The
  // owner found it from first principles: «Если есть турнир или тренировки, то есть и массажист.»
  // A shoot takes her FREE days and leaves the plan's training days alone (`shootDaysFor`), so a
  // shoot week HAS training in it, and therefore has him in it.
  //
  // ⚠ THE THREE REFUSALS ARE THE ENGINE'S NOW, NOT A FOURTH SPELLING OF THEM: `masseurWorksInWeek`
  // is `masseurWorksThisWeek`'s own body taking primitives, so the week the bill is charged for and
  // the week his days are drawn on are the same week by construction. `tests/component/
  // round29-masseur-parity.test.ts` is the guard, on the round-28 #8 shared-source pattern.
  //
  // ⚠ THE AWAY TERM STAYS AND IS NOT PART OF THAT PREDICATE, deliberately: it answers WHERE he works
  // and not WHETHER he is working, which is the step-2 rule that a masseur left at home earns
  // nothing on the weeks she is not home (`accrueCondition`'s `!playedThisWeek`). The retainer runs
  // on a tournament week he stays home from – `resolveMasseur` says so – and the calendar draws no
  // table for it, which is the truth about both.
  const masseurOnTour =
    masseurWorksInWeek(snap.masseurHired ?? false, frozen, bookedOff) && (snap.masseurTravels ?? false)
  const masseurSessions =
    masseurWorksInWeek(snap.masseurHired ?? false, frozen, bookedOff) && (!awayThisWeek || masseurOnTour)
      ? (snap.masseurSessionsPerWeek ?? 0)
      : 0
  // ⭐ ROUND 29 P15 – DOES SHE LEAVE FOR NEXT WEEK'S DRAW ON THIS WEEK'S SUNDAY? The fact only: how
  // many rounds next week's entered event runs for, and `weekGrid.ts` decides whether a draw that
  // long has to start travelling at the weekend (see `CalendarWeek.nextTripRounds`).
  //
  // ⚠ ENTERED, NOT MERELY LISTED. `upcoming` is the whole fixture list she can see; a Slam she is not
  // in is somebody else's fortnight and lends nothing. And it is `upcoming` rather than `arrival`
  // because `arrival` describes THIS week by construction, one week short of the question.
  const nextEntered = snap.upcoming.find((e) => e.week === week + 1 && e.entered)
  const nextTripRounds = nextEntered ? tripRoundsFor(nextEntered.tier) : null
  const base = {
    week,
    sessions,
    courtDays,
    planDays,
    surface,
    surfaceNote,
    masseurDays: masseurDaysFor(masseurSessions, planDays),
    // Null here and filled in on the ordinary-week branch alone - see the precedence note above.
    shoot: null as CalendarWeek['shoot'],
    // ⭐ ROUND 29 P13/P14/P15 – null here and filled in on the TRIP branch alone, for the same
    // reason: a week that is not a trip has no draw, no press room and no masseur on the road.
    trip: null as CalendarWeek['trip'],
    // ...and the loan is offered by default and withdrawn by the three branches whose week is not
    // hers to lend from (see the field's own note for the list and the argument).
    nextTripRounds,
    // Asked once, here, and carried on the week - see the field's note on CalendarWeek for why the
    // grid may not ask it itself. Summer travels the same way (R15-8).
    offSeason: isOffSeasonWeek(week),
    summer: isSummerWeek(week),
    // ⚠ THE DRAWN WEEK, NOT `snap.week`. A calendar showing the first week of September in the year
    // she leaves has one week of school and one without, and the grid has to draw the right one.
    schoolOver: snap.schoolEndsWeek !== undefined && week >= snap.schoolEndsWeek,
    animates: !snap.pending,
  }

  // 1. HER BODY. `layoffCoversWeek` is the engine's own arithmetic, not a third spelling of it.
  if (layoffCoversWeek(snap.week, snap.injury?.weeksRemaining, week)) {
    const back = layoffReturnWeek(snap)
    return {
      ...base,
      days: uniform('rehab', 'injury', 'Rehab'),
      // ⚠ P15: a girl in a cast is not drawn boarding a plane on the Sunday. The engine can still
      // list her as entered next week – a committed entry survives a layoff and resolves as a
      // walkover – so this is the one refusal that is about her body rather than about the week.
      nextTripRounds: null,
      title: 'On the bench',
      // The RETURN WEEK is the same arithmetic every other surface prints (weekLabel of
      // week + weeksRemaining), so the date can never differ from the Season screen's injury
      // plaque. The lead differs on purpose: a calendar has room to name what is wrong with her,
      // and a 6px chip has not.
      readout: back === null
        ? 'She is out – no training this week.'
        : `Out with the ${snap.injury?.kind ?? 'injury'} – back ${weekLabel(back)}.`,
      animates: base.animates,
    }
  }

  // 2. THE COMMITTED TRIP. `arrival` is the ENGINE's verdict for the week ahead, so this branch can
  //    never promise a tournament the engine has already decided is a walkover (the injured verdict
  //    is unreachable here - the layoff above has already claimed the week).
  const arrival = snap.arrival?.week === week ? snap.arrival : null
  if (arrival) {
    const event = snap.upcoming.find((e) => e.id === arrival.eventId)
    return {
      ...base,
      // ⚠ THE COURT IS THE TOURNAMENT'S, NOT THE BLOCK'S, ON A WEEK SHE IS PLAYING ONE - caught in the
      // browser at 375. `surfaceBlockFor` answers "what is this stretch of the season mostly made of",
      // which is the right question for a training week and the WRONG one here: the blocks are weighted
      // mixes on purpose (a stray clay event inside the hard swing is what keeps the calendar from being
      // a metronome), so the header read "Hard" beside a headline saying she was away at a Local Open on
      // CLAY. Nobody reads a surface mark on a tournament week as a fact about the season. It follows
      // that the fit verdict is the event's too, which is the more useful sentence anyway: "not her
      // surface" the week before she plays on it.
      ...(event
        ? { surface: event.surface, surfaceNote: surfaceStyleHint(snap.profile.playStyle, event.surface) }
        : {}),
      days: uniform('away', null, 'Away'),
      // ⭐⭐ ROUND 29 P15/P13/P14 – WHAT THIS TRIP IS. `arrival.tier` is the ENGINE's own verdict for
      // the week ahead, so the arc's length, its press room and the masseur's seat are all read off
      // the entry that was actually committed rather than off a card the player happened to look at.
      trip: {
        rounds: tripRoundsFor(arrival.tier),
        masseur: masseurOnTour,
        press: tierHoldsPress(arrival.tier),
        // ⭐⭐ ROUND 30 #2 – ...AND WHETHER A BRAND IS SHOOTING HER THROUGH IT. `shooting` is asked
        // once above every branch, off `adShoots`, so this is the same fact the ordinary-week branch
        // reads and there is no second spelling of it. See `TripFacts.shoot`.
        shoot: shooting,
      },
      // ⚠ P15: her own trip owns all seven of its days, so two big events back to back never fight
      // over one Sunday evening – this week's Sunday is either its own travel home or its last match.
      nextTripRounds: null,
      // ⚠⚠ P13 – AND THE WEEKLY RUNG'S TABLE IS NOT DRAWN ON A TRIP, because the engine does not
      // charge for it: `resolveMasseur` stands the weekly bill DOWN on the week he boards and
      // `masseurTourWeekCents` bills matches played x the session rate instead. Laying the rung's
      // 2 / 4 / 7 days over a week whose plan is not being spent is what put his table on the travel
      // day and the practice day and off every match of the week at the entry rung. The trip's own
      // sessions are on the match days, in `trip.masseur` above.
      masseurDays: [],
      title: 'Tournament week',
      readout: event
        ? `She is away at ${event.label} – the draw owns the week.`
        : 'She is away at a tournament – the draw owns the week.',
      // The tournament flow owns this week end to end. Crossing out days she is going to spend in a
      // draw would be the screen narrating a week it does not run.
      animates: false,
    }
  }

  // 3. THE BOOKINGS the player made on the Season screen.
  const vacation = snap.vacations.find((v) => v.week === week)
  if (vacation) {
    const pkg = vacationPackage(vacation.packageId)
    const label = pkg?.label ?? vacation.packageId
    return {
      ...base,
      days: uniform('off', null, 'Away'),
      // ⚠ P15: the family is somewhere else and the week says «no tennis at all» out loud. It has no
      // Sunday evening to lend, and the engine agrees – a booked week refuses entries.
      nextTripRounds: null,
      title: 'Family week',
      // ⚠ THE READOUT SAYS WHAT THIS PARTICULAR WEEK IS NOW. It used to be one sentence for all six
      // packages, which is the half of the owner's complaint the grid does not cover: «куда бы ни
      // поехала и расписание одинаковое, и week recap». The package's own blurb is already written,
      // already in the catalogue and already what the picker showed him when he chose it - so the
      // week reads back the promise he bought instead of a generic line under six different grids.
      readout: pkg?.blurb ? `${label} – ${pkg.blurb.charAt(0).toLowerCase()}${pkg.blurb.slice(1)}` : `${label} – no tennis at all this week.`,
      vacationId: vacation.packageId,
    }
  }

  // 4. THE CALENDAR'S OWN BLACKOUTS. Neither is hers to plan, and both are the reason a week she
  //    expected to train in has nothing on it.
  if (isOffSeasonWeek(week)) {
    return {
      ...base,
      days: uniform('off', null, 'Off'),
      // ⚠ P15: the tour is shut, so there is nothing next week to leave for.
      nextTripRounds: null,
      title: 'Off-season',
      // ⚠ AND SHE IS NOT AT HOME DOING NOTHING - see PRE_SEASON_ARC in weekGrid.ts. The tour is
      // shut, so there is nothing to play; the coach is still billed and her skills still move,
      // because this is the block where next year is built. The read-out used to say she was off
      // court, which contradicted her own bank statement.
      readout: 'The tour is closed – this is the block where next year gets built.',
    }
  }
  if (isExamWeek(week, base.schoolOver)) {
    return {
      ...base,
      days: uniform('school', null, 'Exams'),
      title: 'Exams',
      // ⚠ IT USED TO SAY «School owns this week – nothing is hers to plan.» AND THE PICTURE NOW
      // CONTRADICTS IT. The calendar draws the exam fortnight as a grid of hours since 31.07, and the
      // owner's own reading of that week is that the daily school block breaks up into papers WHILE
      // the training stands: «расходы на тренера, спарринги и физио всё еще при нас». The engine
      // agrees and always did - `isExamWeek` gates tournaments and bookings (world.ts) and touches
      // nothing about training - so "nothing is hers to plan" was only ever true of the ENTRY list,
      // and the sentence read as though she spent the week at a desk. This says which is which.
      readout:
        sessions === 0
          ? 'Exams this week – no tournaments, and no sessions booked either.'
          : `Exams this week – no tournaments, but her ${sessions} sessions stand.`,
    }
  }

  // 5. AN ORDINARY TRAINING WEEK: the plan, read back as days.
  const practice = snap.practices.find((p) => p.week === week)
  const matchIndex = practice
    ? (planDays.flatMap((role, d) => (role === 'court' ? [d] : [])).at(-1) ?? null)
    : null
  // A KNOCK THE DECISION GOVERNS.
  //
  // ⚠ `knockGoverns`, NEVER `knockLive`, AND THE ENGINE HAS ALREADY PAID FOR THIS ONE. `knockLive` is
  // true on the knock's ARRIVAL week too (`week <= untilWeek`, and `untilWeek >= sinceWeek`), which is
  // harmless for the two injury knobs by accident of the tick's ordering and NOT harmless for anything
  // that DESCRIBES a week: W6 found the week's story drawing her at home under «A week off the ankle»
  // about a week she had spent on court, because the predicate said yes the moment he answered. A
  // calendar is nothing BUT a description of weeks, so it takes the predicate that was written for
  // descriptions. `rest` writes the week off the training court; `push` leaves the sessions standing
  // and is the week the coach is watching.
  const knock = knockGoverns(snap.knock, week) ? snap.knock : null
  const resting = knock?.choice === 'rest'
  const knockIndex = knock ? (session[0] ?? 0) : null
  // ⭐ ROUND 28 #6 – THE SHOOT'S OWN DAYS, on the one branch where the week is hers to combine. See
  // `shootDaysFor` for why they are the plan's FREE days and nothing else.
  const shootDays = shooting ? shootDaysFor(planDays, matchIndex) : []

  const days: CalendarDay[] = DAY_SHORT.map((short, index) => {
    const role = resting ? 'rest' : planDays[index]
    // ⚠ THE BOOKED FRIENDLY OUTRANKS THE SHOOT AND THE SHOOT OUTRANKS THE PLAN'S OWN REST. A match
    // has a date and an opponent; a rest day is the thing the shoot week is charged for taking.
    const kind: DayKind = index === matchIndex ? 'match' : shootDays.includes(index) ? 'shoot' : role
    const beat: DayBeat | null =
      index === matchIndex ? 'match' : knock !== null && index === knockIndex ? 'knock' : null
    return {
      index,
      short,
      kind,
      beat,
      // Only the days that are NOT the week's default say anything: the mark carries "court" and
      // "rest", and five cells all labelled "Court" is the noise a grid is supposed to remove.
      note: kind === 'match' ? 'Match' : kind === 'shoot' ? 'Shoot' : kind === 'gym' ? 'Gym' : null,
    }
  })

  return {
    ...base,
    days,
    shoot: shootDeal ? { brand: shootDeal.brand, days: shootDays } : null,
    // ⚠ THE HOLIDAYS ARE A DIFFERENT WEEK NOW, AND THE TITLE SAYS SO (W3-SUMMER). The engine develops
    // and fatigues a summer training week differently - two sessions a day, no school - so a week
    // labelled "Training week" while the sim is running a block would be the screen under-reporting a
    // real decision the player is living with. A knock she is resting outranks it, because that is
    // what the week actually is.
    // ⚠ 'Summer block' NAMES A WINDOW SHE NO LONGER HAS (W4-SCHOOL). Past her last school year the
    // holidays are not a block – every week is school-free and the engine prices them all the same –
    // so calling one week of July special would be the screen inventing a distinction the sim does
    // not make. She is a professional; her weeks are training weeks.
    // ⭐⭐ ROUND 28 #6 – AND THE SHOOT OUTRANKS BOTH OF THEM, because the owner asked for the word by
    // name: the button into this week says «Shooting week» (composables/weekAhead.ts) and the week's
    // own eyebrow has to be the same word, or the press and the page it lands on are about two
    // different weeks. A shoot is also the more specific fact: July is a season, a shoot is a date in
    // a signed letter.
    title: shooting
      ? 'Shooting week'
      : base.summer && !base.schoolOver && !resting
        ? 'Summer block'
        : 'Training week',
    readout: trainingReadout({
      sessions,
      courtDays,
      gymDays: planDays.filter((role) => role === 'gym').length,
      trainingDays: session.length,
      doubled: laid.filter((day) => day.length >= DAY_CAPACITY_FREE).length,
      canDouble: capacity >= DAY_CAPACITY_FREE,
      resting,
      knockPart: knock?.part ?? null,
      matchIndex,
      shootBrand: shootDeal?.brand ?? null,
      shootDays,
      masseurSessions: base.masseurDays.length,
    }),
  }
}

/** The one sentence under the grid. It IS the legend – rather than a row of glyphs and their names,
 *  the week says what it is in the parent's language, which is the register every other surface in
 *  this app uses for a week (`diary.weekNote`, the coach's plaque, the planner's confirms). */
function trainingReadout(x: {
  sessions: number
  courtDays: number
  gymDays: number
  /** DAYS she trains on – `sessions` when nothing is doubled, and fewer when something is. */
  trainingDays: number
  /** days carrying two sessions. What `summerBlock.loadFactor` is now the price OF. */
  doubled: number
  /** may a day of THIS week hold two at all? `Snapshot.planDayCapacity`, read as a yes/no. */
  canDouble: boolean
  resting: boolean
  knockPart: string | null
  matchIndex: number | null
  /** ⭐ ROUND 28 #6 – whose shoot this week carries, or null when it carries none. */
  shootBrand: string | null
  /** ...and which days it took. Empty on every week that is not a shoot week. */
  shootDays: readonly number[]
  /** ⭐ ROUND 28 #1 – how many massage sessions the week draws, 0 when nobody is working it. */
  masseurSessions: number
}): string {
  // ⚠ THE TWO NEW CLAUSES ARE SUFFIXES, NEVER REPLACEMENTS. The sentence under the grid IS the
  // legend, and the plan is the thing it legends; a shoot that ATE the sentence would tell the
  // parent less about the week than the week before it, which is the opposite of what the owner
  // asked for («комбинации ... тренировочных дней и слоты фотосессии»).
  const shoot =
    x.shootBrand === null || x.shootDays.length === 0
      ? ''
      : x.shootDays.length === 1
        ? ` ${x.shootBrand} shoot on ${DAY_LONG[x.shootDays[0]]}.`
        : ` ${x.shootBrand} shoot takes ${x.shootDays.length} of her free days.`
  // ⭐ ROUND 28 #1 – what the rung actually bought, in the week it bought it for. `masseurSessions`
  // is the drawn count and not the dial, so a week he does not work says nothing rather than
  // promising sessions the ledger will not bill.
  const table =
    x.masseurSessions === 0
      ? ''
      : ` Masseur in ${x.masseurSessions} ${x.masseurSessions === 1 ? 'day' : 'days'} of the week.`
  if (x.resting) {
    // ⚠ A BOOKED FRIENDLY IS NOT CANCELLED BY A RESTED KNOCK - only `rollInjury` cancels bookings - so
    // when the two land on one week the sentence names the tension instead of hiding it behind a
    // "she is resting" the Saturday mark would immediately contradict.
    const match = x.matchIndex === null ? '' : ` The booked match on ${DAY_LONG[x.matchIndex]} still stands.`
    return `Resting the ${x.knockPart ?? 'knock'} – off the training court all week.${match}${shoot}${table}`
  }
  // ⚠ THE TWO-A-DAY SENTENCE NOW FOLLOWS WHAT HE BUILT, NOT WHAT MONTH IT IS (v47, spec §3). It used
  // to fire on `summer`/`schoolOver` alone: «N days on, two sessions a day – no school, so the work
  // doubles up», printed over a plan that could not express a doubled day at all. The engine stopped
  // paying for the calendar in this wave – `summerLoadFactor` follows `doublingShare` – so a sentence
  // that kept promising two-a-day on an undoubled week would be the screen billing him for a choice he
  // did not make, which is the exact double-count that change removed.
  //
  // The school-free week that is NOT doubled says so instead, because that is the invitation §3 is
  // about: the block is visible for the first time and he is the one who takes it.
  const plan =
    x.sessions === 0
      ? 'No sessions – a full week off court.'
      : x.doubled > 0
        ? `${x.sessions} sessions over ${x.trainingDays} days – ${x.doubled} of them two sessions a day.`
        : x.canDouble
          ? `${x.sessions} sessions, one a day – no school, so there is room to double up.`
          : x.gymDays === 0
            ? `${x.sessions} sessions, all of them on court.`
            : `${x.sessions} sessions – ${x.courtDays} on court, ${x.gymDays} in the gym.`
  const match = x.matchIndex === null ? '' : ` Practice match on ${DAY_LONG[x.matchIndex]}.`
  const knock = x.knockPart === null ? '' : ` She is training on a sore ${x.knockPart}.`
  return `${plan}${match}${knock}${shoot}${table}`
}

// =================================================================================================
// THE LOOK-AHEAD, AND THE ITEM THE OWNER CALLED THE MOST VALUABLE ONE
// =================================================================================================
//
// «markers for upcoming suitable tournaments ... TAPPING A TOURNAMENT MARKER shows just THAT event's
// card – not the whole Season feed – with enter-or-close.» That is not decoration and it is not a
// second Season screen: the Season feed is twenty cards deep by design (it is the planner), and a
// tournament she can actually enter, four weeks out, is one row in it. Entering from a marker is one
// tap on the thing itself.
//
// ⚠ "SUITABLE" IS A NARROW WORD HERE, ON PURPOSE. A marker appears iff she is IN the event already, or
// she may enter it right now - the engine's own `eligible` verdict, with the entry list still open.
// Everything else the Season feed keeps and this screen deliberately does not:
//   * a LOCKED-AHEAD event ("Reach N pts") is aspirational, and the Season spec keeps it visible for
//     that reason - but a marker you cannot act on is exactly the "twenty others" problem, one row
//     smaller;
//   * an event whose list has CLOSED cannot be entered, so the marker would open a card with nothing
//     on it but a Close;
//   * an OUTGROWN one is already filtered off the calendar entirely (season-planner.md §1).
// The consequence is stated on the screen rather than hidden: a week whose only tournament is one she
// cannot enter reads as the training week it IS for her - which is the same reading SeasonScreen's
// own `plannable` rule takes ("empty means empty FOR HER").
//
// WHY THE ROWS ARE BANDS AND NOT SEVEN CELLS: the sim has no day resolution, so a future week's
// tournament, exam block or family week is a fact about the WEEK. A row of seven day cells for a week
// with nothing to put in them would be the grid pretending to know more than the engine does.

/** Weeks of look-ahead under the grid. The grid is the week ahead, so 1 + 7 is exactly the 8-week
 *  horizon `toSnapshot` fills `upcoming` over (`UPCOMING_WEEKS`) and the same span the Season screen
 *  and the tier ladder read. Asking for more would draw empty rows: the engine has not generated
 *  events past it. */
export const LOOK_AHEAD_WEEKS = 7

/** What a look-ahead row is. `kind` is the band's identity; `event` is non-null exactly when the row
 *  is tappable. */
export interface LookAheadRow {
  week: number
  /** the shared formatter's short label */
  label: string
  /** the week's real days, already formatted (never re-derived in a template) */
  dates: string
  kind: 'event' | 'vacation' | 'practice' | 'college' | 'shoot' | 'exam' | 'off-season' | 'training'
  /** the suitable tournament on this week – the marker's card – or null */
  event: UpcomingEvent | null
  /** the layoff covers this week: the red chip, so "why can I plan nothing" is answerable at a glance */
  injured: boolean
  /** what the band says, in three or four words */
  note: string
}

/** Is this event one a marker may carry? See the note above for why the word is this narrow.
 *
 *  ⚠⚠ THE BODY MOVED TO `engine/world/multiWeek.ts` AS `eventIsHers` (round 26 #1) AND THIS IS THE
 *  HISTORICAL NAME RE-EXPORTED – the same move `TIER_SHORT` and `layoffCoversWeek` made, for the
 *  same reason. The four-week span pill's «is there anything in the next five weeks» gate has to be
 *  THIS question and not a second spelling of it, or the markers under the grid and the control
 *  above the tab bar would disagree about what an empty stretch is. Every existing import path,
 *  including `tests/calendar-screen.test.ts`'s pins, is untouched. */
export const isSuitable: (e: UpcomingEvent, currentWeek: number) => boolean = eventIsHers

/** The rows under the grid: weeks `week + 2` … `week + 1 + LOOK_AHEAD_WEEKS`. Precedence mirrors
 *  `calendarWeekFor`'s, minus the arms a future week cannot be in (there is no `arrival` past the
 *  week ahead, and a layoff is a CHIP on a row rather than the row's identity - the week still has a
 *  booking or a tournament on it, and cancelling the layoff's weeks is not a thing anyone can do). */
export function lookAheadFor(snap: CalendarWeekFacts): LookAheadRow[] {
  const rows: LookAheadRow[] = []
  // round-21 #5: `activeLadder` rides along so the look-ahead markers and the Season rows show the
  // same set - a marker for a rung the feed refuses to offer would be the two surfaces disagreeing.
  const feed = feedContext({
    ageYears: snap.ageYears ?? 0,
    tierOpen: snap.tierOpen,
    activeLadder: snap.activeLadder,
    upcoming: snap.upcoming,
  })
  const first = snap.week + 2
  for (let w = first; w < first + LOOK_AHEAD_WEEKS; w++) {
    const vacation = snap.vacations.find((v) => v.week === w)
    const practice = snap.practices.find((p) => p.week === w)
    // W2-WINDOW (act2-pro-tour.md §11): the SLIDING WINDOW decides what a marker may carry (entered
    // events always survive - isSuitable's first arm and feedShows' own), and a week that stacks several
    // suitable events markers the PREFERRED one - entered first, then the highest visible rung -
    // through the same pick the Season rows use, instead of whichever the list happened to put
    // first. `feed` is derived once above the loop, so all the rows read one verdict.
    const event = preferredWeekEvent(
      snap.upcoming.filter((e) => e.week === w && isSuitable(e, snap.week) && feedShows(e, feed)),
    )
    const exam = isExamWeek(w, snap.schoolEndsWeek !== undefined && w >= snap.schoolEndsWeek)
    const offSeason = isOffSeasonWeek(w)
    // ⭐ ROUND 24 #5 – THE DEPARTURE IS A WEEK IDENTITY, marked the way the other identities are.
    // It sits BELOW an enterable event on purpose: an event playing on the departure week genuinely
    // plays (the engine departs in the same deferred block the reveal closes from), so the tappable
    // marker is still true. It outranks the decor bands – a week she leaves for college is not a
    // training week, whatever else the season says about it.
    const college = snap.collegeDepartsWeek != null && w === snap.collegeDepartsWeek
    // ⭐ AD STEP 2 (§4a) – A SHOOT WEEK IS MARKED, NOT BLOCKED. The letter named these weeks at the
    // signature and the player plans the season around them, so they read like the other
    // already-decided identities. It sits BELOW an event and the bookings on purpose – the owner's
    // whole design is that the week stays hers: a tournament or a family week on a shoot week
    // genuinely happens (she simply recovers worse), so the tappable/booked marker stays true and
    // the shoot never pretends to own the week. Below `college` too: leaving for four years
    // outranks one working day.
    const shootRow = snap.adShoots?.find((d) => d.weeks.includes(w))
    const shoot = shootRow !== undefined
    const kind: LookAheadRow['kind'] = vacation
      ? 'vacation'
      : practice
        ? 'practice'
        : event
          ? 'event'
          : college
            ? 'college'
            : shoot
              ? 'shoot'
              : exam
                ? 'exam'
                : offSeason
                  ? 'off-season'
                  : 'training'
    const note = vacation
      ? (vacationPackage(vacation.packageId)?.label ?? vacation.packageId)
      : practice
        ? `Practice match${practice.withCoach ? ' + coach' : ''}`
        : event
          ? event.label
          : college
            ? 'Leaves for college'
            : shoot
              ? `${shootRow!.brand} shoot`
              : exam
                ? 'Exams'
                : offSeason
                  ? 'Off-season'
                  : 'Training week'
    rows.push({
      week: w,
      label: weekLabel(w),
      dates: weekSpan(w),
      kind,
      event,
      injured: layoffCoversWeek(snap.week, snap.injury?.weeksRemaining, w),
      note,
    })
  }
  return rows
}

/** The week the Calendar screen is about: the one the main button plays.
 *
 *  ⚠ IT IS `week + 1`, NEVER TODAY, and it has to be the same week `useWeekAhead` describes or the
 *  grid and the button on the same screen would be about different weeks. `advance(1)` runs
 *  `tickWeek`, which increments `world.week` FIRST and only then resolves, so the week a press plays
 *  is always the next one (the note at the top of composables/weekAhead.ts spells this out). */
export function useCalendarWeek(): ComputedRef<CalendarWeek | null> {
  const game = useGameStore()
  return computed(() => {
    const snap = game.snapshot
    return snap ? calendarWeekFor(snap, snap.week + 1) : null
  })
}

/** The look-ahead rows, off the live snapshot. */
export function useLookAhead(): ComputedRef<LookAheadRow[]> {
  const game = useGameStore()
  return computed(() => (game.snapshot ? lookAheadFor(game.snapshot) : []))
}
