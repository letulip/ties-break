---
type: spec
status: draft
area: endings
canonical: false
last-reviewed: 2026-08-26
---

# The long goodbye – the career ends when her body says so, and she says it herself

Captured verbatim so the ask is not paraphrased away (owner, 26.08.2026):

> «я сегодня в новостях видел, что Roger Federer играл активно до 41 года, а сейчас вроде как решил
> снова вернуться в спорт. Отсюда у меня мысли на тему нашей жесткой концовки в 38 – может быть ее
> как-то пересмотреть и заложить как раз плавную и затухающую деградацию навыков просто, а девочка
> "сама" по итогам сезона будет говорить, что она "всё"? или вроде того.»

⚠ **HALF OF WHAT HE ASKS FOR IS ALREADY BUILT, AND THAT CHANGES THE PROPOSAL.** The smooth decay
exists and has since the development slice. What does not exist is the second half – her own voice –
and what is wrong is not the decay but the TRIGGER sitting on a birthday.

---

## 1. What is actually shipped today

**`ECONOMY.development.ageCurve`, and it is already a fade rather than a cliff.** `declineFactor`
returns `declineRate * (1 + (age - declineStart) * declineAccel)` – `declineRate: 0.00035` a week,
`declineAccel: 0.28`, from `declineStart: 29`. Its own comment says the shape out loud: «gentle at
first and steeper every year, which is how careers actually end: a season of "still fine", then a
season where the legs are gone.» Measured off the shipped function:

| age | lost per season | share of peak PHYSICAL left |
| --- | --- | --- |
| 33 | 3.8% | 87% |
| 35 | 4.8% | 79% |
| 37 | 5.7% | 71% |
| **38** | 6.2% | **66%** |
| 40 | 7.2% | 57% |
| **41** – Federer's age | 7.6% | **53%** |
| 43 | 8.6% | 45% |
| 45 | 9.5% | 37% |

⭐ **AND THE DECAY IS PHYSICAL ONLY** – `declineFactor`'s own doc line: «Physical only; composure is
handled by the caller.» Technique and composure do not fall. That is precisely the late-Federer
silhouette: the craft is intact, the legs are gone. The engine already models the thing he is asking
for; nobody had put a number in front of him.

**The retirement question.** `retirementDue` asks every off-season from `askFromAgeYears: 29`, and
again on a `plateau` reading (three flat seasons inside `plateauRankBand: 20`). The parent answers;
«one more year» is unlimited and counted in `oneMoreYearCount`. At `stopAskingAgeYears: 38` the offer
carries `final: true`, and `answerRetirement` **throws** on a refusal – `'This was the last time
anybody asked'`.

---

## 2. What the floor at 38 is actually FOR – and this is the argument against simply deleting it

From this repo's own measured distribution ([endings-and-the-album.md](endings-and-the-album.md)
§2), on the arm that **refuses every offer**:

| ending | «plays on» share | median age |
| --- | --- | --- |
| bankruptcy | 51.1% | 17 |
| natural (the floor) | **41.1%** | **38** |
| injury | 7.8% | 31 |
| plateau | 0.0% | – |

⚠⚠ **FOR A PLAYER WHO NEVER SAYS YES, THE FLOOR IS THE ONLY ENDING THE GAME HAS.** Of the careers
that survive the money and the injuries, **every single one** ends because the game stopped asking.
Delete the floor and 41% of that arm has no ending at all – she slides to 37% of peak at 45 and keeps
going, which is not a gentler story than a wall. It is no story.

**So the fade cannot replace the ending. It never was competing with it.**

---

## 3. The verdict

**Keep the ending. Move its trigger off the birthday and onto her body.**

Federer at 41 is an argument against a fixed NUMBER, not against a finish. A rule that reads the body
gives him the Federer career he wants *and* keeps the ending honest:

- a body kept well plays to 40–41, and that is **earned** rather than granted;
- a body wrecked by 33 finishes at 33, and that is the game telling the truth about the choices made;
- the fade still ends every career, because the curve accelerates.

### 3a. The dial, and today's rule is a special case of it

The last offer arrives when her physical drops below a share of **her own peak**. Because the curve
is deterministic in age, that share maps to an age for an UNDAMAGED career – and this is what makes
the change safe to reason about:

| threshold | last offer lands at (undamaged) | what it means |
| --- | --- | --- |
| 70% of peak | **38** | ⭐ **today's rule exactly** – the change is a strict generalisation |
| 65% | 39 | |
| 60% | 40 | |
| **55%** | **41** | ⭐⭐ **RULED BY THE OWNER, 26.08: «я бы взял 55% по уходу – согласен, звучит ок»** – Federer's age, reachable only on a body kept well |
| 50% | 42 | |
| 45% | 43 | the tail gets long and the tennis gets sad |

