---
type: plan
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-22
---

# The travelling team – masseur and psychologist (owner, round 23 item 9)

His brief, verbatim:

> «И наверное пора задуматься над логикой психолога и массажиста, чтобы с ними тоже ездить в поездки.
> Думаю, что эти специалисты могут открываться в про карьере. (В этом случае 50% скидки на поездки
> может быть вполне мощным предложением) Но надо подумать и посчитать. Текущие траты у меня в год 70к
> поездки с носа (того 140к), 23к тренер. Значит если ещё +2 специалиста, это ещё +46к (или сколько
> они стоят) и +70-140к на билеты… Итого примерно 280к затрат только на этих ребят. Профессионально
> звучит, кстати? Итого тотал по году примерно 340к затрат.»

And his ruling, given after the two shapes were put to him:

> «Б — массажист ездит, психолог работает дистанционно и стоит только зарплату. …да, надо
> распланировать.»

---

## 1. His arithmetic, checked against the game

⚠ He estimated from one screen; these are read out of his two saves' own ledgers
(`tools/round23-read.ts`, per-category, annualised over the 60 weeks the ledger keeps):

| | Ines, 24 | Alice, 18 |
| --- | ---: | ---: |
| travel | **$129,856** | $30,249 |
| vacation | $29,310 | $2,177 |
| coaching | $24,028 | $6,431 |
| entries | $18,287 | $11,483 |
| facility | $11,423 | $6,228 |
| physio | $2,982 | $3,056 |
| gear + stringing | $3,661 | $4,452 |
| **all outgoings** | **≈$220,000** | **≈$64,000** |

**His travel and coach figures are right** – $130k and $24k against his 140k and 23k. So the ~340k
year he sketched is the honest shape of a fully-staffed one.

⚠⚠ **BUT THE OTHER SIDE OF HIS LEDGER CHANGES THE WHOLE QUESTION.** Ines banks **$2,566,200** of
prize money a year, and **$251,439 of interest alone** – her interest exceeds every outgoing she has,
combined. At her level the staff is not a burden; it is the only thing money can do.

**So the item has two different answers depending on WHEN:**
* at Alice's stage (18, $64k out, $113k prize) two more salaries are a real decision;
* at Ines' stage they are a rounding error, and the design problem is the opposite one.

---

## 2. The shape, per his ruling

| | masseur | psychologist |
| --- | --- | --- |
| **travels** | ✅ yes – the reason the item exists | ❌ no, remote |
| **costs** | salary **+ fare**, like the coach | salary only |
| **unlocks** | professional career | professional career |
| **what he buys** | the body: `condition` recovery, and the injury tail | the head: `composure` under pressure, and the tilt after a loss |

⭐ **The asymmetry is the design, not a saving.** Two identical hires priced differently are one hire
with a slider. A masseur who must be flown and a psychologist who need not be are two different
decisions – and the fare is exactly what makes the first one hurt.

## 3. What it costs, and the number that decides it

The coach's own fare machinery is already there (`coachTravelFareFor`, `chargeCoachTravel`), so the
masseur's fare is that rule asked a second time – **not a second implementation.** Round 22's ruling
applies verbatim: the owner refused a parallel travel model («может быть нам не надо лишней логики
делать, а стоит просто стоимость поездки на 2 умножать») and the same reasoning holds for a third
seat.

**Proposed bands, to be measured before they ship:**
* masseur salary ≈ **half** the coach's rung (he is hired for one thing, not for her whole game);
* psychologist salary ≈ **a third**, and no fare;
* both gated on the professional career, both cancellable weekly like the coach.

⚠ **Then Meridian's 50% becomes the strong offer he suspects** – and this is the load-bearing
interaction. Two seats become three, the travel line roughly **doubles**, and half of a doubled bill
is back where the family started. The discount stops being a holiday from the economy and becomes
what pays for the staff.

## 4. ⚠⚠ CORRECTED BY THE OWNER – the goal is NOT a forced trade

I proposed making each hire compete with the coach: the masseur for the seat on the plane, the
psychologist for the coach's rung. **He rejected it (19.08), on two grounds, and both are right:**

> «Это разные специалисты и игрок может сам решать надо их с собой возить или нет. Это раз. А два –
> не факт, что другие карьеры будут по 2,5 млн в год поднимать, далеко не факт. Наша задача сделать
> так, чтобы специалисты не были декоративными, а реально несли какую-то пользу и это было видно и
> заметно. Вот это надо проработать.»

⭐ **The first ground is a design point I had backwards.** A manufactured rivalry between a masseur
and a coach is a slider wearing two hats – the player is not choosing between two people, he is being
told he may only have one. Whether to fly a specialist is ALREADY a decision, because the fare is
already real; it does not need an artificial opponent.

