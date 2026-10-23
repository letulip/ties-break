---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-11
---

# RU-08 – Match viewer and commentary

## 1. Scope and voice

This batch owns every live/replay match surface: takeover chrome, court readouts, playback controls,
practice flow, result tables, pre-match booth copy and the deterministic commentary corpus. All
Russian copy is `DRAFT`.

The match voice is compact broadcast Russian, but this is still a family game. It may be precise,
tense and cinematic; it must not imitate television bombast, grade the daughter or invent emotion.
The parent's shouts are intimate `ты`. Interface controls keep the neutral/formal product voice.

This first section covers the shared viewer and practice/replay shells. Preview and point-by-point
corpora follow as separate reviewable sections.

## 2. Match playback controls

### 2.1 Amount shown

| source | full Russian label | compact Russian label |
| --- | --- | --- |
| `Every point` – full word | `Все розыгрыши` | |
| `Full` – compact toggle | `Все` | |
| `Key points only` – full word | `Только ключевые розыгрыши` | |
| `Key` – compact toggle | `Ключевые` | |

Segmented-group accessible name: **`Режим просмотра матча`**.

`Розыгрыш` is one played point, not a game or rally length. `Полный` is avoided as a standalone
short label because it describes an object, not what the control will show.

### 2.2 Speed

| source | full Russian label | compact label |
| --- | --- | --- |
| `Normal speed` | `Обычная скорость` | `1×` |
| `Double speed` | `Удвоенная скорость` | `2×` |
| `Quadruple speed` | `Скорость ×4` | `4×` |

Segmented-group accessible name: **`Скорость воспроизведения`**.

### 2.3 Actions

| source | Russian |
| --- | --- |
| `Skip to the result` | `Сразу к результату` |
| `Watch again ↻` | `Посмотреть ещё раз ↻` · `APPROVED` 10.10 |
| shout picker aria | `Выберите реплику` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| `Shout 📣` | `Крикнуть 📣` |

The skip remains a link-like action outside the viewing-mode switch. It ends viewing; it is not a
third resolution beside `Все` and `Ключевые`.

## 3. Parent shouts

| English source | Russian draft |
| --- | --- |
| `Still here.` | `Мы рядом.` |
| `Take your time.` | `Не спеши.` |
| `I saw that.` | `Мы видели.` |
| `Next one.` | `Следующий мяч.` |
| `Drink something.` | `Попей воды.` |
| `Enjoy it.` | `Играй в удовольствие.` |

The parent speaks as the family, `мы` (`Мы видели.`, `Мы рядом.`), by the owner's 07.10 order №10
([RU-19](ru-family-voice-pass-2026-10.md)): no shout assigns the player a gender. These lines are
spoken to the daughter, so intimate imperatives are correct. They remain presentation-only: localization must
not imply a tactical instruction or a guaranteed effect on the already-resolved match.

## 4. Court chrome and player rows

| source | Russian |
| --- | --- |
| `Live` – live badge | `Идёт` |
| `Elapsed match time {clock}` · elapsed-clock aria | `Время матча: {clock}` |
| `km/h` – speed unit | `км/ч` · `APPROVED` 10.10 – чат-ок: цифры едины, слова единиц переводимы |
| `TB` – tiebreak marker | `ТБ` |
| `· serving` – player suffix | `· подаёт` |

Rank display uses `№{rank}`, not `#{rank}`. Player names use the locale-aware short-name formatter;
Russian must not split an already formatted full name on spaces inside the viewer.

`Идёт` is a match-state badge. `В эфире` would promise a broadcast, while only the sandbox surface
is genuinely happening at the player's current interaction time. Replays show no badge and no
shout control.

## 5. Live match readouts

| source | Russian |
| --- | --- |
| `Momentum` | `Ход матча` |
| `Not started` | `Ещё не начался` |
| `Almost there` | `Почти выиграла` |
| `Well ahead` | `Уверенно впереди` |
| `Slight edge` | `Небольшое преимущество` |
| `Even` | `Ровно` |
| `Uphill` | `Нужно отыгрываться` |
| `Well behind` | `Далеко позади` |
| `Hanging on` | `Ещё держится` |
| `1st serve %` | `Первая подача` |
| `Break points` | `Брейк-пойнты` |
| `Momentum: {caption}` · momentum chart aria | `Ход матча: {caption}` |
| `Warming up. The first ball is on its way.` · empty log | `Разминка. Первый мяч уже летит.` |

The seven momentum phrases describe the match probability from her side, not confidence or mood.
`Почти выиграла` may appear only for the same `p >= 0.9` band as English; it is not a final score.

Percent values remain locale-formatted integers. Break-point pairs keep tennis order
`реализовано/всего`, but their accessible name should expand it, for example `2 из 5 брейк-пойнтов
реализовано`, rather than asking speech output to infer the slash.

## 6. Retirement alert

| source | Russian |
| --- | --- |
| `{name} could not continue.` | `{name} не смогла продолжить.` |
| `She retired hurt at {score}.` | `Она снялась при счёте {score}.` – ⚙ 11.10 дыра {score} русского не из ключа: ключ – голый префикс, счёт дописывается отдельно `QUESTION` |
| `A long match on tired legs.` | `Долгий матч на уставших ногах.` |
| `Stay with her` | `Остаться с ней` |

The reason says only what the engine proves: retirement becomes possible deep into a long match and
is affected by condition. It does not name a body part, diagnosis or recovery time. An opponent's
retirement stays in commentary and does not open this family alert.

## 7. Shared box score

| source | Russian |
| --- | --- |
| `Aces` | `Эйсы` |
| `Double faults` | `Двойные ошибки` |
| `Winners` | `Удары навылет` · `APPROVED` 10.10 |
| `Unforced errors` | `Невынужденные ошибки` |
| `Max serve` | `Макс. скорость подачи` |
| `{speed} km/h` | `{speed} км/ч` · `APPROVED` 10.10 |
| `Avg rally {rally} shots · ~{duration}` | `В среднем {rally} за розыгрыш · около {duration}` – ⚙ 11.10 выровнено на APPROVED T46 («удара» не согласуется с 5+) |

`{rally}` uses a Russian decimal comma and counted form: `1,0 удара`, `2,4 удара`, `5,0 удара`.
The value is an average, so plural-category agreement on the decimal is not copied from integer
grammar. Duration uses the shared compact time formatter (`1 ч 24 мин`), not a translated English
duration string.

## 8. Practice match flow

| source | Russian |
| --- | --- |
| `Practice match` | `Тренировочный матч` |
| `To result` – header | `К результату` |
| `Friendly at the club` | `Тренировочный матч в клубе` |
| `practice\|vs` – compact | `против` |
| `sparring partner` | `спарринг-партнёр` |
| `No ranking points` | `Без рейтинговых очков` |
| `Skip to result` | `Сразу к результату` |
| `Watch it` | `Смотреть матч` · `APPROVED` 10.10 |
| `To the result` – viewer proceed | `К результату` |
| `Win` | `Победа` |
| `Loss` | `Поражение` |
| `{kid} vs {opp} · practice – no ranking points` | `{kid} против {opp} · тренировочный матч · без рейтинговых очков` |
| `Watch again` | `Посмотреть ещё раз` · `APPROVED` 10.10 – чат-ок выровнял на форму RU-04 T47; «Смотреть снова» – историческая |
| `Done` | `Готово` |

The rankless opponent remains rankless. `Спарринг-партнёр` is a role, not a generated person name,
and must not pass through the name-shortening formatter.

## 9. Replay shell

| source | Russian |
| --- | --- |
| `Match replay` – default title | `Повтор матча` |
| `Close replay` – close accessible name | `Закрыть повтор` |
| `Close` – close tooltip | `Закрыть` |

A caller-provided competition title, such as the college league, is localized by that competition's
catalogue before it reaches the shell. The subtitle joins localized display names with `против`;
it must not retain an English `vs` island.

## 10. Viewer-shell implementation and LQA

- Match state, points, server side, clocks, scores, serve speeds and win probabilities stay
  locale-independent. Locale selection affects only their presentation.
- Replace finished label strings in option tables, stat rows and momentum captions with semantic
  ids or locale lookups. The English source text is not a resource key.
- `proceedLabel` and caller titles currently cross component boundaries as display strings. Pass a
  localized value from the owning flow or a semantic action id; never translate it inside the leaf
  by comparing English text.
- Use one shared locale-aware match-stat resource for practice and tournament result cards.
- At 320 px, inspect `Ключевые`, the two speed/view plates, shout picker, `Сразу к результату`, long
  player names and `Макс. скорость подачи` without shrinking numbers into illegibility.
- Exercise live and replay modes, full/key/skip, 1×/2×/4×, every shout, before-start and all seven
  momentum bands, tiebreak, serve-side swap, retirement on either side and all box-score rows.
