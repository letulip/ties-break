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
// WHAT IS DELIBERATELY NOT HERE: a morning run, a stretch - both plausible, neither anything the
// engine models or the week's own read-out mentions. A calendar that invents facts is worse than no
// calendar (weekDays.ts's own header), and furniture that comes with a band - or with a week the
// engine has already named "a trip", "a holiday", "exams", "a layoff" - is not the same as furniture
// invented to fill a column.
//
// ⚠ "A SECOND COURT SESSION" WAS ON THAT LIST UNTIL W3-SUMMER, AND IT LEFT BY PASSING THE LIST'S OWN
// TEST rather than by being excused from it. The owner ruled the summer holidays are a real training
// block («если мы летом сделаем реальную нагрузку с 2 тренировками в день...»), so the engine now
// develops and fatigues those weeks differently AND `trainingReadout` says "two sessions a day" on
// them - which is exactly the two conditions this paragraph demands. It is drawn on the summer weeks
// and nowhere else. See `summerOrdinary` for the whole argument and for why the extra hour cannot
// make the day longer than a term-time day.
//
// ⚠ AND IT IS A PURE MODULE, no Vue and no store, for the argument `weekDays.ts` already makes about
// itself: a rule with content in it - a table of shapes, a band, an arc for a week away - is a rule
// worth pinning on values, and a rule inside a template is decoration that cannot be tested. The
// screen composes; this file decides.
// ⚠ AND SINCE v47 IT TAKES NO VALUE FROM THAT MODULE AT ALL. It used to import `sessionDays` to
// re-derive which day indexes the plan bought; the plan is a matrix now and the week carries the
// answer as `planDays` - see `planRoles` below for why that is a repair rather than a rename.
import type { CalendarDay, CalendarWeek, DayBeat, DayKind, TripFacts } from './weekDays'
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

/** The design system's `event` palette, one member per kind of hour; the three that still have no
 *  caller are written down at `DAY_SHAPES` rather than left as a puzzle.
 *
 *  ⚠ `press` IS THE FIRST MEMBER THE DESIGN EXPORT NEVER CARRIED (round 29 P14), and the note that
 *  used to stand here – "every one is on `:root` (src/style.css)" – meant the `--event-*` family,
 *  which the grid stopped painting with in round 19: the owner found those colours «грустно-унылые»
 *  and asked for the wallet's, so the blocks wear `--cat-*` now and `--event-*` survives only as the
 *  record of what he sent. Inventing an `--event-press` row would make that record lie about it, so
 *  press takes a `--cat-*` the wallet already declares and NO new colour is added anywhere. The rule
 *  that matters is unchanged and still pinned: every kind here has a `.cal-block--<kind>` rule
 *  painted from a declared token (tests/calendar-grid.test.ts). */
export type BlockKind =
  | 'training' | 'trainingAlt' | 'gym' | 'school' | 'schoolLong'
  | 'drills' | 'match' | 'matchLong' | 'study' | 'travel' | 'rest'
  | 'tournament' | 'physio' | 'vacation' | 'press'

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

/** Which band a week falls in.
 *
 *  ⚠ `full-time` IS NOT AN AGE RUNG AND THAT IS NOT AN OVERSIGHT (W4-SCHOOL). The note above says the
 *  content of the later bands was "a design decision nobody has taken yet"; the owner has now taken
 *  it - «Школа должна когда-то закончиться... Конец школы – в конце учебного года» - and the answer
 *  is not expressible as an age. School ends at the SEPTEMBER after her last grade, which for a girl
 *  born in September falls a whole year later in absolute time than for one born in August; a rung
 *  keyed on `ageYears` would put one of the two in the wrong room. So `schoolOver` arrives as data on
 *  `CalendarWeek` - the same route `offSeason` and `summer` take, and for the same reason: this
 *  module may not ask the engine anything.
 *
 *  `senior-school` stays unimplemented and unreachable, exactly as before. */
export function bandFor(ageYears: number, schoolOver = false): AgeBand {
  if (schoolOver) return 'full-time'
  let band: AgeBand = BAND_FROM[0].band
  for (const rung of BAND_FROM) if (ageYears >= rung.from) band = rung.band
  return band
}

