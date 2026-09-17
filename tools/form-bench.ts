/**
 * form-bench – WAVE F1's SCALE ARM AND CENSUS, AND WAVE F2's RUNG TABLE.
 * docs/specs/the-form-and-the-sparring-2026-09.md §7, and the owner's O1 and O7 of 16.09.
 *
 * ⚠⚠ O1 IS A METHOD AND NOT A NUMBER, WHICH IS WHY THIS FILE IS PART OF THE WAVE RATHER THAN A
 * REPORT ON IT. What he ruled is the **[0.5, 4] pp corridor** – form decides close matches and never
 * a career – and `ECONOMY.form.reader` (`K`) is that ruling's CONSEQUENCE. A builder that ships a
 * constant without running §1 has skipped O1 rather than implemented it, which the spec says in as
 * many words.
 *
 * WHAT IT MEASURES, in the order the wave needs it:
 *
 *   §0 THE ARMS, PROVEN. `composure-bench`'s own section zero, asked of this mechanic: the two
 *      clamps against each other, and an ABSURD `K`. If these do not move, nothing below means
 *      anything (CLAUDE.md: «set the constant to an absurd value and watch the output move; if it
 *      does not, the arm is wrong before the hypothesis is»).
 *   §1 THE SCALE ARM – O1. Realised pp at form −10 / −4 (the rust floor) / +10, against the field a
 *      professional career actually meets, in BOTH engines, read against the corridor.
 *   §2 THE CENSUS – where a real career's form actually LIVES. A corridor priced at the clamps is
 *      worthless if no career ever reaches them, which is the decorative-mechanic trap round 42
 *      found twice. This is the arm that fits `G` (`ECONOMY.form.gain`).
 *   §3 THE RUNG TABLE – O7. The three sparring rungs × the two stances, over real careers: what each
 *      buys in form, what each costs, and the TRAVEL ARM read against round 42 #48's measured 89.4%.
 *   §4 INPUT-INDEPENDENCE AND THE MAIN STREAM. Identical entry policies under one seed ⇒ identical
 *      form traces, and `rngMain` byte-identical with the seat hired and fired.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A figure with no denominator
 * prints `–`, never `0.0`.
 *
 * ⚠ ZERO RNG DISCIPLINE: §1's draws are `simulateMatch` on a purpose-scoped key private to this
 * bench (`form:*`); §2–§4 walk real careers through the engine's own loop and take no draw of their
 * own. Nothing here touches MAIN.
 *
 * Run:  npm run bench:form
 *       npx vite-node tools/form-bench.ts -- --sims 1200 --seeds 4 --weeks 600
 */
