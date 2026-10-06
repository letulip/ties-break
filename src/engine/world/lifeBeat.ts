// THE LIFE BEAT – the week the game stops because SHE said something (the private life, wave 2).
//
// The birthday is the precedent this generalises (`world/birthday.ts`): the ONLY way time moves again is
// an answer, and the engine re-validates it. THE FIVE RULES THIS FILE IS (wave-2 runbook §2): the block
// contract (per kind since 11.09), the record is the queue, engine-side re-validation, the no-cents rule,
// and the copy assembled engine-side.
//
// ⚠⚠ hub: THE NO-CENTS RULE – an answer is NEVER a purchase: `addEvent` is called with no `amountCents` and no price in any word.
// ⚠⚠ hub: THE FENCE – TEMPERAMENT COLOURS THE WORDING AND NOTHING ELSE (who-she-is §3): no `Temperament` parameter on the want-draw.
// ⚠ hub: AND SPIRIT IS READ, NEVER WRITTEN – nothing in this file touches `world.spirit`, and `applyBondDelta` is the only writer it calls.
// → docs/notes/life-beats/hub.md#lifebeatts-header
import { pickInt, rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
// ⚠⚠ `expressedTemperamentOf` JOINS THE LINE IN v76's T7, AND IT DOES NOT REPLACE
// `temperamentFor` OR THE PRIVATE `temperamentOf` BELOW – the architect's RULING A.
//
// ⚠ hub: Each of the five carries its own comment naming the ruling, and `temperamentOf`'s own body is untouched precisely so the split…
// → docs/notes/life-beats/hub.md#expressedtemperamentof-joins-the-line-in-v76-t7-ruling-a
import { applyBondDelta, bondBandOf, expressedTemperamentOf, moodRegisterOf, seasonWrapsWithNoVacation, spiritBandOf, temperamentFor, temperamentOpenness, type Temperament } from '../spirit'
import { kidAgeExact } from './age'
// ⭐ `seasonIndexOf` JOINS `addEvent` HERE IN v74 T8 – the engine's ONE definition of «this season»,
// and the season the tier-1 cap is counted within (`smallTalkThisSeason`, §7). `ledger.ts` is a leaf
// this module already imports at runtime, so no arrow moves and no cycle appears.
import { addEvent } from './ledger'
// ⚠ FROM ./loveEpisodes, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the second one this
// file records, on `guardNotEndedForGood`'s own precedent just below. Both selectors were
// DECLARED here by T1; T4 gave `engine/spirit.ts` a reader for `activeEpisode` (the effective
// baseline), and this module imports `../spirit` at runtime, so leaving them here would have
// closed a value loop.
//
// ⚠⚠ hub: AND v75 T4 TOOK IT BACK OFF THIS LINE, WHICH IS RECORDED RATHER THAN QUIETLY DELETED (ruling B).
// → docs/notes/life-beats/hub.md#the-loveepisodes-import--a-cycle-fix-not-a-preference
import { activeEpisode, loveEpisodesOf, relationshipDurationWeeks } from './loveEpisodes'
// ⭐ ROUND 46 #22 – the dev life-event boost, a leaf the arrival's compare reads through.
import { boostedChance } from './lifeBoost'
// ⚠ FROM ./constants, NOT ./endings, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the same
// swap `world/entries.ts` records at its own import. `endings.ts` imports THIS module (it
// raises the fork-opinion row and asks `pendingLifeBeat` before it will answer the fork), so
// an import back into `endings.ts` would close a runtime loop.
//
// ⚠ hub: `knockRunning` IS TAKEN FROM THE LEAF AND NOT FROM `world/knock.ts`, WHICH IS WHERE IT READS AS LIVING
// → docs/notes/life-beats/hub.md#the-constants-import--a-cycle-fix-not-a-preference
import { guardNotEndedForGood, KID_ID } from './constants'
// ⭐⭐⭐ ROUND 42 #15/#24 – THE THREE READS THE FACTUAL BOUNDARY NEEDS (§8d.5), and all three are
// leaves or near-leaves that do not import back here (checked module by module before they
// were added).
//
// ⚠ hub: NOT `multiWeek.ts`' `eventIsHers`, NOT `knock.ts`' `ordinaryTrainingWeek`, NOT `coachMarket.ts`
// → docs/notes/life-beats/hub.md#round-42-1524--the-three-reads-the-factual-boundary-needs
import { entryStatus } from './medical'
// ⭐ C-07 (the owner's ruling 3(a), 26.09) – THE FOURTH READ §8d.5's FACTUAL BOUNDARY NEEDS,
// and it passes the same test the three above did before it was added.
// → docs/notes/life-beats/hub.md#c-07-2609--the-fourth-read-the-factual-boundary-needs
import { inCollege } from './college'
// ⭐ v83 (the wedding, wave 7 – T3) – THE MILESTONE CHANNEL, `markSchoolEnd`'s own two
// surfaces: the kept feed line and the scroll's row, both idempotent by key.
//
// ⚠ hub: ONE-WAY ARROW, MEASURED THE HOUSE WAY before it was believed
// ⚠⚠ hub: THE IMPORT ITSELF LEFT THIS FILE ON 28.09 (A-06 / T6.10) AND THE ARROW IS UNCHANGED.
// ⚠ hub: AND THE SENTENCE ABOVE ABOUT WHO IMPORTS THIS FILE IS NOW SHORT BY THE PACKAGE
// ⚠ hub: The reason that list was ever believed complete is worth keeping: `git grep -ln "world/lifeBeat'" -- src` names ONE file…
// → docs/notes/life-beats/hub.md#v83-t3--the-milestone-channel-markschoolends-two-surfaces
import { weekMonth } from '../../shared/dates'
// ⭐⭐⭐ v76 T6 – THE SEAT, ASKED DIRECTLY, WHICH IS THE MASSEUR'S OWN WAY (`world/medical.ts:62`
// spends `masseurWorksThisWeek` inside `accrueCondition` exactly like this).
// `psychologistWorkingRung` answers three questions in one – not hired · hired for a different
// year · stood down by a college freeze or a booked family week – and the working week IS the
// billing week (ruling J).
//
// ⚠ hub: NO PARAMETER AND NO INVERSION, AND IT IS MEASURED RATHER THAN ASSUMED.
// ⚠ hub: RE-RUN AT T8 rather than inherited (the brief's own ), on the tree's own value imports with `import type` and all-`type` named…
// ⚠ hub: THE TWO PREDICATES ANSWER DIFFERENT QUESTIONS and both are wanted here
// → docs/notes/life-beats/hub.md#v76-t6--the-seat-asked-directly
import { psychologistWorkingRung, psychologistWorksThisWeek } from './psychologist'
// ⭐⭐⭐ v77 T6 – THE SPOTLIGHT'S ONE GATE AND THE STOCK BEHIND IT, both READ and neither written
// (the wave's §8: this wave only reads `fameAt`, and `ECONOMY.fame` is fame-presence's
// ground). §9 below is the whole of what uses them: `newsStandingOf` (D1, 14.09) decides
// whether the world is looking at all and `fameAt` is ruling I's third factor in the hazard's
// product.
//
// ⚠ hub: NO CYCLE, AND IT IS MEASURED RATHER THAN ASSUMED
// ⚠ hub: AND `fameAt` LEFT WITH §9 ON 28.09 (A-06 / T6.8)
// ⚠ hub: AND THE WHOLE `./spotlight` IMPORT LEFT WITH §9 AND §10 ON 28.09 (A-06 / T6.8).
// → docs/notes/life-beats/hub.md#v77-t6--the-spotlights-one-gate-and-the-stock-behind-it
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
import type { BondBand, DiaryLifeStage, LifeBeatFollowUp, LifeBeatKind, LifeBeatPrompt, LifeBeatRecord, LoveEpisode, MoodRegister, SoftBeatInvite, SpouseViewOccasion } from '../../shared/protocol/narrative'
// ⚠ A VALUE IMPORT FROM `shared/` AND THE ONLY ONE THIS FILE MAKES: §14's diary band reads the
// PORTRAIT's own late-stretch window so the words and the painting change on the same week.
// `shared/` is not the UI - engine purity forbids vue/pinia and the component directories, and
// `avatarEmotion.ts` is pure arithmetic over three week numbers.
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

/** ⭐ THE RECORD IS THE QUEUE.
 *
 *  ⚠ lifeLogOf: ABSENT `lifeLog` READS AS AN EMPTY LIFE, NOT AS AN ERROR.
 *  → docs/notes/life-beats/hub.md#lifelogof--the-record-is-the-queue
 */
export function lifeLogOf(world: WorldState): readonly LifeBeatRecord[] {
  return world.lifeLog ?? []
}

/** ⭐⭐⭐ v74 T15 – WHICH KINDS STOP THE WEEK, DECLARED PER KIND AND **TOTAL BY TYPE** (who-she-is
 *  §5b's «SOFT BLOCK CONCRETIZED» amendment, 11.09: «the beat-kind registry declares `blocking`
 *  per kind – total by type, so every future kind must choose»).
 *
 *  ⚠⚠ LIFE_BEAT_BLOCKING: A `Record<LifeBeatKind, boolean>` AND NEVER A LIST OF THE BLOCKING ONES
 *  ⚠ LIFE_BEAT_BLOCKING: AND IT IS A PROPERTY OF THE TIER, which is why it belongs beside the kinds rather than at the two stop sites.
 *  → docs/notes/life-beats/hub.md#life_beat_blocking--v74-t15--which-kinds-stop-the-week-declared-per-kind
 */
export const LIFE_BEAT_BLOCKING: Record<LifeBeatKind, boolean> = {
  // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – TRUE, AND IT IS `'ended'`'s ONE WORD INHERITED RATHER
  // THAN A SECOND DECISION.
  //
  // ⚠ LIFE_BEAT_BLOCKING: NO REGISTER CLAUSE HERE, unlike `'ended'`'s…
  // → docs/notes/life-beats/hub.md#life_beat_blocking--v88-the-parting-wave-12--t1--true
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
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – TRUE, AND IT IS THE ONE WORD THE WHOLE RAMP RUNS ON.
  //
  // ⚠ LIFE_BEAT_BLOCKING: IT IS ALSO THE ONLY BEAT IN THIS TABLE THAT IS NOT ABOUT HER LIFE
  // → docs/notes/life-beats/hub.md#life_beat_blocking--v85-the-return-wave-8--t6--true
  'return-plan': true,
}

/** The beat waiting to be answered, or null. The FIRST unanswered row in `lifeLog` order – so a
 *  week that raised two of them asks about them one at a time and never loses the second.
 *
 *  ⚠⚠ pendingLifeBeat: AND THE NARROWING IS ALSO WHAT KEEPS AN EXPIRED ROW HARMLESS.
 *  → docs/notes/life-beats/hub.md#pendinglifebeat--the-beat-waiting-to-be-answered-or-null
 */
export function pendingLifeBeat(world: WorldState): LifeBeatRecord | null {
  return lifeLogOf(world).find((row) => row.answer === null && LIFE_BEAT_BLOCKING[row.kind]) ?? null
}

/** ⭐⭐⭐ v74 T15 – THE SOFT ROW THAT IS STILL ANSWERABLE, or null. The Home card's whole
 *  existence condition, and the second half of what the queue means now.
 *
 *  ⚠⚠ liveSoftBeat: THE WINDOW IS DERIVED AND NEVER STORED
 *  ⚠ liveSoftBeat: `>= 0` REFUSES A ROW FROM THE FUTURE rather than reading it as live.
 *  ⚠ liveSoftBeat: THE **FIRST** LIVE ONE, IN LOG ORDER, which is `pendingLifeBeat`'s own rule…
 *  → docs/notes/life-beats/hub.md#livesoftbeat--v74-t15--the-soft-row-that-is-still-answerable
 */
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

/** ⭐⭐⭐ v74 T17 – THE TWO ROOTS OF A `stop`, READ ONCE. How far she is BELOW spirit's baseline
 *  and how far the home is BELOW bond's start, each as a 0..1 share.
 *
 *  ⚠⚠ stopRootsOf: ONE READING, TWO CONSUMERS, AND THAT IS THE WHOLE REASON THIS IS A FUNCTION.
 *  ⚠ stopRootsOf: `strained` IS THE MIRROR OF `close`, measured off `bond.start` in the other direction…
 *  → docs/notes/life-beats/hub.md#stoprootsof--v74-t17--the-two-roots-of-a-stop-read-once
 */
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
 *  ⚠⚠ forkWantWeights: THREE INPUTS AND THERE IS NO FOURTH.
 *  ⚠⚠ forkWantWeights: THE `stop` WEIGHT IS NO LONGER A LEAN, AND THIS IS THE OWNER'S RULING OF 11.09 MADE ARITHMETIC.
 *  owner (forkWantWeights): «моей 18, я ещё игры не видел»
 *  ⚠⚠ forkWantWeights: AND THE OLD «EVERY WEIGHT IS >= 1» CLAIM IS REPLACED BY AN HONEST ONE
 *  ⚠ forkWantWeights: BOTH ROOTS ARE CLAMPED TO 0..1, which `lean` used to do for `worn` on its way past.
 *  → docs/notes/life-beats/hub.md#forkwantweights--what-she-wants-as-three-weights
 */
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

/** ⭐⭐⭐ v74 T17 – WHICH ROOT HER `stop` IS WORDED FROM, and it is spent on WORDING AND NOTHING
 *  ELSE.
 *
 *  ⚠⚠ ForkStopDriver: THE DRIVER NEVER RE-WEIGHTS THE DRAW IT EXPLAINS.
 *  ⚠ ForkStopDriver: WORN WINS A TIE ON PURPOSE.
 *  ⚠ ForkStopDriver: THE THRESHOLD IS **STRICTLY GREATER**, so a girl at exactly the line is still `'own'`…
 *  → docs/notes/life-beats/hub.md#forkstopdriver--v74-t17--which-root-her-stop-is-worded-from
 */
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
 *  ⚠ forkStandingOf: IT TAKES THE SCORE RATHER THAN THE WORLD
 *  ⚠ forkStandingOf: AND THE SCORE IT EXPECTS IS `juniorRecordScore`, WHICH IS THE FORK'S OWN MEASURE.
 *  → docs/notes/life-beats/hub.md#forkstandingof--her-ladder-standing-as-one-01-number
 */
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

// 3. THE BEAT'S COPY – ⚠⚠ EVERY WORD BELOW IS A DRAFT FOR THE OWNER (CLAUDE.md invariant 4) –
// Written against `docs/specs/voice-bibles-2026-09.md` §A (the four bibles) and §B (the flat
// pool), and every line obeys the TWO SHAPE RULES the week-note pins already enforce for the
// whole corpus:
//
// ⚠⚠ BeatPresence: THE DEFECT IT CLOSES IS A LICENCE DEFECT, NOT A TASTE ONE.
// ⚠ BeatPresence: IT IS DERIVED FROM `DiaryLifeStage` AND FROM NOTHING ELSE
// → docs/notes/life-beats/hub.md#lifebeatts-3--the-beats-copy
type BeatPresence = 'roof' | 'away'

/** ⚠ EXPORTED 28.09 BY T6.10: `world/lifeBeat/smallTalk.ts` cuts the stage into a register before it
 *  words a card, and the paragraph above is the reason it must ask rather than copy – there is ONE copy
 *  of the away rule and it lives in `diary/words.ts`. Not on the barrel (T6.6's frozen name set). */
export function presenceOf(stage: DiaryLifeStage): BeatPresence {
  return awayVoice({ lifeStage: stage }) ? 'away' : 'roof'
}

/** One cell of a voiced pool, in both presence registers. ⚠⚠ `away` IS OPTIONAL AND THE `?` IS
 *  A RULING RATHER THAN A CONVENIENCE: the owner wrote 19 away frames for 20 cells and named
 *  the twentieth himself – `sunny`/`joy`'s «She said it before anyone had asked how the week
 *  went.» is channel-neutral and stays SHARED, so that one cell reads its roof line at both
 *  distances.
 *
 *  ⚠ PresenceCell: AND THE QUOTED SPAN IS SHARED BY LAW, not by habit
 *  owner (PresenceCell), 11.09: «цитаты уже с контракциями по P2, они общие с домашними рамками»
 *  ⚠ PresenceCell: `export` SINCE 28.09 (A-06 / T6.8) AND FOR ONE REASON ONLY
 *  → docs/notes/life-beats/hub.md#presencecell--one-cell-of-a-voiced-pool-in-both-presence-registers
 */
export interface PresenceCell {
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
 *  ⚠ HER_LINE: THIS TABLE IS THE ONLY THING IN THIS FILE INDEXED BY TEMPERAMENT, and that is the fence made structural
 *  ⚠ HER_LINE: THE BIBLE EACH VOICE IS WRITTEN TO, in one line each, so a later writer does not have to reconstruct…
 *  ⚠ HER_LINE: AND THE `quiet` ROWS ARE THE LICENSED EXCEPTION THE BIBLE ITSELF NAMES.
 *  owner (HER_LINE), 10.09: «давай осмысленно теперь применим и интегрируем»
 *  → docs/notes/life-beats/hub.md#her_line--her-line-by-voice-by-want-by-register--24-drafts
 */
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

/** ⭐⭐⭐ v74 T17 – HER `stop` LINE, BY VOICE, BY THE ROOT THE WANT ACTUALLY HAS – 8 drafts, and
 *  the `'own'` column is the EIGHT LINES ABOVE, untouched.
 *
 *  ⚠⚠ HER_STOP_LINE: WHY THIS POOL EXISTS AT ALL.
 *  ⚠⚠ HER_STOP_LINE: THE DRIVER IS WORDING AND NEVER WEIGHT.
 *  ⚠⚠ HER_STOP_LINE: AND THE REGISTER SPLIT IS ABSENT HERE **BY DERIVATION, NOT BY ECONOMY**
 *  ⚠ HER_STOP_LINE: NO PRESENCE AXIS, AND IT IS THE SAME SCOPE STATEMENT `HER_LINE` MAKES.
 *  ⚠ HER_STOP_LINE: A `strained` LINE IS ONLY REACHABLE IN HER OWN VOICE INSIDE A NARROW WINDOW
 *  ⚠ HER_STOP_LINE: THE BIBLE EACH VOICE IS WRITTEN TO is `HER_LINE`'s own line above, unchanged…
 *  ⚠ HER_STOP_LINE: The shipped `'own'` lines above are uncontracted (wave 2, pre-вычитка) and are NOT touched here…
 *  → docs/notes/life-beats/hub.md#her_stop_line--v74-t17--her-stop-line-by-voice-by-the-root-of-the-want
 */
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

/** ⭐⭐ THE FLAT POOL – what a `strained` or `cold` home sounds like on the biggest question of…
 *
 *  ⚠ FLAT_LINE: SHE ANSWERS; SHE NEVER OFFERS
 *  ⚠ FLAT_LINE: AND SHE IS NEVER RUDE.
 *  → docs/notes/life-beats/hub.md#flat_line--the-flat-pool--what-a-strained-or-cold-home-sounds-like
 */
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
// 3d. `'fork-counsel'` – THE COPY MOVED TO `world/lifeBeat/forkCounselCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: only the dispatcher hub below read it, so it left whole – banner, rulings and
// chronicles included – and the hub imports the two back. The `stop` want's own maths (§2) stays here,
// which is the fence this file's head describes: the driver is spent on WORDING and nothing else.
import { COACH_COUNSEL, COUNSEL_HEADING } from './lifeBeat/forkCounselCopy'

// 3f. `'fork-psy'` – THE COPY MOVED TO `world/lifeBeat/forkPsyCopy.ts` (A-06 / T6.8, 28.09) –
// A pure leaf: only the dispatcher hub below read it, so it left whole – banner, the 09.09…
//
// ⚠ hub: The OTHER section this file numbered «3f» («learning to listen», `drawListenHeard` / `listenHeardNow`) is NOT this one and stays…
// → docs/notes/life-beats/hub.md#lifebeatts-3f--fork-psy--the-copy-moved
import { PSY_COUNSEL, PSY_HEADING, PSY_REGISTERS } from './lifeBeat/forkPsyCopy'

// 3b. `'met'` – THE COPY MOVED TO `world/lifeBeat/metCopy.ts` (A-06 / T6.8, 28.09) – A pure
// leaf, and the bond band's register predicate went with the pools it picks between – cutting
// by KIND rather than by shape is what puts `metRegisterOf` beside the four things it chooses
// from.
// → docs/notes/life-beats/hub.md#lifebeatts-3b--met--the-copy-moved
import { MET_DRY, MET_HEADING, MET_HEADING_HEADLINE, MET_HER_LINE, MET_MENTION, metRegisterOf } from './lifeBeat/metCopy'

// 3c. `'small-talk'` – THE COPY MOVED TO `world/lifeBeat/smallTalkCopy.ts` (A-06 / T6.8,
// 28.09) – A pure leaf – the dispatcher below and §7's roll are its only readers – so it left
// whole, banner, who-she-is §5b's quotation and every chronicle included, with the two subject
// rosters and their two types.
//
// ⚠⚠ §3c-2, THE SITUATION LAYER, STAYS HERE, and it is the one place in T6.8 where a COPY section could not move…
// → docs/notes/life-beats/hub.md#lifebeatts-3c--small-talk--the-copy-moved
import { LEGACY_SMALL_TALK_SUBJECTS, SMALL_TALK_CARD, SMALL_TALK_FRAME_REGISTER, SMALL_TALK_HEADING, SMALL_TALK_LINE, SMALL_TALK_SUBJECTS, smallTalkSubjectFor } from './lifeBeat/smallTalkCopy'
import type { LegacySmallTalkSubject, SmallTalkSubject } from './lifeBeat/smallTalkCopy'
export { LEGACY_SMALL_TALK_SUBJECTS, SMALL_TALK_SUBJECTS, smallTalkSubjectFor }
export type { LegacySmallTalkSubject, SmallTalkSubject }

// 3c-2. ⭐⭐⭐ ROUND 42 #15/#24 – THE SITUATION, AND THE BEAT BECOMES AN EXCHANGE –
// `docs/specs/the-small-talk-exchange-2026-09.md`, and the copy in this section is HIS –
// §8a–§8c are eight exchanges he read line by line and revised on 15.09. What is drafted
// rather than his is flagged where it stands, and only there.
//
// owner (hub, round 42 #15): «выбрал пункт, чтобы она сказала больше, а попап закрылся»…
// owner (hub, round 42 #24): «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше разнообразия»…
// ⚠⚠ hub: §8d's FIVE FINDINGS, WHICH ARE DESIGN AND OUTRANK THE LINE EDITS.
// ⚠ hub: (ONE EXCEPTION STANDS AND IS REPORTED RATHER THAN EDITED – see `line-call`.)
// ⚠⚠ hub: THE FACTUAL BOUNDARY, AND IT IS A LAW.
// ⚠ hub: TEXTURE ONLY, THE FOG LAW UNCHANGED (spec §11)
// → docs/notes/life-beats/hub.md#lifebeatts-3c-2--round-42-1524--the-situation-and-the-beat-becomes-an-exchange

/** ⭐⭐ THE THREE STANCES (spec §3), AND THEY ARE ALWAYS THE SAME THREE SHAPES.
 *
 *  ⚠⚠ SMALL_TALK_STANCES: AND EACH ONE KEEPS ITS SHIPPED OPTION ID
 *  → docs/notes/life-beats/hub.md#small_talk_stances--the-three-stances-spec-3
 */
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

/** Her competitive matches as the feed retains them, oldest first: week, opponent, and whether…
 *
 *  ⚠ kidMatchRows: FRIENDLIES EXCLUDED (`!e.friendly`)
 *  ⚠⚠ kidMatchRows: AND IT IS A ROLLING WINDOW, NOT A CAREER.
 *  → docs/notes/life-beats/hub.md#kidmatchrows--her-competitive-matches-as-the-feed-retains-them
 */
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
 *  CALENDAR fact and no other claim carried one: `march-entry-open` asks whether a door is
 *  still open, this asks whether the week behind it is empty.
 *
 *  ⚠⚠ nextWeekIsClear: TWO CLAUSES AND NOT ONE, AND THE SECOND IS THE HONEST HALF.
 *  ⚠ nextWeekIsClear: `enteredScheduledThisWeek` (world/injury.ts) one week forward, on the same two fields, negated.
 *  → docs/notes/life-beats/hub.md#nextweekisclear--8d5s-fifth-read
 */
export function nextWeekIsClear(world: WorldState): boolean {
  const ahead = world.season.filter((e) => e.week === world.week + 1)
  return ahead.length > 0 && !ahead.some((e) => world.entries.includes(e.id))
}

/** ⭐⭐⭐ §8d.5's FIVE READS, AND EVERY ONE OF THEM IS PURE AND ZERO-DRAW. They are asked BEFORE
 *  the situation is drawn (`reachableSituations`), never after, so a false fact removes the
 *  situation from the pool instead of being papered over in the copy.
 *
 *  ⚠ SMALL_TALK_FACT: `march-entry-open` CARRIES THE DEADLINE CLAUSE HIS REVIEW ADDED IN THE GATE, not in the option list.
 *  ⚠ SMALL_TALK_FACT: `world.week < e.deadlineWeek` AND NOT `<=`
 *  ⚠⚠ SMALL_TALK_FACT: AND IT CARRIES `!inCollege(world)` SINCE C-07 (the owner's ruling 3(a), 26.09).
 *  ⚠⚠ SMALL_TALK_FACT: `world.college` AND NEVER `world.ending`, and this is the one clause where the difference is the whole fix.
 *  ⚠ SMALL_TALK_FACT: WHAT IT COSTS, PRICED AND NOT ASSUMED
 *  ⚠ SMALL_TALK_FACT: `tests/principles-c07-march-entry.test.ts`
 *  → docs/notes/life-beats/hub.md#small_talk_fact--8d5s-five-reads-and-every-one-of-them-is-pure
 */
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
 *  than a row of its own. The corpus's §2 is the whole of the change: a situation carries the
 *  event, the stages and the fact; the OPENER and the three branches are written PER VOICE, so
 *  the same evening can be told four ways instead of being locked to one girl in four.
 *
 *  ⚠⚠ SmallTalkVoiceEntry: `opener` IS ONE SPOKEN PAYLOAD AND CARRIES NO FRAME.
 *  → docs/notes/life-beats/hub.md#smalltalkvoiceentry--round-44--one-situation-in-one-voice
 */
export interface SmallTalkVoiceEntry {
  /** Her spoken line, quotation marks and all, with NO lead-in. The scene is the pool's. */
  opener: string
  /** ⭐ §8d.2 – `story` ONLY: the incident itself, heard by every route before its own branch.
   *  ⚠ PER VOICE, because the incident is told in her words: `court-four`'s four columns each carry
   *  their own. The 43 corpus rows carry none – their openers hold the whole story. */
  shared?: string
  branches: Record<SmallTalkStance, SmallTalkBranch>
}

/** ⭐⭐⭐ ONE SITUATION, IN UP TO FOUR VOICES.
 *
 *  ⚠ SmallTalkSituation: `id` IS PERSISTED (it is half of the row's `detail`), so the ids here are APPEND-ONLY…
 *  → docs/notes/life-beats/hub.md#smalltalksituation--one-situation-in-up-to-four-voices
 */
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

/** ⭐⭐⭐ THE CATALOGUE, AS THE ENGINE SEES IT – **ALL FIFTY-ONE SITUATIONS, OUT OF ONE
 *  DOCUMENT.**
 *
 *  ⚠⚠ SMALL_TALK_SITUATIONS: THIS FILE NO LONGER HOLDS A CATALOGUE OF ITS OWN, AND THAT IS ROUND 44's ARCHITECTURAL MOVE.
 *  ⚠⚠ SMALL_TALK_SITUATIONS: GENERATED AND NEVER HAND-EDITED.
 *  ⚠ SMALL_TALK_SITUATIONS: THE EIGHT COME FIRST IN THE DOCUMENT AND IT IS NOT COSMETIC.
 *  ⚠ SMALL_TALK_SITUATIONS: IDS ARE APPEND-ONLY and are asserted unique – the id is persisted as half of a `lifeLog` row's `detail`…
 *  ⚠⚠ SMALL_TALK_SITUATIONS: AND THE RULINGS THEIR BANNER COMMENTS CARRIED WENT WITH THEM
 *  ⚠ SMALL_TALK_SITUATIONS: SPEC §10's DELIVERY ORDER WAS HIS AND IS NOW SPENT
 *  → docs/notes/life-beats/hub.md#small_talk_situations--the-catalogue-as-the-engine-sees-it--all-fifty-one
 */
export const SMALL_TALK_SITUATIONS: readonly SmallTalkSituation[] = SMALL_TALK_CORPUS

// ⭐⭐⭐ ROUND 44 – THE FRAME POOL: THE SCENE SHE SAYS IT IN, WHICH IS NOT THE THING SHE SAYS –
// `docs/specs/the-frame-pool-2026-09.md`. The eighteen lines are the owner's, delivered 17.09
// against the brief in that file; four of them are marked DRAFT there and are his to rule on.
//
// ⚠⚠ hub: WHY A POOL AND NOT A FRAME PER ROW.
// ⚠⚠ hub: AND THE POOL IS KEYED ON PRESENCE ALONE
// ⚠ hub: AN `away` FRAME MAY NOT MENTION A ROOM, A FLATMATE, A LECTURE, A HOTEL OR A TOURNAMENT
// → docs/notes/life-beats/hub.md#round-44--the-frame-pool-the-scene-she-says-it-in

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
 *  ⚠⚠ SMALL_TALK_FRAMES: THE IDS ARE PERSISTED AND THEREFORE APPEND-ONLY, and the two pools' ids must stay DISJOINT
 *  ⚠ SMALL_TALK_FRAMES: THE FIRST FIVE `roof` LINES AND THE FIRST `away` LINE ARE THE ONES THAT WERE INLINE IN `SMALL_TALK_SITUATIONS`…
 *  owner (SMALL_TALK_FRAMES): «по-английски рассказывают `a story` или `someone something`, но не универсальное `it`»
 *  → docs/notes/life-beats/hub.md#small_talk_frames--nine-per-presence-his-1709
 */
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
 *  ⚠⚠ recentFrames: THE PRESENCE IS READ OFF THE FRAME ID AND NOT OFF THE ROW
 *  ⚠ recentFrames: A ROW WITH NO `frame` IS NOT A MEMORY.
 *  ⚠ recentFrames: PURE AND ZERO-DRAW.
 *  → docs/notes/life-beats/hub.md#recentframes--the-frames-she-has-just-been-given-in-this-presence
 */
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
 *  ⚠⚠ drawSmallTalkFrame: THE STREAM IS PURPOSE-SCOPED AND IS NEVER MAIN (invariant 2).
 *  ⚠⚠ drawSmallTalkFrame: AND THE RESULT IS STORED RATHER THAN RE-DERIVED, WHICH IS THE WHOLE OF THE SCHEMA MOVE.
 *  ⚠ drawSmallTalkFrame: The same reasoning applies to the EXCLUSION: it is read at the draw and never afterwards…
 *  ⚠ drawSmallTalkFrame: THE POOL IS NEVER EMPTIED.
 *  ⚠ drawSmallTalkFrame: EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts`, its only caller.
 *  → docs/notes/life-beats/hub.md#drawsmalltalkframe--which-frame-this-week-at-this-distance--drawn-once-at-the-raise
 */
export function drawSmallTalkFrame(world: WorldState, presence: BeatPresence): string {
  const banned = new Set(recentFrames(world, presence))
  const pool = SMALL_TALK_FRAMES[presence].filter((f) => !banned.has(f.id))
  const live = pool.length > 0 ? pool : SMALL_TALK_FRAMES[presence]
  const at = pickInt(rngFromSeed(`${world.seed}:smalltalk:frame:${world.week}`), 0, live.length - 1)
  return live[at].id
}

/** ⭐⭐ THE FRAME A ROW WAS GIVEN, FOR RENDERING.
 *
 *  ⚠ smallTalkFrameOf: A FRAME ID THAT NAMES NOTHING THROWS, like every other unreadable detail in this file…
 *  → docs/notes/life-beats/hub.md#smalltalkframeof--the-frame-a-row-was-given-for-rendering
 */
function smallTalkFrameOf(frame: string | undefined, presence: BeatPresence): string {
  const pool = SMALL_TALK_FRAMES[presence]
  if (frame === undefined) return pool[0].line
  const found = pool.find((f) => f.id === frame)
  if (found === undefined) throw new Error(`A small-talk row names no ${presence} frame: ${frame}`)
  return found.line
}

/** ⭐⭐ THE MOOD WEIGHTS (spec §2), AND THEY ARE WEIGHTS RATHER THAN A MAPPING – which is the
 *  whole mechanical change of that section. «A heavy week leans toward `worry` but can still
 *  produce a tired `observation` or a small `decision`; a bright week leans toward `good-news`
 *  or `story`; an ordinary week leans toward `curiosity`, `decision` or `observation`.»
 *
 *  ⚠⚠ SMALL_TALK_SUBJECT_WEIGHT: THE NUMBERS ARE A **DRAFT** AND SPEC §12.1 NAMES THEM AS NEEDING HIS WORD
 *  ⚠ SMALL_TALK_SUBJECT_WEIGHT: NO ZERO ANYWHERE, and that is the design rather than caution…
 *  ⚠ SMALL_TALK_SUBJECT_WEIGHT: EXPORTED FOR THE CORPUS BENCH AND FOR NOTHING ELSE (round 43 #8(a))…
 *  → docs/notes/life-beats/hub.md#small_talk_subject_weight--the-mood-weights-spec-2
 */
export const SMALL_TALK_SUBJECT_WEIGHT: Record<MoodRegister, Record<SmallTalkSubject, number>> = {
  low: { worry: 5, observation: 2, decision: 2, story: 1, curiosity: 1, 'good-news': 1 },
  bright: { 'good-news': 5, story: 4, observation: 2, curiosity: 2, decision: 1, worry: 1 },
  level: { curiosity: 3, decision: 3, observation: 3, story: 2, 'good-news': 2, worry: 1 },
}

/** ⭐⭐⭐ WHICH SITUATIONS THIS GIRL, AT THIS STAGE, ON THIS CAREER, COULD ACTUALLY BRING. The one
 *  place the three gates meet, and the one road to a drawable situation.
 *
 *  ⚠⚠ reachableSituations: THE FACT IS ASKED HERE AND NOWHERE ELSE, WHICH IS WHAT MAKES §8d.5 A PROPERTY.
 *  ⚠ reachableSituations: PURE AND ZERO-DRAW.
 *  → docs/notes/life-beats/hub.md#reachablesituations--which-situations-this-girl-could-actually-bring
 */
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

/** ⭐⭐ ROUND 43 #8(a) – HOW MANY OF HER LAST CONVERSATIONS ARE OFF THE TABLE.
 *
 *  ⚠ SMALL_TALK_EXCLUDE_LAST: IT IS A COUNT OF ROWS AND NOT A WINDOW OF WEEKS, deliberately.
 *  → docs/notes/life-beats/hub.md#small_talk_exclude_last--round-43-8a--how-many-of-her-last-conversations-are-off-the-table
 */
export const SMALL_TALK_EXCLUDE_LAST = 2

/** ⭐⭐⭐ ROUND 43 #8(a) – THE SITUATIONS SHE HAS JUST BROUGHT, TAKEN OUT OF THE POOL, AND **THE
 *  POOL IS NEVER EMPTIED**.
 *
 *  ⚠⚠ withoutRecentSituations: THE DEGRADATION IS THE WHOLE OF THE CARE HERE, and it runs OLDEST-FIRST.
 *  ⚠ withoutRecentSituations: IT READS THE LOG AND WRITES NOTHING.
 *  ⚠ withoutRecentSituations: THE MATCH IS ON THE STORED `detail` STRING, not on the id alone.
 *  ⚠ withoutRecentSituations: PURE AND ZERO-DRAW.
 *  → docs/notes/life-beats/hub.md#withoutrecentsituations--round-43-8a--the-situations-she-has-just-brought-out-of-the-pool
 */
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

/** THE ROW'S OWN DETAIL, AND IT IS TWO FIELDS – `'fork-psy'`'s shape…
 *
 *  ⚠ smallTalkDetailFor: EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts`.
 *  → docs/notes/life-beats/hub.md#smalltalkdetailfor--the-rows-own-detail-and-it-is-two-fields
 */
export function smallTalkDetailFor(subject: SmallTalkSubject, id: string): string {
  return `${subject}:${id}`
}

/** ⭐⭐ READING IT BACK. `null` is a LEGACY row – one of the three shipped subjects, no colon, no
 *  situation – and the legacy pool is what renders it.
 *
 *  ⚠ smallTalkVoiceOf: IT TAKES THE VOICE BECAUSE A SITUATION IS PER-VOICE.
 *  ⚠ smallTalkVoiceOf: A ROW NAMING A SITUATION THAT NO LONGER EXISTS THROWS, like every other unreadable detail in this file.
 *  → docs/notes/life-beats/hub.md#smalltalkvoiceof--reading-it-back
 */
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
 *  ⚠⚠ smallTalkOpener: IT NO LONGER THROWS FOR A MISSING FRAME, AND THAT IS THE SHAPE CHANGE RATHER THAN A LOOSENING.
 *  → docs/notes/life-beats/hub.md#smalltalkopener--round-44--her-opener-a-pool-frame-joined-to-one-spoken-payload
 */
function smallTalkOpener(column: SmallTalkVoiceEntry, presence: BeatPresence, frame: string | undefined): string {
  return `${smallTalkFrameOf(frame, presence)} ${column.opener}`
}

// 3e. `'ended'` – THE COPY MOVED TO `world/lifeBeat/endedCopy.ts` (A-06 / T6.8, 28.09) – A
// pure leaf, and the two types and two rosters of this beat's own shape went with it.
//
// ⚠ §8, the end's HAZARD half, is still here: it calls back into the hub and its three names reach `world.ts` through the hub's re-export…
// → docs/notes/life-beats/hub.md#lifebeatts-3e--ended--the-copy-moved
import { ENDED_DRY, ENDED_HEADING, ENDED_HER_LINE } from './lifeBeat/endedCopy'
import type { EndsRead, EndsRegister } from './lifeBeat/endedCopy'
export { ENDS_READS, ENDS_REGISTERS } from './lifeBeat/endedCopy'
export type { EndsRead, EndsRegister } from './lifeBeat/endedCopy'

// 3f. «LEARNING TO LISTEN» – ⚠⚠ THE SAME NEWS, READ PLAINLY (wave 5, T6). EVERY WORD BELOW IS
// A DRAFT. – `docs/specs/the-psychologists-year-2026-09.md` §2, the «Learning to listen» row:
// on a week the family is paying a psychologist whose chosen year is `'listen'`, one uniform
// per read-bearing beat against `ECONOMY.psychologist.listenClarity[rung]` decides whether the
// card's HEADING and the KEPT FEED ROW say plainly what she wants.
//
// ⚠⚠⚠ hub: HE COACHES THE PARENT AND NEVER REPORTS HER SESSIONS
// ⚠⚠ hub: AND THE BOND ARITHMETIC IS UNTOUCHED ON BOTH SIDES OF THE COIN.
// ⚠⚠ hub: THE LEGIBLE POOLS ARE THE FIRST PARENT'S-FRAME COPY IN THIS FILE INDEXED BY TEMPERAMENT
// ⚠ hub: SO EVERY LEGIBLE CELL IS A RULE ABOUT HER, NEVER A CLAIM ABOUT THIS WEEK'S TELLING.
// ⚠⚠ hub: AND THAT RULE IS A LINT RATHER THAN THIS SENTENCE
// ⚠ hub: Forty and not forty-eight since T6b: ruling O took the legible told-now kept row out (`ENDED_EVENT_HEARD`, 16 → 8).
// ⚠ hub: AND NOT ONE OF THEM NAMES AN ANSWER, which is `ENDED_HEADING`'s own rule inherited whole…
// → docs/notes/life-beats/hub.md#lifebeatts-3f--learning-to-listen

/** ⭐⭐⭐ THE COIN – DID THE PARENT READ HER PLAINLY, THIS BEAT. One uniform on
 *  `seed:psy:listen:<kind>:<week>` against `ECONOMY.psychologist.listenClarity[rung]` (the spec
 *  §2's ruled 0.6 / 0.8 / 0.95).
 *
 *  ⚠⚠ drawListenHeard: THE KIND IS IN THE KEY, which is §1f's one-value-per-key law satisfied by construction rather than by luck…
 *  ⚠ drawListenHeard: THE WEEK IS THE RAISE WEEK, never an episode's date and never a later `world.week`…
 *  ⚠ drawListenHeard: (seed, calendar, kind)-KEYED AND NEVER (seed, choice)-KEYED, like every stream in this file.
 *  ⚠ drawListenHeard: THE RUNG IS A PARAMETER, `drawEndsRead`'s…
 *  → docs/notes/life-beats/hub.md#drawlistenheard--the-coin--did-the-parent-read-her-plainly-this-beat
 */
export function drawListenHeard(seed: string, kind: LifeBeatKind, week: number, rung: 0 | 1 | 2): boolean {
  return rngFromSeed(`${seed}:psy:listen:${kind}:${week}`)() < ECONOMY.psychologist.listenClarity[rung]
}

/** ⭐⭐ THE SEAT'S ANSWER FOR THIS WEEK'S RAISE, or `null` when nobody is teaching him to listen.
 *
 *  ⚠⚠ listenHeardNow: A `null` HERE IS **ZERO DRAWS**, not a discarded one – `arrivalEligible`'s own law…
 *  ⚠⚠ listenHeardNow: IT ASKS THE BILLING PREDICATE THROUGH THAT HELPER, which is ruling J
 *  ⚠ listenHeardNow: AND IT IMPORTS THE SEAT DIRECTLY, the masseur's own way (`world/medical.ts`)…
 *  ⚠ listenHeardNow: EXPORTED 28.09 BY T6.10: `world/lifeBeat/ended.ts`
 *  → docs/notes/life-beats/hub.md#listenheardnow--the-seats-answer-for-this-weeks-raise-or-null
 */
export function listenHeardNow(world: WorldState, kind: LifeBeatKind): boolean | null {
  const rung = psychologistWorkingRung(world, 'listen')
  if (rung === undefined) return null
  return drawListenHeard(world.seed, kind, world.week, rung)
}

/** ⭐ WHOSE READING THIS IS – the two facts a legible frame cannot be assembled without.
 *
 *  ⚠⚠ HeardRead: ONE PARAMETER RATHER THAN THREE DEFAULTED ONES, AND THAT IS THE COMPLETENESS LAW PAYING FOR ITSELF.
 *  → docs/notes/life-beats/hub.md#heardread--whose-reading-this-is
 */
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
 *  ⚠ MET_HEADING_HEARD: THE STANDING HEADING CARRIES NO READ AT ALL
 *  ⚠ MET_HEADING_HEARD: NO BOND COLUMN, DELIBERATELY, and the standing pool's own argument is the reason.
 *  → docs/notes/life-beats/hub.md#met_heading_heard--met-read-plainly-by-voice-by-what-she-asked-for
 */
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
 *  ⚠⚠ ENDED_HEADING_HEARD: THE STANDING HEADING ALREADY NAMES THE READ
 *  ⚠ ENDED_HEADING_HEARD: THE TAIL OF EVERY CELL IS THE STANDING POOL'S OWN WORDING OF THE READ, kept deliberately
 *  ⚠ ENDED_HEADING_HEARD: AND NOT ONE OF THE SIXTEEN CLAIMS SHE SPOKE THIS WEEK
 *  → docs/notes/life-beats/hub.md#ended_heading_heard--ended-read-plainly-by-voice-by-register
 */
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

/** ⭐ THE FRAME, ONE FUNCTION, so «which heading does a card wear» has exactly one spelling and
 *  the ambiguous arm can be proven byte-identical to what shipped. `null` is the standing
 *  frame.
 *
 *  ⚠ metHeadingFor: THE DEFAULT IS `false`, WHICH IS THE SHIPPED READING AND NOT A NEUTRAL STAND-IN
 *  → docs/notes/life-beats/hub.md#metheadingfor--the-frame-one-function
 */
function metHeadingFor(band: BondBand, heard: HeardRead | null, fromHeadline = false): string {
  if (heard !== null) return MET_HEADING_HEARD[heard.voice][heard.wants]
  return fromHeadline ? MET_HEADING_HEADLINE : MET_HEADING[metRegisterOf(band)]
}

function endedHeadingFor(endsRegister: EndsRegister, read: EndsRead, heard: HeardRead | null): string {
  return heard === null
    ? ENDED_HEADING[endsRegister][read]
    : ENDED_HEADING_HEARD[heard.voice][endsRegister][read]
}

// 3g. `'engaged'` – THE COPY MOVED TO `world/lifeBeat/weddingCopy.ts` (A-06 / T6.8, 28.09) – A
// pure leaf: §3g referenced nothing and only the dispatcher hub below read it, so it left…
//
// ⚠ §11, the wedding's HAZARD half, is still in this file: it calls back into the hub and its names reach `world.ts` through the hub's…
// → docs/notes/life-beats/hub.md#lifebeatts-3g--engaged--the-copy-moved
import { ENGAGED_DRY, ENGAGED_HEADING, ENGAGED_HER_LINE, engagedWithTogether } from './lifeBeat/weddingCopy'

// 3h. `'spouse-view'` – THE COPY MOVED TO `world/lifeBeat/spouseViewCopy.ts` (A-06 / T6.8,
// 28.09) – A pure leaf: only the dispatcher hub below read it, so it left whole and the hub
// imports the three strings back.
//
// ⚠⚠ hub: §12, the opinion SURFACE, stays here for a stronger reason than the other hazards…
// → docs/notes/life-beats/hub.md#lifebeatts-3h--spouse-view--the-copy-moved
import { SPOUSE_VIEW_CARD, SPOUSE_VIEW_HEADING, SPOUSE_VIEW_SAID } from './lifeBeat/spouseViewCopy'

// 3i. `'own-key'` – THE COPY MOVED TO `world/lifeBeat/ownKeyCopy.ts` (A-06 / T6.8, 28.09) – A
// pure leaf – it referenced nothing at all – so it left whole, banner and chronicles included…
//
// ⚠ §13 itself is still in this file: it calls back into the hub and its names reach `world.ts` through the hub's re-export…
// → docs/notes/life-beats/hub.md#lifebeatts-3i--own-key--the-copy-moved
import { OWN_KEY_CARD, OWN_KEY_HEADING, OWN_KEY_SAID } from './lifeBeat/ownKeyCopy'

// 3j. `'expecting'` – THE COPY MOVED TO `world/lifeBeat/pregnancyCopy.ts` (A-06 / T6.8,
// 28.09)…
//
// ⚠ §14, the pregnancy's HAZARD half, is still in this file: it calls back into the hub and its names reach `world.ts` through the hub's…
// → docs/notes/life-beats/hub.md#lifebeatts-3j--expecting--the-copy-moved
import { EXPECTING_DRY, EXPECTING_HEADING, EXPECTING_HER_LINE } from './lifeBeat/pregnancyCopy'

// 3l. `'bereavement'` – THE COPY MOVED TO `world/lifeBeat/bereavementCopy.ts` (A-06 / T6.8,
// 28.09) – A pure leaf: only the dispatcher hub below read it, so it left whole – banner and…
//
// ⚠ §16, the death's HAZARD half, is still in this file, with its `life:loss` draw…
// → docs/notes/life-beats/hub.md#lifebeatts-3l--bereavement--the-copy-moved
import { BEREAVEMENT_DRY, BEREAVEMENT_HEADING, BEREAVEMENT_HER_LINE } from './lifeBeat/bereavementCopy'

// 3m. `'divorced'` – THE COPY MOVED TO `world/lifeBeat/divorcedCopy.ts` (A-06 / T6.8, 28.09) –
// A pure leaf: its readers are the dispatcher below and §8's latched branch, which writes
// `divorcedKeptRow()` into the feed. It left whole, banner and chronicles included, and the
// hub imports the four it reads back.
// → docs/notes/life-beats/hub.md#lifebeatts-3m--divorced--the-copy-moved
import { DIVORCED_DRY, DIVORCED_HEADING, DIVORCED_HER_LINE } from './lifeBeat/divorcedCopy'

// 3k. `'return-plan'` – THE WEEK SHE IS BACK, AND THE QUESTION IS HOW (the return, wave 8:
// T6). ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's
// table). – ⭐⭐⭐ THIS ONE IS THE PARENT'S, AND THAT IS §4a READ EXACTLY RATHER THAN BENT.
//
// ⚠ hub: BOTH ANSWERS ARE PRICED AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT.
// ⚠⚠ hub: (b) THE PRICE OF THIS ANSWER IS PAID IN TENNIS AND MUST NOT ALSO BE PAID IN BOND…
// ⚠ hub: NO DATE AND NO NUMBER IN EITHER LABEL (rule 4), and neither of them names the freeze…
// → docs/notes/life-beats/hub.md#lifebeatts-3k--return-plan--the-week-she-is-back

/** ⚠ ⚠ DRAFT – the card's one line: what the week holds, seen from the family's side. */
const RETURN_PLAN_SAID =
  'She is entered again from this week. The desk wants to know what the first months look like – the small draws she can win, or the big ones she can still get into.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `OWN_KEY_HEADING`'s
 *  shape and its reason: the question is the same question at every distance and in every weather. */
const RETURN_PLAN_HEADING = 'She is back, and the first months have to be built'

/** ⭐⭐⭐ THE ANSWER'S OTHER CONSEQUENCE: which booking preference each id records,
 *  `EXPECTING_SUPPORT`'s own shape one section up and its own law…
 *
 *  ⚠ RETURN_PLAN_CHOICE: THE PLAN IS THE ANSWER'S OWN NAME AND THERE IS NOTHING TUNABLE HERE.
 *  ⚠ RETURN_PLAN_CHOICE: TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-return-ramp.test.ts` is what says…
 *  → docs/notes/life-beats/hub.md#return_plan_choice--the-answers-other-consequence--which-booking-preference-each-id-records
 */
const RETURN_PLAN_CHOICE: Readonly<Record<string, NonNullable<ComebackState['returnPlan']>>> = {
  'small-first': 'small-first',
  'straight-back': 'straight-back',
}

/** One answer on a life-beat card: the id the command carries, the sentence the button shows,
 *  and what saying it costs.
 *
 *  ⚠ LifeBeatAnswer: NAMED IN v74 T7 so `lifeBeatOptionsFor`'s signature can say what it hands back…
 *  ⚠⚠ `LifeBeatAnswer` AND NOT `LifeBeatOption`, WHICH IS TAKEN AND IS A DIFFERENT THING.
 *  → docs/notes/life-beats/hub.md#lifebeatanswer--one-answer-on-a-life-beat-card
 */
export interface LifeBeatAnswer {
  id: string
  label: string
  bond: number
}

/** ⭐⭐ WHAT THE PARENT MAY SAY BACK, PER BEAT KIND – and not one option in either list is HER
 *  choice.
 *
 *  ⚠⚠ LIFE_BEAT_OPTIONS: THIS IS THE TABLE AS AN **`open`** GIRL PRICES IT (v74 T7).
 *  ⚠⚠ LIFE_BEAT_OPTIONS: RESTRUCTURED FROM A FLAT LIST IN v74 (wave 3, T6), and the reason is the type rather than tidiness…
 *  ⚠ LIFE_BEAT_OPTIONS: NO NUMBER, NO PRICE, NO METER in any label
 *  ⚠ LIFE_BEAT_OPTIONS: THE `'met'` LABELS NAME NO GENDER, and that is the schema being obeyed rather than a style choice…
 *  → docs/notes/life-beats/hub.md#life_beat_options--what-the-parent-may-say-back-per-beat-kind
 */
/** ⚠ ONE HOME for the sentence the `ended` (v75) and `divorced` (v88) pools deliberately share –
 *  the two lists sit on the same axis and part at the THIRD label, their own doc's claim. S7
 *  (30.09) measured the cost of two copies: a drift in one stayed green under every pin. */
const GIVE_HER_ROOM = 'Give her room, and say we are here'

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
   *  replies move nothing»). §5b asks for «2–3 reply options»; these are three parent moves that…
   *
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE ZERO IS WRITTEN OUT AND NOT SOURCED TO `ECONOMY.bond.delta`
   *  ⚠ LIFE_BEAT_OPTIONS: `tests/wave3-small-talk.test.ts` §C is the pin that goes red if one of them stops being zero.
   *  → docs/notes/life-beats/hub.md#life_beat_options--tier-1s-three-and-every-one-of-them-is-a-literal-zero
   */
  'small-talk': [
    { id: 'more', label: 'Ask her to say more', bond: 0 },
    { id: 'view', label: 'Tell her what we think', bond: 0 },
    { id: 'easy', label: 'Tell her it can keep', bond: 0 },
  ],
  /** ⭐⭐⭐ v74 T17 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE ZERO IS A RULING RATHER THAN A
   *  DEFAULT. «Counsel is information, not a test» – V2's own law read one tier up: the coach is
   *  not a person the parent can answer WRONGLY, and a priced reply would turn a phone call about
   *  his daughter into a thing to be played correctly.
   *
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND THE PAIR OF ZEROES IS ALSO A HARD REQUIREMENT, not just a design one
   *  ⚠ LIFE_BEAT_OPTIONS: NEITHER LABEL PROMISES AN OUTCOME.
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND NO PRONOUN FOR THE COACH, IN THESE LABELS OR IN THE FEED ROWS BELOW
   *  → docs/notes/life-beats/hub.md#life_beat_options--v74-t17--two-acknowledgments-both-priced-zero
   */
  'fork-counsel': [
    { id: 'heard', label: 'Thank the coach for saying it plainly', bond: 0 },
    { id: 'weigh', label: 'Say we will sit with it', bond: 0 },
  ],
  /** ⭐⭐⭐ v76 T8 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE PAIR ABOVE'S RULING REPEATED
   *  RATHER THAN RE-ARGUED: «counsel is information, not a test». The psychologist is not a
   *  person the parent can answer wrongly either, and a priced reply would make a second phone
   *  call about his daughter into a thing to be played correctly. No third option and no `listen`
   *  detour.
   *
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND THE ZEROES ARE WHAT KEEP HIS READ A WORDING REGISTER.
   *  ⚠ LIFE_BEAT_OPTIONS: NEITHER LABEL PROMISES AN OUTCOME
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND NO PRONOUN FOR THE PSYCHOLOGIST, here or in the feed rows below.
   *  → docs/notes/life-beats/hub.md#life_beat_options--v76-t8--two-acknowledgments-both-priced-zero
   */
  'fork-psy': [
    { id: 'straight', label: 'Thank the psychologist for the straight read', bond: 0 },
    { id: 'keep', label: 'Say we will keep it in mind when we answer', bond: 0 },
  ],
  /** ⭐⭐⭐ v75 T4 – THE FOUR THE ENDING OFFERS (build plan §5's shape, ruling G's prices). ⚠ THIS
   *  IS THE LIST AS A GIRL WHO WANTS **SPACE** PRICES IT, which is `LIFE_BEAT_OPTIONS`' own
   *  doctrine applied to the second read in this file: the base column here is `'space'` exactly
   *  as it is `'open'` for `'met'`, and `ENDED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor`
   *  is the only road to the priced set either way.
   *
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE FIRST KIND WITH NO FREE ANSWER, and that is the whole of the 12.09 drain amendment's reason for existing…
   *  ⚠ LIFE_BEAT_OPTIONS: THE LABELS NAME NO GENDER AND NO PERSON, the schema being obeyed rather than a style choice…
   *  ⚠ LIFE_BEAT_OPTIONS: AND NO NUMBER, NO PRICE, NO METER in any of them (the fence) – and, per ruling G…
   *  → docs/notes/life-beats/hub.md#life_beat_options--v75-t4--the-four-the-ending-offers
   */
  ended: [
    { id: 'space', label: GIVE_HER_ROOM, bond: ECONOMY.bond.delta.endedMatched },
    { id: 'company', label: 'Keep her company, and stay close this week', bond: ECONOMY.bond.delta.endedMismatched },
    { id: 'fix-it', label: 'Offer to help put it right', bond: ECONOMY.bond.delta.endedFixIt },
    { id: 'blame', label: 'Say they were never worth it', bond: ECONOMY.bond.delta.endedBlame },
  ],
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE FOUR THE MARRIAGE'S ENDING OFFERS (spec §4's
   *  shape: give her room / stay close / offer to help sort it / dismiss him). ⚠ THIS IS THE LIST
   *  AS A GIRL WHO WANTS **SPACE** PRICES IT, `'ended'`'s own doctrine at the same axis: the base
   *  column is `'space'` and `DIVORCED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor` is the
   *  only road to the priced set either way.
   *
   *  ⚠ LIFE_BEAT_OPTIONS: ⚠ DRAFT – every label below is the builder's draft for the owner's pass…
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE FOURTH KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-INDEPENDENT BY CONSTRUCTION rather…
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND THE THIRD LABEL IS WHERE THIS POOL PARTS FROM THE ENDING'S, WHICH IS THE ONE WORDING DECISION IN IT.
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE FOURTH SAYS «THEM» AND NOT «HIM», AND THE FIRST DRAFT GOT THAT WRONG.
   *  ⚠ LIFE_BEAT_OPTIONS: The NAME is refused too, for a different reason: the schema has carried one since v83…
   *  ⚠ LIFE_BEAT_OPTIONS: AND NO NUMBER, NO PRICE, NO METER in any of them, and the LABELS ARE UNTOUCHED BY THE FLIP
   *  → docs/notes/life-beats/hub.md#life_beat_options--v88-the-parting-wave-12--t1t2--the-four-the-marriages-ending-offers
   */
  divorced: [
    // ⚠ DRAFT
    { id: 'space', label: GIVE_HER_ROOM, bond: ECONOMY.divorce.matched },
    // ⚠ HIS REVIEW APPLIED 23.09 – the tautology («keep her company, and stay close») collapsed to
    // the half that says something, and the closeness now names its own restraint.
    { id: 'company', label: 'Stay close, without asking for the whole story', bond: ECONOMY.divorce.mismatched },
    // ⚠ HIS REVIEW APPLIED 23.09 – «the practical side» read corporate; «whatever needs sorting»
    // is the same offer in the register a kitchen uses.
    { id: 'sort', label: 'Offer to help with whatever needs sorting', bond: ECONOMY.divorce.sortItOut },
    // ⚠ DRAFT
    { id: 'dismiss', label: 'Say she is better off without them', bond: ECONOMY.divorce.dismiss },
  ],
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE THREE THE ANNOUNCEMENT OFFERS: the research
   *  digest's own triple, bless / keep distance / oppose, priced in `ECONOMY.wedding` (drafted
   *  +2.5 / −1 / −4, benched in T8, his word after the numbers).
   *
   *  ⚠ LIFE_BEAT_OPTIONS: ⚠ DRAFT – every label below is the builder's draft for the owner's pass…
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE SECOND KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-independent BY CONSTRUCTION rather…
   *  ⚠ LIFE_BEAT_OPTIONS: THE LABELS NAME NO GENDER
   *  → docs/notes/life-beats/hub.md#life_beat_options--v83-the-wedding-wave-7--t2--the-three
   */
  engaged: [
    // ⚠ DRAFT
    { id: 'bless', label: 'Give them our blessing', bond: ECONOMY.wedding.blessBond },
    // ⚠ DRAFT
    { id: 'distance', label: 'Say it is her decision, and step back', bond: ECONOMY.wedding.distanceBond },
    // ⚠ DRAFT
    { id: 'oppose', label: 'Tell her we think it is a mistake', bond: ECONOMY.wedding.opposeBond },
  ],
  /** ⭐⭐ v83 (wave 7 – T5) – THE THREE THE SPOUSE'S WORD OFFERS, and they are ONE set for all four
   *  occasions, which is tier 1's own precedent quoted at its table above: «three parent moves
   *  that fit a worry, a joy or a question alike, because the answer set is keyed on the KIND and
   *  her subject is a fact on the row». The occasion is the row's `detail`; the parent's three
   *  moves – hear it out, hold the season's line, wave it off – fit each of the four.
   *
   *  ⚠ LIFE_BEAT_OPTIONS: Per-occasion WORDS, if the owner wants them, are one label overlay away…
   *  ⚠ LIFE_BEAT_OPTIONS: ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4).
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE THIRD KIND WITH NO FREE ANSWER, priced SMALL by design (the brief's ±0.5..±1.5)…
   *  ⚠ LIFE_BEAT_OPTIONS: THE LABELS NAME NO GENDER (the §3h banner's law), NO NUMBER, NO PRICE AND NO METER (the fence).
   *  → docs/notes/life-beats/hub.md#life_beat_options--v83-wave-7--t5--the-three-the-spouses-word
   */
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
   *  RESEARCH's own finding made mechanical rather than a triple somebody liked the sound of.
   *
   *  ⚠ LIFE_BEAT_OPTIONS: ⚠ DRAFT – every label below is the builder's draft for the owner's pass…
   *  ⚠⚠ LIFE_BEAT_OPTIONS: THE THIRD KIND WITH NO FREE ANSWER, after `'ended'` and `'engaged'`, and deliberately…
   *  ⚠ LIFE_BEAT_OPTIONS: NONE OF THEM STOPS ANYTHING, and that is stronger here than at the wedding.
   *  ⚠ LIFE_BEAT_OPTIONS: THE LABELS NAME NO GENDER (hers, his, or the child's – §3j's two laws), NO NUMBER…
   *  → docs/notes/life-beats/hub.md#life_beat_options--v85-the-pregnancy-wave-8--t2--the-three
   */
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
    // §5 asking for it: «the third answer's words are today the career-first one, and they should
    // be allowed to be *reasonable* – «not now, look where you are» is a position, not a villain's
    // line». The words he gave the case are the ones a real parent uses: «рано, у тебя карьера в
    // апогее».
    //
    // ⚠⚠ LIFE_BEAT_OPTIONS: THE GRADE DID NOT MOVE AND MUST…
    // ⚠ LIFE_BEAT_OPTIONS: THE OLD LABEL WAS «Ask her what this does to the tennis» and is quoted verbatim in the wave's report beside…
    // ⚠ LIFE_BEAT_OPTIONS: DRAFT, like the row above it.
    // → docs/notes/life-beats/hub.md#life_beat_options--v87-t3--the-reasonable-position-not-a-villains-line
    { id: 'career-first', label: 'Say it is too early – look where she is', bond: ECONOMY.motherhood.careerFirstBond },
  ],
  /** ⭐⭐⭐ v85 (the return, wave 8 – T6) – THE RAMP'S TWO, AND THE ONLY CARD IN THIS TABLE THAT IS
   *  A SCHEDULING DECISION RATHER THAN A REACTION (§3k's banner carries the §4a argument in full:
   *  she has already decided to go back; what a season is built out of is the parent's job, on
   *  the college fork's own precedent).
   *
   *  ⚠⚠ LIFE_BEAT_OPTIONS: BOTH AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT
   *  ⚠ LIFE_BEAT_OPTIONS: NO NUMBER, NO DATE AND NO PROMISE IN EITHER LABEL
   *  ⚠⚠ LIFE_BEAT_OPTIONS: ONE ANSWER, BECAUSE THE SPEC DRAFTS NO PRICES AND INVENTING THREE WOULD BE A DESIGN DECISION WEARING A CONSTANT.
   *  ⚠⚠ LIFE_BEAT_OPTIONS: AND 0 BECAUSE §4a's LAW SAYS HIS WORDS MOVE `bond` AND THIS IS NOT A WORD TO HER, IT IS AN UNDERTAKING.
   *  ⚠ LIFE_BEAT_OPTIONS: IT NAMES NO RELATIVE (RULED 22.09, question 4)…
   *  ⚠ LIFE_BEAT_OPTIONS: DRAFT.
   *  → docs/notes/life-beats/hub.md#life_beat_options--v85-the-return-wave-8--t6--the-ramps-two
   */
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
 *  `wants` is `'private'` reads silence as the kindness and warmth as the thing that puts it in
 *  the room; the other two answers are the same act whatever she asked for, so they are ABSENT
 *  here.
 *
 *  ⚠⚠ MET_BOND_PRIVATE: THE ABSENCE IS THE LOAD-BEARING HALF AND IT IS WHY THIS IS AN OVERLAY.
 *  ⚠ MET_BOND_PRIVATE: AND NOTHING PRINTS EITHER NUMBER
 *  → docs/notes/life-beats/hub.md#met_bond_private--v74-t7--the-wants-flip-as-an-overlay-and-never-as-a-second-table
 */
