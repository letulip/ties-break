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

## 9. Situation R48 – `coach-real`

Subject `curiosity`; stages `school`, `after-school`; fact gate `coach-employed`. A hired coach
exists, but the generated coach's gender is not available to the copy. The daughter asks whether
kindness is also good coaching; no branch declares the coach good or bad.

### 9.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"How do you know when you've got a real coach and not just a nice one?"` | `«Как понять, у тебя хороший тренер или просто приятный человек?»` |
| fiery | `"I want to know whether my coach is actually good, and nobody will give me a straight answer."` | `«Хочу понять, действительно ли мой тренер хорош, а прямого ответа никто не даёт».` |
| deep | `"I've been working out the difference between a coach who is kind and one who is good."` | `«Я пытаюсь понять разницу между добротой тренера и умением тренировать».` |
| quiet | `"How does anyone tell a good coach from a nice one?"` | `«Как вообще отличить хорошего тренера от приятного человека?»` |

### 9.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what made her wonder` | `Спросить, почему она об этом задумалась` |
| respond | `Say a good coach explains what they're changing` | `Сказать, что хороший тренер объясняет, что меняет` |
| space | `Say she doesn't have to work it out now` | `Сказать, что сейчас не обязательно разбираться` |

### 9.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Mine's lovely. Everyone's lovely. I can't tell if that's the same as good."` | `«Со мной все такие милые. Только я не понимаю, значит ли это, что меня хорошо тренируют».` |
| sunny | respond | `"Okay. I'll ask why next time, not just what."` | `«Хорошо. В следующий раз спрошу не только что, но и почему».` |
| sunny | space | `"All right. I'll go back to enjoying the nice one for a bit."` | `«Ладно. Пока просто порадуюсь, что со мной по-доброму».` |
| fiery | invite | `"Everybody's nice. Nice is easy. I'd like to know what I'm actually being taught."` | `«Все милые. Быть милым легко. Я хочу понимать, чему меня на самом деле учат».` |
| fiery | respond | `"Right. Then I'm asking why on Tuesday and I'm not letting it go."` | `«Хорошо. Во вторник спрошу почему и не отстану».` |
| fiery | space | `"Fine. But I'm coming back to this one."` | `«Ладно. Но я к этому ещё вернусь».` |
| deep | invite | `"Nothing happened. I noticed I have no way of telling, and that bothered me."` | `«Ничего не случилось. Просто поняла, что не умею это различать. Теперь не выходит из головы».` |
| deep | respond | `"That's something I can actually check. I hadn't thought of it as checkable."` | `«Вот это уже можно проверить. Я не думала, что здесь есть что проверять».` |
| deep | space | `"No. I'd still like to know, and I think I'll keep asking myself."` | `«Нет. Я всё равно хочу знать. Наверное, буду ещё об этом думать».` |
| quiet | invite | `"No reason. It came up and stayed."` | `«Без причины. Вопрос появился и остался».` |
| quiet | respond | `"That's useful. I'll listen for it."` | `«Полезно. Буду слушать, что мне объясняют».` |
| quiet | space | `"No. I'll see what happens at the next session."` | `«Нет. Посмотрю, что будет на следующем занятии».` |

The sunny `у тебя` is a generic way of asking the parent how one can know, not a claim that the
parent has a coach. No Russian reply inflects or genders the generated coach.

## 10. Situation R49 – `watching-players`

Subject `observation`; stages `college`, `independent`; no fact gate. The daughter describes a
pattern she has noticed, without claiming that all players behave alike.

### 10.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The players I've been watching hardly mention winning. I keep waiting for it and it never comes."` | `«Я наблюдаю за игроками, и они почти не говорят о победах. Всё жду, когда заговорят, но нет».` |
| fiery | `"Nobody I've been watching talks about winning. Not one of them. I find that genuinely annoying."` | `«Никто из тех, за кем я слежу, не говорит о победах. Ни одна. Меня это жутко раздражает».` |
| deep | `"The players I've been watching barely talk about winning."` | `«Игроки, за которыми я наблюдаю, почти не говорят о победах».` |
| quiet | `"The players I've been watching talk about other things. Not winning."` | `«Те, за кем я наблюдаю, говорят о другом. Не о победах».` |