import { fastMatchProbability, simulateMatch } from '../src/engine/match/engine'
import { fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { ECONOMY } from '../src/engine/economy'
import { accrueForm, formComposureDelta, idleFormWeek } from '../src/engine/form'
import { formMatchlessWeeks, formResidualsOf } from '../src/engine/world/form'
import { SPARRING_RECEIPT } from '../src/engine/world/sparring'
import { KID_ID } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { MatchOptions, MatchPlayer, Tour } from '../src/engine/match/types'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const argv = process.argv.slice(2)
const num = (flag: string, dflt: number): number => {
  const i = argv.indexOf(`--${flag}`)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt
}
const SIMS = num('sims', 1200)
const SEEDS = num('seeds', 3)
const WEEKS = num('weeks', 520)

const TOUR: Tour = 'wta'
const OPTS: MatchOptions = { surface: 'hard', tour: TOUR, seed: '' }
const F = ECONOMY.form

const pp = (x: number): string => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(2)}pp`
const pct = (x: number): string => `${(100 * x).toFixed(1)}%`
const padL = (s: string | number, n: number): string => String(s).padStart(n)
const padR = (s: string | number, n: number): string => String(s).padEnd(n)
const money = (c: number): string => `$${Math.round(c / 100).toLocaleString('en-US')}`
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}

// =================================================================================================
// THE TWO BUILDS EVERY MATCH SECTION USES
// =================================================================================================

/** A build the game really deals – `composure-bench`'s own core, so the two files' pp are
 *  comparable and round 42 #34's «+20 composure = +4.1 pp» is the yardstick this sits beside. */
function build(id: string, core: number, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age: 22, ...over }
}

/** The professional standing, built the way a real bracket builds it (`composure-bench`'s §B path):
 *  `fieldProsFor` deals the field, `mergedWtaRanking` orders it, `rivalMatchPlayer` puts a girl on
 *  court. Nothing here is a hand-made opponent. */
function proAt(rank: number): MatchPlayer {
  const pros = fieldProsFor('form-bench', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((p) => [p.id, p]))
  const row = table[Math.min(table.length - 1, Math.max(0, rank - 1))]
  const pro = byId.get(row.playerId)
  if (!pro) throw new Error(`no pro behind rank ${rank}`)
  return rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
}

/** The SAME `SIMS` seeds every time, so two cells differ only by the build. The key names the
 *  pairing and never the arm. */
function winRate(a: MatchPlayer, b: MatchPlayer, key: string): number {
  let wins = 0
  for (let i = 0; i < SIMS; i++) {
    if (simulateMatch(a, b, { ...OPTS, seed: `form:${key}:${i}` }).winner === 0) wins++
  }
  return wins / SIMS
}

/** Her, at a given form, through the ONE reader the wave ships (`world/player.ts` adds exactly this
 *  to exactly this wing). Spelled through `formComposureDelta` rather than re-derived, so an arm
 *  cannot measure a `K` the engine does not use – the null-arm check, taken at the source. */
function atForm(core: number, form: number, readerOverride?: number): MatchPlayer {
  const delta = readerOverride === undefined ? formComposureDelta(form) : form * readerOverride
  return build('me', core, { composure: Math.max(0, core + delta) })
}

// =================================================================================================
// §0 THE ARMS, PROVEN BEFORE THEY ARE TRUSTED
// =================================================================================================
function sectionZero(): void {
  console.log('\n=== §0  THE ARMS, PROVEN – if these do not move, nothing below means anything ===')
  const opp = build('opp', 62)
  const base = winRate(atForm(62, 0), opp, 'proof')
  const low = winRate(atForm(62, F.min), opp, 'proof')
  const high = winRate(atForm(62, F.max), opp, 'proof')
  console.log(`  form 0      loop ${pct(base)}`)
  console.log(`  form ${padL(F.min, 3)}    loop ${pct(low)}   ${pp(low - base)}`)
  console.log(`  form ${padL(`+${F.max}`, 3)}    loop ${pct(high)}   ${pp(high - base)}`)
  const span = Math.abs(high - low)
  console.log(`  => clamp-to-clamp span ${pp(span)}${span < 0.005 ? '   ⚠⚠ THE READER IS INERT' : ''}`)
  // The absurd arm: K x 10. If the shipped K's effect is not roughly a tenth of this, the reader is
  // not the thing being measured.
  const absurdHigh = winRate(atForm(62, F.max, F.reader * 10), opp, 'proof')
  const absurdLow = winRate(atForm(62, F.min, F.reader * 10), opp, 'proof')
  console.log(
    `  ABSURD ARM (K x10 = ${(F.reader * 10).toFixed(1)}): clamp-to-clamp ${pp(Math.abs(absurdHigh - absurdLow))}` +
      `  – must dwarf the row above, or the arm is wrong before the hypothesis is`,
  )
}

// =================================================================================================
// §1 THE SCALE ARM – O1's corridor
// =================================================================================================
function sectionOne(): void {
  console.log('\n=== §1  THE SCALE ARM (O1) – realised pp at the clamps, against the ruled corridor ===')
  console.log(`    the ruling is the CORRIDOR: [${F.corridorPp[0]}, ${F.corridorPp[1]}] pp. K = ${F.reader} is its consequence.`)
  console.log(`    ${SIMS} paired sims an arm; +-${(F.max * F.reader).toFixed(1)} composure points at the clamps.`)
  console.log('')
  console.log(
    `  ${padR('opponent', 22)}${padL('closed 0', 10)}${padL('loop 0', 9)}${padL(`form ${F.min}`, 11)}${padL('form -4', 10)}${padL(`form +${F.max}`, 11)}${padL('worst |pp|', 12)}${padL('corridor', 10)}`,
  )
  const core = 62
  for (const [label, opp] of [
    ['a peer (core 62)', build('opp', 62)],
    ['the world #20', proAt(20)],
    ['the world #60', proAt(60)],
    ['the world #150', proAt(150)],
  ] as const) {
    const key = label.replace(/\W+/g, '')
    const zero = winRate(atForm(core, 0), opp, key)
    const low = winRate(atForm(core, F.min), opp, key)
    const floor = winRate(atForm(core, F.rustFloor), opp, key)
    const high = winRate(atForm(core, F.max), opp, key)
    const worst = Math.max(Math.abs(low - zero), Math.abs(high - zero))
    const inside = 100 * worst >= F.corridorPp[0] && 100 * worst <= F.corridorPp[1]
    console.log(
      `  ${padR(label, 22)}${padL(pct(fastMatchProbability(atForm(core, 0), opp, OPTS)), 10)}${padL(pct(zero), 9)}` +
        `${padL(pp(low - zero), 11)}${padL(pp(floor - zero), 10)}${padL(pp(high - zero), 11)}` +
        `${padL((100 * worst).toFixed(2), 12)}${padL(inside ? 'inside' : 'OUTSIDE', 10)}`,
    )
  }
  console.log('')
  console.log('  ⚠ THE CLOSED FORM IS PRINTED BESIDE THE LOOP ON PURPOSE. Nerve is spent per break point,')
  console.log('    so if form is worth anything it is worth it in the LOOP column – round 38 C4 put')
  console.log('    composure into the closed form too, so the two should agree in sign and roughly in size.')

  // ⭐⭐ THE FIT ITSELF, AND IT IS THE WHOLE OF O1. The corridor is the ruling; this sweep is how a
  // number is chosen inside it rather than asserted. Every row is the SAME opponents on the SAME
  // seeds, so the only thing moving down the column is `K`.
  console.log('')
  console.log('  THE SWEEP – what each candidate K is worth at the clamps (the row the corridor judges):')
  console.log(
    `  ${padR('K', 8)}${padR('composure at clamp', 22)}${padL('peer', 10)}${padL('#20', 10)}${padL('#60', 10)}${padL('#150', 10)}${padL('worst', 10)}${padL('corridor', 12)}`,
  )
  const opps: [string, MatchPlayer][] = [
    ['peer', build('opp', 62)],
    ['w20', proAt(20)],
    ['w60', proAt(60)],
    ['w150', proAt(150)],
  ]
  for (const k of [0.4, 0.6, 0.8, 1.0, 1.2]) {
    const cells: number[] = []
    for (const [key, opp] of opps) {
      const zero = winRate(atForm(core, 0, k), opp, key)
      const low = winRate(atForm(core, F.min, k), opp, key)
      const high = winRate(atForm(core, F.max, k), opp, key)
      cells.push(Math.max(Math.abs(low - zero), Math.abs(high - zero)))
    }
    const worst = Math.max(...cells)
    const inside = 100 * worst >= F.corridorPp[0] && 100 * worst <= F.corridorPp[1]
    console.log(
      `  ${padR(k.toFixed(1), 8)}${padR(`±${(F.max * k).toFixed(1)} points`, 22)}` +
        cells.map((c) => padL((100 * c).toFixed(2), 10)).join('') +
        `${padL((100 * worst).toFixed(2), 10)}${padL(inside ? 'inside' : 'OUTSIDE', 12)}`,
    )
  }
  console.log(`  (shipped: K = ${F.reader})`)
}

// =================================================================================================
// §2 THE CENSUS – where a real career's form actually lives, and what fits `G`
// =================================================================================================
interface CareerRead {
  key: string
  trace: number[]
  drifting: number
  matchlessRuns: number
  goodNotes: number
  rustNotes: number
  receipts: number
  salaryCents: number
  fareCents: number
}

function walkCareer(
  presetIndex: number,
  index: number,
  seat: { hired: boolean; rung: number; travels: boolean } | null,
): CareerRead {
  const preset = PRESETS[presetIndex]
  const policy = POLICIES[1]
  const { world, rng } = openCareer(preset, index, policy)
  if (seat) {
    // ⚠ THE POKE IS THE **STATE**, NOT THE EFFECT, which is what makes this a real arm rather than a
    // cast over a no-op (this round has already caught one of those). `sparringHired` is the exact
    // field `sparringWorksThisWeek` reads, and the unlock is deliberately bypassed here: the gate is
    // a design question the card answers, and a bench that waited for a W-series result would
    // measure the LADDER rather than the seat.
    world.sparringHired = seat.hired
    world.sparringRung = seat.rung as 0 | 1 | 2
    world.sparringTravels = seat.travels
  }
  const trace: number[] = []
  let drifting = 0
  let matchlessRuns = 0
  let goodNotes = 0
  let rustNotes = 0
  let receipts = 0
  let salaryCents = 0
  let fareCents = 0
  let before = 0
  // ⚠⚠ THE CURSOR IS AN EVENT **ID** AND NOT `events.length`, AND THE FIRST DRAFT OF THIS LOOP USED
  // THE LENGTH. `pruneEvents` caps the feed at 400 non-kept rows, so the array SHRINKS while a career
  // runs – a length cursor is then past the end for ever and every row after the first prune is
  // invisible. Measured: the salary column read $1,250 a season for a $500/wk seat (2.5 paid weeks of
  // 52) and the coach's good line read 0.00 a season, both of which looked like findings. `id` is
  // monotone and assigned by `addEvent`, so it survives the prune.
  let seenId = -1
  for (let w = 0; w < WEEKS; w++) {
    const fundsBefore = world.fundsCents
    stepCareerWeek(world, rng, policy)
    // Re-assert the seat every week: `hireSparring` is never called, so nothing in the engine can
    // turn it off – but a career that ENDS stops ticking, and this keeps the arm honest either way.
    if (seat) {
      world.sparringHired = seat.hired
      world.sparringRung = seat.rung as 0 | 1 | 2
      world.sparringTravels = seat.travels
    }
    const f = world.form ?? 0
    trace.push(f)
    if (f < before) drifting++
    if (f <= F.rustNoteAt) matchlessRuns++
    before = f
    // The two receipts and the coach's eye, counted off the feed rather than re-derived.
    let maxId = seenId
    for (const ev of world.events) {
      if (ev.id <= seenId) continue
      if (ev.id > maxId) maxId = ev.id
      const t = ev.text
      // ⚠ THE THREE LITERALS BELOW ARE COPIES OF ENGINE STRINGS AND THEY MOVED ON 17.09 WITH HIS
      // COPY REVIEW. A bench that matches a sentence by value reads ZERO the day the sentence is
      // reworded, and a zero here looks exactly like a finding – the same failure family as this
      // loop's own `events.length` cursor note above. `SPARRING_RECEIPT` is imported rather than
      // copied for that reason; the coach's two have no exported constant, so they are re-quoted.
      if (t === 'She is striking the ball cleanly.') goodNotes++
      if (t === 'She needs match play.') rustNotes++
      if (t === SPARRING_RECEIPT) receipts++
      if (t === 'Hitting partner – weekly salary') salaryCents += -(ev.amountCents ?? 0)
      if (t.startsWith('Hitting partner travel to')) fareCents += -(ev.amountCents ?? 0)
    }
    seenId = maxId
    void fundsBefore
  }
  return {
    key: `${preset.label}#${index}`,
    trace,
    drifting,
    matchlessRuns,
    goodNotes,
    rustNotes,
    receipts,
    salaryCents,
    fareCents,
  }
}

