// A one-season trace of the Weekly Story: what each week WAS, which painting it drew, and the note.
//
// Run: npx vite-node tools/week-story-trace.ts [seed] [weeks]
//
// Why a script and not a test: the deliverable for W5 is a week-by-week reading a person can look at
// and see the SEASON'S SHAPE, plus an honest count of the weeks that came out EMPTY (owner, 30.07,
// asked whether 52 stories would be a chore: «нет, ЕСЛИ неделя без турниров чем-то занята и это
// наглядно» – so the bar is content, not taps). A test asserts; this reports.
//
// EMPTY is defined here in the same terms the screen is: the frame could have been any week
// (`training`), the scrap fell back to the ledger line (no weekNote / travelNote), the Highlights card
// had nothing but expense flavour lines, and the training read was quiet. A week that fails all four
// is a week the player is asked to look at for nothing.
import {
  bookVacation,
  closeTournament,
  createWorld,
  decideKnock,
  enterEvent,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { weekSceneArtUrl } from '../src/art/weeks'
import { isExamWeek, isOffSeasonWeek } from '../src/engine/season/calendar'

const seed = process.argv[2] ?? 'week-story-w5'
const weeks = Number(process.argv[3] ?? 52)

const world = createWorld(seed)
const rng = rngFromSeed(world.seed)
const rows: string[] = []
let empty = 0
let stories = 0

/** the filename, without the directory noise */
const stem = (url: string) => url.split('/').pop() ?? url

// Two family weeks away, which the AI never books for him: one mid-season and one INSIDE the December
// block, so the trace shows both the holiday's own frame and the holiday outranking the off-season.
for (const [week, pkg] of [
  [Number(process.argv[4] ?? 28), 'seaside'],
  [50, 'grandma'],
] as [number, string][]) {
  try {
    bookVacation(world, week, pkg)
  } catch (err) {
    console.log(`(could not book ${pkg} in W${week}: ${(err as Error).message})`)
  }
}

for (let i = 0; i < weeks; i++) {
  // enter everything she is allowed to enter – a busy career, which is the honest case
  for (const e of world.season) {
    if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
      try {
        enterEvent(world, e.id)
      } catch {
        /* blocked entries are not this trace's business */
      }
    }
  }
  tickWeek(world, rng)
  // answer a knock the way a careful parent would: rest it
  if (world.knock !== null && world.knock.choice === null) decideKnock(world, 'rest')
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
  const snap = toSnapshot(world)
  const d = snap.diary
  const f = d.facts
  stories++

  const what: string[] = []
  if (f.playedTournament) what.push(`tournament${f.resultTier ? ` ${f.resultTier}` : ''}`)
  if (f.injured) what.push(`layoff ${f.injured.weeksRemaining}/${f.injured.totalWeeks}w`)
  if (f.vacationWeek) what.push('holiday')
  if (f.knockChoice) what.push(`knock:${f.knockChoice} (${f.knockPart})`)
  if (f.playedPractice) what.push('friendly')
  if (isExamWeek(snap.week, snap.week >= snap.schoolEndsWeek)) what.push('exams')
  if (isOffSeasonWeek(snap.week)) what.push('off-season')
  if (what.length === 0) what.push(`training ${f.trainPct}/${100 - f.trainPct}`)

  const note = d.travelNote ?? d.weekNote
  const ledger = snap.events.find((e) => e.week === snap.week && e.type === 'expense')?.text ?? ''
  const beats = snap.events.filter(
    (e) => e.week === snap.week && ['match', 'milestone', 'injury', 'recovery', 'info'].includes(e.type),
  ).length

  const genericFrame = d.scene.kind === 'week' && !isOffSeasonWeek(snap.week)
  const isEmpty = genericFrame && note === null && beats === 0 && snap.trainingRead === null
  if (isEmpty) empty++

  rows.push(
    [
      `W${String(snap.week).padStart(2, '0')}`,
      what.join(' + ').padEnd(30),
      `${d.scene.kind}:${stem(weekSceneArtUrl(d.scene))}`.padEnd(46),
      isEmpty ? 'EMPTY  ' : beats > 0 ? `${beats} beat` : '       ',
      note ?? `(ledger) ${ledger}`,
    ].join(' | '),
  )
}

console.log(rows.join('\n'))
console.log(`\n${stories} weeks, ${empty} EMPTY (${((empty / stories) * 100).toFixed(0)}%)`)
