---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12D – The live university year and graduation card

Sources: `src/components/CollegeYearCard.vue`, `CollegeDoneDialog.vue`, plus the competition
labels from `collegeLeague.ts`, `nationalTeam.ts`, and the university-place labels from
`collegeOffer.ts`. `College` means **университет**, not a Russian vocational college (RU-05).
All Russian copy is `DRAFT`.

## Common competition names

| Source | English | Russian draft |
| --- | --- | --- |
| university stage | `College` | `Университет` |
| yearly student championship | `the College League` | `Студенческая лига` |
| national team tournament | `the Nations Cup` | `Кубок наций` |
| state place | `The university at home` | `Местный университет` |
| national place | `A university away from home` | `Университет вдали от дома` |
| private place | `A private university` | `Частный университет` |

RU-05 already chose `Университет`, `Студенческая лига` and the three place labels. Keep one localized competition
label across a year's facts, calendar, match replay and feed. The national-team tournament is
fictional, so `Кубок наций` names this game's competition, not a real-world event.

## Year state, headline and costs

| Source case | English | Russian draft |
| --- | --- | --- |
| all years spent, defensive | `All {total} years spent` | `Все {total, plural, one {{total} год} few {{total} года} many {{total} лет} other {{total} лет}} программы позади` |
| current year in progress | `Year {next} of {total} under way – {spent} spent` | `Идёт {next}-й год из {total}; завершено {done, plural, one {{done} год} few {{done} года} many {{done} лет} other {{done} лет}}` – ⚙ 11.10 русский читает {done} (число лет), ключ отдаёт {spent} (деньги): паритет не сходится, ряд не компилится `QUESTION` |
| next year waiting | `Year {next} of {total} is next – {spent} spent` | `Впереди {next}-й год из {total}; завершено {done, plural, one {{done} год} few {{done} года} many {{done} лет} other {{done} лет}}` – ⚙ 11.10 русский читает {done} (число лет), ключ отдаёт {spent} (деньги): паритет не сходится, ряд не компилится `QUESTION` |
| no completed years phrase | `none spent` | `пока ни одного` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| report heading | `Year {index}, as it happened` | `{index}-й год – как он прошёл` |
| first-year lead | `{place}. A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.` | `{place}. У неё стипендия; всё, что она не покрывает, оплачивает семья. После любого учебного года она может уйти.` |
| final year ahead | `One year of the scholarship left. After it she is out either way.` | `Остался один год стипендии. После него программа в любом случае закончится.` |
| ordinary years ahead | `{done} years spent, {left} left on the scholarship.` | `Позади {done, plural, one {{done} год} few {{done} года} many {{done} лет} other {{done} лет}}; стипендии осталось на {left, plural, one {{left} год} few {{left} года} many {{left} лет} other {{left} лет}}.` |
| annual family bill | `{money} for the year, charged weekly` | `Доля семьи за год – {money}; списывается еженедельно` |
| next year fully covered | `Student tennis again, and the award covers the whole year.` | `Впереди ещё год студенческого тенниса; стипендия покрывает его полностью.` |
| next year costs family | `Student tennis again – {annualBill}.` | `Впереди ещё год студенческого тенниса. {annualBill}.` |

For `{done}=0`, use the special `пока ни одного` clause rather than `0 лет`; the status must
distinguish a year **under way** from a year **next**. `billPerYearCents <= 0` hides the bill
line, not the scholarship terms. The annual bill is debited in 52 weekly portions; do not
describe it as one lump sum.

## One shared rule and yearly facts

| Source | English | Russian draft |
| --- | --- | --- |
| competition rule, once per card | `None of it pays ranking points or prize money. A student field and a national squad award neither.` | `Ни Студенческая лига, ни Кубок наций не приносят рейтинговых очков или призовых.` |
| balance fell | `Spent` (`CollegeYearCard.vue`) | `Потрачено` |
| balance rose | `Banked` (`CollegeYearCard.vue`) | `На счёте прибавилось` |
| tuition fact | `Tuition` | `Обучение` |
| rank fact | `Rank` | `Рейтинг` |
| rank span | `#{start} to #{end}` | `№{start} → №{end}` – ⚙ 11.10 вызов передаёт уже готовые «#N» (rankMark): русский «№» задвоил бы знак – ряд ждёт локализованный аргумент `QUESTION` |
| absent rank | `–` | `–` |
| league fact, title | `Won it` | `Победа` |
| league fact, exit | `{leagueExitLabel}` | `{localizedStage}` – ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |

`Spent` / `Banked` label the **change in the family's balance**, not her earnings. The amount
is displayed absolute because the noun already gives its direction. Tuition is separate from
that balance change. The rule belongs on the card once, including before year one; result notes
below should not repeat it. Rank `null` must not become №1 or №0.

## Student championship, national selection and replay

