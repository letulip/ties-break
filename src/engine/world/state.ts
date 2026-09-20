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
// ⭐ v72: `Temperament` is a type and this stays `import type`, so the leaf rule above holds – the
// four ids and the derivation that picks between them live in `engine/spirit.ts`.
import type { Temperament } from '../spirit'
// ⭐ v79: `CoachPair` is a type and this stays `import type`, so the leaf rule above holds. The row
// is declared beside the mechanic that owns it (engine/chemistry.ts) rather than here, because every
// rule about what its three numbers MEAN is argued there and a second home would be a second truth.
import type { CoachPair } from '../chemistry'
import type { CoachDeal } from '../coach'
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
  LifeBeatRecord,
  LoveEpisode,
  Milestone,
  Offer,
  PenaltyRow,
  PlayerProfile,
  PrologueTrace,
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
import type { CareerAgeCurve, KidSkills } from '../development'
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
// ⭐⭐⭐ v64 (round 27 #6, THE NATIONS CUP TIE IS WALKED AND NOT REPORTED): `CollegeState.callUpReveal`
// – a second optional reveal beside v60's `leagueReveal`, back-filling NULL. ⚠ ADDED HERE BY THE
// MERGE OF 28.08, NOT BY ITS OWN WAVE: PR #112 shipped the field, the migration, the fixture and the
// README row and left this ladder – the only place that reads as the complete list – one rung short
// at v63. A ladder with a hole in it is how the next reader picks the wrong number for the next
// bump, which is exactly what happened on the branch below.
// ⭐⭐⭐ v65: `fieldSeasonTitles` – WHO WON EACH AI TOURNAMENT. `runAiTournament` has always computed
// the champion of every canonical bracket and then dropped her on the floor; this is the tally that
// keeps her. Same family, same lifecycle and same argument as v53's `fieldSeasonPoints` one rung
// below – a per-season TALLY, not rows – and it is the second half of the same repair: v53 kept what
// the field EARNED, this keeps what the field WON.
// ⚠ THE BACK-FILL IS EMPTY AND IT IS A PRESERVATION, exactly as v53's was: every career saved before
// this build was played on an engine that discarded the champion, so an empty tally is precisely what
// those seasons contained, and it fills itself from the next tournament week on. Pure post-draw
// bookkeeping – the finish is already decided when it is read – so zero draws on any stream and the
// frozen MAIN capture (41550 / e6b0c709) cannot see it.
// ⚠⚠ AND IT SHIPPED AS v64 ON ITS OWN BRANCH, WHICH IS THE REASON THIS COMMENT NAMES 65. The wave was
// built off round 28's ledger branch while that branch still read 63, so it did the whole three-part
// move correctly against the only chain it could see – and `main` had meanwhile taken 64 for the
// call-up reveal above. Two different v64 schemas existed for a day, and a save written by either
// could not be read by the other. Renumbered on the merge: the version, the migration's place in the
// append-only chain, and the golden fixture, all three together.
//
// ⚠ v66 = ONE UNION MEMBER, `WorldEventCategory` gains 'business' (round 29 part four P7 – the
// merch brand's and the academy's weekly income lines, written by `resolveBusinessIncome`). NO
// field moved and NOTHING is back-filled: the businesses did not exist, so an old save genuinely
// has no rows of them. The version moves anyway, BY THE v44 PRECEDENT VERBATIM («'facility'… a new
// member of that union is a schema change by the rule in CLAUDE.md §3, so the version moves») –
// events and `financeWeeks.byCategory` are persisted, and a v66 save loaded by a v65 build would
// carry a category that build's union does not know. The round-29 ledger weighed the two zero-cost
// reuses and refused both: 'income' folds a built business into «the parents' job», and 'academy'
// already means the scholarship SHE receives – two facts under one name is the defect v44 was cut
// to end. Full move: this constant, the v65 -> v66 step in migrations.ts, tests/fixtures/saves/
// v66.json, and the union member's own doc in shared/protocol/events.ts.
//
// ⭐⭐ v67 (round 30 #14 and #8/#10 – the fund's UNITS and the brand's / academy's NAME). ⚠ IT IS A
// RENUMBER RATHER THAN A NEW SLICE OF WORK: both back-fills were written into the v65 -> v66 step
// above while main still read 65, which was correct at the time and stopped being correct when PR
// #114 shipped v66. A v66 save – the owner's own, already in play – would have SKIPPED them. The
// two steps moved out of v66 intact and v66's step is byte-identical to main's; the reasoning, and
// the rule that keeps the next wave from repeating it, is the header of migrations.ts. Full move:
// this constant, the v66 -> v67 step in migrations.ts, and tests/fixtures/saves/v67.json.
//
// ⭐⭐⭐ v68 (round 31 #10 + #13 – THE AGE CURVE STOPS BEING ONE CURVE). World `+ageCurve`, optional:
// `{plateauStart, declineStart, injuryFrom}`. A new career resolves it when the fork at nineteen is
// answered – the direct route peaks 22-26 and declines from 27, college keeps today's 23-28/29 – with
// a per-career spread drawn off `seed:decline` and the weeks her body has lost pulling it earlier.
//
// ⚠⚠ AND THE MIGRATION IS THE POINT OF THE VERSION MOVE RATHER THAN THE PRICE OF IT. The step writes
// {plateauStart: 23, declineStart: 29, injuryFrom: <weeks already lost>} onto EVERY existing save:
// today's behaviour exactly, pinned, so the owner's live career (Alice, week 933, 31.7) reads the
// same decline on the load after the update as on the load before it. The field is optional because
// `createWorld` does NOT write it – see `WorldState.ageCurve` for why the fork is the honest moment
// and what that buys the frozen career hashes. Full move: this constant, the v67 -> v68 step in
// migrations.ts, tests/fixtures/saves/v68.json, and docs/specs/age-curve-fork-and-spread.md.
//
// ⭐⭐⭐ v69 (round 32 #4 – THE BRAND STOPS EVAPORATING). World `+brandStrengthSeed`, optional:
// `{week, value}`.
//
// ⚠⚠ AND THE MIGRATION IS THE POINT OF THE VERSION MOVE RATHER THAN THE PRICE OF IT, exactly as v68's
// was. The brand's WORTH now reads a slow stock instead of this week's fame (`world/brandStrength.ts`),
// and that stock is DERIVED – nothing is carried week to week. What cannot be derived is «what was
// this career reading the day before the update», so the step writes {week: <the save's own week>,
// value: <the fame it holds there>} onto EVERY existing save: today's number exactly, pinned, so a
// career already in play reads the same brand value on the load after the update as on the load
// before it, and only the years AFTER it are flattened.
//
// ⚠ THE FIELD IS OPTIONAL BECAUSE `createWorld` DOES NOT WRITE IT and no phase of the tick writes it
// either – a career started after this ships has no pin and derives its whole own history, which is
// the behaviour a new career should have. See `WorldState.brandStrengthSeed` for the four things that
// buys, including the one that keeps the eighteen frozen career hashes moving by `schemaVersion`
// alone.
//
// ⚠ IDEMPOTENT and DRAW-FREE. One read of `fameAt` – a fold over records the save already carries –
// and two literals; no stream is touched on any key, so the frozen capture (41550 / e6b0c709) cannot
// move. Full move: this constant, the v68 -> v69 step in migrations.ts, tests/fixtures/saves/v69.json,
// docs/specs/brand-inertia-2026-08.md and docs/specs/collaborations-as-early-fame-2026-08.md.
//
// ⭐⭐⭐ v70 (round 35 #14 – THE DRAW BECOMES A FACT). World `+drawnFirstRounds`, optional:
// `Record<eventId, opponentId>`.
//
// HIS COMPLAINT, 03.09: «на неделе перед турниром случилась жеребьевка, мне сказали "играем против
// №118 шанс 71%", пошел турнир - соперник в первом раунде №76». The draw was stored NOWHERE and was
// re-derived from live inputs on every read – see `WorldState.drawnFirstRounds` for the whole
// diagnosis and for why one opponent id is the entire payload.
//
// ⚠ THE MIGRATION WRITES AN EMPTY TABLE AND NOT A DRAW, which is a deliberate refusal. Back-filling
// would mean re-deriving the very thing this item exists to stop re-deriving, on a world whose
// inputs have already moved; an existing save simply has no draw recorded, its next tick records
// one, and everything from there on is a fact. Cheap by his own ruling of 03.09 («никто не купил,
// нет игроков»); what still binds is that every older schema loads, which
// tests/fixtures/saves/v70.json is the proof of.
//
// ⚠ IDEMPOTENT and DRAW-FREE: `save.drawnFirstRounds ??= {}` touches no stream, so the frozen MAIN
// capture (41550 / e6b0c709) cannot move. Full move: this constant, the v69 -> v70 step in
// migrations.ts, tests/fixtures/saves/v70.json and tests/round35-draw-fact.test.ts.
//
// ⭐⭐⭐ v71 (round 39 #5, REOPENED – A REPEAT BRAND COSTS WHAT A BRAND IS WORTH). World
// `+brandFounded`, optional boolean: has this career EVER founded a merch brand?
//
// HIS COMPLAINT, 08.09: «Я завел бренд у Инэс, он за несколько недель стал стоить 22 млн, я его
// продал. Потом купил новый за 250к, а он снова за несколько недель уже 30+ стоит.» The cycle is
// sell at the (ramped) worth, re-buy at the flat catalogue price, wait for the ramp – and the
// re-buy price is the hole. His round-38 law «неизменно для первого открытия стоит 250к» binds the
// FIRST founding only, so the fix prices a REPEAT founding at the market's current derived worth
// (`assetEntryPriceCents`) – and «repeat» is a fact the world has to REMEMBER, because the sold
// brand's row is gone. One flag, written by `buyAsset`, read by the pricing.
//
// ⚠ THE MIGRATION GIVES THE BENEFIT OF THE DOUBT, both ways stated: a save that OWNS a merch brand
// has founded one (his own live career must not re-buy at $250k after the update – the exploit is
// exactly there), and a save that owns none carries no record of a founding that may or may not
// have happened, so it keeps the first-founding price. Guessing «founded» from a ledger row would
// be re-deriving a fact from prose; the flag starts where the facts are.
//
// ⚠ IDEMPOTENT and DRAW-FREE: one `some()` over `save.assets` and at most one literal write; no
// stream is touched, so the frozen MAIN capture (41550 / e6b0c709) cannot move. Full move: this
// constant, the v70 -> v71 step in migrations.ts, tests/fixtures/saves/v71.json and
// tests/r39-brand-rebuy.test.ts.
//
// ⭐⭐⭐ v72 (THE PRIVATE LIFE, WAVE 1) – THE TWO NUMBERS, AND WHO SHE IS. World `+spirit`, `+bond`
// and `+temperament`; see the three fields above and `src/engine/spirit.ts` for the rules.
//
// ⚠⚠ THE BACK-FILL IS TWO KINDS OF THING IN ONE STEP, and the difference is the whole reason the
// migration is worth reading. `spirit` and `bond` are back-filled to the literal 70 – UNIFORM,
// ruling V4, because 70 is where a career starts and there is nothing in an old save to derive a
// truer number from (and 70 is above the knee, so a migrated career plays byte-identical tennis
// until something actually moves her). `temperament` is DERIVED, not defaulted and not drawn: the
// step calls `temperamentFor` – THE SAME exported function `createWorld` calls – on the career's own
// seed, so a career already in flight turns out to have always been her. A second spelling of that
// formula would hand a live save a different girl from the one the engine would have drawn, which
// is the one defect this move exists to make impossible.
//
// ⚠ IDEMPOTENT and DRAW-FREE ON MAIN: three `??=` writes gated on `v === 71`, and the only stream
// touched anywhere is the purpose-scoped `seed:temperament` sub-stream, re-derived at the call site
// and persisting nothing. The frozen MAIN capture (41550 / e6b0c709) cannot move. Full move: this
// constant, the v71 -> v72 step in migrations.ts, tests/fixtures/saves/v72.json, and
// docs/context/saves-and-worker.md's mechanically-checked schema sentence.
// ⭐⭐⭐ v73 – THE PRIVATE LIFE, WAVE 2: `lifeLog` STOPS BEING OPTIONAL. Wave 1's wire shipped the
// field behind a `?` so both halves of this wave could build against it before anything wrote a row;
// step 4 makes it required, back-fills `[]` in an append-only migration and freezes the golden
// fixture. Back-filling an EMPTY list is the exactly-true answer rather than a bargain struck with a
// pruned log (v29/v31's shape): a career that predates the layer has lived no beats, because there
// were none to live. Full move: this constant, the v72 -> v73 step in migrations.ts,
// tests/fixtures/saves/v73.json, and docs/context/saves-and-worker.md's mechanically-checked
// schema sentence.
// ⭐⭐⭐ v74 – THE PRIVATE LIFE, WAVE 3: `loveEpisodes`, SOMEONE EXISTS. World `+loveEpisodes` – one
// append-only row per attachment, never pruned, and the ACTIVE one is DERIVED from the list rather
// than stored beside it (`activeEpisode`, world/lifeBeat.ts: the last row with `endedWeek === null`).
// A romance that begins and ends before the parent knew must survive save and reload intact and
// surface later as one honest late row – the 09.09 re-cut, review find #5 – which a single nullable
// slot would have overwritten out of existence. The back-fill is `[]` and it is EXACTLY TRUE in v73's
// own sense: a career that predates the layer has lived no attachments, because there were none to
// live. Full move: this constant, the v73 -> v74 step in migrations.ts, tests/fixtures/saves/v74.json,
// and docs/context/saves-and-worker.md's mechanically-checked schema sentence.
// ⭐⭐⭐ v75 – THE PRIVATE LIFE, WAVE 4: IT ENDS. World `+spiritShock` – the mark an ending leaves on
// her while it is still sitting there, `{week, kind}` or null (`docs/plans/life-wave-4-builder-2026-09.md`
// §2 T1/T3, constants from `docs/specs/who-she-is-2026-09.md` §4). The back-fill is `null` and it is
// EXACTLY TRUE in v73's and v74's own sense one rung further on: a career that predates the layer
// carries no live shock, because there was nothing in its past that could have shocked her. T1 ships
// the SEAT and no writer at all – `rollEnds` is T2 and the shock itself is T3 – so this version is
// inert by construction, which is all a schema move should ever be, and the frozen careers prove it.
//
// ⚠⚠ THE SAME BUMP CARRIES `WorldEvent.lifeKind?` AND THAT FIELD IS OWED NO BACK-FILL, which is said
// here rather than left for a reader to wonder whether it was forgotten. It is OPTIONAL and purely
// additive – absent means exactly what every historical row already means, «this row carries no
// life-kind discriminator», and that is true of every row ever written – and NOTHING writes it before
// T5, so there is no shape anywhere for a migration to repair. On `WorldEvent.entryRef`'s own rule it
// would have moved no number at all had it shipped alone; it rides this version because the two land
// in one commit, not because it needs one.
//
// Full move: this constant, the v74 -> v75 step in migrations.ts, tests/fixtures/saves/v75.json, and
// docs/context/saves-and-worker.md's mechanically-checked schema sentence.
// ⭐⭐⭐ v76 – THE PSYCHOLOGIST'S YEAR, WAVE 5: THE SEAT, AND HER WALLS. World `+psychologistHired`,
// `+psychologistRung`, `+psychologistFocus`, `+psychologistFocusSeason`, `+wallsLean` and
// `+wallsFlipped` – SIX keys in one append (`docs/plans/life-wave-5-builder-2026-09.md` §2 T1, the
// walls model verbatim from `docs/specs/who-she-is-2026-09.md` §2a). The first four are the staff
// seat, shaped on v59's masseur block; the last two are the §2a leanings and their hysteresis state.
// ⭐ AMENDED PRE-MERGE 14.09 – `+peakDomesticPoints` makes SEVEN: the owner's elite-gate ruling
// («фраза про карьеру, а не про неделю»), added to this SAME unshipped step rather than a v77
// because no v76 save exists outside this branch; the field's own docblock beside
// `bestFinishByTier` carries the measurement and the doctrine.
//
// ⚠⚠ SIX KEYS IN ONE VERSION, AND THEY ARE TWO DIFFERENT KINDS OF THING RIDING ONE BUMP – said here
// so the next reader does not look for a single story. The seat is a STAFFING DECISION (hired, at
// which rung, working on which focus, set in which season); the walls pair is a FACT ABOUT HER that
// no player ever chooses. They land together because the wave that reads them is one wave and a
// schema move costs a fixture, a peel rung and ten e2e regenerations whether it carries one key or
// six – v72's own three-in-one-append precedent, for the same reason.
//
// ⚠⚠ THE BACK-FILLS ARE EXACTLY TRUE AND NOT ONE OF THEM IS A BARGAIN, in v73's / v74's / v75's own
// sense one rung further on. `false` – the seat did not exist, so nobody was ever hired into it.
// `1` – the DEFAULT rung, meaningless until hired, and the masseur's middle-rung precedent verbatim
// (v59 back-filled `4` sessions onto careers that had never met a masseur, for the same reason: a
// dial has to read something and the shipped default is the only non-invented answer). `null` twice
// – no focus was ever picked, and no season ever held a pick. `{open: 0, reg: 0}` – ZERO IS THE
// IDENTITY, not a placeholder for one: a leaning of 0 means «expression equals nature», which is
// exactly what every career that predates the walls has always been. `{open: false, reg: false}` –
// nothing has flipped, because nothing could have.
//
// ⚠⚠ AND THE ZERO BACK-FILL IS WHY A MIGRATED CAREER PLAYS BYTE-IDENTICAL TENNIS. `wallsLean` 0 with
// nothing flipped makes `expressedTemperamentOf` (engine/spirit.ts) return BIRTH – so every mechanic
// T7 re-points reads exactly the value it reads today, which is the zero-diff proof T1 ships and T7
// stands on. Nothing on this tree calls that function outside its own module; the seat has no writer
// at all (T2), no focus command (T3) and no leaning pass (T7), so this version is INERT by
// construction, which is all a schema move should ever be, and the frozen careers prove it.
//
// Full move: this constant, the v75 -> v76 step in migrations.ts, tests/fixtures/saves/v76.json, and
// docs/context/saves-and-worker.md's mechanically-checked schema sentence.
// ⭐⭐⭐ v77 – THE SPOTLIGHT, WAVE 6: WHAT LIVING KNOWN COSTS HER, AND WHAT THE WORLD KNOWS OF HER
// PRIVATE LIFE. World `+spotlightHabituation`, and FOUR fields on the `LoveEpisode` ROW –
// `+publicWeek`, `+publicWrong`, `+airedMetWeek`, `+airedEndedWeek`
// (`docs/plans/life-wave-6-builder-2026-09.md` §2 T1; the model is `docs/specs/who-she-is-2026-09.md`
// §3c and §3c-bis, the booth's boundary `docs/plans/the-way-she-sounds-2026-09.md` C4).
//
// ⚠⚠ THE FIRST SCHEMA MOVE IN THIS LADDER THAT WIDENS A ROW INSIDE A LIST RATHER THAN THE WORLD, and
// that is the sentence a later reader needs before anything else. v73 added `lifeLog`, v74
// `loveEpisodes`, v75 `spiritShock`, v76 seven world keys – every one of them a key on `WorldState`,
// which a top-level `??=` back-fills and a top-level object rest peels. FOUR of this version's five
// fields live on `LoveEpisode` ENTRIES, so the migration must WALK the list and `??=` each row, and
// the frozen-career peel had to learn to map over an array
// (`careerHashAtSchema`'s own «THE PROTOCOL'S FIRST NESTED PEEL» note). Neither is difficult; both
// are silently skipped by the mechanical habits this ladder built up over thirteen flat versions,
// which is why the shape is named here rather than left to be discovered.
//
// ⚠⚠ THE BACK-FILLS ARE EXACTLY TRUE AND NOT ONE OF THEM IS A BARGAIN, in v73's / v74's / v75's /
// v76's own sense one rung further on. `spotlightHabituation = 0` – ⭐ ZERO IS THE IDENTITY AND NOT A
// PLACEHOLDER FOR ONE: it counts «known weeks» she has actually lived toward `habituationFullWeeks`,
// and a career that predates the spotlight has lived none of them, because nothing was counting and
// no pressure existed to acclimate to. `publicWeek = null` – the world never learned, and null is
// that rather than «week 0»; the press did not exist as a mechanic, so no story ever ran. `publicWrong
// = false` – no story ran, so no story ran wrong; the flag is meaningless while `publicWeek` is null
// and `false` is the only value that invents no tabloid. `airedMetWeek` / `airedEndedWeek = null` –
// the booth has never voiced a private fact, because there was no channel for it to voice one
// through. Not one of the five reconstructs anything: this version is «nothing about her private
// life was ever public, and she has never lived a week known», written down for the first time.
//
// ⚠⚠ AND THAT IS WHY A MIGRATED CAREER PLAYS BYTE-IDENTICAL TENNIS, which is this step's strongest
// property and the wave's first pin. Every wave-6 mechanic – the five exposure kinds, the pressure
// term, habituation's growth, both leak streams and the booth's stamp – is gated on `newsStandingOf`
// (the rank bands, D1 14.09)
// (T2) or on a non-null `publicWeek` (T6/T7), and at the back-fills NONE of them can fire. T1 ships
// five seats and NO READER AT ALL: `world/spotlight.ts` is T2, the pressure T3, habituation T4, the
// fifth focus T5, the leak T6 and the booth channel T7 – so this version is INERT by construction,
// which is all a schema move should ever be, and the frozen careers prove it on five careers.
//
// Full move: this constant, the v76 -> v77 step in migrations.ts, tests/fixtures/saves/v77.json, and
// docs/context/saves-and-worker.md's mechanically-checked schema sentence.
// ⭐⭐⭐ v78 – ONE BUMP, THREE CUSTOMERS, which is the owner's own scheduling («41 #22 давай тоже в
// v78 закинем», 15.09) and the whole economy of a schema move: the ritual costs a fixture, a peel
// rung and ten e2e regenerations whether it carries one key or six, so three items that each need
// one thing persisted ride it together. World `+composureBonus`, `+sparringHired`, `+sparringRung`;
// the ROWS of `world.assets` gain `+entries`.
//
//   · round 42 #35 – `composureBonus`. THE ONLY QUANTITY IN THE GAME THAT LIVES ABOVE A ROLLED
//     CEILING, earned by sustained psychologist work on the nerve focus and lost slowly without it.
//     Its three numbers are the owner's, verbatim: «+5 потолок, по очку за сезон… 0.2пп за сезон
//     без этой тренировки». It has to persist because it is earned over seasons and cannot be
//     re-derived from anything the save already holds – weeks hired are not enough, since the focus
//     can change under a standing hire, and `psychologistFocusSeason` is a STAMP rather than a
//     tenure (its own docblock refuses exactly that proxy, one field group down).
//   · round 41 #22 – `OwnedAsset.entries`. The fund chart's purchase marks; the field's own block in
//     shared/protocol/profile.ts carries the argument, and it is the reason this version's step
//     walks the ROWS of a list as well as the keys of the world.
//   · round 42 #45 / item 19 – `sparringHired` and `sparringRung`. ⚠⚠ THE KEYS ONLY, AND NOTHING
//     READS THEM ON THIS TREE, AND THE SEAT DID NOT LAND IN THIS ROUND EITHER. ⚠⚠ Round 42 bundle
//     13 STOPPED on two missing things and was right to: `world.form` does not exist (the RHYTHM
//     channel the seat's whole effect cuts ships in wave F1, which never shipped – `git grep
//     rustAfterWeeks -- src` is empty), and the owner's 15.09 travel override needs a third key,
//     `sparringTravels`, which v78 was scoped before he gave. So a seat built on these two would
//     have cut a drift that does not drift. The keys stay because they are correct and append-only
//     migrations are forever; the seat lands with F1 and with its travel key, in its own version.
//
// ⚠⚠ AND THE FOUR ARE THREE DIFFERENT KINDS OF THING, named so the next reader does not look for one
// story: `composureBonus` is a FACT ABOUT HER that the parent's spending earned; `entries` is a
// LEDGER OF WHAT THE FAMILY DID; the sparring pair is a STAFFING DECISION nobody can make yet. v76's
// seat-plus-walls append is the precedent for riding one bump, for the identical reason.
//
// ⚠⚠ THE BACK-FILLS ARE EXACTLY TRUE AND NOT ONE IS A BARGAIN – v73/v74/v75/v76/v77's discipline one
// rung on. `composureBonus = 0` – ⭐ ZERO IS THE IDENTITY AND NOT A PLACEHOLDER: the bonus is «how
// far above her rolled ceiling the psychologist's years have carried her», and a career that
// predates the mechanic has been carried nowhere, because there was no mechanic to carry it. At 0
// the effective ceiling IS `potential.composure` and `growWeek` is byte-identical – see
// `composureCeilingOf`. `sparringHired = false` – the seat did not exist, so nobody was hired into
// it. `sparringRung = 1` – the DEFAULT rung, meaningless until hired, which is v59's masseur dial
// and v76's psychologist rung quoted rather than re-argued. `entries = []` – «this career recorded
// no purchases», which is what a save written before the road existed is.
//
// ⚠ ONE OF THE FOUR IS NOT INERT, AND THAT IS THE DIFFERENCE FROM v75/v76/v77. Those shipped seats
// with no reader at all. `composureBonus` ships WITH its reader (`composureCeilingOf`,
// `composureBonusAfterWeek`, and the two new `growWeek` arguments), because a bonus nobody can earn
// is not a testable claim. What keeps the frozen careers honest instead is that the bonus can only
// move on a week the psychologist is working the `'coolhead'` focus, and no frozen career ever hires
// him – `walkFrozenCareer` already asserts `psychologistHired === false`. So the mechanic is
// unreachable in every one of them, which is a property the peel rung MEASURES rather than assumes.
//
// Full move: this constant, the v77 -> v78 step in migrations.ts, tests/fixtures/saves/v78.json,
// docs/context/saves-and-worker.md's mechanically-checked schema sentence, and the e2e fixtures.
// ⭐⭐⭐ v79 – THE CHEMISTRY WAVE C1, AND THE KEY #48 HAS BEEN WAITING FOR SINCE v78 WAS SCOPED.
// `docs/specs/the-chemistry-2026-09.md` §10: one bump, two customers. World `+coachPairs`,
// `+sparringTravels`.
//
//   · the chemistry wave C1 – `coachPairs`. ⭐ ONE KEY WITH THREE NUMBERS AND NOT THREE PARALLEL
//     MAPS, which is the spec's own §10 warning: all three are facts about one PAIR, written on the
//     same week by the same pass, and three maps keyed on the same coach id would be three chances
//     for them to disagree about who exists. The pair has to persist because it is PATH-DEPENDENT –
//     the first draft of the spec said the rate «is not persisted at all: it is a pure function of
//     (seed, coachId)» and that stopped being true the moment the rate started moving with results
//     and with her state. ⚠ WHAT IS STILL PURE IS THE AFFINITY: `affinityFor` is drawn from
//     `(seed, coachId)` and nothing else, so it is re-derived at every call site and stored nowhere,
//     and that is the half which keeps «every variation reproducible» true. The roster's drawn
//     `manner` and `style` are not persisted either, for the same reason – `buildCoachRoster` was a
//     pure function of `(seed, ageYears)` before this wave and is still one after it.
//   · round 42 #48 – `sparringTravels`. THE THIRD SPARRING KEY, and the one v78 was scoped before
//     the owner gave it («у остальных есть галочка ездит», 15.09). v78's own block names its absence
//     as one of the two reasons the seat did not land in that round; it rides here because it costs
//     this version nothing – a boolean and a `??= false` – and because the alternative is a schema
//     move of its own for one field. ⚠⚠ AND IT IS STILL KEYS-ONLY: nothing on this tree reads any of
//     the three sparring fields, the seat lands with wave F1, and a reader who finds an unused key
//     here is reading a SCHEDULING decision and not a half-built feature. v78 said that about two
//     keys; this version says it about the third.
//
// ⚠⚠ ONE OF THE TWO IS NOT INERT, AND THE OTHER IS – the same split v78 had, named so the peel rung
// is not asked to prove the wrong thing. `sparringTravels` has no reader at all. `coachPairs` ships
// WITH its reader (`accrueChemistry` in the weekly tick, and `coachFactor`'s new third argument),
// because a relationship nobody can accrue is not a testable claim. ⚠ SO THE FROZEN CAREERS MOVE,
// and they move for a REASON rather than by a key append: every one of them hires a coach, so every
// one of them now has a relationship. That is a behaviour change, it was diffed per key before it
// was believed (`tools/frozen-key-diff.ts`, control = this wave's own change neutralised in place),
// and the constants are re-stamped with the dated note the protocol asks for.
//
// ⚠ `standing` IS WRITTEN AND NEVER READ, which is v78's sparring pair one version on and is said
// here for the same reason it was said there: it is wave C2's (spec §4 – the coach's own tier climbs
// with her results), all three numbers are written by one pass on one week, and splitting the key to
// keep an unread field out of it would have bought nothing and cost the guarantee above.
//
// ⚠ `standing` STORES THE SCORE AND NOT THE TIER (spec §10), so the rung is always a pure function
// of it and a threshold retune moves every save at once instead of stranding careers at a rung that
// no longer exists.
//
// Full move: this constant, the v78 -> v79 step in migrations.ts, tests/fixtures/saves/v79.json,
// docs/context/saves-and-worker.md's mechanically-checked schema sentence, the e2e fixtures, and the
// frozen-career peel rung in tests/coachTravelEdgeFixtures.ts.
// ⭐⭐⭐ v80 – WAVE F1, `world.form`. `docs/specs/the-form-and-the-sparring-2026-09.md` §6: ONE key,
// ONE customer, and the version the three sparring keys have been waiting for since v78.
//
//   · `form` – tenths, 0-centred, clamped [-10, +10], back-fill **0 = neutral**. 0 is the IDENTITY
//     AND NOT A PLACEHOLDER FOR ONE (v77's `composureBonus` rule, quoted): at 0 `formComposureDelta`
//     returns an exact 0, `kidMatchPlayerFor` takes its untouched early return, and every migrated
//     career and every stored replay is byte-identical until something actually moves her.
//
// ⚠⚠ IT IS NOT INERT, AND SAYING SO IS HALF THE MOVE. v78 and v79 each shipped keys with no reader;
// this one ships WITH its reader (the weekly pass in `world/phaseHerWeek.ts`, and `composureEff` at
// `MatchPlayer` build time), because a slump nobody can feel is the decorative mechanic round 42
// found twice. ⚠ SO THE FROZEN CAREERS MOVE, and they move for a REASON rather than by a key
// append: every frozen career plays matches and has gaps, so every one of them now carries form into
// its own results. That is a behaviour change, it was diffed per key before it was believed
// (`tools/frozen-key-diff.ts`, control = this wave's own change neutralised in place), and the
// constants are re-stamped with the dated note the protocol asks for.
//
// ⚠ AND THE SEAT'S THREE KEYS FINALLY GAIN THEIR READER IN THE SAME WAVE, with NO key of their own:
// `sparringHired` / `sparringRung` (v78) and `sparringTravels` (v79) are read by `world/sparring.ts`
// from this version on. F2 checked before it bumped and needed nothing – which is what those two
// versions' «a reader who finds an unused key here is reading a SCHEDULING decision» was promising.
//
// ⚠ `seed:form:<week>` STAYS RESERVED AND UNUSED (O4). Zero draws anywhere in this wave, so the
// frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
//
// Full move: this constant, the v79 -> v80 step in migrations.ts, tests/fixtures/saves/v80.json,
// docs/context/saves-and-worker.md's mechanically-checked schema sentence, the e2e fixtures, and the
// frozen-career peel rung in tests/coachTravelEdgeFixtures.ts.
// ⭐⭐⭐ v81 – ROUND 44, `LifeBeatRecord.frame`. `docs/specs/the-frame-pool-2026-09.md`'s third
// mechanical ruling, and it is the only one of the three that costs a schema version.
//
//   · `frame` – the id of the delivery frame a `'small-talk'` beat was raised in (`'kettle'`,
//     `'call-late'`), on the ROW and not on the world. **Optional, never back-filled**, and the
//     ABSENCE is a true statement about every older row: nothing drew a frame before this version.
//
// ⚠⚠ WHY IT IS STATE AT ALL, WHICH IS THE WHOLE ARGUMENT. His rule, 17.09: a frame may not change
// after a save, a reload, **or the pool growing**. A frame DERIVED from a purpose-scoped stream keyed
// on the career week survives a save and a reload perfectly – the key is reconstructible for the life
// of the career – and it cannot survive the third: a pool that grows from nine lines to ten
// re-derives a different member for a beat already on the screen. That third clause is the whole of
// the difference between this key and `heard` one field over, which took no bump for exactly the
// reason this one needs one.
//
// ⭐ AND THE FALLBACK IS WHAT KEEPS THE MIGRATION TRIVIAL. A row with no frame renders the FIRST line
// of its presence's pool, and `kettle` / `call-middle` are exactly the two frames the shipped
// catalogue wrapped `practice-clicked` in – so a small-talk row already sitting in a save reads back
// byte-identically to what it showed on the week it was raised. Nothing historical is re-worded.
//
// ⚠⚠ THE FROZEN CAREERS MOVE, AND NOT BECAUSE OF THIS KEY. The round also lands the 43-situation
// corpus, so the POOL a career draws from grows from 8 situations to 51 and every `lifeLog` row's
// `detail` changes with it. That is a behaviour change, it was diffed per key before it was believed
// (`tools/frozen-key-diff.ts`, control = this round's own change neutralised in place), and the
// constants are re-stamped with the dated note the protocol asks for.
//
// ⚠ ZERO MAIN DRAWS. The frame is drawn on `seed:smalltalk:frame:<week>` – a purpose-scoped
// sub-stream re-derived at the call site, persisting nothing – so the frozen MAIN capture
// (41550 / e6b0c709) is untouched by construction.
//
// Full move: this constant, the v80 -> v81 step in migrations.ts, tests/fixtures/saves/v81.json,
// docs/context/saves-and-worker.md's mechanically-checked schema sentence, the e2e fixtures, and the
// frozen-career peel rung in tests/coachTravelEdgeFixtures.ts.
// ⭐⭐⭐ v82 – ROUND 42 #51 / ROUND 44, `coachDeal`. THE AGREED WEEKLY FIGURE, WRITTEN DOWN
// (docs/specs/the-coachs-raise-2026-09.md). The owner, 17.09: «"зафиксировать при найме и пусть
// просит, как массажист" – верно».
//
//   · `coachDeal` – the contract with the man currently on the payroll: his agreed LABOUR rate, the
//     week it was struck, the marks the next ask is judged against, and the residual banked since.
//     `null` for a self-coaching family, which is what every historical save honestly is.
//
// ⚠⚠ WHY IT COULD NOT BE DERIVED, WHICH IS THE ONLY QUESTION THIS KEY HAD TO ANSWER. The masseur's
// own ask took no schema at all (`docs/specs/the-masseurs-ask-2026-09.md` §1): his rate is a pure
// function of WEEKS SERVED, and the weeks are summed off tagged ledger rows `pruneEvents` never
// touches. The coach's is not. A fee that is fixed AT HIRE is by definition a fact about the moment
// it was fixed, and the market it was fixed in has moved since - her age band, her ranking and
// therefore the whole of `bandedRateCents` - so there is no function of today's world that returns
// it. `coachSinceWeek` is still derived, and this key deliberately does NOT duplicate it.
//
// ⚠ THE BACK-FILL IS `null` AND THE MIGRATION WRITES A LITERAL, which is the house rule on
// `migrations.ts` kept rather than argued around. `null` is TRUE of every save ever written: nobody
// has agreed a figure in writing, because there was nowhere to write one. The first tick after the
// upgrade settles a deal for a family that already has a coach (`settleCoachDeal`), and it dates it
// from `coachSinceWeek` - the ledger's own record of when the arrangement began - so a migrated
// career's first anniversary arrives on the schedule it always had.
//
// ⚠⚠ THE FROZEN CAREERS MOVE ON SEVEN KEYS AND NOT ONE, AND THE PREDICTION THAT SAID OTHERWISE WAS
// WRONG AND IS RECORDED AS SUCH. The build predicted a pure key append – «156 weeks ends inside
// `coachAgeBand` 0 with no WTA rank, so the agreed labour equals the market's and no ask can fire» –
// and the per-key diff the protocol demands BEFORE the constants are touched said otherwise on four
// of five cells. The prediction was off by ONE WEEK: `ageAtWeek` returns whole years, she turns 17 at
// week 156 exactly, and `walkFrozenCareer`'s last tick runs AT 156. So the final week of every
// coached frozen career crosses an age band – where the shipped till re-drew the man's rate from a
// dearer row and this one does not – and week 156 is also `3 x 52`, an anniversary, so the ask fires
// on it too. `careerTotals`, `events`, `financeWeeks`, `fundsCents` and `nextEventId` move with the
// bill and the row; the self-coached cell moves on `coachDeal` and `schemaVersion` alone.
//
// ⭐ THE DIFF IS WHY THIS IS A SENTENCE RATHER THAN A SURPRISE. A re-stamp done on the prediction
// would have re-frozen a BEHAVIOUR change under a comment claiming a key append, which is the exact
// defect that file exists to catch. The full per-key table and `rngMain`'s three canonical
// fingerprints (unmoved) are in the dated block at the head of tests/coachTravelEdgeFixtures.ts.
//
// ⚠ ZERO MAIN DRAWS. The ask is a weighted mean over state the tick has already written, the score
// draws nothing, and the fee is integer arithmetic - so the frozen MAIN capture (41550 / e6b0c709)
// is untouched by construction.
//
// Full move: this constant, the v81 -> v82 step in migrations.ts, tests/fixtures/saves/v82.json,
// its row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's
// mechanically-checked schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts.
// ⭐⭐⭐ v83 – THE WEDDING, WAVE 7 (life/wave-7 T1; `docs/plans/life-wave-7-builder-2026-09.md` §2,
// the design `docs/plans/the-wedding-and-the-children.md` §1). NOTHING ON THE WORLD, AND TWO FIELDS
// ON EVERY `LoveEpisode` ROW – v77's shape, one wave on:
//
//   · `latchedWeek: number | null`  – the week the wedding happened on THIS episode. The latch
//     lives ON THE ROW and never as a global boolean (the 11.09 re-shape, on the owner's own
//     «а свадьба может быть у нас не одна, кстати?»): a marriage is a property of one episode, a
//     divorce (if ever built) is an ending on a latched episode, and a second wedding is the same
//     machinery on a later row – zero migrations later. Back-fill null: no career has ever reached
//     a wedding, because until this version there was no wedding to reach.
//   · `partnerName: string | null`  – written ONCE at the engagement beat by `partnerNameFor`
//     (drawn on `seed:life:partner-name:<episodeId>`, persisted, never re-derived at read – a later
//     pool edit must never rename a husband an old career already has). Back-fill null: nobody was
//     ever named, and readers fall back to the unnamed phrasing they use today.
//
// ⚠⚠ THE MIGRATION WALKS `loveEpisodes` AND `??=`s EACH ROW – v77's nested peel is the precedent,
// and its standing note in migrations.ts binds here too: the golden corpus could not witness a
// per-row back-fill until THIS version, whose own fixture (v83.json) is the first golden save that
// HOLDS episode rows. The crafted witness is tests/wave7-wedding-schema.test.ts.
//
// ⚠ THE `'wedding'` MILESTONE MEMBER RIDES THIS SAME BUMP (T3's album entry) – a new persisted
// union member is a schema change by invariant 3 (the v44 'facility' / v66 'business' precedent),
// and it ships inside this version rather than costing a second one.
//
// ⚠ ZERO MAIN DRAWS ANYWHERE IN THE WAVE. The hazard is `seed:life:wedding:<week>`, the name is
// `seed:life:partner-name:<episodeId>` – purpose-scoped sub-streams, re-derived at the call site,
// persisting nothing – so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction.
// The frozen careers are predicted IDENTITY in behaviour: 156 weeks never reaches 23, so no wedding
// hazard, no beat, no name and no cost can fire there – the per-key diff moves on `schemaVersion`
// everywhere and on `loveEpisodes` only where a row exists to gain the two null fields
// (`eliteGrinder`, v77's own witness cell).
//
// Full move: this constant, the v82 -> v83 step in migrations.ts, tests/fixtures/saves/v83.json,
// its row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's
// mechanically-checked schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts.
// ⭐⭐⭐ v84 – THE ALBUM's ONE SCHEMA MOVE (docs/specs/the-album-2026-09.md §3, his ruling of 19.09 –
// path (а): «хорошо бы, чтобы в финальный альбом что-то оттуда попадало тоже вообще. Первый раз на
// корте, первый турнир и/или победа»). ONE key on the world:
//
//   · `prologueTrace: PrologueTrace | null` – the compact slice of the childhood's own `PrologueRun`
//     (`picks`, `entries`, `opens`; the origin stays on the profile, where it already lives),
//     written ONCE at the handover by `createWorld` from the handover's optional `trace` and by
//     nothing else – not a migration, not any phase of the tick. The prologue threw this away at the
//     handover until now (the spec's own grep: no narrative trace anywhere), and the album's first
//     chapter cannot be written out of nothing.
//
// ⚠⚠ THE BACK-FILL IS `null` AND IT IS EXACTLY TRUE RATHER THAN A BARGAIN – his own word on the
// missing history: «это не страшно». No save written before this version walked a childhood whose
// record survived the handover, and a wizard career never walks one at all; for both, «no record»
// is the complete statement, and the album's first chapter honestly does not exist for them. The
// tempting reconstruction (re-deriving a run off the career's seed) is refused for `form`'s own v80
// reason: the run is the PLAYER's walk, not a function of the seed, and no function of today's
// world returns the cards he answered.
//
// ⚠ ZERO DRAWS ANYWHERE IN THE MOVE. The migration writes one literal; the writer copies a wire
// value; the album that reads it draws only on the purpose-scoped `seed:album:flavour:<sheet>`
// sub-stream at assembly time, re-derived at the call site and persisting nothing – so the frozen
// MAIN capture (41550 / e6b0c709) is untouched by construction. The frozen careers move on
// `schemaVersion` and the new key alone: `walkFrozenCareer` builds its worlds with no prologue, so
// every cell carries `null` – a pure key append, `PRE_V84` in tests/coachTravelEdgeFixtures.ts
// asserts the verbatim v83 constants come back off the peel.
//
// Full move: this constant, the v83 -> v84 step in migrations.ts, tests/fixtures/saves/v84.json,
// its row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's
// mechanically-checked schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts. The non-null shape's witness (the corpus cannot hold one – a
// walked probe skips the prologue) is tests/album-trace-schema.test.ts, through the real writer.
// ⭐⭐⭐ v85 – THE PREGNANCY AND THE RETURN, WAVE 8 T1 (`docs/plans/life-wave-8-builder-2026-09.md`
// §2 T1; the design `docs/plans/the-wedding-and-the-children.md` §5, steps W3+W4). TWO keys on the
// world and ONE union widened – and, after gate 2, a THIRD key, whose own block sits below these:
//
//   · `pregnancy: PregnancyState | null` – the one she is carrying, or nothing. `null` is the state
//     of every career that is not expecting, which on this tree is every career there is: T1 ships
//     the seat and NO WRITER AT ALL (the hazard is T2's, the pause T3's, the birth T4's).
//   · `children: ChildRecord[]` – the born, append-only, one row per birth. Empty is the state of
//     every career that has had none. It is on the world rather than on the pregnancy because a
//     birth must land somewhere the week it happens and the pregnancy that produced it is cleared
//     the same week (§0's own delta): W5 then READS the array and appends fields to the row if it
//     needs them, its own append-only move, where a birth recorded only on `pregnancy` would make
//     W5's migration re-derive children from episode history.
//   · `spiritShock.kind` widens `'breakup'` -> `'breakup' | 'postpartum'`. The build plan's step-7
//     row reserved exactly this widening and the field's own note predicted it in as many words
//     («a union with one member today, on purpose, and the roster is the place the second one gets
//     noticed»). TYPE-LEVEL ONLY, WITH NO DATA TO MIGRATE: no save can hold `'postpartum'`, because
//     nothing has ever written it – T4 is the only writer the kind will ever get.
//
// ⭐⭐⭐ AND A THIRD KEY, ADDED TO THIS SAME VERSION AFTER GATE 2 (20.09, the architect's ruling –
// task T2½ piece 1). `comeback: ComebackState | null` – the week she came back and the freeze she
// came back with:
//
//   · T6 needs BOTH facts persisted and NEITHER is derivable. `protectedRank.entriesLeft` counts
//     down as she spends her twelve entries, so it is mutable state; `returnedWeek` is the staged
//     factor's only argument and nothing in the world records it (`dueWeek` is the BIRTH, and the
//     decision lands anywhere inside a 20-week window after it).
//   · IT CANNOT LIVE ON `pregnancy`, for a reason §0 states as a REQUIREMENT: «this wave builds the
//     machinery so re-entry is free», and T2's gate refuses while a pregnancy exists – so the record
//     must be CLEARED at the return for W5's repeat pregnancy to be possible at all. State that
//     outlives the pregnancy cannot live on the pregnancy.
//
// ⚠⚠ WHY v85 GREW RATHER THAN v86 ARRIVING, and it is the one argument that licenses this: NOTHING
// HAS SHIPPED. v85 exists only on `life/wave-8`, no save in the world holds it, and §0's «this wave
// takes 85» – the sentence the owner read – stays true. ⚠ AND THIS IS THE LAST KEY v85 TAKES: the
// architect walked T3–T11 against T1's shape and this was the only gap, so a second one is a STOP
// and a question rather than a fourth key. A version that grows twice is a version nobody can reason
// about.
//
// ⚠⚠ THE BACK-FILL IS `null` AND `[]`, AND BOTH ARE EXACTLY TRUE RATHER THAN BARGAINS. This is
// `loveEpisodes`'s v72 argument and emphatically NOT `prologueTrace`'s v84 one a paragraph up: there
// is nothing here that a reconstruction is even TEMPTED by. No save written before this version
// could hold a pregnancy or a child, because there were none to hold – the mechanic arrives with
// this version – so «not expecting» and «no children» are the complete statement about every career
// in the corpus, and no evidence anywhere in a save could say otherwise.
//
// ⚠ ZERO DRAWS ANYWHERE IN THE MOVE. The migration writes three literals and reaches no stream at
// all; the wave's own draws, when its later tasks land, live on `seed:life:pregnancy:<week>` and
// `seed:life:return:<week>` – purpose-scoped sub-streams re-derived at the call site, persisting
// nothing – so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction. The frozen
// careers are predicted and MEASURED IDENTITY: `walkFrozenCareer` runs 156 weeks from the start, the
// girl never reaches 23, and in any case no writer exists on this tree for any of the three, so
// every cell carries `null`, `[]` and `null` – a pure key append, and `PRE_V85` in
// tests/coachTravelEdgeFixtures.ts holds the verbatim v84 constants off the peel. RE-MEASURED for
// the third key, never assumed: the per-key diff was taken again on the untouched tree before
// `comeback` was written.
//
// Full move: this constant, the v84 -> v85 step in migrations.ts, tests/fixtures/saves/v85.json,
// its row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's
// mechanically-checked schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts. The non-null shape's witness is tests/wave8-pregnancy-schema.test.ts,
// which crafts one – the corpus CANNOT hold one and will not until T11 regenerates the e2e fixtures
// over a tree that has writers.
export const SAVE_SCHEMA_VERSION = 85



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

