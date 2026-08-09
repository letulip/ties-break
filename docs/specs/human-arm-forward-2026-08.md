---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-08
---

# The human arm run forward – what happens to him on the build we just made

**PROBE, NOT A WAVE. No engine line is touched, no balance constant moves, `tests/econ-reach.test.ts`
is not edited, and no save or fixture derived from one is committed.** The tool is
`tools/real-vs-bench.ts`, extended; the earlier half of this measurement is
`real-vs-bench-2026-08.md`.

**MEASURED AT `a4d3aef`** (`probe/human-arm-forward`, cut from `wave/playwright`). The commit matters:
`19ed515` – the coach/court bill split – landed between the earlier probe and this one, so every
head figure here was re-derived rather than carried over. §0a is the receipt that it changed nothing.

## Current truth

The owner asked for the modelling instead of a fresh save:

> *«Можешь попробовать применить мою тактику из уже отгруженных сейвов и посмотреть что получится на
> свежих данных, смоделировать.»*

**Done. His tactic survives the new build and stops climbing, and the whole loss belongs to one of the
two waves – measured bit-exactly, not attributed by argument.**

| the derived arm, 8k working, 10 seeds, 7 seasons | tree | envelope | prize/spend | top rung | W rank at s6 | bankrupt |
| --- | --- | --- | --- | --- | --- | --- |
| neither wave | `d9efb4e` | **9/9 FULLY INSIDE** | **61.8%** | **wta250** | **#221** | 1/10 |
| coach retainer only | `d9efb4e`+`bf00acb` | **9/9 FULLY INSIDE** | **61.8%** | **wta250** | **#221** | 1/10 |
| ladder floor only | `6d80792` | 7/9 | **8.7%** | **w35** | #993 | 1/10 |
| both (this build) | `a4d3aef` | 7/9 | **8.7%** | **w35** | #993 | 1/10 |
| both **+ he takes the coach's advice** | `a4d3aef` | **9/9 FULLY INSIDE** | **78.7%** | **wta250** | **#189** | **0/10** |

**Five findings.**

1. **THE ANSWER IN HIS TERMS: the career survives and the tennis stops.** Playing his way on this
   build, 9 of 10 careers reach season 7. The money stays level – net **+$723 a season**, ending
   around **$9,312**, one bankruptcy in ten. He would play **47 matches a season and win 67% of
   them**. And she tops out at **w35** instead of the **w100** and **wta250** his two real careers
   reached, at W rank **#993** against their **#288** and **#260**, with prize money covering **8.7%**
   of the family's spend against their **44.9%** and **80.2%**. **The failure is invisible from the
   bank balance.** It shows up only as a rank that does not move (§1).

2. **THE AXIS THAT BREAKS FIRST IS `topRung`, IN SEASON 2, AND `prize/spend` FOLLOWS IT IMMEDIATELY.**
   Season 2 is the first season a professional rung is enterable at all. On the pre-wave tree she
   enters w15 that season and is at **wta250 by season 4**; on this build she is still on j300 in
   seasons 2 and 3, reaches w15 only in season 4 and w35 in season 6. Her rank is the clearest read:
   **#901 → #446 → #216 pre-wave, against #1615 → #1619 → #1617 here** (§2).

3. **100% OF THE LOSS IS THE LADDER FLOOR. THE COACH RETAINER IS A NO-OP FOR THIS ARM, AND PROVABLY
   SO.** base and coach-only are identical **digit for digit on every season row and every tier-mix
   cell**; ladder-only and HEAD likewise. The reason is not luck: `openCareer` sets
   `world.coachOnEventWeeks = policy.coachOnEventWeeks` and `POLICIES[1]` sets it **true**, so on the
   pre-retainer tree `coachWorksThisWeek` already returned `true || …`. **A parent who takes his coach
   to tournaments was already paying the retainer voluntarily.** It bites only the grinder – which is
   exactly the arm `compound-cost-2026-08.md` measured (§3).

