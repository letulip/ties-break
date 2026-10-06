---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11I – Coaching and staff history

These are **feed and ledger** lines, not the staff cards already covered by RU-05/06. Source:
`src/engine/world/coachMarket.ts`, `masseur.ts`, `sparring.ts`, `psychologist.ts`. Every Russian
line is `DRAFT`. Names, rates and arrangement rungs come from runtime data, not translator guesses.

## Coach

| Source case | English source | Russian draft |
| --- | --- | --- |
| parent resumes coaching | `You are coaching her yourself again. The weekly bill is court time only.` | `Вы снова тренируете её самостоятельно. В еженедельном счёте осталась только аренда корта.` |
| hired coach | `{coach.name} is her coach now – {tier} tier.` | `Теперь её тренирует {coach.name}. Уровень тренера: {tier}.` |
| annual rate request | `{coach.name} has asked for more after a year together – {before} an hour becomes {after}. The rate stands until the next time it is agreed.` | `После года работы с тренером {coach.name} поступил запрос на повышение ставки: час тренировки теперь стоит {after} вместо {before}. Ставка сохранится до следующего пересмотра.` |
| coach travels | `Your coach travels to tournaments with her now – one additional fare per trip.` | `Теперь тренер ездит с ней на турниры: каждая поездка включает ещё один билет.` |
| coach stays | `Your coach no longer travels to tournaments – the work happens at home.` | `Тренер больше не ездит с ней на турниры. Совместная работа остаётся дома.` |
| junior/domestic trips on | `Your coach travels to junior and domestic tournaments too – one additional fare on trips that pay no prize money.` | `Тренер ездит с ней и на юниорские и национальные турниры. В таких поездках добавляется второй билет, а призовых нет.` |
| junior/domestic trips off | `Your coach stays home for junior and domestic tournaments – the additional fare is for the events that pay.` | `На юниорские и национальные турниры тренер больше не ездит. Второй билет остаётся только для турниров с призовыми.` |

The annual-rate row uses a neutral impersonal construction: the roster can contain a woman or a
man, and `{coach.name}` remains nominative. If the owner wants to hear the coach personally ask,
that needs roster-aware grammar, not a hard-coded masculine verb.

## Masseur

| Source case | English source | Russian draft |
| --- | --- | --- |
| hired | `A masseur joins the team – table work at home, every week.` | `К команде присоединился массажист. Теперь дома у неё есть сеансы каждую неделю.` |
| released | `The masseur is let go – her body is back on the physio rota alone.` | `С массажистом расстались. Восстановление снова идёт только по расписанию физиотерапии.` |
| raise, can reduce sessions | `The masseur's rate rises to {rate} a session starting this week. Keep the current schedule at the higher rate, or book fewer sessions.` | `С этой недели сеанс массажа стоит {rate}. Можно сохранить прежнее число сеансов по новой цене или сократить расписание.` |
| raise, already minimum | `The masseur's rate rises to {rate} a session starting this week. She is already down to {rung}, so there is no shorter schedule to choose.` | `С этой недели сеанс массажа стоит {rate}. Сейчас уже выбран минимум – {rung}; сократить расписание дальше нельзя.` |
| session rung changed | `The masseur's week is re-cut – {rung} on the table from the next bill.` | `Число сеансов массажа изменено: {rung}. Новое расписание отразится в следующем счёте.` |
| travels | `The masseur travels to tournaments now – one additional fare per trip, and table work between rounds.` | `Теперь массажист ездит с ней на турниры: ещё один билет на каждую поездку и сеансы между раундами.` |
| stays | `The masseur stays home on tournament weeks – the table waits for her return.` | `В турнирные недели массажист остаётся дома. Следующий сеанс – после её возвращения.` |
| recurring cost | `Masseur – sessions this week` | `Массаж – сеансы этой недели` |
| post-tour extra session | `Back from the tour – an extra session on the table works the trip out of her legs.` | `После поездки – дополнительный сеанс массажа, чтобы снять нагрузку с ног.` |