function sectionTwo(rows: CareerRead[]): void {
  console.log('\n=== §2  THE CENSUS – where a real career\'s form actually lives ===')
  console.log(`    ${rows.length} careers x ${WEEKS} weeks (${(WEEKS / WEEKS_PER_YEAR).toFixed(1)} seasons each), no seat hired.`)
  console.log(`    G = ${F.gain}, reversion ${F.revertPerWeek}/wk, drift ${F.driftPerWeek}/wk past ${F.rustAfterWeeks} weeks, floor ${F.rustFloor}.`)
  console.log('')
  const all = rows.flatMap((r) => r.trace)
  console.log(`  ${padR('', 16)}${padL('p1', 8)}${padL('p5', 8)}${padL('p25', 8)}${padL('median', 8)}${padL('p75', 8)}${padL('p95', 8)}${padL('p99', 8)}${padL('min', 8)}${padL('max', 8)}`)
  console.log(
    `  ${padR('all weeks', 16)}${padL(quantile(all, 0.01).toFixed(1), 8)}${padL(quantile(all, 0.05).toFixed(1), 8)}` +
      `${padL(quantile(all, 0.25).toFixed(1), 8)}${padL(quantile(all, 0.5).toFixed(1), 8)}${padL(quantile(all, 0.75).toFixed(1), 8)}` +
      `${padL(quantile(all, 0.95).toFixed(1), 8)}${padL(quantile(all, 0.99).toFixed(1), 8)}` +
      `${padL(Math.min(...all).toFixed(1), 8)}${padL(Math.max(...all).toFixed(1), 8)}`,
  )
  console.log('')
  const share = (f: (x: number) => boolean): string => pct(all.filter(f).length / all.length)
  console.log(`  weeks at exactly neutral          ${padL(share((x) => x === 0), 8)}`)
  console.log(`  weeks in a slump (<= ${F.rustNoteAt})          ${padL(share((x) => x <= F.rustNoteAt), 8)}`)
  console.log(`  weeks striking it clean (>= ${F.goodNoteAt})   ${padL(share((x) => x >= F.goodNoteAt), 8)}`)
  console.log(`  weeks at or past the rust floor   ${padL(share((x) => x <= F.rustFloor), 8)}`)
  console.log(`  weeks within 1 of a clamp         ${padL(share((x) => Math.abs(x) >= F.max - 1), 8)}`)
  console.log('')
  console.log(`  ⭐ THE FIT FOR G IS THIS TABLE: a corridor priced at the clamps buys nothing if no career`)
  console.log(`     reaches them. |form| p95 = ${Math.max(Math.abs(quantile(all, 0.05)), Math.abs(quantile(all, 0.95))).toFixed(1)} of a possible ${F.max}.`)
  console.log('')
  console.log('  THE COACH\'S EYE, per career per season (O2\'s one window – a remark, not a subscription):')
  const seasons = WEEKS / WEEKS_PER_YEAR
  console.log(`    «She is striking the ball cleanly.»  ${(mean(rows.map((r) => r.goodNotes)) / seasons).toFixed(2)} a season`)
  console.log(`    «She needs match play.»              ${(mean(rows.map((r) => r.rustNotes)) / seasons).toFixed(2)} a season`)
}

