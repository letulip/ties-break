---
type: corpus
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-04
---

# RU-02B – childhood prologue, walk and ages five to thirteen

This is the childhood-card corpus: shared walk controls, all nine ages, the first training choices,
the age-twelve fork and every repeated question about entering a tournament. Tournament scenes and
the handover follow as separate readable sections in this same document.

The direct-address ruling is settled: system and interface copy uses `вы`; the daughter's future
spoken lines use family `ты`. These first three cards contain narration rather than dialogue.

## 1. Walk controls

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-W01 | `src/prologue/handover.ts:353` | `Skip the childhood` | `Пропустить детские годы` | avoids the mechanical `пропустить пролог`; leads to the existing wizard |
| RU02B-W02 | `src/prologue/handover.ts:360` | `Proceed` | `Продолжить` | appears only after every question on the card is answered |
| RU02B-W03 | `PrologueCard.vue:869` | `Back` | `Назад` | shared accessible name; same term as RU-01 |
| RU02B-W04 | `src/prologue/cards.ts:304,413` | `Go on` | `Дальше` | quiet-card action, shorter than the explicit `Продолжить` gate |

`Пропустить детство` was rejected as a draft: in Russian it sounds as though the family is refusing
the child's actual childhood. `Пропустить детские годы` describes skipping this part of the story.

## 2. Age five – the hook and family origin

The identity fields on this card reuse RU-02A exactly: `Имя`, `Фамилия`, Russian date forms, localized
countries and their accessible names. They are not copied into a second catalogue namespace.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-05-01 | `cards.ts:288` | `She is five` | `Ей пять` | Russian age construction, not literal `Она – пять` |
| RU02B-05-02 | `cards.ts:292` | `She can barely hold the racket.` | `Она едва удерживает ракетку.` | keeps the object explicit, as required by the existing owner ruling |
| RU02B-05-03 | `cards.ts:293` | opening scene | `Ракетка ей велика, и она машет ею как лопатой. Не попадает, пробует снова – и через двадцать минут всё ещё не остановилась. Пока никто ничего не решил.` | three beats; no judgement of ability |
| RU02B-05-04 | `cards.ts:297` | `She thinks the game is to hit the ball into the fence.` | `Она думает, что вся игра – попасть мячом в ограду.` | child's understanding, not narrator ridicule |
| RU02B-05-05 | `cards.ts:301` | `Nobody is teaching her. She is five.` | `Её никто не учит. Ей пять.` | repetition is deliberate and factual |
| RU02B-05-06 | `cards.ts:304` | `Go on` | `Дальше` | quiet-card action |
| RU02B-05-07 | `cards.ts:309` | `Where does she grow up? It decides what the family can spend on tennis for the next nine years.` | `Где она будет расти? От этого зависит, сколько семья сможет тратить на теннис следующие девять лет.` | says the mechanical consequence plainly |

### Family origin answers

These are scenes of origin, not difficulty-menu labels. Their profile IDs remain `working`,
`middle` and `wealthy`; the Russian sentences do not need to repeat the compact labels used in the
wizard.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-05-A1 | `cards.ts:326` | `A small town, and you both work.` | `Небольшой город, в семье работают оба взрослых.` | preserves two incomes without assigning the player's gender |
| RU02B-05-A2 | `cards.ts:327` | `There is nothing spare. Everything after this is a real decision.` | `Свободных денег нет. Каждый следующий шаг придётся взвешивать.` | money pressure without game-menu language |
| RU02B-05-B1 | `cards.ts:332` | `A city, and the bills are paid.` | `Вы живёте в городе и справляетесь со счетами.` | approved interface `вы`; no claim of wealth |
| RU02B-05-B2 | `cards.ts:333` | `There is some room. Not a lot of it.` | `Небольшой запас есть – но только небольшой.` | preserves the dry correction in the second sentence |
| RU02B-05-C1 | `cards.ts:338` | `Money is not the question in this house.` | `В этой семье деньги – не главный вопрос.` | does not say money is unlimited |
| RU02B-05-C2 | `cards.ts:339` | `You still have to decide where she goes and who teaches her.` | `Но всё равно придётся решать, куда она пойдёт и кто будет её тренировать.` | keeps agency and the remaining trade-off |

