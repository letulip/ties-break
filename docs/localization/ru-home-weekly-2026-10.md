---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-04
---

# RU-03 – Home and the weekly story

## 1. Scope and current state

This batch covers the Home hero, identity rail, dashboard cards, season strip, news shell, the
calendar week and the weekly recap. It does not duplicate the large narrative corpora: diary lines,
birthdays and life beats keep their own later batches, while this document translates the frames in
which those lines appear.

All Russian copy below is `DRAFT` unless an owner ruling in the root localization README says
otherwise. Runtime code and tests remain the authority for conditions and values.

## 2. Dates, age and greetings

Home currently builds English date shapes (`W27 2033 · Jun 3 – Jun 9`) and passes already-rendered
strings between the hero and the desktop rail. Russian needs the same facts through a locale-owned
formatter:

| id | English shape | Russian shape | note |
| --- | --- | --- | --- |
| RU03-F01 | `W27 2033` | `Неделя 27 · 2033` | full Home heading; do not expose `W` |
| RU03-F02 | `Jun 3 – Jun 9` | `3–9 июня` | same-month range |
| RU03-F03 | `Jan 27 – Feb 2, 2031` | `27 января – 2 февраля 2031` | cross-month range |
| RU03-F04 | `W14 '31` | `Нед. 14 · ’31` | compact row label only |
| RU03-F05 | `{age} years old {flag}` | `{age} · {flag}` | the flag already separates identity; a bare localized age is enough |

For F05, `{age}` is a formatted phrase such as `14 лет`, `21 год`, `22 года`. Never append `лет` to
a number at the component call site.

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-G01 | `CLOCK_GREETINGS` | `Good morning` | `Доброе утро` |
| RU03-G02 | `CLOCK_GREETINGS` | `Good afternoon` | `Добрый день` |
| RU03-G03 | `CLOCK_GREETINGS` | `Good evening` | `Добрый вечер` |
| RU03-G04 | `CLOCK_GREETINGS` | `Good night` | `Доброй ночи` |

The current collision check removes `Good ` and searches the remaining English time word inside the
photo caption. That cannot survive translation. The greeting and caption need semantic time tags, or
the collision rule must be locale-owned; slicing translated strings is not a localization strategy.

## 3. Hero controls and accessibility

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU03-H01 | `HomeScreen.vue:1412`; `RailIdentity.vue:76` | `Open her profile` | `Открыть её профиль` | same key in both hosts |
| RU03-H02 | `HomeScreen.vue:1444` | `Go to the news feed` | `Перейти к новостям` | the button scrolls within Home |
| RU03-H03 | `HomeScreen.vue:1445` | `News` | `Новости` | tooltip |
| RU03-H04 | `HomeScreen.vue:1460` | `Unread news` | `Есть непрочитанные новости` | description of the dot |
| RU03-H05 | `HomeScreen.vue:1469` | `Open the inbox` | `Открыть входящие` | |
| RU03-H06 | `HomeScreen.vue:1470` | `Inbox` | `Входящие` | glossary term |
| RU03-H07 | `HomeScreen.vue:1485` | `A letter waiting on an answer` | `Во входящих есть письмо, требующее внимания` | also true for a new information-only letter |
| RU03-H08 | `HomeScreen.vue:1488` | `Settings` | `Настройки` | accessible name and tooltip share one key |
| RU03-H09 | `HomeScreen.vue:1500` | `Tap the photo – her page lives here` | `Нажмите на фото – здесь открывается её страница` | one-time discoverability hint |
| RU03-H10 | `HomeScreen.vue:1532`; `RailIdentity.vue:112` | `How ranking points work` | `Как начисляются рейтинговые очки` | button name, not the rank itself |

H07 corrects a source mismatch rather than merely translating it. The dot is shown for either an
open offer or an unopened informational letter, so `ждёт ответа` would be false for part of its live
states. `Требующее внимания` covers both without promising an action.

## 4. Ranking identity

| key | English label | Russian label |
| --- | --- | --- |
| domestic | `National` | `Национальный рейтинг` |
| itf | `International` | `Международный рейтинг` |
| wta | `Professional` | `Профессиональный рейтинг` |
| unranked | `Unranked` | `Без рейтинга` |

The chip should not become `Национальный рейтинг · Рейтинг №…`; its visible composition is the
table label plus `№{n}` or `Без рейтинга`.

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-R01 | domestic chip title | `Her national ranking – Local, Regional and National results. These are the points that open her next tier. Tap to see how they add up.` | `Её национальный рейтинг: результаты местных, региональных и национальных турниров. Эти очки открывают следующий уровень. Нажмите, чтобы увидеть расчёт.` |
| RU03-R02 | international chip title | `Her international ranking – Junior Tour results only. National results do not count towards it. Tap to see how it adds up.` | `Её международный рейтинг: учитываются только результаты юниорского тура. Национальные очки сюда не входят. Нажмите, чтобы увидеть расчёт.` |
| RU03-R03 | professional chip title | `Her professional ranking – W15 and up, the paid tour. Junior points never cross over. Tap to see how it adds up.` | `Её профессиональный рейтинг: W15 и выше, оплачиваемый тур. Юниорские очки сюда не переносятся. Нажмите, чтобы увидеть расчёт.` |

