---
type: research
status: current
area: economy
canonical: false
last-reviewed: 2026-08-08
---

# What a coach and a court really cost

**The calibration target for the coach and facility lines, written after `split-the-bill-2026-08.md`
made the two halves of the bill separable and therefore comparable to anything real.** The owner's
question, verbatim (08.08):

> «Я играю в падел, у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег) и за
> 44+ доллара в час в других местах, есть и дороже всякие элитные корты. Работа тренера на бюджетном
> тире в падел стоит от 10 долларов в час и дальше. Давай пожалуйста приведем стоимости тренеров и
> кортов к этой системе, по крайней мере до проф карьеры… А еще меня очень интересует реальная
> стоимость разных тиров тренеров за неделю при нашей загрузке в часах, давай тоже проанализируем и
> причешем.»

**Every number below is tagged.** `[P]` = **primary** – first-hand, from the owner, who plays the
sport and pays these prices. `[S]` = stated in the cited source. `[I]` = inferred or computed here
from sourced inputs, with the arithmetic shown. `[GAP]` = looked for and not found; a stated gap is
worth more than a plausible invention. `[M]` = measured off our own engine by
`npx vite-node tools/coach-court-price.ts`, which reads the shipped functions, so the tables move when
the constants do.

**Scope: up to the professional career**, his words. §7 records the seam past it and does not build it.

## Current truth

> **(1) OUR CHEAP END WAS ALREADY RIGHT, AND HE CONFIRMED IT TWICE WITHOUT MEANING TO.** His 29.07
> price research put a Budget coach at **$30/h** at 12–16. His 08.08 figures, in a different framing
> ten days later, put the court at **$22/h** and Budget coach labour at **"from $10/h"** – which sums
> to **$32/h**. Two independent statements, 7% apart, and our engine sits between them: $20 court +
> $10 labour = $30 total, at the middle corridor. **The defect was never the price. It was that
> nobody could see it, and the bill split has just fixed that.** No correction is manufactured here.
>
> **(2) THE FLAT COURT WAS REAL AND WORSE THAN THE BRIEF GUESSED. THE OWNER HAS RULED, AND THE FIX
> COST NOTHING.** The court took no rung argument at all: an Elite coach worked on the same court as a
> self-coaching parent, and the only things that moved it were her age and the corridor. Its whole
> end-to-end spread was **x1.86** (not the x1.7 estimated before measuring) and **within one family it
> was x1.00** – flat. Against that, the narrowest real single-city spread found is **x5.1** (Sydney, one
> municipal operator) and the widest is **x16.7** (New York, $15 public clay to $250 indoor prime).
> Two independent things said a flat court could not survive: a published **single-venue coach ladder is
> only x1.13–1.43 wide**, so our x4.0 rung ladder is four *venues* rather than four colleagues; and the
> owner's own $22 / $44+ is, to the dollar, one real venue's own published court card.
> **His ruling: «более дорогой тренер = более дорогой корт», and «наши цифры подходят» – so the court
> climbs with the rung and the totals do not move.** The court now runs x1.0 / 1.0 / 1.2 / 1.9 / 2.4 up
> the ladder, **x2.40 inside one corridor and x4.46 end to end**, measured at **zero** survival cost –
> 538 bankruptcies of 1,620 before and after. `docs/specs/court-follows-the-coach-2026-08.md`.
> ⚠ **One cell his rule cannot reach:** `budget`. Its whole bill is $30/h and $20 is already the court,
> so lifting it even to his own $22 would leave the cheapest Budget coach in the game **$2/h**. It shares
> the club court with `self`, and that is arithmetic rather than a shortcut.
>
> **(2b) AND HIS ONE CHECKABLE CLAIM IS THE ONE THAT FAILS – in our favour.** *«теннисные стоят похожих
> денег»*. At every venue publishing both on one card, **padel is dearer per court-hour than tennis**,
> x1.00 to x3.83. So a tennis court for the 1-on-1 hour our engine bills is at or **below** his padel
> figures. His $22 is a safe upper bound for the cheap end, which makes our $20 a better fit for tennis
> than it was for the sport he quoted it from.
>
> **(3) THE WEEKLY NUMBER IS BIG, AND IT IS BIG IN THE RIGHT PLACES AND FOR THE WRONG REASON.** At
> five hours a week an Elite coach costs a middle family **141%** of everything it puts into tennis
> and `high` costs **94%**. **The size is right and it is sourced twice.** Our 23+ Elite rung bills
> $1,000–1,250 a week against Forbes' published **$1,000–2,500/wk** for the coach of a player ranked
> 25–75; and IMG Academy's own 2026-27 rate card is **$95,900–99,900** against a US median household
> income of **$83,730** – so a full-time academy place really does cost **119%** of a median
> household's whole pre-tax income, and **289%** of a 20th-percentile one. What is *not* right is that
> **nothing in the game subsidises this line.** The academy scholarship pays 75% of *travel* and a kit
> grant; a sponsor covers *equipment*. Meanwhile the USTA reimburses **training costs** up to
> ~$20,000/yr, the Federación Cántabra pays **the coach on invoice and never the family**, and an
> academy scholarship is by definition remission of **tuition** – coaching plus court. So the one bill
> that breaks the family is the one bill no support in the game touches, and the working family, whose
> `needFactor` is already 1, is the one that notices. **That is the finding worth the owner's
> attention, and it is not a pricing bug.**

---

# THE WEEKLY TABLE – his second question, answered first

> «меня очень интересует реальная стоимость разных тиров тренеров за неделю при нашей загрузке в часах»

**Balanced plan – five hours a week**, which is `sessionsByTrain`'s middle anchor at `plan.train` 75.
Light is four hours and grind is six, so the whole table scales by 0.8 and 1.2. Every figure is the
quote at the corridor's midpoint; a real week lands ±8% of it (`weekJitterBps`). **`coach + court` is
the total** – the two ledger lines the family now sees. `[M]`, `tools/coach-court-price.ts`.

**AGE 14 – the 12–16 development row**

| rung | working: coach + court = total | share | middle: coach + court = total | share | wealthy: coach + court = total | share |
| --- | --- | --- | --- | --- | --- | --- |
| self | $0 + $75 = **$75** | 31% | $0 + $100 = **$100** | 24% | $0 + $125 = **$125** | 17% |
| budget | $38 + $75 = **$113** | 46% | $50 + $100 = **$150** | 35% | $63 + $125 = **$188** | 25% |
| middle | $98 + $90 = **$188** | 77% | $130 + $120 = **$250** | 59% | $163 + $150 = **$313** | 42% |
| high | $158 + $143 = **$300** | **122%** | $210 + $190 = **$400** | **94%** | $263 + $238 = **$500** | 67% |
| elite | $270 + $180 = **$450** | **184%** | $360 + $240 = **$600** | **141%** | $450 + $300 = **$750** | **100%** |

