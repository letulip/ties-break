// The provenance note the brief asks for, built from the take rather than typed: source saves with
// their hashes, the revision the app was captured at, the UI route every shot stood on, and an
// explicit line for editorial cards (there are none – every fact is carried by a real screen).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import crypto from 'node:crypto'

const DIR = process.argv[2] || '/tmp/devlog9'
const OUT = process.argv[3] || 'out/two-careers-provenance.md'
const SAVES = process.argv.slice(4)
const log = JSON.parse(fs.readFileSync(`${DIR}/log.json`, 'utf8'))

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const rev = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
const branch = execFileSync('git', ['branch', '--show-current']).toString().trim()
const dirty = execFileSync('git', ['status', '--porcelain', '--', 'src']).toString().trim()

const ROUTE = {
  kid: 'Home → her page (the avatar on Home’s header)',
  'slam-peek': 'Trophies → the Grand Slam shelf',
  coach: 'Home → her page → the Personality / Condition / Mood and After-school / Friends / Coach tiles',
  radar: 'Home → her page → the SKILLS panel (the shipped fog-of-war radar and the coach’s per-axis notes)',
  first250: 'Trophies → the WT250 shelf',
  season5: 'Stats → Professional → SEASON BY SEASON, the 2035 row',
  history: 'Stats → Professional → SEASON BY SEASON, every recorded row',
  shelves: 'Trophies → the WT500, WT1000 and Grand Slam shelves',
  logo: 'the stage’s own card, drawn from public/logo-tb-line-light.svg',
  'logo-tail': 'the stage’s own card, plus public/logo-tb-line-2-light.svg',
}

let t = 0
const rows = log.marks.map((m) => {
  const shot = log.shots.find((s) => s.key === m.key)
  const r = { key: m.key, in: t, out: t + m.hold, route: ROUTE[m.key] ?? '?', crop: shot?.crop }
  t += m.hold
  return r
})

const lines = []
lines.push('# Two talented players. Two very different careers. – provenance\n')
lines.push('A retrospective of two recorded saves. Not a replay from childhood, not a controlled seed')
lines.push('experiment, and nothing here was re-simulated: both panels are the shipped app reading the')
lines.push('owner’s own export files.\n')
lines.push('## Source saves\n')
lines.push('| side | file | bytes | sha256 | seed | week | schema |')
lines.push('| --- | --- | --- | --- | --- | --- | --- |')
for (const [i, p] of SAVES.entries()) {
  const side = i === 0 ? 'LEFT · Zoe Slavic' : 'RIGHT · Alice Martin'
  const seed = i === 0 ? 'prologue-kbakekls' : 'prologue-pmb8nzwh'
  const week = i === 0 ? 517 : 405
  lines.push(`| ${side} | \`${p.split('/').pop()}\` | ${fs.statSync(p).size} | \`${sha(p).slice(0, 32)}…\` | \`${seed}\` | ${week} | 77 |`)
}
lines.push('\nBoth files were opened read-only and passed as base64 into a throwaway browser profile.')
lines.push('Nothing was written back; the hashes above are the files as they still are on disk. No save')
lines.push('bytes are in the repository, and neither career touched the browser the owner plays in.\n')
lines.push('## Captured revision\n')
lines.push(`- branch \`${branch}\` at \`${rev}\``)
lines.push(`- \`src/\` ${dirty ? 'HAS UNCOMMITTED CHANGES – see below\n\n\`\`\`\n' + dirty + '\n\`\`\`' : 'is clean at that revision – the app in shot is the build, unmodified'}`)
lines.push(`- the careers were installed through the shipped \`decodeExportFile\` (the import door: size cap,`)
lines.push('  header, declared version, checksum, bounded inflation, bounds walk, migration ladder) and the')
lines.push('  shipped `adoptAutosave` – the same pair `importSave` itself commits with.')
lines.push(`- left panel \`${log.stage?.urls?.a ?? 'http://localhost:5843/'}\`, right panel \`${log.stage?.urls?.b ?? 'http://localhost:5844/'}\` – two origins, two databases.`)
lines.push(`- both panels laid out as a phone: ${log.panelA?.layoutWidth}×${log.panelA?.layoutHeight} and ${log.panelB?.layoutWidth}×${log.panelB?.layoutHeight}, \`matchMedia('(min-width: 768px)')\` false in both.\n`)
lines.push('## UI routes, shot by shot\n')
lines.push('| in | out | shot | the real screen it stands on |')
lines.push('| --- | --- | --- | --- |')
for (const r of rows) lines.push(`| ${r.in.toFixed(1)}s | ${r.out.toFixed(1)}s | ${r.key} | ${r.route} |`)
lines.push('\n## Historical editorial cards\n')
lines.push('**None.** Every fact in the script turned out to be carried by a real screen, so no card')
lines.push('labelled “Saved career record” was needed. What the film adds is text drawn OUTSIDE the two')
lines.push('windows and never over them: the floating caption, the two name labels with their context')
lines.push('line, and the small note under the panels.\n')
lines.push('## What could NOT be shown\n')
lines.push('- **No past match is replayed.** The diary keeps a rolling window of recent weeks, so stored')
lines.push('  match records exist for the last season of each save – but none of them belongs to any of the')
lines.push('  moments this script is about (the first WTA 250 titles, season 5, the Slam). Rule 8 says show')
lines.push('  the trophy or the milestone instead, and that is what the shelves shot does.')
lines.push('- **No skill numbers or ceilings are drawn.** The radar in shot 4 is the game’s own fog of war,')
lines.push('  untouched; the strength sentence over it is a developer observation and is labelled as one.')
lines.push('- **The coach line says “Current coach”.** Zoe has `coachId: null` now, but `coachEdge` records')
lines.push('  155 weeks with one across two seasons – so “self-coached” is her state at week 517, not a')
lines.push('  claim about her whole career.\n')
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true })
fs.writeFileSync(OUT, lines.join('\n'))
console.log('provenance ->', OUT)
