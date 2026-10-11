---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11A – Milestones and season-wrap feed

This begins RU-11, the generated-news and durable-feed pass. Source is
`src/engine/world/milestones.ts`; Russian lines are `DRAFT`. The milestone key and typed capture
remain language-independent. In particular, old saved wrap-up text needs a locale-aware
renderer or a safe typed reconstruction, not a new English sentence appended to the old one.

## 1. One-off and off-season lines

| source | English | Russian draft |
| --- | --- | --- |
| school-end milestone | `Last bell. From Monday the mornings are hers.` | `Последний звонок. С понедельника утро принадлежит ей.` |
| coach travel opened | `Your coach can travel to tournaments with her now – the switch is in the coach room, and a trip with the coach costs one additional fare.` | `Теперь тренер может ездить с ней на турниры. Переключатель – в разделе тренера; в каждой такой поездке понадобится ещё один билет.` |
| off-season, school over | `Off-season: rest, family time, and the block where next year gets built.` | `Межсезонье: отдых, время с семьёй и работа над планом на следующий год.` |
| off-season, still at school | `Off-season: rest, school, family time.` | `Межсезонье: отдых, школа, время с семьёй.` |

`Понадобится ещё один билет` describes one additional fare, not a known price or an automatic
purchase. The school-ended line refers to the stage transition, not a particular Russian
school's bell schedule.

## 2. Season-wrap composition

The source assembles one sentence from a year, ranking track, rank movement, points, best
finish, W–L record and signed funds change. This must be a locale-specific formatter; translating
only its two full-sentence literals would leave `rank`, `pts`, `W-L`, and `funds` in English.

| source fragment / condition | English source | Russian draft |
| --- | --- | --- |
| `bestText` no scoring result, but played | `no result that scored` | `без зачётного результата` |
| `bestText` no matches | `no tournaments played` | `турниров не было` |
| rank movement improved | `(↑{N} vs season start)` | `(↑{N} мест с начала сезона)` |
| rank movement worsened | `(↓{N} vs season start)` | `(↓{N} мест с начала сезона)` |
| ranked | `{LADDER_LABEL} rank #{N}{movement}` | `{полное название рейтинга}: №{N}{движение}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| unranked | `Unranked – {LADDER_LABEL}` | `{полное название рейтинга}: без места` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| assembled wrap-up | `Season {year} wrap-up: {rankText} · {points} pts this season · {bestText} · {wins}-{losses} (W-L) · funds {signedFunds}` | `Итоги сезона {year}: {рейтинг} · {points} очков за сезон · {лучший результат} · {wins} побед, {losses} поражений · изменение средств: {signedFunds}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |

Use RU-07's full ranking names (`Национальный рейтинг`, `Международный рейтинг`,
`Профессиональный рейтинг`) as the track-dependent phrase; do not lowercase the existing
English `LADDER_LABEL` and hope the result declines correctly in Russian. `finishLabel` and the
signed money formatter also need localized projections, preserving the same underlying result
and integer cents. A blank movement is a real no-change/no-comparable-rank case, not `0 мест`.
The `bestText` alternatives distinguish *played but scored nothing* from *played nothing*.

## ⚙ 11.10 agent-authored (бланкет) – the season wrap-up, as twelve whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

§2 above drafted the wrap-up as one sentence over `{rankText}`, `{bestText}` and a signed funds string. The code spells it as **twelve whole sentences** (`seasonWrapRef`): unranked / ranked / ranked and up / ranked and down, each × a best result / played and nothing scored / nothing played. The rows are the draft cut to that shape, with its pieces kept (`без зачётного результата`, `турниров не было`, `изменение средств`, `мест с начала сезона`). `DRAFT`, his live edit follows.

Points, places, wins and losses are plurals over numbers (`1 очко`, `21 победа`). **Seam that is code, not translation:** the table label (`National` / `International` / `Professional`, lower-cased in the unranked rows), the best result (`finishLabel`: `Runner-up`) and the signed funds (`+$1,200`) arrive as English strings. The label sits in brackets after `рейтинг`, the result and the funds after a colon, so no case is needed; a Russian row prints `рейтинг (International): №12`, `лучший результат: Round of 16` until the code hands in Russian words.

### The twelve sentences

