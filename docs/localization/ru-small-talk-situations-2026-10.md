---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-05
---

# RU-10A – Small-talk situation corpus, continued

This is the next editorial slice after [RU-10](ru-life-beats-small-talk-2026-10.md). It follows
the generated runtime order in `src/engine/world/smallTalkCorpus.ts` and records every opener,
shared parent stance and per-voice answer. The English authority remains
`docs/specs/small-talk-corpus-2026-09.md`; the runtime file is generated and must not be edited by
hand. All Russian lines are `DRAFT`. Situation IDs and draw order are never localized.

## 1. Situation R7 – `one-meal`

Subject `decision`; stages `college`, `independent`; no fact gate. This is her small cooking
question, with no nutrition judgment or budget consequence.

### 1.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I can make ONE thing now. Properly. I'm deciding whether to learn a second or just accept that this is who I am."` | `«Я теперь умею готовить ОДНО блюдо. По-настоящему. Думаю, выучить второе или принять себя такой».` |
| fiery | `"I can cook one meal. Either I learn another this week or I eat this one until I die. Those are the options."` | `«Я умею готовить одно блюдо. Или на этой неделе выучу второе, или буду есть это до смерти. Других вариантов нет».` |
| deep | `"I've made the same meal eleven times. I'm trying to work out whether that's competence or hiding."` | `«Я приготовила одно и то же блюдо одиннадцать раз. Думаю, это умение или я просто прячусь за привычкой».` |
| quiet | `"I've been eating the same thing most nights. It's fine. I might learn another one."` | `«Вечерами я обычно ем одно и то же. Нормально. Может, научусь готовить ещё что-нибудь».` |

### 1.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what the meal is` | `Спросить, что это за блюдо` |
| respond | `Say you lived on two meals for years` | `Сказать, что вы годами жили на двух блюдах` |
| space | `Say nobody is marking her on this` | `Сказать, что за это ей никто оценку не ставит` |

### 1.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Rice and eggs. That's it. But it's good rice and they're good eggs."` | `«Рис и яйца. Всё. Зато рис вкусный. И яйца тоже».` |
| sunny | respond | `"Two. You were ahead of me. That's actually quite encouraging."` | `«Два? Даже тогда у тебя было больше, чем у меня сейчас. Это обнадёживает».` |
| sunny | space | `"Nobody's marking me. I might learn a second one anyway."` | `«Никто не ставит. Но второе блюдо я, может, всё-таки освою».` |
| fiery | invite | `"Rice and eggs. Don't laugh. I can do it without thinking now."` | `«Рис и яйца. Не смейся. Теперь могу приготовить с закрытыми глазами».` |
| fiery | respond | `"Two is one more than me. So one of us got somewhere."` | `«Два – это на одно больше, чем у меня. Значит, кто-то из нас продвинулся».` |
| fiery | space | `"I'm marking me. That's usually enough."` | `«Я сама себе ставлю. Обычно этого хватает».` |
| deep | invite | `"Rice and eggs. I got good at it because I stopped trying anything else."` | `«Рис и яйца. Я научилась, потому что перестала пробовать что-то ещё».` |
| deep | respond | `"You've never said that. I assumed you'd always been able to cook."` | `«От тебя я такого не слышала. Думала, тебе всегда легко давалась готовка».` |
| deep | space | `"I know. I've still been counting how many times I've made it."` | `«Знаю. И всё равно считала, сколько раз это готовила».` |
| quiet | invite | `"Rice and eggs. It's quick."` | `«Рис и яйца. Быстро».` |
| quiet | respond | `"Two's fine, then. I'll stop worrying about it."` | `«Тогда и двух достаточно. Не буду из-за этого переживать».` |
| quiet | space | `"No. I'll learn another one sometime."` | `«Не ставит. Когда-нибудь научусь ещё чему-то».` |

The replies to the parent's cooking history avoid gendering the player-parent. Her eleven identical
meals are an authored anecdote, not a count derived from the food system.

## 2. Situation R8 – `alone-or-with-them`

Subject `decision`; stages `college`, `independent`; fact gate `march-entry-open`. The gate
licenses an open entry and time to decide; the authored travel group is part of this conversation.
No line promises a price or a booked seat.

### 2.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Everyone's going a day early. I could go with them or go on my own the morning after. I genuinely can't decide."` | `«Все едут на день раньше. Можно с ними, а можно одной на следующее утро. Правда не могу решить».` |
| fiery | `"I'm going on my own. Probably. A whole day of sitting around with everyone would finish me before I started."` | `«Поеду одна. Наверное. Если день просижу со всеми, устану ещё до начала».` |
| deep | `"A day early with them, or alone the next morning. I've picked it up and put it down about six times since lunch."` | `«На день раньше с ними или одной на следующее утро. После обеда я уже раз шесть к этому возвращалась».` |
| quiet | `"The group goes a day before. I could go after. Either works."` | `«Группа едет на день раньше. Я могу позже. Оба варианта подходят».` |

