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
