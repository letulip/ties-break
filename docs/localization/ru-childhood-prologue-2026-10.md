---
type: corpus
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-04
---

# RU-02B – childhood prologue, walk and ages five to ten

This is the first narrative slice of the childhood prologue. It covers the shared walk controls and
the first six cards: the quiet opening years, the first training choices and the decision whether to
enter her first tournament. Ages eleven to thirteen, tournament scenes and the handover will follow
as separate readable sections in this same document.

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

## 8. Voice and structural notes

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

## 9. Next slice

The next pass covers ages eleven to thirteen: ordinary school versus sports school, the age-twelve
burnout fork and the junior tour opening. The repeated tournament question is translated with them
because its speaker and pressure change from year to year.