The `#` rank prefix should be reviewed globally in RU-07. For this compact Home chip, `№{n}` is the
natural Russian display candidate; the accessible reading should say `{n}-е место в рейтинге`, with
an ordinal formatter rather than attempting to pronounce the symbol.

## 5. Form and workload

| id | condition | English | Russian |
| --- | --- | --- | --- |
| RU03-C01 | below the lowest entry floor | `Condition {n} percent, below the entry floor` | `Форма: {n} процентов, ниже минимального уровня для заявки` |
| RU03-C02 | near higher floors | `Condition {n} percent, near the higher entry floors` | `Форма: {n} процентов, близко к порогу турниров более высокого уровня` |
| RU03-C03 | fit | `Condition {n} percent, fit` | `Форма: {n} процентов, готова играть` |
| RU03-C04 | tired caution | `Worn out – she needs a rest week` | `Вымоталась – нужна неделя отдыха` |
| RU03-C05 | match streak | `{n} match weeks in a row` | `{duration} подряд с матчами` |

C05 requires an instrumental duration: `одна неделя подряд`, `две недели подряд`, `пять недель
подряд`. The renderer should not reuse an accusative duration from the week-advance control.

## 6. Dashboard cards

### 6.1 Next tournament

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-D01 | eyebrow | `Next tournament` | `Следующий турнир` |
| RU03-D02 | recap dot title | `A new week recap is waiting` | `Готовы новые итоги недели` |
| RU03-D03 | money label | `Travel budget` | `Бюджет поездки` |
| RU03-D04 | college empty state | `No tour entries while the scholarship runs – she plays for the programme.` | `Пока действует стипендия, заявок в тур нет – она играет за университет.` |
| RU03-D05 | ordinary empty state | `Nothing entered yet – the calendar is on the Season tab.` | `Заявок пока нет – календарь на экране «Сезон».` |

The tournament name, surface and dates on this card must arrive localized. Translating only the
eyebrow leaves the largest words on the card in English.

### 6.2 Family budget

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-D06 | eyebrow | `Family budget` | `Семейный бюджет` |
| RU03-D07 | period | `Last 12 weeks` | `Последние 12 недель` |
| RU03-D08 | sparkline aria-label | `The family balance over the last 12 weeks` | `Остаток семейного бюджета за последние 12 недель` |
| RU03-D09 | empty state | `Nothing has moved yet.` | `Операций пока не было.` |

Money continues through the shared formatter. The Russian sentence must not receive a hard-coded
dollar sign separately from the value.

### 6.3 Coach and memory

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-D10 | coach card aria-label | `Coach note – open the Coach Market` | `Заметка тренера. Открыть список тренеров` |
| RU03-D11 | eyebrow | `Coach note` | `Заметка тренера` |
| RU03-D12 | eyebrow | `Recent memory` | `Недавнее воспоминание` |
| RU03-D13 | empty state | `Too early for memories.` | `Воспоминаний пока нет.` |

`Рынок тренеров` sounds transactional in Russian and is not needed in the control name. The
destination remains clear as `список тренеров`; the screen heading itself is handled in RU-05.

## 7. The coach's rotating Home voice

These are compact observations, not motivational copy and not promises about results. They rotate
every four weeks, so each line must stand alone without sounding like a new diagnosis.

### 7.1 Aggressive

| id | English | Russian |
| --- | --- | --- |
| RU03-QA1 | `She hits like it owes her money – now we build the legs to match.` | `Она бьёт так, будто мяч ей задолжал. Теперь подтянем ноги.` |
| RU03-QA2 | `First strike on every point – we just need the misses to come down.` | `С первого удара идёт вперёд – осталось сократить число ошибок.` |
| RU03-QA3 | `When she is on, nobody lives with her. The job is the quiet days.` | `Когда у неё идёт игра, соперницам нечем ответить. Работаем над днями, когда не идёт.` |
| RU03-QA4 | `She wants the short ball so badly – let us make her earn it.` | `Увидит короткий мяч – уже рвётся вперёд. Научим сначала его заработать.` |
| RU03-QA5 | `Big cuts, big heart – footwork turns that into wins.` | `Размах есть, характер есть. Добавим работу ног – придут победы.` |

### 7.2 Counterpuncher

| id | English | Russian |
| --- | --- | --- |
| RU03-QC1 | `She never gives you the same ball twice. Patience is her weapon.` | `Дважды одного мяча от неё не дождёшься. Терпение – её оружие.` |
| RU03-QC2 | `She would rally till dark – now we teach her when to end it.` | `Она готова держать мяч до темноты. Теперь учим понимать, когда пора заканчивать.` |
| RU03-QC3 | `Nothing rushes her. Next she needs a way to hurt you.` | `Её ничто не торопит. Теперь нужен удар, которым она сможет заканчивать розыгрыши.` |
| RU03-QC4 | `Every ball comes back – opponents beat themselves against her.` | `Она возвращает всё – и соперницы начинают ошибаться сами.` |
| RU03-QC5 | `Defense first, always – the finishing shot is next.` | `Сначала защита, всегда. Следующий шаг – завершающий удар.` |

