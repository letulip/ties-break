---
type: spec
status: draft
area: engine
canonical: false
last-reviewed: 2026-09-02
---

# The prologue's handover – the money, the rung, and the coach's read (phase 4)

Phase 4 of `childhood-prologue-build-2026-09.md`. Invariant 5 says tuning is measured, not guessed,
and that a balance change ships with a bench run and a spec recording **predicted vs measured**.
Phase 4 adds three derivations to `createWorld`, and this is that record. The bench is
`npm run bench:handover` (`tools/prologue-handover-bench.ts`); every number below is its output.

**Status: DRAFT. Nothing here is his ruling.** §2.4 leaves the money's texture on screen explicitly
open – «давай сделаем так, я посмотрю и попробую потом, скажу как и что» – so what this document
fixes is the arithmetic underneath it, which the texture can be changed on top of without moving.

---

## 1. What the nine cards can cost

Every childhood the shipped card table can produce, walked rather than sampled: four binary decisions
at ages 8–11 settle the twelfth's face (it is derived, §2.5), and that face offers two answers of its
own, so the reachable set is 2⁴ × 2 = **32 runs**.

    runs        32
    cheapest    $8,200      municipal / group / not this year / ordinary school / let her stop
    p25         $11,950
    median      $15,400
    p75         $19,750
    dearest     $28,150     club / one to one / enter her / sports school / give her the year

Two constants follow, and they are `ECONOMY.prologue`:

    referenceSpendCents   $18,175   the midpoint of the range, (cheapest + dearest) / 2
    spendSwingCents        $9,975   half the spread, (dearest - cheapest) / 2

⚠ **They are pinned against the table, never re-typed from it.** `tests/prologue-handover.test.ts`
recomputes both by walking the 32 runs, so a card whose price changes without these changing reddens.

---

## 2. The reserve she starts the game with

**PREDICTED.** `fundsCents` at week 0 is flat today – $8k / $25k / $120k by background – and §4 asks
the prologue to make it yours. The design constraint is three-sided: the mean over the reachable
childhoods must stay near the flat number (the whole economy was tuned against those three
balances), the swing must be bounded so no career opens insolvent, and there must be no dial nobody
can argue with.

The model that satisfies all three:

    fundsCents = round( base[background] x (1 + clamp(reference - spent, ±swing) / base.middle) )

⭐ **There is no chosen dial in it.** `reference` and `swing` are facts about the card table (§1) and
the divisor is the reserve of the family the economy is anchored on, so for a MIDDLE family the whole
model collapses to the plain subtraction a parent would do: `25,000 + (reference - spent)`. The other
two backgrounds move by the same proportion of their own reserve, which is §2.4's ruling – the player
picks where the family is FROM, not a sum, and the nine years move the number from there.

⚠ Why a proportion and not the same cents for everybody: the reachable spend spans $8,200–$28,150,
which is **more than a working family's entire reserve**. Subtracting cents would open a career in
debt, and «you went bankrupt before she was fourteen» is a mechanic this game does not have and §7
forbids inventing here.

**MEASURED**, over all 32 runs:

    background   flat      min       median    max
    working      $8,000    $4,808    $9,080    $11,192
    middle       $25,000   $15,025   $28,375   $34,975
    wealthy      $120,000  $72,120   $136,200  $167,880

**⚠ THE ONE THING THAT DID NOT COME OUT AS PREDICTED, and it is worth his eye.** The median run
arrives **richer** than the flat number – $9,080 against $8,000 for a working family, +13.5%. The
model is anchored on the midpoint of the RANGE and the table's distribution is not symmetric about
it: the median childhood costs $15,400 against a $18,175 midpoint, because more of the 32 paths are
cheap than dear. So a typical prologue hands the game slightly more money than the wizard does.

That is a true statement about the card table rather than a defect in the model, and it has an honest
reading – most parents do not buy the most expensive year on every card. It is recorded rather than
corrected because correcting it means anchoring on the median instead, which makes the swing
asymmetric (a family could lose more than it could gain) and puts a distribution statistic where a
table fact is now. **His call, not a build decision.**

---

## 3. The rung she arrives on

**PREDICTED.** §4 lists «the coach rung she arrives with» among the things the prologue may move.
`teaching` is 0..1 by construction on every card (0 = a parent on a municipal court, 1 = a club where
the coaches are) and `CoachTier` has five rungs, so the reading is the plain fifth – **no threshold is
chosen**, and there is nothing here for a later wave to re-tune by feel. Years are weighted by
`weightAt`, phase 1's own share of the childhood, so the thirteenth year counts for more than the
fifth: a family that found the money late arrives higher than one that spent it on a six-year-old.

**MEASURED**, over the 32 runs:

    budget   2/32
    middle  23/32
    high     7/32

