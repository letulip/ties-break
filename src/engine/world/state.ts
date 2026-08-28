// ⭐ R2-10 STEP 1 – THE PERSISTED SCHEMA, MOVED WITHOUT TOUCHING SERIALISATION.
//
// `WorldState`, `PendingTournament` and `SAVE_SCHEMA_VERSION` DECLARE themselves here now; they were
// declared in `../world.ts` and are re-exported from it under their historical names, so all ~320
// files importing them from `engine/world` are untouched (CLAUDE.md: "that public API must not
// change"). Every comment below moved VERBATIM – they carry owner rulings and the version ladder.
//
// ⚠ NOTHING ABOUT THE SAVE CHANGED, AND THAT IS THE WHOLE CLAIM. Two interfaces are TYPES: erased at
// compile time, so they cannot reach a byte of `JSON.stringify`. Key ORDER follows the object
// literal in `createWorld`, which did not move and was not touched. The version THIS EXTRACTION
// carried across was 59, unchanged by it – no field was added, removed, renamed or retyped, and no
// migration was owed by the move. Proved rather than asserted: the three careers of
// tests/coach-travel-edge.test.ts hash byte for byte across this commit.
//
// ⚠ THE ABSOLUTE NUMBER USED TO LIVE IN THAT SENTENCE AND IT ROTTED (round 26, 26.08): the prose
// still read «is 59, the same 59» at v61. `scripts/doc-facts.mjs` sources the version from the
// CONSTANT below, which is why the gate stayed green over a false line – a script that reads the
// fact cannot police the prose beside it. The claim above is now about the EXTRACTION, which cannot
// go stale; the live version is the constant and nowhere else.
//
// ⚠ IT IS A LEAF AND MUST STAY ONE. Every import below is `import type`, so this module has NO
// runtime edge at all – the one runtime thing in it is a number literal. That is what lets
// `world/*.ts` keep importing `WorldState` through the barrel without a cycle, and what would break
// the moment a value import arrived here.
import type { MainRngState } from '../rng'
import type {
  BirthdayRecord,
  CareerEnding,
  CareerTotals,
  CollegeState,
  FinanceWeek,
  ForkState,
  Knock,
  KnockRecord,
  KitState,
  Milestone,
  Offer,
  PenaltyRow,
  PlayerProfile,
  OwnedAsset,
  PracticeBooking,
  RecoveryBuff,
  RetirementOffer,
  SeasonEntryLedger,
  SeasonHistoryEntry,
  SeasonSummary,
  SnapshotInjury,
  TierTrophies,
  VacationBooking,
  WeekPlan,
  WorldEvent,
} from '../../shared/protocol'
import type { MatchPlayer } from '../match/types'
import type { AiPlayer, LadderTrack, SeasonEvent, TierId, TournamentResult } from '../season/types'
import type { SeasonResult } from '../season/ranking'
import type { KidSkills } from '../development'
import type { AcademySupport } from '../academy'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md).
//
// ⚠ THE RNG REGIME CHANGED AT v35 (docs/review/proposals/P3-rng-persistence.md). The MAIN stream's
// position is now PERSISTED PER CAREER (`rngMain: {s, n}` below): a load verifies the pair and
// resumes — it no longer rebuilds the position by replaying every week ever played. Two things
// follow, and they are different claims:
//   * INPUT-INDEPENDENCE IS STILL LAW, proved as pairwise A/B — a no-action run and an
//     action-laden run under the same code must tap identical MAIN sequences (player choices
//     cannot re-roll the world's dice). That is a fairness property and it is permanent.
//   * CROSS-VERSION DRAW-COUNT STABILITY IS NOT REQUIRED ANY MORE. The frozen capture
//     (41550 / e6b0c709, tests/condition.test.ts B1) is a documented measurement now, not a
//     change-gate: a wave that legitimately adds a MAIN draw updates the pin and moves on,
//     because no loaded career depends on the historical count being reproducible — each carries
//     its own position.

