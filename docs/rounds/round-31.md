---
type: round-ledger
status: current
area: rounds/31
canonical: false
last-reviewed: 2026-08-31
---

# Round 31 (31.08.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` his · `[!]` REOPENED.

---

- [ ] **1. «при нажатии на Next tournament на home я вижу страницу, где сначала идут результаты
  недели, а потом только ниже весь блок про турнир»** – **build.** ⚠ Diagnosed before filing:

  - Home's plate emits `navigate → 'week'` (`HomeScreen.vue:1310`), which lands at the TOP of
    `ThisWeekScreen`;
  - `WeekRecapCard` renders at line **200**, `NextTournamentPanel` at line **225** – so the week's
    story is above the tournament by construction.

  ⭐⭐ **The defect is not the order, it is that one screen serves two entries and the tap's INTENT is
  lost on the way.** After advancing a week the recap on top is right – that is the whole point of the
  screen. Arriving from «Next tournament» is a request to see the tournament.

  ⚠ So do NOT simply swap the two blocks: that would fix his tap and break the week-advance flow,
  which is the same trade round 30 #1 was about (fixing one reading by breaking another).

## 2. «Her sponsor cut 85%» every week, and the numbers stopped adding up

HIS WORDS: «что за Her sponsor cut 85% мне каждую неделю пишут на week results и что там снова за
цифры странные появились? Я изначально просил просто отразить, что ребенку идет его % с призовых и
всё. А мы уже второй раз там городим неизвестные суммы какие-то.»

Then, asked once more and stated in full – THIS IS THE SPECIFICATION:

    еще раз, у нас изначально было:
    Income - то, что пришло с турнира
    Spent - То, что потрачено на дорогу + другие траты недели
    Balance - что в итоге пришло на счет.

    Я просил:
    Income - то, что пришло с турнира
    Other income - Другие семейные доходы
    Spent - То, что потрачено на дорогу + другие траты недели
    Balance - что в итоге пришло на счет.
    и вот здесь her cut от Income

⚠⚠ THIRD PASS OVER ONE CARD. Round 29 part two #1 grew it to five rows; round 30 #1 cut it back to
three at his instruction; round 30 #21 added a line per rule and produced the sponsor line he is now
reporting. Every one of those was my brief. The pattern is the same each time: a real arithmetic
defect got solved by putting MORE on a card he had already asked twice to make shorter.

TWO DEFECTS, TRACED BEFORE FILING:

(a) `WeekRecapCard.vue` `kidShareMemo` prints one line per rule, so a week with prize and sponsor
    money prints two. He asked for her cut FROM INCOME – the prize rule, one line.

(b) ⭐ THE ROW LABELLED «то, что пришло с турнира» IS NOT THAT. `financeRows` reads `incomeCents`,
    which is the family's WHOLE week – prize, sponsors, brand, everything. And `familyIncomeCents`
    is a derived SLICE of it (`incomeCents − (kidShareBaseCents − kidShareCents)`), so it exists
    only on weeks that split a cheque, appearing and vanishing week to week. His four rows are an
    ADDITION – Income + Other income − Spent = Balance – and the present shape cannot produce it,
    because there is no field carrying tournament income on its own. That is the source of the
    «странные суммы»: the totals genuinely do not add up on screen, because the top row is a
    different quantity from the one its label names.

FIX: carry the week's tournament income as its own ledger field (additive readout – no new draw, the
frozen capture and career hashes unmoved), render his four rows in his order with `Other income`
between Income and Spent, drop the aside below the balance, and print the prize cut alone as the
memo. Legacy weeks keep one Income row and no memo rather than guessing. New persisted field ⇒ the
full four-part schema move off v67.

⚠ NO RENAME. He wrote `Other income` while quoting his own original request; the row is currently
`Family income` because he asked for that name himself in round 29. Left as it stands and put to
him – invariant 4 binds in both directions, and a rename nobody asked for is what created it.

## 3. Why the card reads 80% one week and 31% three weeks later

