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
| RU05-P01 | back aria | `screen\|Back to Home` | `Вернуться на экран «Дом»` · `APPROVED` 10.10 – ключ назван тегом: три ключа делят этот английский |
| RU05-P02 | settings aria/title | `Settings` | `Настройки` |
| RU05-P03 | age and birthday | `{n} years old · B-Day {date}` | `{age} · День рождения: {date}` – ⚙ 11.10 дыра {age} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
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
| norm | `Steady` (`KidScreen.vue`) | `Спокойна` |
| happy | `Happy` (`KidScreen.vue`) | `Радуется` |
| sad | `Low` | `Не в духе` |
| serious | `Focused` (`KidScreen.vue`) | `Сосредо­точена` – ⚙ 14.10 (r51, №21, «надо бы сделать перенос») в слове один невидимый мягкий перенос (U+00AD) после «Сосредо»: на телефоне слово шире плашки, и без переноса оно рвалось бы посреди слога. Слово то же, меняется только место разрыва. ⚖ 14.10 владелец: ок, `APPROVED`. |
| tired | `Tired` (`KidScreen.vue`) | `Устала` |
| injury | `Hurt` | `Травмирована` |
| rehab | `On the mend` | `Восста­навли­вается` – ⚙ 14.10 (r51, №21) в слове два невидимых мягких переноса (U+00AD): после «Восста» и после «навли». Слово шире плашки даже в две строки, поэтому три строки по слогам: «Восста-», «навли-», «вается». Слово то же, меняется только место разрыва. Такая же запись стоит в таблице настроения экрана недели (ru-home-weekly, строка rehab): ключ общий, и если две записи разойдутся, ключ On the mend перестанет собираться (конфликт). ⚖ 14.10 владелец: ок, `APPROVED`. |
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
| `{ordinal} grade` | `{ordinal}-й класс` – ⚙ 11.10 (RU-23) дыра названа как в английской ячейке: было `{grade}` |
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
| studying | `Year {y} of {total}` | `{y}-й курс из {total}` – ⚙ 11.10 (RU-23) дыра названа как в английской ячейке: было `{course}` | `Student tennis` | `Студенческий теннис` |
| final year | `Year {y} of {total}` | `{y}-й курс из {total}` – ⚙ 11.10 (RU-23) дыра названа как в английской ячейке: было `{course}` | `Final year` | `Выпускной курс` |
| completed | `Graduate` | `Выпускница` | `{n} years done` | `{n, plural, one {{n} год} few {{n} года} many {{n} лет} other {{n} года}} учёбы` – ⚙ 11.10 (RU-23) дыра названа как в английской ячейке, формы – по примеру ниже (`4 года учёбы`): было `{years} учёбы` |
| left early | `Left college` | `Ушла из университета` | `{done} of {total} years` | `{done, plural, one {{done} курс} few {{done} курса} many {{done} курсов} other {{done} курса}} из {total}` – ⚙ 11.10 (RU-23) плюрализация: было `{done} курса из {total}`, что давало «1 курса из 4»; формы – по примерам выше (`1 курс из 4`, `2 курса из 4`) |
| first year out | `The last bell` | `Последний звонок` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` | `12 years done` | `Школа окончена` |
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
| legacy unknown | `Университет, который она выбрала` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

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
| `Important moments` – section heading | `Важные моменты` |

Tier codes such as `J30` and `W15` stay unchanged. The current 10 px, no-wrap timeline needs explicit
Cyrillic LQA; if `Первая поездка за границу` cannot fit, wrap the node label to two lines rather than
shortening the event into the vague `За границей`.

## 8. Her own account

| English | Russian |
| --- | --- |
| `Her own account` | `Её собственный счёт` |
| `Balance` | `Баланс` – ⚙ 11.10 подпись счёта на экране ребёнка – голая строка в engine/kidLife.ts, через t() ещё не проходит: ключа под ряд нет (класс №15/№4) `QUESTION` |
| `Her cut of a prize cheque` | `Её доля призовых` |
| `Manager's cut of a sponsor cheque` | `Доля менеджера со спонсорской выплаты` |
| `Her share goes no higher.` | `Её доля больше не растёт.` |
| growing share | `Каждый день рождения, который она встречает в туре, её доля растёт на {points} п. п. – максимум до {cap}%.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| brand addendum | `Такая же доля отчисляется ей из еженедельного дохода её бренда.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

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

### 9.1 Standing observations by axis

These are stable coach verdicts. A row keeps its existing licence (untried, strong, weak or middle)
and deterministic selection; only its rendering changes.

| axis | English | Russian |
| --- | --- | --- |
| serve | `Nobody has really made her serve yet.` | `Её подачу ещё толком не проверяли.` |
| serve | `She has not met a returner who could hurt her yet.` | `Ей ещё не попадалась соперница, способная надавить на её подачу.` |
| serve | `Her serve is her weapon – we build the rest around it.` | `Подача – её оружие. Остальное строим вокруг неё.` |
| serve | `She holds serve in her sleep. That travels.` | `Свою подачу она держит почти во сне. Такое работает на любом корте.` |
| serve | `The serve is the job this year.` | `В этом году главное – подача.` |
| serve | `She gives away too many free points behind the second ball.` | `На второй подаче она дарит слишком много очков.` |
| serve | `The serve is honest. It will not win her matches on its own.` | `Подача надёжная. Но сама по себе матчи не выиграет.` |
| return | `She has not faced a serve that troubled her yet.` | `Ей ещё не подавали так, чтобы пришлось по-настоящему трудно.` |
| return | `Nobody has served her off the court yet – so we do not know.` | `Её ещё никто не выбивал подачей с корта – поэтому пока не знаем.` |
| return | `She returns better than anyone her age I work with.` | `Она принимает лучше всех ровесниц, с которыми я работаю.` |
| return | `Every serve comes back. That is a whole career on its own.` | `Любая подача возвращается в игру. На этом можно построить карьеру.` |
| return | `The return is where the work is.` | `Главная работа – на приёме.` |
| return | `Big serves still push her off the court.` | `Мощная подача всё ещё оттесняет её далеко назад.` |
| return | `She gets the return in. Hurting people with it comes next.` | `Мяч в игру она возвращает. Теперь надо научиться сразу давить.` |
| composure | `Nobody knows yet how she holds up when it is tight.` | `Мы ещё не знаем, как она держится при равном счёте.` |
| composure | `She has not been in a close one yet. We will find out.` | `По-настоящему близких матчей ещё не было. Увидим.` |
| composure | `Tight sets do not frighten her.` | `Плотные сеты её не пугают.` |
| composure | `The bigger the point, the calmer she gets. You cannot teach that.` | `Чем важнее очко, тем она спокойнее. Этому не научишь.` |
| composure | `The big points still get to her.` | `Важные очки всё ещё на неё давят.` |
| composure | `She plays the occasion instead of the ball when it matters.` | `В решающие моменты она думает о важности матча, а не о мяче.` |
| composure | `She holds her nerve most days.` | `В большинстве матчей нервов ей хватает.` |
| stamina | `Nobody knows yet how she holds up in a third set.` | `Пока не знаем, как она выдержит третий сет.` |
| stamina | `She has never been taken the distance. That is still an open question.` | `Её ещё не доводили до решающего сета. Вопрос открыт.` |
| stamina | `She is still fresh in a third set, and that is rare at her age.` | `В третьем сете она всё ещё свежая – в её возрасте это редкость.` |
| stamina | `Long matches suit her. The other girl tires first.` | `Долгие матчи ей подходят. Соперница устаёт первой.` |
| stamina | `The legs go before the head does. We fix that in the gym.` | `Ноги сдаются раньше головы. Исправим в зале.` |
| stamina | `A third set costs her more than it should.` | `Третий сет забирает у неё больше сил, чем должен.` |
| stamina | `She lasts. A long week still costs her.` | `Она держится. Но длинная неделя всё ещё забирает силы.` |
| groundstrokes | `Nobody has out-hit her yet. We do not know what she has.` | `Её ещё никто не перебивал с задней линии. Пока не знаем, на что она способна.` |
| groundstrokes | `She has not met a girl who could hurt her from the back.` | `Ей ещё не встречалась соперница, способная задавить её в розыгрыше.` |
| groundstrokes | `She hits through people. That ends points on its own.` | `Она пробивает любую оборону. Этого хватает, чтобы заканчивать розыгрыши.` |
| groundstrokes | `The forehand is a shot other girls are afraid of.` | `Её форхенда другие девочки уже боятся.` |
| groundstrokes | `She cannot hurt anybody off the ground yet.` | `С задней линии она пока никому не угрожает.` |
| groundstrokes | `The rally is where she loses matches. That is the work.` | `Матчи уходят именно в розыгрышах. Вот над чем работаем.` |
| groundstrokes | `She holds the rally. Winning it is the next thing.` | `В розыгрыше она держится. Теперь надо научиться его выигрывать.` |

The singular `я работаю` is retained only in the line where a hired coach explicitly compares their
own pupils. The self-coached route needs a separate licensed variant (`среди её ровесниц, которых мы
видели`), because the parent should not suddenly sound like a professional with a stable of players.

### 9.2 Remaining potential and saturated training

| axis/state | English | Russian |
| --- | --- | --- |
| serve/open | `That serve has a long way it can still go.` | `У этой подачи ещё большой запас.` |
| serve/nearly | `Most of what she has on serve is in the bank.` | `Почти всё, что можно взять из подачи, уже взяли.` |
| serve/done | `That serve is as good as it is going to get.` | `Лучше эта подача уже не станет.` |
| serve/done | `The serve is finished work. We protect it now.` | `С подачей работа закончена. Теперь сохраняем уровень.` |
| serve/aimed-done | `We are drilling a serve that has nothing left to give.` | `Мы продолжаем отрабатывать подачу, которой уже некуда расти.` |
| return/open | `There is a lot more return to come out of her.` | `В её приёме ещё большой запас.` |
| return/nearly | `The return is nearly all the way in now.` | `Приём уже почти вышел на свой предел.` |
| return/done | `The return is as far along as it will go.` | `Дальше этот приём уже не вырастет.` |
| return/done | `We have taken the return as far as it goes.` | `Из приёма мы взяли всё, что могли.` |
| return/aimed-done | `Those return sessions are buying nothing now.` | `Эти тренировки приёма больше ничего не прибавляют.` |
| composure/open | `The head has plenty of growing left in it.` | `В игре на счёт ей ещё есть куда расти.` |
| composure/nearly | `Her nerve is close to everything it will be.` | `Её самообладание уже близко к пределу.` |
| composure/done | `She is as steady as she is ever going to be.` | `Спокойнее на корте она уже не станет.` |
| composure/done | `The head is where it is going to stay now.` | `Вот её предел в игре на счёт.` |
| composure/aimed-done | `Match play will not make her calmer than this.` | `Матчевая практика уже не сделает её спокойнее.` |
| stamina/open | `The body has a lot more to give than this.` | `У её тела ещё большой запас.` |
| stamina/nearly | `The legs are nearly all the way there.` | `По выносливости она уже почти у предела.` |
| stamina/done | `The legs are as good as they are going to get.` | `Выносливее она уже не станет.` |
| stamina/done | `There is no more fitness left to find in her.` | `Запаса роста в физике больше нет.` |
| stamina/aimed-done | `The gym has stopped paying us back on those legs.` | `Работа в зале больше не прибавляет этим ногам.` |
| groundstrokes/open | `There is a lot more ball in her than this.` | `В её игре с отскока ещё большой запас.` |
| groundstrokes/nearly | `The ground game is nearly all of what it will be.` | `Игра с отскока уже почти у своего предела.` |
| groundstrokes/done | `Off the ground she is as far as she goes.` | `С задней линии она уже дошла до своего предела.` |
| groundstrokes/done | `The ground game is finished. We keep it sharp.` | `Игра с отскока сложилась. Теперь держим её острой.` |
| groundstrokes/aimed-done | `Rally sessions are not adding to that any more.` | `Тренировки розыгрышей больше ничего к этому не добавляют.` |

These are intentionally direct: the coach is warning that the chosen work has stopped paying back.
The localized copy must not soften `aimed-done` into generic encouragement and hide a real planning
signal.

### 9.3 Weekly training movement

