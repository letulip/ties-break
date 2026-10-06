---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Save schema history

The version-by-version chronicle that stood above `SAVE_SCHEMA_VERSION` in `src/engine/world/state.ts`, moved here verbatim (T7.2 of the principles fix). The source keeps each version's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the version's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## v36 and v37 – the pro AER ledger and the kit ladder

```ts
// v36 = W2-LADDER's `proEntryWeeks` (the pro AER ledger); v37 = W3-KIT's quality ladder (`world.kit`).
//
```

## v38 – the penalty ledger

```ts
// ⚠ v38 = W3-ACT2's PENALTY LEDGER (`penalties` + `suspendedUntilWeek`), and it takes the number
// act2-pro-tour.md §9 had reserved for psyche. The §9 renumbering («v36 = W2-LADDER, v37 = endings,
// v38 = psyche») was written before W3-KIT and the endings wave landed in a different order, so the
// reservations had already drifted by one; versions are allocated on arrival, not booked, and the
// append-only migration ladder is what makes that safe. Endings and psyche take the next free
// numbers when they ship.
```

## v40 – weeks lost to injury

```ts
// ⚠ v40 = ONE FIELD, `careerTotals.weeksLostToInjury` – the monotone total of weeks her body has
// spent off court (docs/specs/fatigue-injury-audit-2026-08.md §6). It exists because
// `injuryHistory` is pruned to twenty rows and the career-ending injury is keyed on their SUM, so
// the rule was measurably getting HARDER the more layoffs a career collected. Post-draw state end to
// end: nothing here touches any stream, and the frozen MAIN capture (41550 / e6b0c709) cannot see it.
```

## v45 – the season entry ledger

```ts
// ⚠ v45 = ONE FIELD, `seasonEntries` – the season's entry ledger, and it is v40's argument arriving on
// a different ledger. `world.results` prunes at 52 weeks, so "could a title at this rung have entered
// the book she held that week" is unanswerable three weeks after the fact; the wrap-up needs it a year
// later. So it is captured in the branch that commits the entry, exactly as `weeksLostToInjury` is
// counted in the branch that ends a layoff (docs/specs/season-mirror-2026-08.md). Pure state, zero
// draws on any stream – the frozen MAIN capture cannot see it either.
```

## v46 – seasons told apart by track

```ts
// ⚠ v46 = ONE FIELD, `seasonHistory[].byTrack` – a finished season told apart by table, and it is a
// SCHEMA change because it could not be anything else. The Stats screen showed the identical
// season-by-season table under all three tabs (the owner, twice, most recently 09.08), and no work on
// that screen could have fixed it: the record carried one rank and three folds, so the tabs had nothing
// to differ by. What v46 adds is a per-track {endRank?, points, wins, losses} beside them, banked at the
// wrap-up off ledgers that are about to be pruned or reset. Rows banked BEFORE it carry no per-track
// figures and none are invented – see the v45 -> v46 step in migrations.ts. Pure state, zero draws on
// any stream: the wrap folds ledgers that already exist, so the frozen MAIN capture cannot see it.
```

## v47 – the week plan

```ts
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
```

## v48 – birthdays

```ts
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
```

## v49 – the coach at the junior rungs

```ts
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
```

## v54 – her own bank account

```ts
// ⭐ v54 = ONE FIELD, `kidFundsCents` – HER OWN BANK ACCOUNT (round-23 #18). The owner: «после
// появления её счета в банке в 18 начать ей призовые переводить какие-то суммы, например начать с
// 10-20% и может быть наращивать год к году», capped on his own widening – «может не до 30, а до 40
// или 50 вообще, это всё-таки ее карьера?». `ECONOMY.kidShare` is the ramp; `finalizeTournament`
// splits the cheque; the migration back-fills ZERO and invents no history (a career that reached
// this build has never made a transfer, and re-deriving eight years of them is impossible anyway –
// `financeWeeks` prunes at sixty weeks). Pure state, zero draws on any stream, so the frozen MAIN
// capture cannot see it.
```