**AGE 18 – the 17–22 pro row**, against the income that family has by then (four seasons of 5–10%
compounding, **+34%** on average: $328 / $569 / $1,003 a week)

| rung | working | share | middle | share | wealthy | share |
| --- | --- | --- | --- | --- | --- | --- |
| self | $0 + $83 = **$83** | 25% | $0 + $110 = **$110** | 19% | $0 + $138 = **$138** | 14% |
| budget | $49 + $83 = **$131** | 40% | $65 + $110 = **$175** | 31% | $81 + $138 = **$219** | 22% |
| middle | $126 + $99 = **$225** | 69% | $168 + $132 = **$300** | 53% | $210 + $165 = **$375** | 37% |
| high | $218 + $157 = **$375** | **114%** | $291 + $209 = **$500** | 88% | $364 + $261 = **$625** | 62% |
| elite | $402 + $198 = **$600** | **183%** | $536 + $264 = **$800** | **141%** | $670 + $330 = **$1,000** | **100%** |

**AGE 24 – the 23+ peak row**, against income after ten seasons (**+106%**: $505 / $877 / $1,547 a week)

| rung | working | share | middle | share | wealthy | share |
| --- | --- | --- | --- | --- | --- | --- |
| self | $0 + $90 = **$90** | 18% | $0 + $120 = **$120** | 14% | $0 + $150 = **$150** | 10% |
| budget | $60 + $90 = **$150** | 30% | $80 + $120 = **$200** | 23% | $100 + $150 = **$250** | 16% |
| middle | $136 + $108 = **$244** | 48% | $181 + $144 = **$325** | 37% | $226 + $180 = **$406** | 26% |
| high | $279 + $171 = **$450** | 89% | $372 + $228 = **$600** | 68% | $465 + $285 = **$750** | 48% |
| elite | $534 + $216 = **$750** | **148%** | $712 + $288 = **$1,000** | **114%** | $890 + $360 = **$1,250** | 81% |

### The five things this table says, in the order they matter

1. **Only `self`, `budget` and `middle` are payable out of income at every corridor.** `high` breaks the
   working family at **122%** and is borderline for the middle one at **94%**; `elite` breaks everyone
   except the wealthy family, and even there it takes **exactly 100%**.
2. ⚠⚠ **THE AGE-BAND STEP EATS THE INCOME GROWTH, AND AT THE TOP IT EATS ALL OF IT.** Income rises
   **+34%** over four seasons; the Elite rate row rises $120 → $160 = **+33%**, so an Elite career's
   share is **141% at 14 and 141% at 18 – frozen to the point.** The relief is real below (self 24→19%,
   budget 35→31%, middle 59→53%, high 94→88%) because those age steps are gentler (+10/+17/+20/+25%).
   **The higher the rung, the more completely the family's growth is cancelled** – the opposite of the
   direction «вклад родителей приростал процентов на 5-10» was bought for. Neither half is wrong; nobody
   had put them side by side.
3. **By age 24 the arithmetic finally turns**, because income has doubled (+106%) while the 23+ rate row
   only added another 25%: `high` falls to 68% for a middle family and `elite` to 114%. **A career that
   survives to the peak years stops being unaffordable** – which is the right shape, and it is worth
   knowing that the relief arrives at 24 and not before.
4. **The court is between 40% and 100% of the bill at the three payable rungs** and 24–48% at the top
   two. At `self` and `budget` – the only rungs a working career really shops at – it is 67–100%. So
   for the poorest family in the game, **the room is the expense and the coach is the rounding.**
5. **The totals are the owner's own accepted levels** («наши цифры подходят») and no figure above moved
   when the court stopped being flat. What moved is where the `=` sign's left-hand side splits.

---

## 1. The owner's own figures – primary data, and the one claim in them worth checking

| what | figure | tag |
| --- | --- | --- |
| padel court, his cheap club | **$22/h** | `[P]` |
| padel court, other venues | **$44+/h** | `[P]` |
| padel court, elite venues | dearer still, unquantified | `[P]` |
| tennis court hire | *"стоят похожих денег"* – comparable to padel | `[P]`, and the claim tested in §2 |
| padel coach labour, budget tier | **from $10/h upwards** | `[P]` |

This is primary data and it outranks a rate card from a city he does not live in: he is the customer,
these are transactions he has made, and the currency is dollars because that is how he quoted them.
Two things about it are worth stating so it is not over-read.

**"From $10/h" is the floor of a range, not a midpoint.** Our Budget band's midpoint is exactly $10/h
of labour and its *bottom* is $4/h `[M]`. If he means "$10 is the cheapest coach that exists", the
bottom half of our band is under the real market. If he means "$10 is what a budget coach costs", we
are exactly right. **That is one sentence for him to answer and it is asked in §7.**

**The court and the coach were quoted in different frames.** His court figure is a court-hire rate –
what a venue charges for the room. His labour figure is explicitly *"работа тренера"*, the man's own
time. Our `ECONOMY.coach.hourlyRateCents` is the **sum of the two**, which `coach-tiers.md` §3 ruled
and `split-the-bill-2026-08.md` kept. §3 below is about whether the real market quotes it that way.

---

## 2. What a court really costs

**No currency is converted.** Every figure is as published. Where a venue prices a 90-minute or
30-minute slot, the hourly figure is tagged `[I]` with the division shown.

### 2a. Tennis court hire, by tier