/** THE LAYOUT TABLE. One row per band, one shape per ordinary day kind.
 *
 *  `Partial` on the OUTER record and total on the inner one is the type saying what the paragraph
 *  above says: a band may be absent, but a band that is present is complete.
 *
 *  ⚠ TWO OF THE FOURTEEN BLOCK KINDS HAVE NO CALLER, and each is waiting for something specific
 *  rather than being decoration:
 *    `match`                 the SECOND session of a day, on a day that already has a friendly on it.
 *                            Still uncalled: the booked match owns its day whole.
 *    ⚠ `trainingAlt` LEFT THIS LIST IN W3-SUMMER, and it went to the exact caller it was reserved
 *                            for. Its note read "the SECOND session of a day. At fourteen there is
 *                            one, and drawing two would contradict the sentence under the grid...
 *                            they are what the hours school gives back get filled with in the later
 *                            bands." The holidays are the first week where school gives its hours
 *                            back INSIDE the first band, the engine models the extra load, and the
 *                            sentence under the grid now says "two sessions a day" - so nothing is
 *                            contradicted. See `summerOrdinary`.
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
  // ⚠ NINETEEN, AND SHE IS NOT AT SCHOOL (W4-SCHOOL). The owner's own report was about this table
  // and nothing else: «и школа с уроками в 22 года всё еще со мной» - the eight o'clock block and
  // the evening homework hour were drawn at every age, for ever, because `BAND_FROM` had one rung.
  //
  // ⚠ AND IT IS THE SUMMER DAY, DELIBERATELY, RATHER THAN A NEW INVENTION. `summerOrdinary` has been
  // drawing exactly this day since W3-SUMMER - school out, no homework hour, a morning session on
  // the days the plan already bought a court - and the engine prices that week through the same
  // `loadFactor` channel whether it is July at sixteen or October at nineteen. Two tables that drew
  // the same week differently would be two answers to one question. The header's rule still holds:
  // the morning session takes the 09-11 slot school used to own, so the day is no LONGER than a
  // term-time day, it is differently filled.
  //
  // ⚠ COURT DAYS ONLY, like the summer's own rule. The holidays do not repeal the plan and neither
  // does growing up: a rest day is still a rest day, the gym day keeps its one session, and the
  // booked friendly owns its Saturday.
  'full-time': {
    court: [
      { start: 9, span: 2, kind: 'trainingAlt', label: 'Early hit' },
      { start: 15, span: 2, kind: 'drills', label: 'Tennis drills' },
    ],
    gym: [{ start: 15, span: 2, kind: 'gym', label: 'Gym' }],
    match: [{ start: 10, span: 3, kind: 'matchLong', label: 'Match play' }],
    rest: [{ start: 15, span: 3, kind: 'rest', label: 'Rest' }],
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
  /** ⭐⭐ ROUND 29 P15/P13/P14 – WHAT THIS TRIP IS, on a week that is one. Data, like its four
   *  neighbours above and for their reason: this module may not import from `../engine/`, and the
   *  draw's round count, the masseur's seat and the rung's press room are all engine facts.
   *
   *  Optional and absent by default, which gives a caller that forgets THE COMMON WEEK: a five-round
   *  draw – «основная масса», and the one every rung from the National Series to the WTA 500 is –
   *  with no press room and no masseur, so a test that omits it asks for the least the arc can
   *  assert rather than the most. See `TRIP_DEFAULT`. */
  trip?: TripFacts
  /** 0 = Monday … 6 = Sunday */
  index: number
  /** what the PLAN made of this day – or would have, on a week it does not own. */
  role: OrdinaryKind
}

/** What a trip week is when nobody said – the common draw, no press room, no masseur. See
 *  `DayContext.trip` for why absence resolves to the quiet middle of the ladder rather than to the
 *  biggest thing the arc can draw. */
export const TRIP_DEFAULT: TripFacts = { rounds: 5, masseur: false, press: false }

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
  // ⚠ NO TERM, NO PAPER (W4-SCHOOL). A band whose day carries no school block is a band with no
  // exams in it, and `isExamWeek` agrees - past her last school year the fortnight never comes, so
  // `weekDays.ts` cannot produce this kind at all. It is handled anyway, for exactly the reason the
  // unreachable `match` role above is: an unreachable path that DREW something would have put
  // Monday's 09:00 paper straight through the full-time day's 09:00 morning session, silently.
  if (rest.length === shapes[role].length) return rest
  if (!paper) return rest
  return [{ start: paper[0], span: paper[1], kind: 'school', label: 'Exam' }, ...rest]
}

