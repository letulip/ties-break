# shells/ – the distribution costumes

The PWA stays the product. A shell wraps the same `dist/` bytes in something a store accepts, and
nothing under `src/` knows which costume it wears. `shells/` is tooling: each shell is its own npm
project (never imported by `src`), and every artifact lands in `shells/out/`, which is git-ignored.
Spec: `docs/specs/app-shells-2026-10.md`.

## What exists

| path | what |
|---|---|
| `shells/win/` | S2, Windows/Steam. Electron loads the local `dist/` through an `app://` scheme – offline by construction, no service worker. `steamworks.js` is optional and only started by `--steam` / `STEAM_SHELL=1` (or when Steam itself launches it) |
| `shells/config.json` | the one place names and ids live; every shell reads it |
| S1 Android (Bubblewrap TWA), S3 iOS (Capacitor) | not built yet – each appends to `shell:all` |

## The three commands

| command | does | output |
|---|---|---|
| `npm run shell:win` | `npx vite build`, then electron-builder (NSIS installer + unpacked dir), then renders the Steam depot scripts | `shells/out/win/`: `Ties Break Setup <version>.exe`, `win-unpacked/` (what the Steam depot ships), `steam/*.vdf` |
| `npm run shell:all` | every shell in sequence – today just `shell:win` | everything under `shells/out/` |
| `SHELL_SMOKE=1 npm --prefix shells/win start` | opens the app hidden, waits for it to mount, checks `mailto:` and https links leave through the OS while the window stays in the app, quits | `SHELL_SMOKE_OK title=Ties Break` and exit 0; otherwise `SHELL_SMOKE_FAIL reason=…` and exit 1 |

First time only: `npm --prefix shells/win ci` (`shell:win` stops and says so when it is missing).
`SHELL_SKIP_DIST=1` reuses an existing `dist/`;
`SHELL_WIN_TARGETS=dir` skips the installer. The NSIS installer cross-builds on macOS (checked on
Apple silicon, no wine). Off Windows the game exe keeps Electron's own icon and version info –
rewriting them needs wine – so the window icon is set at runtime. No signing certificate is
configured (set `CSC_LINK` / `CSC_KEY_PASSWORD` to sign); an unsigned installer shows SmartScreen's
warning, and Steam does not need a signature.

## shells/config.json – what is yours to fill

- `productName`, `appId` – set. ⚠ `appId` is permanent once a store has seen it (Play uses it as the
  Android package name): confirm it before the first upload.
- `deployOrigin` – **empty, and S1's one required fill**: the https origin the PWA is deployed at, no
  path. The Android TWA wraps the deployment, never the local dist. Windows ignores it.
- `steamAppId`, `steamDepotId` – empty until the Steamworks app exists. The depot scripts carry `0`
  until both are filled; the upload steps are in `shells/win/steam/upload.md`.

⚠ Not exercised yet, because it needs a Steam client and an app id: a real `steamworks.init`, the
overlay, and the Steam redistributable files that steamworks.js's own README asks for at the root of
the build. What is proven is the other direction – with no Steam present, `--steam` logs
`STEAM_UNAVAILABLE …` and the shell runs on.
