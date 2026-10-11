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