⚠ **The second corrects a measurement error of mine.** I sized the item against Ines' $2.57M year.
That is the TOP of a career and it is not typical – Alice at 18 banks $113k against $64k of costs, and
most careers never reach either. Designing the staff so it only reads as a decision for a
multi-millionaire is designing it for the one player who does not need it.

### ⭐ So the real task, in his words: they must not be DECORATIVE

The failure mode is not "too cheap to matter". It is **"you paid, and you cannot tell"** – a salary
that leaves the ledger every week against an effect buried in a distribution the player never sees.
That is the thing to work out, and it has two halves:

1. **The effect must be real** – large enough to survive the noise of a season, not a 1% nudge that
   only a bench can find. It must be measurable in the units the player already reads: weeks not
   lost, matches not thrown away after a bad start.
2. ⚠ **AND IT MUST BE LEGIBLE, which is the harder half.** The game already knows how to do this and
   how to fail at it. The coach's room note says what he is worth in plain words and quotes no figure
   (round 23 #1). The academy paid $20,879 of fares and the owner never noticed it existed (#16). A
   specialist whose benefit lands only inside `condition` will be exactly the academy again.

**Concretely, before either hire ships:** name the sentence the player reads that tells him the
masseur earned his fare this month, and the one that tells him the psychologist did. If neither can
be written, the effect is in the wrong place – fix the effect, not the sentence.

## 5. Sequencing

⚠⚠ **RE-CUT 22.08, BY THE OWNER'S RULING: the psychologist leaves step 1.** As first written, this
plan and `the-private-life.md` §4 contradicted each other – step 1 shipped his salary while that
section (and §4 above) proves his only LEGIBLE effect is shortening a recovery curve that does not
exist before the private-life layer. His channels here («composure under pressure», «the tilt after
a loss») are not in the engine at all. A salary the player cannot see working is this file's own
named failure, so the owner split the step:

1. **The masseur, whole** – salary + the body effect (condition recovery, the injury tail: channels
   that exist today) – and the SENTENCE named before it ships, per §4's rule: a room-note-style line
   about the weeks his hands did not lose, quoting no figure. *(SHIPPED 22.08 – the spec's §§1–4.)*
2. **The masseur's fare**, through `coachTravelFareFor`'s existing rule asked for a second seat.
   *(SHIPPED 22.08, folded with the owner's round-24 price challenge: the flat salary became his
   own sessions DIAL, and the fare's step landed with what it BUYS – recovery between rounds on
   deep runs. The spec's §§5–6.)*
3. **Measure against the sponsor.** Re-run the travel line with three seats and check that Meridian's
   half lands where §3 predicts. *(MEASURED 22.08 – unit-pinned half-price seat + the grid; the
   spec's §§6–7. One honest correction: the psychologist went remote by the ruling above, so the
   «doubled» line of §3 is a 1.5× with the seats that actually exist.)*
4. Only then tune the effect. *(23.08: the §5 pricing table WAS ruled the same day this line was
   written – «утверждаю, для начала точно ок», amended +1/+2/+3 / per-match tour pricing / the
   return-week session, recorded in the masseur spec §§5, 9. What remains of this step is the
   OPTIONAL retune window: rungs, `tourRecoveryPerRound`, `returnSessionBonus`, `ECONOMY.staffShare`
   – one-line constants, the §11 grid re-runs as-is. Indexed in
   `docs/backlog/the-team-around-her.md`.)*

⭐ **The psychologist ships with `the-private-life.md` STEP 5**, where shortening the 3b recovery
makes him legible without a single number. His salary, his remote-only ruling and §6's open travel
question all move there with him.

⚠ Each step needs a bench arm and a spec recording predicted vs measured (`CLAUDE.md` invariant 4),
and step 1 alone is a save-schema move – the hire must persist.

⚠ **AT COLLEGE, THE COACH'S RULE APPLIES TO EVERY SEAT (round 24):** the retainer is SUSPENDED, not
cancelled – the coach's own precedent – and hiring inside the freeze refuses with the college
sentence rather than the ended one (`COLLEGE_FREEZE_REFUSAL`). No specialist decision should reach a
girl the programme is coaching.

## 6. Open for him

1. **Does the psychologist travel at his option?** Ruling says remote, but a paid trip to a Slam is a
   good decision to own. *(Deferred with him, 22.08 – asked again when the private-life layer builds
   him.)*
2. **Does the masseur unlock earlier than the professional career?** Alice's physio line is already
   $3,056/yr at 18, so the body is being paid for before the tour.
3. **Is «профессионально звучит» a target?** He asked it as a question. A ~340k staffed year IS the
   real shape of a top-100 operation – so the answer is yes, and the design question is whether the
   game should let him get there before the prize money does.
