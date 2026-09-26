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
// ⚠⚠ `expressedTemperamentOf` JOINS THE LINE IN v76's T7, AND IT DOES NOT REPLACE `temperamentFor`
// OR THE PRIVATE `temperamentOf` BELOW – the architect's RULING A. Three of this file's five
// temperament reads are MECHANICS and move to expression; two are RE-DERIVATIONS of a persisted
// price and must stay on BIRTH. Each of the five carries its own ⚠ comment naming the ruling, and
// `temperamentOf`'s own body is untouched precisely so the split is visible per CALL SITE.
// ⭐ v83 T5 – `seasonWrapsWithNoVacation` JOINS A LINE THAT ALREADY EXISTS AT RUNTIME, so no arrow
// moves: it is the season-boundary zero-vacations predicate ITSELF (the −3/−3 block's one spelling),
// read by the `'no-vacation'` occasion rather than re-derived – the brief's own instruction («the
// same fact spirit.ts's season-boundary block reads»).
import { applyBondDelta, bondBandOf, expressedTemperamentOf, moodRegisterOf, seasonWrapsWithNoVacation, spiritBandOf, temperamentFor, temperamentOpenness, type Temperament } from '../spirit'
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
// ⚠ `knockRunning` IS TAKEN FROM THE LEAF AND NOT FROM `world/knock.ts`, WHICH IS WHERE IT READS AS
// LIVING (that file re-exports it beside `pendingKnock`). A value import of `./knock` from here would
// close a three-module loop – `world/knock.ts -> world/endings.ts -> world/lifeBeat.ts` is live on
// the value-import graph today, measured rather than assumed – and `guardNotEndedForGood` on this
// same line is in the leaf for exactly that reason, with the whole argument at its definition.
import { guardNotEnded, guardNotEndedForGood, knockRunning, KID_ID } from './constants'
// ⭐⭐⭐ ROUND 42 #15/#24 – THE THREE READS THE FACTUAL BOUNDARY NEEDS (§8d.5), and all three are
// leaves or near-leaves that do not import back here (checked module by module before they were
// added). `weekMonth` is `shared/dates.ts`' week → real-month mapping and that file imports NOTHING
// at all; `entryStatus` is `world/medical.ts`' own «pure state, ZERO RNG draws» verdict, and it is
// the ONE spelling of «could she still enter this» – a second reading of that rule here would be the
// tierState defect this repo has already paid for four times. `KID_ID` above is what tells her
// matches from the field's in the event feed.
// ⚠ NOT `multiWeek.ts`' `eventIsHers`, NOT `knock.ts`' `ordinaryTrainingWeek`, NOT `coachMarket.ts`:
// every one of those imports this file back, directly or through `endings.ts`. The clauses they
// would have supplied are field reads (`world.entries.includes`, `world.coachId !== null`) and are
// spelled inline for that reason and no other.
import { entryStatus } from './medical'
// ⭐ C-07 (the owner's ruling 3(a), 26.09) – THE FOURTH READ §8d.5's FACTUAL BOUNDARY NEEDS, and it
// passes the same test the three above did before it was added. `world/college.ts` imports assets,
// rng, coach, development, ending, calendar, economy, nationalTeam, collegeLeague, match/engine,
// tournament, player, constants, format, collegeOffer, offers, ledger, age and ladder – a 51-module
// value closure that does not contain this file – so the edge lifeBeat -> college is one-way. It is
// also the edge nine other `world/*` modules already take for THIS predicate, counted rather than
// quoted (`birthday.ts`, `endings.ts`, `masseur.ts`, `phaseFinance.ts`, `phaseGrowth.ts`,
// `phaseHerWeek.ts`, `phaseObligations.ts`, `psychologist.ts`, `sparring.ts`), so this is the house
// spelling and not a new one.
import { inCollege } from './college'
// ⭐ v83 (the wedding, wave 7 – T3) – THE MILESTONE CHANNEL, `markSchoolEnd`'s own two surfaces:
// the kept feed line and the scroll's row, both idempotent by key. ⚠ ONE-WAY ARROW, MEASURED THE
// HOUSE WAY before it was believed: `world/milestones.ts` imports the calendar, dates, money, the
// diary barrel, kidLife, ledger, constants, labels, ladder and a TYPE-ONLY `WorldState` – and this
// module is imported only by world.ts, endings.ts, multiWeek.ts, phaseHerWeek.ts, snapshot.ts and
// the corpus's type-only edge, none of which sits in that closure. No runtime loop.
import { captureMilestone, fireMilestone } from './milestones'
import { weekMonth } from '../../shared/dates'
// ⭐⭐⭐ v76 T6 – THE SEAT, ASKED DIRECTLY, WHICH IS THE MASSEUR'S OWN WAY (`world/medical.ts:62`
// spends `masseurWorksThisWeek` inside `accrueCondition` exactly like this). `psychologistWorkingRung`
// answers three questions in one – not hired · hired for a different year · stood down by a college
// freeze or a booked family week – and the working week IS the billing week (ruling J).
// ⚠ NO PARAMETER AND NO INVERSION, AND IT IS MEASURED RATHER THAN ASSUMED. `accrueSpirit` has to be
// HANDED the fact because `spirit.ts` sits under `world/college.ts` in the value-import graph and the
// import would close a live cycle; this module does not. Walked over the tree's own value imports
// (`import type` and all-`type` named clauses excluded), `world/psychologist.ts` reaches THIS file by
// **ZERO** paths – the same walk that returns seven to `engine/development.ts`, which is why T5's
// site could not ask either. The rule is the college arrow, not «`spirit.ts` is special».
// ⭐⭐⭐ v76 T8 ADDS `psychologistWorksThisWeek` TO THE SAME LINE, AND IT IS A NAME ON AN ARROW THAT
// ALREADY EXISTS rather than a new edge – T6 opened this import one task ago and the walk above is
// the measurement for both. RE-RUN AT T8 rather than inherited (the brief's own ⚠), on the tree's own
// value imports with `import type` and all-`type` named clauses excluded and `export … from` counted:
// `world/psychologist.ts` reaches THIS file by **ZERO** paths, `engine/development.ts` by SEVEN and
// `engine/spirit.ts` by TWO – the same three numbers T4b and T6 measured, so nothing about the graph
// has moved under them. ⚠ THE TWO PREDICATES ANSWER DIFFERENT QUESTIONS and both are wanted here:
// `psychologistWorkingRung(world, 'listen')` is «is he working THIS focus, and at what rung», which is
// a focus pass's question; `psychologistWorksThisWeek` is «is anybody being paid to be there at all»,
// which is the SEAT's, and the counsel fork is the seat's rather than any focus's.
import { psychologistWorkingRung, psychologistWorksThisWeek } from './psychologist'
// ⭐⭐⭐ v77 T6 – THE SPOTLIGHT'S ONE GATE AND THE STOCK BEHIND IT, both READ and neither written
// (the wave's §8: this wave only reads `fameAt`, and `ECONOMY.fame` is fame-presence's ground).
// §9 below is the whole of what uses them: `newsStandingOf` (D1, 14.09) decides whether the world is looking at all
// and `fameAt` is ruling I's third factor in the hazard's product.
// ⚠ NO CYCLE, AND IT IS MEASURED RATHER THAN ASSUMED – the walk `psychologistWorkingRung`'s own note
// above describes, re-run at T6 over the tree's value imports with `import type` and all-`type` named
// clauses excluded: `world/spotlight.ts` reaches THIS file by **ZERO** paths (11 modules walked) and
// `world/fame.ts` by **ZERO** (9 walked). Both are leaves of the same kind `world/loveEpisodes.ts`
// is – they read the world and write nothing – which is what makes the arrow one-directional by
// construction rather than by luck.
import { fameAt } from './fame'
// ⭐⭐⭐ v77 T7 TAKES A SECOND NAME OFF THE SAME LEAF, AND FOR THE «ASK THE ONE COPY» REASON: the
// booth's licence has to know what a BIG STAGE is, and `atOrAboveStageBar` is already the answer
// `'stage'` and `'publicLoss'` are built on. A second spelling here would drift from
// `ECONOMY.spotlight.stageTierMin` the first time the bar moved – see that function's own note. The
// walk above is unchanged by it: still zero paths back from `world/spotlight.ts` to this file.
import { atOrAboveStageBar, boothPrivateLifeAt, newsStandingOf } from './spotlight'
// ⭐⭐ THE PRESENCE AXIS' TWO IMPORTS (11.09, the вычитка fold) – and both of them are «ask the one
// copy» rather than «re-type the rule». `awayVoice` is R2-18 / ARCH-07's single spelling of «she
// lives elsewhere and the parent HEARS about the week»; `diaryLifeStageFor` is the single spelling
// of which stage a girl of this age on this week is in. Both leaves are type-and-calendar only (no
// world state, no RNG, no import back into `world/`), so neither closes a cycle.
import { awayVoice } from '../diary/words'
import { diaryLifeStageFor } from '../diary/facts'
// ⭐ v83 T5 – THE TWO TRAVEL BANDS JOIN `schoolIsOver` ON AN ARROW THAT ALREADY EXISTS. They are the
// friends tile's own thresholds («a season lived out of a suitcase»: `weeksAway >= AWAY_OFTEN` of
// the trailing `FRIENDS_WINDOW`), and the `'road-stretch'` occasion reads the SAME fact the tile
// reads – a week the family paid to travel, off `financeWeeks` (snapshot.ts's own sentence: «a week
// in which a travel bill was actually paid is a week the family was somewhere else»). Reusing the
// constants is what keeps «the family has been on the road» ONE claim on two surfaces.
import { AWAY_OFTEN, FRIENDS_WINDOW, schoolIsOver } from '../kidLife'
// ⭐ v83 T5 – THE TIER TABLE, for ONE field of it: the tier's `track` is the engine's single
// spelling of «the trip crosses a border» (`diary/travelHome.ts:521` reads `abroad` off exactly
// this field), and the `'distant-swing'` occasion asks it of the next ENTERED event – see the gate
// for why the reading is `!== 'domestic'` where that file's is `=== 'itf'`. ⚠ NO CYCLE, measured
// the house way: `season/calendar.ts` imports rng, match/types, shared/protocol, shared/dates,
// economy and `season/types` – nothing under `world/`, so the arrow runs one way. This file already
// held the type-only `../season/types` edge; this is its value sibling on the same package.
import { TIERS } from '../season/calendar'
// ⚠⚠ GENERATED DATA, AND THE IMPORT RUNS ONE WAY ONLY. `smallTalkCorpus.ts` is 43 situations emitted
// from `docs/specs/small-talk-corpus-2026-09.md` by `tools/small-talk-corpus-emit.ts`; it imports
// `SmallTalkSituation` back from here as a TYPE, which is erased at compile time, so there is no
// runtime cycle – the `import type { WorldState }` idiom the decomposition already runs on.
import { SMALL_TALK_CORPUS } from './smallTalkCorpus'
// ⭐ v85 T6 – THE LADDER, FOR TWO PURE READS AND NO WRITES: §14's pause week captures «her rank at
// `pausesWeek`» (the ruled freeze) and asks `kidPoints` the «unranked is not rank one» question with
// it. ⚠ NO CYCLE, measured the house way rather than assumed: `world/ladder.ts` imports the calendar,
// the tournament, the ranking, `world/ledger`, `world/age`, `world/entryCaps`, `world/constants` and
// `world/derivedCache` – and nothing from this file – so the arrow runs one way, exactly as the
// `season/calendar` edge one import up does.
import { kidPoints, rankIn } from './ladder'
import type { BondBand, DiaryLifeStage, LifeBeatFollowUp, LifeBeatKind, LifeBeatPrompt, LifeBeatRecord, LoveEpisode, MoodRegister, MotherhoodBand, SoftBeatInvite, SpouseViewOccasion } from '../../shared/protocol/narrative'
// ⚠ A VALUE IMPORT FROM `shared/` AND THE ONLY ONE THIS FILE MAKES: §14's diary band reads the
// PORTRAIT's own late-stretch window so the words and the painting change on the same week.
// `shared/` is not the UI - engine purity forbids vue/pinia and the component directories, and
// `avatarEmotion.ts` is pure arithmetic over three week numbers.
import { PREGNANT_LAST_WEEKS } from '../../shared/avatarEmotion'
// ⚠ TYPE-ONLY, erased at compile time – §10's `airBoothMention` names the rung it is handed and
// resolves nothing from the calendar itself (that is `atOrAboveStageBar`'s job, one leaf over).
import type { TierId } from '../season/types'
// ⚠ TYPE-ONLY, erased at compile time, so no runtime arrow is added: §14 needs the pregnancy's own
// shape to WRITE one, and `EXPECTING_SUPPORT` needs its `support` union so the grades have exactly
// one spelling in the engine rather than a second copy of `'warm' | 'measured' | 'cold'` here.
import type { ComebackState, PregnancyState } from './state'
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
  // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – TRUE, AND IT IS `'ended'`'s ONE WORD INHERITED RATHER
  // THAN A SECOND DECISION. This is the same beat one rung up: §5b priced «the news that someone
  // exists» as a week the parent must answer before time may move, the week it is over is that beat
  // from the other end, and the week a MARRIAGE is over is that one again with a wedding behind it.
  // A career that could tick past it would answer her by walking away.
  // ⚠ NO REGISTER CLAUSE HERE, unlike `'ended'`'s: this kind has one register. A latched row always
  // holds the `'met'` receipt (the latch needs an answered `'engaged'` beat, which needs the
  // delivered episode), so there is no told-late divorce for a second sentence to be about.
  divorced: true,
  // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – TRUE, AND IT IS `'ended'`'s ONE WORD REPEATED AT THE
  // heaviest moment this layer holds. A career that could tick past a death in the family would be
  // answering it by walking away, which is the sentence tier 2's price was written from. ⚠ IT
  // BLOCKS FOR A PRIVATE GIRL TOO, and that is not a contradiction of §4's «private grieves almost
  // silently»: the silence is in the WORDS she says, not in whether the week stops.
  bereavement: true,
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
  // ⭐⭐⭐ v76 T8 – TRUE, AND IT IS `'fork-counsel'`'s ONE WORD REPEATED, WHICH IS THE WHOLE OF THIS
  // BEAT'S MECHANISM. `answerFork` refuses while ANY blocking row is unanswered and the queue answers
  // in `lifeLog` order, so a psy row raised one line after the coach's holds the fork shut until both
  // have been heard, in the order they called. No new guard, no new ordering rule and no plumbing –
  // the reserved comment's own promise, kept by typing one word.
  'fork-psy': true,
  // ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – TRUE, AND IT IS TIER 2's OWN PRICE AT THE LAYER'S BIGGEST
  // ASK SO FAR. «She is getting married» is a week the parent must answer before time may move –
  // `'met'`'s and `'ended'`'s one argument, at the moment the whole branch has been building toward –
  // and a career that could tick past it would answer her by walking away. ⚠ BLOCKING THE WEEK IS
  // NOT BLOCKING THE WEDDING: any answer releases time, and the wedding lands `weeksAfterEngagement`
  // later whatever was said (T3) – SHE decided, and the fork machinery is the shape, not the power.
  engaged: true,
  // ⭐⭐ v83 (wave 7 – T5) – FALSE, AND IT IS TIER 1's OWN WORD REPEATED FOR THE MARRIAGE'S STANDING
  // SURFACE. The spouse's view is texture the way small talk is – answered from the Home card inside
  // the standing three-week window, never lost as a ROW, and the week rolls on whether the parent
  // listens or not. A week the career STOPPED for the spouse's opinion would price the marriage as a
  // tax on time, which is the opposite of what the latch means (T4: marriage steadies).
  'spouse-view': false,
  // ⭐ v83 (wave 7 – T10) – FALSE, AND «NARRATIVE-ONLY» IS THE WHOLE ARGUMENT: the beat is a story
  // the week tells, not a question the week asks, and a career stopped for a housewarming would be
  // pricing a moment backlog §8 explicitly priced at nothing. The kept feed row is the record that
  // survives; the soft card is a three-week courtesy, and losing IT loses nothing.
  'own-key': false,
  // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – TRUE, AND IT IS TIER 2's PRICE AT THE LAYER'S BIGGEST
  // NEWS. `'met'`, `'ended'` and `'engaged'` all bought the same word for the same reason: this is a
  // week the parent must answer before time may move, and a career that could tick past it would
  // answer her by walking away. ⚠ BLOCKING THE WEEK IS NOT BLOCKING THE PREGNANCY, `'engaged'`'s own
  // sentence one kind up and truer here: the record is written at the RAISE, so the world is already
  // carrying it while the card stands, and every answer does the same two things – prices `bond` and
  // grades `support`. There is no answer that unmakes it, because there is no such answer to write.
  expecting: true,
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – TRUE, AND IT IS THE ONE WORD THE WHOLE RAMP RUNS ON. The
  // week she comes back is the week the calendar re-opens after 51 weeks of refusals, and the desk
  // needs an answer before a single entry can be booked – so a career that could tick past this card
  // would spend its first weeks back with no plan at all and the beat would price nothing. ⚠ IT IS
  // ALSO THE ONLY BEAT IN THIS TABLE THAT IS NOT ABOUT HER LIFE: §4a's law is that SHE decides and the
  // parent REACTS, and it holds – she has already decided, and T5's coin is where. What blocks here is
  // the SCHEDULING, which is the parent's job (the college fork's mechanical questions are the
  // precedent), so blocking is tier 2's price asked for the one question this layer really does put to
  // him.
  'return-plan': true,
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

/** ⭐⭐ ROUND 42 #8 – THE CONFIRM CONTROL under the answers, now that they only SELECT (owner:
 *  «Надо сделать как на прологе "выбор + proceed"»). DRAFT under invariant 4, and the word is the
 *  prologue's own shipped confirm vocabulary (`WALK_COPY.proceed`, round 41 #9: «наша желтая кнопка
 *  proceed») rather than a new coinage – one word, no punctuation, the way on off a card whose
 *  question is answered. ⚠ ONE STRING FOR EVERY BEAT KIND, small talk included, for the reason
 *  `WALK_COPY.proceed` gives: a per-kind confirm would be more drafts for the owner to read and more
 *  places for the same button to drift apart. */
const CONFIRM_LABEL = 'Proceed'

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
// 3f. `'fork-psy'` – THE PSYCHOLOGIST'S READ ON THE SAME `stop` (wave 5, T8). EVERY WORD IS A DRAFT.
// =================================================================================================
//
// ⭐⭐⭐ THE SECOND TABLE §3d PROMISED, AND NOT A REWRITE OF THE FIRST. The banner above ends «This
// pool is deliberately shaped so that adding him is a second table and not a rewrite of this one» –
// this is that table. Not one byte of `COACH_COUNSEL` or `COUNSEL_HEADING` moved for it.
//
// ⚠⚠ THE SEAT AND NOT A FOCUS. The gate is `psychologistWorksThisWeek` – the architect's ruling J,
// superseding the wave brief's own «gated `world.psychologistHired`»: a seat stood down by a college
// freeze or a booked family week is NOT BILLED, so it gives no counsel either. Any focus, or none: a
// retainer buys the man, and the man has a view about the biggest week of the career whatever year he
// is working on.
//
// ⚠⚠ HE READS `spiritShock` FOR THE **WORDING REGISTER ONLY**, and that fence is the whole reason he
// is allowed to read it at all (the architect, 13.09). «A girl under her line, and a girl under her
// line because somebody left» is exactly what he exists to tell apart – `engine/spirit.ts`' own
// promise – so the shock picks WHICH COLUMN of the table below is read and nothing else. Never a
// weight, never the option set, never a price: both of his answers are priced ZERO in both columns,
// so the priced set `answerLifeBeat` re-validates against is byte-identical with a shock live and
// with none. It is `forkStopDriverOf`'s own fence (§3, applied one level in) for a second reading.
//
// ⚠⚠ AND HE NEVER NAMES WHAT LANDED. The two-tier honesty law binds him harder than it binds the
// coach, for a reason neither of them chose: a told-LATE ending means `spiritShock` is live on a
// career where the parent has not yet been told there was anybody at all. A line naming a break-up
// would put a fact on screen that the player does not hold and that she has not said. So the shock
// column says «something outside the court, and it has not lifted» and stops – which is also what the
// 09.09 ruling requires of him («listen coaches the parent and never reports her sessions»).
//
// ⚠ NOT INDEXED BY HER VOICE AND NOT BY THE BOND BAND, for `COACH_COUNSEL`'s reasons exactly: he is
// supporting cast (who-she-is §5c) and he is not in the relationship the band measures.

/** ⭐⭐ WHICH COLUMN OF HIS TABLE IS READ – `'plain'`, or the kind of shock sitting on her.
 *
 *  ⚠⚠ DERIVED FROM THE SCHEMA'S OWN UNION rather than written out, which is what makes the table
 *  below total by TYPE over something that is still growing: `spiritShock.kind` has one member today
 *  and the build plan's steps 7–8 add the others, and the day one lands this record is a compile
 *  error until somebody writes the column. That is `DRIVER_TOTAL`'s and `WANTS_TOTAL`'s guarantee,
 *  taken from a field instead of from a local type. */
type PsyRegister = 'plain' | NonNullable<WorldState['spiritShock']>['kind']

// ⭐⭐⭐ v85 T1 – `postpartum` JOINED THE UNION AND THIS RECORD WENT RED, WHICH IS THE DESIGN ABOVE
// WORKING EXACTLY AS IT SAYS IT WILL («the day one lands this record is a compile error until somebody
// writes the column»). It is listed here – the register EXISTS – and its COLUMN is `null` in
// `PSY_COUNSEL` below, because the column is six sentences of player-facing copy and **wording is not
// an agent's to write** (invariant 4): T8 drafts it and the owner passes it. Listing the register
// while owing the column is the only split that keeps both halves honest – the roster stays total, so
// step 8's kind still reds here, and no line of copy is invented by a schema task.
// ⭐⭐⭐ v87 – AND STEP 8 LANDED WITH TWO, so this record went red twice more and both registers are
// listed with their COLUMNS owed for `postpartum`'s own reason, below.
const PSY_REGISTER_TOTAL: Record<PsyRegister, true> = {
  plain: true,
  breakup: true,
  postpartum: true,
  loss: true,
  bereavement: true,
  // ⭐⭐⭐ v88 – AND THE PARTING'S KIND REDS IT A FOURTH TIME, listed here with its COLUMN owed for
  // `postpartum`'s own reason below.
  divorce: true,
}
const PSY_REGISTERS = Object.keys(PSY_REGISTER_TOTAL) as readonly PsyRegister[]

/** ⭐⭐ WHAT THE PSYCHOLOGIST SAYS – 6 drafts, his register x the coach's driver.
 *
 *  ⚠ THE SHARED OPENING PER COLUMN IS THE POINT OF THE FAMILY, exactly as «The tennis is not the
 *  question» is of the coach's: the first thing the man paid to read her says is whether anything is
 *  sitting on top of this week. Everything after it is the driver, read his way.
 *
 *  ⚠ THE NARRATION SAYS «after the coach» BECAUSE IT ALWAYS IS. Both rows are raised on one condition
 *  (`counselDriver !== null`) and his is raised second, so the coach's card has always just been
 *  answered when this one opens. It is a fact about the queue, not a hope about it.
 *
 *  ⚠ THE HONESTY LAW: he may name what he can see and what he cannot reach; never a duration, a date,
 *  a count, a result, another person, or one word of what she said in a session.
 *
 *  ⚠⚠ TWO CELLS CARRY THE ARCHITECT'S ВЫЧИТКА (13.09) AND HIS WORDING, VERBATIM. Both were replaced
 *  at the delivery gate, both in the `breakup` column, and the reasons are kept here because the next
 *  editor is the person who could put either back:
 *    · `strained` CLAIMED A DISTANCE THE DRIVER DOES NOT CARRY. It read «She has been carrying it a
 *      long way from home, and distance makes a weight feel permanent when it is not» – and
 *      `strained` is `stopRootsOf`'s BOND reading, the distance BELOW `ECONOMY.bond.start`, i.e. a
 *      strained HOME. The beat is reachable on a girl who still lives under the roof and has never
 *      been far from it, so the line was true-sounding and false on part of the ladder – exactly the
 *      family of error the legible pools' own lints were built for. The replacement keeps the best
 *      clause («feel permanent when it is not») and says what the driver actually means: nowhere to
 *      set it down. ⚠ A GEOGRAPHIC READING MAY NOT COME BACK HERE unless a driver is added that
 *      carries one; this pool is keyed on `ForkStopDriver` and nothing in that union is a place.
 *    · `own`'s closing clause read «only that a want stated this month is partly the month», which
 *      was flagged by its own author as clumsy for a reading that is correct. The reading is
 *      unchanged – the month is doing some of the wanting – and only the phrasing moved.
 *  ⚠ The other four cells did not move, and the shared openings are the point of the family (above),
 *  not a thing to harmonise away. */
const PSY_COUNSEL: Record<PsyRegister, Record<ForkStopDriver, string> | null> = {
  plain: {
    worn: 'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is tired the way a long season makes a person tired, and tired has an end to it."',
    strained:
      'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. What she is short of is a room where the answer is already yes, and that is not a room I can build from a call."',
    own: 'Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is clear, she has been clear for a while, and being clear is not a symptom."',
  },
  breakup: {
    worn: 'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. Underneath it she is also tired, and those are two different things to be."',
    strained:
      'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. She has nowhere easy to set it down, and a weight with nowhere to go starts to feel permanent when it is not."',
    own: 'Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. What she wants is her own and I would not argue it – only that a month like this one does some of the wanting."',
  },
  /** ⭐⭐⭐ v85 T1 – THE COLUMN IS OWED, AND `null` IS THE ONLY HONEST CELL A SCHEMA TASK CAN PUT HERE.
   *  Wave 8's T1 widened `spiritShock.kind` with `'postpartum'` (the build plan's step-7 row reserved
   *  it) and this table went red, which is the totality above doing its job. What the red asks for is
   *  THREE MORE SENTENCES IN HIS VOICE, under the honesty law two blocks up – and ⚠⚠ USER-FACING
   *  WORDING IS NOT AN AGENT'S TO WRITE (invariant 4, the owner's ruling of 30.08). T8 drafts this
   *  column and the owner passes it; §0 of the wave brief makes the same call for the new
   *  `CareerEndingType` member in as many words: «the ending cannot ship without its copy, and the
   *  copy is HIS».
   *
   *  ⚠ THE TEMPTING SHORTCUT IS REFUSED AND NAMED, so nobody re-discovers it as a good idea: aliasing
   *  this column to `plain`'s would compile, keep every test green, and make the psychologist tell a
   *  woman eight weeks after a birth that «nothing is sitting on top of this one» – a sentence that is
   *  false about the one week it would be shown in. A missing column is a bug that announces itself;
   *  a wrong column is a bug that reads well.
   *
   *  ⚠⚠ AND IT IS UNREACHABLE FOR A STRUCTURAL REASON, NOT MERELY «UNTIL T4» – the architect's
   *  gate-1 finding, written here because the weaker sentence would have gone stale the week T4
   *  landed and left a reader believing this cell was one task from being needed. Three facts, each
   *  one grep-checkable:
   *
   *    1. the register is stamped at EXACTLY ONE site – the single `raiseLifeBeat(…, 'fork-psy', …)`
   *       in `src/`, at the bottom of this file, which reads `world.spiritShock?.kind ?? 'plain'`;
   *    2. that site fires only off a `'fork-opinion'` row answered `stop`, and `'fork-opinion'` is
   *       raised in exactly one place (`raiseForkOpinion`, called once, from `resolveEndings` under
   *       `world.fork === null && forkDue(…)`) – the fork at nineteen, asked on `schoolEndWeek`;
   *    3. it BLOCKS (`LIFE_BEAT_BLOCKING`), and the advance refuses while a blocking row is
   *       unanswered, so the career cannot tick past it. She answers it at 18.0–18.9 or not at all.
   *
   *  ⭐ A `'postpartum'` shock needs a marriage (`ECONOMY.wedding.ageGate` 23), a pregnancy and a
   *  birth, so it cannot exist before ~24 – and THE TWO WINDOWS CANNOT OVERLAP. This column is owed
   *  only if a later wave raises `'fork-psy'` from somewhere other than the fork, and T8 is
   *  therefore NOT asked to draft three sentences for a card that cannot be shown. ⚠ The throw
   *  below is what makes that safe to rely on: the day a second raise site appears it names this
   *  cell by register instead of reading `undefined[driver]`. */
  postpartum: null,
  /** ⭐⭐⭐ v87 – THE SAME TWO COLUMNS OWED, FOR THE SAME REASON AND WITH THE SAME STRUCTURAL
   *  UNREACHABILITY, and they are written as `null` rather than aliased to `plain`'s for the
   *  refusal named one cell up: a man telling a woman the week after a loss that «nothing is
   *  sitting on top of this one» is a bug that reads well.
   *
   *  ⚠⚠ UNREACHABLE BY THE SAME THREE FACTS, and this time the ages make it airtight rather than
   *  merely true today. The register is stamped at ONE site, off a `'fork-opinion'` row answered
   *  `stop`, which is the fork at NINETEEN and blocks the calendar until it is answered – and both
   *  of this wave's kinds are gated far above it: a pregnancy needs a marriage (23+, wave 7) and
   *  the bereavement needs the ADULT rung (`kidAgeExact ≥ 23`, §4). So no career can hold either
   *  mark on the one week this table is read, and the cells are owed by TYPE rather than by need.
   *
   *  ⚠ WHAT A FUTURE COLUMN WOULD OWE: three sentences per kind in his voice, under the honesty law
   *  two blocks up, drafted by a content task and passed by the owner – never by a schema task
   *  (invariant 4). And §4 adds one clause of its own for `bereavement`: **the deceased is UNNAMED
   *  in mechanics and copy** (RULED 22.09), so a column that named a relative would be unshippable
   *  whoever wrote it. */
  loss: null,
  bereavement: null,
  /** ⭐⭐⭐ v88 – A FOURTH COLUMN OWED, AND THE UNREACHABILITY ARGUMENT IS THE TIGHTEST OF THE FOUR.
   *  The register is stamped at ONE site, off a `'fork-opinion'` row answered `stop` – the fork at
   *  NINETEEN, which blocks the calendar until it is answered. A `'divorce'` shock needs a MARRIAGE
   *  first (`ECONOMY.wedding.ageGate` 23) and then an ending after it, so the earliest week this
   *  mark can exist is years past the last week this table is read. Owed by TYPE, never by need.
   *
   *  ⚠ `null` RATHER THAN AN ALIAS TO `breakup`'s COLUMN, and that is worth saying because the alias
   *  is far more tempting here than it was for the three above: a divorce IS «something outside the
   *  court landed on her and has not lifted», so `breakup`'s three sentences would read perfectly.
   *  They would also be the wave's whole claim thrown away in one line – the parting exists because
   *  a marriage ending is not a break-up wearing the same words, and a column that borrowed them
   *  would say the opposite in the one place a professional is supposed to be precise. */
  divorce: null,
}

/** The parent's frame over his card. ONE line and not a register table, `COUNSEL_HEADING`'s own call:
 *  the week's weather is hers and this is a second phone call from somebody else. ⚠ It says why the
 *  fork is STILL shut after the coach has been answered, which is R10-16's doctrine – a control held
 *  back with no reason on screen is the bug, and the second card is exactly where a player would
 *  otherwise wonder. */
const PSY_HEADING = 'She wants to stop, and her psychologist has asked for a word too, before we answer'

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

/** ⭐⭐⭐ v77 T6 – THE HEADLINE REGISTER, AND IT IS **ONE LINE ON THE STANDING POOL** rather than a
 *  fourth column of it (the brief's own boundary: «the one addition is a headline-register intro
 *  variant on the standing prompt – NO new beat kind, no new delivery path»). The overtake is
 *  who-she-is §0's founding scene given its mechanism – «a parent learning about a boyfriend from a
 *  photograph» – and the only thing about the card that may move is the frame the parent reads it
 *  under. Her line, the options, the follow-up and the `LifeBeatRecord` itself are BYTE-IDENTICAL to
 *  an ordinary delivery's, which is the property T6's pin asserts by deep-equalling the two.
 *
 *  ⚠⚠ IT KEYS ON NOTHING – not the bond band the three standing frames key on, and deliberately.
 *  `MET_HEADING`'s ladder says how far apart the two of them are when the news lands; this frame
 *  says WHERE THE NEWS CAME FROM, and that fact outranks the distance in the one week it is true:
 *  a `her`-band parent who read it in the paper was not told by her either. A per-band headline row
 *  would be three sentences about one scene, and §5a's rule (no agent widens a pool unasked) is the
 *  other half of the argument.
 *
 *  ⚠ A DRAFT, like every word in this file's pools – T8's вычитка and the owner's playtest are the
 *  gate (invariant 4, the wave's §5). */
const MET_HEADING_HEADLINE = 'We read about it before she told us'

// =================================================================================================
// 3c. `'small-talk'` – TIER 1, THE WEEK SHE COMES WITH SOMETHING SMALL (wave 3, T8). EVERY WORD A DRAFT.
// =================================================================================================
//
// who-she-is §5b's three tiers, the middle one: «small talk – she comes with something small (a
// worry before a big draw, a joy, a question); 2–3 reply options». It rides the beat machinery
// wave 2 built and adds NOTHING to it – the queue, the pause, the engine-side re-validation and the
// dialog's whole contract are called, never re-implemented.
//
// ⭐⭐⭐ ROUND 42 #15/#24 REWROTE WHAT THIS BEAT IS **ABOUT** AND LEFT ITS MACHINERY ALONE. The three
// subjects became six kinds of material (§2 of the spec), the ordinary week stopped resolving to
// «I want to ask you something», and every answer now earns a second line of hers. The SITUATION
// layer that does all of it is §3c-2 below; everything in §3c is the card as it shipped, and it is
// still live – a career with no situation written for it, and every save raised before this round,
// reads exactly these pools. Read §3c-2's banner for the design and for the five findings of the
// owner's own review that bind it.
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

/** WHAT SHE CAME WITH, AS TIER 1 SHIPPED IT – who-she-is §5b's own triple («a worry ... a joy, a
 *  question»). Machine-readable, never a rendered word, exactly as `'fork-opinion'`'s want is.
 *
 *  ⚠⚠ RENAMED `LEGACY_` BY ROUND 42 #24 AND KEPT WHOLE, WHICH IS A SAVE-COMPAT REQUIREMENT RATHER
 *  THAN NOSTALGIA. A `'small-talk'` row's `detail` is PERSISTED, and a career loaded from a v78 save
 *  can be holding a live soft row raised before this round – `'worry'`, `'joy'` or `'question'`,
 *  with no situation behind it. That row still has to render, so this roster and the pool it keys
 *  (`SMALL_TALK_LINE`) stay exactly where they are and keep serving it. There is NO MIGRATION to
 *  write and no schema bump owed: new rows carry a different SHAPE of detail
 *  (`'<subject>:<situation>'`), and the shape is what tells the two apart – `'fork-psy'`'s own
 *  two-field detail, read the same way.
 *
 *  ⚠ AND THE LEGACY PATH IS STILL REACHABLE ON A NEW CAREER, which is the honest half. When no
 *  situation is available for this girl, at this stage, on this career, `rollSmallTalk` raises a
 *  legacy row and she opens with one of these twelve lines, exactly as she did before this round.
 *  The catalogue below is thin on purpose (spec §10's delivery order: «a small real set first»), so
 *  those cells are named in the handoff rather than hidden. */
export const LEGACY_SMALL_TALK_SUBJECTS = ['worry', 'joy', 'question'] as const
export type LegacySmallTalkSubject = (typeof LEGACY_SMALL_TALK_SUBJECTS)[number]

/** ⭐⭐⭐ ROUND 42 #24 – THE SIX KINDS OF SMALL THING SHE MIGHT BRING (spec §2), and the taxonomy is
 *  the fix rather than a re-labelling of the old one.
 *
 *  The owner: «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
 *  разнообразия, это же наша главная фича». The spec found the root and it is in the old roster
 *  itself: `worry` and `joy` name emotional MATERIAL, `question` names a SPEECH ACT. Because the
 *  ordinary-mood week always resolved to `question`, the ordinary opener always collapsed to «I want
 *  to ask you something» – and no amount of paraphrase fixes a taxonomy that puts a verb where the
 *  other two put a feeling. So all six name material:
 *
 *      worry        something sitting wrong
 *      good-news    something that went right
 *      decision     a small choice she is turning over
 *      curiosity    a question she actually wants answered
 *      observation  a thing she noticed, no ask attached
 *      story        something that happened, told for its own sake
 *
 *  ⚠ `good-news` AND `curiosity` ARE NOT `joy` AND `question` RENAMED. The legacy roster above is a
 *  different set of three values living in the same field; nothing maps one onto the other, and
 *  `SMALL_TALK_FRAME_REGISTER` – keyed on BOTH rosters – is the only place they meet. */
export const SMALL_TALK_SUBJECTS = ['worry', 'good-news', 'decision', 'curiosity', 'observation', 'story'] as const
export type SmallTalkSubject = (typeof SMALL_TALK_SUBJECTS)[number]

/** ⭐ WHICH OF THE THREE LEGACY SUBJECTS, READ OFF HER WEEK AND NOT OFF A SECOND DRAW.
 *
 *  ⚠⚠ ROUND 42 #24 LEFT THIS FUNCTION ALONE, BYTE FOR BYTE, AND THE UNTOUCHED-NESS IS THE POINT. It
 *  is no longer the road a situation-backed beat takes – `drawSmallTalkSubject` is – but it is still
 *  the whole of the LEGACY raise, and the legacy card has to stay exactly the card it was. Its own
 *  pin (`tests/wave3-small-talk.test.ts` §G) therefore stays green without a line moving, which is
 *  what tells a reader the old path really is unchanged rather than merely asserted to be.
 *
 *  ⚠⚠ ZERO DRAWS, AND IT IS THE SPLIT-KEY LAW THAT MAKES IT SO RATHER THAN THRIFT. The wave owns
 *  FOUR stream keys (brief §3) and `seed:life:smalltalk:<week>` answers exactly one question –
 *  «does she come with something». A second, DIFFERENT fact read off the same key would be two
 *  facts sharing a key, which is the one thing the 09.09 stream law forbids. So the subject is
 *  DERIVED, and the fact it is derived from is §5b's composition rule read literally: SPIRIT owns
 *  the register of the moment, so the register is what decides which small thing she brings.
 *  ⚠ ROUND 42 #24 DID create two more keys, for the situation layer, and they are their own
 *  sub-streams with their own week – see `rollSmallTalk`. */
export function smallTalkSubjectFor(register: MoodRegister): LegacySmallTalkSubject {
  if (register === 'low') return 'worry'
  if (register === 'bright') return 'joy'
  return 'question'
}

/** ⭐⭐ THE PARENT'S FRAME FOLLOWS THE SUBJECT, NOT THE WEEK – round 42 #24's one consequence for a
 *  string nobody rewrote, and it is a correctness fix rather than a preference.
 *
 *  `SMALL_TALK_HEADING` has three rows and they are keyed on the Mood register, which was exactly
 *  right while the subject WAS the register (`smallTalkSubjectFor` above, one-to-one). Spec §2 cuts
 *  that link on purpose – «Mood sets the WEIGHTS, not the subject» – so a bright week can now bring
 *  a worry, and a heading reading «She came to us with something good this week» over «Something's
 *  wrong. I don't know what yet.» would be the card contradicting her in its own first line.
 *
 *  ⚠⚠ SO THE REGISTER THE HEADING READS IS DERIVED FROM THE SUBJECT, AND NOT ONE WORD OF HIS COPY
 *  MOVED (invariant 4). The three shipped frames are exactly the three this returns a key for.
 *
 *  ⚠ AND ON A LEGACY ROW IT IS THE IDENTITY. `worry → low`, `joy → bright`, `question → level` is
 *  `smallTalkSubjectFor` read backwards, so a pre-round-42 row gets back the very register it was
 *  raised on and its card is BYTE-IDENTICAL to the one that shipped. That is the whole reason this
 *  record is keyed on both rosters instead of only the new one. */
const SMALL_TALK_FRAME_REGISTER: Record<SmallTalkSubject | LegacySmallTalkSubject, MoodRegister> = {
  // the six
  worry: 'low',
  'good-news': 'bright',
  decision: 'level',
  curiosity: 'level',
  observation: 'level',
  story: 'level',
  // ...and the two legacy values the six do not already contain (`worry` is shared)
  joy: 'bright',
  question: 'level',
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
 *  ⭐ PROVENANCE OF `sunny`/`joy`'s opener, corrected 11.09: it is THE OWNER'S OWN WORD, carried on
 *  his P2 verdict list. It is absent from the 19-frame delivery for one reason only – that cell's
 *  frame is channel-neutral and SHARED, so there was no away row for it to appear in. The architect
 *  first recorded it as an inference and the owner corrected the record: one source, byte-for-byte
 *  agreement, chain of custody clean.
 *
 *  ⭐⭐⭐ ROUND 42 #24 – NINE QUOTED SENTENCES REWRITTEN, AND ALL NINE ARE HIS OWN (spec §9, «his
 *  proposed rewrites», applied verbatim). They land in six cells because two of the cells hold two
 *  of the nine:
 *
 *      sunny/worry   «I've been worrying at something all week.» → «Something's been on my mind all week.»
 *                    «I'd rather say it than carry it.»          → «I think I need to say it out loud.»
 *      sunny/joy     «Something went well. I'm pleased about it.» → «Something went right this week. I'm still smiling about it.»
 *      fiery/worry   «Something's bothering me. It's been bothering me for days.» → «Something's bothering me, and I can't leave it alone.»
 *      fiery/joy     «Today was a good one. A really good one.»  → «Good day. Really good. I needed one.»
 *      quiet/joy     «The morning went the way I wanted it to.»  → «Today went well.»
 *      deep/worry    «Something is sitting wrong.»               → «Something's wrong. I don't know what yet.»
 *                    «That is all I have.»                       → «That's as far as I've got.»
 *      deep/joy      «Good week. I will take it.»                → «Good week. I needed that.»
 *
 *  ⚠ EACH REWRITE LANDS IN **BOTH** FRAMES OF ITS CELL, because the quoted span is shared by law and
 *  `tests/wave3-presence.test.ts` §D asserts exactly that. The FRAMES – the narration outside the
 *  quotation – were not touched by §9 and are not touched here.
 *
 *  ⚠ THE THREE `question` CELLS ARE UNCHANGED, INCLUDING «I want to ask you something.» – the very
 *  sentence #24 is named after. §9 does not rewrite them, and the reason is the spec's own: the fix
 *  for that cell is not a better paraphrase, it is the SITUATION layer below taking the ordinary
 *  week off `question` altogether. A rewrite nobody asked for would be invariant 4 broken while
 *  obeying it three lines up. */
const SMALL_TALK_LINE: Record<Temperament, Record<LegacySmallTalkSubject, PresenceCell>> = {
  sunny: {
    worry: {
      roof: 'She came and sat down without being asked to. "Something\'s been on my mind all week. I think I need to say it out loud."',
      away: 'She stayed on the line past the point of the call. "Something\'s been on my mind all week. I think I need to say it out loud."',
    },
    joy: {
      roof: 'She said it before anyone had asked how the week went. "Something went right this week. I\'m still smiling about it."',
    },
    question: {
      roof: 'She asked it over dinner, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
      away: 'She saved it for the end of the call, with the context first. "Can I ask you something? It\'s not urgent, I just want to know."',
    },
  },
  fiery: {
    worry: {
      roof: 'She was through the door and straight into it. "Something\'s bothering me, and I can\'t leave it alone."',
      away: 'She rang out of turn and went straight in. "Something\'s bothering me, and I can\'t leave it alone."',
    },
    joy: {
      roof: 'She was talking before she had put anything down. "Good day. Really good. I needed one."',
      away: 'Her voice note skipped hello entirely. "Good day. Really good. I needed one."',
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
      roof: 'She put the kettle on and mentioned it while it filled. "Today went well."',
      away: 'She mentioned it in the middle of a call about other things. "Today went well."',
    },
    question: {
      roof: 'She asked it while she was stacking the shelf, without looking round. "Can I ask you about something?"',
      away: 'She asked it right before hanging up. "Can I ask you about something?"',
    },
  },
  deep: {
    worry: {
      roof: 'She waited until the room was quiet. "Something\'s wrong. I don\'t know what yet. That\'s as far as I\'ve got."',
      away: 'She called late, and took a while getting to it. "Something\'s wrong. I don\'t know what yet. That\'s as far as I\'ve got."',
    },
    joy: {
      roof: 'She said it on her way past, and did not stop. "Good week. I needed that."',
      away: 'Her message came and did not ask for a reply. "Good week. I needed that."',
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
// 3c-2. ⭐⭐⭐ ROUND 42 #15/#24 – THE SITUATION, AND THE BEAT BECOMES AN EXCHANGE
// =================================================================================================
//
// `docs/specs/the-small-talk-exchange-2026-09.md`, and the copy in this section is HIS – §8a–§8c are
// eight exchanges he read line by line and revised on 15.09. What is drafted rather than his is
// flagged where it stands, and only there.
//
// THE TWO COMPLAINTS THIS ANSWERS, in his own words:
//
//   #15 «выбрал пункт, чтобы она сказала больше, а попап закрылся… Сейчас выглядит как "сказала А,
//        но никогда не сказала Б".»
//   #24 «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
//        разнообразия, это же наша главная фича.»
//
// THE SHAPE (spec §1): she opens with a CONCRETE subject; the parent invites more, responds, or
// gives space; she answers. Invite earns a CONTINUATION, respond and give-space earn a REACTION. The
// economy does not move – bond-neutral, non-blocking, missable, four a season – and none of the
// three is marked correct.
//
// ⚠⚠ §8d's FIVE FINDINGS, WHICH ARE DESIGN AND OUTRANK THE LINE EDITS. Each one is load-bearing here
// and each one is pinned:
//
//  1. A `respond` BRANCH MUST NAME THE PARENT'S ACTUAL OPINION. «Say how we see it» promises a view
//     and then she answers an opinion the player never heard. So the `respond` label is per
//     SITUATION, not per subject – «Say the travelling matters too», «Say a good coach explains what
//     they're changing», «Ask whether she's been eating properly». More copy is the price and it is
//     the point: a promise of content the game has not written is the defect this item exists to
//     remove. (⚠ ONE EXCEPTION STANDS AND IS REPORTED RATHER THAN EDITED – see `line-call`.)
//  2. A `story` IS TWO BEATS. The incident is a SHARED continuation every route hears; the branch is
//     the aftermath; EVERY route finishes the story. `shared` below is that paragraph, and it is
//     prepended to all three replies in `smallTalkFollowUps` – so a branch that left the player
//     waiting for B cannot be assembled.
//  3. THE VOICE TEST IS HIS, AND THE OBVIOUS ONE IS WRONG. «The same subject in two voices shares no
//     sentence» proves nothing: different SITUATIONS produce different words by themselves. His
//     test: **same event, same facts, same age, same parental choice → four different ways of
//     noticing, disclosing and responding.** `court-four` is written in all four voices for exactly
//     that test (`tests/round42-small-talk-exchange.test.ts` §E). ⭐ And «no shared phrase» is NOT a
//     target – real people all say «Okay».
//  4. UNGRADED ≠ EMOTIONALLY INTERCHANGEABLE. No bond, no score, no recommended branch – but the
//     three branches may honestly produce relief, mild resistance, amusement, uncertainty, a
//     boundary or a changed thought. What is forbidden is scoring, a recommendation cue and a
//     consistently superior branch, not difference in feel.
//  5. ⚠⚠ THE FACTUAL BOUNDARY, AND IT IS A LAW. Invented DOMESTIC detail is hers and must stay
//     stable across an exchange (the flat, the coffee, the dad who put the lid back on). A
//     COMPETITIVE claim – entering a tournament, a decision deadline, beating an opponent, four
//     previous losses – NEEDS A REAL FACT IN THE SAVE BEHIND IT. She may interpret an outcome
//     however she likes; she may not invent one. `fact` below is that line, and `SMALL_TALK_FACT`
//     is where each claim is checked against the career.
//
// ⚠ TEXTURE ONLY, THE FOG LAW UNCHANGED (spec §11): nothing here writes a consequential fact. A
// practice that felt easy is a mood, never a training gain; a name mentioned is a name, never a
// relationship the rest of the engine has to honour.

/** ⭐⭐ THE THREE STANCES (spec §3), AND THEY ARE ALWAYS THE SAME THREE SHAPES. Never one of them is
 *  the right one. Named for what the parent DOES, because the words they wear are the situation's.
 *
 *  ⚠⚠ AND EACH ONE KEEPS ITS SHIPPED OPTION ID (`more` / `view` / `easy`, `LIFE_BEAT_OPTIONS`
 *  below), which is a save-compat requirement rather than thrift: an option id is PERSISTED in
 *  `LifeBeatRecord.answer`, so a new vocabulary on these three would make every answered small-talk
 *  row in every shipped save unreadable and would owe a migration. The words on the buttons change;
 *  the ids the world records do not. */
export const SMALL_TALK_STANCES = ['invite', 'respond', 'space'] as const
export type SmallTalkStance = (typeof SMALL_TALK_STANCES)[number]

export const SMALL_TALK_STANCE_ID: Record<SmallTalkStance, string> = {
  invite: 'more',
  respond: 'view',
  space: 'easy',
}

/** ⭐⭐⭐ §8d.5 – THE COMPETITIVE CLAIMS A SITUATION MAY ASSERT, each one a question about the
 *  AUTHORITATIVE career rather than about her mood. A situation carrying one of these is UNREACHABLE
 *  on a week where the answer is false, which is the whole of the factual boundary.
 *
 *  ⚠ THE ROSTER IS A UNION AND THE PREDICATES ARE A TOTAL RECORD, so a new claim cannot be added
 *  without somebody writing the read that makes it true. */
export const SMALL_TALK_FACTS = ['played-recently', 'march-entry-open', 'coach-employed', 'beat-her-conqueror', 'clear-next-week'] as const
export type SmallTalkFact = (typeof SMALL_TALK_FACTS)[number]

/** How far back «today» may reach when she recounts a match. ⚠ TWO AND NOT ONE, because the row is
 *  live for three weeks anyway (`smallTalkTtlWeeks`) and the tick raises the beat in the same phase
 *  the week's result settled in – so an exact «this very week» would be a precision the surface
 *  cannot keep. Two weeks is the honest window for «there was a call today». */
const SMALL_TALK_FACT_WEEKS = 2

/** The month a `decision` about «the March tournament» has to be about. ⚠ A REAL CALENDAR READ:
 *  `weekMonth` is `shared/dates.ts`' own week → month mapping (the career's weeks land on real
 *  dates), so the tournament she is turning over is one that genuinely falls in March. */
const MARCH = 3

/** Her competitive matches as the feed retains them, oldest first: week, opponent, and whether she
 *  won. ⚠ FRIENDLIES EXCLUDED (`!e.friendly`) – a practice set is not a result she may claim.
 *
 *  ⚠⚠ AND IT IS A ROLLING WINDOW, NOT A CAREER. `world.events` is capped at `EVENTS_CAP` and
 *  `pruneEvents` sacrifices her oldest match rows last but does sacrifice them – roughly the last
 *  20–40 competitive matches on a busy career. That makes every count below a LOWER bound, which is
 *  the safe direction for `beat-her-conqueror`: a gate that can only under-count can only refuse a
 *  situation it should have offered, never offer one it should have refused. `coachMarket.ts`'
 *  `matchesEverPlayed` records the same caveat for the same feed. */
function kidMatchRows(world: WorldState): { week: number; opponent: string; won: boolean }[] {
  const out: { week: number; opponent: string; won: boolean }[] = []
  for (const e of world.events) {
    const m = e.match
    if (m === undefined || e.friendly === true) continue
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    out.push({ week: e.week, opponent: m.aId === KID_ID ? m.bId : m.aId, won: m.winnerId === KID_ID })
  }
  return out
}

/** ⭐ §8d.5's FIFTH READ (his 17.09: «пиши гейт по R17, давай сделаем»). A clear week ahead is a
 *  CALENDAR fact and no other claim carried one: `march-entry-open` asks whether a door is still
 *  open, this asks whether the week behind it is empty.
 *
 *  ⚠⚠ TWO CLAUSES AND NOT ONE, AND THE SECOND IS THE HONEST HALF. The proposed gate was «the season
 *  holds no event she is entered in next week», and that sentence is TRUE ALL WINTER – in the
 *  off-season and inside the college freeze every week is empty, so «I've got a completely empty week
 *  and I don't know what to do with myself» would stop being a worry and become a description of
 *  February. The row's own kernel is «she has not decided whether that is rest or an ABSENCE», and an
 *  absence needs something to be absent FROM. So the week must also HOLD an event she could have
 *  been at; a calendar with nothing in it is not a gap in her season.
 *
 *  ⚠ `enteredScheduledThisWeek` (world/injury.ts) one week forward, on the same two fields, negated.
 *  Pure and zero-draw like its four siblings, and asked BEFORE the situation is drawn. */
export function nextWeekIsClear(world: WorldState): boolean {
  const ahead = world.season.filter((e) => e.week === world.week + 1)
  return ahead.length > 0 && !ahead.some((e) => world.entries.includes(e.id))
}

/** ⭐⭐⭐ §8d.5's FIVE READS, AND EVERY ONE OF THEM IS PURE AND ZERO-DRAW. They are asked BEFORE the
 *  situation is drawn (`reachableSituations`), never after, so a false fact removes the situation
 *  from the pool instead of being papered over in the copy.
 *
 *  ⚠ `march-entry-open` CARRIES THE DEADLINE CLAUSE HIS REVIEW ADDED IN THE GATE, not in the option
 *  list. «Say there's time to decide – *only when the deadline actually permits it*» (§8c). Written
 *  as a conditional OPTION it would have made the card sometimes show two stances and sometimes
 *  three; written as part of the gate, the situation simply does not arise on a week where that
 *  sentence would be false, and all three stances stay honest by construction.
 *  ⚠ `world.week < e.deadlineWeek` AND NOT `<=`: the deadline is the END of that week, so equality
 *  means «decide now», which is precisely when «there's time to decide» stops being true.
 *
 *  ⚠⚠ AND IT CARRIES `!inCollege(world)` SINCE C-07 (the owner's ruling 3(a), 26.09). The three
 *  clauses above ask the CALENDAR whether a March door is open; none of them asks the freeze, and
 *  neither does `entryStatus` → `entryVerdict`. The door is shut somewhere else entirely: `enterEvent`
 *  opens with `guardNotEnded`, which throws `COLLEGE_FREEZE_REFUSAL` under the college latch. So the
 *  fact was true on 24 of 95 college pause-weeks the review sampled and the engine refused the entry
 *  on all 24 – a card asking the parent about an entry nobody could make, which is exactly what the
 *  contract three paragraphs up forbids.
 *
 *  ⚠⚠ `world.college` AND NEVER `world.ending`, and this is the one clause where the difference is
 *  the whole fix. The small-talk roll runs INSIDE `resumeFromCollege`'s loop, which sets
 *  `world.ending = null` before it ticks – so an ending test would read false on precisely the weeks
 *  the gate has to be false on. `inCollege` is derived from the span (`world.college.untilWeek`), so
 *  it answers the same on a save taken mid-freeze.
 *
 *  ⚠ WHAT IT COSTS, PRICED AND NOT ASSUMED: R8 `alone-or-with-them` and R20
 *  `the-money-she-did-not-ask-about` are the two rows on this gate and both declare `college`, so
 *  both college cells go silent together (K5b: 24.6 % of college pause-weeks → 0, the independent
 *  column untouched at 66.1 %). Their `independent` column is the whole of their life now. Nothing is
 *  reworded and no row is removed – the situations simply stop being reachable at one stage.
 *
 *  ⚠ `tests/principles-c07-march-entry.test.ts` is the net, and it asks the ENGINE rather than this
 *  clause: no week may have both the gate true and `enterEvent` refusing with the freeze sentence. */
const SMALL_TALK_FACT: Record<SmallTalkFact, (world: WorldState) => boolean> = {
  'played-recently': (world) =>
    kidMatchRows(world).some((r) => r.week > world.week - SMALL_TALK_FACT_WEEKS && r.week <= world.week),
  'march-entry-open': (world) =>
    !inCollege(world) &&
    world.season.some(
      (e) =>
        weekMonth(e.week) === MARCH &&
        e.week > world.week &&
        !world.entries.includes(e.id) &&
        world.week < e.deadlineWeek &&
        entryStatus(world, e).level !== 'blocked',
    ),
  'coach-employed': (world) => world.coachId !== null,
  // ⚠⚠ «I beat someone I've never beaten» + «She's beaten me four times. Four!» – BOTH halves of his
  // copy are checked, and the second is why this is the strictest gate in the record. A win in the
  // window, against an opponent who has beaten her FOUR times in the retained feed and never lost to
  // her. `=== 4` and not `>= 4`, because she says the number out loud: at five it is her miscounting,
  // and the spec's own line is «she may interpret an outcome however she likes; she may not invent
  // the outcome».
  'beat-her-conqueror': (world) => {
    const rows = kidMatchRows(world)
    return rows.some((r) => {
      if (!r.won || r.week <= world.week - SMALL_TALK_FACT_WEEKS || r.week > world.week) return false
      const before = rows.filter((p) => p.opponent === r.opponent && p.week < r.week)
      return before.length === 4 && before.every((p) => !p.won)
    })
  },
  'clear-next-week': nextWeekIsClear,
}

/** One branch of one exchange: what the PARENT may say, and what she says back to exactly that.
 *  ⚠ THE TWO TRAVEL TOGETHER, and §8d.1 is why: a label and a reaction written in different places
 *  is how «Say how we see it» came to be answered by «I'll watch for that» – a reply to an opinion
 *  nobody had voiced. Pairing them in one object makes the mismatch visible to whoever edits either. */
export interface SmallTalkBranch {
  label: string
  said: string
}

/** ⭐⭐⭐ ROUND 44 – ONE SITUATION **IN ONE VOICE**, and the unit is now a column of a row rather
 *  than a row of its own. The corpus's §2 is the whole of the change: a situation carries the event,
 *  the stages and the fact; the OPENER and the three branches are written PER VOICE, so the same
 *  evening can be told four ways instead of being locked to one girl in four.
 *
 *  ⚠⚠ `opener` IS ONE SPOKEN PAYLOAD AND CARRIES NO FRAME. Until this round it held the frame and
 *  the quotation glued into one string per presence («She put the kettle on. "Practice finally felt
 *  easy today."»), which is why a transcription from the corpus document was impossible: the document
 *  holds ONLY the quotation, because round 43 lifted the frame into its own layer. A frame now comes
 *  from `SMALL_TALK_FRAMES` and `smallTalkOpener` joins the two.
 *
 *  ⭐ AND THE LAW ROUND 43 PINNED BECOMES TRUE BY CONSTRUCTION. «The quoted span is IDENTICAL at both
 *  distances» (`tests/wave3-presence.test.ts` §D) was a convention two strings had to keep; with one
 *  payload behind both presences there is no second string that could differ. The pin stays – it is
 *  now asserting a property rather than policing a habit. */
export interface SmallTalkVoiceEntry {
  /** Her spoken line, quotation marks and all, with NO lead-in. The scene is the pool's. */
  opener: string
  /** ⭐ §8d.2 – `story` ONLY: the incident itself, heard by every route before its own branch.
   *  ⚠ PER VOICE, because the incident is told in her words: `court-four`'s four columns each carry
   *  their own. The 43 corpus rows carry none – their openers hold the whole story. */
  shared?: string
  branches: Record<SmallTalkStance, SmallTalkBranch>
}

/** ⭐⭐⭐ ONE SITUATION, IN UP TO FOUR VOICES. `voices` is `Partial` and the gap is the design rather
 *  than a hole: a voice nobody has written for this row simply cannot reach it, and the row is not in
 *  that girl's pool at all – which is the same completeness law the per-row `voice` field carried,
 *  said one level up. `reachableSituations` asks «does this row have HER column» where it used to ask
 *  «is this row hers».
 *
 *  ⚠ `id` IS PERSISTED (it is half of the row's `detail`), so the ids here are APPEND-ONLY: renaming
 *  one makes a live soft row in a shipped save unrenderable. Adding a voice column to an existing id
 *  is free; changing the id is a migration nobody wants to owe. */
export interface SmallTalkSituation {
  id: string
  subject: SmallTalkSubject
  /** ⭐ §5 – THE LIFE STAGE IS PART OF THE COPY KEY, and here it is a GATE rather than a variant
   *  table: an eleven-year-old, a college student and a thirty-year-old professional do not share a
   *  line, and the cleanest form of that is that they do not share a SITUATION. «I don't think I
   *  like the new place much» is not a thing a girl living at home says. The other half of the key
   *  is the delivery frame, which `presenceOf(stage)` reads off the same stage. */
  stages: readonly DiaryLifeStage[]
  /** §8d.5 – `null` is invented DOMESTIC detail, hers to make up and hers to keep consistent. A
   *  named fact is a COMPETITIVE claim and is checked against the career before this can be drawn. */
  fact: SmallTalkFact | null
  voices: Partial<Record<Temperament, SmallTalkVoiceEntry>>
}

/** ⭐⭐⭐ THE CATALOGUE, AS THE ENGINE SEES IT – **ALL FIFTY-ONE SITUATIONS, OUT OF ONE DOCUMENT.**
 *
 *  ⚠⚠ THIS FILE NO LONGER HOLDS A CATALOGUE OF ITS OWN, AND THAT IS ROUND 44's ARCHITECTURAL MOVE.
 *  `SMALL_TALK_SHIPPED` – the eight situations hand-written here since wave 2 – is DELETED, and those
 *  eight are rows `R45`–`R52` of `docs/specs/small-talk-corpus-2026-09.md`, brought up to four voices
 *  each. The reason is not tidiness. With a hand-written half and a generated half the catalogue had
 *  TWO SOURCES OF TRUTH IN TWO FORMATS, «fixed in the code, the document drifted» was one careless
 *  edit away permanently, and the round-trip pin could only cover the half it could parse. It covers
 *  all 51 now.
 *
 *  ⚠⚠ GENERATED AND NEVER HAND-EDITED. `world/smallTalkCorpus.ts` is written by
 *  `tools/small-talk-corpus-emit.ts` out of the document, and `tests/round44-corpus-roundtrip.test.ts`
 *  re-parses the document on every run and compares the committed module to it STRING FOR STRING.
 *  Authored strings retyped by an agent produce typos no test can catch, because the test compares
 *  against what was typed; generated, the document is the source of truth and a divergence is
 *  impossible rather than merely unlikely.
 *
 *  ⚠ THE EIGHT COME FIRST IN THE DOCUMENT AND IT IS NOT COSMETIC. `drawSmallTalkSubject` walks
 *  `SMALL_TALK_SUBJECTS`' own order rather than this array's, so the SUBJECT is stable under a
 *  re-ordering – but the situation draw is `pickInt` over the filtered pool, and that one reads
 *  POSITION. Leaving the eight where they already were leaves every existing career's situation draw
 *  where it already was, for the rows that were already there ahead of the corpus. Their document
 *  refs run last (`R45`–`R52`) precisely because renumbering `R1`–`R44` to make refs and position
 *  agree would move his own review's references to buy nothing.
 *
 *  ⚠ IDS ARE APPEND-ONLY and are asserted unique – the id is persisted as half of a `lifeLog` row's
 *  `detail`, so a renamed key orphans an old career's record of a conversation that really happened.
 *  The eight kept theirs verbatim through the move: `practice-clicked`, `line-call`, `march-entry`,
 *  `coach-real`, `watching-players`, `court-four`, `new-place`, `beat-her-conqueror`.
 *
 *  ⚠⚠ AND THE RULINGS THEIR BANNER COMMENTS CARRIED WENT WITH THEM, into each row's own prose in the
 *  document rather than into a changelog: `court-four`'s four-voice test and its named masculine
 *  exception, `practice-clicked`'s «a practice that felt easy is a MOOD, never a training gain»,
 *  `line-call`'s UNREPAIRED §8d.1 label collision («Tell her what worries us» is his most recent word
 *  and is not an agent's to edit), `new-place`'s lead-in that round 44 dropped with every other
 *  per-row lead-in, and `beat-her-conqueror`'s «temperament shapes the pattern, not the punctuation».
 *  A ruling deleted in a refactor is a ruling nobody can obey.
 *
 *  ⚠ SPEC §10's DELIVERY ORDER WAS HIS AND IS NOW SPENT: «Expand the situation catalogue only after
 *  the small set works.» The small set worked for two waves, so this is the expansion it licensed –
 *  recorded rather than dropped, because the sentence explains why the catalogue was thin and the
 *  answer to «why is it not thin any more» is that its own condition was met. */
export const SMALL_TALK_SITUATIONS: readonly SmallTalkSituation[] = SMALL_TALK_CORPUS

// =================================================================================================
// ⭐⭐⭐ ROUND 44 – THE FRAME POOL: THE SCENE SHE SAYS IT IN, WHICH IS NOT THE THING SHE SAYS
// =================================================================================================
//
// `docs/specs/the-frame-pool-2026-09.md`. The eighteen lines are the owner's, delivered 17.09
// against the brief in that file; four of them are marked DRAFT there and are his to rule on.
//
// ⚠⚠ WHY A POOL AND NOT A FRAME PER ROW. A situation owes ONE spoken line per voice, because
// presence changes «the scene the parent is standing in – never the sentence she says inside the
// quotation marks» (`PresenceCell`'s own note, and §D of the wave-3 presence pin asserts it). A
// frame written per row would be 43 × 2 frames nobody needs and would re-open the very law the pin
// holds; drawn from a pool keyed on PRESENCE ALONE, the quoted span is identical at both distances
// by construction.
//
// ⚠⚠ AND THE POOL IS KEYED ON PRESENCE ALONE – NEVER ON THE VOICE AND NEVER ON THE SUBJECT. His own
// ruling closed `bag-down`'s urgency question on exactly that condition: «these frames may never be
// bound to a voice», so the human variation stays variation instead of re-encoding `sunny` and
// `quiet` a second time. Subject-keying was tested and refused in the spec – he posed the most
// dangerous frame (`whole-message`) against a piece of good news, a worry and an observation and it
// carried all three – so a subject matrix would be premature complication.
//
// ⚠ AN `away` FRAME MAY NOT MENTION A ROOM, A FLATMATE, A LECTURE, A HOTEL OR A TOURNAMENT, because
// `away` is a LIFE STAGE and not a travel week: the same line has to work for a nineteen-year-old in
// a dorm and a twenty-eight-year-old in her own flat. What it may name is the channel and the
// distance. A `roof` frame may assume no time of day or meal that fails in some weeks.

/** One frame: the id that is persisted and compared, and the sentence that is rendered.
 *  ⚠⚠ THE ID IS THE THING THE EXCLUSION COMPARES AND THE THING THE SAVE HOLDS – never the rendered
 *  text. His ruling 1: «stable ids, and the exclusion compares IDS rather than rendered text». A
 *  comparison on the sentence would silently start repeating the moment a line was re-worded, and a
 *  re-worded line is exactly the kind of change this project ships. */
export interface SmallTalkFrame {
  id: string
  line: string
}

/** ⭐⭐⭐ NINE PER PRESENCE, HIS, 17.09 («бери обе» – he took both ninths).
 *
 *  ⚠⚠ THE IDS ARE PERSISTED AND THEREFORE APPEND-ONLY, and the two pools' ids must stay DISJOINT –
 *  which is not decoration. `recentFrames` reads the pool a stored id belongs to in order to honour
 *  «roof remembers roof, away remembers away» off a `lifeLog` that stores no presence; an id in both
 *  pools would make one row count as two different memories. The completeness pin asserts it.
 *
 *  ⭐ INDEX 0 OF EACH POOL IS THE FALLBACK FOR A ROW WRITTEN BEFORE v81, and the two were chosen
 *  rather than defaulted: `kettle` and `call-middle` are exactly the two frames `practice-clicked`
 *  shipped with, so a small-talk row already in a save renders BYTE-IDENTICALLY to what the owner
 *  saw. See `smallTalkFrameOf`.
 *
 *  ⚠ THE FIRST FIVE `roof` LINES AND THE FIRST `away` LINE ARE THE ONES THAT WERE INLINE IN
 *  `SMALL_TALK_SITUATIONS` UNTIL THIS ROUND – his words, moved and not edited – with ONE correction
 *  that is his own: `shoes` read «She was halfway out of her shoes and **already telling it**», and
 *  his note was «по-английски рассказывают `a story` или `someone something`, но не универсальное
 *  `it`». That correction is the reason this round carries a frozen-career re-stamp with it. */
export const SMALL_TALK_FRAMES: Record<BeatPresence, readonly SmallTalkFrame[]> = {
  roof: [
    { id: 'kettle', line: 'She put the kettle on.' },
    { id: 'bag-down', line: 'She was straight into it before her bag was down.' },
    { id: 'shoes', line: 'She was halfway out of her shoes when she started.' },
    { id: 'cupboard', line: 'She said it to the cupboard door, putting things away.' },
    { id: 'doorway', line: 'She started it in the doorway and finished it sitting down.' },
    { id: 'table', line: 'She stopped beside the kitchen table and said it.' },
    { id: 'sofa', line: 'She sat on the arm of the sofa and began.' },
    { id: 'phone-counter', line: 'She set her phone on the counter and started talking.' },
    // ⚠ THE ARCHITECT'S, AND A **DRAFT** – admissible only because he asked for a ninth («ну может
    // что-то добавишь? я за шутку =)») and then took both. Funny because it is TRUE – the ordinary
    // chaos of a kitchen – and never a verdict on what she is saying, which is the line a frame may
    // not cross: it wraps all 51 situations, worries included.
    { id: 'fridge', line: 'She talked at the open fridge for a while.' },
  ],
  away: [
    { id: 'call-middle', line: 'She mentioned it halfway through the call.' },
    { id: 'call-open', line: 'She opened the call with it.' },
    { id: 'call-late', line: 'She said it near the end of the call.' },
    { id: 'voice-note', line: 'She sent it in a voice note.' },
    { id: 'whole-message', line: 'She sent it as the whole message.' },
    { id: 'other-message', line: 'She added it to a message about something else.' },
    // ⚠ THE ARCHITECT'S, AND A **DRAFT** – written on his explicit instruction («бери свою замену»)
    // after `family-chat` was struck. It places the utterance in her ATTENTION rather than in a
    // channel, which is the axis the away pool was missing: `roof` has a sideways frame (`cupboard`)
    // and `away` had none. Distinct from `other-message` – that one is about the MESSAGE being about
    // something else, this is about HER being in the middle of something else.
    { id: 'mid-something', line: 'She said it in the middle of something else.' },
    { id: 'visit', line: 'She brought it up when she came by.' },
    // ⚠ THE ARCHITECT'S, AND A **DRAFT** – the second ninth, same ruling as `fridge`.
    { id: 'ceiling', line: 'She said it with the camera pointing at the ceiling.' },
  ],
}

/** ⭐⭐ HIS RULING 2 – **EACH PRESENCE POOL REMEMBERS ITS OWN LAST TWO**: «roof remembers roof, away
 *  remembers away», so two evenings at home separated by one call cannot repeat a frame from where
 *  he is sitting.
 *
 *  ⚠ TWO AND NOT ONE, which is `SMALL_TALK_EXCLUDE_LAST`'s own number one layer over – and the same
 *  reasoning: one stops the back-to-back repeat his complaint was about, two also stops a repeat
 *  inside the last three. Against nine frames it costs nothing; the pool is never emptied. */
export const SMALL_TALK_FRAME_EXCLUDE_LAST = 2

/** ⭐⭐⭐ THE FRAMES SHE HAS JUST BEEN GIVEN, IN **THIS** PRESENCE, newest first.
 *
 *  ⚠⚠ THE PRESENCE IS READ OFF THE FRAME ID AND NOT OFF THE ROW, because a `lifeLog` row stores no
 *  stage and no presence – only the week, the kind, the detail and (since v81) the frame. The two
 *  pools' ids are DISJOINT, so «which pool did this row draw from» is a property of the id itself.
 *  That is the whole reason the ids are asserted disjoint: an id in both pools would make one stored
 *  row count as a memory of both distances.
 *
 *  ⚠ A ROW WITH NO `frame` IS NOT A MEMORY. It predates the pool, so nothing was drawn and there is
 *  nothing to avoid repeating – it is skipped rather than counted, exactly as a legacy small-talk row
 *  is skipped by `withoutRecentSituations`.
 *
 *  ⚠ PURE AND ZERO-DRAW. */
function recentFrames(world: WorldState, presence: BeatPresence): string[] {
  const pool = new Set(SMALL_TALK_FRAMES[presence].map((f) => f.id))
  const out: string[] = []
  const log = lifeLogOf(world)
  for (let i = log.length - 1; i >= 0 && out.length < SMALL_TALK_FRAME_EXCLUDE_LAST; i--) {
    const frame = log[i].frame
    if (log[i].kind !== 'small-talk' || frame === undefined || !pool.has(frame)) continue
    out.push(frame)
  }
  return out
}

/** ⭐⭐⭐ WHICH FRAME, THIS WEEK, AT THIS DISTANCE – drawn ONCE, at the raise, and then PERSISTED.
 *
 *  ⚠⚠ THE STREAM IS PURPOSE-SCOPED AND IS NEVER MAIN (invariant 2). `rngFromSeed` is re-derived at
 *  this call site and persists nothing, so the frozen MAIN capture (41550 draws / `e6b0c709`,
 *  tests/condition.test.ts) cannot see this function and does not move.
 *
 *  ⚠⚠ AND THE RESULT IS STORED RATHER THAN RE-DERIVED, WHICH IS THE WHOLE OF THE SCHEMA MOVE. His
 *  ruling: a frame may not change after a save, a reload, **or the pool growing**. A derived frame
 *  survives the first two perfectly – the key carries the week – and fails the third: a pool that
 *  grows from nine to ten re-derives a different member for a beat already on screen. So `v81` puts
 *  the chosen id on the row. ⚠ The same reasoning applies to the EXCLUSION: it is read at the draw
 *  and never afterwards, so a later row cannot re-word an earlier card.
 *
 *  ⚠ THE POOL IS NEVER EMPTIED. Nine frames against an exclusion of two leaves seven, so the filter
 *  cannot starve – but the `length === 0` guard is kept anyway, because a pool shrunk by a future
 *  edit must degrade to «repeat a frame» rather than to `undefined`. */
function drawSmallTalkFrame(world: WorldState, presence: BeatPresence): string {
  const banned = new Set(recentFrames(world, presence))
  const pool = SMALL_TALK_FRAMES[presence].filter((f) => !banned.has(f.id))
  const live = pool.length > 0 ? pool : SMALL_TALK_FRAMES[presence]
  const at = pickInt(rngFromSeed(`${world.seed}:smalltalk:frame:${world.week}`), 0, live.length - 1)
  return live[at].id
}

/** ⭐⭐ THE FRAME A ROW WAS GIVEN, FOR RENDERING. `null` is a row written before v81, and the answer
 *  for one is the FIRST line of the presence's pool – which is a chosen fallback and not a neutral
 *  stand-in: `kettle` and `call-middle` are exactly the two frames the shipped catalogue wrapped
 *  `practice-clicked` in, so every small-talk row already sitting in a save renders byte-identically
 *  to what the owner read on the week it was raised.
 *
 *  ⚠ A FRAME ID THAT NAMES NOTHING THROWS, like every other unreadable detail in this file – the ids
 *  are append-only for the same reason the situation ids are. */
function smallTalkFrameOf(frame: string | undefined, presence: BeatPresence): string {
  const pool = SMALL_TALK_FRAMES[presence]
  if (frame === undefined) return pool[0].line
  const found = pool.find((f) => f.id === frame)
  if (found === undefined) throw new Error(`A small-talk row names no ${presence} frame: ${frame}`)
  return found.line
}

/** ⭐⭐ THE MOOD WEIGHTS (spec §2), AND THEY ARE WEIGHTS RATHER THAN A MAPPING – which is the whole
 *  mechanical change of that section. «A heavy week leans toward `worry` but can still produce a
 *  tired `observation` or a small `decision`; a bright week leans toward `good-news` or `story`; an
 *  ordinary week leans toward `curiosity`, `decision` or `observation`.»
 *
 *  ⚠⚠ THE NUMBERS ARE A **DRAFT** AND SPEC §12.1 NAMES THEM AS NEEDING HIS WORD («the subject
 *  taxonomy and the mood weights – the one mechanical choice»). The shape is his; the integers are
 *  the build's, chosen to say exactly the three sentences above and nothing more. They are in this
 *  file and not in `ECONOMY` on purpose: `ECONOMY` is the balance surface and invariant 5 governs it,
 *  and this is narrative texture that moves no number a bench can measure.
 *
 *  ⚠ NO ZERO ANYWHERE, and that is the design rather than caution: a zero would be the hard mapping
 *  back in one cell, and «can still produce» is what §2 asks for. */
/* ⚠ EXPORTED FOR THE CORPUS BENCH AND FOR NOTHING ELSE (round 43 #8(a), the corpus spec's §P2.6:
 *  «reads the catalogue and the selection weights»). K1 reports a WEIGHTED pool size per cell, which
 *  is a property of these integers and of the catalogue together – a bench that re-typed them would
 *  be measuring its own copy, which is the one way that number can be confidently wrong. Nothing in
 *  `src/` reads it but the draw below. */
export const SMALL_TALK_SUBJECT_WEIGHT: Record<MoodRegister, Record<SmallTalkSubject, number>> = {
  low: { worry: 5, observation: 2, decision: 2, story: 1, curiosity: 1, 'good-news': 1 },
  bright: { 'good-news': 5, story: 4, observation: 2, curiosity: 2, decision: 1, worry: 1 },
  level: { curiosity: 3, decision: 3, observation: 3, story: 2, 'good-news': 2, worry: 1 },
}

/** ⭐⭐⭐ WHICH SITUATIONS THIS GIRL, AT THIS STAGE, ON THIS CAREER, COULD ACTUALLY BRING. The one
 *  place the three gates meet, and the one road to a drawable situation.
 *
 *  ⚠⚠ THE FACT IS ASKED HERE AND NOWHERE ELSE, WHICH IS WHAT MAKES §8d.5 A PROPERTY. A situation
 *  whose competitive claim is false is not in the returned list, so it cannot be drawn, so no code
 *  path can render it – rather than being filtered at the draw and left renderable by a second
 *  caller. `tests/round42-small-talk-exchange.test.ts` §D is the pin, and it mutates the gate away to
 *  prove the pin bites.
 *
 *  ⚠ PURE AND ZERO-DRAW. Nothing here takes an `Rng`, so the frozen MAIN capture cannot see it. */
export function reachableSituations(world: WorldState, voice: Temperament, stage: DiaryLifeStage): SmallTalkSituation[] {
  // ⚠ ROUND 44 – «DOES THIS ROW HAVE **HER** COLUMN», where it used to ask «is this row hers». The
  // gate is unchanged in strength: a voice nobody wrote for a situation still cannot reach it. What
  // changed is that a situation can now be written for more than one, which is the corpus's §2 and
  // the whole reason a `fiery` girl no longer has one conversation in her life.
  return SMALL_TALK_SITUATIONS.filter(
    (s) =>
      s.voices[voice] !== undefined && s.stages.includes(stage) && (s.fact === null || SMALL_TALK_FACT[s.fact](world)),
  )
}

/** ⭐⭐ ROUND 43 #8(a) – HOW MANY OF HER LAST CONVERSATIONS ARE OFF THE TABLE. Two, and the number is
 *  the corpus spec's own (`docs/specs/small-talk-corpus-2026-09.md` §P2.5, «last-two exclusion when
 *  ≥3 reachable»): it is what makes «the same line twice running» impossible AND makes a repeat
 *  inside the last three impossible, which is the pair the bench's K2 and K3 measure.
 *
 *  ⚠ IT IS A COUNT OF ROWS AND NOT A WINDOW OF WEEKS, deliberately. `smallTalkPerWeek` is 0.08 at a
 *  close bond under a cap of four a season, so two conversations can sit a season apart – a window
 *  wide enough to hold them would have to be a season wide, and a window that wide is just «the last
 *  two» with an extra number in it that can rot. */
export const SMALL_TALK_EXCLUDE_LAST = 2

/** ⭐⭐⭐ ROUND 43 #8(a) – THE SITUATIONS SHE HAS JUST BROUGHT, TAKEN OUT OF THE POOL, AND **THE POOL
 *  IS NEVER EMPTIED**.
 *
 *  ⚠⚠ THE DEGRADATION IS THE WHOLE OF THE CARE HERE, and it runs OLDEST-FIRST. `reachableSituations`
 *  narrows by her VOICE and her STAGE and a career has one voice for life, so what a single girl can
 *  reach is one row of a 4×4 grid – `deep` at college holds TWO situations against four conversations
 *  a season. Excluding two of two would leave nothing, `rollSmallTalk` would fall through to the
 *  legacy generic opener, and the fix would have made the card WORSE than the repeat it was written
 *  to stop. So the exclusions are given up one at a time, the oldest going first, and the most recent
 *  one – the one his complaint is actually about – is the last to be surrendered and is surrendered
 *  only when it is the only thing she can reach at all.
 *
 *  ⚠ IT READS THE LOG AND WRITES NOTHING. `raiseLifeBeat` already stores `{ week, kind, detail }` and
 *  the log is append-only and never pruned, so the history this needs is ALREADY IN EVERY SAVE: no
 *  schema bump, no migration, no golden fixture, no new field. `coachSinceWeek`'s own doctrine
 *  (world/coachMarket.ts), asked of a different question.
 *
 *  ⚠ THE MATCH IS ON THE STORED `detail` STRING, not on the id alone. `detail` is exactly what the
 *  row holds (`smallTalkDetailFor` – `'<subject>:<id>'`), so nothing here re-derives a fact that
 *  could have moved, and a LEGACY row (a bare subject, no colon) matches no situation and is simply
 *  not an exclusion – which is right: it named no situation to repeat.
 *
 *  ⚠ PURE AND ZERO-DRAW. Nothing here takes an `Rng`, and it adds no stream key: the two keys
 *  `rollSmallTalk` derives are unchanged in name, in number and in order. */
export function withoutRecentSituations(
  world: WorldState,
  reachable: readonly SmallTalkSituation[],
): SmallTalkSituation[] {
  if (reachable.length === 0) return []
  const recent: string[] = []
  const log = lifeLogOf(world)
  for (let i = log.length - 1; i >= 0 && recent.length < SMALL_TALK_EXCLUDE_LAST; i--) {
    if (log[i].kind === 'small-talk') recent.push(log[i].detail)
  }
  // `recent` is newest-first, so popping the TAIL gives up the oldest exclusion first.
  while (recent.length > 0) {
    const banned = new Set(recent)
    const kept = reachable.filter((s) => !banned.has(smallTalkDetailFor(s.subject, s.id)))
    if (kept.length > 0) return kept
    recent.pop()
  }
  return [...reachable]
}

/** THE ROW'S OWN DETAIL, AND IT IS TWO FIELDS – `'fork-psy'`'s shape («`'<register>:<driver>'`») for
 *  `'fork-psy'`'s reason: the row must stay reconstructible for the life of the career, and a
 *  re-derivation from a later world could hand the parent a different small thing from the one she
 *  came with. The subject half is what the card's frame reads; the situation half is the copy. */
function smallTalkDetailFor(subject: SmallTalkSubject, id: string): string {
  return `${subject}:${id}`
}

/** ⭐⭐ READING IT BACK. `null` is a LEGACY row – one of the three shipped subjects, no colon, no
 *  situation – and the legacy pool is what renders it. That is the whole of the save-compat story:
 *  no migration, no schema bump, the SHAPE of the string is the discriminator.
 *
 *  ⚠ IT TAKES THE VOICE BECAUSE A SITUATION IS PER-VOICE. The row records the subject and the id;
 *  which of the (up to four) columns of that id is hers is her birth temperament, which is a fact of
 *  the world and never of the row – exactly as `lifeBeatSaid` has always read the voice.
 *
 *  ⚠ A ROW NAMING A SITUATION THAT NO LONGER EXISTS THROWS, like every other unreadable detail in
 *  this file. That is why the ids are append-only: see `SmallTalkSituation.id`. */
function smallTalkVoiceOf(detail: string, voice: Temperament): SmallTalkVoiceEntry | null {
  const cut = detail.indexOf(':')
  if (cut < 0) return null
  const subject = detail.slice(0, cut)
  const id = detail.slice(cut + 1)
  const found = SMALL_TALK_SITUATIONS.find((s) => s.subject === subject && s.id === id)
  const column = found?.voices[voice]
  if (column === undefined) throw new Error(`A small-talk row names no situation: ${detail} (${voice})`)
  return column
}

/** ⭐⭐⭐ ROUND 44 – HER OPENER, WHICH IS A **POOL FRAME JOINED TO ONE SPOKEN PAYLOAD**.
 *
 *  ⚠⚠ IT NO LONGER THROWS FOR A MISSING FRAME, AND THAT IS THE SHAPE CHANGE RATHER THAN A LOOSENING.
 *  Until this round a situation carried the frame and the quotation glued into one string per
 *  presence, so a cell nobody had written was a hole the renderer had to refuse; now the payload is
 *  one string that serves both distances and the scene comes from a pool that is total over
 *  presence. There is no cell left to be missing. `stages` still gates which situations she can
 *  reach at all – that clause did not move.
 *
 *  ⭐ AND THE LAW IS NOW A PROPERTY: the quoted span is identical at `roof` and at `away` because
 *  there is only one of it (`tests/wave3-presence.test.ts` §D). */
function smallTalkOpener(column: SmallTalkVoiceEntry, presence: BeatPresence, frame: string | undefined): string {
  return `${smallTalkFrameOf(frame, presence)} ${column.opener}`
}

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
 *  inside the quotation marks.
 *
 *  ⭐⭐⭐ RE-CUT BY v75 T6 (12.09) AGAINST THE BIBLE, AND THE FOUR FINDINGS ARE RECORDED HERE RATHER
 *  THAN QUIETLY REPAIRED, because each of them is a rule a later writer will meet again:
 *
 *  1. ⚠ THE NARRATOR'S ADVERB. «plainly», «straight out», «flatly» (twice) and «for once she was not
 *     in a hurry» all interpreted her DELIVERY, which the craft law bans in as many words – «short
 *     words ARE the tiredness; a frame that says so has failed». Every frame now carries a fact or an
 *     object the parent saw (a short call, a bag put down slowly, a bag open on the floor) and lets it
 *     do the work. ⚠ `fiery`'s slow bag is KEPT BYTE-IDENTICAL: it is an observed action, not a manner
 *     word, and the fire gone flat is shown by it rather than named.
 *  2. ⚠⚠ THE UNLICENSED DURATION, AND IT WAS FALSE ON A REACHABLE WEEK. All four told-late quotes said
 *     «a while ago» / «for a while», and `ENDED_DRY` said it a fifth time – but ruling A's own
 *     collision (`endedWeek === knownWeek`, which that ruling argues is a certainty across a census)
 *     falls through to the told-late branch with ZERO weeks between the ending and the telling. A
 *     duration is a first-tier consequential fact and the world does not license this one. What the
 *     told-late column may assert instead is what is true on BOTH paths: he is hearing of the person
 *     and of the ending in one breath, and she is saying why she had not mentioned it.
 *  3. ⚠⚠ TWO `deep` FRAMES WERE BYTE-IDENTICAL TO `MET_HER_LINE.deep.open`'s – «She waited until the
 *     house was quiet, then said it once.» and «She called late, when the day was done, and said it
 *     once.» So one girl's career staged the same scene for «there is someone» and for «it is over»,
 *     which is the one pairing in this file that must not share a sentence. Both are new here.
 *  4. ⚠ `quiet`'s away frame said «She wrote to say…». The channel palette rule is «the corpus avoids
 *     «wrote» entirely»; it is a text now, with the arrangements first and the news under them.
 *
 *  ⭐⭐ AND THE CONTRACTION SPLIT IN `deep` IS DERIVED, NOT PREFERRED. §Contractions licenses `deep`
 *  «lightly», and T17's precedent says WHERE: her contraction cracks under the WORN kind of breakage
 *  (`HER_STOP_LINE.deep.worn` – «I'm tired. Not this week. All of it.»), while her `own` column stays
 *  formal. The told-now card is inside that window BY CONSTRUCTION – the shock lands −22/−34 on a
 *  baseline of 70 (lifted 75), so her spirit is 36-53 and `worn > 0.15` is `spirit < 59.5` – so her
 *  told-now line contracts. The told-late card carries NO such guarantee (the shock cleared seasons
 *  before `knownWeek` on the ordinary path), so her told-late line stays uncontracted. One rule, two
 *  columns, and the difference is a fact about the week rather than an editor's ear.
 *
 *  ⚠⚠ AND THAT SAME ARITHMETIC IS WHY THIS POOL IS WRITTEN AT TWO DIFFERENT REGISTERS THOUGH IT READS
 *  NONE. `lifeBeatSaid` hands this card no `MoodRegister` (see the case below), so the composition
 *  rule's SPIRIT axis has to be satisfied by the writing rather than by a lookup. TOLD-NOW is the low
 *  register by construction, for the arithmetic above, and is written to it. TOLD-LATE is not: on the
 *  ordinary path the ending is seasons old and her week can be bright, level or low, and only the
 *  collision case lands it in a flat week. So every told-late line is written REGISTER-NEUTRAL – true
 *  of a girl who has recovered and of one who has not – and a told-late line that leaned on her being
 *  flat would be this pool contradicting the Mood word beside it. */
const ENDED_HER_LINE: Record<Temperament, Record<EndsRegister, PresenceCell>> = {
  sunny: {
    'told-now': {
      roof: 'She said it at the table and stayed sitting there afterwards. "It\'s over. I\'m alright. I will be, anyway."',
      away: 'She called that evening and said it before anything else. "It\'s over. I\'m alright. I will be, anyway."',
    },
    'told-late': {
      roof: 'She raised it herself on an ordinary evening, out of nothing. "There was someone. It\'s finished, and I should have said."',
      away: 'She came home for the weekend and said it before she went back. "There was someone. It\'s finished, and I should have said."',
    },
  },
  fiery: {
    'told-now': {
      roof: 'She came in, put her bag down slowly, and sat. "It\'s finished. No, I don\'t want to go through it."',
      away: 'She rang, and it was a short call. "It\'s finished. No, I don\'t want to go through it."',
    },
    'told-late': {
      roof: 'She said it on her way through the kitchen and did not stop. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
      away: 'She put it in a voice note about something else entirely. "There was someone. It\'s done. I wasn\'t going to make a thing of it."',
    },
  },
  quiet: {
    'told-now': {
      roof: 'She took her racquets out of the hall and re-stacked them by the door. "The weekend\'s free now. That\'s finished."',
      away: 'She texted the week\'s plans through, and this was under them. "The weekend\'s free now. That\'s finished."',
    },
    'told-late': {
      roof: 'She had the weekend bag open on the floor when she said it. "There was someone. It didn\'t need saying at the time."',
      away: 'She put it in the family chat, after the travel dates were settled. "There was someone. It didn\'t need saying at the time."',
    },
  },
  deep: {
    'told-now': {
      roof: 'She let the week finish before she said anything at all. "It\'s over. I\'d rather not say more."',
      away: 'She let the message sit a while, and answered it with this. "It\'s over. I\'d rather not say more."',
    },
    'told-late': {
      roof: 'She said it to the window rather than to the room. "There was someone. It is over. That was mine to keep."',
      away: 'She said it at the door on a visit home, already leaving. "There was someone. It is over. That was mine to keep."',
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
// ⭐⭐ RE-CUT BY v75 T6, AND BOTH ROWS MOVED FOR A REASON THE COMMENT ABOVE HAD ALREADY WRITTEN DOWN.
// ⚠ `told-now` SAID HOW THE NEWS SURFACED («She did not say so, and the house worked it out»), which
// is exactly what this pool's own note says it does NOT do – that is `MET_DRY`'s job, and closing on
// the house a third time is the repetition the 11.09 вычитка took out of `MET_DRY` itself. It states
// what the WEEK HOLDS now, which is the loss: she is carrying on, and not talking about it.
// ⚠⚠ `told-late` LOST «for a while» – the unlicensed duration, false on ruling A's collision week.
// See finding 2 in `ENDED_HER_LINE`'s note. «Already over» is true on both paths by construction:
// `rollEnds` writes `endedWeek` before `deliverKnownPartner` reads it, in the same tick.
const ENDED_DRY: Record<EndsRegister, string> = {
  'told-now': 'It is over. She is getting on with the week and not talking about it.',
  'told-late': 'There was someone in her life, and it is already over. Nobody was told at the time.',
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
    // ⚠ RE-CUT 12.09, HIS WORD ON THE AXIS («давай попробуем»): the told-late headings used to state
    // the read as RECOUNTING («would rather not go into it» / «is not done talking about it») while
    // both registers' answers price PRESENCE – the reader argued about talking and the buttons
    // offered company. Both cells (and the two told-late feed rows) now speak the presence axis the
    // told-now pair already speaks; e2e pins the shared prefix, so the pin survived by construction.
    space: 'There was someone, it is already over, and she wants the room to herself',
    // ⚠⚠ RE-CUT BY v75 T6. It read «and she has been round more since», and that cell asserted TWO
    // things the world does not hold: a count of VISITS (the sim models none, at any stage) and a
    // SPAN, on a card raised in the very week the news lands, when «since» is empty. It is also the
    // one reading that cannot survive the stages – a thirty-year-old in her own household is not
    // «round». The read itself is a persisted draw and IS licensed, so what the heading carries now
    // is the read and nothing round it, in the parent's own frame.
    company: 'There was someone, it is already over, and she does not want to be on her own with it',
  },
}

// =================================================================================================
// 3f. «LEARNING TO LISTEN» – ⚠⚠ THE SAME NEWS, READ PLAINLY (wave 5, T6). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// `docs/specs/the-psychologists-year-2026-09.md` §2, the «Learning to listen» row: on a week the
// family is paying a psychologist whose chosen year is `'listen'`, one uniform per read-bearing beat
// against `ECONOMY.psychologist.listenClarity[rung]` decides whether the card's HEADING and the KEPT
// FEED ROW say plainly what she wants. Success is the LEGIBLE wording below; failure is the standing
// wording, byte for byte, which is why not one shipped string moved for this step.
//
// ⚠⚠⚠ HE COACHES THE PARENT AND NEVER REPORTS HER SESSIONS – the owner's re-cut of 09.09, and the
// gravest wording failure this section can produce. Every legible line below is written as the
// PARENT'S OWN TRAINED READING of his daughter. A line of the form «the psychologist says she wants…»
// would be a confidentiality leak AND a category error: what the seat sells is an ear, not a report,
// and the spec's own sentence for the focus is «He is teaching you to hear what she does not say».
// Not one string in this file may name him, quote him or attribute a reading to him.
//
// ⚠⚠ AND THE BOND ARITHMETIC IS UNTOUCHED ON BOTH SIDES OF THE COIN. The deltas, her drawn `wants`,
// the space-vs-company read and the priced option set are the same bytes with the focus on or off –
// `lifeBeatOptionsFor` never sees this value and has no parameter that could carry it. That is what
// makes the focus a communication coach rather than a purchase (the spec: «never a purchase and
// never a leak of her sessions (`bond` untouched)»), and it is pinned by deep-equalling the priced
// sets across the toggle rather than by reading this comment.
//
// ⚠⚠ THE LEGIBLE POOLS ARE THE FIRST PARENT'S-FRAME COPY IN THIS FILE INDEXED BY TEMPERAMENT, and
// the fence it extends is named here rather than quietly crossed. `MET_MENTION`'s note states the
// standing rule – «It is the PARENT'S narration and the fence keeps temperament out of that –
// `HER_LINE` and `MET_HER_LINE` are the only pools in this file a girl's voice indexes» (with
// `ENDED_HER_LINE` the third since wave 4). What is being bought HERE is a reading of THIS daughter:
// the legible half of the card is the parent saying what he has learned about how she asks for
// things, and a reading that did not know which girl it was about would be exactly the generic
// wording the focus exists to replace. The AMBIGUOUS pools are untouched and the fence still holds
// over every one of them.
//
// ⚠ SO EVERY LEGIBLE CELL IS A RULE ABOUT HER, NEVER A CLAIM ABOUT THIS WEEK'S TELLING. The heading
// is carried at EVERY bond band (the §3e banner), and on the dry rung she said nothing at all – the
// house found out. A legible frame that read «she closed the subject fast» would therefore be FALSE
// on a third of the ladder while looking careful. What the frames name instead is her standing habit
// (`world.temperament` is a persisted fact of the world) and her drawn read (a persisted draw), and
// both are true whether or not she opened her mouth this week.
//
// ⚠⚠ AND THAT RULE IS A LINT RATHER THAN THIS SENTENCE, because the first draft broke it in SIX
// places while this comment claimed it did not – four headings and two rows, «the easy telling is
// the whole of it», «it was given to us to keep», «we heard it the way she meant it». A note that
// claims more than the copy delivers is the shape ruling C rejected, one layer over. The sweep is in
// `tests/wave5-psychologist-listen.test.ts` §B beside the confidentiality one, in the `BANNED_TAILS`
// style: a list, all FORTY cells, and a positive control first. ⚠ Forty and not forty-eight since
// T6b: ruling O took the legible told-now kept row out (`ENDED_EVENT_HEARD`, 16 → 8).
//
// ⚠ AND NOT ONE OF THEM NAMES AN ANSWER, which is `ENDED_HEADING`'s own rule inherited whole: «what
// she wants» is what the parent can see; which of the four things to say about it is his, and a
// heading that recommended one would be the meter this layer refuses to build, spelled in words.

/** ⭐⭐⭐ THE COIN – DID THE PARENT READ HER PLAINLY, THIS BEAT. One uniform on
 *  `seed:psy:listen:<kind>:<week>` against `ECONOMY.psychologist.listenClarity[rung]` (the spec §2's
 *  ruled 0.6 / 0.8 / 0.95).
 *
 *  ⚠⚠ THE KIND IS IN THE KEY, which is §1f's one-value-per-key law satisfied by construction rather
 *  than by luck: two read-bearing beats CAN share a week – an ending raised in §8 and a delivery
 *  raised in §6 of the same tick – and a key without the kind in it would hand them one value and one
 *  outcome for two unrelated pieces of news.
 *
 *  ⚠ THE WEEK IS THE RAISE WEEK, never an episode's date and never a later `world.week`: the row
 *  carries its own `week` (`LifeBeatRecord`), so the value is reconstructible for the life of the
 *  career even though nothing ever re-derives it (the stamp is written once – ruling E).
 *
 *  ⚠ (seed, calendar, kind)-KEYED AND NEVER (seed, choice)-KEYED, like every stream in this file.
 *  MAIN is not reached, so the frozen capture cannot see this. ⚠ THE RUNG IS A PARAMETER,
 *  `drawEndsRead`'s own primitives doctrine – a census can sweep the ladder without posing a world. */
export function drawListenHeard(seed: string, kind: LifeBeatKind, week: number, rung: 0 | 1 | 2): boolean {
  return rngFromSeed(`${seed}:psy:listen:${kind}:${week}`)() < ECONOMY.psychologist.listenClarity[rung]
}

/** ⭐⭐ THE SEAT'S ANSWER FOR THIS WEEK'S RAISE, or `null` when nobody is teaching him to listen.
 *
 *  ⚠⚠ A `null` HERE IS **ZERO DRAWS**, not a discarded one – `arrivalEligible`'s own law, and the
 *  count-keys net is what holds it. `psychologistWorkingRung` short-circuits on three questions in
 *  one (not hired · hired for a different year · stood down by a college freeze or a booked family
 *  week), and the stream is not derived until all three have been answered.
 *
 *  ⚠⚠ IT ASKS THE BILLING PREDICATE THROUGH THAT HELPER, which is ruling J: the working week IS the
 *  billing week, so a college freeze and a booked family week stand this down exactly as they stand
 *  the invoice down. Pay nothing, receive nothing.
 *
 *  ⚠ AND IT IMPORTS THE SEAT DIRECTLY, the masseur's own way (`world/medical.ts`), rather than taking
 *  the fact as a parameter the way `accrueSpirit` must. Measured rather than assumed, on the tree's
 *  own value-import graph: `world/psychologist.ts` reaches THIS module by **ZERO** paths (the same
 *  walk that finds seven from it to `engine/development.ts`, which is why T5's site could not ask).
 *  The rule is the college arrow, not «`spirit.ts` is special» – the wave-5 rulings, J as corrected
 *  by T4b. */
function listenHeardNow(world: WorldState, kind: LifeBeatKind): boolean | null {
  const rung = psychologistWorkingRung(world, 'listen')
  if (rung === undefined) return null
  return drawListenHeard(world.seed, kind, world.week, rung)
}

/** ⭐ WHOSE READING THIS IS – the two facts a legible frame cannot be assembled without.
 *
 *  ⚠⚠ ONE PARAMETER RATHER THAN THREE DEFAULTED ONES, AND THAT IS THE COMPLETENESS LAW PAYING FOR
 *  ITSELF. `lifeBeatSaid`'s later axes are positional with shipped defaults, and that idiom is right
 *  where the default is a real reading (`'told-now'`, `'space'`, `'open'`). Here it would be a trap:
 *  a defaulted `voice` would let a caller ask for the legible frame without saying which girl it is
 *  about, and silently hand a `deep` girl a `sunny` girl's reading – the exact silent-fallback defect
 *  §5b's completeness pin exists to make impossible. `null` is the standing ambiguous frame; anything
 *  else must name the voice, so there is no cell a caller can reach by forgetting. */
export interface HeardRead {
  /** her BIRTH temperament (`world.temperament`) – §0.2's fence: the voices read birth, never the
   *  expressed reading T7 builds. What the parent learned is how THIS daughter asks for things, and
   *  who she is does not change. */
  voice: Temperament
  /** her drawn `wants` for the episode in hand – read by `'met'` only, `'ended'` reads `read`. */
  wants: LoveEpisode['wants']
}

/** ⭐⭐ `'met'` READ PLAINLY, BY VOICE, BY WHAT SHE ASKED FOR – 8 drafts.
 *
 *  ⚠ THE STANDING HEADING CARRIES NO READ AT ALL (`MET_HEADING`: three frames on the bond ladder,
 *  and not one of them says what she wants done with the news). The `wants` axis reaches the standing
 *  card through her LINE and through the kept row; a parent who was not listening pays for it over
 *  months. These eight are what a parent who was taught to listen hears instead: the same news, with
 *  the ask said out loud.
 *
 *  ⚠ NO BOND COLUMN, DELIBERATELY, and the standing pool's own argument is the reason. The read is
 *  drawn at every band and the flip prices a cold home's four answers exactly as it prices a close
 *  home's, so a legible frame only half the ladder could read would be the hidden number `MET_DRY`
 *  refuses to be. What the band governs is HOW the news arrived, and that is carried by the line
 *  under this frame, which does still move with it.
 *
 *  The bible each voice is read through, in a phrase: `sunny` gives context unasked, so the ask lives
 *  in what she left out; `fiery` reaches the verdict first, so the ask is where she drew the line;
 *  `quiet` puts a thing down beside something ordinary, so the ask is in the placing; `deep` gives a
 *  thing its exact size, so the ask is in what she did not add. */
const MET_HEADING_HEARD: Record<Temperament, Record<LoveEpisode['wants'], string>> = {
  sunny: {
    open: 'There is someone, and there is no ask hidden in it – she does not mind who knows',
    private: 'There is someone, and the ask is the part she leaves out – she wants it kept between us',
  },
  fiery: {
    open: 'There is someone, and she has drawn no line round it – she does not mind who knows',
    private: 'There is someone, and she has drawn a line round it – she wants it to go no further',
  },
  quiet: {
    open: 'There is someone, and it is not a thing she is keeping – it can be ordinary news',
    private: 'There is someone, and it is to stay where it is – with us, and no further',
  },
  deep: {
    open: 'There is someone, and that is the whole of it – she is not asking us to keep anything',
    private: 'There is someone, and it is hers to keep – never ours to pass on',
  },
}

/** ⭐⭐ `'ended'` READ PLAINLY, BY VOICE, BY REGISTER, BY HER READ – 16 drafts, and the shape is
 *  `ENDED_HER_LINE`'s (voice × register × a two-member leaf) rather than a new one.
 *
 *  ⚠⚠ THE STANDING HEADING ALREADY NAMES THE READ, so what legibility adds here is NOT the fact – it
 *  is the RULE that stops the fact being disbelieved. Her line and her read point opposite ways often
 *  enough that wave 4 had to lint her pool read-NEUTRAL (the wave-4 rulings, J): «No, I don't want to
 *  go through it» is about RECOUNTING and says nothing about PRESENCE, and a parent who has not been
 *  taught the difference hears a door closing. Each cell below names the surface that misleads and
 *  then the read, so the card stops arguing with itself for a parent who was coached.
 *
 *  ⚠ THE TAIL OF EVERY CELL IS THE STANDING POOL'S OWN WORDING OF THE READ, kept deliberately: the
 *  fact is the same fact, and inventing a second way to say «she wants the room to herself» would put
 *  two sentences into the album for one draw. What is new is the clause in front of it.
 *
 *  ⚠ AND NOT ONE OF THE SIXTEEN CLAIMS SHE SPOKE THIS WEEK – see the §3f banner. On the dry rung
 *  nobody was told; the rule named in each clause is a standing fact about her, and it is as true of
 *  a week she said nothing as of a week she said everything. */
const ENDED_HEADING_HEARD: Record<Temperament, Record<EndsRegister, Record<EndsRead, string>>> = {
  sunny: {
    'told-now': {
      space: 'It is over. Being alright comes first with her, and the asking after – she wants the room to herself',
      company: 'It is over. Being alright comes first with her, and the asking after – she does not want to be on her own with it',
    },
    'told-late': {
      space: 'There was someone and it is already over. With her the alright comes first – she wants the room to herself',
      company: 'There was someone and it is already over. With her the alright comes first – she does not want to be on her own with it',
    },
  },
  fiery: {
    'told-now': {
      space: 'It is over. A subject shut fast is shut with her – she wants the room to herself',
      company: 'It is over. A subject shut fast is not a door shut, with her – she does not want to be on her own with it',
    },
    'told-late': {
      space: 'There was someone and it is already over. A shut subject is shut with her – she wants the room to herself',
      company: 'There was someone and it is already over. A shut subject is not a shut door with her – she does not want to be on her own with it',
    },
  },
  quiet: {
    'told-now': {
      space: 'It is over. The arrangements are where she puts herself – and what she wants is the room to herself',
      company: 'It is over. The arrangements are where she puts herself – and what she wants is somebody in the room',
    },
    'told-late': {
      space: 'There was someone and it is already over. The arrangements always come first with her – she wants the room to herself',
      company: 'There was someone and it is already over. The arrangements always come first with her – she wants somebody in the room',
    },
  },
  deep: {
    'told-now': {
      space: 'It is over. With her the size of a thing is never the size of the words – she wants the room to herself',
      company: 'It is over. With her the size of a thing is never the size of the words – she does not want to be on her own with it',
    },
    'told-late': {
      space: 'There was someone and it is already over. Few words are not a small thing with her – she wants the room to herself',
      company: 'There was someone and it is already over. Few words are not a small thing with her – she wants somebody in the room',
    },
  },
}

/** ⭐ THE FRAME, ONE FUNCTION, so «which heading does a card wear» has exactly one spelling and the
 *  ambiguous arm can be proven byte-identical to what shipped. `null` is the standing frame.
 *
 *  ⭐⭐⭐ v77 T6 – AND THE THIRD ARGUMENT IS THE OVERTAKE, ON THE **STANDING** ARM AND NOWHERE ELSE.
 *  `heard` is tested FIRST and that branch order is the ruling rather than a style: the legible pool
 *  is what a parent PAID a psychologist to hear, and a headline frame placed in front of it would
 *  take back, on exactly the weeks the overtake fires, the read he bought (ruling O's own shape at
 *  `endedKeptRow`, one scene over, argued the same way). So the coached card is byte-identical to
 *  what shipped, and the new line is what the STANDING card says – which is also the brief's literal
 *  boundary, «a headline-register intro variant on the standing prompt».
 *
 *  ⚠ THE DEFAULT IS `false`, WHICH IS THE SHIPPED READING AND NOT A NEUTRAL STAND-IN: every caller
 *  that passes nothing gets exactly the frame this function returned before the overtake existed.
 *  `lifeBeatHeading`'s own later parameters are defaulted for that reason and this is the fourth. */
function metHeadingFor(band: BondBand, heard: HeardRead | null, fromHeadline = false): string {
  if (heard !== null) return MET_HEADING_HEARD[heard.voice][heard.wants]
  return fromHeadline ? MET_HEADING_HEADLINE : MET_HEADING[metRegisterOf(band)]
}

function endedHeadingFor(endsRegister: EndsRegister, read: EndsRead, heard: HeardRead | null): string {
  return heard === null
    ? ENDED_HEADING[endsRegister][read]
    : ENDED_HEADING_HEARD[heard.voice][endsRegister][read]
}

// =================================================================================================
// 3g. `'engaged'` – THE WEEK SHE SAYS SHE IS GETTING MARRIED (the wedding, wave 7: T2).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// SHE ANNOUNCES – §4a's law at the layer's biggest ask so far: no parent menu opened her decision,
// and what the parent holds is a reaction. The pool is `ENDED_HER_LINE`'s shape one register
// smaller: one cell per voice (no register axis – the announcement is one scene, and unlike an
// ending it carries no told-now/told-late split, because `rollWedding` raises it the week she
// decides and there is nothing to hear about late), in both presences, plus the dry card for a
// `strained`/`cold` home and one heading.
//
// ⚠ THE QUOTED SPAN IS SHARED BETWEEN PRESENCES BY LAW (the вычитка's own rule): what presence
// changes is the FRAME the parent is standing in, never the sentence she says inside the quotation
// marks. ⚠ NO NAME AND NO GENDER in any line – the name is WRITTEN at this beat (T3's
// `partnerNameFor`) but which surfaces SPEAK it is a later task's question, and a pool that jumped
// ahead of that ruling would be taking a wording decision that is his.

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, in both presences. The voice bibles govern: `sunny` says
 *  it evenly and names the feeling; `fiery` gives the verdict first, at speed, in absolutes;
 *  `quiet` says the practical surface and leaves herself out; `deep` says one true thing, late,
 *  stripped of its size, in full stops. */
const ENGAGED_HER_LINE: Record<Temperament, PresenceCell> = {
  sunny: {
    roof: 'She sat us down at the table and could not keep it in past the kettle. "We are getting married. I wanted you to hear it from me first."',
    away: 'She called before we had even asked about the week. "We are getting married. I wanted you to hear it from me first."',
  },
  fiery: {
    roof: 'She came in already talking. "We are getting married. Yes, we are sure. No, we are not waiting."',
    away: 'She rang, and led with it. "We are getting married. Yes, we are sure. No, we are not waiting."',
  },
  quiet: {
    roof: 'She said it while she was clearing the table, as if it were about the schedule. "We are getting married. In a couple of months, probably."',
    away: 'She sent the season\'s dates through, and this was at the top of the message. "We are getting married. In a couple of months, probably."',
  },
  deep: {
    roof: 'She waited until the room had gone quiet and said it once. "We are getting married. I have thought about it. It is right."',
    away: 'She let the call run almost to the end and said it before goodbye. "We are getting married. I have thought about it. It is right."',
  },
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENDED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this
 *  rung the parent was never the person it was told to. */
const ENGAGED_DRY = 'She is getting married. The news reached this house second-hand.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `COUNSEL_HEADING`'s
 *  shape rather than `MET_HEADING`'s ladder, because the one fact of this card is the same fact at
 *  every distance and in every weather: she has decided, and the deciding is hers. The bond band
 *  reaches the card through HER line (own voice against the dry card), never through the frame; a
 *  heading that read the band would say the distance twice. ⚠ It recommends none of the three
 *  answers – «she has made up her mind» is what the parent can see, and which of the three things
 *  to say about it is his. */
const ENGAGED_HEADING = 'A wedding is coming, and she has made up her mind'

// =================================================================================================
// 3h. `'spouse-view'` – THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY (the wedding, wave 7: T5).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// THE FIRST POOL IN THIS FILE WHOSE SPEAKER IS NEITHER HER NOR STAFF. The shape is the counsel's
// (`COACH_COUNSEL`): third-person narration outside the quotation, the speaker's own words inside
// it, keyed on the row's `detail` and on NOTHING else – no voice (he is not her, §3d's argument),
// no bond (he is not the relationship), no register (the week is hers), no presence axis.
//
// ⚠⚠ NO NAME AND NO GENDER ANYWHERE IN THE POOL – the standing law (`ENGAGED_HER_LINE`'s own note):
// the episode holds a persisted NAME since T3, but WHICH surfaces speak it – and whether any may say
// «husband» – is the owner's wording call, carried as a question in T7's table. Until he rules, the
// spouse is «the one she married», which is a fact the world does hold.
//
// ⚠ NO FIGURE AND NO PRICE in any line (rule 4) – the `'money'` occasion says «a large bill» and
// stops there, which is the brief's own fence: beats about money, never accounting.

/** ⚠ ⚠ DRAFT – WHAT THE SPOUSE SAYS, one line per occasion, each spoken about a fact the gate has
 *  just verified the world holds (`SPOUSE_VIEW_OCCASION_AT`, §12) – so no line can describe a season
 *  the career is not having. First person inside the quotation is the counsel pool's own licence:
 *  the narration law binds the frame, not the speech. */
const SPOUSE_VIEW_SAID: Record<SpouseViewOccasion, string> = {
  'distant-swing': 'The one she married stayed back after the plates were cleared. "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."',
  'road-stretch': 'The one she married said it plainly, on a quiet evening. "The family has been on the road for weeks now. The house does not really get lived in between the trips."',
  'no-vacation': 'The one she married brought it up as the season closed. "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."',
  money: 'The one she married asked it without an edge. "That was a large bill, and the season sits in her account now. I am not counting anybody\'s money. I am asking how this house plans."',
}

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `COUNSEL_HEADING`'s
 *  shape and its reason: this card is a word from a third person, and neither the week's weather nor
 *  the parent-daughter distance is a fact about it. ⚠ It recommends none of the three answers. */
const SPOUSE_VIEW_HEADING = 'The one she married has something to say about this season'

/** ⚠ ⚠ DRAFT – the Home card's invitation, `SMALL_TALK_CARD`'s twin for this kind: one short line
 *  saying a word is waiting, never what the word is (the card is only the invitation). */
const SPOUSE_VIEW_CARD = 'The one she married wants a word.'

// =================================================================================================
// 3i. `'own-key'` – THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog §8).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// ONE SCENE, TOLD ONCE, IN THE PARENT'S OWN NARRATION – deliberately NO quoted line of hers, and
// that absence is what keeps this a one-cell pool without breaking the voice law: the completeness
// rule («a `quiet` girl can never silently receive a `fiery` girl's line») binds pools that QUOTE
// her, and this card quotes nobody. Giving the scene a voiced line of hers – four cells, two
// presences – is a wording decision the owner may take at T7's table; a draft that jumped ahead of
// it would be choosing for him.

/** ⚠ ⚠ DRAFT – the card's one line: what the week holds, seen from the family's side. */
const OWN_KEY_SAID = 'She has a place of her own now. A spare key went onto the hook by our door, and Sunday dinner is a standing thing.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – the scene is the
 *  same scene at every distance and in every weather. */
const OWN_KEY_HEADING = 'She lives behind her own door now'

/** ⚠ ⚠ DRAFT – the Home card's invitation, one short concrete line. */
const OWN_KEY_CARD = 'She came by with a spare key.'

/** ⚠ ⚠ DRAFT – the kept feed row, written at the raise (`deliverKnownPartner`'s `keep: true`
 *  doctrine: the week she moved out is not a line the album may be missing). ⚠ NO cents, no
 *  mechanic, no address – backlog §8's own boundary. */
const OWN_KEY_ROW = 'She has her own place now. A spare key lives on the hook, and Sunday dinner stands.'

// =================================================================================================
// 3j. `'expecting'` – THE WEEK SHE SAYS SHE IS HAVING A CHILD (the pregnancy, wave 8: T2).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's table).
// =================================================================================================
//
// SHE ANNOUNCES – §4a's law at the layer's biggest moment, and the pool is `ENGAGED_HER_LINE`'s
// shape rather than a new one: one cell per voice, no register axis, both presences, plus the dry
// card for a `strained`/`cold` home and one heading. There is no told-now/told-late split for the
// same reason the wedding has none: there is nothing here to be learned late.
//
// ⭐⭐⭐ v87 T2 – **AND THE CLAUSE THAT USED TO CARRY THAT SENTENCE IS NOW FALSE AND IS CORRECTED
// RATHER THAN QUIETLY DELETED.** It read «`rollPregnancy` raises the card the week the hazard
// lands», and since the hidden window it does not: the hazard writes the record, the window runs,
// and `landPregnancyAnnouncement` raises the card `windowWeeks` later. The CONCLUSION is unchanged
// and is now true for a better reason – there is no told-late variant because the parent cannot
// learn about the window at all. He is told once, on her week, and the weeks behind him are re-read
// by HIM rather than by the game (the design's §3).
//
// ⚠⚠ SO NO LINE BELOW MAY SAY SHE HAS KNOWN FOR A WHILE, which is a NEW rule this wave adds to the
// pool and the reason no cell was rewritten for the window. The narration is what the PARENT saw;
// he cannot see a window he was never inside, and a line that showed it would be the fallible-parent
// law broken at the layer's biggest moment. What she says inside the quotation marks is hers and
// could carry it – that is a wording decision, and it is the OWNER's (invariant 4), raised in the
// wave's report rather than taken here.
//
// ⚠ THE QUOTED SPAN IS SHARED BETWEEN PRESENCES BY LAW (the вычитка's own rule): what presence
// changes is the FRAME the parent is standing in, never the sentence she says inside the quotation
// marks.
//
// ⚠⚠ NO NAME AND NO GENDER FOR THE ONE SHE MARRIED, the standing law of §3g and §3h: the episode
// holds a persisted name since wave 7, but which surfaces SPEAK it is the owner's call and is still
// open at T8's table. «We» is what she says, which is a fact the world holds.
//
// ⚠⚠ AND NO SEX FOR THE CHILD, WHICH IS A DIFFERENT LAW AND A HARDER ONE. The ROW is ruled girls-only
// (20.09, «пол нужен, но мальчиков у нас пока нет»), and T4 writes the literal `'girl'` – but the
// row does not exist yet on the week she says this, and neither does the knowledge. A line saying
// «дочь» here would be the birth's own fact borrowed nine months early, and the scaffold ruling's
// own point is that the day boys exist nothing already written may have to be unwritten.
//
// ⚠ NO DATE AND NO NUMBER IN ANY LINE (rule 4). `dueWeek` is on the record and the calendar is where
// a date belongs; a card that named the week would also be naming a constant T9 is going to retune.

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, in both presences. The voice bibles govern, `ENGAGED_HER_
 *  LINE`'s own reading of them: `sunny` says it evenly and names the feeling; `fiery` gives the
 *  verdict first, in absolutes; `quiet` says the practical surface and leaves herself out; `deep`
 *  says one true thing, late, stripped of its size, in full stops.
 *
 *  ⭐⭐⭐ v87 T3 – **THE QUOTED SPANS GAINED ONE CLAUSE EACH, AND THE NARRATION DID NOT MOVE A BYTE.**
 *  The design's §4 table crosses HOW LONG THE WINDOW LASTS with THE ANNOUNCEMENT, and T2 built the
 *  first column mechanically (openness draws the window). This is the second column reading the
 *  first: `sunny` has barely sat on it, `fiery` did not wait to be sure, `quiet` has known a while,
 *  `deep` longest of all and needed to know what she felt first.
 *
 *  ⚠⚠ IT IS **HER** LINE AND NOT THE NARRATION, AND THE SPLIT IS THE FALLIBLE-PARENT LAW RATHER
 *  THAN A PREFERENCE. The narration is what the PARENT saw, and he cannot see a window he was never
 *  inside – a line of his that said «she had known for weeks» would be the game telling him a thing
 *  nobody told him. She knows, so she may say it; every clause below is inside the quotation marks.
 *
 *  ⚠ NO NUMBER AND NO DATE IN ANY OF THEM (§3j's rule 4, which binds this edit as hard as it binds
 *  the rest of the pool): «a week» and «a month» are numbers, so none of the four says one. The
 *  window is a drawn constant T6 is going to measure, and a line that named it would be quoting a
 *  number the bench may move.
 *
 *  ⚠ THE OLD SPANS ARE LISTED VERBATIM IN THE WAVE'S REPORT beside these, which is the one thing a
 *  builder owes when a task asks for copy that already exists (invariant 4's own corollary – the
 *  owner reads the replacement beside what it replaced, and the strings stay his). */
const EXPECTING_HER_LINE: Record<Temperament, PresenceCell> = {
  sunny: {
    roof: 'She waited until we were all sitting down, and then said it straight out. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both."',
    away: 'She called on a Sunday, before anything else had been said. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both."',
  },
  fiery: {
    roof: 'She came in and said it before her coat was off. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished."',
    away: 'She rang between flights and led with it. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished."',
  },
  quiet: {
    roof: 'She mentioned it while she was looking at the calendar, as if it were a fixture change. "We are having a baby. I have known a while. I will play a while yet, and then I will not."',
    away: 'She sent the next block of dates through, and this was underneath them. "We are having a baby. I have known a while. I will play a while yet, and then I will not."',
  },
  deep: {
    roof: 'She sat with it through most of the evening, and then put it in one sentence. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it."',
    away: 'She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it."',
  },
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENGAGED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this rung
 *  the parent was never the person it was told to. */
const EXPECTING_DRY = 'She is expecting a child. Nobody in this house was told first.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `ENGAGED_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line (her own voice against the dry card)
 *  rather than through the frame, which would otherwise say the distance twice. ⚠ It recommends none
 *  of the three answers – what a parent can see is that she has decided, and which of the three
 *  things to say about it is his. */
const EXPECTING_HEADING = 'A child is coming, and she has already decided'

// =================================================================================================
// 3l. `'bereavement'` – A DEATH IN THE FAMILY (the weight, wave 11: T5).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4).
// =================================================================================================
//
// ⚠⚠ **THE DECEASED IS UNNAMED, IN MECHANICS AND IN COPY** – RULED 22.09 (question 4), and the
// reason is a collision this game already has: the fridge pool names a grandmother in lines nothing
// licenses, so shipping a NAMED death against an unlicensed «Grandma called» scrap is exactly the
// contradiction the honesty law exists to prevent. «There has been a death in the family» is the
// whole of what any line here may say, and licensing named kin off live-kin facts is its own later
// work. ⚠ That also means no relation word: not a grandmother, not an aunt, not a cousin.
//
// ⚠⚠ OPENNESS OWNS THE EXPRESSION AND INTENSITY OWNS NOTHING HERE – his 11.09 ruling, read exactly:
// «INTENSITY owns depth AND duration … OPENNESS owns expression (private grieves quietly – the feed
// and diary nearly silent, the face and the funeral frame carrying it; open speaks)». So the DEPTH
// is `ECONOMY.spirit.shock.bereavement` seen through `perturbationScale`, which is the intensity
// axis and lives in `engine/spirit.ts`; what this pool carries is how much she SAYS, and the private
// voices say least. Nothing in these words is a second pricing of anything.
//
// ⚠ THE QUOTED SPAN IS SHARED BETWEEN PRESENCES BY LAW (the вычитка's own rule, §3j's inheritance):
// what presence changes is the FRAME the parent is standing in, never the sentence she says inside
// the quotation marks.
//
// ⚠ NO DATE AND NO NUMBER IN ANY LINE (rule 4). The week is on the world and the calendar is where a
// date belongs; a line that named one would also be naming a constant T6 is going to measure.

/** ⚠ ⚠ DRAFT – WHAT SHE SAYS, BY VOICE, in both presences. The voice bibles govern: `sunny` says it
 *  plainly and wants him near; `fiery` says it loudly and then will not sit with it; `quiet` says
 *  the practical surface and leaves herself out; `deep` says the one fact and nothing else at all. */
const BEREAVEMENT_HER_LINE: Record<Temperament, PresenceCell> = {
  sunny: {
    roof: 'She came round in the evening and said it before she had taken her coat off. "There has been a death in the family. I would rather you heard it from me."',
    away: 'She rang in the evening, before anything else had been said. "There has been a death in the family. I would rather you heard it from me."',
  },
  fiery: {
    roof: 'She said it in the hall, loudly, and then would not sit down with it. "There has been a death in the family. I am not going to be much use this week."',
    away: 'She rang and led with it, and was off the phone not long after. "There has been a death in the family. I am not going to be much use this week."',
  },
  quiet: {
    roof: 'She mentioned it while she was putting something away, as if it were an errand. "There has been a death in the family. There are arrangements to make."',
    away: 'She sent the week\'s dates through, and this was underneath them. "There has been a death in the family. There are arrangements to make."',
  },
  deep: {
    roof: 'She sat in the kitchen a long time before she said anything at all. "There has been a death in the family."',
    away: 'The call was mostly quiet. She said it once, near the end of it. "There has been a death in the family."',
  },
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `EXPECTING_DRY`'s
 *  shape and doctrine: it states what the week HOLDS, and the distance is the whole content. */
const BEREAVEMENT_DRY = 'There has been a death in her family. The house heard it from somebody else.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `EXPECTING_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line rather than through the frame.
 *  ⚠ It recommends nothing and asks nothing: what a parent can see is that it has happened. */
const BEREAVEMENT_HEADING = 'There has been a death in the family'

// =================================================================================================
// 3m. `'divorced'` – THE WEEK THE MARRIAGE ENDS (the parting, wave 12: T1/T2).
//     ⚠ HIS REVIEW APPLIED 23.09 (invariant 4; T8's table carries per-row status) – awaiting his
//     final pass.
// =================================================================================================
//
// `docs/specs/the-parting-2026-09.md` §4. The ending already happens – `rollEnds` ×
// `ECONOMY.wedding.latchEndFactor`, since v83 – and what it has never been able to do is say so.
// Every pool below is §3e's ending read one rung up, with the register axis removed.
//
// ⚠⚠ ONE REGISTER, AND IT IS A FACT ABOUT THE MACHINERY RATHER THAN A SIMPLIFICATION. `'ended'`
// carries told-now / told-late because an episode can end before its `knownWeek` arrives. A LATCHED
// one cannot: the latch is written by `landWedding`, which needs an ANSWERED `'engaged'` row, which
// needs the delivered episode – so a married row always holds the `'met'` receipt and the ending
// never falls through to `deliverKnownPartner`'s late path. The spec's §2.2 states it and T2's tests
// pin both halves; nothing below has a second cell for a scene that cannot happen.
//
// ⚠⚠ AND THE READ IS THE ENDING'S OWN, DRAWN ON THE ENDING'S OWN KEY. `seed:life:ends:<week>:react`
// is derived once at the raise site and spent on the heading and the price, exactly as it has been
// since v75 – ZERO new streams, which is the wave's law (§9). A `:divorce:react` key would put a
// new draw on every marriage ending in every career, the frozen corpus included.
//
// ⚠ WHAT NO LINE HERE MAY SAY: whose fault it was, how long it had been coming, what was divided,
// or a word about money. The world holds none of them (§2.4: «no accounting, ever»), and a sentence
// that reached for one would be inventing the consequential fact the layer refuses to model. The
// husband's NAME is on the episode since v83 and is deliberately not spoken here either – which
// surface speaks it is the owner's question, and a card that answered it by default would settle it
// for him.

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `close` / `steady` – HER OWN VOICE, four
 *  temperaments, ONE channel. `ENDED_HER_LINE`'s completeness law kept whole: this is one of the
 *  pools in this file a girl's voice indexes, and a `quiet` girl can never silently receive a
 *  `fiery` girl's line.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (his 23.09 review, must-fix 1). A `roof` divorce cannot happen: the latch needs 23+,
 *  `independent` begins at 22 and `college` is an away stage too – so every divorce a real career
 *  can produce is `away`, and eight cells would be four reachable lines towing four dead ones. The
 *  `Record<Temperament, string>` says so in the type; the sibling roof cells still standing in the
 *  wave-11 pools are the same finding one wave back, listed in the backlog rather than churned here.
 *
 *  ⚠ EACH VOICE SAYS THE SAME FACT AND KEEPS ITS OWN HABIT: `sunny` reassures before the news has
 *  landed, `fiery` closes the subject in the same breath, `quiet` arrives at it through the
 *  arrangements, `deep` gives the thing its size and stops. ⚠ AND NOT ONE OF THEM ASKS THE PARENT
 *  FOR ANYTHING – what she wants is the READ, which the heading carries; a line that asked would
 *  answer the card for him. ⚠ The quotes carry contractions – his 11.09 P2 ruling («цитаты уже с
 *  контракциями по P2»), the spoken register rather than the written one. */
const DIVORCED_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called before the news could travel. "We\'re ending it. I\'m all right. I wanted you to hear it from me."',
  fiery: 'She called and went straight to it. "The marriage is over. It\'s decided. I don\'t want to pick it apart."',
  quiet: 'She called about the next few weeks. "We\'re separating. There are things to sort out. I may go quiet for a bit."',
  deep: 'The call went quiet before she said it. "It\'s over. That\'s all I can say about it today."',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – `strained` / `cold` – THE DRY CARD, and
 *  not one word of hers in it. `ENDED_DRY`'s told-now row one rung up: by this band the parent was
 *  never the person it was told to, and the line now says exactly that distance and nothing else –
 *  the news reached this house around her.
 *
 *  ⚠ IT CARRIES NO READ, which is why the read lives in the heading: a dry card that named what she
 *  needs would be a home at this distance being told it, which is the one thing the rung is defined
 *  by not having. ⚠ AND IT IS ONE STRING RATHER THAN A RECORD, because there is one register. */
const DIVORCED_DRY = 'The marriage is over. The news did not come from her.'

/** ⚠ ⚠ DRAFT – THE PARENT'S FRAME, KEYED ON HER READ. §3e's banner inherited exactly: THE READ IS
 *  HERE AND NOWHERE ELSE ON THIS CARD, because the heading is the only surface carried at every bond
 *  band, and a read only half the ladder could see would be a hidden number.
 *
 *  ⚠⚠ NEITHER CELL NAMES AN ANSWER. «She wants the room» is what the parent can SEE; which of the
 *  four things to say about it is his, and a heading that recommended one would be the meter this
 *  layer refuses to build, spelled in words – `ENDED_HEADING`'s own rule, word for word.
 *
 *  ⚠ BOTH CELLS OPEN ON THE SAME CLAUSE, which is `ENDED_HEADING`'s shape too: the fact is not what
 *  varies between them, the read is. ⚠ AND THE READ HALF IS THE STANDING POOL'S OWN WORDING, kept
 *  deliberately – «she wants the room to herself» / «she does not want to be on her own with it» is
 *  one fact with one sentence in this file, and a second way of saying it would put two readings of
 *  one draw on two screens. */
const DIVORCED_HEADING: Record<EndsRead, string> = {
  space: 'Her marriage is over, and she wants the room to herself',
  company: 'Her marriage is over, and she does not want to be on her own with it',
}

/** ⚠ HIS REVIEW APPLIED 23.09 (awaiting his final pass) – THE KEPT FEED ROW, and the album keeps
 *  it for the life of the career (`keep: true`). One clause, licensed at the raise site:
 *  `endEpisode` wrote `endedWeek = world.week`, and `latchedWeek !== null` is what selected this
 *  sentence over the ending's.
 *
 *  ⚠⚠ THE SECOND CLAUSE («and there is nobody in her life now») IS GONE – his review, must-fix 3.
 *  It was licensed off `activeEpisode === null`, which is true of the SLOT and false of the LIFE:
 *  an ended marriage does not erase parents, children, friends or a coach, and the wave's own law
 *  says the children are untouched state. The row states the one fact and needs no second clause.
 *  ⚠ `ENDED_NOW_EVENT` one rung up still carries the same tail for a break-up – shipped wording,
 *  not this wave's to change; listed in the backlog for his eye.
 *
 *  Nothing else: no reason, no fault, no name, no duration, no bond band and no money. ⚠ AND IT DOES
 *  NOT OPEN BY ANNOUNCING THE MARRIAGE, which is `ENDED_NOW_EVENT`'s finding 1 inherited: the
 *  wedding's own kept row said it already and both rows are `keep: true`, so a closing row that
 *  introduced the husband would read as the album meeting him for a second first time. */
const DIVORCED_NOW_EVENT = 'Her marriage ended this week.'

/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND – `endedKeptRow`'s own law («so «which sentence does the
 *  album keep» has exactly one spelling»), applied to a kind whose answer happens to be a constant.
 *
 *  ⚠⚠ IT TAKES NO ARGUMENT AT ALL, AND THE EMPTY SIGNATURE IS THE STATEMENT. `endedKeptRow` takes a
 *  register, a read and a coached frame; this kind has ONE register (the receipt, §3m's banner), the
 *  read is refused on this surface by ruling O (the told-now row is read-free in both arms, and a
 *  row that acquired one would be a surface gaining information – «a focus may change how an existing
 *  surface reads; it may not create a surface»), and no `'divorced'` raise site derives the listen
 *  coin. So there is nothing for a parameter to select, and a defaulted one would be an axis nobody
 *  can reach pretending there is a choice here. ⭐ IT IS A FUNCTION ANYWAY rather than the constant
 *  inlined at the raise site, because the ONE-OWNER rule is about where the sentence is DECIDED: the
 *  day this row gains an axis, one call site changes and every reader keeps working. */
export function divorcedKeptRow(): string {
  return DIVORCED_NOW_EVENT
}

// =================================================================================================
// 3k. `'return-plan'` – THE WEEK SHE IS BACK, AND THE QUESTION IS HOW (the return, wave 8: T6).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's table).
// =================================================================================================
//
// ⭐⭐⭐ THIS ONE IS THE PARENT'S, AND THAT IS §4a READ EXACTLY RATHER THAN BENT. «SHE decides, the
// parent REACTS» is a law about HER LIFE – whether there is someone, whether she marries, whether
// she has a child, whether she goes back – and every one of those is drawn or hers. This is the
// SCHEDULING, which is what the parent has always decided: the college fork's mechanical questions
// are the precedent, and `answerFork` is a command rather than a beat for the same reason. She has
// already said she is going back (T5's coin); what a season is built out of is the job.
//
// ONE CARD, TOLD ONCE, IN THE PARENT'S OWN NARRATION – `'own-key'`'s one-cell pool and its whole
// argument, which transfers word for word: the completeness rule («a `quiet` girl can never silently
// receive a `fiery` girl's line») binds pools that QUOTE her, and this card quotes nobody. Giving the
// scene a voiced line of hers is a wording decision the owner may take at T8's table; a draft that
// jumped ahead of it would be choosing for him.
//
// ⚠ BOTH ANSWERS ARE PRICED AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT. Two
// reasons, and the second is the one that matters. (a) §4a.2's law is that HIS WORDS move `bond`;
// this answer is not a word to her, it is a calendar. `'own-key'`'s ruled zero and the counsel's
// («counsel is information, not a test») are the same shape. (b) ⚠⚠ THE PRICE OF THIS ANSWER IS PAID
// IN TENNIS AND MUST NOT ALSO BE PAID IN BOND: the wrong ramp spends her twelve protected entries
// inside the deepest rung of the staged factor and loses them, and a bond delta on top would make one
// answer «the nice one» on a card whose whole purpose is that the cost is mechanical and emergent.
// It is the one beat in this file whose cost is not in this file.
//
// ⚠ NO DATE AND NO NUMBER IN EITHER LABEL (rule 4), and neither of them names the freeze: how many
// entries a protected ranking buys is a rule the card may not turn into a promise, and T9 is what
// measures whether either answer was right.

/** ⚠ ⚠ DRAFT – the card's one line: what the week holds, seen from the family's side. */
const RETURN_PLAN_SAID =
  'She is entered again from this week. The desk wants to know what the first months look like – the small draws she can win, or the big ones she can still get into.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `OWN_KEY_HEADING`'s
 *  shape and its reason: the question is the same question at every distance and in every weather. */
const RETURN_PLAN_HEADING = 'She is back, and the first months have to be built'

/** ⭐⭐⭐ THE ANSWER'S OTHER CONSEQUENCE: which booking preference each id records, `EXPECTING_SUPPORT`'s
 *  own shape one section up and its own law – «one answer, two consequences, zero new meters».
 *
 *  ⚠ THE PLAN IS THE ANSWER'S OWN NAME AND THERE IS NOTHING TUNABLE HERE. Both ids are priced at 0
 *  bond (§3k's banner), so unlike the pregnancy's grades this table cannot drift away from a retune –
 *  there is no number to retune. It exists so the ID the card carries and the STATE the seam reads
 *  have exactly one spelling in the engine.
 *
 *  ⚠ TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-return-ramp.test.ts` is what says so – the
 *  ids are strings rather than a union, so the type cannot carry that claim and a test has to.
 *  `answerLifeBeat` throws BY NAME on a miss rather than writing `undefined` onto the field. */
const RETURN_PLAN_CHOICE: Readonly<Record<string, NonNullable<ComebackState['returnPlan']>>> = {
  'small-first': 'small-first',
  'straight-back': 'straight-back',
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
  /** ⭐⭐⭐ v76 T8 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE PAIR ABOVE'S RULING REPEATED
   *  RATHER THAN RE-ARGUED: «counsel is information, not a test». The psychologist is not a person the
   *  parent can answer wrongly either, and a priced reply would make a second phone call about his
   *  daughter into a thing to be played correctly. No third option and no `listen` detour.
   *
   *  ⚠⚠ AND THE ZEROES ARE WHAT KEEP HIS READ A WORDING REGISTER. He reads `spiritShock` for the
   *  column of `PSY_COUNSEL` and nothing else (§3f) – so this list is the SAME two rows, the same two
   *  ids and the same two zeroes with a shock live and with none. There is no overlay for this kind in
   *  `lifeBeatOptionsFor`, which is the strongest form that statement can take: the priced set is not
   *  «equal in both registers», it is the same object.
   *
   *  ⚠ NEITHER LABEL PROMISES AN OUTCOME – the fork is one card later, and a button reading «tell the
   *  psychologist she will keep playing» would be a second, unpriced fork.
   *
   *  ⚠⚠ AND NO PRONOUN FOR THE PSYCHOLOGIST, here or in the feed rows below. R15-7's rule, swept over
   *  every literal in `src/` by `tests/coach-voice.test.ts`: the sim holds no gender for a member of
   *  staff, so «thank him» is a fact the world does not have. The coach's pool records the same guard
   *  catching the same mistake on its first draft. */
  'fork-psy': [
    { id: 'straight', label: 'Thank the psychologist for the straight read', bond: 0 },
    { id: 'keep', label: 'Say we will keep it in mind when we answer', bond: 0 },
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
   *  button that changed its words with its price would be the meter one step removed.
   *
   *  ⭐ T6 READ ALL FOUR AND KEPT THEM BYTE-IDENTICAL, WHICH IS A DECISION AND NOT AN OMISSION. They
   *  are gender-free by «them» (the schema persists no name and no gender), carry no number, no price
   *  and no meter, and – the test a label has to pass that a sentence does not – EACH ONE READS AS A
   *  PLAUSIBLE PARENT IN BOTH READINGS, because the flip moves the price and never the words. «Give
   *  her room, and say we are here» is the kind answer when she wants space and a distant one when she
   *  wants company; «Keep her company, and stay close this week» is warmth one way and crowding the
   *  other. A label that only worked under one read would be the read leaking onto the button. */
  ended: [
    { id: 'space', label: 'Give her room, and say we are here', bond: ECONOMY.bond.delta.endedMatched },
    { id: 'company', label: 'Keep her company, and stay close this week', bond: ECONOMY.bond.delta.endedMismatched },
    { id: 'fix-it', label: 'Offer to help put it right', bond: ECONOMY.bond.delta.endedFixIt },
    { id: 'blame', label: 'Say they were never worth it', bond: ECONOMY.bond.delta.endedBlame },
  ],
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE FOUR THE MARRIAGE'S ENDING OFFERS (spec §4's
   *  shape: give her room / stay close / offer to help sort it / dismiss him). ⚠ THIS IS THE LIST AS
   *  A GIRL WHO WANTS **SPACE** PRICES IT, `'ended'`'s own doctrine at the same axis: the base column
   *  is `'space'` and `DIVORCED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor` is the only road
   *  to the priced set either way.
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; the
   *  wave's T8 strings table is where he reads them), and the four PRICES are drafts too: the spec
   *  asked for the `'ended'` deltas MIRRORED rather than for a spread the builder invented
   *  (`ECONOMY.divorce`'s own block argues it).
   *
   *  ⚠⚠ THE FOURTH KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-INDEPENDENT BY
   *  CONSTRUCTION rather than by two absences: the overlay below names `space` and `company` only,
   *  and `DRAIN_ANSWER['divorced']` = `sort` costs −1 under every reading – an arithmetic a bench can
   *  print (`tools/_lifeBeats.ts`, `drainSkewLine`).
   *
   *  ⚠⚠ AND THE THIRD LABEL IS WHERE THIS POOL PARTS FROM THE ENDING'S, WHICH IS THE ONE WORDING
   *  DECISION IN IT. The break-up offers «Offer to help put it right» – a parent trying to MEND the
   *  relationship. That answer is not available here: a marriage this card is raised about is already
   *  over (`endEpisode` ran four lines above the raise), and a parent offering to fix it would be
   *  offered a power the game does not hold. What a parent CAN do is help with the practical wreckage,
   *  which is what the label says and is the same instinct landing somewhere true.
   *
   *  ⚠⚠ THE FOURTH SAYS «THEM» AND NOT «HIM», AND THE FIRST DRAFT GOT THAT WRONG. It read «better
   *  off without him», on the reasoning that a marriage licenses the pronoun – and
   *  `tests/coach-voice.test.ts`'s R15-7 sweep refused it, correctly: `LoveEpisode` PERSISTS NO
   *  GENDER, from the arrival through the wedding to this card, so «him» is a fact the world does
   *  not hold however obvious it feels. The `'ended'` pool's own note says the same thing three
   *  sections up – «them is the only honest word for whoever is gone» – and this label is that rule
   *  inherited rather than re-argued. ⚠ The NAME is refused too, for a different reason: the schema
   *  has carried one since v83, but which surfaces speak it is the owner's question and a button
   *  that spoke it would settle it by default. ⚠ AND
   *  NO NUMBER, NO PRICE, NO METER in any of them, and the LABELS ARE UNTOUCHED BY THE FLIP – same
   *  four sentences, same order, same ids, both readings. A button that changed its words with its
   *  price would be the meter one step removed. */
  divorced: [
    // ⚠ DRAFT
    { id: 'space', label: 'Give her room, and say we are here', bond: ECONOMY.divorce.matched },
    // ⚠ HIS REVIEW APPLIED 23.09 – the tautology («keep her company, and stay close») collapsed to
    // the half that says something, and the closeness now names its own restraint.
    { id: 'company', label: 'Stay close, without asking for the whole story', bond: ECONOMY.divorce.mismatched },
    // ⚠ HIS REVIEW APPLIED 23.09 – «the practical side» read corporate; «whatever needs sorting»
    // is the same offer in the register a kitchen uses.
    { id: 'sort', label: 'Offer to help with whatever needs sorting', bond: ECONOMY.divorce.sortItOut },
    // ⚠ DRAFT
    { id: 'dismiss', label: 'Say she is better off without them', bond: ECONOMY.divorce.dismiss },
  ],
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE THREE THE ANNOUNCEMENT OFFERS: the research digest's
   *  own triple, bless / keep distance / oppose, priced in `ECONOMY.wedding` (drafted +2.5 / −1 /
   *  −4, benched in T8, his word after the numbers).
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; the
   *  wave's T7 strings table is where he reads them).
   *
   *  ⚠⚠ THE SECOND KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-independent BY
   *  CONSTRUCTION rather than by two absences: no overlay in `lifeBeatOptionsFor` names this kind,
   *  so the priced set is the same object under every `wants` and every ends-read, and
   *  `DRAIN_ANSWER['engaged']` = `distance` drains at the one −1 a harness can state.
   *
   *  ⚠ THE LABELS NAME NO GENDER (them, it – the schema persists a NAME from this beat on, never a
   *  gender), NO NUMBER, NO PRICE AND NO METER (the fence). And none of them promises to stop
   *  anything: the wedding lands whatever is said (T3), so a button reading «forbid it» would be a
   *  power the game does not hold – opposing is a thing said to her, not a veto. */
  engaged: [
    // ⚠ DRAFT
    { id: 'bless', label: 'Give them our blessing', bond: ECONOMY.wedding.blessBond },
    // ⚠ DRAFT
    { id: 'distance', label: 'Say it is her decision, and step back', bond: ECONOMY.wedding.distanceBond },
    // ⚠ DRAFT
    { id: 'oppose', label: 'Tell her we think it is a mistake', bond: ECONOMY.wedding.opposeBond },
  ],
  /** ⭐⭐ v83 (wave 7 – T5) – THE THREE THE SPOUSE'S WORD OFFERS, and they are ONE set for all four
   *  occasions, which is tier 1's own precedent quoted at its table above: «three parent moves that
   *  fit a worry, a joy or a question alike, because the answer set is keyed on the KIND and her
   *  subject is a fact on the row». The occasion is the row's `detail`; the parent's three moves –
   *  hear it out, hold the season's line, wave it off – fit each of the four. ⚠ Per-occasion WORDS,
   *  if the owner wants them, are one label overlay away (round 42 #15's own machinery, the fourth
   *  parameter of `lifeBeatOptionsFor`) and are flagged as a question in T7's table, not taken.
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4).
   *
   *  ⚠⚠ THE THIRD KIND WITH NO FREE ANSWER, priced SMALL by design (the brief's ±0.5..±1.5): a word
   *  about her marriage is never free, and never large – the marriage's standing is texture, not
   *  economy. Read-independent BY CONSTRUCTION (`'engaged'`'s own shape): no overlay names this
   *  kind, so the priced set is the same object under every reading and
   *  `DRAIN_ANSWER['spouse-view']` = `level` drains at the one −0.5 a harness can state.
   *
   *  ⚠ THE LABELS NAME NO GENDER (the §3h banner's law), NO NUMBER, NO PRICE AND NO METER (the
   *  fence). And none of them promises an outcome – what the family DOES about a season is the
   *  planner's, and a button reading «skip the trip» would be a second, unpriced planner. */
  'spouse-view': [
    // ⚠ DRAFT
    { id: 'hear', label: 'Say the point is fair, and talk it through', bond: ECONOMY.wedding.spouseViewHearBond },
    // ⚠ DRAFT
    { id: 'level', label: 'Say the season is what it is', bond: ECONOMY.wedding.spouseViewLevelBond },
    // ⚠ DRAFT
    { id: 'brush', label: 'Say there is nothing to worry about', bond: ECONOMY.wedding.spouseViewBrushBond },
  ],
  /** ⭐ v83 (wave 7 – T10) – ONE ACKNOWLEDGMENT, PRICED ZERO, AND BOTH HALVES ARE THE DESIGN. One,
   *  because the beat is narrative-only and offers nothing to decide – the dialog's confirm needs a
   *  control that records, and this is it. Zero, because «NO bond move» is backlog §8's own price:
   *  a housewarming is not a card a parent can answer wrongly. ⚠ THE ZERO IS WRITTEN OUT and not
   *  sourced to a delta table, tier 1's own argument: there is no economy here to name a constant
   *  for, and the day somebody priced it the one-time story would start paying.
   *  ⚠ ⚠ DRAFT – the label is the builder's draft for the owner's pass (invariant 4). */
  'own-key': [
    // ⚠ DRAFT
    { id: 'keep', label: 'Put the key on the hook', bond: 0 },
  ],
  /** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – THE THREE THE ANNOUNCEMENT OFFERS, and they are the
   *  RESEARCH's own finding made mechanical rather than a triple somebody liked the sound of. The
   *  digest's row is «First pregnancy … support only – reaction sets recovery trajectory»: the parent
   *  has no lever over the pregnancy, and what he DOES have is the reaction, which is why these three
   *  are graded joy / worry / the career first and why the grade is PERSISTED (`support` on
   *  `world.pregnancy`) instead of evaporating with the card. Priced in `ECONOMY.motherhood` (drafted
   *  +2.5 / −0.5 / −4, the brief's own figures, benched in T9, his word after the numbers).
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; T8's
   *  strings table is where he reads them).
   *
   *  ⚠⚠ THE THIRD KIND WITH NO FREE ANSWER, after `'ended'` and `'engaged'`, and deliberately: an
   *  announcement like this is not a card a parent can answer without it meaning something. Like
   *  `'engaged'` it is read-independent BY CONSTRUCTION rather than by two absences – no overlay in
   *  `lifeBeatOptionsFor` names this kind, so the priced set is the same object under every `wants`
   *  and every ends-read, and `DRAIN_ANSWER['expecting']` = `worry` drains at the one −0.5 a harness
   *  can state (`'spouse-view'`'s precedent: the registry names the MILDEST of a kind with no zero).
   *
   *  ⚠ NONE OF THEM STOPS ANYTHING, and that is stronger here than at the wedding. The record is
   *  written at the RAISE, so the world is already carrying the pregnancy while this card stands; a
   *  button reading «tell her it is a mistake» would be offering a power the game does not hold and
   *  never will. ⚠ THE LABELS NAME NO GENDER (hers, his, or the child's – §3j's two laws), NO NUMBER,
   *  NO PRICE AND NO METER (the fence). */
  expecting: [
    // ⚠ DRAFT
    { id: 'joy', label: 'Tell her it is the best news in the house', bond: ECONOMY.motherhood.joyBond },
    // ⭐ WAVE 8b C3 – **HIS STRING, PASSED 21.09 IN SESSION**, and no longer a draft. The row it
    // replaces read a shade warmer than its grade is: this answer persists `support: 'measured'`,
    // which scales the postpartum shock and weights her return, and «we will worry» sounded like the
    // warm rung's cousin. ⚠ THE GRADE DID NOT MOVE – only the label. A re-grading of which answer is
    // which is a mechanical change and is not this batch's (the strings table's §8 Q-1).
    { id: 'worry', label: 'Say we are glad – and start counting the weeks.', bond: ECONOMY.motherhood.worryBond },
    // ⭐⭐⭐ v87 T3 – **THE REASONABLE POSITION, NOT A VILLAIN'S LINE**, and it is the design's own
    // §5 asking for it: «the third answer's words are today the career-first one, and they should be
    // allowed to be *reasonable* – «not now, look where you are» is a position, not a villain's line».
    // The words he gave the case are the ones a real parent uses: «рано, у тебя карьера в апогее».
    //
    // ⚠⚠ THE GRADE DID NOT MOVE AND MUST NOT – wave 8b's C3 correction, one row up, read forward.
    // This answer still persists `support: 'cold'` and still costs −4, because the research's row is
    // about PRESSURE and a parent who answers a pregnancy by pricing her ranking is the parent that
    // row means. What changed is that he now says a thing a reader can DISAGREE with rather than a
    // thing a reader can only dislike: §5's other half is that the game must not settle who was
    // right, and a villain's line settles it before the album gets the chance not to.
    //
    // ⚠ THE OLD LABEL WAS «Ask her what this does to the tennis» and is quoted verbatim in the
    // wave's report beside this one (invariant 4's corollary: the owner reads the replacement beside
    // what it replaced). ⚠ DRAFT, like the row above it.
    { id: 'career-first', label: 'Say it is too early – look where she is', bond: ECONOMY.motherhood.careerFirstBond },
  ],
  /** ⭐⭐⭐ v85 (the return, wave 8 – T6) – THE RAMP'S TWO, AND THE ONLY CARD IN THIS TABLE THAT IS A
   *  SCHEDULING DECISION RATHER THAN A REACTION (§3k's banner carries the §4a argument in full: she has
   *  already decided to go back; what a season is built out of is the parent's job, on the college
   *  fork's own precedent).
   *
   *  ⚠⚠ BOTH AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT – see §3k. In one line:
   *  §4a.2's law is that HIS WORDS move `bond`, and this answer is a calendar rather than a word to her;
   *  and the price of it is paid IN TENNIS, so a delta on top would make one answer «the nice one» on
   *  the one card whose whole purpose is that its cost is mechanical and emergent.
   *  ⚠ NO NUMBER, NO DATE AND NO PROMISE IN EITHER LABEL (rule 4), and neither names the freeze: how
   *  many entries a protected ranking buys is a rule the card may not turn into a guarantee. */
  /** ⭐⭐⭐ v87 (the weight, wave 11 – T5) – **ONE ANSWER, AT 0 BOND, AND BOTH HALVES OF THAT ARE
   *  DECISIONS.** `'own-key'`'s one-cell pool is the precedent and its argument transfers whole.
   *
   *  ⚠⚠ ONE ANSWER, BECAUSE THE SPEC DRAFTS NO PRICES AND INVENTING THREE WOULD BE A DESIGN
   *  DECISION WEARING A CONSTANT. Every other costed card in this table has its numbers in
   *  `ECONOMY` with an argument beside them (`wedding`'s +2.5/−1/−4, `motherhood`'s
   *  +2.5/−0.5/−4); §4 of the weight spec drafts none for this kind, and invariant 5 is why a
   *  builder does not supply them. What the spec DOES say is that the death «may reach the parent in
   *  WORDS only», which is exactly a card that tells him and takes one answer.
   *
   *  ⚠⚠ AND 0 BECAUSE §4a's LAW SAYS HIS WORDS MOVE `bond` AND THIS IS NOT A WORD TO HER, IT IS AN
   *  UNDERTAKING. `'return-plan'`'s pair is the nearest shape and its zero is argued the same way. A
   *  delta here would make going to a funeral a thing the game scores, which is the one reading of
   *  §4 that is wrong.
   *  ⚠ IT NAMES NO RELATIVE (RULED 22.09, question 4 – the deceased is UNNAMED in mechanics AND in
   *  copy), no date, no number and no meter. ⚠ DRAFT. */
  bereavement: [
    { id: 'come', label: 'Say you will come', bond: 0 },
  ],
  'return-plan': [
    // ⭐ HIS, 21.09 – the label had to change when the answer's MEANING did: «small events first»
    // now holds for `smallFirstHoldWeeks` and then lets the freeze open the big draws, so a label
    // reading «start with the small draws» described only the first half of what the answer does.
    { id: 'small-first', label: 'Small events first – the big draws when she is ready', bond: 0 },
    // ⭐ HIS, 21.09 – the pair re-read together once the first one moved.
    { id: 'straight-back', label: 'Straight into the big draws', bond: 0 },
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

/** ⭐⭐ v88 (the parting, wave 12) – THE SAME FLIP ONE RUNG UP, and it is a SECOND RECORD rather than
 *  a reuse of the one above although the two hold equal numbers today. The reason is the one
 *  `ENDED_BOND_COMPANY`'s own note gives for not being a copy of the base list: these are
 *  `ECONOMY.divorce`'s rows and those are `ECONOMY.bond.delta`'s, they are drafted to MIRROR and the
 *  owner may un-mirror either at review, and a shared record would silently re-price whichever card
 *  he did not mean to touch. ⚠ `sort` AND `dismiss` ARE ABSENT ON PURPOSE and the absence is
 *  load-bearing: it is what keeps `DRAIN_ANSWER['divorced']` = `sort` at one statable −1 under every
 *  reading, with `drainCostOf` refusing outright if the two readings ever disagree. */
const DIVORCED_BOND_COMPANY: Readonly<Record<string, number | undefined>> = {
  space: ECONOMY.divorce.mismatched,
  company: ECONOMY.divorce.matched,
}

/** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – WHAT EACH ANSWER IS WORTH **MONTHS LATER**: the parent's
 *  word at the `'expecting'` card, graded onto `world.pregnancy.support` by `answerLifeBeat`. The two
 *  overlays above are the same SHAPE and a different job – they re-price an answer, this one records
 *  what the answer WAS – and it sits beside them because both are records keyed by option id, which
 *  is the one thing that must never drift from `LIFE_BEAT_OPTIONS`.
 *
 *  ⚠⚠ IT IS A SECOND CONSEQUENCE AND NOT A SECOND METER, which is the brief's own fence («one
 *  answer, two consequences, zero new meters»). Nothing here is tunable and nothing is summed: the
 *  three grades are the three answers with the bond delta taken off, so a future retune of
 *  `ECONOMY.motherhood.joyBond` cannot silently re-grade a pregnancy, and a re-grade cannot silently
 *  re-price a card.
 *
 *  ⚠ THE GRADE IS THE ANSWER'S OWN NAME AND NOT ITS SIGN. `worry` is `'measured'` rather than
 *  `'cold'` although it is priced negative, because the research's row is about the RECOVERY
 *  trajectory and a parent who says «we are glad, and we will worry» is not the parent the row means
 *  by pressure. The one that is is `career-first`, which answers a pregnancy by asking about the
 *  ranking – «support speeds recovery; pressure → depression risk ↑», the digest's own next line.
 *
 *  ⚠ TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-pregnancy.test.ts` §D is what says so – the
 *  ids are strings rather than a union, so the type cannot carry that claim and a test has to.
 *  `answerLifeBeat` throws BY NAME on a miss rather than writing `undefined` onto the field. */
const EXPECTING_SUPPORT: Readonly<Record<string, NonNullable<PregnancyState['support']>>> = {
  joy: 'warm',
  worry: 'measured',
  'career-first': 'cold',
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
  // ⭐⭐⭐ ROUND 42 #15 – THE FOURTH IS A **LABEL** OVERLAY, AND IT IS THE THIRD'S OWN SHAPE POINTED AT
  // THE OTHER HALF OF AN ANSWER. `MET_BOND_PRIVATE` and `ENDED_BOND_COMPANY` overlay the PRICE by
  // option id; this overlays the WORDS by option id, and the function still grows rather than gaining
  // a sibling (ruling G.3), so «what does this beat offer» keeps one reading.
  //
  // ⚠⚠ IT EXISTS FOR §8d.1 AND FOR NOTHING ELSE: «a `respond` branch must name the parent's actual
  // opinion», which makes the words per SITUATION where the price stays per kind. `'small-talk'`'s
  // three prices are literal zeroes under every overlay, so nothing here can move a number – the
  // labels and the ledger are on opposite sides of the fence and this parameter is on the label side.
  //
  // ⚠ UNDEFINED IS THE BASE TABLE, which is the shipped reading and not a neutral stand-in: a legacy
  // row (and every other kind) reads `LIFE_BEAT_OPTIONS` exactly as it always has. ⚠ AND AN ID THE
  // OVERLAY DOES NOT NAME KEEPS ITS OWN LABEL, the price overlay's own `undefined` rule.
  labels?: Readonly<Record<string, string | undefined>>,
): readonly LifeBeatAnswer[] {
  const base = labels === undefined
    ? LIFE_BEAT_OPTIONS[kind]
    : LIFE_BEAT_OPTIONS[kind].map((option) => {
        const worded = labels[option.id]
        return worded === undefined ? option : { ...option, label: worded }
      })
  // ⭐ v88 (the parting, wave 12) – A THIRD ARM, AND IT IS THE SECOND ONE'S SHAPE POINTED AT THE
  // MARRIAGE'S CARD. The chain stays a chain rather than becoming a record for the reason the two
  // arms above are written as they are: each overlay applies under a DIFFERENT condition on a
  // different fact (her `wants`, then the ends-read at one kind, then the ends-read at another), and
  // a record keyed by kind alone could not carry the condition.
  const overlay = kind === 'met' && wants === 'private'
    ? MET_BOND_PRIVATE
    : kind === 'ended' && read === 'company'
      ? ENDED_BOND_COMPANY
      : kind === 'divorced' && read === 'company'
        ? DIVORCED_BOND_COMPANY
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
  // ⭐⭐⭐ v76 T8 – AND HIS CALL WRITES ONE TOO, for `'fork-counsel'`'s reason exactly: this fires at
  // most once in a career, on the biggest week of it, and a stop the seat had a view about and a stop
  // it was never asked about are two different biographies that only the row can tell apart later.
  // ⚠ IT IS AN `'info'` ROW AND CARRIES NO `lifeKind`, WHICH IS NOT A CHOICE THIS POOL MAKES – every
  // kind's answer line goes through the ONE `addEvent` at the foot of `answerLifeBeat`, typed `'info'`
  // since wave 2, and `tests/wave4-life-row-stamp.test.ts` §A pins that the answer row is deliberately
  // not a life row. So this kind adds NO `type: 'life'` write site, the glyph column is not asked a
  // question it cannot answer, and `LIFE_BEAT_ROW_KINDS` does not grow. Measured, not assumed.
  // ⚠ NO `amountCents` AND NO PRICE IN EITHER LINE (rule 4), and neither names what the read was –
  // the read was the card's, and the feed records that the call happened and what the parent did.
  // ⚠ AND NEITHER NAMES THE SHOCK. The register that worded the card does not reach the feed at all:
  // a kept row saying «after the break-up» would outlive the card and tell a parent who was never told
  // there was anybody a thing the game has not told him.
  'fork-psy': {
    straight: 'Her psychologist called about her wanting to stop. We said thank you for the straight read.',
    keep: 'Her psychologist called about her wanting to stop. We said we would keep it in mind.',
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
   *  reason – the two-tier honesty law, which binds this pool exactly as hard as the card's.
   *
   *  ⭐ T6 READ ALL FOUR AND KEPT THEM BYTE-IDENTICAL, AND THE ONE THING IT WOULD HAVE CHANGED IS ON
   *  THE OWNER'S DESK INSTEAD. All four open on the same clause, and the kept `'ended'` row directly
   *  above them in the feed has just given the same news – so within the sixty weeks before
   *  `pruneEvents` takes the answer row, the pair reads as a restatement. ⚠ IT IS KEPT BECAUSE THE
   *  SHIPPED `met` FOUR DO EXACTLY THE SAME THING («There is someone in her life. We …»), so the
   *  repeated subject clause is this pool's established shape rather than this draft's slip, and
   *  breaking the parallel on one kind is a wording decision about a SHIPPED pool. Flagged in T6's
   *  package as a question; invariant 4 makes the answer his.
   *
   *  ⚠ AND THERE IS STILL NO READ AXIS HERE, which T6 re-confirmed against a contradiction rather than
   *  inheriting. The wave-4 brief's §2 T6 line reads «ANSWER_EVENT feed lines x4 (the read surfaces
   *  here in wording ONLY)»; ruling I (12.09, later) puts the read on «the HEADING and the told-late
   *  feed row» and enumerates its surfaces as «4 heading cells plus 2 feed rows», which is this pool
   *  excluded by count. The ruling wins on date and on arithmetic, and the row's own argument stands:
   *  what it records is what the parent DID, which is the same act whichever way her read came out. */
  ended: {
    space: 'Her relationship ended. We gave her room, and said we were there.',
    company: 'Her relationship ended. We kept her company through the week.',
    'fix-it': 'Her relationship ended. We offered to help put it right.',
    blame: 'Her relationship ended. We said they were never worth it.',
  },
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – AND THE MARRIAGE'S ENDING WRITES ONE, for `'ended'`'s
   *  reason exactly: a divorce the parent gave room to and one he used to say what he had always
   *  thought are two different biographies, and only the row can tell them apart seasons later.
   *  Four lines, one per answer, opening on the same clause – the established parallel shape.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft (invariant 4, T8's table). ⚠ NO
   *  `amountCents` AND NO PRICE IN ANY WORD (rule 4): there is no money in this wave at all. ⚠ AND
   *  NO NAME – the episode has carried one since v83 and which surfaces speak it is the owner's
   *  question, so a feed row that jumped ahead of that ruling would be a wording decision taken for
   *  him. ⚠ AND NO GENDER EITHER – «them», not «him», which the R15-7 sweep caught this pool getting
   *  wrong on its first draft: `LoveEpisode` persists no gender for a partner at any point in the
   *  arc, so the pronoun is a guess however married the two of them are. The option pool's own note
   *  carries the full argument. */
  divorced: {
    space: 'Her marriage ended. We gave her room, and said we were there.',
    // ⚠ HIS REVIEW APPLIED 23.09 on the middle pair – «that week» over «through the week», and the
    // sorting row drops the corporate «practical side» its label dropped.
    company: 'Her marriage ended. We kept her company that week.',
    sort: 'Her marriage ended. We offered to help with what needed sorting.',
    dismiss: 'Her marriage ended. We said she was better off without them.',
  },
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'ended'`'s reason
   *  exactly: an engagement the parent blessed and one he opposed are two different biographies, and
   *  only the row can tell them apart seasons later. Three lines, one per answer, opening on the
   *  same clause – the `met`/`ended` pools' established parallel shape, kept deliberately.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T7's
   *  table). ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4) – the wedding's COST is T3's own
   *  ledger event on the wedding week, never this row's; no name and no gender either, because at
   *  the ANSWER the name is on the episode but which surfaces speak it is T5+/T7's question, and a
   *  feed row that jumped ahead of that ruling would be a wording decision taken for him. */
  engaged: {
    // ⚠ DRAFT
    bless: 'She said she is getting married. We gave them our blessing.',
    // ⚠ DRAFT
    distance: 'She said she is getting married. We said it is her decision, and stepped back.',
    // ⚠ DRAFT
    oppose: 'She said she is getting married. We told her we think it is a mistake.',
  },
  // ⭐⭐ v83 (wave 7 – T5) – NO ROW, AND THE `null` IS TIER 1's OWN STATEMENT AT TIER 1's OWN
  // FREQUENCY: up to ~5 of these a season while the marriage stands, and a feed row per answer would
  // bury the private-life thread under the parent's replies to it – the exact argument
  // `'small-talk'`'s null makes above. The `lifeLog` row is the record and the counter (the cooldown
  // reads it), and the TEXTURE the brief promises goes through the diary (the week note's
  // `spouseSpoke` band), which is the surface the brief names.
  'spouse-view': null,
  // ⭐ v83 (wave 7 – T10) – NO ANSWER ROW, because the RAISE already wrote the kept one
  // (`OWN_KEY_ROW`, `deliverOwnKey`): the feed records what HAPPENED, and «we put the key on the
  // hook» is not a second event – a reply row here would print the same week twice in two voices.
  'own-key': null,
  /** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'engaged'`'s
   *  reason at a bigger moment: a pregnancy the parent met with joy and one he met by asking about
   *  the ranking are two different biographies, and only the row can tell them apart seasons later
   *  when the feed is what the career is read back through. It is also the one surface that records
   *  the answer at all inside the sixty-week prune window – the `support` grade is on the pregnancy
   *  and dies with it, and the `lifeLog` row holds the id and not the sentence.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T8's
   *  table). Three lines, one per answer, opening on the same clause: the `met` / `ended` / `engaged`
   *  pools' established parallel, kept deliberately rather than broken on one kind.
   *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4) – there is no birth fee and no wedding bill
   *  here to name (§2 T4's own «NO COST EVENT»). ⚠ NO NAME, NO GENDER AND NO DUE DATE, §3j's laws. */
  /** ⭐⭐⭐ v87 T5 – ONE LINE FOR ONE ANSWER. ⚠ ⠀DRAFT. ⚠ IT NAMES NOBODY (RULED 22.09, question 4),
   *  no date and no number, and it says what the parent DID rather than what it meant. */
  bereavement: {
    come: 'There has been a death in the family. We said we would come.',
  },
  expecting: {
    // ⚠ DRAFT
    joy: 'She is expecting a child. We told her it was the best news in the house.',
    // ⚠ DRAFT
    worry: 'She is expecting a child. We said we were glad, and that we would worry.',
    // ⭐⭐⭐ v87 T3 – **MOVED WITH THE BUTTON IT REPORTS**, and moving it is the correction rather
    // than an extra: this row's whole job is to say what the parent SAID, so a card that now reads
    // «Say it is too early – look where she is» and a feed row that still read «We asked what it does
    // to the tennis» would be one press with two accounts of itself on one screen. ⚠ The old line is
    // quoted verbatim in the wave's report beside this one. ⚠ DRAFT.
    'career-first': 'She is expecting a child. We said it was too early.',
  },
  /** ⚠⚠ **DRAFT – T8's TABLE** (invariant 4). Two lines, one per answer, opening on the same clause
   *  – the established parallel of every pool above. ⚠ THEY REPORT A BOOKING AND PROMISE NOTHING: what
   *  either ramp is WORTH is emergent and measured (T9), so a row that said «the safe way back» would be
   *  the game grading a decision it has not simulated yet. ⚠ NO NUMBER, NO DATE, NO PRICE (rule 4). */
  'return-plan': {
    // ⚠ DRAFT
    'small-first': 'She is entering again. We start with the small draws and build from there.',
    // ⚠ DRAFT
    'straight-back': 'She is entering again. We put her straight back in the big ones.',
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
  return lifeStageAt(world, world.week)
}

/** ⭐⭐⭐ ROUND 42 #15 – THE SAME READ, AT AN ARBITRARY WEEK, AND IT IS A CRASH FIX RATHER THAN A
 *  generalisation for its own sake.
 *
 *  ⚠⚠ THE BUG IT CLOSES, written down because it is subtle and it BRICKS A CAREER. A tier-1 row is
 *  SOFT: it lives for three weeks and the card is re-assembled on every `toSnapshot` in that window.
 *  The situation it names declares the stages it may be drawn at, and a roof-only scene («She was
 *  straight into it before her bag was down») has no call frame at all. So a row raised in the last
 *  weeks of school, left unanswered across the week `schoolIsOver` flips – or across the week college
 *  opens – would be re-worded at a stage its own copy has no line for, and `smallTalkOpener` throws
 *  inside the snapshot the whole app renders from. Rare, silent to write, and fatal to the save.
 *
 *  ⭐ AND THE FIX IS ALSO THE HONEST READING, which is what makes it the right one rather than a
 *  guard. The beat is a SCENE, and the scene happened on the row's own week: a conversation that has
 *  been waiting two weeks to be heard did not move house while it waited. `lifeBeatPromptFor` hands
 *  in `row.week` for that reason, which is `'fork-counsel'`'s «stamped, never re-derived» argument
 *  applied to the one fact that was still being re-derived.
 *
 *  ⚠ IT IS BEHAVIOUR-IDENTICAL FOR EVERY BLOCKING KIND, and that is checkable rather than hoped: a
 *  blocking row stops the week (`advanceWeeks` and `answerFork` both refuse while one is unanswered),
 *  so `row.week === world.week` on every one of them and this returns exactly what it always did.
 *  ⚠ AND IT HAS ONE FEWER EXCEPTION SINCE 26.09 (B-P3-07, re-aimed on B-01's ruling 2(a)): the claim
 *  above USED TO BE FALSE INSIDE `resumeFromCollege`, which ticked a whole year past an unanswered
 *  blocking row – 23 of 217 year-calls did – so a beat raised in April was worded in December and
 *  this function's `week` argument was the only thing keeping that row in its own room. The loop now
 *  pauses on `'life'` (`COLLEGE_PAUSES`, world/multiWeek.ts), so the sentence holds everywhere; the
 *  `week` argument stays, because a SOFT row still waits three weeks and that was always its reason.
 *
 *  ⚠ `fromWeek` JOINS THE COLLEGE TEST HERE and does not change today's answer either: at
 *  `world.week` a live college freeze always satisfies it. It is needed because an EARLIER week may
 *  be before the freeze began, and without it a row raised at `after-school` would read `college`. */
function lifeStageAt(world: WorldState, week: number): DiaryLifeStage {
  return diaryLifeStageFor(
    kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay),
    schoolIsOver(week, world.profile.birthMonth),
    world.college !== null && week >= world.college.fromWeek && week < world.college.untilWeek,
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
 *  could hand in a presence directly would be a second reading of «is she under this roof».
 *
 *  ⭐ ROUND 44 – `frame` IS THE TENTH AND IT IS THREADED EXACTLY AS `wants`, `stage`, `driver` AND
 *  `endsRegister` WERE: a parameter with a safe default, so every pin waves 2 to 6 wrote keeps
 *  calling this with five to nine arguments and keeps asserting the lines it was written against.
 *  ⚠ THE DEFAULT IS `undefined` AND IT IS THE PRE-v81 READING RATHER THAN A NEUTRAL STAND-IN: the
 *  first line of the presence's pool is exactly what the shipped catalogue wrapped `practice-clicked`
 *  in, so an un-stamped call renders the sentence the owner already read. See `smallTalkFrameOf`. */
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
  frame: string | undefined = undefined,
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
    // ⭐⭐⭐ ROUND 42 #15/#24 – TWO ROADS, AND THE SHAPE OF THE DETAIL IS WHICH. A row raised since
    // this round carries `'<subject>:<situation>'` and opens with the situation's own line; a row
    // raised before it carries one of the three legacy subjects and opens with the pool that shipped.
    // ⚠ THE LEGACY BRANCH IS NOT DEAD CODE AND IS NOT ONLY FOR OLD SAVES: `rollSmallTalk` still
    // raises a legacy row on any week no situation is reachable for this girl at this stage, which
    // is the catalogue being thin on purpose (spec §10).
    case 'small-talk': {
      const column = smallTalkVoiceOf(detail, voice)
      if (column !== null) return smallTalkOpener(column, presence, frame)
      const subject = LEGACY_SMALL_TALK_SUBJECTS.find((s) => s === detail)
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
    // ⭐⭐⭐ v76 T8 – THE SIXTH KIND, AND IT READS ITS OWN `detail` EXACTLY AS THE COACH DOES. Two
    // fields rather than one, `'<register>:<driver>'`: the driver half is the same reading her own
    // line was worded from, and the register half is the shock that was live at the raise. ⚠ BOTH ARE
    // STAMPED AND NEITHER IS RE-DERIVED, which is `'fork-counsel'`'s own argument and not a new one –
    // this function is called on EVERY snapshot, so a re-derived register would re-decide the card's
    // wording after every command, and the row must stay reconstructible for the life of the career.
    // ⚠ IT READS NO `voice`, NO `bond` AND NO `register`: he is not her, he is not the relationship,
    // and the week is hers – see the §3f banner.
    case 'fork-psy': {
      const [column, root] = detail.split(':')
      const psyRegister = PSY_REGISTERS.find((r) => r === column)
      const psyRoot = FORK_STOP_DRIVERS.find((d) => d === root)
      if (psyRegister === undefined || psyRoot === undefined) {
        throw new Error(`A fork-psy row carries no register and driver: ${detail}`)
      }
      // ⭐ v85 T1 – A REGISTER MAY EXIST WITHOUT ITS COLUMN (see `PSY_COUNSEL`'s `postpartum` cell:
      // the kind widened before its copy was drafted, and copy is T8's). ⚠ IT THROWS BY NAME rather
      // than indexing `null`, so the day a kind ships ahead of its column the message says which
      // column is owed – the same courtesy the line above pays a malformed detail.
      // ⚠⚠ AND THIS IS A GUARD FOR A FUTURE WAVE, NOT FOR T4. `PSY_COUNSEL`'s own `postpartum` block
      // proves the two windows cannot overlap – the fork is answered at 18.0–18.9 and BLOCKS until it
      // is, and a postpartum shock cannot exist before ~24 – so nothing T4 ships can reach this line.
      // It fires the day somebody raises `'fork-psy'` from outside the fork, which is exactly when a
      // silent `undefined[driver]` would be hardest to trace.
      const psyColumn = PSY_COUNSEL[psyRegister]
      if (psyColumn === null) {
        throw new Error(`A fork-psy register has no counsel column yet: ${psyRegister}`)
      }
      return psyColumn[psyRoot]
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
    // ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE SEVENTH KIND. ⚠ IT READS NO `detail` AND NO
    // `register`, for `'met'`'s own two reasons: its detail is an episode id (a machine value, never
    // a rendered word) and the Mood ladder is not this card's axis – the announcement is her week's
    // biggest fact whatever the weather. ⚠ AND NO REGISTER AXIS OF ITS OWN, unlike `'ended'`: there
    // is no told-late wedding, because `rollWedding` raises the card on the week she decides and
    // nothing about it can be learned late. What it reads is the bond's two-rung channel – her own
    // voice against the dry card – which is `'ended'`'s shape one axis smaller.
    case 'engaged':
      return speaksInHerOwnVoice(bond)
        ? presenceLine(ENGAGED_HER_LINE[voice], presence)
        : ENGAGED_DRY
    // ⭐⭐ v83 (wave 7 – T5) – THE EIGHTH KIND, AND THE FIRST WHOSE SPEAKER IS NEITHER HER NOR STAFF.
    // It reads its own `detail` like tier 1 does – the OCCASION is stamped at the raise, so a row
    // live for three weeks is re-worded from the fact it was raised about, never from a season that
    // has since moved on. ⚠ It reads NO `voice`, NO `bond` and NO `register` – the counsel's three
    // reasons, one house over: the spouse is not her, is not the parent-daughter relationship, and
    // the week is hers. ⚠ And NO presence axis: the scene is the spouse's own house, whatever
    // address the girl writes from this week.
    case 'spouse-view': {
      const occasion = SPOUSE_VIEW_OCCASIONS.find((o) => o === detail)
      if (occasion === undefined) throw new Error(`A spouse-view row carries no occasion: ${detail}`)
      return SPOUSE_VIEW_SAID[occasion]
    }
    // ⭐ v83 (wave 7 – T10) – THE NINTH KIND, AND THE ONE-CELL POOL IS ARGUED AT ITS BANNER (§3i):
    // the card quotes nobody, so no voice, no bond, no register, no presence and no detail reach it.
    case 'own-key':
      return OWN_KEY_SAID
    // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – THE TENTH KIND, AND IT IS `'engaged'`'s READING LINE
    // FOR LINE, which is the point rather than a shortcut: the two are one scene at two moments. ⚠ IT
    // READS NO `detail` AND NO `register`, for `'met'`'s own two reasons – its detail is an episode
    // id (a machine value, never a rendered word) and the Mood ladder is not this card's axis, since
    // the announcement is her week's biggest fact whatever the weather. ⚠ AND NO REGISTER AXIS OF ITS
    // OWN: there is no told-late pregnancy, because `rollPregnancy` raises the card on the week the
    // hazard lands. What it reads is the bond's two-rung channel – her own voice against the dry
    // card. ⚠⚠ AND IT READS NOTHING ABOUT THE MARRIAGE, WHICH IS THE DECOUPLING LAW ARRIVING AT THE
    // WORDING (§14): the card is assembled from her voice and the house's distance, so a card
    // re-rendered in a week the carrying episode has since ended says exactly what it said before.
    case 'expecting':
      return speaksInHerOwnVoice(bond)
        ? presenceLine(EXPECTING_HER_LINE[voice], presence)
        : EXPECTING_DRY
    // ⭐⭐⭐ v85 (the return, wave 8 – T6) – THE ELEVENTH KIND, AND THE ONE-CELL POOL IS `'own-key'`'s
    // AND IS ARGUED AT ITS BANNER (§3k): THE CARD QUOTES NOBODY. The completeness rule – «a `quiet` girl
    // can never silently receive a `fiery` girl's line» – binds pools that quote HER, and this one is a
    // question put to the parent about a calendar. So no voice, no bond, no register, no presence and
    // no detail reach it, exactly as they do not reach the independent-life scene. Giving it a voiced
    // line of hers is a wording decision the owner may take at T8's table; a draft that jumped ahead
    // of it would be choosing for him.
    case 'return-plan':
      return RETURN_PLAN_SAID
    // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – THE TWELFTH KIND, AND IT IS `'expecting'`'s READING
    // LINE FOR LINE: her voice against the dry card, on the bond's two-rung channel, and no register
    // axis of its own. ⚠ IT READS NO `detail` (the detail is the week, a machine value) AND NO
    // REGISTER: this is her week's biggest fact whatever the weather. ⚠⚠ AND OPENNESS REACHES IT
    // THROUGH THE VOICE CELLS THEMSELVES rather than through a second axis – §4's «private grieves
    // almost silently» is `quiet` and `deep` having less to say, which is what the four cells are.
    case 'bereavement':
      return speaksInHerOwnVoice(bond)
        ? presenceLine(BEREAVEMENT_HER_LINE[voice], presence)
        : BEREAVEMENT_DRY
    // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – THE THIRTEENTH KIND, AND IT IS `'ended'`'s READING
    // WITH ONE AXIS TAKEN OUT. Her own voice against the dry card on the bond's two-rung channel,
    // exactly as the ending has since v75 – and NO `EndsRegister`, because a latched row always
    // holds the `'met'` receipt and there is no told-late divorce to select. ⚠ IT READS NO `detail`
    // (an episode id, a machine value) AND NO MOOD `register`: this is her week's biggest fact
    // whatever the weather, `'expecting'`'s and `'engaged'`'s own call.
    // ⚠⚠ AND IT READS NO `EndsRead` EITHER, which is `'ended'`'s §3e decision inherited whole: the
    // read moves the PRICE and the HEADING, never her line.
    case 'divorced':
      return speaksInHerOwnVoice(bond)
        ? DIVORCED_HER_LINE[voice]
        : DIVORCED_DRY
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
  // ⭐⭐⭐ v76 T6 – THE SIXTH IS WHOSE READING THIS IS, and `null` – the default – is the STANDING
  // ambiguous frame, byte for byte what shipped. It is one object rather than the two defaulted
  // positionals the later axes above are, for the reason `HeardRead` carries: a defaulted voice is a
  // silent fallback onto another girl's reading, which is the one thing the completeness law forbids.
  // ⚠ THE READ-BEARING KINDS ARE THE ONLY ONES THAT LOOK AT IT: `'fork-opinion'`, `'small-talk'` and
  // `'fork-counsel'` have no read to be plain about, so a non-null here is simply not consulted.
  heard: HeardRead | null = null,
  // ⭐⭐⭐ v77 T6 – THE SEVENTH IS THE OVERTAKE, and `false` – the default – is the STANDING frame,
  // byte for byte what shipped. It is defaulted exactly as the fourth, fifth and sixth are, so every
  // pin waves 2 to 5 wrote keeps calling this with three arguments and keeps asserting the frames it
  // was written against. ⚠ NO ARITY PIN COUNTS THIS FUNCTION'S PARAMETERS – measured 14.09 (the only
  // readers are `lifeBeatPromptFor` and six test files, none of which reads `.length`), so ruling A's
  // «a default must not walk past a pin that counts» does not reach here and ruling J's precedent
  // (`buildCommentary`'s two optional trailing parameters) is the one that does.
  // ⚠ `'met'` IS THE ONLY KIND THAT LOOKS AT IT: a fork, a small talk, a counsel and an ending have
  // no headline to have been read in, so a `true` here is simply not consulted.
  fromHeadline = false,
): string {
  switch (kind) {
    case 'met':
      return metHeadingFor(bond, heard, fromHeadline)
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
    // ⭐ v76 T8 – ONE FRAME, KEYED ON NOTHING, for the line above's reasons exactly. ⚠ AND NOT KEYED
    // ON HIS REGISTER EITHER, which is the decision worth writing down: the shock picks the column of
    // what he SAYS, and a heading that also moved with it would put the parent's own frame on an axis
    // he has not been told about. Ruling O's principle read one step out – a reading may change how a
    // surface reads; it may not quietly acquire a second surface.
    case 'fork-psy':
      return PSY_HEADING
    // ⭐⭐⭐ v75 T4 – TWO AXES, AND NEITHER OF THEM IS A LADDER. The register says which scene this is
    // and the read says what she seems to want from him; the Mood register is the weather of her week
    // and the bond band is the distance between the two of them, and neither is a fact about THIS
    // card. ⚠ THIS IS THE ONE SURFACE THE READ REACHES AT EVERY BOND BAND – see the §3e banner.
    case 'ended':
      return endedHeadingFor(endsRegister, read, heard)
    // ⭐ v83 (the wedding, wave 7 – T2) – ONE FRAME, KEYED ON NOTHING, `COUNSEL_HEADING`'s shape and
    // `ENGAGED_HEADING`'s own note for why: the fact is the same fact at every distance, the bond
    // reaches the card through her line, and a frame that also moved would say the distance twice.
    case 'engaged':
      return ENGAGED_HEADING
    // ⭐ v83 (wave 7 – T5) – ONE FRAME, KEYED ON NOTHING, the counsel's own call a third time: a word
    // from a third person, and neither the week's weather nor the parent-daughter distance is a fact
    // about it. The occasion reaches the player through the SAID line, never the frame.
    case 'spouse-view':
      return SPOUSE_VIEW_HEADING
    // ⭐ v83 (wave 7 – T10) – ONE FRAME, KEYED ON NOTHING: the scene is the same scene at every
    // distance and in every weather, and there is nothing here for an axis to select.
    case 'own-key':
      return OWN_KEY_HEADING
    // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – ONE FRAME, KEYED ON NOTHING, `ENGAGED_HEADING`'s shape
    // and its argument: the fact is the same fact at every distance, the bond reaches the card
    // through her line, and a frame that also moved with it would say the distance twice.
    case 'expecting':
      return EXPECTING_HEADING
    // ⭐ v85 (wave 8 – T6) – ONE FRAME, KEYED ON NOTHING, `OWN_KEY_HEADING`'s shape and its reason: the
    // question is the same question at every distance and in every weather, and there is nothing here
    // for an axis to select. The bond band cannot reach it either, because the card quotes nobody.
    case 'return-plan':
      return RETURN_PLAN_HEADING
    // ⭐⭐⭐ v87 (wave 11 – T5) – ONE FRAME, KEYED ON NOTHING, `EXPECTING_HEADING`'s shape and its
    // argument: the fact is the same fact at every distance, the bond reaches the card through her
    // line, and a frame that also moved with it would say the distance twice.
    case 'bereavement':
      return BEREAVEMENT_HEADING
    // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – TWO AXES AND NOT `'ended'`'s TWO, which is the one
    // place this card's frame parts from the ending's. `'ended'` keys on register x read; this keys
    // on the READ ALONE, because the register cannot vary. ⚠ SO THE READ REACHES THIS CARD AT EVERY
    // BOND BAND, which is §3e's banner inherited verbatim: the heading is the only surface carried
    // at every band, and a read only half the ladder could see would be a hidden number.
    // ⚠ AND NOT ONE OF THE TWO NAMES AN ANSWER – `ENDED_HEADING`'s own rule: «what she wants» is
    // what the parent can see, which of the four things to say about it is his.
    case 'divorced':
      return DIVORCED_HEADING[read]
  }
}

/** ⭐⭐⭐ v85 T2½ (piece 2) – WHICH KINDS OFFER A LISTENING DETOUR, DECLARED PER KIND AND **TOTAL BY
 *  TYPE**. `LIFE_BEAT_BLOCKING`'s own shape and its own argument, applied at the one place in this
 *  file that was not following it: «A `Record<LifeBeatKind, …>` AND NEVER A LIST … a list makes
 *  silence the default, and the next kind ships soft by FORGETTING. The total record makes a missing
 *  kind a COMPILE error, so «does this stop the week» is a sentence somebody had to type.»
 *
 *  ⚠⚠⚠ AND THE STAKE HERE IS HIGHER THAN THERE, WHICH IS WHY THE CHAIN THIS REPLACED WAS THE ONE
 *  PLACE A NEW KIND WENT WRONG IN **SILENCE**. Kept verbatim from the chain's own note, because it is
 *  the record of why this record exists: «The eight records this union keys are TOTAL and a tenth
 *  member reddens them on sight; this predicate is an `if`-chain with a `'fork-opinion'` TAIL, so a
 *  kind left out of it does not fail to compile – it falls through to `FORK_WANTS.find(...)`, finds
 *  no want on a detail that is an episode id, and THROWS from inside `lifeBeatPromptFor`, which is
 *  inside `toSnapshot`, which is what the whole app renders from. Round 42 #15 is the recorded
 *  instance of exactly this shape bricking a save, and its note two functions up says so.» Forgetting
 *  at `LIFE_BEAT_BLOCKING` ships a beat soft; forgetting HERE bricks a career.
 *
 *  ⚠⚠ THE CHAIN'S LAST SENTENCE IS SUPERSEDED AND IS QUOTED RATHER THAN DELETED, so the decision can
 *  be read in the order it was made. T2 wrote: «A total record here would be the structural fix and
 *  is NOT taken in this task – it would re-shape a wave-2 function eight kinds wide for a reason no
 *  brief asked for – but it is carried as a finding in T2's hand-back so the next union member is not
 *  left to luck.» The architect gated T2, read the finding, and took it as T2½ piece 2 – on the
 *  deciding argument that THIS WAVE ADDS ANOTHER KIND (T6's `'return-plan'`), so the wave's own last
 *  engine task was one forgotten clause away from the defect.
 *
 *  ⚠ `null` MEANS «NO DETOUR, AND HERE IS WHY» AND NEVER «NOT DECIDED YET» – `PSY_COUNSEL`'s cell
 *  shape with the opposite meaning, which is worth saying out loud one function apart: there a `null`
 *  is a column somebody still OWES, here it is the answer itself. Every cell below carries the reason
 *  its kind was given, in the words the kind was given it in, and a new kind cannot be added without
 *  writing one.
 *
 *  ⚠ BEHAVIOUR DID NOT MOVE BY ONE BYTE, and that is measured rather than asserted:
 *  tests/wave8-listen-follow-up.test.ts hashes this function's answer over all ten kinds x six
 *  details x four voices x four bond bands, and the digest was taken on the `if`-chain FIRST. */
const LISTEN_FOLLOW_UP: Record<
  LifeBeatKind,
  ((detail: string, voice: Temperament, bond: BondBand) => string | null) | null
> = {
  // ⭐⭐⭐ v87 T5 – `null`, AND IT IS THE ANSWER RATHER THAN A DEBT (this record's own rule, one
  // paragraph up). The detour exists where an answer of the parent's buys MORE of her; this card
  // offers one answer and it is not a question she is waiting on. ⚠ AND THE SILENCE HERE WOULD BE
  // THE WRONG SILENCE: §4's «private grieves almost silently» is about what SHE says, and a detour
  // that made the parent's quiet buy something would price a bereavement on his behaviour, which is
  // the boundary law arriving at the wording.
  bereavement: null,
  // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – `null`, AND IT IS `'ended'`'s CELL INHERITED RATHER THAN
  // A NEW CALL. The detour is «say nothing, and let HER talk», and its reward is more of her; this
  // card's four answers are REACTIONS, one of which is already giving her the room. A second panel
  // promising more of her would be the fictional dishonesty the 10.09 ruling removed from the fork.
  divorced: null,
  // ⭐⭐ THE ONE KIND WITH A DETOUR, AND THE ONLY CELL THAT IS A FUNCTION. It is the tail of the old
  // chain moved whole, line for line and in the same order: the want is resolved off the detail, a
  // malformed detail THROWS BY NAME (which is right and is kept – `lifeBeatSaid`'s own courtesy), the
  // bond bar is asked second, and her continuation is read off the pool last. ⚠ THE THROW IS NOW
  // UNREACHABLE FROM ANY OTHER KIND BY TYPE rather than by enumeration, which is the whole purchase
  // of this record: a kind that forgets its cell cannot compile, so it can no longer fall in here.
  'fork-opinion': (detail, voice, bond) => {
    const want = FORK_WANTS.find((w) => w === detail)
    if (want === undefined) throw new Error(`A fork-opinion row carries no want: ${detail}`)
    if (!speaksInHerOwnVoice(bond)) return null
    return HER_CONTINUATION[voice][want]
  },
  // ⚠⚠ `'met'` HAS NO LISTEN DETOUR, AND THE NULL IS THE RULE RATHER THAN A GAP (brief §2 T6). At the
  // fork «say nothing and let her talk» buys more of her, because she came to say something and has
  // more of it. `'met'` is news: its four answers are REACTIONS, one of which is saying nothing, and
  // a second panel promising more of her would be the fictional dishonesty the 10.09 ruling removed.
  met: null,
  // ⚠⚠ `'small-talk'` RETURNS NULL HERE AND THAT IS NO LONGER THE WHOLE STORY – RE-AIMED BY ROUND 42
  // #15, and the note is kept rather than deleted because a reader has to be able to tell which half
  // expired. WHAT THIS FUNCTION SAYS IS STILL TRUE: tier 1 has no `listen` DETOUR, because it has no
  // `listen` answer – the fork's «say nothing, and let her talk» is not one of its three. WHAT
  // EXPIRED IS THE REASON v74 T8 GAVE FOR IT: «she came with something SMALL and has said it… a
  // second panel promising more of her would be the same fictional dishonesty the 10.09 ruling
  // removed from the fork.» The owner read that panel's ABSENCE as exactly that dishonesty from the
  // other side – «выбрал пункт, чтобы она сказала больше, а попап закрылся» – so tier 1 now answers
  // EVERY stance with a second line of hers. It is assembled in `lifeBeatFollowUps` below, off the
  // situation, and this function is not on that path at all.
  'small-talk': null,
  // ⚠ AND `'fork-counsel'` HAS NONE, for a third reason of its own (v74 T17): the listening detour is
  // «say nothing, and let HER talk», and the reward of it is more of her. The coach has given a
  // professional read and has no second half of it being withheld; a panel offering one would promise
  // words nobody wrote. The card's two acknowledgments are the whole of the beat.
  'fork-counsel': null,
  // ⚠ AND `'ended'` HAS NONE (v75 T4), for a fourth reason of its own. «Say nothing, and let her
  // talk» buys more of her because at the fork she came with something she has more of; here she has
  // said the one fact there is, and GIVING HER ROOM IS ALREADY ONE OF THE FOUR ANSWERS – a detour
  // promising more of her would be a second, unpriced way of doing the thing the card already offers.
  ended: null,
  // ⚠ AND `'fork-psy'` HAS NONE (v76 T8), for the coach's third reason word for word: the listening
  // detour is «say nothing, and let HER talk», and what it buys is more of her. A professional has
  // given a read and has no second half of it being withheld, so a panel offering one would promise
  // words nobody wrote. His two acknowledgments are the whole of the beat.
  'fork-psy': null,
  // ⚠ AND `'engaged'` HAS NONE (v83, wave 7 T2), for `'met'`'s reason at a bigger moment: the
  // announcement is news, its three answers are REACTIONS, and none of them is `listen` – a panel
  // promising more of her would promise words nobody wrote, about a decision she has already
  // finished making.
  engaged: null,
  // ⚠ AND `'spouse-view'` HAS NONE (v83, wave 7 T5), for the coach's reason in another mouth: the
  // detour is «say nothing, and let HER talk», and its reward is more of her. The spouse has said
  // the piece whole, and a panel offering a second half would promise words nobody wrote.
  'spouse-view': null,
  // ⚠ AND `'own-key'` HAS NONE (v83, wave 7 T10), for the plainest reason in this list: the card
  // quotes nobody, so there is nobody a silence could buy more of.
  'own-key': null,
  // ⚠⚠ AND `'expecting'` HAS NONE (v85, wave 8 T2), for `'engaged'`'s reason at a bigger moment: the
  // announcement is news, its three answers are REACTIONS, and none of them is `listen` – a panel
  // promising more of her would promise words nobody wrote, about a thing she has already finished
  // deciding.
  expecting: null,
  // ⭐⭐⭐ AND `'return-plan'` HAS NONE (v85, wave 8 T6) – AND THIS CELL IS THE ONE T2½ PIECE 2 WAS
  // BOUGHT FOR. On the `if`-chain this record replaced, a kind left out did not fail to compile: it
  // fell through to `FORK_WANTS.find(...)`, found no want on a detail that is not one, and THREW from
  // inside `toSnapshot` – round 42 #15's recorded save-bricking shape. The cell below is a compile
  // error when it is missing, which is why this wave's last engine task could be written at all.
  // ⚠ THE REASON IT IS `null` IS THE PLAINEST IN THIS RECORD, `'own-key'`'s word for word: THE CARD
  // QUOTES NOBODY, so there is nobody a silence could buy more of. It is also not a beat that could
  // have a `listen` answer – its two are a scheduling fork, and «say nothing, and let her talk» is not
  // a way of answering a question about which tournaments to enter.
  'return-plan': null,
}

/** ⭐ HER CONTINUATION when the parent only listens – null exactly where the flat pool speaks,
 *  because a girl who answered in one word has nothing more to give a silence (the 10.09 ruling's
 *  own boundary). Exported beside `lifeBeatSaid` so the completeness pin walks this pool the same
 *  way: kind x temperament x want, no silent fallback between voices.
 *
 *  ⚠ THE DECISION PER KIND LIVES IN `LISTEN_FOLLOW_UP` ABOVE, TOTAL BY TYPE (v85 T2½ piece 2) – this
 *  function is now the lookup and nothing else, which is what makes «a forgotten kind» a compile
 *  error instead of a save-bricking throw. Its ANSWER is unchanged: the digest in
 *  tests/wave8-listen-follow-up.test.ts was taken on the `if`-chain this replaced. */
export function lifeBeatListenFollowUp(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  bond: BondBand,
): string | null {
  const followUp = LISTEN_FOLLOW_UP[kind]
  return followUp === null ? null : followUp(detail, voice, bond)
}

/** ⭐⭐⭐ ROUND 42 #15 – WHAT SHE SAYS BACK TO EACH ANSWER, AS ONE LIST. The owner: «выбрал пункт,
 *  чтобы она сказала больше, а попап закрылся… Сейчас выглядит как "сказала А, но никогда не сказала
 *  Б"». That is exactly what tier 1 did: all three replies were bond-0 no-ops, `ANSWER_EVENT` wrote
 *  nothing, and the card closed on the press.
 *
 *  ⚠⚠ IT IS THE `listen` DETOUR GENERALISED AND NOT A SECOND MECHANISM. The dialog already knew how
 *  to hold an answer open, show a line of hers and record on a second control (10.09's ruling); the
 *  only thing that was special about `listen` was that it was the only entry. So the fork keeps its
 *  ONE entry, worded by the ONE function that has always worded it (`lifeBeatListenFollowUp` above –
 *  not re-derived here), and tier 1 gets three.
 *
 *  ⚠ EVERY OTHER KIND RETURNS AN EMPTY LIST, and each one has its own reason written out on
 *  `lifeBeatListenFollowUp`. Those reasons did not change: `'met'` is news and one of its four
 *  answers IS saying nothing; the counsel and the psychologist have given a professional read with no
 *  second half being withheld; an `'ended'` card already offers giving her room as an answer.
 *
 *  ⭐ §8d.2 – AND A `story` IS TWO PARAGRAPHS ON EVERY ROUTE. `shared` goes in front of all three
 *  branches, so «every route delivers a complete little story» is a property of what is assembled
 *  rather than a rule an editor has to remember.
 *
 *  ⚠ THE `done` LABELS ARE THE ENGINE'S TWO SHIPPED WORDS AND NOT NEW COPY (invariant 4): the
 *  continuation closes on `LISTEN_DONE_LABEL` – the same control, the same meaning, the shape 10.09
 *  shipped – and a reaction closes on `CONFIRM_LABEL`, the prologue's own way-on word that round 42
 *  #8 already put on this card. Nothing was coined for this.
 *
 *  ⚠ PURE AND ZERO-DRAW, exactly like the two pool readers above it. */
export function lifeBeatFollowUps(
  kind: LifeBeatKind,
  detail: string,
  voice: Temperament,
  bond: BondBand,
): LifeBeatFollowUp[] {
  if (kind === 'small-talk') {
    const column = smallTalkVoiceOf(detail, voice)
    // A LEGACY row has no situation and therefore no second line of hers – which is the shipped card,
    // unchanged. It is named here rather than left to fall through, because «this cell is still the
    // old beat» is a fact the handoff reports and a reader has to be able to find.
    if (column === null) return []
    return SMALL_TALK_STANCES.map((stance) => ({
      optionId: SMALL_TALK_STANCE_ID[stance],
      said: column.shared === undefined
        ? [column.branches[stance].said]
        : [column.shared, column.branches[stance].said],
      done: stance === 'invite' ? LISTEN_DONE_LABEL : CONFIRM_LABEL,
    }))
  }
  const listen = lifeBeatListenFollowUp(kind, detail, voice, bond)
  return listen === null ? [] : [{ optionId: 'listen', said: [listen], done: LISTEN_DONE_LABEL }]
}

/** ⭐ THE SITUATION'S OWN WORDS FOR THE THREE STANCES (§3 / §8d.1), as the label overlay
 *  `lifeBeatOptionsFor` takes. `undefined` for a legacy row, which is the base table – the three
 *  generic labels that shipped. */
function smallTalkLabels(detail: string, voice: Temperament): Record<string, string> | undefined {
  const column = smallTalkVoiceOf(detail, voice)
  if (column === null) return undefined
  const out: Record<string, string> = {}
  for (const stance of SMALL_TALK_STANCES) out[SMALL_TALK_STANCE_ID[stance]] = column.branches[stance].label
  return out
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

/** ⭐⭐⭐ v77 T6 – DID THE PARENT LEARN IT FROM A HEADLINE? `beatWants`' own shape, asking the row's
 *  episode a second question, and it is DERIVED rather than stamped for `beatEndsRegister`'s stated
 *  reason: both dates are on the row for the life of the career, so the answer this gives on the
 *  raise week is the answer it gives twenty seasons later and the album can re-word an old card.
 *
 *  ⚠⚠ THE DISCRIMINATOR IS `publicWeek === knownWeek`, AND IT IS THE OVERTAKE'S OWN SIGNATURE. §9's
 *  leak is the only writer that can make the two equal: it stamps `publicWeek = world.week` and,
 *  when the parent has not been told yet, pulls `knownWeek` onto the same week so the STANDING
 *  delivery raises the card in that very tick. An ordinary delivery leaves `publicWeek` null (never
 *  equal) or holds a leak week that is strictly LATER than the week he was told – he already knew,
 *  and the papers caught up. The one overlap is a leak landing on the very week the lag had already
 *  run out, and «the story broke the week he was told» is honestly a headline week too.
 *
 *  ⚠ ANY OTHER KIND IS `false`, which is the standing frame and not a neutral stand-in – `beatWants`'
 *  own idiom, and nothing but a `'met'` row ever asks. */
function beatFromHeadline(world: WorldState, row: LifeBeatRecord): boolean {
  if (row.kind !== 'met') return false
  const episode = loveEpisodesOf(world).find((ep) => ep.id === row.detail)
  return episode !== undefined && episode.publicWeek !== null && episode.publicWeek === episode.knownWeek
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
  // ⚠⚠ BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S RULING A,
  // which is the ⚠⚠ block above this function restated in the walls' own terms. The read is
  // RE-DERIVED at answer time from the episode's dates and the seed, and it PRICES the option set
  // (`'ended'`'s space/company delta is +3 or −3 BY IT). Expression is a fact about the world's
  // CURRENT week, not about the episode, so a read that consulted it would be reconstructed against
  // a different girl the moment a flip landed – and `answerLifeBeat` would then charge the opposite
  // sign of what the player chose. ⚠ The limit of the hazard, stated honestly: it is LATENT, not
  // live, because `LIFE_BEAT_BLOCKING.ended === true` stops the week between the raise and the
  // answer and no leaning pass can run in the gap. The trap is for the album (step 6+), which is
  // promised a read of the arc «later». ⚠ THIS SITE AND THE TOLD-LATE ROW IN §6 ARE TWINS BY DESIGN
  // – «the row and the card the same tick raises cannot disagree» – so they move together or not at
  // all, and ruling A says not at all.
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
  // ⭐⭐⭐ v76 T6 – AND THE SEVENTH IS **READ OFF THE ROW**, never re-derived here, which is the whole
  // of ruling E. This function is called on EVERY `toSnapshot`, and hire, release and the rung dial
  // are all commands that produce one – so a re-derived legibility would be re-decided after every
  // command, and firing him with a beat pending would flip this heading from legible to ambiguous
  // under the player's eyes while the kept feed row, whose text was persisted at the raise, still
  // said the other thing. The stamp is written once, by `raiseLifeBeat`, on the week it was true.
  // ⚠ `=== true` AND NOT A TRUTHY READ: absent means «nobody was teaching him to listen» and false
  // means «he was, and this one got past him», and both wear the standing wording (see the field's
  // own note in `shared/protocol/narrative.ts`).
  // ⚠ THE VOICE IS BIRTH – `voiceOf` above, «who she is, for the WORDING alone» (§0.2's fence): the
  // voices read `world.temperament` and never the expressed reading T7 builds.
  const heard: HeardRead | null = row.heard === true ? { voice, wants } : null
  // ⭐⭐⭐ ROUND 42 #15 – EVERY ANSWER THAT EARNS A SECOND LINE OF HERS, in one list. The fork still
  // has exactly the one it always had; tier 1 has three since the small-talk exchange.
  const followUps = lifeBeatFollowUps(row.kind, row.detail, voice, band)
  // ⭐⭐ ROUND 42 #24 – THE FRAME'S REGISTER IS THE SUBJECT'S, NOT THE WEEK'S, ON TIER 1 AND NOWHERE
  // ELSE. Spec §2 cut the one-to-one between the Mood register and the subject («mood sets the
  // WEIGHTS»), so a bright week can bring a worry and the shipped bright heading would contradict her
  // own first line. On a LEGACY row the mapping is the identity of what shipped, so that card is
  // byte-identical – see `SMALL_TALK_FRAME_REGISTER`. Every other kind reads the week's register
  // exactly as before.
  const framed = row.kind === 'small-talk'
    ? (SMALL_TALK_FRAME_REGISTER[row.detail.split(':')[0] as SmallTalkSubject] ?? register)
    : register
  return {
    week: row.week,
    kind: row.kind,
    // ⭐⭐⭐ v77 T6 – THE SEVENTH ARGUMENT IS THE OVERTAKE, derived off the row's own episode exactly
    // as `wants` above is, and it reaches NOTHING ELSE in this prompt: `said`, `options` and
    // `listenFollowUp` are assembled from the same facts they always were, so a card raised by the
    // leak deep-equals an ordinary one except for this one frame. That equality is the brief's own
    // boundary and T6's pin asserts it directly rather than trusting this sentence.
    heading: lifeBeatHeading(row.kind, framed, band, endsRegister, read, heard, beatFromHeadline(world, row)),
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
      // ⭐⭐⭐ ROUND 42 #15 – THE ROW'S OWN WEEK AND NOT THIS ONE. See `lifeStageAt`: a soft row lives
      // three weeks, and re-deriving the stage from the CURRENT week would re-word a waiting
      // conversation into a room it was never in – and, for a situation with only one frame, into a
      // room it has no line for at all, which throws inside `toSnapshot`. Byte-identical for every
      // blocking kind, because a blocking row stops the week.
      // ⚠ RE-AIMED 26.09 (B-P3-07): «stops the week» was false inside `resumeFromCollege` until
      // B-01's ruling 2(a) made that loop pause on `'life'`. See `lifeStageAt`'s own note for the
      // measurement; the argument is unchanged, it is the exception that closed.
      lifeStageAt(world, row.week),
      forkStopDriverOf(world.spirit ?? ECONOMY.spirit.baseline, world.bond ?? ECONOMY.bond.start),
      // ⭐ v75 T4 – THE NINTH IS THE ENDING'S REGISTER, threaded exactly as `wants`, `stage` and
      // `driver` were, and for the same reason: a parameter with a shipped default, so every pin
      // waves 2 and 3 wrote keeps calling `lifeBeatSaid` with five to eight arguments and keeps
      // asserting the lines it was written against. ⚠ THE READ IS NOT HANDED IN, because her line
      // does not carry it – the §3e banner is where that decision lives.
      endsRegister,
      // ⭐⭐⭐ ROUND 44 – THE TENTH IS **READ OFF THE ROW**, never re-derived here, and it is the
      // `heard` stamp's own ruling one field over: this function runs on EVERY `toSnapshot`, and a
      // re-derived frame would be re-decided after every command. His own rule is stronger than
      // that – a frame may not change after a save, a reload, OR THE POOL GROWING – and only a
      // stored id survives the third. `undefined` on a pre-v81 row, which renders the first line of
      // the presence's pool: the sentence that row has already shown him.
      row.frame,
    ),
    // ⚠ THE ROW'S OWN KIND PICKS THE ANSWER SET (v74). A flat list here would have offered a girl's
    // «there is someone» the fork's three buttons, which is the defect the per-kind record exists to
    // make impossible – and `answerLifeBeat` re-validates against THIS same reading.
    // ⭐⭐⭐ ROUND 42 #15 – AND THE FOURTH ARGUMENT IS THE SITUATION'S OWN WORDS FOR THE THREE
    // STANCES (§8d.1: «a `respond` branch must name the parent's actual opinion»). It is `undefined`
    // for every other kind and for a legacy row, which is the base table – so this line hands back
    // byte-identical options for every card that shipped before this round.
    options: lifeBeatOptionsFor(
      row.kind,
      wants,
      read,
      row.kind === 'small-talk' ? smallTalkLabels(row.detail, voice) : undefined,
    ).map((o) => ({ id: o.id, label: o.label })),
    followUps,
    // ⭐⭐ ROUND 42 #8 – the confirm control's word, engine-assembled like every other word on the
    // card. One constant, both entrances (the blocking prompt and the soft invite ride this same
    // assembler), so the two cards cannot drift apart.
    confirm: CONFIRM_LABEL,
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
/** ⭐ v83 (wave 7 – T5) – THE INVITATION LINE, PER KIND, and the record is TOTAL for
 *  `LIFE_BEAT_BLOCKING`'s own reason: a list would let the next soft kind ship wearing tier 1's
 *  sentence by FORGETTING, and «what does the Home card say for this kind» must be a line somebody
 *  typed. ⚠ `null` on every BLOCKING kind – those rows stop the week and never reach the soft
 *  surface, so a card line for them would be dead copy pretending to be reachable.
 *  ⚠ THE `'small-talk'` CELL IS THE SHIPPED CONSTANT, REFERENCED AND NOT RE-TYPED (invariant 4):
 *  tier 1's card is byte-identical to what it has always been. */
const SOFT_BEAT_CARD: Record<LifeBeatKind, string | null> = {
  // ⭐ v87 T5 – `null`, ON THE RECORD'S OWN RULE: the kind BLOCKS, so it never reaches the soft
  // surface and a card line for it would be dead copy pretending to be reachable.
  bereavement: null,
  // ⚠ v88 (the parting, wave 12 – T1) – `null`, ON THE RECORD'S OWN RULE AND NOT AS A CHOICE: the
  // kind BLOCKS, so the row stops the week and never reaches the soft surface. A card line for it
  // would be dead copy pretending to be reachable.
  divorced: null,
  'fork-opinion': null,
  met: null,
  'fork-counsel': null,
  ended: null,
  'fork-psy': null,
  engaged: null,
  // ⚠ v85 (wave 8 – T2) – `null`, ON THE RECORD'S OWN RULE AND NOT AS A CHOICE: `'expecting'` is
  // BLOCKING, so the row stops the week and never reaches the soft surface. A card line for it would
  // be dead copy pretending to be reachable, which is what the `null` on every blocking kind says.
  expecting: null,
  // ⚠ v85 (wave 8 – T6) – `null`, ON THE RECORD'S OWN RULE AND NOT AS A CHOICE: `'return-plan'` is
  // BLOCKING, so the row stops the week and never reaches the soft surface. A card line for it would
  // be dead copy pretending to be reachable.
  'return-plan': null,
  'small-talk': SMALL_TALK_CARD,
  'spouse-view': SPOUSE_VIEW_CARD,
  'own-key': OWN_KEY_CARD,
}

export function buildSoftBeatInvite(world: WorldState): SoftBeatInvite | null {
  const row = liveSoftBeat(world)
  if (row === null) return null
  // ⚠ THE `??` ARM IS FOR A HAND-BUILT WORLD ONLY: `liveSoftBeat` returns non-blocking rows, every
  // non-blocking cell above is a string, and a blocking row reaching this line would already be two
  // bugs deep – it falls onto tier 1's shipped card rather than onto a crash inside `toSnapshot`.
  return { card: SOFT_BEAT_CARD[row.kind] ?? SMALL_TALK_CARD, prompt: lifeBeatPromptFor(world, row) }
}

// =================================================================================================
// 4. RAISING A BEAT, AND ANSWERING ONE
// =================================================================================================

/** ⭐ THE ONE WRITER OF A `lifeLog` ROW. Append-only and never pruned: the album and the census both
 *  read the whole life later, and a row dropped for tidiness is a biography with a hole in it.
 *
 *  ⚠ IT TAKES THE DETAIL RATHER THAN COMPUTING IT, so every beat kind's own trigger owns its own
 *  draw and this stays the plumbing. `raiseForkOpinion` (world/endings.ts's caller) is the first. */
export function raiseLifeBeat(world: WorldState, kind: LifeBeatKind, detail: string, heard?: boolean, frame?: string): void {
  world.lifeLog ??= []
  const row: LifeBeatRecord = { week: world.week, kind, detail, answer: null }
  // ⭐⭐⭐ v76 T6 – THE STAMP, AND THE KEY IS WRITTEN ONLY WHEN SOMEBODY WAS ACTUALLY TEACHING HIM TO
  // LISTEN (ruling E). `undefined` leaves the row the exact four-field object every row before this
  // commit was, so a career with no psychologist in it produces byte-identical `lifeLog` rows – which
  // is half of why no schema bump is owed and why the frozen corpus cannot see this step.
  // ⚠ THE VALUE IS DECIDED BY THE CALLER, ON THE SAME LINE-RUN AS THE FEED ROW IT SHARES A COIN WITH.
  // One uniform per raise, two consumers: the kept row's TEXT (persisted here and now) and this stamp
  // (read back by every later prompt). A second draw for the second consumer would be one fact with
  // two sources of truth, and they would part the first week a rung changed.
  if (heard !== undefined) row.heard = heard
  // ⭐⭐⭐ ROUND 44 / v81 – THE FRAME, STAMPED ONCE AND NEVER RE-DERIVED. `undefined` leaves the row
  // the exact object every row before this commit was, which is what makes the migration trivial: a
  // beat of any other kind takes no frame at all, and an old small-talk row falls back to the first
  // line of its presence's pool – the sentence it has already shown him.
  // ⚠⚠ AND IT IS PERSISTED RATHER THAN DERIVED FOR ONE REASON ONLY, HIS: «the frame must not change
  // after a save, a reload, OR THE ARRAY GROWING». The first two a purpose-scoped stream keyed on the
  // week survives perfectly; the third it cannot, because a pool of ten re-derives a different member
  // for a beat already on screen.
  if (frame !== undefined) row.frame = frame
  world.lifeLog.push(row)
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
  // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – ...AND THE `'expecting'` ANSWER IS THE ONE BEAT IN THIS
  // FILE WHOSE WORD OUTLIVES THE CARD. One answer, TWO consequences and zero new meters: the delta
  // one line up is the standing machinery, and this writes the same answer as a GRADE on the
  // pregnancy, because T5's return decision and T4's postpartum recovery both read it – the research
  // row's own «support only – reaction sets recovery trajectory», which is a claim about months from
  // now and therefore cannot live on a card that closes this week.
  //
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument twenty lines up: a
  // kind that stopped writing a feed row must not silently stop writing the grade, and «the write is
  // below a `return`» is exactly how that would happen.
  //
  // ⚠⚠ GUARDED ON THE RECORD AND NOT ON THE KIND ALONE, and the `null` arm is REAL rather than
  // defensive dressing. `rollPregnancy` writes the record and raises the row in one line-run, so on
  // every state the sim produces a pending `'expecting'` row has a pregnancy under it – but §D of
  // tests/wave3-reaction.test.ts raises a beat of every BLOCKING kind on a hand-built world and
  // drains it, and forty benches do the same shape. Those worlds have no pregnancy, and a throw here
  // would make the drain helper the thing that breaks. The grade is simply not written when there is
  // nothing to write it on, which is the honest reading of that world.
  //
  // ⚠ THE OPTION ID IS ALREADY RE-VALIDATED (`chosen` came from the priced set), so the lookup below
  // can only miss if the two tables part – and then it THROWS BY NAME rather than writing
  // `undefined` onto a field typed three ways. T1's counsel cell made the same call for the same
  // reason: an unreachable branch that fails loudly beats one that writes a lie.
  if (rows[target].kind === 'expecting' && world.pregnancy !== null) {
    const grade = EXPECTING_SUPPORT[chosen.id]
    if (grade === undefined) throw new Error(`An expecting answer has no support grade: ${chosen.id}`)
    world.pregnancy.support = grade
  }
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – ...AND THE RAMP'S ANSWER IS THE SECOND BEAT IN THIS FILE
  // WHOSE WORD OUTLIVES THE CARD, on the identical shape one branch up and for the same reason: what
  // a season is BUILT out of is a claim about the months ahead, so it cannot live on a card that
  // closes this week. It is written to `world.comeback`, which is where RULING A (20.09) moved
  // `returnPlan` precisely because `world.pregnancy` is cleared on the week this beat is raised.
  //
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument: a kind that stopped
  // writing a feed row must not silently stop writing the plan.
  //
  // ⚠⚠ GUARDED ON THE RECORD AND NOT ON THE KIND ALONE, and the `null` arm is REAL rather than
  // defensive dressing – `'expecting'`'s own argument verbatim: §D of tests/wave3-reaction.test.ts
  // raises a beat of every BLOCKING kind on a hand-built world and drains it, and forty benches do the
  // same shape. Those worlds have no comeback, and a throw here would make the drain helper the thing
  // that breaks. The plan is simply not written when there is nothing to write it on.
  //
  // ⚠ THE OPTION ID IS ALREADY RE-VALIDATED, so the lookup can only miss if the two tables part – and
  // then it THROWS BY NAME rather than writing `undefined` onto a field typed three ways.
  if (rows[target].kind === 'return-plan' && world.comeback !== null) {
    const plan = RETURN_PLAN_CHOICE[chosen.id]
    if (plan === undefined) throw new Error(`A return-plan answer has no plan: ${chosen.id}`)
    world.comeback.returnPlan = plan
  }
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
  // ⭐⭐⭐ v76 T8 – ...AND THE SEAT CALLS, ONE LINE LATER, WHICH IS THE COMMENT ABOVE CASHED IN. The
  // whole of the psy arc is this line plus a `true` in `LIFE_BEAT_BLOCKING` and its rows in the two
  // pools: the queue already answers in `lifeLog` order, `answerFork` already waits for every blocking
  // row, and neither of them changed by a byte.
  //
  // ⚠⚠ `psychologistWorksThisWeek` AND NOT `world.psychologistHired` – the architect's ruling J, which
  // supersedes the wave brief's own wording. `resolvePsychologist` opens with this same predicate, so
  // a seat stood down by a college freeze or a booked family week is not billed that week and must not
  // work that week either: pay nothing, receive nothing (the travelling-team §4 legibility law read
  // the right way round). The flag survives both stand-downs, so the call resumes by itself after.
  // ⚠ NO FOCUS IS ASKED FOR. The fork is the SEAT's, not a year-focus's – the retainer buys the man,
  // and the man has a view about the biggest week of the career whatever he is working on this year.
  //
  // ⚠⚠ AND THE SHOCK IS READ HERE, AT THE RAISE, FOR THE WORDING COLUMN AND NOTHING ELSE (§3f). It
  // goes into the `detail` beside the driver because this row must stay reconstructible for the life
  // of the career – `'fork-counsel'`'s own argument – and because a price is never derived from it:
  // `LIFE_BEAT_OPTIONS['fork-psy']` has no overlay in `lifeBeatOptionsFor`, so the priced set the
  // answer is re-validated against is the same object in both columns.
  if (counselDriver !== null && psychologistWorksThisWeek(world))
    raiseLifeBeat(world, 'fork-psy', `${world.spiritShock?.kind ?? 'plain'}:${counselDriver}`)
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
 *  girl from the one the save holds.
 *
 *  ⚠⚠ THIS BODY MUST NEVER BE RE-POINTED AT `expressedTemperamentOf`, AND v76's T7 IS THE WAVE THAT
 *  HAD THE CHANCE TO (the architect's RULING A). Re-pointing here would have been one line instead
 *  of three, and it would have been wrong: of the five call sites this function had, THREE are
 *  mechanics evaluated now and read expression, and TWO re-derive a persisted price and must read
 *  BIRTH. A single body cannot be both. So the swaps are per CALL SITE – `rollArrival`,
 *  `arrivalEligible`'s cooldown and `rollEnds` now call `expressedTemperamentOf` directly; this
 *  function survives as the BIRTH reading and keeps exactly the two callers ruling A left it
 *  (`beatEndsRead` and the told-late row in §6), each carrying its own ⚠⚠ note.
 *
 *  ⚠ IT IS NOT `voiceOf`, WHICH IS ALSO BIRTH AND IS A DIFFERENT LAW. `voiceOf` is «who she is, for
 *  the WORDING alone» – who-she-is §3's fence, «the voice bibles read birth alone». This one is
 *  birth because of ruling A's re-derivation rule. Two reasons, two functions, and merging them
 *  would lose the distinction the next wave needs. */
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
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A. The cooldown is EVALUATED NOW and
  // stored nowhere: `lastEndedWeek` is the persisted fact and this only asks how long a girl like
  // her waits. So it reads the girl she is this week, and a `quiet` girl whose walls came down waits
  // the shorter `sunny`/`fiery` span from the very next tick – which is the point of the re-point.
  // ⚠ It is the MEETING half of the cooldown (who-she-is §1: openness owns «the meeting»), which is
  // why it is here and not beside the ends hazard.
  if (ended !== null && world.week - ended < life.cooldownWeeks[expressedTemperamentOf(world)]) return false
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
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A, and this is the site the ruling
  // is easiest to get wrong at because ONE read feeds three things. `arrivalHazardFor` is evaluated
  // now; `drawPartnerWants` and `drawRawLag` are STAMPED onto the episode row (`wants`, `knownWeek`)
  // at the week they were true. Ruling A's law: «a draw whose RESULT IS PERSISTED may read
  // EXPRESSION – it is stamped at the week it was true», so all three read the girl she is THIS
  // week. A girl behind walls meets fewer people and tells later; that is the walls doing exactly
  // what §2a says they do. ⚠ The two `drawEndsRead` sites (`beatEndsRead`, and the told-late row in
  // §6) are the other half of the same ruling and stay on BIRTH – see their own notes.
  const temperament = expressedTemperamentOf(world)
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
  // ⚠⚠ THE FOUR v77 FIELDS ARE WRITTEN HERE AT THEIR BIRTH VALUES AND THIS IS NOT A WRITER (the
  // spotlight, wave 6 – T1). `createWorld`'s literal is where a new WORLD key gets its identity
  // value; a `LoveEpisode` has no `createWorld`, and this push is the ONE place a row is ever born
  // («the ONE writer of a `loveEpisodes` row», the block at the head of this section) – so it is the
  // exact counterpart, and the four values are the same four the v76 -> v77 migration back-fills on
  // every historical row. A new attachment starts private to the family and unvoiced: the world has
  // not learned (`publicWeek: null`), so no story has run and none has run wrong
  // (`publicWrong: false`), and the booth has voiced neither fact (`airedMetWeek` / `airedEndedWeek`
  // null). The LEAK that can set `publicWeek` is T6 and the booth stamp is T7; nothing on this tree
  // moves any of the four off these values.
  // ⭐⭐ v83 (the wedding, wave 7 – T1) APPENDS THE LAST TWO AT THEIR BIRTH VALUES, on the v77
  // paragraph's own argument above: this push is the one place a row is born, and the two values are
  // the same two the v82 -> v83 migration back-fills on every historical row. A new attachment is
  // not married (`latchedWeek: null` – the latch is T3's write, weeks after an engagement that
  // cannot fire before 23) and nobody has been named (`partnerName: null` – the name is written ONCE
  // at the engagement beat by `partnerNameFor`, never here and never re-derived).
  world.loveEpisodes.push({
    id,
    sinceWeek,
    endedWeek: null,
    knownWeek,
    wants,
    partnerId: id,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek: null,
    partnerName: null,
  })
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

/** ⭐⭐ v76 T6 – THE SAME WEEK, WRITTEN DOWN BY A PARENT WHO WAS TAUGHT TO READ HER – 8 drafts, and
 *  the durable half of the focus. The card is answered once and gone; this row is `keep: true`, so
 *  what a coached parent understood is what the album still says twenty seasons later.
 *
 *  ⚠ NO BOND COLUMN, WHICH IS `ENDED_LATE_EVENT`'s refusal inherited rather than re-decided: that
 *  pool «deliberately did not guess at» the told / found-out column, and the reason holds harder
 *  here. The standing row's two columns record HOW the news surfaced; what these eight record is what
 *  she wanted done with it, which is the same fact on every rung of the ladder.
 *
 *  ⚠⚠ AND NOT ONE OF THEM CLAIMS SHE SPOKE – the §3f banner's rule, and this pool is where it bites
 *  hardest, because the standing row it replaces has a column that says she did NOT
 *  (`'found-out'`). Every clause below is either the drawn read or a standing habit of hers.
 *
 *  ⚠ THE SECOND SENTENCE IS THE PARENT'S OWN, AND IT IS THE WHOLE OF WHAT THE SEAT SOLD HIM. It
 *  records that he heard her – never who taught him, never a session, never a word of hers he was
 *  told second-hand. The focus coaches the parent; her sessions are hers. */
const MET_EVENT_HEARD: Record<Temperament, Record<LoveEpisode['wants'], string>> = {
  sunny: {
    open: 'There is someone in her life, and she does not mind who knows. There was no ask hidden in it.',
    private: 'There is someone in her life, and it is to stay between us. The ask was in the part she left out.',
  },
  fiery: {
    open: 'There is someone in her life. No line drawn round it, and we took it as it came.',
    private: 'There is someone in her life. She drew a line round it, and we read the line.',
  },
  quiet: {
    open: 'There is someone in her life, and it was never a thing she was keeping. That was understood.',
    private: 'There is someone in her life, and it is to go no further than us. That was understood.',
  },
  deep: {
    open: 'There is someone in her life. She asks nothing of us about it, and nothing needed adding.',
    private: 'There is someone in her life. It is hers to keep, and we knew it without being asked.',
  },
}

/** ⭐⭐⭐ v75 T5 – THE ENDING'S OWN KEPT ROW, ON THE TOLD-NOW PATH. The album's other half: wave 3
 *  wrote «there is someone» and this is the week that stops being true, for a parent who already knew
 *  there was somebody.
 *
 *  ⚠⚠ IT IS BUILT HERE RATHER THAN IN T4 BECAUSE THE TREE SAID SO IN NINE PLACES AND THE BRIEF SAID
 *  SO IN ONE. `rollEnds` carried «NO FEED ROW ON THIS PATH (T5's, per the commit order)», and
 *  `loveEpisodes.ts`, `phaseHerWeek.ts`, `tests/spirit.test.ts`, `tests/wave4-ends.test.ts` and
 *  `tests/wave4-ended-beat.test.ts` all said the same thing in their own words. ⚠ THE T5 BRIEF
 *  NEVERTHELESS CALLS THIS ROW «T4's» and asks only for a STAMP on it – that is the one sentence of
 *  the brief this step does not build, because the row it names does not exist. Reported rather than
 *  worked around, which is the wave's standing rule; see the commit message.
 *
 *  ⚠⚠ WITHOUT IT THE COLUMN IS SILENT ON THE LOUDEST SCENE THE LAYER HAS. The told-now ending raised
 *  a card and, once answered, an `'info'` reply row – so the feed said what the PARENT did and never
 *  what happened. A glyph column bought for navigation («met someone · it ended») that cannot mark
 *  «it ended» for the common case is a column that half exists.
 *
 *  ⚠ ONE LINE, NO READ AXIS, NO BOND COLUMN – and both absences are ruled rather than skipped.
 *  Ruling I puts her read on «the HEADING and the told-late feed row» and enumerates its own surfaces
 *  as «4 heading cells plus 2 feed rows»; a read on this row would be a third surface, which is a
 *  ruling change and not a builder's. The bond band is `MET_EVENT`'s column and `ENDED_LATE_EVENT`
 *  refused to guess at it for T6 – this refuses the same way, for the same reason.
 *
 *  ⭐⭐⭐ AND THE REFUSAL WAS TESTED AND UPHELD – wave-5 ruling O (13.09), after T6 built a legible
 *  told-now row behind the listen focus and flagged it. **A focus may change how an existing surface
 *  reads; it may not create a surface.** The prompt goes up on this same tick and its heading already
 *  carries the read, so a row repeating it is one piece of news told twice. This sentence is what the
 *  album keeps for a told-now ending on EVERY career, coached or not – see `endedKeptRow`'s first
 *  line, where that is one branch and one pin.
 *
 *  ⚠ IT STATES WHAT THE WEEK HELD AND NOTHING ELSE: no reason, no fault, no channel the sim does not
 *  hold (the two-tier honesty law), no name, no gender, no `amountCents` and no price in any word of
 *  it (rule 4). ⚠ A DRAFT, AND T6 OWNS THE MATRIX – invariant 4 makes the final wording the owner's.
 *
 *  ⭐⭐⭐ RE-WRITTEN BY T6, AND THE OLD SENTENCE IS NAMED SO THE JUDGMENT CAN BE OVERRULED. It read
 *  «There was someone in her life, and this week there is not.» Two things were wrong with it and
 *  neither is a matter of taste.
 *
 *  1. ⚠⚠ IT INTRODUCED A PERSON THE ALBUM HAD ALREADY INTRODUCED. This row is the TOLD-NOW one, which
 *     fires only behind the `'met'` receipt – so a kept `MET_EVENT` row seasons up the same feed has
 *     already said «there is someone in her life», and both rows are `keep: true`, so they are read
 *     together for the life of the career. A closing row that opens by announcing the person reads as
 *     the album meeting her for a second first time. What this row is FOR is closing the earlier one.
 *  2. ⚠ «and this week there is not» IS A NARRATOR'S FIGURE, not a statement of the week. The antithesis
 *     performs the loss instead of recording it, which is the move the banned-tail list is a sample of
 *     rather than the whole of – and the lint's list is literal, so it would never have caught this.
 *
 *  ⚠ WHAT THE REPLACEMENT ASSERTS, AND ITS LICENCE FOR EACH HALF. «It ended this week» – `endEpisode`
 *  wrote `endedWeek = world.week` four lines above this row's write site. «There is nobody in her life
 *  now» – `activeEpisode` is null by construction once the row is dated, and the cooldown forbids a
 *  re-arrival on the same tick (T2's own pin), so it is the world's state and not a guess. Nothing
 *  else: no reason, no fault, no channel, no name, no gender, no duration, no bond band. */
const ENDED_NOW_EVENT = 'It ended this week, and there is nobody in her life now.'

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
  // ⭐⭐ RE-CUT BY v75 T6, AND THE TAIL IS WHERE BOTH ROWS FAILED. `company` said «and she has been
  // round more since»: a count of VISITS the sim models nowhere, at a stage where the parent may be
  // four hundred miles away, plus a «since» that is empty in the week the row is written. `space` said
  // «and she has not brought it up since» – the same empty span, and one conjugation from a banned
  // tail besides. ⚠ THE READ ITSELF IS LICENSED and stays: `drawEndsRead` is a persisted draw off her
  // own openness register, so «what she wants» is a fact of the world here and not the narrator
  // guessing at her interior. What the two rows carry now is that fact, in the present, with nothing
  // round it. ⚠ AND «it was over before we heard of it» IS TRUE ON BOTH PATHS: `rollEnds` writes
  // `endedWeek` at §8 and `deliverKnownPartner` reads it at §6 of the same tick, so even ruling A's
  // collision week hears of an attachment that had already ended.
  // ⚠ RE-CUT 12.09 with the heading cells above – the same presence axis, the same ruling.
  space: 'There had been someone in her life, and it was over before we heard of it. She wants the room to herself.',
  company: 'There had been someone in her life, and it was over before we heard of it. She does not want to be on her own with it.',
}

/** ⭐⭐ v76 T6 – THE ENDING'S KEPT ROW AS A COACHED PARENT WRITES IT – 8 drafts, THE TOLD-LATE ROW
 *  ALONE, keyed voice × her read.
 *
 *  ⚠⚠⚠ RE-CUT BY T6b UNDER RULING O (13.09), AND THE HALF THAT CAME OUT IS RECORDED SO THE JUDGMENT
 *  CAN BE RE-OPENED RATHER THAN RE-DISCOVERED. T6 shipped this pool as voice × REGISTER × read – 16
 *  cells, the told-now half of them putting the space-vs-company read on a row that has never carried
 *  it – and flagged it as the one thing it wanted ruled. The architect ruled it OUT:
 *
 *    **A focus may change how an existing surface reads. It may not create a surface.**
 *
 *  The told-now card's prompt is raised on the SAME TICK as this row, and the heading already tells
 *  the parent what she wants; a row repeating it is one piece of news told twice, and giving it a read
 *  adds information it has never carried – invariant 4's territory and the owner's, not a wave about
 *  a psychologist. So `ENDED_NOW_EVENT`'s own refusal («a third surface, which is a ruling change and
 *  not a builder's») now holds in BOTH arms: heard or not, the told-now row is that one sentence, and
 *  `endedKeptRow` returns it whatever frame it is handed. Wave-4 ruling I's enumeration – «4 heading
 *  cells plus 2 feed rows» – is therefore intact, and what the focus moved on the ending is the
 *  HEADING (`ENDED_HEADING_HEARD`, 16 cells) plus THIS row, which is ruling I's second feed row.
 *
 *  ⚠ THE TOLD-LATE HALF STAYS, and the asymmetry is the ruling's own test rather than an exception to
 *  it. The question is «did this surface already carry the read»: `ENDED_LATE_EVENT` is indexed BY THE
 *  READ and has been since wave 4, so a legible version changes how an existing surface reads and
 *  creates nothing; `ENDED_NOW_EVENT` is one string and never carried it. The same test one pool over:
 *  `MET_EVENT_HEARD` is allowed because the met kept row already carried her `wants`. ⚠ AND WHAT IS
 *  UNIQUE ABOUT THIS ROW IS DURABILITY, NOT EXCLUSIVITY – both registers' HEADINGS carry the read too;
 *  what the told-late row alone is, is the surface that OUTLIVES the card (`keep: true` against a card
 *  answered once and gone), which is `ENDED_LATE_EVENT`'s own stated reason for carrying it.
 *
 *  ⚠ NO BOND COLUMN – `ENDED_LATE_EVENT`'s refusal inherited rather than re-decided.
 *
 *  ⚠ THE READ HALF OF EVERY CELL IS THE STANDING POOL'S OWN WORDING, kept deliberately: «she wants
 *  the room to herself» / «she does not want to be on her own with it» is one fact with one sentence,
 *  and a second way of saying it would put two readings of one draw into the album.
 *
 *  ⚠ AND THE CLAUSE IN FRONT OF IT IS A STANDING HABIT OF HERS, never this week's telling – the §3f
 *  banner's rule. `sunny` puts being alright first and the asking after; `fiery`'s heat is never the
 *  measure of a thing; `quiet` puts the arrangements in front of herself; `deep` gives a thing its
 *  exact size, so few words are never a small thing. */
const ENDED_EVENT_HEARD: Record<Temperament, Record<EndsRead, string>> = {
  sunny: {
    space: 'There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she wants the room to herself.',
    company: 'There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she does not want to be on her own with it.',
  },
  fiery: {
    space: 'There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she wants the room to herself.',
    company: 'There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she does not want to be on her own with it.',
  },
  quiet: {
    space: 'There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she wants the room to herself.',
    company: 'There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she does not want to be on her own with it.',
  },
  deep: {
    space: 'There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she wants the room to herself.',
    company: 'There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she does not want to be on her own with it.',
  },
}

/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND, so «which sentence does the album keep» has exactly one
 *  spelling and the ambiguous arm is provably the bytes that shipped. `null` is the standing row.
 *
 *  ⚠ THEY TAKE THE SAME `HeardRead | null` THE HEADING TAKES, because the row and the card raised in
 *  the same tick read ONE coin – the raise site draws it once and hands it to both. Two calls would
 *  be two values on one key's worth of meaning, and the surfaces would disagree.
 *
 *  ⚠ EXPORTED FOR THE COMPLETENESS PIN, `lifeBeatSaid`'s own reason: these pools are module-private
 *  `const`s and the confidentiality lint has to reach EVERY cell of them without posing a world per
 *  cell. The tail-lint reads this file's source for exactly this problem; a pure reader is exact
 *  where a source cut is fragile. */
export function metKeptRow(band: BondBand, wants: LoveEpisode['wants'], heard: HeardRead | null = null): string {
  return heard === null
    ? MET_EVENT[metRegisterOf(band) === 'dry' ? 'found-out' : 'told'][wants]
    : MET_EVENT_HEARD[heard.voice][wants]
}

export function endedKeptRow(endsRegister: EndsRegister, read: EndsRead, heard: HeardRead | null = null): string {
  // ⭐⭐⭐ RULING O, AND IT IS SPELT AS THE FIRST LINE OF THIS FUNCTION BECAUSE THAT IS WHERE IT CAN BE
  // PINNED. The told-now row is READ-FREE IN BOTH ARMS – one string, whatever frame the raise site
  // hands over – so «is this row legible» has the same answer on a coached week as on any other, and
  // the pin is a byte-identity across the toggle rather than a promise in a comment. See
  // `ENDED_EVENT_HEARD`'s ⚠⚠⚠ note for the ruling and `ENDED_NOW_EVENT`'s for what the sentence
  // asserts. ⚠ THE `read` ARGUMENT IS DELIBERATELY NOT CONSULTED HERE and the register is tested
  // FIRST: a branch order that asked about `heard` first would put the legible arm in front of the
  // ruling, which is precisely the shape that shipped and had to be re-cut.
  if (endsRegister === 'told-now') return ENDED_NOW_EVENT
  return heard === null ? ENDED_LATE_EVENT[read] : ENDED_EVENT_HEARD[heard.voice][read]
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
  // ⭐⭐⭐ v76 T6 – ONE COIN PER RAISE, DRAWN HERE AND SPENT TWICE. `seed:psy:listen:<kind>:<week>`
  // decides whether the kept row below and the card raised beside it say plainly what she wants; the
  // row's TEXT is persisted now and the card's heading is re-assembled on every snapshot, so the two
  // must come off ONE value or they will part the first week a rung changes (ruling E). `null` when
  // nobody is teaching him to listen – and it is a null with ZERO DRAWS behind it, not a discarded
  // one. ⚠ THE KIND IS THE ONE BEING RAISED, which is why the two branches ask separately.
  if (due.endedWeek !== null) {
    const heardEnd = listenHeardNow(world, 'ended')
    // ⚠ THE VOICE IS `voiceOf` AND NOT `temperamentOf` – «who she is, for the WORDING alone», which
    // is §0.2's fence: the voices read BIRTH and T7's expressed reading never reaches a pool.
    const frameEnd: HeardRead | null = heardEnd === true ? { voice: voiceOf(world), wants: due.wants } : null
    addEvent(world, {
      week: world.week,
      type: 'life',
      keep: true,
      // ⚠ NO AMOUNT (rule 4), and the read comes off the ENDING's own week – `beatEndsRead`'s twin
      // through the same derivation, so the row and the card the same tick raises cannot disagree.
      // ⚠⚠ BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S
      // RULING A. The sentence directly above is the whole argument: this row and `beatEndsRead`'s
      // card are TWINS, the card's read is a PRICE INPUT that `answerLifeBeat` re-derives, and twins
      // that read two different girls would print one wording and charge another. The TEXT here is
      // persisted; the READ behind it is not, and re-derivation against a moved expression would
      // rewrite history. ⚠ THE TEMPERAMENT-INDEXED POOLS BESIDE IT READ BIRTH FOR THE OTHER REASON
      // (§0.2's fence, `voiceOf` above) – two different laws landing on one line, both saying birth.
      text: endedKeptRow('told-late', drawEndsRead(world.seed, due.endedWeek, temperamentOf(world)), frameEnd),
      // ⭐⭐⭐ v75 T5 – THE KIND, STAMPED. `WorldEvent.lifeKind` (T1's field) is what lets the feed's
      // glyph column tell one life row from another; this is the told-late ENDING row, so `'ended'`.
      // ⚠ IT IS THE BEAT KIND AND NOT THE REGISTER: told-now and told-late are two wordings of one
      // piece of news, and a column that marked them differently would be telling the player which of
      // the two scenes he got, which is a fact about the LAG and not about her life.
      lifeKind: 'ended',
    })
    // ⚠⚠ AND THE REGISTER IS NOT WRITTEN ONTO THE ROW. `beatEndsRegister` asks the `'met'` receipt
    // and finds none, which is what makes this card the told-late one – now and twenty seasons from
    // now, because no `'met'` row for this episode can ever be appended after this line runs.
    // ⚠ THE LEGIBILITY **IS** WRITTEN ONTO IT, and the two are not in tension: the register is
    // re-derivable from facts the world keeps for ever, and the seat is not (hire, release and the
    // rung dial all move under a pending beat). Ruling E is the whole of that distinction.
    raiseLifeBeat(world, 'ended', due.id, heardEnd ?? undefined)
    return
  }
  // ⭐ THE SAME COIN, ON THE OTHER PATH AND ON ITS OWN KEY – `'met'` rather than `'ended'`, so a week
  // that raises both (§8's ending and this delivery in one tick) can never hand one value to two
  // unrelated pieces of news. §1f's one-value-per-key law, satisfied by the kind being IN the key.
  const heardMet = listenHeardNow(world, 'met')
  const frameMet: HeardRead | null = heardMet === true ? { voice: voiceOf(world), wants: due.wants } : null
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and the absence of the field is what
    // keeps `accrueFinance` from ever seeing this row.
    // ⚠ THE EPISODE'S OWN `wants` (v74 T7) – the read, unmarked, in the one row the album keeps.
    text: metKeptRow(bondBandOf(world.bond ?? ECONOMY.bond.start), due.wants, frameMet),
    // ⭐⭐⭐ v75 T5 – THE KIND, STAMPED, on wave 3's own arrival row. ⚠⚠ THE SENTENCE ABOVE DID NOT
    // MOVE AND MUST NOT (invariant 4): this adds a MACHINE-READABLE field beside it, which is exactly
    // what T1's field comment said the two write sites would do. ⚠ AND IT IS NOT A BACK-FILL: rows
    // written before this commit stay unstamped for T1's stated reason, and the column's `?? 'met'`
    // default is what keeps them wearing the same 🤍 they always wore.
    lifeKind: 'met',
  })
  // ⚠ THE SAME TICK, AND THE ORDER IS THE READING: the feed row is what HAPPENED and the beat is what
  // the parent is being asked about it, so the news is on the record before the card can be answered.
  // ⚠ THE DETAIL IS THE EPISODE ID – machine-readable, never a rendered sentence (`LifeBeatRecord`),
  // and it is also the receipt the dedupe above reads.
  raiseLifeBeat(world, 'met', due.id, heardMet ?? undefined)
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
  // ⭐⭐⭐ ROUND 42 #24 – WHAT SHE COMES WITH, DRAWN RATHER THAN DERIVED (spec §2), and it happens in
  // THIS order for a reason: the situations she could honestly bring are found FIRST, and the subject
  // is drawn over the subjects that survived. Drawing the subject first and then discovering it has
  // no situation would leave the beat with a choice between a re-roll (a second read off one key) and
  // a silent fall-through (a heading about a worry over an opener about a coach).
  // ⭐⭐⭐ ROUND 43 #8(a) – AND WHAT SHE SAID LAST TIME IS TAKEN OFF THE TABLE FIRST. The owner got
  // `watching-players` twice running («они точно не должны так часто повторяться, иначе в чём
  // смысл»), and that was a GUARANTEE rather than bad luck: the draw excluded nothing said before,
  // so a subject holding one situation repeated VERBATIM the moment the weights picked it twice.
  // ⚠ IT NARROWS THE POOL BEFORE THE SUBJECT IS DRAWN, NOT AFTER. Drawing the subject over the full
  // reachable set and then excluding inside it is the same defect `reachable` itself was built to
  // avoid one paragraph up – a single-situation subject would win the weights and then have nothing
  // left to offer, and the beat would owe a re-roll or a fall-through.
  const reachable = withoutRecentSituations(world, reachableSituations(world, voiceOf(world), lifeStageOf(world)))
  if (reachable.length === 0) {
    // ⚠ THE LEGACY ROW, AND IT IS THE SHIPPED BEAT RATHER THAN A DEGRADED ONE. No situation is
    // written for this girl at this stage on this career, so she opens with the pool that has always
    // served her and the card behaves exactly as it did before this round – three generic answers,
    // no second line. ⚠ ZERO EXTRA KEYS ON THIS PATH: the two streams below are not derived at all,
    // which is the same «the gate returns before the stream exists» discipline the hazard itself
    // keeps, one level in.
    raiseLifeBeat(world, 'small-talk', smallTalkSubjectFor(register))
    return
  }
  // ⚠⚠ TWO NEW KEYS, EACH ANSWERING EXACTLY ONE QUESTION, EACH CARRYING ITS OWN WEEK – the 09.09
  // split-key law. `:subject:` says WHICH SMALL THING and `:situation:` says WHICH ONE OF THAT KIND;
  // reading both off `seed:life:smalltalk:<week>` would have been two facts sharing a key, which is
  // the one thing that law forbids. ⚠ AND NEITHER IS MAIN: `rngFromSeed` is a purpose-scoped
  // sub-stream re-derived at this call site and persisting nothing, so the frozen capture
  // (41550 / e6b0c709) cannot see this function – `tests/condition.test.ts` does not move.
  const subject = drawSmallTalkSubject(world.seed, world.week, register, reachable)
  const pool = reachable.filter((s) => s.subject === subject)
  const at = pickInt(rngFromSeed(`${world.seed}:life:smalltalk:situation:${world.week}`), 0, pool.length - 1)
  // ⚠ THE DETAIL IS THE SUBJECT **AND THE SITUATION** – machine-readable, never a rendered sentence
  // (`LifeBeatRecord`), and it is what `lifeBeatSaid`, the option labels and her replies are all
  // selected with. STAMPED AND NEVER RE-DERIVED, `'fork-counsel'`'s own argument: the row is live for
  // three weeks and is re-assembled on every `toSnapshot`, so a re-derivation could hand the parent a
  // different small thing from the one she came with – and could hand him one whose competitive fact
  // has since gone false.
  // ⭐⭐⭐ ROUND 44 – AND THE SCENE SHE SAYS IT IN IS DRAWN HERE AND STAMPED WITH IT. The frame is the
  // third key of this step and it is the only one that is NOT keyed `:life:` – the frame pool spec
  // names it in full («`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)` – never MAIN, invariant
  // 2») and the spelling is his document's, carried rather than tidied.
  // ⚠ IT IS DRAWN AFTER THE SITUATION AND THE ORDER IS NOT LOAD-BEARING – each key carries its own
  // week, so neither draw can move the other. What IS load-bearing is that it happens on the RAISE:
  // the exclusion reads the log as it stands now, and a frame derived later would be re-decided on
  // every snapshot.
  const frame = drawSmallTalkFrame(world, presenceOf(lifeStageOf(world)))
  raiseLifeBeat(world, 'small-talk', smallTalkDetailFor(pool[at].subject, pool[at].id), undefined, frame)
}

/** ⭐⭐ WHICH SMALL THING, WEIGHTED BY THE WEEK'S REGISTER AND NARROWED TO WHAT SHE COULD HONESTLY
 *  BRING (spec §2). `drawForkWant`'s own shape – weights, one uniform, a walk down the list – and its
 *  own (seed, calendar) key discipline, so a player cannot manufacture a subject by playing the week
 *  differently.
 *
 *  ⚠ THE ROSTER IT WALKS IS THE REACHABLE ONE, not `SMALL_TALK_SUBJECTS`. A subject with no situation
 *  behind it this week has no mass at all, which is what keeps the two draws independent: the second
 *  one always has something to pick.
 *
 *  ⚠ THE ORDER IS `SMALL_TALK_SUBJECTS`' OWN and not the reachable list's, so the walk is stable
 *  under a re-ordering of the catalogue – the same seed and week give the same subject whatever order
 *  the situations happen to sit in. */
function drawSmallTalkSubject(
  seed: string,
  week: number,
  register: MoodRegister,
  reachable: readonly SmallTalkSituation[],
): SmallTalkSubject {
  const live = SMALL_TALK_SUBJECTS.filter((s) => reachable.some((r) => r.subject === s))
  const weights = SMALL_TALK_SUBJECT_WEIGHT[register]
  const total = live.reduce((sum, s) => sum + weights[s], 0)
  let roll = rngFromSeed(`${seed}:life:smalltalk:subject:${week}`)() * total
  for (const subject of live) {
    roll -= weights[subject]
    if (roll < 0) return subject
  }
  // Unreachable while every weight is positive; a total that floats a hair low lands on the last row
  // rather than on `undefined` – `drawForkWant`'s own tail.
  return live[live.length - 1]
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
// still the defect this note exists to make visible.
// ⭐⭐ RE-AIMED A THIRD TIME BY T5 (12.09), AND THE TWO PARAGRAPHS ABOVE ARE KEPT WHOLE. WHAT MOVED:
// `events` – the told-now ending's kept row and its `lifeKind: 'ended'` stamp are written here now,
// behind the very same `'met'` receipt as the card, so the album and the queue can never disagree
// about which scene this week was. WHAT DID NOT: `world.spirit`, which is the one item this note has
// been guarding since T2 and is the only one left on the list. ⚠ AND THE TOLD-LATE HALF IS NOT HERE AND CANNOT
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
 *  ⭐⭐ ...AND T5 IS THE LAST OF THEM, SO THE LIST IS DOWN TO ONE AND THE WHOLE HISTORY STAYS READABLE.
 *  WHAT MOVED: `events` – the kept told-now row, stamped `lifeKind: 'ended'`, behind the same receipt
 *  as the card. WHAT STILL DID NOT AND NEVER WILL: `world.spirit`. `accrueSpirit` is the one writer
 *  of it in the engine and that is the property these three re-aims have been protecting all along.
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
  // ⭐ v75 T4 – THE ROW IS TAKEN **BEFORE** IT IS DATED, because after `endEpisode` runs
  // `activeEpisode` is null by construction and there would be no id left to raise the beat about.
  // ⭐ RE-AIMED BY v83 (the wedding, wave 7 – T4), NOT WEAKENED: the fetch moved ABOVE the draw,
  // because the row now prices its own hazard – the latch below reads it – and the reason it was
  // taken early at all (dated rows have no id left) holds one line further up unchanged.
  const over = activeEpisode(world)!
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A. The hazard is EVALUATED NOW and
  // nothing about it is stored: what `endEpisode` writes is a DATE. So the multiplier is the one
  // belonging to the girl she is this week. ⚠ AND IT IS THE INTENSITY AXIS THAT OWNS THIS ONE
  // (who-she-is §1: «INTENSITY owns how hard things land and how long feelings hold – … an
  // attachment's end-hazard»), which is why a `reg` flip is the axis that moves it.
  //
  // ⭐⭐⭐ v83 (the wedding, wave 7 – T4) – AND THE LATCH IS THE ONE SEAM THAT SCALES IT. A latched
  // episode's ending hazard is wave-4's whole product × `ECONOMY.wedding.latchEndFactor` (drafted
  // 0.15, measured in T8): marriage steadies the slot, which is its whole mechanical meaning at W1.
  // ⚠ THE FACTOR LIVES HERE AND NOT IN `endsHazardFor`, DELIBERATELY – that function takes the
  // TEMPERAMENT alone so the corridor tests and the census sweep the table directly (its own
  // primitives doctrine), and the latch is a fact about the ROW, not about the girl. One seam, at
  // the one caller, exactly where the brief pointed. ⚠ NOT ZERO AND NOT A GATE: a latched episode
  // ending through this same hazard stays possible and rare – the divorce door the schema pre-paid
  // – and everything downstream of the draw (the shock, the card, the kept row) is wave-4's
  // machinery UNTOUCHED, no new shock kind anywhere in the wave. ⚠ ZERO RNG CHANGE: same one
  // uniform, same key, same draw count on every week – only the THRESHOLD moves, so no stream
  // shifts and input-independence cannot be touched.
  const hazard =
    endsHazardFor(expressedTemperamentOf(world)) *
    (over.latchedWeek !== null ? ECONOMY.wedding.latchEndFactor : 1)
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament, so the four girls read
  // the SAME uniform against four different hazards. That is what makes the multiplier a pure scale
  // rather than four unrelated dice, and it is the property the nesting pin holds them to.
  if (rngFromSeed(`${world.seed}:life:ends:${world.week}`)() >= hazard) return
  // ⭐⭐⭐ v88 (the parting, wave 12 – T2) – **THE WHOLE OF THE WAVE'S ENGINE, AND IT IS A PURE READ.**
  // Was this a marriage? Everything below splits on this one boolean and nothing else: the shock's
  // kind, the card's kind, the kept row's sentence and its stamp. ⚠ NOT A SECOND DRAW, NOT A SECOND
  // GATE AND NOT A SECOND HAZARD – the ending's rate already knows about the latch (it is the
  // `latchEndFactor` in the hazard eight lines up), so by the time this line runs the dice have
  // finished and the only question left is what to CALL what they did.
  //
  // ⚠⚠ IT IS TAKEN BEFORE `endEpisode` FOR READABILITY AND NOT FOR SAFETY, which is worth saying so
  // nobody "tidies" it back down. `endEpisode` writes `endedWeek` and never touches `latchedWeek`,
  // and `over` is a reference to the row rather than a copy, so the read would be correct anywhere
  // below. It sits here because the four uses underneath should all be reading ONE named fact – the
  // two-readings defect rule 3 exists to prevent, at the smallest scale it can occur.
  const married = over.latchedWeek !== null
  endEpisode(world, world.week)
  // ⭐⭐⭐ v75 T3 – AND THE MARK IT LEAVES ON HER. A fact, never a number: what it costs is
  // `ECONOMY.spirit.shock.breakup` and `accrueSpirit` is the one place that reads it (see the note
  // above). The kind is the union's only member today; steps 7–8 add the others.
  // ⭐⭐⭐ v88 (wave 12 – T2) – AND STEPS 7–8 CAME AND WENT, so this line finally has the choice the
  // union was widened for. `'divorce'` costs −27/−42 against the break-up's −22/−34
  // (`ECONOMY.spirit.shock`, both DRAFT): deeper, because a marriage is more of a life. ⚠ THE SPLIT
  // IS THE WHOLE OF WHAT THIS LINE DOES – the ARITHMETIC is still `accrueSpirit`'s four calls later,
  // and this function still stamps a fact and never a number. The note over this function has been
  // watching for a `world.spirit` write since T3 and still is.
  world.spiritShock = { week: world.week, kind: married ? 'divorce' : 'breakup' }
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
  // ⭐⭐ RE-AIMED BY T5 (12.09) AND THE OLD SENTENCE IS KEPT SO THE RE-AIM READS AS ONE HISTORY. It
  // said «NO FEED ROW ON THIS PATH (T5's, per the commit order) and NO SPIRIT POINT», and T5 is the
  // step it was written to be re-read on. WHAT MOVED: the kept `'life'` row below, stamped `'ended'`.
  // WHAT DID NOT: `world.spirit` – the POINTS are still `accrueSpirit`'s, four calls later in this
  // same tick, and a spirit delta appearing in this function is still the defect the note watches for.
  //
  // ⚠⚠ THE ROW AND THE CARD SHARE ONE CONDITION AND MUST GO ON SHARING IT. Behind the receipt they
  // both fire; without it BOTH wait, and §6 raises the told-late pair on `knownWeek` instead. A row
  // written here unconditionally would tell a parent about a romance he has never heard of, in the
  // week it ends – which is precisely the news `deliverKnownPartner` exists to deliver honestly, one
  // sentence later in her story rather than two.
  //
  // ⚠ THE ORDER IS THE READING, as it is in §6: the feed row is what HAPPENED and the card is what he
  // is being asked about it, so the news is on the record before the card can be answered.
  if (!hasBeatFor(world, over.id, ['met'])) return
  // ⭐⭐⭐ v76 T6 – THE THIRD AND LAST RAISE SITE OF A READ-BEARING BEAT, and it reads the coin exactly
  // as §6's two do: one uniform on `seed:psy:listen:ended:<week>`, spent on the kept row's text below
  // and on the card's stamp underneath it. ⚠ IT IS DRAWN **AFTER** THE RECEIPT GATE, so an ending
  // that raises nothing here derives nothing either – the told-late path in §6 owns that episode and
  // draws its own coin on the week the parent actually hears of it.
  // ⭐⭐⭐ v88 (wave 12 – T2) – AND THE MARRIAGE'S ENDING TAKES THE OTHER ROAD, WHICH IS SHORTER BY
  // EVERYTHING BELOW. One kept row, one raise, no coin and no frame. ⚠ IT RETURNS RATHER THAN
  // BRANCHING THE REST, because the two paths share nothing after this point: the ending's row and
  // card are assembled from a coin, a voice, a `wants` and a register, and the divorce's are
  // assembled from neither.
  //
  // ⚠⚠ THE LISTEN COIN IS **NOT DERIVED ON THIS PATH**, AND THAT IS A REAL CONSEQUENCE RATHER THAN
  // AN OMISSION – said plainly here because it is the one thing this wave takes away. On a week the
  // family is paying a psychologist whose year is `'listen'`, a break-up's heading can be the
  // LEGIBLE one (`ENDED_HEADING_HEARD`, 16 cells). A divorce's cannot: `DIVORCED_HEADING` has two
  // cells and no legible arm, so the focus goes quiet on this one card. Building one would mean
  // drafting eight more cells of the parent's own reading, which is a surface this wave was not
  // asked for and copy that is not an agent's to invent (invariant 4). ⚠ IT COSTS NO STREAM EITHER
  // WAY: `listenHeardNow` returns `null` without drawing unless a listen rung is actually working,
  // and sub-streams are re-derived at the call site and persist nothing, so skipping the call moves
  // no other key's value. Carried to the wave's report as a question for the owner.
  if (married) {
    addEvent(world, {
      week: world.week,
      type: 'life',
      // ⚠ KEPT, for `MET_EVENT`'s own reason: a career reads its own life back seasons later and the
      // week a marriage ended is not a line the album may be missing.
      keep: true,
      // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and there is no money in this wave
      // at all (spec §2.4, his wedding ruling extended).
      text: divorcedKeptRow(),
      lifeKind: 'divorced',
    })
    // ⭐⭐⭐ v88 (the parting, wave 12 – T3) – AND THE ALBUM KEEPS A LINE, on his «можно» of 23.09.
    // `landWedding`'s two-surface idiom exactly: `fireMilestone` keeps the line past every prune and
    // `captureMilestone` gives the scroll its row, both idempotent per `divorce:<episodeId>` – so a
    // SECOND marriage's divorce on a later row captures its own line, which is the 11.09 re-shape
    // inherited from the wedding this closes.
    //
    // ⚠⚠ THIS IS THE ONE WEEK IN THE GAME THAT WRITES BOTH A `'life'` ROW AND A `'milestone'` ROW,
    // and it is the spec asking for both rather than a duplicate. The two channels answer different
    // questions – `landBirth`'s own note draws the line: `'life'` is NEWS about her life, `'milestone'`
    // is what the family KEEPS – and an ending has always had the first while a wedding has always
    // had the second. A marriage ending is both at once, which is exactly why it needed a wave. ⚠ SO
    // THE TWO SENTENCES ARE WRITTEN NOT TO STUTTER: the kept row says what this week did, and the
    // album line says what the career will read back later. Flagged in the wave's report, because
    // «two rows on one week» is a thing the owner sees on a screen and may not want.
    //
    // ⚠ THE ALBUM LINE SETTLES NOTHING – §5's law and the bereavement precedent: no fault, no
    // duration, no name, no money. It records that the marriage ended and that the family was
    // somewhere when it did.
    // ⚠ HIS REVIEW APPLIED 23.09: «the phone still rang» asserted a delivery channel the quiet
    // voice contradicts (her news arrives in messages), so the line now says only what every
    // divorce shares – the family had no part in the decision, and a part in what came after.
    fireMilestone(world, `divorce:${over.id}`, 'The marriage ended. We had no say in it, only in what we said next.')
    captureMilestone(world, { type: 'divorce', week: world.week, kind: over.id })
    raiseLifeBeat(world, 'divorced', over.id)
    return
  }
  const heardNow = listenHeardNow(world, 'ended')
  const frameNow: HeardRead | null = heardNow === true ? { voice: voiceOf(world), wants: over.wants } : null
  addEvent(world, {
    week: world.week,
    type: 'life',
    // ⚠ KEPT. `pruneEvents` drops ordinary rows at sixty weeks and a career reads its own life back
    // seasons later; the week it ended is not a line the album may be missing, for `MET_EVENT`'s own
    // reason one scene on.
    keep: true,
    // ⚠ NO AMOUNT – a life beat is never a purchase (rule 4), and the absence of the field is what
    // keeps `accrueFinance` from ever seeing this row.
    // ⚠⚠ NO READ ON THIS ROW IN EITHER ARM – RULING O, and T6b took the legible half back out. The
    // sentence below is the one that shipped, byte for byte, on a coached week and an uncoached one
    // alike; the read the parent bought reaches the TOLD-NOW ending through the card's heading, which
    // `lifeBeatPromptFor` raises on this same tick. `endedKeptRow` is where that is decided and
    // pinned, so `frameNow` is handed over here exactly as §6's two raise sites hand theirs over –
    // one function answers «which sentence does the album keep», and a re-cut has one place to touch.
    // ⚠⚠ SO `seed:life:ends:<week>:react` IS NOT DERIVED HERE ON EITHER ARM, which is the stream
    // discipline the ruling bought back: the told-now path never reached that key before this wave,
    // and deriving it «for the legible arm» would have put a new key into every ending of every
    // career, the frozen corpus included. The `'space'` handed over is the base table and is never
    // read – `beatEndsRead`'s own fallback idiom one section up.
    text: endedKeptRow('told-now', 'space', frameNow),
    // ⭐ THE KIND, STAMPED – the same `'ended'` the told-late row carries, because it is the same
    // piece of news in the other register (see that row's note).
    lifeKind: 'ended',
  })
  raiseLifeBeat(world, 'ended', over.id, heardNow ?? undefined)
}

// =================================================================================================
// 9. THE LEAK – ⚠⚠ THE WEEK THE **WORLD** FINDS OUT (the spotlight, wave 6: T6)
// =================================================================================================
//
// `docs/specs/who-she-is-2026-09.md` §3c-bis, `docs/plans/life-wave-6-builder-2026-09.md` §2 T6,
// constants in `ECONOMY.spotlight`. Sections 5 to 8 above are one attachment's arc as the FAMILY
// lives it; this is the only place a third party ever enters it.
//
// THE OWNER, 10.09: «слава + комментаторы + пресса + давление + темпераменты – мне кажется у нас
// как-то тоже можно понимать сколько вообще какой личной информации и куда просачивается у разных
// характеров… можем какую-то логику запланировать?»
//
// ⚠⚠ THE TWO STREAMS OF THIS WAVE, AND THEY ARE THE ONLY TWO IT HAS:
//
//     seed:life:leak:<episodeId>:<week>         does this episode get out, this week
//     seed:life:leak:story:<episodeId>:<week>   ...and did the story land WRONG, at the leak week
//
// (seed, calendar)-keyed like the other four life streams, never a choice, so a player cannot
// manufacture a headline by playing the week differently. ⚠ THE SECOND IS DERIVED ONLY ON THE WEEK
// THE FIRST FIRES – `rollEnds`' own discipline for `:react`, and the reason it is a second KEY
// rather than a second read of the first is §1f's one-value-per-key law.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural (nothing here
// takes an `Rng`, so the frozen capture 41550 / e6b0c709 cannot see this section). The second is the
// wave's load-bearing rule inherited whole from §5, §7 and §8: `leakEligible` decides EVERYTHING and
// `rollLeak` returns on it BEFORE either stream is derived. ⚠ AND THE TEST FOR IT IS A KEY COUNT
// WITH A VALUE CHECK BESIDE IT – the architect's ruling L: a key counter sees KEYS and never
// CONSUMED VALUES, so it proves a stream was not REACHED and cannot prove it was not ADVANCED.
// `tests/wave6-spotlight-leak.test.ts` §B counts the keys the gate reached, in an array the code
// under test cannot see; §C asserts the exact fire set against uniforms drawn in the test from the
// real `rngFromSeed`, which is an expectation that never calls `rollLeak`.
//
// ⚠⚠ THE GATE ASKS ABOUT THE **LAST CLOSED WEEK**, WHICH IS THE ARCHITECT'S RULING P APPLIED TO THIS
// CHANNEL AND NOT A SECOND CLOCK. The pressure reads `exposureEventsOf(world, world.week − 1)` and
// habituation read the same gate; so did this. ⭐ D1 (14.09) moved the gate to the STANDING, which
// is present-tense by its own contract (the cached rank already describes the last closed fold),
// so the one-horizon law below is kept by construction now. Three reasons, and the first
// is the ruling's own:
//
//   1. ONE HORIZON PER WAVE. A leak gated at `world.week` whose own consequence – the `'wrongStory'`
//      exposure event – is priced at `world.week − 1` would put two clocks inside one mechanism, and
//      ruling P refused a split horizon in the ledger for exactly that reason.
//   2. THE WEEK BEING LIVED HAS NOT HAPPENED YET AT THIS POINT IN THE TICK. `resolveBodyAndPlanner`
//      is step 4 and `playHerWeek` is step 6, so at this line `world.week` holds no result, no
//      trophy and no match – asking «is she news THIS week» here is the very shape ruling P found
//      starving `'stage'` and `'publicLoss'`.
//   3. AND IT IS THE TRUER READING, in ruling P's own words: the cameras were on her at the weekend
//      and the story runs the week after. ⚠ THE STAMP STILL NAMES **THIS** WEEK – `publicWeek =
//      world.week` – because the week the world learned is the week the story ran, and the feed row
//      is dated by when the parent reads it. The gate asks about the week that produced the lenses;
//      the stamp records the week they printed.
//
// ⚠ SO T3's PASS SEES THE `'wrongStory'` EVENT ONE TICK LATER, and that is the wave's one clock
// working rather than a lag anybody added: `exposureEventsOf` matches `publicWeek === week`, the
// pass asks about `world.week − 1`, and the pressure therefore lands in the tick after the headline.
//
// ⚠⚠ IT RUNS ON THE **ACTIVE** EPISODE, WHICH IS A NARROWING OF THE BRIEF AND IS STATED RATHER THAN
// SLIPPED IN. The brief says «per episode-week, while `publicWeek === null` and she is news», which
// read literally puts every never-public row a career ever lived – four to six of them by §4's own
// biography table – into the draw every week for ever. Three measured consequences decided it:
//
//   * THE BOOTH WOULD BE HANDED A DISHONEST LICENCE. T7 airs `'met'` on `publicWeek !== null &&
//     airedMetWeek === null`, so a row that went public three years after it ended would put «a face
//     in the players' box» on air about somebody long gone. The stamp is read, never re-judged
//     (`world/spotlight.ts`'s own doctrine), so the honesty has to live at the WRITE.
//   * IT WOULD MOVE WAVE 4's TOLD-LATE SCENE. The overtake below pulls `knownWeek` forward; on an
//     ended-and-never-told row that is precisely the episode `deliverKnownPartner` is holding for
//     its one honest late card, and nothing in this wave was asked to re-time it.
//   * AND §3c-bis's OWN MECHANISM IS A LIVE ONE: «an open girl is simply seen (dinner, a hand held
//     at an airport)». A lens catches a relationship that is happening.
//
// The brief's own sentence agrees from the other side – «an episode that ENDS while public needs no
// second hazard: the world that knows of them learns of the end with the ending» – which presumes
// publicity attaches while the row is open. ⚠ AND «PER EPISODE-WEEK» IS UNTOUCHED BY THE NARROWING:
// at most one row can be active (`activeEpisode`'s own tail rule), so per-episode and per-week
// coincide, and the KEY still carries the episode id so two attachments can never share a value.
//
// ⚠⚠ AND `knownWeek === null` IS NOT REACHABLE, WHICH MOVES THE OVERTAKE'S CONDITION. The brief and
// the `publicWeek` field's own note both spell the founding scene as «`publicWeek` set while
// `knownWeek` is still null». Measured 14.09 at the ONE writer of that field: `rollArrival` (§5)
// sets `knownWeek = sinceWeek + shaveLag(raw, band)`, and `shaveLag` returns a number for every
// input, so an engine-born row NEVER has a null there – the type allows it, the sim cannot produce
// it, and a condition written on it would be this wave's next «unable to fire». What the SPEC says
// is the reachable thing and it is what ships: «for a private girl at high fame, `publicWeek` can
// land BEFORE `knownWeek` – the parent learns about the boyfriend FROM A HEADLINE». So the
// discriminator is «has he been told yet», `knownWeek === null || knownWeek > world.week`, which
// covers the brief's spelling as a sub-case and fires on the case that exists.
//
// ⚠ IT WRITES THE TWO PUBLICITY STAMPS, ONE KEPT FEED ROW AND – ON THE OVERTAKE – ONE DATE THAT WAS
// ALREADY THE ROW'S. `world.spirit` is not touched (the `'wrongStory'` pressure is T3's term inside
// `accrueSpirit`, and that pass is the one writer of it); no beat is raised here, because the
// overtake delivers through `deliverKnownPartner` four lines later in the same tick and NO new
// delivery path exists; `airedMetWeek` / `airedEndedWeek` stay null, because the booth is T7's.

/** ⭐ THE WORLD'S OWN VERSION, AS THE PARENT READS IT – two of them, and which one prints is the
 *  `story` stream's answer and not a reading of anything the family knows.
 *
 *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4 at the top of this file), and no fact
 *  about the partner in the TRUE row: the sim holds none, and `LoveEpisode`'s own note says why no
 *  name and no gender is persisted. ⚠ THE WRONG ROW IS THE ONE PLACE A FIGURE MAY APPEAR AT ALL, and
 *  that is the point rather than an exception – «a mystery man» is the tabloid's INVENTION (§3c-bis
 *  names it in those words), so it asserts nothing about who she is actually with. A true story that
 *  named a man would be the schema breach; a false one that does is the mechanic.
 *
 *  ⚠ BOTH ARE DRAFTS AND DELIBERATELY NOT POLISHED – T8's вычитка and the owner's playtest are the
 *  gate (invariant 4, the wave's §5). */
const LEAK_EVENT: Record<'true' | 'wrong', string> = {
  true: 'It is in the papers – there is someone in her life, and they have it right.',
  wrong: 'It is in the papers – a mystery man, and none of it is what happened.',
}

/** ⭐⭐ THE GATE – ONE FUNCTION, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s, `smallTalkEligible`'s AND `endsEligible`'s
 *  STATED REASON: a reader has to be able to see, in one place, that the whole of eligibility is
 *  decided before any stream exists. Pure, zero draws, no writes.
 *
 *  THE THREE CLAUSES, each with its own argument in the §9 banner above:
 *
 *  1. SOMEBODY IS THERE NOW – `activeEpisode`, the same spelling `endsEligible` uses, so «is there
 *     an attachment» has ONE reading in this file. This is the narrowing of the brief.
 *  2. THE WORLD DOES NOT ALREADY KNOW. `publicWeek` is a once-ever stamp like `endedWeek`; a story
 *     that has run cannot break again, and the booth's second fact (the ending) needs no hazard of
 *     its own because the world that knows of them learns of the end with the ending.
 *  3. AND SHE IS NEWS AT THE **LAST CLOSED WEEK** – one horizon per wave, ruling P. See the banner
 *     for why the closed week and not the one being lived. */
export function leakEligible(world: WorldState): boolean {
  const open = activeEpisode(world)
  if (open === null || open.publicWeek !== null) return false
  // ⭐ D1 (14.09): the standing read replaces the fame bar. Present-tense by the predicate's own
  // contract – the cached rank already describes the last closed fold, so ruling P's one-horizon
  // law is kept by construction rather than by a week argument.
  return newsStandingOf(world) !== 'quiet'
}

/** ⭐⭐⭐ THE WEEKLY LEAK HAZARD, as one probability – who-she-is §3c-bis's own formula, restored in
 *  full by the architect's RULING I:
 *
 *      leakBasePerWeek × leakOpennessMult[openness] × (fame / ECONOMY.fame.cap)
 *
 *  ⚠⚠ THE FAME FACTOR IS THE RULING AND IT IS WHAT THE BRIEF DROPPED. «More lenses on a bigger star»
 *  is a term of the spec's sentence, not a restatement of the news gate: inside the bands the
 *  scale runs 30 → 100, so a spelling without this factor has a girl at 100 leaking at exactly the
 *  rate of a girl at 30. See `ECONOMY.spotlight.leakBasePerWeek`'s own note for the measurement, and
 *  the leak suite's §D for the pin – twin careers at equal openness and different fame, where the
 *  brief's spelling produces two IDENTICAL fire sets and this one produces a strict superset.
 *
 *  ⚠ IT TAKES THE PRIMITIVES AND NOT THE WORLD – `arrivalHazardFor`'s and `endsHazardFor`'s own
 *  doctrine – so T9's bench and a corridor test can sweep the table directly instead of posing a
 *  world per cell. The caller reads `fameAt` at the horizon it has decided on, once.
 *
 *  ⚠ NO CLAMP AND NONE NEEDED: `fameAt` is `Math.min(ECONOMY.fame.cap, …)` of a sum of non-negative
 *  decayed steps, so the third factor is total on [0, 1] by the reader's own construction. A clamp
 *  here would be a second guard nobody could ever see fire, and it would hide a real defect if
 *  `fameAt` ever stopped capping. */
export function leakHazardFor(openness: 'open' | 'private', fame: number): number {
  const S = ECONOMY.spotlight
  return S.leakBasePerWeek * S.leakOpennessMult[openness] * (fame / ECONOMY.fame.cap)
}

/** ⭐⭐ HOW OFTEN THE STORY LANDS WRONG, by EXPRESSED openness (`ECONOMY.spotlight.wrongShare`).
 *  Takes the axis rather than the world for `leakHazardFor`'s own reason one function up.
 *
 *  ⚠ THE **LATE** HALF OF «late and wrong» IS NOT HERE AND MUST NOT BE ADDED: it is emergent from
 *  the hazard above, where a private girl draws a quarter of an open one's rate and her story
 *  therefore breaks later in the episode. T9's census MEASURES the median lag; nothing SETS it. */
export function leakWrongShareFor(openness: 'open' | 'private'): number {
  return ECONOMY.spotlight.wrongShare[openness]
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of `publicWeek` and `publicWrong` in the engine.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED – §5, §7 and §8's rule word for
 *  word. The line order below IS the rule; moving a roll above the gate would break it silently,
 *  because every key here carries its own week and a discarded draw changes no other week's value.
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s and `rollEnds`' own note: `rngFromSeed` can return exactly 0,
 *  and a hazard of 0 must be impossible rather than merely unlikely. It is REACHABLE here in a way
 *  it is not in the other two sections – the fame factor is genuinely 0 below every stamp's reach –
 *  so this comparison is a short-circuit and not only a belt.
 *
 *  ⚠⚠ EXPRESSION, NOT BIRTH, AND ONE READ FEEDS BOTH DRAWS – v76's ruling A. The hazard is EVALUATED
 *  now and the accuracy is EVALUATED now; what is PERSISTED is two weeks and a boolean, stamped at
 *  the week they were true. A girl behind walls is seen less and misreported more, which is §2a's
 *  walls doing exactly what §3c-bis says openness does.
 *
 *  ⚠⚠ AND THE OVERTAKE RAISES NOTHING ITSELF. It writes `knownWeek` and stops; `deliverKnownPartner`
 *  (§6), four calls later in this same tick, finds the row due on `knownWeek <= world.week`, writes
 *  the `'met'` kept row and raises the `'met'` card through the machinery that has raised every one
 *  of them since wave 3. NO new `LifeBeatKind`, NO second delivery path, and the card a headline
 *  raises deep-equals an ordinary one except for the frame `beatFromHeadline` picks. */
export function rollLeak(world: WorldState): void {
  if (!leakEligible(world)) return
  const episode = activeEpisode(world)!
  const openness = temperamentOpenness(expressedTemperamentOf(world))
  // ⚠ THE HORIZON IS READ ONCE AND SPENT ONCE, on the same week the gate asked about – a second read
  // at `world.week` would be the split clock ruling P refused, hiding inside one function.
  let hazard = leakHazardFor(openness, fameAt(world, world.week - 1))
  // ⭐ D1 (14.09): at 'noticed' the world glances rather than watches – the hazard runs at
  // `noticedLeakScale`; at 'known' the scale is 1 by construction. The BAND is read once here,
  // beside the one fame read, so the roll composes exactly what the gate admitted.
  if (newsStandingOf(world) === 'noticed') hazard *= ECONOMY.spotlight.noticedLeakScale
  // ⭐⭐ D5 (14.09, the founding scene's lever, his «давай попробуем»): new couples get caught –
  // the first `leakFreshWeeks` of an episode run `leakFreshMult` hotter. Same key, same single
  // uniform, no draw-count change: only the threshold the same value is compared against moves,
  // which is what keeps the frozen protocol's diff a stamped expectation and not a re-shuffle.
  if (world.week - episode.sinceWeek <= ECONOMY.spotlight.leakFreshWeeks) hazard *= ECONOMY.spotlight.leakFreshMult
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament and no fame, so two
  // girls read the SAME uniform against two different hazards. That is what makes both multipliers
  // pure scales rather than unrelated dice, and it is the property §D's monotonicity pin rests on.
  if (rngFromSeed(`${world.seed}:life:leak:${episode.id}:${world.week}`)() >= hazard) return
  // ⭐⭐⭐ THE STAMP NAMES **THIS** WEEK though the gate asked about the last closed one – see the §9
  // banner's third reason. The week the world learned is the week the story ran.
  episode.publicWeek = world.week
  // ⭐⭐⭐ THE FILMS' GEM (§3c-bis): openness controls not only the SPEED of a leak but its ACCURACY.
  // ⚠ DRAWN ONLY ON THE WEEK THE STORY BREAKS, on its own key – an episode that never gets out never
  // reaches this stream at all, which is the half of the zero-draw claim §B's second stream counts.
  episode.publicWrong =
    rngFromSeed(`${world.seed}:life:leak:story:${episode.id}:${world.week}`)() < leakWrongShareFor(openness)
  // ⭐⭐ AND THE WORLD'S VERSION GOES IN THE ALBUM. ⚠ KEPT – `pruneEvents` drops ordinary rows at
  // sixty weeks and a career reads its own life back seasons later; the week it stopped being
  // private is not a line the album may be missing (`MET_EVENT`'s own reason, two sections up).
  // ⚠ NO `amountCents` – a headline is never a purchase (rule 4), and the absence of the field is
  // what keeps `accrueFinance` from ever seeing this row.
  // ⚠⚠ AND NO `lifeKind`, WHICH IS T3's FINDING INHERITED RATHER THAN A GAP. The stamp's type is
  // `LifeBeatKind` and the wave's §8 forbids a new member of it, so this row carries none and
  // `lifeRowGlyph(undefined)` resolves through `?? 'met'` to `LIFE_ROW_EMOJI.life` – the owner's own
  // 11.09 pick for life rows. who-she-is §5a forbids an agent picking a glyph unasked, so none was
  // picked; whether the spotlight deserves a mark of its own goes to him with the strings.
  // ⭐ D3 (14.09, his «да» to 📸): the spotlight FAMILY wears its own mark – `lifeKind: 'exposure'`
  // joins this row and the EXPOSURE_ROW alike, and `lifeRowGlyphs` maps it to his camera. The old
  // finding (no lifeKind, 🤍 by fallback) is answered, not deleted – see the note above.
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    lifeKind: 'exposure',
    text: LEAK_EVENT[episode.publicWrong ? 'wrong' : 'true'],
  })
  // ⭐⭐⭐ THE OVERTAKE – THE FOUNDING SCENE, AND IT IS ONE ASSIGNMENT. «A parent learning about a
  // boyfriend from a photograph» (the design plan §0) finally given its mechanism, and it is
  // strongest for exactly the girl whose walls kept him out: a private girl's lag is the longest, so
  // she is the one the world can get to first.
  //
  // ⚠⚠ THE CONDITION IS «HAS HE BEEN TOLD YET» AND NOT `knownWeek === null` – see the §9 banner's
  // last ⚠⚠ for the measurement. `rollArrival` is the one writer of that field and it always writes
  // a number, so the brief's spelling could never have fired; this one covers it as a sub-case.
  //
  // ⚠ IT NEVER PUSHES `knownWeek` LATER. The comparison is one-sided on purpose: a parent who
  // already knows is not un-told by a headline, and moving a delivered episode's date would rewrite
  // a `'met'` receipt's own past.
  if (episode.knownWeek === null || episode.knownWeek > world.week) episode.knownWeek = world.week
}

// =================================================================================================
// 10. THE BOOTH – ⚠⚠ THE WEEK IT SAYS IT OUT LOUD (the spotlight, wave 6: T7)
// =================================================================================================
//
// `docs/plans/the-way-she-sounds-2026-09.md` C4, `docs/plans/life-wave-6-builder-2026-09.md` §2 T7,
// the window in `ECONOMY.spotlight.newsWindowWeeks`. §9 above is the week the WORLD finds out; this
// is the week a commentator fills a changeover with it, and the two are one system by the owner's
// own 10.09 ruling.
//
// THE OWNER, 10.09: «личная жизнь спортсменов часто на виду, т.е. что-то вполне может быть и про
// частную жизнь, как в Wimbledon фильме в конце было» – and the loop that ruling closes: «a booth
// mention of her private life IS an exposure event for the spotlight», so what is said on air costs
// her spirit through T3's pass like every other week in the light.
//
// ⚠⚠ ZERO DRAWS, ON ANY STREAM, AND IT IS THE WAVE'S DESIGN RATHER THAN A LIMITATION (§3: «the booth
// mention is DETERMINISTIC by design – the licence conditions fire it, no dice; variety is the
// persona wave's business»). Nothing below takes an `Rng`, derives a key or reads a clock: the
// licence is four facts about records the world already keeps, and on a week all four hold, the
// booth speaks. The frozen MAIN capture (41550 / `e6b0c709`) cannot see this section by
// construction, and `src/viz` – where the WORDS live – has no draw in it at all.
//
// ⚠⚠ AND IT READS THE STAMPS WITHOUT RE-JUDGING THEM – the architect's RULING T, which is T6's
// narrowing pointing this way. The licence asks «did the world learn of this» (`publicWeek`) and
// never «is it still true»; that is honest ONLY because §9 leaks the ACTIVE episode alone, so a
// public fact is a fact about a romance that was live when the world learned of it. If a later wave
// ever adds a retrospective leak, THIS licence is the second thing it has to re-read: «a face in the
// players' box» about somebody long gone is exactly what the narrowing prevents.
//
// ⚠⚠ WHERE IT RUNS, AND THE STEP IS THE ARCHITECT'S OWN QUESTION (ruling P's ⚠ to this task: «your
// «this week has a big-stage match» read must be honest about which step it runs in»). MEASURED, and
// it decides the placement:
//
//     step 3  resolveBodyAndPlanner – the life block (§5-§9) and `accrueSpirit`
//     step 5  playHerWeek           – the entered event, the fares, the shadow run  ← **HERE**
//
// At step 3 `world.week` holds no match at all: `enteredThisWeek` has not been resolved, the doctor
// has not seen her, and the three arms that decide whether she plays (walkover / medical withdrawal
// / she boards) are two phases away. A licence spelled there would have had to re-derive «is there a
// big-stage match this week» from the calendar and then get the injury, the college freeze and the
// medical veto right a second time – four rules with two spellings, which is the defect ruling P
// spent a whole task removing, rebuilt one concern over. At step 5 the match is IN HAND: the caller
// holds the event she is actually about to play, and it passes the tier down (§0.1's dependency
// inversion, the same move `psychologistWorksThisWeek` and `newsStandingOf` already make).
//
// ⚠⚠ AND THAT IS NOT A SECOND CLOCK – RULING P's ONE HORIZON IS UNTOUCHED. The stamp names THIS week
// (the week the booth spoke), exactly as §9's `publicWeek` does; T3's pass asks
// `exposureEventsOf(world, world.week − 1)` on the NEXT tick and prices the `'aired'` event there.
// One horizon, one pass, one tick later – the ruling working rather than a lag anybody added. What
// this placement changes is not WHEN the pressure lands but whether the licence can see a match at
// all, and nothing in the tick moved to buy it: `accrueSpirit` is where it was, the life block is
// where it was, and the six pins on that position are untouched.
//
// ⚠ A RUN SHE DOES NOT WATCH IS STILL A RUN THAT AIRED. The stamp is spent whether the player
// reveals the match, skips the tournament or closes the app – which is the model being honest rather
// than a hole: the booth said it on television, and whether the parent was watching is not the
// world's business. The pressure lands either way, which is the half the spotlight is actually about.

/** ⭐⭐ WHAT THE BOOTH MAY TOUCH AT `week`, or null – the LICENCE, and a null here means the section
 *  writes nothing at all.
 *
 *  ⚠⚠ ITS OWN PREDICATE FOR `leakEligible`'s STATED REASON: a reader has to be able to see the whole
 *  of «may it speak» in one place, before anything is written. Pure, zero draws, no writes.
 *
 *  THE FOUR CLAUSES, and every one of them is a fact the world already recorded:
 *
 *  1. THE WORLD KNOWS – `publicWeek !== null`. §0's delta 3 in its own words: «a fact only the
 *     family holds is never voiced, at any fame». This is the honesty boundary of the whole channel
 *     and it is one comparison; there is deliberately no fame, no bond and no wall clause beside it
 *     that could ever be read as «famous enough to be worth breaking».
 *  2. IT HAS NOT AIRED – the two `aired*` stamps ARE the once-ness (`LoveEpisode`'s own note), so a
 *     fact that has been voiced is over with, for ever, and no second rule is needed to say so.
 *  3. IT IS STILL NEWS – the fact's own age against `ECONOMY.spotlight.newsWindowWeeks`, measured
 *     from the week the FACT became public (`publicWeek` for «someone is there») or true
 *     (`endedWeek` for «it is over»). ⚠ A NEGATIVE AGE IS OUT TOO: a stamp in the future cannot be
 *     aired today, and on a crafted or migrated row that is the difference between silence and a
 *     booth announcing next season's break-up.
 *  4. AND THE ENDING NEEDS THE WORLD TO KNOW OF THEM AT ALL – `publicWeek !== null` gates BOTH
 *     facts, which is the brief's own spelling of the second licence (`endedWeek !== null &&
 *     publicWeek !== null`). A relationship the world never learned of does not get an obituary.
 *
 *  ⚠ MET BEFORE ENDED, AND IT IS TWO PASSES RATHER THAN ONE – the brief's «met before ended if both
 *  are due», which cannot be spelled as a single walk that returns the first due fact of the first
 *  due row: on two episodes where the OLDER has a due ending and the NEWER a due «met», a single
 *  walk would voice the ending first. Two passes say what the sentence says.
 *
 *  ⚠ THE EPISODE ORDER IS THE LIST'S OWN – appended in calendar order and never pruned
 *  (`loveEpisodesOf`), so «the first due row» is the oldest one, deterministically, and two runs of
 *  the same world can never disagree. */
export function boothMentionDue(
  world: WorldState,
  week: number,
): { episode: LoveEpisode; kind: 'met' | 'ended' | 'divorced' } | null {
  const window = ECONOMY.spotlight.newsWindowWeeks
  /** Is a fact stamped at `at` still inside the window at `week`? ⚠ INCLUSIVE at the far edge –
   *  «a fact OLDER than `newsWindowWeeks` is never aired» – and closed at the near one. */
  const stillNews = (at: number): boolean => week - at >= 0 && week - at <= window
  for (const ep of loveEpisodesOf(world)) {
    if (ep.publicWeek === null || ep.airedMetWeek !== null) continue
    if (stillNews(ep.publicWeek)) return { episode: ep, kind: 'met' }
  }
  for (const ep of loveEpisodesOf(world)) {
    if (ep.publicWeek === null || ep.endedWeek === null || ep.airedEndedWeek !== null) continue
    // ⭐⭐⭐ v88 (the parting, wave 12 – T5) – AND THE WORLD NAMES IT WHERE IT ALREADY KNEW. A PURE
    // READ of the same row, on the same licence, in the same window: nothing about WHETHER the booth
    // speaks moves, only WHICH fact it has. ⚠ THE GATE IS UNTOUCHED AND THAT IS THE WHOLE OF §6 –
    // openness already decided whether the world ever knew of them (`publicWeek`, the leak's own
    // multipliers) and standing already decides whether it is spoken, so a quiet girl's quiet
    // divorce stays hers and a star's is news. This wave adds the words to that machinery, not a
    // dial – which is his ruling 1 answered by inheritance rather than by invention.
    if (stillNews(ep.endedWeek)) return { episode: ep, kind: ep.latchedWeek !== null ? 'divorced' : 'ended' }
  }
  return null
}

/** ⭐⭐⭐ THE WEEKLY BOOTH MENTION, and the ONE writer of `airedMetWeek` and `airedEndedWeek` in the
 *  engine. Called from `playHerWeek`'s play arm – see the §10 banner for why that step and not the
 *  life block's.
 *
 *  ⚠⚠ `tier` IS THE EVENT SHE IS ABOUT TO PLAY, HANDED DOWN, AND IT IS WHAT MAKES THE STEP HONEST.
 *  The caller holds it (the arm where she has boarded and the shadow run is stashed); this function
 *  therefore cannot be called from a phase where the match is unknown, because there would be
 *  nothing to pass – §0.1's dependency inversion used as a STRUCTURAL guard rather than as a
 *  convenience. ⚠ REQUIRED AND NOT DEFAULTED: a default would let a caller in a matchless phase
 *  compile, which is the one mistake this parameter exists to make impossible.
 *
 *  ⚠⚠ AND THE NEWS GATE DESCRIBES THE **LAST CLOSED WEEK** – `newsStandingOf`'s cached rank,
 *  the same spelling `leakEligible` uses one section up and the same horizon T3's pressure and T4's
 *  habituation read. ONE horizon per wave (ruling P); the gate asks about the week that produced the
 *  lenses and the stamp records the week they aired, which is §9's own sentence about `publicWeek`.
 *
 *  ⚠ AT MOST ONE FACT A WEEK, BY CONSTRUCTION RATHER THAN BY A COUNTER: `boothMentionDue` returns
 *  one, and the stamp it writes closes that fact for ever. A week that had two due facts voices the
 *  `'met'` and leaves the ending for a later match – which is also why the window is a window on the
 *  FACT and not a cooldown on the booth. */
export function airBoothMention(world: WorldState, tier: TierId): void {
  if (!atOrAboveStageBar(tier)) return
  // ⭐ D1 (14.09): the booth's «fame band that makes her news» is the STANDING now – both non-quiet
  // bands may be voiced (its own big-stage requirement already makes every mention an occasion).
  if (newsStandingOf(world) === 'quiet') return
  // ⚠⚠ ONE FACT A WEEK, AND IT IS A PROPERTY OF THE **WEEK** RATHER THAN OF THE CALL COUNT. The tick
  // reaches this line once a week today (one entered event, one play arm), so this guard fires for
  // nobody – which is exactly why it is here: «at most one fact per week» is a claim about the
  // world, and a claim that holds only because nobody calls twice is a claim the next caller breaks
  // in silence. Asked through `boothPrivateLifeAt`, the same read the snapshot ships, so «has the
  // booth spoken this week» has ONE spelling and the guard cannot drift from the packet.
  if (boothPrivateLifeAt(world, world.week) !== null) return
  const due = boothMentionDue(world, world.week)
  if (due === null) return
  // ⭐⭐⭐ THE STAMP IS THE ONCE-NESS – one assignment, and the fact can never be voiced again. There
  // is no boolean beside it and no «aired count»: a nullable week says both «has it aired» and
  // «when», so the two can never disagree (`LoveEpisode`'s own note). T2's `'aired'` exposure kind
  // reads exactly this field, so the mention IS the exposure event with nothing in between.
  // ⚠ v88 (wave 12 – T5): `'divorced'` STAMPS `airedEndedWeek`, THE SAME FIELD, and that is right
  // rather than a shortcut. There is one «it is over» fact per episode and one stamp for it; what
  // the latch changes is what the booth CALLS it, never how many times it may be said. A second
  // field would let one ending air twice.
  if (due.kind === 'met') due.episode.airedMetWeek = world.week
  else due.episode.airedEndedWeek = world.week
  // ⚠ AND NO FEED ROW, WHICH IS DELIBERATE AND NOT AN OMISSION. The exposure week's one legible row
  // is T3's (`EXPOSURE_ROW`, raised inside the spirit pass on the tick that prices this event), and
  // §3c's legibility law is «one row per week, not per event – the feed is not a ledger». A second
  // row here would print the same week twice, in two voices, one tick apart.
}

// =================================================================================================
// 11. THE WEDDING – ⚠⚠ THE WEEK SHE DECIDES TO MARRY (the wedding, wave 7: T2)
// =================================================================================================
//
// `docs/plans/life-wave-7-builder-2026-09.md` §2 T2, constants in `ECONOMY.wedding`. §5 decides
// whether someone appears and §8 whether they are still there; this decides whether the episode
// becomes a MARRIAGE, and it is the step the whole branch has been building toward since the slot
// learned to latch. ⚠ It is §11 for §8's own stated reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S FIRST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE:
//
//     seed:life:wedding:<week>              does she decide, this week
//
// (seed, calendar)-keyed like every sibling, so a player cannot conjure or dodge a wedding by
// playing the week differently – input-independence is permanent law, and nothing here takes an
// `Rng`, so MAIN is structurally out of reach and the frozen capture (41550 / e6b0c709) cannot see
// this section. `seed:life:partner-name:<episodeId>` is T3's and `seed:life:spouse-view:<week>` is
// T5's – neither exists on this tree and neither may be created early (§5's own reservation rule,
// third use).
//
// ⚠⚠ ZERO DRAWS ON AN INELIGIBLE WEEK – the gate returns BEFORE the stream is derived, never
// draw-and-discard, §5's load-bearing rule inherited whole. And the test for it is a KEY COUNT, not
// an alignment comparison (wave 3's finding, the wave-4 brief's §0.1 law): every key carries its own
// week, so tests/wave7-wedding.test.ts counts the keys the gate reaches, with a positive control.
//
// ⚠ SHE DECIDES; THE HAZARD IS THE DECIDING. No parent action opens or closes this – the gate reads
// her age (RULED 23+, 11.09, art-driven), the slot (an active episode) and the episode's own DEPTH
// (its age in weeks – derived, no new state). The parent's part arrives one screen later, as three
// answers priced on `bond`, and none of them stops the wedding (T3).

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A predicate
 *  of its own for `arrivalEligible`'s stated reason: a reader must see, in one place, that the whole
 *  of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  1. ⭐ TWENTY-THREE – RULED 11.09 («свадьба на 23+ – мне вполне ок»), art-driven: the bride lives
 *     in the `adult` portrait set. Fractional (`kidAgeExact`), `life.ageGate`'s own reading, so she
 *     turns eligible the week she turns 23 and not in the January of that year.
 *  2. AN ACTIVE EPISODE – `activeEpisode`'s answer, never a second spelling of it. Nobody marries
 *     out of an empty slot, and an episode that ended this very tick (`rollEnds` runs FIRST at the
 *     call site) refuses here by construction.
 *  3. THE DEPTH – the episode is at least `ECONOMY.wedding.minEpisodeWeeks` old, DERIVED from
 *     `sinceWeek` (no new state; the brief's own «depth is derived» clause). ⚠ From `sinceWeek` and
 *     never `knownWeek` – how long THEY have been together, not how long the parent has known; §8's
 *     own clause-1 argument, pointed the other way. ⚠ And the threshold is what makes an `'engaged'`
 *     beat on an UNDELIVERED episode unreachable on engine-born rows: the raw lag tops out at 12
 *     weeks, far under 52, so by the time a row is deep enough to marry, `deliverKnownPartner` has
 *     long since raised its `'met'` – she is not announcing a fiancé nobody has heard of.
 *  4. THE RECEIPT – no `'engaged'` row exists for this episode yet (`hasBeatFor`, `'met'`'s own
 *     once-per-episode doctrine: the record is the queue AND the receipt). This is also what makes a
 *     SECOND wedding the same machinery on a LATER row: a latched episode necessarily carries the
 *     receipt, so it can never be asked again, while a new episode's own row starts clean. */
export function weddingEligible(world: WorldState): boolean {
  const wedding = ECONOMY.wedding
  if (kidAgeNow(world) < wedding.ageGate) return false
  const episode = activeEpisode(world)
  if (episode === null) return false
  if (world.week - episode.sinceWeek < wedding.minEpisodeWeeks) return false
  if (hasBeatFor(world, episode.id, ['engaged'])) return false
  return true
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE raise site of an `'engaged'` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED – an ineligible week takes ZERO
 *  draws, never draw-and-discard. The line order below IS the rule (§5's own note, third time).
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0, and a hazard
 *  of 0 must be impossible rather than merely unlikely.
 *
 *  ⚠ NO TEMPERAMENT TERM, AND THAT IS THE DRAFTED SHAPE RATHER THAN AN OVERSIGHT: `ECONOMY.wedding`
 *  drafts one flat `perWeek` and no multiplier table – who she is already shaped WHICH episodes
 *  exist and how long they last (the arrival and ends tables), so the decision-to-marry hazard
 *  starts uniform and T8's census measures whether the two trajectories both reach it. A per-voice
 *  column here would be a design decision wearing a constant (the `endsPerWeek` note's own law).
 *
 *  ⚠ IT RAISES THE BEAT AND WRITES NOTHING ELSE – no latch, no name, no feed row, no cents. The
 *  latch and the cost are T3's, `weeksAfterEngagement` weeks after the answer; the name is written
 *  at THIS beat but by T3's `partnerNameFor`, and until that task lands the row's `partnerName`
 *  stays null and every reader keeps its unnamed phrasing. The raise stops the week by
 *  `LIFE_BEAT_BLOCKING` alone – no new guard anywhere. */
export function rollWedding(world: WorldState): void {
  if (!weddingEligible(world)) return
  if (rngFromSeed(`${world.seed}:life:wedding:${world.week}`)() >= ECONOMY.wedding.perWeek) return
  // ⚠ THE ROW IS TAKEN AFTER THE DRAW AND IS THE GATE'S OWN – `weddingEligible` just proved it
  // non-null, and `rollEnds` runs before this at the call site, so the episode the beat is about is
  // the episode still standing this week.
  const episode = activeEpisode(world)!
  // ⭐⭐⭐ v83 T3 – HE GETS A NAME, AT THE ENGAGEMENT AND NOWHERE ELSE (the design's own moment: «a
  // latched partner finally needs one»). ONE call per episode ever – the raise below writes the
  // receipt that makes this line unreachable a second time – and the RESULT IS PERSISTED, never
  // re-derived at read (T1's law on the field): a later pool edit must never rename a husband an
  // old career already has. ⚠ The `??=` is belt on braces for hand-carried worlds: an episode that
  // somehow already holds a name keeps it, exactly as the migration's `??=` would keep it.
  episode.partnerName ??= partnerNameFor(world.seed, episode.id)
  raiseLifeBeat(world, 'engaged', episode.id)
}

/** ⚠ ⚠ DRAFT – THE POOL, ≥ 24 FICTIONAL FIRST NAMES AND NOT ONE SURNAME ANYWHERE IN THE WAVE, so no
 *  real person's name is CONSTRUCTIBLE (house trademark law satisfied by construction – the same
 *  guarantee `season/names.ts` engineers with curated pools, achieved here by never holding the
 *  second half at all). Every name is a draft for the owner's pass (invariant 4; T7's table).
 *
 *  ⚠ SINGLE TOKENS ONLY – no spaces, no initials – which is what keeps «no surname» a property a
 *  test can assert rather than a habit. ⚠ APPEND-ONLY once shipped, `SURNAMES`' own law and for the
 *  weaker of its two reasons only: the draw indexes by pool LENGTH, so a reorder or removal re-maps
 *  future draws – and though every DRAWN name is persisted (nobody is renamed), a grown pool changes
 *  which husband a NEW career on an old seed meets, which is the price of any pool change and the
 *  reason to append rather than edit. */
export const PARTNER_NAME_POOL: readonly string[] = [
  'Anton', 'Bruno', 'Casper', 'Daniel', 'Elias', 'Felix', 'Gabriel', 'Henrik',
  'Ivo', 'Jonas', 'Karel', 'Lukas', 'Matteo', 'Niko', 'Oskar', 'Pavel',
  'Rafael', 'Samuel', 'Tomas', 'Viktor', 'Willem', 'Xavier', 'Yann', 'Zeno',
  'Andrei', 'Marco', 'Ruben', 'Stefan',
]

/** ⭐⭐⭐ v83 T6's ONE DERIVATION FUNCTION, landed with T3 because the engagement is its one call
 *  site: WHO SHE IS MARRYING, drawn uniformly on `seed:life:partner-name:<episodeId>` – the wave's
 *  second and last new stream, (seed, episode)-keyed so no week's play and no other draw can shift
 *  it, and MAIN is never reached.
 *
 *  ⚠⚠ CALLED EXACTLY ONCE PER EPISODE, AT THE ENGAGEMENT, AND THE RESULT IS PERSISTED
 *  (`LoveEpisode.partnerName`) – `temperamentFor`'s own arrangement: the function is pure and
 *  re-derivable for the LIFE OF THE POOL, and it is precisely the pool's freedom to grow that makes
 *  the persisted copy the fact and this function only the pen it was written with. A reader that
 *  called this instead of reading the row would rename a husband the day a name is appended.
 *
 *  ⚠ `pickInt` over the whole pool – uniform, one draw, `drawPartnerWants`' own shape. */
export function partnerNameFor(seed: string, episodeId: string): string {
  const r = rngFromSeed(`${seed}:life:partner-name:${episodeId}`)
  return PARTNER_NAME_POOL[pickInt(r, 0, PARTNER_NAME_POOL.length - 1)]
}

/** ⭐⭐⭐ v83 T3 – THE WEDDING LANDS, and the ONE writer of `latchedWeek`.
 *
 *  ⚠⚠ `weeksAfterEngagement` WEEKS AFTER THE BEAT WAS ANSWERED, ON **ANY** ANSWER – opposing does
 *  not stop it, SHE decided; what opposing bought is the bond price already paid and the diary's
 *  memory of it. The beat is BLOCKING, so the answer landed on the raise week (`row.week` – time
 *  could not move between them) and the arithmetic below reads the row's own week.
 *
 *  ⚠⚠ FOUR GATES, EACH ONE LOAD-BEARING AND NONE A DRAW (zero draws in this function, on any path):
 *    · an `'engaged'` row, ANSWERED – an unanswered row cannot start the clock (unreachable in play,
 *      the block contract holds time; real on a crafted world);
 *    · its episode still ACTIVE – §8's ordinary hazard keeps running between the answer and the
 *      day, and an episode that ends inside those weeks is a wedding that never happens: the row
 *      keeps its receipt (no second ask of a dead episode) and the latch is never written. The
 *      bench REPORTS this frequency (T8) rather than hiding it;
 *    · not yet LATCHED – the latch is the receipt and the once-ness, `lifeLog.answer`'s own shape:
 *      one nullable field says both «has it happened» and «when», so a later week walks past;
 *    · the day has COME – `>=` rather than `===`, so a crafted world that jumped the calendar still
 *      lands exactly once (the latch refuses the second pass) and play, which ticks by one, lands
 *      ON the day.
 *
 *  WHAT LANDING WRITES, in one place: the latch (`latchedWeek = world.week`), ONE kept feed row and
 *  ONE album entry through the milestone channel (`markSchoolEnd`'s own two-surface idiom:
 *  `fireMilestone` keeps the line past every prune, `captureMilestone` gives the scroll its row,
 *  both idempotent per `wedding:<episodeId>` – so the SECOND wedding of a later episode captures
 *  its own line). ⚠ NO MONEY – the drafted `costCents` charge and its ledger event stood here until
 *  the 18.09 ruling closed Q-1 in his own words: «я думаю как с подарками, никто и нисколько» – the
 *  wedding follows the gifts' law, nobody pays and nothing; what the drafted $12,000 weighed is
 *  recorded in docs/specs/the-wedding-2026-09.md §3c. ⚠ NO name in any
 *  line – whether a surface speaks the husband's name is T7's wording question, not a default. */
export function landWedding(world: WorldState): void {
  for (const row of lifeLogOf(world)) {
    if (row.kind !== 'engaged' || row.answer === null) continue
    if (world.week - row.week < ECONOMY.wedding.weeksAfterEngagement) continue
    const episode = loveEpisodesOf(world).find((e) => e.id === row.detail)
    if (episode === undefined || episode.endedWeek !== null) continue
    if (episode.latchedWeek !== null) continue
    episode.latchedWeek = world.week
    // ⚠ DRAFT – the kept line is the builder's draft (invariant 4).
    fireMilestone(world, `wedding:${episode.id}`, 'Her wedding day. The family was there, whatever had been said about it.')
    captureMilestone(world, { type: 'wedding', week: world.week, kind: episode.id })
    // ⚠ The ledger charge (the `fundsCents` write and its expense row) stood here and was RULED OUT
    // 18.09 («я думаю как с подарками, никто и нисколько») – the wedding follows the gifts' law:
    // no money mechanics. The spec's §3c keeps the record of what the drafted charge weighed.
  }
}

// =================================================================================================
// 12. THE SPOUSE'S OPINION SURFACE – ⚠⚠ THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY
//     (the wedding, wave 7: T5)
// =================================================================================================
//
// `docs/plans/life-wave-7-builder-2026-09.md` §2 T5, constants in `ECONOMY.wedding`. §11 decides
// whether the episode becomes a marriage; this is what the marriage IS at W1–W2 – no `spouseBond`,
// no second tracked number (the 18.09 adoption): the spouse's standing is these beats and the
// diary's texture, and the surface goes quiet the day the latch does.
//
// ⚠⚠ THE WAVE'S THIRD AND LAST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE:
//
//     seed:life:spouse-view:<week>          which occasion, this week
//
// (seed, calendar)-keyed like every sibling, so a player cannot conjure or dodge the spouse's word
// by playing the week differently. ONE key, ONE value (the 09.09 stream law): the occasion pick is
// the only randomness this section owns – whether the beat fires at all is FACTS (the gate and the
// occasions below), never a hazard, which is the brief's own reading: «triggers READ existing world
// facts», and the draw is only ever asked to choose among the true ones.
//
// ⚠⚠ ZERO DRAWS ON MAIN (structural – nothing here takes an `Rng`), ZERO draws on an ineligible
// week AND on an eligible week with no true occasion – the gate and the filter both return before
// the stream exists, never draw-and-discard. The test is a KEY COUNT with a positive control
// (wave 3's finding, §5's standing law), in tests/wave7-spouse-view.test.ts §B. A frozen career
// (156 weeks, age 16.6) can never hold a latch, so this section is unreachable there by
// construction and the frozen identity stands.
//
// ⚠⚠ EVERY OCCASION IS A READ OF A SEAM THAT ALREADY ANSWERS IT – the brief's own boundary («no
// household ledger, no second wallet, no arithmetic»), and each gate below names its donor at the
// cell. Nothing here derives a new fact about the world; it asks four old ones.

/** ⭐ THE FOUR OCCASIONS, DERIVED FROM A TOTAL RECORD rather than written out – `WANTS_TOTAL`'s own
 *  guarantee: a fifth member of the union makes this record a compile error before it can make a
 *  silent gap in the gates below. ⚠ ROSTER ORDER IS DRAW ORDER and is append-only once shipped (the
 *  union's own note in `shared/protocol/narrative.ts`). */
const SPOUSE_VIEW_OCCASION_TOTAL: Record<SpouseViewOccasion, true> = {
  'distant-swing': true,
  'road-stretch': true,
  'no-vacation': true,
  money: true,
}
export const SPOUSE_VIEW_OCCASIONS = Object.keys(SPOUSE_VIEW_OCCASION_TOTAL) as readonly SpouseViewOccasion[]

/** THE LIVE LATCH – the one episode that is married and not over, or null. Inline in `rollEnds`' own
 *  spelling (`latchedWeek !== null` is T4's seam); named here because three readers ask it – the
 *  gate, the `'money'` occasion's window and the diary's assembly – and three spellings of «is she
 *  married» is the two-readings defect rule 3 exists to prevent. ⚠ At most one can exist on any
 *  state the sim produces: `activeEpisode` is the tail and `arrivalEligible` refuses to append
 *  behind an open row, so a second latched-and-open row would need two open episodes first. */
export function latchedEpisode(world: WorldState): LoveEpisode | null {
  return loveEpisodesOf(world).find((e) => e.latchedWeek !== null && e.endedWeek === null) ?? null
}

/** ⭐⭐⭐ THE FOUR GATES, ONE PER OCCASION, EACH A PURE ZERO-DRAW READ OF AN EXISTING SEAM – the
 *  `SMALL_TALK_FACT` table's own shape, asked BEFORE the draw so a false fact removes the occasion
 *  from the pool instead of being papered over in the copy (its own rule, inherited whole).
 *
 *  · `'distant-swing'` – the NEXT entered event crosses a border. The entry fields are
 *    `nextWeekIsClear`'s own two (`world.season` + `world.entries`, spelled inline for its stated
 *    cycle reason), and «crosses a border» is the tier's own `track` – `diary/travelHome.ts:521`
 *    reads `abroad` off exactly this field (`=== 'itf'`, the junior ladder that file is about);
 *    here it is `!== 'domestic'`, the same fact at the ages a marriage exists: her internationals
 *    are the W/WTA rungs by 23, and a gate spelled `'itf'` would have called a Slam a home week.
 *  · `'road-stretch'` – the family has been on the road: travel-billed weeks in the trailing
 *    `FRIENDS_WINDOW` at or past `AWAY_OFTEN`, which is the friends tile's own band («Mostly by
 *    phone») off the same `financeWeeks` read `world/snapshot.ts` assembles for it – «a week in
 *    which a travel bill was actually paid is a week the family was somewhere else».
 *  · `'no-vacation'` – `seasonWrapsWithNoVacation`, spirit.ts's season-boundary block ITSELF: true
 *    on the ONE week a season wraps with no family week in it, false everywhere else – so this
 *    occasion exists exactly where the fact is readable, and the spouse and the −3/−3 block can
 *    never disagree about whether the family had a holiday.
 *  · `'money'` – round 23 #18's split, read and never re-derived: a `financeWeeks` category at or
 *    under −`spouseViewSpendCents` inside the marriage's own trailing window (after the latch, so
 *    the wedding's own bill – paid ON `latchedWeek` – can never be the complaint), while her
 *    account holds more than the family wallet (`kidFundsCents` vs `fundsCents`, two persisted
 *    balances compared and nothing summed – beats about money, never accounting). */
const SPOUSE_VIEW_OCCASION_AT: Record<SpouseViewOccasion, (world: WorldState) => boolean> = {
  'distant-swing': (world) => {
    let next: { week: number; tier: TierId } | null = null
    for (const e of world.season) {
      if (e.week <= world.week || !world.entries.includes(e.id)) continue
      if (next === null || e.week < next.week) next = e
    }
    return next !== null && TIERS[next.tier].track !== 'domestic'
  },
  'road-stretch': (world) =>
    world.financeWeeks.filter(
      (w) => w.week > world.week - FRIENDS_WINDOW && w.week <= world.week && (w.byCategory.travel ?? 0) < 0,
    ).length >= AWAY_OFTEN,
  'no-vacation': (world) => seasonWrapsWithNoVacation(world),
  money: (world) => {
    const latch = latchedEpisode(world)
    if (latch === null) return false
    if (world.kidFundsCents <= world.fundsCents) return false
    const from = Math.max(world.week - ECONOMY.wedding.spouseViewCooldownWeeks, latch.latchedWeek! + 1)
    return world.financeWeeks.some(
      (w) =>
        w.week >= from &&
        w.week <= world.week &&
        Object.values(w.byCategory).some((v) => v !== undefined && v <= -ECONOMY.wedding.spouseViewSpendCents),
    )
  },
}

/** The occasions the spouse could honestly raise THIS week, in roster order – pure, zero draws,
 *  exported so the bench and the tests can ask the same question the roll asks. */
export function spouseViewOccasionsAt(world: WorldState): SpouseViewOccasion[] {
  return SPOUSE_VIEW_OCCASIONS.filter((occasion) => SPOUSE_VIEW_OCCASION_AT[occasion](world))
}

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A predicate
 *  of its own for `arrivalEligible`'s stated reason. Pure, zero draws, no writes.
 *
 *  1. A LIVE LATCH – the surface belongs to the marriage and to nothing before or after it: no
 *     latch, no spouse; an ended latch is an ended surface (the divorce door's other half, free).
 *  2. NOTHING BLOCKING IS WAITING – `smallTalkEligible`'s clause 1, same words: the week she has
 *     been asked the biggest question of her life is not the week the spouse queues behind it.
 *  3. NOT WHILE A SOFT ROW IS LIVE – «one at a time», clause 2's own argument: a second live card
 *     would queue invisibly or replace the first, and replacing is how «never lost» stops being
 *     true.
 *  4. THE COOLDOWN, OFF THE LOG ITSELF – the row is the counter (`smallTalkThisSeason`'s doctrine,
 *     no new state): no `'spouse-view'` row inside the trailing `spouseViewCooldownWeeks`. ⚠ It
 *     counts RAISED rows, answered or not – a card the parent ignored still spent the marriage's
 *     turn to speak. */
export function spouseViewEligible(world: WorldState): boolean {
  if (latchedEpisode(world) === null) return false
  if (pendingLifeBeat(world) !== null) return false
  if (liveSoftBeat(world) !== null) return false
  return !lifeLogOf(world).some(
    (row) => row.kind === 'spouse-view' && world.week - row.week < ECONOMY.wedding.spouseViewCooldownWeeks,
  )
}

/** ⭐⭐⭐ THE WEEKLY CALL, and the ONE raise site of a `'spouse-view'` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST, THE OCCASIONS SECOND, AND THE STREAM IS DERIVED ONLY WHEN BOTH HAVE
 *  PASSED – an ineligible week takes ZERO draws, and so does an eligible week with nothing true to
 *  say (the small-talk reachable-empty discipline, inherited whole; there is no legacy fallback
 *  here because a spouse with no occasion simply says nothing this week).
 *
 *  ⚠ NO HAZARD AND NO CHANCE CONSTANT, WHICH IS THE BRIEF READ LITERALLY: «triggers READ existing
 *  world facts» – the facts fire the beat, the cooldown bounds it, and the one draw picks WHICH
 *  true occasion is spoken (uniform over the true set, `drawPartnerWants`' own pickInt shape). A
 *  per-week chance would be a design decision wearing a constant nobody drafted.
 *
 *  ⚠ THE DETAIL IS THE OCCASION – machine-readable, never a rendered sentence, stamped and never
 *  re-derived (tier 1's own argument: the row is live for three weeks and re-assembled on every
 *  `toSnapshot`, and a re-derivation could hand the parent a complaint about a season that has
 *  since moved on – or one whose fact has gone false). */
export function rollSpouseView(world: WorldState): void {
  if (!spouseViewEligible(world)) return
  const occasions = spouseViewOccasionsAt(world)
  if (occasions.length === 0) return
  const at = pickInt(rngFromSeed(`${world.seed}:life:spouse-view:${world.week}`), 0, occasions.length - 1)
  raiseLifeBeat(world, 'spouse-view', occasions[at])
}

/** ⭐ THE WEEK'S OWN OCCASION, FOR THE DIARY ALONE – the `'spouse-view'` row raised THIS week, or
 *  null. `DiaryFacts.spouseOccasion`'s one derivation, asked at snapshot time and carried
 *  (`partnerKnown`'s own shape and reason: the beat and the week note must not be able to disagree
 *  about what was said this week). ⚠ THE RAISE WEEK AND NOT THE WINDOW: the scene happened on the
 *  row's own week, and a note that repeated it for three weeks would be the diary stuttering. */
export function spouseViewOccasionThisWeek(world: WorldState): SpouseViewOccasion | null {
  const row = lifeLogOf(world).find((r) => r.kind === 'spouse-view' && r.week === world.week)
  if (row === undefined) return null
  return SPOUSE_VIEW_OCCASIONS.find((o) => o === row.detail) ?? null
}

// =================================================================================================
// 13. THE INDEPENDENT LIFE – ⚠ THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog §8)
// =================================================================================================
//
// One-time, NON-blocking, narrative-only (the brief's own three words): a kept feed row, a soft
// card for three weeks, one diary line – and NO mechanic, NO cost, NO bond move, because a
// residence mechanic is explicitly gated on the owner's word (backlog §8's own sentence).
//
// ⚠⚠ ZERO DRAWS, ON EVERY PATH, AND THE DETERMINISM IS ARGUED RATHER THAN ASSUMED (the brief asks).
// The house draws when the world has something to DECIDE – which week among many (a hazard), which
// member of a pool (a name, a frame). This moment has neither: the week is the stage's own first
// week, and the scene is one scene. A purpose-scoped coin here would be randomness with no question
// under it. So nothing in this section takes or derives an `Rng`, MAIN is structurally out of
// reach, and the frozen capture (41550 / e6b0c709) cannot see it – nor can the frozen per-key
// identity move: a 156-week career stands at 16.6 and never reads `independent`.

/** ⭐ THE GATE – and the AGE CONSTANT IS DELIBERATELY NOT NEW: «her own door» already has one
 *  spelling in this engine, the `independent` life stage (`diaryLifeStageFor`: 22+, school over,
 *  not at college – read through `lifeStageOf`, this file's one reading of it). Backlog §8's «near
 *  the first week at 22+» is that cut, and reading it keeps the two surfaces honest at once: a
 *  college girl at 22 lives in a dorm, her diary says so, and a spare-key card over that diary
 *  would be the two surfaces contradicting each other on one screen. Her beat waits for the week
 *  the stage itself turns – which for a college career is the week the campus is behind her.
 *
 *  ⚠ THE RECEIPT IS THE LOG (`'met'`'s doctrine): one `'own-key'` row per career, ever. ⚠ THE TWO
 *  SURFACE CLAUSES DEFER, NEVER CANCEL – `deliverKnownPartner`'s `<=` courtesy: a week the soft
 *  surface is busy leaves the receipt unwritten, and the next tick asks again. «Near the first
 *  week», the brief's own word. */
export function ownKeyDue(world: WorldState): boolean {
  if (lifeStageOf(world) !== 'independent') return false
  if (lifeLogOf(world).some((row) => row.kind === 'own-key')) return false
  if (pendingLifeBeat(world) !== null) return false
  return liveSoftBeat(world) === null
}

/** ⭐⭐ THE DELIVERY, and the ONE writer of an `'own-key'` row – zero draws, `deliverKnownPartner`'s
 *  own two-surface order: the kept feed row is what HAPPENED, the soft row is the family's moment
 *  with it, so the news is on the record before the card can be answered.
 *
 *  ⚠ THE ROW IS `keep: true` AND STAMPED `lifeKind: 'own-key'` – the private-life thread's glyph
 *  column reads the stamp (`lifeRowGlyphs.ts`), and an unpicked kind wears the owner's standing
 *  white heart by that file's own fallback; the glyph itself stays his to pick (§5a).
 *  ⚠ NO `amountCents` (rule 4) – the week she moved out is not a purchase the game recorded. */
export function deliverOwnKey(world: WorldState): void {
  if (!ownKeyDue(world)) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ DRAFT (§3i)
    text: OWN_KEY_ROW,
    lifeKind: 'own-key',
  })
  // ⚠ THE DETAIL IS THE LITERAL KIND – machine-readable and empty of variation, because the row
  // records nothing per-instance: there is exactly one of these in a life.
  raiseLifeBeat(world, 'own-key', 'own-key')
}

/** ⭐ THE WEEK'S OWN FLAG, FOR THE DIARY ALONE – `spouseViewOccasionThisWeek`'s twin: true exactly
 *  on the raise week, so the one diary line lands once and the note cannot stutter. */
export function ownKeyThisWeek(world: WorldState): boolean {
  return lifeLogOf(world).some((row) => row.kind === 'own-key' && row.week === world.week)
}

// =================================================================================================
// 14. THE PREGNANCY – ⚠⚠ THE WEEK SHE SAYS SHE IS HAVING A CHILD (the pregnancy, wave 8: T2)
// =================================================================================================
//
// `docs/plans/life-wave-8-builder-2026-09.md` §2 T2, constants in `ECONOMY.motherhood`, the research
// `docs/research/life-events-motherhood.md`. §11 decides whether the episode becomes a MARRIAGE;
// this decides whether the marriage becomes a FAMILY, and it is the step the design plan's 3d was
// gated on. ⚠ It is §14 for §8's own stated reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S FIRST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE:
//
//     seed:life:pregnancy:<week>            does she conceive, this week
//     seed:life:window:<conceivedWeek>      how long before she says so (v87, the weight – wave 11 T2)
//
// (seed, calendar)-keyed like every sibling, so a player cannot conjure or dodge a pregnancy by
// playing the week differently – input-independence is permanent law, and nothing here takes an
// `Rng`, so MAIN is structurally out of reach and the frozen capture (41550 / e6b0c709) cannot see
// this section. `seed:life:return:<week>` is T5's and `seed:life:birth:<episodeId>` is RESERVED IN
// WRITING for the day boys exist (T1's own note on `ChildRecord`) – neither exists on this tree and
// neither may be created early (§5's own reservation rule, fourth use).
//
// ⚠⚠ ZERO DRAWS ON AN INELIGIBLE WEEK **AND ON A WEEK WHOSE SHAPED HAZARD IS 0** – the gate returns
// before the stream is derived and so does the chance, never draw-and-discard. §5's load-bearing
// rule inherited whole, with one clause more than §11 needed: the wedding's hazard is a single flat
// number that cannot be 0, and this one is an age curve that is 0 under 24 and at 35+. THE LINE
// ORDER IS THE RULE. And the test for it is a KEY COUNT, not an alignment comparison (wave 3's
// finding, the wave-4 brief's §0.1 law): every key carries its own week, so
// tests/wave8-pregnancy.test.ts counts the keys the gate reached, with a positive control.
//
// ⚠ SHE DECIDES; THE HAZARD IS THE DECIDING (§4a, at the layer's biggest moment). No parent action
// opens or closes this – the gate reads the marriage, the seat and her body, and the parent's part
// arrives one screen later as three answers priced on `bond` and graded onto `support`. None of them
// is a veto, because there is no veto to write.
//
// ⭐⭐⭐ THE DECOUPLING LAW – RULED 20.09, AND THE NEXT BUILDER IS THE ONE THIS PARAGRAPH IS FOR.
//
// A MID-PREGNANCY DIVORCE IS ORDINARY LIFE, not a content branch: «развелись и развелись, жизнь
// продолжается, да, будут эмоциональные последствия, но в целом, ничего необычного». The architect's
// drafted ×0 suppression is DEAD and nothing here replaces it.
//
// SO: `episodeId` BELOW IS A REFERENCE AND NEVER A LIVENESS CHECK. T4's birth fires on `dueWeek` and
// T5's decision opens in its window because `world.pregnancy` says so – and NEITHER MAY ASK WHETHER
// THE EPISODE IT NAMES IS STILL ALIVE. What the id is for is the record and the diary: whose child,
// which marriage, which row the album reads back. A reader that turned it into a gate would delete a
// pregnancy the week a marriage ended, which is the one reading of this ruling that is wrong.
//
// ⚠ NOTHING IS ADDED FOR THE MID-TERM ENDING AND NOTHING IS SUPPRESSED. Wave 7's standing machinery
// already carries the whole event – the ending, the feed row, the `'breakup'` shock, the bond
// texture – and the spouse-view surface silences itself through its own latched-and-alive check.
// Wave 7 measured the price: 6.2 endings per 100 latched episode-years over a ~40-week term ≈ ~5% of
// pregnancies. T9 reports the measured share beside that prediction.
//
// ⚠ THE GATE IS THE ONE PLACE ALIVENESS IS READ, AND IT IS READ ABOUT THE FUTURE RATHER THAN THE
// PAST: `latchedEpisode` asks whether a marriage is standing THIS week, which is what decides
// whether a NEW pregnancy may start. That is not a liveness check on an existing one – there is no
// existing one on any week this function can fire.

/** ⭐⭐ THE SHAPED HAZARD – her weekly chance on an ELIGIBLE week, or 0. Pure, zero draws, no writes.
 *
 *  ⚠⚠ THE RATE IS **DERIVED FROM HIS OWN DIGEST** AND THE DERIVATION IS AT THE CONSTANT, NOT HERE –
 *  `ECONOMY.motherhood.perWeekByAge` carries the whole of it: the research row «First pregnancy |
 *  24–35 | 2–4%», the annual figures written as the numerators they are, the shape flagged as the
 *  builder's own draft with its arithmetic, and the census it predicts (15–30% of latched careers by
 *  35, RULED 20.09). His 20.09 push-back – «а на чем основана цифра? не великовато получится?» – is
 *  why all of that is in the source instead of in a plan file, and the first draft's 35–60% is dead.
 *
 *  ⚠ THE LAST RUNG WHOSE `fromAge` SHE HAS REACHED WINS, and an age under the first rung takes 0.
 *  The loop reads the table in order rather than searching backwards so that «ascending» is what the
 *  code actually depends on, which is what §A of the test pins.
 *
 *  ⚠⚠ AGE IS **NOT** IN THE GATE AND THIS IS WHERE IT LIVES INSTEAD – §0's adopted recommendation,
 *  his own §6.4: «the age window is the research's 24–35, hazard-shaped, never a hard gate». The
 *  practical difference is that a gate has to be re-argued to move and a rung is re-tuned by T9 with
 *  one number; the mechanical difference is nothing at all, because a 0 here takes ZERO DRAWS exactly
 *  as an ineligible week does (`rollPregnancy` returns on the chance before it derives the stream). */
export function pregnancyChanceAt(world: WorldState): number {
  const age = kidAgeNow(world)
  const m = ECONOMY.motherhood
  // ⭐⭐⭐ W5/T3 – WHICH CURVE, and it is the count of children that decides. A career with none on
  // the board reads `perWeekByAge` and is byte-identical to everything wave 8 measured; a career
  // that already has one reads `repeatPerWeekByAge`, which is his digest's own later window and
  // lower rate. ⚠ TWO CURVES AND ONE READING – the rung loop below is shared, so the two can differ
  // in what they say and never in how they are consumed.
  const born = world.children.length
  const rungs = born === 0 ? m.perWeekByAge : m.repeatPerWeekByAge
  let perWeek = 0
  for (const rung of rungs) if (age >= rung.fromAge) perWeek = rung.perWeek
  if (perWeek <= 0 || born <= 1) return perWeek
  // ⭐⭐ AND EVERY CHILD AFTER THE FIRST THINS IT – the design's «a third stays rare rather than
  // routine», as one factor rather than a third curve. `born - 1` so the SECOND child is the plain
  // repeat rate and the third is the first one thinned.
  return perWeek * Math.pow(m.repeatCountFactor, born - 1)
}

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A predicate
 *  of its own for `weddingEligible`'s and `arrivalEligible`'s stated reason: a reader must see, in
 *  one place, that the whole of eligibility is decided before any stream exists. Pure, zero draws,
 *  no writes. ⚠ THREE AT T2 AND FOUR SINCE T2½ PIECE 3 – clause 3 is the wave's SCOPE BRAKE and is
 *  the one clause here that is meant to be lifted (by W5, by name, at its own bullet below).
 *
 *  1. ⭐ THE DOOR IS MARRIAGE – RULED 20.09 («это ок» on the architect's firm yes), so the episode
 *     must be ACTIVE **and** LATCHED. Asked through `latchedEpisode` (§12) and NEVER spelled a second
 *     way: that function is already exactly this question («the one episode that is married and not
 *     over»), it already has three readers, and `activeEpisode`'s own law is that two spellings of
 *     one fact are a defect waiting for a week to disagree on. ⚠ The age floor rides in free: a
 *     wedding needs 23+ (wave 7, RULED 11.09) plus a 52-week-deep episode, so the junior years are
 *     out by construction and no age clause is needed here to keep them out.
 *  2. NO PREGNANCY ALREADY – `world.pregnancy === null`. One at a time, which is the seat's own shape
 *     (T1: «one live pregnancy at a time, hung off the world»). ⚠ ON THE T2 TREE NOTHING EVER CLEARED
 *     IT, so this clause was ALSO the once-per-career receipt, by accident rather than by design.
 *     T2's own note stopped there and concluded that no clause 3 was needed. ⚠⚠ THAT CONCLUSION WAS
 *     WRONG AND IS CORRECTED BELOW rather than quietly rewritten, because the reasoning is worth
 *     keeping: T2 wrote «a receipt invented now would be the thing W5 has to delete», and the answer
 *     is that W5 does not DELETE the clause below, it REPLACES it – with the count-aware hazard the
 *     design already asks for (§3: «the repeat hazard reads the age window AND the count of children,
 *     so a third stays rare rather than routine»). The line W5 edits is the line that already reads
 *     the count.
 *  3. ⭐⭐⭐ ⚠⚠ **LIFTED BY W5/T3 (21.09), AS THIS BULLET ITSELF PREDICTED.** What replaces it is the
 *     COOLDOWN below plus the count-aware hazard in `pregnancyChanceAt`, which is precisely the
 *     «W5 does not DELETE the clause, it REPLACES it» this note argued for. The original text is
 *     kept below because the reasoning is what made the replacement safe, and the census corridor
 *     it names is now the FIRST pregnancy's alone. Originally: AND NONE BORN –
 *     `world.children.length === 0`. ⚠⚠ THIS IS A **SCOPE BRAKE** AND NOT A
 *     CLAIM ABOUT HER LIFE. It says «this WAVE ships at most one pregnancy per career», which is
 *     exactly what §4 promises («no repeat pregnancy enabled – W5 re-enters the same machinery») and
 *     exactly what T9's census measures («share of latched careers reaching a pregnancy by 35»). It
 *     does NOT say a woman has one child: repeat pregnancy is CONFIRMED WANTED in the owner's own
 *     words («после беременности может быть и повторная», 11.09), and **W5 is the task that lifts
 *     this line** – by name, here, so nobody later reads a scope boundary as a design ruling.
 *     ⚠ WITHOUT IT §4 IS FALSE THE MOMENT THE RECORD IS CLEARED – T5's `resolveReturnDecision` as
 *     shipped, T6 in T2½'s own reading – and falsely in the quietest possible
 *     way: `world.pregnancy` goes back to `null` at the return, the same marriage re-enters the
 *     standing hazard, and repeat pregnancies happen at the FIRST pregnancy's rates – unbenched, and
 *     under a census whose corridor was derived for a different quantity. ⚠ IT NEEDS NO NEW FIELD:
 *     `children` already exists and T4 is its writer, so the receipt is a READ of state the wave is
 *     already keeping rather than a second place for the same fact to live.
 *  4. ⚠ NO KNOCK RUNNING – `knockRunning` (`world/constants.ts`, re-exported beside `pendingKnock` in
 *     `world/knock.ts`), which is the brief's «no fire while a knock layoff is live» asked through
 *     ONE spelling. The three-field read and the reasons both live at that definition; the short of
 *     it is that a knock is the family already rearranging this calendar around this body, and the
 *     announcement's own consequence is a second, larger rearrangement of it eight weeks out.
 *
 *  ⚠ AND NOTHING ABOUT HER RANK, HER FORM OR HER MONEY IS IN HERE, which is worth saying because
 *  every one of them was available. This is her life, not her season. */
export function pregnancyEligible(world: WorldState): boolean {
  if (latchedEpisode(world) === null) return false
  if (world.pregnancy !== null) return false
  // ⭐⭐⭐ W5/T3 – AND CLAUSE 3 IS LIFTED, exactly as T2½'s own note said it would be: the SCOPE
  // BRAKE («this WAVE ships at most one pregnancy per career») is replaced by the count-aware
  // hazard the design asked for, which lives in `pregnancyChanceAt` above. What stays here is the
  // one thing a hazard cannot say: how soon after a birth the next pregnancy may start.
  //
  // ⚠ AND WHAT THE COOLDOWN PROTECTS IS THE COMEBACK, not decency. `world.comeback` holds the
  // freeze she is in the middle of spending, and a second pregnancy overwrites that record at its
  // own return – so without this clause a career could lose twelve protected entries it had already
  // been granted, silently, to a hazard that fired eight weeks after the birth. ⚠ DRAFTED AT A YEAR
  // and benched in T7; the alternative shape (refuse only while the freeze still has entries left)
  // is written at the constant.
  const lastBirth = world.children.reduce((w, child) => Math.max(w, child.bornWeek), -Infinity)
  if (world.children.length > 0 && world.week - lastBirth < ECONOMY.motherhood.repeatCooldownWeeks) {
    return false
  }
  // ⭐⭐⭐ v87 T4 – AND A LOSS RE-ARMS THE HAZARD BEHIND A GENTLER COOLDOWN, through this same
  // machinery rather than through a clause of its own (the spec's §3: «reading the same eligibility
  // machinery wave 9 built»). `ECONOMY.weight.lossCooldownWeeks` is drafted 26 against the birth's
  // 52, and the constant carries why the two differ: the birth's number protects the COMEBACK, and
  // a loss creates none.
  //
  // ⚠⚠ IT READS `pregnancyLossWeeks` AND NEVER A DERIVED GUESS, which is the whole reason that list
  // is persisted: the pregnancy record is CLEARED on a loss, so there is nothing left on the world
  // that remembers one. `spiritShock` is not a second source either – it holds ONE mark and clears
  // itself when she recovers.
  const lastLoss = world.pregnancyLossWeeks.reduce((w, at) => Math.max(w, at), -Infinity)
  if (world.pregnancyLossWeeks.length > 0 && world.week - lastLoss < ECONOMY.weight.lossCooldownWeeks) {
    return false
  }
  if (knockRunning(world)) return false
  return true
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T2) – **HOW LONG SHE CARRIES IT BEFORE SHE SAYS SO**, in weeks, on
 *  `seed:life:window:<conceivedWeek>`. The hidden window of the design's §3, and the cheapest thing
 *  in the whole wave: one persisted number and one draw.
 *
 *  ⚠⚠ **THE WINDOW IS NOT THE WEIGHT AND IT IS NOT GATED BY THE SWITCH**, which is the one
 *  sentence a reader of this section most needs, because the two mechanics meet three lines apart.
 *  Every pregnancy has weeks between conception and «I have something to tell you» – that is life
 *  rather than grief – so this draw happens on every conception, with the switch on or off. Only the
 *  LOSS is gated (§3, and `world/lifeBeat.ts` §15). A career with the weight off is byte-identical to
 *  a pre-wave career in its LOSS hazard and deliberately NOT in its announcement date, and §8 row 6's
 *  arm is written to measure exactly that distinction rather than to paper over it.
 *
 *  ⚠ IT READS `ECONOMY.life.lag`'s SHAPE AND NOT `drawRawLag`'s STREAM, and the split is the
 *  split-key law rather than an oversight. The TABLE is the same fact seen twice – who-she-is §4's
 *  openness register, «open tells soon, private takes a while» – and sharing it is the single-source
 *  rule. The KEY may not be shared: `drawRawLag` answers «how late did the parent hear about an
 *  ATTACHMENT» on `seed:life:partner:<sinceWeek>:lag`, and two different facts on one key is what
 *  that law forbids.
 *
 *  ⚠ NO BOND SHAVE. `shaveLag` shortens the attachment's lag by the relationship the parent built,
 *  and that is deliberate there («the one place in this wave where a player choice is allowed to
 *  show»). Here it would be a mechanic reading the parent INTO the window, and the design's §3 is
 *  explicit that what he does inside it is his own and innocent. The window is the world's dice.
 *
 *  ⚠ KEYED ON THE CONCEPTION WEEK, so it is (seed, calendar)-keyed like every sibling and a player
 *  cannot shorten it by playing the week differently – input-independence, permanent law. */
export function drawConceptionWindow(seed: string, conceivedWeek: number, openness: 'open' | 'private'): number {
  const table = ECONOMY.life.lag[openness]
  const r = rngFromSeed(`${seed}:life:window:${conceivedWeek}`)
  if (r() < table.zeroChance) return 0
  return pickInt(r, table.min, table.max)
}

/** ⭐⭐⭐ THE WEEKLY ROLL, the ONE place in the engine where `world.pregnancy` goes non-null.
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, AND IT IS FOUR STEPS RATHER THAN §11's THREE. The gate returns
 *  first; the CHANCE is computed second and returns if it is 0; only then is the stream derived. An
 *  ineligible week takes ZERO draws and so does a week outside the 24–35 curve – never
 *  draw-and-discard (§5's own note, fourth time, and the reason `pregnancyChanceAt` is a function
 *  rather than an expression inside the comparison).
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0, and a hazard of
 *  0 must be impossible rather than merely unlikely. With an age curve that really does read 0 at
 *  both ends, this is no longer a theoretical courtesy – the early return above covers it, and the
 *  comparison is the second net under the same hole.
 *
 *  ⚠ NO TEMPERAMENT TERM, `wedding.perWeek`'s own decision and the same argument: who she is already
 *  shaped WHICH marriage exists and how long it lasts, so the conceiving hazard starts on age alone
 *  and T9's per-temperament grid measures whether all four voices reach it inside the ±1.5 pp
 *  fairness corridor. A per-voice column here would be a design decision wearing a constant.
 *
 *  ⚠⚠ THE RECORD IS WRITTEN AT THE **CONCEPTION** AND NOT AT THE ANSWER, and the choice is
 *  deliberate. She is pregnant whether or not the parent has answered the card – and since v87's
 *  window, whether or not he has been TOLD – so `support: null` is the TRUE reading of the gap, which
 *  is the argument T1 already wrote onto the field. The alternative leaves a world that can be SAVED
 *  and LOADED with a pregnancy nobody can see and nothing in the state.
 *  ⚠ `returnPlan` IS NOT ON THIS RECORD ANY MORE – ruling A moved it to `world.comeback`, where the
 *  beat that asks it can actually reach it.
 *
 *  ⭐⭐⭐ v87 T2 – **AND IT NO LONGER RAISES THE BEAT.** `landPregnancyAnnouncement` below does, on
 *  `announcedWeek`, which is this week plus the drawn window. What this function does is write the
 *  record and draw the window; the card, the block and the parent's answer are `windowWeeks` away
 *  and may be zero weeks away, which is the case that reproduces every pre-window date exactly.
 *
 *  ⚠ `dueWeek` IS COMPUTED HERE AND PERSISTED, never re-derived at read – `PregnancyState`'s own law
 *  (T1, and `partnerName`'s one wave down): a later retune of `termWeeks` must never move the due
 *  date of a pregnancy a live career is already carrying. The same holds for `pausesWeek`.
 *
 *  ⚠ IT WRITES THE RECORD AND NOTHING ELSE – no feed row, no diary line, no cents, no entry closed,
 *  no portrait, and since v87 no card either. The pause is T3's, the birth T4's, the texture T8's and
 *  the portraits T10's.
 *
 *  ⚠⚠ TWO DRAWS ON TWO KEYS SINCE v87, AND THE SECOND ONE IS **NOT** GATED BY THE WEIGHT SWITCH.
 *  The window exists for every pregnancy – it is life rather than grief – and only the LOSS is
 *  gated (§3). `drawConceptionWindow`'s own block argues it at length, at the one place the two
 *  mechanics meet. ⚠ The window draw happens ONLY on a week the hazard actually landed, so an
 *  ineligible week and a missed roll still take exactly ONE key, which is what §B of
 *  tests/wave8-pregnancy.test.ts counts. */
export function rollPregnancy(world: WorldState): void {
  if (!pregnancyEligible(world)) return
  const chance = pregnancyChanceAt(world)
  if (chance === 0) return
  if (rngFromSeed(`${world.seed}:life:pregnancy:${world.week}`)() >= chance) return
  // ⚠ THE ROW IS TAKEN AFTER THE DRAW AND IS THE GATE'S OWN – `pregnancyEligible` just proved it
  // non-null, and `rollEnds` runs before this at the call site, so the marriage the record points at
  // is the marriage still standing this week.
  const episode = latchedEpisode(world)!
  // ⭐⭐⭐ v87 T2 – THE HIDDEN WINDOW, DRAWN ON THE WEEK SHE CONCEIVES. Openness is the girl's own
  // register (`temperamentFor`), not the `wants` she drew for this attachment: `drawRawLag`'s own
  // reading of who-she-is §4, inherited rather than re-argued.
  const openness = temperamentOpenness(temperamentFor(world.seed, world.dynasty?.motherTemperament))
  const windowWeeks = drawConceptionWindow(world.seed, world.week, openness)
  const conceivedWeek = world.week
  const announcedWeek = conceivedWeek + windowWeeks
  // ⭐⭐ THE FIRST-TRIMESTER CAP (the review of T2 – the constant's own note carries the argument):
  // «up to 8 after she tells», and never past the trimester competition really stops at. For a short
  // window the min is the shipped arithmetic unchanged; for a long one she stops entering BEFORE the
  // announcement – the absence of entries is the telling, the design doc's own scene.
  const pausesWeek = Math.min(
    announcedWeek + ECONOMY.motherhood.playsOnWeeks,
    conceivedWeek + ECONOMY.motherhood.firstTrimesterWeeks,
  )
  world.pregnancy = {
    // ⭐⭐⭐ A REFERENCE AND NEVER A LIVENESS CHECK – THE DECOUPLING LAW, and the banner above is
    // where it is argued. This id says WHOSE and WHICH MARRIAGE, for the record, the diary and the
    // album; it does not say whether the pregnancy is still real. T4 and T5 read `world.pregnancy`.
    episodeId: episode.id,
    // ⭐⭐⭐ v87 T2 – THE WEEK THE HAZARD FIRED, which is the week she conceived and is no longer the
    // week she says so. Everything below is derived from it.
    conceivedWeek,
    announcedWeek,
    pausesWeek,
    // ⭐⭐⭐ v87 T2 – **THE ONE-NUMBER LAW** (§2): the birth rides the CONCEPTION clock, so the
    // announcement sits inside the term instead of ahead of it and a pregnancy is 39 weeks lived
    // whatever the window drew. `dueWeek = pausesWeek + termWeeks` was the wave-8 formula and it
    // assumed conception AT the announcement – kept as `termWeeks` and written out as half of
    // `termTotalWeeks`, so the arithmetic below reproduces every pre-window date exactly when the
    // window draws 0.
    dueWeek: conceivedWeek + ECONOMY.motherhood.termTotalWeeks,
    // ⚠ NULL IS A REAL STATE AND NOT A PLACEHOLDER: she has told him and he has not answered yet.
    // `answerLifeBeat` writes the grade, once, on the answer (T1's own note on the field).
    support: null,
    // ⚠⚠ NULL UNTIL THE PAUSE WEEK, AND IT IS **NOT** CAPTURED HERE (v85 T6). The ruled freeze is «her
    // rank at `pausesWeek`», which is eight weeks after this line – she plays on through them, so the
    // standing this week is not the standing the rule names. `landPregnancyPause` takes it on the week
    // it is true; the field's own note in `world/state.ts` carries why it is a capture at all.
    rankAtPause: null,
  }
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T2) – **THE WEEK SHE SAYS IT**, which is no longer the week she
 *  conceived. The ONE raise site of an `'expecting'` row, moved here out of `rollPregnancy` when the
 *  window separated the two facts.
 *
 *  ⚠⚠ NOTHING PRICES THE WEEKS BEFORE THIS ONE, AND THAT IS THE DESIGN'S OWN LAW RATHER THAN A
 *  CONSEQUENCE OF THE BUILD (the design's §3, and §2 of the spec): «What the parent does inside the
 *  window is his own, and innocent. He plans a brutal block because he does not know. When she tells
 *  him, the weeks behind him are re-read – by him, not by the game. No mechanic prices those weeks.»
 *  So the window costs nothing, closes nothing, says nothing and draws nothing after its one draw:
 *  `motherhoodBandAt` is silent until this week, the portrait wears no pregnancy painting until this
 *  week (`pregnancyFaceAt`'s `week < announcedWeek`), the entry gate reads `pausesWeek` which is
 *  eight weeks AFTER this one, and the fall door reads this week rather than the record's existence.
 *  `tests/wave11-window.test.ts` §C walks the window and asserts the world is byte-identical to one
 *  where no hazard fired at all, which is the only form of that claim that cannot rot.
 *
 *  ⚠ IT RAISES WITH `pregnancy.episodeId` AND NEVER WITH `latchedEpisode` – THE DECOUPLING LAW
 *  (RULED 20.09), and here it is load-bearing for the first time: a marriage can END inside the
 *  window, and `latchedEpisode` would answer `null` on the very week she says she is having a child.
 *  §14's banner says the id is a reference and never a liveness check; this is the call site that
 *  would have broken it.
 *
 *  ⚠⚠ `>=` PLUS A RECEIPT, NOT `===`, AND THE PAIR IS `landWedding`'s RATHER THAN
 *  `landPregnancyPause`'s. A missed pause row is a missed line of texture; a missed ANNOUNCEMENT is
 *  a pregnancy that runs to a birth nobody was ever told about – the blocking card never stands, the
 *  parent never answers, `support` stays `null` for ever and the return reads a grade nobody gave.
 *  So the week is a floor and the receipt is the log: an `'expecting'` row at or after this
 *  pregnancy's own conception week can only be this pregnancy's.
 *
 *  ⚠ ZERO DRAWS: the window was drawn at conception and is persisted; this compares two integers
 *  and scans the log. It takes no `Rng`, so MAIN is structurally out of reach and the frozen capture
 *  (41550 / e6b0c709) cannot see it. */
export function landPregnancyAnnouncement(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week < pregnancy.announcedWeek) return
  if (world.lifeLog.some((row) => row.kind === 'expecting' && row.week >= pregnancy.conceivedWeek)) return
  // ⚠ THE DETAIL IS THE EPISODE ID, `'met'` / `'ended'` / `'engaged'`'s own shape – machine-readable,
  // never a rendered sentence. ⚠ AND IT IS NOT THE RECEIPT HERE, which is the one way this kind
  // parts from the wedding: `world.pregnancy` is what clause 2 of the gate reads, so the once-ness
  // lives on the record rather than in the log, and a career that reaches a SECOND pregnancy one day
  // (W5) gets a second row about the same marriage without any of this changing.
  raiseLifeBeat(world, 'expecting', pregnancy.episodeId)
}

/** ⭐⭐⭐ **HIS STRING, PASSED 21.09 IN SESSION** (wave 8b, C5) – the pause week's one feed row, and
 *  no longer a draft. Invariant 4 now binds the other way: nobody re-words it unasked.
 *
 *  ⚠ IT MUST NOT SAY THE SEASON IS OVER, and that is the whole difficulty of writing it: already
 *  booked events inside the window PLAY OUT (the brief's own clause, `pauseCovering`'s note in
 *  `world/medical.ts`), so «no more tennis this year» would be a sentence the very next week could
 *  contradict on screen. The second half says what the first half leaves open.
 *  ⚠ HUSBAND-AGNOSTIC (§0's decoupling ruling): it reads correctly for a career whose marriage ended
 *  the week before, because it does not mention him.
 *  ⚠ AND IT NAMES NO RETURN. «until she is back» is a promise T5 is allowed to break; the birth is
 *  the one date this wave knows, so it is the only one the line uses.
 *  ⚠⚠ THE FIRST DRAFT READ «entering nothing more», THE TAIL-LINT CAUGHT IT – `'nothing more'` is on
 *  the bibles' banned-narrator-tail list (`tests/helpers/bannedTails.ts`, swept over this file by
 *  `tests/wave3-tail-lint.test.ts`) – AND **HE RULED THE LINT OUT OF THIS ONE ROW ON 21.09**. The
 *  stiff English was the guard shaping copy, which is the tail wagging: the ban is on the NARRATOR
 *  interpreting her, and «entering nothing more» here is a plain statement of what she is doing.
 *  ⚠ THE EXEMPTION IS PER-ROW AND LIVES BESIDE THE BAN (`TAIL_EXEMPT_LINES`,
 *  `tests/helpers/bannedTails.ts`), naming this exact sentence and that ruling. The lint stays LIVE
 *  for everything else, and its own test proves a second row carrying the same tail still trips it –
 *  an exemption that disables the guard would be the defect, not the fix. */
const PAUSE_EVENT = 'She is entering nothing more before the birth. What she is already in, she will play.'

/** ⭐⭐ THE WEEK THE ENTRIES CLOSE – the pause's ONLY tick step, and it writes ONE feed row.
 *
 *  ⚠⚠ THE PAUSE ITSELF NEEDS NO TICK STEP AT ALL, which is worth saying first because it is what
 *  makes this function small. `pausesWeek` was written at the announcement and the entry gate reads
 *  it live (`pauseCovering`, `world/medical.ts`), so the calendar shuts on its own date whether or
 *  not anything runs on that date – there is no latch to set, no flag to flip, no state to advance.
 *  What is left is the part a player would otherwise never be told: that this week is the one.
 *
 *  ⚠ AND NOTHING ELSE IS ADDED TO THE WEEK. No latch, no fast-forward machinery, no new kind of week
 *  – the college precedent the brief names: absence weeks TICK, with a thinner surface, and `▶▶`
 *  already exists for a player who wants the months to pass. The parent's week is untouched
 *  underneath – the bills, the court, the diary and the feed all run exactly as they did – and
 *  `advanceWeeks` does not even stop for a deadline any more, because its own stop reads
 *  `entryStatus(...).level !== 'blocked'` and the gate is now shut. That is the whole of «she is off
 *  tour, the household is not», and none of it is code this task wrote.
 *
 *  ⚠ ONCE-NESS IS TWO CLAUSES, AND THE SECOND ONE IS A RECEIPT RATHER THAN A DATE. The equality
 *  carries it in play – weeks tick by one, so `world.week === pausesWeek` comes round exactly once,
 *  and a crafted world that JUMPS the calendar misses the row rather than doubling it, which is the
 *  right failure direction for a line of texture (`landWedding` needs `>=` plus its latch because a
 *  wedding must never be missed – there the latch IS the marriage). The receipt covers the other
 *  direction: this function called twice inside one week writes one row, because the row it already
 *  wrote is on the feed and it looks. ⚠ IT IS A STRUCTURAL LOOK-UP AND NOT A TEXT MATCH – the week
 *  plus the kind, never `PAUSE_EVENT`'s characters, so T8's rewording cannot break the once-ness
 *  (`RELEASE_LINE_PREFIX`'s own lesson from the other side: a rename that breaks a player's report in
 *  silence). ⚠ AND IT COSTS ONE SCAN ON ONE WEEK OF ONE CAREER: the equality short-circuits first, so
 *  every other week of every other career never reaches it.
 *  ⚠ The alternative was `fireMilestone`'s key-idempotency, and the row is deliberately NOT a
 *  milestone: the milestone channel is what the family KEEPS – T4's birth is this arc's – while this
 *  is news about a season.
 *
 *  ⚠ `keep: true`, for the ended row's own reason one section up: `pruneEvents` drops ordinary rows
 *  at sixty weeks, and this arc is longer than that window – 31 weeks to the birth and up to 20 more
 *  to her decision – so an unkept row would be gone from the feed before the story it opens closes.
 *
 *  ⚠⚠ `lifeKind: 'expecting'` IS THE HOUSE LAW AND NOT A GLYPH PICK, and this builder learned it the
 *  way the law is meant to teach it: the row shipped unstamped and `tests/wave4-life-row-stamp.test.ts`
 *  went red – «every `type: 'life'` write site in the engine stamps a `lifeKind` beside it», with two
 *  named exceptions that are named precisely because a kind did not exist for them. One does here:
 *  T2 put `'expecting'` on `LifeBeatKind` and this is the beat's own row. So the stamp is the kind
 *  the row is about; the same pin's second half then requires that kind to be on the feed column's
 *  roster (`LIFE_BEAT_ROW_KINDS`, `components/screens/lifeRowGlyphs.ts`), which it now is.
 *  ⚠ NO GLYPH IS PICKED FOR IT – who-she-is §5a («no agent adds or swaps one unasked»), `'own-key'`'s
 *  own precedent one wave down: the roster says a mark COULD be picked, the owner's record decides
 *  whether one is, and until he rules the row wears the standing white-heart fallback.
 *
 *  ⚠ ZERO DRAWS on any stream – two integers compared and one row appended. It takes no `Rng`, so
 *  MAIN is structurally out of reach and the frozen capture (41550 / e6b0c709) cannot see it.
 *  ⚠ IT READS `world.pregnancy` AND NEVER THE EPISODE – the decoupling law, §14's banner above. */
export function landPregnancyPause(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week !== pregnancy.pausesWeek) return
  // ⭐⭐⭐ v85 T6 – AND THE ONE NUMBER THE FREEZE IS MADE OF, TAKEN ON THE ONE WEEK IT IS TRUE. The
  // ruled protected rank is «her rank at `pausesWeek`» and this line is the only place in the engine
  // that week is standing under a live pregnancy. It is a CAPTURE on `captureEntryRow`'s own law –
  // the WTA ranking window is 52 weeks and the return lands 51 weeks from here, so every result this
  // rank is computed from has aged out of her book by the time `world.comeback` is written.
  //
  // ⚠ ABOVE THE FEED ROW'S ONCE-NESS CHECK, DELIBERATELY, and it is the `EXPECTING_SUPPORT` write's
  // own rule read one file over: a step that must happen may not sit below an early return that is
  // about a SENTENCE. If T8 ever gives this week a second row, or a probe writes the row by hand, the
  // freeze must still be taken. Its own `=== null` guard is what makes it idempotent instead.
  //
  // ⚠ «UNRANKED IS NOT RANK ONE» – `entryVerdict`'s own sentence and the same `kidPoints(...) > 0`
  // guard it uses, because `rankIn` hands back the TABLE SIZE for a girl with no counting W result
  // and freezing that sentinel would hand a comeback a protected place at #564, which is not a place.
  // A career that paused with nothing protected comes back with `protectedRank: null`, which is the
  // state `ComebackState` is nullable-inside for.
  pregnancy.rankAtPause ??= kidPoints(world, 'wta') > 0 ? rankIn(world, 'wta') : null
  if (world.events.some((e) => e.week === world.week && e.type === 'life' && e.lifeKind === 'expecting')) return
  // ⚠ NO AMOUNT – a life row is never a purchase (rule 4 at the top of this file), and the absence of
  // the field is what keeps `accrueFinance` from ever seeing it. There is no price on this week:
  // §2 T4's «NO COST EVENT» read one task early, and the pause charges nothing either.
  addEvent(world, { week: world.week, type: 'life', keep: true, lifeKind: 'expecting', text: PAUSE_EVENT })
}

/** ⚠⚠ **DRAFT – T8's TABLE, NOT SHIPPED COPY** (invariant 4). The birth week's one kept feed row,
 *  written to `landWedding`'s line and to its budget: one quiet sentence about the day, then one
 *  about what the family is now.
 *
 *  ⚠ HUSBAND-AGNOSTIC (§0's decoupling ruling, and here it is load-bearing rather than polite): the
 *  marriage may have ended months ago and the birth fires anyway, so a line that mentioned him would
 *  be false on exactly the careers §14's banner exists to protect. «The family» is the reader's own
 *  household, which is the one thing every arm of this wave has in common.
 *  ⚠ IT MAY SAY «daughter» – the sex is RULED (20.09, «пол нужен … пока будут только девочки») and
 *  written as a literal on the row, so the sentence is stating a fact the save holds rather than
 *  guessing at one.
 *  ⚠ AND IT NAMES NO RETURN AND NO DATE, `PAUSE_EVENT`'s own discipline one function up: this wave
 *  does not know whether she comes back (T5 draws it), so a line that hinted would be a promise T5
 *  is allowed to break.
 *  ⚠ NO FIGURE AND NO PRICE, because there is none – see `landBirth`'s ⚠⚠ NO COST EVENT. */
const BIRTH_EVENT = 'Her daughter was born this week. The family has somebody new in it.'

/** ⭐⭐⭐ THE BIRTH – the week the child arrives, and the ONE writer of `world.children` in the engine.
 *
 *  ⚠⚠ IT IS **NEWS AND NOT A DECISION**, which is the brief's own sentence (§2 T4: «no blocking
 *  beat; the week's weight is carried by the feed, the diary and the shock») and is the shape of
 *  everything below. No `LifeBeatKind` member, no card, no answer, no option table, nothing that
 *  stops the week. The layer's law is §4a – SHE decides, the parent REACTS – and there is nothing
 *  here for a parent to decide: the deciding already happened at the `'expecting'` beat thirty-nine
 *  weeks ago, and what that answer bought is read below as `support`.
 *
 *  ⚠⚠ **NO COST EVENT.** Not a birth fee, not a ledger row, not a cent. The wedding's own ruling is
 *  the precedent and is quoted rather than re-argued – «я думаю как с подарками, никто и нисколько»
 *  (18.09, Q-1) – and wave 7 made the guard the byte-EQUALITY of `fundsCents` across the day rather
 *  than the mere absence of a charge, which is what tests/wave8-birth.test.ts §C asserts (red-first
 *  against a version that charges). The child's STANDING cost line is a real question and it is
 *  W5's, not a fee on this week: §4 of the brief forbids it in this wave by name.
 *
 *  ⭐⭐⭐ **THE DECOUPLING LAW IS TESTED HERE, NOT MERELY HONOURED** (RULED 20.09, «развелись и
 *  развелись, жизнь продолжается»). This function reads `world.pregnancy` and NEVER the episode's
 *  aliveness – there is not one clause below that mentions `latchedEpisode`, `endedWeek` or
 *  `episodeId`, and adding one would delete a child the week a marriage ended, which is the one
 *  reading of that ruling that is wrong. §14's banner is where the law is written out; §F of the
 *  suite walks a career through a mid-term ending to the birth and asserts the SAME birth, and it
 *  passes with zero special-case code because there is no special case to write.
 *
 *  ⚠ FIVE WRITES AND THE MIDDLE THREE ARE `landWedding`'s, LINE FOR LINE (`markSchoolEnd`'s
 *  two-surface idiom two waves down): the row on `world.children`, ONE kept feed line through
 *  `fireMilestone`, ONE album entry through `captureMilestone`, the shock, and then deliberately
 *  NOTHING on `world.pregnancy` – see the ⚠⚠ at the tail for why that absence is the decision rather
 *  than an omission.
 *
 *  ⚠ `>=` AND A RECEIPT, WHICH IS `landWedding`'s ARRANGEMENT AND NOT `landPregnancyPause`'s. The
 *  pause's row is TEXTURE and uses `===`, because a crafted world that JUMPS the calendar should
 *  miss a line rather than double it. A birth is the opposite: missing it would leave a career with
 *  a pregnancy that never resolves and an entry gate that never re-opens (`pauseCovering` has no
 *  upper bound of its own – T3's own finding), so the day must never be missed and the guard against
 *  a second one is a receipt.
 *  ⚠⚠ AND THE RECEIPT IS THE PUSH ITSELF, READ BACK – there is no second one and there must not be.
 *  `world.children` is already the once-ness of this wave: T2½ piece 3 put
 *  `if (world.children.length > 0) return false` into `pregnancyEligible` as the SCOPE BRAKE that
 *  makes §4's «no repeat pregnancy enabled» true, so the line below has a consequence one function
 *  over – the moment it runs, no further pregnancy can start in this career until W5 lifts that
 *  clause. Two receipts for one fact would have to be deleted together, and one of them would be
 *  missed.
 *  ⚠ `bornWeek >= dueWeek` IS EXACT AND IS **W5-SAFE**, which is why it is not `children.length > 0`:
 *  every child of an EARLIER pregnancy was born before this record was even written (its
 *  `announcedWeek` is later than that birth), so the only row this can match is this pregnancy's own.
 *  A count would have refused the second child the day W5 opens the gate.
 *
 *  ⭐⭐ `sex: 'girl'` IS A **LITERAL AND NO STREAM IS DRAWN FOR IT** – RULED 20.09, his words: «пол
 *  нужен, но мальчиков у нас пока нет, можно сделать заготовку, но пока будут только девочки». A
 *  draw whose outcome is fixed is not a draw, it is a draw-and-discard, which invariant 2 forbids by
 *  name. `seed:life:birth:<episodeId>` is RESERVED IN WRITING for the day boys exist (`ChildRecord`'s
 *  own note in `world/state.ts`) and is deliberately NOT created here – §5's reservation rule, and
 *  the reason the key is scoped to the episode rather than to the week is that persisted rows must
 *  keep old careers' daughters stable when it comes.
 *
 *  ⚠ THE FEED ROW IS A `'milestone'` AND NOT A `'life'` ROW, so `wave4-life-row-stamp`'s house law –
 *  «every `type: 'life'` write site in the engine stamps a `lifeKind`» – does not reach it. CHECKED
 *  AND NOT ASSUMED: `fireMilestone` writes `type: 'milestone'` (`world/milestones.ts`), which is the
 *  channel for what the family KEEPS and is exactly the distinction T3 drew when it made the pause's
 *  row an ordinary life row instead («this is news about a season; T4's birth is this arc's
 *  milestone»). No `LIFE_BEAT_ROW_KINDS` entry is owed and no glyph is picked.
 *
 *  ⚠ ZERO DRAWS ON ANY STREAM – two integers compared, one array scan, and four writes. It takes no
 *  `Rng`, so MAIN is structurally out of reach and the frozen capture (41550 / e6b0c709) cannot see
 *  it; and a career that never conceived returns on `world.pregnancy === null`, which is every week
 *  of every frozen career (156 weeks, age 16.6 – no latch, so no pregnancy, so no birth).
 *
 *  ⚠⚠ AND WHAT IT DOES **NOT** DO TO `world.pregnancy` IS A DECISION WITH A REASON, not an omission.
 *  The record survives the birth WHOLE, and nothing here writes or clears one field of it:
 *    · T5 reads `support` out of it (her decision), so it has to outlive the day by construction.
 *      ⚠ T4 WROTE «and T6 reads `returnPlan` INTO it», T5 FALSIFIED THAT HALF AND T6 SETTLED IT, which
 *      is corrected here rather than left: `resolveReturnDecision` clears the record on BOTH arms, so
 *      by the week the `'return-plan'` beat is answered there is no `PregnancyState` left to write a
 *      plan onto. The architect's RULING A (20.09) moved the field to `world.comeback`, the seat that
 *      outlives the pregnancy – so what T4 predicted is true of a different record;
 *      ⚠ AND T6 ADDED ONE THAT **IS** READ OFF THIS RECORD AFTER THE BIRTH: `rankAtPause`, the capture
 *      the ruled freeze is made of, taken at `pausesWeek` and read at the return. The sentence below
 *      («every field on it is still TRUE afterwards») covers it – it is the standing she paused on,
 *      and that does not stop being true because the child arrived;
 *    · every field on it is still TRUE afterwards – `pausesWeek` is the week entries closed,
 *      `dueWeek` is the week the child came, `support` is the answer that was given, `episodeId` is
 *      still whose;
 *    · and the pause is the one that matters: `pauseCovering` (`world/medical.ts`) shuts the calendar
 *      for every `week >= pausesWeek` while the record stands, and T3 wrote down that this window has
 *      NO UPPER BOUND OF ITS OWN – «the RECORD'S OWN LIFETIME is the window». Clearing it here would
 *      re-open the entry gate the week after a birth, on a career that has not yet decided whether it
 *      is coming back, which is the one thing the brief's two outcomes both say is false. THE BIRTH
 *      IS NOT THE BOUND. ⚠ THE BOUND IS `resolveReturnDecision` (`world/endings.ts`, T5) and it is
 *      TOTAL over its own two exits, so the window this function deliberately leaves open really does
 *      shut twenty weeks later on every path.
 *  ⚠ THE ONE COST OF THAT, REPORTED RATHER THAN PAPERED OVER: the refusal sentence the gate prints is
 *  `PREGNANCY_PAUSE_DETAIL` – «She is expecting …» – and from this week on she is not. It stands for
 *  up to `decisionWeeksAfterBirth` weeks, which is real and is a WORDING question (invariant 4): the
 *  sentence is the owner's and lands in T8's table. A note sits at that constant too. */
export function landBirth(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null || world.week < pregnancy.dueWeek) return
  if (world.children.some((child) => child.bornWeek >= pregnancy.dueWeek)) return
  world.children.push({ bornWeek: world.week, sex: 'girl' })
  // ⚠ DRAFT – the kept line is the builder's draft (invariant 4), `landWedding`'s own marking.
  // ⚠ THE KEY IS THE WEEK, `milestoneKey`'s own identity for this type and for its reason: a birth is
  // once per PREGNANCY, not once per marriage, so an episode-keyed receipt would swallow W5's second
  // child of the same marriage.
  fireMilestone(world, `birth:${world.week}`, BIRTH_EVENT)
  captureMilestone(world, { type: 'birth', week: world.week })
  // ⭐⭐⭐ AND THE MARK THE MONTHS AFTER LEAVE ON HER – the SECOND writer of `world.spiritShock` in the
  // engine (`rollEnds` is the first, `engine/spirit.ts`'s own banner carries the corrected sentence).
  // A fact, never a number: what it costs is `ECONOMY.spirit.shock.postpartum`, scaled by the parent's
  // persisted `support` grade, and `accrueSpirit` – SIX calls later in this same tick, counted rather
  // than guessed – is the one place that reads either.
  //
  // ⚠⚠ IT IS **ONE SLOT AND THIS WRITE OVERWRITES**, DELIBERATELY AND WITH THE PRICE NAMED. A
  // mid-term ending stamps `'breakup'` (§8) and that mark may still be recovering on this week; the
  // assignment below replaces it, week and kind together, because the later and larger window is the
  // one she is living. What is LOST is the break-up's remaining recovery and its `weeks` counter –
  // the psychologist's receipt for that shock can no longer be earned – and that is the honest
  // reading of one meter: a girl does not carry two separate recoveries at two rates, she carries
  // where she is. ⚠ PINNED IN §D OF THE SUITE RATHER THAN LEFT TO FIELD ORDER, because a conditional
  // write (`??=`, or a «keep the bigger one» test) is the shape a later reader would add believing it
  // was a fix.
  world.spiritShock = { week: world.week, kind: 'postpartum' }
}

/** ⭐⭐⭐ THE WEEK SHE SAYS – the ONE week of the decision window that carries the draw, derived off
 *  the record in ONE place so the gate and the RNG key cannot ever name two different weeks
 *  (`activeEpisode`'s own law: two spellings of one fact are a defect waiting for a week to
 *  disagree). Pure, zero draws, no writes. `resolveReturnDecision` (`world/endings.ts`) is the reader.
 *
 *  ⚠⚠ **ONE DRAW, AND IT IS THE END OF THE WINDOW RATHER THAN ITS START** – the brief's sentence is
 *  «ONE draw on `seed:life:return:<week>`», and a hazard rolled once a week for twenty weeks is a
 *  different model wearing the same constant: it would turn a drafted 65% into 1 − 0.35^20, which is
 *  certainty, and T9 would be benching a number nobody wrote. So the window is a DATE and not a
 *  span of chances. Which end it is has three reasons, and the first is mechanical:
 *
 *  1. ⭐⭐ HER `spirit` HAS FINISHED MOVING BY THEN, AND AT THE BIRTH IT HAS NOT EVEN STARTED.
 *     `landBirth` stamps the postpartum mark on the due week and `accrueSpirit` prices it in that
 *     same tick; T4 MEASURED the mark clearing in 3 / 4 / 5 weeks steady and 8 / 11 / 13 intense by
 *     grade. Every one of those is inside 20, so at the decision week the `spirit` term reads her
 *     RECOVERED spirit – which is what «weighted by spirit» is supposed to mean – while a draw on the
 *     due week would read the number the shock is about to take away and would double-count support,
 *     which already has its own term.
 *  2. THE WINDOW WOULD OTHERWISE PRICE NOTHING. `decisionWeeksAfterBirth` is a real constant T9
 *     benches; drawn at the start it would be a 20-week delay on an answer already known, and the
 *     entry gate would re-open (or the career end) on the very week the child arrived.
 *  3. IT IS THE HONEST SHAPE OF THE THING. The months after a birth are when this is decided, not the
 *     day of it – and `PREGNANCY_PAUSE_DETAIL`'s own stale-word note (`world/medical.ts`) is the
 *     measure of how long that is: 51 weeks with no new entry, `termWeeks` + this.
 *
 *  ⚠ IT IS DERIVED AND NOT PERSISTED, WHICH IS THE ONE PLACE THIS WAVE'S RECORDS PART FROM
 *  `dueWeek`'s LAW, and the reason is named rather than hidden: v85 took its last KEY at T2½ («This is
 *  the LAST key v85 takes»), so a `decidesWeek` field would be a schema move that §2 T5 is not.
 *  ⚠ T5 WROTE «`PregnancyState` gained its last field at T1» AND T6 FALSIFIED THAT HALF – corrected
 *  here rather than left standing: T6 moved `returnPlan` OFF this record (the architect's ruling A)
 *  and added `rankAtPause` TO it, because the ruled freeze is «her rank at `pausesWeek`» and the
 *  ranking window has deleted the evidence for it by the return. The sentence that still holds is the
 *  one about KEYS, and it is the one this paragraph needs. The consequence is real and small – a retune of
 *  `decisionWeeksAfterBirth` moves the decision date of a pregnancy a live career is already carrying
 *  – and it is bounded by the fact that no save in the world holds a v85 pregnancy at all. If the
 *  constant is still moving when one does, the honest fix is the field and its migration. */
export function decisionWeekOf(pregnancy: PregnancyState): number {
  return pregnancy.dueWeek + ECONOMY.motherhood.decisionWeeksAfterBirth
}

/** ⭐⭐⭐ WAVE 8b T2 (C6) – **WHERE IN THE MOTHERHOOD ARC THIS WEEK FALLS**, for the diary band. The
 *  wave-8 hand-back listed the diary half of T3's texture as one of two things the brief asked for
 *  and did not ship; his 21.09 word is what makes it this batch's, and this is the whole of the
 *  plumbing it needed.
 *
 *  ⚠⚠ **PURE READ, ZERO DRAWS, AND IT PERSISTS NOTHING.** Three fields the world has carried since
 *  v85 – `pregnancy`, `children`, `comeback` – answer every band, so C6 costs NO schema move. That
 *  was the open question the hand-back left («a diary band needs a new `DiaryFacts` field and claims
 *  plumbing»): the FACT is new, the STATE is not.
 *
 *  ⚠ THE ORDER OF THE TESTS IS THE ARC'S OWN and the two early returns are why it reads oddly: the
 *  record OUTLIVES the birth by up to `decisionWeeksAfterBirth` weeks (`landBirth` deliberately
 *  clears nothing – `pauseCovering`'s window has no upper bound of its own), so «is there a
 *  pregnancy» is NOT «is she carrying». The roster is what tells the two apart, on `landBirth`'s own
 *  once-ness test.
 *
 *  ⚠ `last` IS **THE PORTRAIT'S OWN WINDOW** (`PREGNANT_LAST_WEEKS`, `shared/avatarEmotion.ts`) and
 *  not a second boundary drafted here. The picture and the words change on the same week, which is
 *  the property the whole diary system is built to keep; a band with its own late-stretch constant
 *  would be two dates for one moment.
 *
 *  ⚠ THE `early`/`mid` SEAM IS THE MIDPOINT OF WHAT IS LEFT, derived rather than drafted: the pause
 *  runs `pausesWeek`..`dueWeek`, `last` takes the final `PREGNANT_LAST_WEEKS` of it, and the two
 *  halves of the remainder are `early` and `mid`. At the shipped constants that is 19 weeks split
 *  10 / 9. ⭐ NO NEW CONSTANT ENTERS THE GAME FOR IT – a retune of `termWeeks` or of the portrait's
 *  window moves this seam with them, which is the behaviour a second number could not have.
 *
 *  ⚠ `returned` IS THE **FIRST RUNG** OF THE COMEBACK RAMP and stops there. `world.comeback` never
 *  clears, so a band hung on «is there a comeback» would say «the bag is packed again» for the rest
 *  of her career; the staircase's second rung is where the ramp's own first step ends, and reading
 *  it here means the band cannot drift from the table it is about. */
export function motherhoodBandAt(world: WorldState): MotherhoodBand | null {
  const week = world.week
  const pregnancy = world.pregnancy
  if (pregnancy !== null) {
    // ⚠ THE ROSTER AND NOT THE CALENDAR – `landBirth`'s own once-ness test verbatim, so a second
    // pregnancy standing beside an older sibling's row (W5) reads this correctly without an edit.
    const born = world.children.filter((child) => child.bornWeek >= pregnancy.dueWeek)
    if (born.length > 0) return born.some((child) => child.bornWeek === week) ? 'birth' : 'postpartum'
    // ⭐⭐⭐ v87 T2 – **THE HIDDEN WINDOW IS SILENT, AND IT IS SAID OUT LOUD RATHER THAN LEFT TO THE
    // CLAUSE BELOW.** Between the conception and the announcement the parent has not been told, so
    // there is nothing for his diary to be about: a band here would be the game telling him a thing
    // she has not said. The `week < pausesWeek` clause two lines down already returned `null` for
    // these weeks by arithmetic – this states it as the law it is (the design's §3, «no mechanic
    // prices those weeks»), so a later edit to the pause clause cannot silently open the window.
    if (week < pregnancy.announcedWeek) return null
    if (week === pregnancy.announcedWeek) return 'announced'
    // The eight weeks she plays on carry no band: they look like any other week, and a band that
    // spoke about them would be saying something the player cannot yet see.
    if (week < pregnancy.pausesWeek) return null
    const lastOpens = pregnancy.dueWeek - PREGNANT_LAST_WEEKS
    if (week >= lastOpens) return 'last'
    return week < pregnancy.pausesWeek + Math.ceil((lastOpens - pregnancy.pausesWeek) / 2) ? 'early' : 'mid'
  }
  const comeback = world.comeback
  if (comeback === null) return null
  const back = week - comeback.returnedWeek
  // ⚠ A WEEK **BEFORE** THE RETURN TAKES NO BAND, which is `comebackMatchFactor`'s own discipline one
  // module over («a week before the return takes no rung and comes back 1.0»). It is unreachable
  // through the app – `world.comeback` is written AT the return, so the engine never asks about an
  // earlier week – and it is answered anyway, because a total function cannot be made wrong by a
  // future caller (`portraitStage`'s own rule). Without it a negative `back` is also «less than the
  // first rung» and the band would say «the bag is packed again» about a week she was still carrying.
  if (back < 0) return null
  const stages = ECONOMY.motherhood.comebackStages
  return back < stages[1].fromWeeksBack ? 'returned' : null
}

/** ⭐⭐⭐ HER CHANCE OF **TRYING** – pure over the four inputs the brief names, in its own order of
 *  size: `support` (the biggest, the digest's own claim), then `spirit`, `bond` and age. Zero draws,
 *  no writes, no world – `arrivalHazardFor`'s and `endsHazardFor`'s own shape (§5), which is what
 *  lets every grade be pinned without building a career.
 *
 *  ⚠⚠ IT ANSWERS «DOES SHE TRY» AND NOTHING ELSE, AND THAT FENCE IS THE POINT OF THE WHOLE MODEL.
 *  The research's «~40%» is «of mothers, return SUCCESSFULLY» and the brief splits it: this factor is
 *  DRAWN, and whether the comeback works is EMERGENT from T6's pricing and is MEASURED, never drawn.
 *  0.65 × ~0.6 ≈ 0.4 is the sanity line T9 checks as a PRODUCT, so that neither factor has to be
 *  forced to a target. ⚠ NOTHING HERE MAY EVER BECOME A SUCCESS RATE – see `returnBase`'s own note in
 *  `ECONOMY.motherhood`, where every size below is drafted with its arithmetic.
 *
 *  ⚠ SHE DECIDES AND NOBODY IS ASKED (§4a, at the layer's second-biggest moment). There is no parent
 *  input in this signature and there is no menu anywhere that opens it – exactly as the announcement
 *  was. What the parent did is in here ONCE, as the `support` grade he bought eleven months ago with
 *  an answer he has already given, and as the `bond` that answer moved.
 *
 *  ⚠ A `null` GRADE READS THE `measured` CELL – `postpartumSupportScale`'s `??` courtesy, for its
 *  reason: the `'expecting'` beat blocks the week, so no career can tick the 51 weeks from the
 *  announcement to here without answering it, and the null belongs to a hand-built probe world.
 *
 *  ⚠ THE AGE TERM IS ONE-SIDED AND THE YEARS ARE WHOLE – `Math.floor` on the excess, so a birthday
 *  and not a fortnight is what moves it, which is `kidAgeYears`' own grain everywhere else this layer
 *  reads an age into a decision. */
export function returnChanceFor(
  support: PregnancyState['support'],
  spirit: number,
  bond: number,
  ageYears: number,
): number {
  const m = ECONOMY.motherhood
  const yearsOver = Math.max(0, Math.floor(ageYears - m.returnAgePivotYears))
  const chance =
    m.returnBase +
    m.returnSupportShift[support ?? 'measured'] +
    (spirit - ECONOMY.spirit.baseline) * m.returnSpiritPerPoint +
    (bond - ECONOMY.bond.start) * m.returnBondPerPoint -
    yearsOver * m.returnAgePerYearOver
  return Math.min(m.returnChanceMax, Math.max(m.returnChanceMin, chance))
}

/** ⭐⭐⭐ v85 T6 – **WHAT THE RETURN LEAVES BEHIND**: the pregnancy's last two facts turned into the
 *  record that outlives it. Pure, zero draws, no writes and no world – `returnChanceFor`'s own shape
 *  one function up, and for its reason: every cell of the freeze can then be pinned without building
 *  a career. `resolveReturnDecision` (`world/endings.ts`) is the ONE caller and it calls this on the
 *  line ABOVE the clear, which is the seam T5 marked and left.
 *
 *  ⚠⚠ IT IS WRITTEN **BEFORE** `world.pregnancy` GOES NULL AND THAT ORDER IS THE WHOLE FUNCTION.
 *  `rankAtPause` is on the record and `resolveReturnDecision` clears the record on both arms (T5's
 *  totality obligation – it must, or a career that comes back has its entries shut for ever), so a
 *  freeze read after the clear is a freeze read off nothing. This is `endingForFamily`'s own
 *  arrangement six lines down in that file, for the same reason stated there: «read off the local
 *  binding, so the clear one line below cannot take the number out from under it».
 *
 *  ⭐ **THE THREE NUMBERS ARE RULED AND NONE OF THEM IS THIS BUILDER'S** (20.09, «наверное да, у нас
 *  тоже были исследования»): her rank at `pausesWeek`, 12 entries, 156 weeks. The rank arrives on the
 *  record (captured at the pause – `landPregnancyPause` above, and the field's note in
 *  `world/state.ts` for why it could not be derived here); the other two are
 *  `ECONOMY.motherhood.protectedRankEntries` / `protectedRankWeeks`, where the digest row they come
 *  from is quoted.
 *
 *  ⚠ `validUntilWeek` IS ANCHORED ON THE **RETURN**, and the alternative is named rather than hidden.
 *  156 weeks from `returnedWeek` makes the entitlement «three years of comeback», which is the span
 *  the digest describes being USED («used by 50+ players»), keeps both halves of `world.comeback` on
 *  ONE clock – the staged factor is a function of `returnedWeek` and nothing else – and is the only
 *  anchor under which the ruled 12 entries and the ruled 156 weeks are both about the same period.
 *  Anchored at `pausesWeek` it would be 105 usable weeks and the two ruled numbers would be about two
 *  different spans. Carried to the owner as a reading of his ruling rather than settled by a build.
 *
 *  ⚠ A `null` RANK MAKES A `null` FREEZE AND STILL MAKES A COMEBACK – `ComebackState`'s own shape
 *  argument (T2½): «a comeback is a FACT and a freeze is an ENTITLEMENT», and collapsing the two would
 *  make «she returned» unrepresentable for exactly the players who most need the game to say it. */
export function comebackAtReturn(pregnancy: PregnancyState, week: number): ComebackState {
  const m = ECONOMY.motherhood
  return {
    returnedWeek: week,
    protectedRank:
      pregnancy.rankAtPause === null
        ? null
        : {
            rank: pregnancy.rankAtPause,
            entriesLeft: m.protectedRankEntries,
            validUntilWeek: week + m.protectedRankWeeks,
          },
    // ⚠ NULL, AND THE BEAT RAISED ON THIS SAME WEEK IS WHAT FILLS IT (ruling A, 20.09 – the field
    // moved here off `PregnancyState`, which the clear one line below destroys). `support`'s own
    // argument: the beat BLOCKS, so «she is back and nobody has said how» is the true reading of the
    // gap, and every available default would be a plan nobody chose.
    returnPlan: null,
  }
}

// =================================================================================================
// 15. THE WEIGHT – ⚠⚠ THE SWITCH, THE HIDDEN WINDOW, AND THE TWO GRIEFS (wave 11)
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` is the canon, `docs/plans/life-wave-11-builder-2026-09.md` the
// step-by-step, and `docs/design/the-months-before-she-says-2026-09.md` the design underneath. It is
// §15 for §14's own stated reason: appended rather than renumbered.
//
// ⚠⚠ THE ONE THING THIS SECTION MUST NEVER MODEL IS THE PARENT AS THE CAUSE, and it is a FINDING
// rather than a scruple (the design's §2, the research's §6.3): nothing in the evidence supports
// training as a cause of a pregnancy loss, and a game that priced one would be telling every player
// the sentence women already hear too often. So the boundary below is written into the SIGNATURES –
// both hazards take their arguments and read nothing else – and both are pinned by a sweep rather
// than by a comment.

/** ⭐⭐⭐ v87 – THE SWITCH, BOTH WAYS, AND ITS ONE WRITER OUTSIDE `createWorld` (RULED 22.09: «only
 *  for the weight, set at new-career creation (the creation flow ASKS), changeable both ways in
 *  settings later»). `setCoachOnEventWeeks`'s shape (`world/coachMarket.ts`) and nothing more.
 *
 *  ⚠⚠ RE-AIMED 26.09 (B-P3-01) – THE SHAPE CLAIM WAS FALSE AND IS NOW TRUE. The sentence above named
 *  `setCoachOnEventWeeks` as the model, and that command OPENS with `guardNotEnded`; this one did not,
 *  so a tab left open behind the epilogue could flip the weight for a girl who has retired – and
 *  «changeable both ways in settings later» is a rule about a LIVE career, which is the reading the
 *  missing guard quietly widened. The guard is the existing one and its sentence is the existing one:
 *  invariant 4 is untouched, no copy was written for this. `tests/principles-unknown-answers.test.ts`
 *  holds both halves – refused behind a latch, still writable both ways on a live career.
 *
 *  ⚠⚠ IT WRITES ONE FIELD AND DELETES NOTHING, WHICH IS THE **OTHER HALF OF THE RULING** and the
 *  half a future reader is most likely to get wrong: «turning it off stops NEW weight events and
 *  never deletes lived state». `pregnancyLossWeeks`, `bereavementWeeks`, the album, the diary and a
 *  live `spiritShock` all stand – a career that lived a loss has lived it, and a switch that tidied
 *  its own history away would be rewriting a life rather than stopping one. The test that toggles
 *  mid-career asserts BOTH halves, because only one of them is visible in this function.
 *
 *  ⚠ AND THERE IS NO «EFFECTIVE FROM NEXT WEEK» ANYWHERE. The flag is read at the top of each
 *  hazard, on the week the hazard runs, so the command's own snapshot is already the answer – which
 *  is what «changeable both ways, effective immediately» means when it is built rather than claimed.
 *
 *  ⚠ ZERO DRAWS: one assignment. It takes no `Rng`, so MAIN is structurally out of reach and the
 *  frozen capture (41550 / e6b0c709) cannot see it. */
export function setWeightEnabled(world: WorldState, on: boolean): void {
  // ⚠ W2-ENDINGS (added 26.09, B-P3-01): the career must still have a next week. The engine
  // re-validates every command because the worker is not the gate – `setCoachOnEventWeeks`' own line,
  // which is what the doc above has always claimed this function's shape to be.
  guardNotEnded(world)
  world.weightEnabled = on
}

/** ⭐⭐⭐ v87 (the weight, wave 11 T4) – **HER WEEKLY CHANCE OF LOSING IT, GIVEN HER AGE AND NOTHING
 *  ELSE.** Pure, zero draws, no writes, and **it takes no `WorldState` at all** – which is the
 *  boundary law written into the signature rather than into a comment.
 *
 *  ⚠⚠ THE READ-SET IS THE WHOLE POINT OF THIS FUNCTION'S SHAPE. The design's §2 and the research's
 *  §6.3: nothing in the evidence supports training as a cause of loss, the concern in the sources is
 *  contact and falls, and age dominates the variance. So a game that let the training plan, the
 *  travel, the answers, `spirit` or `bond` reach this number would be asserting something untrue –
 *  and it would be telling every player the sentence women already hear too often, *you did this by
 *  not resting*. A function that cannot SEE the world cannot read it, and a later refactor that
 *  wanted to would have to widen this signature in front of a reviewer. `tests/wave11-loss.test.ts`
 *  §B sweeps plan, travel, spirit, bond and support across arms on shared seeds and asserts the
 *  realised hazard is identical, so the pin holds the property even if somebody re-plumbs the call.
 *
 *  ⚠ THE LAST RUNG WHOSE `fromAge` SHE HAS REACHED WINS, and an age under the first rung takes 0 –
 *  `pregnancyChanceAt`'s own law, read the same way so the two curves cannot be consumed differently.
 *  A 0 here takes ZERO DRAWS exactly as an ineligible week does, because `rollPregnancyLoss` returns
 *  on the chance before it derives the stream. */
export function pregnancyLossChanceAt(ageYears: number): number {
  let perWeek = 0
  for (const rung of ECONOMY.weight.lossPerWeekByAge) if (ageYears >= rung.fromAge) perWeek = rung.perWeek
  return perWeek
}

/** ⭐⭐⭐ v87 T4 – **IS THIS A WEEK THE LOSS HAZARD RUNS AT ALL.** Pure, zero draws, no writes, and a
 *  `false` here means ZERO DRAWS rather than a discarded one – `pregnancyEligible`'s own law, and
 *  the reason this is a predicate of its own: a reader must see, in ONE place, that the whole of
 *  eligibility is decided before any stream exists.
 *
 *  1. ⭐⭐⭐ **THE SWITCH.** `world.weightEnabled`, RULED 22.09. Off means no draw at all – not a draw
 *     whose outcome is discarded, which is invariant 2's named offence – so a career with the weight
 *     off taps the same sub-streams in the same order the same number of times as a pre-wave career.
 *     §8 row 6 measures it.
 *  2. A PREGNANCY IS LIVE. `world.pregnancy !== null`, and nothing else about it is read.
 *  3. ⚠⚠ **THE WEEK IS INSIDE THE RESEARCH'S OWN WINDOW** – `[conceivedWeek + lossFromWeek,
 *     conceivedWeek + lossUntilWeek)`. The constant's block carries the derivation; the short of it
 *     is that the 9.8/10.8/16.7% figures count recognised pregnancies between 6 and 20 GESTATIONAL
 *     weeks, which is conception weeks 4 to 18, and spreading them over the whole 39-week term would
 *     ship a different and much heavier event.
 *
 *  ⚠ AND NOTHING ABOUT HER PLAN, HER TRAVEL, HER SPIRIT, HER BOND OR HIS ANSWER IS IN HERE, which is
 *  worth saying because every one of them was available. That is the boundary law, and this gate is
 *  the other half of the fence `pregnancyLossChanceAt`'s signature builds. */
export function pregnancyLossEligible(world: WorldState): boolean {
  if (!world.weightEnabled) return false
  const pregnancy = world.pregnancy
  if (pregnancy === null) return false
  const since = world.week - pregnancy.conceivedWeek
  return since >= ECONOMY.weight.lossFromWeek && since < ECONOMY.weight.lossUntilWeek
}

/** ⭐⭐⭐ v87 T4 – **THE WEEKLY ROLL, AND THE ONE PLACE A PREGNANCY ENDS WITHOUT A BIRTH.**
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, `rollPregnancy`'s own four steps inherited whole: the gate returns
 *  first, the CHANCE is computed second and returns if it is 0, and only then is the stream derived.
 *  A week with the switch off, a week with no pregnancy, a week outside the research's window and a
 *  week whose age curve reads 0 all take ZERO draws – never draw-and-discard.
 *
 *  ⚠ THE KEY IS THE PREGNANCY'S OWN IDENTITY PLUS THE WEEK – `seed:life:pregnancy-loss:<conceivedWeek>:<week>`.
 *  The conception week is what makes it the PREGNANCY's stream (the spec's «a purpose key derived
 *  from the pregnancy's own identity»), and the week is what makes it one uniform per week rather
 *  than one per pregnancy. ⚠⚠ IT IS DELIBERATELY NOT `seed:life:loss:<week>`, which is the
 *  BEREAVEMENT's key, named in writing on 11.09 and created by T5: two different facts may never
 *  share a key, and these two are in the same section of the same file.
 *
 *  ⚠ `<` AND NOT `<=`, `rollPregnancy`'s own note: `rngFromSeed` can return exactly 0, and a hazard
 *  of 0 must be impossible rather than merely unlikely.
 *
 *  WHAT A LOSS DOES, and the list is the spec's §3 in order:
 *    · the record CLEARS – no birth, no comeback machinery, no `children.push`;
 *    · the week joins `pregnancyLossWeeks`, because the thing that ends cannot be the thing that
 *      remembers, and the cooldown below reads that list;
 *    · `spiritShock` lands as `'loss'` – the depth is `ECONOMY.spirit.shock.loss`, and there is no
 *      second recovery rate anywhere behind it (§5's one-rate law);
 *    · the words, if she is OPEN. A private girl says nothing at all, and the absence is the telling.
 *
 *  ⚠⚠ IT WRITES THE SHOCK AND `accrueSpirit` PRICES IT THE SAME WEEK, which is why the call site is
 *  inside the 1c block and above `accrueSpirit` – `landBirth`'s own arrangement, for the same
 *  mechanical reason: the pass that pays for a shock reads `shock.week === world.week`. */
export function rollPregnancyLoss(world: WorldState): void {
  if (!pregnancyLossEligible(world)) return
  const chance = pregnancyLossChanceAt(kidAgeNow(world))
  if (chance === 0) return
  const pregnancy = world.pregnancy!
  if (rngFromSeed(`${world.seed}:life:pregnancy-loss:${pregnancy.conceivedWeek}:${world.week}`)() >= chance) return
  const told = world.week >= pregnancy.announcedWeek
  world.pregnancy = null
  world.pregnancyLossWeeks.push(world.week)
  // ⚠ THE MARK IS WRITTEN AFTER THE RECORD IS CLEARED AND THE ORDER IS FREE: nothing between these
  // lines reads either. Written this way round so the clear reads as the event and the rest as its
  // consequences.
  world.spiritShock = { week: world.week, kind: 'loss' }
  const line = lossLineFor(world, told)
  if (line === null) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    lifeKind: 'expecting',
    // ⚠ NO AMOUNT AND NO PRICE IN THE WORDS (§3j's rule 4). ⚠ `keep: true` for the pause row's own
    // reason: `pruneEvents` drops ordinary rows at sixty weeks and this arc is longer than that.
    text: line,
  })
}

/** ⭐⭐⭐ v87 T4 – **WHAT SHE SAYS, OR THE SILENCE THAT IS THE TELLING.** ⚠ ⚠ DRAFT – every word is
 *  the builder's draft for the owner (invariant 4), listed verbatim in the wave's report.
 *
 *  ⚠⚠ `null` IS A FIRST-CLASS ANSWER AND IS THE DESIGN'S STRONGEST SCENE, not a gap in the pool.
 *  RULED 22.09 (question 2): «both branches build – open tells, private is silence», and the
 *  design's §4 table is where the two branches come from: `sunny` «tells him, and wants him there»,
 *  `fiery` «tells him fast and loud, then does not want to discuss it», `quiet` «he may learn from
 *  the absence of entries, not from her», `deep` «⚠ the one who may not tell him at all». So a
 *  private girl's loss writes NO ROW: the diary band goes quiet, the portrait stops being pregnant,
 *  the entries re-open, and the parent works it out. «The parent learns from a silence, which is a
 *  thing this game can do and almost no other kind of game can» – the design's own sentence.
 *
 *  ⚠ TWO CELLS PER OPEN VOICE, AND THE SECOND IS WHAT THE HIDDEN WINDOW MADE REACHABLE. A loss can
 *  land before she has ever announced it (the research's window opens at conception week 4 and a
 *  private window runs to 12), so there is a real case where the parent is told about a pregnancy
 *  and its end in one sentence. A single cell would have had to presume he already knew, and would
 *  have been false on exactly the careers the window exists to create.
 *
 *  ⚠ NO NAME AND NO GENDER FOR THE ONE SHE MARRIED (§3g/§3h), NO SEX FOR THE CHILD (§3j's law – the
 *  row was never written), NO DATE AND NO NUMBER (rule 4), and no line states her interior as fact
 *  (the fallible-parent law). What each line says is what the PARENT was told and what he could see.
 *
 *  ⚠ AND NO LINE LINKS IT TO ANYTHING HE SAID. RULED 22.09 (question 5): if the loss follows a cold
 *  «too early», the game does NOT link them – the boundary law holds mechanically and the player
 *  draws his own line. A sentence here that so much as gestured at the answer he gave would be the
 *  game settling it for him. */
function lossLineFor(world: WorldState, told: boolean): string | null {
  const voice = temperamentFor(world.seed, world.dynasty?.motherTemperament)
  const cell = LOSS_HER_LINE[voice]
  if (cell === null) return null
  return told ? cell.told : cell.untold
}

/** ⚠ ⚠ DRAFT – see `lossLineFor`. `null` is the private branch and is the design's ruling, not an
 *  unwritten cell. */
const LOSS_HER_LINE: Record<Temperament, { told: string; untold: string } | null> = {
  sunny:
    {
      told: 'She rang the same evening and did not soften it. "We lost it. I did not want you to hear it from anyone else, and I would like you here."',
      untold:
        'She rang the same evening and said two things in one breath. "There was a child coming and there is not any more. I had not told you yet. I would like you here."',
    },
  fiery:
    {
      told: 'She called once, said it flat out, and was off the phone inside a minute. "We lost it. I am not talking about it. I will ring you when I am ready to."',
      untold:
        'She called once, said it flat out, and was off the phone inside a minute. "I was pregnant. I am not any more. I am not talking about it. I will ring you when I am ready to."',
    },
  // ⚠⚠ THE SILENCE, AND IT IS RULED RATHER THAN UNWRITTEN. `quiet` and `deep` tell nobody: the arc
  // simply stops, and what the parent has to read is the absence. See `lossLineFor`'s block.
  quiet: null,
  deep: null,
}

// =================================================================================================
// 16. A DEATH IN THE FAMILY – ⚠⚠ THE WORLD'S DICE, NEVER HER PERSONALITY'S (the weight, wave 11: T5)
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §4, his 23.08 «вплести похороны» and the numbers he drafted on
// 11.09, RULED as drafted constants on 22.09 (question 3). It is §16 for §14's and §15's own stated
// reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S SECOND STREAM, RESERVED IN WRITING ON 11.09 AND CREATED HERE:
//
//     seed:life:loss:<week>                 does somebody die, this week
//
// ⚠ IT IS THE KEY HE NAMED THAT DAY and it is deliberately NOT the pregnancy loss's
// `seed:life:pregnancy-loss:<conceivedWeek>:<week>` (§15). Two different facts may never share a
// key, and these two live in the same file under nearly the same word.
//
// ⚠⚠ THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN. A death is the world's
// dice; only the RESPONSE is hers – intensity prices depth (and therefore duration, under the
// one-rate law), openness prices expression. `bereavementChanceAt` takes NO ARGUMENTS AT ALL, which
// is the read-set fence pushed as far as it goes, and `tests/wave11-bereavement.test.ts` §B sweeps
// all four temperaments on shared seeds and asserts the realised weeks are identical.

/** ⭐⭐ THE WEEKLY CHANCE, AND IT IS A CONSTANT – his 11.09 0.08%/week, RULED 22.09 as a drafted
 *  number. Pure, zero draws, no writes, and it takes nothing.
 *
 *  ⚠⚠ A FUNCTION AND NOT A BARE CONSTANT READ, for `pregnancyChanceAt`'s own reason: `rollBereavement`
 *  returns on the CHANCE before it derives the stream, so «zero draws on an ineligible week» needs
 *  something to return on. It is also where a later retune would put a shape if one is ever ruled,
 *  and a reader looking for «what can move this number» finds one place rather than a grep. */
export function bereavementChanceAt(): number {
  return ECONOMY.weight.bereavement.perWeek
}

/** ⭐⭐ THE GATE – FOUR CLAUSES, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  1. ⭐⭐⭐ **THE SWITCH.** `world.weightEnabled`, RULED 22.09. Off means no draw at all.
 *  2. ⭐⭐ **THE ADULT RUNG** – `kidAgeExact >= ECONOMY.weight.bereavement.fromAgeYears` (23), his
 *     23.08 «начиная со ступени adult». ⚠ THE ASSET ENFORCES WHAT THE GATE PROMISES:
 *     `fem-euro-brunnet-adult-funeral.webp` exists at the `adult` band and nowhere else, so a
 *     bereavement below the rung would have no picture to wear. The 11.09 log says exactly that.
 *  3. ⭐⭐ **THE CAP** – `bereavementWeeks.length < capPerCareer` (2). A hard cap and not a shaped
 *     decay: past two the arc stops being a life and starts being a theme.
 *  4. ⭐⭐ **THE SPACING** – at least `spacingWeeks` (156) since the last one. Two deaths inside a
 *     season would read as a mechanic rather than as a life.
 *
 *  ⚠⚠ CLAUSES 3 AND 4 READ `world.bereavementWeeks` AND NEVER A DERIVED GUESS, which is the whole
 *  reason that list is persisted: a death writes no record of its own, and `spiritShock` holds ONE
 *  mark that clears itself when she recovers.
 *
 *  ⚠ AND NOTHING ABOUT HER TEMPERAMENT, HER SPIRIT, HER BOND, HER MARRIAGE OR HER SEASON IS IN HERE.
 *  That is the design law, and this gate is the half of the fence `bereavementChanceAt`'s empty
 *  signature cannot build on its own. */
export function bereavementEligible(world: WorldState): boolean {
  if (!world.weightEnabled) return false
  const b = ECONOMY.weight.bereavement
  if (kidAgeNow(world) < b.fromAgeYears) return false
  if (world.bereavementWeeks.length >= b.capPerCareer) return false
  const last = world.bereavementWeeks.reduce((w, at) => Math.max(w, at), -Infinity)
  if (world.bereavementWeeks.length > 0 && world.week - last < b.spacingWeeks) return false
  return true
}

/** ⭐⭐⭐ THE WEEKLY ROLL, AND THE ONE PLACE `spiritShock.kind` BECOMES `'bereavement'`.
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, `rollPregnancy`'s four steps inherited for the third time: the
 *  gate returns first, the CHANCE is computed second and returns if it is 0, and only then is the
 *  stream derived. Never draw-and-discard.
 *
 *  WHAT IT DOES, and the list is §4 in order:
 *    · the week joins `bereavementWeeks`, which the cap and the spacing then read;
 *    · `spiritShock` lands as `'bereavement'` – the depth is `ECONOMY.spirit.shock.bereavement`,
 *      intensity-scaled, and there is NO second recovery rate, no taper and no flag behind it
 *      (§5's one-rate law, refused in writing in `engine/spirit.ts` long before this kind existed);
 *    · the blocking card is raised, in her voice, with the funeral painting on it.
 *
 *  ⚠ THE DETAIL IS THE WEEK, as a string – machine-readable and never a rendered sentence (§G.2's
 *  law). It is the only fact the beat has, because the deceased is UNNAMED (RULED 22.09), and it is
 *  what makes two bereavements in one career distinguishable rows in `lifeLog`.
 *
 *  ⚠⚠ IT IS **NOT** ON THE ATTACHMENT MACHINERY (the design's §3e): its own shock kind, it can reach
 *  the parent in words and never in a number, and the psychologist reads the kind for free exactly
 *  as step 5 built him to. `tests/wave11-bereavement.test.ts` §D is the pin that he needed nothing.
 *
 *  ⚠ ZERO MAIN DRAWS: it takes no `Rng` and pulls only from `seed:life:loss:<week>`, so the frozen
 *  capture (41550 / e6b0c709) cannot see it. */
export function rollBereavement(world: WorldState): void {
  if (!bereavementEligible(world)) return
  const chance = bereavementChanceAt()
  if (chance === 0) return
  if (rngFromSeed(`${world.seed}:life:loss:${world.week}`)() >= chance) return
  world.bereavementWeeks.push(world.week)
  world.spiritShock = { week: world.week, kind: 'bereavement' }
  raiseLifeBeat(world, 'bereavement', String(world.week))
}
