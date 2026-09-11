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
// ⭐ `seasonIndexOf` JOINS `addEvent` HERE IN v74 T8 – the engine's ONE definition of «this season»,
// and the season the tier-1 cap is counted within (`smallTalkThisSeason`, §7). `ledger.ts` is a leaf
// this module already imports at runtime, so no arrow moves and no cycle appears.
import { addEvent, seasonIndexOf } from './ledger'
// ⚠ FROM ./loveEpisodes, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the second one this file
// records, on `guardNotEndedForGood`'s own precedent just below. Both selectors were DECLARED
// here by T1; T4 gave `engine/spirit.ts` a reader for `activeEpisode` (the effective baseline), and
// this module imports `../spirit` at runtime, so leaving them here would have closed a value loop.
// They moved verbatim to the leaf and nothing about either of them changed.
// ⭐ v74 T6 ADDS `knownPartner` TO THE SAME IMPORT – «does he KNOW», the second question that leaf
// asks of the list, and the one the delivery below fires on.
import { activeEpisode, knownPartner, loveEpisodesOf } from './loveEpisodes'
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
 *  four lines, BYTE-IDENTICAL. */
const MET_HER_LINE: Record<Temperament, Record<LoveEpisode['wants'], string>> = {
  sunny: {
    open: 'She brought it up over dinner, before anyone asked. "There is someone. I wanted you to hear it from me first."',
    private: 'She brought it up over dinner, and wished straight away that she had not. "There is someone. Please do not go telling people."',
  },
  fiery: {
    open: 'She was talking before her bag was down. "There is someone. It is good. That is all you are getting."',
    private: 'She was talking before her bag was down. "There is someone. And no, we are not doing questions about it."',
  },
  quiet: {
    open: 'She said it while she put the shopping away, between two other things. "There is someone I see now."',
    private: 'She said it while she put the shopping away, and did not look up. "There is someone. I would rather that stayed in this room."',
  },
  deep: {
    open: 'She waited until the house was quiet, then said it once. "There is someone. That is all."',
    private: 'She waited until the house was quiet, and asked first that it go no further. "There is someone. Now please let it be."',
  },
}

/** ⭐ `steady` – A MENTION, AND NOT ONE WORD OF HERS IN IT. She said it somewhere in the week and the
 *  parent caught it; there is no scene, because a scene is what `close` has and this home does not.
 *
 *  ⚠ ONE LINE PER READING, NOT FOUR. It is the PARENT'S narration and the fence keeps temperament out
 *  of that – `HER_LINE` and `MET_HER_LINE` are the only pools in this file a girl's voice indexes.
 *  The `wants` axis is not the fence: it is not who she is, it is what she asked for. */