4. **THE MECHANISM: the floor leaves a cheap event on the calendar every week she cannot afford an
   expensive one.** In seasons 2–4 the un-vetoed arm commits **10.3, 7.7 and 7.3 entries a season to
   local, regional and national** – rungs that pay nothing – while the pre-wave arm commits **0.3,
   0.1 and 0.0**. She plays **more** (47.0 matches a season against 38.4), at **lower condition**
   (61–69 against 67–80), and climbs **less**. `tierOutgrown` used to close those rungs behind her;
   with the floor it never does (§4).

5. **ADAPTATION RECOVERS IT COMPLETELY – BUT ONLY ONE OF THE THREE ADAPTATIONS DOES ANYTHING.**
   Signing the sponsorship the bench always lets expire: **8.7% → 5.8%, nothing**. Booking the
   holiday no policy books: **6.7%, nothing**. Taking the coach's scheduling advice: **8.7% → 78.7%,
   w35 → wta250, one bankruptcy in ten → none, and not one career ends a season in the red.** The
   ladder wave shipped its own counterweight and the counterweight works (§5).

**So: the game did not get harder. It grew a decision it did not have before, and the bench does not
make decisions.** `coachLadderNote` closes the gap entirely. Whether the owner's own play closes it is
a question the saves answer only indirectly, and §6 is scrupulous about how far that evidence goes.

---

## 0. What was measured, and the receipts

### 0a. The commit, and the re-pricing that landed underneath this probe

`19ed515` "the bill splits in two: the coach, and the court" merged into `wave/playwright` after the
earlier probe's numbers were taken. Its own commit message calls it *a partition, not a re-price* and
carries the proof (1,620 careers, bankruptcies 538 before and 538 after, 17 identity columns
unchanged). This probe does not take that on trust – the earlier probe's whole eighteen-cell table was
re-run here at `a4d3aef` and diffed:

> **The 18-cell axes table at `a4d3aef` is byte-identical to the same table at `01a0ddd`.** The bill
> split is an identity on every axis in this file, which follows from the axes being read off
> `seasonHistory` totals rather than the per-category fold the split touches.

### 0b. The four trees, verified in place

The arm is the tree, as `compound-cost-2026-08.md` §0 requires. Read out of the worktrees rather than
asserted:

| tree | `tierOpenFor` | `coachWorksThisWeek` ends |
| --- | --- | --- |
| `d9efb4e` | `tierFloorOpen(...) && !tierOutgrown(...)` | `return world.coachOnEventWeeks \|\| !isCompetitionWeek(world)` |
| `6d80792` | `tierFloorOpen(...)` | `return world.coachOnEventWeeks \|\| !isCompetitionWeek(world)` |
| `40f61aa` = `d9efb4e`+`bf00acb` | `tierFloorOpen(...) && !tierOutgrown(...)` | `return true` |
| `a4d3aef` (HEAD) | `tierFloorOpen(...)` | `return true` |

⚠ **AND ONE OF THOSE TREES CANNOT LOAD A STATIC IMPORT OF THE THING BEING TESTED.**
`coachLadderNote` IS the ladder wave, so it does not exist on `d9efb4e` or on the coach-only arm. A
static import would have made the tool unloadable there – an arm reporting nothing instead of a
number, which is worse than a wrong number because it looks like an absence of effect. The tool
resolves it at start-up and prints `coach's scheduling voice on this tree: present / ABSENT` on its
second line.

### 0c. What the arm is: derived, inherited, and bracketed – kept apart

**DERIVED from the two saves.** Each one is a thing the saves record:

| behaviour | the evidence |
| --- | --- |
| climbs the coach ladder self → budget → middle → high | Zoe: w38, w113, w162. The owner shopped at w0 and moved up at w211 |
| upgrades when the family holds **$10,000** | the four observed upgrade balances are ~$8–9k, $9.6k, $10.8k, $16.0k – **$10,000 is their median** |
| at most one rung per season | the observed gaps are 38, 75, 49 and 211 weeks |
| **signs a kit deal at `national` or better, never `local`** | **6 of 6 decided offers, no exceptions** – §5a |
| answers the age-19 fork "continue" | the owner's save literally records `fork: { askedWeek: 265, answer: 'continue' }` |

