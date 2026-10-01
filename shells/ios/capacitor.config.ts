// The iOS shell's Capacitor config (docs/specs/app-shells-2026-10.md §S3). Names and ids come from
// shells/config.json – the one place they live – and nothing here spells them.
//
// ⚠ appId is PERMANENT once App Store Connect has seen it: it is the bundle identifier, and Apple keys
// the whole app record on it (a rename is a new app). It is the same placeholder shells/config.json
// carries for every store – the owner blesses it before the first upload.
//
// webDir is the repo's dist/ – built ONCE, every shell wraps the same bytes. `cap sync` COPIES it into
// ios/App/App/public/, and build.mjs injects the bridge into that copy only; dist/ is never written to.
//
// The Capacitor CLI finds this file in its current directory, so cwd is shells/ios whenever it runs
// (the npm scripts and build.mjs both guarantee it) and ../config.json is the shared one.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CapacitorConfig } from '@capacitor/cli'

const shared = JSON.parse(readFileSync(resolve(process.cwd(), '../config.json'), 'utf8')) as {
  appId: string
  productName: string
}

const config: CapacitorConfig = {
  appId: shared.appId,
  appName: shared.productName,
  webDir: '../../dist',
}

export default config
