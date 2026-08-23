---
type: review
status: audit
area: context-efficiency
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Token and context optimization

## Verdict

The repository has good retrieval ideas: a small context index, area packs, quiet runners, a
generated world-symbol map, narrow search guidance and warning-only source budgets. The problem is
not lack of a knowledge system. It is that current-truth documents still rot, high-context hubs keep
growing, and source pins/comments make ordinary changes retrieve both executable behaviour and its
historical scaffolding.

An external note system such as Obsidian would improve browsing, not correctness. Markdown is
already the right substrate. The direct optimization is to make the repository's **canonical route
small, mechanically fresh where possible, and connected to narrower code owners**.

## Current context cost

`context:audit --json` reports:

- 265 Markdown inputs, 76,489 lines, about 1,297,406 estimated tokens;
- 127 of 263 docs governed, 136 unclassified;
- `docs/decisions.md` at about 44,806 tokens;
- 42 of 189 production TS/Vue files above a review trigger;
- zero source-size exceptions with a written `size-budget:` reason.

The largest source comment volumes are approximately:

| File | Physical lines | Comment characters |
| --- | ---: | ---: |
| `src/shared/protocol.ts` | 3,961 | 228,831 |
| `src/engine/world.ts` | 4,270 | 221,352 |
| `src/engine/economy.ts` | 2,935 | 187,048 |
| `src/engine/season/calendar.ts` | 2,183 | 137,423 |
| `src/engine/migrations.ts` | 1,834 | 89,700 |
| `src/viz/commentary.ts` | 1,816 | 74,700 |

Tooling is also history-heavy: `vite.config.ts`, `scripts/units.mjs`,
`.github/workflows/simulation.yml` and `scripts/heavy-tests.mjs` are majority-comment by line, and
some opening counts/timings are already stale.

## What is already working

- `docs/context-index.md` and five small packs remain within explicit budgets.
- `tools/generated/world-symbol-map.md` answers ownership behind the compatibility barrel and is
  checked by CI.
- `rg`/symbol-first routes are more efficient than reading whole modules or Graphify natural
  language queries.
- Graphify is correctly limited to code and optional local orientation; docs are not fed through it.
- Quiet test runners save output without hiding failures.
- Source-size thresholds are review questions, not hard caps. That is the right policy.

## Findings and direct optimizations

### TOK-01 – P1 – Canonical routes are structurally valid but semantically stale

The current delivery page and save pack are wrong about round/schema; `CLAUDE.md` is omitted from
the audit despite being declared authoritative. A low-token route that confidently returns wrong
facts is worse than a longer honest search.

**Optimization:** mechanically source the few volatile facts that are cheap and exact:

- schema from `SAVE_SCHEMA_VERSION` / highest golden fixture;
- current round/wave from a small maintained manifest or required ledger row;
- supported test commands from `package.json`;
- generated owner map from source.

Use `last-reviewed` as a prompt, not proof. Add a wave-close checklist owner and an audit that fails
when required current ledgers/manifests disagree. Do not attempt semantic validation of all prose.

### TOK-02 – P1 – New documents can join legacy unclassified debt indefinitely

The audit reports 136 unclassified docs but does not prevent a new one. A wholesale metadata
migration would produce noisy, low-value edits.

**Optimization:** snapshot the legacy unclassified set and make it a one-way ratchet: a newly added
document needs metadata; an existing unclassified document needs metadata when materially edited.
Classify old files only when touched.

### TOK-03 – P1 – The decision archive lacks a compact current-decision interface

`docs/decisions.md` is valuable as an append-only historical record but costs about 44.8k tokens and
ends with at least one superseded ruling. Agents either over-read it or miss the current decision.

**Optimization:** freeze it as the stable archive and add a compact area → current decision ID/date/
status index. New bodies can live in dated shards or ADR-like files while old anchors remain valid.
Do not copy decision bodies into the index.

### TOK-04 – P1 – `world.ts` and `protocol.ts` refill the retrieval cone

