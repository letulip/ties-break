---
type: spec
status: current
area: simulation-and-balance
canonical: true
last-reviewed: 2026-09-12
---

# One market, different baskets — round 41 P1 (12.09.2026)

**The model in one sentence:** an item has ONE price; a family's background decides which items it
habitually buys and how often, never what an item costs it — and the wealth corridor survives only
where the thing being bought is a SERVICE at the bottom of its own ladder.

## Current truth

* **Gear is priced by the RUNG and by nothing else.** `ECONOMY.gear[*].price` is a `by: 'rung'`
  band for strings, frames and shoes, identical for every background; apparel — the one line with no
  quality ladder — keeps a `by: 'basket'` band, because its three tiers are three different products
  rather than one product with three prices. `kitLinePriceCents(line, grade)` takes no background.
* **Cadence stays per-background.** A wealthy family replaces gear oftener; that is behaviour, and it
  is the other half of «different baskets».
* **The wealth corridor prices services at the LOWER tiers only.** `corridorAppliesAt(tier)` —
  `self` / `budget` / `middle` keep ±25–30%; `high` / `elite` are exactly 1.0 for every background,
  on the coach line, the facility line and the medical bill. `corridorBandFor(background, tier)` is
  the only place it is applied.
* **Travel, vacations and practice fees keep the corridor** (he named travel as a keeper; it has no
  tier axis). **The masseur never had one.**
* **No schema move** (v74 stands), **no player-facing string changed**, **zero RNG movement**: a
  uniform tier still spends its corridor roll at `[1, 1]`, and `pickInt` spends one `rng()` call
  whatever its bounds.
* ⚠ **One balance consequence is open and is the owner's:** a wealthy family with an elite coach no
  longer burns money in an idle year (+$6,280 → −$4,917 on the 16-seed calibration batch), so the
  round-7 «premium everything must hurt» principle is un-funded rather than refuted. §3 and
  `tests/economyCalibration.ts`'s `BANDS` block carry the decomposition and the two levers.

## 1. The two rulings this is built from, verbatim

> «на рынке цены для всех сословий одинаковые, просто каждый покупает те товары, которые может…
> Я не против разлета цен, просто получается, что топовая ракетка для рабочей семьи стоит около 1к
> долларов, а для богатой 2.2к… Мне кажется это немного странно. Давай подумаем как здесь лучше
> сделать»
>
> — and on the proposal: **«P1, запускай»**.

> «Коридор ±25–30% остаётся только на сервисах (физио, перелёты, тренер) и то только на нижних
> тирах, мне кажется что в про карьере с большими чеками цены для всех должны быть равны. По крайней
> мере элит тренеры и массажисты мне кажется вполне могут стоить одинаково для всех.»

What he was looking at was a price with **two axes and one of them invisible**. A gear purchase cost
`mid(band[background]) × grades[grade].priceFactor`: the ladder named the product («Kestra Pro
Stock») and the background re-priced it, so the same object — identical `startWear`, identical
`lifeFactor`, identical effect on her arm — carried three price tags. That is not a corridor pricing
a market; it is one item with three stickers.

## 2. Part A — gear prices become rung-only and uniform

`GearLine.priceCents: Record<FamilyBackground, …>` became `GearLine.price: GearPricing`, a union:

* **`by: 'rung'`** — strings, frames, shoes. A band per `KitGrade`, identical for every background.
* **`by: 'basket'`** — apparel, and only apparel. It has **no quality ladder**, its three bands are
  three *different* products that no rung names («club basics» / «brand kit» / «full designer kit»),
  so a background-keyed price there is a background-keyed BASKET. «просто каждый покупает те товары,
  которые может» **is** this line, and it is deliberately untouched. If a ladder is ever offered on
  apparel, this shape goes with it.

`kitLinePriceCents` **lost its `background` parameter** rather than keeping it dead — a dead argument
invites the next caller to pass a background and believe it matters. The compiler named all six call
sites. `resolveGear` lost its post-draw `priceFactor` multiply: the rung is passed *into* the draw,
so cents are decided in exactly one place.

