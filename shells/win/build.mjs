// `npm run shell:win` (root) lands here: npm --prefix shells/win run build.
// One command, four loud steps: dist/ → electron-builder → Steam depot files → artifact list.
//
//   SHELL_SKIP_DIST=1       reuse the dist/ already on disk (the orchestrator will set it once the
//                           first shell has built it – dist/ is built ONCE, every shell wraps it)
//   SHELL_WIN_TARGETS=dir   skip the NSIS installer (default: nsis,dir – nsis = the installer,
//                           dir = win-unpacked/, which is what the Steam depot ships)
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const out = path.resolve(here, '..', 'out', 'win')
const config = JSON.parse(readFileSync(path.resolve(here, '..', 'config.json'), 'utf8'))
const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version
const targets = (process.env.SHELL_WIN_TARGETS ?? 'nsis,dir')
  .split(',')
  .map((target) => target.trim())
  .filter(Boolean)

function step(label, command, args, cwd) {
  console.log(`\n[shell:win] ${label}`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`[shell:win] FAILED: ${label} (exit ${result.status ?? result.signal})`)
    process.exit(result.status || 1)
  }
}

// 0. This project's own install, before anything slow. Without it `npx electron-builder` would not
//    fail, it would fetch an UNPINNED electron-builder from the registry and wrap the app in that.
const builderBin = path.join(here, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder')
if (!existsSync(builderBin)) {
  console.error('[shell:win] FAILED: shells/win has no install – run `npm --prefix shells/win ci` first')
  process.exit(1)
}

// 1. The dist the shell wraps. Rebuilt unless told it is fresh: a stale dist in an installer is worse
//    than a slow build.
if (process.env.SHELL_SKIP_DIST === '1') {
  console.log('\n[shell:win] SHELL_SKIP_DIST=1 – reusing dist/')
} else {
  step('dist/  (npx vite build)', 'npx', ['vite', 'build'], root)
}
if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('[shell:win] FAILED: dist/index.html is missing – run `npx vite build` at the repo root')
  process.exit(1)
}

// 2. electron-builder. Names and ids come from electron-builder.config.cjs, which reads
//    shells/config.json; the exe cannot be rewritten (icon, version info) off Windows without wine,
//    so a mac build ships Electron's own exe icon and the runtime window icon covers the taskbar.
step(
  `electron-builder --win ${targets.join(' ')}`,
  'npx',
  ['electron-builder', '--win', ...targets, '--x64', '--config', 'electron-builder.config.cjs', '--publish', 'never'],
  here,
)

// 3. The Steam depot scripts, rendered from steam/*.vdf with the ids in shells/config.json. They sit
//    beside win-unpacked/ because Valve resolves ContentRoot relative to the script.
const steamOut = path.join(out, 'steam')
mkdirSync(steamOut, { recursive: true })
const tokens = {
  '@STEAM_APP_ID@': config.steamAppId || '0',
  '@STEAM_DEPOT_ID@': config.steamDepotId || '0',
  '@PRODUCT_NAME@': config.productName,
  '@VERSION@': version,
}
for (const name of ['app_build.vdf', 'depot_build.vdf']) {
  let text = readFileSync(path.join(here, 'steam', name), 'utf8')
  for (const [token, value] of Object.entries(tokens)) text = text.split(token).join(value)
  writeFileSync(path.join(steamOut, name), text)
}
if (!config.steamAppId || !config.steamDepotId) {
  console.warn('\n[shell:win] steamAppId / steamDepotId are empty in shells/config.json – the depot scripts carry 0 and steamcmd will refuse them until both are filled')
}

// 4. What came out.
const sizeOf = (entry) =>
  statSync(entry).isDirectory() ? readdirSync(entry).reduce((sum, name) => sum + sizeOf(path.join(entry, name)), 0) : statSync(entry).size
console.log(`\n[shell:win] shells/out/win/`)
for (const name of readdirSync(out).sort()) {
  console.log(`  ${name.padEnd(40)} ${(sizeOf(path.join(out, name)) / 1048576).toFixed(1).padStart(8)} MB`)
}
