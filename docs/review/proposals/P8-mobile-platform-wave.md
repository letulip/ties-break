<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P8 – Mobile Platform Wave: Safe Areas, System Back, Dialog Semantics

One-line: Makes the installed PWA behave like a phone app at the device boundary – content clears the notch, the system back gesture closes the topmost surface instead of exiting the game, and every popup carries real dialog semantics.

**Priority:** Tier 4 – platform hygiene · **Effort:** L (2-5d) · **Risk:** med

## Why (problem)

Three problems, all from review chapter 05, all verified against the code at `b7a9358`.

**(a) Top safe area – real but PARTLY, be precise about what exists.** `index.html:9` declares `viewport-fit=cover` and the manifest is `display: 'standalone'` (vite.config.ts:71), so an installed app on a notched iPhone renders under the status bar. The technique is already in the repo – `.tab-bar` pads `env(safe-area-inset-bottom)` (src/style.css:760), and OnboardingWizard compensates both edges (OnboardingWizard.vue:728, 1534) – but it never reached the shell:

- `--app-pad-top` is a flat `24px` (src/style.css:438), consumed by `#app` (style.css:446). A ~47-59pt status bar sits on top of every screen's first line.
- Home's hero cancels that padding entirely (`margin: calc(-1 * var(--app-pad-top)) ...`, HomeScreen.vue:954) and pins the date/avatar/gear row absolutely at `top: 20px` (`.diary-head`, HomeScreen.vue:1006-1013) – directly under the clock. KidScreen repeats the identical pattern (`.kid-hero` margin at KidScreen.vue:506, `.kid-head` at `top: 22px`, KidScreen.vue:536-543).
- `.tf-top`, the header of every full-screen takeover (TournamentFlow, PracticeFlow, MatchReplay via TakeoverShell), pads a flat `16px` (style.css:1869-1878) inside a `position: fixed; inset: 0` container (style.css:846-853).
- `.update-banner` is `fixed; top: 0` at z-70 (style.css:1778-1780).
- Same bug at the bottom edge, unflagged by the review: the three floating CTA strips anchor at `bottom: 58px` – `.next-week-bar` (style.css:1279-1290), `.cal-go` (CalendarScreen.vue:1131-1144), `.week-proceed` (ThisWeekScreen.vue:290-301). 58px is the tab bar's height *without* its safe-area padding, so on a home-indicator phone the bar grows ~34px taller and overlaps the pills.

**(b) System back exits the app from any depth – the high one.** Navigation is a plain ref switch (`const tab = ref<TabId>('home')`, App.vue:89) and a grep for `pushState|popstate` over src/ returns zero hits. On an installed Android PWA the back gesture backgrounds the app from a live tournament reveal (App.vue:881), a practice match (App.vue:885), the coach market, or a confirm dialog. Autosave prevents loss, but "back closed my game mid-final" is how a mobile-first sim loses Android players.

**(c) No dialog semantics, no live regions.** All eight popup surfaces are plain divs over `.dialog-overlay` (style.css:1433): ConfirmDialog.vue:19, KnockDialog.vue:51, InjuryStopDialog.vue:76, SeasonSummaryDialog.vue:73, InboxSheet.vue:74, PlanWeekSheet.vue:192, RankHelpDialog.vue:44, TierGuide.vue:66. Grep confirms zero `role="dialog"`, `aria-modal`, `aria-live`, focus trapping or Escape handling anywhere in src/ (the only keyboard affordances are SplashScreen.vue:30 and SeasonScreen.vue:1101). Keyboard users tab behind blocking overlays; screen readers never hear the stop toast (App.vue:743), the update banner (App.vue:716), the recovered-save banner (App.vue:735) or `game.error` (funnelled by stores/game.ts:41-51, rendered at HomeScreen.vue:589, SeasonScreen.vue:811, CoachMarketScreen.vue:212, OnboardingWizard.vue:660).

## What (proposed change)

Three deliverables, UI-only. No engine, worker, db or schema file is touched: zero MAIN-stream RNG implications, no migration, no new golden save.

**(a) Safe-area token pass.** Declare two tokens beside the existing pad tokens in src/style.css: `--safe-top: env(safe-area-inset-top, 0px)` and `--safe-bottom: env(safe-area-inset-bottom, 0px)`. Then two rules, applied per the audit table below:
- The shell gutter becomes `--app-pad-top: max(24px, var(--safe-top))`. Chosen over `calc(24px + env(...))` because the 24px gutter's whole job was clearing the top of the window; stacking it under a 47-59pt status bar wastes a full row of the most valuable screen real estate on every screen, and native iOS apps start content at the safe-area line. Both hero cancellations (`calc(-1 * var(--app-pad-top))`) keep working unchanged – the paintings still bleed to the glass.
- Elements *overlaid on* surfaces that deliberately extend under the bar get an additive offset `calc(<base> + var(--safe-top))`: there the base value is a visual gap from surrounding chrome, and `max()` would put controls flush against the clock.