- Verify replays contain neither `Идёт` nor the shout row; locale switching changes no playback
  cursor, timeline event, result, RNG state or saved match.
- Run an English-island sweep over visible text, `aria-label`, tooltips, native select options and
  retirement alerts.

The next sections localize `src/viz/preview.ts`, then the complete deterministic corpus in
`src/viz/commentary.ts`.

## 11. Pre-match preview ladder

The four preview storeys remain monotone: each higher tournament family says everything below it
and adds facts. Russian changes syntax, not which facts a storey receives.

### 11.1 Occasion, surface and temperature

| fact | Russian form |
| --- | --- |
| tournament match | `{round} · {fullTier}. {surface}{temperatureClause}.` |
| no event behind the match | `Тренировочный матч, ничего не разыгрывается. {surface}{temperatureClause}.` |
| hard | `Хард` |
| clay | `Грунт` |
| grass | `Трава` |
| temperature present | `, {temperature} °C` |

Examples: `Полуфинал · Юниорский тур 300. Грунт, 18 °C.`; `Тренировочный матч, ничего
не разыгрывается. Хард.` The degree symbol and `C` remove Russian plural problems and match the
weather plate.

`{round}` and `{fullTier}` come from RU-04's semantic catalogues. `remainingIn()` must stop parsing
their English display labels; it should receive the round size or stable stage id directly.

### 11.2 Conditions bands

| temperature gate | Russian line |
| --- | --- |
| `≤ 14` | `Холодно: мяч почти не летит, а руки на ракетке будут мёрзнуть весь матч.` |
| `15–18` | `Прохладно. Обеим понадобится время, чтобы почувствовать мяч.` |
| `19–24` | `Комфортная погода для матча – на воздух сослаться не получится.` |
| `25–27` | `На корте тепло; полотенце понадобится между розыгрышами.` |
| `≥ 28` | `Жарко: все вспотеют ещё до конца первого гейма.` |

The number has already appeared in the occasion line. These sentences describe its effect and do
not repeat the temperature.

### 11.3 Opponent

> `На другой стороне корта – {opponent}{ageClause}{rankClause}.`

- no metadata: `На другой стороне корта – Анна.`;
- age only: `На другой стороне корта – Анна, 17 лет.`;
- age and rank: `На другой стороне корта – Анна, 17 лет, №42 в рейтинге.`

Age is the shared counted phrase. Rank enters only from storey 2 and uses the ranking table relevant
to this match; the sentence never compares positions from different ladders.

### 11.4 Officials by storey

| case | Russian line |
| --- | --- |
| storey 1, clay | `Судьи на вышке нет. Линии определяют сами, а спор решает след на грунте.` |
| storey 1, other surface | `Судьи на вышке нет. Линии определяют сами, и ошибка на линии – часть такого дня.` |
| storey 2, late round | `На этом матче есть судья на вышке, счёт обновляется в реальном времени.` |
| storey 2, before J30/J60 late round | `До финала судьи на вышке не будет. Сегодня линии определяют сами.` |
| storey 2, before J300 late round | `До полуфинала судьи на вышке не будет. Сегодня линии определяют сами.` |
| storey 3 | `Судья на вышке; после матча статистика войдёт в протокол.` |
| storey 4 | `Судья на вышке, видеопросмотр, каждый розыгрыш публикуется в реальном времени.` |

These are competition facts, not atmosphere. The localized late-round test reads a stage id, never
the translated words `Финал` or `Полуфинал`.

## 12. Stakes, chance and standings

### 12.1 What winning earns

| current round | Russian clause |
| --- | --- |
| final | `Победа принесёт {firstName} титул` |
| semifinal | `Победа выведет {firstName} в финал` |
| quarterfinal | `Победа выведет {firstName} в полуфинал` |
| round of 16 | `Победа выведет {firstName} в четвертьфинал` |
| earlier round of `{remaining}` | `Победа выведет {firstName} в 1/{remaining / 4} финала` |

From storey 3, append **`За победу в этом матче – {points}.`**, where `{points}` is a counted
phrase (`1 очко`, `2 очка`, `30 очков`). This is clearer in Russian than making an abstract round
the grammatical payer.

### 12.2 Match chance

> `Шанс {firstName} выиграть матч – {chance}%.`

The percentage is the same closed-form probability that the English preview reads, rounded only at
the display boundary. It is not a prediction generated from the already-resolved point record.

### 12.3 Professional standing comparisons

| state | Russian template |
| --- | --- |
| both unranked | `И {hero}, и {opponent} подходят к матчу без рейтинга на этом уровне.` |
| hero unranked | `{hero} здесь без рейтинга; {opponent} – №{oppRank}.` |
| opponent unranked | `{hero} – №{heroRank}; у {opponent} рейтинга пока нет.` |
| equal | `{hero} и {opponent} занимают одно место – №{rank}.` |
| gap one | `№{heroRank} против №{oppRank}: между ними одно место, выше {ahead}.` |
| larger gap | `№{heroRank} против №{oppRank}: {ahead} выше на {gapPlaces}.` |

`{gapPlaces}` is `2 места`, `5 мест`, `21 место`; never append invariant `мест` to a number.
Names stay nominative by choosing a sentence that does not require automatic genitive inflection.

## 13. Top-storey surface notes

| surface | Russian line |
| --- | --- |
| hard | `Отскок будет ровным весь день – без сюрпризов.` |
| clay | `Грунт замедлит мяч и поднимет отскок.` |
| grass | `Мяч пойдёт низко и проскользит; розыгрыши будут короткими.` |

The occasion already names the surface, so these lines do not repeat `Хард`, `Грунт` or `Трава`.
They are surface-compatible statements, not tactical instructions to the daughter.

## 14. Preview implementation and LQA

- Preserve `rungOf`/`storeyOf` and the ordered entry table. Locale selection cannot add, remove or
  reorder preview facts.
- Pass semantic `TierId`, stage id/remaining draw size, surface id, ages, ranks and numeric chance
  into locale renderers. Do not parse localized stage text to recover draw arithmetic.
- Preserve first-name handling through the shared locale-aware name formatter. A fictional role
  such as `Первый номер посева` is not a personal name to shorten.
- Exercise null event, null temperature, all three surfaces, five temperature bands, opponent
  metadata combinations, J30/J60/J300 early and late rounds, every stake depth, zero-point round,
  chance boundaries and every standings branch.
- Assert strict preview-line counts by storey after localization, not just snapshot wording.
- At 320 px, inspect the longest officials and standings lines in the scrollable commentary log.
- Verify the same stored match produces identical preview key order in English and Russian and no
  new RNG read.

## 15. Point-commentary grammar

The English builder composes many lines from sentence fragments. Russian must preserve the same
facts and variant selection, but it cannot reuse the same grammatical seams. In particular, a
player display name is not safe to decline automatically: the roster contains Russian and foreign
names, initials, fictional labels and potentially indeclinable surnames. Every Russian mould below
keeps `{who}` in the nominative.

Counted tennis terms use locale helpers rather than translated English plurals:

| value | break point | set point | match point |
| --- | --- | --- | --- |
| 1 | `один брейк-пойнт` | `один сетбол` | `один матчбол` |
| 2 | `два брейк-пойнта` | `два сетбола` | `два матчбола` |
| 5 | `пять брейк-пойнтов` | `пять сетболов` | `пять матчболов` |

The formatter must expose the grammatical role it needs. `Отыгрывает два брейк-пойнта` and
`Отыграно два брейк-пойнта` happen to share the visible counted phrase, but their surrounding verb
does not. Do not build Russian by appending `-ы`, `-а` or `-ов` to a localized noun.

Numbers that deliberately open a run line are written as words through twenty (`Шесть`,
`Четырнадцать`, `Двадцать`), then as digits. The tests that currently read an English number word
must become locale-aware; the invariant is **the claimed count opens the line**, not that the first
token belongs to the English `NUMBER_WORD` table.

## 16. Tennis placement and point endings

### 16.1 Placement vocabulary

| source fact | Russian phrase |
| --- | --- |
| serve `down the T` | `по центру` |
| serve `out wide` | `по диагонали` |
| serve `into the body` | `в корпус` |
| rally `down the line` | `по линии` |
| rally `through the middle` | `по центру` |
| rally `cross-court` | `кроссом` |
| miss `net` | `отправляет мяч в сетку` |
| miss `long` | `бьёт за заднюю линию` |
| miss `wide` | `бьёт в аут по ширине` |

`По диагонали` here describes the wide serve, while `кроссом` describes a rally ball. Keeping two
terms prevents the feed from pretending the engine knows a precise serve target or a forehand wing.