## 3. Age six – first return to court

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-06-01 | `cards.ts:351` | `She is six` | `Ей шесть` | |
| RU02B-06-02 | `cards.ts:357` | `She asks to go back to the court.` | `Она просится обратно на корт.` | names the destination; does not read as asking to go home |
| RU02B-06-03 | `cards.ts:358` | summer-session scene | `На летней тренировке ей дали ракетку, и с тех пор она каждую неделю спрашивает о теннисе. По вторникам на городском корте занимается группа. Занятия почти бесплатные, дорога занимает двадцать минут.` | `тренировка` is clearer than institutional `сессия`; `городской корт` is more natural than `муниципальный` |
| RU02B-06-04 | `cards.ts:362` | `She likes it. That is all you know.` | `Ей нравится. Пока это всё, что вы знаете.` | refuses to infer talent from enthusiasm |
| RU02B-06-05 | `cards.ts:364` | `The coach who runs the group learns her name in the second week.` | `На второй неделе тренер группы уже знает её по имени.` | role noun without a personal name or pronoun |
| RU02B-06-06 | `cards.ts:367` | `Sign her up` | `Записать её` | parent action; no bureaucratic `зарегистрировать` |

## 4. Age seven – the group year

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-07-01 | `cards.ts:376` | `She is seven` | `Ей семь` | |
| RU02B-07-02 | `cards.ts:377` | `The group works.` | `В группе всё складывается.` | means the arrangement works, not that the children are employed |
| RU02B-07-03 | `cards.ts:381` | group-year scene | `Дважды в неделю, восемь детей, один корт. Она не лучшая из восьми – и даже не замечает этого. Так проходит год. Траты на теннис пока почти незаметны.` | keeps the child's freedom from comparison and the light cost |
| RU02B-07-04 | `cards.ts:385` | `She still asks to go.` | `Она по-прежнему просится на корт.` | restores the destination naturally in Russian |
| RU02B-07-05 | `cards.ts:387` | `The coach says she listens – at seven that is a compliment.` | `Тренер говорит, что она умеет слушать. В семь лет это похвала.` | dry coach observation, no talent verdict |
| RU02B-07-06 | `cards.ts:390` | `A year passes` | `Проходит год` | quiet transition |

## 5. Age eight – the club across town

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-08-01 | `cards.ts:399` | `She is eight` | `Ей восемь` | canonical age shape |
| RU02B-08-02 | `cards.ts:400` | `There is a club across town.` | `На другом конце города есть клуб.` | concrete distance before the cost choice |
| RU02B-08-03 | `cards.ts:401` | club comparison | `На городском корте один тренер и нет тренировочной стенки. В клубе – четыре корта, программа подготовки и тренеры, к которым другие семьи возят детей через весь город. В одну сторону сорок минут.` | `wall` is the practice wall, not a building wall |
| RU02B-08-04 | `cards.ts:406` | `She has a forehand now and she wants you to watch it.` | `У неё уже есть форхенд, и она хочет вам его показать.` | a visible skill, not a potential verdict |
| RU02B-08-05 | `cards.ts:410` | `The coach says she could do more than this group gives her.` | `Тренер говорит, что она способна на большее, чем даёт эта группа.` | the coach assesses the current environment, not her ceiling |
| RU02B-08-A1 | `cards.ts:417` | `Stay at the municipal court` | `Остаться на городском корте` | family action |
| RU02B-08-A2 | `cards.ts:419` | `What you are already paying. She keeps the group and you keep your evenings.` | `Расходы не меняются. Она остаётся в группе, а вам не приходится отдавать вечера дороге.` | names the saved time rather than the vague `вечера остаются вашими` |
| RU02B-08-B1 | `cards.ts:427` | `The club across town` | `Клуб на другом конце города` | matches the title |
| RU02B-08-B2 | `cards.ts:428` | `About three times the municipal court, every month, and the drive on top.` | `Каждый месяц – примерно втрое дороже городского корта, плюс дорога.` | the three-times comparison matches the stored costs |

The two `her` arms and two coach arms remain identical on this card. Age eight is the first choice;
the prose above it cannot pretend to know which road the player is about to take.

