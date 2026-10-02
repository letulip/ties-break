// ⭐⭐ THE FIRST-NUMBER-ONE LATCH, MEASURED – round 45 #5 (B8).
//
//   npx vite-node tools/first-number-one-probe.ts [--careers N] [--weeks N] [--long 0|1]
//
// WHY IT EXISTS. The latch (`world.firstNo1`, v91) fires on `rank === 1 && points > 0` on a table, and the question a
// distribution can answer and an argument cannot is WHEN it fires on a real career: if the junior table's first #1 lands in
// a girl's first weeks (a table where almost nobody has scored yet), the album would print a page for an artefact of an empty
// field – the failure `bookkeeping.ts` documents for the milestones it removed («the first result rockets her to a single-digit
// rank»). So it walks N careers through the PUBLIC engine commands the UI uses and prints, per career, the week and age each
// latch was written at, and how often each table fired at all.
//
// MEASUREMENT ONLY. `resumeMain` + `stepCareerWeek` is `tools/album-spread-probe.ts`' own walk; the latch reads the table and
// writes only itself, so ZERO MAIN draws are added.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Policy } from './econ-bench'
import { drainLifeBeatsTallied } from './_lifeBeats'
import { answerBirthdayNeutral } from './_birthday'
import { answerFork, answerRetirement, kidAgeAt, pendingBirthday, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}
const CAREERS = argOf('careers', 18)
const WEEKS = argOf('weeks', 1_200)
const LONG_ARM = argOf('long', 1) === 1

/** `tools/album-spread-probe.ts`' drain, verbatim: a career stalls at every pending decision. */
function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeatsTallied(world)
    answerFork(world, 'continue')
  }
  drainLifeBeatsTallied(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  if (world.retirementOffer !== null) answerRetirement(world, LONG_ARM ? world.retirementOffer.final : true)
}

interface Row {
  label: string
  junior: { week: number; age: number } | null
  wta: { week: number; age: number } | null
  bestItf: number
  bestWta: number
  endAge: number
}

const rows: Row[] = []
for (let i = 0; i < CAREERS; i++) {
  const presetIx = i % PRESETS.length
  const index = 3 + Math.floor(i / PRESETS.length)
  const policy: Policy = POLICIES[1]
  const { world } = openCareer(PRESETS[presetIx], index, policy)
  const rng = resumeMain(world.rngMain)
  let bestItf = Infinity
  let bestWta = Infinity
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, policy)
    if (world.ending === null) answerWhateverIsOpen(world)
    bestItf = Math.min(bestItf, world.kidRank)
    bestWta = Math.min(bestWta, world.kidRankWta ?? Infinity)
    if (world.ending !== null) break
  }
  const at = (w: number | undefined) => (w === undefined ? null : { week: w, age: kidAgeAt(world, w) })
  rows.push({
    label: `${PRESETS[presetIx].background}/${index}`,
    junior: at(world.firstNo1?.junior),
    wta: at(world.firstNo1?.wta),
    bestItf,
    bestWta,
    endAge: world.ending ? world.ending.ageYears : kidAgeAt(world, world.week),
  })
}

const show = (x: { week: number; age: number } | null): string => (x === null ? '        –' : `w${String(x.week).padStart(4)} a${x.age}`)
console.log('career            junior #1          world #1         best ITF  best W  ends at')
for (const r of rows) {
  console.log(`${r.label.padEnd(16)}  ${show(r.junior)}      ${show(r.wta)}      ${String(r.bestItf).padStart(5)}   ${String(r.bestWta).padStart(5)}    age ${r.endAge}`)
}
const j = rows.filter((r) => r.junior !== null)
const w = rows.filter((r) => r.wta !== null)
const med = (xs: number[]) => (xs.length === 0 ? NaN : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)])
console.log(`\n${CAREERS} careers · junior #1 latched on ${j.length} (earliest age ${Math.min(...j.map((r) => r.junior!.age))}, median age ${med(j.map((r) => r.junior!.age))}, earliest week ${Math.min(...j.map((r) => r.junior!.week))})`)
console.log(`                   · world  #1 latched on ${w.length} (earliest age ${Math.min(...w.map((r) => r.wta!.age))}, median age ${med(w.map((r) => r.wta!.age))}, earliest week ${Math.min(...w.map((r) => r.wta!.week))})`)
