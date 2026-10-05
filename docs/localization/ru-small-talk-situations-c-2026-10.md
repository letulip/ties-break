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
| invite | `Ask how bad it looks` | `Спросить, сильно ли это заметно` |
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

## 15. Corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 50 / 51 | 950 / 969 | 4 / 4 | R45–R52, R1–R25 and R27–R43 complete as DRAFT |
