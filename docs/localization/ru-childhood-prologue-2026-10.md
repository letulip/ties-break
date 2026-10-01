---
type: corpus
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-01
---

# RU-02B – childhood prologue, walk and ages five to seven

This is the first narrative slice of the childhood prologue. It covers the shared walk controls and
the three opening cards, before the first real training decision at eight. Ages eight to thirteen,
Local Opens and the handover will follow as separate readable sections in this same document.

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
| RU02B-06-03 | `cards.ts:358` | summer-session scene | `На летней тренировке ей дали ракетку, и с тех пор она каждую неделю спрашивает о теннисе. По вторникам на муниципальном корте занимается группа. Занятия почти бесплатные, дорога занимает двадцать минут.` | `тренировка` is clearer than institutional `сессия` |
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

## 5. Voice and structural notes

1. `Ей пять / шесть / семь` is the canonical Russian kicker shape. Later ages must follow it.
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

## 6. Next slice

The next pass starts at age eight, where relative costs, training load and parental decisions enter
the prose. It must keep the exact mechanics beside each choice: municipal court versus club, group
versus one-to-one, and the first Local Open.