### 16.2 Compact manner mould

| source branch | Russian draft |
| --- | --- |
| ace, closing | `Эйс {servePlacement} ставит точку.` |
| ace, sealing | `Эйс {servePlacement} решает гейм.` |
| double fault | `Всё заканчивается двойной ошибкой.` |
| hero winner, 8+ shots | `{Shots} ударов – и в конце удар навылет {rallyPlacement}.` |
| hero winner, short | `Удар навылет {rallyPlacement} ставит точку.` |
| other winner, 8+ shots | `{Shots} ударов, и {who} завершает розыгрыш {rallyPlacement}.` |
| other winner, short | `{who} завершает всё ударом навылет {rallyPlacement}.` |
| error after 8+ shots | `Долгий обмен, и {who} {missPhrase}.` |
| short error | `{who} {missPhrase}.` |

`{Shots}` is the sentence-opening counted word. `Обмен` is used only for the engine's generic long
rally; the copy does not invent a baseline exchange, volley or wing.

### 16.3 Feed mould

The second English mould is currently assembled as `{player} wins/loses the {unit} with
{descriptor}`. Russian receives one semantic renderer with inputs `actor`, `won`, `unit`, `manner`
and `hero`, not translated fragments. Its output families are:

| fact | hero just named | other player must be named |
| --- | --- | --- |
| ace | `Она выигрывает этот розыгрыш эйсом {placement}.` | `{who} выигрывает {unit} эйсом {placement}.` |
| winner | `Она выигрывает этот розыгрыш ударом навылет {placement}.` | `{who} выигрывает {unit} ударом навылет {placement}.` |
| double fault | `Она проигрывает этот розыгрыш двойной ошибкой.` | `{who} проигрывает {unit} двойной ошибкой.` |
| net error | `Она проигрывает этот розыгрыш, отправив мяч в сетку.` | `{who} проигрывает {unit}, отправив мяч в сетку.` |
| long error | `Она проигрывает этот розыгрыш ударом за заднюю линию.` | `{who} проигрывает {unit} ударом за заднюю линию.` |
| wide error | `Она проигрывает этот розыгрыш ударом в аут по ширине.` | `{who} проигрывает {unit} ударом в аут по ширине.` |

`{unit}` is `гейм` or `сет`. A return error remains a data distinction for future wording, but the
first Russian pass does not force the clumsy `ошибка на приёме` into every row; both return and
groundstroke are truthfully covered by the observed result. The second-serve ace may be surfaced as
`эйсом со второй подачи` in this mould because the shot kind proves it.

## 17. Breaks and meaningful holds

### 17.1 Routine break pool

The pool grows additively with the same storeys as English:

| availability | Russian variant |
| --- | --- |
| base | `{who} делает брейк.` |
| base | `{who} берёт чужую подачу.` |
| base | `Подача соперницы проиграна. Брейк делает {who}.` |
| from storey 3 | `Брейк – и его делает {who}.` |
| from storey 3 | `Этот гейм на приёме берёт {who}.` |
| from storey 4 | `{who} всё-таки находит путь к брейку.` |
| from storey 4 | `Подача проиграна. Брейк делает {who}.` |

### 17.2 Break back to level

| availability | Russian variant |
| --- | --- |
| base | `{who} делает обратный брейк. Снова ровно.` |
| base | `{who} возвращает брейк, и счёт в сете снова равный.` |
| from storey 3 | `{who} отвечает обратным брейком. Снова ровно.` |
| from storey 4 | `{who} сразу возвращает брейк – счёт равный.` |

The score-earned branches stay outside the pool:

| fact | Russian line |
| --- | --- |
| broke back after facing match point | `{who} отыгрывает матчбол и возвращает брейк.` |
| broke back after facing set point | `{who} отыгрывает сетбол и возвращает брейк.` |
| broke from love-forty down | `{who} делает брейк со счёта 0:40 на приёме.` |
| will serve for set, flat register only | `Теперь она подаёт на сет.` |

The last sentence is still dropped at peak importance. `На матч` is not inferred: the existing
condition licenses only the next game being for the set.

### 17.3 Holds that deserve a row

| fact | Russian line |
| --- | --- |
| saved match points | `{who} отыгрывает {nMatchPoints} и берёт свою подачу.` |
| saved set points | `{who} отыгрывает {nSetPoints} и берёт свою подачу.` |
| held from love-forty | `{who} выбирается с 0:40 и берёт свою подачу.` |
| base counted pool | `{who} отыгрывает {nBreakPoints} и удерживает подачу.` |
| from storey 3 | `Отыграно {nBreakPoints}. {who} всё-таки берёт свою подачу.` |
| from storey 4 | `{who} удерживает подачу, отыграв {nBreakPoints}.` |

The lead labels are `Брейк!` and `Подача взята.`. `Гейм.` would lose the distinction the English
log deliberately makes between a break and a meaningful hold.

## 18. Sets, tiebreaks and match completion

### 18.1 Opening and set rows

| source | Russian draft |
| --- | --- |
| `{name} serves first.` | `Первой подаёт {name}.` |
| `{who} takes the {ordinal} set in a tiebreak.` · tiebreak set | `{who} берёт {ordinal} сет на тай-брейке.` |
| `{who} breaks to take the {ordinal} set.` · break to take set | `{who} делает брейк и берёт {ordinal} сет.` |
| `{who} serves out the {ordinal} set.` · serve out set | `{who} подаёт на {ordinal} сет и берёт его.` |
| `One set each.` · second set levels match | `Счёт по сетам равный.` |
| `{who} breaks back for six games all.` · breaks back at 6-all | `{who} возвращает брейк – 6:6.` |
| `{who} holds for six games all.` · holds at 6-all | `{who} берёт свою подачу – 6:6.` |
| `A breaker decides the set.` · tiebreak follows | `Сет решит тай-брейк.` |

`{ordinal}` is generated as an agreeing Russian ordinal (`первый`, `второй`), never by translating
an English suffix. The corresponding leads are `Сет.` and `Тай-брейк.`.

### 18.2 Stakes won

The stake is rendered as its own sentence, because Russian punctuation is cleaner than gluing an
English-style `, and …` tail to every winning mould:

| remaining before the match | Russian sentence |
| --- | --- |
| 2 | `А вместе с матчем – и титул.` |
| 4 | `И место в финале.` |
| 8 | `И место в полуфинале.` |
| 16 | `И место в четвертьфинале.` |
| larger draw | `И место в 1/{remaining / 4} финала.` |

The stage still comes from semantic draw size. Do not parse `Финал`, `Полуфинал` or a translated
round label inside commentary.

### 18.3 Normal finish

| source | Russian draft |
| --- | --- |
| `{winner} takes it in three.` | `{winner} побеждает в трёх сетах.` |
| `{winner} takes it in straight sets.` | `{winner} побеждает в двух сетах.` |
| `Match.` – lead | `Матч.` |

Append the licensed stake sentence, then a point-ending sentence from §16 and the room line from
§20. The same clause budget may remove colour, but never the victory or stake.

### 18.4 Retirement finish

| source fact | Russian draft |
| --- | --- |
| cannot continue and opponent advances | `{retired} не может продолжать. В следующий круг выходит {winner}.` |
| body explanation | `Долгий матч на уставших ногах.` |
| handshake, not winner | `Вместо удара навылет – рукопожатие.` |
| lead `Retired.` | `Снялась.` |

If a stake sentence is licensed, place it after `В следующий круг выходит {winner}.` The room stays
silent on a retirement, exactly as in English. This commentary wording and the alert in §6 describe
the same event at different densities; neither names an injury the model does not know.

## 19. Counted runs and long points

### 19.1 Point streaks

| availability | Russian variant |
| --- | --- |
| base | `{N} очков подряд выигрывает {who}.` |
| from storey 3 | `{N} очков без ответа берёт {who}.` |
| from storey 4 | `{N} очков подряд. Их все выигрывает {who}.` |

Lead: `Серия.`

### 19.2 Game runs

| availability | Russian variant |
| --- | --- |
| base | `{N} гейма подряд выигрывает {who}.` |
| from storey 3 | `{N} гейма без ответа берёт {who}.` |
| from storey 4 | `{N} гейма подряд. Все они остаются за {who}.` |

`{N} гейма` stands for a fully counted phrase (`Четыре гейма`, `Пять геймов`). The last form would
require a declined name after `за` in ordinary prose, so the runtime renderer
must instead emit **`{N} гейма подряд. Каждый из них выигрывает {who}.`**. The rejected draft is kept
here to record why a superficially shorter translation is unsafe. Lead: `Серия.`

### 19.3 Long deuce game

