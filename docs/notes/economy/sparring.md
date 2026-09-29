---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The sparring block

The comment essays that stood above the `sparring` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `sparring.rungs`

```ts
    /** THE LADDER. `driftCut` is a MULTIPLIER ON THE DRIFT, not the share removed: x0.15 means the
     *  top rung leaves 15% of a rusting week's drift standing. Strictly decreasing, or the rung is
     *  re-priced – the masseur spec's §4 law.
     *
     *  ⚠ THE MONEY IS ANCHORED ON THE RESEARCH AND THE RUNGS ARE PROPOSALS (O7, 16.09): the band is
     *  `docs/research/team-economics-2026-09.md` §4's **$50-80k/yr + travel** for a full-time
     *  hitting partner, and round 42 #48 measured that only the NOT-travelling top rung ($72,800 a
     *  season) lands inside it at all. The three labels are the ladder the band describes – a
     *  college hitter, a journeyman pro, a top-100's partner.
     *
     *  ⚠⚠ THE THREE CUTS ARE **0.75 / 0.5 / 0.25** AND NOT §4's PROPOSED **0.6 / 0.35 / 0.15**, AND
     *  THE REASON IS A MEASUREMENT RATHER THAN A TASTE. `world.form` is kept in TENTHS (§1, and
     *  `accrueForm` rounds once at the end exactly as `accrueSpirit` does). At a base drift of
     *  0.4/wk the proposed cuts give 0.24 / 0.14 / 0.06 a week – and the accumulated value is
     *  rounded to a tenth every week, so 0.14 and 0.06 BOTH ratchet the number down by exactly one
     *  tenth a week and the top two rungs become the same seat. `npm run bench:form` §3 measured
     *  it: «A journeyman pro · home +0.312» and «A top-100 partner · home +0.312», identical to the
     *  thousandth, which is the masseur spec's §4 law broken («each rung must MEASURABLY beat the
     *  one below or the dial is decoration»).
     *
     *  ⭐ SO THE CUTS ARE CHOSEN TO BE EXACT IN THE UNIT THE NUMBER IS KEPT IN: 0.4 x 0.75 / 0.5 /
     *  0.25 is **0.3 / 0.2 / 0.1 a week**, three drifts a tenth apart, none of them rounded at all.
     *  The floor is then reached in 13 / 20 / 40 matchless weeks against 10 with nobody hired, which
     *  is a ladder a player can feel rather than a table only the source can see. ⚠ THE TOP RUNG IS
     *  therefore a WEAKER cut than §4 proposed (75% of the drift removed rather than 85%) and it is
     *  the only rung that could have been kept as proposed – it was re-fitted anyway, because a
     *  ladder whose top two rungs differ by a rounding artefact is worse than a shallower one.
     *
     *  ⭐⭐ `note` IS THE RUNG'S OWN SENTENCE ON THE CARD (his 17.09 answer, «Рекомендую A - ок»), and
     *  it is OPTIONAL on purpose: the masseur's and the psychologist's ladders have no such sentence
     *  and he has not been shown drafts for them, so a REQUIRED field would force this seat's
     *  vocabulary onto two seats he never ruled on. `SupportStaffTab.vue` prints it under the rung
     *  label and renders nothing where it is absent.
     *
     *  ⚠ THE THREE SENTENCES ARE CHECKED AGAINST THE NUMBERS BESIDE THEM, because `driftCut` is a
     *  multiplier on the drift and reads backwards to the eye: 0.75 LEAVES three quarters standing
     *  and so takes A QUARTER off, 0.5 takes half, and 0.25 leaves a quarter standing and so takes
     *  THREE QUARTERS off. The block above states the same arithmetic from the other side («the top
     *  rung is a WEAKER cut than §4 proposed – 75% of the drift removed rather than 85%»), and the
     *  two agree. A wave that re-fits a cut moves its sentence in the same edit or the card lies. */
```
