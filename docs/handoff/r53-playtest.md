---
type: report
status: current
area: delivery
last-reviewed: 2026-10-22
---
# Handoff – r53/playtest (21–22.10.2026)

## How this wave was run
His 21.10 rule, after the first two builders went out on his findings alone: «Мы сначала делаем
спеку и обсуждаем каждый пункт». Four specs and a 12-step plan were written and discussed, every
spec question answered, then «делай всё по шагам по списку без остановок… утром покажешь
результат». Builders no lower than sonnet, one at a time; the architect gated after each. Specs:
[coach pay ladder](../specs/coach-pay-ladder-2026-10.md), [weather](../specs/weather-2026-10.md),
[partner name](../specs/partner-name-disclosure-2026-10.md),
[honest injury week](../specs/injury-honest-week-2026-10.md). Plan:
[round-53-plan](../plans/round-53-plan-2026-10.md). Ledger: [round-53.md](../rounds/round-53.md).

## Shipped (what the player sees)
- Her page's cell is her relationships from the first known partner, in any stage (K1); the name
  arrives by four roads – her own card at a close bond, «ask» / «insist» (−2 bond), her later
  word on its own sub-stream, the papers at the top tournaments (M9, schema v94 → v95
  `nameKnownWeek`); «Dating / Engaged / Married: {name}» on the tile.
- The calendar, the planner and the entry gate read the honest return week with the masseur; the
  withdraw caution says she makes the event (K2); letting the masseur go states the consequences
  and withdraws the entries in the gap – «Doctor said no» (L2).
- The coach pay ladder (M7): elite $300–650/h ($1.5–3k a week), the hitting partner's top rung
  gated and ≤ 60 % of the coach's week, rank letters at #11–50 (×1.5) and #1–10 (×2.5) – refusal
  → he leaves at season end; the market reprices with her band. Famous names (M8): a quarter of
  elite coaches carry a past, +50 % labour and one trade (chemistry / ceiling +2 / sponsors /
  sparring at the middle rung's price).
- Weather: climate by season-week and surface, wind and rain on the event (M10); the match reads
  the day – heat on both players' fatigue, wind on the serve, rain on clay, a rain delay costs
  one less condition, champion-row tails and commentary remarks (M11).
- Rivals in the commentary – a head-to-head record, one pre-match line, one remark (L6); the W
  cards say how many more of their rung the season holds (L3); the coach card's medical-team
  sentence sits once under each tier title (L1); fragility after an injury scales with its length
  (L5/L5b, mean factor ≈ 1.1, prevalence unchanged).
- Already there, the backlog lines were stale: wakeLock during a match, the screen-reader class.
- The 22.10 build-out, his third word («все в эту же волну делаем»): heat makes her tire EARLIER
  (the fatigue onset divides by the day's factor – 75 points at 38°; +2.0 / +2.9 pp to the fitter
  at 34° / 38°, retirements untouched so the 2.73 % anchor holds by construction; the closed form's
  legs factor fitted, slope 3.4) – W1; the famous coach's card carries a star over the portrait and
  «Rate +50 % for the name» from the engine constant – W2; the booth talks about the weather with
  variety: heat (3 lines), fresh and strong wind (3 each), clouds and «held off» when rain is
  possible, a heavy first line when it falls – 13 DRAFT lines on the review sheet – W3.

## Balance findings for his eye (the sheet's «Вопросы» block has the full list)
- Elite at $2–3k/wk plus a famous name breaks a wealthy family in ~2 years of junior play – his
  22.10 word: «это ок, игрок решает кого и когда нанимать», with a rider to show the season's full
  cost and explain the premium above the band (open, UI).
- The weather A/B on identical seeds (22.10, the round ledger): the weather does not create
  bankruptcies, it reshuffles them (±1–2 seeds of 10, both directions); the bankruptcy share per
  cell was set by family money × coach tier before M11 (middle·middle 7/10, high 10/10, elite
  10/10 in BOTH arms). Where a seed flips, the mechanism is depth – she wins more, travels and
  enters more, and the junior sink pays no prize. Re-measured at his ask on the «player» policy
  (reserve 8 weeks, rest floor 80): bankruptcies 0 of 90 in A and 1 of 90 in B – the stop signal
  was the no-reserve «grinder» policy's artefact, not the coach ladder's and not the weather's.
  Her win rate by the event's weather, A → B over 91k matches: all 65.7 → 65.2 %, heat 30°+
  66.0 → 64.3 %, strong wind 67.0 → 65.2 %, rain 66.2 → 66.2 %; retirements in heat ×1.5.
- Heat moves a result by ~1 pp, not the spec's 4–6 (the fatigue term is small); four variants are
  measured in the round ledger (earlier onset +2.9 pp, stronger factor +2.1 pp with retirements
  ×2.1, a whole-match term that reaches the spec's number at K ≈ 0.04) – his decision, not built;
  the weather tail is on the champion row only; stage-2 effects do not reach college/planner/prologue matches.
- The silence note's reach fell to 77.8 % with the week-28 checkpoint (r52) – unchanged here.

## Open (the owner's)
- The review sheet's addendum: 13 booth lines (W3) are DRAFT at the same link.
- The review sheet is applied (22.10, `59decdcd`): 27 of his rewrites transferred, every r53
  section `APPROVED`, three English sources made channel-neutral at his ask; the 31 display-word
  rows were the sheet extractor's escaped-pipe defect (table untouched). Still his: the press road
  at a cold bond («рассмотрел бы более высокий порог известности» – `newsRankNoticed` 200 /
  `newsRankKnown` 100 / `stageTierMin` wta500, one constant), the press share's real lever (`publicWeek` or a chance per event – the
  bar did nothing, measured), the coach price against the wallet.
- Every balance question above; the heat strength; her own result-row weather tail (48 RU
  sentences); the grass conditions line share (19 % vs the 15 % target – a fourth line?); album
  captions for weather (the corpus generator – a follow-up).

## Gates
PLATFORM-FIX CHAIN at `e40b64a2` (23.10 morning, after the CI runner's red; clean worktree, npm ci,
every verdict from its own file, `r53k-*.log`): check `R53K_CHECK_EXIT=0` (engine purity ok,
component 332 / 3929), sim `R53K_SIM_EXIT=0`, e2e on the Mac `R53K_E2E_EXIT=0` (151), e2e in CI's
Linux image `R53K_LINUX_E2E_EXIT=0` (151), lqa:ru `R53K_LQA_EXIT=0`, and in a linux/amd64 node:22
container the l3-7 twin plus the three coach-travel files that were red on CI `R53K_TWIN_EXIT=0`
(4 files / 29). The red's cause and fix: the ledger's «CI красный на раннере» and N9.

BUILD-OUT CHAIN at `ef1f5aaf` (22.10 evening; clean worktree, npm ci, every verdict from its own
file, `r53i-*.log`): check `R53I_CHECK_EXIT=0` (engine purity ok, component 332 files / 3929), sim
`R53I_SIM_EXIT=0`, e2e on the Mac `R53I_E2E2_EXIT=0` (151; the first run's one red was W2's label
tail, fixed in `ef1f5aaf`), e2e in CI's Linux image `R53I_LINUX_E2E5_EXIT=0` (151 – after raising
the podman VM to 4 GB: two concurrent vite builds were OOM-killed four times in 1.9 GB), lqa:ru
`R53I_LQA_EXIT=0`, the container twin `R53I_TWIN_EXIT=0` (6/6); build line `ef1f5aa`.

