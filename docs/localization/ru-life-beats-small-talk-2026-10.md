---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-10 – Life beats and small talk

## 1. Runtime boundary

This document translates the current player-facing life-beat runtime, not every historical proposal
in `docs/notes/life-beats/`. Runtime authority is the typed copy modules under
`src/engine/world/lifeBeat/`, the hub in `src/engine/world/lifeBeat.ts` and the generated small-talk
projection in `src/engine/world/smallTalkCorpus.ts`.

The generated small-talk file is never edited by hand. Its English authority is
`docs/specs/small-talk-corpus-2026-09.md`, and the existing emitter pins that document to runtime.
Russian needs an equivalent generated projection or a locale column in the same source document;
manual transcription of 969 strings would recreate the drift that generation removed.

Current small-talk shape:

| layer | current size | Russian state |
| --- | ---: | --- |
| situations | 51 | open |
| per-voice openers | 204 | open |
| shared stance labels | 153 | open |
| per-voice replies | 612 | open |
| shared second beats | 4 | open |
| authored situation strings | 969 + 4 | open |
| presence frames | 18 | drafted below |
| save-compatible legacy opener cells | 23 | drafted below |
| legacy headings/card/fallback labels | 7 | drafted below |

All Russian wording in this document is `DRAFT`. Locale may alter only rendered copy. Situation id,
subject, stage/fact licence, voice, stance id, recent-exclusion logic and every purpose-scoped draw
remain byte-for-byte independent of locale.

## 2. Presence frames – 18 lines

The frame places the parent in a channel or room. It never changes the quoted daughter utterance.
`roof` means school/after-school under the family roof; `away` means college/independent distance,
not a tournament week.

### 2.1 Roof – nine

| id | English source | Russian draft |
| --- | --- | --- |
| `kettle` | `She put the kettle on.` | `Она поставила чайник.` |
| `bag-down` | `She was straight into it before her bag was down.` | `Заговорила ещё до того, как поставила сумку.` |
| `shoes` | `She was halfway out of her shoes when she started.` | `Ещё не успела разуться, а уже начала.` |
| `cupboard` | `She said it to the cupboard door, putting things away.` | `Говорила с дверцей шкафа, убирая вещи.` |
| `doorway` | `She started it in the doorway and finished it sitting down.` | `Начала в дверях, закончила уже сидя.` |
| `table` | `She stopped beside the kitchen table and said it.` | `Остановилась у кухонного стола и сказала.` |
| `sofa` | `She sat on the arm of the sofa and began.` | `Села на подлокотник дивана и начала.` |
| `phone-counter` | `She set her phone on the counter and started talking.` | `Положила телефон на столешницу и заговорила.` |
| `fridge` | `She talked at the open fridge for a while.` | `Некоторое время говорила в открытый холодильник.` |

### 2.2 Away – nine

| id | English source | Russian draft |
| --- | --- | --- |
| `call-middle` | `She mentioned it halfway through the call.` | `Заговорила об этом в середине звонка.` |
| `call-open` | `She opened the call with it.` | `Начала звонок с этого.` |
| `call-late` | `She said it near the end of the call.` | `Сказала ближе к концу звонка.` |
| `voice-note` | `She sent it in a voice note.` | `Сказала об этом в голосовом.` |
| `whole-message` | `She sent it as the whole message.` | `Это и было всё сообщение.` |
| `other-message` | `She added it to a message about something else.` | `Добавила это в сообщение о чём-то другом.` |
| `mid-something` | `She said it in the middle of something else.` | `Сказала это посреди другого дела.` |
| `visit` | `She brought it up when she came by.` | `Заговорила об этом, когда пришла.` |
| `ceiling` | `She said it with the camera pointing at the ceiling.` | `Сказала это, пока камера смотрела в потолок.` |

The ids are persisted and append-only. Russian stores no localized id in a save. The same selected
frame id resolves to the locale's frame at read time.

## 3. Save-compatible legacy openers – 23 presence cells

The quotation is identical across roof and away. Only the lead changes. The one missing cell – sunny
joy away – is an intentional source ruling, not a translation gap.

