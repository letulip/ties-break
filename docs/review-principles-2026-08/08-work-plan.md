---
type: plan
status: audit
area: process
canonical: false
last-reviewed: 2026-08-18
superseded-by: docs/review-principles-2026-08-23/07-proposals-and-roadmap.md
---

# The work plan – what was done, what is running, what is left, and what needs the owner

> **Historical ledger:** use the [23 August roadmap](../review-principles-2026-08-23/07-proposals-and-roadmap.md)
> for current sequencing. This page remains the audited record of the first review wave.

**Written 18.08.2026, after an independent audit of every item in this review against the code.**
The owner's instruction: «я как раз и просил сделать планы работ… и запустить по понятным и
неконфликтующим задачам».

⚠ **This page is a LEDGER, not a re-review.** Where it disagrees with the six chapters beside it, the
disagreement is stated with the evidence, because two of the review's own premises turned out to be
false and one of its findings was a stale comment read as current truth.

---

## 0. The count, honestly

| | done | partial | ruled, no action | untouched |
| --- | --- | --- | --- | --- |
| findings TB-01…TB-10 | 4 | 3 | 0 | 3 |
| proposals PR-01…PR-22 | 5 | 3 | 2 | 12 |
| **DRY consolidations (9)** | **0** | 0 | 0 | **9** |
| **dormant surface (7)** | **0** | 0 | 2 | **5** |
| **token/context (8)** | 1 | 2 | 0 | 5 |

⚠⚠ **AND THE DUPLICATION GREW WHILE THE REVIEW SAT UNREAD**, which is the number that should decide
the priority: `codeOf` 7 → 10 copies, `fnv1a` 5 → 6, `mountSeason` 3 → 4, the allocation comparator
2 → 3, `academyCoverPct` into a third screen. `world.ts` 3,589 → 3,607 lines, `protocol.ts`
3,466 → 3,487, and the `engine/world` facade's importers **111 → 279**.

---

## 1. Landed (wave/round22)

| item | where | note |
| --- | --- | --- |
| TB-01 tiebreak rotation | one definition in `engine/match/scoring.ts` | owner is `scoring.ts`, not a new module – it is the code that ENFORCES the rotation. Parity test is mutation-verified: the drift that leaves a fresh 0-0 tiebreak byte-identical reddens **only** the new test |
| TB-02 economy↔calendar cycle | `economy.ts` reads `WEEKS_IN_SEASON` from `shared/dates.ts` | the hard-coded `52` the TDZ crash forced is gone |
| TB-07 two more cycles | `season/names.ts` leaf; `kidLadderRank` moved to `world/ladder.ts` | ⭐ the `college → snapshot` back-edge alone held a component of **NINE** modules, not three. `tests/import-cycles.test.ts` is a real SCC detector, verified against a control tree |
| TB-03 context packs | five packs, `context-index.md`, `CLAUDE.md`, `README.md` | fourteen claims corrected against source. The structural half is NOT done – see §3 |
| TB-04 skip vs withdrawal | `world.ts` `skipEvent` | ⚠ **not a designed penalty** – both constants were 2 when written and the V2 flip parted them. Owner ruled it a fix: «она и в одном случае не играла и в другом» |
| TB-10 / PR-19 | narrowed by the owner | fix what is FALSE about behaviour; KEEP what records a decision |

---

## 2. Running now – three agents, disjoint paths

| bundle | files | items |
| --- | --- | --- |
| engine | `src/engine/**`, `src/shared/protocol.ts` | DRY-4 comparator ×3, DRY-7 rank assignment ×2, three dead exports, the dormant handoff fields marked |
| UI | `src/components/**`, `src/composables/**` | DRY-1 horizon ×3, DRY-5 flags ×5, DRY-3 card presentation, plus the two false comments |
| tooling | `vite.config.ts`, `scripts/**`, `.github/**`, `public/**` | the heavy-list two truths, `context:audit` into CI, seven unreachable frames |

---

## 3. Left, in the order I would take it

### 3a. Cheap and safe – XS/S, no owner call needed

