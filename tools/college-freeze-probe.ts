// ⭐⭐ THE FREEZE AUDIT – does the world stop playing while she is at college, and does a career
// that stopped heal? (round 24, wave 1 / A1, docs/plans/college-the-flow.md §0.)
//
//   npx vite-node tools/college-freeze-probe.ts -- --arms all [--seeds 2]
//   npx vite-node tools/college-freeze-probe.ts -- --from ~/Downloads/x_w257.tsave --arms all
//   npx vite-node tools/college-freeze-probe.ts -- --save ~/Downloads/x_w474.tsave --heal 52
//
// ⚠⚠ THE STATE THIS FILE EXISTS TO REPRODUCE. The owner's save, taken the week she graduated
// (week 474), holds **0 calendar events, 1 result row in the whole world, and her at #1 of a
// 200-row junior table on which NOBODY holds a point.** A career driven through the same
// `resumeFromCollege` the worker calls comes out with 164 events and 2,289 rows. Three of his seven
// observations follow from that one state – the empty calendar, the World Tour 500 that admitted an
// unranked girl (the engine believes she is world #1), and the silence of four years – so the first
// question of the round is WHICH PATH PRODUCES IT.
//
// ⭐⭐⭐ THE ANSWER THIS FILE FOUND, 21.08, AND IT IS NOT A SAVE, A TIER OR AN OLD BUILD.
//
//   **AN ENTRY THAT IS STILL OUTSTANDING WHEN THE FORK IS ANSWERED KILLS THE WORLD.**
//
// His save names the culprit out loud: `pendingTournament = 5-w270-wta500`, an event scheduled for
// week 270 – FOUR WEEKS AFTER his fork at 266 – whose finale he was still looking at on week 474.
// The chain, every link of it reproduced below on current code:
//
//   1. he entered a World Tour 500 a few weeks out, which is simply what a parent does;
//   2. he answered the fork with «college», and that latches an ENDING over the whole app;
//   3. `resumeFromCollege` ticks the year with no player in it. On the entry's play week `tickWeek`
//      finds `scheduled.find(e => world.entries.includes(e.id))` – there is NO `inCollege` guard on
//      that line – and stashes a `computeShadowTournament` in `world.pendingTournament`;
//   4. that reveal can never be answered: the epilogue screen REPLACES the app shell, and
//      `resumeFromCollege` has no `pendingTournament` guard – unlike `advanceWeeks`, which refuses
//      outright, and unlike the worker's dev `tick`, which was given one on exactly this reasoning;
//   5. ⭐ and from that week on `tickWeek` skips the whole of step 5-6 – `if (!world.pendingTournament)`
//      – so `recomputeRankAndMilestones`, `housekeep` (and with it `ensureSeason`, `pruneResults`,
//      `pruneEvents`), `settleMandatoryQuota`, `maybeFireSeasonWrapUp` and `resolveEndings` never run
//      again. The calendar is never rebuilt, the week marches past every event still on it, and the
//      world plays no tennis for the two hundred weeks that are left.
//   6. On graduation week he finally sees the reveal and plays it. `finalizeTournament` runs the
//      deferred `housekeep` ONCE: `pruneResults` deletes every result older than 52 weeks (all of
//      them – 1 row survives, her own), and `ensureSeason` finds `maxWeek === world.week`, so
//      `coveredChunk === horizonChunk`, builds NOTHING, and then filters the past away – **season 0**.
//      Nobody holds a junior point, so competition ranking ties all 200 rows at **#1**, her included.
//
// ⭐ THE SEAM THE PLAN NAMED WAS THE RIGHT ONE, one caller up: `ensureSeason` is what rebuilds the
// calendar and drops dead entries, `housekeep` is its only weekly caller, and a live reveal is what
// stops `housekeep`. One root, three symptoms – #7, #2d and #4.
//
// THE ARMS, and the point of the boring ones is that they did NOT reproduce it:
//   direct      – answerFork + four `resumeFromCollege` calls. The plan's own baseline.
//   clean       – ⭐ THE CONTROL: the same, with `world.entries` emptied at the fork. Healthy every
//                 time, which is what makes the entry the cause rather than a correlate.
//   stale       – ⭐⭐ THE REPRODUCTION: one entry booked 2 / 4 / 8 weeks out, then the fork answered.
//   roundtrip   – ...with `encodeExportFile`/`decodeExportFile` between every year. The plan's prime
//                 suspect – it is what a player does – and it changes NOTHING either way.
//   dbtrip      – ...with `compressWorld`/`decompressWorld` between every year, the autosave door,
//                 which skips the bounds walk and the spine. Also nothing.
//   tiers       – each of the three places. Also nothing: state, national and private are identical.
//   early       – `endCollegeEarly` after one year instead of four. Same trap, fewer years.
//   worker      – the real message sequence over `sim.worker.ts`, through `mutate`'s structuredClone
//                 and the real autosave commit. Identical to `direct`, because neither the handler
//                 nor the command carries a reveal guard.
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched, no save is written, and the owner's files are
// opened read-only and never copied.
// ⚠ SIDE-EFFECT IMPORT, TOP LEVEL, AND IT HAS TO BE BOTH. The worker arm's `sim.worker` reads
// IndexedDB while it evaluates, so the fake has to be installed before that dynamic import – and a
// bare `import 'x'` is also the only form that does not need the package's own typings, which
// `fake-indexeddb`'s "exports" map hides from `moduleResolution: bundler`.
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import {
  resumeFromCollege,
  endCollegeEarly,
  tickWeek,
  enterEvent,
  revealTournamentRound,
  closeTournament,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { decodeExportFile, encodeExportFile, compressWorld, decompressWorld } from '../src/engine/saveCodec'
import { COLLEGE_TIER_ORDER } from '../src/engine/collegeOffer'
import { fullRanking, kidLadderRank, rankingFor } from '../src/engine/world/ladder'
import { entryCapUsage, proEntryCapUsage } from '../src/engine/world/entryCaps'
import { kidAgeYears } from '../src/engine/world/age'
import { resumeMain, type Rng } from '../src/engine/rng'
import { KID_ID } from '../src/engine/world/constants'
import type { WorldState } from '../src/engine/world'
import type { CollegeTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const strOf = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = numOf('seeds', 2)
const HEAL = numOf('heal', 0)
const ARMS = (strOf('arms') ?? 'direct').split(',')
const wants = (a: string) => ARMS.includes('all') || ARMS.includes(a)
const SAVE = strOf('save')
const FROM = strOf('from')
const POLICY = POLICIES[1]
const WALK_CAP = 400

const expand = (p: string) => (p.startsWith('~') ? p.replace('~', homedir()) : p)
const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n: number) => '-'.repeat(n)

// =================================================================================================
// THE HEALTH READOUT – one row per world, and every column is one of the owner's symptoms.
// =================================================================================================
interface Health {
  week: number
  /** events left on `world.season` – his save says 0, a healthy graduation says ~164 */
  season: number
  /** ...of which still in the future, which is what the calendar screen can draw */
  future: number
  /** rows in `world.results` – the whole world's, not hers. His save says 1. */
  results: number
  kidResults: number
  entries: number
  /** entries pointing at an event that is NOT on the calendar – §2d's stale W500 commitment */
  orphanEntries: number
  /** ⭐ THE CACHED NUMBER THE SCREENS DRAW – `world.kidRank`, which is what told him she was #1.
   *  Deliberately beside `ladderRank`, whose contract is the opposite ("null IS NOT #1"): his save
   *  answers 1 and null to the same question, and both answers are on this row. */
  kidRank: number
  ladderRank: number | null
  kidRankWta: number | null
  /** the reveal nobody could answer – the week its event was scheduled for, or null */
  pending: string | null
  itfRows: number
  /** ⭐ THE DEGENERACY ITSELF: rows on the junior table holding a single point. Zero = everybody
   *  ties at #1 and she is "world number one" without hitting a ball. */
  itfScored: number
  wtaRows: number
  wtaScored: number
  cohort: number
  ageLo: number
  ageHi: number
  /** how far the MAIN stream has been drawn. ⭐ THE FORENSIC COLUMN: a week that really ticked costs
   *  hundreds of draws, so a freeze that skipped its weeks leaves a position hundreds of thousands
   *  short of its own week number. */
  rngDraws: number
  collegeYears: number
  ending: string | null
}

function healthOf(world: WorldState): Health {
  const itf = fullRanking(world)
  const wta = rankingFor(world, 'wta')
  const ids = new Set(world.season.map((e) => e.id))
  const ages = world.cohort.map((c) => c.ageYears)
  return {
    week: world.week,
    season: world.season.length,
    future: world.season.filter((e) => e.week > world.week).length,
    results: world.results.length,
    kidResults: world.results.filter((r) => r.playerId === KID_ID).length,
    entries: world.entries.length,
    orphanEntries: world.entries.filter((id) => !ids.has(id)).length,
    kidRank: world.kidRank,
    ladderRank: kidLadderRank(world, 'itf'),
    kidRankWta: kidLadderRank(world, 'wta'),
    pending: world.pendingTournament
      ? `${world.pendingTournament.eventId}${world.pendingTournament.finished ? '*' : ''}`
      : null,
    itfRows: itf.length,
    itfScored: itf.filter((r) => r.points > 0).length,
    wtaRows: wta.length,
    wtaScored: wta.filter((r) => r.points > 0).length,
    cohort: world.cohort.length,
    ageLo: ages.length ? Math.min(...ages) : 0,
    ageHi: ages.length ? Math.max(...ages) : 0,
    rngDraws: world.rngMain?.n ?? -1,
    collegeYears: world.college?.years.length ?? 0,
    ending: world.ending ? world.ending.type : null,
  }
}

const HEAD =
  `  ${padE('arm', 26)}${pad('week', 6)}${pad('season', 8)}${pad('future', 8)}${pad('results', 9)}` +
  `${pad('entries', 8)}${pad('kidRank', 9)}${pad('itf/scored', 12)}${pad('ages', 9)}${pad('rngDraws', 10)}  pendingTournament`

function healthLine(label: string, h: Health): string {
  return (
    `  ${padE(label, 26)}${pad(h.week, 6)}${pad(h.season, 8)}${pad(h.future, 8)}${pad(h.results, 9)}` +
    `${pad(h.entries, 8)}${pad(h.kidRank, 9)}${pad(`${h.itfRows}/${h.itfScored}`, 12)}` +
    `${pad(`${h.ageLo}-${h.ageHi}`, 9)}${pad(h.rngDraws, 10)}  ${h.pending ?? '–'}`
  )
}

// =================================================================================================
// GETTING TO THE FORK – from a seed, or from a real save handed in with --from.
// =================================================================================================
interface AtFork {
  world: WorldState
  rng: Rng
  label: string
}

function forkFromSeed(preset: (typeof PRESETS)[number], i: number): AtFork | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) {
      return { world, rng, label: `${preset.background}-${i}` }
    }
  }
  return null
}