| variant | Russian draft |
| --- | --- |
| 1 | `{N} раз счёт доходил до «ровно». {who} всё ещё подаёт.` |
| 2 | `{N} раз «ровно», а гейм всё не окончен. {who} подаёт снова.` |
| 3 | `{N} раз «ровно». {who} всё ещё не взяла свою подачу.` |

Lead: `Ровно.` The first token remains the count. Quotation marks distinguish the score call
`«ровно»` from the ordinary adverb.

### 19.4 Long winning rally

> `{Shots} ударов, и {who} завершает розыгрыш {placement}.`

Lead: `Розыгрыш.` This row is licensed only when the final shot is a winner, so `завершает` never
turns an error into a winner.

## 20. The room

The room appears only from storey 3 and remains the first clause cut under pressure.

| moment | availability | Russian variant |
| --- | --- | --- |
| match | storey 3 | `Трибуны встают.` |
| match | storey 3 | `У сетки аплодируют обеим.` |
| match | storey 4 | `Стадион встаёт и ещё долго не стихает.` |
| set | storey 3 | `Аплодируют со всех сторон корта.` |
| set | storey 3 | `Аплодисменты ещё не стихают.` |
| set | storey 4 | `С дальней трибуны накатывает гул.` |
| tiebreak | storey 3 | `Перед ним корт затихает.` |
| tiebreak | storey 3 | `Теперь никто не встаёт со своего места.` |
| tiebreak | storey 4 | `Весь стадион встречает его стоя.` |

`Перед ним` and `его` refer to masculine `тай-брейк`; these variants cannot be shared with another
beat kind. None claims whom the crowd supports or what either player feels.

## 21. Coach at the changeover

The coach lines report presence only. `Тренер` is grammatically masculine as a role noun but does
not assert the person's gender; avoid `он`, `она`, `его` and `её` when referring to the coach.

| set just ended | Russian variant |
| --- | --- |
| daughter lost | `{who} садится на скамейку, и тренер рядом с ней.` |
| daughter lost | `{who} в кресле. Перед следующим сетом тренер рядом.` |
| daughter won | `{who} садится рядом с тренером, ведя по сетам.` |
| daughter won | `На смене сторон {who} перекидывается парой слов с тренером.` |

Lead: `У скамейки.` The English source's `her coach has a word` proves a brief exchange, but not its
content or effect. The Russian variants likewise name neither advice nor mood.

## 22. Public private-life mentions

Lead for every booth row: `Вне корта.` These are broadcast lines, not the family's diary voice.
They state only the public packet and what the English pool already licenses. `«Таинственный
мужчина»` appears only in the deliberately wrong newspaper story; true relationship lines remain
gender-neutral.

### 22.1 A relationship, reported correctly

> `{who} вышла на этот матч, а в её ложе – новое лицо. Газеты написали об этом раньше жеребьёвки.`

> `{who} снова на корте. В её ложе – новое лицо, которое всю неделю было на первых полосах.`

`Новое лицо` is intentionally impersonal. The game has no partner name, pronouns or gender to
localize.

### 22.2 A relationship, reported wrongly

> `{who} и «таинственный мужчина» – одна и та же фотография во всех газетах этой недели.`

> `На каждой первой полосе – {who} рядом с «таинственным мужчиной». Версии ни у кого не сходятся.`

The booth repeats the false public story as a statement because that sting is the mechanic. It does
not add `возможно`, correct the papers or imply that the fabricated man is real.

### 22.3 A relationship ended, reported correctly

> `Газеты пишут, что всё закончилось. {who} выходит на этот матч одна.`

> `В ложе на одно место меньше. {who} снова на первых полосах – газеты уже объяснили почему.`

`Одна` belongs to the player, who is known to be a woman. It does not gender the former partner.

### 22.4 A relationship ended, reported wrongly

> `Газеты пишут о расставании. {who} – в центре истории, но версии не сходятся.`

> `На каждой первой полосе – история о расставании и {who}. Ни одна версия не похожа на другую.`

Both keep `{who}` nominative. A tempting `у {who} всё закончилось` is rejected because arbitrary
display names cannot safely be put into the genitive.

### 22.5 A divorce, reported correctly

> `Газеты пишут: брак распался. {who} здесь, чтобы играть.`

> `На каждой первой полосе – развод. {who} всё равно предстоит матч.`

### 22.6 A divorce, reported wrongly

> `Газеты пишут о разводе. {who} – в центре истории, но версии не сходятся.`

> `На первых полосах – развод. От газеты к газете история меняется.`

No divorce line assigns blame, cost, emotion or a named spouse. The second wrong variant remains
nameless just like its English source.

## 23. Family lineage in the booth

### 23.1 Mother with professional titles

> `Эта фамилия уже была на табло. {who} продолжает семейную линию: её мать здесь побеждала.`

> `{who} знает эти коридоры с детства. Трофеи с той же фамилией принадлежат её матери.`

These are translations of the current titled pool, including its `won here`/corridor claim. Before
runtime integration, the owner should decide whether the underlying packet truly licenses venue-
specific `здесь`: `proTitles > 0` proves a professional title, not visibly a title at this event.
If it does not, the safe replacements are `её мать тоже побеждала в туре` and `профессиональные
трофеи с той же фамилией принадлежат её матери`. This is a source-honesty issue exposed by
localization, not permission to silently change English behavior.

### 23.2 Mother known on tour, without a professional cabinet

> `Эта фамилия уже была в заявочных листах. {who} – вторая в семье, кто вышла на этот уровень.`

> `{who} не первая в семье на этом корте: сначала сюда вышла её мать.`

Keep feminine `кто вышла`: the generic masculine `кто вышел` would clash with both women named by
the packet.

### 23.3 Mother with a student championship inside an existing licence

> `Мать выиграла студенческий чемпионат прежде, чем эта фамилия добралась сюда. Теперь здесь играет {who}.`

> `{who} не первая в семье на этом корте. Её мать пришла через студенческий теннис и по пути стала чемпионкой.`

`Студенческий`, never `университетский`, matches the already chosen competition vocabulary and
does not turn a college title into a professional one. No line invents the mother's first name.

## 24. Commentary rails, budgets and deterministic parity

| source | Russian |
| --- | --- |
| compact rail `S{set}` | `visible `1-й`, `2-й`, `3-й`; accessible `{ordinal} сет`` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| `Corner.` | `У скамейки.` |
| `Off court.` | `Вне корта.` |

Do not use Cyrillic `С1`: it resembles Latin `C1`, does not read naturally as `сет 1` and gives a
screen reader no useful word. If the existing rail cannot fit `1-й`, widen only the rail token, not
the commentary body.

Russian text must be remeasured rather than forced through English's raw `120`/`88` UTF-16 character
budgets as if equal character counts meant equal phone width. The semantic degradation order stays:
claim first, forward consequence second, manner/room colour last. The implementation should either
measure the rendered row at the supported phone width or establish Russian-specific limits from a
representative fixture corpus. It must never cut inside a phrase or drop the first claim.

Locale selection changes strings only. For the same stored match, both locales must preserve:

- the same beat kinds, anchors, scores and set numbers;
- the same full/key membership and priority collision winners;
- the same storey/rung additions and deterministic variant indexes;
- zero RNG reads and no change to the persisted main stream;
- the same public/private-life and lineage licences.

## 25. RU-08 verification matrix

The technical localization wave should add semantic parity tests rather than one giant Russian
snapshot:

1. Every source phrase pool has the same number of Russian entries, including additive storey 3/4
   pools and all true/wrong booth crossings.
2. Names remain byte-identical substrings of Russian output; fixtures include a Russian full name,
   a hyphenated foreign surname, an initial and an indeclinable surname.
3. Count fixtures cover 1, 2, 4, 5, 11, 21 and the upper digit fallback for points, shots, games,
   places and temperatures.
4. A second-serve ace, double fault, winner in each direction, return miss and each error direction
   exercise both manner moulds.
5. Every score-earned break/hold branch, set ending, 6:6 row, normal match finish and retirement
   finish appears once in a focused fixture.
6. W15, WTA 250, WTA 500, WTA 1000 and Slam logs retain the measured detail ladder; Russian does
   not flatten it by omitting a pool or a counted family.
7. Coach, every private-life packet and all three lineage pools render without invented names,
   gender or emotion.
8. Full and key modes, replay, skip, practice and retirement alert contain no visible English,
   including accessibility names and old stored match history.
9. Render the longest preview, retirement, deuce, lineage and booth rows at 320, 390 and 430 px;
   inspect wrapping, rail width, score collision and focus order.
10. Replay the same match twice and compare Russian beats byte for byte; then compare its semantic
    beat projection with English.

With §§1–25, RU-08 now covers the match viewer, practice/replay shell, preview and every current
commentary family. All wording remains `DRAFT` pending the owner's read.