1. **DRY-2, the career watermark** – seven hand-rolled copies of one localStorage semantic; `useWatermark` already exists in `composables/inboxCue.ts` and is not even exported. **S**
2. **DRY-6, the five-row match stat table** – `PracticeFlow.vue` vs `TournamentFlow.vue`, only `computeMatchStats` shared. **S**
3. **DRY-9, test helpers** – 32 local definitions, zero imports. ⚠ **owned by no proposal in this review** – it exists only in prose. **S**
4. **TOK-4, the barrel is compatibility, not discovery** – an area→owner symbol map. ⚠ **also owned by no proposal**, and it is the cheapest retrieval win here: **XS**, against 279 importers.
5. **YAGNI-2, the reserved `conduct` penalty** – no producer anywhere. **XS**
6. **PR-01 items 2/3/4** – `docs/now-next-later.md`; mark the August roadmaps superseded; resolve BOTH `-corrected` spec pairs, which are still `current` on both halves. **S**

### 3b. Needs a measurement, not a decision

7. **TOK-8 size budgets as warnings** – nothing records a trigger; every hub is over the suggested one and two grew. **XS to add, ongoing to honour.**
8. **TOK-7 generated navigation aids** – `docs/generated/` does not exist. **M**

### 3c. Needs the owner – scope, not correctness

9. **PR-12 protocol split** (3,487 lines, ~120 exports) – **L**
10. **PR-13 tick-phase extraction** – **L**, and the review is right that "the minimal design is not an event bus"
11. **PR-14/15 MatchViewer, Season, App extraction** – **L** each
12. **PR-09 per-tier entry verdict DTO** (TB-05) – **M–L**. ⭐ Three defects of exactly this class shipped and were fixed on 18.08 alone – wild cards, age gates, the bench pre-filter – each one *two sides asking different functions about one question*. That is the strongest argument in this document for doing it.
13. **PR-07 typed request/reply** (TB-06) – **M**; 20+ hand-written narrowings in `stores/game.ts`
14. **PR-08 engine↔viz direction** – **M**. ⚠ It is NOT a runtime cycle (`viz/types.ts` imports engine types type-only), so `import-cycles.test.ts` is correctly green and will never catch it. It needs its own architecture test.
15. **PR-16 / TB-09 source-pin policy** – 77 readers, 28 through `worldSource`. **Ongoing M–L**
16. **DRY-8 segmented styling** – ⚠ the comments say the copying is DELIBERATE. Needs a ruling before anyone touches it.

---

## 4. ⚠ Where this review was wrong, and it matters

**4a. The weather prop.** The review reports MatchViewer's temperature as "not wired… the tournament
flow cannot provide it". **It was wired end to end at the review's own baseline** – `TournamentFlow`
passes it, `PendingView` declares it, `world/snapshot.ts` fills it, and there is exactly ONE call
site, not two.

What is stale is the **prop's own comment**, which asserts all three false things. **The review read a
stale comment as current truth** – precisely the failure mode TB-10 describes, happening to TB-10's
own author. It is now the highest-value item on the narrowed PR-19 list.

**4b. TB-01's supporting premise is spent.** "The scoring test does not establish parity between the
two consumers" is no longer true.

**4c. Two more false comments, found here, not in the review.** `vite.config.ts` says a directory
holds 42 webp – it holds 64. `CLAUDE.md` still points at a July artifact as the live decomposition
plan.

**4d. And four of the review's own TB-10 examples are still false in code** – `playStyle` "Phase 4",
`birthMonth` "purely cosmetic", the cohort "(Phase-4 placeholder)", the Coach Market "a later slice".

---

## 5. Process gaps this audit found

1. **The review is unmerged and unledgered.** No `docs/rounds/round-22.md`; `decisions.md` gained one
   heading (the age clock) out of a whole wave.
2. ⚠ **The TB-04 owner ruling lived only in a commit message.** A decision of his may not live in the
   git log.
3. **The balance-work methodology in chapter 04** – distributions not anecdotes, median plus tails,
   corrections separated from tuning – was never adopted or rejected as a standing rule. It is not
   academic: TB-04 shipped without its bench arm, honestly declared, because **no tool in `tools/`
   calls `skipEvent`** and the arm would have been null.
