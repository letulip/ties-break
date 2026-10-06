---
type: report
status: current
area: delivery
last-reviewed: 2026-10-01
---
# Handoff – feat/app-shells (01.10.2026)

## Shipped (off main ab0deade)
- S2 `baf3a992` – shells/win: Electron on a measured `app://` scheme, mailto/https routed to
  shell.openExternal, popups denied, single-instance lock, SHELL_SMOKE hook, NSIS cross-build →
  `Ties Break Setup 0.1.0.exe` (123 MB) + win-unpacked (392 MB, the Steam depot) + vdf templates.
- S1 `94889dd3` + guards `cfb9cdbe`/`a89d2e9f` + measured `854885e9` – shells/android: Bubblewrap
  TWA over https://letulip.github.io/ties-break/, twa/ project committed as reproducible text,
  the rig re-execs itself AND children under Node 22 (Bubblewrap's unzip stalls silently on 26 –
  A/B in build.mjs's header), keystore + password file in ~/.tiesbreak (700/600, generated, never
  printed), apk 4,448,430 B byte-reproducible + aab + assetlinks.json; apksigner cert ==
  assetlinks fingerprint with a negative control; aapt badging quoted.
- S3 `c6115a79` + measured `4ef9dfc2` – shells/ios: Capacitor 8 on SwiftPM, bridge injected into
  the SYNCED copy only (dist sha-pinned untouched), the one src contact = 4 lines in main.ts
  (window.__TIES_SHELL_BRIDGE__ → setReportBridge, mutation-pinned), App.app 22.1 MB built and
  PHOTOGRAPHED running on iPhone 17 / iOS 26.3.1; preflight now names the platform-download hint;
  Package.resolved pinned.
- Orchestrator: `npm run shell:all` = dist once + win + android (+ios) with SHELL_SKIP_DIST.

## Owner actions (standing)
- ⚠⚠ BACK UP ~/.tiesbreak/ – the keystore and its password file; nothing in the repo recreates them.
- Upload assetlinks.json → letulip/letulip.github.io at .well-known/ + a root .nojekyll; until
  then the TWA shows Chrome's URL bar (removed by the upload, no rebuild).
- Bless or replace appId com.tiesbreak.aceparent BEFORE any store sees it (permanent).
- Later: Steam app id into shells/config.json; Apple team id for --archive; the 1024px store icon.

## Open / unseen
- The apk on a real device (his Moto – the share-sheet smoke row doubles here); the aab beyond
  its bytes; the WKWebView bridge under a human tap; Steam beyond the no-crash path; no CSP on
  the Electron app:// responses (named, deferred).
- The iOS-Simulator control tool still lacks access to the iPhone 17 device (a prompt may be
  pending in the app); the smoke used `simctl io` instead – same pixels.

## Gates (01.10, quiet machine, verdicts from files with fresh mtime)
check CHECK_EXIT=0 (11:23) · sim TESTSIM_EXIT=0 · e2e E2E_EXIT=0 · component COMPONENT_EXIT=0,
247/247 (11:37). Capture 41550/e6b0c709 unmoved; schema untouched; src diff = the four main.ts
lines only, mutation-pinned.
