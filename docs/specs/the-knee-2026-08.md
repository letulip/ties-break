---
type: spec
status: draft
area: balance
canonical: false
last-reviewed: 2026-08-27
---

# The knee – one constant, three findings, and a rule nobody wrote down

`ECONOMY.condition.matchStrengthKnee = 70` has now surfaced **three times in one week**, from three
unrelated investigations, and each time it was the answer. It is written up here because a constant
that keeps being the answer deserves a page of its own rather than a paragraph in three specs.

    conditionMatchFactor(c) = c >= 70 ? 1 : 0.55 + 0.45 × c / 70

---

## 1. Where it came from, and it is not an accident

`condition.ts:113` records it as **R9-19, the owner's own curve**: «NO strength penalty while she is
fresh enough, then linear down to the floor at condition 0». ⭐ That is a deliberate, defensible
design: being tired should hurt, being extra-rested should not be a superpower. **Nothing below is an
argument that the shape is wrong. It is an argument that its CONSEQUENCE was never counted.**

---

## 2. The three findings

**⚠ FINDING 1 – the retirement door (27.08).** The on-court retirement hazard borrowed this factor
through `stamina`, so **arriving at 95 and arriving at 70 were byte-identical**. His design wish –
«если я приезжаю с 80-90 на турнир, то как будто вполне есть высокий шанс доиграть» – was delivered
to exactly zero. ⭐ **Already fixed**, and the fix is the precedent for everything below: `retireHazard`
stopped borrowing the knee and got **its own linear term** (`retireDurability`, `RETIRE_DURABILITY_SPAN`),
which moved the ratio «worn arrival vs fresh arrival» from **×1.72 to ×9.3**.

**⚠⚠ FINDING 2 – the lever bench (27.08), and this is the one that reads as a defect.** Asked which of
his pre-tournament decisions actually move a result, over 300 trials on one save:

| lever | results moved of 300 |
| --- | --- |
| an elite coach travelling with her | **49** |
| sending her coach at all | 35 |
| firing the coach | 30 |
| kit rot | 19 |
| **restoring her to full condition** | **2** |
| **the masseur** | **1** |
| the physio retainer | **0** |

**Every measured arrival condition in that bench was 86 / 87 / 90 / 93 / 96 / 100 – all above the
knee.** So the entire condition family is flat where careers actually live. ⭐ **The masseur really
buys her six points of condition and zero points of tennis.**

**FINDING 3 – the field (27.08).** Not caused by the knee, but read through it: her match strength is
`skills × conditionMatchFactor`, and with the factor pinned at 1 for any healthy player, **the only
thing standing between her and the college field is raw skill** – which the growth measurement then
found to be three years ahead of its own anchor.

---

## 3. What condition actually feeds – the table nobody had drawn

| consumer | shape above 70 | where |
| --- | --- | --- |
| **match strength** | ⚠ **FLAT – buys nothing** | `conditionMatchFactor`, read by all five skills (`world/player.ts:216-221`) and by all 199 rivals (`season/rival.ts:379`) |
| **the weekly injury door** | ⭐ **LINEAR to the top – buys everything** | `injury.ts:81`, `const fatigue = 100 - world.condition` |
| the retirement door | ⭐ linear, since 27.08 | `retireDurability` |
| medical clearance | a threshold | `medicalClearance` |

⭐⭐ **THE RULE NOBODY WROTE DOWN: FRESHNESS BUYS SAFETY AND NEVER BUYS STRENGTH.** She does not play
better for being fresh above 70. She gets hurt less. **That is a coherent design and it may well be
the right one – but it has never been stated, and every surface the player judges these purchases on
is a TENNIS surface.**

⚠ Which is why the masseur looks broken and is not: he does exactly what he was built to do, on a
channel the player cannot see, while the channel the player watches is flat by construction.

---

## 4. ⛔ Do not just move the knee

The one-line fix is to lower `matchStrengthKnee`. **It is the wrong line.**

- It is read by **all 199 rivals** (`season/rival.ts:379`) as well as by her, so moving it re-prices
  the entire field in the same stroke.
- It scales **all five skills**, so it changes serve, return, composure, stamina and groundstrokes
  together – it is not a strength dial, it is a whole-player dial.
- It is **the owner's own curve** (R9-19). Changing its shape to fix a consequence is changing a
  ruling to fix an oversight.

⭐ **The retirement fix is the shape to copy**: leave the shared curve alone, give the consumer that
needs a different answer **its own term**. It cost one constant, moved no shared number, and the
frozen MAIN capture did not move.

---

## 5. The options, and what each costs

| # | option | cost | what it changes |
| --- | --- | --- | --- |
| **A** | **Do nothing, and SAY the rule** – freshness buys safety, in the copy the player reads when he buys a masseur | XS | ⭐ The cheapest honest answer. The masseur's card stops implying tennis it does not sell |
| **B** | **Give match strength its own condition term above the knee** – a small linear gain, 70→100, separate from `conditionMatchFactor` | S–M | The condition family stops being flat. ⚠ Re-prices every match in the game and needs the full bench |
| **C** | **Make the masseur buy something visible instead** – he already relieves `runStrain`; let him buy a channel the player watches | M | ⚠ Design work, and it must not become pay-to-win |
| **D** | Lower the knee | ⛔ | Rejected above |

⚠ **A and B are not exclusive, and A should ship first regardless.** If the rule is right, the game
should say it; if it is wrong, saying it out loud is how the owner finds out.

---

## 6. What this must not break

1. ⚠ **The frozen MAIN capture** (41550 / `e6b0c709`) – none of A–C draws.
2. ⚠ **The 199 rivals.** Any term that touches only her makes her different in kind from the field,
   which is a real asymmetry and must be argued rather than smuggled.
3. ⚠ **The injury bands.** Round 26 measured season prevalence 17 points over its own band, and the
   27.08 retirement fix moved the careful arm to **39%, inside 30–54% for the first time**. **A change
   that makes fresh players stronger also makes them play longer matches** – §4a of
   [the-long-goodbye](the-long-goodbye-2026-08.md) and the retirement measurement both apply.
4. ⭐ **His own standard, set 27.08**: «есть реальность, где игроки должны это делать и есть статистика
   травм. Если наша проделанная работа и результаты похожи на реальность – то всё в порядке.» The
   upset-rate research already says **our favourites are too safe** – measured 11% and 15% first-round
   losses against a cited 19.2% at the same rank gap. **Anything that makes a fresh favourite stronger
   pushes the wrong way on a number that is already wrong.**

---

## 7. Recommendation

**Ship A now. Hold B until the growth curve is settled.**

The knee's flatness is not this week's most expensive problem – the growth measurement found careers
running **three years ahead** of the development model's own anchor, and the upset rate says the
favourite already wins too often. ⚠ **Making a fresh favourite stronger, today, would push both of
those further out.** Say the rule, fix what the masseur's card promises, and come back to B when the
thing it multiplies has stopped moving.
