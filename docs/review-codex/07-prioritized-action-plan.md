# Prioritized Action Plan

## Decision rule

Do not start a broad refactor first. Protect player progress, define a finishable game, and add rendered coverage before reorganizing files. The order below minimizes the chance of polishing a structure whose product loop is still changing.

## 0–48 hours: remove immediate hazards

### 1. Remove the shipped 52-week development action

Gate `▶▶ 52 (dev)` behind `import.meta.env.DEV` or delete it.

**Done when:** no production build exposes a command that bypasses normal advance guards.

### 2. Make restore durable

Implement an explicit restore command that writes the selected state as a new active autosave before success.

**Done when:** restore → immediate close → restart always opens the restored revision, and an integration test proves it.

### 3. Make the simulation test job reliably green or red

Reproduce and remove the Vitest worker timeout; do not accept “all assertions passed” with exit code 1.

**Done when:** the same command passes repeatedly in a clean local environment and CI, and a deliberately failing threshold produces a normal actionable failure.

### 4. Surface Settings failures

Render save/import/export/restore errors with recovery actions, and ensure initialization never leaves an infinite loading screen.

**Done when:** injected IndexedDB and invalid-import failures produce visible, dismissible, retryable UI.

### 5. Update the vulnerable build dependency

Apply the available `brace-expansion`/transitive toolchain update and rerun the full check and audits.

**Done when:** the high advisory is absent or explicitly documented as temporarily accepted with an owner and date.

## Release blockers: one focused reliability sprint

### 6. Serialize and revision every command

Add a worker FIFO and monotonically increasing world revision. Reject stale-base commands.

**Done when:** concurrent commands cannot interleave, every response carries one revision, and two writers cannot select the same autosave generation.

### 7. Make mutation plus persistence atomic in meaning

Apply commands to candidate world/RNG state, persist successfully, then commit the in-memory authority. Store save data and career metadata in one IndexedDB transaction.

**Done when:** an injected storage failure leaves both the worker and UI on the previous revision.

### 8. Add cross-tab ownership and worker recovery

Use a per-career lock/revision check and broadcast revision changes. Recreate a crashed worker with timeouts and late-response protection.

**Done when:** a stale secondary tab cannot overwrite progress and a worker crash is recoverable without a page reload.

### 9. Harden imports

Add full schema/range/bounds validation, compressed and expanded size limits, and candidate-only decode/restore.

**Done when:** fuzzed malformed inputs terminate quickly and never partly change a career.

### 10. Establish one semantic modal system

Adopt a reusable dialog/sheet shell with focus entry, trapping, restoration, background inertness, Escape, scroll locking, and explicit critical-dismissal policy. Block the app during the coach tour.

**Done when:** keyboard and screen-reader checks pass for every modal flow and underlying game actions cannot fire.

## Product-definition sprint

### 11. Define the complete v1 career

Write a one-page contract for:

- starting age and intended real-world playtime;
- academy, junior, adult-tour, and terminal milestones;
- retirement/dropout/financial-failure endings;
- epilogue and “raise another”/new-career loop;
- which promises are in v1 versus later.

**Done when:** one deterministic seed can be played from onboarding through a meaningful ending with no placeholder state.

### 12. Restore time compression

Design a safe multi-week advance for low-decision periods. It must stop before offers, deadlines, injuries, tournaments, insolvency, milestones, and other irreversible choices.

**Done when:** a representative 15–17-year simulated career fits the declared playtime without removing key decisions, and equivalence tests cover stopping rules.

### 13. Make the daughter an agent

Introduce a compact relationship/agency model—preferences, trust or strain, and meaningful reactions—rather than a broad life simulator. Give her a voice in training load, risky play, travel, coach changes, academy choices, and especially investment/ownership decisions.

**Done when:** at least three major decisions can align or conflict with her expressed preference and produce understandable consequences.

### 14. Decide the match identity

Choose explicitly between an observational simulation and limited parent/coach tactics. If observational, make attribute evidence and uncertainty the compelling interaction. If tactical, add a small number of consequential between-set choices without turning the game into reflex tennis.

**Done when:** the store description, tutorial, and actual match interaction make the same promise.

### 15. Make setup choices truthful

Either let playstyle influence starting strengths/training focus as onboarding says, or rewrite the promise. Add a visible parent job/time-budget trade-off, or remove presence/work implications from the concept.

**Done when:** each onboarding choice has a testable early-game effect or is clearly described as flavor.

### 16. Rework the investor scenario

Avoid framing the child as an asset controlled only by the parent. Make consent, legal/financial context, power imbalance, and consequences explicit. Commission a sensitivity/editorial pass before release.

**Done when:** refusal and acceptance both preserve the daughter's subjecthood and the choice cannot be mistaken for ordinary equipment financing.

## UX and testing sprint

### 17. Add platform navigation semantics

Map major screens and takeovers to browser history or implement an equivalent explicit stack. Set page titles/headings, restore scroll, and move focus after navigation. Add `aria-current`, unread names, and live status regions.

**Done when:** browser/PWA back behaves predictably from every tested nested screen and current location is announced.

### 18. Fix narrow screens, safe areas, targets, and contrast

Centralize safe-area geometry; redesign the ≤359px calendar; enlarge hit boxes; replace normal-text uses of the dim token; test the save table and onboarding progress rail.

**Done when:** 320×568 through tablet widths have no clipped essential content, physical notched devices pass, and automated contrast/target checks plus manual review pass.

### 19. Add a rendered browser suite

Start with 10–15 Playwright+axe journeys rather than attempting exhaustive component tests.

**Done when:** the suite detects modal focus leaks, tour click-through, current navigation state, back behavior, narrow calendar failure, and an invalid save error.

### 20. Make balance targets executable

Turn design targets into deterministic distribution reports across documented seed cohorts and strategies.

**Done when:** CI or a scheduled job reports solvency, injury, rank, academy, dropout, and finish rates against reviewed bands with tolerances.

## Refactoring sprint after behavior is protected

### 21. Consolidate repeated orchestration

Introduce store mutation helpers, one formatting service, one dialog shell, one segmented-choice pattern, and one snapshot derivation cache.

### 22. Split stable domain boundaries

Extract lifecycle command handlers and pure read-model projections from `world.ts`; separate persistence DTOs from runtime state and UI snapshot types; split large Vue files along dialog/flow/state-machine boundaries.

### 23. Make builds pure and assets recoverable

Separate art ingestion from build, back up source masters in versioned storage, pin the toolchain, and add release/security/license documents.

### 24. Prune historical text

Replace obsolete phase comments and conflicting specs with short current contracts and ADRs. Delete source-regex tests as rendered behavior tests take over.

## Suggested ownership

| Workstream | Primary owner | Review partner |
|---|---|---|
| Worker/persistence correctness | Engine engineer | Test/reliability engineer |
| Career scope, pacing, endings | Game director/designer | Narrative designer |
| Daughter agency/investor material | Narrative designer | Sensitivity/editorial reviewer |
| Dialog/navigation/accessibility | Front-end engineer | Accessibility practitioner |
| Balance harness | Systems designer | Engine engineer |
| Asset/release continuity | Technical lead | Art lead |

One person may fill several roles, but the review partner matters most for save correctness, endgame definition, and sensitive narrative choices.