| axis/tier | English | Russian |
| --- | --- | --- |
| serve/early | `The serve work is starting to show.` | `Работа над подачей начинает проявляться.` |
| serve/early | `Something has changed on that serve.` | `В этой подаче что-то изменилось.` |
| serve/early | `The serve is beginning to look like a shot.` | `Подача начинает выглядеть серьёзно.` |
| serve/clear | `The serve has come on. People notice it.` | `Подача выросла. Это уже замечают.` |
| serve/clear | `She wins free points she never used to.` | `Теперь она берёт подачей лёгкие очки, которых раньше не было.` |
| serve/clear | `That serve has moved on a long way.` | `Эта подача прошла большой путь.` |
| serve/deep | `The serve is not the one she arrived with.` | `Это уже не та подача, с которой она пришла.` |
| serve/deep | `Her old serve would be unrecognisable now.` | `Её старую подачу теперь не узнать.` |
| serve/deep | `The serve is a real weapon. That is the work.` | `Подача стала настоящим оружием. Вот что сделала работа.` |
| return/early | `The return is starting to look different.` | `Приём начинает выглядеть иначе.` |
| return/early | `She is meeting the ball earlier now.` | `Теперь она встречает мяч раньше.` |
| return/early | `The return work is beginning to show.` | `Работа над приёмом начинает проявляться.` |
| return/clear | `The return has come on a long way.` | `Приём прошёл большой путь.` |
| return/clear | `She hurts people with the return now.` | `Теперь она сразу давит приёмом.` |
| return/clear | `Big serves do not push her back like they did.` | `Мощная подача уже не отбрасывает её так далеко.` |
| return/deep | `The return is a different shot entirely.` | `Приём стал совсем другим ударом.` |
| return/deep | `She takes the serve early now. All of it work.` | `Теперь она принимает рано. Всё это – работа.` |
| return/deep | `Nothing gets past her the way it once did.` | `Теперь мимо неё уже не проходит всё подряд.` |
| composure/early | `She is steadier in the tight games.` | `В равных геймах она стала устойчивее.` |
| composure/early | `The head is quieter than it was.` | `В голове стало тише.` |
| composure/early | `She is starting to hold on in close ones.` | `В близких матчах она начинает держаться.` |
| composure/clear | `The big points do not shake her now.` | `Теперь важные очки её не раскачивают.` |
| composure/clear | `She has grown up out there.` | `На корте она повзрослела.` |
| composure/clear | `Nothing rattles her the way it used to.` | `Её уже не выбивает из колеи то, что выбивало раньше.` |
| composure/deep | `She is the calmest girl on the court now.` | `Теперь она самая спокойная на корте.` |
| composure/deep | `The pressure does not touch her any more.` | `Давление до неё больше не добирается.` |
| composure/deep | `You would not know she was ever nervous.` | `И не скажешь, что когда-то она нервничала.` |
| stamina/early | `She is fresher late in matches.` | `К концу матча у неё остаётся больше сил.` |
| stamina/early | `The legs are holding up better.` | `Ноги держат лучше.` |
| stamina/early | `The gym work is starting to tell.` | `Работа в зале начинает сказываться.` |
| stamina/clear | `A third set does not frighten her now.` | `Теперь третий сет её не пугает.` |
| stamina/clear | `She finishes stronger than she starts.` | `Заканчивает она сильнее, чем начинает.` |
| stamina/clear | `The legs have come on a long way.` | `Ноги стали намного крепче.` |
| stamina/deep | `She can go all afternoon now.` | `Теперь она может играть весь день.` |
| stamina/deep | `Nobody outlasts her any more.` | `Теперь её никто не перебегает.` |
| stamina/deep | `The other girl breaks first these days.` | `Теперь первой сдаётся соперница.` |
| groundstrokes/early | `There is more on the ball than there was.` | `Мяч у неё стал тяжелее.` |
| groundstrokes/early | `The forehand is starting to bite.` | `Форхенд начинает кусаться.` |
| groundstrokes/early | `She is standing up to the rally better.` | `В розыгрыше она стала держаться увереннее.` |
| groundstrokes/clear | `She hits through girls she used to rally with.` | `Теперь она пробивает тех, с кем раньше просто держала розыгрыш.` |
| groundstrokes/clear | `The ball comes off her strings differently.` | `Мяч теперь иначе сходит с её струн.` |
| groundstrokes/clear | `She ends points off the ground now.` | `Теперь она заканчивает очки с задней линии.` |
| groundstrokes/deep | `Nobody wants a rally with her any more.` | `Теперь никто не хочет ввязываться с ней в розыгрыш.` |
| groundstrokes/deep | `The forehand has become the whole match.` | `Форхенд теперь определяет весь матч.` |
| groundstrokes/deep | `She hits like a girl three years older.` | `Она бьёт как теннисистка на три года старше.` |

While the coach cannot read any movement, the five rotating lines are:

1. `Пока рано говорить, что даёт эта работа.`
2. `Она отрабатывает часы. Но прочитать результат пока нельзя.`
3. `Мы ещё разбираемся, что у нас здесь есть.`
4. `Работа идёт. Чего она стоит – пока никто не знает.`
5. `Дайте ей сезон. Пока читать нечего.`

`Теннисистка на три года старше` avoids the diminishing adult phrase `девочка на три года старше` when
the same pool survives into her twenties. The movement table is used on Home's training card too;
there must be one catalogue, not a profile and Home copy.

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

## 13. Coach market frame

| id | English | Russian |
| --- | --- | --- |
| RU05-C01 | `Back` | `Назад` |
| RU05-C02 | `Coach Market` | `Рынок тренеров` |
| RU05-C03 | `{name} · {style} · {n} coaches` | `{name} · {style} · {coaches}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| RU05-C04 | `Her week` | `Её неделя` |
| RU05-C05 | `Coaches` | `Тренеры` |
| RU05-C06 | `market\|Support staff` | `Специалисты` |
| RU05-C07 | `What this screen is about` – group aria | `Раздел рынка тренеров` |
| RU05-C08 | `Style` | `Стиль` |
| RU05-C09 | `Sort` | `Сортировка` |
| RU05-C10 | `Best fit` | `Сначала подходящие` |
| RU05-C11 | `Price` | `Сначала дешевле` |
| RU05-C12 | style lens | `Показано соответствие стилю «{style}», а не её нынешней игре.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

`{coaches}` is `1 тренер`, `2 тренера`, `5 тренеров`. The style catalogue is RU-02A's; no shortened
market-only copy.

Coach tiers and fit:

| semantic value | English | Russian |
| --- | --- | --- |
| self | `Self-coached` | `Тренирует семья` |
| budget | `coach\|Budget` | `Бюджетный` |
| middle | `Middle` | `Средний` |
| high | `High` | `Высокий` |
| elite | `Elite` | `Элитный` |
| great fit | `Great fit` | `Отлично подходит` |
| good fit | `Good fit` | `Подходит` |
| off-style | `Off-style` | `Другой стиль` |

The section header is `{tier} уровень · {coaches} · {lo}–{hi} в неделю`. Russian decimals and ranges
use comma and an en dash: `+0,3–0,6% за сезон`, `+0,1–0,3% за матч`,
`+0,2–0,6% в поездках с ней`.

## 14. Team budget shown on the coach route

The household details are formally owned by RU-06, but these bindings are required here because the
coach route renders the shared blocks.

