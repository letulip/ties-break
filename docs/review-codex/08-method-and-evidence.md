# Review Method and Evidence

## Scope

This review covered the repository state on branch `codex/full-project-review`, created from local `main` at commit `6295175`. The local `main` was 301 commits ahead of the configured `gitlab/main`; the requested baseline was interpreted as the user's local `main`, not the stale remote-tracking ref.

Areas reviewed:

- product concept and market identity;
- plot, character agency, theme, and copy;
- loop, progression, pacing, balance, economy, injury, offers, tournaments, and uncertainty;
- UI architecture, visual system, responsive behavior, PWA behavior, and accessibility;
- engine/worker/store/persistence architecture;
- KISS, DRY, SOLID, YAGNI, module ownership, comments, and repository hygiene;
- tests, dependency audit, build output, assets, performance risks, privacy, and release operations.

## Review approach

The primary reviewer inspected repository structure, configuration, engine and UI source, tests, and design documents. Three focused parallel reviews examined:

1. architecture, concurrency, persistence, and code principles;
2. product concept, plot, mechanics, pacing, and balance;
3. UI/UX, visual design, responsive behavior, accessibility, and front-end conventions.

Findings were reconciled rather than copied blindly. Severity reflects player impact and release risk, not file size or reviewer preference.

## Commands and observed outcomes

### Main quality gate

`npm run check`

- forced Vue/TypeScript checking passed;
- 88 test files and 1,935 tests passed;
- production build passed.

### Long simulation gate

`npm run test:sim`

- 3 files and 60 assertions reported as passed;
- Vitest emitted an unhandled `[vitest-worker]: Timeout calling "onTaskUpdate"`;
- the command exited with status 1.

### Dependency audit

`npm audit --omit=dev --audit-level=moderate`

- 0 production findings.

`npm audit --audit-level=moderate`

- 1 high-severity transitive `brace-expansion` denial-of-service advisory in the build/PWA dependency graph;
- an automated fix was reported as available.

No dependency versions were changed as part of this review.

### Build/artifact observation

The successful production build produced a main application bundle, worker bundle, stylesheet, 117-entry PWA precache, and approximately 14 MB distribution. Audio assets were present but absent from intentional Workbox precache/runtime rules.

## Live UI observations

The local application was exercised in an in-app browser at desktop and mobile widths, including 390×844 and 320×568. The pass covered onboarding, Home, navigation surfaces, coach marks, dialogs/help, Settings, calendar presentation, and accessible structure. The browser console showed no warnings or errors in the exercised path.

Examples of live-confirmed issues:

- modal overlays did not expose modal dialog semantics or contain focus;
- background controls remained exposed during the coach tour;
- Home lacked an `h1` and active navigation was not programmatically current;
- mobile Home controls measured below recommended target sizes;
- the seven-column calendar fragmented labels at 320px.

The browser session and development server were closed after the checks.

## Quantitative inventory

Approximate source counts were generated with repository search/line tools:

- engine: 18,343 lines;
- components: 19,349 lines;
- composables: 3,002 lines;
- shared source: 2,156 lines;
- tests: 38,606 lines;
- product/design documentation: 13,269 lines;
- raw `<button>` occurrences: about 90;
- global CSS: 3,637 lines, with no observed `!important` declarations;
- test files that inspect source text: about 46.

Counts are indicators, not findings by themselves. Large modules were criticized only where they combine unrelated responsibility or increase correctness risk.

## Evidence standard

Reports distinguish three confidence levels:

- **Confirmed:** reproduced by a command or live interaction.
- **Code-evident:** directly follows from an implementation path, but was not forced in a live fault/device environment.
- **Design risk:** an inconsistency between stated goals, documentation, and implemented mechanics that requires a product decision rather than a bug fix.

Line links point to the reviewed files, but future edits may move exact line numbers. Commands, counts, and audit results are snapshots from 2026-08-01 in the Asia/Makassar timezone.

## Limitations

This was broad and deep, but not unlimited:

- No complete 15–20-year career could be evaluated as a finished narrative because the repository does not yet implement a full ending/retirement loop.
- Statistical mechanics were assessed through existing simulations, source, tests, and design targets; no new multi-thousand-seed independent balance study was authored.
- Accessibility checks did not include a full VoiceOver/NVDA session, switch control, 200–400% zoom matrix, or physical notched devices.
- The review did not include a formal penetration test, legal license opinion, privacy-law assessment, or professional sensitivity consultation.
- Visual checks sampled core flows; every content/state combination was not manually populated.
- Dependency advisories and external accessibility guidance can change after the review date.

## What was changed

Only this review document set was added. Production source, tests, dependencies, save schemas, and assets were intentionally left unchanged so the reports describe the reviewed baseline rather than a moving target.