### 10.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask her to go on` | `Попросить рассказать ещё` |
| respond | `Say we've noticed it too` | `Сказать, что мы тоже это заметили` |
| space | `Let the thought settle` | `Дать мысли улечься` |

### 10.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"They talk about what they're working on. Never the result. It's so odd once you hear it."` | `«Говорят о том, над чем работают. О результате – никогда. Как услышишь, сразу кажется странным».` |
| sunny | respond | `"Have you? Good. I'd started to think I was inventing the whole thing."` | `«Ты тоже? Хорошо. А то я уже думала, что всё это придумала».` |
| sunny | space | `"I will. I'll probably still be watching for it next week."` | `«Пусть. Наверное, и на следующей неделе буду за этим следить».` |
| fiery | invite | `"They talk about drills. Drills! Not one of them mentions the scoreboard."` | `«Говорят об упражнениях. Об упражнениях! Ни одна даже счёт не упоминает».` |
| fiery | respond | `"Then why does nobody say it out loud? Everyone acts like the score is the point."` | `«Тогда почему никто не говорит об этом вслух? Все ведут себя так, будто главное – счёт».` |
| fiery | space | `"It's settled. I've decided they're right and everyone else has it backwards."` | `«Уже улеглась. Я решила, что они правы, а остальные всё поняли наоборот».` |
| deep | invite | `"They talk about Tuesday. What they're working on next. I've started noticing that."` | `«Говорят про вторник. Про то, над чем будут работать дальше. Я стала это замечать».` |
| deep | respond | `"You have? I thought I might be reading too much into it."` | `«Ты тоже? А я думала, что придаю этому слишком много значения».` |
| deep | space | `"Mm. I'll keep watching."` | `«Угу. Продолжу наблюдать».` |
| quiet | invite | `"Mostly what's next. What they're fixing. That sort of thing."` | `«В основном о том, что дальше. Что исправляют. Примерно так».` |
| quiet | respond | `"You have? I wasn't sure it was a real thing."` | `«Ты тоже? Я не была уверена, что это правда заметно».` |
| quiet | space | `"All right. I'll keep an eye on it."` | `«Хорошо. Ещё понаблюдаю».` |

The fiery `ни одна` follows the female players in the situation. The parent-facing `ты` in two
responses keeps the daughter's direct address; the UI labels keep the established neutral voice.

## 11. Situation R50 – `court-four`

Subject `story`; stages `school`, `after-school`; no fact gate. This row contains four voice-specific
shared second beats after the opener, before the parent's stance. They are counted separately from
the 19 ordinary strings.

### 11.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"You have to hear what happened on court four."` | `«Ты только послушай, что было на четвёртом корте».` |
| fiery | `"You won't believe what happened on court four."` | `«Ты не поверишь, что было на четвёртом корте».` |
| deep | `"The best thing today had nothing to do with tennis."` | `«Лучшее за сегодня вообще не про теннис».` |
| quiet | `"Something happened on court four today."` | `«Сегодня на четвёртом корте кое-что случилось».` |

### 11.2 Shared second beats

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Someone's serve clipped the net cord and went straight into a dad's coffee. A full one. He just sat there holding it."` | `«Чья-то подача задела трос сетки – и мяч угодил прямо в кофе одного папы. Полный стакан. А он так и сидел с ним в руке».` |
| fiery | `"She serves, the ball catches the net cord – and lands in a dad's coffee. Full cup. He just looked at it."` | `«Она подаёт, мяч задевает трос сетки – и падает в кофе одного папы. Полный стакан! А он только смотрит».` |
| deep | `"A serve clipped the net cord and went into a dad's coffee. Full cup. He looked at it for a long time."` | `«Подача задела трос сетки, и мяч попал в кофе одного папы. Полный стакан. Он долго на него смотрел».` |
| quiet | `"A serve caught the net cord and landed in someone's dad's coffee. A whole cup of it."` | `«Подача задела трос сетки, и мяч попал в кофе чьего-то папы. Целый стакан».` |