## v55 – the stranded reveal, cleared on load

```ts
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
```

## v58 – the college departure week

```ts
// v58 (round 24 #5): `fork.departsWeek` – the college answer RESERVES a place and she departs on the
// next academic year's September; see the migration and docs/specs/college-departure-2026-08.md.
```

## v59 – the masseur

```ts
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
```

## v60 – the college league reveal

```ts
// ⭐⭐⭐ v60 (round 26 #6, THE COLLEGE LEAGUE IS WALKED AND NOT REPORTED): `CollegeState.leagueReveal`
// – two numbers saying where the player is in the championship's reveal. The owner had asked for
// this once already («Я уже просил это сделать»), and round 25 answered it with a summary line plus
// replay buttons on a card, which is exactly «сообщили постфактум». The reveal makes the year STOP
// on the championship week, the way a tour week stops, and `TournamentFlow` walks it.
// ⚠ NULL FOR EVERY EARLIER SAVE AND NOTHING IS BACK-FILLED: a championship already lived is not
// re-offered, so a career mid-freeze resumes with no reveal open and its NEXT year's gets one.
//
```

## v61 – the home university, a field deleted

```ts
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
```

## v62 – the peak physical

```ts
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
```

## v63 – the shop assets

```ts
// ⭐⭐⭐ v63 (the shop, slice 1): `assets` – WHAT THE FAMILY OWNS THAT IS NOT TENNIS
// (docs/specs/the-shop-2026-08.md §5). One array, empty on every career that has ever existed, and
// the ONLY thing this feature persists: the shelf itself is `ECONOMY.shop.catalogue`, a constant, so
// slices 2-7 can add a rung without a migration.
// ⚠ THE BACK-FILL IS EMPTY AND THERE IS NOTHING TO RECONSTRUCT – v26's `knock` case rather than
// v62's `peakPhysical` one. A career that reached this build could not buy anything: there was no
// shelf, no command and no ledger row, so there is no earlier evidence to mine and an invented row
// would hand a family a car it never chose. Pure state, zero draws on any stream, so the frozen MAIN
// capture (41550 / e6b0c709) cannot see it.
```

## v64 – the call-up reveal

```ts
// ⭐⭐⭐ v64 (round 27 #6, THE NATIONS CUP TIE IS WALKED AND NOT REPORTED): `CollegeState.callUpReveal`
// – a second optional reveal beside v60's `leagueReveal`, back-filling NULL. ⚠ ADDED HERE BY THE
// MERGE OF 28.08, NOT BY ITS OWN WAVE: PR #112 shipped the field, the migration, the fixture and the
// README row and left this ladder – the only place that reads as the complete list – one rung short
// at v63. A ladder with a hole in it is how the next reader picks the wrong number for the next
// bump, which is exactly what happened on the branch below.
```

## v65 – who won each AI tournament

```ts
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
```

## v66 – the business event category

```ts
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
```

## v67 – the renumbered back-fills

```ts
// ⭐⭐ v67 (round 30 #14 and #8/#10 – the fund's UNITS and the brand's / academy's NAME). ⚠ IT IS A
// RENUMBER RATHER THAN A NEW SLICE OF WORK: both back-fills were written into the v65 -> v66 step
// above while main still read 65, which was correct at the time and stopped being correct when PR
// #114 shipped v66. A v66 save – the owner's own, already in play – would have SKIPPED them. The
// two steps moved out of v66 intact and v66's step is byte-identical to main's; the reasoning, and
// the rule that keeps the next wave from repeating it, is the header of migrations.ts. Full move:
// this constant, the v66 -> v67 step in migrations.ts, and tests/fixtures/saves/v67.json.
//
```

## v68 – the age curve

```ts
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
```

## v69 – the brand strength seed

