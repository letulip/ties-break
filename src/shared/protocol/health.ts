// HER BODY: the layoff and the knock.
//
// The active injury as the UI sees it, the injury report the stop dialog reads as FACTS rather than
// as English, and the ordinary training week's one event – the knock, and what he decided about it.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

/** Injury severity (Season-Life). Slice B wires the field but never populates it; Slice C does. */
export type InjurySeverity = 'minor' | 'moderate' | 'major' | 'severe'

/** The kid's active injury as surfaced to the UI (schema v12). null = healthy. Always null in
 *  slice B – Slice C (injuries + physio) brings it alive.
 *
 *  ⚠ `sinceWeek` IS NOW SURFACED (round-16 #19), and it used to be the one persisted field the
 *  snapshot deliberately dropped. It is here because the injury popup must be a consequence of
 *  STATE rather than of a screen having been open: the owner took three injuries and was told about
 *  none of them, because `InjuryStopDialog` was gated on the `'injury'` STOP REASON and only
 *  `advanceWeeks` ever sets one. A retirement opens its layoff in `finalizeTournament`, which runs
 *  from the reveal's own command long after the advance returned, so that whole door reported
 *  nothing. `sinceWeek === week` is the same predicate `advanceWeeks` uses, asked where the answer
 *  survives – exactly the argument App.vue's knock gate already makes for reading a snapshot field
 *  instead of a stop reason. See docs/specs/round16-injuries.md §3.
 *
 *  ⚠ NOT A SAVE-SCHEMA CHANGE. `Snapshot` is the derived view the worker posts to the UI; the save
 *  is `WorldState`, which has carried `sinceWeek` since slice C. Nothing is persisted here, so
 *  `SAVE_SCHEMA_VERSION` and `engine/migrations.ts` are untouched. */
export interface SnapshotInjury {
  kind: string
  severity: InjurySeverity
  weeksRemaining: number
  totalWeeks: number
  /** the week the layoff opened. `sinceWeek === Snapshot.week` is "this happened just now". */
  sinceWeek: number
  /** v59: weeks the masseur has already taken off THIS layoff – the gap between `totalWeeks` and
   *  the return date on screen. Absent (never 0) when he has taken none, so every pre-v59 save and
   *  every masseur-less career serialises byte-for-byte as before. */
  weeksSaved?: number
}

// --- ⭐ R2-02: the injury report, as facts ------------------------------------
// WHY THIS TYPE EXISTS. `InjuryStopDialog` recovered four domain facts by reading the news feed's
// ENGLISH – `startsWith(RELEASE_LINE_PREFIX.injury)` for the cancelled entries and a raw
// `startsWith('Entry refunded')` for the money – and the file's own header records the same defect
// biting once before: it matched `'Withdrew from '`, the engine stopped writing that sentence on
// 05.08, and the row that reports what a layoff COST went silently blind for a week. A copy edit
// must not be able to break a domain fact. So the engine states the facts and the dialog spells
// them; the prose stays exactly as it is, because the feed is the player's record.
//
// ⚠ DERIVED, NOT PERSISTED. Everything below is rebuilt by `buildInjuryReport` on every snapshot
// from structured state – `world.injury`, `world.season`, `world.entries`, the layoff window, and
// the STRUCTURED fields of `WorldEvent` (`match.retiredId`, `entryRef`, `amountCents`). No world
// field was added, no migration written and `SAVE_SCHEMA_VERSION` did not move.

/** HOW THE LAYOFF STARTED, as the ENGINE distinguishes it – which is two doors and not a taxonomy.
 *  `world/injury.ts` calls them `InjuryCause = 'week' | 'retirement'` and keeps that type private;
 *  the only trace either leaves on state is `WorldEvent.match.retiredId === KID_ID`, so these three
 *  values are exactly what a snapshot can honestly tell apart – the retirement, the retirement in a
 *  PRACTICE match (`WorldEvent.friendly`), and everything else.
 *
 *  ⚠ `'off-court'` IS VAGUE ON PURPOSE, and the dialog's own comment already argued it: the weekly
 *  roll can land on a training week, a travel week, an arrival week or a family holiday, and the
 *  engine records which of those it was NOWHERE. Naming one would be inventing a fact. */
