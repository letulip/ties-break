---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-31
---

# The age curve stops being one curve – round 31 #10 + #13 (31.08.2026)

`ECONOMY.development.ageCurve` was `plateauStart 23, declineStart 29` – peak 23–28 – for **every
route and every player**, and `season/cohort.ts` carried the same pair for all 199 rivals. Round 31
§10 checked that against the owner's own WTA reference data and found the mismatch:

    peak ends 28  ==  25-28 via college     ✓ exactly the college window's top edge
    peak ends 28  vs  24-26 direct          ✗ two to four years late

**One curve was being worn by both routes, and it was the college one.** His ruling, 31.08: «я думал
уже так и есть, но тоже неплохо звучит» – he believed the fork already shifted the peak. It did not:
the game modelled the fork's COST (a late ranking start) and none of its SHAPE.

⚠ **The tour's own pool is separately and correctly calibrated and was not touched.** `FIELD.career`
is `peakFrom 22, peakTo 28`, and §10 measured our top-100 mean age at 25.3 against his real 25–27. A
mixed professional field legitimately spans both routes; `fieldPros` is out of scope by measurement,
not by omission.

Three things move the curve now, and a fourth pins it.

---

## 1. What shipped

| | before | after |
| --- | --- | --- |
| direct to the tour | plateau 23, decline 29 | **plateau 22, decline 27** ± spread − injuries |
| via college | plateau 23, decline 29 | **plateau 23, decline 29** ± spread − injuries |
| a rival | decline 29, every one of them | **29 ± 1.5, per player** |
| an existing save | – | **pinned on 23 / 29, exactly as it was** |

- **THE ROUTE** is the fork's own answer (`ForkAnswer`), resolved by `answerFork` at nineteen.
- **THE SPREAD** is one uniform draw on ±1.5 years off `seed:decline`, applied to `declineStart`.
- **THE INJURY PULL** is `0.025` years of peak per week her body has spent off court – one year per
  40 weeks – read off `weeksLostSoFar`, the monotone v40 total, never the pruned `injuryHistory`.
- **THE PIN** is `WorldState.ageCurve`, persisted, written by `answerFork` and by the v68 migration.

`npm run bench:agecurve` (`tools/r31-age-curve.ts`) is the measurement;
`tests/round31-age-curve.test.ts` is the net.

---

## 2. Predicted vs measured

`rank-plateau.md`'s discipline: the prediction is written down first and the measurement is allowed
to refuse it.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| 1 | a direct career peaks ~2 years earlier than the same girl via college | over 24 seeds, **2.00 years** exactly, and the walked arcs cross at 27 | ✓ |
| 2 | the spread is a real band, not a rounding | 4000 seeds: direct **mean 27.01, sd 0.87, range 25.50..28.50**; college **mean 29.01, sd 0.87, range 27.50..30.50** | ✓ |
| 3 | the two routes overlap, so the fork moves odds rather than dominating | **1358 of 4000** direct careers decline later than the earliest college one | ✓ |
| 4 | the cohort spreads the same way | 597 rivals over three worlds: **mean 29.00, sd 0.85, range 27.50..30.49** | ✓ |
| 5 | a badly broken body loses years, not weeks | 120 weeks lost pulls `declineStart` **28.57 → 25.57** and her physical at 32 from **54.84 → 47.81** | ✓ |
| 6 | a clean career sits exactly at its drawn value | 0 weeks lost: `declineStart` unchanged to the last decimal | ✓ |
| 7 | the eighteen frozen career hashes do not move | `careerHashAtSchema(…, 67)` reproduces all three v67 constants **byte for byte**; the six older sets are untouched | ✓ |
| 8 | ...and the three LIVE hashes do not move either | ✗ **they moved – by the version stamp alone.** `tools/frozen-key-diff.ts`: ONE key of sixty-one, `schemaVersion`. See §6 | ⚠ partly |

### 2a. Where she actually peaks – one seed, one plan, one thing different

`curve-walk-0`, direct `26.57` against college `28.57`, walked through the shipped `growWeek`:

```
  route     peak physical   peaks at   falls to 95%   90%    80%
  direct            59.76      26.55             29     31     33
  college           60.19      28.56             31     33     35

   age    direct   college     gap
    25     59.69     59.87   -0.18
    26     59.76     60.00   -0.24
    27     59.23     60.12   -0.89     <- the direct career has turned; the college one has not
    28     57.88     60.19   -2.31
    30     54.47     58.34   -3.87
    32     50.15     54.84   -4.68
```

⭐ **The trade is real in both directions, which is what makes it a fork rather than a penalty.** The
direct career reaches the tour four years earlier and earns four years of ranking she does not have;
the college one is a better tennis player from 27 on and stays one. Over 24 seeds she is **3.63
physical points** ahead of her own direct self at 30.

