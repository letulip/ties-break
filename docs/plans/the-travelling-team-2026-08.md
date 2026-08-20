---
type: plan
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-19
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

## 4. ⚠ The trap to avoid

**Do not let the staff become strictly-buy.** If a masseur pays for himself in fewer injury weeks and
a psychologist in more matches won, the correct play is "hire both, always", and two decisions
collapse into a loading screen. Each must be a genuine trade:

* the masseur competes with the COACH for the same seat on the plane;
* the psychologist competes with the coach's own rung – a better coach or a head to talk to.

## 5. Sequencing

1. **Salaries only, no travel** – both hires, weekly cost, measurable effect. One screen, one ECONOMY
   block, no new travel logic at all.
2. **The masseur's fare**, through `coachTravelFareFor`'s existing rule asked for a second seat.
3. **Measure against the sponsor.** Re-run the travel line with three seats and check that Meridian's
   half lands where §3 predicts.
4. Only then tune the effects.

⚠ Each step needs a bench arm and a spec recording predicted vs measured (`CLAUDE.md` invariant 4),
and step 1 alone is a save-schema move – the hires must persist.

## 6. Open for him

1. **Does the psychologist travel at his option?** Ruling says remote, but a paid trip to a Slam is a
   good decision to own.
2. **Does the masseur unlock earlier than the professional career?** Alice's physio line is already
   $3,056/yr at 18, so the body is being paid for before the tour.
3. **Is «профессионально звучит» a target?** He asked it as a question. A ~340k staffed year IS the
   real shape of a top-100 operation – so the answer is yes, and the design question is whether the
   game should let him get there before the prize money does.
