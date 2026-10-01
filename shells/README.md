# shells/ – the distribution costumes

The PWA stays the product. A shell wraps it in something a store accepts – the same `dist/` bytes for
Windows, the deployment that serves them for Android – and nothing under `src/` knows which costume it
wears. `shells/` is tooling: each shell is its own npm project (never imported by `src`), and every
artifact lands in `shells/out/`, which is git-ignored. Spec: `docs/specs/app-shells-2026-10.md`.

## What exists

| path | what |
|---|---|
| `shells/win/` | S2, Windows/Steam. Electron loads the local `dist/` through an `app://` scheme – offline by construction, no service worker. `steamworks.js` is optional and only started by `--steam` / `STEAM_SHELL=1` (or when Steam itself launches it) |
| `shells/android/` | S1, Android. A Trusted Web Activity built with Bubblewrap (pinned exactly): Chrome renders the **deployed** PWA full-screen inside a thin signed Android app. It wraps the deployment, never the local `dist/`, and takes its name, colours, start URL and icons from the manifest that deployment serves |
| `shells/config.json` | the one place names and ids live; every shell reads it |
| `shells/ios/` | S3, iOS. Capacitor (WKWebView, Swift Package Manager, pinned exactly) loading the local `dist/` from inside the app bundle – offline by construction. The report bridge is injected into the synced copy only; `dist/` and `src/` are never written to |

## The commands

| command | does | output |
|---|---|---|
| `npm run shell:win` | `npx vite build`, then electron-builder (NSIS installer + unpacked dir), then renders the Steam depot scripts | `shells/out/win/`: `Ties Break Setup <version>.exe`, `win-unpacked/` (what the Steam depot ships), `steam/*.vdf` |
| `npm run shell:android` | probes the deployment, renders `twa/` from its live manifest, builds and signs | `shells/out/android/`: `ties-break-<version>.apk` (universal, for side-loading and testing), `ties-break-<version>.aab` (what Play takes), `assetlinks.json` |
| `npm run shell:ios` | checks Xcode is ready, `npx vite build`, `cap sync ios`, injects the report bridge into the synced copy, then `xcodebuild` for the iOS Simulator (Debug, unsigned – no Apple account) | `shells/out/ios/App.app` (the simulator build; also left in place under `shells/ios/build/`) |
| `npm run shell:all` | builds `dist/` once (`npx vite build`), then `shell:win`, `shell:android` and `shell:ios` with `SHELL_SKIP_DIST=1` – a plain `&&` chain in the root `package.json` | everything under `shells/out/` |
| `SHELL_SMOKE=1 npm --prefix shells/win start` | opens the app hidden, waits for it to mount, checks `mailto:` and https links leave through the OS while the window stays in the app, quits | `SHELL_SMOKE_OK title=Ties Break` and exit 0; otherwise `SHELL_SMOKE_FAIL reason=…` and exit 1 |

First time only: `npm --prefix shells/win ci` (`shell:win` stops and says so when it is missing).
`SHELL_SKIP_DIST=1` reuses an existing `dist/`;
`SHELL_WIN_TARGETS=dir` skips the installer. The NSIS installer cross-builds on macOS (checked on
Apple silicon, no wine). Off Windows the game exe keeps Electron's own icon and version info –
rewriting them needs wine – so the window icon is set at runtime. No signing certificate is
configured (set `CSC_LINK` / `CSC_KEY_PASSWORD` to sign); an unsigned installer shows SmartScreen's
warning, and Steam does not need a signature.

## shells/android – the Android TWA (S1)

