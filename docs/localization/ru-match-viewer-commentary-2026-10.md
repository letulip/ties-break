---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
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
| `Every point` / `Full` | `Все розыгрыши` | `Все` |
| `Key points only` / `Key` | `Только ключевые розыгрыши` | `Ключевые` |

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
| `Watch again ↻` | `Смотреть снова ↻` |
| shout picker aria | `Выберите реплику` |
| `Shout 📣` | `Крикнуть 📣` |

The skip remains a link-like action outside the viewing-mode switch. It ends viewing; it is not a
third resolution beside `Все` and `Ключевые`.

## 3. Parent shouts

| English source | Russian draft |
| --- | --- |
| `Still here.` | `Я рядом.` |
| `Take your time.` | `Не спеши.` |
| `I saw that.` | `Я видел.` |
| `Next one.` | `Следующий мяч.` |
| `Drink something.` | `Попей воды.` |
| `Enjoy it.` | `Играй в удовольствие.` |

The parent's masculine `видел` follows the album and project narrator. These lines are spoken to
the daughter, so intimate imperatives are correct. They remain presentation-only: localization must
not imply a tactical instruction or a guaranteed effect on the already-resolved match.

## 4. Court chrome and player rows

| source | Russian |
| --- | --- |
| live badge `Live` | `Идёт` |
| elapsed-clock aria | `Время матча: {clock}` |
| speed unit `km/h` | `км/ч` |
| tiebreak marker `TB` | `ТБ` |
| player suffix `· serving` | `· подаёт` |

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
| `Winners` | `Удары навылет` |
| `Unforced errors` | `Невынужденные ошибки` |
| `Max serve` | `Макс. скорость подачи` |
| `{speed} km/h` | `{speed} км/ч` |
| `Avg rally {rally} shots · ~{duration}` | `В среднем {rally} удара за розыгрыш · около {duration}` |

`{rally}` uses a Russian decimal comma and counted form: `1,0 удара`, `2,4 удара`, `5,0 удара`.
The value is an average, so plural-category agreement on the decimal is not copied from integer
grammar. Duration uses the shared compact time formatter (`1 ч 24 мин`), not a translated English
duration string.

## 8. Practice match flow

| source | Russian |
| --- | --- |
| `Practice match` | `Тренировочный матч` |
| header `To result` | `К результату` |
| `Friendly at the club` | `Тренировочный матч в клубе` |
| compact `vs` | `против` |
| `sparring partner` | `спарринг-партнёр` |
| `No ranking points` | `Без рейтинговых очков` |
| `Skip to result` | `Сразу к результату` |
| `Watch it` | `Смотреть матч` |
| viewer proceed `To the result` | `К результату` |
| `Win` | `Победа` |
| `Loss` | `Поражение` |
| `{kid} vs {opp} · practice – no ranking points` | `{kid} против {opp} · тренировочный матч · без рейтинговых очков` |
| `Watch again` | `Смотреть снова` |
| `Done` | `Готово` |

The rankless opponent remains rankless. `Спарринг-партнёр` is a role, not a generated person name,
and must not pass through the name-shortening formatter.

## 9. Replay shell

| source | Russian |
| --- | --- |
| default title `Match replay` | `Повтор матча` |
| close accessible name `Close replay` | `Закрыть повтор` |
| close tooltip `Close` | `Закрыть` |

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
