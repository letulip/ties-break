---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 6 – the questions back to the owner

Every question here carries the measurement that raised it. Nothing in this file is a preference;
where a number is missing the question says so. The wave ships with every §4 constant UNRULED and
every string a DRAFT – that is the contract, not an omission.

Read in this order: 1 and 2 are one decision in two halves and the rest depend on them.

---

## 1. ⚠⚠ The news bar decides WHO gets this wave, not how often

`ECONOMY.spotlight.newsFameMin` is the single predicate every mechanic in the wave sits behind.
It shipped at **30**, and the brief anchored that on `contracts.fameCap`. **That anchor is a
different thing**: re-derived by walking the tree, the 30 lives at
`ECONOMY.business.merch.contracts.fameCap` – a ceiling inside the **merch and brand-reach** model,
whose own comment reads «the most the whole term may ever add». It is the top of one contributor,
not a band on the total. The scale's own ceiling is `ECONOMY.fame.cap = 100`.

**Measured at both ends of the game, and the two ends disagree in a way that IS the answer.**

*Your saves – 33 files, 15 408 career weeks, read through the game's own import door:*

| bar | share of all career weeks | saves that ever reach it |
| --- | --- | --- |
| ≥ 10 | 29.2% | – |
| ≥ 15 | 12.1% | – |
| ≥ 20 | 10.9% | – |
| ≥ 25 | 8.5% | – |
| **≥ 30 (shipped)** | **6.9%** | **8 of 33** |

Per career, the peak fame ever reached: `naomi` 15.4 · `vera` 13.8 · `olivia` 11.1 · `zoe` 4.9 ·
`academy-demo` 0.0. **Five of the eight careers in that corpus never reach 30 at any week of their
lives.**

*The bench's grid – 16 careers, a wealthy family under the policy that wins, i.e. the CEILING:*

| bar | news weeks | events | per career | mean charge |
| --- | --- | --- | --- | --- |
| 10 | 59.6% | 1300 | 81.3 | −1.49 |
| 15 | 54.4% | 1254 | 78.4 | −1.69 |
| 20 | 52.1% | 1214 | 75.9 | −1.75 |
| 25 | 48.2% | 1117 | 69.8 | −1.83 |
| 30 | 45.3% | 1041 | 65.1 | −1.87 |

**The reading, and it is sharper than «pick a number».** On a career that gets there, the bar barely
matters – 59.6% against 45.3% across the whole sweep – because once she is famous she stands far
above every candidate bar. On the careers in your own corpus it decides everything: at 30 the wave
does not exist for five of eight girls. **So the bar is not a frequency dial, it is a membership
rule.**

**The question: who is this wave for?** Only the girls who became genuinely famous (30), or every
girl the public has heard of at all (10–15)? A lower bar does not make a star's life noisier; it
gives the middle of the roster a spotlight layer they currently do not have.

## 2. ⚠⚠ What the player SEES, and the quadrant that sees nothing

Ruling N predicted this from the constants; the bench measured it and added a gradient I did not
predict.

**The arithmetic.** Baseline is **70**, the `dimmed` band edge is **67.5** – a gap of **2.50**. The
spotlight's worst single contribution to an expressed-open steady girl is **2.40**. So the spotlight
**alone never moves her Mood word**; it can only tip a week the ordinary weather had already carried
to within a tenth of the edge. For scale, a break-up is **−22 steady / −34 intense**; the spotlight's
worst event is **−7.50**, and a calm habituated girl with the fifth focus held takes **−0.33**.

**Measured, the share of charged weeks on which the spotlight TIPPED the Mood band:**

| birth temperament | spotlight tipped |
| --- | --- |
| **sunny** (open · steady) | **2.3%** |
| fiery | 15.5% |
| quiet | 19.3% |

against an ordinary-week control of ~20.9%. **The wave is not invisible to the roster – it is
invisible to one quarter of it.**

