// THE TWO DOORS' VIEW BUILDER, IN ONE PLACE (round 45, docs/specs/the-two-more-doors-2026-09.md).
//
// ⚠ WHY IT IS A HELPER AND NOT A LOCAL `function leavingView` IN EACH FILE. Two files pin these
// doors – `tests/two-doors.test.ts` (the rules, the voices, the sub-stream) and `tests/ending.test.ts`
// (the epilogue-line sweep, whose `details` record is TOTAL over `CareerEndingType` and therefore
// needs a real `peak` and a real `fall` detail off their real producer). A builder copied into both
// is a builder whose two copies drift, and a default that drifts is how a predicate quietly stops
// being tested at the value anybody thinks it is.
//
// ⚠ THE DEFAULTS ARE A CAREER THAT OPENS NEITHER DOOR – professional, ranked, no collapse, no top
// title – so every case below has to say out loud which gate it is opening. A builder whose defaults
// already pass is a builder that hides the test.
//
// ⚠⚠ THE ONE DELIBERATE EXCEPTION IS `ageYears`, AND IT IS AN EXCEPTION BECAUSE OF WHAT THE CLAUSE
// IS. `ENDINGS.peakMinAgeYears` (his 25+ ruling, 17.09) is a FLOOR: it can only ever refuse a season
// something else already opened, so it opens nothing on its own. A default UNDER it would make every
// peak case in every file silently a test about age – the rank clause, the title clause and the paid
// table would all read `false` for a reason none of them names. So the default is past the floor and
// the floor has its own cases, which is the only arrangement where each case tests what it says.
import type { LeavingView } from '../../src/engine/ending'

export function leavingView(over: Partial<LeavingView> = {}): LeavingView {
  return {
    temperament: 'deep',
    seasonIndex: 10,
    ageYears: 26,
    professional: true,
    endRank: 120,
    prevEndRank: 118,
    points: 400,
    prevPoints: 420,
    topTitleThisSeason: false,
    ...over,
  }
}