// =================================================================================================
// ⭐⭐ THE TRIP – ROUND 29 P15 / P13 / P14
// =================================================================================================
//
// ⚠ THE TRIP, AND NOT ONE ROUND IS NAMED. Travel out, a hit on court at the venue, the tournament
// across the middle of the week, travel home. Every day of the event carries the SAME block, and
// what it says is when the tournament is on - not that she is still in it. The week has not been
// played: a block reading "R2" on the Thursday would assert she came through Wednesday, which is
// the sim's call and not the calendar's. That rule is UNCHANGED by the three items below.
//
// ⚠⚠ AND IT USED TO BE A FIXED SEVEN-DAY TABLE, FOUR OF WHOSE DAYS WERE THE DRAW – for every rung
// from a Local Open to Wimbledon. The owner asked for the count to follow the event (P15): «давай
// здесь тоже сделаем разное количество Draw day в зависимости от уровня турнира: на локалах 3 дня,
// National 4 (вроде), основная масса 5, а на 1000 вообще 6 (Шлем 7)».
//
// ⭐ THE COUNT IS NOT A TABLE OF TASTES – IT IS THE DRAW'S OWN ROUNDS. `weekDays.ts`'s
// `tripRoundsFor` is `Math.log2(TIERS[tier].drawSize)`, which is `runTournament`'s own arithmetic,
// and the shipped draw sizes hand back exactly the numbers he asked for: 8 -> 3, 16 -> 4, 32 -> 5,
// 64 -> 6, 128 -> 7. Nothing here is fitted to his list; his list is what the catalogue already said.
//
// ⚠⚠ AND THE BIG TIERS FIT INSIDE THE WEEK BECAUSE THE TRAVEL MOVES, NOT BECAUSE THE TENNIS
// SHRINKS – his second ruling, and it is the one that made P15 buildable at all. Seven days minus a
// travel day at each end leaves five, so a 1000 (six rounds) and a Slam (seven) had nowhere to go.
// Two-week events were put to him and he declined them for now – «Не уверен, что нам в нашу сложную
// сетку надо вплетать еще и 2х недельные турниры. Подожди с этим» – and proposed this instead:
//
//   «Если у нас на неделе ожидается шлем или 1000, то мы вполне можем на предыдущей неделе в
//    Воскресенье начать ехать на турнир, тогда вся неделя будет в нормальном матчевом расписании с
//    поездкой домой либо снова в Вс (если был 1000), либо в Пн следующей недели (если был Шлем). И
//    тогда не надо ничего менять в нашей раскладке, всё остается в пределах недели как было.»
//
// So the TOURNAMENT never leaves its week – no entry, no schedule and no tick changes, and the
// engine is not touched by any of this – and only the JOURNEY spills onto the neighbour's edge. It
// falls out of the round count with no second switch to keep in step:
//
//   rounds <= 5   the arc keeps both its own travel days (5: no court hit – there is no room left)
//   rounds == 6   the departure is the previous week's Sunday; Mon-Sat play, home on the Sunday
//   rounds == 7   the departure is the previous week's Sunday and the whole week is the draw
//
// ⚠ THE RETURN FROM A SLAM – his «в Пн следующей недели» – IS THE ONE HALF THAT IS NOT DRAWN, and
// the reason is a fact about the snapshot rather than a decision: `upcoming` is `week > world.week`,
// so this screen can look FORWARD one week and cannot look BACK one at all. The departure lend is
// therefore honest and the return lend would have to be guessed. See `lendsSunday` in weekDays.ts
// and round-29's P16 for the cheapest route to it if the owner wants that Monday drawn.

/** The days a drawn week has. Named because three rules below are arithmetic against it. */
const WEEK_DAYS = 7
/** The trip keeps its own DEPARTURE day while the draw leaves room for one at each end. */
export function tripKeepsDeparture(rounds: number): boolean {
  return rounds + 2 <= WEEK_DAYS
}
/** ...and its own RETURN day while the draw leaves room for one at the end. */
export function tripKeepsReturn(rounds: number): boolean {
  return rounds + 1 <= WEEK_DAYS
}

/** ⚠ THE COURT HIT IS `training` AND NOT `drills`, and it is the one invariant that keeps this week
 *  from lying about the plan: `drills` MEANS "the session the plan bought", every week, everywhere.
 *  A trip does not spend the plan's sessions - the family is away - so the hour she spends on court
 *  at the venue is a different kind of hour and wears a different colour.
 *
 *  ⚠ AND IT IS THE PIECE THAT GIVES WAY FIRST when the draw gets longer, because it is the only day
 *  of the arc that is not a fact: the travel has to happen and the matches have to be played, while
 *  "she practised at the venue on the Tuesday" is the arc's own furniture. From five rounds up there
 *  are none. */
const TRIP_TRAVEL_OUT: DayBlock = { start: 9, span: 4, kind: 'travel', label: 'Travel out' }
const TRIP_COURT_HIT: DayBlock = { start: 10, span: 2, kind: 'training', label: 'Court hit' }
const TRIP_DRAW_DAY: DayBlock = { start: 10, span: 4, kind: 'tournament', label: 'Draw day' }
const TRIP_TRAVEL_HOME: DayBlock = { start: 11, span: 4, kind: 'travel', label: 'Travel home' }

/** ⭐⭐ P14 – THE PRESS CONFERENCE, and it is FLAVOUR: it costs nothing, moves no number, spends no
 *  hour the sim knows about and cannot block a week. The owner scoped it himself – «на тех уровнях
 *  турниров, где это актуально» – and `tierHoldsPress` (weekDays.ts) draws that line at the WTA main
 *  tour, where the engine already pays an appearance fee to have her on the poster.
 *
 *  ⚠ ONE HOUR, ON A MATCH DAY AND NOWHERE ELSE: no press room opens for a travel day or a practice
 *  day. Where it sits inside that day is `tripMatchDay`'s decision, not this constant's - see the
 *  ORDER note there, which is the owner's own enumeration. */