⚠ **Note the peak LEVEL barely moves** (59.76 vs 60.19). That is the curve's own shape, not a
mistake: the plateau maintains rather than climbs, so a year less of the 18→22 ramp costs about half
a point. The fork buys YEARS, not a better player.

### 2b. The injury control – two careers identical but for injury load

Same seed, same plan, same potential, same college curve. The only input that moves is the weeks off
court, which is what makes this a control rather than a demonstration:

```
  weeks lost   declineStart   peak physical   peaks at   falls to 90%   at 32
           0          28.57           60.19      28.56             33   54.84
          20          28.07           60.13      28.05             32   53.76
          40          27.57           60.07      27.57             32   52.67
          80          26.57           59.94      26.55             31   50.30
         120          25.57           59.81      25.56             30   47.81
         200          24.00           59.57      23.99             28   43.67
```

⭐ **This is the layer round 30 #27's recurrence had no way to express.** An injury that only costs
the week it happens in is a week; a body is a career. Real careers walked through the shipped tick
lose 15–70 weeks by 33, so the effect a player actually meets is **0.4 to 1.8 years** – material,
never catastrophic – and the catastrophic end of the table is reachable only by a career that has
genuinely spent four seasons in rehab.

⚠ The floor holds: a body that has lost 400 weeks reads `plateauStart + 1` and never less. That is a
correctness guard, not a dial – `ageFactor` reads `plateauStart` before `declineStart`, so a decline
age under the plateau would put a career in a band that is still climbing and already falling.

### 2c. Real careers, through the shipped tick

`npm run bench:agecurve` arm 5, the fork answered both ways on the same two seeds:

```
  seed 0 · "continue" -> drew 26.74, lost 70 weeks -> declines at 24.99 · peak 59.51 at 25.40
  seed 0 · "college"  -> drew 28.74, lost 55 weeks -> declines at 27.36 · peak 59.63 at 27.63
  seed 1 · "continue" -> drew 26.94, lost 35 weeks -> declines at 26.07 · peak 60.42 at 26.27
  seed 1 · "college"  -> drew 28.94, lost 58 weeks -> declines at 27.49 · peak 60.50 at 28.05
```

---

## 3. Why the band is ±1.5, and why uniform

His reference gives **windows**, not modes: «24-26 direct, 25-28 via college», with the modern tail
«stretched to 30-35 for the exceptional». A window is a range inside which real peaks fall.

- **±1.5 makes each route a 3-year window**, which is his own table's width.
- **Uniform, not a bell.** A bell would be a claim about clustering that his data does not make. The
  honest reproduction of a window is a flat draw over it.
- **The routes then overlap by one year** (direct 25.5–28.5, college 27.5–30.5), so a long-lasting
  direct player and an early-fading college one are both possible and the route only moves the odds
  by two years. ⚠ A band narrower than the 2-year route gap would have made college strictly
  dominant – the same failure mode the owner named when he held back option B (a decline age earned
  by physical build) because «it risks making physical training strictly dominant».

`plateauStart` does **not** get the spread. His ruling names `declineStart` alone, and the split is
principled: the plateau is where a ROUTE stops climbing, the decline is where a BODY goes, and only
the second is a fact about the individual.

---

## 4. Which readers follow the per-career value, and which do not

This is a decision, not an accident, and it went both ways.

| reader | follows the career? | why |
| --- | --- | --- |
| `growWeek` / `ageFactor` / `declineFactor` | **yes** | it IS the curve |
| `world/medical.ts` `recoveryAgeFade` | **yes** | its own note already says two clocks here «would open a gap of up to a year in which her body is falling and her recovery is not». On a direct career the constant would open that gap permanently, for two years |
| `ENDINGS.askFromAgeYears` (29) | **no** | see below |
| `ENDINGS.lastOfferPeakShare` (0.55) | already per-career | it reads her BODY (`physicalMean / peakPhysical`) and always has |
| `season/cohort.ts` `aiAgeFactor` / `aiDeclineFactor` | **yes**, per rival | round 31 #13 |
| `season/fieldPros.ts` `FIELD.career` | **no** | correctly calibrated already (§10); out of scope |

⭐ **The retirement question opens at 29 for everybody, and that is deliberate.** Three reasons, in
the order that decided it:

1. **The ask is social, not physical.** `lastOfferPeakShare` is the half that reads her body, and it
   already does – the winter the question RUNS OUT moves per career and always has. What
   `askFromAgeYears` sets is when the sport starts asking, which is a fact about tennis.