### 7.3 Serve-first

| id | English | Russian |
| --- | --- | --- |
| RU03-QS1 | `That serve is ahead of her age – free points are a career.` | `Для её возраста подача уже впереди. Очки без розыгрыша строят карьеру.` |
| RU03-QS2 | `She holds serve in her sleep – now we break the return open.` | `Свою подачу держит во сне. Теперь строим приём.` |
| RU03-QS3 | `Big first ball, calm eyes. The second serve is the growth area.` | `Мощная первая, спокойный взгляд. Расти теперь должна вторая.` |
| RU03-QS4 | `On serve she fears no one. Rally tennis is the homework.` | `На своей подаче она никого не боится. Розыгрыши – её домашняя работа.` |
| RU03-QS5 | `Aces buy her time – we spend it teaching the rest of the court.` | `Эйсы дают ей время – потратим его на остальную игру.` |

### 7.4 All-court

| id | English | Russian |
| --- | --- | --- |
| RU03-QU1 | `No holes in her game. Now we find the weapon.` | `Дыр в игре нет. Теперь ищем оружие.` |
| RU03-QU2 | `She can play every style – picking one under pressure is the skill.` | `Она умеет играть по-разному. Выбрать свой теннис под давлением – отдельное умение.` |
| RU03-QU3 | `Comfortable everywhere, dangerous nowhere yet. That changes this year.` | `Уверенно играет везде, но пока нигде не опасна. В этом году изменим.` |
| RU03-QU4 | `She reads the game beautifully – now the hands must catch up.` | `Она прекрасно читает игру. Теперь руки должны успевать за головой.` |
| RU03-QU5 | `Versatile and calm. We are hunting for the shot that ends points.` | `Спокойная и разносторонняя. Ищем удар, который будет заканчивать розыгрыши.` |

## 8. Season strip

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-S01 | eyebrow | `Season` | `Сезон` |
| RU03-S02 | group label | `Season ladder` | `Лестница турниров` |
| RU03-S03 | cap summary | `Used {used} of {limit}` | `Использовано: {used} из {limit}` |
| RU03-S04 | unlocked action | `Enter your first!` | `Подать первую заявку` |
| RU03-S05 | reached a11y | `{tier}: reached, best finish {finish}` | `{tier}: уровень достигнут, лучший результат – {finish}` |
| RU03-S06 | outgrown a11y | `{tier}: outgrown – {detail}` | `{tier}: возрастной уровень пройден – {detail}` |
| RU03-S07 | locked a11y | `{tier}: locked – {detail}` | `{tier}: пока недоступен – {detail}` |
| RU03-S08 | waiting a11y | `{tier}: open – {detail}` | `{tier}: доступен – {detail}` |
| RU03-S09 | gap control | `Show {n} more levels` | `Показать ещё {countedLevels}` |
| RU03-S10 | gap description | `{n} levels hidden ({from} to {to}) – tap to show the whole ladder` | `Скрыто: {countedLevels}, от {from} до {to}. Нажмите, чтобы показать всю лестницу.` |
| RU03-S11 | collapse name | `Show only her current levels` | `Показать только актуальные уровни` |
| RU03-S12 | collapse title | `Back to her current window` | `Вернуться к актуальному диапазону` |

Finish abbreviations should follow Russian tournament notation: `П` is too ambiguous for a title,
so visible chips should keep the internationally legible `W`, `F`, `SF`, `QF`, `R16` until RU-07
reviews the same abbreviations across Stats and trophies. Accessible names must expand them in
Russian (`победа`, `финал`, `полуфинал`, `четвертьфинал`, `одна восьмая финала`).

## 9. News frame and match rows

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU03-N01 | eyebrow | `News` | `Новости` | |
| RU03-N02 | empty state | `No news yet.` | `Новостей пока нет.` | |
| RU03-N03 | table name | `News – {week}` | `Новости · {week}` | avoids a spoken dash chain |
| RU03-N04 | visible match separator | `vs` | `–` | same rule as the prologue flow |
| RU03-N05 | friendly chip | `practice` | `тренировка` | this flag denotes a practice match |
| RU03-N06 | replay cue | `Watch` | `Смотреть` | opens replay |

The visible row may use `Имя – Имя`; its accessible name must say `{player} против {opponent},
{score}`. The event body `e.text` is already-rendered English stored in saves. RU-03 cannot solve it
at the template: the semantic-event migration and all event writers are inventoried in RU-11.

## 10. College controls that live on Home

The college story itself belongs to RU-12, but these controls render in Home and cannot remain as
English islands while that content is active.