## 6. Age nine – group or individual hour

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-09-01 | `cards.ts:455` | `She is nine` | `Ей девять` | |
| RU02B-09-02 | `cards.ts:456` | `Eight children are waiting for one court.` | `Восемь детей ждут своей очереди на одном корте.` | immediately names what the queue is for |
| RU02B-09-03 | `cards.ts:457` | one-to-one offer | `Две тренировки в неделю, и значительную часть каждой она ждёт своей очереди. В клубе предлагают индивидуальное занятие с тренером – один час в неделю: тот же час в расписании, но весь корт только для неё.` | explains what is being sold before the buttons |
| RU02B-09-04 | `cards.ts:462` | `She is doing what the group does and no more.` | `Она делает то же, что группа, – и не больше.` | cool path; no judgement beyond observed effort |
| RU02B-09-05 | `cards.ts:463` | `She is one of the ones who stays behind afterwards.` | `Она из тех, кто остаётся после занятия.` | warm path; behaviour, not hidden talent |
| RU02B-09-06 | `cards.ts:466` | `The coach says she is fine, and says it about all eight of them.` | `Тренер говорит, что она справляется, – и то же самое говорит про всех восьмерых.` | deliberately generic assessment |
| RU02B-09-07 | `cards.ts:467` | `The coach is the one who offered you the hour.` | `Именно тренер предложил вам этот час.` | warm path makes the offer personal without naming the professional |
| RU02B-09-A1 | `cards.ts:473` | `Keep her in the group` | `Оставить её в группе` | |
| RU02B-09-A2 | `cards.ts:474` | `The same money as this year. She keeps her place in the queue.` | `Столько же, сколько в этом году. Она сохраняет место в очереди.` | the dry queue image is intentional |
| RU02B-09-B1 | `cards.ts:482` | `Buy the hour, one to one` | `Взять индивидуальный час` | natural Russian service wording |
| RU02B-09-B2 | `cards.ts:484` | `About four times the group, and it buys one hour a week with nobody else on the court.` | `Примерно вчетверо дороже группы – зато раз в неделю весь корт только для неё.` | the four-times comparison matches the stored costs |

The word `индивидуальный` is preferable to tennis jargon such as `приват` or a literal
`один на один`: the latter can sound like an opponent across the net rather than private coaching.

## 7. Age ten – the first tournament decision

`Local Open` becomes `местный открытый турнир`. It is a tournament level and event description, not
a protected English name. Internal tier IDs remain unchanged.

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-10-01 | `cards.ts:495` | `She is ten` | `Ей десять` | |
| RU02B-10-02 | `cards.ts:496` | `There is a Local Open in six weeks.` | `Через шесть недель – местный открытый турнир.` | first use of the proposed tier term |
| RU02B-10-03 | `cards.ts:497` | tournament setup | `Турнир для игроков до двенадцати лет: одни выходные и сорок минут по трассе. Заявочный взнос, ночь в отеле, если в субботу она победит, и турнирная сетка с её именем.` | every practical consequence stays visible |
| RU02B-10-04 | `cards.ts:501` | `She plays on Tuesdays and she thinks about it on Tuesdays.` | `На корт она выходит по вторникам и о теннисе думает тоже только по вторникам.` | cool path: tennis has not filled the rest of her week |
| RU02B-10-05 | `cards.ts:502` | `She has started watching how other people serve.` | `Она начала следить за тем, как подают другие.` | warm path: observable curiosity |
| RU02B-10-06 | `cards.ts:505` | `The coach has not mentioned the tournament to you.` | `Тренер не говорил с вами об этом турнире.` | absence of a recommendation is information |
| RU02B-10-07 | `cards.ts:506` | `The coach thinks she would not embarrass herself in a draw.` | `Тренер говорит, что в этой сетке она не потеряется.` | preserves the modest endorsement without humiliating the child |
| RU02B-10-A1 | `cards.ts:512` | `Not this year` | `В этом году не ехать` | declines this year only; later cards may ask again |
| RU02B-10-A2 | `cards.ts:513` | `Nothing extra. She practises that weekend like any other.` | `Дополнительных расходов нет. В эти выходные она тренируется как обычно.` | no implication that the tournament route closes |
| RU02B-10-B1 | `cards.ts:521` | `Enter her` | `Подать заявку` | standard tournament action |
| RU02B-10-B2 | `cards.ts:523` | `An entry and a weekend – about a month of the group, once.` | `Взнос и поездка на выходные – разово примерно как месяц занятий в группе.` | the one-off comparison matches the stored price difference |

### Why the first tournament result is not in this slice

Submitting the entry opens a complete tournament flow: opening screen, rounds, match viewer, injury
reassurance and one of four result scenes. That flow repeats at later ages and has its own variation
rules. It will be localized as one unit in the next tournament section rather than translating only
the age-ten instance and creating a second wording for the same screens.