/** ⭐⭐⭐ THE YEAR-FOCUS (v76, the psychologist's year – `docs/specs/the-psychologists-year-2026-09.md`
 *  §2 is the ruled table, `docs/plans/life-wave-5-builder-2026-09.md` §2 T3 the mechanics). What the
 *  seat WORKS ON for a season: `'coolhead'` composure, `'recovery'` the walk back from a shock,
 *  `'listen'` the parent's own reading of her, `'herself'` her deliberate work beyond her nature's
 *  baseline, `'publicLife'` the weight of being looked at. One a season, changed only in the
 *  off-season window.
 *
 *  ⭐⭐⭐ AND SINCE v77's T5 THERE IS A FIFTH: `'publicLife'` – «The public life», the spotlight focus
 *  (O7, ruled 13.09: «ships WITH the spotlight wave, not before it has something to shrink»). While
 *  it is held, wave 6's exposure pressure shrinks by rung and habituation accelerates by rung – both
 *  in `engine/spirit.ts`, and neither is a new kind of thing: the year machinery below is wave 5's,
 *  byte for byte, and this member inherits it whole.
 *
 *  ⚠ A UNION AND NEVER FIVE BOOLEANS, the argument `spiritShock.kind` makes one field up: exactly one
 *  focus is live at a time (the spec's own «1 session a week at every rung – the rung buys WHO comes
 *  to the call»), and a union makes that unrepresentable-otherwise rather than merely documented.
 *  ⚠⚠ AND WIDENING IT DOES **NOT** GO RED AT EVERY READ, WHICH IS THE SENTENCE v76 GOT WRONG AND THE
 *  ARCHITECT'S RULING O MEASURED. The two `Record<PsyFocus, string>` catalogues in
 *  `world/psychologist.ts` are total and DO go red; `PSY_FOCUSES` – the array the seat iterates, the
 *  refusal filter walks and the string tests read – is a `readonly PsyFocus[]`, and an array of four
 *  is a perfectly valid array of a five-member union. So the one site that decides whether a focus is
 *  ever OFFERED is the one the compiler will not defend. Wave 5 left the tripwire for it and wave 6's
 *  T5 re-aimed it to a MEMBERSHIP oracle against the type-forced Record
 *  (`tests/wave5-psychologist-focus.test.ts` §A) – a length is not a membership, and the compiler
 *  already holds the complete list.
 *
 *  ⚠ DECLARED HERE RATHER THAN IN `shared/protocol`, on `Temperament`'s own precedent: this is an
 *  ENGINE fact that the wire happens to carry later (T2 puts it on the snapshot), and
 *  `shared/protocol/narrative.ts` already imports `Temperament` type-only from `engine/spirit` for
 *  exactly that shape. The arrow stays engine -> shared, never the other way. */
