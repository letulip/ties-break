// Lane F gap-fill (26.09, baseline 03d92221): assign EVERY tests and tools clone of Phase 0's jscpd
// runs (60/6, jscpd@5.1.2) to one family by ordered regex rules over its fragment, so the class
// verdict (merge / deliberate / coincidental) covers all 610 + 267 clones, not only the ten largest
// clusters. First matching rule wins; what matches none is reported as the residue, with examples.
// Run: node clone-families.mjs <RAW/jscpd> > RAW/F/clone-families.txt
import { readFileSync } from 'node:fs'

const RAW = process.argv[2]

const RULES = {
  tests: [
    ['rng key recorder (`vi.mock` of engine/rng, hoisted per file)', 'deliberate', /vi\.mock\([^)]*rng|recordKeys|keys\.push\(|rngFromSeed\s*=\s*\(/],
    ['localStorage shim / mount fixture', 'merge → F-03', /defineProperty\(globalThis,\s*'localStorage'|getItem\s*[:(]|setItem\s*[:(]|removeItem/],
    ['life fixtures (LoveEpisode, married, episode, weekAtAge)', 'merge → F-01 / F-02', /publicWrong|LoveEpisode|function (married|episode|weekAtAge)\b|kidAgeExact|kidAgeAt\(/],
    ['signed ad paper / WATCH', "merge → F-01", /kind:\s*'ad'|WATCH\b|shootWeeks|termWeeks/],
    ['SeasonEvent fixture', 'merge → F-01', /travelCostCents|giveKidPoints/],
    ['world walk (tick + skip / close / enter)', 'merge → F-02', /tickWeek\(|advanceWeeks\(|skipTournament\(|closeTournament\(|pendingTournament|enterEvent\(/],
    ['career poke / createWorld fixture', 'merge → F-02', /createWorld\(|careerAt|careerSnapshot|toSnapshot\(/],
    ['source readers / comment strippers / pins', 'merge → F-02 (strippers); pins coincidental', /codeOnly|stripComments|readFileSync|worldSource|diarySource|componentLogic|componentFile|engineModuleSource|region\(|scriptCodeOf|codeOf\(/],
    ['component mount + interaction', 'coincidental (parallel scenarios over one API)', /mount\(|flushPromises|wrapper\.|\.trigger\(|findAll\(|find\(/],
    ['parallel assertion blocks', 'coincidental', /expect\(/],
  ],
  tools: [
    ['argOf / CLI args block', 'merge → F-04', /argOf|process\.argv|--seeds|--weeks/],
    ['stats / format helpers (money, pct, median, quantile, pad)', 'merge → F-04', /function (money|pct|pctl|median|mean|quantile|pad|fmt)\b|toLocaleString|padStart|padEnd/],
    ['career walk via econ-bench / local tick loop', 'merge → F-02', /openCareer|stepCareerWeek|tickWeek\(|advanceWeeks\(|skipTournament\(|closeTournament\(|pendingTournament|createWorld\(/],
    ['report printing (console tables)', 'coincidental', /console\.log|process\.stdout\.write/],
  ],
}

for (const run of ['tests', 'tools']) {
  const dups = JSON.parse(readFileSync(`${RAW}/${run}/jscpd-report.json`, 'utf8')).duplicates
  const fam = new Map()
  const residue = []
  let totalLines = 0
  for (const d of dups) {
    totalLines += d.lines
    const rule = RULES[run].find(([, , re]) => re.test(d.fragment))
    if (!rule) { residue.push(d); continue }
    const key = `${rule[0]} | ${rule[1]}`
    const f = fam.get(key) ?? { n: 0, lines: 0, files: new Set() }
    f.n++; f.lines += d.lines; f.files.add(d.firstFile.name); f.files.add(d.secondFile.name)
    fam.set(key, f)
  }
  console.log(`\n== ${run}: ${dups.length} clones, ${totalLines} duplicated lines ==`)
  for (const [k, f] of [...fam].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`${String(f.n).padStart(4)} clones ${String(f.lines).padStart(5)} lines ${String(f.files.size).padStart(4)} files | ${k}`)
  }
  const rl = residue.reduce((s, d) => s + d.lines, 0)
  console.log(`${String(residue.length).padStart(4)} clones ${String(rl).padStart(5)} lines | residue (no rule)`)
  const same = residue.filter((d) => d.firstFile.name === d.secondFile.name)
  const cross = residue.filter((d) => d.firstFile.name !== d.secondFile.name)
  const worldy = cross.filter((d) => /world\.|WorldState|Rng\b/.test(d.fragment))
  console.log(`   residue split: ${same.length} same-file (${same.reduce((s, d) => s + d.lines, 0)} lines); ${cross.length} cross-file, of which ${worldy.length} touch a WorldState / Rng (${worldy.reduce((s, d) => s + d.lines, 0)} lines) and ${cross.length - worldy.length} do not`)
  for (const d of residue.slice(0, 12)) {
    console.log(`   residue e.g. ${d.firstFile.name}:${d.firstFile.start}-${d.firstFile.end} ↔ ${d.secondFile.name}:${d.secondFile.start} (${d.tokens} tok) :: ${d.fragment.split('\n')[0].slice(0, 90)}`)
  }
}