## 8. Age eleven – school becomes a tennis decision

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-11-01 | `cards.ts:538` | `She is eleven` | `Ей одиннадцать` | |
| RU02B-11-02 | `cards.ts:539` | `The sports school takes children at eleven.` | `В спортивную школу берут с одиннадцати.` | familiar Russian institution wording |
| RU02B-11-03 | `cards.ts:540` | sports-school setup | `Утром – корт, потом уроки. Здесь так живут все. Тем, кто остановится в четырнадцать, возвращаться в обычную школу уже некуда. Все это знают – и всё равно приводят детей.` | keeps the institutional risk explicit |
| RU02B-11-04 | `cards.ts:544` | `She plays when it is on the timetable.` | `Она играет, когда теннис стоит в расписании.` | cool path; follows structure rather than asking for more |
| RU02B-11-05 | `cards.ts:545` | `She has asked whether she can go more often.` | `Она спросила, можно ли приходить чаще.` | warm path; her first direct request for more time |
| RU02B-11-06 | `cards.ts:548` | `The coach says she has kept up, and nothing more than that.` | `Тренер говорит, что она не отстаёт. И больше ничего.` | deliberately restrained assessment |
| RU02B-11-07 | `cards.ts:549` | `The coach says the limit on this is her week, not her hands.` | `Тренер говорит, что предел сейчас ставят часы в неделе, а не её руки.` | time, not ability, is the stated constraint |
| RU02B-11-A1 | `cards.ts:555` | `Ordinary school` | `Обычная школа` | |
| RU02B-11-A2 | `cards.ts:556` | `No change to what you pay. Her afternoons stay hers.` | `Расходы не меняются. Время после школы остаётся её.` | preserves time as the benefit |
| RU02B-11-B1 | `cards.ts:564` | `The sports school` | `Спортивная школа` | |
| RU02B-11-B2 | `cards.ts:566` | `About twice the club, and it takes most of her week with it.` | `Примерно вдвое дороже клуба – и забирает почти всю её неделю.` | the two-times comparison matches the stored costs |

### The tournament question returns

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02B-11-T1 | `cards.ts:576` | coach mentions the spring Local Open twice | `Весной будет местный открытый турнир. Тренер уже дважды его упомянул – сначала ей, потом вам.` |
| RU02B-11-T2 | `cards.ts:579` | `Put her name down` | `Подать заявку` |
| RU02B-11-T3 | `cards.ts:580` | `An entry and a weekend, on top of the year.` | `Взнос и поездка на выходные – сверх расходов за год.` |
| RU02B-11-T4 | `cards.ts:581` | `Not this year` | `В этом году не ехать` |
| RU02B-11-T5 | `cards.ts:582` | `Nothing extra. She practises that weekend like any other.` | `Дополнительных расходов нет. В эти выходные она тренируется как обычно.` |

The action labels remain the same as at ten. The escalation belongs in who asks and how often, not
in a button that pressures the player toward one answer.

## 9. Age twelve – the derived fork

The game derives one of two faces from the years already lived. Neither face is random, and the
Russian copy must not imply diagnosis, fate or a permanent personality trait.

### 9A. She has gone quiet

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-12Q-01 | `cards.ts:594` | `She is twelve` | `Ей двенадцать` | |
| RU02B-12Q-02 | `cards.ts:595` | `She does not want to go on Thursday.` | `В четверг она не хочет идти на тренировку.` | restores the destination explicitly |
| RU02B-12Q-03 | `cards.ts:600` | three quiet weeks | `Так уже три недели. Ни сцены, ни объяснений. Просто к шести часам у неё каждый раз находится другое дело.` | quiet avoidance, not melodrama |
| RU02B-12Q-04 | `cards.ts:603` | `She has stopped talking about it at dinner.` | `За ужином она больше не говорит о теннисе.` | names the subject instead of leaving a Russian pronoun hanging |
| RU02B-12Q-05 | `cards.ts:604` | `She is not tired of tennis. She is tired of this week.` | `Она устала не от тенниса. Она устала от такого расписания.` | clarifies that the repeating week is the problem |
| RU02B-12Q-06 | `cards.ts:607` | `The coach has seen it before and is not surprised by it.` | `Тренер видел такое раньше и не удивляется.` | no diagnosis |
| RU02B-12Q-07 | `cards.ts:608` | `The coach says she is not the first to go quiet at twelve.` | `Тренер говорит, что в двенадцать так замолкают многие.` | normalizes without dismissing her |
| RU02B-12Q-A1 | `cards.ts:614` | `Let her stop for a season` | `Дать ей отдохнуть сезон` | a pause, not retirement |
| RU02B-12Q-A2 | `cards.ts:615` | `A quarter of what this year was going to cost. She keeps her Thursdays.` | `Четверть от запланированной стоимости года. Четверги снова её.` | the one-quarter comparison matches the stored costs |
| RU02B-12Q-B1 | `cards.ts:623` | `Ask her to finish the year` | `Попросить её закончить год` | asks; does not order |
| RU02B-12Q-B2 | `cards.ts:624` | `What you are paying now, for one more year of it.` | `Текущие расходы ещё на один такой год.` | concise cost consequence |

