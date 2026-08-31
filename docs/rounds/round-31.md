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
