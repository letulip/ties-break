---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-30
---

# Severity by age, and recurrence – his three-part ruling, built and measured

Round 30 **#27**, and it rests on **#22** (the measurement that found the defect) and **#26** (the
measurement that fitted the curve). His ruling, 30.08:

> «тяжесть надо взять точно, но разумно. Однако и с показателем в 1 травму в год надо что-то делать,
> раз я не увидел ни одной за большой промежуток. А еще, раз мы храним историю травм у себя, то
> вполне можно делать алгоритм, который будет увеличивать немного вероятность новой такой же травмы
> или ее прогрессии (более тяжелой). Мне кажется это похоже на правду.»

⚠ **THIS ONE DOES CHANGE THE ENGINE.** `docs/specs/age-injury-curve-2026-08.md` was a measurement
with `src/` untouched; this is the build that follows it. Three files move:
`src/engine/economy.ts` (the knobs), `src/engine/body.ts` (a third region tilt) and
`src/engine/world/injury.ts` (the readers).

---

## 0. The one-sentence answer

⭐⭐ **ALL THREE LIMBS SHIP AND THE TOTAL LANDS AT 52.2 % – INSIDE THE 30–54 % BAND**, from 58.5 %
outside it, with `rngMain` byte-identical on every frozen career and the frozen MAIN capture
(41550 / `e6b0c709`) verified unmoved.

⭐ **Both halves of his sentence land, against a control arm**: «новой такой же травмы» is
**+32 % relative** (a part broken again inside a season goes 10.7 % → **14.1 %** of onsets) and «или
ее прогрессии» is **+18 %** (repeats landing worse than last time, 15.3 % → **18.1 %**). Both reach
**BOTH doors**. His drought survives: **84.3 %** of careers still get a 3+ season clean stretch.

⚠⚠ **AND THE HONEST HALF, WHICH IS THE POINT OF MEASURING**: **she does not get hurt in tighter
clumps in TIME.** The per-season over-dispersion ratio is **1.066** with the mechanic on and **1.075**
with it off – flat. **The reason is structural and it is #26's finding again:** the timing limb is the
one limb that can only reach the **weekly door**, and that door is ~a fifth of her injuries. §3c
states it plainly, §3c also records the measurement mistake that nearly hid the +32 %, and §2 names
the lever that would move the timing, which is not ours.

---

## 1. What was built, limb by limb

| limb | his words | instrument | reaches |
| --- | --- | --- | --- |
| **1. severity by age** | «тяжесть надо взять точно, но разумно» | `severityAgeFactor` → `escalatedBands` | ⭐ **both doors** |
| **2. recurrence** | «новой такой же травмы или ее прогрессии» | `recurrenceLoad` → `injuryTau`, `escalatedBands`, the region tilt | ⭐ **both doors**, except the timing half |
| **3. the frequency curve** | «с показателем в 1 травму в год надо что-то делать» | `ageInjuryFactor`, **the fitted table applied verbatim** | the weekly door |

### 1a. Limb 3 first, because it is the one that was already measured

⭐ **NOTHING WAS REFITTED.** `docs/specs/age-injury-curve-2026-08.md` §4b produced the table and §4c
its predicted-vs-measured run; this wave pasted it into `ECONOMY.availability.ageInjuryFactor` and
re-measured the total on top of the other two limbs. The level-neutral variant (§4d) was **not**
taken, because it lands 58.4 % – outside the 30–54 % band that the whole exercise exists to reach.

```ts
ageInjuryFactor: {
  13: 0.6, 14: 0.63, 15: 0.74, 16: 0.84, 17: 0.74, 18: 0.67,   // the shipped junior shape x0.7
  19: 0.25, …, 27: 0.25,                                        // the prime, flat
  28: 0.29, 29: 0.32, 30: 0.36, 31: 0.39, 32: 0.43, 33: 0.46,   // the rise, linear
  default: 0.5,                                                 // 34 to retirement
}
```

### 1b. Limb 1 – severity by age, and it is the best-sourced of the three

`docs/research/injury-stats-by-age.md` §5c: the **severe share (>28 days lost) runs 43 % in
adolescents against 54–66 % in collegiate/professional players – 1.26–1.53×** – where every
INCIDENCE number in the sport shows no gradient at all (§5b, two WTA nulls). So events stay where
the fitted curve put them and **consequences** move.

⚠ **«РАЗУМНО» IS APPLIED AS A CEILING, NOT AS A TARGET.** The whole adolescent-to-veteran climb is
**1.26 – the BOTTOM of the sourced band.** A model that took 1.53 would be quoting the most generous
reading of one systematic review as if it were a measurement of this sport at this age.

