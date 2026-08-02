// THE WEEK, LAID OUT IN HOURS – the blocks screen H draws inside its time x day grid.
//
// `composables/weekDays.ts` answers WHAT each of the seven days is (a court day, the gym day, the
// rest day, the booked match, and the four whole-week kinds: away, off, exams, rehab). This file
// answers what one of those days LOOKS LIKE across a morning and an afternoon. It is a layer on top
// of that file and it changes nothing in it.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THE ENGINE KEEPS NO TIME OF DAY, AND IT NEVER WILL. THIS IS VISUALISATION.
// -------------------------------------------------------------------------------------------------
// The owner, 30.07: «Времени суток у движка нет и не будет – полностью поддерживаю, это просто
// визуализация недели для тех, где нет отпусков, чемпионатов и поездок.»
//
// So not one hour, minute or session-time is added to the sim, the Snapshot or the save schema.
// Every number below is a DISPLAY CONVENTION, in the same class as `weekDays.ts`'s rest-day priority
// and for the same reason: the engine resolves whole WEEKS, so the alternative to a stated
// convention is not a truer layout, it is no layout at all. What the grid may never do is assert a
// fact the week does not contain - which is why the rule below draws exactly one tennis session on a
// day the plan bought one session, and why a family week draws no tennis at all.
//
// -------------------------------------------------------------------------------------------------
// ⚠ AND IT IS DRAWN ON EVERY WEEK – THE OWNER OVERRULED THE BOUNDARY THAT USED TO BE HERE (31.07)
// -------------------------------------------------------------------------------------------------
// The first version drew a grid ONLY for a week made of court / gym / rest / match, and every other
// week fell back to a plainer day strip. The trailing half of his 30.07 sentence was read as a
// scope line («...для тех, где нет отпусков, чемпионатов и поездок»). Asked directly whether the
// exam fortnight should draw hours, he answered:
//
//   «очень даже должна [рисоваться], никакой разницы. Просто содержание сетки будет другим. Расходы
//    на тренера, спарринги и физио всё еще при нас, просто ежедневная школа разбивается на ряд
//    экзаменов в разное время.»
//
// He is right, and the objection was inconsistent with this very file. The grid ALREADY runs on
// display conventions for the ordinary week - the rest-day priority, the gym on Tuesday, the
// Saturday match, school owning the middle of the day - all of them facts the engine does not keep.
// Refusing conventions only for the OTHER four weeks was not honesty, it was a boundary drawn where
// the argument happened to stop. So the four weeks below get their conventions written down in the
// same voice as the ordinary week's, and every one of them is stated rather than implied.
//
// THE FOUR, AND WHAT EACH ONE IS BUILT FROM:
//
//   `school` (the exam fortnight)  HER HOURS ARE STILL HERS. The daily 08-13 school block breaks up
//        into a handful of exams at scattered times - his own sentence - and the training the plan
//        bought still happens: the coach is billed that week (nothing in the engine gates training
//        on an exam week; `isExamWeek` only shuts tournaments and bookings), and this project
//        already settled that «на тренировку можно доехать». So an exam day keeps the plan's own
//        session block, in the plan's own hour. The week is the ordinary week with school swapped
//        for papers, which is exactly what he described.
//
//   `away` (the tournament trip)  THE TRIP, AS A SEQUENCE: travel out, a hit on court at the venue,
//        the tournament across the middle of the week, travel home. ⚠ NO ROUND IS EVER NAMED. The
//        week has not been played; "R1" then "R2" on two days would assert she survives the first,
//        which is the one thing a picture drawn BEFORE the draw resolves may not say. Every day of
//        the event carries the same block, and it says WHEN THE TOURNAMENT IS, not when she plays.
//
//   `off` (a booked family week, or the off-season)  NO TENNIS - the read-out under the grid says
//        so in as many words - AND THE WEEK IS NOT EMPTY. It is the family's week, so it is drawn
//        with the family's hours in it.
//
//   `rehab` (the layoff)  THE PLAN'S HOURS SURVIVE AND THEIR CONTENT CHANGES: physio and light work
//        instead of court time. The coach still works a layoff week - settled earlier, «они вполне
//        могут вместе восстанавливаться» - so the hours the plan bought are still drawn; what is in
//        them is not tennis.
//
// -------------------------------------------------------------------------------------------------
// WHAT A DAY IS MADE OF, AND WHERE EACH PIECE COMES FROM
// -------------------------------------------------------------------------------------------------
// THE TENNIS is the plan, read back: `weekDays.ts` has already decided which days are on court,
// which one is the gym and where a booked friendly lands, and this file draws that decision one
// block per day. It never adds a second session to a day - the sentence under the grid says "5
// sessions - 4 on court, 1 in the gym", and a grid showing six blocks of tennis would be the screen
// contradicting the screen.
//
// SCHOOL AND HOMEWORK are the BAND's furniture, not the engine's. She is fourteen; a weekday is
// mostly school and the tennis is what happens after it, and that shape is the whole point of
// drawing hours at all - it is what makes "4 sessions" look different from "6 sessions" to a parent.
// This is sanctioned by the owner's own instruction about the bands (see AgeBand): school hours
// dominate the day at fourteen, they shorten, and then they go.
//
// WHAT IS DELIBERATELY NOT HERE: a morning run, a second court session, a stretch - all of them
// plausible, none of them anything the engine models or the week's own read-out mentions. A calendar
// that invents facts is worse than no calendar (weekDays.ts's own header), and furniture that comes
// with a band - or with a week the engine has already named "a trip", "a holiday", "exams", "a
// layoff" - is not the same as furniture invented to fill a column.
//
// ⚠ AND IT IS A PURE MODULE, no Vue and no store, for the argument `weekDays.ts` already makes about
// itself: a rule with content in it - a table of shapes, a band, an arc for a week away - is a rule
// worth pinning on values, and a rule inside a template is decoration that cannot be tested. The
// screen composes; this file decides.
import type { CalendarDay, CalendarWeek, DayBeat, DayKind } from './weekDays'
// ...and the one VALUE this file takes from the day layout: which day indexes the plan bought. It is
// imported rather than re-derived on purpose - see `planRoles`.
import { sessionDays } from './weekDays'
import { hash32 } from './fridgeNote'

