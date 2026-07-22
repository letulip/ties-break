# Design decisions log

Owner decisions, newest last. Working agreements – revisit explicitly, don't silently drift.

## 2026-07-22 – Initial concept round

**Match presentation**
- Viewing modes: **skip (instant result) / key points (30–60 s) / full match (2–3 min)**, with speed control. Digital-ADHD-aware: full match is capped at ~2–3 minutes, not 15.
- **Between-set coaching is gated by setup**: only available if the parent *is* the coach (Bublik-style). With an academy/pro-coach setup (Sharapova-style), the parent watches like a real parent.
- **Shouts from the stands** in key points: yes, engagement feature; affect morale at most (maybe nothing – deliberately uncertain, like real life).

**Campaign**
- Childhood (age ~5–14) = **accelerated prologue** (fast ticks, a few defining choices), detailed weekly simulation from junior age (~14–16+). Possibly offer start-age choice later (5–6 / 12–14 / 16).
- Full run = one child's whole career, to retirement (~30–35) or career-ending injury.
- Restart choice on failure/end: start fresh **or "raise a new star"** (second child meta).

**Gender / tours**
- Leaning **WTA-first** (the reference game has boys only – differentiation). Keep everything data-driven so the second tour is content, not code.

**Realism**
- Real currencies and real orders of magnitude for costs/prizes.
- Start country: **any, player's choice** (emoji flags), affects starting conditions (federation strength, costs, calendar distance).
- Tournament/organization names: **fictional but recognizable** analogues (ITF/ATP/Grand Slams are trademarks).

**Parent role**
- Parent is a **full character**: own job/income/time budget (work more = more money, less presence). Helps land first equipment contracts (racket/apparel product deals).

**Platform**
- Sim core: pure JS, framework-free, runs in a Web Worker (decided regardless of UI layer).
- UI layer: owner prefers vanilla JS (scaling experience from Tense Titans), knows Vue; final call pending tech research.
- Hosting: GitHub Pages, offline-first PWA.
- Language: **EN only** for now.
- Monetization: **none at launch**; later DesktopDrift-style ad hooks at match/season end. Design the hook points early, keep them dormant.

## 2026-07-22 – Stack confirmed, Phase 0 built

- **Stack approved by owner**: Vue 3.5 + Pinia + Vite. TypeScript chosen by Claude (delegated): "boring TS" style — strict mode, no generic gymnastics/enums/decorators; types exist to document the save schema and engine parameters, not to show off.
- **Cloud backup**: Google Drive (appDataFolder scope, client-side OAuth) accepted as an *optional, opt-in* backup channel — backlog, after MVP. Export/import to file stays the baseline; portal cloud saves also optional per-portal.
- **Google Play (future)**: via TWA (Bubblewrap/PWABuilder). It's real Chrome under the hood — same memory profile, but storage persistence is solid there (no Safari ITP) and it gives a store presence. Doesn't help iOS; not a reason to change architecture now.
- Phase 0 skeleton shipped: worker-owned world, deterministic seeded sim, IndexedDB save slots (gzip + SHA-256 + 3-slot autosave rotation), export/import `.tsave`, PWA (installable, offline precache), CI workflow for GitHub Pages. 17 unit tests green; browser-verified end-to-end incl. determinism replay.

## 2026-07-22 – Phase 1 gate notes (engine conventions)

- Delivery model confirmed by owner: architect (Fable) writes contracts/specs + gates; implementation by Opus/Sonnet subagents, strict TDD.
- Hold/breaks convention: a set tiebreak counts as one game that is neither hold nor break (7-6 set = 12 regular service games); `breakPointsFaced` counted per point (box-score convention).
- `contextOf` stays the sole authority for set/match-point flags; the engine's guarded fast path (probe only on game points at ≥5 games, or in tiebreaks) is protected by a byte-equivalence test replaying full matches through pure `contextOf`.
- Momentum is UI-visible but math-subtle by design: measured on/off effect ≈ 0.0001 on equal players; composure 0→100 swings ≈ 53/47 — matches the Klaassen–Magnus evidence.
- Icons: `public/ball.svg` (owner-supplied) is the canonical mark — favicon + in-app; PNGs for manifest are generated in its style via `npm run icons` (transparent any + dark maskable/apple).

## 2026-07-22 – Phase 2 gate notes (visualization)

