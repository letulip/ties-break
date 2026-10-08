---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-10I – The school-leaving fork

This volume translates the daughter's school-leaving choice in `src/engine/world/lifeBeat.ts`.
All Russian lines are `DRAFT`. `up` means bright/level mood; `low` is a separate register. The
choices are college, the tour, and stopping. A close/steady relationship can hear her voice;
at strained/cold bond the short `FLAT_LINE` is all the parent hears. Her personality changes
wording, never which choice the engine made.

## 1. Her first line – `HER_LINE`

| voice/want/register | English source | Russian draft |
| --- | --- | --- |
| sunny/college/up | `She brought it up over dinner, to both of us. "I keep thinking about the library. And the four years, if I am honest."` | `За ужином сама заговорила об этом с нами обоими. «Всё думаю о библиотеке. И о четырёх годах, если честно».` |
| sunny/college/low | `She waited for a quiet evening to ask. "Could we talk about me going? I would like the four years."` | `Дождалась тихого вечера и спросила: «Можем поговорить о том, что я уеду учиться? Я бы хотела эти четыре года».` |
| sunny/tour/up | `She talked us through next season, city by city. "I want to play. Properly, all of it."` | `Прошла с нами следующий сезон город за городом. «Я хочу играть. По-настоящему. Весь сезон».` |
| sunny/tour/low | `She answered before the question was all the way out. "The tour. That has not changed, whatever this week looked like."` | `Ответила, не дослушав вопрос: «Тур. Это не изменилось, как бы ни прошла эта неделя».` |
| sunny/stop/up | `She told us together, at the table. "I think I am done. I wanted you both to hear it from me."` | `Сказала нам обоим за столом: «Кажется, я заканчиваю. Хотела, чтобы вы оба узнали от меня».` |
| sunny/stop/low | `She picked a night when the house was full. "I want to stop. I do not think there is another season in me."` | `Выбрала вечер, когда все были дома. «Я хочу остановиться. Не думаю, что потяну ещё один сезон».` |
| fiery/college/up | `She said yes to a question nobody had asked yet. "College. Four years. I already know."` | `Ответила на вопрос, который ещё никто не задал. «Университет. Четыре года. Я уже решила».` |
| fiery/college/low | `She was flat all week and said it anyway, all at once. "College. I want out of this circuit for a while."` | `Всю неделю ходила без сил, но всё равно выпалила: «Университет. Хочу хотя бы на время уйти из этого круга».` |
| fiery/tour/up | `She did not sit down for this one. "Put me in. I do not want a careful year."` | `Даже не села. «Заявляйте меня. Не хочу осторожничать целый год».` |
| fiery/tour/low | `She said it from under a blanket on the sofa. "The tour. I do not care how this week went."` | `Сказала из-под пледа на диване: «Тур. Мне всё равно, как прошла эта неделя».` |
| fiery/stop/up | `She stood up to say it. "I am stopping. Book nothing for next year."` | `Встала, прежде чем сказать: «Я заканчиваю. На следующий год ничего не планируйте».` |
| fiery/stop/low | `She said it once, with the door already half closed. "I want to stop. I have had enough of all of it."` | `Сказала один раз, уже прикрыв дверь: «Я хочу закончить. С меня хватит всего этого».` |
| quiet/college/up | `She left the prospectus on the table, open at one page. "That one has the course I want."` | `Оставила проспект открытым на нужной странице. «Там есть программа, которую я хочу».` |
| quiet/college/low | `She asked what the term dates were before she asked anything else. "I would take the place, if it is there."` | `Первым делом спросила о датах семестра. «Если там найдётся место, я бы поехала».` |
| quiet/tour/up | `She was already writing next year down when she mentioned it. "I would keep playing. The schedule works."` | `Уже записывала планы на следующий год, когда обмолвилась: «Я бы продолжила играть. По срокам получается».` |
| quiet/tour/low | `She asked about the entry deadlines first. "I would rather keep going."` | `Сначала спросила о сроках подачи заявок. «Я бы лучше продолжила».` |
| quiet/stop/up | `She handed back the entry forms unsigned. "I would like to stop now, I think."` | `Вернула бланки заявок без подписи. «Думаю, я бы сейчас закончила».` |
| quiet/stop/low | `She said it once, and then asked about something else entirely. "I want to stop."` | `Сказала один раз и тут же спросила совсем о другом: «Я хочу закончить».` |
| deep/college/up | `She told us at the end of the week, after the bags were unpacked. "College. I have known for a while."` | `Сказала в конце недели, когда сумки уже разобрали. «Университет. Я давно это знаю».` |
| deep/college/low | `She said it in the car, with the engine off. "College. I need somewhere else to be."` | `Сказала в машине, когда двигатель уже заглушили. «Университет. Мне нужно быть где-то ещё».` |
| deep/tour/up | `She let everyone else talk first. "The tour. I know what it costs."` | `Дала сначала высказаться остальным. «Тур. Я знаю, чего он стоит».` |
| deep/tour/low | `She had been quiet for days, and said it at the sink. "The tour. Even now."` | `Несколько дней молчала, а потом сказала у раковины: «Тур. Даже сейчас».` |
| deep/stop/up | `She said it after everyone else had gone to bed. "I want to stop. I do not want another January."` | `Сказала, когда остальные уже легли. «Я хочу закончить. Ещё одного января не хочу».` |
| deep/stop/low | `She said it once, and turned the light off. "I am done."` | `Сказала один раз и выключила свет. «Я закончила».` |

