---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11G – Tournament settlement and tour penalties

These are generated result, money and milestone rows from
`src/engine/world/tournamentClose.ts` and `src/engine/world/mandatory.ts`. RU-04 translates
the season UI; RU-08 translates live match presentation. This volume translates the separate
strings the engine writes into the feed and album. All lines are `DRAFT`; points, cents,
ranking windows and penalty thresholds are unchanged.

## 1. Tournament money and staff receipts

| source | English template | Russian draft |
| --- | --- | --- |
| family prize, no daughter share | `{tier} prize money – {finish}` | `Призовые турнира «{tier}» – {результат}` |
| family prize, daughter's share split | `{tier} prize money – {finish}, less her {pct}% share ({herAmount})` | `Призовые турнира «{tier}» – {результат}; её доля {pct}% ({herAmount}) уже вычтена` |
| daughter's prize share | `{kidName}'s share of the prize money – {herAmount} into her own account` | `{kidName}: доля призовых – {herAmount} на личный счёт` |
| coach share | `Coach's share of the prize money – {pct}% of the {tier} cheque` | `Доля тренера от призовых – {pct}% от чека за турнир «{tier}»` |
| masseur share | `Masseur's share of the prize money – {pct}% of the {tier} cheque` | `Доля массажиста от призовых – {pct}% от чека за турнир «{tier}»` |
| first prize milestone | `💰 First prize money – {amount} at the {tier}!` | `💰 Первые призовые – {amount} за турнир «{tier}»!` |
| appearance fee | `Appearance fee – {tier}` | `Выплата за участие – турнир «{tier}»` |
| result bonus | `Sponsor bonus – {finish} at the {tier}` | `Бонус спонсора – {результат} на турнире «{tier}»` |
| deep run relief | `Deep week, fresh legs – the table work on tour kept the run from eating her.` | `Долгая турнирная неделя, но ноги ещё держат: массаж между матчами помог выдержать нагрузку.` |
| masseur tour bill | `Masseur on tour – {N} {match/matches} worked, billed per match` | `Массажист в поездке – {N} {матч/матча/матчей}, оплата за каждый` |

`{результат}` must use the localized `finishLabel` family, not its stored English display
string. The family's prize row shows the **net** amount and explicitly names the already
subtracted daughter's share; the daughter's row is informational, not a second family expense.
The first-prize row keeps the actual amount. Russian `match` count needs `1 матч`, `2 матча`,
`5 матчей`.

## 2. Result and ranking-window suffix

The tournament summary is one composed line, not a set of independent labels. Its points and
`rankingDeltaSuffix` are calculated against the dominant ladder's own window. A Russian
formatter must keep `0 points`, `not ranked yet`, `did not improve best N`, and `some points
displaced an older result` distinct.

| source / case | English | Russian draft |
| --- | --- | --- |
| summary shell | `{tier} ({surface}, {week}): {kidName} – {finish} (+{points} pts){rankSuffix}{retiredSuffix}` | `Турнир «{tier}» ({покрытие}, {неделя}): {kidName} – {результат} (+{points} очков){суффикс рейтинга}{суффикс травмы}` |
| `points <= 0` | empty ranking suffix | пустой суффикс |
| points banked, not yet rankable | `(+{points} banked – a ranking needs {events} events with points, or {minimum})` | `(очки зачтены, но для места в рейтинге нужны {events} {турнир/турнира/турниров} с очками или {minimum} очков)` |
| points, no best-N improvement | `(does not improve best {N})` | `(не улучшает сумму {N} лучших результатов)` |
| partial best-N improvement | `(ranking total +{delta})` | `(к рейтинговой сумме +{delta} очков)` |
| full improvement | empty ranking suffix | пустой суффикс |
| she retired | ` – she retired hurt` | ` – снялась из-за травмы` |
| opponent champion row | `🏆 {championName} won the {tier} ({surface}).` | `🏆 Победа на турнире «{tier}» ({покрытие}): {championName}.` |
| first career title | `🏆 First career title: {tier}!` | `🏆 Первый титул в карьере: турнир «{tier}»!` |
| first Slam main draw | `🏆 First Grand Slam main draw – from this week the world knows her name.` | `🏆 Первая основная сетка турнира Большого шлема. Теперь о ней знают далеко за пределами привычного круга.` |
| first national win | `🏆 First win at National level!` | `🏆 Первая победа на национальном уровне!` |

The result line contains the same points and same winner as the English source. The injury
suffix comes **after** the finish and points; it cannot replace the scored round. For a dynamic
`kidName`, keep the name in nominative position before a dash. The first-Slam sentence is a
public-recognition beat, not a claim that she won the event.

## 3. Mandatory-tour penalty and suspension

| source / case | English | Russian draft |
| --- | --- | --- |
| penalty, named event | `Tour penalty: {points} {point/points} – {tier}. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points} {очко/очка/очков} – турнир «{tier}». За последние 52 недели накоплено {running} из {threshold} штрафных очков.` |
| penalty, season commitment | `Tour penalty: {points} {point/points} – season commitment. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points} {очко/очка/очков} – обязательство на сезон. За последние 52 недели накоплено {running} из {threshold} штрафных очков.` |
| suspension | `Tour suspension – {weeks} weeks, through week {untilWeek}.` | `Отстранение от тура на {weeks} {неделю/недели/недель}, до конца недели {untilWeek}.` |

`{untilWeek}` is currently an internal absolute week index in the English source. Translating
the word `week` does not make that number understandable to the player. The implementation
should render a player-facing week/date label from the same index, while keeping the exact
suspension end and testing boundary weeks. The penalty row names a point count, not money.
