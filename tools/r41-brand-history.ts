/**
 * r41-brand-history – item 18 answered from the owner's OWN save, week by week.
 *
 * His question, repeated on the second visit: the brand bought fresh at 16 in the top-100 sat
 * «около 240к около года и приносил 270 долларов всё это время», woke only after a W500 title,
 * then dropped suddenly later – «мне хочется понять с чем это связано, потому что в моем
 * представлении она уже должна была быть знаменита. У нее был вайлдкард на Шлем, когда она
 * была #155».
 *
 * The engine's brand is a pure read of dated state (`brandSignalsOf(world, week)`,
 * `fameFloorOf(world, week)` – trophiesByTier carries the WEEK of every title and lost final), so
 * the whole price path RECONSTRUCTS from the save: fame(t), income(t), derived(t), and the two
 * worth walks – the shipped-before-round-41 closed form whose half-life was re-read from today's
 * fame over the whole holding period (the retro defect), and the round's incremental walk.
 *
 * ⚠ One honest wrinkle, stated not hidden: brandSignalsOf's proSeasons/topSeasons terms fold over
 * ALL of seasonHistory regardless of the asked week, so a reconstruction at an early t counts a
 * season or two that had not ended yet – it flatters early `multiple` slightly and cannot create
 * his plateau; fame, income and the floor are exactly dated.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * ⭐⭐⭐ PART TWO (12.09, his «да, делаем fame за основу Шлема») – THE THIRD ARM: THE DEBUT FLOOR.
 *
 * `ECONOMY.fame.slamDebutFloor` pays one step, dated at her first Slam MAIN DRAW, on the title
 * clock. Her save predates the mechanism and therefore carries no `SLAM_DEBUT_KEY` row, so the arm
 * is a COUNTERFACTUAL built by injecting exactly the row `finalizeTournament` would have written –
 * into a clone – and then reading the SHIPPED engine functions off it. Nothing here re-implements
 * the floor; if the constant moves, this arm moves with it.
 *
 * ⚠⚠ THE DEBUT WEEK IS RECONSTRUCTED AND THE SAVE CANNOT CONFIRM IT. Measured, not assumed: her
 * kid result rows span w353..w405 only (`RESULTS_WINDOW` = 52), the feed retains three tournament
 * rows (w401/w403/w405), `seasonEntries`/`proEntryWeeks` are current-season, and the milestone
 * ledger's earliest Slam entry is the LOST FINAL at w234. So the debut week is genuinely
 * unrecoverable and `--debut` defaults to w130 – which is not a guess but ONE OF THE FOUR WEEKS A
 * SLAM CAN BE PLAYED IN season 2: `TIERS.slam.anchorWeeks` is [2, 21, 26, 34] and season 2 runs
 * w104..w155, so the candidates are w106 / w125 / w130 / w138. Her WTA end-ranks bracket it
 * exactly where the owner puts it – #158 at the season-1 wrap (w101), #89 at the season-2 wrap
 * (w153), and he says the wildcard came at #155. §3 prints all four so the answer does not depend
 * on the choice.
 *
 * ⭐ PREDICTIONS, WRITTEN BEFORE THE FIRST RUN (docs/specs/the-fame-and-the-brand-2026-09.md §2):
 *   at the purchase week w138, with the debut at w130 and the step at +4 –
 *     · fame        9.8  ->  about 14
 *     · income/wk   $291 ->  about $570
 *     · derived     $118,874 -> about $230,000, i.e. roughly what the family PAID ($250,000)
 *     · the wake moves from w166 (the first W500 title) back to the debut itself.
 *
 * MEASUREMENT ONLY; the personal save is never committed (plateau-probe's rule).
 * Run: npx vite-node tools/r41-brand-history.ts -- --save ~/Downloads/….tsave [--debut 130]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { SLAM_DEBUT_KEY } from '../src/engine/world/constants'
import { brandSignalsOf, brandWeeklyGrossCents, brandGrossWorthCents, brandMultipleX } from '../src/engine/world/brand'
import { fameFloorOf, fameShootMultOf } from '../src/engine/world/fame'
import { worthRampHalfLife } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'
import { formatCents } from '../src/shared/money'

function section(title: string): void {
  console.log(`\n${'='.repeat(112)}\n${title}\n${'='.repeat(112)}`)
}

const flag = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/** The counterfactual world: the SAME save with exactly the row `finalizeTournament` would have
 *  written at `week`. `keep: true` and the key are what `slamDebutWeekOf` reads; nothing else about
 *  the row can reach the arithmetic. */
function withDebutAt(world: WorldState, week: number): WorldState {
  const clone = structuredClone(world)
  const id = Math.max(0, ...clone.events.map((e) => e.id)) + 1
  clone.events.push({
    id,
    week,
    type: 'milestone',
    text: '🏆 First Grand Slam main draw – from this week the world knows her name.',
    keep: true,
    milestoneKey: SLAM_DEBUT_KEY,
  })
  clone.events.sort((a, b) => a.id - b.id)
  return clone
}

