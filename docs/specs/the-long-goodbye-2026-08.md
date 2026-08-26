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

⚠⚠ **THIS TABLE WAS WRONG IN THE FIRST DRAFT AND THE BUILDER CAUGHT IT (26.08, step 1's report).**
I computed the curve with age as a STEP FUNCTION – one `declineFactor` per year, held constant across
its 52 weeks. The engine advances her age **every week**, so the factor rises continuously and the
real curve is 2–3 points kinder at every age. Verified three ways before the correction was accepted:
the builder's own arithmetic, its three walked careers, and my re-derivation with a weekly-advancing
age, which reproduces its figures to a tenth of a point. ⭐ **And the wrongness was visible inside this
file without measuring anything** – §3a said the 70% threshold fires at 38 while this table said 66%
was left at 38. Two tables of mine disagreed and I shipped them.

| age | lost that season | share of peak PHYSICAL left |
| --- | --- | --- |
| 29 | 2.0% | 100% |
| 33 | 4.0% | 89.3% |
| 35 | 5.0% | 81.8% |
| 37 | 6.0% | 73.5% |
| **38** | 6.4% | **69.1%** |
| 40 | 7.4% | 60.2% |
| **41** – Federer's age | 7.9% | **55.7%** |
| 43 | 8.8% | 47.0% |
| 45 | 9.7% | 38.9% |

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

⭐ **THIS TABLE WAS ALWAYS RIGHT** – it is the half that reproduced against the shipped curve when
§1 did not, and it is why the owner's ruling needed no revisiting. Figures below re-derived 26.08 on
the weekly-advancing age and stated to a tenth.

| threshold | last offer lands at (undamaged) | what it means |
| --- | --- | --- |
| 70% of peak | **37.8** | ⭐ **today's rule exactly** – the change is a strict generalisation |
| 65% | 38.9 | |
| 60% | 40.0 | |
| **55%** | **41.2** | ⭐⭐ **RULED BY THE OWNER, 26.08: «я бы взял 55% по уходу – согласен, звучит ок»** – Federer's age, reachable only on a body kept well |
| 50% | 42.3 | |
| 45% | 43.5 | the tail gets long and the tennis gets sad |

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

⚠ **RE-TAKEN 26.08 on the corrected curve** – the first version of this table copied §1's wrong
column and inherited its error.

| age | share of peak left | rest week returns | note |
| --- | --- | --- | --- |
| ≤29 | 100% | 5.00 | untouched – the peak is the peak |
| 33 | 89.3% | 4.46 | |
| 36 | 77.7% | 3.89 | |
| 38 | 69.1% | 3.45 | |
| **41** | 55.7% | **2.79** | at the threshold that ends the career |
| 43 | 47.0% | **2.50** | ⚠ the floor, `recoveryAgeFloor: 0.5` – approved 26.08, «пол 2.5 ок» |

⚠ The right-hand column is what the ENGINE holds. What a screen shows is that number rounded – see
the rule directly below, which he set the same day.

### ⚙ 26.08 – IT ALREADY FADES EVERY YEAR, and the sparse table was mine

> «можно даже сделать на каждый год затухающую динамику – будет вообще красиво, а не жесткую привязку»

⭐ **It is already exactly that, and the "hard binding" he saw was my table's sparse rows rather than
the mechanic.** Because the multiplier is the share of peak, and the share moves every week, the
recovery moves every year with no steps in it at all. Taken off the shipped `declineFactor`:

| age | body left | engine holds | screen shows |
| --- | --- | --- | --- |
| 29 | 100% | 5.00 | 5 |
| 30 | 98.0% | 4.90 | 5 |
| 31 | 95.5% | 4.77 | 5 |
| 32 | 92.6% | 4.63 | 5 |
| 33 | 89.3% | 4.46 | 4 |
| 35 | 81.8% | 4.09 | 4 |
| 37 | 73.5% | 3.67 | 4 |
| 38 | 69.1% | 3.45 | 3 |
| 40 | 60.2% | 3.01 | 3 |
| **41** | 55.7% | **2.79** | 3 |
| 42 | 51.3% | 2.57 | 3 |
| 43 | 47.0% | 2.50 | 3 ⚠ floor |

⚠⚠ **AND THE FLOOR TURNS OUT TO BE ALMOST INERT, which is worth knowing before it is built.** It
first bites at **43** – nearly two years AFTER the 55% threshold has ended the career at 41.2. So under the
settled rules it is a safety net that fires on essentially no career: it exists for the outliers (a
body that somehow held past the threshold, a migrated save, a future rule change) and not as a dial.
⭐ That is the right shape for a floor and it means §7 has one fewer number to tune – but nobody
should later "raise the floor to fix something" without noticing it is not currently doing anything.

**One question this leaves open, and I would not change it without measuring.** Recovery could fade
FASTER than the body rather than in step with it – physiologically that is truer, and a veteran who
still hits hard but cannot back it up two days later is the more accurate portrait. It would cost a
second accel constant. **My recommendation is to ship the derived version first**: it needs no new
number, the table above already reads right, and §6's measurements will say plainly whether the last
seasons are too easy. Adding a curve before the measurement is tuning something nobody has felt yet.

### ⚙ 26.08 – FRACTIONAL IN THE LOGIC, WHOLE IN THE INTERFACE (his rule, and it is general)

> «у нас в логике могут быть дробные числа – это окей, а у пользователя целые в интерфейсе»
> · «пусть падает, но на фронт едет в отображение округленное значение»

⚠ **THE CORRIDOR IS CONTINUOUS AND MUST STAY SO.** My first reading quantised the mechanic itself to
5 → 4 → 3 and he corrected it: the ENGINE keeps the fraction and it keeps falling; only the number
that reaches a screen is rounded. A quantised recovery would make the fade arrive in three visible
jumps instead of as a slope, which is the opposite of what §4a is for.

**Rounding is `Math.round` – half away from zero, «по правилам математики».**

⚠⚠ **AND IT HAPPENS ONCE, AT THE SNAPSHOT BOUNDARY, NOT IN EACH COMPONENT.** Verified 26.08: today
`buildSnapshot` hands `world.condition` over RAW (`snapshot.ts:960` and `:1093`) and the components
each round it themselves – `KidScreen.vue:198` and `TournamentFlow.vue:936` both carry their own
`Math.round`. That is two sides asking the same question separately, this repo's most-repeated defect
class, and the third caller that forgets will print `73.41999999` on a screen. **The snapshot is the
boundary and it is where the rounding belongs**, so a component cannot get it wrong by omission.

⭐ **This is a house rule, not a detail of this spec.** Any number that crosses into `Snapshot` for a
person to read is whole; the fractions stay behind it. Cents are already integers and stay integers.
A guard test should pin it for `condition` and the recovery figure at minimum.

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