const TRIP_PRESS: Omit<DayBlock, 'start'> = { span: 1, kind: 'press', label: 'Press' }

/** ⭐⭐ P13 – THE MASSEUR'S HOUR ON TOUR, «сессии массажа после матчей по плану», drawn on the match
 *  days and only there.
 *
 *  ⚠⚠ IT IS NOT THE RUNG'S TABLE AND IT MUST NOT BE COUNTED AS ONE. `addMasseurTable` below draws
 *  the WEEKLY rung – 2 / 4 / 7 sessions, laid on the days the plan bought – and a trip does not
 *  spend the plan's days, which is why that table used to land on a tour week's Monday and Tuesday
 *  (the travel day and the practice day) and miss every match of the week at the entry rung. FOLLOW
 *  THE MONEY: on the week he boards, the weekly bill STANDS DOWN (`resolveMasseur`) and
 *  `masseurTourWeekCents` charges MATCHES PLAYED x the session rate instead, while `masseurTourRelief`
 *  pays back per NIGHT BETWEEN ROUNDS. The rung buys nothing on tour, so drawing the rung on tour
 *  would be the picture promising a dial the ledger does not read. One session per match day is what
 *  the engine already bills for.
 *
 *  ⚠ WHERE IT SITS IS `tripMatchDay`'s ORDER note, one function down. */
const TRIP_TABLE: Omit<DayBlock, 'start'> = { span: 1, kind: 'physio', label: 'Body work' }

/** ⭐ P15 – ONE MATCH DAY, with whatever the rung hangs on it, in the order he named them.
 *
 *  ⚠⚠ THE ORDER IS THE OWNER'S OWN ENUMERATION AND IT WAS THE OTHER WAY ROUND IN THE FIRST DRAFT.
 *  I had written match -> microphone -> table on the reasoning that a real press conference follows
 *  a match within the half-hour. His sentence closing the return («можно сделать в Вс **после
 *  матчей, массажа и конференций**») lists them in HIS order, and it is the one the day is built in
 *  now: **draw -> table -> press -> the journey home**. One order on every match day of every rung,
 *  so the last day of a Slam is the same day as its other six with a flight added rather than a day
 *  shaped differently from its own week.
 *
 *  ⚠ EACH BLOCK SITS DIRECTLY BEHIND THE ONE BEFORE IT – no gaps to reason about, and the day's end
 *  is `dayEnd` below, which is what the journey home is placed against. */
function tripMatchDay(trip: TripFacts): DayBlock[] {
  const day: DayBlock[] = [{ ...TRIP_DRAW_DAY }]
  if (trip.masseur) day.push({ ...TRIP_TABLE, start: dayEnd(day) })
  if (trip.press) day.push({ ...TRIP_PRESS, start: dayEnd(day) })
  return day
}

/** The hour a day's blocks finish at. Written as a fold over every block rather than as
 *  `last.start + last.span`, because "the last one in the array" is an assumption about how the day
 *  was built and this is a fact about the day. */
function dayEnd(day: readonly DayBlock[]): number {
  return day.reduce((end, b) => Math.max(end, b.start + b.span), GRID_START_HOUR)
}

/** ⭐⭐ ROUND 29 P16 – THE JOURNEY HOME ON THE LAST MATCH DAY, when the draw leaves no day for it.
 *
 *  ⚠⚠ THIS IS WHAT CLOSED THE ONE HALF OF HIS DESIGN THAT COULD NOT BE DRAWN. He first described a
 *  Slam's return as «в Пн следующей недели», and that Monday is unreachable from here: the calendar
 *  draws `snapshot.week + 1` and `upcoming` is filtered to `week > world.week`, so this screen can
 *  look FORWARD one week and cannot look back one at all. Nothing was drawn rather than something
 *  guessed. Put to him, he removed the need for the lookback entirely:
 *
 *    «возвращение со Шлема в понедельник следующей недели – да, окей, можно сделать в Вс после
 *     матчей, массажа и конференций»
 *
 *  So the flight is the last thing on the Sunday, behind all three, and the whole trip is inside its
 *  own week again – no neighbour is asked anything.
 *
 *  ⚠ IT TAKES THE EVENING THAT IS LEFT, IT DOES NOT TAKE AN HOUR FROM ANYBODY. The block starts at
 *  `dayEnd` and runs to the end of the grid, so a Sunday that holds a final, a rub-down and a press
 *  hour still holds all three and the flight is what the rest of the evening is. That is also what a
 *  real flight home after a final is - an evening one.
 *
 *  ⚠ THE `start >= GRID_END_HOUR` ARM IS UNREACHABLE TODAY AND HAS NO TEST OF ITS OWN – said plainly,
 *  because a branch with a comment claiming coverage it does not have is how a dead guard is born
 *  (this file's own colour pin was exactly that, one item ago). A match day ends at 16:00 at the very
 *  most, so nothing can reach it. What IS pinned is its PREMISE: no day of any rung ends late enough
 *  to need it (tests/component/round29-trip-week.test.ts), so lengthening any of the three blocks
 *  reddens there and this arm starts mattering on the same commit. It stays because the alternative
 *  to declining would be a zero- or negative-span block, and declining is the direction every other
 *  rule in this file keeps.
 *
 *  ⚠ THE 1000 DOES NOT COME THROUGH HERE. Six rounds still leave a whole Sunday for the journey
 *  (`tripKeepsReturn`), which is his own «либо снова в Вс (если был 1000)» - a travel DAY, not a
 *  travel evening. This is the Slam's rule, and the only shipped rung it can reach. */
