---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-04
---

# RU-05 – Profile, development, coaching and injuries

## 1. Scope and terminology decision

This batch owns the daughter's profile, life-stage tiles, skills radar and its observations, coach
market, weekly training plan, knocks and injury stop. All Russian copy is `DRAFT`; simulation facts,
eligibility, prices, skill fog, recovery time and deterministic corpus selection remain unchanged.

In this game `college` means an American-style university programme that can offer an athletic
scholarship, not a Russian secondary vocational college. Its Russian product term is therefore
**`Университет`**. `College League` is **`Студенческая лига`** and `student field` is
**`студенческий турнир`**. RU-03's draft `Уезжает в колледж` should be corrected to
`Уезжает учиться в университет` when that batch is next touched.

## 2. Profile hero and core tiles

| id | source meaning | English | Russian |
| --- | --- | --- | --- |
| RU05-P01 | back aria | `Back to Home` | `Вернуться на экран «Дом»` |
| RU05-P02 | settings aria/title | `Settings` | `Настройки` |
| RU05-P03 | age and birthday | `{n} years old · B-Day {date}` | `{age} · День рождения: {date}` |
| RU05-P04 | `Personality` | `Personality` | `Характер` |
| RU05-P05 | `Condition` | `Condition` | `Форма` |
| RU05-P06 | condition aria | `Condition: {n} percent` | `Форма: {n} процентов` |
| RU05-P07 | `Mood` | `Mood` | `Настроение` |
| RU05-P08 | `Friends` | `Friends` | `Друзья` |
| RU05-P09 | `Coach` | `Coach` | `Тренер` |
| RU05-P10 | coach door aria | `Coach – open the Coach Market` | `Тренер – открыть рынок тренеров` |
| RU05-P11 | self-coach name | `You` | `Вы` |
| RU05-P12 | self-coach tier | `Self-coached` | `Тренирует семья` |

`{age}` is the shared counted form (`17 лет`, `21 год`); `{date}` is `12 июня`, with a lowercase
month and no year. `Тренирует семья` describes the mechanic better than the bureaucratic
`Самостоятельная подготовка`: the player is the parent, not the athlete pretending to coach herself.

The compact play-style note reuses RU-02A exactly:

| semantic value | Russian |
| --- | --- |
| aggressive | `Атакующая игра с задней линии` |
| counterpuncher | `Контратакующая игра` |
| serve-first | `Мощная подача` |
| all-court | `Игра по всему корту` |

The Russian phrases are longer than the current 104 px paper note. They may wrap at semantic spaces;
do not insert a soft hyphen or create shorter synonyms only for this screen. Phone LQA decides
whether the note needs more width or a smaller maximum font size.

## 3. Mood words

These are compact descriptions of how she is now, not labels for her personality:

| emotion | English | Russian |
| --- | --- | --- |
| norm | `Steady` | `Спокойна` |
| happy | `Happy` | `Радуется` |
| sad | `Low` | `Не в духе` |
| serious | `Focused` | `Сосредоточена` |
| tired | `Tired` | `Устала` |
| injury | `Hurt` | `Травмирована` |
| rehab | `On the mend` | `Восстанавливается` |
| angry | `Angry` | `Злится` |

The private-life channel may override these with `diary.facts.moodWord`; those five lines belong to
RU-09. The fallback and the override must both return message ids, or a Russian profile can still
receive an English mood from the worker.

## 4. Character line

The line composes one slowly changing composure word with one stable birth-voice word. Russian
adjectives agree with the daughter and use `и` exactly once.

| source family | English | Russian |
| --- | --- | --- |
| composure 75+ | `Unshakeable` | `Невозмутимая` |
| composure 60+ | `Patient` | `Терпеливая` |
| composure 45+ | `Impatient` | `Нетерпеливая` |
| composure below 45 | `Hot-headed` | `Вспыльчивая` |
| fiery | `stubborn` | `упрямая` |
| deep | `single-minded` | `целеустремлённая` |
| quiet | `self-contained` | `сдержанная` |
| sunny | `easy-going` | `лёгкая в общении` |

Examples: `Невозмутимая и целеустремлённая`; `Вспыльчивая и лёгкая в общении`. The sixteen
combinations remain compositional and deterministic. `Самодостаточная` is intentionally avoided for
quiet: it would imply the adult independence mechanic while she may still be at school.

## 5. School and the years after it

### 5.1 Headings

| stage | English | Russian |
| --- | --- | --- |
| school | `School` | `Школа` |
| college | `College` | `Университет` |
| after | `After school` | `После школы` |

The heading follows the same semantic stage as the tile. It must not be inferred from the translated
lead text.

### 5.2 School tile

| English | Russian |
| --- | --- |
| `{ordinal} grade` | `{grade}-й класс` |
| `Exams this week` | `На этой неделе экзамены` |
| `Summer break` | `Летние каникулы` |
| `Oldest in class` | `Одна из старших` |
| `Older than most` | `Старше большинства` |
| `Young in class` | `Одна из младших` |
| `Youngest of all` | `Самая младшая` |