| id | English | Russian |
| --- | --- | --- |
| RU03-K01 | `Play {fixture}` | `Играть: {localizedFixture}` |
| RU03-K02 | `Play {fixture}` | `Играть: {localizedFixture}` |
| RU03-K03 | `Finish the year` | `Закончить учебный год` |
| RU03-K04 | `Play the first year` | `Начать первый год` |
| RU03-K05 | `Play the final year` | `Начать последний год` |
| RU03-K06 | `Another year` | `Следующий год` |
| RU03-K07 | `Back on tour now` | `Вернуться в тур` |

`Год` here means a college year, so K03 says `учебный год` where ambiguity matters. K04–K06 sit on
the college card and can remain shorter.

## 11. Home implementation notes

1. Home and `RailIdentity` duplicate several English `aria-label` literals. They should share
   semantic catalogue keys just as they already share the computed identity data.
2. Date helpers currently return finished English strings. Preserve week arithmetic, but split
   facts from locale rendering; do not parse `Jun` or `W27` in Vue.
3. The greeting collision rule is English-specific string surgery. Replace it with semantic tags or
   a localized rule before enabling Russian.
4. The inbox dot's current English accessible text is narrower than the condition that displays it.
   Fix the semantic source for every locale rather than deliberately preserving the mismatch.
5. `e.text` prevents a complete Russian news feed for saved careers. A Russian Home cannot ship
   until RU-11's semantic event representation covers old and new events.
6. Tournament labels, surfaces, coach short reads and memory lines are upstream player copy. Home
   must consume localized values, not translate opaque finished strings locally.
7. The four coach pools should move out of the SFC with their semantic play-style keys. Localization
   is a second demonstrated use of that boundary; no broader narrative abstraction is needed.
8. LQA cases: 375 × 667; 200% text; `Профессиональный рейтинг`; negative five-digit funds; long
   tournament name; five season chips; eight hidden levels; longest coach line; news and inbox dots.

## 12. Calendar frame

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-CA01 | heading | `Calendar` | `Календарь` |
| RU03-CA02 | injury chip | `injury` | `травма` |
| RU03-CA03 | grid group | `The seven days of {dateLine}` | `Семь дней: {dateLine}` |
| RU03-CA04 | paper label | `Notes` | `Заметки` |
| RU03-CA05 | look-ahead heading | `Weeks after that` | `Следующие недели` |
| RU03-CA06 | marker accessible suffix | `{note}, {label}, {dates} – open this tournament` | `открыть турнир` |
| RU03-CA07 | entered chip | `Entered` | `Заявлена` |
| RU03-CA08 | look-ahead footnote | `Only tournaments she can enter are marked here – the whole calendar, and every booking, live on the Season tab.` | `Здесь отмечены только турниры, на которые она может заявиться. Полный календарь и все заявки – на экране «Сезон».` |
| RU03-CA09 | sweep hint | `Tap anywhere to skip` | `Нажмите в любом месте, чтобы пропустить` |

The look-ahead marker name is assembled from event label, week and dates. All three parts must be
localized before composition; punctuation belongs to the localized template.

## 13. Days and day kinds

| index | short | long |
| ---: | --- | --- |
| 0 | `ПН` | `Понедельник` |
| 1 | `ВТ` | `Вторник` |
| 2 | `СР` | `Среда` |
| 3 | `ЧТ` | `Четверг` |
| 4 | `ПТ` | `Пятница` |
| 5 | `СБ` | `Суббота` |
| 6 | `ВС` | `Воскресенье` |

| kind | English accessible phrase | Russian accessible phrase |
| --- | --- | --- |
| court | `on court` | `на корте` |
| gym | `in the gym` | `в зале` |
| rest | `rest day` | `день отдыха` |
| match | `practice match` | `тренировочный матч` |
| away | `away at the tournament` | `на выезде, на турнире` |
| off | `no tennis` | `без тенниса` |
| school | `school exams` | `школьные экзамены` |
| rehab | `rehab` | `восстановление` |
| shoot | `at the shoot` | `на съёмке` |

The full accessible template is `{day} – {kind}`, for example `Среда – в зале`. Visible short day
names remain two letters and must be checked with the existing seven-column phone grid.

## 14. Calendar week identities and readouts

| id | condition | English | Russian |
| --- | --- | --- | --- |
| RU03-CW01 | layoff title | `On the bench` | `Вне игры` |
| RU03-CW02 | layoff, no return | `She is out – no training this week.` | `Она вне игры – на этой неделе тренировок не будет.` |
| RU03-CW03 | layoff with return | `Out with the {injury} – back {week}.` | `Из-за травмы она не играет – вернётся {week}.` |
| RU03-CW04 | trip title | `Tournament week` | `Турнирная неделя` |
| RU03-CW05 | named trip | `She is away at {event} – the draw owns the week.` | `{event}: она уехала на турнир, и всю неделю решает сетка.` |
| RU03-CW06 | unnamed trip | `She is away at a tournament – the draw owns the week.` | `Она уехала на турнир – всю неделю решает сетка.` |
| RU03-CW07 | vacation title | `Family week` | `Неделя с семьёй` |
| RU03-CW08 | vacation fallback | `{label} – no tennis at all this week.` | `{label}. На этой неделе тенниса не будет.` |
| RU03-CW09 | off-season title | `Off-season` | `Межсезонье` |
| RU03-CW10 | off-season readout | `The tour is closed – this is the block where next year gets built.` | `Тур закрыт – в эти недели строится следующий сезон.` |
| RU03-CW11 | exam title | `Exams` | `Экзамены` |
| RU03-CW12 | exams, no sessions | `Exams this week – no tournaments, and no sessions booked either.` | `На этой неделе экзамены: без турниров и без запланированных тренировок.` |
| RU03-CW13 | exams with sessions | `Exams this week – no tournaments, but her {n} sessions stand.` | `На этой неделе экзамены: турниров нет, но {sessions} остаются в расписании.` |
| RU03-CW14 | shoot title | `Shooting week` | `Неделя съёмок` |
| RU03-CW15 | summer title | `Summer block` | `Летний блок` |
| RU03-CW16 | ordinary title | `Training week` | `Неделя тренировок` |

