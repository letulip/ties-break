// ⭐⭐ THE BIRTH OF A CAREER – `createWorld`, the prologue handover it applies, and the one
// hydration a pre-v6 save still needs (A-04 (a) / T6.5; docs/review/proposals/P4-world-decomposition.md).
//
// WHAT IS HERE AND WHY IT IS ONE MODULE. Everything below runs exactly ONCE in a career's life, at
// week 0, and nothing below is reachable from `tickWeek`. That is the boundary: the 93-property
// `WorldState` literal, the four `prologue*` derivations that decide what nine years of childhood are
// allowed to move, the coach ladder they read, and `seedWorldForV6`, which is the same job done for a
// save born before those fields existed. The 26.09 lane measured the cluster at zero call-backs into
// the integration core (`docs/review-principles-2026-09-26/probes/world-callbacks.mjs`), so it moved
// whole, by P4's rule, with no dependency inversion and no changed signature.
//
// ⚠ AND IT IS THE FILE THAT WAS GROWING. A-04's own measurement: `createWorld` was touched by 14
// first-parent merges since 05.09, against 4 for the tournament close and ≤ 1 for everything else in
// world.ts, because every persisted field adds a line and its essay to the literal below. A barrel is
// the worst possible place for the file a wave edits every week – the reader of the tick pipeline was
// paying for it in tokens – which is the practical half of why P4 wanted this out.
//
// ⚠ RNG: EVERY DRAW HERE IS THE BIRTH'S OWN, AND MAIN IS NOT TOUCHED. `initMainState(seed)` stamps
// the register; the cohort, the pre-history, the potential roll and the temperament are derived from
// the seed the way they always were, in the same order, at the same call sites. No statement moved
// inside any body, so the frozen capture (41550 draws / e6b0c709) cannot see this file either.
//
// ⚠ SAVE SCHEMA: NOTHING MOVED. `SAVE_SCHEMA_VERSION` still lives in `world/state.ts` and is still
// re-exported by the barrel; this module is one more READER of it.
import { initMainState } from '../rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type CoachTier,
  type DynastyHandover,
  type FamilyBackground,
  type PlayerProfile,
  type PrologueHandover,
} from '../../shared/protocol'
import { formatCents } from '../../shared/money'
// ⭐ v72: `createWorld` draws her temperament through THE one derivation – the same function the
// v71 -> v72 migration calls, which is what makes an old career turn out to have always been her.
import { temperamentFor } from '../spirit'
import { ECONOMY, prologueFundsCents } from '../economy'
// ⭐⭐ THE CHILDHOOD PROLOGUE, AND THIS IS THE ONLY IMPORT OF IT IN THE WHOLE OF `src/`.
// `tests/childhood.test.ts` pins the importer set of `engine/childhood.ts` as exactly
// `['engine/world.ts']` – phase 1 shipped it EMPTY («the module exists, is measured, and is
// unreachable») and phase 4 is the one-line reviewed change that opens it. Nothing else may import
// it: not the card table, not the pool, not a screen. What that buys is unchanged from phase 1's
// argument – a module nothing on the tick path imports cannot be reached by an ordinary in-game
// week – and it is now a claim about ONE named importer instead of none.
// ⚠ T6.5 / A-04 (a), 28.09 – THE PINNED NAME IS THIS FILE NOW. The import travelled here with
// `createWorld`, its only caller, so that set reads `['engine/world/create.ts', 'prologue/pool.ts']`
// (phase 12 added the second name). The CLAIM is untouched: still exactly two importers in the whole
// of `src/`, still neither on the tick path, still asserted from the other end in that test.
import { childhoodArrival, medianChildhood, weightAt, type ChildhoodYear } from '../childhood'
// The style she EARNED, read by the game's own derivation (`styleOf`, season/rival.ts) – see
// `prologuePlayStyle`. rival.ts imports nothing from this file, so this is a leaf edge.
import { styleOf } from '../season/rival'
import { generateCohort } from '../season/cohort'
import { physicalMean, rollPotential } from '../development'
import { coachIncludesPhysio } from '../coach'
import { generatePreHistory } from '../season/prehistory'
import { defaultKitState } from '../equipment'
import { addEvent } from './ledger'
import { openingCoachId } from './coachMarket'
import { startingSkills, withHeadStart } from './player'
import { emptySeasonRecord, emptySeasonEntries, emptyTrophyLedger } from './milestones'
import { ancestorSeedOf } from './endings'
import { recomputeKidRank } from './ladder'
import { ensureSeason } from './bookkeeping'
import { SAVE_SCHEMA_VERSION } from './state'
// ⚠ TYPE-ONLY, AND THAT IS THE WHOLE OF WHY THIS IS NOT A CYCLE (CLAUDE.md's P4 rules): the barrel
// imports the values back and re-exports them under their historical names, and this import is erased
// at compile time, so no runtime edge points from the package back at `world.ts`.
import type { WorldState } from '../world'

// ⚠ ROUND 26 #4 – THE NUMBERS MOVED TO `./economy`, THE NAME DID NOT. Same alias shape as
// `PARENT_INCOME_CENTS` eight lines below, and for the same reason: the economy tuning surface is one
// object. What forced it is `world/means.ts`, which turns a balance into a means band and may not
// import `world.ts` back – that edge is a runtime cycle, and `economy.ts` is a leaf. Every one of the
// twelve readers of this export (MoneyScreen, EndingScreen, five tests, two tools) is untouched.
export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = ECONOMY.startingFundsCents

// The economy tuning surface now lives in ./economy (the owner's single "ручки регулировки"
// knob object). These aliases keep the old call sites + the public PARENT_INCOME_CENTS export
// (imported by tests) pointing at that one source of truth.
export const PARENT_INCOME_CENTS = ECONOMY.parentIncomeCents

// =================================================================================================
// ⭐⭐⭐ THE HANDOVER – what nine years of her childhood are allowed to move (build spec §4)
// =================================================================================================
//
// ⚠⚠ AND WHAT THEY MAY NOT: `potential`. Build spec §4 – «her ceiling is talent and what you did at
// eight does not change it. Let the prologue raise it and "you made her" quietly becomes "she was
// always going to be good"» – which is the same rule task 55 keeps twenty lines below, in the
// comment on the `potential:` key itself: a timing or effort effect must never become a talent
// effect. It is STRUCTURAL here rather than a promise, and the structure is worth naming because it
// is not obvious from the call site:
//
//   `rollPotential(seed, startingSkills(seed, profile))` is a function of the SEED ALONE.
//   `startingSkills(seed, _profile)` ignores its profile argument (world/player.ts – the underscore
//   is in the signature), so no field the prologue derives – not the earned style, not the rung, not
//   the background – can reach the ceiling roll even in principle. The arrival build is computed
//   AFTER it and handed only to `skills`.
//
// `tests/prologue-handover.test.ts` proves it byte-for-byte against a wizard career on the same
// seed, and the proof is mutation-verified by feeding the arrival to `rollPotential` and watching it
// redden.
//
// ⚠ NO DRAW OF ANY KIND IS ADDED. `childhoodWalk` takes no seed and imports no generator (phase 1),
// `styleOf` is pure arithmetic on five attributes, and the rung below is a weighted mean. The frozen
// capture (41550 draws / e6b0c709) and every career hash therefore cannot move for a WIZARD career –
// not «were checked and did not move», cannot – and `tests/condition.test.ts`'s pin is untouched.

