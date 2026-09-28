// A-06 / T6.8 – `world/lifeBeat.ts` §3l MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the BEREAVEMENT's copy half,
// and a pure leaf by the review's matrix: §3l referenced nothing else in the old file and the only
// thing that read it was the dispatcher hub. Hub -> here, never back.
//
// ⚠ §16, the death's HAZARD half – the world's dice rather than her personality's – is still in the
// hub: it calls back into it (`kidAgeNow`, `raiseLifeBeat`) and its three names reach `world.ts` and
// `world/phaseHerWeek.ts` through the hub's re-export, so the hub would both import it and be
// imported by it. «If both are true, it is not ready to move» (P4's rule).
//
// ⚠ AND THE SUB-STREAM KEY STAYED WITH §16, WHICH IS WHERE IT IS DRAWN: `life:loss`, deliberately not
// `life:bereavement` (§3l's own note, and T3.9's inventory is the pin). Nothing in this file draws.
import type { Temperament } from '../../spirit'

// =================================================================================================
// 3l. `'bereavement'` – A DEATH IN THE FAMILY (the weight, wave 11: T5).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4).
// =================================================================================================
//
// ⚠⚠ **THE DECEASED IS UNNAMED, IN MECHANICS AND IN COPY** – RULED 22.09 (question 4), and the
// reason is a collision this game already has: the fridge pool names a grandmother in lines nothing
// licenses, so shipping a NAMED death against an unlicensed «Grandma called» scrap is exactly the
// contradiction the honesty law exists to prevent. «There has been a death in the family» is the
// whole of what any line here may say, and licensing named kin off live-kin facts is its own later
// work. ⚠ That also means no relation word: not a grandmother, not an aunt, not a cousin.
//
// ⚠⚠ OPENNESS OWNS THE EXPRESSION AND INTENSITY OWNS NOTHING HERE – his 11.09 ruling, read exactly:
// «INTENSITY owns depth AND duration … OPENNESS owns expression (private grieves quietly – the feed
// and diary nearly silent, the face and the funeral frame carrying it; open speaks)». So the DEPTH
// is `ECONOMY.spirit.shock.bereavement` seen through `perturbationScale`, which is the intensity
// axis and lives in `engine/spirit.ts`; what this pool carries is how much she SAYS, and the private
// voices say least. Nothing in these words is a second pricing of anything.
//
// ⚠⚠ RE-AIMED 26.09 (the owner's ruling 19 on B-08) – THE SHARED-SPAN RULE STOOD HERE TOO AND HAS
// NOTHING LEFT TO GOVERN: the presence axis is gone and the four roof cells with it.
// `bereavementEligible` refuses below `ECONOMY.weight.bereavement.fromAgeYears` (23), and at 23 every
// stage is away – school is over by 18.92 for every girl the game can generate, `diaryLifeStageFor`
// sends everyone past 22 to `independent`, and `college` is away as well – so the roof column was
// four lines nobody could be shown. §3m's own collapse of 23.09 is the precedent, argued the same
// way; the measurement is `tests/principles-b08-presence-reach.test.ts` §A and §D. ⚠ NOT ONE
// SURVIVING BYTE MOVED (invariant 4): the `away` cells are the values below, verbatim.
//
// ⚠ NO DATE AND NO NUMBER IN ANY LINE (rule 4). The week is on the world and the calendar is where a
// date belongs; a line that named one would also be naming a constant T6 is going to measure.

/** ⚠ ⚠ DRAFT – WHAT SHE SAYS, BY VOICE, ONE CHANNEL. The voice bibles govern: `sunny` says it
 *  plainly and wants him near; `fiery` says it loudly and then will not sit with it; `quiet` says
 *  the practical surface and leaves herself out; `deep` says the one fact and nothing else at all.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (26.09, ruling 19 on B-08 – `DIVORCED_HER_LINE`'s own sentence one wave back): the rung nothing
 *  fires below is 23, and every stage at 23 is away. The `Record<Temperament, string>` says so in the
 *  type, so a roof line cannot be written back in without the type refusing it first. Each cell below
 *  is the `away` frame that shipped. ⚠ §4's «private grieves almost silently» is untouched by this:
 *  openness reaches the card through the four voice cells themselves, never through the axis removed. */
export const BEREAVEMENT_HER_LINE: Record<Temperament, string> = {
  sunny: 'She rang in the evening, before anything else had been said. "There has been a death in the family. I would rather you heard it from me."',
  fiery: 'She rang and led with it, and was off the phone not long after. "There has been a death in the family. I am not going to be much use this week."',
  quiet: 'She sent the week\'s dates through, and this was underneath them. "There has been a death in the family. There are arrangements to make."',
  deep: 'The call was mostly quiet. She said it once, near the end of it. "There has been a death in the family."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `EXPECTING_DRY`'s
 *  shape and doctrine: it states what the week HOLDS, and the distance is the whole content. */
export const BEREAVEMENT_DRY = 'There has been a death in her family. The house heard it from somebody else.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `EXPECTING_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line rather than through the frame.
 *  ⚠ It recommends nothing and asks nothing: what a parent can see is that it has happened. */
export const BEREAVEMENT_HEADING = 'There has been a death in the family'