HIS WORDS: «почему я на одной неделе вижу шанс на карточке турнира 80%, через пару недель 54%, а
еще через неделю или две уже 31%? … это несколько противоречит утверждению "у нас всё заморожено
и повторный заход даст идентичный результат"»

And, on being told the formula: «формула, завязанная на рейтинг – это плохая формула. Рейтинг
меняется регулярно, а вот скиллы всегда с нами и более статичны. Давай переделаем.»

⚠ HIS PREMISE DOES NOT HOLD, AND THE REWORK IS NOT NEEDED – the formula is ALREADY skills-based.
`ratingOf` (`src/engine/match/rating.ts:113`) is

    driver = basePServe(player, REFERENCE) - basePServe(REFERENCE, player)
    rating = RATING_BASE + ELO_PER_SERVE_EDGE * driver

`basePServe` reads SERVE, RETURN AND GROUNDSTROKES – her skill build against a fixed reference
player. The WTA ranking is not an input. "Rating" here names an Elo SCALE, not the ladder position;
the ranking enters only in who is drawn and where she is seeded, never in the strength number.

MEASURED ON THE OWNER'S w896 SAVE, 32 upcoming cards read through `upcomingEvents` – the same call
the screen makes:

    her rating across all 32 cards : 1788..1825   (spread 37, and it is SURFACE – grass 1788,
                                                   hard 1795/1806, clay 1813/1825)
    opponent rating across cards   : 1190..2005   (spread 815)
    chance across cards            : 24%..98%     (spread 74 points)

⭐ Her ranking is ONE number at week 896. If the ranking drove the chance, all 32 cards would print
the identical figure. They do not, and the only thing moving is who is on the other side of the net.
So the answer to his question: **each week's card is a DIFFERENT TOURNAMENT with a different
first-round opponent.** Determinism is intact – same seed and same choices replay the same numbers
at the same weeks. A forecast about a different event each week was never promised to be constant.

⭐⭐ BUT THE MEASUREMENT FOUND A REAL DEFECT, and it is very likely what he is actually reacting to.
First-round opponent by tier, cheapest entry fee first:

    Local Open              n=4   mean opp 1865   mean chance 43%
    Regional Championship   n=2   mean opp 1783   mean chance 54%
    National Series         n=1   mean opp 1504   mean chance 86%
    Junior Tour 30          n=4   mean opp 1610   mean chance 75%
    Junior Tour 60          n=3   mean opp 1543   mean chance 82%
    World Tour 15           n=5   mean opp 1315   mean chance 95%
    World Tour 35           n=3   mean opp 1335   mean chance 94%
    World Tour 500          n=2   mean opp 1744   mean chance 61%
    World Tour 1000         n=1   mean opp 1676   mean chance 69%

⚠⚠ THE LADDER IS INVERTED AT THE BOTTOM. A Local Open (43%) is a HARDER first round than a World
Tour 1000 (69%) and far harder than a World Tour 15 (95%). A neighbourhood tournament should be the
easiest thing on her calendar and is instead the hardest. That is what makes the number look
arbitrary as the weeks pass: the swing is not her form, it is a tier ladder that does not sort.

⚠ Sample sizes are small (n=1..5, one save, one week). Before any fix this needs a proper sweep –
many seeds, many weeks, mean opponent rating and draw size per tier – because the CAUSE is not yet
established: candidates are the local pool not being strength-capped to its tier, and seeding
protection failing on small draws. NOT filed as a fix; filed as a measured finding awaiting his call.

## 4. The round-one opponent is re-drawn every week, for a tournament that has not happened

HIS WORDS: «каждую неделю это другой турнир с другой соперницей в первом круге – разве такое бывает
в реальности? по-моему они точно знают с кем будут играть в первом туре и этот персонаж не меняется,
разве нет? Это применимо к любому турниру в нашей сетке»

