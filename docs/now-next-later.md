---
type: plan
status: current
area: delivery
canonical: true
last-reviewed: 2026-08-31
---

# Now / next / later

## Current truth

- **This is the only current delivery document.** The August [roadmap](plans/roadmap-2026-08.md) and
  [launch plan](plans/launch-plan-2026-08.md) are `superseded` and kept as history: they schedule
  save-schema work in the v35–v39 range, and `SAVE_SCHEMA_VERSION` – which DECLARES itself in
  `src/engine/world/state.ts` since the decomposition, re-exported through the `world` barrel – is
  long past it. Take neither ordering nor state from them. ⚠ The number itself is deliberately NOT
  written here: this line carried a stale `(v61)` while the code ran to v69, and it is the second
  bullet below that says why – the constant is the state, and the one place that quotes it
  ([saves and worker](context/saves-and-worker.md)) is machine-checked by `scripts/doc-facts.mjs`.
- **Nothing on this page is a new priority.** Every line is transcribed from [the owner's dated
  log](decisions.md) or from a [round ledger](rounds/README.md) and names its source. A line with no
  source does not belong here.
- **State is read from the code and the ledgers, never copied here.** The schema number is the
  constant; what shipped is the ledger box with the place it landed written in it.
- **An item is done when its box is ticked with WHERE** – [`rounds/README.md`](rounds/README.md),
  §"Keeping this true". Nothing enforces that mechanically, which is why this page routes to the
  ledgers rather than restating them.

## Now

⚙ THE LIVE WAVE IS ROUND 35 – this line is machine-checked against the newest ledger in
`docs/rounds/` by `scripts/doc-facts.mjs`; edit the number only by shipping a ledger.

**Round 34 is the open wave** ([round-34.md](rounds/round-34.md), 02.09) – twenty-one items off a
full career played on the round-33 build, plus a full read of his save. ⭐ Its centre of gravity is
the economy: the coach's ceiling read counts her birth level as achievement, the endorsement ladder
pays nothing below world #200 and jumps 24x on one ranking place at #100, and her brand is valued at
less than one year of one of her own sponsorship contracts. Every figure in it was measured, put to
the owner and approved before a line was written.