// v36 = W2-LADDER's `proEntryWeeks` (the pro AER ledger); v37 = W3-KIT's quality ladder (`world.kit`).
//
// ⚠ v38 = W3-ACT2's PENALTY LEDGER (`penalties` + `suspendedUntilWeek`), and it takes the number
// act2-pro-tour.md §9 had reserved for psyche. The §9 renumbering («v36 = W2-LADDER, v37 = endings,
// v38 = psyche») was written before W3-KIT and the endings wave landed in a different order, so the
// reservations had already drifted by one; versions are allocated on arrival, not booked, and the
// append-only migration ladder is what makes that safe. Endings and psyche take the next free
// numbers when they ship.
// ⚠ v40 = ONE FIELD, `careerTotals.weeksLostToInjury` – the monotone total of weeks her body has
// spent off court (docs/specs/fatigue-injury-audit-2026-08.md §6). It exists because
// `injuryHistory` is pruned to twenty rows and the career-ending injury is keyed on their SUM, so
// the rule was measurably getting HARDER the more layoffs a career collected. Post-draw state end to
// end: nothing here touches any stream, and the frozen MAIN capture (41550 / e6b0c709) cannot see it.
// ⚠ v45 = ONE FIELD, `seasonEntries` – the season's entry ledger, and it is v40's argument arriving on
// a different ledger. `world.results` prunes at 52 weeks, so "could a title at this rung have entered
// the book she held that week" is unanswerable three weeks after the fact; the wrap-up needs it a year
// later. So it is captured in the branch that commits the entry, exactly as `weeksLostToInjury` is
// counted in the branch that ends a layoff (docs/specs/season-mirror-2026-08.md). Pure state, zero
// draws on any stream – the frozen MAIN capture cannot see it either.
// ⚠ v46 = ONE FIELD, `seasonHistory[].byTrack` – a finished season told apart by table, and it is a
// SCHEMA change because it could not be anything else. The Stats screen showed the identical
// season-by-season table under all three tabs (the owner, twice, most recently 09.08), and no work on
// that screen could have fixed it: the record carried one rank and three folds, so the tabs had nothing
// to differ by. What v46 adds is a per-track {endRank?, points, wins, losses} beside them, banked at the
// wrap-up off ledgers that are about to be pruned or reset. Rows banked BEFORE it carry no per-track
// figures and none are invented – see the v45 -> v46 step in migrations.ts. Pure state, zero draws on
// any stream: the wrap folds ledgers that already exist, so the frozen MAIN capture cannot see it.
// ⚠ v47 = ONE FIELD, `plan.week` – SEVEN DAYS OF SESSION KINDS, and it is the slice where the calendar
// stops being a drawing of a scalar and becomes the plan (docs/specs/training-dials.md). The owner:
// «у нас есть расписание недели и на каждый день там идут разные тренировки – это и есть ручки».
// `train`/`rest` are KEPT and become a projection of the ticked week (4/5/6 sessions -> 60/75/85), so
// all four engine readers of `plan.train` are byte-identical and the migration is a pure default: a
// v46 career lays down `sessionsForPlan` days of `general`, which is exactly the week `growWeek` has
// been running since week one. Pure state, zero draws on any stream. The one BEHAVIOURAL change rides
// on the same field and is ruled rather than implied – `summerLoadFactor` now follows the doubling
// instead of the calendar (owner, 10.08: «да»), so a migrated career's school-free weeks come back at
// 1.0 until he ticks a second session onto a day. See engine/world/summer.ts and the v46 -> v47 step.
// ⭐ v48 = ONE FIELD, `birthdays` – ONE ROW PER BIRTHDAY, and it is the whole persisted footprint of
// docs/specs/birthday-and-gifts.md. The week, the age she turned, what she had been asking for and
// what was chosen. The DIARY reads it; nothing else does – no morale, no condition, no mood modifier,
// because that system does not exist yet and this slice only lays the ground (owner, 11.08: «мораль и
// психологи у нас в будущем, так что сейчас можно просто подготовку сделать»). It is a SCHEMA change
// because it could not be anything else: the choice is a decision the player made, and a decision that
// evaporates on reload is not one – the same argument that made `knock.choice` v26's only field.
// ⚠ THE MIGRATION IS A PURE DEFAULT, `[]`, AND THAT IS "no birthdays recorded" RATHER THAN "gave
// nothing every year". Absent is not zero – the distinction v45 and v46 were both built around, and
// spec ship rule 5. Zero draws on any stream (the ask rides a purpose-scoped `seed:birthday:<age>`
// sub-stream and persists nothing), so the frozen MAIN capture cannot see this either.
// ⚠ AND THE NUMBER IS 48, NOT THE 49 THE SPEC SAYS. The spec was written assuming the flags/grant wave
// would take 48, but that wave is still documents and nothing has claimed 48 in code – so this takes
// 48 and docs/plans/wave-flags-grant.md now reserves 49. Two waves must not both take one number.
// ⭐ v49 = ONE FIELD, `coachOnJuniorEvents` – DOES HE TRAVEL TO THE RUNGS THAT PAY HER NOTHING TOO.
// The owner, 15.08, asked for the fare gate to become the player's decision rather than the engine's:
// «делаем тогда», and the model is his own – «По мне игрок сам решает: есть деньги - едет тренер, нет
// - не едет, или едет, но быстрее банкротится.» So the junior/domestic rungs stop being refused and
// start being OPT-IN, with no protective gate on the outcome: bankruptcy is the player's own
// responsibility (his standing ruling), and what is controlled instead is that no support mechanism
// pays for it (`coachTravelFareFor`, and tests/support-never-pays-the-coach.test.ts).
// ⚠ 17.08: and at the JUNIOR rungs this field opens, that is still absolute - nothing reaches his
// seat there, contract included. A sponsor's travel share does now reduce it, but only at the rungs
// that pay prize money («только для профессиональной лиги»), which is the one place these two fields
// stay cleanly apart. §2 of that test file is the guard.
// ⚠ IT IS A SECOND FIELD AND NOT A RETYPING OF `coachOnEventWeeks`, deliberately. A scope union
// («none | w-series | all») reads cleaner on paper and would have retyped a field persisted since
// v24 and touched every reader of it; a second optional boolean defaulting FALSE leaves every existing
// save byte-identical in behaviour and every existing reader untouched. On screen it is a NESTED
// option, meaningful only while the first is on, which is also what it is: a second, more expensive
// choice. Pure state, zero draws on any stream – the frozen MAIN capture cannot see it.
// ⚠ AND IT TAKES 49 UNDER THE RULE THE v48 NOTE ABOVE STATES: whoever lands in code first owns the
// number. The flags/grant wave is still documents, so docs/plans/wave-flags-grant.md now reserves 50.
// ⭐ v54 = ONE FIELD, `kidFundsCents` – HER OWN BANK ACCOUNT (round-23 #18). The owner: «после
// появления её счета в банке в 18 начать ей призовые переводить какие-то суммы, например начать с
// 10-20% и может быть наращивать год к году», capped on his own widening – «может не до 30, а до 40
// или 50 вообще, это всё-таки ее карьера?». `ECONOMY.kidShare` is the ramp; `finalizeTournament`
// splits the cheque; the migration back-fills ZERO and invents no history (a career that reached
// this build has never made a transfer, and re-deriving eight years of them is impossible anyway –
// `financeWeeks` prunes at sixty weeks). Pure state, zero draws on any stream, so the frozen MAIN
// capture cannot see it.
// ⭐⭐⭐ v55 – THE STRANDED REVEAL, CLEARED ON LOAD (round 24, the freeze's hygiene). It is a REPAIR
// and not a shape: no field is added, removed or renamed. A career that came out of the college
// freeze holding a `pendingTournament` whose event is no longer on the calendar cannot be played at
// all, and cannot be RESCUED from inside the app either – `pendingView` returns undefined when
// `eventById` misses, so the snapshot's `pending` is null, so `TournamentFlow` never mounts, the
// sticky bar never draws its resume button, and `advanceWeeks` returns 'tournament' with no tick and
// no toast ('tournament' is deliberately absent from `STOP_REASON_TEXT` because the overlay owns it).
// Measured on the owner's own w474 save: season 0, results 1, `pendingTournament` 5-w270-wta500
// finished, `snapshot.pending` NULL. Rules 1-3 stop new careers reaching that state; this is the one
// door already-broken ones can come back through. See the migration for what it does and does not do.
// v58 (round 24 #5): `fork.departsWeek` – the college answer RESERVES a place and she departs on the
// next academic year's September; see the migration and docs/specs/college-departure-2026-08.md.
// v59 (the travelling team, steps 1+2): `masseurHired` – the first staff seat beyond the coach,
// pro-career gated, salary + body effect in world/masseur.ts; false for every earlier save (the
// seat did not exist). ⚠ EXTENDED IN PLACE BY STEP 2 ON THE SAME UNMERGED BRANCH (22.08) – v59 has
// never reached a player, so append-only does not bind it yet: `masseurSessionsPerWeek` (the
// owner's sessions dial, 4 = the middle rung for every earlier save) and `masseurTravels` (the
// travel stance, false – the switch is what buys the seat) ride in the same migration.
// Rows of `injuryHistory` MAY carry `weeksSaved`, written only when he saved something – absent
// everywhere in old saves, so nothing is back-filled; `pendingTournament` MAY carry `masseurThere`
// on a week he made the trip. See docs/specs/the-masseur-2026-08.md.
//
// ⭐⭐⭐ v60 (round 26 #6, THE COLLEGE LEAGUE IS WALKED AND NOT REPORTED): `CollegeState.leagueReveal`
// – two numbers saying where the player is in the championship's reveal. The owner had asked for
// this once already («Я уже просил это сделать»), and round 25 answered it with a summary line plus
// replay buttons on a card, which is exactly «сообщили постфактум». The reveal makes the year STOP
// on the championship week, the way a tour week stops, and `TournamentFlow` walks it.
// ⚠ NULL FOR EVERY EARLIER SAVE AND NOTHING IS BACK-FILLED: a championship already lived is not
// re-offered, so a career mid-freeze resumes with no reveal open and its NEXT year's gets one.
//
// ⭐⭐⭐ v61 (round 26 #2 second pass, THE HOME UNIVERSITY EXISTS EVERYWHERE): `CollegeQuote.open` is
// REMOVED – the first field this ladder has ever deleted rather than added. The owner, having asked
// twice why the cheapest place was refused: «по-моему в каждой стране есть домашний универ». The
// boolean was false on one rule – the in-state price IS US residence – and that rule shut the rung in
// 23 of the 24 playable countries, on a choice made at onboarding ~440 weeks earlier. He overruled
// the rule, so the field goes with it: an always-true boolean would leave the next reader believing a
// place can be shut and the next edit able to shut one.
// ⚠ THE MIGRATION IS NOT COSMETIC. A career sitting on an unanswered fork carries `state: {open:
// false}`, and `answerFork` filtered on it – so the card would have drawn the home row pressable and
// the engine would have quietly enrolled her at the next place up, $20,000 a year dearer. Deleting
// the key and deleting the filter are one fix in two places.
//
// ⭐⭐⭐ v62 (the long goodbye, step 1): `peakPhysical` – the best her body has ever been, as one
// number, kept as a running maximum by the growth phase. Written every tick and READ BY NOTHING YET;
// docs/specs/the-long-goodbye-2026-08.md §3b is what it is for (the last retirement offer will land
// on a share of HER OWN PEAK instead of on her 38th birthday, so that a body kept well plays to 41
// and a wrecked one finishes early).
// ⚠ IT HAD TO BE STATE, and §3b says why the obvious alternative is wrong: reading her current
// physical against `potential` costs nothing and is already persisted, but a girl who never came
// near her ceiling would read as finished while still young. The signal is what she actually
// reached, and nothing in a save remembers that – `growWeek` overwrites `skills` in place.
// ⚠ AND IT IS RECONSTRUCTED, NOT DEFAULTED, FOR AN EXISTING CAREER. See the migration: seeding
// "today" would tell a 38-year-old she is at 100% of her peak. Pure state, zero draws on any
// stream, so the frozen MAIN capture (41550 / e6b0c709) cannot see it.
// ⭐⭐⭐ v63 (the shop, slice 1): `assets` – WHAT THE FAMILY OWNS THAT IS NOT TENNIS
// (docs/specs/the-shop-2026-08.md §5). One array, empty on every career that has ever existed, and
// the ONLY thing this feature persists: the shelf itself is `ECONOMY.shop.catalogue`, a constant, so
// slices 2-7 can add a rung without a migration.
// ⚠ THE BACK-FILL IS EMPTY AND THERE IS NOTHING TO RECONSTRUCT – v26's `knock` case rather than
// v62's `peakPhysical` one. A career that reached this build could not buy anything: there was no
// shelf, no command and no ledger row, so there is no earlier evidence to mine and an invented row
// would hand a family a car it never chose. Pure state, zero draws on any stream, so the frozen MAIN
// capture (41550 / e6b0c709) cannot see it.
// ⭐⭐⭐ v64: `fieldSeasonTitles` – WHO WON EACH AI TOURNAMENT. `runAiTournament` has always computed
// the champion of every canonical bracket and then dropped her on the floor; this is the tally that
// keeps her. Same family, same lifecycle and same argument as v53's `fieldSeasonPoints` one rung
// below – a per-season TALLY, not rows – and it is the second half of the same repair: v53 kept what
// the field EARNED, this keeps what the field WON.
// ⚠ THE BACK-FILL IS EMPTY AND IT IS A PRESERVATION, exactly as v53's was: every career saved before
// this build was played on an engine that discarded the champion, so an empty tally is precisely what
// those seasons contained, and it fills itself from the next tournament week on. Pure post-draw
// bookkeeping – the finish is already decided when it is read – so zero draws on any stream and the
// frozen MAIN capture (41550 / e6b0c709) cannot see it.
export const SAVE_SCHEMA_VERSION = 64



