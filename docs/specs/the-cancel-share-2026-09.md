---
type: spec
status: current
area: cancel-share
canonical: true
last-reviewed: 2026-09-23
---

# The cancel share reads the paper – the shoot-refund repair (23.09)

Found preparing the round-29 gameplay video (the defect note travels as
`ties-break-video/video1/DEFECT-shoot-cancel-share.md`): cancelling ONE booked shoot handed the
brand back the cheque divided by `shootCount` – and `shootCount` is the PER-YEAR figure wearing a
total's name. The catalogue writes it from `bands[band].shootWeeksPerYear`, and
`chooseShootWeeks` books it once per season of the term, so a three-season $400,000 paper with
six booked weeks refunded $200,000 – half the campaign – for one cancelled shoot of six, and a
`shootCount: 1` paper refunded the whole cheque for one week of several. His ruling, 23.09:
«оставшиеся, делай».

## Current truth

Shipped with this spec (branch `fix/shoot-cancel-share`). `shootCancelCents` divides the cheque by
the shoots ON THE PAPER – `terms.shootWeeks.length`, the cancelled week among the counted – with
the per-year figure kept only as the fallback for a paper that carries no list at all (a belt: the
list has ridden every 'ad' signature since the kind exists). The answer arm computes the share
BEFORE it edits the list, which the tests pin by mutation. §3's numbers are measured, the suite is
green, and the two corners below are stated law rather than surprises.

## 1. Why the paper's list is the honest denominator

Delivered weeks never leave `shootWeeks` – only a cancel or a move edits it – so the list counts
every shoot the cheque still stands behind, wherever in the term the clash lands: the share is the
signature's own fraction, and the delivered shoots' shares stay with the family (the principle his
ruling named – «уже отснятые съёмки бренд получил, их доля возврату не подлежит»). Dividing the
whole cheque by the REMAINING-minus-delivered count instead would refund delivered value at the
tail (cancelling the last shoot of six would hand back the entire cheque, five delivered shoots
included), which is the same defect class pointed the other way.

## 2. The two corners, stated

1. **A repeat cancel drifts one step.** The signature count is not persisted, and re-deriving it
   from the booking law would be a second spelling of `chooseShootWeeks`. So a second cancel on
   the same campaign divides by the shrunken list – six booked, one cancelled, the next share
   reads 1/5. Designed, pinned in the suite as a fact, and rare by construction (it needs two
   clashes on one campaign).
2. **A paper with no list falls back to the season figure** – the old divisor, never to 1 through
   the `Math.max` floor.

## 3. Predicted vs measured

`tools/cancel-share-bench.ts` (deterministic, career-free: the arithmetic under test is
signature-time paper arithmetic; the paper of every catalogue cell is booked by the real
`chooseShootWeeks` path). Run 23.09, `BENCH_EXIT=0`:

| claim | predicted | measured |
| --- | --- | --- |
| refund ratio new/old on 1-season papers | 1.000 – the mass case DOES NOT MOVE | 1.000 on all 16 cells (min = max) |
| ratio on 2/3/4/5-season papers | 1/years exactly, wherever the booker filled the term | 0.500 / 0.333 / 0.250 / 0.200, min = max per band, 55 cells total |
| short-booked cells (booker filled fewer than `perYear x years`) | 0, or printed and explained | 0 |
| the defect report's probe ($400,000 · 3 seasons · 2/year, one cancel of six) | $66,666.67 | old $200,000 -> new $66,666.67 – the report's own number |

The balance reading: «cancel the shoot» becomes cheaper ONLY on multi-season papers, by exactly
the season count – on the one-year papers the game has always shipped, nothing moves. The answer
mix is the player's to re-weigh in play; no policy or corridor reads this price, so no other
number in the game moves with it.

## 4. What the repair touched

`shootCancelCents` and the cancel arm's compute-before-edit order (`world/shootClash.ts`), the
stale «`shootCount` weeks» prose at the signature site (`world/sponsors.ts` – the field is the
catalogue's `shootWeeksPerYear` under a shorter name, and the defect grew exactly in that gap),
the clash suite's fixture (the default paper now carries the real two-shoot WATCH shape) and four
new cases including the order pin and the stated drift. The ledger line and the dialog are
untouched: both always quoted `shootCancelCents`, so they follow the arithmetic.

⚠ Found beside it and – on his word («и карточку с гнилью бенча туда же докинь … иначе потеряем»)
– REPAIRED IN THIS SAME BRANCH: `tools/ad-shoot-bench.ts` crashed at startup on today's engine.
Two rots, both older than this fix: the signed paper was read as «the first ad row», which the
portfolio and the sixteen-year letters made a different, unsigned letter (`shootWeeks` exists only
on a signed paper – the same field this whole spec is about); and §2's construction counters still
called round-29-P9's winter window a violation – on the first repaired run they read 20,079
«off-season» and 7,539 «adjacent» on 20,000 points, every one the winter season working as ruled.
Re-run green end to end: §1 measures again (the racing arm reads ~-6 condition per shoot week),
§2 reads ZERO violations on the P9-aware counters – and 100.0% of 40,000 signature landings fall
in the winter window, which also means a SIGNATURE shoot practically cannot clash with a
tournament any more (winter holds no entries); the clash machinery now serves moved shoots and
old papers. An observation for the owner, not a change. This spec's sweep still lives in its own
`tools/cancel-share-bench.ts`: the legacy harness walks careers, and the arithmetic under test
here is signature-time paper arithmetic.
