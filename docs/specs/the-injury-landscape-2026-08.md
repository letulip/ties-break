---
type: spec
status: draft
area: engine/body
canonical: false
last-reviewed: 2026-08-24
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

## Next arms, owner-approved 23.08 – running now, recorded so the spec and the work cannot drift

He read the landscape the day it landed and approved two further measurements the same day
(23.08); both are running on this machine as this section is written, on this spec's own
instruments, under the same law – **measurement only, nothing ships**, measurement-local patches
proved live by an absurd-value probe and reverted byte-clean. They are recorded here, before their
results exist, so the running work and this spec cannot diverge about what was asked.

**Arm A – his own cadence, replayed under base 5.** §4's professional rows are priced on the

> His approval, verbatim (23.08): «сделай пожалуйста, и я тоже поиграю сам на каком-то сейве и отгружу свежие данные позже.» – the live-data columns exist for the second half of that sentence.

reprice spec's pair schedule – a bench player entering 30+ events a season – while §2's honest
baseline (his five saves, ~a dozen entries a season, «я аккуратно играл и всё равно травмы были»)
plays a different calendar, and Finding 6 left a debt on exactly that seam: the reference cell
reads 60% prevalence at K=0, above the reprice's 46–54% band, before any lever is touched. The
arm replays HIS entry cadence through `tools/pro-season-probe.ts` under the shipped
`proPhaseRecoveryBase 5` (recovery variant C), the cadence taken from the saves through the same
read-only door as §2 (`tools/injury-saves-read.ts`; the save never copied, never committed). What
it answers: whether §4's sub-knee exposure and the K=0 band drift are facts about the game's
professional season or about the bench schedule's density – whether an honest professional at his
own cadence lives inside the band. The replay-on-his-own-material method is
`tools/policy-vs-owner.ts`'s, already proven: same girl, same world, change only how often she
enters.

**Arm B – the rehab-development fraction: 0 / 30 / 50%.** Finding 4's perverse effect has a named

> His approval, verbatim (23.08): «да, надо померить, но звучит хорошо.»

suspect: `growWeek` is injury-blind – world.ts step 3b passes the training plan whatever
`world.injury` says, so a laid-up week develops at the plan's own full rate, and every forced
layoff is forced rest AND uninterrupted development. That is half the machinery by which injuries
quietly repair a grinder's career (ranked careers 8/40 → 17/40 across the §3 sweep). The arm
prices development during laid-up weeks at **0%, 30% and 50%** of the normal rate against the
shipped 100%, on the §1 cells, and answers two things: how much of Finding 4's rank-repair is
development-through-rehab rather than rest, and which fraction keeps a layoff a real cost without
pretending an injured girl learns nothing for months. Post-draw arithmetic on the growth term,
zero draws moved on any stream, the frozen capture untouched by construction – the K sweep's own
discipline.

Both arms land in this file as their own sections with predicted-vs-measured when the runs
finish; neither moves an engine line without his separate ruling.

---

# Appended 23.08 – the two owner-approved arms («сделай пожалуйста» / «да, надо померить»)

Both arms below are MEASUREMENT ONLY, same law as everything above: the levers ran as
measurement-local, env-driven patches (`TB_SUBKNEE_K` / `TB_SUBKNEE_JUNIOR` in
`src/engine/world/injury.ts`, `TB_REHAB_F` / `TB_REHAB_LONG` on the growWeek call's `loadFactor`
channel in `src/engine/world.ts`), proven live by absurd-value probes, and reverted byte-clean –
`git diff` empty on `src/` at push time, the frozen MAIN capture (41550 / e6b0c709) untouched by
construction (every patch is a post-draw multiply on a threshold or a growth rate; zero draws move
on any stream). Every arm ran in a dedicated worktree at commit c173e03 plus exactly those
uncommitted patches; reader-presence was proved before any real arm was trusted (the null-result
law): `TB_REHAB_F=-50` collapsed the grinder's 104w skill gain +8.50 → −6.93 (end skill
56.79 → 41.36), and `TB_SUBKNEE_K=8` reproduced §3's K=8 row TO EVERY DIGIT (6.03 ±0.30 /
173/51/12/5 / 153/88 / 16.7 ±1.2 / 6.39 / 3.67 ±0.28 / 1.97x / 13/40 ranked) – the recreated
lever IS §3's lever. One bookkeeping correction to the header while we are here: the header's
«K=50 moved grinder onsets 3.75→6.08» cannot be right against §3's own K=16 row of 6.67
(non-monotone); the same probe on the same shape reads 6.92 ±0.26 at K=50, monotone with the table.

**Instruments added 23.08** (committed with this append):

- `tools/his-cadence-read.ts` – the owner's entry CADENCE out of his own saves (20 snapshots,
  5 careers, read-only law). Each save carries only pruned windows (52w results, 400-event match
  feed, 60w finance, 20 injury rows); multiple snapshots per career multiply the coverage, and
  snapshot DELTAS of the monotone `careerTotals.weeksLostToInjury` are exact.
- `tools/his-cadence-probe.ts` – HIS policy as code, on the pro-season-probe skeleton but with a
  LIVED career instead of a stamped book (a #1 stamp closes the low W rungs his mature windows
  still play – his girls sit mid-table). ⚠ It counts onsets AFTER the run commits
  (`sinceWeek === week`, the fatigue bench's marker): the retirement door opens inside
  `finalizeTournament`, and a probe that reads `world.injury` between tick and close is blind to
  the door that feeds 79% of the careful landscape (§1). `tools/pro-season-probe.ts` still counts
  the old way, so §4's ABSOLUTE onset rates are weekly-door-only; its K comparisons stand – that
  lever moves only the weekly door.
- `tools/rehab-lever.ts` – the F × K grid on the fatigue bench's own cells, with the
  development-side columns (end skills, points, ranked careers, first-ranked week).
- one line in `tools/fatigue-bench.ts` – the entry loop now asks `entryStatus` before committing.
  Since the acceptance-cut wave that gate holds the absolute-rank clause (`Grand Slam takes the
  top 112`) which `tierOpenFor` + `availabilityStatus` do not cover, and every 208w bench run
  CRASHED mid-week when a strong junior's window reached slam range (measured: seeds 0-9, ~week
  190). The guard fires exactly where `enterEvent` used to throw and nowhere else – re-running a
  green 104w cell under it is byte-identical (diffed), so no shipped bench number moves.

## §7 His own cadence, replayed under variant C (arm 1)

**What his saves genuinely say** (his-cadence-read over 20 snapshots; READ-ONLY LAW – derived
statistics only). His style, constant across careers: plan 75/25 (olivia's 85/15 is his own harsh
arm), physio ON, hired coach (middle → elite at maturity), NO masseur, potential ~63 / skills
~60-64 at maturity. The mature cadence (naomi/ines windows, seasons 7-12): **26.6-28.8
events/season**, ~70-80 matches/season, rest gaps **25% back-to-back / 45% two-week pairs /
30% three-plus** (mean 2.31w), **6.0 vacation-billed weeks/season**, and the mature windows are
w50..slam with the junior rungs closed behind her. NOT DERIVABLE, stated rather than invented:
**condition at entry** (no historical condition series exists anywhere in a save – the entry
thresholds below are therefore calibrated, not read), vacations beyond each 60-week finance
window, entry tiers beyond each 52-week results window.

**The engine-version split the mtimes force.** The reprice (recoveryBase → 8) shipped 02-04.08;
variant C 22.08; the saves were exported 01-21.08 – so §2's pooled 0.68 onsets/season mixes
engines and eras. Over the intervals that are BOTH base-8-engine and pro-era and 75/25
(naomi w412→674, ines w208→570; olivia = the 85/15 arm, alice w257→474 = a college freeze,
zoe/early-naomi = pre-reprice play): **12.0 seasons, 11 onsets, 29 weeks lost, 894 matches →
0.92 ± 0.28 onsets/season (Poisson SEM), 2.42 weeks lost/season, 1.23/100m** – the honest
validation target. (Era split over every exact interval: junior 0.38/season, pro 0.80/season –
the pooled 0.68 was junior-diluted.)

