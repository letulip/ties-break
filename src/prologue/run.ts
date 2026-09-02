// THE RUN THROUGH THE NINE CARDS – phase 2 of docs/specs/childhood-prologue-build-2026-09.md.
//
// What the player has done so far, and everything that is READ OFF it. Pure functions over a plain
// record: no store, no world, no save field, nothing persisted. `cards.ts` is the table; this is the
// only arithmetic phase 2 owns, and there is very little of it on purpose.
//
// ⚠⚠ NO DICE ANYWHERE IN THIS FILE, and that is a ruling rather than an implementation taste. Build
// spec §2.5: the age-12 fork is DERIVED from what the player did, «there are no dice in a derived
// reading», and the trap he named – «на новом заходе она точно должна хотеть» – cannot arise if
// there is nothing to roll badly. This module imports no generator, takes no seed and holds no
// motivation number: `readTwelfth` recomputes its counts from the picks every time it is called.
//
// ⚠ AND IT DOES NOT IMPORT `engine/childhood.ts` – see cards.ts's header. The years this file
// assembles are what `childhoodWalk` consumes, and `tests/prologue-cards.test.ts` is where the two
// are joined, because phase 1's importer-set pin is empty until phase 4 moves it.
import { ECONOMY } from '../engine/economy'
import type { PortraitEmotion } from '../shared/avatarEmotion'
import type { FamilyBackground } from '../shared/protocol'
import {
  APPETITE_AT,
  PROLOGUE_CARDS,
  TOURNAMENT_ANSWER,
  TWELFTH_REASONS,
  TWELFTH_WANTS_MORE,
  entryCostCents,
  type LocalOpenOutcome,
  type PrologueCard,
  type PrologueOption,
  type PrologueYear,
  type TournamentAsk,
} from './cards'

/** ⭐ ONE WEEKEND SHE PLAYED, as the run remembers it – phase 11.
 *
 *  ⚠⚠ IT IS THE BRACKET'S OWN NUMBERS AND NOTHING ELSE, AND THAT IS A LIMIT RATHER THAN A START.
 *  `LocalOpen` already carries `finish`, `rounds` and `wins`; this is those three plus which weekend
 *  it was, and the outcome, which is `outcomeOf` and is derived from `finish` rather than stored
 *  beside it. There is deliberately NO title count, no trophy, no points and no standing: pool.ts's
 *  fourth guard («NO POINTS ARE EVER COMPUTED») is what stops a local under-twelves weekend becoming
 *  a currency, and a run that started counting cups here would be the first half of exactly that. */
export interface PlayedOpen {
  readonly age: number
  readonly index: number
  /** 0 is the title, `rounds` is a first-round exit – the same index `LocalOpen.finish` carries */
  readonly finish: number
  readonly rounds: number
  readonly wins: number
  /** derived from `finish` by `outcomeOf`, kept here so a screen reads one thing */
  readonly outcome: LocalOpenOutcome
}

/** WHAT THE PLAYER HAS DONE. Four fields, and none of them is a number about her. */
export interface PrologueRun {
  /** where the family is from – card 5's origin, and it is the game's own `FamilyBackground` */
  readonly origin: FamilyBackground | null
  /** age -> the id of the option taken that year. Only the decision ages ever appear. */
  readonly picks: Readonly<Record<number, string>>
  /** ⭐ age -> the answer to THAT YEAR'S tournament question (`TOURNAMENT_ANSWER`). Only the ages
   *  whose card carries a `tournament` ask ever appear – 11, 12 and 13; the tenth's answer is its
   *  own `picks` entry, because at ten the question IS the card's decision. `enteredIn` below is the
   *  ONE reader that knows both halves, so nothing else has to. */
  readonly entries: Readonly<Record<number, string>>
  /** ⭐ the weekends she played, in the order she played them. Empty for a childhood that never
   *  entered one, which is most of the reason it is a list and not a count. */
  readonly opens: readonly PlayedOpen[]
}

