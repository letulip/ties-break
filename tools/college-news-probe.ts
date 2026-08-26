// ⭐⭐⭐ WHAT THE FEED RECEIVES DURING THE FREEZE – round 26 #10, the owner's «В новостях во время
// колледжа вообще пустота, как будто мир умер».
//
//   npx vite-node tools/college-news-probe.ts                (6 careers × 4 years)
//   npx vite-node tools/college-news-probe.ts -- --careers 12
//
// ⚠⚠ THE QUESTION THIS FILE ANSWERS FIRST, AND IT IS AN INVENTORY, NOT A FIX. «Empty» has two very
// different causes and they need opposite work: either the freeze WRITES NOTHING (the world is
// silent), or it writes rows that the SURFACE THROWS AWAY (Home's news block drops `expense` and
// `income`, and the snapshot only carries the last `SNAPSHOT_EVENTS` = 60 rows). So every column
// below is counted twice: once over everything `addEvent` wrote inside the freeze span, and once
// over the rows that would actually reach the news list.
//
// ⚠ IT READS THE WORLD AND NOT THE FEATURE. Nothing here imports a symbol this round added, so the
// same file runs on the arm with the change reverted and prints the same table – the A/B discipline
// CLAUDE.md asks for. `--budget` re-prints the cap arithmetic (`EVENTS_CAP`, `pruneEvents`).
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched and no save is written.
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import {
  chooseGift,
  closeTournament,
  collegeLeagueRevealOpen,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
  toSnapshot,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ENDINGS } from '../src/engine/ending'
import { EVENTS_CAP, SNAPSHOT_EVENTS } from '../src/engine/world/constants'
import type { Rng } from '../src/engine/rng'
import type { WorldState } from '../src/engine/world'
import type { WorldEvent } from '../src/shared/protocol'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const CAREERS = numOf('careers', 6)
const POLICY = POLICIES[1]
const WALK_CAP = 400
const DUMP = args.includes('--dump')

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const pct = (a: number, b: number) => (b === 0 ? '   –' : `${((100 * a) / b).toFixed(0)}%`)

/** ⚠ HOME'S OWN FILTER, COPIED RATHER THAN IMPORTED. `HomeScreen.vue`'s `newsGroups` drops
 *  `expense` and `income` (they live on the Money ledger); this is that one line and nothing else,
 *  so a row that passes here is a row the player can actually read in the news list. */
const readsAsNews = (e: WorldEvent): boolean => e.type !== 'expense' && e.type !== 'income'

/** ⭐⭐ THE ORDER HE READS THEM IN, which is the other half of `readsAsNews` and was missing. Home
 *  does not print a flat list: `newsGroups` buckets by week, sorts the WEEKS descending, and inside
 *  a week pins milestones first and then sorts by descending id. «Предпоследняя новость» is row 2 of
 *  THAT sequence, so the sequence has to be reproduced rather than approximated by an array order. */
function homeOrder(events: WorldEvent[]): WorldEvent[] {
  const byWeek = new Map<number, WorldEvent[]>()
  for (const e of events) {
    const list = byWeek.get(e.week)
    if (list) list.push(e)
    else byWeek.set(e.week, [e])
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, list]) =>
      [...list].sort((a, b) => {
        const am = a.type === 'milestone' ? 0 : 1
        const bm = b.type === 'milestone' ? 0 : 1
        return am - bm || b.id - a.id
      }),
    )
}

interface FreezeReport {
  label: string
  fromWeek: number
  untilWeek: number
  weeks: number
  /** every row `addEvent` wrote inside the span, by `type` */
  writtenByType: Map<string, number>
  /** ...and the subset that survives Home's filter */
  newsByType: Map<string, number>
  /** the news rows again, bucketed by what they are ABOUT (a coarse text classification) */
  newsByTopic: Map<string, number>
  /** weeks inside the span that produced at least one news row */
  weeksWithNews: number
  /** how many of the freeze's news rows are still in the world at graduation (post-prune) */
  survived: number
  /** ...and how many of those are inside the snapshot window the UI is handed */
  inSnapshot: number
  /** the events array's size at graduation, and its composition */
  endTotal: number
  endKept: number
  /** ⭐ THE SCREEN AT REST – one row per press of «Another year» */
  rests: RestRow[]
}