**The instrument measures the man first** (probe under `--proRecovery 8`, policy frozen at
T1=92 / T0=72 / rescue<65, 16 careers × 3 mature seasons after 8 lived ones, paired seeds):

    quantity                his saves (base 8)   probe @ base 8
    onsets/season           0.92 ± 0.28          0.92 ± 0.13
    weeks lost/season       2.42                 2.35 ± 0.44
    inj per 100 matches     1.23                 1.42
    events/season           26.8 (mature)        25.0 ± 0.4
    matches/season          74.5                 64.7
    vacations/season        6.0                  6.7
    gap mix 1w/2w/3w+       25/45/30             29/56/14

Landscape, volume and vacation habit reproduce inside noise; the one honest residual is the gap
TAIL (his 30% three-plus weeks vs 14% – his long gaps partly ARE his layoffs and his own manual
variance). Equilibrium profile under base 8, for the rows a save cannot carry: mean condition
83.8 ± 0.4, weeks below the knee 9.9 ± 0.4/season, trough 40.

**The three worlds** (same policy, same seeds; nothing but `proPhaseRecoveryBase` moves):

    quantity                base 8 (his old world)  base 6 (softened C)   base 5 (shipped C)
    onsets/season           0.92 ± 0.13             0.96 ± 0.14           1.21 ± 0.15
    weeks lost/season       2.35 ± 0.44             2.50 ± 0.46           3.08 ± 0.51
    inj per 100 matches     1.42                    1.30                  1.67
    season prevalence       63%                     63%                   77%
    mean condition          83.8 ± 0.4              81.2 ± 0.4            80.8 ± 0.4
    weeks below knee(70)    9.9 ± 0.4               13.0 ± 0.5            13.4 ± 0.5
    trough                  40                      30                    30
    events/season           25.0 ± 0.4              28.9 ± 0.3            28.4 ± 0.5
    matches/season          64.7                    74.0                  72.3
    vacations/season        6.7                     11.4                  11.4
    severity mi/mo/ma/se    31/11/1/1               34/9/2/1              43/11/3/1

**Finding 8 – his style does not sit still in the new world: it compensates, and the compensation
is the first bill.** His own rescue rule (take the family week whenever the game offers one) fires
almost twice as often under base 5 – **6.7 → 11.4 packages/season** – and the packages keep him
fresh enough that his back-to-back rule fires MORE (events 25.0 → 28.4). The style he described as
«я аккуратно играл» becomes, under 5, a style that buys nearly double the medicine to play the
same tennis – and still pays **+31% onsets (0.92 → 1.21/season), +31% weeks lost (2.35 → 3.08),
prevalence 63% → 77%**, with the season living 3 points lower and a third more weeks under the
knee.

**Finding 9 – base 6 hands him back his INJURY landscape but not his week.** At base 6 the
injury row is his old world within noise (0.96 vs 0.92 onsets, 2.50 vs 2.35 weeks lost,
prevalence 63% = 63%) at full volume – but the condition profile stays variant-C-shaped (81.2 vs
83.8, sub-knee 13.0 vs 9.9) and the vacation bill stays doubled (11.4). Base 6 is «his injuries
back», not «his world back».

**Finding 10 – the extra-rest price of keeping base 5.** Forcing rest into his cadence under
base 5 (`--minGap 2` = drop every back-to-back: 22.5 events, rest 29.5 wks/season, condition
88.5, onsets 0.77): interpolating between as-played and no-back-to-backs, his old **condition**
(83.8) returns at **+2.3 rest weeks/season** and his old **injury rate** (0.92) at **+3.9 rest
weeks/season** – call it **+2..+4 rest weeks a season, i.e. dropping roughly half his
back-to-back weeks, at −2..−4 events/season** – ON TOP of the doubled vacation bill his rules
already pay. (The `--minGap 3` arm overshoots into a different game: 15.3 events, condition 92.9,
and her rank falls out of the top window – w15-w100 replace the wta500s.)

**His future live data drops into this table's first eight rows.** He will play fresh saves under
shipped base 5; `npx vite-node tools/his-cadence-read.ts -- --save …` (plus injury-saves-read)
prints exactly the save-derivable rows: **onsets/season, weeks lost/season, inj/100m,
events/season, matches/season, gap mix, vacations/season, severity mix** – columns 1-8 of the
base-5 column, same definitions, same windows. The last four rows (prevalence, mean condition,
sub-knee weeks, trough) are probe-only – no save carries a condition series – so his live numbers
land beside the probe's, never replacing those four.

## §8 The rehab-development lever, K-interaction included (arm 2)

**The engine today develops THROUGH rehab.** `growWeek` (tick step 3b) runs every week of every
career and carries no injury gate – a layoff costs the match-learning bonus and nothing else; the
knock's rest branch and the summer block gate through `loadFactor`, vacations gate the coach's
rate, and an injured week trains at full rate. The owner's model says injuries should cost
progress. The lever measured: rehab weeks develop at fraction F; in sub-100% arms a LONG layoff
(totalWeeks > 4) develops at 0. Shape: a multiplier on the growWeek call's `loadFactor` channel
(«how much of the week she actually trained») – zero draws, F=1 unset = shipped byte-identically.

**The grid** – F × K ∈ {0, 8-junior-gated} on the fatigue bench's three policies, 4 profiles ×
seeds 0-9 = 40 careers per policy per cell, paired across cells; 104w (the §3 horizon). The
junior gate (`TB_SUBKNEE_JUNIOR=1`, applies while `activeLadderOf !== 'wta'`) is byte-inert at
this horizon – the F=1 row reproduces §3's ungated K=8 exactly.

    K=8jr             GRINDER                                      CAREFUL
    F      onsets      wksLost  endSkill     pts    ranked | onsets      endSkill     pts     ranked  1stPtsWk
    1.0    6.03 ±0.30  16.7     56.78 ±0.45  10 ±3  13/40  | 3.67 ±0.28  53.91 ±0.40  54 ±13  29/40   57
    0.5    5.80 ±0.31  16.8     56.15 ±0.44   7 ±3  10/40  | 3.52 ±0.26  53.73 ±0.40  57 ±13  29/40   56
    0.3    5.85 ±0.30  17.0     56.08 ±0.44   7 ±3   9/40  | 3.58 ±0.27  53.70 ±0.40  56 ±13  29/40   56
    0      5.88 ±0.31  16.1     56.02 ±0.43   6 ±2   9/40  | 3.50 ±0.26  53.64 ±0.40  53 ±12  30/40   57

    K=0 (shipped dose): the F sweep is flat for everyone – grinder 8/40 ranked and careful 29-30/40
    at every F; grinder endSkill 56.79 → 56.40 (F=0), careful 53.92 → 53.69, both inside one SEM.
    Balanced tracks careful at both doses (35-36/40 ranked at every F, endSkill −0.44 max).

**Finding 11 – the K=8 perverse effect FLIPS, and F=0.3 is where it is fully repaired at this
horizon.** §3 Finding 4's substitution (forced layoffs = forced rest → the grinder's ranked
careers RISE with dose, 8/40 → 13/40 at K=8) comes back down the moment injuries cost
development: **13/40 → 10 → 9 → 9** across F=1 → 0.5 → 0.3 → 0, with her points (10 → 6) and end
skills (56.78 → 56.02) returning to the shipped landscape (8/40, 6 ±2, 56.79). At F ≤ 0.3 the
injury lever is a pure punishment arm again.

**...but only HALF flips at the horizon where the effect is biggest.** At 208w (14→18) the
perverse effect is far larger than §3 ever saw – K=8jr at F=1 nearly doubles the grinder's ranked
careers, **19/40 (shipped) → 30/40** – and the F lever claws back only part of it: 30 → 28 (F=0.3)
→ **25/40 at F=0**, against 17/40 at K=0/F=0. The remainder is the substitution channel itself –
the forced layoffs genuinely rest a body she refuses to rest, and no development lever can make
rest not work. If the §6 dose ever ships, it ships with this fact attached: at K=8 the grinder's
career CONSEQUENCE stays partially repaired even at F=0.

**Finding 12 – the guard holds: no F stalls an honest junior.** Careful at K=8jr, F=1 → 0:
onsets 3.67 → 3.50 (noise), end skill 53.91 → 53.64 (−0.27, two-thirds of one SEM), ranked 29 →
30/40, first ranked week 57 → 57 (104w) and 72 → 67 at 208w – the first-points age does NOT move
(if anything a week earlier, i.e. seed noise), and the same holds at K=0 (53.92 → 53.69). The
balanced default: 39-40/40 ranked at 208w at every F. The lever is invisible to everyone whose
weeks-lost budget is the careful 8-9/career; it prices exactly the 16-17-week grinder budget it
was aimed at.

