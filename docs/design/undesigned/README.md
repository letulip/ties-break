# Undesigned surfaces – reference screenshots

Reference shots of the app's interface surfaces that have no design pass yet, for handing to a
designer.

**Capture setup**

- Viewport 375 × 812 CSS px (mobile preset), captured at DPR 2 → every PNG is 750 × 1624.
- Every shot is a **viewport** shot, not a full-page one. Where a surface is taller than 812 px the
  "Representative?" column says what is below the fold.
- Game state: a headless demo career built with `tools/demo-save.ts`
  (`--seed acad-offer --background working`), then played forward in the browser. Vera Martin, age
  16, around rank #115–#121, ~$520k funds, two completed seasons, real match history, entries,
  injuries and money movement. The temporary `.tsave` files used to seed it were deleted afterwards.

**Two corrections to the surface list** (found while capturing, worth knowing):

- The counting best-6 results table is **not** in `StatsScreen`. `CountingResultsTable.vue` is used
  by `KidScreen.vue` and by `RankHelpDialog.vue` only. Shot `04` is therefore the Kid screen's copy.
- `RankHelpDialog` is opened from **Home** (the rank chip under her name), not from Stats.

| File | Surface | How it is reached | Representative? |
|---|---|---|---|
| `01-splash.png` | `SplashScreen.vue` | First screen on every page load, before the tab shell. | Yes – this is the entire surface. |
| `02-onboarding-tour.png` | `OnboardingTour.vue` – coach-mark tour, step 1 of 5 | Auto-opens over Home right after the **first ever** career on a device. | The card itself is representative. The Home behind it is necessarily a brand-new W1 career (empty budget, no news, nothing entered) – the tour is gated on `firstEverCareer` + `localStorage['tb:onboardingTourSeen']`, so it can never be seen over a mature career. |
| `03-stats.png` | `StatsScreen.vue` – top | "Stats" tab. | Yes. Standings continue below the fold (top 10 + a gap + her neighbours + "Your rank"). |
| `04-stats-counting-results.png` | `CountingResultsTable.vue` – "Counting results (best 6)" | **Kid screen**, reached by tapping her photograph on Home. Not in Stats. | Slightly thin: only 5 of the 6 slots are filled, because she has 5 counting results in the 52-week window. Structure and totals are real. |
| `05-stats-season-history.png` | `SeasonHistoryTable.vue` – "Season by season" | "Stats" tab, second card (scrolled to). | Thin, and shows a layout bug: only 2 completed seasons exist (2032, 2031), and the **FUNDS column is cut off** – the table overflows 375 px and makes the whole page scroll sideways (`scrollWidth` 426 vs 375). |
| `06-more.png` | `MoreScreen.vue` | "More" tab. | Careers (2, one active) + Saves + Danger zone are shown. **SOUND and ABOUT sections are below the fold.** |
| `07-this-week.png` | `ThisWeekScreen.vue` | Home → the "Next tournament" note-card. It is **not** in the tab bar (the tab bar's Calendar slot is a disabled placeholder). | Yes – all three blocks present: This week, Training plan, and a real Week recap. The recap card only exists in a week that produced one, so it is absent on many weeks. |
| `08-plan-week-sheet.png` | `PlanWeekSheet.vue` – Practice tab | Season tab → a week card's "+ Plan week". | Yes, with a live CTA ("Book anyway" + the worn-out guardrail warning). **The Vacation tab is not shown.** Booking then opens a second `ConfirmDialog` ("Push through"). |
| `09-tier-guide.png` | `TierGuide.vue` | Season tab → the "?" button in the header. | Structure is real, but the same overflow bug as `05`: the **TRAVEL and POINTS (W/F/SF/…) columns are cut off** at 375 px, and the last tier row is clipped at the bottom of the card. |
| `10-rank-help.png` | `RankHelpDialog.vue` | **Home** → the rank chip ("#115 ↑7") under her name. Not from Stats. | Yes – table, total and all three rule lines fit in one viewport. Same 5-of-6 rows note as `04`. |
| `11-season-summary.png` | `SeasonSummaryDialog.vue` | Auto-opens on the advance that crosses the W49 → W50 boundary. | Yes – the fullest possible state: every row populated, including "Lost to injury" and "Academy covered". |
| `12-injury-stop.png` | `InjuryStopDialog.vue` | Auto-opens when an advance is stopped by a fresh injury. Random; it took ~20 advances to fire. | Yes – a Major injury with a cancelled entry and a refund, i.e. the dialog's richest variant. Note the separate `walkover` stop-toast stacked above it, which is what that same week also produced. |
| `13-match-replay.png` | `MatchReplay.vue` | Home → news feed → a match row's "Watch". Also on Season, from a bracket row. | Yes – caught mid-match at 2× with the court view, live score, momentum bar and the stats table. |
| `14-practice-flow.png` | `PracticeFlow.vue` – entry splash | Season → "+ Plan week" → Practice → book, then advance into that week from Home. | **Thin, and that is the finding.** The entry splash is roughly half empty screen. The screen after "Watch it" is `MatchViewer`, which is the same component shown in `13`. |
| `15-confirm-dialog.png` | `ConfirmDialog.vue` | Season → an entered tournament's "Withdraw". Also used by More, PlanWeekSheet and TournamentFlow. | Yes – the dialog is small by design; the shot shows it in place on the Season screen. |

**Surfaces not captured:** none. All 14 requested surfaces plus the optional `ConfirmDialog` were
reached in the running app without any change to `src/`.