/** What the college Home shell's News card holds the moment the press returns. */
interface RestRow {
  week: number
  /** rows Home would print */
  shown: number
  /** ...spread over how many week groups */
  weeks: number
  /** ...of which about the professional field rather than about her */
  world: number
  /** the oldest week still inside the snapshot window */
  oldest: number
  /** ⭐⭐ THE CAP, AS IT ACTUALLY STANDS – the three classes `pruneEvents` spends the 400 on. `rest`
   *  pinned at `EVENTS_ORDINARY_FLOOR` is the SATURATED regime, and it is what decides how deep the
   *  world's own news can reach: everything the tour says is an ordinary row. */
  keep: number
  evidence: number
  rest: number
  /** the oldest ordinary row still alive – the depth of the world's memory, in weeks */
  restFrom: number
  /** ⭐ THE ONE THAT DECIDES WHETHER ANY OF THIS IS SEEN: rows ON THE CARD that say the field has
   *  generations – a champion in a first or a last season, a farewell, a turnover or an intake
   *  line. Zero here means the world is speaking into weeks the player never opens. */
  generational: number
  /** ⭐⭐⭐ ROUND 26 #10, SECOND PASS – RECENCY, WHICH IS THE THING HE ACTUALLY REPORTED AND THE ONE
   *  QUANTITY THE FIRST PASS NEVER MEASURED. The owner: «у меня в ленте ПРЕДПОСЛЕДНЯЯ новость были
   *  из мира "до колледжа" на протяжении всей учебы». That is not a claim about how many rows the
   *  card holds – the first pass counted those and found fifteen – it is a claim about HOW OLD the
   *  rows at the top of it are. Every field below is an age in weeks, read off the feed in the exact
   *  order `HomeScreen.vue`'s `newsGroups` prints it (week groups descending, milestones pinned
   *  first inside a group), so row 2 here IS his «предпоследняя». */
  rows: number
  topAge: number
  secondAge: number
  /** how many of the printed rows predate the enrolment week – his «из мира до колледжа» */
  preCollege: number
  /** ...and whether row 2 in particular is one of them */
  secondIsPreCollege: boolean
  /** rows written in the four weeks before the rest state – "current" at a glance */
  freshRows: number
  medianAge: number
  /** ⭐⭐ THE SPAN THE PRESS JUST SPENT, and how much of it reached the card. This is the owner's
   *  complaint stated as a fraction: he pressed a button, a year went by, and the feed can only
   *  reach back into the last few weeks of it. */
  sincePrev: number
  coveredWeeks: number
  /** ⭐⭐ THE COUNTERFACTUAL: what the SAME rows would look like if the snapshot's window were spent
   *  on news rather than on rows Home throws away. `snapshotEvents` takes the last 60 rows of ANY
   *  kind and Home then drops every `expense` and `income` – so the window's budget is spent five
   *  parts in six on the Money screen's rows, which the Money screen does not even read from here
   *  (`snapshot.financialEvents` is its own slice). Same ledger, same prune, one different window. */
  cfRows: number
  cfSpan: number
  cfCovered: number
  cfGenerational: number
}

/** A row that says the field has GENERATIONS – a champion in a first or a last season, a farewell,
 *  the turnover line, the intake line, or (second pass) the digest the freeze now writes at rest. */
function isGenerational(e: WorldEvent): boolean {
  return (
    e.text.includes('season on tour') ||
    e.text.startsWith('\u{1F44B}') ||
    e.text.startsWith('The tour turns over') ||
    e.text.startsWith('\u{1F30D}') ||
    e.text.includes('joined the professional tour')
  )
}

function bump(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1)
}

/** A coarse "what is this row about" bucket, read off the text. Deliberately dumb: the point is to
 *  separate rows about HER from rows about THE WORLD, which is the whole of the owner's complaint. */