const MET_MENTION: Record<LoveEpisode['wants'], string> = {
  open: 'She mentioned someone this week, in passing, and did not stop to say who.',
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
 *  is the same fact arriving as an inference instead of as a request. */
const MET_DRY: Record<LoveEpisode['wants'], string> = {
  open: 'There is someone in her life. She did not say so, and the house found out anyway.',
  private: 'There is someone in her life. She had been keeping it to herself, and the house found out anyway.',
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
 *  line asserts is her own verdict on her own week, which is the one thing she is the source of. */
const SMALL_TALK_LINE: Record<Temperament, Record<SmallTalkSubject, string>> = {
  sunny: {
    worry: 'She came and sat down without being asked to. "I have been worrying at something all week. I would rather say it than carry it."',
    joy: 'She said it before anyone had asked how the week went. "Something went well. I am pleased about it."',
    question: 'She asked it over dinner, with the context first. "Can I ask you something? It is not urgent, I just want to know."',
  },
  fiery: {
    worry: 'She was through the door and straight into it. "Something is bothering me. It has been bothering me for days."',
    joy: 'She was talking before she had put anything down. "Today was a good one. A really good one."',
    question: 'She asked it the second she sat down. "I want to ask you something. And I want a straight answer."',
  },
  quiet: {
    worry: 'She stayed in the kitchen after the plates were done. "There is something I keep going back over."',
    joy: 'She put the kettle on and mentioned it while it filled. "The morning went the way I wanted it to."',
    question: 'She asked it while she was stacking the shelf, without looking round. "Can I ask you about something?"',
  },
  deep: {
    worry: 'She waited until the room was quiet. "Something is sitting wrong. That is all I have."',
    joy: 'She said it on her way past, and did not stop. "Good week. I will take it."',
    question: 'She waited for the room to empty first. "I want to ask you something."',
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
 *  build, one step removed. */
export function lifeBeatOptionsFor(kind: LifeBeatKind, wants: LoveEpisode['wants']): readonly LifeBeatAnswer[] {
  const base = LIFE_BEAT_OPTIONS[kind]
  if (kind !== 'met' || wants !== 'private') return base
  return base.map((option) => {
    const flipped = MET_BOND_PRIVATE[option.id]
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
    listen: 'She said what she wants after school. We listened, and left it there.',
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
 *  only at strained/cold.)»
 *
 *  ⭐ v74 T7 – `wants` IS THE LAST PARAMETER AND IT DEFAULTS TO `'open'`, which is a statement about
 *  the two kinds and not a convenience. `'fork-opinion'` has no `wants` at all – her college answer
 *  is not an attachment – so a default lets wave 2's whole pin sweep keep calling this with five
 *  arguments and keep asserting, byte for byte, the lines it was written against. `'met'` is always
 *  called with the episode's own reading (`buildLifeBeatPrompt` -> `beatWants`), and the default
 *  `'open'` is T6's shipped reading rather than a neutral stand-in. */
export function lifeBeatSaid(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  register: MoodRegister,
  bond: BondBand,
  wants: LoveEpisode['wants'] = 'open',
): string {
  // ⭐ v74 – THE SECOND KIND, AND THE `switch` IS THE UNION'S WHOLE POINT: a third cannot be added
  // without this function refusing to compile against it. ⚠ `'met'` READS NO `detail` AND NO
  // `register`: its detail is an episode id (a machine value, never a rendered word) and its three
  // registers are the BOND ladder, not the Mood one – see the §3b banner.
  switch (kind) {
    case 'met': {
      // ⭐⭐ v74 T7 – THE READ IS IN THE WORDING AND IN NOTHING ELSE. All three rungs of the ladder
      // carry it, because the flip prices a cold home's answers exactly as it prices a close one's
      // and a rule only half the ladder can read is a hidden number.
      const met = metRegisterOf(bond)
      return met === 'her' ? MET_HER_LINE[voice][wants] : met === 'mention' ? MET_MENTION[wants] : MET_DRY[wants]
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
      return SMALL_TALK_LINE[voice][subject]
    }
    case 'fork-opinion': {
      const want = FORK_WANTS.find((w) => w === detail)
      if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
      if (!speaksInHerOwnVoice(bond)) return FLAT_LINE[want]
      return HER_LINE[voice][want][register === 'low' ? 'low' : 'up']
    }
  }
}

/** The parent's frame over the card, per kind. ⚠ THE TWO KINDS KEY ON DIFFERENT FACTS and that is
 *  the reading rather than an inconsistency: the fork's heading says what the WEEK around the
 *  conversation was like (the Mood register), and this beat's says how far apart the two of them are
 *  when the news lands (the bond band). See `MET_HEADING`. */
export function lifeBeatHeading(kind: LifeBeatKind, register: MoodRegister, bond: BondBand): string {
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
  if (kind === 'met' || kind === 'small-talk') return null
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
  return pending === null ? null : lifeBeatOptionsFor(pending.kind, beatWants(world, pending))
}

/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is handed
 *  and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ NULL WHILE NOTHING IS PENDING, which is every week of nearly every career: this is called on
 *  every `toSnapshot`, so it is a `find` over a handful of rows and no more.
 *
 *  ⚠ ZERO DRAWS. Every word of it is selected by (want, voice, register, bond band, wants) – five
 *  facts the world already holds – so the prompt is a pure function of the world and re-assembling
 *  it costs nothing on any stream. That is also what lets `answerLifeBeat` re-derive it to
 *  re-validate the option id (rule 3) without the two readings ever being able to disagree.
 *
 *  ⚠⚠ AND THE FLIP REACHES THE SCREEN THROUGH `said` ALONE (v74 T7). `options` carries ids and
 *  LABELS and has never carried a `bond`, so the re-priced number cannot leak onto a button even by
 *  accident – the type is the fence. What the player has to go on is her line, which is the whole
 *  design: never marked, never labelled, no meter. */
export function buildLifeBeatPrompt(world: WorldState): LifeBeatPrompt | null {
  const pending = pendingLifeBeat(world)
  if (pending === null) return null
  const register = moodRegisterOf(spiritBandOf(world.spirit ?? ECONOMY.spirit.baseline))
  const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
  const voice = voiceOf(world)
  const wants = beatWants(world, pending)
  const followUp = lifeBeatListenFollowUp(pending.kind, pending.detail, voice, band)
  return {
    week: pending.week,
    kind: pending.kind,
    heading: lifeBeatHeading(pending.kind, register, band),
    said: lifeBeatSaid(pending.kind, pending.detail, voice, register, band, wants),
    // ⚠ THE PENDING ROW'S OWN KIND PICKS THE ANSWER SET (v74). A flat list here would have offered a
    // girl's «there is someone» the fork's three buttons, which is the defect the per-kind record
    // exists to make impossible – and `answerLifeBeat` re-validates against THIS same reading.
    options: lifeBeatOptionsFor(pending.kind, wants).map((o) => ({ id: o.id, label: o.label })),
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
  // ⚠ THE ROW'S OWN KIND, AND NOT A FLAT SEARCH OVER EVERY KIND'S OPTIONS (v74). Reading the whole
  // table here would let a `'met'` row be answered with the fork's `back` – the prompt would refuse
  // it, but the refusal would then be the ONLY thing standing between two beats' answer sets, and
  // rule 3 exists precisely so that two readings of the same fact cannot disagree.
  // ⚠⚠ AND THE ROW'S OWN `wants` PICKS THE PRICE (v74 T7), through the SAME function the prompt one
  // line up was built from. What she asked for is a fact on the episode, so the charge is re-derived
  // here from the world and never carried in from the screen – a dialog cannot choose its own price
  // any more than it can choose its own option set.
  const chosen = lifeBeatOptionsFor(rows[at].kind, beatWants(world, rows[at])).find(
    (o) => o.id === optionId && prompt?.options.some((p) => p.id === o.id),
  )
  if (!chosen) throw new Error('That is not one of the answers this beat offered')
  rows[at] = { ...rows[at], answer: chosen.id }
  // ⚠ HIS WORDS MOVE `bond` AND NOTHING ELSE (§4a.2's law, and this wave's fence): no spirit delta
  // from any of this, no skill, no condition, no money.
  applyBondDelta(world, chosen.bond)
  // ⭐⭐ v74 T8 – AND A KIND MAY WRITE NO ROW AT ALL. `'small-talk'`'s entry in `ANSWER_EVENT` is
  // `null`, deliberately and by the record's own totality: tier 1 leaves its trace in `lifeLog` and
  // nowhere else, because four «we asked her to say more» rows a season would bury the private-life
  // thread in the parent's own replies to it. ⚠ THE TWO SHIPPED KINDS ARE UNTOUCHED by this branch –
  // their lines are exactly the lines they were, in exactly the feed they were in.
  const answerLine = ANSWER_EVENT[rows[at].kind]
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

/** ⭐⭐⭐ THE DELIVERY, AND THE ONE WRITER OF A `'met'` ROW.
 *
 *  ⚠⚠ EXACTLY ONCE PER EPISODE, AND THE RECEIPT IS THE `lifeLog` ITSELF – a `'met'` row whose
 *  `detail` is this episode's id. That is `pendingLifeBeat`'s own doctrine read the other way round
 *  («the record IS the queue», rule 2): there is no `told: true` flag on the episode, because a
 *  second boolean beside a record that already answers the question is one fact with two sources of
 *  truth, and they desync.
 *
 *  ⚠ `<=` AND NOT `===`, DELIBERATELY. The beat is owed on `knownWeek`; the comparison being an
 *  inequality means a week that somehow passed without this running still delivers on the next tick
 *  instead of losing the news for good. The dedupe above is what makes that safe, and the two
 *  together are the property the pin asserts: it fires on `knownWeek`, and it fires once.
 *
 *  ⚠ IT ASKS `activeEpisode` THROUGH `knownPartner`, so «not ended» has ONE spelling in this layer.
 *  An attachment that ended before its `knownWeek` arrived tells the parent nothing here – wave 4's
 *  endings own that late row, and a fact saying «there is someone» about somebody already gone would
 *  be the one dishonest thing this beat could say.
 *
 *  ⚠ THE ROW IS `keep: true` – the brief's «a KEPT feed row». `pruneEvents` drops ordinary rows at
 *  sixty weeks and a career reads its own life back seasons later; the week someone appeared in it
 *  is not a line the album may be missing. */
export function deliverKnownPartner(world: WorldState): void {
  const known = knownPartner(world, world.week)
  if (known === null) return
  if (lifeLogOf(world).some((row) => row.kind === 'met' && row.detail === known.id)) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and the absence of the field is what
    // keeps `accrueFinance` from ever seeing this row.
    // ⚠ THE EPISODE'S OWN `wants` (v74 T7) – the read, unmarked, in the one row the album keeps.
    text: MET_EVENT[metRegisterOf(bondBandOf(world.bond ?? ECONOMY.bond.start)) === 'dry' ? 'found-out' : 'told'][known.wants],
  })
  // ⚠ THE SAME TICK, AND THE ORDER IS THE READING: the feed row is what HAPPENED and the beat is what
  // the parent is being asked about it, so the news is on the record before the card can be answered.
  // ⚠ THE DETAIL IS THE EPISODE ID – machine-readable, never a rendered sentence (`LifeBeatRecord`),
  // and it is also the receipt the dedupe above reads.
  raiseLifeBeat(world, 'met', known.id)
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
 *  1. NOTHING IS ALREADY WAITING (the brief's «fires only when no beat is already pending that
 *     week»). The queue is answered one card at a time and the week is already stopped; adding a
 *     small thing behind the biggest news of her life would make the parent answer them in the wrong
 *     order for the rest of the week.
 *  2. THE SEASON CAP – four, off the log itself.
 *  3. THE BAND'S OWN CHANCE IS ABOVE ZERO. ⚠⚠ THIS CLAUSE IS THE SHORT-CIRCUIT AND NOT AN
 *     OPTIMISATION: `strained` and `cold` are priced at 0, and a 0 compared against a DRAWN uniform
 *     would take a draw on a week the design says is silent. `>` and not `>=` for `rollArrival`'s
 *     own reason in reverse – a chance of zero must be impossible rather than merely unlikely. */
export function smallTalkEligible(world: WorldState): boolean {
  if (pendingLifeBeat(world) !== null) return false
  if (smallTalkThisSeason(world) >= ECONOMY.life.smallTalkCapPerSeason) return false
  return smallTalkChanceFor(bondBandOf(world.bond ?? ECONOMY.bond.start)) > 0
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `'small-talk'` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. The line order IS the rule;
 *  moving the roll above the gate would break it silently, because every key here carries its own
 *  week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND AND THE SPIRIT IT READS ARE LAST WEEK'S SETTLED VALUES, because this runs before
 *  `accrueSpirit` (see the call site in `world/phaseHerWeek.ts`) – `rollArrival`'s own argument one
 *  section up, and for the same reason: what she brings to the table is about the week that has just
 *  been lived, not about what this same tick is on its way to doing to her.
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
