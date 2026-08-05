// THE WEEK, LAID OUT IN DAYS – what the Calendar screen draws, and the rule behind it.
//
// The owner, on training weeks: today one is "skip, or match + skip", 1-2 clicks and the end-of-week
// screen, which feels thin next to a tournament trip. He asked for the day layout from her training
// plan (4/5/6 sessions a week) shown across the days, with matches marked.
//
// ⚠ THIS IS A READABLE CONSEQUENCE, NOT SEVEN DROPDOWNS, and that is a settled decision rather than a
// scope call. docs/specs/coach-as-load-manager.md risk (b): "Weekly load sliders are exactly the chore
// the story screen was designed to avoid. It has to be a few decisions with consequences, in the shape
// the knock already proved." So NOTHING here is editable. Every day below is derived from state the
// player has already set somewhere else - the plan preset on the This-week screen, the bookings on the
// Season screen, her play style from onboarding - and the screen's whole job is to say what those
// choices MEAN for the seven days she is about to live. It shows what the week went on. It is not a
// form, and a per-day editor is not a later refinement of this file, it is the thing this file exists
// instead of.
//
// -------------------------------------------------------------------------------------------------
// WHERE EVERY NUMBER COMES FROM, because a calendar that invents facts is worse than no calendar
// -------------------------------------------------------------------------------------------------
//
// HOW MANY SESSIONS: `plan.train` per cent OF SEVEN DAYS, rounded. It is not a lookup table, and that
// matters - `train` already MEANS "the share of the week she is on court" (protocol.ts WeekPlan: train
// + rest === 100), so the day count is that sentence read literally. The three presets fall out of it
// exactly as the owner named them, with nothing to keep in sync:
//
//     light   60/40  ->  60% of 7 = 4.2  ->  4 sessions
//     balanced 75/25 ->  75% of 7 = 5.25 ->  5 sessions
//     grind   85/15  ->  85% of 7 = 5.95 ->  6 sessions
//
// A fourth preset, or a plan that stops being a preset at all, needs no edit here.
//
// WHICH DAYS: rest is claimed in a FIXED priority - Sunday first, then midweek, then Friday - so no
// two rest days are ever adjacent at any of the three plans and the week always opens on court. This
// is a display convention and it is written down as one; the engine resolves whole WEEKS and knows
// nothing of days (there is no day resolution anywhere in the sim), so the alternative to a stated
// convention is not a truer layout, it is no layout.
//
// THE ONE GYM DAY: everything above the four sessions the lightest plan buys goes on court, and one
// session a week is fitness whatever the plan. So the plan reads as court time - 3 / 4 / 5 court days
// against a constant gym day - which is the legible consequence the owner is paying for. Tuesday gets
// it at all three plans (see GYM_PRIORITY), so the shape of her week does not shuffle when he moves a
// preset.
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
  dominantSurface,
  isExamWeek,
  isOffSeasonWeek,
  isSummerWeek,
  surfaceBlockFor,
} from '../engine/season/calendar'
import { layoffCoversWeek } from '../engine/world'
import { knockGoverns } from '../engine/knock'
import { surfaceStyleHint } from '../engine/match/style'
import { vacationPackage } from '../engine/economy'
// W2-LADDER §4: the two-type feed and the stacked-week pick - the SAME two rules the Season screen
// reads, so the look-ahead markers and the season rows cannot disagree about which events exist.
import { feedContext, feedShows, preferredWeekEvent } from './tierState'
import { weekLabel, weekSpan } from '../shared/dates'
import type { Surface } from '../engine/match/types'
import type { Snapshot, UpcomingEvent } from '../shared/protocol'

/** The grid's column heads, Monday first – the same Monday..Sunday span `shared/dates.ts` builds
 *  every date range from, so the columns and the printed dates cannot disagree about which day is
 *  which. */
export const DAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
/** ...and their long names, for the one sentence that has room to say a day out loud. */
export const DAY_LONG = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

const DAYS = DAY_SHORT.length

/** Rest days are claimed in THIS order: Sunday (the week's day off), then Wednesday (the midweek
 *  breather), then Friday. At 6 / 5 / 4 sessions that gives one, two and three rest days and never
 *  two of them side by side - the shape a junior's week actually has. The tail exists only so the
 *  function is total for a plan nobody has set yet. */