export const EMPTY_RUN: PrologueRun = { origin: null, picks: {}, entries: {}, opens: [] }

export function withOrigin(run: PrologueRun, origin: FamilyBackground): PrologueRun {
  return { ...run, origin }
}

export function withPick(run: PrologueRun, age: number, optionId: string): PrologueRun {
  return { ...run, picks: { ...run.picks, [age]: optionId } }
}

/** ⭐ THIS YEAR'S ANSWER TO THE TOURNAMENT QUESTION. «Не в этом году» closes THIS year and nothing
 *  else – the owner's own correction – so this writes one age and reads back one age. */
export function withEntry(run: PrologueRun, age: number, answerId: string): PrologueRun {
  return { ...run, entries: { ...run.entries, [age]: answerId } }
}

/** ⭐ ONE WEEKEND, PLAYED AND FILED. Append-only within a run – the childhood moves forwards, and a
 *  weekend that happened cannot un-happen. `startAgain` drops the whole run, which is the only way
 *  this list ever gets shorter. */
export function withOpen(run: PrologueRun, open: PlayedOpen): PrologueRun {
  return { ...run, opens: [...run.opens, open] }
}

// =================================================================================================
// ⭐⭐⭐ THIS YEAR'S TOURNAMENT QUESTION – the one reader, and it knows both halves
// =================================================================================================

/** THE ASK ON THE CARD AT `age`, or null if that card does not carry one. Resolves the twelfth's two
 *  faces first, so the fork's own asking (hers) cannot be read off the face the run did not reach –
 *  the same rule `pickAt` is written under. */
export function askOn(age: number, run: PrologueRun): TournamentAsk | null {
  return cardFor(age, run).tournament ?? null
}

/** ⭐ IS THE ASK STILL OPEN THIS YEAR? Only once the year's own decision is settled: the ask is a
 *  SECOND BEAT on the same card, not a second question asked at the same time. */
export function askAt(age: number, run: PrologueRun): TournamentAsk | null {
  const ask = askOn(age, run)
  if (!ask) return null
  if (yearAt(age, run) === null) return null
  return run.entries[age] === undefined ? ask : null
}

/** ⭐⭐ DID SHE ENTER A TOURNAMENT IN THE YEAR AT `age`? THE ONE READER, and it is the whole of the
 *  rhythm's input.
 *
 *  ⚠ IT ANSWERS OFF TWO DIFFERENT FIELDS AND THAT IS DELIBERATE, not a seam waiting to rot. At ten
 *  the question is the CARD'S OWN DECISION – «Enter her» is what makes that year a `matchplay` year,
 *  and the year's shape and its price both move with it. At eleven and after the year's decision is
 *  something else (the sports school, the fork) and the tournament is a weekend bought beside it, so
 *  it is the lighter `tournament` ask. Two shapes of question, ONE reader, and every consumer –
 *  the schedule, the fork's count, the money – goes through this function rather than through either
 *  field. */
export function enteredIn(age: number, run: PrologueRun): boolean {
  if (askOn(age, run)) return run.entries[age] === TOURNAMENT_ANSWER.enter
  // The tenth: a `matchplay` year is exactly what «Enter her» buys, and it is the engine's own
  // `SessionKind` rather than a flag added for this.
  return pickAt(age, run)?.focus === 'matchplay'
}

/** Every age she was entered in, in order – what `prologueSchedule` takes. */
export function enteredAges(run: PrologueRun): number[] {
  return PROLOGUE_CARDS.map((c) => c.age).filter((age) => enteredIn(age, run))
}

/** The row for an age, with the twelfth resolved. */
export function cardFor(age: number, run: PrologueRun): PrologueCard {
  const row = PROLOGUE_CARDS.find((c) => c.age === age)
  if (!row) throw new Error(`no prologue card at age ${age}`)
  if (age !== 12) return row
  return readTwelfth(run).reading === 'wants-more' ? TWELFTH_WANTS_MORE : row
}

