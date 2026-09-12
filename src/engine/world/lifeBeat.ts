// THE LIFE BEAT – the week the game stops because SHE said something (the private life, wave 2).
//
// The birthday is the precedent this generalises (`world/birthday.ts`), and the two share a law:
// the ONLY way time moves again is an answer, and the engine re-validates it. What is NEW here, and
// what the birthday could never be, is that the beat is HER SPEAKING – so the dialog has no X, and
// walking away is not among the things a player can do with it.
//
// =================================================================================================
// THE FIVE RULES THIS FILE IS (wave-2 runbook §2), and where each one lives below
// =================================================================================================
//
// 1. THE BLOCK CONTRACT. `'life'` is a refusal at the top of `advanceWeeks` (`advanceRefusal`,
//    world/multiWeek.ts) AND a reason collected inside its loop – a beat may share a week with a
//    tournament, an injury or the fork, and R11-1's rule is that a week which is several things
//    reports all of them. The two halves are in world/multiWeek.ts and world.ts respectively; the
//    predicate both of them ask is `pendingLifeBeat` below.
//
//    ⭐⭐ v74 T15 – AND THE CONTRACT IS **PER KIND** SINCE 11.09: `LIFE_BEAT_BLOCKING` declares, for
//    every kind and by type, whether it stops the week, and `pendingLifeBeat` narrows to the rows
//    that do. Tier 2's two block exactly as they always did; tier-1 small talk does not – it is
//    «soft – answerable, never lost» (who-she-is §5b), so it is answered from a Home card inside a
//    three-week window and the week never waits for it. NOTHING ELSE about rules 2–5 changes for it:
//    the same record, the same re-validation, the same prompt, the same dialog.
//
// 2. ⭐ THE RECORD IS THE QUEUE. A row whose `answer` is null is waiting; several beats in one week
//    are answered one dialog at a time, in `lifeLog` order. There is deliberately no second boolean –
//    a `pending` flag beside the answer is one fact with two sources of truth, and they desync.
//
// 3. ENGINE-SIDE RE-VALIDATION (CLAUDE.md invariant 1). `answerLifeBeat` re-derives the prompt and
//    checks the option id against the list the engine itself offered, exactly as `chooseGift`
//    re-derives the birthday's four. A stale dialog cannot record an answer this beat never made.
//
// 4. ⚠⚠ THE NO-CENTS RULE. An answer is NEVER a purchase: `addEvent` is called with no
//    `amountCents`, so nothing folds into `accrueFinance` or `careerTotals` (ledger.ts gates the
//    accrual on the field being present and non-zero), and there is no price in any of its words.
//    There is no cents value anywhere in this file, which is what stops "just add a small cost"
//    being a one-line edit – it would be a schema change first.
//
// 5. `buildLifeBeatPrompt` ASSEMBLES THE COPY ENGINE-SIDE from the pools below, so the dialog
//    renders what it is handed, verbatim, and owns no sentence of its own – `buildBirthdayPrompt`'s
//    own contract, and the only shape under which her voice can be tested at all.
//
// =================================================================================================
// ⚠⚠ THE FENCE – TEMPERAMENT COLOURS THE WORDING AND NOTHING ELSE (who-she-is §3, verbatim)
// =================================================================================================
//
//   «No fork want. Her college/tour want at the fork stays on its own draw – temperament colours
//    HOW she says it, never WHAT she wants. Otherwise temperament becomes a career script.»
//
// So this file has TWO halves and the wall between them is load-bearing:
//
//   * `drawForkWant` / `forkWantWeights` take `standing`, `spirit` and `bond` and NOTHING ELSE.
//     There is no `Temperament` parameter on either of them, which is the strongest form the fence
//     can take – a temperament term cannot be added to the maths without changing a signature.
//   * `HER_LINE` is indexed BY temperament, and it is the only thing in this file that is.
//
// ⭐⭐⭐ v74 T17 ADDS A SECOND WALL OF THE SAME KIND, ONE LEVEL IN. The `stop` want now has ROOTS
// (`ECONOMY.life.forkStop`) and a DRIVER worded from them – and the driver is spent on wording and
// nothing else: `forkWantWeights` never calls `forkStopDriverOf`, so the same three inputs produce
// the identical three weights whether or not anything ever reads a driver. A reading that explains a
// draw must not be able to become a term in it, which is who-she-is §3's own argument applied to the
// thing §3 was written about.
//
// ⚠ AND SPIRIT IS READ, NEVER WRITTEN. Nothing in this file touches `world.spirit`: the want-draw
// reads it, the parent's answer moves `bond` alone (§4a.2's law – life moves spirit, his words move
// the standing). `applyBondDelta` is the only writer this file calls.
import { pickInt, rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
import { applyBondDelta, bondBandOf, moodRegisterOf, spiritBandOf, temperamentFor, temperamentOpenness, type Temperament } from '../spirit'
import { kidAgeExact } from './age'
// ⭐ `seasonIndexOf` JOINS `addEvent` HERE IN v74 T8 – the engine's ONE definition of «this season»,
// and the season the tier-1 cap is counted within (`smallTalkThisSeason`, §7). `ledger.ts` is a leaf
// this module already imports at runtime, so no arrow moves and no cycle appears.
import { addEvent, seasonIndexOf } from './ledger'
// ⚠ FROM ./loveEpisodes, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the second one this file
// records, on `guardNotEndedForGood`'s own precedent just below. Both selectors were DECLARED
// here by T1; T4 gave `engine/spirit.ts` a reader for `activeEpisode` (the effective baseline), and
// this module imports `../spirit` at runtime, so leaving them here would have closed a value loop.
// They moved verbatim to the leaf and nothing about either of them changed.
// ⭐ v74 T6 ADDED `knownPartner` TO THE SAME IMPORT – «does he KNOW», the second question that leaf
// asks of the list, and the one the delivery fired on.
// ⚠⚠ AND v75 T4 TOOK IT BACK OFF THIS LINE, WHICH IS RECORDED RATHER THAN QUIETLY DELETED (ruling B).
// `knownPartner` answers «is someone there now AND has he been told», and the second half of that is
// exactly what a told-late ending cannot satisfy – it returned null for precisely the episodes the
// scene is about. §6 walks `loveEpisodesOf` itself now. The SELECTOR is untouched and still exported
// from the leaf: `DiaryFacts.partnerKnown` reads it through `world/snapshot.ts`, which is the reading
// it was written for, and nothing about it changed.
// ⭐⭐ v75 T2 ADDS `endEpisode`, THE LEAF'S FIRST WRITER – the ONE line in the engine that sets
// `endedWeek`. §8 below owns the hazard that decides WHETHER it is called; the leaf owns what an
// ending IS, beside the selector that stops reporting her as attached the moment it is written.
import { activeEpisode, endEpisode, loveEpisodesOf } from './loveEpisodes'
// ⚠ FROM ./constants, NOT ./endings, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the same swap
// `world/entries.ts` records at its own import. `endings.ts` imports THIS module (it raises the
// fork-opinion row and asks `pendingLifeBeat` before it will answer the fork), so an import back
// into `endings.ts` would close a runtime loop. `constants.ts` is the bottom of the package's graph
// and `endings.ts` re-exports the guard from there anyway, so nothing about the semantics moves.
import { guardNotEndedForGood } from './constants'
// ⭐⭐ THE PRESENCE AXIS' TWO IMPORTS (11.09, the вычитка fold) – and both of them are «ask the one
// copy» rather than «re-type the rule». `awayVoice` is R2-18 / ARCH-07's single spelling of «she
// lives elsewhere and the parent HEARS about the week»; `diaryLifeStageFor` is the single spelling
// of which stage a girl of this age on this week is in. Both leaves are type-and-calendar only (no
// world state, no RNG, no import back into `world/`), so neither closes a cycle.
import { awayVoice } from '../diary/words'
import { diaryLifeStageFor } from '../diary/facts'
import { schoolIsOver } from '../kidLife'
import type { BondBand, DiaryLifeStage, LifeBeatKind, LifeBeatPrompt, LifeBeatRecord, LoveEpisode, MoodRegister, SoftBeatInvite } from '../../shared/protocol/narrative'
import type { WorldState } from '../world'

// =================================================================================================
// 1. THE QUEUE
// =================================================================================================

/** ⭐ THE RECORD IS THE QUEUE. A row whose `answer` is null is waiting; several beats in one week
 *  are answered one dialog at a time, in `lifeLog` order. There is deliberately no second boolean –
 *  a `pending` flag beside the answer is one fact with two sources of truth, and they desync.
 *
 *  ⚠ ABSENT `lifeLog` READS AS AN EMPTY LIFE, NOT AS AN ERROR. v73 makes the field required and
 *  back-fills `[]`, so no save reaching this line can be missing it – the `?? []` is the same
 *  courtesy `birthdayHistory` extends to probe worlds hand-built in tests, which predate the field
 *  and have no business crashing a read. */
export function lifeLogOf(world: WorldState): readonly LifeBeatRecord[] {
  return world.lifeLog ?? []
}

/** ⭐⭐⭐ v74 T15 – WHICH KINDS STOP THE WEEK, DECLARED PER KIND AND **TOTAL BY TYPE**
 *  (who-she-is §5b's «SOFT BLOCK CONCRETIZED» amendment, 11.09: «the beat-kind registry declares
 *  `blocking` per kind – total by type, so every future kind must choose»).
 *
 *  ⚠⚠ A `Record<LifeBeatKind, boolean>` AND NEVER A LIST OF THE BLOCKING ONES, which is the same
 *  argument `LIFE_BEAT_OPTIONS`, `ANSWER_EVENT` and `HER_LINE` all make in this file: a list makes
 *  silence the default, and the next kind ships soft by FORGETTING. The total record makes a missing
 *  kind a COMPILE error, so «does this stop the week» is a sentence somebody had to type.
 *
 *  ⚠ AND IT IS A PROPERTY OF THE TIER, which is why it belongs beside the kinds rather than at the
 *  two stop sites. §5b prices tier 2 «blocks the week: yes» and tier 1 «soft – answerable, never
 *  lost»: the fork's opinion and the news that someone exists are both the week she said something
 *  the parent must answer before time may move (rule 1 at the head of this file). `'small-talk'` is
 *  FALSE – it is texture, it is answered from a Home card inside a three-week window, and the week
 *  never waits for it. */
export const LIFE_BEAT_BLOCKING: Record<LifeBeatKind, boolean> = {
  'fork-opinion': true,
  met: true,
  'small-talk': false,
  // ⭐⭐⭐ v74 T17 – TRUE, AND THIS ONE WORD IS THE WHOLE MECHANISM OF THE COUNSEL ARC. `answerFork`
  // already refuses while `pendingLifeBeat` is non-null, so a blocking row raised at the moment her
  // opinion is answered holds the fork shut until the coach has been heard – no new guard, no new
  // ordering rule, and the same mechanical-order trick her own row has used since wave 2.
  'fork-counsel': true,
  // ⭐⭐⭐ v75 T4 – TRUE, AND IT IS TIER 2's OWN PRICE RATHER THAN A NEW RULE. §5b prices «the news
  // that someone exists» as a week the parent must answer before time may move; the week it is over
  // is the same beat from the other end, and a career that could tick past it would answer her by
  // walking away. ⚠ IT BLOCKS IN BOTH REGISTERS – a told-LATE ending is still something she has just
  // said out loud, and the lateness is hers rather than a reason to hear it less.
  ended: true,
}

/** The beat waiting to be answered, or null. The FIRST unanswered row in `lifeLog` order – so a week
 *  that raised two of them asks about them one at a time and never loses the second.
 *
 *  ⭐⭐ v74 T15 – AND «WAITING» NOW MEANS **BLOCKING** AND UNANSWERED. This predicate is what both
 *  halves of the block contract ask (rule 1), so narrowing it here is what makes a soft row stop
 *  being a stop: `advanceRefusal` and the `'life'` StopReason read this function and nothing else,
 *  and `LIFE_BEAT_BLOCKING` is the one place the answer lives. A soft row and a blocking beat
 *  coexist untouched – the soft one is found by `liveSoftBeat` below, on its own window.
 *
 *  ⚠⚠ AND THE NARROWING IS ALSO WHAT KEEPS AN EXPIRED ROW HARMLESS. A soft row that was never
 *  answered keeps `answer: null` FOREVER (that is «never lost = the ROW, not the chance»), so an
 *  un-narrowed predicate would have parked every career behind a conversation whose moment passed
 *  three weeks ago and which nothing on any screen can answer. */
export function pendingLifeBeat(world: WorldState): LifeBeatRecord | null {
  return lifeLogOf(world).find((row) => row.answer === null && LIFE_BEAT_BLOCKING[row.kind]) ?? null
}

/** ⭐⭐⭐ v74 T15 – THE SOFT ROW THAT IS STILL ANSWERABLE, or null. The Home card's whole existence
 *  condition, and the second half of what the queue means now.
 *
 *  ⚠⚠ THE WINDOW IS DERIVED AND NEVER STORED (`ECONOMY.life.smallTalkTtlWeeks`, 3 = the raise week
 *  and the two after it). `week − row.week` is the whole of the arithmetic – there is no `expired`
 *  flag, no TTL field and no new persisted state anywhere in this step, which is `activeEpisode`'s
 *  own discipline and the queue's own reason for having no `pending` boolean.
 *
 *  ⚠ `>= 0` REFUSES A ROW FROM THE FUTURE rather than reading it as live. No state the sim produces
 *  can hold one (`raiseLifeBeat` stamps `world.week`), so this is for the probe worlds hand-built in
 *  tests and benches – and a negative age answering «live» would be a window nobody could close.
 *
 *  ⚠ THE **FIRST** LIVE ONE, IN LOG ORDER, which is `pendingLifeBeat`'s own rule: the raise gate
 *  allows only one live soft row at a time, so on every state the sim produces there is at most one –
 *  and where a hand-built world holds two, the older is the one that is about to expire and is
 *  therefore the one to ask about first. */
export function liveSoftBeat(world: WorldState): LifeBeatRecord | null {
  const ttl = ECONOMY.life.smallTalkTtlWeeks
  return (
    lifeLogOf(world).find(
      (row) =>
        row.answer === null &&
        !LIFE_BEAT_BLOCKING[row.kind] &&
        world.week - row.week >= 0 &&
        world.week - row.week < ttl,
    ) ?? null
  )
}

// ⚠⚠ `loveEpisodesOf` AND `activeEpisode` LEFT THIS FILE IN T4 (11.09) AND THE MOVE IS A CYCLE FIX,
// not a tidy-up – the same one `guardNotEndedForGood` records at `world/constants.ts`. They were
// declared here by T1 and they are imported back at the top of this file now, VERBATIM and unchanged,
// because `engine/spirit.ts` acquired a reader: `accrueSpirit` walks toward `baseline +
// attachmentLift` while the slot is full, and THIS module imports six values from `../spirit` at
// runtime. `spirit.ts -> lifeBeat.ts` would have closed the loop. See `world/loveEpisodes.ts`.

// =================================================================================================
// 2. HER WANT AT THE FORK – ⚠⚠ AND NO TEMPERAMENT TERM ANYWHERE IN IT
// =================================================================================================

/** THE THREE THINGS SHE MAY WANT when school ends – the fork's own three answers seen from her side.
 *  `tour` is what `ForkAnswer` spells `continue`: the parent's word for it is a decision to carry
 *  on, hers is the thing she would be carrying on into. `FORK_WANT_ANSWER` below is the one place
 *  the two vocabularies are mapped onto each other. */
export const FORK_WANTS = ['college', 'tour', 'stop'] as const
export type ForkWant = (typeof FORK_WANTS)[number]

/** ⭐ ONE STEP OF A LEAN, AND THE CAP ON EVERY ONE OF THEM. `BIRTHDAY_ASK_TILT`'s own shape (1.5)
 *  and its own law, restated: a TENDENCY, never a rule. At full lean the favoured want carries 1.6x
 *  the weight of an unfavoured one, which leaves all three common for every girl at every reading –
 *  the anti-stereotype guard who-she-is §3 asks for, applied to a want instead of to an ask.
 *
 *  ⚠ DRAFT FOR THE BENCH, in the sense §4's numbers are: the SHAPE is ruled (a worn girl leans stop,
 *  a close one dares more) and the magnitude is ours until it is measured. */
export const FORK_WANT_TILT = 1.6

/** How far this reading leans, 0..1, as one number the three tilts share. Linear on purpose: a
 *  curve here would be a second tunable nobody has measured. */
function lean(share: number): number {
  return 1 + (FORK_WANT_TILT - 1) * Math.min(1, Math.max(0, share))
}

/** A distance read as a 0..1 share, clamped at both ends. ⚠ `lean` did this inline for its own
 *  argument; T17's `stop` weight is not a lean and needs the same clamp said out loud. */
function share(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** ⭐⭐⭐ v74 T17 – THE TWO ROOTS OF A `stop`, READ ONCE. How far she is BELOW spirit's baseline and
 *  how far the home is BELOW bond's start, each as a 0..1 share.
 *
 *  ⚠⚠ ONE READING, TWO CONSUMERS, AND THAT IS THE WHOLE REASON THIS IS A FUNCTION. The weight
 *  (`forkWantWeights`) and the wording (`forkStopDriverOf`) must be talking about the SAME girl: two
 *  copies of «how worn is she» would be two sources of truth for one fact, and rule 3 at the head of
 *  this file exists because those disagree the first time somebody edits one of them. `close` stays
 *  inline in the weights because nothing else reads it.
 *
 *  ⚠ `strained` IS THE MIRROR OF `close`, measured off `bond.start` in the other direction, so 70
 *  reads as neutral from both sides and a neutral home leans nothing either way. */
function stopRootsOf(spirit: number, bond: number): { worn: number; strained: number } {
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  return {
    worn: share((s.baseline - spirit) / (s.baseline - s.min)),
    strained: share((b.start - bond) / (b.start - b.min)),
  }
}

/** ⭐⭐ WHAT SHE WANTS, AS THREE WEIGHTS – the whole of the ruling of 09.09, and the whole of the
 *  fence with it.
 *
 *  ⚠⚠ THREE INPUTS AND THERE IS NO FOURTH. `standing` is where she got to on the ladder (0..1 – see
 *  `forkStandingOf`), `spirit` is how she IS this week and `bond` is what the parent has built with
 *  her. Temperament is not a parameter of this function and must never become one: who-she-is §3's
 *  fence gives it the WORDING and nothing else, and «otherwise temperament becomes a career script».
 *  The wall is a signature rather than a comment precisely so that it cannot be crossed quietly.
 *
 *  The three leans, each with its own reason:
 *
 *    * HER STANDING pulls `tour` up and `college` down, and both halves are one fact read twice: a
 *      girl who climbed wants the thing she climbed toward, and a girl who did not is the one for
 *      whom a place at a university is worth having. Nothing here pulls `stop`, because failing to
 *      climb is not the same as being finished.
 *    * BEING WORN DOWN pulls `stop` up – «a worn-down girl leans `stop`» (ruled 09.09). Measured off
 *      the distance BELOW spirit's baseline, so a girl at or above 70 has no such lean at all.
 *    * A CLOSE HOME pulls `tour` up – «a close one dares more». Measured off the distance ABOVE
 *      bond's start, for the same reason: 70 is the neutral reading and neutral must mean neutral.
 *    * ⭐⭐⭐ v74 T17 – AND A STRAINED HOME PULLS `stop` UP, which is `close` READ THE OTHER WAY: the
 *      distance BELOW bond's start, mirror for mirror, so one number cannot mean «neutral» on one
 *      side of 70 and «a little cold» on the other.
 *
 *  ⚠⚠ THE `stop` WEIGHT IS NO LONGER A LEAN, AND THIS IS THE OWNER'S RULING OF 11.09 MADE ARITHMETIC.
 *  It read `lean(worn)`, which bottoms out at 1.0 like every other lean – so the FLOOR of P(stop) was
 *  ~22% at top standing in a close home and ~24% at zero standing, whatever the girl. He met it in
 *  play at eighteen («моей 18, я ещё игры не видел») on a healthy girl in a close home, and a quarter
 *  of all players would have met it at the biggest moment of the career with no root they could read.
 *  It is now `floor + gainWorn × worn + gainStrained × strained` (`ECONOMY.life.forkStop`), so the
 *  want has ROOTS: unsupported it reads ~3–4% at every standing, a post-shock girl in a strained home
 *  reads it as a real lean, and a drained girl in a cold home reads it dominant.
 *
 *  ⚠⚠ AND THE OLD «EVERY WEIGHT IS >= 1» CLAIM IS REPLACED BY AN HONEST ONE: **the floor is ε > 0 and
 *  never zero.** `college` and `tour` are untouched and still sit in [1.0, 2.56]; `stop` can go as low
 *  as `forkStop.floor` and no lower. Nothing may ever drive a want to zero – any girl MAY still want
 *  any of the three at any standing, in any mood, in any home, and the Barty tail (whole, winning,
 *  finished) stays a feature. What changed is its PRICE: it is an eighteen-year-old's rarity now
 *  instead of a coin-flip's neighbour.
 *
 *  ⚠ BOTH ROOTS ARE CLAMPED TO 0..1, which `lean` used to do for `worn` on its way past. A spirit
 *  above baseline is not «negative wear» that could refund the floor, and a poked save below
 *  `spirit.min` is not a girl who wants to stop twice over. */
export function forkWantWeights(standing: number, spirit: number, bond: number): Record<ForkWant, number> {
  const b = ECONOMY.bond
  const f = ECONOMY.life.forkStop
  const { worn, strained } = stopRootsOf(spirit, bond)
  const close = (bond - b.start) / (b.max - b.start)
  return {
    college: lean(1 - standing),
    tour: lean(standing) * lean(close),
    stop: f.floor + f.gainWorn * worn + f.gainStrained * strained,
  }
}

/** ⭐⭐⭐ v74 T17 – WHICH ROOT HER `stop` IS WORDED FROM, and it is spent on WORDING AND NOTHING ELSE.
 *
 *  ⚠⚠ THE DRIVER NEVER RE-WEIGHTS THE DRAW IT EXPLAINS. `forkWantWeights` above does not call this
 *  function and does not read `forkStopDriverFrom`; the same (standing, spirit, bond) produces the
 *  identical three weights whether or not anything ever asks for a driver. That is the fence of §3
 *  applied one level in: a reading that colours the words must not be able to become a term in the
 *  maths, or «readable roots» becomes a fourth input by the back door.
 *
 *  ⚠ WORN WINS A TIE ON PURPOSE. A girl who is both worn down and far from home is stopping because
 *  of the season first – the tiredness is what she would be putting down, and the distance is what
 *  made it lonely. The order is the wording's, not a claim about the arithmetic, where both terms are
 *  simply added.
 *
 *  ⚠ THE THRESHOLD IS **STRICTLY GREATER**, so a girl at exactly the line is still `'own'`: the
 *  register that claims a cause is the one that has to earn it. */
export type ForkStopDriver = 'worn' | 'strained' | 'own'

export function forkStopDriverOf(spirit: number, bond: number): ForkStopDriver {
  const from = ECONOMY.life.forkStopDriverFrom
  const { worn, strained } = stopRootsOf(spirit, bond)
  if (worn > from) return 'worn'
  if (strained > from) return 'strained'
  return 'own'
}

/** The three drivers as a list, derived from a TOTAL record rather than written out – so a fourth
 *  root added later is a compile error in every sweep instead of a silently unswept column. Same
 *  guarantee `PARTNER_WANTS` takes from `WANTS_TOTAL`. */
const DRIVER_TOTAL: Record<ForkStopDriver, true> = { worn: true, strained: true, own: true }
export const FORK_STOP_DRIVERS = Object.keys(DRIVER_TOTAL) as readonly ForkStopDriver[]

/** ⭐ HER LADDER STANDING AS ONE 0..1 NUMBER – how high she actually got, normalised.
 *
 *  ⚠ IT TAKES THE SCORE RATHER THAN THE WORLD, which keeps this module free of `world/college.ts`
 *  (a heavy leaf that pulls the match engine in) and, more importantly, keeps the want-draw a pure
 *  function of primitives – `spanWorthOffering`'s own doctrine in world/multiWeek.ts: «the predicate
 *  takes PRIMITIVES ... they agree BY CONSTRUCTION rather than by inspection».
 *
 *  ⚠ AND THE SCORE IT EXPECTS IS `juniorRecordScore`, WHICH IS THE FORK'S OWN MEASURE. The same
 *  number the college offer she is looking at was written from (`measureCollegeOffer`, one line
 *  above the call site in `resolveEndings`), so her want and her options are read off one reading of
 *  one career rather than two readings that could disagree. `COLLEGE_OFFER.maxJuniorScore` is the
 *  ceiling that makes it a share; the clamp is for a poked save, not for the engine. */
export function forkStandingOf(juniorScore: number, maxJuniorScore: number): number {
  if (maxJuniorScore <= 0) return 0
  return Math.min(1, Math.max(0, juniorScore / maxJuniorScore))
}

/** ⭐ THE DRAW – ONE PULL on `seed:life:fork:<seasonIndex>` (build plan §1f names the stream), and
 *  nothing else on any stream anywhere in this wave.
 *
 *  ⚠ (seed, calendar)-KEYED AND NEVER (seed, choice)-KEYED, which is `seed:birthday:<age>`'s own
 *  argument: a player cannot re-roll her want by playing the week differently, so the want is
 *  something he ANSWERS rather than something he can manufacture. MAIN is not reached, so the frozen
 *  capture (41550 / e6b0c709) cannot see this line. */
export function drawForkWant(seed: string, seasonIndex: number, standing: number, spirit: number, bond: number): ForkWant {
  const weights = forkWantWeights(standing, spirit, bond)
  const total = FORK_WANTS.reduce((sum, want) => sum + weights[want], 0)
  let roll = rngFromSeed(`${seed}:life:fork:${seasonIndex}`)() * total
  for (const want of FORK_WANTS) {
    roll -= weights[want]
    if (roll < 0) return want
  }
  // Unreachable while every weight is positive; a total that floats a hair low lands on the last row
  // rather than on `undefined`.
  return FORK_WANTS[FORK_WANTS.length - 1]
}

/** HER WANT, IN THE PARENT'S VOCABULARY – the one place the two words for the same road are mapped.
 *  Read by `answerFork` to price the DEED, and by nothing else. */
export const FORK_WANT_ANSWER: Record<ForkWant, 'continue' | 'college' | 'stop'> = {
  college: 'college',
  tour: 'continue',
  stop: 'stop',
}

/** THE WANT SHE STATED AT THE FORK, off the record, or null if she was never asked (every career
 *  that reached its fork before v73, and every career that has not reached one yet).
 *
 *  ⚠ THE LAST `'fork-opinion'` ROW AND NOT THE FIRST: the fork is raised once, so there is at most
 *  one – reading the last is what keeps a poked save with two of them answering about the live one. */
export function forkWantOf(world: WorldState): ForkWant | null {
  const rows = lifeLogOf(world).filter((row) => row.kind === 'fork-opinion')
  const detail = rows.length > 0 ? rows[rows.length - 1].detail : null
  return FORK_WANTS.find((want) => want === detail) ?? null
}

// =================================================================================================
// 3. THE BEAT'S COPY – ⚠⚠ EVERY WORD BELOW IS A DRAFT FOR THE OWNER (CLAUDE.md invariant 4)
// =================================================================================================
//
// Written against `docs/specs/voice-bibles-2026-09.md` §A (the four bibles) and §B (the flat pool),
// and every line obeys the TWO SHAPE RULES the week-note pins already enforce for the whole corpus:
//
//   1. AT MOST ONE QUOTED SPAN PER LINE – a greedy strip over two spans swallows the narration
//      between them, so a two-span line can hide a first-person narrator from the check.
//   2. THE NARRATION OUTSIDE THE QUOTATION CONTAINS `she` – a paired strip cannot tell HER quotation
//      from anybody else's, so the `she` is what names the speaker as her.
//
// ⭐ THE COMPOSITION RULE (who-she-is §5b), and why this is 27 lines rather than 4x5x4:
//
//   temperament owns the SHAPE          – four voices, one line each per want
//   spirit owns the REGISTER            – collapsed to `low` vs not-low, which is §5b's own
//                                         «most moments only split low vs not-low»
//   bond owns the CHANNEL               – `close`/`steady` let her speak; `strained`/`cold` collapse
//                                         the four voices into ONE shared flat pool, because losing
//                                         her voice is the point
//
// 3 wants x 4 temperaments x 2 registers = 24 of her own, + 12 listen-continuations (10.09),
// + 3 flat, + 3 headings.
//
// =================================================================================================
// ⭐⭐⭐ THE PRESENCE LAW – THE FOURTH AXIS, AND IT IS THE ONE THE SCENE IS MADE OF
// (`docs/specs/voice-bibles-2026-09.md`, «The presence law (MUST; 11.09)», folded 11.09 after the
//  owner's own вычитка of the away frames)
// =================================================================================================
//
// «At the two roof stages cohabitation licenses household observation. At `college` and
//  `independent` the stage only restricts the available frames: every away line carries its own
//  delivery frame – a call, a text, a forwarded plan, a named visit – because distance makes
//  observation something the line has to earn, not assume.»
//
// ⚠⚠ THE DEFECT IT CLOSES IS A LICENCE DEFECT, NOT A TASTE ONE. «She was talking before her bag
// was down» and «She put the kettle on and mentioned it while it filled» are the parent watching
// her cross a room – a claim a parent four hundred miles away cannot make. Wave 3 shipped both
// pools with one column, so a twenty-six-year-old in her own flat came through the door of a house
// she moved out of six years earlier.
//
// ⚠ IT IS DERIVED FROM `DiaryLifeStage` AND FROM NOTHING ELSE, and it asks the question through
// `awayVoice` rather than re-typing it. R2-18 / ARCH-07's whole finding was that this one rule had
// been written out three times and the copies would part the day the rule gained a stage; there is
// ONE copy, it lives in `diary/words.ts`, and this pool now asks it too.
type BeatPresence = 'roof' | 'away'

function presenceOf(stage: DiaryLifeStage): BeatPresence {
  return awayVoice({ lifeStage: stage }) ? 'away' : 'roof'
}

/** One cell of a voiced pool, in both presence registers. ⚠⚠ `away` IS OPTIONAL AND THE `?` IS A
 *  RULING RATHER THAN A CONVENIENCE: the owner wrote 19 away frames for 20 cells and named the
 *  twentieth himself – `sunny`/`joy`'s «She said it before anyone had asked how the week went.» is
 *  channel-neutral and stays SHARED, so that one cell reads its roof line at both distances. The
 *  totality this file otherwise insists on is asserted by a PIN instead of by the type
 *  (`tests/wave3-presence.test.ts` §C), because the pin can say «exactly one cell falls back» and a
 *  required field can only say «none does».
 *
 *  ⚠ AND THE QUOTED SPAN IS SHARED BY LAW, not by habit (the owner, 11.09: «цитаты уже с
 *  контракциями по P2, они общие с домашними рамками»). What presence changes is the FRAME – the
 *  scene the parent is standing in – never the sentence she says inside the quotation marks. §D of
 *  the same pin file extracts both spans and asserts they are identical, which is what makes that a
 *  property instead of a convention the next editor never hears about. */
interface PresenceCell {
  roof: string
  away?: string
}

/** ⭐ THE READ, ONE FUNCTION, SO THE FALLBACK HAS EXACTLY ONE SPELLING. `away ?? roof` is the whole
 *  of it, and the `??` is reachable by exactly one cell today. */
function presenceLine(cell: PresenceCell, presence: BeatPresence): string {
  return presence === 'away' ? (cell.away ?? cell.roof) : cell.roof
}

/** The register her line is licensed under, collapsed from the Mood ladder. Two rungs, not three:
 *  `bright` and `level` share a line and `low` gets its own, which is §5b's arithmetic exactly. */
type SpokenRegister = 'low' | 'up'

/** ⭐⭐ HER LINE, BY VOICE, BY WANT, BY REGISTER – 24 drafts.
 *
 *  ⚠ THIS TABLE IS THE ONLY THING IN THIS FILE INDEXED BY TEMPERAMENT, and that is the fence made
 *  structural: the wording knows who she is, the want does not.
 *
 *  ⚠ THE BIBLE EACH VOICE IS WRITTEN TO, in one line each, so a later writer does not have to
 *  reconstruct it: `sunny` says the whole thing evenly and will name a feeling plainly; `fiery`
 *  gives the verdict first, at speed, in absolutes, and has not had the second thought yet; `quiet`
 *  says the practical surface and leaves herself out, so the parent reads the week off what she
 *  talked about INSTEAD; `deep` says one true thing, late, stripped of its size, in full stops.
 *
 *  ⚠ AND THE `quiet` ROWS ARE THE LICENSED EXCEPTION THE BIBLE ITSELF NAMES. §A3: «A `quiet` line
 *  that states a feeling directly is a broken line ... A tier-2 life beat in waves 2-4 may earn the
 *  exception – a feeling from her would be worth more than a paragraph from anyone else, precisely
 *  because tier 0 spent none.» This is that tier-2 beat, it fires once in a career, and even here
 *  she answers with a fact and a schedule wherever a fact will carry it. */
// ⭐⭐ RE-CUT 10.09 TO THE OWNER'S EDITORIAL REVIEW – his вычитка of this pool, applied as ruled
// («давай осмысленно теперь применим и интегрируем»). The rules the re-cut follows, from the review:
// temperament shows in WHAT SHE NOTICES, WHAT SHE OMITS AND HOW SHE STRUCTURES A THOUGHT – never in
// a narrator's adverb; the narration outside her quotation carries FACTS AND OBJECTS the parent saw
// (a prospectus, a blanket, unsigned forms), never an interpretation («which is how she says it»,
// «at volume», «like a result» – all deleted); a `low` week DISTURBS her normal voice rather than
// swapping in a stock sad one. Lines the review's own craft already matched are kept byte-identical.
const HER_LINE: Record<Temperament, Record<ForkWant, Record<SpokenRegister, string>>> = {
  sunny: {
    college: {
      up: 'She brought it up over dinner, to both of us. "I keep thinking about the library. And the four years, if I am honest."',
      low: 'She waited for a quiet evening to ask. "Could we talk about me going? I would like the four years."',
    },
    tour: {
      up: 'She talked us through next season, city by city. "I want to play. Properly, all of it."',
      low: 'She answered before the question was all the way out. "The tour. That has not changed, whatever this week looked like."',
    },
    stop: {
      up: 'She told us together, at the table. "I think I am done. I wanted you both to hear it from me."',
      low: 'She picked a night when the house was full. "I want to stop. I do not think there is another season in me."',
    },
  },
  fiery: {
    college: {
      up: 'She said yes to a question nobody had asked yet. "College. Four years. I already know."',
      low: 'She was flat all week and said it anyway, all at once. "College. I want out of this circuit for a while."',
    },
    tour: {
      up: 'She did not sit down for this one. "Put me in. I do not want a careful year."',
      low: 'She said it from under a blanket on the sofa. "The tour. I do not care how this week went."',
    },
    stop: {
      up: 'She stood up to say it. "I am stopping. Book nothing for next year."',
      low: 'She said it once, with the door already half closed. "I want to stop. I have had enough of all of it."',
    },
  },
  quiet: {
    college: {
      up: 'She left the prospectus on the table, open at one page. "That one has the course I want."',
      low: 'She asked what the term dates were before she asked anything else. "I would take the place, if it is there."',
    },
    tour: {
      up: 'She was already writing next year down when she mentioned it. "I would keep playing. The schedule works."',
      low: 'She asked about the entry deadlines first. "I would rather keep going."',
    },
    stop: {
      up: 'She handed back the entry forms unsigned. "I would like to stop now, I think."',
      low: 'She said it once, and then asked about something else entirely. "I want to stop."',
    },
  },
  deep: {
    college: {
      up: 'She told us at the end of the week, after the bags were unpacked. "College. I have known for a while."',
      low: 'She said it in the car, with the engine off. "College. I need somewhere else to be."',
    },
    tour: {
      up: 'She let everyone else talk first. "The tour. I know what it costs."',
      low: 'She had been quiet for days, and said it at the sink. "The tour. Even now."',
    },
    stop: {
      up: 'She said it after everyone else had gone to bed. "I want to stop. I do not want another January."',
      low: 'She said it once, and turned the light off. "I am done."',
    },
  },
}

/** ⭐⭐⭐ v74 T17 – HER `stop` LINE, BY VOICE, BY THE ROOT THE WANT ACTUALLY HAS – 8 drafts, and the
 *  `'own'` column is the EIGHT LINES ABOVE, untouched.
 *
 *  ⚠⚠ WHY THIS POOL EXISTS AT ALL. Until T17 `stop` had a floor of 1.0 like every other want, so a
 *  quarter of all players met «I want to stop» at the biggest moment of the career with no root they
 *  could read – the owner met it himself, at eighteen, on a healthy girl in a close home. T17 prices
 *  the tail (`ECONOMY.life.forkStop`) AND gives it words: «always with readable roots» is a copy
 *  requirement as much as an arithmetic one, and this is the copy half.
 *
 *  ⚠⚠ THE DRIVER IS WORDING AND NEVER WEIGHT. `forkStopDriverOf` (§2) reads the same two roots the
 *  weight is built from and decides nothing about the draw; the fence of §3 applied one level in.
 *
 *  ⚠⚠ AND THE REGISTER SPLIT IS ABSENT HERE **BY DERIVATION, NOT BY ECONOMY** – this is the half
 *  worth reading twice, because it looks like a shortcut and is not. `worn > 0.15` means
 *  `spirit < 59.5`, and the `low` register is `spirit < 67.5` (`ECONOMY.spirit.mood.dimmedBelow`):
 *  the `worn` column is a STRICT SUBSET of the low register, so a second «low» variant of a worn
 *  line would be a variant of a line that can only ever fire low. `'own'` is the column that spans
 *  both – she can be sure in a bright week and sure in a flat one – and `'own'` is exactly where the
 *  shipped `up`/`low` pair stayed. `strained` fires with her spirit at or near baseline by
 *  construction (`worn <= 0.15`), so its line is written register-neutral and claims no week.
 *
 *  ⚠ NO PRESENCE AXIS, AND IT IS THE SAME SCOPE STATEMENT `HER_LINE` MAKES. The fork opens on the
 *  week school ends, which is a roof stage by construction, so there is no away frame to write. 12
 *  readings (4 voices x 3 drivers), all of them roof.
 *
 *  ⚠ A `strained` LINE IS ONLY REACHABLE IN HER OWN VOICE INSIDE A NARROW WINDOW, and the design
 *  answer is the counsel beat rather than a wider pool: `speaksInHerOwnVoice` is false below bond 55,
 *  and the `strained` driver starts below bond 59.5, so she says one of these only in the bottom of
 *  the `steady` band. Below that the flat pool speaks – and the ROOT still reaches the player, from
 *  the coach, because `'fork-counsel'` is keyed on the same driver at every band. A cold home hears
 *  why from the one person still talking, which is the layer's whole subject.
 *
 *  ⚠ THE BIBLE EACH VOICE IS WRITTEN TO is `HER_LINE`'s own line above, unchanged, plus the
 *  §Contractions law the owner's вычитка applied to the wave-3 pools: `sunny` and `fiery` contract
 *  throughout, `quiet` mostly, `deep` LIGHTLY – lightly and not never, which is the correction of
 *  11.09. ⚠ The shipped `'own'` lines above are uncontracted (wave 2, pre-вычитка) and are NOT
 *  touched here: invariant 4 makes that the owner's call, and it is flagged in the вычитка package
 *  rather than fixed by an agent. */
const HER_STOP_LINE: Record<Temperament, Record<Exclude<ForkStopDriver, 'own'>, string>> = {
  sunny: {
    worn: 'She came looking for us both, and left the kit bag where it was. "I\'m tired in a way an off-season doesn\'t fix. I want to stop."',
    strained: 'She told us in the kitchen, standing, with her coat over her arm. "I\'ve decided to stop. I should have said something sooner."',
  },
  fiery: {
    worn: 'She said it sitting on the stairs, still in her kit. "I\'m empty. Every week took something. I want to stop."',
    strained: 'She said it from the doorway, keys still in her hand. "I\'m stopping. It\'s not a conversation. I wanted you to know."',
  },
  quiet: {
    worn: 'She had put her bag on the high shelf before she said anything. "I haven\'t got another season in me. The rest we can sort later."',
    strained: 'She said it while she was putting her shoes away, without stopping. "I\'m not playing next year. You\'ll need to tell the club, I think."',
  },
  deep: {
    worn: 'She said it standing by the window, with her back to the room. "I\'m tired. Not this week. All of it."',
    strained: 'She said it on her way through the room, without sitting down. "I\'m stopping. I decided it on my own."',
  },
}

/** ⭐ THE READ, ONE FUNCTION, so «which line does a stopping girl say» has exactly one spelling.
 *  `'own'` falls through to the shipped register pair and every other driver takes its own line. */
function stopLine(voice: Temperament, driver: ForkStopDriver, register: SpokenRegister): string {
  return driver === 'own' ? HER_LINE[voice].stop[register] : HER_STOP_LINE[voice][driver]
}

/** ⭐⭐ WHAT SHE SAYS WHEN HE ONLY LISTENS – 12 drafts, the 10.09 editorial ruling made mechanical:
 *  «Say nothing, and let her talk» was fictionally dishonest while the dialog closed and she did
 *  not talk. Choosing `listen` now shows this line BEFORE the answer is recorded – the reward of
 *  saying nothing is MORE OF HER. One line per voice per want; no register split (the moment is
 *  already priced by her first line) and NO FLAT ROW on purpose: at `strained`/`cold` she said one
 *  word because there is nothing more, and listening harder does not manufacture it – the dialog
 *  closes as before, and that silence staying silent is the flat pool's whole point. */
const HER_CONTINUATION: Record<Temperament, Record<ForkWant, string>> = {
  sunny: {
    college: 'She kept going when nobody filled the pause. "And I would come home for the summers. I have looked at how it fits."',
    tour: 'She filled the quiet herself. "I know what it asks of the house. I am asking anyway."',
    stop: 'She reached over before she went on. "It is not one bad week. I have been sure for a while."',
  },
  fiery: {
    college: 'She took the silence as a yes and kept building. "I will play the college season. It is not goodbye to tennis."',
    tour: 'She was not finished. "And I do not want a safe schedule. Real draws."',
    stop: 'She said the rest to the window. "I am not sad about it. I want you to know that."',
  },
  quiet: {
    college: 'She added one thing, to the table more than to us. "The room comes with a desk by the window."',
    tour: 'She slid the calendar across. "I marked the weeks I would be home."',
    stop: 'She answered the question that had not been asked yet. "The racquets can go to the club."',
  },
  deep: {
    college: 'She said the other half after a while. "It is not about the tennis. I want you to know it is not."',
    tour: 'She looked up once. "Do not worry about me out there."',
    stop: 'She finished it on her way out of the room. "Thank you for not talking me out of it."',
  },
}

/** The one control of the listening panel – it records `listen` and closes the beat. A DRAFT like
 *  every label here (invariant 4). It advances, so the dialog draws it in the advance idiom, not as
 *  a fourth radio. */
const LISTEN_DONE_LABEL = 'Let her finish'

/** ⭐⭐ THE FLAT POOL – what a `strained` or `cold` home sounds like on the biggest question of her
 *  life (voice bibles §B). One to four words, the parent's own sentence carrying the rest, and no
 *  feature of any of the four voices surviving.
 *
 *  ⚠ SHE ANSWERS; SHE NEVER OFFERS – so every frame here contains the question the parent had to
 *  ask. That is the whole loss the pool exists to make audible: on the one week she should have come
 *  to him, he had to go and ask, and she said the word and nothing else.
 *
 *  ⚠ AND SHE IS NEVER RUDE. Hostility would be a scene, and a scene is a relationship. */
const FLAT_LINE: Record<ForkWant, string> = {
  college: 'She was asked what she wants for next year, in the end. "College."',
  tour: 'She was asked what she wants for next year, in the end. "Keep playing."',
  stop: 'She was asked what she wants for next year, in the end. "Stop."',
}

/** The parent's frame over the dialog – his register, not hers, so it does not collapse with the
 *  flat pool. One per Mood register: what the week around this conversation was like. */
const HEADING: Record<MoodRegister, string> = {
  bright: 'School is over, and she has told us what she wants',
  level: 'School is over, and she has said what she wants',
  low: 'School is over, and it took her a while to say it',
}

// =================================================================================================
// 3d. `'fork-counsel'` – THE COACH'S READ ON A `stop` (wave 3, T17). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// ⭐⭐⭐ THE OWNER'S «обсуждать с тренером», RULED 11.09 off his own playtest. When the want she states
// at the fork is `stop`, answering her raises ONE more row before the fork may be answered: the coach
// says what he sees. It is the second half of «always with readable roots» – the arithmetic gives the
// want a cause, this gives the player somebody who can name it.
//
// ⚠⚠ THE VOICE IS NOT HERS AND THIS POOL IS THEREFORE **NOT INDEXED BY TEMPERAMENT**. `HER_LINE`,
// `MET_HER_LINE` and `SMALL_TALK_LINE` are indexed by it because they are her speaking; the coach is
// a man with a professional opinion, and giving him four voices would be the supporting-cast rule
// (who-she-is §5c) broken on its first use. He is keyed on the DRIVER and on nothing else.
//
// ⚠ AND NOT BY THE BOND BAND EITHER. The band is the distance between HER and the parent; the coach
// is not in that relationship, and his read of a cold home is exactly the read the flat pool cannot
// give – see `HER_STOP_LINE`'s own note on why `strained` reaches the player through him.
//
// ⚠⚠ THE PSYCHOLOGIST'S COUNSEL IS WAVE 5's AND HE DOES NOT EXIST. His beat slots BESIDE this one –
// another kind, raised from the same place in `answerLifeBeat`, keyed on the same driver, blocking in
// the same way – and layer 3 (the pressed-through stop remembered and re-read later) is his too. This
// pool is deliberately shaped so that adding him is a second table and not a rewrite of this one.

/** ⭐⭐ WHAT THE COACH SAYS, BY DRIVER – 3 drafts, the «the tennis is not the question» family.
 *
 *  ⚠ THE SHARED OPENING IS THE POINT OF THE FAMILY and not a lazy prefix: whatever the root, the one
 *  thing the man paid to make her better says first is that this is not a tennis problem. Everything
 *  after it is what he can see and what he cannot.
 *
 *  ⚠ THE HONESTY LAW BINDS HIM AS HARD AS IT BINDS HER. He may name what he has seen in a session and
 *  what he cannot reach; he may not name a duration, a date, a count, a result or another person –
 *  the sim holds none of them for him, and «he has coached her for years» is a fact nobody wrote. */
const COACH_COUNSEL: Record<ForkStopDriver, string> = {
  worn: 'Her coach came by that evening. "The tennis is not the question. She has had nothing left to give a session, and I cannot coach that out of her."',
  strained:
    'Her coach rang, and stayed on after the practice talk was done. "The tennis is not the question. Whatever this is, it sits outside the court, and I cannot reach it from where I stand."',
  own: 'Her coach rang the same evening, and did not argue any of it. "The tennis is not the question. She is not running from anything, and I would think less of her if she stayed to please us."',
}

/** The parent's frame over the counsel card. ONE line and not a register table: the week's weather is
 *  hers, and this card is a phone call from somebody else. ⚠ It also says why the fork is still shut,
 *  which is R10-16's doctrine (a control held back with no reason on screen is the bug). */
const COUNSEL_HEADING = 'She wants to stop, and her coach has asked for a word before we answer'

// =================================================================================================
// 3b. `'met'` – THE WEEK HE IS TOLD THERE IS SOMEONE (wave 3, T6). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// ⚠⚠ THE BEAT FIRES ALWAYS; THE BOND BAND PICKS THE REGISTER (architect, 11.09, resolving the build
// plan's §0.1 against its §4 on wave 2's own precedent). Three registers, and they are the same
// three rungs the voice bibles' «her voice, the shared pool, silence» ladder already has:
//
//     close              HER OWN LINE, in her own four voices – she came and said it
//     steady             A MENTION – the parent heard it, not from her, and not as a scene
//     strained / cold    A DRY CARD – no line of hers anywhere on it
//
// A band that decided whether the beat HAPPENED would make a distant parent's career quieter rather
// than colder; a band that only decides how the news sounds makes it colder, which is the layer's
// whole subject.
//
// ⚠⚠ AND THE TWO-TIER HONESTY LAW BINDS THIS POOL HARDER THAN ANY OTHER IN THE FILE, because the
// sim holds ALMOST NOTHING about the partner and that is deliberate (`LoveEpisode`: no name, no
// gender, no place, no age, nothing). So not one line below names a person, a place, a plan or a
// duration – «there is someone» is the entire consequential fact any of them may assert, and every
// other word is delivery texture the frame itself licenses.
//
// ⚠ NO LISTEN DETOUR HERE (the brief's own boundary). At the fork «say nothing and let her talk»
// buys more of her, because she came to say something and has more of it. This is news, not a
// question: the four answers are REACTIONS, and one of them is saying nothing – a plain answer with
// a plain price, not a second panel.

/** Which of the three registers the news arrives in. ⚠ NOT `speaksInHerOwnVoice` – that predicate is
 *  the fork's two-rung channel (`close`+`steady` speak) and this beat's ladder has three rungs,
 *  because a mention is a real thing a home at `steady` does and the fork had no room for it. Two
 *  readings, two functions, neither pretending to be the other. */
type MetRegister = 'her' | 'mention' | 'dry'

function metRegisterOf(band: BondBand): MetRegister {
  if (band === 'close') return 'her'
  if (band === 'steady') return 'mention'
  return 'dry'
}

/** ⭐⭐ HER OWN LINE AT `close`, BY VOICE – four drafts, and this is the SECOND thing in this file
 *  indexed by temperament (the fence's own shape: the wording knows who she is, nothing else does).
 *
 *  The bible each one is written to, in a phrase: `sunny` volunteers it and names the ordinary
 *  feeling; `fiery` is talking before she is through the door and closes the subject herself;
 *  `quiet` says it sideways, in the middle of a household action, and leaves herself out of it;
 *  `deep` waits for the room to be quiet and gives the conclusion with nothing round it.
 *
 *  ⚠ NO REGISTER SPLIT, AND IT IS A SCOPE STATEMENT RATHER THAN AN OVERSIGHT. The fork's pool splits
 *  `low` from `up` because the fork is a decision her week can weigh on; this is one piece of news
 *  and the spirit register is already carried by the heading above it. T10 owns the expansion (the
 *  brief's own «~8–12 lines» is the FEED's matrix, and this pool is its four-line neighbour).
 *
 *  ⭐⭐⭐ v74 T7 – AND THE SECOND AXIS IS `wants`, WHICH IS THE ONLY PLACE THE FLIP IS EVER SURFACED.
 *  Her drawn `wants` re-prices two of the four answers (`ECONOMY.bond.delta.metWarmPrivate` /
 *  `metSilentPrivate`), and the player is told which way by THE WORDING AND BY NOTHING ELSE – no
 *  meter, no badge, no label, no marked option. That is the birthday-ask scene generalised: the ask
 *  is in the line she says, a parent who is listening hears it, and a parent who is not pays for it
 *  over months. ⚠ THE FRAME PER VOICE IS THE SAME IN BOTH COLUMNS on purpose – she is the same girl
 *  with the same habits, and what differs is the request she attaches. The `open` column is T6's
 *  four lines, with only its QUOTED SPAN moved by the вычитка below.
 *
 *  ⭐⭐⭐ 11.09, THE OWNER'S ВЫЧИТКА – THE THIRD AXIS IS PRESENCE, AND THE EIGHT `away` FRAMES BELOW
 *  ARE HIS OWN WORDS, FOLDED VERBATIM. The roof frames stage a house – the dinner table, the bag
 *  going down, the shopping put away, the room going quiet – and from `college` on the parent is not
 *  in that house. So every away frame carries its own delivery: she rang, she called, she said it at
 *  the end of a message about something else.
 *
 *  ⚠⚠ AND THE QUOTATION IS SHARED ACROSS THE TWO REGISTERS, WHICH IS THE HALF WORTH READING TWICE
 *  («цитаты уже с контракциями по P2, они общие с домашними рамками»). Presence moves the FRAME and
 *  never the sentence: the roof quotes were re-cut to HIS contracted forms so that each (voice,
 *  want) reads the identical span at both distances, and the pin extracts both spans and compares
 *  them rather than trusting that anyone remembers.
 *
 *  ⚠ `deep` STAYS UNCONTRACTED IN THESE POOLS – the bible's «lightly»: her formality is load-bearing
 *  in a confession. ⚠⚠ THE LAW HOME IS `voice-bibles-2026-09.md` §Contractions, NOT THIS COMMENT,
 *  and the distinction matters: the bible licenses `deep` lightly rather than never, so a future
 *  `deep` line where a contraction genuinely works is ALLOWED. An absolute written here would send
 *  whoever meets that line to «fix» the wrong side of it (the owner's correction, 11.09 – absolutes
 *  are reserved for licensing law).
 *
 *  The other three contract where it is natural – a local fold of the same section, and the same
 *  pointer applies: sunny and fiery throughout, quiet mostly. His own label said «контракции
 *  sunny/fiery» while his delivered text contracts `quiet` too and leaves `deep` alone at every
 *  cell; the delivered text is what the player reads, so the text won. Both `deep` cells below are
 *  byte-identical to what T6 shipped. */
const MET_HER_LINE: Record<Temperament, Record<LoveEpisode['wants'], PresenceCell>> = {
  sunny: {
    open: {
      roof: 'She brought it up over dinner, before anyone asked. "There\'s someone. I wanted you to hear it from me first."',
      away: 'She rang just to say it, nothing else on the list. "There\'s someone. I wanted you to hear it from me first."',
    },
    private: {
      roof: 'She brought it up over dinner, and wished straight away that she had not. "There\'s someone. Please don\'t go telling people."',
      away: 'She said it fast, at the end of an ordinary call. "There\'s someone. Please don\'t go telling people."',
    },
  },
  fiery: {
    open: {
      roof: 'She was talking before her bag was down. "There\'s someone. It\'s good. That\'s all you\'re getting."',
      away: 'She called, and was already talking. "There\'s someone. It\'s good. That\'s all you\'re getting."',
    },
    private: {
      roof: 'She was talking before her bag was down. "There\'s someone. And no, we\'re not doing questions about it."',
      away: 'She called, said it, and changed the subject herself. "There\'s someone. And no, we\'re not doing questions about it."',
    },
  },
  quiet: {
    open: {
      roof: 'She said it while she put the shopping away, between two other things. "There\'s someone I see now."',
      away: 'She slipped it in with the week\'s other news. "There\'s someone I see now."',
    },
    private: {
      roof: 'She said it while she put the shopping away, and did not look up. "There\'s someone. I\'d rather that stayed in this room."',
      away: 'She said it at the end of a message about something else. "There\'s someone. I\'d rather that stayed in this room."',
    },
  },
  deep: {
    open: {
      roof: 'She waited until the house was quiet, then said it once. "There is someone. That is all."',
      away: 'She called late, when the day was done, and said it once. "There is someone. That is all."',
    },
    private: {
      roof: 'She waited until the house was quiet, and asked first that it go no further. "There is someone. Now please let it be."',
      away: 'She called once she was sure of the words, and asked first that it go no further. "There is someone. Now please let it be."',
    },
  },
}

/** ⭐ `steady` – A MENTION, AND NOT ONE WORD OF HERS IN IT. She said it somewhere in the week and the
 *  parent caught it; there is no scene, because a scene is what `close` has and this home does not.
 *
 *  ⚠ ONE LINE PER READING, NOT FOUR. It is the PARENT'S narration and the fence keeps temperament out
 *  of that – `HER_LINE` and `MET_HER_LINE` are the only pools in this file a girl's voice indexes.
 *  The `wants` axis is not the fence: it is not who she is, it is what she asked for.
 *
 *  ⭐⭐ 11.09, THE ВЫЧИТКА – `open`'s TAIL WAS EXPLAINING AN ABSENCE. It read «…and did not stop to
 *  say who», which is the narrator telling the player what DIDN'T happen and why it matters, one
 *  rung below the banned-tail line but the same move. The replacement states the absence as a fact
 *  of the week instead: «No name came with it.»
 *
 *  ⚠⚠ AND THAT SECOND SENTENCE IS HONEST PRECISELY BECAUSE THE SIM HOLDS NO NAME. `LoveEpisode`
 *  carries no name, no gender and no place, deliberately, so «no name came with it» is not the
 *  parent's guess about her reticence – it is the two-tier honesty law's own discipline printed as a
 *  sentence: the line asserts exactly the consequential fact the world holds, and the reason it can
 *  never be contradicted is that there is nothing there to contradict it. */
const MET_MENTION: Record<LoveEpisode['wants'], string> = {
  open: 'She mentioned someone this week, in passing. No name came with it.',
  private: 'She let someone slip this week, caught herself, and moved the conversation on.',
}

/** ⭐⭐ `strained` / `cold` – THE DRY CARD. No quotation at all, which is a stronger silence than the
 *  fork's flat pool: there she at least answered a question, and here the parent found out without
 *  her. The loss is the whole content of the line, and nothing in it is rude.
 *
 *  ⚠⚠ AND IT CARRIES THE `wants` READ TOO, WHICH IS THE DECISION WORTH READING TWICE. The flip
 *  applies at EVERY band – a cold home's four answers are priced exactly as a close home's – so a
 *  pool that only split at `close` would leave the far half of the ladder paying a rule it could
 *  never read. The parent at this distance is not told what she wants; he is told she kept it, which
 *  is the same fact arriving as an inference instead of as a request.
 *
 *  ⭐⭐ 11.09, THE ВЫЧИТКА – A TWO-ROW POOL THAT ENDED THE SAME WAY TWICE. Both rows closed on «and
 *  the house found out anyway», so the one axis this pool exists to carry – what she wanted done
 *  with it – arrived under a tail the player had already read. `open` keeps it, because that is the
 *  row the tail was written for: nobody was asked to keep anything, and the house simply learned.
 *  `private` now ends on the thing that is actually different about it – she was holding it, and it
 *  got out from under her.
 *
 *  ⚠ AND IT IS NOT `MET_EVENT['found-out'].private`, WHICH IS THE NEIGHBOUR IT COULD MOST EASILY
 *  HAVE COLLIDED WITH: that row reads «She had been keeping it to herself.» and is the FEED's
 *  permanent record of the same week. Two surfaces, two sentences – the card says how it surfaced,
 *  the kept row says what she had been doing. */
const MET_DRY: Record<LoveEpisode['wants'], string> = {
  open: 'There is someone in her life. She did not say so, and the house found out anyway.',
  private: 'There is someone in her life. She had been keeping it close, and it surfaced without her.',
}

/** The parent's frame over the card, one per register. ⚠ IT KEYS ON THE BOND BAND AND NOT ON THE
 *  MOOD LADDER, unlike the fork's `HEADING`: what this week is ABOUT is the distance between them,
 *  and a heading that read her spirit would be answering a different question from the card's. */
const MET_HEADING: Record<MetRegister, string> = {
  her: 'She has told us there is someone',
  mention: 'Something she mentioned this week',
  dry: 'There is someone in her life',
}

// =================================================================================================
// 3c. `'small-talk'` – TIER 1, THE WEEK SHE COMES WITH SOMETHING SMALL (wave 3, T8). EVERY WORD A DRAFT.
// =================================================================================================
//
// who-she-is §5b's three tiers, the middle one: «small talk – she comes with something small (a
// worry before a big draw, a joy, a question); 2–3 reply options». It rides the beat machinery
// wave 2 built and adds NOTHING to it – the queue, the pause, the engine-side re-validation and the
// dialog's whole contract are called, never re-implemented.
//
// ⚠⚠ RULED V2 (09.09): «TIER-1 REPLIES MOVE NOTHING – small talk is texture, never economy, and the
// delta table stays the big beats'.» Every reply below is priced ZERO, and that is a design rule
// rather than a coincidence of this draft: this is the FREQUENT beat (up to four a season), so a
// tier that quietly paid would make the common thing the profitable thing and turn a conversation
// into a farm. The value of the beat is the READ – what she came with, and in whose voice – and the
// number is deliberately not part of it.
//
// ⚠ IT ALSO SATISFIES THE T6b PIN BY CONSTRUCTION, which is worth naming because the pin is what
// stops the next wave breaking forty tools: `tools/_lifeBeats.ts`' `drainLifeBeats` answers a beat a
// harness never meant to price with the option whose delta is ZERO and THROWS if a kind has none.
// Here EVERY option is that option.
//
// ⚠⚠ AND THIS IS THE ONE KIND THAT WRITES NO FEED ROW AT ALL – not on delivery and not on the
// answer. The `lifeLog` row IS the record (and, per `smallTalkThisSeason` below, also the COUNTER),
// and the feed is the family's ledger of things that HAPPENED: four «we asked her to say more» rows
// a season would drown the thread T9's glyph column exists to make findable. The brief left the
// question open and this is its stated default; `ANSWER_EVENT`'s `null` is where the decision lives,
// and it is still a TOTAL record, so the next kind has to make the same decision out loud.

/** WHAT SHE CAME WITH – who-she-is §5b's own triple («a worry ... a joy, a question»), and the whole
 *  of a `'small-talk'` row's `detail`. Machine-readable, never a rendered word, exactly as
 *  `'fork-opinion'`'s want is. */
export const SMALL_TALK_SUBJECTS = ['worry', 'joy', 'question'] as const
export type SmallTalkSubject = (typeof SMALL_TALK_SUBJECTS)[number]

/** ⭐ WHICH OF THE THREE, READ OFF HER WEEK AND NOT OFF A SECOND DRAW.
 *
 *  ⚠⚠ ZERO DRAWS, AND IT IS THE SPLIT-KEY LAW THAT MAKES IT SO RATHER THAN THRIFT. The wave owns
 *  FOUR stream keys (brief §3) and `seed:life:smalltalk:<week>` answers exactly one question –
 *  «does she come with something». A second, DIFFERENT fact read off the same key would be two
 *  facts sharing a key, which is the one thing the 09.09 stream law forbids; a key of its own would
 *  be a fifth stream this wave may not create. So the subject is DERIVED, and the fact it is derived
 *  from is §5b's composition rule read literally: SPIRIT owns the register of the moment, so the
 *  register is what decides which small thing she brings. A heavy week brings a worry, a bright one
 *  brings something good, and an ordinary one brings the question she has been meaning to ask. */
export function smallTalkSubjectFor(register: MoodRegister): SmallTalkSubject {
  if (register === 'low') return 'worry'
  if (register === 'bright') return 'joy'
  return 'question'
}

/** ⭐⭐ HER OPENER, BY VOICE, BY SUBJECT – 12 drafts, and the THIRD thing in this file indexed by
 *  temperament (the fence's own shape: the wording knows who she is, nothing else does).
 *
 *  The bible each column is written to, in a phrase: `sunny` volunteers it and names the ordinary
 *  feeling; `fiery` is talking before she has put anything down, in absolutes, twice over; `quiet`
 *  says it around a household action and leaves herself out of it; `deep` waits for the room and
 *  gives the conclusion with nothing round it.
 *
 *  ⚠⚠ NO FLAT POOL, AND THE ABSENCE IS THE DESIGN. `strained` and `cold` are priced at ZERO
 *  (`ECONOMY.life.smallTalkPerWeek`), so this beat cannot reach a distant home at all – «none at
 *  cold; the silence is the line» (§5b). The fork needed a flat pool because the fork fires whatever
 *  the home is like; tier 1 simply stops happening, which is a louder thing to notice.
 *
 *  ⚠ THE TWO SHAPE RULES the week-note pins enforce for the whole corpus hold here too: at most ONE
 *  quoted span per line, and the narration outside it names `she`.
 *
 *  ⚠ AND THE TWO-TIER HONESTY LAW. Not one line names a draw, a result, a place, a person, a plan or
 *  a count – the sim holds no such fact about «something small», so neither does the pool. What each
 *  line asserts is her own verdict on her own week, which is the one thing she is the source of.
 *
 *  ⭐⭐⭐ 11.09, THE OWNER'S ВЫЧИТКА – THE PRESENCE COLUMN, ELEVEN OF HIS OWN FRAMES, VERBATIM. The
 *  roof frames are a kitchen: the plates done, the kettle filling, the shelf being stacked, the room
 *  emptying. From `college` on the parent is in none of those rooms, so the away frames carry a
 *  channel instead – she stayed on the line, she rang out of turn, it came at the bottom of an
 *  ordinary message, the voice note skipped hello.
 *
 *  ⚠⚠ ELEVEN AND NOT TWELVE, AND THE MISSING ONE IS HIS OWN RULING RATHER THAN A GAP. `sunny`/`joy`
 *  has NO away frame: «She said it before anyone had asked how the week went.» is channel-neutral –
 *  it describes an ORDER of events and not a room – so it stays SHARED and the away read falls back
 *  to it. That is why the вычитка's set is 19 and not 20, and `tests/wave3-presence.test.ts` §C pins
 *  the fallback from both sides: that cell must read the SAME string at both distances, and every
 *  other cell must read a DIFFERENT one.
 *
 *  ⚠ TWO OF HIS AWAY FRAMES OPEN `Her` RATHER THAN `She` («Her voice note skipped hello entirely.»,
 *  «Her message came and did not ask for a reply.»). The corpus's shape rule 2 is written as «the
 *  narration outside the quotation contains `she`»; both lines still name her in the third person,
 *  which is what the rule is FOR, and they are the owner's words. Flagged to him rather than edited,
 *  and the pin asserts the third person (`she` or `her`) instead of the letter of the older form.
 *
 *  ⚠ THE QUOTED SPAN IS SHARED with the roof column, exactly as `MET_HER_LINE`'s is – see that
 *  pool's note for the contraction fold and for the law home it points at.
 *
 *  ⭐ PROVENANCE OF `sunny`/`joy`'s «Something went well. I'm pleased about it.», corrected 11.09:
 *  it is THE OWNER'S OWN WORD, carried on his P2 verdict list. It is absent from the 19-frame
 *  delivery for one reason only – that cell's frame is channel-neutral and SHARED, so there was no
 *  away row for it to appear in. The architect first recorded it as an inference and the owner
 *  corrected the record: one source, byte-for-byte agreement, chain of custody clean. */
const SMALL_TALK_LINE: Record<Temperament, Record<SmallTalkSubject, PresenceCell>> = {
  sunny: {
    worry: {
      roof: 'She came and sat down without being asked to. "I\'ve been worrying at something all week. I\'d rather say it than carry it."',
      away: 'She stayed on the line past the point of the call. "I\'ve been worrying at something all week. I\'d rather say it than carry it."',
    },
    joy: {
      roof: 'She said it before anyone had asked how the week went. "Something went well. I\'m pleased about it."',
    },
    question: {
      roof: 'She asked it over dinner, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
      away: 'She saved it for the end of the call, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
    },
  },
  fiery: {
    worry: {
      roof: 'She was through the door and straight into it. "Something\'s bothering me. It\'s been bothering me for days."',
      away: 'She rang out of turn and went straight in. "Something\'s bothering me. It\'s been bothering me for days."',
    },
    joy: {
      roof: 'She was talking before she had put anything down. "Today was a good one. A really good one."',
      away: 'Her voice note skipped hello entirely. "Today was a good one. A really good one."',
    },
    question: {
      roof: 'She asked it the second she sat down. "I want to ask you something. And I want a straight answer."',
      away: 'She rang and asked before hello was done. "I want to ask you something. And I want a straight answer."',
    },
  },
  quiet: {
    worry: {
      roof: 'She stayed in the kitchen after the plates were done. "There\'s something I keep going back over."',
      away: 'She put it at the bottom of an ordinary message. "There\'s something I keep going back over."',
    },
    joy: {
      roof: 'She put the kettle on and mentioned it while it filled. "The morning went the way I wanted it to."',
      away: 'She mentioned it in the middle of a call about other things. "The morning went the way I wanted it to."',
    },
    question: {
      roof: 'She asked it while she was stacking the shelf, without looking round. "Can I ask you about something?"',
      away: 'She asked it right before hanging up. "Can I ask you about something?"',
    },
  },
  deep: {
    worry: {
      roof: 'She waited until the room was quiet. "Something is sitting wrong. That is all I have."',
      away: 'She called late, and took a while getting to it. "Something is sitting wrong. That is all I have."',
    },
    joy: {
      roof: 'She said it on her way past, and did not stop. "Good week. I will take it."',
      away: 'Her message came and did not ask for a reply. "Good week. I will take it."',
    },
    question: {
      roof: 'She waited for the room to empty first. "I want to ask you something."',
      away: 'She waited until the call was nearly over. "I want to ask you something."',
    },
  },
}

/** The parent's frame over the card, one per Mood register – the fork's `HEADING` shape and not the
 *  `'met'` card's, deliberately: what this beat is ABOUT is her week, and her week is what the Mood
 *  register reads. The `'met'` card keys on the bond band because its subject is the distance
 *  between them; this one has no distance in it, or it would not have fired.
 *
 *  ⚠ IT AGREES WITH THE SUBJECT BY CONSTRUCTION on the week the row is raised, because both are read
 *  off the same register one line apart (`rollSmallTalk`). The pin in `tests/wave3-small-talk.test.ts`
 *  asserts that correspondence rather than assuming it. */
const SMALL_TALK_HEADING: Record<MoodRegister, string> = {
  bright: 'She came to us with something good this week',
  level: 'She came to us with something this week',
  low: 'She came to us with something on her mind',
}

/** ⭐⭐⭐ v74 T15 – THE INVITATION, AND IT IS THE ONLY STRING THE SOFT SURFACE ADDS. A DRAFT for the
 *  owner's вычитка like every word in this file (invariant 4).
 *
 *  ⚠⚠ ONE SHORT LINE, AND THE CARD IS **ONLY** THE INVITATION (who-she-is §5b's amendment): it says
 *  she has come by with something, and tapping it opens the SAME `LifeBeatDialog` on the same prompt
 *  contract – modal only because the player chose to listen. So this line may never carry what she
 *  came with: the subject, her opener and the parent's frame are the DIALOG's, assembled from the
 *  pools above, and a card that previewed them would make the conversation answerable from the hub
 *  without her ever having spoken.
 *
 *  ⚠ IT IS ENGINE-SIDE FOR THE REASON EVERY OTHER LINE HERE IS: the surface renders what it is
 *  handed and owns no sentence, so there is exactly one place her voice is edited from and the owner
 *  reads the whole set in one package.
 *
 *  ⚠ AND IT NAMES NO WEEK AND NO COUNT. The row is live for three weeks, so «this week» would be
 *  false on two of them; the two-tier honesty law forbids the rest (no draw, no result, no place, no
 *  person, no plan, no number). What is left is the one thing the world actually holds: she came. */
const SMALL_TALK_CARD = 'She came by with something small.'

// =================================================================================================
// 3e. `'ended'` – THE WEEK HE LEARNS IT IS OVER (wave 4, T4). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T4 and the wave-4 rulings A, B and G. §8 below
// decides WHEN an attachment ends; this is the conversation that follows, and it is the other end of
// the arc §3b opened.
//
// ⚠⚠ TWO REGISTERS, AND THEY ARE THE WHOLE SUBJECT OF RULING A. Told-NOW is the ending of a romance
// the parent already knew about – there is a `'met'` row for this episode in the `lifeLog`, and the
// news is that it is over. Told-LATE is the scene the episode schema was re-cut for on 09.09: there
// was someone, he was never told, and the first he hears of it is that it has already finished.
//
// ⚠⚠ THE DISCRIMINATOR IS THE `'met'` RECEIPT AND **NEVER** `endedWeek < knownWeek` (ruling A, and
// it is a DEPARTURE from the brief's literal words with the reason stated there). The two readings
// agree everywhere except `endedWeek === knownWeek`, and there the literal one calls the episode
// *known* – so the same tick would raise `'ended'` from §8 and `'met'` from §6, two contradictory
// beats about one girl in one week, which is the exact outcome the brief forbids two lines above its
// own rule. It is reachable rather than theoretical: ruling F makes `endedWeek >= sinceWeek + 1`, so
// the collision needs only a lag of one or more and the hazard landing on that week.
//
// ⚠⚠ AND THE REGISTER IS DERIVED, NEVER STORED (`beatEndsRegister`). The receipt is already in the
// record and is already the dedupe key, so a second field saying the same thing is the `pending`
// boolean rule 2 refuses at the top of this file. It stays re-derivable for the life of the career
// because a `'met'` row can never appear AFTER an `'ended'` row for one episode: the told-late path
// in §6 raises no `'met'`, ever, and §6 delivers each episode exactly once.
//
// ⚠⚠ THE LADDER IS TWO RUNGS AND NOT `'met'`'s THREE, and that is T6's own matrix rather than a
// shortcut: the brief's string list is «4 voices x {roof, away} x {told-now, told-late}, plus the
// strained/cold dry card pair» – sixteen voiced cells and two dry ones, with no `mention` rung in
// it. So this pool reads `speaksInHerOwnVoice`, the FORK's two-rung channel, and the dry card is the
// shared fallback at `strained`/`cold`. ⚠ A `mention` rung is T6's to add if the architect wants one;
// it is not omitted for want of room.
//
// ⚠⚠ PRESENCE FROM DAY ONE (the wave-4 brief §0.3, and it is an absolute): every cell below ships
// its roof AND its away frame. An attachment can end when she is twenty-four in her own flat, and
// wave 3 shipped two pools with one column each and had to be corrected by the owner's own вычитка.
// No single-register pools, ever again.
//
// ⚠⚠ AND THE READ – WHAT SHE WANTS FROM HIM THIS WEEK – REACHES THE PLAYER THROUGH THE HEADING AND
// THE TOLD-LATE FEED LINE, AND THROUGH NOTHING ELSE. That is the brief's «surfaced ONLY in the
// prompt's and feed row's wording» taken literally, and the heading is the surface it is put on for
// two reasons worth writing down. (1) The heading is the PARENT'S frame over the card, which is
// where «what she seems to want from us» belongs – her own line is her, and she is not narrating her
// own needs. (2) The heading is carried at EVERY bond band, so the dry card at `strained`/`cold`
// carries the read too – `MET_DRY`'s own argument verbatim: a rule only half the ladder can read is
// a hidden number, and the flip prices a cold home's answers exactly as it prices a close one's.
// ⚠ T6 OWNS THE FULL MATRIX and may move the read onto her line instead; that is a wording decision
// and this is the draft that renders.

/** WHICH SCENE THIS IS – derived from the `'met'` receipt (ruling A), never stored on the row. */
export type EndsRegister = 'told-now' | 'told-late'

/** ⚠ BOTH REGISTERS AS A LIST, so the completeness pin can walk them without transcribing the union –
 *  `PARTNER_WANTS`' own shape, and `satisfies` is what keeps the two from parting. */
export const ENDS_REGISTERS = ['told-now', 'told-late'] as const satisfies readonly EndsRegister[]

/** ⭐⭐⭐ WHAT SHE WANTS FROM HIM WHILE IT IS RAW – the space-vs-company read, drawn once on the
 *  ending week (`seed:life:ends:<endedWeek>:react`) and re-derived wherever it is needed.
 *
 *  ⚠ IT IS HER `wants`' SIBLING AND NOT A SECOND AXIS ON IT. `LoveEpisode.wants` is what she asked
 *  be done with the NEWS that somebody exists; this is what she wants from her parent in the weeks
 *  after it stops. Two facts, two streams, two names – who-she-is §4's own «her `wants` reads
 *  (private/open, space/company)» row lists them side by side for exactly that reason. */
export type EndsRead = 'space' | 'company'

export const ENDS_READS = ['space', 'company'] as const satisfies readonly EndsRead[]

/** ⭐⭐ HER LINE, BY VOICE, BY REGISTER, IN BOTH PRESENCES – 16 drafts, and the THIRD table in this
 *  file indexed by temperament (the fence's own shape: the wording knows who she is, nothing else
 *  does).
 *
 *  The bible each voice is written to, in a phrase, and the wave-4 brief's own reminders for THIS
 *  pool: `sunny` says the whole thing evenly and will name the ordinary feeling; `fiery`'s fire may
 *  go FLAT here – the tired keeper's register, which is the one place her speed stops being speed;
 *  `quiet` says the ARRANGEMENTS («the racquets», «the weekend»), never the feeling, and the parent
 *  reads the week off what she talked about instead; `deep` contracts, and cracks only under the
 *  WORN kind of breakage (the T17 read, now a precedent).
 *
 *  ⚠⚠ THE TWO-TIER HONESTY LAW BINDS THIS POOL AS HARD AS §3b's AND FOR THE SAME REASON: the sim
 *  holds no name, no gender, no place and no reason, so not one line below names a person, a fault,
 *  a reason or a channel the world does not have. «It is over» is the entire consequential fact any
 *  of them may assert, and the told-late column adds exactly one more – that it had been over for a
 *  while. ⚠ NO FAULT AND NO REASON ANYWHERE, which is not delicacy: a break-up the sim never modelled
 *  a cause for cannot have one printed beside it.
 *
 *  ⚠ THE QUOTED SPAN IS SHARED BETWEEN THE TWO PRESENCES, by the presence law («цитаты ... общие с
 *  домашними рамками»): what distance changes is the FRAME she is standing in, never the sentence
 *  inside the quotation marks. `deep` stays uncontracted, lightly, on §3b's own pointer to
 *  `voice-bibles-2026-09.md` §Contractions. */
const ENDED_HER_LINE: Record<Temperament, Record<EndsRegister, PresenceCell>> = {
  sunny: {
    'told-now': {
      roof: 'She said it at the table, plainly, and stayed sitting there after. "It\'s over. I\'m alright. I will be, anyway."',
      away: 'She rang in the evening and said it straight out. "It\'s over. I\'m alright. I will be, anyway."',
    },
    'told-late': {
      roof: 'She mentioned it while she cleared the plates, weeks after the fact. "There was someone. It ended a while ago."',
      away: 'She said it near the end of a call about nothing much. "There was someone. It ended a while ago."',
    },
  },
  fiery: {
    'told-now': {
      roof: 'She came in, put her bag down slowly, and sat. "It\'s finished. No, I don\'t want to go through it."',
      away: 'She called late, and for once she was not in a hurry. "It\'s finished. No, I don\'t want to go through it."',
    },
    'told-late': {
      roof: 'She said it flatly, on her way through the kitchen. "There was someone. It\'s been done for a while."',
      away: 'She said it flatly, at the end of a message about the schedule. "There was someone. It\'s been done for a while."',
    },
  },
  quiet: {
    'told-now': {
      roof: 'She took her racquets out of the hall and re-stacked them by the door. "The weekend\'s free now. That\'s finished."',
      away: 'She wrote to say the weekend plans were off, and one line more. "The weekend\'s free now. That\'s finished."',
    },
    'told-late': {
      roof: 'She was sorting the weekend bag and said it without stopping. "There was someone. That\'s been over a while."',
      away: 'She said it at the end of a note about the travel dates. "There was someone. That\'s been over a while."',
    },
  },
  deep: {
    'told-now': {
      roof: 'She waited until the house was quiet, then said it once. "It is over. I would rather not say more tonight."',
      away: 'She called late, when the day was done, and said it once. "It is over. I would rather not say more tonight."',
    },
    'told-late': {
      roof: 'She said it to the window rather than to the room. "There was someone. It ended some time ago."',
      away: 'She called once she was sure of the words. "There was someone. It ended some time ago."',
    },
  },
}

/** ⭐ `strained` / `cold` – THE DRY CARD, one per register and not one word of hers in it. The
 *  parent knows because a household knows, and the loss is the whole content of the line.
 *
 *  ⚠ IT IS `MET_DRY`'s SHAPE AND NOT ITS SENTENCE. That pool says how the news SURFACED; these say
 *  what the week holds, because by this rung the parent was never the person it was told to.
 *
 *  ⚠ AND IT CARRIES NO READ, WHICH IS WHY THE READ LIVES IN THE HEADING. A dry card that read her
 *  wants would be a home at this distance being told what she needs, which is the one thing the rung
 *  is defined by not having. The heading above it carries the read at every band – see the banner. */
const ENDED_DRY: Record<EndsRegister, string> = {
  'told-now': 'It is over. She did not say so, and the house worked it out.',
  'told-late': 'There was someone in her life, and it has been over for a while. Nobody was told at the time.',
}

/** The parent's frame over the card – by register, and by HER READ. ⚠ THE READ IS HERE AND NOWHERE
 *  ELSE ON THIS CARD, which is the banner's own decision: the heading is the only surface carried at
 *  every bond band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠ NOT ONE OF THE FOUR NAMES AN ANSWER. «She wants the room» is what the parent can see; which of
 *  the four things to say about it is his, and a heading that recommended one would be the meter this
 *  layer refuses to build, spelled in words. */
const ENDED_HEADING: Record<EndsRegister, Record<EndsRead, string>> = {
  'told-now': {
    space: 'It is over, and she wants the room to herself',
    company: 'It is over, and she does not want to be on her own with it',
  },
  'told-late': {
    // ⚠ NOT «leave it there» – the past tense of that phrase is a BANNED TAIL and the present tense
    // is the same narrator move one conjugation away. See `ENDED_LATE_EVENT` below.
    space: 'There was someone, it is already over, and she would rather not go into it',
    company: 'There was someone, it is already over, and she has been round more since',
  },
}

/** One answer on a life-beat card: the id the command carries, the sentence the button shows, and
 *  what saying it costs. ⚠ NAMED IN v74 T7 so `lifeBeatOptionsFor`'s signature can say what it hands
 *  back; the shape is the one `LIFE_BEAT_OPTIONS` has always had, spelled out rather than changed.
 *
 *  ⚠⚠ `LifeBeatAnswer` AND NOT `LifeBeatOption`, WHICH IS TAKEN AND IS A DIFFERENT THING.
 *  `shared/protocol/narrative.ts` already exports `LifeBeatOption` – the WIRE shape, `{id, label}`,
 *  what `LifeBeatPrompt.options` carries to the dialog and DELIBERATELY has no `bond` on it. Two
 *  types of the same name on two barrels, one with a price and one without, is the duplicate-
 *  identifier confusion at its most expensive: the safer one silently accepting the costed one.
 *  ⭐ AND THE SPLIT IS THE FENCE ITSELF – the engine's answer knows what it costs, the screen's
 *  cannot, and that is why the flip can never leak onto a button. */
export interface LifeBeatAnswer {
  id: string
  label: string
  bond: number
}

/** ⭐⭐ WHAT THE PARENT MAY SAY BACK, PER BEAT KIND – and not one option in either list is HER choice.
 *
 *  ⚠⚠ THIS IS THE TABLE AS AN **`open`** GIRL PRICES IT (v74 T7). It is still the one place the
 *  labels and the base numbers live, and `lifeBeatOptionsFor` below is the ONLY road to the priced
 *  set a given row is answered against – read this record directly and you have read one of the two
 *  readings. It stays the default because `'open'` is the reading with no request attached.
 *
 *  ⚠⚠ RESTRUCTURED FROM A FLAT LIST IN v74 (wave 3, T6), and the reason is the type rather than
 *  tidiness: a `'met'` answer set is not a fork-opinion answer set. «Tell her we are behind her» is
 *  a sentence about a decision she asked him to weigh in on; there is no decision here and nothing
 *  was asked of him. Keying the table on `LifeBeatKind` makes a missing set a COMPILE error, which
 *  is the same guarantee `HER_LINE`'s total record gives her voice.
 *
 *  ⚠ NO NUMBER, NO PRICE, NO METER in any label – the dialog never exposes one (the fence).
 *
 *  ⚠ THE `'met'` LABELS NAME NO GENDER, and that is the schema being obeyed rather than a style
 *  choice: `LoveEpisode` persists no name and no gender on purpose («the schema must not hardwire
 *  boyfriend -> husband»), so a button reading «ask to meet HIM» would put on screen a fact the world
 *  does not hold. The wave-3 brief's own draft of the intrusive label says «him»; this is the same
 *  option with the fact taken out, and the wording is the owner's to settle either way (§5). */
export const LIFE_BEAT_OPTIONS: Record<LifeBeatKind, readonly LifeBeatAnswer[]> = {
  /** ⚠ THE FORK'S THREE, BYTE-IDENTICAL AND IN THEIR ORIGINAL ORDER (invariant 4 – a shipped string
   *  is not an agent's to change, and this restructure touched none of them). The labels name no
   *  want, deliberately: the buttons cannot become a second way of reading her answer off the
   *  screen, and «press the other way» stays honest when there are two other ways. */
  'fork-opinion': [
    { id: 'back', label: 'Tell her we are behind her', bond: ECONOMY.bond.delta.beatBacked },
    { id: 'press', label: 'Tell her we see it differently', bond: ECONOMY.bond.delta.beatPressed },
    { id: 'listen', label: 'Say nothing, and let her talk', bond: ECONOMY.bond.delta.beatListened },
  ],
  /** ⭐ THE FOUR REACTIONS (brief §2 T7's shape, §4's ruled deltas): warm, wary, intrusive, silent.
   *  ⚠ THE WANTS FLIP IS AN OVERLAY ON THIS LIST, not a row in it – see `MET_BOND_PRIVATE`. */
  met: [
    { id: 'warm', label: 'Tell her we are glad', bond: ECONOMY.bond.delta.metWarm },
    { id: 'wary', label: 'Ask the coach to watch her schedule', bond: ECONOMY.bond.delta.metWary },
    { id: 'meet', label: 'Say we want to meet them, now', bond: ECONOMY.bond.delta.metIntrusive },
    { id: 'silent', label: 'Say nothing about it', bond: ECONOMY.bond.delta.metSilent },
  ],
  /** ⭐⭐ TIER 1's THREE, AND EVERY ONE OF THEM IS A LITERAL ZERO (v74 T8, ruling V2 – «tier-1
   *  replies move nothing»). §5b asks for «2–3 reply options»; these are three parent moves that fit
   *  a worry, a joy or a question alike, because the answer set is keyed on the KIND and her subject
   *  is a fact on the row rather than a second table.
   *
   *  ⚠⚠ THE ZERO IS WRITTEN OUT AND NOT SOURCED TO `ECONOMY.bond.delta`, and that is the ruling made
   *  structural: there is no tier-1 row in the delta table because tier 1 has no economy («the delta
   *  table stays the big beats'»). A named constant here would be the first step toward a tunable
   *  nobody ruled, and the day somebody tuned it every one of these four-a-season conversations would
   *  start paying. ⚠ `tests/wave3-small-talk.test.ts` §C is the pin that goes red if one of them
   *  stops being zero. */
  'small-talk': [
    { id: 'more', label: 'Ask her to say more', bond: 0 },
    { id: 'view', label: 'Tell her what we think', bond: 0 },
    { id: 'easy', label: 'Tell her it can keep', bond: 0 },
  ],
  /** ⭐⭐⭐ v74 T17 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE ZERO IS A RULING RATHER THAN A
   *  DEFAULT. «Counsel is information, not a test» – V2's own law read one tier up: the coach is not
   *  a person the parent can answer WRONGLY, and a priced reply would turn a phone call about his
   *  daughter into a thing to be played correctly. There is no third option and no `listen` detour:
   *  he has said his piece, and a panel promising more of him would be the fictional dishonesty the
   *  10.09 ruling took out of the fork.
   *
   *  ⚠⚠ AND THE PAIR OF ZEROES IS ALSO A HARD REQUIREMENT, not just a design one:
   *  `tools/_lifeBeats.ts`' `drainLifeBeats` picks the bond-neutral option and THROWS if a kind has
   *  none – forty tools, `npm run e2e:fixtures` and every walked test depend on it, and `npm run
   *  check` would stay green while all of them broke. `tests/wave3-reaction.test.ts` §D is the sweep
   *  that says every kind has one.
   *
   *  ⚠ NEITHER LABEL PROMISES AN OUTCOME. What the parent does about it is the fork, one card later,
   *  and a button here reading «tell the coach she is playing» would be a second, unpriced fork.
   *
   *  ⚠⚠ AND NO PRONOUN FOR THE COACH, IN THESE LABELS OR IN THE FEED ROWS BELOW – R15-7's rule, which
   *  `tests/coach-voice.test.ts` sweeps over every literal in this file: the sim holds no gender for a
   *  coach, so «thank him» is a fact the world does not have. The first draft of this pool said it and
   *  the sweep caught it, which is what that guard is for. */
  'fork-counsel': [
    { id: 'heard', label: 'Thank the coach for saying it plainly', bond: 0 },
    { id: 'weigh', label: 'Say we will sit with it', bond: 0 },
  ],
  /** ⭐⭐⭐ v75 T4 – THE FOUR THE ENDING OFFERS (build plan §5's shape, ruling G's prices). ⚠ THIS IS
   *  THE LIST AS A GIRL WHO WANTS **SPACE** PRICES IT, which is `LIFE_BEAT_OPTIONS`' own doctrine
   *  applied to the second read in this file: the base column here is `'space'` exactly as it is
   *  `'open'` for `'met'`, and `ENDED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor` is the only
   *  road to the priced set either way.
   *
   *  ⚠⚠ THE FIRST KIND WITH NO FREE ANSWER, and that is the whole of the 12.09 drain amendment's
   *  reason for existing (wave-4 brief §0.2). Nothing here costs zero under any reading. What keeps
   *  a harness safe instead is that `fix-it` and `blame` are READ-INDEPENDENT – the overlay below
   *  names neither – so `DRAIN_ANSWER['ended'] = 'fix-it'` charges −1 whatever she wanted, which is
   *  an arithmetic a bench can print (`tools/_lifeBeats.ts`, `drainSkewLine`).
   *
   *  ⚠ THE LABELS NAME NO GENDER AND NO PERSON, the schema being obeyed rather than a style choice:
   *  `LoveEpisode` persists no name and no gender, so «them» is the only honest word for whoever is
   *  gone. ⚠ AND NO NUMBER, NO PRICE, NO METER in any of them (the fence) – and, per ruling G, the
   *  LABELS ARE UNTOUCHED BY THE FLIP: same four sentences, same order, same ids, both readings. A
   *  button that changed its words with its price would be the meter one step removed. */
  ended: [
    { id: 'space', label: 'Give her room, and say we are here', bond: ECONOMY.bond.delta.endedMatched },
    { id: 'company', label: 'Keep her company, and stay close this week', bond: ECONOMY.bond.delta.endedMismatched },
    { id: 'fix-it', label: 'Offer to help put it right', bond: ECONOMY.bond.delta.endedFixIt },
    { id: 'blame', label: 'Say they were never worth it', bond: ECONOMY.bond.delta.endedBlame },
  ],
}

/** ⭐⭐⭐ v74 T7 – THE WANTS FLIP, AS AN OVERLAY AND NEVER AS A SECOND TABLE. A girl whose drawn
 *  `wants` is `'private'` reads silence as the kindness and warmth as the thing that puts it in the
 *  room; the other two answers are the same act whatever she asked for, so they are ABSENT here.
 *
 *  ⚠⚠ THE ABSENCE IS THE LOAD-BEARING HALF AND IT IS WHY THIS IS AN OVERLAY. `'met'` must keep
 *  exactly one BOND-NEUTRAL answer under BOTH readings: `tools/_lifeBeats.ts`' `drainLifeBeats` is
 *  how forty tools, `npm run e2e:fixtures` and `tests/helpers/career.ts` walk careers past a beat
 *  they never meant to price, it takes the option whose delta is zero, and it THROWS rather than
 *  pick a costed one. A flip written as a COPY of the four rows could drift `wary` off zero in one
 *  careless edit and move every bond number those benches measure – `npm run check` staying green
 *  the whole way, because all of it typechecks. Overlaying two rows makes the zero literally the
 *  same zero. `tests/wave3-reaction.test.ts` §D pins it over every kind x every `wants`.
 *
 *  ⚠ AND NOTHING PRINTS EITHER NUMBER: the read reaches the player through `MET_HER_LINE`,
 *  `MET_MENTION`, `MET_DRY` and `MET_EVENT` – wording, never a mark. */
const MET_BOND_PRIVATE: Readonly<Record<string, number | undefined>> = {
  warm: ECONOMY.bond.delta.metWarmPrivate,
  silent: ECONOMY.bond.delta.metSilentPrivate,
}

/** ⭐⭐⭐ v75 T4 – THE ENDING'S FLIP, AND IT IS `MET_BOND_PRIVATE`'s SHAPE DELIBERATELY, DOWN TO THE
 *  ARGUMENT FOR THE ABSENCES. A girl whose drawn read is `'company'` wants her parent near her; the
 *  base list is the other read, so the only two rows that move are the two the read is ABOUT.
 *
 *  ⚠⚠ THE ABSENCE OF `fix-it` AND `blame` IS THE LOAD-BEARING HALF, exactly as `wary`'s and `meet`'s
 *  is one table up. Overlaying two rows makes «−1 always» literally the same −1 in both readings
 *  rather than two numbers that happen to agree – and `tools/_lifeBeats.ts` drains this kind through
 *  that −1, with `drainCostOf` refusing outright if the two readings ever disagree. A flip written as
 *  a COPY of the four rows could drift `fix-it` off −1 in one careless edit and move every bond
 *  number forty benches measure, with `npm run check` green the whole way, because all of it
 *  typechecks. `blame` is absent for the ruling's own reason as well: «some things are wrong
 *  regardless of what she wanted».
 *
 *  ⚠ AND NOTHING PRINTS EITHER NUMBER: the read reaches the player through `ENDED_HEADING` and
 *  `ENDED_LATE_EVENT` – wording, never a mark. */
const ENDED_BOND_COMPANY: Readonly<Record<string, number | undefined>> = {
  space: ECONOMY.bond.delta.endedMismatched,
  company: ECONOMY.bond.delta.endedMatched,
}

/** ⭐⭐⭐ v74 T7 – THE ANSWER SET **AS THIS GIRL PRICES IT**, and the one road to it. Every reader of
 *  a beat's answers goes through here: `buildLifeBeatPrompt` to render the card, `answerLifeBeat` to
 *  charge it, `pendingLifeBeatOptions` for everything outside the engine. Two readings of one price
 *  list is exactly the disagreement rule 3 exists to prevent, so there is one function.
 *
 *  ⚠ `'fork-opinion'` IGNORES `wants` ENTIRELY and that is not an oversight: her attachment has a
 *  `wants` and her college answer does not, and the parameter is meaningless on that kind rather
 *  than merely unused. Only `'met'` flips.
 *
 *  ⚠ THE LABELS ARE UNTOUCHED BY THE FLIP – same four sentences, same order, same ids, in both
 *  readings. A button that changed its words with the price would be the meter this wave refuses to
 *  build, one step removed.
 *
 *  ⭐⭐⭐ v75 T4 – THE THIRD PARAMETER IS THE ENDING'S READ, AND THE FUNCTION GREW RATHER THAN GAINING
 *  A SIBLING (ruling G.3, in its own words: «`lifeBeatOptionsFor` stays the ONE road to a priced
 *  answer set. It grows the kind; it does not grow a sibling»). `pendingLifeBeatOptions`,
 *  `buildLifeBeatPrompt`, `answerLifeBeat` and `tools/_lifeBeats.ts` all keep reaching prices through
 *  here, so «what would this answer cost» has exactly one reading no matter which kind is asking.
 *
 *  ⚠ IT DEFAULTS TO `'space'` FOR `wants`' OWN REASON, and the default is a SHIPPED reading rather
 *  than a neutral stand-in: `LIFE_BEAT_OPTIONS.ended` is the `'space'` column, so a caller that has
 *  no read to hand gets the base table and never a price nobody chose. Every real call comes through
 *  `beatEndsRead`, which derives it from the episode's own `endedWeek`.
 *
 *  ⚠⚠ THE TWO AXES ARE INDEPENDENT AND EACH REACHES ONE KIND. `wants` is meaningless on `'ended'`
 *  (her attachment's disclosure preference is not what she needs the week after it stops) and the
 *  read is meaningless on `'met'`; neither is merely unused on the other, and pretending one axis
 *  could serve both would be the `endsMult`/`temperamentMult` collapse (ruling E) in the copy layer. */
export function lifeBeatOptionsFor(
  kind: LifeBeatKind,
  wants: LoveEpisode['wants'],
  read: EndsRead = 'space',
): readonly LifeBeatAnswer[] {
  const base = LIFE_BEAT_OPTIONS[kind]
  const overlay = kind === 'met' && wants === 'private'
    ? MET_BOND_PRIVATE
    : kind === 'ended' && read === 'company'
      ? ENDED_BOND_COMPANY
      : null
  if (overlay === null) return base
  return base.map((option) => {
    const flipped = overlay[option.id]
    return flipped === undefined ? option : { ...option, bond: flipped }
  })
}

/** ⭐ HER TWO READINGS AS A LIST, so a pin can walk both without transcribing the union. ⚠ DERIVED
 *  FROM A TOTAL RECORD rather than written out: a third `wants` value would make the record below a
 *  compile error, which is the same guarantee `LIFE_BEAT_OPTIONS`' own keying gives the kinds. */
const WANTS_TOTAL: Record<LoveEpisode['wants'], true> = { open: true, private: true }
export const PARTNER_WANTS = Object.keys(WANTS_TOTAL) as readonly LoveEpisode['wants'][]

/** The feed line each answer writes, per kind. ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT
 *  (rule 4). ⚠ Keyed by kind for `LIFE_BEAT_OPTIONS`' own reason: two beats can share an option id
 *  no more than they share an answer set.
 *
 *  ⭐⭐ v74 T8 – AND `null` IS A KIND THAT WRITES NO ROW AT ALL, WHICH IS A DECISION RATHER THAN A
 *  GAP. `'small-talk'` fires up to four times a season and its whole point is texture; a feed row
 *  per answer would bury the private-life thread T9's glyph column exists to make findable under the
 *  parent's own replies to it. The `lifeLog` row is the record, and it is also the counter.
 *
 *  ⚠ THE RECORD STAYS **TOTAL** ON PURPOSE. `Partial<Record<…>>` would have let the next kind ship
 *  with no line by forgetting one; a `| null` makes «this kind writes nothing» a sentence somebody
 *  had to type, and a missing kind is still a compile error. */
const ANSWER_EVENT: Record<LifeBeatKind, Record<string, string> | null> = {
  'fork-opinion': {
    back: 'She said what she wants after school. We told her we are behind her.',
    press: 'She said what she wants after school. We told her we see it differently.',
    listen: 'She said what she wants after school. We listened all the way to the end.',
  },
  met: {
    warm: 'There is someone in her life. We told her we are glad about it.',
    wary: 'There is someone in her life. We asked her coach to keep an eye on the weeks.',
    meet: 'There is someone in her life. We asked to meet them, and asked this week.',
    silent: 'There is someone in her life. We left it where she put it.',
  },
  // ⚠⚠ NO ROW, AND THE `null` IS THE STATEMENT – see the record's own note above. Tier 1 leaves its
  // trace in `lifeLog` and nowhere else.
  'small-talk': null,
  // ⭐⭐⭐ v74 T17 – AND THE COUNSEL **DOES** WRITE ONE, which is the opposite call to tier 1's and has
  // the opposite reason. This fires at most once in a career, on the biggest week of it, and the feed
  // is where the career is read back afterwards: a stop that the coach had a view about and a stop he
  // was never asked about are two different biographies, and only the row can tell them apart later.
  // ⚠ NO `amountCents` AND NO PRICE IN EITHER LINE (rule 4), and neither names what he said – the
  // read was the card's, and the feed records that the call happened and what the parent did with it.
  'fork-counsel': {
    heard: 'Her coach called about her wanting to stop. We said thank you for the plain answer.',
    weigh: 'Her coach called about her wanting to stop. We said we would sit with it.',
  },
  /** ⭐⭐⭐ v75 T4 – AND THE ENDING WRITES ONE, for `'fork-counsel'`'s reason rather than tier 1's:
   *  a break-up the parent met well and one he met badly are two different biographies, and only the
   *  row can tell them apart seasons later when the feed is what the career is read back through.
   *
   *  ⚠ FOUR LINES, ONE PER ANSWER, AND NO READ AXIS. What the ROW records is what the parent DID,
   *  which is the same act whichever way her read came out; whether it was the thing she wanted is
   *  the card's own surface (`ENDED_HEADING`) and the told-late delivery row's. A feed line that
   *  scored the answer would be the meter, written down. ⚠ T6 owns the full matrix and may split it.
   *
   *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4), no name, no gender, no fault and no
   *  reason – the two-tier honesty law, which binds this pool exactly as hard as the card's. */
  ended: {
    space: 'Her relationship ended. We gave her room, and said we were there.',
    company: 'Her relationship ended. We kept her company through the week.',
    'fix-it': 'Her relationship ended. We offered to help put it right.',
    blame: 'Her relationship ended. We said they were never worth it.',
  },
}

/** Who she is, for the WORDING alone. Defensive `?? temperamentFor(seed)` on the v72 field for the
 *  probe worlds that predate it – the same shape `accrueSpirit` uses. */
function voiceOf(world: WorldState): Temperament {
  return world.temperament ?? temperamentFor(world.seed)
}

/** ⭐⭐ WHERE SHE IS LIVING THIS WEEK, for the WORDING alone – the presence law's one input, read off
 *  the world through the diary's own single derivation (`diaryLifeStageFor`) so a life beat and the
 *  week note under the same painting can never disagree about which stage she is in.
 *
 *  ⚠ THE `inCollege` TEST IS STRUCTURAL RATHER THAN THE FUNCTION, and it is `world/snapshot.ts`'
 *  OWN precedent copied with its reason: `world/college.ts` is the heavy middle of the package and
 *  this file is imported BY `endings.ts`, which imports college in turn – so the import would be a
 *  new arrow into a module that already has one pointing here. The comparison is two lines and has
 *  an inlined twin in `world/medical.ts` for the same kind of reason. ⚠ It is NOT a second reading
 *  of the STAGE, which is the fact that matters: `diaryLifeStageFor` is still the one place the
 *  four stages are cut. */
function lifeStageOf(world: WorldState): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(world.week, world.profile.birthMonth),
    world.college !== null && world.week < world.college.untilWeek,
  )
}