### 11.3 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what he did` | `Спросить, что он сделал` |
| respond | `Laugh with her` | `Посмеяться вместе с ней` |
| space | `Let her finish` | `Дать ей закончить` |

### 11.4 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Put the lid back on. Very carefully. Like the lid was the problem."` | `«Накрыл стакан крышкой. Очень аккуратно. Будто дело было в крышке».` |
| sunny | respond | `"I know! And I had to serve after that. I was still going."` | `«Вот именно! А мне после этого надо было подавать. Я всё ещё хихикала».` |
| sunny | space | `"Anyway. Nobody asked for the ball back. That's my favourite part."` | `«В общем, никто не попросил мяч обратно. Вот это мне больше всего нравится».` |
| fiery | invite | `"Took the ball out. Put the lid on. Like that would stop the next one."` | `«Вынул мяч. Закрыл стакан крышкой. Будто это спасёт от следующего».` |
| fiery | respond | `"Exactly! And then I had to serve. I couldn't look at him."` | `«Вот! А потом мне пришлось подавать. Я на него смотреть не могла».` |
| fiery | space | `"Anyway, nobody wanted the ball back. That's the important part."` | `«Короче, мяч никто не захотел забирать. Вот что главное».` |
| deep | invite | `"Put the lid back on. I think he wanted the morning back and the lid was the nearest thing."` | `«Закрыл стакан крышкой. Наверное, хотел вернуть себе утро, а под рукой была только крышка».` |
| deep | respond | `"I didn't laugh then. I had to serve next. I have been laughing about it since."` | `«Тогда я не смеялась. Следующей подавать было мне. Зато с тех пор смеюсь».` |
| deep | space | `"That's the whole of it. The ball is probably still there."` | `«Вот и вся история. Мяч, наверное, до сих пор там».` |
| quiet | invite | `"He put the lid back on. Then he moved his chair. That was all."` | `«Накрыл стакан крышкой. Потом отодвинул стул. И всё».` |
| quiet | respond | `"It was quite funny. I didn't laugh at the time. I had to serve."` | `«Было смешно. Тогда я не засмеялась – надо было подавать».` |
| quiet | space | `"That's it, really. Nobody went to get the ball."` | `«Вот и всё. За мячом так никто и не пошёл».` |

`Трос сетки` keeps the tennis cause of the joke, while the four tellings keep each voice's rhythm.
The beat names no match result or score.

## 12. Situation R51 – `new-place`

Subject `worry`; stages `college`, `independent`; no fact gate. `Новое место` works for both a
college residence and an independent home. The sunny English reply says `flat`, but Russian does
not assert a flat where the college stage may mean a dorm.

### 12.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I don't think I like the new place much. There, I've said it out loud."` | `«По-моему, мне не очень нравится новое место. Вот, я это сказала».` |
| fiery | `"I don't like the new place. I've been trying to and I've stopped trying."` | `«Мне не нравится новое место. Я старалась, чтобы понравилось, но хватит».` |
| deep | `"I've worked out that I don't like the new place. It took me a week to notice."` | `«Я поняла, что мне не нравится новое место. Мне понадобилась неделя, чтобы это заметить».` |
| quiet | `"I don't think I like the new place much."` | `«Кажется, мне не очень нравится новое место».` |

### 12.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Let her keep going` | `Дать ей продолжить` |
| respond | `Ask whether she's been eating properly` | `Спросить, нормально ли она ест` |
| space | `Say she needn't solve it tonight` | `Сказать, что сегодня можно ничего не решать` |