/** The option taken at `age`, or null while the card is still open. Reads whichever face of the
 *  twelfth is the one being drawn, so a pick made on one face cannot be read off the other. */
export function pickAt(age: number, run: PrologueRun): PrologueOption | null {
  const id = run.picks[age]
  if (id === undefined) return null
  return cardFor(age, run).options?.find((o) => o.id === id) ?? null
}

// =================================================================================================
// THE YEARS – what the nine cards come to, in the shape `childhoodWalk` eats
// =================================================================================================

/** ⚠ THE SHARE IS RELATIVE AND THE YEAR IS ABSOLUTE, and this one multiplication is the whole of the
 *  conversion. Phase 1: «`practice` IS ABSOLUTE, NOT RELATIVE TO HER AGE. That is the whole
 *  anti-grind mechanism» – so a card that buys everything a six-year-old can take is 1.0 of a small
 *  appetite, not 1.0 of practice, and buying more than that buys strain. */
function yearOf(age: number, share: number, teaching: number, focus: PrologueYear['focus']): PrologueYear {
  return { age, practice: share * APPETITE_AT[age], teaching, focus }
}

/** The year at `age`, or null while it is undecided. */
export function yearAt(age: number, run: PrologueRun): PrologueYear | null {
  const card = cardFor(age, run)
  // ⚠ THE THIRTEENTH IS THE TWELFTH AGAIN – see `sameAsLastYear` in cards.ts. Whatever the fork
  // settled is what she is still doing when the coach speaks at the handover.
  if (card.sameAsLastYear) {
    const prior = pickAt(12, run)
    if (!prior) return null
    return yearOf(age, prior.share ?? 0, prior.teaching ?? 0, prior.focus ?? 'general')
  }
  if (card.options) {
    const opt = pickAt(age, run)
    if (!opt) return null
    return yearOf(age, opt.share ?? 0, opt.teaching ?? 0, opt.focus ?? 'general')
  }
  return yearOf(age, card.share ?? 0, card.teaching ?? 0, card.focus ?? 'general')
}

/** ⭐ THE YEARS DECIDED SO FAR, in order – `chosenYears` without the requirement that the childhood
 *  be finished. Phase 11 needs it because the rhythm is read while the player is still walking: the
 *  weekend at eleven is scheduled off a childhood that has no twelfth year in it yet.
 *
 *  ⚠ A YEAR WITH NO ANSWER IS ABSENT, NOT ZEROED. A row of zeros would be a claim that she did
 *  nothing that year, and `competingFrom` would then read a childhood that has not happened. */
export function yearsSoFar(run: PrologueRun): PrologueYear[] {
  const out: PrologueYear[] = []
  for (const card of PROLOGUE_CARDS) {
    const year = yearAt(card.age, run)
    if (year) out.push(year)
  }
  return out
}

/** ⚠ AND EVERY YEAR'S TOURNAMENT QUESTION IS ANSWERED TOO. A childhood is not finished while a card
 *  still has an open ask on it – `askAt` returns null once the year holds an answer either way, so
 *  «not this year» finishes the card exactly as «put her name down» does. */
export function isComplete(run: PrologueRun): boolean {
  if (run.origin === null) return false
  return PROLOGUE_CARDS.every((c) => yearAt(c.age, run) !== null && askAt(c.age, run) === null)
}

/** ⭐ THE NINE YEARS, IN ORDER – and this array is exactly what `engine/childhood.ts`'s
 *  `childhoodWalk` takes. It is not fed to it here: phase 1's importer set is pinned empty and phase
 *  4 is the wiring phase. `tests/prologue-cards.test.ts` walks these rows through the real function,
 *  which is what keeps the two shapes from drifting. */