const MET_BOND_PRIVATE: Readonly<Record<string, number | undefined>> = {
  warm: ECONOMY.bond.delta.metWarmPrivate,
  silent: ECONOMY.bond.delta.metSilentPrivate,
}

/** ⭐⭐⭐ v75 T4 – THE ENDING'S FLIP, AND IT IS `MET_BOND_PRIVATE`'s SHAPE DELIBERATELY, DOWN TO
 *  THE ARGUMENT FOR THE ABSENCES. A girl whose drawn read is `'company'` wants her parent near
 *  her; the base list is the other read, so the only two rows that move are the two the read is
 *  ABOUT.
 *
 *  ⚠⚠ ENDED_BOND_COMPANY: THE ABSENCE OF `fix-it` AND `blame` IS THE LOAD-BEARING HALF, exactly as `wary`'s and `meet`'s is one table up.
 *  ⚠ ENDED_BOND_COMPANY: AND NOTHING PRINTS EITHER NUMBER
 *  → docs/notes/life-beats/hub.md#ended_bond_company--v75-t4--the-endings-flip
 */
const ENDED_BOND_COMPANY: Readonly<Record<string, number | undefined>> = {
  space: ECONOMY.bond.delta.endedMismatched,
  company: ECONOMY.bond.delta.endedMatched,
}

