# Round-4 quick spec (owner items)

Branch `fix/quick-round4`. Nine owner "quick" items. TDD where engine/schema is touched;
the rest is UI/build wiring. Ground rules unchanged: economy in whole cents, all engine
randomness deterministic from the world RNG streams, the per-week MAIN-stream draw count
independent of player input.

## 1. Save schema v7 (append-only migration)

`SAVE_SCHEMA_VERSION` 6 → 7. Two new fields, both filled by an append-only `if (v < 7)` block:

- `profile.kidLastName: string` – migration default is a deterministic pick from the cohort
  surname pool via `rngFromSeed(save.seed + ':surname')` (`pickSurname` in cohort.ts). A brand
  new career gets its last name from onboarding; `DEFAULT_PROFILE.kidLastName = 'Martin'`.
- `world.prevKidRank: number | null` – default `null`. Weekly resolution sets it to the value
  of `kidRank` from the start of the tick (i.e. the previous week's rank) *before* recomputing
  the new rank, so Home can show week-over-week movement.

Idempotent for v7: a save already stamped v7 is trusted complete and is not touched (append-only
semantics), so the "current save passes through unchanged" invariant holds.

## 2. Golden saves corpus (backward compatibility = hard product guarantee)

`tests/fixtures/saves/v0.json … v7.json` – one world-shaped payload per historical schema,
reconstructed from the migration history:

- v0: pre-release dev save, no `schemaVersion`, no `fundsCents` (`{seed, week, log}`).
- v1: `+schemaVersion +fundsCents +log`, no profile.
- v2: `+profile` (no playStyle).
- v3: profile `+playStyle`.
- v4: `+plan`.
- v5: `+careerId` (still has `log`, no world systems).
- v6: full living world (`cohort, results, season, entries, events, nextEventId, kidRank`),
  profile without `kidLastName`, no `prevKidRank`. Cohort/season are shape-representative
  (trimmed to a couple entries) to keep the fixture readable – migration never regenerates a
  v6 world, so contents are exercised as shape only.
- v7: v6 + `profile.kidLastName` + `prevKidRank`.

`tests/goldenSaves.test.ts`: every fixture runs through `migrateSave` and satisfies the
current-schema invariants (schemaVersion === CURRENT, kidLastName non-empty string, `prevKidRank`
present and null|number, cohort/season/events arrays, no `log`). A guard asserts a fixture exists
for `SAVE_SCHEMA_VERSION` and for every version `0..CURRENT`, so a future bump fails until a new
golden save is added. `tests/fixtures/saves/README.md` documents the rule.

## 3. Weekly parent income (before costs)

`PARENT_INCOME_CENTS` in world.ts: wealthy `800_00`, middle `450_00`, working `200_00`.
`tickWeek` emits an `income` event ("Parents' contribution", signed +amount) BEFORE base costs,
adding it to funds. No RNG draw – the deterministic draw count per week is unchanged. Money screen
renders positive amounts green (`.num.positive`); the backward-reconstructed running balance still
reconciles because funds already include the contribution.

## 4. Surnames + short names

- `SURNAMES` pool exported from cohort.ts; `pickSurname(seedStr)` = deterministic pick.
- OnboardingWizard step 2 gains a "Last name" input with a 🎲 (prefill random via `Math.random`,
  UI-side randomness is fine outside the engine).
- `formatShortName(fullName)` in `src/shared/format.ts`: "First Last" → "F. Last" (split on the
  first space; a name with no space is returned unchanged). Used for EVERYONE in standings and in
  news match texts. Cohort names are "First Last"; the kid's full name is
  `kidName + ' ' + kidLastName`, so the kid also reads "V. Martin".
- Header keeps the first name only; Kid screen shows the full name.

Match-text names are formatted in the engine (world.ts `runKidTournament`); standings names are
formatted at render time in SeasonScreen (the engine keeps the full name on `StandingRow`, with the
kid's row now carrying the full name).

## 5. PWA update prompt

vite.config `registerType: 'autoUpdate'` → `'prompt'`. `src/pwa.ts` wraps `registerSW` from
`virtual:pwa-register` with an `onNeedRefresh` callback exposing a reactive `needRefresh` ref and an
`applyUpdate()` that calls `updateSW(true)`. `main.ts` calls `initPwa()`; App.vue shows an
`UpdateBanner` ("New version available" + Update button) when `needRefresh` is set.

## 6. News: newest-first + click-to-replay

- HomeScreen news is strictly newest-first across weeks (already) and now within a week too
  (descending event id). Milestones stay pinned to the top of their week group (standing owner
  decision from the phase-3 spec) – the one intentional exception to pure newest-first.
- Match events are clickable → open the shared `MatchReplay` component in the fixed dialog overlay
  with a clearly visible ✕ close button (`.replay-close`, also used by SeasonScreen).

## 7. Sticky header

`.app-header` becomes `position: sticky; top: 0` with panel background, a card border, a soft
shadow, and a z-index above scrolling content (below dialogs). The week+funds `.status-pill` grows
to ≥14 px with a larger tap target and hover affordance.

## 8. Home player card snapshot

Replace the "– Phase 3" rank stub with real data from the snapshot:
`#{kidRank}`, movement vs `prevKidRank` (↑n accent / ↓n red / — when null or unchanged), and the
kid's season points (from her `standings` row, `isKid`). Snapshot gains `prevKidRank`.

## 9. WebP art pipeline

- `sharp` devDependency; `scripts/optimize-art.mjs` converts `public/images/**/*.png` and
  `public/avatars/*.png` → `.webp` (longest side ≤ 512 px, quality 82), then MOVES each source
  `.png` into `art-src/` (mirrored path, kept in git, not served). npm script `art`.
- App references updated to `.webp`; `webp` added to the workbox `globPatterns`.
- decisions.md: all raster art ships as webp ≤ 512 px (SVG stays SVG); sources live in `art-src/`.

## Gates

`npx vue-tsc -b` clean; full `npx vitest run` green; `npm run build` clean; live-verify at 375 px.

## Spec conflicts / interpretation notes

- Item 3 text "Parents' contribution +$X": the "+$X" is the ledger's signed amount column, not
  baked into the event text (avoids double-rendering). Reported, not resolved unilaterally.
- Item 6 "strictly newest-first" vs the phase-3 standing "milestones pinned to top of their week":
  kept milestone pinning, newest-first otherwise. Reported.