**Settled: 55%, by his word on 26.08.** It buys three years over today's rule, it puts the ceiling exactly where the
real case he read about sits, and every year of it has to be paid for in physio, load and luck. ⚠ The
number is a dial and this table is the whole argument for it – 70% reproduces the current game byte
for byte, so a rollback is one constant.

### 3b. Why «her own peak» and not «her potential»

Reading current physical against `potential` would cost nothing (it is already persisted) and it
would be **wrong**: a girl who never came near her ceiling would read as finished while still young.
The signal has to be what she actually reached. That costs **one persisted number** – her best
physical ever – and a save-schema move.

⚠ The `askFromAgeYears: 29` floor stays as it is, so nothing can fire before the decline even starts.

---

## 4. Her own last word – the half that genuinely does not exist

Today the parent answers, and at 38 the game forbids the answer «no» with a thrown error. She is
absent from her own retirement. The code even apologises for it in `answerRetirement`'s header: «the
copy on the card has to carry the difference between "we are retiring you" and "nobody is going to
ask again".»

**That difference should not be carried by the copy. It should be carried by whose voice it is.**

- Every non-final offer stays exactly as it is: the parent's question, the parent's answer, «One more
  year, she said. Same as last time.»
- The **final** one stops being a question. It is her line, at the end of the season, in her own
  words – she says she is done, and the card acknowledges rather than asks.

⭐ **This needs no preference model and therefore does not wait on the private-life layer.** The
owner PAUSED E1 («её мнение») on 22.08, and this is deliberately not that: E1 is her opinion about a
choice still open (the college fork), where the game would need to know what she WANTS. Here the
choice is closed by her body, and the two inputs – what she has left and what her results did – are
both already on the snapshot. ⚠ If the private-life layer later gives her a spirit, this line is the
obvious first place it should colour, and the wording should be written so that it can.

---

## 4a. The fade has a second half – recovery, and it was his own addition

The owner, 26.08, on reading §1:

> «для концовок и возраста предлагаю еще уменьшать недельное восстановление после матчей, т.е. и
> физика будет падать и восстанавливаться будет дольше, надо угасающий коридор сделать какой-то
> разумный тоже.»

⭐ **He is right and it closes a hole in §1.** Today the ONLY thing age touches is the attribute
value. A thirty-eight-year-old drains from a match exactly as fast as a twenty-two-year-old and
recovers exactly as fast – so the old body is weaker but never *tireder*, which is backwards. Every
professional account of a late career is about the recovery, not the peak.

**The shape, and it deliberately introduces no new curve.** `ECONOMY.condition.proPhaseRecoveryBase`
is **5** points a rest week (variant C, his 22.08 ruling). The proposal is that the recovery a week
returns scales with **what is left of her body** – the same share §3a already computes:

| age | share of peak left | rest week returns | note |
| --- | --- | --- | --- |
| ≤28 | 100% | 5.0 | untouched – the peak is the peak |
| 33 | 87% | 4.4 | |
| 36 | 75% | 3.8 | |
| 38 | 66% | 3.3 | |
| **41** | 53% | **2.7** | at the threshold that ends the career |
| floor | – | **2.5** | ⚠ the one new constant, `recoveryAgeFloor: 0.5` |

**Why a floor at all.** Without one the corridor keeps closing and the career does not end – it
becomes unplayable, which is a different and worse thing. A wreck who cannot recover would be pushed
out by exhaustion and injury rather than by the ending this spec is about, and that would quietly
steal careers from the other three finishes (§6.4). The floor keeps the last seasons hard and
playable, and lets the ENDING be what ends it.

⚠ **THE JUNIOR ERA CANNOT MOVE.** `recoveryBase: 8` and everything below 29 is untouched by
construction – the multiplier is 1 until `declineStart`. This is the same guarantee §5 of
[fatigue-reprice-2026-08.md](fatigue-reprice-2026-08.md) makes about its own re-price, and for the
same reason: the junior benches are pinned reference tables and a drift there is invisible.

### ⚠ And this is the risk that has to be MEASURED, not argued

A slower recovery raises fatigue, and fatigue is what feeds the injury door. Round 26 already found
the season prevalence sitting **17 points over its own band** (71% against the professional 30–54%,
[round-26.md](../rounds/round-26.md) 14b) with nine of those points unauthored. **Closing the
recovery corridor pushes on exactly that number in exactly the wrong direction, and it does so only
in the years this spec is about.** So §6 gains a sixth acceptance number, and if it fails, the floor
rises before anything else is touched.

