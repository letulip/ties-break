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
| 1 | **The twelve accessibility defects** – found by the role-and-name selector policy and tabulated; five settings toggles are named only `ON`/`OFF`, ambiguous `Enter`, unlabelled coach rows. ⚠ «Fix the twelve first – that is a `src/` branch, not a test branch, and it is the single highest-value follow-up from this wave.» Two of them block e2e coverage today. | [e2e-coverage.md](../specs/e2e-coverage.md) §10; [playwright.md](../plans/playwright.md) S3 | nothing | M | Later |
| 2 | **S3's axe run** – `@axe-core/playwright` over the main screens, failing on serious/critical. Deliberately AFTER #1: today it would land on screens not ready for it. | [playwright.md](../plans/playwright.md) S3 | #1 | S | Next |
| 3 | **S3's device matrix** – the owner's phone size, tablet, desktop, dark and light. (Visual screenshot regression is explicitly a DECISION not to build – the two 375px invariants replaced it; do not re-propose it.) | [playwright.md](../plans/playwright.md) S3; [e2e-coverage.md](../specs/e2e-coverage.md) §6.6 | nothing | S | Later |
| 4 | **`e2e-full.yml`** – the nightly + on-demand workflow the plan's own CI table names (full matrix, a11y), with the fixture-regeneration rot alarm running in it. PR gate stays smoke-only by the repo's own cost lesson. | [playwright.md](../plans/playwright.md) §6 | nothing | S | Later |
| 5 | **Publishing the HTML report** – `npm run test:e2e:report` produces traces for every test locally; nothing publishes it beside the app on Pages. | [playwright.md](../plans/playwright.md) S3, last bullet | nothing | S | Later |
| 6 | **P8, the mobile wave's core** – pieces arrived piecemeal (safe-area vars in `style.css`, `role="dialog"` on several popups), but the wave's spine is unbuilt: the system BACK gesture still exits the game (no history handling anywhere in `src/`), no unified DialogShell semantics, focus management unaddressed. | [P8-mobile-platform-wave.md](../review/proposals/P8-mobile-platform-wave.md) | nothing – re-verify the piecemeal parts first | M–L | Later |
| 7 | **P9's remainder** – the component-test half shipped (94 mounted tests) and the rest did not: no ESLint (correctness-only, no formatting rules – the source-pin corpus depends on that), no coverage report, the ~1MB asset diet unattempted (`public/` is 15MB), audio cache policy, and release discipline – zero git tags, no CHANGELOG, no build-id in About. | [P9-quality-infrastructure.md](../review/proposals/P9-quality-infrastructure.md) | nothing | M | Later |
| 8 | **TB-24's second half – pure builds** – `art:ingest`/`art:optimize` split (only `optimize-art.mjs` exists), masters into versioned storage (the one-laptop risk the trophy incident proved), pinned toolchain, release checklist. | [09-detailed-proposals.md](../review-codex/09-detailed-proposals.md) TB-24 | the owner does the storage half (his masters, his cloud) | M | Later |
| 9 | **The round-22 spec gap** – the tenure ramp and the live professional table were measured and shipped with no spec in `docs/specs/`; both records live only in commit bodies and source comments. Invariant 4's paper trail is owed retroactively. | [round-22.md](../rounds/round-22.md), «What is still open» #1 | nothing – it is a writing task | S | Next – owed by invariant 4 itself; nothing blocks but hands |
| 10 | **Wake lock during a match** (round 16 #20) – the screen sleeps mid-match; no `wakeLock` reference anywhere in `src/`. A PWA capability with a small, well-trodden API. | [round-16.md](../rounds/round-16.md) #20 | nothing | S | Next |

**Not a backlog item, noted so nobody re-plans it:** P4, the `world.ts` decomposition, is ONGOING
– the standing interleaved work with its own rules in `CLAUDE.md` (the type-only import pattern,
the 280-importer public API, the pin query). Status and method:
[P4-world-decomposition.md](../review/proposals/P4-world-decomposition.md). `world.ts` measures
3,830 lines today against 5,521 at review time – the direction is real; it continues in gaps, never
concurrent with a feature wave in the same region.
