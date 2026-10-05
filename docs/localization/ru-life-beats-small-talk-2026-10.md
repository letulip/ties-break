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

## 6. Situation R45 – `practice-clicked`

Subject `good-news`; stages `school`, `after-school`, `college`, `independent`; no fact gate. This is
the first runtime row and must remain first in the localized catalogue.

### 6.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Practice was easy today. Properly easy. I've no idea why and I don't want to jinx it."` | `«Сегодня на тренировке всё было легко. По-настоящему. Не знаю, почему, и боюсь сглазить».` |
| fiery | `"Practice was easy today and I'd like to know who to thank, because it wasn't me."` | `«Сегодня тренировка далась легко. Хочу знать, кого благодарить. Себя точно не за что».` |
| deep | `"Practice finally felt easy today."` | `«Сегодня тренировка наконец далась легко».` |
| quiet | `"Practice was easy today. I thought I'd mention it."` | `«Сегодня тренировка далась легко. Решила упомянуть».` |

### 6.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what made it good` | `Спросить, что именно получилось` |
| respond | `Tell her we're glad` | `Сказать, что мы рады` |
| space | `Let her enjoy it` | `Дать ей порадоваться` |

### 6.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Nothing! That's the best part. It just went, and I'm not going to interrogate it."` | `«Ничего! В этом и прелесть. Просто пошло – и я не стану разбирать, почему».` |
| sunny | respond | `"I knew you would be. I wanted to say it before it wore off."` | `«Я знала, что ты порадуешься. Хотела сказать, пока это чувство не прошло».` |
| sunny | space | `"Don't worry. I'm keeping this one for a rainy day."` | `«Не переживай. Я оставлю это про запас – на трудный день».` |
| fiery | invite | `"Nothing changed. Same drills, same court, and this time it felt easy. I'd like to know why."` | `«Ничего не изменилось. Те же упражнения, тот же корт – а было легко. Почему?»` |
| fiery | respond | `"Good. Somebody should be, because tomorrow it'll probably be awful again."` | `«Хорошо. Кто-то же должен радоваться: завтра всё наверняка снова будет ужасно».` |
| fiery | space | `"I intend to. And I'm writing down what I did, in case."` | `«Ещё как. И на всякий случай запишу всё, что делала».` |
| deep | invite | `"Nothing I can name. I just stopped fighting it. I wanted to tell someone who'd know that's rare."` | `«Ничего, что можно назвать. Просто перестала бороться. Хотела рассказать тому, кто знает, как редко так бывает».` |
| deep | respond | `"Maybe it doesn't sound like much. It felt like a lot."` | `«Может, звучит как мелочь. Для меня – нет».` |
| deep | space | `"I will. I only wanted to say it out loud once."` | `«Порадуюсь. Просто хотела один раз сказать это вслух».` |
| quiet | invite | `"Nothing in particular. It just felt easier than usual."` | `«Ничего особенного. Просто было легче обычного».` |
| quiet | respond | `"Thanks. It was a good one."` | `«Спасибо. Хорошая была тренировка».` |
| quiet | space | `"I will. It'll do for the week."` | `«Порадуюсь. На эту неделю хватит».` |

The sunny response uses intimate `ты` because she directly addresses the parent. `Про запас – на
трудный день` keeps the source image without predicting a specific bad event. No reply changes bond
or another mechanic.

## 7. Situation R46 – `line-call`

Subject `worry`; stages `school`, `after-school`; fact gate `played-recently`. The copy may say that
a line decision was wrong, but it may not invent a chair umpire, line judge or electronic system.

### 7.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"There was a call today that was wrong and I can't seem to put it down."` | `«Сегодня мяч на линии засчитали неправильно, и я никак не могу это отпустить».` |
| fiery | `"There was a call today that was just wrong."` | `«Сегодня мяч на линии засчитали неправильно. Просто неправильно».` |
| deep | `"One call today was wrong, and I have replayed it more than anything else that happened."` | `«Сегодня мяч на линии засчитали неправильно. Его я прокручиваю чаще, чем всё остальное за день».` |
| quiet | `"There was a call today I didn't agree with. It's still there."` | `«Сегодня я не согласилась с решением на линии. Оно всё ещё со мной».` |

### 7.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Let her keep going` | `Дать ей продолжить` |
| respond | `Tell her what worries us` | `Сказать, что нас тревожит` |
| space | `Say she needn't solve it tonight` | `Сказать, что сегодня это можно не решать` |

