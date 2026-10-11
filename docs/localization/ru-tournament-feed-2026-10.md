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
| family prize, no daughter share | `{tier} prize money – {finish}` | `Призовые турнира «{tier}» – {finish}` |
| family prize, daughter's share split | `{tier} prize money – {finish}, less her {pct}% share ({herAmount})` | `Призовые турнира «{tier}» – {finish}; её доля {pct}% ({herAmount}) уже вычтена` |
| daughter's prize share | `{kidName}'s share of the prize money – {herAmount} into her own account` | `{kidName}: доля призовых – {herAmount} на личный счёт` |
| coach share | `Coach's share of the prize money – {pct}% of the {tier} cheque` | `Доля тренера от призовых – {pct}% от чека за турнир «{tier}»` |
| masseur share | `Masseur's share of the prize money – {pct}% of the {tier} cheque` | `Доля массажиста от призовых – {pct}% от чека за турнир «{tier}»` |
| first prize milestone | `💰 First prize money – {amount} at the {tier}!` | `💰 Первые призовые – {amount} за турнир «{tier}»!` |
| appearance fee | `Appearance fee – {tier}` | `Выплата за участие – турнир «{tier}»` |
| result bonus | `Sponsor bonus – {finish} at the {tier}` | `Бонус спонсора – {finish} на турнире «{tier}»` |
| deep run relief | `Deep week, fresh legs – the table work on tour kept the run from eating her.` | `Долгая турнирная неделя, но ноги ещё держат: массаж между матчами помог выдержать нагрузку.` |
| masseur tour bill | `Masseur on tour – {N} matches worked, billed per match` | `Массажист в поездке – {N, plural, one {{N} матч} few {{N} матча} many {{N} матчей} other {{N} матчей}}, оплата за каждый` |
| masseur tour bill | `Masseur on tour – {N} match worked, billed per match` | `Массажист в поездке – {N, plural, one {{N} матч} few {{N} матча} many {{N} матчей} other {{N} матчей}}, оплата за каждый` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |

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
| summary shell | `{tier} ({surface}, {week}): {kidName} – {finish} (+{points} pts){rankSuffix}{retiredSuffix}` | `Турнир «{tier}» ({surface}, {week}): {kidName} – {finish} (+{points} очков){rankSuffix}{retiredSuffix}` |
| `points <= 0` | empty ranking suffix | `пустой суффикс` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| points banked, not yet rankable | `(+{points} banked – a ranking needs {events} events with points, or {minimum})` | `(+{points}: очки зачтены, но для места в рейтинге нужны {events, plural, one {{events} турнир} few {{events} турнира} many {{events} турниров} other {{events} турниров}} с очками или {minimum} очков)` – ⚙ 11.10 дыра возвращена (бланкет) |
| points, no best-N improvement | `(does not improve best {N})` | `(не улучшает сумму {N} лучших результатов)` |
| partial best-N improvement | `(ranking total +{delta})` | `(к рейтинговой сумме +{delta} очков)` |
| full improvement | empty ranking suffix | `пустой суффикс` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| she retired | ` – she retired hurt` | ` – снялась из-за травмы` |
| opponent champion row | `🏆 {championName} won the {tier} ({surface}).` | `🏆 Победа на турнире «{tier}» ({surface}): {championName}.` |
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
| penalty, named event | `Tour penalty: {points} points – {tier}. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points, plural, one {{points} очко} few {{points} очка} many {{points} очков} other {{points} очков}} – турнир «{tier}». За последние 52 недели накоплено {running} из {threshold} штрафных очков.` |
| penalty, named event | `Tour penalty: {points} point – {tier}. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points, plural, one {{points} очко} few {{points} очка} many {{points} очков} other {{points} очков}} – турнир «{tier}». За последние 52 недели накоплено {running} из {threshold} штрафных очков.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| penalty, season commitment | `Tour penalty: {points} points – season commitment. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points, plural, one {{points} очко} few {{points} очка} many {{points} очков} other {{points} очков}} – обязательство на сезон. За последние 52 недели накоплено {running} из {threshold} штрафных очков.` |
| penalty, season commitment | `Tour penalty: {points} point – season commitment. {running} of {threshold} in the last 52 weeks.` | `Штраф тура: {points, plural, one {{points} очко} few {{points} очка} many {{points} очков} other {{points} очков}} – обязательство на сезон. За последние 52 недели накоплено {running} из {threshold} штрафных очков.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| suspension | `Tour suspension – {weeks} weeks, through week {untilWeek}.` | `Отстранение от тура на {weeks, plural, one {{weeks} неделю} few {{weeks} недели} many {{weeks} недель} other {{weeks} недель}}, до конца недели {untilWeek}.` |

`{untilWeek}` is currently an internal absolute week index in the English source. Translating
the word `week` does not make that number understandable to the player. The implementation
should render a player-facing week/date label from the same index, while keeping the exact
suspension end and testing boundary weeks. The penalty row names a point count, not money.

