// A-06 / T6.8 – `world/lifeBeat.ts` §3j MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the PREGNANCY's copy half,
// and a pure leaf by the review's matrix: §3j referenced nothing else in the old file and the only
// thing that read it was the dispatcher hub (`lifeBeatSaid`, `lifeBeatHeading`). Hub -> here, never
// back, which is what `tests/import-cycles.test.ts` judges and
// `tests/principles-a06-life-beat-direction.test.ts` states per module.
//
// ⚠ §14, the pregnancy's HAZARD half, is still in the hub: it calls back into it (`kidAgeNow`,
// `latchedEpisode`, `raiseLifeBeat`) and its twelve names reach `world.ts`, `world/phaseHerWeek.ts`
// and `world/snapshot.ts` through the hub's re-export – so the hub would both import it and be
// imported by it. «If both are true, it is not ready to move» (P4's rule); the measured arm is in the
// wave's report.
import type { Temperament } from '../../spirit'

// =================================================================================================
// 3j. `'expecting'` – THE WEEK SHE SAYS SHE IS HAVING A CHILD (the pregnancy, wave 8: T2).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's table).
// =================================================================================================
//
// SHE ANNOUNCES – §4a's law at the layer's biggest moment, and the pool is `ENGAGED_HER_LINE`'s
// shape rather than a new one: one cell per voice, no register axis, plus the dry
// card for a `strained`/`cold` home and one heading. There is no told-now/told-late split for the
// same reason the wedding has none: there is nothing here to be learned late.
//
// ⭐⭐⭐ v87 T2 – **AND THE CLAUSE THAT USED TO CARRY THAT SENTENCE IS NOW FALSE AND IS CORRECTED
// RATHER THAN QUIETLY DELETED.** It read «`rollPregnancy` raises the card the week the hazard
// lands», and since the hidden window it does not: the hazard writes the record, the window runs,
// and `landPregnancyAnnouncement` raises the card `windowWeeks` later. The CONCLUSION is unchanged
// and is now true for a better reason – there is no told-late variant because the parent cannot
// learn about the window at all. He is told once, on her week, and the weeks behind him are re-read
// by HIM rather than by the game (the design's §3).
//
// ⚠⚠ SO NO LINE BELOW MAY SAY SHE HAS KNOWN FOR A WHILE, which is a NEW rule this wave adds to the
// pool and the reason no cell was rewritten for the window. The narration is what the PARENT saw;
// he cannot see a window he was never inside, and a line that showed it would be the fallible-parent
// law broken at the layer's biggest moment. What she says inside the quotation marks is hers and
// could carry it – that is a wording decision, and it is the OWNER's (invariant 4), raised in the
// wave's report rather than taken here.
//
// ⚠⚠ RE-AIMED 26.09 (the owner's ruling 19 on B-08) – THE SHARED-SPAN RULE STOOD HERE AND HAS NOTHING
// LEFT TO GOVERN, because the presence axis is gone and the four roof cells with it. The announcement
// is raised by `landPregnancyAnnouncement`, which needs `world.pregnancy`, which needs a LATCHED
// episode – and `landWedding` writes that latch only from an ANSWERED `'engaged'` row, itself gated
// at 23. At 23 every stage is away (school is over by 18.92, `diaryLifeStageFor` sends everyone past
// 22 to `independent`, `college` is away), so the roof column could never be shown. §3m's own
// collapse of 23.09 is the precedent; the measurement is
// `tests/principles-b08-presence-reach.test.ts` §A and §D. ⚠ NOT ONE SURVIVING BYTE MOVED
// (invariant 4): the `away` cells are the values below, verbatim.
//
// ⚠⚠ NO NAME AND NO GENDER FOR THE ONE SHE MARRIED, the standing law of §3g and §3h: the episode
// holds a persisted name since wave 7, but which surfaces SPEAK it is the owner's call and is still
// open at T8's table. «We» is what she says, which is a fact the world holds.
//
// ⚠⚠ AND NO SEX FOR THE CHILD, WHICH IS A DIFFERENT LAW AND A HARDER ONE. The ROW is ruled girls-only
// (20.09, «пол нужен, но мальчиков у нас пока нет»), and T4 writes the literal `'girl'` – but the
// row does not exist yet on the week she says this, and neither does the knowledge. A line saying
// «дочь» here would be the birth's own fact borrowed nine months early, and the scaffold ruling's
// own point is that the day boys exist nothing already written may have to be unwritten.
//
// ⚠ NO DATE AND NO NUMBER IN ANY LINE (rule 4). `dueWeek` is on the record and the calendar is where
// a date belongs; a card that named the week would also be naming a constant T9 is going to retune.

