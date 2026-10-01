// `npm run shell:android` (root) lands here: npm --prefix shells/android run build.
//
// The Android shell is a Trusted Web Activity (TWA): Chrome renders the DEPLOYED PWA full-screen inside
// a thin signed Android app. Nothing local is wrapped – this shell has no dist/ – so it needs the
// deployment (shells/config.json: deployOrigin) to be up, and it takes the name, colours, start URL
// and icons from the manifest that deployment serves instead of restating them: the TWA is the PWA.
//
//   node build.mjs             the whole chain (the default, `npm run build`)
//   node build.mjs setup       the one-time first run: Bubblewrap's own JDK 17 + Android SDK, and Google's
//                              Android SDK licence. Interactive on purpose – a person reads and answers;
//                              this script never answers a licence prompt for anybody
//   node build.mjs generate    only twa/: render twa-manifest.json, then `bubblewrap update`
//
// The route is twa-manifest.json + `bubblewrap update` + `bubblewrap build`, not `bubblewrap init`:
// init is an interactive questionnaire whose flags cover only the manifest URL and the target
// directory, and twa-manifest.json is exactly the file init would have written from its answers. So we
// write it ourselves – deterministically, from the live manifest and shells/config.json – and once the
// first run is done the whole chain asks nothing.
//
// SHELL_SKIP_DIST (the orchestrator sets it for the win shell) is not read here: there is no dist/ to reuse.
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const shells = path.resolve(here, '..')
const out = path.join(shells, 'out', 'android')
const twa = path.join(here, 'twa')
const bubblewrap = path.join(here, 'node_modules', '.bin', process.platform === 'win32' ? 'bubblewrap.cmd' : 'bubblewrap')
const config = JSON.parse(readFileSync(path.join(shells, 'config.json'), 'utf8'))
const android = config.android ?? {}
const mode = process.argv[2] ?? 'build'
const tag = '[shell:android]'
// The keystore password travels to keytool and to Bubblewrap through the environment, never argv:
// argv is readable by every local user in `ps`.
const SECRET_ENV = 'TIESBREAK_KEYSTORE_PASSWORD'

const tilde = (p) => (p.startsWith('~/') ? path.join(homedir(), p.slice(2)) : p)
const step = (label) => console.log(`\n${tag} ${label}`)
function fail(message) {
  console.error(`${tag} FAILED: ${message}`)
  process.exit(1)
}
function run(label, command, args, options = {}) {
  step(label)
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
  if (result.status !== 0) fail(`${label} (exit ${result.status ?? result.signal})`)
}

// ---------------------------------------------------------------------------------------------
// Pure helpers. Exported so they can be exercised without a toolchain, a network or a keystore.
// ---------------------------------------------------------------------------------------------

