---
type: plan
status: current
area: project-review
last-reviewed: 2026-09-26
---

# The principles review, second pass – the brief for the reviewer (26.09)

## 0. The ask

The owner, 26.09, verbatim:

> «Я хочу получить полное комплексное мультиагентное ревью проекта на всем принципам
> программирования. Меня интересует оптимизация кода, поиск похожих или повторяющихся фрагментов,
> которые нарушают DRY. Вообще ревью нашей архитектуры, каждой части приложения. На выходе от него
> находки, предложения по улучшению, оптимизации.»

So: every part of the app, every principle as a lens, DRY and optimisation first among them, and
the output is findings plus proposals – not code. The project was last reviewed this way on 05.09
(five lanes); this pass covers more ground, measures the delta since then, and ends in proposals a
builder can take as plans.

## 1. Where you work, what you deliver, what you may not touch

- **Branch**: `review/principles-2026-09-26`, already cut from `main` at `03d92221` and carrying
  this brief. The product code on it is identical to `03d92221` (the branch adds only this file and
  one line of `CLAUDE.md`), so `03d92221` is the baseline every citation refers to. Push to
  `origin` only – never to `main`; the owner merges.
- **Output folder**: `docs/review-principles-2026-09-26/` –
  `00-baseline.md`, one report per lane (`01-architecture.md` … `08-tests-tooling-docs.md`),
  `09-refuted.md` (claims that failed verification, with the reason), and `README.md` (the
  synthesis). Copy the front matter of `docs/review-principles-2026-09-05/README.md` exactly
  (`type: review`, `status: audit`, `area: project-review`, `canonical: false`, `last-reviewed`,
  `baseline: 03d92221`).
- **Read-only on the product.** No edit outside the output folder: not `src/`, `tests/`, `tools/`,
  `scripts/`, `e2e/`, `public/`, configs or package files. No new dependencies. An external tool
  runs as `npx --yes <tool>@<version>` (it installs under `~/.npm`, nothing in the repo), with the
  version recorded – the 05.09 duplication lane is the worked example.
- **Probes** you write live in `docs/review-principles-2026-09-26/probes/` – outside every build
  and typecheck path, so keeping them honest is yours – or run ad hoc. Either way, every number in
  a report names the command that produced it and the SHA it ran at.
- **Commits**: the pathspec form (`git commit -m "…" -- <paths>`), never `--amend`, never
  `git add -A`. ⚠ The shared checkout may hold another live session's untracked files
  (`tools/_devlog_*`, `tools/devlog/`, `playwright.devlog.config.ts`): never commit, move or delete
  them, and do all measuring in a clean worktree –
  `git worktree add --detach ../tb-review 03d92221` – removed when you finish.
- **Last step**: `npm run context:audit` green on the new documents, its exit code read from a file.

## 2. Read first

1. **`CLAUDE.md`, whole.** Its invariants are the project's law, and several of them look like
   smells to a stranger (section 3 lists them).
2. **The two earlier reviews, so you report the DELTA and not a rerun:**
   - `docs/review-principles-2026-09-05/` – five lanes at `98e3560b` (engine, UI, performance,
     duplication, tests-tooling). Every one of its findings gets a status in your matching lane –
     fixed / still open / regressed / superseded – with evidence.
   - `docs/review/` – the August review (01–09) and its proposals P1–P5. State where each proposal
     stands; P4 (the `world.ts` decomposition) is ongoing and has its own rules in `CLAUDE.md`.
3. **`docs/specs/engine-ui-parity-2026-09.md`** – the newest convention; lanes E and F use it as a
   lens.
4. **Search, do not read**: `docs/decisions.md` (the dated owner log, 5,446 lines), and check
   `docs/now-next-later.md` and `docs/backlog/the-quality-rig.md` for what is already queued.

## 3. Things that look wrong and are rulings

Measure any of these if it helps a finding – do not report them as defects:

