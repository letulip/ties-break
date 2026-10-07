---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10E – Relationships and parting

This continues the line-by-line RU-10 life-beat drafts. Source authority is the current typed
copy in `src/engine/world/lifeBeat/`; no runtime localization is being implemented here. Every
Russian line is `DRAFT` for owner read. `roof`/`away` changes the frame, never the words inside
the daughter's quotation. The partner's name and gender are unknown in the model and remain so.

## 1. Someone in her life – `metCopy.ts`

The `close` register has her own voice in four temperaments; `steady` reports only a mention;
`strained`/`cold` receive a dry card. `open` and `private` describe how she wants the news held,
not two mechanically different relationships.

| voice/read/presence | English source | Russian draft |
| --- | --- | --- |
| sunny/open/roof | `She brought it up over dinner, before anyone asked. "There's someone. I wanted you to hear it from me first."` | `За ужином сама начала разговор, прежде чем кто-нибудь спросил. «У меня кое-кто появился. Я хотела сама тебе сказать».` |
| sunny/open/away | `She rang just to say it, nothing else on the list. "There's someone. I wanted you to hear it from me first."` | `Позвонила только ради этого, больше ничего не обсуждали. «У меня кое-кто появился. Я хотела сама тебе сказать».` |
| sunny/private/roof | `She brought it up over dinner, and wished straight away that she had not. "There's someone. Please don't go telling people."` | `За ужином сама об этом заговорила и сразу пожалела. «У меня кое-кто появился. Только, пожалуйста, никому пока не рассказывай».` |
| sunny/private/away | `She said it fast, at the end of an ordinary call. "There's someone. Please don't go telling people."` | `В конце обычного звонка выпалила быстро: «У меня кое-кто появился. Только, пожалуйста, никому пока не рассказывай».` |
| fiery/open/roof | `She was talking before her bag was down. "There's someone. It's good. That's all you're getting."` | `Сумку ещё не сняла, а уже заговорила. «У меня кое-кто есть. Всё хорошо. И больше я пока ничего не скажу».` |
| fiery/open/away | `She called, and was already talking. "There's someone. It's good. That's all you're getting."` | `Позвонила и заговорила без предисловий. «У меня кое-кто есть. Всё хорошо. И больше я пока ничего не скажу».` |
| fiery/private/roof | `She was talking before her bag was down. "There's someone. And no, we're not doing questions about it."` | `Сумку ещё не сняла, а уже заговорила. «У меня кое-кто есть. И нет, расспрашивать меня не надо».` |
| fiery/private/away | `She called, said it, and changed the subject herself. "There's someone. And no, we're not doing questions about it."` | `Позвонила, сказала и сама сменила тему. «У меня кое-кто есть. И нет, расспрашивать меня не надо».` |
| quiet/open/roof | `She said it while she put the shopping away, between two other things. "There's someone I see now."` | `Сказала между делом, пока разбирала покупки. «Я теперь кое с кем встречаюсь».` |
| quiet/open/away | `She slipped it in with the week's other news. "There's someone I see now."` | `Упомянула среди других новостей за неделю. «Я теперь кое с кем встречаюсь».` |
| quiet/private/roof | `She said it while she put the shopping away, and did not look up. "There's someone. I'd rather that stayed in this room."` | `Сказала, разбирая покупки, и не подняла глаз. «У меня кое-кто есть. Лучше пусть это останется между нами».` |
| quiet/private/away | `She said it at the end of a message about something else. "There's someone. I'd rather that stayed in this room."` | `Написала в конце сообщения совсем о другом. «У меня кое-кто есть. Лучше пусть это останется между нами».` |
| deep/open/roof | `She waited until the house was quiet, then said it once. "There is someone. That is all."` | `Дождалась, пока в доме стихнет шум, и сказала один раз: «У меня кое-кто есть. Пока всё».` |
| deep/open/away | `She called late, when the day was done, and said it once. "There is someone. That is all."` | `Позвонила поздно, когда день уже закончился, и сказала один раз: «У меня кое-кто есть. Пока всё».` |
| deep/private/roof | `She waited until the house was quiet, and asked first that it go no further. "There is someone. Now please let it be."` | `Дождалась тишины в доме и попросила не передавать дальше. «У меня кое-кто есть. Пожалуйста, оставь пока это между нами».` |
| deep/private/away | `She called once she was sure of the words, and asked first that it go no further. "There is someone. Now please let it be."` | `Позвонила, когда нашла слова, и попросила не передавать дальше. «У меня кое-кто есть. Пожалуйста, оставь пока это между нами».` |