**Round 32 was the previous wave** ([round-32.md](rounds/round-32.md), 31.08) – two items read off his
play on the merged round-31 build, both diagnosed before they were filed. A shoot booked in an
off-season week was drawn as an empty week: the winter IS the shoot season by construction
(`WINTER_SHOOT_WEEKS`), and the calendar's off-season branch returned before the shoot's days were
ever computed (#1). And the week-results view carried the whole upcoming-tournament plate underneath
the results, which is the FOURTH pass over that pair of blocks (#2). **Read the ledger for state; do
not count boxes here.**

**Round 31 was the wave before it** ([round-31.md](rounds/round-31.md), 31.08), merged in
[#117](https://github.com/letulip/ties-break/pull/117): the This-week screen learned WHY it was
opened, so Home's `Next tournament` plate lands on the tournament while a resolved week still lands
on its story (#1), and the week recap's Finances tile became his own four lines – Income (the
tournament's own cheque) / Family income / Spent / Balance – with one memo under them, her cut of
the PRIZE money alone (#2). **Read the ledger for state; do not count boxes here.**

**Round 30 came before that** ([round-30.md](rounds/round-30.md), 30.08) – seventeen items from a
playthrough plus a second part read off his week-896 save, and the CI split. ⚠ Several of its items
are REGRESSIONS from round 29's own work, found in play within hours, and they are marked `[!]` with
what shipped and why it missed. **Read the ledger for state; do not count boxes here.**

Its two open threads at the time of writing, both his to rule on rather than ours to build:

- **Merch is modelled as the wrong thing** (#23/#24). His own research: among active top-20/50
  players an independent brand is RARE – 95% take classic sponsorship – and the lucrative shape is
  EQUITY or ROYALTIES, not a shop. ⚙ His instruction is narrow: **re-size the income now,
  collaborations later.** ([round-30.md](rounds/round-30.md) #23.)
- **Two measurements owed before any tuning**: the injury drought (299 weeks with nothing while she
  is past thirty) and whether the fame floor should count deep runs and not only titles.

### Shipped since this page was last true (27.08 → 30.08)

⚠ This page said «Round 27 is OPEN – nothing in it is built yet» for three days after the wave landed.
Four rounds have merged since, and the correction is the point: **naming a source is not checking one.**

- **Round 27** – the college mini-round, merged in [#112](https://github.com/letulip/ties-break/pull/112).
- **Round 28** – seventeen items, merged in [#113](https://github.com/letulip/ties-break/pull/113);
  it also carried the AI champion tally and the schema move that collided with college's.
- **Round 29** – the economy wave, merged in [#114](https://github.com/letulip/ties-break/pull/114):
  the advertising portfolio by category, the manager's commission, the fund, merch and the earning
  academy, full offline, the build version line.
- Waves **the-long-goodbye**, **the-shop**, **the-body** and **college-last-mile** all merged
  (#109–#112).

## Next – named, and nothing has to be decided first

Each of these is already diagnosed in writing and none is waiting on a ruling.

- ⭐⭐ **Grow the e2e suite, and keep growing it** – the backlog's only `Now` row and his own call of
  29.08. The whole suite is **cheaper than one unit shard** – tens of seconds against minutes – and
  it now runs locally as a condition of pushing. ⚠ No test count here on purpose: the runner prints
  its own total, and the two written down (30 here, 25 in `e2e/README.md`) had both rotted past it
  by 02.09. It is HEALTHY and under-covered: `coverage-map.spec.ts` checks
  screens because they are a closed set, and §7 declares mechanics uncheckable for completeness –
  **which is exactly where all three of round 29's engine/UI parity defects lived.** Standing work:
  every wave that ships a mechanic owes a case. ([the-quality-rig.md](backlog/the-quality-rig.md) row 15.)
- ⭐ **The engine/UI parity convention** – three defects in one round shared one shape: *the screen
  held a predicate the engine did not*. The instrument exists (round 28 #8's paired mount test) and
  needs naming as a convention and applying to the known sites.
  ([the-quality-rig.md](backlog/the-quality-rig.md) row 13.)
- **Round 16 #20, keeping the screen awake during a match** – no `wakeLock` reference exists in
  `src/`. ⚠ Its neighbour, **#8 kit wear on holiday, SHIPPED in round 29 #20** after four askings.
  ([round-16.md](rounds/round-16.md).)
- **Round 8 #1, the in-tournament player card** – untouched since 25.07 and the oldest open item in
  the folder. ([rounds/README.md](rounds/README.md), the round-8 row.)

## Later – needs the owner's word, not an engineer's

- **The album needs a different SHAPE, not a longer one** – «Текущий слайдер из 7 не подходит для
  объемной и насыщенной карьеры, я хочу концептуально другое». The seven-polaroid pager was sized for
  a 14→18 career; the game now runs thirteen-plus seasons and is adding property he is drawing art
  for. **He has reserved the design.** ([screens-and-cards.md](backlog/screens-and-cards.md).)
- **Two-week tournaments** – considered and deferred by him («подожди с этим»); round 30's edge-travel
  design (a Slam departs the previous Sunday and comes home on its own) removes the need for now.
  ([round-29.md](rounds/round-29.md) P16.)
- **Gear replacement on condition rather than on the calendar**, and **whether rehab stops the wear
  clock** – both diagnosed, both ruled «давай пока не будем здесь ничего менять» on 29.08. ⚠ Closed by
  a decision, which is not the same as forgotten: read the ledger line before re-proposing either.
  ([round-29.md](rounds/round-29.md) part two #14/#15.)
- **`minEvents` runs 8/10/14/12/16/16** – an inversion that favours the player, reported and not
  fixed. ([round-29.md](rounds/round-29.md) part two #5.)
- **One tier label is still the sport's own term** – `label: 'Grand Slam'`, against `CLAUDE.md`'s
  fictional-names invariant. ([round-22.md](rounds/round-22.md), #15–16.)
- **The balance methodology of the review's chapter 04** – written up and not adopted; his call.
  ([balance-methodology-proposal-2026-08-19.md](plans/balance-methodology-proposal-2026-08-19.md).)
- **Round 14 #17, the difficulty wrapper** · **Round 17 #15 and #22** · **Round 16 #10** – all
  measured or priced, all waiting on his word.

## What this page will not do

It does not restate a ledger, count open items, or carry a schema number: all three go stale between
the day they are written and the day they are read, which is what happened to the two plans it
replaces. Route from here, then read the state from the ledger box or the constant.
