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
| she won normally | `{stage}: {kidShort} beat {oppShort} {score}` | `{stage}: {kidShort} – {oppShort}; победа нашей героини {score}` |
| she lost normally | `{stage}: {kidShort} lost to {oppShort} {score}` | `{stage}: {kidShort} – {oppShort}; поражение нашей героини {score}` |
| she retired | `{stage}: {kidShort} retired against {oppShort} {score}` | `{stage}: {kidShort} – {oppShort}; наша героиня снялась из-за травмы {score}` |
| opponent retired | `{stage}: {kidShort} beat a retiring {oppShort} {score}` | `{stage}: {kidShort} – {oppShort}; соперница снялась из-за травмы, победа нашей героини {score}` |

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
| world-news event | `🩹 {rivalName} retired hurt at the {tier}{when}.` | `🩹 {rivalName} снялась из-за травмы на турнире «{tier}»{когда}.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| her lower-tier match | `🩹 {rivalName} retired hurt against {kidShort}{when}.` | `🩹 В матче {kidShort} – {rivalName} соперница снялась из-за травмы{когда}.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| completed set | ` – she went off after the {ordinal} set` | ` – после {ordinal-gen} сета` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| incomplete set | ` – she went off in the {ordinal} set` | ` – в {ordinal-prep} сете` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| set unknown | empty suffix | `empty suffix` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

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

## ⚙ 11.10 agent-authored (бланкет) – the opponent's retirement row, as six whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

§2 above drafted the row as a stem over a `{when}` suffix and parked its pieces as `QUESTION`; the code spells **six whole sentences** (at a rung the world reports on / in her own match × no set to name / after a completed set / inside a set), and the set is the English ordinal (`first` … `fifth`) in a hole. The rows are the draft re-cut to that shape, `снялась из-за травмы` and `на турнире «{tier}»` kept. `DRAFT`, his live edit follows.

**Where a row leaves §2's mould.** (1) `В матче {kidShort} – {rivalName} соперница снялась` became `Соперница по матчу – {1}`: the retiree is `{0}` and the heroine `{1}`, and a nominative after a dash reads straight in either order. (2) The set clause is built round the accusative of the ordinal (`доиграв {2} сет` / `не доиграв {2} сет`), which for a masculine inanimate noun is the nominative form – the one form the code can hand in; §2's genitive and prepositional pair would need two arguments it does not carry. «Went off after the set» is `доиграв … сет`, «in the set» is `не доиграв … сет`: the same two facts. **Seam that is code, not translation:** `SET_ORDINAL` hands the English word in, so a Russian row prints `доиграв first сет`.

### The six sentences

| id | English | Russian |
| --- | --- | --- |
| RU21-MNW-01 | `🩹 {0} retired hurt at the {1}.` | `🩹 {0} снялась из-за травмы на турнире «{1}».` |
| RU21-MNW-02 | `🩹 {0} retired hurt at the {1} – she went off after the {2} set.` | `🩹 {0} снялась из-за травмы на турнире «{1}», доиграв {2} сет.` |
| RU21-MNW-03 | `🩹 {0} retired hurt at the {1} – she went off in the {2} set.` | `🩹 {0} снялась из-за травмы на турнире «{1}», не доиграв {2} сет.` |
| RU21-MNW-04 | `🩹 {0} retired hurt against {1}.` | `🩹 {0} снялась из-за травмы. Соперница по матчу – {1}.` |
| RU21-MNW-05 | `🩹 {0} retired hurt against {1} – she went off after the {2} set.` | `🩹 {0} снялась из-за травмы, доиграв {2} сет. Соперница по матчу – {1}.` |
| RU21-MNW-06 | `🩹 {0} retired hurt against {1} – she went off in the {2} set.` | `🩹 {0} снялась из-за травмы, не доиграв {2} сет. Соперница по матчу – {1}.` |
