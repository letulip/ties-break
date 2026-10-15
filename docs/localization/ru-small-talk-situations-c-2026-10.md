---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-10C – Small-talk situation corpus, final runtime rows

This volume continues after [RU-10B](ru-small-talk-situations-b-2026-10.md), beginning with R30.
Runtime row order and gates come from generated `src/engine/world/smallTalkCorpus.ts`; English
authority is `docs/specs/small-talk-corpus-2026-09.md`. Every Russian line is `DRAFT`. IDs,
subjects, stages, fact gates and deterministic draw order remain locale-independent.

## 1. Situation R30 – `the-rain-delay`

Subject `story`; stages `college`, `independent`; no fact gate. The parent can ask who won the
cards in every voice, so each Russian opener mentions cards. This corrects an English exchange gap
in fiery, deep and quiet while staying within their authored shared incident.

### 1.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Three hours of rain and we ended up playing cards on the floor of a corridor. Best day."` | `«Три часа дождя – и мы в итоге играли в карты на полу в коридоре. Лучший день».` |
| fiery | `"Three hours. THREE. And the best thing that happened all day happened in a corridor."` | `«Три часа. ТРИ. А лучшее за день случилось в коридоре, за картами».` |
| deep | `"We sat in a corridor for three hours and I talked to people I have only ever nodded at."` | `«Три часа сидели в коридоре за картами, и я разговорилась с людьми, с которыми раньше только здоровалась кивком».` |
| quiet | `"Rain delay. We waited it out inside."` | `«Из-за дождя задержали игру. Мы переждали в помещении, за картами».` |

### 1.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask who won the cards` | `Спросить, кто выиграл в карты` |
| respond | `Say you'd have been terrible at the cards` | `Сказать, что вы бы в карты сыграли ужасно` |
| space | `Say she should get some sleep` | `Сказать, что ей пора поспать` |

### 1.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Not me. Somebody who had obviously done it before. I lost every hand."` | `«Не я. Кто-то, кто явно уже играл. Я проиграла каждую раздачу».` |
| sunny | respond | `"You would. We're the same at this. It was still the best bit."` | `«У тебя вышло бы не лучше, чем у меня. Но это всё равно было лучшее за день».` |
| sunny | space | `"I will. I'm not sorry about the three hours, though."` | `«Посплю. Но о тех трёх часах не жалею».` |
| fiery | invite | `"Not me. I don't think anyone explained the rules properly, which is my excuse."` | `«Не я. По-моему, правила толком не объяснили. Это моё оправдание».` |
| fiery | respond | `"You'd be worse than me. That's the only comfort I've got."` | `«У тебя получилось бы ещё хуже. Хоть это утешает».` |
| fiery | space | `"I'll sleep. Three hours in a corridor and I'm wide awake."` | `«Посплю. Хотя после трёх часов в коридоре сна ни в одном глазу».` |
| deep | invite | `"Not me. I spent most of it watching rather than playing."` | `«Не я. Я больше наблюдала, чем играла».` |
| deep | respond | `"You would. I was terrible and it didn't matter for three hours."` | `«Да. Я играла ужасно, и целых три часа это никого не волновало».` |
| deep | space | `"I will. I'd forgotten what it's like to have nothing to do."` | `«Посплю. Я уже забыла, каково это – когда никуда не надо».` |
| quiet | invite | `"Not me. I was mostly dealing."` | `«Не я. В основном раздавала карты».` |
| quiet | respond | `"You'd have been fine. Nobody was keeping score."` | `«У тебя бы вышло нормально. Никто не считал очки».` |
| quiet | space | `"I will. It's late here."` | `«Посплю. У меня уже поздно».` |

The daughter addresses the parent with intimate `ты` or gender-neutral `у тебя` constructions.

## 2. Situation R31 – `the-child-on-the-next-court`

Subject `story`; stages `after-school`, `college`, `independent`; no fact gate. The adjacent
child's celebration stays hers; the daughter does not take it as a sign about her own career.

### 2.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A tiny kid hit ONE good ball and celebrated like she had won a Slam. I loved it."` | `«Маленькая девочка ОДИН раз здорово попала по мячу и радовалась, будто выиграла турнир Большого шлема. Обожаю».` |
| fiery | `"One ball. She screamed. Honestly? Correct behaviour."` | `«Один мяч. Она закричала. И знаешь что? Правильно сделала».` |
| deep | `"A child hit one clean ball and celebrated it completely. I stood and watched and I couldn't tell you the last time I did that."` | `«Девочка чисто попала по одному мячу и радовалась от души. Я смотрела и не могла вспомнить, когда сама так радовалась».` |
| quiet | `"There was a kid on the next court. She was pleased with herself."` | `«На соседнем корте была девочка. Очень собой довольная».` |

### 2.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the shot was` | `Спросить, что это был за удар` |
| respond | `Say she used to do exactly that` | `Сказать, что она раньше радовалась точно так же` |
| space | `Say nothing and just laugh` | `Ничего не говорить, только посмеяться` |

### 2.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"A forehand. One forehand, straight down the middle, and she went completely mad."` | `«Форхенд. Один удар прямо по центру – и она с ума от радости сошла».` |
| sunny | respond | `"Did I? I'd love to have seen me. I bet I was loud."` | `«Правда? Вот бы на себя посмотреть. Наверняка я громко кричала».` |
| sunny | space | `"That's exactly the right response. I've not stopped thinking about her."` | `«Вот правильная реакция. Я с тех пор о ней думаю».` |
| fiery | invite | `"A forehand. One. Down the middle. And then the noise she made."` | `«Форхенд. Один. По центру. А потом её крик».` |
| fiery | respond | `"I still would if I was allowed."` | `«Я и сейчас бы так кричала, если бы можно было».` |
| fiery | space | `"Good. Somebody should be that pleased about one ball."` | `«Вот. Кто-то же должен так радоваться одному мячу».` |
| deep | invite | `"A forehand down the middle. She watched it land before she started."` | `«Форхенд по центру. Она дождалась, пока мяч приземлится, и только тогда закричала».` |
| deep | respond | `"I know. I've seen the photographs. I don't remember the feeling."` | `«Знаю. Я видела фотографии. Но самого чувства не помню».` |
| deep | space | `"Mm. I stood there longer than I meant to."` | `«Угу. Я задержалась там дольше, чем собиралась».` |
| quiet | invite | `"A forehand. Middle of the court. It went in."` | `«Форхенд. По центру корта. Попала».` |
| quiet | respond | `"You've said. I don't remember it."` | `«Я слышала от тебя. Но сама не помню».` |
| quiet | space | `"It was funny. That's all."` | `«Было смешно. Вот и всё».` |

The quiet response to the parent avoids gendering the player-parent. `Форхенд` follows tennis
usage, and the child's one clean ball is not turned into a match result.

## 3. Situation R32 – `the-song-in-the-gym`

Subject `story`; stages `college`, `independent`; no fact gate. The song is a shared childhood
memory, without a title, artist or lyric. Russian keeps it unnamed in every branch.

### 3.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"They played a song I haven't heard since I was about six and I completely stopped."` | `«В зале включили песню, которую я не слышала лет с шести. Я прямо замерла».` |
| fiery | `"They put that song on in the gym and it ruined my whole session."` | `«В зале включили ту песню, и вся тренировка пошла насмарку».` |
| deep | `"A song came on that I had not heard since I was small, and I stood there until it finished."` | `«Заиграла песня, которую я не слышала с детства. Я стояла, пока она не закончилась».` |
| quiet | `"They were playing old music in the gym. I stayed a bit longer."` | `«В зале играла старая музыка. Я задержалась немного».` |

### 3.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask which song` | `Спросить, что за песня` |
| respond | `Say you remember it` | `Сказать, что вы её помните` |
| space | `Say nothing and let her have it` | `Ничего не говорить, дать ей побыть с воспоминанием` |

### 3.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"The one that was always on in the car. You know the one. That one."` | `«Та, что всё время играла у нас в машине. Ты знаешь. Та самая».` |
| sunny | respond | `"Of course you do. It was always on. I'd forgotten it completely."` | `«Конечно, помнишь. Она же постоянно играла. А я совсем забыла».` |
| sunny | space | `"Thank you. I'm going to find it and play it properly."` | `«Спасибо. Найду её и послушаю как следует».` |
| fiery | invite | `"The car one. The one you played until we all hated it."` | `«Ту, из машины. С твоей подачи она играла, пока всем не надоела».` |
| fiery | respond | `"You'd better remember it. You're the reason it's in my head."` | `«Ещё бы тебе не помнить. Она у меня в голове из-за тебя».` |
| fiery | space | `"I'm still annoyed about the session. And I'm going to play it again."` | `«За тренировку всё ещё обидно. А песню всё равно снова включу».` |
| deep | invite | `"The one from the car. I knew it before I knew what it was."` | `«Ту, из машины. Я узнала её раньше, чем поняла, что слышу».` |
| deep | respond | `"You would. I didn't think I did until it started."` | `«Конечно, помнишь. А я думала, что забыла, пока она не заиграла».` |
| deep | space | `"Thanks. I'd rather not explain it."` | `«Спасибо. Не хочу это объяснять».` |
| quiet | invite | `"The car one. You'd know it if I hummed it."` | `«Ту, что играла в машине. Если напою, сразу вспомнишь».` |
| quiet | respond | `"I thought you might. It's been a long time."` | `«Я так и думала. Столько времени прошло».` |
| quiet | space | `"It was nice. That's all it was."` | `«Было приятно. Вот и всё».` |

The parent is grammatically ungendered in every reply. This row should never acquire a real
recording title or quoted lyric merely to make the shared memory concrete.

## 4. Situation R33 – `the-one-who-never-sits`

Subject `observation`; stages `college`, `independent`; no fact gate. The other player stands
at changeovers; the daughter does not know whether this helps, and Russian preserves that doubt.

### 4.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"There's a girl who never sits down at changeovers. Not once, the whole match."` | `«Одна девушка ни разу не села на сменах сторон. За весь матч ни разу».` |
| fiery | `"She doesn't sit down. Ever. It's either brilliant or a pose and I can't decide which."` | `«Она вообще не садится. Никогда. То ли гениально, то ли поза – не пойму».` |
| deep | `"She stood through every changeover. I don't think it was for show."` | `«Она простояла каждую смену сторон. Не думаю, что напоказ».` |
| quiet | `"One of them doesn't sit at the changeovers. I noticed it early on."` | `«Одна из них не садится на сменах сторон. Я заметила довольно рано».` |

### 4.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she did instead of sitting` | `Спросить, что она делала вместо отдыха на скамейке` |
| respond | `Say players find odd things that work` | `Сказать, что игроки находят странные, но полезные привычки` |
| space | `Say she does not have to copy anyone` | `Сказать, что ей не обязательно копировать других` |

### 4.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Stood there. Bounced about a bit. Looked completely normal about the whole thing."` | `«Стояла. Чуть подпрыгивала. И выглядела так, будто это совершенно обычно».` |
| sunny | respond | `"They do. I'd like one of my own, honestly."` | `«Находят. Мне бы тоже такую, честно говоря».` |
| sunny | space | `"I'm not going to. I did think about it, though."` | `«Не собираюсь. Хотя мысль была».` |
| fiery | invite | `"Stood. Faced the back fence. Like the chair had personally offended her."` | `«Стояла лицом к ограде за кортом. Будто стул лично её обидел».` |
| fiery | respond | `"Then I want an odd thing. Mine are all completely ordinary."` | `«Тогда мне тоже нужна странная привычка. Мои все до обидного обычные».` |
| fiery | space | `"I'm not copying her. I'd just like to know what it's for."` | `«Не копирую. Просто хочу понять, зачем она так делает».` |
| deep | invite | `"She stood with her back to the court and looked at her strings. Every single time."` | `«Стояла спиной к корту и смотрела на струны. Каждый раз».` |
| deep | respond | `"They do. Hers didn't look odd from where I was sitting."` | `«Находят. С моего места её привычка не выглядела странной».` |
| deep | space | `"No. I'd still like to try it."` | `«Не обязательно. Но попробовать всё равно хочется».` |
| quiet | invite | `"Stood at the back. Same spot each time."` | `«Стояла сзади. В одном и том же месте».` |
| quiet | respond | `"I know. Most of them have something."` | `«Знаю. У многих есть своя привычка».` |
| quiet | space | `"No. I only noticed it, that's all."` | `«Не обязательно. Я просто заметила».` |

`Смена сторон` is the tennis term; the source's seat is a court bench. The parent's response
remains an observation, not a claim that this habit improves results.

## 5. Situation R34 – `the-second-serve-everyone-attacks`

Subject `observation`; stages `college`, `independent`; fact gate `played-recently`. The gate
licenses recent match experience, not a result or a measured weakness in her second serve. These
are her observations of other players' return position.

### 5.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The good ones just step in on a second serve. They don't even think about it."` | `«Сильные игроки на второй подаче просто делают шаг вперёд. Даже не задумываются».` |
| fiery | `"They walk in on the second serve like it's owed to them. I want to do that."` | `«На второй подаче они идут вперёд так, будто это их право. Я тоже так хочу».` |
| deep | `"Nobody decides to step in. It's already decided before the ball is tossed, and that's the part I'm missing."` | `«Никто не решает сделать шаг вперёд в последний момент. Они знают это ещё до подброса мяча. Мне как раз этого не хватает».` |
| quiet | `"They stand closer on the second serve. All of them."` | `«На второй подаче они стоят ближе. Все».` |

### 5.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she notices just before they move` | `Спросить, что она замечает перед их шагом` |
| respond | `Say that is a decision made in practice, not in a match` | `Сказать, что такой шаг отрабатывают на тренировке` |
| space | `Say she is watching well` | `Сказать, что она хорошо наблюдает` |

### 5.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"They're leaning in while the ball's still going up. Every one of them does it."` | `«Они уже подаются вперёд, пока мяч ещё летит вверх. Все до одной».` |
| sunny | respond | `"That makes sense. I'd never have got there on my own."` | `«Логично. Сама я бы до этого не додумалась».` |
| sunny | space | `"Thank you. I'd rather be doing it than watching it, mind."` | `«Спасибо. Хотя я бы предпочла так делать, а не смотреть».` |
| fiery | invite | `"They move before the toss comes down. That's the whole trick and nobody hides it."` | `«Они двигаются ещё до того, как мяч опустится после подброса. Вот и весь секрет, никто его не прячет».` |
| fiery | respond | `"Then I'll do it in practice until I stop thinking about it."` | `«Тогда буду делать это на тренировке, пока перестану задумываться».` |
| fiery | space | `"Watching isn't the thing I want to be good at."` | `«Спасибо, но мне важнее самой это делать».` |
| deep | invite | `"Nothing changes in their feet. They are already there before the ball is."` | `«Положение ног не меняется. Они занимают место ещё до подброса».` |
| deep | respond | `"That's probably right. It is not a thing to work out mid-point."` | `«Пожалуй. Посреди розыгрыша с этим не разберёшься».` |
| deep | space | `"Thanks. I've been watching it instead of practising it."` | `«Спасибо. Пока я больше смотрю, чем пробую сама».` |
| quiet | invite | `"They take a step in while she's still tossing it."` | `«Делают шаг вперёд, пока соперница ещё подбрасывает мяч».` |
| quiet | respond | `"I'd not thought of it that way. It's practice, then."` | `«Так не думала. Значит, сначала тренировка».` |
| quiet | space | `"Thanks. I've been paying attention, at least."` | `«Спасибо. По крайней мере, я смотрела внимательно».` |

The parent thought about practice does not silently change training settings. The Russian second
serve vocabulary describes return positioning, not an actual match outcome.

## 6. Situation R35 – `the-team-that-eats-together`

Subject `observation`; stages `college`, `independent`; no fact gate. The other player's
three-person entourage is an authored observation. No line implies the daughter can hire or pay
three staff herself.

### 6.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"One girl has THREE people with her and they all eat together every night. It looks lovely."` | `«С одной девушкой ездят ТРОЕ, и каждый вечер они ужинают вместе. Выглядит чудесно».` |
| fiery | `"Three people. For one player. I don't know whether to be jealous or appalled."` | `«Три человека. Для одной теннисистки. Не знаю, завидовать или ужасаться».` |
| deep | `"She has a table of her own people every evening. I've been sitting with that longer than I expected to."` | `«У неё каждый вечер за столом свои люди. Я думаю об этом дольше, чем ожидала».` |
| quiet | `"Some of them travel with a group. They have dinner together."` | `«Некоторые ездят с командой. Ужинают вместе».` |

### 6.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask whether she would want that` | `Спросить, хотела бы она так` |
| respond | `Say a big team is not the same as a good one` | `Сказать, что большая команда не обязательно хорошая` |
| space | `Say you'd not want three people at your dinner either` | `Сказать, что вам тоже не нужны трое за ужином` |

