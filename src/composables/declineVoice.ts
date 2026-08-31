// ⭐⭐⭐ ROUND 31 #9 – SHE IS 93% OF HER PEAK, AND SOMEBODY FINALLY SAYS SO.
//
// THE OWNER'S ASK, 31.08: «да, заведи находку про пик и спад, и тренер вполне может что-то такое
// говорить. Да и она сама в конце сезона … могла бы что-то тоже сказать на эту тему. Может уже
// сейчас что-то можем сделать в эту сторону?»
//
// AND HIS RULING ON THE NINE DRAFTS, the same day: «мне нравятся все вариации диалогов, они могу
// добавить жизни и разнообразия мне кажется, давай все использовать, сможем сделать разумно?»
//
// ⚠⚠ EVERY SENTENCE IN THIS FILE IS HIS, APPROVED VERBATIM, AND IS NOT AN AGENT'S TO EDIT
// (CLAUDE.md invariant 4). He read exactly this text and accepted it. Re-wording, tightening or
// re-punctuating one of them is the thing that invariant exists to forbid – and the corollary that
// makes it cheap to obey is that a string nobody touched cannot regress.
//
// ⚠ WHY THEY LIVE HERE AND NOT IN THE THREE COMPONENTS. Three surfaces say one thing – the same
// decline, in three voices – and copy split across three `.vue` files is copy that drifts. It is
// also the house law working for us: the owner's words belong on the script side, never inside a
// Vue markup block (tests/template-copy-rules.test.ts), and a module the three import is the script
// side of all three at once. Nothing here is engine: it is display, it draws no MAIN randomness, and
// the engine cannot import it (invariant 1 runs the other way).
//
// ⚠⚠ AND THE OPENING TAG OF A VUE MARKUP BLOCK IS NOT SPELLED OUT ANYWHERE IN THIS FILE, WHICH IS
// NOT FUSSINESS – IT IS CLAUDE.md's raw-`indexOf` HAZARD, MET IN THE WILD. `tests/coach-voice.test.ts`
// splits every source file at the index of that tag; the first draft of this header quoted it, no
// closing tag existed to bound the slice, and the "rendered template" the sweep then read was the
// whole rest of the file. Six prose sentences about the OWNER (approved by him, seen on his career)
// came back as the game calling a professional by a masculine pronoun. Nothing was wrong with either
// the sweep or the copy: a marker rotted into a comment and a region silently widened, which is the
// failure the source helpers exist to stop. Quote that tag here again and the test goes red again.
//
// ⚠⚠ THE TRAP, AND IT IS ROUND 31 #4's TRAP WEARING DIFFERENT CLOTHES. A line drawn afresh on every
// read changes every time the screen is opened, and he will report it as a defect exactly as he
// reported the re-rolling first-round opponent (19 of 27 tournaments). So NOTHING here draws off
// MAIN and nothing is keyed on the week:
//
//   * the retirement card's rung   – NO DRAW AT ALL. The band picks it, so the same share is the
//                                    same sentence on every machine, for ever.
//   * the coach's line             – `seed:coachage:<eventId>`, the event's own sub-stream, which is
//                                    the machinery `coachSays` already runs on (`coachsay` for the
//                                    field clause, `coachdraw` for the seam clause, `coachage` for
//                                    this one). Keyed on the EVENT, so a card holds still while it
//                                    sits on screen and two cards in the feed do not echo.
//   * her own line                 – `seed:decline:<seasonYear>`, once per SEASON. It cannot move
//                                    inside the season it is about.
//
// ⚠ WHY HER KEY CARRIES THE SEASON'S YEAR AND NOT ITS INDEX, which is what the ledger wrote. The
// wrap-up card is drawn off `lastSeasonSummary`, and the only identity a summary carries is
// `seasonYear` – `seasonYear(seasonIndex)` in shared/dates.ts, i.e. `EPOCH_YEAR + seasonIndex`, a
// bijection with the index. The season's INDEX is not recoverable from the card without exporting
// the epoch, and `seasonIndexOf(snapshot.week)` is the WRONG key: the summary outlives the week it
// was banked on, so a week-derived index would re-roll her line the moment the parent advanced.
// Same season, same stream; a constant offset in the key string changes nothing else.
//
// ⚠ AND `seed:decline` IS ALREADY TAKEN, one colon shorter: `declineSpreadOf` (engine/development.ts,
// round 31 #10) draws her decline age off it. `${seed}:decline:${year}` is a different string and
// therefore a different stream – `rngFromSeed` hashes the whole key – so this file cannot disturb
// the age her body was dealt. Worth saying out loud because the two are about the same subject.
import { rngFromSeed } from '../engine/rng'
import type { FieldStrength } from '../engine/season/preview'