**(b) `useBackStack` – one composable, not a router.** App.vue:2-4 pins "No router – a plain ref switch, per spec", and the marketFrom comment (App.vue:107-117) already rejected general nav history. So: a module-level LIFO of closeable layers with an injected history adapter. Opening a layer pushes one `history.pushState` entry; `popstate` closes the topmost live layer; a layer closed by its own UI consumes its entry via a suppressed `history.back()`. Back on an empty stack does what it does today (exits) – which is correct at the root, and correct for KnockDialog, the one surface that must NOT be back-dismissable (App.vue:902-903: answering it IS the exit; the engine refuses to tick until it is answered – backgrounding the app leaves the knock pending and worker state untouched).

**(c) `useModal` – one shared composable plus an attribute pass.** Behavior (initial focus, Tab containment, focus restore, Escape-where-a-close-exists, back-stack registration) lives in one composable; semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) are template attributes on the existing `.dialog-card`/`.guide-card`/`.plan-sheet` elements, so the house file-scan tests can pin them. Plus `role="status"` on the three App.vue strips and `role="alert"` on the four `game.error` paragraphs. Chosen over native `<dialog>.showModal()` because the eight surfaces share the `.dialog-overlay` flex/`@click.self` idiom and a deliberate z-order (dialogs 60, update banner 70, trophy flight 56); `<dialog>`'s top-layer would repaint that ordering and force a `::backdrop` restyle for zero extra wins. Runner-up under Alternatives.

## How (implementation sketch)

**Step 1 – safe-area sweep (src/style.css + 4 component files).**
1. style.css:438-441: add `--safe-top` / `--safe-bottom` to the `:root` block; change `--app-pad-top` to `max(24px, var(--safe-top))`. The `.recovered-banner`/`.stop-toast` bottom margin (style.css:1365) already names the token and moves with it by design (the geometry note at style.css:1349-1358).
2. Top-anchored fixes, all additive-offset:
   - `.tf-top` (style.css:1869): `padding: calc(16px + var(--safe-top)) 24px 8px;` – fixes TournamentFlow, PracticeFlow and MatchReplay in one rule (all render through TakeoverShell.vue:78).
   - `.update-banner` (style.css:1778): `padding-top: calc(10px + var(--safe-top));`.
   - `.dialog-overlay` (style.css:1433-1440): `padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));` so a tall dialog card never extends under either bar.
   - `.diary-head` (HomeScreen.vue:1006-1013): `top: calc(20px + var(--safe-top));`.
   - `.kid-head` (KidScreen.vue:536-543): `top: calc(22px + var(--safe-top));`.
3. Bottom-anchored fixes: `.next-week-bar` (style.css:1283), `.cal-go` (CalendarScreen.vue:1134), `.week-proceed` (ThisWeekScreen.vue:293) all become `bottom: calc(58px + var(--safe-bottom));`. The 58px stays deliberately re-stated per file – round13-nav.test.ts forbids these files sharing the advance bar's class or name; only the env term is added. Optionally switch style.css:760 to `var(--safe-bottom)` for one vocabulary.
4. Full audit of every `position: fixed|absolute` + top/bottom anchor (grep list, for the builder to re-verify, verdicts): `.tab-bar` 751 (already correct) · `.splash`/`.onboarding`/`.tournament-flow` 846-853 (containers, children handle it) · `.ob-steps` OnboardingWizard.vue:728 and `.ob-foot` :1534 (already correct) · `.coach-highlight`/`.coach-tooltip` 2770-2789 (positioned from measured viewport rects – correct by construction) · `.trophy-flight` 2734 (measured rects, correct) · in-flow strips `.recovered-banner`/`.stop-toast` (inside `#app`, inherit the padded gutter – no change). Leave `--app-pad-x` alone (portrait game; note landscape `safe-area-inset-left/right` as a non-goal).

**Step 2 – back stack (new src/composables/backStack.ts, ~80 lines + wiring).**
1. Core, DOM-free and injectable for node-env tests:
```ts
export interface HistoryPort { push(): void; back(): void }
export function createBackStack(port: HistoryPort) {
  // stack: { close: () => void; dead: boolean }[]  · suppress: number
  // push(close) -> entry; release(entry, viaPop: boolean)
  // handlePop(): skip dead entries; close topmost live; empty -> no-op
}
```
   Rules: UI-close of the top entry does `suppress++; port.back()`; `handlePop` returns early while `suppress > 0`; releasing a non-top entry marks it dead, and a dead entry degrades to one inert back press – never a wrong close.