⚠ **THE FORK IS NOT COSMETIC AND IT IS A BENCH ARTEFACT WORTH NAMING.** `advanceWeeks` returns
`['fork']` and **refuses to tick** while the fork is open, but `tickWeek` has no such guard – so an
unanswered fork stops a real player's career at about week 265 and every bench arm sails straight
through it. Answering it is what makes a seven-season bench run comparable to a human's at all.

**INHERITED unchanged from `POLICIES[1]`:** the $5,000 reserve and the condition-70 rest floor. Neither
is derivable from a save. The reserve is **swept rather than trusted** in §5d, because his own save
contradicts the value.

**BRACKETED, and deliberately not part of the model (§6):** the family holiday and the coach's
scheduling voice. Both are measured; neither is folded into the derived arm.

---

## 1. Season by season at HEAD – his tactic on this build

`8k · working · climbs · human`, 10 seeds, medians. `alive` counts careers that had not latched an
ending by the end of that season.

| season | alive | matches | W-L | entries | win% | mean cond | spend | earned | end funds | prize/spend | top rung | coach | W rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| s0 | 10/10 | 49.5 | 27-21 | 28.5 | 57% | 79.6 | $12,057 | $15,566 | $10,873 | 0.0% | national | budget | #1610 |
| s1 | 10/10 | 52.0 | 32-19 | 23.5 | 64% | 61.9 | $20,101 | $16,766 | $7,572 | 0.0% | j300 | middle | #1614 |
| s2 | 10/10 | 50.0 | 29-18 | 22.5 | 62% | 63.0 | $21,741 | $18,839 | $5,214 | **0.0%** | **j300** | high | #1615 |
| s3 | 10/10 | 44.5 | 30-14 | 20.5 | 69% | 69.7 | $21,049 | $20,118 | $5,411 | **0.0%** | **j300** | high | #1619 |
| s4 | 9/10 | 53.5 | 37-14 | 20.0 | 74% | 60.8 | $22,308 | $21,529 | $6,143 | 3.5% | w15 | high | #1617 |
| s5 | 9/10 | 57.5 | 39-14 | 22.5 | 74% | 65.5 | $23,463 | $22,676 | $8,837 | 4.2% | w15 | high | #1240 |
| s6 | 9/10 | 60.5 | 44-15 | 22.0 | 73% | 61.0 | $32,579 | $31,034 | $9,312 | **8.8%** | **w35** | high | **#993** |

Career fold: matches **47.0** · entries **19.6** · win **67%** · spend **$20,779** · earned **$19,982**
· net **+$723** a season · $423 a match · **prize/spend 8.7%** · top rung **w35** · **1 of 10
bankrupt, 1 of 10 ever red at a wrap**.

**THE DIRECT ANSWER, in the terms he asked it in.** Does the career survive? **Yes** – nine of ten
reach twenty-one, the balance never systematically falls, and one family in ten goes under. Does it go
red, and when? **One career in ten, and the median career never does.** Does she reach the rungs his
real ones reached? **No.** w35 against w100 and wta250; #993 against #288 and #260; 8.7% against 44.9%
and 80.2%.

⚠ **AND NOTE WHICH SIX OF THE NINE AXES STILL PASS.** matches, entries, win rate, spend, earned, net
and $/match all land inside the human envelope. **He would have no way of noticing from the money, the
match count or the win rate** – every one of those looks exactly like his own careers. Only two axes
move, and they are the two the game is about.

---

## 2. Which axis breaks first, and when

`topRung` in **season 2**, with `prize/spend` following in the same season. Season 2 is where the
professional ladder opens (w15 has `minAgeYears: 16` = week 104), so it is the first season on which
the two trees can differ at all – and they differ immediately.