The generated symbol map mitigates discovery, but it does not reduce the code/context needed to edit
weekly order or protocol DTOs. `world.ts` and protocol grew 680/494 lines since the previous review.

**Optimization order:**

1. Move engine-only `BirthdayGift` and `BIRTHDAY_DAY_NOUN` out of protocol; they do not cross the
   worker/UI boundary (`protocol.ts:917-957`).
2. Split diary/event/finance/profile/competition/ending DTOs behind a compatibility barrel.
3. Put commands, reply map and Snapshot in stable focused modules.
4. Move persisted state/type ownership to `world/state.ts` or `world/schema.ts` without changing the
   serialized shape.
5. Extract named weekly phases after characterization; keep invocation order in `tickWeek`.

Target cohesive modules in the rough 300–800 line range, not a numerical law.

### TOK-05 – P2 – The compatibility barrel is still the dominant discovery path

The repository command documented in `CLAUDE.md` now finds about 320 importers of `engine/world`
across source, tests and tools (49 production, 156 tests, 115 tools). The generated 269-symbol map is
current and useful, but new deep owners are still often reached through the facade.

**Optimization:** keep the barrel for compatibility, but require new engine code to import the
owning leaf when known. Screens/tests may keep the facade where it materially simplifies fixtures.
Track the count as information, not a red gate.

### TOK-06 – P2 – Source pins multiply the context required for refactoring

Behaviour-shaped pins require opening the implementation, helper, pin-hygiene meta-test and often a
mounted replacement. Literal NULs even made the cycle guard invisible to normal text tooling.

**Optimization:** one safe marker helper, a ratchet against new raw slices, and mounted-test migration
per touched feature. Retain static-policy pins. This lowers retrieval cost and false failures without
a risky big-bang rewrite.

### TOK-07 – P2 – Comment history needs selective compression, not deletion

Owner rulings and failure reasoning are intentional repository assets. The binding rule is to keep
them and correct statements false about current behaviour. Nevertheless, settled multi-page
chronologies in hot files make the current invariant hard to locate, and volatile counts in comments
rot quickly.

**Optimization:** when touching a hot block:

1. keep the current invariant;
2. keep the observed failure signature;
3. keep the owner decision and short rationale;
4. link the dated spec/decision for measurements and chronology;
5. remove or correct only statements false about current code.

No percentage target, automated comment purge or “one comment per function” rule.

### TOK-08 – P2 – App/screens contain multiple state owners

The highest-return UI splits are not template fragments. They are independent state machines:

- `useCareerWatermark` families and blocking-flow routing from App;
- the single playback/visibility clock and audio cues from MatchViewer;
- the day-cross timer from Calendar;
- planner/event-feed/sandbox boundaries from Season;
- college/staff panels from Home only if they continue changing independently.

Make leaf children prop/emit driven when touched; keep screens/App as store-aware composition roots.

### TOK-09 – P2 – Tools are difficult to distinguish from archival evidence

All 136 tools enter the primary TypeScript project, but only a subset has package commands. A reader
cannot cheaply distinguish supported benchmark, reproducibility instrument and scratch probe.

**Optimization:** a small generated or maintained tools registry and separate on-demand tools
typecheck. Do not delete measurement instruments solely to reduce file count.

### TOK-10 – P3 – CI emits and computes more than needed

Use the quiet unit wrapper in CI and avoid typechecking twice before Vite build. This is a direct log
token and runner-time reduction with no loss of signal.

## Recommended retrieval sequence after these changes

1. Read `AGENTS.md` and the relevant compact context pack.
2. Read the current-decision index only when intent/rationale is needed.
3. Resolve a symbol through `rg` or the generated world map.
4. Open the owning module/range and focused tests.
5. Broaden to the compatibility facade, decision archive or large spec only when a live question
   remains.

## Files that may legitimately remain large

- migrations: chronological compatibility;
- economy/calendar: explicit tuned catalogues plus pure deterministic rules;
- commentary/diary pools: editorial consistency;
- decision archive: historical record, provided a compact current index exists.

The optimization is a smaller **working set**, not a prettier file-size histogram.