- **The engine never imports the UI**; the worker owns the world and the UI only sees `Snapshot`.
- **RNG discipline**: new randomness goes through purpose-scoped sub-streams keyed by strings
  (`rngFromSeed(\`${seed}:thing:${week}\`)`); the MAIN stream position is persisted; the frozen
  capture (41550 draws / `e6b0c709`) is a measurement. ⚠ Any proposal that touches a roll must
  keep every key and every draw byte-identical, and say how that is proven (the capture plus the
  key-count nets the life-beat suites already carry).
- **Save schema moves are append-only**: never propose editing a shipped migration; one golden
  fixture per version is enforced by a test.
- **Player-facing wording belongs to the owner.** A DRY proposal over strings must keep every
  rendered string byte-identical; one that needs a wording change is a question for him, not a
  finding.
- **Balance numbers are measured** (benches plus a spec). A performance proposal that could move
  behaviour states the bench arm that would prove it does not.
- **Comments record the owner's rulings and the "why"**, preserved verbatim when code moves. Their
  volume is a legitimate subject – lane H prices it – but the convention is the owner's call.
- **Documented deliberate non-extractions** («deliberately not extracted into a helper … the
  moment a third reader appears», e.g. the title fold in `dynastyHandoverOf`). You may argue with
  one, with evidence that the condition it names has been met.
- **Process rulings, not findings**: the `▶▶ 52 (dev)` button ships in every build; `test:sim`
  never runs on a PR; pushes go to `origin` only (the GitHub and GitLab mains diverged).

## 4. The baseline, pre-read (architect, 26.09, at `03d92221` – verify, do not trust)

| fact | value | how |
| --- | --- | --- |
| `src` files (`.ts`/`.vue`) | 297 | a line classifier (`//`, `/*`, `*`, `<!--`) over `src` |
| code lines vs comment lines | 67,550 vs 101,818 – **60.1 % of non-blank lines are comments** (engine leaf modules 72 %, `shared` 76 %) | same |
| largest files, lines (code / comment) | `economy.ts` 8,911 (1,480 / 7,306) · `world/lifeBeat.ts` 8,003 (1,969 / 5,789) · `MoneyScreen.vue` 4,913 · `world/smallTalkCorpus.ts` 3,970 (data) · `HomeScreen.vue` 3,405 · `migrations.ts` 3,311 · `SeasonScreen.vue` 3,147 · `world/coachMarket.ts` 3,045 · `world.ts` 2,878 · `offers.ts` 2,671 | same |
| files importing the `engine/world` barrel | 747 | `git grep -lE "from '[^']*/world'" -- src tests tools scripts e2e \| wc -l` |
| `rngFromSeed(` call sites in `src/engine` | 130 (9 `roll*` exports in `lifeBeat.ts` alone) | `git grep -c` |
| `Record<Temperament …>` voice pools in `src` | 30 | `git grep -c` |
| tests | 607 test files · 8,827 `it(` blocks · e2e 30 specs / 134 tests · golden saves 90 files / 34 MB | `git grep`, `du` |
| `tools/` | 55 live + 211 archival scripts, **all** typechecked by `check:tools` on every gate | `npm run tools:registry` |
| gates, last measured 25.09 | unit ≈ 7.5 min locally · sim ≈ 8 min · e2e ≈ 1.3 min | the rig wave's belt logs |
| install size | 16,367 KiB of a 16,384 KiB ceiling – **17 KiB headroom** | `npm run check`'s install-size line |
| docs | 465 markdown files | `find docs -name '*.md'` |

## 5. Seed leads – where the architect already suspects something

Start here, and confirm or refute each one with evidence; none of them is a finding yet.

1. **Helper sprawl in tests and tools.** `function walk(` is defined **69** times across `tests/`
   and `tools/`, `careerAt` 29, `walkTo` and `expecting` 6 each. `clashWorld` exists in three files
   (`tests/round29-shoot-clash.test.ts`, `tests/component/round29-shoot-clash-ui.test.ts`,
   `tests/component/round30-do-both-shoot.test.ts`) that had drifted apart: the 23.09 cancel-share
   fix had to re-aim all three separately, and the third was only found by a full gate.
