---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-17
---

# The second seat – who pays for the coach's ticket

Round-21 #2, the round's last open item. Shipped 17.08 on `wave/round21`.

## The rule, in one sentence

> **A sponsor's travel share comes off both seats. A scholarship comes off hers alone.**

The coach's fare is covered at the rungs that pay prize money, by the deal's own
`KitOfferTerms.travelShare` – the same number her own fare reads. There is no second term, no second
constant and no second percentage.

## What the owner asked for, and what he asked for instead

He scoped it himself before anyone built anything:

> «Про спонсоров и оплату доли поездки тренера я говорю только для профессиональной лиги и контракте
> с большими спонсорами… На всех остальных ступенях развития ничего не меняем пока что.»

> «Спонсоры в про лиге и 25% покрытия – это самое простое и понятное, что мы можем сделать, не вижу
> причин откладывать.»

The first build took that literally: a flat `ECONOMY.sponsorship.coachTravelShare = 0.25`, a
`coachFareShareFor` mapping deciding which rungs were "big", a new optional `KitOfferTerms` field to
persist it, and a second line on the offer letter. Seeing it, he refused the machinery:

> «может быть нам не надо лишней логики делать, а стоит просто стоимость поездки на 2 умножать, если
> галочка включена в тренерской? тогда у нас не будет этого слоя противоречивой логики нигде»

**He was right on the measurement as well as on the principle**, which is the part worth recording.
Measured across the same calendar before the rework:

| family | first build (flat 25%) | «×2» on her net price | delta |
|---|---|---|---|
| no support, no deal | $515,075 | $515,075 | **0%** |
| no scholarship, `global` deal | $386,306 | $386,306 | **0%** |
| full scholarship, no deal | $321,922 | $128,769 | −60% |
| no scholarship, `icon` deal | $257,537 | $128,769 | −50% |
| full scholarship + `icon` deal | $209,249 | $32,192 | −85% |

*(All prize-money trips on one generated calendar, so read these as ratios rather than as a season
actually played.)*

The two builds are **byte-identical for every family without a scholarship** – `global`'s own travel
share is 25% and the flat term was 25%, so the second concept was arriving at the first one's number.
That is the whole case for deleting it.

## Why it is not his literal proposal

Doubling **her net price** would have let the academy scholarship pay for the coach again – the
−60% row above, about $193k over that calendar – and that is the exact bug the owner raised as a
principle on 15.08:

> «Мы делали механизм точечной поддержки нуждающихся, этот механизм не должен поддерживать их
> чрезмерные траты, только помочь дожить до призов. Вот что надо проконтролировать.»

So the rule is *the **sponsor's** share on both seats*, not *her price, doubled*. The distinction is
the difference between an instrument gated on **need** (granted, revocable, may not fly the entourage)
and one gated on **standing** (earned, the brand's own money, may). For a family whose only cover is a
contract the two readings coincide exactly, and his sentence is literally true: **the trip costs
double.** `tests/support-never-pays-the-coach.test.ts` §4 asserts precisely that identity.

## Where each half is read

| | her seat | the coach's seat |
|---|---|---|
| sponsor's `travelShare` | yes, everywhere | yes, **prize-money rungs only** |
| academy scholarship | yes, everywhere | **never** |

- **The sponsor gate** is the deal's own persisted term, via `kitTravelShare(world.offers, week)`. A
  rung that pays nothing towards travel (`local`, `national`) covers nothing here either, without
  being named.
- **The prize-money gate** is `TIERS[event.tier].prizeCents !== undefined` – the same test that
  already decided whether he comes at all, not a second rule. It is the owner's «только для
  профессиональной лиги». A junior rung the player bought with `coachOnJuniorEvents` is paid in full
  by the family: nothing comes back from it, and no brand sponsors a trip to one.

## Saves

**No schema change, no migration, no version bump.** The rework deleted the only new persisted field.
An existing deal already carries `travelShare`, so a save from before today starts covering the
coach's seat the moment it loads – a benefit, applied to a term she already holds, with nothing to
migrate.

## What this is a model of – stated honestly

`docs/research/sponsor-travel-terms.md` is blunter than the mechanic:

- **No published endorsement contract pays competition travel.** The travel clauses that exist are
  scoped to appearances the athlete makes *for the brand*. `[S]`
- **The one primary document that mentions the coach's travel bills the player for it.** The ITF's own
  W50/W75/W100 hospitality guidelines mandate a room for "the registered player only", and a support
  team member shares it at a supplement **the player pays**. `[S]`
- **Whole fares are paid by governing-body grants, not brands** – the ITF Grand Slam Player
  Development Programme. Different instrument, specced separately in `docs/specs/federation-grant.md`.

So this mechanic is an abstraction of a **cash flow** – a retainer she spends on the road – and not a
model of a contract clause. It is worth knowing that the evidence, if anything, supports the owner's
simpler instinct more than it supported the flat term the first build shipped.

## The guard

`tests/support-never-pays-the-coach.test.ts`, re-aimed rather than relaxed (14 arms, was 11):

- **§1** keeps its claim word for word, now over the **needs-based** streams only: his seat is the
  calendar's printed price, or he is not on the trip.
- **§2** was made **stricter**: at junior rungs *nothing* reaches his seat, asserted over the contract
  states too. A hand that dropped the prize-money gate goes red here and nowhere else.
- **§3** the ledger, unchanged in principle.
- **§4** is new and is the strictest section in the file. Every arm pins an **exact** figure from the
  deal's own term, because once one cover legitimately exists an inequality stops being enough:
  "cheaper than list" is satisfied by a scholarship leaking in.
  - the trip costs **exactly double** with no scholarship – the owner's own model;
  - the **two-way guard**: full scholarship + contract charges the same as contract alone, to the
    cent, while her own seat in that world is demonstrably cheaper;
  - the till charges exactly the term, the scholarship's tally never moves, and the ledger line names
    the payer;
  - the cover can never reach the whole fare – `coachTravelFareFor(...) > 0` is what decides whether
    he is *at the court*, so a 100% cover would silently mean "he did not come".

**Mutation-verified.** Restoring the cover on his seat (`return travelCostFor(world, event)`) turns
**9 of 14 red across all four sections**. The five that survive are legitimately insensitive to that
mutation – no cover to leak, or claims about her seat and the academy tally – and each has a red
sibling.

## Open for the owner

1. **`global` has a junior door.** It is reachable on the ITF table (top 32) as well as at WTA #51–87,
   so a girl who has never held a professional ranking can hold a deal that covers the coach. She only
   ever collects it at an event that pays prize money, so the money arrives on the professional
   calendar – but the *contract* can be signed before she gets there. Left as built; flag if unwanted.
2. **Not measured over a career.** `tools/ladder-baseline.ts` and `tools/econ-bench.ts` cannot measure
   this: **no bench career ever signs a sponsor letter** (`acceptOffer` is never called), so both arms
   return an identical diff – the null-arm trap in CLAUDE.md. The only tool that signs deals is
   `tools/real-vs-bench.ts`, which needs a personal `.tsave`. Measuring what the cover is worth over a
   career needs a probe that signs from a floor rung; not built, and not built quietly either.