| English | Russian |
| --- | --- |
| `Team budget` | `Бюджет команды` |
| `{money} /week free` | `Свободно: {money} в неделю` – ⚙ 11.10 дыра ключа и русский не сходятся (паритет): ряд не компилится `QUESTION` |
| `{money} committed` | `Обязательства: {money}` |
| `{money} weekly cap` | `Лимит на неделю: {money}` |
| `Coach` | `Тренер` |
| `Masseur` | `Массажист` |
| `Psychologist` | `Психолог` |
| `Hitting partner` | `Спарринг-партнёр` |
| `Household, every week` | `Семья за неделю` |
| `{in} in – {out} out – {net} left over` | `доход {in} – расход {out} – остаётся {net}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| `{in} in – {out} out – {net} short` | `доход {in} – расход {out} – не хватает {net}` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |

Shelf, upkeep and business-income explanations reuse RU-06's semantic messages; this route must not
keep a private translation just because it mounts the component.

## 15. Training regulator and travel choices

Preset controls reuse the RU-03 terms: `Легко`, `Баланс`, `Интенсивно`. On this screen each adds its
real billed time: `Легко · {hours} ч/нед.`, and so on.

| id | meaning | English | Russian |
| --- | --- | --- | --- |
| RU05-C13 | price context | `Every price below is {n} sessions a week – more sessions, more money.` | `Все цены ниже рассчитаны на {sessions} в неделю: больше тренировок – выше оплата.` – ⚙ 11.10 дыра {sessions} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
| RU05-C14 | travel heading | `Coach travels to tournaments` | `Тренер ездит на турниры` |
| RU05-C15 | self-coached | `You are coaching her yourself – there is nobody to send. Turn it on and it takes effect when you hire somebody.` | `Вы тренируете её сами – отправлять пока некого. Настройку можно включить заранее: она заработает после найма тренера.` |
| RU05-C16 | sponsor cover | `Your sponsor pays {pct}% of the second seat at the events that pay prize money – the rest is yours.` | `На турнирах с призовыми спонсор оплачивает {pct}% второго билета, остальное платит семья.` |
| RU05-C17 | scholarship | `The support does not pay for the second seat – hers is discounted, the coach travels at the full fare.` | `Поддержка снижает стоимость её билета, но не второго: поездка тренера оплачивается полностью.` |
| RU05-C18 | ordinary fare | `One additional fare per trip – a second seat beside hers.` | `Один дополнительный билет на каждую поездку – место рядом с ней.` |
| RU05-C19 | priced covered trips | `{rule} Her seats cost {herFare} over the {trips} ahead; the second seat adds {coachFare}.` | `{rule} В следующих {trips} её билеты стоят {herFare}; место тренера добавит ещё {coachFare}.` – ⚙ 11.10 дыра возвращена (бланкет) |
| RU05-C20 | priced ordinary trips | `{rule} {coachFare} over the {trips} she has booked this season.` | `{rule} По заявленным на сезон {trips} поездка тренера добавит {coachFare}.` – ⚙ 11.10 дыра возвращена (бланкет) |

The English implementation currently assembles C19–C20 inside a computed string. `{trips}` is a
counted phrase (`1 поездке`, `2 поездках`, `5 поездках`), not a number plus English noun.

Travel switch names:

- on: `Тренер ездит с ней на турниры. Включено. Нажмите, чтобы оставлять тренера дома в соревновательные недели.`
- off: `Тренер ездит с ней на турниры. Выключено. Нажмите, чтобы оплачивать ещё один билет на каждую поездку.`

Nested junior option:

| English | Russian |
| --- | --- |
| `...and to junior events too` | `…и на юниорские турниры тоже` |
| `Junior and domestic events pay no prize money – the fare buys presence, and nothing comes back.` · base note | `Юниорские и национальные турниры не платят призовых: билет покупает присутствие, но не приносит дохода.` |
| priced tail | `В этом сезоне на карточке ещё {trips}; их общая стоимость – {money}.` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| `Send the coach to junior and domestic tournaments too? Those rungs pay no prize money, so the second fare is a bill against an income she does not have yet. Measured over 30 careers a cell, an unlimited junior fare bankrupted 8 of 30 wealthy families and 15 of 30 middle ones – every one of them before she turned twenty. Your money, your call.` · confirm | `Отправлять тренера ещё и на юниорские и национальные турниры? На этих уровнях нет призовых, поэтому второй билет оплачивается из доходов, которых теннис пока не приносит. В замере по 30 карьер в каждой группе неограниченные юниорские поездки привели к банкротству 8 из 30 обеспеченных и 15 из 30 семей со средним достатком – во всех случаях до её двадцатилетия. Деньги ваши, решение тоже.` |
| `Send the coach` · confirm action | `Отправлять тренера` |
| `Not yet` · cancel | `Пока нет` |

Junior switch names state `Включено`/`Выключено` and describe either stopping or adding the extra fare
on trips without prize money. The warning is intentionally candid and does not disable the choice.

Current bill and universal share:

- `{weekly} в неделю при нынешнем плане – {season} за {weeks}.`
- `Кроме того, любой тренер здесь получает {pct}% от каждого её призового чека.`

## 16. Coach cards

### 16.1 Actions and accessibility

| English | Russian |
| --- | --- |
| `/wk` | `/нед.` |
| `Current` | `Работает с ней` |
| `{n} pts short` | `Не хватает {points}` – ⚙ 11.10 дыра {points} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
| `Hire ›` | `Нанять ›` |
| `Chemistry with her: not known yet` · unknown chemistry | `Взаимопонимание с ней: пока неизвестно` |
| known chemistry | `Взаимопонимание с ней: {signedPct}` – ⚙ 11.10 дыра русского ждёт готовую фразу со словом, а ключ отдаёт голое число: ряд ждёт локализованный аргумент `QUESTION` |

The row's accessible pattern is:

> `{name}; {tier} уровень; {fit}; {weekly} в неделю{chemistry}; {state}.`

States are `сейчас её тренер`, `недоступно – не хватает {points}` and `нанять`. Positive chemistry
is spoken without `+`, negative with a minus, matching the approved visible rule.

Hire confirmation avoids declining generated international names:

> `Новый тренер – {name}, {weekly} в неделю. Подтвердить найм? {billChange}`

`{billChange}` is `Расходы на тренера не изменятся.`, `Расходы на тренера вырастут на {delta}.` or
`Расходы на тренера снизятся на {delta}.` Confirm action: `Нанять`.

Release confirmation:

> `Прекратить сотрудничество: {name}? С этой недели вы снова тренируете её сами: в счёте останется только аренда корта, а профессиональная оценка, за которую вы платили, исчезнет.`

Confirm action: `Тренировать её самостоятельно`. The fallback name is `нынешний тренер`; no Russian
sentence should require guessing a generated coach's gender or name case.

### 16.2 Individual coach descriptions

| id | English | Russian |
| --- | --- | --- |
| budget-1 | `A club-court lifer – patience first, power much later.` | `Вся жизнь на клубном корте: сначала терпение, сила потом.` |
| budget-2 | `Teaches the basics, and drills them until they hold.` | `Ставит базу и повторяет, пока она не закрепится.` |
| budget-3 | `An ex-satellite hitter who still swings for the lines.` | `За плечами сателлиты; до сих пор целится в линии.` |
| middle-4 | `Cheap, blunt, and obsessed with a repeatable toss.` | `Недорого и без церемоний; главное – повторяемый подброс.` |
| middle-1 | `Builds a whole game slowly, one shot at a time.` | `Собирает всю игру медленно, по одному удару.` |
| middle-2 | `Keeps a notebook on every opponent in the region.` | `Ведёт тетрадь на каждую соперницу в регионе.` |
| middle-3 | `Serve and forehand first – the rest can wait.` | `Сначала подача и форхенд, остальное подождёт.` |
| middle-5 | `Drills the first strike until it lands more often.` | `Ставит первый удар, пока тот не начнёт попадать.` |
| high-1 | `Has taken pupils onto the tour – thinks in seasons.` | `Есть опыт вывода учениц в тур – мыслит сезонами.` |
| high-2 | `Believes the extra ball back wins more than the winner.` | `Верит: ещё один возвращённый мяч важнее виннера.` |
| high-3 | `Short points, high risk – coaches the way the tour plays.` | `Короткие розыгрыши, высокий риск – так играет тур.` |
| high-4 | `Rebuilt a serve from scratch once, and teaches it that way.` | `Умеет перестроить подачу с нуля – и так её преподаёт.` |
| elit-1 | `A tour-bench veteran with a plan for every draw.` | `Ветеран тренерской скамейки тура, с планом на любую сетку.` |
| elit-2 | `A Grand Slam quarter-final on the CV, and no time to waste.` | `В резюме – четвертьфинал Большого шлема. Времени зря не тратит.` |
| elit-3 | `Built two tour serves, and prices the third accordingly.` | `В портфолио – две подачи уровня тура. Цена за третью соответствующая.` |
| elit-4 | `A chess player – will make a pupil think a set ahead.` | `Теннис как шахматы: ученица будет думать на сет вперёд.` |

These lines remain attached to portrait ids, not randomized names. The Russian variants avoid past
verbs and personal pronouns whose gender could contradict a later portrait swap.

### 16.3 What the tier and style buy

| band | Russian full line |
| --- | --- |
| above | `Выше уровня – сочетание стилей даёт больше, чем одна цена.` |
| level | `Темп уровня – стиль ничего не добавляет и ничего не отнимает.` |
| under | `Ниже уровня – из-за стиля теряется многое из того, что покупает цена.` |
| under-self | `Медленнее ваших тренировок – для её игры этот тренер развивает навыки медленнее вас.` |

Medical/load lines:

| tier | Russian |
| --- | --- |
| self | `Вы сами следите за нагрузкой: каждое решение за вами, и кроме вас её никто не наблюдает.` |
| budget | `Базовая физиотерапия: простые решения принимают без вас, остальные оставляют вам.` |
| middle | `Полноценная физиотерапия: большинство недель обходится без вашего решения.` |
| high | `Хорошая медицинская команда: к вам обращаются редко.` |
| elite | `Лучшая медицинская команда, которую можно купить: о её теле заботятся, а вы узнаёте уже о результате.` |

### 16.4 Growth room and the learned-coach plaque

| band | Russian label | Russian explanation | short Home form |
| --- | --- | --- | --- |
| 0 | `Огромный потенциал` | `большая часть её игры ещё впереди, и здесь тренер даёт больше всего.` | `Большая часть игры впереди` |
| 1 | `Ещё есть куда расти` | `в её игре остаётся заметный запас, и раскрыть его помогает тренер.` | `Ещё есть куда расти` |
| 2 | `Близко к потолку` | `запас заканчивается, и каждый следующий уровень даёт меньше прежнего.` | `Близко к потолку` |
| 3 | `У своего потолка` | `сейчас ни один тренер, независимо от цены, не добавит многого.` | `У своего потолка` |

Before the coach can be read:

- same-season reveal: `Её прогресс – в межсезонье будет понятнее.`
- delayed reveal: `Её прогресс – времени прошло мало, вернёмся к этому в следующее межсезонье.`

Placement fragments are `выше моих ожиданий`, `примерно такой, как ожидалось`, `ниже моих
ожиданий`. Complete tenure lines:

- `После первого сезона похоже, что темп {placement}.`
- `После двух сезонов оценка держится: темп {placement}.`
- `Сезон за сезоном: темп {placement}.`
- travel edge: `На турнирах, куда едет тренер, эффект вдвое выше.`

The first-person fragments work for a coach of any gender. They state expectation, not praise or
blame, and reveal no individual numeric edge.

### 16.5 Decline note on the current coach

Label: `Пик позади`.

Semantic clauses:

- yearly drop: `за год опустилась на {places}`;
- below best: `на {places} ниже своего лучшего сезона`;
- ordinary body clock: `у организма осталось около {seasons}`;
- next last winter: `следующее межсезонье станет последним`;
- later last winter: `до последнего межсезонья – {seasons}`;
- no recovery by hiring: `и никакой тренер этого не вернёт.`

`{places}` and `{seasons}` are complete counted phrases. The short Home variants remain RU-03's
responsibility but must consume this same decline descriptor.

## 17. Her Week training matrix

| English | Russian |
| --- | --- |
| `General practice` | `Общая тренировка` |
| `Serve & return` | `Подача и приём` |
| `Rally` | `Розыгрыши` |
| `Fitness` | `Физподготовка` |
| `Match play` | `Игровая тренировка` |
| `Light` | `Легко` |
| `Balanced` | `Баланс` |
| `Grind` | `Интенсивно` |
| `I coach her myself` | `Тренирую её самостоятельно` |
| `The week, day by day` · week grid aria | `Неделя по дням` |
| `Next week – {note}` | `На следующей неделе – {note}` |

Capacity and lock copy:

- double days: `На этой неделе школы нет: при желании в один день поместятся две тренировки.`
- school single days: `Пока идёт школа – одна тренировка в день. Точки показывают, сколько места осталось.`
- other single days: `На этой неделе – одна тренировка в день. Точки показывают, сколько места осталось.`
- hired lock: `{coachName} составляет её неделю.`
- hired lock help: `Отметьте «Тренирую её самостоятельно», чтобы снова планировать неделю. Это завершит работу с тренером.`
- maximum: `Её максимум – {sessions}. Снимите одну отметку, чтобы перенести тренировку.`
- minimum: `Её минимум – {sessions}. Сначала добавьте другую тренировку, затем снимите эту.`

Accessible day head: `{day}: занято {used} из {capacity}`. Checkbox: `{session} в {dayAccusative}`.
Russian day data therefore needs at least nominative and accusative (`понедельник` / `понедельник`;
`среда` / `среду`), rather than interpolating a display label after `в`.

Weekly readout:

> `{sessions}, {hours}{doubleDays} – {daysOff}.{bill}`

Examples: `5 тренировок, 5 часов – 2 дня отдыха. На этой неделе – $240.`;
`6 тренировок, 6 часов, в 2 дня по две – 3 дня отдыха.` Counted phrases must be built by the
locale, not English singular ternaries.

Self-coach footer:

- hired: `Вы всегда можете снова тренировать её самостоятельно. В еженедельном счёте останется только аренда корта.`
- self: `Вы тренируете её самостоятельно. В еженедельном счёте только аренда корта.`
- action: `Тренировать её самостоятельно`.

## 18. Plan a future week

This takeover is not another version of the weekly training matrix. It commits a future empty week
to either a watchable practice match or a family vacation. The Russian title is therefore
`План на {week}`, not the imperative `Спланировать {week}`.

### 18.1 Frame and an already-booked vacation

| id | English | Russian |
| --- | --- | --- |
| RU05-W01 | `Plan {week}` | `План на {week}` |
| RU05-W02 | `Close planner` | `Закрыть план недели` |
| RU05-W03 | header | `{dates} · condition {condition}/100` | `{dates} · форма {condition}/100` |
| RU05-W04 | `Practice` | `Матч` |
| RU05-W05 | `Vacation` | `Отпуск` |
| RU05-W06 | booked lead | `{label} – booked, {price}. She plays no tournament while she is away.` | `{label} – забронировано за {price}. На этой неделе она не играет на турнирах.` |
| RU05-W07 | paid cancellation | `Cancel any time before the week starts and the money comes back in full.` | `До начала недели бронь можно отменить с полным возвратом.` |
| RU05-W08 | free cancellation | `Cancel any time before the week starts and nothing is owed either way.` | `До начала недели бронь можно отменить: платить всё равно не за что.` |
| RU05-W09 | `Keep it` | `Оставить` |
| RU05-W10 | `Cancel the trip` | `Отменить поездку` |

`{price}` is either localized money or `бесплатно`. It must not become `за бесплатно`. For zero-price
bookings W06 therefore has a separate grammatical message: `{label} – забронировано бесплатно.`
The table shows the compact semantic target; implementation must select the paid/free variant.

### 18.2 Practice match

| id | English | Russian |
| --- | --- | --- |
| RU05-W11 | off-season | `Off-season – family time, no matches. Try the Vacation tab.` | `Межсезонье – время для семьи, без матчей. Выберите вкладку «Отпуск».` |
| RU05-W12 | lead | `A friendly at the club – watchable, no ranking points. One notch of fatigue, and she keeps her base recovery but loses the rest bonus for the week.` | `Тренировочный матч в клубе можно посмотреть, но рейтинговых очков за него нет. Он добавит немного усталости: обычное восстановление сохранится, а бонус за неделю отдыха – нет.` |
| RU05-W13 | `Court rental` | `Аренда корта` |
| RU05-W14 | `+ coach for the match ({fee} – the other half is on the opponent's family)` | `+ тренер на матч ({fee}; вторую половину оплачивает семья соперницы)` |
| RU05-W15 | `plan\|Total` | `Итого` |
| RU05-W16 | injured refusal tail | `A friendly is still a match, so the week books nothing until she is back – leave it to rest.` | `Тренировочный матч всё равно остаётся матчем, поэтому до её возвращения забронировать его нельзя. Оставьте эту неделю для отдыха.` |
| RU05-W17 | medical refusal tail | `A friendly is still a match, so it is out too at condition {condition} – try the Vacation tab, or leave the week to training.` | `Тренировочный матч тоже требует допуска, а при форме {condition}/100 его нет. Выберите отпуск или оставьте неделю для обычных тренировок.` |
| RU05-W18 | `Cancel` (`ConfirmDialog.vue`) | `Отмена` · `APPROVED` 10.10 – диалоговое «Отмена»; хинт в аннотации разводит с `undo\|Cancel` Сезона |
| RU05-W19 | `Injured` | `Травма` |
| RU05-W20 | `Not cleared to play` | `Нет допуска` |
| RU05-W21 | `Book anyway` | `Всё равно забронировать` |
| RU05-W22 | `Book the match` | `Забронировать матч` |
| RU05-W23 | `plan\|Not enough funds` | `Недостаточно средств` · `APPROVED` 10.10 – чат-ок выровнял на одну форму (RU-03/RU-04); «денег» – историческая; это ключ листа плана недели (`plan\|`-тег ночной волны) |

Shared refusal heads:

- medical: `Нет допуска к игре – ей нужен отдых.`;
- layoff: `Травма – вернётся {week}.`;
- tired caution: `Она уже вымотана – ещё один матч?`;
- streak caution: `{weeks} подряд с матчами – так организм и ломается.`

`{weeks}` is a complete phrase (`3 недели`, `4 недели`), not `{n} матч-недель`. If both caution
reasons apply, preserve their present order: body first, streak second.

Practice confirmation:

| condition | Russian message | action |
| --- | --- | --- |
| ordinary | `Тренировочный матч в {week} – {price}. Рейтинговых очков нет.` | `Забронировать` |
| with coach | `Тренировочный матч с тренером в {week} – {price}. Рейтинговых очков нет.` | `Забронировать` |
| caution | `{caution} Тренировочный матч{coach} в {week} – {price}. Рейтинговых очков нет.` | `Всё равно играть` |

The current `in {weekLabel}` composition assumes an English week label. Russian needs the whole
prepositional phrase from the date formatter (`на неделе {week}` or a compact neutral week label),
not a preposition glued to a locale-independent display string.

### 18.3 Vacation catalogue

| package id | English label | Russian label | Russian description |
| --- | --- | --- | --- |
| staycation | `Staycation with friends` | `Неделя дома с друзьями` | `Никуда не ехать, никаких тренировок – своя кровать и свои люди.` |
| grandma | `Grandma's village` | `К бабушке в деревню` | `Два поезда и автобус – неспешная еда, неспешные дни.` |
| camping | `Camping road-trip` | `Поездка с палаткой` | `Палатка, озеро, а ракетка остаётся дома.` |
| seaside | `Seaside family hotel` | `Семейный отель у моря` | `Настоящий отпуск – море, сон и солнце.` |
| resort | `Sports recovery resort` | `Спортивный восстановительный центр` | `Бассейн, физиотерапия и массаж – отдых по программе.` |
| elite | `Elite recovery programme` | `Элитная программа восстановления` | `Клиника, которой пользуются профессионалы: вернётся как новая.` |
| yacht-week | `A week on the yacht` | `Неделя на яхте` | `Никуда не нужно спешить – только море и целая неделя.` |

The yacht rewrite removes the English wordplay that cannot survive naturally in Russian; it keeps
the same unhurried promise without sounding translated.

| id | English | Russian |
| --- | --- | --- |
| RU05-W24 | vacation lead | `A week away – no tournaments that week, and she comes back fresher. Cancel any time before the week starts for a full refund.` | `Неделя отдыха без турниров – она вернётся свежее. До начала недели бронь можно отменить с полным возвратом.` |
| RU05-W25 | layoff note tail | `A week away is still hers to book – the trip is rest, not tennis.` | `Отпуск всё равно можно забронировать: поездка – это отдых, а не теннис.` |
| RU05-W26 | effect, no buff | `+{gain} condition → {condition}/100` | `Форма +{gain} → {condition}/100` |
| RU05-W27 | effect with buff | `· injury risk −{pct}% for {weeks}` | `· риск травмы −{pct}% на {weeks}` |
| RU05-W28 | `Recommended` | `Рекомендуем` |
| RU05-W29 | `Out of reach` | `Не по бюджету` |
| RU05-W30 | `free – their own boat` | `бесплатно – своя яхта` |
| RU05-W31 | `Book` | `Забронировать` |

The buff duration is a counted phrase: `на 1 неделю`, `на 2 недели`, `на 5 недель`.

Rest-cost warnings:

- `На этой неделе она защищает {points}; отпуск не принесёт очков взамен.`
- level with a cut: `Сейчас она №{rank} – ровно на границе {tier}, №{cut}. Если уровень закроется,
  его турниры исчезнут из календаря.`
- inside a cut: `Сейчас она №{rank} – на {places} внутри границы {tier}, №{cut}. Если уровень
  закроется, его турниры исчезнут из календаря.`

`{points}` is `1 очко`, `2 очка`, `5 очков`; `{places}` is `1 позицию`, `2 позиции`, `5 позиций`.
The tier must arrive in a locative-ready display form, or the message must use a syntax that accepts
its nominative label. Do not lowercase a localized tier and hope it declines itself.

Vacation confirmations:

- book: `{label}, {week}: {price}; форма +{gain}. На этой неделе турниров не будет.`;
- paid cancel: `Отменить «{label}» ({week})? {refund} вернутся полностью.`;
- free cancel: `Отменить «{label}» ({week})? За поездку ничего не платили.`;
- action: `Забронировать` / `Отменить поездку`.

For paid refunds, money is grammatically plural in this sentence (`$300 вернутся` is awkward even
though the symbol hides the noun). Prefer the invariant construction `Полный возврат: {refund}.`
Final paid copy: `Отменить «{label}» ({week})? Полный возврат: {refund}.`

### 18.4 Planner-generated history

These strings are persisted events, not harmless debug messages. Russian mode must render them from
semantic booking/cancellation facts, including old saves:

| English event | Russian |
| --- | --- |
| `Booked: {label} – {week}` | `Забронировано: {label} – {week}` |
| `Family vacation booked – {week} ({label})` | `Семейный отпуск забронирован – {week} ({label})` |
| `Cancelled the family vacation – {week}` | `Семейный отпуск отменён – {week}` |
| `Family vacation – {label}: +{gain} condition.` | `Семейный отпуск – {label}: форма +{gain}.` |
| `Family vacation – {label}: +{gain} condition, and the recovery holds for {weeks}.` | `Семейный отпуск – {label}: форма +{gain}, сниженный риск травмы действует {weeks}.` – ⚙ 11.10 дыра русского ждёт готовую фразу со словом, а ключ отдаёт голое число: ряд ждёт локализованный аргумент `QUESTION` |

The paid expense row, informational booking row and resolved-week row are three distinct events.
Migration must not infer one from another or collapse them; history order and amounts stay intact.

### 18.5 Implementation and LQA contract

1. Vacation packages require stable ids plus localized label/blurb lookup. Persist the id, never the
   Russian label; migrate legacy history from known English labels to ids where possible.
2. `PracticeCaution.detail`, `MedicalBlock.detail`, `layoffNoteFor` and `restCostLines` currently
   return finished English strings. They need semantic results or locale-aware presentation; a Vue
   template cannot reliably translate a sentence received from the engine.
3. Money, week labels, points, places and durations use shared locale formatters. No English
   singular ternary or hard-coded `free` survives behind the Russian surface.
4. Test both tabs at 320/375 px and 200% text; all seven vacation cards, the longest warning, free
   yacht, negative funds with free staycation, paid/free cancellation and the two medical blocks.
5. Verify keyboard and screen-reader traversal after the longer Russian labels; the tab names and
   disabled primary action must still expose the reason immediately beside the control.

## 19. The knock: a sore place, not yet an injury

The knock dialog speaks as a parent thinking about a week that just happened. It must not sound like
a diagnosis. The coach offers a reading, not certainty. The two choices remain equally selectable;
only the consequences differ.

### 19.1 Shared body lexicon

Never localize a persisted English body-part string by displaying it. Resolve it as a stable region
id and ask for the grammatical form the message needs.

| region id | nominative | accusative | location |
| --- | --- | --- | --- |
| ankle | `голеностоп` | `голеностоп` | `в голеностопе` |
| knee | `колено` | `колено` | `в колене` |
| hamstring | `задняя мышца бедра` | `заднюю мышцу бедра` | `в задней мышце бедра` |
| calf | `икроножная мышца` | `икроножную мышцу` | `в икроножной мышце` |
| foot | `стопа` | `стопу` | `в стопе` |
| hip | `тазобедренный сустав` | `тазобедренный сустав` | `в тазобедренном суставе` |
| wrist | `запястье` | `запястье` | `в запястье` |
| shoulder | `плечо` | `плечо` | `в плече` |
| elbow | `локоть` | `локоть` | `в локте` |
| forearm | `предплечье` | `предплечье` | `в предплечье` |
| lower-back | `поясница` | `поясницу` | `в пояснице` |
| abdominal | `мышцы живота` | `мышцы живота` | `в мышцах живота` |

The knock uses eight of these today; injury uses all twelve. One catalogue prevents `lower back`
from becoming `низ спины` on one screen and `поясница` on another. Save migration must recognize the
known English values but persist/use region ids going forward.

### 19.2 Frame and choices

| id | English | Russian |
| --- | --- | --- |
| RU05-K01 | `A knock – {week}` | `Что-то побаливает – {week}` |
| RU05-K02 | `The same knock again – {week}` | `Снова то же место – {week}` |
| RU05-K03 | `Her {part}.` | `Беспокоит {part}.` |
| RU05-K04 | `Rest it` | `Дать отдохнуть` |
| RU05-K05 | `Train through it` | `Продолжить тренировки` |
| RU05-K06 | `Proceed` | `Продолжить` |

`Небольшая травма` is deliberately not used for *knock*: the mechanic has not diagnosed an injury.
`Что-то побаливает` keeps the uncertainty and is quiet enough not to compete with the injury stop.

### 19.3 What the parent noticed

Fresh pool, with `{partAcc}`:

1. `После тренировки в пятницу она придерживала {partAcc}.`
2. `Всю неделю жаловалась на {partAcc}. Рассказала только в воскресенье.`
3. `После четверга – лёд на {partLocation}. Говорит, всё в порядке.`
4. `С середины недели бережёт {partAcc}.`

Repeat pool:

1. `Снова жалуется на {partAcc}. Сказала об этом в машине, а потом отмахнулась: ничего страшного.`
2. `Всё то же место – {partNom}. Разминала на кухонном полу и не поднимала глаз.`
3. `Опять {partLocation}. Она понимает: мы заметили.`

These are seven semantic variants, selected exactly as today on the purpose-scoped wording stream.
Locale changes words after the variant is chosen; they do not draw again or change `pick % length`.

### 19.4 The coach's read

Repeat:

1. `На этот раз тренер говорит жёстче: такое уже было, и это не нравится.`
2. `Тренер помнит прошлый раз и дважды повторяет: ей нужно пропустить неделю.`
3. `Первый вопрос тренера – как давно это продолжается. Ответ явно не понравился.`

Condition below 50:

1. `По мнению тренера, она работает на пустом баке – организм даёт об этом знать.`
2. `Тренер уже не первую неделю видит её уставшей и советует пропустить эту.`
3. `Тренер говорит: у вымотанного организма всё начинает болеть. Лучше не проверять, чем это кончится.`

Ordinary condition:

1. `Тренер не тревожится, но и игнорировать это не советует.`
2. `Тренер предлагает оставить тренировки и просто наблюдать.`
3. `Тренер говорит, что, скорее всего, ничего серьёзного. Но «скорее всего» – не наша уверенность.`
4. `Тренер говорит, что в её возрасте такое приходит и уходит, а решение оставляет нам.`

No sentence inflects or genders the generated coach. The Russian lines preserve the three evidence
bands and do not strengthen opinion into medical fact.

### 19.5 Why it may have happened

| condition | English | Russian |
| --- | --- | --- |
| same place previously pushed | `We sent her back out with a knock to her {part} before. Now the same place is troubling her again.` | `Раньше мы уже отправили её тренироваться с этой болью – {partLocation}. Теперь беспокоит то же место.` – ⚙ 11.10 дыра {partLocation} русского не из ключа (готовая фраза со словом или падежная форма): ряд ждёт локализованный аргумент `QUESTION` |
| no single player-caused factor | `No single choice explains this one. We had been careful. Bodies still have bad weeks.` | `Одним решением это не объяснить. Мы были осторожны, но у организма всё равно бывают плохие недели.` |
| fatigue dominates | `She began the week already tired. Her body had less room for the work we asked of it.` | `Она начала неделю уже уставшей. На заданную нами работу у организма осталось меньше запаса.` |
| load dominates | `We set a hard week. It asked more of her body than an ordinary one.` | `Мы задали тяжёлую неделю. Она потребовала от организма больше обычного.` |

The repeat line technically needs a Russian instrumental construction if it mirrors English. The
draft intentionally avoids it and uses nominative `{partNom}`; this keeps the body catalogue small
without making the sentence vague.

### 19.6 Costs and selection

| branch | Russian cost |
| --- | --- |
| rest | `Обнять, уложить на диван и почти неделю не вспоминать о теннисе. Работа этой недели пропадёт.` |
| first push | `Она тренируется по плану, а следующие три недели риск будет выше.` |
| repeat push | `Она тренируется по плану. Если теперь станет хуже, то всерьёз – и в том же месте: {partLocation}.` |

The first tap only selects a radio option; `Продолжить` records it. Nothing is preselected, Escape
does not dismiss, and focus lands on the card. Russian copy must not smuggle in a recommendation via
`безопасно`, `разумно` or coloured praise.

### 19.7 Coach routing and persisted feed rows

The coach can decide, or return the choice to the parent. These lines are part of the saved story:

| semantic event | Russian |
| --- | --- |
| first arrival | `Она натрудила {partAcc}. Пока не травма.` |
| repeat arrival | `Снова болит {partNom} – то же место.` |
| coach asks on warn week | `Тренер не берётся решать в одиночку – только не на такой неделе. Беспокоит {partNom}.` |
| coach asks on repeat | `Тренер хочет обсудить {partAcc}, прежде чем принимать решение.` |
| coach is unsure | `Тренер сомневается, стоит ли тренироваться: беспокоит {partNom}. Решение оставляет нам.` |
| coach rests her | `Тренер оставляет её вне корта на эту неделю. Беспокоит {partNom}.` |
| coach lets her train | `Тренер разрешает продолжить тренировки, несмотря на боль: {partLocation}.` |
| parent rests | `Даём отдохнуть: беспокоит {partNom}. Неделя без тренировочного корта.` |
| parent pushes | `Продолжаем тренировки, несмотря на боль: {partLocation}. Тренер в курсе.` |

The unsure line is deliberately revoiced around `{partNom}`. It is clearer than adding a genitive
form needed by this line alone, and keeps the body catalogue to forms with demonstrated reuse.

## 20. Injury stop

This is a report after the fact, not a choice. Its voice may be clinical in the table, but the close
returns to the family. It must say the moment, the expected absence, the masseur-adjusted forecast
when present, and the exact tournament consequences.

### 20.1 Injury name and severity

Severity labels:

| semantic value | Russian |
| --- | --- |
| minor | `Лёгкая` |
| moderate | `Средняя` |
| major | `Серьёзная` |
| severe | `Тяжёлая` |

The present injury `kind` is an English concatenation of region plus descriptor. Russian needs a
semantic formatter:

| descriptor | Russian diagnosis pattern |
| --- | --- |
| niggle | `Лёгкий дискомфорт – {partLocation}` |
| soreness | `Боль – {partLocation}` |
| strain | `Растяжение – {partLocation}` |
| stress reaction | `Стрессовая реакция – {partLocation}` |
| tear | `Разрыв – {partLocation}` |

This restrained pattern avoids medically dubious constructions such as `разрыв колена`: the model
knows the region, not the exact tissue. It also covers all 12 × 5 combinations without 60 duplicate
strings. Legacy `kind` values can be deterministically split by the known descriptor suffix and the
longest known region prefix; unknown legacy values are a migration/LQA error in Russian mode, not an
English fallback.

### 20.2 Dialog frame and circumstance

| id | English | Russian |
| --- | --- | --- |
| RU05-I01 | `Injury – {week}` | `Травма – {week}` |
| RU05-I02 | `She had to stop.` | `Она не смогла продолжить.` |
| RU05-I03 | `She's hurt.` | `Она получила травму.` |
| RU05-I04 | `Injury` | `Травма` |
| RU05-I05 | `Severity` | `Тяжесть` |
| RU05-I06 | `How` | `Как это произошло` |
| RU05-I07 | `Out for` | `Пропустит` |
| RU05-I08 | `Cancelled` | `Отменено` |
| RU05-I09 | `Continue` | `Продолжить` |

Circumstance is assembled from independent facts, never from optional English fragments:

- off court: `Вне корта – проявилось между матчами.`;
- retired friendly: `На корте – пришлось остановиться во время тренировочного матча.`;
- retired tournament match: `На корте – пришлось остановиться по ходу матча.`;
- optional opponent sentence: `Соперница: {name}.`;
- optional stage sentence: `Стадия: {stage}.`;
- tournament close: `Достигнутый раунд остаётся за ней.`

This avoids declining a generated opponent name and an arbitrary stage label after `в`. `Стадия`
uses the same localized round catalogue as RU-04.

### 20.3 Absence and the masseur forecast

- clinic line: `Около {weeks}; вернётся примерно {week}.`;
- projected line: `С массажистом – скорее {weeks}; вернётся примерно {week}.`

`{weeks}` is a complete accusative duration: `1 неделю`, `2 недели`, `5 недель`. The tilde is removed
because `около` already marks an estimate and reads better aloud. Keep the two numbers when they
differ: the first is the dealt clinical layoff, the second the current service projection.

### 20.4 Entries lost, saved and still standing

| condition | Russian |
| --- | --- |
| each refundable entry | `Снята: {event} – {week}` |
| refund total | `Взносы возвращены: +{money}` |
| no withdrawal, closed lists | `Снять её не удалось – приём заявок уже закрыт.` |
| each forfeited entry | `Пропустит без возврата: {event} – {week}` |
| layoff reaches no held entry | `Ничего – травма не затрагивает её заявки.` |
| surviving future entries | `Отменены только турниры на время восстановления. Все заявки начиная с {week} остаются в силе.` |

`Снята` agrees with the daughter, not with the tournament. The forfeited line says both losses: she
will not appear and the fee does not return. The fallback no longer says merely `Nothing`, which in
Russian would obscure whether nothing was cancelled or nothing was lost.

Warm close:

> `Она вернётся после этой травмы. Сейчас – отдых и восстановление; за прогрессом можно следить в ленте.`

The promise is licensed because the table gives a finite return window. Do not reuse it on a
career-ending injury or any ending path without that fact.

### 20.5 Injury events and costs

The stop dialog reads structured facts, but the feed and financial history also need Russian
semantic forms:

| semantic event | Russian |
| --- | --- |
| medical expense | `Медицина – обследование и лечение` |
| ordinary injury | `Травма: {kind}; пропустит около {weeks}.` |
| ordinary injury after pushed knock | `Травма: {kind}; пропустит около {weeks}. То самое место, с которым мы продолжили тренировки.` |
| severe ordinary injury | `Плохие новости из клиники: {kind}; пропустит около {weeks}. Это удар по мечте.` |
| match retirement | `Она не смогла продолжить: {kind}; пропустит около {weeks}.` |
| match retirement after pushed knock | `Она не смогла продолжить: {kind}; пропустит около {weeks}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |
| severe match retirement | `Она остановилась, и на этот раз всё серьёзно: {kind}; пропустит около {weeks}. Это удар по мечте.` |

`{kind}` is already a capitalized diagnosis string only when it opens a sentence. Here it follows a
colon and should begin lowercase; the formatter needs sentence-position awareness or separate
capitalization at the rendering boundary, not capitalization stored in the diagnosis data.

### 20.6 Implementation and LQA contract

1. The snapshot should carry region/descriptor ids for injury and region id for a knock. Retaining
   legacy `kind`/`part` strings for save compatibility is fine; making Russian parse arbitrary prose
   at render time is not.
2. `KnockPrompt` currently contains five finished English sentences. Prefer semantic variant ids and
   parameters in the snapshot. Draw the variant engine-side on the existing keyed sub-stream, then
   localize it UI-side; never reroll per locale.
3. `circumstance` is already derived from typed report facts and is the right architectural model.
   Move its wording into localized semantic messages while keeping the DTO unchanged.
4. Exercise every body region, five diagnosis descriptors, four knock cause branches, three coach
   evidence bands, coach/parent routing, first/repeat push, all three injury circumstances,
   paid/zero refunds, closed lists, no affected entry and masseur forecast present/absent.
5. At 320/375 px and 200% text, the mandatory knock choices and Proceed must stay reachable; the
   injury report may scroll, and its Continue button must remain the last focusable control.

## 21. Final source-coverage boundary

The closing pass rechecked all five primary surfaces named by RU-05 and their direct string
producers. The remaining visible dependencies are assigned rather than silently omitted:

- `CountingResultsTable.vue`, country names and shared date/number formatting are completed with
  RU-07/RU-13; RU-05 owns the profile heading and explanatory sentence around that table;
- `SupportStaffTab.vue` and `HouseholdStrip.vue` are RU-06, even though Coach Market mounts them;
- private-life `moodWord` and saved weekly prose are RU-09; the eight ordinary profile mood labels
  are complete here;
- shared `StoreError`, confirm-dialog cancellation and takeover-shell mechanics use RU-01;
- ladder, tier, round and tournament labels reuse RU-04 and may not grow profile-only translations.

Source-side hazards found in this pass are now explicit implementation tasks: English prose crossing
the worker in `KidLife`, radar notes and `KnockPrompt`; English body regions and injury kinds stored
as strings; English-only week/date/money composition; and saved event rows whose translation cannot
be recovered from a generic literal after the fact.

Batch status: **drafted end to end**. The profile, life-stage language, full radar corpus, coach
market, weekly training matrix, future-week planner, knocks and injury-stop copy have all received a
source-coverage pass. Every Russian line remains `DRAFT` pending the owner's read.

## ⚙ 11.10 agent-authored (бланкет) – the knock dialog and the knock feed, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

§19 above drafted the knock over three forms of a body part (`{partNom}`, `{partAcc}`, `{partLocation}`) that a localized region id would supply. The live keys carry the part as **one English word in one hole**, `{0}`, and the card prints it as given. The 30 rows below are §19.3–§19.7 re-cut to that shape: the 21 sentences of `knock.ts` (the parent's line, the coach's read, the cause, the two costs) and the 9 feed rows of `world/knock.ts`. `DRAFT`, his live edit follows.

**Where a row leaves §19's mould.** The part has no case here, so each sentence that asked for the accusative or the locative (`придерживала {partAcc}`, `лёд на {partLocation}`) is built round a nominative: after a colon (`больное место: {0}`), a dash, or an impersonal verb (`болело`). The place stays `больное место` / `то же место` / `боль`, §19's own vocabulary (`Что-то побаливает`); the coach is the noun `тренер` in the present tense with no pronoun (R15-7); the family is `мы`. The costs and the cause are §19.5–§19.6's own sentences. This also answers the `QUESTION` row of §19.5, whose `{partLocation}` hole the key does not have.

**Seam that is code, not translation:** the part is an English word (`BODY_REGIONS`), so a Russian row prints `больное место: ankle`; every row already holds it in a nominative position, so none changes when it becomes a Russian name.

### The parent's line – a fresh knock

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-01 | `She came off court on Friday holding her {0}.` | `В пятницу она сошла с корта, держась за больное место: {0}.` |
| RU21-KNK-02 | `Her {0} was sore all week. She only said so on Sunday.` | `Всю неделю болело: {0}. Рассказала об этом только в воскресенье.` |
| RU21-KNK-03 | `Ice on her {0} after Thursday. She says it is fine.` | `После четверга – лёд на больном месте: {0}. Говорит, что всё в порядке.` |
| RU21-KNK-04 | `She has been favouring the {0} since midweek.` | `С середины недели она бережёт больное место: {0}.` |

### The parent's line – the same place again

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-05 | `It is the {0} again. She mentioned it in the car, then said it was nothing.` | `Снова жалуется: {0}. Сказала об этом в машине, а потом отмахнулась: ничего страшного.` |
| RU21-KNK-06 | `The same {0}. She rolled it out on the kitchen floor and did not look up.` | `Всё то же место – {0}. Разминала его на кухонном полу и не поднимала глаз.` |
| RU21-KNK-07 | `Her {0} is talking to her again. She knows we noticed.` | `Опять даёт о себе знать: {0}. Она понимает: мы заметили.` |

### The coach's read – a repeat

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-08 | `The coach was blunter this time – has seen this one before, and does not like it.` | `На этот раз тренер говорит жёстче: такое уже было, и это не нравится.` |
| RU21-KNK-09 | `The coach remembers the last time – would sit her down, and said so twice.` | `Тренер помнит прошлый раз и дважды повторяет: ей нужно пропустить неделю.` |
| RU21-KNK-10 | `The coach asked how long it has been doing this – and did not like the answer.` | `Первый вопрос тренера – как давно это продолжается. Ответ явно не понравился.` |

### The coach's read – she is worn

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-11 | `The coach thinks she is running on empty and the body is saying so.` | `По мнению тренера, она работает на пустом баке – организм даёт об этом знать.` |
| RU21-KNK-12 | `The coach has seen her tired for weeks – would take the week.` | `Тренер уже не первую неделю видит её уставшей и советует пропустить эту.` |
| RU21-KNK-13 | `The coach says a body this flat picks things up – and would rather not find out.` | `Тренер говорит: у вымотанного организма всё начинает болеть. Лучше не проверять, чем это кончится.` |

### The coach's read – an ordinary week

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-14 | `The coach is not worried – and is not telling us to ignore it either.` | `Тренер не тревожится, но и игнорировать это не советует.` |
| RU21-KNK-15 | `The coach shrugged – would let her train and keep an eye on it.` | `Тренер пожимает плечами: пусть тренируется, а за этим можно просто следить.` |
| RU21-KNK-16 | `The coach says it is probably nothing – probably, and that word is not ours.` | `Тренер говорит, что, скорее всего, ничего серьёзного. Но «скорее всего» – не наша уверенность.` |
| RU21-KNK-17 | `The coach says these come and go at her age – and left the decision with us.` | `Тренер говорит, что в её возрасте такое приходит и уходит, а решение оставляет нам.` |

### Why it may have happened

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-18 | `We sent her back out with a knock to her {0} before. Now the same place is troubling her again.` | `Раньше мы уже отправили её тренироваться с этой болью: {0}. Теперь снова беспокоит то же место.` |

### The two costs

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-19 | `A hug, the sofa, and a week of next to no tennis. That week of work is gone.` | `Обнять, уложить на диван и почти неделю не вспоминать о теннисе. Работа этой недели пропадёт.` |
| RU21-KNK-20 | `She trains as planned, and for the next three weeks the odds are against us.` | `Она тренируется по плану, а следующие три недели риск будет выше.` |
| RU21-KNK-21 | `She trains as planned. If this one goes, it goes properly – and it will be the same {0}.` | `Она тренируется по плану. Если теперь станет хуже, то всерьёз – и в том же месте: {0}.` |

### The knock feed – arrival

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-22 | `She has picked up a sore {0}. Not an injury – yet.` | `Что-то побаливает: {0}. Пока не травма.` |
| RU21-KNK-23 | `Her {0} is sore again – the same one.` | `Снова болит: {0} – то же место.` |

### The knock feed – the coach and the decision

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-24 | `The coach is not calling the {0} alone – not on a week like this.` | `Тренер не берётся решать в одиночку – только не на такой неделе. Что беспокоит: {0}.` |
| RU21-KNK-25 | `The coach wants to talk about her {0} before anyone decides.` | `Прежде чем решать, тренер хочет обсудить больное место: {0}.` |
| RU21-KNK-26 | `The coach is in two minds about the {0} – and is asking us.` | `Тренер сомневается, стоит ли тренироваться: {0}. Решение оставляет нам.` |
| RU21-KNK-27 | `The coach is keeping her off the court this week – the {0}.` | `Тренер оставляет её вне корта на эту неделю. Причина: {0}.` |
| RU21-KNK-28 | `The coach is happy for her to train through the {0}.` | `Тренер разрешает продолжить тренировки, несмотря на боль: {0}.` |

### The knock feed – the family's choice

| id | English | Russian |
| --- | --- | --- |
| RU21-KNK-29 | `Resting the {0} – a week off the training court.` | `Даём отдохнуть больному месту: {0}. Неделя без тренировочного корта.` |
| RU21-KNK-30 | `Training through the {0}. The coach knows.` | `Продолжаем тренировки, несмотря на боль: {0}. Тренер в курсе.` |

## ⚙ 11.10 agent-authored (бланкет) – the coach market, the week plan, the injury stop and the profile, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

111 keys of `CoachMarketScreen.vue`, `HerWeekTab.vue`, `PlanWeekSheet.vue`, `InjuryStopDialog.vue`, `KidScreen.vue`, `SkillsRadar.vue` and `weekGrid.ts`. RU-05's own sentences are kept wherever they say the same thing – and most of them (W03, W06–W08, W11, W12, W16, W17, W24–W27, R11) sit in rows with four cells under a three-cell header that the parser skips, so they never compiled; the cells below are their compiled home. `{0} sessions, {1} hours{2} – {3}.{4}` is a frame whose parts are keys of their own (`, в 2 дня по две тренировки`, `3 дня без занятий`, `$120 за неделю.`); the Russian frame joins them with a semicolon and counts both nouns. The coach-tier words (`Элитный`, `Средний` …) are adjectives, so `{0} tier` is `{0} уровень`. The trips counted phrase (`1 trip`, `{0} trips`) is handed into RU05-C19 (`В следующих {2} …`, a prepositional) and RU05-C20 (`По заявленным на сезон {2} …`, a dative): one phrase cannot be both, it is written in the prepositional and C20 reads wrong until it is re-cut. The session kinds of the week grid are short nouns (`Подача`, `Приём подачи`, `Игра с лёта`).

| id | English | Russian |
| --- | --- | --- |
| RU21-PRF-01 | `, {0} of them two sessions a day` | `, из них {0, plural, one {{0} день} few {{0} дня} many {{0} дней} other {{0} дня}} – по две тренировки` |
| RU21-PRF-02 | `1 day off` | `один день без занятий` |
| RU21-PRF-03 | `No school this week – a day can take two sessions, if you want them.` | `На этой неделе нет школы – в день можно провести две тренировки, если захотите.` |
| RU21-PRF-04 | `One session a day this week – the dots are the room each day has left.` | `На этой неделе – по одной тренировке в день; точки показывают, сколько места осталось в каждом дне.` |
| RU21-PRF-05 | `One session a day while school is on – the dots are the room each day has left.` | `Пока идёт школа – по одной тренировке в день; точки показывают, сколько места осталось в каждом дне.` |
| RU21-PRF-06 | `Tick "{0}" to plan it again – it lets the coach go.` | `Отметьте «{0}», чтобы снова планировать неделю самим – тренер при этом уходит.` |
| RU21-PRF-07 | `Your coach` | `Ваш тренер` |
| RU21-PRF-08 | `{0} days off` | `{0, plural, one {{0} день} few {{0} дня} many {{0} дней} other {{0} дня}} без занятий` |
| RU21-PRF-09 | `{0} h` | `{0} ч` |
| RU21-PRF-10 | `{0} on {1}` | `{0}: {1}` |
| RU21-PRF-11 | `{0} sessions is her maximum – untick one to move it.` | `Максимум для неё – {0, plural, one {{0} тренировка} few {{0} тренировки} many {{0} тренировок} other {{0} тренировки}}; чтобы перенести тренировку, снимите отметку с одной из них.` |
| RU21-PRF-12 | `{0} sessions is her minimum – tick another before you take one away.` | `Минимум для неё – {0, plural, one {{0} тренировка} few {{0} тренировки} many {{0} тренировок} other {{0} тренировки}}; прежде чем снять отметку, поставьте её на другом дне.` |
| RU21-PRF-13 | `{0} sessions, {1} hours{2} – {3}.{4}` | `{0, plural, one {{0} тренировка} few {{0} тренировки} many {{0} тренировок} other {{0} тренировки}}, {1, plural, one {{1} час} few {{1} часа} many {{1} часов} other {{1} часа}}{2}; {3}.{4}` |
| RU21-PRF-14 | `{0} sets her week.` | `{0} планирует её неделю.` |
| RU21-PRF-15 | `{0} this week.` | `{0} за неделю.` |
| RU21-PRF-16 | `{0} – {1} of {2} sessions` | `{0} – {1} из {2, plural, one {{2} тренировки} few {{2} тренировок} many {{2} тренировок} other {{2} тренировки}}` |
| RU21-PRF-17 | `Fees refunded: +{0}` | `Возвращено взносов: +{0}` |
| RU21-PRF-18 | `Forfeited: {0}` | `Взнос потерян: {0}` |
| RU21-PRF-19 | `Major` | `Серьёзная` |
| RU21-PRF-20 | `Minor` | `Лёгкая` |
| RU21-PRF-21 | `Moderate` | `Умеренная` |
| RU21-PRF-22 | `Nothing – the layoff reaches no entry she holds` | `Ничего – пауза не затрагивает ни одной её заявки` |
| RU21-PRF-23 | `Nothing – those lists had closed.` | `Ничего – эти списки уже закрылись.` |
| RU21-PRF-24 | `Off court – it came on between matches.` | `Вне корта – травма появилась между матчами.` |
| RU21-PRF-25 | `On court – she had to stop during a practice match against {0}.` | `На корте – она не смогла доиграть тренировочный матч; соперница – {0}.` |
| RU21-PRF-26 | `On court – she had to stop during a practice match.` | `На корте – она не смогла доиграть тренировочный матч.` |
| RU21-PRF-27 | `On court – she had to stop mid-match against {0} in the {1}. The round she had reached is hers.` | `На корте – она не смогла доиграть матч; соперница – {0}, стадия – {1}. Достигнутый круг остаётся за ней.` |
| RU21-PRF-28 | `On court – she had to stop mid-match against {0}. The round she had reached is hers.` | `На корте – она не смогла доиграть матч; соперница – {0}. Достигнутый круг остаётся за ней.` |
| RU21-PRF-29 | `On court – she had to stop mid-match in the {0}. The round she had reached is hers.` | `На корте – она не смогла доиграть матч; стадия – {0}. Достигнутый круг остаётся за ней.` |
| RU21-PRF-30 | `On court – she had to stop mid-match. The round she had reached is hers.` | `На корте – она не смогла доиграть матч. Достигнутый круг остаётся за ней.` |
| RU21-PRF-31 | `Only the weeks she is out are cancelled – anything from {0} on is still booked.` | `Отменены только недели, которые она пропускает; всё, что идёт с {0} и позже, остаётся в силе.` |
| RU21-PRF-32 | `Severe` | `Тяжёлая` |
| RU21-PRF-33 | `She comes back from this. Rest and rehab now – the news feed tracks her recovery.` | `Она оправится от этой травмы. Сейчас – отдых и восстановление; как она поправляется, видно в ленте новостей.` |
| RU21-PRF-34 | `With the masseur – more like {0} wk, back around {1}.` | `С массажистом – скорее {0} нед. Вернётся примерно: {1}.` |
| RU21-PRF-35 | `With the masseur – more like {0} wks, back around {1}.` | `С массажистом – скорее {0} нед. Вернётся примерно: {1}.` |
| RU21-PRF-36 | `Withdrawn: {0}` | `Заявка снята: {0}` |
| RU21-PRF-37 | `~{0} wk – back around {1}` | `~{0} нед. – вернётся примерно: {1}` |
| RU21-PRF-38 | `~{0} wks – back around {1}` | `~{0} нед. – вернётся примерно: {1}` |
| RU21-PRF-39 | `+{0} condition → {1}/100` | `Форма +{0} → {1}/100` |
| RU21-PRF-40 | `A friendly at the club – watchable, no ranking points. One notch of fatigue, and she keeps her base recovery but loses the rest bonus for the week.` | `Тренировочный матч в клубе можно посмотреть, но рейтинговых очков за него нет. Он добавит немного усталости: обычное восстановление сохранится, а бонус за неделю отдыха – нет.` |
| RU21-PRF-41 | `A week away – no tournaments that week, and she comes back fresher. Cancel any time before the week starts for a full refund.` | `Неделя отдыха без турниров – она вернётся свежее. До начала недели бронь можно отменить с полным возвратом.` |
| RU21-PRF-42 | `Cancel any time before the week starts and nothing is owed either way.` | `До начала недели бронь можно отменить: платить всё равно не за что.` |
| RU21-PRF-43 | `Cancel any time before the week starts and the money comes back in full.` | `До начала недели бронь можно отменить с полным возвратом.` |
| RU21-PRF-44 | `Off-season – family time, no matches. Try the Vacation tab.` | `Межсезонье – время для семьи, без матчей. Выберите вкладку «Отпуск».` |
| RU21-PRF-45 | `plan\|Cancel` | `Отмена` |
| RU21-PRF-46 | `{0} A friendly is still a match, so it is out too at condition {1} – try the Vacation tab, or leave the week to training.` | `{0} Тренировочный матч тоже требует допуска, а при форме {1}/100 его нет. Выберите отпуск или оставьте неделю для обычных тренировок.` |
| RU21-PRF-47 | `{0} A friendly is still a match, so the week books nothing until she is back – leave it to rest.` | `{0} Тренировочный матч всё равно остаётся матчем, поэтому до её возвращения забронировать его нельзя. Оставьте эту неделю для отдыха.` |
| RU21-PRF-48 | `{0} A week away is still hers to book – the trip is rest, not tennis.` | `{0} Отпуск всё равно можно забронировать: поездка – это отдых, а не теннис.` |
| RU21-PRF-49 | `{0} · condition {1}/100` | `{0} · форма {1}/100` |
| RU21-PRF-50 | `{0} – booked, {1}. She plays no tournament while she is away.` | `{0} – забронировано: {1}. На этой неделе она не играет на турнирах.` |
| RU21-PRF-51 | `· injury risk −{0}% for {1} weeks` | `· риск травмы −{0}% на {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}` |
| RU21-PRF-52 | `price\|free` | `бесплатно` |
| RU21-PRF-53 | `+{0}-{1}% a season` | `+{0}–{1}% за сезон` |
| RU21-PRF-54 | `+{0}-{1}% per match` | `+{0}–{1}% за матч` |
| RU21-PRF-55 | `+{0}-{1}% travelling with her` | `+{0}–{1}% в поездках с ней` |
| RU21-PRF-56 | `, chemistry {0}%` | `, взаимопонимание {0}%` |
| RU21-PRF-57 | `/week free` | `в неделю свободно` |
| RU21-PRF-58 | `1 more trip` | `ещё 1 поездка` |
| RU21-PRF-59 | `1 trip` | `1 поездке` |
| RU21-PRF-60 | `Chemistry with her: {0}%` | `Взаимопонимание с ней: {0}%` |
| RU21-PRF-61 | `Coach her yourself` | `Тренировать её самим` |
| RU21-PRF-62 | `Coach travels to junior and domestic tournaments – off. Press to buy the additional fare on those trips too.` | `Тренер ездит на юниорские и национальные турниры – выключено. Нажмите, чтобы покупать дополнительный билет и на эти поездки.` |
| RU21-PRF-63 | `Coach travels to junior and domestic tournaments – on. Press to stop paying the additional fare on the trips that pay no prize money.` | `Тренер ездит на юниорские и национальные турниры – включено. Нажмите, чтобы больше не платить за дополнительный билет в поездках без призовых.` |
| RU21-PRF-64 | `Coach travels to tournaments with her – off. Press to buy one additional fare per trip.` | `Тренер ездит с ней на турниры – выключено. Нажмите, чтобы покупать по одному дополнительному билету на каждую поездку.` |
| RU21-PRF-65 | `Coach travels to tournaments with her – on. Press to send the coach home for competition weeks.` | `Тренер ездит с ней на турниры – включено. Нажмите, чтобы в турнирные недели тренер оставался дома.` |
| RU21-PRF-66 | `Every coach here also takes` | `Каждый тренер здесь также берёт` |
| RU21-PRF-67 | `Every price below is {0} sessions a week – more sessions, more money.` | `Все цены ниже рассчитаны на {0, plural, one {{0} тренировку} few {{0} тренировки} many {{0} тренировок} other {{0} тренировки}} в неделю: больше тренировок – выше оплата.` |
| RU21-PRF-68 | `Hire {0} at {1} a week? {2}` | `Нанять тренера: {0} – {1} в неделю? {2}` |
| RU21-PRF-69 | `Let {0} go? She is self-coached from this week: the weekly bill becomes court time only, and the trained eye you were paying for goes too.` | `Уволить: {0}? С этой недели она занимается без тренера: в еженедельный счёт войдёт только аренда корта, а опытный взгляд, за который вы платили, уйдёт вместе с тренером.` |
| RU21-PRF-70 | `Showing fit against {0}, not the game she plays.` | `Показано соответствие стилю «{0}», а не той игре, которую она ведёт.` |
| RU21-PRF-71 | `You are coaching her yourself. The weekly bill is court time only.` | `Вы тренируете её самостоятельно. В еженедельном счёте только аренда корта.` |
| RU21-PRF-72 | `You can always take her back onto the court yourself. The weekly bill becomes court time only.` | `Вы всегда можете снова тренировать её самостоятельно. Тогда в еженедельном счёте останется только аренда корта.` |
| RU21-PRF-73 | `Your weekly coaching bill does not change.` | `Еженедельный счёт за тренера не изменится.` |
| RU21-PRF-74 | `Your weekly coaching bill falls by {0}.` | `Еженедельный счёт за тренера уменьшится на {0}.` |
| RU21-PRF-75 | `Your weekly coaching bill rises by {0}.` | `Еженедельный счёт за тренера увеличится на {0}.` |
| RU21-PRF-76 | `a week at her current plan – {0} over {1} weeks.` | `в неделю при её нынешнем плане – {0} за {1, plural, one {{1} неделю} few {{1} недели} many {{1} недель} other {{1} недели}}.` |
| RU21-PRF-77 | `her coach now` | `сейчас её тренер` |
| RU21-PRF-78 | `hire` | `можно нанять` |
| RU21-PRF-79 | `locked, {0} ranking points short` | `закрыто: не хватает {0, plural, one {{0} рейтингового очка} few {{0} рейтинговых очков} many {{0} рейтинговых очков} other {{0} рейтингового очка}}` |
| RU21-PRF-80 | `of every prize cheque she collects.` | `от каждого призового чека, который она получает.` |
| RU21-PRF-81 | `your coach` | `ваш тренер` |
| RU21-PRF-82 | `{0} coaches` | `{0, plural, one {{0} тренер} few {{0} тренера} many {{0} тренеров} other {{0} тренера}}` |
| RU21-PRF-83 | `{0} more trips` | `ещё {0, plural, one {{0} поездка} few {{0} поездки} many {{0} поездок} other {{0} поездки}}` |
| RU21-PRF-84 | `{0} pts short` | `Не хватает {0, plural, one {{0} очка} few {{0} очков} many {{0} очков} other {{0} очка}}` |
| RU21-PRF-85 | `{0} trips` | `{0, plural, one {{0} поездке} few {{0} поездках} many {{0} поездках} other {{0} поездках}}` |
| RU21-PRF-86 | `{0} {1} over the {2} on her card this season.` | `{0} В карточке этого сезона: {2} – {1}.` |
| RU21-PRF-87 | `{0} {1}/wk` | `{0} {1}/нед.` |
| RU21-PRF-88 | `{0}, {1} tier, {2}, {3} a week{4} – {5}` | `{0}, {1} уровень, {2}, {3} в неделю{4} – {5}` |
| RU21-PRF-89 | `{0}-{1} /wk` | `{0}–{1} в неделю` |
| RU21-PRF-90 | `{0} tier` | `{0} уровень` |
| RU21-PRF-91 | `College – {0}` | `Университет – {0}` |
| RU21-PRF-92 | `Counter­puncher` | `Контратакующая игра` |
| RU21-PRF-93 | `Her skills: serve, return, composure, stamina and groundstrokes. The dashed contour is where she started, the solid one is where she is today, and the haze around them is how far she could go.` | `Её навыки: подача, приём, хладнокровие, выносливость и удары с отскока. Пунктирный контур – с чего она начинала, сплошной – где она сейчас, а дымка вокруг – до чего она может дойти.` |
| RU21-PRF-94 | `Her {0} rank counts her {1} best {2} results from the last 52 weeks. Full tables are on the Stats tab.` | `Её рейтинг ({0}) считается по лучшим результатам за последние 52 недели – их число: {1}; таблица результатов: {2}. Полные таблицы – на вкладке «Рейтинг».` |
| RU21-PRF-95 | `School – {0}` | `Школа – {0}` |
| RU21-PRF-96 | `What her coach can tell so far. The dashed shape is where she started, the solid shape is where she is, and the haze around them is how far she might go. All three sharpen as the coach learns her.` | `Что тренер может сказать на данный момент. Пунктирная форма – с чего она начинала, сплошная – где она сейчас, а дымка вокруг – до чего она может дойти. Все три уточняются, пока тренер узнаёт её лучше.` |
| RU21-PRF-97 | `What you can tell so far. The dashed shape is where she started, the solid shape is where she is, and the haze around them is how far she might go. All three sharpen as you learn her.` | `Что вы можете сказать на данный момент. Пунктирная форма – с чего она начинала, сплошная – где она сейчас, а дымка вокруг – до чего она может дойти. Все три уточняются, пока вы узнаёте её лучше.` |
| RU21-PRF-98 | `{0} years old · B-Day {1}` | `{0, plural, one {{0} год} few {{0} года} many {{0} лет} other {{0} года}} · День рождения: {1}` |
| RU21-PRF-99 | `Too early to say – still learning what she has.` | `Пока рано судить – мы ещё разбираемся, что у неё есть.` |
| RU21-PRF-100 | `Core work` | `Работа над кором` |
| RU21-PRF-101 | `Gym drills` | `Упражнения в зале` |
| RU21-PRF-102 | `Leg work` | `Работа над ногами` |
| RU21-PRF-103 | `Net play` | `Игра у сетки` |
| RU21-PRF-104 | `Point play` | `Игра на очки` |
| RU21-PRF-105 | `Rally work` | `Розыгрыши` |
| RU21-PRF-106 | `Rehab gym` | `Зал: восстановление` |
| RU21-PRF-107 | `Return work` | `Приём подачи` |
| RU21-PRF-108 | `Serve work` | `Подача` |
| RU21-PRF-109 | `Speed work` | `Скорость` |
| RU21-PRF-110 | `Summer read` | `Летнее чтение` |
| RU21-PRF-111 | `Volley work` | `Игра с лёта` |

## ⚙ 11.10 agent-authored (бланкет) – the coach market's own prose, and the Kid screen's tiles (RU-23)

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

The last English the product still spoke in connected sentences: the coach market (the room note, the decline note, the style profile, the load note, the plaque, the sixteen portraits' bios) and the lines of the Kid screen's tiles that the display-boundary wave could not read (the personality line, the school and college tile, the friends tile's lead). All of it is **engine copy shown through the catalogue**, by three mechanisms:

- **The three notes that carry a count or a rank move ride a `CopyRef` the engine writes beside the string** – `Snapshot.coachNotesC` (its `room`, `decline` and `short`; class (b): derived at snapshot time, persisted nowhere, no migration, no schema move). A note is a **read**: a label, the short dash and an argument, each a ref of its own (`Past her peak` and `down {0} on the year, and {1}.`, joined by `read|{0}{1}{2}`), so the screen that sets the label in bold shows the two halves each in the player's language instead of cutting a sentence it has already translated.
- **The closed pools are read through the catalogue by `engineText`** (the seat `engine.text`): the bios, the four load notes, the profile's four labels and four arguments, the plaque's eleven sentences and the travel line. The profile has no ref – it is a pure look-up the screen calls – so the screen cuts the English at its dash with the engine's own splitter and reads each half.
- **The Kid tiles are read by shape** (`engineTile`, `src/i18n/words.ts`): a sentence matcher per tile line, each shape asking the catalogue for its whole sentence.

**Rows that were already on file and are woken by the new keys, not repeated here.** The sixteen bios (§16.2 above), the eight words of the personality line (§4), the six school notes (§5.2) and the eight stage lines after school (§5.3) had a clean English cell and no live key; the seats and readers gave them one, so they compile as the owner's editorial pass wrote them. Five cells of §4–§5 needed a touch to compile or to be right, and are fixed in place with their wording kept: the three whose hole was named differently in the Russian than in the English cell (`{ordinal}-й класс`, `{y}-й курс из {total}` twice), `{n} years done` (the same, plus its plural: `4 года учёбы`), and `{done} of {total} years` (left early), which was woken and was wrong as a form – `{done} курса из {total}` read «1 курса из 4» – and now carries its plural.

**How the reads are cut.** The bold label is the first part and the tail is the separator and the second part; in Russian the separator is the same short dash (`Пик позади – …`), set by the code (`ROOM_NOTE_SEP`, a parameter of the join), not by a row. The decline note's three arguments are three whole sentences with two holes – the rank move and the clause about what is left – and both holes are messages, so each carries its own plural: the rank move (`1 место`, `3 места`, `57 мест`) and the seasons (`до последнего межсезонья осталось 3 сезона`, `у организма осталось около 3 сезонов`). The label `Пик позади` is one row, shared by the long note and the short plate.

**Two deliberate reworkings of the §16.5 draft.** The draft's last-winter clause was `до последнего межсезонья – {seasons}`; a clause that follows the label's dash would read as a second dash, so it is a verb phrase (`до последнего межсезонья осталось 3 сезона`). And the two clauses of the short plate that differ from the long note's in English (`her last winter is next` against `her last winter is the next one`) share one Russian reading.

**The Russian is the coach's: plain, dry, a claim about her and nothing else.** No sentence names the coach's sex (R15-7: `работает с юниорками`, not `работал`), none quotes a number except the rank move and the seasons the note has always carried, and the plaque keeps RU-05's first-person fragments (`выше моих ожиданий`), which work for a coach of either gender.

### The reads' own key and the decline note

`read|{0}{1}{2}` is the key every read is joined with – the label, the dash, the argument – and its row is the identity, kept as a row so the translator sees the join. The label, the three arguments, the two forms of a rank move and the four clauses about what is left follow. A rank move is accusative after `на` in both arms that use it; the seasons are the genitive after `около` and the verb phrase after `до последнего межсезонья`.

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-01 | `read\|{0}{1}{2}` | `{0}{1}{2}` |

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-02 | `Past her peak` | `Пик позади` |
| RU23-CMK-03 | `down {0} on the year, and {1}.` | `за год опустилась на {0}, и {1}.` |
| RU23-CMK-04 | `{0} below her best season, and {1}.` | `на {0} ниже своего лучшего сезона, и {1}.` |
| RU23-CMK-05 | `{0}, and no coach buys that back.` | `{0}, и никакой тренер этого не вернёт.` |
| RU23-CMK-06 | `gap\|1 place` | `1 место` |
| RU23-CMK-07 | `gap\|{0} places` | `{0, plural, one {{0} место} few {{0} места} many {{0} мест} other {{0} места}}` |
| RU23-CMK-08 | `her last winter is the next one` | `следующее межсезонье станет последним` |
| RU23-CMK-09 | `her last winter is {0} seasons away` | `до последнего межсезонья {0, plural, one {остался {0} сезон} few {осталось {0} сезона} many {осталось {0} сезонов} other {осталось {0} сезона}}` |
| RU23-CMK-10 | `her body has about 1 more season in it` | `у организма осталось около 1 сезона` |
| RU23-CMK-11 | `her body has about {0} more seasons in it` | `у организма осталось около {0, plural, one {{0} сезона} few {{0} сезонов} many {{0} сезонов} other {{0} сезона}}` |

### The room note – a growing career

The label and the argument of each rung of the headroom ladder (RU-05 §16.4, columns one to three), and Home's short form of the first (the other three shorts are the labels verbatim – one key each, not two). None of them contains a digit (the fog of war).

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-12 | `Huge potential` | `Огромный потенциал` |
| RU23-CMK-13 | `most of her game is still ahead of her, and this is where a coach buys the most.` | `большая часть её игры ещё впереди, и здесь тренер даёт больше всего.` |
| RU23-CMK-14 | `Still room to grow` | `Ещё есть куда расти` |
| RU23-CMK-15 | `there is real room left in her game, and a coach is what buys it.` | `в её игре остаётся заметный запас, и раскрыть его помогает тренер.` |
| RU23-CMK-16 | `Close to her ceiling` | `Близко к потолку` |
| RU23-CMK-17 | `she is running out of room, and every rung is worth less than it was.` | `запас заканчивается, и каждый следующий уровень даёт меньше прежнего.` |
| RU23-CMK-18 | `At her ceiling` | `У своего потолка` |
| RU23-CMK-19 | `no coach can add much more now, whatever the price.` | `сейчас ни один тренер, независимо от цены, не добавит многого.` |
| RU23-CMK-20 | `Most of her game ahead` | `Большая часть игры впереди` |

### Home's short plate – past her peak

The rotation's pick: `she's down N places` early in the season, the below-her-best ladder late (`She's below her best` / `far below` / `way below` are RU21-TAL-09 – 11, already on file) and the seasons read in the middle. The plate has no room for the long form, so the rank move is the bare phrase.

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-21 | `She's down {0}` | `Она опустилась на {0}` |
| RU23-CMK-22 | `her last winter is next` | `следующее межсезонье станет последним` |
| RU23-CMK-23 | `about 1 season left` | `осталось около 1 сезона` |
| RU23-CMK-24 | `about {0} seasons left` | `осталось около {0, plural, one {{0} сезона} few {{0} сезонов} many {{0} сезонов} other {{0} сезона}}` |

### What the rung buys – the load note and the profile

RU-05 §16.3, under the English cells they were drafted for. The load note is `coachLoadNote`; the profile is `coachProfileNote`, four sentences cut at their dash into a label and an argument (eight rows). No sentence takes a pronoun for the coach.

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-25 | `Basic physio – the easy calls are handled, and the rest come to you.` | `Базовая физиотерапия: простые решения принимают без вас, остальные оставляют вам.` |
| RU23-CMK-26 | `Proper physio – most weeks are decided without you.` | `Полноценная физиотерапия: большинство недель обходится без вашего решения.` |
| RU23-CMK-27 | `A good medical team – you are rarely the one asked.` | `Хорошая медицинская команда: к вам обращаются редко.` |
| RU23-CMK-28 | `The best medical team money buys – her body is handled, and you hear about it after.` | `Лучшая медицинская команда, которую можно купить: о её теле заботятся, а вы узнаёте уже о результате.` |
| RU23-CMK-29 | `Above the rung` | `Выше уровня` |
| RU23-CMK-30 | `the style match buys more here than the price does.` | `сочетание стилей даёт больше, чем одна цена.` |
| RU23-CMK-31 | `The rung's pace` | `Темп уровня` |
| RU23-CMK-32 | `the style adds nothing to it and takes nothing away.` | `стиль ничего не добавляет и ничего не отнимает.` |
| RU23-CMK-33 | `Under the rung` | `Ниже уровня` |
| RU23-CMK-34 | `the style gives back much of what the price buys.` | `из-за стиля теряется многое из того, что покупает цена.` |
| RU23-CMK-35 | `Under your own hours` | `Медленнее ваших тренировок` |
| RU23-CMK-36 | `for her game, this teaches slower than you do.` | `для её игры этот тренер развивает навыки медленнее вас.` |

### The plaque and the travel line

RU-05 §16.4: the two arms before the verdict, and the verdict as three tenures over three placements – nine whole sentences, because the placement fragment follows the tenure's clause. `Her progress` is the shared referent of both arms. The last row is the sentence under the second figure (`TRAVEL_EDGE_LINE`).

| id | English | Russian |
| --- | --- | --- |
| RU23-CMK-37 | `Her progress – I will know in the off-season.` | `Её прогресс – в межсезонье будет понятнее.` |
| RU23-CMK-38 | `Her progress – too soon, ask next off-season.` | `Её прогресс – времени прошло мало, вернёмся к этому в следующее межсезонье.` |
| RU23-CMK-39 | `A season in – it looks like more than I had hoped for.` | `После первого сезона похоже, что темп выше моих ожиданий.` |
| RU23-CMK-40 | `A season in – it looks like about the pace I expected.` | `После первого сезона похоже, что темп примерно такой, как ожидалось.` |
| RU23-CMK-41 | `A season in – it looks like less than I had hoped for.` | `После первого сезона похоже, что темп ниже моих ожиданий.` |
| RU23-CMK-42 | `Two seasons in and it holds – more than I had hoped for.` | `После двух сезонов оценка держится: темп выше моих ожиданий.` |
| RU23-CMK-43 | `Two seasons in and it holds – about the pace I expected.` | `После двух сезонов оценка держится: темп примерно такой, как ожидалось.` |
| RU23-CMK-44 | `Two seasons in and it holds – less than I had hoped for.` | `После двух сезонов оценка держится: темп ниже моих ожиданий.` |
| RU23-CMK-45 | `Season after season – more than I had hoped for.` | `Сезон за сезоном: темп выше моих ожиданий.` |
| RU23-CMK-46 | `Season after season – about the pace I expected.` | `Сезон за сезоном: темп примерно такой, как ожидалось.` |
| RU23-CMK-47 | `Season after season – less than I had hoped for.` | `Сезон за сезоном: темп ниже моих ожиданий.` |
| RU23-CMK-48 | `Twice that on the trips the coach travels to.` | `На турнирах, куда едет тренер, эффект вдвое выше.` |

### The Kid screen's tiles

`kidLife.ts` composes the lines in English; the reader matches the SHAPE and asks for the sentence, so Russian owns the order and the plural (`1-й курс из 4`, `4 года учёбы`). `{0} years done` has two readings by the tile's lead: under `Graduate` it is a degree (`4 года учёбы`, RU-05's row), under `The last bell` it is the school (`Школа окончена`) – one English shape, two Russian sentences, told apart by the first line of the tile. `The last bell` and `12 years done` are the §5.3 row that carried a `QUESTION` («ключ умер»): the key is live now, and the rows here are the live ones.