### 6.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Some of it. Not three people. Maybe one, at dinner."` | `«Отчасти. Не троих. Может, одного человека за ужином».` |
| sunny | respond | `"That's true. It did look like a good one, though."` | `«Верно. Но та выглядела хорошей».` |
| sunny | space | `"You wouldn't. You'd be under the table by the pudding."` | `«Тебе бы не понравилось. К десерту пришлось бы искать тебя под столом».` |
| fiery | invite | `"Not three. I'd want one person who actually knew me."` | `«Не троих. Мне нужен один человек, который правда меня знает».` |
| fiery | respond | `"I know. It still looked better than eating on my own."` | `«Знаю. Но всё равно выглядит лучше, чем есть одной».` |
| fiery | space | `"You wouldn't. I think I might, some nights."` | `«Тебе – нет. А мне в некоторые вечера, может, и понравилось бы».` |
| deep | invite | `"Not the three. The table, maybe. I'd want the table."` | `«Не троих. Может, сам стол. Мне бы хотелось, чтобы было с кем сесть».` |
| deep | respond | `"No. I'd not thought about whether hers is good. Only that it's there."` | `«Не обязательно. Я даже не думала, хорошая ли у неё команда. Только о том, что она рядом».` |
| deep | space | `"You wouldn't. I've been eating alone and telling myself I prefer it."` | `«Тебе бы не понравилось. А я ем одна и убеждаю себя, что мне так лучше».` |
| quiet | invite | `"I don't know. It looks tiring as well as nice."` | `«Не знаю. Выглядит и приятно, и утомительно».` |
| quiet | respond | `"Probably not. They seemed to get on."` | `«Наверное. Они, похоже, ладили».` |
| quiet | space | `"You wouldn't, no. I don't mind either way."` | `«Тебе – нет. А мне всё равно».` |

The sunny joke addresses the parent without grammatical gender. No reply asserts a romance,
dependency or staff hire.

## 7. Situation R36 – `the-long-match-on-court-one`

Subject `observation`; stages `college`, `independent`; no fact gate. The daughter watches a
long match. The observed players' stamina is her impression, not a reading of her own condition
or a medical claim.

### 7.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"There was a match on court one that went on forever and they were both still fine when I left."` | `«На первом корте матч тянулся бесконечно, а когда я ушла, обе ещё держались отлично».` |
| fiery | `"Hours of it, and neither of them was limping. I'd have been on the floor."` | `«Часами играли, и ни одна даже не хромала. Я бы уже лежала на корте».` |
| deep | `"It went far longer than anything else out there. They were both still moving properly when I left."` | `«Он длился куда дольше остальных. Когда я уходила, обе ещё двигались уверенно».` |
| quiet | `"One of the matches ran very long. I watched some of it."` | `«Один матч сильно затянулся. Я немного посмотрела».` |

### 7.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask how much of it she saw` | `Спросить, сколько она посмотрела` |
| respond | `Say that is a different kind of fitness` | `Сказать, что это особая выносливость` |
| space | `Say she does not have to measure herself against it` | `Сказать, что ей не надо сравнивать себя с ними` |

### 7.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"A good chunk of it. I kept meaning to leave and then not leaving."` | `«Прилично. Всё собиралась уйти и каждый раз оставалась».` |
| sunny | respond | `"It really is. They were still running when I gave up watching."` | `«Точно. Когда я сдалась и ушла, они ещё бегали».` |
| sunny | space | `"I know. I did a bit anyway, standing there."` | `«Знаю. Но пока стояла, всё-таки немного сравнивала».` |
| fiery | invite | `"Enough of it. And then I left in the middle, which I'm annoyed about."` | `«Достаточно. Потом ушла посреди матча и теперь злюсь на себя».` |
| fiery | respond | `"It is. I'd have been sitting down long before that."` | `«Ещё какая. Я бы давно уже села».` |
| fiery | space | `"I already did. That's what watching it was."` | `«Уже сравнила. Я потому и смотрела».` |
| deep | invite | `"The middle of it. I left before the end and I have thought about that since."` | `«Середину. Ушла до конца, и с тех пор об этом думаю».` |
| deep | respond | `"It is. Neither of them looked like they were surviving it."` | `«Да. Ни одна не выглядела так, будто просто терпит».` |
| deep | space | `"No. I'd still like to know what that feels like."` | `«Не надо. Но мне всё же интересно, каково это».` |
| quiet | invite | `"Some of the middle. I left before it finished."` | `«Часть середины. До конца не осталась».` |
| quiet | respond | `"It is. Neither of them had slowed down when I went."` | `«Да. Когда я ушла, ни одна не замедлилась».` |
| quiet | space | `"No. I was only watching."` | `«Не надо. Я просто смотрела».` |

No answer says who won or what the final score was. The parent does not turn observation into a
training command.

## 8. Situation R37 – `what-they-do-after`

Subject `observation`; stages `college`, `independent`; no fact gate. She watches how players
behave after matches. This is her private comparison, not a statement about an actual loss.

### 8.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I've started watching what people do AFTER. It tells you more than the match does."` | `«Я стала смотреть, что игроки делают ПОСЛЕ. Иногда это говорит больше самого матча».` |
| fiery | `"Some of them are fine in ten minutes. Ten. I'm not built like that and I'm not sure I want to be."` | `«Некоторые уже через десять минут как ни в чём не бывало. Десять. Я так не устроена и не уверена, что хочу».` |
| deep | `"The ten minutes after is where the real thing is. I've started staying to watch it."` | `«Настоящее видно в десять минут после матча. Я стала оставаться и смотреть».` |
| quiet | `"I've been staying a bit longer after matches. Watching."` | `«После матчей я теперь задерживаюсь. Смотрю».` |

### 8.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she has seen` | `Спросить, что она заметила` |
| respond | `Say you'd never thought to watch that` | `Сказать, что вам не приходило в голову смотреть после матча` |
| space | `Say she can leave when the match ends` | `Сказать, что после матча она может уходить` |

### 8.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"All sorts. Some of them are laughing by the time they reach the gate."` | `«Всякое. Некоторые уже смеются, когда доходят до выхода».` |
| sunny | respond | `"Nor had I. I only noticed because I was waiting for somebody."` | `«Мне тоже. Просто однажды я ждала кое-кого и заметила».` |
| sunny | space | `"I could. I'd rather stay, now that I've started."` | `«Могу. Но раз уж начала смотреть, лучше останусь».` |
| fiery | invite | `"Some of them are fine straight away. Some of them aren't fine at all."` | `«Некоторые сразу в порядке. Другим совсем не по себе».` |
| fiery | respond | `"Nobody does. Everyone watches the match and then leaves."` | `«Никому не приходит. Все смотрят матч и уходят».` |
| fiery | space | `"I could leave. I'd rather know what happens next."` | `«Могла бы уйти. Но я хочу видеть, что будет потом».` |
| deep | invite | `"Nobody does the same thing. That's what I keep noticing."` | `«Никто не делает одного и того же. Вот что я замечаю».` |
| deep | respond | `"Nor had I. It's the ten minutes nobody films."` | `«Мне тоже не приходило. Эти десять минут ведь никто не снимает».` |
| deep | space | `"I could. I've started staying and I'm not sure I want to stop."` | `«Могла бы. Но я начала оставаться и не уверена, что хочу перестать».` |
| quiet | invite | `"Some pack up fast. Some sit for a while."` | `«Кто-то быстро собирает вещи. Кто-то сидит».` |
| quiet | respond | `"Neither had I. I just started staying."` | `«Мне тоже не приходило. Просто стала задерживаться».` |
| quiet | space | `"I know. I'll stay a bit anyway."` | `«Знаю. Всё же ещё немного побуду».` |

`Десять минут` is an authored observation, not a recovery timer. The parent may offer to leave;
she decides whether to stay.

## 9. Situation R38 – `the-warm-up-she-runs`

Subject `good-news`; stages `college`, `independent`; no fact gate. She begins a group warm-up;
the moment says something small about initiative, without promoting her to a formal leader.

### 9.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Nobody started the warm-up so I did. And everybody just... followed me?"` | `«Никто не начинал разминку, и я начала. А остальные просто... пошли за мной?»` |
| fiery | `"I ran the warm-up. Somebody had to and nobody was moving."` | `«Я провела разминку. Кому-то надо было, а остальные стояли».` |
| deep | `"I started it because the silence was getting long, and then everybody did what I said."` | `«Я начала, потому что молчание затянулось. А потом все делали то, что я говорила».` |
| quiet | `"I started the warm-up this week. It went fine."` | `«На этой неделе я начала разминку. Всё прошло нормально».` |

### 9.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask how it felt` | `Спросить, каково это было` |
| respond | `Say somebody had to, and it was her` | `Сказать, что кто-то должен был начать, и начала она` |
| space | `Say well done and leave it` | `Похвалить её и не расспрашивать дальше` |

### 9.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Strange. Good strange. I kept waiting for somebody to take it off me."` | `«Странно. Но приятно. Всё ждала, что кто-нибудь перехватит».` |
| sunny | respond | `"It was me. I still don't quite know why it was me."` | `«Начала я. До сих пор не понимаю, почему именно я».` |
| sunny | space | `"Thanks. I'll probably do it again next time, actually."` | `«Спасибо. Вообще-то, может, и в следующий раз проведу».` |
| fiery | invite | `"Good. Better than standing about waiting for somebody else to start."` | `«Хорошо. Лучше, чем стоять и ждать, пока начнёт кто-то другой».` |
| fiery | respond | `"Somebody had to. I'd been waiting long enough to be annoyed."` | `«Кому-то надо было. Я уже успела разозлиться от ожидания».` |
| fiery | space | `"I'll leave it. I'm doing it again, though."` | `«Ладно. Но в следующий раз опять я».` |
| deep | invite | `"Frightening at the start. Then it was only a warm-up."` | `«Сначала страшно. А потом это оказалась просто разминка».` |
| deep | respond | `"It was. I'd been waiting for somebody else to be the somebody."` | `«Да. Я всё ждала, что этим кем-то станет другой человек».` |
| deep | space | `"Thank you. I'd not have told anybody else."` | `«Спасибо. Больше я бы никому об этом не рассказала».` |
| quiet | invite | `"Fine. Nobody made anything of it."` | `«Нормально. Никто не придал этому значения».` |
| quiet | respond | `"Somebody did. It happened to be me."` | `«Кто-то начал. Так вышло, что я».` |
| quiet | space | `"Thanks. It was only a warm-up."` | `«Спасибо. Это всего лишь разминка».` |

Her voice changes the importance of the same group moment. No response adds status, reputation or
bond.

## 10. Situation R39 – `the-thing-she-fixed`

Subject `good-news`; stages `after-school`, `college`, `independent`; no fact gate. The
shoelace repair is story texture and does not replace, buy or repair a game inventory item.

### 10.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"My bag strap went and I fixed it with a shoelace. It's holding!"` | `«У сумки оторвалась лямка, я привязала её шнурком. Держится!»` |
| fiery | `"It broke, I fixed it, and it's better than it was. That's the whole story."` | `«Сломалось, я починила, и теперь лучше прежнего. Вот и вся история».` |
| deep | `"I mended it with what was in the bag. It's ugly and it works and I've been quietly pleased all day."` | `«Починила тем, что нашлось в сумке. Некрасиво, зато держится. Весь день тихо радуюсь».` |
| quiet | `"Bag strap went. It's sorted."` | `«Лямка у сумки оторвалась. Я починила».` |

### 10.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask how bad it looks` | `Спросить, сильно ли это бросается в глаза` – ⚙ 11.10 выровнено на чат-ок-форму (один ключ) |
| respond | `Say that is a useful kind of stubborn` | `Сказать, что такое упрямство полезно` |
| space | `Say you would have bought a new one` | `Сказать, что вы бы купили новую сумку` |

### 10.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Terrible. There's a shoelace holding my bag together. It isn't subtle."` | `«Очень. Сумку держит шнурок. Такое не спрячешь».` |
| sunny | respond | `"Is that what it is? I only didn't want to carry it home in pieces."` | `«Это упрямство? Просто не хотелось нести домой сумку по частям».` |
| sunny | space | `"You would have. I like this one, though."` | `«У тебя сразу была бы новая. А мне нравится эта».` |
| fiery | invite | `"It looks like a shoelace holding a bag together, because that's what it is."` | `«Как сумка, которую держит шнурок. Так оно и есть».` |
| fiery | respond | `"It's stubborn. I'd have been annoyed all day carrying a broken bag."` | `«Упрямство. Но носить весь день сломанную сумку бесило бы сильнее».` |
| fiery | space | `"You would. I didn't want a new one, I wanted this one working."` | `«Знаю. Но мне нужна была не новая, а эта – целая».` |
| deep | invite | `"Bad. You can see the lace from across a room."` | `«Сильно. Шнурок видно через всю комнату».` |
| deep | respond | `"Maybe. I didn't feel stubborn. I felt like somebody with a shoelace."` | `«Может быть. Я не чувствовала себя упрямой. Просто у меня был шнурок».` |
| deep | space | `"You would. I'd rather it stayed the bag I've had."` | `«Верю. А я хотела оставить сумку, которая у меня уже была».` |
| quiet | invite | `"You'd see it. The lace doesn't match anything."` | `«Заметно. Шнурок ни к чему не подходит».` |
| quiet | respond | `"Suppose so. It was quicker than the alternative."` | `«Наверное. Так было быстрее».` |
| quiet | space | `"You would, yes. This one's fine now."` | `«Пожалуй. А моя теперь в порядке».` |

The parent option mentions buying a bag but does not incur a cost. Daughter responses avoid
assigning the player-parent a grammatical gender.

## 11. Situation R40 – `the-junior-who-copied-her`

Subject `good-news`; stages `college`, `independent`; no fact gate. A younger player copies
her warm-up. The daughter may enjoy it or feel uneasy; no line makes her a coach or mentor.

### 11.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A younger girl was doing MY warm-up. Badly! But mine!"` | `«Девочка помладше делала МОЮ разминку. Криво! Но мою!»` |
| fiery | `"She was copying me. I nearly went over and fixed her elbow, and then I thought better of it."` | `«Она меня копировала. Я чуть не подошла поправить ей положение локтя, но передумала».` |
| deep | `"She was doing my warm-up two courts away and getting it wrong, and I didn't know where to put that."` | `«Через два корта от меня она повторяла мою разминку – с ошибками. Я даже не знала, как к этому отнестись».` |
| quiet | `"One of the juniors has picked up my warm-up. Roughly."` | `«Одна юниорка переняла мою разминку. Примерно».` |

### 11.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask whether she said anything` | `Спросить, сказала ли она что-нибудь` |
| respond | `Say that is what being watched looks like` | `Сказать, что за ней тоже наблюдают` |
| space | `Say she does not owe her a lesson` | `Сказать, что она не обязана давать ей урок` |

### 11.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"No. I pretended I hadn't seen. I didn't want to embarrass her."` | `«Нет. Сделала вид, что не заметила. Не хотела её смущать».` |
| sunny | respond | `"I suppose it is. It hadn't occurred to me that anybody was."` | `«Наверное. Мне и в голову не приходило, что кто-то смотрит».` |
| sunny | space | `"I don't. I might still show her the first bit."` | `«Не обязана. Но, может, покажу ей самое начало».` |
| fiery | invite | `"No. I got as far as standing up and then sat down again."` | `«Нет. Я уже встала – и снова села».` |
| fiery | respond | `"Then I'd like to be watched by somebody doing it properly."` | `«Тогда хочу, чтобы за мной повторяли правильно».` |
| fiery | space | `"I don't owe her anything. That elbow is still going to bother me."` | `«Ничего я ей не должна. Но этот локоть меня ещё долго будет бесить».` |
| deep | invite | `"No. I watched her get it wrong and said nothing."` | `«Нет. Смотрела, как она ошибается, и молчала».` |
| deep | respond | `"Is it? I've only ever been the one watching."` | `«Правда? Я ведь всегда была той, кто смотрит».` |
| deep | space | `"No. I keep thinking about who I copied it from."` | `«Не обязана. А я всё думаю, у кого сама этому научилась».` |
| quiet | invite | `"No. She'd have stopped doing it."` | `«Нет. Тогда она бы перестала».` |
| quiet | respond | `"Maybe. It was only a warm-up."` | `«Может быть. Это всего лишь разминка».` |
| quiet | space | `"No. I'll leave her to it."` | `«Не обязана. Пусть сама делает».` |

The fiery elbow observation stays about technique; Russian does not suggest she touched the
younger player. `Юниорка` is the tennis context, not a new named character.

## 12. Situation R41 – `the-language-she-managed`

Subject `good-news`; stages `college`, `independent`; no fact gate. The other language is
unnamed. The English mentions switching to English; Russian says `наш язык` so RU mode does not
claim the family speaks English or change the fact that she managed the other language.

### 12.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"We had a whole conversation and she never switched to English. Never!"` | `«Мы весь разговор говорили на её языке, и она ни разу не перешла на наш. Ни разу!»` |
| fiery | `"She didn't switch. Most of them switch. That felt like a win."` | `«Она не перешла на наш язык. Обычно переходят. А тут – будто победа».` |
| deep | `"She let me be bad at it rather than making it easy. I think that was kind."` | `«Она не переходила на наш язык, пока я спотыкалась. Мне кажется, это было по-доброму».` |
| quiet | `"I managed a conversation this week. In theirs, not ours."` | `«На этой неделе у меня получился разговор. На их языке, не на нашем».` |