export function chosenYears(run: PrologueRun): PrologueYear[] {
  return PROLOGUE_CARDS.map((c) => {
    const year = yearAt(c.age, run)
    if (!year) throw new Error(`the prologue is not finished – age ${c.age} has no answer yet`)
    return year
  })
}

// =================================================================================================
// THE MONEY – accumulated, and displayed by nothing
// =================================================================================================
//
// ⚠⚠ PHASE 2 ACCUMULATES AND SHOWS NOTHING. Build spec §2.4: each decision names its cost in
// RELATIVE terms («a club is about three times the municipal court») and a running balance is never
// on screen; the total surfaces once, on the handover, which is phase 4. The texture question – a
// rare «удалось скопить $1000» beat versus no money on screen at all – is still open and is HIS:
// «давай сделаем так, я посмотрю и попробую потом, скажу как и что.»
//
// ⚠ AND THERE IS DELIBERATELY NO `balanceCents` HERE. Netting the spend against the origin would be
// a claim about nine years of household income, and phase 2 has no right to make it: §2.4 says the
// player picks where the family is FROM and «the nine years move the number from there», which is
// the arithmetic below, but by how much the family EARNS across those nine years is phase 4's
// economy and his to rule on. A helper that subtracted one from the other would look like an answer.

/** What the childhood has cost so far, in cents. Ages with no answer yet contribute nothing. */
export function spentCents(run: PrologueRun): number {
  let total = 0
  for (const card of PROLOGUE_CARDS) {
    if (card.sameAsLastYear) {
      total += pickAt(12, run)?.costCents ?? 0
    } else if (card.options) {
      total += pickAt(card.age, run)?.costCents ?? 0
    } else {
      total += card.costCents ?? 0
    }
    // ⭐ AND THE WEEKEND, IF THIS YEAR HELD ONE. ⚠ ONLY WHERE THE ASK IS THE LIGHTER CONTROL: at ten
    // the entry's price is already inside the option the player took (1_950_00 against 1_800_00),
    // and adding it again here would bill that weekend twice. `entryCostCents` IS that difference,
    // read off the tenth card rather than typed a second time.
    if (askOn(card.age, run) && enteredIn(card.age, run)) total += entryCostCents()
  }
  return total
}

/** The family's own number, before the nine years move it – the game's own three pictures of what a
 *  family HAS (`ECONOMY.startingFundsCents`), read rather than re-declared. */
export function originStartCents(run: PrologueRun): number {
  return run.origin === null ? 0 : ECONOMY.startingFundsCents[run.origin]
}

// =================================================================================================
// ⭐⭐ THE AGE-12 FORK, DERIVED
// =================================================================================================
//
// His ruling (§2.5): «Развилку в двенадцать лет можно вывести из того, что делал игрок – вот это
// вообще очень хорошо звучит», and the spec names the three things it reads: years of one-to-one
// against group, tournaments entered, and whether any year was left light.
//
// ⚠ ALL THREE ARE READ OFF THE TABLE, NOT OFF A FLAG. Each one is a comparison between the option
// the player took and the options that were on offer beside it that year, so there is no field
// anywhere saying «this one counts as motivation» and none can be added by accident:
//
//   ONE-TO-ONE   the year's answer had the highest `teaching` on the card, and no other answer tied
//                it. That is what «somebody to herself» is in this table.
//   TOURNAMENT   the year's answer is a `matchplay` year. Entering the Local Open at ten IS a
//                matchplay year in the model – the engine's own session kind – so the tournament
//                count needs no flag of its own.
//   LIGHT        the year's answer had the lowest `share` on the card. «She did the smaller of the
//                two things that were on offer», which is exactly what «a year left light» means to
//                a parent looking back.

export type TwelfthReading = 'tired' | 'wants-more'