/** One coloured block in the grid. Hours are PRESENTATION – see the header. */
export interface DayBlock {
  /** hour the block starts, 24h, integer. The grid's rows run 07:00–19:00 (the mockup's span). */
  start: number
  /** length in hours, >= 1 */
  span: number
  /** which `event` colour family the block wears */
  kind: BlockKind
  /** the words in the block, e.g. "Tennis drills". Player copy: short dash, no Cyrillic, and ⚠ NO
   *  WORD LONGER THAN SIX CHARACTERS – see the note at COURT_SESSIONS, it is measured. */
  label: string
}

/** The design system's `event` palette, one member per kind of hour. Every one is on `:root`
 *  (src/style.css); the three that still have no caller are written down at `DAY_SHAPES` rather
 *  than left as a puzzle. */
export type BlockKind =
  | 'training' | 'trainingAlt' | 'gym' | 'school' | 'schoolLong'
  | 'drills' | 'match' | 'matchLong' | 'study' | 'travel' | 'rest'
  | 'tournament' | 'physio' | 'vacation'

/** The first and last hour the grid has room for, and the labelled rules between them. 07:00–19:00
 *  is the mockup's own span (docs/design/screenshots/H-calendar-week.webp); a block outside it would
 *  be drawn off the bottom of the card, which a test forbids rather than clamps. */
export const GRID_START_HOUR = 7
export const GRID_END_HOUR = 19
/** Every second hour carries a label and a hairline – the prototype's own 68px-per-two-hours rule. */
export const GRID_HOURS: readonly number[] = [7, 9, 11, 13, 15, 17, 19]

/** THE ORDINARY WEEK, as a set. These four are what a week made of her own training plan contains,
 *  and they are the kinds whose shape is a fact about the KIND rather than about the date: what she
 *  does on a court day is the same whether it is Monday or Thursday.
 *
 *  The other four (`weekDays.ts`'s `uniform()` weeks) are the opposite - a trip is a SEQUENCE, and
 *  an exam falls on the day it falls on - so they are shaped per day index, one function down. */
export const ORDINARY_KINDS = ['court', 'gym', 'rest', 'match'] as const
export type OrdinaryKind = (typeof ORDINARY_KINDS)[number]
/** The four a whole week is made of, every day the same kind. */
export type WeekKind = Exclude<DayKind, OrdinaryKind>

export function isOrdinaryKind(kind: DayKind): kind is OrdinaryKind {
  return (ORDINARY_KINDS as readonly DayKind[]).includes(kind)
}

// =================================================================================================
// ⚠ THE AGE BAND – the owner's architectural instruction, honoured in the first version
// =================================================================================================
//
// «Правило раскладки по времени пишется один раз и обосновывается – для начала точно да, но потом
//  надо будет этот момент как-то обыгрывать по-другому, когда она будет взрослеть, надо заложить в
//  архитектуру.» (30.07)
//
// So `band` is a PARAMETER of the layout function from the first commit rather than a constant that
// a later wave would have to thread through. Her week is supposed to change shape as she grows up:
// school hours dominate the day at fourteen, they shorten, and then they go, and the hours they held
// fill with something else - a second court session, physio, and, once she is on the adult tour, the
// travel that today is not part of an ordinary week at all.
//
// ADDING A BAND IS ADDING TWO ROWS - one to `BAND_FROM` (from what age) and one to `DAY_SHAPES`
// (what a day of each kind looks like in it). It is not a rewrite, and a HALF-added band fails the
// gate: tests/calendar-grid.test.ts pins that every band the table carries covers every day kind,
// and that every band `bandFor` can return has a row at all. The alternative - a missing row
// resolving to an empty column - is exactly the silent failure this codebase keeps writing tests
// against.

export type AgeBand = 'school' | 'senior-school' | 'full-time'

/** Where each band STARTS, in years. Only the first is populated, on purpose: `senior-school` and
 *  `full-time` exist in the type because the shape of the architecture is the instruction, and the
 *  CONTENT of those two weeks is a design decision nobody has taken yet. Inventing it now - guessing
 *  that a seventeen-year-old trains twice a day - would be the invention this file's header refuses.
 *  A career today opens at fourteen and the game does not run long enough to leave the first band. */
const BAND_FROM: readonly { from: number; band: AgeBand }[] = [{ from: 0, band: 'school' }]

/** Which band an age falls in. Reads `Snapshot.ageYears` at the call site, so the calendar can never
 *  disagree with the Kid screen about how old she is - it does not compute her age itself. */
export function bandFor(ageYears: number): AgeBand {
  let band: AgeBand = BAND_FROM[0].band
  for (const rung of BAND_FROM) if (ageYears >= rung.from) band = rung.band
  return band
}

/** THE LAYOUT TABLE. One row per band, one shape per ordinary day kind.
 *
 *  `Partial` on the OUTER record and total on the inner one is the type saying what the paragraph
 *  above says: a band may be absent, but a band that is present is complete.
 *
 *  ⚠ THREE OF THE FOURTEEN BLOCK KINDS HAVE NO CALLER, and each is waiting for something specific
 *  rather than being decoration:
 *    `trainingAlt`, `match`  the SECOND session of a day. At fourteen there is one, and drawing two
 *                            would contradict the sentence under the grid. They are what the hours
 *                            school gives back get filled with in the later bands.
 *    `schoolLong`            a day that is nothing but school. The design draws one (its Friday);
 *                            ours would have been the exam week, and the exam week turned out to be
 *                            the opposite of that - the owner's own reading is that the daily block
 *                            BREAKS UP, so an exam day has more air in it than an ordinary one.
 *  (`travel`, `tournament`, `physio` and `vacation` were on that list until 31.07. The four weeks
 *  the grid used to refuse are their callers - see WEEK_SHAPES.) */