/** The manifest URL a page declares, as written (relative or absolute), or null. */
export function manifestLink(html) {
  const link = html.match(/<link\b[^>]*\brel\s*=\s*["']?manifest["']?[^>]*>/i)
  const href = link && link[0].match(/\bhref\s*=\s*["']?([^"'\s>]+)/i)
  return href ? href[1] : null
}

const largest = (icon) => Math.max(0, ...String(icon.sizes ?? '').split(/\s+/).map((size) => parseInt(size, 10) || 0))

/** The largest `any` icon and the largest `maskable` one, as absolute URLs. */
export function pickIcons(manifest, manifestUrl) {
  const icons = (manifest.icons ?? []).map((icon) => ({
    url: new URL(icon.src, manifestUrl).href,
    size: largest(icon),
    purposes: String(icon.purpose ?? 'any').split(/\s+/),
  }))
  const pick = (purpose) => icons.filter((icon) => icon.purposes.includes(purpose)).sort((a, b) => b.size - a.size)[0]?.url
  return { iconUrl: pick('any'), maskableIconUrl: pick('maskable') }
}

/** What the TWA takes from the live web manifest. Throws (with the reason) when the PWA cannot be wrapped. */
export function factsFromManifest(manifest, manifestUrl) {
  const missing = ['name', 'start_url', 'theme_color', 'background_color'].filter((key) => !manifest[key])
  const { iconUrl, maskableIconUrl } = pickIcons(manifest, manifestUrl)
  if (!iconUrl) missing.push('an icon with purpose "any"')
  if (missing.length) throw new Error(`the live manifest lacks: ${missing.join(', ')}`)
  const start = new URL(manifest.start_url, manifestUrl)
  const scope = new URL(manifest.scope ?? '.', manifestUrl)
  if (start.origin !== new URL(manifestUrl).origin) throw new Error(`start_url ${start.href} leaves the manifest's origin – a TWA cannot wrap that`)
  return {
    manifestUrl: new URL(manifestUrl).href,
    host: start.host,
    name: manifest.name,
    shortName: manifest.short_name ?? manifest.name,
    display: manifest.display === 'fullscreen' ? 'fullscreen' : 'standalone',
    themeColor: manifest.theme_color,
    backgroundColor: manifest.background_color,
    startUrl: start.pathname + start.search,
    fullScopeUrl: scope.href,
    iconUrl,
    maskableIconUrl,
  }
}

/** twa-manifest.json: the file `bubblewrap init` would write, from the live facts and shells/config.json. */
export function renderTwaManifest(facts, settings) {
  return {
    packageId: settings.packageId,
    host: facts.host,
    name: facts.name,
    launcherName: facts.shortName,
    display: facts.display,
    themeColor: facts.themeColor,
    themeColorDark: facts.themeColor,
    navigationColor: facts.themeColor,
    navigationColorDark: facts.themeColor,
    navigationDividerColor: facts.themeColor,
    navigationDividerColorDark: facts.themeColor,
    backgroundColor: facts.backgroundColor,
    enableNotifications: false,
    startUrl: facts.startUrl,
    iconUrl: facts.iconUrl,
    maskableIconUrl: facts.maskableIconUrl,
    splashScreenFadeOutDuration: 300,
    // As written in shells/config.json (`~` unexpanded, so this committed file names no home directory);
    // `bubblewrap build` is handed the expanded path by --signingKeyPath, which overrides this one.
    signingKey: { path: settings.keystorePath, alias: settings.keystoreAlias },
    // `appVersion`, not `appVersionName`: the generator in the pinned @bubblewrap/cli reads the legacy
    // key (measured: with only appVersionName the project got `versionName ""`).
    appVersion: settings.versionName,
    appVersionCode: settings.versionCode,
    shortcuts: [],
    generatorApp: 'bubblewrap-cli',
    webManifestUrl: facts.manifestUrl,
    fallbackType: 'customtabs',
    features: {},
    alphaDependencies: { enabled: false },
    enableSiteSettingsShortcut: true,
    isChromeOSOnly: false,
    isMetaQuest: false,
    fullScopeUrl: facts.fullScopeUrl,
    orientation: 'default',
    fingerprints: [],
    additionalTrustedOrigins: [],
    retainedBundles: [],
  }
}

/** The SHA-256 certificate fingerprint (AA:BB:…, 32 pairs) out of `keytool -list -v`, or null. */
export function sha256FromKeytool(listing) {
  const match = listing.match(/SHA-?256:\s*((?:[0-9A-F]{2}:){31}[0-9A-F]{2})/i)
  return match ? match[1].toUpperCase() : null
}

/** The Digital Asset Links statement that lets this package open the site without Chrome's URL bar. */
export function renderAssetlinks(packageId, sha256) {
  const statement = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: packageId, sha256_cert_fingerprints: [sha256] },
    },
  ]
  return JSON.stringify(statement, null, 2) + '\n'
}

/** Where assetlinks.json has to be served, and – for a GitHub user site – which repo carries it. */
export function uploadPlan(host) {
  const suffix = '.github.io'
  const user = host.endsWith(suffix) ? host.slice(0, -suffix.length) : null
  return { served: `https://${host}/.well-known/assetlinks.json`, repo: user ? `${user}/${host}` : null }
}

// ---------------------------------------------------------------------------------------------
// The chain.
// ---------------------------------------------------------------------------------------------

function requireConfig() {
  const missing = []
  if (!config.deployOrigin) missing.push('deployOrigin')
  for (const key of ['packageId', 'versionCode', 'versionName', 'keystorePath', 'keystoreAlias']) {
    if (android[key] === undefined || android[key] === '') missing.push(`android.${key}`)
  }
  if (missing.length) fail(`shells/config.json is missing: ${missing.join(', ')}`)
  let origin
  try {
    origin = new URL(config.deployOrigin)
  } catch {
    fail(`deployOrigin is not a URL: ${config.deployOrigin}`)
  }
  if (origin.protocol !== 'https:') fail('deployOrigin must be https – a Trusted Web Activity refuses anything else')
  return origin
}

async function get(url, method = 'GET') {
  const response = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(20000) })
  if (!response.ok) fail(`${method} ${url} answered ${response.status} – a TWA wraps the DEPLOYMENT, so it has to be up and serving this`)
  return response
}