```ts
severityAgeFactor: {
  13–18: 1,          // the anchor - this IS the 43% the source measures
  19–27: 1.13,       // [I] the adolescent->professional step, at about half the ceiling
  28: 1.15, 29: 1.17, 30: 1.19, 31: 1.2, 32: 1.22, 33: 1.24,
  default: 1.26,     // [S] bottom of 1.26-1.53
}
```

Only the first half of that split is sourced. The literal reading of §5c would spend the whole 1.26
at nineteen (a nineteen-year-old IS a professional) – but that leaves no gradient inside adulthood,
which is the half he asked for, and it puts a cliff on a birthday. The within-adult ramp is `[I]`
from **Williams S et al., *J Sci Med Sport* 2023** (elite rugby union: a heavy season raises the
following season's BURDEN and not its incidence, «driven by an increased risk for older (>26y)
Forwards»), and it starts at 28 – the same year the frequency curve starts rising, so there is **one
age story told twice** rather than two that can drift.

**How it applies.** `escalatedBands` multiplies each band's **tail** probability and rebuilds the
cumulative thresholds. At 1.26 the weekly table's P(worse than minor) goes 40 % → 50.4 % and
P(severe) 2.5 % → 3.15 % – which is exactly the shape §5c publishes.

⚠ **`weeksLo`/`weeksHi` ARE UNTOUCHED**, which restates round 16 #13's own ruling: «What changes
above moderate is how OFTEN you get there, never what it costs when you do.» A stress reaction does
not heal faster or slower because of the age of the body it happened to.

### 1c. Limb 2 – recurrence, and the point is CLUSTERING

*Previous injury is the best-established risk factor in sports-injury epidemiology*, ahead of age
and ahead of load. One state quantity feeds all three of its effects:

```
recurrenceLoad(world) = min(loadCap, Σ severityWeight[row.severity] × 0.5^((week − row.week)/halfLife))
```

| knob | value | why |
| --- | ---: | --- |
| `halfLifeWeeks` | **52** | ⚠⚠ **THE DECAY IS THE DESIGN.** «Мы ни за что не наказываем.» An ankle sound for three seasons has `0.5³ = 12.5 %` of its weight left – his own test («an ankle that has been sound for three seasons stops being the weak ankle») answered in arithmetic instead of in prose. Counted from the **recovery** week, which is what `injuryHistory` rows carry, so a long layoff starts fading when she is back on court. |
| `loadCap` | **1** | ⚠⚠ **THE CEILING.** At most one fresh major injury's worth of memory, however long the list gets. Every factor below is `1 + bump × load`, so one cap bounds all three. |
| `severityWeight` | minor .4 / moderate .7 / major 1 / severe 1 | a niggle is a fact about a week; a tear is a fact about a body |
| `tauBump` | **0.3** | «немного», his word: at most +30 % on the weekly threshold, decaying to nothing |
| `severityBump` | **0.2** | the «прогрессия» half, on the same instrument as limb 1 |
| `severityFactorCap` | **1.5** | the product `1.26 × 1.2 = 1.512` clipped to the sourced band's own top. Nothing in this engine may push the severe share past what §5c published. |
| `partTilt` | **2.3** | between `BODY_AIM_TILT` (2.0, what she drilled) and `BODY_PUSHED_TILT` (2.6, a knock he was sent back out on) |

⭐⭐ **AND THE RATE WAS NEVER THE COMPLAINT.** Measured onsets are 0.68–0.78 a season and his own
lifetime rate is 0.64. **Independent weekly draws produce exactly the forgettable pattern he
describes** – nothing, nothing, a niggle, nothing. «Three quiet years, then the ankle went twice in
one season» is the *same total told properly*, and only a mechanic with memory can tell it. So this
limb is graded on §3's clustering columns, not on the rate.

---

## 2. Both doors – what reaches which, said out loud

⚠ #26's measurement found the **in-match retirement door supplies 73–79 % of adult onsets and
carries no age, physio or kit term at all**. A mechanic that only touched the weekly roll would
inherit that ceiling and disappoint him for the same reason a frequency curve alone does.

| effect | weekly door | retirement door | why |
| --- | :---: | :---: | --- |
| severity escalation (age + history) | ✅ | ✅ | `escalatedBands` sits inside `onsetInjury`, **the one onset writer**, above the severity uniform |
| region tilt (the same part again) | ✅ | ✅ | both call sites now hand in a tilted table; `drawBodyRegionFrom` spends one pull for any table |
| timing (`injuryTau` bump) | ✅ | ❌ | see below |
| the frequency age curve (limb 3) | ✅ | ❌ | `ageInjuryFactor` multiplies the weekly threshold only – #26 §7.1 |

