---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-11
---

# RU-22 – The display boundary's words

⚙ 11.10 agent-authored по бланкетному руллингу; владелец правит вживую.

RU-21 closed with a list of «seams that are code, not translation»: places where a Russian sentence receives an **English word from the code** – a body part, the ladder's name, a finish, the set's ordinal, an age spelled out, the economy's own labels. This wave closes them **at the display boundary** and changes no engine line: the engine keeps writing English words into refs and into the snapshot (saves, digests and the twins hold them byte for byte), and the screen reads each word through a reader table over `t()` at the moment of showing (`src/i18n/words.ts`, the hole table `src/i18n/wordHoles.ts`, the precedent `BLOCK_WORD` of the week grid). English renders itself and never reaches the readers.

## Where the rows are

Every word a reader returns is a **catalogue key with its own row**, so the translator sees it, edits it and nothing Russian is typed in code. Most readers reuse rows that already exist (`Final`, `Champion`, `Runner-up`, `Coach`, `Masseur`, `tile|National`, `national pts` …); the keys below are the ones that did not exist. One row per key; the English cell is the key verbatim (a literal pipe is `\|`).

| Family | Rows |
| --- | ---: |
| Finish words that had no row (`finish\|`) | 2 |
| The four tier words of `TIER_SHORT` that are words, not codes (`tier\|`) | 4 |
| The twelve body parts (`body\|`) and the five descriptors (`hurt\|`) | 17 |
| Set ordinals (`ord\|`) and the nation's place (`place\|`) | 6 |
| Spelled numbers (`num\|`, `numf\|`) | 24 |
| The court row's venues and clauses (`court\|`) | 22 |
| The two competitions (`league\|`) | 2 |
| Engine sentences the census could not see (the hitting partner's three notes) | 3 |
| The college ending's composed detail | 1 |
| How a finish reads in a sentence (`phrase\|`), and the age's noun (`age\|`) | 5 |
| The goal sentences of the tier guide (`gapInResultsNote`, ten messages) | 10 |
| The debt countdown's third noun form (`few\|`) | 1 |
| The Kid screen's school and college notes | 6 |
| The coach's fog lines (`FOG_POOL`; the 45 movement lines already had RU-05's rows) | 5 |
| The entry fee pill (`entryFeeText`) | 2 |
| **Total** | **110** |

## How the readers work