## 26. Booth and preview corpus – ⚙ 11.10 agent-authored (бланкет); владелец правит вживую

Source: `src/viz/commentary.ts` and `src/viz/preview.ts` – every sentence the booth says during a match and every line of the pre-match intro. These are the catalogue keys of the two files that had no Russian on 11.10 (126 of 140 and 41 of 43; the rest are the rows §§11–24 already compiled – the set and tiebreak rows, `Match.`, `Corner.`, `Off court.`, `A long match on tired legs.` and the two surfaces the event card shares). §§11–23 drafted these lines as moulds and prose blocks against the 07.10 source; this section is the per-key rendering of the live source, and where a mould above says the same thing its wording is kept, so the booth does not carry two Russian voices for one sentence. Every place a row leaves a mould is named below and again in a note on the row.

### How the rows work

Each row is one catalogue key. The English cell is the key **verbatim** – a literal pipe is written `\|`, the holes are the key's own `{0}`, `{1}` – and the Russian reads the same numbered holes. There is no status column, so every row is a `DRAFT` and the blanket compile (the owner's 11.10 ruling) takes it as written. Where a hole is a number (a rank, an age, a count of places or points) the counted noun is a whole ICU message with the four branches (`one`, `few`, `many`, `other`); a number is never printed bare next to a noun. Where a hole is the engine's own English count word, the noun is not inflected – see the seams below.

### Laws applied

1. **The voice.** A neutral commentator in the present tense of the rally: short phrases, concrete nouns, nothing graded and nothing felt (§1, §20–§22). The only exclamation is RU-08's own lead `Брейк!`. The players are women (`она`, `не взяла`); the commentator has no gender (R15-7) – no first-person past anywhere.
2. **The lexicon is RU-04's and RU-08's.** `Удары навылет`, `эйс`, `двойная ошибка`, `брейк`, `брейк-пойнт`, `сетбол`, `матчбол`, `тай-брейк`, `ровно`; the surfaces `Хард` / `Грунт` / `Трава`; the rounds `Финал`, `Полуфинал`, `Четвертьфинал`, `1/8 финала` (RU-04 §12). Tournament and tier labels are the engine's own words and enter as holes (§9.5).
3. **Names are data.** Every player slot is the nominative and sits where Russian needs no ending: as the subject (`Победа – и {0} выходит в финал.`), or after a dash or a colon. A sentence that wanted `у {0}`, `шанс {0}` or `{0} предстоит` is built another way.
4. **The booth states, it does not grade.** Private-life and lineage rows say what the public packet holds and what the English pool already licenses (RU-08 §22–§23): no blame, no cost, no feeling, no name for the partner or the mother.
5. **Typography.** The short dash `–`, never the long one; `ё` wherever it belongs; `«…»` for the quoted `«ровно»` and `«таинственный мужчина»`; `·` between the round and the tier; `№` for a rank and `°C` for the day's temperature.

### Where the rows leave the moulds

- **A name where Russian needs a case.** §12.1 `Победа принесёт {firstName} титул`, §12.2 `Шанс {firstName} выиграть матч`, §12.3 `у {opponent} рейтинга пока нет` and §22.5 `{who} всё равно предстоит матч` put the name in the dative or the genitive. The rows build the sentence round a nominative subject instead (`Победа – и {0} выходит в финал.`, `{0} выходит на матч с шансом {1} на победу.`, `{2} выходит на корт совсем без рейтинга.`, `{0} всё равно играет этот матч.`).
- **The return and the groundstroke.** §16.3 gave both one sentence; the English tells them apart (`a netted return` / `a netted groundstroke`), so the rows keep it – `: приём в сетку.` against `, отправив мяч в сетку.`.
- **The clay note.** §13 says the surface notes do not name the surface and then opens the clay line with `Грунт`; the row does not.
- **A saved match point.** §17.3 adds `и берёт свою подачу`; the English `saves a match point.` says nothing of the hold, so the row does not either (the set-point and break-point rows do, as their English does).
- **The stake.** The English glues the stake to the finish with a comma; the Russian stake rows are §18.2's own sentences, each with its full stop, and the three finish frames end on that hole.
- **§23.3, first line.** §23.3 swaps the surname for the mother and drops `the second of them`; the row says what the English line says.

### Seams that are code, not translation

- **`numberWord()` and `Num()`** (`src/viz/commentary.ts`) hand the *English count word* in as the hole – `four`, `Four`, digits past twenty – to `{0} saves {1} match points.`, `{0} saves {1} set points and holds.`, `{0} saves {1} break points and holds.`, `{0} holds, {1} break points down.`, `{0} break points saved, and {1} holds on.`, the three `{0} points …` rows, the three `{0} games …` rows, the three deuce rows and the three `{0} shots, and …` rows. Russian mode prints that word inside the Russian sentence until the shared spelled-number formatter (§15) lands. A plural over such a hole cannot render – the formatter throws on a non-number, falls back to the whole English sentence and counts a miss – so these rows never inflect a noun after the count: the noun stands in the plural and the count follows it (`отыгрывает матчболы – их {1}`, `Брейк-пойнтов отыграно: {0}.`), or the count is elliptical (`{0} подряд`), or the noun does not change over the values the beat can reach (`очков` from six, `ударов` from eight). The sentences read the same when the hole becomes a Russian numeral.
- **`ordinal()`** hands `first` / `second` / `third` into the compiled rows `{0} takes the {1} set in a tiebreak.`, `{0} breaks to take the {1} set.` and `{0} serves out the {1} set.` – outside this section, the same family.
- **The occasion line** `{0} · {1}. {2}.` takes `event.roundLabel` (`stageLabel`) and `TIERS[tier].label` as strings: Russian mode prints `Semifinal · Junior Tour 300. Грунт, 18 °C.` until the two come from RU-04's catalogues (§11.1, §14); `remainingIn()` still reads the English labels back.
- **The round of {n}.** The stake rows receive `remaining / 2`, not the stage, so the fraction (`1/8`, `1/16`, `1/32`) is chosen by a `select` on the number 16 / 32 / 64 (RU-04 §12); any other value reads `следующий круг`.

### 26.1 The leads

The short tag at the head of a booth row. `Match.`, `Corner.` and `Off court.` already stand in the compiled rows; these nine are the rest. RU-08 §17–§19 chose every word (`Брейк!` and `Подача взята.` are the break and the meaningful hold, `Серия.` is both the point streak and the run of games).

| English | Russian |
| --- | --- |
| `Break!` | `Брейк!` |
| `Held.` | `Подача взята.` |
| `Set.` | `Сет.` |
| `Tiebreak.` | `Тай-брейк.` |
| `Retired.` | `Снялась.` |
| `Run.` | `Серия.` – ⚙ 11.10 тот же русский, что у очковой серии: RU-08 §19.2 называет обе «Серия.» |
| `Streak.` | `Серия.` |
| `Deuce.` | `Ровно.` |
| `Rally.` | `Розыгрыш.` |

### 26.2 The unit and where the ball goes

The nested words the point-ending sentences take in their holes: the unit of the point (`game`, `set`), the three serve placements, the three rally placements and the three ways a ball is missed. RU-08 §16.1 chose them; each stands where the sentence needs no case (`эйсом {placement}`, `{who} {miss}`).

| English | Russian |
| --- | --- |
| `game` | `гейм` |
| `set` | `сет` |
| `down the T` | `по центру` |
| `out wide` | `по диагонали` |
| `into the body` | `в корпус` |
| `down the line` | `по линии` |
| `through the middle` | `по центру` |
| `cross-court` | `кроссом` |
| `nets it` | `отправляет мяч в сетку` |
| `sends it long` | `бьёт за заднюю линию` |
| `sends it wide` | `бьёт в аут по ширине` |

### 26.3 How the deciding point ended

The compact manner mould (RU-08 §16.2): the second sentence of a break, hold or set row. `{0} ударов` opens a long rally and the count is never below eight, so the plural noun holds for every value the beat can reach. ⚙ RU-22 (11.10): the count reaches the row as the code's English word (`Num`), so the three `{0} shots` rows read it as digits and put their own plural over it – right for a rally past twenty too, which the code prints in digits already.

| English | Russian |
| --- | --- |
| `An ace {0} to finish.` | `Эйс {0} ставит точку.` |
| `An ace {0} to seal it.` | `Эйс {0} решает гейм.` |
| `It ends on a double fault.` | `Всё заканчивается двойной ошибкой.` |
| `{0} shots, and it ends with a winner {1}.` | `{0, plural, one {{0} удар} few {{0} удара} many {{0} ударов} other {{0} удара}} – и в конце удар навылет {1}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |
| `A winner {0} to end it.` | `Удар навылет {0} ставит точку.` |
| `{0} shots, and {1} ends it {2}.` | `{0, plural, one {{0} удар} few {{0} удара} many {{0} ударов} other {{0} удара}}, и {1} завершает розыгрыш {2}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |
| `{0} ends it with a winner {1}.` | `{0} завершает всё ударом навылет {1}.` |
| `A long exchange, and {0} {1}.` | `Долгий обмен, и {0} {1}.` |
| `{0} {1}.` | `{0} {1}.` – ⚙ 11.10 слоты – имя и готовая фраза из 26.2; русская строка совпадает с ключом |