| id | English | Russian |
| --- | --- | --- |
| RU23-KID-01 | `The last bell` | `Последний звонок` |
| RU23-KID-02 | `12 years done` | `Школа окончена` |
| RU23-KID-03 | `Close to {0}` | `Дружит с {0}` |
| RU23-KID-04 | `{0} next door` | `{0} всегда рядом` |

### The friend's name

The sixteen names are localized data (RU-05 §6): the nominative for `{0} next door` (`Эмма всегда рядом`), the instrumental for `Close to {0}` (`Дружит с Эммой`) – an ending no suffix at the call site can build. `Зои`, `Ирис`, `Нур`, `Юки`, `Инес` and `Элиф` do not decline; `Миа` is declined like the other names in `-а`. A friend is a first name in a phrase, never a brand or a tournament, so the names are rows and not Latin identity rows (§9.5 is about those).

| id | English | Russian |
| --- | --- | --- |
| RU23-KID-05 | `friend\|Emma` | `Эмма` |
| RU23-KID-06 | `friend\|Mia` | `Миа` |
| RU23-KID-07 | `friend\|Sofia` | `София` |
| RU23-KID-08 | `friend\|Nina` | `Нина` |
| RU23-KID-09 | `friend\|Lena` | `Лена` |
| RU23-KID-10 | `friend\|Zoe` | `Зои` |
| RU23-KID-11 | `friend\|Iris` | `Ирис` |
| RU23-KID-12 | `friend\|Maja` | `Майя` |
| RU23-KID-13 | `friend\|Noor` | `Нур` |
| RU23-KID-14 | `friend\|Yuki` | `Юки` |
| RU23-KID-15 | `friend\|Alba` | `Альба` |
| RU23-KID-16 | `friend\|Ines` | `Инес` |
| RU23-KID-17 | `friend\|Sara` | `Сара` |
| RU23-KID-18 | `friend\|Elif` | `Элиф` |
| RU23-KID-19 | `friend\|Hana` | `Хана` |
| RU23-KID-20 | `friend\|Aida` | `Аида` |
| RU23-KID-21 | `with\|Emma` | `Эммой` |
| RU23-KID-22 | `with\|Mia` | `Мией` |
| RU23-KID-23 | `with\|Sofia` | `Софией` |
| RU23-KID-24 | `with\|Nina` | `Ниной` |
| RU23-KID-25 | `with\|Lena` | `Леной` |
| RU23-KID-26 | `with\|Zoe` | `Зои` |
| RU23-KID-27 | `with\|Iris` | `Ирис` |
| RU23-KID-28 | `with\|Maja` | `Майей` |
| RU23-KID-29 | `with\|Noor` | `Нур` |
| RU23-KID-30 | `with\|Yuki` | `Юки` |
| RU23-KID-31 | `with\|Alba` | `Альбой` |
| RU23-KID-32 | `with\|Ines` | `Инес` |
| RU23-KID-33 | `with\|Sara` | `Сарой` |
| RU23-KID-34 | `with\|Elif` | `Элиф` |
| RU23-KID-35 | `with\|Hana` | `Ханой` |
| RU23-KID-36 | `with\|Aida` | `Аидой` |