const DAY_SHAPES: Partial<Record<AgeBand, Record<OrdinaryKind, readonly DayBlock[]>>> = {
  // FOURTEEN. School owns the middle of the day, the tennis is what happens after it, and the
  // evening has homework in it - which is why a training week at this age reads as a busy week even
  // on the light preset, and why the plan's 3 / 4 / 5 court days are legible as a shape.
  school: {
    // ONE session, because the plan bought one. Rust is the design's own colour for the recurring
    // afternoon block, and "Tennis drills" is what that hour is at fourteen.
    court: [
      { start: 8, span: 5, kind: 'school', label: 'School' },
      { start: 15, span: 2, kind: 'drills', label: 'Tennis drills' },
      { start: 18, span: 1, kind: 'study', label: 'Study' },
    ],
    // The week's one fitness session, in the same slot the court session takes - so switching a
    // preset moves BLOCKS rather than re-shaping her day (the same stability `GYM_PRIORITY` buys).
    gym: [
      { start: 8, span: 5, kind: 'school', label: 'School' },
      { start: 15, span: 2, kind: 'gym', label: 'Gym' },
      { start: 18, span: 1, kind: 'study', label: 'Study' },
    ],
    // The booked friendly. It lands on Saturday at every preset (weekDays.ts), which is why this is
    // the one shape with no school in it and why the match owns the middle of the day rather than an
    // hour after school. `matchLong` is the design's own three-hour "Practice Match Play".
    match: [
      { start: 10, span: 3, kind: 'matchLong', label: 'Match play' },
      { start: 18, span: 1, kind: 'study', label: 'Study' },
    ],
    // ⚠ A REST DAY GOES TO SCHOOL, and this shape used to omit it. The omission was defended like
    // this: "Sunday is always the first rest day claimed, so this shape is Sunday far more often
    // than anything else - and a school block here would put her in a classroom on a Sunday, which
    // is an assertion and a false one. On the midweek rest days the grid is quiet about school
    // instead of wrong about it."
    //
    // Half right, and the wrong half showed up on screen: at the balanced preset Wednesday is a rest
    // day, and the week drew her with no school on a Wednesday - which is exactly as false as the
    // Sunday it was avoiding, in the other direction. REST IS A REST FROM TENNIS. A fourteen-year-old
    // does not skip Wednesday because she is not training that afternoon; the plan buys her court
    // time, and school was never the plan's to give or take away.
    //
    // The Sunday problem is real and it was already solved one function down: `dropWeekendSchool`
    // knows the day INDEX, which this table cannot, and strips school from Saturday and Sunday
    // whatever shape produced it. So the honest arrangement is the one that was already half built -
    // the table asserts school on every weekday shape, the weekday rule removes it on the weekend,
    // and the rule that only ever REMOVES is what keeps the screen from inventing a day.
    rest: [
      { start: 8, span: 5, kind: 'school', label: 'School' },
      { start: 15, span: 3, kind: 'rest', label: 'Rest' },
      { start: 18, span: 1, kind: 'study', label: 'Study' },
    ],
  },
}

// =================================================================================================
// THE FOUR WEEKS THAT ARE NOT A MIX – away, off, exams, rehab
// =================================================================================================
//
// A day of one of these kinds cannot be shaped by its KIND alone, and that is the one structural
// difference from the table above. Two reasons, and they are different reasons:
//
//   THE DATE MATTERS. A trip is a sequence - you travel out before you come home - and an exam falls
//   on the day the school puts it. So these shapes take the day INDEX.
//
//   THE PLAN STILL EXISTS UNDERNEATH. On the exam week and the layoff week the family is still
//   paying for her hours, so the shape takes the ROLE the plan would have given the day (court, the
//   gym, or rest) and dresses it differently. That is the owner's own point about the exam week -
//   «расходы на тренера, спарринги и физио всё еще при нас» - and it is what keeps the picture and
//   the plan in step: an exam week draws exactly the sessions the plan bought, not one more.

/** What a day of a whole-week kind needs to know about itself. */
export interface DayContext {
  /** ⚠ IS THIS THE OFF-SEASON RATHER THAN A BOOKED FAMILY WEEK? Both arrive as `off` and the days
   *  alone cannot tell them apart, so the answer is handed in on `CalendarWeek` (see its own note).
   *  It belongs in the CONTEXT rather than in the composer because the two weeks need DIFFERENT
   *  SHAPES, and the composer may only ever remove a block - the rule that stops this screen
   *  inventing an hour. A fact the table needs to decide with goes to the table.
   *
   *  Optional and false by default: the off-season is six weeks of a fifty-two-week year, so every
   *  other caller would be writing `offSeason: false` as ceremony. The one caller that can tell -
   *  `weekGridFor` - always passes it, and a test that forgets it gets the common week, which is the
   *  safe direction. */
  offSeason?: boolean
  /** WHICH family package this week is, when it is one – `ECONOMY.vacation.packages`' own id. Optional
   *  and absent on every caller but the calendar, exactly like `offSeason` above.
   *
   *  ⚠ IT ARRIVES AS DATA, NOT AS A LOOKUP, and that is not a style choice: this module may not import
   *  from `../engine/` (a guard enforces it, and it caught me reaching for `isOffSeasonWeek` once
   *  already). The composer knows the booking and hands the id down, exactly as it hands `offSeason`
   *  down. An unknown id simply falls back to the generic family arc, so a new package in the
   *  catalogue degrades to today's behaviour rather than to an empty week. */
  vacationId?: string
  /** IS THIS WEEK IN THE SCHOOL SUMMER HOLIDAYS (R15-8)? Data, like the two above - `weekDays.ts`
   *  computes it (`isSummerWeek`) and it rides in on `CalendarWeek.summer`. Optional and false by
   *  default for the same reason `offSeason` is: a test that forgets it gets the term-time week,
   *  which is the safe direction. Only the ORDINARY day shapes read it - see `summerOrdinary`. */
  summer?: boolean
  /** 0 = Monday … 6 = Sunday */
  index: number
  /** what the PLAN made of this day – or would have, on a week it does not own. */
  role: OrdinaryKind
}

/** The context a caller that has none gets: Monday, and a rest day. Deliberately the QUIETEST day
 *  the tables can produce, so a caller that forgets to say which day it is asks for the least the
 *  grid can assert rather than the most. */
const ANY_DAY: DayContext = { index: 0, role: 'rest' }

/** A band's row of ordinary shapes – what the four functions below dress up. */
type BandShapes = Record<OrdinaryKind, readonly DayBlock[]>