// =================================================================================================
// §3 THE RUNG TABLE – O7, and the travel arm against round 42 #48's 89.4%
// =================================================================================================
//
// ⚠⚠ THE OBVIOUS ARM IS THE WRONG ARM AND THIS FILE RAN IT FIRST, WHICH IS WHY THE NOTE IS HERE.
// Hiring the seat on a LIVE career and comparing mean form against a career with nobody made the
// number WORSE at every rung, monotonically in the PRICE: -0.58 with no seat, -2.71 at the entry
// rung, -3.69 at the top. The seat was not failing – the WALLET was. A salary of $2.5k-$15k a season
// on a junior-era family buys fewer tournaments, fewer tournaments are more matchless weeks, and more
// matchless weeks are more rust. That is PATH DIVERGENCE, `elite-retainer-2026-09` §9's own limit
// («a changed wallet changes an entry decision»), and an arm that cannot separate it is measuring the
// price rather than the mechanic.
//
// ⭐ SO THE CALENDAR IS HELD FIXED, which is what the spec's §7 asked for in the first place («the
// rust pairs: forced layoff at a fixed week»). Each career is walked ONCE with nobody hired, and the
// two facts the rhythm channel actually consumes – the week's residuals and the gap it closed with –
// are recorded exactly as the engine computed them. Every rung then re-walks `accrueForm` over that
// SAME recorded calendar, so the only thing differing between two rows is `rustCut`. The money is
// measured separately, on the live arm, where it belongs.
interface Calendar {
  key: string
  weeks: { residuals: number[]; matchlessWeeks: number; away: boolean }[]
}

