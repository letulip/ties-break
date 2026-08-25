// ⭐⭐⭐ DOES SHE GET HER SHARE OF EVERY CHEQUE? – round 26 #5a, the owner's «Проверь пожалуйста что
// со всех выигрышей после своего счета в банке в 18 лет она получает свои отчисления».
//
//   npx vite-node tools/kid-share-audit.ts                       (8 careers to week 560)
//   npx vite-node tools/kid-share-audit.ts -- --careers 16 --weeks 620
//   npx vite-node tools/kid-share-audit.ts -- --college          (the freeze arm: does it pay?)
//   npx vite-node tools/kid-share-audit.ts -- --from ~/Downloads/x_w502.tsave   (read-only)
//
// ⚠⚠ THE ORACLE IS INDEPENDENT OF THE TILL, WHICH IS THE ONLY THING THAT MAKES THIS A CHECK. It
// would be trivial – and worthless – to read the split off the ledger row `finalizeTournament`
// wrote, because that row is computed from the same two lines the audit is supposed to test. So the
// expected figure is rebuilt from FACTS THE SPLIT CANNOT TOUCH:
//
//   * the `tournament` summary row carries `finishIdx` and names its tier – written BEFORE the
//     cheque, by the points half of finalize;
//   * `prizeCentsFor(tier, finishIdx)` is the tournament's GROSS, the table the split divides;
//   * `kidAgeYears(week, ...)` is her age that week, off her birthday and nothing else;
//   * `kidPrizeShareCents(gross, age)` is the ramp.
//
// Then, and only then, the audit looks at what actually moved: `world.kidFundsCents` before and
// after the week. A cheque that pays her nothing shows up as a row with a non-zero expectation and
// a zero delta – which is the defect the owner asked about, stated as a number.
//
// ⚠ IT ALSO RE-ADDS THE FOUR PIECES. Her share, the coach's, the masseur's and what the family
// banked must sum to the gross to the cent (four hands on one cheque, each rounded once, the family
// taking the remainder by subtraction). A penny of drift here is a real defect: the two balances sit
// side by side on screen.
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched, no save is written, and a `--from` file is
// opened read-only and never copied.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { chooseGift, pendingBirthday, prizeCentsFor, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { kidAgeYears } from '../src/engine/world/age'
import { kidPrizeShareBps, kidPrizeShareCents, staffPrizeShareCents } from '../src/engine/economy'
import { ECONOMY } from '../src/engine/economy'
import { decodeExportFile } from '../src/engine/saveCodec'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ENDINGS } from '../src/engine/ending'
import type { Rng } from '../src/engine/rng'
import type { TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'
import type { WorldEvent } from '../src/shared/protocol'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const strOf = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const CAREERS = numOf('careers', 8)
const WEEKS = numOf('weeks', 560)
const COLLEGE_ARM = args.includes('--college')
const FROM = strOf('from')
const POLICY = POLICIES[1]

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const money = (c: number) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const expand = (p: string) => (p.startsWith('~') ? p.replace('~', homedir()) : p)

/** tier LABEL -> tier id, so the `tournament` summary row can be read back into a table lookup. */
const TIER_BY_LABEL = new Map<string, TierId>(TIER_LADDER.map((t) => [TIERS[t].label, t]))

/** ⭐ ONE CHEQUE, AS THE AUDIT RECONSTRUCTS IT. Every field but `herActual` / `familyActual` comes
 *  from outside the split. */
interface Cheque {
  career: string
  week: number
  ageYears: number
  tier: TierId
  finishIdx: number
  gross: number
  bps: number
  herExpected: number
  herActual: number
  coachExpected: number
  masseurExpected: number
  /** what the `income/prize` ledger row says the family banked */
  familyRow: number | null
  /** the coach + masseur expense rows written the same week, as absolute cents */
  coachRow: number
  masseurRow: number
}

function chequesFromWeek(world: WorldState, career: string, fresh: WorldEvent[], kidFundsDelta: number): Cheque[] {
  const summaries = fresh.filter((e) => e.type === 'tournament' && e.finishIdx !== undefined)
  const out: Cheque[] = []
  for (const s of summaries) {
    const label = s.text.split(' (')[0]
    const tier = TIER_BY_LABEL.get(label)
    if (tier === undefined) throw new Error(`unreadable tournament row: ${s.text}`)
    const finishIdx = s.finishIdx as number
    const gross = prizeCentsFor(tier, finishIdx)
    const ageYears = kidAgeYears(s.week, world.profile.birthMonth, world.profile.birthDay)
    const wta = TIERS[tier].track === 'wta'
    const prizeRow = fresh.find((e) => e.type === 'income' && e.category === 'prize') ?? null
    const coachRow = fresh
      .filter((e) => e.category === 'coaching' && e.text.startsWith("Coach's share"))
      .reduce((a, e) => a + Math.abs(e.amountCents ?? 0), 0)
    const masseurRow = fresh
      .filter((e) => e.category === 'staff' && e.text.startsWith("Masseur's share"))
      .reduce((a, e) => a + Math.abs(e.amountCents ?? 0), 0)
    out.push({
      career,
      week: s.week,
      ageYears,
      tier,
      finishIdx,
      gross,
      bps: kidPrizeShareBps(ageYears),
      herExpected: kidPrizeShareCents(gross, ageYears),
      herActual: kidFundsDelta,
      coachExpected: wta && world.coachId !== null ? staffPrizeShareCents('coach', gross, finishIdx) : 0,
      masseurExpected: wta && (world.masseurHired ?? false) ? staffPrizeShareCents('masseur', gross, finishIdx) : 0,
      familyRow: prizeRow?.amountCents ?? null,
      coachRow,
      masseurRow,
    })
  }
  return out
}

/** Walk one career, collecting every cheque and every week her account moved. */
function auditCareer(world: WorldState, rng: Rng, career: string, untilWeek: number): { cheques: Cheque[]; strayCredits: Array<{ week: number; delta: number }>; endedAs: string | null } {
  const cheques: Cheque[] = []
  const strayCredits: Array<{ week: number; delta: number }> = []
  let endedAs: string | null = null
  let cursor = world.events.length ? Math.max(...world.events.map((e) => e.id)) : 0
  const drain = (): WorldEvent[] => {
    const fresh = world.events.filter((e) => e.id > cursor)
    if (world.events.length) cursor = Math.max(cursor, ...world.events.map((e) => e.id))
    return fresh
  }
  while (world.week < untilWeek) {
    const kidBefore = world.kidFundsCents ?? 0
    // ⭐ THE FORK IS ANSWERED SO THE WALK KEEPS GOING. `--college` takes the scholarship – the arm
    // that asks whether the freeze pays anything at all – and the default takes the tour, which is
    // the arm that has cheques in it.
    if (world.fork !== null && world.fork.answer === null) {
      answerFork(world, COLLEGE_ARM ? 'college' : 'continue')
    }
    if (world.ending?.type === 'college') {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    } else if (world.ending) {
      endedAs = world.ending.type
      break
    } else {
      stepCareerWeek(world, rng, POLICY)
    }
    const fresh = drain()
    const kidDelta = (world.kidFundsCents ?? 0) - kidBefore
    const got = chequesFromWeek(world, career, fresh, kidDelta)
    cheques.push(...got)
    // ⚠ A CREDIT WITH NO CHEQUE BEHIND IT IS ITS OWN FINDING – it would mean a SECOND writer of her
    // account, and the arithmetic below would then be measuring two mechanics at once.
    if (kidDelta !== 0 && got.length === 0) strayCredits.push({ week: world.week, delta: kidDelta })
  }
  return { cheques, strayCredits, endedAs }
}

// =================================================================================================
async function main(): Promise<void> {
  const t0 = Date.now()
  const cheques: Cheque[] = []
  const strays: Array<{ career: string; week: number; delta: number }> = []
  const finals: Array<{ career: string; week: number; kidFunds: number; funds: number; endedAs: string | null }> = []

  if (FROM) {
    // ⚠ READ-ONLY. Decoded into memory, never re-encoded, never copied.
    const world = await decodeExportFile(new Uint8Array(readFileSync(expand(FROM))))
    const kid = world.kidFundsCents ?? 0
    const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    console.log(`\n⭐ THE SAVE – ${FROM}`)
    console.log(`  week ${world.week}   ${world.profile.kidName}, age ${age}   schema v${world.schemaVersion}`)
    console.log(`  family wallet        ${pad(money(world.fundsCents), 16)}   (${world.fundsCents} cents)`)
    console.log(`  her own account      ${pad(money(kid), 16)}   (${kid} cents)`)
    console.log(`  share at her age     ${kidPrizeShareBps(age) / 100}%   (ramp starts at ${ECONOMY.kidShare.fromAgeYears})`)
    console.log(`  career prize kept    ${pad(money(world.careerTotals?.prizeCents ?? 0), 16)}   (the FAMILY's half of every cheque)`)
    const grossSoFar = (world.careerTotals?.prizeCents ?? 0) + kid
    console.log(`  => gross prize money ${pad(money(grossSoFar), 16)}   family-kept + hers`)
    console.log(`  => her share of it   ${((100 * kid) / Math.max(1, grossSoFar)).toFixed(2)}%`)
    // The cheques still on the (pruned) feed – a partial but real cross-check of the ramp.
    const rows = world.events.filter((e) => e.type === 'tournament' && e.finishIdx !== undefined)
    console.log(`\n  cheques still on the feed (the feed prunes, so this is a TAIL, not the career):`)
    console.log(`  ${padE('week', 7)}${padE('age', 5)}${padE('tier', 22)}${pad('finish', 7)}${pad('gross', 14)}${pad('her share', 14)}${pad('bps', 7)}`)
    let paid = 0
    for (const s of rows) {
      const tier = TIER_BY_LABEL.get(s.text.split(' (')[0])
      if (tier === undefined) continue
      const gross = prizeCentsFor(tier, s.finishIdx as number)
      if (gross <= 0) continue
      const age2 = kidAgeYears(s.week, world.profile.birthMonth, world.profile.birthDay)
      paid += kidPrizeShareCents(gross, age2)
      console.log(
        `  ${padE(s.week, 7)}${padE(age2, 5)}${padE(TIERS[tier].label, 22)}${pad(s.finishIdx as number, 7)}${pad(money(gross), 14)}${pad(money(kidPrizeShareCents(gross, age2)), 14)}${pad(kidPrizeShareBps(age2), 7)}`,
      )
    }
    console.log(`  ${'-'.repeat(76)}`)
    console.log(`  those rows alone would have paid her ${money(paid)} of the ${money(kid)} she holds`)
    // ⭐⭐ THE ARITHMETIC THE FEED CANNOT DO – and it closes because there are only two unknowns.
    // `careerTotals.prizeCents` is prize money THE FAMILY KEPT and `kidFundsCents` is hers, so the
    // gross is their sum. If every cheque she was ever paid a share of was struck in ONE ramp year,
    // that year's rate splits the gross into a before-band and an after-band with no slack at all.
    const c = world.college
    if (c) {
      const enrolAge = kidAgeYears(c.fromWeek, world.profile.birthMonth, world.profile.birthDay)
      const untilAge = kidAgeYears(c.untilWeek, world.profile.birthMonth, world.profile.birthDay)
      console.log(`\n  her college: weeks ${c.fromWeek}..${c.untilWeek} (age ${enrolAge} to ${untilAge}), ${c.years.length} year(s) banked, doneWeek ${c.doneWeek ?? 'null'}`)
      console.log(`  the freeze pays no prize money at all, so no cheque was struck inside it`)
    }
    for (const band of [10, 15, 20, 25]) {
      const grossAtBand = Math.round((kid * 100) / band)
      const before = (world.careerTotals?.prizeCents ?? 0) - Math.round((grossAtBand * (100 - band)) / 100)
      if (before < 0) continue
      console.log(
        `  if every share she was paid was at ${pad(band, 2)}%:  she won ${pad(money(grossAtBand), 16)} gross in that band` +
          ` and ${pad(money(before), 16)} before the ramp started`,
      )
    }
    console.log('')
    return
  }

  for (let k = 0; cheques.length >= 0 && k < CAREERS; k++) {
    const preset = PRESETS[k % PRESETS.length]
    const { world, rng } = openCareer(preset, k, POLICY)
    const label = `${preset.background}-${k}`
    const { cheques: c, strayCredits, endedAs } = auditCareer(world, rng, label, WEEKS)
    cheques.push(...c)
    for (const s of strayCredits) strays.push({ career: label, ...s })
    finals.push({ career: label, week: world.week, kidFunds: world.kidFundsCents ?? 0, funds: world.fundsCents, endedAs })
  }

  const paying = cheques.filter((c) => c.gross > 0)
  const after18 = paying.filter((c) => c.ageYears >= ECONOMY.kidShare.fromAgeYears)
  const before18 = paying.filter((c) => c.ageYears < ECONOMY.kidShare.fromAgeYears)
  const wrongAmount = after18.filter((c) => c.herActual !== c.herExpected)
  const skipped = after18.filter((c) => c.herActual === 0 && c.herExpected > 0)
  const leaked = before18.filter((c) => c.herActual !== 0)
  // ⚠ THE RE-ADD IS TWO PIECES ON THE INCOME SIDE AND FOUR IN THE WALLET, and conflating them was
  // this audit's own first bug. `finalizeTournament` credits `familyShare = gross - herShare` as ONE
  // income row and then books the coach's and the masseur's cuts as SEPARATE EXPENSES against it, so
  // the income row is gross-minus-hers and the staff shares are already inside it. The identity that
  // must hold to the cent is therefore `familyRow + hers === gross`; the wallet's own arithmetic
  // (`familyRow - coach - masseur`) is checked beside it.
  const badReadd = paying.filter((c) => {
    if (c.familyRow === null) return true
    return c.familyRow + c.herActual !== c.gross
  })
  const badStaff = paying.filter((c) => c.coachRow !== c.coachExpected || c.masseurRow !== c.masseurExpected)

  console.log(`\n⭐⭐⭐ HER SHARE OF EVERY CHEQUE – ${finals.length} careers walked to week ${WEEKS}${COLLEGE_ARM ? ' (COLLEGE arm)' : ''}`)
  console.log(`  ramp: ${ECONOMY.kidShare.startBps / 100}% at ${ECONOMY.kidShare.fromAgeYears}, +${ECONOMY.kidShare.stepBps / 100} a birthday, capped at ${ECONOMY.kidShare.capBps / 100}%\n`)
  console.log(`  paying cheques (gross > 0)          ${pad(paying.length, 6)}`)
  console.log(`    ...before her eighteenth          ${pad(before18.length, 6)}   ${leaked.length === 0 ? 'none paid her a cent – correct' : `⚠ ${leaked.length} PAID HER ANYWAY`}`)
  console.log(`    ...from her eighteenth            ${pad(after18.length, 6)}`)
  console.log(`       paid the exact ramp amount     ${pad(after18.length - wrongAmount.length, 6)}   ${wrongAmount.length === 0 ? '✓ every one, to the cent' : `⚠ ${wrongAmount.length} WRONG`}`)
  console.log(`       paid nothing at all            ${pad(skipped.length, 6)}   ${skipped.length === 0 ? '✓ no cheque skips her' : '⚠ A CHEQUE SKIPS HER'}`)
  console.log(`  income row + her share == gross     ${pad(paying.length - badReadd.length, 6)} / ${paying.length}   ${badReadd.length === 0 ? '✓ to the cent' : `⚠ ${badReadd.length} DRIFT`}`)
  const wallet = paying.filter((c) => (c.familyRow ?? 0) - c.coachRow - c.masseurRow !== c.gross - c.herActual - c.coachExpected - c.masseurExpected)
  console.log(`  ...and the four pieces in the wallet ${pad(paying.length - wallet.length, 5)} / ${paying.length}   ${wallet.length === 0 ? '✓ hers + coach + masseur + kept == gross' : `⚠ ${wallet.length} DRIFT`}`)
  console.log(`  staff shares match their own tables ${pad(paying.length - badStaff.length, 6)} / ${paying.length}   ${badStaff.length === 0 ? '✓' : `⚠ ${badStaff.length} WRONG`}`)
  console.log(`  credits to her account with NO cheque behind them  ${strays.length}   ${strays.length === 0 ? '✓ one writer only' : '⚠ A SECOND WRITER'}`)

  const grossAfter = after18.reduce((s, c) => s + c.gross, 0)
  const herTotal = after18.reduce((s, c) => s + c.herActual, 0)
  const expTotal = after18.reduce((s, c) => s + c.herExpected, 0)
  console.log(`\n  gross paid to her from 18           ${pad(money(grossAfter), 18)}`)
  console.log(`  her account, summed off the cheques ${pad(money(herTotal), 18)}   expected ${money(expTotal)}   ${herTotal === expTotal ? '✓ identical' : '⚠ DIFFERS'}`)
  const walletSum = finals.reduce((s, f) => s + f.kidFunds, 0)
  console.log(`  her account, read off the worlds    ${pad(money(walletSum), 18)}   ${walletSum === herTotal ? '✓ identical' : '⚠ DIFFERS – a path this audit cannot see'}`)

  console.log(`\n  by age band:`)
  console.log(`  ${padE('age', 6)}${pad('bps', 6)}${pad('cheques', 9)}${pad('gross', 16)}${pad('hers', 16)}${pad('actual %', 10)}`)
  console.log(`  ${'-'.repeat(63)}`)
  const ages = [...new Set(paying.map((c) => c.ageYears))].sort((a, b) => a - b)
  for (const a of ages) {
    const g = paying.filter((c) => c.ageYears === a)
    const gross = g.reduce((s, c) => s + c.gross, 0)
    const hers = g.reduce((s, c) => s + c.herActual, 0)
    console.log(
      `  ${padE(a, 6)}${pad(kidPrizeShareBps(a), 6)}${pad(g.length, 9)}${pad(money(gross), 16)}${pad(money(hers), 16)}${pad(((100 * hers) / Math.max(1, gross)).toFixed(2), 10)}`,
    )
  }

  if (wrongAmount.length) {
    console.log(`\n  ⚠⚠ THE CHEQUES THAT DID NOT PAY THE RAMP:`)
    for (const c of wrongAmount.slice(0, 25)) {
      console.log(
        `     ${padE(c.career, 12)} w${pad(c.week, 4)} age ${c.ageYears} ${padE(TIERS[c.tier].label, 22)} finish ${c.finishIdx}` +
          ` gross ${money(c.gross)} expected ${money(c.herExpected)} got ${money(c.herActual)}`,
      )
    }
  }
  if (badReadd.length) {
    console.log(`\n  ⚠⚠ THE CHEQUES WHOSE FOUR PIECES DO NOT RE-ADD:`)
    for (const c of badReadd.slice(0, 25)) {
      console.log(
        `     ${padE(c.career, 12)} w${pad(c.week, 4)} ${padE(TIERS[c.tier].label, 22)} finish ${c.finishIdx} gross ${money(c.gross)}` +
          ` = family ${c.familyRow === null ? 'NO ROW' : money(c.familyRow)} + hers ${money(c.herActual)}` +
          ` (sum ${money((c.familyRow ?? 0) + c.herActual)})`,
      )
    }
  }
  if (strays.length) {
    console.log(`\n  ⚠⚠ HER ACCOUNT MOVED WITH NO CHEQUE BEHIND IT:`)
    for (const s of strays.slice(0, 25)) console.log(`     ${padE(s.career, 12)} w${pad(s.week, 4)} ${money(s.delta)}`)
  }

  console.log(`\n  per career:`)
  console.log(`  ${padE('career', 14)}${pad('week', 6)}${pad('cheques 18+', 13)}${pad('her account', 16)}${pad('family wallet', 18)}`)
  for (const f of finals) {
    const n = after18.filter((c) => c.career === f.career).length
    console.log(`  ${padE(f.career, 14)}${pad(f.week, 6)}${pad(n, 13)}${pad(money(f.kidFunds), 16)}${pad(money(f.funds), 18)}   ${f.endedAs ?? 'still going'}`)
  }
  console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(1)}s   (${ENDINGS.collegeYears}-year freeze arm: --college)\n`)
}

void main()
