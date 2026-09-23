---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-23
---

# Wave 10 – the strings table (the dynasty)

Every player-facing string the wave added, for his pass (invariant 4): id · home · the string ·
status. Assembled by the architect on 23.09 from the builder's report and the shipped source on
`main` after PR #153/#154. ⚠ The provenance check is plain `grep DRAFT` on this file (wave 8's F2
ruling), and the whole table is pinned to the source character for character by
`tests/wave1011-strings-roundtrip.test.ts` – the TABLE and the TEST own the count, this prose
deliberately states none (the wave-9 lesson). A `#` in the home column means the pin compares the
LIVE exported value; a bare path means the pin holds the string against that file's source.

Strings with `${…}` inside are template literals quoted exactly as the code spells them – the
words around the substitution are what the pass reviews.

## 1. The door on the ending screen

Two labels on the one continue control – lived career and epilogue variants.

| id | home | text | status |
| --- | --- | --- | --- |
| D1 | `src/components/EndingScreen.vue` | Raise her daughter | `DRAFT` |
| D2 | `src/components/EndingScreen.vue` | A daughter came later | `DRAFT` |

## 2. The identity card and the wizard (`DYNASTY_COPY`)

Declared once, read by the prologue's age-5 card and the wizard's skip branch. `lineNote` shipped
inside `ChildhoodPrologue.vue` with T4 and MOVED here byte-identical when the wizard became its
second reader – one row, not two.

| id | home | text | status |
| --- | --- | --- | --- |
| D3 | `src/composables/identityCopy.ts#DYNASTY_COPY.lineNote` | She is born into her mother's family and carries her name. | `DRAFT` |
| D4 | `src/composables/identityCopy.ts#DYNASTY_COPY.birthdayNote` | Her birthday is a matter of record. | `DRAFT` |
| D5 | `src/composables/identityCopy.ts#DYNASTY_COPY.birthdayChoice` | More than one daughter grew up here. Whose story is this? | `DRAFT` |
| D6 | `src/composables/identityCopy.ts#DYNASTY_COPY.familyNote` | The means she starts with are her mother's story, not a choice. | `DRAFT` |

## 3. The booth lineage lines

Two when the mother's cabinet licenses the claim (`proTitles > 0`), two when only her being known
does. `${who}` is the daughter's name.

| id | home | text | status |
| --- | --- | --- | --- |
| D7 | `src/viz/commentary.ts` | The name on the board has been on it before. ${who} is her mother's daughter, and her mother won here. | `DRAFT` |
| D8 | `src/viz/commentary.ts` | ${who} grew up in these corridors. The trophies with that name on them are her mother's. | `DRAFT` |
| D9 | `src/viz/commentary.ts` | That surname used to be on the entry lists. ${who} is the second of them to play this stage. | `DRAFT` |
| D10 | `src/viz/commentary.ts` | ${who} is not the first in her family to walk out here. Her mother did it first. | `DRAFT` |

## 4. The heirloom page (album A34)

Four voices, notes in her mother's hand: note · caption · line per voice.

| id | home | text | status |
| --- | --- | --- | --- |
| D11 | `src/engine/world/albumCorpus.ts` | I kept a box of it. You found it before I could show you, and you wanted to wear all of it at once. | `DRAFT` |
| D12 | `src/engine/world/albumCorpus.ts` | She tried everything on. | `DRAFT` |
| D13 | `src/engine/world/albumCorpus.ts` | She found the box first. | `DRAFT` |
| D14 | `src/engine/world/albumCorpus.ts` | I kept a box of it. You went through the whole thing and then asked me which ones I lost. | `DRAFT` |
| D15 | `src/engine/world/albumCorpus.ts` | She asked about the losses. | `DRAFT` |
| D16 | `src/engine/world/albumCorpus.ts` | She wanted the whole record. | `DRAFT` |
| D17 | `src/engine/world/albumCorpus.ts` | I kept a box of it. You looked at every single thing and put it all back exactly as it was. | `DRAFT` |
| D18 | `src/engine/world/albumCorpus.ts` | She put it all back. | `DRAFT` |
| D19 | `src/engine/world/albumCorpus.ts` | She looked at all of it. | `DRAFT` |
| D20 | `src/engine/world/albumCorpus.ts` | I kept a box of it. You sat with it a long time, and then you asked what the last one had felt like. | `DRAFT` |
| D21 | `src/engine/world/albumCorpus.ts` | She asked how it felt. | `DRAFT` |
| D22 | `src/engine/world/albumCorpus.ts` | She asked about the last one. | `DRAFT` |

## 5. The album book's lineage checklist

The mother's card in the book – label templates around her numbers.

| id | home | text | status |
| --- | --- | --- | --- |
| D23 | `src/engine/world/albumBook.ts` | Best ranking: #${career.bestRank} | `DRAFT` |
| D24 | `src/engine/world/albumBook.ts` | Titles: ${career.titles} | `DRAFT` |
| D25 | `src/engine/world/albumBook.ts` | Slams: ${career.slams} | `DRAFT` |
| D26 | `src/engine/world/albumBook.ts` | Generation ${record.generation} | `DRAFT` |

## 6. The eight strokes (the mother in the new career)

Fridge-pool lines licensed off the handover's facts, two per stroke kind (private / open).

| id | home | text | status |
| --- | --- | --- | --- |
| D27 | `src/engine/diary/weekNotes.ts` | She still strings her own rackets, on the kitchen floor, for an hour. | `DRAFT` |
| D28 | `src/engine/diary/weekNotes.ts` | She was up before the house again, walking her old pre-match loop. | `DRAFT` |
| D29 | `src/engine/diary/weekNotes.ts` | She watched one service game and said the ball toss had moved. | `DRAFT` |
| D30 | `src/engine/diary/weekNotes.ts` | She said nothing all session, then re-taped a grip out by the car. | `DRAFT` |
| D31 | `src/engine/diary/weekNotes.ts` | She stood up off the bench too fast and put a hand on the fence. | `DRAFT` |
| D32 | `src/engine/diary/weekNotes.ts` | She told the club which season it went, and that she played on anyway. | `DRAFT` |
| D33 | `src/engine/diary/weekNotes.ts` | Two parents asked her to sign something. She signed and said nothing. | `DRAFT` |
| D34 | `src/engine/diary/weekNotes.ts` | The coach used her whole name, and the court went quiet, then loud. | `DRAFT` |