The coach asks again on this face:

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02B-12Q-T1 | `cards.ts:636` | coach asks again and asks for thought | `Тренер снова спросил про местный открытый турнир и на этот раз попросил не отвечать сразу.` |
| RU02B-12Q-T2 | `cards.ts:639–642` | repeated answer pair | `Подать заявку` / `В этом году не ехать` |
| RU02B-12Q-T3 | `cards.ts:640` | entry note | `Взнос и поездка на выходные – сверх расходов за год.` |
| RU02B-12Q-T4 | `cards.ts:642` | decline note | `Дополнительных расходов нет. В эти выходные она тренируется как обычно.` |

### 9B. She asks for more

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-12M-01 | `cards.ts:696` | `She is twelve` | `Ей двенадцать` | same age, same kicker |
| RU02B-12M-02 | `cards.ts:701` | `She has asked you for more than she is getting.` | `Она попросила больше тенниса, чем у неё есть сейчас.` | states the request before the answers |
| RU02B-12M-03 | `cards.ts:702` | girls-on-the-board scene | `Она стала расспрашивать о девочках с клубной доски: куда они уехали и в каком возрасте. Потом попросила то же, что было у них: больше часов, тренера получше и год, построенный вокруг тенниса.` | concrete ambition, not a destiny claim |
| RU02B-12M-04 | `cards.ts:709` | `She is asking for a year bigger than any she has had.` | `Она просит, чтобы следующий год вместил больше тенниса, чем любой прежний.` | cool path; scale rather than certainty |
| RU02B-12M-05 | `cards.ts:710` | `She has worked out what the next step is and she wants it.` | `Она поняла, каким будет следующий шаг, и хочет его сделать.` | warm path |
| RU02B-12M-06 | `cards.ts:713` | `The coach says she is asking the right question a little early.` | `Тренер говорит, что вопрос правильный – просто задан чуть рано.` | candid, not discouraging |
| RU02B-12M-07 | `cards.ts:714` | `The coach has been waiting for her to ask.` | `Тренер только и ждал этого вопроса.` | role only; no invented name |
| RU02B-12M-A1 | `cards.ts:720` | `Keep it the size it is` | `Оставить всё как есть` | refers to the year, not to her ambition |
| RU02B-12M-A2 | `cards.ts:721` | `What you are paying now. She stays where she is for a year.` | `Текущие расходы. Ещё год на том же уровне.` | says what remains unchanged |
| RU02B-12M-B1 | `cards.ts:729` | `Give her the year she is asking for` | `Дать ей год, о котором она просит` | meets her explicit ask |
| RU02B-12M-B2 | `cards.ts:731` | `About two and a half times what you pay now, for as long as it lasts.` | `Примерно в два с половиной раза дороже нынешнего – на всё время, пока этот путь продлится.` | the 2.5-times comparison matches the stored costs |

On this face she asks for the tournament herself:

| id | source | English | Russian |
| --- | --- | --- | --- |
| RU02B-12M-T1 | `cards.ts:743` | she asks twice on different days | `Она хочет заявиться на весенний местный открытый турнир. Просила дважды, в разные дни.` |
| RU02B-12M-T2 | `cards.ts:744–747` | repeated answer pair | `Подать заявку` / `В этом году не ехать` |
| RU02B-12M-T3 | `cards.ts:745` | entry note | `Взнос и поездка на выходные – сверх расходов за год.` |
| RU02B-12M-T4 | `cards.ts:747` | decline note | `Дополнительных расходов нет. В эти выходные она тренируется как обычно.` |

### What the fork says it read

The three branches below are fixed categories, not arbitrary counted nouns. Russian can therefore
store complete clauses and avoid runtime case assembly.