/** ⚠ THE SAVE IS NEVER MUTATED AND NEVER COPIED – it is decoded into memory, and every arm gets its
 *  own structuredClone of the world at the fork. */
async function forkFromSave(path: string): Promise<AtFork> {
  const world = await decodeExportFile(new Uint8Array(readFileSync(expand(path))))
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < WALK_CAP; w++) {
    if (world.fork !== null && world.fork.answer === null) break
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') break
  }
  if (world.fork === null || world.fork.answer !== null) {
    throw new Error(`${path} did not reach an open fork within ${WALK_CAP} weeks`)
  }
  return { world, rng, label: `save w${world.week}` }
}

/** A fresh copy of a world-at-the-fork, so every arm starts from exactly the same state. ⚠ The RNG
 *  is re-resumed from the CLONE's own `rngMain`, which is the worker's own contract: the position is
 *  persisted state, so two arms opened from one save draw the same sequence. */
function armFrom(at: AtFork): { world: WorldState; rng: Rng } {
  const world = structuredClone(at.world)
  return { world, rng: resumeMain(world.rngMain) }
}

// =================================================================================================
// THE ARMS
// =================================================================================================
type Trip = 'none' | 'export' | 'db'

/** One college career: answer the fork with `tier`, then spend the years – optionally travelling
 *  through a save codec between each one, which is the arm that asks whether a reload empties it. */