// 1. The deployment, as it is served right now.
async function liveFacts(origin) {
  step(`origin  ${origin.href}`)
  const href = manifestLink(await (await get(origin.href)).text())
  if (!href) fail(`${origin.href} declares no <link rel="manifest"> – there is no PWA to wrap`)
  const manifestUrl = new URL(href, origin.href).href
  const manifest = await (await get(manifestUrl)).json()
  let facts
  try {
    facts = factsFromManifest(manifest, manifestUrl)
  } catch (error) {
    fail(error.message)
  }
  for (const url of [facts.iconUrl, facts.maskableIconUrl].filter(Boolean)) await get(url, 'HEAD')
  for (const [label, value] of [
    ['manifest', facts.manifestUrl],
    ['name', manifest.name],
    ['short_name', manifest.short_name],
    ['start_url', manifest.start_url],
    ['scope', manifest.scope],
    ['theme_color', manifest.theme_color],
    ['background_color', manifest.background_color],
    ['icon', facts.iconUrl],
    ['maskable icon', facts.maskableIconUrl],
  ]) {
    console.log(`  ${label.padEnd(16)} ${value}`)
  }
  return facts
}

// 2. twa/ – Bubblewrap's Android project. The text is this shell's source; see shells/android/.gitignore
//    for the binaries and caches that are not.
function generate(facts) {
  mkdirSync(twa, { recursive: true })
  writeFileSync(path.join(twa, 'twa-manifest.json'), JSON.stringify(renderTwaManifest(facts, android), null, 2) + '\n')
  run('bubblewrap update  (twa/ from twa-manifest.json)', bubblewrap, ['update', '--skipVersionUpgrade'], { cwd: twa })
}

// 3. Bubblewrap's toolchain: its config names the JDK and the Android SDK it installed.
function bubblewrapConfig() {
  try {
    const found = JSON.parse(readFileSync(path.join(homedir(), '.bubblewrap', 'config.json'), 'utf8'))
    return found.jdkPath && found.androidSdkPath ? found : null
  } catch {
    return null
  }
}

function toolchain() {
  const found = bubblewrapConfig()
  if (!found) return null
  // macOS JDK archives nest the real home under Contents/Home.
  const nested = path.join(found.jdkPath, 'Contents', 'Home')
  const jdkHome = existsSync(path.join(nested, 'bin', 'keytool')) ? nested : found.jdkPath
  const keytool = path.join(jdkHome, 'bin', 'keytool')
  const sdk = found.androidSdkPath
  const roots = [path.join(sdk, 'cmdline-tools', 'bin'), path.join(sdk, 'cmdline-tools', 'latest', 'bin'), path.join(sdk, 'tools', 'bin')]
  if (existsSync(path.join(sdk, 'cmdline-tools'))) {
    for (const name of readdirSync(path.join(sdk, 'cmdline-tools'))) roots.push(path.join(sdk, 'cmdline-tools', name, 'bin'))
  }
  const sdkmanager = roots.map((dir) => path.join(dir, 'sdkmanager')).find((file) => existsSync(file))
  if (!existsSync(keytool) || !sdkmanager) return null
  return { jdkHome, keytool, sdk, sdkmanager, licensed: existsSync(path.join(sdk, 'licenses', 'android-sdk-license')) }
}