EARLIER FINAL CHAIN at `40c8ce2c` (clean worktree, npm ci, every verdict from its own file, `r53h-*.log`):
check `R53H_CHECK_EXIT=0` (unit 468 s with one accepted bulk-pool late ack, component 332/332,
build), sim `R53H_SIM_EXIT=0` (13/402 s), e2e on the Mac `R53H_E2E_EXIT=0` (151) and in CI's Linux
image `R53H_LINUX_E2E_EXIT=0` (151); lqa:ru `R53G_LQA_EXIT=0` and the container twin
`R53G_CONTAINER_EXIT=0` (6/6) at `b2314309` (only tests, e2e fixtures and one scroll box above it);
frozen capture 51/51 standalone; build line `40c8ce2`. Schema v94 → v95, all four parts.

## Process notes
- Ninth digest harvest: 137/137 coach-travel cells moved (the round changed what a coached career
  is), s1's nine `hN` (every `rngN` green), l3-5 both tags (the second moved too this time), the
  diary PICK, the l3-7 twin on both platforms (control at `main` = the stored fixture).
- The CI runner's red (23.10): one persisted float (`coachDeal.residualSince`, summed from the
  closed form's `Math.pow`) drifted one ulp between arm64 and the x64 runner and walked into the
  save – red on Linux since M7, invisible until the PR opened (`ci.yml` runs on `pull_request`).
  Quantised at its writer; 28 frozen hashes re-stamped; the twin's darwin↔linux leaves 23 → 17.
  Reproduce any runner-only red in `podman --platform linux/amd64 node:22` (the VM is 4 GB now).
- Three stale backlog lines caught by the builders' reproductions; two real i18n gaps closed by N2
  (`surface` holes, the `partner|{0}` row); one S2e alias blindness (`year` vs `startYear`).