### 26.4 The same point in the feed mould

RU-08 §16.3: one sentence for the ball the row's own hero struck (`Она …`, the name was said one sentence earlier) and one for the other player's (`{0} … {1}`, `{1}` is the unit from 26.2). RU-08 left the return and the groundstroke as one sentence; the rows keep the distinction the English makes, as `приём` after a colon.

| English | Russian |
| --- | --- |
| `She wins the point with an ace {0}.` | `Она выигрывает этот розыгрыш эйсом {0}.` |
| `She wins the point with a second-serve ace {0}.` | `Она выигрывает этот розыгрыш эйсом со второй подачи {0}.` |
| `She loses the point with a double fault.` | `Она проигрывает этот розыгрыш двойной ошибкой.` |
| `She wins the point with a winner {0}.` | `Она выигрывает этот розыгрыш ударом навылет {0}.` |
| `She loses the point with a netted groundstroke.` | `Она проигрывает этот розыгрыш, отправив мяч в сетку.` |
| `She loses the point with a netted return.` | `Она проигрывает этот розыгрыш: приём в сетку.` |
| `She loses the point with a long groundstroke.` | `Она проигрывает этот розыгрыш ударом за заднюю линию.` |
| `She loses the point with a long return.` | `Она проигрывает этот розыгрыш: приём за заднюю линию.` |
| `She loses the point with a wide groundstroke.` | `Она проигрывает этот розыгрыш ударом в аут по ширине.` |
| `She loses the point with a wide return.` | `Она проигрывает этот розыгрыш: приём в аут по ширине.` |
| `{0} wins the {1} with an ace {2}.` | `{0} выигрывает {1} эйсом {2}.` |
| `{0} wins the {1} with a second-serve ace {2}.` | `{0} выигрывает {1} эйсом со второй подачи {2}.` |
| `{0} loses the {1} with a double fault.` | `{0} проигрывает {1} двойной ошибкой.` |
| `{0} wins the {1} with a winner {2}.` | `{0} выигрывает {1} ударом навылет {2}.` |
| `{0} loses the {1} with a netted groundstroke.` | `{0} проигрывает {1}, отправив мяч в сетку.` |
| `{0} loses the {1} with a netted return.` | `{0} проигрывает {1}: приём в сетку.` |
| `{0} loses the {1} with a long groundstroke.` | `{0} проигрывает {1} ударом за заднюю линию.` |
| `{0} loses the {1} with a long return.` | `{0} проигрывает {1}: приём за заднюю линию.` |
| `{0} loses the {1} with a wide groundstroke.` | `{0} проигрывает {1} ударом в аут по ширине.` |
| `{0} loses the {1} with a wide return.` | `{0} проигрывает {1}: приём в аут по ширине.` |

### 26.5 Breaks

RU-08 §17.1–§17.2: the routine pool, the break back to level, and the score-earned branches. The pool grows with the storey exactly as the English does (base, from storey 3, from storey 4).

| English | Russian |
| --- | --- |
| `{0} breaks.` | `{0} делает брейк.` |
| `{0} breaks serve.` | `{0} берёт чужую подачу.` |
| `The break goes to {0}.` | `Подача соперницы проиграна. Брейк делает {0}.` |
| `The break, and it belongs to {0}.` | `Брейк – и его делает {0}.` |
| `That game is gone, and {0} has it.` | `Этот гейм на приёме берёт {0}.` |
| `{0} finds a way through the serve.` | `{0} всё-таки находит путь к брейку.` |
| `Serve broken, and {0} has it.` | `Подача проиграна. Брейк делает {0}.` |
| `{0} breaks back. Level again.` | `{0} делает обратный брейк. Снова ровно.` |
| `{0} breaks back, and the set is level.` | `{0} возвращает брейк, и счёт в сете снова равный.` |
| `{0} answers. Level again.` | `{0} отвечает обратным брейком. Снова ровно.` |
| `Straight back from {0}, and it is level.` | `{0} сразу возвращает брейк – счёт равный.` |
| `{0} breaks back from match point down.` | `{0} отыгрывает матчбол и возвращает брейк.` |
| `{0} breaks back from set point down.` | `{0} отыгрывает сетбол и возвращает брейк.` |
| `{0} breaks from love-forty down.` | `{0} делает брейк со счёта 0:40 на приёме.` |
| `She serves for the set next.` | `Теперь она подаёт на сет.` |

### 26.6 Holds that deserve a row

RU-08 §17.3. The counted forms (`saves {1} …`) take the engine's English count word as a hole (see the seams above), so the noun stands in the plural and the count follows it.

| English | Russian |
| --- | --- |
| `{0} holds from love-forty down.` | `{0} выбирается с 0:40 и берёт свою подачу.` |
| `{0} saves a match point.` | `{0} отыгрывает матчбол.` – ⚙ 11.10 RU-08 §17.3 добавляет «и берёт свою подачу»; английская строка этого не говорит |
| `{0} saves {1} match points.` | `{0} отыгрывает матчболы – их {1}.` – ⚙ 11.10 счёт – английское слово (шов кода): существительное не склоняется, счёт стоит после него |
| `{0} saves a set point and holds.` | `{0} отыгрывает сетбол и берёт свою подачу.` |
| `{0} saves {1} set points and holds.` | `{0} отыгрывает сетболы – их {1} – и берёт свою подачу.` – ⚙ 11.10 то же: счёт – английское слово, он стоит после существительного |
| `{0} saves a break point and holds.` | `{0} отыгрывает брейк-пойнт и удерживает подачу.` |
| `{0} saves {1} break points and holds.` | `{0} отыгрывает брейк-пойнты – их {1} – и удерживает подачу.` – ⚙ 11.10 то же: счёт – английское слово, он стоит после существительного |
| `A break point saved, and {0} holds on.` | `Отыгран брейк-пойнт. {0} всё-таки берёт свою подачу.` |
| `{0} break points saved, and {1} holds on.` | `Брейк-пойнтов отыграно: {0}. {1} всё-таки берёт свою подачу.` – ⚙ 11.10 слово-число открывает английскую строку с заглавной – шов кода |
| `{0} holds, a break point down.` | `{0} удерживает подачу, отыграв брейк-пойнт.` |
| `{0} holds, {1} break points down.` | `{0} удерживает подачу, отыграв брейк-пойнты – их {1}.` – ⚙ 11.10 то же: счёт – английское слово, он стоит после существительного |

### 26.7 Runs, long games and long rallies

RU-08 §19. A point streak is five points or longer (six below the WTA 1000) and a long rally ten shots or more, so `очков` and `ударов` are right for every value; a run of games starts at four and a long game at three deuces (four below the WTA 1000), where «гейма / геймов» and «раза / раз» would split, so those rows carry the count without a noun after it. ⚙ RU-22 (11.10): the count is the code's English word (`Num`); the game and deuce rows read it as the spelled Russian word (it opens the sentence on the game rows, so its capital stays), and the three point rows read it as digits under their own plural – `очков` is wrong for 21 or 22, and a streak of 24 points is a 6-0 set.

