// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/school.md#the-school-block

// SCHOOL, AND THE WEEK AFTER IT (W4-SCHOOL) - the summer block's own logic, made permanent –
// THE OWNER, from his own playtest, twice: «Школа должна когда-то закончиться, ей уже 21, а
// тренировки и прогресс должны удвоиться, соответственно, как мне кажется. Школа уже после 18
// вроде не должна быть.» and, a day later, «и школа с уроками в 22 года всё еще со мной».
//
// owner (school): «Конец школы – в конце учебного года.»
// ⚠ school: THE LOAD HALF IS THE SUMMER BLOCK'S ARGUMENT WITH A LONGER WINDOW, AND IT IS DELIBERATELY THE SAME NUMBER.
// owner (school): «с 2 тренировками в день»
// → docs/notes/economy/school.md#school
export const school = {
  /** The last grade of school. `gradeOf` returns null past it, which is what ENDS school; read
   *  live (not captured at module load) so the bench can sweep it - `tools/school-bench.ts` sets
   *  it to 99 to re-play the shipped game, where school never ended at all. */
  lastGrade: 12,
  /** The multiplier on a post-school week's development rate, through `growWeek`'s `loadFactor` -
   *  the same channel and the same value as `summerBlock.loadFactor`, for the reason above. */
  loadFactor: 1.4,
  /** ...and what the fuller week costs her, in condition points. ⚠ ZERO, AND THAT IS A MEASURED
   *  DECISION RATHER THAN AN OMISSION - see docs/specs/school-ends-2026-08.md §5. The summer
   *  block charges 3 for nine weeks; charging 3 for thirty-odd takes the off-season door from 73
   *  to the fifties and lifts injury prevalence, i.e. it makes leaving school a thing that hurts
   *  her, and «мы ни за что не наказываем» governs. The hours school took back were never on a
   *  court, so giving them back is not a heavier week than a summer one - it is more of them. */
  conditionCost: 0,
} as const
