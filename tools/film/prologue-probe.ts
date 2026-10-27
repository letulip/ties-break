// Read the REAL prologue tables and the REAL run helpers, and walk the owner's two paths through
// them. Nothing here decides anything: every id, label, note and derived reading below is whatever
// the shipped modules answer. If a label in the brief does not exist, this prints so and the film
// is not shot against a guess.
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE, TOURNAMENT_ANSWER, entryCostCents, DECISION_AGES, CARD_AGES } from '../../src/prologue/cards'
import { EMPTY_RUN, withOrigin, withPick, withEntry, cardFor, askOn, readTwelfth, spentCents, warmthAt, moodAt, chosenYears, isComplete, enteredAges, yearsSoFar, type PrologueRun } from '../../src/prologue/run'
import { localOpensAt } from '../../src/prologue/pool'
import { ECONOMY } from '../../src/engine/economy'

const money = (c: number) => `$${(c / 100).toFixed(2)}`

console.log('CARD_AGES', CARD_AGES.join(' '), '| DECISION_AGES', DECISION_AGES.join(' '), '| entry', money(entryCostCents()))
console.log('startingFundsCents', JSON.stringify(ECONOMY.startingFundsCents))

for (const c of PROLOGUE_CARDS) {
  console.log(`\n──── age ${c.age} ── ${c.kicker} ── "${c.title}"`)
  console.log('   lede:', c.lede)
  if (c.question) console.log('   question:', c.question)
  console.log('   her.cool :', c.her.cool)
  console.log('   her.warm :', c.her.warm)
  console.log('   coach.cool:', c.coach.cool)
  console.log('   coach.warm:', c.coach.warm)
  console.log('   continue :', c.continueLabel, c.sameAsLastYear ? '(sameAsLastYear)' : '')
  for (const o of c.origins ?? []) console.log(`   ORIGIN  ${o.id.padEnd(16)} "${o.label}" — ${o.note} (${money(o.costCents)})`)
  for (const o of c.options ?? []) console.log(`   OPTION  ${o.id.padEnd(16)} "${o.label}" — ${o.note} (${money(o.costCents)}) share=${o.share} teach=${o.teaching} focus=${o.focus}`)
  if (c.tournament) {
    console.log('   ASK lede:', c.tournament.lede)
    console.log(`     enter  "${c.tournament.enterLabel}" — ${c.tournament.enterNote}`)
    console.log(`     decline"${c.tournament.declineLabel}" — ${c.tournament.declineNote}`)
  }
}
console.log(`\n──── TWELFTH_WANTS_MORE (derived arm) ── "${TWELFTH_WANTS_MORE.title}"`)
console.log('   lede:', TWELFTH_WANTS_MORE.lede)
console.log('   her.cool :', TWELFTH_WANTS_MORE.her.cool, '\n   her.warm :', TWELFTH_WANTS_MORE.her.warm)
for (const o of TWELFTH_WANTS_MORE.options ?? []) console.log(`   OPTION  ${o.id.padEnd(16)} "${o.label}" — ${o.note} (${money(o.costCents)}) share=${o.share} teach=${o.teaching} focus=${o.focus}`)

// ── the two paths, by the LABELS the owner named ──────────────────────────────────────────────
const byLabel = (age: number, run: PrologueRun, label: string) => {
  const card = cardFor(age, run)
  const hit = (card.options ?? card.origins ?? []).find((o) => o.label === label)
  if (!hit) throw new Error(`age ${age}: no option labelled "${label}" — have: ${(card.options ?? card.origins ?? []).map((o) => o.label).join(' | ')}`)
  return hit.id
}

function walk(name: string, picks: Record<number, string>, entries: Record<number, 'enter' | 'decline'>, originLabel: string) {
  let run = EMPTY_RUN
  run = withOrigin(run, byLabel(5, run, originLabel) as any)
  for (const age of [8, 9, 10, 11, 12]) run = withPick(run, age, byLabel(age, run, picks[age]))
  for (const [age, a] of Object.entries(entries)) run = withEntry(run, Number(age), TOURNAMENT_ANSWER[a])
  const read = readTwelfth(run)
  console.log(`\n════════ ${name} ════════`)
  console.log('  origin', run.origin, '| complete', isComplete(run))
  console.log('  readTwelfth:', read.reading, `(oneToOne=${read.oneToOne} tournaments=${read.tournaments} light=${read.light})`)
  console.log('  reason:', read.reason)
  console.log('  spentCents', money(spentCents(run)))
  console.log('  enteredAges', enteredAges(run).join(' ') || '(none)')
  const years = yearsSoFar(run)
  for (const age of CARD_AGES) {
    const ask = askOn(age, run)
    console.log(`   age ${String(age).padEnd(2)} warmth=${warmthAt(age, run).padEnd(4)} mood=${String(moodAt(age, run)).padEnd(7)} opens=${localOpensAt(years, age, enteredAges(run))}${ask ? ' [ask]' : ''} card="${cardFor(age, run).title}"`)
  }
  console.log('  chosenYears', JSON.stringify(chosenYears(run).map((y) => ({ a: y.age, p: +y.practice.toFixed(3), t: y.teaching, f: y.focus }))))
  return run
}

const A = walk('PATH A — keep the childhood smaller',
  { 8: 'Stay at the municipal court', 9: 'Keep her in the group', 10: 'Not this year', 11: 'Ordinary school', 12: 'Let her stop for a season' },
  { 11: 'decline', 12: 'decline', 13: 'decline' }, 'A city, and the bills are paid.')
const B = walk('PATH B — build the years around tennis',
  { 8: 'The club across town', 9: 'Buy the hour, one to one', 10: 'Enter her', 11: 'The sports school', 12: 'Give her the year she is asking for' },
  { 11: 'enter', 12: 'enter', 13: 'enter' }, 'A city, and the bills are paid.')
void A; void B