/** Walk one career with nobody hired and record what the rhythm channel saw.
 *
 *  ⚠ `residuals` AND `matchlessWeeks` ARE THE ENGINE'S OWN, asked of the world in the same state the
 *  weekly pass asked them: both functions read `world.week - 1`, and the pass has already run for
 *  this tick, so a read taken immediately after `stepCareerWeek` returns the identical inputs. This
 *  is the property that makes the replay an isolation rather than a model of one.
 *
 *  ⚠ `away` IS THE ENTRY LEDGER'S, read while the entries are still in the FUTURE – round 42 #48's
 *  own correction, quoted because its first draft printed «road share 0.0%» from a broken instrument:
 *  the tick consumes an entry as it resolves it, so asking at `e.week === world.week` finds nothing. */
function recordCalendar(presetIndex: number, index: number): Calendar {
  const preset = PRESETS[presetIndex]
  const policy = POLICIES[1]
  const { world, rng } = openCareer(preset, index, policy)
  const enteredAt = new Map<string, number>()
  const weeks: Calendar['weeks'] = []
  for (let w = 0; w < WEEKS; w++) {
    for (const e of world.season) {
      if (world.entries.includes(e.id) && !enteredAt.has(e.id)) enteredAt.set(e.id, e.week)
    }
    stepCareerWeek(world, rng, policy)
    weeks.push({
      residuals: formResidualsOf(world),
      matchlessWeeks: formMatchlessWeeks(world),
      away: false,
    })
  }
  const eventWeeks = new Set([...enteredAt.values()])
  weeks.forEach((row, i) => {
    row.away = eventWeeks.has(i)
  })
  return { key: `${preset.label}#${index}`, weeks }
}

