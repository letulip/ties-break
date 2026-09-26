---
type: plan
status: current
area: project-review
canonical: false
last-reviewed: 2026-09-26
---

# The principles fix – the strings table

Every player-facing string the principles fix adds, for his pass (invariant 4): id · home · the
string · status. The wave's plan
([principles-fix-builder-2026-09.md](principles-fix-builder-2026-09.md) §2, «Wording») is what
requires this file: every rendered string in the fix stays byte-identical except the ones tabled
here. The provenance check is mechanised by `tests/principles-fix-strings-roundtrip.test.ts`, which
pins every row to the source character for character AND pins the status cell – **the TABLE and the
TEST own the count, this prose deliberately states none** (wave 9's finding: a count written in prose
survives a full gate because no test reads it).

⚠ **Nothing here re-words a string shipped before this fix.** Every row is a sentence that did not
exist before it; not one pre-fix sentence moved. Where a fix makes an EXISTING engine sentence appear
on a new surface (E-04's tier chip, W4) that is a row about a surface and not about words, and it goes
in with its own «engine sentence, new surface» note when that wave lands.

⚠ **Not in this table, deliberately:** every comment corrected in this fix. `weekAction.ts`'s stale
«six / five», `prologueFundsCents`' clamp doc and the worker's «rides through untouched» note are code
comments, not copy – they are named in their waves' reports and they reach no screen.

## 1. The two handovers that cannot be read (W2 · T2.6 · A-05, ruling 8a)

`src/shared/protocol/profile.ts` – `PROLOGUE_HANDOVER_REFUSAL` and `DYNASTY_HANDOVER_REFUSAL`, each
rendered behind `new`'s existing shape as «New career: …». ⚠ Both are **diagnostics a player should
never see**: they are reachable only by a malformed `new` payload, which no shipped screen can build
(`tests/prologue-handover.test.ts` walks all 32 runs the card table can produce and every one passes
the check). So each says what could not be read and stops – no apology, no advice, and no field name
of a payload the player never typed. ⚠ One sentence per validator and not one per reason, for that
same reason: «which field» is not something a player can act on.

| id | home | text | status |
| --- | --- | --- | --- |
| PF1 | `src/shared/protocol/profile.ts` | The childhood cannot be read | `DRAFT` |
| PF2 | `src/shared/protocol/profile.ts` | The mother's story cannot be read | `DRAFT` |

⚠ PF2 says «the mother's story» because that is the phrase the shipped dynasty copy already uses for
the block (`DYNASTY_COPY.familyNote`: «The means she starts with are her mother's story, not a
choice.»), so the sentence introduces no new noun for a thing the player has already been told about.

## 2. An answer that was never on the card (W2 · T2.7 · #9)

`src/engine/world/constants.ts` – `UNKNOWN_CHOICE_REFUSAL`, thrown by `decideKnock`,
`answerShootClash` and `answerFork` when the choice is not one of their own list's. ⚠ ONE sentence
for all three commands: the three dialogs offer different answers and the refusal is the same fact
about all of them. ⚠ Like §1 it is unreachable from the shipped dialogs – every one of them sends an
id it read off the engine – so it exists for a stale screen and a hand-built command.

| id | home | text | status |
| --- | --- | --- | --- |
| PF3 | `src/engine/world/constants.ts` | That is not one of the choices offered. | `DRAFT` |

⚠ **`UNKNOWN_CHOICE_REFUSAL` IS DELIBERATELY NOT ON THE `engine/world` BARREL**, and the pin reads
`src/engine/world/constants.ts` directly because of it: a pin aimed at the barrel would be green today
and would rot silently the moment the name was re-exported or moved.
