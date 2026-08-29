---
type: research
status: current
area: economy
canonical: false
last-reviewed: 2026-08-29
---

# What a real WTA woman earns off court – and whether $20,000 a year is a defensible offer

**The comparison round 29 part two #20 asked for.** The owner, having read a Quiet Hour letter in a
career sitting at world #21:

> «предлагать контракт за 20к долларов на год для 100 и выше ракетки мира выглядит весьма
> сомнительно, как мне кажется, **поправь меня, если я ошибаюсь пожалуйста**.»

He invited correction, so this is a comparison and not an agreement. **Every number below is
tagged.** `[S]` = stated in the cited source, read here rather than quoted from a summary of it.
`[I]` = inferred or computed here from sourced inputs, with the arithmetic shown. `[GAP]` = looked
for and not found; a stated gap is worth more than a plausible invention. `[WEAK]` = a figure that
circulates but whose trail ends at an aggregator rather than at a primary source.

---

> **THE ANSWER IN ONE PARAGRAPH.** **He is right, and the research says so more sharply than he
> did – but the number is not the defect.** $20,000 a year is a defensible non-endemic fee at the
> BOTTOM of the professional ladder, where the game first offers it: at WTA ~#150–200 a real woman
> grosses $226k–$358k of prize money against $53k–$105k of touring costs, so a $20,000 cheque is a
> fifth to two fifths of what it costs her to be there – felt, not solving. **And the line he named
> is the line the game's own budgets cross**: the cheque is a quarter of a season's costs from #200
> up to about #100, and 13% the moment she is inside the top hundred. What is indefensible is
> that the SAME $20,000 was still the only offer at #21, because `ECONOMY.advertising` had a floor
> (`maxWtaRank: 200`) and **no ceiling at all**. In the real sport that is precisely backwards: the
> off-court curve is not flat and is not even ordered by ranking – the woman with the second-largest
> endorsement income of 2025 was the **thirtieth**-largest prize-money earner, at **$21M off court
> against $1.6M on it**. His «весьма сомнительно» is about the top of a ladder that did not exist.

---

## 1. What the game was offering, before this wave

One row. That is the whole of the list he asked to see in #19.

| brand | what it is | gate | pays | term | costs her |
| --- | --- | --- | ---: | ---: | --- |
| Quiet Hour | a watchmaker | age 18+, WTA ≤ 200, **no upper bound** | $20,000 once, on signature | 52 weeks | 2 shoot weeks |

`ECONOMY.advertising`'s own comment said so out loud – *«The bigger asks – campaigns 3-4, global
houses 5-6, a cap of 6 a year – are RECORDED in the plan doc only and deliberately not built: this
catalogue has one house»* – and its gate comment defended the missing ceiling on the plan's §3
reasoning: *«there is deliberately no UPPER cutoff: a top-10 girl still qualifies, her cheque is
simply noise, which is §3's claim and not a bug»*.

⚠ **And the sizing was done for a different girl.** The same comment sized $20,000 as *«about 31% of
Alice's-stage ANNUAL outgoings ($64,000)»* – one career, read off the plan's §3 table – and noted
that at a later stage it is *«8% of her interest alone – noise»*. Measured across 108 careers x 780
weeks (`tools/sponsor-ladder-reach.ts`), the median annual outgoings of a season spent in that band
are **$100,435**, not $64,000, so the shipped rung was really **one fifth** of its stage's budget –
and 23.1% of it after the rest of this wave landed (§5). That share, whichever reading, is what the
new ladder is built from.

---

## 2. The top of the real ladder, with the on/off-court split

**Forbes, *The World's Highest-Paid Female Athletes 2025*, published 16 December 2025** – earnings
over the trailing twelve months, before taxes and agents' fees. The full table with the split is
reprinted by Women's Tennis Blog (18.12.2025); the WTA's own report carries the same headline
figures. Every tennis row `[S]`:

| Forbes rank | player | total | on court | **off court** | off:on |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | Coco Gauff | $33M | $8M | **$25M** | 3.1 |
| 2 | Aryna Sabalenka | $30M | $15M | **$15M** | 1.0 |
| 3 | Iga Swiatek | $25.1M | $10.1M | **$15M** | 1.5 |
| 5 | Zheng Qinwen | $22.6M | $1.6M | **$21M** | **13.1** |
| 6 | Madison Keys | $13.4M | $4.4M | **$9M** | 2.0 |
| 8= | Naomi Osaka | $12.5M | $2.5M | **$10M** | 4.0 |
| 8= | Elena Rybakina | $12.5M | $8.5M | **$4M** | 0.5 |
| 10 | Jessica Pegula | $12.3M | $5.3M | **$7M** | 1.3 |
| 12 | Amanda Anisimova | $11.3M | $7.3M | **$4M** | 0.5 |
| 17 | Jasmine Paolini | $8.3M | $5.3M | **$3M** | 0.6 |

The list's cutoff is $8.1M in total earnings (Ilona Maher, 20th) `[S]`, so it reaches only as far as
roughly the world's top ten players and **says nothing at all about anybody below them**.

⭐ **THE OFF-COURT COLUMN IS NOT ORDERED BY THE ON-COURT ONE, AND THAT IS CHECKABLE AGAINST A SECOND
PRIMARY SOURCE.** The WTA's own prize-money list (§3) gives each of these women's actual 2025 season
earnings, and Forbes' on-court figures match it to within a rounding `[I]`:

| player | Forbes on-court | WTA prize-money list | her place on that list | off court |
| --- | ---: | ---: | ---: | ---: |
| Zheng Qinwen | $1.6M | $1,574,548 | **30th** | **$21M** |
| Naomi Osaka | $2.5M | $2,505,892 | 14th | $10M |
| Elena Rybakina | $8.5M | $8,456,632 | 3rd | $4M |

**The 30th-best earner on court was the 2nd-best off it, and the 3rd-best on court was 7th off it.**
`[I]` from two `[S]` sources. This is the plan doc's own claim – *«a photogenic #40 with a story can
out-earn a dour #8»* (`the-face-and-the-court.md` §2) – measured rather than asserted, and it is the
strongest argument in this file for why an advertising ladder is worth having at all.

---

## 3. The on-court scale at every depth of the tour – a primary source

**WTA Prize Money Leaders, official PDF, printed 10 November 2025**
(`https://wtafiles.wtatennis.com/pdf/rankings/PrizeMoney/prize_money_2025.pdf`), read directly `[S]`:

| place on the list | player | singles | total (incl. doubles/mixed) |
| ---: | --- | ---: | ---: |
| 1 | Sabalenka | $15,008,519 | $15,008,519 |
| 10 | Mertens | $1,399,320 | $2,895,029 |
| 20 | Muchova | $2,004,280 | $2,119,265 |
| 25 | Errani | $115,392 | $1,887,136 |
| 50 | Putintseva | $1,032,902 | $1,153,738 |
| 100 | Bondar | $667,747 | $715,098 |
| 150 | Stollar | $358,362 | $358,362 |
| 200 | Aoyama | $226,212 | $226,212 |

⚠ **THIS IS A PRIZE-MONEY LIST AND NOT THE RANKING, AND THE DIFFERENCE MATTERS TWICE.** Position *N*
here means "the *N*th-largest earner of the season", which tracks the ranking but is not it – and the
doubles column pulls specialists up it (Errani is 25th on $115k of singles money). Where this file
says "at about #150" it means "at about the depth of the tour where a season is worth ~$358k", which
is the honest reading and the one the comparison needs.

**Costs, from the repo's own sourced file** (`docs/research/02-tennis-economics.md`): touring costs
**$53–105k/yr**, USTA's full-team estimate $143k/yr, ITF 2013 solo ~$39k; break-even ranking ≈ #150
(Schoettl et al.) `[S]`.

---

## 4. What a non-endemic brand actually pays below the top ten – the gap