2. **The roll pattern**: eligibility gate → `rngFromSeed(\`${seed}:life:<kind>:<week>\`)` →
   threshold → write, repeated across the life-beat hazards. Is a shared primitive worth it when
   byte-identical keys are mandatory? Price both sides.
3. **Voice pools with unreachable cells.** Some pools carry a presence axis (under her parents'
   roof / away) that events gated at 23+ can never reach – found on the divorce pool 23.09 and
   still standing on the wave-11 expecting and bereavement pools. A reachability sweep of every
   presence cell.
4. **Field-by-field copies at the store boundary** (`plainDynasty` in `stores/game.ts`, born of a
   reactive proxy that could not cross `postMessage`). Would `toRaw` + `structuredClone` retire the
   discipline, or does the explicit copy earn its keep?
5. **Engine verdicts restated on screens beyond the three sites the parity wave guarded.** That
   wave found two live instances by applying the convention to three sites; the rest of the UI –
   `composables/weekDays.ts`, `composables/tierState.ts`, `HomeScreen`, `SeasonScreen`,
   `MoneyScreen` and the rest – has never been swept.
6. **The barrel**: what 747 importers of one re-export module cost in transform, typecheck, test
   collection and bundle; what P4 still leaves in `world.ts`.
7. **`economy.ts`**: constants versus essays; `ECONOMY` keys nothing reads (dead configuration);
   tables mirrored by hand (e.g. the divorce answer deltas copied from the break-up's).
8. **Growth over a long career**: kept event rows and `lifeLog` grow for the life of the save;
   the snapshot is rebuilt and sent after every command (05.09 measured `toSnapshot` at 13–24 ms);
   save size at week ~1,600 against week ~200.
9. **The install ceiling**: 17 KiB left – where the bytes are and what could leave the precache.
10. **`check:tools` typechecks 266 scripts on every gate**, 211 of them archival – archive policy.
11. **Test time**: birpc's hard 60 s window has forced the `coach-travel-edge` family to be cut
    five times (a ratchet now holds it), and walked careers are re-walked per file (e.g. ~114 ticks
    to reach college in each college component file) – shared serialised fixtures versus re-walks.

## 6. The lanes – one agent each, in parallel after Phase 0

Every lane uses the general principles as lenses – DRY, SRP and separation of concerns, cohesion
and coupling, dependency inversion, KISS/YAGNI, least surprise, fail-fast, testability – plus the
project's own: determinism, engine purity, input-independence, append-only persistence, one owner
per fact. A principle is a lens, not a verdict: a finding needs evidence and a cost.

- **A – Architecture & boundaries.** The whole app as layers: `engine` / `worker` / `shared` / `db`
  / `stores` / `composables` / `components` / `prologue` / `art` / `audio` / `viz` / `pwa`.
  Dependency direction (`scripts/engine-purity.mjs` plus your own import graph over all of `src`),
  cycles (runtime versus type-only), the barrel, god modules, cohesion per area, where dependency
  inversion is needed, what P4 has left. ⭐ Includes **a one-screen map of the app with a verdict
  per part**.
- **B – Engine core.** `src/engine/world.ts` and `src/engine/world/*` (the tick phases,
  `lifeBeat`, `state`, `snapshot`, `endings`, `spotlight`, `college`, `coachMarket` …) and
  `migrations.ts`. Function size, repeated patterns (lead 2), state shape, guards versus throws,
  purity of derivations, snapshot assembly, the command surface and its engine-side re-validation.
- **C – Engine leaves & simulation.** `match/` (the Markov point engine), `season/` (calendar,
  ranking, tournament, conveyor, cohort), `diary/`, `economy.ts`, `offers`, `development`,
  `condition`, `body`, the coach and academy modules. Algorithmic cost on the hot path (the week
  tick, the match simulation, ranking recomputation), data-structure choices, constant tables,
  dead configuration (lead 7).
- **D – Worker, protocol, persistence.** `src/worker` (`sim.worker.ts`, the `client.ts` RPC),
  `src/shared` (protocol types, formatters), `src/db`, the save codec, `stores/game.ts`. Duplication
  between engine types and protocol types, serialisation cost, snapshot transfer, save growth
  (lead 8), error paths (a refused load, a quota), the store as a thin facade (lead 4).
- **E – UI.** `src/components` (86 files) and `src/composables` (44), the `ui/` kit, `style.css`.
  Component size and responsibility, logic in templates, restated engine verdicts (lead 5, the
  parity convention as lens), CSS duplication and tokens, responsive rules, accessibility (an
  `aria-label` suppresses `title` – the parity wave found one chip whose sentence never reached a
  screen reader; sweep the rest), render cost of the largest screens.
- **F – Duplication / DRY, cross-cutting.** Token clones over `src`, `tests`, `tools`, `scripts`,
  `e2e` with jscpd at **the 05.09 flags** (for comparability), plus a lower-threshold pass on
  `src`; then the semantic pass – two spellings of one fact: numbers restating `ECONOMY`,
  re-derived predicates, duplicated string tables, parallel types, helper sprawl (lead 1). Classify
  every clone as merge / deliberate (cite the note) / coincidental, and compare with 05.09's rates
  (0.23 % in `src`, 3.3 % in tests, 3.1 % in tools).
- **G – Performance & optimisation, measured.** Tick throughput (weeks per second early, mid and
  late in a career), `toSnapshot` per command against 05.09's 13–24 ms, worker message size, save
  size against career length, IndexedDB write cost, update cost of the three largest screens,
  bundle and precache composition against the 17 KiB headroom (lead 9), and where the gates'
  minutes go – per file for the unit gate, the sim, e2e (lead 11). Each proposal states the
  expected gain and whether behaviour could move.
- **H – Tests, tooling, docs, process.** Test architecture (source pins versus mounted tests, the
  `pins:check` ratchet, helper sprawl), fixture strategy (34 MB of golden saves; e2e `.tsave`
  regeneration on every schema bump), `tools/` (266 scripts, the registry, lead 10), `scripts/`, CI
  workflows, the docs system (465 files; which generated registries go stale – the decisions index,
  the tools registry, the world symbol map – and how often they have broken a gate), the
  `CLAUDE.md` budget, and **the comment convention**: measure the comment share per module and what
  it costs – navigation, merge conflicts, and the context an agent pays to touch code (a builder
  reading `lifeBeat.ts` loads 8,003 lines to reach 1,969 of code) – then propose options, e.g. a
  short "why" at the site with dated re-aim chronicles moved to the decision log behind a pointer.
  Options, priced; the owner rules.

## 7. How to run it

- **Phase 0 – the baseline** (one agent, before any lane starts, on a quiet machine): record the
  SHA, then produce the shared measurements into `00-baseline.md` – the size and comment table per
  area, the import graph and cycle list, the raw jscpd runs, the tick / snapshot / save / bundle
  numbers, and per-file timings of the unit gate. ⚠ Timings are taken **serially**: `CLAUDE.md`
  records parallel agents turning a 3-minute run into 90, and a timing taken under contention is
  not a measurement. Lanes consume these numbers instead of re-measuring them three ways.
- **Phase 1 – lanes A–H in parallel**, each writing its own file.
- **Phase 2 – independent verification.** Every P0–P2 finding is re-checked, at the baseline SHA,
  by an agent that did not write it and whose job is to REFUTE it: read the cited lines, re-run the
  cited command, look for the documented ruling that explains it. Verdict per finding: CONFIRMED /
  PLAUSIBLE / REFUTED. Refuted findings move to `09-refuted.md` with the reason.
- **Phase 3 – the synthesis** (one agent): `README.md`, section 9.

Fit the agent count to your runner – a sequential run is acceptable if parallel agents are not
available – but two properties are fixed: Phase 0's numbers are shared, and verification is
independent of authorship.

**Measurement hygiene**, from this repo's own record: exit codes read from files, never through a
pipe or a wrapper's notification; a log is trusted only if it is newer than the command; a missing
sentinel is not a verdict; a null result needs the same provenance as a positive one (name the
commit each arm ran at).

## 8. The finding format

```
### <lane letter>-<nn> · <one-line title>
- Severity: P0 | P1 | P2 | P3
- Category: architecture | duplication | performance | correctness-risk | ui | a11y | tests | tooling | docs
- Evidence: file:line at 03d92221; for anything measured, the command and its output
- Why it matters: the cost of leaving it – measured where possible
- Proposal: the concrete change and the target shape (who owns the merged code)
- Blast radius: which house laws it touches (RNG keys, save schema, wording, balance) and which
  tests would move – counted with `git grep -l "<file-or-symbol>" -- tests/`
- Effort: S | M | L
- Confidence: high | medium | low – and what would raise it
- Versus 05.09: new | carried (its ID) | regressed
- Verification: CONFIRMED | PLAUSIBLE   (filled in Phase 2)
```

**Severity**: P0 – wrong behaviour, data loss or a broken invariant reachable in a real career
now. P1 – a live defect class or a cost that bites today (a guard that passes while the thing it
guards is gone; a copy that can defeat a documented A/B; minutes on every gate). P2 –
maintainability debt with a measured cost. P3 – polish: grouped in one table per lane, not written
up individually. At most ~25 written findings per lane; rank and keep the top.

## 9. The synthesis – `README.md`

1. **Executive verdict** – is anything P0, and the five things that matter most.
2. **The app map** – every part with a verdict (healthy / debt / risk) and its top finding.
3. **Delta** against 05.09 and August – closed, still open, regressed.
4. **DRY summary** – clone rates against 05.09, the largest clusters, what to merge first.
5. **Optimisation summary** – the measured hotspots and the expected gains.
6. **Proposed waves** – the CONFIRMED findings grouped into 3–7 buildable waves: scope, order,
   dependencies, effort, the house laws each touches and the pins each moves. Quick wins first;
   each wave concrete enough for a builder to take as a plan.
7. **Owner decisions** – the findings that need his ruling (wording, balance, conventions), each
   with its options priced.
8. **Questions** – anything you could not settle from the code and the docs, last, never guessed.
9. **Not reviewed**, and why.

## 10. What not to report

- Formatter-level style, and naming preferences without a misleading-name defect. (The real class
  here is a name that lies about its unit: `shootCount` was a per-year figure wearing a total's
  name, and a whole-term cheque was divided by it. That is a finding; camelCase is not.)
- Framework or library swaps without a measured need; rewrites for elegance. Every proposal says
  what it costs and what it breaks.
- Game-design and balance numbers – the benches own them. The CODE of benches and tools is in
  scope.
- Anything already queued in `docs/now-next-later.md`, unless you bring new evidence – then cite
  the queue entry.

## 11. Calibration – findings this project has valued

- **A test propping up what it checks**: a `tier-window` case stayed green for a month on the very
  UI copy it was meant to judge (the parity wave, 25.09).
- **Two spellings of one fact**: a chip re-authored the engine's refusal and made an unconditional
  claim the engine never made (the parity wave).
- **A name lying about its unit**: `shootCount` (the cancel-share fix, 23.09).
- **A copy that silently defeats a documented A/B**: the feed's table filter against
  `PLAY_DOWN.domesticFromProTable` (the parity wave).
- **Drifting copies of one fixture**: `clashWorld` ×3 (lead 1).
- **A boundary only the real runtime reaches**: a reactive proxy that could not cross
  `postMessage` – every unit and mounted test stubbed the store, and only e2e found it (wave 10).
