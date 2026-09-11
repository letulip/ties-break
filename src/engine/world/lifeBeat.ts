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
// ⚠ AND SPIRIT IS READ, NEVER WRITTEN. Nothing in this file touches `world.spirit`: the want-draw
// reads it, the parent's answer moves `bond` alone (§4a.2's law – life moves spirit, his words move
// the standing). `applyBondDelta` is the only writer this file calls.
import { pickInt, rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
import { applyBondDelta, bondBandOf, moodRegisterOf, spiritBandOf, temperamentFor, temperamentOpenness, type Temperament } from '../spirit'
import { kidAgeExact } from './age'
import { addEvent } from './ledger'
// ⚠ FROM ./constants, NOT ./endings, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the same swap
// `world/entries.ts` records at its own import. `endings.ts` imports THIS module (it raises the
// fork-opinion row and asks `pendingLifeBeat` before it will answer the fork), so an import back
// into `endings.ts` would close a runtime loop. `constants.ts` is the bottom of the package's graph
// and `endings.ts` re-exports the guard from there anyway, so nothing about the semantics moves.
import { guardNotEndedForGood } from './constants'
import type { BondBand, LifeBeatKind, LifeBeatPrompt, LifeBeatRecord, LoveEpisode, MoodRegister } from '../../shared/protocol/narrative'
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

/** The beat waiting to be answered, or null. The FIRST unanswered row in `lifeLog` order – so a week
 *  that raised two of them asks about them one at a time and never loses the second. */
export function pendingLifeBeat(world: WorldState): LifeBeatRecord | null {
  return lifeLogOf(world).find((row) => row.answer === null) ?? null
}

/** ⭐⭐ v74 (the private life, wave 3) – EVERY ATTACHMENT THIS CAREER HAS LIVED, in the order it
 *  lived them. Append-only and never pruned: the census and the album both read the whole life
 *  later, and a row dropped for tidiness is a biography with a hole in it – `lifeLogOf`'s own rule.
 *
 *  ⚠ THE `?? []` IS THE SAME COURTESY `lifeLogOf` EXTENDS and for the same reason: v74 makes the
 *  field required and back-fills `[]`, so no SAVE reaching this line can be missing it, but probe
 *  worlds hand-built in tests are not saves and predate every field they do not set. */
export function loveEpisodesOf(world: WorldState): readonly LoveEpisode[] {
  return world.loveEpisodes ?? []
}

/** ⭐⭐⭐ THE ACTIVE ATTACHMENT, DERIVED AND NEVER STORED – the LAST row, and only if it is still
 *  open; null when nobody is there. This function is the whole of «is someone in her life right now»:
 *  there is no `world.partner` slot and there must never be one.
 *
 *  ⚠⚠ EPISODES RATHER THAN A SLOT IS THE 09.09 RE-CUT (review find #5), and this signature is where
 *  it is paid for. A romance that begins AND ENDS before the parent ever knew must survive save and
 *  reload intact and surface later as one honest late row; a stored «current partner» would have
 *  been overwritten out of existence the next time someone appeared. So the list keeps everything
 *  and the CURRENT one is a question asked of it, which cannot desync from the rows it reads.
 *
 *  ⚠⚠ THE TAIL DECIDES, AND IT IS A RULING (architect, 11.09) rather than a reading. The brief's
 *  prose said «the LAST row with `endedWeek === null`» while the brief's own enumerated test list
 *  said «open row then ended row -> null», and on the shape `[open, ended]` those two disagree. The
 *  builder implemented the prose; this is the reversal, on three grounds.
 *
 *  1. The divergence is UNREACHABLE. Rows are appended in calendar order and the arrival hazard
 *     refuses to draw while this is non-null (T3's eligibility), so only the TAIL can ever be open.
 *     On every state the sim can actually produce, the two readings return the same row.
 *  2. On unreachable data the tail reading FAILS SAFE and the scan fails STUCK. A row mis-ended by
 *     some future bug leaves the scan pinned non-null for the rest of the career – no arrival ever
 *     again, a permanent +5 baseline lift, and no error anywhere to say so. The tail reading lets
 *     the cooldown run and the career recover.
 *  3. Where prose and an enumerated list disagree, the list is the more specific statement.
 *
 *  ⚠ NOTHING IS LOST FROM THE RECORD EITHER WAY, which is what makes this cheap: the archive is
 *  `loveEpisodes` itself and every row stays in it. This function answers only «is someone there
 *  NOW». `pendingLifeBeat` above takes the FIRST unanswered row for the opposite and equally
 *  deliberate reason – a queue that answered its newest entry first would lose the oldest.
 *
 *  ⚠ IT READS `endedWeek` AND NEVER `knownWeek`. Whether the parent has been TOLD is a different
 *  question from whether someone is there, and conflating them would make a private girl single. */
export function activeEpisode(world: WorldState): LoveEpisode | null {
  const last = loveEpisodesOf(world).at(-1) ?? null
  return last !== null && last.endedWeek === null ? last : null
}

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
 *
 *  ⚠ EVERY WEIGHT IS >= 1, so no reading can ever drive a want to zero – she can want any of the
 *  three at any standing, in any mood, in any home. */
export function forkWantWeights(standing: number, spirit: number, bond: number): Record<ForkWant, number> {
  const s = ECONOMY.spirit
  const b = ECONOMY.bond
  const worn = (s.baseline - spirit) / (s.baseline - s.min)
  const close = (bond - b.start) / (b.max - b.start)
  return {
    college: lean(1 - standing),
    tour: lean(standing) * lean(close),
    stop: lean(worn),
  }
}

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

/** ⭐⭐ WHAT THE PARENT MAY SAY BACK – three responses, and NOT ONE OF THEM IS HER CHOICE. The
 *  decision at the fork stays his to make and hers to have an opinion about; these are what he says
 *  now that she has said hers.
 *
 *  ⚠ THE LABELS NAME NO WANT, deliberately. One wording per option, whatever she asked for, so the
 *  buttons cannot become a second way of reading the answer off the screen – and so "press the other
 *  way" stays honest when there are two other ways.
 *
 *  ⚠ NO NUMBER, NO PRICE, NO METER – the dialog never exposes one (the fence). */
export const LIFE_BEAT_OPTIONS: readonly { id: string; label: string; bond: number }[] = [
  { id: 'back', label: 'Tell her we are behind her', bond: ECONOMY.bond.delta.beatBacked },
  { id: 'press', label: 'Tell her we see it differently', bond: ECONOMY.bond.delta.beatPressed },
  { id: 'listen', label: 'Say nothing, and let her talk', bond: ECONOMY.bond.delta.beatListened },
]

/** The feed line each answer writes. ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4). */
const ANSWER_EVENT: Record<string, string> = {
  back: 'She said what she wants after school. We told her we are behind her.',
  press: 'She said what she wants after school. We told her we see it differently.',
  listen: 'She said what she wants after school. We listened, and left it there.',
}

/** Who she is, for the WORDING alone. Defensive `?? temperamentFor(seed)` on the v72 field for the
 *  probe worlds that predate it – the same shape `accrueSpirit` uses. */
function voiceOf(world: WorldState): Temperament {
  return world.temperament ?? temperamentFor(world.seed)
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
 *  only at strained/cold.)» */
export function lifeBeatSaid(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  register: MoodRegister,
  bond: BondBand,
): string {
  // One kind today, and the switch is the union's whole point: a second kind cannot be added without
  // this function refusing to compile against it.
  if (kind !== 'fork-opinion') throw new Error(`No copy for life beat kind ${kind}`)
  const want = FORK_WANTS.find((w) => w === detail)
  if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
  if (!speaksInHerOwnVoice(bond)) return FLAT_LINE[want]
  return HER_LINE[voice][want][register === 'low' ? 'low' : 'up']
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
  if (kind !== 'fork-opinion') throw new Error(`No copy for life beat kind ${kind}`)
  const want = FORK_WANTS.find((w) => w === detail)
  if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
  if (!speaksInHerOwnVoice(bond)) return null
  return HER_CONTINUATION[voice][want]
}

/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is handed
 *  and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ NULL WHILE NOTHING IS PENDING, which is every week of nearly every career: this is called on
 *  every `toSnapshot`, so it is a `find` over a handful of rows and no more.
 *
 *  ⚠ ZERO DRAWS. Every word of it is selected by (want, voice, register, bond band) – four facts the
 *  world already holds – so the prompt is a pure function of the world and re-assembling it costs
 *  nothing on any stream. That is also what lets `answerLifeBeat` re-derive it to re-validate the
 *  option id (rule 3) without the two readings ever being able to disagree. */
export function buildLifeBeatPrompt(world: WorldState): LifeBeatPrompt | null {
  const pending = pendingLifeBeat(world)
  if (pending === null) return null
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
  const voice = voiceOf(world)
  const followUp = lifeBeatListenFollowUp(pending.kind, pending.detail, voice, band)
  return {
    week: pending.week,
    kind: pending.kind,
    heading: HEADING[register],
    said: lifeBeatSaid(pending.kind, pending.detail, voice, register, band),
    options: LIFE_BEAT_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
    listenFollowUp: followUp === null ? null : { optionId: 'listen', said: followUp, done: LISTEN_DONE_LABEL },
  }
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
  // ⚠ THE INDEX AND NOT THE ROW `pendingLifeBeat` HANDS BACK: `lifeLogOf` returns a readonly view on
  // purpose, and the queue's order is what decides WHICH row this answers – the first unanswered
  // one, exactly as the prompt was built from.
  const at = rows.findIndex((row) => row.answer === null)
  if (at < 0) throw new Error('No life beat is waiting to be answered')
  const prompt = buildLifeBeatPrompt(world)
  const chosen = LIFE_BEAT_OPTIONS.find((o) => o.id === optionId && prompt?.options.some((p) => p.id === o.id))
  if (!chosen) throw new Error('That is not one of the answers this beat offered')
  rows[at] = { ...rows[at], answer: chosen.id }
  // ⚠ HIS WORDS MOVE `bond` AND NOTHING ELSE (§4a.2's law, and this wave's fence): no spirit delta
  // from any of this, no skill, no condition, no money.
  applyBondDelta(world, chosen.bond)
  addEvent(world, {
    week: world.week,
    type: 'info',
    // ⚠ NO AMOUNT AND NO PRICE IN THE WORDS – rule 4 at the top of this file. An `amountCents` here
    // would put a conversation in the Money breakdown.
    text: ANSWER_EVENT[chosen.id],
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
 *  who-she-is §4's «Feed lag» table, verbatim: open – 0 with p 0.45, else uniform 1..5; private –
 *  0 with p 0.10, else uniform 2..12.
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
