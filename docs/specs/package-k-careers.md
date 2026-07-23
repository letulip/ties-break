# Package K: career profiles + save model + quick UX wins

Owner-approved (Q&A items 1, 5-partial, 6, 7, 9, 18). Ground rules as in phase1 spec (TDD where tests exist, no new deps, `npx vue-tsc -b` 0, full `npx vitest run` green, `npm run build` 0, touch only your files).

## K1 — core: careers & save generations

Files: `src/db/saves.ts` (rewrite), `src/db/idb.ts` (only if a helper is needed), `src/engine/world.ts` (schema bump only), `src/engine/migrations.ts`, `src/shared/protocol.ts` (contract additions below), `src/worker/sim.worker.ts`, `src/stores/game.ts`, `tests/saves.test.ts` (rewrite), `tests/migrations.test.ts` (extend).

Model:
- A **career** is identified by `careerId` (generated at creation: `c-` + seed + `-` + base36 timestamp). `WorldState` gains `careerId` → SAVE_SCHEMA_VERSION **5**; migration `v<5`: `careerId = 'legacy-' + seed`.
- IndexedDB DB_VERSION **2**: existing store `saves` keeps keyPath `slot`; records gain `careerId`, `kidName`, `country`. New store `careers` keyPath `careerId`: `{ careerId, kidName, country, seed, createdAt, lastPlayedAt, week }`. The `onupgradeneeded` v<2 block migrates in place: every existing record gets `careerId = 'legacy-' + record.seed`, and one `careers` row per distinct careerId is backfilled (kidName/country unknown → 'Vera'/'US' — matches DEFAULT_PROFILE of those saves). Old slot keys are rewritten to the new naming (delete + re-put inside the upgrade transaction).
- Slot naming: autosave = `auto:{careerId}:a` and `auto:{careerId}:b` — **two alternating generations** (write to the older one each time). Named saves = `manual:{careerId}:{name}` (name sanitized `[a-z0-9-]`, max 24 chars).
- API: `listCareers()`, `deleteCareer(careerId)` (slots + meta), `listSlots(careerId)`, `autosave(world)` (alternate generation + upsert career meta with `lastPlayedAt`, `week`), `readLatestAutosave(careerId)` → tries the newer generation, on checksum/decode failure falls back to the older and returns `{ world, recovered: boolean }`, `readSlot(slot)`, `writeNamed(world, name)`, `deleteSlot(slot)`.
- Protocol: `Snapshot` + `careerId`; `SlotMeta` + `careerId`; new `CareerMeta` type. `ToWorker` additions: `listCareers`, `loadCareer {careerId}` (latest autosave, fallback-aware), `deleteCareer {careerId}`, `saveNamed {name}`; `listSlots` gains optional `careerId` (default: active career). `ToUI` additions: `{type:'careers', careers: CareerMeta[]}`; `snapshot` responses may carry `recovered: true` when the older generation had to be used.
- Store (`game.ts`): state `careers: CareerMeta[]`; actions `refreshCareers`, `loadCareer(careerId)`, `deleteCareer`, `saveNamed(name)`; `init()` now: refreshCareers → load most-recent career's autosave if any (by lastPlayedAt); `newCareer(seed, profile)`: when seed is empty the STORE generates a readable one: `{kidName-lowercased}-{4 base36 chars from Math.random}` (UI-side randomness is allowed outside the engine).
- Worker `new`: creates careerId (Date.now allowed in worker), all save operations scoped to the active career.

Required tests: DB v1→v2 upgrade (seed a v1-shaped database via fake-indexeddb first, then open with v2 code: old slots become career-scoped, careers backfilled); autosave alternation (3 saves → generations a,b,a; both readable); corruption fallback (flip a byte in the newer generation's payload → readLatestAutosave returns older with `recovered: true`); career isolation (two careers, 5 autosaves each → neither evicts the other; deleteCareer removes only its rows); named save overwrite; migration v4→v5 (careerId backfilled).

## K2 — UI: careers, popups, quick wins (after K1)

Files: `src/components/ConfirmDialog.vue` (new, tiny: message + Confirm/Cancel, emits; overlay), `src/components/OnboardingWizard.vue`, `src/components/screens/MoreScreen.vue` (rewrite), `src/components/screens/MoneyScreen.vue` (no-op unless needed), `src/App.vue`, `src/style.css` (append + the spacing pass below).

- Onboarding: **remove the seed input** (summary step has no seed row; store generates it).
- Header: the `W{n} · ${funds}` pill becomes a button → switches to the Money tab (hover accent; cursor pointer).
- Home advance bar (App.vue): "▶▶ 52" → **"▶▶ 4"** (a month; event-stops arrive with Phase 3). A dev-only "▶▶ 52" moves to More's danger zone.
- MoreScreen: **Careers** section — one row per career (kidName + flag, "W{week} · age {14+floor(week/52)}", last played date; active career gets an accent pill); row actions: Load, Delete — both behind ConfirmDialog (delete copy names the career and says it removes ALL its saves). **Saves** section (active career only): Autosave row (relative time; a muted "Restore previous" link → loads the older generation behind a confirm) + named saves + "Save as…" (inline name input; overwriting an existing name asks via ConfirmDialog). Export/import stays. **About**: add a `Seed` row (copyable text). "New career" confirm copy becomes honest: "Your current career stays saved — you can switch back anytime in Careers."
- If a snapshot arrives with `recovered: true`, show a one-time hint: "Autosave was damaged – restored the previous one."
- **Spacing pass** (Q&A #18): audit `style.css` to the 4/8/12/16/24 scale; rule: outer gaps ≥ inner gaps (section margin ≥ section padding ≥ intra-card gaps). Adjust values only — no structural rewrites.

Gates for both: full suite green (K1 adds tests; K2 adds none, breaks none), typecheck, build, K2 also live-verifies at 375 px (careers list, both popups, save-as, pill→Money, no seed in onboarding) with a clean console.

## Reporting
Files, terse behavior notes, gate status, spec conflicts (report, don't resolve).