| season | pre-wave top rung / prize / W rank | this build |
| --- | --- | --- |
| s0 | national · 0.0% · #1610 | national · 0.0% · #1610 |
| s1 | j300 · 0.0% · #1614 | j300 · 0.0% · #1614 |
| **s2** | **w15 · 5.0% · #901** | j300 · 0.0% · #1615 |
| **s3** | **w50 · 23.7% · #446** | j300 · 0.0% · #1619 |
| **s4** | **wta250 · 57.6% · #216** | w15 · 3.5% · #1617 |
| s5 | wta250 · 60.3% · #260 | w15 · 4.2% · #1240 |
| s6 | wta250 · 62.4% · **#221** | w35 · 8.8% · **#993** |

**Two seasons of rung, and it never closes.** By season 4 the pre-wave career is inside a WTA 250 and
ranked #216 – which is where both real careers ended up (#288 and #260). The same behaviour on this
build is 1,400 rank places away and still playing w15.

⚠ **THE MONEY AXES NEVER BREAK, AND THAT IS THE ONE GENUINELY ALARMING THING HERE.** Spend, earned and
net are inside the envelope in every season of both arms. A player watching his bank balance sees a
career that is working.

---

## 3. To which wave does it belong?

**The ladder floor, entirely.** The four arms, career folds:

| | base `d9efb4e` | coach only | ladder only `6d80792` | both `a4d3aef` |
| --- | --- | --- | --- | --- |
| matches / season | 38.4 | **38.4** | 47.0 | **47.0** |
| entries / season | 15.1 | **15.1** | 19.6 | **19.6** |
| win rate | 68% | **68%** | 67% | **67%** |
| spend / season | $23,225 | **$23,225** | $20,779 | **$20,779** |
| net / season | +$2,731 | **+$2,731** | +$723 | **+$723** |
| **prize / spend** | **61.8%** | **61.8%** | **8.7%** | **8.7%** |
| **top rung** | **wta250** | **wta250** | **w35** | **w35** |
| axes inside the envelope | **9/9** | **9/9** | 7/9 | 7/9 |

⚠⚠ **base ≡ coach-only AND ladder-only ≡ HEAD, DIGIT FOR DIGIT** – every season row, every tier-mix
cell, every fold. Two pairs of identical arms, and the pairing is on the ladder predicate.

**WHY THE RETAINER COSTS THIS ARM NOTHING, and it is a tautology rather than a coincidence.**
`openCareer` sets `world.coachOnEventWeeks = policy.coachOnEventWeeks`; `POLICIES[1]` – the policy
this arm is built on – sets `coachOnEventWeeks: true`, because *"having paid for a coach she takes him
to the tournaments"*. On the pre-retainer tree `coachWorksThisWeek` therefore already evaluated
`true || !isCompetitionWeek(world)` = **true**. The retainer changed that expression to `return true`.
**It changed the value for nobody who was already taking the coach along.**

⚠ **THIS DOES NOT CONTRADICT `compound-cost-2026-08.md`, IT LOCATES IT.** Every arm in that document
is the **grinder**, and the grinder sets `coachOnEventWeeks: false` – so the retainer moved its billed
weeks from 76.7% to 100% and cost it $22,208 a season, exactly as measured there. **The retainer's
entire cost falls on a parent who leaves his coach at home on competition weeks.** Neither human did:
the owner's save carries `coachOnEventWeeks: true`.

---

## 4. The mechanism – a cheap event is always on the calendar now

The tier mix is the proof. Entries per career per season, domestic rungs (local + regional + national,
all of which pay $0) against professional rungs (w15 and above):

| season | pre-wave: domestic / pro | this build: domestic / pro |
| --- | --- | --- |
| s2 | **0.3** / 5.3 | **10.3** / 2.2 |
| s3 | **0.1** / 8.1 | **7.7** / 4.5 |
| s4 | **0.0** / 10.7 | **7.3** / 6.3 |
| s5 | 8.7 / 8.9 | 10.6 / 8.3 |
| s6 | 5.1 / 10.4 | 9.3 / 9.7 |