function addEveningReturn(day: DayBlock[]): DayBlock[] {
  const start = dayEnd(day)
  if (start >= GRID_END_HOUR) return day
  return [...day, { start, span: GRID_END_HOUR - start, kind: 'travel', label: 'Travel home' }]
}

/** ⭐ P15 – THE WHOLE TRIP, seven days of it, as a function of the draw the family entered.
 *
 *  ⚠ IT ALWAYS RETURNS SEVEN DAYS and it always spends every one of them: a column the arc forgot
 *  would be an empty day on a week the family paid to be away for, which is the silent failure this
 *  file keeps writing tests against. The arithmetic is `hits = 7 - departure - rounds - return`, and
 *  the two ends fall away in the order the owner's design says they do. */
export function tripArcFor(trip: TripFacts): readonly (readonly DayBlock[])[] {
  // ⚠ CLAMPED, AND THE GUARD IS AGAINST A ROUND COUNT THAT IS NOT A NUMBER AT ALL rather than
  // against a rung that does not exist: a NaN would fall through `Math.min`/`Math.max` untouched and
  // draw a week of nothing, which is the silent empty column this file spends its tests on.
  const asked = Number.isFinite(trip.rounds) ? Math.round(trip.rounds) : TRIP_DEFAULT.rounds
  const rounds = Math.max(1, Math.min(WEEK_DAYS, asked))
  const out: DayBlock[][] = []
  if (tripKeepsDeparture(rounds)) out.push([{ ...TRIP_TRAVEL_OUT }])
  const hits = WEEK_DAYS - out.length - rounds - (tripKeepsReturn(rounds) ? 1 : 0)
  for (let i = 0; i < hits; i++) out.push([{ ...TRIP_COURT_HIT }])
  for (let i = 0; i < rounds; i++) out.push(tripMatchDay(trip))
  // ⭐ P16 – SHE COMES HOME EITHER WAY, and the only question is whether the journey gets a day or an
  // evening. Both arms are his: «либо снова в Вс (если был 1000)» is the day, «в Вс после матчей,
  // массажа и конференций» is the evening. So no trip of any length now ends without a way home.
  if (tripKeepsReturn(rounds)) out.push([{ ...TRIP_TRAVEL_HOME }])
  else out[out.length - 1] = addEveningReturn(out[out.length - 1])
  return out
}

/** ⭐ P15 – THE DEPARTURE THE NEIGHBOUR LENDS, on the Sunday before a draw too long to start at home.
 *
 *  ⚠ IT IS THE LAST HOUR OF THE DAY OR IT IS NOTHING, and that is the whole fence. The week that
 *  lends the Sunday is still an ordinary week - his own «не надо ничего менять в нашей раскладке» -
 *  so this may not move a session, shorten a rest day or take an hour the plan bought. It asks for
 *  the one hour at the end of the grid and draws nothing at all when that hour is spoken for.
 *  Declining to draw is always available; taking a block away from the day it belongs to is not.
 *
 *  ⚠⚠ WHICH MAKES IT A PROFESSIONAL'S BLOCK IN PRACTICE, AND THAT IS STATED RATHER THAN DISCOVERED.
 *  Past school her evening is her own (`dropSchoolFurniture` takes the homework hour off every day),
 *  so 18:00 is free on a rest Sunday and on a court Sunday alike and the departure is drawn. AT
 *  FOURTEEN IT IS NOT: the school band puts `Study` at 18:00 on every shape, so a schoolgirl's Sunday
 *  keeps its homework hour and the loan says nothing. That is the right way round for the two rungs
 *  this rule exists for - a Slam and a 1000 are entered by a professional - and the alternative was
 *  a composition rule that could delete a fourteen-year-old's homework to make room for a flight.
 *  Both arms are pinned in tests/component/round29-trip-week.test.ts so neither is a surprise. */