| Source branch | English | Russian draft |
| --- | --- | --- |
| won championship | `She won it – {played} matches, {won} wins.` | `Она выиграла Студенческую лигу: {played, plural, one {{played} матч} few {{played} матча} many {{played} матчей} other {{played} матчей}}, {won, plural, one {{won} победа} few {{won} победы} many {{won} побед} other {{won} побед}}.` |
| left championship | `She went out in the {stage} – {played} matches, {won} wins.` | `Выбыла на стадии «{stage}»: {played, plural, one {{played} матч} few {{played} матча} many {{played} матчей} other {{played} матчей}}, {won, plural, one {{won} победа} few {{won} победы} many {{won} побед} other {{won} побед}}.` |
| stakes | `the Nations Cup selectors read this result when they pick the squad.` | `При отборе на Кубок наций этот результат учитывают.` – ⚙ 11.10 дыра ключа и русский не сходятся (паритет): ряд не компилится `QUESTION` |
| no call-up | `Nobody wrote to her this year.` | `В этом году вызова в сборную не было.` |
| named but did not play | `named in the squad, never on court` | `вошла в состав, но на корт не вышла` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| rubbers won | `{won} of {played} rubbers won` | `выиграла {won} из {played} матчей за сборную` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| national finish | `Her country called – {court}, and the nation finished {place}th.` | `Её вызвали в сборную: {court}. Сборная заняла {place}-е место.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| league match label | `{stage} – {opponent}` | `{stage} – {opponent}` – ⚙ 11.10: та же склейка, identity |
| national match label | `Rubber {n} – {opponent}` | `Матч {n} – {opponent}` |
| replay affordance | `Watch` | `Смотреть` |

`{stage}` needs the shared round formatter with the persisted draw depth, not today's retuned
draw size. A Nations Cup rubber is a *match*, not a *round*. Names stay in nominative after an
em dash. The championship always happens; national selection may never come. The empty call-up
line says no call, not that she lacked ability.

### Score row retirement

| Stored outcome | English row | Russian draft |
| --- | --- | --- |
| won, ordinary | `Won {score}` | `Победа {score}` |
| lost, ordinary | `Lost {score}` | `Поражение {score}` |
| won, other player retired | `Won {score} ret` | `Победа {score} – соперница снялась` |
| lost, daughter retired | `Lost {score} ret` | `Поражение {score} – она снялась` |

The retiring player is the loser in the frozen match record. An English `ret` suffix inside a
Russian sentence would be an untranslated island. The explicit Russian suffix is longer; phone
LQA must check that the score and `Смотреть` button still fit, perhaps with a separate compact
accessible label rather than an unexplained abbreviation.

## Year-ahead calendar

| Source | English | Russian draft |
| --- | --- | --- |
| heading | `The year ahead` | `Предстоящий учебный год` |
| annual league event | `A draw of {size}, every year – her matches can be watched` | `Каждый год – сетка на {size} участниц. Её матчи можно посмотреть.` |
| conditional national team event | `If the selectors call her off the championship, the rubbers can be watched` | `Если после чемпионата её вызовут в сборную, матчи можно будет посмотреть.` |
| ordinary squad trip label | `Squad trip` | `Поездка команды` |
| known number of duals | `{n} dual matches for the programme` | `{n, plural, one {{n} матч} few {{n} матча} many {{n} матчей} other {{n} матчей}} между командами университетов` |
| legacy unknown number | `Dual matches for the programme` | `Матчи между командами университетов` |

The league is guaranteed each university year; the national-team call is conditional. For old
saves without a quoted tier, the trip has no number rather than an invented one. Calendar labels
and match-replay headings use the common localized competition names above.

## Graduation or early departure

Source: `CollegeDoneDialog.vue`. The card is a blocking once-per-career beat, not dismissed by a
stray tap on the scrim.

| Source | English | Russian draft |
| --- | --- | --- |
| kicker | `College · {week}` | `Университет · {week}` |
| graduated title | `She has graduated.` | `Она окончила университет.` |
| early-leaver title | `She has left the scholarship.` | `Она ушла из университетской программы.` |
| year row | `Year {index}` | `{index}-й год` |
| rank span | `#{start} to #{end}` | `№{start} → №{end}` – ⚙ 11.10 вызов передаёт уже готовые «#N» (rankMark): русский «№» задвоил бы знак – ряд ждёт локализованный аргумент `QUESTION` |
| total years | `Years` | `Лет в программе` |
| total balance delta | `total\|Banked` | `Изменение баланса семьи` |
| no national call | `Her country never called.` | `В сборную её так и не вызвали.` |
| called in some years | `Her country called in {n} of them, and paid her nothing, which is what it pays everybody.` | `Её вызывали в сборную в {n, plural, one {{n} году} few {{n} годах} many {{n} годах} other {{n} годах}}. Призовых там не платят никому.` |
| next path | `Qualifying is the way forward again. Her week is on the home screen.` | `Дальше снова квалификация. Её неделя – на экране «Дом».` |
| continue | `Continue` | `Продолжить` |