function topicOf(e: WorldEvent, kidName: string): string {
  const t = e.text
  if (e.match !== undefined) return 'her match (replayable)'
  if (t.includes(' won the ') && t.includes('first season on tour')) return 'THE WORLD: a champion in a first season'
  if (t.includes(' won the ') && t.includes('last season on tour')) return 'THE WORLD: a champion in a last season'
  if (t.startsWith('🏆 ') && t.includes(' won the ')) return 'THE WORLD: a tour champion'
  if (t.startsWith('The tour turns over')) return 'THE WORLD: the season turnover'
  if (t.includes('joined the professional tour')) return 'THE WORLD: the intake'
  if (t.includes('retired') || t.includes('farewell')) return 'THE WORLD: a retirement'
  if (t.includes('turned professional') || t.includes('joins the')) return 'THE WORLD: an arrival'
  if (t.includes(kidName)) return 'her own life'
  return 'other'
}

function walkToFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng; label: string } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng, label: `${preset.background}-${i}` }
  }
  return null
}

/** ⚠⚠ THE SECOND PAUSE, AND WITHOUT IT THIS FILE MEASURES NOTHING (found on the collected tree,
 *  26.08). This probe was written on a branch where a college year paused only for her birthday.
 *  Round 26 #6 – merged since – teaches `resumeFromCollege` to pause on the championship as well and
 *  to RETURN `['college-league']` rather than spend the year, so a walk that answers the cake and
 *  not the draw sheet refuses every press after the first league week: the run above this fix put
 *  all twelve presses of every career at the SAME week (324), reported the freeze span as 208 weeks
 *  because it reads `untilWeek - fromWeek`, and divided real rows by imaginary weeks. The player
 *  answers it with «Skip all rounds» then «Continue»; these are those two commands. */
function answerLeagueReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