| rate | unit | venue | city | in/out | tag |
| --- | --- | --- | --- | --- | --- |
| **£2.90** | /h | Sanders Park (Bromsgrove DC), 2025/26 tariff | Bromsgrove | outdoor, daylight | `[S]` |
| £4.00 / £6.00 | /h off-peak / peak | Tower Hamlets Tennis | London | outdoor | `[S]` |
| £5.45 / £8.30 / £14.10 | /h off-peak / peak / floodlit | Hackney Tennis, from 04.2025 | London | outdoor | `[S]` |
| £11.10 adult / £6.70 concession | /h | Queen's Park, City of London, FY25-26 | London | outdoor | `[S]` |
| £19.20, up to £26.85 floodlit | /h | Hyde Park (Royal Parks), 01.2025 | London | outdoor | `[S]` |
| £14.85 / £12.75 | /h non-member / member | Islington Tennis Centre | London | outdoor floodlit | `[S]` |
| **£40.00 / £35.50** | /h non-member / member | Islington Tennis Centre | London | **indoor** | `[S]` |
| $5.00 / $6.25 | /h resident / non-resident | Raleigh Parks & Rec | Raleigh NC | outdoor | `[S]` |
| $10–12 resident / $16–20 non-resident | /h non-prime / prime | Goldman TC, Golden Gate Park, eff. 07.2026 | San Francisco | outdoor | `[S]` |
| $16.00 | /h | Amy Yee TC and Seattle outdoor courts, 2026 | Seattle | outdoor | `[S]` |
| $33.60 / $36.80 | /h resident / non-resident | Amy Yee TC, 2026 ($42.00 / $46.00 per 1¼ h) | Seattle | **indoor** | `[I]`, ÷1.25 |
| $15 cash / $16 card single play; season permit $100 adult | /h | NYC Parks via Central Park TC, 2026 | New York | outdoor clay | `[S]` |
| $56 / $38 | /h prime / non-prime, public | MIT Indoor Tennis, 2025-26 | Cambridge MA | **indoor** | `[S]` |
| $20 *"split between players"* | /h, members **and** non-members | Wayside Athletic Club, 2025/26 | Marlborough MA | indoor bubble | `[S]` |
| A$45 / A$34 outdoor; A$62 / A$51 indoor; showcourts A$60 / A$55 | /h peak / off-peak | **Tennis World Melbourne Park** (the Australian Open site) | Melbourne | both | `[S]` |
| A$31.20 / A$38.30; concession A$23.40 / A$28.70; Access Card A$7.50 | /h | City of Sydney community tennis | Sydney | outdoor | `[S]` |
| S$3.50 / S$9.50 citizen; S$4.60 / S$12.40 standard | /h non-peak / peak | ActiveSG, page updated 08.2026 | Singapore | outdoor | `[S]` |
| **$132 member / $250 non-member** | /h weekday prime 4–8pm | Roosevelt Island Racquet Club, Fall 2025–May 2026 | New York | **indoor clay** | `[S]` |
| $50 member / $75 non-member | /h non-prime | Roosevelt Island Racquet Club | New York | indoor clay | `[S]` |
| $64.00 / $110.00 | /h member / non-member | Hall of Fame Tennis Club (ITHF), indoor season | Newport RI | indoor | `[S]` |
| **$250** | /h | Hall of Fame Tennis Club – **grass** | Newport RI | outdoor grass | `[S]` |
| $40 hard / $45 clay / **$75 Stadium Court** | /h, resort guests only | La Quinta Resort & Club | La Quinta CA | outdoor | `[S]` |

`[I]` **Indoor runs x1.29 to x3.00 of outdoor** where one card publishes both: Liverpool 1.29,
Gosling 2.42, Lee Valley 2.43, Islington 2.69, Middlesbrough 3.00.
`[I]` **Membership is worth x1.17 to x2.80**, and at Liverpool and West of Scotland Padel members pay
**£0.00** – so "membership roughly halves it" is true at some venues and a 17% difference at others.

### 2b. Padel court hire, and the owner's own comparison tested

| rate | unit | venue | city | tag |
| --- | --- | --- | --- | --- |
| **$140.00 per court / $35.00 per player** | /h (published as $70 / 30 min, "$17.50 per person") | The Padel Courts, Sunset Blvd | Los Angeles | `[I]`, x2 |
| £40 / £58.68 member-peak / non-member-peak; £29.32 / £48 off-peak | /h per court (from £60/£88/£44/£72 per 90 min) | Stratford Padel Club, ©2026 | London | `[I]`, ÷1.5 |
| £30 / £44 off-peak, £44 / £56 peak, £52 / £64 floodlit | /h per court, Member Plus / standard | All Star Tennis, six Wandsworth parks, 2026 | London | `[S]` |
| £6–£9 **per player** per hour | /h per player, member / non-member | Game4Padel Crystal Palace via MATCHi | London | `[S]` |
| £50.00 | /h per court (published £25 / 30 min) | **LTA National Tennis Centre**, Roehampton | London | `[I]`, x2 |
| £12 / £16 / £20 / £24 court, £3 / £4 / £5 / £6 per player | /h, both columns published | Wetherby Padel Club | Wetherby | `[S]` |
| £10 member / £28 non-member | /h per court | Newlands LTC | Glasgow | `[S]` |
| A$40.00 / A$54.50 | /h per court, off-peak / peak | Tennis World North Ryde, MATCHi from 05.2024 | Sydney | `[I]`, ÷1.5 |
| ฿900 off-peak / ฿1,200 peak | /h per court | No Drama Padel | Bangkok | `[S]` |
| ฿500–700 member / ฿1,000–1,200 non-member | /h per court | Bangkok Padel, Sukhumvit 11 | Bangkok | `[S]` |

⚠⚠ **HIS ONE CHECKABLE CLAIM – «теннисные стоят похожих денег» – IS THE ONE THAT DOES NOT HOLD, AND IT
FAILS IN OUR FAVOUR.** At every venue found that publishes both on one card, **padel is dearer per
court-hour than tennis**, from x1.00 to x4.00 `[I]`:

| one operator, one card | tennis | padel | ratio |
| --- | --- | --- | --- |
| Tennis World & Middlesbrough Padel Club, indoor | £24/h | £24/h | **x1.00** |
| the same card, outdoor courts 4–6 | £8/h | £24/h | x3.00 |
| Hazlemere Tennis & Padel Club, non-member | £12/h | £30/h | x2.50 |
| All Star Tennis Wandsworth 2026, off-peak standard | £11.50/h | £44/h | **x3.83** |
| Tennis World AU, peak | A$40/h | A$54.50/h | x1.36 |

**Middlesbrough prices them identically, which is his claim exactly; Wandsworth prices padel at nearly
four times, which is not.** The reconciliation is the unit: padel is priced **per court for four
players** everywhere verified (Wetherby, Stratford, Wrexham, The Club Company and The Padel Courts all
publish per-court and per-player side by side, and every pair is exactly court ÷ 4 `[I]`). Per head
against tennis *singles* the padel premium falls to **x1.91** `[I]` at All Star.

**So a tennis court for a 1-on-1 coaching hour – which is what our engine bills – is at or below his
padel figures, not above them.** His $22 is a safe upper bound for the cheap end and $44+ for the
better one. That makes our $20 a better fit for tennis than it was for the sport he quoted.

### 2c. The spread inside one city, which is the number the brief asked for

`[I]` throughout, from the `[S]` rows above:

| city | cheapest published | dearest published | spread |
| --- | --- | --- | --- |
| **London** (tennis) | £4.00/h, Tower Hamlets, outdoor off-peak | £40.00/h, Islington, indoor non-member | **x10.0** |
| London (any racquet court) | £4.00/h | £58.67/h, Stratford padel non-member peak | x14.7 |
| **New York** | $15/h, NYC Parks single play, outdoor clay | $250/h, Roosevelt Island, indoor clay prime | **x16.7** |
| **Sydney**, one operator | A$7.50/h Access Card | A$38.30/h standard evening | x5.1 |