The explanatory September line becomes:

> `Учебный год начинается 1 сентября, а её день рождения позже. Поэтому последний школьный год заканчивается летом после восемнадцатилетия – на год позже, чем у девочек, родившихся раньше в том же теннисном году.`

The screen prefix is `Школа – `. This sentence is only licensed for September–December birthdays
while she is still enrolled, exactly as in the current engine.

### 5.3 University and independent-life ladder

| state | English lead | Russian lead | English note | Russian note |
| --- | --- | --- | --- | --- |
| studying | `Year {y} of {total}` | `{course}-й курс из {total}` | `Student tennis` | `Студенческий теннис` |
| final year | `Year {y} of {total}` | `{course}-й курс из {total}` | `Final year` | `Выпускной курс` |
| completed | `Graduate` | `Выпускница` | `{n} years done` | `{years} учёбы` |
| left early | `Left college` | `Ушла из университета` | `{done} of {total} years` | `{done} курса из {total}` |
| first year out | `The last bell` | `Последний звонок` | `12 years done` | `Школа окончена` |
| ages 19–21 | `Tennis full-time` | `Только теннис` | `No more classes` | `Больше никаких уроков` |
| 22+ | `Grown up` | `Взрослая` | `Her own life now` | `Теперь у неё своя жизнь` |

`{course}` and `{years}` are grammatical values, not bare digits. If the fixed programme remains
four years, visible values are `1-й курс из 4`, `4 года учёбы`, `1 курс из 4`, `2 курса из 4`.

University place names:

| English | Russian |
| --- | --- |
| `The university at home` | `Местный университет` |
| `A university away from home` | `Университет вдали от дома` |
| `A private university` | `Частный университет` |
| legacy unknown | `Университет, который она выбрала` |

The note under the grid uses these full patterns:

- studying: `{place}: {course}-й курс из {total}.`
- completed: `{place}: отучилась все {years} и окончила программу.`
- left early: `{place}: проучилась {yearsDone} из {total} и ушла до окончания.`

The prefix is `Университет – `. `Окончила программу` keeps the known fact; it does not invent a
degree classification or graduation ceremony the simulation does not hold.

## 6. Friends tile

Static friend names are localized data in Russian mode:

`Эмма`, `Миа`, `София`, `Нина`, `Лена`, `Зои`, `Ирис`, `Майя`, `Нур`, `Юки`, `Альба`, `Инес`,
`Сара`, `Элиф`, `Хана`, `Аида`.

The annual lead shapes are `Дружит с {nameInstrumental}` and `{name} всегда рядом`. The first shape
needs an explicit instrumental form in localized name data (`Эммой`, `Софией`, `Майей`); appending
`-ой` at the call site is not sufficient.

| English pool line | Russian |
| --- | --- |
| `She visits a lot` | `Она часто заходит` |
| `Comes by daily` | `Приходит каждый день` |
| `Homework here` | `Делают уроки у нас` |
| `Home all month` | `Весь месяц дома` |
| `Sleepovers now` | `Теперь остаётся ночевать` |
| `They revise` | `Готовятся вместе` |
| `Studying, both` | `Обе за учебниками` |
| `Mostly by phone` | `В основном созваниваются` |
| `Voice notes now` | `Теперь голосовыми` |
| `Away too much` | `Слишком много разъездов` |
| `Missing a lot` | `Сильно скучают` |
| `Good support` | `Здорово её поддерживает` |
| `Texts every day` | `Пишет каждый день` |
| `Still close` | `Всё так же близки` |
| `Over most days` | `У нас почти каждый день` |
| `Over after class` | `Заходит после уроков` |
| `Same as ever` | `Всё как всегда` |
| `Two of a pair` | `Всегда вдвоём` |
| `She just listens` | `Просто слушает` |
| `Takes her side` | `Всегда на её стороне` |
| `Proud of her` | `Гордится ею` |
| `Watched it live` | `Смотрела матч вживую` |

Pool membership and deterministic indices stay exactly where they are. A locale selects the string
at the chosen corpus id; it never makes a fresh random draw.

## 7. Important moments

| English | Russian |
| --- | --- |
| `Career start` | `Начало карьеры` |
| `Today` | `Сегодня` |
| `First title` | `Первый титул` |
| `First {tier} title` | `Первый титул {tier}` |
| `First final` | `Первый финал` |
| `First {tier} final` | `Первый финал {tier}` |
| `First prize money` | `Первые призовые` |
| `First trip abroad` | `Первая поездка за границу` |
| section heading `Important moments` | `Важные моменты` |

Tier codes such as `J30` and `W15` stay unchanged. The current 10 px, no-wrap timeline needs explicit
Cyrillic LQA; if `Первая поездка за границу` cannot fit, wrap the node label to two lines rather than
shortening the event into the vague `За границей`.