`self` and `elite` are unreachable from today's cards. That is honest rather than dead: nine years of
ordinary coaching does not buy an elite coach at fourteen, and it does not leave the parent on the
court either. A card that offers a year with no teaching in it reaches `self` without the function
changing.

⚠ The wizard's own default is `middle`, and the modal prologue lands there too – so the prologue does
not quietly re-price the biggest bill in the game.

---

## 4. The style she earned

No new derivation at all: `styleOf` (season/rival.ts) is how every one of the 199 rivals already gets
a style, and her arrival build is read the same way. What the nine years did to her wings
(`childhoodWalk`'s `shape` channel, which redistributes and never adds) is what decides it, so the
style is a consequence of the focus a parent bought rather than a fifth question on a form – which is
§4's «earned rather than picked», and it deletes a menu.

---

## 5. ⚠⚠ The coach's read, and the ladder it may NOT use

§8a asks the handover to speak in the vocabulary the coach already has – `Huge potential` /
`Still room to grow` / `Close to her ceiling`. It does. What it may not do is reuse
`coachRoomBandIndex`, and this is the measurement that settled it.

**MEASURED, the shipped ladder at week 0** (300 fresh careers, no prologue):

    Huge potential      280
    Still room to grow   19
    Close to her ceiling  1
    At her ceiling        0

**A handover built on it would promise a star to 93% of players.** That is not a defect in the
ladder – its own note records the calibration, «band 0 from week 0, band 1 at weeks 12–82» – it is
what a REALISATION SHARE means at fourteen, when nobody has realised anything yet. It is also exactly
the wizard's «anything is possible» (§8b) walking back in through the one screen written to stop it.

So `handoverRoomBand` reads the other quantity: **how much was in her when she was born** –
`potential − birth build`, which is the potential roll itself, uniform in
`ECONOMY.development.potentialBand` ([4, 26]) by construction. The thirds are the band's own, so
again no threshold is chosen.

**MEASURED**, 2,000 seeds:

    Close to her ceiling   9.6%
    Still room to grow    80.8%
    Huge potential         9.7%

...which is what a mean of five uniforms does, and it is the honest shape: most girls are ordinary,
one in ten is a dud (§1c – «a career at the bottom of this band is a girl who was never going to make
it, and that has to be a career the game can tell») and one in ten is a star. No low-ceiling girl is
ever misread: 0 in 4,000.

### 5a. ⚠⚠ Why it reads her BIRTH build and not her arrival

**PREDICTED:** reading `potential − world.skills` – her remaining room today – would let the
childhood move the band, and only slightly, since the childhood moves her by at most ~3.6 points on a
22-point band.

**MEASURED: it moves the band on 23.9% of seeds**, and it moves it DOWNWARD for the girl whose
parents did everything: a devoted childhood is nearer its ceiling by construction. The screen would
answer nine good years with «she is near what she has. She will not have a famous one», which inverts
the meaning of the most important screen in the game.

§5 puts the rose and the read side by side precisely because they are **different statements**: the
rose is who you raised, the read is the truth about her ceiling. Reading her arrival collapses the two
into one. Off the birth build the childhood moves the band on **0.0% of seeds** – measured, and
pinned in `tests/prologue-handover.test.ts`.

### 5b. The fourth band is never spoken

`ROOM_BANDS` has four labels and §8a drafted three. The fourth is `At her ceiling`, which is a ceiling
claim in three words, and §5 is explicit: «If he ever names a ceiling, the fog stops meaning
anything.» `handoverRoomBand` cannot return it, and the copy table maps it – for a caller who somehow
had it – onto the read that concedes he can be wrong.

---

## 6. What did NOT move

- **`potential`.** §4's one prohibition. `rollPotential(seed, startingSkills(seed, profile))` is a
  function of the seed alone – `startingSkills` ignores its profile argument – so nothing the
  prologue derives can reach the ceiling roll even in principle. Proved byte-for-byte against a
  wizard career on the same seed, and mutation-verified.
- **The MAIN stream.** No draw is added anywhere. `childhoodWalk` takes no seed and imports no
  generator (phase 1); `styleOf` and the rung are arithmetic; the coach's LINE is picked off a
  purpose-scoped `seed:prologue:read` sub-stream that persists nothing. The frozen capture
  (41,550 draws / `e6b0c709`) and every career hash are unmoved.
- **`SAVE_SCHEMA_VERSION`.** It stays at 69. Everything the prologue earns lands on fields every save
  has carried for dozens of versions, and nothing about a career records that it came through a
  prologue – see the build spec's §4 and the verdict in the phase 4 report.
- **The cohort and the pre-history.** Byte-identical with and without a prologue, which is phase 3's
  rule held one phase later.