/** One career, four years, exactly as the Home shell's «Another year» spends them. */
function walkCollege(at: { world: WorldState; rng: Rng; label: string }): FreezeReport | null {
  const world = structuredClone(at.world)
  const rng = at.rng
  answerFork(world, 'college')
  for (let gapW = 0; gapW < 54 && world.ending === null; gapW++) stepCareerWeek(world, rng, POLICIES[0])
  const college = world.college
  if (!college) return null
  const fromWeek = college.fromWeek
  const untilWeek = college.untilWeek
  // ⚠ THE ROWS ARE COLLECTED AS THEY ARE WRITTEN, not read back at the end: `pruneEvents` runs
  // inside the freeze and would silently eat the early years before anybody counted them. The
  // high-water id is the only honest cursor (`addEvent` ids are monotonic).
  const written: WorldEvent[] = []
  const rests: RestRow[] = []
  let cursor = world.events.length ? Math.max(...world.events.map((e) => e.id)) : 0
  const collect = (): void => {
    for (const e of world.events) if (e.id > cursor) written.push(e)
    if (world.events.length) cursor = Math.max(cursor, ...world.events.map((e) => e.id))
  }
  for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    collect()
    // ⭐⭐ THE REST STATE – THIS IS THE SCREEN HE IS LOOKING AT. Between two presses of «Another
    // year» the college Home shell is drawn off exactly this snapshot window, so the honest measure
    // of «пустота» is not what the freeze WROTE, it is what is inside the last `SNAPSHOT_EVENTS`
    // rows at rest and survives Home's filter.
    // ⚠ THE REAL SNAPSHOT AND NOT `slice(-60)` (second pass). Round 26 #7 changed what the UI is
    // handed – `snapshotEvents` unions the kept MATCH rows back in on top of the positional window –
    // so a probe that keeps slicing measures a screen that no longer exists.
    const window = toSnapshot(world).events
    const shown = window.filter(readsAsNews)
    const ordinary = world.events.filter((e) => !e.keep && e.match === undefined)
    const printed = homeOrder(shown)
    const ages = printed.map((e) => world.week - e.week).sort((a, b) => a - b)
    // The counterfactual window: the newest SNAPSHOT_EVENTS rows Home would actually PRINT, taken
    // out of the same live ledger, instead of the newest SNAPSHOT_EVENTS rows of any kind.
    const cf = homeOrder(world.events.filter(readsAsNews).slice(-SNAPSHOT_EVENTS))
    const prevWeek = rests.length > 0 ? rests[rests.length - 1].week : fromWeek
    const inSpan = (list: WorldEvent[]) => new Set(list.filter((e) => e.week > prevWeek).map((e) => e.week)).size
    rests.push({
      sincePrev: world.week - prevWeek,
      coveredWeeks: inSpan(printed),
      cfRows: cf.length,
      cfSpan: cf.length > 0 ? world.week - cf[cf.length - 1].week : 0,
      cfCovered: inSpan(cf),
      cfGenerational: cf.filter(isGenerational).length,
      week: world.week,
      shown: shown.length,
      weeks: new Set(shown.map((e) => e.week)).size,
      rows: printed.length,
      topAge: printed.length > 0 ? world.week - printed[0].week : -1,
      secondAge: printed.length > 1 ? world.week - printed[1].week : -1,
      preCollege: printed.filter((e) => e.week < fromWeek).length,
      secondIsPreCollege: printed.length > 1 && printed[1].week < fromWeek,
      freshRows: printed.filter((e) => world.week - e.week <= 4).length,
      medianAge: ages.length > 0 ? ages[Math.floor(ages.length / 2)] : -1,
      world: shown.filter((e) => topicOf(e, world.profile.kidName).startsWith('THE WORLD')).length,
      oldest: window.length ? window[0].week : world.week,
      keep: world.events.filter((e) => e.keep).length,
      evidence: world.events.filter((e) => !e.keep && e.match !== undefined).length,
      rest: ordinary.length,
      restFrom: ordinary.length ? ordinary[0].week : world.week,
      generational: shown.filter(isGenerational).length,
    })
    if (DUMP && press === 3) {
      console.log(`\n  ⭐ VERBATIM – the News card at week ${world.week} (${at.label}), exactly as Home groups it:`)
      const byWeek = new Map<number, string[]>()
      for (const e of shown) (byWeek.get(e.week) ?? byWeek.set(e.week, []).get(e.week)!).push(`[${e.type}] ${e.text}`)
      for (const [w, lines] of [...byWeek.entries()].sort((a, b) => b[0] - a[0])) {
        console.log(`      W${w}`)
        for (const l of lines) console.log(`        ${l}`)
      }
      console.log('')
    }
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    answerLeagueReveal(world)
  }
  collect()
  if (DUMP) {
    const world10 = written.filter((e) => e.text.startsWith('👋') || e.text.startsWith('The tour turns over') || e.text.includes('joined the professional tour'))
    console.log(`  ⭐ THE TOUR'S OWN VOICE inside the freeze – ${world10.length} rows:`)
    for (const e of world10) console.log(`      W${e.week}  ${e.text}`)
    console.log('')
  }
  const inSpan = written.filter((e) => e.week >= fromWeek && e.week < untilWeek)
  const news = inSpan.filter(readsAsNews)
  const writtenByType = new Map<string, number>()
  const newsByType = new Map<string, number>()
  const newsByTopic = new Map<string, number>()
  for (const e of inSpan) bump(writtenByType, e.type)
  for (const e of news) {
    bump(newsByType, e.type)
    bump(newsByTopic, topicOf(e, world.profile.kidName))
  }
  const liveIds = new Set(world.events.map((e) => e.id))
  const snapIds = new Set(world.events.slice(-SNAPSHOT_EVENTS).map((e) => e.id))
  return {
    label: at.label,
    fromWeek,
    untilWeek,
    weeks: untilWeek - fromWeek,
    writtenByType,
    newsByType,
    newsByTopic,
    weeksWithNews: new Set(news.map((e) => e.week)).size,
    survived: news.filter((e) => liveIds.has(e.id)).length,
    inSnapshot: news.filter((e) => snapIds.has(e.id)).length,
    endTotal: world.events.length,
    endKept: world.events.filter((e) => e.keep).length,
    rests,
  }
}

// =================================================================================================
const t0 = Date.now()
const forks: Array<{ world: WorldState; rng: Rng; label: string }> = []
for (let k = 0; forks.length < CAREERS && k < CAREERS * 4; k++) {
  const at = walkToFork(PRESETS[k % PRESETS.length], k)
  if (at) forks.push(at)
}
const reports: FreezeReport[] = []
for (const at of forks) {
  const r = walkCollege(at)
  if (r) reports.push(r)
}