- Playback reality: full match at 1× ≈ 3.5–7 min (mean ≈ 167 points; physics of per-shot timings). Resolution: UI defaults to **2× speed and 'key' mode** — full playback lands in the owner's 2–3.5 min target, 1×/4× remain a choice. Spec band updated to the honest [100, 470] s at 1×.
- Rally realism rulings: symmetric ±1 parity fix-up (≤4-shot share 0.556 on ATP hard, clay 6.2 > grass 4.4 mean shots), double faults decided before the first-serve draw at 0.09 conditional (df ≈ 3.4% of service points — real tour range). Rallies are presentation only, generated from `seed#pointNumber`, provably consistent with engine outcomes.
- `MatchViewer` props extended beyond the one-prop contract: `match, playerA, playerB, surface` (names/surface live in neither AnnotatedMatch nor MatchResult). Accepted; consider folding players+surface into AnnotatedMatch when the career screen arrives.
- Owner-supplied character art appeared in `public/images/fem-euro-brunnet/` (archetype × age-stage × emotion naming, ~37 MB source PNGs). Excluded `images/**` from the PWA precache (install stays ~140 KB); art loads on demand. TODO later: content pipeline to compress/downscale portraits (webp, ≤512 px) before shipping.

## 2026-07-22 – UI detour (owner-directed)

- **Mobile-first, landscape court**: court is horizontal (net = vertical center line), full panel width, aspect 2:1 — saves vertical space like the reference. Surfaces differ in play AND look (already in engine: grass serve +1.5 pp & aces ×1.5, clay −1.5 pp & ×0.6, rally length clay > hard > grass; renderer tints per surface).
- **Screen structure**: onboarding (full-screen) → 5 bottom tabs: Home (week loop), Play (matches), Kid (profile/portrait, later skills), Money (funds, later ledger), More (saves, new career, about). Auto-load most recent save on start.
- **Onboarding = identity + circumstances, NOT point-buy stats.** Owner-approved design: numeric stats never appear at creation; talent is discovered, not configured. Three future layers: hidden talent roll with hints (Phase 4), childhood-prologue choices shaping stats (Phase 6), traits/perks (Phase 4+). The only build-identity pick at creation is **play style** (aggressive / counterpuncher / serve-first / all-court) — an inclination that weights future growth, save schema v3.
- **Asset canon**: owner pngquant-compressed all portraits (`-fs8.png` suffix, 37→22 MB) and named the adult set (adult-norm/sad/serious/tired + jun-happy/sad/norm/injury) — portrait naming scheme: `{archetype}-{age-stage}-{emotion}`. Kid screen uses jun-norm.

## 2026-07-22 – Detour follow-ups (owner feedback round 2)

- Desktop: tab bar constrained to the 520 px content column (rounded top corners ≥560 px) — was full-window.
- After onboarding the shell now always lands on Home (was: whatever tab was active before reset, i.e. More).
- **Avatars**: face crops from each age-stage `norm` portrait live in `public/avatars/{jun,adult}.png` (256², sips crop offsets: jun 445/165 @340, adult 560/120 @320 from the 1254² sources; regenerate on new art). Header layout = avatar (round, accent ring), then name. Avatars sit outside `images/` so they ARE precached.
- Home-screen redesign proposed to owner (Tennis Star hub as reference, honesty-adjusted); pending owner feedback before Phase 3.

## 2026-07-22 – Name decided + Home hub direction (owner round 3)

- **Name: "Ties Break: Ace Parent"** (full, stores/web) / **"Ties Break"** (short, app icon/screen). Owner's pick; the pun stack: tiebreak + family ties breaking + ace parent. Originated from the owner's own art easter eggs. Manifest/index/docs updated; GitHub repo + Pages will use the new slug.
- **Play tab → Season tab** (📅): matches come from the calendar (tournament entries), not from a bare "play" button; exhibition demoted to "Friendly match" inside Season.
- **Weekly time allocation** (owner: "80-20, 70-30"): `WeekPlan {train, rest}` in save schema v4, presets Grind 85/15 · Balanced 75/25 · Light 60/40; affects weekly spend (factor 0.55 + 0.006·train) and log flavor now; real effects (growth/fatigue/injury/burnout) land in Phases 4/6. RNG draw-count invariance preserved (plan changes never alter draws per tick).
- **Next week** = the one big button (sticky above tabs on Home): resolves the planned week instantly — no timers, ever.
- Home hub v2 per approved mockup: player card with Coach's-eye quote (by play style) instead of an Overall number; season-tier strip; This-week card with plan presets + planned-spend range; news feed with typed emoji.

**Fairness principle (brand-level)**
- Never rig outcomes against the player. The reference game's most damaging reviews are about pay-to-win rubber-banding ("if you pay, you win"). Transparent, deterministic-ish sim math is a marketing feature.