export type PsyFocus = 'coolhead' | 'recovery' | 'listen' | 'herself' | 'publicLife'

/** ⭐⭐⭐ WHAT PUT THE SHOCK ON HER (v85 T1) – see `WorldState.spiritShock`, whose `kind` this names.
 *
 *  ⚠ IT IS A NAME FOR A UNION THAT WAS ALREADY BEING READ THROUGH
 *  `NonNullable<WorldState['spiritShock']>['kind']` IN TWO FILES, and it exists so a THIRD reader does
 *  not have to spell that again. The derivation stays valid – this type and that expression are the
 *  same union – so `PsyRegister` in world/lifeBeat.ts is untouched by the naming.
 *
 *  ⚠⚠ THE POINT OF NAMING IT IS TOTALITY ACROSS THE MODULE BOUNDARY, which is `ExposureKind`'s own
 *  argument in engine/economy.ts quoted rather than re-made: a `Record<SpiritShockKind, …>` in the
 *  constants file goes red the day a kind joins, instead of letting one ship priced at `undefined`.
 *  The build plan's step 8 (a death in the family) is the next member this is waiting for. */
export type SpiritShockKind = 'breakup' | 'postpartum'

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
  /** ⭐ v76 (amended pre-merge, 14.09 – the owner's ruling on the elite gate's currency): the best
   *  domestic best-6 sum she has EVER held – `bestFinishByTier`'s sibling, and the same doctrine
   *  its own docblock names: a HIGH-WATER MARK. `kidPoints` is a rolling 52-week window over a
   *  ledger that prunes, so «has she ever proved herself» is a question the live fold LOSES the
   *  answer to – measured: every 400-week career ends at 0 domestic points, and the shipped gate
   *  refused a $4.9M professional. Written in `recomputeKidRank` (the only place the fold can
   *  rise), read by the elite gate through `eliteGateStandingOf` alongside the pro one-way door.
   *  Backfills 0: an old save's pruned past cannot be invented (the v46 byTrack doctrine) – the
   *  W-professional arm covers migrated pros, and a live junior re-earns it on her next fold. */
  peakDomesticPoints: number
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
  /** ⭐⭐ v65 – WHO WON IT. Titles taken in the current season, by rung and then by champion id:
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
  /** ⭐ v72 (the private life, wave 1): THE WEATHER – how she is this week, 0..100 in TENTHS, start
   *  70. Written ONLY by `accrueSpirit` (engine/spirit.ts – pure arithmetic, zero draws on any
   *  stream), read ONLY by `spiritMatchFactor` at the match seam. ⚠ NEVER SHOWN AS A NUMBER: no
   *  meter, no tile, no bar, no arrow, on any surface, ever – the fog rule. */
  spirit: number
  /** ⭐ v72: THE STANDING – what the parent has built with her, 0..100 in steps of 0.5, start 70.
   *  Moves ONLY on parent DECISIONS (the knock, the played-hurt entry, the birthday, a family week,
   *  and a season that had none), then regresses toward 70 at 0.5/week on `accrueSpirit`'s own pass.
   *  Never a scoreline, never the weather. Same fog rule: it is never a number on a screen. */
  bond: number
  /** ⭐ v72: WHO SHE IS – one trait, two axes, four ids, drawn once at `createWorld` off
   *  `seed:temperament` and never re-rolled. ⚠ The derivation is `temperamentFor` (engine/spirit.ts)
   *  and the v71 -> v72 migration calls THAT SAME function on the career's own seed, so an existing
   *  career turns out to have always been her – zero draws, bit-stable. Never shown as a label. */
  temperament: Temperament
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
  /** ⭐ THE WEEKS HER KIT STOOD DOWN - every resolved week she spent on a booked family holiday.
   *  The owner's ruling 5 of 09.08: «Ну да, занятий же нет, по-моему логично» - a vacation stops the
   *  wear clock. Round-15 #14 asked it, round-16 #8 re-asked it, round-29 #20 is the fourth asking.
   *
   *  ⚠ WHY A LEDGER RATHER THAN A COUNTER, and it is the one thing this field cannot be talked out
   *  of: wear is DERIVED from a purchase week (`weeksSinceGear`), so the question the model asks is
   *  "how many rest weeks fell between THEN and now" - a span, not a total. A running total cannot
   *  answer it without a second number captured per line at every purchase, and the scheduled
   *  purchases are never stored at all.
   *
   *  ⚠⚠ AND IT CANNOT BE READ OFF `world.vacations`, which is the trap this field exists to avoid.
   *  `prunePlannerBookings` keeps only `PLANNER_TRAIL_WEEKS` (4) of trailing bookings, so a holiday
   *  is GONE from that array long before the shoes it stood down are replaced. Deriving from it
   *  would have looked right in a unit test and been wrong on every real career.
   *
   *  ⚠ OPTIONAL ON THE TYPE, and NOT a schema move - the `kit?` precedent directly above and the
   *  recorded widening precedent (commit 2763caa, cited twice in shared/protocol/events.ts). Absent
   *  is exactly what every historical save and every hand-built test world already mean: no rest
   *  recorded, so the clock runs on calendar weeks, which is the shipped behaviour byte for byte.
   *  An in-flight career therefore keeps its wear history and gains the pause from the next holiday
   *  on. `SAVE_SCHEMA_VERSION` does not move, no migration is owed and no golden fixture is added.
   *
   *  Bounded by `GEAR_REST_WINDOW` - see `recordGearRestWeek`, which is the only writer. */
  gearRestWeeks?: number[]

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
  /** ⭐⭐ ROUND 39 #5 (v71) – HAS THIS CAREER EVER FOUNDED A MERCH BRAND? The one fact the
   *  sell-and-rebuy fix needs and the rows cannot carry: a sold brand's row is DELETED
   *  (`sellAsset` filters it out), so «the family founded one once» survives nowhere else.
   *  Written `true` by `buyAsset` on every business-family purchase, never unset – founding is a
   *  thing that happened. Read by `assetEntryPriceCents`: the FIRST founding costs the flat
   *  catalogue price (his law, «неизменно для первого открытия стоит 250к»), a REPEAT founding
   *  costs the market's current derived worth of the brand.
   *
   *  ⚠ OPTIONAL, AND ABSENT MEANS «NO FOUNDING ON RECORD», which is exactly true of a new career
   *  and of every pre-v71 save that owns no brand (the v71 migration back-fills `true` only where
   *  a brand is OWNED – owning one proves founding one; anything less keeps the benefit of the
   *  doubt). */
  brandFounded?: boolean
  /** ⭐⭐ v73 – EVERY LIFE BEAT THIS CAREER HAS LIVED, append-only and never pruned (the private
   *  life, wave 2). A row whose `answer` is null is waiting to be answered, and that absence IS the
   *  pending state – there is no second boolean to desync.
   *
   *  ⚠ REQUIRED SINCE v73 – the schema move step 4 landed. It shipped OPTIONAL in wave 2's wire so
   *  both halves of the wave could build against the seam before anything wrote a row; the migration
   *  now back-fills `[]` on every older save, so every career carries it. `lifeLogOf`'s `?? []`
   *  survives as the courtesy `birthdayHistory` extends to probe worlds hand-built in tests, which
   *  are not saves and predate every field they do not set. */
  lifeLog: LifeBeatRecord[]
  /** ⭐⭐⭐ v74 – EVERY ATTACHMENT THIS CAREER HAS LIVED, append-only and never pruned (the private
   *  life, wave 3; `docs/plans/the-private-life-build.md` §4 step 3, constants from
   *  `docs/specs/who-she-is-2026-09.md` §4). A handful of rows per career at most, which is
   *  `world.birthdays`' own argument for keeping all of them.
   *
   *  ⚠⚠ THE ACTIVE ATTACHMENT IS DERIVED AND NEVER STORED – the last row with `endedWeek === null`,
   *  read through `activeEpisode` (world/lifeBeat.ts) and through nothing else. A nullable «current
   *  partner» slot beside this list would be a second source of truth for one fact, which is the
   *  defect `lifeLog`'s own missing-`pending`-boolean note names one field up.
   *
   *  ⚠ EPISODES RATHER THAN A SLOT, for the 09.09 re-cut's reason (review find #5): a romance that
   *  begins AND ENDS before the parent knew must survive save and reload intact and surface later as
   *  one honest late row. A slot would have overwritten it the next time someone appeared.
   *
   *  ⚠ REQUIRED FROM THE DAY IT ARRIVES, unlike `lifeLog` above – there is no wire half to build
   *  against this time, so the field ships with its migration and every save carries it. Wave 3
   *  never writes `endedWeek`; wave 4 does, and the cooldown that reads it lands now so that wave
   *  changes nothing here. */
  loveEpisodes: LoveEpisode[]
  /** ⭐⭐⭐ v75 – WHAT AN ENDING LEFT ON HER, AND IT IS A MARK RATHER THAN A MECHANISM (the private
   *  life, wave 4; `docs/plans/life-wave-4-builder-2026-09.md` §2 T3, constants from
   *  `docs/specs/who-she-is-2026-09.md` §4). Non-null from the week an attachment ends until spirit
   *  has climbed back to within two points of her own baseline, where `accrueSpirit`'s tail clears it
   *  – those are the only two sites that may ever write this field.
   *
   *  ⚠⚠ IT IS NOT THE PHYSICS AND MUST NEVER GROW INTO IT. The DROP (−22 steady / −34 intense) goes
   *  through the standing perturbation path and the RECOVERY is the standing weekly return with no
   *  special curve at all – §2 T3's «recovery is the standing weekly rule and NOTHING else». What
   *  this field adds is the one fact the numbers cannot state: that a live shock is WHY she is under
   *  her line. A spirit of 48 looks identical whichever way it got there, and a reader that had to
   *  infer the cause from the number would be re-deriving a fact instead of reading one.
   *
   *  ⚠ `kind` IS A UNION WITH ONE MEMBER TODAY, ON PURPOSE, and the roster is the place the second
   *  one gets noticed. `'breakup'` is wave 4's; the build plan's steps 7–8 add the others. A bare
   *  boolean or a bare week would have to be WIDENED by a migration when they arrive, where a union
   *  widens in place and every exhaustive read goes red at the site that has to decide – the same
   *  argument `LifeBeatKind` and `LIFE_ROW_KINDS` each make for their own rosters.
   *
   *  ⭐⭐ T3 HAS LANDED (12.09) AND THIS NOTE IS RE-AIMED RATHER THAN LEFT TO AGE. It read «NOTHING
   *  READS IT IN T1, AND THAT IS CORRECT RATHER THAN UNFINISHED – the seat lands before the writers so
   *  the schema move stays inert and provable», which is what v74's `loveEpisodes` said one wave down
   *  and it held for exactly two commits. The two writers are now real and they are the only two:
   *  `rollEnds` SETS it on the week an attachment ends (world/lifeBeat.ts §8) and `accrueSpirit`'s
   *  tail CLEARS it (engine/spirit.ts). The applier is the same `accrueSpirit`, which keeps the points
   *  in the one function that has ever written `world.spirit`.
   *
   *  ⚠⚠ AND THE READER LIST IN THE OLD NOTE WAS WRONG IN ONE HALF, WHICH IS WRITTEN DOWN HERE RATHER
   *  THAN QUIETLY DROPPED. It named «`DiaryFacts.freshBreakup` and wave 2's Mood collision rule». The
   *  first is right and is T6's. **The second does not exist**: `idleRead` (shared/avatarEmotion.ts)
   *  implements injury → the larger deviation of body vs mood → ties to the body, and its own ⚠ note
   *  says in as many words that «the existing result logic» is the layer that is UNCHANGED and stays
   *  on TOP – R8-6a, a face the owner ruled on twice. The build plan's «a live `spiritShock` outranks
   *  result joy» (§4's collision contract) was therefore never built, and T3 did not invent it: a
   *  rule that demotes a fresh win is a wording-and-face decision that belongs to the owner. So the
   *  Mood surface shows the shock the way the layer was always going to show it – through the NUMBER.
   *  −22/−34 puts her two or three rungs down the ladder and `spiritBandOf` reads it, which needs no
   *  reader of this field at all.
   *
   *  ⚠ AND IT IS STILL DELIBERATELY NOT ON THE WIRE – the old note expected T3 to carry a snapshot
   *  field «with its reader», and T3's reader turned out not to need one. `Snapshot` is assembled
   *  field by field (invariant 1: the UI never sees a `WorldState`), and the one reader this layer is
   *  getting – `DiaryFacts.freshBreakup`, T6's – travels on `diary.facts`, which is already on the
   *  wire. A `spiritShock` beside it would be a second road to one fact. `WorldEvent.lifeKind` is the
   *  opposite case and needs no such decision: the feed ships the event ROWS THEMSELVES
   *  (`snapshotEvents`, world/snapshot.ts), so widening the row widens the wire by construction.
   *
   *  ⭐⭐⭐ v76 T4 – `weeks?` JOINS IT, AND NO SCHEMA BUMP IS OWED (the architect's ruling C,
   *  `docs/plans/life-wave-5-rulings-2026-09.md`). HOW MANY WEEKS OF THIS SHOCK THE PSYCHOLOGIST
   *  ACTUALLY WORKED – incremented inside `accrueSpirit` on exactly the weeks the recovery slope
   *  applied, and read ONCE, at the clear, by the receipt that says «she came back sooner».
   *
   *  ⚠⚠ IT EXISTS BECAUSE THE SPAN IS NOT THE HELD HALF. `week` gives the span (`world.week − week`
   *  at the clear) and the world persists nothing else from which «the slope applied on week W» can
   *  be recovered. The cheap proxy – `psychologistFocusSeason` plus «on the payroll today» – reads
   *  IDENTICALLY for a parent who paid throughout and one who fired him for the shock and re-hired
   *  at the clear: a sentence claiming more than its code checks, which is the wave-4 monitor's own
   *  defect. So the weeks are COUNTED as they are worked.
   *
   *  ⚠ OPTIONAL ON A TRANSIENT RECORD, WHICH IS THE HOUSE RULE AND NOT A CONVENIENCE.
   *  `pendingTournament.masseurThere?` (v59 step 2) is the precedent: a key on a record created and
   *  discarded inside play back-fills to ABSENT, and absent is EXACTLY TRUE here – «no week of this
   *  shock was ever worked», which is what a shock predating the counter is. `injury.weeksSaved` is
   *  the same instrument one seat over, for the same seat's neighbour's claim. No migration step, no
   *  fixture rung, nothing for the frozen corpus to peel: a career that never hires never grows the
   *  key.
   *
   *  ⭐⭐⭐ v85 T1 – THE SECOND MEMBER ARRIVES, AND THE ROSTER IS WHERE IT GOT NOTICED, exactly as the
   *  `kind` note above said it would (wave 8, the pregnancy and the return; the build plan's step-7
   *  row reserved this widening by name). `'postpartum'` is the mark the months after a birth leave
   *  on her line – the same field, the same applier (`accrueSpirit`), the same clear, and a DIFFERENT
   *  CAUSE, which is the whole reason `kind` is a union and not a boolean: a spirit of 48 looks
   *  identical whichever way it got there, and a reader that inferred the cause from the number would
   *  be re-deriving a fact instead of reading one.
   *
   *  ⚠⚠ TYPE-LEVEL ONLY, AND THERE IS NO DATA TO MIGRATE – which is an arithmetic fact and not a
   *  bargain: no save in existence can hold `'postpartum'`, because no code has ever written it.
   *  WIDENING a union can never invalidate a stored value (NARROWING one is the direction that costs
   *  a migration), so the v84 -> v85 step says nothing about this field and the golden corpus owes it
   *  no rung. That is what «the seat lands before the writers» buys: the shape moves for free.
   *
   *  ⚠ T1 SHIPPED THE MEMBER AND NO WRITER, AND **T4 IS THAT WRITER** – `landBirth`
   *  (`world/lifeBeat.ts` §14) stamps `'postpartum'` on the week the child is born, `rollEnds` (§8)
   *  stamps `'breakup'`, and those two are the whole list. The old sentence («nothing on this tree can
   *  produce a `'postpartum'` shock however long a career runs») was true of the T1 tree and is
   *  corrected here rather than left, because the field is ONE SLOT and the pair of writers is the
   *  fact a reader most needs from it: the second write REPLACES the first, deliberately, so a
   *  mid-term break-up still recovering when the child arrives is overwritten by the larger window
   *  (the brief's §2 T4; pinned in tests/wave8-birth.test.ts §D). */
  spiritShock: { week: number; kind: SpiritShockKind; weeks?: number } | null
  /** ⭐⭐⭐ v76 – THE PSYCHOLOGIST IS ON THE PAYROLL (the psychologist's year, wave 5;
   *  `docs/plans/life-wave-5-builder-2026-09.md` §2 T2, the seat's ruled shape from
   *  `docs/plans/the-travelling-team-2026-08.md` §2 ruling Б). `masseurHired`'s twin one seat over,
   *  and false for every earlier save for the identical reason: the seat did not exist.
   *
   *  ⚠ HIS RETAINER SUSPENDS RATHER THAN CANCELS at college and on a family vacation week – the
   *  masseur's stand-down pair mirrored byte-for-byte in shape (T2's `psychologistWorksInWeek`) – so
   *  the flag survives the freeze exactly as `masseurHired` does.
   *
   *  ⚠ T1 SHIPS THE SEAT AND NO WRITER AT ALL. `hirePsychologist` is T2's; nothing on this tree can
   *  set this to `true` except a test poking the world, which is what «the schema move is inert»
   *  means and what the frozen careers measure. */
  psychologistHired: boolean
  /** ⭐ THE RUNG (v76) – WHO COMES TO THE CALL, which is the whole of what the price buys (the spec's
   *  own «1 session a week at every rung – the rung buys WHO comes to the call»). `0 | 1 | 2` indexes
   *  `ECONOMY.psychologist.rungs`, T2's block.
   *
   *  ⚠ THE BACK-FILL AND THE FRESH-CAREER DEFAULT ARE BOTH `1`, THE MIDDLE RUNG, and that is v59's
   *  `masseurSessionsPerWeek` precedent quoted rather than re-argued: a dial has to read something,
   *  the sport psychologist is the professional default the rung prices are anchored to, and it is
   *  MEANINGLESS UNTIL HIRED – so no career is handed a decision it never made. Persisted because it
   *  is a CHOICE, like `kit`, `coachId` and the masseur's dial; this engine never re-derives one.
   *  Validated at its one writer, `setPsychologistRung` (T2). */
  psychologistRung: 0 | 1 | 2
  /** ⭐⭐ WHAT HE IS WORKING ON THIS YEAR (v76) – `PsyFocus` above, or null while nobody was ever
   *  asked. The first pick is free at hire; a CHANGE is off-season only and once a season (T3, O1's
   *  «season boundary only» made mechanical, guarded by `psychologistFocusSeason` below).
   *
   *  ⚠ FIRING KEEPS IT AS A DEAD LETTER rather than nulling it (T3's own rule): re-hiring mid-season
   *  resumes the year that was already started, and the season guard still refuses a change. A field
   *  cleared on fire would make «fire and re-hire» a free way round a once-a-season rule, which is
   *  the exploit `brandFounded` one field group up exists to close in its own shape. */
  psychologistFocus: PsyFocus | null
  /** ⭐ THE SEASON THE FOCUS WAS BOUGHT FOR (v76) – `psychologistFocusSeasonFor(week)` at the week of
   *  the pick, or null while no pick has ever been made. The once-a-season fact, RECORDED rather than
   *  re-derived: a «weeks since» arithmetic over the calendar would have to guess what a season
   *  boundary means for a pick made inside a college freeze, and this engine records decisions (the
   *  round-21 #2 «asked once, carried» doctrine). Written by `setPsychologistFocus` and read by
   *  `psychologistFocusRefusal` (both T3), and by nothing else.
   *
   *  ⚠⚠ IT IS THE YEAR THE CHOICE IS *FOR*, NOT THE WEEK THE CLICK HAPPENED IN (T3b, ruling I), and
   *  the difference is one +1 that decides how long a parent is held to a free pick. The off-season
   *  is the LAST THREE weeks of a 52-week block while `seasonIndexOf` is `floor(week / 52)`, so the
   *  off-season sits inside the index of the year it ENDS; stamping `seasonIndexOf(week)` therefore
   *  made a mid-season hire wait for the next block's off-season – up to two years. The expression
   *  lives once, in `world/psychologist.ts`, and the guard compares against that same call. */
  psychologistFocusSeason: number | null
  /** ⭐⭐⭐ v78, ROUND 42 #35 – HOW FAR ABOVE HER ROLLED CEILING THE PSYCHOLOGIST'S YEARS HAVE CARRIED
   *  HER, in composure points, one decimal, `0 .. ECONOMY.psychologist.composureBonusCap`.
   *
   *  THE OWNER, 15.09: «может быть даже сделать какую-то возможность превосходить заложенную с сидом
   *  выдержку с помощью психолога. Пусть и не сильно, но тем не менее», and the three numbers the
   *  same day: «+5 потолок, по очку за сезон, постоянный (здесь не уверен, можно всё таки небольшой
   *  откат сделать мне кажется, например 0.2пп за сезон без этой тренировки)».
   *
   *  ⚠⚠ IT IS HEADROOM AND NOT POINTS, WHICH IS THE ONE THING A LATER READER MUST NOT INVERT. This
   *  number does not sit in her composure; it raises the ceiling composure is allowed to climb to
   *  (`composureCeilingOf`), and ordinary development does the climbing on its own terms. So a bonus
   *  point is EARNED TWICE – the seat buys the room, the training fills it – and nothing in the
   *  engine ever adds to `skills.composure` behind `growWeek`'s back. The alternative, adding the
   *  bonus onto her value at the read, is one line shorter and makes the wing jump on a week she did
   *  nothing, which is the whole thing a ceiling exists to prevent.
   *
   *  ⚠⚠ AND THE DECAY IS SCOPED TO THIS QUANTITY ALONE – the owner's own clarification, 15.09, and
   *  the one thing a builder can get wrong here: «чтобы у нас обычный естественный прирост тоже
   *  работал, т.е. пока она растёт и без психолога у неё всё равно этот навык может тренироваться в
   *  зависимости от сида». Below the rolled ceiling composure grows exactly as it always has,
   *  seed-driven, psychologist or no psychologist. The −0.2 only ever eats what this field bought.
   *  `growWeek`'s `composureEase` is bounded by `min(this week's fall, how far she is above the NEW
   *  effective ceiling)`, so it can never reach a point training earned and it can never reach
   *  `veteranPoise`'s own excess beyond one week's fall.
   *
   *  ⚠ A PERSISTED NUMBER AND NEVER A DRAW. It moves by a constant each week – up while the seat
   *  works the `'coolhead'` focus, down while it does not – so `composureBonusAfterWeek` is pure,
   *  total and RNG-free, and `tests/condition.test.ts`'s MAIN capture (41550 / e6b0c709) cannot see
   *  it. It is also why the field has to exist at all: «how many seasons of nerve work has this
   *  family paid for» is not recoverable from the save. `psychologistFocusSeason` is a stamp, not a
   *  tenure – its own block above refuses that proxy for T4's receipt, for the same reason.
   *
   *  ⚠ THE RATE IS PER WEEK AND THE CONSTANTS ARE PER SEASON, which is `coolheadPerSeason`'s own
   *  shape one field over and not a re-reading of his numbers: a whole season worked is exactly +1
   *  and a whole season idle is exactly −0.2, and a season half worked is proportional instead of
   *  needing an invented threshold for what «continuous» means. It matters, because the seat STANDS
   *  DOWN by design on a college freeze and a booked family week (`psychologistWorksInWeek`) – a
   *  season-boundary rule would have to decide whether a family holiday voids the year, and this one
   *  simply charges it three weeks of accrual. */
  composureBonus: number
  /** ⭐⭐⭐ v78 – THE SPARRING SEAT, KEYS ONLY (round 42 #45, the owner's re-scope of item 19). Hired,
   *  and at which rung of `the-form-and-the-sparring-2026-09.md` §4's three.
   *
   *  ⚠⚠ NOTHING ON THIS TREE READS EITHER, AND THAT IS DELIBERATE RATHER THAN UNFINISHED. The seat's
   *  behaviour – «the slump is the psychologist's patient, the rust is the sparring partner's», the
   *  RHYTHM channel's drift cut by rung – is this round's bundle 13. Two fields cannot justify a
   *  schema move of their own, so they ride v78's bump with the two customers that can, and the
   *  migration's own comment says so too. A reader who finds an unused key here is reading a
   *  SCHEDULING decision, not a half-built feature.
   *
   *  ⚠ The back-fills and the fresh-career defaults are `false` and the middle rung `1`, which is
   *  `masseurHired`/`masseurSessionsPerWeek` (v59) and `psychologistHired`/`psychologistRung` (v76)
   *  quoted rather than re-argued: the seat did not exist so nobody was in it, and a rung has to
   *  read something while being meaningless until hired. */
  sparringHired: boolean
  /** which rung of the sparring ladder the family is paying for – see `sparringHired` above for the
   *  whole of why these two are here and nothing reads them. */
  sparringRung: 0 | 1 | 2
  /** ⭐⭐⭐ v79, ROUND 42 #48 – DOES THE SPARRING PARTNER TRAVEL WITH HER, the owner's 15.09 override
   *  («у остальных есть галочка ездит»). The THIRD sparring key, and the one v78 was scoped before he
   *  gave it – its own block names this field's absence as one of the two reasons the seat did not
   *  land in that round.
   *
   *  ⚠ NOTHING READS IT EITHER, and that is the same SCHEDULING decision the two fields above carry,
   *  not a half-built feature: the seat lands with wave F1, with the ladder, the prices and the
   *  RHYTHM channel its whole effect cuts. It rides v79 because a boolean costs this version nothing
   *  and a schema move of its own would have cost it a fixture, a peel rung and ten e2e
   *  regenerations.
   *
   *  ⚠ `false` in both the back-fill and the fresh-career default, which is `sparringHired`'s own
   *  answer quoted rather than re-argued: the seat did not exist, so nobody was in it and nobody was
   *  travelling. */
  sparringTravels: boolean
  /** ⭐⭐⭐ v80, WAVE F1 – HER FORM. Tenths, 0-CENTRED, clamped `[-10, +10]`, and 0 is neutral in both
   *  the back-fill and the fresh-career default (`docs/specs/the-form-and-the-sparring-2026-09.md`
   *  §1). `src/engine/form.ts` holds the whole model; this is the one number it writes.
   *
   *  ⚠⚠ NOT A SECOND CONDITION AND NOT A SECOND SPIRIT, which is §3's first fence and the reason
   *  this field can exist at all. `condition` is her BODY this week and has a dial, a doctor and a
   *  screen; `spirit` is her LIFE this week and reaches a match through its own factor; `form` is her
   *  TENNIS this week, driven ONLY by results and by rhythm, and steered by the parent through
   *  ENTRIES and through nothing else. There is no form dial, no form screen and no form doctor, by
   *  design rather than by omission.
   *
   *  ⚠⚠ AND NO SURFACE SHOWS IT (O2, the owner's 16.09 ruling: form is visible NOWHERE beyond the
   *  coach's sentence and the match itself in v1). It does not cross the wire: there is no `form`
   *  field on `Snapshot`, no number, no Mood word – that is `spirit`'s – and no diary line. The coach
   *  is «the eye» and the match is the evidence; the fog rule owns the rest.
   *
   *  ⚠ ZERO 0 IS THE IDENTITY AND NOT A PLACEHOLDER FOR ONE (v77's `composureBonus` rule). At 0 the
   *  reader adds an exact 0 and `kidMatchPlayerFor` takes the untouched early return it has always
   *  taken, so every migrated career and every stored `WorldMatch` replay composes byte-identically
   *  until a match or a gap actually moves her.
   *
   *  ⚠ ONE WRITER: the weekly pass in `world/phaseHerWeek.ts`, beside `accrueCondition`'s and
   *  `accrueSpirit`'s. ⚠ ZERO DRAWS ON ANY STREAM (O4) – `seed:form:<week>` stays reserved and
   *  unused, so the frozen MAIN capture cannot see this field. */
  form: number
  /** ⭐⭐⭐ v82, ROUND 42 #51 / ROUND 44 – WHAT THE FAMILY AND THE MAN ON THE PAYROLL ACTUALLY AGREED
   *  (`docs/specs/the-coachs-raise-2026-09.md`). `null` when she is coached by her parent, which is
   *  the honest reading of «no contract»: there is nobody to have one with.
   *
   *  ⚠⚠ THE SHIPPED DEFECT THIS EXISTS TO CLOSE. Until v82 the hired man's figure was stored NOWHERE
   *  and re-derived every week from her age and her ranking, so the family's payroll moved with
   *  results nobody had agreed to price – and it could FALL. The owner watched his fall 2.2k -> 1.8k
   *  across a season that went well: «мне кажется это не корректно».
   *
   *  ⚠ IT STORES HIS LABOUR AND NOT THE WEEKLY BILL, and the distinction is the fix rather than an
   *  implementation detail. A weekly bill is `rate x hours x corridor x jitter` and three of those
   *  four are things the family itself decides or the week itself does – freezing them would charge a
   *  parent who cut the training dial for sessions she never took. What a contract fixes is the MAN'S
   *  HOURLY RATE ABOVE THE COURT (`coachLabourCents`), and the court goes on floating because no
   *  coach's contract has ever fixed a club's rent. See `bandedRateCents` for the partition.
   *
   *  ⚠ THE MARKS ARE TAKEN WHEN THE DEAL IS STRUCK AND RE-TAKEN WHEN IT IS RE-STRUCK, which is what
   *  makes the annual ask a renegotiation rather than a rolling window. What he asks against is what
   *  has happened SINCE THE LAST TIME THIS FEE WAS AGREED – and for a deal struck thirty weeks ago
   *  that is a different and more honest question than «the last 52 weeks».
   *
   *  ⚠ ONE WRITER PER FIELD, deliberately: `settleCoachDeal` writes the whole object at a hire or at
   *  an accepted ask, and `bankCoachResidual` writes `residualSince` and nothing else, once a week,
   *  beside the form pass that has already computed the residuals. ZERO DRAWS on any stream. */
  coachDeal: CoachDeal | null
  /** ⭐⭐⭐ v79, THE CHEMISTRY WAVE C1 – HOW SHE AND EACH COACH SHE HAS WORKED WITH ACTUALLY GET ON,
   *  keyed on the coach's id (`docs/specs/the-chemistry-2026-09.md` §10). The owner, 16.09: «эта
   *  самая химия может как-то нарабатываться с разной динамикой – это может стать показателем,
   *  насколько ей комфортно с тренером».
   *
   *  ⚠⚠ A NUMBER WITH A HISTORY, WHICH IS THE WHOLE POINT AND IS WHY IT NEEDS A KEY AT ALL. Chemistry
   *  is not a roll at hire and not a snapshot: it is accrued weekly while that coach is hired, at a
   *  rate that moves with the relationship's own weather and with her results, so it is PATH-DEPENDENT
   *  and cannot be re-derived from the seed. ⚠ The AFFINITY can and is – `affinityFor` is a pure
   *  function of `(seed, coachId)` and is stored nowhere – and that is the half which keeps «every
   *  variation reproducible» true rather than aspirational.
   *
   *  ⚠ LEAVING PAUSES, IT DOES NOT RESET (spec §7, and it is the owner's own sentence: «"вернуться к
   *  её первому тренеру" – вот именно об этом я и говорю»). A fired coach keeps his row; hiring him
   *  again resumes from where it stopped. ⚠ And the pause is genuinely a pause and not slow decay – a
   *  decaying number would make firing a good coach a permanent punishment and turn the mechanic into
   *  a loyalty tax, which is C3's ruling, «no».
   *
   *  ⚠ THE MAP IS SPARSE AND «SHE HAS WORKED WITH NOBODY» IS `{}`. A row appears on the first week
   *  she trains with that man and never before – the market can be shopped for a decade without
   *  writing one – so the key's size is the number of coaches she has actually worked with.
   *
   *  ⚠ `standing` IS WAVE C2's AND NOTHING ON THIS TREE READS IT. See `SAVE_SCHEMA_VERSION`'s block
   *  for why it is in this key a wave early rather than in a second map later. */
  coachPairs: Record<string, CoachPair>
  /** ⭐⭐⭐ v76 – HER WALLS AND HER REGULATION, the two §2a leanings (`docs/specs/who-she-is-2026-09.md`
   *  §2a verbatim, the 09.09 third-sitting re-cut). One decimal like `spirit`, both starting at 0.
   *
   *  ⚠⚠ THIS IS DISPLACEMENT OF EXPRESSION AND NEVER A REWRITE OF HER – the one sentence of §2a that
   *  must survive every later reader. `temperament` above is BIRTH, FOREVER: the voice bibles, her
   *  humour, her syntax and the census identity all read it and always will (§3's fence). What moves
   *  here is how much of her reaches the parent – kicks raise walls («she stopped telling you
   *  things»), care lowers them back to HER OWN nature and no further. `open` is the openness axis,
   *  `reg` the regulation (intensity) one.
   *
   *  ⚠ SIGN CONVENTION, WRITTEN DOWN ONCE AND HERE: NEGATIVE is walls UP – expression pulled toward
   *  `private` / `intense`, the closed and dysregulated poles – and POSITIVE is past her own baseline
   *  toward `open` / `steady`. 0 is nature. Repair walks toward 0 and stops there for free; the
   *  positive side is BEYOND her baseline and is her own deliberate work (the `'herself'` focus at a
   *  close bond), which is the anti-«hugged into an extravert» gate §2a names.
   *
   *  ⚠ NEVER ON ANY SURFACE, v1 – no leaning, no number, no line, and that absence is designed (§2a:
   *  «no reader and no line ever sees the leaning – it exists purely so change can be gradual, rare
   *  and honest»). The four buckets stay the only expressed truth; the existing surfaces – the face,
   *  the Mood word, the diary bands, the feed's silence – ARE the telegraph. */
  wallsLean: { open: number; reg: number }
  /** ⭐⭐⭐ v76 – THE HYSTERESIS STATE (who-she-is §2a; wave-5 brief §2 T7). `true` on an axis means the
   *  EXPRESSED pole there is the opposite of birth. Both false back-fill, and both false on week 0.
   *
   *  ⚠⚠ A FLIP IS AN EVENT OF SEASONS AND THIS BOOLEAN IS WHY. A leaning read directly would flicker
   *  every time the bond band wobbled across a threshold; the flip arms past ±`flipArm`, fires on a
   *  purpose-scoped hazard, and un-arms only once the leaning is back inside ±`flipRelease` – the
   *  band between them is a dead zone that arms nothing. So the bucket a mechanic reads is a STATE
   *  the world carries, not a comparison it recomputes.
   *
   *  ⚠ THE ONE READER IS `expressedTemperamentOf` (engine/spirit.ts), which inverts each flipped axis
   *  and maps back through the same four buckets. In T1 that function has ZERO call sites in `src/`
   *  outside its own module: the mechanics are re-pointed in T7 and the voices NEVER are (§0.2's
   *  fence – the bibles, the tier-0/1 pools, the prompt registers and the birthday-ask weighting all
   *  keep reading BIRTH). While both booleans are false it returns birth, which is the whole of the
   *  zero-diff proof T1 ships. */
  wallsFlipped: { open: boolean; reg: boolean }
  /** ⭐⭐⭐ v77 – HOW MUCH OF LIVING KNOWN SHE HAS ALREADY DONE (the spotlight, wave 6;
   *  `docs/plans/life-wave-6-builder-2026-09.md` §2 T4, the model `docs/specs/who-she-is-2026-09.md`
   *  §3c: «a veteran star from a good home shrugs at cameras that once cost her sleep»). Accumulated
   *  «known weeks» toward `habituationFullWeeks`, one decimal like `spirit` and `wallsLean`.
   *
   *  ⚠⚠ IT ONLY EVER GROWS, AND THAT IS v1 SPEAKING RATHER THAN AN OVERSIGHT (brief §0.5): she does
   *  not unlearn living known. It grows only while she LIVES known – `newsStandingOf === 'known'`,
   *  the top band alone since D1 (14.09; a 'noticed' girl the light only visits never habituates) – not at
   *  all while either wall is flipped – walls freeze habituation, §3c verbatim, ruled EITHER-axis on
   *  14.09 – and faster while the fifth focus is held (T5). No decay term exists and none is coming
   *  without a ruling, which is said here so nobody adds one as an obvious omission.
   *
   *  ⚠ NEVER ON ANY SURFACE – the fog law, `wallsLean`'s own absence one field up and for the same
   *  reason. No meter, no number, no line, no snapshot field: the spotlight is READ through the
   *  feed's plain words, the Mood dips, the diary and the booth. A habituation printout would turn a
   *  weather system into a progress bar, which is the one shape §3c forbids.
   *
   *  ⚠ v77 SHIPS THE SEAT AND NO WRITER AND NO READER. The growth pass is T4 and the only reader is
   *  T3's `habituationScale` inside `accrueSpirit`'s own term; nothing on this tree can move it off
   *  `0`, which is what «the schema move is inert» means and what the frozen careers measure. */
  spotlightHabituation: number
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
  /** ⭐⭐ ROUND 29 #3 – THE WEEKS THE PARENT SAID "SHOOT AND PLAY ANYWAY".
   *
   *  A signed campaign can name a week she is also entered in a tournament, and round 28 shipped
   *  that collision as nothing at all. The owner ruled it a DECISION and named all three answers
   *  himself – pull out of the tournament, move or cancel the shoot, or do both and pay for it in
   *  condition. Three of the four answers REMOVE the collision (the entry goes, or the week leaves
   *  `shootWeeks`), so nothing has to be remembered for them. Only «do both» leaves the world in the
   *  state that raised the question, so only it needs a latch – without one `shootClashOpen` would
   *  ask again on the next press and the week could never be spent.
   *
   *  ⚠ IT IS THE LATCH AND NOT THE PRICE. What the week costs is charged off the FACT that she shot
   *  and played (`accrueCondition` reads the shoot week and `isCompetitionWeek`), never off this
   *  list – so a career that reaches the collision by some other road, a save written before this
   *  field existed included, is charged correctly and simply gets asked once.
   *
   *  ⚠ OPTIONAL, AND NOT A SCHEMA MOVE (`WorldEvent.entryRef`'s own rule, and `AdOfferTerms`'
   *  before it): absent means exactly what every historical save already means – nobody has answered
   *  this question – so no migration is owed, no golden fixture is added, and `SAVE_SCHEMA_VERSION`
   *  does not move. Every reader normalises with `?? []`. */
  shootClashAccepted?: number[]
  /** ⭐⭐⭐ THE TWO AGES THAT ARE HERS (v68, round 31 #10 + #13 – docs/specs/age-curve-fork-and-spread.md).
   *
   *  `ECONOMY.development.ageCurve` peaked every career 23-28, which §10 measured against the owner's
   *  own WTA reference as EXACTLY the college window worn by everybody. Three things move it now: the
   *  fork's ROUTE (direct 22/27, college 23/29), a per-career SPREAD drawn once off `seed:decline`,
   *  and the weeks her body has spent off court.
   *
   *  ⚠⚠ WHY IT IS PERSISTED AT ALL, AND IT IS THE WHOLE REASON THIS FIELD EXISTS. The owner is
   *  PLAYING a career – Alice, week 933, 31.7, at 93.1% of her peak – and a curve re-derived from her
   *  seed on the next load would change HER clock mid-game, under a player who has been reading that
   *  decline for a season. The v68 migration therefore writes {23, 29} onto every save that already
   *  exists, and this field is what makes that pin permanent: a stored pair is read as-is and nothing
   *  re-derives it, ever.
   *
   *  ⚠ OPTIONAL, AND WRITTEN AT THE FORK RATHER THAN AT `createWorld`. Absent means "she has not
   *  answered the fork yet", which is every career under nineteen – and nothing can read the field
   *  there, because `plateauStart` first bites at 18 and `declineStart` at 22. Two things follow, and
   *  both are load-bearing: the ROUTE is not knowable at week 0 (it is the fork's own answer), and the
   *  eighteen frozen career hashes in tests/coachTravelEdgeFixtures.ts walk 156 weeks to age 16.6, so
   *  a key that is never written there cannot move a hash. Measured, not assumed – §6 of the spec.
   *
   *  ⚠ `declineStart` IS THE DRAWN AGE, NOT THE AGE SHE ACTUALLY DECLINES AT. The injury pull is
   *  applied on READ (`ageCurveOf`), against `injuryFrom`, so the two halves stay separable and a
   *  save still says what she was born with after a career of layoffs. */
  ageCurve?: CareerAgeCurve
  /** ⭐⭐⭐ WHERE THE BRAND'S SLOW STOCK STOOD THE WEEK IT ARRIVED (v69, round 32 #4 –
   *  docs/specs/brand-inertia-2026-08.md).
   *
   *  ⚠⚠ IT IS A PIN, NOT A STOCK, AND THE DIFFERENCE IS THE WHOLE DESIGN. `brandStrengthAt` derives
   *  strength from records the career already keeps and never prunes, so nothing has to be carried
   *  from week to week; what CANNOT be derived is «what was this career reading the day before the
   *  update», and that is the one number stored here. `value` is the fame the career held at `week`,
   *  and the derivation treats every week at or before `week` as already answered by it.
   *
   *  ⭐ SO NO EXISTING CAREER'S NUMBER JUMPS ON THE TICK AFTER THE MERGE. The owner ruled the
   *  retroactivity question open («вообще всё равно, игроков нет пока»); the cheap half of that
   *  latitude is taken here – his Alice reads $831,382 on the load after the update exactly as she
   *  read it before – and the expensive half, re-pricing a fifteen-season history through a new
   *  kernel, is refused. Nothing about the choice is load-bearing and a later wave may revisit it.
   *
   *  ⚠⚠ WRITTEN ONCE, BY THE v68 -> v69 MIGRATION, AND BY NOTHING ELSE – not `createWorld`, not any
   *  phase of the weekly tick. Four things follow and all four are load-bearing:
   *    · a career started after this ships never carries the key and reads its whole own history,
   *      which is the behaviour a new career should have;
   *    · there is no per-week write, so there is no ordering to get wrong and no idempotence to
   *      protect – the second press of the fast-forward button prices the brand exactly as the first;
   *    · a save cannot drift the stock, because a load restores a pin and re-derives everything else;
   *    · and the eighteen frozen career hashes in tests/coachTravelEdgeFixtures.ts walk 156 weeks of a
   *      LIVE career, which the migration never touches – so the v69 bump moves `schemaVersion` and
   *      nothing else, the narrowest re-freeze that file recognises (`ageCurve`'s own v68 argument,
   *      by a different road). */
  brandStrengthSeed?: BrandStrengthSeed
  /** ⭐⭐⭐ WHO SHE DREW IN ROUND ONE, WRITTEN DOWN THE WEEK THE DRAW WAS SHOWN (v70, round 35 #14).
   *  Event id -> the opponent's player id, and that is the whole payload.
   *
   *  HIS COMPLAINT, 03.09: «на неделе перед турниром случилась жеребьевка, мне сказали "играем
   *  против №118 шанс 71%", пошел турнир - соперник в первом раунде №76».
   *
   *  ⚠⚠ THE DEFECT WAS THAT THE DRAW WAS NEVER STORED AT ALL. `previewEvent` rebuilds the field on
   *  every read – `drawnField(event, cohort, ranking, rivalConditions(results, week), …)` – and
   *  `firstRoundOpponent` is a pure index lookup into it. The RNG was never the problem and is not
   *  touched here: `seed:kidtour:<eventId>` is created fresh, read in the same order and spent to the
   *  same depth it always was. What moves is everything ELSE that goes in – the selection table, the
   *  rivals' conditions, and her own place in the standing – and all three move every week. So at
   *  week − 1 the field was assembled one way and the draw picked #118 out of it, and a week later
   *  the field reassembled and the SAME draw picked #76. Measured with tools/r35-draw-fact.ts on six
   *  synthetic careers: the card and the bracket named different girls on **293 of 489 draw weeks
   *  (59.9%)** before this field existed.
   *
   *  ⚠ ROUND 31 #4 DECIDED WHEN TO *NAME* THE OPPONENT (`DRAW_LEAD_WEEKS`), AND NOTHING EVER DECIDED
   *  THAT THE DRAW HAD *HAPPENED*. Its own note says so in as many words – «NOTHING IS PERSISTED,
   *  WHICH IS DELIBERATE» – and that was right about the BAND, which is a reading of a rung. It was
   *  not right about a NAME: we learned not to say the name too soon and went on inventing it fresh
   *  every week.
   *
   *  ⚠⚠ ONE OPPONENT ID, NEVER THE FIELD, and `season/types.ts` is the reason: a stored field «shifts
   *  every subsequent attribute for all 199». That warning is about the COHORT's own generation and
   *  one id is not it – nothing here is drawn, nothing is generated, and the row it points at is the
   *  cohort's own.
   *
   *  ⭐ WRITTEN BY `recordDrawnFirstRounds` (world/draw.ts) AND BY NOTHING ELSE, from the card's own
   *  computation, once per event, never overwritten. Read in two places and they are the two that
   *  disagreed: the Season card (`upcomingEvents` -> `previewEvent`) and the bracket she actually
   *  plays (`computeShadowTournament` -> `runTournament`).
   *
   *  ⚠ OPTIONAL, AND ABSENT MEANS «no draw was ever shown for this event», which is the honest state
   *  of every save written before v70 and of an event whose week arrives before a card could exist.
   *  Every reader normalises, and an unrecorded event draws live exactly as it always did. */
  drawnFirstRounds?: Record<string, string>
  /** ⭐⭐⭐ v84 – WHAT THE CHILDHOOD LEFT BEHIND (the album spec §3, ruled path (а) 19.09): the
   *  compact slice of the finished `PrologueRun` – `picks`, `entries`, `opens` – written ONCE at the
   *  handover by `createWorld` and by nothing else. The prologue used to throw all of it away, and
   *  «She asked if she could try» had nothing to be written out of.
   *
   *  ⚠ `null` FOR EVERY WIZARD CAREER AND EVERY SAVE THAT PREDATES IT (his «это не страшно»): a
   *  childhood that was never walked leaves no record, and the album's first chapter honestly does
   *  not exist for it. The one reader is the album assembly (`world/albumBook.ts`), on demand –
   *  nothing weekly reads it, so it costs every tick nothing.
   *
   *  ⚠ THE ORIGIN IS DELIBERATELY NOT IN IT – `profile.background` already holds it, and a second
   *  copy would be two sources of truth for one fact (the `LifeBeatRecord` missing-boolean rule). */
  prologueTrace: PrologueTrace | null
  /** ⭐⭐⭐ v85 – THE ONE SHE IS CARRYING, OR NOTHING (wave 8, the pregnancy and the return;
   *  `docs/plans/life-wave-8-builder-2026-09.md` §2 T1, the design
   *  `docs/plans/the-wedding-and-the-children.md` §5 W3+W4). One live pregnancy at a time, hung off
   *  the world rather than off the episode row that carries it – `episodeId` points BACK at the
   *  latched episode, which is the direction that survives the thing the wedding's own re-shape was
   *  built for: a second marriage is the same machinery re-entered on a later row, and a second
   *  pregnancy (W5's, confirmed wanted 11.09) is this same seat re-entered after it clears.
   *
   *  ⚠ `null` IS EVERY CAREER ON THIS TREE. T1 SHIPS THE SEAT AND NO WRITER AT ALL – the hazard is
   *  T2's, the pause T3's, the birth T4's – which is what «the schema move is inert» means and what
   *  the frozen careers measure (`psychologistHired`'s own v76 sentence, one seat over, kept as a
   *  rule rather than re-derived). Nothing here can set it except a test poking the world.
   *
   *  ⚠⚠ AND IT IS DELIBERATELY NOT ON THE WIRE, which is `spiritShock`'s argument verbatim and not a
   *  new one: `Snapshot` is assembled field by field (invariant 1 – the UI never sees a
   *  `WorldState`), so a wire field is a decision that belongs to the task that has the READER. T10
   *  wires the portraits and decides its own field then. `LoveEpisode` is the opposite case and needs
   *  no such decision – it lives in `shared/protocol/narrative.ts` because the DIARY shows partners –
   *  and nothing of T1 is shown to anybody. */
  pregnancy: PregnancyState | null
  /** ⭐⭐⭐ v85 – THE BORN, APPEND-ONLY, ONE ROW PER BIRTH (wave 8; §0's own delta against the design
   *  sketch, which had this landing in W5). It ships THIS wave because a birth must land somewhere
   *  the week it happens: `pregnancy` is CLEARED at the birth, so a child recorded only there is a
   *  child recorded nowhere, and W5 would have to open by re-deriving children out of episode
   *  history – a reconstruction, in a layer whose whole discipline is refusing them.
   *
   *  ⚠ `[]` IS EVERY CAREER IN THE CORPUS, for the plainest possible reason: there were no children
   *  to have. ⭐ T4 LANDED AND IS THE ONE WRITER – `landBirth`'s single `children.push`
   *  (`world/lifeBeat.ts` §14) – and W5 READS the array and appends fields to the row if it needs
   *  them, its own append-only move, which an array of rows accepts for free and a scalar would not.
   *  ⚠⚠ THAT ONE PUSH IS ALSO THE WAVE'S SCOPE BRAKE, one file over: `pregnancyEligible` refuses while
   *  `children.length > 0` (T2½ piece 3), which is what makes §4's «no repeat pregnancy enabled» true
   *  and is the line W5 replaces with the count-aware hazard. One piece of state, two readers – and
   *  `landBirth`'s own once-ness is a THIRD read of it rather than a second receipt.
   *
   *  ⚠ THE ROW IS NOT THE PREGNANCY AND MUST NOT GROW INTO IT. What a birth leaves behind is `bornWeek`
   *  and `sex`; the months, the support grade and the return plan belong to the pregnancy that
   *  produced it and die with it. A row that carried them would be a second road to facts the album
   *  already reads off `lifeLog`. */
  children: ChildRecord[]
  /** ⭐⭐⭐ v85 – WHAT THE RETURN LEFT BEHIND, OR NOTHING (wave 8, the pregnancy and the return; §2 T6,
   *  the architect's ruling of 20.09 after gate 2). The THIRD and LAST key v85 takes, appended after
   *  `children` and for a gap the brief's own §2 T1 did not list: T6 needs state that outlives the
   *  pregnancy, and there is nowhere else honest to put it.
   *
   *  ⚠⚠ IT CANNOT LIVE ON `pregnancy`, AND THAT IS A REQUIREMENT RATHER THAN A PREFERENCE. §0: «this
   *  wave builds the machinery so re-entry is free» – and `pregnancyEligible`'s gate refuses while a
   *  pregnancy exists, so the record must be CLEARED at the return for W5's repeat pregnancy to be
   *  possible at all. State that outlives the pregnancy cannot live on the pregnancy.
   *
   *  ⚠ ONE KEY AND NOT TWO, which is the shape decision worth writing down. `returnedWeek` and
   *  `protectedRank` are written in the same instant by the same event and read by the same task, and
   *  a career either had a comeback or did not. Two nullable keys would make
   *  `returnedWeek !== null && protectedRank === null` a state somebody has to think about; one record
   *  makes it a FIELD of a thing that exists.
   *
   *  ⚠ `null` IS EVERY CAREER ON THIS TREE AND EVERY CAREER IN THE CORPUS. T6 is the only writer there
   *  will ever be – the same law T1 shipped `pregnancy` and `children` under, and the frozen careers
   *  are what measure it. Nothing here, in any phase of the tick, can set it except a test poking the
   *  world.
   *
   *  ⚠⚠ AND IT IS DELIBERATELY NOT ON THE WIRE, `pregnancy`'s argument two fields up rather than a new
   *  one: `Snapshot` is assembled field by field (invariant 1), so a wire field belongs to the task
   *  that has the READER. T10 wires the surfaces and decides its own field then. */
  comeback: ComebackState | null
}