| key | English | Russian |
| --- | --- | --- |
| sentence | `The years behind it: {a}, {b}, {c}.` | `Вот из чего сложились эти годы: {a}; {b}; {c}.` |
| one-to-one.none | `never a coach to herself` | `ни одного года с индивидуальными занятиями` |
| one-to-one.some | `some of it one to one` | `иногда – индивидуально с тренером` |
| one-to-one.most | `most of it with somebody to herself` | `большую часть времени – индивидуально с тренером` |
| tournaments.none | `nothing entered` | `ни одной турнирной заявки` |
| tournaments.some | `one draw sheet with her name on it` | `хотя бы одна сетка с её именем` |
| light.none | `and no year left to look after itself` | `ни одного года полегче` |
| light.some | `and one year you kept light` | `один год вы оставили лёгким` |
| light.many | `and more than one year you kept light` | `несколько лет вы оставили лёгкими` |

The English `one draw sheet` is unsafe when the category means one or more entered tournaments.
`Хотя бы одна` states the actual branch without inventing a count.

## 10. Age thirteen – the junior tour is one year away

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-13-01 | `cards.ts:648` | `She is thirteen` | `Ей тринадцать` | |
| RU02B-13-02 | `cards.ts:649` | `The junior tour opens at fourteen.` | `В четырнадцать ей откроется юниорский тур.` | personal eligibility, not an abstract opening date |
| RU02B-13-03 | `cards.ts:650` | calendar-on-the-wall scene | `В январе клуб вывешивает календарь. Списки участников, рейтинговые очки, целый год турниров. Она читает его как расписание. Ехать или нет, решать ещё не в этом году.` | the professional decision remains ahead |
| RU02B-13-04 | `cards.ts:654` | `She knows which of the girls on the board are going.` | `Она знает, кто из девочек на доске поедет.` | cool path |
| RU02B-13-05 | `cards.ts:655` | `She knows which of the girls on the board are going, and when.` | `Она знает, кто из девочек на доске поедет и когда.` | warm path carries one more detail |
| RU02B-13-06 | `cards.ts:658` | `The coach will tell you what it looks like in the spring.` | `Весной тренер скажет, как это выглядит со стороны.` | same on both derived paths |
| RU02B-13-07 | `cards.ts:661` | `Wait for the coach` | `Дождаться мнения тренера` | says what the wait is for |
| RU02B-13-T1 | `cards.ts:682` | she writes the Local Open date herself | `Она сама вписала дату местного открытого турнира в кухонный календарь.` | final step of the asking escalation |
| RU02B-13-T2 | `cards.ts:683–686` | repeated answer pair | `Подать заявку` / `В этом году не ехать` |
| RU02B-13-T3 | `cards.ts:684` | entry note | `Взнос и поездка на выходные – сверх расходов за год.` |
| RU02B-13-T4 | `cards.ts:686` | decline note | `Дополнительных расходов нет. В эти выходные она тренируется как обычно.` |

The heavy-theme switch on this final card uses the already drafted RU-02A `Тяжёлые темы` block.
It must remain a shared catalogue unit with the wizard and settings.

## 11. Voice and structural notes

1. `Ей пять / шесть / семь / восемь / девять / десять` is the canonical Russian kicker shape.
   Later ages must follow it.
2. Narration observes; it does not retroactively announce talent. The first cards know persistence,
   enjoyment and attention, nothing about her ceiling.
3. `Тренер` is used as a professional role without a name or personal pronoun. Russian grammatical
   form must not grow into invented biography or gendered pronouns in surrounding sentences.
4. The `cool` and `warm` arms are identical at these ages because the player has not yet made a
   training decision. Localization must preserve that identity rather than adding variety the model
   cannot justify.
5. The family-origin answers stay equal controls. Wording, punctuation and layout must not frame the
   wealthier start as the recommended choice.
6. The first card is already the tallest because it contains identity and origin controls. Russian
   strings need 375 × 667 phone-fit verification before landing.
7. Relative-cost wording is mechanically checked against the stored values: three times at eight,
   four times at nine, and one month of group lessons at ten. Localization must not soften or round
   those relationships into a different promise.
8. `Not this year` is not a permanent refusal. Russian must retain that temporal boundary because
   the tournament question returns in later years.

## 12. The childhood tournament flow

The same flow can appear after several childhood cards. It therefore receives one translation
unit, not a separate set of words at every age. The tournament name remains the term established at
age ten: `местный открытый турнир`.