| surface/read | English source | Russian draft |
| --- | --- | --- |
| `MET_MENTION.open` | `She mentioned someone this week, in passing. No name came with it.` | `На этой неделе она вскользь упомянула кого-то. Имени не назвала.` |
| `MET_MENTION.private` | `She let someone slip this week, caught herself, and moved the conversation on.` | `На этой неделе случайно обмолвилась о ком-то, осеклась и перевела разговор.` |
| `MET_DRY.open` | `There is someone in her life. She did not say so, and the house found out anyway.` | `В её жизни кто-то появился. Сама она не сказала, но дома всё равно узнали.` |
| `MET_DRY.private` | `There is someone in her life. She had been keeping it close, and it surfaced without her.` | `В её жизни кто-то появился. Она хотела оставить это при себе, но новость дошла и без неё.` |
| `MET_HEADING.her` | `She has told us there is someone` | `Она сама рассказала, что у неё кто-то появился` |
| `MET_HEADING.mention` | `Something she mentioned this week` | `Кое-что из того, о чём она обмолвилась на неделе` |
| `MET_HEADING.dry` | `There is someone in her life` | `В её жизни кто-то появился` |
| `MET_HEADING_HEADLINE` | `We read about it before she told us` | `Мы прочитали об этом раньше, чем она рассказала` |

`private/away` cannot literally say “in this room”, because there is no shared room; both
presences use the same Russian quote `между нами`. The headline frame reports the known channel
of discovery, but neither supplies a name nor implies who posted the story.

## 2. A relationship ends – `endedCopy.ts`

`told-now` means the parent knew about the relationship; `told-late` means the parent learns
about it only once it is over. Neither line invents a cause, a partner, or how long it lasted.
The `space`/`company` reading belongs in the heading, not in a different daughter's quote.

| voice/register/presence | English source | Russian draft |
| --- | --- | --- |
| sunny/told-now/roof | `She said it at the table and stayed sitting there afterwards. "It's over. I'm alright. I will be, anyway."` | `Сказала за столом и после этого не встала. «Всё кончено. Я в порядке. Ну, буду».` |
| sunny/told-now/away | `She called that evening and said it before anything else. "It's over. I'm alright. I will be, anyway."` | `Позвонила вечером и сказала прежде всего остального: «Всё кончено. Я в порядке. Ну, буду».` |
| sunny/told-late/roof | `She raised it herself on an ordinary evening, out of nothing. "There was someone. It's finished, and I should have said."` | `Обычным вечером сама подняла тему, без всякого повода. «У меня кое-кто был. Всё закончилось. Надо было сказать».` |
| sunny/told-late/away | `She came home for the weekend and said it before she went back. "There was someone. It's finished, and I should have said."` | `Приехала домой на выходные и сказала перед отъездом: «У меня кое-кто был. Всё закончилось. Надо было сказать».` |
| fiery/told-now/roof | `She came in, put her bag down slowly, and sat. "It's finished. No, I don't want to go through it."` | `Вошла, медленно поставила сумку и села. «Всё закончилось. Нет, разбирать это сейчас не хочу».` |
| fiery/told-now/away | `She rang, and it was a short call. "It's finished. No, I don't want to go through it."` | `Позвонила. Разговор вышел коротким. «Всё закончилось. Нет, разбирать это сейчас не хочу».` |
| fiery/told-late/roof | `She said it on her way through the kitchen and did not stop. "There was someone. It's done. I wasn't going to make a thing of it."` | `Сказала на ходу через кухню и не остановилась. «У меня кое-кто был. Теперь всё. Я не собиралась делать из этого событие».` |
| fiery/told-late/away | `She put it in a voice note about something else entirely. "There was someone. It's done. I wasn't going to make a thing of it."` | `Вставила это в голосовое сообщение совсем о другом. «У меня кое-кто был. Теперь всё. Я не собиралась делать из этого событие».` |
| quiet/told-now/roof | `She took her racquets out of the hall and re-stacked them by the door. "The weekend's free now. That's finished."` | `Убрала ракетки из прихожей и сложила заново у двери. «Теперь выходные свободны. Всё закончилось».` |
| quiet/told-now/away | `She texted the week's plans through, and this was under them. "The weekend's free now. That's finished."` | `Прислала планы на неделю, а ниже написала: «Теперь выходные свободны. Всё закончилось».` |
| quiet/told-late/roof | `She had the weekend bag open on the floor when she said it. "There was someone. It didn't need saying at the time."` | `Сумка на выходные лежала раскрытая на полу, когда она сказала: «У меня кое-кто был. Тогда об этом говорить было незачем».` |
| quiet/told-late/away | `She put it in the family chat, after the travel dates were settled. "There was someone. It didn't need saying at the time."` | `Написала в семейный чат, когда с датами поездки уже разобрались: «У меня кое-кто был. Тогда об этом говорить было незачем».` |
| deep/told-now/roof | `She let the week finish before she said anything at all. "It's over. I'd rather not say more."` | `Дождалась конца недели, прежде чем вообще что-то сказать. «Всё кончилось. Больше пока говорить не хочу».` |
| deep/told-now/away | `She let the message sit a while, and answered it with this. "It's over. I'd rather not say more."` | `Не сразу ответила на сообщение, а потом написала: «Всё кончилось. Больше пока говорить не хочу».` |
| deep/told-late/roof | `She said it to the window rather than to the room. "There was someone. It is over. That was mine to keep."` | `Сказала скорее окну, чем нам: «У меня кое-кто был. Теперь всё закончилось. Это я хотела оставить при себе».` |
| deep/told-late/away | `She said it at the door on a visit home, already leaving. "There was someone. It is over. That was mine to keep."` | `Сказала у двери, уже уходя после визита домой: «У меня кое-кто был. Теперь всё закончилось. Это я хотела оставить при себе».` |