export interface TwelfthRead {
  readonly reading: TwelfthReading
  readonly oneToOne: number
  readonly tournaments: number
  readonly light: number
  /** ⭐ DRAFT – ONE SENTENCE, folded from `TWELFTH_REASONS`. It was a list of three until 02.09,
   *  when the owner met it and said «мне кажется вот это лишнее»; the LIST went and the FUNCTION
   *  stayed, because what it does is stop a derived fork reading as a die (§2.5). See that table. */
  readonly reason: string
}

/** The decision cards strictly before `age`. The fork reads 5..11, so it reads the four at 8..11. */
function decisionsBefore(age: number, run: PrologueRun): { card: PrologueCard; taken: PrologueOption }[] {
  const out: { card: PrologueCard; taken: PrologueOption }[] = []
  for (const card of PROLOGUE_CARDS) {
    if (card.age >= age || !card.options) continue
    const taken = pickAt(card.age, run)
    if (taken) out.push({ card, taken })
  }
  return out
}

/** Is `taken` the only option on the card with that `teaching`, and the highest? */
function isSoleHighestTeaching(card: PrologueCard, taken: PrologueOption): boolean {
  const others = (card.options ?? []).filter((o) => o.id !== taken.id)
  return others.every((o) => (o.teaching ?? 0) < (taken.teaching ?? 0))
}

/** Is `taken` the lowest `share` on the card, alone? */
function isSoleLowestShare(card: PrologueCard, taken: PrologueOption): boolean {
  const others = (card.options ?? []).filter((o) => o.id !== taken.id)
  return others.every((o) => (o.share ?? 0) > (taken.share ?? 0))
}

/** ⚠ THE THRESHOLD, AND IT IS THE ONLY NUMBER IN THE DERIVATION. A childhood that carried her more
 *  often than it left her alone reaches the twelfth wanting more; one that did not reaches it tired.
 *  There is no scale, no accumulator and nothing stored – `pull` below is a local integer recomputed
 *  from the picks on every call, which is what makes a second run through the same choices give the
 *  same reading and a different set of choices give a different one. */
const WANTS_MORE_AT = 1

export function readTwelfth(run: PrologueRun): TwelfthRead {
  const before = decisionsBefore(12, run)
  let oneToOne = 0
  let tournaments = 0
  let light = 0
  for (const { card, taken } of before) {
    if (isSoleHighestTeaching(card, taken)) oneToOne++
    if (isSoleLowestShare(card, taken)) light++
  }
  // ⚠⚠ TOURNAMENTS ARE COUNTED THROUGH `enteredIn` SINCE PHASE 11, NOT OFF `taken.focus`, and the
  // difference is a year. The count used to be «the year's answer is a `matchplay` year», which was
  // the whole of the question while ten was the only year that asked it. The owner's correction –
  // «дальше тоже можно спрашивать» – put the question on eleven as well, as the lighter ask, and a
  // fork that read only the focus would have counted a girl who entered at ten and eleven as having
  // entered once. Same three signals §2.5 names; one of them now reads the field that holds it.
  for (const card of PROLOGUE_CARDS) {
    if (card.age < 12 && enteredIn(card.age, run)) tournaments++
  }
  const pull = oneToOne + tournaments - light
  // ⚠ THE THREE CLAUSES ARE FRAGMENTS AND THE SENTENCE THAT HOLDS THEM IS THE TABLE'S. Not one
  // comma, colon or full stop is written here – `TWELFTH_REASONS.sentence` carries the punctuation
  // as well as the words, so replacing the fold is the same table edit as replacing a clause.
  const reason = TWELFTH_REASONS.sentence
    .replace(
      '{a}',
      oneToOne === 0
        ? TWELFTH_REASONS.oneToOne.none
        : oneToOne >= before.length - 1 && before.length > 0
          ? TWELFTH_REASONS.oneToOne.most
          : TWELFTH_REASONS.oneToOne.some,
    )
    .replace('{b}', tournaments === 0 ? TWELFTH_REASONS.tournaments.none : TWELFTH_REASONS.tournaments.some)
    .replace(
      '{c}',
      light === 0 ? TWELFTH_REASONS.light.none : light === 1 ? TWELFTH_REASONS.light.some : TWELFTH_REASONS.light.many,
    )
  return {
    reading: pull >= WANTS_MORE_AT ? 'wants-more' : 'tired',
    oneToOne,
    tournaments,
    light,
    reason,
  }
}