/** ⭐ THE CHANNEL – does the news arrive in HER VOICE at all (who-she-is §5b's bond row)? `close` and
 *  `steady` do; `strained` and `cold` collapse into the flat pool. Bond multiplies no pool: it
 *  SELECTS between two the beat needs anyway. */
function speaksInHerOwnVoice(band: BondBand): boolean {
  return band === 'close' || band === 'steady'
}

/** ⭐⭐ THE LINE SHE SAYS, ASSEMBLED. Exported so the completeness pin can walk kind x temperament x
 *  register x want without mounting a world – §5b's line item 3: «a test walking beatKind x
 *  temperament x register that FAILS on a missing variant, so a `quiet` girl can never silently
 *  receive a `fiery` girl's line as a fallback. (The flat pool is the one legal shared fallback, and
 *  only at strained/cold.)»
 *
 *  ⭐ v74 T7 – `wants` IS THE LAST PARAMETER AND IT DEFAULTS TO `'open'`, which is a statement about
 *  the two kinds and not a convenience. `'fork-opinion'` has no `wants` at all – her college answer
 *  is not an attachment – so a default lets wave 2's whole pin sweep keep calling this with five
 *  arguments and keep asserting, byte for byte, the lines it was written against. `'met'` is always
 *  called with the episode's own reading (`buildLifeBeatPrompt` -> `beatWants`), and the default
 *  `'open'` is T6's shipped reading rather than a neutral stand-in.
 *
 *  ⭐ 11.09 – `stage` IS THE SEVENTH AND IT IS THREADED EXACTLY AS `wants` WAS, for exactly the same
 *  reason: an added parameter with a safe default, so wave 2's whole pin sweep keeps calling this
 *  with five arguments and keeps asserting the lines it was written against. The default is
 *  `'school'`, which is a ROOF stage – T6's and T8's shipped reading, not a neutral stand-in – and
 *  every real call comes through `lifeBeatPromptFor`, which derives the stage from the world.
 *
 *  ⚠ IT TAKES THE STAGE AND NOT A `BeatPresence`, so the ONE place the roof/away cut is made is
 *  `presenceOf` above (which asks `awayVoice`, which is the single copy of the rule). A caller that
 *  could hand in a presence directly would be a second reading of «is she under this roof». */
