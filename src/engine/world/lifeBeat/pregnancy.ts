// A-06 / T6.10 – `world/lifeBeat.ts` §14 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⭐ THE LARGEST OF THE NINE HAZARD SECTIONS – 792 lines, 13 declarations, the whole arc from the week
// she says she is having a child through the pause, the birth and the comeback – and the LAST to move,
// because it was one of the two blocked on a sibling's import. `world/snapshot.ts` reads
// `motherhoodBandAt` and `world/endings.ts` reads `decisionWeekOf`, `returnChanceFor` and
// `comebackAtReturn`, both with `from './lifeBeat'` – a relative specifier that names neither the package
// nor the path, so the importer census that said «`world.ts` is the hub's only importer in `src`» could
// not see either of them. THE GENERAL FORM, on the record 28.09: a module inside a package is imported by
// its SIBLINGS with a relative specifier, so an importer census needs both spellings or a resolver.
// `git grep -ln "world/lifeBeat'" -- src` finds one file; `git grep -n "from '\./lifeBeat'" -- src` finds
// four.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub – `kidAgeNow`, `latchedEpisode`, `raiseLifeBeat` – so the hub re-exports NOTHING of it.
// `src/engine/world.ts` takes the eleven names off `./world/lifeBeat/pregnancy` and re-exports them on its
// existing export statement, so the barrel's frozen name set (T6.6) does not move a specifier.
// `world/phaseHerWeek.ts`, `world/snapshot.ts` and `world/endings.ts` ask this module directly. The edge
// runs those four → pregnancy → lifeBeat, and the hub reaches `world.ts` only as `import type`, erased.
//
// ⚠⚠ AND `tests/import-cycles.test.ts` IS NOT THE WITNESS TO THAT DIRECTION TODAY. Its comment strip runs
// block comments before line comments, and a line comment naming a path glob in backticks puts a slash
// immediately before a star, which the block matcher reads as an opener – so it deletes real code as far
// as the next JSDoc close. Measured on 28.09: 121 runtime edges lost across 24 files, including EVERY edge
// of `leak.ts`, `booth.ts` and `bereavement.ts`. It stayed GREEN on a hand-armed 2-cycle in three
// positions. The guard that holds this arrow is `tests/principles-a06-life-beat-direction.test.ts`, which
// has the strip order fixed.
//
// ⚠⚠ SEVEN SUB-STREAMS LIVE HERE AND THREE OF THEM ARE THE ONES T3.9 EXISTS FOR.
// `seed:life:conception:<week>`, `seed:life:conception-window:<week>` and the announcement's own draws
// come with the section, and `world/lifeBeat/weight.ts` holds `seed:life:pregnancy-loss:…` and
// `seed:life:window:…` for the SAME arc one file over. Two different facts may never share a key, and
// these live under nearly the same word. All of them stay in T3.9's inventory
// (`tests/life-beat-keys.test.ts`, 26 keys, set equality) because this file sits FLAT in
// `world/lifeBeat/`, which is the shape `engineModuleSource` reads.
//
// ⚠ `'expecting'`'s COPY is a separate module, `world/lifeBeat/pregnancyCopy.ts` (T6.8), which the HUB
// imports because the prompt is assembled hub-side. A copy leaf may be read by the hub and by a hazard
// alike; what it may never do is import one back – which is why a kind is never one file with both halves.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule), and so do
// `ComebackState` and `PregnancyState`.
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { temperamentFor, temperamentOpenness } from '../../spirit'
import { addEvent } from '../ledger'
import { knockRunning } from '../constants'
import { kidPoints, rankIn } from '../ladder'
import { captureMilestone, fireMilestone } from '../milestones'
import { kidAgeNow, latchedEpisode, raiseLifeBeat } from '../lifeBeat'
import { PREGNANT_LAST_WEEKS } from '../../../shared/avatarEmotion'
import type { MotherhoodBand } from '../../../shared/protocol/narrative'
import type { ComebackState, PregnancyState, WorldState } from '../state'

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