| voice/subject | roof lead | away lead | shared daughter quote |
| --- | --- | --- | --- |
| sunny/worry | `Пришла и без приглашения села.` | `Не повесила трубку, когда разговор уже закончился.` | `«У меня всю неделю кое-что из головы не выходит. Кажется, надо сказать вслух».` |
| sunny/joy | `Сказала раньше, чем кто-то успел спросить, как прошла неделя.` | — | `«На этой неделе кое-что получилось. До сих пор улыбаюсь».` |
| sunny/question | `За ужином сначала рассказала всё вокруг, потом спросила.` | `Оставила вопрос на конец звонка, сначала рассказав всё вокруг.` | `«Можно тебя кое о чём спросить? Не срочно, просто хочу знать».` |
| fiery/worry | `Вошла и сразу начала.` | `Позвонила не в обычное время и сразу начала.` | `«Меня кое-что не отпускает. И я не могу оставить это в покое».` |
| fiery/joy | `Заговорила, ещё ничего не положив на место.` | `В голосовом не было даже „привет“.` | `«Хороший день. Правда хороший. Мне такой был нужен».` |
| fiery/question | `Спросила, едва сев.` | `Позвонила и спросила, не дожидаясь конца приветствия.` | `«Хочу тебя кое о чём спросить. И хочу прямой ответ».` |
| quiet/worry | `Осталась на кухне после того, как убрали тарелки.` | `Добавила это в самый конец обычного сообщения.` | `«Я всё возвращаюсь к одной вещи».` |
| quiet/joy | `Поставила чайник и сказала между делом.` | `Упомянула посреди разговора о другом.` | `«Сегодня всё прошло хорошо».` |
| quiet/question | `Спросила, расставляя вещи на полке и не оборачиваясь.` | `Спросила перед самым прощанием.` | `«Можно тебя кое о чём спросить?»` |
| deep/worry | `Дождалась, пока в комнате станет тихо.` | `Позвонила поздно и долго подходила к этому.` | `«Что-то не так. Пока не знаю, что. Дальше я ещё не разобралась».` |
| deep/joy | `Сказала на ходу и не остановилась.` | `Сообщение пришло без просьбы ответить.` | `«Хорошая неделя. Она была мне нужна».` |
| deep/question | `Сначала дождалась, пока комната опустеет.` | `Дождалась почти самого конца звонка.` | `«Хочу тебя кое о чём спросить».` |

The daughter uses intimate `ты` only where the English actually addresses the parent. Do not add an
address to the other lines. Russian outer/inner quotation marks are already resolved in the fiery
joy away cell.

## 4. Legacy headings, invitation and neutral stances

### 4.1 Parent headings

| register | English source | Russian draft |
| --- | --- | --- |
| bright | `She came to us with something good this week` | `На этой неделе она пришла к нам с чем-то хорошим` |
| level | `She came to us with something this week` | `На этой неделе она пришла к нам поговорить` |
| low | `She came to us with something on her mind` | `На этой неделе она пришла с тем, что её тревожит` |

### 4.2 Soft card

| English source | Russian draft |
| --- | --- |
| `She came by with something small.` | `Она заглянула поговорить о чём-то небольшом.` |

### 4.3 Legacy neutral response labels

| option id | English source | Russian draft |
| --- | --- | --- |
| `more` | `Ask her to say more` | `Попросить рассказать ещё` |
| `view` | `Tell her what we think` | `Сказать, что мы думаем` |
| `easy` | `Tell her it can keep` | `Сказать, что это может подождать` |

These three options remain literal zero-bond choices. Russian must not turn one into a recommended
or emotionally safer answer. New situations use their authored stance labels instead of these
fallback labels.

## 5. Next authored slice

Translate the 51 generated situations from the owner document in stable row order, starting with
the eight rows deliberately placed first in the runtime draw. For every row preserve:

- id, subject, stage list and fact gate;
- four voice openers;
- exactly three shared stance ids/labels;
- twelve voice-specific replies;
- any shared second beat;
- source order, because the deterministic draw indexes the filtered array.

Each completed row therefore has 4 openers + 3 labels + 12 replies = 19 ordinary authored strings,
plus a shared second beat only where the row defines one.
