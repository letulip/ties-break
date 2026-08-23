---
type: spec
status: draft
area: engine/body
canonical: false
last-reviewed: 2026-08-23
---

# The injury landscape – the full picture behind the §6 ruling

**MEASUREMENT ONLY. Not one engine line ships from this spec.** The owner asked for «про травмы
больше детализаций с измерениями и выкладками, чтобы мы могли более взвешенные решения принимать» –
he has to rule on the §6 proposal of `fatigue-doctor-ledger-2026-08.md` (steepen the sub-knee
condition→tau coupling so a wrecked match pays ~2.5–3x instead of ~1.4x), and this file is the full
picture that ruling needs: the landscape as shipped, the dose-response curve of the lever itself,
the pro-era interaction with recovery variant C, and his own saves as the honest baseline.

**Instruments** (all committed with this spec, all deterministic, every number reproduces):

- `tools/injury-landscape.ts` – the junior-era table. Reuses the fatigue bench's own machinery
  (`openFatigueCareer`/`stepFatigueWeek`, the exact cells the doctor's ledger walked: 4 profiles ×
  3 policies × seeds 0–9, 104w = 40 careers per policy per arm), and adds the columns the ruling
  needs: severity mix, the two-door cause split, sub-knee exposure, per-100-match rates, SEM.
- `tools/pro-season-probe.ts` – extended (severity mix, sub-knee weeks, SEM, `--proRecovery`)
  to serve as the pro-era row and the variant-C interaction arm. 16 seeds × 3 seasons per cell.
- `tools/injury-saves-read.ts` – the owner's saves, read through the game's own import door.
  READ-ONLY LAW: never copied, never committed; the repo keeps only the derived statistics below.

**The dose lever** was run as a MEASUREMENT-LOCAL, uncommitted patch in
`src/engine/world/injury.ts` – reverted byte-clean after the sweep, `git diff` empty on `src/` at
push time. Shape: below the knee, `tau *= 1 + K·(knee − condition)/knee` (K=0 unset = the shipped
engine byte-identically; a post-draw threshold multiply, zero draws moved on any stream, the frozen
MAIN capture 41550/e6b0c709 untouched by construction). Null-result law honoured: the arm was
proved live with an absurd-value probe first (K=50 moved grinder onsets 3.75→6.08/career and the
per-match ratio 1.42x→2.02x before any real arm was trusted), and K=0 reproduces the doctor's
ledger §3 exactly (150 grinder onsets/40 careers, 3.92 vs 2.76 per 100 matches, 360 weeks lost).

## §1 The landscape as shipped (K=0) – who gets hurt, how badly, through which door

Junior era, the ledger's own cells (per policy, pooled over 4 profiles, 40 careers × 104w each;
totals unless marked, SEM on per-career means):

    metric                          grinder      balanced     careful
    onsets /career                  3.75 ±0.23   3.27 ±0.27   3.38 ±0.28
    severity mi/mo/ma/se (total)    116/24/8/2   103/18/8/2   105/21/9/0
    door: weekly / retirement       53 / 97      37 / 94      28 / 107
    weeks lost /career              9.0 ±0.9     8.6 ±0.9     8.2 ±0.9
    career-ending injuries          0            0            0
    matches /career                 95.8         121.6        119.2
    onsets per 100 matches          3.92         2.69         2.83
    play weeks below the knee       70%          28%          19%
    weeks below medical floor       5.0%         2.5%         0.6%
    mean condition (at roll time)   52           77           83
    careers ever ranked             8/40         35/40        29/40

Preset split (the 8k/25k/120k axis): the pattern is flat across money. Grinder onsets/career by
preset: 4.10 (8k) / 4.10 (25k self) / 3.60 (25k coach) / 3.20 (120k); careful: 3.60 / 3.40 / 3.30 /
3.20. Money buys a coach (whose physio rung trims tau) and better recovery, worth ~0.5–0.9
onsets/career at the grinder cell – **the injury landscape is a POLICY landscape, not a wealth
landscape.** Full 12-cell table in the run logs (`tools/injury-landscape.ts`, seeds 0–9).

**The two doors are the structural fact the §6 ruling has to know.** Of the grinder's 150 onsets,
only 53 (35%) come through the weekly roll – the door `injuryTau` guards and the only door the §6
lever touches. 97 come through the on-court retirement (`retireHazard`), which reads WITHIN-MATCH
spentness, not weekly condition – and it lands on whoever plays long matches, which is why the
CAREFUL policy's feed is 79% retirement-door (107 of 135): she wins openers and plays deep, honest
tennis. This split was first measured by `tools/injury-ratio-probe.ts` (careful injuries 24→68 when
retirement shipped) and it bounds everything §6 can do: **the lever can multiply a 35% channel, not
the feed.**

