---
type: spec
status: current
area: delivery
last-reviewed: 2026-09-30
---

# The three shells – Android, iOS, Windows/Steam (P2 · his 30.09 commission)

His words: «надо делать 3 обвязки для запуска… чтобы можно было по готовности скриптом запускать
сборку всех трех, можно даже (и мне кажется лучше) пока это на локале делать из терминала».
Local-first, terminal-first; CI later if ever. The PWA stays the product – a shell is a
distribution costume, and NOTHING in `src/` may know which costume it wears except the one
adapter slot the feedback spec names.

## The shape
- `dist/` is built ONCE (`npx vite build`); every shell wraps the same bytes.
- One orchestrator: `npm run shell:all` → `shell:android`, `shell:windows`, `shell:ios` in
  sequence, each idempotent, each leaving its artifact under `shells/out/`.
- The `shells/` directory is tooling, not product: its own package.jsons, never imported by src.

## S1 · Android – TWA via Bubblewrap (the thinnest true shell)
`@bubblewrap/cli` init off the deployed manifest → `bubblewrap build` → signed .aab/.apk from
the terminal. The app IS Chrome rendering the PWA: offline, share-with-files, media session all
work unchanged. Prereqs on the owner's side: a Play console account, a signing key (the script
generates and stores it OUTSIDE the repo), the deployed origin with `assetlinks.json` (the
script prints the file to upload). ⚠ TWA needs the PWA served from ITS origin – the shell wraps
the deployment, not the local dist.

## S2 · Windows / Steam – Electron + steamworks.js (the boring proven pair)
Electron loads the LOCAL dist (true offline, no origin needed); `steamworks.js` for the Steam
init/overlay handshake behind a build flag, so the same shell also runs Steam-free.
`electron-builder` → NSIS installer + the Steam depot layout under `shells/out/win/`. Prereqs:
a Steamworks app id (his), the depot upload done with Valve's own `steamcmd` (scripted, creds
prompted never stored). Feedback transport here = the fallback path by design.

## S3 · iOS – Capacitor (WKWebView; the most friction, last on purpose)
`npx cap add ios && npx cap sync && xcodebuild -workspace … archive` from the terminal; the
share bridge: `@capacitor/share` injected behind `shareReport()`'s slot – the ONE line of
app-code contact. Prereqs: an Apple developer account, certificates (Xcode-managed), and the
review-guideline caveat stated honestly: Apple dislikes bare web wrappers – the offline engine,
saves and media session make a substantive case, but plan a review argument, not a rubber stamp.

## Order and why
Android first (thinnest, zero app-code change), Windows second (unlocks Steam, local dist),
iOS third (accounts+review friction). Each S is its own wave with its own smoke checklist row
(install → offline → save export → the feedback control fires its right transport).