### 12.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what it was about` | `Спросить, о чём говорили` |
| respond | `Say people notice the trying` | `Сказать, что старание заметно` |
| space | `Say well done and change the subject` | `Похвалить её и сменить тему` |

### 12.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"The weather, mostly. And her dog. I know a lot about her dog now."` | `«В основном о погоде. И о её собаке. Теперь я много про эту собаку знаю».` |
| sunny | respond | `"Do they? I hope so. I was trying very obviously."` | `«Правда? Надеюсь. Я старалась очень заметно».` |
| sunny | space | `"Thanks. I'll stop going on about it. Probably not immediately."` | `«Спасибо. Перестану об этом говорить. Но, наверное, не сразу».` |
| fiery | invite | `"Nothing. The weather. And I was proud of every word of it."` | `«Ни о чём. О погоде. Но я гордилась каждым своим словом».` |
| fiery | respond | `"She noticed. She just didn't make it easy, and I'm glad."` | `«Заметила. Просто не стала мне облегчать задачу, и я рада».` |
| fiery | space | `"Not yet. I haven't finished being pleased about it."` | `«Нет, ещё рано менять тему. Я ещё не нарадовалась».` |
| deep | invite | `"Her dog, mostly. It took us a long time to get there."` | `«В основном о её собаке. Мы долго до неё добирались».` |
| deep | respond | `"She noticed. She let me finish the sentences badly."` | `«Заметила. Но дала мне самой договорить, пусть и с ошибками».` |
| deep | space | `"Thank you. I'd like to sit with it a bit longer."` | `«Спасибо. Хочу ещё немного побыть с этим».` |
| quiet | invite | `"Weather. Her dog. Nothing complicated."` | `«О погоде. О её собаке. Ничего сложного».` |
| quiet | respond | `"Maybe. She didn't say."` | `«Может быть. Она не сказала».` |
| quiet | space | `"Thanks. What's your news?"` | `«Спасибо. А у тебя что нового?»` |

The source does not specify the foreign language. No Russian line names a country, city or
language, and nothing implies a fluency score or new ability in mechanics.

## 13. Situation R42 – `the-invitation`

Subject `decision`; stages `college`, `independent`; no fact gate. A social invitation falls
before practice. The row does not require a calendar entry, a named event or a training penalty.
The quiet English opener names Friday; Russian keeps the evening relative to practice so it can
appear in any calendar week.

### 13.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I've been invited to a thing the night before practice and I haven't replied."` | `«Меня позвали кое-куда вечером перед тренировкой, а я до сих пор не ответила».` |
| fiery | `"I want to go. I shouldn't go. I've been arguing with myself about it."` | `«Хочу пойти. Не стоит идти. Я сама с собой об этом спорю».` |
| deep | `"I've left it so long that the silence is starting to answer for me."` | `«Я так долго молчу, что молчание уже начинает отвечать за меня».` |
| quiet | `"There's something on Friday. I haven't said either way."` | `«Меня зовут на вечер перед тренировкой. Я пока ни да ни нет».` |

### 13.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask whether she wants to go` | `Спросить, хочет ли она пойти` |
| respond | `Say one late evening is not a career` | `Сказать, что один поздний вечер не решает карьеру` |
| space | `Say she can say no without a reason` | `Сказать, что можно отказаться без объяснений` |

### 13.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"I do. That's the annoying bit. If I didn't want to go it'd be easy."` | `«Хочу. Вот что обидно. Если бы не хотела, было бы просто».` |
| sunny | respond | `"It isn't. I keep making it into one, though."` | `«Не решает. Но я всё превращаю в вопрос всей карьеры».` |
| sunny | space | `"I know. I'd still want to give them one."` | `«Знаю. Но мне всё равно хочется объяснить».` |
| fiery | invite | `"Yes. Obviously yes. That's why I haven't answered."` | `«Да. Конечно, да. Потому и молчу».` |
| fiery | respond | `"It isn't. Try telling me that at the start of practice."` | `«Не решает. Попробуй сказать мне это в начале тренировки».` |
| fiery | space | `"I can. I'm not saying no, I'm just not saying yes."` | `«Могу отказаться. Но я не говорю „нет“ – я просто не говорю „да“».` |
| deep | invite | `"I want to go. I've known that since they asked."` | `«Хочу. Знала это с той минуты, как позвали».` |
| deep | respond | `"No. I've been treating it like one all the same."` | `«Нет. Но веду себя так, будто решает».` |
| deep | space | `"I could. I'd rather say something than let it run out."` | `«Могу. Но лучше отвечу словами, чем позволю времени решить за меня».` |
| quiet | invite | `"I think so. It's the morning after I'm thinking about."` | `«Кажется, да. Думаю о следующем утре».` |
| quiet | respond | `"That's true. I'll probably go."` | `«Верно. Наверное, пойду».` |
| quiet | space | `"I know. I'll answer them properly."` | `«Знаю. Отвечу им нормально».` |

No parent response declares the invitation irresponsible or assigns an actual fatigue effect.
`Вечер перед тренировкой` preserves the decision without relying on a fixed weekday.

## 14. Situation R43 – `the-racket-she-is-not-sure-about`

Subject `decision`; stages `after-school`, `college`, `independent`; no fact gate. The offer to
alter racket balance is authored talk, not an available kit action. The text never promises a
performance improvement.

### 14.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Someone offered to set my racket up differently and now I can't stop thinking about it."` | `«Мне предложили иначе настроить ракетку, и теперь я не могу перестать об этом думать».` |
| fiery | `"I'm not changing anything mid-season. Probably."` | `«По ходу сезона ничего менять не буду. Наверное».` |
| deep | `"It might be better. It might stop feeling like mine. That's the part I can't get past."` | `«Может стать лучше. А может перестать ощущаться моей. Вот на этом я застряла».` |
| quiet | `"There's a different setup I could try. I haven't."` | `«Можно попробовать другую настройку ракетки. Пока не стала».` |

### 14.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what would change` | `Спросить, что именно изменится` |
| respond | `Say trying is not the same as switching` | `Сказать, что проба не обязывает менять ракетку` |
| space | `Say if it works, leave it` | `Сказать, что если ракетка работает, можно оставить как есть` |

### 14.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"More weight in the handle, apparently. It's meant to feel steadier."` | `«Кажется, добавят вес в ручку. Говорят, ракетка станет устойчивее».` |
| sunny | respond | `"That's a good point. I'd been treating them as the same thing."` | `«Хорошая мысль. А я считала, что это одно и то же».` |
| sunny | space | `"That's probably right. I'll leave it and stop thinking about it."` | `«Наверное. Оставлю как есть и перестану думать».` |
| fiery | invite | `"Weight in the handle. That's it. That's the whole offer."` | `«Вес в ручку. Всё. В этом и всё предложение».` |
| fiery | respond | `"It is if I like it. Then I've got a problem."` | `«Если понравится – значит, придётся менять. Вот тогда и будет проблема».` |
| fiery | space | `"It works. That's not the same as it being the best one."` | `«Работает. Но это не значит, что лучше уже не бывает».` |
| deep | invite | `"Weight in the handle. It's a small change and I still can't decide."` | `«Добавить вес в ручку. Мелочь, а я всё равно не могу решить».` |
| deep | respond | `"It isn't. I'd still know what the other one felt like."` | `«Не значит. Но я уже буду знать, как ощущается другой вариант».` |
| deep | space | `"I know. I'd still like to have tried it once."` | `«Знаю. И всё-таки хотелось бы раз попробовать».` |
| quiet | invite | `"A bit more weight in the handle. Nothing else."` | `«Немного больше веса в ручке. Больше ничего».` |
| quiet | respond | `"I suppose not. I could try it once."` | `«Наверное, нет. Один раз попробовать можно».` |
| quiet | space | `"Probably. I'll leave it as it is."` | `«Наверное. Оставлю как есть».` |

The shared respond label explicitly names the racket so `проба` cannot be confused with a
permanent switch. No line asserts the current season is at a particular week.

## 15. Situation R44 – `the-two-quiet-days`

Subject `decision`; stages `college`, `independent`; fact gate `clear-next-week`. The gate proves
no entered tournament next week, not two mechanically free days. Russian frames two quiet days
as something she hopes to reserve, so training or ordinary obligations are not denied.

### 15.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I've got two quiet days and I can't work out whether to do something with them."` | `«На следующей неделе нет турнира. Думаю, оставить два дня спокойными или чем-нибудь их занять».` |
| fiery | `"Two days. I'll either do something stupid with them or waste them entirely."` | `«Хочу выкроить два дня. Или натворю что-нибудь, или потрачу их впустую».` |
| deep | `"Two quiet days. I've been deciding what to do with them for longer than they'll last."` | `«Пытаюсь выкроить два спокойных дня. На раздумья о них уйдёт больше времени, чем на сами дни».` |
| quiet | `"A couple of quiet days coming. Nothing planned."` | `«На следующей неделе нет турнира. Может, оставлю пару дней без планов».` |

### 15.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she'd like to do` | `Спросить, чем ей хотелось бы заняться` |
| respond | `Say quiet days are allowed to stay quiet` | `Сказать, что спокойные дни можно оставить спокойными` |
| space | `Say she can decide on the day` | `Сказать, что решать можно по ходу дела` |

### 15.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Nothing. Genuinely nothing. And then I'll feel guilty about the nothing."` | `«Ничем. Совсем ничем. А потом буду чувствовать вину за это „ничего“».` |
| sunny | respond | `"They are. I'm terrible at letting them, though. I always find something."` | `«Можно. Только я плохо умею их такими оставлять. Всегда что-нибудь нахожу».` |
| sunny | space | `"I will, then. That's easier than working it out in advance."` | `«Тогда так и решу. Это проще, чем всё продумывать заранее».` |
| fiery | invite | `"Something. I don't know what. That's the whole problem with two days."` | `«Чем-нибудь. Не знаю чем. В том и проблема с двумя днями».` |
| fiery | respond | `"Allowed. Everyone keeps saying allowed. I still can't sit down."` | `«Можно, можно. Все так говорят. А я всё равно не могу усидеть».` |
| fiery | space | `"I'll have decided by then. I always decide early and then change it."` | `«К тому времени уже решу. Я всегда решаю заранее, а потом передумываю».` |
| deep | invite | `"Sleep. And then I'd want the two days back to do properly."` | `«Спать. А потом захотела бы вернуть эти два дня и провести их „как следует“».` |
| deep | respond | `"They are. I'm not good at leaving a day alone."` | `«Можно. Но я не умею оставлять день в покое».` |
| deep | space | `"All right. I'd rather know now, but all right."` | `«Хорошо. Хотелось бы знать сейчас, но хорошо».` |
| quiet | invite | `"Not much. Wash things. Read a bit."` | `«Немногое. Постирать. Почитать».` |
| quiet | respond | `"That's true. I'll see how they go."` | `«Верно. Посмотрю, как пройдут».` |
| quiet | space | `"Fine. I'll leave it until then."` | `«Ладно. Пока не буду решать».` |

The author's `two days` survives as her own plan rather than a schedule guarantee. No branch
assigns fatigue, training or bond effects to resting.

## 16. Corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 51 / 51 | 969 / 969 | 4 / 4 | all current generated situations complete as DRAFT |

⚙ 14.10: four rows joined at the end of the catalogue – the current count is in §22.

## 17. r51 №17 – four school-years story situations (14.10)

⚖ 14.10 владелец: «по остальным к вычитке ок» – ряды этого раздела `APPROVED`.

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's item №17: «ситуация "Она подает, мяч задевает трос сетки - и падает в кофе одного папы." очень крутая. Но я ее видел уже 3 раза. Давай сделаем разнообразие этих юморных зарисовок и как-то сделаем, чтобы они более рандомно происходили?»

Four new `story` situations, R53–R56, appended last in the generated catalogue (English authority: the 14.10 addendum in `docs/specs/small-talk-corpus-2026-09.md`). Both languages in one change. Each is a teaser, a shared incident and three replies, in all four voices, like the court-four rows in [RU-10 life beats](ru-life-beats-small-talk-2026-10.md) §11. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian.

## 18. Situation R53 – `the-gran-with-sunscreen`

Subject `story`; stages `school`; no fact gate. `Смена сторон` is the tennis changeover. The umpire is never given a gender in Russian: the thanks is a nominal sentence (`От судьи – „спасибо“`) and the sunscreen goes `судье` in the dative, the way `ru.json` already writes `пожала руку судье`. `Нам обеим` is the two players, both girls.

### 18.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Wait till you hear what happened at the changeover."` | `«Подожди, сейчас расскажу, что было на смене сторон.»` |
| fiery | `"That changeover should not have been allowed."` | `«Такое на смене сторон вообще нельзя было разрешать.»` |
| deep | `"I keep thinking about the changeover. Not the tennis – the changeover."` | `«Всё думаю про смену сторон. Не про теннис – про смену сторон.»` |
| quiet | `"The changeover went on a bit."` | `«Смена сторон немного затянулась.»` |

### 18.2 Shared second beats

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Somebody's gran walked onto the court with a tube of sunscreen and did both our ears. Then the umpire's neck. Nobody stopped her."` | `«Чья-то бабушка вышла на корт с тюбиком солнцезащитного крема и намазала уши нам обеим. Потом шею судье. Её никто не остановил.»` |
| fiery | `"A gran walks onto the court with a tube of sunscreen – both our ears, then the umpire's neck. Nobody stopped her."` | `«Бабушка выходит на корт с тюбиком солнцезащитного крема – уши нам обеим, потом шея судьи. Её никто не остановил.»` |
| deep | `"Somebody's gran came onto the court with a tube of sunscreen. Both our ears, then the umpire's neck. It didn't cross anyone's mind to stop her."` | `«Чья-то бабушка пришла на корт с тюбиком солнцезащитного крема. Уши нам обеим, потом шея судьи. Никому и в голову не пришло её остановить.»` |
| quiet | `"A gran came on with sunscreen. She did both our ears, and the umpire's neck. Nobody stopped her."` | `«Вышла бабушка с солнцезащитным кремом. Намазала нам обеим уши и судье шею. Её никто не остановил.»` |

### 18.3 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what happened at the changeover` | `Спросить, что случилось на смене сторон` |
| respond | `Say you wish you had been there` | `Сказать, что жаль, что вас там не было` |
| space | `Let her tell it` | `Дать ей рассказать самой` |

### 18.4 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"The umpire said thank you. Properly. Then called time, as if it was planned."` | `«От судьи – „спасибо“. Всерьёз. А потом нас позвали играть дальше, будто так и было задумано.»` |
| sunny | respond | `"You'd have loved it. I looked at my shoes for a whole game."` | `«Тебе бы понравилось. Целый гейм я смотрела на свои кроссовки.»` |
| sunny | space | `"Anyway. I smelled of coconut for the rest of the day. I didn't mind."` | `«В общем, до конца дня я пахла кокосом. Меня это не смущало.»` |
| fiery | invite | `"The umpire thanked her. THANKED her. Then called time like it was normal."` | `«От судьи – „спасибо“. СПАСИБО. А потом нас позвали играть дальше, как будто так и надо.»` |
| fiery | respond | `"You'd have laughed. I held it in with my whole face."` | `«Тебе было бы смешно. А я сдерживалась всем лицом.»` |
| fiery | space | `"Anyway, I smelled of coconut until the last game. Nobody warns you."` | `«Короче, я пахла кокосом до последнего гейма. Про такое никто не предупреждает.»` |
| deep | invite | `"The umpire thanked her. I think it was the only thing left to say."` | `«От судьи – „спасибо“. По-моему, больше ничего и не оставалось сказать.»` |
| deep | respond | `"I wish you had been. Would you have laughed, or stood very still?"` | `«Жаль, что тебя там не было. Хотелось бы знать: смех или полная неподвижность?»` |
| deep | space | `"That's all of it. The coconut stayed with me until the last game."` | `«Вот и всё. Кокос держался до последнего гейма.»` |
| quiet | invite | `"The umpire said thank you. Then we played."` | `«От судьи – „спасибо“. И мы играли дальше.»` |
| quiet | respond | `"You'd have liked it. I kept very still."` | `«Тебе бы понравилось. Я стояла не шелохнувшись.»` |
| quiet | space | `"That's all. I smelled of coconut for a while."` | `«Вот и всё. Какое-то время я пахла кокосом.»` |

## 19. Situation R54 – `the-rooster-ringtone`

Subject `story`; stages `school`, `after-school`; no fact gate. `Розыгрыш` is the rally, `рингтон` is the word everyone says, and `слышали три корта` keeps the count of three. `Одна мама` follows `одного папы` in the court-four rows: a stranger the sentence never names.

### 19.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A phone went off in the middle of a rally and I'm still not over it."` | `«Посреди розыгрыша зазвонил телефон, и я до сих пор не отошла.»` |
| fiery | `"A phone went off in the middle of a rally. Of course it did."` | `«Посреди розыгрыша зазвонил телефон. Ну конечно.»` |
| deep | `"A phone went off in the middle of a rally, and I've been thinking about it since."` | `«Посреди розыгрыша зазвонил телефон, и я с тех пор об этом думаю.»` |
| quiet | `"A phone went off during a rally."` | `«Во время розыгрыша зазвонил телефон.»` |