export function lifeBeatSaid(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  register: MoodRegister,
  bond: BondBand,
  wants: LoveEpisode['wants'] = 'open',
  stage: DiaryLifeStage = 'school',
  driver: ForkStopDriver = 'own',
  endsRegister: EndsRegister = 'told-now',
): string {
  const presence = presenceOf(stage)
  // ⭐ v74 – THE SECOND KIND, AND THE `switch` IS THE UNION'S WHOLE POINT: a third cannot be added
  // without this function refusing to compile against it. ⚠ `'met'` READS NO `detail` AND NO
  // `register`: its detail is an episode id (a machine value, never a rendered word) and its three
  // registers are the BOND ladder, not the Mood one – see the §3b banner.
  switch (kind) {
    case 'met': {
      // ⭐⭐ v74 T7 – THE READ IS IN THE WORDING AND IN NOTHING ELSE. All three rungs of the ladder
      // carry it, because the flip prices a cold home's answers exactly as it prices a close one's
      // and a rule only half the ladder can read is a hidden number.
      // ⚠ AND PRESENCE REACHES THE `her` RUNG ALONE, which is the reading rather than an omission:
      // the mention and the dry card are the PARENT's narration about a house that was not told, and
      // «the house found out anyway» is as true of a family chat as of a hallway. What presence
      // governs is the scene SHE is standing in when she speaks, and on those two rungs she does not.
      const met = metRegisterOf(bond)
      return met === 'her'
        ? presenceLine(MET_HER_LINE[voice][wants], presence)
        : met === 'mention'
          ? MET_MENTION[wants]
          : MET_DRY[wants]
    }
    // ⭐ v74 T8 – THE THIRD KIND. ⚠ IT READS THE ROW'S OWN `detail` AND NOT THIS WEEK'S REGISTER,
    // which is `'fork-opinion'`'s shape and is the honest one: the subject she came with is a fact
    // the row recorded when it was raised, so a re-derivation cannot hand a girl who came with a
    // worry the line she would have said in a brighter week. ⚠ AND IT READS NO `bond`: the band
    // decides whether this beat exists at all (0 at strained/cold) and never how it sounds, so there
    // is no flat pool to select – see the §3c banner.
    case 'small-talk': {
      const subject = SMALL_TALK_SUBJECTS.find((s) => s === detail)
      if (subject === undefined) throw new Error(`A small-talk row carries no subject: ${detail}`)
      return presenceLine(SMALL_TALK_LINE[voice][subject], presence)
    }
    // ⚠ THE FORK READS NO PRESENCE, AND THAT IS A SCOPE STATEMENT. Its pool is wave 2's and the
    // вычитка was of wave 3's two; the fork also fires in a narrow window around the end of school,
    // which is a roof stage by construction (`schoolOver` is what opens `after-school` at all). The
    // day a beat of wave 2's can fire from a dorm, its own away column is a step, not a line here.
    case 'fork-opinion': {
      const want = FORK_WANTS.find((w) => w === detail)
      if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
      if (!speaksInHerOwnVoice(bond)) return FLAT_LINE[want]
      // ⭐⭐⭐ v74 T17 – AND `stop` IS THE ONE WANT WITH A ROOT TO NAME. `college` and `tour` read
      // exactly the lines they have always read (the driver is `'own'` by default and `stopLine` is
      // not on their path at all); `stop` reads the driver's column, whose `'own'` case IS the
      // shipped register pair. Not one byte of wave 2's pool moved for this.
      if (want !== 'stop') return HER_LINE[voice][want][register === 'low' ? 'low' : 'up']
      return stopLine(voice, driver, register === 'low' ? 'low' : 'up')
    }
    // ⭐⭐⭐ v74 T17 – THE FOURTH KIND, AND IT READS ITS OWN `detail` LIKE TIER 1 DOES. The row records
    // the driver the moment it is raised, off the same spirit and bond her own line was worded from
    // (`answerLifeBeat` derives it BEFORE the answer's bond delta lands), so the two voices are
    // reading one girl. A re-derivation from a later world could hand a parent a coach explaining a
    // different stop from the one she just described.
    // ⚠ IT READS NO `voice` AND NO `bond`: the coach is not her and is not the relationship – see the
    // §3d banner. It reads no `register` either, for tier 1's own reason: the week is hers.
    case 'fork-counsel': {
      const root = FORK_STOP_DRIVERS.find((d) => d === detail)
      if (root === undefined) throw new Error(`A fork-counsel row carries no driver: ${detail}`)
      return COACH_COUNSEL[root]
    }
    // ⭐⭐⭐ v75 T4 – THE FIFTH KIND. ⚠ IT READS NO `detail` AND NO `register`, for `'met'`'s own two
    // reasons: its detail is an episode id (a machine value, never a rendered word) and the Mood
    // ladder is not this card's axis. What it reads instead is the TOLD-NOW / TOLD-LATE register,
    // which is derived from the `'met'` receipt one layer up (`beatEndsRegister`) and handed in – the
    // same shape `driver` arrives in, and for the same reason: this function is pure so the
    // completeness pin can walk every cell without posing a world.
    // ⚠⚠ AND IT READS NO `EndsRead`. The read moves the PRICE and the HEADING, never her line – see
    // the §3e banner, where that decision and its two grounds are written out.
    case 'ended':
      return speaksInHerOwnVoice(bond)
        ? presenceLine(ENDED_HER_LINE[voice][endsRegister], presence)
        : ENDED_DRY[endsRegister]
  }
}