⚠⚠ **Our whole court range is x1.86 and one family's is x1.00.** The narrowest real metro spread found
is **x5.1**, and that is inside a single municipal operator's own card. The owner's "at least x2" was
conservative about his own market by a wide margin.

### 2d. Two findings nobody asked for and both belong in the model's reasoning

**A coaching hour on a court costs MORE than a social hour on the same court, and councils publish the
surcharge.** Camden Council NSW: casual tennis **A$19.40**/h against *"Casual Coaches"* **A$23.50**/h,
and regular A$16.20 against A$18.40 – **+21.1% and +13.6%** `[I]`. Seattle Parks: an ordinary outdoor
hour is $16.00 and an *"Outdoor Private Lesson"* hour is **$25.00** – **x1.56** `[I]`, on top of which
*"10% of gross receipts are to be paid to the Department"* and the coach must hold a permit and the
department's own certification `[S]`. Shrewsbury Town Council sells a *"Commercial Coaching licence
(excl pitch hire)"* at £145.00 a year `[S]` – the parenthesis being the whole point.

**Several venues price the teaching court as its own line.** Roosevelt Island lists *"COURT 12
(TEACHING COURT)"* separately, at $50 member / $75 non-member off-prime and $79 / $150 prime `[S]`.
Liverpool Tennis Centre unbundles on the face of the card: *"Individual lessons – Prices per hour:
£12.50 Indoor · £7.50 Outdoor · From £17.10 Coach fee"* `[S]` – `[I]` a court share of **30–42%** of
the all-in, which is the same band as Sofia's 43%.

`[GAP]` **Spain and the UAE returned nothing usable**, which is the largest hole here – Spanish
municipal *tarifas* are the likeliest place to find tennis and padel on one official card with
con luz / sin luz bands. `[GAP]` No UK page states in plain words that a court fee is bundled into a
lesson price. `[GAP]` **Queen's Club, Roehampton Club, Royal South Yarra and Kooyong publish nothing** –
verified absence, not a failed search, so the very top of the real court market is unpriced. Padium
and Rocket Padel figures circulating on blogs were checked against the venues' own sites and **do not
exist there**; they are excluded. Los Angeles Rec & Parks, NYC Parks' own page, Ku-ring-gai Council and
David Lloyd are all bot-blocked and were either sourced through an official concession operator or
dropped.

⚠ **Two published contradictions, left unreconciled on purpose.** Seattle's own 2025-26 fee PDF gives
outdoor tennis as $16.00/h on p.8 and $8.25/h on p.19. Lee Valley's live page shows £34.00/£14.00 where
a search index returned £32.50/£13.00 "from 1 April 2026", and Better/GLL pages carry no effective date
at all – so the only defensible label for those is "as published, accessed 08.08.2026".

---

## 3. What a coach really costs, and whether the court is inside the price

**No currency is converted anywhere below.** Every figure is as published, because a conversion with
an unstamped rate is how a sourced number becomes an invented one.

### 3a. The ladder, from published rate cards

| what it is | rate | court? | venue, market, year | tag |
| --- | --- | --- | --- | --- |
| municipal "Tennis Professional" | **$50**/h | not stated | Oak Hollow, High Point NC | `[S]` |
| municipal "Tennis Director" | $60/h | not stated | Oak Hollow, High Point NC | `[S]` |
| club instructor → director, member | $50 / $56 / $62 /h | not stated | Duke Faculty Club, NC, eff. 04.2025 | `[S]` |
| same three, non-member | $58 / $64 / $70 /h | not stated | Duke Faculty Club | `[S]` |
| named coaches, seven of them | $90 … $119 /h | **guest fee extra** | Pure Tennis Academy, Wexford PA | `[S]` |
| pro → high-performance → head → director | $90 / $100 / $110 / $120 /h | not stated | iTennis South Pasadena CA | `[S]` |
| the star on the same card | **$200**/h | not stated | iTennis South Pasadena CA | `[S]` |
| non-head / head / master pro | $160 / $170 / $180 /h | no court line on the card | Central Park Tennis Center, NYC | `[S]` |
| **LTA Level 2**, member | £35/h | not stated | Crawley LTC, GB | `[S]` |
| LTA Level 3+ → Head Coach → Director | £43 / £45 / £50 /h | not stated | Crawley LTC, GB | `[S]` |
| private, all-in | £65/h | **included** | Tennis4London, Clapham Common, 2026 | `[S]` |
| private | €38/h | **included** (court, light, balls) | Escuela Tenis Barcelona | `[S]` |
| private, member / non-member | €25 / €30 /h | court billed separately (€3.50 per 1.25 h) | Club Santa Clara, Sevilla | `[S]` |
| private, adult | A$130/h | **included** | Camperdown Tennis, Sydney | `[S]` |
| **"Hitting Partner (1-on-1 play only)"** | A$100/h | **included** | Camperdown Tennis, Sydney | `[S]` |
| private, single | AED 400/h | court published separately at AED 250/h | CF Tennis Academy, Dubai | `[S]` |
| dev → senior dev → senior perf → head | ฿1,500 / 2,000 / 2,500 / 3,000 /h | **+฿500 court fee** for non-members | KĀHLĪ Academy, Phuket, eff. 07.2026 | `[S]` |
| **Master Trainer**, same card | ฿5,000/h | no court fee added | KĀHLĪ Academy, Phuket | `[S]` |
| **"individual coaching session"** | **€20**/session | **NOT included** | 360 Tennis Club, Sofia | `[S]` |
| **the same session "with court included"** | **€35** | included | 360 Tennis Club, Sofia | `[S]` |
| former ATP/WTA pros, academy directors | **$130–200+**/h | – | TeachMe.To 2026 guide (aggregator) | `[S]` |
| coaches with touring experience | **$150–300**/h | – | TeachMe.To 2026 guide (aggregator) | `[S]` |
| college players, assistant pros, uncertified | $45–75/h | – | lessons.com 2026 (aggregator) | `[S]` |
| marketplace floor, tennis | "from $15"/h US, "from $18"/h AU | – | Superprof (titles only, pages 403'd) | `[S]`, weak |
| marketplace floor, **padel** | **"from $10"**/h US, "from £15"/h UK | – | Superprof (titles only) | `[S]`, weak – **and it is the owner's own floor** |

**The governing bodies, and there are only two.**

* **LTA**, verbatim, undated: *"The average hourly rate for a tennis coach (after paying for court
  fees) in GB is £32. 24% of coaches earn more than £36 per hour, with 7% earning more than £51 per
  hour."* Plus: *"Level 3 coaches tend to earn on average 50% more per hour than Level 2 … Level 4 and
  5 … 27.5% more than Level 3"*, London/SE +20%, and *"Full time coaches earn on average £40,000 per
  year, with … 8% earning over £75,000."* `[S]`
  `[I]` The LTA's own multipliers make a **x1.91 ladder** from L2 to L4/5, x2.30 with London.
