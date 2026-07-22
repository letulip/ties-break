# Tech feasibility: PWA SPA for a deep career sim (2026-07-22)

Raw agent output: [raw/2026-07-22-tech-research.json](raw/2026-07-22-tech-research.json)

## Verdict

**Yes, comfortably — with a direct existence proof.** [ZenGM](https://github.com/zengm-games/zengm) (Basketball GM / Football GM, by Jeremy "dumbmatter" Scheff) simulates entire multi-team leagues for decades — users run leagues with 3000+ seasons — fully client-side (TypeScript, worker + IndexedDB). Our scope (500–2000 AI players, ~20-year career, weekly ticks) is *smaller* than what ZenGM already does in a browser tab.

**Compute is a non-issue.** Measured on V8: seeded mulberry32 ≈ 213M draws/sec; a full point-by-point best-of-3 match ≈ **1.5 µs** (~677k matches/sec single-threaded). A weekly tick with ~1000 AI matches ≈ 1.5 ms; fast-forwarding 20 years point-by-point < 2 s. The real engineering goes into **persistence, memory ceilings, and UI** — not sim math.

## ZenGM's hard-won lessons (adopt from day one)

1. **Sim lives in a Web Worker** (SharedWorker where available, Worker fallback for Safari). Forced by Chrome background-tab throttling (main-thread timers → 1/min after 5 min hidden; workers exempt; rAF stops entirely when hidden — never drive sim from rAF).
2. **In-memory cache over IndexedDB**: hot data (active players, current season) as plain objects in the worker with dirty-flag periodic flush; IndexedDB touched only for history. This gave ZenGM a **~10x** sim speedup — "async" IndexedDB was actually blocking.
3. **Normalize per-season records** (one record per player-season / per match log), never append into one growing blob — IndexedDB can't partially read/write an object; this exact mistake made old ZenGM saves degrade (20-season league: 45 s per simulated week before the fix).
4. **Migration pattern**: single integer schema version, append-only `if (oldVersion < N)` blocks in `onupgradeneeded` (ZenGM is at v65+ after a decade); test against `fakeIndexedDB` in Node.
5. Useful libs by the same author: `promise-worker-bi`, `fakeIndexedDB`, `json-web-streams`, `faces.js` (procedural SVG player faces — directly relevant for cheap player portraits).

## Storage: the real risk area

- **Safari ITP 7-day eviction is still alive (Safari 26, 2026)**: 7 days of Safari use without interacting with the origin → ALL script-writable storage deleted (IndexedDB, localStorage, SW registrations). **Installed-to-home-screen PWAs are exempt** (own storage container + persist() granted by heuristic). Mitigation: actively prompt iOS users to Add to Home Screen; warn Safari-tab users.
- Quotas are generous since iOS 17 (~60% of disk per origin in Chrome/Safari; Firefox 10% / 10 GiB group) — a 1–20 MB save is noise. The old "~1 GB Safari limit" is obsolete.
- `navigator.storage.persist()`: Chrome auto-grants on engagement (install/bookmark), Firefox prompts, Safari decides silently. Call it at startup + after install; if `persisted()` is false, surface a gentle "export a backup" nudge.
- **iOS IndexedDB is historically flaky** (corruption, "internal error in Indexed Database server", wipes after OS updates). Never trust it as the only copy: 3+ rotating autosave slots with checksums + **first-class export/import to file** (`<a download>`; showSaveFilePicker is Chromium-only). Autosave on `visibilitychange`/`pagehide` + interval; never `beforeunload` on mobile.
- **CompressionStream ('gzip')** is universal since Safari 16.4 — JSON saves compress 5–10x, no library needed. localStorage only for settings (<100 KB). OPFS optional at our sizes (and half-broken on Safari).
- **iOS memory ceiling**: page killed/reloaded around ~300–450 MB on typical iPhones. Keep worker heap small: only active-tour players hot, history paged to IndexedDB, cap in-memory match logs.

## Portals (later, but design the seam now)

Storage in third-party iframes is **partitioned by top-level site** (Chrome 115+, Firefox, Safari) — progress on crazygames.com / yandex.ru / our domain = three separate buckets, never shared. On iOS-in-iframe, localStorage can behave like sessionStorage. Portal SDKs provide their own save APIs with hard caps: **CrazyGames data module ≈ 1 MB cloud**, **Yandex `player.setData` ≈ 200 KB JSON** (whole-document writes, rate-limited; `safeStorage` for guests). → Design a storage adapter interface + a compact "essential career state" serialization (fits 200 KB) from day one; full local save stays rich.

## Framework choice

Benchmarks (krausest js-framework-benchmark, 2025–26): vanilla 1.0 → Svelte 5 ~1.05–1.1x → Vue 3.5 ~1.15–1.25x → Preact+signals ~1.2–1.4x → React 19 ~1.5–1.7x (and 40–45 kB gz runtime vs ~20 kB Vue, ~2–4 kB Svelte, ~5 kB Preact). At 20–30 table screens these deltas are **noise**; choose on DX.

- The owner's belief "React slows as the app grows" is **directionally fair for React** (whole-subtree re-renders; React Compiler fails silently on rule violations, fixed only 2/10 real re-render issues in external testing) and **does not apply to Vue/Svelte/Preact-signals** (fine-grained dependency tracking).
- **Recommendation: Vue 3.5 + Pinia + Vite** — owner has large-project Vue experience, near-vanilla speed, best devtools, deep reactivity fits nested game state. Caveats: keep the giant sim state NON-reactive (it lives in the worker anyway); `shallowRef`/`markRaw` for large snapshots; skip Vapor Mode until stable.
- Svelte 5 (runes) = best raw tech (smallest bundles, `$state` in `.svelte.ts` modules, native TS) at the cost of ~a week of learning and weaker devtools.
- Vanilla + tiny store is viable but means hand-rolling DOM reconciliation for ~25 data-bound table screens — the one workload where a reactive framework genuinely repays its bundle cost.
- TypeScript for the sim core strongly recommended (ZenGM is 97% TS; free with Vite).

## Worker & rendering plumbing

- **No SharedArrayBuffer**: GitHub Pages can't set COOP/COEP headers; the coi-serviceworker hack conflicts with the PWA's own service worker. Use postMessage.
- Structured clone ≈ 5–10 ms/MB each way (32 MB round-trip ≈ 302 ms vs 6.6 ms transferred) → send compact per-tick deltas/view-models, Transferable ArrayBuffers for big payloads. Comlink (1.2 kB, maintained) or raw typed postMessage — for a fixed protocol raw postMessage is arguably simpler.
- **OffscreenCanvas is Baseline** (Safari 16.4+, March 2023) — the match scene *can* render from a worker; main-thread Canvas is also fine for a 2–3 min playback scene.
- PWA stack: **Vite + vite-plugin-pwa (Workbox 7.3, maintained; Serwist as fallback fork) + gh-pages**. Gotchas: `base: '/repo/'` consistently (vite config + manifest scope/start_url); `registerType: 'autoUpdate'` so redeploys don't strand users on stale index.html (GH Pages serves 10-min max-age).
- Melvor Idle's bounded catch-up pattern (replay up to 18–24 h of progress on load) exists if we ever want "time passes while away" — probably NOT wanted here (turn-based), noted for completeness.
