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

⚠ **Nothing here re-words a string shipped before this fix.** Every row of §1–§3 is a sentence that
did not exist before it; not one pre-fix sentence moved. Where a fix makes an EXISTING engine sentence
appear on a new surface (E-04's tier chip, W4) that is a row about a SURFACE and not about words –
§4 is that block, it landed 27.09, and it carries its own status spelling and its own count in the
pin. Its rows are **not DRAFTs**: there is no new copy in them to approve, and what he is being asked
to read is where words he already owns now appear.

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

## 4. Engine sentences reaching a new surface (W4 · T4.13 · E-04, ruling 6a)

Five surfaces, and **not one new word**: the tier chip stops composing its own refusals and prints the
ones `src/engine/world/medical.ts` and `src/engine/world/entryCaps.ts` already wrote. Ruling 6a is the
authorisation – «the tier chip prints the engine's `refusal.detail` for the aged-out and capped arms» –
so what is tabled here is not copy to approve but PLACES to check: each row is one engine sentence and
the surface it now reaches. The status cell says exactly that, and it is deliberately not a draft status.

⚠ **This section writes no status cell in backticks except its own**, and the reason is a red this very
section produced: the DRAFT count is enforced as «how many times the document says the draft status
inside backticks», so one backticked mention in §4's prose made the DRAFT pin read 6 where the corpus
holds 5. The seam between the two corpora is a real edge, the pin found it in one run, and the second
block now guards it from the other side as well.

⚠ **THE ROWS ARE TABLED IN THE ENGINE'S OWN SPELLING, interpolations and all**, for PF4's reason one
section up: the pin is containment against the home file, so a row that quotes a shape the code does
not hold is a row that cannot be checked. What each one READS LIKE is illustrated below the table, and
those illustrations are **not** the pinned form – the rendered sentences are asserted against a built
career in `tests/principles-e04-tier-cap-refusal.test.ts` and on the strip in
`tests/component/principles-w4-tier-cap-chip.test.ts`, which is where a rendered claim belongs.

⚠ **WHAT WENT AWAY, so his pass has both halves.** Four screen-composed sentences stop being printed
(they survive in `composables/tierState.ts` as the fallback for a caller with no world to ask, and in
the wave's report verbatim). Both cap sentences get SHORTER and lose the explicit «Not locked:»
framing; the reassurance itself survives in the engine's «A fresh allowance on her next birthday». If
he wants «Not locked» back, that is a change to the ENGINE's sentence – these rows' homes – and not a
revert of the fix.

⚠ **The chip's SHORT labels did not move and are not rows here.** «Year limit – N of M» and «Tour age
rule – N of M» are the owner's existing spellings, `SeasonScreen.vue` picks between the same two on the
same predicate, and the counts inside them come off the engine's own `entryCap`. The sub-capped chip in
ES5 wears the second of them with the sub-cap's numbers – an existing label over a new allowance, never
a new label. `tests/principles-e04-tier-cap-refusal.test.ts` pins both spellings, on a posed rung and
on a built career.

| id | home | text | surface | status |
| --- | --- | --- | --- | --- |
| ES1 | `src/engine/world/medical.ts` | ${tier.label} is under-${tier.maxAgeYears! + 1} – at ${kidAgeAt(world, event.week)} she has aged out. | the aged-out tier chip's TOOLTIP, where the screen composed «…aged out of it.» | `engine sentence, new surface` |
| ES2 | `src/engine/world/medical.ts` | ${tier.label} is under-${tier.maxAgeYears! + 1} – at ${kidAgeAt(world, event.week)} she has aged out. | the same chip's ACCESSIBLE NAME, spoken as «J30: locked – …» | `engine sentence, new surface` |
| ES3 | `src/engine/world/medical.ts` | Year limit reached – ${cap.used} of ${cap.limit} international events at ${ageYears}. A fresh allowance on her next birthday. | the ITF-year-capped tier chip's TOOLTIP | `engine sentence, new surface` |
| ES4 | `src/engine/world/medical.ts` | Tour age rule – ${cap.used} of ${cap.limit} pro entries at ${ageYears}. A fresh allowance on her next birthday; the junior and national events stay open. | the pro-age-year-capped tier chip's TOOLTIP | `engine sentence, new surface` |
| ES5 | `src/engine/world/entryCaps.ts` | Tour age rule – at ${ageYears} only ${usage.limit} of her professional entries may be at ${TIERS[fromTier].label} or above, and she has used ${usage.used}. The smaller rungs stay open. | ⚠ LATENT – the sub-capped rung's chip, which had no cap chip at all | `engine sentence, new surface` |

**What they read like**, on the fixtures the wave measured (illustrations, pinned elsewhere – see above):

* ES1 / ES2 – `Junior Tour 30 is under-19 – at 26 she has aged out.` The screen's own line was
  `Junior Tour 30 is under-19 – at 26 she has aged out of it.` – three characters, and the engine was
  already saying it beside the screen.
* ES3 – `Year limit reached – 14 of 14 international events at 15. A fresh allowance on her next
  birthday.` The screen's own line was `Junior Tour 30 – she has used all 14 of her international
  events for this year (age 15). Not locked: a fresh allowance arrives on her next birthday.`
* ES4 – `Tour age rule – 12 of 12 pro entries at 16. A fresh allowance on her next birthday; the
  junior and national events stay open.` The screen's own line was `World Tour 15 – the tour's age rule
  allows 12 pro entries at 16 and she has used all 12. Not locked: a fresh allowance arrives on her next
  birthday, and the junior and national events stay open.`
* ES5 – `Tour age rule – at 14 only 3 of her professional entries may be at World Tour 75 or above, and
  she has used 3. The smaller rungs stay open.` Nothing stood here before: the rung read `unlocked` and
  the strip offered «Enter your first!» over a rung `enterEvent` refuses.

⚠⚠ **ES5 IS LATENT AT THE SHIPPED CONSTANTS AND THE ROW SAYS SO, because a row he cannot reach in a
playtest is a row that would waste his pass.** The WTA sub-cap can bind – the age-grid ruling of 16.08
put `w75.minAgeYears` at 14 – and it does not: what holds the count at zero is `w75.acceptsRank`, which
a fourteen-year-old cannot satisfy because she holds no professional ranking yet. Measured in
`world/entryCaps.ts`: **mean 0.0 W75-or-above entries at fourteen over n = 90 careers, 676 weeks**
(the frozen battery of `college-is-its-own-branch-2026-08.md` §3). The rule ships anyway, by its own
note, «so that a phase which opens a rung lower does not have to remember it» – and the chip was the
surface that had to remember. So ES5 is a DIAGNOSTIC: read it as the sentence that will appear the day
a rung opens lower, not as copy on a screen today. The wave poses it rather than walking to it, and
says so at the fixture.

⚠ **ES1 and ES2 carry ONE sentence and are two rows on purpose.** The tooltip and the accessible name
are two surfaces that can hold two different sentences – `parity-plaque-national.test.ts` §3 records a
repair that reached only the tooltip and left the other one holding a claim nobody had checked – so the
corpus names both. `aria-label` REPLACES a chip's content under accname, which is why the second one is
not a duplicate of the first.

⚠ **A finding this section turned up and did not fix:** the aged-out sentence is spelled TWICE in
`world/medical.ts` – `entryVerdict`'s own arm (ES1/ES2's home, the one a rung's card gets) and
`availabilityStatus`'s age arm, differing only in how they read her age. They agree today, and one of
them should not exist; it is E-06's class inside a single engine file. It is named in the wave's report
for the architect rather than merged here, because merging it is not what ruling 6a asked for.