⚠⚠ **`[GAP]` – NO PUBLISHED NON-ENDEMIC CONTRACT VALUE EXISTS FOR ANY WTA PLAYER OUTSIDE ROUGHLY THE
TOP 25.** This is the single most important finding in the file and it is a negative one. Searched:
Forbes' annual lists (they stop at the top ~10 of the sport), the WTA's own releases, Sportico's
tennis earnings tables, the ITF's Pro Circuit reporting, and the trade press. Nothing gives a figure
for the #26–#200 band.

What circulates instead:

* **`[WEAK]` "outside the top 100: around $50,000–$200,000 a year".** Quoted by Tennisnerd, sourced
  to an aggregator (CapitalRally). ⚠ And read carefully it is **not about this mechanic at all**: the
  same passage says those deals are *"mostly restricted to providing equipment and apparel"* – which
  is the ENDEMIC kit ladder the game already models, rung for rung, and not a house paying cash for
  a face.
* **`[WEAK]` "ranked 20–50: $3–8M annually".** Same aggregator, same chain of quotation, and
  irreconcilable with §3's primary figures – the 20th-largest earner on the WTA's own list made
  $2.1M in total, so an $3–8M endorsement floor for that band would make her earnings two to four
  times what the sport's own accounts show. Recorded here as circulating, and not used.
* **`[WEAK]` One named case in the band, and it is the exception that proves §2's point.** Eugenie
  Bouchard is reported at $6.2M of 2016 earnings on **$0.7M of prize money** – ~$5.5M of endorsements
  in a season she did not finish anywhere near the top ten. ⚠ Tagged `[WEAK]` deliberately: the
  figure reaches this file through secondary reporting of a Forbes list I could not open, and her
  exact year-end ranking is not established here. It is offered as a shape (fame outruns ranking),
  never as a number, and nothing in the catalogue is sized from it.

**What CAN be sourced about the shape of such a contract**, from a sports-law drafting reference for
endorsement agreements (uslegal.com) `[S]`: compensation is *"a base fee … upon execution of this
Agreement"*, and the athlete's obligation is counted in appearances and shoot days – *"Athlete shall
make (number) personal appearance (not to exceed (number) hours)"*, with additional appearances
priced per day and *"subject to Athlete's sole approval"*. A commonly-cited template figure is four
public appearances plus two photo sessions a contract year, and 12–20 service days a year for a
large deal `[WEAK]`.

⭐ **That is the game's own model, independently arrived at**: one fee on signature, a fixed count of
shoot obligations named in the paper, and nothing owed beyond them. `AdOfferTerms` is `cashCents` +
`shootCount` + `shootWeeks`, and the letter's closing line – *"Beyond those weeks nothing is owed"* –
is the real clause.

---

## 5. The verdict on #20, in the game's own arithmetic

The sizing principle the shipped comment already used: **a rung is a share of the OUTGOINGS of the
stage it opens for.** Measured across 108 careers x 780 weeks (median annual outgoings of a season
spent in the band, `tools/sponsor-ladder-reach.ts`):