/** The parent's frame over the card, per kind. ⚠ THE TWO KINDS KEY ON DIFFERENT FACTS and that is
 *  the reading rather than an inconsistency: the fork's heading says what the WEEK around the
 *  conversation was like (the Mood register), and this beat's says how far apart the two of them are
 *  when the news lands (the bond band). See `MET_HEADING`. */
export function lifeBeatHeading(
  kind: LifeBeatKind,
  register: MoodRegister,
  bond: BondBand,
  // ⭐⭐⭐ v75 T4 – THE ENDING'S TWO AXES, defaulted exactly as `lifeBeatSaid`'s later parameters are,
  // so every pin waves 2 and 3 wrote keeps calling this with three arguments and keeps asserting the
  // frames it was written against. ⚠ THE DEFAULTS ARE SHIPPED READINGS AND NOT NEUTRAL STAND-INS:
  // `'told-now'` is the register an ending the parent already knew about arrives in, and `'space'` is
  // the column `LIFE_BEAT_OPTIONS.ended` itself is written as.
  endsRegister: EndsRegister = 'told-now',
  read: EndsRead = 'space',
): string {
  switch (kind) {
    case 'met':
      return MET_HEADING[metRegisterOf(bond)]
    // ⭐ v74 T8 – TIER 1 KEYS ON THE MOOD REGISTER, which is the FORK's axis and not the `'met'`
    // card's: this beat is about her week, and there is no distance in it to read (a `strained` or
    // `cold` home never raises one).
    case 'small-talk':
      return SMALL_TALK_HEADING[register]
    case 'fork-opinion':
      return HEADING[register]
    // ⭐ v74 T17 – ONE FRAME, KEYED ON NOTHING. The Mood register is the weather of HER week and the
    // bond band is the distance between the two of them; this card is a call from a third person, and
    // neither axis is a fact about it. See `COUNSEL_HEADING`.
    case 'fork-counsel':
      return COUNSEL_HEADING
    // ⭐⭐⭐ v75 T4 – TWO AXES, AND NEITHER OF THEM IS A LADDER. The register says which scene this is
    // and the read says what she seems to want from him; the Mood register is the weather of her week
    // and the bond band is the distance between the two of them, and neither is a fact about THIS
    // card. ⚠ THIS IS THE ONE SURFACE THE READ REACHES AT EVERY BOND BAND – see the §3e banner.
    case 'ended':
      return ENDED_HEADING[endsRegister][read]
  }
}