const TRIP_LENT_DEPARTURE: DayBlock = {
  start: GRID_END_HOUR - 1,
  span: 1,
  kind: 'travel',
  label: 'Travel out',
}

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
  // ⭐⭐ ROUND 29 #5 – THE SEVENTH, AND IT IS THE ONE RUNG WHOSE GAIN IS NOT BOUGHT WITH TREATMENT.
  // docs/specs/the-shop-2026-08.md §3f, the owner: «а неделя на яхте (при наличии яхты) вполне может
  // стать новой строкой отпуска, кстати». It ties the clinic on the number and gets there the other
  // way: nothing to be on time for, nobody able to reach her, and a week of it. So there is no
  // physio in this arc AT ALL and that is deliberate rather than an omission – a boat is not a
  // clinic, and drawing six massage sessions on it would be the clinic's week with a new label.
  // `tests/calendar-grid.test.ts`'s treatment ladder is re-aimed at the six the money buys, with the
  // reason written where the guard is.
  //
  // TWO TRAVEL DAYS, because the boat is where the boat is: they fly to it and they fly home.
  'yacht-week': [
    [{ start: 9, span: 4, kind: 'travel', label: 'Flight out' }, { start: 15, span: 2, kind: 'vacation', label: 'Aboard' }],
    [{ start: 10, span: 3, kind: 'rest', label: 'Lie-in' }, { start: 13, span: 4, kind: 'vacation', label: 'The sea' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 5, kind: 'vacation', label: 'Swim' }],
    [{ start: 10, span: 3, kind: 'rest', label: 'No plans' }, { start: 13, span: 4, kind: 'vacation', label: 'The sea' }],
    [{ start: 9, span: 2, kind: 'study', label: 'Study' }, { start: 11, span: 5, kind: 'vacation', label: 'Ashore' }],
    [{ start: 10, span: 3, kind: 'rest', label: 'Lie-in' }, { start: 13, span: 4, kind: 'vacation', label: 'Last swim' }],
    [{ start: 10, span: 4, kind: 'travel', label: 'Flight home' }],
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

// =================================================================================================
// ⚠⚠ AND SINCE W3-SUMMER THE HOLIDAYS ADD A MORNING SESSION - THE ONE THING THIS FILE REFUSED TO DO
// =================================================================================================
//
// Two standing rules in this module said no to a second session, and both were RIGHT WHEN WRITTEN and
// are re-aimed here rather than deleted, because what changed is the engine and not the appetite:
//
//   the header's «WHAT IS DELIBERATELY NOT HERE: a morning run, a SECOND COURT SESSION, a stretch -
//   all of them plausible, none of them anything the engine models or the week's own read-out
//   mentions», and `DAY_SHAPES`'s note that `trainingAlt` has no caller because "at fourteen there is
//   one [session], and drawing two would contradict the sentence under the grid".
//
// Both objections are answered rather than overruled. THE ENGINE MODELS IT NOW: the owner ruled that
// summer is real load - «если мы летом сделаем реальную нагрузку с 2 тренировками в день... это как
// раз частично компенсирует недостаток тренерских недель в другие периоды» - so `summerBlockWeek`
// multiplies the week's development and charges it condition, which is precisely the "anything the
// engine models" the header asked for. AND THE READ-OUT MENTIONS IT: `trainingReadout` says "two
// sessions a day" on exactly these weeks, so the grid and the sentence under it agree.
//
// `trainingAlt` is therefore claimed by the caller it was reserved for. The morning session takes the
// 09-11 slot INSIDE the hours school used to own, so the rule that summer only ever gives hours back
// still holds: the day is no longer than a term-time day, it is differently filled.
//
// ⚠ COURT DAYS ONLY. A rest day stays a rest day and the gym day keeps its one session: the holidays
// do not repeal the plan, they fill the mornings of the days the plan already bought. And the booked
// match keeps its own shape for the same reason - a match day is a match day in July too.
// (⚠ "Early hit" and not "Morning hit": the column is 35px and the guard at the head of
// tests/calendar-grid.test.ts caps every WORD at six characters. It caught the first draft.)
const SUMMER_SESSION: DayBlock = { start: 9, span: 2, kind: 'trainingAlt', label: 'Early hit' }

/** An ordinary day's shape, in the holidays: school removed, the homework hour kept on the two
 *  reading days and removed on the rest, and a MORNING SESSION added on the days the plan put her on
 *  court. Removes, relabels, and adds exactly one block whose hour the removed school block already
 *  owned - so a summer day can never run longer than a term-time day or slide onto the session the
 *  plan bought. */
function summerOrdinary(blocks: readonly DayBlock[], kind: OrdinaryKind, index: number): readonly DayBlock[] {
  const out: DayBlock[] = []
  if (kind === 'court') out.push({ ...SUMMER_SESSION })
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

/** ⭐ ROUND 28 #6 – A DAY AT THE SHOOT, and it is one shape rather than a seven-day arc because a
 *  shoot day is not a sequence: the letter names WEEKS and the week gives up its free days, so any
 *  one of them is the same working day (see `shootDaysFor` in weekDays.ts).
 *
 *  ⚠ IT WEARS `travel`, WHICH IS NOT A SHORTAGE OF COLOURS. The plan's own words for what this costs
 *  are «lights, flights and a working day» - `accrueCondition` charges the week at the TRAVEL figure
 *  for exactly that reason - so the hour that is not hers reads in the palette the app already uses
 *  for an hour spent getting somewhere. A trip week draws `travel` too and the two can never share a
 *  column: an entered tournament outranks the shoot, and `calendarWeekFor` returns before it.
 *
 *  ⚠ AND IT CARRIES NO SCHOOL BLOCK, deliberately. A call sheet takes the day it is on; the
 *  fourteen-year-old shape's eight o'clock lesson is exactly what a shoot day does not have. The
 *  same assertion `TRIP_ARC` already makes about a girl away at a tournament in term time. */
const SHOOT_DAY: readonly DayBlock[] = [
  { start: 8, span: 2, kind: 'travel', label: 'Call' },
  { start: 10, span: 6, kind: 'travel', label: 'Shoot' },
]

/** One shaper per kind whose day content does NOT come from the plan. A `Record` rather than a
 *  switch so the type carries the completeness: a tenth `DayKind` would fail to compile here rather
 *  than draw an empty column.
 *
 *  ⚠ 'shoot' IS THE ONE MEMBER THAT IS NOT A WHOLE WEEK (round 28 #6), and it belongs here anyway:
 *  what this table really is, is "the kinds the plan does not shape", and a shoot day is one of them
 *  whether or not its neighbours are. */
const WEEK_SHAPES: Record<WeekKind, (shapes: BandShapes, day: DayContext) => readonly DayBlock[]> = {
  school: examDay,
  away: (_shapes, day) => tripArcFor(day.trip ?? TRIP_DEFAULT)[day.index] ?? [],
  shoot: () => SHOOT_DAY,
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
  // ⚠ `band === 'school'` GUARDS THE SUMMER TRANSFORM (W4-SCHOOL). `summerOrdinary` REMOVES the
  // school furniture and ADDS the morning session; the `full-time` row has already had both applied
  // to it, so running it again would draw a second "Early hit" on every court day of July. The
  // holidays are a school fact and a girl who has left school does not have them.
  const blocks = isOrdinaryKind(kind)
    ? day.summer === true && band === 'school'
      ? summerOrdinary(shapes[kind], kind, day.index)
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

/** ⚠ AND PAST SCHOOL THERE IS NO TERM AT ALL (W4-SCHOOL) – the same rule as its two neighbours, one
 *  band wider. `DAY_SHAPES['full-time']` already carries no school and no homework hour, but the FOUR
 *  WHOLE-WEEK ARCS are hand-written tables that do: `FAMILY_ARC` and all six `VACATION_ARCS` put a
 *  Study block on every weekday, because a holiday taken in term time still has next year's exams
 *  coming. At twenty-two it does not.
 *
 *  ⚠ WRITTEN AS A COMPOSITION RULE RATHER THAN AS SEVEN TABLE EDITS, and that is the point: it covers
 *  every arc that exists and every arc anybody adds later, it can only ever REMOVE (the discipline
 *  `dropWeekendSchool` and `dropOffSeasonStudy` already keep, and the reason this file cannot invent
 *  a day), and the fact is handed in on `CalendarWeek` rather than fetched - this module still
 *  imports nothing from `../engine/`. */
function dropSchoolFurniture(schoolOver: boolean, blocks: DayBlock[]): DayBlock[] {
  if (!schoolOver) return blocks
  return blocks.filter((b) => b.kind !== 'school' && b.kind !== 'schoolLong' && b.kind !== 'study')
}

/** ⭐⭐ ROUND 28 #1 – THE MASSEUR'S HOUR, AND THE ONE COMPOSITION RULE IN THIS FILE THAT ADDS.
 *
 *  The owner: with a masseur hired, the massage sessions his TIER buys should be in the week's
 *  schedule. He has been on the payroll since v59, the dial is 2 / 4 / 7 sessions a week, the bill
 *  is on the ledger every week – and no week has ever drawn one of them.
 *
 *  ⚠ WHY IT CANNOT LIVE IN `DAY_SHAPES` LIKE EVERYTHING ELSE. That table is keyed by day KIND and
 *  age BAND, and a hire is neither: it is a fact about the WEEK the family bought, so a court day
 *  with a masseur and a court day without are the same kind. The two neighbours above only ever
 *  REMOVE for exactly this reason – the table is where a day's shape is decided and a rule that
 *  invents an hour would take that away from it. This one adds, and it is fenced accordingly:
 *
 *    * it draws ONLY what it is HANDED. `week.masseurDays` is computed in weekDays.ts, from the
 *      snapshot, against the ENGINE's own refusals (college, a booked family week, a shoot week, a
 *      trip he did not travel to). This module still imports nothing from `../engine/`.
 *    * it can never collide. The hour is the LAST free one in the day, scanned down from the end of
 *      the grid, so a rub-down lands after the day's work at every band and on every arc – and if a
 *      day were ever full it would draw nothing rather than paint over a session.
 *    * it is one hour, once. A day is in `masseurDays` or it is not, so the drawn count is exactly
 *      the sessions the rung is billed for – which is what makes the picture checkable against the
 *      bill instead of merely decorative.
 *
 *  ⚠ THE LABEL IS `Body work`, NOT `Massage`. Every word in a block label is capped at six
 *  characters (tests/calendar-grid.test.ts, measured in the browser at 375pt – an eight-letter word
 *  has nowhere to break but inside itself). `Body work` is the masseur module's own phrase for what
 *  he sells, and it does not read as the physio's `Physio` / `Rub-down`, which is the distinction
 *  the whole hire rests on.
 *
 *  ⚠⚠ AND IT IS THE WEEKLY RUNG'S TABLE, WHICH A TOUR WEEK DOES NOT BUY (round 29 P13). `week.
 *  masseurDays` is empty on a trip now and the trip draws its own sessions – one per match day, in
 *  `tripMatchDay` – because the engine stands the weekly bill down on the week he boards and charges
 *  matches played instead. This rule is therefore the HOME week's, exactly as its own paragraph
 *  above describes it: the days the plan bought. */
const MASSEUR_BLOCK: Omit<DayBlock, 'start'> = { span: 1, kind: 'physio', label: 'Body work' }
function addMasseurTable(masseurDays: readonly number[], index: number, blocks: DayBlock[]): DayBlock[] {
  if (!masseurDays.includes(index)) return blocks
  for (let hour = GRID_END_HOUR - MASSEUR_BLOCK.span; hour >= GRID_START_HOUR; hour--) {
    const free = blocks.every((b) => hour + MASSEUR_BLOCK.span <= b.start || hour >= b.start + b.span)
    if (free) return [...blocks, { ...MASSEUR_BLOCK, start: hour }]
  }
  return blocks
}

/** ⭐ ROUND 29 P15 – THE SUNDAY A WEEK LENDS TO THE NEXT WEEK'S DEPARTURE. See
 *  `TRIP_LENT_DEPARTURE` for the fence: the last hour of the day or nothing at all, so an ordinary
 *  week stays exactly the ordinary week it was and this can only ever decline. */
const LENT_DAY = WEEK_DAYS - 1
function addLentDeparture(nextTripRounds: number | null, index: number, blocks: DayBlock[]): DayBlock[] {
  if (nextTripRounds === null || index !== LENT_DAY) return blocks
  // ⚠ THE ARITHMETIC IS ASKED HERE AND NOWHERE ELSE. `weekDays.ts` hands down the round COUNT and
  // this file decides what a week that long does with it – the same one-owner rule that keeps the
  // arc and the loan from disagreeing about which rungs leave at the weekend.
  if (tripKeepsDeparture(nextTripRounds)) return blocks
  const free = blocks.every(
    (b) =>
      TRIP_LENT_DEPARTURE.start + TRIP_LENT_DEPARTURE.span <= b.start ||
      TRIP_LENT_DEPARTURE.start >= b.start + b.span,
  )
  return free ? [...blocks, { ...TRIP_LENT_DEPARTURE }] : blocks
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
 *  ⚠ IT IS NOT A RULE ANY MORE, IT IS A FIELD (v47). It used to re-derive the three-way answer from
 *  `sessionDays(week.sessions)` and the week's single `gymIndex`, under this note's own warning that a
 *  second spelling is how the picture and the plan drift apart on the one week nobody looks at twice.
 *  A ticked week is a MATRIX with no single gym index and no fixed rest priority, so re-deriving it
 *  from a session COUNT stopped being possible at all - which is what made the warning come true
 *  rather than what let it be ignored. `weekDays.ts` computes `planDays` once and this reads it. */
function planRoles(week: CalendarWeek): OrdinaryKind[] {
  return [...week.planDays]
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
  const band = bandFor(ageYears, week.schoolOver)
  const roles = planRoles(week)
  return week.days.map((d: CalendarDay, i) => ({
    index: d.index,
    short: d.short,
    date: dates[i] ?? 0,
    kind: d.kind,
    beat: d.beat,
    // ⭐ ROUND 28 #1 – the masseur's hour goes on LAST, after every rule that removes, so it can
    // read the day it is actually landing in rather than the one the table proposed. See
    // `addMasseurTable`: it adds only what it is handed.
    // ⭐ ROUND 29 P15 – ...and the lent departure goes on BEFORE it, so the masseur's scan can see
    // the Sunday evening she is actually leaving on rather than the one the table proposed. Two
    // rules here add now; both draw only what they are handed and neither can paint over a block.
    blocks: addMasseurTable(
      week.masseurDays,
      d.index,
      addLentDeparture(
        week.nextTripRounds,
        d.index,
        namedSession(
          dropSchoolFurniture(
            week.schoolOver,
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
                  trip: week.trip ?? undefined,
                }),
              ),
            ),
          ),
          seed,
          week.week,
          d.index,
        ),
      ),
    ),
  }))
}