## ⚙ 13.10 agent-authored (бланкет) – r51 B4, item №7: what the hired coach says about a trip, as whole keys

⚖ 14.10 владелец: «по остальным к вычитке ок» – ряды этого раздела `APPROVED`.

⚙ 13.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's item №7: «Your coach would save her... нет перевода ни в попапе при заявке, ни на самой карточке в Сезоне».

The hired coach's opinion about a trip was the last English printed as a finished sentence on a tournament card: eight sentences, written by the engine (`coachEntryLine` – how tired she is; `coachLadderNote` – which tournament he would rather she played), shown in four places – the entry confirm, the Season card, the next-tournament panel and the Calendar's marker card. They are `CopyRef`s now, beside the English string on the card (`UpcomingEvent.coachCautionC`; class (b): derived at snapshot time, persisted nowhere, no schema move), and the four places render the ref. English is unchanged to the byte: the string is the ref rendered under the source locale.

- **A tournament's name inside a sentence stays as it is** (`«{0}»`). Names are untranslated everywhere in the app today; this sentence does not decide otherwise, only the words around the name are Russian.
- **`{1}` in the first of the three «this week» sentences is the table's compact name** – `страна`, `юниоры`, `профи`, the words the Stats tiles already print (hole-table class `ladder`) – in the shape the ranking rows already use (`рейтинг (страна)`).
- **The counted tail of the last sentence is two keys of its own** (`when|next week`, `when|in {0} weeks`), the shape of `gap|{0} places`: the plural lives in the Russian row, not in an English number the engine spelled. The `when|` tag is stripped before English is shown; it only keeps these fragments from ever being the translation of a stand-alone «next week».
- **The coach's register is the rest of this file's**: plain, dry, a claim about her. No verb names the coach's sex (`советует`, `говорит`, `считает` – present tense – never `повёз бы`, `приберёг бы`), the same rule the knock's coach read follows (§19.4).
- **Vocabulary is the card's own**: `уровень пройден` is the chip the Season card already prints for an outgrown tournament; `титул` is `phrase|title`; `повлиять на её рейтинг` is the row `{0} could not move her {1} ranking`.