/** A tournament whose outcome is fully computed (byte-identical to the old inline resolution)
 *  but is being REVEALED to the player one round at a time. The week that spawned it is not
 *  closed until the run finalizes. Persisted (schema v8) so a mid-reveal save resumes the flow.
 *  `players` holds the pre-drift skill snapshots of the kid + every opponent she faces, so the
 *  revealed match events are identical no matter how the cohort drifts after this week ticks. */
export interface PendingTournament {
  eventId: string
  result: TournamentResult
  /** kid matches already emitted as News events (0..kidMatches.length) */
  revealedRounds: number
  /** true once the last kid match is revealed and points/summary/rank are committed */
  finished: boolean
  players: Record<string, MatchPlayer>
  /** ⭐ v59 step 2: the masseur MADE THIS TRIP – written in the play arm beside the fare he was
   *  actually charged for (`chargeMasseurTravel`), read once at finalize by `masseurTourRelief`.
   *  Recorded rather than re-derived so a stance flipped mid-reveal cannot buy an effect the fare
   *  never paid for (the round-21 #2 "asked once, carried" doctrine). Absent = he stayed home,
   *  which is what every pre-step-2 save means by not having the key. */
  masseurThere?: boolean
}

export interface WorldState {
  schemaVersion: number
  /** Career this world belongs to. Generated outside the engine (worker/store); the
   *  engine only threads it through. Default here is deterministic so pure callers stay reproducible. */
  careerId: string
  seed: string
  week: number
  /** THE PERSISTED MAIN POSITION (v35): mulberry32's register + the cumulative draw count. The
   *  worker draws through `resumeMain(world.rngMain)`, which mutates this pair in place — so every
   *  autosave carries the live position by construction and a load RESUMES instead of replaying
   *  the whole career. The two fields are redundant on purpose (`s = seed32 + n·STEP mod 2³²`):
   *  the pair is its own checksum, and `mainStateConsistent` is the load-time verifier. Only the
   *  MAIN stream has state at all — every sub-stream is re-derived at its call site from a
   *  purpose-scoped seed string, which is why nothing else needed persisting. */
  rngMain: MainRngState
  fundsCents: number
  /** ⭐⭐ v54 – HER OWN ACCOUNT (round-23 #18), in cents. The owner: «после появления её счета в банке
   *  в 18 начать ей призовые переводить какие-то суммы, например начать с 10-20% и может быть
   *  наращивать год к году».
   *
   *  ⚠ IT IS A SECOND BALANCE AND NOT A COUNTER, which is the whole of the design decision. The
   *  transfer in `finalizeTournament` credits the family its part and her hers, so the cheque the
   *  parent banks genuinely shrinks as she grows – «это всё-таки её карьера». A share that stayed in
   *  `fundsCents` and was merely tallied beside it would cost the player nothing and mean nothing.
   *
   *  ⚠ PERSISTED BECAUSE IT CANNOT BE REBUILT. `financeWeeks` prunes to sixty weeks and `results` to
   *  fifty-two, so by the time she is twenty-six there is nothing left in the save from which the
   *  eight years of transfers could be re-derived – `CareerTotals`' own argument, and invariant 3's.
   *
   *  ⚠ NOTHING SPENDS IT YET. It is hers, it accumulates, and no mechanic in this build draws on it;
   *  the shop in `docs/backlog/the-shop-and-the-broker.md` is the obvious first claimant. */
  kidFundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  /** ~199 AI juniors; drifts weekly (Phase-4 placeholder). */
  cohort: AiPlayer[]
  /** rolling results ledger; pruned to the ranking window. */
  results: SeasonResult[]
  /** rolling calendar: always ≥ 26 future weeks generated. */
  season: SeasonEvent[]
  /** eventIds the kid is entered in. */
  entries: string[]
  /** structured News/Money feed; capped, `keep` survives pruning. */
  events: WorldEvent[]
  nextEventId: number
  /** the kid's dense rank among cohort + kid (cheap-access cache). THE ITF table since the two-ladder
   *  slice - it is the one the international rungs gate on and the one the standings are about. */
  kidRank: number
  /** her rank in the DOMESTIC table, the one she has before she owns an international result at all.
   *  Derived like `kidRank` and cached beside it; a career opened before this field existed simply
   *  recomputes it on the next tick, which is why it needs no migration. */
  kidRankDomestic?: number
  /** her rank in the PROFESSIONAL (WTA) table – the third one, added with the adult rungs (task #17).
   *
   *  Same shape and the same reason as `kidRankDomestic` above: derived, cached beside the other two
   *  by the one writer (`recomputeKidRank`), and OPTIONAL so a career opened before the field existed
   *  needs no migration – it recomputes on the next tick. Note this is not the same question as
   *  "has she turned professional": the fallback (below the whole field) is what a girl who has never
   *  entered a W15 reads, which is why `tierOpenFor`'s wta arm gates on her having a counting result
   *  before it will read this number at all. */
  kidRankWta?: number
  /** kidRank as it stood at the start of the last resolved week; null before any tick (v7). THE ITF
   *  one, because `kidRank` is. */
  prevKidRank: number | null
  /** `kidRankDomestic` as it stood at the start of the last resolved week.
   *
   *  ⚠ IT EXISTS SO A MOVEMENT ARROW CANNOT SUBTRACT ONE TABLE FROM THE OTHER. Home's rank chip shows
   *  whichever ladder she is competing in, and it draws an up/down arrow from (previous - current). With
   *  only `prevKidRank` on the world that arrow would have compared this week's NATIONAL rank against
   *  last week's INTERNATIONAL one - a smaller, quieter version of the exact bug this branch fixes, and
   *  it would have shown a triumphant "↑107" on a week nothing happened. Written beside `prevKidRank`
   *  by the same one writer. Optional, so a career opened before the field existed needs no migration:
   *  it is simply null until the next tick, which the arrow already renders as a neutral dash. */
  prevKidRankDomestic?: number | null
  /** `kidRankWta` as it stood at the start of the last resolved week – the third member of the pair
   *  above, written by the same one writer for the same reason: a movement arrow is
   *  (previous - current) and both halves have to come out of ONE table. Optional, so no migration. */
  prevKidRankWta?: number | null
  /** THE ON-RAMPS SHE HAS ALREADY CROSSED (v34). An on-ramp is a THRESHOLD, not a standing condition.
   *
   *  ⚠ WHY THIS IS STATE AND NOT DERIVED, which is the whole reason for the schema bump. Both
   *  on-ramps are denominated in the table BELOW them - J30 reads her domestic best-6, W15 reads her
   *  ITF junior best-6 - and both of those are ROLLING 52-WEEK windows. So the evidence that she once
   *  cleared the bar deletes itself: a season spent abroad ages out every domestic result, and from
   *  eighteen the J rungs are shut on AGE so no junior point can ever be earned again. Derived, this
   *  question has no honest answer a year later; latched, it has exactly one.
   *
   *  Owner, 31.07, playing: «не может играть в J серии, потому что ранг в national упал» - and
   *  «въезд – это порог, который переходят один раз, а не условие, которое держат постоянно».
   *  Measured before the fix (tools/j30-onramp-lock.ts): 209/216 careers went through the J30 door
   *  and were shut out again, 160/216 of them while J60 or J300 stood OPEN.
   *
   *  ⚠ ACCEPTANCE LISTS DO NOT LATCH, AND MUST NOT. Only the bottom rung of each table is an on-ramp.
   *  J60/J300/W35/W100 are acceptance cuts read against a CURRENT ranking, which is how a real entry
   *  list works - you do not get into a draw on a ranking you held two years ago. The latch guarantees
   *  a way back ONTO the table; it never guarantees a place in a field.
   *
   *  Written by `latchOnRamps`, which rides with `recomputeKidRank` so it cannot be forgotten at a
   *  call site. Pure state: no draw on any stream, so the frozen MAIN capture cannot move. */
  onRampCleared: { itf: boolean; wta: boolean }
  /** R12-S1 (v17): her dense rank as she ENTERED the season currently in progress – captured at
   *  the top of the tick into the season's first week, and read once, at that season's wrap-up.
   *
   *  Persisted rather than derived because it is IRRECOVERABLE by the time it is wanted: the wrap
   *  fires 49 weeks into the season and `pruneResults` keeps only a 52-week trailing window, so the
   *  results that produced this rank are long gone (see maybeFireSeasonWrapUp for the full story of
   *  the "from #1" it used to print). One number per career, overwritten yearly.
   *
   *  null only on a save migrated from a pre-v17 schema mid-season – nothing in such a save can
   *  reconstruct it, and `SeasonSummary.startRank` has always been nullable. */
  seasonStartRank: number | null
  /** HER BUILD, and it MOVES now (v19, Phase 4). Until v18 this was re-derived from `seed:kid`
   *  every time it was asked for, which is why she was exactly as good at week 180 as at week 1.
   *  Seeded from that same derivation so a migrated career does not lurch, then grown weekly by
   *  engine/development.ts. */
  skills: KidSkills
  /** Her ceiling, rolled once from `seed:potential` and never shown (decisions.md #11 – the radar
   *  has axes without numbers). Persisted rather than re-rolled so a save cannot re-roll her
   *  talent, which is the one thing in a career that must not be re-rollable. */
  potential: KidSkills
  /** Her academy scholarship, or null when nobody is backing her (v21). Decided once a year at the
   *  season boundary from what an academy can see – see engine/academy.ts. Persisted because it is
   *  a relationship: it must not re-decide itself between reviews. */
  academy: AcademySupport | null
  /** a tournament being revealed round by round; null when no reveal is in progress (v8). */
  pendingTournament: PendingTournament | null
  /** best (smallest) finish index the kid has ever reached per tier (v10); updated at
   *  tournament finalize. Drives the Home season strip's real tier progress. */
  bestFinishByTier: Partial<Record<TierId, number>>
  /** THE TITLES LEDGER (v31): every title and every LOST final of her career, per tier, as the
   *  absolute weeks they happened in. Written beside `bestFinishByTier` at tournament finalize;
   *  behind the Trophy Cabinet. Full shape and the `finals` warning: `TierTrophies` in protocol.ts.
   *
   *  ⚠ IT IS A NEW FACT, NOT A VIEW OF AN OLD ONE, and every neighbour it might have been derived
   *  from loses the answer on purpose. `bestFinishByTier`, one line up, is a HIGH-WATER MARK: it
   *  keeps 0 or 1, never both, never a count and never a week, and the day she finally wins the
   *  tier it overwrites the silver it was holding. `milestones` keeps FIRSTS (`title:<tier>` is its
   *  whole identity, so a five-time J30 champion has one row). `results` prunes at 52 weeks and
   *  `events` at 400, of which 60 reach a snapshot. Nothing in a save counts anything career-wide,
   *  which is why this had to be stored rather than computed.
   *
   *  Bounded by the number of finals a career can reach - a handful a season at most - so it is
   *  never pruned, and pruning it would defeat the one thing it is for. */
  trophiesByTier: Record<TierId, TierTrophies>
  /** the most recent end-of-season recap (v10); null until the first season wraps up. */
  lastSeasonSummary: SeasonSummary | null
  /** R10-9 (v14): every FINISHED season, oldest first – `lastSeasonSummary` is overwritten each
   *  year, so this append-only list is what makes "how does this season compare to last?"
   *  answerable. One tiny numeric row per SEASON (see SeasonHistoryEntry), written once at
   *  wrap-up (idempotent per year) and pruned to SEASON_HISTORY_CAP, so it can never grow
   *  per-week and the save stays size-safe over a long career. */
  seasonHistory: SeasonHistoryEntry[]
  /** the CURRENT (in-progress) season's kid wins/losses, counted as matches resolve so the
   *  summary never has to re-parse event text and pruning can't lose them (v10). Reset to 0
   *  at each season wrap-up. */
  /** The week a medical withdrawal fired, so advanceWeeks can halt ONCE on it. Derived, not
   *  meaningful state: optional, so every pre-existing save loads unchanged with no migration, and a
   *  reload simply re-derives it on the next tick that withdraws her. */
  medicalWithdrawalWeek?: number
  /** R12-15: the week an entered tournament resolved as a WALKOVER (she was inside her layoff when
   *  it came round). Same shape and the same job as `medicalWithdrawalWeek` above – it forfeits her
   *  entry fee, so the advance must halt on it once and the player must SEE it happen. Derived, not
   *  persisted; a reload re-derives it on the tick that walks her over. */
  walkoverWeek?: number
  seasonWins: number
  seasonLosses: number
  /** THE SAME SEASON W-L, PER LADDER (v28). Written beside the two counters above, never instead of
   *  them – see `Snapshot.seasonRecord` for the owner's ask and `matchesEverPlayed` for why the
   *  totals had to keep their own home.
   *
   *  Optional so a pre-v28 save's `undefined` is a shape the readers already handle; the migration
   *  fills it in (see migrations.ts v28) and `finalizeTournament` maintains it from there. */
  seasonRecord?: Record<LadderTrack, { wins: number; losses: number }>
  /** THE SEASON'S ENTRY LEDGER (v45) – what she entered, and how much of it her book could not take.
   *  Written by `enterEvent`/`releaseEntry`, read and reset by `maybeFireSeasonWrapUp`. Same family as
   *  the two counters above: a per-season running total that only a season boundary clears.
   *
   *  ⚠ CAPTURE, NOT A FOLD, and it is the third surface in a week to need saying so. The judgement is
   *  about the book she held ON THE WEEK SHE ENTERED, and `pruneResults` has deleted that book by the
   *  time the wrap runs (the same 49-week gap that made `seasonStartRank` a persisted capture in v17).
   *  See `SeasonEntryMirror` in protocol.ts for the rest of the argument and
   *  docs/specs/season-mirror-2026-08.md for the measurement.
   *
   *  Optional so a hand-built probe world loads without it; every writer guards with `??=`, exactly as
   *  `careerTotals` does. */
  seasonEntries?: SeasonEntryLedger
  /** ⭐⭐ v53 – THE FIELD'S OWN SEASON, so the professional table stops standing still. Points a field
   *  professional has EARNED in the current season, by her id; absent ids have earned nothing yet.
   *
   *  ⚠⚠ WHY IT EXISTS. The owner, playing: «таблица professional ranking не двигается вообще… И номер
   *  1 мы обыгрывали на шлеме, кстати. Кажется что таблица просто "стоит"». He was exactly right, and
   *  the cause was one line in `runAiTournament`: every AI tournament genuinely resolves and every
   *  finisher's points are computed, and then `if (isFieldProId(playerId)) continue` threw the field's
   *  rows away. Her standing was a pure function of (seed, seasonIndex) – so nothing that happened on
   *  court could move it, including losing to the player at a Slam.
   *
   *  ⚠ A RUNNING TALLY AND NOT ROWS, and the shape is the measured one. Rows would be ~6,048 a season
   *  (189 AI events x a 32 draw) in a save whose 52-week prune is sized for 199 people – which is the
   *  exact objection the discarded-row comment made, and it was right. A per-pro total is 1,600 numbers,
   *  ~3 KB a season, and it is all `mergedWtaRanking` needs.
   *
   *  ⚠ IT IS EARNED POINTS, ADDED TO HER DERIVED BOOK RATHER THAN REPLACING IT. `wtaPoints` stays the
   *  standing she brings INTO the season - her career arc, her storey, her form - and this is what she
   *  has done since. Replacing it would empty the table every January and hand the player a world with
   *  no history in it. */
  fieldSeasonPoints?: Record<string, number>
  /** ⭐⭐ v64 – WHO WON IT. Titles taken in the current season, by rung and then by champion id:
   *  `fieldSeasonTitles.wta250['fp-341'] === 2` is "she won two WTA 250s this year". Absent means
   *  none, and every writer guards with `??=`, exactly as `fieldSeasonPoints` above does.
   *
   *  ⚠⚠ WHY IT EXISTS, AND IT IS THE SECOND HALF OF v53's REPAIR. `runAiTournament` resolves every
   *  canonical bracket in the game and `runTournament` stamps the winner explicitly
   *  (`finishes[alive[0].id] = 0`) – and then the whole result was thrown away three different ways:
   *  the points went to the tally above with no event and no finish attached, the ledger row was
   *  written for the LIVE cohort only (a field pro hit a bare `continue`), and the news line carries
   *  prose with NO player id, on 6 of 16 rungs, and is skipped entirely on the event the kid entered.
   *  So the world knew its champions and no reader could name one. Re-running the bracket is not a
   *  recovery either: the same tick has already moved `deriveWeekField`'s inputs (results pruned at
   *  52 weeks, the cohort drifted, this season's points already added), so a re-run deals a different
   *  draw. If it is not written when it happens it is gone.
   *
   *  ⚠ WHAT IT BOUGHT. A field-level census – "how many distinct champions, and how many titles
   *  each" – against the real tour's own figure (59 WTA titles among ~32 champions in 2024 = 1.84;
   *  `docs/research/title-drought-reality.md` §2). That question was asked of this engine and had to
   *  be settled by arithmetic instead, because nothing in the save could answer it.
   *
   *  ⚠ A TALLY AND NOT ROWS, for v53's measured reason and not by taste. `world.results` is pruned on
   *  a 52-week window sized for 199 people AND is what `computeRanking` reads; writing ~30 field rows
   *  a week into it would change the standings, which is a different change from this one. Two
   *  numbers deep by (rung, champion) is at most one entry per event played – ~189 a season, ~4 KB –
   *  and it is all a census needs.
   *
   *  ⚠ IT IS THE CANONICAL BRACKET'S CHAMPION, INCLUDING ON THE EVENT SHE ENTERED. Her shadow run and
   *  the canonical bracket are two universes for one event id and always have been (separate streams,
   *  separate fields); `announceTourChampion` prints only hers because two champions in one week's
   *  NEWS would be a lie about the story. This is not news – it is the field's own record of its own
   *  tour – so it holds the canonical winner of every event, and the count therefore equals the
   *  number of AI tournaments played. Her own trophies live in `trophiesByTier`, which is untouched.
   *
   *  ⚠ SEASON-SCOPED, cleared at the wrap on the same line as `fieldSeasonPoints`. What that cannot
   *  answer, stated rather than discovered later: a career-long title count for one professional, and
   *  which event any single title came from. Both are storeys on this floor if they are ever wanted;
   *  neither is what the census asks. */
  fieldSeasonTitles?: Partial<Record<TierId, Record<string, number>>>
  /** per-week/per-category signed-cents finance ledger (v11), accrued at the `addEvent` choke
   *  point and pruned to a 60-week trailing window. Feeds the Money breakdown/ledger so they
   *  survive the 60-event snapshot cap; see FinanceWeek in protocol.ts. */
  financeWeeks: FinanceWeek[]
  /** Season-Life (v12): per-week condition 0..100 (100 = fresh). Written ONLY by accrueCondition
   *  (pure arithmetic, zero main-stream RNG); fatigue is the derived 100 - condition, not stored. */
  condition: number
  /** the kid's active injury, or null when healthy. Wired in slice B but ALWAYS null here – Slice C
   *  populates it. ⚠ The snapshot used to omit `sinceWeek` and carries it since round-16 #19, so
   *  the persisted shape and the surfaced one are now the same four-plus-one fields – see
   *  `SnapshotInjury`. Still a VIEW change only: the save has always held this field. */
  injury: SnapshotInjury | null
  /** append-only injury log, pruned to the last 20 (Slice C writes it; empty in B).
   *  ⚠ `weeksOut` IS THE WEEKS SHE WAS ACTUALLY OUT (v59): shorter than the dealt layoff when the
   *  masseur bought weeks back, and `weeksSaved` says how many – the key exists only on rows where
   *  he did, so every earlier row (and every career without him) serialises byte-for-byte. */
  injuryHistory: Array<{ kind: string; severity: string; week: number; weeksOut: number; weeksSaved?: number }>
  /** whether physio recovery is active (default = `coachIncludesPhysio(profile.coachTier)`, i.e.
   *  every rung but self-coached – the old rule was "a hired coach comes with a physio" and
   *  self-coaching is the only rung that is not a hire). The cost lever is billed in Slice C; in B
   *  the flag just reflects/sets the toggle. */
  physioActive: boolean
  /** Season planner (v13): booked family-vacation weeks. PURE player state – the price was
   *  quoted/charged from the `:vacation:` sub-stream at booking time, so nothing here can move
   *  the MAIN weekly draw sequence. Pruned to `week >= world.week` at housekeeping. */
  vacations: VacationBooking[]
  /** Season planner (v13): booked practice-match (friendly) weeks – same purity contract, priced
   *  off the `:practice:` sub-stream. */
  practices: PracticeBooking[]
  /** Season planner (v13): a carry-over injury-tau buff from a resort/elite vacation package;
   *  null when none is running. Applied POST-draw inside injuryTau. */
  recoveryBuff: RecoveryBuff | null
  /** W4 (v26): THE KNOCK she is carrying, or null. See engine/knock.ts for the whole design.
   *
   *  Two states in one field. `choice === null` is a QUESTION the career is stopped on; once he
   *  answers, it is a CONDITION the next weeks resolve under (a rest week, or a loaded injury roll
   *  through `untilWeek`). Retired at the top of the tick once `week > untilWeek`.
   *
   *  ⚠ THE ONLY REASON THIS SLICE BUMPS THE SCHEMA. `choice` is the player's decision, and a
   *  decision that evaporates on reload is not one – he could close the app on the dialog and come
   *  back to a career that had quietly picked for him. Everything else the knock produces (the
   *  dialog copy, the prompt) is derived at snapshot time and costs nothing. */
  knock: Knock | null
  /** W4 (v26): retired knocks, oldest first, pruned to the last KNOCK_HISTORY_MAX.
   *
   *  THE ACCUMULATING THREAD, and the reason it is a list rather than a counter: a knock he SENT HER
   *  BACK OUT ON puts that part of her body on the record, and `pushedParts` reads this to make the
   *  next one land there ~55% of the time and bite harder when it does. A counter could not say WHICH
   *  shoulder. It also feeds the cooldown, so one field carries both halves of the rate limit. */
  knockHistory: KnockRecord[]
  /** ⭐ v48: EVERY BIRTHDAY SHE HAS HAD, oldest first – the week, the age, what she asked for and what
   *  was chosen. docs/specs/birthday-and-gifts.md §2b; the mechanism is engine/world/birthday.ts.
   *
   *  ⚠ NOT PRUNED, unlike `knockHistory` and `events`. A career is a few dozen rows of four numbers,
   *  and the whole point is the CALLBACK three seasons later («the headphones you gave her still go
   *  everywhere») – a list that forgets the early years forgets exactly the years worth remembering.
   *
   *  ⚠ THE ROW IS ALSO THE "answered" FLAG, which is why there is no second field beside it. A
   *  birthday is pending exactly while no row carries its week (`pendingBirthday`), so a reload cannot
   *  land in a state where a boolean and the record disagree about whether he was asked. */
  birthdays: BirthdayRecord[]
  /** THE INBOX (v32): every letter this career has been sent, oldest first – open, signed, refused
   *  and expired alike. docs/specs/offers-and-the-inbox.md §2; the mechanism is engine/offers.ts.
   *
   *  ⚠ IT IS ON THE WORLD AND NOT IN THE EVENT FEED, and the spec makes that a rule rather than a
   *  preference (§5): a SIGNED DEAL HAS TO OUTLIVE EVERY PRUNE. `events` caps at 400 rows and a busy
   *  career burns that in a couple of seasons, so a contract announced in the feed is a contract that
   *  silently stops existing - and "silently" is the whole problem, because the thing it would stop
   *  paying is her equipment. The same argument `trophiesByTier` makes one field up.
   *
   *  Bounded by construction: the shop reviews once a season and writes at most one letter, so this
   *  is a handful of rows per career and is never pruned. Pruning it would defeat what it is for. */
  offers: Offer[]
  /** Diary-1 D10 (v18): the durable milestone ledger behind the Memory card. The event feed
   *  prunes at 400 rows, so memories need their own record: first title and first final per tier,
   *  the first international entry, the first injury, each season's closing rank – captured AT THE
   *  MOMENT they happen (finalizeTournament / enterEvent / rollInjury / the season wrap-up).
   *  Bounded by construction (≤ 6+6+1+1 + one row per season), so it is never pruned. Capture is
   *  SILENT – the milestone EVENTS that already exist keep announcing; this ledger only remembers. */
  milestones: Milestone[]
  /** ITF ANNUAL ENTRY CAP (v15): the absolute WEEK of every INTERNATIONAL event she has entered.
   *
   *  Why a persisted ledger rather than a derivation off `results`: the kid's result row is
   *  AWARD-ONLY (`finalizeTournament` writes it `if (points > 0)`), so since wave B's first-round
   *  zero a first-round exit leaves NO trace in the ledger – and first-round exits are precisely
   *  the entries this cap exists to count. `world.entries` cannot do it either: `ensureSeason`
   *  prunes it to FUTURE events, so a played entry disappears the week it is played.
   *
   *  One number per entry (the event's week), not a counter, so "how many this season" is a filter
   *  rather than a value that has to be reset correctly – a missed reset is then impossible. At
   *  most one international entry can exist per week (enterEvent allows one tournament a week), so
   *  the week identifies the entry uniquely and a withdrawal can remove exactly its own slot.
   *  Pruned to the current season onward at housekeeping, so it is bounded by the cap itself. */
  internationalEntryWeeks: number[]
  /** THE PRO AER LEDGER (v36, W2-LADDER §5): the absolute WEEK of every PROFESSIONAL (W-rung)
   *  event she has entered - `internationalEntryWeeks`' exact parallel, one table up, and NEVER
   *  merged with it: the WTA's age rule is "separate from and additional to" the ITF junior one
   *  (research §4), so a sixteen-year-old holds both allowances at once and each ledger counts
   *  only its own family (ECONOMY.entryCap.cappedProTiers vs .cappedTiers).
   *
   *  Same construction as the junior array for the same four reasons: a persisted ledger because
   *  the kid's result row is award-only (a first-round W15 exit leaves no other trace - and at
   *  w15/w35 it still pays 0); weeks rather than a counter so "how many this season" is a filter
   *  and a missed reset is impossible; at most one entry per week so the week identifies the slot
   *  a withdrawal removes; pruned to the current season onward at housekeeping. Entered at
   *  enter-time, spliced on refunding withdrawal, KEPT on every forfeiting exit - the tour counts
   *  participation, and a name still on a closed list participated. */
  proEntryWeeks: number[]
  /** THE PENALTY LEDGER (v38, W3-ACT2 §6): one row per penalty the TOUR has charged her, each with
   *  the absolute week it was charged in, what it cost and which rule it was.
   *
   *  ⚠ ROWS, NOT A RUNNING TOTAL, and it is `internationalEntryWeeks`' argument one table up: the
   *  rule is "ten points inside a ROLLING 52 weeks", so the total is a filter over the window and a
   *  missed reset is impossible by construction. It is also what makes the regime forgiving in the
   *  way the owner's ruling requires - points age out on their own, with nobody having to remember
   *  to clear them.
   *
   *  ⚠ AND IT IS A RECORD RATHER THAN A SCORE. Every row keeps its reason and (where there is one)
   *  the event it was about, so the inbox and the Stats screen can always say WHICH rule and HOW
   *  MANY points. «Мы ни за что не наказываем»: a penalty is a price she chose to pay, like money,
   *  and a price you cannot itemise is a punishment. Pruned nowhere - a career's penalty history is
   *  a handful of rows even in the worst case, and the window does the forgetting. */
  penalties: PenaltyRow[]
  /** THE LAST WEEK OF A SUSPENSION, inclusive, or null when she is not serving one (v38).
   *
   *  ⚠ PERSISTED RATHER THAN DERIVED, and the reason is that a sentence is a DECISION taken at a
   *  moment. Recomputed from today's rolling window it would end early the week its tenth point aged
   *  out - so the same career would be suspended or not depending on when the question was asked,
   *  which is exactly the class of two-surfaces-disagree bug `refreshDerivedRankCaches` exists to
   *  close. The ledger above says what she was charged; this says what the tour did about it. */
  suspendedUntilWeek: number | null
  /** WHO SHE TRAINS WITH (v23): a roster coach's id, or `null` for the parent on the court.
   *
   *  Only the id is stored. The roster itself is a pure derivation of `seed` (engine/coach.ts
   *  buildCoachRoster), so it can never desync from the career that hired off it, and an id saved
   *  today resolves years later without a migration. `profile.coachTier` records the rung they
   *  chose at ONBOARDING; this records who she trains with NOW, and the two part company the first
   *  time the Coach Market is used. Everything the engine bills or grows from reads THIS. */
  coachId: string | null
  /** DOES THE COACH COME TO TOURNAMENTS (v24)? A competition week is not billed as a coaching week
   *  by default - she spends it in a draw, not on his court - and this buys him for those weeks
   *  anyway. Default FALSE, which is the owner's own framing: the automatic behaviour is that
   *  competition weeks are not coach weeks, and the toggle is what adds him back.
   *
   *  It moves BOTH the bill and the development rate (coachWorksThisWeek), because a coach who is
   *  not paid for a week is not at that week. That is what keeps it a decision. */
  coachOnEventWeeks: boolean
  /** ...AND DOES HE GO TO THE RUNGS THAT PAY HER NOTHING TOO (v49)? The nested half of the stance
   *  above: junior and domestic events, where `TIERS[tier].prizeCents` is undefined.
   *
   *  ⚠ IT IS THE PLAYER'S DECISION AND NOT THE ENGINE'S, on the owner's own model (15.08): «По мне
   *  игрок сам решает: есть деньги - едет тренер, нет - не едет, или едет, но быстрее банкротится.»
   *  The fare there is a bill against an income that does not exist yet - the bench measured an
   *  ungated one bankrupting 8/30 wealthy·elite and 15/30 middle·middle careers, every one of them in
   *  the junior years (docs/specs/coach-travel-2026-08.md) - so screen T warns before the first fare
   *  is charged. It does NOT refuse: «бонус... нет - не едет, или едет, но быстрее банкротится» is a
   *  choice with a price, and this engine never protects a player from a price he was quoted.
   *
   *  ⚠ OPTIONAL ON THE TYPE, exactly as `kit` is and for the same reason: every hand-built test world
   *  and every pure probe keeps compiling, and `undefined` IS the shipped behaviour (he does not go),
   *  so absence is not a hole - it is the identity element. A real career always has one: createWorld
   *  writes `false` and the v48 -> v49 migration back-fills it. Read it as `?? false` and nowhere
   *  else: `coachTravelFareFor` is the single place it is consulted. */
  coachOnJuniorEvents?: boolean
  /** HER KIT, AS A DECISION (v37, W3-KIT). The rung on each of the three lines the match reads, and
   *  the week she was last handed a new one of them over the counter. See `KitState`.
   *
   *  ⚠ WHY THIS IS THE FIRST PERSISTED THING IN THE EQUIPMENT MODEL, and engine/equipment.ts's own
   *  headline says why it took this long: wear is DERIVED - the family's gear purchases are a pure
   *  function of (seed, background), so condition needed no state at all. A rung is not derived,
   *  because it is a CHOICE, and this engine never re-derives a decision (the same rule that puts
   *  `offers`, `coachId` and `academy` on the world rather than in a formula).
   *
   *  ⚠ OPTIONAL ON THE TYPE so that every hand-built test world and every pure probe keeps compiling
   *  and keeps answering exactly what it answered before. `kitWearAt` reads `world.kit ?? null` and
   *  `null` IS the shipped behaviour, so absence is not a hole - it is the identity element. A real
   *  career always has one: `createWorld` writes it and the v36 -> v37 migration back-fills it. */
  kit?: KitState