CW03 avoids inflecting an English body-part label that the current protocol cannot supply in the
required genitive. Specificity can return when RU-05 gives body parts locale-owned cases. CW05 puts
the event name before a colon so a tournament title needs no prepositional form.

### 14.1 Training readout templates

| id | English | Russian |
| --- | --- | --- |
| RU03-CR01 | `No sessions – a full week off court.` | `Тренировок нет – целая неделя вне корта.` |
| RU03-CR02 | `{sessions} sessions over {days} days – {doubled} of them two sessions a day.` | `{sessions} за {days}; в {doubledDays} – по две тренировки.` |
| RU03-CR03 | `{sessions} sessions, one a day – no school, so there is room to double up.` | `{sessions}, по одной в день. Школы нет – можно поставить по две.` |
| RU03-CR04 | `{sessions} sessions, all of them on court.` | `{sessions}, все на корте.` |
| RU03-CR05 | `{sessions} sessions – {court} on court, {gym} in the gym.` | `{sessions}: {courtSessions} на корте, {gymSessions} в зале.` |
| RU03-CR06 | `Practice match on {day}.` | `Тренировочный матч – {dayAccusative}.` |
| RU03-CR07 | `She is training on a sore {part}.` | `Она тренируется, несмотря на ушиб.` |
| RU03-CR08 | one-day shoot | `{brand} shoot on {day}.` | `Съёмка для {brand} – {dayAccusative}.` |
| RU03-CR09 | multi-day shoot | `{brand} shoot takes {n} of her free days.` | `Съёмка для {brand} займёт {freeDays}.` |
| RU03-CR10 | masseur | `Masseur in {n} day(s) of the week.` | `Массажист придёт в {sessionDays}.` |
| RU03-CR11 | rested knock | `Resting the {part} – off the training court all week.` | `Из-за ушиба она всю неделю отдыхает от тренировок.` |
| RU03-CR12 | booked match survives | `The booked match on {day} still stands.` | `Запланированный матч в {dayAccusative} остаётся.` |

Every placeholder ending in `Sessions`, `Days` or `dayAccusative` is a complete, correctly declined
phrase. Required examples include `1 тренировка`, `2 тренировки`, `5 тренировок`; `за 1 день`, `за
2 дня`, `за 5 дней`; `в понедельник`, `во вторник`, `в воскресенье`. Concatenating translated nouns
to raw integers will fail here in several different cases.

## 15. Schedule-block lexicon

`weekGrid.ts` contains a finite set of compact labels. The following table covers every unique
literal currently found in its block definitions; repeated English labels share one key.

| English | Russian | English | Russian |
| --- | --- | --- | --- |
| Aboard | На борту | Ashore | На берегу |
| Body work | Массаж | Call | Созвон |
| Camp day | День в лагере | Cardio | Кардио |
| Check-up | Осмотр | Court hit | Разминка на корте |
| Court work | Корт | Day off | Выходной |
| Day out | День вне дома | Draw day | Матчи |
| Early hit | Ранняя тренировка | Exam | Экзамен |
| Family time | Время с семьёй | Final review | Итоговый осмотр |
| Flight home | Перелёт домой | Flight out | Перелёт туда |
| Free time | Свободное время | Gym | Зал |
| Her pals | С друзьями | Home day | День дома |
| Home | Домой | Last day | Последний день |
| Last one | Последний приём | Last swim | Последнее купание |
| Lie-in | Выспаться | Long lunch | Долгий обед |
| Long way home | Долгая дорога домой | Match play | Игровая тренировка |
| Moving | Лёгкая нагрузка | No plans | Без планов |
| Out all day | Весь день вне дома | Physio | Физиотерапия |
| Pool | Бассейн | Pre-season | Предсезонная подготовка |
| Press | Пресса | Rest day | День отдыха |
| Rest | Отдых | Road-trip home | Дорога домой |
| Road-trip out | Дорога туда | Rub-down | Массаж |
| School | Школа | Shoot | Съёмка |
| Slow day | Спокойный день | Study | Учёба |
| Swim | Купание | Tennis drills | Теннисная тренировка |
| Tests | Обследования | The garden | Сад |
| The lake | Озеро | The pool | Бассейн |
| The river | Река | The sea | Море |
| Travel home | Дорога домой | Travel out | Дорога туда |
| Two trains | Два поезда | Walk | Прогулка |