**Finding 13 – the masseur does NOT become a progress purchase, and the college freeze barely
feels the lever.** At the owner's own pro cadence (arm 1's probe, base 5, F=0.3): masseur-on vs
masseur-off moves end skill by **+0.03 points over three seasons** – a mature career has no
headroom left to protect – while his real product stays the TIME (weeks lost 3.08 → 2.81/season
at F=1). In the junior era, where headroom exists, he is not sold (the unlock is the pro table).
And the owner's own alice save prices the college interaction: 2 onsets / 7 rehab weeks across a
217-week freeze = 1.68 rehab weeks/season – at F=0.3 that forfeits ~2-3% of a college season's
programme development. Neither interaction argues for or against any F.

**The recommended F, framed as his call:**
- **F=0.3, long layoffs at 0 – my pick.** Fully repairs the 104w perversion (9/40), claws the
  208w one back to 28/40, costs the careful junior 0.2 skill points (sub-SEM), moves no
  first-points age, and is the honest fiction – a rehab week is not a training week, and not a
  coma either.
- F=0 – maximal: same at 104w, 25/40 at 208w, careful cost still sub-SEM (−0.27). Pick this if
  the 208w residual (28 vs 25) matters to him more than the fiction.
- F=0.5 – audible but incomplete (10/40); no reason to prefer it.
- F=1 (as shipped) – only if K stays 0: at any real K dose the engine develops the grinder
  THROUGH her punishments, and §3 Finding 4 is the bill.

**No engine change ships from this append either.** Both levers are reverted; F, its long-layoff
threshold, and whether it ships with or before the §6 dose are his ruling – and the arm-1 table
above is the baseline his own fresh saves will be laid against, in the same eight columns.

---

# Appended 24.08 – the doses measured on HIS OWN CAREERS, not on a bench policy

His ask, verbatim: «может быть ты можешь померять дозу травм на моделировании моих сейвов как-то на
нашем стенде? Там много сезонов. Можешь это сделать?» – §3 and §8 priced the K and F levers on
synthetic bench archetypes, §7 priced his POLICY on a reconstructed girl. This append prices both
levers on **the actual worlds**: twenty-one save files, five careers, loaded through the game's own
import door (`decodeExportFile`, i.e. the real `migrateSave` path – the sample declares schema v34
through v54 against a v59 engine) and CONTINUED FORWARD five seasons per arm.

Same law as everything above: **MEASUREMENT ONLY, nothing ships.** The levers ran as the same two
measurement-local, uncommitted env patches §8 used (`TB_SUBKNEE_K` / `TB_SUBKNEE_JUNIOR` in
`src/engine/world/injury.ts`, `TB_REHAB_F` / `TB_REHAB_LONG` on the growWeek call's `loadFactor`
channel in `src/engine/world.ts`), both post-draw multiplies – zero draws move on any stream, the
frozen MAIN capture (41550 / e6b0c709) untouched by construction – reverted byte-clean, `git diff`
empty on `src/` at push time. **READ-ONLY LAW: the saves were never copied, never committed, never
fixtured; the repo keeps only the derived statistics below.**

**Instruments added 24.08** (committed with this append):

- `tools/his-careers-brackets.ts` – the ground truth. Reads the five careers as CONSECUTIVE
  SNAPSHOT PAIRS (the find: two snapshots of one career bracket a real stretch of his play, with a
  known start and a known end) and as an EXACT per-season panel. It does not repeat what
  `injury-saves-read` and `his-cadence-read` already answer; it answers what neither can.
- `tools/his-careers-dose.ts` – the sweep. Loads each save, resumes its persisted MAIN stream
  (`rngMain`, v35) and walks five seasons under thirteen paired arms, IMPORTING his entry rule and
  his vacation habit from `his-cadence-probe.ts` (`nextEntry`, `bookHisVacation`, both newly
  exported behind the `TB_BENCH_NO_AUTORUN` hatch `fatigue-bench.ts` already uses) rather than
  keeping a second copy of the policy.

**⚠ AND ONE CORRECTION TO AN INSTRUMENT BEFORE ANY NUMBER BELOW IS READ.**
`tools/his-cadence-probe.ts` shipped with argv defaults of **T1=80 / T0=55 / rescue<80**, while §7's
own prose names the validated triple as **T1=92 / T0=72 / rescue<65**. The prose was right and the
defaults were wrong: run as committed, at `--proRecovery 8`, the probe reads **1.33 ±0.15
onsets/season, 28.9 events, 74.1 matches, 10.7 vacation packages and a 49% back-to-back share** –
against §7's 0.92 / 25.0 / 64.7 / 6.7 / 29%, and against his own measured 25% back-to-back. A T1 of
80 is above her condition most weeks, so the instrument played a cadence that is not his. At
92/72/65 it reproduces §7's base-8 column **to every digit** (0.92 ±0.13 · 2.35 ±0.44 · 1.42 · 25.0
±0.4 · 64.7 · 6.7 · 29/56/14 · cond 83.8 ±0.4 · sub-knee 9.9 ±0.4 · trough 40 · 63% prevalence ·
31/11/1/1). The defaults are now the validated triple. **No §7 number moves** – that table was
produced at the correct policy, as its prose says; what was broken was the ability to reproduce it.

## §9 What his saves genuinely say – the ground truth, career by career and bracket by bracket

**The sample.** 21 files: `alice-cfbv` (w257, w474) · `ines-xgv7` (w208, w362, w465, w518, w570) ·
`naomi-3c2i` (w193, w230, w412, w466, w569, w621, w674) · `olivia-o1p7` (w104, w195, w361, w413,
w464) · `zoe-royv` (w255), plus `academy-demo` (schema v21, not one of his careers – excluded from
every figure). Five careers, 2437 lived weeks, 47.0 seasons, 2554 matches.

**Three facts make this sample exact where §2 and §7 had to hedge, and they are worth stating
because they change what can be claimed:**

1. **`injuryHistory` is NOT pruned in any of these careers.** `rollInjury` keeps the last twenty
   layoffs; the deepest career here holds **eleven**. So every onset of every career is present with
   its week, severity, weeksOut and body part – the counts below are exact, not floors, and they sum
   to `careerTotals.weeksLostToInjury` in all five careers (13/8/29/29/11).
2. **`seasonHistory` is never pruned either.** Every save carries rows from `seasonIndex` 0, so
   matches, end rank, points and the funds delta are exact for every season of every career.
3. **The ENGINE can be dated per save from its DECLARED SCHEMA VERSION**, read out of the export
   header before migration – tighter than the mtimes §7 had to use. The sample declares v34 (31.07)
   through v54 (20.08). The week reprice (`recoveryBase` 5→8) shipped **02.08**, recovery variant C
   (`proPhaseRecoveryBase` 5) shipped **22.08**. ⚠ **The newest save in the sample predates variant
   C by two days: not one week of his recorded play is a variant-C week.** Everything he has ever
   measured himself against was played on base 8.

### The era gate, on his own careers

The gate variant C uses – and the gate §5 recommends for K – is `activeLadderOf(world) === 'wta'`,
which latches on `bestFinishByTier`, a never-pruned career high-water mark. **It is a ONE-WAY
DOOR**: from her first counting W-series result she is on the professional table to the end of the
game, and `w15` is already a W-series rung.

    career    junior through   professional by   evidence                                    ladder at last snapshot
    alice     w51              w103              byTrack season 1 banked 98 W points         wta (w474)
    ines      –                w157              W-track result w157 (w50)                   wta (w570)
    naomi     –                w160              W-track result w160 (w15)                   wta (w674)
    olivia    w104             w155              activeLadderOf='itf' at w104; byTrack s2=88 wta (w464)
    zoe       –                w210              W-track result w210 (wta250)                wta (w255)

**Every one of his five careers is professional by season 4 at the latest, and three of them by
season 3.** The junior era is 13.0 of his 47.0 recorded seasons – and 19 of his 20 snapshots are
already `wta` at the week they were saved (only `olivia w104` is still `itf`). Hold that; §10 turns
on it.

