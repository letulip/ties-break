---
type: round
status: current
area: process
canonical: false
last-reviewed: 2026-09-16
---

# Round 43 – the chemistry wave, and the support seats get their faces

Opened 16.09.2026, the day round 42 merged (`ad640c18`, PR #145). Same regime as 42: one builder at
a time, the architect gates each bundle with the full `npm run check` on a quiet machine, commits by
FILE pathspec, and the round ends with its own PR through `/pull-request`.

⚠ **Statuses:** `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him.

---

- [>] **1. THE CHEMISTRY WAVE, C1.** Spec [the-chemistry-2026-09](../specs/the-chemistry-2026-09.md),
  all thirteen questions C1–C13 ruled by him on 16.09. C1 ships the roster's per-career `manner` and
  `style` draw, affinity, the weekly corridor and phase, the three event channels, `coachPairs` +
  v79, one line in `coachFactor`, and B0/B9/B10/B11 as acceptance. Builder in flight.
  ⚠ **It owes FOUR DRAFT seasonal lines** (anti-match / ordinary / good / click) and the anti-match
  one is load-bearing – a negative pairing nobody can see is a hidden tax. His to rule before ship.

- [ ] **2. THE SUPPORT-SEAT PORTRAITS ARE NOT ON ANY SCREEN (his 16.09).** «Я не увидел в пришедшем
  обновлении картинок для support stuff, мне казалось, что мы их уже должны были сделать.»
  ⚠ **He is right and the record already said so.** Round 42 #53 shipped the CONVERSION and left the
  PLACEMENT open – its ledger line is `[~]`, not `[x]`. Verified rather than remembered:
  `git grep support-stuff -- src/` returns **nothing**; the four `.webp` are tracked and ship, and
  nothing renders them.
  **What ships:** his four 448×624 portraits placed by the coach strip's principle (his own ruling of
  16.09: «тренерская полоска… принцип похож, просто соотношение сторон будет немного другое»), i.e.
  a fixed-width strip, `object-fit: cover`, an `object-position` that keeps the head whole, the body's
  height driving the picture, and the floor derived from **this** ratio – `strip × 624/448`, never the
  coach masters' `× 264/162`. The broker has no surface yet and stays on the shelf.

- [ ] **3. THE PRICES INSIDE THE SEAT OPTIONS READ TOO SMALL (his 16.09).** «Сами цены внутри опций
  этих специалистов надо сделать покрупнее и можно пожирнее даже.» Typography only – **no string
  moves**, which is what makes it safe under invariant 4.

- [~] **4. THE MASSEUR ASKS FOR RAISES (his 16.09 ruling).** Raised by the architect's audit: the
  masseur is **$75/session × 2/4/7 a week = $150/$300/$525/wk = $7.8k/$15.6k/$27.3k a year**, a FLAT
  contract per rung with no corridor, no jitter and no draw – the one seat left whose price reads
  nothing about her. Round 42 #19 closed the coach's half of the research's own verdict that our top
  team total is «an order under reality» ($80–130k/yr against $600k–1M); the masseur's half was never
  touched, and the research carries **no masseur figure**, so there is nothing to price him against.
  ⭐ **His ruling, and it is better than a new band:** «массажист тоже вполне может просить надбавок
  за свои часы ежегодно (может быть не так интенсивно как тренер)… это может нам скомпенсировать все
  ранги и будет справедливо». So the correction rides on HIS OWN LABOUR rather than on a wealth or
  rank corridor – the same shape the coach's annual ask has, at a lower intensity.
  ⚠ **The psychologist is explicitly out:** «Психолога не трогаем наверное.»
  ⚠ Needs the intensity measured against the coach's, not chosen – it is a money change and invariant
  5 binds.

- [~] **5. THE BUSINESS TAB DOES NOT SAY WHOSE MONEY IT IS SHOWING (his 16.09).** He asked whether
  Zoe's brand was correct: «13000 в неделю при стоимости бренда 28м+».
  ⭐ **The numbers are right and the SCREEN is what is wrong.** `worth = weekly GROSS × 52 × multiple`
  and the multiple is hard-capped at `maxX: 20`, so $13k/wk of gross could never support $28M. But
  $13k is not gross: `business.ts:141` hands the family `assetWeeklyIncomeCents − assetKidShareCents`,
  and her share is the PRIZE ramp – 10% from 18, capped at **60% at 23**. Unwound: gross
  $13,000/0.40 = **$32,500/wk → $1.69M/yr → a multiple of 16.6×**, inside the band and near its top,
  which is exactly right for a mature star.
  ⚠ **So the defect is legibility, not arithmetic:** the tab puts his 40% of the income beside the
  whole business's worth and says neither, so anyone who divides one by the other gets 41× and
  concludes the game is lying.
  ⭐ **Same shape as round 42 #40** – brands pay 43% of the junior bill, the family sees 9%, and the
  gap is a split nobody states. There it was the manager's 15/85; here it is her 60/40.
  **His ask:** «Наверху вкладки Business можно добавить строчку про ту долю, которая уходит в семью и
  ей отдельно, сказав, что видимые суммы - это семейный чистый доход.»
  ⚠ **The line must be LIVE, not fixed** – her share ramps, so a hard-coded «60/40» lies to a
  nineteen-year-old. The percentages come from the engine.
  **DRAFT, his to rule:**
  > **A.** `Her share is 60% – the figures below are the family's net.`
  > **B.** `Every week this shelf earns, she takes 60% and the family keeps 40%. The figures below are the family's net.`
  > **C.** `She takes 60% of what these earn; the figures below are the family's 40%. A holding's worth is the whole business.`

  ⭐ **Architect recommends C.** A and B say «this is net» and leave the valuation puzzle exactly
  where it was; C closes both halves – the split AND the fact that the worth is of the whole business
  rather than of his share, which is the half that produced his 41×.

- [?] **6. THE MASSEUR'S OWN FIGURE IS STILL MISSING.** Item 4 fixes the SHAPE; it does not supply a
  target. `docs/research/team-economics-2026-09.md`'s audit row says «masseur/physio salaried, no
  share» and gives no number, so either he names one or the round runs a research pass. Until then
  the raise's intensity is fitted to the coach's rather than to reality.