The runtime also draws rotating tennis and gym session labels (`Serve work`, `Return work`, `Rally
work`, `Point play`, `Speed work`, `Volley work`, `Net play`, `Core work`, `Leg work`, `Gym drills`).
Their Russian set is: `Подача`, `Приём`, `Розыгрыши`, `Игра на счёт`, `Скорость`, `Удары с лёта`,
`Игра у сетки`, `Корпус`, `Ноги`, `Упражнения в зале`. Short labels matter here: the grid column is
only one seventh of a phone.

## 16. Look-ahead rows

| id | English | Russian |
| --- | --- | --- |
| RU03-L01 | `Practice match` | `Тренировочный матч` |
| RU03-L02 | `Practice match + coach` | `Тренировочный матч + тренер` |
| RU03-L03 | `Leaves for college` | `Уезжает учиться в университет` |
| RU03-L04 | `{brand} shoot` | `Съёмка для {brand}` |
| RU03-L05 | `Exams` | `Экзамены` |
| RU03-L06 | `Off-season` | `Межсезонье` |
| RU03-L07 | `Training week` | `Неделя тренировок` |

Vacation package names and blurbs are source data, not Calendar chrome. They must be localized with
the package catalogue in RU-06; the Calendar must not receive an English finished label.

## 17. Tournament marker takeover

These rows cross-reference RU-04, which will own the shared event-card wording. They are recorded
here because the Calendar renders a complete copy of that card.

| id | English | Russian |
| --- | --- | --- |
| RU03-M01 | `Close this tournament` | `Закрыть турнир` |
| RU03-M02 | `Close` | `Закрыть` |
| RU03-M03 | `Travel budget` | `Бюджет поездки` |
| RU03-M04 | `academy covers {n}%` | `академия оплачивает {n} %` |
| RU03-M05 | `closes {week}` | `заявки до {week}` |
| RU03-M06 | `Entered` | `Заявлена` |
| RU03-M07 | `wild card` | `уайлд-кард` |
| RU03-M08 | wild-card tooltip | `One of the {0} places this tournament holds for players of the host nation – she is outside the acceptance list.` | `Одно из {places}, которые турнир оставляет игрокам страны-хозяйки: в обычный список участниц она не проходит.` |
| RU03-M09 | `First round vs {opponent}` | `Первый круг: {opponent}` |
| RU03-M10 | exhaustion fallback | `Exhausted – racing risks injury.` | `Вымоталась – плотный график повышает риск травмы.` |
| RU03-M11 | entered state | `She is in. Withdrawing lives on the Season tab.` | `Она заявлена. Сняться можно на экране «Сезон».` |
| RU03-M12 | `Enter` | `Подать заявку` |
| RU03-M13 | `Not enough funds` | `Недостаточно средств` |

M09 does not use `против`: the opponent is the value after a round label, so a colon is shorter and
more natural. Match rows still use an accessible `{name} против {name}` sentence.

## 18. Calendar implementation notes

1. `DAY_SHORT`, `DAY_LONG`, `KIND_WORD`, week titles, readouts and every grid-block label are
   finished English strings. The localized projection needs semantic day/block keys; passing a
   translated label into simulation state is unnecessary and would make locale affect snapshots.
2. Russian weekday insertion needs case. `on Monday` cannot be built from the visible nominative
   `Понедельник`; pass a day index to the catalogue and render `в понедельник`.
3. Training readouts need several plural and case forms in one sentence. Treat them as full ICU-like
   messages, not fragments joined in `trainingReadout`.
4. The injury-specific calendar sentence currently interpolates `injury.kind`. Until body parts
   carry Russian cases, use the honest generic RU03-CW03 instead of producing malformed text.
5. The fridge-note corpora are deliberately deferred to RU-09, where roof/away stage and bond-band
   voice can be reviewed together. The frame label `Заметки` is complete here; no Russian build may
   expose the English note pool while waiting for RU-09.
6. Event-card fields and surface verdicts are shared with Season. RU-04 must provide one localized
   source rather than let Calendar and Season translate the same card independently.
7. LQA must include all seven columns at 320 and 375 px, the longest block labels, 200% text, a
   cross-month week, five-week injury, academy percentage, and both pre-draw probability states.

## 19. This Week frame