```ts
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
```

## v70 – the draw becomes a fact

```ts
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
```

## v71 – the repeat brand

```ts
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
```

## v72 – spirit, bond and temperament

```ts
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
```

## v73 – the life log stops being optional

```ts
// ⭐⭐⭐ v73 – THE PRIVATE LIFE, WAVE 2: `lifeLog` STOPS BEING OPTIONAL. Wave 1's wire shipped the
// field behind a `?` so both halves of this wave could build against it before anything wrote a row;
// step 4 makes it required, back-fills `[]` in an append-only migration and freezes the golden
// fixture. Back-filling an EMPTY list is the exactly-true answer rather than a bargain struck with a
// pruned log (v29/v31's shape): a career that predates the layer has lived no beats, because there
// were none to live. Full move: this constant, the v72 -> v73 step in migrations.ts,
// tests/fixtures/saves/v73.json, and docs/context/saves-and-worker.md's mechanically-checked
// schema sentence.
```

## v74 – love episodes

```ts
// ⭐⭐⭐ v74 – THE PRIVATE LIFE, WAVE 3: `loveEpisodes`, SOMEONE EXISTS. World `+loveEpisodes` – one
// append-only row per attachment, never pruned, and the ACTIVE one is DERIVED from the list rather
// than stored beside it (`activeEpisode`, world/lifeBeat.ts: the last row with `endedWeek === null`).
// A romance that begins and ends before the parent knew must survive save and reload intact and
// surface later as one honest late row – the 09.09 re-cut, review find #5 – which a single nullable
// slot would have overwritten out of existence. The back-fill is `[]` and it is EXACTLY TRUE in v73's
// own sense: a career that predates the layer has lived no attachments, because there were none to
// live. Full move: this constant, the v73 -> v74 step in migrations.ts, tests/fixtures/saves/v74.json,
// and docs/context/saves-and-worker.md's mechanically-checked schema sentence.
```

## v75 – the spirit shock

```ts
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
```

## v76 – the psychologist and her walls

```ts
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
```

## v77 – the spotlight

```ts
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
```

## v78 – one bump, three customers

```ts
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
```

## v79 – the chemistry and the sparring travel key

```ts
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
```

## v80 – form

```ts
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
```

## v81 – the small-talk frame

```ts
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
```

## v82 – the coach deal

```ts
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
```

## v83 – the wedding

```ts
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
```

## v84 – the prologue trace

```ts
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
```

## v85 – the pregnancy and the return

```ts
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
//
```

## v86 – the dynasty

```ts
// ⭐⭐⭐ v86 (THE DYNASTY, WAVE 10 T1/T2 – docs/specs/the-dynasty-2026-09.md §3): ONE KEY,
// `dynasty`, back-filled `null`. His ask, 11.09: «в конце карьеры можно сделать хук на новую
// карьеру через ребенка, например»; his go for the wave, 22.09.
//
// ⚠⚠ THE BACK-FILL IS `null` AND IT IS EXACTLY TRUE, which is v85's argument one paragraph up and
// not v84's: EVERY SAVE IN THE WORLD IS A GENERATION-ZERO CAREER, because there was no way to create
// any other kind until this version. «This career began no line» is the complete statement about all
// of them, and nothing in a save could say otherwise.
//
// ⚠ ZERO DRAWS ANYWHERE IN THE MOVE, and this version adds NO MAIN DRAW ANYWHERE IN THE WAVE – the
// frozen capture (41550 / e6b0c709) is predicted UNMOVED for the whole of wave 10 (§8 row 5), and if
// it moves something is wrong rather than something is new. The one draw the dynasty touches at all
// is `seed:temperament`, whose COUNT does not move either: §7's lean re-maps two picks it does not
// add to (`temperamentFor`, T3).
//
// ⚠⚠ BUT THE FROZEN CAREERS ARE **NOT** AN IDENTITY THIS TIME, unlike v85's, and the difference is
// worth naming rather than discovering: `dynasty` joins `createWorld`'s literal, so the LIVE
// serialisation of every walked career gains a key and every live register re-stamps. The ROLLBACK
// rungs all hold – `careerHashAtSchema` peels the key ahead of v85's three – and `PRE_V86` therefore
// holds the verbatim v85 constants, character for character, which is the receipt for «a pure key
// append» rather than a sentence claiming one.
//
// Full move: this constant, the v85 -> v86 step in migrations.ts, tests/fixtures/saves/v86.json, its
// row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked
// schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts.
```