### Per career

    career   seasons  onsets  per season    wksOut/s  matches  inj/100m  mi/mo/ma/se  plan    last rank  career prize
    alice        9.1       6  0.66 ±0.27        1.42      319      1.88      5/1/0/0  75/25     1 (post-college)  $267,795
    ines        11.0       4  0.36 ±0.18        0.73      727      0.55      3/1/0/0  75/25    75          $8,757,380
    naomi       13.0      11  0.85 ±0.26        2.23      787      1.40      9/1/1/0  75/25    85          $1,581,120
    olivia       8.9       9  1.01 ±0.34        3.24      500      1.80      3/6/0/0  85/15    72          $2,651,420
    zoe          4.9       2  0.41 ±0.29        2.23      221      0.90      1/0/1/0  75/25    65            $111,250

(SEM is Poisson, √n/seasons.) His injury landscape is **not flat across his own careers**: ines runs
0.36 a season and olivia 1.01, a factor of 2.8, and the two differences that go with it are the two
he chose – olivia is his 85/15 plan and played her first ~250 weeks with **physio OFF**, while ines
ran 75/25 with physio on and an elite coach from season 4. Severity follows: 6 of olivia's 9 onsets
are moderate; 9 of naomi's 11 and 3 of ines's 4 are minor.

### The brackets – what a consecutive pair actually records

Each row is a real stretch of his play with a known start and a known end. `entries` is the count of
his committed events inside the bracket that a retained 52-week results window still holds – a
bracket longer than ~104 weeks has weeks whose entries were deleted years before the question was
asked, and those rows are marked `*`.

    career  bracket        wks  seas  onsets mi/mo/ma/se wksOut entries  rank       prize        vac  staff
    alice   w257->w474     217   4.2       2  1/1/0/0         7    1*    62->1      $14,865       0*  COLLEGE FREEZE
    ines    w208->w362     154   3.0       2  1/1/0/0         5   29*    23->87     $942,720     11*  coach middle->elite
    ines    w362->w465     103   2.0       0  0/0/0/0         0   25*    87->81   $1,065,450      7*
    ines    w465->w518      53   1.0       0  0/0/0/0         0   22*    81->77   $4,011,700      8*
    ines    w518->w570      52   1.0       2  2/0/0/0         3   24     77->75   $2,656,000     12
    naomi   w193->w230      37   0.7       1  1/0/0/0         2    7      75->6      $18,090      6   coach budget->middle
    naomi   w230->w412     182   3.5       1  1/0/0/0         1   21*      6->74     $46,040      4*
    naomi   w412->w466      54   1.0       0  0/0/0/0         0   20*    74->82      $90,150      3*
    naomi   w466->w569     103   2.0       1  0/0/1/0        12   26*    82->77     $190,500      4*
    naomi   w569->w621      52   1.0       3  3/0/0/0         4   27     77->84     $162,250      9
    naomi   w621->w674      53   1.0       3  3/0/0/0         5   27*    84->85   $1,062,840      7*  coach middle->elite
    olivia  w104->w195      91   1.8       3  1/2/0/0        12   17*     4->59      $43,520      2*  75/25, physio OFF
    olivia  w195->w361     166   3.2       4  1/3/0/0        12   26*    59->88     $354,150      7*  75/25->85/15, physio ON
    olivia  w361->w413      52   1.0       1  1/0/0/0         1   30     88->81   $1,095,950      5   85/15
    olivia  w413->w464      51   1.0       1  0/1/0/0         4   30     81->72   $1,157,800      7   85/15
    zoe     (single snapshot – no bracket)

Two things a bracket shows that a career total cannot. (a) **His cadence roughly doubles between the
junior years and the mature tour** – 10.8-16.3 events a season at naomi w193/w230 and olivia
w104/w195, 25-33 at every mature window, peaking at olivia's 85/15 arm (32.8 at w413). (b) **The
layoffs cluster.** naomi's last 105 weeks carry 6 of her 11 career onsets; olivia's first
professional 91 weeks carry 3 of her 9 (and 12 of her 29 lost weeks) at physio OFF. A per-career
mean of 0.85 hides both.

### The onset rate – which of the three numbers this fuller sample supports

    cut                                          seasons  onsets  per season   wksOut/s  matches  inj/100m  mi/mo/ma/se
    DI §2: every career, every era, every engine    47.0      32   0.68 ±0.12      1.92     2554      1.25     21/9/2/0
    DI2 §7: junior (pro from the proof week)        13.0       5   0.38 ±0.17      1.31      716      0.70      3/1/1/0
    DI2 §7: professional                            34.0      27   0.80 ±0.15      2.15     1838      1.47     18/8/1/0
    NEW – pro AND post-reprice AND playing          23.9      24   1.00 ±0.20      2.72     1511      1.59     16/7/1/0
      of which plan 75/25                           18.0      16   0.89 ±0.22      2.12     1180      1.36     14/1/1/0
      of which plan 85/15 (his own harsh arm)        5.9       8   1.35 ±0.48      4.54      331      2.42      2/6/0/0
    the college freeze (alice w266-w474)             4.1       2   0.48 ±0.34      1.69        0         -      1/1/0/0
    pre-reprice weeks (naomi seasons 0-3)            4.0       2   0.50 ±0.35      1.25      208      0.96      1/1/0/0
    conservative read: proven junior                 3.0       1   0.33 ±0.33      0.33      172      0.58      1/0/0/0
    conservative read: proven professional          29.0      26   0.90 ±0.18      2.45     1581      1.64     17/8/1/0
    conservative read: unassignable (pruned)        14.9       5   0.34 ±0.15      1.21      801      0.62      3/1/1/0

**Both of DI's and DI2's published figures reproduce exactly on the full sample** – 0.68 pooled,
0.38 junior, 0.80 professional – so neither was a sampling artefact, and DI2's diagnosis holds:
**the 0.68 is junior-diluted and engine-mixed, and 0.68 is the wrong number to calibrate a
professional dose against.**

**The answer is a FOURTH number: 1.00 ± 0.20 onsets a season.** DI2's 0.92 ± 0.28 was measured on
12.0 seasons and 11 onsets, restricted to 75/25 play; the same cut widened to every career (pro
era · post-reprice engine · actually playing) is **23.9 seasons and 24 onsets – twice the sample –
and reads 1.00 ± 0.20, 2.72 weeks lost a season, 1.59 per 100 matches.** 0.92 sits comfortably
inside it, so this is a refinement and not a contradiction, and the reason for the drift is
nameable rather than statistical: **DI2 excluded olivia as "the 85/15 arm", and olivia is a real
career of his that runs 1.35 ± 0.48.** Split his own way, the two numbers are 0.89 ± 0.22 for
75/25 and 1.35 ± 0.48 for 85/15 – and the honest single figure for "his professional play" is the
pooled 1.00.

**What the saves do NOT record, stated rather than inferred:**
- **Condition at entry, and any condition series.** No save holds one; §7 already said so and it is
  still true. What does exist is 20 POINT samples of `world.condition` at the export week (mean
  87.7, range 53-100) – a biased sample, since he exports when he exports, but it is the only
  observation of his condition that exists at all, and it is not evidence against the probe's
  equilibrium of 83.8.
- **Entry tiers outside each snapshot's 52-week results window, and vacations outside its 60-week
  finance window** – the `*` rows above.
- **The exact week the professional era opened** on the four careers whose early `byTrack` rows
  predate v46 (which back-fills nothing). Reported as a bracket, and the 14.9 seasons that fall in
  those brackets are shown unassigned in the conservative read rather than being assigned.
- **When each career was STARTED.** A save's declared version dates its last write, not its first
  week, so the seasons before a career's first snapshot carry an upper bound only.

## §10 The doses on HIS careers – and the era finding that decides the ruling

Every save loaded through `decodeExportFile`, its persisted MAIN stream resumed (`rngMain`, v35),
then **five seasons walked per arm** under his imported entry rule and vacation habit. Twenty
snapshots × thirteen arms × 260 weeks = **4963 weeks of continued play per arm**, ~100 season
observations, paired save-by-save. His money is left exactly as saved (no top-up), so a bankruptcy
is a real outcome and is counted.

### Null-result law first: every arm is proved to contain its change

Before any null below is believed, both readers were proved live **in the same tree**:

- **The K reader, in the era where the gate is OPEN.** `tools/rehab-lever.ts`, 3 seeds × 4 profiles
  × 3 policies × 104w, junior era, `TB_SUBKNEE_K=8 TB_SUBKNEE_JUNIOR=1` against the K=0 control:
  grinder onsets **3.25 ±0.48 → 5.58 ±0.70**, weeks lost **7.4 → 12.8**, ranked careers 2/12 →
  4/12; careful 3.00 → 3.33. The junior gate does not disable the lever – it fires hard when the
  era is junior, in the direction and magnitude §3 measured.