* **Tennis Australia, "Recommended coaching rates", August 2010** – award floors A$19.10 (Grade 1
  Junior Development) to A$29.91 (Grade 4 High Performance); guideline salary A$20–30/h junior
  development, A$30–40/h club professional and above; **recommended private charge-out A$60/h inc
  GST** `[S]`. `[I]` A x2.78 gross-up on the Grade 2 award floor.
* `[GAP]` **USPTA, PTR and ITF publish no compensation survey or rate guidance that could be found.**
  Everything attributed to them online is a third-party aggregator. That is a real absence.

**A full-time touring coach**, since our 23+ row is meant to price one:

| band | terms | source | tag |
| --- | --- | --- | --- |
| ranked ~150–450, "the Grinders" | **$500/wk**, no expenses, own airfare, shared rooms | Forbes, Aug 2008 (Brad Gilbert) | `[S]` |
| ranked 25–75, "Movers and Shakers" | **$1,000–2,500/wk** + bonuses + all expenses + ~10% of prize money | Forbes, 2008 | `[S]` |
| top 20 | up to 15% of prize money + bonuses | Forbes, 2008 | `[S]` |
| ranked ~212 (Noah Rubin, 2019) | **$1,800–3,000/wk** | Sigrún, tour economics | `[S]` |
| a world #1's coach | €6,000–10,000/wk + 10% per Slam | Croatian press on Ivanišević | `[S]` but **explicitly unconfirmed by either party** |

`[GAP]` No coach or agency publishes a rate card. The *structure* – weekly retainer, expenses, 5–15%
of prize money with 10% modal – is solid; any single figure is anecdote.

### 3b. Is the court inside the lesson price? Both, and the split is published often enough to measure

This is the structural question our whole model rests on, and the answer is that the market does it
both ways and **says which**.

| explicit wording | venue | what the court costs when it is separate |
| --- | --- | --- |
| *"Each session includes court hire, coach, equipment and balls"* | Camperdown, Sydney | – |
| *"Our rates for 2026 (which include court hire) are:"* | Tennis4London | – |
| *"incluye pista, luz y pelotas"* | Escuela Tenis Barcelona | – |
| *"฿3,000 + ฿500 court fee"* (and the same +฿500 at three rungs below it) | KĀHLĪ, Phuket | ฿500/h |
| *"individual coaching session"* €20 vs *"… with court included"* €35 | 360 Tennis Club, Sofia | **€15/h** |
| *"An additional $10 guest fee applied to all non-members on court"* | Pure Tennis Academy, PA | $10/visit, and its own court card is **$22 member / $44 non-prime / $60 prime** |
| *"The average hourly rate for a tennis coach (after paying for court fees) in GB is £32"* | LTA | the national figure is **net of court** |
| *"the price includes material and balls, but the court is not included"* | independent instructors, Madrid | – |

⚠⚠ **THE TWO NUMBERS THAT DECIDE OUR MODEL, AND THEY BOTH SAY THE SAME THING.**

`[I]` **The court's share of an all-in lesson price falls as the coach gets dearer, and the real
numbers are:**

| venue | cheapest rung | dearest rung |
| --- | --- | --- |
| KĀHLĪ, Phuket | ฿500 / ฿2,000 = **25%** | ฿500 / ฿3,500 = **14%** |
| 360 Tennis Club, Sofia | €15 / €35 = **43%** (only one rung published) | – |
| ours, middle corridor, 12–16 | **67%** at Budget | **17%** at Elite | 

So **our Elite composition (17% court) is right on the published tennis figure (14%)**, and **our
Budget composition (67% court) is well above it (25–43%)** – which the spec already flagged as its
finding. But it is *not* a defect, and the reason is that the owner's data is **padel**: his own
$22 court against his own "from $10/h" labour is a **69% court share** `[I]`, which is our 67% to
within two points. Padel's court is expensive relative to its coach (a padel court seats four by
design, so the room is the scarce thing), and that is the economics he priced. **Our cheap end matches
his sport, and differs from published tennis venues, and both statements are true.**

### 3c. The finding that decides what to do about the flat court

`[I]` **Within a single venue's price card the coach ladder is compressed to x1.13–1.43** –
Central Park NYC $180/$160 = 1.13, Meadows Boulder 1.14, Oak Hollow 1.20, Duke 1.24, Pure Tennis 1.32,
Crawley LTC £50/£35 = 1.43. It only breaks out where a card carries a named star: iTennis
$200/$90 = **2.22**, KĀHLĪ ฿5,000/฿1,500 = **3.33**. Add the LTA's own certification ladder at
**x1.91** (x2.30 with London) and the picture is consistent.

**Our rung ladder is x4.0 at 12–16 ($30 → $120) and x5.0 at 23+ ($40 → $200).** That is far wider than
any single venue's card, and it is *not* wrong – market-wide, real coaching genuinely spans $50/h
municipal to $200/h at a star to $300/h touring, roughly x6. **But it means our four rungs cannot be
four coaches at one club. They are four different venues** – and a court price that is identical
across them is therefore the thing that does not survive contact with the evidence.

⚠ **That is the empirical case for §7's fix, and it is stronger than "it looks wrong".** A venue's own
published court ladder shows how far it should move: **Pure Tennis Academy, one venue, one card,
$22 member / $44 non-prime / $60 prime = x2.7** – and those are, to the dollar, the owner's own
$22 and $44+.

---

## 4. Ours beside theirs

`[M]` throughout. Middle corridor, because that is the market the owner priced: `WEALTH_CORRIDOR.middle`
is `[0.95, 1.05]`, centred on 1.0, so the constant table **is** what an ordinary academy charges.
Working pays 0.7–0.8 of every figure and wealthy 1.2–1.3.

**The hour, at 12–16 (the development row), decomposed by the shipped `weeklyBillSplit`.** The court
column is printed twice: as it was when this page was written, and as
`court-follows-the-coach-2026-08.md` leaves it. **The total is identical in both** – that is the whole
design of the fix.

| rung | total/h | court/h **before** | court/h **after** | labour/h before | labour/h after | the band a drawn coach sits in |
| --- | --- | --- | --- | --- | --- | --- |
| self | $20.00 | $20.00 | $20.00 | $0.00 | $0.00 | $10–30 |
| budget | $30.00 | $20.00 | $20.00 | **$10.00** | **$10.00** | $24–36 |
| middle | $50.00 | $20.00 | **$24.00** | $30.00 | $26.00 | $40–60 |
| high | $80.00 | $20.00 | **$38.00** | $60.00 | $42.00 | $64–96 |
| elite | $120.00 | $20.00 | **$48.00** | $100.00 | $72.00 | $96–144 |