async function walkCollege(
  at: AtFork,
  tier: CollegeTier | undefined,
  trip: Trip,
  leaveAfter: number | null,
  /** ⭐ THE CONTROL. Releasing every outstanding entry at the fork is the ONE difference between a
   *  career that comes out of college playing and one that comes out of a dead world – so the arm
   *  that does it is the other half of the proof, not a convenience. */
  clearEntries = false,
): Promise<Health> {
  let { world, rng } = armFrom(at)
  if (clearEntries) world.entries = []
  answerFork(world, 'college', tier)
  for (let y = 0; y < 8 && world.ending?.type === 'college'; y++) {
    if (leaveAfter !== null && (world.college?.years.length ?? 0) >= leaveAfter) {
      endCollegeEarly(world)
      break
    }
    resumeFromCollege(world, rng)
    if (trip !== 'none' && world.ending?.type === 'college') {
      world = trip === 'export'
        ? await decodeExportFile(await encodeExportFile(world))
        : await (async () => {
            const { payload, checksum } = await compressWorld(world)
            return decompressWorld(payload, checksum)
          })()
      rng = resumeMain(world.rngMain)
    }
  }
  return healthOf(world)
}

// =================================================================================================
// ⭐⭐⭐ THE ARM THAT REPRODUCES IT – AN ENTRY MADE BEFORE THE FREEZE, PLAYED INSIDE IT.
// =================================================================================================
//
// The owner's save carries `pendingTournament = 5-w270-wta500`, an event scheduled for week 270 –
// FOUR WEEKS AFTER the fork at 266 – and he was still looking at its finale on week 474. That is the
// whole of it:
//
//   1. he entered a World Tour 500 a few weeks out, exactly as a parent does;
//   2. he answered the fork with «college», which latches an ENDING over the whole app;
//   3. `resumeFromCollege` ticks the year with no player in it, so on the entry's play week
//      `tickWeek` finds `scheduled.find(e => world.entries.includes(e.id))` – there is NO `inCollege`
//      guard on that line – and stashes a `computeShadowTournament` in `world.pendingTournament`;
//   4. the reveal can never be answered: the epilogue screen REPLACES the app shell, and
//      `resumeFromCollege` (unlike `advanceWeeks` and unlike the worker's dev `tick`) has no
//      `pendingTournament` guard at all, so it ticks straight past it;
//   5. ⭐ and from that week on `tickWeek` skips the whole of step 5-6 – `if (!world.pendingTournament)`
//      – so `recomputeRankAndMilestones`, `housekeep` (and with it `ensureSeason`, `pruneResults`,
//      `pruneEvents`), `settleMandatoryQuota`, `maybeFireSeasonWrapUp` and `resolveEndings` never run
//      again. The calendar is never rebuilt, the week marches past every event still on it, and the
//      world plays no tennis for two hundred weeks.
//
// `--stale-in N` is how many weeks after the fork the entry's play week falls; his was 4.
function bookAnEntryInsideTheFreeze(world: WorldState, weeksOut: number): string | null {
  const cand = world.season
    .filter((e) => e.week > world.week && e.week <= world.week + weeksOut && world.week <= e.deadlineWeek)
    .sort((a, b) => b.week - a.week)
  for (const e of cand) {
    try {
      enterEvent(world, e.id)
      return e.id
    } catch {
      // a rung her rank or her purse refuses – try the next one down. ⚠ NOTHING IS FORCED: if the
      // engine refuses every candidate the arm reports "no entry" rather than writing an id nobody
      // could have committed, which would be reproducing our own fiction instead of his career.
    }
  }
  return null
}