### 19.2 Shared second beats

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The ringtone was a rooster. A mum answered it and whispered that she couldn't talk, she was at the tennis. Three courts heard."` | `«Рингтоном был петух. Какая-то мама ответила и зашептала, что не может говорить, она на теннисе. Слышали три корта.»` |
| fiery | `"The ringtone's a rooster – and a mum answers it, whispering that she can't talk, she's at the tennis. Three courts heard."` | `«Рингтон – петух. Одна мама отвечает шёпотом, что не может говорить, она на теннисе. Слышали три корта.»` |
| deep | `"The ringtone was a rooster. A mum answered, whispering that she couldn't talk, she was at the tennis. Three courts heard every word."` | `«Рингтоном был петух. Одна мама ответила шёпотом, что говорить не может: она на теннисе. Каждое слово слышали три корта.»` |
| quiet | `"It was a rooster. A mum answered and whispered that she was at the tennis. Three courts heard."` | `«Это был петух. Какая-то мама ответила шёпотом, что она на теннисе. Слышали три корта.»` |

### 19.3 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask whose phone it was` | `Спросить, чей это был телефон` |
| respond | `Say you're already smiling` | `Сказать, что вы уже улыбаетесь` |
| space | `Let her tell the rest` | `Дать ей рассказать остальное` |

### 19.4 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"No idea which mum. It rang again two minutes later. Same rooster, same whisper."` | `«Понятия не имею, какая мама. Через две минуты зазвонило снова. Тот же петух, тот же шёпот.»` |
| sunny | respond | `"Good. I was too. I had to turn my back and bounce a ball."` | `«Вот и хорошо, я тоже. Пришлось отвернуться и постучать мячом об корт.»` |
| sunny | space | `"Oh, and at the next changeover every parent along the fence checked their phone."` | `«Да, и на следующей смене сторон все родители вдоль ограды проверили телефоны.»` |
| fiery | invite | `"Somebody's mum. I never found out which. Two minutes later: same rooster, same whisper."` | `«Чья-то мама. Чья – так и не узнала. Через две минуты снова: тот же петух, тот же шёпот.»` |
| fiery | respond | `"Good. I had to stare at the net like it owed me money."` | `«Вот и славно. Мне пришлось смотреть на сетку так, будто она мне должна.»` |
| fiery | space | `"At the next changeover every parent along that fence checked their phone. Good."` | `«На следующей смене сторон все родители вдоль той ограды проверили телефоны. Правильно.»` |
| deep | invite | `"I never found out which mum. Two minutes later: the same rooster, the same whisper."` | `«Какая это была мама, я так и не узнала. Через две минуты – тот же петух, тот же шёпот.»` |
| deep | respond | `"I was, a little. It was the whisper – so careful, and so loud."` | `«Немного, да. Дело было в шёпоте – таком осторожном и таком громком.»` |
| deep | space | `"That's the whole of it. By the next changeover every parent had quietly checked their phone."` | `«Вот и вся история. К следующей смене сторон все родители тихо проверили телефоны.»` |
| quiet | invite | `"I don't know which mum. It rang again two minutes later."` | `«Не знаю, какая мама. Через две минуты зазвонило снова.»` |
| quiet | respond | `"It was funny. I looked at my strings."` | `«Было смешно. Я смотрела на струны.»` |
| quiet | space | `"That's it. At the next changeover everyone checked their phones."` | `«Вот и всё. На следующей смене сторон все проверили телефоны.»` |

## 20. Situation R55 – `the-coin-and-the-drain`

Subject `story`; stages `school`, `after-school`; no fact gate. `Жеребьёвка` is the coin toss, `водосток` the drain, and the racket spin is told as which end is `верхний`. The respond label says the story will be good and all four replies open with `Хорошая`, which answers `история`.

### 20.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The coin toss was the funniest part of the day. I'm not joking."` | `«Жеребьёвка была самой смешной частью дня. Я не шучу.»` |
| fiery | `"A coin toss. How hard can a coin toss be?"` | `«Жеребьёвка. Что сложного может быть в жеребьёвке?»` |
| deep | `"Something small went wrong at the coin toss and I haven't been able to let it go."` | `«На жеребьёвке пошло не так что-то мелкое, и я никак не могу это отпустить.»` |
| quiet | `"There was a problem with the coin toss."` | `«С жеребьёвкой вышла загвоздка.»` |

### 20.2 Shared second beats

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The coin bounced, rolled across the baseline and dropped straight down a drain. Nobody had another one. We spun a racket instead."` | `«Монетка подпрыгнула, прокатилась через заднюю линию и упала прямо в водосток. Другой ни у кого не нашлось. Вместо неё мы крутили ракетку.»` |
| fiery | `"The coin lands, rolls across the baseline – and goes down a drain. Nobody had another. We spun a racket instead."` | `«Монетка падает, катится через заднюю линию – и в водосток. Другой ни у кого не было. Вместо неё мы крутили ракетку.»` |
| deep | `"The coin hit the court, rolled to the baseline and went down a drain. Nobody had another, so we spun a racket."` | `«Монетка ударилась о корт, докатилась до задней линии и ушла в водосток. Другой ни у кого не было, так что мы крутили ракетку.»` |
| quiet | `"The coin went down a drain. Nobody had another, so we spun a racket."` | `«Монетка ушла в водосток. Другой ни у кого не было, поэтому мы крутили ракетку.»` |

### 20.3 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what went wrong with the coin toss` | `Спросить, что пошло не так с жеребьёвкой` |
| respond | `Say you can tell this one is good` | `Сказать, что чувствуете: история будет хорошая` |
| space | `Let her carry on` | `Дать ей продолжать` |

### 20.4 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Then we spent a minute working out which end of the racket was up."` | `«Потом мы минуту выясняли, какой конец ракетки считается верхним.»` |
| sunny | respond | `"It is. I looked down the drain afterwards, just in case."` | `«Хорошая. Потом я заглянула в водосток – на всякий случай.»` |
| sunny | space | `"And it was my racket we spun. It's never had so much attention."` | `«А крутили мою ракетку. Столько внимания у неё ещё не было.»` |
| fiery | invite | `"Then we argued about which end of a racket is up. A whole minute."` | `«Потом спорили, какой конец ракетки верхний. Целую минуту.»` |
| fiery | respond | `"It is. I looked down that drain afterwards. Nothing. I'm not climbing in."` | `«Хорошая. Потом заглянула в тот водосток. Ничего. Лезть туда я не собираюсь.»` |
| fiery | space | `"For the record, it was my racket we spun. Mine was the one nearest."` | `«Для протокола: крутили мою ракетку. Она просто оказалась ближе всех.»` |
| deep | invite | `"Then we spent a minute agreeing which end was up. Strange what you forget."` | `«Потом минуту договаривались, какой конец верхний. Странно, что именно это забываешь.»` |
| deep | respond | `"It is. I looked down the drain afterwards. I don't know what for."` | `«Хорошая. Потом я заглянула в водосток. Сама не знаю зачем.»` |
| deep | space | `"That's the end of it. It was my racket, and I felt oddly responsible."` | `«Вот и конец истории. Ракетка была моя, и я почему-то чувствовала за неё ответственность.»` |
| quiet | invite | `"Then we had to agree which end was up. It took a minute."` | `«Потом нам пришлось договариваться, какой конец верхний. Это заняло минуту.»` |
| quiet | respond | `"It is. I looked down the drain afterwards. Nothing."` | `«Хорошая. Потом я заглянула в водосток. Ничего.»` |
| quiet | space | `"That's all, really. It was my racket, as it happens."` | `«Вот и всё, в общем. Ракетка, кстати, была моя.»` |

## 21. Situation R56 – `the-gull-in-the-chair`

Subject `story`; stages `school`, `after-school`; no fact gate. `Судейская вышка` is the umpire's chair and the gull is `она`. The umpire's verbs are in the present tense (`садится`, `осматривает`) on purpose: a Russian past tense would have to say whether the umpire is a man or a woman, and the English never does. The scene is told in the present throughout so the two beats agree.

### 21.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The umpire's chair got taken. I can't tell you how funny it was."` | `«Судейскую вышку заняли. Не передать, как это было смешно.»` |
| fiery | `"Someone else got the umpire's chair. I'm not exaggerating."` | `«Судейская вышка досталась кому-то другому. Я не преувеличиваю.»` |
| deep | `"Something unexpected took the umpire's chair, and I keep going back to it."` | `«Судейскую вышку занял кто-то неожиданный, и я всё время к этому возвращаюсь.»` |
| quiet | `"The umpire's chair was occupied."` | `«Судейская вышка была занята.»` |

### 21.2 Shared second beats

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A seagull walked up the steps and sat in it while the umpire was at the net. The umpire came back and sat on the bottom step."` | `«Чайка поднимается по ступенькам и садится на вышку, пока судья у сетки. Судья возвращается и садится на нижнюю ступеньку.»` |
| fiery | `"A seagull walks up the steps and takes it while the umpire's at the net. The umpire came back and sat on the bottom step."` | `«Чайка поднимается по ступенькам и занимает вышку, пока судья у сетки. Судья возвращается и садится на нижнюю ступеньку.»` |
| deep | `"A seagull climbed the steps and sat down while the umpire was at the net. The umpire came back, looked at it, and sat on the bottom step."` | `«Чайка поднимается по ступенькам и садится, пока судья у сетки. Судья возвращается, смотрит на неё и садится на нижнюю ступеньку.»` |
| quiet | `"A seagull sat in it while the umpire was at the net. The umpire sat on the bottom step."` | `«Чайка садится на вышку, пока судья у сетки. Судья садится на нижнюю ступеньку.»` |

### 21.3 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask who was in the umpire's chair` | `Спросить, кто сидел на судейской вышке` |
| respond | `Say you can picture it` | `Сказать, что вы это прекрасно представляете` |
| space | `Say nothing and let her go on` | `Ничего не говорить и дать ей продолжать` |

### 21.4 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"It stayed the whole next game. The umpire called the score from the step, politely."` | `«Она сидит весь следующий гейм. Счёт объявляют со ступеньки, очень вежливо.»` |
| sunny | respond | `"You can, can't you? Best seat in the place, and none of the paperwork."` | `«Можешь же себе представить? Лучшее место на корте и никакой бумажной работы.»` |
| sunny | space | `"Oh, and when it flew off, the umpire checked the seat very thoroughly."` | `«Да, и когда чайка улетает, судья очень тщательно осматривает сиденье.»` |
| fiery | invite | `"The whole next game. Score called from the step. The gull never looked up."` | `«Весь следующий гейм. Счёт объявляют со ступеньки. Чайка ни разу не поднимает голову.»` |
| fiery | respond | `"Then you've got it. The most senior person on court, and it knew it."` | `«Тогда всё ясно. Главнее всех на корте она – и она это знает.»` |
| fiery | space | `"And when it finally left, the umpire inspected the chair before sitting. Wise."` | `«А когда чайка наконец улетает, судья осматривает вышку, прежде чем сесть. Разумно.»` |
| deep | invite | `"The whole next game. The umpire called the score from the step, a little lower than usual."` | `«Весь следующий гейм. Счёт объявляют со ступеньки, чуть ниже обычного.»` |
| deep | respond | `"It sat very still, as if it had been there longer than us. It probably had."` | `«Она сидит совершенно неподвижно, будто здесь дольше нас. Наверное, так и есть.»` |
| deep | space | `"After it flew off, the umpire checked the seat first. I respected that."` | `«Когда чайка улетает, судья сначала осматривает сиденье. Я это уважаю.»` |
| quiet | invite | `"The whole next game. The umpire called the score from the step."` | `«Весь следующий гейм. Счёт объявляют со ступеньки.»` |
| quiet | respond | `"It was very calm about it. No one argued."` | `«Она очень спокойна. Никто не спорит.»` |
| quiet | space | `"That's everything. When it left, the umpire checked the seat first."` | `«Вот и всё. Когда чайка улетает, судья сначала осматривает сиденье.»` |

## 22. r51 – three school-years observation situations (14.10)

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's words on the school years' thin subjects: «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

Three new `observation` situations, R57–R59, appended last in the generated catalogue (English authority: the second 14.10 addendum in `docs/specs/small-talk-corpus-2026-09.md`). Both languages in one change. Each is an opener and three replies in all four voices, with no shared second beat – an observation is something she noticed, not an incident she tells – like the observation rows in §9–§15 above. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian.

## 23. Situation R57 – `the-warm-up-friends`

Subject `observation`; stages `school`, `after-school`; no fact gate. `Те двое` keeps the two girls without an age or a name – a school girl and a young woman can say it alike – and `разминка` is the warm-up. `Бить на ракетку` is the warm-up courtesy of sending the ball straight to the other racket, `подача` is the serve, and `счёты` carries the grudge without naming a quarrel. The respond label puts the handshake `у сетки`, at the net, and the daughter's `ты` is never needed inside her lines.

### 23.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The two on the next court were so friendly in the warm-up. Then the first point started and they were strangers."` | `«Те двое на соседнем корте на разминке были такие дружные. Потом начался первый розыгрыш, и они стали как чужие.»` |
| fiery | `"Best friends in the warm-up. Strangers from the first serve. Where is that switch, and how do I get one?"` | `«На разминке – лучшие подруги. С первой подачи – чужие. Где у них этот переключатель? Мне такой тоже нужен.»` |
| deep | `"They were kind to each other in the warm-up. Once the first ball went up, neither looked at the other."` | `«На разминке они были добры друг к другу. Стоило первому мячу взлететь вверх – и они больше не смотрели друг на друга.»` |
| quiet | `"Two of them on the next court talked all through the warm-up. Then the match began, and they stopped."` | `«Двое на соседнем корте всю разминку разговаривали. Потом начался матч, и они замолчали.»` |

### 23.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask when it changed` | `Спросить, когда всё изменилось` |
| respond | `Say it probably went back at the net` | `Сказать, что у сетки, наверное, всё вернулось` |
| space | `Say she does not have to work it out` | `Сказать, что ей не обязательно в этом разбираться` |

### 23.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"At the very first serve. Before it they hit to each other's rackets. After it, neither of them did."` | `«Ровно на первой подаче. До неё они били друг другу прямо на ракетку. После неё – ни одна.»` |
| sunny | respond | `"It did. They shook hands and started chatting again as if nothing had happened."` | `«Вернулось. Они пожали друг другу руки и снова болтали, как ни в чём не бывало.»` |
| sunny | space | `"I'm not trying to. I'm just glad I got to see it."` | `«Я и не пытаюсь. Просто хорошо, что я это увидела.»` |
| fiery | invite | `"The first serve. That's the whole switch. A ball goes up and suddenly they've both got a grudge."` | `«С первой подачи. Вот и весь переключатель. Мяч взлетает – и у обеих вдруг счёты друг с другом.»` |
| fiery | respond | `"It did. Straight away. That's the part I can't get over."` | `«Вернулось. Сразу же. Вот этого я переварить и не могу.»` |
| fiery | space | `"I'll work it out anyway. I'd like to be able to do that."` | `«Я всё равно разберусь. Хочу так уметь.»` |
| deep | invite | `"The first serve. The moment the ball left the hand, they were somebody else."` | `«С первой подачи. Мяч ушёл из руки – и они стали другими людьми.»` |
| deep | respond | `"It did. How easily it came back is the part I keep thinking about."` | `«Вернулось. Меня не отпускает, как легко оно вернулось.»` |
| deep | space | `"I know. I'll probably keep watching for the exact moment it turns, though."` | `«Знаю. Но, наверное, всё равно буду высматривать тот самый момент, когда всё меняется.»` |
| quiet | invite | `"At the first serve. That was all it took."` | `«На первой подаче. Больше ничего не понадобилось.»` |
| quiet | respond | `"It did. They were talking again at the net."` | `«Вернулось. У сетки они уже опять разговаривали.»` |
| quiet | space | `"I know. I only wanted to tell somebody."` | `«Знаю. Мне просто хотелось кому-то рассказать.»` |

## 24. Situation R58 – `the-sound-of-a-clean-ball`

Subject `observation`; stages `school`, `after-school`; no fact gate. `Обернулись` is everyone looking round; `стук` is the knock – short and solid, never a crack or a bang – so that all four voices describe one sound. The respond label uses the neutral `знаете`, the way the older observation rows address the parent, and the space label follows `ей не обязательно` in the rows before it. The daughter's `ты` appears in two replies and is only the relationship voice.

### 24.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"One ball on the next court sounded so good that everybody looked round. Nobody said a word."` | `«На соседнем корте один мяч прозвучал так хорошо, что все обернулись. И никто не сказал ни слова.»` |
| fiery | `"One ball made one sound and every head on the court turned. I want that sound."` | `«Один мяч, один звук – и все на корте повернули головы. Я хочу такой звук.»` |
| deep | `"A ball on the next court was hit so cleanly that everyone looked round. It was a while before I stopped hearing it."` | `«На соседнем корте мяч ударили так чисто, что все обернулись. Я ещё долго слышала этот звук.»` |
| quiet | `"A ball on the next court made a sound and everyone looked round. I did too."` | `«На соседнем корте мяч издал звук, и все обернулись. Я тоже.»` |

