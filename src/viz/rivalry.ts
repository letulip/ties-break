// ⭐ ROUND 53 · STEP 6 – THE BOOTH KNOWS WHO SHE HAS PLAYED (round 17 #22, priced 12.08, the owner's
// word 21.10: «добавим что недорого»).
//
// NINE LINES, EACH WITH ITS PREDICATE NEXT TO IT. A line here is `{ id, holds, say }`: `holds` is the
// FACT the sentence claims, written as a function of the head-to-head record, and the sentence is only
// reachable through it. `tests/rivalry-lines.test.ts` walks every line against a fixture that makes
// its predicate true and asserts the printed text carries the same numbers – a line whose words say
// more than its predicate (or a predicate that does not match its words) is the one failure that
// matters, because the record is the family's own history.
//
// ⚠ THIS FILE DECIDES NOTHING ABOUT THE WORLD. `HeadToHead` is counted in the engine
// (`engine/world/headToHead.ts`, «as far as the feed remembers») and arrives on `PendingView`; this
// file only chooses words. It draws nothing and reads no clock: the pre-match line is the FIRST line
// whose predicate holds (an ordered list), and the in-match remark is picked by the caller's own
// `variant` hash among the lines that hold – the commentary's existing deterministic stream.
//
// ⚠ NAMES STAY IN THE NOMINATIVE in the Russian rows: the packet carries generated surnames and
// first names that cannot be declined, so every RU sentence is built so that a name is the subject.
import { cp } from '../shared/i18n'
import type { HeadToHead } from '../shared/protocol/competition'
import { line, type Line } from './lines'

/** One sentence and the fact it claims. */
export interface RivalryLine {
  id: string
  /** the fact the sentence claims, as a function of the record */
  holds: (r: HeadToHead) => boolean
  say: (her: string, opp: string, r: HeadToHead) => Line
}

/** BEFORE THE FIRST BALL – ordered, the FIRST that holds is the one line. The last two are a pair that
 *  covers every record (`lastWon` is true or false), so a packet with `meetings ≥ 1` always gets a line. */
export const RIVALRY_PRE: readonly RivalryLine[] = [
  {
    id: 'pre-never-beaten',
    holds: (r) => r.wins === 0 && r.meetings >= 2,
    say: (her, opp, r) => {
      const n = r.meetings
      return line(cp`${her} and ${opp} have met ${n} times, and ${opp} has won every one.`)
    },
  },
  {
    id: 'pre-third-in-a-year',
    holds: (r) => r.recent === 2,
    say: (her, opp) => line(cp`This is the third time in a year that ${her} and ${opp} have met.`),
  },
  {
    id: 'pre-won-every',
    holds: (r) => r.wins === r.meetings && r.meetings >= 2,
    say: (her, opp, r) => {
      const n = r.meetings
      return line(cp`${her} and ${opp} have met ${n} times, and ${her} has won every one.`)
    },
  },
  {
    id: 'pre-lost-last',
    holds: (r) => !r.lastWon,
    say: (her, opp) => line(cp`${her} and ${opp} have played before, and ${opp} won the last one.`),
  },
  {
    id: 'pre-won-last',
    holds: (r) => r.lastWon,
    say: (her, opp) => line(cp`${her} and ${opp} have played before, and ${her} won the last one.`),
  },
]

/** DURING THE MATCH – every line whose predicate holds is a candidate; the caller picks one by its own
 *  hash, and says it at most once, at a changeover. */
export const RIVALRY_IN: readonly RivalryLine[] = [
  {
    id: 'in-three-sets',
    holds: (r) => r.lastSets === 3,
    say: (her, opp) => line(cp`The last time ${her} and ${opp} met, it went to three sets.`),
  },
  {
    id: 'in-straight-sets',
    holds: (r) => r.lastSets === 2,
    say: (her, opp) => line(cp`The last time ${her} and ${opp} met, it was settled in straight sets.`),
  },
  {
    id: 'in-split-record',
    holds: (r) => r.wins > 0 && r.losses > 0,
    say: (her, opp, r) => {
      const w = r.wins
      const l = r.losses
      return line(cp`Coming in, the head-to-head reads ${her} ${w}, ${opp} ${l}.`)
    },
  },
  {
    id: 'in-met-often',
    holds: (r) => r.recent >= 3,
    say: (her, opp, r) => {
      const n = r.recent
      return line(cp`${her} and ${opp} have already met ${n} times in the past year.`)
    },
  },
]

/** The one pre-match line, or null when they have never met. */
export function rivalryPreLine(her: string, opp: string, r: HeadToHead | null | undefined): { id: string; line: Line } | null {
  if (!r || r.meetings < 1) return null
  const hit = RIVALRY_PRE.find((l) => l.holds(r))
  return hit ? { id: hit.id, line: hit.say(her, opp, r) } : null
}

/** Every in-match remark the record licenses (possibly none). */
export function rivalryInLines(r: HeadToHead | null | undefined): readonly RivalryLine[] {
  if (!r || r.meetings < 1) return []
  return RIVALRY_IN.filter((l) => l.holds(r))
}