2. Singleton bound to `window.history` (lazy `popstate` listener, feature-guarded – vite.config.ts:117 runs tests in `environment: 'node'`), plus a Vue wrapper `useBackLayer(close)` (push `onMounted`, release `onBeforeUnmount`).
3. Wire the takeovers, each to its existing exit emit so system back means exactly what the on-screen control means: TournamentFlow `useBackLayer(() => emit('back'))` (hides without resolving – R9-9a, App.vue:537-551; resumable from the global bar); PracticeFlow and MatchReplay `() => emit('close')`.
4. App.vue: one `watch(tab)` managing a single-depth "tabless state" layer for `week | kid | money | more | market` (the union at App.vue:88): entering pushes, moving between tabless states swaps the close target without stacking, leaving releases. Close = `tab.value = marketFrom.value` for market (App.vue:117), else `'home'` (matching ThisWeekScreen's own "Proceed to Home", App.vue:781). Free win: More – the one tabless state with no back affordance (review 05 low) – becomes back-dismissable.
5. Dialogs register through `useModal` (step 3). KnockDialog and OnboardingTour never register; SplashScreen and OnboardingWizard are root states, not layers.
6. iOS notes for the builder: standalone iOS shows no back UI, so the stack is inert there (harmless – entries die with the session); Safari's historical popstate-on-load is neutralized by the empty-stack no-op; the pushState rate limit (100/30s) is unreachable at tap rate. In a Safari browser tab the edge swipe now closes the top layer instead of leaving the page – intended.

**Step 3 – useModal (new src/composables/modal.ts, ~70 lines) + attribute pass.**
1. `useModal(card: Ref<HTMLElement | null>, opts: { onClose: (() => void) | null })`. Module-level stack of instances; only the topmost handles keys. On mount: remember `document.activeElement`, focus the card (`tabindex="-1"`). Document `keydown`: Tab cycles focusables inside `card` (query `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`); Escape calls `onClose` iff provided. On unmount: restore focus. Calls `useBackLayer(onClose)` iff `onClose` is non-null – (b) and (c) meet here.
2. Attribute pass, one component at a time; overlay keeps `@click.self`, card gains `role="dialog" aria-modal="true"` + a label:
   - ConfirmDialog.vue:19-24 – `aria-describedby` on the message; `onClose: () => emit('cancel')`. All five call sites inherit (InboxSheet.vue:94, TournamentFlow.vue:1092, CoachMarketScreen.vue:382, MoreScreen.vue:490, SeasonScreen.vue:1286).
   - KnockDialog.vue:51 – `onClose: null` (no Escape, no back layer, but focus containment – the blocking dialog needs the trap most); labelled by its `.season-summary-title`.
   - InjuryStopDialog.vue:76 and SeasonSummaryDialog.vue:73 – `onClose: () => emit('continue')` (both already dismiss on `@click.self`, so back/Escape adds no new escape hatch).
   - InboxSheet.vue:74, PlanWeekSheet.vue:192, RankHelpDialog.vue:44, TierGuide.vue:66 – `onClose: () => emit('close')`, labelled by their existing `.guide-title`. The InboxSheet-over-ConfirmDialog sibling pair (InboxSheet.vue:68-73) is exactly why the instance stack exists: Confirm mounts later, so it is topmost for Escape, back and the trap.
3. Live regions: `role="status"` on the update banner (App.vue:716), recovered banner (App.vue:735) and stop toast (App.vue:743); `role="alert"` on the four `game.error` paragraphs (HomeScreen.vue:589, SeasonScreen.vue:811, CoachMarketScreen.vue:212, OnboardingWizard.vue:660). Centralizing error display is review 05's separate finding and stays out of scope.

## Test plan

TDD order, house idioms (real unit tests on pure logic, file-scan tests on templates – the round13-nav.test.ts discipline, comments stripped via the shared `codeOf` helper). No golden-save impact, no bench impact, no schema change; `npm run check` is the gate.

1. **tests/back-stack.test.ts first (red), then the core module.** Pure `createBackStack` against a fake `HistoryPort`: push/pop LIFO across three layers; UI-close consumes exactly one entry (suppress); popstate on empty stack no-ops; dead-entry skip degrades to an inert press; suppress never closes the wrong layer under a fast close-then-open. Node env, zero DOM.
2. **tests/mobile-a11y.test.ts (file-scan, red before the attribute pass).** Every src/components file whose stripped template contains `class="dialog-overlay"` also contains `role="dialog"`, `aria-modal="true"` and a `useModal(` call; KnockDialog pins `onClose: null` and must NOT contain `useBackLayer`; App.vue's three strips carry `role="status"`; the four `game.error` lines carry `role="alert"`. Carry vacuous-truth insurance (assert the expected file count), the design-tokens test's own lesson.
3. **tests/safe-area.test.ts (file-scan).** The `--app-pad-top` declaration contains `env(safe-area-inset-top` (via `--safe-top`); `.tf-top`, `.update-banner`, `.dialog-overlay` reference `--safe-top`; the three `bottom: 58px` strips reference `--safe-bottom`; assert each selector was actually found.
4. **Existing suites stay green** – design-tokens.test.ts (new tokens are declared in src/style.css, its rule B home), round10.test.ts (no curly braces in comments inside the `.stop-toast` rule – its parser slices to the first `}`), round13-nav.test.ts (App.vue is sliced by literal markers; run the full unit suite after every App.vue edit).
5. **Hand-verification matrix – the honest part until P9 lands component tests.** Focus trapping, focus restore, VoiceOver announcements and real popstate behavior cannot be asserted in a node-env suite. Matrix: iPhone with Dynamic Island (real device or iOS Simulator with the PWA installed to Home Screen – env() values are real there), iPhone SE (20px bar), Android phone/emulator with Chrome installed-PWA (the back gesture is the whole point of (b)), iPad, and a plain browser tab on each (all env() = 0 – the regression check). Script: back closes topmost layer only, in order dialog -> takeover -> tabless state -> exit; back with the knock up backgrounds the app and the knock is still there on return; Escape closes Confirm/guides/planner but never the knock; hero still bleeds to the glass on Home and Kid; `.diary-head` clears the clock; CTA pills clear the home indicator; update banner readable under the notch.

## Acceptance criteria

- [ ] Installed on a notched iPhone: no interactive control or text sits under the status bar on Home, Kid, any takeover header, the update banner, or any dialog; the hero paintings still reach the glass edge.
- [ ] The three floating CTA pills clear the tab bar on home-indicator devices; in a desktop browser tab every screen is pixel-identical to today (all env() resolve to 0).
- [ ] Android installed-PWA: system back closes, in order, the topmost dialog, then the open takeover (tournament pauses, resumable via the global bar – never resolves anything), then a tabless state (to Home, or `marketFrom` for the market), and only then exits.
- [ ] KnockDialog is not closeable by back or Escape; backgrounding with it open loses nothing.
- [ ] All eight `.dialog-overlay` surfaces carry `role="dialog"`, `aria-modal="true"`, a label, initial focus, Tab containment and focus restore; Escape works exactly where a close/cancel exists.
- [ ] Three App.vue strips have `role="status"`; four `game.error` sites have `role="alert"`.
- [ ] New tests (back-stack, mobile-a11y, safe-area) pass; every existing test passes; `npm run check` green; no file under src/engine, src/worker, src/db, src/shared touched; no schema version bump, no new golden fixture needed.

## Risks & alternatives

- **History-stack drift** (double-close, orphan entries) is the classic failure of hand-rolled back shims. Mitigated by the suppress counter, the dead-entry rule (degrades to one inert press, never a wrong close), single-depth tabless layers, and the pure-core design that lets every ordering be unit-tested in node. Worst case equals today's behavior (app exits).
- **Safari browser-tab behavior change**: edge-swipe now closes a dialog instead of leaving the page. Intended, but name it in the PR so it is a decision, not a surprise.
- **`max()` vs `calc()` for the shell gutter**: `max(24px, var(--safe-top))` gives content zero extra gap below the status bar. If the owner finds h1s too tight on device, the runner-up – `calc(24px + var(--safe-top))` everywhere, one consistent rule at the cost of ~24px per screen – is a one-token change; the audit table localizes the decision.
- **Native `<dialog>`/showModal** (runner-up for (c)): free focus trap, Escape and top-layer, but it repaints the app's deliberate z-order (update banner 70 must outrank dialogs 60), requires `::backdrop` restyling of the shared `.dialog-overlay` idiom across eight surfaces, and its Escape must be selectively suppressed for the knock. More churn, same end state.
- **Navigation API** instead of pushState/popstate: cleaner semantics, but no Safari support – dead on arrival for an iOS-first PWA.
- **Text-scan fragility**: round10/round13 tests parse source by literal markers; the builder must run the unit suite after each edit rather than at the end.

## Dependencies

None. P9 (component-test wave) later upgrades the hand-verified items – focus trap, popstate closes, live-region announcements – into mounted component tests; this proposal deliberately leaves those as scripted manual checks rather than blocking on P9.