/** ⭐⭐ v88 (the parting, wave 12) – THE SAME FLIP ONE RUNG UP, and it is a SECOND RECORD rather…
 *
 *  ⚠ DIVORCED_BOND_COMPANY: `sort` AND `dismiss` ARE ABSENT ON PURPOSE
 *  → docs/notes/life-beats/hub.md#divorced_bond_company--v88-the-parting-wave-12--the-same-flip-one-rung-up
 */
const DIVORCED_BOND_COMPANY: Readonly<Record<string, number | undefined>> = {
  space: ECONOMY.divorce.mismatched,
  company: ECONOMY.divorce.matched,
}

/** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – WHAT EACH ANSWER IS WORTH **MONTHS LATER**: the
 *  parent's word at the `'expecting'` card, graded onto `world.pregnancy.support` by
 *  `answerLifeBeat`.
 *
 *  ⚠⚠ EXPECTING_SUPPORT: IT IS A SECOND CONSEQUENCE AND NOT A SECOND METER
 *  ⚠ EXPECTING_SUPPORT: THE GRADE IS THE ANSWER'S OWN NAME AND NOT ITS SIGN.
 *  ⚠ EXPECTING_SUPPORT: TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-pregnancy.test.ts` §D is what says…
 *  → docs/notes/life-beats/hub.md#expecting_support--v85-the-pregnancy-wave-8--t2--what-each-answer-is-worth-months-later
 */
