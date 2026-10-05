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

## 5. Corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 40 / 51 | 760 / 969 | 4 / 4 | R45–R52, R1–R25 and R27–R33 complete as DRAFT |