1. **Every reader returns a nominative form**, because the rows around the hole put the word after a colon, a dash or in brackets (RU-21's law). The one adjective is the set ordinal (`доиграв {2} сет`), where the masculine nominative is also the accusative of an inanimate noun.
2. **The lexicon is the owner's.** The twelve body parts and the five descriptors are RU-05 §19.1 and §20.6 verbatim (`lower back` is `поясница`, never `низ спины`); the three tier words are RU-04 §2's compact column; the ladder's compact words (`страна`, `юниоры`, `профи`) are the rows RU-07 already owns under `tile|`.
3. **A name is never a word of any class.** Tournament names, rivals, brands and the kit marks stay Latin by §9.5 and arrive in holes no reader reads.
4. **A word the reader does not know comes back as written** – English on screen is a miss the catalogue counts, never a blank.

## ⚙ 11.10 agent-authored (бланкет)

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

### Finish words that had no row

`Champion`, `Runner-up`, `Winner` and every stage name already have rows; the two words a finish adds are new.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-01 | `finish\|Semifinalist` | `Полуфиналистка` |
| RU22-WRD-02 | `finish\|Quarterfinalist` | `Четвертьфиналистка` |

### The tier's three words

RU-04 §2's compact column: the full labels are localized, the codes (`J30`, `W15`, `WT250`) stay as they are, and a match header may use the compact domestic adjective.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-03 | `tier\|Local` | `Местный` |
| RU22-WRD-04 | `tier\|Regional` | `Региональный` |
| RU22-WRD-05 | `tier\|National` | `Национальный` |
| RU22-WRD-06 | `tier\|Slam` | `Большой шлем` |

### The body and what is wrong with it

RU-05 §19.1 (nominative) and §20.6 (the descriptor, the noun without its place). `niggle` is the pattern RU-05 §20.1 already gives (`лёгкий дискомфорт`); the legacy word `injury` that the diary falls back on is the row `injury` → `травма` that already exists.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-07 | `body\|ankle` | `голеностоп` |
| RU22-WRD-08 | `body\|knee` | `колено` |
| RU22-WRD-09 | `body\|hamstring` | `задняя мышца бедра` |
| RU22-WRD-10 | `body\|calf` | `икроножная мышца` |
| RU22-WRD-11 | `body\|foot` | `стопа` |
| RU22-WRD-12 | `body\|hip` | `тазобедренный сустав` |
| RU22-WRD-13 | `body\|wrist` | `запястье` |
| RU22-WRD-14 | `body\|shoulder` | `плечо` |
| RU22-WRD-15 | `body\|elbow` | `локоть` |
| RU22-WRD-16 | `body\|forearm` | `предплечье` |
| RU22-WRD-17 | `body\|lower back` | `поясница` |
| RU22-WRD-18 | `body\|abdominal` | `мышцы живота` |
| RU22-WRD-19 | `hurt\|soreness` | `боль` |
| RU22-WRD-20 | `hurt\|strain` | `растяжение` |
| RU22-WRD-21 | `hurt\|stress reaction` | `стрессовая реакция` |
| RU22-WRD-22 | `hurt\|tear` | `разрыв` |
| RU22-WRD-23 | `hurt\|niggle` | `лёгкий дискомфорт` |

### The set, and the nation's place

The set ordinal stands before `сет` in an accusative position; the place is a number with the neuter ending the rows already print (`Сборная заняла {0}-е место`).

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-24 | `ord\|first` | `первый` |
| RU22-WRD-25 | `ord\|second` | `второй` |
| RU22-WRD-26 | `ord\|third` | `третий` |
| RU22-WRD-27 | `ord\|fourth` | `четвёртый` |
| RU22-WRD-28 | `ord\|fifth` | `пятый` |
| RU22-WRD-29 | `place\|{0}` | `{0}-е` |

### Spelled numbers

A spelled count, an age in words and the shoot-week count are English words in the code. The Russian is the cardinal in the nominative; `numf` is the feminine of the only two numerals that change with the noun, for the rows that count WEEKS (`съёмочных недель – две`). A row that opens a sentence with the number gets the capital from the reader, not from the table.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-30 | `num\|no` | `нет` |
| RU22-WRD-31 | `num\|zero` | `ноль` |
| RU22-WRD-32 | `num\|one` | `один` |
| RU22-WRD-33 | `num\|two` | `два` |
| RU22-WRD-34 | `num\|three` | `три` |
| RU22-WRD-35 | `num\|four` | `четыре` |
| RU22-WRD-36 | `num\|five` | `пять` |
| RU22-WRD-37 | `num\|six` | `шесть` |
| RU22-WRD-38 | `num\|seven` | `семь` |
| RU22-WRD-39 | `num\|eight` | `восемь` |
| RU22-WRD-40 | `num\|nine` | `девять` |
| RU22-WRD-41 | `num\|ten` | `десять` |
| RU22-WRD-42 | `num\|eleven` | `одиннадцать` |
| RU22-WRD-43 | `num\|twelve` | `двенадцать` |
| RU22-WRD-44 | `num\|thirteen` | `тринадцать` |
| RU22-WRD-45 | `num\|fourteen` | `четырнадцать` |
| RU22-WRD-46 | `num\|fifteen` | `пятнадцать` |
| RU22-WRD-47 | `num\|sixteen` | `шестнадцать` |
| RU22-WRD-48 | `num\|seventeen` | `семнадцать` |
| RU22-WRD-49 | `num\|eighteen` | `восемнадцать` |
| RU22-WRD-50 | `num\|nineteen` | `девятнадцать` |
| RU22-WRD-51 | `num\|twenty` | `двадцать` |
| RU22-WRD-52 | `numf\|one` | `одна` |
| RU22-WRD-53 | `numf\|two` | `две` |

### The booth's counts

The commentary spells its own counts in English (`numberWord(n)`, and `Num(n)` where the count opens the line) and hands the word to the sentence as a parameter. Booth count messages: **17** (8 / 3 / 6). They need no new row – the numerals above are the whole dictionary – only the choice of how each Russian row takes the count, and the rows of RU-08 §26 that took it as a figure were rewritten where a noun followed it:

- **Eight, spelled inside the sentence** (`их два`, `отыграно: два`, `«ровно» было три`): the lower-case numeral. These are the saves of match, set and break points, the break points of a hold, and the three deuce lines.
- **Three that open the sentence** (`Три подряд – …`): the same numeral, the capital kept. These are the three runs of games, whose rows name no noun after the count, so no case or gender is asked of the numeral.
- **Six with a noun after the count** (`5 очков`, `11 ударов`): the count is read as digits and the row carries its own four-branch plural, so the noun is right for every value – `очков` would have been wrong for 21 or 22, and a 6-0 set is a run of 24 points. These are the three point runs and the three long rallies.

The grid of commentary the viewer tests build reaches sixteen of the seventeen; the seventeenth (the opponent's long winner, `{0} shots, and {1} ends it {2}.`) is covered by a case of its own. The serve, rally and miss phrases (`down the T`, `down the line`, `nets it`) never were a leak: the commentary hands them over as references, and each has its Russian row already.

### The court row

`{0} – {1} h, {2}` is the line a family reads every training week: the venue the family's background and the coach's rung can afford, the hours, and a clause that says when they were booked. The words are RU-06's own drafts (`ru-weekly-finance-corpus-2026-10.md`, «Court venue by background and coach rung»), taken verbatim: the venue grid and the four clause pools, in the pools' index order. The English clauses are held to 14 characters so the recap scrap does not wrap; four Russian ones are longer (`самые занятые часы`, `в привычное время`, `непиковый тариф`, `среди недели`) – the draft already warns that the phone LQA may need a short display variant, and the mounted test of the recap scrap (`tests/component/i18n-display-boundary.test.ts`) measures it rather than assuming.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-54 | `court\|Club courts` | `Корты клуба` |
| RU22-WRD-55 | `court\|Indoor courts` | `Крытые корты` |
| RU22-WRD-56 | `court\|Academy courts` | `Корты академии` |
| RU22-WRD-57 | `court\|Performance centre` | `Тренировочный центр` |
| RU22-WRD-58 | `court\|Court hire` | `Аренда корта` |
| RU22-WRD-59 | `court\|Show courts` | `Главные корты` |
| RU22-WRD-60 | `court\|Centre court` | `Центральный корт` |
| RU22-WRD-61 | `court\|peak slots` | `пиковые часы` |
| RU22-WRD-62 | `court\|peak rate` | `пиковый тариф` |
| RU22-WRD-63 | `court\|prime time` | `лучшее время` |
| RU22-WRD-64 | `court\|the busy hours` | `самые занятые часы` |
| RU22-WRD-65 | `court\|off-peak` | `вне пика` |
| RU22-WRD-66 | `court\|quiet hours` | `тихие часы` |
| RU22-WRD-67 | `court\|early slots` | `ранние часы` |
| RU22-WRD-68 | `court\|off-peak rate` | `непиковый тариф` |
| RU22-WRD-69 | `court\|after school` | `после школы` |
| RU22-WRD-70 | `court\|evenings` | `вечером` |
| RU22-WRD-71 | `court\|the usual slot` | `в привычное время` |
| RU22-WRD-72 | `court\|weekday hours` | `по будням` |
| RU22-WRD-73 | `court\|daytime slots` | `днём` |
| RU22-WRD-74 | `court\|mornings` | `утром` |
| RU22-WRD-75 | `court\|midweek` | `среди недели` |

### The two competitions

The college league and the national team's cup name themselves in a hole of the summary rows (`{0}: она выиграла турнир – …`); the words are the ones the booth and the university feed already use.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-76 | `league\|the College League` | `Студенческая лига` |
| RU22-WRD-77 | `league\|the Nations Cup` | `Кубок наций` |

### Engine sentences the census could not see

`ECONOMY.sparring.rungs[n].note` is a property named `note` on an object literal, which the census does not read as copy, so these three sentences were not catalogue keys and the hitting partner's card printed them in English. They enter the catalogue now through the seat `engine.text` (`tools/i18n-seats.ts`, walked from `ECONOMY`), and the card reads them through `engineText`. «Rust» is the sparring partner's whole job (the form spec's fence sentence: the slump is the psychologist's patient, the rust is his); `ржавчина` in quotes is the sport's own word for a week without a match.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-78 | `Takes a quarter off the rust of a week without a match.` | `Снимает четверть игровой «ржавчины» после недели без матча.` |
| RU22-WRD-79 | `Takes half off the rust of a week without a match.` | `Снимает половину игровой «ржавчины» после недели без матча.` |
| RU22-WRD-80 | `Takes three quarters off the rust of a week without a match.` | `Снимает три четверти игровой «ржавчины» после недели без матча.` |

### The coach's two remarks on her form – rows that already waited

`coachFormNote` returns two string literals and the ledger stores each as its own key (`c: { k: eye }`); the census does not read a `return '…'`, so they were not catalogue keys and every career showed them in English. Their Russian was already on file (`ru-staff-feed-2026-10.md`, rows 83 – 84, waiting for a key); the seat `form.eye` (`tools/i18n-seats.ts`, which calls the real function) is what gives them one. No row is added here.

### The college ending's detail

`She went to college – {0}.` receives `1 of 4 years on the scholarship`, composed in English by `tick.ts`; the reader takes the two numbers out of it. The total is read after `из`, so the noun is the genitive in every branch.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-81 | `{0} of {1} years on the scholarship` | `{0} из {1, plural, one {{1} года} few {{1} лет} many {{1} лет} other {{1} года}} по стипендии` |

### How a finish reads in a sentence, and the age's noun

`finishPhrase` says a finish as a goal (`title`, `semi-final`, `round of 16`), not as a person (`finishLabel`'s `Semifinalist`). The Stats screen's next-drop line and the next-goal ladder hand it into a hole; the Russian is the nominative, and a `round of N` is the stage name the draw sheet already uses, in lower case. `age|years` is the noun for the one row that names an age without it (`Her skills at fourteen` becomes `в четырнадцать лет`).

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-82 | `phrase\|title` | `титул` |
| RU22-WRD-83 | `phrase\|final` | `финал` |
| RU22-WRD-84 | `phrase\|semi-final` | `полуфинал` |
| RU22-WRD-85 | `phrase\|quarter-final` | `четвертьфинал` |
| RU22-WRD-86 | `age\|years` | `лет` |

### The tier guide's goal sentences

`gapInResultsNote` said «three more semi-finals at Regional Championship» by gluing an English finish phrase and an `s` into a template literal; the tooltip of every locked rung carried it in English. It is ten whole messages now (the five phrases, one or many), so each noun declines: the count is a number and carries a plural, the tournament is a name in guillemets. The round of N is chosen by a `select` on the draw size (RU-04 §12: 16 → `1/8 финала`; any other size reads `следующий круг`).

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-87 | `one more title at {0}` | `ещё один титул на турнире «{0}»` |
| RU22-WRD-88 | `{0} more titles at {1}` | `ещё {0, plural, one {{0} титул} few {{0} титула} many {{0} титулов} other {{0} титула}} на турнире «{1}»` |
| RU22-WRD-89 | `one more final at {0}` | `ещё один финал на турнире «{0}»` |
| RU22-WRD-90 | `{0} more finals at {1}` | `ещё {0, plural, one {{0} финал} few {{0} финала} many {{0} финалов} other {{0} финала}} на турнире «{1}»` |
| RU22-WRD-91 | `one more semi-final at {0}` | `ещё один полуфинал на турнире «{0}»` |
| RU22-WRD-92 | `{0} more semi-finals at {1}` | `ещё {0, plural, one {{0} полуфинал} few {{0} полуфинала} many {{0} полуфиналов} other {{0} полуфинала}} на турнире «{1}»` |
| RU22-WRD-93 | `one more quarter-final at {0}` | `ещё один четвертьфинал на турнире «{0}»` |
| RU22-WRD-94 | `{0} more quarter-finals at {1}` | `ещё {0, plural, one {{0} четвертьфинал} few {{0} четвертьфинала} many {{0} четвертьфиналов} other {{0} четвертьфинала}} на турнире «{1}»` |
| RU22-WRD-95 | `one more round of {0} at {1}` | `ещё один выход в {0, select, 16 {1/8 финала} 32 {1/16 финала} 64 {1/32 финала} 128 {1/64 финала} other {следующий круг}} на турнире «{1}»` |
| RU22-WRD-96 | `{0} more round of {1}s at {2}` | `ещё {0, plural, one {{0} выход} few {{0} выхода} many {{0} выходов} other {{0} выхода}} в {1, select, 16 {1/8 финала} 32 {1/16 финала} 64 {1/32 финала} 128 {1/64 финала} other {следующий круг}} на турнире «{2}»` |

### The debt countdown's third noun form

The Money screen prints the figure in its own element and the noun after it, so the noun is a separate message and cannot carry the count. English has two forms; Russian has three (`неделя` / `недели` / `недель`). The existing two keys keep their English and become the `one` and the `many`/`other` forms (`RU21-MON-34`, `RU21-MON-35`, reworded in place from the abbreviation `нед. ниже нуля`); the third, `few` (2 – 4, 22 – 24), is a context-tagged twin that English never selects. The refrain `time.` / `times.` needs no third form: the figure ends the sentence (`Сколько раз: 3.`) and no noun follows it.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-97 | `few\|weeks below zero` | `недели ниже нуля` |

### The Kid screen's school and college notes

`schoolCutOffNote` and `collegeNote` (`kidLife.ts`) are engine prose: one fixed sentence about the 1 September cut-off, and three sentences that carry a campus, a year and a total, composed in English with template literals. The screen prints them inside `School – {0}` / `College – {0}` as a hole, so a Russian line stood in front of an English sentence. The reader (`kidNote` in `words.ts`) matches each of the four shapes and renders the WHOLE sentence from a message of its own, so the Russian owns its order and its plural; the campus is one of the three college places (catalogue keys since the seat `engine.text`) or, for a save that never measured an offer, the legacy phrase below. The totals read after `из` and take the genitive in every branch.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-98 | `School runs on a 1 September cut-off and her birthday falls after it – so her last school year ends the summer after she turns 18, a year later than girls born earlier in the same tennis year.` | `Школьный год отсчитывается от 1 сентября, а её день рождения – после этой даты, поэтому последний школьный год заканчивается летом после её 18-летия – на год позже, чем у девочек, родившихся раньше в том же теннисном году.` |
| RU22-WRD-99 | `{0} – she is in year {1} of {2}.` | `{0} – она на {1}-м курсе из {2}.` |
| RU22-WRD-100 | `{0} – she stayed all {1} years and finished the course.` | `{0} – она провела там все {1, plural, one {{1} год} few {{1} года} many {{1} лет} other {{1} года}} и закончила курс.` |
| RU22-WRD-101 | `{0} – 1 year of the {1}, and she left before the course ended.` | `{0} – она проучилась 1 год из {1, plural, one {{1} года} few {{1} лет} many {{1} лет} other {{1} года}} и ушла, не закончив курс.` |
| RU22-WRD-102 | `{0} – {1} years of the {2}, and she left before the course ended.` | `{0} – она проучилась {1, plural, one {{1} год} few {{1} года} many {{1} лет} other {{1} года}} из {2, plural, one {{2} года} few {{2} лет} many {{2} лет} other {{2} года}} и ушла, не закончив курс.` |
| RU22-WRD-103 | `The college place she took` | `Университет, который она выбрала` |

### The coach's weekly training read

The week recap prints one line a week for a coached career: where the coach has seen her move (`MOVE_POOL`, three sentences per skill per how far the movement has got) or, while he cannot read her yet, the fog line (`FOG_POOL`). Both tables are private string arrays in `engine/radar.ts` that no census rule reads, so the lines were never catalogue keys and the card printed them in English; the skill name beside them was the engine's `RADAR_AXIS_LABEL`, also drawn raw. The seat `engine.text` now reads the two tables off the source and the card draws both through `engineText`. **The 45 movement lines already had their Russian** – RU-05's coach-pool rows (`ru-profile-coaching-2026-10.md`, waiting for a key) wake with the seat and are not repeated here; the five fog lines had none. The voice is the same one: plain, terse, a claim about MOVEMENT and nothing else, near the 45 characters the half-width tile holds.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-104 | `Too early to tell what the work is doing.` | `Пока рано судить, что даёт эта работа.` |
| RU22-WRD-105 | `She puts the hours in. Nobody can read it yet.` | `Она выкладывается, но результат пока не прочитать.` |
| RU22-WRD-106 | `We are still learning what we have here.` | `Мы ещё только узнаём, что у нас есть.` |
| RU22-WRD-107 | `The work goes in. What it is worth, nobody knows.` | `Работа идёт. Чего она стоит, пока никто не знает.` |
| RU22-WRD-108 | `Give it a season. There is nothing to read yet.` | `Дайте сезон. Читать пока нечего.` |

### The entry fee pill

`entryFeeLabel` of `shared/money.ts` built the pill's English itself (`entry $40`, `no entry fee`) and was ruled a named leftover at L2-4. The word now lives in two messages (`src/composables/entryFee.ts`); the sum stays `formatCents`. Both Russian forms are the owner's own, from his formatter note (`ru-formatters-countries-2026-10.md`, «Деньги и прочие числа»): the word is part of the phrase, not of the money formatter, and `без вступительного взноса` is never `бесплатно`, because the trip is paid separately. The physio bands (`$54-91/wk`) needed no row: the unit rides the existing `{0}/wk`.

| id | English | Russian |
| --- | --- | --- |
| RU22-WRD-109 | `no entry fee` | `без вступительного взноса` |
| RU22-WRD-110 | `entry {0}` | `взнос – {0}` |

## What this wave did not do, and what it measured

**How it was measured.** The 86 surfaces of the `xx` carpet (`tests/component/i18n-l4-2-xx-carpet-*.test.ts`) were mounted under the real `ru.json` and every text node and copy attribute (`title`, `aria-label`, `placeholder`, `alt`) was read, before and after the wave, against the same list. Before it, 246 distinct pieces of text with a Latin letter in them were not names; **49 of those are gone and 197 remain** – the 49 are the engine words and labels of the classes above (the ladder and its points unit, tiers, finishes and stages, an injury's part, the league and the cup, the college places, the staff notes and the coach's training read, an age in words, the shoot weeks' count, the fee pill and the weekly band). The 197 that remain, sorted by hand:

- **101 Russian sentences with a name, a tier code or a date inside** (`Победа на турнире «World Tour 250»: B. Rutledge, 27 лет.`, `хард · Oct 20–26, 2031`) and **24 bare names, dates and codes** – not leaks: names stay Latin by §9.5, and the English-formatted dates and week labels are RU-13D's.
- **72 English lines**, of which **29 are the product's**: the **coach market's 27** (below), the Home coach plate's 1 and the Kid screen's personality line (two more Kid-tile phrases, `Youngest of all` and `Close to Hana`, were sorted among the bare names above). The other **43 are the carpet's own poses**, not the product: the prologue cards are built when the registry loads, before the locale flips (15; a card built after the flip reads Russian – checked), the album's and the ticket's fixtures (8), the span report's two plain-English rows (5, one of them the ledger row of `ruRawFindings.ts`), the sale dialog's literal props (3), the save names (4), the ending screen's fixture words and the held `natural` paragraph's detail (4), and one each of a chart title, a fixture line, a career code and a replay caption.

**The cuts, each with its reason.**

1. **The coach market – 27 strings on its two surfaces; the one real block left.** ⚙ *Closed by RU-23 (`ru-profile-coaching-2026-10.md`, its last section): the decline and room notes ride a `CopyRef` the engine writes beside the string, the bios and bands read through the display boundary, and the count was 27 only on the age-14 pose – the full set is 40 pooled sentences and fifteen composed ones.* Sixteen bios (a map by portrait id in `world/coachMarket.ts`; RU-05 §16.2 has their Russian, keyed by id), four load notes (`coachLoadNote`; RU-05 §16.3, keyed by tier), four style-fit notes, two halves of a room band and one progress line. Not done because it is not a display-boundary job: (a) the room slot shares its place with `coachDeclineNote` and `coachRoomNote`, composed sentences that carry a name, a rank move and a count of seasons and need a ref from the engine; (b) the engine splits the note at its separator (`coachRoomBand`), so a Russian reading has to be split after it is read; (c) the band texts, the Home plate's short form among them, have no Russian anywhere – about 28 rows to write or to copy under English cells. One wave, with the decline note first.
2. **The Kid screen's tiles – 3 pieces** ⚙ *(closed by RU-23, with the rest of the tile lines of RU-05 §4 – §6; the relationships tile and the own-account card are still named leftovers there)* (`Youngest of all`, `Close to Hana`, the personality line `Impatient and easy-going`, composed from eight words). RU-05 §4–§5 hold the Russian for the family (33 table lines), composed from engine words with a name inside; the reader is a sentence matcher per shape, as the school and college notes are, and each shape wants its own row.
3. **Dates and week labels** (`{week}`, `{when}`, `{deadline}`, `Oct 20–26, 2031`) – RU-13D's formatters; not touched, as the brief said.
4. **The life beats' copy – about 270 catalogue keys no `t()` call asks for** (`lifeBeat.ts` and its copy modules). They are drawn through the refs the writer stores, which the stored-ref sweep of the unit net (§5 of `tests/i18n-display-words.test.ts`) renders under the production context: no engine word of the vocabulary is left in a Russian line. Bookkeeping, not a leak.
5. **The legacy count-word ledger texts** (`point` / `points`, `match` / `matches`, `wk` / `wks`, `time.` / `times.`) – no code asks for them; their count is a number and the plural is the Russian row's. The one pair that needed a third Russian form, `week below zero`, is done (`one|` / `few|` / `many|`).

**How the nets hold it.** `tests/i18n-display-words.test.ts` (111 tests: the table against the catalogue, the vocabulary against the real constants, the screens' messages with the params they pass, English never reaching the hook, a played-career sweep, the mutation arms, this document's rows and counts); `tests/component/i18n-display-boundary.test.ts` and `…-booth.test.ts` (the real components, English and Russian, with the hook switched off as the control: `…-boundary-off.test.ts`, and the gate inside the booth file); the carpet's ru arm (`xxCarpet.ts`, the ledger `ruRawFindings.ts`); `tests/i18n-engine-tails.test.ts` and `tests/i18n-l3-7-viz.test.ts` render the engine producers and the booth's refs under the production context. A word the readers do not know comes back as written; a new hole that names an engine word and is not in `wordHoles.ts` is red in §1.

## Плитка отношений – ⚙ 11.10 по слову владельца («1 г 6 м – да, всё так, докинь»)

| id | English | Russian |
| --- | --- | --- |
| RU22-REL-01 | `tile\|Married` | `В браке` |
| RU22-REL-02 | `tile\|Engaged` | `Помолвлена` |
| RU22-REL-03 | `tile\|Together for` | `Вместе` |
| RU22-REL-04 | `tile\|On her own` | `Сейчас одна` |
| RU22-REL-05 | `tile\|it seems` | `похоже` |
| RU22-REL-06 | `tile\|together {0}` | `вместе {0}` |
| RU22-REL-07 | `span\|y` | `г` |
| RU22-REL-08 | `span\|m` | `м` |
| RU22-REL-09 | `span\|<1m` | `<1 м` |
| RU22-REL-10 | `<1m` (`weddingCopy.ts`) | `<1m` – ⚙ 11.10 движковый компакт-код: под ru его перехватывает span-ридер до t() и показывает «<1 м»; ряд – identity (хинт разводит с тегом span\|<1m) |

Русские значения лидов – его же припаркованные формы RU-17 R02–R05 (их ряды помечены решёнными).

## Слова настроения – ⚙ 13.10, r51 B2 (пункты №15 «Bright» и №22 «Heavy»); агент-автор по бланкетному руллингу – ⚖ 14.10 владелец: «ок, только Heavy пусть будет Мрачная» – все четыре ряда `APPROVED`

Движок отдаёт плитке настроения одно из пяти английских слов (`MOOD_WORD`, `src/engine/spirit.ts`): Glowing, Bright, Steady, Dimmed, Heavy. Плитка «Настроение» на экране девочки и строка настроения в итогах недели печатали это слово как есть, поэтому под ru оно оставалось английским. Теперь экран читает его на границе показа (классы `mood` и `moodRecap` в `src/i18n/words.ts`); движок не тронут.

У `Steady` нового ряда нет. У каждого экрана уже есть своё слово для спокойного состояния – `Спокойна` на плитке девочки (`Steady`) и `Ровная` в итогах недели (`recap|Steady`). Движковое `Steady` читается тем же рядом, что и лицо `norm` на том же экране, чтобы для одного состояния на экране не было двух слов. Сегодня до экрана оно не доходит: нейтральная ступень не может выиграть у тела (`avatarEmotionRead`), и движок слова `Steady` не отдаёт; ряд нужен, чтобы словарь совпадал с таблицей движка целиком и перемена лестницы не вывела английское слово на экран. Остальные четыре слова не имели русского нигде, и на обоих экранах у них одно слово. Если итогам недели нужно говорить иначе, чем плитке, это один ряд с тегом `recap|` и одна строка в `words.ts`.

| id | English | Russian |
| --- | --- | --- |
| RU22-MOOD-01 | `mood\|Glowing` | `Сияет` |
| RU22-MOOD-02 | `mood\|Bright` | `Светлая` |
| RU22-MOOD-03 | `mood\|Dimmed` | `Притихла` |
| RU22-MOOD-04 | `mood\|Heavy` | `Мрачная` – ⚖ 14.10 слово владельца («Heavy пусть будет Мрачная»), `APPROVED`; было «Тяжело на душе» |

## Плитка отношений – имя партнёра, R53 №2 (21.10) – ⚠ ⚠ DRAFT под правку владельца

Владелец: «плашка … может быть отображением статуса отношений и их продолжительности. Если она не говорит имя, то потом в какой-то момент сказать». Имя появляется с помолвкой (`LoveEpisode.partnerName`); строка плитки – статус и имя через двоеточие (именительный, без склонения), вторая строка – срок как раньше.

| id | English | Russian |
| --- | --- | --- |
| R53-REL-01 | `tile\|Married: {0}` | `В браке: {0}` |
| R53-REL-02 | `tile\|Engaged: {0}` | `Помолвлена: {0}` |
| R53-REL-03 | `tile\|Dating: {0}` | `Встречается: {0}` |
| R53-REL-N01 | `partner\|Anton` | `Антон` |
| R53-REL-N02 | `partner\|Bruno` | `Бруно` |
| R53-REL-N03 | `partner\|Casper` | `Каспер` |
| R53-REL-N04 | `partner\|Daniel` | `Даниэль` |
| R53-REL-N05 | `partner\|Elias` | `Элиас` |
| R53-REL-N06 | `partner\|Felix` | `Феликс` |
| R53-REL-N07 | `partner\|Gabriel` | `Габриэль` |
| R53-REL-N08 | `partner\|Henrik` | `Хенрик` |
| R53-REL-N09 | `partner\|Ivo` | `Иво` |
| R53-REL-N10 | `partner\|Jonas` | `Йонас` |
| R53-REL-N11 | `partner\|Karel` | `Карел` |
| R53-REL-N12 | `partner\|Lukas` | `Лукас` |
| R53-REL-N13 | `partner\|Matteo` | `Маттео` |
| R53-REL-N14 | `partner\|Niko` | `Нико` |
| R53-REL-N15 | `partner\|Oskar` | `Оскар` |
| R53-REL-N16 | `partner\|Pavel` | `Павел` |
| R53-REL-N17 | `partner\|Rafael` | `Рафаэль` |
| R53-REL-N18 | `partner\|Samuel` | `Сэмюэл` |
| R53-REL-N19 | `partner\|Tomas` | `Томас` |
| R53-REL-N20 | `partner\|Viktor` | `Виктор` |
| R53-REL-N21 | `partner\|Willem` | `Виллем` |
| R53-REL-N22 | `partner\|Xavier` | `Ксавье` |
| R53-REL-N23 | `partner\|Yann` | `Ян` |
| R53-REL-N24 | `partner\|Zeno` | `Зено` |
| R53-REL-N25 | `partner\|Andrei` | `Андрей` |
| R53-REL-N26 | `partner\|Marco` | `Марко` |
| R53-REL-N27 | `partner\|Ruben` | `Рубен` |
| R53-REL-N28 | `partner\|Stefan` | `Стефан` |