const EXPECTING_SUPPORT: Readonly<Record<string, NonNullable<PregnancyState['support']>>> = {
  joy: 'warm',
  worry: 'measured',
  'career-first': 'cold',
}

/** ⭐⭐⭐ v74 T7 – THE ANSWER SET **AS THIS GIRL PRICES IT**, and the one road to it. Every reader
 *  of a beat's answers goes through here: `buildLifeBeatPrompt` to render the card,
 *  `answerLifeBeat` to charge it, `pendingLifeBeatOptions` for everything outside the engine.
 *  Two readings of one price list is exactly the disagreement rule 3 exists to prevent, so
 *  there is one function.
 *
 *  ⚠ lifeBeatOptionsFor: `'fork-opinion'` IGNORES `wants` ENTIRELY
 *  ⚠ lifeBeatOptionsFor: THE LABELS ARE UNTOUCHED BY THE FLIP
 *  ⚠ lifeBeatOptionsFor: IT DEFAULTS TO `'space'` FOR `wants`' OWN REASON
 *  ⚠⚠ lifeBeatOptionsFor: THE TWO AXES ARE INDEPENDENT AND EACH REACHES ONE KIND.
 *  → docs/notes/life-beats/hub.md#lifebeatoptionsfor--v74-t7--the-answer-set-as-this-girl-prices-it
 */