⚠⚠ HE IS RIGHT AND MY ITEM-3 ANSWER WAS WRONG ON ITS MAIN POINT. I told him each week's card is a
different tournament. It is not only that: **the SAME tournament re-draws its first-round opponent
as the weeks pass.** Measured on his w896 save by ticking the world forward with no player actions
and re-reading `upcomingEvents` each week, following every event by its own id:

    19 of 27 tournaments changed their round-one opponent while being watched (3–4 observations each)

    wk902 World Tour 1000   [w896: Camila Aydin 69%] [w897: Quinn Sartori 40%] [w898: 39%] [w899: 38%]
    wk903 Junior Tour 60    [w896: Vera Costa 81%]   [w898: Hana Brennan 41%]  [w899: Marta Simic 70%]
    wk902 Junior Tour 30    [w896: Mila Falk 81%]    [w897: Olga Moller 78%]   [w898: Emma Wouters 70%]
                            [w899: Hana Rutledge 96%]
    wk900 World Tour 250    [w896..w898: Bianca Quintero 66%] [w899: Clara Simic 53%]

⭐ THAT IS HIS 80 → 54 → 31 EXACTLY, and it is one card, not three. The largest observed swing on a
single event is 40 points (Junior Tour 60: 81% → 41%). His careers are not moving; the draw is.

CAUSE: `previewEvent` → `drawnField` (`src/engine/season/preview.ts:111`) rebuilds the field on every
read from `selectEntrants(event, cohort, ranking, rng, conditions, excluded)`. The per-event rng is
deterministic (`seed:kidtour:event.id`), but `ranking` and `conditions = rivalConditions(results,
world.week)` are TODAY's – so who is available and how they are seeded changes weekly, and a
different entrant list yields a different neighbour in the bracket. The card's own comment already
concedes this («her odds in round one against the field as it stands TODAY»); what nobody checked is
that a player reads a NAME as a commitment, not as a projection.

⚠ Determinism is still intact – replaying the same seed and choices reproduces these same numbers at
these same weeks. This is not an RNG defect. It is a card promising something the engine has not
decided yet.

THE DESIGN QUESTION FOR THE OWNER, because the honest fix depends on which he wants:
 (a) FREEZE AT ENTRY – once she enters, her round-one opponent is fixed and never re-rolls. Matches
     his «этот персонаж не меняется» and his standing refusal of dice in the planning layer («заявка
     станет частично броском кубика, а это реальная потеря в игре про планирование сезона»).
     Needs the drawn opponent persisted on the entry ⇒ a save-schema move.
 (b) NAME NOBODY UNTIL THE DRAW IS REAL – a far-out card shows the field strength band it already
     computes and no name; the name appears at the deadline week. Truthful to real tennis, where a
     draw six weeks out does not exist. No schema change.
 (c) Both: band before entry, frozen name after.

⭐ RECOMMENDED: (c). (b) alone still lets the number jump between viewings; (a) alone still names a
stranger six weeks early. Together the card only ever says what the engine has actually settled.

TOOL: `tools/r31-draw-stability.ts` – the measurement above, and the acceptance harness for the fix:
after it, the CHANGES count must be zero for entered events.

## 5. «Очередной сезон без кубка и почти 100% ранних вылетов» – measured, on the w933 save

HIS WORDS: «Я продолжаю немного фрустрировать из-за очередного сезона без кубка и с почти 100%
ранних вылетов, пытаюсь свыкнуться с мыслью, что это нормально в теннисе.»

⚠ HE SHOULD NOT SWEAR HIMSELF TO THAT THOUGHT UNTIL IT IS CHECKED, so it was. `world.results` keeps
a rolling 52-week window; 24 entries are in it, 21 of which map cleanly onto their tier's points
table (3 do not – walkover/retirement rows, not counted below).

WHERE SHE FINISHED                    WHERE SHE ENTERED
    final      2                          World Tour 500    9  (lost first match 4)
    quarter    1                          World Tour 1000   7  (lost first match 2)
    R16        6                          Grand Slam        4  (lost first match 0)
    R32        9                          World Tour 250    2
    R64        3                          World Tour 100    1
                                          World Tour 125    1

