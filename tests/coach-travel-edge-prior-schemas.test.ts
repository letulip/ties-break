// THE FROZEN CAREERS, THE RUNGS BELOW THE TOP – v76 down to v71.
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS THE FOURTH TIME THIS FAMILY HAS BEEN CUT FOR THE SAME REASON.
// birpc's RPC window is a hard 60 s and it is not raisable; a file whose tests cross it fails the job
// with every test GREEN and one unhandled `Timeout calling "onTaskUpdate"`. On 18.09 the deploy run
// after round 44's merge hit it on `coach-travel-edge-recent-schemas`: stalled at 68 s, retried,
// STALLED TWICE at 69 s – and twice at the same second is the wall, not an unlucky runner. Round 44
// had just added two rungs at the top (v81, v82 – two schema moves in one wave), taking that file
// from ten cases to twelve, 29.82 s solo on ten cores: sitting on the family's ~31 s local bar.
//
// WHAT THE SEAM IS, and it is the ladder again – the fourth cut runs where the third did. The
// per-case cost is FLAT (2.42–2.64 s a rung, the first case +JIT), so the cost IS the rung count
// and the split is arithmetic: the top six rungs (v82 down to v77) stay in -recent-schemas, which
// is also where every future schema move adds its rung; the six below (v76 down to v71 – the
// private life's waves and the rung under them) moved here, and this range never grows. Nothing was
// trimmed on the way across – same walk, same 156 weeks, same constants, same test names, and the
// ORIGINAL describe name deliberately unchanged, exactly as the three earlier cuts did.
//
// ⭐ THE ARITHMETIC TO CARRY FORWARD: ~2.5 s per rung locally, the wall at ~31 s local (birpc's
// 60 s at the runner's ~1.9x, measured up to 2.3x on a slow day), so -recent-schemas crosses again
// at about twelve rungs – six schema moves from now. Cut it then, not after the red run.
//
// tests/coachTravelEdgeFixtures.ts holds the constants, the walk and the per-key protocol;
// `careerHashAtSchema`'s key-peeling is imported, never copied, so it cannot grow two truths.
import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
  PRE_V71,
  PRE_V72,
  PRE_V73,
  PRE_V74,
  PRE_V75,
  PRE_V76,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
  it('⭐⭐⭐ v76: rolling the schema back to 75 – and dropping the SIX keys v76 added – reproduces the v75 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE PSYCHOLOGIST'S YEAR, STEP 1 DID TO A FROZEN CAREER, AS AN IDENTITY –
    // the v75 case directly below, repeated one version up. v76 appends SIX keys to `createWorld`'s
    // literal in one append – `psychologistHired`, `psychologistRung`, `psychologistFocus`,
    // `psychologistFocusSeason`, `wallsLean`, `wallsFlipped` – and every career here carries all six
    // at their identity values. Peel them, roll the number back, and the ENTIRE serialisation returns
    // byte for byte: `rngMain`, `results`, `events`, the wallet, the body, `temperament`, all eighty.
    //
    // ⚠ SIX WHERE EVERY RUNG SINCE v72 HAS PEELED ONE, in ONE destructure, on `PRE_V72`'s own
    // precedent: they arrived in one append and object rest preserves the relative order of everything
    // it keeps, so the v75 shape comes back exactly.
    //
    // ⚠⚠ AND THIS RUNG'S SIX IDENTITY VALUES ARE A FACT ABOUT THE TREE, NOT ABOUT THESE CAREERS, which
    // is v74's and v75's caveat one and two rungs down and the thing a later reader must not misread.
    // T1 ships six seats, the migration and NO WRITER AT ALL; `hirePsychologist` is T2, the focus
    // command T3, and the weekly leaning pass with its flip hazard T7. So this case does not yet say
    // «a hire or a flip cannot reach a 156-week career». It says the schema move is inert, which is all
    // a schema move should ever be. ⚠ The SEAT could not reach them anyway – it is gated on the
    // professional ladder and these careers stop at 16.6 – so T7's WALLS are the half to watch here:
    // their weekly pass is deterministic and reads the bond band, which every career in this file has.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    //
    // ⚠⚠ AND `temperament` BYTE-IDENTICAL IS THIS WAVE'S OWN SENTENCE RATHER THAN A ROUTINE LINE.
    // Identity is IMMUTABLE (who-she-is §2a's 09.09 re-cut); the walls are expression OVER it, read
    // through `expressedTemperamentOf` and never stored. A bump that had quietly moved a girl's birth
    // temperament is the gravest finding this wave could produce, and the per-key diff over `PRE_V76`
    // is where it is measured not to have happened.
    expect(careerHashAtSchema(5, 0, 75), '25k · middle coach · grinder').toBe(PRE_V76.middleGrinder)
    expect(careerHashAtSchema(8, 0, 75), '120k · elite coach · grinder').toBe(PRE_V76.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 75), '8k · self-coached · player').toBe(PRE_V76.selfTravelling)
  })

  it('⭐⭐⭐ v75: rolling the schema back to 74 – and dropping the key v75 added – reproduces the v74 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE PRIVATE LIFE'S WAVE 4 STEP 1 DID TO A FROZEN CAREER, AS AN IDENTITY –
    // the v74 case directly below, repeated one version up. v75 appends ONE key to `createWorld`'s
    // literal, `spiritShock`; every career here carries it and every one of them carries it `null`.
    // Peel that key, roll the number back, and the ENTIRE serialisation returns byte for byte –
    // `rngMain`, `results`, `events`, the wallet, the body, all eighty keys.
    //
    // ⚠⚠ AND THIS RUNG'S «NULL» IS A FACT ABOUT THE TREE, NOT ABOUT THESE CAREERS, which is v74's own
    // caveat one rung down and is the thing a later reader must not misread. T1 ships the seat, the
    // migration and NO WRITER AT ALL; `rollEnds` lands in T2 and the shock in T3. So this case does
    // not yet say «an ending cannot reach a 156-week career». It says the schema move is inert, which
    // is all a schema move should ever be. T2 answers the other question here, by reproducing or not –
    // and `eliteGrinder` is where to watch for it: she is fiery (×1.5 on the ends hazard) and has been
    // with somebody since week 137 ever since T3/T5 landed.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    //
    // ⚠ THE SECOND FIELD OF THIS BUMP CANNOT REACH THIS CASE AT ALL, and it is worth naming so nobody
    // looks for it: `WorldEvent.lifeKind?` is optional, additive, never back-filled and written by
    // nothing until T5, so no row in any of these three careers carries it and `events` is one of the
    // keys measured byte-identical. A schema bump whose second half is invisible to a whole-world hash
    // is exactly what «optional and not a schema move on its own» means, stated as a measurement.
    // ⭐⭐⭐ ANSWERED 12.09 BY T5, AND THE PARAGRAPH ABOVE IS KEPT AS THE RECORD OF WHAT A SCHEMA MOVE
    // COST BY ITSELF. T5 writes the field at all three `'life'` write sites, so it DOES now reach a
    // career: `eliteGrinder`'s delivered `'met'` row took a stamp, her `events` hash moved, and this
    // whole ladder was re-stamped (the block at the head of tests/coachTravelEdgeFixtures.ts). ⚠ AND
    // THIS RUNG IS STILL GREEN BESIDE THAT, which is the informative combination: `careerHashAtSchema`
    // peels `spiritShock` and rolls the number, and the stamp rides inside `events` on BOTH sides of
    // the identity – so «v75 is v74 plus one key» is unchanged by a field that was never a key of the
    // world. ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    expect(careerHashAtSchema(5, 0, 74), '25k · middle coach · grinder').toBe(PRE_V75.middleGrinder)
    expect(careerHashAtSchema(8, 0, 74), '120k · elite coach · grinder').toBe(PRE_V75.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 74), '8k · self-coached · player').toBe(PRE_V75.selfTravelling)
  })

  it('⭐⭐⭐ v74: rolling the schema back to 73 – and dropping the key v74 added – reproduces the v73 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE PRIVATE LIFE'S WAVE 3 STEP 1 DID TO A FROZEN CAREER, AS AN IDENTITY –
    // the wave-2 case directly below, repeated one version up. v74 appends ONE key to `createWorld`'s
    // literal, `loveEpisodes`; every career here carries it and every one of them carries it EMPTY.
    // Peel that key, roll the number back, and the ENTIRE serialisation returns byte for byte –
    // `rngMain`, `results`, `events`, the wallet, the body, all eighty keys.
    //
    // ⚠⚠ AND THIS RUNG'S «EMPTY» IS A FACT ABOUT THE TREE, NOT ABOUT THESE CAREERS – which is the
    // one way it differs from every rung below it and the thing a later reader must not misread. T1
    // ships the list, the migration and the derived selector and NO WRITER AT ALL; `rollArrival`
    // lands in T3. So this case does not yet say «an attachment cannot reach a 156-week career», the
    // way the v73 case below says it about a beat. It says the schema move is inert, which is all a
    // schema move should ever be. The step that adds the writer will answer the other question here,
    // by reproducing or by not.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    //
    // ⭐⭐⭐ ANSWERED 11.09 BY T3/T5, AND THE ANSWER IS BOTH HALVES AT ONCE – this rung GREEN beside a
    // RED freeze, which is the third combination the paragraph above did not name and the most
    // informative one. AN ATTACHMENT DOES REACH A 156-WEEK CAREER: `eliteGrinder` is a fiery girl
    // (×1.6, who-she-is §4's likeliest row) who turns sixteen at about week 128 and meets somebody
    // at 137, so her live hash moved and was re-frozen. This case stays green because the move is
    // CONFINED TO THE NEW KEY: the per-key diff is 1 of 79, `loveEpisodes` alone, and peeling it
    // returns v73 byte for byte on all three careers. So the pair reads «a career moved, and only
    // where the wave was allowed to move it» – see `FROZEN.eliteGrinder`'s own block for the diff,
    // the row and the control.
    //
    // ⚠⚠ RE-AIMED 11.09 BY T4, AND NOT WEAKENED – THE CASE NAME CHANGED AND SO DID ONE CONSTANT.
    //
    // WHAT MOVED: `PRE_V74.eliteGrinder`. WHY IT HAD TO: T4 is the first step of this layer that is
    // NOT a schema move. It adds no key and takes no draw; it changes the VALUE of `spirit` – she is
    // lifted toward 75 while someone is there – and `spirit` arrived at v72, so it is INSIDE the v73
    // shape this case rolls back to. A peel that drops `loveEpisodes` cannot undo a value the
    // remaining shape still carries, and no amount of care would have kept this green.
    //
    // ⭐ SO THE LINE THREE PARAGRAPHS UP FIRED CORRECTLY: «IF THIS GOES RED BESIDE A RED FREEZE, the
    // wave moved a career and not just a schema». It did, deliberately. The claim is unchanged for
    // `middleGrinder` and `selfTravelling`, whose constants were not touched; for `eliteGrinder` the
    // peel is still exact, against a constant that moved with her.
    //
    // ⚠ THE CASE NAME WAS BRIEFLY CHANGED TO «…on every career the private life never reached» AND
    // THE ARCHITECT PUT IT BACK (11.09). That name is not true of this case: all THREE careers are
    // still asserted below, `eliteGrinder` among them at her re-stamped value – so a name excluding
    // her would let a reader think she is skipped, and not notice if her line were ever dropped. The
    // name states the mechanical claim (peel the key, roll the number back, the serialisation
    // returns), which holds on all three; WHY lives here, which is this file's convention.
    //
    // ⭐⭐ THE IDENTITY THAT STILL COVERS ALL THREE IS `PRE_V72`'s, two cases down: its peel drops
    // `spirit` itself and it reproduces untouched, so every key that predates the private life –
    // `results`, `events`, `rngMain`, the wallet – is where it was three waves ago.
    expect(careerHashAtSchema(5, 0, 73), '25k · middle coach · grinder').toBe(PRE_V74.middleGrinder)
    expect(careerHashAtSchema(8, 0, 73), '120k · elite coach · grinder').toBe(PRE_V74.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 73), '8k · self-coached · player').toBe(PRE_V74.selfTravelling)
  })

  it('⭐⭐⭐ v73: rolling the schema back to 72 – and dropping the key v73 added – reproduces the v72 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE PRIVATE LIFE'S WAVE 2 DID TO A FROZEN CAREER, AS AN IDENTITY – the
    // wave-1 case directly below, repeated one version up. v73 appends ONE key to `createWorld`'s
    // literal, `lifeLog`; every career here carries it and every one of them carries it EMPTY, since
    // the only beat this wave raises is the fork's own opinion and the fork opens at week ~241
    // against this walk's 156. Peel that key, roll the number back, and the ENTIRE serialisation
    // returns byte for byte – `rngMain`, `results`, `events`, the wallet, the body, all eighty keys.
    //
    // ⭐⭐ AND IT IS THE STOP-AFTER-ANY-STEP PIN. The wave gave `advanceRefusal` a member, `answerFork`
    // a refusal and the fork's opening tick a want-draw; if any of the three could bite before the
    // fork, a career of 156 weeks would have a different calendar or a different `bond` and nothing
    // below could reproduce. It reproduces on all three, which is «a player who never reaches the
    // fork loses nothing» measured rather than argued.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    //
    // ⚠⚠ RE-AIMED 11.09 BY T4, IN STEP WITH THE v74 CASE ABOVE AND FOR THE IDENTICAL REASON, which is
    // written out there in full: the attachment lift moves `spirit`, `spirit` is a v72 key, and the
    // v72 shape this rung rolls back to still contains it. `PRE_V73.eliteGrinder` was re-stamped;
    // `middleGrinder` and `selfTravelling` were not touched and still reproduce character for
    // character. The wave-2 claim this case was written for – the fork machinery cannot bite before
    // week 241 – is untouched by any of it, and is what those two careers still prove.
    expect(careerHashAtSchema(5, 0, 72), '25k · middle coach · grinder').toBe(PRE_V73.middleGrinder)
    expect(careerHashAtSchema(8, 0, 72), '120k · elite coach · grinder').toBe(PRE_V73.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 72), '8k · self-coached · player').toBe(PRE_V73.selfTravelling)
  })

  it('⭐⭐⭐ v72: rolling the schema back to 71 – and dropping the three keys v72 added – reproduces the v71 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE PRIVATE LIFE'S WAVE 1 DID TO A FROZEN CAREER, AS AN IDENTITY – and it
    // is the strongest form of this file's per-key protocol rather than a substitute for it. v72
    // appends `spirit`, `bond` and `temperament` to `createWorld`'s literal; all three are written at
    // birth, every career here carries them, and `spirit` moves week by week. Peel exactly those
    // three, roll the number back, and the ENTIRE serialisation returns byte for byte – `rngMain`,
    // `results`, `events`, the wallet, the body, all seventy-odd keys. So the diff is `schemaVersion`
    // plus the three appends and provably nothing else.
    //
    // ⭐⭐ AND THIS IS ALSO THE MATCH-SEAM PIN. `spiritMatchFactor` multiplies her five wings, so a
    // single week under the knee (60) would have changed who won a match – and her ranking, her
    // cheques and her condition with it – and then nothing below could reproduce. It reproduces on
    // all three careers over 156 weeks: spirit stayed above the knee, factor 1.0, tennis unmoved.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    expect(careerHashAtSchema(5, 0, 71), '25k · middle coach · grinder').toBe(PRE_V72.middleGrinder)
    expect(careerHashAtSchema(8, 0, 71), '120k · elite coach · grinder').toBe(PRE_V72.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 71), '8k · self-coached · player').toBe(PRE_V72.selfTravelling)
  })

  it('⭐⭐ v71: rolling ONLY the schema number back to 70 reproduces the v70 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 39 #5's SCHEMA MOVE DID TO A FROZEN CAREER, as an identity – and the
    // answer is the version number and nothing else. v71 adds `brandFounded`, written only by
    // `buyAsset` on a business rung and by the migration where a merch brand is owned; no frozen
    // policy buys the shelf and `createWorld` writes no such key, so there is nothing to peel and a
    // v70 serialisation of this world is exactly this world with the number moved back. The same
    // wave's term ladder (round 39 #3) provably cannot reach these careers either: an ad letter
    // cannot arrive before eighteen and the walk stops at week 156. Per-key diff first, as the
    // fixtures module demands – 1 of 74 keys on all three careers, `schemaVersion` alone.
    expect(careerHashAtSchema(5, 0, 70), '25k · middle coach · grinder').toBe(PRE_V71.middleGrinder)
    expect(careerHashAtSchema(8, 0, 70), '120k · elite coach · grinder').toBe(PRE_V71.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 70), '8k · self-coached · player').toBe(PRE_V71.selfTravelling)
  })
})