## v87 – the weight

```ts
// ⭐⭐⭐ v87 (THE WEIGHT, WAVE 11 T1 – docs/specs/the-weight-2026-09.md §1/§2): THREE KEYS ON THE
// WORLD AND ONE FIELD ON THE PREGNANCY RECORD. The layer's last step, and the first version in this
// ladder whose headline key is a SWITCH rather than a seat.
//
//   · `weightEnabled: boolean` – the off switch, RULED 22.09 ahead of the build: «only for the
//     weight, set at new-career creation (the creation flow ASKS), changeable both ways in settings
//     later; turning it off stops NEW weight events and never deletes lived state».
//   · `pregnancyLossWeeks: number[]` and `bereavementWeeks: number[]` – append-only week lists, the
//     `children` precedent one version down: a loss clears the pregnancy record and a death writes
//     no record at all, so a week recorded only on the thing that ends is a week recorded nowhere.
//     The bereavement's SPACING and CAP read the second list and never a derived guess.
//   · `PregnancyState.conceivedWeek` – the hidden window's one persisted number (§2), on the record
//     rather than on the world for `dueWeek`'s own law: it is the clock a live pregnancy is already
//     being carried on, and a later retune may not move it.
//
// ⚠⚠ THE BACK-FILL IS **`false`** FOR THE SWITCH, AND IT IS A RULING RATHER THAN A DEFAULT (22.09,
// question 1): «nobody asked a migrated save at creation, and the weight does not arrive uninvited
// in a career's middle. The settings row is the door for a player who wants it.» ⚠ THIS IS THE FIRST
// BACK-FILL IN THE LADDER THAT IS NOT THE MECHANIC'S OWN IDENTITY – `createWorld` writes what the
// creation ask answered, which is a different value from what the migration writes, and that
// asymmetry is the ruling and not a defect. v86's own block is the contrast: there the literal and
// the back-fill agree «for the same reason rather than by coincidence».
//
// ⚠ THE TWO LISTS BACK-FILL `[]` AND THAT ONE **IS** EXACTLY TRUE – `children`'s v85 argument
// verbatim: no save written before this version could hold a loss or a bereavement, because there
// were none to hold. `conceivedWeek` back-fills onto any live pregnancy as its `announcedWeek`,
// which is the PRE-WINDOW TRUTH: before this version the announcement WAS the conception (the
// research's finding about `termWeeks: 31`), so the back-fill states what that save actually means
// rather than reconstructing a window it never had.
//
// ⚠ ZERO DRAWS ANYWHERE IN THE MOVE: three `??=` on three world keys plus one `??=` inside a
// nullable record, gated on `v === 86`, writing literals. No sub-stream is reached on this path, so
// MAIN cannot move and the frozen capture (41550 / e6b0c709) is untouched by construction.
// `spiritShock.kind`'s widening to `'breakup' | 'postpartum' | 'loss' | 'bereavement'` rides this
// same version and needs NO step at all – v85's own sentence, twice over: adding a union member
// cannot invalidate a stored value, and nothing has ever written either new one.
//
// ⚠⚠ AND THE FROZEN CAREERS ARE **NOT** AN IDENTITY, v86's case and not v85's: all three keys join
// `createWorld`'s literal, so the LIVE serialisation of every walked career gains them and every
// live register re-stamps. The ROLLBACK rungs hold – `careerHashAtSchema` peels the three ahead of
// `dynasty` – and `PRE_V87` therefore holds the verbatim v86 constants, character for character,
// which is the receipt for «a pure key append» rather than a sentence claiming one.
//
// Full move: this constant, the v86 -> v87 step in migrations.ts, tests/fixtures/saves/v87.json, its
// row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked
// schema sentence, the e2e fixtures, and the frozen-career peel rung in
// tests/coachTravelEdgeFixtures.ts.
```