/** Replay one recorded calendar under one seat. `null` is nobody hired. */
function replay(cal: Calendar, seat: { cut: number; travels: boolean } | null): number[] {
  const trace: number[] = []
  let f = 0
  for (const row of cal.weeks) {
    const working = seat !== null && (seat.travels || !row.away)
    f = accrueForm(f, {
      residuals: row.residuals,
      matchlessWeeks: row.matchlessWeeks,
      rustCut: working ? seat.cut : 1,
    })
    trace.push(f)
  }
  return trace
}

function sectionThree(cals: Calendar[]): void {
  console.log('\n=== §3  THE RUNG TABLE (O7) – one calendar, every rung replayed over it ===')
  console.log(`    ${cals.length} careers x ${WEEKS} weeks. The calendar and the residuals are IDENTICAL in every`)
  console.log('    row; only `rustCut` moves. See this section\'s header for why the live arm is not this arm.')
  console.log('')
  console.log(
    `  ${padR('arm', 28)}${padL('mean form', 12)}${padL('slump wks', 11)}${padL('floor wks', 11)}${padL('vs no seat', 12)}${padL('drift saved', 13)}`,
  )
  const base = cals.flatMap((c) => replay(c, null))
  const baseMean = mean(base)
  const row = (label: string, trace: number[]): number => {
    const m = mean(trace)
    const d = m - baseMean
    console.log(
      `  ${padR(label, 28)}${padL(m.toFixed(3), 12)}${padL(pct(trace.filter((x) => x <= F.rustNoteAt).length / trace.length), 11)}` +
        `${padL(pct(trace.filter((x) => x <= F.rustFloor).length / trace.length), 11)}` +
        `${padL(`${d >= 0 ? '+' : ''}${d.toFixed(3)}`, 12)}${padL(baseMean === 0 ? '–' : pct(d / -baseMean), 13)}`,
    )
    return d
  }
  row('no seat', base)
  const gained: Record<string, number> = {}
  for (const r of ECONOMY.sparring.rungs) {
    for (const travels of [false, true]) {
      const label = `${r.label} · ${travels ? 'travels' : 'home'}`
      gained[label] = row(label, cals.flatMap((c) => replay(c, { cut: r.driftCut, travels })))
    }
  }
  console.log('')
  console.log('  ⭐ THE TRAVEL ARM, READ AGAINST ROUND 42 #48\'s MEASURED 89.4%:')
  console.log('     «what share of the seat\'s whole effect does the STAY-AT-HOME stance already reach»')
  for (const r of ECONOMY.sparring.rungs) {
    const home = gained[`${r.label} · home`] ?? 0
    const away = gained[`${r.label} · travels`] ?? 0
    console.log(
      `     ${padR(r.label, 20)} home ${padL(home.toFixed(3), 8)}  travels ${padL(away.toFixed(3), 8)}  ` +
        `home reaches ${away === 0 ? '–' : pct(home / away)}  (round 42 predicted 89.4%)`,
    )
  }
}

