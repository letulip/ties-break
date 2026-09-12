// THE FROZEN CAREERS – the live hashes, and the version ladder's top (v62 – v67).
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
// ⚠ WHY THERE ARE THREE FILES – the 62,889 ms CI stall with all 43 tests green, the measurement
// that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off would not have
// been enough – is in tests/coachTravelEdgeFixtures.ts, which holds the eighteen constants, the
// walk and the per-key protocol this file and its `-older-schemas` sibling share.
//
// The claim held here is the fourth of the four the travel helping shipped with, quoted from the
// design header that travels with claims 1-3 in tests/coach-travel-edge-helping.test.ts:
//
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.
//
// ⚠ AND THE LADDER SPANS THE PAIR, APPEND-ONLY ACROSS IT. `PRE_V61` down to `PRE_V50` are asserted
// in tests/coach-travel-edge-older-schemas.test.ts, under the SAME describe name and off the same
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
  PRE_V62,
  PRE_V63,
  PRE_V64,
  PRE_V65,
  PRE_V66,
  PRE_V67,
  PRE_V68,
  PRE_V69,
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

  it('⭐⭐ v62: rolling the schema back to 61 – and dropping the key v62 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE LONG GOODBYE'S STEP 1 DID TO THESE THREE CAREERS, as an identity. The
    // stored peak physical is written by the WEEKLY TICK rather than from behind the college freeze,
    // so unlike most of the rollbacks below it genuinely reaches all three – 156 times each. What
    // this case asks is whether it did anything BUT be written: a `Math.max` over a mean of numbers
    // `growWeek` has already produced cannot feed back into her tennis, and nothing reads it yet.
    // If it had – if the peak had changed a rate, a rank, a fare or an event – the drop would not be
    // enough and this case would be red beside the freeze, naming the wave rather than the number.
    // ⚠ THE KEY IS DROPPED HERE, as in v59's rollback and unlike v60's and v61's: the field that
    // moved is TOP-LEVEL, so a v61 serialisation of this world is exactly this world without it.
    expect(careerHashAtSchema(5, 0, 61), '25k · middle coach · grinder').toBe(PRE_V62.middleGrinder)
    expect(careerHashAtSchema(8, 0, 61), '120k · elite coach · grinder').toBe(PRE_V62.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 61), '8k · self-coached · player').toBe(PRE_V62.selfTravelling)
  })

  it('⭐⭐ v63: rolling the schema back to 62 – and dropping the key v63 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE SHOP'S SLICE 1 DID TO A CAREER THAT NEVER OPENS IT, as an identity, and
    // it is acceptance §2e-4 checked rather than asserted in prose: a save from before the shelf must
    // load with `assets: []` and PLAY IDENTICALLY. `assets` is top-level, so a v62 serialisation of
    // this world is exactly this world without it – and if the shop had touched a price, a fare, a
    // rank or an event on the way in, the drop would not be enough and this case would go red beside
    // the freeze, naming the wave instead of leaving three hashes drifting.
    // ⚠ AND `walkFrozenCareer` ASSERTS THE ARRAY IS EMPTY rather than merely present, so the new key
    // is not just there, it is the nothing the comment says it is.
    expect(careerHashAtSchema(5, 0, 62), '25k · middle coach · grinder').toBe(PRE_V63.middleGrinder)
    expect(careerHashAtSchema(8, 0, 62), '120k · elite coach · grinder').toBe(PRE_V63.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 62), '8k · self-coached · player').toBe(PRE_V63.selfTravelling)
  })

  it('⭐⭐⭐ v69: rolling the schema back to 68 reproduces the v68 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT ROUND 32 #4/#5 DID TO A FROZEN CAREER, AS AN IDENTITY – and the answer is
    // NOTHING, for two independent reasons, one per item. #4 appends `brandStrengthSeed`, and the ONLY
    // writer of it is the v68 -> v69 MIGRATION: `createWorld` does not write it, no phase of the tick
    // writes it, and `walkFrozenCareer` builds a live career and never migrates one. #5 changes how a
    // SIGNED advertising letter is read into the fame floor, and no bench policy signs one – 102 ad
    // letters raised over 780 weeks on preset 0, every one of them expired.
    //
    // ⭐⭐ SO THIS IS A STRONGER STATEMENT THAN v68's, NOT A REPEAT OF IT. v68's key was absent because
    // these careers stop before the fork that writes it; this one is absent because nothing but a
    // migration can write it at any week. A stock written weekly WOULD have landed here – `selfTravelling`
    // reaches fame 2.55 by week 156 – so where the write lives was chosen to keep this identity true.
    // Measured before the re-freeze, not after: `tools/frozen-key-diff.ts` on all three careers against
    // the branch's own base reports ONE key, `schemaVersion`, with `rngMain` and `offers` byte-identical.
    expect(careerHashAtSchema(5, 0, 68), '25k · middle coach · grinder').toBe(PRE_V69.middleGrinder)
    expect(careerHashAtSchema(8, 0, 68), '120k · elite coach · grinder').toBe(PRE_V69.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 68), '8k · self-coached · player').toBe(PRE_V69.selfTravelling)
  })

  it('⭐⭐ v68: rolling the schema back to 67 – and dropping the key v68 added – reproduces the v67 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 31 #10/#13 DID TO A FROZEN CAREER, AS AN IDENTITY – and the answer is
    // NOTHING, which is derived rather than hoped for. The per-career age curve is resolved when the
    // FORK AT NINETEEN is answered, and these careers stop at week 156, age 16.6: `world.ageCurve` is
    // never written, so the key `careerHashAtSchema` peels is not there to peel. The cohort's half of
    // the wave is derived, never stored, and cannot bite a field whose oldest player is 22.
    //
    // ⚠⚠ SO THIS CASE IS A STRICTLY STRONGER STATEMENT THAN v66's AND v67's, AND IT IS THE ONE THE
    // WAVE HAD TO EARN. Those two moved no key because they had none to move; this one appends a
    // world key and still moves nothing, because WHERE the key is written was chosen so that it could
    // not. If the resolve had been put in `createWorld` – the obvious place – all three constants
    // would have moved for a reason no comment could call inert, and a moved career hash is the
    // owner's call. Measured before the re-freeze, not after: `tools/frozen-key-diff.ts` on 0/1
    // against this branch's base reports ONE key of sixty-one, `schemaVersion`.
    expect(careerHashAtSchema(5, 0, 67), '25k · middle coach · grinder').toBe(PRE_V68.middleGrinder)
    expect(careerHashAtSchema(8, 0, 67), '120k · elite coach · grinder').toBe(PRE_V68.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 67), '8k · self-coached · player').toBe(PRE_V68.selfTravelling)
  })

  it('⭐⭐ v67: rolling ONLY the schema number back to 66 reproduces the v66 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 30 ITEM 25's REPAIR DID TO A FROZEN CAREER, AS AN IDENTITY – and the
    // answer is NOTHING, which is the derived expectation and not a relief. v67 is a RENUMBER: the
    // units and name back-fills are the v66 step's own former contents, moved character for
    // character onto a new rung because v66 had shipped underneath them. They write `units` and
    // `name` onto ROWS of `assets`, and `walkFrozenCareer` asserts that array is empty here, so
    // neither has a row to reach and no bench policy buys one. If the move had altered a single
    // character of behaviour on the way across – a fallback, a price, an order – changing one number
    // back would not be enough and this case would be red beside the freeze, naming the wave.
    expect(careerHashAtSchema(5, 0, 66), '25k · middle coach · grinder').toBe(PRE_V67.middleGrinder)
    expect(careerHashAtSchema(8, 0, 66), '120k · elite coach · grinder').toBe(PRE_V67.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 66), '8k · self-coached · player').toBe(PRE_V67.selfTravelling)
  })

  it('⭐⭐ v66: rolling ONLY the schema number back to 65 reproduces the v65 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE 'business' CATEGORY DID TO A FROZEN CAREER, AS AN IDENTITY – and the
    // answer is NOTHING, which is the derived expectation rather than a relief: v66 appends no world
    // key (a category is a value inside `events` / `financeWeeks`), the businesses earn only for a
    // family that bought the shelf's earners, and no bench policy buys anything. If the wave had
    // reached any career fact – a row, a cent, a draw – changing one number back would not be
    // enough and this case would be red beside the freeze, naming the kind of change it was.
    expect(careerHashAtSchema(5, 0, 65), '25k · middle coach · grinder').toBe(PRE_V66.middleGrinder)
    expect(careerHashAtSchema(8, 0, 65), '120k · elite coach · grinder').toBe(PRE_V66.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 65), '8k · self-coached · player').toBe(PRE_V66.selfTravelling)
  })

  it('⭐⭐ v65: rolling the schema back to 64 – and dropping the key v65 added – reproduces the merge hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT RECORDING A CHAMPION DID TO A CAREER, AS AN IDENTITY, and this is the
    // strongest form the claim can take. v65 writes `world.fieldSeasonTitles` on EVERY canonical
    // bracket – ~187 a season in each of these three careers – so unlike v63's empty `assets` the new
    // key is FULL here. If the write had reached anything, dropping it would not be enough: the
    // ledger, the ranking, the cohort, the feed or the funds would still differ and this case would
    // be red beside the freeze.
    // ⚠ AND THE POINT OF THE CHANGE IS THAT IT REACHES NOTHING. It is post-draw bookkeeping on a
    // table the bracket has already filled in (`finishes`), written to a tally nothing but a census
    // reads – deliberately NOT to `world.results`, which prunes at 52 weeks and IS what
    // `computeRanking` reads. `walkFrozenCareer` asserts the key is present and non-empty rather than
    // merely present, so a wave that silently stopped recording would go red here too.
    // ⚠ THIS ASSERTION WAS DEAD until 28.08: it shared a physical line with the comment above, so
    // `//` swallowed it and the arm ran green while checking nothing. Re-aimed, never weakened.
    expect(careerHashAtSchema(5, 0, 64), '25k · middle coach · grinder').toBe(PRE_V65.middleGrinder)
    expect(careerHashAtSchema(8, 0, 64), '120k · elite coach · grinder').toBe(PRE_V65.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 64), '8k · self-coached · player').toBe(PRE_V65.selfTravelling)
  })

  it('⭐⭐ v64: rolling back to 63 – dropping v65\'s key as well – still reproduces the v63 hashes byte for byte', () => {
    // ⚠ THE SECOND WORKING RUNG, AND THE RENUMBER IS EXACTLY WHY IT MATTERS. Two schema moves landed
    // on this tree a day apart and this case walks BOTH of them off: `careerHashAtSchema(…, 63)`
    // drops `fieldSeasonTitles` and rolls the number past 64 to 63, so it is asking whether round 27
    // #6 AND the champion tally together left an ordinary tour career alone. The case above asks the
    // same of v65 alone; a chain is only append-only if every rung below it still reproduces.
    // ⚠ THE WHOLE OF WHAT ROUND 27 #6 DID TO A CAREER THAT NEVER GOES TO COLLEGE, as an identity.
    // The wave has three ways to reach an ordinary tour career and this closes all three at once:
    // the new save field (`college.callUpReveal` – nested, and `college` is null here), the new
    // LETTER (`settleCallUpLetter` writes to `world.offers`, which IS in this hash), and the moved
    // roll (`callUpFor`, same key, same view, same draw order). Every one of them is guarded on
    // `inCollege`, week 156 is 32 weeks short of the fork, and `walkFrozenCareer` asserts
    // `world.college === null` rather than assuming it – so if any of the three had leaked, rolling
    // the number back would NOT reproduce and this case would be red beside the freeze.
    // ⚠ RE-AIMED BY THE MERGE OF `origin/main`, NOT WEAKENED: `PRE_V64` now holds main's OWN
    // post-retirement hashes, because the retirement hazard's condition curve moved every frozen
    // career before this branch was merged. The case asks exactly what it always asked – does v64
    // move the version number and nothing else – but it now asks it ON TOP OF a change that moved
    // the careers, which is the first time this identity has had to survive one. It does.
    // ⚠ Dead the same way and for the same reason – see the note on the v65 arm above.
    expect(careerHashAtSchema(5, 0, 63), '25k · middle coach · grinder').toBe(PRE_V64.middleGrinder)
    expect(careerHashAtSchema(8, 0, 63), '120k · elite coach · grinder').toBe(PRE_V64.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 63), '8k · self-coached · player').toBe(PRE_V64.selfTravelling)
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