## v88 – the parting

```ts
// ⭐⭐⭐ v88 – THE PARTING (docs/specs/the-parting-2026-09.md §8, wave 12 T1). **NOT ONE NEW KEY,
// ANYWHERE** – three union widenings and nothing else:
//
//   · `SpiritShockKind` + `'divorce'`       – the marriage ending's own shock row (§3)
//   · `MilestoneType` + `'divorce'`         – the album line, on his «можно» of 23.09 (§5)
//   · `LifeBeatKind` + `'divorced'`         – the card that replaces `'ended'` on a latched row (§4)
//
// ⚠⚠ SO THIS IS THE FIRST BUMP IN THE LADDER WHOSE MIGRATION HAS **NOTHING TO WALK**, and the
// version is taken anyway rather than saved. Invariant 3's rule is that a new persisted union
// member is a schema change, and all three of these are persisted: the shock kind sits on
// `world.spiritShock`, the milestone type on a `world.milestones` row, the beat kind on a
// `world.lifeLog` row. v85's own sentence is the precedent read at full strength – «adding a union
// member cannot invalidate a stored value, and nothing has ever written the new one» – and the
// difference is that there v85 ALSO appended keys, so the widening rode a step that existed. Here
// there is no step to ride, which is exactly why the empty one is written out: a version whose
// migration is a comment is a claim that has to be reviewable.
//
// ⚠⚠ AND NOTHING BELOW v88 CAN HOLD ONE OF THE THREE. `'divorce'` on the shock is written only by
// the latched branch this wave builds; the milestone is captured only there; the beat kind is
// raised only there. A v87 save that lived through a marriage ending carries `'breakup'`,
// `'ended'` and no album line, and that is what it HELD – re-labelling it now would rewrite a
// career's history to match a wave that was not running when it was lived.
//
// ⚠⚠ THE FROZEN CAREERS ARE AN IDENTITY IN SHAPE AND THE LIVE REGISTERS STILL RE-STAMP, which is
// v85's third-key arithmetic in reverse and is stated as a measurement rather than a hope: the
// serialised world gains no key, so `careerHashAtSchema(·, ·, 87)` needs NO new peel rung and
// returns today's `FROZEN` values character for character (that is what `PRE_V88` holds), while
// the LIVE registers move because `schemaVersion` itself is inside the hash. **Exactly one line
// moves on the per-key diff, `schemaVersion`** – and on this rung that is the whole claim rather
// than half of it.
//
// ⚠ ZERO NEW RNG STREAMS AND ZERO MOVED DRAWS IN THE WHOLE WAVE (§9) – the ends key, the leak keys
// and the booth's stamp are existing machinery and the latched branch is a pure read. The frozen
// MAIN capture (41550 / e6b0c709) is untouched by construction.
//
// Full move: this constant, the v87 -> v88 step in migrations.ts, tests/fixtures/saves/v88.json, its
// row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked
// schema sentence, and the e2e fixtures. ⚠ NO PEEL RUNG – see the paragraph above; the rung would
// have no key to remove, and `tests/coachTravelEdgeFixtures.ts` gains `PRE_V88` instead.
```

## v89 – the student cabinet