### 24.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what it sounded like` | `Спросить, как это звучало` |
| respond | `Say you know that sound` | `Сказать, что знаете этот звук` |
| space | `Say she does not have to chase it` | `Сказать, что ей не обязательно за ним гнаться` |

### 24.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"A short, solid knock. Like tapping a really good table."` | `«Короткий, плотный стук. Как будто постучали по очень хорошему столу.»` |
| sunny | respond | `"I thought you might. It's the best noise in the sport, honestly."` | `«Я так и думала. По-моему, это лучший звук во всём теннисе.»` |
| sunny | space | `"I'm not chasing it. I'd just like to hear it again."` | `«Я и не гонюсь. Просто хочу услышать ещё раз.»` |
| fiery | invite | `"A knock. Short, solid, final. A door that has made up its mind."` | `«Стук. Короткий, плотный, окончательный. Как дверь, которая уже всё решила.»` |
| fiery | respond | `"Then you know. It's the one honest sound in the whole game."` | `«Тогда ты знаешь. Это единственный честный звук во всей игре.»` |
| fiery | space | `"I'm chasing it anyway. That sound is the point."` | `«А я всё равно гонюсь. В этом звуке весь смысл.»` |
| deep | invite | `"A knock with nothing around it. Over before I'd looked up, and I can still hear it."` | `«Стук, и вокруг него ничего. Кончился раньше, чем я подняла голову, а я его всё ещё слышу.»` |
| deep | respond | `"You do? I wasn't sure anyone else heard it the way I do."` | `«Правда? Я не была уверена, что кто-то ещё слышит это так, как я.»` |
| deep | space | `"I know. You can't go after it. It turns up, and I want to be listening when it does."` | `«Знаю. За ним не угнаться. Он появляется сам, и мне хочется в этот момент слушать.»` |
| quiet | invite | `"A short knock. That's all it was."` | `«Короткий стук. Вот и всё.»` |
| quiet | respond | `"Then it isn't only me. Good."` | `«Значит, не только я. Хорошо.»` |
| quiet | space | `"I know. I'll just listen for it."` | `«Знаю. Буду просто прислушиваться.»` |

## 25. Situation R59 – `the-fence-says-unlucky`

Subject `observation`; stages `school`, `after-school`; no fact gate. `Не повезло` is what is said at a Russian fence too, and it is quoted `„не повезло“` inside `«»`, the way the gran row quotes `„спасибо“`. `Забор` is the fence the adults stand along, the players are `игроки` as in the older observation rows, and `тому, кто промахнулся` keeps whoever missed without a gender. The respond label uses the neutral `вы`-form with no past tense, so the parent is neither mother nor father.

### 25.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"The adults at the fence say 'unlucky' after every miss, even a bad shot. It's funny once you start listening."` | `«Взрослые у забора после каждого промаха говорят „не повезло“. Даже после плохого удара. Смешно, когда начинаешь прислушиваться.»` |
| fiery | `"Every adult at the fence said 'unlucky'. That was not unlucky. That was a bad shot and everybody could see it."` | `«Все взрослые у забора сказали „не повезло“. Это не невезение. Это плохой удар, и все это видели.»` |
| deep | `"I've started listening to the fence. 'Unlucky,' after nearly every miss, even the bad shots. I can't stop hearing it."` | `«Я начала прислушиваться к тому, что говорят у забора. „Не повезло“ – почти после каждого промаха, даже после плохих ударов. Теперь я только это и слышу.»` |
| quiet | `"The adults at the fence say 'unlucky' a lot. Even when it was only a bad shot."` | `«Взрослые у забора часто говорят „не повезло“. Даже когда это просто плохой удар.»` |

### 25.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the players do when they hear it` | `Спросить, что делают игроки, когда это слышат` |
| respond | `Say you will try to say what you actually see` | `Сказать, что постараетесь говорить как есть` |
| space | `Say it is mostly kindness` | `Сказать, что это по большей части от доброты` |

### 25.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"They nod. Every time, very politely. It's like a password."` | `«Кивают. Каждый раз, очень вежливо. Как будто это пароль.»` |
| sunny | respond | `"Please do. I'd rather know what I actually did. Politely, though."` | `«Пожалуйста. Я лучше узнаю, что на самом деле сделала. Только вежливо.»` |
| sunny | space | `"I know. It's very kind. I just keep waiting for somebody to say what happened."` | `«Знаю. Это очень мило. Просто я всё жду, что кто-нибудь скажет, как было на самом деле.»` |
| fiery | invite | `"They nod. Every single one. As if it were an actual explanation."` | `«Кивают. Все до одного. Как будто это и правда объяснение.»` |
| fiery | respond | `"Good. Tell me what you see. I can take it."` | `«Хорошо. Говори, что видишь. Я выдержу.»` |
| fiery | space | `"It's kind. It's also not true. I'm allowed to notice both."` | `«Это мило. И это неправда. Мне можно заметить и то и другое.»` |
| deep | invite | `"They nod. I think they know exactly what the word is covering for."` | `«Кивают. По-моему, они прекрасно знают, что эти слова на самом деле значат.»` |
| deep | respond | `"I'd like that. I can use a true thing. I can't use 'unlucky'."` | `«Мне бы этого хотелось. Правду я могу использовать, а „не повезло“ – нет.»` |
| deep | space | `"I think it is. I just don't think it helps whoever missed."` | `«Наверное, так и есть. Только тому, кто промахнулся, это не помогает.»` |
| quiet | invite | `"They nod, mostly."` | `«В основном кивают.»` |
| quiet | respond | `"That would help. 'Unlucky' never does."` | `«Это помогло бы. „Не повезло“ не помогает никогда.»` |
| quiet | space | `"Probably. It doesn't tell anyone anything, though."` | `«Наверное. Но это же никому ничего не говорит.»` |

## 26. r51 – two school-years curiosity situations and one good-news situation (14.10)

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's words on the school years' thin subjects: «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

Three new situations, R60–R62, appended last in the generated catalogue (English authority: the third 14.10 addendum in `docs/specs/small-talk-corpus-2026-09.md`): two `curiosity` rows, R60 and R61, and one `good-news` row, R62. Both languages in one change. Each is an opener and three replies in all four voices, with no shared second beat – a curiosity is a question she brings, a good news is a thing she brings, and neither is an incident she tells in two beats. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian.

## 27. Situation R60 – `the-ball-she-let-go`

Subject `curiosity`; stages `school`, `after-school`; no fact gate. `Теннисистка постарше` keeps the older player without a name or an age – a girl and a young woman can both say it – and every voice says the ball `упал в аут`, so that all four describe one ball. The older player is in the feminine past because she is a player, not a professional; the respond label says `они` for the older players, and the space label follows `ей пока не обязательно`, the way the curiosity rows before it use `ей не обязательно`. `Приглядываться` and `присмотреться` are watching with attention, never practice – nothing here says she has got better at reading a ball.

### 27.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"How does an older player know a ball is going out? One just let it go by."` | `«Как теннисистка постарше понимает, что мяч уйдёт в аут? Одна из них просто пропустила его.»` |
| fiery | `"An older player didn't move for a ball, and it landed out. I want to know how she knew."` | `«Теннисистка постарше даже не двинулась за мячом, и он упал в аут. Хочу знать, откуда она это знала.»` |
| deep | `"An older player left a ball alone, and it landed out. I keep wondering what she saw."` | `«Теннисистка постарше не тронула мяч, и он упал в аут. Я всё думаю, что она увидела.»` |
| quiet | `"An older player let a ball go by. It landed out. How did she know?"` | `«Теннисистка постарше пропустила мяч. Он упал в аут. Откуда она знала?»` |

### 27.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the player did` | `Спросить, что делала эта теннисистка` |
| respond | `Say they have watched so many balls they just know` | `Сказать, что они видели столько мячей, что просто знают` |
| space | `Say she does not have to see it yet` | `Сказать, что ей пока не обязательно это видеть` |

### 27.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Nothing. She watched it all the way with her racket down. So calm."` | `«Ничего. Она следила за мячом до конца, ракетка опущена. Такая спокойная.»` |
| sunny | respond | `"So it's just watching, lots and lots of it. I can do that."` | `«То есть надо просто смотреть, и очень много. Это я могу.»` |
| sunny | space | `"Okay. I'll keep watching and see if it starts to make sense."` | `«Ладно. Буду приглядываться и посмотрю, станет ли что-то понятнее.»` |
| fiery | invite | `"Nothing. Not a step. She watched it land out like she'd arranged it."` | `«Ничего. Ни шага. Смотрела, как он падает в аут, будто сама так всё устроила.»` |
| fiery | respond | `"Then I'll watch more. A lot more. Starting with the very next ball."` | `«Тогда буду смотреть больше. Гораздо больше. Прямо с ближайшего мяча.»` |
| fiery | space | `"Fine. But I'm watching her feet next time."` | `«Ладно. Но в следующий раз я буду смотреть ей на ноги.»` |
| deep | invite | `"Nothing. She stood still and watched, as if she already knew."` | `«Ничего. Стояла на месте и смотрела, будто уже знала.»` |
| deep | respond | `"So it is looking, for a long time. I cannot hurry it."` | `«Значит, нужно долго смотреть. Ускорить это я не могу.»` |
| deep | space | `"I know. I would still like to see it once."` | `«Знаю. Но мне всё равно хотелось бы увидеть это хотя бы раз.»` |
| quiet | invite | `"Nothing. She just watched it go."` | `«Ничего. Просто смотрела, как он летит.»` |
| quiet | respond | `"So I'll watch more of them."` | `«Тогда буду смотреть на них побольше.»` |
| quiet | space | `"Okay. I'll watch for it next time."` | `«Хорошо. В следующий раз присмотрюсь.»` |

## 28. Situation R61 – `sorry-for-a-lucky-point`

Subject `curiosity`; stages `school`, `after-school`; no fact gate. The net cord is the ball that `задевает` or `задел сетку` in the two voices that tell the moment, and `касание сетки` in the two that name the point it won – Russian players say the ball `задел сетку` – and `за очко не извиняются` is the fiery verdict. `Теннисистка` and `соперница` keep the two girls without an age, `везение` is luck, and the space label puts the not-knowing on the family `мы`, so the parent is neither mother nor father. The sunny space reply says `можем подумать об этом вместе`: the English wonders together, and Russian thinks together.

### 28.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Why do people say sorry when the ball clips the net and drops over? It's still a point."` | `«Почему люди извиняются, когда мяч задевает сетку и падает на другую сторону? Это же всё равно очко.»` |
| fiery | `"You don't say sorry for a point. A girl did, when the ball clipped the net. Why?"` | `«За очко не извиняются. А одна теннисистка извинилась, когда мяч задел сетку. Почему?»` |
| deep | `"I keep wondering what a girl was sorry for when she won a point off the net cord."` | `«Я всё думаю, за что извинялась теннисистка, выигравшая очко после касания сетки.»` |
| quiet | `"A girl said sorry for a point off the net cord. I didn't know you did that."` | `«Одна теннисистка извинилась за очко после касания сетки. Я не знала, что так делают.»` |

### 28.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the other girl did` | `Спросить, что сделала соперница` |
| respond | `Say it is a way of admitting it was luck` | `Сказать, что так признают везение` |
| space | `Say you never worked it out either` | `Сказать, что мы тоже так и не разобрались` |

### 28.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"She just nodded, like it was completely normal. Maybe it is."` | `«Она просто кивнула, как будто это совершенно нормально. Может, так оно и есть.»` |
| sunny | respond | `"Oh. So it's like saying, I know that was lucky. I like that."` | `«А. То есть это как сказать: я знаю, что мне повезло. Мне нравится.»` |
| sunny | space | `"Really? Good. Then I'm not behind. We can wonder together."` | `«Правда? Хорошо. Тогда я не отстаю. Можем подумать об этом вместе.»` |
| fiery | invite | `"She nodded. Like a debt had just been paid."` | `«Кивнула. Будто ей только что вернули долг.»` |
| fiery | respond | `"So it's manners about luck. All right. I'm still keeping the point."` | `«Значит, это такие манеры насчёт везения. Ладно. Очко я всё равно оставлю себе.»` |
| fiery | space | `"Great. Two of us who don't get it. I'll find out first."` | `«Отлично. Нас двое, кто этого не понимает. Я разберусь первой.»` |
| deep | invite | `"She nodded. They both knew what it meant. I did not."` | `«Она кивнула. Они обе понимали, что это значит. Я – нет.»` |
| deep | respond | `"So it is honesty about luck. I had not thought of that."` | `«Значит, это честность насчёт везения. Я об этом не думала.»` |
| deep | space | `"Then we are both still wondering. I do not mind that."` | `«Значит, мы оба всё ещё об этом думаем. Меня это устраивает.»` |
| quiet | invite | `"She nodded. That was all."` | `«Она кивнула. И всё.»` |
| quiet | respond | `"Oh. It's a polite way of saying it was luck."` | `«А. Это вежливый способ сказать, что повезло.»` |
| quiet | space | `"Okay. I'll ask someone else, then."` | `«Ладно. Тогда спрошу у кого-нибудь ещё.»` |

## 29. Situation R62 – `the-older-girl-knew-her-name`

Subject `good-news`; stage `school` only. `Старшая девочка` is a school-years phrase, which is why the row stops at school and does not claim after-school. `Поздоровалась по имени` is hello by name, `мимоходом` is in passing, and `на голову выше` carries the English foot – a Russian child is taller by a head. The respond label keeps the generic `быть замеченной` in the feminine, so the parent need not address her with `ты`, and `оставить это себе` is let her keep it, which is how the space label differs from the plain `порадоваться` of the older good-news rows. `Пошла дальше` is the older girl walking on, in every voice.

### 29.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"One of the older girls said hello to me by name. I didn't think she knew it."` | `«Одна из старших девочек поздоровалась со мной по имени. Я не думала, что она его знает.»` |
| fiery | `"One of the older girls knows my name. She used it. I heard it."` | `«Одна из старших девочек знает моё имя. Она его назвала. Я слышала.»` |
| deep | `"One of the older girls said my name in passing. I did not think she knew it."` | `«Одна из старших девочек мимоходом назвала моё имя. Я не думала, что она его знает.»` |
| quiet | `"One of the older girls said hello. She used my name."` | `«Одна из старших девочек поздоровалась. Назвала меня по имени.»` |

### 29.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the older girl said` | `Спросить, что сказала старшая девочка` |
| respond | `Say it's good to be noticed` | `Сказать, что быть замеченной приятно` |
| space | `Let her just have this` | `Дать ей оставить это себе` |

### 29.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Just hello, and my name, like it was nothing. Then she kept walking."` | `«Просто привет и моё имя, как будто это пустяк. Потом пошла дальше.»` |
| sunny | respond | `"It really is. I feel a foot taller and I'm trying to hide it."` | `«Очень приятно. Я себя чувствую на голову выше и пытаюсь этого не показывать.»` |
| sunny | space | `"I will. I'm going to say hello back properly next time."` | `«Так и сделаю. В следующий раз поздороваюсь с ней как следует.»` |
| fiery | invite | `"Hello, and my name. Then she walked off like it was nothing. It was not nothing."` | `«Привет и моё имя. Потом ушла, как будто это пустяк. А это не пустяк.»` |
| fiery | respond | `"It is. I'd like a few more of them to notice, frankly."` | `«Приятно. Честно говоря, хочу, чтобы ещё несколько из них меня заметили.»` |
| fiery | space | `"Oh, I will. And next time I'm saying her name first."` | `«Ещё как. А в следующий раз первой назову её имя.»` |
| deep | invite | `"Hello, and my name, in passing. She did not even stop."` | `«Привет и моё имя, мимоходом. Она даже не остановилась.»` |
| deep | respond | `"It is. I did not know I wanted it until it happened."` | `«Приятно. Я не знала, что мне этого хочется, пока это не случилось.»` |
| deep | space | `"I will. I would like to remember exactly how it sounded."` | `«Так и сделаю. Хочу запомнить, как именно это прозвучало.»` |
| quiet | invite | `"Just hello and my name. Then she walked on."` | `«Просто привет и моё имя. И пошла дальше.»` |
| quiet | respond | `"It is. I'd noticed her too."` | `«Приятно. Я её тоже замечала.»` |
| quiet | space | `"I will. It was a nice bit of the week."` | `«Так и сделаю. Это была приятная часть недели.»` |

## 30. r51 – two school-years worry situations and two decision situations (14.10)

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's words on the school years' thin subjects: «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

Four new situations, R63–R66, appended last in the generated catalogue (English authority: the fourth 14.10 addendum in `docs/specs/small-talk-corpus-2026-09.md`): two `worry` rows, R63 and R64, and two `decision` rows, R65 and R66. Both languages in one change. Each is an opener and three replies in all four voices, with no shared second beat – a worry is something she carries to the parent and a decision is a choice she talks through, and neither is an incident she tells in two beats. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian.

## 31. Situation R63 – `the-film-she-has-not-seen`

