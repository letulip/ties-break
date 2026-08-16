---
type: spec
status: current
area: engine/balance
canonical: true
last-reviewed: 2026-08-16
---

# P4 – the college fork: a comment, a warning and a decoupling (16.08.2026)

**The phase that was scoped to build a combo and measured its way down to three small things.**

`docs/plans/college-and-the-junior-ladder.md` §P4 wrote the instruction that decided this:

> *"First re-measure the closure rate on the P1-P3 build: if a normal junior can no longer reach W75,
> `collegeClosedFromTier` may already be doing approximately the right thing for the wrong reason –
> and the honest fix is then to say so in the comment rather than to add machinery."*

**That is what happened, though not for the reason the plan expected.** The re-measurement is §2, and
it moved the scope before a line was written.

---

## Current truth

- **The college gate reads its own rule and no calendar constant.** `collegeDoorOpen` is a leaf: it
  imports nothing from `season/calendar.ts`, so moving an acceptance list or a points column can no
  longer move the age at which the third answer stops existing. Before this phase `w75.acceptsRank`
  decided both, and `collegeStillOpen` additionally read `TIERS[tier].points` to decide what "a
  result that counted" meant. `tests/ending.test.ts` proves the decoupling by moving each constant
  and asserting the college answer does not follow – and proves the tests are not vacuous by moving
  the college rule's own knob and watching it does.
- **Nothing closes the door for money, because the sport no longer does.** The NCAA's $10,000-a-year
  pre-enrolment cap was struck out by the Brantmeier/Joint settlement on 15 April 2026 and
  "amateurism" appears zero times in the current Division I Manual – so the money arm was cancelled
  by the owner on 15.08 and no money gate exists. `ForkDialog` had been telling the player the
  opposite in as many words; that sentence is gone.
- **A RESULT still closes it, and the player is warned before the entry that costs it, not after.**
  Both entry paths – the Season confirm and the calendar marker card – say that a result here can
  cost the college place. It says *can*, never *will*: a first-round loss keeps the door. Nothing is
  disabled, and the line goes quiet once the door is shut or the fork is answered.
- **The fork card states her chances as a figure and never as advice.** One row – the rung's own
  acceptance cut beside her rank – off `TIERS.wta250.acceptsRank`. A test asserts no verdict word
  appears on the card.
- ⚠ **The gate is now LATE rather than correct, and the six weeks it survives by are an accident.**
  It fires at median 19.1 against a fork at 19.0. Nothing arranges that ordering, so any later tuning
  that speeds her up by a month closes the door again in most careers, silently. The two rules still
  name the same rung even though they no longer share a constant. **§6.1 is the owner's decision and
  it is open.**

---

## 0. THE THREE ANSWERS, IN ONE BOX

> ### 1. THE DOOR IS OPEN AT THE DECISION IN 96% OF CAREERS NOW – IT WAS 8% BEFORE P1.
> Measured on the current tree with P0's frozen battery: **86 of 90 careers reach the fork with the
> college answer still on the card**, against **7 of 90** when `college-fork-2026-08.md` measured the
> same seeds. The owner's round-21 complaint – *there was no college option at nineteen, only pro or
> stop* – **is already fixed**, by P1-P3 and not by anything this phase built.
>
> ### 2. BUT THE DOOR DID NOT STOP SHUTTING – IT MOVED TO THE OTHER SIDE OF THE QUESTION.
> **83 of 90 careers still lose it**, at **median age 19.1**, against P0's 17.3. The fork is at 19.0.
> So the rule that used to fire two years BEFORE the decision now fires, on median, a few weeks
> AFTER it – where it changes nothing, because the question has already been put and answered.
> **The gate did not become correct. It became late.** §2c is the number and §6 is what it means.
>
> ### 3. AND THE COUPLING WAS REAL, IN TWO PLACES, ONE OF WHICH NOBODY HAD NAMED.
> The known one: `ENDINGS.collegeClosedFromTier` names the same rung `TIERS.w75.acceptsRank` admits
> to, so P3's 450 -> 300 moved the college door and nothing objected. The one found while fixing it:
> **`collegeStillOpen` was literally reading `TIERS[tier].points`** – the ladder's prize column – to
> decide what "a result that counted" meant. Both are gone. §4.