console.log(`\n⭐⭐⭐ WHAT THE FEED RECEIVES DURING THE FREEZE – ${reports.length} careers × ${ENDINGS.collegeYears} years`)
console.log(`  EVENTS_CAP = ${EVENTS_CAP}   SNAPSHOT_EVENTS = ${SNAPSHOT_EVENTS}   Home drops type=expense|income\n`)

const totalWeeks = reports.reduce((s, r) => s + r.weeks, 0)
const seasons = totalWeeks / WEEKS_PER_YEAR
const sum = (pick: (r: FreezeReport) => number) => reports.reduce((s, r) => s + pick(r), 0)
const merge = (pick: (r: FreezeReport) => Map<string, number>) => {
  const out = new Map<string, number>()
  for (const r of reports) for (const [k, v] of pick(r)) out.set(k, (out.get(k) ?? 0) + v)
  return [...out.entries()].sort((a, b) => b[1] - a[1])
}

const writtenTotal = merge((r) => r.writtenByType).reduce((s, [, v]) => s + v, 0)
const newsTotal = merge((r) => r.newsByType).reduce((s, [, v]) => s + v, 0)
console.log(`  freeze span                    ${totalWeeks} weeks over ${reports.length} careers (${seasons.toFixed(0)} college seasons)`)
console.log(`  rows WRITTEN inside the freeze ${pad(writtenTotal, 6)}   ${(writtenTotal / totalWeeks).toFixed(2)} / week`)
console.log(`  ...that Home would SHOW        ${pad(newsTotal, 6)}   ${(newsTotal / totalWeeks).toFixed(2)} / week   ${pct(newsTotal, writtenTotal)} of them`)
console.log(`  weeks with at least one        ${pad(sum((r) => r.weeksWithNews), 6)}   ${pct(sum((r) => r.weeksWithNews), totalWeeks)} of freeze weeks\n`)

console.log(`  ${padE('written, by type', 26)}${pad('rows', 8)}${pad('/season', 10)}   shown on Home?`)
console.log(`  ${'-'.repeat(70)}`)
for (const [k, v] of merge((r) => r.writtenByType)) {
  const shown = k !== 'expense' && k !== 'income'
  console.log(`  ${padE(k, 26)}${pad(v, 8)}${pad((v / seasons).toFixed(1), 10)}   ${shown ? 'yes' : 'NO – filtered out'}`)
}

console.log(`\n  ${padE('the news rows, by topic', 34)}${pad('rows', 8)}${pad('/season', 10)}`)
console.log(`  ${'-'.repeat(56)}`)
for (const [k, v] of merge((r) => r.newsByTopic)) console.log(`  ${padE(k, 34)}${pad(v, 8)}${pad((v / seasons).toFixed(1), 10)}`)

console.log(`\n  ⭐ AND WHAT IS STILL THERE WHEN SHE GRADUATES`)
console.log(`     freeze news rows written        ${pad(newsTotal, 6)}`)
console.log(`     ...surviving pruneEvents        ${pad(sum((r) => r.survived), 6)}   ${pct(sum((r) => r.survived), newsTotal)}`)
console.log(`     ...inside the snapshot window   ${pad(sum((r) => r.inSnapshot), 6)}   ${pct(sum((r) => r.inSnapshot), newsTotal)}`)
console.log(`     events array at graduation      ${pad((sum((r) => r.endTotal) / reports.length).toFixed(0), 6)} rows mean (${(sum((r) => r.endKept) / reports.length).toFixed(0)} kept)`)

