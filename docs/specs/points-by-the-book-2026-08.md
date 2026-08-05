---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-05
---

# Points by the book – three sourced corrections, measured one at a time

**Status: all three corrections built and measured separately. The owner approved all three before a
line was written** – *«с очками надо разобраться точно совершенно»*, *«надо сделать как в
реальности»*, *«значит делаем по точно такой же логике»*.

`docs/research/real-ladder-pace.md` §"THREE CORRECTIONS" found three places where our ranking
arithmetic disagrees with the sport's own rulebook, and `docs/specs/ladder-pace-2026-08.md` §6B
handed two of them forward as step 4. This page is that step. Each correction is a separate arm of a
five-arm A/B, so what each one is worth is attributable rather than inferred.

> **THIS IS NOT A TUNING WAVE.** Every number changed here is a number the 2026 WTA Rulebook or the
> 2026 WTA points chart states outright; none of them is ours to choose. That is why the ship rule
> below is written as *"what would have to break for a correction to be worth reverting"* rather than
> as *"what improvement buys it a place"*. A correction that makes her rank worse is still correct.

---

## 0. THE SHIP RULE, WRITTEN BEFORE ANY AFTER-NUMBER WAS READ

Written 05.08 after the baseline runs and **before the first arm was built**. The previous two waves'
negative results are trustworthy precisely because they did this, and this page keeps the discipline.

**Baseline: the shipped tree at this branch's base (`wave/endings-and-debts`, after ladder-pace step
1 merged), re-measured here rather than quoted.**

| measurement | baseline, this head | for reference: pre-step-1 |
| --- | --- | --- |
| Spearman(skill rank, points rank) over the field | **0.888** | 0.891 |
| mean \|skill − points\| | **52.7 places** | 35.6 |
| her peak rank, grinder / player | **#206 / #160** | #184 / #144 |
| grinder p10 / median / worst | #300 / #428 / #532 | #275 / #358 / #383 |
| player p10 / median / worst | #181 / #234 / #526 | #222 / #296 / #373 |
| careers of 180 reaching top 200 / 100 / 50 / 10 | **0 / 0 / 0 / 0** grinder · **35 / 0 / 0 / 0** player | 0/0/0/0 · 6/0/0/0 |
| ever ranked | 128/180 grinder · 138/180 player | – |
| table shape #1 / #10 / #50 / #100 / #150 / #250 | 11,680 / 4,688 / 1,347 / 830 / 518 / 260 | – |
| rows holding any points, merged probe table | **520 of 719** | – |
| inert acceptance cuts | **2** (w35, w50) | 3 |
| `fieldProsFor` cost | **1.54 ms** per season boundary | 1.17 |
| career bench wall time | **264 s** grinder · **394 s** player | – |

⚠ The brief's baseline (#184 / #144, Spearman 0.891 / 35.6) is the **pre-step-1** one, taken before
`FIELD.size` went 364 → 520. Both columns are printed so nobody has to guess which tree a number came
off. Every arm below is measured against the left-hand column, same command, same tree, same machine.

### The six criteria

**All three corrections ship unless one of these fails. A failure is reported and that correction
alone is reverted**, exactly as `FIELD.earnCurve` and `FIELD.strengthCurve` were.

1. **CORRESPONDENCE DOES NOT GET WORSE.** Spearman ≥ **0.888** and mean |skill − points| ≤ **52.7**
   over the whole professional population.
   ⚠ **And I predict this criterion cannot move, which is the reason it is stated first rather than
   last.** All three corrections change how a ledger is FOLDED or what a rung PAYS; the 520 derived
   professionals are *issued* their books by `fieldPros.ts` and fold nothing. So this is a
   **tripwire, not a test**: if it moves at all, a correction reached somewhere nobody intended it
   to, and that is a finding whatever direction it moved in. The real anti-gift test is 2b.
2. **A CHANCE, NOT A CONVEYOR – AND NOT A GIFT.** Two limbs, and the second is the one that guards
   the failure mode the brief names.
   * **(a)** Of 180 careers, **fewer than 30 (17%)** ever reach the top 100 on either policy arm.
     Zero is a wall and 118 was a delivery service; the band is wide because the owner has not set
     the target, and the shape of the distribution is reported whatever the count.
   * **(b) THE GIFT GUARD.** Her rank is not evidence on its own: re-pricing the two entry rungs
     lifts every book **earned** in the world, and the whole live cohort earns on the same table she
     does. So the merged professional top 200 must **stay a professionals' table**: the median count
     of LIVE girls inside it at career end must remain **under 40 of 200 (20%)**, and it is reported
     beside her peak rank on every arm. Her rank improving while this holds is a climb; both rising
     together is a deflation, and a deflation is not worth shipping whatever it does to her.
3. **THE REAL-CURVE CALIBRATION SURVIVES.** #10 / #50 / #100 / #150 / #300 each stay within ±40% of
   the real anchors (4,000 / 1,400 / 850 / 520 / 190) – the band `tests/season/fieldPros.test.ts`
   already enforces. `act2-pro-tour.md` §11 calls this fit a deliberate achievement and it is not
   this wave's to spend.
4. **THE DOORS STILL SEPARATE PEOPLE.** The number of INERT acceptance cuts (past the pointed rows,
   refusing nobody) does not increase. **Two today** – w35 and w50 – and that is the count to beat,
   not to match. ⚠ Correction 3 raises the bar for holding a book at all, so this is the criterion
   it is most likely to fail, and it is measured on a live world and not only on the probe table.
5. **THE LADDER NEVER GOES DARK, AND THE FIRST RANKING STILL ARRIVES.** Correction 3 delays the week
   she first appears on the list, so: the entry rung stays open at the moment she first has a
   professional result (pinned as a test, not a bench line); the **median age at first ranking stays
   at or below 17.5**; and the share of careers that ever hold a professional ranking falls by no
   more than **10 percentage points** on either arm. The real target is **15.9–16.2**
   (`real-ladder-pace.md` §6) and ours cannot beat 16.0 by construction – every W rung is
   `minAgeYears` 16 – so the band is one-sided on purpose.
6. **COST.** `fieldProsFor` stays under **2.5 ms** per season boundary, the career bench's wall time
   rises by no more than **25%** (264 s / 394 s → 330 s / 493 s), and the persisted ledger does not
   grow at all.

Two things are explicitly **not** criteria, and saying so is the point:

* **Her peak rank on its own.** It is reported on every arm and criterion 2 is what judges it.
* **The R1/R2 exit rate falling.** A 32-draw exits 75% of any field by the second match by
  arithmetic. Reported against the real-world figure, never optimised.

---

*(Sections 1–6 are written after the arms are measured. §0 above is unchanged from the moment it was
committed; the arms had not been built when it was written.)*