/** ⭐ HER CONTINUATION when the parent only listens – null exactly where the flat pool speaks,
 *  because a girl who answered in one word has nothing more to give a silence (the 10.09 ruling's
 *  own boundary). Exported beside `lifeBeatSaid` so the completeness pin walks this pool the same
 *  way: kind x temperament x want, no silent fallback between voices. */
export function lifeBeatListenFollowUp(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  bond: BondBand,
): string | null {
  // ⚠⚠ `'met'` HAS NO LISTEN DETOUR, AND THE NULL IS THE RULE RATHER THAN A GAP (brief §2 T6). At the
  // fork «say nothing and let her talk» buys more of her, because she came to say something and has
  // more of it. `'met'` is news: its four answers are REACTIONS, one of which is saying nothing, and
  // a second panel promising more of her would be the fictional dishonesty the 10.09 ruling removed.
  // ⚠ AND `'small-talk'` HAS NONE EITHER (v74 T8), for a reason of its own rather than `'met'`'s:
  // she came with something SMALL and has said it. The three replies are the whole of the beat, one
  // of which is letting it keep – a second panel promising more of her would be the same fictional
  // dishonesty the 10.09 ruling removed from the fork.
  // ⚠ AND `'fork-counsel'` HAS NONE, for a third reason of its own (v74 T17): the listening detour is
  // «say nothing, and let HER talk», and the reward of it is more of her. The coach has given a
  // professional read and has no second half of it being withheld; a panel offering one would promise
  // words nobody wrote. The card's two acknowledgments are the whole of the beat.
  // ⚠ AND `'ended'` HAS NONE (v75 T4), for a fourth reason of its own. «Say nothing, and let her
  // talk» buys more of her because at the fork she came with something she has more of; here she has
  // said the one fact there is, and GIVING HER ROOM IS ALREADY ONE OF THE FOUR ANSWERS – a detour
  // promising more of her would be a second, unpriced way of doing the thing the card already offers.
  if (kind === 'met' || kind === 'small-talk' || kind === 'fork-counsel' || kind === 'ended') return null
  const want = FORK_WANTS.find((w) => w === detail)
  if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
  if (!speaksInHerOwnVoice(bond)) return null
  return HER_CONTINUATION[voice][want]
}

/** ⭐⭐ v74 T7 – WHAT SHE ASKED FOR, FOR THE ROW IN HAND. `'met'`'s `detail` is the episode id, so the
 *  row itself names the attachment whose `wants` prices its answers and colours its line.
 *
 *  ⚠ `'open'` IS THE ANSWER FOR EVERY OTHER KIND, AND IT IS THE BASE READING RATHER THAN A NEUTRAL
 *  STAND-IN: `'fork-opinion'` has no attachment, so there is nothing to read, and the base table is
 *  exactly what such a row has always been answered against.
 *
 *  ⚠ AND `'open'` AGAIN WHEN THE EPISODE IS GONE. A `'met'` row whose episode no longer exists is
 *  unreachable on any state the sim produces (episodes are append-only and never pruned – the
 *  `LoveEpisode` banner), so this branch is for probe worlds hand-built in tests and benches. It
 *  fails onto T6's shipped reading, never onto a price nobody chose. */
function beatWants(world: WorldState, row: LifeBeatRecord): LoveEpisode['wants'] {
  if (row.kind !== 'met') return 'open'
  return loveEpisodesOf(world).find((episode) => episode.id === row.detail)?.wants ?? 'open'
}

/** ⭐⭐⭐ v75 T4 – HAS THIS EPISODE BEEN DELIVERED YET, asked of the `lifeLog` and of nothing else.
 *
 *  ⚠⚠ THE RECEIPT IS THE RECORD (rule 2 at the head of this file, and `deliverKnownPartner`'s own
 *  doctrine): there is no `told: true` flag on the episode, because a second boolean beside a record
 *  that already answers the question is one fact with two sources of truth and they desync. Wave 3
 *  read this same predicate inline for `'met'` alone; wave 4 needs it in three places – the delivery
 *  scan, the told-now raise in §8, and the register a card is worded from – so it is named once here
 *  rather than spelled three ways.
 *
 *  ⚠ `kinds` IS A PARAMETER BECAUSE THE THREE CALLERS ASK DIFFERENT QUESTIONS. §8 asks «was he ever
 *  told there was somebody» (`'met'` alone, ruling A's discriminator); the delivery scan asks «has
 *  this row produced ANY beat yet» (either kind), because a told-late row that has already surfaced
 *  must not surface again. Folding them into one predicate would make one of the two wrong. */
