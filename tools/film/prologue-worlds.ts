// Both childhoods, spent through the SHIPPED handover path: createWorld(..., {years, spentCents})
// -> toSnapshot. And path B's four Local Opens, played by the shipped simulator on the fixed seed.
// ⚠ THE SEED IS PINNED BLIND: `ChildhoodPrologue.freshSeed()` is `prologue-${Math.random().toString(36)...}`
// and the film pins Math.random at exactly 0.5, so the film's seed is the component's own function
// at the middle of its range. No outcome was looked at before choosing it.
import { PROLOGUE_CARDS, TOURNAMENT_ANSWER } from '../../src/prologue/cards'
import { EMPTY_RUN, withOrigin, withPick, withEntry, cardFor, chosenYears, spentCents, enteredAges, yearsSoFar, yearsLivedBy, readTwelfth, type PrologueRun } from '../../src/prologue/run'
import { localOpensAt, playLocalOpen, outcomeOf, prologueEntrant, herMatches, sheRetiredIn } from '../../src/prologue/pool'
import { createWorld, KID_ID } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { settleIdentity, OPENING_IDENTITY } from '../../src/prologue/identity'
import { coachReadFor, coachBaseReadFor, playedLine, spentLine, weeklySpentLine } from '../../src/prologue/handover'
import { ageInWords } from '../../src/engine/world/age'
import { localOpenCard } from '../../src/prologue/cards'

const SEED = process.env.FILM_SEED || `prologue-${((0.5).toString(36).slice(2) + '0000').slice(0, 8)}`
console.log('SEED =', SEED)
console.log('IDENTITY =', JSON.stringify(settleIdentity(OPENING_IDENTITY)))

const byLabel = (age: number, run: PrologueRun, label: string) => {
  const card = cardFor(age, run)
  const hit = (card.options ?? card.origins ?? []).find((o) => o.label === label)!
  return hit.id
}
function build(picks: Record<number, string>, ans: 'enter' | 'decline') {
  let run = withOrigin(EMPTY_RUN, byLabel(5, EMPTY_RUN, 'A city, and the bills are paid.') as any)
  for (const age of [8, 9, 10, 11, 12]) run = withPick(run, age, byLabel(age, run, picks[age]))
  for (const age of [11, 12, 13]) run = withEntry(run, age, TOURNAMENT_ANSWER[ans])
  return run
}
const A = build({ 8: 'Stay at the municipal court', 9: 'Keep her in the group', 10: 'Not this year', 11: 'Ordinary school', 12: 'Let her stop for a season' }, 'decline')
const B = build({ 8: 'The club across town', 9: 'Buy the hour, one to one', 10: 'Enter her', 11: 'The sports school', 12: 'Give her the year she is asking for' }, 'enter')

function opens(run: PrologueRun, label: string) {
  const named = settleIdentity(OPENING_IDENTITY)
  const full = `${named.kidName} ${named.kidLastName}`
  const out: any[] = []
  for (const card of PROLOGUE_CARDS) {
    const n = localOpensAt(yearsSoFar(run), card.age, enteredAges(run))
    for (let i = 0; i < n; i++) {
      const kid = prologueEntrant(SEED, KID_ID, full, card.age, yearsLivedBy(run, card.age))
      const open = playLocalOpen(SEED, kid, card.age, i)
      const o = outcomeOf(open)
      const mine = herMatches(open, kid.id)
      const rc = localOpenCard(card.age, o, sheRetiredIn(open, kid.id))
      console.log(`  [${label}] age ${card.age} draw=${open.field.length + 1} rounds=${open.rounds} finish=${open.finish} wins=${open.wins} -> ${o}${sheRetiredIn(open, kid.id) ? ' (retired hurt)' : ''}`)
      console.log(`      event ${open.event.id} (${open.event.tier}, ${open.event.surface}) | result card: "${rc.title}" / ${rc.lede}`)
      for (const m of mine) {
        const opp = open.field.find((p) => p.id === (m.aId === kid.id ? m.bId : m.aId))
        console.log(`      vs ${opp?.name} -> ${m.score}  winner=${m.winnerId === kid.id ? 'HER' : 'opponent'}`)
      }
      out.push({ age: card.age, index: i, finish: open.finish, rounds: open.rounds, wins: open.wins, outcome: o })
    }
  }
  return out
}
console.log('\n──── PATH B local opens ────'); const bOpens = opens(B, 'B')
console.log('\n──── PATH A local opens ────'); const aOpens = opens(A, 'A')

