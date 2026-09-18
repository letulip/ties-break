// THE FROZEN CAREERS, THE RUNGS AT THE TOP – v79 down to v71.
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
// ⚠ AND THE NEXT ONE TO CROSS IS ALREADY NAMED: `coach-travel-edge-older-schemas` ran **57 s** on
// that same runner – three seconds of margin is not margin. Its own header carries the arithmetic for
// its cut. ⚠ Before cutting it, read round 42's open question about whether those ten deep rungs are
// the right instrument at all: nothing else in this repo mechanically enforces append-only below v61,
// which is why they are still here, and a pin on the migration bodies would do the same job in
// milliseconds. That is a design decision for the owner, not a cut to make under time pressure.
import { describe, it, expect } from 'vitest'
import {
  careerHashAtSchema,
  PRE_V71,
  PRE_V72,
  PRE_V73,
  PRE_V74,
  PRE_V75,
  PRE_V76,
  PRE_V77,
  PRE_V78,
  PRE_V79,
  PRE_V80,
  PRE_V81,
  PRE_V82,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
  it('⭐⭐⭐ v82: rolling the schema back to 81 – dropping `coachDeal` – returns the v81 SHAPE, and on no coached career the v81 CAREER', () => {
    // ⚠⚠ A RE-ANCHORING AND NOT AN IDENTITY, AND THE CASE NAME SAYS SO because v82 changes what a
    // hired coach COSTS (round 42 #51, ruled 17.09). Until this version the man's hourly figure was
    // stored nowhere and re-derived every week from her age band and her ranking; it is now the
    // LABOUR that was agreed at hire plus the court at today's price. Dropping `coachDeal` gives back
    // the v81 SHAPE and can never give back the v81 CAREER, because the money is different.
    //
    // ⚠⚠ AND THE BUILD PREDICTED AN IDENTITY HERE AND WAS WRONG BY ONE WEEK. The prediction: «156
    // weeks ends inside `coachAgeBand` 0 with no WTA rank, so the agreed labour equals the market's,
    // the ceiling leaves no room and no ask can fire». `ageAtWeek` returns WHOLE YEARS – 16 from week
    // 104, 17 at week 156 exactly – and this walk's final tick runs AT 156, which is also `3 x 52`.
    // So the last week is billed across an age-band step AND is an anniversary. The per-key diff
    // caught it before a constant was touched, which is the only reason it is a sentence here rather
    // than a re-freeze under a comment claiming a key append.
    //
    // ⭐ THE SELF-COACHED CELL IS THE CONTROL INSIDE THE CASE. It moves on `coachDeal` and
    // `schemaVersion` alone – two keys of 94 – because there is no coach and therefore no fee to fix,
    // and its value below is the VERBATIM v81 LIVE career – the `FROZEN.selfTravelling` this file
    // carried before the wave, measured on the neutralised tree rather than read off the page. If that
    // one cell ever stops reproducing while the other two move, something has reached a career with
    // nobody in the corner.
    // ⚠ «MEASURED RATHER THAN READ OFF THE PAGE» IS NOT A FLOURISH. A throw-away comparison script
    // claimed this cell had moved, and the block it had actually read was `PRE_V78`'s – `FROZEN` is
    // the one register in that file whose doc comment sits INSIDE the literal, so its cells are two
    // hundred lines below its declaration. The full note is in the dated block at the head of
    // tests/coachTravelEdgeFixtures.ts.
    //
    // ⚠ THE PER-KEY CONTROL is in the dated block at the head of tests/coachTravelEdgeFixtures.ts –
    // 7 keys of 93 on the two grinder cells, 6 on the two player cells, 2 on the self-coached one,
    // `rngMain` byte-identical on all five, and the frozen MAIN capture unmoved.
    expect(careerHashAtSchema(5, 0, 81), '25k · middle coach · grinder – the v81 SHAPE, a different career').toBe(PRE_V82.middleGrinder)
    expect(careerHashAtSchema(8, 0, 81), '120k · elite coach · grinder – the v81 SHAPE, a different career').toBe(PRE_V82.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 81), '8k · self-coached · player – no coach, so the VERBATIM v81 value').toBe(PRE_V82.selfTravelling)
  })

  it('⭐⭐⭐ v81: rolling the schema back to 80 – dropping `frame` – returns the v80 CAREER on all three', () => {
    // ⭐⭐ THE FIRST IDENTITY RUNG SINCE v78, AND THE CASE NAME SAYS SO because the two rungs under it
    // could not. v81 appends ONE key – `LifeBeatRecord.frame`, round 44 – and it appends it to a ROW
    // rather than to the world, so the peel is a nested one (`careerHashAtSchema`, the `preFrame`
    // block). Dropping it and rolling the number returns a serialisation a v80 build would accept.
    //
    // ⚠⚠ AND THE ROUND WAS NOT SMALL, WHICH IS WHY THE IDENTITY IS WORTH EXPLAINING RATHER THAN
    // CELEBRATING. Round 44 takes the small-talk catalogue from 8 situations to 51 – a real
    // behaviour change, the kind that re-anchored every rung at v79 and v80. It does not reach these
    // five careers because of a CALENDAR fact: **a frozen career is 156 weeks from its own start, so
    // the girl in it never leaves `school`**, and every one of the 43 new situations declares
    // `after-school`, `college` and `independent` with no `school` among them. Her pool did not grow
    // by one row.
    //
    // ⚠ SO IF THIS GOES RED BESIDE A GREEN FREEZE, THE FIRST THING TO ASK IS NOT «WHAT BROKE» BUT
    // «DID THE WALK GET LONGER». The day `FREEZE_WEEKS` reaches past school, or the day a corpus row
    // is given a `school` stage, this rung stops being an identity and the eighty-four under it
    // re-anchor with it – and that is correct rather than a regression.
    //
    // ⚠ THE PER-KEY CONTROL IS IN THE DATED BLOCK AT THE HEAD OF tests/coachTravelEdgeFixtures.ts –
    // 2 keys of 93/94 on all five cells (`lifeLog`, `schemaVersion`), `rngMain` byte-identical, and
    // the frozen MAIN capture unmoved.
    expect(careerHashAtSchema(5, 0, 80), '25k · middle coach · grinder – the verbatim v80 value').toBe(PRE_V81.middleGrinder)
    expect(careerHashAtSchema(8, 0, 80), '120k · elite coach · grinder – the verbatim v80 value').toBe(PRE_V81.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 80), '8k · self-coached · player – the verbatim v80 value').toBe(PRE_V81.selfTravelling)
  })

  it('⭐⭐⭐ v80: rolling the schema back to 79 – dropping `form` – returns the v79 SHAPE, and on no career the v79 CAREER', () => {
    // ⚠⚠ THE FIRST RUNG IN THIS LADDER WHOSE THREE CELLS ARE NOT THE PREVIOUS VERSION'S LIVE
    // CONSTANTS, and the case name says so rather than promising a byte-identity it cannot deliver on
    // any career at all. v80 appends ONE key – `world.form`, wave F1 – and it ships WITH ITS READER:
    // `composureEff = composure + form x K` at `MatchPlayer` build time. EVERY frozen career plays
    // matches and has matchless weeks, so every one of them stepped on court at a composure that
    // moved, and a peel that drops the key cannot undo the matches the remaining shape already
    // played. v79's `coachPairs` set the precedent on two of three careers; this version is the one
    // where it reaches all three.
    //
    // ⭐ SO WHAT THIS CASE ASSERTS IS THE SHAPE AND NOT THE HISTORY, which is still worth a rung:
    // `form` is the ONLY key v80 appended and it is the LAST key of `createWorld`'s literal, so
    // dropping it and rolling the number returns a serialisation a v79 build would accept, key order
    // and all. If this ever goes red beside a green freeze, a later wave appended a key it did not
    // declare or moved one out of last position.
    //
    // ⚠ THE PER-KEY CONTROL IS OVER `PRE_V80` IN tests/coachTravelEdgeFixtures.ts – 3 / 34 / 33 keys
    // of 94 on the three cells, `rngMain` byte-identical on all three, and the narrow cell (5/0) is
    // the coach's eye alone: one `info` row, no scoreline, no money.
    expect(careerHashAtSchema(5, 0, 79), '25k · middle coach · grinder – RE-ANCHORED, she plays').toBe(PRE_V80.middleGrinder)
    expect(careerHashAtSchema(8, 0, 79), '120k · elite coach · grinder – RE-ANCHORED, she plays').toBe(PRE_V80.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 79), '8k · self-coached · player – RE-ANCHORED, she plays').toBe(PRE_V80.selfTravelling)
  })

  it('⭐⭐⭐ v79: rolling the schema back to 78 – dropping `coachPairs` and `sparringTravels` – returns the v78 career ONLY where nobody was hired', () => {
    // ⚠⚠ THE ONE RUNG IN THIS LADDER THAT IS AN IDENTITY ON ONE CAREER AND A RE-ANCHORING ON THE
    // OTHER TWO, and the case name says so rather than promising a byte-identity it cannot deliver on
    // all three. v79 appends TWO keys to `createWorld`'s literal – `sparringTravels`, then
    // `coachPairs` – and the second of them ships WITH ITS READER, which is what makes this version
    // different from every rung below it. `accrueCoachPair` writes a row on every week a coach is
    // paid for and `coachFactor` takes the accrued level as a third argument, so a career that hires
    // anybody develops at a rate that moved (the chemistry wave C1,
    // `docs/specs/the-chemistry-2026-09.md`).
    //
    // ⭐⭐ SO READ THE THREE LINES BELOW AS TWO DIFFERENT CLAIMS. `selfTravelling` is the one career
    // in this file with NO COACH, and on her the peel is EXACT: her constant is the VERBATIM v78
    // value, character for character, because the per-key control says the whole of v79 on her is
    // `schemaVersion` plus two keys appearing at `{}` and `false` – one key of 90 moved and 89 held.
    // The two grinders both hire, so both are RE-ANCHORED to the new world: a peel that drops
    // `coachPairs` cannot undo a development rate the remaining shape has already spent 156 weeks
    // living at, and v70's `drawnFirstRounds` block set the precedent for exactly this – «not a
    // schema field, but a change to what a career IS».
    //
    // ⚠⚠ AND WHAT MOVED THEM IS THE CHEMISTRY ALONE, which the per-key control says and no aggregate
    // hash could: FOUR keys of 90 on each grinder – `skills`, `peakPhysical`, `events`,
    // `schemaVersion` – with `coachId`, `results` and `fundsCents` BYTE-IDENTICAL. Both keep the man
    // they always hired (`middle-1` and `elit-2`); only the rate he teaches her at moved. C1a also
    // asked for `style` to be drawn per career, which WOULD have moved `coachId` here – it was
    // measured out on the bench (a 4.7% coaching discount at every rung above budget) and handed back
    // to the owner rather than shipped, so this rung carries no trace of it.
    //
    // ⚠ WHAT THIS CASE IS STILL FOR, then, and it now says one thing the ladder never could: if
    // `selfTravelling` EVER goes red on this rung, something has reached a family that hired nobody.
    // And if either grinder goes red beside a red freeze, a later wave moved a career and not just a
    // schema.
    expect(careerHashAtSchema(5, 0, 78), '25k · middle coach · grinder – RE-ANCHORED, she hires').toBe(PRE_V79.middleGrinder)
    expect(careerHashAtSchema(8, 0, 78), '120k · elite coach · grinder – RE-ANCHORED, she hires').toBe(PRE_V79.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 78), '8k · self-coached · player – THE VERBATIM v78 VALUE').toBe(PRE_V79.selfTravelling)
  })

  it('⭐⭐⭐ v78: rolling the schema back to 77 – dropping the three world keys AND `entries` off every `assets` ROW – reproduces the v77 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE v78 BUNDLE DID TO A FROZEN CAREER, AS AN IDENTITY – the v77 case
    // directly below, repeated one version up. v78 appends THREE keys to `createWorld`'s literal
    // (`composureBonus`, `sparringHired`, `sparringRung`) and ONE field to the `OwnedAsset` ROW
    // (`entries`). Peel the three, MAP `assets` and rest each row, roll the number back, and the
    // ENTIRE serialisation returns byte for byte: `rngMain`, `results`, `events`, the wallet, the
    // body, `skills`, `potential`, all ninety-odd.
    //
    // ⭐⭐⭐ AND THIS IS THE FIRST RUNG IN THE WHOLE LADDER WHOSE NEW KEY SHIPS WITH A LIVE READER,
    // which changes what the case is worth and is worth saying out loud. v74, v75, v76 and v77 each
    // shipped a seat NOTHING IN THE TREE COULD WRITE, so their identities were inert by construction
    // and said so. `composureBonus` is read on every week of every career – `growWeek` asks
    // `composureCeilingOf` for composure's ceiling – so this case is a real behavioural claim: these
    // five careers never hire the psychologist (`walkFrozenCareer` ASSERTS `psychologistHired ===
    // false`), the bonus can only move while he works the `'coolhead'` focus, so the effective
    // ceiling is `potential.composure` to the bit and her build is untouched. The per-key control
    // over `PRE_V78` measured exactly that: `skills` is byte-identical on all five cells.
    //
    // ⚠ THE NESTED HALF OF THIS PEEL HAS NO WITNESS IN THIS FILE, unlike v77's. `assets` is `[]` on
    // all five careers – 156 weeks, she is 16.6, no bench policy buys a shop rung – so the map runs
    // zero times here. What witnesses it is the golden corpus (fourteen fixtures, 75 asset rows) and
    // the crafted world in tests/round42-v78-schema.test.ts. Named so nobody reads a green line here
    // as coverage of `entries`.
    //
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the bundle moved a career and not just a schema.
    expect(careerHashAtSchema(5, 0, 77), '25k · middle coach · grinder').toBe(PRE_V78.middleGrinder)
    expect(careerHashAtSchema(8, 0, 77), '120k · elite coach · grinder').toBe(PRE_V78.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 77), '8k · self-coached · player').toBe(PRE_V78.selfTravelling)
  })

  it('⭐⭐⭐ v77: rolling the schema back to 76 – dropping the world key AND the four fields v77 put on every `loveEpisodes` ROW – reproduces the v76 hashes byte for byte', () => {
    // ⚠⚠ THE WHOLE OF WHAT THE SPOTLIGHT, STEP 1 DID TO A FROZEN CAREER, AS AN IDENTITY – the v76
    // case directly below, repeated one version up, except that this one is NOT the same shape as its
    // predecessor and that is the point of it. v77 appends ONE key to `createWorld`'s literal
    // (`spotlightHabituation`) and FOUR fields to the `LoveEpisode` ROW (`publicWeek`, `publicWrong`,
    // `airedMetWeek`, `airedEndedWeek`). Peel the key, MAP THE LIST and rest each row, roll the number
    // back, and the ENTIRE serialisation returns byte for byte: `rngMain`, `results`, `events`, the
    // wallet, the body, `temperament`, the walls, all eighty-odd.
    //
    // ⭐⭐⭐ THIS IS THE PROTOCOL'S FIRST NESTED PEEL, AND `eliteGrinder` IS ITS ONLY WITNESS IN THE
    // WHOLE FILE. Measured 14.09: of the five cells this apparatus walks, four carry `loveEpisodes: []`
    // and exactly one carries a row – hers, from week 137, the attachment wave 3's hazard gives her.
    // So the line BELOW that matters most is the middle one: on the other two the nested half of the
    // peel maps an empty array and proves nothing at all, while hers proves the map restores each row's
    // six v74 fields in their original order. `JSON.stringify` key order is what the whole identity
    // rests on, at both levels, and object rest preserves it for everything it keeps.
    //
    // ⚠⚠ AND THE IDENTITY VALUES ARE A FACT ABOUT THE TREE, NOT ABOUT THESE CAREERS – v74's, v75's and
    // v76's caveat one rung further on. T1 ships five seats, the migration and NO READER AT ALL:
    // `sheIsNewsAt` and the exposure ledger are T2, the pressure T3, habituation T4, the leak that
    // could set `publicWeek` T6, the booth stamps T7. So this case does not yet say «a leak cannot
    // reach a 156-week career». It says the schema move is inert, which is all a schema move should
    // ever be. ⚠ And ruling D of 14.09 says the corpus could not answer the other question anyway:
    // peak `fameAt` here is 0.00 / 0.00 / 3.43 / 1.85 / 3.25 against a proposed news bar of 30, so
    // every wave-6 mechanic is unreachable in these careers by an order of magnitude.
    // ⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema.
    expect(careerHashAtSchema(5, 0, 76), '25k · middle coach · grinder').toBe(PRE_V77.middleGrinder)
    expect(careerHashAtSchema(8, 0, 76), '120k · elite coach · grinder – THE ONE ROW-CARRYING CELL').toBe(PRE_V77.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 76), '8k · self-coached · player').toBe(PRE_V77.selfTravelling)
  })

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