/** ⚠ THE EXAM HOURS, and the scatter IS the content. «Ежедневная школа разбивается на ряд экзаменов
 *  в разное время»: one paper Monday morning, one after lunch on Tuesday, a long one on Wednesday,
 *  nothing on Thursday, one late Friday morning. Two days of the fortnight carrying no paper at all
 *  is what makes the week read as scattered rather than as school with a new label - and a Thursday
 *  with a free morning is the shape a parent recognises from an exam fortnight.
 *
 *  Every one of them ends by 15:00, which is not an accident: the plan's session sits at 15:00 in
 *  every ordinary shape, and an exam that ran into it would be the grid double-booking her. */
const EXAM_HOURS: readonly (readonly [start: number, span: number] | null)[] = [
  [9, 2], [13, 2], [9, 3], null, [11, 2], null, null,
]

/** THE EXAM FORTNIGHT. The ordinary day, with the 08–13 school block broken up into a paper - and
 *  the plan's own session left exactly where it was, because she still trains.
 *
 *  ⚠ A BOOKED FRIENDLY CANNOT REACH THIS WEEK, and the code says so instead of trusting it: the
 *  engine refuses to schedule one in an exam fortnight («School exams that week – no matches, no
 *  trips», engine/world.ts), so `planRoles` never produces a `match` here. It is handled anyway,
 *  because the alternative was silent and wrong - the match shape owns 10:00-13:00 and Monday's paper
 *  starts at 09:00, so an unreachable path drew two blocks on top of each other. The exams are the
 *  week's identity, so the paper wins and the day falls back to the court shape underneath it. */
function examDay(shapes: BandShapes, day: DayContext): readonly DayBlock[] {
  const paper = EXAM_HOURS[day.index]
  const role = day.role === 'match' ? 'court' : day.role
  // The daily block BREAKS UP: it is removed, and what replaces it is a paper or nothing at all.
  const rest = shapes[role].filter((b) => b.kind !== 'school' && b.kind !== 'schoolLong')
  if (!paper) return rest
  return [{ start: paper[0], span: paper[1], kind: 'school', label: 'Exam' }, ...rest]
}

/** ⚠ THE TRIP, AND NOT ONE ROUND IS NAMED. Travel out, a hit on court at the venue, the tournament
 *  across the middle of the week, travel home. Every day of the event carries the SAME block, and
 *  what it says is when the tournament is on - not that she is still in it. The week has not been
 *  played: a block reading "R2" on the Thursday would assert she came through Wednesday, which is
 *  the sim's call and not the calendar's.
 *
 *  The court hit is `training` rather than `drills` on purpose, and it is the one invariant that
 *  keeps this week from lying about the plan: `drills` MEANS "the session the plan bought", every
 *  week, everywhere. A trip does not spend the plan's sessions - the family is away - so the hour
 *  she spends on court at the venue is a different kind of hour and wears a different colour. */
const TRIP_ARC: readonly (readonly DayBlock[])[] = [
  [{ start: 9, span: 4, kind: 'travel', label: 'Travel out' }],
  [{ start: 10, span: 2, kind: 'training', label: 'Court hit' }],
  [{ start: 10, span: 4, kind: 'tournament', label: 'Draw day' }],
  [{ start: 10, span: 4, kind: 'tournament', label: 'Draw day' }],
  [{ start: 10, span: 4, kind: 'tournament', label: 'Draw day' }],
  [{ start: 10, span: 4, kind: 'tournament', label: 'Draw day' }],
  [{ start: 11, span: 4, kind: 'travel', label: 'Travel home' }],
]

/** THE FAMILY'S WEEK. Two weeks reach this shape - a booked package and the off-season - and the one
 *  thing they share is the one thing the read-out under the grid already says out loud: «no tennis
 *  at all this week». So there is no tennis in it, and no school either: both weeks are weeks the
 *  household has taken, one by booking it and one because the tour is shut at the turn of the year.
 *
 *  ⚠ AND IT IS NOT AN EMPTY COLUMN, which is the whole reason the owner wanted the grid drawn here:
 *  "no tennis" is a fact about her week, not an absence of one. The hours are the family's. */
// ⚠ AND SHE STILL HAS HOMEWORK ON A WEEKDAY (owner, 31.07): «когда я беру отпуск для восстановления
// бусинки на учебных неделях, мне кажется будет круто оставлять по паре часов на уроки на буднях,
// она всё-таки учится, и мы так же делали сами, когда школу пропускали».
//
// A booked family week in term time is not a week off school - it is a week of school missed, which
// every parent who has done it knows means the work comes with you. Two hours on a weekday morning
// is what that looks like, and it costs the day nothing: the family's own hours start at 10 or 11
// in every arm of this arc.
//
// ⚠ IT IS ASSERTED HERE AND REMOVED IN THE COMPOSER, which is the direction this file has kept since
// the school rule: the table decides a day's shape and the composer may only ever take a block away.
// So `Study` sits in all five weekday arms, and two rules downstream strip it - the weekend, and the
// OFF-SEASON, where there is no term to miss. Adding it in the composer would have been the shorter
// diff and the wrong one: it would make the composer able to invent an hour, which is the property
// that keeps this screen from drawing a day the engine never had.
const FAMILY_ARC: readonly (readonly DayBlock[])[] = [
  [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 3, kind: 'vacation', label: 'Family time' }],
  [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Day out' }],
  [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 14, span: 3, kind: 'vacation', label: 'Family time' }],
  [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Day out' }],
  [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 3, kind: 'vacation', label: 'Family time' }],
  [{ start: 10, span: 4, kind: 'vacation', label: 'Day out' }],
  [{ start: 11, span: 3, kind: 'rest', label: 'Home day' }],
]