console.log(`\n  ⭐⭐ THE SCREEN AT REST – the News card the moment «Another year» hands control back`)
console.log(`  ${padE('career', 14)}${pad('press', 6)}${pad('week', 6)}${pad('rows shown', 12)}${pad('groups', 8)}${pad('field', 7)}${pad('spans', 8)}${pad('keep', 6)}${pad('match', 7)}${pad('ordinary', 10)}${pad('news depth', 12)}${pad('generational', 14)}`)
console.log(`  ${'-'.repeat(104)}`)
for (const r of reports) {
  for (let i = 0; i < r.rests.length; i++) {
    const x = r.rests[i]
    console.log(
      `  ${padE(r.label, 14)}${pad(i + 1, 6)}${pad(x.week, 6)}${pad(x.shown, 12)}${pad(x.weeks, 8)}${pad(x.world, 7)}${pad(`${x.week - x.oldest}w`, 8)}` +
        `${pad(x.keep, 6)}${pad(x.evidence, 7)}${pad(x.rest, 10)}${pad(`${x.week - x.restFrom}w`, 12)}${pad(x.generational, 14)}`,
    )
  }
}
const allRests = reports.flatMap((r) => r.rests)
console.log(`  ${'-'.repeat(104)}`)
console.log(
  `  ${padE('MEAN', 14)}${pad('', 7)}${pad('', 7)}` +
    `${pad((allRests.reduce((s, x) => s + x.shown, 0) / allRests.length).toFixed(1), 18)}` +
    `${pad((allRests.reduce((s, x) => s + x.weeks, 0) / allRests.length).toFixed(1), 13)}` +
    `${pad((allRests.reduce((s, x) => s + x.world, 0) / allRests.length).toFixed(1), 17)}` +
    `${pad(`${(allRests.reduce((s, x) => s + (x.week - x.oldest), 0) / allRests.length).toFixed(0)}w`, 8)}` +
    `${pad((allRests.reduce((s, x) => s + x.keep, 0) / allRests.length).toFixed(0), 6)}` +
    `${pad((allRests.reduce((s, x) => s + x.evidence, 0) / allRests.length).toFixed(0), 7)}` +
    `${pad((allRests.reduce((s, x) => s + x.rest, 0) / allRests.length).toFixed(0), 10)}` +
    `${pad(`${(allRests.reduce((s, x) => s + (x.week - x.restFrom), 0) / allRests.length).toFixed(0)}w`, 12)}` +
    `${pad((allRests.reduce((s, x) => s + x.generational, 0) / allRests.length).toFixed(1), 14)}`,
)
console.log(`  rest states with NO generational line  ${allRests.filter((x) => x.generational === 0).length} / ${allRests.length}`)
console.log(`  rest states with ZERO news rows  ${allRests.filter((x) => x.shown === 0).length} / ${allRests.length}`)

// =================================================================================================
// ⭐⭐⭐ THE SECOND PASS'S QUESTION – RECENCY, AND WHICH OF THE THREE CANDIDATES DOMINATES.
//
// The owner, having read the first report: «у меня в ленте предпоследняя новость были из мира "до
// колледжа" на протяжении всей учебы, а последняя жёлтым про её учебный год». Row counts do not
// answer that; ages do. Three candidates, separated by number rather than by argument:
//   (1) THE WINDOW – a positional slice over a ledger a freeze week barely writes to reaches back
//       months, so the same old rows keep showing.
//   (2) THE RATE – a once-a-season line against eight rest states in 208 weeks is invisible by
//       arithmetic, whatever the window does.
//   (3) THE SURFACE – the college screens may not draw the list the way the tour Home does.
// =================================================================================================
const mean = (pick: (x: RestRow) => number) => allRests.reduce((s, x) => s + pick(x), 0) / allRests.length
console.log(`\n  ⭐⭐⭐ RECENCY – HOW OLD THE ROWS AT THE TOP OF THE FEED ARE (his «предпоследняя»)`)
console.log(`  ${padE('career', 14)}${pad('press', 6)}${pad('week', 6)}${pad('rows', 6)}${pad('row1 age', 10)}${pad('row2 age', 10)}${pad('median', 8)}${pad('<=4w old', 10)}${pad('pre-college', 13)}${pad('row2 pre-coll', 15)}`)
console.log(`  ${'-'.repeat(98)}`)
for (const r of reports) {
  for (let i = 0; i < r.rests.length; i++) {
    const x = r.rests[i]
    console.log(
      `  ${padE(r.label, 14)}${pad(i + 1, 6)}${pad(x.week, 6)}${pad(x.rows, 6)}${pad(`${x.topAge}w`, 10)}${pad(`${x.secondAge}w`, 10)}` +
        `${pad(`${x.medianAge}w`, 8)}${pad(x.freshRows, 10)}${pad(x.preCollege, 13)}${pad(x.secondIsPreCollege ? 'YES' : 'no', 15)}`,
    )
  }
}
console.log(`  ${'-'.repeat(98)}`)
console.log(
  `  ${padE('MEAN', 14)}${pad('', 12)}${pad(mean((x) => x.rows).toFixed(1), 6)}${pad(`${mean((x) => x.topAge).toFixed(1)}w`, 10)}` +
    `${pad(`${mean((x) => x.secondAge).toFixed(1)}w`, 10)}${pad(`${mean((x) => x.medianAge).toFixed(1)}w`, 8)}${pad(mean((x) => x.freshRows).toFixed(1), 10)}` +
    `${pad(mean((x) => x.preCollege).toFixed(1), 13)}${pad(`${allRests.filter((x) => x.secondIsPreCollege).length}/${allRests.length}`, 15)}`,
)
console.log(`\n  ⭐⭐ THE SPAN HE JUST PAID FOR – one press moves ${mean((x) => x.sincePrev).toFixed(0)} weeks on average`)
console.log(`     weeks of that span with a row on the card   ${mean((x) => x.coveredWeeks).toFixed(1)} of ${mean((x) => x.sincePrev).toFixed(0)}` +
  `   = ${((100 * mean((x) => x.coveredWeeks)) / mean((x) => x.sincePrev)).toFixed(0)}%`)