**Before the fix, the court column was ONE NUMBER.** `facilityRateCents(ageYears)` took no tier
argument, so the court was $20/h whoever was standing on it. The age rows lifted it to $22 (17–22) and
$24 (23+) and the corridor to $15 / $20 / $25, and that was the entire variation the model contained.
Set beside §3a's ladder – a $50/h municipal pro and a $200/h star on the same card – that is the one
column that could not be defended.

**The court's whole spread, before and after** `[M]`:

| | cheapest court in the game | dearest | end to end | inside one corridor |
| --- | --- | --- | --- | --- |
| **before**, 12–16 | $14.00/h (working, corridor floor) | $26.00/h (wealthy, ceiling) | **x1.86** | **x1.00 – flat** |
| **after**, 12–16 | $14.00/h | $62.40/h | **x4.46** | **x2.40** |
| after, 17–22 | $15.40/h | $68.64/h | x4.46 | x2.40 |
| after, 23+ | $16.80/h | $74.88/h | x4.46 | x2.40 |

⚠ **And x1.86 always overstated what any one family experienced.** The corridor is a fact about the
family, not a choice, so before the fix a single career's court price varied only inside its own
corridor band – **x1.14 for a working family, x1.11 for a middle one, and x1.00 across the rungs it
could actually choose between.** Against §2c's real metros at x5.1 to x16.7, the honest statement was
never "our spread is narrow" but **"one family had no venue variation at all"**. It now has x2.40, and
the residual gap to a real city is the part §7 says cannot be closed for free.

---

## 5. The week and the year, at our own hour load

`sessionsByTrain` is 4 / 5 / 6 at `plan.train` 60 / 75 / 85, and an hour is a session, so a balanced
plan buys **five hours** `[M]`. The coach is billed on **every week** bar college and a booked
vacation (`coachWorksThisWeek`), so a season is 52 weekly bills and not 40 – which matters enormously
to the annual figure and is easy to assume away.

**The week, middle corridor, age 14, at each plan** `[M]`:

| rung | light (4 h) | balanced (5 h) | grind (6 h) |
| --- | --- | --- | --- |
| self | $80 | $100 | $120 |
| budget | $120 | $150 | $180 |
| middle | $200 | $250 | $300 |
| high | $320 | $400 | $480 |
| elite | $480 | $600 | $720 |

A real week lands ±8% of these (`weekJitterBps`). The three corridors scale the whole table by
0.75 / 1.00 / 1.25.

⚠ **There is a second court price in the game and it is roughly consistent with the first**, which is
worth recording because two prices for one thing is how a model drifts. The season planner's practice
friendly books its own court at `ECONOMY.practice.courtFeeCents` = **$30–80 per match** x corridor, a
different court on a different day (`split-the-bill-2026-08.md` §2 – the split subtracts, it does not
add). `[I]` At a two-hour friendly that is **$15–40/h**, which brackets the training court's $20/h. No
action; recorded so the next re-price moves both or neither.

**The year, balanced plan, age 14, coach and court separated** `[M]`:

| rung | working coach + court | middle coach + court | wealthy coach + court | total |
| --- | --- | --- | --- | --- |
| self | $0 + $3,900 | $0 + $5,200 | $0 + $6,500 | $3,900 / $5,200 / $6,500 |
| budget | $1,950 + $3,900 | $2,600 + $5,200 | $3,250 + $6,500 | $5,850 / $7,800 / $9,750 |
| middle | $5,070 + $4,680 | $6,760 + $6,240 | $8,450 + $7,800 | $9,750 / $13,000 / $16,250 |
| high | $8,190 + $7,410 | $10,920 + $9,880 | $13,650 + $12,350 | $15,600 / $20,800 / $26,000 |
| elite | $14,040 + $9,360 | $18,720 + $12,480 | $23,400 + $15,600 | $23,400 / $31,200 / $39,000 |

(The `middle`, `high` and `elite` rows are the post-ruling split; **the totals in the last column are
unchanged by it** – that is the whole design.)

⚠ **AND THE ANNUAL FIGURE MATCHES A FIGURE THIS REPO ALREADY HELD, WHICH NOBODY HAS EVER PUT BESIDE
IT.** `docs/research/junior-economics.md` (24.07, before the ladder existed) recorded *"Club weekly HP
package (private + drilling + fitness): ~$400–$500/wk ≈ $20–26k/yr"*. Our **`high` rung bills exactly
$400/wk at the middle corridor and $500/wk at the wealthy one** `[M]`, and $20,800 / $26,000 a year –
**both ends of that band, to the dollar.** Its own annual bands land the same way: modest competitive
$10–20k/yr against our working·budget at $5,850 training inside a ~$22k bench gross; well-funded club HP
$25–40k against middle·middle's $13,000 inside $27–38k; residential academy $40–100k against
wealthy·elite's $39,000 inside ~$50k. **Three independent calibrations agree that this ladder's
magnitudes are right.** That is the strongest single reason not to re-price it.

---

## 6. The share of the family's income – the number that decides whether ours is big or WRONG

⚠ **`parentIncomeCents` is not a household income and the comparison collapses if it is read as one.**
Its own comment calls it *"weekly parent contribution to the war chest"* – the slice of the household's
money that goes to tennis, on top of a starting reserve of $8k / $25k / $120k. In annual terms:
**$12,740 / $22,100 / $39,000** `[M]`. So every percentage below is *"share of everything this family
devotes to the sport"*, which is a harsher and more useful denominator than gross income.

**Balanced plan, five hours, against the family's own weekly contribution** `[M]`. S0 is her first
season at 14; S4 is 18, with income compounded four times through `incomeGrowthBand` (5–10% a season,
mean +34% over four) and the rate row stepped up to 17–22:

| rung | working S0 | working S4 | middle S0 | middle S4 | wealthy S0 | wealthy S4 |
| --- | --- | --- | --- | --- | --- | --- |
| self | 31% | 25% | 24% | 19% | 17% | 14% |
| budget | 46% | 40% | 35% | 31% | 25% | 22% |
| middle | 77% | 69% | 59% | 53% | 42% | 37% |
| high | **122%** | **114%** | **94%** | **88%** | 67% | 62% |
| elite | **184%** | **183%** | **141%** | **141%** | **100%** | **100%** |

