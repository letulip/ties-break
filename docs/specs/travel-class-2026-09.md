---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-09-06
---

# The travel class – round 38 item 1

**HIS ASK, 06.09:** «Добавить возможность выбирать стоимость перелета с про уровня, может быть для
специалистов отдельно даже».

⚠⚠ **THIS SPEC SHIPS NOTHING UNTIL HE PICKS A SHAPE.** Three are offered in §4; the rest of the
document is what is true today, so whichever he picks lands on facts rather than on a guess.

---

## 1. What a fare is today

A fare is a fact of the EVENT, not a choice of the family. `season/calendar.ts` draws
`travelCostCents` per event from the tier's own band, scaled once by `ECONOMY.travelBgFactor` – the
family's background, chosen at the start of the career and never again. From there it is only ever
REDUCED, by a chain that lives in `world/sponsors.ts`:

```
event.travelCostCents
  -> netTravelCents(fare, academy)        the academy's travelCover (0.75 at level 1)
  -> kitTravelShare(offers, week)         the sponsor's travel share, when the deal carries one
  -> afterOwnPlaneCents(world, fare)      the plane rung off the shelf takes its share
  = what the family pays for HER seat
```

⚠ **AND THE TEAM RIDES A DIFFERENT LINE ALREADY.** `world/sponsors.ts:837` is explicit: her fare
keeps every cover it has ever had, and the coach's is `event.travelCostCents` at **full price**, with
no cover of any kind. The masseur (`masseurTravels`) and the physio are the same. So «для
специалистов отдельно» is not a new split – the split exists, and what is missing is a DIAL on it.

Measured on his own week-1115 career, one week of the calendar: a `local` fare is $92.81, a `j30`
$1,667.54, a `wta500` $4,656.23 and a `slam` $5,486.90. Travel is the largest single line in the
game (`ECONOMY` header: «travel overtaking the coach as the top cost centre once the international
calendar opened»), which is exactly why a dial on it is worth having and exactly why it is dangerous.

## 2. What «с про уровня» has to mean

The professional rungs are `w15` and above (`activeLadderOf` returns `'wta'` / the ITF W track).
Before that she is a junior travelling with a parent, and a class choice there would be a shop for a
fourteen-year-old. So the gate is the same one the game already draws for the on-ramp, and it is
read, never re-spelled: the choice appears when `wtaEverCounted(world)` is true.

## 3. What a class must NOT be

⚠ **It must not be a pure money sink.** «Мы ни за что не наказываем» cuts both ways: a cheaper seat
that only saves money is a free win and the choice is not a choice. A class has to buy something the
player can feel, and the game already has the currency: **condition**. `ECONOMY.condition` prices a
travelling week at a cost to her body, and `world/medical.ts` already adds a point back for the
plane rung off the shelf – so the seam exists, has a precedent and is one number wide.

⚠ **It must not become a second plane.** The shelf's plane rung is the END of this ladder, not a
competitor to it: whatever a class can buy, the plane must still be strictly better.

## 4. HIS DESIGN, 06.09 – and it is bigger and better than the three shapes I offered

He read the three and replaced them with one, which reframes the item from «a dial on a fare» to
«stop pricing the world by who is looking at it». In his words:

> «Идея в том, что она сама может первым классом лететь (пока самолета нет), например, а тренер и
> массажист бизнес или эконом. И может быть бизнес/первый/эконом как-то на ее состоянии отражаются.
> И когда мы снимаем бонусы для рабочей с средней семьи на цены перелетов тоже надо понять, как раз
> под это можно и стоимость билетов сделать и сразу дать пользователю выбор в Family budget где-то,
> тогда он сможет туда возвращаться сам и не будет жестко привязан к нашим ценам, и нам вообще не
> надо следить кому и какие цены ставить – будет просто цена билетов.»

Three things, and the third is the one that matters most:

**4a. The class is PER PERSON, not per family.** Her seat and the team's seats are separate choices –
she flies first while there is no plane, the coach and the masseur fly business or economy. ⚠ This is
the shape the code already has (`world/sponsors.ts:837`: her fare carries every cover, his is the
full price) and it is why C was the honest option and A/B were not.