### The calibration: the old diagonal, written out

Each rung's band is the band of the background whose *flavour already described that rung's product*,
times that rung's shipped `priceFactor`:

| rung | anchor | × | frame | strings | shoes |
|---|---|---|---|---|---|
| `alloy` | working | 0.55 | $49.50 | $13.20 | $41.25 |
| `composite` | working | 1.00 | **$90.00** | $24.00 | $75.00 |
| `performance` | middle | 2.20 | $506.00 | $80.30 | $275.00 |
| `pro` | wealthy | 4.00 | **$2,260.00** | $230.00 | $820.00 |

…against the three prices each of those used to have (mid of band × factor):

| rung | frame, working | frame, middle | frame, wealthy | spread | **now** |
|---|---|---|---|---|---|
| `alloy` | $49.50 | $126.50 | $310.75 | 6.3× | $49.50 |
| `composite` | $90.00 | $230.00 | $565.00 | 6.3× | $90.00 |
| `performance` | $198.00 | $506.00 | $1,243.00 | 6.3× | $506.00 |
| `pro` | $360.00 | $920.00 | $2,260.00 | 6.3× | $2,260.00 |

His own two numbers are both in that table: the ~$1k top frame (the middle family's $920) and the
$2.2k one. **Under P1 the top frame is $2,260 for everybody** — a working family that wants the tour
frame pays the tour frame's price, which is the drama his sentence asks for, and a wealthy family
*can* buy the $90 club stick.

### 3. ⚠⚠ The predicted zero drift was FALSE, and this is the finding

The design predicted «zero drift by construction» on every background's DEFAULT basket, on the
premise that working defaults to the club rung, middle to performance and wealthy to pro. **The code
has never worked that way.** `DEFAULT_KIT_GRADES` is `composite` on all three lines for *every*
background (there has never been a per-background starting rung), and no engine path moves a rung —
`setKitGrade` is reachable from the Money screen and from nowhere else, so no career is ever pushed
onto a rung it did not buy. The diagonal therefore preserves the **working** family exactly and
cannot preserve the other two.

**MEASURED** (`tools/r41-one-market.ts` §1 — 64 seeds × 1,040 weeks per row, the real
`seed:gear:<category>` sub-stream walked twice, same draws, two price rules):

| background | old ¢/wk | new ¢/wk | drift ¢/wk | drift/season | predicted |
|---|---|---|---|---|---|
| working | 2,203.2 | 2,203.2 | **0.0** | **$0.00** | 0 exactly ✓ |
| middle | 4,918.5 | 3,095.7 | −1,822.8 | −$947.84 | −1,833 / −$953 ✓ |
| wealthy | 12,142.5 | 5,094.2 | −7,048.4 | −$3,665.15 | −7,077 / −$3,680 ✓ |

Per line (¢/wk): middle — frame −991.5, strings −416.3, shoes −415.0, apparel 0. Wealthy — frame
−4,293.9, strings −1,676.0, shoes −1,078.4, apparel 0.

**What that is, stated plainly:** a middle family's gear bill falls 37% and a wealthy family's 58%,
because both were paying a premium for an object identical to the working family's. **Nobody's bill
rises** — the one direction that would have been dangerous to ship quietly, since the $8k family is
the one that cannot absorb a surprise. The wealthy family now has somewhere to spend it (the ladder
is real money for the first time) and still replaces gear oftener, which is the cadence half of
«different baskets».

**Three one-line retunes, if he wants the default spend back — all his, none taken here:**
1. anchor `composite` at the middle band instead ($230 frame): working +160%, wealthy −59%. Rejected
   by default because it raises the poorest family's bill.
2. give each background a default RUNG (working `composite`, middle `performance`, wealthy `pro`).
   This restores the old spend to the cent — **and it changes PLAY**, because a rung moves
   `startWear` / `lifeFactor` / `frameInjuryRise`. It is a balance decision, not a price one.
3. raise the wealthy cadence (behaviour, not price) — the axis the model says the difference belongs on.

### The allowance oddity, half-dissolved

His second oddity: a working family's $12,000 icon allowance would over-cover their cheaper gear.
**MEASURED** (§4), a season of the three laddered lines against the $12,000 pot:

| arm | working | middle | wealthy |
|---|---|---|---|
| at `pro`, old | $3,718 (100% covered) | $8,114 (100%) | $20,217 (59%) |
| at `pro`, new | $13,888 (86%) | $15,934 (75%) | $20,217 (59%) |
| at defaults, old | $930 (100%) | $2,029 (100%) | $5,054 (100%) |
| at defaults, new | $930 (100%) | $1,075 (100%) | $1,374 (100%) |

⚠ **The prediction said the `pro` row would read three identical percentages and it does not.** The
PRICE is identical; the season TOTAL is not, because the **cadence** still differs — a wealthy family
buys the same $2,260 frame more often. That is the model working as designed (price uniform,
behaviour not), and it is the honest answer to record rather than a miss to patch: the over-coverage
is gone (100/100/59 → 86/75/59) and what is left is a family replacing gear oftener paying for it.

## 4. Part B — the services corridor fades out at the top tiers

`corridorAppliesAt(tier)` is the single predicate: **`self`, `budget`, `middle` keep** the ±25–30%
corridor; **`high` and `elite` are exactly 1.0** for every background. `corridorBandFor(background,
tier)` is the one place it is applied, so the quote, the week's roll, the envelope on screen and the
medical bill cannot disagree about where the corridor ends.

It reaches three services:

* **the coach line** (`coachCorridorFactor`, `coachCorridorMid`, `coachWeeklyCents`,
  `coachBillRangeCents`, `coachWeeklyBandCents` — `tier` is REQUIRED on all of them, never defaulted,
  for `facilityRateCents`' own reason: a forgotten argument would silently re-corridor an elite bill);
* **the facility line** that came out of it — one corridor, taken once, so `coach + facility ===
  total` is untouched;
* **the medical bill** (`medicalBillCents`: retainer, weekly rehab, onset treatment). The physio was
  never free-standing — `coachIncludesPhysio` says she has one because a coach was hired and
  `PHYSIO_QUALITY` says how good that team is *by rung* — so it was already the coach ladder's bill
  wearing another name, and it takes the coach ladder's cut.

**MEASURED** (§3, the rung midpoint at 19, balanced plan):

| rung | corridor | working | middle | wealthy | old spread | new spread |
|---|---|---|---|---|---|---|
| self | kept | $82.50 → $82.50 (0%) | $110 → $110 (0%) | $137.50 → $137.50 (0%) | 1.67× | 1.67× |
| budget | kept | $131.25 → $131.25 (0%) | $175 → $175 (0%) | $218.75 → $218.75 (0%) | 1.67× | 1.67× |
| middle | kept | $225 → $225 (0%) | $300 → $300 (0%) | $375 → $375 (0%) | 1.67× | 1.67× |
| **high** | **UNIFORM** | $375 → **$500** (+33.3%) | $500 → $500 (0%) | $625 → **$500** (−20.0%) | 1.67× | **1.00×** |
| **elite** | **UNIFORM** | $600 → **$800** (+33.3%) | $800 → $800 (0%) | $1,000 → **$800** (−20.0%) | 1.67× | **1.00×** |

Medical, mid-anchored retainer: $43.13 / $57.50 / $71.88 below the cut, **$57.50 for all three** at
`high` and `elite`.

⚠ **It cuts both ways and that is the ruling, not a side effect.** A wealthy family's elite week gets
20% cheaper; a working family's gets 33% dearer. «Цены для всех должны быть равны» has no version
where only one side moves. Note the middle column reads 0.0%: its corridor mid was already 1.00, so
what it loses is only the week-to-week ±5% wobble.

⚠ **`high`, not elite-only.** His sentence names elite — «**по крайней мере** элит тренеры…» — and
«по крайней мере» is a floor, not a bound; the reason he gives is the big cheques, and `high` is
where they start. **The narrower reading is a one-line retune** (drop `'high'` from
`corridorAppliesAt`'s list) and it is his to take.

### The masseur: his sentence was already true

> «По крайней мере элит тренеры и **массажисты** мне кажется вполне могут стоить одинаково для всех.»

**No change was made, because none was needed.** `ECONOMY.masseur` is a flat contract per rung — its
own comment says «STILL A FLAT CONTRACT PER RUNG: no corridor, no jitter, no draw» — and
`world/masseur.ts` bills `rung.sessions × perSessionCents` with no background anywhere on the path.
Twice a week $150/wk, every other day $300/wk, daily $525/wk, identical for all three backgrounds
since the rung dial shipped. Writing this down IS the answer.

### What stays corridored, awaiting his word

* **Travel** (`ECONOMY.travelBgFactor` → `calendar.ts`). He named it as a service that keeps the
  corridor, and it has **no tier axis** to fade along — a flight is a flight. Untouched.
* **The season planner's packages** — `vacationPriceCents`, `practiceFeeCents` via `corridorPrice`.
  He did not name them; they are one-off purchases rather than a staffed service, and no ladder
  exists to cut them on. Untouched, and listed here so the next pass does not have to rediscover them.

## 5. RNG, schema and the frozen careers

* **ZERO new draws, zero removed, zero reordered.** Where a tier goes uniform the roll is still
  spent: `ECONOMY.uniformCorridor` is `[1, 1]`, so `lo + roll * (hi - lo)` lands on exactly 1.0 and
  `seed:coachbg:<week>` / `seed:physio:<week>` walk identical positions at every rung. Skipping the
  multiply instead would have shifted those sub-streams by one position for half the ladder — a
  stream change dressed as a price change.
* The one band that moved *inside* a draw (`ECONOMY.gear[*].price`) is read by `pickInt`, which
  spends exactly one `rng()` call whatever its bounds — so every purchase WEEK in every career is
  byte-identical and only the cents moved. `weeksSinceGear` needed no rung at all for the same
  reason, and now says so with a degenerate band.
* **No schema move.** `SAVE_SCHEMA_VERSION` stays **74**: prices are constants, nothing persists.
* **No player-facing string changed.** Every `flavor`, every `gradeCopy` label and blurb is
  byte-identical, and the flavour is still chosen by background through `gearVoice` — P1 moved
  numbers only.
* **Frozen careers, the per-key protocol run before the re-freeze** (`tools/frozen-key-diff.ts`,
  control = this change's own before-state on the clean tree, all three arms with explicit flags and
  each header read back):

  | career | keys moved | which | `rngMain` |
  |---|---|---|---|
  | 5/0 · 25k middle, middle coach, grinder | **6 of 79** | careerTotals, events, financeWeeks, fundsCents, lastSeasonSummary, seasonHistory | `1dbff28caca2` **unmoved** |
  | 8/0 · 120k wealthy, elite coach, grinder | **6 of 78** | the same six (fundsCents `62f148b9763c` → `db57151e9e09`) | `aebc8101d6df` **unmoved** |
  | 0/1 · 8k working, self-coached, player | **0** | — byte-identical, whole file | `d84bcbf0c481` **unmoved** |

  Only money keys move; no result, rank, injury or knock key does. **50 constants re-stamped of 75**
  (48 unique); all 25 `selfTravelling` cells untouched — the diagonal's identity check, read back
  from the fixture ladder.

## 6. Supersedes

`docs/specs/econ-wealth-corridor.md`'s principle line, amended in place and dated — the corridor is
no longer «every family-background price scaling in the game». It is **services, lower tiers only**.