### 12.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"It's fine! It's clean, it's warm, and I've not once sat down to eat in it."` | `«Да всё нормально! Чисто, тепло. Только я там ни разу не поела сидя».` |
| sunny | respond | `"I have! Just never sitting down. I'm starting to think the flat has no chairs."` | `«Ем! Просто всё время стоя. Уже думаю, что там стульев нет».` |
| sunny | space | `"I know. I'll like it better once there's something of mine in it."` | `«Знаю. Мне там больше понравится, когда появится что-то своё».` |
| fiery | invite | `"It's clean. It's fine. And I've eaten standing up every night I've been here."` | `«Там чисто. Всё нормально. Только с тех пор, как я здесь, каждый вечер ем стоя».` |
| fiery | respond | `"I've been eating. Standing at a counter like a horse, but eating."` | `«Ем. Стоя у столешницы, как лошадь, но ем».` |
| fiery | space | `"I'm not solving it tonight. I'm not pretending it's lovely either."` | `«Сегодня ничего решать не буду. Но и делать вид, что там чудесно, тоже».` |
| deep | invite | `"Nothing is wrong with it. I have been eating standing up and calling that settling in."` | `«С ним всё в порядке. Просто я ем стоя и называю это „обживаюсь“».` |
| deep | respond | `"I have. It turns out that where you eat counts for more than I expected."` | `«Ем. Оказалось, место, где ешь, значит для меня больше, чем я думала».` |
| deep | space | `"No. I'd rather sit with not liking it than talk myself out of it."` | `«Нет. Лучше побуду с этим чувством, чем уговорю себя, будто мне там нравится».` |
| quiet | invite | `"It's fine. It's clean. I've been eating standing up for a week. I only noticed tonight."` | `«Всё нормально. Чисто. Неделю ела стоя и только сегодня заметила».` |
| quiet | respond | `"I have. Just not sitting down, apparently."` | `«Ем. Только, видимо, не садясь».` |
| quiet | space | `"Good. Tomorrow, then. Not tonight."` | `«Хорошо. Тогда завтра. Не сегодня».` |

The daughter may be away in college or living independently. The wording never asserts a dorm,
apartment, roommate or tournament hotel.

## 13. Situation R52 – `beat-her-conqueror`

Subject `good-news`; stages `school`, `after-school`; fact gate `beat-her-conqueror`. The fact
requires a recent win over an opponent who beat her exactly four times beforehand, with no earlier
win against that opponent. The Russian number and first-win claim are therefore licensed by runtime.

### 13.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I beat someone I've never beaten."` | `«Я обыграла соперницу, которую раньше ни разу не побеждала».` |
| fiery | `"I beat her. I have never beaten her and today I beat her."` | `«Я её обыграла. Никогда раньше не могла, а сегодня – обыграла».` |
| deep | `"I beat someone who has always beaten me, and I am still working out how I feel."` | `«Я обыграла ту, кому всегда проигрывала, и ещё не поняла, что чувствую».` |
| quiet | `"I won today. Against someone I've never won against."` | `«Сегодня я выиграла у той, кого раньше не могла обыграть».` |

### 13.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what made it good` | `Спросить, что в этом было самым приятным` |
| respond | `Tell her we're glad` | `Сказать, что мы рады` |
| space | `Let her enjoy it` | `Дать ей порадоваться` |

### 13.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"She's beaten me four times. Four! Today I got nervous – and kept playing."` | `«Она обыграла меня четыре раза. Четыре! А сегодня я занервничала – и всё равно продолжила играть».` |
| sunny | respond | `"I can tell. You're doing the face."` | `«Вижу. У тебя опять то самое лицо».` |
| sunny | space | `"Oh, I'm going to. All evening."` | `«Ещё как. Буду радоваться весь вечер».` |
| fiery | invite | `"Four times she's beaten me. Four. I was nervous the whole way and it didn't matter."` | `«Четыре раза она меня обыграла. Четыре. Я нервничала весь матч, но всё равно выиграла».` |
| fiery | respond | `"You should be! I'm going to be glad about this for a week."` | `«А то! Я сама буду этому радоваться неделю».` |
| fiery | space | `"I am enjoying it. I'll enjoy it again tomorrow, and probably on Friday."` | `«Уже радуюсь. Завтра ещё порадуюсь. И в пятницу, наверное».` |
| deep | invite | `"She has beaten me four times. The good part was noticing the nerves and going anyway."` | `«Она обыграла меня четыре раза. А сегодня я заметила, что нервничаю, и всё равно продолжила играть».` |
| deep | respond | `"I know. I wanted to say it to someone who knew how many times it was."` | `«Знаю. Хотела сказать тому, кто помнит, сколько раз она меня обыгрывала».` |
| deep | space | `"I will. I'd like to keep this one somewhere I can find it again."` | `«Порадуюсь. Хочу сохранить этот день так, чтобы потом к нему вернуться».` |
| quiet | invite | `"She'd beaten me four times before. I didn't stop this time."` | `«Раньше она обыграла меня четыре раза. Сегодня я не остановилась».` |
| quiet | respond | `"Thanks. I'm still a bit surprised, honestly."` | `«Спасибо. Я, честно, всё ещё немного удивлена».` |
| quiet | space | `"I will. It's a nice thing to take upstairs."` | `«Порадуюсь. Хочется побыть с этим ещё немного».` |