⚠⚠ **THE AGE-BAND STEP EATS THE INCOME GROWTH, AND AT THE TOP IT EATS ALL OF IT.** The owner asked
for a compounding parental contribution specifically so the family gets stronger («с каждым новым годом
вклад родителей приростал процентов на 5-10»). Over four seasons income rises **+34%** `[M]`. Over the
same four seasons the Elite rate row rises $120 → $160 = **+33%**, so an Elite career's share is
**141% at 14 and 141% at 18** – frozen to the point. The relief is real at the rungs below (self
24→19%, budget 35→31%, middle 59→53%, high 94→88%) because their age steps are gentler (+10%, +17%,
+20%, +25%). **The higher the rung, the more completely the family's growth is cancelled**, which is
the opposite of the direction a "the parents' careers move too" mechanic was bought for. It is not a
bug – both halves were tuned separately and correctly – but nobody has ever put the two next to each
other, and this is what that looks like.

### Is it the RIGHT big? First: the weekly figure itself checks out against a real tour coach

Our 23+ Elite rung bills **$1,000/wk** at the middle corridor and **$1,250/wk** at the wealthy one, at
five hours `[M]`. Set that beside the only published weekly retainers there are:

| what | weekly | ours, nearest rung |
| --- | --- | --- |
| coach of a player ranked ~150–450, no expenses (Forbes 2008) | **$500** | `high`, working corridor, 23+: **$450** `[M]` |
| coach of a player ranked 25–75, + expenses + 10% (Forbes 2008) | **$1,000–2,500** | `elite`, 23+: **$1,000–1,250** `[M]` |
| coach of a player ranked ~212 (Rubin, 2019) | **$1,800–3,000** | above our ceiling |

⚠ **Our top rung lands inside the real band for a top-100 player's coach, and our `high` rung lands on
the real figure for a journeywoman's.** That is a genuinely good calibration and it was arrived at
independently – the owner priced per hour, the engine multiplies by hours, and the product happens to
be what Brad Gilbert says the job paid. **So the answer to "is $600–1,000 a week too much" is no.**

The real question is the one after it.

### And second: the support is the test, and the support does not reach this line

The question is not whether $600/wk is a lot. It is whether the things that make an expensive career
survivable in life exist in the game *and reach the family paying that*. Ours are three, and I checked
what each one actually pays for:

| support | what it covers in our engine | does it touch coaching or the court? |
| --- | --- | --- |
| academy scholarship | 75% of a **travel** bill at level 1, plus a **kit** grant (`ECONOMY.academy.travelCover`, `kitGrantCents`) | **No** |
| sponsor ladder | **equipment** lines – rackets, strings, shoes, apparel – plus a cash retainer and bonuses | only indirectly, as cash |
| the college fork | the programme coaches her; `coachWorksThisWeek` returns false and the family stops paying | **Yes – and it is the only one** |

