---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The mandatory block

The comment essays that stood above the `mandatory` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `mandatory`

```ts
  // --- THE MANDATORY REGIME (W3-ACT2, act2-pro-tour.md §6 — the owner's spec as canon) ----------
  //
  // «10 штрафных очков за 52 недели -> отстранение на 4 недели. Источники: пропуск обязательного
  // турнира, поздний отказ, неявка. Обязательные турниры только для топ-50: 4 Шлема, 1000-ки, шесть
  // 500-к.» Verbatim, and every number below is either that sentence or the one adaptation the
  // sentence itself authorises ("counts adapted to our calendar grid in act 3").
  //
  // ⚠⚠ THE TOUR PUNISHES; THE GAME NEVER DOES. The owner's standing ruling — «мы ни за что не
  // наказываем» — is not softened by this block, it is what SHAPES it, and it lands as four
  // structural rules rather than as a tone of voice:
  //   1. EVERY OBLIGATION IS ANNOUNCED BEFORE IT CAN BITE. The desk writes when the entry deadline
  //      of a mandatory event passes with her not on the list, one week before the week itself, so
  //      the letter is a warning and not a receipt. The entry-lifecycle letters W2-LADDER shipped
  //      are the pattern and this is the same surface.
  //   2. AN OBLIGATION SHE COULD NOT MEET IS NOT AN OBLIGATION. It binds only if she was actually
  //      able to enter — inside the acceptance list, old enough, not injured, not already committed
  //      to that week and not suspended. See `mandatoryBinds`: the tour's real rule excuses a
  //      medical withdrawal, and a rule the game manufactured out of a condition floor would be a
  //      punishment nobody chose.
  //   3. THE PRICE IS ALWAYS NAMEABLE. Each source has its own number and the refusal quotes it, so
  //      a penalty reads like a bill and never like a verdict.
  //   4. NOTHING IS RETROACTIVE. The ledger is a rolling 52 weeks, so points age out on their own.
```