for (const [name, run, played] of [['A', A, aOpens], ['B', B, bOpens]] as const) {
  const named = settleIdentity(OPENING_IDENTITY)
  const profile = { ...DEFAULT_PROFILE, ...named, background: run.origin! }
  const w = createWorld(SEED, profile, `film-${name}`, { years: chosenYears(run), spentCents: spentCents(run) })
  const s = toSnapshot(w) as any
  console.log(`\n════════ HANDOVER ${name} ════════`)
  console.log('  ageYears', s.ageYears, '->', ageInWords(s.ageYears), '| playStyle', s.profile?.playStyle ?? s.playStyle, '| coachTier', s.profile?.coachTier ?? s.coachTier)
  console.log('  handoverBand', s.handoverBand, '| baseBand', s.handoverBaseBand)
  console.log('  coach base :', coachBaseReadFor(s.handoverBaseBand, s.seed))
  console.log('  coach read :', coachReadFor(s.handoverBand, s.seed))
  console.log('  radar      :', JSON.stringify(s.radar))
  console.log('  funds      :', s.fundsCents, '| spent', spentCents(run))
  console.log('  spentLine  :', spentLine(spentCents(run)))
  console.log('  weeklyLine :', weeklySpentLine(spentCents(run)))
  console.log('  playedLine :', playedLine(played as any) || '(none)')
  console.log('  twelfth    :', readTwelfth(run).reading)
}

// ── is the hidden potential ACTUALLY the same girl? ────────────────────────────────────────────
{
  const named = settleIdentity(OPENING_IDENTITY)
  const mk = (run: PrologueRun, id: string) => createWorld(SEED, { ...DEFAULT_PROFILE, ...named, background: run.origin! }, id, { years: chosenYears(run), spentCents: spentCents(run) })
  const wa: any = mk(A, 'p-a'), wb: any = mk(B, 'p-b')
  const pot = (w: any) => w.kid?.potential ?? w.kid?.ceiling ?? w.potential ?? null
  console.log('\n──── the girl underneath ────')
  console.log('  kid keys:', Object.keys(wa.kid ?? {}).join(' '))
  console.log('  A potential:', JSON.stringify(pot(wa)))
  console.log('  B potential:', JSON.stringify(pot(wb)))
  console.log('  identical  :', JSON.stringify(pot(wa)) === JSON.stringify(pot(wb)))
  console.log('  A skills   :', JSON.stringify(wa.kid?.skills ?? wa.kid))
  console.log('  B skills   :', JSON.stringify(wb.kid?.skills ?? wb.kid))
  console.log('  A birth/country:', wa.profile?.birthMonth, wa.profile?.birthDay, wa.profile?.country, '| B:', wb.profile?.birthMonth, wb.profile?.birthDay, wb.profile?.country)
}

// ── how far apart are the two girls, really? ───────────────────────────────────────────────────
{
  const named = settleIdentity(OPENING_IDENTITY)
  const CAREER = process.env.CAREER_SEED || SEED
  const mk = (run: PrologueRun, id: string) => createWorld(CAREER, { ...DEFAULT_PROFILE, ...named, background: run.origin! }, id, { years: chosenYears(run), spentCents: spentCents(run) })
  const wa: any = mk(A, 'g-a'), wb: any = mk(B, 'g-b')
  const keys = Object.keys(wa.skills)
  const avg = (o: any) => keys.reduce((n, k) => n + o[k], 0) / keys.length
  console.log('\n──── arrival, skill by skill (career seed', CAREER + ') ────')
  for (const k of keys) console.log(`  ${k.padEnd(14)} A ${wa.skills[k].toFixed(2).padStart(6)}   B ${wb.skills[k].toFixed(2).padStart(6)}   +${(wb.skills[k] - wa.skills[k]).toFixed(2)}`)
  console.log(`  ${'AVERAGE'.padEnd(14)} A ${avg(wa.skills).toFixed(2).padStart(6)}   B ${avg(wb.skills).toFixed(2).padStart(6)}   +${(avg(wb.skills) - avg(wa.skills)).toFixed(2)}`)
  console.log('  potential identical:', JSON.stringify(wa.potential) === JSON.stringify(wb.potential))
  console.log('  born-skill room A:', keys.reduce((n, k) => n + wa.potential[k] - 0, 0).toFixed(2))
}
