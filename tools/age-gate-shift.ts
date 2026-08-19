// WHAT THE AGE CLOCK'S SHAPE COSTS THE GATES – the measurement behind the 18.08 date-clock fix.
//
// Every age gate in this game has the form `age >= N` (tier minAgeYears, the fork at 19, the school
// end, the academy band, both entry allowances). So the complete blast radius of a change to the age
// clock is one table: for each birth date and each age N, the FIRST WEEK the clock reaches N. Any
// gate keyed on N moves by exactly the shift in that cell, whatever the gate is and wherever it lives.
//
//     npx vite-node tools/age-gate-shift.ts > before.txt   # then apply the change and re-run
import { kidAgeYears } from '../src/engine/world/age'
import { daysInBirthMonth } from '../src/shared/dates'

const LAST_WEEK = 728
const AGES = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= daysInBirthMonth(m); d++) {
    const cells: string[] = []
    for (const age of AGES) {
      let first = -1
      for (let w = 0; w <= LAST_WEEK; w++) {
        if (kidAgeYears(w, m, d) >= age) { first = w; break }
      }
      cells.push(String(first))
    }
    console.log(`${m}/${d} ${cells.join(' ')}`)
  }
}