/** ⭐⭐⭐ THE PREGNANCY'S SHAPE (v85, wave 8 T1) – see `WorldState.pregnancy`. Engine-only and
 *  deliberately not on the wire, for the reason the field's own block gives.
 *
 *  ⚠⚠ `support` IS NULLABLE AND THE NULL IS A REAL STATE, NOT A PLACEHOLDER – the one field here
 *  that looks wrong at a glance, so the argument is written down rather than left to be re-derived.
 *  The `'expecting'` beat is BLOCKING, so a world can sit between the announcement and the parent's
 *  answer for exactly as long as the player leaves the card up – a week, or thirty – and `null` is
 *  the TRUE reading of that gap: «she has told him and he has not answered yet». T2 writes the grade
 *  on the answer. A non-nullable field would need a default, and every default available here is a
 *  lie about a week that really happened: `'measured'` claims an answer nobody gave, and `'cold'`
 *  claims a worse one.
 *
 *  ⚠⚠ `dueWeek` IS PERSISTED ALTHOUGH IT IS DERIVABLE (`pausesWeek + ECONOMY.motherhood.termWeeks`),
 *  and that is `partnerName`'s law one wave down, quoted rather than re-argued: a later constant edit
 *  must never move the due date of a pregnancy a live career is already carrying. Derived-at-read
 *  would do exactly that – T9 benches the term, and a family three months into a pregnancy would
 *  find the date had moved under them on the update that retuned it. `temperamentFor` and
 *  `LifeBeatRecord.frame` are the same instrument for the same reason: what is READ BACK is state.
 *
 *  ⚠ `returnPlan` is `null` until the T6 beat asks, which is the same gap `support` names one field
 *  up: she has given birth and has not yet said how she is coming back.
 *
 *  ⚠⚠ AND T6 ADDED A SIXTH FIELD, `rankAtPause`, WHICH FALSIFIES T5's «T1 shipped `PregnancyState`'s
 *  last field» (`decisionWeekOf`, `world/lifeBeat.ts` §14 – corrected where it stands). It is a
 *  CAPTURE and not a parameter: the ruled freeze is «her rank at `pausesWeek`», the ranking window
 *  deletes the evidence for it 52 weeks later, and the return is 51 weeks after the pause – so the
 *  number has to be taken on its own week or it cannot be taken at all. It costs no migration for the
 *  same reason `returnPlan`'s move costs none: no save in the world holds a v85 pregnancy. */
