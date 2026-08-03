---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-03
baseline: b7a9358
---

<!-- Full project review, 2026-08-01, reviewed at origin/main b7a9358 (branch docs/full-review). -->

# Ties Break – Full Project Review (2026-08-01)

> Point-in-time audit. Verify every finding against current code and tests before treating it as an
> open issue; later waves have already resolved some findings.

Independent, adversarial review of the whole project at commit `b7a9358`: architecture, code quality (KISS/DRY), game design & mechanics, concept/plot, UX/PWA, performance/robustness, testing/tooling, plus a cross-cutting gaps pass. Seven independent reviewers, each of the six most severe verifiable findings re-checked by a skeptic agent instructed to refute it, plus a completeness critic. All claims below carry file:line evidence in the chapters.

## Verdict

**The engineering foundation is unusually strong – the product is currently missing its own point.** The two technical pillars (match-as-show, honest economics) are built to a standard most shipped sims never reach: provably correct Markov math, rally rendering decoupled from outcomes by construction, research-anchored economy tuned by Monte-Carlo benches. But the game's *reason to exist* – the parent story with a child who is a person, and a career that can be lost – is prose, not code: **no morale, no relationship, no burnout, no quitting, and no run can ever end.** The README sells all of it in present tense. That is the single deepest issue this review found, and it was independently flagged by two reviewers and confirmed twice by skeptics.

**Top 5 actions, in order:**