The quiet reply adapts `take upstairs` into a private moment because the roof frame does not
establish stairs. No stance grades how the parent receives the win.

## 14. Situation R1 – `the-kettle`

Subject `story`; stages `after-school`, `college`, `independent`; no fact gate. The story's
four-minute wait is an authored incident; it is not a timer or mechanical claim.

### 14.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"You have to HOLD the kettle down in this place. For four minutes. Someone else came in and did exactly the same thing and we just stood there."` | `«Тут надо держать кнопку чайника. Четыре минуты! Зашла ещё одна девушка, сделала то же самое, и мы так и стояли».` |
| fiery | `"The kettle doesn't stay on. You hold it. Four minutes of my life. Then another girl came in and held hers too, so at least I'm not the idiot."` | `«У чайника не держится кнопка. Жми её четыре минуты. Потом зашла другая девушка и тоже стояла со своим. Хоть не одна я дура».` |
| deep | `"I stood holding a kettle switch for four minutes. Someone came in and did the same. Neither of us said a word."` | `«Четыре минуты держала кнопку чайника. Кто-то вошёл и сделал то же самое. Мы не сказали друг другу ни слова».` |
| quiet | `"The kettle in the room needs holding down. Takes about four minutes. Someone else came in and waited as well."` | `«У чайника в комнате надо держать кнопку. Минуты четыре. Ещё кто-то вошёл и тоже ждал».` |

### 14.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask who else was standing there` | `Спросить, кто ещё там стоял` |
| respond | `Say you'd have given up at two minutes` | `Сказать, что вы сдались бы через две минуты` |
| space | `Laugh and let it go` | `Посмеяться и оставить это` |

### 14.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"I've no idea who she was. We just stood there like two people waiting for a bus."` | `«Понятия не имею. Стояли рядом, как две незнакомки на остановке».` |
| sunny | respond | `"I nearly did. And then I'd have had no tea and nothing to show for it."` | `«Я тоже чуть не сдалась. Тогда бы осталась без чая и без истории».` |
| sunny | space | `"It was quite funny. You had to be there, holding a kettle."` | `«Смешно было. Но это надо было видеть. И держать чайник».` |
| fiery | invite | `"No idea who she was. She didn't speak, I didn't speak, and we stood there anyway."` | `«Без понятия. Она молчала, я молчала, но мы всё равно стояли рядом».` |
| fiery | respond | `"You'd have given up at two and had no tea. I had tea."` | `«Через две минуты у тебя бы чая не было. А у меня был».` |
| fiery | space | `"Fine. Laugh. I'm still holding that kettle somewhere in my head."` | `«Ладно, смейся. А я в голове до сих пор держу эту кнопку».` |
| deep | invite | `"I don't know her name. I've thought about that more than I've thought about the kettle."` | `«Не знаю, как её зовут. Об этом я думала больше, чем о самом чайнике».` |
| deep | respond | `"You'd have put it down. I thought about putting it down."` | `«На твоём месте я бы отпустила кнопку. Сама об этом думала».` |
| deep | space | `"Mm. I liked that she didn't say anything either."` | `«Угу. Мне понравилось, что она тоже ничего не сказала».` |
| quiet | invite | `"Didn't catch her name. She was gone before the tea was."` | `«Имени не узнала. Она ушла раньше, чем заварился чай».` |
| quiet | respond | `"Probably. I'd already started, so I stayed with it."` | `«Наверное. А я уже начала, вот и дождалась».` |
| quiet | space | `"It's only a kettle. I've got tea now."` | `«Это всего лишь чайник. Чай у меня теперь есть».` |