The screen has two distinct arrivals: the ordinary weekly story and the tournament-only preview.
The shared date heading uses RU03-F01–F03. The tournament card itself remains owned by RU-04.

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-W01 | tournament-only back control | `Back to Home` | `Домой` |
| RU03-W02 | recap close name and tooltip | `Close the week's story` | `Закрыть итоги недели` |
| RU03-W03 | section heading | `This week` | `Эта неделя` |
| RU03-W04 | empty status | `No event – training week` | `Без турнира – неделя тренировок` |
| RU03-W05 | played-score prefix | `Latest match: {score}` | `Последний матч: {score}` |
| RU03-W06 | plan heading and group name | `Training plan` | `План тренировок` |
| RU03-W07 | `grind` preset | `Grind 85/15` | `Интенсивно 85/15` |
| RU03-W08 | `balanced` preset | `Balanced 75/25` | `Баланс 75/25` |
| RU03-W09 | `light` preset | `Light 60/40` | `Легко 60/40` |
| RU03-W10 | plan summary | `Training {train}% · Rest {rest}%` | `Тренировки {train} % · Отдых {rest} %` |
| RU03-W11 | spend label | `Planned spend` | `Плановые расходы` |
| RU03-W12 | story exit | `Proceed to Home` | `Домой` |

W01 and W12 intentionally collapse to the same Russian word. Their icons and placement already
distinguish back-navigation from finishing the story; `Продолжить на экран «Дом»` would explain the
component rather than speak like the interface. W07–W09 are the shared Russian preset vocabulary
for RU-05 too; the percentages make the compact adverbs unambiguous.

The status pill interpolates a tournament label, surface and week. All three must already be
localized. W10 may append `· {event} – {week}` without changing the event title. W11 currently
formats its range as raw dollars in the component. It must move through the locale-aware money
formatter before Russian ships; neither the currency sign nor its position belongs in this view.

## 20. Weekly Story – scene and frame

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-RC01 | section aria-label | `Week story, {week}` | `Итоги недели · {week}` |
| RU03-RC02 | travel mood `sleepy` | `Asleep` | `Спит` |
| RU03-RC03 | travel mood `happy` | `Smiling` | `Улыбается` |
| RU03-RC04 | travel mood `sad` | `Quiet` | `Притихла` |
| RU03-RC05 | travel scene `airport` | `in the airport on the way home` | `в аэропорту по дороге домой` |
| RU03-RC06 | travel scene `plane` | `on the plane home` | `в самолёте по дороге домой` |
| RU03-RC07 | travel scene `bus` | `on the bus home` | `в автобусе по дороге домой` |
| RU03-RC08 | travel scene `car` | `in the car on the way home` | `в машине по дороге домой` |
| RU03-RC09 | vacation alt | `The family week away – {package}` | `Семейная поездка – {package}` |
| RU03-RC10 | rehab alt | `On the bench, working her way back` | `На скамейке, шаг за шагом возвращается в игру` |
| RU03-RC11 | exam alt | `Revising at home – exams this week` | `Готовится к экзаменам дома` |
| RU03-RC12 | knock alt | `At home, off the court for the week` | `Дома, всю неделю вне корта` |

The travel alt is composed as `{mood} {scene}`: `Спит в самолёте по дороге домой`, `Притихла в
машине по дороге домой`. These are descriptions of the image, not diary prose. The generic week
paintings remain decorative with an empty alt because the handwritten note immediately below tells
their story. Vacation package names are localized once in RU-06 and inserted unchanged.

The handwritten `noteText` and the optional `coachNote` are not frame copy. They arrive as finished
engine prose and belong to RU-09. The expense fallback also arrives as `WorldEvent.text` and belongs
to RU-11. Russian mode must select a localized semantic message before applying the current
travel-note → week-note → expense fallback order; translating only the card headings is not enough.

## 21. Weekly Story – finances

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-RF01 | tile eyebrow | `Finances` | `Финансы` |
| RU03-RF02 | tournament cheque | `Income` | `Призовые` |
| RU03-RF03 | other family income | `Family income` | `Доход семьи` |
| RU03-RF04 | outgoing total | `Spent` | `Расходы` |
| RU03-RF05 | net result | `Balance` | `Итог` |
| RU03-RF06 | daughter's share memo | `Her cut {pct}% – {amount} into her own account.` | `Её доля {pct} % – {amount} на её личный счёт.` |
| RU03-RF07 | legacy-save foot | `The income above is what the family kept.` | `Выше указан доход, оставшийся семье.` |
| RU03-RF08 | coach share memo | `Coach's cut {pct}% – {amount}, inside Spent above.` | `Доля тренера {pct} % – {amount}; она уже входит в расходы выше.` |

`Призовые` is deliberately more specific than a literal `Доход`: the row is
`prizeIncomeCents`, while all other positive money is the next row. The four visible figures retain
their current arithmetic: `Призовые + Доход семьи − Расходы = Итог`. The daughter's and coach's
shares remain explanatory memos, not extra arithmetic rows.

Money signs and separators come only from the shared Russian money formatter. The memo messages
take a formatted `{amount}` and an integer `{pct}`; they must not rebuild either from strings.

## 22. Weekly Story – training and mood

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-RT01 | tile eyebrow | `Training` | `Тренировки` |
| RU03-RT02 | plan row and dot tooltip | `On court` / `Training` | `На корте` / `Тренировка` |
| RU03-RT03 | plan row and dot tooltip | `Rest` | `Отдых` |
| RU03-RT04 | day-row aria-label | `{n} of 7 days training` | `Тренировки: {trainingDays} из 7 дней` |
| RU03-RM01 | tile eyebrow | `Mood` | `Настроение` |
| RU03-RM02 | energy label | `Energy` | `Силы` |