### 2.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask which one she keeps coming back to` | `Спросить, к какому варианту она возвращается` |
| respond | `Say arriving rested is worth something` | `Сказать, что приехать отдохнувшей тоже важно` |
| space | `Say either is fine and she should pick the easy one` | `Сказать, что оба варианта годятся; пусть выберет более простой` |

### 2.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"Going on my own. Every time. And then I feel bad about it, every time."` | `«К поездке одной. Каждый раз. А потом каждый раз чувствую себя виноватой».` |
| sunny | respond | `"That's a point. Going with them is probably the restful one, annoyingly."` | `«Это правда. И, как назло, с ними, наверное, будет спокойнее».` |
| sunny | space | `"Then I'll go with them. Deciding was the hard part, honestly."` | `«Тогда поеду с ними. Если честно, труднее всего было решить».` |
| fiery | invite | `"On my own. I keep landing there and then talking myself out of it."` | `«К поездке одной. Каждый раз выбираю её, а потом сама себя отговариваю».` |
| fiery | respond | `"Rested doing what? Sitting around with all of them for an extra day?"` | `«Отдохнувшей? После лишнего дня сидения со всеми?»` |
| fiery | space | `"Neither of them is the easy one. That's why I'm still going round it."` | `«Ни один не простой. Поэтому я всё ещё выбираю».` |
| deep | invite | `"Alone. I keep coming back to alone and I keep not booking it."` | `«К поездке одной. Всё возвращаюсь к ней и никак не бронирую».` |
| deep | respond | `"It is. I'm not sure rested is what I'm choosing between."` | `«Важно. Только не уверена, что именно в этом мой выбор».` |
| deep | space | `"That's the one I keep trying to find."` | `«Его-то я и пытаюсь найти».` |
| quiet | invite | `"The morning after. I keep looking at that one."` | `«Следующим утром. Всё смотрю на этот вариант».` |
| quiet | respond | `"It is. That's the argument for going early."` | `«Важно. Это довод за поездку пораньше».` |
| quiet | space | `"All right. I'll take the later one."` | `«Хорошо. Выберу более поздний».` |

The three parent stances remain zero-bond. Their replies differ because she may accept, resist or
quietly use the parent's thought; none of them scores the parent's answer.

## 3. Situation R9 – `the-routine-she-dropped`

Subject `decision`; stages `after-school`, `college`, `independent`; no fact gate. The water
bottle's former ritual stays unspecified. Dropping it does not change any actual match mechanic.

### 3.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"I've stopped doing the thing with the water bottle. I only just noticed I'd stopped!"` | `«Я больше не делаю ту штуку с бутылкой. Только сейчас заметила, что перестала!»` |
| fiery | `"I dropped the bottle thing. It was superstition and I'm not superstitious. I think."` | `«Я бросила эту штуку с бутылкой. Это же суеверие, а я не суеверная. Кажется».` |
| deep | `"There was a thing I did before matches. I stopped weeks ago and only worked out this week that I'd stopped."` | `«Раньше я кое-что делала перед матчами. Перестала несколько недель назад, а заметила только сейчас».` |
| quiet | `"I don't do the bottle thing any more. No particular reason."` | `«Я больше не делаю ту штуку с бутылкой. Без особой причины».` |

### 3.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask when she thinks she stopped` | `Спросить, когда она перестала` |
| respond | `Say she can start again if she misses it` | `Сказать, что она может вернуться к этому, если захочет` |
| space | `Say it clearly wasn't load-bearing` | `Сказать, что без этого ничего не рухнуло` |