/** The four years with a live entry in them, and then – optionally – the player finally clicking
 *  through the finale, which is the state his exported save was taken in. */
function walkWithStaleEntry(at: AtFork, weeksOut: number, finishReveal: boolean): { h: Health; entry: string | null } {
  const { world, rng } = armFrom(at)
  const entry = bookAnEntryInsideTheFreeze(world, weeksOut)
  answerFork(world, 'college', undefined)
  for (let y = 0; y < 8 && world.ending?.type === 'college'; y++) resumeFromCollege(world, rng)
  if (finishReveal && world.pendingTournament) {
    for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
      revealTournamentRound(world)
    }
    if (world.pendingTournament?.finished) closeTournament(world)
  }
  return { h: healthOf(world), entry }
}

// =================================================================================================
// THE WORKER ARM – the same four years over the real message protocol.
// =================================================================================================
interface Reply {
  id: number
  ok: boolean
  error?: string
  revision?: number
  bytes?: ArrayBuffer
}

async function walkCollegeThroughWorker(at: AtFork, tier: CollegeTier | undefined): Promise<Health> {
  const { workerHarness } = await import('../tests/helpers/workerHarness')
  let revision = 0
  const { send, workerGlobal } = workerHarness<Reply>((r) => {
    if (r.ok && r.revision !== undefined) revision = r.revision
  })
  await import('../src/worker/sim.worker')
  if (!workerGlobal.onmessage) throw new Error('the worker never registered its handler')

  const seeded = armFrom(at).world
  const bytes = (await encodeExportFile(seeded)).slice()
  const imported = await send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
  if (!imported.ok) throw new Error(`importSave refused: ${imported.error}`)

  const answered = await send({ type: 'answerFork', answer: 'college', tier, baseRevision: revision })
  if (!answered.ok) throw new Error(`answerFork refused: ${answered.error}`)
  for (let y = 0; y < 8; y++) {
    const res = await send({ type: 'resumeFromCollege', baseRevision: revision })
    if (!res.ok) break
  }
  const out = await send({ type: 'exportSave' })
  if (!out.ok) throw new Error(`exportSave refused: ${out.error}`)
  return healthOf(await decodeExportFile(new Uint8Array(out.bytes!)))
}

