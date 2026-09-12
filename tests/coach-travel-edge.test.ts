// THE FROZEN CAREERS – the live hashes, and the version ladder's top (v71 – v74).
//
// ⚠⚠ THE LADDER IS THREE FILES SINCE 12.09 (wave 3, PR #135 – the fifth red `unit-heavy`), and the
// rung range in the line above is the ONLY thing about this file that moved. v69 down to v62 now sit
// in tests/coach-travel-edge-mid-schemas.test.ts, under the SAME describe name and off the same
// `careerHashAtSchema`; the measurement that forced it – 29.69 s solo against a 60 s window at this
// file's own 2.24x, with the cost flat across all 17 cases so the walk count WAS the seam – is in
// that file's header.
//
// ⚠ THIS FILE KEEPS ITS PATH BECAUSE IT IS THE ONE THE CITATIONS MEAN. `src/engine/world.ts` cites
// it for the schema roll-backs, `tools/frozen-key-diff.ts` is the tool this protocol demands,
// `tests/migrations.test.ts` and `tests/fixtures/saves/README.md` name it for the frozen careers,
// and some thirty dated entries in docs/specs and docs/rounds are the ledger of its re-freezes.
// Every one of them means the byte identity, so the byte identity is what was left here – and the
// handful that mean the ARITHMETIC (`src/engine/coach.ts`, `src/engine/world/player.ts`, the two
// round21-coach-travel suites) were repointed at tests/coach-travel-edge-helping.test.ts in the
// same commit rather than left resolving to a file that no longer holds what they describe.
//
// ⚠ WHY THERE IS MORE THAN ONE FILE – the 62,889 ms CI stall with all 43 tests green, the
// measurement that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off would
// not have been enough – is in tests/coachTravelEdgeFixtures.ts, which holds the eighteen constants,
// the walk and the per-key protocol this file and its two frozen siblings share.
//
// The claim held here is the fourth of the four the travel helping shipped with, quoted from the
// design header that travels with claims 1-3 in tests/coach-travel-edge-helping.test.ts:
//
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.
//
// ⚠ AND THE LADDER SPANS ALL THREE, APPEND-ONLY ACROSS THEM. `PRE_V69` down to `PRE_V62` are
// asserted in tests/coach-travel-edge-mid-schemas.test.ts and `PRE_V61` down to `PRE_V50` in
// tests/coach-travel-edge-older-schemas.test.ts, both under the SAME describe name and off the same
// `careerHashAtSchema`. A rung that stops reproducing goes red there rather than here, and the
// chain is only append-only if every rung below this one still reproduces.

import { describe, it, expect } from 'vitest'
import {
  careerHash,
  careerHashAtSchema,
  careerHashUnderTheOldName,
  careerHashUnderTheWindowRule,
  FROZEN,
  PRE_NAME_VERA,
  PRE_R28B,
  PRE_V71,
  PRE_V72,
  PRE_V73,
  PRE_V74,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
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

  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('⭐⭐ ROUND 28 #17-b: the re-freeze moved ONE field – put the window deadline back and the old hashes return', () => {
    // The measured diff behind the re-freeze, not a claim about it. See
    // `careerHashUnderTheWindowRule`: rewriting each kit letter's `deadlineWeek` to
    // `sponsorWindowClosesAt` - and applying the expiry that followed from it - reproduces every
    // pre-ruling constant byte for byte, which is the proof that nothing else in a career moved.
    expect(careerHashUnderTheWindowRule(5, 0), '25k · middle coach · grinder').toBe(PRE_R28B.middleGrinder)
    expect(careerHashUnderTheWindowRule(8, 0), '120k · elite coach · grinder').toBe(PRE_R28B.eliteGrinder)
    // ...and the career that was never written to did not move at all, which is the other half: the
    // whole diff is confined to the inbox.
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(PRE_R28B.selfTravelling)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
  })

  it('⭐⭐ 02.09 – the `Vera -> Alice` default moved HER NAME: put it back and the old hashes return', () => {
    // The measured diff behind the re-stamp, as an identity rather than as a claim about it. The
    // per-key diff said `profile` and `events` moved and nothing else; this says the same thing at
    // byte level, which is the stronger half – walk the same career with `kidName: 'Vera'` restored
    // BEFORE birth and all three pre-02.09 constants come back exactly. If the owner's default had
    // reached one number in a career – a draw, a cent, a ranking place – this would be red beside a
    // green freeze, which is the one signal a whole-world hash cannot otherwise give.
    // ⚠ AND THE OVERRIDE GOES IN BEFORE `createWorld`, NOT AFTER IT. Patching `world.profile` on the
    // opened career reproduces every key except `events`, because the career's opening events are
    // written at birth and already carry the old name. See `careerHashUnderTheOldName`.
    expect(careerHashUnderTheOldName(5, 0), '25k · middle coach · grinder').toBe(PRE_NAME_VERA.middleGrinder)
    expect(careerHashUnderTheOldName(8, 0), '120k · elite coach · grinder').toBe(PRE_NAME_VERA.eliteGrinder)
    expect(careerHashUnderTheOldName(0, 1), '8k · self-coached · player').toBe(PRE_NAME_VERA.selfTravelling)
  })

  it('MOVES when the same career sends him – so the three pins above are not vacuous', () => {
    // ⚠ THE MUTATION CHECK, and it is what makes this file a test rather than a photograph. The same
    // preset, the same policy, the same seed and the same 156 weeks, with only the stance flipped:
    // if the travel helping were inert the two would hash the same and the pins would be proving
    // nothing. (The fare moves with the switch too, which is the point of the switch - what is
    // isolated to the edge alone is asserted arithmetically in
    // tests/coach-travel-edge-helping.test.ts, which is where claims 1-3 went in the cut.)
    expect(careerHash(5, 0, { coachOnEventWeeks: true })).not.toBe(FROZEN.middleGrinder)
  })
})
