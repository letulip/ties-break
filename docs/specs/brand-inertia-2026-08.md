---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-31
---

# Brand inertia – a built brand must not evaporate with this year's noise

**Status: DRAFT FOR THE OWNER'S REVIEW. Nothing is built.**

## 1. What he asked

«А еще интересно, что будет происходить с годами падения в таблице (как у нее сейчас) – известность
тоже будет падать и стоимость бренда, соответственно?» – and, on being shown the answer: «Инерция
бренда – звучит интересно, давай попробуем».

## 2. The measurement that forces this – his own w933 career, nothing new won

Projected forward with only decay running (`tools/r32-fame-read.ts`):

| | fame | weekly | multiple | worth |
| --- | ---: | ---: | ---: | ---: |
| now | 22.3 | $1,720 | 9.30x | **$831,382** |
| +1 year | 15.2 | $801 | 8.48x | $353,412 |
| +2 years | 9.7 | $327 | 7.85x | $133,266 |
| +3 years | 6.2 | $132 | 7.44x | $51,237 |
| +5 years | 2.7 | $25 | 7.04x | **$9,098** |

⚠⚠ **A 99% capital loss in five years.** The cause is arithmetic, not tuning: fame halves every 104
weeks, income goes as `fame^2`, and after round 32 #3 the multiple rises with fame too – so worth
goes as `fame^3` and **falls eightfold every two years**.

⚠ Note this is NOT a defect introduced by #3. Before #3 the multiple was flat, so worth went as
`fame^2` and still fell fourfold every two years – $1.63M to about $102k over the same five. #3 made
a steep curve steeper; it did not create it.

## 3. Why it is wrong

A brand is not a measure of how loud this year is. Once built it holds a name, a shelf, a
distribution and a customer who already owns two of its shirts. Real athlete brands survive the
athlete's decline and often outlive the career entirely – that is the whole reason the owner called
the merch line «фундамент для этого слоя». What we model today is not a brand; it is a live reading
of attention, priced as if it were one.

## 4. The proposal

A second, slower stock: **brand strength**, accumulated from fame rather than equal to it.

- it RISES while fame is above it, at some fraction of the gap per week;
- it FALLS far slower than fame – or not at all below a high-water mark, which is a decision below;
- the brand's INCOME keeps reading fame (this year's noise really does sell this year's shirts);
- the brand's WORTH reads brand strength, so the asset holds while the income breathes.

⭐ THE POINT OF THE SPLIT, stated so a later reader does not collapse it back: income is a flow and
should follow attention; worth is a stock and should follow what has been built. Today one number
does both jobs and neither well.

## 5. What must be decided before it is built

1. **Does strength ever fall, and how far?** A pure high-water mark makes the brand un-loseable,
   which removes a real stake; a slow decay keeps the stake and still ends in zero eventually. ⭐ My
   recommendation: decay, but on a half-life measured in YEARS not weeks, plus a floor at a share of
   the peak so a career that was genuinely big never prices at the mark.
2. **Does it apply retroactively?** His live career sits at week 933 with a brand freshly re-priced
   to ~$831k by #3. A strength stock seeded from today's fame gives the same number today and a
   flatter curve from here. ⭐ Recommended: seed from the CURRENT fame so nothing jumps.
3. **Does it need the save?** Almost certainly yes – a stock with memory cannot be recomputed from
   (career, week) the way `revalueAssets` does today. That is the full four-part schema move.

## 6. Acceptance

- His w933 career, projected five years with nothing won: worth must not fall by 99%. A defensible
  target is a decline of the same ORDER as the income's, not its cube.
- The top of the shelf is unmoved: a career at fame 100 prices as it does today.
- A career that never built anything gains nothing – strength is accumulated, so an unknown's brand
  is still worth an unknown's brand.
- ⚠ Invariant 5: predicted vs measured, and a bench.

## 7. HIS RULINGS (31.08) – §5 is closed, this spec is ready to build

1. **Does strength fall?** «падает, но с полураспадом в годах, плюс пол в доле от пика – чтобы
   карьера, которая реально была большой, никогда не оценивалась по минимуму. – да» ⭐ Both halves
   are his: a half-life measured in YEARS, and a floor as a SHARE OF HER OWN PEAK. The floor is
   personal, not global – a big career never prices at the mark, a small one still can.
2. **Retroactive?** «вообще всё равно, игроков нет пока.» ⭐ So it is my call and I take the cheap
   one: seed the stock from the CURRENT fame, so no existing career's number jumps on the tick after
   the merge. Nothing about that choice is load-bearing and a later wave may revisit it.
3. **The save.** «главное обратная совместимость чтобы работала» ⚠ The four-part move, and the
   binding half of his sentence is the migration: append-only, every older schema still loads, a
   golden fixture per version, `npm run e2e:fixtures`. A save that cannot be opened is the one
   failure this feature is not allowed to have.
4. **Measured together with the collaboration spec.** «совместный эффект – мерить, да» ⚠ Both push
   on the same number; the bench reports the COMBINED arm, not two separate ones summed.