### 3.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"No idea. That's the strange bit. I can't find the day I stopped."` | `«Понятия не имею. В этом и странность: не могу вспомнить день, когда перестала».` |
| sunny | respond | `"I could. I'm not sure I do miss it, which surprised me."` | `«Могу. Только я, кажется, и не скучаю по этому. Сама удивилась».` |
| sunny | space | `"Apparently not. It held nothing up at all."` | `«Похоже, нет. Ничего и правда не рухнуло».` |
| fiery | invite | `"I don't know. That's what's annoying. It just went and I didn't notice."` | `«Не знаю. Вот что бесит: ритуал исчез, а я даже не заметила».` |
| fiery | respond | `"I could. I'd feel ridiculous starting it again now."` | `«Могу. Но сейчас начать снова было бы ужасно глупо».` |
| fiery | space | `"Then why did I do it for so long?"` | `«Тогда зачем я столько времени это делала?»` |
| deep | invite | `"I can't find the day. I've gone back through the weeks and it isn't there."` | `«Не могу найти тот день. Мысленно перебрала недели – нигде его нет».` |
| deep | respond | `"I could. I've reached for it since and stopped myself."` | `«Могу. Несколько раз рука уже тянулась, но я себя останавливала».` |
| deep | space | `"No. I'd still like to know why I started."` | `«Нет. Но мне всё равно интересно, почему я когда-то начала».` |
| quiet | invite | `"Couldn't say. Sometime before this week."` | `«Не скажу. Где-то до этой недели».` |
| quiet | respond | `"I might. It's not really a decision."` | `«Может быть. Это ведь не такое уж решение».` |
| quiet | space | `"Seems not. I've been fine without it."` | `«Похоже, нет. И без этого всё нормально».` |

The `nothing collapsed` parent reply is deliberately light, not a claim that the old habit was
pointless. Deep and fiery are allowed to care about why it mattered.

## 4. Situation R10 – `advice-she-did-not-ask-for`

Subject `decision`; stages `college`, `independent`; no fact gate. The advice concerns return
position; the writer does not certify that the stranger's technical suggestion is correct.

### 4.1 Openers

| voice | English source | Russian draft |
| --- | --- | --- |
| sunny | `"Someone I've never spoken to told me to change how I stand to return. Do I... do that?"` | `«Незнакомая женщина сказала мне иначе вставать на приёме подачи. Мне... попробовать?»` |
| fiery | `"A woman I don't know told me how to return. I haven't decided whether that was kind or rude and I've had all week."` | `«Незнакомка объяснила мне, как принимать подачу. Всю неделю думаю: это было по-доброму или нагло?»` |
| deep | `"Unasked-for advice, from someone with no reason to help me. I've been trying to work out what she wanted from it."` | `«Совет, которого я не просила, от женщины, которой незачем мне помогать. Пытаюсь понять, чего она хотела».` |
| quiet | `"Somebody said something about my return. I wrote it down."` | `«Мне кое-что сказали про приём подачи. Я записала».` |

### 4.2 Shared stance labels

| stance | English source | Russian draft |
| --- | --- | --- |
| invite | `Ask what exactly she said` | `Спросить, что именно она сказала` |
| respond | `Say she can try it and drop it` | `Сказать, что можно попробовать и отказаться` |
| space | `Say she doesn't owe a stranger a change` | `Сказать, что она не обязана менять стойку ради незнакомки` |

### 4.3 Replies

| voice | stance | English source | Russian draft |
| --- | --- | --- | --- |
| sunny | invite | `"That I stand too square. She showed me, then walked off. Very brisk."` | `«Что я стою слишком прямо. Показала, как развернуться, и быстро ушла».` |
| sunny | respond | `"That's what I'll do. Try it once and see if I hate it."` | `«Так и сделаю. Раз попробую и пойму, бесит меня это или нет».` |
| sunny | space | `"I know. I'd quite like to try it anyway."` | `«Знаю. Но мне всё равно хочется попробовать».` |
| fiery | invite | `"That I'm square to the net when I should be turned. Then she left."` | `«Что я стою лицом к сетке, а надо развернуться. И ушла».` |
| fiery | respond | `"I'll try it. If it's wrong, I'll know straight away."` | `«Попробую. Если ерунда, сразу почувствую».` |
| fiery | space | `"I don't owe her anything. I still can't stop thinking about it."` | `«Ничего я ей не должна. Но из головы это всё равно не выходит».` |
| deep | invite | `"That I stand square. She said it, showed me once, and went."` | `«Сказала, что я стою слишком прямо. Один раз показала и ушла».` |
| deep | respond | `"I can. I keep wondering why she bothered telling me at all."` | `«Могу. Только всё думаю, зачем она вообще решила мне сказать».` |
| deep | space | `"No. It's sitting there whether I owe her or not."` | `«Не обязана. Но мысль никуда не девается».` |
| quiet | invite | `"Something about being too square. It's in my phone."` | `«Что-то про то, что стою слишком прямо. У меня в телефоне записано».` |
| quiet | respond | `"I might try it in practice."` | `«Может, попробую на тренировке».` |
| quiet | space | `"No. I'll leave it for now."` | `«Не обязана. Пока оставлю как есть».` |

`Приём подачи` is the tennis action in this exchange. The Russian does not turn the stranger into
her coach or present the advice as a verified correction.

## 5. Corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 18 / 51 | 342 / 969 | 4 / 4 | R45–R52 and R1–R10 complete as DRAFT |