// =================================================================================================
// WHAT THE CARD SAYS ABOUT HER – which arm, and why it is derived rather than decorative
// =================================================================================================

export type Warmth = 'cool' | 'warm'

/** ⭐ WHICH ARM OF `her` / `coach` THIS CARD SHOWS – off the SAME counts the fork reads, so there is
 *  one mechanism in this file and not two. Warm when the years so far carried her more often than
 *  they left her alone.
 *
 *  ⚠ IT IS UNOBSERVABLE ON CARDS 5..8 BY CONSTRUCTION, and that is the honest handling of «nothing
 *  has happened yet» rather than a default that quietly makes a claim: no decision has been taken
 *  before those four cards, so their two arms are written as the same sentence and the test asserts
 *  it. A card may not report a year the player has not lived. */
export function warmthAt(age: number, run: PrologueRun): Warmth {
  const before = decisionsBefore(age, run)
  let carried = 0
  let light = 0
  for (const { card, taken } of before) {
    if (isSoleLowestShare(card, taken)) light++
    else carried++
  }
  return carried > light ? 'warm' : 'cool'
}

// =================================================================================================
// ⭐⭐ WHICH FACE THE YEAR WEARS – phase 7, and it is DERIVED for the same reason everything else on
// a card is
// =================================================================================================
//
// THE OWNER, 02.09, on making the prologue look like the game: «надо сделать пролог красивым … по
// типу нашего home screen где большой арт на всю ширину экрана» – and the picture on each card is
// HER, in the age band the art set already has for her (`src/art/prologue.ts` spells the file).
//
// ⚠⚠ THERE IS NO `mood` COLUMN IN `cards.ts` AND THERE MUST NOT BE. A face typed into the table is a
// second statement about the year, kept in step with the first by hand – and the first statement is
// `her` / `coach`, which the run already chooses an arm of. So the picture reads the SAME counts the
// two sentences read, and a card cannot show a girl who is delighted above a line saying she has had
// enough. One mechanism, three consumers.
//
// THE MAPPING, and every arm of it is one of the three the owner named – «she asks to go back
// (happy), she is tired of it (tired), she wants more (serious)»:
//
//   ages 12 and 13   the twelfth's own reading: `tired` -> tired, `wants-more` -> serious. The
//                    thirteenth follows the twelfth because the YEAR does (`sameAsLastYear`), so the
//                    picture follows the fork exactly as the numbers do.
//   ages 6..11       `warmthAt`: a childhood that has carried her more often than it left her alone
//                    shows her enjoying it, and one that has not shows her ordinary.
//
// ⚠ AND IT IS UNOBSERVABLE ON THE EARLY CARDS BY CONSTRUCTION, exactly as `warmthAt` is. No decision
// has been taken before the cards at 5, 6, 7 and 8, so `warmthAt` is `cool` there whatever the
// player does and those cards always draw `norm`. That is the honest handling of «nothing has
// happened yet»: a picture may not report a year the player has not lived, which is the same rule
// the two arms of `PrologueRead` are written under.

/** The face for one year of the childhood. Pure, no art and no URL – see `src/art/prologue.ts`. */
export function moodAt(age: number, run: PrologueRun): PortraitEmotion {
  // The fork and the year that follows it. `readTwelfth` recomputes from the picks, so this is the
  // same reading the twelfth's own card and its folded reason are drawn from.
  if (age >= 12) return readTwelfth(run).reading === 'tired' ? 'tired' : 'serious'
  return warmthAt(age, run) === 'warm' ? 'happy' : 'norm'
}