**The question is the same decision as §1's, from the other side**: at the drafted bases the feed
prints «the cameras were everywhere» on weeks the Mood word does not move, which is «every dip
explainable» read backwards. Raise the bases, lower the bar, or accept that the spotlight is weather
among weather and let the feed row carry it alone – all three are coherent; they are different games.

## 3. ⚠ The same girl has now been missed by two waves running

Wave 5's question 4: a **sunny** girl's «over herself» focus corridor is 100% – she can buy the year
and receive nothing, because both her axes are already where the focus would move them.
Wave 6's finding above: the same **sunny** girl is the one quadrant the spotlight cannot reach.

Two consecutive layers of who-she-is pass over one temperament. That is no longer a coincidence of
two waves – it is a shape. **The question is whether the sunny girl is meant to be the easy one (her
reward for being steady and open is that less of this weather touches her) or whether the layer owes
her something of her own.** Nothing in the specs answers it, and both readings are defensible; it
needs your word rather than another measurement.

## 4. The fifth focus ships with no receipt, and one word commissions it

Of the four existing psychologist focuses, **two carry a receipt constant, one carries a channel, one
carries nothing**. «The public life» would be the second with nothing – and unlike `herself` there is
no objection to its sentence: the spec already wrote it, «The cameras stopped costing her sleep.»

It did not ship because a receipt is a feed row on a **trigger**, and the trigger is the design
decision – wave 5's `RECOVERY_RECEIPT` was ruled against a measured earning condition, never invented
by a builder. §8 forbids the new mechanic and this wave already carries a dozen unruled numbers.

**It is not parked.** The sentence exists, the surface exists, the trigger proposal is in the strings
document. One word from you commissions it.

## 5. Does the spotlight deserve a mark of its own?

The exposure feed row wears 🤍 – **your own 11.09 pick for the `'life'` row kind**, worn by every life
row with no per-kind mark of its own. It is not the romance thread's mark, which is how it was first
reported to me; it is the general one. §5a stands – no agent picks a glyph – so nothing was picked.

**The question is narrow: is a «the cameras were everywhere» row a life row like the others, or does
the spotlight want its own mark?**

## 6. ⚠ One of the five exposure kinds cannot be measured by any bench we have

`'shoot'` fires on a **delivered** shoot week, and a shoot week exists only on a **signed** ad letter.
`stepCareerWeek` – the walk every bench in the repo is built on – signs none, at any preset, at any
policy. So `'shoot'` fired **0 times** across the whole bench grid, and every event count in §1 is a
**lower bound**, short by exactly the shallowest kind the wave has (`−2` against `−4` for a public
loss).

The instrument that signs letters exists (`tools/ad-shoot-bench.ts`). Pairing the two is a task, and
the bench deliberately did not invent it for itself.

**The question: is that pairing worth a task, or is `'shoot'` priced by argument?**

## 7. The leak's fame factor – I overrode the brief on the spec's authority

The brief drops fame from the leak hazard, arguing the news gate already prices it. Measured, it does
not: above the bar fame runs **30 → 100**, so under the brief's spelling a girl at 100 leaks exactly
as often as one at 30. who-she-is §3c-bis says the hazard «scales by **fame × EXPRESSED openness** –
more lenses on a bigger star», and the brief's own single-source rule says the spec wins on drift.

Shipped: `leakBasePerWeek × leakOpennessMult × (fameAt / ECONOMY.fame.cap)`. No new tunable, the draw
count unchanged. **Flagged because it is a deliberate override of a brief you commissioned**, not
because the measurement is in doubt.

## 8. The wrong story costs pressure before a correction beat exists

Shipped per §3c-bis's own landing: a wrong story is its own exposure event and its own charge, and
the correction beat is a later wave's. **The brief asked that you rule this with the numbers in
hand.** The numbers: `wrongStory` fired **0 times** across the bench grid – the whole leak half is
rare there (5 leaks, 16 careers) – so the sting is real in the model and unmeasured in practice.

## 9. §4's numbers, with what is measured beside each

Every one is UNRULED and every one is in the tree at its drafted value.