The day initials use the same `ПН ВТ СР ЧТ ПТ СБ ВС` set as Calendar, not a second one-letter
Russian table. RT04 is a complete message, so it needs no pluralized noun beside the number.

The portrait's fallback words are compact states rather than diagnoses:

| emotion | English | Russian |
| --- | --- | --- |
| norm | `Steady` | `Ровная` |
| happy | `Happy` | `Радостная` |
| sad | `Low` | `Не в духе` |
| serious | `Focused` | `Собранная` |
| tired | `Tired` | `Уставшая` |
| injury | `Hurt` | `Травмирована` |
| rehab | `On the mend` | `Восстанавливается` |
| angry | `Frustrated` | `Раздражена` |

On life-beat weeks, `diary.facts.moodWord` overrides this table with one of the five authored Mood
words. Those words are voice corpus, not UI enum labels, and are translated in RU-09. The component
must receive a mood semantic key rather than assume that an English override is safe to display.

`trainingRead.label` and `trainingRead.text` are likewise finished engine strings. RU-05 owns the
radar-axis labels and coach readings; the recap should receive their localized projection without
duplicating a translation table in this card.

## 23. Weekly Story – highlights, replay and goal

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU03-RH01 | tile eyebrow | `Highlights` | `Главное` |
| RU03-RH02 | empty state | `A quiet week.` | `Спокойная неделя.` |
| RU03-RH03 | rank rose | `{ladder} rank up {n} – now #{rank}` | `{ladder}: поднялась на {places}; теперь №{rank}` |
| RU03-RH04 | rank fell | `{ladder} rank down {n} – now #{rank}` | `{ladder}: опустилась на {places}; теперь №{rank}` |
| RU03-RH05 | practice-match note | `She played her practice match` | `Она сыграла тренировочный матч` |
| RU03-RH06 | replay control | `Watch the replay` | `Смотреть повтор` |
| RU03-RH07 | goal label | `Next goal` | `Следующая цель` |
| RU03-RH08 | first rung | `Win one match at the {event}` | `Выиграть один матч на турнире «{event}»` |
| RU03-RH09 | title rung | `Win the {event}` | `Выиграть турнир «{event}»` |
| RU03-RH10 | round rung | `Reach the {round} at the {event}` | `Дойти до {roundGenitive} на турнире «{event}»` |
| RU03-RH11 | skill rung | `Work on her {axis}` | `Поработать над {axisInstrumental}` |

`{places}` is a counted phrase: `1 место`, `2 места`, `5 мест`. `{roundGenitive}` is a localized
case-bearing phrase such as `четвертьфинала`, `полуфинала` or `финала`; `{axisInstrumental}` is
`подачей`, `приёмом`, `игрой у сетки`, and so on. Neither can be produced by lowercasing a Russian
display label, which is what the English helper currently does.

The highlight list is built from stored `WorldEvent.text`; the rank movement line and every goal
sentence are also rendered as English before the template sees them. RU-11 must make event
highlights semantic and RU-04/RU-05 must expose localized tier, round and radar-axis terms. The goal
helper should return `{kind, eventOrTier, finishOrAxis}` and let the locale render RH08–RH11. This
keeps progression arithmetic in `nextGoalFor` while removing English grammar from it.

## 24. RU-03 implementation boundary and LQA

1. Keep the current screen composition and decision logic. This batch changes wording and the data
   boundary, not recap visibility, arithmetic, training plans or tournament entry behavior.
2. `weekDateLine`, `weekLabel`, tournament labels, surfaces, money and ranks must be locale-owned
   formatters or semantic values. Do not parse their English output in Vue.
3. Replace local English composition in `financeRows`, `rankMoveLine`, `artAlt`, `moodWord` and the
   next-goal helper with message keys plus typed arguments. A single reusable message catalogue is
   sufficient; no narrative framework is required.
4. Preserve the existing deterministic selection and saved event history. Localization selects a
   representation of an already-decided fact; it must not consume RNG or change the snapshot.
5. Old saves need a Russian visible projection for retained events. Keeping legacy English text in
   the save is compatible; showing it as the Russian fallback is not.
6. LQA cases: both This Week arrivals; recap present and dismissed; 320/375 px; 200% text; zero and
   five-digit finance values; daughter and coach share memos; each scene kind; all eight emotions;
   one through six training days; rank up/down with 1/2/5 places; practice replay; every goal arm;
   English-origin legacy save with an ordinary expense and a match highlight.

## 25. Batch status

RU-03 is drafted end to end: Home, identity, dashboard cards, season strip, news, Calendar, This
Week and the weekly recap. Diary corpora, event prose and shared tournament content are explicitly
routed to RU-09, RU-11 and RU-04 rather than silently treated as translated.

The next editorial batch is RU-04: Season planner, tournament cards, eligibility and the complete
tournament flow.