## §2 The honest baseline – the owner's own saves (read-only, 23.08)

Five careers, 46.9 seasons, 2554 matches of real careful-ish play
(`npx vite-node tools/injury-saves-read.ts -- --save …`):

    save             weeks  seasons  onsets  mi/mo/ma/se  wksLost  matches  inj/season  inj/100m  plan
    naomi   (w674)   674    13.0     11      9/1/1/0      29       787      0.85        1.40      75/25
    ines    (w570)   570    11.0      4      3/1/0/0       8       727      0.36        0.55      75/25
    alice   (w474)   474     9.1      6      5/1/0/0      13       319      0.66        1.88      75/25
    olivia  (w464)   464     8.9      9      3/6/0/0      29       500      1.01        1.80      85/15
    zoe     (w255)   255     4.9      2      1/0/1/0      11       221      0.41        0.90      75/25
    POOLED                  46.9     32                   90       2554     0.68        1.25

Two calibration facts. (1) **Careful play carries ~0.7 onsets a season and that is the honest
baseline** – his «я аккуратно играл и всё равно травмы были» is the game working, and no dose below
may erase it (none does: the careful policy's floor RISES with every dose, never falls). (2) His own
85/15 career (olivia) is already his harshest: 1.01/season with 6 of 9 onsets moderate – the
direction he asked to see exists in his own play at K=0, at small magnitude. The bench archetypes
sit above his absolute rates (careful policy 1.69/season) because they enter 30+ events a season to
his ~dozen; the POLICY DELTAS, not the absolute rates, are the comparable quantity.

## §3 The dose-response of the §6 lever (junior era, 40 careers per policy per arm)

    K    grinder onsets   sev mi/mo/ma/se  wk/ret     wksLost    inj/100m   careful onsets  careful/100m  ratio g/managed
    0    3.75 ±0.23       116/24/8/2      53/97       9.0 ±0.9   3.92       3.38 ±0.28      2.83          1.42x
    1    4.25 ±0.24       131/29/8/2      69/101     10.1 ±0.9   4.45       3.40 ±0.28      2.85          1.58x
    2    4.60 ±0.26       138/35/9/2      84/100     11.3 ±1.2   4.83       3.40 ±0.28      2.85          1.67x
    4    5.05 ±0.27       146/42/12/2     108/94     13.4 ±1.3   5.32       3.52 ±0.28      3.00          1.74x
    8    6.03 ±0.30       173/51/12/5     153/88     16.7 ±1.2   6.39       3.67 ±0.28      3.13          1.97x
    16   6.67 ±0.28       180/64/18/5     185/82     19.8 ±1.2   7.18       3.83 ±0.28      3.30          2.08x

(the balanced policy tracks between: 3.27 → 3.40 → 3.58 → 3.77 → 4.03 → 4.30 onsets/career)

**Finding 1 – the curve SATURATES at ~2.1x per match, and §6's promised 2.5–3x is unreachable
through this lever.** Not because of the cap: the diagnostic arm with `injuryChanceCap` raised
0.12→0.24 is byte-near-identical at K=4 (5.05 vs 5.05 onsets, 5.32 vs 5.32 /100m) and +4.5% at K=8
(6.39→6.68 /100m, ratio 1.97→1.98). The ceiling is structural, and it has two floors under it:
(a) the retirement door – the grinder's ~97 retirement onsets and the managed ~94–107 are INERT
under the lever, so multiplying the weekly channel dilutes into totals roughly 3:1; (b) exposure
feedback – every extra layoff removes sub-knee weeks (the grinder's share of weeks below the knee
falls 70%→59% across the sweep as she spends them in rehab instead), so the lever consumes its own
fuel. §6's «260–320 onsets per 40 careers» is reached only at the saturated K=16 (267); its
per-match arithmetic assumed the whole feed scales, and only 35% of it can.

**Finding 2 – the careful guard holds to K=8.** Careful onsets move 3.38→3.40→3.40→3.52→3.67
across K=0..8 – within about one SEM of shipped through K=4, +8.6% at K=8 – and her severity mix
never grows a severe (0 at every dose). Weeks lost: 8.2→8.9. Per season she goes 1.69→1.84
against the owner's own-save floor of 0.68: the honest baseline is preserved, not erased, at every
dose. The protection is structural, not tuned: 79% of her feed is the untouched retirement door,
and 81% of her play weeks are above the knee where the multiplier is 1 by construction.

**Finding 3 – the grinder's feed becomes visibly harsher from K≈2 and unmistakable at K=8.**
Onsets +23% at K=2 (3.3 SEM), +35% at K=4, +61% at K=8; moderates 24→51, severes 2→5, weeks lost
9.0→16.7 per career at K=8 (a full season month more in rehab per two seasons). Per season the
grinder reads 1.88→3.02 onsets across K=0→8 against careful's 1.69→1.84 – the «жёстче и явно» gap
on the feed itself.

**Finding 4 – the perverse side-effect the owner should see before ruling: injuries substitute for
the rest the grinder refuses.** Her ranked careers RISE with dose (8/40 → 9 → 13 → 17/40 at K=16)
and her mean condition rises 52→61, because every forced layoff is forced rest, and she comes back
above the strength knee winning openers she used to lose. The injury lever makes her body pay more
and her tennis LOSE LESS – at K=16 one career even ends by injury while sixteen others rank for the
first time. Steepening the injury coupling is not a pure punishment arm; past K≈8 it starts
quietly repairing the career consequence that today does most of the punishing (ledger §3: 8/40 vs
35/40 ranked is the loudest consequence recklessness has).

**The cause split across the sweep is the mechanism on camera**: the grinder's WEEKLY-door onsets
scale 53→84→108→153→185 while her retirement door drifts 97→100→94→88→82 (rehab weeks eat the long
matches that feed it); the careful weekly door creeps 28→30→36→43→53 against a rock-steady ~104
retirement count. The lever does exactly what it says – multiplies the weekly channel – and the
totals move exactly as far as that channel's share allows.

## §4 The pro era and recovery variant C – where the lever's SHAPE breaks

**The professional season lives below the knee.** At shipped variant C (`proPhaseRecoveryBase` 5)
the pro reference player – the reprice spec's own careful pair schedule, `tools/pro-season-probe.ts`
– spends **42.4 ± 1.0 of 52 weeks a season below the matchStrengthKnee** (the greedy grinder: 49.1
of 52). The knee-70-anchored lever therefore taxes nearly EVERY professional week, careful or not
(16 careers × 3 pro seasons per cell, means ± SEM per season):

    pro arm                        K=0           K=2           K=4           K=8
    REFERENCE (pair, light plan – the honest professional)
      onsets/season                0.81 ±0.11    1.58 ±0.14    2.13 ±0.17    2.71 ±0.19
      season injury prevalence     60%           90%           96%           98%
      onsets per 100 matches       2.01          3.95          5.33          6.94
      weeks lost/season            3.1 ±0.6      5.9 ±0.8      7.5 ±0.8     9.1 ±0.8
      severity mi/mo/ma/se         28/7/3/1      48/21/5/2     67/26/7/2     86/31/11/2
    GREEDY GRINDER (grind plan, every week, no vacations)
      onsets/season                0.69 ±0.11    2.27 ±0.19    3.02 ±0.23    3.65 ±0.24
      season injury prevalence     52%           94%           96%           96%
      onsets per 100 matches       2.11          7.12          9.51          11.49
      weeks lost/season            3.0 ±0.5      8.8 ±1.0      11.2 ±1.1     13.3 ±1.1

**Finding 5 – at ANY visible dose the knee-70 lever destroys the pro era's own calibration.** The
fatigue re-price's acceptance band (46–54% season prevalence, `fatigue-reprice-2026-08.md` §6.4)
is blown to 90–98% from K=2 up, and the CAREFUL professional pays almost as hard as the reckless
one (her onsets nearly double at K=2, ×2.6 at K=4). In the junior era the knee separates the
policies because the careful junior lives at 83; in the pro era variant C puts EVERYBODY at 50–70,
so a lever anchored at 70 cannot tell recklessness from a professional schedule. The junior tables
of §3 are the lever working; this table is the same lever mis-aimed.

**Finding 6 – variant C amplifies the dose by ~10–20%, and the interaction was worth measuring but
is not the story.** Against the `--proRecovery 8` counterfactual, the reference player's dose
increment at K=4 is +1.32 onsets/season under shipped base 5 vs +1.12 under base 8 (+18%
amplification; K=8: +1.90 vs +1.71, +11%), and her per-match rate at K=0 reads 2.01 (base 5) vs
1.39 (base 8). The dominant term is the baseline exposure variant C creates (~80% of pro weeks
sub-knee), not the increment it adds to the dose. One side-note the shipped state owes elsewhere:
the reference cell already reads 60% prevalence at K=0 on the current merged calendar – above the
reprice's 46–54% band before any lever is touched. That drift belongs to the reprice's own
re-measure, not to this ruling; it is recorded here so nobody attributes it to the §6 lever later.

**Finding 7 – re-anchoring the threshold lower does not save the shape.** A "start steepening at
40 instead of 70" arm (same formula, threshold 40) was priced on both eras. Junior: grinder
4.53/4.80/5.25 onsets per career at K=4/8/16 with careful pinned at 3.45–3.58 – a cleaner
careful guard (+2% at K=8) but half the grinder visibility per unit dose. Pro: the reference
player STILL doubles (1.69/season at K=4, prevalence 94%; 2.02 at K=8, 98%) – because the pro
season does not hover near the knee, it routinely dives below 40. **No condition threshold
separates a reckless junior from an honest professional schedule, because variant C moved the
whole professional tour into the region every threshold watches.** The gate that separates the
two is the ERA, not the condition value.

## §5 What I would pick, and why – laid out for HIS ruling

**The dose I would pick: K=8, at the shipped knee (70), JUNIOR ERA ONLY** – the steepening applies
while `activeLadderOf !== 'wta'` and the professional tour keeps today's linear coupling exactly.
The junior gate is forced by Finding 5–7, not chosen: every measured shape of this lever, at every
visible dose, breaks the pro era's own accepted calibration (46–54% prevalence → 90–98%) and lands
harder on the honest professional than the §6 text intended for the reckless one. Inside the
junior era – the era his own saves and the ledger's grinder live in – the lever does precisely
what he asked.

The two decisive numbers at K=8 (junior, 40 careers per policy):

1. **The grinder's feed: 6.03 ± 0.30 onsets/career against 3.75 ± 0.23 shipped** – +61%, seven
   SEMs apart; her weekly door goes 53→153, moderates 24→51, severes 2→5, weeks in rehab 9.0→16.7
   per career. Per season that is 3.0 injuries against her own 1.9 – «жёстче и явно» on the injury
   feed itself, not only in the standings.
2. **The careful guard: 3.67 ± 0.28 against 3.38 ± 0.28** – +8.6%, about one SEM, statistically
   at the edge of visibility; zero severe injuries at every dose, weeks lost 8.2→8.9, and the
   honest baseline his saves define (0.68 onsets/season of careful play, «я аккуратно играл и всё
   равно травмы были») is preserved, not erased.

The conservative alternative, if Finding 4 weighs on him: **K=4** buys +35% grinder onsets (5.05 ±
0.27) at a careful cost inside one SEM (3.52 ± 0.28) and leaves the perverse rank-repair effect
at noise level (ranked grinder careers 9/40 vs 8/40 shipped; at K=8 it is 13/40 – forced layoffs
rest the body she refuses to rest, and her tennis improves). K=16 is past the knee of the curve:
+11% more onsets than K=8 for double the dose, one career-ending injury, 17/40 ranked – the
punishment arm visibly repairing the career consequence.

What NO dose of this lever delivers: §6's «~2.5–3x per match». The per-match ratio saturates at
~2.0–2.1x (Findings 1–2: the retirement door owns 65–79% of every feed and is inert; the cap is
NOT the constraint – raising it to 0.24 moved K=8 by +4.5%). If the per-match multiple itself is
the requirement, the honest levers are elsewhere: the retirement door's severity tables, or
post-return fragility (`docs/backlog/injuries-gear-and-open-bugs.md` #3) – both untouched here.

**His call, in one line each:**
- K=8 junior-gated – visible recklessness cost on the feed (+61% onsets, +2.6 severes), careful
  near-untouched (+8.6%, ≤1 SEM), pro era byte-identical. My pick.
- K=4 junior-gated – half the visibility (+35%), careful inside noise (+4%), zero side-effects.
- Any dose WITHOUT the junior gate – rejected by measurement: the careful professional doubles
  and the reprice's 46–54% band reads 90–98%.
- K=0 – the game as shipped already prices recklessness at 1.42x per match and 8/40 ranked
  careers; §6's thin channel stays thin.

**No engine change ships from this spec.** The measurement patch is reverted; the lever, its gate
and its dose are his ruling to make, and whichever line he picks ships as its own change with the
invariant-4 bench run this file already is the baseline for.