// =================================================================================================
// §3b THE MONEY – on the LIVE arm, where the price belongs
// =================================================================================================
function sectionThreeB(): void {
  console.log('\n=== §3b  WHAT THE SEAT COSTS – the live arm, where a price is honest ===')
  console.log(`    ${PRESETS.length} presets x ${SEEDS} seeds x ${WEEKS} weeks, the seat hired from week 0 at each rung.`)
  console.log('    ⚠ THE FORM COLUMN IS DELIBERATELY ABSENT HERE: this arm is money-confounded (see §3).')
  console.log('')
  const seasons = WEEKS / WEEKS_PER_YEAR
  console.log(
    `  ${padR('arm', 28)}${padL('salary/season', 16)}${padL('fares/season', 15)}${padL('total/season', 15)}${padL('research $50-80k', 18)}${padL('paid weeks', 12)}`,
  )
  for (const [i, r] of ECONOMY.sparring.rungs.entries()) {
    for (const travels of [false, true]) {
      const rows: CareerRead[] = []
      for (let p = 0; p < PRESETS.length; p++) {
        for (let k = 0; k < SEEDS; k++) rows.push(walkCareer(p, k, { hired: true, rung: i, travels }))
      }
      const salary = mean(rows.map((x) => x.salaryCents)) / seasons
      const fares = mean(rows.map((x) => x.fareCents)) / seasons
      const total = salary + fares
      const inBand = total >= 50_000_00 && total <= 80_000_00
      console.log(
        `  ${padR(`${r.label} · ${travels ? 'travels' : 'home'}`, 28)}${padL(money(salary), 16)}${padL(money(fares), 15)}` +
          `${padL(money(total), 15)}${padL(inBand ? 'inside' : 'outside', 18)}${padL((salary / r.weeklyCents).toFixed(1), 12)}`,
      )
    }
  }
  console.log('')
  console.log('  ⚠ «paid weeks» is the season\'s salary / the rung – how many of the 52 he is actually billed for.')
  console.log('    A home seat is stood down on every week she is away, which is the switch\'s whole price.')
}