⭐ **SO THE TEXTURE HE ASKED FOR – the same ankle again, and worse – LANDS ON ~100 % OF HER
INJURIES**, not on the weekly door's fifth. Only the **timing** limb is capped at the weekly door's
share.

⚠ **AND THAT IS A DECISION, NOT AN OVERSIGHT.** The retirement door's RATE is
`RETIRE_K × spentness × retireDurability`, and `RETIRE_K = 0.07` is calibrated against a published
stoppage rate (2.73 % of matches, PLOS ONE 2024) and reserved by him explicitly on 11.08 –
«RETIRE_K оставляем как есть». Reaching it would also need a new field on `MatchPlayer`, which is
frozen into `WorldMatch.a` for replay – i.e. the schema move #27 says this design does not need.
**Left named rather than done**: an age or history term on `retireDurability` is the big lever, it is
#26 §7.1's own follow-on, and it is his.

---

## 3. Predicted vs measured (invariant 5)

`tools/injury-audit.ts`, **9 presets × 12 seeds = 108 careers**, arm `plays-on`, policy `player` –
the same instrument, the same size and the same arms as the #26 measurement, so the numbers are
comparable line for line. Four arms:

| arm | flags | what it isolates |
| --- | --- | --- |
| **A – control** | `--noRecurrence --flatSeverityAge` | the fitted curve ALONE |
| **B** | `--noRecurrence` | + limb 1 (severity by age) |
| **C – shipped** | *(none)* | + limb 2 (recurrence) = what ships |
| **D** | `--policy grinder` | the shipped model on the grinder arm |

⭐⭐ **THE PREDICTIONS WERE WRITTEN DOWN BEFORE ANY ARM FINISHED**, which is what makes this section
a measurement rather than a description.

### 3a. Arm A is the provenance check, and it passes exactly

⚠ Before anything is claimed about the new limbs, the control has to prove it is the tree #26 fitted.
With both new limbs neutralised, arm A must reproduce `age-injury-curve-2026-08.md` §4c – and it
does, **to the decimal, in every band**:

| band | §4c predicted | §4c measured | **arm A here** |
| --- | ---: | ---: | ---: |
| 13–15 | 49.4 % | 49.7 % | **49.7 %** |
| 16–18 | 60.5 % | 59.0 % | **59.0 %** |
| 19–22 | 49.5 % | 45.8 % | **45.8 %** |
| 23–28 | 49.1 % | 50.5 % | **50.5 %** |
| 29+ | 55.1 % | 52.3 % | **52.3 %** |
| **OVERALL** | 52.9 % | **51.4 %** | ⭐ **51.4 %** |

Adult onsets per season read **0.68 → 0.68 → 0.78**, also as §4c has them. **The fitted curve was
applied, not re-derived, and the control arm is real.**

### 3b. Limb 1 – severity by age

| | predicted | **measured (B vs A)** | verdict |
| --- | --- | ---: | --- |
| overall prevalence | down 0–1 pp | **51.4 % → 51.3 %** (−0.1 pp) | ✅ |
| onsets per season | flat or slightly down | 0.74 → **0.75** | ✅ flat |
| weeks lost per season | up 10–15 % in the adult bands | 1.7 → **1.8** overall; 19–22 **1.7 → 1.9** | ⚠ right sign, smaller |
| severity mix | minor share down, the rest up | see below | ✅ |

| severity | A (onsets/season) | **B** | change |
| --- | ---: | ---: | ---: |
| minor | 0.580 | 0.563 | −2.9 % |
| moderate | 0.132 | **0.148** | **+12 %** |
| major | 0.029 | **0.035** | **+21 %** |
| severe | 0.002 | **0.003** | **+50 %** |

⭐ **The share of onsets worse than `minor` goes 22.0 % → 24.8 %, a ratio of 1.13** – which is
`severityAgeFactor` in the prime, exactly, and most of this population's seasons are 19–27. The
mechanism did precisely the arithmetic it was designed to do.

⭐⭐ **AND THE INVARIANCE CHECK IS BUILT INTO THE TABLE.** `severityAgeFactor` is **1 for every age up
to 18**, so the two junior bands must not move at all – and they do not: 13–15 reads **49.7 %** and
16–18 **59.0 %** in both arms, identical to the decimal. A limb that claimed to touch only adults and
moved a junior row would have been visible here without any extra instrument.

### 3c. Limb 2 – recurrence, graded on CLUSTERING