### 12.1 Shared screen and match controls

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-LO-01 | `cards.ts:877` | `The Local Open` | `Местный открытый турнир` | descriptive event name, not a protected title |
| RU02B-LO-02 | `cards.ts:881` | `Go on` | `Дальше` | after one match and on ordinary result cards |
| RU02B-LO-03 | `cards.ts:894` | `Begin` | `Начать` | starts the tournament flow |
| RU02B-LO-04 | `cards.ts:895` | `Watch match` | `Смотреть матч` | consistent with the main tournament flow |
| RU02B-LO-05 | `cards.ts:901` | `Skip the rest of the weekend` | `Пропустить оставшиеся матчи` | says exactly what the control skips; `выходные` is atmosphere, not the object |
| RU02B-LO-06 | `cards.ts:918` | reassurance after retirement | `С ней всё в порядке – просто вымоталась. Всю дорогу домой она спит, а через несколько дней снова просится на корт.` | this is true only in the prologue; it must not leak into career injuries |
| RU02B-LO-07 | `PrologueLocalOpen.vue:325,370` | `vs` | `–` | visual separator; accessible wording should expose `{name} против {name}` |

`Пропустить оставшиеся матчи` is intentionally more concrete than the English line. The action does
not skip a real weekend in the calendar; it skips the rest of this tournament presentation. It also
stays truthful when only one match remains.

### 12.2 Draw size and round labels

These are shared tournament formatters, not prologue-only literals. They should be translated once
and reused by the childhood and career flows.

| id | source shape | English example | Russian rule |
| --- | --- | --- | --- |
| RU02B-LO-F1 | `localDrawLine(drawSize)` | `8-player draw` | `Сетка на {n} участниц` |
| RU02B-LO-F2 | `stageLabel` | `Final` | `Финал` |
| RU02B-LO-F3 | `stageLabel` | `Semifinal` | `Полуфинал` |
| RU02B-LO-F4 | `stageLabel` | `Quarterfinal` | `Четвертьфинал` |
| RU02B-LO-F5 | `stageLabel` | `Round of 16` | `1/8 финала` |
| RU02B-LO-F6 | `stageLabel` | `Round of 32` | `1/16 финала` |

The general `Round of {remaining}` rule is `1/{remaining / 2} финала`. It must be a formatter rather
than a catalogue with only 16 and 32: a larger draw should not fall back to English. In this game
the entrants are girls and women, hence `участниц`. If the same formatter later labels a genuinely
mixed field, it needs a domain argument rather than a grammatically false neutralization.

### 12.3 She wins the tournament

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-LO-W1 | `cards.ts:940` | `She won it.` | `Она выиграла турнир.` | names the object naturally in Russian |
| RU02B-LO-W2 | `cards.ts:941` | `Three matches on one weekend, and she is the last one still on the court.` | `Три матча за одни выходные – и на корте осталась только она.` | keeps the compact culmination |
| RU02B-LO-W3 | `cards.ts:942` | `She has not put the cup down since.` | `С тех пор она не выпускает кубок из рук.` | child-scale detail, not résumé language |
| RU02B-LO-W4 | `cards.ts:943` | `The coach says the draw was small and she still had to win it.` | `Тренер говорит: сетка была небольшой, но выиграть её всё равно надо было.` | praise remains measured |

### 12.4 She loses the final

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-LO-FN1 | `cards.ts:948` | `She got to the final.` | `Она дошла до финала.` | |
| RU02B-LO-FN2 | `cards.ts:949` | `Saturday, then Sunday morning, then one more match she did not win.` | `Суббота, воскресное утро – и ещё один матч, который она не выиграла.` | does not turn runner-up into failure copy |
| RU02B-LO-FN3 | `cards.ts:950` | `She wants to know when the next one is.` | `Она спрашивает, когда будет следующий турнир.` | restores the Russian referent |
| RU02B-LO-FN4 | `cards.ts:951` | `The coach says the last one is the hard one.` | `Тренер говорит, что последний матч всегда самый трудный.` | `всегда` expresses the coach's general reading |

### 12.5 She goes out before the final

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-LO-L1 | `cards.ts:956` | `She went out before the final.` | `Она выбыла до финала.` | standard draw language |
| RU02B-LO-L2 | `cards.ts:957` | `A long drive, a court she had never seen, and it was over sooner than the journey.` | `Долгая дорога, незнакомый корт – и всё закончилось быстрее, чем поездка сюда.` | the trip and abrupt ending stay in the frame |
| RU02B-LO-L3 | `cards.ts:958` | `She watched the girls who were still in it.` | `Она смотрела матчи девочек, которые остались в сетке.` | `в ней` would have a weak referent in Russian |
| RU02B-LO-L4 | `cards.ts:959` | `The coach says the first one is never the one that counts.` | `Тренер говорит, что первый турнир ещё ничего не решает.` | translates the reassurance, not the idiom |

