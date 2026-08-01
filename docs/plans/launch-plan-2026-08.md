# Launch plan 2026-08 — waves, agents, and the full findings ledger

Written 01.08.2026, companion to [roadmap-2026-08.md](roadmap-2026-08.md). The roadmap says WHAT
and WHY in five phases; this document says WHO and IN WHAT ORDER: every wave as an agent
assignment with entry criteria, scope, files, exit gates and effort — and, at the bottom, the
complete findings ledger of BOTH reviews (docs/full-review P1–P9 and the Codex review TB-01..24
plus its headline P0/P1/P2 table), every row mapped to a wave, already-done, or
rejected-with-reason. Nothing from either review is left unmapped.

**How to read a wave row.** `Agents` is how many parallel builders the wave takes. `Entry` is
what must be MERGED before launch (not merely pushed). `Exit` is the wave's own gate on top of
the standing one. Effort: S <0.5d · M 0.5–2d · L 2–5d · XL >5d of agent time.

**Standing rules for every agent brief** (stated once, referenced by every wave): worktree of
its own off origin/main, one branch, push to github origin only, never main; `npm run check`
green before push, never chained onto the push; guards re-aimed with ⚠ + owner quote, never
deleted; player copy short dash – only, no Cyrillic in templates; bench before any tuning claim,
numbers in the report; schema bumps only where the wave says so, with migration + golden fixture
+ README row; the RNG regime of the moment (frozen capture 41550/e6b0c709 until W1-RNG lands,
pairwise A/B invariance after); final report verified against the brief by the architect before
it reaches the owner.

---

## The dependency graph

```mermaid
flowchart TD
  W0[W0 housekeeping<br/>owner + architect, hours] --> W1Q[W1-QUICK quick wins<br/>1 agent, M]
  W0 --> W1R[W1-RNG persistence v35<br/>1 agent, L, QUIET WINDOW]
  W1R --> W1A[W1-INTEGRITY-A worker pipeline<br/>1 agent, L]
  W1R --> W1B[W1-INTEGRITY-B import + recovery<br/>1 agent, M]
  W1Q -.no dependency, just scheduling.-> W1R
  W1A --> W2C[W2-CONTRACT v1 career page<br/>owner, hours]
  W2C --> W2E[W2-ENDINGS v36<br/>1 agent, L]
  W2E --> W2P[W2-PSYCHE v37<br/>1 agent, L]
  W2E --> W2T[W2-TEMPO pacing + onboarding<br/>1 agent, M]
  W2E --> W3I[W3-INMATCH in-match injury<br/>1 agent, L]
  W1A --> W3F[W3-FIELD living-field phase 2<br/>1 agent, XL]
  W3F --> W3B[W3-BALANCE harness + reprices<br/>1 agent, L]
  W2P --> W4M[W4-MOBILE platform wave<br/>1-2 agents, L]
  W4M --> W4Q[W4-QUALITY tests + builds<br/>1 agent, L]
  W1A -.gaps between waves.-> P4[P4 world.ts extractions<br/>architect, 15 small PRs]
```

Parallelism at a glance: W1-QUICK can run beside W0. W1-RNG runs ALONE (quiet window). The two
INTEGRITY agents run in parallel with each other. W2-PSYCHE, W2-TEMPO and W3-INMATCH can run in
parallel after W2-ENDINGS. W3-FIELD is independent of Phase 2 and can start once W1-INTEGRITY-A
merges. The P4 extraction lane fills every gap.

---

## Phase 0 — W0 · Housekeeping (owner + architect, no agents, hours)

No brief — a checklist executed by hand:

1. Merge wave/2026-08-01; delete merged branches (payload-vs-origin/main check before every
   `-D`) and their worktrees.
