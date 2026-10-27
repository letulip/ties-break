// WHY THE TWO GIRLS LOOK ALIKE AT THE HANDOVER, AND WHICH LEGAL SETUP LOOKS THE LEAST ALIKE.
//
// The owner's two paths are already the extremes the table allows: A takes the cheapest option on
// every card and enters nothing, B takes the dearest on every card and enters every weekend. So the
// spread is not a choice problem – it is `childhoodArrival`, which adds `walk.level + walk.shape[k]`
// to her born skills and then CLAMPS the result back into `STARTING_SKILL_BAND`, the same band a
// fresh fourteen-year-old is drawn from. Three things follow and this sweep measures all three:
//
//   1. the gap is bounded by CHILDHOOD.swingPoints, whatever the seed;
//   2. ⭐ WHERE NO AXIS CLAMPS THE GAP IS THE SAME NUMBER FOR EVERY SEED – `arrival = born + level +
//      shape`, so the difference between the two paths cancels `born` entirely. The seed cannot
//      widen the gap. All it can do is lose some of it to the clamp;
//   3. ...and decide WHERE IN THE BAND the pair sits, which is what actually changes the screen:
//      the coach's base sentence, his rung, and her play style are all thresholds on that position.
//
// So the search is not for a bigger gap – there isn't one – but for the constant that makes the
// MOST OF THE HANDOVER DIFFER. The film's seed is whatever `Math.random` is pinned to, because both
// of the app's own generators read it (`freshSeed()` for the prologue, the store's empty-seed fill
// for the career), so the sweep is over that one constant.
//
// ⚠ TOURNAMENT OUTCOMES ARE NOT A CRITERION. The brief: «never search for or reroll a more
// convenient tournament result». They are computed here and printed AFTER the pick, so the table
// shows what the chosen constant gave rather than what was chosen for.
import { TOURNAMENT_ANSWER } from '../../src/prologue/cards'
import { EMPTY_RUN, withOrigin, withPick, withEntry, cardFor, chosenYears, spentCents, enteredAges, yearsSoFar, yearsLivedBy, type PrologueRun } from '../../src/prologue/run'
import { localOpensAt, playLocalOpen, outcomeOf, prologueEntrant } from '../../src/prologue/pool'
import { createWorld, KID_ID } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { settleIdentity, OPENING_IDENTITY } from '../../src/prologue/identity'
import { coachBaseReadFor } from '../../src/prologue/handover'
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
const SPAN = Number(process.env.SPAN || 999)

// ⭐⭐ THE RULE, WRITTEN DOWN BEFORE THE TABLE IS READ. Keep the constants where NO axis clamps on
// EITHER path – top or bottom – so the whole of the swing reaches the screen. Of those, keep the
// ones that put the two arrivals in different `HANDOVER_BASE_CUTS` bands, because that is the one
// difference the coach says out loud. Then take the constant that makes the MOST of the handover
// differ – base band, coach's base sentence, coach rung, play style – tie-broken by the widest
// arrival gap and then by the lowest constant. The tournament column is printed but never read.
type Row = ReturnType<typeof measure>
function measure(v: number) {
  const prologueSeed = `prologue-${(v.toString(36).slice(2) + '0000').slice(0, 8)}`
  const careerSeed = `${named.kidName.toLowerCase()}-${(v.toString(36).slice(2) + '0000').slice(0, 4)}`
  const wa: any = createWorld(careerSeed, profileFor(A), 'sw-a', { years: chosenYears(A), spentCents: spentCents(A) })
  const wb: any = createWorld(careerSeed, profileFor(B), 'sw-b', { years: chosenYears(B), spentCents: spentCents(B) })
  const sa: any = toSnapshot(wa)
  const sb: any = toSnapshot(wb)
  const clamped = SKILL_KEYS.filter(
    (k) =>
      wb.skills[k] >= STARTING_SKILL_BAND[k][1] - 0.001 ||
      wa.skills[k] <= STARTING_SKILL_BAND[k][0] + 0.001 ||
      wa.skills[k] >= STARTING_SKILL_BAND[k][1] - 0.001 ||
      wb.skills[k] <= STARTING_SKILL_BAND[k][0] + 0.001,
  )
  const la = avg(wa.skills)
  const lb = avg(wb.skills)
  const ba = bandOf(la)
  const bb = bandOf(lb)
  const differs = {
    baseBand: sa.handoverBaseBand !== sb.handoverBaseBand,
    coachLine: coachBaseReadFor(sa.handoverBaseBand, sa.seed) !== coachBaseReadFor(sb.handoverBaseBand, sb.seed),
    rung: (sa.profile?.coachTier ?? '') !== (sb.profile?.coachTier ?? ''),
    style: (sa.profile?.playStyle ?? '') !== (sb.profile?.playStyle ?? ''),
    roomBand: sa.handoverBand !== sb.handoverBand,
  }
  const score = Object.values(differs).filter(Boolean).length
  return {
    v, prologueSeed, careerSeed, la, lb, gap: lb - la, ba, bb, clamped, differs, score,
    rungA: sa.profile?.coachTier ?? '?', rungB: sb.profile?.coachTier ?? '?',
    styleA: sa.profile?.playStyle ?? '?', styleB: sb.profile?.playStyle ?? '?',
    perAxis: SKILL_KEYS.map((k) => ({ k, a: wa.skills[k], b: wb.skills[k], d: wb.skills[k] - wa.skills[k] })),
  }
}
function opensOf(prologueSeed: string) {
  const full = `${named.kidName} ${named.kidLastName}`
  const out: string[] = []
  for (const card of PROLOGUE_CARDS) {
    const n = localOpensAt(yearsSoFar(B), card.age, enteredAges(B))
    for (let idx = 0; idx < n; idx++) {
      const kid = prologueEntrant(prologueSeed, KID_ID, full, card.age, yearsLivedBy(B, card.age))
      out.push(`${card.age}:${outcomeOf(playLocalOpen(prologueSeed, kid, card.age, idx))}`)
    }
  }
  return out
}