`{rung}` must be the localized, grammatically compatible schedule phrase, not English
`rung.label.toLowerCase()`. The hire/release lines keep the source's male `masseur` identity;
do not silently turn it into an unspecified therapist. The expense row says sessions, not salary.

## Hitting partner

| Source case | English source | Russian draft |
| --- | --- | --- |
| hired | `A hitting partner joins the team – regular match-style practice on weeks without a match.` | `Теперь у неё есть спарринг-партнёр. В недели без матчей будут регулярные игровые тренировки.` |
| released | `The hitting partner leaves the team – regular match-style practice between events ends.` | `Работа со спарринг-партнёром завершена. Регулярные игровые тренировки между турнирами прекращаются.` |
| rung changed | `The hitting-partner arrangement changes with the next bill – {rung}.` | `Условия работы со спарринг-партнёром меняются со следующего счёта: {rung}.` |
| travels | `The hitting partner will travel from now on – one additional fare per trip, and a regular practice opponent on tour.` | `Теперь спарринг-партнёр ездит с ней: ещё один билет на поездку и постоянный соперник для тренировок на выезде.` |
| stays | `The hitting partner will stay at the home club – no additional fare, and no regular practice opponent on tour.` | `Спарринг-партнёр остаётся в домашнем клубе. Дополнительного билета нет, но и постоянного соперника для тренировок на выезде тоже.` |
| recurring cost | `Hitting partner – weekly salary` | `Спарринг-партнёр – зарплата за неделю` |

The rung change is **one continuous arrangement**, not a new person. Preserve the original
hire's history identity (`SPARRING_CHANGE_KEY`). The seat buys a practice opponent, not a court.

## Psychologist

| Source case | English source | Russian draft |
| --- | --- | --- |
| hired | `A psychologist joins the team – one call a week, wherever she is.` | `Теперь с ней работает психолог: один разговор в неделю, где бы она ни находилась.` |
| released | `The psychologist leaves the team – the calls stop at the end of the week.` | `Работа с психологом прекращается. Еженедельные разговоры закончатся в конце этой недели.` |
| rung changed | `The weekly call changes hands – {rung} from the next bill.` | `Со следующего счёта еженедельные разговоры ведёт другой специалист: {rung}.` |
| recurring cost | `Psychologist – weekly salary` | `Психолог – зарплата за неделю` |

Unlike the hitting-partner rung, the psychologist rung changes **who takes the call**. If
`{rung}` is a role level rather than a person's name, it still needs a localized form that works
after the colon. The current source does not provide the specialist's gender: the Russian event
should avoid inferring it. Likewise, the hire/release prose above uses masculine occupation
grammar as a generic label; confirm this with the owner before runtime integration if the product
intends a specific individual rather than an abstract seat.

## Short observations and service receipts

| Source | English source | Russian draft |
| --- | --- | --- |
| `form.ts`, coach sees clean ball-striking | `She is striking the ball cleanly.` | `Чисто бьёт по мячу.` |
| `form.ts`, coach sees rust after matchless stretch | `She needs match play.` | `Ей нужны матчи.` |
| `form.ts` / `sparring.ts`, first match after a gap | `Her first match back did not look like a first match back.` | `После перерыва она вышла на матч без обычной скованности.` |
| `phaseGrowth.ts` / `development.ts`, composure crosses a point | `The big points feel slower to her than they used to.` | `На важных розыгрышах она теперь успевает подумать.` |

These are threshold/counterfactual receipts, not random praise. The coach's two lines are terse
court language. The hitting-partner line must fire only when the existing comeback-gap check says
the service changed her rust. The composure line names a changed perception, not a win.

## Technical boundary

Do not use English `WorldEvent.text` as a hidden localization key. Old saves can contain every
one of these rows and must display in Russian mode. Preserve amount cents, staff ledger category,
milestone keys and coach contract dating independently of the rendered sentence. These translations
do not change a booking, price or duration.
