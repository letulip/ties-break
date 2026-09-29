---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The school block

The comment essays that stood above the `school` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `school`

```ts
  // =================================================================================================
  // SCHOOL, AND THE WEEK AFTER IT (W4-SCHOOL) - the summer block's own logic, made permanent
  // =================================================================================================
  //
  // THE OWNER, from his own playtest, twice: «Школа должна когда-то закончиться, ей уже 21, а
  // тренировки и прогресс должны удвоиться, соответственно, как мне кажется. Школа уже после 18 вроде
  // не должна быть.» and, a day later, «и школа с уроками в 22 года всё еще со мной». School had no
  // end at all: `isExamWeek` was a pure function of the season week, so a twenty-two-year-old
  // professional still sat two exam papers every June and her calendar still drew a lesson block at
  // eight in the morning.
  //
  // AND WHEN IT ENDS IS HIS SECOND RULING: «Конец школы – в конце учебного года.» Not her birthday -
  // the school year containing it, which is what happens to a person and which the calendar already
  // has a boundary for (`SCHOOL_YEAR_TURNS_AT`, 1 September). `kidLife.ts`'s `gradeOf` has modelled
  // exactly that since the School tile shipped, and it already returns null past the last grade.
  // Nothing else in the game read it. Now everything does. (What the tile SAYS when it returns null
  // stopped being "School finished" in round 23 #6 – see `lifeStageTile`; the arithmetic is the same.)
  //
  // ⚠ THE LOAD HALF IS THE SUMMER BLOCK'S ARGUMENT WITH A LONGER WINDOW, AND IT IS DELIBERATELY THE
  // SAME NUMBER. The owner's summer ruling was about a week «с 2 тренировками в день» because there
  // is no school in it; a week in October when she is nineteen is the same week for the same reason.
  // One school-free week may not be worth 1.4 in July and 2.0 in October, so `loadFactor` here IS
  // `summerBlock.loadFactor` - a separate knob only because the WINDOW is thirty-odd weeks a year
  // instead of nine, and a knob whose window changes by a factor of four has to be swept on its own.
  // See docs/specs/school-ends-2026-08.md for predicted vs measured, and for why "doubles" did not
  // survive the bench.
```