The current `Banked` English label is used for a **signed** sum of `fundsDeltaCents`; unlike the
year card, this component does not select `Spent` when negative. Russian therefore names the
quantity neutrally as `Изменение баланса семьи`, preserving the signed number. The university
years are read from banked year records even if live match results were pruned. Graduation and
early leaving must not be conflated.

## ⚙ 11.10 agent-authored (бланкет) – the university year card, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

17 keys of `CollegeYearCard.vue` and `CollegeDoneDialog.vue`. The siblings with the other count (`{0} years spent`, `She went out in the {0} – {1} matches, {2} wins.`) already carried Russian; the singular and mixed forms are cut in their mould (`Выбыла на стадии «{0}»: 1 матч, 1 победа.`). The two `Year {0} of {1} … {2} spent` rows RU-12D parked as `QUESTION` (the key's `{2}` is the number of years spent, not money) are read the way their Russian was drafted: `Идёт {0}-й год из {1}; завершено 2 года`. The ordinal of the nation's place arrives as a bare number, so the suffix is the neuter `-е` that suits every number (`заняла 3-е место`); `{0} selectors read this result …` receives the competition label (`the Nations Cup`) in English and puts it in brackets.

| id | English | Russian |
| --- | --- | --- |
| RU21-CLY-01 | `{0} to {1}` | `{0} → {1}` |
| RU21-CLY-02 | `1 dual match for the programme` | `1 матч между командами университетов` |
| RU21-CLY-03 | `1 year spent, {0} left on the scholarship.` | `Позади 1 год; стипендии осталось на {0, plural, one {{0} год} few {{0} года} many {{0} лет} other {{0} года}}.` |
| RU21-CLY-04 | `A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.` | `У неё стипендия; всё, что она не покрывает, оплачивает семья. После любого учебного года она может уйти.` |
| RU21-CLY-05 | `Her country called – named in the squad, never on court, and the nation finished {0}th.` | `Её вызвали в сборную: вошла в состав, но на корт не вышла. Сборная заняла {0}-е место.` |
| RU21-CLY-06 | `Her country called – {0} of {1} rubbers won, and the nation finished {2}th.` | `Её вызвали в сборную: выиграла {0} из {1, plural, one {{1} матча} few {{1} матчей} many {{1} матчей} other {{1} матча}} за сборную. Сборная заняла {2}-е место.` |
| RU21-CLY-07 | `She went out in the {0} – 1 match, 1 win.` | `Выбыла на стадии «{0}»: 1 матч, 1 победа.` |
| RU21-CLY-08 | `She went out in the {0} – 1 match, {1} wins.` | `Выбыла на стадии «{0}»: 1 матч, {1, plural, one {{1} победа} few {{1} победы} many {{1} побед} other {{1} победы}}.` |
| RU21-CLY-09 | `She went out in the {0} – {1} matches, 1 win.` | `Выбыла на стадии «{0}»: {1, plural, one {{1} матч} few {{1} матча} many {{1} матчей} other {{1} матча}}, 1 победа.` |
| RU21-CLY-10 | `She won it – 1 match, 1 win.` | `Она выиграла Студенческую лигу: 1 матч, 1 победа.` |
| RU21-CLY-11 | `She won it – 1 match, {0} wins.` | `Она выиграла Студенческую лигу: 1 матч, {0, plural, one {{0} победа} few {{0} победы} many {{0} побед} other {{0} победы}}.` |
| RU21-CLY-12 | `She won it – {0} matches, 1 win.` | `Она выиграла Студенческую лигу: {0, plural, one {{0} матч} few {{0} матча} many {{0} матчей} other {{0} матча}}, 1 победа.` |
| RU21-CLY-13 | `Year {0} of {1} is next – none spent` | `Впереди {0}-й год из {1}; завершённых пока нет` |
| RU21-CLY-14 | `Year {0} of {1} is next – {2} spent` | `Впереди {0}-й год из {1}; завершено {2, plural, one {{2} год} few {{2} года} many {{2} лет} other {{2} года}}` |
| RU21-CLY-15 | `Year {0} of {1} under way – none spent` | `Идёт {0}-й год из {1}; завершённых пока нет` |
| RU21-CLY-16 | `Year {0} of {1} under way – {2} spent` | `Идёт {0}-й год из {1}; завершено {2, plural, one {{2} год} few {{2} года} many {{2} лет} other {{2} года}}` |
| RU21-CLY-17 | `{0} selectors read this result when they pick the squad.` | `Этот результат учитывают отборщики ({0}) при выборе состава сборной.` |
