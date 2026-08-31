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

- [x] **1. «при нажатии на Next tournament на home я вижу страницу, где сначала идут результаты
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

  **SHIPPED** (`r31a/week-entry-intent`). The reason travels with the tap. Home's plate emits
  `navigate → 'week:tournament'` instead of `'week'`; App.vue's `openWeek` records it beside
  `openMarket` and hands it to `ThisWeekScreen` as `entry`; on that one arrival the tournament
  section renders above `WeekRecapCard`. Everything else – a tick, a reload, the × and its
  destination, the `Proceed to Home` footer – is byte-identical, and the recap is still on the page
  with its close, one screenful down.

  ⚠ **The order was NOT swapped, and the guard for that is the arm that matters.** `App.vue` clears
  the entry back to `'story'` on EVERY resolved week rather than only on the ones that navigate,
  because when a week resolves while the player is standing on the screen he reached from the plate
  the tab never changes – a reset hung off a tab change would never fire and his next tick would open
  on the tournament. `tests/component/round31-week-entry.test.ts` mounts the real shell for both
  arrivals, including that one; deleting the reset reddens it alone.

  ⚠ **No scroll.** The other candidate shape was `scrollIntoView`, and it was refused on two counts:
  the screen has a sticky header AND a `has-proceed` footer, so the target can land under either, and
  happy-dom computes no layout – the assertion that it did not is unwritable there, and a guard that
  cannot fail is not a guard.

  Files: `src/components/screens/HomeScreen.vue`, `src/App.vue`,
  `src/components/screens/ThisWeekScreen.vue`; guards in
  `tests/component/round31-week-entry.test.ts` (new, 8 arms, 3 mutations) and two re-aimed pins in
  `tests/round13-nav.test.ts`. Zero diff in `src/engine|worker|db|shared`; schema stays 67.

- [x] **2. «что за Her sponsor cut 85% мне каждую неделю пишут на week results и что там снова за
  цифры странные появились?»** – **build.** His own specification, restated in full:

  ```
  Income        – то, что пришло с турнира
  Other income  – Другие семейные доходы      (можно и Family income)
  Spent         – То, что потрачено на дорогу + другие траты недели
  Balance       – что в итоге пришло на счет  (ну или ушло, в зависимости от исхода)
  ```

  ...and under them one memo line: her cut **от Income**.

  **SHIPPED** (`r31a/week-entry-intent`). Two defects, both closed:

  - **`Income` was not what its label said.** `incomeCents` is the family's WHOLE week, so the row he
    reads as «то, что пришло с турнира» silently carried sponsor, brand, wage and interest money, and
    `Family income` was a SLICE of it derived from her cut's base (`income − (base − cut)`) – which
    is why it appeared on weeks that split a cheque and vanished on the rest. `Income` is the
    tournament's own cheque now and `Family income` is `income − prize`, moved up into the column as
    an addend. **The three rows sum to the signed Balance, on every week and every save.**
  - **The memo printed one line per rule.** Round 30 #21 answered a real defect – the blend belongs to
    no rule this game states – by ADDING a row to a card he had twice asked to shorten, and the added
    row was the «Her sponsor cut 85%» he is reporting. The memo is the PRIZE part now, its own rate
    against its own cents, **picked out of `kidShareParts` and never recomputed**, typed `string |
    null` so a second line is an impossibility rather than a policy. ⚠ The blend fallback went with
    it: on a mixed legacy week that number is exactly the «61%» he reported, so a week with no prize
    part, no parts at all, or no cut prints nothing. A missing line is honest; a wrong percentage is
    not.

  ⭐⭐ **NO SCHEMA MOVE, and this is the one place the brief was overtaken by the code.** It called for
  a new persisted ledger field and the full four-part move. There was no need: **`'prize'` has been
  its own `WorldEventCategory` since task #17** and `FinanceWeek.byCategory` is persisted, so the
  tournament's own income was already on every save and only the READOUT was missing.
  `FinanceWeekPoint.prizeIncomeCents` is that readout – a snapshot field, which persists nothing –
  so `FinanceWeek` is untouched, **`SAVE_SCHEMA_VERSION` stays 67**, no migration is appended and no
  golden fixture is added. ⭐ It is also strictly better for him: an old save reads correctly on its
  very first week rather than from its next cheque on, so the «legacy week keeps one Income row»
  fallback the brief asked for is not needed and would have been a worse answer.

  ⚠ **No wording moved.** `Family income` is byte-identical – his own name from round 30 #1, which he
  confirmed here – and only its position and its arithmetic changed. `Other income` is still absent
  and is still asserted absent. The `.recap-row-aside` block below the balance is gone because
  keeping both would put the same cents on screen twice, which is the double-count that aside was
  written to prevent.

  Files: `src/engine/world/ledger.ts` (readout only – no draw, no reordering; the frozen MAIN capture
  41550 / `e6b0c709` and `tests/goldenSaves.test.ts` pass untouched),
  `src/shared/protocol/events.ts` (one optional snapshot field),
  `src/components/WeekRecapCard.vue`. Guards: `tests/component/week-recap-kid-share.test.ts` (five
  arms re-aimed, four added) and `tests/component/round29p2-coach-cut-weekly.test.ts` (one re-aimed).
  ⭐ The row list is asserted as a LIST in three places, so a FOURTH pass over this card reddens on
  the row being added rather than only on a row being changed.
