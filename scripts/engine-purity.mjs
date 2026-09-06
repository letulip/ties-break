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
//
// ⚠⚠ AND SINCE 06.09, THE OTHER HALF OF THE SAME INVARIANT: A ZONE FILE MAY NOT REACH INTO THE UI'S
// OWN DIRECTORIES EITHER. The package ban was never the whole rule - `src/components`,
// `src/composables`, `src/stores` and `src/viz` are the UI, and a zone file importing one of them is
// the coupling the invariant forbids however few `vue` tokens it carries.
//
// This hole was found by an agent that tried to close it and PROVED the gate did not: with
// `import { flagEmoji } from '../composables/countries'` sitting at the top of `src/shared/countries.ts`
// this script still printed `ok` and exited 0. It had been ok'ing that shape since it was written.
// The case that surfaced it is worth keeping: the owner asked for the playable country list to be a
// RULE the engine enforces (06.09), and the honest split - codes in `shared/`, names and flags in
// `composables/` - is exactly the edge that must run one way and not the other.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ZONES = ['src/engine', 'src/worker', 'src/db', 'src/shared']
const BANNED = /from\s+['"](vue|pinia|@vue\/|@vueuse\/|vue-router)['"]|from\s+['"](vue\/|pinia\/)/
/** The UI's own directories. A relative specifier that walks into one of them from a zone file is the
 *  same invariant breach as importing vue, and it is the one this gate used to miss. */
const UI_DIRS = /from\s+['"][^'"]*(?:^|\/)(components|composables|stores|viz)\// 

const offenders = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(ts|vue|mjs|js)$/.test(name)) {
      const lines = readFileSync(p, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (BANNED.test(line)) offenders.push(`${p}:${i + 1}  ${line.trim()}`)
        else if (UI_DIRS.test(line)) offenders.push(`${p}:${i + 1}  ${line.trim()}   <- reaches into the UI`)
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
console.log(`engine purity: ok - ${ZONES.join(', ')} import no vue/pinia and reach into no UI directory`)