| id | English | Russian |
| --- | --- | --- |
| RU21-MIL-01 | `Season {0} wrap-up: Unranked – {1} · {2} pts this season · {3} · {4}-{5} (W-L) · funds {6}` | `Итоги сезона {0}: рейтинг ({1}): без места · {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} за сезон · лучший результат: {3} · {4, plural, one {{4} победа} few {{4} победы} many {{4} побед} other {{4} победы}}, {5, plural, one {{5} поражение} few {{5} поражения} many {{5} поражений} other {{5} поражения}} · изменение средств: {6}` |
| RU21-MIL-02 | `Season {0} wrap-up: Unranked – {1} · {2} pts this season · no result that scored · {3}-{4} (W-L) · funds {5}` | `Итоги сезона {0}: рейтинг ({1}): без места · {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} за сезон · без зачётного результата · {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}, {4, plural, one {{4} поражение} few {{4} поражения} many {{4} поражений} other {{4} поражения}} · изменение средств: {5}` |
| RU21-MIL-03 | `Season {0} wrap-up: Unranked – {1} · {2} pts this season · no tournaments played · {3}-{4} (W-L) · funds {5}` | `Итоги сезона {0}: рейтинг ({1}): без места · {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}} за сезон · турниров не было · {3, plural, one {{3} победа} few {{3} победы} many {{3} побед} other {{3} победы}}, {4, plural, one {{4} поражение} few {{4} поражения} many {{4} поражений} other {{4} поражения}} · изменение средств: {5}` |
| RU21-MIL-04 | `Season {0} wrap-up: {1} rank #{2} · {3} pts this season · {4} · {5}-{6} (W-L) · funds {7}` | `Итоги сезона {0}: рейтинг ({1}): №{2} · {3, plural, one {{3} очко} few {{3} очка} many {{3} очков} other {{3} очка}} за сезон · лучший результат: {4} · {5, plural, one {{5} победа} few {{5} победы} many {{5} побед} other {{5} победы}}, {6, plural, one {{6} поражение} few {{6} поражения} many {{6} поражений} other {{6} поражения}} · изменение средств: {7}` |
| RU21-MIL-05 | `Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no result that scored · {4}-{5} (W-L) · funds {6}` | `Итоги сезона {0}: рейтинг ({1}): №{2} · {3, plural, one {{3} очко} few {{3} очка} many {{3} очков} other {{3} очка}} за сезон · без зачётного результата · {4, plural, one {{4} победа} few {{4} победы} many {{4} побед} other {{4} победы}}, {5, plural, one {{5} поражение} few {{5} поражения} many {{5} поражений} other {{5} поражения}} · изменение средств: {6}` |
| RU21-MIL-06 | `Season {0} wrap-up: {1} rank #{2} · {3} pts this season · no tournaments played · {4}-{5} (W-L) · funds {6}` | `Итоги сезона {0}: рейтинг ({1}): №{2} · {3, plural, one {{3} очко} few {{3} очка} many {{3} очков} other {{3} очка}} за сезон · турниров не было · {4, plural, one {{4} победа} few {{4} победы} many {{4} побед} other {{4} победы}}, {5, plural, one {{5} поражение} few {{5} поражения} many {{5} поражений} other {{5} поражения}} · изменение средств: {6}` |
| RU21-MIL-07 | `Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↑{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · лучший результат: {5} · {6, plural, one {{6} победа} few {{6} победы} many {{6} побед} other {{6} победы}}, {7, plural, one {{7} поражение} few {{7} поражения} many {{7} поражений} other {{7} поражения}} · изменение средств: {8}` |
| RU21-MIL-08 | `Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↑{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · без зачётного результата · {5, plural, one {{5} победа} few {{5} победы} many {{5} побед} other {{5} победы}}, {6, plural, one {{6} поражение} few {{6} поражения} many {{6} поражений} other {{6} поражения}} · изменение средств: {7}` |
| RU21-MIL-09 | `Season {0} wrap-up: {1} rank #{2} (↑{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↑{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · турниров не было · {5, plural, one {{5} победа} few {{5} победы} many {{5} побед} other {{5} победы}}, {6, plural, one {{6} поражение} few {{6} поражения} many {{6} поражений} other {{6} поражения}} · изменение средств: {7}` |
| RU21-MIL-10 | `Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · {5} · {6}-{7} (W-L) · funds {8}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↓{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · лучший результат: {5} · {6, plural, one {{6} победа} few {{6} победы} many {{6} побед} other {{6} победы}}, {7, plural, one {{7} поражение} few {{7} поражения} many {{7} поражений} other {{7} поражения}} · изменение средств: {8}` |
| RU21-MIL-11 | `Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no result that scored · {5}-{6} (W-L) · funds {7}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↓{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · без зачётного результата · {5, plural, one {{5} победа} few {{5} победы} many {{5} побед} other {{5} победы}}, {6, plural, one {{6} поражение} few {{6} поражения} many {{6} поражений} other {{6} поражения}} · изменение средств: {7}` |
| RU21-MIL-12 | `Season {0} wrap-up: {1} rank #{2} (↓{3} vs season start) · {4} pts this season · no tournaments played · {5}-{6} (W-L) · funds {7}` | `Итоги сезона {0}: рейтинг ({1}): №{2} (↓{3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}} с начала сезона) · {4, plural, one {{4} очко} few {{4} очка} many {{4} очков} other {{4} очка}} за сезон · турниров не было · {5, plural, one {{5} победа} few {{5} победы} many {{5} побед} other {{5} победы}}, {6, plural, one {{6} поражение} few {{6} поражения} many {{6} поражений} other {{6} поражения}} · изменение средств: {7}` |