| English | Russian |
| --- | --- |
| `{0} points in a row for {1}.` | `{0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}} подряд выигрывает {1}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |
| `{0} points without reply for {1}.` | `{0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}} без ответа берёт {1}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |
| `{0} points in a row, all of them {1}'s.` | `{0, plural, one {{0} очко} few {{0} очка} many {{0} очков} other {{0} очка}} подряд. Их все выигрывает {1}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |
| `{0} games in a row for {1}.` | `{0} подряд – {1} берёт гейм за геймом.` – ⚙ 11.10 RU-08 §19.2 пишет «{N} гейма» с существительным; слово-число (шов кода) не даёт согласовать «гейма / геймов», счёт стоит без существительного |
| `{0} games without reply for {1}.` | `{0} без ответа – {1} забирает геймы один за другим.` – ⚙ 11.10 то же: существительного после счёта нет |
| `{0} games on the trot for {1}.` | `{0} подряд, и каждый гейм выигрывает {1}.` – ⚙ 11.10 то же; RU-08 §19.2 «Каждый из них выигрывает» – здесь «каждый гейм» |
| `{0} deuces in this game. {1} is still serving.` | `«Ровно» в этом гейме – {0}. {1} всё ещё подаёт.` – ⚙ 11.10 RU-08 §19.3 пишет «{N} раз»; «раза / раз» не согласовать со словом-числом, счёт стоит после тире |
| `{0} times to deuce, and it is not over. {1} goes again.` | `Гейм не окончен: «ровно» было {0}. {1} подаёт снова.` – ⚙ 11.10 то же |
| `{0} deuces. {1} has still not held it.` | `«Ровно» – {0}. {1} всё ещё не взяла свою подачу.` – ⚙ 11.10 то же |
| `{0} shots, and {1} puts it away {2}.` | `{0, plural, one {{0} удар} few {{0} удара} many {{0} ударов} other {{0} удара}}, и {1} завершает розыгрыш {2}.` – ⚙ 11.10 RU-22: счёт приходит из кода английским словом (Num) и читается цифрами; существительное согласует множественное число самой строки |

### 26.8 The match beat: what it was for, and how it ended

RU-08 §18.2–§18.4. The English glues the stake to the finish with a comma and the stake is its own seat (`and a place in the final`); the Russian stake rows are RU-08's stake sentences, each with its own full stop, and the three finish frames end on that hole.

| English | Russian |
| --- | --- |
| `and the title with it` | `А вместе с матчем – и титул.` |
| `and a place in the final` | `И место в финале.` |
| `and a place in the semifinals` | `И место в полуфинале.` |
| `and a place in the quarterfinals` | `И место в четвертьфинале.` |
| `and a place in the round of {0}` | `И место в {0, select, 16 {1/8 финала} 32 {1/16 финала} 64 {1/32 финала} other {следующем круге}}.` |
| `{0} takes it in three, {1}.` | `{0} побеждает в трёх сетах. {1}` – ⚙ 11.10 условие (RU-08 §18.2) – отдельное предложение со своей точкой, на нём рамка и кончается |
| `{0} takes it in straight sets, {1}.` | `{0} побеждает в двух сетах. {1}` – ⚙ 11.10 то же |
| `{0} cannot go on. {1} advances, {2}.` | `{0} не может продолжать. В следующий круг выходит {1}. {2}` – ⚙ 11.10 то же |
| `{0} cannot go on. {1} advances.` | `{0} не может продолжать. В следующий круг выходит {1}.` |
| `It ends with a handshake, not a winner.` | `Вместо удара навылет – рукопожатие.` |

### 26.9 The room

RU-08 §20. It appears from storey 3 and is the first clause cut under pressure. `Перед ним` and `его` refer to the masculine `тай-брейк` and belong to those two rows only.

| English | Russian |
| --- | --- |
| `The crowd is on its feet.` | `Трибуны встают.` |
| `A hand for both of them at the net.` | `У сетки аплодируют обеим.` |
| `The stadium is up, and it takes a while to settle.` | `Стадион встаёт и ещё долго не стихает.` |
| `Applause all round the court.` | `Аплодируют со всех сторон корта.` |
| `The applause goes on a while.` | `Аплодисменты ещё не стихают.` |
| `A roar off the far side of the stadium.` | `С дальней трибуны накатывает гул.` |
| `The court goes quiet for it.` | `Перед ним корт затихает.` |
| `Nobody is leaving their seat now.` | `Теперь никто не встаёт со своего места.` |
| `The whole stadium is standing for it.` | `Весь стадион встречает его стоя.` |

### 26.10 The coach at the changeover

RU-08 §21. Presence only; the role noun is masculine but asserts nothing about the person (R15-7).

| English | Russian |
| --- | --- |
| `{0} takes the chair, and her coach is down there with her.` | `{0} садится на скамейку, и тренер рядом с ней.` |
| `Her coach is in beside {0} before the next one starts.` | `{0} в кресле. Перед следующим сетом тренер рядом.` |
| `{0} sits with her coach, a set to the good.` | `{0} садится рядом с тренером, ведя по сетам.` |
| `Her coach has a word with {0} at the change of ends.` | `На смене сторон {0} перекидывается парой слов с тренером.` |

### 26.11 The booth: public private life and family line

RU-08 §22–§23. Broadcast lines, not the family's diary: only the public packet and what the English pool licenses, no blame, no cost, no feeling. The wrong-story rows repeat the story as a statement – that sting is the mechanic. Every `{0}` is the daughter's name in the nominative.

| English | Russian |
| --- | --- |
| `{0} has somebody in the box this week, and the papers had it before the draw did.` | `{0} вышла на этот матч, а в её ложе – новое лицо. Газеты написали об этом раньше жеребьёвки.` |
| `A new face in {0}'s box, and it has been on the front pages all week.` | `{0} снова на корте. В её ложе – новое лицо, которое всю неделю было на первых полосах.` |
| `The papers have {0} with a mystery man this week, all of them running the same photograph.` | `{0} и «таинственный мужчина» – одна и та же фотография во всех газетах этой недели.` |
| `A mystery man on every front page beside {0}, and no two of them tell it the same way.` | `На каждой первой полосе – {0} рядом с «таинственным мужчиной». Версии ни у кого не сходятся.` |
| `The papers say that is over now, and {0} walks out for this one on her own.` | `Газеты пишут, что всё закончилось. {0} выходит на этот матч одна.` |
| `{0}'s box is a seat lighter this week, and the front pages have already explained it.` | `В ложе на одно место меньше. {0} снова на первых полосах – газеты уже объяснили почему.` |
| `The papers have ended it for {0} this week, and no two of them tell it the same way.` | `Газеты пишут о расставании. {0} – в центре истории, но версии не сходятся.` |
| `A break-up on every front page beside {0}, and not one of them has the same story.` | `На каждой первой полосе – история о расставании и {0}. Ни одна версия не похожа на другую.` |
| `The papers say the marriage is over. {0} is here to play.` | `Газеты пишут: брак распался. {0} здесь, чтобы играть.` |
| `Every front page has the divorce. {0} still has a match to play.` | `На каждой первой полосе – развод. {0} всё равно играет этот матч.` – ⚙ 11.10 RU-08 §22.5 «{who} всё равно предстоит матч» требует дательного имени; здесь имя – подлежащее |
| `The papers have {0} getting divorced. No two versions quite agree.` | `Газеты пишут о разводе. {0} – в центре истории, но версии не сходятся.` |
| `Every front page has the divorce. The story changes from one to the next.` | `На первых полосах – развод. От газеты к газете история меняется.` |
| `The name on the board has been on it before. {0} is her mother's daughter, and her mother won here.` | `Эта фамилия уже была на табло. {0} продолжает семейную линию: её мать здесь побеждала.` |
| `{0} grew up in these corridors. The trophies with that name on them are her mother's.` | `{0} знает эти коридоры с детства. Трофеи с той же фамилией принадлежат её матери.` |
| `That surname used to be on the entry lists. {0} is the second of them to play this stage.` | `Эта фамилия уже была в заявочных листах. {0} – вторая в семье, кто вышла на этот уровень.` |
| `{0} is not the first in her family to walk out here. Her mother did it first.` | `{0} не первая в семье на этом корте: сначала сюда вышла её мать.` |
| `That surname won a student championship before it ever reached this stage. {0} is the second of them out here.` | `Эта фамилия выиграла студенческий чемпионат прежде, чем добралась до этой стадии. {0} – вторая в семье, кто вышла сюда.` – ⚙ 11.10 RU-08 §23.3 заменяет «фамилию» матерью и теряет «вторая из них»; здесь сказано то, что в английской строке |
| `{0} is not the first in her family to walk out here. Her mother came through the college game, and won it on the way.` | `{0} не первая в семье на этом корте. Её мать пришла через студенческий теннис и по пути стала чемпионкой.` |

### 26.12 The pre-match preview

RU-08 §11–§13, the ladder of four storeys. Ranks print as `№{n}`, the degree as `°C` (no plural), ages, places and points as whole ICU messages over a number hole.

