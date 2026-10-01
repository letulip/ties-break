// `npm run shell:ios` (root) lands here: npm --prefix shells/ios run build.
// One command, loud steps: dist/ → cap sync → the bridge injected into the COPY → xcodebuild (iOS
// Simulator, unsigned, no Apple account) → where the .app landed.
//
//   SHELL_SKIP_DIST=1   reuse the dist/ already on disk (the orchestrator sets it once the first shell
//                       has built it – dist/ is built ONCE, every shell wraps the same bytes)
//   --sync-only         dist → cap sync → inject, then stop. No Xcode needed: what you get is the project
//                       and the synced copy, which is what to review
//   --archive           the App Store route: a signed Release archive and its export, from the same sync
//                       and injection. NOT exercised yet – it needs your Apple Developer team, passed as
//                       APPLE_TEAM_ID (README, "The App Store route")
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const out = path.resolve(here, '..', 'out', 'ios')
const config = JSON.parse(readFileSync(path.resolve(here, '..', 'config.json'), 'utf8'))
const syncOnly = process.argv.includes('--sync-only')
const archive = process.argv.includes('--archive')

// The synced web app: Capacitor COPIES dist/ here, and the bridge goes into this copy only.
const publicDir = path.join(here, 'ios', 'App', 'App', 'public')
const distIndex = path.join(root, 'dist', 'index.html')
const BRIDGE_TAG = '<script src="shell-bridge.js"></script>'

function fail(message) {
  console.error(`[shell:ios] FAILED: ${message}`)
  process.exit(1)
}

