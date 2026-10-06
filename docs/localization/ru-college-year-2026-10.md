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
| all years spent, defensive | `All {total} years spent` | `Все {total} {год/года/лет} программы позади` |
| current year in progress | `Year {next} of {total} under way – {spent} spent` | `Идёт {next}-й год из {total}; завершено {done} {год/года/лет}` |
| next year waiting | `Year {next} of {total} is next – {spent} spent` | `Впереди {next}-й год из {total}; завершено {done} {год/года/лет}` |
| no completed years phrase | `none spent` | `пока ни одного` |
| report heading | `Year {index}, as it happened` | `{index}-й год — как он прошёл` |
| first-year lead | `{place}. A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.` | `{place}. У неё стипендия; всё, что она не покрывает, оплачивает семья. После любого учебного года она может уйти.` |
| final year ahead | `One year of the scholarship left. After it she is out either way.` | `Остался один год стипендии. После него программа в любом случае закончится.` |
| ordinary years ahead | `{done} year/years spent, {left} left on the scholarship.` | `Позади {done} {год/года/лет}; стипендии осталось на {left} {год/года/лет}.` |
| annual family bill | `{money} for the year, charged weekly` | `Доля семьи за год — {money}; списывается еженедельно` |
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
| balance fell | `Spent` | `Потрачено` |
| balance rose | `Banked` | `На счёте прибавилось` |
| tuition fact | `Tuition` | `Обучение` |
| rank fact | `Rank` | `Рейтинг` |
| rank span | `#{start} to #{end}` | `№{start} → №{end}` |
| absent rank | `–` | `—` |
| league fact, title | `Won it` | `Победа` |
| league fact, exit | `{leagueExitLabel}` | `{localizedStage}` |

`Spent` / `Banked` label the **change in the family's balance**, not her earnings. The amount
is displayed absolute because the noun already gives its direction. Tuition is separate from
that balance change. The rule belongs on the card once, including before year one; result notes
below should not repeat it. Rank `null` must not become №1 or №0.

## Student championship, national selection and replay

| Source branch | English | Russian draft |
| --- | --- | --- |
| won championship | `She won it – {played} matches, {won} wins.` | `Она выиграла Студенческую лигу: {played} {матч/матча/матчей}, {won} {победа/победы/побед}.` |
| left championship | `She went out in the {stage} – {played} matches, {won} wins.` | `Выбыла на стадии «{stage}»: {played} {матч/матча/матчей}, {won} {победа/победы/побед}.` |
| stakes | `the Nations Cup selectors read this result when they pick the squad.` | `При отборе на Кубок наций этот результат учитывают.` |
| no call-up | `Nobody wrote to her this year.` | `В этом году вызова в сборную не было.` |
| named but did not play | `named in the squad, never on court` | `вошла в состав, но на корт не вышла` |
| rubbers won | `{won} of {played} rubbers won` | `выиграла {won} из {played} матчей за сборную` |
| national finish | `Her country called – {court}, and the nation finished {place}th.` | `Её вызвали в сборную: {court}. Сборная заняла {place}-е место.` |
| league match label | `{stage} – {opponent}` | `{stage} — {opponent}` |
| national match label | `Rubber {n} – {opponent}` | `Матч {n} — {opponent}` |
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
| won, other player retired | `Won {score} ret` | `Победа {score} — соперница снялась` |
| lost, daughter retired | `Lost {score} ret` | `Поражение {score} — она снялась` |

The retiring player is the loser in the frozen match record. An English `ret` suffix inside a
Russian sentence would be an untranslated island. The explicit Russian suffix is longer; phone
LQA must check that the score and `Смотреть` button still fit, perhaps with a separate compact
accessible label rather than an unexplained abbreviation.

## Year-ahead calendar

| Source | English | Russian draft |
| --- | --- | --- |
| heading | `The year ahead` | `Предстоящий учебный год` |
| annual league event | `A draw of {size}, every year – her matches can be watched` | `Каждый год — сетка на {size} участниц. Её матчи можно посмотреть.` |
| conditional national team event | `If the selectors call her off the championship, the rubbers can be watched` | `Если после чемпионата её вызовут в сборную, матчи можно будет посмотреть.` |
| ordinary squad trip label | `Squad trip` | `Поездка команды` |
| known number of duals | `{n} dual matches for the programme` | `{n} {матч/матча/матчей} между командами университетов` |
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
| rank span | `#{start} to #{end}` | `№{start} → №{end}` |
| total years | `Years` | `Лет в программе` |
| total balance delta | `Banked` | `Изменение баланса семьи` |
| no national call | `Her country never called.` | `В сборную её так и не вызвали.` |
| called in some years | `Her country called in {n} of them, and paid her nothing, which is what it pays everybody.` | `Её вызывали в сборную в {n} {году/годах}. Призовых там не платят никому.` |
| next path | `Qualifying is the way forward again. Her week is on the home screen.` | `Дальше снова квалификация. Её неделя — на экране «Дом».` |
| continue | `Continue` | `Продолжить` |

The current `Banked` English label is used for a **signed** sum of `fundsDeltaCents`; unlike the
year card, this component does not select `Spent` when negative. Russian therefore names the
quantity neutrally as `Изменение баланса семьи`, preserving the signed number. The university
years are read from banked year records even if live match results were pruned. Graduation and
early leaving must not be conflated.