⚠ **THE ONE BILL THAT BREAKS THE FAMILY IS THE ONE BILL NO SUPPORT IN THE GAME TOUCHES.** In reality
an academy scholarship is remission of **tuition**, and tuition is exactly coaching plus court – that
is what the word means. Ours pays for flights. The choice was deliberate and it was measured
(`ECONOMY.academy.travelCover`'s own comment: *"travel is the bill that breaks the family – bench:
$18k over 14→18 for the working preset, against a $5.7k horizon deficit"*), and it was the right call
**at the time it was made, when the coach was a two-band weekly draw and nobody could see the court
inside it.** The split has changed what is visible: the working family's training bill is now legible
as $5,850 a year at Budget, two thirds of it a court, and `needFactor` already says that family is the
one an academy would back at level 1.

`needFactor` is `working: 1 · middle: 0.6 · wealthy: 0` – so the *targeting* is right and only the
*instrument* is wrong. **Nothing here is proposed as a pricing change**; it is the strongest available
answer to "is the support reaching the families who need it", and the answer is *it reaches them, on a
different bill*.

⚠⚠ **AND THE REAL WORLD PAYS THE TRAINING BILL, NOT THE FLIGHTS. Sourced, four ways:**

| who | what it actually pays for | amount | tag |
| --- | --- | --- | --- |
| **USTA**, USA Tennis Development Grants | **reimbursement of training and competition costs** | "on track" up to **$5,000/quarter (~$20,000/yr)**; "nearly on track" up to $2,500/qtr | `[S]` |
| **Federación Cántabra de Tenis**, Becas a Tenistas 2025 | **paid to the coach or club on invoice, never to the family** | €100–600 per achievement, hard cap **€1,200/player/yr** | `[S]` |
| **LTA**, Pro Scholarship Programme | a **cash** grant plus National Tennis Centre science and medicine | *"normally a minimum of £45,000 per year"*, **10 players** | `[S]` |
| any academy scholarship | remission of **tuition** – which by definition is coaching plus court | magnitude never published by anyone | `[S]` for the absence |

**So the instrument our model is missing is the one every real body actually uses**, and the one it has
(a travel subsidy) is the one none of them lead with. `[I]` Our academy pays 75% of travel at level 1;
the USTA reimburses *training*.

### And the reach: real support is far rarer than ours, which cuts the other way

`[S]` throughout, and the numbers are startlingly small. **Grand Slam Player Development Programme,
2026: 65 players worldwide from 42 countries** – three at $50,000, fifty-one at $25,000, eleven at
$12,500 (`[I]` a $1,562,500 pot, mean grant **$24,038**). **The LTA funds seventeen named players** in
total across its whole pathway (10 Pro Scholarship + 6 Pro Transition + 1 International Junior Grant),
and tennis receives **£0** from UK Sport, so every pound is the LTA's own. **Tennis Canada's carding
quota is ten cards**, shared between the developmental (CAD $15,660/yr) and senior (CAD $26,100/yr)
routes. **Champ'Seed supports twelve players**, and it is the only academy-side programme in the whole
survey that publishes a count at all.

⚠ **The scale check that reframes everything** `[I]`: a $25,000 GSPDP grant covers **25% of one year at
IMG** ($99,900 boarding, 2026-27, own rate card) but **95–208% of the entire non-academy competitive
junior budget** ($12,000–26,300/yr, bottom-up from sourced unit prices). **The same grant is a rounding
error against an academy and transformative for a club-route family.** That is exactly the shape our
own academy support has – `needFactor` 1 for working, 0 for wealthy – and it is the one part of this
picture our model already gets right for the right reason.

### The 141% figure, checked against a real academy and a real income

`[S]` both halves: **IMG Academy full-year boarding tennis is $95,900–$99,900 for 2026-27** (their own
rate card, plus a mandatory $4,500 competition fee and $6k–15k of likely extras), against a **US median
household income of $83,730 gross for 2024** (Census P60-286, Table A-4a). `[I]` **119%, or 125% with
the competition fee** – and **289% of a 20th-percentile household's $34,510.** Four other academies
that publish a rate card land between 90% and 104% of median household income: Evert boarding plus its
school $87,150, Saddlebrook $76,915, Weil with its $7,000 tournament account $75,600.

⚠ **So our Elite rung at 141% of the family's tennis budget is the right order of magnitude, and the
claim behind it is supported at exactly the tier we apply it to.** It is *not* supported one rung down:
the ordinary competitive junior costs $12,000–26,300 a year `[I]`, or **14–31% of median household
income** – which is where our `budget` and `middle` rungs sit. The distribution is extremely skewed and
our ladder reproduces the skew.

And it goes broke in reality, repeatedly and on the record `[S]`: **Simon Broady sold the family home**
in Stockport and downsized to fund Liam and Naomi; **Judy Murray took a three-year loan** for Andy's
Barcelona training at 15 and described the family as *"skint"*; **Zheng Qinwen's father sold household
possessions and her mother quit her job**; **Stefanos Tsitsipas's father quit his job** and then could
not withdraw the training money under Greek capital controls; **Taylor Townsend's mother paid for the
US Open trip herself** after the USTA declined. ⚠ Two corrections worth carrying, because both
circulate in the wrong form: Zheng's father sold **appliances and possessions, not the house**, and the
Broady home sale is real but the citation usually given for it is a dead link – the live one is ESPN
Deportes (2023). `[GAP]` And no federation anywhere publishes an annual cost breakdown for a junior;
every $10k–50k figure in circulation is journalism or an uncited commercial blog.

⚠ **One calibration note for a different wave, found on the way:** junior sponsorship in reality is
**product-only** – free gear, no cash – from as young as nine, and *"you very rarely see companies
paying money for players ranked around (150)"* `[S]`. A **cash** stipend from a brand effectively does
not exist below roughly top-100 professional. Worth checking our sponsor ladder's cash retainers
against that, in a wave that is about sponsors.

---

## 7. What is right, what is wrong, and the seam past the pro career

**RIGHT, and confirmed by the owner's own data twice:**

* the court at the cheap end – **$20/h against his $22**, a 9% gap, and $20 is the middle of the
  $10–30 band he himself signed off on 29.07;
* Budget coach labour at the middle corridor – **$10/h against his "from $10/h"**, exact;
* the hour as the billing unit, and 4/5/6 sessions – his own numbers, unchanged;
* the corridor being **the market she trains in** rather than a discount for being poor – his Round 2
  correction, and it is why the court is already corridor-priced.

**ALSO RIGHT, and it was a surprise:** the top of the ladder. Our 23+ Elite rung bills $1,000–1,250 a
week against Forbes' published **$1,000–2,500/wk** for the coach of a player ranked 25–75, and our
`high` rung bills $450–600 against the **$500/wk** a ranked-150-to-450 player's coach got. Nobody aimed
at that; the hourly price and the hour count were set separately and the product landed on the real
band `[I]` from `[S]`.

**WRONG, in descending order of how much it matters:**

1. **The court took no rung argument, and the spread was x1.86 against a real city's x5.1–16.7.**
   Fixed as far as it can be fixed for free, in
   `docs/specs/court-follows-the-coach-2026-08.md` – x1.86 to **x4.46**, at zero survival cost.
2. ~~**His second venue does not fit the model and cannot be made to fit for free.**~~ **CLOSED by the
   owner, 08.08: «наши цифры подходят».** The finding stands – a $44 court inside a $50 Middle bill
   leaves $6/h of labour, and five hours a week of a $44 court is **52% of the middle family's whole
   tennis budget** – but he has accepted our levels, so the absolute figures are not being bought. The
   arithmetic is kept in `court-follows-the-coach-2026-08.md` §6 as the record of what was declined.
3. **A working career's Budget coach earns $3–12/h of labour, mean $7.50** `[M]` – below his floor
   across **78% of the band** (labour clears $10/h only above a drawn rate of $33.33 in a $24–36 band).
   Whether that is wrong depends on the one question in §1. For context, the cheapest *published*
   coaching labour anywhere in §3 is **€20/session** (Sofia, court excluded) and the cheapest
   marketplace floor is $10–18/h; our $3/h corner is below all of it.
4. **Nothing subsidises the training bill** (§6), and every real body subsidises exactly that. Not a
   pricing defect; the largest open question the two tables produced, and the cheapest honest version
   is not a new mechanic – the academy already has a `level`, a `needFactor` and an annual review, so a
   `coachCover` beside `travelCover` is one constant and one call site. **Costed here, not proposed:
   it would move survival, so it is the owner's.**
5. **Our Budget rung is priced as a private lesson but its fiction is a group session**
   (`coach-tiers.md` §3: *"a coach who takes four kids at once is what $30 an hour buys"*). Real
   group-of-four pricing is **31–47% of the same venue's private rate** `[I]` – Camperdown 38.5%,
   Escuela Tenis Barcelona 47.4%, Meadows 35.7%. Our Budget is **60% of Middle**. So if the group
   fiction is meant literally, Budget is a rung too dear; if it is only a flavour, it is fine. Recorded,
   not proposed – it moves the working family's only affordable rung and that is not a free change.

⚠ **THE SEAM, AND IT IS DELIBERATELY NOT BUILT.** Past the professional career a player may
plausibly buy her own court – she has prize money, a manager and a reason to train somewhere better
than her parents could afford. The 23+ rate row already exists and already steps the court to $24/h,
but it steps it *because she is older*, not because she is now the customer. Turning the venue into
**her** decision rather than her family's is the natural next slice and it belongs after the fork at
nineteen, not inside a pricing pass. Recorded so the next reader does not have to notice it again.

### The four questions this page cannot answer, in the order they are worth asking

1. **Is "from $10/h" a market FLOOR or a typical Budget rate?** One sentence, and it decides item 3
   above. Floor ⇒ the Budget band's bottom half is under the real market and wants narrowing. Typical
   ⇒ we are exactly right and nothing moves.
2. ~~**Do you want your absolute court figures?**~~ **Answered: «наши цифры подходят».** Declined, and
   the arithmetic of what was declined is kept in the spec.
3. **Should an academy scholarship pay the COACH rather than the flights?** Every real body does, and
   ours is the one that does not. It moves survival, so it is yours.
4. **Is the Budget rung a group session or a cheap private lesson?** The fiction says group; the price
   says private, at 60% of Middle against a real 31–47%.

---

## 8. How to re-run every `[M]` figure on this page

```bash
npx vite-node tools/coach-court-price.ts          # the tables in §4, §5, §6
npx vite-node tools/coach-court-price.ts -- --csv # machine-readable, for diffing a re-price
```

It reads `weeklyBillSplit`, `facilityRateCents`, `coachRateBandCents`, `coachHoursForPlan` and
`parentIncomeForWeekCents` – the shipped functions the tick bills through – rather than
re-implementing the arithmetic, which is the only reason a table in a document is still true a month
after a constant moves.