**4b. The class reaches her CONDITION.** «может быть бизнес/первый/эконом как-то на ее состоянии
отражаются». The seam exists and has a precedent: the plane rung off the shelf already adds a point
to a travelling week in `world/medical.ts`. ⚠ Only HER seat may touch her condition – the coach
flying economy is a cost decision and not a fatigue one, unless we also want a tired coach to be
worth less, which is a different feature and should not arrive by accident.

**4c. ⭐⭐⭐ THE FARE STOPS BEING PRICED BY WHO IS BUYING IT.** Today `ECONOMY.travelBgFactor` scales
every fare by the family's background, so a working family and a wealthy one are quoted DIFFERENT
prices for the same flight. That is a strange object: it is a wealth simulation wearing a price tag,
and it means every future fare question («is a Slam trip too dear at 15?») has three answers and no
way to check any of them. His replacement is exact and it is simpler than what is there:

    a ticket has ONE price, and what the family chooses is which ticket to buy.

⚠⚠ AND THAT IS WHY THE CLASS CHOICE HAS TO SHIP WITH THE REMOVAL AND NOT AFTER IT. Delete
`travelBgFactor` alone and a working-class career's costs jump with nothing to answer them; give the
family a class dial and the poor family flies economy, which is the SAME saving arriving as a
decision instead of as a hidden coefficient. Two halves of one change.

**4d. Where it lives: Family budget.** «сразу дать пользователю выбор в Family budget где-то, тогда
он сможет туда возвращаться сам». A standing setting on the money screen, beside the household strip
(`components/HouseholdStrip.vue`, «Household, every week») – not a decision re-asked at every entry.
That is the B I recommended, arriving as the home for his C.

## 5. My considerations, since he asked for them

**5a. ⚠ The one real risk: a third compounding wealth advantage.** Money already buys coaching and
medicine, both of which reach the court. If a class reaches her condition, travel becomes the third,
and the three multiply. The defence is to size the condition delta so it is **smaller than one
week's difference between a rested and a travelling week** – a real but not decisive edge – and to
measure the win-rate gap between a career that always flies first and one that always flies economy
before anything ships. If that gap is large, the feature is a money faucet on results and should be
cost-only.

**5b. The plane must stay strictly better.** The shelf's plane rung is the end of this ladder. First
class has to be worth less than owning the aircraft at every fare, or the shelf's most expensive rung
is beaten by a setting.

**5c. «Мы ни за что не наказываем» cuts both ways.** Economy must not injure her – it is a smaller
recovery, never a penalty – and first class must not be mandatory to compete. If the top class is
needed to keep up, the dial is not a choice.

**5d. What it costs to build.** The class table and the per-person choice are small. The expensive
half is 4c: deleting `travelBgFactor` moves the largest cost line in the game for every existing
career, so it needs `tools/econ-bench.ts` over the three backgrounds before and after, and it will
move the frozen careers.

**5e. What I would NOT do.** Do not put a class on the junior rungs. Before the professional tiers
she travels with a parent to a national event, and a first-class dial there is a shop for a
fourteen-year-old, not a decision.

## 6. If it is built – the work

| step | what | proof |
| --- | --- | --- |
| 1 | `ECONOMY.travel.classes`: three rungs, each a fare multiplier and (her seat only) a condition delta | the table, and the plane still strictly better than first |
| 2 | The base fares re-derived without `travelBgFactor` – one price per tier | `tools/econ-bench.ts` over three backgrounds: what a season costs before and after |
| 3 | `world.travelClass: { her, team }` persisted, defaulting to the class whose cost matches today's background factor – ⚠ a schema bump and a migration, so no existing career's bill jumps | `tests/goldenSaves.test.ts` over every fixture |
| 4 | The multiplier at the HEAD of the `world/sponsors.ts` chain, before every cover | the ledger's travel line equals the sum of the seats |
| 5 | The control on the money screen, beside the household strip | a mounted test, and the gate at `wtaEverCounted` |
| 6 | The condition delta, sized under one travelling week | `tools/fatigue-bench.ts`, and the win-rate gap of 5a |

**Effort: 3-4 days, and 4c is most of it.** **Risk: the largest cost line in the game moves for every
career.** That is the reason this document exists before the work does.
