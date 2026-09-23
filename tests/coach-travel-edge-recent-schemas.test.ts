// THE FROZEN CAREERS, THE RUNGS AT THE TOP – v88 down to v83.
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS THE THIRD TIME THIS FAMILY HAS BEEN CUT FOR THE SAME REASON.
// birpc's RPC window is a hard 60 s and it is not raisable; a file whose tests cross it fails the job
// with every test GREEN and one unhandled `Timeout calling "onTaskUpdate"`. That is exactly what
// round 42's PR hit on 16.09: `coach-travel-edge` reported **13 passed (13)**, `Errors 1`, and
// `Duration 62.57s (tests 60.76s)` on the two-core runner, and scripts/units.mjs's own classifier
// called it – «1 stalled twice (runner, not tests)».
//
// ⭐ THE MULTIPLIER IS THE THING TO CARRY FORWARD, because it is what turns a local number into a
// prediction: 32 s here on ten cores against 60.76 s there – **1.9x**, the same ratio CLAUDE.md
// records for the sim (45 s local, 90 s on the runner). Anything in this family over ~31 s locally is
// already in the window.
//
// WHAT THE SEAM IS. The old file held thirteen tests in two unrelated groups: EIGHT schema rollbacks
// (v78 down to v71) and FIVE pins on the non-travelling career itself. The rollbacks moved here; the
// pins stayed. Nothing was trimmed on the way across – same walk, same 156 weeks, same constants,
// same test names, and the ORIGINAL describe name deliberately unchanged, exactly as the two earlier
// cuts did (tests/coach-travel-edge-mid-schemas.test.ts, tests/coach-travel-edge-older-schemas.test.ts).
//
// ⚠⚠ AND ON 18.09 THIS FILE ITSELF WENT OVER, AND WAS CUT A FOURTH TIME. Round 44's two schema
// moves (v81, v82) added two rungs at the top – twelve cases, 29.82 s solo, sitting on the ~31 s
// bar – and the deploy run after the merge stalled at 68 s, retried, STALLED TWICE at 69 s. Twice
// at the same second is the wall, not an unlucky runner. The bottom six rungs (v76 down to v71)
// moved to tests/coach-travel-edge-prior-schemas.test.ts by the same protocol; this file keeps the
// top six and is where every future schema move adds its rung – at ~2.5 s a rung it crosses again
// near twelve, six moves from now. Cut it then, not after the red run.
//
// ⚠⚠ AND ON 23.09 THE PREDICTION CAME TRUE UNANSWERED, SO THIS FILE WAS CUT A FIFTH TIME. Waves
// 7 through 12 added exactly the six rungs the sentence above priced (v83..v88), the file reached
// twelve cases, nobody cut it, and the wave-12 PR's runner delivered the red run the sentence
// warned about: 12 passed, `Errors 1`, tests 64.45 s, «1 stalled twice (runner, not tests)»,
// exit 1. Local solo the same day: 34.34 s – the 1.9x multiplier predicts the observed 64 s
// exactly. The bottom six rungs (v82 down to v77) moved to
// tests/coach-travel-edge-late-schemas.test.ts by the same protocol; this file keeps v88..v83.
// ⭐ A HEADER SENTENCE IS NOT AN INSTRUMENT, so the instrument now exists:
// tests/coach-travel-edge-rungs-ratchet.test.ts pins every `-schemas` file in this family to at
// most TEN rungs, and the eleventh goes red locally, one wave before any runner can.
//
// ⚠ AND THE NEXT-ONE-TO-CROSS LINE HAS ROTATED TWICE: `-older-schemas`' 57 s was answered the
// same day by the -deepest-schemas cut (its header carries that story), and 18.09's failing runner
// put the name on `-mid-schemas` – **47 s** there, re-measured the same day at 20.38 s solo
// (under the ~31 s bar; the growth is walk price, not cases – watch it at each wave's PR).
// ⚠ Before cutting anything below v61, read round 42's open question about whether the deep
// rungs are the right instrument at all:
// nothing else in this repo mechanically enforces append-only down there, and a pin on the
// migration bodies would do the same job in milliseconds. That is a design decision for the owner,
// not a cut to make under time pressure.
import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
  PRE_V83,
  PRE_V84,
  PRE_V85,
  PRE_V86,
  PRE_V87,
  PRE_V88,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
  it('⭐⭐⭐ v88: rolling the schema back to 87 – with NOTHING to drop – returns the v87 CAREER on all three', () => {
    // ⭐⭐⭐ AN IDENTITY OF A KIND THIS LADDER HAS NEVER HELD BEFORE, and the case name says so: v88
    // (the parting, wave 12) appends **no key at all**. It is three UNION widenings –
    // `SpiritShockKind` + `'divorce'`, `MilestoneType` + `'divorce'`, `LifeBeatKind` + `'divorced'`
    // – and none of the three is a FIELD, so the serialised world is the same shape it was at v87
    // and `careerHashAtSchema` gained no rung: its tail answers 87 and 88 alike, and the only thing
    // that differs is the version number the last line stamps in.
    //
    // ⚠⚠ SO THIS CASE PROVES A CLAIM ABOUT THE WAVE RATHER THAN ABOUT THE PEEL, which is what makes
    // it worth a rung of its own although the peel does nothing. Every case below says «the peel
    // removed exactly the new keys»; this one says «the wave added none». A single persisted field
    // slipped in anywhere – a `divorcedWeeks` list, a flag on `LoveEpisode`, a counter – and all
    // three lines go red at once, which is precisely the thing a green `npm run check` would
    // otherwise be happy to ship.
    //
    // ⚠ THE MEASUREMENT is in the block over `PRE_V88` in tests/coachTravelEdgeFixtures.ts: the
    // three values below are the three `FROZEN` constants this repo shipped on `main` at v87,
    // reproduced character for character. Eleven live cells moved – `schemaVersion` is inside the
    // hash – and every rollback rung held.
    expect(careerHashAtSchema(5, 0, 87), '25k · middle coach · grinder – the verbatim v87 value').toBe(PRE_V88.middleGrinder)
    expect(careerHashAtSchema(8, 0, 87), '120k · elite coach · grinder – the verbatim v87 value').toBe(PRE_V88.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 87), '8k · self-coached · player – the verbatim v87 value').toBe(PRE_V88.selfTravelling)
  })

  it('⭐⭐⭐ v87: rolling the schema back to 86 – dropping the weight\'s three keys – returns the v86 CAREER on all three', () => {
    // ⭐⭐ AN IDENTITY, v86's OWN KIND, AND THE CASE NAME SAYS SO because the measurement was taken
    // before a constant was touched. v87 appends THREE world keys – `weightEnabled`,
    // `pregnancyLossWeeks` and `bereavementWeeks` (the weight spec §1, his ruling of 22.09) – written
    // ONCE by `createWorld`, the first of them from an OPTIONAL SIXTH ARGUMENT that `openCareer`
    // does not hand over, so every career in this file carries `false`, `[]` and `[]` for its life.
    //
    // ⚠⚠ AND THE SWITCH IS WHY THE WAVE CANNOT REACH THESE CAREERS AT ALL, which is a stronger
    // statement than the peel makes on its own: both of the wave's hazards return on
    // `world.weightEnabled` BEFORE their stream is derived, so a frozen career takes zero draws on
    // either. A red HERE beside a green freeze means something started writing one of the three keys
    // inside the tick, which `createWorld`'s own note forbids in as many words.
    //
    // ⚠ THE MEASUREMENT is in the block over `PRE_V87` in tests/coachTravelEdgeFixtures.ts: the
    // three values below are the three `FROZEN` constants this repo shipped on `main`, reproduced
    // character for character by the peel. Eleven live cells moved and every rollback rung held.
    expect(careerHashAtSchema(5, 0, 86), '25k · middle coach · grinder – the verbatim v86 value').toBe(PRE_V87.middleGrinder)
    expect(careerHashAtSchema(8, 0, 86), '120k · elite coach · grinder – the verbatim v86 value').toBe(PRE_V87.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 86), '8k · self-coached · player – the verbatim v86 value').toBe(PRE_V87.selfTravelling)
  })

  it('⭐⭐⭐ v86: rolling the schema back to 85 – dropping `dynasty` – returns the v85 CAREER on all three', () => {
    // ⭐⭐ AN IDENTITY, v84's AND v85's OWN KIND, AND THE CASE NAME SAYS SO because the measurement was
    // taken before a constant was touched. v86 appends ONE world key – `dynasty`, whose daughter she
    // is (the dynasty spec §3, his go of 22.09) – written ONCE at `createWorld` FROM THE HANDOVER's
    // optional fifth argument, and `openCareer` hands over no dynasty, so every career in this file
    // carries the literal `null` for the whole of its life.
    //
    // ⚠⚠ THE WRITER'S OWN SIGNATURE IS THE WHOLE ARGUMENT – v84's `prologueTrace` rung, verbatim,
    // and for once the parallel is exact rather than approximate: no tick, however long, writes this
    // key, because its ONE writer takes its value from an argument no career in this file is given.
    // A red HERE beside a green freeze means something started writing `world.dynasty` inside the
    // tick, which `createWorld`'s own note forbids in as many words.
    //
    // ⚠ THE MEASUREMENT is in the block over `PRE_V86` in tests/coachTravelEdgeFixtures.ts: the three
    // values below are the three `FROZEN` constants this repo shipped on `main`, reproduced character
    // for character by the peel. Eleven live cells moved and every rollback rung held.
    expect(careerHashAtSchema(5, 0, 85), '25k · middle coach · grinder – the verbatim v85 value').toBe(PRE_V86.middleGrinder)
    expect(careerHashAtSchema(8, 0, 85), '120k · elite coach · grinder – the verbatim v85 value').toBe(PRE_V86.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 85), '8k · self-coached · player – the verbatim v85 value').toBe(PRE_V86.selfTravelling)
  })

  it('⭐⭐⭐ v85: rolling the schema back to 84 – dropping `pregnancy`, `children` and `comeback` – returns the v84 CAREER on all three', () => {
    // ⭐⭐ AN IDENTITY, v84's OWN KIND, AND THE CASE NAME SAYS SO because the per-key diff proved it
    // before a constant was touched. v85 appends THREE world keys – `pregnancy` and `children`, the
    // pregnancy and the return (wave 8 T1), and `comeback`, the week she came back and the freeze she
    // came back with (added to this same version after gate 2) – and `createWorld` writes them `null`,
    // `[]` and `null`.
    //
    // ⚠⚠ THE WRITER SET IS THE WHOLE ARGUMENT, and on this rung it is still EMPTY FOR THESE CELLS,
    // although it is no longer empty on the tree: T2 has landed and `rollPregnancy` writes
    // `world.pregnancy`. That makes the SECOND half of the argument the load-bearing one, and it is
    // the half a later reader should lean on anyway – the walk stops at 156 weeks, age 16.6, the
    // hazard's window opens at 24 and marriage is the door, so a frozen career can never reach a
    // latch, let alone a pregnancy, a birth or a return. A red HERE beside a green freeze means a
    // pregnancy reached a sixteen-year-old, which the age window forbids. ⚠ `comeback` keeps the
    // stronger half too, for as long as T6 is unwritten: nothing on this tree can set it at all.
    //
    // ⚠ THE MEASUREMENT is in the two blocks over `PRE_V85` in tests/coachTravelEdgeFixtures.ts –
    // three keys moved per cell at T1 and ONE more at T2½, nothing else on either pass, `rngMain`
    // byte-identical everywhere, and `careerHashAtSchema(·, ·, 84)` reproduced the three shipped v84
    // `FROZEN` constants character for character BOTH TIMES: once with the bump in the tree, and
    // again with the third key in it.
    expect(careerHashAtSchema(5, 0, 84), '25k · middle coach · grinder – the verbatim v84 value').toBe(PRE_V85.middleGrinder)
    expect(careerHashAtSchema(8, 0, 84), '120k · elite coach · grinder – the verbatim v84 value').toBe(PRE_V85.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 84), '8k · self-coached · player – the verbatim v84 value').toBe(PRE_V85.selfTravelling)
  })

  it('⭐⭐⭐ v84: rolling the schema back to 83 – dropping `prologueTrace` – returns the v83 CAREER on all three', () => {
    // ⭐⭐ AN IDENTITY, v83's OWN KIND, AND THE CASE NAME SAYS SO because the measurement proved it
    // before a constant was touched. v84 appends ONE world key – `prologueTrace`, the childhood's
    // own record (the album spec §3, ruled path (а) 19.09) – written ONCE at `createWorld` FROM THE
    // HANDOVER's optional `trace`, and `walkFrozenCareer` hands over no prologue, so every career
    // in this file carries the literal `null` for the whole of its life.
    //
    // ⚠⚠ THE WRITER'S OWN SIGNATURE IS THE WHOLE ARGUMENT, a stronger one than v83's calendar: no
    // tick, however long, writes this key – its one writer takes its value from an argument no
    // career in this file is ever given, and its one reader (the album assembly) is on demand and
    // never inside a walk. So unlike the v83 rung, no future lengthening of `FREEZE_WEEKS` can
    // re-anchor this one; a red HERE beside a green freeze means something started writing the
    // trace after birth, which the state.ts block above the key forbids in as many words.
    //
    // ⚠ THE MEASUREMENT is in the v84 block over `PRE_V84` in tests/coachTravelEdgeFixtures.ts –
    // `careerHashAtSchema(·, ·, 83)` reproduced the three shipped v83 `FROZEN` constants character
    // for character with the bump in the tree, and `rngMain` cannot have moved by construction
    // (the step and the writer draw nothing; the album's flavour sub-stream is assembly-time).
    expect(careerHashAtSchema(5, 0, 83), '25k · middle coach · grinder – the verbatim v83 value').toBe(PRE_V84.middleGrinder)
    expect(careerHashAtSchema(8, 0, 83), '120k · elite coach · grinder – the verbatim v83 value').toBe(PRE_V84.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 83), '8k · self-coached · player – the verbatim v83 value').toBe(PRE_V84.selfTravelling)
  })

  it('⭐⭐⭐ v83: rolling the schema back to 82 – dropping the latch and the name seats – returns the v82 CAREER on all three', () => {
    // ⭐⭐ AN IDENTITY, v81's OWN KIND, AND THE CASE NAME SAYS SO because the wave predicted it in §0
    // and the per-key diff proved it before a constant was touched. v83 appends `latchedWeek` and
    // `partnerName` to every `LoveEpisode` row (the wedding, wave 7 – T1), both null at birth, and
    // it appends NO WRITER for either on the T1 tree: the hazard is T2's, the latch write and the
    // naming are T3's, and every one of them is gated on `ageYears >= 23`.
    //
    // ⚠⚠ THE CALENDAR IS THE WHOLE ARGUMENT, exactly as it was for v81's corpus: **a frozen career
    // is 156 weeks from its own start, so the girl in it is 16.6 and never reaches 23** – no wedding
    // hazard can fire, no `'engaged'` beat can be raised, no name can be drawn and no cost can be
    // charged, however many waves land on top of T1. The peel drops two null fields and rolls the
    // number, and the exact v82 serialisation comes back: `PRE_V83` holds the VERBATIM v82 `FROZEN`
    // constants, measured rather than promised.
    //
    // ⚠ SO IF THIS GOES RED BESIDE A GREEN FREEZE, THE FIRST QUESTION IS NOT «WHAT BROKE» BUT «DID
    // THE WALK GET LONGER» – the day `FREEZE_WEEKS` reaches past 23 x 52 from age 14, this rung
    // stops being an identity and re-anchors with everything under it, and that is correct rather
    // than a regression. A red HERE with the walk unchanged means something below 23 reached a
    // wedding seat, which §0 calls a leak and the wave must stop for.
    //
    // ⚠ THE PER-KEY CONTROL is in the v83 block over `PRE_V83` in tests/coachTravelEdgeFixtures.ts –
    // `schemaVersion` alone on four of five cells, `schemaVersion` + `loveEpisodes` on
    // `eliteGrinder` (its one row, `p:137`, gaining the two null fields – the key append itself),
    // `rngMain` byte-identical on all five, and the frozen MAIN capture unmoved.
    expect(careerHashAtSchema(5, 0, 82), '25k · middle coach · grinder – the verbatim v82 value').toBe(PRE_V83.middleGrinder)
    expect(careerHashAtSchema(8, 0, 82), '120k · elite coach · grinder – the verbatim v82 value').toBe(PRE_V83.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 82), '8k · self-coached · player – the verbatim v82 value').toBe(PRE_V83.selfTravelling)
  })

})