⚠⚠ **THE FIRST INSTRUMENT WAS WRONG AND IT NEARLY PRODUCED THE WRONG VERDICT.** The clustering
column originally asked *"has this body ever broken this part before"* – and the CONTROL arm answered
**58.5 %** with the mechanic switched off. Twelve regions and a twenty-injury career means almost
everything is a repeat by the end: the metric had no room left, the treatment arm read 59.9 %, and
the honest-looking conclusion "recurrence barely does anything" would have been **a statement about
the instrument, not about the engine.** So the column was re-cut to ask what the DESIGN asks – was
this part broken again **inside `halfLifeWeeks`** of the last time – and arms A and C were both re-run
against it. ⭐ A2 reproduces A's prevalence and over-dispersion exactly (51.4 %, 1.075), which is what
proves the re-cut changed the reporting and not the simulation.

| | **A2 control** | **C2 shipped** | change |
| --- | ---: | ---: | --- |
| ⭐ **repeat of a part broken inside 52 w** | **10.7 %** | **14.1 %** | ⭐⭐ **+3.4 pp = +32 % relative** |
| …and the count behind it | 233 | 312 | **+34 %** |
| repeats landing **WORSE** than before | 15.3 % | **18.1 %** | **+18 % relative** |
| seasons carrying 2+ onsets | 17.3 % | **18.6 %** | +1.3 pp |
| careers with a 3+ season clean stretch | 83.3 % | **84.3 %** | ⭐ survives |
| lifetime "ever broke this part" *(saturating)* | 58.5 % | 59.9 % | +1.4 pp – the dead column |
| ⚠ **onsets/season variance ÷ mean** | **1.075** | **1.066** | ⚠⚠ **flat** |
| mean gap, all onsets | 66.1 w | 64.3 w | −1.8 w |

**PREDICTED vs MEASURED:**

| prediction (written before any arm finished) | measured | verdict |
| --- | --- | --- |
| prevalence 51–53 %, in band but near the top | **52.2 %** | ✅ |
| repeat share up materially | **+32 % relative** on the honest column | ✅ |
| 3+ season clean stretches survive | 84.3 % | ✅ |
| seasons with 2+ onsets up | 17.3 → 18.6 % | ✅ |
| **over-dispersion above the control's ~1.00** | **1.066 vs 1.075 – it did NOT rise** | ❌ |

⭐⭐ **SO THE TWO HALVES OF HIS SENTENCE BOTH LAND.** «Новой такой же травмы» is **+32 %** and «или ее
прогрессии (более тяжелой)» is **+18 %** – both clearly measurable, both reaching **BOTH doors**,
neither anywhere near a death spiral.

⚠⚠ **AND THE HALF THAT DID NOT LAND, STATED WITHOUT DRESSING: SHE DOES NOT GET HURT IN TIGHTER
CLUMPS IN TIME.** The per-season over-dispersion is flat. **The reason is structural and it is #26's
finding arriving for the third time:** of the three effects, the two that move are the two that live
inside `onsetInjury` and therefore reach every onset – but the one that changes **WHEN** she breaks is
a multiply on `injuryTau`, and `injuryTau` is the **weekly door only**, which is ~21 % of adult
onsets. A 30 % bump on a fifth of the onsets, decayed, is a few percent on the timing of the whole –
which is what was measured.

⚠ **THE TAU BUMP WAS NOT RAISED TO CHASE THE NUMBER, AND THAT IS DELIBERATE.** There is 1.8 pp of
band headroom, so it could have been. It was not, for three reasons: «немного» is his own word for
this mechanic; «мы ни за что не наказываем» governs the direction; and **doubling a lever that is
structurally confined to a fifth of the onsets buys a doubled fraction of a small number, not a
different outcome.** The lever that would actually move it is named in §2 and it is his.

⭐ **The gap split is reported but NOT claimed as evidence**: an onset that is a recent repeat follows
its predecessor by **20.9 w** against **71.8 w** for a fresh part – but that is largely definitional
(being "recent" requires a same-part onset inside 52 weeks), and it reads 20.6 w / 71.9 w on the
CONTROL too. It describes the shape of a repeat; it does not measure the mechanic.

### 3d. The grinder arm, and it stays out of band exactly as #26 said it would

| | shipped before | fitted curve alone (§4e) | **all three limbs (arm D)** |
| --- | ---: | ---: | ---: |
| overall prevalence | 76.0 % | 71.5 % | **72.4 %** |
| onsets / season | – | – | **1.50** |
| weeks lost / season | – | – | **3.7** |