Subject `worry`; stage `school` only. `Фильм, который она обожает` and `который она любит` keep the girl's love without a title, `смотрела` is the lie in the daughter's feminine past and `Я не смотрела` is the plain admission. `Концовка` is the ending in every voice. The respond label says `мы тоже так делали`, the family `мы` of the style guide, so the parent is neither mother nor father; the space label `исправить одной фразой` is the one-sentence repair. `Ещё бы` and `Вот откуда это у меня` carry the fiery tease of the English without naming a parent, and `у тебя` in the deep reply is the gender-neutral address.

### 31.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I told a girl I'd seen the film she loves. I haven't. Now she wants to talk about it every single day."` | `«Я сказала одной девочке, что смотрела фильм, который она обожает. Я его не смотрела. Теперь она хочет говорить о нём каждый день.»` |
| fiery | `"I lied about a film. A girl loves it, I said I'd seen it, and now she will not stop talking about it."` | `«Я соврала про фильм. Одна девочка его обожает, я сказала, что смотрела, и теперь она без умолку говорит о нём.»` |
| deep | `"I told a girl I had seen the film she loves. I had not. Every time she mentions it, the lie feels a little bigger."` | `«Я сказала одной девочке, что смотрела фильм, который она любит. Я не смотрела. Каждый раз, когда она его упоминает, ложь словно становится чуть больше.»` |
| quiet | `"A girl keeps mentioning a film. I told her I'd seen it. I haven't."` | `«Одна девочка всё время упоминает фильм. Я сказала ей, что смотрела. Я не смотрела.»` |

### 31.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she told the girl about it` | `Спросить, что она сказала девочке об этом фильме` |
| respond | `Say you have done the same` | `Сказать, что мы тоже так делали` |
| space | `Say it can be put right with one sentence` | `Сказать, что это можно исправить одной фразой` |

### 31.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"That I loved the ending. I don't even know how it ends."` | `«Что мне очень понравилась концовка. А я даже не знаю, чем всё заканчивается.»` |
| sunny | respond | `"Have you? Good. Then I'm in decent company."` | `«Правда? Хорошо. Значит, я в неплохой компании.»` |
| sunny | space | `"One sentence. I can do one sentence. Maybe after the weekend."` | `«Одна фраза. Одну фразу я осилю. Может, после выходных.»` |
| fiery | invite | `"That the ending was the best part. I have never seen the ending."` | `«Что концовка – лучшее в фильме. Я концовки вообще не видела.»` |
| fiery | respond | `"Of course you have. So that's where I get it."` | `«Ещё бы. Вот откуда это у меня.»` |
| fiery | space | `"One sentence? Then I've been dreading nothing."` | `«Одна фраза? Значит, я боялась на пустом месте.»` |
| deep | invite | `"That I loved the ending. I do not know what happens in it. I said it as if I did."` | `«Что мне понравилась концовка. Я не знаю, что в ней происходит. Я говорила так, будто знаю.»` |
| deep | respond | `"I did not think you ever had. It makes it feel smaller."` | `«Не думала, что у тебя такое бывало. От этого оно кажется меньше.»` |
| deep | space | `"It is one sentence. It is the saying of it that I keep rehearsing."` | `«Это одна фраза. Я всё время репетирую именно то, как её произнести.»` |
| quiet | invite | `"That the ending was good. She was pleased."` | `«Что концовка хорошая. Она обрадовалась.»` |
| quiet | respond | `"All right. That helps a little."` | `«Ладно. Это немного помогает.»` |
| quiet | space | `"One sentence. I'll find a time."` | `«Одна фраза. Найду момент.»` |

## 32. Situation R64 – `the-girl-she-walked-past`

Subject `worry`; stages `school`, `after-school`; no fact gate. `У ворот` is the gate in every voice, `в капюшоне` the hood and `на сумке` the bag she sat on; `никого рядом` keeps the girl alone without saying why she cried – no voice names a cause. The respond label uses the family `мы`. `Заметила` is the noticing that the space label counts, in the daughter's feminine past, and `важно уже то, что` is the English `it counts that`.

### 32.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A girl was crying on her own by the gate and I walked past. I think I should have stopped."` | `«Одна девочка плакала у ворот совсем одна, а я прошла мимо. Кажется, мне надо было остановиться.»` |
| fiery | `"I walked straight past a girl who was crying. Straight past. I should have stopped."` | `«Я прошла прямо мимо девочки, которая плакала. Прямо мимо. Надо было остановиться.»` |
| deep | `"A girl was crying by herself near the gate and I walked past her. I keep going back to the moment I decided not to stop."` | `«Одна девочка плакала в одиночестве возле ворот, а я прошла мимо неё. Я всё возвращаюсь к тому моменту, когда решила не останавливаться.»` |
| quiet | `"A girl was sitting by the gate, crying. I kept walking."` | `«Девочка сидела у ворот и плакала. Я пошла дальше.»` |

### 32.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she saw` | `Спросить, что она увидела` |
| respond | `Say you have walked past too` | `Сказать, что мы тоже проходили мимо` |
| space | `Say it counts that she noticed` | `Сказать, что важно уже то, что она заметила` |

### 32.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"She was sitting on her bag with her hood up. All on her own."` | `«Она сидела на своей сумке, надев капюшон. Совсем одна.»` |
| sunny | respond | `"You too? Then it's not just me. I still wish I'd stopped."` | `«И ты тоже? Значит, не только я. Но мне всё равно жаль, что я не остановилась.»` |
| sunny | space | `"Does it? Then I'll say hello to her next time. That's a start."` | `«Правда? Тогда в следующий раз я с ней поздороваюсь. Это уже начало.»` |
| fiery | invite | `"On her bag, hood up, on her own. Nobody anywhere near her."` | `«На сумке, в капюшоне, одна. Рядом – никого.»` |
| fiery | respond | `"Everyone has. That's not an excuse. That's the problem."` | `«Все проходят мимо. Это не оправдание. В этом и проблема.»` |
| fiery | space | `"Noticing doesn't do anything for her. Next time I'm stopping."` | `«Ей от того, что я заметила, не легче. В следующий раз я остановлюсь.»` |
| deep | invite | `"She was sitting on her bag with her hood up, and nobody was near her."` | `«Она сидела на своей сумке, надев капюшон, и рядом с ней никого не было.»` |
| deep | respond | `"I believe you. It does not make her any less alone."` | `«Верю. Но ей от этого не менее одиноко.»` |
| deep | space | `"Perhaps. It is the only part of it I got right."` | `«Возможно. Это единственное, что я сделала правильно.»` |
| quiet | invite | `"On her bag, with her hood up."` | `«На сумке, в капюшоне.»` |
| quiet | respond | `"Okay. That doesn't change it, but okay."` | `«Ладно. Это ничего не меняет, но ладно.»` |
| quiet | space | `"Maybe. I'll look for her."` | `«Может быть. Поищу её.»` |

## 33. Situation R65 – `the-maybe-she-gave`

Subject `decision`; stages `school`, `after-school`; no fact gate. `Девочка помладше` is the younger girl without an age; `поиграть с ней` is hitting with her – no match is meant – and `может быть` is the maybe, in `„…“` inside `«»` as the older rows quote. `Вклиниться` is stepping into a gap in the hitting, in every voice. The respond label keeps the parent's history in the family `мы` (`и для нас когда-то кто-то нашёл время`), and `теннисная пушка` is the ball machine of the fiery reply.

### 33.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A younger girl asked if I'd hit with her. I said maybe. I should probably say yes or no."` | `«Девочка помладше спросила, не поиграю ли я с ней. Я сказала „может быть“. Наверное, надо ответить „да“ или „нет“.»` |
| fiery | `"A younger girl asked me to hit with her and I said maybe. Maybe isn't an answer. I know that."` | `«Девочка помладше попросила поиграть с ней, а я ответила „может быть“. „Может быть“ – это не ответ. Я знаю.»` |
| deep | `"A younger girl asked me to hit with her. I said maybe, and I keep seeing her face when I said it."` | `«Девочка помладше попросила меня поиграть с ней. Я ответила „может быть“ и всё вспоминаю её лицо в тот момент.»` |
| quiet | `"A younger girl asked if I'd hit with her. I said maybe."` | `«Девочка помладше спросила, не поиграю ли я с ней. Я ответила „может быть“.»` |

### 33.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the younger girl is like` | `Спросить, какая эта девочка` |
| respond | `Say someone once made time for you` | `Сказать, что и для нас когда-то кто-то нашёл время` |
| space | `Say she can answer when she knows` | `Сказать, что ответить можно, когда она сама поймёт` |

### 33.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Shy, I think. She keeps standing at the end of the court, waiting for a gap."` | `«Стеснительная, по-моему. Всё время стоит в конце корта и ждёт, когда можно будет вклиниться.»` |
| sunny | respond | `"Did they? Then I think I'll say yes. One hit, to start."` | `«Правда? Тогда, пожалуй, скажу „да“. Для начала один раз.»` |
| sunny | space | `"Good. I'll tell her by the end of the week, either way."` | `«Хорошо. Скажу ей до конца недели, что бы ни решила.»` |
| fiery | invite | `"She doesn't say much. She stands at the end of the court and waits for a gap."` | `«Она почти не говорит. Стоит в конце корта и ждёт, когда можно будет вклиниться.»` |
| fiery | respond | `"Fine. One hit, and then we'll see. I'm not a ball machine."` | `«Ладно. Один раз, а там посмотрим. Я не теннисная пушка.»` |
| fiery | space | `"Fine. But she's waiting. I'd like to stop making her wait."` | `«Ладно. Но она ждёт. Мне хочется перестать заставлять её ждать.»` |
| deep | invite | `"She does not say much. She stands at the end of the court and waits for a gap, as if she has done it before."` | `«Она почти не говорит. Стоит в конце корта и ждёт, когда можно будет вклиниться, словно ей это не впервой.»` |
| deep | respond | `"I did not know that. It makes it harder to say no, which I suppose is the point."` | `«Я этого не знала. Теперь труднее сказать „нет“, и, наверное, в этом и смысл.»` |
| deep | space | `"I know. I do not want to leave her wondering for long."` | `«Знаю. Не хочу надолго оставлять её в неизвестности.»` |
| quiet | invite | `"Quiet. She waits at the end of the court for a gap."` | `«Тихая. Ждёт в конце корта, когда можно будет вклиниться.»` |
| quiet | respond | `"All right. I'll tell her yes."` | `«Хорошо. Скажу ей „да“.»` |
| quiet | space | `"Okay. Not for long, though."` | `«Хорошо. Но не надолго.»` |

## 34. Situation R66 – `the-match-she-said-she-would-watch`

Subject `decision`; stages `school`, `after-school`; no fact gate. `Подруга` is the friend, `матч подруги` is her match and not the daughter's, and `последний` is the last one on. The respond label says `мы бы такое обещание сдержали` in the family `мы`, and the sunny respond reply drops the English `you would` rather than guess a gender for the parent. `Весь` agrees with `матч` in all four invite replies.

### 34.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I told a friend I'd stay and watch her match. It's the last one on, so that's a lot of waiting."` | `«Я сказала подруге, что останусь и посмотрю её матч. Он последний, так что ждать придётся долго.»` |
| fiery | `"I made a promise too quickly. I said I'd watch a friend's match, and it's the last one on."` | `«Я слишком быстро пообещала. Сказала, что посмотрю матч подруги, а он последний.»` |
| deep | `"I told a friend I would stay and watch her match. I meant it then. It is the last match on, and I am not sure I mean it now."` | `«Я сказала подруге, что останусь и посмотрю её матч. Тогда я так и думала. Это последний матч, и теперь я не уверена, что думаю так же.»` |
| quiet | `"I said I'd watch a friend's match. It's the last one on."` | `«Я сказала, что посмотрю матч подруги. Он последний.»` |

### 34.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask how much she promised to watch` | `Спросить, сколько она пообещала посмотреть` |
| respond | `Say you would keep a promise like that` | `Сказать, что мы бы такое обещание сдержали` |
| space | `Say she can go when she has had enough` | `Сказать, что она может уйти, когда ей будет достаточно` |

### 34.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"All of it. That was the silly part. Half would have been fine."` | `«Весь. Это и было глупо. Хватило бы и половины.»` |
| sunny | respond | `"I know you would. I think that's why I haven't gone yet."` | `«Знаю. Наверное, поэтому я до сих пор не ушла.»` |
| sunny | space | `"Okay. Then I'll stay for the start and see how I feel."` | `«Ладно. Тогда посижу в начале и посмотрю, как себя почувствую.»` |
| fiery | invite | `"All of it. I said all of it. Why did I say all of it."` | `«Весь. Я сказала, что весь. Зачем я сказала, что весь.»` |
| fiery | respond | `"Fine. Then I stay. I'm not going to enjoy the last hour, though."` | `«Ладно. Тогда остаюсь. Но последний час мне нравиться не будет.»` |
| fiery | space | `"Good. I'll stay for the start, and I'm not saying sorry for the rest."` | `«Хорошо. Начало досижу, а за остальное извиняться не буду.»` |
| deep | invite | `"All of it. I told her I would stay to the end, and she thanked me."` | `«Весь. Я сказала, что досижу до конца, и она меня поблагодарила.»` |
| deep | respond | `"I know. That is what I am weighing it against."` | `«Знаю. Именно с этим я всё и сравниваю.»` |
| deep | space | `"Perhaps. I would still know I had left, though."` | `«Возможно. Но я всё равно буду знать, что ушла.»` |
| quiet | invite | `"All of it. That's what I said."` | `«Весь. Так я и сказала.»` |
| quiet | respond | `"I know. That's what I keep thinking."` | `«Знаю. Я об этом всё и думаю.»` |
| quiet | space | `"Okay. I'll see how long I last."` | `«Хорошо. Посмотрю, насколько меня хватит.»` |

## 35. r52 – three coach-feel situations: a good news, an observation and a worry behind her feel for the coach (14.10)

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's words: «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь от ребенка для принятия решения» and, on how sure she may sound, «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но" или что-то в таком духе, т.е. она еще не уверена, а просто сомневается».

Three new situations, R67–R69, appended last in the generated catalogue (English authority: the round 52 addendum, builder F4, in `docs/specs/small-talk-corpus-2026-09.md`): a `good-news`, an `observation` and a `worry`, each behind one side of her feel for the coach (fact gates `coach-feel-warm`, `coach-feel-unsure`, `coach-feel-cold`). Both languages in one change. Each is an opener and three replies in all four voices, with no shared second beat. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian. ⚠ The coach is a noun and never the subject of a past-tense verb or an adjective in these lines (R15-7): Russian gives the past tense a gender, and the coach's sex is the career's to hold, not the copy's. The daughter is feminine in her own past tense and says `ты` to the parent (ruling 01.10 №6); the labels use the family `мы` or an infinitive, so the parent is neither mother nor father.

## 36. Situation R67 – `the-thing-that-makes-sense`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `good-news`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-warm`. `Тренер` appears only as a noun and only as the subject of a PRESENT-tense verb (`просит`, `добивается`): a past tense (`попросил`) would name the coach's sex, which R15-7 forbids, so the English «asked for the same thing twice» became «просит ... уже второй раз». `Начало обретать смысл` is «started to make sense» without a skill claim. The respond label says `мы рады`, the family «мы» of the style guide, so the parent is neither mother nor father.

### 36.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Something my coach asks for has started to make sense. I'm trying not to say it too loudly."` | `«Кажется, я наконец поняла одну вещь, которой добивается тренер. Только давай пока без фанфар.»` |
| fiery | `"I think I finally get what my coach has been asking for. Don't make a fuss. It might not stay."` | `«Кажется, наконец поняла, чего добивается тренер. Только не делай из этого событие. Вдруг завтра опять не получится.»` |
| deep | `"Something my coach asks for has begun to make sense. I wanted to tell you, and I did not want to promise it will last."` | `«Кое-что из того, о чём просит тренер, начало обретать смысл. Мне хотелось тебе об этом сказать, но не хотелось обещать, что так и останется.»` |
| quiet | `"My coach asked for the same thing twice. It made sense both times."` | `«Тренер уже второй раз просит об одном и том же. И оба раза я поняла зачем.»` |

### 36.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what has started to make sense` | `Спросить, что она начала понимать` |
| respond | `Say you are glad it makes sense` | `Сказать, что мы рады, что это стало понятно` |
| space | `Say it does not have to last to be good news` | `Сказать, что это хорошая новость, даже если не продлится` |