export interface PregnancyState {
  /** The latched episode carrying it – the marriage is the door (RULED 20.09), so this always points
   *  at a row whose `latchedWeek !== null`. A pointer and never a copy: the partner's name, the
   *  latch week and the ending all live on the row, and a mid-pregnancy divorce is ORDINARY LIFE
   *  (RULED 20.09) rather than a content branch, so the row may end while this survives it. */
  episodeId: string
  /** The week the `'expecting'` beat was raised – she told him. Not the week he answered. */
  announcedWeek: number
  /** The week entries close and the pause begins. */
  pausesWeek: number
  /** The week the birth is due. Persisted, never re-derived – see the block above. */
  dueWeek: number
  /** The parent's persisted answer grade, `null` while the blocking beat is still up. W4's return
   *  reads it; T2 writes it once, on the answer. */
  support: 'warm' | 'measured' | 'cold' | null
  /** ⭐⭐⭐ v85 T6 – **HER PROFESSIONAL STANDING ON THE WEEK THE ENTRIES CLOSED**, or `null` for a
   *  career that paused holding no WTA ranking worth freezing. The protected rank is «her rank at
   *  `pausesWeek`» (RULED 20.09 with the 12 entries and the 156 weeks), and this is the only place
   *  that number can honestly come from.
   *
   *  ⚠⚠ IT IS A **CAPTURE**, AND THE LAW IS `captureEntryRow`'s, WORD FOR WORD (`world/ladder.ts`):
   *  «the two facts about her BOOK that an entry has to carry out of the week it was made in, because
   *  `pruneResults` deletes the evidence for both 52 weeks later». Here the span is longer than there:
   *  `termWeeks + decisionWeeksAfterBirth` is 51 weeks from the pause to the return, and the WTA
   *  window (`WINDOW_BY_TRACK`) is 52 – so by the week the freeze is written, every result that
   *  produced the rank it is supposed to freeze has just aged out of the book. Derived at the return
   *  this question has no honest answer; captured on its own week it has exactly one. (The on-ramp
   *  latch `crossedOnRamps` is the same argument one field over, and it is the precedent this wave
   *  inherits rather than a new claim.)
   *
   *  ⚠ IT IS THE **WTA** TABLE AND NOT «her table», which is a narrowing with a reason rather than a
   *  simplification. A frozen RANK can only ever act where a rung reads a rank cut in the same
   *  currency, and `entryVerdict` reads one exactly at the W acceptance list (`acceptanceRank` is an
   *  ABSOLUTE rank on the W rungs). The junior rungs are shut on AGE for every woman this arc can
   *  reach (24–35 against under-19), the domestic band is denominated in POINTS and no rank could
   *  open it, and both on-ramps LATCH and never un-latch, so there is no second table where this
   *  number would mean anything.
   *
   *  ⚠ `null` IS A REAL STATE AND NOT A PLACEHOLDER, `support`'s own argument above: «unranked is not
   *  rank one» (`entryVerdict`'s own sentence), so a girl who paused with no counting W result freezes
   *  nothing – and `ComebackState.protectedRank` is nullable for exactly this case, because a comeback
   *  is a FACT and a freeze is an ENTITLEMENT.
   *
   *  ⚠ AND IT IS WRITTEN AT `pausesWeek` AND NOWHERE ELSE, on `landPregnancyPause`'s own `===` week
   *  equality: a crafted world that JUMPS the pause week misses the capture and comes back with
   *  nothing protected, which is the right failure direction – a rank read a season later is not the
   *  rank the rule names, and a wrong freeze is worse than no freeze. */
  rankAtPause: number | null
  /** How she means to come back, `null` until the T6 beat asks.
   *
   *  ⚠⚠ AND SINCE T5 THIS FIELD IS **UNREACHABLE AS WRITTEN**, which is reported here rather than
   *  quietly re-shaped, because the decision belongs to T6's builder and to the architect.
   *  `resolveReturnDecision` clears the whole record on both of its arms – it must, or a career that
   *  comes back has its entries shut for ever (`pauseCovering` has no upper bound of its own) – so by
   *  the week T6's blocking `'return-plan'` beat is answered there is no `PregnancyState` to write a
   *  plan onto. `ComebackState` below is the seat that outlives the pregnancy and already holds the
   *  two other facts the return needs; a field there costs no migration, because no save in the world
   *  holds a `comeback`. Left standing rather than deleted: it is T1's shipped shape, T6 has not run,
   *  and a field removed by the wrong task is harder to put back than one that was left alone. */
  returnPlan: 'small-first' | 'straight-back' | null
}

