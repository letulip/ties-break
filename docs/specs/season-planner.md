# Spec — Season Planner: calendar declutter + vacations + practice matches

Owner-approved design (25.07.2026, all four open questions answered). Implementation slice queued
after `fix/round8-ui` merges. Player copy: short dash "–" only.

## 1. Calendar declutter
- OUTGROWN tournaments disappear from the Season calendar entirely (UI filter on
  `ineligibleReason === 'outgrown'`; engine keeps emitting them — bench/history untouched).
- Locked-ahead ("Reach N pts") events STAY visible — aspirational. (Their label brightness is
  fixed in the round8-ui slice; the Home-strip outgrown contour-dimming also lives there.)
- Freed rows become plannable: "+ Plan week" on any empty future week → sheet with two tabs,
  **Practice** and **Vacation**.

## 2. Vacations — ONE shared catalogue, money is the only gate (owner: "ок, пойдет")
All prices are middle-anchored bands × `ECONOMY.wealthCorridor[background]` (the app-level canon),
quoted deterministically from `rngFromSeed(seed + ':vacation:' + week + ':' + packageId)` at offer
time, charged on booking. 1-week packages, bookable back-to-back (2 weeks = deep reset at 2×
price — owner approved). Cancel before the week starts = full refund (mirror of entry withdrawal).

| # | Package (fictional flavor) | Price (middle) | Condition | Carry-over buff |
|---|---|---|---|---|
| 1 | «Стейкейшн – дома с друзьями» (owner add) | $0 | +12 | – |
| 2 | «К бабушке в деревню» | $0–50 | +14 | – |
| 3 | «Кемпинг / роуд-трип» | $150–300 | +16 | – |
| 4 | «Море, семейный отель» | $600–1000 | +20 | – |
| 5 | «Спорт-резорт с восстановлением» | $1800–3000 | +25 | injury tau ×0.90 for 4 wks |
| 6 | «Элитная программа восстановления» (owner add: "ещё элитнее") | $4000–7000 | +30 | injury tau ×0.85 for 4 wks |

- Buffs (owner: "прикольная штука, делаем") apply post-draw to tau — invariance-safe; need a small
  persisted marker `{untilWeek, factor}` (fold into the v13 shape below).
- Design note: #1 dominates a plain full-rest week (+12 vs +10) but costs the week's flexibility
  (hard blackout, nothing enterable) — that's the trade.
- 8k CAN book the seaside (~3 weeks of income) — the "invest without knowing the return" texture;
  wealthy chains resorts = money sink.

## 3. Mechanics
- WorldState: `vacations: Array<{ week: number; packageId: string; paidCents: number }>` +
  `recoveryBuff: { untilWeek: number; factor: number } | null` → **SAVE_SCHEMA_VERSION 13**
  (append-only migration: `vacations = []`, `recoveryBuff = null`; v13 golden fixture).
- Vacation week in tick step 1c: no training strain, apply the package's gain (clamped 0..100),
  `playedThisWeek = false` (blackout guarantees no entry anyway); the injury roll still runs
  (unconditional-on-healthy-weeks rule stays; tau is naturally low at rest).
- `availabilityStatus`: vacation week → `level: 'blocked'`, reason `'unavailable'`, detail
  "Family vacation – {package}". The Home chip shows it grey.
- Booking is player input = pure state; prices/quotes only from the `:vacation:` sub-stream.
  MAIN-stream invariance test mandatory (B1/C1 freezes must stay byte-identical).

## 4. Practice matches (same slice — owner delegated the call; one SeasonScreen surgery is cheaper)
- Bookable on any empty future week: court rental **$30–80 × corridor** (sub-stream
  `seed + ':practice:' + week`).
- Option «+ тренер на игру» (owner add): plus 50% of a coaching-session cost — v1 placeholder band
  **$120–250 × corridor × 0.5** (the other half is "paid by the opponent's family"); re-priced per
  coach tier when the coach slice lands.
- Effect v1: −5 condition (light strain), a watchable friendly via the EXISTING exhibition
  infrastructure (MatchViewer), a news event, **0 ranking points** (ladder stays honest).
  Development effects arrive with the skills system.
- An injury still cancels the practice week (walkover rules do not apply — no fee forfeit beyond
  the court rental; keep it simple: refund rental if injured before the week).

## 4b. Bench insight (25.07, fatigue-bench PROJ run) — vacation trigger re-homed
The projection exposed a design trap: a reactive "book when condition < 60" rule attached to a
load-managing player NEVER fires (she never drops that low), while the overloaded player — who
under practices lives at 40-70 — has no booking habit at all. Result: 5 of 6 packages never sell.
Fix in the implementation:
- Vacations are the RESCUE lever surfaced to whoever is low: when condition drops below ~65 and
  an empty bookable week exists ahead, the game PROMPTS ("Она вымотана – может, отпуск?") with
  the catalogue pre-filtered to packages that return her above ~85. The prompt is an offer, not
  an auto-book — player agency stays.
- The scheduled off-season family week (sea) stays a natural default suggestion for everyone.
- Bench re-run after the slice lands must show every package selling at SOME rate across
  policies before the price ladder is considered tuned.

## 5. Closes
- R5 backlog debt "Vacations as a class differentiator affecting recovery" (Phase 4/5 promise).
- The design-workflow open question on family-vacation blackouts.
- R8-7b boredom ("сейчас просто next week") — empty weeks become decisions.
