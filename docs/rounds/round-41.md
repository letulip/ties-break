---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-08
---

# Round 41 – what the promo film exposed, 4 items (08.09.2026)

⚠ **This round has one unusual origin and it is worth stating.** Nothing here came from a bug report.
It came from filming the product: a 32-second Game Jolt promo walked the same seed down two
childhoods and the payoff screen said the same thing twice. The film did not find a defect – it drew
the majority ticket on a measured 40.9% – but it put four real questions in front of the owner at the
moment they hurt most, and he answered all four.

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open · `[?]` his
answer needed · `[!]` REOPENED

---

- [ ] **1. The handover's base sentence should read REALISATION, not arrival.** Owner: «что если мы
  здесь как раз будем говорить о той разнице в реализации, которой уже к этому моменту она достигла?
  тогда это не нарушит ничего, но и отразить разный прогресс» → then «делай».

  **Why it is the right shape, and why it should show more.** `handoverRoomBand` reads her BIRTH
  build against her potential, which no childhood can move – that is the potential rule and it is
  kept. `handoverBaseBand` reads her ARRIVAL against the fresh-fourteen distribution, whose cuts sit
  at p20/p80 = 46.30 / 50.70. A band there is ~2.2 points wide and the shipped card table spans only
  1.87, so the sentence moves on **40.9% of seeds** – the film simply drew one of the other 59%.
  Realisation divides by HER OWN headroom (`potential − born`, roughly 8-12 points) instead of by the
  population's spread, so the same 1.87 points weigh several times more.

  ⚠ **The machinery exists**: `realisedShare` (round 34 #2b) in `world/coachMarket.ts`, documented as
  monotone and unable to flicker. ⚠ **And it carries a trap round 34 already hit**: realisation
  rewards a SMALL ceiling – the verdict arrives earlier for the less talented girl. Round 34 fixed
  that by dividing by what is REACHABLE rather than by the asymptote; if the function is reused, that
  fix comes with it or the inversion comes back.

  **MINE, in order:** measure how far realisation diverges between the two shipped paths, and only
  then rewrite the sentence. No copy before the number.

- [ ] **2. Verify the span: the film measured 2.49 where the enumeration says 1.87.** `coachMarket.ts`
  records «enumerating all 32 runs through the SHIPPED CARD TABLE gives a span of 1.87 (mean arrival
  47.48 at the cheapest, 49.35 at the dearest)». The recorder measured its two paths 2.49 apart.
  ⚠ **A difference cannot exceed the span it lives in**, so one of the two is wrong: either the
  enumeration excludes the Local Open entries (path B plays them, path A declines) or the figure has
  rotted. **MINE, and it comes BEFORE item 3** – if the real span is wider, §8c's whole picture
  changes before anything is tuned.

- [ ] **3. §8c – the cards reach only 44% of the model's span. Variant B: compound, not sum.** Owner:
  «по п. 2 давай Вариант B попробуем». The model's extremes span 4.28 points; the shipped table
  spans 1.87. Today the choices ADD. If the club, the private hour and the sports school REINFORCED
  one another, the span widens without any single card getting stronger – which is also truer: three
  years of private coaching after a club year are worth more than the three years apart.
  ⚠ **Held until items 1 and 2 report.** Item 1 may close this without touching balance at all (the
  same points, read against a smaller denominator), and item 2 may move the target. Widening a card's
  effect compounds through twenty years of career and is the most expensive of the three answers –
  it goes last, on purpose. ⚠ `docs/specs/childhood-growth-2026-09.md` §8c is where this question was
  already recorded as his.

- [ ] **4. The two seeds: give the prologue one, and let the career inherit it.** Owner: «Рекомендую
  B обязательно, C — обсудить… по-моему хорошо звучит».

  **The fact that started it:** the promo recorder restored `Math.random` after mount, which pinned
  the PROLOGUE seed and left the CAREER seed random – two different girls under a caption reading
  «Same hidden potential». It surfaced on the handover frame and the recorder now refuses such a take.
  ⚠ But the hazard is ours, not the recorder's: there are **two independent seeds and two independent
  `Math.random` calls** – `ChildhoodPrologue.vue`'s `freshSeed()` (no injection point) and
  `stores/game.ts`'s `seed.trim() || random` (already injectable).

  * **B, obligatory:** give the prologue a seed input exactly as the career has one, so no tool ever
    needs to patch `Math.random` again. Fixes the cause.
  * **C, approved in principle:** the career BORN FROM a prologue inherits the prologue's seed – one
    girl, one seed, all the way through. Today it draws a fresh random one, so the discontinuity the
    recorder tripped over lives in the shipped product too. ⭐ It also makes a childhood reproducible
    for the PLAYER, not only for us.
