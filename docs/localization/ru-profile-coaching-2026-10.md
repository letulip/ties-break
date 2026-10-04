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

Batch status: **in progress**. The profile frame, life-stage language and complete radar/training
observation corpora are drafted. Coach market, week planner, knock and injury-stop copy follow in
this document.