// =================================================================================================
// §4 INPUT-INDEPENDENCE AND THE MAIN STREAM
// =================================================================================================
function sectionFour(): void {
  console.log('\n=== §4  INPUT-INDEPENDENCE AND THE MAIN STREAM (invariant 2) ===')
  const a = openCareer(PRESETS[5], 0, POLICIES[1])
  const b = openCareer(PRESETS[5], 0, POLICIES[1])
  b.world.sparringHired = true
  b.world.sparringRung = 2
  const weeks = Math.min(WEEKS, 260)
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(a.world, a.rng, POLICIES[1])
    stepCareerWeek(b.world, b.rng, POLICIES[1])
    b.world.sparringHired = true
  }
  console.log(`  ${weeks} weeks, one seed, one arm with the top rung hired and one with nobody:`)
  console.log(`    rngMain  no seat  {s:${a.world.rngMain.s}, n:${a.world.rngMain.n}}`)
  console.log(`    rngMain  hired    {s:${b.world.rngMain.s}, n:${b.world.rngMain.n}}`)
  const same = a.world.rngMain.s === b.world.rngMain.s && a.world.rngMain.n === b.world.rngMain.n
  console.log(`    => MAIN is ${same ? 'BYTE-IDENTICAL – the seat spends no draw' : '⚠⚠ DIFFERENT – the seat is drawing'}`)
  console.log(`    form: no seat ${(a.world.form ?? 0).toFixed(1)}   hired ${(b.world.form ?? 0).toFixed(1)}`)

  // The model, walked by hand: a matchless run from neutral, with and without the top rung's cut.
  console.log('')
  console.log('  THE MODEL ITSELF, walked from neutral through a matchless run (no world, no draws):')
  console.log(`  ${padR('week of the gap', 18)}${padL('no seat', 10)}${ECONOMY.sparring.rungs.map((r) => padL(r.label.split(' ').slice(-1)[0], 12)).join('')}`)
  const cuts = [1, ...ECONOMY.sparring.rungs.map((r) => r.driftCut)]
  const held = cuts.map(() => 0)
  for (let gap = 1; gap <= 16; gap++) {
    for (let c = 0; c < cuts.length; c++) {
      held[c] = accrueForm(held[c], { ...idleFormWeek(), matchlessWeeks: gap, rustCut: cuts[c] })
    }
    if (gap % 2 === 0 || gap <= 5) {
      console.log(`  ${padR(`${gap}`, 18)}${held.map((h, i) => padL(h.toFixed(1), i === 0 ? 10 : 12)).join('')}`)
    }
  }
  console.log(`  (the floor is ${F.rustFloor}; reversion stands down while the rhythm channel drifts – see accrueForm)`)
}

function main(): void {
  console.log('='.repeat(100))
  console.log('form-bench   wave F1/F2   ·   the corridor is the ruling, the constants are its consequence (O1)')
  console.log('='.repeat(100))
  console.log(`  K = ${F.reader}  G = ${F.gain}  corridor [${F.corridorPp[0]}, ${F.corridorPp[1]}] pp  ·  sims ${SIMS}  seeds ${SEEDS}  weeks ${WEEKS}`)
  sectionZero()
  sectionOne()
  const census: CareerRead[] = []
  for (let p = 0; p < PRESETS.length; p++) for (let i = 0; i < SEEDS; i++) census.push(walkCareer(p, i, null))
  sectionTwo(census)
  const cals: Calendar[] = []
  for (let p = 0; p < PRESETS.length; p++) for (let i = 0; i < SEEDS; i++) cals.push(recordCalendar(p, i))
  sectionThree(cals)
  sectionThreeB()
  sectionFour()
  console.log(`\n  (KID_ID = ${KID_ID}; every number above is measured on this tree, not predicted.)`)
}

main()
