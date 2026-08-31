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
