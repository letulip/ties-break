// WHY THE TWO GIRLS LOOK ALIKE AT THE HANDOVER, AND WHETHER ANY LEGAL SETUP LOOKS DIFFERENT.
//
// The owner's two paths are already the extremes the table allows: A takes the cheapest option on
// every card and enters nothing, B takes the dearest on every card and enters every weekend. So the
// spread is not a choice problem – it is `childhoodArrival`, which adds `walk.level + walk.shape[k]`
// to her born skills and then CLAMPS the result back into `STARTING_SKILL_BAND`, the same band a
// fresh fourteen-year-old is drawn from. Two things follow and this sweep measures both:
//
//   1. the gap is bounded by CHILDHOOD.swingPoints, whatever the seed;
//   2. where in the band her born skills sit decides how much of that gap SURVIVES the clamp, and
//      whether the two arrivals land on opposite sides of the coach's own HANDOVER_BASE_CUTS.
//
// The film's seed is whatever `Math.random` is pinned to, because both of the app's own generators
// read it (`freshSeed()` for the prologue, the store's empty-seed fill for the career). So the sweep
// is over that one constant, and the rule for choosing it is printed with the table: no clamped
// axis, and the two arrivals on opposite sides of the cut.
import { TOURNAMENT_ANSWER } from '../../src/prologue/cards'
import { EMPTY_RUN, withOrigin, withPick, withEntry, cardFor, chosenYears, spentCents, enteredAges, yearsSoFar, yearsLivedBy, type PrologueRun } from '../../src/prologue/run'
import { localOpensAt, playLocalOpen, outcomeOf, prologueEntrant } from '../../src/prologue/pool'
import { createWorld, KID_ID } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { settleIdentity, OPENING_IDENTITY } from '../../src/prologue/identity'
import { HANDOVER_BASE_CUTS } from '../../src/engine/world/coachMarket'
import { STARTING_SKILL_BAND, SKILL_KEYS } from '../../src/engine/development'
import { PROLOGUE_CARDS } from '../../src/prologue/cards'

const byLabel = (age: number, run: PrologueRun, label: string) =>
  (cardFor(age, run).options ?? cardFor(age, run).origins ?? []).find((o) => o.label === label)!.id
function build(picks: Record<number, string>, ans: 'enter' | 'decline') {
  let run = withOrigin(EMPTY_RUN, byLabel(5, EMPTY_RUN, 'A city, and the bills are paid.') as any)
  for (const age of [8, 9, 10, 11, 12]) run = withPick(run, age, byLabel(age, run, picks[age]))
  for (const age of [11, 12, 13]) run = withEntry(run, age, TOURNAMENT_ANSWER[ans])
  return run
}
const A = build({ 8: 'Stay at the municipal court', 9: 'Keep her in the group', 10: 'Not this year', 11: 'Ordinary school', 12: 'Let her stop for a season' }, 'decline')
const B = build({ 8: 'The club across town', 9: 'Buy the hour, one to one', 10: 'Enter her', 11: 'The sports school', 12: 'Give her the year she is asking for' }, 'enter')

const named = settleIdentity(OPENING_IDENTITY)
const profileFor = (run: PrologueRun) => ({ ...DEFAULT_PROFILE, ...named, background: run.origin! })
const avg = (o: any) => SKILL_KEYS.reduce((n, k) => n + o[k], 0) / SKILL_KEYS.length
const bandOf = (level: number) => (level < HANDOVER_BASE_CUTS.below ? 'behind' : level > HANDOVER_BASE_CUTS.ahead ? 'ahead' : 'level')

console.log('HANDOVER_BASE_CUTS', JSON.stringify(HANDOVER_BASE_CUTS), '| band', JSON.stringify(STARTING_SKILL_BAND))
console.log('\n  v      prologue-seed   career    A avg   B avg   gap   A/B band        clamped(B)   B opens')

const rows: any[] = []
for (let i = 1; i <= 99; i++) {
  const v = i / 100
  const prologueSeed = `prologue-${(v.toString(36).slice(2) + '0000').slice(0, 8)}`
  const careerSeed = `${named.kidName.toLowerCase()}-${(v.toString(36).slice(2) + '0000').slice(0, 4)}`
  const wa: any = createWorld(careerSeed, profileFor(A), 'sw-a', { years: chosenYears(A), spentCents: spentCents(A) })
  const wb: any = createWorld(careerSeed, profileFor(B), 'sw-b', { years: chosenYears(B), spentCents: spentCents(B) })
  const clamped = SKILL_KEYS.filter((k) => wb.skills[k] >= STARTING_SKILL_BAND[k][1] - 0.001)
  const la = avg(wa.skills)
  const lb = avg(wb.skills)
  const full = `${named.kidName} ${named.kidLastName}`
  const opens: string[] = []
  for (const card of PROLOGUE_CARDS) {
    const n = localOpensAt(yearsSoFar(B), card.age, enteredAges(B))
    for (let idx = 0; idx < n; idx++) {
      const kid = prologueEntrant(prologueSeed, KID_ID, full, card.age, yearsLivedBy(B, card.age))
      opens.push(`${card.age}:${outcomeOf(playLocalOpen(prologueSeed, kid, card.age, idx))}`)
    }
  }
  const row = { v, prologueSeed, careerSeed, la, lb, gap: lb - la, ba: bandOf(la), bb: bandOf(lb), clamped, opens }
  rows.push(row)
  if (process.env.QUIET) continue
  console.log(
    `  ${v.toFixed(4)} ${prologueSeed.padEnd(17)} ${careerSeed.padEnd(9)} ${la.toFixed(2).padStart(6)} ${lb.toFixed(2).padStart(7)} ${row.gap.toFixed(2).padStart(6)}   ${(row.ba + '/' + row.bb).padEnd(14)} ${(clamped.join(',') || '-').padEnd(12)} ${opens.join(' ')}`,
  )
}

const clean = rows.filter((r) => r.clamped.length === 0)
const split = rows.filter((r) => r.ba !== r.bb)
console.log(`\n  ${rows.length} constants swept | ${clean.length} with no clamped axis | ${split.length} where the coach's base band DIFFERS between the paths`)
console.log('  gap range', Math.min(...rows.map((r) => r.gap)).toFixed(2), '..', Math.max(...rows.map((r) => r.gap)).toFixed(2))
const both = rows.filter((r) => r.clamped.length === 0 && r.ba !== r.bb)
console.log('  no clamp AND different band:', both.length)
const pick = both[0]
console.log('\n  ⭐ THE RULE: the first constant in the sweep that clamps no axis (so the whole swing survives)')
console.log('     and lands the two arrivals on opposite sides of HANDOVER_BASE_CUTS (so the coach says two')
console.log('     different sentences). Tournament results are NOT a criterion and are whatever it gives.')
console.log('  ⭐ PICKED v =', pick.v, '| prologue seed', pick.prologueSeed, '| career seed', pick.careerSeed)
console.log('     A', pick.la.toFixed(2), pick.ba, '-> B', pick.lb.toFixed(2), pick.bb, '| gap', pick.gap.toFixed(2), '| opens', pick.opens.join(' '))