⭐⭐ THE PREMISE IS WRONG IN BOTH HALVES. First-round exits are 33%, not «почти 100%». And 20 of her
24 entries are at World Tour 500 and above, with four of them Slams – she is playing very nearly
nothing but the hardest events on the calendar. Two finals, a quarter and six R16s at that level is
a strong season, not a broken one; at a Slam she has never lost her opener.

⭐ THE REAL CAUSE OF THE MISSING CUP IS THE CALENDAR MIX, NOT HER LEVEL. Titles on the real tour are
won at 250s and 500s; her window contains two 250s and one 125. This is his own Bublik observation
turned into a measurement – and it is the argument FOR item 4's fix, because a card whose opponent
is re-rolled every week cannot support the choice he wants to make.

## 6. Are there surface kings?

HIS WORDS: «а вот в реальности есть что-то вроде "король травы" или "король глины" … у нас как с
этим дела?»

MEASURED over the 199-player cohort on w933, rating each player on each surface:

    surface spread across the cohort : min 0, mean 31, max 93 rating points
    best-surface distribution        : hard 65, clay 73, grass 61   (balanced)
    HER                              : hard 1773, clay 1791, grass 1755 – a generalist

⚠ BUT THE SPREAD IS THE WRONG METRIC and it flattered the answer. The top of the spread list is
simply the strongest players (a bigger absolute gap follows from a bigger absolute rating). The
metric that makes a specialist is a player's edge over her OWN second-best surface:

    best clay  : Mila Duval +23,  Olga Varga +22,  Mila Mansouri +22
    best grass : Clara Bermudez +21, Quinn Pavic +21, Talia Adler +22
    best hard  : Emma Hendriks +46, Sasha Janssen +44, Rina Marchetti +46

VERDICT: the world has surface PREFERENCES and no surface KINGS. 22 points is a 53% edge between
equals – indistinguishable from noise across a season. A recognisable king of clay needs something
in the 150–250 range (65–75% between equals). The hard-court edge is also systematically double the
other two, which is an asymmetry nobody chose.

⭐ This is a lever, not just a gap: if surfaces carried identity, choosing events by surface becomes
a real strategy – the same planning layer item 4 is about, and the same thing he is asking for when
he talks about picking favourable tournaments. NOT filed as a fix; awaiting his call, and it would
need a spec and a bench under invariant 5.

TOOLS: `tools/r31-exit-where.ts`, `tools/r31-surface-kings.ts`.

## 7. «Цифра победы/заявки ощутимо снижается» – he is right, and the cause is her age

HIS WORDS: «я передал тебе "фрустрацию игрока" и его ощущения … я вижу также, что цифра
победы/заявки ощутимо снижается. Возможно это теннис и здесь так должно быть и ты прав.»

⚠ HE WAS RIGHT AND MY ITEM-5 ANSWER WAS TOO NARROW. `world.results` keeps 52 weeks, so one save
cannot show a trend; five of his kept saves can, since each carries its own window. Union of
w502/w675/w780/w896/w933, deduped by week+tier+points – 86 distinct entries, weeks 626..931:

    season  entries  matches  won  win rate  titles  wins/entry
    12      21       40       21   53%       2       1.00
    14      23       58       35   60%       0       1.52
    16      18       39       21   54%       0       1.17
    17      24       46       22   48%       0       0.92

NOT THE FIELD. Share of entries at World Tour 500 and above: 91% (s14) → 89% (s16) → 83% (s17). The
calendar got slightly EASIER while the win rate fell twelve points, so "she moved up" is refuted.

⭐⭐ IT IS HER AGE, AND THE MAGNITUDE MATCHES:

    week  age   hard  clay  grass  condition
    502   23.0  1838  1857  1819   100
    675   26.0  1850  1870  1831   100
    780   28.0  1856  1875  1837   100
    896   31.0  1795  1813  1777   83
    933   31.7  1773  1791  1755   87

She peaked at 28 (1856 hard) and is 83 rating points below it at 31.7, with condition off its
ceiling too. Against a fixed opponent, −83 points moves a 62% match to 50% – which is very nearly
the 60% → 48% the results show. The age curve is doing exactly what it was built to do.

