# Spec — Round-8 small fixes + the R6 W-L debt (UI slice)

**Branch:** `fix/round8-ui` · **Worktree:** `/Users/letulip/Projects/Claude/tb-uifix` (off main @ `a5845f6`)
Source: `docs/rounds/round-8.md` (small items only) + the rounds-sweep finding on W-L.
OUT of scope here: R8-1 (in-tournament player card), R8-3 full avatar-by-age wiring, R8-7b ladder
pacing, R8-10 coach popup, calendar decluttering (that's the vacations/planner slice). Player copy
uses the short dash "–".

## Items

### 1. R8-5 — DRAW round-tab contrast (CSS bug)
The selected round tab in the tournament DRAW view renders fully accent-yellow with unreadable
text. Fix: selected segment = dark text on the accent (the app's standard dark-on-lime), matching
every other segmented control. Check `TournamentFlow.vue` round tabs + related styles.

### 2. R8-2 — music pauses when the screen/tab hides
`visibilitychange` on `document`: when hidden → pause the background music `<audio>`; when visible
again → resume ONLY if it was playing before (respect the mute switch and the duck state). Wire in
`src/audio/music.ts` (single listener, feature-safe). Manual-verify note in the report.

### 3. R8-6a — runner-up is NOT sad
Losing the FINAL = 2nd place = a good result. The header/home avatar emotion mapping (round 5's
`lastKidMatchWon` in `App.vue` and any sibling use) must treat a lost final as `serious`, not
`sad`. Sad remains for pre-final exits.

### 4. R8-6b — emotion decay + state-aware idle emotion
A result emotion (happy/sad/serious) only lasts until the NEXT weekly tick. From the following week
the idle emotion derives from current state, using art that already exists:
- `snapshot.injury != null` → `injury`
- else `condition < 40` → `tired`
- else `condition < 60` → `serious`
- else → `norm`
Implement as a small pure helper (unit-test it) consumed wherever the avatar emotion is picked.
(Full stage-by-age portrait wiring stays OUT — separate slice.)

### 5. R8-4 — score on the "This week's tournament" card
On the Home "this week" tournament card, the bottom line shows the kid's played match score(s) for
that event once available (e.g. "6-3 4-6 7-5" from the latest match), else the existing content.
Derive from existing snapshot data (recent match events / pendingTournament view) — do NOT extend
the engine for this; if the data genuinely isn't on the snapshot, report that instead of hacking.

### 6. R8-8 — Home season strip: unlocked highlight + outgrown dimming (owner 25.07)
The Home season strip (driven by `bestFinishByTier`) currently greys a tier until first entry.
New rules:
- **Unlocked:** a tier with NO best finish yet but currently enterable (an upcoming event of that
  tier has `eligible: true`) renders in accent as "Unlocked – enter your first!"; after
  participation the best result replaces it (existing behavior). Locked-ahead tiers stay grey.
- **Outgrown (owner):** a tier she has OUTGROWN renders DIMMED as an outline/contour card (no
  fill), but the tier NAME and her best result/place on it STAY accent-yellow — earned history
  stays proud, the card itself recedes.

### 6b. Lock-pill text brightness (owner 25.07)
The "Reach N pts" (and sibling lock labels) currently render in the pale muted tone — too faint.
Brighten the LABEL text (e.g. a soft-amber tone) while the pill stays visually disabled. Apply to
the Season calendar lock pills and anywhere the same pill pattern is used.

### 7. R6 debt — W-L in the Stats header
The engine already tracks `world.seasonWins` / `world.seasonLosses` (since the season wrap-up work;
reset each season, accumulated in `finalizeTournament`). Round 6 omitted W-L because the engine
didn't track it — that blocker is gone:
- `protocol.ts`: `Snapshot` += `seasonWins: number`, `seasonLosses: number`.
- `world.ts` `toSnapshot`: populate both.
- `StatsScreen.vue` header row: add "W–L: {wins}–{losses}" beside rank/points.
No schema bump (Snapshot is derived, WorldState already persists the fields). Unit-test the
snapshot exposure.

### 8. R8-7a — entered-then-outgrown → auto-withdraw + refund (small engine fix)
Real-world rule: entry lists close at the deadline; players out of band at close are removed and
refunded. Implement: on the weekly tick, if the kid holds an entry for a future event whose tier
she has now OUTGROWN (points above `enterPointBand` max), auto-withdraw it via the existing
`withdrawEvent` (full refund — mirror of slice C's injury auto-withdraw) and emit an info event:
"Entry released – she's outgrown {label}. Fee refunded." Pure state, ZERO RNG draws (the existing
invariance suites in tests/injuries.test.ts and tests/condition.test.ts MUST stay byte-identical
— run them). TDD: test that an entered local event auto-refunds when her points cross the band,
and that the refund lands in the ledger.

### 9. Pipeline guard (owner 25.07: "надо, чтобы пайплайн не ломался — локальные проверки")
Context: main was broken twice today by cross-branch semantics (exam-gate × bench policy; then a
merge keeping BOTH copies of a byte-identical guard → duplicate-import TS2300). The TS2300 also
hid locally because `vue-tsc -b` trusts its incremental cache. Add guards:
- `package.json`: a `check` script = `vue-tsc -b --force && vitest run && vite build` — the one
  command to run after any merge.
- `.github/workflows/*`: ensure BOTH the PR CI and the main/deploy workflow run
  `npx vue-tsc -b --force` (the `--force` is the point) before tests/build. Read the existing
  workflows first and keep their structure; smallest possible diff.

### 10. Checkboxes
Tick the completed items in `docs/rounds/round-8.md` (R8-2, 4, 5, 6a, 6b, 7a, 8) with one-line
"→ file" pointers, and add a "W-L (R6 debt)" line marked done. Leave the rest open.

## Gate
`npx vue-tsc -b` 0 · `npx vitest run` all green (incl. untouched B1/C1 invariance freezes) ·
`npm run build` clean. Commit on `fix/round8-ui`; do NOT push; do NOT edit docs/decisions.md.
Report: files changed, pass counts, which items are browser-verifiable and what you verified.