/** ⭐⭐ THE COACH LADDER – WHERE YOU START BOUNDS WHERE YOU CAN REACH. The owner's ruling, 02.09,
 *  transcribed as a table because it IS a table:
 *
 *      working    the cheap branch -> self-coached     the dear branch -> a budget coach
 *      middle     cheap -> budget                      dear -> middle
 *      wealthy    cheap -> middle                      dear -> high
 *
 *  ⚠⚠ IT REPLACES AN EVEN FIFTH OF WEIGHTED `teaching`, AND THE DEFECT THE EVEN FIFTH SHIPPED WITH
 *  IS WHY. He found it in play: «карьера за 25к начала у меня с 15к на руках и тренером high тира» –
 *  a MIDDLE family, on the dearest branch the card table has, arriving with the reserve spent AND a
 *  high-tier coach on the payroll. The old reading knew nothing about the family: nine years of
 *  club-and-one-to-one read the same whether the money came out of a working family's rent or a
 *  wealthy one's petty cash, and the ladder is what puts the family back into the answer.
 *
 *  ⭐ AND THE SHAPE IS THE MEANING. Two rungs per origin, overlapping by exactly one with the origin
 *  above, so a working family that did everything right arrives where a middle family that did
 *  nothing special starts. That is the sentence the whole prologue is for.
 *
 *  ⚠ NO «I COACH HER MYSELF» FOR MIDDLE OR WEALTHY. He ruled against it and the reasons are parked
 *  in docs/backlog/the-team-around-her.md row 9: it collapses all three origins onto one outcome at
 *  the cheap end, and `developmentFactor.self = 0.82` is the whole of what the engine knows about
 *  that rung – so a rich parent who chose the court and a poor one who could not afford anything
 *  else would be the identical number wearing two different stories. */
export const PROLOGUE_COACH_LADDER: Readonly<Record<FamilyBackground, readonly [CoachTier, CoachTier]>> = {
  working: ['self', 'budget'],
  middle: ['budget', 'middle'],
  wealthy: ['middle', 'high'],
}

/** WHAT THE NINE YEARS PAID FOR TEACHING, 0..1 – the years weighted by `weightAt`, phase 1's own
 *  share of the childhood, so the thirteenth year counts for more than the fifth: a family that
 *  found the money late arrives higher than one that spent it on a six-year-old.
 *
 *  ⚠ SHARED WITH THE BRANCH TEST BELOW SO THERE IS ONE READING AND NOT TWO. */
function taughtShareOf(years: readonly ChildhoodYear[]): number {
  let taught = 0
  let mass = 0
  for (const y of years) {
    const w = weightAt(y.age)
    taught += w * Math.max(0, Math.min(1, y.teaching))
    mass += w
  }
  return mass > 0 ? taught / mass : 0
}

/** ⭐ THE RUNG SHE ARRIVES ON – the origin picks the pair, the childhood picks within it.
 *
 *  ⚠⚠ THE BRANCH IS DECIDED AGAINST THE ORDINARY CHILDHOOD, AND THAT THRESHOLD IS NOT A NUMBER
 *  ANYBODY CHOSE. `medianChildhood()` is the anchor `childhoodWalk` already normalises the level
 *  against – the childhood that lands EXACTLY on `startingSkills` – so its own weighted `teaching`
 *  is the one place in this codebase where «an ordinary amount of coaching» is already defined. A
 *  childhood that bought her better teaching than an ordinary one takes the dear rung; one that did
 *  not takes the cheap one. Nothing here is available for a later wave to re-tune by feel.
 *
 *  ⚠ MONEY WAS THE OTHER CANDIDATE AND IT IS NEARLY THE SAME READING – the two agree on 24 of the
 *  32 reachable runs, because in this table the dearer answer is also the better-taught one on every
 *  card but the tenth. Teaching wins because a RUNG is a statement about who teaches her, and
 *  because it leaves the modal prologue on the rung the wizard's own default sits on. Measured, both
 *  arms, in docs/specs/childhood-prologue-balance-2026-09.md §1.
 *
 *  Measured over the 32 reachable runs x 3 origins, this produces exactly his six outcomes and
 *  nothing else – the distribution is in that spec. `elite` is unreachable from any origin, which is
 *  honest rather than dead: nine years of a childhood does not buy an elite coach at fourteen. */
export function prologueCoachTier(
  background: FamilyBackground,
  years: readonly ChildhoodYear[],
): CoachTier {
  const [cheap, dear] = PROLOGUE_COACH_LADDER[background]
  return taughtShareOf(years) >= taughtShareOf(medianChildhood()) ? dear : cheap
}

/** ⭐ THE STYLE SHE EARNED, WHICH DELETES A MENU (§4: «`playStyle`, earned rather than picked – it
 *  emerges from what she actually practised»).
 *
 *  ⚠ IT IS THE GAME'S OWN DERIVATION AND NOT A NEW ONE. `styleOf` (season/rival.ts) is how every one
 *  of the 199 rivals gets a style: a serve clearly ahead of the return is serve-first, a return with
 *  the legs behind it is a counterpuncher, two weapons without the legs is an aggressive baseliner,
 *  and everything else is all-court. Reading her the same way is the whole answer – what the nine
 *  years did to her wings (`childhoodWalk`'s `shape` channel, which redistributes and never adds) is
 *  what decides it, so the style is a CONSEQUENCE of the focus a parent bought rather than a fifth
 *  question on a form. */
export function prologuePlayStyle(arrival: Parameters<typeof styleOf>[0]): PlayerProfile['playStyle'] {
  return styleOf(arrival)
}

// --- lifecycle ---------------------------------------------------------------
/**
 * A new career at week 0.
 *
 * ⭐ `prologue` IS THE ONLY NEW ARGUMENT AND IT IS OPTIONAL, which is what makes §6's two paths one
 * function: absent, this is byte-for-byte the wizard's career the game has always created, and the
 * frozen career hashes are unmoved by construction rather than by measurement. Present, the four
 * things §4 permits are applied on top – all of them onto fields every save has carried for dozens
 * of versions, so no schema moves and no migration is owed.
 */