/** ⭐⭐ PAST HER PEAK, AND THE ONLY GATE ANY OF THIS HAS. `Snapshot.physicalShare` is exactly 1
 *  until she is past her OWN `declineStart` (see `physicalShareOf`, engine/world/endings.ts), so
 *  `< 1` reads her career's own curve – the pair round 31 #10 drew for her, pulled earlier by the
 *  weeks she has lost – without this file ever naming an age.
 *
 *  ⚠ IT MUST NEVER READ `ECONOMY.development.ageCurve.declineStart`. That constant is the shipped
 *  29 for every career ever played, which is exactly the mistake round 31 #10 was about.
 *
 *  ⚠ ABSENT IS AT-PEAK, DELIBERATELY. A hand-built snapshot in a test, or any reader that has not
 *  been handed the number, gets silence rather than a sentence about a decline nobody measured. The
 *  quiet failure is the safe one here: the defect this item fixes is a missing readout, and a
 *  readout invented from `undefined` would be a worse version of the same defect. */
export function pastHerPeak(share: number | undefined | null): boolean {
  return typeof share === 'number' && Number.isFinite(share) && share < 1
}

/** THE THREE RUNGS OF ONE DECLINE, ordered by how far gone she is, and the share picks between them.
 *
 *  ⚠⚠ THEY ARE RUNGS AND NOT ALTERNATIVES, which is the whole reason there is no draw here. The
 *  three drafts read as three ways of saying the same thing; they are not. They are 95-100%, 85-95%
 *  and below 85% of the body she used to have, and the number that decides is already on the
 *  snapshot. A pool would have made her decline a coin toss, and re-rolled it on every open. */
export const DECLINE_RUNGS: readonly { readonly atLeast: number; readonly line: string }[] = [
  {
    atLeast: 0.95,
    line:
      'She is not slower than last year by much – a step, maybe two, over a long match. It is the third set where the year shows.',
  },
  {
    atLeast: 0.85,
    line:
      'Nothing has fallen off a cliff. It is just that the season costs her more than it used to, and pays the same.',
  },
  {
    atLeast: 0,
    line:
      'Her best tennis was three years ago. She knows the number as well as you do, and she has not brought it up once.',
  },
]

/** (a) THE RETIREMENT CARD'S RUNG, or null while she is still at her peak.
 *
 *  ⚠ ADDED BENEATH HIS ROUND-30 LEDE, NEVER REPLACING IT. He approved that sentence in round 30 #7
 *  and invariant 4 protects it from us as much as from anyone; the card renders it in its own
 *  paragraph so `.retire-lede` stays byte-identical and the pin on it stays green.
 *
 *  ⚠ THE BANDS ARE CLOSED AT THE TOP AND OPEN AT THE BOTTOM – `>= 0.95`, then `>= 0.85`, then the
 *  rest – so 95.2% (his career at 31.0) is the first rung and 93.1% (at 31.7) is the second, which
 *  is where he was told she is. `atLeast: 0` on the last is a total function, not a fallback: a
 *  poked save at share 0 still gets a sentence rather than an empty paragraph. */
export function declineRung(share: number | undefined | null): string | null {
  if (!pastHerPeak(share)) return null
  const s = share as number
  return (DECLINE_RUNGS.find((rung) => s >= rung.atLeast) ?? DECLINE_RUNGS[DECLINE_RUNGS.length - 1]).line
}

/** (b) WHAT THE COACH SAYS ABOUT HER AGE – the drawn pair. */
export const COACH_DECLINE_LINES: readonly string[] = [
  'Her legs are a year older than this draw thinks.',
  'She will want the first set. The third one is not hers the way it was.',
]