console.log('HANDOVER_BASE_CUTS', JSON.stringify(HANDOVER_BASE_CUTS), '| band', JSON.stringify(STARTING_SKILL_BAND))
console.log(`sweeping ${SPAN} constants v = i/${SPAN + 1}\n`)
const rows: Row[] = []
for (let i = 1; i <= SPAN; i++) rows.push(measure(i / (SPAN + 1)))

const clean = rows.filter((r) => r.clamped.length === 0)
console.log(`  ${rows.length} constants swept | ${clean.length} clamp no axis on either path`)
console.log('  gap range          ', Math.min(...rows.map((r) => r.gap)).toFixed(2), '..', Math.max(...rows.map((r) => r.gap)).toFixed(2))
console.log('  gap where no clamp ', Math.min(...clean.map((r) => r.gap)).toFixed(4), '..', Math.max(...clean.map((r) => r.gap)).toFixed(4), ' <- one number: the seed cannot widen it')
for (const key of ['baseBand', 'coachLine', 'rung', 'style', 'roomBand'] as const)
  console.log(`  ${key.padEnd(10)} differs on ${String(rows.filter((r) => r.differs[key]).length).padStart(4)} / ${rows.length}   (of the unclamped: ${clean.filter((r) => r.differs[key]).length} / ${clean.length})`)

const eligible = clean.filter((r) => r.differs.baseBand)
const best = Math.max(...eligible.map((r) => r.score))
const short = eligible.filter((r) => r.score === best).sort((a, b) => b.gap - a.gap || a.v - b.v)
console.log(`\n  eligible (no clamp AND different base band): ${eligible.length} | best score ${best} of 5 | ${short.length} tie`)
const pick = short[0]
console.log('\n  ⭐ THE RULE (written above the table, applied to it): no clamped axis on either path,')
console.log('     the two arrivals in different HANDOVER_BASE_CUTS bands, then the most of the handover')
console.log('     differing, then the widest gap, then the lowest constant. Tournaments are not read.')
console.log('  ⭐ PICKED v =', pick.v, '| prologue seed', pick.prologueSeed, '| career seed', pick.careerSeed)
console.log('     A', pick.la.toFixed(2), pick.ba, '-> B', pick.lb.toFixed(2), pick.bb, '| gap', pick.gap.toFixed(2), '| score', pick.score)
console.log('     rung ', pick.rungA, '->', pick.rungB, '| style', pick.styleA, '->', pick.styleB)
console.log('     differs:', Object.entries(pick.differs).filter(([, y]) => y).map(([k]) => k).join(' '))
for (const a of pick.perAxis) console.log(`     ${a.k.padEnd(14)} A ${a.a.toFixed(2).padStart(6)}   B ${a.b.toFixed(2).padStart(6)}   +${a.d.toFixed(2)}`)
console.log('     opens (read after the pick):', opensOf(pick.prologueSeed).join(' '))
console.log('\n  runners-up at the same score:')
for (const r of short.slice(0, 8)) console.log(`     v=${r.v} ${r.careerSeed.padEnd(10)} ${r.la.toFixed(2)} ${r.ba} -> ${r.lb.toFixed(2)} ${r.bb} | ${r.rungA}->${r.rungB} | ${r.styleA}->${r.styleB}`)