// =================================================================================================
// Q2 – DOES A BROKEN CAREER HEAL? Play the save forward and watch every symptom.
// =================================================================================================
function healOne(world: WorldState, rng: Rng, weeks: number, marks: number[]): Array<[number, Health]> {
  const out: Array<[number, Health]> = []
  for (let w = 1; w <= weeks; w++) {
    if (world.ending) break
    stepCareerWeek(world, rng, POLICY)
    if (marks.includes(w)) out.push([w, healthOf(world)])
  }
  if (!marks.includes(weeks)) out.push([weeks, healthOf(world)])
  return out
}

/** ⚠ THE NO-ACTION ARM. `stepCareerWeek` enters tournaments AND closes an open reveal, so it heals
 *  the table with her own results in it; this one only ticks. If the calendar and the field come back
 *  here too, the repair is the world's own and needs no player.
 *
 *  ⚠⚠ `closeFinale` IS THE WHOLE POINT OF THE PAIR. A save exported with the finale card still on
 *  screen carries a non-null `pendingTournament`, and `tickWeek` skips the ENTIRE housekeeping step
 *  while one is open – so a world left in that state does not heal at all, however long it ticks. */
function healQuietly(world: WorldState, rng: Rng, weeks: number, closeFinale: boolean): Health {
  if (closeFinale && world.pendingTournament?.finished) closeTournament(world)
  for (let w = 0; w < weeks; w++) {
    if (world.ending) break
    tickWeek(world, rng)
  }
  return healthOf(world)
}