/** ⭐⭐⭐ ONE BIRTH'S ROW (v85, wave 8 T1) – see `WorldState.children`. Two facts and no history.
 *
 *  ⭐ `sex` IS RULED AND THE ROSTER IS A SCAFFOLD (20.09, his words): «пол нужен, но мальчиков у нас
 *  пока нет, можно сделать заготовку, но пока будут только девочки». So T4 writes the LITERAL
 *  `'girl'` and NO STREAM IS DRAWN FOR A CONSTANT – a draw whose outcome is fixed is not a draw, it
 *  is a draw-and-discard, which invariant 2 forbids by name.
 *
 *  ⚠⚠ THE KEY `seed:life:birth:<episodeId>` IS RESERVED IN WRITING FOR THE DAY BOYS EXIST, and it is
 *  written here rather than left to be re-derived so that nobody has to work out which key was meant
 *  – it is scoped to the EPISODE and not to the week, which is what keeps the persisted rows of old
 *  careers stable when it comes: a career that already has a daughter keeps her, because the row is
 *  read back rather than re-drawn, and a career that has not yet given birth draws once, on a key
 *  that does not move if the calendar does. */
export interface ChildRecord {
  bornWeek: number
  sex: 'girl' | 'boy'
}

/** ⭐⭐⭐ THE COMEBACK'S SHAPE (v85, wave 8 – the architect's ruling of 20.09, after gate 2) – see
 *  `WorldState.comeback`. Engine-only and deliberately not on the wire, for the reason the field's
 *  own block gives. TWO FACTS, both of them state that cannot be derived from anything else the world
 *  keeps.
 *
 *  ⚠⚠ `returnedWeek` IS THE STAGED FACTOR'S CLOCK AND NOTHING IN THE WORLD RECORDS IT TODAY. T6's
 *  factor is «−40% → −20% → −10% → full over 0–3 / 3–6 / 6–12 / 12+ months POST-RETURN», so it is a
 *  function of exactly one number, and that number is not `dueWeek`: `dueWeek` is the BIRTH, the
 *  decision lands anywhere inside a 20-week window after it, and one cannot be recovered from the
 *  other. Persisted for `dueWeek`'s own law one field over – what is READ BACK is state, and a later
 *  constant edit must never move the clock of a comeback a live career is already inside.
 *
 *  ⚠⚠ `protectedRank` IS NULLABLE INSIDE A RECORD THAT IS ITSELF NULLABLE, and the nesting is the
 *  point rather than an accident: A COMEBACK IS A FACT, A FREEZE IS AN ENTITLEMENT. The two come
 *  apart – a career that paused with no ranking worth protecting still came back – and collapsing
 *  them into one null would make «she returned» unrepresentable for exactly the players who most need
 *  the game to say it. `support`'s own v85 argument one type up, applied to a record instead of to a
 *  grade: the null is a REAL state and not a placeholder.
 *
 *  ⚠ `entriesLeft` IS MUTABLE STATE AND THAT IS WHY THIS IS A SEAT AND NOT A DERIVATION. It counts
 *  down as she spends her twelve entries (T6: «Consumed per ENTRY through `world/entries.ts`»), so it
 *  must survive a save; nothing in the world could reconstruct how many she has used. */
export interface ComebackState {
  /** The week she played her first week back – the staged factor's clock, and the ONE fact the factor
   *  is a function of. */
  returnedWeek: number
  /** The freeze, or `null` for a career that came back with nothing protected. `rank` is her ranking
   *  at `pausesWeek`, `entriesLeft` the twelve it buys counting down per entry, `validUntilWeek` the
   *  156-week horizon (RULED 20.09 – the real rule's own shape: since 2019, frozen entry standing,
   *  3 years). */
  protectedRank: { rank: number; entriesLeft: number; validUntilWeek: number } | null
}

/** ⭐⭐ THE v69 PIN'S SHAPE – see `WorldState.brandStrengthSeed`. Two numbers and no history: the
 *  week the stock arrived on this career and the fame it was carrying that week. */
export interface BrandStrengthSeed {
  week: number
  value: number
}