2. **Back up `art-src/`** to cloud or external disk — the masters exist only on one laptop
   (Codex TB-24's sharpest point; the trophy incident proved the fragility class). Formal
   versioned storage comes in W4-QUALITY; the copy happens NOW.
3. Commit the Codex review onto its branch under `docs/review-codex/` (it sits as untracked
   files; both reviews claim `docs/review/`, so the path splits at commit time).
4. `npm audit` — apply the available `brace-expansion` transitive fix (Codex action #5); rerun
   the full check.
5. Close stale task-ledger rows; open rows for the waves below.

## Phase 1 — Foundations

### W1-QUICK · Quick wins (1 agent · M · entry: wave merged)

Sources: Claude P6 whole; Codex TB-19 (dev-action half), TB-22 (money half), TB-20 (theme
half); + one stowaway found by the living-field smoke.

- `src/shared/money.ts`: `formatCents`/`formatCentsSigned`; all 15 call sites converted; the
  dollars-in `formatDollars` trap dies; DRY-gate test.
- MoneyScreen reads `STARTING_FUNDS_CENTS` from the engine (hand copy deleted).
- `▶▶ 52 (dev)` gated `import.meta.env.DEV` AND the worker `tick` handler refuses
  `pendingTournament || pendingKnock` — defense in both layers.
- `test:sim` reliably green: split the reach-tracker describe, `it.each` the preset loops,
  `fileParallelism: false` for the sim project. ⚠ The weekly calibration cron first fires
  Monday 03.08 — one red run is accepted and is itself the repro; land this before the second.
- Theme sync `#0f172a` → `#0a0e13` (vite.config + index.html) + a design-tokens pin.
- **Stowaways:** the W-tier tournament header prints "Prize money –" although `prizeCents`
  exists (surfacing bug, no engine change); and the W15 lock chip prints "58 / 120 national
  pts" for a band denominated in ITF junior points — `pointsLockNote` hardcodes the domestic
  label (round-15's find).

Exit: gate + a browser pass over Money/More/Season headers; the cron's next run green.

### W1-RNG · RNG persistence, schema v35 (1 agent · L · entry: W1-QUICK merged; NOTHING else in flight)

Source: Claude P3 verbatim (its document is the brief), acknowledged by Codex ("RNG restoration
is linear in career age"). Persist `rngMain: {s, n}`; delete the per-load career replay;
migration performs the one final replay; `restoreRng` survives only as corruption recovery.
Convert the five frozen-capture suites to pairwise A/B input-independence (one informational
pin stays). Golden fixture v35. Bench: `tools/restore-bench.ts` before/after (expect O(weeks) →
O(1); the owner's Naomi save is the perfect fixture at 193 weeks).

⚠ This wave changes the REGIME every later wave works under — the quiet-window requirement is
absolute: no other engine branch may be in flight while it lands.

### W1-INTEGRITY-A · Worker pipeline (1 agent · L · entry: W1-RNG merged)

Sources: Codex TB-02 → TB-03 → TB-01 → TB-05, in that internal order, + TB-04's CAS half. All
three load-bearing claims verified against the code before adoption (load writes no autosave of
the restored state; `onerror` keeps the dead worker; handlers interleave across awaits).

- FIFO executor + monotonic `revision`; mutating requests carry `baseRevision`; typed
  `STALE_REVISION`.
- Candidate-state commit: mutate a candidate world + candidate `rngMain` (v35 made the RNG
  serializable — the reason this wave follows W1-RNG), persist save+metadata in ONE IndexedDB
  transaction, then commit memory. Injected storage failure leaves everything unchanged.
- `restoreSlot` as a distinct command: restored state becomes the newest autosave BEFORE
  success; restore → close → relaunch opens the restored state (integration-tested).
- Recoverable worker: generation tokens, per-command timeouts, terminate-and-recreate,
  "Simulation restarted from the last saved week" copy.
- Cross-tab: revision compare-and-swap at write time (the full Web-Locks lease of TB-04 is
  DEFERRED — recorded in the ledger as partially adopted).

Exit: Bundle A's own exit condition from the Codex catalogue, as tests.

### W1-INTEGRITY-B · Import hardening + storage recovery (1 agent · M · parallel with A)

Source: Codex TB-06 + the Settings-error half of TB-19. Different seam from A (saveCodec /
migrations / MoreScreen vs worker/client), hence parallel-safe.

- Size caps (compressed + expanded) before parse; full schema/range/bounds validation into
  candidate variables; commit-or-nothing.
- IndexedDB init becomes a total state transition: `loading → ready | recovery`; rejected DB
  promise resets so Retry works; visible recovery UI (retry / import / export / new career).
- Settings renders typed save/import/export errors; named-save deletion confirmed or undoable.
- Fuzz fixtures: oversized, truncated, corrupted, previous-schema.

## Phase 2 — The product spine

### W2-CONTRACT · The v1 career contract (owner, one page, hours)

Source: Codex TB-07's decision half. Full career vs honestly-marketed junior chapter; the
supported endings; epilogue evidence; the replay loop; what stays post-v1.
adult-tour-and-endings.md §4 + concept-ru.md's six finales are most of the draft. W2-ENDINGS
implements against this page — it is the entry criterion.

### W2-ENDINGS · Endings, schema v36 (1 agent · L · entry: W2-CONTRACT signed, W1-INTEGRITY-A merged)

Sources: Claude P1 verbatim (the brief), = Codex TB-07's build half; task #47. Bankruptcy with
a swept grace window, the last injury, retirement from 19, age-out, the reckoning screen off
the durable ledgers, epilogue grades. Evidence already in hand: 7/216 bench careers stranded at
18+; the P5-A cell stops entering everything by week ~167–215. `'ending'` stop reason;
`guardNotEnded` on every mutating command; `tickWeek` stays total. Bench:
`tools/endings-bench.ts`, rates in both bases, grace-N swept {4,6,8,12} against the 60–80%
survival band. README/claims rewritten to the contract (closes Codex's "docs are not a
trustworthy source" P1 for the product half).

### W2-PSYCHE · Morale + bond, schema v37 (1 agent · L · entry: W2-ENDINGS merged)

Sources: Claude P2 verbatim, = Codex TB-09 in spirit; + the ONE kernel adopted from TB-11: the
daughter's voice in the investor scene, remembered by the bond — drama without moralising, the
owner's standing ruling intact («Мы ни за что не наказываем»). Zero draws by construction;
composure factor neutral in the 40..80 band; equilibria bench-verified BEFORE any UI surfaces
them; plugs `'quit'` into W2-ENDINGS' union. Diary tone licences keyed on morale bands.

### W2-TEMPO · Pacing + truthful onboarding (1 agent · M · entry: W2-ENDINGS merged; parallel with W2-PSYCHE)

Sources: Codex TB-08 + TB-13. The third advance speed — "until the next decision" — over the
existing stop discipline, quiet weeks aggregated into one honest recap row; stop-set includes
W2-ENDINGS' terminal states (the dependency). Onboarding copy pass: every setup claim maps to a
mechanic or is labelled flavour; play-style gets zero-sum starting weights OR tendency copy
(owner picks in the brief); "All countries" → supported list; background labels rewritten as
resources/flexibility/pressure. Both reviews' claim-vs-code tables are the work list.

## Phase 3 — World depth

### W3-FIELD · Living-field phase 2 (1 agent · XL · entry: W1-INTEGRITY-A merged; parallel with Phase 2)

Source: the shipped spec's own §8.3 (neither review — both predate the slice). J/domestic
candidate universes (their mixed-percentile trap still stands — measured medians 20/30 for
j300/j60 fields), field-pro fatigue (phase W is always-fresh, conservative-hard), pros in
canonical AI brackets and the news, real aging/turnover instead of the per-season re-deal,
name-pool widening. Exit: field-quality bench re-run across ALL tiers; capture/A-B regime
green; the P5-A bench re-run (its spec §3 REQUIRES this second baseline before any Phase B
talk).

### W3-INMATCH · The in-match injury (1 agent · L · entry: W2-ENDINGS merged — the last-injury ending is the consumer)

Source: the owner, 01.08 («может получить травму прямо в процессе матча, интересно!»). NEW —
neither review saw it. Today an injury rolls once per week at the top of the tick, BEFORE the
tournament: a play-week injury is a walkover and the player never sees a moment. The design:

- The weekly injury BUDGET stays (season rates must not move — bench-pinned): on a competition
  week the same probability decides, on the event's own sub-stream, whether the injury fires
  IN-RUN — and if so, in which match, at which point.
- The run truncates: that match becomes a retirement ("ret." at the stored score), remaining
  rounds a withdrawal, finish = that round's loss (wave-B points rules unchanged).
- Match records gain optional `{retiredAt, retiredBy}` — optional-additive on a persisted type,
  NO schema bump (the v32 precedent).
- MatchViewer stops playback at the point and says it; the box score marks ret.; the reveal
  flow hands off to the existing InjuryStopDialog; the layoff machinery is unchanged
  downstream.
- Inputs stay the rich ones that already exist (condition, clearance 'warn', the knock's
  weakened part, kit wear) — the slice moves WHEN, not WHETHER.
- Phase 2 of the slice (cheap, later): the OPPONENT can retire — she advances.

Cost honestly: engine M (onset + truncation + finalize), viz M (the viewer/commentary/box-score
half is the bigger part), balance S (rate parity bench), tests M (injury suites + private
`:injury:` stream pins re-aimed with ⚠). Total L. The dramatic payoff is outsized: the game's
stated differentiator is the watchable match, and this puts its worst moment on screen instead
of eating it silently before the trip.

### W3-BALANCE · The balance harness + reprices (1 agent · L · entry: W3-FIELD merged)

Sources: Codex TB-14 + roadmap items 11–12 + P5-A's quantified finding.

- One versioned deterministic harness folding the bench fleet (econ/fatigue/field-quality/
  dual-universe) into a machine-readable artifact per release candidate; bands with tolerances;
  `creditNonPlayingRecovery` extracted (the known skip-week accident becomes an intended rule).
- W fatigue re-priced against REAL fields (the round15 numbers are explicitly priced for soft
  fields; the code carries the note).
- The champion-news contradiction (announced ≠ paid in ~91% of her played events): present the
  owner both options with both baselines — teach the news to speak about two tables honestly,
  or reopen P5 Phase B against its pre-registered threshold on the new data.
- #53 (who reaches the elite) measured together with the National ceiling and the brand-deal
  condition.

### W3-LATER · Weather #67 · Prologue #71

Owner-sequenced («финалы, а пролог после них»): the prologue waits for W2-ENDINGS; weather is
free-standing (the WeatherPlate contract was built for exactly this swap). Briefs exist in the
task ledger; scheduled when the owner calls them.

## Phase 4 — Platform quality

### W4-MOBILE · The mobile platform wave (1–2 agents · L · entry: Phase 2 merged)

Sources: Claude P8 (safe areas, system back, dialog semantics) enriched with Codex TB-15/16/17/18
where sharper — Codex's inventory of exact offending selectors (the flat 24px `--app-pad-top`,
the heroes' `top: 20px` chrome, `.tf-top`'s flat 16px, the three floating CTAs anchored at the
tab bar's height WITHOUT its safe-area padding) is the work list. One `DialogShell` (native
`<dialog>` preferred) migrated flow-by-flow, critical reports non-dismissible; history-mapped
navigation for the stable screens, back closes the topmost surface; `aria-current`, one h1 per
screen, throttled match live region + static result line (TB-17); 320px calendar,
40–44px targets, the dim-token contrast promotion (TB-18). If two agents: shell+navigation /
geometry+screens split.

### W4-QUALITY · Tests, lint, assets, releases (1 agent · L · entry: W4-MOBILE merged)

Sources: Claude P9 + Codex TB-23 + TB-24's second half + TB-20.

- BOTH UI test layers (the reviews chose different ones; both won): five mounted component
  smokes (happy-dom) AND 10–15 Playwright+axe journeys at four widths. No DOM snapshots; no
  formatting lint — the twin rules both reviews arrived at protecting the source-pin corpus.
- ESLint flat config, correctness-only; coverage report; the `vue/return-in-computed-property`
  catch fixed.
- Asset diet (~1 MB: icon recompression, the zero-consumer logo dropped); audio cache policy
  (music is currently deferred by licence — the policy ships with the toggle);
  release discipline: tags, CHANGELOG, build id in About (a bug report can name a build).
- Pure builds: `art:ingest`/`art:optimize` split (build never mutates the authoring tree),
  masters' versioned storage formalised, pinned toolchain, release checklist.

### P4 · world.ts decomposition — the standing background lane (architect, 15 small PRs)

Claude P4's mechanical recipe under Codex TB-21's sequencing rule (which won): only after
W1-INTEGRITY, one extraction per gap between waves, never concurrent with a feature wave in the
same region, each PR individually green with zero behaviour change. The condition.ts recipe,
15 times, ending with world.ts as a pure barrel.

## Phase 5 — The commercial track (owner-led)

The Codex funding roadmap chapter is the reference document; its "investor objections" list is
closed almost line-for-line by Phases 1–2, which is the plan's central economy: **the
investor-ready slice is not a separate programme — it is Phases 1–2 finished.** The owner's
gates, in the roadmap's own order: entity/chain-of-title (the art manifest's five pending
attestations are on this list), the desktop packaging spike, the Steam page + demo plan, the
staged financing (bridge → project/publisher). Engineering feeds it; decisions are the owner's.

---

## The findings ledger — every review item, mapped

Status legend: ✅ done (merged or in wave/2026-08-01) · 🔜 mapped to a wave above ·
✂ adopted partially (what and why) · ✋ rejected (why) · 👤 owner decision.

### Claude review (docs/full-review, P1–P9)

| ID | Item | Status |
|---|---|---|
| P1 | Career endings + reckoning | 🔜 W2-ENDINGS |
| P2 | Morale + bond (pillar 3) | 🔜 W2-PSYCHE |
| P3 | RNG persistence v35 | 🔜 W1-RNG |
| P4 | world.ts split, 15 extractions | 🔜 P4 lane (Codex's timing rule adopted) |
| P5 | Dual-universe: bench then maybe pay one universe | ✅ Phase A shipped, verdict NOT material; Phase B closed; re-run required after W3-FIELD (its spec §3) |
| P6 | Quick wins (money/dev-gate/sim-CI/theme) | 🔜 W1-QUICK |
| P7 | Legal & provenance | ✅ shipped in this wave (5 manifest attestations = owner's merge gate) |
| P8 | Mobile wave | 🔜 W4-MOBILE |
| P9 | Quality infrastructure | 🔜 W4-QUALITY |

### Codex review (TB-01..24)

| ID | Item | Status |
|---|---|---|
| TB-01 | Durable restore | 🔜 W1-INTEGRITY-A (claim verified in code) |
| TB-02 | FIFO + revisions | 🔜 W1-INTEGRITY-A (verified) |
| TB-03 | Transactional mutate+persist | 🔜 W1-INTEGRITY-A (sequenced after W1-RNG for the serializable RNG) |
| TB-04 | Cross-tab ownership | ✂ CAS half into W1-INTEGRITY-A; full Web-Locks lease deferred — phone-first single-player, CAS closes the data loss |
| TB-05 | Recoverable worker | 🔜 W1-INTEGRITY-A (verified: dead worker stays cached) |
| TB-06 | Import hardening + storage recovery | 🔜 W1-INTEGRITY-B |
| TB-07 | v1 career contract | 🔜 W2-CONTRACT (decision) + W2-ENDINGS (build) |
| TB-08 | Safe time compression | ✂ "until next decision" mode into W2-TEMPO; the "hundreds of mandatory one-week advances" framing corrected (+4 with stop rules exists) |
| TB-09 | Daughter agency spine | ✂ into W2-PSYCHE (two variables + voice, not the full preference/consent simulator — Claude P2's smaller shape won; TB-09's age-graded autonomy is its phase 2) |
| TB-10 | Parent work-vs-presence economy | 👤 owner decision, post-Phase-2 — a real pillar-3 extension, but new weekly choice load; revisit with W2-PSYCHE's bench in hand |
| TB-11 | Ethical investor redesign | ✂ the daughter's voice + bond memory into W2-PSYCHE; the moralising/sensitivity-pass framing rejected — the owner's design ruling stands (a lever, never a punishment) |
| TB-12 | Match interaction contract | 👤 owner decision; the recommended observational contract is today's reality — the adoptable half (pre-match evidence card, honest shout labels, post-match inference note) slots into W4-MOBILE's screens pass or a small wave of its own |
| TB-13 | Truthful onboarding | 🔜 W2-TEMPO |
| TB-14 | Executable balance contracts | 🔜 W3-BALANCE |
| TB-15 | Modal/sheet foundation | 🔜 W4-MOBILE |
| TB-16 | Platform navigation | 🔜 W4-MOBILE |
| TB-17 | Semantic status/narration | 🔜 W4-MOBILE |
| TB-18 | Mobile geometry | 🔜 W4-MOBILE |
| TB-19 | Safe Settings | ✂ dev-action + error surfacing into W1-QUICK / W1-INTEGRITY-B; the rest rides W4-MOBILE |
| TB-20 | Offline media policy | 🔜 W4-QUALITY (trophies/sponsors cache split already shipped in fix/trophy-masters) |
| TB-21 | Engine decomposition | 🔜 P4 lane |
| TB-22 | Store/format/UI consolidation | ✂ money half into W1-QUICK; store-mutation helper + option-group into W4-QUALITY |
| TB-23 | Risk-shaped test pyramid | 🔜 W4-QUALITY (+ its persistence tests inside W1-INTEGRITY) |
| TB-24 | Pure builds, backed assets, governance | ✂ licence half ✅ (P7); masters backup → W0 now + W4-QUALITY formal; build purity → W4-QUALITY |

### Codex headline findings not fully covered by a TB row

| Finding | Status |
|---|---|
| P0 "hundreds of mandatory one-week advances" | ✂ W2-TEMPO (framing corrected) |
| P1 "docs are not a trustworthy source of truth" | 🔜 W2-ENDINGS (README/product claims) + P4 lane (historical comments → ADRs) |
| P1 `▶▶ 52 (dev)` ships in prod | 🔜 W1-QUICK |
| P1 sim CI red-on-green | 🔜 W1-QUICK (cron note: first firing 03.08 accepted red) |
| P2 build mutates authoring tree / masters unbacked | 🔜 W0 (backup now) + W4-QUALITY (purity) |
| 48h item: `brace-expansion` audit fix | 🔜 W0 |
| Funding roadmap (ch. 10) | 👤 Phase 5 reference document |

### Found by our own work this week (neither review)

| Finding | Status |
|---|---|
| The W15 field was mid-table juniors; P(title) 83% | ✅ living-field phase W (20.5%) |
| On-ramp ratchet (209/216 locked out) | ✅ v34 latch, merged |
| Champion-news ≠ paid champion in ~91% of her events | 🔜 W3-BALANCE (owner decision with both baselines) |
| "Prize money –" on W-tier headers | 🔜 W1-QUICK stowaway |
| In-match injury does not exist | 🔜 W3-INMATCH (the owner's 01.08 ask) |
| `pointsLockNote` names the wrong currency on W15 locks | 🔜 W1-QUICK stowaway (round-15's find) |
| `activeLadderOf` never returns 'wta' — no surface auto-opens on the professional table | 👤 with W2-CONTRACT: WHEN the pro table becomes "her" table is the handover-at-19 question |
| `bench:fatigue --scenario runfat-*` patches only the C-family run ladder | 🔜 W3-BALANCE (the harness consolidation absorbs it) |
| Academy travelCover 0.75: safety gate passed (backed 27-30/30 unchanged) but long-horizon trip volume thins (j30 entries 55→45 over 14→20; worst working reach cell 24→16/30 at 14→18) | 👤 the size is the owner's call — 0.75 ships in the wave, the measured cost is on the table |
| Trophy twin-masters / delivery door / 60-day cache | ✅ fix/trophy-masters |
| Practice button lost its pre-match screen | ✅ fix/practice-prematch |

---

## Effort summary

| Phase | Agent-waves | Serial path | Parallelizable |
|---|---|---|---|
| 0 | 0 (hands) | hours | — |
| 1 | 4 | W1-QUICK → W1-RNG → INTEGRITY-A | INTEGRITY-B beside A |
| 2 | 3 + owner page | CONTRACT → ENDINGS → PSYCHE | TEMPO beside PSYCHE |
| 3 | 3 (+2 later) | FIELD → BALANCE | INMATCH beside FIELD/PSYCHE |
| 4 | 2–3 | MOBILE → QUALITY | P4 lane in every gap |

The serial spine is: quick wins → RNG → integrity → contract → endings → psyche/field →
balance → mobile → quality. Roughly ten agent-waves of L/M size plus the extraction lane — at
the cadence this project has actually sustained (two to four agent-waves a week), Phases 1–2,
the investor-relevant core, are a two-to-three week horizon of real work, not a quarter.
