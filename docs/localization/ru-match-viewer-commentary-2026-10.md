---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
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
| shout picker aria | `Выберите реплику` |
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
| elapsed-clock aria | `Время матча: {clock}` |
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
| momentum chart aria | `Ход матча: {caption}` |
| empty log | `Разминка. Первый мяч уже летит.` |

The seven momentum phrases describe the match probability from her side, not confidence or mood.
`Почти выиграла` may appear only for the same `p >= 0.9` band as English; it is not a final score.

Percent values remain locale-formatted integers. Break-point pairs keep tennis order
`реализовано/всего`, but their accessible name should expand it, for example `2 из 5 брейк-пойнтов
реализовано`, rather than asking speech output to infer the slash.

## 6. Retirement alert

| source | Russian |
| --- | --- |
| `{name} could not continue.` | `{name} не смогла продолжить.` |
| `She retired hurt at {score}.` | `Она снялась при счёте {score}.` |
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
| `Avg rally {rally} shots · ~{duration}` | `В среднем {rally} удара за розыгрыш · около {duration}` |

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
| `vs` – compact | `против` |
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
| tiebreak set | `{who} берёт {ordinal} сет на тай-брейке.` |
| break to take set | `{who} делает брейк и берёт {ordinal} сет.` |
| serve out set | `{who} подаёт на {ordinal} сет и берёт его.` |
| second set levels match | `Счёт по сетам равный.` |
| breaks back at 6-all | `{who} возвращает брейк – 6:6.` |
| holds at 6-all | `{who} берёт свою подачу – 6:6.` |
| tiebreak follows | `Сет решит тай-брейк.` |

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
| `takes it in three` | `{winner} побеждает в трёх сетах.` |
| `takes it in straight sets` | `{winner} побеждает в двух сетах.` |
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
| compact rail `S{set}` | visible `1-й`, `2-й`, `3-й`; accessible `{ordinal} сет` |
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