const REST_PRIORITY: readonly number[] = [6, 2, 4, 1, 5, 3, 0]
/** The fitness day is claimed in THIS order among the days that are already sessions, which lands it
 *  on Tuesday at all three presets. Deliberately stable: a player moving grind -> light should see
 *  court days disappear, not his whole week re-shuffle. */
const GYM_PRIORITY: readonly number[] = [1, 3, 5, 0, 2, 4, 6]

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
  /** sessions the plan buys (court + gym), 0..7 */
  sessions: number
  courtDays: number
  /** the gym day's index, or null when the plan buys too little for one */
  gymIndex: number | null
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
  /** Should the days cross themselves out when the week is played? False when another surface owns
   *  the week: a tournament trip has its own flow and its own screens, and a week whose reveal is
   *  already paused is not a week anybody is about to watch pass. */
  animates: boolean
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
  // W4-SCHOOL: the week her school years end, so this file can answer the question for ANY week it
  // is asked about rather than only for `snap.week`. Optional for the same reason `ageYears` is –
  // hand-built fixtures pre-date it – and a fixture that omits it gets a schoolgirl, which is what
  // every one of them was written about.
  Partial<Pick<Snapshot, 'schoolEndsWeek'>>

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

/** How many sessions `plan.train` buys, as a share of the seven days. Total and monotone: a higher
 *  train percentage can never buy fewer sessions. */
export function sessionsForPlan(trainPct: number): number {
  const raw = Math.round((trainPct / 100) * DAYS)
  return Math.max(0, Math.min(DAYS, raw))
}

/** Which day indexes are sessions, by REST_PRIORITY. Ascending, Monday first. */
export function sessionDays(sessions: number): number[] {
  const resting = new Set(REST_PRIORITY.slice(0, Math.max(0, DAYS - Math.max(0, Math.min(DAYS, sessions)))))
  const out: number[] = []
  for (let d = 0; d < DAYS; d++) if (!resting.has(d)) out.push(d)
  return out
}

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
 *  the committed trip, then the bookings, then the calendar's own blackouts. */
