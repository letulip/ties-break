// A-06 / T6.8 – `world/lifeBeat.ts` §3g MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the WEDDING's copy half: a
// pure leaf, which the review measured rather than guessed – §3g referenced nothing else in the old
// file, and the only thing that read it was the dispatcher hub (`lifeBeatSaid`, `lifeBeatHeading`).
// So the arrow runs hub -> here and never back, which is the direction `tests/import-cycles.test.ts`
// judges and `tests/principles-a06-life-beat-direction.test.ts` states per module.
//
// ⚠ THE THREE NAMES ARE `export`ed HERE AND NOT RE-EXPORTED BY THE HUB, on purpose: they were
// module-private before and nothing outside `lifeBeat.ts` ever read them, so the barrel's public
// surface is unchanged. `world.ts`'s import list did not move.
//
// ⚠ THE WEDDING'S OTHER HALF – §11, the hazard that decides whether an episode becomes a marriage –
// is STILL IN THE HUB, and that is P4's rule rather than an unfinished job: it calls back into the
// hub (`kidAgeNow`, `hasBeatFor`, `raiseLifeBeat`, `lifeLogOf`) AND its five names have to reach
// `world.ts` through the hub's re-export, so the hub would both import it and be imported by it.
// «If both are true it is not ready to move» – see the wave's report for the measured arm.
import type { Temperament } from '../../spirit'

// =================================================================================================
// 3g. `'engaged'` – THE WEEK SHE SAYS SHE IS GETTING MARRIED (the wedding, wave 7: T2).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// SHE ANNOUNCES – §4a's law at the layer's biggest ask so far: no parent menu opened her decision,
// and what the parent holds is a reaction. The pool is `ENDED_HER_LINE`'s shape one register
// smaller: one cell per voice (no register axis – the announcement is one scene, and unlike an
// ending it carries no told-now/told-late split, because `rollWedding` raises it the week she
// decides and there is nothing to hear about late), plus the dry card for a `strained`/`cold` home
// and one heading.
//
// ⚠⚠ RE-AIMED 26.09 (the owner's ruling 19 on B-08): «in both presences» above WAS TRUE OF THE POOL
// AND FALSE OF THE GAME, and the four roof cells have gone. `weddingEligible` refuses below
// `ECONOMY.wedding.ageGate` (23) and no career can be under a roof at 23 – school is over by 18.92
// for every girl the game can generate and `diaryLifeStageFor` sends everyone past 22 to
// `independent`, with `college` away too – so the roof column was four lines the owner had read and
// no player could reach. `DIVORCED_HER_LINE`'s collapse of 23.09 is the precedent, argued the same
// way; the measurement is `tests/principles-b08-presence-reach.test.ts` §A, which sweeps every
// profile the clamp can hold against every week a career can reach. ⚠ NOT ONE SURVIVING BYTE MOVED
// (invariant 4): the `away` cells are the values below, verbatim.
//
// ⚠ NO NAME AND NO GENDER in any line – the name is WRITTEN at this beat (T3's `partnerNameFor`) but
// which surfaces SPEAK it is a later task's question, and a pool that jumped ahead of that ruling
// would be taking a wording decision that is his.

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, ONE CHANNEL. The voice bibles govern: `sunny` says
 *  it evenly and names the feeling; `fiery` gives the verdict first, at speed, in absolutes;
 *  `quiet` says the practical surface and leaves herself out; `deep` says one true thing, late,
 *  stripped of its size, in full stops.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (26.09, ruling 19 on B-08 – `DIVORCED_HER_LINE`'s own sentence one wave back). An engagement
 *  under a roof cannot happen: the gate is 23 and every stage at 23 is away. The
 *  `Record<Temperament, string>` says so in the type, so a roof line cannot be written back in
 *  without the type refusing it first. Each cell below is the `away` frame that shipped. */
export const ENGAGED_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called before we had even asked about the week. "We are getting married. I wanted you to hear it from me first."',
  fiery: 'She rang, and led with it. "We are getting married. Yes, we are sure. No, we are not waiting."',
  quiet: 'She sent the season\'s dates through, and this was at the top of the message. "We are getting married. In a couple of months, probably."',
  deep: 'She let the call run almost to the end and said it before goodbye. "We are getting married. I have thought about it. It is right."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENDED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this
 *  rung the parent was never the person it was told to. */
export const ENGAGED_DRY = 'She is getting married. The news reached this house second-hand.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `COUNSEL_HEADING`'s
 *  shape rather than `MET_HEADING`'s ladder, because the one fact of this card is the same fact at
 *  every distance and in every weather: she has decided, and the deciding is hers. The bond band
 *  reaches the card through HER line (own voice against the dry card), never through the frame; a
 *  heading that read the band would say the distance twice. ⚠ It recommends none of the three
 *  answers – «she has made up her mind» is what the parent can see, and which of the three things
 *  to say about it is his. */
export const ENGAGED_HEADING = 'A wedding is coming, and she has made up her mind'