`Университет` follows RU-05's product terminology for the American-style college route; it is
not a claim about a particular Russian institution. `Тур` is the career tour rather than a
package trip. The daughter's direct
speech may use `ты` to the parent, but none of these lines needs a gendered form of address.

## 2. When stopping has a driver – `HER_STOP_LINE`

These eight lines replace the general stop line only for `worn` and `strained`. `own` keeps
section 1's stop rows. A driver is an internal explanation for wording, not a score or a
diagnosis spoken to the parent.

| voice/driver | English source | Russian draft |
| --- | --- | --- |
| sunny/worn | `She came looking for us both, and left the kit bag where it was. "I'm tired in a way an off-season doesn't fix. I want to stop."` | `Пришла искать нас обоих, спортивную сумку так и оставила у двери. «Я устала так, что межсезоньем это не исправить. Хочу закончить».` |
| sunny/strained | `She told us in the kitchen, standing, with her coat over her arm. "I've decided to stop. I should have said something sooner."` | `Сказала нам на кухне, не садясь, с курткой на руке. «Я решила закончить. Надо было сказать раньше».` |
| fiery/worn | `She said it sitting on the stairs, still in her kit. "I'm empty. Every week took something. I want to stop."` | `Сказала, сидя на лестнице, ещё в спортивной форме. «Я выдохлась. Каждая неделя что-то забирала. Хочу закончить».` |
| fiery/strained | `She said it from the doorway, keys still in her hand. "I'm stopping. It's not a conversation. I wanted you to know."` | `Сказала с порога, не выпуская ключи из руки. «Я заканчиваю. Обсуждать не буду. Просто хотела тебе сказать».` |
| quiet/worn | `She had put her bag on the high shelf before she said anything. "I haven't got another season in me. The rest we can sort later."` | `Прежде чем заговорить, убрала сумку на верхнюю полку. «Ещё один сезон я не потяну. Остальное решим потом».` |
| quiet/strained | `She said it while she was putting her shoes away, without stopping. "I'm not playing next year. You'll need to tell the club, I think."` | `Сказала, убирая обувь, даже не прервавшись. «В следующем году я не играю. Клубу, наверное, надо будет сообщить».` |
| deep/worn | `She said it standing by the window, with her back to the room. "I'm tired. Not this week. All of it."` | `Сказала у окна, спиной к комнате. «Я устала. Не за эту неделю. За всё время».` |
| deep/strained | `She said it on her way through the room, without sitting down. "I'm stopping. I decided it on my own."` | `Сказала на ходу через комнату, не садясь. «Я заканчиваю. Я сама это решила».` |