### 36.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Where to be before the ball arrives. It sounded like nothing until I saw what it was for."` | `«Где стоять до того, как прилетит мяч. Звучало как пустяк, пока я не увидела, зачем это нужно.»` |
| sunny | respond | `"Thanks. I wanted somebody to know. I'm keeping it quiet everywhere else."` | `«Спасибо. Мне хотелось, чтобы кто-то знал. Больше нигде об этом не говорю.»` |
| sunny | space | `"That's fair. It's nice this week, even if it doesn't stay."` | `«Это правда. На этой неделе приятно, даже если потом не удержится.»` |
| fiery | invite | `"Where to be before the ball arrives. Obvious, I know. It wasn't obvious until it was."` | `«Где стоять до того, как прилетит мяч. Очевидно, знаю. Но очевидным это не было – пока вдруг не стало.»` |
| fiery | respond | `"Good. Be glad quietly. If it goes, I don't want to explain it."` | `«Хорошо. Радуйся тихо. Если пропадёт, мне не хочется ничего объяснять.»` |
| fiery | space | `"Fine. It's good news right now. If it stays, I'll say so."` | `«Ладно. Сейчас это хорошая новость. Если удержится, скажу.»` |
| deep | invite | `"Where to be before the ball arrives. It is a small thing. I have been turning it over, and it fits."` | `«Где стоять до того, как прилетит мяч. Это мелочь. Я долго её обдумывала, и всё сходится.»` |
| deep | respond | `"Thank you. I wanted somebody to know before I knew whether it holds."` | `«Спасибо. Мне хотелось, чтобы кто-то знал, ещё до того, как станет ясно, удержится ли это.»` |
| deep | space | `"I know. I would still like it to stay. I'll try not to hold on too tightly."` | `«Знаю. Но мне бы хотелось, чтобы это осталось. Постараюсь не держаться за это слишком крепко.»` |
| quiet | invite | `"Where to be before the ball arrives. I wrote it down so I wouldn't lose it."` | `«Где стоять до того, как прилетит мяч. Я записала, чтобы не потерять.»` |
| quiet | respond | `"Thanks. I only wanted to mention it."` | `«Спасибо. Я только хотела об этом сказать.»` |
| quiet | space | `"True. I'll take it while it's here."` | `«Верно. Порадуюсь, пока могу.»` |

## 37. Situation R68 – `practice-feels-different`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `observation`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-unsure`. The row is the owner's «я пока не очень поняла» turned into something she noticed: `пока` is «yet» in every voice, and nobody says better or worse. `Тренер` is a noun after `с` only; no verb or adjective takes it as a subject. The space label `приглядываться` is «keep noticing».

### 37.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Practice with my coach feels different. I can't tell yet if different is better."` | `«С тренером занятия стали другими. Пока не могу понять, лучше ли мне от этого.»` |
| fiery | `"Practice with my coach is different. Better or worse, I can't say, and it's annoying."` | `«Тренировка с тренером теперь другая. Лучше или хуже – сказать не могу, и это бесит.»` |
| deep | `"Practice with my coach has changed in a way I cannot name. I do not know yet if it is better. I keep waiting to know."` | `«С тренером занятия стали другими, а я всё не могу уловить, чем именно. Пока не знаю, к лучшему ли. Жду, когда разберусь.»` |
| quiet | `"Practice with my coach felt different this week. I haven't worked out if that's good."` | `«Тренировка с тренером на этой неделе была другой. Я пока не решила, хорошо это или нет.»` |

### 37.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what is different` | `Спросить, что изменилось` |
| respond | `Say it can take a while to know` | `Сказать, что иногда нужно время, чтобы понять` |
| space | `Say she can just keep noticing` | `Сказать, что она может просто приглядываться` |

### 37.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"The order, mostly. We do the hard part first now. I can't decide if I like it."` | `«Порядок, в основном. Теперь сначала самое трудное. Не могу решить, нравится ли мне.»` |
| sunny | respond | `"That's what I'm hoping. I'll keep showing up and see."` | `«Я на это и надеюсь. Буду ходить и смотреть.»` |
| sunny | space | `"I can do that. Noticing is the easy part. Deciding is the hard part."` | `«Это я могу. Приглядываться легко. Трудно – решать.»` |
| fiery | invite | `"The order. The hard part comes first now. I'd like a reason and I haven't got one."` | `«Порядок. Теперь сначала самое трудное. Мне нужна причина, а её у меня нет.»` |
| fiery | respond | `"A while isn't an answer. Fine. I'll give it a while."` | `«Со временем – это не ответ. Ладно. Дам этому время.»` |
| fiery | space | `"Noticing, fine. I'll keep track."` | `«Приглядываться – ладно. Буду следить.»` |
| deep | invite | `"The order of things. The hard part comes first now. I am still deciding what I think of it."` | `«Порядок. Теперь самое трудное идёт первым. Я всё ещё решаю, что об этом думаю.»` |
| deep | respond | `"I know. I only wanted to say that I don't know yet."` | `«Знаю. Я только хотела сказать, что пока не знаю.»` |
| deep | space | `"Yes. I will keep noticing, and I will say when I know."` | `«Да. Буду приглядываться и скажу, когда пойму.»` |
| quiet | invite | `"The order. The hard part comes first."` | `«Порядок. Сначала самое трудное.»` |
| quiet | respond | `"Probably. I'll give it time."` | `«Наверное. Дам этому время.»` |
| quiet | space | `"Okay. I'll keep an eye on it."` | `«Хорошо. Пока буду смотреть.»` |

## 38. Situation R69 – `the-thing-she-cannot-name`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `worry`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-cold`. His register is kept word for word where Russian allows: `нормальная` is «fine», `не доходит` is «is not landing», and nobody says `плохо`. `Несправедливой к тренеру` is the only place a feminine predicate stands next to the coach, and it describes HER (`я` is the subject), so it names nobody's sex but hers. The respond label says `с нами такое тоже бывало`, the family «мы».

### 38.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Practice with my coach is fine. It really is. There's just something I can't quite put into words."` | `«Тренировка с тренером нормальная. Правда. Просто есть что-то, чего я не могу выразить словами.»` |
| fiery | `"Practice with my coach is fine. That's the verdict. I just have a feeling something isn't landing, and I don't know how to say it."` | `«С тренером всё вроде нормально. Вердикт такой. Но что-то не складывается, и я не знаю, как это объяснить.»` |
| deep | `"Practice with my coach is fine. It is only that something does not land, and I have not found a way to say it that is fair."` | `«С тренером всё вроде нормально. Но что-то не складывается, а я пока не нашла слов, чтобы сказать об этом без упрёка.»` |
| quiet | `"Practice with my coach was fine. I keep thinking there's something I haven't said."` | `«Тренировка с тренером была нормальной. Мне всё кажется, что я чего-то не сказала.»` |

### 38.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she thinks is not landing` | `Спросить, что, по её ощущению, не доходит` |
| respond | `Say you have felt that way before` | `Сказать, что с нами такое тоже бывало` |
| space | `Say she can find the words once she knows what it is` | `Сказать, что слова найдутся, когда она поймёт, в чём дело` |

### 38.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"I can't tell. It isn't big. It's small and it keeps showing up."` | `«Не знаю. Пустяковая вроде вещь, а всё повторяется.»` |
| sunny | respond | `"Have you? That's a relief. I thought I was just making a fuss."` | `«Правда? А я думала, что придираюсь.»` |
| sunny | space | `"Okay. That takes the pressure off. I'll say it when I can."` | `«Хорошо. Так легче. Скажу, когда смогу.»` |
| fiery | invite | `"If I knew, I'd have said it. It's small, it keeps coming back, and that's what's annoying."` | `«Если бы знала, сказала бы. Мелочь, но всё время возвращается, и именно это бесит.»` |
| fiery | respond | `"Then you know it isn't nothing. I'm not making it up."` | `«Значит, ты знаешь, что это не ерунда. Я не выдумываю.»` |
| fiery | space | `"Fine. But it's going to come out one way or another."` | `«Ладно. Но так или иначе это прозвучит.»` |
| deep | invite | `"I cannot tell. It is small, and it comes back. I do not want to be unfair to my coach by guessing."` | `«Не могу понять. Это мелочь, и она возвращается. Не хочу быть несправедливой к тренеру, гадая.»` |
| deep | respond | `"I thought it might only be me. It helps to know it isn't."` | `«Я думала, что это только у меня. Хорошо знать, что нет.»` |
| deep | space | `"Thank you. I would rather say it once, and say it properly."` | `«Спасибо. Я лучше скажу один раз, но как следует.»` |
| quiet | invite | `"I can't tell. It's small. It keeps coming back."` | `«Не могу понять. Мелочь. Всё время возвращается.»` |
| quiet | respond | `"Okay. Knowing that helps a bit."` | `«Хорошо. Мне от этого немного легче.»` |
| quiet | space | `"Okay. I'll say it when I know what it is."` | `«Хорошо. Скажу, когда пойму, что это.»` |

## 39. r52 H2 – six stint situations: she brings up the coach again at half a year and at a year together, and which of the three depends on how she feels about it (14.10)

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's words: «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять» and, earlier the same day, on how sure she may sound, «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но"… она еще не уверена, а просто сомневается».

Six new situations, R70–R75, appended last in the generated catalogue (English authority: the round 52 addendum, builder H2, in `docs/specs/small-talk-corpus-2026-09.md`): three for half a year together (R70 `good-news`, R71 `observation`, R72 `worry`; fact gates `coach-feel-warm-half`, `coach-feel-unsure-half`, `coach-feel-cold-half`) and three for a year together (R73 `good-news`, R74 and R75 `decision`; `coach-feel-warm-year`, `coach-feel-unsure-year`, `coach-feel-cold-year`). Each fact is one side of her feel for the coach inside a window of weeks together (24 to 43, and 48 or more). Both languages in one change. Each is an opener and three replies in all four voices, with no shared second beat. Row order, ids, stages and fact gates are locale-independent; nothing here is drawn differently in Russian. The half-year rows say `месяцы` or `полгода` and never `год`; the year rows say `год` and never `месяцы` (a test keeps that in English; the Russian follows it). ⚠ The coach is a noun and never the subject of a past-tense verb or an adjective in these lines (R15-7): Russian gives the past tense a gender, and the coach's sex is the career's to hold, not the copy's. The daughter is feminine in her own past tense and says `ты` to the parent, with no verb that gives the parent a sex (ruling 01.10 №6); the labels use the family `мы` or an infinitive, so the parent is neither mother nor father.

## 40. Situation R70 – `half-a-year-and-it-fits`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `good-news`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-warm-half`. `Тренер` стоит в одном месте подлежащим, и глагол при нём настоящего времени (`знает`): прошедшее (`поменял`) назвало бы пол тренера, а R15-7 это запрещает. Поэтому английское «my coach changed the drill» стало безличным «упражнение меняли» – кто менял, из строки не видно, а слушает это родитель, который и так знает. `Скучать` – «getting restless» (одно и то же слово во всех четырёх голосах: факт у них общий). `Подходит` – «fits», без слова «хороший» про тренера.

### 40.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A few months in, and practice with my coach just fits. I noticed this week. I wanted you to know."` | `«Прошло несколько месяцев, и я вдруг поняла: с этим тренером мне хорошо работается. Хотела тебе сказать.»` |
| fiery | `"Months in, and practice finally makes sense. My coach seems to know what I need before I do. I'll only say it once."` | `«Прошло несколько месяцев, и тренировки наконец обрели смысл. Тренер, кажется, знает, что мне нужно, раньше, чем я сама. Скажу это один раз.»` |
| deep | `"Months in, practice with my coach fits. I checked it against how I felt last month and the month before. It has held so far."` | `«Прошло несколько месяцев, и тренировки с тренером мне подходят. Я сверила это с тем, что чувствовала в прошлом месяце и в позапрошлом. Пока держится.»` |
| quiet | `"It's been a few months. I stopped looking at the clock in practice with my coach, and I only noticed this week."` | `«Прошло несколько месяцев. На тренировках я перестала поглядывать на часы. Только на этой неделе заметила.»` |

### 40.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she has noticed` | `Спросить, что она заметила` |
| respond | `Say you are glad it fits` | `Сказать, что мы рады, что это подходит` |
| space | `Say she does not have to explain it` | `Сказать, что объяснять это не обязательно` |

### 40.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Twice this month my coach changed the drill right when I was getting restless. I hadn't said anything. It's a small thing, but I noticed."` | `«В этом месяце дважды было так: я начинала скучать – и мы переходили к другому упражнению. Я ни слова не сказала. Мне понравилось, что не пришлось просить.»` |
| sunny | respond | `"Thanks. It's nice to say it out loud to someone."` | `«Спасибо. Приятно наконец сказать это вслух.»` |
| sunny | space | `"Okay, good, because I can't. It just fits."` | `«Хорошо, это кстати, потому что я не смогу. Просто подходит.»` |
| fiery | invite | `"Twice this month my coach changed the drill right as I got restless. I hadn't said a word. Make of that what you like."` | `«Дважды за месяц я начинала скучать – и тут мы переходили к другому упражнению. Я даже рта не открыла. Совпадение? Не думаю.»` |
| fiery | respond | `"Good. So am I. Don't make a thing of it."` | `«Я тоже рада. Только давай без шума.»` |
| fiery | space | `"Good, because I can't. It fits. That's the whole report."` | `«Вот и хорошо, потому что я не смогу. Подходит – и всё. Вот весь отчёт.»` |
| deep | invite | `"Twice this month my coach changed the drill at the moment I began to get restless. I had said nothing. I have thought about that more than I expected to."` | `«Дважды за месяц я успевала заскучать – и как раз тогда мы меняли упражнение. Я ничего не говорила. И до сих пор думаю об этом.»` |
| deep | respond | `"Thank you. I waited a while to say it, so that it would not be something I said in a good week."` | `«Спасибо. Я нарочно подождала: не хотелось принимать одну удачную неделю за всю картину.»` |
| deep | space | `"I could not explain it if I tried. It fits, and I am content to leave it there."` | `«Я и сама пока не объясню. Просто мне подходит.»` |
| quiet | invite | `"Twice this month my coach changed the drill when I was getting restless. I hadn't said anything."` | `«Дважды за месяц я начинала скучать, и оба раза мы переходили к другому упражнению. Я не просила.»` |
| quiet | respond | `"Thanks. I just thought you should know."` | `«Спасибо. Я просто решила, что тебе стоит знать.»` |
| quiet | space | `"Okay. It just fits."` | `«Хорошо. Просто подходит.»` |

## 41. Situation R71 – `half-a-year-and-still-unsure`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены – кроме шести строк с «полгода» (четыре начала, `fiery · respond`, позиция `respond`): они `DRAFT` до его ответа о сроках окна (вопрос к R71: окно факта 24–43 нед., точка – 32-я).

Subject `observation`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-unsure-half`. Полгода – `полгода` во всех четырёх голосах, и ни одна строка не говорит «год». `Тот ли это тренер` – «the right one» без оценки: вопрос, а не приговор. Английское «it» в «if it's the right fit» стало `подходит ли мне это`, потому что `он` про тренера назвало бы его пол (R15-7). Самое важное для строки – «от месяца к месяцу»: её сомнение и правда пересчитывается раз в четыре недели.

### 41.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"It's been half a year with my coach, and I still can't tell if it's the right fit. I thought I'd know by now."` | `«Прошло полгода с тренером, а я всё ещё не могу понять, подходит ли мне это. Думала, к этому времени уже буду знать.»` |
| fiery | `"Half a year with my coach and I still can't say if it's the right one. You'd think I'd know by now."` | `«Полгода с тренером, а я до сих пор не могу сказать, тот ли это тренер. Казалось бы, пора бы уже знать.»` |
| deep | `"Half a year with my coach, and I have tried more than once to decide whether it is the right one. I cannot. Nothing has settled it either way."` | `«Полгода с тренером, и я не раз пыталась решить, тот ли это тренер. Не могу. Ничто пока не склонило ответ ни в ту, ни в другую сторону.»` |
| quiet | `"Half a year with my coach, give or take. I'm still not sure what I think."` | `«Полгода с тренером, плюс-минус. Я всё ещё не уверена, что об этом думаю.»` |

### 41.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what keeps her unsure` | `Спросить, что мешает ей определиться` |
| respond | `Say half a year is not that long to know` | `Сказать, что полгода – не так уж много, чтобы понять` |
| space | `Say she does not have to know yet` | `Сказать, что знать наверняка ей пока не обязательно` |

### 41.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"It changes. Some months I'd say yes straight away, and the next month I'm not so sure. It doesn't settle."` | `«Это меняется. В одни месяцы я сразу готова сказать да, а в следующем уже не так уверена. Всё никак не устаканится.»` |
| sunny | respond | `"Maybe not. I just thought it would be clearer by now."` | `«Может, и нет. Просто я думала, что к этому времени всё станет яснее.»` |
| sunny | space | `"That helps. I'll stop quizzing myself every week."` | `«Это помогает. Перестану допрашивать себя каждую неделю.»` |
| fiery | invite | `"It changes. One month I'd say yes, the next I'd say I don't know. It refuses to hold still. I'd like it to pick a side."` | `«Это меняется. В один месяц я бы сказала да, в другой – не знаю. Не стоит на месте. Хоть бы уже выбрало сторону.»` |
| fiery | respond | `"Maybe. Half a year feels like plenty to me. Fine. I'll give it longer."` | `«Может быть. По-моему, полгода – более чем достаточно. Ладно. Дам этому больше времени.»` |
| fiery | space | `"Good. Then I'll stop asking myself every week. It hasn't helped."` | `«Хорошо. Тогда перестану спрашивать себя каждую неделю. Всё равно не помогало.»` |
| deep | invite | `"My answer changes from one month to the next. In one I am nearly sure, and in the next I am not. I cannot find what moves it."` | `«От месяца к месяцу я отвечаю себе по-разному. То почти уверена, то снова нет. Не понимаю, что меняет ответ.»` |
| deep | respond | `"Perhaps. I would still have liked to know by now. I will try to be patient with not knowing."` | `«Возможно. Я всё равно надеялась уже разобраться. Попробую не торопить себя.»` |
| deep | space | `"Thank you. It is a relief to be allowed not to know. I will say so when I do."` | `«Спасибо. Какое облегчение – можно не знать. Скажу, когда узнаю.»` |
| quiet | invite | `"It changes month to month. This month I'm not sure."` | `«Это меняется от месяца к месяцу. В этом месяце я не уверена.»` |
| quiet | respond | `"Maybe. I'll wait and see."` | `«Может быть. Подожду, посмотрю.»` |
| quiet | space | `"Okay. I'll let it be for now."` | `«Хорошо. Пока оставлю как есть.»` |