/** ...and the CONDITIONAL one, which is the coach beginning to advise which weeks to take. It is a
 *  pair rather than a line and the choice between its halves is never a draw: the field's own
 *  strength decides, so «this is one to choose» can only ever appear on a week she can win.
 *
 *  ⚠ `even` HAS NO MEMBER AND THAT IS THE POINT. A field the engine calls even is a field the coach
 *  has no advice about, and a third arm invented for it would be advice the game cannot back. */
export const COACH_WEEK_CHOICE: Partial<Record<FieldStrength, string>> = {
  favourite: 'At this age you choose your weeks. This is one to choose.',
  strong: 'At this age you choose your weeks. This is not one of them.',
}

/** The pool a given card draws from: the two, plus the conditional one where the field has an
 *  opinion. Exported so a test can assert the membership rather than infer it from what rendered.
 *
 *  ⚠⚠ WHY THE CONDITIONAL LINE IS A POOL MEMBER RATHER THAN A BRANCH IN FRONT OF THE POOL. The
 *  obvious shape – say the paired line whenever the field is strong or favourite, otherwise draw –
 *  makes the coach say «At this age you choose your weeks» on roughly two cards in three for the
 *  rest of her career, which is `DRAW_CLAUSES`'s own warning in SeasonScreen.vue: a clause that
 *  fires every time stops being information and becomes wallpaper. As a member it appears about a
 *  third of the time and only ever with the half the field earned, so both of his rulings hold –
 *  all nine lines are used, and which half of the pair speaks is read and not rolled. */
export function coachDeclinePool(strength: FieldStrength): readonly string[] {
  const paired = COACH_WEEK_CHOICE[strength]
  return paired ? [...COACH_DECLINE_LINES, paired] : COACH_DECLINE_LINES
}

/** (b) THE COACH'S LINE for one event, or null while she is still at her peak.
 *
 *  ⚠ THE EVENT'S OWN SUB-STREAM, keyed exactly as the plaque's other two clauses are, so the card
 *  says the same thing every time it is looked at and two cards on screen together do not echo each
 *  other. The week is deliberately NOT in the key: a line that changed as the tournament came closer
 *  is round 31 #4 again. */
export function coachDeclineLine(
  share: number | undefined | null,
  seed: string,
  eventId: string,
  strength: FieldStrength,
): string | null {
  if (!pastHerPeak(share)) return null
  const pool = coachDeclinePool(strength)
  return pool[Math.floor(rngFromSeed(`${seed}:coachage:${eventId}`)() * pool.length)]
}

/** (c) HER OWN THREE, at the end of a season. */
export const HER_DECLINE_LINES: readonly string[] = [
  '«I can still play. I just cannot play three of them back to back any more.»',
  '«Ask me again next winter. You will get the same answer, and one year it will not be true.»',
  '«I am not finished. I am just not twenty-six.»',
]

/** (c) HER LINE for one season, or null while she is still at her peak.
 *
 *  ⚠ ONCE PER SEASON, and the key is the season the card is ABOUT rather than the week it is read
 *  on – see the header. The wrap-up card survives the advance that follows it, so a week in this key
 *  would change her sentence under the parent while he was still reading it. */
export function herDeclineLine(
  share: number | undefined | null,
  seed: string,
  seasonYear: number,
): string | null {
  if (!pastHerPeak(share)) return null
  return HER_DECLINE_LINES[
    Math.floor(rngFromSeed(`${seed}:decline:${seasonYear}`)() * HER_DECLINE_LINES.length)
  ]
}

/** EVERY SENTENCE THIS FILE CAN PUT ON A SCREEN, for the guards that have to sweep all of them –
 *  the house law (no Cyrillic, no long dash) and the invariant-4 byte pins. Kept here so a tenth
 *  line added later is swept by construction rather than by somebody remembering to list it. */
export const ALL_DECLINE_LINES: readonly string[] = [
  ...DECLINE_RUNGS.map((r) => r.line),
  ...COACH_DECLINE_LINES,
  ...Object.values(COACH_WEEK_CHOICE),
  ...HER_DECLINE_LINES,
]
