<!-- Full project review, 2026-08-01, reviewed at origin/main b7a9358 (branch docs/full-review). -->
<!-- Method: independent reviewer agent per dimension, read-only; top findings adversarially verified (see README.md). -->

# UX / UI / PWA Review – Ties Break: Ace Parent

## Verdict

This is an unusually disciplined mobile UI codebase: the weekly loop is legible and hard to misuse (one composable answers what the week button says, does, and whether it may act), saves are close to loss-proof (dual checksummed autosave generations, recovery banner, export/import, persistent-storage request), and the PWA update flow fixes the stale-installed-app trap most PWAs ship with. Onboarding is short, skippable, and teaches the right three things. The gaps are not in the interaction design but at the device boundary and in accessibility plumbing: the app opts into viewport-fit=cover but compensates for the notch in only two places, so installed on a modern iPhone the Home header, tournament header and update banner sit under the status bar; there is zero history integration, so the Android back gesture backgrounds the app from any depth including a live match; and dialogs have no dialog semantics, no focus management, and no live regions. The three actions that matter most: add env(safe-area-inset-top) to the shell and takeover paddings, add a minimal history shim for takeovers and tabless states, and give the dialog family role/focus/Escape behaviour in one shared place (TakeoverShell's sibling for popups).

## Strengths

- **One answer per question.** `src/composables/weekAction.ts` derives label, mode, disabled and blocked-reason for both week buttons; App.vue routes every press through one `playWeek` handler. The file documents the arrival-gate bug it was written against. This is the single best defence the app has against its known worst bug class ("button says X, does Y"), and it is pinned by tests.
- **The token gate.** `tests/design-tokens.test.ts` mechanically enforces that every `var(--x)` resolves and that design-system tokens have exactly one home in `src/style.css`. CSS custom properties fail silently; this test makes that failure loud, and it carries vacuous-truth insurance so the scanner itself cannot rot. Rare to see, genuinely valuable.
- **Update flow done right.** `src/pwa.ts` uses `registerType: 'prompt'` with re-checks on visibilitychange and an hourly timer – the exact fix for the "installed PWA never sees the new build" failure the owner hit on 31.07, tested in `tests/pwa-update.test.ts`.
- **Saves a player will not lose.** Two alternating checksummed autosave generations with fallback recovery and a visible "restored the previous one" banner (`src/db/saves.ts`, App.vue); per-career named slots; `.tsave` export/import; `navigator.storage.persist()` requested at init with an honest "best-effort" pill and a backup nudge (MoreScreen.vue:324-330).
- **Measured asset strategy.** Heavy paintings excluded from precache with measured KiB figures in vite.config.ts; CacheFirst runtime caching plus band-scoped preload (`src/art/preload.ts`) keeps install small while the finale never paints before its art.
- **Irreversibility as a design constraint.** The advance lives on Home only; the free resume arm stays global; ThisWeek's exit is named "Proceed to Home" precisely so it cannot read as an advance; blocked controls state their reason (R10-16 doctrine). Double-booking is engine-enforced (world.ts:2365-2367) and mirrored pre-click in PlanWeekSheet's disabled-with-reason buttons.
- **Explicit overlay ordering.** Knock > injury > season summary, one at a time, every StopReason owning a surface; the empty-toast class of bug removed by construction (toast shows iff copy exists).
- **Reduced motion respected across 7+ surfaces**, and the settings screen honestly says the OS switch outranks the in-app toggle.
- **Onboarding earns its length**: 6 steps, "Skip for now" to defaults, only two validity gates, a NaN-guard on the birthday that protects the persisted profile, plus a one-shot 5-step coach-mark tour anchored to real DOM nodes.
- **Verification culture.** The TakeoverShell extraction was driven by a measured occlusion bug (31.5px of the control bar behind the tab bar at 375x812, proven with elementFromPoint). The ui-inventory's two capture-pass defects (season-history and TierGuide overflow at 375px) are both actually fixed in code.

## Findings

**[HIGH] No top safe-area compensation in standalone mode** – `src/style.css:438`, `index.html:9`
`viewport-fit=cover` is declared, so an installed app renders under the notch, but only the tab bar bottom (style.css:760) and the onboarding step rail (OnboardingWizard.vue:728) compensate. `--app-pad-top` is a flat 24px; Home's hero cancels it and pins the avatar/date/settings row at `top: 20px` (HomeScreen.vue:954, 1006-1010); `.tf-top` pads 16px (style.css:1870); `.update-banner` sits at `top: 0` (style.css:1778). On a notched iPhone (status bar ~47pt+) these controls collide with the clock. Fix: `--app-pad-top: calc(24px + env(safe-area-inset-top, 0px))` and the same term on `.tf-top`, `.update-banner` and the hero header offset. The onboarding rail proves the team knows the technique – it just never reached the shell.

**[HIGH] No history integration – system back exits from any depth** – `src/App.vue:89`
Navigation is a plain ref switch; zero pushState/popstate usage in src/. In an installed Android PWA the back gesture backgrounds the app even from a full-screen tournament, a live match, or the coach market. Autosave prevents data loss, but "back closed my game mid-final" is how a mobile-first sim loses Android players. Fix direction: push one history entry when a takeover or tabless state opens; on popstate, close it – a ~30-line shim, no router needed.

**[MEDIUM] Dialogs lack dialog semantics and focus management** – `src/components/ConfirmDialog.vue:19`
ConfirmDialog, KnockDialog, InjuryStopDialog, SeasonSummaryDialog, InboxSheet, PlanWeekSheet, RankHelpDialog, TierGuide are plain divs: no `role="dialog"`, no `aria-modal`, no focus trap, no initial focus, no Escape (grep confirms zero hits). Keyboard users can tab behind blocking overlays; screen readers get no modal announcement. Fix: one small shared popup shell (the ConfirmDialog family already funnels through `.dialog-overlay`) carrying role, aria-modal, focus-on-open, and Escape-where-a-cancel-exists (the Knock dialog rightly has none).

**[MEDIUM] No live regions anywhere** – `src/App.vue:716`
The update banner, stop toast, recovered-save banner and every `game.error` paragraph appear with no `aria-live`/`role="status"` (grep: zero hits). The stop toast is the game's explanation for why time halted – assistive tech never hears it. Fix: `role="status"` on the three strips, `aria-live="assertive"` on the error line.

**[MEDIUM] Errors surface on only 4 screens; import failures invisible where they happen** – `src/components/screens/MoreScreen.vue:144`
`stores/game.ts:47` catches every action failure into `game.error`, rendered only by Onboarding, CoachMarket, Home and Season. MoreScreen performs import-from-file, load, delete, save-as – and shows nothing on failure; a corrupt `.tsave` import silently does nothing. Calendar/ThisWeek/Money/Kid/Trophies likewise. Fix: render the error strip once in App.vue (it already owns the toast idiom) instead of per-screen.

**[MEDIUM] Coach-mark tour can point off-screen** – `src/components/OnboardingTour.vue:68`
`measure()` takes a bounding rect without `scrollIntoView` and re-measures only on resize. Step 4 targets Home's next-tournament card, which sits below a square full-width hero – below the fold on short phones (667px). `tooltipStyle` clamps horizontally only (lines 108-117). Fix: `el.scrollIntoView({block:'center'})` before measuring, then measure on the next frame.

**[LOW] Manifest/theme colour is the pre-redesign background** – `vite.config.ts:67`
`theme_color`/`background_color` and index.html's meta are `#0f172a`; the app's real background is `#0a0e13` (style.css:57, since 28.07). Android status bar tint and the install splash flash the wrong colour. One-line fix, plus the token gate's lesson applies: these three copies of the background colour have no test pinning them together.

**[LOW] Mandatory tap-to-start splash on every launch** – `src/components/SplashScreen.vue:30`
Deliberate (audio unlock, owner ruled "stays as it is"), but it costs one blocking tap per session even for players who muted sound AND music – both flags are readable before the tap. Consider auto-dismissing when both are muted, or a short auto-timeout.

**[LOW] Pill selections outside SegmentedRow have no selected-state semantics** – `src/components/screens/ThisWeekScreen.vue:198`
SegmentedRow defines the contract (aria-pressed, group label); the visually identical `.option-pill` rows (plan presets, planner tabs, pace picker, Money toggle) convey selection by class only. SegmentedRow's own header notes the Money toggle "should then come here" – finish that migration.

**[LOW] Match viewer preferences reset every match** – `src/components/MatchViewer.vue:113`
`viewMode` ('key') and `speed` (2x) are per-mount; every other player preference in the app persists to localStorage. A skip-everything player re-selects Skip for each of ~5 matches per tournament. Persist both under the existing settings idiom.

**[LOW] px-only typography, 11-12px UI text** – `src/style.css:784`
0 relative font units against 108 px declarations; tab labels 11px, pills 12px. Browser font-size preferences are ignored (zoom still works). Low priority for a game UI, but the smallest sizes are also the densest information (hints, pills).

**[LOW] More is the one tabless state without a back affordance** – `src/components/screens/MoreScreen.vue:253`
Kid, Money, Market and ThisWeek all draw explicit exits; More (reached via gears on Home/Kid) has none and no tab highlights while it is open. Add the same bare back arrow Kid uses.

**[LOW] Home's week button hides its blocked reason** – `src/App.vue:822`
`weekAction.blockedNote` renders only on the Calendar projection (CalendarScreen.vue:561). Home's pill just disables – against the app's own stated doctrine. Latent today (KnockDialog covers the screen), but the contract exists precisely for the day that cover moves.

**[LOW] Content column 880px vs 520px bars above phone width** – `src/style.css:444`
`#app` allows 880px while the tab bar, week pill, update banner and proceed bar cap at 520px – on tablets the controls float over a narrower column than the content. Pick one number.

**[LOW] No install promotion despite clearable storage** – `src/components/screens/MoreScreen.vue:324`
No `beforeinstallprompt` capture, no add-to-home-screen hint anywhere – yet the More screen already warns when storage is best-effort. Installing is the strongest protection an iOS player has for an IndexedDB career; the warning row is the natural place to say so.

## Recommendations

1. **Safe-area pass (high, small).** Add `env(safe-area-inset-top)` to `--app-pad-top`, `.tf-top`, `.update-banner`, and the hero header offset; re-check on an installed notched device. The bottom edge and onboarding already show the pattern.
2. **History shim for takeovers and tabless states (high, ~30 lines).** Push a state when TournamentFlow/PracticeFlow/market/money/kid/week/more opens; close it on popstate. This makes the Android back gesture do what every player expects without introducing a router.
3. **One accessible popup shell (medium).** Fold role="dialog", aria-modal, initial focus, focus containment and optional Escape into the `.dialog-overlay` family; add `role="status"` to the three banners and the error line. One component, eight surfaces fixed.
4. **Centralize error display in App.vue (medium).** The store already funnels every failure into one string; render it once, globally, in the toast idiom – and MoreScreen's import path gets feedback for free.
5. **Tour scroll-into-view fix (medium, tiny).** Scroll the anchor into view before measuring; clamp the tooltip vertically.
6. **Quick wins batch (low).** Sync theme_color to #0a0e13 (and pin the three copies with a test, per the token-gate lesson); persist match-viewer mode/speed; aria-pressed on the option-pill rows; back arrow on More; skip the splash tap when both audio channels are muted; mention install in the best-effort storage warning.