⚠ The rig re-execs itself under Node 22 (Homebrew node@22): Bubblewrap 1.25.0's JDK unzip
stalls silently on newer majors (measured 01.10 – 286 of 64,940 files, exit 0; the A/B is in
build.mjs's header). No PATH juggling is needed in your commands.

First time only, in a terminal, both steps:

```bash
npm --prefix shells/android ci
npm --prefix shells/android run setup
```

`setup` is the one interactive moment, and it is yours. Bubblewrap asks whether to download its own
JDK 17 and Android SDK into `~/.bubblewrap`, and Google's Android SDK licence has to be read and
accepted by a person: the script shows those prompts and never answers one. **Disk: about 2.3 GB**
(measured 01.10, after the first build): `~/.bubblewrap` 1.6 GB (JDK 17, Android SDK) and `~/.gradle`
671 MB (Gradle and the AndroidX libraries the first build pulls). After that `npm run shell:android` asks
nothing; run without `setup` it stops and says so.

One run does, in order:

1. reads `shells/config.json` (`deployOrigin` and the `android` block) – nothing else spells the origin;
2. fetches the deployment's page, its web manifest and its icons, and stops if any is down: a TWA wraps
   what is served, and nothing local can stand in for it;
3. renders `shells/android/twa/twa-manifest.json` from that manifest (name, short name, start URL,
   scope, colours, icons – the TWA is the PWA, nothing invented) plus the config (package id, versions,
   keystore), then `bubblewrap update` regenerates the Android project beside it;
4. makes sure the signing key exists (below);
5. `bubblewrap build` – a signed universal `.apk` and the Play `.aab`, copied to `shells/out/android/`;
6. renders `shells/out/android/assetlinks.json` from the keystore's real SHA-256 and prints where it goes.

`npm --prefix shells/android run generate` does step 3 alone.

**Why not `bubblewrap init`.** `init` is an interactive questionnaire whose flags cover only the
manifest URL and the target directory. `twa-manifest.json` is exactly what it would write from its
answers, so the script writes that file itself – deterministically – and runs `bubblewrap update` and
`bubblewrap build`. ⚠ The pinned CLI reads the version name from the key `appVersion`, so that is the key
written (measured: with only `appVersionName` the generated project got `versionName ""`).

**What is committed.** `shells/android/twa/` is Bubblewrap's generated Android project. Its text is the
shell's source – reproducible with `generate` and reviewable in a diff. The generated binaries (launcher
and splash PNGs, `gradle-wrapper.jar`) and build output are not committed (`shells/android/.gitignore`);
the PNGs are cut from the deployment's own icons every time. ⚠ One file has two writers that disagree
(measured 01.10): `app/src/main/res/xml/shortcuts.xml`. `generate` writes the template's 15-line licence
header above the `<shortcuts/>` element (704 bytes); the Gradle task `generateShorcutsFile`, which
`bubblewrap build` runs, rewrites it as the bare element (73 bytes). The committed copy is the bare one, so
a full `shell:android` leaves the tree clean and a lone `generate` shows the header as a diff.

### The signing key

The first full run generates `~/.tiesbreak/android.keystore` (RSA 2048, PKCS12, valid 10000 days) and one
random password in `~/.tiesbreak/android-keystore.txt` (mode 600). Both live outside the repo. The
password reaches `keytool` and Bubblewrap through environment variables
(`BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` for the build), never argv. The script never
replaces a keystore, and refuses to run when the keystore exists and its password file does not.

⚠⚠ **BACK UP `~/.tiesbreak/` – the keystore and the password file together. Losing it loses the app's store
identity.**

### assetlinks.json – what makes the URL bar go away

1. repo `letulip/letulip.github.io`, path `.well-known/assetlinks.json` – the file from `shells/out/android/`;
2. an empty `.nojekyll` at that repo's root, beside `.well-known/` (GitHub Pages' Jekyll drops
   dot-directories without it);
3. then `https://letulip.github.io/.well-known/assetlinks.json` must answer 200.

Without it the app runs with Chrome's URL bar; uploading it later removes the bar with NO rebuild. Play
re-signs every upload with its own key: after the first upload add that key's SHA-256 (Play Console, App
integrity) to the same file's `sha256_cert_fingerprints` list. Host and repo come from `deployOrigin`;
moving the domain means a rebuild (the host is baked into the app) and an assetlinks.json on the new host.

## shells/ios – the iOS shell (S3)

First time only, in a terminal:

```bash
npm --prefix shells/ios ci
sudo xcodebuild -runFirstLaunch   # only on an Xcode that was just installed or updated
xcodebuild -downloadPlatform iOS  # Xcode 26 ships without the iOS platform; several GB
```

`-runFirstLaunch` installs the system components Xcode needs before it will build anything. It needs an
administrator, so it is yours to run – the script never does. `shell:ios` asks
`xcodebuild -checkFirstLaunchStatus` up front and stops saying so; without that check the build fails a
minute in with "failed to load a required plug-in".

`-downloadPlatform iOS` fetches the iOS platform (Xcode > Settings > Components does the same). Without it
xcodebuild refuses the build with «no destinations» or "iOS 26.x is not installed" and a bare exit 70, at the
build step, minutes in; `shell:ios` runs `xcodebuild -showdestinations` up front and stops with this hint when
it hears either wording. Any other failure of that probe (an offline package resolve, a timeout) is left for
the build to report. The probe was exercised on the real tool only where it passes – the refusal wordings it
stops on were tested against stand-in output.

One run does, in order:

1. the two Xcode checks above, first-launch components and the iOS platform (`--sync-only` skips them);
2. `npx vite build` – a stale `dist/` in an app is worse than a slow build, and the wiring in
   `src/main.ts` is only in a `dist/` built after it (`SHELL_SKIP_DIST=1` reuses the one on disk);
3. `cap sync ios` – Capacitor copies `dist/` into `ios/App/App/public/` and writes the SwiftPM manifest
   for the two plugins (`@capacitor/share`, `@capacitor/filesystem`);
4. injects `<script src="shell-bridge.js">` before the app's module script in that **copy** and puts
   `bridge/shell-bridge.js` beside it. `dist/` and `src/` are never written to – the script stops if
   `dist/index.html` changes while it runs;
5. `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator
   -derivedDataPath build CODE_SIGNING_ALLOWED=NO` – no Apple account, no signing;
6. copies the `.app` to `shells/out/ios/App.app` and prints its size and bundle id.

`npm --prefix shells/ios run build -- --sync-only` does 2–4 and stops: no Xcode needed, and the synced
copy under `ios/App/App/public/` is what to look at. To run the simulator build by hand:
`xcrun simctl boot <device>`, `xcrun simctl install booted shells/out/ios/App.app`,
`xcrun simctl launch booted com.tiesbreak.aceparent`.

**Swift Package Manager, not CocoaPods.** Capacitor 8 manages the native side with SwiftPM: `cap add ios`
wrote `App.xcodeproj` and a `CapApp-SPM` package, there is no Podfile and no workspace, and CocoaPods is
not needed. The first build resolves `capacitor-swift-pm` from GitHub, so it needs the network once.

**What is committed.** `shells/ios/ios/` is Capacitor's generated Xcode project: its text is the shell's
source, reviewable in a diff, and `cap sync` rewrites its generated parts the same way every run. The
synced copy (`ios/App/App/public/`), build output (`build/`, DerivedData) and per-user Xcode state are not
(`shells/ios/.gitignore`). `App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` is
committed on purpose: it pins every package SwiftPM resolved – `capacitor-swift-pm` 8.5.2 and, transitively,
the filesystem plugin's `ion-ios-filesystem` 1.1.4 – so a later build resolves the same revisions.
⚠ The icon and launch-image PNGs that `cap add ios` generated are Capacitor's
placeholders, and the repo-wide `*.png` rule keeps them out of git: a fresh clone builds without them
(Xcode warns), and a store build needs the game's own 1024 px app icon and launch image put into
`ios/App/App/Assets.xcassets` first.

### The report bridge

`bridge/shell-bridge.js` defines `window.__TIES_SHELL_BRIDGE__` – the one contact `src/` has with any
shell. `src/main.ts` hands that global, when a wrapper defined one before the bundle ran, to the report
slot in `src/feedback.ts`; no shell is named in `src/`. The contract is the feedback spec's F1:

- it resolves `true` when the shell took the report: the share sheet completed, **or the player
  cancelled it** (so he is not handed a download he just declined);