| band | median annual outgoings | $20,000 is | verdict |
| --- | ---: | ---: | --- |
| WTA 151–200 | $84,738 | 23.6% | ⭐ defensible |
| WTA 101–150 | $80,696 | 24.8% | ⭐ defensible |
| WTA 51–200 (the shipped rung's whole band) | $100,435 | **19.9%** | ⭐ defensible – what the rung was written for |
| WTA 51–100 | $149,582 | 13.4% | thin |
| WTA 21–50 | $240,164 | 8.3% | ⚠ thin |
| WTA 11–50 | $254,972 | 7.8% | ⚠ thin |
| WTA 1–10 | $348,855 | 5.7% | ⚠⚠ noise – and it was the only offer she would ever get |

⚠ **These are the PRE-WAVE medians and they are kept because they are what the verdict was reached
against.** Items #5 and #12 of the same wave reduced them – a career that can now be written to by
`premium` and `icon` mid-contract gets half to three quarters of its fares paid – so the shipped
catalogue is sized against the post-wave figures ($86,474 / $173,210 / $240,343, in
`ECONOMY.advertising.houses`). The verdict does not turn on which set is used: $20,000 is a fifth to
a quarter of a season's costs at the bottom of the band on either, and single digits at the top on
either.

⭐⭐ **AND HIS INSTINCT IS RIGHT TO THE RANK HE NAMED.** He wrote «для 100 и выше ракетки мира», and
the line between «real money» and «thin» is crossed **at almost exactly WTA #100**: the cheque is 24–25% of a
season's costs from #100 down to the gate at #200, and 13% the moment she is inside the top 100.
That boundary was not looked for – the bands were split evenly before the numbers were read.

And the real-world reading of the same three lines, from §2 and §3 `[I]`:

| band | a season on court | a season's costs | $20,000 against that |
| --- | ---: | ---: | --- |
| ~#150–200 | $226k–$358k `[S]` | $53–105k `[S]` | 19–38% of costs – real money |
| ~#20–50 | $1.15M–$2.1M `[S]` | $200k+ `[I]` | under 10% of costs |
| top 10 | $2.5M–$15M `[S]` | – | against $3M–$25M of actual endorsements `[S]` – a rounding error |

**So: he is right, and the correction is only that the number he questioned is not the thing that is
wrong.** At the #100–200 he cites the fee is defensible and the research does not contradict it; from
roughly #100 up it stops being defensible – and there was nothing above it, because the catalogue had
no second row and no ceiling. His «весьма сомнительно» is about the top of a ladder that did not
exist, and the fix is to build it rather than to move the one number the sources leave standing.

⚠ **THE FIX IS THEREFORE A LADDER AND NOT A RETUNE, AND $20,000 DOES NOT MOVE BY A CENT.** See
`ECONOMY.advertising.houses`: three rungs each at the BOTTOM rung's own realised share of their
band's measured outgoings – **$20,000 / $40,000 / $55,000**, i.e. 23.1% / 23.1% / 22.9% – gated at
the kit ladder's own professional cuts (WTA 200 / 50 / 10), asking 2 / 4 / 6 shoot weeks, which is
the plan doc's own recorded ladder and its own annual cap. ⭐ Sized the other way round, as a price
per week of her season, the same three rungs come out at $10,000 / $10,000 / $9,167 – two
independent readings landing within 8% of each other.

⚠⚠ **AND THE GAME DELIBERATELY DOES NOT COPY THE REAL CURVE.** §2's table is violently convex: at
the top, off-court money is one to thirteen times on-court money, and a faithful model would hand a
top-ten career eight figures and end the economy. A constant share of the stage's outgoings is the
game's answer instead – **every rung is the same 23% of the budget it arrives against**, so the
mechanic is equally felt at 19 and at 27 without ever solving the endgame. That is a design decision
made against this research rather than in ignorance of it, and it is written down here so the next
person to read the Forbes table does not "correct" it back.

---

## Sources

* [Forbes, *The World's Highest-Paid Female Athletes 2025*](https://www.forbes.com/sites/justinbirnbaum/2025/12/16/the-worlds-highest-paid-female-athletes-2025/)
  – the split table as reprinted by [Women's Tennis Blog](https://womenstennisblog.com/2025/12/18/forbes-top-earning-female-athletes/)
  and reported by [wtatennis.com](https://www.wtatennis.com/news/4421376/coco-gauff-is-forbes-2025-highest-paid-female-athlete-for-second-straight-year).
* [WTA Prize Money Leaders, official PDF, 10 November 2025](https://wtafiles.wtatennis.com/pdf/rankings/PrizeMoney/prize_money_2025.pdf).
* [Drafting suggestions for an endorsement contract – uslegal.com sports law](https://sportslaw.uslegal.com/sports-agents-and-contracts/endorsement-and-appearance-contracts/drafting-suggestions-for-an-endorsement-contract/).
* [Tennisnerd, *The role of sponsors in modern tennis*](https://www.tennisnerd.net/articles/the-role-of-sponsors-in-modern-tennis/65929) – `[WEAK]`, the band figures and their onward citation.
* `docs/research/02-tennis-economics.md` – touring costs, break-even ranking, junior equipment deals.
* `tools/sponsor-ladder-reach.ts` – the game's own outgoings and reach measurements.
