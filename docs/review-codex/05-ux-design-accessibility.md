# UX, Visual Design, and Accessibility Review

## Verdict

The interface is already one of the project's strongest differentiators. Art direction, hierarchy, typography, illustration, and mobile composition feel intentional rather than provisional. The main UI risk is underneath the pixels: modal semantics, navigation history, safe areas, narrow-screen layouts, and accessibility state have not reached the quality of the visual layer.

Live checks were performed at desktop and mobile widths, including 390×844 and 320×568. No console errors were observed in the exercised flow. “Live-confirmed” below means the behavior was reproduced in a browser; other findings are code-evident and should still be checked on physical devices.

## Notable strengths

- Cohesive fonts, colors, spacing, strokes, radii, cards, and focus primitives create a recognizable product.
- Onboarding and Home have strong information hierarchy, scrims, card composition, art placement, and call-to-action prominence.
- The 390×844 layout showed no horizontal overflow in the tested path.
- Reusable `ScreenShell`, `Card`, `IconButton`, `SegmentedRow`, and stat components are a strong base.
- Reduced-motion support appears in both CSS and animation/composable logic.
- The Season history scroller is keyboard reachable, calendar columns have accessible labels, and trophy cells are labeled—evidence that accessibility has received real thought.
- PWA update checking and reload presentation are thoughtfully implemented.

## High-severity findings

### P1 — Dialogs and sheets are not programmatically modal

`ConfirmDialog`, Ranking Help, Tier Guide, Inbox, Plan Week, Injury Stop, Season Summary, and Knock overlays are visually modal but do not consistently provide dialog roles, accessible title relationships, focus entry/trapping/restoration, inert background, Escape behavior, or scroll locking. Live inspection confirmed that focus could remain on the underlying trigger and background controls stayed in the accessibility tree.

Evidence includes [`ConfirmDialog.vue`](../../src/components/ConfirmDialog.vue), [`RankHelpDialog.vue`](../../src/components/RankHelpDialog.vue), [`PlanWeekSheet.vue`](../../src/components/PlanWeekSheet.vue), and [`SeasonSummaryDialog.vue`](../../src/components/SeasonSummaryDialog.vue).

Build one reusable `DialogShell`, preferably around native `<dialog>`, with `aria-labelledby`, focus management, inert background, and explicit dismissal policy. Critical reports such as injury and season summary should not advance through an accidental backdrop tap. This aligns with the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### P1 — The onboarding tour leaves the game interactive

The coach overlay lacks modal and focus semantics. Its outer layer uses `pointer-events: none`, restoring input only on the tooltip, so game controls beneath remain actionable. At 320px the tooltip overlapped the Training Week region while underlying controls remained exposed and present in the accessibility tree.

Make the application inert for the tour. If a step is meant to teach a target through interaction, whitelist only that target and explicitly describe the required action.

### P1 — Safe-area handling is fragmented

The page enables `viewport-fit=cover`, but the bottom nav, floating week action, content reservation, hero controls, and takeover headers use different fixed values. Some screens cancel root top inset handling. On installed iPhones this can place hero controls under the status area or collide the floating CTA with a taller home-indicator inset.

Define shared `--safe-top`, `--safe-bottom`, `--nav-height`, and `--floating-action-offset` variables, then derive all page padding and fixed controls from them. Confirm on notched physical devices in portrait and landscape.

### P1 — The compact weekly calendar breaks at 320px

The seven-column grid forces 8.5–9.5px labels into very narrow cells with aggressive word breaking. Live labels fragmented into stacks such as “Sch / ool” and “Ret / urn / w / ork.”

At widths below 360px, use either a horizontally scrollable minimum-width grid or short visible codes/icons with a legend and day-detail view. Preserve full accessible names.

### P1 — Ref-based navigation breaks platform expectations

Ten logical screens are conditionally rendered from a `TabId` ref. Browser/PWA back, deep linking, reload restoration, title changes, screen focus, and scroll restoration are absent or bespoke. The market remembers only one parent surface.

A lightweight History API/router mapping is now the simpler user model. If URLs are deliberately rejected, implement a formal navigation stack and intercept platform back gestures consistently.

### P1 — Page, navigation, unread, and live match states are not announced