export function lifeBeatOptionsFor(
  kind: LifeBeatKind,
  wants: LoveEpisode['wants'],
  read: EndsRead = 'space',
  // ⭐⭐⭐ ROUND 42 #15 – THE FOURTH IS A **LABEL** OVERLAY, AND IT IS THE THIRD'S OWN SHAPE
  // POINTED AT THE OTHER HALF OF AN ANSWER.
  //
  // ⚠⚠ lifeBeatOptionsFor: IT EXISTS FOR §8d.1 AND FOR NOTHING ELSE
  // ⚠ lifeBeatOptionsFor: UNDEFINED IS THE BASE TABLE, which is the shipped reading and not a neutral stand-in…
  // ⚠ lifeBeatOptionsFor: AND AN ID THE OVERLAY DOES NOT NAME KEEPS ITS OWN LABEL, the price overlay's own `undefined` rule.
  // → docs/notes/life-beats/hub.md#lifebeatoptionsfor--round-42-15--the-fourth-is-a-label-overlay
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

/** The feed line each answer writes, per kind. ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF
 *  IT (rule 4). ⚠ Keyed by kind for `LIFE_BEAT_OPTIONS`' own reason: two beats can share an
 *  option id no more than they share an answer set.
 *
 *  ⚠ ANSWER_EVENT: THE RECORD STAYS **TOTAL** ON PURPOSE.
 *  → docs/notes/life-beats/hub.md#answer_event--the-feed-line-each-answer-writes-per-kind
 */
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
  // ⭐⭐⭐ v76 T8 – AND HIS CALL WRITES ONE TOO, for `'fork-counsel'`'s reason exactly: this fires
  // at most once in a career, on the biggest week of it, and a stop the seat had a view about
  // and a stop it was never asked about are two different biographies that only the row can tell
  // apart later.
  //
  // ⚠ ANSWER_EVENT: IT IS AN `'info'` ROW AND CARRIES NO `lifeKind`, WHICH IS NOT A CHOICE THIS POOL MAKES
  // ⚠ ANSWER_EVENT: NO `amountCents` AND NO PRICE IN EITHER LINE
  // ⚠ ANSWER_EVENT: AND NEITHER NAMES THE SHOCK.
  // → docs/notes/life-beats/hub.md#answer_event--v76-t8--and-his-call-writes-one-too
  'fork-psy': {
    straight: 'Her psychologist called about her wanting to stop. We said thank you for the straight read.',
    keep: 'Her psychologist called about her wanting to stop. We said we would keep it in mind.',
  },
  /** ⭐⭐⭐ v75 T4 – AND THE ENDING WRITES ONE, for `'fork-counsel'`'s reason rather than tier 1's:
   *  a break-up the parent met well and one he met badly are two different biographies, and only
   *  the row can tell them apart seasons later when the feed is what the career is read back
   *  through.
   *
   *  ⚠ ANSWER_EVENT: FOUR LINES, ONE PER ANSWER, AND NO READ AXIS.
   *  ⚠ ANSWER_EVENT: T6 owns the full matrix and may split it.
   *  ⚠ ANSWER_EVENT: NO `amountCents` AND NO PRICE IN ANY WORD
   *  ⚠ ANSWER_EVENT: IT IS KEPT BECAUSE THE SHIPPED `met` FOUR DO EXACTLY THE SAME THING
   *  ⚠ ANSWER_EVENT: AND THERE IS STILL NO READ AXIS HERE, which T6 re-confirmed against a contradiction rather than inheriting.
   *  → docs/notes/life-beats/hub.md#answer_event--v75-t4--and-the-ending-writes-one
   */
  ended: {
    space: 'Her relationship ended. We gave her room, and said we were there.',
    company: 'Her relationship ended. We kept her company through the week.',
    'fix-it': 'Her relationship ended. We offered to help put it right.',
    blame: 'Her relationship ended. We said they were never worth it.',
  },
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – AND THE MARRIAGE'S ENDING WRITES ONE, for…
   *
   *  ⚠ ANSWER_EVENT: ⚠ DRAFT – every line below is the builder's draft (invariant 4, T8's table).
   *  ⚠ ANSWER_EVENT: NO `amountCents` AND NO PRICE IN ANY WORD (rule 4)
   *  ⚠ ANSWER_EVENT: AND NO NAME – the episode has carried one since v83 and which surfaces speak it is the owner's question…
   *  ⚠ ANSWER_EVENT: AND NO GENDER EITHER – «them», not «him», which the R15-7 sweep caught this pool getting wrong on its first draft…
   *  → docs/notes/life-beats/hub.md#answer_event--v88-the-parting-wave-12--t1t2
   */
  divorced: {
    space: 'Her marriage ended. We gave her room, and said we were there.',
    // ⚠ HIS REVIEW APPLIED 23.09 on the middle pair – «that week» over «through the week», and the
    // sorting row drops the corporate «practical side» its label dropped.
    company: 'Her marriage ended. We kept her company that week.',
    sort: 'Her marriage ended. We offered to help with what needed sorting.',
    dismiss: 'Her marriage ended. We said she was better off without them.',
  },
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'ended'`'s
   *  reason…
   *  ⚠ ANSWER_EVENT: ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T7's table).
   *  ⚠ ANSWER_EVENT: NO `amountCents` AND NO PRICE IN ANY WORD (rule 4)
   *  → docs/notes/life-beats/hub.md#answer_event--v83-the-wedding-wave-7--t2
   */
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
  /** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'engaged'`'s…
   *
   *  ⚠ ANSWER_EVENT: ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T8's table).
   *  ⚠ ANSWER_EVENT: NO `amountCents` AND NO PRICE IN ANY WORD (rule 4)
   *  ⚠ ANSWER_EVENT: NO NAME, NO GENDER AND NO DUE DATE, §3j's laws.
   *  ⚠ ANSWER_EVENT: ⠀DRAFT.
   *  ⚠ ANSWER_EVENT: IT NAMES NOBODY (RULED 22.09, question 4), no date and no number, and it says what the parent DID rather than what…
   *  → docs/notes/life-beats/hub.md#answer_event--v85-the-pregnancy-wave-8--t2
   */
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
 *  probe worlds that predate it – the same shape `accrueSpirit` uses.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 for `world/lifeBeat/ended.ts` and `world/lifeBeat/smallTalk.ts`. The
 *  defensive `??` is the reason it must be shared rather than copied: a kind module spelling
 *  `world.temperament` raw would read `null` on every probe world built before v72. Not on the barrel. */
export function voiceOf(world: WorldState): Temperament {
  return world.temperament ?? temperamentFor(world.seed)
}

/** ⭐⭐ WHERE SHE IS LIVING THIS WEEK, for the WORDING alone – the presence law's one input, read
 *  off the world through the diary's own single derivation (`diaryLifeStageFor`) so a life beat
 *  and the week note under the same painting can never disagree about which stage she is in.
 *
 *  ⚠ lifeStageOf: THE `inCollege` TEST IS STRUCTURAL RATHER THAN THE FUNCTION
 *  ⚠ lifeStageOf: It is NOT a second reading of the STAGE, which is the fact that matters…
 *  ⚠ lifeStageOf: EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts` (and `…/ownKey.ts` when §13 can move).
 *  → docs/notes/life-beats/hub.md#lifestageof--where-she-is-living-this-week-for-the-wording-alone
 */
export function lifeStageOf(world: WorldState): DiaryLifeStage {
  return lifeStageAt(world, world.week)
}

/** ⭐⭐⭐ ROUND 42 #15 – THE SAME READ, AT AN ARBITRARY WEEK, AND IT IS A CRASH FIX RATHER THAN A
 *  generalisation for its own sake.
 *
 *  ⚠⚠ lifeStageAt: THE BUG IT CLOSES, written down because it is subtle and it BRICKS A CAREER.
 *  ⚠ lifeStageAt: IT IS BEHAVIOUR-IDENTICAL FOR EVERY BLOCKING KIND
 *  ⚠ lifeStageAt: AND IT HAS ONE FEWER EXCEPTION SINCE 26.09 (B-P3-07, re-aimed on B-01's ruling 2(a))
 *  ⚠ lifeStageAt: `fromWeek` JOINS THE COLLEGE TEST HERE and does not change today's answer either…
 *  → docs/notes/life-beats/hub.md#lifestageat--round-42-15--the-same-read-at-an-arbitrary-week
 */
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

/** ⭐⭐ THE LINE SHE SAYS, ASSEMBLED. Exported so the completeness pin can walk kind x
 *  temperament x register x want without mounting a world – §5b's line item 3: «a test walking
 *  beatKind x temperament x register that FAILS on a missing variant, so a `quiet` girl can
 *  never silently receive a `fiery` girl's line as a fallback. (The flat pool is the one legal
 *  shared fallback, and only at strained/cold.)»
 *
 *  ⚠ lifeBeatSaid: IT TAKES THE STAGE AND NOT A `BeatPresence`
 *  ⚠ lifeBeatSaid: THE DEFAULT IS `undefined` AND IT IS THE PRE-v81 READING RATHER THAN A NEUTRAL STAND-IN
 *  → docs/notes/life-beats/hub.md#lifebeatsaid--the-line-she-says-assembled
 */
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
  spouseLine: number | undefined = undefined,
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
    // worry the line she would have said in a brighter week.
    //
    // ⚠ lifeBeatSaid: AND IT READS NO `bond`: the band decides whether this beat exists at all (0 at strained/cold) and never how…
    // ⚠ lifeBeatSaid: THE LEGACY BRANCH IS NOT DEAD CODE AND IS NOT ONLY FOR OLD SAVES
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v74-t8--the-third-kind
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
    // ⭐⭐⭐ v76 T8 – THE SIXTH KIND, AND IT READS ITS OWN `detail` EXACTLY AS THE COACH DOES.
    //
    // ⚠ lifeBeatSaid: BOTH ARE STAMPED AND NEITHER IS RE-DERIVED
    // ⚠ lifeBeatSaid: IT READS NO `voice`, NO `bond` AND NO `register`
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v76-t8--the-sixth-kind-and-it-reads-its-own-detail
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
      // column is owed – the same courtesy the line above pays a malformed detail. ⚠⚠ AND THIS IS A
      // GUARD FOR A FUTURE WAVE, NOT FOR T4.
      // → docs/notes/life-beats/hub.md#lifebeatsaid--v85-t1--a-register-may-exist-without-its-column
      const psyColumn = PSY_COUNSEL[psyRegister]
      if (psyColumn === null) {
        throw new Error(`A fork-psy register has no counsel column yet: ${psyRegister}`)
      }
      return psyColumn[psyRoot]
    }
    // ⭐⭐⭐ v75 T4 – THE FIFTH KIND.
    //
    // ⚠ lifeBeatSaid: IT READS NO `detail` AND NO `register`, for `'met'`'s own two reasons: its detail is an episode id…
    // ⚠⚠ lifeBeatSaid: AND IT READS NO `EndsRead`.
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v75-t4--the-fifth-kind
    case 'ended':
      return speaksInHerOwnVoice(bond)
        ? presenceLine(ENDED_HER_LINE[voice][endsRegister], presence)
        : ENDED_DRY[endsRegister]
    // ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE SEVENTH KIND.
    //
    // ⚠ lifeBeatSaid: IT READS NO `detail` AND NO `register`, for `'met'`'s own two reasons: its detail is an episode id…
    // ⚠ lifeBeatSaid: AND NO REGISTER AXIS OF ITS OWN, unlike `'ended'`
    // ⚠⚠ lifeBeatSaid: AND NO `presence` SINCE 26.09 (ruling 19 on B-08), which is `'divorced'`'s reading arriving here…
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v83-the-wedding-wave-7--t2--the-seventh-kind
    case 'engaged':
      return speaksInHerOwnVoice(bond)
        ? ENGAGED_HER_LINE[voice]
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
      // ⭐ ROUND 46 R3 – THE LINE IS THE ROW'S OWN, stamped at the raise beside the occasion and never re-drawn:
      // this runs on every snapshot, and a stream-derived pick would re-word a card already on screen the day
      // the pool grows. A row with no `line` (raised before the pools had one) reads as entry 0, which is what
      // it was told; an index the pool does not hold reads as 0 as well – a card never throws for a stale stamp.
      const pool = SPOUSE_VIEW_SAID[occasion]
      return pool[spouseLine ?? 0] ?? pool[0]
    }
    // ⭐ v83 (wave 7 – T10) – THE NINTH KIND, AND THE ONE-CELL POOL IS ARGUED AT ITS BANNER (§3i):
    // the card quotes nobody, so no voice, no bond, no register, no presence and no detail reach it.
    case 'own-key':
      return OWN_KEY_SAID
    // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – THE TENTH KIND, AND IT IS `'engaged'`'s READING LINE
    // FOR LINE, which is the point rather than a shortcut: the two are one scene at two moments.
    //
    // ⚠ lifeBeatSaid: IT READS NO `detail` AND NO `register`, for `'met'`'s own two reasons…
    // ⚠ lifeBeatSaid: AND NO REGISTER AXIS OF ITS OWN
    // ⚠⚠ lifeBeatSaid: AND IT READS NOTHING ABOUT THE MARRIAGE, WHICH IS THE DECOUPLING LAW ARRIVING AT THE WORDING (§14)
    // ⚠⚠ lifeBeatSaid: AND NO `presence` SINCE 26.09 (ruling 19 on B-08) – §3g's note, inherited…
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v85-the-pregnancy-wave-8--t2--the-tenth-kind
    case 'expecting':
      return speaksInHerOwnVoice(bond)
        ? EXPECTING_HER_LINE[voice]
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
    // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – THE TWELFTH KIND, AND IT IS `'expecting'`'s READING…
    // ⚠ lifeBeatSaid: IT READS NO `detail` (the detail is the week, a machine value) AND NO REGISTER…
    // ⚠⚠ lifeBeatSaid: AND OPENNESS REACHES IT THROUGH THE VOICE CELLS THEMSELVES rather than through a second axis
    // ⚠⚠ lifeBeatSaid: AND NO `presence` SINCE 26.09 (ruling 19 on B-08) – §3g's note, inherited…
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v87-the-weight-wave-11--t5--the-twelfth-kind
    case 'bereavement':
      return speaksInHerOwnVoice(bond)
        ? BEREAVEMENT_HER_LINE[voice]
        : BEREAVEMENT_DRY
    // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – THE THIRTEENTH KIND, AND IT IS `'ended'`'s READING…
    //
    // ⚠ lifeBeatSaid: IT READS NO `detail` (an episode id, a machine value) AND NO MOOD `register`…
    // ⚠⚠ lifeBeatSaid: AND IT READS NO `EndsRead` EITHER, which is `'ended'`'s §3e decision inherited whole…
    // → docs/notes/life-beats/hub.md#lifebeatsaid--v88-the-parting-wave-12--t1--the-thirteenth
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
  // byte for byte what shipped.
  //
  // ⚠ lifeBeatHeading: NO ARITY PIN COUNTS THIS FUNCTION'S PARAMETERS
  // ⚠ lifeBeatHeading: `'met'` IS THE ONLY KIND THAT LOOKS…
  // → docs/notes/life-beats/hub.md#lifebeatheading--v77-t6--the-seventh-is-the-overtake-and-false
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

/** ⭐⭐⭐ v85 T2½ (piece 2) – WHICH KINDS OFFER A LISTENING DETOUR, DECLARED PER KIND AND **TOTAL
 *  BY TYPE**. `LIFE_BEAT_BLOCKING`'s own shape and its own argument, applied at the one place
 *  in this file that was not following it…
 *
 *  ⚠⚠⚠ LISTEN_FOLLOW_UP: AND THE STAKE HERE IS HIGHER THAN THERE, WHICH IS WHY THE CHAIN THIS REPLACED WAS THE ONE PLACE A NEW KIND WENT…
 *  ⚠⚠ LISTEN_FOLLOW_UP: THE CHAIN'S LAST SENTENCE IS SUPERSEDED AND IS QUOTED RATHER THAN DELETED
 *  ⚠ LISTEN_FOLLOW_UP: `null` MEANS «NO DETOUR, AND HERE IS WHY» AND NEVER «NOT DECIDED YET»
 *  ⚠ LISTEN_FOLLOW_UP: BEHAVIOUR DID NOT MOVE BY ONE BYTE, and that is measured rather than asserted…
 *  → docs/notes/life-beats/hub.md#listen_follow_up--v85-t2-half-piece-2--which-kinds-offer-a-listening-detour
 */
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
  // ⚠⚠ `'small-talk'` RETURNS NULL HERE AND THAT IS NO LONGER THE WHOLE STORY – RE-AIMED BY
  // ROUND 42 #15, and the note is kept rather than deleted because a reader has to be able to
  // tell which half expired.
  //
  // owner (LISTEN_FOLLOW_UP, round 42 #15): «выбрал пункт, чтобы она сказала больше, а попап закрылся»
  // → docs/notes/life-beats/hub.md#listen_follow_up--small-talk-returns-null-here-and-that-is-no-longer-the-whole-story
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
  // BOUGHT FOR.
  //
  // ⚠ LISTEN_FOLLOW_UP: THE REASON IT IS `null` IS THE PLAINEST IN THIS RECORD, `'own-key'`'s word for word
  // → docs/notes/life-beats/hub.md#listen_follow_up--and-return-plan-has-none-v85-wave-8-t6
  'return-plan': null,
}

