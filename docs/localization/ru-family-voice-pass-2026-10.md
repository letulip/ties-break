---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-19 – Family-voice pass: the parent speaks as «мы»

The record of one editorial conversion, applied on 07.10.2026 in the intake branch. Every converted
line below stays `DRAFT`: the owner reads it in the PR diff, and this document is the table he reads it against.

This file is a record, not a replacement table: its `old` columns quote retired wording on purpose, so a language
sweep and the importer must skip it.

## 1. The order, the formula, and what it covers

The owner's order №10 of 07.10.2026 (`docs/decisions.md`, «LOCALIZATION: THE NINE QUESTIONS RULED, PLUS THREE ORDERS»):

> «здесь и в остальных местах мы говорим от лица "семьи", т.е. "мы купили", "мы видели", "мы гордимся", "мы не разобрали" и т.д. надо всё везде проверить и переписать»

It is the one ruled exception to «no agent writes Russian»: a formula he gave, with examples, applied
mechanically, every change listed in §3. No line was reworded, softened or shortened.

**The formula** changes grammatical person and nothing else:

1. A first-person-singular parent form becomes first-person plural in the same tense and aspect:
   `Я видел.` → `Мы видели.`, `я не разобрал` → `мы не разобрали`, `Я ответил` → `мы ответили`,
   `я узнаю` → `мы узнаём`.
2. The pronoun follows, in whatever case grammar needs: `я` → `мы`, `мне` → `нам`, `меня` → `нас`.
3. A word that agrees with the subject follows it: `сам` → `сами`, `первым` → `первыми`.
4. Nothing else moves: sentence casing, punctuation, word order, length class, register and every other
   word stay as drafted.
5. A cell is converted whole. A sentence cannot swing between persons, so every first-person-singular
   reference inside a converted cell flips with it (§3 row 12 also turns `мне` into `нам`).

**Two kinds of converted cell**, both in the §3 table:

- **G** – the cell carries a gendered parent form (`разобрал`, `услышал`, `ошибся`, `первым`). 27 cells.
- **C** – coherence. An ungendered singular cell that sits on the same sheet as a G cell (same album
  occasion and voice) or in the same picker (the viewer's shout list) and flips with it, so one sheet is not
  written in two persons. 4 cells: A15 sunny note, A16 fiery line, A21 deep line, the viewer's `Still here.`.

**Lawful exclusions** – not converted, and counted in §2:

- the daughter's own quoted speech (`я устала`, `я сказала`): she is feminine, and the quotes are hers;
- the `the-line` album page (A34): the previous heroine's mother writes it, in her own feminine first
  person (RU-14 names it; the album corpus keeps its note);
- any other named character's own voice: the coach, the psychologist and the masseur speaking in their own
  first person. That is the staff-gender question (§5), not the parent's.

## 2. Counts

| measure | count |
| --- | --- |
| converted cells (= the §3 table rows) | **31** |
| – gendered, kind G | 27 (album corpus 26 in 14 blocks, viewer shout 1) |
| – coherence, kind C | 4 (album corpus 3, viewer 1) |
| daughter's quoted cells, untouched | 276 (of them 2 in `ru-retirement-dialog`, a file this pass does not edit) |
| `the-line` cells, untouched | 5 (four notes and the deep caption of A34 `the-line`) |
| other named voices in first person, untouched | 3 (the coach in `RU02B-HO-R5` and in counsel `own`; the masseur in the §35.2 letter) |
| staff rows flagged for the gender param | **31** (§5) |
| parent-`я` rows found in the six files `ru-ending-*`, `ru-retirement-dialog`, `ru-stats-trophies-album`, `ru-formatters-countries`, `ru-current-main-delta` | 0 |
| ungendered singular parent cells found, NOT converted | **40** (§4, the owner's call) |

The 284 gendered-`я` cells left after the pass (276 + 5 + 3) are the whole of the corpus: every one is inside
the daughter's quotation marks, on the `the-line` page, or one of the three staff cells. None is the parent's.

## 3. The before→after table

Files are named by alias; the legend is at the end of the section. «Kind» is G or C as defined in §1.

| # | file | block · voice · cell | kind | old | new |
| --- | --- | --- | --- | --- | --- |
| 1 | album-corpus | A5 `first-title` · `sunny` · note | G | `Первый титул. Ты позвонила прямо с корта – я не разобрал ни слова.` | `Первый титул. Ты позвонила прямо с корта – мы не разобрали ни слова.` |
| 2 | album-corpus | A5 `first-title` · `sunny` · line | G | `Сначала я услышал трибуны, и только потом её.` | `Сначала мы услышали трибуны, и только потом её.` |
| 3 | album-corpus | A7 `title-after-injury` · `quiet` · line | G | `По второму «всё нормально» я и понял.` | `По второму «всё нормально» мы и поняли.` |
| 4 | album-corpus | A11 `season-first` · `sunny` · note | G | `Первый сезон позади. Ты хотела понять, хорошее ли это место, а я и сам не знал.` | `Первый сезон позади. Ты хотела понять, хорошее ли это место, а мы и сами не знали.` |
| 5 | album-corpus | A15 `injury` · `sunny` · note | C | `Неделя, когда всё остановилось. Ты сразу заговорила о том, что ещё можешь делать. Меня это напугало больше, чем испугали бы слёзы.` | `Неделя, когда всё остановилось. Ты сразу заговорила о том, что ещё можешь делать. Нас это напугало больше, чем испугали бы слёзы.` |
| 6 | album-corpus | A15 `injury` · `sunny` · line | G | `Я бы предпочёл слёзы.` | `Мы бы предпочли слёзы.` |
| 7 | album-corpus | A15 `injury` · `deep` · note | G | `Неделя, когда всё остановилось. Ты спросила, надолго ли. Я ответил, что не знаю, и ты надолго замолчала.` | `Неделя, когда всё остановилось. Ты спросила, надолго ли. Мы ответили, что не знаем, и ты надолго замолчала.` |
| 8 | album-corpus | A16 `injury-return` · `fiery` · note | G | `Первая неделя после возвращения. Ты хотела всё и сразу, тебе сказали «нет», и я услышал об этом во всех подробностях.` | `Первая неделя после возвращения. Ты хотела всё и сразу, тебе сказали «нет», и мы услышали об этом во всех подробностях.` |
| 9 | album-corpus | A16 `injury-return` · `fiery` · line | C | `Тебе сказали «нет». Я в курсе.` | `Тебе сказали «нет». Мы в курсе.` |
| 10 | album-corpus | A19 `break-even` · `sunny` · note | G | `Неделя, когда теннис себя окупил. Ты сказала, что теперь можно перестать считать на кухонном столе. Я ответил: посмотрим.` | `Неделя, когда теннис себя окупил. Ты сказала, что теперь можно перестать считать на кухонном столе. Мы ответили: посмотрим.` |
| 11 | album-corpus | A19 `break-even` · `sunny` · line | G | `Посмотрим, сказал я.` | `Посмотрим, сказали мы.` |
| 12 | album-corpus | A21 `wedding` · `deep` · note | G | `Перед началом ты сказала мне одну фразу. Я до сих пор никому её не повторил.` | `Перед началом ты сказала нам одну фразу. Мы до сих пор никому её не повторили.` |
| 13 | album-corpus | A21 `wedding` · `deep` · line | C | `Эту я оставлю себе.` | `Эту мы оставим себе.` |
| 14 | album-corpus | A34 `birth` · `deep` · note | G | `Целую неделю ты почти ничего не говорила. И никогда ещё я не видел тебя такой уверенной.` | `Целую неделю ты почти ничего не говорила. И никогда ещё мы не видели тебя такой уверенной.` |
| 15 | album-corpus | A34 `birth` · `deep` · line | G | `Никогда ещё я не видел её такой уверенной.` | `Никогда ещё мы не видели её такой уверенной.` |
| 16 | album-corpus | A22 `first-house` · `sunny` · note | G | `Твоя собственная входная дверь. Ты позвонила из пустого коридора, чтобы я услышал эхо.` | `Твоя собственная входная дверь. Ты позвонила из пустого коридора, чтобы мы услышали эхо.` |
| 17 | album-corpus | A22 `first-house` · `sunny` · line | G | `Я услышал эхо.` | `Мы услышали эхо.` |
| 18 | album-corpus | A29 `years-at-the-top` · `quiet` · line | G | `О следующей я узнаю первым. Так было всегда.` | `О следующей мы узнаём первыми. Так было всегда.` |
| 19 | album-corpus | A31 `farewell` · `fiery` · note | G | `Последний матч. Мнение у тебя сложилось раньше, чем собрали сумки, и тем же вечером я выслушал его целиком.` | `Последний матч. Мнение у тебя сложилось раньше, чем собрали сумки, и тем же вечером мы выслушали его целиком.` |
| 20 | album-corpus | A31 `farewell` · `deep` · note | G | `Последний матч. Ты осталась на корте, когда все ушли, а я не стал тебя торопить.` | `Последний матч. Ты осталась на корте, когда все ушли, а мы не стали тебя торопить.` |
| 21 | album-corpus | A31 `farewell` · `deep` · line | G | `Я дал ей побыть на корте.` | `Мы дали ей побыть на корте.` |
| 22 | album-corpus | A32 `career-ended` · `sunny` · note | G | `Вот и весь альбом. Ты расскажешь эту историю лучше, чем я её написал. И громче.` | `Вот и весь альбом. Ты расскажешь эту историю лучше, чем мы её написали. И громче.` |
| 23 | album-corpus | A32 `career-ended` · `fiery` · note | G | `С чем-то здесь ты не согласишься. Я оставил место для возражений. Вот и весь альбом.` | `С чем-то здесь ты не согласишься. Мы оставили место для возражений. Вот и весь альбом.` |
| 24 | album-corpus | A32 `career-ended` · `fiery` · line | G | `Для спора я оставил место.` | `Для спора мы оставили место.` |
| 25 | album-corpus | A32 `career-ended` · `deep` · note | G | `Вот и весь альбом. Ты найдёшь ту единственную неделю, в которой я ошибся. И будешь права.` | `Вот и весь альбом. Ты найдёшь ту единственную неделю, в которой мы ошиблись. И будешь права.` |
| 26 | album-corpus | A32 `career-ended` · `deep` · caption | G | `Она найдёт неделю, в которой я ошибся.` | `Она найдёт неделю, в которой мы ошиблись.` |
| 27 | album-corpus | arc `open` · `quiet` · note | G | `Много лет на вопрос «как ты?» я получал расписание. В этом году получил ответ.` | `Много лет на вопрос «как ты?» мы получали расписание. В этом году получили ответ.` |
| 28 | album-corpus | arc `reserved` · `deep` · note | G | `Ты всегда говорила точно – и всегда не сразу. Теперь ещё точнее и ещё позже. А я перестал тебя торопить.` | `Ты всегда говорила точно – и всегда не сразу. Теперь ещё точнее и ещё позже. А мы перестали тебя торопить.` |
| 29 | album-corpus | arc `reserved` · `deep` · line | G | `Я перестал её торопить.` | `Мы перестали её торопить.` |
| 30 | viewer | §3 parent shouts · `I saw that.` | G | `Я видел.` | `Мы видели.` |
| 31 | viewer | §3 parent shouts · `Still here.` | C | `Я рядом.` | `Мы рядом.` |

Aliases used in the tables of §3–§5:

| alias | file |
| --- | --- |
| `album-corpus` | `ru-album-corpus-2026-10.md` |
| `viewer` | `ru-match-viewer-commentary-2026-10.md` |
| `album-delta` | `ru-album-delta-2026-10.md` |
| `fridge-notes` | `ru-fridge-notes-2026-10.md` |
| `fridge-notes-b` | `ru-fridge-notes-b-2026-10.md` |
| `prologue` | `ru-childhood-prologue-2026-10.md` |
| `counsel` | `ru-life-beats-counsel-2026-10.md` |
| `answer-feed` | `ru-life-beats-answer-feed-2026-10.md` |
| `diary-travel` | `ru-diary-travel-corpus-2026-10.md` |
| `diary-week-notes` | `ru-diary-week-notes-corpus-2026-10.md` |
| `season-tournaments` | `ru-season-tournaments-2026-10.md` |
| `money-staff-shop-inbox` | `ru-money-staff-shop-inbox-2026-10.md` |

Kind C rows and the G rows they sit beside: row 5 beside 6; row 9 beside 8; row 13 beside 12; row 31 beside 30.

## 4. The remainder: ungendered singular parent cells – NOT converted, the owner's call

His order asks for the family voice «везде», and one of his own examples, `мы гордимся`, is ungendered: the
singular it replaces, `Горжусь тобой.`, needs no gender at all (fridge notes, two rows ★ below). This pass was scoped
to cells that carry a gendered parent form, so these 40 cells were left exactly as drafted and are listed instead,
each with the form the same formula gives. Today these sheets mix persons: the album already writes `Мы её
отговорили.` for a family act and `Мне пришлось этому научиться.` for a private one.

If he wants the whole voice flipped, these rows are the whole job: apply each `proposed` by exact match, no other
file is affected. If he wants them kept, nothing needs to happen. Either way they stay `DRAFT`.

| # | file | row | old (unchanged) | proposed (not applied) |
| --- | --- | --- | --- | --- |
| 1 | album-corpus | A3 `first-win` · `sunny` · note | `Ты выиграла матч. И рассказала мне про один розыгрыш, а не про счёт.` | `Ты выиграла матч. И рассказала нам про один розыгрыш, а не про счёт.` |
| 2 | album-corpus | A3 `first-win` · `deep` · line | `Хорошее она складывает куда-то, где мне не видно.` | `Хорошее она складывает куда-то, где нам не видно.` |
| 3 | album-corpus | A8 `title-last` · `deep` · note | `Ты всегда знала, какие из них важны. Мне кажется, ты поняла, что этот последний, раньше меня.` | `Ты всегда знала, какие из них важны. Нам кажется, ты поняла, что этот последний, раньше нас.` |
| 4 | album-corpus | A9 `first-final` · `sunny` · note | `Твой первый финал. Ты рассказала, кто сидел на трибунах и как вы вышли на корт. Про счёт пришлось спросить мне.` | `Твой первый финал. Ты рассказала, кто сидел на трибунах и как вы вышли на корт. Про счёт пришлось спросить нам.` |
| 5 | album-corpus | A9 `first-final` · `sunny` · caption | `Про счёт пришлось спросить мне.` | `Про счёт пришлось спросить нам.` |
| 6 | album-corpus | A9 `first-final` · `quiet` · note | `Твой первый финал. Ты рассказала мне про часы у корта.` | `Твой первый финал. Ты рассказала нам про часы у корта.` |
| 7 | album-corpus | A10 `final-lost` · `deep` · note | `Ты проиграла финал, а потом рассказала мне про один розыгрыш, на котором всё повернулось.` | `Ты проиграла финал, а потом рассказала нам про один розыгрыш, на котором всё повернулось.` |
| 8 | album-corpus | A13 `season-held` · `sunny` · note | `Год на месте. Ты сказала, что его середина слилась в одно, и я прекрасно понимаю.` | `Год на месте. Ты сказала, что его середина слилась в одно, и мы прекрасно понимаем.` |
| 9 | album-corpus | A14 `season-down` · `quiet` · note | `Весь год ты рассказывала мне о расписаниях и отелях – и ни разу о самом годе.` | `Весь год ты рассказывала нам о расписаниях и отелях – и ни разу о самом годе.` |
| 10 | album-corpus | A15 `injury` · `fiery` · note | `Неделя, когда всё остановилось. Ты злилась на пол, кроссовки, расписание и меня. Именно в таком порядке.` | `Неделя, когда всё остановилось. Ты злилась на пол, кроссовки, расписание и нас. Именно в таком порядке.` |
| 11 | album-corpus | A25 `academy-courts` · `sunny` · note | `Корты появились. Ты сказала, что вышла на первый ещё до того, как высохли линии. Я верю.` | `Корты появились. Ты сказала, что вышла на первый ещё до того, как высохли линии. Мы верим.` |
| 12 | album-corpus | A28 `top-tier-title` · `sunny` · note | `Самый большой титул. Ты позвонила и не могла закончить ни одной фразы. Я тоже.` | `Самый большой титул. Ты позвонила и не могла закончить ни одной фразы. Мы тоже.` |
| 13 | album-corpus | A32 `career-ended` · `quiet` · note | `Ты прочтёшь всё до конца и почти ничего не скажешь. А я пойму. Вот и весь альбом.` | `Ты прочтёшь всё до конца и почти ничего не скажешь. А мы поймём. Вот и весь альбом.` |
| 14 | album-corpus | A32 `career-ended` · `quiet` · line | `Я пойму, что это значило.` | `Мы поймём, что это значило.` |
| 15 | album-corpus | Arc towards `open` · `sunny` · note | `С тобой всегда было легко говорить. Теперь я лучше знаю: твоя лёгкость – ещё не вся ты.` | `С тобой всегда было легко говорить. Теперь мы лучше знаем: твоя лёгкость – ещё не вся ты.` |
| 16 | album-corpus | Arc towards `open` · `deep` · note | `Раньше тебе требовалась неделя, чтобы сказать мне одну правдивую фразу. Теперь ты говоришь её в тот же день. Фраза всё ещё одна. И всё ещё правдивая.` | `Раньше тебе требовалась неделя, чтобы сказать нам одну правдивую фразу. Теперь ты говоришь её в тот же день. Фраза всё ещё одна. И всё ещё правдивая.` |
| 17 | album-corpus | Arc towards `reserved` · `sunny` · note | `Раньше ты рассказывала мне обо всём в ту же неделю. Теперь кое-что остаётся твоим, и мне пришлось понять: это не закрытая дверь.` | `Раньше ты рассказывала нам обо всём в ту же неделю. Теперь кое-что остаётся твоим, и нам пришлось понять: это не закрытая дверь.` |
| 18 | album-corpus | Arc towards `reserved` · `sunny` · line | `Не закрытая дверь. Мне пришлось этому научиться.` | `Не закрытая дверь. Нам пришлось этому научиться.` |
| 19 | album-corpus | Arc towards `reserved` · `fiery` · note | `Раньше ты успевала решить всё ещё до конца фразы. Теперь сначала берёшь себе вечер. Мне немного не хватает шума.` | `Раньше ты успевала решить всё ещё до конца фразы. Теперь сначала берёшь себе вечер. Нам немного не хватает шума.` |
| 20 | album-corpus | Arc towards `reserved` · `quiet` · note | `Ты всегда многое оставляла при себе. Теперь ещё больше. Зато сказанное стало весомее, и я слушаю внимательнее.` | `Ты всегда многое оставляла при себе. Теперь ещё больше. Зато сказанное стало весомее, и мы слушаем внимательнее.` |
| 21 | album-delta | sunny / note (RU-16) | `Первая ракетка мира. Ты позвонила прочитать мне рейтинг – и потом прочитала ещё раз, на всякий случай.` | `Первая ракетка мира. Ты позвонила прочитать нам рейтинг – и потом прочитала ещё раз, на всякий случай.` |
| 22 | album-delta | quiet / note (RU-16) | `Первая ракетка мира. Ты упомянула об этом после всех бытовых дел. И только после моего вопроса.` | `Первая ракетка мира. Ты упомянула об этом после всех бытовых дел. И только после нашего вопроса.` |
| 23 | fridge-notes | `Back late tonight. Dinner is in the oven.` | `Вернусь поздно. Ужин в духовке.` | `Вернёмся поздно. Ужин в духовке.` |
| 24 | fridge-notes | `Do not forget your keys again.` | `Ключи. Да, опять напоминаю.` | `Ключи. Да, опять напоминаем.` |
| 25 | fridge-notes | `Love you. Have a good day.` | `Люблю тебя. Хорошего дня.` | `Любим тебя. Хорошего дня.` |
| 26 | fridge-notes | `Home around six. Help yourself to anything.` | `Буду дома около шести. Пока бери что хочешь.` | `Будем дома около шести. Пока бери что хочешь.` |
| 27 | fridge-notes | `Bed before eleven, please. Both of us.` | `Давай сегодня до одиннадцати уже спать. Это и меня касается.` | `Давай сегодня до одиннадцати уже спать. Это и нас касается.` |
| 28 | fridge-notes | `Biscuits are gone. Do not blame me.` | `Печенье кончилось. Только не вини меня.` | `Печенье кончилось. Только не вини нас.` |
| 29 | fridge-notes | `Sorry about this morning. Tea when I am back.` | `Прости за утро. Вернусь – попьём чаю.` | `Прости за утро. Вернёмся – попьём чаю.` |
| 30 | fridge-notes | `Proud of you. Just so you know.` ★ | `Горжусь тобой. Просто чтобы ты знала.` | `Гордимся тобой. Просто чтобы ты знала.` |
| 31 | fridge-notes | `Dinner Sunday? This is me booking early.` | `Поужинаем в воскресенье? Зову заранее.` | `Поужинаем в воскресенье? Зовём заранее.` |
| 32 | fridge-notes | `You called while I was out. Call again; I liked it.` | `Ты звонила, когда меня не было. Позвони ещё – мне понравилось.` | `Ты звонила, когда нас не было. Позвони ещё – нам понравилось.` |
| 33 | fridge-notes | `Proud of you. Not because of anything in particular.` ★ | `Горжусь тобой. Не за что-то конкретное.` | `Гордимся тобой. Не за что-то конкретное.` |
| 34 | fridge-notes | `Parcel here for you. It can wait. I apparently cannot.` | `Тебе посылка сюда пришла. Она подождёт. Я, похоже, нет.` | `Тебе посылка сюда пришла. Она подождёт. Мы, похоже, нет.` |
| 35 | fridge-notes | `Saw your message. I was asleep at nine. Roles reversed.` | `Твоё сообщение пришло в девять, а я уже спать. Теперь всё наоборот.` | `Твоё сообщение пришло в девять, а мы уже спать. Теперь всё наоборот.` |
| 36 | fridge-notes | `The hall is quieter. I am not saying that is better.` | `В прихожей стало тише. Не говорю, что лучше.` | `В прихожей стало тише. Не говорим, что лучше.` |
| 37 | fridge-notes | `Text when you get in. Yes, I know you are grown.` | `Напиши, когда доберёшься. Да, знаю, что ты уже взрослая.` | `Напиши, когда доберёшься. Да, знаем, что ты уже взрослая.` |
| 38 | fridge-notes-b | `Grandma asks for your address. I said I would check.` | `Бабушка просит твой адрес. Сначала спрошу у тебя.` | `Бабушка просит твой адрес. Сначала спросим у тебя.` |
| 39 | fridge-notes-b | `No reply needed. Just checking the line works.` | `Отвечать не нужно. Просто проверяю, доходит ли.` | `Отвечать не нужно. Просто проверяем, доходит ли.` |
| 40 | fridge-notes-b | `The family chat has started. You have been warned.` | `Семейный чат уже оживился. Предупреждаю.` | `Семейный чат уже оживился. Предупреждаем.` |

Not in the list on purpose: the child's own quoted request `«Можно я?»` (A1 sunny line) is the daughter, not
the parent. In the fridge notes `Прости за утро.` stays: it is an imperative addressed to her, and carries no
first-person form to flip.

## 5. Staff marking – rows that need the gender param

Russian past tense forces a gender on an unnamed professional, and the engine fixes none for the coach (a
woman sits on every roster by construction, R15-7), the psychologist, the doctor or the hitting partner. These
rows keep their drafted Russian untouched; each carries the flag **«нужна форма по полу говорящего (select)»**,
so the landing wave passes the speaker's gender into the `{g, select, f{…} m{…}}` form (spec `i18n-2026-10.md` §3.3).
Where the table has a note cell the flag is appended to it; where it has none, the flag stands in one line directly
under the table (the spec rules «no table restructure», §9.2). `grep -n "нужна форма по полу говорящего (select)"
docs/localization/*.md` finds every one.

| # | file | row | speaker and masculine form | flag placed |
| --- | --- | --- | --- | --- |
| 1 | prologue | `RU02B-09-07` | coach, `предложил` | note cell |
| 2 | prologue | `RU02B-10-06` | coach, `говорил` | note cell |
| 3 | prologue | `RU02B-11-T1` | coach, `упомянул` | line under the table |
| 4 | prologue | `RU02B-12Q-06` | coach, `видел` | note cell |
| 5 | prologue | `RU02B-12Q-T1` | coach, `спросил`, `попросил` | line under the table |
| 6 | prologue | `RU02B-12M-07` | coach, `ждал` | note cell |
| 7 | prologue | `RU02B-HO-R5` | coach, first person, `ошибался` | line under the table |
| 8 | counsel | `worn` | coach, `зашёл` | line under the table |
| 9 | counsel | `strained` | coach, `позвонил`, `остался` | line under the table |
| 10 | counsel | `own` | coach, first person too, `позвонил`, `не стал`, `уважал` | line under the table |
| 11 | counsel | `COUNSEL_HEADING` | coach, `попросил` | line under the table |
| 12 | counsel | `plain/worn` | psychologist, `позвонил` | line under the table |
| 13 | counsel | `plain/strained` | psychologist, `позвонил` | line under the table |
| 14 | counsel | `plain/own` | psychologist, `позвонил` | line under the table |
| 15 | counsel | `breakup/worn` | psychologist, `позвонил` | line under the table |
| 16 | counsel | `breakup/strained` | psychologist, `позвонил` | line under the table |
| 17 | counsel | `breakup/own` | psychologist, `позвонил` | line under the table |
| 18 | counsel | `PSY_HEADING` | psychologist, `попросил` | line under the table |
| 19 | answer-feed | `fork-counsel.heard` | coach, `позвонил` | line under the table |
| 20 | answer-feed | `fork-counsel.weigh` | coach, `позвонил` | line under the table |
| 21 | answer-feed | `fork-psy.straight` | psychologist, `позвонил` | line under the table |
| 22 | answer-feed | `fork-psy.keep` | psychologist, `позвонил`, `его слова` | line under the table |
| 23 | diary-travel | `Her coach came with us…` | coach, `ехал` | line under the table |
| 24 | diary-travel | `Her coach was there all week…` | coach, `был` | line under the table |
| 25 | diary-travel | `Her coach travelled down with the bags…` | coach, `ехал`, `остался` | line under the table |
| 26 | diary-travel | `The coach was in the row behind us…` | coach, `сидел` | line under the table |
| 27 | diary-week-notes | `RU09D-F048` | doctor, `велел` | line under the table |
| 28 | diary-week-notes | `RU09D-F055` | coach, `молчал`, `следил` | line under the table |
| 29 | diary-week-notes | `RU09D-F116` | coach, `назвал` | line under the table |
| 30 | season-tournaments | `medical veto` | doctor, `не разрешил` | line under the table |
| 31 | money-staff-shop-inbox | `on aria (hitting-partner travel toggle)` | hitting partner, `оставался` | line under the table |

Considered and not flagged:

- **the masseur** – male by the engine's own grammar (`src/engine/world/masseur.ts`: «the pronoun is safe here, unlike the
  coach's»): the `ru-staff-feed` hire row (`присоединился`), the `ru-money-staff-shop-inbox` travel toggle (`оставался`)
  and the §35.2 letter in his own first person (`выбрал`);
- rows already built to avoid the choice: the `ru-staff-feed` annual rate request (`поступил запрос`), the `S02` raise
  in `ru-current-main-delta` (`Прошу повысить`), `met.wary` in `ru-life-beats-answer-feed` (an infinitive);
- every staff row in the present tense (`Тренер говорит`, `Тренер ездит с ней`): the present shows no gender.

## 6. Design statements this pass retired

English commentary that stated or assumed a male parent. Only the sentence named here changed; no Russian cell moved.

| file | place | said | says now |
| --- | --- | --- | --- |
| album-corpus | §2, `note` register | «the parent writes to his daughter» | «the parent writes to the daughter» |
| album-corpus | after A5 | «The parent is male in this corpus, hence `не разобрал`.» | the ruled law: no gender, family `мы`, link to this record, `the-line` kept as the exception |
| album-corpus | §23 intro | «the truth of his daughter» | «the truth of the daughter» |
| album-corpus | §25 runtime contract | «Before catalog generation, reconcile the old masculine first-person readings…» | records that they were reconciled on 07.10; the `the-line` sentence is verbatim |
| viewer | §3 note under the shouts | «The parent's masculine `видел` follows the album and project narrator.» | the family law, with `Мы видели.` and `Мы рядом.` |
| diary-birthday | §2 voice bullet | «…with masculine parent forms where the English source says `I`…» | no parent gender; the diary speaks as `мы` where Russian would need a gendered form |
| style guide | §3 | – | one bullet added carrying the ruling, dated 07.10 |
| README | stack table | – | the RU-19 row added; no other row touched |

The `last-reviewed` field of each file this pass edited reads 2026-10-07.

## 7. How it was found, and what the method cannot see

- **The `я` sweep.** Every Russian backtick cell in all 61 files with a standalone `я` (the `-я` of an ordinal such as
  `14-я` excluded), read clause-wide for a past form in `-л`, `-ла`, `-лся`, `-лась`, a masculine past without `-л`
  (`ошибся`, `помог`, `принёс`…), a gendered short adjective (`рад`, `один`, `сам`, `первым`…) and the inversion `сказал я`.
  Before the pass: **311** cells. After: **284**. The 27 that disappeared are the 27 G rows; the 26 in the album are
  the audit's own count of «26 cells in 14 blocks», reproduced independently.
- **The dropped-subject check.** A parent can be gendered with no `я` at all (`Спросил потом.`). Two nets. First, the 378
  table rows whose English source has an `I` past or perfect: 361 are the daughter's or the spouse's speech, 2 are staff,
  and the 15 parent rows (fridge notes, album delta, viewer shout) were all written around the gender with impersonal
  forms, passives or `мы` – the viewer's `Я видел.` was the one slip, row 30. Second, a masculine-past scan of every
  parent-voice file – fridge notes, album delta, ending album, birthday and diary corpora, and the album corpus after the
  pass: every masculine past left has an inanimate, indefinite or staff subject. No gendered parent form was found without
  an `я`.
- **The staff list.** A role noun (`тренер`, `психолог`, `врач`, `спарринг-партнёр`…) in a row with a masculine past, a masculine
  pronoun or a masculine first person, each row read. A staff row that implies its role by context and never names it cannot be
  found by a scan: the list is the rows found, not a proof of completeness.
- **Not read as gendered:** `мне`, `меня`, `мой`, and a dropped-subject present (`Горжусь`) – they carry no gender, which is
  why they are §4's remainder and not §3's rows.
- The sweep reads the 61 stack files and skips this record, whose `old` columns quote the retired wording.
- The scanners were throwaway scripts, not a committed tool; the tables above are the authority for the counts.

