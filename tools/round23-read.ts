// round23-read – items 19 and 20 of round 23: read the owner's two careers through the game's own
// import door and print the facts he asked for, so the answer is a MEASUREMENT of his save rather
// than a sympathetic reading of one screen.
//
//     npx vite-node tools/round23-read.ts <path.tsave> [more.tsave ...]
//
// ⚠ HIS SAVES ARE READ-ONLY. They live in ~/Downloads, they are never committed and never become
// fixtures. This tool takes a path; it ships no path of its own.
//
// HIS QUESTIONS, VERBATIM:
//   19. «меня как обычно интересуют начальные данные девочки, её прогресс на текущий момент и "не
//       слишком ли быстро мы добрались до топ-100" снова? Или это мне только кажется?»
//   20. «сравнить перформанс, движение, победы и всё остальное с нашей системой выстроенной»
//
// ⚠ THE TOP-100 QUESTION IS A PACE QUESTION, so the answer must be a DATE and an AGE, held against
// the sourced real-ladder rows in docs/research/real-ladder-pace.md - never against a feeling.
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeAt } from '../src/engine/world/age'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

const pad = (s: string | number, n: number) => String(s).padStart(n)
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

async function report(path: string): Promise<void> {
  const w = await load(path)
  const seasons = Math.floor(w.week / WEEKS_PER_YEAR)
  console.log(`\n${'='.repeat(100)}`)
  console.log(`${path.split('/').pop()}  ·  week ${w.week}  ·  season ${seasons}  ·  schema v${w.schemaVersion}`)
  console.log('='.repeat(100))

  // --- 1. WHO SHE STARTED AS ----------------------------------------------------------------
  console.log(`\n1. THE GIRL AS SHE STARTED`)
  const p = w.profile
  console.log(`   name ${String(p.kidName)} ${String(p.kidLastName)}   born ${String(p.birthDay)}/${String(p.birthMonth)}   country ${String(p.country)}`)
  console.log(`   play style ${String(p.playStyle)}   coach at onboarding ${String(p.coachTier)}   background ${String(p.background)}`)
  const pot = w.potential
  if (pot)
    console.log(
      `   CEILING  serve ${pad(pot.serve.toFixed(1), 6)}  ret ${pad(pot.ret.toFixed(1), 6)}` +
        `  gs ${pad(pot.groundstrokes.toFixed(1), 6)}  comp ${pad(pot.composure.toFixed(1), 6)}  stam ${pad(pot.stamina.toFixed(1), 6)}`,
    )

  // --- 2. WHERE SHE IS NOW ------------------------------------------------------------------
  const s = w.skills
  console.log(`\n2. WHERE SHE IS NOW  (age ${kidAgeAt(w, w.week).toFixed(1)})`)
  console.log(`   SKILL    serve ${pad(s.serve.toFixed(1), 5)}  ret ${pad(s.ret.toFixed(1), 5)}  gs ${pad(s.groundstrokes.toFixed(1), 5)}  comp ${pad(s.composure.toFixed(1), 5)}  stam ${pad(s.stamina.toFixed(1), 5)}`)
  if (pot) {
    // ⚠ FIELD BY NAME, never by a string index: `KidSkills` has no index signature, and casting one
    // on would have hidden a renamed attribute behind a silent `undefined`.
    const gap = (now: number, ceil: number) => (ceil - now).toFixed(1)
    console.log(
      `   TO CEILING  serve ${pad(gap(s.serve, pot.serve), 5)}  ret ${pad(gap(s.ret, pot.ret), 5)}` +
        `  comp ${pad(gap(s.composure, pot.composure), 5)}  stam ${pad(gap(s.stamina, pot.stamina), 5)}`,
    )
  }
  console.log(`   RANK  world ${w.kidRank ?? '–'}   wta ${w.kidRankWta ?? '–'}   domestic ${w.kidRankDomestic ?? '–'}`)
  console.log(`   condition ${w.condition}   funds ${money(w.fundsCents)}   coach ${w.coachId ?? 'self'}`)

  // --- 3. THE PACE TO THE TOP 100 -----------------------------------------------------------
  // ⚠ READ OFF `seasonHistory.byTrack`, WHICH IS WHERE THE RANKS ACTUALLY LIVE. The first cut of
  // this tool guessed `h.week` / `h.rank` / `h.rankTrack` and printed a table of dashes and zeroes -
  // which is a null arm wearing a result's clothes, and the exact thing this file exists to avoid.
  // The real row carries `endRank`, `points`, and a per-track breakdown with its own `endRank`.
  console.log(`\n3. THE PACE – season by season (this is the top-100 question)`)
  console.log(
    `   ${pad('season', 7)}${pad('age', 6)}${pad('W-L', 9)}${pad('world', 7)}` +
      `${pad('domestic', 10)}${pad('itf', 7)}${pad('WTA', 7)}${pad('pts', 7)}${pad('net', 12)}`,
  )
  const hist = (w.seasonHistory ?? []) as Array<Record<string, any>>
  for (const h of hist) {
    // The wrap of season i is the last week of that season - the same arithmetic `seasonStartWeek`
    // uses, read forward instead of back, so her age is her age AT the wrap and not today's.
    const wrapWk = (Number(h.seasonIndex) + 1) * WEEKS_PER_YEAR - 1
    const bt = h.byTrack ?? {}
    const rk = (k: string) => (bt[k]?.endRank ? String(bt[k].endRank) : bt[k]?.wins ? '–' : '')
    console.log(
      `   ${pad(String(h.seasonIndex), 7)}${pad(kidAgeAt(w, Math.min(wrapWk, w.week)).toFixed(1), 6)}` +
        `${pad(`${h.wins}-${h.losses}`, 9)}${pad(String(h.endRank ?? '–'), 7)}` +
        `${pad(rk('domestic'), 10)}${pad(rk('itf'), 7)}${pad(rk('wta'), 7)}` +
        `${pad(String(h.points ?? 0), 7)}${pad(money(h.fundsDeltaCents ?? 0), 12)}`,
    )
  }
  const last = w.lastSeasonSummary as Record<string, any> | undefined
  if (last) {
    console.log(
      `\n   LAST WRAP: ${last.rankTrack} #${last.rankInTrack}   world #${last.endRank} (from #${last.startRank})` +
        `   best "${last.bestResultText}"   entered ${last.entryMirror?.entered}` +
        `   injured ${last.weeksInjured}w   academy covered ${money(last.academyCoveredCents ?? 0)}`,
    )
  }
  // ⭐ AND THE ONE NUMBER HE ASKED FOR: the first season that ends inside the WTA top 100, with her
  // age at that wrap. This is the top-100 pace, and it is the only honest way to answer "too fast?".
  const cross = hist.find((h) => Number(h.byTrack?.wta?.endRank ?? Infinity) <= 100)
  if (cross) {
    const wk = (Number(cross.seasonIndex) + 1) * WEEKS_PER_YEAR - 1
    console.log(`   ⭐ FIRST SEASON ENDING IN THE WTA TOP 100: season ${cross.seasonIndex}, at age ${kidAgeAt(w, Math.min(wk, w.week)).toFixed(1)} (#${cross.byTrack.wta.endRank})`)
  } else {
    console.log(`   ⭐ she has not ended a season inside the WTA top 100 yet`)
  }

  // --- 4. WHAT SHE ACTUALLY PLAYED ----------------------------------------------------------
  console.log(`\n4. WHAT SHE PLAYED – her own result rows, by tier (the 52-week window the ledger keeps)`)
  const byTier = new Map<string, { n: number; pts: number }>()
  for (const r of w.results ?? []) {
    if (r.playerId !== KID_ID) continue
    const k = r.tier ?? 'local'
    const cur = byTier.get(k) ?? { n: 0, pts: 0 }
    cur.n += 1
    cur.pts += r.points
    byTier.set(k, cur)
  }
  for (const [tier, v] of [...byTier].sort((a, b) => b[1].pts - a[1].pts)) {
    console.log(`   ${pad(tier, 10)} ${pad(v.n, 4)} results   ${pad(v.pts, 7)} pts`)
  }
  if (!byTier.size) console.log(`   (no rows in the window – the ledger prunes to 52 weeks)`)

  // --- 5. THE MONEY -------------------------------------------------------------------------
  const t = w.careerTotals
  if (t) {
    console.log(`\n5. THE MONEY, whole career`)
    console.log(`   earned ${money(t.earnedCents)}   prize ${money(t.prizeCents)}   spent ${money(t.spentCents)}`)
    console.log(`   net ${money(t.earnedCents - t.spentCents)}   per season ${money(t.spentCents / Math.max(1, seasons))} spent`)
  }

  // --- 6. THE BODY --------------------------------------------------------------------------
  const inj = (w.injuryHistory ?? []) as Array<Record<string, unknown>>
  const weeksLost = inj.reduce((a, i) => a + Number(i.weeks ?? i.weeksOut ?? 0), 0)
  console.log(`\n6. THE BODY – ${inj.length} injuries, ${weeksLost} weeks lost over ${w.week} weeks (${((100 * weeksLost) / Math.max(1, w.week)).toFixed(1)}%)`)
}

const args = process.argv.slice(2)
if (!args.length) {
  console.error('usage: npx vite-node tools/round23-read.ts <path.tsave> [more.tsave ...]')
  process.exit(1)
}
for (const a of args) await report(a)
