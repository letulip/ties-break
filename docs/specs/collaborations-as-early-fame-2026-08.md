---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-31
---

# Collaborations as the early lever on fame

**Status: DRAFT FOR THE OWNER'S REVIEW. Nothing is built.**

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