| id | English | Russian | Status |
| --- | --- | --- | --- |
| RU23-CMK-49 | `Your coach would not take her. She is empty.` | `Тренер не советует брать её на этот турнир. Сил у неё не осталось.` | `APPROVED` |
| RU23-CMK-50 | `Your coach would skip this one and get her legs back.` | `Тренер советует пропустить этот турнир и вернуть ногам лёгкость.` | `APPROVED` |
| RU23-CMK-51 | `Your coach thinks she is a week short of her best for this.` | `Тренер считает, что для этого турнира ей не хватает недели до лучшей формы.` | `APPROVED` |
| RU23-CMK-52 | `Your coach says the {0} is the week – this pays {1} points, not the table she is climbing.` | `Тренер говорит, что на этой неделе стоит играть «{0}» – здесь очки идут в другой рейтинг ({1}), а не в тот, по которому она поднимается.` | `APPROVED` |
| RU23-CMK-53 | `Your coach says the {0} is the week – this one will not move anything.` | `Тренер говорит, что на этой неделе стоит играть «{0}» – этот турнир ничего не изменит.` | `APPROVED` |
| RU23-CMK-54 | `Your coach says the {0} is the week – she has outgrown this one.` | `Тренер говорит, что на этой неделе стоит играть «{0}» – этот уровень она уже прошла.` | `APPROVED` |
| RU23-CMK-55 | `Your coach says even a title here would not move her ranking.` | `Тренер говорит, что даже титул здесь не повлияет на её рейтинг.` | `APPROVED` |
| RU23-CMK-56 | `Your coach would save her for the {0} {1}.` | `Тренер советует приберечь её для «{0}» {1}.` | `APPROVED` |
| RU23-CMK-57 | `when\|next week` | `на следующей неделе` | `APPROVED` |
| RU23-CMK-58 | `when\|in {0} weeks` | `через {0, plural, one {{0} неделю} few {{0} недели} many {{0} недель} other {{0} недели}}` | `APPROVED` |