export type InjuryCircumstanceKind = 'retired-match' | 'retired-friendly' | 'off-court'

/** One tournament on the injury report: the id it is, the words it is called, the week it is in.
 *  The dialog formats the week (`weekLabel`); the wire carries the number. */
export interface InjuryEntryRow {
  /** the `SeasonEvent.id` */
  id: string
  /** the tier's display label, e.g. "Local Open" */
  label: string
  /** the week the tournament is played in */
  week: number
}

/** ⭐ WHAT THIS INJURY DID, AS DATA. Non-null exactly while `injury` is non-null; the dialog that
 *  reads it mounts only on the onset week (`injury.sinceWeek === week`), which is the week
 *  `cancelled` and `refundCents` describe. */
export interface InjuryReport {
  /** the door she came in by */
  kind: InjuryCircumstanceKind
  /** the opponent she stopped against, when the retirement row names one */
  oppName?: string
  /** the round she had reached, said the way a draw sheet says it ("Quarterfinal", "Round of 32") */
  stage?: string
  /** the tournament she stopped in */
  eventLabel?: string
  /** what the layoff CANCELLED at onset: entries whose lists were still open, so the fee came back
   *  and the slot with it. Usually short and often empty – lists close two weeks out, so a 1-2 week
   *  absence reaches nothing at all. */
  cancelled: InjuryEntryRow[]
  /** ...and what it STRANDED: entries inside the layoff whose lists had ALREADY closed, so she keeps
   *  her place, does not appear, and the week resolves as a walkover with the fee forfeited.
   *  "Nothing cancelled" is not "nothing lost" – round-20 #2. */
  stranded: InjuryEntryRow[]
  /** total of the fees that came back with `cancelled`, in cents */
  refundCents: number
}

// --- THE KNOCK (schema v26) --------------------------------------------------
// The ordinary training week's one EVENT: she picks up something sore, and the parent decides
// whether to rest it or send her back out. Owner, 30.07, asking a second time – see engine/knock.ts
// for the whole design, the anti-farming argument and the RNG discipline.

/** What he chose to do about it. `rest` writes the week off; `push` keeps it and loads the dice. */
export type KnockChoice = 'rest' | 'push'

/** A knock, as the world persists it. ⚠ THE ONE PIECE OF NEW PERSISTED STATE in this slice, and the
 *  reason it has to be persisted rather than derived: `choice` is a DECISION THE PLAYER MADE, and a
 *  decision that does not survive a reload is not a decision. */
export interface Knock {
  /** where it hurts – "shoulder", "lower back" … (engine/knock.ts KNOCK_PARTS) */
  part: string
  /** the week she came off court with it */
  sinceWeek: number
  /** she has been sent back out on THIS part before (engine/knock.ts pushedParts) – the thread */
  repeat: boolean
  /** null until he answers. While it is null the advance is BLOCKED, exactly like a pending
   *  tournament: a week cannot resolve around a question nobody answered. */
  choice: KnockChoice | null
  /** the last week this knock still matters. Set when the choice is made (knockUntilWeek): the rest
   *  week for `rest`, KNOCK_PUSH_WEEKS out for `push`. Equals `sinceWeek` while undecided. */
  untilWeek: number
}

/** A retired knock, for the accumulating thread. Bounded by pruning, like `injuryHistory`. */
export interface KnockRecord {
  part: string
  sinceWeek: number
  untilWeek: number
  choice: KnockChoice
  /** it turned into a real injury while he was pushing through it – the thread's bill */
  brokeDown?: true
}

/** Everything the decision dialog shows, DERIVED at snapshot time (no schema cost).
 *
 *  The copy lives in the engine and not in the template for the reason KidScreen's own header gives:
 *  a line that lives in the engine can be tested, and a line that lives in a template is decoration.
 *  `read` is deliberately FOGGED – no number anywhere – which is buildTrainingRead's idiom: the coach
 *  has an opinion, not a probability readout. */
export interface KnockPrompt {
  part: string
  repeat: boolean
  /** what happened, in the parent's voice */
  line: string
  /** what the coach makes of it */
  read: string
  /** ⚠ THE LEGIBILITY REQUIREMENT: one plain sentence per branch, naming the currency he is
   *  spending. The player must be able to see what he traded. */
  restCost: string
  pushCost: string
}