## ⚙ 11.10 agent-authored (бланкет) – the tour briefing and the penalty ledger, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

`mandatory.ts` writes the blocking briefing the first time she is ranked inside the top band (a lead, two requirement lines, five price lines, a closing line) and the ledger row of a penalty. §3 above and RU-20 §H (the tour office's letters) drafted the vocabulary – `штрафные очки`, `зачётный результат`, `приостановка заявок`, `цена, а не указание` – and the 15 rows here use it, so the popup, the letter and the feed read as one tour. `DRAFT`, his live edit follows.

**The voice is the tour's and it states a price** («мы ни за что не наказываем»): no line says she should have gone, the family decides (`решает семья`), and the calendar «written by them rather than by us» keeps the family `мы`. Every counted noun is an ICU plural over a number: a penalty point in the nominative, `зачётного результата` after `из`, a week in the genitive after `около` and `за`.

**Seam that is code, not translation.** Three `ledger` rows are the English `text` the writer stores (`penalty {1}`, `penalty {2}` and the penalty row itself). Their count is a number, so the noun is the Russian plural over it, and the English `point` / `points` is read by an empty `select` – consumed, never printed. The penalty row's `{2}` is the English clause ` – {tier}` or ` – season commitment`; the fragment ` – season commitment` has an edge space the table reader trims, and the wiring wave puts it back in the template.

### The briefing

| id | English | Russian |
| --- | --- | --- |
| RU21-MND-01 | `She is ranked {0} in the world. Inside the top {1} the tour's commitment rules apply, and from here on part of her calendar is written by them rather than by us.` | `Её место в мировом рейтинге – №{0}. В топ-{1} действуют правила обязательного участия, и с этого момента часть её календаря пишут они, а не мы.` |
| RU21-MND-02 | `Required one at a time – each is its own entry, and its own decision.` | `Требуются по одному: каждый турнир – отдельная заявка и отдельное решение.` |
| RU21-MND-03 | `Her pick of them, counted once when the season closes.` | `Из них она выбирает сама; зачёт – один раз, по закрытии сезона.` |
| RU21-MND-04 | `A required event she does not enter takes one of her {0} counting results and puts a zero in it. That is the real price, and it is not a fine: it is a result she can no longer replace with a better one.` | `Обязательный турнир, на который она не заявилась, занимает один из её {0, plural, one {{0} зачётного результата} few {{0} зачётных результатов} many {{0} зачётных результатов} other {{0} зачётного результата}} и записывает в него ноль. Это и есть настоящая цена, и это не штраф: такой результат она уже не сможет заменить лучшим.` |
| RU21-MND-05 | `The tour also books {0} penalty point for not entering, {1} for withdrawing after the list has closed and {2} for not appearing on the day.` | `Кроме того, тур начисляет {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}} за отсутствие заявки, {1} – за снятие после закрытия списка и {2} – за неявку в день турнира.` |
| RU21-MND-06 | `The tour also books {0} penalty points for not entering, {1} for withdrawing after the list has closed and {2} for not appearing on the day.` | `Кроме того, тур начисляет {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}} за отсутствие заявки, {1} – за снятие после закрытия списка и {2} – за неявку в день турнира.` |
| RU21-MND-07 | `The tour also books {0} penalty {1} for not entering, {2} for withdrawing after the list has closed and {3} for not appearing on the day.` | `Кроме того, тур начисляет {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}}{1, select, other {}} за отсутствие заявки, {2} – за снятие после закрытия списка и {3} – за неявку в день турнира.` |
| RU21-MND-08 | `{0} penalty points inside {1} weeks suspends her entries for {2} weeks. Points leave that window on their own as the year moves – nothing is carried forward.` | `Если за {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}} набрано {0, plural, one {{0} штрафное очко} few {{0} штрафных очка} many {{0} штрафных очков} other {{0} штрафного очка}}, её заявки приостанавливаются на {2, plural, one {{2} неделю} few {{2} недели} many {{2} недель} other {{2} недели}}. Очки сами выходят из этого окна по мере того, как идёт год, – ничего не переносится.` |
| RU21-MND-09 | `The {0}s are settled once, at the end of the season: {1} penalty point for each one she finished short of {2}.` | `Расчёт по турнирам {0} делается один раз, в конце сезона: {1, plural, one {{1} штрафное очко} few {{1} штрафных очка} many {{1} штрафных очков} other {{1} штрафного очка}} за каждый турнир, которого не хватило до нормы – {2}.` |
| RU21-MND-10 | `The {0}s are settled once, at the end of the season: {1} penalty points for each one she finished short of {2}.` | `Расчёт по турнирам {0} делается один раз, в конце сезона: {1, plural, one {{1} штрафное очко} few {{1} штрафных очка} many {{1} штрафных очков} other {{1} штрафного очка}} за каждый турнир, которого не хватило до нормы – {2}.` |
| RU21-MND-11 | `The {0}s are settled once, at the end of the season: {1} penalty {2} for each one she finished short of {3}.` | `Расчёт по турнирам {0} делается один раз, в конце сезона: {1, plural, one {{1} штрафное очко} few {{1} штрафных очка} many {{1} штрафных очков} other {{1} штрафного очка}}{2, select, other {}} за каждый турнир, которого не хватило до нормы – {3}.` |
| RU21-MND-12 | `Nothing at all is owed for a week she could not play – injured, suspended, too young for the rung, refused by the entry list, or already committed to another tournament that week.` | `За неделю, когда она не могла играть, не начисляется ничего: травма, приостановка заявок, слишком юный возраст для этого уровня, непопадание в заявочный список или заявка на другой турнир на той же неделе.` |
| RU21-MND-13 | `Every line above is a price, and none of it is an instruction. Which of them she pays is still a decision, and it stays yours.` | `Каждая строка выше – цена, а не указание. Какие из этих цен заплатить, по-прежнему решает семья.` |

### The ledger row

| id | English | Russian |
| --- | --- | --- |
| RU21-MND-14 | `Tour penalty: {0} {1}{2}. {3} of {4} in the last 52 weeks.` | `Штраф тура: {0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}}{1, select, other {}}{2}. За последние 52 недели накоплено {3} из {4} штрафных очков.` – ⚙ the stored English `text`; `{2}` is the English clause ` – {tier}` or ` – season commitment` |
| RU21-MND-15 | `– season commitment` | `– обязательство на сезон` – ⚙ the clause the stored English row carries when no tier is named; the table reader trims its edge space |

## ⚙ 11.10 agent-authored (бланкет) – the tournament summary row, as eight whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

§2 above drafted the summary as one shell over `{rankSuffix}{retiredSuffix}`; the code spells it as **eight whole sentences**: the plain result, the three ranking clauses (banked, does not improve, ranking total), and each of the four again with `– she retired hurt`. The rows are the shell and the clauses joined, with the compiled clause rows' wording kept (`очки зачтены, но для места в рейтинге нужны …`, `не улучшает сумму {N} лучших результатов`, `к рейтинговой сумме +…`, `снялась из-за травмы`); the space the English clause carries before its bracket is written into the sentence. `DRAFT`, his live edit follows.

The points are a plural over a number (`+22 очка`). **Seam that is code, not translation:** the surface (`hard`), the week label and the finish (`finishLabel`: `Semifinalist`) are English words in holes; each sits in brackets or after a dash and is not inflected. The masseur's tour bill is the stored English twin of a compiled row: its `match` / `matches` is read by an empty `select`, never printed.

### The eight sentences

| id | English | Russian |
| --- | --- | --- |
| RU21-TRN-01 | `{0} ({1}, {2}): {3} – {4} (+{5} pts)` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}})` |
| RU21-TRN-02 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) – she retired hurt` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) – снялась из-за травмы` |
| RU21-TRN-03 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8})` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (+{6}: очки зачтены, но для места в рейтинге нужны {7, plural, one {{7} турнир} few {{7} турнира} many {{7} турниров} other {{7} турнира}} с очками или {8, plural, one {{8} очка} few {{8} очков} many {{8} очков} other {{8} очка}})` |
| RU21-TRN-04 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (+{6} banked – a ranking needs {7} events with points, or {8}) – she retired hurt` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (+{6}: очки зачтены, но для места в рейтинге нужны {7, plural, one {{7} турнир} few {{7} турнира} many {{7} турниров} other {{7} турнира}} с очками или {8, plural, one {{8} очка} few {{8} очков} many {{8} очков} other {{8} очка}}) – снялась из-за травмы` |
| RU21-TRN-05 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6})` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (не улучшает сумму {6} лучших результатов)` |
| RU21-TRN-06 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (does not improve best {6}) – she retired hurt` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (не улучшает сумму {6} лучших результатов) – снялась из-за травмы` |
| RU21-TRN-07 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6})` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (к рейтинговой сумме +{6, plural, one {{6} очко} few {{6} очка} many {{6} очков} other {{6} очка}})` |
| RU21-TRN-08 | `{0} ({1}, {2}): {3} – {4} (+{5} pts) (ranking total +{6}) – she retired hurt` | `Турнир «{0}» ({1}, {2}): {3} – {4} (+{5, plural, one {{5} очко} few {{5} очка} many {{5} очков} other {{5} очка}}) (к рейтинговой сумме +{6, plural, one {{6} очко} few {{6} очка} many {{6} очков} other {{6} очка}}) – снялась из-за травмы` |

### The masseur's tour bill, stored form

| id | English | Russian |
| --- | --- | --- |
| RU21-TRN-09 | `Masseur on tour – {0} {1} worked, billed per match` | `Массажист в поездке – {0, plural, one {{0} матч} few {{0} матча} many {{0} матчей} other {{0} матча}}{1, select, other {}}, оплата за каждый` – ⚙ the stored English `text`: `{1}` is the English word `match` / `matches`; the count is a number, so the noun is a Russian plural over it and the English word is read by an empty `select` – consumed, never printed |