console.log(`\n  ⭐⭐ THE COUNTERFACTUAL WINDOW – the same 60 rows, spent on news instead of on money`)
console.log(`     rows printed        ${mean((x) => x.rows).toFixed(1)}  ->  ${mean((x) => x.cfRows).toFixed(1)}`)
console.log(`     reach (weeks)       ${mean((x) => x.week - x.oldest).toFixed(0)}w ->  ${mean((x) => x.cfSpan).toFixed(0)}w`)
console.log(`     weeks of the span   ${mean((x) => x.coveredWeeks).toFixed(1)}  ->  ${mean((x) => x.cfCovered).toFixed(1)}   of ${mean((x) => x.sincePrev).toFixed(0)}`)
console.log(`     generational rows   ${mean((x) => x.generational).toFixed(1)}  ->  ${mean((x) => x.cfGenerational).toFixed(1)}` +
  `   (rest states with none: ${allRests.filter((x) => x.generational === 0).length} -> ${allRests.filter((x) => x.cfGenerational === 0).length})`)
console.log(`\n  ⭐ THE THREE CANDIDATES, WEIGHED`)
console.log(`  (1) THE WINDOW   the printed feed spans ${mean((x) => x.week - x.oldest).toFixed(0)}w back at rest; its OLDEST row is ${mean((x) => x.week - x.oldest).toFixed(0)}w old,`)
console.log(`                   its median row ${mean((x) => x.medianAge).toFixed(1)}w, and ${allRests.filter((x) => x.preCollege > 0).length}/${allRests.length} rest states print a row from before enrolment.`)
console.log(`  (2) THE RATE     ${(newsTotal / totalWeeks).toFixed(2)} news rows / freeze week -> ${mean((x) => x.rows).toFixed(1)} rows on the card and`)
console.log(`                   ${mean((x) => x.freshRows).toFixed(1)} of them from the last four weeks; ${allRests.filter((x) => x.freshRows === 0).length}/${allRests.length} rest states have NOTHING from the last four weeks.`)
console.log(`  (3) THE SURFACE  measured in tests/component – Home draws #diary-news on a college week too.`)

console.log(`\n  per career:`)
console.log(`  ${padE('career', 14)}${pad('weeks', 7)}${pad('written', 9)}${pad('news', 7)}${pad('wks+', 6)}${pad('end rows', 10)}`)
for (const r of reports) {
  const w = [...r.writtenByType.values()].reduce((s, v) => s + v, 0)
  const n = [...r.newsByType.values()].reduce((s, v) => s + v, 0)
  console.log(`  ${padE(r.label, 14)}${pad(r.weeks, 7)}${pad(w, 9)}${pad(n, 7)}${pad(r.weeksWithNews, 6)}${pad(r.endTotal, 10)}`)
}
console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`)
