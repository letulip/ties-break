---
type: plan
status: draft
area: testing
canonical: false
last-reviewed: 2026-08-22
---

# The quality rig – platform hygiene and the test layers' unbuilt floors

What the Playwright plan, P8 and P9 still owe. The e2e suite itself is healthy (S0–S2 built, 25
tests, the coverage map honest); everything here is the layer ABOVE it or the platform UNDER it.

| # | what | where it is specified | blocked by | size | state |
| --- | --- | --- | --- | --- | --- |
| 1 | **The accessibility register's remainder – three rows of sixteen, re-verified in the tree 24.08.** D2, D3, D4, D5, D6, D7, D8, D9, D10, D11, D12, D13 and D15 are all closed in `src/` – D8's last two tables carry `aria-label`, D9's `MoreScreen` input carries `Save name`, and D11's two banners are addressed by role and name in `e2e/week-advance.spec.ts` and `e2e/storage-recovery.spec.ts`. What is left: **D1's four still-roleless overlays** (`RankHelpDialog`, `TierGuide`, `InboxSheet`, `PlanWeekSheet` – wave B put the other four blocking dialogs on `useDialogFocus`), and the stated limit that the app behind a dialog is not `inert`; **D14**, an inbox row whose accessible name carries a weekly countdown; **D16**, the Calendar grid marker that names an event without the shared helper – the register's own highest-priority open item. ⚠ The register is §**12**, not §10 as this row and `playwright.md` S3 both say. | [e2e-coverage.md](../specs/e2e-coverage.md) §12; [playwright.md](../plans/playwright.md) S3 | nothing | S–M | Later |
| 2 | **S3's axe run** – `@axe-core/playwright` over the main screens, failing on serious/critical. Deliberately AFTER #1: today it would land on screens not ready for it. | [playwright.md](../plans/playwright.md) S3 | #1 | S | Next |
| 3 | **S3's device matrix** – the owner's phone size, tablet, desktop, dark and light. (Visual screenshot regression is explicitly a DECISION not to build – the two 375px invariants replaced it; do not re-propose it.) | [playwright.md](../plans/playwright.md) S3; [e2e-coverage.md](../specs/e2e-coverage.md) §6.6 | nothing | S | Later |
| 4 | **`e2e-full.yml`** – the nightly + on-demand workflow the plan's own CI table names (full matrix, a11y), with the fixture-regeneration rot alarm running in it. PR gate stays smoke-only by the repo's own cost lesson. | [playwright.md](../plans/playwright.md) §6 | nothing | S | Later |
| 5 | **Publishing the HTML report** – `npm run test:e2e:report` produces traces for every test locally; nothing publishes it beside the app on Pages. | [playwright.md](../plans/playwright.md) S3, last bullet | nothing | S | Later |
| 6 | **P8, the mobile wave's core – one third of it closed by wave B.** Focus management is no longer unaddressed: `src/composables/dialogFocus.ts` traps and restores focus for six overlays with a per-dialog Escape policy. What is still unbuilt is the wave's other spine: the system BACK gesture still exits the game (no `pushState`, `popstate` or router anywhere in `src/`), and there is still no unified DialogShell – the four overlays in row 1 do not share one. | [P8-mobile-platform-wave.md](../review/proposals/P8-mobile-platform-wave.md) | nothing | M | Later |
| 7 | **P9's remainder** – the component-test half shipped (94 mounted tests) and the rest did not: no ESLint (correctness-only, no formatting rules – the source-pin corpus depends on that), no coverage report, the ~1MB asset diet unattempted (`public/` is 15MB), audio cache policy, and release discipline – zero git tags, no CHANGELOG, no build-id in About. | [P9-quality-infrastructure.md](../review/proposals/P9-quality-infrastructure.md) | nothing | M | Later |
| 8 | **TB-24's second half – pure builds** – `art:ingest`/`art:optimize` split (only `optimize-art.mjs` exists), masters into versioned storage (the one-laptop risk the trophy incident proved), pinned toolchain, release checklist. | [09-detailed-proposals.md](../review-codex/09-detailed-proposals.md) TB-24 | the owner does the storage half (his masters, his cloud) | M | Later |
| 9 | **The round-22 spec gap** – the tenure ramp and the live professional table were measured and shipped with no spec in `docs/specs/`; both records live only in commit bodies and source comments. Invariant 4's paper trail is owed retroactively. | [round-22.md](../rounds/round-22.md), «What is still open» #1 | nothing – it is a writing task | S | Next – owed by invariant 4 itself; nothing blocks but hands |
| 10 | **Wake lock during a match** (round 16 #20) – the screen sleeps mid-match; no `wakeLock` reference anywhere in `src/`. A PWA capability with a small, well-trodden API. | [round-16.md](../rounds/round-16.md) #20 | nothing | S | Next |

**Not a backlog item, noted so nobody re-plans it:** P4, the `world.ts` decomposition, is ONGOING
– the standing interleaved work with its own rules in `CLAUDE.md` (the type-only import pattern,
the 280-importer public API, the pin query). Status and method:
[P4-world-decomposition.md](../review/proposals/P4-world-decomposition.md). It continues in gaps,
never concurrent with a feature wave in the same region.

⚠ **AND THE NUMBER IN THIS PARAGRAPH HAD ROTTED, WHICH IS THE ARGUMENT FOR DATING IT.** It read
«`world.ts` measures 3,830 lines today against 5,521 at review time – the direction is real». Counted
24.08: **4,269 lines** (`wc -l src/engine/world.ts`) and **326** importers of `engine/world` by
`CLAUDE.md`'s own query, against the 280 it records for 19.08. Still well under 5,521, so the
decomposition's direction over the whole arc holds – but the file has grown 439 lines since this row
was written on 22.08, and «today» in a document that is read a fortnight later is not a measurement.
Re-count before quoting either figure.
