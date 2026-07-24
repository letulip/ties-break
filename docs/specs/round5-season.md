# Round-5 season/UX spec (owner items)

Branch `feat/round5-season-ux`. Ten owner items: calendar generation off-season shaping, real
dates, and the Season/TournamentFlow/Home UI built on top. Two sibling branches are in flight, so
`src/engine/season/ranking.ts`, `src/audio/`, `README.md`, `scripts/optimize-art.mjs`,
`OnboardingWizard.vue` and the Home player card's Condition row are untouched here.

## 1. Real dates

`src/shared/dates.ts` (pure, no engine/DOM deps): a fixed fictional epoch, Monday **Jan 6, 2031**
= career week 0. `weekStartDate`/`weekEnd` are internal; the public surface is:

- `weekRange(week): string` – `"Jan 6–12, 2031"`. Widens only as far as needed to stay
  unambiguous: same month → bare day range; crosses a month → `"Jan 27 – Feb 2, 2031"`; crosses a
  year → `"Dec 29, 2031 – Jan 4, 2032"`. En dash `–` only, per the house dash rule – never an em
  dash.
- `weekYear(week): number` – the calendar year of the week's Monday (start date). Used to key
  season-year boundaries and to label the wrap-up milestone ("Season 2031 wrap-up").

Wired in everywhere the spec asked: the header pill's `title` attribute (App.vue), Season calendar
rows (event AND muted rows), the Home "This week" card, and the TournamentFlow header/splash.
10 unit tests in `tests/dates.test.ts` (epoch, month-cross, year-cross, dash character, purity,
`weekYear` boundaries).

## 2/3. Off-season + visible training weeks (items 16, 21, 16)

`src/engine/season/calendar.ts` gains:

- `WEEKS_PER_YEAR = 52`, `OFF_SEASON_WEEKS = 3`, `isOffSeasonWeek(week)` – true for the last 3
  weeks of every season year (`week % 52 >= 49`), which lines up with the real-dates epoch as the
  real Dec-15 → Jan-4 school break.
- `buildSeason` pre-reserves every off-season week in its placement window (before even the
  national tier), so no event is ever scheduled there. Tier counts are unaffected (still
  `floor(weeks/cadence)` per tier) since only 3 of 52 slots are withheld.

`src/engine/world.ts`:

- `maybeFireSeasonWrapUp` fires once, the moment `world.week` ticks into a year's first
  off-season week (`week % 52 === 49`), from inside the existing `!pendingTournament` branch of
  `tickWeek` (so it always runs AFTER that week's own rank recompute). Everything is read back off
  the **existing** results/events ledgers for the just-finished year, deliberately avoiding new
  persisted state:
  - season points: `results` filtered to `[yearStart, wrapWeek)` for `KID_ID`.
  - best finish + W-L record: scanned off `tournament`/`match` events in the same range. Tournament
    summary events now carry an optional `finishIdx` (protocol.ts, purely additive – no migration)
    so "best result" reads a real finish label, not just a raw points number.
  - rank vs season start: `computeRanking` replayed at `yearStart` against the CURRENT results
    ledger (still inside the 52-week window at that point, so nothing relevant has been pruned).
  - funds delta: signed `amountCents` summed over events in range – a flavor figure, not the audit
    trail (MoneyScreen's ledger stays authoritative).
  - Emits a `keep:true` milestone (`season-wrap-{year}`) plus a plain `info` "Off-season: rest,
    school, family time."
- `ensureSeason` emits an `info` "New events on the calendar" event whenever a new calendar block
  is generated **after** the career already had a season (a `hadSeason` flag captured once at the
  top of the function) – so the very first block a career/migration ever generates stays silent,
  but every later rolling-calendar extension during real play is announced. This also keeps the
  existing v5→v6 migration test's exact `infoTexts` assertion intact (that path always starts from
  an empty `season` array).

SeasonScreen.vue synthesizes the full calendar list itself (no snapshot shape change needed):
`calendarRows` walks `week+1 .. week+8`, pairing each week against `upcoming` and falling back to a
muted "Training week" or "Off-season" row (`isOffSeasonWeek`, imported read-only from
calendar.ts) with its `weekRange` date.

Tests: `tests/season/calendar.test.ts` (off-season reservation across seeds/years, tier counts
unaffected), `tests/seasonWrapUp.test.ts` (wrap-up timing/idempotency/second-year, off-season gap,
new-calendar marker on/off, full-bracket data – see item 5 below).

## 4. Season sub-tabs

`SeasonScreen.vue` gets a local `seasonTab: 'calendar' | 'standings'` ref and a small pill-style
tab row (`.tab-pill`) in a new topbar. **Calendar**: this-week's-tournament strip + My entries +
the dated calendar + Friendly match (unchanged block, just re-scoped). **Standings**: the full
standings card, unchanged content.

## 5. Full bracket view

`PendingView` (protocol.ts) gains `fullBracket: FullBracketMatch[]` – every match (not just the
kid's) from every round **revealed so far**. Computed in `pendingView()` (world.ts) from
`p.result.matches` (already fully computed by `computeShadowTournament`, byte-identical, never
re-decided) bounded by `revealed - 1` (kid's matches are always consecutive rounds 0..revealed-1 in
a single-elim draw, so that also bounds which OTHER matches are safe to reveal). Names resolve via
a new `playerShortName` helper against `world.cohort` (covers AI opponents the kid never actually
played, not just her own).

`score` is normalised to the **winner's** perspective (`MatchRecord.score` is always stored from
side A's perspective, flipped iff B won) – **not** the kid's perspective, since a full-draw row
lists arbitrary AI-vs-AI matches too. TournamentFlow.vue's `fullDrawRounds` computed then reorders
each match's *display* as winner-first ("V. Martin d. C. Xu 6-4 …"), grouped by round, behind a
collapsible "Full draw" toggle shown between rounds and at the finale (whenever
`fullBracket.length > 0`). AI-vs-AI matches show no scoreline (they never ran the full point
engine) – only win/loss + names.

**Bug caught in live-verify and fixed**: an earlier version flipped the score to the KID's
perspective whenever she was on side B but kept a/b display order, so a losing side A read as if
it had won ("C. Xu d. V. Martin 6-4 6-7 7-5" when Vera actually won). Fixed by normalising to the
actual winner's perspective in the engine and reordering winner-first in the UI; regression test in
`tests/seasonWrapUp.test.ts` replays 20 seeds looking for a kid-on-side-B case and asserts the
engine's `score` always matches `record.winnerId === record.bId ? flipScore(record.score) :
record.score`.

## 6. Pre-tournament splash

TournamentFlow.vue gains a `'splash'` phase, shown first whenever the flow opens on a tournament
with nothing revealed yet (`pending.bracket.length === 0`); resuming mid-reveal or at the finale
skips straight past it, as before. Art: `fem-euro-brunnet-jun-serious-fs8.webp` (a `jun`-stage
serious portrait exists, so no fallback needed). Content: tier label, surface pill, `Draw of
{drawSize}` and `{drawSize} entrants` (drawSize read straight off `TIERS[pending.tier]`, no
protocol change), the week's date range, and "Begin →" (`beginFromSplash` → `enterPre()`).

## 7. Tour guide

New `src/components/TierGuide.vue`: a `.dialog-overlay` card (reusing the existing overlay/close
pattern from MatchReplay.vue) rendering a table straight off `TIERS` (calendar.ts, single source of
truth) – tier, draw size, entry fee, travel range, and the points-by-finish array – plus the ITF
locked row and the "Junior events pay no prize money…" note. Opened via a small "?" pill button in
SeasonScreen's new topbar.

## 8. New-tournament marker

Covered by item 2/3's `ensureSeason` change (the "New events on the calendar" info event) plus a
UI-only accent dot on the Season tab (App.vue): `lastSeenSeasonWeek` is mirrored into a **reactive
ref** (seeded from `localStorage` on mount) rather than read raw inside the dot's `computed` –
localStorage reads aren't a tracked Vue dependency, so a raw read left the dot stuck showing until
some unrelated snapshot change forced a re-evaluation (caught live, fixed before commit). Visiting
the Season tab updates both the ref and `localStorage`.

## 9. Week recap card (light)

New `src/components/WeekRecapCard.vue`, shown on Home above News whenever the just-resolved week
carries no tournament event and no reveal is pending; dismissal is keyed by week number (a local
`dismissedRecapWeek` ref) so it reappears fresh next week with no extra state. Pure presentation
over the latest snapshot events – no engine change: 7 day-dots are a deterministic (no RNG) even
spread of `plan.train/rest` across 7 slots, the flavor line is literally that week's base-cost
expense event's own text (world.ts already picks one from `TRAIN_EVENTS`/`REST_EVENTS`), and
income/spend figures are summed straight from this week's events.

## 10. Onboarding coach-mark tour (light)

New `src/components/OnboardingTour.vue`: 4 plain absolutely-positioned tooltips (Home header →
Season tab → Kid tab → Next-week button), each pointing at a real element via a `data-tour="..."`
attribute already added to App.vue's template (so positioning tracks actual layout, not guessed
coordinates), with a CSS spotlight-highlight ring + "Skip tour" (always visible) + step dots.
Trigger: `stores/game.ts`'s `newCareer` snapshots `careers.length === 0` **before** creating the
career (`wasEmpty`) and sets a one-shot `firstEverCareer` store flag if so; App.vue's existing
snapshot-transition watcher consumes it exactly once (patches it back to `false` immediately,
regardless of outcome) and launches the tour only if a `localStorage` "seen" flag isn't already
set. `OnboardingWizard.vue` itself is untouched, as directed.

## Gates

`npx vue-tsc -b` clean. `npx vitest run` – 262 tests green (61 new: `tests/dates.test.ts` ×10,
`tests/season/calendar.test.ts` +4 off-season tests, `tests/seasonWrapUp.test.ts` ×10 new file).
`npm run build` clean. Live-verified at 375 px against a real `npm run preview -- --port 4410`
build (a second `.claude/launch.json` entry, `tb-r5-season-preview`, was added alongside the
existing `ties-break-preview` so this worktree previews on its own port without colliding with
sibling branches' preview servers):

- Dates: header pill title, Season calendar rows, This-week card, tournament splash/header all
  show real `weekRange` text, including live month-crossing ("Jan 27 – Feb 2, 2031") and
  year-crossing ("Dec 29, 2031 – Jan 4, 2032") formats.
- Off-season: advanced a fresh career to W49; wrap-up milestone + off-season info event fired with
  a correct, non-degenerate rank/points/best-result/W-L/funds line; Season calendar showed W50/W51
  as "Off-season" and W52 (new year) back to a normal "Training week".
- Tabs: Calendar/Standings sub-tabs both render their expected content.
- Full draw: entered and played a Local Open live; confirmed (and then fixed, see item 5) the
  winner-first display; verified across quarterfinal → semifinal → finale.
- Splash: shown once per tournament, correct art/tier/surface/draw/entrants/dates.
- Tour guide: "?" opens the full TIERS table + ITF note.
- Recap card: appeared after a plain training week with correct day-dots/flavor/figures.
- Coach-mark tour: ran end to end on a fresh career (Home → Season → Kid → Next-week), each step's
  highlight ring correctly tracked the real element; did not reappear after reload.
- Console clean throughout (checked repeatedly via `read_console_messages`).

## Spec conflicts / interpretation notes

- **Off-season week choice**: the spec says "weeks 50–52 of each season year"; taken as 1-indexed
  (week 1..52 of the year), which maps to 0-indexed absolute offsets 49/50/51 – the last 3 weeks of
  every 52-week year block. This also happens to line up naturally with the real-dates epoch as the
  real-world Dec 15 → Jan 4 school break, which reads as intentional rather than coincidental.
- **Wrap-up data source**: the spec explicitly hints "data you can compute from results/events", so
  no new `WorldState` fields / no `SAVE_SCHEMA_VERSION` bump were added for season stats – only one
  new **optional** field on the existing `WorldEvent` (`finishIdx`), which needs no migration.
  Funds delta is therefore a best-effort sum over the events ledger (capped at 400 non-kept events
  total across the whole career) rather than an exact audit trail; acceptable since MoneyScreen's
  ledger remains the authoritative source and this is explicitly a flavor milestone.
- **Full draw scores for AI-vs-AI matches**: "every match, short names, scores" – AI-vs-AI matches
  never run the full point engine (single closed-form probability draw, per the existing tournament
  engine), so they have no simulated scoreline. Shown as winner/loser names only, no score.
- **New-tournament marker on career creation**: suppressed on a brand-new career's very first
  generated calendar block (nothing "new" to a player who has never played) even though the literal
  instruction ("when ensureSeason generates a new future block, emit…") doesn't carve out this
  exception explicitly; done to avoid breaking the existing v5→v6 migration test's exact
  `infoTexts` assertion, and because the notification's product intent (new pain-free -
  content-appeared-since-last-look) doesn't apply to a game that has never been looked at yet.
