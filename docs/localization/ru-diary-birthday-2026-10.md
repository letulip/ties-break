---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-09 – Diary and birthdays

## 1. Scope and subdivision

RU-09 owns the parent's tier-zero diary, travel scraps, ordinary-week observations, birthday
dialogue and the life-stage wording shared by those corpora. All Russian copy is `DRAFT`.

The source is too large for one editorial table: the current diary and birthday modules contain
more than eight thousand lines and several independent deterministic pools. The batch is therefore
reviewed in four sections while keeping one runtime locale boundary:

1. shared diary chrome, memory card and birthday headings – this document;
2. the birthday gift catalogue and birthday feed/history lines;
3. travel-home captions and scraps;
4. photo, condition and ordinary-week notes across school, after-school, college and independent
   life.

Life beats and interactive small talk remain RU-10. RU-09 may describe the same age or relationship,
but it does not absorb a dialog merely because both speakers are family.

## 2. Voice and invariants

- Diary writing is the parent's private voice: warm, observant and compact. The parent has no
  gender: where the English source says `I` and Russian would need a gendered form, the diary
  speaks as the family, `мы` (owner's 07.10 order №10, [RU-19](ru-family-voice-pass-2026-10.md)).
- Daughter quotations use intimate `ты` only when she addresses the parent. Diary captions about
  her remain third person.
- `school`, `after-school`, `college` and `independent` are facts, not age synonyms. A line about a
  shared hallway requires the under-one-roof stages; a line about a call or message may span both
  away stages.
- Locale may replace a selected English string with its Russian counterpart, but must preserve the
  licence, claim set, deterministic pool index and purpose-scoped RNG read count.
- Stored history cannot expose its saved English `text` in Russian mode. Birthday and diary events
  need semantic ids plus arguments, or a tested deterministic conversion of every legacy shape.
- Russian copy writes `ё` and project dashes consistently.

## 3. Diary greeting

| source | Russian draft |
| --- | --- |
| `Good morning` | `Доброе утро` |
| `Good afternoon` | `Добрый день` |
| `Good evening` | `Добрый вечер` |
| `Good night` | `Спокойной ночи` |

The source removes a greeting whose time-of-day noun already appears in the photo line. Russian
cannot perform that rule by slicing an English `Good ` prefix or by searching arbitrary translated
text. Each greeting and caption variant should expose a semantic time token (`morning`, `day`,
`evening`, `night`) alongside its text. The deterministic filtering and draw remain identical.

`Спокойной ночи` is intentionally not a literal `Доброй ночи`: it reads as the parent closing the
page, while the other three open it. Week 0 still forces morning and a resolved tournament still
forces evening.

## 4. Memory card – tier grammar

`TIER_SHORT` is suitable for badges, not for insertion into Russian diary sentences. A single
translated fragment would have to be nominative in `первый титул`, genitive after `до финала`, and
prepositional after `на турнире`. RU-09 therefore renders each full memory mould from semantic
`tierId`.

Examples of the required forms:

| tier | title phrase | final phrase |
| --- | --- | --- |
| local | `первый титул на местном турнире` | `первый финал местного турнира` |
| regional | `первый региональный титул` | `первый региональный финал` |
| national | `первый титул Национальной серии` | `первый финал Национальной серии` |
| j30 | `первый титул J30` | `первый финал J30` |
| w15 | `первый титул W15` | `первый финал W15` |
| generic/null | `первый титул` | `первый финал` |

J60, J300, W35, W50, W75, W100, WTA 125/250/500/1000 and Grand Slam follow the same code/name
policy established in RU-04. The renderer owns the case; callers pass ids, never a localized label
to concatenate.

## 5. Memory card – milestone lines

| source family | Russian draft |
| --- | --- |
| `Her first {tier} title.` | `Её {tierTitlePhrase}.` |
| `The week she won her first {tier}.` | `Неделя, когда она взяла {tierFirstTitleAccusative}.` |
| `Her first {tier} final.` | `Её {tierFinalPhrase}.` |
| `First time through to a {tier} final.` | `Впервые дошла до {tierFinalGenitive}.` |
| `Her first international entry – {tier}.` | `Первая международная заявка – {tierBadge}.` |
| international without tier | `Первая международная заявка.` |
| `The first passport week – {tier}.` | `Первая неделя с паспортом – {tierBadge}.` |
| passport week without tier | `Первая неделя с паспортом.` |
| `First prize money – a {tier} cheque.` | `Первые призовые – чек за {tierEventAccusative}.` |
| prize without tier | `Первые призовые. Настоящий чек.` |
| `The first week the tennis paid her.` | `Первая неделя, когда теннис ей заплатил.` |
| `{injury} – her first injury.` | `{InjuryName}. Её первая травма.` |
| `Season {year}: #{rank} International.` | `Сезон {year}: №{rank} в международном рейтинге.` |
| `She ended {year} #{rank} International.` | `{year} год она закончила на №{rank} международного рейтинга.` |

The injury name is localized from the semantic injury/body id before sentence assembly; do not
capitalize or display an English `m.kind`. The ranking line explicitly remains the international
junior table because that is the fact persisted by the current milestone schema.

Before integration, measure all variants inside the 138 px card. The English 39-character pin is
not a Russian layout specification; Russian may need a width fixture or a locale-specific authored
limit, while the two-line visual contract remains.

## 6. Memory of the opening week

| source | Russian draft |
| --- | --- |
| `The week it all started.` | `Неделя, с которой всё началось.` |
| `Her very first week at the club.` | `Её самая первая неделя в клубе.` |
| `Week one. New grips, new nerves.` | `Первая неделя. Новые обмотки, новые нервы.` |
| `The first walk through those gates.` | `Первый раз прошли через те ворота.` |

`Новые нервы` is deliberately a slightly playful parent's phrase, not a diagnosis of anxiety.
The selected line, portrait stage, emotion and rotation cursor remain unchanged.

## 7. Memory time labels

| source | Russian |
| --- | --- |
| `one year ago` | `год назад` |
| `Week {n}` | `Неделя {n}` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| empty/too early state | `use the RU-03 Home-card line, not a second diary translation` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

The anniversary tolerance remains ±1 week. Russian text does not recalculate dates or change which
milestone interrupts the rotation.

## 8. Shared birthday age words

| age | Russian word |
| --- | --- |
| 13 | `тринадцать` |
| 14 | `четырнадцать` |
| 15 | `пятнадцать` |
| 16 | `шестнадцать` |
| 17 | `семнадцать` |
| 18 | `восемнадцать` |
| 19 | `девятнадцать` |
| 20 | `двадцать` |
| unknown | `на год старше` |
| over 20 | locale-formatted numeral, as in the source rule |

The result is a standalone age utterance, not `N лет`; headings below supply their own sentence.
Russian capitalization is applied to the completed heading, not by uppercasing the first UTF-16
code unit of a fragment.

## 9. Birthday headings

### 9.1 Through fourteen – still a child at home

| source | Russian draft |
| --- | --- |
| `{N}. Somehow already.` | `{N}. Уже. Как так вышло.` |
| `Happy birthday, kiddo.` | `С днём рождения, мелкая.` |
| `{N} today. The candles made it official.` | `{N} сегодня. Свечи подтвердили.` |

`Мелкая` is affectionate family shorthand, not interface address. If it feels too sharp in the
owner's read, the safer alternative is `С днём рождения, девчонка.`; do not flatten it to the formal
`поздравляем с днём рождения`.

### 9.2 Fifteen to seventeen – her plans are arriving

| source | Russian draft |
| --- | --- |
| `{N}. That came round quickly.` | `{N}. Быстро же.` |
| `Happy birthday. She beat us to the candles.` | `С днём рождения. До свечей она добралась раньше нас.` |
| `{N} today. Her plans started before breakfast.` | `{N} сегодня. Планы начались ещё до завтрака.` |

### 9.3 Eighteen

| source | Russian draft |
| --- | --- |
| `Eighteen. And allowed to sign things.` | `Восемнадцать. Теперь можно подписывать документы.` |
| `Happy birthday. An adult, apparently.` | `С днём рождения. Взрослая, оказывается.` |
| `Eighteen candles and a very full calendar.` | `Восемнадцать свечей и очень плотный календарь.` |

### 9.4 Nineteen to twenty-one

| source | Russian draft |
| --- | --- |
| `{N}. She brought her own plans.` | `{N}. Она пришла со своими планами.` |
| `Happy birthday. Dinner fitted around practice.` | `С днём рождения. Ужин подстроили под тренировку.` |
| `{N} today. The day already had opinions.` | `{N} сегодня. У дня уже было своё мнение.` |

### 9.5 Twenty-two to twenty-eight – a separate calendar, not an asserted home

| source | Russian draft |
| --- | --- |
| `{N}. We found a gap in her calendar.` | `{N}. Нашли окно в её календаре.` |
| `Happy birthday. She chose the time; we kept the cake ready.` | `С днём рождения. Время выбрала она; мы держали торт наготове.` |
| `{N} today. Her own plans, our old birthday plates.` | `{N} сегодня. Планы её, старые праздничные тарелки – наши.` |

These lines assert only separate schedules. They work for college housing, a rented flat, family
home and a life out of suitcases; none invents keys, a roommate or a city.

### 9.6 Twenty-nine and later

| source | Russian draft |
| --- | --- |
| `{N}. The calendar argued with dinner. Dinner won.` | `{N}. Календарь спорил с ужином. Ужин победил.` |
| `Happy birthday. Cake when she could make it.` | `С днём рождения. Торт – когда она смогла.` |
| `{N} today. Still no sensible number of candles.` | `{N} сегодня. Свечей всё ещё неприлично много.` |

## 10. Birthday event and the non-object gift

| source | Russian draft |
| --- | --- |
| `the day together` – diary seam (ключа в каталоге пока нет – ряд ждёт) | `день вместе` |
| `Her birthday. No parcel – just the day, kept clear for each other.` | `Её день рождения. Без свёртка – просто день, который мы оставили друг для друга.` |
| `Her birthday. {giftLabel}, opened before the cake.` | `Её день рождения. {giftLabel}, открыли ещё до торта.` |

The second event cannot safely insert a button label unchanged: Russian labels are nominative
(`Фотоаппарат`), while the sentence needs an object or a passive construction. Each gift catalogue
entry must therefore expose a short event form or, preferably, a complete localized event line.
This is handled with the catalogue in RU-09's next section.

The stable seam for `day` is a semantic gift kind/id, not comparison against the English or Russian
noun. Translating `BIRTHDAY_DAY_NOUN` and continuing to use it as a logic discriminator would make
copy an engine key.

## 11. Verification for this section

- All four greetings retain the same forced/deterministic selection and semantic de-duplication.
- Every milestone type renders with null and non-null optional data; no English tier or injury name
  leaks into the Russian card.
- Memory lines fit the phone card at 320, 390 and 430 px without changing the selected memory.
- Ages 13–30 exercise every heading band, mandatory `ё`, and numeral fallback after twenty.
- A legacy saved birthday event renders in Russian from id/arguments rather than its stored English
  sentence.
- Locale changes no birthday offer, asked id, option order, bond delta, week gate or RNG draw.

## ⚙ 11.10 agent-authored (бланкет) – the memory-card lines and the weekly phrase pool, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

78 keys: the 15 memory-card lines of `engine/diary.ts`, the birthday dialog's kicker, and the 61 lines of `diary/pool.ts` that the phrase pool still had without Russian. RU-09's draft of the memory lines (`Её {tierTitlePhrase}.`, `Впервые дошла до {tierFinalGenitive}.`) needs a case form of the tier the key does not carry – `short(tier)` is the tier's code (`J30`, `W15`) or the English `Local` / `tournament` – so the Russian keeps the owner's words and puts the code after a dash (`Её первый титул – {0}.`). The ranking lines receive `LADDER_LABEL.itf` in English and put it in brackets. The pool's lines are the parent's observations: short, past tense for her, the family `мы` where the family acts, nothing graded. `an injury` is an unwrapped fallback (no call site asks for it).

| id | English | Russian |
| --- | --- | --- |
| RU21-DIA-01 | `Her birthday – {0}` | `Её день рождения – {0}` |
| RU21-DIA-02 | `First prize money – a real cheque.` | `Первые призовые. Настоящий чек.` |
| RU21-DIA-03 | `First prize money – a {0} cheque.` | `Первые призовые – чек за турнир {0}.` |
| RU21-DIA-04 | `First time through to a {0} final.` | `Впервые дошла до финала – {0}.` |
| RU21-DIA-05 | `Her first international entry – {0}.` | `Первая международная заявка – {0}.` |
| RU21-DIA-06 | `Her first international entry.` | `Первая международная заявка.` |
| RU21-DIA-07 | `Her first {0} final.` | `Её первый финал – {0}.` |
| RU21-DIA-08 | `Her first {0} title.` | `Её первый титул – {0}.` |
| RU21-DIA-09 | `Season {0}: #{1} {2}.` | `Сезон {0}: №{1} ({2}).` |
| RU21-DIA-10 | `She ended {0} #{1} {2}.` | `{0} год она закончила на №{1} ({2}).` |
| RU21-DIA-11 | `The first passport week – {0}.` | `Первая неделя с паспортом – {0}.` |
| RU21-DIA-12 | `The first passport week.` | `Первая неделя с паспортом.` |
| RU21-DIA-13 | `The first week the tennis paid her.` | `Первая неделя, когда теннис ей заплатил.` |
| RU21-DIA-14 | `The week she won her first {0}.` | `Неделя, когда она взяла свой первый титул – {0}.` |
| RU21-DIA-15 | `The week went by.` | `Неделя прошла.` |
| RU21-DIA-16 | `an injury` | `Травма` |
| RU21-DIA-17 | `{0} – her first injury.` | `{0}. Её первая травма.` |
| RU21-DIA-18 | `A clinic full of people who do this for a living.` | `Клиника, полная людей, для которых это работа.` |
| RU21-DIA-19 | `A family week away – she came back lighter.` | `Неделя с семьёй вдали от дома – вернулась будто налегке.` |
| RU21-DIA-20 | `A hit-out at the club, nothing on the line.` | `Просто обмен ударами в клубе, на кону ничего.` |
| RU21-DIA-21 | `A new month on the kitchen calendar. The same routine.` | `Новый месяц на кухонном календаре. Тот же распорядок.` |
| RU21-DIA-22 | `A practice match, and the usual training.` | `Тренировочный матч и обычные тренировки.` |
| RU21-DIA-23 | `A quiet training week.` | `Спокойная неделя тренировок.` |
| RU21-DIA-24 | `A school project took the evenings – glue on everything.` | `Школьный проект забрал вечера – клей на всём.` |
| RU21-DIA-25 | `A spare key on her own ring. We are still getting used to that.` | `Запасной ключ на её собственной связке. Мы всё ещё привыкаем.` |
| RU21-DIA-26 | `A voice note from the supermarket: no milk, plenty of string.` | `Голосовое из магазина: молока нет, зато струн сколько угодно.` |
| RU21-DIA-27 | `A week at her grandmother's – slow food, slow days, and it shows.` | `Неделя у бабушки – неспешная еда, неспешные дни, и это заметно.` |
| RU21-DIA-28 | `A week at home – nothing special, and it worked.` | `Неделя дома – ничего особенного, и это сработало.` |
| RU21-DIA-29 | `A week away. The racquet stayed home.` | `Неделя в отъезде. Ракетка осталась дома.` |
| RU21-DIA-30 | `A week by the sea, and she slept through most of it.` | `Неделя у моря, и большую её часть она проспала.` |
| RU21-DIA-31 | `A week of swimming pools and physio beds.` | `Неделя бассейнов и кушеток физиотерапевта.` |
| RU21-DIA-32 | `A week outdoors – tired legs, clear head.` | `Неделя на воздухе – усталые ноги, ясная голова.` |
| RU21-DIA-33 | `A week where nothing could reach her, and her legs noticed first.` | `Неделя, когда ничто не могло до неё добраться, – и первыми это почувствовали ноги.` |
| RU21-DIA-34 | `An ordinary week – practice, errands, an early night.` | `Обычная неделя – тренировки, дела, ранний отбой.` |
| RU21-DIA-35 | `An ordinary week – practice, pasta, an early night.` | `Обычная неделя – тренировки, паста, ранний отбой.` |
| RU21-DIA-36 | `An ordinary week – school, practice, pasta.` | `Обычная неделя – школа, тренировки, паста.` |
| RU21-DIA-37 | `Exams took the week.` | `Экзамены забрали всю неделю.` |
| RU21-DIA-38 | `Fresh – the rest is paying off.` | `Свежая – отдых работает.` |
| RU21-DIA-39 | `Groceries together on Saturday. She pushed the cart.` | `В субботу вместе ходили за продуктами. Тележку везла она.` |
| RU21-DIA-40 | `Her calendar said rest. She said errands counted.` | `В календаре у неё отдых. Она сказала, что дела тоже считаются.` |
| RU21-DIA-41 | `Her own bed all week. Half the street in the kitchen.` | `Всю неделю спала в своей кровати. На кухне – пол-улицы.` |
| RU21-DIA-42 | `Her phone buzzed all evening. The homework got done anyway.` | `Телефон жужжал весь вечер. Уроки она всё равно сделала.` |
| RU21-DIA-43 | `Her washing machine lost a fight with red clay.` | `Её стиральная машина проиграла бой красному грунту.` |
| RU21-DIA-44 | `Homework at the kitchen table, racquet by the door.` | `Уроки на кухонном столе, ракетка у двери.` |
| RU21-DIA-45 | `Match week – the travel and the tennis both took their cut.` | `Турнирная неделя – дорога и теннис взяли каждый своё.` |
| RU21-DIA-46 | `Nothing to report. That is its own kind of good.` | `Сообщить нечего. Это тоже по-своему хорошо.` |
| RU21-DIA-47 | `Off-season – rest, errands, and the block where next year gets built.` | `Межсезонье – отдых, дела и работа над планом на следующий год.` |
| RU21-DIA-48 | `Off-season – rest, family, and the block where next year gets built.` | `Межсезонье – отдых, семья и работа над планом на следующий год.` |
| RU21-DIA-49 | `Off-season – rest, school, family.` | `Межсезонье – отдых, школа, семья.` |
| RU21-DIA-50 | `On the road this week.` | `Эта неделя прошла в дороге.` |
| RU21-DIA-51 | `Out with the {0} – {1} to go.` | `Выбыла из-за травмы ({0}) – осталось: {1}.` |
| RU21-DIA-52 | `Out with the {0} – {1} week to go.` | `Выбыла из-за травмы ({0}). {1, plural, one {Осталась {1} неделя} few {Осталось {1} недели} many {Осталось {1} недель} other {Осталось {1} недели}}.` |
| RU21-DIA-53 | `Out with the {0} – {1} weeks to go.` | `Выбыла из-за травмы ({0}). {1, plural, one {Осталась {1} неделя} few {Осталось {1} недели} many {Осталось {1} недель} other {Осталось {1} недели}}.` |
| RU21-DIA-54 | `Pasta again. Nobody complained.` | `Опять паста. Никто не жаловался.` |
| RU21-DIA-55 | `Rain most of the week – practice moved indoors.` | `Почти всю неделю дождь – тренировки перенесли под крышу.` |
| RU21-DIA-56 | `Rehab sets the pace this week.` | `На этой неделе темп задаёт восстановление.` |
| RU21-DIA-57 | `Rest with a programme – she came back moving properly.` | `Отдых по программе – вернулась и двигается как надо.` |
| RU21-DIA-58 | `School week – the court waited.` | `Школьная неделя – корт подождал.` |
| RU21-DIA-59 | `Sea, sleep, sun – in that order, every day.` | `Море, сон, солнце – в таком порядке, каждый день.` |
| RU21-DIA-60 | `Seven days of water in every direction, and no telephone worth answering.` | `Семь дней воды во все стороны и ни одного звонка, на который стоило бы ответить.` |
| RU21-DIA-61 | `She called while cooking. Something burned; the story survived.` | `Позвонила, пока готовила. Что-то подгорело – а история уцелела.` |
| RU21-DIA-62 | `She came by for twenty minutes and stayed for dinner.` | `Заехала на двадцать минут и осталась на ужин.` |
| RU21-DIA-63 | `She forgot to call. Then called twice on Sunday.` | `Забыла позвонить. Зато в воскресенье позвонила дважды.` |
| RU21-DIA-64 | `She is running on empty – a rest week would not hurt.` | `Она на исходе сил – неделя отдыха не помешала бы.` |
| RU21-DIA-65 | `She missed the bus and ran for it, laughing.` | `Не успела на автобус и бежала за ним, смеясь.` |
| RU21-DIA-66 | `She seems calm.` | `Кажется, она спокойна.` |
| RU21-DIA-67 | `Still tired from the {0} trip.` | `Всё ещё устала после поездки ({0}).` |
| RU21-DIA-68 | `The Sunday call ran long. Nobody minded.` | `Воскресный звонок затянулся. Никто не возражал.` |
| RU21-DIA-69 | `The family chat got one photo: racquet, coffee, rain.` | `В семейный чат пришла одна фотография: ракетка, кофе, дождь.` |
| RU21-DIA-70 | `The full programme, and it worked – she came back new.` | `Полная программа, и она сработала – вернулась как новая.` |
| RU21-DIA-71 | `The racquet did not come. The tent did.` | `Ракетка не поехала. Палатка поехала.` |
| RU21-DIA-72 | `Training, laundry, sleep, repeat.` | `Тренировки, стирка, сон – и по кругу.` |
| RU21-DIA-73 | `Training, school, repeat.` | `Тренировки, школа – и по кругу.` |
| RU21-DIA-74 | `Training, sleep, repeat.` | `Тренировки, сон – и по кругу.` |
| RU21-DIA-75 | `Two trains and a bus. She slept on both trains.` | `Два поезда и автобус. В обоих поездах она спала.` |
| RU21-DIA-76 | `Warm evenings – dinner ran long on the balcony.` | `Тёплые вечера – ужин на балконе затягивался.` |
| RU21-DIA-77 | `We talk about money after she goes to bed.` | `О деньгах мы говорим, когда она ложится спать.` |
| RU21-DIA-78 | `We talk about money after the call ends.` | `О деньгах мы говорим, когда заканчивается звонок.` |