// The one human moment. Bubblewrap asks whether to fetch its own JDK 17 and Android SDK, and Google's
// Android SDK licence needs a person to read and accept it. Both prompts are shown, neither answered here.
function setup() {
  if (!process.stdin.isTTY) fail('setup is interactive – run `npm --prefix shells/android run setup` in a terminal')
  console.log(`\n${tag} first run: Bubblewrap will ask whether to download its own JDK 17 and Android SDK into ~/.bubblewrap`)
  console.log(`${tag} (several GB), then Google's Android SDK licence has to be read and accepted by you. Nothing is answered for you.`)
  if (!toolchain()) run("bubblewrap doctor  (Bubblewrap's own first-run questions)", bubblewrap, ['doctor'])
  const found = toolchain()
  if (!found) fail('Bubblewrap finished, but ~/.bubblewrap/config.json does not lead to a JDK with keytool and an SDK with sdkmanager – run `bubblewrap doctor`')
  if (!found.licensed) {
    run("sdkmanager --licenses  (Google's Android SDK terms – read them, answer for yourself)", found.sdkmanager, [`--sdk_root=${found.sdk}`, '--licenses'], {
      env: { ...process.env, JAVA_HOME: found.jdkHome },
    })
    if (!toolchain()?.licensed) fail('the Android SDK licence was not accepted – nothing can be built without it')
  }
  console.log(`\n${tag} toolchain ready`)
}

// 4. The signing key. Generated once, kept OUTSIDE the repo, never replaced.
const readSecret = (file) => {
  const line = readFileSync(file, 'utf8').split('\n').find((row) => row.startsWith('password='))
  const value = line?.slice('password='.length).trim()
  if (!value) fail(`${file} has no password= line`)
  return value
}

function ensureKeystore(found) {
  const keystore = tilde(android.keystorePath)
  const dir = path.dirname(keystore)
  const secretFile = path.join(dir, 'android-keystore.txt')
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  if (existsSync(keystore)) {
    if (!existsSync(secretFile)) fail(`${keystore} exists but ${secretFile} does not – restore it from your backup. This script never guesses at, regenerates or replaces a signing key.`)
    return { keystore, password: readSecret(secretFile) }
  }
  step(`keystore  ${keystore} does not exist – generating it (RSA 2048, valid 10000 days)`)
  // A password file left by an interrupted earlier run is reused, never overwritten: it may be the
  // only record of the secret for a keystore that is restored later.
  const fresh = !existsSync(secretFile)
  const password = fresh ? randomBytes(24).toString('base64url') : readSecret(secretFile)
  if (fresh) {
    const note = [
      `# ${config.productName} – Android signing key secret. Read by shells/android/build.mjs.`,
      '# BACK UP THIS DIRECTORY: losing the keystore or this password loses the app\'s store identity.',
      `alias=${android.keystoreAlias}`,
      `keystore=${keystore}`,
      `password=${password}`,
      '',
    ]
    writeFileSync(secretFile, note.join('\n'), { mode: 0o600 })
    chmodSync(secretFile, 0o600)
  }
  const result = spawnSync(
    found.keytool,
    [
      '-genkeypair',
      '-keystore', keystore,
      '-alias', android.keystoreAlias,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-storetype', 'PKCS12',
      '-dname', `CN=${config.productName}`,
      '-storepass:env', SECRET_ENV,
      '-keypass:env', SECRET_ENV,
    ],
    { stdio: 'inherit', env: { ...process.env, [SECRET_ENV]: password } },
  )
  if (result.status !== 0) fail('keytool could not create the keystore')
  chmodSync(keystore, 0o600)
  console.warn(`\n${tag} ⚠ BACK UP ${path.dirname(android.keystorePath)}/ NOW – ${path.basename(keystore)} and ${path.basename(secretFile)} together.`)
  console.warn(`${tag} ⚠ Losing either loses the app's store identity; nothing in this repo can recreate it.`)
  return { keystore, password }
}

