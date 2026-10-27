// The provenance note, built from the take: which fixture career each shot stands on, what the
// shipped resolver latched on it, and the two places the film had to place state rather than find it.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const DIR = process.argv[2] || '/tmp/endfilm4'
const OUT = process.argv[3] || 'out/no-good-ending-provenance.md'
const log = JSON.parse(fs.readFileSync(`${DIR}/log.json`, 'utf8'))
const rev = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
const branch = execFileSync('git', ['branch', '--show-current']).toString().trim()
const dirtySrc = execFileSync('git', ['status', '--porcelain', '--', 'src']).toString().trim()

const L = []
L.push('# No good ending. No bad ending. – provenance\n')
L.push('Eight endings, each latched by the shipped resolver on a career walked through the bench’s own')
L.push('harness. Nothing is re-simulated, no threshold, probability or ending rule is touched, and the')
L.push('owner’s own saves are never opened.\n')
L.push('## Captured revision\n')
L.push(`- branch \`${branch}\` at \`${rev}\` (the brief asks for \`6a7e70eb\` or newer; this is a descendant)`)
L.push(`- \`src/\` ${dirtySrc ? 'HAS UNCOMMITTED CHANGES:\n\n```\n' + dirtySrc + '\n```' : 'is clean at that revision – the app in shot is the build, unmodified'}`)
L.push('- the fixtures are installed through the shipped `decodeExportFile` + `adoptAutosave`, the same')
L.push('  pair `importSave` itself commits with, on a dev-server origin that is not the browser he plays in')
L.push(`- the phone in shot lays out at 414x896 and is scaled by a transform (\`${log.stage?.scale}\`), so every`)
L.push('  screen is the phone build\n')
L.push('## The twelve fixture careers\n')
L.push('| fixture | seed | week | ending the engine latched | its own detail |')
L.push('| --- | --- | --- | --- | --- |')
for (const [name, m] of Object.entries(log.installed)) {
  L.push(`| \`${name}\` | \`${m.seed}\` | ${m.week} | ${m.ending ?? '– (pre-latch)'} | ${m.detail ? m.detail.replace(/\|/g, '/') : '–'} |`)
}
L.push('\n## Where state was PLACED rather than found – the two disclosures\n')
L.push('**1. The fall’s two season figures are the brief’s, not the career’s.** The owner names them')
L.push('exactly – «#13 and 4,008 points to #59 and 1,584 points» – so they are written into that career’s')
L.push('season table and the SHIPPED `fallLeavingDue` is asked whether they are a fall. They are: 4,008 is')
L.push('over `fallPointsFloor`, 1,584 is under half of it, #59 is past double #13 and 46 places is past 30.')
L.push('That career (`bench-wealthy-53`) takes the fall door **on its own** – the walk came back with the')
L.push('ending already latched, the 1% coin having landed without anybody arranging it – so the latch is')
L.push('wound back one step, the rows are written, and the same resolver is asked again on the same coin.')
L.push('⚠ The W–L and CHAMPION/RUNNER-UP columns beside those two rows are still that season’s own, so a')
L.push('sharp eye will find a 15–26 record beside 4,008 points. Only the rank and the points were placed.\n')
L.push('**2. Her four exit lines are quoted, because no shipped screen can show them.**')
L.push('`resolveLeaving` writes `leavingLine(door, temperament)` into the diary as a kept milestone – and')
L.push('an ended career can never reach the news feed, because the epilogue replaces the shell. So the')
L.push('film reads the sentence out of each save’s own events and prints it in the caption lane. The four')
L.push('worlds differ in `world.temperament` and in nothing else: same career, same season, same door.\n')
L.push('## What was NOT staged\n')
L.push('- **The peak is a natural latch.** `bench-wealthy-98` reached its twelfth wrap at **age 25**, on the')
L.push('  paid table, **#3 in the world**, and `resolveLeaving` latched it inside the tick. Which career to')
L.push('  film was chosen by enumerating whose coin lands (`coin-search.ts`, a pure function of seed, door')
L.push('  and season) and then proving the DOOR was open too – casting, not tuning.')
L.push('- The other six endings were latched by `answerFork`, `answerRetirement` and `resolveEndings` on')
L.push('  careers that reached them on their own.\n')
L.push('## Shots and the screens they stand on\n')
let t = 0
L.push('| in | out | shot | fixture | screen |')
L.push('| --- | --- | --- | --- | --- |')
for (const m of log.marks) {
  const s = log.shots.find((x) => x.key === m.key)
  L.push(`| ${t.toFixed(1)}s | ${(t + m.hold).toFixed(1)}s | ${m.key} | ${s?.save ?? '–'} | ${s?.screen ?? '–'} |`)
  t += m.hold
}
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true })
fs.writeFileSync(OUT, L.join('\n') + '\n')
console.log('provenance ->', OUT)