export function createWorld(
  seed: string,
  profile: PlayerProfile = DEFAULT_PROFILE,
  careerId: string = `legacy-${seed}`,
  prologue?: PrologueHandover,
  /** ⭐⭐⭐ v86 (the dynasty, wave 10 T2) – THE FIFTH ARGUMENT, AND IT IS `prologue`'s PRECEDENT
   *  VERBATIM: absent means byte-for-byte the career this function has always created, which is the
   *  property `tests/wave10-handover.test.ts` §C measures rather than asserts. Present, it does
   *  exactly three things – answers the origins card (§4's band), persists the record, and hands T3
   *  the mother's temperament. It does NOT open a different code path: there is one literal below and
   *  there always was. */
  dynasty?: DynastyHandover,
  /** ⭐⭐⭐ v87 (the weight, wave 11 T1) – THE SIXTH ARGUMENT, AND IT IS THE CREATION ASK'S ANSWER.
   *  `dynasty`'s precedent one line up, with one difference that is a RULING rather than a shape:
   *  absent means **OFF**, never silently on (the plan's own words), so every bench, probe, fixture
   *  and sim career this function has ever created is byte-identical to what it was – which is what
   *  makes §8 row 6's byte-identity arm measurable at all.
   *
   *  ⚠ IT IS AN ARGUMENT AND NOT A `PlayerProfile` FIELD, deliberately. The profile is PERSISTED as
   *  `world.profile`, so a field there plus `world.weightEnabled` would be two spellings of one fact
   *  – this repo's most-caught defect class – and the settings row writes only one of them. */
  weightEnabled?: boolean,
): WorldState {
  // ⭐ THE NINE YEARS, SPENT. Everything below reads `arrival` and `profile`; when there is no
  // prologue both are what they have always been, so there is ONE code path and not two.
  const years: readonly ChildhoodYear[] = prologue?.years ?? []
  const born = withHeadStart(startingSkills(seed, profile), profile.birthMonth)
  // ⚠ POST-DRAW, ON TOP OF THE HEAD START, exactly the shipped `relativeAgeHeadStart` pattern
  // (`childhoodArrival`'s own note says so, and phase 1 clamps the result to `STARTING_SKILL_BAND`
  // so the set of girls a prologue can hand over is the SAME SET a fresh fourteen-year-old is drawn
  // from). No stream is touched and no schema is owed.
  const arrival = years.length > 0 ? childhoodArrival(born, years) : born
  // ⭐⭐ §4 AND §6.3 – ON A DYNASTY RUN THE ORIGINS CARD IS NOT ASKED, BECAUSE THE BLOCK ANSWERS IT.
  // The band was mapped at the mother's ending off HER own account (`dynastyBackgroundOf`), so the
  // family the daughter is born into is the one her mother's career really left behind.
  //
  // ⚠⚠ IT IS APPLIED HERE, AHEAD OF THE PROLOGUE'S OWN SPREAD, AND THE ORDER IS LOAD-BEARING:
  // `prologueCoachTier(profile.background, years)` reads the background one line down, so a dynasty
  // childhood has to be priced against the band it was really lived in.
  //
  // ⚠ AND IT IS DONE ENGINE-SIDE RATHER THAN TRUSTED FROM THE WIRE (invariant 1: every command is
  // re-validated where the world lives). The prologue screen does not ask the card, so nothing up
  // there is even in a position to send the right answer – this line is the answer.
  if (dynasty) {
    profile = { ...profile, background: dynasty.background }
  }
  if (prologue) {
    profile = {
      ...profile,
      playStyle: prologuePlayStyle(arrival),
      coachTier: prologueCoachTier(profile.background, years),
    }
  }
  const fundsCents = prologue
    ? prologueFundsCents(profile.background, prologue.spentCents)
    : STARTING_FUNDS_CENTS[profile.background]
  const cohort = generateCohort(seed)
  // Ladder-up Part A: the cohort arrives with a season already behind it (season/prehistory.ts),
  // so week-1 entrant fields are ranking-MEANINGFUL and the standings are not a 199-way tie at 0.
  // Rows sit at NEGATIVE weeks [-51, -1]; they count inside the existing rolling-52 window at
  // week 0 and are pruned away by the normal `world.week - r.week <= RESULTS_WINDOW` rule as the
  // first season runs – NO new field and NO schema bump. Audited before adopting the shape: the
  // only week-sensitive reads over `results` are pruneResults, computeRanking/windowedBestSum
  // (all three use the same `<= WINDOW` difference, which is sign-agnostic), playedWeeksInTrailing4
  // and computeCountingResults (KID-only, and pre-history is AI-only), and maybeFireSeasonWrapUp's
  // `inRange` (`w >= yearStart`, so negative weeks are excluded from every season figure). Nothing
  // clamps a result week at 0 and nothing feeds a result week to weekYear.
  // The kid gets NO pre-history: she still starts on 0 points and reads "Unranked".
  const world: WorldState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    careerId,
    seed,
    week: 0,
    // v35: the MAIN stream is born at position zero, ON the world. From here on the position and
    // the career are one object — the worker resumes from this pair and its draws advance it.
    rngMain: initMainState(seed),
    fundsCents,
    // v54: her own account opens empty and stays empty until the first cheque after her eighteenth –
    // `kidPrizeShareBps` returns 0 for every week of the junior story, so this is not a placeholder,
    // it is the true balance for the first four seasons of every career.
    kidFundsCents: 0,
    profile,
    plan: { ...WEEK_PLAN_PRESETS.balanced },
    cohort,
    results: generatePreHistory(seed, cohort),
    season: [],
    entries: [],
    events: [],
    nextEventId: 0,
    // Placeholder only – recomputeKidRank below replaces it with the real value (last, behind the
    // whole cohort, because she is the only player without a counting result).
    kidRank: cohort.length + 1,
    prevKidRank: null,
    // Both shut. She starts on zero points in every table, so she has cleared nothing - and the
    // `recomputeKidRank` at the end of this function will not open them either, which is the on-ramp
    // doing its job. The FIRST thing this game asks of her is to earn her way onto the domestic
    // table, and that has not changed.
    onRampCleared: { itf: false, wta: false },
    // Phase 4: her starting build is the SAME derivation that used to be recomputed on demand, so
    // week 0 is byte-identical to the pre-development engine. What changed is that it is now state,
    // and state moves.
    // ⚠ TASK 55 – AND THE HEAD START HER BIRTH MONTH BOUGHT HER. `startingSkills` stays the pure birth
    // derivation (the build she was BORN with, seed-only, and the radar's baseline for every existing
    // save); this adds the eleven months of extra training a January girl has had by the time the game
    // opens. Applied HERE rather than inside `startingSkills` for two reasons: that function is
    // documented as the birth build and two girls with the same seed really do have the same one, and
    // every save written before this existed keeps a radar baseline that has not moved.
    // POST-DRAW arithmetic, so no stream is touched.
    // ⚠ AND SINCE PHASE 4 THIS IS `arrival` – the head-started birth build with the childhood's nine
    // years already folded in, or exactly the head-started birth build when there is no prologue.
    // The expression it replaces was `withHeadStart(startingSkills(seed, profile), profile.birthMonth)`
    // and that is verbatim what `arrival` is on the wizard path, computed once above instead of twice.
    skills: arrival,
    // ⚠ THE CEILING IS ROLLED OFF THE BIRTH BUILD, NOT THE HEAD-STARTED ONE. `rollPotential` adds a band
    // on top of where she starts, so feeding it the head start would hand the January girl a higher
    // CEILING as well as a better start - turning a timing effect into a talent effect, which is exactly
    // what task 55 must not become. Being born in January does not make her able to get better.
    potential: rollPotential(seed, startingSkills(seed, profile)),
    // Nobody is backing her yet. The first review is the season boundary at week 52 – she has to
    // put a year in front of them before anyone writes a letter.
    academy: null,
    // R12-S1: season 0's start rank is set below, once `recomputeKidRank` has produced the real
    // value – she starts dead last behind the whole cohort, because she is the only player without
    // a counting result, and that is a true and meaningful thing for her first wrap-up to say.
    seasonStartRank: null,
    pendingTournament: null,
    bestFinishByTier: {},
    peakDomesticPoints: 0,
    // v31: eighteen empty shelves. She has won nothing, and the cabinet says so by showing her all
    // eighteen things she has not won yet.
    trophiesByTier: emptyTrophyLedger(),
    lastSeasonSummary: null,
    seasonHistory: [],
    seasonWins: 0,
    seasonLosses: 0,
    seasonRecord: emptySeasonRecord(),
    // v45: week 0 IS season 0's first week, so a career born here is tracked from its first entry and
    // its very first wrap-up can print the line. `emptySeasonEntries` is shared with the wrap's reset
    // and with the migration, which needs the same shape from a different starting week.
    seasonEntries: emptySeasonEntries(0),
    financeWeeks: [],
    condition: ECONOMY.condition.start,
    injury: null,
    injuryHistory: [],
    physioActive: coachIncludesPhysio(profile.coachTier),
    // v23: onboarding picks a RUNG, so the world picks the person on it - the coach at that rung
    // who suits her game best, and the cheapest of those when several tie. That is what a parent
    // walking into an academy and saying "we can afford this much" actually gets, and it means a
    // career opens with a real named coach rather than an abstraction.
    coachId: openingCoachId(seed, profile),
    // Default OFF - the automatic rule is that competition weeks are not coach weeks.
    coachOnEventWeeks: false,
    // ...and the junior half is OFF under the same rule, which is also what every career shipped
    // before v49 wakes up as. Turning it on is a decision the player takes on screen T, warned.
    coachOnJuniorEvents: false,
    vacations: [],
    practices: [],
    recoveryBuff: null,
    // W4: nothing hurts yet, and nothing is on her record. Week 1 is the earliest a knock can arrive
    // (rollKnock runs after the week's work), which is right - she has to train before she can pull
    // something doing it.
    knock: null,
    knockHistory: [],
    // ⭐ v48: no birthday has been lived yet. Her FIRST one lands on whatever week the calendar puts
    // it – a girl born in February has it inside the opening month, a December girl waits eleven.
    birthdays: [],
    // v32: nobody has written to her yet, and nobody can until she has put a season in front of
    // them. The first review is the season boundary at week 52 - the same moment the academy makes
    // up its mind, and for the same reason.
    offers: [],
    milestones: [],
    internationalEntryWeeks: [],
    proEntryWeeks: [],
    // The penalty ledger and the tour's own sentence (v38, W3-ACT2 §6). A fresh career owes the
    // tour nothing and is not serving anything - both are the identity, so the migration's back-fill
    // is the same pair.
    penalties: [],
    suspendedUntilWeek: null,
    // v37: the shipped rung on every line. She turns up with the frame most juniors own - the ladder
    // runs one rung below it and two above, and which way she goes is the parent's money.
    kit: defaultKitState(),
    // W2-ENDINGS (v39). Every one of these is the identity: the story has a next week, the family is
    // solvent, nothing has been earned or spent, nobody has been asked anything and she has not been
    // to college. The migration's back-fill is the same set, for the same reason.
    ending: null,
    debtSinceWeek: null,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    fork: null,
    retirementOffer: null,
    oneMoreYearCount: 0,
    college: null,
    // v59: no masseur on day one – he is pro-career gated, and the hire is a decision, never a
    // default. ⚠ LAST KEYS OF THE LITERAL, deliberately: the frozen-career identity in
    // tests/coach-travel-edge-older-schemas.test.ts reproduces the pre-v59 hashes by dropping
    // exactly these three keys, which only works while the rest of the serialisation order is
    // untouched. (The peel itself is `careerHashAtSchema` in tests/coachTravelEdgeFixtures.ts,
    // which that file and tests/coach-travel-edge.test.ts share.) The dial opens on the middle
    // rung (the professional default the pricing is anchored to) and the travel stance opens
    // OFF – the coach's own default: the switch is what buys the seat.
    masseurHired: false,
    masseurSessionsPerWeek: ECONOMY.masseur.defaultSessions,
    masseurTravels: false,
    // ⭐ v62 (the long goodbye, step 1): the best her body has ever been. On week 0 that is the body
    // she turned up with – a running maximum's identity element is its first observation, and there
    // is no earlier week to have been better in. `world/phaseGrowth.ts` raises it from here.
    // ⚠ THE HEAD-STARTED BUILD, deliberately: it is `skills` above, which is what the tick will
    // compare against from week 1. Seeding the birth build instead would put the January girl's
    // eleven months of extra training on the wrong side of her own peak.
    // ⚠ LAST KEY OF THE LITERAL, for the reason the masseur's three above give: the frozen-career
    // identity in tests/coach-travel-edge.test.ts reproduces the pre-v62 hashes by dropping exactly
    // this key, which only works while the rest of the serialisation order is untouched.
    peakPhysical: physicalMean(arrival),
    // ⭐ v63 (the shop, slice 1): the family owns nothing on day one. Empty is the identity here in
    // the plainest sense: nothing has been bought yet.
    // ⚠ THIS NOTE USED TO SAY «and the shelf is not even visible – it opens with her professional
    // career (`shopUnlocked`)». Round 29 part two #6 deleted that gate on his ruling («магазин
    // открыт всегда с начала игры»), so the shelf IS visible from week 0 and the family simply owns
    // nothing on it – see the block where the gate stood, in world/shop.ts.
    // ⚠ LAST KEY OF THE LITERAL, for the reason the masseur's three and `peakPhysical` above give:
    // the frozen-career identity reproduces each older schema's hashes by dropping exactly the keys
    // appended since, which only works while every key stays in the order it was appended in. That
    // ladder is asserted across a PAIR since 31.08 – tests/coach-travel-edge.test.ts holds v62-v67,
    // tests/coach-travel-edge-older-schemas.test.ts holds v61 down to v49 – off one shared peel in
    // tests/coachTravelEdgeFixtures.ts.
    assets: [],
    // ⭐ v72 (the private life, wave 1): THE TWO NUMBERS AND WHO SHE IS.
    //
    // ⚠ LAST KEYS OF THE LITERAL, IN THIS ORDER, for the reason `assets`, `peakPhysical` and the
    // masseur's three above give: the frozen-career identities reproduce each older schema's hashes
    // by dropping exactly the keys appended since, and that only works while every key stays in the
    // order it was appended in (`careerHashAtSchema` in tests/coachTravelEdgeFixtures.ts peels them
    // in reverse). The FIELDS are declared beside `condition` in state.ts, where they belong to a
    // reader; the LITERAL order is a serialisation contract and answers to the ladder instead.
    //
    // Both numbers open at their baseline – she is neither happy nor unhappy on week 0, and the
    // parent has neither built anything with her nor broken anything yet. 70 is above spirit's knee
    // (60), so a fresh career plays exactly the tennis it played before this shipped.
    spirit: ECONOMY.spirit.baseline,
    bond: ECONOMY.bond.start,
    // ⚠ THE ONLY DRAW THIS WAVE TAKES, and it is (seed)-keyed: two axis picks off the
    // purpose-scoped `seed:temperament` sub-stream, nothing of the calendar's and nothing of the
    // player's. MAIN is untouched, so the frozen capture (41550 / e6b0c709) cannot see it. The v71
    // -> v72 migration calls THIS SAME function on the career's own seed – see `temperamentFor`.
    // ⭐⭐⭐ v86 (the dynasty, wave 10 T3 – docs/specs/the-dynasty-2026-09.md §7): AND THE MOTHER'S
    // OWN AXIS, WHEN THERE IS A MOTHER. This is the ONE site in the codebase that may ever pass a
    // lean – T3's own sentence, «nothing else may ever pass one» – because it is the one site that
    // is DRAWING a girl rather than re-deriving one that already exists. The v71 -> v72 migration
    // and `expressedTemperamentOf`'s `??` courtesy both call the same function on a career's own
    // seed to recover a girl who was already stored, and a lean there would hand a live save a
    // different daughter from the one in it.
    // ⚠ `?.` AND NOT A BRANCH: absent a dynasty the call is `temperamentFor(seed)` exactly, argument
    // and all, which is what makes the wizard career byte-identical to the one this line always
    // built. The draw count does not move either way (§7's law, pinned in wave10-heredity §A).
    temperament: temperamentFor(seed, dynasty?.motherTemperament),
    // ⭐ v73 (the private life, wave 2): EVERY LIFE BEAT THIS CAREER HAS LIVED, and on week 0 that is
    // none. Empty is the identity here in the plainest sense – there is no earlier week to have said
    // anything in – which is also exactly what the v72 -> v73 migration back-fills on every older
    // save, so a migrated career and a fresh one are the same shape at the moment they load.
    //
    // ⚠ LAST KEY OF THE LITERAL, for the reason `spirit`/`bond`/`temperament`, `assets`,
    // `peakPhysical` and the masseur's three above give: the frozen-career identities reproduce each
    // older schema's hashes by dropping exactly the keys appended since, and that only works while
    // every key stays in the order it was appended in (`careerHashAtSchema` peels in reverse).
    lifeLog: [],
    // ⭐ v74 (the private life, wave 3): EVERY ATTACHMENT THIS CAREER HAS LIVED, and on week 0 that
    // is none – she is eight. Empty is the identity in the plainest sense, and it is exactly what
    // the v73 -> v74 migration back-fills on every older save, so a migrated career and a fresh one
    // are the same shape at the moment they load.
    //
    // ⚠ NOW THE LAST KEY OF THE LITERAL, and `lifeLog` above has stopped being it – the same
    // handover `peakPhysical` made to `assets` and `assets` to the wave-1 three. The frozen-career
    // identities reproduce each older schema's hashes by dropping exactly the keys appended since,
    // so every key must stay in the order it was appended in (`careerHashAtSchema` peels in
    // reverse, newest first).
    loveEpisodes: [],
    // ⭐ v75 (the private life, wave 4): NOTHING HAS ENDED, and on week 0 nothing could have – she is
    // eight and there is nobody to lose. `null` is the identity here in the plainest sense, and it is
    // exactly what the v74 -> v75 migration back-fills on every older save, so a migrated career and
    // a fresh one are the same shape at the moment they load.
    //
    // ⚠ NOW THE LAST KEY OF THE LITERAL, and `loveEpisodes` above has stopped being it – the same
    // handover `lifeLog` made to `loveEpisodes` one wave down, and `peakPhysical` to `assets` before
    // that. The frozen-career identities reproduce each older schema's hashes by dropping exactly the
    // keys appended since, so every key must stay in the order it was appended in
    // (`careerHashAtSchema` peels in reverse, newest first).
    spiritShock: null,
    // ⭐ v76 (the psychologist's year, wave 5): NOBODY IS ON THE PAYROLL, NO YEAR HAS BEEN CHOSEN, AND
    // HER EXPRESSION IS HER NATURE. On week 0 every one of the six is its own identity element and not
    // a placeholder for one: she is eight, the seat unlocks with the professional career, and a
    // leaning of 0 means «expression equals nature», which is what a girl who has lived no seasons
    // has always been. All six are exactly what the v75 -> v76 migration back-fills on every older
    // save, so a migrated career and a fresh one are the same shape at the moment they load.
    //
    // ⚠ THE RUNG OPENS ON THE MIDDLE ONE (1) WHILE NOBODY IS HIRED, which is the masseur dial's own
    // precedent five keys up (`masseurSessionsPerWeek`, the middle rung, on a career with no masseur):
    // a dial has to read something, the shipped default is the only answer that invents no decision,
    // and it is meaningless until `psychologistHired` is true.
    //
    // ⚠⚠ RE-AIMED BY T2 AT `ECONOMY.psychologist.defaultRung`, AND THE PARAGRAPH IT REPLACES IS WHY
    // THE NOTE STAYS. T1 wrote the literal `1` here and argued it: «the masseur's line above reads
    // `ECONOMY.masseur.defaultSessions` because his dial holds a TUNABLE VALUE (2 / 4 / 7 sessions);
    // this field holds a rung INDEX … `ECONOMY.psychologist` is T2/T4-T7's block and T1 does not open
    // it: a constants home with one structural key in it would have to be moved the moment its real
    // contents arrive.» The second clause was the load-bearing one and T2 is exactly the step that
    // ends it – the block now exists and carries the three rungs' prices – so the first clause loses
    // its reason: the masseur's precedent is `defaultSessions` beside `rungs`, and `defaultRung`
    // beside `rungs` is that precedent followed rather than argued away. Nothing about the VALUE
    // moved; one literal became a read of the constant that means it.
    //
    // ⚠ THE v75 -> v76 MIGRATION STILL WRITES THE LITERAL `1` AND MUST, which is v59's own shape
    // verbatim (`createWorld` reads the constant, the migration writes `4`) and is the stronger rule
    // of the two: a shipped migration must not change what it back-fills because somebody later
    // retuned a constant. Keep the two in step – the constant's own comment says the same thing from
    // the other end.
    //
    // ⚠ NOW THE LAST KEYS OF THE LITERAL, IN THIS ORDER, and `spiritShock` above has stopped being the
    // last – the same handover `loveEpisodes` made to it, `lifeLog` to `loveEpisodes` and `assets` to
    // the wave-1 three. Six keys in ONE append, peeled in one destructure for the reason the wave-1
    // three are: they arrived together, in this order, and object rest preserves the relative order of
    // everything it keeps. The frozen-career identities reproduce each older schema's hashes by
    // dropping exactly the keys appended since, so every key must stay in the order it was appended in
    // (`careerHashAtSchema` in tests/coachTravelEdgeFixtures.ts peels in reverse, newest first).
    psychologistHired: false,
    psychologistRung: ECONOMY.psychologist.defaultRung,
    psychologistFocus: null,
    psychologistFocusSeason: null,
    // ⚠ TWO OBJECTS AND NOT FOUR FLAT NUMBERS/BOOLEANS, deliberately: the two axes are one model and
    // T7's weekly pass moves both in one step, so a shape that can hold one and forget the other is
    // the desync `accrueSpirit`'s «one weekly function, two numbers» rule refuses one layer down.
    wallsLean: { open: 0, reg: 0 },
    wallsFlipped: { open: false, reg: false },
    // ⭐ v77 (the spotlight, wave 6): SHE HAS NEVER LIVED A WEEK KNOWN, and on week 0 she could not
    // have – she is eight, and the counter only moves while she LIVES known (`newsStandingOf ===
    // 'known'` since D1, 14.09). Zero is the identity
    // here in the plainest sense and not a placeholder for one, and it is exactly what the
    // v76 -> v77 migration back-fills on every older save, so a migrated career and a fresh one are
    // the same shape at the moment they load.
    //
    // ⚠ NOW THE LAST KEY OF THE LITERAL, and `wallsFlipped` above has stopped being it – the same
    // handover the wave-5 six made to it, `spiritShock` to them, `loveEpisodes` to `spiritShock` and
    // `lifeLog` to `loveEpisodes`. The frozen-career identities reproduce each older schema's hashes
    // by dropping exactly the keys appended since, so every key must stay in the order it was
    // appended in (`careerHashAtSchema` in tests/coachTravelEdgeFixtures.ts peels in reverse, newest
    // first). ⚠⚠ v77's OTHER FOUR FIELDS ARE NOT HERE AND CANNOT BE: they live on `LoveEpisode`
    // ROWS, written at the one `loveEpisodes.push` in world/lifeBeat.ts, which is why that version is
    // the first this ladder has ever had to peel INSIDE a list.
    spotlightHabituation: 0,
    // ⭐⭐⭐ v78 (round 42 #35 + #45): THE PSYCHOLOGIST HAS CARRIED HER NOWHERE YET, AND NOBODY IS IN
    // THE SPARRING SEAT. Zero is the identity here in the plainest sense: `composureBonus` is
    // HEADROOM above her rolled ceiling, and on week 0 nothing has bought her any – so
    // `composureCeilingOf` returns `potential.composure` exactly and `growWeek` is byte-identical to
    // every week this engine has ever grown. The sparring pair is `false` and the middle rung, which
    // is `masseurHired`/`masseurSessionsPerWeek` and `psychologistHired`/`psychologistRung` above.
    //
    // ⚠ NOW THE LAST THREE KEYS OF THE LITERAL, and `spotlightHabituation` has stopped being the
    // last – the same handover it took from `wallsFlipped`, the wave-5 six from `spiritShock`, and
    // so on down. Appended in THIS order, which is the order `careerHashAtSchema` peels them off in
    // (reverse, newest first). ⚠⚠ v78's FOURTH FIELD IS NOT HERE AND CANNOT BE: `entries` lives on
    // `OwnedAsset` ROWS, written at the three `assets.push` sites in world/shop.ts, so this version
    // is the second – after v77 – whose peel has to reach inside a list.
    composureBonus: 0,
    sparringHired: false,
    // ⚠ THE LITERAL `1` AND NOT A CONSTANT, ON PURPOSE. Every other seat's default reads its own
    // `ECONOMY` block (`ECONOMY.psychologist.defaultRung` two screens up), and the sparring seat has
    // no block yet – it is bundle 13's, with the ladder and the prices. Borrowing the
    // psychologist's dial to avoid a literal would tie two seats' defaults together for cosmetic
    // reasons, and the next author would have to untie them. When §4's rungs land, this becomes
    // `ECONOMY.sparring.defaultRung` and the migration's back-fill stays whatever it shipped as.
    sparringRung: 1,
    // ⭐⭐⭐ v79 (the chemistry wave C1 + round 42 #48): SHE HAS WORKED WITH NOBODY, AND NOBODY IS
    // TRAVELLING. `{}` is exactly true on week 0 in the plainest possible sense - a row is written on
    // the first week she trains with a man, and on week 0 she has trained with none of them. It is
    // the same literal the migration back-fills with, and for the same reason rather than by
    // coincidence: a career that predates the mechanic accrued nothing with anybody because there was
    // nothing to accrue. `sparringTravels` is `false`, which is `sparringHired` above.
    //
    // ⚠ AND THESE TWO HAVE STOPPED BEING LAST IN THEIR TURN - the same handover `spotlightHabituation`
    // took from `wallsFlipped` and the wave-5 six took from `spiritShock`. Appended in THIS order,
    // which is the order `careerHashAtSchema` peels them off in (reverse, newest first).
    sparringTravels: false,
    coachPairs: {},
    // ⭐⭐⭐ v80 (wave F1): SHE IS EXACTLY THE PLAYER HER RESULTS SAY SHE IS, which on week 0 is the
    // only thing 0 can mean - she has no results. 0 is the IDENTITY for this number and not a
    // placeholder for one (`composureBonus`'s own v78 rule, five keys up): `formComposureDelta(0)`
    // is an exact 0 and `kidMatchPlayerFor` takes the early return it has always taken, so a fresh
    // career and a migrated one are byte-identical here until a match or a gap moves her. It is the
    // same literal the v79 -> v80 migration back-fills with, and for the same reason rather than by
    // coincidence.
    //
    // ⚠ AND IT HAS STOPPED BEING LAST IN ITS TURN – the same handover `coachPairs` made to it one
    // version ago. Same peel order (reverse, newest first), same line in `careerHashAtSchema`.
    form: 0,
    // ⭐⭐⭐ v82 (round 42 #51): NOTHING HAS BEEN AGREED YET, and `null` is exactly true on week 0
    // whichever way the profile went – a self-coaching family has nobody to have a contract with,
    // and a family that opens WITH a coach has one only from the moment the till first meets him.
    //
    // ⚠ IT IS NOT SETTLED HERE, AND THAT IS ONE WRITER RATHER THAN THREE. `settleCoachDeal` runs
    // inside `resolveBaseCosts` on every week, so the opening hire, a mid-career hire and the first
    // tick after the v81 -> v82 migration all get their contract written by the SAME line – and none
    // of the three can be the one somebody forgets. A save exported before the first tick carries
    // `null`, which is honest: the family has a coach and has not yet been billed for him.
    //
    // ⚠ AND IT HAS STOPPED BEING LAST IN ITS TURN – the same handover `form` made to it one version
    // ago. Same peel order, same line in `careerHashAtSchema`.
    coachDeal: null,
    // ⭐⭐⭐ v84 (the album's one schema move – docs/specs/the-album-2026-09.md §3, ruled path (а)
    // 19.09): THE CHILDHOOD'S OWN RECORD, OR HONESTLY NOTHING. This is the ONE writer – the compact
    // slice of the finished run rides the handover (`PrologueHandover.trace`, built by `traceOf` in
    // src/prologue/run.ts) and is copied onto the world here, once, at the career's birth. A wizard
    // career hands over no prologue and a bench probe hands over none either, so both persist the
    // literal `null` the v83 -> v84 migration also back-fills: «no record» is the complete statement
    // about a childhood that was never walked (his «это не страшно»).
    //
    // ⚠ A FRESH COPY, NEVER THE WIRE'S OWN OBJECT: the message that carried it is outside the
    // engine's ownership, and a persisted field must not alias it (the same hygiene `profile` gets
    // through its spread above). `traceOf` already copies on the way out; this copies on the way in,
    // so neither side can reach the other's state.
    //
    // ⚠ AND IT HAS STOPPED BEING LAST IN ITS TURN – the same handover `coachDeal` made to it one
    // version ago. Same peel order, same line in `careerHashAtSchema`.
    prologueTrace: prologue?.trace
      ? {
          picks: { ...prologue.trace.picks },
          entries: { ...prologue.trace.entries },
          opens: prologue.trace.opens.map((o) => ({ ...o })),
        }
      : null,
    // ⭐⭐⭐ v85 (the pregnancy and the return, wave 8 T1 –
    // docs/plans/life-wave-8-builder-2026-09.md §2 T1): SHE IS NOT EXPECTING AND HAS NO CHILDREN,
    // which on week 0 is the only thing these two can mean – she is eight. `null` and `[]` are the
    // IDENTITY here in the plainest sense and not placeholders for one (`composureBonus`'s own v78
    // rule, and `spotlightHabituation`'s v77 sentence this inherits word for word): they are the same
    // two literals the v84 -> v85 migration back-fills with, and for the same reason rather than by
    // coincidence – a career that predates the mechanic carried neither because there was neither to
    // carry – so a migrated career and a fresh one are the same shape at the moment they load.
    //
    // ⚠ AND THIS LINE IS THE WHOLE WRITER SET ON THIS TREE. T1 ships the seats and NO WRITER AT ALL:
    // the hazard that sets `pregnancy` is T2's, the pause T3's, the `children.push` T4's. Nothing
    // here or in any phase of the tick can put another value in either, however long a career runs,
    // which is what the frozen careers measure.
    //
    // ⚠⚠ NOW THE LAST THREE KEYS OF THE LITERAL, IN THIS ORDER – `pregnancy`, `children`, `comeback`
    // – and `prologueTrace` above has stopped being the last, the same handover it took from
    // `coachDeal` and `coachDeal` took from `form`. Three keys in ONE append, peeled in one
    // destructure for the reason the wave-1 three are: they arrived together, in this order, and
    // object rest preserves the relative order of everything it keeps. ⚠ THE ORDER IS LOAD-BEARING:
    // the frozen-career identities reproduce each older schema's hashes by dropping exactly the keys
    // appended since, so every key must stay in the order it was appended in (`careerHashAtSchema` in
    // tests/coachTravelEdgeFixtures.ts peels in reverse, newest first – `comeback`, then `children`,
    // then `pregnancy`). ⚠ AND LOAD-BEARING FOR THE LITERAL AND THE LIVE FREEZE, NOT FOR THE PEEL –
    // T1's own correction, measured by its ARM 5 and kept true here: the peel names every one of
    // these keys in ONE destructure, so it removes them whichever order they were written in and the
    // rollback identity is genuinely order-insensitive. What the order decides is
    // `JSON.stringify`'s output for the LIVE world, which is what the live hashes are taken over.
    pregnancy: null,
    children: [],
    // ⭐⭐⭐ v85's THIRD KEY, added after gate 2 (20.09 – task T2½ piece 1): SHE HAS NOT PAUSED AND HAS
    // NOT COME BACK, which on week 0 is the only thing it can mean. `null` is the IDENTITY here in
    // the same plainest sense the two literals above it are, and it is the same literal the v84 ->
    // v85 step back-fills with – so a migrated career and a fresh one stay the same shape at the
    // moment they load, which is the claim `tests/wave8-pregnancy-schema.test.ts` §C makes.
    //
    // ⚠ AND THIS LINE IS THE WHOLE WRITER SET FOR THIS KEY ON THIS TREE – a claim the two keys above
    // it can no longer make, because T2 landed and `rollPregnancy` writes `pregnancy`. T6 – the
    // return – is the ONE writer `comeback` will ever have; nothing here or in any phase of the tick
    // can put another value in it, however long a career runs, which is what the frozen careers
    // measure.
    comeback: null,
    // ⭐⭐⭐ v86 (the dynasty, wave 10 T2): WHOSE DAUGHTER SHE IS, OR NOBODY'S. `null` is every career
    // the game has ever created and every career a wizard or a bench opens today – the IDENTITY in
    // the plainest sense, and the same literal the v85 -> v86 step back-fills with.
    //
    // ⚠⚠ THIS LINE IS THE WHOLE WRITER SET, FOREVER. Nothing in any phase of the tick may write
    // `world.dynasty`: the record is what the mother's career WAS, frozen at the hand-over, and a
    // later writer would make the line's own history editable by the life it is living now.
    //
    // ⚠ A FRESH COPY, NEVER THE WIRE'S OWN OBJECT – `prologueTrace`'s hygiene four keys up, for the
    // same reason: the message that carried the block is outside the engine's ownership, and a
    // persisted field must not alias it.
    //
    // ⚠ `ancestorSeed` IS RECOVERED FROM `childSeed` RATHER THAN CARRIED TWICE. The block's seed is
    // `${root}:dynasty:${generation}` by construction, and `ancestorSeedOf` is `childSeedFor`'s exact
    // inverse – one spelling of the format, in world/endings.ts, with its own note.
    //
    // ⚠⚠ NOW THE LAST KEY OF THE LITERAL and `comeback` has stopped being it, the same handover
    // `prologueTrace` made to v85's three. ⚠ THE ORDER IS LOAD-BEARING for `JSON.stringify`'s output
    // on the LIVE world, which is what the live frozen-career hashes are taken over;
    // `careerHashAtSchema` peels in reverse, newest first, so `dynasty` comes off ahead of them.
    dynasty: dynasty
      ? {
          generation: dynasty.generation,
          ancestorSeed: ancestorSeedOf(dynasty.childSeed, dynasty.generation),
          raisedOnTour: dynasty.raisedOnTour,
          motherName: { ...dynasty.motherName },
          motherTemperament: dynasty.motherTemperament,
          motherCareer: { ...dynasty.motherCareer },
        }
      : null,
    // ⭐⭐⭐ v87 (the weight, wave 11 T1 – docs/specs/the-weight-2026-09.md §1): THE SWITCH, AS THE
    // CREATION ASK ANSWERED IT, and the two empty lists a career that has lived no week must have.
    //
    // ⚠⚠ `?? false` IS THE RULED DEFAULT AND NOT A DEFENSIVE `??`. «Absent means the ask's default,
    // never silently on» – so every caller that does not ask (the benches, the sims, the e2e
    // fixtures, `tests/helpers/career.ts`, forty tools) creates the career it has always created,
    // and the byte-identity arm of §8 row 6 is a property of the code rather than of a policy.
    // ⚠ IT IS ALSO THE SAME LITERAL THE v86 -> v87 MIGRATION BACK-FILLS, and here that agreement is a
    // COINCIDENCE rather than a reason – the two lines answer different questions («nobody asked
    // this save» against «this caller did not ask»), and `SAVE_SCHEMA_VERSION`'s own block says so.
    //
    // ⚠ THE TWO LISTS ARE `[]` FOR `children`'s PLAINEST REASON: she is eight, and nothing has
    // happened to anybody yet. Same literals the migration back-fills with, and this time for the
    // same reason rather than by coincidence.
    //
    // ⚠⚠ NOW THE LAST THREE KEYS OF THE LITERAL, IN THIS ORDER, and `dynasty` has stopped being the
    // last – the same handover it took from `comeback` and `prologueTrace` took from `coachDeal`.
    // Three keys in ONE append, peeled in one destructure: they arrived together, in this order, and
    // object rest preserves the relative order of everything it keeps. `careerHashAtSchema`
    // (tests/coachTravelEdgeFixtures.ts) peels in reverse, newest first, so these come off ahead of
    // `dynasty`.
    weightEnabled: weightEnabled ?? false,
    pregnancyLossWeeks: [],
    bereavementWeeks: [],
  }
  addEvent(world, {
    week: 0,
    type: 'info',
    keep: true,
    // ⭐ ROUND 37 – HIS RULING, 06.09: «по умолчанию округлять, нам вроде бы нигде в интерфейсе не
    //   нужна такая точность, но в расчетах использовать корректно без округления». The hand-rolled
    //   form printed whatever `fundsCents / 100` came to, and since the childhood prologue landed,
    //   `prologueFundsCents` rounds to whole CENTS – so 32 of 75 sampled openings read «$29,583.33».
    //   `formatCents` is the rule he stated: whole dollars on screen, cents untouched in the world.
    text: `${profile.kidName}'s career started (seed "${seed}"). Family budget: ${formatCents(fundsCents)}.`,
  })
  ensureSeason(world)
  recomputeKidRank(world)
  world.seasonStartRank = world.kidRank // R12-S1 – see the field above
  return world
}