⭐ **There is also a prize here.** «She can no longer open a season at 90» is a fact her body already
knows how to state – the fatigue spec's own acceptance number (`opens the next season at >= 90`). If
the measurements say so, that is a better sentence for her last word in §4 than any threshold: not
«she is 41» but «she did not come back from the winter».

---

## 5. What it costs

| piece | where | size |
| --- | --- | --- |
| the stored peak physical | `world/state.ts` + a phase writes it each tick | S – **one field, one save-schema move** (bump, append-only migration, golden fixture, `e2e:fixtures`) |
| the trigger | `retirementDue` in `src/engine/ending.ts` reads the share instead of `stopAskingAgeYears` | S |
| the constant | `ENDINGS.lastOfferPeakShare: 0.55`, and `stopAskingAgeYears` is **deleted, not left dangling** | XS |
| her line | the retirement card's final state, and one event line | S |
| the recovery fade (§4a) | `ECONOMY.condition` gains `recoveryAgeFloor`; the rest-week return is multiplied by the §3a share | S |
| the re-measure | §6 below | M |

⚠ **RNG: ZERO DRAWS.** Nothing here is random – the peak is a running maximum, the threshold is
arithmetic, the line is text. The frozen MAIN capture (41550 / `e6b0c709`) cannot see this change,
and if it moves, something is wrong.

---

## 6. Acceptance – the numbers that decide whether it worked

Re-run the endings bench on both arms and compare against §2's table:

1. **«plays on» still ends.** Natural endings stay the dominant finish on that arm – the share may
   move a few points, but it may not collapse toward zero. A career that never ends is the failure
   this whole section exists to prevent.
2. **The median age moves 38 → 40–41**, and the SPREAD widens: today every «plays on» career ends at
   the same birthday, and the point of the change is that they stop agreeing.
3. **A wrecked body ends earlier than 38** on at least some careers – if nothing finishes before the
   old floor, the rule is still a birthday wearing a costume.
4. **The other three endings do not move**: bankruptcy 51.1% at 17, injury 7.8% at 31, plateau on the
   «her words» arm at 48.9%. This change must not steal careers from them.
5. **`condition.test.ts` unmoved** – 41550 / `e6b0c709`.
6. ⚠ **The injury prevalence does not get worse** (§4a's risk). Re-taken on the FIXED
   `pro-season-probe`, the professional band is 30–54% and today reads 71%. The recovery fade may not
   push it further – if it does, `recoveryAgeFloor` rises until it does not. **This is a veto
   condition, not a note**: the fade is a texture, and it may not buy texture with a prevalence that
   is already over.
7. **She opens her last seasons able to play them** – the fatigue spec's `>= 90` at the season door
   holds through the mid-thirties and drifts below only in the final years. A career that arrives at
   the off-season door unable to recover has been ended by the wrong system.

---

## 7. The questions that are his

1. **The threshold: 55%, or another row of §3a's table?** 70% is today's game unchanged; 55% is the
   Federer ceiling; 50% starts to get long.
2. **Does the plateau offer change at all?** It is untouched by this proposal and stays a question the
   parent answers. A body-driven last word and a results-driven mid-career question are different
   things, and I would leave the second alone.
3. **Can she come back?** He mentioned it – Federer «решил снова вернуться». This spec deliberately
   does NOT propose it: an ending that can be undone is not an ending, and the album is built on the
   latch. If he wants it, it is a separate design with its own risks, and it should be argued on its
   own rather than smuggled in beside a threshold.
4. **Does the fade need to be VISIBLE before the end?** Today nothing tells the player her physical is
   falling; the first news is the offer. A quiet line in the season summary from the first year past
   the peak would make the goodbye long rather than sudden – which is the word in his own question.

---

## 8. Steps

⚙ **§7.1 IS ANSWERED (26.08): 55%.** Steps 1–4 are unblocked. Step 5 and §7.2–7.4 are still his.

| # | step | done when |
| --- | --- | --- |
| **1** | the stored peak, with its schema move – written, migrated, fixtured, and read by nothing yet | a golden fixture round-trips it and `e2e:fixtures` is green |
| **2** | the trigger moves to the share; `stopAskingAgeYears` deleted | at 70% the endings bench reproduces §2 byte for byte – the proof the generalisation is exact |
| **3** | the threshold set to his answer, and §6 re-measured | the five acceptance numbers |
| **4** | her last word – the card's final state and the event line | the copy reads as hers, and the parent is not asked a question with one legal answer |
| **5** | *(optional, §7.4)* the fade becomes visible in the season summary | a season past the peak says so without naming a number |
