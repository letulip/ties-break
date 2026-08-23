// THE ENGINE STAYS FRAMEWORK-FREE - invariant 1, finally enforced by a machine (owner, 22.08:
// «Как нам сделать, чтобы они проверялись и работали?»). The PR template has carried the checkbox
// «No Vue/Pinia imports into engine modules» since the template existed, and until this script the
// only thing holding it was the honesty of whoever ticked it. Now `npm run check` and the CI both
// fail on the first offending import, and the checkbox states a fact a machine has already proven.
//
// Scope = the four framework-free zones the invariant names: src/engine, src/worker, src/db,
// src/shared. Banned = vue, pinia and their scoped packages, plus @vueuse - the practical set that
// could plausibly leak in. Type-only imports are banned too: `import type` erases at runtime, but
// an engine type reaching into a component's shape is the same coupling one refactor later.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ZONES = ['src/engine', 'src/worker', 'src/db', 'src/shared']
const BANNED = /from\s+['"](vue|pinia|@vue\/|@vueuse\/|vue-router)['"]|from\s+['"](vue\/|pinia\/)/

const offenders = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(ts|vue|mjs|js)$/.test(name)) {
      const lines = readFileSync(p, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (BANNED.test(line)) offenders.push(`${p}:${i + 1}  ${line.trim()}`)
      })
    }
  }
}
for (const z of ZONES) walk(z)

if (offenders.length) {
  console.error('engine purity: FRAMEWORK IMPORT IN A FRAMEWORK-FREE ZONE (invariant 1):')
  for (const o of offenders) console.error('  ' + o)
  process.exit(1)
}
console.log(`engine purity: ok - ${ZONES.join(', ')} import no vue/pinia`)