The fiery/strained source addresses the parent directly but uses English `you`; Russian
`знал`/`знала` would assign the player a gender. `Хотела тебе сказать` keeps the move without it.

## 3. When the parent listens – `HER_CONTINUATION`

The continuation is shown before the `listen` choice is recorded. At strained/cold bond there
is deliberately no extra line; silence must not manufacture intimacy.

| voice/want | English source | Russian draft |
| --- | --- | --- |
| sunny/college | `She kept going when nobody filled the pause. "And I would come home for the summers. I have looked at how it fits."` | `Когда паузу никто не заполнил, продолжила: «На лето я бы приезжала домой. Я посмотрела, как это устроить».` |
| sunny/tour | `She filled the quiet herself. "I know what it asks of the house. I am asking anyway."` | `Сама нарушила тишину: «Я знаю, чего это потребует от семьи. И всё равно прошу».` |
| sunny/stop | `She reached over before she went on. "It is not one bad week. I have been sure for a while."` | `Прежде чем продолжить, протянула руку через стол. «Дело не в одной плохой неделе. Я уже давно уверена».` |
| fiery/college | `She took the silence as a yes and kept building. "I will play the college season. It is not goodbye to tennis."` | `Приняла молчание за согласие и продолжила: «Я буду играть за университет. С теннисом я не прощаюсь».` |
| fiery/tour | `She was not finished. "And I do not want a safe schedule. Real draws."` | `На этом она не закончила: «И не надо мне осторожного расписания. Хочу играть в больших сетках».` |
| fiery/stop | `She said the rest to the window. "I am not sad about it. I want you to know that."` | `Остальное сказала окну: «Мне от этого не грустно. Мне важно тебе это сказать».` |
| quiet/college | `She added one thing, to the table more than to us. "The room comes with a desk by the window."` | `Добавила одну деталь, скорее столу, чем нам: «В комнате стол у окна».` |
| quiet/tour | `She slid the calendar across. "I marked the weeks I would be home."` | `Подвинула календарь: «Я отметила недели, когда буду дома».` |
| quiet/stop | `She answered the question that had not been asked yet. "The racquets can go to the club."` | `Ответила на вопрос, который ещё не задали: «Ракетки можно отдать в клуб».` |
| deep/college | `She said the other half after a while. "It is not about the tennis. I want you to know it is not."` | `Через некоторое время добавила: «Дело не в теннисе. Мне важно тебе это сказать».` |
| deep/tour | `She looked up once. "Do not worry about me out there."` | `На мгновение подняла глаза. «Не тревожься за меня там».` |
| deep/stop | `She finished it on her way out of the room. "Thank you for not talking me out of it."` | `Договорила уже на выходе из комнаты: «Спасибо, что не отговариваешь меня».` |

## 4. Controls, flat register and heading

| surface | English source | Russian draft |
| --- | --- | --- |
| `LISTEN_DONE_LABEL` | `Let her finish` | `Дать ей договорить` |
| `CONFIRM_LABEL` | `Proceed` | `Продолжить` |
| `FLAT_LINE.college` | `She was asked what she wants for next year, in the end. "College."` | `В конце концов её спросили, чего она хочет на следующий год. «Университет».` |
| `FLAT_LINE.tour` | `She was asked what she wants for next year, in the end. "Keep playing."` | `В конце концов её спросили, чего она хочет на следующий год. «Продолжать играть».` |
| `FLAT_LINE.stop` | `She was asked what she wants for next year, in the end. "Stop."` | `В конце концов её спросили, чего она хочет на следующий год. «Закончить».` |
| `HEADING.bright` | `School is over, and she has told us what she wants` | `Школа закончилась. Она сама рассказала, чего хочет` |
| `HEADING.level` | `School is over, and she has said what she wants` | `Школа закончилась. Она сказала, чего хочет` |
| `HEADING.low` | `School is over, and it took her a while to say it` | `Школа закончилась. Ей понадобилось время, чтобы сказать об этом` |

The flat register is short without being rude. The three heading variants report the tone of
the week, not a hidden recommendation about which future is correct.
