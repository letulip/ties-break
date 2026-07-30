// THE WEEK, LAID OUT IN HOURS – the blocks screen H draws inside its time x day grid.
//
// `composables/weekDays.ts` answers WHAT each of the seven days is (a court day, the gym day, the
// rest day, the booked match). This file answers what one of those days LOOKS LIKE across a
// morning and an afternoon. It is a layer on top of that file and it changes nothing in it.
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
// day the plan bought one session, and why a week she spends on a plane keeps the day strip it has.
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
// WHAT IS DELIBERATELY NOT HERE: a morning run, a second court session, physio, a stretch - all of
// them plausible, none of them anything the engine models or the week's own read-out mentions. A
// calendar that invents facts is worse than no calendar (weekDays.ts's own header), and furniture
// that comes with a band is not the same as furniture invented to fill a column.
//
// ⚠ AND IT IS A PURE MODULE, no Vue and no store, for the argument `weekDays.ts` already makes about
// itself: a rule with content in it - a table of shapes, a band, a boundary between two drawings -
// is a rule worth pinning on values, and a rule inside a template is decoration that cannot be
// tested. The screen composes; this file decides.
import type { CalendarDay, CalendarWeek, DayBeat, DayKind } from './weekDays'

/** One coloured block in the grid. Hours are PRESENTATION – see the header. */
export interface DayBlock {
  /** hour the block starts, 24h, integer. The grid's rows run 07:00–19:00 (the mockup's span). */
  start: number
  /** length in hours, >= 1 */
  span: number
  /** which `event` colour family the block wears */
  kind: BlockKind
  /** the words in the block, e.g. "Tennis drills". Player copy: short dash, no Cyrillic. */
  label: string
}

/** The design system's `event` palette, one member per kind of hour. All thirteen colours are on
 *  `:root` (src/style.css); six of the twelve KINDS have no caller yet and that is written down at
 *  `DAY_SHAPES` rather than left as a puzzle. */
export type BlockKind =
  | 'training' | 'trainingAlt' | 'gym' | 'school' | 'schoolLong'
  | 'drills' | 'match' | 'matchLong' | 'study' | 'travel' | 'rest'
  | 'tournament'

/** The first and last hour the grid has room for, and the labelled rules between them. 07:00–19:00
 *  is the mockup's own span (docs/design/screenshots/H-calendar-week.webp); a block outside it would
 *  be drawn off the bottom of the card, which a test forbids rather than clamps. */
export const GRID_START_HOUR = 7
export const GRID_END_HOUR = 19
/** Every second hour carries a label and a hairline – the prototype's own 68px-per-two-hours rule. */
export const GRID_HOURS: readonly number[] = [7, 9, 11, 13, 15, 17, 19]

/** THE ORDINARY WEEK, as a set. These four are what a week made of her own training plan contains;
 *  `weekDays.ts`'s `uniform()` builds every other kind of week out of a single one of `away`, `off`,
 *  `school` and `rehab`, and those weeks keep the day strip they already have (see `isOrdinaryWeek`). */
export const ORDINARY_KINDS = ['court', 'gym', 'rest', 'match'] as const
export type OrdinaryKind = (typeof ORDINARY_KINDS)[number]

export function isOrdinaryKind(kind: DayKind): kind is OrdinaryKind {
  return (ORDINARY_KINDS as readonly DayKind[]).includes(kind)
}

/** ⚠ THE BOUNDARY, AND IT IS THE OWNER'S OWN – «для тех, где нет отпусков, чемпионатов и поездок».
 *
 *  The grid replaces the day strip ONLY on a week made of the ordinary training mix. A week she
 *  spends at a tournament, on a family holiday, in an exam blackout, in the off-season or laid up is
 *  a week the engine has told us nothing about the shape of, and a grid of hours for it would be
 *  inventing a day rather than drawing one. Those weeks keep exactly the screen they have today. */
