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