---

## 1. WHAT SHIPPED, AND WHAT DELIBERATELY DID NOT

| the plan's item | verdict | why |
| --- | --- | --- |
| **(a) the money arm** | ⚠ **NOT BUILT** | Cancelled by the owner on 15.08. As the rule stands there is no cap at all – the NCAA's $10,000/year pre-enrolment limit was struck out by the Brantmeier/Joint settlement on 15 April 2026, and "amateurism" appears zero times in the current Division I Manual. §5 records the one place code assumed a money rule. |
| **(b) the result arm (#200)** | ✅ **shipped, as a figure** | One more row in the fork card's own facts list: where the tour starts admitting her, beside her rank. Not a gate – the door is open regardless. §3b. |
| **(c) the warning before the entry** | ✅ **shipped, both paths** | The Season confirm and the calendar's marker card. §3c. |
| **(d) breaking the coupling** | ✅ **shipped, and it was worse than described** | §4. |
| a mechanism to re-close the door | ⚠ **NOT BUILT** | §2 says the door is open at the decision in 96% of careers. Building a gate to re-shut it would be inventing a rule the sport does not have, to fix a complaint the owner has not made. §6 puts the design question to him instead. |
| a re-tune of `collegeClosedFromTier` | ⚠ **NOT BUILT – NEEDS THE OWNER** | The rung is his own marker and its comment records his ruling. §6.1. |

**No constant moved in this phase.** Every number in §2 is the tree as P3 left it, and the predicted
delta from this phase's own changes was **zero on every column** – see §7, where that is checked
rather than asserted.

---

## 2. THE RE-MEASUREMENT – THE NUMBER THAT DECIDED THE SCOPE

### 2a. Method

`tools/ladder-baseline.ts`, P0's frozen battery, **unchanged** – which is the property P0 was built
for. n = 90 (9 presets x 10 seeds), 676 weeks (13.6 -> 26.6), `POLICIES[1]` (the rebuilt "player"
policy), identical seeds to every earlier arm. Run on `4b5d66a`, the commit this phase branched from.
90 careers in 212s.

```bash
npx vite-node tools/ladder-baseline.ts            # the frozen defaults
```

⚠ **THE PREDICTIONS WERE WRITTEN BEFORE THE RUN** (CLAUDE.md invariant 4), and two of the three were
wrong in a way that is worth recording rather than quietly correcting:

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| 1 | closure rate **<= 10%**, fork-open **>= 90%** | closure **92%**, fork-open **96%** | ⚠ **half wrong** – I predicted the door would stop shutting. It shuts as often as ever; it shuts LATE. |
| 2 | share ever entering a W75 **under 30%** | **91%** (82/90) | ⚠ **wrong** – P1 did not stop her reaching W75, it **delayed** her to exactly nineteen. |
| 3 | the honest P4 is a comment + the decoupling + the warning, no new gate | – | ✅ **held**, but on the strength of a different fact than the one predicted |

> ⭐ **THE ERROR IS THE FINDING.** I predicted the plan's own hypothesis – "a normal junior can no
> longer reach W75". She can, in nine careers of ten. What P1 moved was not whether but **when**, and
> the whole of P4's scope turns on that difference: a rule that fires late is not a rule that stopped
> firing, and §6 is the question that follows.

### 2b. The college door, then and now

Same seeds, same policy, both restricted to the 312-week window `college-fork-2026-08.md` used, so
the two columns are comparable rather than merely similar (`tools/ladder-baseline.ts` §8):

| | **P0** (`college-fork-2026-08.md`) | **now** (P1+P2+P3) |
| --- | --- | --- |
| careers whose door shut inside the window | 86 / 90 | **78 / 90** |
| mean age at closure | **17.3** | **19.1** |
| share of closures in the 17.0–17.9 band | **92%** | **1%** (1 of 78) |
| still open **at the fork** | **7 / 90 (8%)** | **86 / 90 (96%)** |
| still open **a full season later** | 4 / 90 | 7 / 90 (8%) |

On the full 676-week horizon the closure distribution is starker still:

```
  under 16      0     0%
  16 – 16.9     0     0%
  17 – 17.9     1     1%
  18 – 18.9     2     2%
  19+          80    96%
  min 17.8 · p25 19.1 · median 19.1 · p75 19.3 · p90 19.4 · max 20.0
```

**Which rung shuts it:** W75 in 76 of 83 closures (92%), W100 in 5, WTA 250 in 2.

### 2c. ⭐ THE ONE SENTENCE THIS SECTION EXISTS FOR

**`ENDINGS.collegeClosedFromTier` now removes an answer from the card in 4 careers of 90.** It used
to remove it in 83. Everything else it does, it does after the question has been asked – which is to
say it does nothing at all.

### 2d. Why: the ladder moved, not the door

The door did not move; **the rungs did**. P1's junior/adult boundary put the whole professional
ladder on her nineteenth birthday:

| rung | first entry, p25 / p50 / p75 | first COUNTING result, p50 |
| --- | --- | --- |
| W15 | 15.3 / 15.9 / 16.8 | 16.1 |
| W35 | 18.5 / **19.0** / 19.0 | 19.1 |
| W50 | 18.7 / **19.0** / 19.0 | 19.0 |
| **W75** | 19.0 / **19.0** / 19.1 | **19.2** |
| W100 | 19.1 / 19.3 / 19.5 | 19.4 |

Her first counting result at W75 is at median **19.2**. The fork is at **19.0**. **The college answer
survives the fork by about six weeks, and it survives it by accident** – nothing in either rule
arranged that, and nothing holds it there.

---

## 3. WHAT WAS BUILT

### 3a. The comment (the plan's own "honest fix")

`ENDINGS.collegeClosedFromTier`'s comment asserted a rule that does not exist:

> *"it is a PRECONDITION and not a WARNING. A player who has taken professional prize money has spent
> her college eligibility; the scholarship is not a door she can still walk through."*

**That has been false for the whole life of this project** (research §1b): $10,000 a year **plus
actual and necessary expenses** before enrolment under the old bylaw, and **no cap at all** since 15
April 2026. The one real edge is at ENROLMENT, after which prize money may not exceed expenses – so
the sport's cliff is a day she walks through, never a result she posts.

**The constant is not wrong; its stated reason was.** It now rests on the owner's own argument, which
needs no rulebook: *a girl who is already a professional does not go to college.* The comment also
now records, in the file that reads it, that this is **not** `TIERS.w75.acceptsRank` – and that money
never was the discriminator even when a money arm was going to ship (the weakest third banks
**$114,260** by nineteen against the strongest third's **$155,865**, and the weak band's p75 sits
**above** the top band's p25 – the populations interleave, so no dollar line through them sorts
anybody).

The same false sentence was **also live in the UI**, on `ForkDialog`'s shut-door note, where a player
could read it: *"Prize money at that level spends her college eligibility, and nothing gives it
back."* Replaced with what is true in our world.

### 3b. (b) The result arm – a figure, not a gate and not a sentence

`TIERS.wta250.acceptsRank` is already **200**, and it is the only line the research's whole sweep
found that separates the populations: it excludes the strongest third almost perfectly (1 of 30),
keeps the door for half of the weakest third, **47 points of separation** (research §5c).

It ships as **one more row in the fork card's own facts list** – `WTA 250 admits down to / #200` –
beside the rank it is to be compared with.

⚠ **It gates nothing.** With the money arm cancelled there is no shut door for a rank line to reopen;
the third answer is drawn by `fork.collegeOpen` alone and this number changes nothing about it.

⚠ **And it is a NUMBER, not a sentence.** Ruling 4 (30.07): the card «may not recommend». A line
reading "the tour would not take her" is one comparison away from advice about which answer to pick,
and this card is not allowed that opinion. It is said in the card's own idiom – a figure in the list
with her funds and her rank – and the player does the comparing. `tests/component/college-warning.
test.ts` asserts the card carries no verdict word at all.

### 3c. (c) The warning, before the entry that costs it

The research calls this the one part of the combo that is unambiguously right, and
`endings-and-the-album.md` had already named the gap and left it: *"nothing at seventeen tells the
player that a good week there spends something."*

**The sentence:**

> *A result here can cost the college place at nineteen – a win at this level makes her a
> professional.*

**Where it appears – both entry paths, because both already carry a confirmation:**

* **`SeasonScreen`'s `ConfirmDialog`** – appended after the fee, so the confirm's job (say the numbers
  out loud one last time) still leads and the college line closes it.
* **`CalendarScreen`'s marker card** – which is documented as *its own* confirmation, so a player who
  enters from the calendar would otherwise never see it. Its own `.college-note` class: not
  `.caution-note`, which is the BODY's word and `--warning`-coloured, because nothing here is about
  getting hurt and amber beside an active Enter reads as a lock.

**Four properties, all tested:**

1. **"CAN", NEVER "WILL".** A first-round loss keeps the door (the owner's 13.08 ruling), so only a
   result that got past the opening round spends it. The entry itself promises nothing.
2. **IT MAY NOT RECOMMEND.** It states the consequence and stops. `eligible` is untouched, the button
   still says Enter, and the parent may always push.
3. **IT IS THE ENGINE'S OWN VERDICT.** `entryCostsCollege(world, tier)` decides, and the card prints –
   the same construction `eligible` has had since R10-5, so the card cannot disagree with the rule
   that will actually fire.
4. **IT GOES QUIET WHEN THERE IS NOTHING LEFT TO SPEND** – door already shut, or the fork already
   answered.

---

## 4. ⭐⭐ (d) THE COUPLING – BROKEN IN BOTH PLACES, AND ONE OF THEM WAS NOT IN THE BRIEF

### 4a. The coupling that was known

`ENDINGS.collegeClosedFromTier` is `'w75'`. `TIERS.w75.acceptsRank` decides who may enter a W75. Two
unrelated decisions naming one rung, and **P3 moved that cut from 450 to 300 and moved the college
door with it.** `calendar.ts` carried a note about it; `ending.ts` mentioned neither the coupling nor
the other constant, and **no test asserted anything either way.**

### 4b. ⚠ The coupling that was found while fixing it, and it was the worse one

`collegeStillOpen`'s body read:

```ts
if (finish >= TIERS[tier].points.length - 1) return false
return TIERS[tier].points[finish] > 0            // <- the ladder's PRIZE COLUMN
```

**The college gate was reading a balance-tuning table to decide where the college ending stops
existing.** A wave re-sizing `w75.points` would have moved it silently, exactly as P3's cut did.

### 4c. What it looks like now

The rule is a **leaf in `ending.ts` that imports no calendar constant at all**:

```ts
export function collegeDoorOpen(results: readonly CollegeResultView[], closedFromIndex: number): boolean
```

`CollegeResultView` is three numbers per result: the rung's index on the ladder, her best finish
there, and **how many finishing positions the draw has** – a structural fact, deliberately not the
points paid at each one. `world/endings.ts` resolves those and hands them over. So no acceptance cut,
no points edit and no re-pinned field size can reach the college door except through
`ENDINGS.collegeClosedFromTier`, which is the rule's own knob.

### 4d. ⚠ AND IT SHIPPED AS A DECOUPLING, NOT A BALANCE CHANGE – here is why that is provable

Dropping `points[finish] > 0` can only change an answer on an **interior zero**: a finishing position
that is not the opening round and still pays nothing. **No rung at or above W75 has one:**

```
w75      [75, 49, 29, 16, 9, 1]              wta500   [500, 325, 195, 108, 60, 1]
w100     [100, 65, 40, 25, 12, 0]            wta1000  [1000, 650, 390, 215, 120, 65, 10]
wta125   [125, 81, 49, 27, 15, 1]            slam     [2000, 1300, 780, 430, 240, 130, 70, 10]
wta250   [250, 163, 98, 54, 30, 1]
```

The clause was **dead on every rung the rule can see**. `tests/ending.test.ts` asserts that emptiness
**against the live table** rather than trusting this paragraph, so the day a rung ships an interior
zero the pin says so instead of the door silently moving.

### 4e. The proof the brief asked for – move one constant, watch the other not follow

Four cases in `tests/ending.test.ts`, each mutating a shipped constant and restoring it in `finally`:

| the test | what it moves | what it asserts |
| --- | --- | --- |
| *moving the ENTRY rule does not move the college door* | `TIERS.w75.acceptsRank` over **450 / 300 / 1 / 5000** – P3's own move and its reverse | `collegeStillOpen` is unchanged at every cut, on a career that has spent the door AND on one that keeps it |
| *and neither does re-sizing the rung's POINTS* | `TIERS.w75.points` – zeroed to `[75,0,0,0,0,0]`, then paying the first-round loser 999 | unchanged both ways: she won two matches whatever they paid, and the wooden spoon is not a result at any price |
| *what DOES move it is the college rule's own knob* | `closedFromIndex` – w50 / w75 / w100 | the answer follows the COLLEGE rule, which is what stops the two above passing vacuously |
| *dropping the points read changed no behaviour* | nothing | no rung at or above the college rung has an interior zero, read off the live `TIERS` |

⚠ **The third case is the one that makes the file honest.** A `collegeStillOpen` that always returned
`false` would satisfy the first two.

---

## 5. ⚠ THE CODE THAT ASSUMED A MONEY RULE – there is exactly one, and it is a sentence

The brief asked for this to be reported. **No engine code gates on money for college.** The only
place a money rule was asserted was **prose**, and it was asserted twice:

1. `ENDINGS.collegeClosedFromTier`'s comment – *"A player who has taken professional prize money has
   spent her college eligibility"*. Corrected (§3a).
2. `ForkDialog`'s shut-door note – *"Prize money at that level spends her college eligibility, and
   nothing gives it back."* **This one was on screen, where a player could read it.** Corrected.

⚠ Both are the failure mode `acceptance-cuts-2026-08.md` §0 was written about: a fact entered without
a citation, then repeated. The second was written *because* the first was there.

---

## 6. ⚠⚠ FOR THE OWNER – four things, and only one of them is a balance decision

### 6.1 ⭐ THE DESIGN QUESTION, STATED AND DELIBERATELY NOT ANSWERED

**If the college door can never be closed, the third answer is always open, and the only thing that
varies is whether taking it is a good idea.**

That is not a rhetorical flourish, it is the shape the rules now have. The money arm is cancelled
because the sport has no money rule; the result rung fires, on median, six weeks after the question it
was supposed to gate. **A gate that fires after the decision is not a gate, it is bookkeeping.**

Three coherent answers, and the choice is yours:

* **(A) Leave it.** The rung stays, fires in 4 careers of 90 before the fork, and the fork is
  effectively a free three-way choice. Cheapest, and honest about the sport.
* **(B) Delete the gate outright.** `collegeStillOpen` always true; the card always draws three
  answers. Matches the sport exactly (there is no pre-enrolment rule left to model) and removes a
  constant that no longer earns its place. ⚠ It also deletes round-21 #8's shut-door sentence, which
  you asked for.
* **(C) Move it to where it would bite.** A rung or an age EARLIER than nineteen would restore a real
  precondition – but it would be **our invention**, not the sport's, and it re-creates exactly the
  complaint you raised in round 21: no college option at nineteen.

**No agent should pick between these.** (A) is what ships today because it is the do-nothing option.

### 6.2 The comment was wrong and that was free to fix

The justification in the code cited an NCAA rule repealed twice, the second time in April 2026. It is
corrected in both places it appeared, and no behaviour changed.

### 6.3 The door now survives the fork BY ACCIDENT, and nothing holds it there

Her first counting W75 is at median **19.2**; the fork is at **19.0**. Six weeks. **Any future tuning
that speeds her up by a month closes the door again in most careers** – and it would do so silently,
because the two rules still name the same rung even though they no longer share a constant. §6.1(B)
is the only option that makes this stop being fragile.

### 6.4 ⚠ The unmeasured option the research liked most is still unmeasured

Research §5e item 5: Bylaw 12.6 starts a **five-year college eligibility clock at nineteen, whether
or not she enrols** – our own fork birthday. It models the door closing as TIME, which is what it
actually is. Nobody has costed it, and this phase did not either: it is machinery, and §2 said the
phase did not need machinery.

---

## 7. PREDICTED vs MEASURED – this phase's own changes

**PREDICTION 4, written before the work:** the decoupling keeps the same rung and the same semantics,
so the delta on every P0 column is **zero, exactly**. Any non-zero delta is a bug in the change, not a
balance finding.

**PREDICTION 5:** the warning is a read of existing state at snapshot time and adds no draw, so the
frozen MAIN capture is untouched.

**MEASURED:**

| claim | how it was checked | result |
| --- | --- | --- |
| no behaviour change from the decoupling | the removed clause is dead on every rung the rule can see, asserted against the live `TIERS` | ✅ §4d |
| the shipped college gate answers identically | `tests/ending.test.ts`'s existing round-17 #6 cases, unchanged and untouched, still green | ✅ |
| no MAIN draw added | `tests/condition.test.ts`'s frozen capture (41550 draws / `e6b0c709`) | ✅ **unchanged – no pin update needed** |
| input-independence survives | `tests/ending.test.ts` "four years of suppressed bills cost the MAIN stream not one draw" | ✅ |
| no save schema change | `costsCollege` is DERIVED at snapshot time, persisted nowhere | ✅ no migration, no fixture |

⚠ **`ENDINGS.collegeClosedFromTier` is unchanged at `w75` and no constant moved**, so P0's battery was
not re-run after the change: with no constant moved and the removed clause proved dead, a second
212-second run would measure the machine rather than the code. The claim it would test is the one
§4d proves directly.

---

## 8. FILES

| file | what changed | risk |
| --- | --- | --- |
| `src/engine/ending.ts` | the comment corrected; `CollegeResultView` + `collegeDoorOpen` added – the rule as a leaf that imports no calendar constant | none – no constant moved |
| `src/engine/world/endings.ts` | `collegeStillOpen` delegates to the leaf; `collegeResultViewOf` builds the view; `entryCostsCollege` added | none – identical answers |
| `src/engine/world/snapshot.ts` | `costsCollege` set from the engine predicate, outside `reason` | none – derived, additive |
| `src/engine/world.ts` | re-exports `entryCostsCollege` | none |
| `src/shared/protocol.ts` | `UpcomingEvent.costsCollege?: boolean` | none – optional, derived, no save field |
| `src/components/ForkDialog.vue` | the false eligibility sentence replaced; the #200 figure added | copy + one row |
| `src/components/screens/SeasonScreen.vue` | the warning appended to the entry confirm | copy |
| `src/components/screens/CalendarScreen.vue` | the warning on the marker card + `.college-note` | copy |
| `tests/ending.test.ts` | +7 cases: the four decoupling proofs and the three warning ones | – |
| `tests/component/college-warning.test.ts` | **new.** 15 mounted cases, incl. three phone-fit measurements and three mutation proofs | – |

**Reproduce the measurement:**

```bash
npx vite-node tools/ladder-baseline.ts            # §2, the frozen defaults – n 90, 676 weeks, 212s
npm run test:quiet                                 # the unit project
npm run test:component                             # the mounted UI gate
```