export function isOrdinaryWeek(days: readonly CalendarDay[]): boolean {
  return days.length > 0 && days.every((d) => isOrdinaryKind(d.kind))
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
// gate: tests/calendar-grid.test.ts pins that every band the table carries covers every ordinary day
// kind, and that every band `bandFor` can return has a row at all. The alternative - a missing row
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
 *  ⚠ SIX OF THE TWELVE BLOCK KINDS HAVE NO CALLER, and each is waiting for something specific
 *  rather than being decoration:
 *    `travel`, `tournament`  a trip and a draw are not an ordinary week (see `isOrdinaryWeek`), so
 *                            under today's boundary nothing can reach them. The owner cancelled the
 *                            coach-travel mechanic on 30.07 and the brief says in as many words not
 *                            to invent a caller for `travel`.
 *    `training`, `trainingAlt`, `match`  the SECOND session of a day. At fourteen there is one, and
 *                            drawing two would contradict the sentence under the grid. They are what
 *                            the hours school gives back get filled with in the later bands.
 *    `schoolLong`            a day that is nothing but school. The design draws one (its Friday);
 *                            ours would be an exam week, and an exam week is not an ordinary one. */
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
      { start: 18, span: 1, kind: 'study', label: 'Homework' },
    ],
    // The week's one fitness session, in the same slot the court session takes - so switching a
    // preset moves BLOCKS rather than re-shaping her day (the same stability `GYM_PRIORITY` buys).
    gym: [
      { start: 8, span: 5, kind: 'school', label: 'School' },
      { start: 15, span: 2, kind: 'gym', label: 'Gym' },
      { start: 18, span: 1, kind: 'study', label: 'Homework' },
    ],
    // The booked friendly. It lands on Saturday at every preset (weekDays.ts), which is why this is
    // the one shape with no school in it and why the match owns the middle of the day rather than an
    // hour after school. `matchLong` is the design's own three-hour "Practice Match Play".
    match: [
      { start: 10, span: 3, kind: 'matchLong', label: 'Practice match' },
      { start: 18, span: 1, kind: 'study', label: 'Homework' },
    ],
    // ⚠ A REST DAY DRAWS ONE BLOCK AND SAYS NOTHING ELSE, and the omission is deliberate. Sunday is
    // always the first rest day claimed, so this shape is Sunday far more often than it is anything
    // else - and a school block here would put her in a classroom on a Sunday, which is an assertion
    // and a false one. On the midweek rest days the grid is quiet about school instead of wrong
    // about it, which is the right way round: this screen may omit, it may not invent.
    rest: [{ start: 9, span: 3, kind: 'rest', label: 'Rest' }],
  },
}

/** THE LAYOUT RULE. `band` is a PARAMETER, not a constant, because her week is supposed to change
 *  shape as she grows up (owner, 30.07) – school shrinks, then goes, and the hours it held fill
 *  with something else. Adding a band is adding a row to DAY_SHAPES; it is not a rewrite.
 *
 *  Returns [] for a day kind that is not part of an ordinary week: those weeks never draw a grid at
 *  all (`isOrdinaryWeek`), so an empty list is the honest answer rather than a fallback shape. It is
 *  also [] for a band with no row yet, which is unreachable while `bandFor` returns only populated
 *  bands - and is pinned as unreachable rather than papered over with the school row, because
 *  drawing a fourteen-year-old's school day for an adult would be the invention this file refuses. */
export function dayBlocksFor(kind: DayKind, band: AgeBand): DayBlock[] {
  if (!isOrdinaryKind(kind)) return []
  const shapes = DAY_SHAPES[band]
  return shapes ? shapes[kind].map((b) => ({ ...b })) : []
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

/** The seven columns for a week, or NULL when this week is not one the grid may draw (§ the
 *  boundary above). Null rather than an empty array on purpose: the screen has to choose between two
 *  drawings, and "no columns" and "not this kind of week" are different answers. */
export function weekGridFor(week: CalendarWeek, ageYears: number, dates: readonly number[]): GridDay[] | null {
  if (!isOrdinaryWeek(week.days)) return null
  const band = bandFor(ageYears)
  return week.days.map((d, i) => ({
    index: d.index,
    short: d.short,
    date: dates[i] ?? 0,
    kind: d.kind,
    beat: d.beat,
    blocks: dayBlocksFor(d.kind, band),
  }))
}