- it resolves `false` when this shell has no way to send (no share plugin, or a save file it cannot
  attach) and throws on any other failure (a sheet error, a failed write) – the app then falls through to
  its own download and mail path;
- the save file is written base64 into the cache directory and its file URI goes to
  `Share.share({ title, text, files })`, where `title` is the first line of the report text; with no file it
  shares the text alone.

`tests/shell-bridge-wiring.test.ts` pins both halves – the wiring in `main.ts` and this contract – against
stand-in plugins.

### The App Store route (`--archive`)

```bash
APPLE_TEAM_ID=<your 10-character team id> npm --prefix shells/ios run build -- --archive
```

That is the same sync and injection, then `xcodebuild archive` (Release, `generic/platform=iOS`, signed
by your team through Xcode's automatic signing) and `xcodebuild -exportArchive` with an
`exportOptions.plist` it writes (`app-store-connect`, export only – nothing is uploaded for you): the
`.ipa` lands in `shells/out/ios/export/`, and Transporter or `xcrun altool` takes it from there. Without
`APPLE_TEAM_ID` it stops before doing anything. It needs what only you have: an Apple Developer Program
membership, your team's id, and an Xcode signed in to that account (Settings, Accounts) so signing can
create the distribution certificate and profile. Every upload needs a higher build number –
`CURRENT_PROJECT_VERSION` (and `MARKETING_VERSION`, the visible one) in
`ios/App/App.xcodeproj/project.pbxproj`; Capacitor's defaults are 1 and 1.0, and nothing here bumps them.

⚠ The bundle id is `appId` from `shells/config.json` (`com.tiesbreak.aceparent`, the same placeholder as
everywhere): permanent once App Store Connect has seen it, so confirm it before creating the app record.

⚠ **App Store review.** Apple dislikes bare web wrappers – the offline engine, saves and media session make
a substantive case, but plan a review argument, not a rubber stamp.

## shells/config.json – what is yours to fill

- `productName`, `appId` – set. ⚠ `appId` is permanent once a store has seen it (Play uses it as the
  Android package name, App Store Connect as the iOS bundle identifier): confirm it before the first
  upload. iOS reads these two and nothing else from this file.
- `deployOrigin` – set (owner ruling 01.10, «пока этот»): `https://letulip.github.io/ties-break/` –
  scheme, host and the base path the PWA is served under. Android takes its host, start URL and icons
  from the manifest that URL serves. Windows ignores it. The domain moves later: change it here and
  nowhere else.
- `android` – `packageId` (⚠ permanent once any store has seen it, same placeholder as `appId`: the owner
  blesses it before the first upload), `versionCode` (must rise with every Play upload), `versionName`,
  `keystorePath`, `keystoreAlias`.
- `steamAppId`, `steamDepotId` – empty until the Steamworks app exists. The depot scripts carry `0`
  until both are filled; the upload steps are in `shells/win/steam/upload.md`.

⚠ Not exercised yet, because it needs a Steam client and an app id: a real `steamworks.init`, the
overlay, and the Steam redistributable files that steamworks.js's own README asks for at the root of
the build. What is proven is the other direction – with no Steam present, `--steam` logs
`STEAM_UNAVAILABLE …` and the shell runs on.

Android, measured with the real toolchain (01.10). On a cold machine (no `~/.gradle`, an SDK holding only
`licenses/` and `tools/`) `npm run shell:android` ran end to end in about 1 min 40 s and exited 0, with stdin
closed so that it could ask nothing: it prints «Installing Android Build Tools. Please, read and accept the
license agreement.» and carries on, `setup` having accepted the licences already. It generated the signing
key, pulled `build-tools` 35.0.0 and 36.1.0, `platforms/android-36` and `platform-tools` into the SDK, and
left `shells/out/android/ties-break-0.1.0.apk` (signed, universal, 4.24 MB), `ties-break-0.1.0.aab` (4.37 MB)
and `assetlinks.json`. Two checks on that apk, with the tools in `~/.bubblewrap/android_sdk/build-tools/36.1.0`:

- `apksigner verify --verbose --print-certs` prints `Verifies` (v1, v2 and v3 signatures; one signer,
  `CN=Ties Break`, RSA 2048) and exits 0, and the SHA-256 it prints is digit for digit the fingerprint in
  `assetlinks.json` – and the one the rig read out of the keystore before the build. (The same grep with one
  digit flipped finds nothing, so the comparison can fail.) It also prints 35 `WARNING: META-INF/… not
  protected by signature` lines: Gradle's androidx and kotlinx `.version` files and build metadata, which the
  v1 JAR signature does not cover and the whole-file v2 and v3 signatures do. The exit status stays 0.
- `aapt dump badging` reads `package: name='com.tiesbreak.aceparent' versionCode='1' versionName='0.1.0'`,
  `sdkVersion:'21'`, `targetSdkVersion:'36'` and
  `launchable-activity: name='com.tiesbreak.aceparent.LauncherActivity'  label='Ties Break'` – the
  `shells/config.json` values, not a default.

A second run, warm and over the key that now existed, took about 20 s and exited 0: no keystore was generated,
the SHA-256 it printed was the same, the apk came out byte-identical (same checksum) and the tree ended as the
first run had left it. The `.aab` is not reproducible – 4,578,417 and 4,578,419 bytes on the two runs – so
compare the apk's checksum, not the bundle's.

The SDK Bubblewrap installs is the older layout – `tools/bin/sdkmanager`, no `cmdline-tools/` – and
`toolchain()` in `build.mjs` already lists `tools/bin` among the places it looks, so nothing there needed
changing.

The keystore came into being on the first run: `~/.tiesbreak/android.keystore` and its password in
`~/.tiesbreak/android-keystore.txt`, outside the repo (directory mode 700, both files 600). ⚠⚠ **BACK UP
`~/.tiesbreak/` NOW – the keystore and the password file together. Losing either loses the app's store
identity, and nothing in this repo can recreate it.**

⚠ Android, still unseen: (1) the apk installed and launched on a device or an emulator – nothing here has run
it; (2) the `.aab` beyond its size – built by the same run, not inspected, nothing uploaded; (3) the URL bar
going away, which needs `assetlinks.json` live at `https://letulip.github.io/.well-known/assetlinks.json`
(see above) – your upload; (4) the keystore's refusals (a keystore without its password file) – still tested
only against a stand-in `keytool`.

iOS, measured on a simulator (01.10). On Xcode 26.2 (17C52), with its first-launch components and the iOS
platform installed, `npm run shell:ios` ends in `** BUILD SUCCEEDED **` and `shells/out/ios/App.app` –
22.1 MB, Debug, unsigned, bundle id `com.tiesbreak.aceparent`. That `.app` was installed and launched on an
iPhone 17 simulator running iOS 26.3.1 (cold boot about 30 s): `simctl launch` returned a pid, the process
was still running two minutes later, and a screenshot shows the game's own title screen – «Ties Break» with
its lime ball dot, «Ace Parent» and a faint «Tap to start» – on `#0a0e13` (six background pixels sampled
across the frame, all exactly that), not a white or an error page. Proven before and still standing: `cap add
ios` (Capacitor 8.5.2, SwiftPM) produced the project; `cap sync` and the injection (`--sync-only`) run with
`dist/` and `src/` untouched; the wiring in `src/main.ts` and the bridge's return values, against stand-in
plugins (`tests/shell-bridge-wiring.test.ts`); and the Xcode preflight and `--archive` guard messages.

⚠ iOS, not exercised yet: (1) the report bridge in a real WKWebView – nothing drove the UI, so
`window.Capacitor.Plugins.Share` and `.Filesystem` being there for a script with no bundler, and the share
sheet opening from the report control under a human tap, are unseen; (2) `--archive`, which needs your team
and has not been run at all; (3) the store icon – the game's own 1024 px app icon and launch image are not
in `ios/App/App/Assets.xcassets` yet (see "What is committed"), so the home-screen icon and the store
listing icon have not been looked at.