/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, ONE CHANNEL. The voice bibles govern, `ENGAGED_HER_
 *  LINE`'s own reading of them: `sunny` says it evenly and names the feeling; `fiery` gives the
 *  verdict first, in absolutes; `quiet` says the practical surface and leaves herself out; `deep`
 *  says one true thing, late, stripped of its size, in full stops.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (26.09, ruling 19 on B-08 – `DIVORCED_HER_LINE`'s own sentence one wave back, and §3j's banner
 *  carries the chain): the latch this card stands behind cannot be written before 23, and every stage
 *  at 23 is away. The `Record<Temperament, string>` says so in the type, so a roof line cannot be
 *  written back in without the type refusing it first. Each cell below is the `away` frame that
 *  shipped, its v87 T3 clause included.
 *
 *  ⭐⭐⭐ v87 T3 – **THE QUOTED SPANS GAINED ONE CLAUSE EACH, AND THE NARRATION DID NOT MOVE A BYTE.**
 *  The design's §4 table crosses HOW LONG THE WINDOW LASTS with THE ANNOUNCEMENT, and T2 built the
 *  first column mechanically (openness draws the window). This is the second column reading the
 *  first: `sunny` has barely sat on it, `fiery` did not wait to be sure, `quiet` has known a while,
 *  `deep` longest of all and needed to know what she felt first.
 *
 *  ⚠⚠ IT IS **HER** LINE AND NOT THE NARRATION, AND THE SPLIT IS THE FALLIBLE-PARENT LAW RATHER
 *  THAN A PREFERENCE. The narration is what the PARENT saw, and he cannot see a window he was never
 *  inside – a line of his that said «she had known for weeks» would be the game telling him a thing
 *  nobody told him. She knows, so she may say it; every clause below is inside the quotation marks.
 *
 *  ⚠ NO NUMBER AND NO DATE IN ANY OF THEM (§3j's rule 4, which binds this edit as hard as it binds
 *  the rest of the pool): «a week» and «a month» are numbers, so none of the four says one. The
 *  window is a drawn constant T6 is going to measure, and a line that named it would be quoting a
 *  number the bench may move.
 *
 *  ⚠ THE OLD SPANS ARE LISTED VERBATIM IN THE WAVE'S REPORT beside these, which is the one thing a
 *  builder owes when a task asks for copy that already exists (invariant 4's own corollary – the
 *  owner reads the replacement beside what it replaced, and the strings stay his). */
export const EXPECTING_HER_LINE: Record<Temperament, string> = {
  sunny: 'She called on a Sunday, before anything else had been said. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both."',
  fiery: 'She rang between flights and led with it. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished."',
  quiet: 'She sent the next block of dates through, and this was underneath them. "We are having a baby. I have known a while. I will play a while yet, and then I will not."',
  deep: 'She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it."',
}

/** ⚠ ⚠ DRAFT – `strained` / `cold`: the dry card, not one word of hers in it. `ENGAGED_DRY`'s shape
 *  and doctrine: it states what the week HOLDS, and the distance is the whole content – by this rung
 *  the parent was never the person it was told to. */
export const EXPECTING_DRY = 'She is expecting a child. Nobody in this house was told first.'

/** ⚠ ⚠ DRAFT – the parent's frame over the card. ONE FRAME, KEYED ON NOTHING – `ENGAGED_HEADING`'s
 *  shape and its reason: the one fact of this card is the same fact at every distance and in every
 *  weather, and the bond band reaches the card through HER line (her own voice against the dry card)
 *  rather than through the frame, which would otherwise say the distance twice. ⚠ It recommends none
 *  of the three answers – what a parent can see is that she has decided, and which of the three
 *  things to say about it is his. */
export const EXPECTING_HEADING = 'A child is coming, and she has already decided'
