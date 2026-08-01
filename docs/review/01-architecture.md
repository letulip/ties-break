<!-- Full project review, 2026-08-01, reviewed at origin/main b7a9358 (branch docs/full-review). -->
<!-- Method: independent reviewer agent per dimension, read-only; top findings adversarially verified (see README.md). -->

# Architecture Review – Ties Break: Ace Parent

## Verdict

This is one of the most disciplined solo-project architectures I have reviewed: a worker-authoritative deterministic engine behind a typed RPC protocol, a 327-line Pinia facade, hand-rolled 25-line IndexedDB glue, and a golden-save corpus covering all 34 schema versions. The layering rules are not just followed – they are written into the code at every seam and grep confirms they hold (nothing in engine/worker/db/shared imports UI or store code). Two structural debts dominate everything else: `world.ts` has become a 5,521-line god module that every feature wave must edit, and the load-time RNG restore replays the entire career instead of persisting one 32-bit integer – a decision whose protective invariant ("zero MAIN-stream draws") now taxes every new feature and test suite. The three actions that matter: persist the RNG state (one schema bump, deletes an O(career) load cost and relaxes a repo-wide constraint), split `world.ts` along the section banners it already contains, and gate or remove the production-shipping "▶▶ 52 (dev)" button that bypasses the knock/tournament blocking contract.

## Strengths

- **Worker-authoritative state, thin UI.** The store (src/stores/game.ts) holds only `{snapshot, slots, careers, busy, error}` and forwards typed commands; the engine re-validates every command itself (`enterEvent` re-checks deadline, funds, and the entry gate and throws – world.ts:4587). A stale or malicious screen cannot corrupt the world. The sim genuinely runs off the main thread.
- **One-way layering, enforced in code.** Sub-modules (diary, radar, knock, kidLife, coachLoad, offers, body, condition) are deliberately world-free; world.ts composes them, and each import site documents the direction (world.ts:123-169). Grep finds zero engine/worker/db imports of Pinia or Vue.
- **Save-format ownership is exemplary.** Append-only migrations (engine/migrations.ts, v0 to v34), a golden-save fixture per version enforced by test (tests/goldenSaves.test.ts), gzip + SHA-256 payloads (engine/saveCodec.ts), two-generation autosave with checksum fallback surfaced to the UI as `recovered` (db/saves.ts:295-312).
- **Determinism as an invariant, not a hope.** Purpose-scoped RNG sub-streams (`seed:injury:<week>`, `seed:aitour:<event.id>`), a frozen main-stream capture (41550 draws / e6b0c709) re-derived in five suites, and match viewing that re-runs the pure `simulateMatch` on the same seed rather than storing replays (MatchReplay.vue:4-28). The "match is a show, decoupled from outcomes" pillar exists in the code, not just in the README.
- **KISS dependency footprint.** Runtime deps: vue + pinia. No router (App.vue tab switching is adequate for 5 tabs), no IDB wrapper library, no state-machine framework. The 14 composables are stateless derivation layers – no module-level `ref()` anywhere, so state lives in exactly two places.
- **Measurement culture.** 19 benches in tools/, tied to specs; load-bench.ts documents baseline-before-mechanism discipline. Perf claims in docs/research/04-tech-feasibility.md are measured (tick ~1.5 ms), not guessed.

## Findings

**[HIGH] world.ts is a god module – src/engine/world.ts**
5,521 lines (it has grown past the 5,293 in the brief), 161 top-level functions, 111 exports. It contains the 245-line `WorldState` interface (200-444), the tick pipeline (4171-4493), `advanceWeeks` (4780), all ~20 command functions, the entry/arrival/medical/layoff gates (1364-1785), injuries, the coach market, sponsor and academy reviews, the season wrap-up, and the 260-line `toSnapshot` (5259-5521). The extraction pattern that works elsewhere (diary, radar, knock are leaf modules) stops at world.ts's door: orchestration, gates, commands and snapshot assembly all pile into one file. Combined with the one-branch-per-wave workflow, this file is the permanent merge hot-spot. **Fix:** split along the banner comments it already has – `gates.ts` (availability/entry/arrival/medical), `commands.ts` (player actions), `lifecycle.ts` (createWorld/tickWeek/advanceWeeks), `snapshot.ts` (toSnapshot + helpers), keeping `worldState.ts` for the interface. Mechanical moves; the internal one-way discipline makes this safe.

**[HIGH] RNG restore replays the whole career, and its protective invariant taxes everything – src/worker/sim.worker.ts:64**
`restoreRng` re-simulates a probe world with full `tickWeek` (AI tournaments, ranking recompute) once per elapsed week on every load and import. Cost is O(career length) – measured ~1.5 ms/week on desktop V8, so a 20-year career approaches 2 s, worse on phones. Validity depends on the per-week main-stream draw count being player-independent AND stable across versions; the frozen capture pinning it was already re-pinned once (tests/injuries.test.ts:55, 51642 to 41550), which silently moved every loaded old career onto a different stream position than it actually consumed. Worse, the invariant is a constraint generator: dozens of "ZERO MAIN draws / the frozen capture cannot move" notes across world.ts show every feature must justify itself against this replay. The mulberry32 state is one 32-bit integer (engine/rng.ts:21). **Fix:** persist the stream state in schema v35, drop the replay, and downgrade the draw-count discipline from load-bearing to nice-to-have. The sub-streams keep their independent value (event-scoped bracket replay); the tax disappears. The worker comment already promises exactly this ("Phase 1+ will persist stream state properly").