## 8. Her own account

| English | Russian |
| --- | --- |
| `Her own account` | `Её собственный счёт` |
| `Balance` | `Баланс` |
| `Her cut of a prize cheque` | `Её доля призовых` |
| `Manager's cut of a sponsor cheque` | `Доля менеджера со спонсорской выплаты` |
| `Her share goes no higher.` | `Её доля больше не растёт.` |
| growing share | `Каждый день рождения, который она встречает в туре, её доля растёт на {points} п. п. – максимум до {cap}%.` |
| brand addendum | `Такая же доля отчисляется ей из еженедельного дохода её бренда.` |

`п. п.` means percentage points; using `%` after the step would misstate the mechanic. The older
paragraph form on Money must consume the same message parts and figures in RU-06 rather than receive
a separately worded percentage promise.

## 9. Skills frame and chart

| id | English | Russian |
| --- | --- | --- |
| RU05-R01 | `Skills` | `Навыки` |
| RU05-R02 | `Serve` | `Подача` |
| RU05-R03 | `Return` | `Приём` |
| RU05-R04 | `Composure` | `Самообладание` |
| RU05-R05 | `Stamina` | `Выносливость` |
| RU05-R06 | `Groundstrokes` | `Удары с отскока` |
| RU05-R07 | `Where she started` | `С чего начинала` |
| RU05-R08 | `Where she is` | `Что есть сейчас` |
| RU05-R09 | `How far she could go` | `Насколько может вырасти` |
| RU05-R10 | `The fainter it is, the less anyone can tell.` | `Чем бледнее, тем меньше пока можно сказать.` |
| RU05-R11 | no notes | `Too early to say – still learning what she has.` | `Пока рано судить – мы ещё разбираемся, что у неё есть.` |

With a hired coach:

> `Что пока видит её тренер. Пунктир – с чего она начинала, сплошной контур – какой её видят сейчас, размытая область – как далеко она может зайти. По мере того как тренер узнаёт её, все три становятся чётче.`

When the family coaches her:

> `Что пока видите вы. Пунктир – с чего она начинала, сплошной контур – какой её видите сейчас, размытая область – как далеко она может зайти. По мере того как вы узнаёте её, все три становятся чётче.`

Accessible chart name:

> `Её навыки: подача, приём, самообладание, выносливость и удары с отскока. Пунктир показывает, с чего она начинала; сплошной контур – какой её видят сейчас; размытая область – как далеко она может зайти.`

No numbers are added to visible or accessible chart copy. This is an explanation of uncertainty,
not a hidden stat readout.

## 10. Counting results

| English | Russian |
| --- | --- |
| `Counting results (best {n})` | `Зачётные результаты (лучшие {n})` |
| `{points} pts` | `{points}` |
| `No points yet` | `Очков пока нет` |

Description pattern:

> `В {ladderPrepositional} учитываются {countedResults} за последние 52 недели. Полные таблицы – во вкладке «Рейтинг».`

Examples: `В национальном рейтинге учитываются 6 лучших результатов…`; `В профессиональном
рейтинге учитываются 18 лучших результатов…`. The ladder catalogue therefore needs nominative and
prepositional forms; lowercasing a localized display label is not grammar.

## 11. Implementation boundary so far

1. `KidLife` and `RadarAxis.note` currently cross the worker boundary as finished English. They need
   semantic message ids plus typed arguments, or locale-aware projection from saved facts. The
   localized UI must not parse those strings.
2. Corpus localization preserves every selected index and purpose-scoped seed. Choose the semantic
   entry first, then render that entry in the locale; translation consumes no RNG.
3. Shared play styles, ladders, dates, money and counted units reuse the catalogues established in
   RU-01–RU-04. No profile-only synonyms or formatters.
4. Russian friend display data needs nominative and instrumental forms. Transliteration is locale
   data and never changes the underlying stable identity or seed input.
5. `college`, `after-school` and `independent` remain internal enum values. Russian display copy does
   not rename serialized values.

## 12. LQA so far

- 320/375 px and 200% text on every play-style note and all sixteen character combinations;
- ages 14, 18, 19, 21, 22 and 35; every birth month around the September cut-off;
- every school grade, exams, summer, first year out, full-time tennis and independent life;
- all four university years, graduation, early departure after each year and legacy unknown campus;
- every friend lead/name inflection and every licensed weekly line;
- no coach, each hired tier, new coach fog and long learned-coach notes;
- empty, six-row and eighteen-row counting-results cards;
- own account before 18, after first W-series cheque, at the cap and with/without a brand;
- screen reader traversal of country flag, coach door and complete five-axis chart.

Batch status: **in progress**. The profile frame and life-stage language are drafted. The full radar
observation corpus, coach market, week planner, knock and injury-stop copy follow in this document.