⭐ THE DEFECT IS NOT IN THE ENGINE, IT IS THAT THE GAME NEVER TOLD HIM. He spent a season assuming
something was broken, and was ready to «свыкнуться с мыслью, что это нормально», because nothing on
screen says she is past her peak. A parent watching a 31-year-old decline is the emotional core of
this game and it is currently silent. FILED AS A FINDING for his call – not a fix, and not part of
item 4.

TOOLS: `tools/r31-winrate-trend.ts`, `tools/r31-her-arc.ts`.

## 8. The draw: what he approved

HIS RULING on the order: «Предлагаю такой порядок … давай и учти вышесказанное мной» – item 4 first,
then surface identity, the inverted tier ladder fixed in passing.

HIS REFINEMENT on the reveal: «можно писать, что жеребьевки еще не было, а потом (когда она
происходит за 1 неделю, 2, 3?) прямо на карточке турнира писать имя и ранг соперницы на 1й круг
внизу возле этого круга с шансом, можно как раз в поле Coach says это делать элегантно».

DECIDED, and he may overrule: the draw is made at **week − 1**. Entries close at the END of week − 2
(`calendar.ts:2060`), so the draw lands the week AFTER he has committed – he chooses on the band and
then learns the opponent, which is both how tennis works and the better scene.

## 9. She is 93% of her peak and the game has never said so

HIS ASK: «да, заведи находку про пик и спад, и тренер вполне может что-то такое говорить. Да и она
сама в конце сезона … могла бы что-то тоже сказать на эту тему. Может уже сейчас что-то можем
сделать в эту сторону?»

HIS QUESTION, ANSWERED: the end-of-season card with two buttons is `RetirementDialog.vue`, and YES
it was changed – round 30 #7 re-worded the lede of its `age` branch. The two buttons stay on purpose:
it is a real choice (retire / one more year), not an oversight. What round 30 did NOT touch, because
nobody had measured it yet, is the decline itself.

⭐⭐ THE NUMBER ALREADY EXISTS AND IS NEVER SHOWN. `physicalShare = physicalMean(skills) /
peakPhysical` (`world/endings.ts:231`) – 1 at her peak and falling every week from `declineStart`
(29). Measured across his saves:

    week 502  age 23.0   share 100.0%
    week 675  age 26.0   share 100.0%
    week 780  age 28.0   share 100.0%
    week 896  age 31.0   share  95.2%
    week 933  age 31.7   share  93.1%

⚠ THE ONLY THING THE GAME DOES WITH IT IS READ IT AS A BOOLEAN: `final: physicalShare <=
ENDINGS.lastOfferPeakShare` (0.55) decides whether this winter's question is the last one. Between
100% and 55% there are forty-five points of the story this game is ABOUT, and not one of them
reaches the screen. That is why item 7 happened: he watched his daughter decline for a season and
concluded the software was broken, because nothing ever told him otherwise.

⚠ Same shape as item 2 and worth naming as a pattern: **the fact was already there and only the
readout was missing.** Third time in this round.

THREE PLACES IT COULD BE SAID, cheapest first – FOR HIS CALL, not dispatched yet:
 (a) `RetirementDialog`'s `age` branch. Its lede is generic today («Twenty-nine is when the question
     starts being asked, not a countdown to anything») while the engine knows she is at 93%.
 (b) The coach, in season – `coachSays` already exists and is already deterministic per event.
 (c) Her own line at season end, which is what he asked for.

⚠⚠ INVARIANT 4 BINDS HERE HARDER THAN USUAL: every one of those is NEW COPY in her voice and the
voice is his. The mechanism can be built and gated, but the sentences go to him for sign-off BEFORE
merge – they must not arrive in his game unread, which is the whole complaint behind invariant 4.

⏸ NOT DISPATCHED. One agent at a time, on his standing instruction («одновременно не надо делать, а
пошагово вполне отлично»); `r31b/draw-reveal` is in flight. This is next in the queue.

TOOL: `tools/r31-peak-share.ts`.
