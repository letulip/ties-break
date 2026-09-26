// Lane B probe (26.09 review, baseline 03d92221). Read-only.
// Reads `interface WorldState` (src/engine/world/state.ts) with the repo's TypeScript, splits its members
// into required and optional, then counts, over src/engine + src/worker code (comment lines dropped),
// the reads `world.<field> ??` / `w.<field> ??` / `world.<field>?.` of each REQUIRED field – a default or
// an optional chain on a field the type says is always there.
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const src = readFileSync('src/engine/world/state.ts', 'utf8')
const sf = ts.createSourceFile('state.ts', src, ts.ScriptTarget.Latest, true)
const required = new Set(), optional = new Set()
sf.forEachChild((n) => {
  if (ts.isInterfaceDeclaration(n) && n.name.text === 'WorldState') {
    for (const m of n.members) if (ts.isPropertySignature(m) && m.name) {
      const name = m.name.getText(sf)
      const nullable = m.type && /\bnull\b/.test(m.type.getText(sf))
      ;(m.questionToken ? optional : required).add(name)
      if (!m.questionToken && nullable) required.add(name) // still required; `??` on it may be a null default (reported separately)
    }
  }
})
const nullableRequired = new Set()
sf.forEachChild((n) => {
  if (ts.isInterfaceDeclaration(n) && n.name.text === 'WorldState') {
    for (const m of n.members) if (ts.isPropertySignature(m) && !m.questionToken && m.type && /\bnull\b/.test(m.type.getText(sf))) nullableRequired.add(m.name.getText(sf))
  }
})
const files = execSync("git ls-files 'src/engine/*.ts' 'src/engine/**/*.ts' 'src/worker/*.ts'", { encoding: 'utf8' }).trim().split('\n')
const counts = new Map()
const sites = new Map()
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  let inBlock = false
  lines.forEach((raw, i) => {
    const t = raw.trim()
    if (inBlock) { if (t.includes('*/')) inBlock = false; return }
    if (t.startsWith('//') || t.startsWith('*')) return
    if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; return }
    for (const m of raw.matchAll(/\b(?:world|w|save|candidate)\.([A-Za-z_]+)\s*(\?\?|\?\.)/g)) {
      const field = m[1]
      if (!required.has(field)) continue
      if (f === 'src/engine/migrations.ts') continue // migrations read pre-shape saves by design
      const key = `${field} ${m[2]}${nullableRequired.has(field) ? ' (nullable)' : ''}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
      if (!sites.has(key)) sites.set(key, `${f}:${i + 1}`)
    }
  })
}
const rows = [...counts.entries()].sort((a, b) => b[1] - a[1])
const nonNull = rows.filter(([k]) => !k.includes('(nullable)'))
console.log(`WorldState members: ${required.size} required, ${optional.size} optional`)
console.log(`reads with ?? or ?. on a REQUIRED non-nullable field (migrations.ts excluded): ${nonNull.reduce((s, [, c]) => s + c, 0)} sites over ${nonNull.length} field/operator pairs`)
for (const [k, c] of nonNull) console.log(`  ${String(c).padStart(3)}  ${k.padEnd(34)} e.g. ${sites.get(k)}`)
const nul = rows.filter(([k]) => k.includes('(nullable)'))
console.log(`(on required-but-nullable fields, where ?? / ?. is legitimate: ${nul.reduce((s, [, c]) => s + c, 0)} sites)`)
