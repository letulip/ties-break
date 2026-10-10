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
| `Important moments` – section heading | `Важные моменты` |

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
| RU05-C03 | `{name} · {style} · {n} coaches` | `{name} · {style} · {coaches}` |
| RU05-C04 | `Her week` | `Её неделя` |
| RU05-C05 | `Coaches` | `Тренеры` |
| RU05-C06 | `Support staff` | `Специалисты` |
| RU05-C07 | `What this screen is about` – group aria | `Раздел рынка тренеров` |
| RU05-C08 | `Style` | `Стиль` |
| RU05-C09 | `Sort` | `Сортировка` |
| RU05-C10 | `Best fit` | `Сначала подходящие` |
| RU05-C11 | `Price` | `Сначала дешевле` |
| RU05-C12 | style lens | `Показано соответствие стилю «{style}», а не её нынешней игре.` |

`{coaches}` is `1 тренер`, `2 тренера`, `5 тренеров`. The style catalogue is RU-02A's; no shortened
market-only copy.

Coach tiers and fit:

| semantic value | English | Russian |
| --- | --- | --- |
| self | `Self-coached` | `Тренирует семья` |
| budget | `Budget` | `Бюджетный` |
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
| `{money} /week free` | `Свободно: {money} в неделю` |
| `{money} committed` | `Обязательства: {money}` |
| `{money} weekly cap` | `Лимит на неделю: {money}` |
| `Coach` | `Тренер` |
| `Masseur` | `Массажист` |
| `Psychologist` | `Психолог` |
| `Hitting partner` | `Спарринг-партнёр` |
| `Household, every week` | `Семья за неделю` |
| `{in} in – {out} out – {net} left over` | `доход {in} – расход {out} – остаётся {net}` |
| `{in} in – {out} out – {net} short` | `доход {in} – расход {out} – не хватает {net}` |

Shelf, upkeep and business-income explanations reuse RU-06's semantic messages; this route must not
keep a private translation just because it mounts the component.

## 15. Training regulator and travel choices

Preset controls reuse the RU-03 terms: `Легко`, `Баланс`, `Интенсивно`. On this screen each adds its
real billed time: `Легко · {hours} ч/нед.`, and so on.

| id | meaning | English | Russian |
| --- | --- | --- | --- |
| RU05-C13 | price context | `Every price below is {n} sessions a week – more sessions, more money.` | `Все цены ниже рассчитаны на {sessions} в неделю: больше тренировок – выше оплата.` |
| RU05-C14 | travel heading | `Coach travels to tournaments` | `Тренер ездит на турниры` |
| RU05-C15 | self-coached | `You are coaching her yourself – there is nobody to send. Turn it on and it takes effect when you hire somebody.` | `Вы тренируете её сами – отправлять пока некого. Настройку можно включить заранее: она заработает после найма тренера.` |
| RU05-C16 | sponsor cover | `Your sponsor pays {pct}% of the second seat at the events that pay prize money – the rest is yours.` | `На турнирах с призовыми спонсор оплачивает {pct}% второго билета, остальное платит семья.` |
| RU05-C17 | scholarship | `The support does not pay for the second seat – hers is discounted, the coach travels at the full fare.` | `Поддержка снижает стоимость её билета, но не второго: поездка тренера оплачивается полностью.` |
| RU05-C18 | ordinary fare | `One additional fare per trip – a second seat beside hers.` | `Один дополнительный билет на каждую поездку – место рядом с ней.` |
| RU05-C19 | priced covered trips | `{rule} Her seats cost {herFare} over the {trips} ahead; the second seat adds {coachFare}.` | `В следующих {trips} её билеты стоят {herFare}; место тренера добавит ещё {coachFare}.` |
| RU05-C20 | priced ordinary trips | `{rule} {coachFare} over the {trips} she has booked this season.` | `По заявленным на сезон {trips} поездка тренера добавит {coachFare}.` |

The English implementation currently assembles C19–C20 inside a computed string. `{trips}` is a
counted phrase (`1 поездке`, `2 поездках`, `5 поездках`), not a number plus English noun.

Travel switch names:

- on: `Тренер ездит с ней на турниры. Включено. Нажмите, чтобы оставлять тренера дома в соревновательные недели.`
- off: `Тренер ездит с ней на турниры. Выключено. Нажмите, чтобы оплачивать ещё один билет на каждую поездку.`

Nested junior option:

| English | Russian |
| --- | --- |
| `...and to junior events too` | `…и на юниорские турниры тоже` |
| base note | `Юниорские и национальные турниры не платят призовых: билет покупает присутствие, но не приносит дохода.` |
| priced tail | `В этом сезоне на карточке ещё {trips}; их общая стоимость – {money}.` |
| confirm | `Отправлять тренера ещё и на юниорские и национальные турниры? На этих уровнях нет призовых, поэтому второй билет оплачивается из доходов, которых теннис пока не приносит. В замере по 30 карьер в каждой группе неограниченные юниорские поездки привели к банкротству 8 из 30 обеспеченных и 15 из 30 семей со средним достатком – во всех случаях до её двадцатилетия. Деньги ваши, решение тоже.` |
| confirm action | `Отправлять тренера` |
| cancel | `Пока нет` |

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
| `{n} pts short` | `Не хватает {points}` |
| `Hire ›` | `Нанять ›` |
| unknown chemistry | `Взаимопонимание с ней: пока неизвестно` |
| known chemistry | `Взаимопонимание с ней: {signedPct}` |

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
| week grid aria | `Неделя по дням` |
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
| RU05-W15 | `Total` | `Итого` |
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
| `Family vacation – {label}: +{gain} condition, and the recovery holds for {weeks}.` | `Семейный отпуск – {label}: форма +{gain}, сниженный риск травмы действует {weeks}.` |

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
| RU05-K03 | `Her {part}.` | `Беспокоит {partNom}.` |
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
| same place previously pushed | `We sent her back out with a knock to her {part} before. Now the same place is troubling her again.` | `Раньше мы уже отправили её тренироваться с этой болью – {partLocation}. Теперь беспокоит то же место.` |
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
