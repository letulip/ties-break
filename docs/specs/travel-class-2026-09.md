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

## 4. The three shapes, and my reading

**A – per trip.** The class is chosen when she enters an event, beside the entry fee. Most control,
most clicks: 31 entries in his last season means 31 more decisions a year on a screen he already
called busy.

**B – a standing policy.** One setting the family holds – economy / standard / business – changed
whenever he likes, applied to every fare from then on. One decision, revisited when the money
changes, which is how a household actually behaves. ⭐ **My reading.**

**C – B, plus a second policy for the team.** Her class and the team's class set separately, which
is his «для специалистов отдельно» read literally. It is honest – the coach's fare is a real
uncovered line today – and it is a second dial on a screen that would then hold two.

**My recommendation: B now, C's second half only after he has seen the team's fares as their own
line in the ledger.** Today they are inside `coaching` and `staff`, so a player asked to economise
on the team's seats cannot see what he is economising.

## 5. If B is chosen – the work

| step | what | proof |
| --- | --- | --- |
| 1 | `ECONOMY.travel.classes`: three rungs, each a fare multiplier and a condition delta | the table, and the plane still strictly better than the best class |
| 2 | `world.travelClass` persisted, defaulting to `standard` – ⚠ a schema bump and a migration that writes `standard` into every old save | `tests/goldenSaves.test.ts` over all 71 fixtures |
| 3 | The multiplier applied at the HEAD of the sponsors.ts chain, before every cover | one function, and the ledger's travel line equals the sum of the seats |
| 4 | The gate: the control appears only when `wtaEverCounted(world)` | a mounted test at both sides of the gate |
| 5 | The condition delta into the travelling week | `tools/fatigue-bench.ts` before and after |
| 6 | A season of each class, walked | `tools/econ-bench.ts`: what a season costs and what her mean condition is, per class |

**Effort: 2-3 days, of which the migration is half.** **Risk: the schema move.** Everything else is
arithmetic on a chain that already exists.