## ⚙ 13.10 agent-authored (бланкет) – r51 B8, items №10/№11: the chemistry info popup

⚖ 14.10 владелец: «по остальным к вычитке ок» – ряды этого раздела `APPROVED`.

⚙ 13.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's item №11: «надо наверное при кликие на химию тренера какой-то небольшой информ попап показывать что там вообще, а то этот знак вопроса без движения несколько смущает» – and item №10 (44 weeks and the ring never moved) is answered by this card in the game: the pair is recomputed every week a coach is hired, and the «?» was hiding two different states.

A tap on the chemistry ring of a coach card opens `ChemistryHelpDialog.vue`: a title, two lines about what the ring is, ONE state line (three keys – never worked together, working but not readable yet, the current reading) and a line about what letting a coach go does. Seven keys, all new.

- **The term is the card's own**: `взаимопонимание` is what the ring's spoken label and the row's name already say (`Chemistry with her: {0}%`, `, chemistry {0}%`). The title is that word alone.
- **«reading» is `значение`**, the figure the ring draws; the owner's own phrase for the unread state – «ещё не прочитано» – is kept in the unread line.
- **The coach carries no sex in these rows** (`с тренером`, `этого тренера`, `расстаться` – an impersonal infinitive), the same rule the rest of this file follows; `она` is always the daughter.
- **`{0}` in the reading line is the figure as the ring speaks it** – a bare number, with its short minus when the pairing is negative – so the row never adds a sign of its own.