⚠ **THIS ARM CANNOT BE BROUGHT INTO BAND AND NOTHING HERE TRIED TO.** `age-injury-curve-2026-08.md`
§4e measured its floor with the weekly roll switched off entirely at **67.8 %**, so 30–54 % is
unreachable on this policy by any age table. The grinder runs at **mean condition 56** against the
player arm's 85: her injuries are a fatigue story, and the age table is not the instrument for it.
The three limbs cost it **+0.9 pp** over the fitted curve alone, which is the same small price they
cost the player arm.

⭐⭐ **AND IT CARRIES THE ONE RESULT THAT SHOWS THE CLUSTERING MACHINERY IS REAL RATHER THAN INERT.**
The grinder's per-season over-dispersion is **1.176** against the player arm's 1.066, its median gap
between onsets is **20 weeks** against 39, and only **38.0 %** of grinder careers get a 3+ season
clean stretch against 84.3 %. That spread is not recurrence – it is condition – but it proves the
columns in §3c can move a long way when something actually drives them, so a flat reading on the
player arm is a finding about the LEVER, not about the instrument.

---

## 4. RNG – the promise, and how it was verified

⚠⚠ **RECURRENCE READS `injuryHistory`, WHICH IS A CONSEQUENCE OF PLAY.** If any of its three effects
reached a draw, a player's choices would re-roll the world's dice and **input-independence –
invariant 2, a fairness property – would be gone.** None of them does. Every one follows
`kitInjuryFactor`'s shape, whose own note is the standard: *«the occurrence roll is already drawn by
then, so this moves whether she gets hurt and never which numbers come out of any stream»*.

| effect | where | why it cannot move a draw |
| --- | --- | --- |
| `recurrenceTauFactor` | a multiply inside `injuryTau` | `rollInjury` draws the occurrence uniform, **then** compares it to `injuryTau(world)`. Post-draw on the threshold. `injuryTau` keeps its pinned arity of 1. |
| `escalatedBands` | above the severity uniform in `onsetInjury` | pure state; it re-prices thresholds an **already-drawn** number is compared against – exactly `severityBandsFor`'s shape |
| the region tilt | the table handed to `drawBodyRegionFrom` | one pull for any table; the tilt changes what the uniform **maps to**, never what it is |

**Verified, not assumed:**

- ⭐ **The frozen MAIN capture is UNMOVED: count 41550, hash `e6b0c709`.** `tests/condition.test.ts`,
  **51/51 green**, run on this branch after the engine change.
- **`tests/injuries.test.ts` C1** already carried an A/B arm that pre-seeds `injuryHistory` and
  asserts the MAIN stream is byte-identical – that arm now covers this mechanic and still passes.
- **C13** adds the stronger form on the *sub*-stream: the same seed with and without a two-row
  history spends the **same pull count** and leaves the generator at the **same position** (the next
  uniform is identical) – with a non-vacuity test beside it proving `injuryTau` really does move, so
  the guard cannot pass by the term being dead.
- **C13** re-checks the three-pull arity at **both doors** on the worst case (34-year-old body, full
  history, tilted table).

---

## 5. Schema

⭐ **NO MOVE.** `injuryHistory` already holds `kind`, `severity`, `week` and `weeksOut`, and
`bodyPartOf` already turns a `kind` back into one of the twelve regions. Nothing new is persisted, so
`SAVE_SCHEMA_VERSION` stays at **67** and no migration or fixture is owed.
`node scripts/schema-ladder.mjs` was run and reports the branch at v67 against main's v66 – the
unshipped step this branch already owns, untouched by this wave.

⚠ **AND EVERY EXISTING SAVE IS READ CORRECTLY WITHOUT ONE.** A career loaded from any older save has
an `injuryHistory` whose rows are exactly what these functions read, so the mechanic starts working
on a loaded career immediately – with its decay already applied, so a save whose last injury is four
seasons back gets ~6 % of a bump rather than a surprise.

---

## 6. What was NOT done, and why

1. **The retirement door's RATE.** §2. Owner-reserved, calibrated to a published anchor, and a
   schema move. Named as the follow-on, not taken.
2. **The `#26` protection FLOOR** (age as a floor the physio multipliers cannot go under). It is a
   different item – #26 is `[?]`, still his to authorise – and #26 §5b priced it as **at most
   +1.8 pp** on the population, i.e. it can be added on top of this without refitting. Not built
   here.
3. **The level itself.** `docs/backlog/injuries-gear-and-open-bugs.md` #7 stays open and reserved to
   him. §4a of the #26 spec shows why it matters: three of the five age bands cannot reach the
   30–54 % band's midpoint even with the weekly injury roll switched off entirely, because the
   retirement door supplies most of the level.
4. **No user-facing wording changed.** Invariant 4. The injury news lines, the dialog and every label
   are untouched; this wave moves numbers only.