  // --- W2-ENDINGS (v39): where the career ends -------------------------------------------------

  /** THE TERMINAL LATCH, or null while the story still has a next week (v39).
   *
   *  ⚠ THE LATCH LIVES HERE AND BLOCKS AT `advanceWeeks` / COMMAND LEVEL. `tickWeek` STAYS TOTAL –
   *  it never early-returns on an ended world. That is not tidiness, it is the one place a naive
   *  build corrupts saves: `replayMainState` re-runs `tickWeek` on a default no-input probe world to
   *  reconstruct the MAIN position, and a probe that goes bankrupt mid-replay has to keep drawing
   *  identically to one that does not. A guard inside `tickWeek` breaks RNG recovery by
   *  construction. See tests/ending.test.ts for the twin that pins it. */
  ending: CareerEnding | null
  /** The first week of the CURRENT unbroken spell below zero, or null when solvent (v39). The
   *  WARNING PHASE bankruptcy wants before the fact – Money shows the countdown off this, and one
   *  solvent week clears it. */
  debtSinceWeek: number | null
  /** CAREER-TOTAL MONEY (v39), folded at the `accrueFinance` choke point. `financeWeeks` prunes to
   *  60 weeks, so a fifteen-season reckoning is not recoverable from it – see `CareerTotals`. */
  careerTotals: CareerTotals
  /** THE FORK AT NINETEEN (v39) – raised on her birthday week, open until answered. Null before it
   *  has ever been raised. */
  fork: ForkState | null
  /** THE NATURAL END'S OFFER (v39) while it is open and unanswered, else null. */
  retirementOffer: RetirementOffer | null
  /** How many times she answered "one more year" (v39). §5.3's decade of decisions, and the only
   *  fact the epilogue can print about it. */
  oneMoreYearCount: number
  /** HER FOUR YEARS AT COLLEGE (v39), once she has chosen them – null for every career that did
   *  not. `doneWeek` is null while the freeze has not been spent yet. */
  college: CollegeState | null
  /** THE MASSEUR IS ON THE PAYROLL (v59, travelling team step 1) – hired/fired like the coach,
   *  pro-career gated, salary and effect in world/masseur.ts. False for every earlier save: the
   *  seat did not exist. His retainer SUSPENDS at college and on family holidays rather than
   *  cancelling, so the flag survives the freeze – see `masseurWorksThisWeek`. */
  masseurHired: boolean
  /** ⭐ THE DIAL (v59, step 2 – the owner's own idea: «настройки сколько раз в неделю он дает свои
   *  услуги»): how many sessions a week the table is hers, one of `ECONOMY.masseur.rungs`' sessions
   *  values (2 / 4 / 7). The bill, the rehab cadence and the condition bonus all follow the rung
   *  through `masseurRungOf`. Persisted because it is a CHOICE, like `kit` and `coachId` – this
   *  engine never re-derives a decision. Written by `createWorld` and the v59 migration (4, the
   *  middle rung); validated at its one writer, `setMasseurSessions`. */
  masseurSessionsPerWeek: number
  /** ...AND DOES HE COME TO TOURNAMENTS (v59, step 2 – the ruling Б's whole point, «массажист
   *  ездит»)? The coach's `coachOnEventWeeks` pattern for the next seat over: default FALSE – the
   *  automatic behaviour is that competition weeks are not staff weeks, and the switch is what buys
   *  the seat. The fare is `masseurTravelFareFor` (the coach's own price rule, one more seat), and
   *  what it buys is `masseurTourRelief` at finalize – recovery between rounds, by depth. */
  masseurTravels: boolean
  /** ⭐ THE RETURN-WEEK SESSION'S MARK (v59, owner 22.08: «довесить послетурнирное восстановление
   *  1 сеанс массажа по возвращении»). The week of the last finalized run a HIRED masseur was NOT
   *  flown to; `resolveMasseurReturn` settles it (+1 recovery, receipt) on the first non-played
   *  week after and clears it. OPTIONAL AND TRANSIENT by design – absent means nothing is owed,
   *  which is the true value for every earlier save, so nothing is back-filled (the
   *  `pendingTournament.masseurThere` / `weeksSaved` discipline, recorded in the v59 migration). */
  masseurReturnDue?: number
  /** ⭐⭐ WHAT THE FAMILY OWNS (v63, the shop slice 1 – docs/specs/the-shop-2026-08.md §5). One row
   *  per catalogue id the parent has bought and not sold; empty for every career that predates the
   *  shelf, and empty for most careers that do not.
   *
   *  ⚠ ONE ROW PER ID, WHICH IS A RULE AND NOT AN ACCIDENT. `buyAsset` refuses a second copy of a
   *  thing already owned, so the shelf reads buy / own / sell as a tri-state per rung – and slice 2's
   *  drift sub-stream is keyed `seed:asset:<assetId>:<week>` (spec §4), which is a fact about the
   *  ITEM rather than about a copy of it. Two copies of one car would have to move identically or
   *  the key is wrong; refusing the second copy is the honest way to keep that true. An amount is
   *  what an investment varies, not a count.
   *
   *  Required rather than optional – `createWorld` writes `[]` and the v63 migration seeds it. */
  assets: OwnedAsset[]
  /** ⭐⭐⭐ THE BEST HER BODY HAS EVER BEEN (v62, the long goodbye step 1) – `physicalMean` of her
   *  skills, kept as a RUNNING MAXIMUM over the whole career by the growth phase (world/phaseGrowth).
   *  One number, written every tick, read by nothing yet.
   *
   *  ⚠ WHY A MEAN IS THE WHOLE ANSWER AND NOT A SUMMARY OF ONE. `declineFactor` erodes each physical
   *  attribute PROPORTIONALLY (`decline * skills[k]`), so every one of them keeps the same share of
   *  its own peak – and the mean's share is that same share exactly. `physicalMean` carries the full
   *  argument; it is not a fudge and must not be re-read as one.
   *
   *  ⚠ WHY A MAXIMUM AND NOT "WHERE SHE WAS AT 29". The peak is a fact about HER career rather than
   *  about the age curve: a girl who spent her early twenties injured, or trained badly, peaks lower
   *  and at a different week, and the point of §3b is to measure her against what she actually
   *  reached. A maximum needs no age, no window and no history – it cannot be wrong about when.
   *
   *  ⚠ NOT DERIVABLE AFTER THE FACT, which is why it is persisted: `growWeek` overwrites
   *  `world.skills` in place and no other record of her build survives (`radarViewOf` re-derives her
   *  week-one build from the seed, which is where she STARTED, not where she got to).
   *
   *  Required rather than optional – the v62 migration seeds every existing save. */
  peakPhysical: number
}