- **The K reader, on HIS careers.** `PROBE-K50` (absurd dose, ungated) moves his own continued
  careers by **+2.10 ±0.40 onsets and +7.30 ±1.95 weeks lost per save** over five seasons, severity
  67/27/5/0 → 91/37/13/0.
- **The F reader.** `TB_REHAB_F=-50` on the junior bench collapses the grinder's 104w skill gain
  **+8.65 → −4.03** (end skill 57.14 → 44.45), reproducing §8's own probe.

### ⭐ Finding 14 – a junior-gated K cannot touch a single one of his careers, at any dose

    save                startWk  ladder at load  junior weeks in 260 walked
    olivia-o1p7_w104        104  itf                                      2
    every other snapshot      –  wta                                      0
    TOTAL                                              2 of 4963 (0.04%)

`activeLadderOf` latches on `bestFinishByTier`, a never-pruned high-water mark, so the professional
arm is **a one-way door** – and `w15` is already a W-series rung, which his girls reach in season
2-4. Nineteen of his twenty snapshots are already `wta` at the week he saved them; the twentieth
(olivia at w104) latches after **two** more weeks.

The consequence, measured rather than argued:

    arm            d onsets / 5 seasons   d weeks lost      d events      tournaments missed
    K4jr           +0.00 ±0.00            +0.00 ±0.00       +0.00 ±0.00                     0
    K8jr           +0.00 ±0.00            +0.00 ±0.00       +0.00 ±0.00                     0
    PROBE-K50jr    +0.00 ±0.00            +0.00 ±0.00       +0.00 ±0.00                     0
    (PROBE-K50, the same dose UNGATED, in the same tree, on the same saves:
     +2.10 ±0.40      +7.30 ±1.95      −1.45 ±0.98      224 tournaments displaced)

**Byte-identical on all twenty snapshots – not "within noise", identical**: same onsets, same
severity mix, same weeks lost, same events, same prize, same end skill, same rank. **§5's
recommended lever, at its recommended dose and with its recommended gate, is a no-op on the owner's
own five careers, and stays a no-op at a dose of fifty.** A lever that cannot reach his careers is
not the lever he asked for.

### Finding 15 – ungated, the K dose is real but SMALL on his careers: +6.7%, not +61%

    arm        onsets/season   sev mi/mo/ma/se   wksLost/s   events/s  matches/s  meanCond  subknee/s  prize/season
    SHIPPED    1.04 ±0.09      67/27/5/0             2.69       24.6       70.6      81.1       12.0      $909,152
    K4         1.09 ±0.10      70/28/6/0             2.85       24.6       70.4      81.1       11.9      $905,276
    K8         1.11 ±0.11      73/28/5/0             2.83       24.6       70.3      81.1       11.9      $910,731
    F0.3       1.13 ±0.11      76/28/4/0             2.76       24.6       70.6      80.9       12.1      $920,256
    F0         1.14 ±0.11      77/28/4/0             2.78       24.6       70.9      80.9       12.2      $938,798
    K8-F0.3    1.16 ±0.11      78/29/4/0             2.84       24.6       70.4      80.9       12.0      $924,639
    K8-F0      1.18 ±0.11      80/29/4/0             2.87       24.6       70.7      80.9       12.0      $943,005
    PROBE-K50  1.48 ±0.12      91/37/13/0            4.22       24.3       69.4      81.1       11.9      $872,946

Paired against SHIPPED, one pair per save (SEM across the 20 snapshots, and in brackets the
conservative SEM across the FIVE careers, since two snapshots of one career are not independent):

    arm         d onsets / 5 seasons          d weeks lost / 5 seasons     d events / 5 seasons
    K4          +0.25 ±0.16 (±0.16)           +0.75 ±0.65 (±0.55)          −0.05 ±0.05 (±0.04)
    K8          +0.35 ±0.20 (±0.19)           +0.65 ±0.36 (±0.32)          −0.10 ±0.16 (±0.10)
    F0.3        +0.45 ±0.31 (±0.20)           +0.30 ±0.33 (±0.21)          −0.35 ±0.32 (±0.25)
    F0          +0.50 ±0.35 (±0.19)           +0.40 ±0.45 (±0.26)          −0.20 ±0.32 (±0.28)
    K8-F0.3     +0.60 ±0.28 (±0.26)           +0.70 ±0.50 (±0.29)          −0.35 ±0.27 (±0.18)
    K8-F0       +0.70 ±0.35 (±0.27)           +0.85 ±0.56 (±0.28)          −0.05 ±0.20 (±0.12)

**K=8 UNGATED buys +0.07 ± 0.04 onsets a season on his careers – 1.04 → 1.11, +6.7%** – against
the **+61%** the same dose buys the bench grinder (§3: 3.75 → 6.03 per 104w career). Two SEM puts
the ceiling at about +14%. And that is not a defect in the lever: **his careers behave like the
bench's CAREFUL policy, whose §3 response to K=8 is +8.6%.** The three numbers agree, and they say
the same thing three ways – the lever prices recklessness, and there is no recklessness in his
saves to price. He plays 24.6 weeks of 52, at mean condition 81.1, with 12.0 weeks a season below
the knee; the grinder lives at 52 and spends 70% of her weeks there.

### Finding 16 – ⭐ the number he feels: the dose costs him essentially no tournaments

Of the events the SHIPPED arm played, the number this arm did NOT play, over 5 seasons × 20 saves:

    arm         events he loses      events he gains instead    NET events / 5 seasons
    K4                        6                            5      −0.05 ±0.05
    K8                       17                           15      −0.10 ±0.16
    F0.3                     62                           55      −0.35 ±0.32
    F0                       77                           73      −0.20 ±0.32
    K8-F0                    86                           85      −0.05 ±0.20
    PROBE-K50               224                          195      −1.45 ±0.98

