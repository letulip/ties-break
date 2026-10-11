---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11B – Professional-field news

`src/engine/world/fieldNews.ts` emits season-turnover and college-time world news. The Russian
drafts below preserve the measured counts, rank and age while keeping dynamically inserted
player names in nominative form. This needs a locale-specific formatter with Russian number
forms; it is not safe to replace English substrings after assembly. All copy is `DRAFT`.

| source / branch | English template | Russian draft |
| --- | --- | --- |
| named farewell | `👋 {name} (#{rank}) has played a last match on tour – retiring at {age} after {N} seasons.` | `👋 {name} (№{rank}): последний матч в туре. Завершение карьеры в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}} после {N, plural, one {{N} сезона} few {{N} сезонов} many {{N} сезонов} other {{N} сезонов}}.` |
| named farewell | `👋 {name} (#{rank}) has played a last match on tour – retiring at {age} after {N} season.` | `👋 {name} (№{rank}): последний матч в туре. Завершение карьеры в {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}} после {N, plural, one {{N} сезона} few {{N} сезонов} many {{N} сезонов} other {{N} сезонов}}.` – ⚙ 11.10 близнец ключа по числу – тот же русский plural |
| total retirement, no top names | `The tour turns over: {N} professionals retire at the end of this season.` | `Профессиональный тур меняется: за сезон – {N, plural, one {{N} завершение} few {{N} завершения} many {{N} завершений} other {{N} завершений}} карьеры.` |
| total retirement, top names | `The tour turns over: {N} professionals retire at the end of this season, {K} of them from the top {depth}.` | `Профессиональный тур меняется: за сезон – {N, plural, one {{N} завершение} few {{N} завершения} many {{N} завершений} other {{N} завершений}} карьеры, из них {K} – в топ-{depth}.` |
| intake, unranked best | `{N} players have joined the professional tour this season.` | `За этот сезон профессиональный тур пополнился: {N, plural, one {{N} новое имя} few {{N} новых имени} many {{N} новых имён} other {{N} новых имён}}.` – ⚙ 11.10 три формы в фигурных скобках записаны как ICU plural – слова его |
| intake, ranked best | `{N} players have joined the professional tour this season – the highest-placed of them is {name} at #{rank}.` | `За этот сезон профессиональный тур пополнился: {N, plural, one {{N} новое имя} few {{N} новых имени} many {{N} новых имён} other {{N} новых имён}}. Лучшее место среди новичков: {name} (№{rank}).` – ⚙ 11.10 три формы в фигурных скобках записаны как ICU plural – слова его |
| campus digest, newcomers > 0, no leader | `🌍 The tour has not waited: {N} of today's top {depth} have come up since the scholarship began.` | `🌍 Тур не стоял на месте: в нынешнем топ-{depth} с начала её учёбы по стипендии – {N, plural, one {{N} новое имя} few {{N} новых имени} many {{N} новых имён} other {{N} новых имён}}.` – ⚙ 11.10 три формы в фигурных скобках записаны как ICU plural – слова его |
| campus digest, newcomers > 0, leader | `🌍 The tour has not waited: {N} of today's top {depth} have come up since the scholarship began, and {name} is #1 at {age}.` | `🌍 Тур не стоял на месте: в нынешнем топ-{depth} с начала её учёбы по стипендии – {N, plural, one {{N} новое имя} few {{N} новых имени} many {{N} новых имён} other {{N} новых имён}}. №1 сейчас: {name}, {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}}.` – ⚙ 11.10 три формы в фигурных скобках записаны как ICU plural – слова его |
| campus digest, newcomers = 0, leader | `🌍 The tour has not waited: nobody new is in today's top {depth} yet, and {name} is #1 at {age}.` | `🌍 Тур не стоял на месте: в нынешнем топ-{depth} пока нет новых имён. №1 сейчас: {name}, {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}}.` |
| campus digest, newcomers = 0, no leader | `null` — no event | `null` – не добавлять строку · ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

The set of women in the professional field does not license a gendered verb **attached to an
arbitrary generated name**. The drafts put dynamic names in nominative slots (`{name} (№…)`),
not after `для` or `у`, where Russian would require declined names the engine does not store.

Russian cardinal forms are required for `{N}`, seasons, and age; `1 сезон`, `2 сезона`,
`5 сезонов` and `21 год`, `22 года`, `25 лет` are the minimum tests. The `top-{depth}` value, rank and
season index are facts from the same world snapshot as English and must not be recomputed by
translation. The zero-newcomer branch deliberately avoids printing `0 новых игроков`.

## ⚙ 11.10 agent-authored (бланкет) – the stored English of the field news, as five keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

The table above drafted the field-news sentences whole. Five more strings of `fieldNews.ts` are the **English `text` the writer stores beside the ref**: the same sentences with an optional clause composed in code (`churn > 0 ? …`, a `season` / `seasons` word chosen by the count). No code asks for them; the rows are the table's Russian re-cut to their shape. The two clauses are fragments (the `, ` and ` – ` stay in the code's template, and the table reader trims a cell's edge). The farewell's `{4}` is the English `season` / `seasons`: the count is a number, so the noun is the Russian plural over `{3}` and `{4}` is read by an empty `select`, never printed. `DRAFT`, his live edit follows.

### The five strings

| id | English | Russian |
| --- | --- | --- |
| RU21-FLD-01 | `– the highest-placed of them is {0} at #{1}.` | `Лучшее место среди новичков: {0} (№{1}).` |
| RU21-FLD-02 | `, {0} of them from the top {1}` | `, из них {0} – в топ-{1}` |
| RU21-FLD-03 | `The tour turns over: {0} professionals retire at the end of this season{1}.` | `Профессиональный тур меняется: за сезон – {0, plural, one {{0} завершение} few {{0} завершения} many {{0} завершений} other {{0} завершения}} карьеры{1}.` |
| RU21-FLD-04 | `{0} players have joined the professional tour this season{1}` | `За этот сезон профессиональный тур пополнился: {0, plural, one {{0} новое имя} few {{0} новых имени} many {{0} новых имён} other {{0} новых имени}}{1}` |
| RU21-FLD-05 | `👋 {0} (#{1}) has played a last match on tour – retiring at {2} after {3} {4}.` | `👋 {0} (№{1}): последний матч в туре. Завершение карьеры в {2, plural, one {{2} год} few {{2} года} many {{2} лет} other {{2} года}} после {3, plural, one {{3} сезона} few {{3} сезонов} many {{3} сезонов} other {{3} сезона}}{4, select, other {}}.` |