```ts
// ⭐⭐⭐ v89 – THE STUDENT CABINET ON THE HANDOVER (docs/specs/the-college-scene-2026-09.md §4.2,
// the college scene T4). **ONE FIELD, AND IT IS NESTED TWO DEEP INSIDE A NULLABLE RECORD**:
// `DynastyRecord.motherCareer.collegeTitles`, the count of her banked college years whose
// championship she won (`wonTheLeague` over `world.college.years`).
//
// ⚠ REQUIRED AND NEVER OPTIONAL – the field is a COUNT and 0 is its honest value, so an optional
// field would be a second spelling of zero and every reader would owe a `?? 0` that the next one
// forgets. The cost of that decision was counted before it was taken: `motherCareer` literals live
// in six files outside the engine plus `tools/dynasty-bench.ts`, and each gained the one line.
//
// ⚠⚠ THE BACK-FILL IS GUARDED ON A NON-NULL `dynasty`, WHICH IS THE LADDER'S FIRST BACK-FILL **TWO
// LEVELS DEEP** – v87's `pregnancy.conceivedWeek` is one deep and is the precedent for the cast, not
// for the depth. A null `dynasty` has nothing to back-fill and is deliberately left as `null` rather
// than grown a record: the absence of a line is a fact about that career, not a missing default.
//
// ⚠ `DynastyRecord.motherCareer` ALIASES `DynastyHandover['motherCareer']`, so the persisted type
// needs NO edit for this field – verified rather than assumed, and it is why a single declaration in
// `shared/protocol/profile.ts` moves the wire and the save together.
//
// ⚠ ZERO DRAWS: one `??=` inside a nullable record, gated on `v === 88`, writing a literal. No
// sub-stream is reached on this path, so MAIN cannot move and the frozen capture (41550 /
// e6b0c709) is untouched by construction.
//
// ⚠⚠ AND THE FROZEN CAREERS ARE AN IDENTITY IN SHAPE – v88's case exactly, and MEASURED rather than
// predicted (per-key control captured as the builder's FIRST command on the untouched tree, headers
// read back against the invocation, all three careers): every frozen career carries `dynasty: null`,
// the new field is nested INSIDE that null, and the serialised world therefore gains **no key at
// all**. So `careerHashAtSchema` needs NO new peel rung – its tail (`schemaVersion < 87 ? preWeight
// : world`) answers 87, 88 and 89 alike – `PRE_V89` holds the verbatim v88 constants, and the live
// registers still re-stamp because the version number is inside the hash.
//
// Full move: this constant, the v88 -> v89 step in migrations.ts, tests/fixtures/saves/v89.json, its
// row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked
// schema sentence, and the e2e fixtures. ⚠ NO PEEL RUNG – see the paragraph above; the rung would
// have no key to remove, and `tests/coachTravelEdgeFixtures.ts` gains `PRE_V89` instead.
```

## v90 – the listing

```ts
// ⭐⭐⭐ v90 – THE LISTING (THE SECONDARY MARKET, STEP S2; docs/specs/secondary-market-2026-09.md §2a and §2i).
// **TWO OPTIONAL KEYS ON EVERY `OwnedAsset` ROW**: `listedWeek?` (the week the thing went on the market; absent = not
// listed) and `lastListing?: { endedWeek, exposedWeeks }` (the market's memory of an ad that ended without a sale).
//
// ⚠⚠ BOTH ABSENT IS THE EXACT TRUTH, NOT A DEFAULT. Nothing was ever for sale by letter before this version, and a listing
// is the family's own choice: a migration that stamped one would put somebody's car on the market without asking
// (`prologueTrace`'s v84 refusal – never invent a fact the save never held). So the step is THE VERSION STEP AND NOTHING
// ELSE, the second one with no body (v88's three union widenings were the first) – and it is a bump anyway, because two
// persisted keys are a schema move whether or not the step has work to do (v88's rule: a version whose migration is a
// comment must be reviewable).
//
// ⚠ THE MEMORY IS APPLIED ON READ, NEVER BY A SWEEP. `lastListing` keeps its value for ever; `freshnessCarryOf`
// (world/resale.ts) is the one place the `ECONOMY.shop.secondary.memoryWeeks` window is read, and it is asked at the week an
// ad WENT UP – so re-listing inside the window resumes the staleness the family left, and a later re-listing starts fresh.
// ⚠ THE ACADEMY IS ONE LOT (§2e): its stages carry the same `listedWeek` together, and `lastListing` is written on every row
// of the lot, so any stage's row can answer for it.
//
// ⚠ ZERO DRAWS: the migration writes nothing, and `listAsset` / `unlistAsset` write only these two keys and one amount-less
// ledger row. No sub-stream is reached, so MAIN cannot move and the frozen capture (41550 / e6b0c709) is untouched.
//
// ⚠⚠ THE FROZEN CAREERS ARE AN IDENTITY IN SHAPE (v88's case): no frozen career lists anything, so the serialised world gains
// no key and `careerHashAtSchema` needs NO new peel rung – its tail answers 87 through 90 alike – `PRE_V90` holds the
// verbatim v89 constants, and the live registers still re-stamp because the version number is inside the hash.
//
// Full move: `SAVE_SCHEMA_VERSION` in world/state.ts, the v89 -> v90 step in migrations.ts, tests/fixtures/saves/v90.json, its
// row in tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked schema sentence, and the e2e
// fixtures. ⚠ NO PEEL RUNG – the rung would have no key to remove, and `tests/coachTravelEdgeFixtures.ts` gains `PRE_V90`.
```

## v91 – the first-touch latch

```ts
// ⭐⭐⭐ v91 – THE FIRST-TOUCH LATCH (ROUND 45 #5; the owner's 02.10 ruling, docs/decisions.md «ROUND 45 ANSWERED»).
// **ONE OPTIONAL KEY ON THE WORLD**: `firstNo1?: { wta?: number; junior?: number }` – the first week the live fold said she was
// number one on the professional world table (`wta`, `kidRankWta`) or the international junior one (`junior`, `kidRank`). Written
// ONCE per key in `recomputeKidRank` (world/ladder.ts, `latchFirstNo1`) beside `peakDomesticPoints`; read by the album's two
// `first-number-one` occasions (world/albumBook.ts, `rareCandidates`) and by nothing else. The domestic table is NOT latched.
//
// ⚠⚠ A DELIBERATE, SINGLE-FACT CARVE-OUT FROM 18.09's «NO PERSISTED RANK HISTORY», WHICH OTHERWISE STANDS. One week per table, never a
// year-by-year ledger. It exists because no save held the fact: `seasonHistory` is year-end only, `results` is a 52-week window and
// `bestRankOn` documents that no history exists – so the year-end-only version of the page misses a June touch that ends the season at
// #3, which is precisely the case his sentence named («даже если в моменте»).
//
// ⚠⚠ THE BACKFILL IS THE HONEST APPROXIMATION, NOT A RECONSTRUCTION. The true first touch of an older career is unknowable, so the
// step sets the latch to the CURRENT week only where the CACHED rank is 1 as the save is written, and otherwise leaves the key ABSENT –
// for a career that never reached #1 that is exactly right, and for one that touched it earlier and has since fallen it is an honest
// «not known» that costs one page and writes no lie (`prologueTrace`'s v84 refusal: never invent a fact the save never held). The key is
// created lazily, so a save with nothing to say gains no key at all.
//
// ⚠ THE GUARD IS THE TABLE'S OWN ROW – `rank === 1 && points > 0` – and not a special case of her number: `recomputeKidRank`'s own
// warning is that the cache may not disagree with the fold, and on an all-zero table the fold already puts everyone at the bottom.
//
// ⚠ ZERO DRAWS: pure state over the fold `recomputeKidRank` already paid for. No sub-stream is reached, MAIN cannot move, and the frozen
// capture (41550 / e6b0c709) is untouched. Input-independence is untouched too: the latch READS the world's table and writes only itself.
//
// ⚠⚠ THE FROZEN CAREERS ARE AN IDENTITY IN SHAPE (v88's case): no frozen career touches #1 in its walk, so the serialised world gains no
// key and `careerHashAtSchema` needs NO new peel rung – its tail answers 87 through 91 alike – `PRE_V91` holds the verbatim v90 constants,
// and the live registers still re-stamp because the version number is inside the hash.
//
// Full move: `SAVE_SCHEMA_VERSION` in world/state.ts, the v90 -> v91 step in migrations.ts, tests/fixtures/saves/v91.json, its row in
// tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked schema sentence, and the e2e fixtures.
```

## v92 – the succession block

```ts
// ⭐⭐⭐ v92 – THE SUCCESSION BLOCK (SUCCESSION S1, 06.10; docs/specs/succession-2026-10.md §2 «The calendar» and §5 «Saves and determinism»).
// **ONE REQUIRED KEY AND ONE OPTIONAL BLOCK ON THE WORLD**: `startYear: number` – the calendar year season 0 opens in – and `legacy?: { motherName,
// motherPeakRank, motherSlamTitles, surname, endingKind, savingsSliceCents, heirloomAlbum }`, DECLARED TOGETHER so the later steps of the wave add no
// second bump. Only `startYear` is written; nothing reads `legacy` yet.
//
// ⚠⚠ THE BACKFILL IS EXACT, NOT RECONSTRUCTED: until this version the epoch was a CONSTANT in shared/dates.ts, so every career ever saved began in
// January 2031 by construction – the step states the LITERAL `2031` (a shipped migration must not follow `DEFAULT_START_YEAR`, because a constant that
// can move would silently re-date every old career the day it did) and leaves `legacy` absent, which is what a generation-1 career is.
//
// ⚠⚠ THE YEAR IS A CREATION INPUT AND NOT A DRAW: `createWorld`'s seventh argument, default 2031. ZERO DRAWS, no sub-stream – the frozen MAIN capture
// (41550 / e6b0c709) is untouched, and tests/succession-s1-start-year.test.ts measures «a default career is its v91 self minus the one new key» on nine
// careers against digests taken from the pristine tree, before any S1 edit.
//
// ⭐⭐ UNLIKE v88 TO v91 THIS BUMP TOUCHES EVERY FROZEN CAREER: `startYear` is written on every world, right after `week`, so `careerHashAtSchema` gains a
// rung that DROPS it for every rollback below 92 (reverse order of arrival, ahead of everything below it) and `PRE_V92` holds the verbatim v91 constants –
// the rollback to 91 returns the v91 career on all three, character for character, which is the byte-identity claim measured over 156 weeks each. The
// eleven live cells re-stamp (the version number AND the key): `FROZEN`'s three, `PRE_R28B`'s five and `PRE_NAME_VERA`'s three.
//
// ⚠ `shared/dates.ts` takes `startYear` as an OPTIONAL LAST argument on every year-dependent function, so every caller that never heard of the wave –
// tests, the UI's formatters, migrations' frozen history – keeps byte-identical output; the cost is a SILENT omission, which the engine ratchet in the
// S1 test refuses (src/engine only). The UI's own call sites are the follow-up, fed by `Snapshot.startYear`.
//
// Full move: `SAVE_SCHEMA_VERSION` in world/state.ts, the v91 -> v92 step in migrations.ts, tests/fixtures/saves/v92.json, its row in
// tests/fixtures/saves/README.md, docs/context/saves-and-worker.md's mechanically-checked schema sentence, the e2e fixtures, and the frozen-career
// family: `careerHashAtSchema`'s rung, `PRE_V92`, the eleven re-stamped cells and the v92 case in tests/coach-travel-edge-recent-schemas.test.ts.
```