### 7.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"It was in. I saw it. Everyone near it saw it. And that's that, apparently."` | `«Мяч был в корте. Я видела. Все рядом видели. Но, видимо, на этом всё».` |
| sunny | respond | `"That's fair. I don't want to be the one who's still on about it next week."` | `«Справедливо. Не хочу на следующей неделе всё ещё говорить об этом».` |
| sunny | space | `"Good. I'll be annoyed about it in the morning instead."` | `«Хорошо. Тогда позлюсь из-за этого утром».` |
| fiery | invite | `"And I know I'm supposed to move on. I replayed it the whole way home instead."` | `«Знаю, надо идти дальше. А я всю дорогу домой прокручивала это».` |
| fiery | respond | `"I hear you. I don't want it in my head for the next one either."` | `«Понимаю. Мне тоже не нужно это в голове перед следующим матчем».` |
| fiery | space | `"Yeah. Okay. Tomorrow."` | `«Да. Ладно. Завтра».` |
| deep | invite | `"I keep going back to the same second of it. Not the point. The second."` | `«Возвращаюсь к одной секунде. Не к розыгрышу. К секунде».` |
| deep | respond | `"You're right, and knowing you're right is not the same as being able to stop."` | `«Да, это верно. Но знать это – не значит уметь остановиться».` |
| deep | space | `"No. I'd only take it apart again and find the same thing in it."` | `«Нет. Я только снова разберу это по частям и найду то же самое».` |
| quiet | invite | `"It was in. I've stopped saying so out loud."` | `«Мяч был в корте. Я уже перестала говорить это вслух».` |
| quiet | respond | `"I know. I'll put it down before the next one."` | `«Знаю. Отпущу до следующего матча».` |
| quiet | space | `"All right. I'll leave it where it is."` | `«Хорошо. Оставлю как есть».` |

`Да, это верно` translates `You're right` without assigning a gender to the player-parent. The two
references to a next match are conversational readings of `the next one`; they make no schedule,
entry or date claim.

## 8. Situation R47 – `march-entry`

Subject `decision`; stages `school`, `after-school`; fact gate `march-entry-open`. The gate already
proves that a decision is still possible; the copy must not promise time after the entry deadline.

### 8.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I'm not sure about the March tournament. Can we talk about it now, before I forget?"` | `«Я не уверена насчёт мартовского турнира. Обсудим сейчас, пока я не забыла?»` |
| fiery | `"I don't think I want to do the March tournament. Ask me again in an hour, obviously."` | `«Кажется, я не хочу играть мартовский турнир. Разумеется, через час спроси снова».` |
| deep | `"I've been turning the March tournament over and I still cannot get to an answer."` | `«Я всё возвращаюсь к мартовскому турниру и никак не могу решить».` |
| quiet | `"I'm not sure about the March tournament."` | `«Я не уверена насчёт мартовского турнира».` |

### 8.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she's weighing` | `Спросить, между чем она выбирает` |
| respond | `Say the travelling matters too` | `Сказать, что дорогу тоже надо учитывать` |
| space | `Say there's time to decide` | `Сказать, что время на решение ещё есть` |

### 8.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"The travelling, mostly. And whether I'd rather be at training. It's not more complicated than that."` | `«В основном дорогу. И не лучше ли остаться на тренировках. Всё не сложнее».` |
| sunny | respond | `"That helps, actually. I was only counting what I'd lose by going."` | `«Вообще-то помогает. Я считала только, что потеряю, если поеду».` |
| sunny | space | `"There is. I'll stop bringing it up at dinner, I promise."` | `«Есть. Обещаю больше не заводить этот разговор за ужином».` |
| fiery | invite | `"The trip. The training I'd miss. And everybody asking me what I've decided."` | `«Поездку. Пропущенные тренировки. И всех, кто спрашивает, что я решила».` |
| fiery | respond | `"Fine. Then it's the travelling against the training and I still have to pick one."` | `«Ладно. Значит, дорога или тренировки, а выбирать всё равно мне».` |
| fiery | space | `"There's time. I'd rather decide now and be wrong than carry it about."` | `«Время есть. Лучше решу сейчас и ошибусь, чем буду таскать это с собой».` |
| deep | invite | `"The trip against the training, and the part where I don't know which answer I'd regret."` | `«Дорога или тренировки – и неизвестно, о каком выборе я пожалею».` |
| deep | respond | `"I hadn't put it on that side of the list. It changes the shape of it."` | `«Я не учитывала это с этой стороны. Теперь всё выглядит иначе».` |
| deep | space | `"There is. I'm not sure more time makes it a different question."` | `«Есть. Не уверена, что от лишнего времени вопрос станет другим».` |
| quiet | invite | `"It's a long trip. I'd miss Tuesday training. I'm not sure it's worth it."` | `«Дорога длинная. Пропущу тренировку во вторник. Не уверена, что турнир того стоит».` |
| quiet | respond | `"That's the bit I keep coming back to."` | `«К этому я всё время и возвращаюсь».` |
| quiet | space | `"I'll look at it again on Sunday."` | `«В воскресенье посмотрю ещё раз».` |

The fiery opener's `спроси` is intimate daughter-to-parent address. No branch says which choice is
correct; all three remain zero-bond texture and the actual tournament decision stays on its existing
mechanical surface.

## 9. Situation-corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 3 / 51 | 57 / 969 | 0 / 4 | R45–R47 complete as DRAFT |