2. **The sentence is his.** `RetirementDialog`'s owner-approved lede (round 30 #7) says «Twenty-nine
   is when the question starts being asked, not a countdown to anything». A per-career ask-age makes
   that copy false for most careers, and CLAUDE.md invariant 4 puts it out of an agent's reach:
   moving the number would have moved his words by proxy.
3. **And the gap is the story.** A player whose body went at 27 and who is first asked at 29 has had
   two seasons of knowing before anybody offers her the door – which is exactly the shape round 31 §9
   is about: she is at 93% and nothing has ever said so.

---

## 5. Why the value is PERSISTED, and what the migration promises

⚠⚠ **The owner is playing a career.** Alice is at week 933, 31.7 years old, standing at 93.1% of her
peak – a number he has been watching fall for a season. A curve re-derived from her seed on the next
load would change HER clock mid-game: she went through college so the route is right, but the spread
would hand her some other decline age and her remaining seasons would re-shape under her.

So:

- **v68 writes `{plateauStart: 23, declineStart: 29, injuryFrom: <weeks already lost>}` onto every
  existing save** – today's behaviour exactly – and `ageCurveOf` returns a stored pair as-is. Nothing
  ever re-derives one.
- **23 and 29 are LITERALS in the migration, not `ECONOMY.development.ageCurve`.** The pin's promise
  is «the pair the engine read for this save yesterday», which is a historical fact, not a live
  constant. Reading the object would hand every legacy career whatever the curve is re-tuned to next
   – precisely the retroactive move the step exists to prevent.
- **`injuryFrom` is the other half of "today's behaviour".** The pull is applied on read against that
  mark, so a migrated career reads `29.000` on its first load however broken it is – its past layoffs
  were lived under a rule that did not charge them and are not charged now – and only the weeks it
  loses AFTER the update pull it earlier. A career that resolves its own curve at the fork writes 0
  and pays for all of them.
- **The pin is unconditional, including for a career too young to have answered the fork.** It costs
  that career the new route shape. That is the right trade: «every existing save behaves as it did»
  is a guarantee a player can rely on, and «every existing save except the ones we judged young
  enough» is not. A new career gets the fork.

---

## 6. The frozen career hashes – measured, and the honest verdict

⚠ **The task asked for the hashes to be provable UNMOVED. Eighteen of them are. Three of them moved,
by the version stamp alone, and that is entailed by the save move the task also asked for.**

`tools/frozen-key-diff.ts --preset 0 --policy 1`, run on this branch and on its base
(`r31d/wave-reconcile`) in separate worktrees:

    ONE key of sixty-one differs: `schemaVersion`.
    cohort · skills · results · rngMain · events · fundsCents · offers – every one byte-identical.

- **`careerHashAtSchema(…, 67)` reproduces all three v67 constants byte for byte**, recorded as
  `PRE_V68`. That is the file's own narrowest legitimate re-freeze, the same one v66 and v67 took.
- **The eighteen older-schema hashes did not move at all**
  (`tests/coach-travel-edge-older-schemas.test.ts` was green throughout).
- **The frozen MAIN capture (41550 draws / `e6b0c709`) is untouched.** The spread is a sub-stream and
  `driftCohort` still spends exactly four MAIN draws per player, in the same order.

⭐ **And this is where the design was actually decided.** The obvious place to write a per-career
curve is `createWorld`. It was built the other way – resolved at the fork – for two reasons that
point the same way: the ROUTE does not exist at week 0 (it is the fork's own answer), and a key in
`createWorld`'s literal is a key in every frozen career's serialisation. Mutation-verified rather
than argued: adding `ageCurve` to `createWorld`'s literal turns all three live hashes red while the
eighteen older ones stay green (the peel protects them). The wave earns its "unmoved" by where the
write is, not by luck.

⚠ `PRE_R28B` was re-stamped for the same reason: `careerHashUnderTheWindowRule` hashes the
reconstructed world at the LIVE version, so a schema bump moves it exactly as it moves `FROZEN`. The
identity it asserts – put the deadline back on the window and the pre-ruling career returns – is
untouched.

---

## 7. What was NOT done

- **Option B – a decline age earned by her physical build – is not here.** The owner held it back
  himself («B (earned by physical build) held back – it risks making physical training strictly
  dominant, which narrows the training choice»). Nothing in this slice reads her build.
- **`FIELD.career` / `fieldPros` untouched**, on §10's measurement.
- **No user-facing string moved.** Invariant 4: the decline is now personal and the game still never
  says so. Round 31 §9's nine approved lines are a separate, queued slice and the copy is his.
- **The college share (~5% of the WTA top 100) is parked**, by his own ruling, in
  `docs/backlog/college-the-remainder.md` row 9.
- **A career that answered the fork before v68 keeps the shipped curve for ever.** It is the pin
  working as specified, not an oversight.