/** ⭐ HER CONTINUATION when the parent only listens – null exactly where the flat pool speaks,
 *  because a girl who answered in one word has nothing more to give a silence…
 *
 *  ⚠ lifeBeatListenFollowUp: THE DECISION PER KIND LIVES IN `LISTEN_FOLLOW_UP` ABOVE, TOTAL BY TYPE (v85 T2½ piece 2)
 *  → docs/notes/life-beats/hub.md#lifebeatlistenfollowup--her-continuation-when-the-parent-only-listens--null
 */
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
 *  чтобы она сказала больше, а попап закрылся… Сейчас выглядит как "сказала А, но никогда не
 *  сказала Б"». That is exactly what tier 1 did: all three replies were bond-0 no-ops,
 *  `ANSWER_EVENT` wrote nothing, and the card closed on the press.
 *
 *  ⚠⚠ lifeBeatFollowUps: IT IS THE `listen` DETOUR GENERALISED AND NOT A SECOND MECHANISM.
 *  ⚠ lifeBeatFollowUps: EVERY OTHER KIND RETURNS AN EMPTY LIST, and each one has its own reason written out on `lifeBeatListenFollowUp`.
 *  ⚠ lifeBeatFollowUps: THE `done` LABELS ARE THE ENGINE'S TWO SHIPPED WORDS AND NOT NEW COPY (invariant 4)
 *  ⚠ lifeBeatFollowUps: PURE AND ZERO-DRAW, exactly like the two pool readers above it.
 *  → docs/notes/life-beats/hub.md#lifebeatfollowups--round-42-15--what-she-says-back-to-each-answer
 */
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

/** ⭐⭐ v74 T7 – WHAT SHE ASKED FOR, FOR THE ROW IN HAND.
 *
 *  ⚠ beatWants: `'open'` IS THE ANSWER FOR EVERY OTHER KIND, AND IT IS THE BASE READING RATHER THAN A NEUTRAL STAND-IN
 *  ⚠ beatWants: AND `'open'` AGAIN WHEN THE EPISODE IS GONE.
 *  → docs/notes/life-beats/hub.md#beatwants--v74-t7--what-she-asked-for-for-the-row-in-hand
 */
function beatWants(world: WorldState, row: LifeBeatRecord): LoveEpisode['wants'] {
  if (row.kind !== 'met') return 'open'
  return loveEpisodesOf(world).find((episode) => episode.id === row.detail)?.wants ?? 'open'
}

/** ⭐⭐⭐ v77 T6 – DID THE PARENT LEARN IT FROM A HEADLINE? `beatWants`' own shape, asking the
 *  row's episode a second question, and it is DERIVED rather than stamped for
 *  `beatEndsRegister`'s stated reason: both dates are on the row for the life of the career, so
 *  the answer this gives on the raise week is the answer it gives twenty seasons later and the
 *  album can re-word an old card.
 *
 *  ⚠⚠ beatFromHeadline: THE DISCRIMINATOR IS `publicWeek === knownWeek`, AND IT IS THE OVERTAKE'S OWN SIGNATURE.
 *  ⚠ beatFromHeadline: ANY OTHER KIND IS `false`, which is the standing frame and not a neutral stand-in – `beatWants`' own idiom…
 *  → docs/notes/life-beats/hub.md#beatfromheadline--v77-t6--did-the-parent-learn-it-from-a-headline
 */
function beatFromHeadline(world: WorldState, row: LifeBeatRecord): boolean {
  if (row.kind !== 'met') return false
  const episode = loveEpisodesOf(world).find((ep) => ep.id === row.detail)
  return episode !== undefined && episode.publicWeek !== null && episode.publicWeek === episode.knownWeek
}

/** ⭐⭐⭐ v75 T4 – HAS THIS EPISODE BEEN DELIVERED YET, asked of the `lifeLog` and of nothing
 *  else.
 *
 *  ⚠⚠ hasBeatFor: THE RECEIPT IS THE RECORD (rule 2 at the head of this file, and `deliverKnownPartner`'s own doctrine): there…
 *  ⚠ hasBeatFor: `kinds` IS A PARAMETER BECAUSE THE THREE CALLERS ASK DIFFERENT QUESTIONS.
 *  ⚠ hasBeatFor: EXPORTED 28.09 BY T6.10 BECAUSE TWO OF THE THREE CALLERS NOW LIVE IN KIND MODULES
 *  → docs/notes/life-beats/hub.md#hasbeatfor--v75-t4--has-this-episode-been-delivered-yet-asked-of-the-lifelog
 */
export function hasBeatFor(world: WorldState, episodeId: string, kinds: readonly LifeBeatKind[]): boolean {
  return lifeLogOf(world).some((row) => kinds.includes(row.kind) && row.detail === episodeId)
}

/** ⭐⭐⭐ v75 T4, RULING A – WHICH SCENE AN `'ended'` CARD IS, DERIVED FROM THE `'met'` RECEIPT.
 *
 *  ⚠⚠ beatEndsRegister: THIS IS THE RULING'S DEPARTURE FROM THE BRIEF, IN ONE LINE OF CODE.
 *  ⚠ beatEndsRegister: IT STAYS RE-DERIVABLE FOR THE LIFE OF THE CAREER, which is what lets it be derived rather than stored.
 *  ⚠ beatEndsRegister: ANY OTHER KIND READS `'told-now'`, which is the base register and not a neutral stand-in – `beatWants`' own shape…
 *  → docs/notes/life-beats/hub.md#beatendsregister--v75-t4-ruling-a--which-scene-an-ended-card-is
 */
function beatEndsRegister(world: WorldState, row: LifeBeatRecord): EndsRegister {
  if (row.kind !== 'ended') return 'told-now'
  return hasBeatFor(world, row.detail, ['met']) ? 'told-now' : 'told-late'
}

/** ⭐⭐⭐ v75 T4 – WHAT SHE WANTS FROM HIM AFTER IT STOPS, on `seed:life:ends:<endedWeek>:react`.
 *
 *  ⚠⚠ drawEndsRead: THE WEIGHTS ARE `drawPartnerWants`' OWN AND THE SPEC SAYS SO IN ONE SENTENCE
 *  ⚠ drawEndsRead: (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED, and the calendar week is the ENDING's (ruling G.1).
 *  ⚠ drawEndsRead: THE TEMPERAMENT IS A PARAMETER, `endsHazardFor`'s…
 *  → docs/notes/life-beats/hub.md#drawendsread--v75-t4--what-she-wants-from-him-after-it-stops
 */
export function drawEndsRead(seed: string, endedWeek: number, temperament: Temperament): EndsRead {
  const own: EndsRead = temperamentOpenness(temperament) === 'open' ? 'company' : 'space'
  const roll = rngFromSeed(`${seed}:life:ends:${endedWeek}:react`)()
  if (roll < ECONOMY.life.wantsOwnRegister) return own
  return own === 'company' ? 'space' : 'company'
}

/** ⭐⭐⭐ v75 T4, RULING G.2 – THE READ FOR THE ROW IN HAND, `beatWants`' TWIN. Find the episode
 *  by `row.detail`, take its `endedWeek`, derive the stream.
 *
 *  ⚠⚠ beatEndsRead: RE-DERIVED AND NEVER STORED, which is a correctness requirement and not a preference.
 *  ⚠ beatEndsRead: `'space'` WHEN THERE IS NOTHING TO READ
 *  → docs/notes/life-beats/hub.md#beatendsread--v75-t4-ruling-g2--the-read-for-the-row-in-hand
 */
function beatEndsRead(world: WorldState, row: LifeBeatRecord): EndsRead {
  if (row.kind !== 'ended') return 'space'
  const episode = loveEpisodesOf(world).find((e) => e.id === row.detail)
  if (episode === undefined || episode.endedWeek === null) return 'space'
  // ⚠⚠ BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S
  // RULING A, which is the ⚠⚠ block above this function restated in the walls' own terms. The
  // read is RE-DERIVED at answer time from the episode's dates and the seed, and it PRICES the
  // option set (`'ended'`'s space/company delta is +3 or −3 BY IT).
  //
  // ⚠ beatEndsRead: The limit of the hazard, stated honestly: it is LATENT, not live, because `LIFE_BEAT_BLOCKING.ended === true` stops…
  // ⚠ beatEndsRead: THIS SITE AND THE TOLD-LATE ROW IN §6 ARE TWINS BY DESIGN
  // → docs/notes/life-beats/hub.md#beatendsread--birth-and-it-must-not-move-to-expressedtemperamentof
  return drawEndsRead(world.seed, episode.endedWeek, temperamentOf(world))
}

/** ⭐⭐ v74 T7 – THE PRICED ANSWER SET FOR WHATEVER IS PENDING, or null when nothing is.
 *
 *  ⚠ pendingLifeBeatOptions: ITS FIRST CALLER IS `tools/_lifeBeats.ts`' `drainLifeBeats`
 *  → docs/notes/life-beats/hub.md#pendinglifebeatoptions--v74-t7--the-priced-answer-set-for-whatever-is-pending
 */
export function pendingLifeBeatOptions(world: WorldState): readonly LifeBeatAnswer[] | null {
  const pending = pendingLifeBeat(world)
  // ⭐ v75 T4 – AND THE ENDING'S READ RIDES THE SAME ROAD (ruling G.3). `tools/_lifeBeats.ts` reaches
  // `'ended'`'s prices through here, so the −1 it drains with is the −1 the engine charges.
  return pending === null
    ? null
    : lifeBeatOptionsFor(pending.kind, beatWants(world, pending), beatEndsRead(world, pending))
}

/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is
 *  handed and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ buildLifeBeatPrompt: NULL WHILE NOTHING IS PENDING, which is every week of nearly every career: this is called on every `toSnapshot`…
 *  ⚠ buildLifeBeatPrompt: ZERO DRAWS ON MAIN, AND THE PROMPT IS STILL A PURE FUNCTION OF THE WORLD.
 *  ⚠ buildLifeBeatPrompt: WHAT DID CHANGE: the count is no longer zero on `seed:life:ends:*`…
 *  ⚠⚠ buildLifeBeatPrompt: AND THE FLIP REACHES THE SCREEN THROUGH `said` ALONE (v74 T7).
 *  → docs/notes/life-beats/hub.md#buildlifebeatprompt--the-prompt-the-snapshot-carries-assembled-engine-side
 */
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
  // ⭐⭐⭐ v76 T6 – AND THE SEVENTH IS **READ OFF THE ROW**, never re-derived here, which is the
  // whole of ruling E.
  //
  // ⚠ lifeBeatPromptFor: `=== true` AND NOT A TRUTHY READ
  // ⚠ lifeBeatPromptFor: THE VOICE IS BIRTH – `voiceOf` above, «who she is, for the WORDING alone» (§0.2's fence)…
  // → docs/notes/life-beats/hub.md#lifebeatpromptfor--v76-t6--the-seventh-is-read-off-the-row-never-re-derived
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
    // ⭐⭐ ROUND 46 #11d – THE ENGAGED CARD ALSO SAYS HOW LONG THEY HAVE BEEN TOGETHER (the owner, 05.10:
    // «можно там тоже писать сколько они вместе»). The pool line is untouched; `engagedWithTogether` appends ONE
    // sentence for this kind and returns every other kind's line as it was (`null` weeks). The count is
    // `relationshipDurationWeeks`, the primitive #9's personal page reads too, off the row's own episode.
    said: engagedWithTogether(lifeBeatSaid(
      row.kind,
      row.detail,
      voice,
      register,
      band,
      wants,
      // ⭐⭐⭐ ROUND 42 #15 – THE ROW'S OWN WEEK AND NOT THIS ONE.
      //
      // ⚠ lifeBeatPromptFor: RE-AIMED 26.09 (B-P3-07)
      // → docs/notes/life-beats/hub.md#lifebeatpromptfor--round-42-15--the-rows-own-week-and-not-this-one
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
      // ⭐ ROUND 46 R3 – THE ELEVENTH IS READ OFF THE ROW TOO, the frame's own reason: the spouse's line is stamped
      // at the raise and `undefined` on every older row, which reads as the occasion's first line.
      row.line,
    ), row.kind === 'engaged' ? relationshipDurationWeeks(world, loveEpisodesOf(world).find((e) => e.id === row.detail) ?? null) : null),
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
 *  ⚠⚠ SOFT_BEAT_CARD: ONE FIELD AND NOT TWO.
 *  ⚠ SOFT_BEAT_CARD: `prompt` IS A `LifeBeatPrompt` AND NOT A NEW SHAPE.
 *  ⚠ SOFT_BEAT_CARD: ZERO DRAWS, like every other prompt in this file – it is a `find` over a handful of rows and a re-assembly from facts…
 *  ⚠ SOFT_BEAT_CARD: `null` on every BLOCKING kind – those rows stop the week and never reach the soft surface…
 *  ⚠ SOFT_BEAT_CARD: THE `'small-talk'` CELL IS THE SHIPPED CONSTANT, REFERENCED AND NOT RE-TYPED (invariant 4)
 *  → docs/notes/life-beats/hub.md#soft_beat_card--v74-t15--the-soft-surface-as-one-snapshot-fact
 */
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
export function raiseLifeBeat(world: WorldState, kind: LifeBeatKind, detail: string, heard?: boolean, frame?: string, line?: number): void {
  world.lifeLog ??= []
  const row: LifeBeatRecord = { week: world.week, kind, detail, answer: null }
  // ⭐⭐⭐ v76 T6 – THE STAMP, AND THE KEY IS WRITTEN ONLY WHEN SOMEBODY WAS ACTUALLY TEACHING HIM
  // TO LISTEN (ruling E).
  //
  // ⚠ raiseLifeBeat: THE VALUE IS DECIDED BY THE CALLER, ON THE SAME LINE-RUN AS THE FEED ROW IT SHARES A COIN WITH.
  // → docs/notes/life-beats/hub.md#raiselifebeat--v76-t6--the-stamp-written-only-when-somebody-was-teaching-him-to-listen
  if (heard !== undefined) row.heard = heard
  // ⭐⭐⭐ ROUND 44 / v81 – THE FRAME, STAMPED ONCE AND NEVER RE-DERIVED.
  //
  // ⚠⚠ raiseLifeBeat: AND IT IS PERSISTED RATHER THAN DERIVED FOR ONE REASON ONLY…
  // → docs/notes/life-beats/hub.md#raiselifebeat--round-44--v81--the-frame-stamped-once-and-never-re-derived
  if (frame !== undefined) row.frame = frame
  // ⭐ ROUND 46 R3 – THE SPOUSE'S LINE, written only by `rollSpouseView` and only on a `'spouse-view'` row
  // (`LifeBeatRecord.line`): an index into that occasion's pool, stamped once and read back, never re-derived.
  if (line !== undefined) row.line = line
  world.lifeLog.push(row)
}

/** ⚠ THE ONLY WAY A PENDING ROW CLEARS, and until it runs `advanceWeeks` refuses to tick – the
 *  birthday's law, for a stronger reason: the beat is her speaking, and a week a player could
 *  tick past would answer her by walking away.
 *
 *  ⚠ answerLifeBeat: RE-VALIDATED ENGINE-SIDE (invariant 1)
 *  ⚠ answerLifeBeat: AND NEVER A PURCHASE – no `amountCents`, no price in any of its words.
 *  → docs/notes/life-beats/hub.md#answerlifebeat--the-only-way-a-pending-row-clears
 */