**[MEDIUM] Production-reachable dev command bypasses engine invariants – src/components/screens/MoreScreen.vue:345**
"▶▶ 52 (dev)" calls `game.tick(52)` with no `import.meta.env.DEV` gate. The `tick` command loops raw `tickWeek` (sim.worker.ts:80-85), skipping `advanceWeeks`' hard guards on `pendingTournament` and unanswered knocks (world.ts:4780-4791) – the exact "weeks just got skipped" failure the knock slice exists to prevent, and `tickWeek` can reach `computeShadowTournament` with an unfinished reveal still pending. **Fix:** gate the button behind `import.meta.env.DEV`, or make the worker's `tick` handler apply the same pending guards.

**[MEDIUM] The Snapshot is not the real UI contract – ~60 engine import sites in the UI**
Components and composables import from `engine/world`, `engine/economy`, `engine/coach`, `engine/season/calendar`, `engine/rng` (e.g. SeasonScreen.vue:40-56). Part of this is by design (match replay must run the pure sim). But reaching into world.ts for `KID_ID` and `flipScore` drags the god module's graph into the main bundle that the worker chunk already ships, and erodes "the UI only ever sees snapshots" (protocol.ts:2) into "snapshots plus whatever a screen chose to call". **Fix:** move UI-consumed constants and pure display helpers into shared/ (or a deliberate engine public barrel), and reserve deep engine imports for the match-replay components where they are the design.

**[MEDIUM] Snapshot monolith rebuilt per command – src/shared/protocol.ts:1378**
`Snapshot` spans 209 lines and every command – including `setPlan` and `setPhysio` – responds with a full `toSnapshot` (diary copy selection, radar fog, kid-life tiles, event previews) that is then structured-cloned across the worker boundary. Acceptable today; there is no invalidation seam for when it is not. **Fix direction:** keep the single-snapshot model (it is a good simplicity bet) but carve `toSnapshot` into named sub-builders now, so memoizing the expensive ones later is a local change.

**[MEDIUM] Screen monoliths – src/components/**
MatchViewer.vue 2,235 lines, SeasonScreen.vue 1,869, HomeScreen.vue 1,705, TournamentFlow.vue 1,684, App.vue 908 (doubling as overlay router, and patching store state directly at App.vue:207). The composables extract derivations well; the screens still mix orchestration, animation clocks and template in single files with no component tests at this size. **Fix:** extract per-screen sections into child components the next time each screen is touched; no big-bang rewrite needed.

**[LOW] No worker request queue, no store re-entrancy guard – sim.worker.ts:283, stores/game.ts:41**
Handlers interleave at `await autosave`; `run()` sets `busy` but never refuses a concurrent call, and `:disabled` only lands on the next render – a fast double-tap can advance 8 weeks instead of 4. **Fix:** a five-line promise-chain queue in the worker, or `if (this.busy) return` in `run()`.

**[LOW] engine/match depends on src/viz – engine/match/rally.ts:17**
The rally contract types plus the runtime `COURT` constant live under viz/ but are authored by the engine. No cycle, but the presentation directory sits inside the engine's dependency cone. **Fix:** move viz/types.ts to shared/.

**[LOW] Migrations call live engine helpers – engine/migrations.ts:20**
Old `if (v < N)` blocks use current helpers from world.ts/coach.ts, so a semantics change silently rewrites history. The golden corpus catches invariant breaks but not all output drift. **Fix:** inline frozen constants into migration blocks going forward.

**[LOW] localStorage as a second persistence channel – composables/weekRecap.ts:92**
Per-career watermarks and preferences live outside the save, deliberately and with written rationale, but they do not travel with .tsave export and are orphaned on career delete. Accepted trade-off; keep a single key-prefix registry so cleanup stays possible.

## Recommendations

1. **Persist the RNG stream state (schema v35) and delete `restoreRng`'s replay.** One integer in the save removes an O(career) load cost, ends the cross-version stream-drift class of bugs, and relaxes the "zero MAIN draws" tax on every future feature. Highest leverage change in the repo.
2. **Split world.ts along its own section banners** into gates / commands / lifecycle / snapshot / state modules. Mechanical, low-risk (the frozen-capture and golden-save suites are exactly the safety net this refactor needs), and it dissolves the merge hot-spot.
3. **Gate the dev fast-forward** behind `import.meta.env.DEV` or make the worker's `tick` honor the pending-knock/tournament guards. Small fix, protects a core design contract in production.
4. **Declare the engine's public surface for the UI**: move UI-consumed constants/labels into shared/, relocate viz/types.ts there too, and keep deep engine imports only in the match-replay components. This also trims the double-shipped engine code in the main bundle.
5. **Add a worker request queue and a `run()` re-entrancy guard** – ten lines total, closes the double-tap and autosave-interleaving windows.
6. When screens are next touched, **extract child components from SeasonScreen/HomeScreen/MatchViewer**; do not schedule a dedicated rewrite.

Overall: the architecture is right-sized for the game – simpler than it looks (two runtime deps, no router, one store) and more rigorous than most shipped games about determinism and save compatibility. The debt is concentrated, named, and in two of three cases already acknowledged in the code's own comments; pay down items 1-3 before the next feature wave widens world.ts further.