### 12.6 She cannot finish the match

| id | source | English | Russian | note |
| --- | --- | --- | --- | --- |
| RU02B-LO-H1 | `cards.ts:987` | `You walk out to her.` | `Вы выходите к ней.` | the parent acts immediately |
| RU02B-LO-H2 | `cards.ts:988` | retirement scene | `Она просто вымоталась – ничего хуже. Когда вы доходите до неё, это уже видно. Турнир продолжается без вас, но сейчас это не важно.` | reassurance without inventing an injury |
| RU02B-LO-H3 | `cards.ts:991` | `She is asleep before you reach the motorway.` | `Она засыпает ещё до выезда на трассу.` | `трасса` travels better than a country-specific road class |
| RU02B-LO-H4 | `cards.ts:992` | `The coach says a quiet week is all this needs.` | `Тренер говорит, что ей нужна только спокойная неделя.` | no treatment or diagnosis the model does not hold |
| RU02B-LO-H5 | `cards.ts:993` | `Hold her` | `Обнять её` | the only control is an act of care, not an abstract continuation |

The short reassurance in RU02B-LO-06 appears at the retirement moment; the full scene then gives the
parent an action and closes the weekend. The deliberate repetition is functional, but the two lines
must not repeat the same sentence word for word.

### 12.7 Counter-aware coach reactions

These lines read the shape of this and earlier weekends. Russian must preserve each condition; a
generic consolation line would recreate the repetition defect the counter was built to remove.

| id | condition | English | Russian |
| --- | --- | --- | --- |
| RU02B-LO-C1 | first title, not first weekend | `The coach says the first one she wins is the one she will remember.` | `Тренер говорит, что первую победу на турнире она запомнит навсегда.` |
| RU02B-LO-C2 | she has won before | `The coach says that is not the first cup she has carried home.` | `Тренер напоминает: это уже не первый кубок, который она везёт домой.` |
| RU02B-LO-C3 | another lost final | `The coach says she knows these weekends now – the last match is still the hard one.` | `Тренер говорит, что такие выходные ей уже знакомы – последний матч всё равно самый трудный.` |
| RU02B-LO-C4 | consecutive opening losses | `The coach says this is the part nobody tells you about, and that it passes.` | `Тренер говорит, что об этой части никто не предупреждает. Но и она проходит.` |
| RU02B-LO-C5 | opening loss after a better weekend | `The coach says she has had better weekends than this one, and will again.` | `Тренер говорит, что у неё уже бывали выходные лучше – и ещё будут.` |
| RU02B-LO-C6 | first weekend, at least one win | `The coach says she got past the first one, and that is where it starts.` | `Тренер говорит, что первый матч она прошла. С этого всё и начинается.` |
| RU02B-LO-C7 | later weekend, at least one win | `The coach says she is winning matches at these weekends now, not just turning up.` | `Тренер говорит, что теперь она приезжает сюда не просто участвовать – она выигрывает матчи.` |

`Первая победа на турнире` in C1 means the first tournament title, not her first match win. The noun
is necessary because bare `первая победа` would be contradicted by the matches she won on the way to
an earlier final.

## 13. Tournament-flow implementation notes

1. `vs` is currently literal template text, not copy-table data. Localization must remove both
   visible English instances and provide a Russian accessible comparison, not merely hide them.
2. `stageLabel` is presently an English string generated in the engine. The long-term catalogue
   should carry a semantic round identifier or localize at projection time; parsing `Final` and
   `Round of 16` back out of display strings in Vue would make English the hidden data model.
3. `localDrawLine` needs Russian plural handling even though the current prologue draw is eight.
   The safe surface form is `Сетка на {n} участниц`, whose noun stays genitive plural after every
   numeral in this construction.
4. The hurt reassurance is prologue-only by design. Reusing it as generic MatchViewer Russian copy
   would falsely promise a quick return after real career injuries.
5. Every result card reuses `Дальше`; it should refer to the shared control key rather than carry
   four separately editable translations.
6. Phone LQA must cover the long retirement paragraph, `Пропустить оставшиеся матчи`, and round
   labels at both 375 × 667 and the widest supported draw.

## 14. Next slice

The next pass closes the prologue with the handover: the coach's two readings, age-aware heading,
nine-year cost, tournament summary and the two ways out into the career or a new childhood.