function fingerprintOf(found, key) {
  const result = spawnSync(
    found.keytool,
    ['-J-Duser.language=en', '-list', '-v', '-keystore', key.keystore, '-alias', android.keystoreAlias, '-storepass:env', SECRET_ENV],
    { encoding: 'utf8', env: { ...process.env, [SECRET_ENV]: key.password } },
  )
  const sha256 = result.status === 0 ? sha256FromKeytool(result.stdout) : null
  if (!sha256) fail(`could not read the SHA-256 of "${android.keystoreAlias}" out of ${key.keystore}`)
  return sha256
}

// 5. The signed build. `build` re-reads twa-manifest.json, which generate() has just rewritten.
function buildApp(key) {
  run(
    'bubblewrap build  (the first build also downloads Gradle and the AndroidX libraries)',
    bubblewrap,
    ['build', '--skipPwaValidation', `--signingKeyPath=${key.keystore}`, `--signingKeyAlias=${android.keystoreAlias}`],
    { cwd: twa, env: { ...process.env, BUBBLEWRAP_KEYSTORE_PASSWORD: key.password, BUBBLEWRAP_KEY_PASSWORD: key.password } },
  )
}

function collect() {
  mkdirSync(out, { recursive: true })
  const slug = `${config.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${android.versionName}`
  for (const [from, ext] of [['app-release-signed.apk', 'apk'], ['app-release-bundle.aab', 'aab']]) {
    if (!existsSync(path.join(twa, from))) fail(`bubblewrap build left no ${from} in twa/`)
    copyFileSync(path.join(twa, from), path.join(out, `${slug}.${ext}`))
  }
}

function summarize(sha256, host) {
  const plan = uploadPlan(host)
  console.log(`\n${tag} shells/out/android/`)
  for (const name of readdirSync(out).sort()) {
    console.log(`  ${name.padEnd(40)} ${(statSync(path.join(out, name)).size / 1048576).toFixed(2).padStart(8)} MB`)
  }
  console.log(`\n${tag} signing key SHA-256  ${sha256}`)
  console.log(`\n${tag} assetlinks.json – upload it once and the app opens full-screen, with no URL bar:`)
  console.log(`  repo   ${plan.repo ?? `(whatever serves https://${host}/)`}`)
  console.log(`  path   .well-known/assetlinks.json   <- shells/out/android/assetlinks.json`)
  console.log(`  also   an empty .nojekyll at the repo ROOT, beside .well-known/ (GitHub Pages' Jekyll drops dot-directories without it)`)
  console.log(`  then   ${plan.served} must answer 200`)
  console.log(`  Until it is live the app runs with Chrome's URL bar; uploading later removes the bar with NO rebuild.`)
  console.log(`  Play re-signs uploads with its own key: after the first upload add that key's SHA-256 to the same file's sha256_cert_fingerprints.`)
}

async function main() {
  const origin = requireConfig()
  if (!existsSync(bubblewrap)) fail('shells/android has no install – run `npm --prefix shells/android ci` first')
  if (mode === 'setup') return setup()
  if (mode !== 'build' && mode !== 'generate') fail(`unknown mode "${mode}" – build (the default), setup or generate`)

  const facts = await liveFacts(origin)
  let found = null
  if (mode === 'build') {
    found = toolchain()
    if (!found?.licensed) setup()
    found = toolchain()
  } else if (!bubblewrapConfig()) {
    // Every Bubblewrap command starts by reading its config, so even `update` would open the first-run questions.
    fail('Bubblewrap has no config yet – run `npm --prefix shells/android run setup` once')
  }
  generate(facts)
  if (mode === 'generate') return

  const key = ensureKeystore(found)
  const sha256 = fingerprintOf(found, key)
  console.log(`\n${tag} signing key SHA-256  ${sha256}`)
  buildApp(key)
  collect()
  writeFileSync(path.join(out, 'assetlinks.json'), renderAssetlinks(android.packageId, sha256))
  summarize(sha256, facts.host)
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => fail(error?.message ?? String(error)))
}
