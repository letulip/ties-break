---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11C – Match results and retirement news in the feed

Source: `src/engine/world/matchNews.ts`. This is not the live point-by-point commentary in
RU-08. It is the durable result sentence and the occasional opponent-retirement news row.
The code's `SeasonScreen` bracket plaque recognises a result by its **score at the end of the
string**. A Russian formatter must preserve that contract until the technical wave explicitly
changes the plaque reader and its tests. All wording below is `DRAFT`.

## 1. Her match result

English assembles `{stage}: {kidShort} {verb} {oppShort} {score}` with four verbs. Russian cannot
insert an arbitrary saved name after `обыграла`, `проиграла` or `против` without declension.
Keep both names in a nominative match-up and use a result clause. `stage` and the score come
from the same match record as English.

| result | English verb/template | Russian draft |
| --- | --- | --- |
| she won normally | `{stage}: {kidShort} beat {oppShort} {score}` | `{этап}: {kidShort} — {oppShort}; победа нашей героини {score}` |
| she lost normally | `{stage}: {kidShort} lost to {oppShort} {score}` | `{этап}: {kidShort} — {oppShort}; поражение нашей героини {score}` |
| she retired | `{stage}: {kidShort} retired against {oppShort} {score}` | `{этап}: {kidShort} — {oppShort}; наша героиня снялась из-за травмы {score}` |
| opponent retired | `{stage}: {kidShort} beat a retiring {oppShort} {score}` | `{этап}: {kidShort} — {oppShort}; соперница снялась из-за травмы, победа нашей героини {score}` |

The repeated `нашей героини` is deliberate clarity in a string with two proper names; it
avoids the false implication that a retirement win counts less than any other win. The score
stays the final token, with no localized `ret.` or punctuation after it. When the score is
absent, trim the trailing space as the English builder does. Result records and winner IDs
remain untouched.

## 2. Opponent retirement reported separately

At W100 and higher, this is tour news and names the event. Lower down it is a line about her
own match. The opponent, never the daughter, is the person who retired in this function.

| branch | English source | Russian draft |
| --- | --- | --- |
| world-news event | `🩹 {rivalName} retired hurt at the {tier}{when}.` | `🩹 {rivalName} снялась из-за травмы на турнире «{tier}»{когда}.` |
| her lower-tier match | `🩹 {rivalName} retired hurt against {kidShort}{when}.` | `🩹 В матче {kidShort} — {rivalName} соперница снялась из-за травмы{когда}.` |
| completed set | ` – she went off after the {ordinal} set` | ` — после {ordinal-gen} сета` |
| incomplete set | ` – she went off in the {ordinal} set` | ` — в {ordinal-prep} сете` |
| set unknown | empty suffix | empty suffix |

| set index | after: genitive | in: prepositional |
| ---: | --- | --- |
| 1 | `первого` | `первом` |
| 2 | `второго` | `втором` |
| 3 | `третьего` | `третьем` |
| 4 | `четвёртого` | `четвёртом` |
| 5 | `пятого` | `пятом` |

The set ordinal needs **two** Russian cases; a single translated `SET_ORDINAL` array would be
insufficient. Event names use the locale's existing tournament labels and quotes so arbitrary
labels are not declined. The retirement row is not added when there was no retirement or when
the daughter herself retired; those gates stay in the engine, not in translation.
