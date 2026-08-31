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