| id | English | Russian | Status |
| --- | --- | --- | --- |
| RU23-CHM-01 | `Chemistry` | `Взаимопонимание` | `APPROVED` |
| RU23-CHM-02 | `How well she and a coach understand each other.` | `Насколько хорошо она и тренер понимают друг друга.` | `APPROVED` |
| RU23-CHM-03 | `It shifts a little every week they work together – slowly, so a first reading can take months.` | `Взаимопонимание понемногу меняется каждую неделю, пока они работают вместе, – медленно, поэтому первое значение может появиться только через несколько месяцев.` | `APPROVED` |
| RU23-CHM-04 | `She has not worked with this coach yet, so there is nothing to read.` | `Она ещё не работала с этим тренером, поэтому показывать пока нечего.` | `APPROVED` |
| RU23-CHM-05 | `They have worked together, but it is not readable yet – it needs more time together.` | `Они уже работали вместе, но значение ещё не прочитано – нужно больше времени вместе.` | `APPROVED` |
| RU23-CHM-06 | `Right now it reads {0}%.` | `Сейчас значение: {0}%.` | `APPROVED` |
| RU23-CHM-07 | `When a coach is let go, it stays where it was – it does not fade – and carries on if you hire that coach again.` | `Если с тренером расстаться, взаимопонимание останется на месте – оно не угасает – и продолжится, если нанять этого тренера снова.` | `APPROVED` |

## ⚙ 14.10 agent-authored (бланкет) – r52 F2: the coach tile's feel line

⚙ 14.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. The owner's request: «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь от ребенка для принятия решения». The channel he picked for it is the tile «Тренер» («видна в любой момент… игрок может проверить сам»), and on how sure she may sound: «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но" или что-то в таком духе, т.е. она еще не уверена, а просто сомневается».

The Coach tile on the daughter's screen gains a third line, **only while a coach is employed** (a self-coached career has no feel to show), and the tile's accessible name gains the same phrase – a button's `aria-label` replaces its content for a screen reader, so a visible line alone would be silent. Six step phrases and one label: seven keys, all new. The old label `Coach – open the Coach Market` (RU05-P10) is untouched and is still the label of a self-coached tile.

- **Her words are in guillemets, the narrator's are not.** The three hedged steps (`unsure`, `seems-good`, `seems-off`) are what she SAYS. `Вроде нормально, но…` is his phrase verbatim; `Пока не поняла` is his `я пока не очень поняла` without the `я` and the `очень` – the full phrase is the alternative if he wants the hedge back, at the cost of a third line at 320 (measured below). The other three are the narrator's: `Ещё знакомятся`, `Ладят`, `Не ладят`.
- **No sex for the coach, no pronoun (R15-7).** `Ладят` and `Не ладят` name nobody; `поняла` is HER verb; `Ещё знакомятся` is the pair. The English follows the same rule – the drafts `Still getting to know them` and `They click` were not used, because a «them» can only be the coach.
- **`Ещё присматриваются` (the architect's draft) was not used.** The word is 99.7 px against an 89 px inner box (Manrope 11.5 px / 500, Chromium), so `overflow-wrap: break-word` would cut it as `присматривают` / `ся`; `знакомятся` is 64 px.
- **How they weigh.** The four hedged steps wear the tile's soft class (the tier line's weight and ink); the two steps she is sure of (`Ладят`, `Не ладят`) wear the name line's weight. No colour is added.
- **Measured** in a real Chromium with the app's own Manrope files, 11.5 px, wrapping, `overflow-wrap: break-word`; the inner box is 89 px at 375 and 70.7 px at 320 (r51 B14's numbers). Lines at 375 / at 320: `Ещё знакомятся` 1 / 2 · `«Пока не поняла»` 2 / 2 · `«Вроде получается»` 2 / 2 (⚠ its widest word, `получается»`, is 69.8 px against 70.7 – a margin of 0.9 px at 320, and at weight 600 the closing guillemet orphans onto a third line, which is why the hedged steps stay soft) · `«Вроде нормально, но…»` 3 / 3 (his words verbatim; the widest word, `нормально,`, is 64 px, so nothing breaks inside a word) · `Ладят` 1 / 1 · `Не ладят` 1 / 1. English: `Still getting acquainted` 2 / 2 · `"Can't tell yet"` 1 / 2 · `"Seems to be working"` 2 / 2 · `"Seems fine, but…"` 2 / 2 · `Clicking well` 1 / 1 · `Not clicking` 1 / 1.
- **The measured case is the worst case.** The Coach tile is a button, and a button takes the platform's own font rather than Manrope (true of the whole tile today, not only of this line), which runs about 7% narrower – so what fits in Manrope fits there. Re-measured on the real screen at 375 and 320, every phrase in both languages stays inside its tile with no word cut. The one visible cost is the Russian `«Вроде нормально, но…»`: three lines make the tile row 141 px tall at 375 (156 px at 320) against 124 px for the tallest friends note, and the School and Friends tiles stretch with it. If he finds that too tall, the cheapest cut is to drop the guillemets of that one phrase.

| id | English | Russian | Status |
| --- | --- | --- | --- |
| RU23-CFL-01 | `Still getting acquainted` | `Ещё знакомятся` | `APPROVED` |
| RU23-CFL-02 | `"Can't tell yet"` | `«Пока не поняла»` | `APPROVED` |
| RU23-CFL-03 | `"Seems to be working"` | `«Кажется, ладим»` | `APPROVED` |
| RU23-CFL-04 | `"Seems fine, but…"` | `«Вроде нормально, но…»` | `APPROVED` |
| RU23-CFL-05 | `Clicking well` | `Ладят` | `APPROVED` |
| RU23-CFL-06 | `Not clicking` | `Не ладят` | `APPROVED` |
| RU23-CFL-07 | `Coach – {feel} – open the Coach Market` | `Тренер – {feel} – открыть рынок тренеров` | `APPROVED` |

## ⚙ 21.10 agent-authored (бланкет) – r53 M8: a famous name's card, two lines

⚖ 22.10 владелец (лист вычитки r53): ряды этого раздела `APPROVED`, его правки перенесены.

⚙ 21.10 agent-authored under the blanket ruling; every row is `DRAFT` and his live edit follows. Source: `PEDIGREE_PAST_LINE` / `PEDIGREE_TRADE_LINE` in `src/engine/world/coachMarket.ts`, printed under the bio on an elite coach's card that has a past (`CoachMarketRow.pedigree`, spec `coach-pay-ladder-2026-10.md` §3.4). Tournament names are the game's own fictional family. **No sex for the coach, no pronoun (R15-7):** the past is a noun phrase (`Титул … в игровой карьере`, `первая ракетка` as an office, not a person), the trade speaks of «таким тренером» and of her. `взаимопонимание` is the game's word for chemistry (`Chemistry` → `Взаимопонимание`).

| id | English | Russian | Status |
| --- | --- | --- | --- |
| RU23-PED-01 | `Won a World Tour title as a player` | `Титул World Tour в игровой карьере` | `APPROVED` |
| RU23-PED-02 | `A former world number one` | `В прошлом – первая ракетка мира` | `APPROVED` |
| RU23-PED-03 | `Her chemistry grows faster with a coach like this` | `Она быстрее находит общий язык с таким тренером` | `APPROVED` |
| RU23-PED-04 | `Her ceiling sits a little higher with a coach like this` | `С таким тренером у неё чуть больше возможностей для роста` | `APPROVED` |
| RU23-PED-05 | `Sponsors call more often while this name is in her corner` | `Спонсоры обращаются чаще, пока такой тренер в её штабе` | `APPROVED` |
| RU23-PED-06 | `Top hitting partners come at the middle rung's price` | `Лучшие спарринг-партнёры – по цене средней ступени` | `APPROVED` |
