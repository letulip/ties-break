// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/gear.md#the-gear-block

// ⚠ TYPE-ONLY: `../economy.ts` imports THIS module at runtime, so a value import back would close a cycle;
// `import type` is erased at compile time, which is why the shared shapes may live over there.
import type { GearCategory, GearLine } from '../economy'

// Recurring gear purchases, scheduled DETERMINISTICALLY off a purpose-scoped sub-stream per
// category (never the main weekly stream). Cadence + price are drawn from that sub-stream.
//
// ⚠⚠ gear: THE CALIBRATION IS THE OLD DIAGONAL, AND IT IS AN ARITHMETIC FACT RATHER THAN A NEW TUNE.
// ⚠ gear: NOTHING HERE MOVES PLAY.
// → docs/notes/economy/gear.md#gear
export const gear = {
  rackets: {
    breakdown: 'gear',
    cadenceWeeks: { working: [14, 18], middle: [12, 16], wealthy: [10, 12] },
    price: {
      by: 'rung',
      cents: {
        alloy: [33_00, 66_00],
        composite: [60_00, 120_00],
        performance: [396_00, 616_00],
        pro: [1920_00, 2600_00],
      },
    },
    flavor: {
      working: 'New racket – used, off the classifieds',
      middle: 'New racket – current retail model',
      wealthy: 'New racket – custom pro stock',
    },
  },
  stringing: {
    breakdown: 'stringing',
    cadenceWeeks: { working: [4, 4], middle: [3, 3], wealthy: [2, 2] },
    price: {
      by: 'rung',
      cents: {
        alloy: [9_90, 16_50],
        composite: [18_00, 30_00],
        performance: [61_60, 99_00],
        pro: [180_00, 280_00],
      },
    },
    flavor: {
      working: 'Restring – budget synthetic',
      middle: 'Restring – multifilament',
      wealthy: 'Restring – tour gut',
    },
  },
  shoes: {
    breakdown: 'gear',
    cadenceWeeks: { working: [10, 14], middle: [10, 14], wealthy: [10, 14] },
    price: {
      by: 'rung',
      cents: {
        alloy: [33_00, 49_50],
        composite: [60_00, 90_00],
        performance: [220_00, 330_00],
        pro: [680_00, 960_00],
      },
    },
    flavor: {
      working: "New shoes – last season's model",
      middle: 'New shoes – mid-range performance',
      wealthy: 'New shoes – top-line, fitted',
    },
  },
  apparel: {
    breakdown: 'gear',
    cadenceWeeks: { working: [13, 13], middle: [13, 13], wealthy: [13, 13] },
    // ⚠ THE ONE LINE WITH NO LADDER, so the only one still priced by the family's own basket –
    // three different products, three prices, and nothing here claims they are the same thing.
    price: {
      by: 'basket',
      cents: { working: [40_00, 70_00], middle: [110_00, 160_00], wealthy: [260_00, 380_00] },
    },
    flavor: {
      working: 'Apparel refresh – club basics',
      middle: 'Apparel refresh – brand kit',
      wealthy: 'Apparel refresh – full designer kit',
    },
  },
} as Record<GearCategory, GearLine>
