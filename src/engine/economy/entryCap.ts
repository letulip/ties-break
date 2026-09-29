// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/entryCap.md#the-entrycap-block

import type { TierId } from '../season/types'

// THE ITF ANNUAL ENTRY CAP (docs/research/ranking-points-by-tier.md §2 and §6) – Reality's
// real brake on "just grind cheap international events" is not the points table, it is a HARD
// ELIGIBILITY CAP: Appendix F of the 2026 ITF World Tennis Tour Juniors Regulations limits how
// many ITF junior events a player may enter per year, and the limit is tighter the younger she
// is.
//
// ⚠ entryCap: THOSE TWO USED TO BE THE SAME SENTENCE AND ARE NOT ANY MORE.
// → docs/notes/economy/entryCap.md#entrycap
export const entryCap = {
  // WHY ONLY THESE THREE, and please do not "fix" it later: `local` / `regional` / `national` are
  // OUR OWN INVENTION – no national result of any kind produces an ITF junior ranking point
  // (Reg 10's list of Ranking Tournaments is closed and contains only ITF grades), so the ITF has
  // nothing to say about how many of them a kid plays. Capping them would be inventing a rule and
  // attributing it to a source. The domestic ladder stays deliberately uncapped; it is also what
  // she is left with once the allowance is gone, which is the whole point of the change.
  cappedTiers: ['j30', 'j60', 'j300'] as readonly TierId[],
  // ITF Appendix F, verbatim: 16 -> 25, 15 -> 18, 14 -> 14, 13 -> 10, 17 and 18 unrestricted, 12
  // and under not eligible at all. `default` is the 17+ row; ages below 13 never reach this
  // table because `TIERS[tier].minAgeYears = 13` refuses them first (availabilityStatus asks the
  // age gate before the cap), which is also the honest place for "not eligible" to live.
  //
  // ⚠ entryCap.meritIncrease: AND SINCE §4.1 THE SAME IS NOW TRUE AT THE TOP
  // ⚠⚠ entryCap.meritIncrease: THE MERIT INCREASES SHIP AT P2 (16.08), AND THE ARGUMENT THAT KEPT THEM OUT IS RECORDED RATHER THAN…
  // ⚠ entryCap.meritIncrease: AND THE ONE PLACE THE CONVENTIONS DIFFER IS STATED, NOT SMOOTHED OVER.
  // → docs/notes/economy/entryCap.md#entrycapmeritincrease
  meritIncrease: {
    /** ITF Appendix F: +4 international events to a top-50 junior at 13, to a top-20 at 14 and 15.
     *
     *  ⚠ THE 13 ROW CANNOT FIRE IN THIS GAME AND IS HERE ANYWAY, exactly as the 14/15 PRO rows are
     *  (see `proPerYearByAge`'s own note). Her thirteenth year runs from week 0 to her birthday, so
     *  no season has wrapped yet and there is no year-end list to be on. The game does not invent a
     *  number where the calendar makes it unreachable, and the day a career opens earlier the row is
     *  already right. */
    juniorByAge: { 13: { throughRank: 50, extra: 4 }, 14: { throughRank: 20, extra: 4 }, 15: { throughRank: 20, extra: 4 } } as {
      [age: number]: { throughRank: number; extra: number }
    },
    /** WTA Pro Path: up to 4 extra professional events a year, earned by Grand Slam / WTA 1000
     *  DIRECT ACCEPTANCE or by year-end ITF junior top 5 – the same top-5 gate the Accelerator uses.
     *  It is an OR, and both arms are read off the year-end row for the reason `proMerit` explains:
     *  a limit that can fall mid-window would retro-invalidate an entry she was allowed to make. */
    proExtra: 4,
    proJuniorThroughRank: 5,
    /** ...and the professional arm, as the rungs whose acceptance list IS "direct acceptance to a
     *  major or a 1000". Read as tier ids, never as a copied number, so a phase that re-tunes those
     *  cuts moves this rule with them – the same discipline `mandatory.perEventTiers` is under. */
    proDirectTiers: ['slam', 'wta1000'] as readonly TierId[],
  },

  /** ⭐ THE SUB-CAP INSIDE THE FOURTEEN-YEAR-OLD'S EIGHT (WTA §X.A.2, quoted in
   *  docs/specs/acceptance-cuts-2026-08.md line 145: *"the WTA's sub-cap of three W75+ events
   *  inside a 14-year-old's eight – a quota, not a door"*).
   *
   *  ⚠⚠ entryCap.proSubCapByAge: IT CAN BIND AT THE SHIPPED CONSTANTS, AND IT MEASURES ZERO FOR A DIFFERENT REASON
   *  ⚠ entryCap.proSubCapByAge: THE SUPERSEDED SENTENCE, KEPT AS HISTORY THE WAY `entryCaps.ts` KEEPS ITS OWN.
   *  ⚠ entryCap.proSubCapByAge: The reason it survived a full gate: `npm run context:audit`'s age-grid guard reads DOCS, not code…
   *  → docs/notes/economy/entryCap.md#entrycapprosubcapbyage
   */
  proSubCapByAge: { 14: { fromTier: 'w75' as TierId, max: 3 } } as {
    [age: number]: { fromTier: TierId; max: number }
  },
  perYearByAge: { 13: 10, 14: 14, 15: 18, 16: 25, default: Number.MAX_SAFE_INTEGER } as {
    [age: number]: number
    default: number
  },

  // THE PRO AER, PARALLEL AND NEVER MERGED (W2-LADDER §5) – The WTA's own age-eligibility rule -
  // the Capriati rule, which exists for exactly our story - gets the PARALLEL structure to the
  // junior cap above: its own capped family, its own age table, its own persisted ledger
  // (`WorldState.proEntryWeeks`, schema v36).
  //
  // ⚠ entryCap.cappedProTiers: AND THE ACT-3 RUNGS JOIN IT (W3-ACT2).
  // ⚠ entryCap.cappedProTiers: THE PARENTHESIS HERE USED TO READ "every act-3 rung opens at 17" AND IT NO LONGER DOES
  // → docs/notes/economy/entryCap.md#entrycapcappedprotiers
  cappedProTiers: ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as readonly TierId[],
  // The spec's design table (§5): 16 -> 12, 17 -> 16, 18+ unlimited.
  //
  // ⚠⚠ entryCap.proPerYearByAge: 14 -> 8 AND 15 -> 10 ARE HERE SINCE THE ONE-CLOCK RULING
  // ⚠ entryCap.proPerYearByAge: AND 13 IS DELIBERATELY NOT A ROW, THOUGH THE RULEBOOK HAS ONE (0 events).
  // → docs/notes/economy/entryCap.md#entrycapproperyearbyage
  proPerYearByAge: { 14: 8, 15: 10, 16: 12, 17: 16, default: Number.MAX_SAFE_INTEGER } as {
    [age: number]: number
    default: number
  },
} as const
