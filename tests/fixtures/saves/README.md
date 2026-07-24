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

For **v0–v5** the migration regenerates the world systems (cohort/season) deterministically from the
seed, so those fixtures are the authentic minimal historical shapes. For **v6–v7** the `cohort` /
`season` / `events` arrays are trimmed to a couple of representative entries (the migration never
regenerates a v6+ world, so their contents are exercised as *shape*, not size) to keep the fixtures
readable.

When you add a new fixture, keep it small but structurally faithful to that exact schema version.