**In the three seasons that decide the career – 16, 17 and 18 – the un-vetoed arm spends 10.3, 7.7 and
7.3 entries a season on rungs that cannot pay her, and the pre-wave arm spends 0.3, 0.1 and 0.0.**

`tierOutgrown` used to close local, regional and national behind her. With the floor it never does, so
there is always a cheap draw within reach on a week she cannot fund a W trip on – and the entry policy
takes at most one event per week, so a week spent on a Local Open is a week not spent climbing. The
result is the shape `rank-plateau.md` §5 describes, arriving through a new door: she plays **more**
(47.0 matches a season against 38.4) at **lower condition** (61–69 against 67–80) and finishes
**1,400 rank places lower**.

This is `money-decomposition-2026-08.md` §4.5's own observation – *"a twenty-nine-year-old
professional is still entering Local Opens"* – measured as the thing that caps the career rather than
as a curiosity. What is new is that it is not only a waste of money: **it is a waste of the weeks the
climb needed.**

---

## 5. Does an adapting player recover the envelope?

### 5a. Signing the sponsorship the bench always lets expire – no

⚠ **THE RULE IS DERIVED, AND IT IS THE CLEANEST DERIVATION IN EITHER PROBE.** Every kit offer either
save ever decided:

| | week | rung | answer | | week | rung | answer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| owner | 153 | global | **SIGNED** | Zoe | 99 | local | expired |
| owner | 257 | local | expired | Zoe | 151 | national | **SIGNED** |
| owner | 309 | national | **SIGNED** | Zoe | 152 | local | **REFUSED** |

Three signed, all `national` or better. Three not signed, all `local` – one refused outright while a
national letter sat in the same inbox the following week. **Six of six.** So the arm signs at
`national`, and that number was read off his decisions rather than chosen.

**Measured: it does nothing.** The arm signs **1.0 deal per career** and reads:

| | derived arm | + signs |
| --- | --- | --- |
| prize / spend | 8.7% | **5.8%** |
| top rung | w35 | w35 |
| axes inside | 7/9 | 7/9 |
| bankrupt | 1/10 | 1/10 |

Within noise, and if anything slightly worse. **The sponsorship gap the earlier probe found is real
and it is not what is holding this career back.** A national deal is a $3,000 seasonal allowance with
no travel share; the career is short of a rung, not of three thousand dollars.

### 5b. The holiday no policy ever books – no

**2.1 holidays per career, and 6.7% prize/spend, w35, 7/9, 1 of 10 bankrupt.** No effect. The holiday
is one of only two weeks `coachWorksThisWeek` exempts from the retainer – and since §3 shows the
retainer costs this arm nothing, exempting a week of it saves nothing.

### 5c. The coach's scheduling advice – yes, completely

`8k · working · climbs · human+signs+coachvoice`, 10 seeds, medians. **1,150 entries per career talked
out of.**

| season | alive | matches | entries | win% | cond | spend | earned | end funds | prize/spend | top rung | W rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| s0 | 10/10 | 49.5 | 28.5 | 57% | 79.6 | $12,057 | $15,566 | $10,873 | 0.0% | national | #1610 |
| s1 | 10/10 | 49.0 | 20.0 | 65% | 69.6 | $20,012 | $16,765 | $6,442 | 0.0% | j300 | #1614 |
| s2 | 10/10 | 48.5 | 16.5 | 65% | 67.7 | $24,563 | $24,254 | $6,307 | **8.1%** | **w15** | **#727** |
| s3 | 10/10 | 48.0 | 15.5 | **80%** | 74.4 | $30,599 | **$62,108** | $27,190 | **46.3%** | **w100** | **#228** |
| s4 | 10/10 | 47.5 | 16.0 | 71% | 71.4 | $43,234 | **$84,798** | $68,684 | **70.6%** | **wta250** | **#186** |
| s5 | 10/10 | 53.0 | 21.0 | 73% | 67.4 | $50,486 | $64,142 | $69,830 | 70.3% | wta250 | #277 |
| s6 | 10/10 | 48.5 | 19.5 | 68% | 72.3 | $55,137 | $80,954 | **$96,282** | **79.3%** | **wta250** | **#189** |

