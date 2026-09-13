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
  windowRuleWitness,
  FROZEN,
  PRE_NAME_VERA,
  PRE_R28B,
  PRE_V71,
  PRE_V72,
  PRE_V73,
  PRE_V74,
  PRE_V75,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
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

  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('⭐⭐ ROUND 28 #17-b: the re-freeze moved ONE field – put the window deadline back and the old hashes return', () => {
    // The measured diff behind the re-freeze, not a claim about it. See
    // `careerHashUnderTheWindowRule`: rewriting each kit letter's `deadlineWeek` to
    // `sponsorWindowClosesAt` - and applying the expiry that followed from it - reproduces every
    // pre-ruling constant byte for byte, which is the proof that nothing else in a career moved.
    //
    // ⚠⚠ RE-AIMED 12.09.2026 (wave 4, T1b), NOT WEAKENED - AND THE REASON IS THE ONLY THING IN THIS
    // FILE A READER SHOULD TAKE AWAY BEFORE THE HASHES. **THIS CASE WAS DOWN TO ZERO DISCRIMINATING
    // CAREERS, FROM ONE, AND WAS GREEN THE WHOLE TIME.** The rewrite is a NO-OP on a kit letter that
    // landed on the window's OPENING week - there the letter rule and the window rule are the same
    // number by arithmetic - so on such a career the identity below is true by construction and says
    // nothing about the ruling. `eliteGrinder` was the one career that still held a mid-window letter
    // (`kit-152`, deadline 156 by the letter / 155 by the window); it stopped holding one at
    // `ac2b5de3` on 03.09, when the first-round draw pin moved her results, her standing and with them
    // which rungs wrote in her window. `middleGrinder` never discriminated on any tree and
    // `selfTravelling` is identity by design. The full dating, the eighteen-career sweep and the
    // engine-toggled A/B that produced the two constants below are over `PRE_R28B` in the fixtures
    // module. ⚠ Nothing was invented to make this green: both restored careers are existing bench
    // pairs, and the third outcome - «the ruling is unobservable» - was REFUTED by that sweep.
    //
    // ⭐⭐ SO THE CASE NOW ASSERTS ITS OWN SUBJECT FIRST, which is exactly what it never did and what
    // let it die in silence: a career is only a WITNESS while it holds a letter the two rules disagree
    // about, so that letter is named, its two deadlines are named, and if a wave moves her ranking off
    // it again this goes RED HERE with a sentence instead of quietly proving nothing.
    //
    // ARM: three mutations, 12.09.2026, all run in a detached worktree at `97b4e6c9` carrying this
    // file and the fixtures module, control green first (18 passed).
    //   1. THE RULE ITSELF – `src/engine/offers.ts:965` and `:1059` put back to
    //      `sponsorWindowClosesAt(week)`: **1 case red**, this one, on «THE LETTER RULE … expected 155
    //      to be 156». ⚠ AND THE OTHER SEVENTEEN STAYED GREEN, which is the measurement that dates the
    //      defect from the other side: un-shipping round 28 #17-b altogether is INVISIBLE to `FROZEN`,
    //      to the three original `PRE_R28B` careers and to every `PRE_V*` rung in this file.
    //   2. THE WITNESS LOSING ITS LETTER – `windowRuleWitness(8, 1)` re-pointed at `(8, 0)`, the career
    //      that stopped discriminating on 03.09: **1 case red**, on «the witness letter exists and
    //      landed MID-window: expected undefined to be 152». That is this task's own defect reproduced
    //      as a red test, and it is the arm that did not exist before.
    //   3. THE RECONSTRUCTION REPAIR – the `o.state === 'expired'` branch deleted from
    //      `underTheWindowRule`: **1 case red**, on «25k · middle coach · player: expected
    //      '23ba204dc0ca…' to be 'de9a7dda7916…'» – the broken reconstruction against the hash the
    //      engine itself produced with the old rule compiled in.
    const elite = windowRuleWitness(8, 1) // 120k wealthy · elite coach · PLAYER policy
    const mid152 = elite.kitLetters.find((o) => o.id === 'kit-152')
    expect(mid152?.week, 'the witness letter exists and landed MID-window (slot 1, not the opening week)').toBe(152)
    expect(mid152?.slot, '...which is the whole reason the two rules can disagree about it').toBe(1)
    expect(mid152?.deadlineWeek, 'THE LETTER RULE, which is what the engine writes since the ruling').toBe(156)
    expect(mid152?.windowRule, 'THE WINDOW RULE, one week earlier - the thing the ruling replaced').toBe(155)
    expect(mid152?.state, '...so under the letter rule it is still OPEN at the horizon instead of expired').toBe('open')
    // ...and only NOW is the negative worth asserting, because the two lines above prove its target
    // exists. A case whose two arms cannot differ is the failure this whole re-aim is about.
    expect(elite.underTheWindowRule, 'the two rules produce DIFFERENT careers here').not.toBe(elite.live)
    expect(elite.underTheWindowRule, '120k · elite coach · player - the pre-ruling career').toBe(PRE_R28B.elitePlayer)

    // ⭐ AND THE OTHER BRANCH OF THE RECONSTRUCTION, which is a letter that had ALREADY lapsed by the
    // horizon: moving its deadline moves the week it lapsed WITH it, and rewriting one without the
    // other reconstructs a world the engine never wrote. That was a real defect in the helper until
    // this pass, invisible while every frozen career's letters sat on the opening week.
    const middle = windowRuleWitness(5, 1) // 25k middle · middle coach · PLAYER policy
    const mid100 = middle.kitLetters.find((o) => o.id === 'kit-100')
    expect(mid100?.slot, 'the expired witness landed mid-window too').toBe(1)
    expect(mid100?.state, '...and unlike kit-152 it is already gone by the horizon').toBe('expired')
    expect(mid100?.deadlineWeek, 'the LETTER rule gave it until 104...').toBe(104)
    expect(mid100?.decidedWeek, '...so `expireOffers` lapsed it on `deadlineWeek + 1`').toBe(105)
    expect(mid100?.windowRule, 'the WINDOW rule closed a week earlier, so it would have lapsed on 104').toBe(103)
    expect(middle.underTheWindowRule, '25k · middle coach · player - the pre-ruling career').toBe(PRE_R28B.middlePlayer)

    // The three careers this case has always carried. They no longer witness the RULE - every kit
    // letter they hold landed on the window's opening week - but they still say «this career did not
    // move», which is worth having and is what they now stand for.
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