**The calendar re-flows around a layoff instead of shrinking.** At K=8 he loses 17 tournaments
across a hundred continued seasons and gains 15 back – a NET of one tenth of one tournament per
five seasons, indistinguishable from zero. Even at the absurd K=50 the net cost is **1.45
tournaments in five seasons**. His cadence has slack: he enters 24.6 of 52 weeks, so a two-week
layoff lands on weeks he was resting anyway, or pushes an entry one week down the calendar. This is
the honest answer to "how many of my tournaments would I have missed": under every dose on the
table, **none that he would notice.** (The larger displacement counts under the F arms are almost
entirely re-flow, not loss – F moves her skills, her skills move a match, and the schedule
downstream of that match is different without being shorter. End skill over five seasons moves
59.58 → 59.55, which is §8's Finding 13 again: a mature career has no development headroom left.)

### Finding 17 – nothing else moves either, and the one career that ends is ended by money

Across every arm: **end rank 83, unchanged. Prize $0.87-0.94M a season, ±3%, with no monotone
trend in the dose. End skill 59.55-59.58. Mean condition 80.9-81.1. One career ending in every
arm** – `naomi w412`, and it is `bankruptcy` at **w435, 23 weeks in, at the identical week in all
thirteen arms including K=50 and F=-50.** She was saved with $8,070 and a middle coach's bill; the
injury lever is not what threatens that career, her bank balance is. **Career-ending INJURIES: zero
at every real dose, and zero even at K=50.** The only one in the whole sweep is `naomi w193` under
`PROBE-F-50` (`injury@w447`) – a girl whose skills the absurd arm is actively destroying, which is
what an absurd arm is for.

The severity mix is where the ungated dose is at least visible: **minors 67 → 73 and moderates
27 → 28 at K=8, over ~100 continued seasons; majors 5 → 5, severes 0 → 0 at every real dose.** At
K=50 it becomes 91/37/13/0. No dose on the table gives him a severe injury.

### Finding 18 – where each lever DOES land on his careers, save by save

Neither lever is uniform across him, and the concentration is the interesting part. Onsets over the
continued five seasons, per snapshot, SHIPPED → arm (only the snapshots that move are listed; the
rest are identical):

    K=8 UNGATED moves 3 of 20 snapshots, and they are his DENSE windows
      olivia w104   6 → 9   (+50%)   his 85/15 arm, the physio-off era
      olivia w195   7 → 9   (+29%)   his 85/15 arm
      naomi  w569   7 → 9   (+29%)   28.3 events/season, his busiest naomi window
      ines (all 5) · alice (both) · zoe · every mature 75/25 naomi window:  +0

    F=0.3 moves 2 of 20 snapshots, and they are his YOUNGEST
      naomi  w193   3 → 7            season 3, skill 60 against potential 66
      olivia w195   7 → 12           season 3
      every mature snapshot (skills at 60-64, potential 63-66):  +0

**This is the discrimination §6 asked for, appearing in his own careers rather than in an
archetype.** The K lever finds the two windows where he pushed hardest and leaves the eleven mature
75/25 windows untouched – 0.00, not "within noise". And F behaves exactly as §8's Findings 12-13
predicted: it prices development, so it can only bite where development headroom is left, and a
mature career has none. ⚠ Both are DOWNSTREAM effects through the schedule (a lever changes a body,
the body changes a match, the match changes next season's rungs), so a single snapshot's +4 is one
draw of a noisy quantity; the pattern across snapshots is the claim, not any one row.

### Finding 19 – his own worlds validate §7's probe, and correct §4's framing of "the pro era"

The continued careers are an independent check on §7's arm-1 reconstruction, and it holds:

    quantity                    §7 probe @ base 5   HIS OWN WORLDS, continued @ base 5
    onsets/season               1.21 ±0.15          1.04 ±0.09
    weeks lost/season           3.08 ±0.51          2.69
    events/season               28.4 ±0.5           24.6
    mean condition              80.8 ±0.4           81.1
    weeks below the knee(70)    13.4 ±0.5           12.0

Five rows inside noise on a reconstruction that never saw these worlds. §7's probe measured the man.

⚠ **And that reading corrects §4, which is what the ruling turns on.** §4's headline – «the
professional season lives below the knee», **42.4 ± 1.0 of 52 weeks** – and Finding 5's «at ANY
visible dose the knee-70 lever destroys the pro era's own calibration» were both measured on the
reprice spec's pair schedule. **His own professional careers spend 12.0 of 52 weeks below the
knee**, a factor of 3.5 lower, because he buys recovery: §7 Finding 8 counted his rescue habit
firing 6.7-11.4 times a season. **"The pro era lives below the knee" is a fact about a bench
schedule that never books a family week, not about the professional era.** The calibration the
junior gate was chosen to protect is not the calibration his careers are in.

## §11 The ruling, framed as HIS decision

He asked for the dose measured on his own saves. It is, and the measurement changes the answer §5
arrived at from the bench.

**The two numbers that decide it:**

1. **A junior-gated K is +0.00 ± 0.00 on twenty of his twenty snapshots – and still +0.00 at a dose
   of fifty.** Not small; identical. Nineteen of his twenty saves are already on the professional
   table when he saved them, the twentieth latches two weeks later, and the latch is a one-way door.
   §5's recommended lever, at its recommended gate, cannot reach a single week of his play.
2. **Ungated at K=8 it does exactly what he asked, on his own material: +50% onsets on olivia
   (6 → 9 over five seasons, his 85/15 arm), +29% on his two next-densest windows, and +0.00 on
   ines, alice, zoe and every mature 75/25 naomi window.** Pooled that is 1.04 → 1.11 a season
   (+6.7% ± 3.8%) – the CAREFUL policy's §3 response (+8.6%), which is the right comparison,
   because his play is careful play.

**And the number that says it is safe to do:** the dose costs him **a net 0.10 ± 0.16 tournaments
per five seasons** (17 displaced, 15 regained), leaves his rank at 83 and his prize money inside
3%, and gives him **zero severe injuries at every dose on the table.** The lever cannot cost him a
career: the only ending in the whole sweep is naomi w412's bankruptcy at w435, identical in all
thirteen arms.

**My recommendation: K = 8, UNGATED. F = 0.3, on §8's evidence rather than on this one.**

The gate has to go, and the reason is §4's own instrument rather than a change of taste. The gate
was forced by Finding 5 – an ungated dose blowing the pro era's 46-54% prevalence band to 90-98% –
and Finding 5 was priced on a schedule that spends 42.4 of 52 weeks below the knee. His careers
spend 12.0, because he buys recovery packages and the bench player does not. **The gate protects a
professional who does not exist in his saves, at the price of protecting every professional who
does.** If the bench reference player is a real playstyle worth protecting, the honest instrument
is an EXPOSURE gate (sub-knee weeks per season, or the vacation habit), not an ERA gate – and that
is a separate measurement, not this ruling.

**On F, the honest answer is that his careers cannot decide it.** F moved two of his twenty
snapshots, both season-3 windows with development headroom, and nothing at all on the sixteen
mature ones – which is §8's Findings 12-13 reproducing, not new evidence. The perverse effect F
exists to repair (§3 Finding 4: the grinder's ranked careers RISING with dose) does not occur in
his careers at any arm, because there is no grinder among them. **F=0.3 stays my pick on §8's
junior-bench evidence; this measurement neither supports nor contradicts it, and says so.**

**His call, in one line each:**

- **K=8 ungated + F=0.3 – my pick.** +50% on his hardest career, +0.00 on his careful ones, net
  −0.10 tournaments per five seasons, zero severes. The only option that touches his own play.
- K=8 ungated + F=1 (shipped rehab) – the same injury result on his careers (F is invisible to a
  mature career); pick it if §8's junior evidence does not convince him.
- **K=8 or K=4 junior-gated – rejected by this measurement**, and rejected on the strongest possible
  grounds: it is provably a no-op on all five of his careers, at every dose up to 50. It is a
  change he would never see.
- K=0 – the shipped game already prices his professional play at **1.00 ± 0.20 onsets a season**
  (§9's fourth number), 2.72 weeks lost, and 1.35 on his 85/15 arm against 0.89 on his 75/25 one.
  His «я аккуратно играл и всё равно травмы были» is the game working, and the gap between his two
  own plans is already a real signal.

**No engine change ships from this append either.** Both patches were reverted byte-clean; `git
diff` is empty on `src/`, `tests/condition.test.ts` is green on the frozen capture (41550 /
e6b0c709), and the (K, F) pair and its gate remain his ruling to make.

---

# Appended 26.08 – the half-season before college, read to the floor (round 26 items 14 and 15)

**MEASUREMENT ONLY, and `git diff src/` is empty at push.** The owner, on his own w502 save: «Alice
поймала 2 травмы за половину сезона до колледжа, как будто многовато, но проверь пожалуйста по всем
показателям» (#14) and «Посмотри статистику побед/поражений для Alice за эту половину сезона до
колледжа и сверь с её показателями скиллов» (#15). Both are RATE questions, and both are answered
below against the shipped model at her own exposure rather than against a feeling.

**The instrument** is `tools/his-careers-brackets.ts --window A:B`, an extension of the reader §9
already uses – no fourth reader, no second decode of the save, and the section prints nothing unless
`--window` is given, so every existing run of that tool is byte-identical. The save is read through
`decodeExportFile` under the same READ-ONLY LAW as §2 and §9: never copied, never committed, never a
fixture, and only the derived statistics below live in the repo.

    npx vite-node tools/his-careers-brackets.ts -- --save <hers>.tsave --window 268:293 --mc 4000

⚠ **The `alice` row of §2 is a DIFFERENT CAREER.** That row is a w474 snapshot holding 6 onsets over
319 matches; this save is `alice-cfbv` at w502 and holds **8 onsets over 369 matches with all eight
landing before w474**, so the two cannot be the same career and must not be pooled. Same first name,
different seed.

## §12 The window's ground truth – what her ledger actually holds

The college freeze opens at `college.fromWeek = 294`, so «half a season before college» is
**weeks 268–293, the last 26 weeks of play.** Read, not inferred:

    onset  recovered  severity  weeks out  door         kind
    w279   w281       minor     2          RETIREMENT   ankle soreness
    w286   w287       minor     1          RETIREMENT   forearm niggle

**Two onsets, both the smallest injury the game deals, three weeks lost out of twenty-six** – and in
the same twenty-six weeks she won three titles (W50 w273, W75 w282, W50 w290).

⚠⚠ **`injuryHistory[].week` IS THE RECOVERY WEEK, NOT THE ONSET WEEK**, and every rate built on it
is off by `weeksOut` until that is fixed. `rollInjury` pushes the row in the branch that CLEARS the
layoff, at `world.week`; the onset is `week − weeksOut` (plus `weeksSaved` where a masseur bought
weeks back). §9's per-season panel attributes a layoff to "the season its ONSET week falls in" and
then uses the row's own week – the tool now checks whether that matters and reports it: **0 of the 8
rows in this save cross a season boundary between the two readings, so §9's published numbers are
untouched.** The correct reading is used throughout §§12–15 and the aggregate above is deliberately
left alone rather than silently re-stated.

⭐ **AND THE DOOR IS THE HEADLINE. Neither injury came from the weekly roll.** Both are on-court
retirements: `WorldMatch.retiredId === KID_ID` on the QF of the w279 WT500 (3-6 6-3 2-4 against C.
Iyer) and on the R32 of the w286 slam (5-7 6-1 5-1 against T. Kaminski), and `world.ts` opens a
layoff for each by construction – `if (retiredMatch) retirementInjury(world)`. The two doors cannot
collide in one week (a girl the weekly roll injures at step 1c never takes the court), so the
attribution is exact rather than probabilistic. **Her whole career reads 3 weekly / 5 retirement.**

This matters because the two doors are driven by completely different quantities. The weekly roll is
`injuryTau`, one Bernoulli per WEEK, reading condition, age, trailing load and the physio rung. The
retirement door is `RETIRE_K · spentness(pointNumber, stamina)`, a hazard per POINT, which is zero
until point 120 and then accumulates – so it is bought with **minutes on court**, and a rung that
plays five matches in a week integrates five matches' worth of it. Answering #14 against the weekly
hazard alone would have answered the wrong question.

## §13 Her exposure – and the condition series, recovered for the first time

    14 event weeks of 26 · 42 matches · 31-11 · 3 titles
    tiers: wta500 x4, w50 x2, w75 x2, wta125 x2, slam x2, w100 x1, wta250 x1
    plan 75/25 · physio ON (middle rung, riskFactor 0.724) · no masseur
    coach `middle-2`, travelling to EVERY event in the window (all seven rungs pay prize money,
      so `coachTravelFareFor` is non-zero at each and the on-court edge is the doubled +0.870/wing)
    the only knock in reach (w267-269, wrist) was answered REST -> knockTauFactor 1

**1.62 matches per calendar week** against her own season-4 density of 1.19 (62 matches over 52
weeks), her season-5 density of 1.47, and the corrected professional bench's 0.78–0.85. This is the
densest stretch of her career and roughly twice a comparable professional season.

⭐ **CONDITION AT ENTRY IS RECOVERABLE, and §2/§7/§9's "no save holds one" is now half-wrong.** It is
not stored, but it is INVERTIBLE. `kidMatchPlayerFor` composes her on-court build as
`raw × conditionMatchFactor(condition) × surfaceStyle × kit + coachEdge`; three of those four are
pure functions of (week, surface, seed, profile) and computable at any week, and the composed
five-vector is FROZEN into every match row (`WorldMatch.a`). Divide the three known factors out and
what remains is `raw_wing × f(condition)`. The remaining scale is fixed by the save's own anchor:
**`college.years[0].startSkill` is the arithmetic mean of her five raw skills at the enrolment week**
– verified, not assumed (`endSkill` equals the mean of `world.skills` to 1e-15).

**Both ends of the bracket are proofs, not fits**, and they need no development model at all:

- raw skill is monotone non-decreasing, so `mean_raw(W) ≤ mean_raw(294) = 59.3356` – a hard **lower**
  bound on `f`, hence on condition;
- and `f ≤ 1` everywhere, so the RUNNING MAXIMUM of the measured series is a hard lower bound on raw
  skill – hence `measured(W) / env(W)` is a hard **upper** bound on `f`. It is vacuous exactly at the
  running maxima (where it only says "at or above the knee") and informative at every dip below them,
  which is the half that matters: **a dip below a monotone curve cannot be anything but condition.**

`f` saturates at the knee (`matchStrengthKnee` 70, `matchStrengthFloor` 0.55), so no read above 70 is
claimed. What the window says:

    week  tier     m   W-L   trail4   raw*f    cond>=  cond<=   note
    w269  wta125   2   1-1   2        58.594   68.1    69.8
    w270  wta500   2   1-1   2        58.617   68.1    69.8
    w273  w50      5   5-0   2        58.655   68.2    69.9     TITLE
    w274  wta250   2   1-1   2        58.268   67.2    68.9
    w277  wta125   2   1-1   2        58.694   68.3    -
    w279  wta500   3   2-1   2        58.725   68.4    -        <- ONSET (retirement)
    w281  slam     1   0-1   2        58.750   68.5    -
    w282  w75      5   5-0   3        58.758   68.5    -        TITLE
    w286  slam     3   2-1   1        59.241   69.8    -        <- ONSET (retirement)
    w287  w75      4   3-1   2        59.249   69.8    -
    w288  wta500   1   0-1   3        54.308   56.8    57.0     <- deep sub-knee, and she lost
    w290  w50      5   5-0   3        59.281   69.9    -        TITLE
    w291  w100     4   3-1   3        59.289   69.9    -
    w293  wta500   3   2-1   3        59.311   69.9    -

She went on court **at or barely under the knee all window** (floor 67.2–69.9), provably below it at
w274 (≤68.9) and deeply below it at **w288 (≤57.0)** – the week after a slam retirement plus a
four-match W75. Neither ONSET happened at a low condition: both landed at a floor of 68.4 and 69.8.

⚠ **Sensitivity, stated rather than buried.** `coachOnEventWeeks` is a point sample at w502; if the
stance had been OFF in the window the edge would be +0.435 instead of +0.870 and every condition
number above rises by ~1.1 uniformly. It shifts the floor, not the dips, and the dips are the reading.

## §14 #14 answered – the model's own prediction, at her own exposure

**The weekly door**, through the shipped `injuryTau` on a clone of her world stamped to each week,
at the LOWER condition bound (the operand that maximises tau) and with the two unobservables – a
booked vacation, a resort recovery buff – set to absent, both of which only reduce tau:

    23 healthy weeks · SUM(tau) = 0.177 expected onsets (physio ON) / 0.244 (physio OFF)
    P(>=2) = 1.4% / 2.5%          REALISED THROUGH THIS DOOR: 0

**The retirement door**, priced by Monte Carlo over 4,000 reseeds of `simulateMatch` per match – the
full point loop with momentum, the big-point penalty, the fatigue term and the retirement hazard,
on the exact frozen players she met. ⚠ **Provenance first: all 42 matches reproduce winner AND
scoreline byte-for-byte at their stored seed**, so the reseeds resample the same object.

    expected retirements BY HER   0.461 ± 0.675 over 42 matches
    expected by EITHER side       1.043 = 2.48% of matches, against RETIRE_K's own 2.73% calibration
    P(>=2)                        7.8%          REALISED: 2

**Both doors convolved exactly** (independent Bernoullis given the exposure – one per healthy week,
one per match):

    expected 0.638 onsets in the window
    P(0) 52.6%  ·  P(1) 34.0%  ·  P(>=2) 13.4%  ·  P(>=3) 2.6%

**Two onsets in this window is a 13.4% event under the shipped model at her own exposure – roughly
one window in seven and a half.**

### The population figures, and the exposure normalisation that dissolves most of the gap

    figure                                                     onsets/season   per 100 matches
    ROUND 25, his professional play (23.9 seasons, 24 onsets)   1.00 ± 0.20     1.59
    her own play before college (5.65 seasons, 6 onsets, 369 m)  1.06 ± 0.43     1.63
    pro-season-probe, reference cell, CORRECTED (48 seasons)    1.29 ± 0.16     3.19
    pro-season-probe, greedy cell, CORRECTED (48 seasons)       1.10 ± 0.18     2.51
    the shipped model AT HER OWN EXPOSURE in this window        1.28            1.52
    REALISED in the window (2 onsets, 26 weeks, 42 matches)     4.00 ± 2.83     4.76 ± 3.37

⚠ Round 25's 1.00 ± 0.20 is a both-doors figure read off saved `injuryHistory`, but the sample spans
engines from before 10.08, when the retirement door did not exist – so it is a floor for a career
played on today's engine, not a like-for-like.

**Read per season she is at 4.0x the round-25 baseline. Read per MATCH she is at 3.0x it, and at
1.5x a corrected bench of the current engine. Read against the model at her own exposure she is at
3.1x an expectation of 0.638 – and the realised figure's own Poisson error is ±2.83 a season, so
4.00 against 1.00 is z = 1.06.** That is not a signal; it is two events.

### ⭐ VERDICT on #14: reproduced, and the model is correct. The window is dense and then unlucky.

Nothing is wrong. Decomposed, «многовато» is: (1) **exposure** – 42 matches in 26 weeks, about twice
a comparable professional stretch, and the retirement hazard is bought per match, so her expected
onset count is genuinely above the population figure BEFORE any luck; (2) **the tail** – two onsets
against an expectation of 0.638 is the 13.4% branch, one window in seven and a half; (3) **the word
"injury" doing more work than the injuries did** – both were `minor`, together they cost three weeks
of twenty-six, and the stretch they interrupted produced three titles. The weekly roll's prediction
of ~0.18 onsets was met exactly: it produced none.

## §15 #15 answered – her W/L against what her skills predict

Her build in the window, read off the frozen snapshots rather than modelled:

    wing            raw x f (w293)   on court   potential   field mean   edge over the field
    serve                   54.83      55.59       57.38        48.04      +7.54
    ret                     60.09      60.33       63.86        49.89     +10.43
    composure               68.06      68.93       72.11        49.60     +19.33
    stamina                 58.33      58.89       62.74        48.83     +10.05
    groundstrokes           55.24      55.76       57.34        48.63      +7.13
    mean on court 59.90 vs a field mean of 49.00 · counterpuncher · seasonHistory[5].endRank 85

Two predictions, both from the engine's own functions on the players she actually met – the closed
form `fastMatchProbability` (i.e. `pMatchBo3(basePServe(...))`, literally how the engine resolves an
AI-AI match) and the Monte Carlo above. Expected wins is the Poisson-binomial sum, SEM `sqrt(Σp(1−p))`:

    realised            31-11  (73.8%)
    closed form         29.20 ± 2.76   z = +0.65
    full point engine   29.39 ± 2.74   z = +0.59

    by tier   n   W-L    exp    SEM     z          by round   n   W-L    exp    SEM     z
    w50      10  10-0   9.00   0.95   1.06         r0        14  12-2   9.19   1.61   1.74
    w75       9   8-1   7.19   1.18   0.68         r1        12   8-4   8.05   1.53  -0.03
    wta500    9   5-4   4.95   1.47   0.04         r2         8   5-3   5.57   1.21  -0.47
    wta125    4   2-2   2.52   0.94  -0.55         r3         5   3-2   3.96   0.89  -1.08
    slam      4   2-2   1.92   0.96   0.08         r4         3   3-0   2.62   0.58   0.66
    w100      4   3-1   2.76   0.90   0.27
    wta250    2   1-1   1.06   0.69  -0.08

### ⭐ VERDICT on #15: consistent with. Not a finding – and saying so is the result.

**31 wins against an expected 29.4 ± 2.7 is +0.6 of a standard error.** Her realised record is
exactly what her skills predict against the fields she actually met, and the closed form and the
full point engine agree to 0.2 of a win over 42 matches. ⚠ **42 matches is a wide sample and the
cells below it are wider still**: the largest of the twelve tier/round cells is r0 at z = 1.74, which
is BELOW what twelve cells produce by chance – for twelve independent draws the MEDIAN largest |z| is
1.91, and these twelve are not even independent (they partition the same 42 matches, which shrinks
the maximum further). There is no tier and no round where her results depart from the model.

## §16 The two items against each other – the link, priced

Injuries suppress condition; condition scales all five wings through `conditionMatchFactor`; the
scaled wings are what `basePServe` reads. So the link is real by construction, and the only question
is its SIZE. Two measurements:

**(a) Do the losses cluster after an onset? No.**

    first 4 weeks after an onset   n=16   realised 13-3   expected 12.75 ± 1.50   z = 0.16
    every other match              n=26   realised 18-8   expected 16.64 ± 2.30   z = 0.59

**(b) What did the suppression cost, in wins?** The counterfactual is exact rather than modelled:
undo the condition scaling on the SAME frozen snapshot (`(composed − edge)/f + edge`) and re-run the
identical Monte Carlo against the identical opponent, only on the weeks where sub-knee is PROVEN.

    w288 r0 vs F. Carvalho   cond <= 57.0 (f 0.9166)   as played 0.380 -> at full condition 0.518
    every other proven sub-knee match (f 0.993-0.9995)                  within the ±0.011 MC noise
    TOTAL over 12 matches: 0.16 of an expected win, of which 0.139 is that one match.

**The honest link is therefore: the mechanism is real, it is already inside the model's expectation,
and over this window it is worth one seventh of one match.** The single visible instance is w288 –
the week after the slam retirement plus a four-match W75 – where she went on court at condition ≤57
and lost a match she would have been a coin-flip in at full strength. That is the game working, and
it is 0.14 of a win, not an explanation for anything.

## §17 ⚠ A NAMED QUESTION FOR THE OWNER – found while measuring #14, and it is not about Alice

`tools/pro-season-probe.ts` is the acceptance bench for `docs/specs/fatigue-reprice-2026-08.md` §6.
**It read the body BEFORE it resolved the tournament.** `retirementInjury` is opened inside
`finalizeTournament`, which the probe only reaches through `skipTournament` further down its own week
loop – so every onset that came in by the retirement door landed AFTER the `world.injury !== null`
check, and by the next iteration `wasInjured` was already true, so `!wasInjured` was false and the
onset **vanished from the ledger entirely**. Not a mis-classified door: a missing onset.

**Proved before it was believed** (null-result law, pointing the other way): `kidRetirements`, counted
straight off `MatchRecord.retiredId`, read **30 over 2,115 bench matches in the same run that reported
ZERO retirement-door onsets**, and 75.2% of those matches were long enough (≥19 games ≈ 120 points)
to carry any hazard at all – so the arm was live and the instrument was blind. The fix is an
ordering swap, in `tools/` only. Measured, same 16 seeds × 3 seasons:

    cell (16 seeds x 3 seasons)          onsets/season         inj/100m     §6.4 prevalence
    greedy/balanced/physio-on  before     0.48 ± 0.09           1.09         40%
                               after      1.10 ± 0.18           2.51         63%
    reference (pair/light/physio-off)     1.29 ± 0.16           3.19         71%   (weekly door alone: 60%)
    ...the same cell at pre-variant-C recovery (--proRecovery 8)  1.46 ± 0.16  81%  (weekly alone: 58%)

**The timeline is the point.** `injuryBaseChance: 0.003` was calibrated on **02.08** (commit 4318026)
so that the professional pair schedule read **51% season prevalence** against a 46-54% target; the
retirement door shipped on **10.08** (commit 54fd011), adding a second onset source; and the
acceptance instrument has been unable to see it for the sixteen days since. Nothing was wrong on
02.08 and nothing has been re-measured.

**Corrected, the same reference cell reads 71% against a 46-54% band.** Decomposed: ~11 points are
the retirement door the instrument could not see, and ~9 points are drift in the weekly door itself
(60% today against the 51% recorded on 02.08). ⚠ Recovery variant C is NOT that drift – measured:
`--proRecovery 8` moves the weekly-door prevalence to 58%, i.e. within noise of 60%, because better
recovery buys her MORE matches (2,308 against 1,945) and hands the difference straight back through
the retirement door. The remaining drift is unattributed and out of this measurement's scope.

**His call, and it is a real fork:**

- **(a) the 46-54% band was about ALL injuries.** Then the professional schedule over-injures by
  ~17-25 points today and `injuryBaseChance` wants re-deriving downward – and #14's «многовато» is
  not about Alice's window at all, it is about the tuning target, and he felt it before it was found.
- **(b) the retirement door is a separate fiction** – a girl who stops mid-match, calibrated on its
  own research anchor at 2.73% of matches – in which case 46-54% should be read on the weekly door
  alone, that reads 60%, and the ~9 points of unattributed drift is the only thing left to chase.

**No engine number is touched by this measurement either way**, and no re-derivation is proposed
here: `injuryBaseChance` is a shipped knob with a spec of its own and moving it is a wave, not a
footnote. What has changed is that the instrument now reports what the engine does.

**Gate**: `git diff src/` empty, `tests/condition.test.ts` green on the frozen capture
(41550 / e6b0c709), `npm run context:audit` green. Everything above is `tools/` and `docs/`.