export function calendarWeekFor(snap: CalendarWeekFacts, week: number): CalendarWeek {
  const block = surfaceBlockFor(week)
  const surface = dominantSurface(block)
  const surfaceNote = surfaceStyleHint(snap.profile.playStyle, surface)
  const sessions = sessionsForPlan(snap.plan.train)
  const gymIndex = gymDayIndex(sessions)
  const session = sessionDays(sessions)
  const courtDays = session.filter((d) => d !== gymIndex).length
  const base = {
    week,
    sessions,
    courtDays,
    gymIndex,
    surface,
    surfaceNote,
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
  const matchIndex = practice ? (session.filter((d) => d !== gymIndex).at(-1) ?? null) : null
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

  const days: CalendarDay[] = DAY_SHORT.map((short, index) => {
    const isSession = session.includes(index) && !resting
    const kind: DayKind = index === matchIndex ? 'match' : !isSession ? 'rest' : index === gymIndex ? 'gym' : 'court'
    const beat: DayBeat | null =
      index === matchIndex ? 'match' : knock !== null && index === knockIndex ? 'knock' : null
    return {
      index,
      short,
      kind,
      beat,
      // Only the days that are NOT the week's default say anything: the mark carries "court" and
      // "rest", and five cells all labelled "Court" is the noise a grid is supposed to remove.
      note: kind === 'match' ? 'Match' : kind === 'gym' ? 'Gym' : null,
    }
  })

  return {
    ...base,
    days,
    // ⚠ THE HOLIDAYS ARE A DIFFERENT WEEK NOW, AND THE TITLE SAYS SO (W3-SUMMER). The engine develops
    // and fatigues a summer training week differently - two sessions a day, no school - so a week
    // labelled "Training week" while the sim is running a block would be the screen under-reporting a
    // real decision the player is living with. A knock she is resting outranks it, because that is
    // what the week actually is.
    // ⚠ 'Summer block' NAMES A WINDOW SHE NO LONGER HAS (W4-SCHOOL). Past her last school year the
    // holidays are not a block – every week is school-free and the engine prices them all the same –
    // so calling one week of July special would be the screen inventing a distinction the sim does
    // not make. She is a professional; her weeks are training weeks.
    title: base.summer && !base.schoolOver && !resting ? 'Summer block' : 'Training week',
    readout: trainingReadout({
      sessions,
      courtDays,
      gymIndex,
      resting,
      knockPart: knock?.part ?? null,
      matchIndex,
      summer: base.summer,
      schoolOver: base.schoolOver,
    }),
  }
}

/** The one sentence under the grid. It IS the legend – rather than a row of glyphs and their names,
 *  the week says what it is in the parent's language, which is the register every other surface in
 *  this app uses for a week (`diary.weekNote`, the coach's plaque, the planner's confirms). */
function trainingReadout(x: {
  sessions: number
  courtDays: number
  gymIndex: number | null
  resting: boolean
  knockPart: string | null
  matchIndex: number | null
  /** W3-SUMMER: the holidays, in which the ENGINE runs two sessions a day. See the note below. */
  summer?: boolean
  /** W4-SCHOOL: ...and past her last school year, EVERY week is one of those. Same engine rule
   *  (`summerLoadFactor`), so the same sentence – minus the clause about school, which is over. */
  schoolOver?: boolean
}): string {
  if (x.resting) {
    // ⚠ A BOOKED FRIENDLY IS NOT CANCELLED BY A RESTED KNOCK - only `rollInjury` cancels bookings - so
    // when the two land on one week the sentence names the tension instead of hiding it behind a
    // "she is resting" the Saturday mark would immediately contradict.
    const match = x.matchIndex === null ? '' : ` The booked match on ${DAY_LONG[x.matchIndex]} still stands.`
    return `Resting the ${x.knockPart ?? 'knock'} – off the training court all week.${match}`
  }
  // ⚠ THE SUMMER SENTENCE IS THE ENGINE'S, NOT A FLOURISH (W3-SUMMER). Every other clause here reads
  // the plan back; this one reports a rule the sim runs - `summerBlockWeek` doubles the day's sessions
  // through `growWeek`'s loadFactor and charges the week 3 condition for it - and the owner's whole
  // point is that the block must be legible: «сделает прокачку эффективнее и более полной». A player
  // who cannot see it will book his family holiday straight through it without knowing what he traded.
  //
  // It replaces the session line rather than being appended to it, because the count IS different: the
  // plan's four or five sessions are being run twice a day.
  const plan =
    x.sessions === 0
      ? 'No sessions – a full week off court.'
      : x.schoolOver === true
        ? `${x.sessions} days on, two sessions a day – the mornings are hers now.`
        : x.summer === true
          ? `${x.sessions} days on, two sessions a day – no school, so the work doubles up.`
          : x.gymIndex === null
            ? `${x.sessions} sessions, all of them on court.`
            : `${x.sessions} sessions – ${x.courtDays} on court, 1 in the gym.`
  const match = x.matchIndex === null ? '' : ` Practice match on ${DAY_LONG[x.matchIndex]}.`
  const knock = x.knockPart === null ? '' : ` She is training on a sore ${x.knockPart}.`
  return `${plan}${match}${knock}`
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
  kind: 'event' | 'vacation' | 'practice' | 'exam' | 'off-season' | 'training'
  /** the suitable tournament on this week – the marker's card – or null */
  event: UpcomingEvent | null
  /** the layoff covers this week: the red chip, so "why can I plan nothing" is answerable at a glance */
  injured: boolean
  /** what the band says, in three or four words */
  note: string
}

/** Is this event one a marker may carry? See the note above for why the word is this narrow. */
export function isSuitable(e: UpcomingEvent, currentWeek: number): boolean {
  return e.entered || (e.eligible && currentWeek <= e.deadlineWeek)
}

/** The rows under the grid: weeks `week + 2` … `week + 1 + LOOK_AHEAD_WEEKS`. Precedence mirrors
 *  `calendarWeekFor`'s, minus the arms a future week cannot be in (there is no `arrival` past the
 *  week ahead, and a layoff is a CHIP on a row rather than the row's identity - the week still has a
 *  booking or a tournament on it, and cancelling the layoff's weeks is not a thing anyone can do). */
export function lookAheadFor(snap: CalendarWeekFacts): LookAheadRow[] {
  const rows: LookAheadRow[] = []
  const feed = feedContext({ ageYears: snap.ageYears ?? 0, tierOpen: snap.tierOpen, upcoming: snap.upcoming })
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
    const kind: LookAheadRow['kind'] = vacation
      ? 'vacation'
      : practice
        ? 'practice'
        : event
          ? 'event'
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
