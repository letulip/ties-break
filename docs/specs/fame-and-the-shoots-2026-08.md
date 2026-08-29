---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-29
---

# Fame, and the shoots that buy it (29.08.2026)

**His design, in his own words**: «нам важны разные спонсоры и их появление как можно раньше в плане
фотосессий и их количества – **это прямой рычаг известности**. Можно попробовать для этого какую-то
измеримую механику и четкий механизм сделать.»

⚠ Nothing here is built. This is the proposal he asked for; every number is movable and his.

---

## 1. Why this is the missing piece, and not another income line

Two findings from this round point at the same hole from opposite sides:

- **The 2024 census**: off-court money is **not ordered by ranking** – the 30th-best prize-money earner
  was the 2nd-best endorser, the 3rd on court was 7th off it
  ([off-court-money.md](../research/off-court-money.md)).
- **Our advertising ladder gates on `maxWtaRank`** – rank is the only axis we had, so we used it, and
  the model therefore cannot produce the thing the census describes.

⭐⭐ **His answer is the right axis: fame, and shoots are how a player buys it.** That makes off-court
money a CHOICE rather than a consequence of the ladder, which is what the research says it is.

## 2. ⭐⭐⭐ The loop already has its cost – only the reward is missing

Round 29 #3/#6 shipped the price of a shoot without anything on the other side:

* a shoot week takes her free days (`accrueCondition` keeps her sessions and forfeits the rest);
* a shoot landing on a tournament week raises a **four-way decision**, and playing through it costs
  **7 condition** – his own figure, 1 a day across the week.

**So the trade is already live: fame is paid for in condition, and condition is what wins matches.**

⭐⭐⭐ **That is a real decision and the game has not had one like it** – be good, or be known. And it is
exactly why the #30 on court can be the #2 off it: she did the work off court and paid for it on.

## 3. The mechanic

**`fame`: a stock, 0–100, ACCOUNTED and never drawn.**

⚠⚠ It must be a pure function of what has already happened – no RNG at all, so RNG
input-independence (the permanent law, capture 41550 / `e6b0c709`) is not merely respected but
unreachable. **Fame is bookkeeping, not a roll.**

It rises from two sources, and the split is the design:

| source | who controls it | shape |
| --- | --- | --- |
| **shoots completed** | ⭐ **the player** – this is the lever he asked for | each shoot adds a fixed step |
| **results that the world notices** | nobody – it is earned on court | a Slam final, a title at 1000+, a first top-10 season |

And it **decays slowly** while neither happens: fame is a rolling memory, not a trophy. ⚠ Decay is
what makes it a lever – a stock that only rises is a rank by another name.

## 4. What it drives

1. **Which advertising houses write.** ⭐ Replaces `maxWtaRank` as the gate. A #60 who has done twelve
   shoots hears from houses a #20 who has done none does not – which is the census, modelled.
2. **The size of the cheque**, inside a house's own band.
3. **Merch** (his P4) – the parent's first business rung, and the one that follows fame rather than
   ranking, keeping it a different instrument from the academy, which follows seasons-in-band.

## 5. Open, and his

| | the question |
| --- | --- |
| **the step** | how much fame does one shoot buy, against a Slam final |
| **the decay** | how fast does the world forget – a season? three? |
| **the floor** | ⚠ does a career that never shoots stay at zero fame, or does winning alone carry her? **The honest answer is that winning alone should carry her a long way** – Świątek is not famous for photo shoots – so the shoot lever should be a MULTIPLIER on a floor she earns on court, not the only road |
| **the cap** | is fame bounded at 100, and what does the top of it mean |

## 6. What this does NOT fix

⚠ **It does not close the shop gap.** The reachability measurement is unambiguous: advertising is
**0.67% of a career's money** and the top rung is **4.6% of one year of the yacht's crew**. Fame makes
the advertising ladder *interesting and controllable*; it does not make it *large*. **The shelf is
still bought with prize money, the academy and merch – not with photographs.**
