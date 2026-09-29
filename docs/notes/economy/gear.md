---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The gear block

The comment essays that stood above the `gear` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `gear`

```ts
  // Recurring gear purchases, scheduled DETERMINISTICALLY off a purpose-scoped sub-stream per
  // category (never the main weekly stream). Cadence + price are drawn from that sub-stream.
  //
  // ⭐⭐⭐ THE PRICES BELOW ARE RUNG-KEYED SINCE ROUND 41 P1 – see `GearPricing` for the owner's
  // ruling and for why apparel alone keeps a background-keyed band.
  //
  // ⚠⚠ THE CALIBRATION IS THE OLD DIAGONAL, AND IT IS AN ARITHMETIC FACT RATHER THAN A NEW TUNE.
  // Each rung's band is the band of the background whose FLAVOUR already described that rung's
  // product, scaled by that rung's shipped `priceFactor`:
  //
  //     alloy        := working band × 0.55     («used, off the classifieds» × the starter rung)
  //     composite    := working band × 1.00     – the ladder's identity element, untouched arithmetic
  //     performance  := middle  band × 2.20     («current retail model»)
  //     pro          := wealthy band × 4.00     («custom pro stock»)
  //
  // So a working family's recurring bill is BYTE-IDENTICAL to the shipped game at every hit (its band
  // and the composite band are the same numbers), and the top of the ladder still costs the $2,260
  // the owner himself quoted – now to everybody. What the diagonal could NOT preserve is measured and
  // reported rather than hidden: every career in this game starts on `composite` (`DEFAULT_KIT_GRADES`
  // – there has never been a per-background starting rung), so a middle or wealthy family's DEFAULT
  // basket falls to the working family's price, because it was always the same object. The spec
  // docs/specs/one-market-2026-09.md §3 carries the measured weekly figure and the one-line retunes.
  //
  // ⚠ NOTHING HERE MOVES PLAY. A rung's `startWear` / `lifeFactor` / `frameInjuryRise` are untouched,
  // no background's DEFAULT rung moves, and `priceFactor` is gone from the arithmetic entirely: it
  // survives only as the number these bands were derived WITH, written out above.
```
