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

## 3. Corpus progress

| rows | ordinary authored strings | shared second beats | state |
| ---: | ---: | ---: | --- |
| 16 / 51 | 304 / 969 | 4 / 4 | R45–R52 and R1–R8 complete as DRAFT |