Career fold: **prize/spend 78.7%** · top rung **wta250** · net **+$4,597** a season · **9 of 9 axes
inside the envelope** · **0 of 10 bankrupt** · **0 of 10 ever red at a wrap**.

**It is better than the pre-wave arm, not merely equal to it** – 78.7% against 61.8%, #189 against
#221, no bankruptcies against one. The floor genuinely opens weeks that are worth having; what it
needed was somebody to say which of them to skip. Its tier mix says so exactly: domestic entries in
seasons 2–4 fall to **1.5, 0.7, 0.6** – the un-vetoed arm's 10.3, 7.7, 7.3 – and the professional
entries take their place.

**The ladder wave shipped its own counterweight and the counterweight is sufficient.** On the grinder,
`compound-cost-2026-08.md` §4 found the same voice restoring only the ladder floor's half of the loss
and leaving the retainer's. On a player-like arm there is no retainer half to leave, so it restores
everything. **Both readings are the same fact seen from two policies.**

### 5d. And the reserve – swept, because his save contradicts the inherited value

`POLICIES[1]` keeps a $5,000 reserve. The owner's save wraps season 1 on **$4,055** and then enters
fifteen events in season 2, so a $5,000 floor is not a conservative assumption about him – it is
contradicted by what he did. Picking the value that makes the arm survive would be the trap, so the
whole curve is reported:

| reserve | entries/yr | first season she entered nothing | prize/spend | top rung | bankrupt | inside |
| --- | --- | --- | --- | --- | --- | --- |
| $0 | 11.8 | **s3.0 (8/10)** | 1.3% | w15 | **8/10** | 4/9 |
| $1,000 | 18.7 | s4.0 (3/10) | 14.7% | w50 | 3/10 | 7/9 |
| $2,000 | 20.0 | s3.5 (2/10) | 14.3% | w50 | 2/10 | 7/9 |
| $3,000 | 20.0 | s3.5 (2/10) | 6.1% | w35 | 1/10 | 7/9 |
| $4,000 | 19.8 | s3.0 (2/10) | 12.0% | w50 | 1/10 | 7/9 |
| $5,000 | 19.8 | s3.0 (2/10) | 5.8% | w35 | 1/10 | 7/9 |

**No value of the reserve recovers the envelope.** The whole range reads 7 of 9 and 5.8–14.7% against
a human floor of 44.9%; removing it entirely is far worse (8 of 10 bankrupt). The reserve is not the
lever, and this sweep exists because a two-seed smoke run of this arm made it look like one – **the
median of two careers showed a permanent lock-out that ten careers do not have.** It is real for 2 of
10 careers and it is not what caps the median one.

---

## 6. Does he actually take his coach's advice? What the saves can and cannot say

**The coach voice is the only lever that works, and it is the one behaviour with no direct evidence in
the saves.** No save can record an entry a parent did *not* make, so this cannot be settled the way
§5a's signing rule was. What the trophy cabinet does carry is what she was winning, and when – and it
points the same way:

| | s2 | s3 | s4 | s5 | s6 | s7 |
| --- | --- | --- | --- | --- | --- | --- |
| owner: professional (W) titles | 0 | **6** | **3** | 2 | 1 | 1 |
| owner: domestic titles | 2 | 1 | **0** | 4 | 1 | 2 |
| Zoe: professional (W) titles | **3** | **5** | **3** | – | – | – |
| Zoe: domestic titles | **0** | **0** | **0** | – | – | – |

**Through the climbing window both humans were winning professional events and almost no domestic
ones. Zoe's cabinet contains no domestic title at all** – not one local, regional or national across
three covered seasons in which she won eleven W titles. That is very hard to reconcile with a calendar
that was half Local Opens, which is what the un-vetoed arm plays.