// ⚠ THE OFF-SEASON IS THE TRAINING BLOCK, NOT A HOLIDAY, and the screen used to say the opposite of
// the ledger. The owner, 31.07: «в off-season weeks продолжают списываться тренерские расходы. Как
// там в реальности дела обстоят с этим?»
//
// In the real sport it is the hardest physical work of the year: the only stretch with no tournaments
// to recover for, which is exactly why the fitness base gets built then. A full-time coach is on a
// retainer and is working more, not less. Our engine already models it correctly - `coachWorksThisWeek`
// stands the coach down for a booked VACATION and for nothing else, and `growWeek` has no off-season
// branch, so her skills go on moving.
//
// The grid was the part that disagreed. `off` serves both weeks, so the off-season drew the family
// arc: a picture of a girl doing nothing, over a week that bills a coach and develops her. Not wrong
// about tennis - wrong about ITSELF, which is the class of defect this screen keeps finding.
//
// So the block gets its own shape: court and fitness, no tournaments to play and no school to attend
// (it is the holidays), and one clear day off at the end of the week because even a pre-season block
// has one. `training` and `trainingAlt` finally have a caller - they were reserved for exactly this.
const PRE_SEASON_ARC: readonly (readonly DayBlock[])[] = [
  [{ start: 9, span: 3, kind: 'training', label: 'Pre-season' }, { start: 15, span: 2, kind: 'gym', label: 'Gym' }],
  [{ start: 9, span: 3, kind: 'trainingAlt', label: 'Court work' }, { start: 15, span: 2, kind: 'gym', label: 'Cardio' }],
  [{ start: 9, span: 3, kind: 'training', label: 'Pre-season' }, { start: 15, span: 2, kind: 'gym', label: 'Gym' }],
  [{ start: 10, span: 3, kind: 'rest', label: 'Rest day' }],
  [{ start: 9, span: 3, kind: 'trainingAlt', label: 'Court work' }, { start: 15, span: 2, kind: 'gym', label: 'Gym' }],
  [{ start: 9, span: 3, kind: 'training', label: 'Pre-season' }, { start: 15, span: 2, kind: 'gym', label: 'Cardio' }],
  [{ start: 11, span: 3, kind: 'rest', label: 'Day off' }],
]