The daughter addresses the parent as `ты`; the parent option uses formal `вы` and leaves the
player-parent's gender unstated. The quiet reply keeps the English `before the tea was` as the tea
being ready, rather than assigning a duration to its brewing.

## 15. Situation R2 – `the-labelled-fruit`

Subject `story`; stages `after-school`, `college`, `independent`; no fact gate. The daughter may
speculate about why somebody labels fruit; that speculation is never presented as known history.

### 15.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Someone writes her NAME on bananas. On every single one. Who is taking the bananas?"` | `«Кто-то пишет своё ИМЯ на бананах. На каждом. Кто вообще забирает чужие бананы?»` |
| fiery | `"She labels her fruit. Her fruit. I've said nothing about it and I am running out of nothing."` | `«Она подписывает фрукты. Фрукты! Я пока молчу, но скоро не выдержу».` |
| deep | `"There's a woman who writes her name on bananas. I've decided not to ask why, because I think the answer might be sad."` | `«Там одна женщина пишет своё имя на бананах. Я решила не спрашивать зачем. Боюсь, ответ будет грустный».` |
| quiet | `"There's a system in the fridge now. Names on things."` | `«В холодильнике теперь свой порядок. На продуктах имена».` |

### 15.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask whether anyone has ever taken one` | `Спросить, забирал ли кто-нибудь банан` |
| respond | `Say you'd have eaten one by now` | `Сказать, что вы бы уже съели один` |
| space | `Change the subject entirely` | `Совсем сменить тему` |

### 15.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Not once. Nobody's ever taken one. That's the part I keep getting stuck on."` | `«Ни разу. Никто ни одного не взял. Вот на этом я и застряла».` |
| sunny | respond | `"I know you would. I'd never dare. I'd just stand there looking at them."` | `«Знаю, тебе бы хватило смелости. А я бы только стояла и смотрела».` |
| sunny | space | `"Fine, fine. Ask me something else. I'm still thinking about the bananas."` | `«Ладно, ладно. Спроси о другом. Но я всё ещё думаю о бананах».` |
| fiery | invite | `"Never. Not one. She's protecting fruit from a thief who doesn't exist."` | `«Никогда. Ни одного. Она защищает фрукты от вора, которого нет».` |
| fiery | respond | `"That's what I keep telling myself. And then I don't."` | `«Я себе то же самое говорю. А потом не беру».` |
| fiery | space | `"No. We're not moving on. Somebody has to acknowledge the bananas."` | `«Нет. Тему не меняем. Кто-то должен признать, что эти бананы существуют».` |
| deep | invite | `"No one has. I think somebody took something from her once, somewhere else."` | `«Никто не брал. Мне кажется, когда-то у неё забрали что-то другое. В другом месте».` |
| deep | respond | `"You would. I've thought about it and I've never once put my hand in."` | `«Ты – да. Я тоже думала об этом, но ни разу не протянула руку».` |
| deep | space | `"All right. I brought it up for a reason and I've lost what it was."` | `«Хорошо. Я зачем-то об этом заговорила, а теперь забыла зачем».` |
| quiet | invite | `"Not that I know of. They're all still in there."` | `«Насколько знаю, нет. Они всё ещё там».` |
| quiet | respond | `"You would, yes. I bring my own."` | `«Верю. А я приношу свои».` |
| quiet | space | `"Sure. What else is happening?"` | `«Хорошо. Что ещё происходит?»` |

The deep guess stays explicitly marked `мне кажется`. The quiet fridge is a setting within the
story, not a claim that the parent and adult daughter share a kitchen. Replies avoid assigning a
grammatical gender to the player-parent.

## 16. Situation-corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 10 / 51 | 190 / 969 | 4 / 4 | R45–R52 and R1–R2 complete as DRAFT |