⚠ **AND THE LIMITS OF THAT, STATED RATHER THAN GLOSSED.** Three of them:
* **Titles are a biased sample of entries.** You win where you are strong, so a cabinet without
  domestic titles is weaker evidence than a ledger without domestic entries would be.
* **The cabinet only starts at about week 90** (`trophiesByTier` arrived at schema v31 and its
  migration creates an empty one), so seasons 0 and 1 are missing.
* **The owner's own record contradicts a *total* veto.** He won four domestic titles in season 5 and
  two more in season 7, after reaching w50 – so he was entering domestic events again once
  established. The coachvoice arm does the same thing (domestic entries return to 4.4 local in s5), so
  the shapes agree; but a parent who refuses every domestic entry for twenty years is not what either
  save shows.

**The honest position: the veto is not derived, its effect is measured, and the trophy record is
consistent with him following something like it during the climb.** It stays a bracket. What it
establishes is not "this is his tactic" but the thing the ruling actually needs – **the loss is
recoverable inside the player's existing choices, with no balance change at all.**

---

## 7. What this means for the ruling

1. **The ladder floor owns the whole regression, and its own counterweight fixes it.** Nothing needs
   re-pricing. `coachLadderNote` already exists, already says the right thing, and moves this career
   from 8.7% to 78.7% of spend and from w35 to wta250.

2. **So the open question is not balance, it is whether the advice is loud enough to be acted on.**
   That is a UI and feedback question – the same conclusion `money-decomposition-2026-08.md` L2
   reached from the other direction, and it is now measured on a human-derived arm rather than on the
   bench's `player` policy. **1,150 vetoes per career is a lot of advice to have to notice.**

3. **The coach retainer should stop being blamed for player-arm outcomes.** It costs a parent who
   takes his coach to tournaments **exactly nothing**, bit-exactly, and the owner's own save has
   `coachOnEventWeeks: true`.

4. **AND THE `econ-reach` RED IS UNAFFECTED BY ALL OF THIS.** It is measured on the grinder, where
   the retainer's cost is real and the reach is genuinely 1 of 30. Nothing here argues for re-basing
   it, and nothing here was allowed to touch it.

⚠ **WHAT IS STILL NOT ESTABLISHED.** The envelope is still drawn from two pre-wave careers. This probe
shows the derived tactic lands inside it on the pre-wave tree and outside it here; it cannot show what
he would *do* on this build, because a person adapts and an arm does not. **One exported save from the
current build still settles more than any further modelling will**, and this page is the answer to
"what can be said before it arrives".

---

## 8. Gates, and reproducing it

* `npm run context:audit` – ok.
* `npx vue-tsc -b --force` – clean.
* `npm run test:quiet` – green.
* `npm run test:sim` – 8 of 9; the ninth is the assembled tree's own `econ-reach` red at 1 of 30,
  inherited unchanged and ruled to stay red by `compound-cost-2026-08.md` §7.

```bash
npx vite-node tools/real-vs-bench.ts -- --save <a>.tsave --save <b>.tsave \
  --seeds 10 --human --adapt --deep

git worktree add --detach ../tb-w-base   d9efb4e
git worktree add --detach ../tb-w-ladder 6d80792
git worktree add --detach ../tb-w-coach  d9efb4e && (cd ../tb-w-coach && git merge bf00acb)
for d in base ladder coach; do
  ln -s "$PWD/node_modules" ../tb-w-$d/node_modules
  cp tools/real-vs-bench.ts ../tb-w-$d/tools/
  (cd ../tb-w-$d && npx vite-node tools/real-vs-bench.ts -- --save ... --seeds 10 --deep)
done
```

⚠ Every run prints `RUN real-vs-bench · <cwd>` on its first line and the coach-voice availability on
its second. A number whose banner does not name the worktree it was supposed to come from is not
evidence.

⚠ **The `--save` paths are not in this repository and must not be.** The tool refuses to do anything
without them – this measurement is only reproducible by someone holding the owner's own careers.