// =================================================================================================
const t0 = Date.now()
const main = async (): Promise<void> => {
  // -------------------------------------------------------------------------- Q2 / the forensic
  if (SAVE) {
    const world = await decodeExportFile(new Uint8Array(readFileSync(expand(SAVE))))
    const h = healthOf(world)
    console.log(`\n⭐⭐ THE SAVE, AS IT STANDS – ${SAVE}`)
    console.log(HEAD)
    console.log(`  ${rule(125)}`)
    console.log(healthLine('as loaded', h))
    console.log(
      `\n  schema v${world.schemaVersion} · week ${world.week} · she is ${kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)}` +
        ` · ending ${h.ending ?? 'none'} · college years ${h.collegeYears}` +
        ` · wta ${h.wtaRows} rows / ${h.wtaScored} scored (her #${h.kidRankWta ?? '–'})`,
    )
    if (world.college) {
      console.log(
        `  college: from w${world.college.fromWeek} until w${world.college.untilWeek} done ${world.college.doneWeek ?? '–'}`,
      )
      for (const y of world.college.years) {
        console.log(
          `    year ${y.index}: w${y.fromWeek}–${y.untilWeek} · rank ${y.startRank ?? '–'} → ${y.endRank ?? '–'}` +
            ` · skill ${y.startSkill.toFixed(1)} → ${y.endSkill.toFixed(1)} · call-up ${y.callUp ? `w${y.callUp.week}` : 'none'}`,
        )
      }
    }
    console.log(`  entries: ${world.entries.length ? world.entries.join(', ') : 'none'} (orphans ${h.orphanEntries})`)
    const capJ = entryCapUsage(world, world.week)
    const capP = proEntryCapUsage(world, world.week)
    console.log(`  entry caps: junior ${capJ.used}/${capJ.limit} (${capJ.remaining} left) · pro ${capP.used}/${capP.limit} (${capP.remaining} left)`)
    // ⭐ THE HOUSEKEEPING WITNESSES. `housekeep` is the only weekly caller of `ensureSeason`, and
    // `tickWeek` skips the whole of step 5-6 while a reveal is open – so a stuck `pendingTournament`
    // is the one state in which a world can tick for years without its calendar ever being rebuilt.
    // These four counters are what a skipped `housekeep` leaves behind.
    console.log(
      `  pendingTournament ${world.pendingTournament ? `${world.pendingTournament.eventId} finished=${world.pendingTournament.finished}` : 'null'}` +
        ` · cached kidRank ${world.kidRank} / dom ${world.kidRankDomestic ?? '–'} / wta ${world.kidRankWta ?? '–'}` +
        ` · cohort ${h.cohort}`,
    )
    console.log(
      `  events ${world.events.length} · financeWeeks ${world.financeWeeks.length} · seasonHistory ${world.seasonHistory.length}` +
        ` · nextEventId ${world.nextEventId} · internationalEntryWeeks ${world.internationalEntryWeeks.length} · proEntryWeeks ${world.proEntryWeeks.length}`,
    )
    const spanOf = (list: readonly { week: number }[]) =>
      list.length ? `w${Math.min(...list.map((e) => e.week))}–${Math.max(...list.map((e) => e.week))}` : 'none'
    console.log(`  feed spans ${spanOf(world.events)} · finance spans ${spanOf(world.financeWeeks)}`)
    console.log(`\n  the last 14 rows of the feed – what those four years actually wrote:`)
    for (const e of world.events.slice(-14)) console.log(`    w${pad(e.week, 4)} ${padE(e.type, 11)} ${e.text.slice(0, 96)}`)

    if (HEAL > 0) {
      console.log(`\n⭐⭐ Q2 – PLAYED FORWARD ${HEAL} WEEKS (policy «${POLICY.label}»: she enters what she can afford)`)
      console.log(HEAD)
      console.log(`  ${rule(125)}`)
      console.log(healthLine('week 0', h))
      const played = structuredClone(world)
      for (const [w, hh] of healOne(played, resumeMain(played.rngMain), HEAL, [1, 2, 4, 6, 13, 26, 39, 52])) {
        console.log(healthLine(`+${w} weeks`, hh))
      }
      const quiet = structuredClone(world)
      console.log(healthLine(`+${HEAL} no action`, healQuietly(quiet, resumeMain(quiet.rngMain), HEAL, true)))
      const stuck = structuredClone(world)
      console.log(healthLine(`+${HEAL} finale NOT closed`, healQuietly(stuck, resumeMain(stuck.rngMain), HEAL, false)))
      const cj = entryCapUsage(played, played.week)
      const cp = proEntryCapUsage(played, played.week)
      console.log(
        `\n  after ${HEAL} weeks: she is ${kidAgeYears(played.week, played.profile.birthMonth, played.profile.birthDay)}` +
          ` · ending ${played.ending ? played.ending.type : 'none'} · entry caps junior ${cj.used}/${cj.limit} · pro ${cp.used}/${cp.limit}` +
          ` · seasonHistory ${world.seasonHistory.length} → ${played.seasonHistory.length} · wta ${healthOf(played).wtaRows} rows / ${healthOf(played).wtaScored} scored (her #${healthOf(played).kidRankWta ?? '–'})`,
      )
      // ⚠ WHAT DOES NOT COME BACK, AND IT IS A RECORD RATHER THAN A STATE. `maybeFireSeasonWrapUp`
      // is inside the block a live reveal skips, so every season that passed inside the freeze is
      // missing from `seasonHistory` for ever – four rows of a nine-season career. Nothing reads a
      // missing row as a broken world (the plateau check folds what is there), and the rows resume
      // from the next wrap, so this is a hole in her album, not a career that cannot be played.
    }
    console.log()
    return
  }

  // -------------------------------------------------------------------------- Q1 / the arms
  const forks: AtFork[] = []
  if (FROM) {
    forks.push(await forkFromSave(FROM))
  } else {
    for (const preset of [PRESETS[3], PRESETS[7]]) {
      for (let i = 0; i < SEEDS; i++) {
        const at = forkFromSeed(preset, i)
        if (at) forks.push(at)
      }
    }
  }
  if (!forks.length) throw new Error('no career reached the fork')

  console.log(`\n⭐⭐ Q1 – WHICH PATH EMPTIES THE WORLD? ${forks.length} career(s) at the fork, arms: ${ARMS.join(',')}`)
  console.log(`   ⚠ the state being hunted: season 0 · results 1 · itf 200/0 · itfRank 1`)
  for (const at of forks) {
    console.log(`\n  ⭐ ${at.label} – at the fork on week ${at.world.week}`)
    console.log(HEAD)
    console.log(`  ${rule(125)}`)
    console.log(healthLine('AT THE FORK', healthOf(at.world)))
    if (wants('direct')) console.log(healthLine('direct x4', await walkCollege(at, undefined, 'none', null)))
    if (wants('clean')) {
      console.log(healthLine('direct x4, NO entry open', await walkCollege(at, undefined, 'none', null, true)))
    }
    if (wants('roundtrip')) console.log(healthLine('export codec each year', await walkCollege(at, undefined, 'export', null)))
    if (wants('dbtrip')) console.log(healthLine('autosave codec each year', await walkCollege(at, undefined, 'db', null)))
    if (wants('roundtrip') || wants('clean')) {
      console.log(healthLine('export codec, NO entry', await walkCollege(at, undefined, 'export', null, true)))
    }
    if (wants('tiers')) {
      for (const tier of COLLEGE_TIER_ORDER) {
        console.log(healthLine(`tier ${tier}`, await walkCollege(at, tier, 'none', null)))
        console.log(healthLine(`tier ${tier} + reload`, await walkCollege(at, tier, 'export', null)))
      }
    }
    if (wants('stale')) {
      for (const out of [2, 4, 8]) {
        const a = walkWithStaleEntry(at, out, false)
        console.log(healthLine(`stale entry +${out}w`, a.h) + `   ${a.entry ?? 'NO ENTRY BOOKED'}`)
        const b = walkWithStaleEntry(at, out, true)
        console.log(healthLine(`  ...finale clicked`, b.h))
      }
    }
    if (wants('early')) {
      console.log(healthLine('endCollegeEarly after 1', await walkCollege(at, undefined, 'none', 1)))
      console.log(healthLine('endCollegeEarly after 3', await walkCollege(at, undefined, 'none', 3)))
    }
    if (wants('worker')) {
      try {
        console.log(healthLine('worker messages', await walkCollegeThroughWorker(at, undefined)))
      } catch (err) {
        console.log(`  ${padE('worker messages', 24)}FAILED – ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }
  console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)
}

await main()