1. **Ship endings** (bankruptcy, age-out/retirement) – both are pure state machines over data that already exists (`world.ts:4853` treats negative funds as a soft stop today). Without them, honest-brutal economics has no bite and the valley-of-death drama is capped. *(critical, confirmed)*
2. **Build the minimal Pillar 3 layer** (morale + relationship wired to levers that already exist: plan.train, knock pushes, missed vacations, playing hurt) – or re-scope README/concept honestly until it lands. *(high, confirmed twice)*
3. **Persist the RNG stream state in the save (schema v35)** – kills the O(career-length) full replay on every load *and* removes the "frozen capture cannot move" tax that every new feature currently pays. The worker comment already admits this is the plan. *(high, confirmed)*
4. **Fix the cheap, certain wins in one sweep:** `test:sim` exits 1 on green (CI red-on-green); money formatting duplicated 15× across 13 components with a cents/dollars same-name trap; the `▶▶ 52 (dev)` button ships in production and bypasses the knock/tournament guards; no LICENSE file (the README terms are legally floating, with a literal `[Igor Vladimirskiy / T Software]` placeholder).
5. **Start splitting `world.ts`** (5,521 lines, 161 functions, 111 exports – it grew 228 lines during this review's window) along the seams the code already documents. Not urgent as a rewrite; urgent as a direction, since every feature wave must edit this one file.

## What is genuinely strong

- **Worker-authoritative, deterministic engine.** Zero imports of Vue/Pinia anywhere in `src/engine`, `src/worker`, `src/db`, `src/shared` (grep-verified). The UI store is a thin RPC facade; the engine re-validates every command, so a stale screen can't corrupt the world.
- **Save discipline most studios don't have:** schema v34, append-only migrations, one golden-save fixture per version enforced by test, gzip + SHA-256 checksums, autosave rotation with recovery surfaced to the UI.
- **The match math is right.** O'Malley hold formula, exact tiebreak DP, live-probability DP verified independently. Rendering cannot influence outcomes – Pillar 1 is real in the code, not just the pitch.
- **Balance methodology is the best thing in the repo.** `rank-plateau.md` predicts a fix, measures it doing nothing, finds the real cause. Sponsor gates swept across 216 careers before numbers were picked. Tuning is measurement, not vibes.
- **Radically small dependency footprint** (vue + pinia at runtime), disciplined dated decision log, 91 test files, dual CI.

## Verified top findings

Each was handed to an independent skeptic instructed to refute it by reading the code.

| Verdict | Sev | Finding | Chapter |
|---|---|---|---|
| CONFIRMED | critical | No career can end – bankruptcy is a soft stop, retirement doesn't exist; the six promised finales (concept-ru.md:33) are all absent | [04](04-concept-plot-narrative.md) |
| CONFIRMED | high | Pillar 3 has no mechanics – no morale/relationship/burnout/quit; lore bible claims "read out of the shipped build" while overstating it | [03](03-game-design-mechanics.md), [04](04-concept-plot-narrative.md) |
| CONFIRMED | high | Every load replays the whole career to restore RNG position; the frozen-capture invariant taxes every feature (already re-pinned once, silently shifting old careers onto a different stream) | [01](01-architecture.md) |
| CONFIRMED | high | Money formatting re-implemented 15× in 13 components; `formatDollars(cents)` vs `formatDollars(dollars)` same-name/different-unit trap is live | [02](02-code-quality.md) |
| PARTLY | high | Top safe-area on notched phones: real gaps (flat 24px `--app-pad-top`, Home hero cancels it), but more `env(safe-area-*)` handling exists than claimed | [05](05-ux-ui-pwa.md) |

## Severity rollup

85 findings across 8 chapters (before cross-chapter dedup; ~5 themes appear in 2–3 chapters each, e.g. the RNG replay and the world.ts monolith):

| Chapter | critical | high | medium | low |
|---|---|---|---|---|
| [01 Architecture](01-architecture.md) | – | 2 | 4 | 4 |
| [02 Code quality](02-code-quality.md) | – | 1 | 6 | 6 |
| [03 Game design & mechanics](03-game-design-mechanics.md) | – | 3 | 3 | 4 |
| [04 Concept, plot & narrative](04-concept-plot-narrative.md) | 1 | 1 | 3 | 4 |
| [05 UX / UI / PWA](05-ux-ui-pwa.md) | – | 2 | 4 | 9 |
| [06 Performance & robustness](06-performance-robustness.md) | – | – | 4 | 6 |
| [07 Testing & tooling](07-testing-tooling.md) | – | 2 | 5 | 3 |
| [08 Cross-cutting gaps](08-cross-cutting-gaps.md) | – | 1 | 4 | 3 |

## Recurring themes (the KISS/DRY read)

- **The engine is KISS where it counts and grab-bag where it grew.** Leaf modules (diary, radar, knock, kidLife, coachLoad, offers) are clean and world-free; everything they feed converges into `world.ts`, which is now the repo's permanent merge hot-spot. Same shape in the UI: a lovely small `ui/` kit under four 1,600–2,235-line screen monoliths.
- **DRY violations cluster at the UI/engine seam:** money formatting ×15, the replay re-simulation recipe ×3, App.vue's "seen watermark" badge pattern ×4, 13 class names defined in both `style.css` and scoped blocks (the css-dry-audit's premise has gone stale).
- **Honesty instruments exist but don't guard the front door:** superb benches and golden saves, yet no component is ever mounted in a test, no linter, no coverage, and the sim CI job reports failure on success.
- **Docs are a strength that's starting to drift:** three retirement ages across three docs, a lore bible that overstates the build, README claiming "Concept / planning phase" beside a live game.

## Chapters

1. [Architecture](01-architecture.md)
2. [Code quality – KISS, DRY, complexity](02-code-quality.md)
3. [Game design & mechanics](03-game-design-mechanics.md)
4. [Concept, plot & narrative](04-concept-plot-narrative.md)
5. [UX / UI / PWA](05-ux-ui-pwa.md)
6. [Performance & robustness](06-performance-robustness.md)
7. [Testing & tooling](07-testing-tooling.md)
8. [Cross-cutting gaps](08-cross-cutting-gaps.md) – licensing, fonts/art provenance, release discipline, localization one-way door, dormant ad hooks never designed, privacy statement
9. [Proposals](09-proposals.md) – nine build-ready proposal packages (P1–P9) derived from these findings, with priorities, efforts, dependencies and a recommended wave order; full documents in [proposals/](proposals/)

*Method note: 7 independent reviewer agents (one per dimension, read-only, file:line evidence required), findings deduplicated, the 6 most severe verifiable claims re-investigated by adversarial skeptic agents, then a completeness critic hunting blind spots between dimensions. 14 agents, ~556 file reads/greps/commands in total.*