| surface/register/read | English source | Russian draft |
| --- | --- | --- |
| `ENDED_DRY.told-now` | `It is over. She is getting on with the week and not talking about it.` | `Всё закончилось. Она занимается делами этой недели и об этом не говорит.` |
| `ENDED_DRY.told-late` | `There was someone in her life, and it is already over. Nobody was told at the time.` | `В её жизни кое-кто был, но теперь всё закончилось. Тогда она никому не рассказала.` |
| `ENDED_HEADING.told-now.space` | `It is over, and she wants the room to herself` | `Всё закончилось, и ей хочется побыть одной` |
| `ENDED_HEADING.told-now.company` | `It is over, and she does not want to be on her own with it` | `Всё закончилось, и ей не хочется оставаться с этим одной` |
| `ENDED_HEADING.told-late.space` | `There was someone, it is already over, and she wants the room to herself` | `В её жизни кое-кто был. Теперь всё закончилось, и ей хочется побыть одной` |
| `ENDED_HEADING.told-late.company` | `There was someone, it is already over, and she does not want to be on her own with it` | `В её жизни кое-кто был. Теперь всё закончилось, и ей не хочется оставаться с этим одной` |

The two presence columns keep each quoted sentence identical, including punctuation. `away`
is a different household, not a tournament away-week; the visits and calls here come from the
authored source rather than a locale-only assumption.

## 3. Marriage ends – `divorcedCopy.ts`

This beat has one register, because the earlier marriage was already known to the family. It
uses the same `space`/`company` reading as an ordinary ending but no `roof`/`away` axis. Do not
infer the spouse's gender, a legal filing date, blame, or a permanent end to all contact.

| voice/surface | English source | Russian draft |
| --- | --- | --- |
| sunny | `She called before the news could travel. "We're ending it. I'm all right. I wanted you to hear it from me."` | `Позвонила, пока новость не успела разойтись. «Мы расходимся. Со мной всё нормально. Я хотела сама тебе сказать».` |
| fiery | `She called and went straight to it. "The marriage is over. It's decided. I don't want to pick it apart."` | `Позвонила и сказала без предисловий. «Наш брак закончился. Всё решено. Не хочу разбирать это по кусочкам».` |
| quiet | `She called about the next few weeks. "We're separating. There are things to sort out. I may go quiet for a bit."` | `Позвонила обсудить ближайшие недели. «Мы расходимся. Нужно кое с чем разобраться. Возможно, какое-то время буду меньше выходить на связь».` |
| deep | `The call went quiet before she said it. "It's over. That's all I can say about it today."` | `В трубке повисла пауза, прежде чем она сказала: «Всё закончилось. Больше сегодня я об этом сказать не могу».` |
| `DIVORCED_DRY` | `The marriage is over. The news did not come from her.` | `Их брак закончился. Новость пришла не от неё.` |
| `DIVORCED_HEADING.space` | `Her marriage is over, and she wants the room to herself` | `Её брак закончился, и ей хочется побыть одной` |
| `DIVORCED_HEADING.company` | `Her marriage is over, and she does not want to be on her own with it` | `Её брак закончился, и ей не хочется оставаться с этим одной` |
| `DIVORCED_NOW_EVENT` / `divorcedKeptRow()` | `Her marriage ended this week.` | `На этой неделе её брак закончился.` |

`Мы расходимся` is a statement of separation, not a claim that the divorce is legally final;
the kept row follows the engine's marriage-ended event. Fiery `Всё решено` does not invent who
initiated that decision.