- Bottom navigation marks the active tab only with a class; it lacks `aria-current="page"`.
- Notification dots do not add unread information to accessible names.
- Major Home and Kid identities are plain text rather than page headings; other screens begin at `<h2>`.
- Toasts and update banners lack `status` or `alert` semantics.
- Match canvas/commentary has no usable throttled live summary of score and point state.

Live inspection confirmed no Home `h1` and no selected/current navigation announcement. Add one page heading, current-page state, unread wording, navigation focus transitions, and a concise `aria-live` match summary.

### P1 — A destructive development shortcut ships in the player UI

Settings exposes `▶▶ 52 (dev)`, which advances 52 weeks without the normal UI's guard rails and autosaves the result. This is both a product-integrity and UX defect: a player can silently destroy the timing of a career from a production-facing “Danger zone.” Gate it behind `import.meta.env.DEV` or remove it from shipped code.

## Medium-severity findings

### Touch targets are undersized

Home tools are approximately 22×22px, Kid settings 21×21px, the avatar 30×30px, and generic icon buttons 32×32px. Keep compact glyphs but give controls 40–44px boxes. WCAG 2.2's minimum criterion is 24×24px with limited spacing exceptions, while the enhanced target is 44×44px: [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) and [Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced).

### Normal metadata text can miss contrast

`--ink-dim: #6d7a83` measures approximately 4.39:1 on the page background, 4.09:1 on panels, and 3.69:1 on card tops. It is used for metadata, not just decorative text. Promote normal-sized copy to the stronger muted token and reserve dim for large/decorative or disabled presentation.

### Onboarding has semantic and responsive defects

- `aria-labelledby="ob-hero-title"` refers to a missing ID.
- Step changes neither move focus nor announce “Step N of 6.”
- The progress rail visibly clips at 320px.
- “Girl” looks like a selectable option but does nothing; “Boy” is disabled with a title-only explanation.
- “All countries” is actually 24 supported countries.
- The tour comment says four steps while the implementation contains five.
- The tour teaches surfaces but not the core money, travel, condition, or planning trade-offs.

Move focus to the new step heading, announce progress, simplify the narrow progress UI, explain the girls-tour scope in visible text, and use “Supported countries.”

### Data-loss treatment is inconsistent

Career deletion is confirmed, while named-save deletion is immediate. Offer refusal is terminal, unconfirmed, and adjacent to acceptance. Confirm named-save deletion or provide trash/undo; give offer refusal a short undo window if design permits.

### Repeated accessible names lose context

Season can render multiple buttons named only “Enter” and “+ Plan week.” A screen reader user cannot identify the associated event or week from the control list. Include the event name/date in accessible labels while retaining compact visible copy.

### Settings hides errors

The store captures action failures into `game.error`, but the Settings screen does not render it. Import, save, export, or restore failures can appear to do nothing. Use a consistent visible error surface and recovery action across every screen.

### Empty trophies overexpose locked content

The empty state enumerates all 18 locked trophies. This is visually heavy, can spoil discovery, and offers little immediate action. Show a smaller teaser, nearest attainable goals, and progressive disclosure.

### Design-system adoption is incomplete

Several option rows reimplement a segmented-control pattern without `aria-pressed`, while Season reimplements an existing weather presentation. Consolidate same-role controls and behaviors; avoid a generic abstraction for visually distinct content.

### Formatting is inconsistent

Dates and money mix hand-built English strings, `en-GB`, `en-US`, and duplicated dollar formatters. Create one locale-aware presentation service even if v1 ships only in English. This is both DRY and UX consistency work.

### Installed PWA details need alignment

- Core music/audio is not intentionally cached, so an installed “offline” game may lose sound before assets have been fetched.
- Manifest and HTML use `#0f172a`, while the app background is `#0a0e13`, which can create a launch/chrome seam.
- The five-column named-save table lacks the responsive scroller used elsewhere and is likely to overflow with populated data.

## Testing recommendation

Add a small rendered Playwright plus axe suite at 320×568, 375×667, 390×844, and one tablet width. Cover:

- onboarding completion and focus changes;
- tour input blocking;
- opening/closing each dialog and returning focus;
- bottom navigation state and browser back;
- long calendar labels and populated save table;
- keyboard-only planning and offer decisions;
- match score live summary;
- reduced motion and one high-contrast/zoom pass.

Rendered tests should replace source-regex assertions for behavior. They will not replace a manual screen-reader pass on VoiceOver and NVDA or physical-device safe-area testing.