export function answerLifeBeat(world: WorldState, optionId: string): void {
  guardNotEndedForGood(world)
  const rows = world.lifeLog ?? []
  // ⚠ THE INDEX AND NOT THE ROW THE SELECTORS HAND BACK: `lifeLogOf` returns a readonly view on
  // purpose, and the queue's order is what decides WHICH row this answers – exactly the row the
  // prompt was built from.
  //
  // ⚠⚠ answerLifeBeat: IT IS NOT A `findIndex(answer === null)` ANY MORE, AND THE CHANGE IS LOAD-BEARING RATHER THAN TIDY
  // ⚠ answerLifeBeat: THE ORDER IS THE STOP CONTRACT READ THE OTHER WAY ROUND
  // → docs/notes/life-beats/hub.md#answerlifebeat--the-index-and-not-the-row-the-selectors-hand-back
  const soft = liveSoftBeat(world)
  const at = rows.findIndex((row) => row.answer === null && LIFE_BEAT_BLOCKING[row.kind])
  const target = at >= 0 ? at : soft === null ? -1 : rows.indexOf(soft)
  if (target < 0) throw new Error('No life beat is waiting to be answered')
  const prompt = lifeBeatPromptFor(world, rows[target])
  // ⚠ THE ROW'S OWN KIND, AND NOT A FLAT SEARCH OVER EVERY KIND'S OPTIONS (v74). Reading the
  // whole table here would let a `'met'` row be answered with the fork's `back` – the prompt
  // would refuse it, but the refusal would then be the ONLY thing standing between two beats'
  // answer sets, and rule 3 exists precisely so that two readings of the same fact cannot
  // disagree.
  //
  // ⚠⚠ answerLifeBeat: AND THE ROW'S OWN `wants` PICKS THE PRICE
  // → docs/notes/life-beats/hub.md#answerlifebeat--the-rows-own-kind-not-a-flat-search-over-every-kinds-options
  const chosen = lifeBeatOptionsFor(
    rows[target].kind,
    beatWants(world, rows[target]),
    beatEndsRead(world, rows[target]),
  ).find((o) => o.id === optionId && prompt.options.some((p) => p.id === o.id))
  if (!chosen) throw new Error('That is not one of the answers this beat offered')
  // ⭐⭐⭐ v74 T17 – THE COUNSEL ARC'S ONE DECISION, AND IT IS TAKEN **BEFORE** THE BOND DELTA
  // LANDS.
  //
  // ⚠⚠ answerLifeBeat: THE ORDER IS THE WHOLE OF THE CORRECTNESS HERE.
  // ⚠ answerLifeBeat: ONLY ON A `stop`, AND ONLY OFF HER OWN ROW.
  // → docs/notes/life-beats/hub.md#answerlifebeat--v74-t17--the-counsel-arcs-one-decision
  const counselDriver =
    rows[target].kind === 'fork-opinion' && rows[target].detail === 'stop'
      ? forkStopDriverOf(world.spirit ?? ECONOMY.spirit.baseline, world.bond ?? ECONOMY.bond.start)
      : null
  rows[target] = { ...rows[target], answer: chosen.id }
  // ⚠ HIS WORDS MOVE `bond` AND NOTHING ELSE (§4a.2's law, and this wave's fence): no spirit delta
  // from any of this, no skill, no condition, no money.
  applyBondDelta(world, chosen.bond)
  // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – ...AND THE `'expecting'` ANSWER IS THE ONE BEAT IN
  // THIS FILE WHOSE WORD OUTLIVES THE CARD.
  //
  // ⚠ answerLifeBeat: ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument twenty lines up…
  // ⚠⚠ answerLifeBeat: GUARDED ON THE RECORD AND NOT ON THE KIND ALONE, and the `null` arm is REAL rather than defensive dressing.
  // ⚠ answerLifeBeat: THE OPTION ID IS ALREADY RE-VALIDATED
  // → docs/notes/life-beats/hub.md#answerlifebeat--v85-the-pregnancy-wave-8--t2--the-expecting-answer-outlives-the-card
  if (rows[target].kind === 'expecting' && world.pregnancy !== null) {
    const grade = EXPECTING_SUPPORT[chosen.id]
    if (grade === undefined) throw new Error(`An expecting answer has no support grade: ${chosen.id}`)
    world.pregnancy.support = grade
  }
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – ...AND THE RAMP'S ANSWER IS THE SECOND BEAT IN THIS FILE
  // WHOSE WORD OUTLIVES THE CARD, on the identical shape one branch up and for the same reason:
  // what a season is BUILT out of is a claim about the months ahead, so it cannot live on a card
  // that closes this week.
  //
  // ⚠ answerLifeBeat: ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument…
  // ⚠⚠ answerLifeBeat: GUARDED ON THE RECORD AND NOT ON THE KIND ALONE
  // ⚠ answerLifeBeat: THE OPTION ID IS ALREADY RE-VALIDATED, so the lookup can only miss if the two tables part…
  // → docs/notes/life-beats/hub.md#answerlifebeat--v85-the-return-wave-8--t6--the-ramps-answer-outlives-the-card-too
  if (rows[target].kind === 'return-plan' && world.comeback !== null) {
    const plan = RETURN_PLAN_CHOICE[chosen.id]
    if (plan === undefined) throw new Error(`A return-plan answer has no plan: ${chosen.id}`)
    world.comeback.returnPlan = plan
  }
  // ⭐⭐⭐ v74 T17 – ...AND THE COACH CALLS.
  //
  // ⚠ answerLifeBeat: ABOVE THE `ANSWER_EVENT` EARLY RETURN on purpose.
  // ⚠⚠ answerLifeBeat: THE PSYCHOLOGIST'S BEAT SLOTS HERE, BESIDE THIS LINE, AND NOWHERE ELSE (wave 5).
  // → docs/notes/life-beats/hub.md#answerlifebeat--v74-t17--and-the-coach-calls
  if (counselDriver !== null) raiseLifeBeat(world, 'fork-counsel', counselDriver)
  // ⭐⭐⭐ v76 T8 – ...AND THE SEAT CALLS, ONE LINE LATER, WHICH IS THE COMMENT ABOVE CASHED IN.
  // The whole of the psy arc is this line plus a `true` in `LIFE_BEAT_BLOCKING` and its rows in
  // the two pools: the queue already answers in `lifeLog` order, `answerFork` already waits for
  // every blocking row, and neither of them changed by a byte.
  //
  // ⚠⚠ answerLifeBeat: `psychologistWorksThisWeek` AND NOT `world.psychologistHired`
  // ⚠ answerLifeBeat: NO FOCUS IS ASKED FOR.
  // ⚠⚠ answerLifeBeat: AND THE SHOCK IS READ HERE, AT THE RAISE, FOR THE WORDING COLUMN AND NOTHING ELSE (§3f).
  // → docs/notes/life-beats/hub.md#answerlifebeat--v76-t8--and-the-seat-calls-one-line-later
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

// 5. THE ARRIVAL – ⚠⚠ WHETHER SOMEONE EXISTS AT ALL (the private life, wave 3: T3 + T5) –
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T3 and §2 T5. T3 is the weekly hazard and the
// row it appends; T5 is the two draws that fill the row in.
//
// ⚠⚠ hub: THE THREE STREAMS AND NOTHING ELSE (build plan §1f, and §3 of the brief quotes it verbatim)
// ⚠ hub: RE-AIMED 12.09 BY WAVE 4's T2, NOT DELETED
// ⚠ hub: RE-AIMED AGAIN 12.09 BY T4
// ⚠⚠ hub: ZERO DRAWS ON MAIN, AND ZERO DRAWS ON AN INELIGIBLE WEEK.
// ⚠ hub: AND A MEASURED NOTE ON HOW THAT RULE IS TESTED, because it changes what the test has to be.
// → docs/notes/life-beats/hub.md#lifebeatts-5--the-arrival

/** HER AGE THIS WEEK, fractional.
 *  ⚠ kidAgeNow: `kidAgeExact` TAKES (week, month, day) AND NEVER A WORLD – the whole engine spells it this way…
 *  ⚠ kidAgeNow: EXPORTED 28.09 BY T6.10 FOR THE KIND MODULES AND FOR NOTHING ELSE.
 *  → docs/notes/life-beats/hub.md#kidagenow--her-age-this-week-fractional
 */
export function kidAgeNow(world: WorldState): number {
  return kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
}

/** WHO SHE IS, with `accrueSpirit`'s own courtesy for probe worlds hand-built in tests and
 *  benches: the field is required on every career that was created or migrated, and re-deriving
 *  it from the seed is the SAME function `createWorld` drew it with, so the fallback cannot
 *  invent a different girl from the one the save holds.
 *
 *  ⚠⚠ temperamentOf: THIS BODY MUST NEVER BE RE-POINTED AT `expressedTemperamentOf`…
 *  ⚠⚠ temperamentOf: So the swaps are per CALL SITE – `rollArrival`, `arrivalEligible`'s cooldown and `rollEnds` now call…
 *  ⚠ temperamentOf: IT IS NOT `voiceOf`, WHICH IS ALSO BIRTH AND IS A DIFFERENT LAW.
 *  → docs/notes/life-beats/hub.md#temperamentof--who-she-is-with-accruespirits-own-courtesy
 */
function temperamentOf(world: WorldState): Temperament {
  return world.temperament ?? temperamentFor(world.seed)
}

/** THE LAST WEEK AN ATTACHMENT ENDED, or null when none ever has.
 *
 *  ⚠ lastEndedWeek: THE MAXIMUM AND NOT THE TAIL'S, and the two agree on every state the sim can produce…
 *  ⚠ lastEndedWeek: NULL IS «CLEAR», NEVER «BLOCKED»
 *  → docs/notes/life-beats/hub.md#lastendedweek--the-last-week-an-attachment-ended-or-null-when-none
 */
function lastEndedWeek(world: WorldState): number | null {
  let last: number | null = null
  for (const row of loveEpisodesOf(world)) {
    if (row.endedWeek !== null && (last === null || row.endedWeek > last)) last = row.endedWeek
  }
  return last
}

/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ arrivalEligible: THIS IS THE LOAD-BEARING INVARIANT OF THE STEP
 *  ⚠ arrivalEligible: THE COOLDOWN IS UNREACHABLE ON THIS TREE, AND IT IS HERE ON PURPOSE.
 *  → docs/notes/life-beats/hub.md#arrivaleligible--the-gate--all-three-and-a-false-here-means-zero-draws
 */
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
 *  ⚠ drawPartnerWants: (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED – `drawForkWant`'s own argument above.
 *  → docs/notes/life-beats/hub.md#drawpartnerwants--draw-1-of-2--what-she-wants-done
 */
export function drawPartnerWants(seed: string, sinceWeek: number, temperament: Temperament): LoveEpisode['wants'] {
  const own = temperamentOpenness(temperament)
  const roll = rngFromSeed(`${seed}:life:partner:${sinceWeek}:wants`)()
  if (roll < ECONOMY.life.wantsOwnRegister) return own
  return own === 'open' ? 'private' : 'open'
}

/** ⭐ DRAW 2 OF 2 – HOW LONG THE PARENT WAITS, **RAW**, on `seed:life:partner:<sinceWeek>:lag`.
 *
 *  ⚠ drawRawLag: IT TAKES THE OPENNESS REGISTER, NOT THE DRAWN `wants`
 *  ⚠ drawRawLag: TWO READS OF ONE PRIVATE STREAM, and that is still ONE VALUE PER KEY
 *  owner (drawRawLag), 11.09: «двигать таблицу – ок»
 *  → docs/notes/life-beats/hub.md#drawrawlag--draw-2-of-2--how-long-the-parent-waits-raw
 */
export function drawRawLag(seed: string, sinceWeek: number, openness: 'open' | 'private'): number {
  const table = ECONOMY.life.lag[openness]
  const r = rngFromSeed(`${seed}:life:partner:${sinceWeek}:lag`)
  if (r() < table.zeroChance) return 0
  return pickInt(r, table.min, table.max)
}

/** ⭐⭐ THE BOND SHAVE – the raw lag shortened by what the parent has actually built with her.
 *
 *  ⚠⚠ shaveLag: AND THIS IS THE INPUT-INDEPENDENCE STORY OF THE WHOLE WAVE, so it is written down here rather than assumed.
 *  ⚠ shaveLag: THE DIVISORS ARE THE ARCHITECT'S CONCRETISATION (brief §4, marked ⚠ there), bench-visible…
 *  → docs/notes/life-beats/hub.md#shavelag--the-bond-shave--the-raw-lag-shortened-by-what-the-parent-has-built
 */
export function shaveLag(raw: number, band: BondBand): number {
  return Math.floor(raw / ECONOMY.life.bondShave[band])
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `loveEpisodes` row.
 *
 *  ⚠⚠ rollArrival: THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED.
 *  ⚠ rollArrival: THE BOND IT SHAVES WITH IS LAST WEEK'S SETTLED VALUE
 *  ⚠ rollArrival: IT RAISES NO BEAT AND WRITES NO FEED ROW.
 *  ⚠ rollArrival: AND `endedWeek` IS ALWAYS NULL
 *  → docs/notes/life-beats/hub.md#rollarrival--the-weekly-roll-and-the-one-writer
 */
export function rollArrival(world: WorldState): void {
  if (!arrivalEligible(world)) return
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A, and this is the site the
  // ruling is easiest to get wrong at because ONE read feeds three things.
  //
  // ⚠ rollArrival: The two `drawEndsRead` sites (`beatEndsRead`, and the told-late row in §6) are the other half of the same ruling…
  // → docs/notes/life-beats/hub.md#rollarrival--expression-not-birth--v76-t7-the-architects-ruling-a
  const temperament = expressedTemperamentOf(world)
  const hazard = arrivalHazardFor(kidAgeNow(world), temperament)
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY. `<` and not `<=`: a hazard of 0 must be impossible rather
  // than merely unlikely, and `rngFromSeed` can return exactly 0.
  // ⭐ ROUND 46 #22 – the wedding and the birth both start with a partner, so the arrival rolls through the same switch (OFF is `hazard * 1`).
  if (rngFromSeed(`${world.seed}:life:arrival:${world.week}`)() >= boostedChance(hazard)) return
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
  // spotlight, wave 6 – T1).
  // → docs/notes/life-beats/hub.md#rollarrival--the-four-v77-fields-are-written-here-at-their-birth-values
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

// 6. THE DELIVERY – ⚠⚠ THE WEEK HE IS TOLD (the private life, wave 3: T6) –
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T6. The arrival above wrote a fact about HER
// and told nobody; this is the other end of the lag, and it is the first moment the private
// life reaches a screen at all.
//
// ⚠⚠ hub: IT FIRES ALWAYS, AND THE BOND BAND PICKS ONLY THE REGISTER
// ⚠⚠ hub: ZERO DRAWS, AND THE SHAPE IS WHY
// ⚠ hub: RE-AIMED 12.09 BY WAVE 4's T2
// ⚠⚠ hub: AND RE-AIMED AGAIN BY T4 THE SAME DAY, WHERE THE CLAIM ITSELF MOVED
// ⚠ hub: IT IS DERIVED ONLY ON THE BRANCH THAT WRITES A TOLD-LATE ROW
// ⚠ hub: T2's own paragraph, kept because it explains the shape of this section…
// ⚠ hub: AND IT DUPLICATES NONE OF THE QUEUE.
// → docs/notes/life-beats/hub.md#lifebeatts-6--the-delivery

/** ⭐ THE FEED LINE THE NEWS ITSELF WRITES, before anybody has answered anything.
 *
 *  ⚠ MET_EVENT: NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4 at the top of this file).
 *  ⚠ MET_EVENT: AND NO FACT ABOUT THE PARTNER
 *  ⚠ MET_EVENT: The `open` column is T6's two lines, BYTE-IDENTICAL.
 *  → docs/notes/life-beats/hub.md#met_event--the-feed-line-the-news-itself-writes-before-anybody-has-answered
 */
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

/** ⭐⭐ v76 T6 – THE SAME WEEK, WRITTEN DOWN BY A PARENT WHO WAS TAUGHT TO READ HER – 8 drafts,
 *  and the durable half of the focus. The card is answered once and gone; this row is `keep:
 *  true`, so what a coached parent understood is what the album still says twenty seasons
 *  later.
 *
 *  ⚠ MET_EVENT_HEARD: NO BOND COLUMN, WHICH IS `ENDED_LATE_EVENT`'s…
 *  ⚠⚠ MET_EVENT_HEARD: AND NOT ONE OF THEM CLAIMS SHE SPOKE
 *  ⚠ MET_EVENT_HEARD: THE SECOND SENTENCE IS THE PARENT'S OWN, AND IT IS THE WHOLE OF WHAT THE SEAT SOLD HIM.
 *  → docs/notes/life-beats/hub.md#met_event_heard--v76-t6--the-same-week-written-down-by-a-parent-who-was-taught-to-read-her
 */
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
 *  wrote «there is someone» and this is the week that stops being true, for a parent who
 *  already knew there was somebody.
 *
 *  ⚠⚠ ENDED_NOW_EVENT: IT IS BUILT HERE RATHER THAN IN T4 BECAUSE THE TREE SAID SO IN NINE PLACES AND THE BRIEF SAID SO IN ONE.
 *  ⚠ ENDED_NOW_EVENT: THE T5 BRIEF NEVERTHELESS CALLS THIS ROW «T4's» and asks only for a STAMP…
 *  ⚠⚠ ENDED_NOW_EVENT: WITHOUT IT THE COLUMN IS SILENT ON THE LOUDEST SCENE THE LAYER HAS.
 *  ⚠ ENDED_NOW_EVENT: ONE LINE, NO READ AXIS, NO BOND COLUMN
 *  ⚠ ENDED_NOW_EVENT: IT STATES WHAT THE WEEK HELD AND NOTHING ELSE
 *  ⚠ ENDED_NOW_EVENT: A DRAFT, AND T6 OWNS THE MATRIX
 *  ⚠⚠ ENDED_NOW_EVENT: IT INTRODUCED A PERSON THE ALBUM HAD ALREADY INTRODUCED.
 *  ⚠ ENDED_NOW_EVENT: «and this week there is not» IS A NARRATOR'S FIGURE, not a statement of the week.
 *  ⚠ ENDED_NOW_EVENT: WHAT THE REPLACEMENT ASSERTS, AND ITS LICENCE FOR EACH HALF.
 *  → docs/notes/life-beats/hub.md#ended_now_event--v75-t5--the-endings-own-kept-row-on-the-told-now-path
 */
const ENDED_NOW_EVENT = 'It ended this week, and there is nobody in her life now.'

/** ⭐⭐⭐ v75 T4 – THE TOLD-LATE ROW, AND IT IS THE ROW THAT REPLACES `MET_EVENT` ON THIS PATH
 *  rather than a row added beside it. An episode that was over before its `knownWeek` arrived
 *  used to tell the parent NOTHING at all (wave 3 read the ended row through `knownPartner` and
 *  got null); ruling B turns that gap into the scene the episode schema was re-cut for, and
 *  this is the one line of it the album keeps.
 *
 *  ⚠⚠ ENDED_LATE_EVENT: ONE ROW AND NEVER TWO.
 *  ⚠ ENDED_LATE_EVENT: IT CARRIES HER READ…
 *  ⚠ ENDED_LATE_EVENT: T6 owns the full matrix – the bond-band column `MET_EVENT` carries is deliberately not guessed at here.
 *  ⚠ ENDED_LATE_EVENT: NO `amountCents`, NO PRICE, NO NAME, NO GENDER, NO REASON AND NO FAULT (rule 4 and the two-tier honesty law).
 *  → docs/notes/life-beats/hub.md#ended_late_event--v75-t4--the-told-late-row-which-replaces-met_event-on-this-path
 */
const ENDED_LATE_EVENT: Record<EndsRead, string> = {
  // ⚠ «and she left it there» WAS THIS ROW'S FIRST DRAFT AND THE TAIL-LINT CAUGHT IT
  // (tests/wave3-tail-lint.test.ts, `BANNED_TAILS`). It is on the list because the owner
  // replaced the fork's “We listened, and left it there” with a line of his own on 11.09, and
  // the ban is on the NARRATOR summing her up. The replacement states what the week held instead
  // of what it meant. ⭐⭐ RE-CUT BY v75 T6, AND THE TAIL IS WHERE BOTH ROWS FAILED.
  //
  // ⚠ ENDED_LATE_EVENT: THE READ ITSELF IS LICENSED and stays
  // ⚠ ENDED_LATE_EVENT: AND «it was over before we heard of it» IS TRUE ON BOTH PATHS: `rollEnds` writes `endedWeek` at §8…
  // ⚠ ENDED_LATE_EVENT: RE-CUT 12.09 with the heading cells above – the same presence axis, the same ruling.
  // → docs/notes/life-beats/hub.md#ended_late_event--and-she-left-it-there-was-this-rows-first-draft
  space: 'There had been someone in her life, and it was over before we heard of it. She wants the room to herself.',
  company: 'There had been someone in her life, and it was over before we heard of it. She does not want to be on her own with it.',
}

/** ⭐⭐ v76 T6 – THE ENDING'S KEPT ROW AS A COACHED PARENT WRITES IT – 8 drafts, THE TOLD-LATE
 *  ROW ALONE, keyed voice × her read.
 *
 *  ⚠⚠⚠ ENDED_EVENT_HEARD: RE-CUT BY T6b UNDER RULING O (13.09), AND THE HALF THAT CAME OUT IS RECORDED SO THE JUDGMENT CAN BE RE-OPENED…
 *  ⚠ ENDED_EVENT_HEARD: THE TOLD-LATE HALF STAYS, and the asymmetry is the ruling's own test rather than an exception to it.
 *  ⚠ ENDED_EVENT_HEARD: AND WHAT IS UNIQUE ABOUT THIS ROW IS DURABILITY, NOT EXCLUSIVITY
 *  ⚠ ENDED_EVENT_HEARD: NO BOND COLUMN – `ENDED_LATE_EVENT`'s refusal inherited rather than re-decided.
 *  ⚠ ENDED_EVENT_HEARD: THE READ HALF OF EVERY CELL IS THE STANDING POOL'S OWN WORDING, kept deliberately
 *  ⚠ ENDED_EVENT_HEARD: AND THE CLAUSE IN FRONT OF IT IS A STANDING HABIT OF HERS, never this week's telling
 *  → docs/notes/life-beats/hub.md#ended_event_heard--v76-t6--the-endings-kept-row-as-a-coached-parent-writes-it
 */
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

/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND, so «which sentence does the album keep» has exactly
 *  one spelling and the ambiguous arm is provably the bytes that shipped.
 *
 *  ⚠ metKeptRow: THEY TAKE THE SAME `HeardRead | null` THE HEADING TAKES
 *  ⚠ metKeptRow: EXPORTED FOR THE COMPLETENESS PIN, `lifeBeatSaid`'s own reason
 *  → docs/notes/life-beats/hub.md#metkeptrow--the-kept-row-one-function-per-kind
 */
export function metKeptRow(band: BondBand, wants: LoveEpisode['wants'], heard: HeardRead | null = null): string {
  return heard === null
    ? MET_EVENT[metRegisterOf(band) === 'dry' ? 'found-out' : 'told'][wants]
    : MET_EVENT_HEARD[heard.voice][wants]
}

export function endedKeptRow(endsRegister: EndsRegister, read: EndsRead, heard: HeardRead | null = null): string {
  // ⭐⭐⭐ RULING O, AND IT IS SPELT AS THE FIRST LINE OF THIS FUNCTION BECAUSE THAT IS WHERE IT…
  //
  // ⚠⚠⚠ endedKeptRow: See `ENDED_EVENT_HEARD`'s note for the ruling and `ENDED_NOW_EVENT`'s for what the sentence asserts.
  // ⚠ endedKeptRow: THE `read` ARGUMENT IS DELIBERATELY NOT CONSULTED HERE and the register is tested FIRST
  // → docs/notes/life-beats/hub.md#endedkeptrow--ruling-o--spelt-as-the-first-line-of-this-function
  if (endsRegister === 'told-now') return ENDED_NOW_EVENT
  return heard === null ? ENDED_LATE_EVENT[read] : ENDED_EVENT_HEARD[heard.voice][read]
}

/** ⭐⭐⭐ THE DELIVERY, AND THE ONE WRITER OF A `'met'` ROW. ⭐⭐ SINCE v75 T4 IT IS ALSO THE ONE
 *  WRITER OF A **TOLD-LATE** `'ended'` ROW – the same moment, asked of an episode that is
 *  already over.
 *
 *  ⚠⚠ deliverKnownPartner: EXACTLY ONCE PER EPISODE, AND THE RECEIPT IS THE `lifeLog` ITSELF
 *  ⚠ deliverKnownPartner: `<=` AND NOT `===`, DELIBERATELY.
 *  ⚠⚠ deliverKnownPartner: RE-AIMED BY v75 T4 (ruling B) AND THE OLD SENTENCE IS KEPT SO THE RE-AIM READS AS ONE.
 *  ⚠ deliverKnownPartner: THE ROW IS `keep: true` – the brief's «a KEPT feed row».
 *  → docs/notes/life-beats/hub.md#deliverknownpartner--the-delivery-and-the-one-writer-of-a-met-row
 */
export function deliverKnownPartner(world: WorldState): void {
  // ⭐⭐⭐ v75 T4, RULING B – IT SCANS THE LIST NOW, AND THE TAIL READ IS GONE. This was
  // `knownPartner(world, world.week)`, which goes `activeEpisode()` -> the tail row -> **and
  // only if it is still open** – so from the moment endings are real it returns null for exactly
  // the episodes the told-late scene is about.
  //
  // ⚠⚠ deliverKnownPartner: WHY A SCAN AND NOT A TAIL READ WITH A GUARD
  // ⚠ deliverKnownPartner: THE RECEIPT IS BOTH KINDS HERE, and that is the half a reader could get wrong…
  // → docs/notes/life-beats/hub.md#deliverknownpartner--v75-t4-ruling-b--it-scans-the-list-now
  const due = loveEpisodesOf(world).find(
    (episode) =>
      episode.knownWeek !== null &&
      episode.knownWeek <= world.week &&
      !hasBeatFor(world, episode.id, ['met', 'ended']),
  )
  if (due === undefined) return
  // ⭐⭐⭐ THE SPLIT, AND IT IS THE WHOLE OF RULING B. An OPEN row takes the `'met'` path below,
  // BYTE UNCHANGED – same row, same text, same beat, same dedupe; an ENDED one takes the
  // told-late path, which raises `'ended'` and **no `'met'`, ever**.
  //
  // ⚠ deliverKnownPartner: THE KIND IS THE ONE BEING RAISED, which is why the two branches ask separately.
  // → docs/notes/life-beats/hub.md#deliverknownpartner--the-split-and-it-is-the-whole-of-ruling-b
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
      //
      // ⚠⚠ deliverKnownPartner: BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S RULING A.
      // ⚠ deliverKnownPartner: THE TEMPERAMENT-INDEXED POOLS BESIDE IT READ BIRTH FOR THE OTHER REASON (§0.2's fence, `voiceOf` above)
      // → docs/notes/life-beats/hub.md#deliverknownpartner--no-amount-rule-4-and-the-read-comes-off-the-endings-own-week
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

// 7. TIER-1 SMALL TALK – MOVED TO `world/lifeBeat/smallTalk.ts` (A-06 / T6.10, 28.09) – The
// week she comes with something small left whole – banner, chronicles and all – and it was the
// most coupled of the seven: it reaches TWELVE names in this hub, four of them in §3c-2's
// situation layer. All twelve stay here, because the hub still CALLS §3c-2 (§3k reads it eight
// times) and a section the hub calls is not ready to move (P4's rule). Its four names are NOT…
//
// ⚠ `'small-talk'`'s COPY is §3c above, `world/lifeBeat/smallTalkCopy.ts`, which this hub still imports because the prompt is assembled…
// ⚠ `divorcedKeptRow` WENT WITH IT rather than staying on this hub's import list: §8 was its only caller…
// ⚠⚠ hub: THE RE-EXPORT THAT USED TO SIT HERE WENT ON 28.09 (T6.10), AND ITS ABSENCE IS THE RULE RATHER THAN A TIDY-UP.
// → docs/notes/life-beats/hub.md#lifebeatts-7--tier-1-small-talk--moved-to-smalltalkts

// =================================================================================================
// 10. THE BOOTH – MOVED TO `world/lifeBeat/booth.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// The second of the review's two zero-reference sections: it left whole, banner and chronicles
// included. Its two names come off `world/lifeBeat/booth.ts` directly – see §9's note for why the hub
// re-export that used to sit here is gone and may not come back.

// 11. THE WEDDING – MOVED TO `world/lifeBeat/wedding.ts` (A-06 / T6.10, 28.09) – The week she
// decides to marry left whole – banner, chronicles and all – and the section imports
// `hasBeatFor`, `kidAgeNow`, `lifeLogOf` and `raiseLifeBeat` back from this hub, which is why
// its five names are NOT re-exported here: `src/engine/world.ts` takes them off the kind
// module directly. ⚠ `'engaged'`'s COPY is a different module…
//
// ⚠⚠ hub: THE SPOUSE'S OPINION SURFACE – THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY…
// ⚠⚠ hub: THE WAVE'S THIRD AND LAST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE
// ⚠⚠ hub: ZERO DRAWS ON MAIN…
// ⚠⚠ hub: EVERY OCCASION IS A READ OF A SEAM THAT ALREADY ANSWERS…
// → docs/notes/life-beats/hub.md#lifebeatts-11--the-wedding--moved-to-weddingts

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
 *  `SMALL_TALK_FACT` table's own shape, asked BEFORE the draw so a false fact removes the
 *  occasion from the pool instead of being papered over in the copy (its own rule, inherited
 *  whole).
 *  → docs/notes/life-beats/hub.md#spouse_view_occasion_at--the-four-gates-one-per-occasion-each-a-pure-zero-draw-read
 */
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

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A
 *  predicate of its own for `arrivalEligible`'s stated reason. Pure, zero draws, no writes.
 *
 *  ⚠ spouseViewEligible: It counts RAISED rows, answered or not – a card the parent ignored still spent the marriage's turn to speak.
 *  → docs/notes/life-beats/hub.md#spousevieweligible--the-gate--all-four-and-a-false-here-means-zero
 */
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
 *  ⚠⚠ rollSpouseView: THE GATE RUNS FIRST, THE OCCASIONS SECOND, AND THE STREAM IS DERIVED ONLY WHEN BOTH HAVE PASSED
 *  ⚠ rollSpouseView: NO HAZARD AND NO CHANCE CONSTANT, WHICH IS THE BRIEF READ LITERALLY
 *  ⚠ rollSpouseView: THE DETAIL IS THE OCCASION
 *  → docs/notes/life-beats/hub.md#rollspouseview--the-weekly-call-and-the-one-raise-site
 */
export function rollSpouseView(world: WorldState): void {
  if (!spouseViewEligible(world)) return
  // ⭐ ROUND 46 #15 – THE OCCASIONS HE HAS NOT JUST SAID (owner, 05.10: the same line twice, a month or
  // two apart, «часто повторяется»). The memory is DERIVED from the log – every raised row carries its
  // occasion as `detail`, answered or not, the cooldown's own counting – so nothing is saved and the
  // schema does not move. ⚠ THE FILTER RUNS BEFORE THE STREAM EXISTS: the OCCASION pick below is still
  // its one draw on the same purpose key, only over the fresh occasions, and a week whose every true occasion is
  // stale derives no key at all (a spouse with nothing NEW to say says nothing – §B's law). Where nothing was
  // said inside the window the filter removes nothing and the occasion is the one it picked before.
  const said = new Set(
    lifeLogOf(world)
      .filter((row) => row.kind === 'spouse-view' && world.week - row.week < ECONOMY.wedding.spouseViewNoRepeatWeeks)
      .map((row) => row.detail),
  )
  const occasions = spouseViewOccasionsAt(world).filter((occasion) => !said.has(occasion))
  if (occasions.length === 0) return
  // ⭐ ROUND 46 R3 – ONE KEY, TWO TAPS (owner, 06.10: the occasions now hold several lines each). The first tap
  // is the occasion, EXACTLY as before – the same stream, the same draw, the same range – so a world picks the
  // occasion it picked a round ago; the second is the line inside it, on the SAME stream object (one derivation,
  // not a second key), so a week that fires still derives exactly one key and a week that does not still derives
  // none. ⚠ THE LINE MEMORY: never the line he said LAST for this occasion, read off the most recent row of it
  // however old (a row with no `line` stood on entry 0 – `LifeBeatRecord.line`). It can only bind past the
  // occasion window above, since inside it the occasion itself is stale. The pool is never emptied: a pool of one
  // line, or a memory that excludes all of it, falls back to the whole pool, still one draw.
  const rng = rngFromSeed(`${world.seed}:life:spouse-view:${world.week}`)
  const occasion = occasions[pickInt(rng, 0, occasions.length - 1)]
  const log = lifeLogOf(world)
  let lastLine: number | null = null
  for (let i = log.length - 1; i >= 0 && lastLine === null; i--) {
    if (log[i].kind === 'spouse-view' && log[i].detail === occasion) lastLine = log[i].line ?? 0
  }
  const all = SPOUSE_VIEW_SAID[occasion].map((_, i) => i)
  const fresh = all.filter((i) => i !== lastLine)
  const live = fresh.length > 0 ? fresh : all
  raiseLifeBeat(world, 'spouse-view', occasion, undefined, undefined, live[pickInt(rng, 0, live.length - 1)])
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

// 13. THE INDEPENDENT LIFE – MOVED TO `world/lifeBeat/ownKey.ts` (A-06 / T6.10, 28.09) – The
// week she lives behind her own door left whole – banner, chronicles and all – and it imports
// five names back from this hub, which is why its three names are NOT re-exported here:
// `src/engine/world.ts` takes them off the kind module directly. ⚠ IT WAS ONE OF THE TWO
// SECTIONS THE first pass could not move, because `world/snapshot.ts` reaches
// `ownKeyThisWeek`…
//
// ⚠ `'own-key'`'s COPY is §3i above, `world/lifeBeat/ownKeyCopy.ts`, which this hub still imports because the prompt is assembled here…
// ⚠ `'expecting'`'s COPY is §3j above, `world/lifeBeat/pregnancyCopy.ts`, which this hub still imports because the prompt is assembled…
// ⚠ hub: AND THE ARC'S OTHER HALF IS `world/lifeBeat/weight.ts` (§15): the loss and the hidden window.
// ⚠ hub: `LOSS_HER_LINE` and `lossLineFor` went with it: they are read by nothing outside the section…
// → docs/notes/life-beats/hub.md#lifebeatts-13--the-independent-life--moved-to-ownkeyts