| constant | drafted | measured |
| --- | --- | --- |
| `newsFameMin` | 30 | §1's two tables |
| `stageTierMin` | `'wta500'` | a `TierId`, compared through `TIER_LADDER` – there is no numeric tier scale |
| `pressureBase` | −2 / −3 / −4 | §2: the worst event is −7.50 against a break-up's −22/−34 |
| `habituationFullWeeks` | 104 | – awaiting the habituation curve |
| `habituationFloor` | 0.25 | – |
| `publicLifeShrink` | 0.85 / 0.70 / 0.55 | – awaiting the psy grid's monotonicity |
| `publicLifeAccel` | 1.5 / 2.0 / 2.5 | – |
| `leakBasePerWeek` | 0.008 | 5 leaks across 16 bench careers |
| `leakOpennessMult` | ×2.0 / ×0.5 | 13 fires per 800 open weeks at fame 100, 4 private |
| `wrongShare` | 0.15 / 0.60 | 0 wrong stories on the grid |
| `newsWindowWeeks` | 6 | – |

## 10. Two sentences that were true when written and are false now

Both corrected rather than annotated, under the rule that an **assertion about the present** is fixed
while a **record of a measurement** is annotated:

* the focus refusal said «there are four» – there are five. The count is **removed** rather than
  bumped, because a number there rots on every roster change and has now done so once.
* the `knownWeek` field comment says «null while he has not been told» – measured, `rollArrival`
  always sets it, so an engine-born row never holds a null there.

And one that was **annotated, not corrected**: a v74 block in the frozen-fixtures file prints a row
with `knownWeek: 139` where the live row reads 137. That block is a record of what wave 3 measured;
correcting the number in place would falsify a record to fix a fact. The note names the cause –
commit `72b37671`, 11.09, which moved the open register and re-stamped this file in the same commit.

## 11. ⚠⚠ The founding scene does not occur in play

§3c-bis exists around one image – «a parent learning about a boyfriend from a photograph», which the
design plan §0 names as its own founding scene. The mechanism is built and correct. **It fires zero
times: 0 overtakes in 93 leaks across 160 careers.**

The reason is not a bug. The parent's own disclosure lag (the §4 «Feed lag» table – open 0 with
p 0.70 else 1..4, private 0 with p 0.10 else 2..12) is **short relative to the time a leak needs**,
so he always hears first. The brief's original spelling could never have fired at all (an engine-born
row never holds a null `knownWeek`); the corrected spelling can fire and does not.

**The question: is the scene worth the lag table moving for it?** The two levers are the private
register's feed lag (today median 2–12 weeks) and `leakBasePerWeek`. Nothing else needs to change –
the delivery path, the beat and the headline register are already built and tested.

## 12. ⚠ A walled-up famous girl barely exists

§3c says «a walled-up girl carries fame worst, a repaired one carries it better – the parent is in
the loop». Measured: the walled arm reached **13.5 news weeks and 0 frozen ones**. A parent who
grinds hard enough to raise her walls destroys the fame that would have made her news, so the
habituation freeze has almost no population. The only famous-and-walled girl this engine produces is
the **repaired** one, transiently, while the wall is still coming down (26.3 frozen news weeks).

**The question: is that the design?** It is a coherent reading – the two costs are alternatives, and
a parent pays one or the other. But it means the freeze is a rule about a state the game rarely
reaches, and §3c's sentence describes a girl who is mostly hypothetical.

## 13. The wave costs a deep girl three times what it costs a sunny one, and reaches the tennis in neither

The fairness corridor's high-fame column **HITS**: worst pair 0.188 pp against a ±1.5 pp bar, eight
times inside, non-vacuous. Lifetime win rate 71.9 / 71.9 / 71.9 / 71.8%.

Underneath it, the total spotlight charge over a career: **sunny −52.2 · deep −162.8.** Three times
the weight, and the tennis does not move for either. **That is the wave working as specified** –
spirit is bounded, recoverable, and the match factor's floor stands – but it is worth your eye,
because «costs three times as much and changes nothing measurable» is also a description of a
mechanic that is not yet doing work.
