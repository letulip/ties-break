---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-09-01
---

# Collaborations as the early lever on fame

**Status: SHIPPED, round 32 #5 (01.09.2026), and EXTENDED the same day. §6 was his ruling and §7-§9
are the first pass's predicted vs measured; ⭐⭐ §10 IS HIS EXTENSION AND §11-§12 ARE ITS MEASUREMENT.**

⚠ **Measured TOGETHER with `brand-inertia-2026-08.md` (round 32 #4)** on his own instruction –
«совместный эффект – мерить, да». The COMBINED table is that spec's §8; this one records what THIS
item does, what it costs, and the finding that changed the sizing.

## 1. What he asked

«карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе коллаборации нам должны
помочь, они станут хорошим рычагом роста известности и стоимости бренда как раз» – and «и это надо
внедрять да».

## 2. ⚠ A claim of mine he was right to challenge

I said a top-20 player with no titles has no contracts to multiply. **That was wrong and he caught
it**: «как такое возможно?» `adBandFor` (`engine/offers.ts:1784`) selects the band from
`standing.wtaRank`, not from fame, so a top-20 career is offered contracts on schedule. The claim
was inherited from an agent's report and I repeated it without measuring.

## 3. What the measurement actually says

Fame is `min(cap, floor x shootMult)`. The floor is built from two ledgers, and they are not on the
same scale at all:

| a TITLE is worth | | a SEASON is worth | |
| --- | ---: | --- | ---: |
| World Tour 500 | 8.0 | ended top 10 | +0.6 |
| World Tour 1000 | 14.0 | ended top 25 | +0.35 |
| Slam | 25.0 | ended top 50 | +0.2 |
| | | **cap on all seasons, ever** | **4.0** |

⭐⭐ One World Tour 500 title is worth **thirteen top-25 seasons**. One Slam is worth **forty-two
top-10 seasons**. Fame in this game is almost purely a TITLE currency, and consistency – which is
what a top-20 career is made of – buys next to nothing and stops buying anything at 4.

⚠ THIS IS A SECOND PASS AT A PROBLEM THE OWNER ALREADY RAISED ONCE. `economy.ts:1849` records his
own «она же топ-20 в мире», and the reputation bands were added in answer to it. They were the right
idea at a tenth of the size needed.

⭐ AND THE SHAPE IS WHY COLLABORATIONS CANNOT HELP TODAY: the shoot term MULTIPLIES the floor. His
Alice has five live deals and they are worth x1.74 – real money on a floor of 12.85. On a floor of
3.5 the same five deals buy 2.6 points of fame. **A multiplier cannot lift a career that has nothing
to multiply**, which is exactly the early stage he wants the lever for.

## 4. The proposal

**A collaboration ADDS to the floor rather than multiplying it.** A signed deal – and especially a
delivered shoot – is itself a public event: a face on a shelf reaches people who have never watched
a match. That makes it a source of fame in its own right, on the same ledger as a title, not a
coefficient applied to titles she has not won.

Open shape questions, deliberately not answered here:
- flat per delivered shoot, or scaled by the deal's band (a global house is not a local retainer);
- does the addition decay on the same 104-week half-life as a title, or slower;
- does the existing multiplier stay as well, so that fame compounds for a champion who also sells –
  ⭐ my recommendation is **yes, keep both**: the add is the early rung, the multiplier is the late
  one, and a career that has both should feel that.

## 5. Acceptance

- A top-20 career with no titles reaches a fame where its brand prices ABOVE the mark floor – the
  case the owner named. Quote it before and after.
- Alice's own row barely moves: her floor is already 12.85 and this is not a retune of the top.
- A career with no results and no deals gains nothing.
- ⚠ The interaction with `brand-inertia-2026-08.md` is measured, not assumed: both specs push on the
  same number and a wave that ships them together must report the combined effect, not two separate
  ones.
- ⚠ Invariant 5: predicted vs measured, and a bench.

## 6. HIS RULINGS (31.08) – §4 is closed, this spec is ready to build

1. **Scaled by the deal's band?** «по полосе сделки (глобальный дом это не локальный ретейнер) – да»
2. **Does the multiplier stay as well?** «давай, да» – the addition is the early rung, the existing
   multiplier the late one, and a career carrying both should feel it.
3. **Measured together with brand inertia.** «совместный эффект – мерить, да»

4. **DOES THE ADDITION DECAY?** He put the question back to me with both halves of the tension named:
   «наверное истлевает (мало кто смотрит журналы 2 годичной давности) … с другой стороны "что попало
   в интернет осталось навсегда"».

   ⭐⭐ THE TWO HALVES ARE NOT IN CONFLICT – THEY ARE TWO DIFFERENT THINGS, and separating them is
   the design:

   - **the campaign's noise** – her face on a shelf THIS season. It fades, and it should fade
     **faster than a title**: a championship is a sporting fact recited in every broadcast for years,
     a campaign is one season's wallpaper. His magazines are this half.
   - **the association** – «she was the face of Faro Automobiles» is a line in her biography and does
     not expire when the spots stop running. His internet is this half.

   ⭐ DECIDED: **the fame addition decays, on a half-life SHORTER than a title's 104 weeks, and
   carries no permanent residue of its own.** The permanence is not dropped – it is carried by BRAND
   STRENGTH (`brand-inertia-2026-08.md`), which this addition feeds while it is high.

   ⚠ THE ARGUMENT FOR NOT PUTTING A PERMANENT RESIDUE HERE TOO: strength already exists to be the
   stock that remembers. A second permanent term inside fame would be two systems doing one job –
   precisely the fault the inertia spec was written to cure («today one number does both jobs and
   neither well»). One mechanism for what fades, one for what was built, and no overlap.

   ⚠ AND IT REMOVES AN UNBOUNDED TERM: a permanent per-shoot addition accumulates without limit over
   a twenty-season career and would need a cap chosen out of the air. A decaying pulse needs none.

---

## 7. What was built, and the finding that set the size

⚠ **SUPERSEDED IN PART BY §11**: the half-life below became a per-band LADDER on 31.08 (his extension,
§10). The sizes, the band recovery and the sizing criterion in this section all still stand.

`fameFloorOf` gains one term. For every shoot week she has actually LIVED – the same predicate
`fameShootMultOf` already uses, extracted so the two folds cannot drift – the floor gains
`shootFloorByBand[band]`, faded on the campaign's own half-life:

```
floor += shootFloorByBand[adBandOfTerms(letter)] × 2^(−(week − shootWeek) / shootFloorHalfLifeWeeks)
```

with `ECONOMY.fame.shootFloorByBand = [0.04, 0.06, 0.08, 0.11]` and
`shootFloorHalfLifeWeeks = 52` – **one season, against a title's two.**

⭐ **THE BAND IS RECOVERED FROM THE PAPER, so no save needs a new field.** `adBandOfTerms` reads the
cheque the letter froze at signature back against `categories[c].feeCentsByBand`, walking from the
top exactly as `adBandFor` walks the ranks. A letter written under today's table lands on its own cell
exactly; a legacy letter lands on the strongest rung its fee can pay for; the capstone is the top band
by name. `SAVE_SCHEMA_VERSION` moves for round 32 #4, not for this – **this item adds no field to
`AdOfferTerms` and back-fills nothing.**

⭐ **BOTH SURVIVE, on his ruling «давай, да».** `fameShootMultOf` is untouched: the add is the early
rung and the multiplier is the late one, and a career carrying both feels both. The guard asserts the
two ledgers read the same weeks.

### ⚠⚠ THE FINDING THAT CHANGED THE SIZING: a steep gradient destroys the thing the item is for

The first draft read his ruling «глобальный дом это не локальный ретейнер» as *proportional to the
cheque* and shipped `[0.15, 0.35, 0.6, 1.0]` – 6.7× across the bands. **Measured on his own w933
career that setting moved fame +43.7% and the brand's worth +131%, back to $1.92M.** That is a retune
of the top wearing an early-career label.

**And the arithmetic says a steep gradient is backwards, not merely large.** The high bands are where
the shoot ASK is highest (two weeks a year per deal against one) *and* where a career already has a
floor for the multiplier to work on. A steeply banded add therefore lands hardest exactly where it is
least needed, and the proportional lift – which is what «a lever» means – ends up roughly EQUAL for a
veteran and a newcomer. A gentle gradient keeps the asymmetry: the same absolute add is worth far more
on a floor of 2 than on a floor of 12.8.

⭐ **So the gradient is 2.75×, and the argument is REACH rather than money.** The cheques across those
four bands span sixty-fold ($20,000 to $1.2M in `categories.watches`); what a shoot buys HERE is how
many people see her face, and that does not scale with the cheque – a bigger house means better
placements in more countries, not a hundred times the faces.

### The sizing criterion, and it is round 32 #3's own

That wave chose `value.unknownX = 2.5` as **«the highest value that still reads single digits on the
shop row at his fame»**, and this wave may not undo it by pushing that fame back up. The shipped
gradient is **the largest of its shape under which his w933 row still reads 9 years.** The frontier:

⚠ The rows are the **C arm** – this item alone, with round 32 #4's stock held off – so what moves
between them is this item's setting and nothing else. The «off» row is the control and is round 32
#3's shipped number to the cent.

| `shootFloorByBand` | half-life | his fame | his worth | shop row | verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| off | – | 22.33 | $831,382 | 9 | the control |
| **[0.04, 0.06, 0.08, 0.11]** | **52w** | **23.69 (+6.1%)** | **$952,076 (+14.5%)** | **9** | **shipped** |
| [0.06, 0.08, 0.11, 0.15] | 52w | 24.20 (+8.4%) | $999,104 (+20.2%) | **10** | undoes #3's criterion |
| [0.06, 0.08, 0.11, 0.15] | 39w | 23.93 (+7.2%) | $973,793 (+17.1%) | 9 | half-life picked to fit |
| [0.10, 0.14, 0.18, 0.24] | 52w | 25.43 (+13.9%) | $1,119,683 (+34.7%) | 10 | – |
| [0.15, 0.35, 0.60, 1.00] | 52w | 32.07 (+43.7%) | $1,922,441 (+131%) | 10 | the first draft |

⚠ A shorter half-life buys almost nothing here and was measured rather than assumed: his shoots are
recent and dense, so 26 weeks with a bigger per-shoot step lands in the same place as 52 with a smaller
one (fame +7.8% at `[0.08, 0.11, 0.15, 0.20]` / 26w). **52 is kept because it is a fact rather than a
fitted parameter** – «мало кто смотрит журналы 2 годичной давности», i.e. half of a campaign is
forgotten by the next winter, against a championship's two seasons.

---

## 8. Predicted vs measured

**⭐ Alice's own row barely moves, which was §5's requirement.** Her floor 12.85 → 13.63, her fame
22.33 → 23.69 (**+6.1%**), and the +14.5% on worth is round 32 #3's `fame³` amplification of that,
arriving beside a matching **+12.6% on the income** ($1,720 → $1,937/week). The shop row still prints
**9**.

**⚠ A top-20 career with no titles – and the honest answer is that THIS item is not what saves the
case he named.** Round 30 #24's own guard arm (four seasons ended #18, nothing signed, fame 7.24) has
**no delivered shoot for the add to act on**, so C is byte-identical to A: $46,095 gross, priced at the
$62,500 mark. What lifts it over the mark is round 32 #4's stock ($67,011). ⭐ **That is precisely why
the owner asked for the combined measurement, and summing the two items' own deltas would have got it
wrong.** Where this item DOES act – the same career once she signs what her band already writes her,
two band-2 deals at two shoots a year – it is worth real money:

| the named case, once she signs | fame | gross worth |
| --- | ---: | ---: |
| A control | 10.60 | $105,512 |
| B inertia only | 10.60 | $140,243 |
| **C collabs only** | **11.33** | **$122,111** |
| **D COMBINED (ships)** | **11.33** | **$154,741** |

⚠⚠ **AND THE STRUCTURAL FINDING BEHIND IT, which is bigger than this item and is filed rather than
fixed: a top-20 career that signs its own shelf was ALREADY above the mark before this wave.** The
existing multiplier reaches ×1.31 on two deals and its ×2 cap on five, so `$46,095 → $105,512` with no
new mechanism at all. The career that prices at the mark is the one that signs NOTHING. The wall is
`fameFloorOf`'s title currency – one World Tour 500 title is worth 8 points against a whole top-20
season's 4 – and neither item moves it. §3's table stands as the diagnosis; the repair, if he wants
one, is the season-end ladder, and that is a retune of the top and his to rule on.

**⚠ A career with no results and no deals gains exactly nothing**, in every arm and at every week –
fame 0, strength 0, the owned row at the mark. Measured on the 72-career walk: 2 careers never reach
fame 1 at all and neither moved by a cent.

**⚠ And the row that shows the change honestly**: five band-2 campaigns hand-planted on a career that
won nothing and ranked nowhere read **fame 2.34 and a gross worth of $2,357** – up from zero. That is
the addition doing what it is for, it is why the paragraph above says «and no deals», and the owned
row is still worth the mark. In play it does not arise, because `adBandFor` would never have written
those letters.

**⚠ AND ONE THING IS TRUE THAT WAS NOT TRUE BEFORE, said plainly.** The add is on the FLOOR, so a
delivered shoot makes fame out of nothing – which is exactly what «a source of fame in its own right,
on the same ledger as a title» means and is the change the owner asked for. What stops a face with no
tennis buying a brand is **upstream**: `adBandFor` refuses a standing that is not WTA-ranked, so the
post never writes her a letter to sign. The gate is the offers system's, and the guard records where
it lives so a later reader does not go looking for it in `fameFloorOf`.

---

## 9. The decay, the residue, and the save

⭐ **The addition decays on 52 weeks and carries NO permanent residue of its own** – §6.4's ruling
implemented exactly. Forty years on, less than a millionth of a campaign is left in the floor. The
permanence his internet sentence asks for is carried by BRAND STRENGTH, which is the other item, and
that is what keeps one mechanism for what fades and one for what was built – with no overlap and no
unbounded term needing a cap chosen out of the air.

**⚠ NO SCHEMA MOVE IS OWED BY THIS ITEM.** It adds no field, back-fills nothing, and reads a letter's
existing `cashCents`. The v69 bump belongs to round 32 #4. ⚠ One consequence is named in the migration
itself: the v69 pin is taken with the NEW `fameAt`, so a save carrying signed campaigns pins a
slightly higher fame than it read yesterday. That is this item's intent – it is a change to what fame
IS – and pinning the pre-#5 number would have frozen a live career out of the feature it shipped
alongside.

**⚠ Zero draws.** The term is a fold over dated shoot weeks that the save already carries and never
prunes. `offers` is byte-identical on all three frozen careers, which is the independent confirmation
that nothing about WHICH letters get written moved. The frozen MAIN capture (41550 / `e6b0c709`) is
untouched.

**The guard** is `tests/round32-brand-inertia.test.ts` §6-§8 – the add is on the floor, it is monotone
in the band, the band is read off the cheque (every cell, plus a legacy letter, plus the capstone), it
decays faster than a title and leaves no residue, the multiplier still moves too, a shoot still ahead
buys nothing, and a week the college freeze swallowed lapses silently. Mutation-verified; the log is
at the foot of the file.

## 10. ⚠ HIS EXTENSION (31.08) – REACH BUYS DURABILITY, NOT ONLY VOLUME

⚠ *This block is his, verbatim, and is the specification §11-§12 are measured against. It was written
as «§7» and is renumbered here only because §7 above was already taken – nothing in it moved.*


His words: «у нас есть популярные сайты, журналы и бренды, а есть менее популярные, о которых знает
мало людей. Что если мы это тоже отразим в нашей формуле доходности? т.е. чем больше она была в
сильных контрактах – тем больше у нее велосити … Как то женщин из номинации плейбоя помнят довольно
долго, как мне кажется, но может быть я ошибаюсь».

**WHAT SHIPPED IS HALF OF THIS.** §6 scaled the addition's SIZE by the deal's band
(`0.04 / 0.06 / 0.08 / 0.11`) and gave every band the SAME 52-week half-life. So a global house and
a local retainer are told apart by loudness and forgotten at identical speed.

⭐ **They should differ in both.** A placement seen by millions leaves a mark that outlives the
campaign; a flyer in one town is gone by the next season. That is precisely his «велосити»: a career
spent in strong contracts should be remembered, not merely have been louder at the time.

⚠ ON HIS EXAMPLE: he hedged it himself («может быть я ошибаюсь») and it has not been checked here,
so it is not evidence. It is not needed – the general principle, that high-reach placements are
remembered longer than low-reach ones, carries the design on its own.

**THE CHANGE IS ONE PARAMETER, into machinery that already exists:** the shoot addition's half-life
becomes a function of the band, alongside the size that already is. Weakest band shortest, global
house longest; pick the range by measurement and report it.

**ACCEPTANCE:**
- ⭐ two careers with the SAME number of delivered shoots but different bands must diverge visibly
  years later – that is the whole claim, and a test that only compares them in the shoot week proves
  nothing about durability.
- Alice's own row still barely moves; the top of the shelf is still unmoved.
- ⚠ measured in the COMBINED arm with the revised inertia, per his standing ruling.

---

## 11. What was built – the band now sets the CLOCK as well as the size

`ECONOMY.fame.shootFloorHalfLifeWeeks = 52` becomes
**`shootFloorHalfLifeByBand = [26, 39, 52, 78]`**, and `shootFloorDecayAt` takes the band:

```
floor += shootFloorByBand[band] × 2^(−(week − shootWeek) / shootFloorHalfLifeByBand[band])
```

One index, read twice. No new ledger, no new field, and **`adBandOfTerms` already answered the
question** – §7's «the band is recovered from the paper» does both jobs unchanged.

⭐ **BAND 2 STAYS AT THE SHIPPED 52**, deliberately: the anchor round 32 #5 was sized on does not
move, so what this extension changes is the SPREAD and not the level.

⚠ **AND THE TOP RUNG IS STILL SHORTER THAN A TITLE'S 104 WEEKS**, which is the binding half of §6.4's
ruling and is not the extension's to renegotiate: a campaign is one season's wallpaper, a
championship is recited in every broadcast for years. 78 weeks is a season and a half.

### The frontier, on his own row, with round 32 #3's criterion still binding

| `shootFloorHalfLifeByBand` | his fame now | his worth now | the shop row |
| --- | ---: | ---: | ---: |
| 52 / 52 / 52 / 52 – what shipped first | 23.69 | $952,076 | 9 |
| 39 / 45 / 52 / 65 | 23.66 | $949,072 | 9 |
| **26 / 39 / 52 / 78 – shipped** | **23.63** | **$946,611** | **9** |
| 26 / 45 / 65 / 91 | 23.76 | $958,620 | 9 |
| 26 / 52 / 78 / 103 | 23.87 | $968,567 | 9 |

⭐ **ALICE'S OWN ROW BARELY MOVES – −0.6% on the worth, and DOWNWARD**, which is worth stating because
it is the opposite of what a «reach buys more» change sounds like. Her delivered shoots are
**6 / 5 / 14 / 0 by band**: she has never signed a global house, so shortening the two weakest rungs
costs her slightly more than lengthening the strongest one gives back. The shop row still reads
**9 years**, so #3's sizing criterion is intact, and every rung of the frontier above holds it.

## 12. ⭐⭐⭐ Predicted vs measured – does the gap actually OPEN?

His acceptance is explicit that the shoot week proves nothing, so this is measured years later. Two
careers, the SAME twelve delivered shoots over three seasons, one at band 0 and one at band 3,
read at intervals after the last of them (`tools/r32-brand-inertia.ts` §6):

**⭐ The early career the item is for – three seasons ended #45, four shoots a year:**

| after the last shoot | band 0's shoot floor | band 3's | spread | band 0 worth | band 3 worth | spread |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| the shoot week | 0.1223 | 0.8198 | 6.7x | $7,277 | $12,354 | 1.70x |
| +1 year | 0.0306 | 0.5164 | **16.9x** | $3,827 | $5,492 | 1.44x |
| +3 years | 0.0019 | 0.2049 | **107.3x** | $1,867 | $2,667 | **1.43x** |
| +5 years | 0.0001 | 0.0813 | **681.1x** | $1,180 | $1,651 | 1.40x |

⚠ **AND THE CONTROL IS THE LADDER THAT SHIPPED FIRST, not «they differ».** On the flat 52-week ladder
the same two careers are **$1,966 against $2,436 = 1.24x** at three years, against **1.43x** here –
and the floor spread stays at a flat **2.75x** forever, exactly what it was in the shoot week. **That
is the whole claim: on the old setting the gap never opens.**

**...and a settled top-20 career – six seasons ended #18, two shoots a year:**

| after the last shoot | band 0 worth | band 3 worth | spread | flat-ladder spread |
| --- | ---: | ---: | ---: | ---: |
| the shoot week | $270,040 | $291,116 | 1.08x | – |
| +3 years | $50,760 | $54,520 | **1.07x** | 1.04x |

⚠⚠ **THE HONEST HALF: THE WORTH FEELS THIS FAR LESS THAN THE FLOOR DOES, AND MORE SO THE BIGGER THE
CAREER.** Two things compress it, and neither is a defect: the collaboration term is a small share of
a floor built mostly of tennis (`fameFloorOf`'s title currency, §8's structural finding, unmoved), and
the brand's slow stock remembers BOTH careers' peaks, where the shoots were fresh in either arm. So
the effect is real, permanent and modest – 1.43x on the early career, 1.07x on the settled one – and
it is largest exactly where the item was asked for. ⭐ A design that made it larger would be moving
the top of the shelf, which is forbidden.

⚠ **MEASURED IN THE COMBINED ARM WITH THE REVISED INERTIA**, per his standing ruling: every number in
§11 and §12 is read with `brand-inertia-2026-08.md` §14's revision live, and the top of the shelf is
unmoved in that arm – 56,160 / 56,160 career-weeks at the cap, worst |delta| 0 cents.

**⚠ NO SCHEMA MOVE, AND NO NEW FIELD.** The ladder is a constant; the band was already recoverable
from the cheque. `SAVE_SCHEMA_VERSION` stays at 69 and the frozen career hashes are byte-identical on
all three presets – 0 keys of 72 / 72 / 73.

**⚠ Zero draws.** `shootFloorDecayAt` gained an argument, not a stream.