function hasBeatFor(world: WorldState, episodeId: string, kinds: readonly LifeBeatKind[]): boolean {
  return lifeLogOf(world).some((row) => kinds.includes(row.kind) && row.detail === episodeId)
}

/** ⭐⭐⭐ v75 T4, RULING A – WHICH SCENE AN `'ended'` CARD IS, DERIVED FROM THE `'met'` RECEIPT.
 *
 *  ⚠⚠ THIS IS THE RULING'S DEPARTURE FROM THE BRIEF, IN ONE LINE OF CODE. The brief said told-late
 *  when `endedWeek < knownWeek`; that reading calls `endedWeek === knownWeek` *known* and therefore
 *  raises `'ended'` and `'met'` in the same tick – two contradictory beats about one girl, which the
 *  brief itself forbids two lines earlier. The receipt has neither problem: it is a fact about what
 *  the parent HAS ACTUALLY BEEN SHOWN, which is the thing «told» was always trying to mean.
 *
 *  ⚠ IT STAYS RE-DERIVABLE FOR THE LIFE OF THE CAREER, which is what lets it be derived rather than
 *  stored. A `'met'` row can never be appended AFTER an `'ended'` row for one episode: the told-late
 *  path in §6 raises no `'met'`, ever, and §6 delivers each episode exactly once. So the answer this
 *  gives on the raise week is the answer it gives twenty seasons later, and the album can re-word an
 *  old card without the row having carried a register it might have disagreed with.
 *
 *  ⚠ ANY OTHER KIND READS `'told-now'`, which is the base register and not a neutral stand-in –
 *  `beatWants`' own shape, and nothing but an `'ended'` row ever asks. */
function beatEndsRegister(world: WorldState, row: LifeBeatRecord): EndsRegister {
  if (row.kind !== 'ended') return 'told-now'
  return hasBeatFor(world, row.detail, ['met']) ? 'told-now' : 'told-late'
}

/** ⭐⭐⭐ v75 T4 – WHAT SHE WANTS FROM HIM AFTER IT STOPS, on `seed:life:ends:<endedWeek>:react`.
 *
 *  ⚠⚠ THE WEIGHTS ARE `drawPartnerWants`' OWN AND THE SPEC SAYS SO IN ONE SENTENCE (who-she-is §4,
 *  «Wants weights», verbatim): «open girls draw `'open'` / `'company'` at ~70%; private girls
 *  `'private'` / `'space'` at ~70%». One row, two draws – so this is NOT a coin flip, and a 50/50
 *  here would have been a silent tuning change dressed as an absent constant. The own-register share
 *  is `ECONOMY.life.wantsOwnRegister`, the same 0.70 the disclosure draw reads, because §4 gives them
 *  one number and two numbers would be two facts sharing a sentence.
 *
 *  ⚠ (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED, and the calendar week is the ENDING's
 *  (ruling G.1). On a told-late episode the card is raised seasons after the ending; the key stays
 *  `endedWeek`, because `seed:life:ends:<week>` and `seed:life:ends:<week>:react` are siblings and a
 *  pair keyed on two different weeks is two facts sharing a name. MAIN is not reached.
 *
 *  ⚠ THE TEMPERAMENT IS A PARAMETER, `endsHazardFor`'s own primitives doctrine – so a census can
 *  sweep the table without posing a world per cell. */
export function drawEndsRead(seed: string, endedWeek: number, temperament: Temperament): EndsRead {
  const own: EndsRead = temperamentOpenness(temperament) === 'open' ? 'company' : 'space'
  const roll = rngFromSeed(`${seed}:life:ends:${endedWeek}:react`)()
  if (roll < ECONOMY.life.wantsOwnRegister) return own
  return own === 'company' ? 'space' : 'company'
}

/** ⭐⭐⭐ v75 T4, RULING G.2 – THE READ FOR THE ROW IN HAND, `beatWants`' TWIN. Find the episode by
 *  `row.detail`, take its `endedWeek`, derive the stream.
 *
 *  ⚠⚠ RE-DERIVED AND NEVER STORED, which is a correctness requirement and not a preference.
 *  `answerLifeBeat` re-validates the chosen option against the priced set (rule 3 at the head of this
 *  file), so the price has to be RECONSTRUCTIBLE at answer time from facts the world holds – and the
 *  facts it holds are the episode's dates and the seed. A read stamped onto the row at raise time
 *  would be a second source of truth for one draw, and the two would part the first time a migration
 *  or a command touched one of them.
 *
 *  ⚠ `'space'` WHEN THERE IS NOTHING TO READ – a row whose episode is gone, or an episode with no
 *  `endedWeek`. Neither is reachable on any state the sim produces (episodes are append-only and
 *  never pruned, and an `'ended'` row is only ever raised beside a written date), so this is for the
 *  probe worlds hand-built in tests and benches. It fails onto the BASE table, never onto a price
 *  nobody chose – `beatWants`' own `'open'` fallback, for its own reason. */
function beatEndsRead(world: WorldState, row: LifeBeatRecord): EndsRead {
  if (row.kind !== 'ended') return 'space'
  const episode = loveEpisodesOf(world).find((e) => e.id === row.detail)
  if (episode === undefined || episode.endedWeek === null) return 'space'
  return drawEndsRead(world.seed, episode.endedWeek, temperamentOf(world))
}

/** ⭐⭐ v74 T7 – THE PRICED ANSWER SET FOR WHATEVER IS PENDING, or null when nothing is. The one
 *  reading of «what would this answer cost» available OUTSIDE the engine, and it exists because
 *  `LIFE_BEAT_OPTIONS` alone is no longer that reading: a caller that reads the base record and
 *  answers from it is asking one question and paying for another.
 *
 *  ⚠ ITS FIRST CALLER IS `tools/_lifeBeats.ts`' `drainLifeBeats`, which picks the bond-NEUTRAL answer
 *  so a harness that never meant to price a beat cannot move the number it is measuring. Under
 *  today's table that is `wary` either way, so nothing a bench measures moves; under a future flip
 *  it is still whatever is genuinely zero FOR THIS ROW, which the base record could not have said. */
export function pendingLifeBeatOptions(world: WorldState): readonly LifeBeatAnswer[] | null {
  const pending = pendingLifeBeat(world)
  // ⭐ v75 T4 – AND THE ENDING'S READ RIDES THE SAME ROAD (ruling G.3). `tools/_lifeBeats.ts` reaches
  // `'ended'`'s prices through here, so the −1 it drains with is the −1 the engine charges.
  return pending === null
    ? null
    : lifeBeatOptionsFor(pending.kind, beatWants(world, pending), beatEndsRead(world, pending))
}

