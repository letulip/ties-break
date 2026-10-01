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
| S3 iOS (Capacitor) | not built yet – it appends to `shell:all` |

## The commands

| command | does | output |
|---|---|---|
| `npm run shell:win` | `npx vite build`, then electron-builder (NSIS installer + unpacked dir), then renders the Steam depot scripts | `shells/out/win/`: `Ties Break Setup <version>.exe`, `win-unpacked/` (what the Steam depot ships), `steam/*.vdf` |
| `npm run shell:android` | probes the deployment, renders `twa/` from its live manifest, builds and signs | `shells/out/android/`: `ties-break-<version>.apk` (universal, for side-loading and testing), `ties-break-<version>.aab` (what Play takes), `assetlinks.json` |
| `npm run shell:all` | builds `dist/` once (`npx vite build`), then `shell:win` and `shell:android` with `SHELL_SKIP_DIST=1` – a plain `&&` chain in the root `package.json` | everything under `shells/out/` |
| `SHELL_SMOKE=1 npm --prefix shells/win start` | opens the app hidden, waits for it to mount, checks `mailto:` and https links leave through the OS while the window stays in the app, quits | `SHELL_SMOKE_OK title=Ties Break` and exit 0; otherwise `SHELL_SMOKE_FAIL reason=…` and exit 1 |

First time only: `npm --prefix shells/win ci` (`shell:win` stops and says so when it is missing).
`SHELL_SKIP_DIST=1` reuses an existing `dist/`;
`SHELL_WIN_TARGETS=dir` skips the installer. The NSIS installer cross-builds on macOS (checked on
Apple silicon, no wine). Off Windows the game exe keeps Electron's own icon and version info –
rewriting them needs wine – so the window icon is set at runtime. No signing certificate is
configured (set `CSC_LINK` / `CSC_KEY_PASSWORD` to sign); an unsigned installer shows SmartScreen's
warning, and Steam does not need a signature.

## shells/android – the Android TWA (S1)

First time only, in a terminal, both steps:

```bash
npm --prefix shells/android ci
npm --prefix shells/android run setup
```

`setup` is the one interactive moment, and it is yours. Bubblewrap asks whether to download its own
JDK 17 and Android SDK into `~/.bubblewrap`, and Google's Android SDK licence has to be read and
accepted by a person: the script shows those prompts and never answers one. **Disk: several GB** across
`~/.bubblewrap` (JDK, SDK) and `~/.gradle` (Gradle and the AndroidX libraries the first build pulls) –
the exact figure is not measured. After that `npm run shell:android` asks nothing; run without `setup`
it stops and says so.

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
the PNGs are cut from the deployment's own icons every time.

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

## shells/config.json – what is yours to fill

- `productName`, `appId` – set. ⚠ `appId` is permanent once a store has seen it (Play uses it as the
  Android package name): confirm it before the first upload.
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

⚠ Android, not exercised yet: `setup` and `bubblewrap build`. The first run needs a person at a terminal
(Bubblewrap's JDK and SDK offer, Google's Android SDK licence), so no `.apk` / `.aab` has been built from
this rig yet. What is proven is the half that needs no toolchain: the live-origin probe, the rendered
`twa-manifest.json`, `bubblewrap update` producing the project (regenerating it over the committed copy
changes nothing), the pure helpers (manifest link, icons, SHA-256 parse, assetlinks shape) and – against
a stand-in `keytool`, not the real one – the keystore flow: file modes, the secret only ever in the
environment, a keystore never replaced, a missing password file refused. Still to be seen on a real run:
the real `keytool`, the signed `.apk` / `.aab`, `apksigner verify`, and that the SHA-256 in
`assetlinks.json` is the one the signed apk carries.
