---
type: plan
status: current
area: project-review
canonical: false
last-reviewed: 2026-09-27
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

## 3. The window the header had never named (W4 · T4.11 · E-01, ruling 4a)

`src/components/screens/SeasonScreen.vue` – the Season Planner's pro-budget line (`proBudgetLine`)
and the long form on the same element (`:title`). ⚠ **These two are the one place in this fix where a
DRAFT stands where a shipped sentence used to**, and they are here by the owner's ruling 4a rather
than by a builder's judgement: the line said «Pro entries this season» and its title «A fresh
allowance arrives when the season turns», while the NUMBER beside them has been
`proEntryCapUsage` – counted from one birthday to the next – since 16.08. Measured on the `v46`
golden save (week 155): the header read «6 of 12» where the engine's count does not fall at the
season turn and empties only on her birthday 24 weeks later. The old text is in this file's git
history and in [05-ui.md](../review-principles-2026-09-26/05-ui.md) E-01.

⚠ **The phrase is not new to the screen** – «counted from birthday to birthday» is what the event
cards' own allowance pills have said since `53223b3d`, twenty minutes after the engine moved. Ruling
4a is that the header reuses it, so the fix introduces a window word the player has already met on
the same screen rather than a second way of saying it.

⚠ PF5 says «junior and national events are not counted» because that is what the sentence it
replaces said, and it remains true of the ledger: `proEntryWeeks` is written by the professional
rungs alone. The engine's own refusal says the same fact the other way round – «the junior and
national events stay open» (`world/medical.ts`) – and neither is a re-wording of the other: one is a
budget line explaining what it counts, the other a refusal promising what is left.

| id | home | text | status |
| --- | --- | --- | --- |
| PF4 | `src/components/screens/SeasonScreen.vue` | Pro entries, birthday to birthday: ${cap.used} of ${cap.limit} | `DRAFT` |
| PF5 | `src/components/screens/SeasonScreen.vue` | The tour's age rule limits how many professional (W) events she may enter in the year she is this age – counted from birthday to birthday. A fresh allowance arrives on her next birthday; junior and national events are not counted. | `DRAFT` |

⚠ PF4 is tabled in the source's own spelling, `${cap.used}` and not `${used}`, for the reason wave
12's `${who}` rows are: the pin is containment against the file, so a row that quotes a shape the
code does not hold is a row that cannot be checked. PF5 is tabled in its RUNTIME spelling – the
template escapes the apostrophe in «tour's» – and the roundtrip pin's escaped fallback is what
crosses that gap.

⚠ **Not in this table, deliberately:** the two **comments** T4.11 corrected in the same file – the
`proBudgetLine` header note and `lockLabel`'s «the block lifts when the season turns» at the
`capped` arm. Both are code comments, both are named in the wave's report, and neither reaches a
screen. ⚠ And the LABELS on that arm – «Year limit» and «Tour age rule» – did **not** move: neither
of them names a date, so neither was stale.