/** Hydrate the Phase-3 systems onto a pre-v6 save. Idempotent for v6+. */
export function seedWorldForV6(save: Partial<WorldState> & { seed: string; week: number; log?: string[] }): void {
  save.cohort = generateCohort(save.seed)
  save.results = []
  save.entries = []
  save.internationalEntryWeeks = []
  save.proEntryWeeks = []
  save.penalties = []
  save.suspendedUntilWeek = null
  save.season = []
  save.nextEventId = 0
  const oldLog = Array.isArray(save.log) ? save.log : []
  save.events = oldLog.map((text) => ({ id: save.nextEventId!++, week: save.week, type: 'info' as const, text }))
  save.kidRank = save.cohort.length + 1
  save.pendingTournament = null
  save.bestFinishByTier = {}
  save.lastSeasonSummary = null
  save.seasonHistory = []
  save.seasonWins = 0
  save.seasonLosses = 0
  save.financeWeeks = []
  save.condition = ECONOMY.condition.start
  save.injury = null
  save.injuryHistory = []
  save.physioActive = coachIncludesPhysio(save.profile?.coachTier ?? DEFAULT_PROFILE.coachTier)
  save.coachId = openingCoachId(save.seed, save.profile ?? DEFAULT_PROFILE)
  save.coachOnEventWeeks = false
  save.vacations = []
  save.practices = []
  save.recoveryBuff = null
  save.milestones = []
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  // R12-S1 (v17): a pre-v6 save carries no season history at all, so the honest value for "the rank
  // she entered this season on" is the one the rebuilt world has right now.
  save.seasonStartRank = save.kidRank ?? null
  delete save.log
}
