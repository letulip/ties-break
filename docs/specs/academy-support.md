# The academy scholarship (schema v21)

Somebody else starts paying for the plane tickets.

## Why

Phase 4 gave her a development curve, and the bench immediately showed what that costs a family.
Once she starts getting better she starts qualifying for the international ladder, and a J30 trip is
$900–2000 against a $60–120 local. Over 14→18, the working family survived **18 careers in 120**.
Getting good is what bankrupted them.

The owner named the fix himself (28.07): «у нас на пути помощь академий для талантливых и играющих с
частичной компенсацией поездок и экипа (шараповой же давали в юниорстве)». It is also what really
happens in junior tennis – academies fund the prospects they want, and a family with no money and a
real prospect is exactly who gets funded.

## What the academy looks at

Once a year, at the season boundary, on the rank she carries in.

| input | what it is | why |
| --- | --- | --- |
| results | her dense rank at the review, over `[rankFull, rankNone]` | the earned, visible half – it makes the scholarship something to play FOR |
| the scout | her ceiling (mean of the four potentials) over `ceilingBand` | academies fund potential; this is the one place her hidden ceiling leaks into the world, and an offer is the first honest read on it the player ever gets (decisions.md #11) |
| need | family background: working 1, middle 0.6, wealthy 0 | «не проигрывающего, а малоимущего, но талантливого» |
| that she plays | tournaments in the last 52 weeks ≥ `minEventsPerYear` | nobody funds a prospect who does not compete |

`level = (scoutWeight · scout + (1 − scoutWeight) · results) · need`, zero below `minLevel`.

**Current balance is deliberately NOT an input.** A scholarship that keys off the bank balance pays
the player to run themselves broke, which turns a support mechanic into an exploit.

**A size, not a switch** – the owner's stated preference («регулировать размер помощи – вот это мне
кажется лучше»). One continuous level scales both halves of the help, so the middle of the
distribution gets a middling scholarship instead of a cliff at some threshold.

**Annual, not weekly.** A weekly test on a rank that wobbles would flicker the scholarship on and off
in the ledger. A real academy reviews you once a year, and that makes the verdict a beat: the player
has a season to aim at it.

## What it pays

- **Travel** – `level × travelCover` of every trip, taken off the travel line itself (the racket
  sponsor's shape), so the ledger shows what the family actually paid. Travel is the bill that breaks
  them: $18k over 14→18 for the working preset, against a $5.7k horizon deficit.
- **Kit** – «и экипа» – `kitCentsAtFull × level` once per review, as real money under a new `academy`
  income category. Money rather than a per-purchase discount because it arrives as a delivery, once a
  year, not as a coupon.

`travelCostFor(world, event)` is THE one definition of what a trip costs. The charge, the refund
(`skipEvent`) and the price the planner quotes all read it. If any of them computed its own number
the discount would be arbitrageable: enter at the covered price, withdraw at the full refund, repeat
for every J30 on the calendar.

## Measured (120 seeds per preset, 14→18)

| preset | survived | entries | j30 | travel covered |
| --- | --- | --- | --- | --- |
| 8k working · before | 18/120 (15%) | 64.8 | 18.0 | – |
| 8k working · after | **44/120 (37%)** | 72.3 | 24.4 | $5,318 |
| 25k middle · before | 94/120 (78%) | 78.2 | 27.8 | – |
| 25k middle · after | **114/120 (95%)** | 79.1 | 28.9 | $4,284 |
| 120k wealthy | 119/120 (unchanged) | – | – | never backed |

The relief converts into **career, not savings**: about 8 more tournaments over the horizon and 6
more J30s on the same money. Reach (82/120) and rank (~#114) barely move, which is the honest
reading – a scholarship buys her the chance to compete, it does not make her better.

Backed at some point: 113/120 working careers, 95/120 middle, 0/120 wealthy. Near-universal
eligibility with widely varying size is the design, not an accident – see "a size, not a switch".

## Not fixed here

- **25k middle + hired coach still dies in 120 careers of 120, at week 61.** That family's problem is
  a $572/week coach, not the plane tickets. Covering travel cannot and should not rescue it.
  **Owner's ruling (29.07): this is not a balance bug and gets no patch here.** It closes when the
  coach becomes a ladder of tiers at different prices instead of one all-or-nothing hire, and when
  the weekly training split feeds the coaching bill as well as the development rate – a family that
  cannot afford a full week of a good coach should be able to buy less of one. Until then the preset
  is honestly reporting that a middle income cannot carry a top coach at full load.
- **The cohort does not renew.** Mean rival age walks 16→26 and keeps going; nobody retires, nobody
  arrives. This is the junior conveyor in `living-field.md`, and it is now the binding constraint on
  the field feeling alive.
- **Her rank sits near #100 whatever her power does.** Wants its own look once the field renews.

## Later slices this opens

- **Academy training**, not just academy money: a coach tier that comes with the scholarship. The
  owner's brief was financial support, so this slice stays financial.
- **Revocation with notice** – Phase 5's «federation grants — conditional & revocable». Today a
  scholarship ends at a review with an explanation; a season of warning would be crueller and better.
- **A choice to accept.** Today it simply arrives. A real academy offer costs something (relocation,
  school, the parent's job) and the owner's Phase 6 prologue already has a "relocation/academy
  gamble" in it.