function step(label, command, args, cwd, env) {
  console.log(`\n[shell:ios] ${label}`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
  if (result.status !== 0) {
    console.error(`[shell:ios] FAILED: ${label} (exit ${result.status ?? result.signal})`)
    process.exit(result.status || 1)
  }
}

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

// 0. Before anything slow. Without this project's own install `npx cap` would not fail, it would fetch an
//    UNPINNED Capacitor CLI from the registry and sync with that.
if (!existsSync(path.join(here, 'node_modules', '.bin', 'cap'))) {
  fail('shells/ios has no install – run `npm --prefix shells/ios ci` first')
}
if (!existsSync(path.join(here, 'ios', 'App', 'App.xcodeproj'))) {
  fail('shells/ios/ios is missing – it is committed; restore it, or recreate it with `npx cap add ios` from shells/ios')
}
if (archive && !process.env.APPLE_TEAM_ID) {
  fail('--archive signs for the App Store and needs your Apple Developer team: set APPLE_TEAM_ID=<10-character team id> (README, "The App Store route")')
}

// 0b. Xcode's system components. A fresh Xcode (or one that was just updated) refuses to build anything
//     until `xcodebuild -runFirstLaunch` has installed them, with "failed to load a required plug-in" –
//     after the dist build, a minute in. -checkFirstLaunchStatus says so up front: exit 0 when ready.
if (!syncOnly) {
  const check = spawnSync('xcodebuild', ['-checkFirstLaunchStatus'], { stdio: 'ignore' })
  if (check.error) fail('xcodebuild was not found – install Xcode and point `xcode-select` at it')
  if (check.status !== 0) {
    fail(
      `Xcode's system components are not installed (xcodebuild -checkFirstLaunchStatus exit ${check.status}). ` +
        'Run `sudo xcodebuild -runFirstLaunch` once – it needs an administrator and is not something this script does for you – then run this again. ' +
        '(`--sync-only` needs no Xcode.)',
    )
  }
}

// 1. The dist the shell wraps. Rebuilt unless told it is fresh: a stale dist in an app is worse than a
//    slow build – and the bridge wiring in src/main.ts is only in a dist built AFTER it.
if (process.env.SHELL_SKIP_DIST === '1') {
  console.log('\n[shell:ios] SHELL_SKIP_DIST=1 – reusing dist/')
} else {
  step('dist/  (npx vite build)', 'npx', ['vite', 'build'], root)
}
if (!existsSync(distIndex)) fail('dist/index.html is missing – run `npx vite build` at the repo root')
const distShaBefore = sha256(distIndex)

// 2. Capacitor's own copy and plugin step: dist/ → ios/App/App/public/, and the SwiftPM manifest for the
//    installed plugins. Capacitor 8 manages SwiftPM, not CocoaPods: there is no Podfile and no `pod install`.
step('cap sync ios', 'npx', ['cap', 'sync', 'ios'], here)

// 3. The bridge, into the COPY. It is a classic script placed BEFORE the app's module script, so the
//    global exists when src/main.ts boots. `cap sync` rewrites public/ from dist/ every run, so this
//    is redone every run; dist/ and src/ are never written to.
console.log('\n[shell:ios] inject the report bridge into the synced copy')
const indexPath = path.join(publicDir, 'index.html')
if (!existsSync(indexPath)) fail('cap sync left no index.html in ios/App/App/public – is dist/ built?')
let html = readFileSync(indexPath, 'utf8')
if (!html.includes(BRIDGE_TAG)) {
  const at = html.search(/<script\b[^>]*\btype=["']module["']/i)
  if (at < 0) fail('the copied index.html has no module script to place the bridge before')
  html = html.slice(0, at) + BRIDGE_TAG + '\n    ' + html.slice(at)
  writeFileSync(indexPath, html)
}
copyFileSync(path.join(here, 'bridge', 'shell-bridge.js'), path.join(publicDir, 'shell-bridge.js'))
if (sha256(distIndex) !== distShaBefore) fail('dist/index.html changed while the shell built – the shell must never write to dist/')
console.log(`  public/index.html carries ${BRIDGE_TAG} before the module script; dist/index.html untouched (sha256 ${distShaBefore.slice(0, 12)})`)

if (syncOnly) {
  console.log('\n[shell:ios] --sync-only: stopping before Xcode. Synced app: shells/ios/ios/App/App/public/')
  process.exit(0)
}

// SwiftPM project: Capacitor 8 writes App.xcodeproj and no workspace. A CocoaPods project would carry
// App.xcworkspace; whichever exists is what xcodebuild must be pointed at.
const workspace = path.join(here, 'ios', 'App', 'App.xcworkspace')
const project = existsSync(workspace) ? ['-workspace', workspace] : ['-project', path.join(here, 'ios', 'App', 'App.xcodeproj')]

if (archive) {
  // 4b. The App Store route. NOT exercised: it needs the owner's Apple Developer team.
  const archivePath = path.join(out, 'TiesBreak.xcarchive')
  const exportPath = path.join(out, 'export')
  const exportOptions = path.join(here, 'build', 'exportOptions.plist')
  mkdirSync(path.dirname(exportOptions), { recursive: true })
  rmSync(archivePath, { recursive: true, force: true })
  writeFileSync(
    exportOptions,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>${process.env.APPLE_TEAM_ID}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>destination</key><string>export</string>
</dict>
</plist>
`,
  )
  step(
    'xcodebuild archive (Release, signed with your team)',
    'xcodebuild',
    [...project, '-scheme', 'App', '-configuration', 'Release', '-destination', 'generic/platform=iOS', '-archivePath', archivePath, `DEVELOPMENT_TEAM=${process.env.APPLE_TEAM_ID}`, '-allowProvisioningUpdates', 'archive'],
    here,
  )
  step('xcodebuild -exportArchive', 'xcodebuild', ['-exportArchive', '-archivePath', archivePath, '-exportPath', exportPath, '-exportOptionsPlist', exportOptions, '-allowProvisioningUpdates'], here)
  console.log(`\n[shell:ios] ${path.relative(root, exportPath)}/ holds the .ipa App Store Connect takes (Transporter or \`xcrun altool\` upload it)`)
  process.exit(0)
}

// 4. The simulator build: Debug, unsigned, no Apple account. derivedDataPath keeps everything under
//    shells/ios/build/ (git-ignored).
step(
  `xcodebuild (${config.productName}: iOS Simulator, Debug, unsigned)`,
  'xcodebuild',
  [...project, '-scheme', 'App', '-configuration', 'Debug', '-sdk', 'iphonesimulator', '-derivedDataPath', 'build', 'CODE_SIGNING_ALLOWED=NO'],
  here,
)

// 5. Where it landed.
const built = path.join(here, 'build', 'Build', 'Products', 'Debug-iphonesimulator', 'App.app')
if (!existsSync(built)) fail(`xcodebuild reported success but ${built} is not there`)
mkdirSync(out, { recursive: true })
const artifact = path.join(out, 'App.app')
rmSync(artifact, { recursive: true, force: true })
const copied = spawnSync('ditto', [built, artifact], { stdio: 'inherit' })
if (copied.status !== 0) fail('ditto could not copy the .app into shells/out/ios')

const sizeOf = (entry) =>
  statSync(entry).isDirectory() ? readdirSync(entry).reduce((sum, name) => sum + sizeOf(path.join(entry, name)), 0) : statSync(entry).size
const bundleId = spawnSync('plutil', ['-extract', 'CFBundleIdentifier', 'raw', '-o', '-', path.join(artifact, 'Info.plist')], { encoding: 'utf8' }).stdout.trim()
console.log(`\n[shell:ios] ${path.relative(root, artifact)}  ${(sizeOf(artifact) / 1048576).toFixed(1)} MB  bundle id ${bundleId}`)
console.log(`  built in place: ${path.relative(root, built)}`)
console.log('  run it: boot a simulator, then `xcrun simctl install booted <that .app>` and `xcrun simctl launch booted ' + bundleId + '`')