/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is handed
 *  and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ NULL WHILE NOTHING IS PENDING, which is every week of nearly every career: this is called on
 *  every `toSnapshot`, so it is a `find` over a handful of rows and no more.
 *
 *  ⚠ ZERO DRAWS ON MAIN, AND THE PROMPT IS STILL A PURE FUNCTION OF THE WORLD. ⭐⭐ RE-AIMED BY v75
 *  T4 AND NOT RELAXED: this read «ZERO DRAWS. Every word of it is selected by (want, voice, register,
 *  bond band, wants, stage) – six facts the world already holds». An `'ended'` row adds a seventh
 *  that is a DERIVED STREAM rather than a stored field – `beatEndsRead`, one uniform on
 *  `seed:life:ends:<endedWeek>:react`, re-derived at the call site and persisting nothing (CLAUDE.md
 *  invariant 2's sub-stream rule). What the sentence was written to guarantee is untouched and is the
 *  half that matters: MAIN is never reached, so the frozen capture cannot see this function; the
 *  result is a function of (seed, endedWeek, temperament) alone, so re-assembling the prompt on every
 *  `toSnapshot` yields the identical card; and `answerLifeBeat` re-derives the whole thing to
 *  re-validate the option id (rule 3) without the two readings ever being able to disagree. ⚠ WHAT
 *  DID CHANGE: the count is no longer zero on `seed:life:ends:*`, so a net that asserted «assembling
 *  a prompt derives no key at all» is measuring something this wave deliberately moved.
 *
 *  ⚠⚠ AND THE FLIP REACHES THE SCREEN THROUGH `said` ALONE (v74 T7). `options` carries ids and
 *  LABELS and has never carried a `bond`, so the re-priced number cannot leak onto a button even by
 *  accident – the type is the fence. What the player has to go on is her line, which is the whole
 *  design: never marked, never labelled, no meter. */
export function buildLifeBeatPrompt(world: WorldState): LifeBeatPrompt | null {
  const pending = pendingLifeBeat(world)
  return pending === null ? null : lifeBeatPromptFor(world, pending)
}

/** ⭐⭐ v74 T15 – THE PROMPT FOR **ONE ROW**, and it is the whole of `buildLifeBeatPrompt`'s body
 *  lifted out unchanged, line for line. The soft surface needs the same assembly for a row the
 *  pending predicate deliberately no longer returns, and the amendment's own words are «the SAME
 *  `LifeBeatDialog` on the same prompt contract» – so there is ONE assembler and both readings of
 *  «which row» hand it the row. A second copy for the card would be the two-readings-of-one-fact
 *  defect rule 3 exists to prevent, one level up. */
function lifeBeatPromptFor(world: WorldState, row: LifeBeatRecord): LifeBeatPrompt {
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
  const voice = voiceOf(world)
  const wants = beatWants(world, row)
  // ⭐⭐⭐ v75 T4 – THE ENDING'S TWO DERIVED FACTS, both read off the world exactly once and then
  // handed to every assembler below, so the heading, her line and the prices can never be worded and
  // priced from two different readings of one row.
  const endsRegister = beatEndsRegister(world, row)
  const read = beatEndsRead(world, row)
  const followUp = lifeBeatListenFollowUp(row.kind, row.detail, voice, band)
  return {
    week: row.week,
    kind: row.kind,
    heading: lifeBeatHeading(row.kind, register, band, endsRegister, read),
    // ⭐ v74 T17 – THE EIGHTH ARGUMENT IS THE DRIVER, AND IT IS THREADED EXACTLY AS `wants` AND
    // `stage` WERE: a parameter with a safe default (`'own'`, which is the shipped reading of a
    // `stop` line and not a neutral stand-in), so every pin wave 2 and wave 3 wrote keeps calling
    // this with five or seven arguments and keeps asserting the lines it was written against.
    // ⚠ IT IS DERIVED FROM THE WORLD'S OWN NUMBERS, not from the band and the register the two lines
    // above read: those are ladders, and the driver is a distance. `forkStopDriverOf` is the one
    // spelling of it and `forkWantWeights` reads the same two roots through the same helper.
    said: lifeBeatSaid(
      row.kind,
      row.detail,
      voice,
      register,
      band,
      wants,
      lifeStageOf(world),
      forkStopDriverOf(world.spirit ?? ECONOMY.spirit.baseline, world.bond ?? ECONOMY.bond.start),
      // ⭐ v75 T4 – THE NINTH IS THE ENDING'S REGISTER, threaded exactly as `wants`, `stage` and
      // `driver` were, and for the same reason: a parameter with a shipped default, so every pin
      // waves 2 and 3 wrote keeps calling `lifeBeatSaid` with five to eight arguments and keeps
      // asserting the lines it was written against. ⚠ THE READ IS NOT HANDED IN, because her line
      // does not carry it – the §3e banner is where that decision lives.
      endsRegister,
    ),
    // ⚠ THE ROW'S OWN KIND PICKS THE ANSWER SET (v74). A flat list here would have offered a girl's
    // «there is someone» the fork's three buttons, which is the defect the per-kind record exists to
    // make impossible – and `answerLifeBeat` re-validates against THIS same reading.
    options: lifeBeatOptionsFor(row.kind, wants, read).map((o) => ({ id: o.id, label: o.label })),
    listenFollowUp: followUp === null ? null : { optionId: 'listen', said: followUp, done: LISTEN_DONE_LABEL },
  }
}

/** ⭐⭐⭐ v74 T15 – THE SOFT SURFACE, AS ONE SNAPSHOT FACT: the Home card's line and the dialog it
 *  opens, or null when nothing of hers is waiting to be heard (who-she-is §5b's amendment).
 *
 *  ⚠⚠ ONE FIELD AND NOT TWO. The card and the prompt are one state – she came by, and this is what
 *  she came with – so a surface cannot draw the invitation while the conversation behind it is
 *  missing, and a screen cannot open a dialog for a row whose window has closed. Both are decided
 *  HERE, by `liveSoftBeat`, which is the same derivation the raise gate asks.
 *
 *  ⚠ `prompt` IS A `LifeBeatPrompt` AND NOT A NEW SHAPE. «Tapping it opens the SAME `LifeBeatDialog`
 *  on the same prompt contract» is the ruling, so the type is the contract and no new dialog exists
 *  anywhere: the component renders whichever of the two prompts it is pointed at.
 *
 *  ⚠ ZERO DRAWS, like every other prompt in this file – it is a `find` over a handful of rows and a
 *  re-assembly from facts the world already holds. */
export function buildSoftBeatInvite(world: WorldState): SoftBeatInvite | null {
  const row = liveSoftBeat(world)
  return row === null ? null : { card: SMALL_TALK_CARD, prompt: lifeBeatPromptFor(world, row) }
}

// =================================================================================================
// 4. RAISING A BEAT, AND ANSWERING ONE
// =================================================================================================

/** ⭐ THE ONE WRITER OF A `lifeLog` ROW. Append-only and never pruned: the album and the census both
 *  read the whole life later, and a row dropped for tidiness is a biography with a hole in it.
 *
 *  ⚠ IT TAKES THE DETAIL RATHER THAN COMPUTING IT, so every beat kind's own trigger owns its own
 *  draw and this stays the plumbing. `raiseForkOpinion` (world/endings.ts's caller) is the first. */
export function raiseLifeBeat(world: WorldState, kind: LifeBeatKind, detail: string): void {
  world.lifeLog ??= []
  world.lifeLog.push({ week: world.week, kind, detail, answer: null })
}

/** ⚠ THE ONLY WAY A PENDING ROW CLEARS, and until it runs `advanceWeeks` refuses to tick – the
 *  birthday's law, for a stronger reason: the beat is her speaking, and a week a player could tick
 *  past would answer her by walking away.
 *
 *  ⭐⭐⭐ `guardNotEndedForGood`, NOT `guardNotEnded`, on `chooseGift`'s own argument and it is the
 *  fourth member of that deliberately short list (constants.ts). A beat is about the FAMILY'S OWN
 *  calendar, which being at a university plainly does not stop – and a guard that refused the
 *  college freeze would refuse the one command that lets time move again inside it. A terminal latch
 *  still refuses with the ended sentence.
 *
 *  ⚠ RE-VALIDATED ENGINE-SIDE (invariant 1): the prompt is re-derived here and the id checked
 *  against the list the ENGINE offered, so a stale dialog cannot record an option this beat never
 *  made. ⚠ AND NEVER A PURCHASE – no `amountCents`, no price in any of its words. */
export function answerLifeBeat(world: WorldState, optionId: string): void {
  guardNotEndedForGood(world)
  const rows = world.lifeLog ?? []
  // ⚠ THE INDEX AND NOT THE ROW THE SELECTORS HAND BACK: `lifeLogOf` returns a readonly view on
  // purpose, and the queue's order is what decides WHICH row this answers – exactly the row the
  // prompt was built from.
  //
  // ⭐⭐⭐ v74 T15 – AND «WHICH ROW» IS NOW TWO QUESTIONS IN ONE ORDER: the blocking beat first, and
  // the live soft row only when nothing is blocking. ⚠⚠ IT IS NOT A `findIndex(answer === null)`
  // ANY MORE, AND THE CHANGE IS LOAD-BEARING RATHER THAN TIDY: a soft row whose window closed keeps
  // `answer: null` for the rest of the career (the honest record that she came and it went unasked),
  // so the naive scan would hand every later answer – a fork, a «there is someone» – to a
  // conversation three weeks dead, and record the parent's word about her attachment against it.
  // ⚠ THE ORDER IS THE STOP CONTRACT READ THE OTHER WAY ROUND: while a blocking beat is up the week
  // is stopped and the card cannot be reached, so the blocking row is what the player is answering.
  const soft = liveSoftBeat(world)
  const at = rows.findIndex((row) => row.answer === null && LIFE_BEAT_BLOCKING[row.kind])
  const target = at >= 0 ? at : soft === null ? -1 : rows.indexOf(soft)
  if (target < 0) throw new Error('No life beat is waiting to be answered')
  const prompt = lifeBeatPromptFor(world, rows[target])
  // ⚠ THE ROW'S OWN KIND, AND NOT A FLAT SEARCH OVER EVERY KIND'S OPTIONS (v74). Reading the whole
  // table here would let a `'met'` row be answered with the fork's `back` – the prompt would refuse
  // it, but the refusal would then be the ONLY thing standing between two beats' answer sets, and
  // rule 3 exists precisely so that two readings of the same fact cannot disagree.
  // ⚠⚠ AND THE ROW'S OWN `wants` PICKS THE PRICE (v74 T7), through the SAME function the prompt one
  // line up was built from. What she asked for is a fact on the episode, so the charge is re-derived
  // here from the world and never carried in from the screen – a dialog cannot choose its own price
  // any more than it can choose its own option set.
  // ⭐⭐⭐ v75 T4 – AND THE ENDING'S READ IS RE-DERIVED ON THIS LINE, WHICH IS RULING G.2's WHOLE
  // REASON FOR REFUSING TO STORE IT. The price of «give her room» depends on a draw taken on the week
  // the attachment ended, which may be seasons behind this tick; `beatEndsRead` reconstructs it from
  // the episode's own date, so the charge below is the charge the card was built with even on a
  // told-late row answered a year later. A read stamped onto the row would have been a second source
  // of truth for one draw – and the prompt one line up is re-derived too, so the two would part
  // silently the first time anything touched one of them.
  const chosen = lifeBeatOptionsFor(
    rows[target].kind,
    beatWants(world, rows[target]),
    beatEndsRead(world, rows[target]),
  ).find((o) => o.id === optionId && prompt.options.some((p) => p.id === o.id))
  if (!chosen) throw new Error('That is not one of the answers this beat offered')
  // ⭐⭐⭐ v74 T17 – THE COUNSEL ARC'S ONE DECISION, AND IT IS TAKEN **BEFORE** THE BOND DELTA LANDS.
  //
  // ⚠⚠ THE ORDER IS THE WHOLE OF THE CORRECTNESS HERE. The driver is the reading her own line was
  // just worded from, and `applyBondDelta` one line down moves the very number a `'strained'` driver
  // is read off – a −2 for pressing her could turn «she is sure» into «the home is cold» between the
  // card the parent read and the call he gets about it. Derived here, the coach explains the girl she
  // described; derived after, he would sometimes be explaining the parent's answer.
  //
  // ⚠ ONLY ON A `stop`, AND ONLY OFF HER OWN ROW. `college` and `tour` keep today's exact flow: her
  // row is answered, the fork opens, nothing else is raised – which is the ruling's own boundary.
  const counselDriver =
    rows[target].kind === 'fork-opinion' && rows[target].detail === 'stop'
      ? forkStopDriverOf(world.spirit ?? ECONOMY.spirit.baseline, world.bond ?? ECONOMY.bond.start)
      : null
  rows[target] = { ...rows[target], answer: chosen.id }
  // ⚠ HIS WORDS MOVE `bond` AND NOTHING ELSE (§4a.2's law, and this wave's fence): no spirit delta
  // from any of this, no skill, no condition, no money.
  applyBondDelta(world, chosen.bond)
  // ⭐⭐⭐ v74 T17 – ...AND THE COACH CALLS. One raise, and the whole of layer 2's machinery is this
  // line plus a `true` in `LIFE_BEAT_BLOCKING`: the new row is blocking, `answerFork` already refuses
  // while any blocking row is unanswered, and so the fork stays shut until the parent has heard him.
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN on purpose. Her kind writes a feed row today, so the two
  // orders agree – but a kind that stopped writing one must not silently stop raising the counsel,
  // and «the raise is below a `return`» is exactly how that would happen.
  // ⚠⚠ THE PSYCHOLOGIST'S BEAT SLOTS HERE, BESIDE THIS LINE, AND NOWHERE ELSE (wave 5). He is a second
  // `raiseLifeBeat` on the same condition with the same driver; the queue answers them in log order,
  // the fork waits for both, and nothing about this file changes shape to take him.
  if (counselDriver !== null) raiseLifeBeat(world, 'fork-counsel', counselDriver)
  // ⭐⭐ v74 T8 – AND A KIND MAY WRITE NO ROW AT ALL. `'small-talk'`'s entry in `ANSWER_EVENT` is
  // `null`, deliberately and by the record's own totality: tier 1 leaves its trace in `lifeLog` and
  // nowhere else, because four «we asked her to say more» rows a season would bury the private-life
  // thread in the parent's own replies to it. ⚠ THE TWO SHIPPED KINDS ARE UNTOUCHED by this branch –
  // their lines are exactly the lines they were, in exactly the feed they were in.
  const answerLine = ANSWER_EVENT[rows[target].kind]
  if (answerLine === null) return
  addEvent(world, {
    week: world.week,
    // ⚠ `'info'` AND NOT v74's `'life'`, ON BOTH KINDS, AND IT IS LEFT ALONE DELIBERATELY. This row
    // is wave-2 machinery: re-typing it would change what the shipped fork-opinion answer looks like
    // in the feed, which is not T6's to do. Whether an ANSWER row should carry the life glyph beside
    // the DELIVERY row that provoked it is a question for T9 (the glyph pass) and for the owner, and
    // it is flagged there rather than settled here.
    type: 'info',
    // ⚠ NO AMOUNT AND NO PRICE IN THE WORDS – rule 4 at the top of this file. An `amountCents` here
    // would put a conversation in the Money breakdown.
    text: answerLine[chosen.id],
  })
}

// =================================================================================================
// 5. THE ARRIVAL – ⚠⚠ WHETHER SOMEONE EXISTS AT ALL (the private life, wave 3: T3 + T5)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T3 and §2 T5. T3 is the weekly hazard and the row it
// appends; T5 is the two draws that fill the row in. THEY ARE ONE MOMENT IN THE CODE and could not
// honestly be two: the brief's own T3 says the row carries «`knownWeek`/`wants` from T5's draws,
// computed at this moment», so a T3 that shipped alone would have had to write placeholder values –
// knowingly-wrong behaviour standing in the tree waiting for a later commit to correct it.
//
// ⚠⚠ THE THREE STREAMS AND NOTHING ELSE (build plan §1f, and §3 of the brief quotes it verbatim):
//
//     seed:life:arrival:<week>             does someone appear, this week
//     seed:life:partner:<sinceWeek>:wants  what she wants done with the news
//     seed:life:partner:<sinceWeek>:lag    how long the parent waits to hear it, RAW
//
// SPLIT KEYS, ONE VALUE PER KEY (the 09.09 stream law), so a read added to one of them later can
// never shift a neighbour's value. `seed:life:smalltalk:<week>` is T8's and `seed:life:ends:*` is
// WAVE 4's – neither exists on this tree and neither may be created early.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2, NOT DELETED, because half of that last sentence has come true and
// a reader has to be able to tell WHICH half. `seed:life:smalltalk:<week>` landed in T8 (§7) and
// `seed:life:ends:<week>` lands in §8 below – so both now exist on this tree, on their own keys,
// derived in their own functions. What the sentence was written to forbid is intact and is the part
// that still binds: NO SECTION MAY READ ANOTHER SECTION'S KEY. ⚠ RE-AIMED AGAIN 12.09 BY T4: this
// ended «and `seed:life:ends:<week>:react` (T4) is still unwritten and may not be created early», and
// T4 is the step it was written to be re-read on – the sixth and last key of the private life now
// exists, in `drawEndsRead` (§3e), keyed on the ENDING's week. `rollArrival` below derives the three
// keys named above and no others, which is what its own count-keys pin asserts and which is the claim
// none of these re-aims has touched.
//
// ⚠⚠ ZERO DRAWS ON MAIN, AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is CLAUDE.md invariant 2
// and is structural: nothing here takes an `Rng`, so the frozen capture (41550 / e6b0c709) cannot
// see this file. The second is the brief's load-bearing rule and is enforced by `rollArrival`'s very
// first line – the gate returns BEFORE the hazard stream is ever derived, never draw-and-discard.
//
// ⚠ AND A MEASURED NOTE ON HOW THAT RULE IS TESTED, because it changes what the test has to be. The
// three keys above carry the WEEK in them, so every week derives a fresh stream from its own key and
// no draw can shift any other week's value: «stream alignment» is true here BY CONSTRUCTION, and a
// two-worlds alignment comparison stays green even under a draw-and-discard mutation. The honest net
// is therefore a COUNT of the keys the gate reaches, and that is what tests/wave3-arrival.test.ts
// asserts (§B) – see its ARM ledger, where the alignment arm is recorded as the one that did NOT go
// red and says so.

/** HER AGE THIS WEEK, fractional. ⚠ `kidAgeExact` TAKES (week, month, day) AND NEVER A WORLD – the
 *  whole engine spells it this way (`world/medical.ts`, `world/coachMarket.ts`, `world/player.ts`),
 *  and it is wrapped here only so the gate and the hazard cannot ask the question two ways. */
function kidAgeNow(world: WorldState): number {
  return kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
}

/** WHO SHE IS, with `accrueSpirit`'s own courtesy for probe worlds hand-built in tests and benches:
 *  the field is required on every career that was created or migrated, and re-deriving it from the
 *  seed is the SAME function `createWorld` drew it with, so the fallback cannot invent a different
 *  girl from the one the save holds. */
function temperamentOf(world: WorldState): Temperament {
  return world.temperament ?? temperamentFor(world.seed)
}

/** THE LAST WEEK AN ATTACHMENT ENDED, or null when none ever has.
 *
 *  ⚠ THE MAXIMUM AND NOT THE TAIL'S, and the two agree on every state the sim can produce: rows are
 *  appended in calendar order and an ending cannot precede its own beginning. Where they differ is a
 *  poked save, and there the maximum is the safe reading – «the most recent time something ended» is
 *  what a cooldown is about, and reading a stale earlier row would let the next arrival come early.
 *
 *  ⚠ NULL IS «CLEAR», NEVER «BLOCKED» (brief §2 T3: «No ended row yet ⇒ clear»). A career that has
 *  lived nothing is not serving a cooldown for it. */
function lastEndedWeek(world: WorldState): number | null {
  let last: number | null = null
  for (const row of loveEpisodesOf(world)) {
    if (row.endedWeek !== null && (last === null || row.endedWeek > last)) last = row.endedWeek
  }
  return last
}

/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ THIS IS THE LOAD-BEARING INVARIANT OF THE STEP and the reason it is a predicate of its own
 *  rather than three `if`s inlined above a roll: a reader has to be able to see, in one place, that
 *  the whole of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  1. ⭐ SIXTEEN – RULED 23.08, confirmed for this wave (who-she-is §4, brief §4's first row).
 *  2. `activeEpisode(world) === null` – nobody new appears while someone is already there. This is
 *     also what makes the tail reading of `activeEpisode` safe: only the tail can ever be open,
 *     because this line refuses to append behind an open row.
 *  3. THE COOLDOWN, per temperament (who-she-is §4's `cooldown` column).
 *
 *  ⚠ THE COOLDOWN IS UNREACHABLE ON THIS TREE, AND IT IS HERE ON PURPOSE. Wave 3 ships arrivals
 *  ONLY: nothing writes `endedWeek`, so `lastEndedWeek` is null on every career the engine can
 *  produce and clause 3 is always true in play. It lands now – with its own tests, run against
 *  hand-built worlds that DO carry an ended row – so that wave 4, which writes the endings, changes
 *  nothing in this function and inherits a cooldown that was tested before it had a caller. Deleting
 *  it as dead code would be the defect, not the tidy-up. */
export function arrivalEligible(world: WorldState): boolean {
  const life = ECONOMY.life
  if (kidAgeNow(world) < life.ageGate) return false
  if (activeEpisode(world) !== null) return false
  const ended = lastEndedWeek(world)
  if (ended !== null && world.week - ended < life.cooldownWeeks[temperamentOf(world)]) return false
  return true
}

/** THE WEEKLY HAZARD, as one probability (who-she-is §4: base 1.0%/wk before 18 and 2.5% from 18,
 *  times the temperament multiplier). Takes PRIMITIVES rather than the world – `forkStandingOf`'s
 *  own doctrine one section up – so the bench and the corridor tests can sweep the table directly
 *  instead of posing a world per cell. */
export function arrivalHazardFor(age: number, temperament: Temperament): number {
  const life = ECONOMY.life
  const base = age < life.adultFrom ? life.arrivalPerWeek.minor : life.arrivalPerWeek.adult
  return base * life.temperamentMult[temperament]
}

/** ⭐ DRAW 1 OF 2 – WHAT SHE WANTS DONE WITH IT, on `seed:life:partner:<sinceWeek>:wants`.
 *
 *  Weighted toward the register she was born with (who-she-is §4: «open girls draw `open` ... at
 *  ~70%») and free to come out the other way, which is the point: a tendency, never a rule, and the
 *  30% is what stops an open girl being a stereotype who never once keeps something to herself.
 *
 *  ⚠ (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED – `drawForkWant`'s own argument above. The
 *  arrival week is calendar, so a player cannot re-roll her preference by playing the week
 *  differently. MAIN is not reached. */
export function drawPartnerWants(seed: string, sinceWeek: number, temperament: Temperament): LoveEpisode['wants'] {
  const own = temperamentOpenness(temperament)
  const roll = rngFromSeed(`${seed}:life:partner:${sinceWeek}:wants`)()
  if (roll < ECONOMY.life.wantsOwnRegister) return own
  return own === 'open' ? 'private' : 'open'
}

/** ⭐ DRAW 2 OF 2 – HOW LONG THE PARENT WAITS, **RAW**, on `seed:life:partner:<sinceWeek>:lag`.
 *
 *  who-she-is §4's «Feed lag» table, verbatim: open – 0 with p 0.70, else uniform 1..4; private –
 *  0 with p 0.10, else uniform 2..12.
 *
 *  ⭐ THE OPEN ROW MOVED 11.09.2026 and this quotation moved with it, because a stale verbatim quote
 *  is drift wearing a citation. §4a's wave-3 census measured the open late-share at 44.0% against
 *  its own ≤ 25% bar, with the RAW draw already 57.4% late before `shaveLag` below could touch it;
 *  the owner moved the table rather than the bar («двигать таблицу – ок»). The DRAW here is
 *  unchanged – one uniform, one key, one threshold read off `ECONOMY.life.lag`. Only the threshold
 *  and the ceiling moved, which is why this step added no stream and took no new draw.
 *
 *  ⚠ IT TAKES THE OPENNESS REGISTER, NOT THE DRAWN `wants`, and the two are independent on purpose:
 *  a private girl who this time decided to say it out loud is still a girl who takes a while to get
 *  round to it. §4's neighbouring rows are what settle the reading – the «Wants weights» row says
 *  «open GIRLS», so «open» in the lag row above it is the same girl and not a drawn value.
 *
 *  ⚠ TWO READS OF ONE PRIVATE STREAM, and that is still ONE VALUE PER KEY: the p-zero test and the
 *  uniform are two halves of a single distribution, and the stream they share is derived here and
 *  discarded here. The split-key law is about two DIFFERENT facts never sharing a key, which is why
 *  `wants` is above with a key of its own. */
export function drawRawLag(seed: string, sinceWeek: number, openness: 'open' | 'private'): number {
  const table = ECONOMY.life.lag[openness]
  const r = rngFromSeed(`${seed}:life:partner:${sinceWeek}:lag`)
  if (r() < table.zeroChance) return 0
  return pickInt(r, table.min, table.max)
}

/** ⭐⭐ THE BOND SHAVE – the raw lag shortened by what the parent has actually built with her.
 *
 *  ⚠⚠ AND THIS IS THE INPUT-INDEPENDENCE STORY OF THE WHOLE WAVE, so it is written down here rather
 *  than assumed. CLAUDE.md invariant 2 says a player's choices may never re-roll the world's dice.
 *  They do not:
 *
 *    * THE DRAW is keyed on (seed, calendar) alone – `sinceWeek` is therefore IDENTICAL across a
 *      no-action run and an action-laden run of one seed, and T11's bench asserts exactly that;
 *    * THE SHAVE is a pure function of `bond`, which is the history the player built by showing up.
 *      So `knownWeek` MAY differ between two runs of one seed, DELIBERATELY.
 *
 *  That is a relationship affecting DISCLOSURE, not dice being re-rolled – who-she-is §2a channel 1,
 *  «she trusts THIS parent». It is the one place in this wave where a player choice is allowed to
 *  show, and anything that made `sinceWeek` move with it would be the bug this note exists to name.
 *
 *  ⚠ THE DIVISORS ARE THE ARCHITECT'S CONCRETISATION (brief §4, marked ⚠ there), bench-visible –
 *  and `strained`/`cold` divide by 1, so a distant home hears about it exactly when the dice said. */
export function shaveLag(raw: number, band: BondBand): number {
  return Math.floor(raw / ECONOMY.life.bondShave[band])
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `loveEpisodes` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. An ineligible week takes ZERO
 *  draws – never draw-and-discard – which is the brief's own load-bearing rule for the step. The
 *  line order below IS the rule; moving the roll above the gate would break it silently, because
 *  every key here carries its own week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND IT SHAVES WITH IS LAST WEEK'S SETTLED VALUE, because this runs before `accrueSpirit`
 *  (see the call site in `world/phaseHerWeek.ts`) and `accrueSpirit` is what regresses `bond` toward
 *  70 each week. That is the reading the design wants – «the bond band AT the arrival week» is what
 *  the parent had built by the time someone appeared, not what this same tick is about to do to it.
 *
 *  ⚠ IT RAISES NO BEAT AND WRITES NO FEED ROW. Delivery is T6's, on `knownWeek`, and a beat raised
 *  here would tell the parent the moment someone appeared – which is the one thing the lag exists to
 *  prevent. The row is a fact about HER; nobody has been told anything yet.
 *
 *  ⚠ AND `endedWeek` IS ALWAYS NULL – wave 4 writes it, and `activeEpisode`'s tail reading plus the
 *  gate's clause 2 are together why the list can only ever end in at most one open row. */
export function rollArrival(world: WorldState): void {
  if (!arrivalEligible(world)) return
  const temperament = temperamentOf(world)
  const hazard = arrivalHazardFor(kidAgeNow(world), temperament)
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY. `<` and not `<=`: a hazard of 0 must be impossible rather
  // than merely unlikely, and `rngFromSeed` can return exactly 0.
  if (rngFromSeed(`${world.seed}:life:arrival:${world.week}`)() >= hazard) return
  const sinceWeek = world.week
  const wants = drawPartnerWants(world.seed, sinceWeek, temperament)
  const raw = drawRawLag(world.seed, sinceWeek, temperamentOpenness(temperament))
  const knownWeek = sinceWeek + shaveLag(raw, bondBandOf(world.bond ?? ECONOMY.bond.start))
  // ⚠ THE `??=` IS `raiseLifeBeat`'s OWN COURTESY and for the same reason: v74 makes the field
  // required and back-fills `[]` on every save, but a probe world hand-built in a test or a bench is
  // not a save and predates every field it does not set.
  world.loveEpisodes ??= []
  // ⚠ `id` AND `partnerId` ARE THE SAME STRING TODAY AND ARE STILL TWO FIELDS – step 6's naming pass
  // is when the identity of the ROW and the identity of the PERSON stop being the same thing, and a
  // schema that had conflated them could not tell them apart afterwards (the T1 note on the type).
  const id = `p:${sinceWeek}`
  world.loveEpisodes.push({ id, sinceWeek, endedWeek: null, knownWeek, wants, partnerId: id })
}

// =================================================================================================
// 6. THE DELIVERY – ⚠⚠ THE WEEK HE IS TOLD (the private life, wave 3: T6)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T6. The arrival above wrote a fact about HER and
// told nobody; this is the other end of the lag, and it is the first moment the private life reaches
// a screen at all.
//
// ⚠⚠ IT FIRES ALWAYS, AND THE BOND BAND PICKS ONLY THE REGISTER (architect, 11.09 – the resolution
// of the build plan's §0.1 against its §4, on wave 2's own precedent). See the §3b banner for the
// three registers. The one-line eligibility change that would make `strained`/`cold` feed-only is
// named in the brief's §7 as a FALLBACK the owner may ask for; it is deliberately not pre-built.
//
// ⚠⚠ ZERO DRAWS, AND THE SHAPE IS WHY: this function reads facts the world already holds
// (`loveEpisodes`, `lifeLog`, `week`) and takes no `Rng` and derives no stream. `seed:life:smalltalk:*`
// is T8's and `seed:life:ends:*` is wave 4's; neither exists on this tree.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2: both of those keys exist now (§7 and §8). ⚠⚠ AND RE-AIMED AGAIN BY
// T4 THE SAME DAY, WHERE THE CLAIM ITSELF MOVED – recorded rather than rewritten, because a reader has
// to be able to tell which half changed. The section said «delivery derives no stream at all, on any
// wave»; ruling B's told-late branch derives ONE, `seed:life:ends:<endedWeek>:react`, to word the row
// it writes. That is a purpose-scoped sub-stream keyed on (seed, calendar) and re-derived at the call
// site – CLAUDE.md invariant 2's own shape – and MAIN is still never reached here, which is the part
// of the sentence that was load-bearing. ⚠ IT IS DERIVED ONLY ON THE BRANCH THAT WRITES A TOLD-LATE
// ROW: an ordinary `'met'` delivery, and a tick with nothing due, still derive nothing at all.
// ⚠ T2's own paragraph, kept because it explains the shape of this section: «T2 deliberately leaves
// that alone – it writes `endedWeek` and nothing else – so on THAT tree an episode that ends before
// its `knownWeek` told the parent nothing at all, which is a gap the next commit closes.» T4 is that
// commit.
//
// ⚠ AND IT DUPLICATES NONE OF THE QUEUE. `raiseLifeBeat` appends the row, `pendingLifeBeat` finds it,
// the `'life'` StopReason stops the week and `answerLifeBeat` re-validates the answer – all four are
// wave-2 property and all four are called, never re-implemented.

/** ⭐ THE FEED LINE THE NEWS ITSELF WRITES, before anybody has answered anything. Two of them, on the
 *  same three-rung ladder as the card: a home that was told, and a home that found out.
 *
 *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4 at the top of this file). ⚠ AND NO FACT
 *  ABOUT THE PARTNER: the sim holds none, so neither does the row. T10 owns the full matrix (the
 *  brief's «by openness x wants x told-early/told-late»); these four are the draft that renders.
 *
 *  ⭐⭐⭐ v74 T7 – THE `wants` COLUMN IS HALF THE SURFACE THE FLIP HAS, AND IT IS THE DURABLE HALF.
 *  The card is answered once and gone; this row is `keep: true` and a career reads its own life back
 *  seasons later, so the feed is where a player who was not listening the first time can still learn
 *  what she asked for. ⚠ The `open` column is T6's two lines, BYTE-IDENTICAL. */
const MET_EVENT: Record<'told' | 'found-out', Record<LoveEpisode['wants'], string>> = {
  told: {
    open: 'She told us there is someone in her life.',
    private: 'She told us there is someone in her life, and asked that it stay between us.',
  },
  'found-out': {
    open: 'There is someone in her life, and she did not tell us herself.',
    private: 'There is someone in her life. She had been keeping it to herself.',
  },
}

/** ⭐⭐⭐ v75 T4 – THE TOLD-LATE ROW, AND IT IS THE ROW THAT REPLACES `MET_EVENT` ON THIS PATH rather
 *  than a row added beside it. An episode that was over before its `knownWeek` arrived used to tell
 *  the parent NOTHING at all (wave 3 read the ended row through `knownPartner` and got null); ruling
 *  B turns that gap into the scene the episode schema was re-cut for, and this is the one line of it
 *  the album keeps.
 *
 *  ⚠⚠ ONE ROW AND NEVER TWO. A «she told us there is someone» line followed by «and it is over»
 *  would be the two contradictory records ruling A exists to prevent, written into the feed instead
 *  of into the queue. What happened this week is that he learned BOTH facts at once, and one sentence
 *  is what that is.
 *
 *  ⚠ IT CARRIES HER READ (the brief's «surfaced ... in the feed row's wording»), and this is the
 *  durable half of the two surfaces that do: the card is answered once and gone, and a `keep: true`
 *  row is what a player who was not listening can still read back seasons later. ⚠ T6 owns the full
 *  matrix – the bond-band column `MET_EVENT` carries is deliberately not guessed at here.
 *
 *  ⚠ NO `amountCents`, NO PRICE, NO NAME, NO GENDER, NO REASON AND NO FAULT (rule 4 and the two-tier
 *  honesty law). «There was someone, and it is already over» is the whole of what the world holds. */
const ENDED_LATE_EVENT: Record<EndsRead, string> = {
  // ⚠ «and she left it there» WAS THIS ROW'S FIRST DRAFT AND THE TAIL-LINT CAUGHT IT
  // (tests/wave3-tail-lint.test.ts, `BANNED_TAILS`). It is on the list because the owner replaced
  // the fork's “We listened, and left it there” with a line of his own on 11.09, and the ban is on
  // the NARRATOR summing her up. The replacement states what the week held instead of what it meant.
  space: 'There had been someone in her life. We heard about it and that it was over in the same week, and she has not brought it up since.',
  company: 'There had been someone in her life. We heard about it and that it was over in the same week, and she has been round more since.',
}

/** ⭐⭐⭐ THE DELIVERY, AND THE ONE WRITER OF A `'met'` ROW. ⭐⭐ SINCE v75 T4 IT IS ALSO THE ONE WRITER
 *  OF A **TOLD-LATE** `'ended'` ROW – the same moment, asked of an episode that is already over.
 *
 *  ⚠⚠ EXACTLY ONCE PER EPISODE, AND THE RECEIPT IS THE `lifeLog` ITSELF – a `'met'` or (since T4) an
 *  `'ended'` row whose `detail` is this episode's id. That is `pendingLifeBeat`'s own doctrine read
 *  the other way round
 *  («the record IS the queue», rule 2): there is no `told: true` flag on the episode, because a
 *  second boolean beside a record that already answers the question is one fact with two sources of
 *  truth, and they desync.
 *
 *  ⚠ `<=` AND NOT `===`, DELIBERATELY. The beat is owed on `knownWeek`; the comparison being an
 *  inequality means a week that somehow passed without this running still delivers on the next tick
 *  instead of losing the news for good. The dedupe above is what makes that safe, and the two
 *  together are the property the pin asserts: it fires on `knownWeek`, and it fires once.
 *
 *  ⚠⚠ RE-AIMED BY v75 T4 (ruling B) AND THE OLD SENTENCE IS KEPT SO THE RE-AIM READS AS ONE. It said:
 *  «IT ASKS `activeEpisode` THROUGH `knownPartner`, so "not ended" has ONE spelling in this layer. An
 *  attachment that ended before its `knownWeek` arrived tells the parent nothing here – wave 4's
 *  endings own that late row, and a fact saying "there is someone" about somebody already gone would
 *  be the one dishonest thing this beat could say.» WHAT MOVED: wave 4's endings own that late row
 *  FROM HERE, because there is nowhere else it could be raised – the ending week is the wrong week
 *  for it and §8 has no way to know a future `knownWeek`. WHAT DID NOT: the dishonest sentence is
 *  still refused. An ended episode does not get «there is someone»; it gets a row and a card that say
 *  there WAS, and that it is over, in the one breath the parent heard both.
 *
 *  ⚠ THE ROW IS `keep: true` – the brief's «a KEPT feed row». `pruneEvents` drops ordinary rows at
 *  sixty weeks and a career reads its own life back seasons later; the week someone appeared in it
 *  is not a line the album may be missing. */
export function deliverKnownPartner(world: WorldState): void {
  // ⭐⭐⭐ v75 T4, RULING B – IT SCANS THE LIST NOW, AND THE TAIL READ IS GONE. This was
  // `knownPartner(world, world.week)`, which goes `activeEpisode()` -> the tail row -> **and only if
  // it is still open** – so from the moment endings are real it returns null for exactly the episodes
  // the told-late scene is about.
  //
  // ⚠⚠ WHY A SCAN AND NOT A TAIL READ WITH A GUARD, kept from the ruling because the next reader will
  // want to «simplify» it back. Today's constants do happen to guarantee the undelivered row is the
  // tail – a new row cannot be appended before the old one is delivered unless `cooldown <= lag − 1`,
  // and the tightest pair is fiery's `12 <= 3`, false with nine weeks to spare (sunny `26 <= 3`,
  // quiet `39 <= 11`, deep `52 <= 11`). But that is an accident of two unrelated constant tables,
  // either of which the планка-3 session or step 6 may move. The scan costs one loop and is this
  // layer's own idiom already: `pendingLifeBeat` takes the FIRST unanswered row for the stated reason
  // that «a queue that answered its newest entry first would lose the oldest».
  //
  // ⚠ THE RECEIPT IS BOTH KINDS HERE, and that is the half a reader could get wrong: a row that has
  // already surfaced as a told-late ending must not surface again, so the dedupe asks «has this
  // episode produced ANY beat», while ruling A's register asks the narrower «was he told there was
  // somebody» (`'met'` alone). Two questions, one helper, two argument lists.
  const due = loveEpisodesOf(world).find(
    (episode) =>
      episode.knownWeek !== null &&
      episode.knownWeek <= world.week &&
      !hasBeatFor(world, episode.id, ['met', 'ended']),
  )
  if (due === undefined) return
  // ⭐⭐⭐ THE SPLIT, AND IT IS THE WHOLE OF RULING B. An OPEN row takes the `'met'` path below, BYTE
  // UNCHANGED – same row, same text, same beat, same dedupe; an ENDED one takes the told-late path,
  // which raises `'ended'` and **no `'met'`, ever**.
  if (due.endedWeek !== null) {
    addEvent(world, {
      week: world.week,
      type: 'life',
      keep: true,
      // ⚠ NO AMOUNT (rule 4), and the read comes off the ENDING's own week – `beatEndsRead`'s twin
      // through the same derivation, so the row and the card the same tick raises cannot disagree.
      text: ENDED_LATE_EVENT[
        drawEndsRead(world.seed, due.endedWeek, temperamentOf(world))
      ],
    })
    // ⚠⚠ AND THE REGISTER IS NOT WRITTEN ONTO THE ROW. `beatEndsRegister` asks the `'met'` receipt
    // and finds none, which is what makes this card the told-late one – now and twenty seasons from
    // now, because no `'met'` row for this episode can ever be appended after this line runs.
    raiseLifeBeat(world, 'ended', due.id)
    return
  }
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and the absence of the field is what
    // keeps `accrueFinance` from ever seeing this row.
    // ⚠ THE EPISODE'S OWN `wants` (v74 T7) – the read, unmarked, in the one row the album keeps.
    text: MET_EVENT[metRegisterOf(bondBandOf(world.bond ?? ECONOMY.bond.start)) === 'dry' ? 'found-out' : 'told'][due.wants],
  })
  // ⚠ THE SAME TICK, AND THE ORDER IS THE READING: the feed row is what HAPPENED and the beat is what
  // the parent is being asked about it, so the news is on the record before the card can be answered.
  // ⚠ THE DETAIL IS THE EPISODE ID – machine-readable, never a rendered sentence (`LifeBeatRecord`),
  // and it is also the receipt the dedupe above reads.
  raiseLifeBeat(world, 'met', due.id)
}

// =================================================================================================
// 7. TIER-1 SMALL TALK – ⚠⚠ THE WEEK SHE COMES WITH SOMETHING SMALL (the private life, wave 3: T8)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T8, constants in `ECONOMY.life` (§4's last row).
// Sections 5 and 6 above are ONE attachment's whole arc; this is the layer's other half – the
// ordinary week in which nothing happened except that she talked to her parent.
//
// ⚠⚠ THE FOURTH AND LAST STREAM OF THE WAVE, and it is the one this file has been reserving:
//
//     seed:life:smalltalk:<week>           does she come with something small, this week
//
// (seed, calendar)-keyed like the other three, so a player cannot manufacture a conversation by
// playing the week differently. `seed:life:ends:*` is WAVE 4's and does not exist on this tree.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2: `seed:life:ends:<week>` now DOES exist, in §8 below, and this
// section still does not derive it – which is the claim the sentence was making and the one the
// count-keys pin in tests/wave3-small-talk.test.ts §B holds `rollSmallTalk` to. ⚠ RE-AIMED AGAIN BY
// T4: `:ends:<week>:react` exists now too (§3e, `drawEndsRead`), and this section still derives
// neither of them – which is, again, the whole of the claim.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural (nothing here
// takes an `Rng`, so the frozen capture 41550 / e6b0c709 cannot see this file). The second is T3's
// load-bearing rule inherited whole: `smallTalkEligible` decides EVERYTHING – the pending queue, the
// season cap and the two bands priced at zero – and `rollSmallTalk` returns on it BEFORE the stream
// is derived. A `strained` or `cold` home takes no draw at all; it never compares one against 0.
//
// ⚠ AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON – the finding T3 recorded and
// this step inherits verbatim. Every key here carries its own week, so a discarded draw shifts no
// other week's value and «two worlds produce identical later verdicts» stays green under the very
// draw-and-discard mutation it would be written to catch. `tests/wave3-small-talk.test.ts` §B counts
// the keys the gate reached, in an array the code under test cannot see, with a positive control.
//
// ⚠ IT RAISES A BEAT AND WRITES NO FEED ROW – not here and not on the answer (see `ANSWER_EVENT`).

/** THE WEEKLY CHANCE, BY BOND BAND (`ECONOMY.life.smallTalkPerWeek`, brief §4's proposal). Takes the
 *  BAND rather than the world – `arrivalHazardFor`'s own doctrine – so a corridor test and the bench
 *  can sweep the table without posing a world per cell. */
export function smallTalkChanceFor(band: BondBand): number {
  return ECONOMY.life.smallTalkPerWeek[band]
}

/** ⭐⭐ HOW MANY SMALL-TALK ROWS THIS SEASON ALREADY HOLDS – **THE LOG IS THE COUNTER**, and there is
 *  no new state anywhere in this step (who-she-is §5b line item 6).
 *
 *  ⚠⚠ TWO FILTERS AND BOTH ARE LOAD-BEARING, which is why this is a function rather than a `length`.
 *  `lifeLog` is the whole life: it also holds `'fork-opinion'` (once a career) and `'met'` (once an
 *  attachment), and it is never pruned. A count that read the log's LENGTH would cap her small talk
 *  on the week she was told there is someone, and a count that forgot the season would cap it for
 *  the rest of her life at four conversations. `seasonIndexOf` is the engine's ONE definition of
 *  «this season» (world/ledger.ts) – the same one the Money screen's window and the season wrap-up
 *  read, so a season can never mean two spans on two surfaces. */
export function smallTalkThisSeason(world: WorldState): number {
  const season = seasonIndexOf(world.week)
  let count = 0
  for (const row of lifeLogOf(world)) {
    if (row.kind === 'small-talk' && seasonIndexOf(row.week) === season) count++
  }
  return count
}

/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s OWN REASON: a reader has to be able to see, in
 *  one place, that the whole of eligibility is decided before any stream exists. Pure, zero draws,
 *  no writes.
 *
 *  1. NOTHING BLOCKING IS ALREADY WAITING (the brief's «fires only when no beat is already pending
 *     that week»). The queue is answered one card at a time and the week is already stopped; adding a
 *     small thing behind the biggest news of her life would make the parent answer them in the wrong
 *     order for the rest of the week. ⚠ v74 T15 – `pendingLifeBeat` reads BLOCKING rows now, so this
 *     clause says exactly what it always meant: she does not come with something small on the week
 *     she has been asked the biggest question of her life.
 *  2. ⭐⭐ v74 T15 – AND NOT WHILE SHE IS STILL WAITING TO BE HEARD ON THE LAST ONE («one at a time»,
 *     who-she-is §5b's amendment). A live unanswered soft row already has a card on the hub; a second
 *     would either queue behind it invisibly or replace it, and replacing it is how «never lost»
 *     stops being true. ⚠ AND IT IS THE **LIVE** ONE AND NOT ANY UNANSWERED ONE: an expired row is
 *     the record of a moment that passed, and a career that fell silent for ever because one
 *     conversation went unanswered in week 9 would be the deferral's own bug wearing a TTL.
 *  3. THE SEASON CAP – four, off the log itself. ⚠ IT COUNTS RAISED ROWS, ANSWERED OR NOT (§5b's
 *     amendment: «the season cap counts raised rows whether answered or not»), which is what
 *     `smallTalkThisSeason` has always done: the row is the counter and the answer is not part of it.
 *  4. THE BAND'S OWN CHANCE IS ABOVE ZERO. ⚠⚠ THIS CLAUSE IS THE SHORT-CIRCUIT AND NOT AN
 *     OPTIMISATION: `strained` and `cold` are priced at 0, and a 0 compared against a DRAWN uniform
 *     would take a draw on a week the design says is silent. `>` and not `>=` for `rollArrival`'s
 *     own reason in reverse – a chance of zero must be impossible rather than merely unlikely.
 *     ⚠ IT IS ALSO WHY THE CARD CANNOT EXIST AT `cold`: nothing raises a row there, so nothing is
 *     ever live there – «the silence is still the line». */
export function smallTalkEligible(world: WorldState): boolean {
  if (pendingLifeBeat(world) !== null) return false
  if (liveSoftBeat(world) !== null) return false
  if (smallTalkThisSeason(world) >= ECONOMY.life.smallTalkCapPerSeason) return false
  return smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start)) > 0
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `'small-talk'` row.
 *
 *  ⭐⭐ IT IS CALLED AGAIN SINCE v74 T15 (11.09.2026), THROUGH THE SOFT PATH. The history is kept
 *  because it is the reason this section is shaped the way it is: T8 shipped the raise through tier
 *  2's HARD pause, §5b prices tier 1 «soft – answerable, never lost», and the owner ruled the raise
 *  off («вариант 3»: raise reverted, engine kept) for exactly as long as it took to specify the
 *  surface. T15 built it – `LIFE_BEAT_BLOCKING` declares the kind non-blocking, `pendingLifeBeat`
 *  narrows to blocking rows, `liveSoftBeat` holds the three-week window and a Home card opens the
 *  same dialog – so `world/phaseHerWeek.ts` calls this again, in the position the deferral's note
 *  reserved for it, and a raised row now stops nothing.
 *  ⚠ AND THE SECOND RULING, HONOURED HERE: NO AGE GATE. She talks at any age – a child bringing a
 *  parent a worry, a joy or a question is natural at any age, and tier 1 is texture rather than part
 *  of the romance layer – so `smallTalkEligible` does NOT inherit `arrivalEligible`'s
 *  sixteenth-birthday gate, and must not acquire one.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. The line order IS the rule;
 *  moving the roll above the gate would break it silently, because every key here carries its own
 *  week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND AND THE SPIRIT IT READS ARE LAST WEEK'S SETTLED VALUES, because it is written to run
 *  before `accrueSpirit` – `rollArrival`'s own argument one section up, and for the same reason:
 *  what she brings to the table is about the week that has just been lived, not about what this same
 *  tick is on its way to doing to her. (T15 restored the call site to exactly that position, which is
 *  the one the deferral's note reserved.)
 *
 *  ⚠ THE SUBJECT IS DERIVED AND NEVER DRAWN (`smallTalkSubjectFor`) – the wave owns four stream keys
 *  and this one answers a single question. */
export function rollSmallTalk(world: WorldState): void {
  if (!smallTalkEligible(world)) return
  const chance = smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start))
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY. `<` and not `<=`, `rollArrival`'s own note: `rngFromSeed`
  // can return exactly 0, and a chance of 0 must be unreachable rather than merely rare. (It cannot
  // reach this line at all today – the gate refuses it – and the comparison agrees with the gate
  // rather than relying on it.)
  if (rngFromSeed(`${world.seed}:life:smalltalk:${world.week}`)() >= chance) return
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  // ⚠ THE DETAIL IS THE SUBJECT – machine-readable, never a rendered sentence (`LifeBeatRecord`), and
  // it is what `lifeBeatSaid` selects her opener with. The heading reads the register one line above
  // it, so the card's frame and her line are about the same small thing BY CONSTRUCTION.
  raiseLifeBeat(world, 'small-talk', smallTalkSubjectFor(register))
}

// =================================================================================================
// 8. THE END – ⚠⚠ THE WEEK IT IS OVER (the private life, wave 4: T2)
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T2, constants in `ECONOMY.life` (who-she-is §4's
// `end` column). §5 above decides whether someone appears; this decides whether they are still there,
// and it is the step that makes the attachment an ARC instead of a state a career enters once.
//
// ⚠ IT IS §8 AND NOT §5b, AND THE POSITION IS A COMPROMISE RATHER THAN A READING. It belongs beside
// the arrival by subject – they are one hazard asked twice – and it is appended at the end because
// renumbering four sections would rewrite every «§6» and «§7» reference in this file and in the six
// test files that quote them, for no gain a reader could feel. The ORDER THAT MATTERS is the call
// site's, and that one is not a matter of taste: see `world/phaseHerWeek.ts`.
//
// ⚠⚠ THE FIFTH STREAM, AND IT IS THE ONE §5 AND §7 HAVE BEEN RESERVING SINCE WAVE 3:
//
//     seed:life:ends:<week>                does it end, this week
//
// (seed, calendar)-keyed like the other four, so a player cannot end a romance by playing the week
// differently – and keyed on the WEEK alone, never on the episode, so the hazard is a property of the
// calendar rather than of the row it happens to be reading. ⚠ RE-AIMED BY T4: this said
// `seed:life:ends:<week>:react` «does not exist on this tree», and it does now – §3e's `drawEndsRead`
// derives it on the ENDING's week, which is what makes the two genuine siblings (wave-4 brief §3,
// ruling G.1: «a pair keyed on two different weeks is two facts sharing a name»). Those two are the
// wave's whole table and no third may be invented. ⚠ THIS FUNCTION DERIVES ONLY THE FIRST OF THEM –
// the read is worded from, never rolled here, and §B's count-keys net says so.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural – nothing here
// takes an `Rng`, so the frozen capture (41550 / e6b0c709) cannot see this file, and T2 could not move
// it if it tried. The second is §5's load-bearing rule inherited whole: `endsEligible` decides
// everything and `rollEnds` returns on it BEFORE the stream is derived. A career with nobody in it
// takes no draw at all; it never compares one against a hazard it was never going to clear.
//
// ⚠ AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON – wave 3's finding, now the
// wave-4 brief's §0.1 LAW for every zero-draw claim. Every key here carries its own week, so a
// discarded draw shifts no other week's value and «two worlds produce identical later verdicts» stays
// green under the very draw-and-discard mutation it would be written to catch.
// `tests/wave4-ends.test.ts` §B counts the keys the gate reached, in an array the code under test
// cannot see, with a positive control.
//
// ⚠⚠ NO FEED LAG FOR AN ENDING, v1 – A DESIGN NOTE AND NOT AN OVERSIGHT (the wave-4 brief says it in
// those words). An arrival is shy and a break-up is loud: the lag exists because a girl decides when
// to mention that somebody exists, and there is no matching decision here – the parent of a girl who
// has just been left finds out because she is in the house. The told-LATE scene the plan wants comes
// from endings that predate `knownWeek` – the romance he was never told about, already over by the
// time he hears of it – and never from lagging the ending itself. Adding a symmetrical
// `endKnownWeek` would produce a fourth date on the row and a scene nobody asked for.
//
// ⚠⚠ IT RAISES NOTHING AND WRITES NO ROW – not a beat, not a feed line, not a spirit point. ⭐ RE-AIMED
// BY T3 (12.09) AND NOT RELAXED: this line ended «not `spiritShock`. T3 is the shock…», and T3 is
// here. The MARK is now written by `rollEnds` – one `{week, kind}` fact on the world – while the
// POINTS it is worth stay `accrueSpirit`'s, four calls later in the same tick, which keeps that
// function the only writer of `world.spirit` in the engine. T4 is still the `'ended'` beat and its
// told-late branch, T5 still the feed row and the `lifeKind` stamp. The commit order IS the design:
// ship each half alone and let the derived readings fall out of it, so that anything which moves in
// the frozen careers moved for exactly one nameable reason.
// ⭐⭐ RE-AIMED AGAIN BY T4 (12.09), AND THE PARAGRAPH ABOVE IS KEPT WHOLE so both re-aims read as one
// history. WHAT MOVED: `rollEnds` now raises the TOLD-NOW `'ended'` card, and only when the `'met'`
// receipt already exists (ruling B's split of responsibility). WHAT DID NOT: `world.spirit`, `events`
// and the `lifeKind` stamp are still not this function's to touch – the POINTS are `accrueSpirit`'s,
// the ending's own kept feed row and the per-kind glyph are T5's, and any of those appearing here is
// still the defect this note exists to make visible. ⚠ AND THE TOLD-LATE HALF IS NOT HERE AND CANNOT
// BE: it fires on a week this function has no way to see (`knownWeek`, which may be seasons off), so
// §6 owns it – see `deliverKnownPartner`.

/** ⭐⭐ THE GATE – ONE CLAUSE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s AND `smallTalkEligible`'s STATED REASON, and the
 *  reason survives the clause count going down to one: a reader has to be able to see, in one place,
 *  that the whole of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  ⚠ THE WHOLE OF IT IS «IS SOMEBODY THERE», and it is `activeEpisode`'s answer rather than a second
 *  spelling of it. Two things follow that are worth naming because both are easy to add by accident:
 *
 *  1. ⚠⚠ IT COUNTS FROM `sinceWeek`, NEVER FROM `knownWeek`. `activeEpisode` reads `endedWeek` and
 *     nothing else, so a romance the parent has not been told about is exactly as endable as one he
 *     has – which is the premise of wave 4's told-late scene and would be destroyed by an innocent
 *     `knownPartner` here. There is no bar above this line and there must never be one.
 *  2. AND THERE IS NO AGE GATE. `arrivalEligible` has one because sixteen is when somebody may first
 *     APPEAR; by the time a row exists she has already passed it, so a second reading of the same
 *     ruling here would be dead code that looked like a rule. */
export function endsEligible(world: WorldState): boolean {
  return activeEpisode(world) !== null
}

/** THE WEEKLY END HAZARD, as one probability (who-she-is §4: base 1.2%/wk times the temperament's
 *  `end` multiplier). Takes the TEMPERAMENT rather than the world – `arrivalHazardFor`'s own
 *  primitives doctrine – so the corridor tests and T7's census can sweep the table directly instead
 *  of posing a world per cell.
 *
 *  ⚠⚠ IT READS `endsMult` AND NOT `temperamentMult`, WHICH IS RULING E AND IS THE ONE LINE IN THIS
 *  SECTION MOST LIKELY TO BE «SIMPLIFIED» BY A LATER READER. They are two columns of one table in the
 *  spec and they are different numbers: arrival is sunny 1.2 · fiery 1.6 · quiet 0.6 · deep 0.5, and
 *  this is sunny 0.6 · fiery 1.5 · quiet 0.35 · deep 0.9. Sharing the record would have shifted every
 *  break-up rate in the game by a factor nobody would have noticed, because both values look right.
 *
 *  ⚠ NO AGE TERM, unlike the arrival's – §4's end column is one rate for the whole life. See the
 *  constant's own note in `economy.ts` for why a second row is not this file's to invent. */
export function endsHazardFor(temperament: Temperament): number {
  return ECONOMY.life.endsPerWeek * ECONOMY.life.endsMult[temperament]
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE caller of `endEpisode`.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. An ineligible week takes ZERO
 *  draws – never draw-and-discard – which is the wave's load-bearing rule, inherited from §5 word for
 *  word. The line order below IS the rule; moving the roll above the gate would break it silently,
 *  because every key here carries its own week and a discarded draw changes no other week's value.
 *  That is why the net for it counts keys instead of comparing worlds (§0.1 of the wave-4 brief).
 *
 *  ⚠⚠ IT RUNS BEFORE `rollArrival` IN THE TICK, AND TWO RULINGS REST ON THAT ORDER (the wave-4
 *  rulings, F and A). The row this week's arrival is about to append DOES NOT EXIST YET when this
 *  line runs, so an attachment can never end in its own arrival week: `endedWeek >= sinceWeek + 1` by
 *  construction and the shortest romance the engine can produce is exactly one week. And because
 *  `endEpisode` writes the date before `arrivalEligible` is next asked, the cooldown refuses
 *  same-tick re-arrival by construction too – the slot is free and the clock is already running, so
 *  nobody arrives on the afternoon of a break-up. Both are pinned in tests/wave4-ends.test.ts §E;
 *  the ORDER itself is pinned in tests/spirit.test.ts.
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0, and a hazard of
 *  0 must be impossible rather than merely unlikely. No row in `endsMult` is zero today – so unlike
 *  §7's gate this comparison is not standing in for a short-circuit – but a temperament priced at
 *  «she never leaves» is the kind of row a later spec adds, and it would have to mean never.
 *
 *  ⚠⚠ IT TAKES NO `Rng`, AND SINCE T3 IT WRITES THE DATE **AND THE MARK** – RE-AIMED, NOT RELAXED.
 *  This note read «writes NOTHING BUT THE DATE. The shock is T3's, the beat is T4's, the feed row is
 *  T5's», and T3 is the step it was written to be re-read on. WHAT MOVED: the `world.spiritShock`
 *  line below. WHAT DID NOT: `world.spirit` itself, `lifeLog` and `events` are still not this
 *  function's to touch – the POINTS are `accrueSpirit`'s (which runs later in the same tick and stays
 *  the one writer of `world.spirit`), the `'ended'` beat is T4's and the feed row is T5's, and any of
 *  those three appearing here is still the defect this note exists to make visible.
 *  ⭐⭐ ...AND T4 IS NOW HERE TOO, SO THE LIST SHORTENS BY ONE AND THE HISTORY IS KEPT. WHAT MOVED: the
 *  `raiseLifeBeat(world, 'ended', …)` on the last line, guarded by the `'met'` receipt (ruling B).
 *  WHAT STILL DID NOT: `world.spirit` and `events`. A feed row or a spirit point appearing in this
 *  function is the defect the note is still watching for; the ending's own kept row is T5's.
 *
 *  ⚠⚠ THE MARK IS SET HERE AND THE ARITHMETIC IS DONE THERE, WHICH IS THE WHOLE SPLIT (ruling C, and
 *  the T3 brief's «who sets it, who applies it»). This function knows the WEEK an attachment ended;
 *  `accrueSpirit` owns the weekly sum and the intensity scale. So the ending stamps a fact –
 *  `{week, kind}` – and the spirit pass four calls later reads that fact, applies −22/−34 on the
 *  week it matches, and clears the stamp again once she is back within `shockClearWithin` of her own
 *  baseline. No second writer of `world.spirit`, and no spirit arithmetic in the private life's
 *  hazards.
 *
 *  ⚠ IT IS SET ON THE SAME LINE-RUN AS THE DATE AND NEVER CONDITIONALLY, so «an attachment ended this
 *  week» and «a shock is live» cannot disagree. `endEpisode` is a no-op when there is nothing to end,
 *  but it cannot be reached in that state from here – the gate above has already found the row. */
export function rollEnds(world: WorldState): void {
  if (!endsEligible(world)) return
  const hazard = endsHazardFor(temperamentOf(world))
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament, so the four girls read
  // the SAME uniform against four different hazards. That is what makes the multiplier a pure scale
  // rather than four unrelated dice, and it is the property the nesting pin holds them to.
  if (rngFromSeed(`${world.seed}:life:ends:${world.week}`)() >= hazard) return
  // ⭐ v75 T4 – THE ROW IS TAKEN **BEFORE** IT IS DATED, because after `endEpisode` runs
  // `activeEpisode` is null by construction and there would be no id left to raise the beat about.
  const over = activeEpisode(world)!
  endEpisode(world, world.week)
  // ⭐⭐⭐ v75 T3 – AND THE MARK IT LEAVES ON HER. A fact, never a number: what it costs is
  // `ECONOMY.spirit.shock.breakup` and `accrueSpirit` is the one place that reads it (see the note
  // above). The kind is the union's only member today; steps 7–8 add the others.
  world.spiritShock = { week: world.week, kind: 'breakup' }
  // ⭐⭐⭐ v75 T4, RULING B – AND THE TOLD-NOW CARD, **ONLY IF HE ALREADY KNEW THERE WAS SOMEBODY**.
  //
  // ⚠⚠ THE RECEIPT IS THE WHOLE CONDITION AND IT IS RULING A's DISCRIMINATOR, NOT `knownWeek`. A
  // `knownWeek <= week` test here would fire on the tick where `endedWeek === knownWeek` – and §6,
  // four calls later in this same tick, would then deliver the SAME episode and raise `'met'`: two
  // contradictory beats about one girl in one week, which the brief forbids in as many words. Asking
  // the receipt instead makes that case fall through to §6, which sees an ended row and raises ONE
  // told-late card. ⚠ IT IS REACHABLE, NOT A CORNER: ruling F gives `endedWeek >= sinceWeek + 1`, so
  // the collision needs only a lag of one or more and the hazard landing on that week.
  //
  // ⚠ AND THE OTHER SIDE OF THE FALL-THROUGH IS THE TOLD-LATE SCENE ITSELF: an episode that ends
  // while the lag is still running raises nothing here, waits out its `knownWeek`, and surfaces as
  // one honest late row. The romance the parent was never told about is not lost – it is deferred to
  // the week he hears of it, which is the whole reason `loveEpisodes` is a list.
  //
  // ⚠ NO FEED ROW ON THIS PATH (T5's, per the commit order) and NO SPIRIT POINT (`accrueSpirit`'s,
  // four calls later). What this line adds is the CARD, and nothing else.
  if (hasBeatFor(world, over.id, ['met'])) raiseLifeBeat(world, 'ended', over.id)
}