| English | Russian |
| --- | --- |
| `{0} at the {1}. {2}.` | `{0} · {1}. {2}.` – ⚙ 11.10 {0} и {1} – слова движка (название раунда и уровня) – шов кода |
| `{0} at the {1}. {2}, {3} degrees.` | `{0} · {1}. {2}, {3} °C.` – ⚙ 11.10 то же |
| `A hit-out, nothing on it. {0}.` | `Тренировочный матч, ничего не разыгрывается. {0}.` |
| `A hit-out, nothing on it. {0}, {1} degrees.` | `Тренировочный матч, ничего не разыгрывается. {0}, {1} °C.` |
| `Hard court` | `Хард` |
| `Cold enough that the ball will not fly, and cold hands on the racket all afternoon.` | `Холодно: мяч почти не летит, а руки на ракетке будут мёрзнуть весь матч.` |
| `Cool, and it will take a while for either of them to feel the ball.` | `Прохладно. Обеим понадобится время, чтобы почувствовать мяч.` |
| `A comfortable day for it, and no excuses in the air.` | `Комфортная погода для матча – на воздух сослаться не получится.` |
| `Warm work out there, and the towel comes out between points.` | `На корте тепло; полотенце понадобится между розыгрышами.` |
| `Hot, and everybody is sweating before the end of the first game.` | `Жарко: все вспотеют ещё до конца первого гейма.` |
| `Across the net: {0}.` | `На другой стороне корта – {0}.` |
| `Across the net: {0}, {1}.` | `На другой стороне корта – {0}, {1, plural, one {{1} год} few {{1} года} many {{1} лет} other {{1} года}}.` |
| `Across the net: {0}, ranked #{1}.` | `На другой стороне корта – {0}, №{1} в рейтинге.` |
| `Across the net: {0}, {1}, ranked #{2}.` | `На другой стороне корта – {0}, {1, plural, one {{1} год} few {{1} года} many {{1} лет} other {{1} года}}, №{2} в рейтинге.` |
| `Nobody in the chair. They call their own lines, and the mark on the court settles it.` | `Судьи на вышке нет. Линии определяют сами, а спор решает след на грунте.` |
| `Nobody in the chair. They call their own lines, and a bad call is part of the day.` | `Судьи на вышке нет. Линии определяют сами, и ошибка на линии – часть такого дня.` |
| `A chair umpire in the seat for this one, and a live score going out.` | `На этом матче есть судья на вышке, счёт обновляется в реальном времени.` |
| `No chair umpire until the final. Today they call their own lines.` | `До финала судьи на вышке не будет. Сегодня линии определяют сами.` |
| `No chair umpire until the semifinals. Today they call their own lines.` | `До полуфинала судьи на вышке не будет. Сегодня линии определяют сами.` |
| `Chair umpire, and the match stats go on the record afterwards.` | `Судья на вышке; после матча статистика войдёт в протокол.` |
| `Chair, review, and every point of it published as it happens.` | `Судья на вышке, видеопросмотр, каждый розыгрыш публикуется в реальном времени.` |
| `Win it and {0} has the title.` | `Победа – и {0} выигрывает титул.` – ⚙ 11.10 RU-08 §12.1 «Победа принесёт {firstName} титул» требует падежа имени; здесь имя – подлежащее |
| `Win it and {0} has the title – and the round pays {1} points.` | `Победа – и {0} выигрывает титул. За победу в этом матче – {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}}.` |
| `Win it and {0} is into the final.` | `Победа – и {0} выходит в финал.` |
| `Win it and {0} is into the final – and the round pays {1} points.` | `Победа – и {0} выходит в финал. За победу в этом матче – {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}}.` |
| `Win it and {0} is into the semifinals.` | `Победа – и {0} выходит в полуфинал.` |
| `Win it and {0} is into the semifinals – and the round pays {1} points.` | `Победа – и {0} выходит в полуфинал. За победу в этом матче – {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}}.` |
| `Win it and {0} is into the quarterfinals.` | `Победа – и {0} выходит в четвертьфинал.` |
| `Win it and {0} is into the quarterfinals – and the round pays {1} points.` | `Победа – и {0} выходит в четвертьфинал. За победу в этом матче – {1, plural, one {{1} очко} few {{1} очка} many {{1} очков} other {{1} очка}}.` |
| `Win it and {0} is into the round of {1}.` | `Победа – и {0} выходит в {1, select, 16 {1/8 финала} 32 {1/16 финала} 64 {1/32 финала} other {следующий круг}}.` – ⚙ 11.10 дробь считается по числу игроков следующего круга: 16 – 1/8, 32 – 1/16, 64 – 1/32 (RU-04 §12) |
| `Win it and {0} is into the round of {1} – and the round pays {2} points.` | `Победа – и {0} выходит в {1, select, 16 {1/8 финала} 32 {1/16 финала} 64 {1/32 финала} other {следующий круг}}. За победу в этом матче – {2, plural, one {{2} очко} few {{2} очка} many {{2} очков} other {{2} очка}}.` – ⚙ 11.10 то же |
| `{0} goes in with a {1} chance of winning it.` | `{0} выходит на матч с шансом {1} на победу.` – ⚙ 11.10 RU-08 §12.2 «Шанс {firstName} выиграть матч» требует родительного имени; здесь имя – подлежащее |
| `Neither {0} nor {1} has a ranking to defend here.` | `И {0}, и {1} подходят к матчу без рейтинга на этом уровне.` |
| `{0} is unranked at this level; {1} is #{2}.` | `{0} здесь без рейтинга; {1} – №{2}.` |
| `{0} is #{1}; {2} arrives with no ranking at all.` | `{0} – №{1}; {2} выходит на корт совсем без рейтинга.` – ⚙ 11.10 RU-08 §12.3 «у {opponent} рейтинга пока нет» требует родительного имени; здесь имя – подлежащее |
| `{0} and {1} are level on the table at #{2}.` | `{0} и {1} занимают одно место – №{2}.` |
| `#{0} against #{1}: one place between them, and it is {2}'s.` | `№{0} против №{1}: между ними одно место, а выше – {2}.` |
| `#{0} against #{1}, and {2} is {3} places ahead.` | `№{0} против №{1}: {2} выше на {3, plural, one {{3} место} few {{3} места} many {{3} мест} other {{3} места}}.` |
| `A true bounce all day, and no surprises off it.` | `Отскок будет ровным весь день – без сюрпризов.` |
| `Slow and high, and the ball will bite.` | `Медленно и высоко – мяч будет цепляться за покрытие.` – ⚙ 11.10 RU-08 §13 называет «Грунт» в строке, хотя сам пишет, что заметки о покрытии его не повторяют; здесь покрытие не названо |
| `It will stay low and skid through, so the points will be short.` | `Мяч пойдёт низко и проскользит; розыгрыши будут короткими.` |

### 26.13 Rivals: the record between the two

Round 53 step 6. Names stay in the nominative (generated names cannot be declined); the counts are whole ICU plurals over a number hole. The extractor folds the her/opponent variants of one shape into one key (`{3}` and `{2}` below are whichever girl the sentence is about), so seven keys carry the nine lines. All `DRAFT`.

⚖ 22.10 владелец (лист вычитки r53): ряды этого раздела `APPROVED`, его правки перенесены.

| English | Russian |
| --- | --- |
| `{0} and {1} have met {2} times, and {3} has won every one.` | `{0} и {1} встречались {2, plural, one {{2} раз} few {{2} раза} many {{2} раз} other {{2} раза}} – и каждый раз выигрывала {3}.` |
| `This is the third time in a year that {0} and {1} have met.` | `{0} и {1} встречаются в третий раз за год.` |
| `{0} and {1} have played before, and {2} won the last one.` | `{0} и {1} уже играли: в прошлый раз выиграла {2}.` |
| `The last time {0} and {1} met, it went to three sets.` | `{0} и {1} встречались и раньше – тот матч продлился три сета.` |
| `The last time {0} and {1} met, it was settled in straight sets.` | `{0} и {1} встречались и раньше – тот матч закончился в двух сетах.` |
| `Coming in, the head-to-head reads {0} {1}, {2} {3}.` | `Личные встречи до этого матча: {0} – {1}, {2} – {3}.` |
| `{0} and {1} have already met {2} times in the past year.` | `{0} и {1} уже встречались за последний год {2, plural, one {{2} раз} few {{2} раза} many {{2} раз} other {{2} раза}}.` |

## ⚙ 11.10 agent-authored (бланкет) – the match controls and the score readout

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

6 keys: the three group labels of `MatchControls.vue`, the retired-hurt prefix and the set tag of `MatchViewer.vue`, and the points-played readout of `matchReadout.ts`. `She retired hurt at` is a bare prefix – the score and the reason are written by the template after it (RU-08's `QUESTION` row had the score inside the sentence); `S{0}` is `{0}-й`, the visible form RU-08 chose.

| id | English | Russian |
| --- | --- | --- |
| RU21-MTV-01 | `How much of the match to watch` | `Сколько матча смотреть` |
| RU21-MTV-02 | `Playback speed` | `Скорость воспроизведения` |
| RU21-MTV-03 | `What to shout` | `Что крикнуть` |
| RU21-MTV-04 | `She retired hurt at` | `Она снялась из-за травмы при счёте` |
| RU21-MTV-05 | `S{0}` | `{0}-й` |
| RU21-MTV-06 | `{0} points played` | `Сыграно {0, plural, one {{0} розыгрыш} few {{0} розыгрыша} many {{0} розыгрышей} other {{0} розыгрыша}}` |
