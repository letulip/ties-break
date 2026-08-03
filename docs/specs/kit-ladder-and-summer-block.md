# W3 — the kit ladder, and summer as a real training block

Two owner items in one wave, with one thing in common: both add a REAL cost and a REAL benefit to a
system that until now was one-sided. Equipment was a bill with no quality behind it; the summer
holidays were a lighter school row on a calendar and nothing else.

CLAUDE.md invariant 4 asks for predicted-vs-measured. Both halves are measured by benches that ship
with them: `tools/kit-bench.ts` (§6 is new) and `tools/summer-bench.ts` (new).

---

## 1. The kit ladder (owner item 9)

> «Let's make those handles for rackets, shoes and stuff for a user to choose from. Somewhere in a
> ledger maybe?»
>
> «я вообще за оба подхода одновременно, как с тренерами. Мы же точно знаем, что начальные ракетки из
> алюминия тяжелее и хуже во многом, чем начальные композитные, значит экип влияет и на травмы и на
> производительность игрока.»

Four rungs per `KitLine`: `alloy` → `composite` → `performance` → `pro`. Bought on the Money screen,
one line at a time. Moving up buys the item (charged at once, and the line's wear clock resets);
moving down is free and lands at the next scheduled purchase.

### The mechanism, and why the bound could not break

A rung does exactly two things, and both land INSIDE the `clamp01` `kitWearAt` already had:

| knob | what it means |
| ---- | ------------- |
| `startWear` | where on this line's wear curve a brand-new one of these STARTS. An alloy frame is bought at 0.40 of a service life – it plays like a good frame already partly gone. |
| `lifeFactor` | how long that curve is. Cheap kit dies faster (0.8); tour kit barely ages (1.9). |

So every state the ladder can produce is a state the wear model could already produce. The whole
ladder lives inside `[FRESH_KIT, SPENT_KIT]`, **no new modifier channel was invented**, and the
anti-destiny bound is structural rather than tuned.

### Predicted vs measured

| claim | predicted | measured (`kit-bench`) |
| ----- | --------- | ---------------------- |
| the nominal swing does not move | unchanged, by construction | **2.01** skill points, identical to before the wave (§1), against a yardstick of 2.40 |
| the ladder is worth something real | "visible, never destiny" | realised `alloy → pro` = **1.02** skill points (§6) |
| ...and stays under the coach | must be < 2.26 | 1.02 < 2.26 ✔ |
| worn kit costs injury risk | a real but bounded rise | injury threshold ×**1.1602** on `alloy` vs ×**1.0417** on `pro` — **+11.4%** weekly risk on the bottom rung |
| `composite` reproduces the shipped game | exactly | realised penalty 0.390 / injury 1.0841 — the same numbers §2's working row has always printed |

Realised wear per rung (working family, 14→18):

| rung | strings | frame | shoes | mean attribute penalty | injury factor |
| ---- | ------- | ----- | ----- | ---------------------- | ------------- |
| alloy | 0.573 | 0.282 | 0.632 | 0.739 | 1.1602 |
| composite | 0.299 | 0.041 | 0.396 | 0.390 | 1.0841 |
| performance | 0.213 | 0.000 | 0.283 | 0.273 | 1.0566 |
| pro | 0.157 | 0.000 | 0.209 | 0.201 | 1.0417 |

### Against the injury calibration

The last wave calibrated season prevalence to the researched **46–54%** band
(`docs/research/injury-stats-by-age.md`, `docs/specs/fatigue-reprice-2026-08.md`). The ladder moves
`injuryTau` by a POST-DRAW multiply of 1.04–1.16 depending on rung, i.e. the whole ladder is a ±6%
band around the shipped 1.0841 — it cannot push a well-equipped career below the band (the floor is
new kit, exactly 1.0, which every career already reaches on its purchase weeks) nor a badly-equipped
one absurdly above it (the ceiling is `1 + shoeInjuryRise + frameInjuryRise` = 1.32, and no realised
career reaches 1.16).

### The frame's injury half, and what is deliberately missing

`frameInjuryRise: 0.12` against the shoes' 0.20 — the research's own 48%-lower-limb / 28%-upper split.
A stiff dead frame is a tennis-elbow story.

**Not modelled: which part gets hurt.** `drawBodyRegion` spends exactly one pull against a
twelve-entry table, so aiming the result would need either a second draw (forbidden — the private
`seed:injury:<week>` sequence is byte-identical for every existing career) or a second region table
selected by kit, which is a bigger change than this wave's evidence supports. The RATE moves; the
anatomy does not.

### Schema

v37, the three-part move. `world.kit = { grade, sinceWeek }`. The back-fill is `composite` on every
line and `sinceWeek: 0`, both no-ops by construction — see the migration's own note and the
`tests/fixtures/saves/README.md` row.

---

## 2. Summer is a real training block (owner item 2)

> «я играл и брал отпуска между турнирами пропуская и коучинговые сессии в том числе, если мы летом
> сделаем реальную нагрузку с 2 тренировками в день я не вижу ничего плохого, это как раз частично
> компенсирует недостаток тренерских недель в другие периоды, т.е. сделает прокачку эффективнее и
> более полной.»

Season-weeks 25–33. The window moved from `composables/weekDays.ts` into `season/calendar.ts`,
because a week the engine gates on is a week the calendar has to define.

It is **volume, not a better multiplier**: `loadFactor` ×1.4 on `growWeek` (the knob whose own note
says it means "how much of the week she actually trained") and −3 condition, applied beside the knock
credit and the vacation gain so `accrueCondition` keeps its pinned arity-2 zero-RNG contract.

### Predicted vs measured (`summer-bench`, 24 careers × 4 seasons)

| | block weeks/season | development over the career | fatigue |
| ---- | ---- | ---- | ---- |
| training-only career | 9.0 | **+0.35** skill points | 0.0 |
| racing career | 3.9 | **+0.18** skill points | 0.0 |
| from a real deficit (condition 20 at the window's open) | — | — | **−7.0** condition at September (93.0 vs 100.0) |

Two findings worth stating plainly:

1. **The racing row is the design working, not failing.** Most of her summer is a tournament, and
   `summerBlockWeek` stands down on those weeks — a competition week already has its own bonus and
   its own bill. So the block is worth most to the girl who is NOT travelling, which is
   «частично компенсирует недостаток тренерских недель» read literally.
2. **At the condition ceiling the fatigue is invisible, and that is honest.** `recoveryBase` is 8 a
   week, so the −3 is clamped away for a girl who is not already tired. The cost is real only on a
   body that is carrying a season — which is whose summer this is.

### It is never mandatory — the vacation interaction, checked explicitly

`summerBlockWeek` refuses on five weeks: outside the window, a layoff, a **booked family week**, a
tournament week, and a rested knock. Measured:

| | block weeks/season | development |
| ---- | ---- | ---- |
| training-only, one family week per season inside the window | 9.0 → 8.0 | −0.06 skill points over the career |
| racing, same | 3.9 → 3.9 | −0.00 |

So a family holiday in July costs one of nine block weeks and about six hundredths of a skill point
over a whole career, and the package's own condition gain is paid instead. That is a trade, not a
punishment — and a racing career loses effectively nothing, because most of her summer was a
tournament anyway.

### Visibility

The Calendar screen's week titles a summer training week **"Summer block"** and its read-out says
"N days on, two sessions a day – no school, so the work doubles up." The grid draws the morning
session (`trainingAlt`, 09–11, inside the hours school used to own) on court days only, so the
picture and the sentence agree. The Kid screen's school tile reads "Summer break".

Three standing guards were re-aimed with their reason rather than deleted: `weekGrid.ts`'s "no second
court session" header note, the `DAY_SHAPES` note reserving `trainingAlt`, and
`calendar-grid.test.ts`'s "ONE session a day" sweep (which kept passing untouched, because it passes
no summer context — a guard that goes silent on a new week is worse than one that fails).
