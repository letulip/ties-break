---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-23
---

# Response to the full-project review, round two (13-) – verdicts, plans, executors

The review (`docs/review-principles-2026-08-23/`, baseline `52a5f13`) is the strongest external
document this repo has received: it re-audited its own 18.08 findings honestly (the fix matrix
credits what stayed fixed and names what regressed), corrected its own earlier mistakes in writing
(weather was never dormant; big comments are not waste; large data files are not god objects), and
its two headline live defects were VERIFIED in code before a single verdict below was written:

- **R2-01 CONFIRMED**: `world/college.ts:136` books tuition with `type: 'income'` (amount negative –
  the sign is right, the type lies to every by-type reader).
- **R2-02 CONFIRMED in kind**: `InjuryStopDialog.vue` recovers domain facts from English prose –
  `startsWith('Entry refunded')` is a raw literal; the neighbouring `RELEASE_LINE_PREFIX` import is
  the mitigated half, and the file's own 05.08 «BLIND SINCE» comment records this exact defect class
  biting before.

## Verdicts, item by item

| item | verdict | reason in one line |
| --- | --- | --- |
| R2-01 tuition typing | **TAKE** (verified) | live P1, XS, no schema |
| R2-02 injury DTO | **TAKE** (verified) | the house's own «facts cross boundaries as types» |
| R2-03 two false guards | **TAKE, verify-first** | claims half-checked; the executor proves each guard false by mutation BEFORE fixing |
| R2-04 doc truth + ownership | **MODIFY** | half landed this week (ledgers 24–25, decisions catch-up, backlog rebuild – after the review's baseline); the REMAINING scope: volatile facts mechanically sourced (TOK-01), CLAUDE.md in the audit budget, a wave-close doc step added to the `pull-request` skill |
| R2-05 typed worker replies | **TAKE** | TB-06/PR-07 open since 18.08; the seam is ready |
| R2-06 engine→viz direction | **VERIFY-then-TAKE** | inventory first; guard after the facts |
| R2-07 accessible dialog shell | **TAKE, P1** | joins the standing 12-a11y-defect row; 375×667 law already ours |
| R2-08 watermark consolidation | **TAKE** | finishes an existing primitive's adoption |
| R2-09..12 decomposition programme | **TAKE as sequenced programme** | mirrors our own P4/pin-lifecycle direction; ⭐ synergies: `tools/frozen-key-diff.ts` IS R2-10's RNG-parity harness; `worldSource()` helpers seed R2-12's marker helper; TOK-02/03/05/09 fold into R2-12 |
| R2-13 multi-week advance | **TAKE, P1 product** | «dead presses» is real; every stop the command needs (STOP_PRECEDENCE, reveals, birthdays, fork) already exists and is tested |
| R2-14 reasonable-player arms | **TAKE-MODIFY** | DI2's his-cadence policy IS the reasonable-player corridor – standardise it into the bench suite rather than building anew |
| R2-15 college compact-vs-second-act | **SUPERSEDED** | the owner chose the second act by building it (shell, League, birthdays, departure); the championship-cost sub-question stays in the college backlog with our measured numbers |
| R2-16 one adult decision hers | **TAKE as the DESIGN for E1** | converges exactly with the fork-gap opinion surface; timing keeps the owner's standing pause (after private-life steps 1–2) |
| R2-17 minimum relationship | **SUPERSEDED** | the private-life build (spirit/bond, benches, safeguards) is this proposal grown up; their «no visible optimizer number» is already our diary-bands rule |
| R2-18 adult copy/stage predicates | **TAKE** | S–M editorial with licence tests by stage |
| Wave 5 hygiene list | **TAKE as Later** | folded into the-quality-rig |

## The plan, by OUR waves, with executors – awaiting the owner's approve before any launch

| волна | items | исполнители | размер |
| --- | --- | --- | --- |
| **A – правда и типы** | R2-01 + R2-03 · R2-02 · R2-04-остаток | агент A1 (01+03) · агент A2 (02, DTO+formatter) · архитектор (04) | S · M · S |
| **B – границы и доступность** | R2-05 · R2-07 + R2-18 · R2-08 · R2-06-verify | три агента параллельно, гейт серийный | M · M · S-M |
| **C – декомпозиция** | R2-09 → R2-12, по одному под-PR | по агенту на PR, после B; parity-харнесс = frozen-key-diff | L программа |
| **D – механики** | R2-13 (все стопы + MAIN-независимость) · R2-14 в бенч-стандарт | один осторожный агент M · при следующем замере | M |
| E1/R2-16 | дизайн принят; запуск – после шагов 1–2 личной жизни | – | его пауза стоит |

Stop/go гейты главы 07 приняты целиком (после A: правда без археологии; после B: клавиатура
проходит каждый необратимый диалог; каждый PR декомпозиции: parity фиксированных сидов).

## Also in this wave

The four orphan review documents are folded from their branches (both `review-principles` sets and
the 11- perspective), so after THIS wave merges, `codex/principles-review-2026-08-18`,
`codex/backlog-perspective-2026-08-23` and `age-clock-safety` become content-contained and
deletable; `codex/pitch-commercial-2026-08-17` is NOT folded – its edits rewrite shared docs from a
stale base and need the owner's separate call; `film/promo-clips` is live work and stays.