/** One week of every column, for one world. */
function readAt(world: WorldState, t: number, baseX: number, paid: number, floorShare: number) {
  const sig = brandSignalsOf(world, t)
  const gross = brandGrossWorthCents(sig, baseX)
  const derived = Math.max(Math.round(paid * floorShare), gross)
  return { sig, derived, income: brandWeeklyGrossCents(sig), multiple: brandMultipleX(sig, baseX) }
}

async function main(): Promise<void> {
  const path = (flag('save') ?? '').replace('~', process.env.HOME ?? '')
  const debutWeek = Number(flag('debut') ?? 130)
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState

  const brand = (w.assets ?? []).find((a) => a.id === 'merch-brand')
  if (!brand) {
    console.log('no merch-brand on the save')
    return
  }
  const bought = brand.boughtWeek
  const paid = brand.paidCents
  const floorShare = ECONOMY.shop.businessValueFloorShare
  const medianFame = ECONOMY.shop.worthRamp.medianFame
  const baseX = 14 // the catalogue's earningsMultipleX for merch-brand

  section(`THE SHELF OF DATED TITLES AND LOST FINALS (what fame is made of on this save)`)
  for (const [tier, shelf] of Object.entries(w.trophiesByTier ?? {})) {
    const s = shelf as { titles: number[]; finals?: number[] }
    if (s.titles.length || s.finals?.length) {
      console.log(
        `${tier.padEnd(8)} titles @ w${s.titles.join(', w') || '–'}${s.finals?.length ? `  · lost finals @ w${s.finals.join(', w')}` : ''}`,
      )
    }
  }
  console.log(
    `\nSLAM DEBUT: no row on this save (it predates the mechanism) – reconstructed at w${debutWeek}, ` +
      `one of the four season-2 anchor weeks. Step +${ECONOMY.fame.slamDebutFloor} on the title clock.`,
  )

  section(`THE BRAND, WEEK BY WEEK FROM ITS PURCHASE (bought w${bought}, paid ${formatCents(paid)})`)
  console.log('week   fame    income/wk     derived        OLD worth (retro-H)   NEW worth (incremental)   note')
  const cf = withDebutAt(w, debutWeek)
  let incr = paid
  let incrDebut = paid
  let prevOld = paid
  const drops: { week: number; oldStep: number }[] = []
  const story = new Set([bought, 166, 220, 234, 258, 314])
  const rows: { week: number; fame: number; fameD: number; income: number; incomeD: number; derived: number; derivedD: number; old: number; incr: number; incrD: number; mult: number; multD: number }[] = []
  for (let t = bought; t <= w.week; t++) {
    const a = readAt(w, t, baseX, paid, floorShare)
    const b = readAt(cf, t, baseX, paid, floorShare)
    const H = worthRampHalfLife(a.sig.fame, medianFame)
    const HD = worthRampHalfLife(b.sig.fame, medianFame)
    // OLD: the closed form, kept re-derived from t0 with TODAY's H – the retro defect.
    const kept = Math.pow(0.5, Math.max(0, t - bought) / H)
    const old = Math.round(a.derived + (paid - a.derived) * kept)
    // NEW: one step a week by this week's H, the persisted value as the accumulator.
    incr = Math.round(incr + (a.derived - incr) * (1 - Math.pow(0.5, 1 / H)))
    incrDebut = Math.round(incrDebut + (b.derived - incrDebut) * (1 - Math.pow(0.5, 1 / HD)))
    const oldStep = old - prevOld
    if (t > bought && oldStep < -100_000_00) drops.push({ week: t, oldStep })
    prevOld = old
    if (story.has(t)) {
      rows.push({
        week: t, fame: a.sig.fame, fameD: b.sig.fame, income: a.income, incomeD: b.income,
        derived: a.derived, derivedD: b.derived, old, incr, incrD: incrDebut, mult: a.multiple, multD: b.multiple,
      })
    }
    if ((t - bought) % 8 === 0 || Math.abs(oldStep) > 100_000_00) {
      console.log(
        `w${String(t).padEnd(5)} ${a.sig.fame.toFixed(1).padStart(5)} ${formatCents(a.income).padStart(10)} ${formatCents(a.derived).padStart(14)} ${formatCents(old).padStart(18)} ${formatCents(incr).padStart(18)}${Math.abs(oldStep) > 100_000_00 ? `   << OLD steps ${formatCents(oldStep)} in ONE week` : ''}`,
      )
    }
  }

  section('THE SUDDEN DROPS THE OLD MODEL MANUFACTURED (one-week steps over $100k)')
  if (!drops.length) console.log('none over the bar on this save')
  for (const d of drops) console.log(`w${d.week}: ${formatCents(d.oldStep)} in one week – the half-life re-read, not a market`)

  section(`§2 THE THREE ARMS AT THE STORY WEEKS – OLD / FIXED / FIXED+DEBUT (debut w${debutWeek})`)
  console.log('week   |  fame  OLD→DEBUT |    income/wk OLD→DEBUT |        derived OLD→DEBUT |            FIXED worth |      FIXED+DEBUT worth')
  for (const r of rows) {
    console.log(
      `w${String(r.week).padEnd(5)} | ${r.fame.toFixed(1).padStart(5)} → ${r.fameD.toFixed(1).padStart(5)} | ` +
        `${formatCents(r.income).padStart(10)} → ${formatCents(r.incomeD).padStart(10)} | ` +
        `${formatCents(r.derived).padStart(11)} → ${formatCents(r.derivedD).padStart(11)} | ` +
        `${formatCents(r.incr).padStart(14)} | ${formatCents(r.incrD).padStart(14)}`,
    )
  }
  console.log('\nthe multiple at the same weeks (OLD → DEBUT):')
  for (const r of rows) console.log(`  w${String(r.week).padEnd(5)} ${r.mult.toFixed(2)}x → ${r.multD.toFixed(2)}x`)

  section('§3 THE WAKE – the first week the row is worth more than what was paid, on each arm')
  for (const [label, world] of [['FIXED (no debut)', w], [`FIXED+DEBUT w${debutWeek}`, cf]] as [string, WorldState][]) {
    let v = paid
    let woke: number | null = null
    for (let t = bought; t <= w.week; t++) {
      const r = readAt(world, t, baseX, paid, floorShare)
      const H = worthRampHalfLife(r.sig.fame, medianFame)
      v = Math.round(v + (r.derived - v) * (1 - Math.pow(0.5, 1 / H)))
      if (woke === null && r.derived >= paid) woke = t
    }
    console.log(`${label.padEnd(22)} derived first reaches the ${formatCents(paid)} paid at ${woke === null ? 'never' : `w${woke}`}`)
  }

  section('§3b SENSITIVITY – the same reading at every week a Slam could have been played in season 2')
  console.log('debut   fame@w138   income@w138   derived@w138')
  for (const cand of [106, 125, 130, 138]) {
    const r = readAt(withDebutAt(w, cand), bought, baseX, paid, floorShare)
    console.log(`w${String(cand).padEnd(6)} ${r.sig.fame.toFixed(2).padStart(9)} ${formatCents(r.income).padStart(13)} ${formatCents(r.derived).padStart(14)}`)
  }

  section('§3c THE PLATEAU ITSELF – what the ROW does between the buy and the first W500 title (w166)')
  for (const [label, world] of [['FIXED (no debut)', w], [`FIXED+DEBUT w${debutWeek}`, cf]] as [string, WorldState][]) {
    let v = paid
    let trough = paid
    let troughWeek = bought
    let firstRise: number | null = null
    for (let t = bought; t <= 166; t++) {
      const r = readAt(world, t, baseX, paid, floorShare)
      const H = worthRampHalfLife(r.sig.fame, medianFame)
      const next = Math.round(v + (r.derived - v) * (1 - Math.pow(0.5, 1 / H)))
      if (t > bought && next > v && firstRise === null) firstRise = t
      v = next
      if (v < trough) { trough = v; troughWeek = t }
    }
    console.log(
      `${label.padEnd(22)} trough ${formatCents(trough)} at w${troughWeek} ` +
        `(${(((trough - paid) / paid) * 100).toFixed(1)}% of what was paid) · first week the row RISES again: ` +
        `${firstRise === null ? 'not before w166' : `w${firstRise}`}`,
    )
  }

  section('§3d THE STEP SWEEP – what each candidate step buys at the purchase week (predicted-first: 4)')
  const F = ECONOMY.fame as unknown as { slamDebutFloor: number }
  const shipped = F.slamDebutFloor
  console.log('step    fame@w138   income@w138   derived@w138   vs the $250,000 paid')
  for (const step of [0, 3, 4, 5, 6, 8]) {
    F.slamDebutFloor = step
    const r = readAt(cf, bought, baseX, paid, floorShare)
    console.log(
      `+${String(step).padEnd(6)} ${r.sig.fame.toFixed(2).padStart(9)} ${formatCents(r.income).padStart(13)} ` +
        `${formatCents(r.derived).padStart(14)}   ${((r.derived / paid) * 100).toFixed(1)}%`,
    )
  }
  F.slamDebutFloor = shipped

  section('§5 THE CAP – what fame WOULD read with no ceiling, on the reference career')
  console.log('week    capped   uncapped   the cap is clipping')
  for (const t of [220, 234, 249, 258, 300, 314, 360, w.week]) {
    const sig = brandSignalsOf(cf, t)
    const uncapped = fameFloorOf(cf, t) * fameShootMultOf(cf, t)
    console.log(
      `w${String(t).padEnd(6)} ${sig.fame.toFixed(1).padStart(6)} ${uncapped.toFixed(1).padStart(10)}   ` +
        `${uncapped > ECONOMY.fame.cap ? `${(uncapped / ECONOMY.fame.cap).toFixed(2)}x the ceiling` : '–'}`,
    )
  }
  console.log(
    `\nthe income the cap pins her at: ${formatCents(brandWeeklyGrossCents(brandSignalsOf(cf, w.week)))} a week ` +
      `= ${formatCents(brandWeeklyGrossCents(brandSignalsOf(cf, w.week)) * 52)} a year.`,
  )
}

void main()
