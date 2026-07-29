# Golden saves corpus

One world-shaped JSON payload per historical save schema: `v0.json` … `v{SAVE_SCHEMA_VERSION}.json`.

**Backward compatibility is a hard product guarantee.** A player who last opened the game on any
past version must be able to load their career after an update. `tests/goldenSaves.test.ts` runs
every fixture here through `migrateSave` and asserts it upgrades cleanly to the current schema.

## The rule (enforced by the test)

- There must be exactly one fixture for **every** version from `v0` to the current
  `SAVE_SCHEMA_VERSION` (from `src/engine/world.ts`).
- Bumping `SAVE_SCHEMA_VERSION` therefore **fails the suite until a new `vN.json` is added** — the
  guard forces you to capture a representative save of the shape you just froze.

## How each fixture was reconstructed

Shapes come straight from the append-only history in `src/engine/migrations.ts`:

| file | shape (delta vs the version before) |
| ---- | ----------------------------------- |
| v0 | pre-release dev save: no `schemaVersion`, no `fundsCents`, flat `log` strings |
| v1 | `+schemaVersion +fundsCents +log` |
| v2 | `+profile` (no `playStyle`) |
| v3 | profile `+playStyle` |
| v4 | `+plan` (weekly time split) |
| v5 | `+careerId` (career profiles) |
| v6 | living world: `+cohort +results +season +entries +events +nextEventId +kidRank`, `log` dropped |
| v7 | profile `+kidLastName`, world `+prevKidRank` |
| v8 | world `+pendingTournament` (tournament-reveal flow; `null` when no reveal is in progress) |
| v9 | profile `+birthMonth` (1-12; relative-age-effect groundwork, round-3 QA item 16 / round-6) |
| v10 | world `+bestFinishByTier +lastSeasonSummary +seasonWins +seasonLosses` (Home season strip + SeasonSummaryDialog) |
| v11 | world `+financeWeeks` (per-week/per-category finance ledger; feeds the Money breakdown past the 60-event cap) |
| v12 | world `+condition +injury +injuryHistory +physioActive` (Season-Life availability gate; injury/physio wired for Slice C, condition drives the fatigue caution) |
| v13 | world `+vacations +practices +recoveryBuff` (season planner: booked family-vacation weeks, booked practice-match weeks, and the carry-over injury-tau buff from a resort/elite package) |
| v14 | world `+seasonHistory` (R10-9: append-only per-season record – year, end rank, points, W-L, funds delta, closing funds, best finish – behind the Stats season-by-season table; `lastSeasonSummary` is overwritten yearly, this list is not) |
| v15 | world `+internationalEntryWeeks` (the ITF annual entry cap: the absolute week of every j30/j60/j300 entry she has made, counted per season against `ECONOMY.entryCap.perYearByAge`. Pre-v15 saves backfill to an empty ledger – nothing in them can reconstruct it, since the kid's result row is award-only) |
| v17 | world `+seasonStartRank` (R12-S1: her dense rank as she ENTERED the season in progress, captured at the tick into the season's first week. It is not derivable at wrap-up time – the 52-week prune has removed every result behind it by then, which is how the wrap-up came to replay an almost-empty table, tie the whole field on 0 points and report "from #1". Pre-v17 saves backfill to `null`, the "not recorded" value `SeasonSummary.startRank` has always allowed, and capture a real one from the next season boundary) |
| v16 | `seasonHistory` rows `year` → `+seasonIndex` (a season's identity is its 0-based index, never the calendar year of its first Monday – a season is 364 days, so that year repeats at season 5 and the wrap-up's dedup guard silently dropped a whole season's row). The backfill is an exact inversion: the old guard kept the first season to claim a year, so the smallest index yielding it is the one that wrote it) |
| v18 | world `+milestones` (Diary-1 D10: the durable milestone ledger behind the Memory card – first title/final per tier, first international entry, first injury, each season's closing rank, captured at the moment they happen. Pre-v18 saves backfill from surviving evidence: tournament events + the kept `first-title` event + kid result rows for titles/finals, `injuryHistory` for the first injury (onset = week − weeksOut), `seasonHistory` for season ranks, and the earliest surviving j30+ trace for the first international. Earliest evidence wins per identity; history already pruned away is honestly unrecoverable, so a backfilled "first" is the earliest surviving one) |

| v19 | world `+skills +potential` (Phase 4 development: her build stops being re-derived from `seed:kid` on demand and becomes state that moves, under a ceiling rolled once from `seed:potential`. Pre-v19 saves backfill from that same derivation, so a migrated career is byte-identical at the moment it loads and simply starts developing from there) |
| v20 | cohort rows `+ageYears +potential` (the field gets an age and a ceiling – it used to grow ~1.5 a year for ever, so no career could catch it. Backfilled deterministically from the player's seed, with each rival's ceiling measured from where the old unbounded drift left them, so a long-running save keeps the players it earned) |
| v21 | world `+academy` (the academy scholarship: `{level, sinceWeek, seasonIndex, coveredCents}` or `null`. Pre-v21 saves backfill to `null` rather than replaying the reviews they never had – a replay would have to invent the offer, the renewals and the kit grants, or hand her a scholarship she was never told about. The next season boundary reviews her on the year she just played and makes a real offer) |

For **v0–v5** the migration regenerates the world systems (cohort/season) deterministically from the
seed, so those fixtures are the authentic minimal historical shapes. For **v6–v7** the `cohort` /
`season` / `events` arrays are trimmed to a couple of representative entries (the migration never
regenerates a v6+ world, so their contents are exercised as *shape*, not size) to keep the fixtures
readable.

When you add a new fixture, keep it small but structurally faithful to that exact schema version.