// ⚠ ONE ARC PER PACKAGE, AND THEY NARRATE THE LADDER THAT IS ALREADY IN THE MODEL.
//
// Owner, 31.07: «для каждого типа отпуска свое расписание недели... а то сейчас куда бы ни поехала и
// расписание одинаковое, и week recap, ну кроме картинки».
//
// He is right about the symptom and the fix has one hard rule: these must not be six flavours of
// nothing. `ECONOMY.vacation.packages` already differ by `conditionGain` – 18 / 22 / 26 / 32 / 40 /
// 48 (the W2-FATIGUE lift of 03.08; the ladder's SHAPE and order are untouched, the whole table
// simply moved up a band) – so the week HAS a real ladder in it and the player has never been able
// to see it. Each arc
// below is that number drawn: how much of the week is actually recovery, and what it costs to get
// there. A staycation is her own bed and her own life going on around her; the clinic at the top is
// treatment with a timetable. Invent a difference these numbers do not have and the grid becomes
// decoration that will drift the first time somebody re-tunes a package.
//
// TRAVEL IS PART OF THE PRICE. Grandma is "two trains and a bus" and camping is a road-trip, so both
// spend a day at each end getting there – which is exactly why their gain sits below the seaside's
// for a similar kind of rest. The staycation has no travel at all, and that is its whole pitch.
//
// ⚠ `Study` RIDES IN ALL FIVE WEEKDAY ARMS, as in FAMILY_ARC, for the reason that table states: the
// table asserts and the composer may only REMOVE. `dropOffSeasonStudy` and the weekend rule take it
// away where there is no term to miss. A travel day is the one exception - homework does not happen
// on a train with the bags - and that is an assertion about the day, not the composer editing it.
const VACATION_ARCS: Record<string, readonly (readonly DayBlock[])[]> = {
  // 12 – the cheapest and the least recovery, because nothing about her life pauses. Her own bed,
  // her own people, and the household carrying on around her.
  staycation: [
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 3, kind: 'rest', label: 'Home day' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 12, span: 4, kind: 'vacation', label: 'Her pals' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 3, kind: 'rest', label: 'Lie-in' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 12, span: 4, kind: 'vacation', label: 'Her pals' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Out all day' }],
    [{ start: 11, span: 4, kind: 'vacation', label: 'Her pals' }],
    [{ start: 11, span: 3, kind: 'rest', label: 'Home day' }],
  ],
  // 14 – two trains and a bus at each end, and slow days in the middle. The travel is the reason
  // this sits barely above a staycation despite being a week away.
  grandma: [
    [{ start: 8, span: 5, kind: 'travel', label: 'Two trains' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Slow day' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'The garden' }],
    [{ start: 10, span: 3, kind: 'rest', label: 'Long lunch' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Slow day' }],
    [{ start: 10, span: 4, kind: 'vacation', label: 'The river' }],
    [{ start: 9, span: 5, kind: 'travel', label: 'Long way home' }],
  ],
  // 16 – outdoors and on her feet all week. Genuinely restorative for a tennis player because none
  // of it is tennis, but a tent is not a hotel bed, and the road eats both ends.
  camping: [
    [{ start: 8, span: 5, kind: 'travel', label: 'Road-trip out' }],
    [{ start: 10, span: 5, kind: 'vacation', label: 'The lake' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Walk' }],
    [{ start: 10, span: 5, kind: 'vacation', label: 'The lake' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 4, kind: 'vacation', label: 'Camp day' }],
    [{ start: 10, span: 4, kind: 'vacation', label: 'Last swim' }],
    [{ start: 9, span: 5, kind: 'travel', label: 'Road-trip home' }],
  ],
  // 20 – the first package that is simply a holiday. She sleeps, and that is the point: no programme,
  // no drive, nothing to be on time for.
  seaside: [
    [{ start: 9, span: 4, kind: 'travel', label: 'Travel out' }],
    [{ start: 10, span: 2, kind: 'rest', label: 'Lie-in' }, { start: 12, span: 4, kind: 'vacation', label: 'The sea' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 5, kind: 'vacation', label: 'The sea' }],
    [{ start: 10, span: 2, kind: 'rest', label: 'Lie-in' }, { start: 12, span: 4, kind: 'vacation', label: 'The pool' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 5, kind: 'vacation', label: 'The sea' }],
    [{ start: 10, span: 5, kind: 'vacation', label: 'Last day' }],
    [{ start: 10, span: 4, kind: 'travel', label: 'Flight home' }],
  ],
  // 25 – rest WITH A PROGRAMME, which is the blurb's own phrase and the honest reason it gains more
  // than a beach: somebody is managing the recovery instead of hoping for it.
  resort: [
    [{ start: 9, span: 3, kind: 'travel', label: 'Travel out' }, { start: 15, span: 2, kind: 'physio', label: 'Check-up' }],
    [{ start: 9, span: 2, kind: 'physio', label: 'Physio' }, { start: 12, span: 3, kind: 'vacation', label: 'Pool' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 2, kind: 'physio', label: 'Rub-down' }, { start: 14, span: 3, kind: 'rest', label: 'Rest' }],
    [{ start: 9, span: 2, kind: 'physio', label: 'Physio' }, { start: 12, span: 3, kind: 'vacation', label: 'Pool' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 2, kind: 'physio', label: 'Rub-down' }, { start: 14, span: 3, kind: 'rest', label: 'Rest' }],
    [{ start: 10, span: 3, kind: 'physio', label: 'Last one' }, { start: 14, span: 2, kind: 'rest', label: 'Rest' }],
    [{ start: 10, span: 4, kind: 'travel', label: 'Home' }],
  ],
  // 30 – the clinic the pros use. Almost the whole week is treatment, on somebody else's timetable,
  // and the two loose hours read as the exception rather than the shape.
  elite: [
    [{ start: 9, span: 3, kind: 'travel', label: 'Travel out' }, { start: 14, span: 3, kind: 'physio', label: 'Tests' }],
    [{ start: 9, span: 3, kind: 'physio', label: 'Physio' }, { start: 14, span: 2, kind: 'gym', label: 'Moving' }],
    [{ start: 9, span: 3, kind: 'physio', label: 'Physio' }, { start: 14, span: 2, kind: 'rest', label: 'Rest' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 3, kind: 'physio', label: 'Physio' }, { start: 15, span: 2, kind: 'gym', label: 'Moving' }],
    [{ start: 9, span: 3, kind: 'physio', label: 'Physio' }, { start: 14, span: 2, kind: 'rest', label: 'Rest' }],
    [{ start: 9, span: 3, kind: 'physio', label: 'Final review' }, { start: 13, span: 3, kind: 'vacation', label: 'Free time' }],
    [{ start: 10, span: 4, kind: 'travel', label: 'Home' }],
  ],
}

/** Everything that is her SPORT, as opposed to school, homework, rest, a journey or the family's
 *  own hours. One list, used by the layoff rule below and by nothing else here – the tests keep
 *  their own copy on purpose, because a guard that imports the thing it is guarding checks nothing. */
const SPORT_KINDS: readonly BlockKind[] = [
  'training', 'trainingAlt', 'drills', 'match', 'matchLong', 'tournament', 'gym',
]

/** THE LAYOFF. Her hours survive and their content changes: the coach still works a week she is
 *  laid up (settled earlier, «они вполне могут вместе восстанавливаться»), so the session the plan
 *  bought is still drawn and what happens in it is rehab rather than tennis.
 *
 *  ⚠ AND SHE STILL GOES TO SCHOOL, for the argument the rest day already had to learn: a layoff is
 *  a layoff FROM TENNIS. School was never the plan's to give or take away, and a fourteen-year-old
 *  with a bad ankle is in a classroom on Tuesday morning like everybody else. */
function layoffDay(shapes: BandShapes, day: DayContext): readonly DayBlock[] {
  return shapes[day.role].map((b) =>
    // ⚠ EVERY kind of sport, not just the drill: the hour survives, the sport does not. Written
    // against the LIST rather than against `drills` alone so a later band that fills a day with a
    // second session, or a booked friendly that somehow reaches a layoff week, cannot leak a match
    // onto a week she is not allowed to play in.
    SPORT_KINDS.includes(b.kind)
      ? { ...b, kind: 'physio' as const, label: b.kind === 'gym' ? 'Physio' : 'Rehab gym' }
      : b,
  )
}

// =================================================================================================
// ⚠ THE SUMMER HOLIDAYS – the ordinary week with the school taken out of it (R15-8, owner 01.08)
// =================================================================================================
//
// «2 месяца обычно после экзаменов... просто меньше учебы в календаре писать, пару-тройку часов в
// неделю». Season-weeks 25-33 (the window is `weekDays.ts`'s SUMMER_WEEKS and arrives as DATA on the
// context - this module still imports nothing from the engine). What changes is exactly what he
// said and nothing else:
//
//   * the 08-13 school block is GONE from every ordinary shape - it is the holidays;
//   * the evening homework hour survives on TWO weekdays only, relabelled for what it is now -
//     "Summer read", a couple of hours a week, in the hour the shape already owned (same slot, so
//     no summer day can ever collide with the session the plan bought);
//   * Tuesday and Thursday (indexes 1 and 3), fixed, for the same reason the gym owns Tuesday: a
//     deterministic shape, not a shuffle.
//
// ⚠ ORDINARY SHAPES ONLY, and the boundary is the owner's own second ruling: «на каникулярных
// неделях Study снимается - чего это? там подготовка к экзаменам идет во всю». A booked FAMILY week
// keeps its Study hours all year round - a holiday taken in summer still has next year's exams
// coming - so the family and vacation arcs are untouched by this window, and the sweep pins them
// byte-identical in and out of it. The exam fortnight (23-24) sits BEFORE the window and cannot
// meet it; the off-season (49-51) has its own arc and its own study rule.
const SUMMER_STUDY_DAYS: readonly number[] = [1, 3]
const SUMMER_STUDY_LABEL = 'Summer read'

/** An ordinary day's shape, in the holidays: school removed, the homework hour kept on the two
 *  reading days and removed on the rest. REMOVES OR RELABELS, never adds and never moves - the same
 *  discipline the composer's weekend rule keeps, so a summer day can never invent an hour or slide
 *  one onto the plan's session. */
function summerOrdinary(blocks: readonly DayBlock[], index: number): readonly DayBlock[] {
  const out: DayBlock[] = []
  for (const b of blocks) {
    if (b.kind === 'school' || b.kind === 'schoolLong') continue
    if (b.kind === 'study') {
      if (SUMMER_STUDY_DAYS.includes(index)) out.push({ ...b, label: SUMMER_STUDY_LABEL })
      continue
    }
    out.push(b)
  }
  return out
}

/** One shaper per whole-week kind. A `Record` rather than a switch so the type carries the
 *  completeness: a ninth `DayKind` would fail to compile here rather than draw an empty column. */
const WEEK_SHAPES: Record<WeekKind, (shapes: BandShapes, day: DayContext) => readonly DayBlock[]> = {
  school: examDay,
  away: (_shapes, day) => TRIP_ARC[day.index] ?? [],
  // Three weeks wear one kind, and they are told apart by DATA the composer hands down rather than by
  // anything this module could look up: the off-season block, a named family package, and the generic
  // family week a package we do not recognise falls back to.
  off: (_shapes, day) =>
    (day.offSeason === true
      ? PRE_SEASON_ARC
      : (day.vacationId !== undefined ? VACATION_ARCS[day.vacationId] : undefined) ?? FAMILY_ARC)[day.index] ?? [],
  rehab: layoffDay,
}

/** THE LAYOUT RULE. `band` is a PARAMETER, not a constant, because her week is supposed to change
 *  shape as she grows up (owner, 30.07) – school shrinks, then goes, and the hours it held fill
 *  with something else. Adding a band is adding a row to DAY_SHAPES; it is not a rewrite.
 *
 *  `day` is the third parameter for the reason the section above gives: the four whole-week kinds
 *  are a sequence, not a mix. The ordinary four ignore it - what she does on a court day is a
 *  consequence of the plan and not of the date - which is why it has a default.
 *
 *  Returns [] for a band with no row yet. That is unreachable while `bandFor` returns only populated
 *  bands, and it is pinned as unreachable rather than papered over with the school row, because
 *  drawing a fourteen-year-old's school day for an adult would be the invention this file refuses.
 *  ⚠ THE GATE IS ON THE BAND, NOT ON THE KIND, so a half-added band draws nothing on a trip week
 *  either - a trip arc that survived a missing band would be a silent hole in the same gate. */
export function dayBlocksFor(kind: DayKind, band: AgeBand, day: DayContext = ANY_DAY): DayBlock[] {
  const shapes = DAY_SHAPES[band]
  if (!shapes) return []
  // R15-8: the holidays reshape the ORDINARY kinds only - the four whole-week kinds keep their own
  // arcs whatever the season says (see the note over `summerOrdinary` for the owner's boundary).
  const blocks = isOrdinaryKind(kind)
    ? day.summer === true
      ? summerOrdinary(shapes[kind], day.index)
      : shapes[kind]
    : WEEK_SHAPES[kind](shapes, day)
  return blocks.map((b) => ({ ...b }))
}

/** The bands the table actually carries – for the completeness gate, and for `dayBlocksFor`'s own
 *  "unreachable" claim to be checkable. */
export function populatedBands(): AgeBand[] {
  return Object.keys(DAY_SHAPES) as AgeBand[]
}

// =================================================================================================
// WHAT THE SCREEN BINDS TO
// =================================================================================================

/** One column of the grid: a day of the week, and the blocks in it. */
export interface GridDay {
  /** 0 = Monday … 6 = Sunday */
  index: number
  short: string
  /** the day of the month, so the grid's head is dated the way the design's is */
  date: number
  /** what `weekDays.ts` decided this day IS – carried through so the column can keep the accessible
   *  name the day strip already gives it ("Monday – on court"), from one vocabulary rather than two */
  kind: DayKind
  /** the beat that makes the crossing-out animation hold here, or null. Carried for the same reason
   *  the day strip washes its beat cells: the hold has to land on a column the eye had already
   *  noticed, or it reads as the animation stuttering rather than as the week stopping on something. */
  beat: DayBeat | null
  blocks: DayBlock[]
}

/** Where a block sits in the canvas, as PERCENTAGES of the 07:00–19:00 span. Percentages rather than
 *  pixels so the row height is one number in the stylesheet and the blocks follow it – the grid has
 *  to survive a 320px phone and a tablet without a second table of offsets. */
export function blockOffset(block: DayBlock): { top: string; height: string } {
  const hours = GRID_END_HOUR - GRID_START_HOUR
  const top = ((block.start - GRID_START_HOUR) / hours) * 100
  const height = (block.span / hours) * 100
  return { top: `${round2(top)}%`, height: `${round2(height)}%` }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Where one of the labelled hour rules sits, on the same percentage canvas as the blocks – so a
 *  rule and the top edge of a block that starts at that hour are the same line. */
export function hourTop(hour: number): string {
  return `${round2(((hour - GRID_START_HOUR) / (GRID_END_HOUR - GRID_START_HOUR)) * 100)}%`
}

/** "07:00". The only clock face in the app, so it is spelled once. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** ⚠ NOBODY IS AT SCHOOL ON A SATURDAY, AND THE SHAPE TABLE CANNOT KNOW THAT.
 *
 *  `dayBlocksFor` is keyed by DAY KIND - the signature the brief fixes, and the right one, because
 *  what she does is a consequence of the plan rather than of the date. School is the one piece of
 *  furniture that is a fact about the WEEKDAY instead: `weekDays.ts` claims rest days Sunday first,
 *  then midweek, so at the grind preset SATURDAY is an ordinary court day - and the grid drew her
 *  into a classroom on it. Caught in the browser, not reasoned about.
 *
 *  So the weekday rule is applied HERE, where the day index is actually known, and it only ever
 *  REMOVES a block. That direction is the whole argument: the table stays the single place a day's
 *  shape is decided, and this cannot invent an hour - it can only decline to assert one.
 *
 *  ⚠ THE `rest` SHAPE NOW LEANS ON THIS, which is what it should have done from the start. It used
 *  to omit school itself, on the grounds that a rest day is usually Sunday - and the cost was a
 *  fourteen-year-old with no school on a Wednesday, the same falsehood pointing the other way. The
 *  table asserts school on every weekday shape and this strips it from Sat/Sun; one rule, in the one
 *  place that knows the date. It covers the EXAM week too, at no cost: a paper is a `school` block,
 *  so a Saturday exam could not survive this even if the table grew one. */
const WEEKEND: readonly number[] = [5, 6]
function dropWeekendSchool(index: number, blocks: DayBlock[]): DayBlock[] {
  if (!WEEKEND.includes(index)) return blocks
  return blocks.filter((b) => b.kind !== 'school' && b.kind !== 'schoolLong')
}

/** ⚠ THERE IS NO TERM TO MISS IN THE OFF-SEASON, so the homework the family week carries (see
 *  FAMILY_ARC) comes off there. The same shape serves a booked holiday and the off-season - the two
 *  arrive as one `DayKind` and only the week's TITLE tells them apart, which is a display string - so
 *  ⚠ AND THE FACT IS HANDED IN, NOT FETCHED - a guard caught the first attempt at exactly this. This
 *  module may not import from `../engine/`: it is presentation and it is derived from what it is
 *  given, which is the property `tests/calendar-grid.test.ts` calls "NOTHING NEW ON THE PAYLOAD".
 *  Reaching for `isOffSeasonWeek` here would have been the short diff and a hole in that rule.
 *  `weekDays.ts` already asks the calendar this question (it is the module that legitimately talks to
 *  the engine), so the answer travels on `CalendarWeek` and arrives as data.
 *
 *  Removes only, like its neighbour above: the table asserts the study hour, and this declines to
 *  draw it on a week where school is not running. */
function dropOffSeasonStudy(offSeason: boolean, kind: DayKind, blocks: DayBlock[]): DayBlock[] {
  if (kind !== 'off' || !offSeason) return blocks
  return blocks.filter((b) => b.kind !== 'study')
}

// =================================================================================================
// WHAT THE SESSION ACTUALLY WAS — variety without a second session
// =================================================================================================
//
// The owner, 31.07: «можем ли как-то tennis drills разложить на что-то разное, детализировать и, как
// вариант, перемешивать на разных неделях... это должно добавить динамики и разнообразия».
//
// ⚠ WHAT VARIES IS THE CONTENT OF THE HOUR, NOT THE SHAPE OF THE WEEK, and the split is the whole
// design. Which days are court, gym, rest and match is a READABLE CONSEQUENCE of the plan preset -
// `weekDays.ts` fixes the rest-day priority on purpose, "so the shape of her week does not shuffle
// when he moves a preset". Shuffling the days would take that back: the player would move a slider
// and watch the week rearrange for reasons he cannot see, which is the opposite of a consequence.
//
// But WHAT she did in her court hour was never modelled at all. The engine sells "a session on
// court" and says nothing about whether it was serves or footwork - so naming it costs no honesty,
// because there is no fact here to contradict. One hour stays one hour; only the word changes.
//
// Deterministic per (seed, week, day): the same career always sees the same Tuesday, and two
// consecutive weeks do not read as a photocopy. No engine draw and no sub-stream - the same rule the
// fridge note keeps, and for the same reason (see composables/fridgeNote.ts).
//
// ⚠ EVERY WORD HERE IS AT MOST SIX CHARACTERS, and that is a layout constraint measured in a
// browser rather than a style preference. A block is about 35-40px wide at 375pt and the label wraps
// with `break-word`, so a longer word is broken mid-syllable: "Rally patterns" came out as "Rally
// patter / ns", and even "Strength" - eight characters - came out as "Streng / th". Two six-letter
// words wrap cleanly between themselves; one long word has nowhere to break but inside itself. It
// is a rule about EVERY label in this file, not only these two lists (the block "Practice match"
// broke as "Practi / ce match" for the same reason and is "Match play" now), and a test sweeps them
// all.
const COURT_SESSIONS: readonly string[] = [
  'Tennis drills',
  'Serve work',
  'Return work',
  'Rally work',
  'Point play',
  'Speed work',
  'Volley work',
  'Net play',
]

/** The gym hour gets the same treatment, from a shorter list: it is one session a week, so it would
 *  otherwise be the one block that reads identically in every week of a career. */
const GYM_SESSIONS: readonly string[] = ['Gym', 'Core work', 'Leg work', 'Gym drills']

function namedSession(blocks: DayBlock[], seed: string, week: number, index: number): DayBlock[] {
  if (!seed) return blocks
  return blocks.map((b) => {
    if (b.kind === 'drills') {
      return { ...b, label: COURT_SESSIONS[hash32(`${seed}:sess:${week}:${index}`) % COURT_SESSIONS.length] }
    }
    if (b.kind === 'gym') {
      return { ...b, label: GYM_SESSIONS[hash32(`${seed}:gym:${week}:${index}`) % GYM_SESSIONS.length] }
    }
    return b
  })
}

/** WHAT THE PLAN MADE OF EACH DAY, for the two weeks that keep her hours without keeping her sport.
 *
 *  On an ordinary week this is simply what `d.kind` already says, and nothing reads it. On the exam
 *  week and the layoff week `weekDays.ts` has flattened all seven days to one kind - the week's own
 *  identity outranks the plan there - but the plan is still bought and still billed, so the shape
 *  needs to know which days it paid for.
 *
 *  ⚠ IT IS THE SAME RULE, NOT A SECOND COPY OF IT: `sessionDays` and the week's own `gymIndex` are
 *  `weekDays.ts`'s, imported rather than re-derived, so the exam week's sessions land on exactly the
 *  days an ordinary week's would. A second spelling here is how the picture and the plan would drift
 *  apart on the one week nobody looks at twice. */
function planRoles(week: CalendarWeek): OrdinaryKind[] {
  const session = new Set(sessionDays(week.sessions))
  return week.days.map((d) => (!session.has(d.index) ? 'rest' : d.index === week.gymIndex ? 'gym' : 'court'))
}

/** The seven columns for a week. EVERY week – the grid is drawn on all eight day kinds and only the
 *  CONTENT differs (owner, 31.07: «очень даже должна, никакой разницы, просто содержание сетки будет
 *  другим»). It used to return null on the four weeks the plan does not own, and the screen kept a
 *  second, plainer drawing for them; both are gone.
 *
 *  `seed` names the sessions (see above) and is optional so every existing test can build a grid
 *  without one - an empty seed leaves the table's own labels untouched. */
export function weekGridFor(
  week: CalendarWeek,
  ageYears: number,
  dates: readonly number[],
  seed = '',
): GridDay[] {
  const band = bandFor(ageYears)
  const roles = planRoles(week)
  return week.days.map((d: CalendarDay, i) => ({
    index: d.index,
    short: d.short,
    date: dates[i] ?? 0,
    kind: d.kind,
    beat: d.beat,
    blocks: namedSession(
      dropOffSeasonStudy(
        week.offSeason,
        d.kind,
        dropWeekendSchool(
          d.index,
          dayBlocksFor(d.kind, band, {
            index: d.index,
            role: roles[i],
            offSeason: week.offSeason,
            summer: week.summer,
            vacationId: week.vacationId,
          }),
        ),
      ),
      seed,
      week.week,
      d.index,
    ),
  }))
}