## 42. Situation R72 – `months-in-and-still-waiting`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `worry`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-cold-half`. Его «вроде нормально, но…» сохранено дословно по духу: `нормальные` – это «fine», и каждый голос говорит это первым, как в R69; `встанет на место` – «click» (мягче, чем «щёлкнет», и без жаргона); никто не говорит `плохо`. «It hasn't, not really» – `по-настоящему – нет`. В репликах она никого не винит (`я никого не виню`, `ничья не вина`), и ни одной формы прошедшего времени при `тренер`.

### 42.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"It's been a few months and practice with my coach is fine. I'm still waiting for it to click, though. It hasn't yet."` | `«Прошло несколько месяцев, и тренировки с тренером нормальные. Но я всё ещё жду, когда что-то встанет на место. Пока нет.»` |
| fiery | `"It's been months. Practice with my coach is fine. I keep waiting for it to click. It hasn't, not really."` | `«Прошли месяцы. С тренером всё вроде нормально. Жду, когда наконец сложится. Пока не складывается.»` |
| deep | `"Practice with my coach has been fine for months. I keep waiting for it to click. Lately I have started to wonder whether it will."` | `«С тренером уже несколько месяцев всё вроде нормально. Я ждала, что мы сработаемся. Теперь не уверена, что это случится.»` |
| quiet | `"Months now, and practice with my coach is still fine. I keep waiting for it to be more than fine."` | `«Уже несколько месяцев с тренером. Всё вроде нормально, а мне хочется, чтобы было не только нормально.»` |

### 42.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she is waiting for` | `Спросить, чего она ждёт` |
| respond | `Say you have waited for something to click too` | `Сказать, что мы тоже ждали, когда что-то встанет на место` |
| space | `Say she does not have to decide anything yet` | `Сказать, что решать ей пока ничего не нужно` |

### 42.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"For it to feel like we're working on the same thing. I can't say it any better than that. I'm not blaming anyone."` | `«Чтобы появилось ощущение, что мы работаем над одним и тем же. Лучше я сказать не могу. Я никого не виню.»` |
| sunny | respond | `"Did you? That helps, actually. I was worried I was being picky."` | `«Правда? Это, вообще-то, помогает. Я боялась, что просто придираюсь.»` |
| sunny | space | `"Good. I wasn't going to. I just needed to say it somewhere."` | `«Хорошо. Я и не собиралась. Мне просто нужно было где-то это сказать.»` |
| fiery | invite | `"For us to be working on the same thing. That's all. It's nobody's fault, so you can skip that question."` | `«Чтобы мы работали над одним и тем же. Вот и всё. Это ничья не вина, так что можешь не спрашивать.»` |
| fiery | respond | `"Then you know. It isn't nothing. It just sits there."` | `«Значит, ты понимаешь: это не ерунда. Оно никуда не девается.»` |
| fiery | space | `"I wasn't going to decide anything. I just wanted it said."` | `«Я и не собиралась ничего решать. Просто хотела, чтобы это было сказано.»` |
| deep | invite | `"For it to feel as if we are working on the same thing. I do not blame anyone for that. I only notice that it has not come."` | `«Чтобы мы чувствовали, что работаем над одним и тем же. Я никого не виню. Просто пока этого нет.»` |
| deep | respond | `"Did you? Then I am a little less afraid that it is only me."` | `«Правда? Тогда я чуть меньше боюсь, что это только у меня.»` |
| deep | space | `"I know. I am not deciding. I only did not want to carry it alone."` | `«Знаю. Я ничего не решаю. Просто не хотела нести это одна.»` |
| quiet | invite | `"For it to feel like we're working on the same thing. I'm not blaming anyone."` | `«Чтобы было ощущение, что мы работаем над одним и тем же. Я никого не виню.»` |
| quiet | respond | `"Oh. Okay. That helps a little."` | `«А. Ну ладно. Немного легче.»` |
| quiet | space | `"Okay. I wasn't going to."` | `«Хорошо. Я и не собиралась.»` |

## 43. Situation R73 – `a-year-and-she-would-not-swap`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `good-news`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-warm-year`. `Менять бы не стала` / `ничего не стала бы менять` – «I wouldn't swap it»: объект (`это`, `ничего`) никогда не тренер, поэтому ни `его`, ни `ей`. `Год` и `целый год` – ни одной строки про «месяцы». Вопрос в начале каждой тренировки – `тренер спрашивает` или `вопрос тренера`, настоящее время или существительное.

### 43.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A whole year with my coach already. I don't think I'd change a thing."` | `«Уже целый год с тренером. Кажется, я бы ничего не стала менять.»` |
| fiery | `"A whole year with my coach. I wouldn't swap it. There. I said it."` | `«Целый год с тренером. Менять ничего не хочу. Вот, сказала.»` |
| deep | `"A year with my coach. I have asked myself whether I would change it, more than once, and each time the answer was no."` | `«Год с тренером. Я не раз спрашивала себя, стала бы я что-то менять, и каждый раз отвечала себе: нет.»` |
| quiet | `"A year with my coach, give or take. I wouldn't change anything."` | `«Год с тренером, плюс-минус. Я бы ничего не стала менять.»` |

### 43.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she would miss` | `Спросить, чего ей не хватало бы` |
| respond | `Say you are glad it has gone this way` | `Сказать, что мы рады, что всё так сложилось` |
| space | `Say it is fine to just enjoy it` | `Сказать, что можно просто радоваться этому` |

### 43.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"How my coach starts every session by asking what I want to work on. A year of it, and I still have an answer ready."` | `«Мне бы не хватало того, что тренер в начале каждой тренировки спрашивает, над чем я хочу поработать. И мне всё ещё есть что ответить.»` |
| sunny | respond | `"Me too. I didn't know a year could feel this short."` | `«Я тоже. Не думала, что год может пройти так быстро.»` |
| sunny | space | `"Okay. That's what I'll do."` | `«Хорошо. Так и сделаю.»` |
| fiery | invite | `"How every session starts. My coach asks what I want to work on. A year of that, and I still have an answer ready."` | `«Того, как начинается тренировка. Тренер спрашивает, над чем я хочу работать. И через год мне всё ещё есть что ответить.»` |
| fiery | respond | `"Good. I'm glad too. Don't tell my coach I said so."` | `«Хорошо. Я тоже рада. Только не говори тренеру, что я это сказала.»` |
| fiery | space | `"I will. I'm not going to analyse it."` | `«Буду. Разбирать это по косточкам я не собираюсь.»` |
| deep | invite | `"That every session begins with my coach asking what I want to work on. I have answered that question for a year, and it has never been an empty ritual."` | `«В начале каждой тренировки тренер спрашивает, над чем я хочу работать. За год этот вопрос ни разу не стал пустой формальностью. Вот этого мне бы не хватало.»` |
| deep | respond | `"Thank you. A year is long enough for me to trust it, and I did not expect to say that."` | `«Спасибо. За этот год я научилась этому доверять. Не думала, что скажу такое.»` |
| deep | space | `"I will try. I tend to look for the catch, and I would like to stop."` | `«Попробую. Я склонна искать подвох, и мне хотелось бы перестать.»` |
| quiet | invite | `"That every session starts with a question about what I want to work on. I've always had an answer."` | `«Вопроса в начале тренировки: над чем я хочу работать. У меня всегда находился ответ.»` |
| quiet | respond | `"Thanks. Me too."` | `«Спасибо. Я тоже.»` |
| quiet | space | `"Okay. I will."` | `«Хорошо. Буду.»` |

## 44. Situation R74 – `a-year-and-she-still-does-not-know`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `decision`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-unsure-year`. `Оглядеться` – «look around»: посмотреть, кто ещё есть, и ничего больше; в репликах она прямо говорит, что не просит уходить. Вопрос задан родителю на `ты`, без рода (`как думаешь`). Метки родителя – `мы` или инфинитив, как везде: `Сказать, что оглядеться можно вместе`. Ни одно слово не открывает рынок тренеров и не нанимает никого – это разговор.

### 44.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"It's been a year with my coach, and I honestly can't tell if it's right. Should we maybe look around?"` | `«Год с тренером, и я честно не могу понять, подходит ли мне это. Может, нам стоит оглядеться?»` |
| fiery | `"A year with my coach and I still don't know. Should we be looking around?"` | `«Год с тренером, а я всё ещё не знаю. Не пора ли нам оглядеться?»` |
| deep | `"A year with my coach, and I still cannot say whether it is the right one. I have started to think we should look around, and I wanted to ask you before I decided anything."` | `«Год с тренером, а я всё ещё не уверена, что это мне подходит. Я подумала: может, стоит посмотреть и другие варианты? Хотела сначала спросить тебя.»` |
| quiet | `"A year with my coach, give or take. I still don't know. Do you think we should look around?"` | `«Год с тренером, плюс-минус. Я всё ещё не знаю. Как думаешь, нам стоит оглядеться?»` |

### 44.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what looking around would mean` | `Спросить, что для неё значит оглядеться` |
| respond | `Say you could look around together` | `Сказать, что оглядеться можно вместе` |
| space | `Say there is no hurry to decide` | `Сказать, что решать прямо сейчас не нужно` |

### 44.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Only looking. Seeing who else is out there. I'm not saying leave. I'd just like to know what the choice is."` | `«Только посмотреть. Увидеть, кто ещё есть. Я не говорю, что надо уходить. Просто хочу знать, из чего выбираю.»` |
| sunny | respond | `"Together would be better. I wouldn't know where to start."` | `«Вместе было бы лучше. Я бы не знала, с чего начать.»` |
| sunny | space | `"That's a relief. I'll keep going and see how it feels."` | `«Фух. Тогда пока продолжу тренироваться и посмотрю, что изменится.»` |
| fiery | invite | `"Looking. That's all. Not leaving. I want to see what else there is, so that staying is a choice and not a habit."` | `«Посмотреть. И всё. Не уходить. Хочу увидеть, что ещё есть, чтобы оставаться было выбором, а не привычкой.»` |
| fiery | respond | `"Together. Good. But I'm the one who says yes or no."` | `«Вместе. Хорошо. Но да или нет говорю я.»` |
| fiery | space | `"Fine. No hurry. But I'm not going to wonder forever."` | `«Ладно, спешить не будем. Но вечно гадать я тоже не собираюсь.»` |
| deep | invite | `"Only looking. I am not asking to leave. I would like to know what else exists, so that if I stay, I stay because I chose it."` | `«Только посмотреть, кто ещё есть. Я не прошу менять тренера. Если останусь, хочу знать, что это мой выбор.»` |
| deep | respond | `"I would like that. I would not want to do it alone, and I would not want it done for me."` | `«Мне бы этого хотелось. Я не хочу делать это одна, и не хочу, чтобы это делали за меня.»` |
| deep | space | `"Thank you. I will keep going to practice and keep watching how I feel. I will tell you when it settles."` | `«Спасибо. Я буду ходить на тренировки и наблюдать за собой. Скажу, когда всё уляжется.»` |
| quiet | invite | `"Just looking. Not leaving. I'd like to know what else there is."` | `«Просто посмотреть. Не уходить. Хочу знать, что ещё есть.»` |
| quiet | respond | `"Okay. Together is good."` | `«Хорошо. Лучше вместе.»` |
| quiet | space | `"Okay. I'll keep going and see."` | `«Хорошо. Буду ходить и посмотрю.»` |

## 45. Situation R75 – `a-year-in-we-need-to-talk`

⚖ 15.10 владелец (лист вычитки r52): ряды этого раздела `APPROVED`, его правки перенесены.

Subject `decision`; stages `school`, `after-school`, `independent`; fact gate `coach-feel-cold-year`. Его регистр сохранён: сначала `нормальные` (в каждом голосе), потом `по-прежнему не работает`, и просьба – `поговорить`, а не `поменять`. `Тот ли это тренер для меня` – вопрос, а не приговор; в `deep` она отдельно говорит, что ничья вина. `Ни разу не было совсем так, как надо` – «has never quite felt right» (смягчено словом `совсем`, чтобы строка была правдой и для `seems-off`, и для `off`). Прошедшее время только у неё самой (`думала`, `боялась`, `хотела`), ни одного при `тренер`.

### 45.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"A year in, and practice with my coach is fine, but it still isn't working for me. I think we should talk about it."` | `«Уже год с тренером. На тренировках вроде всё нормально, а мне всё равно не подходит. Давай поговорим?»` |
| fiery | `"A year in. Practice with my coach is fine, and it still isn't working. I think we need to talk about it."` | `«Год. С тренером всё вроде нормально, но у меня так и не сложилось. Нам надо поговорить.»` |
| deep | `"Practice with my coach has been fine for a year, and it has never quite felt right. I have thought about this for a long time, and I think we need to talk."` | `«Год с тренером. На тренировках всё вроде нормально, но мне за всё это время так и не стало спокойно. Я долго об этом думала. Давай поговорим.»` |
| quiet | `"A year of practice with my coach, give or take. It's fine, and it still isn't working. Can we talk about it?"` | `«Год с тренером, плюс-минус. Вроде всё нормально, а мне всё не подходит. Можем поговорить?»` |

### 45.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what she wants to talk about` | `Спросить, о чём она хочет поговорить` |
| respond | `Say you would like to talk it through` | `Сказать, что мы хотели бы всё обсудить` |
| space | `Say she can start whenever she is ready` | `Сказать, что начать можно, когда она будет готова` |

### 45.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Whether this is the right coach for me. I don't know the answer. I only know I can't keep not asking."` | `«Тот ли это тренер для меня. Я пока не знаю. Но больше не хочу делать вид, что вопроса нет.»` |
| sunny | respond | `"Thank you. I was a bit scared to bring it up."` | `«Спасибо. Мне было немного страшно об этом заговорить.»` |
| sunny | space | `"Okay. I want to find the words first."` | `«Хорошо. Сначала хочу найти слова.»` |
| fiery | invite | `"Whether this is the right coach for me. I don't have the answer. I'm done pretending I'm not asking."` | `«О том, тот ли это тренер для меня. Ответа у меня нет. Мне надоело делать вид, что я не спрашиваю.»` |
| fiery | respond | `"Good. That's all I wanted. Talking. We can argue about the rest later."` | `«Хорошо. Это всё, чего я хотела. Поговорить. Об остальном поспорим потом.»` |
| fiery | space | `"Fine. Soon, though. I've waited a year already."` | `«Ладно. Только скоро. Я уже год жду.»` |
| deep | invite | `"Whether this is the right coach for me. I do not know the answer, and I do not think it is anyone's fault. I only know I cannot go on not asking."` | `«О том, тот ли это тренер для меня. Я не знаю ответа и не думаю, что в этом чья-то вина. Знаю только, что не могу и дальше не спрашивать.»` |
| deep | respond | `"Thank you. I was afraid that asking would sound like an accusation. I only want it to be a question."` | `«Спасибо. Я боялась, что вопрос прозвучит как обвинение. Мне хочется, чтобы это был просто вопрос.»` |
| deep | space | `"Thank you. I will say it when I can say it without making it worse."` | `«Спасибо. Я скажу, когда смогу подобрать слова и никого не задеть.»` |
| quiet | invite | `"Whether this is the right coach for me. I don't know. I just can't keep not asking."` | `«О том, тот ли это тренер для меня. Не знаю. Просто больше не могу не спрашивать.»` |
| quiet | respond | `"Okay. Thanks. I'd like that."` | `«Хорошо. Спасибо. Мне бы этого хотелось.»` |
| quiet | space | `"Okay. I'll let you know."` | `«Хорошо. Дам знать.»` |

## 46. Corpus progress (14.10)

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 74 / 74 | 1406 / 1406 | 20 / 20 | all current generated situations complete as DRAFT |

The 11.10 line in §16 (51 / 51, 969 / 969, 4 / 4) is the record of the volume as it stood then; the four rows in §17–§21 join it, 76 ordinary strings and 16 shared beats more, the three rows in §22–§25 add 57 ordinary strings (12 openers, 9 labels, 36 replies) and no shared beat, the three rows in §26–§29 add 57 more on the same count, the four rows in §30–§34 add 76 (16 openers, 12 labels, 48 replies) and no shared beat, the three rows in §35–§38 add 57 on the count of the second and third (12 openers, 9 labels, 36 replies; no shared beat), and the six rows in §39–§45 add 114 (24 openers, 18 labels, 72 replies; no shared beat). Every English cell in §17–§45 is read from the parsed corpus by the generating script, not typed, and `npm run i18n:check` is the proof that no key is left without Russian.
