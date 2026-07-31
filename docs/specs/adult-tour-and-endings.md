# The adult tour and the endings — design note (29.07.2026, pre-code)

Written because the owner asked what happens to the heroine when the conveyor retires the field
around her. The answer today is "nothing, ever", and that answer hides three holes. This is the plan
for closing them. **Nothing here is implemented.**

---

## 1. The three holes

**No tier has a maximum age.** `isTierAgeOpen` (world.ts) checks `minAgeYears` and nothing else, and
`selectEntrants` (season/tournament.ts) never looks at age at all. So at 25 she can still enter
Junior Tour 30, and the field she meets there can contain 28-year-olds. "Junior" is a label on a
tier, not an age rule, for anybody. The rivals appear to obey the rule only because the conveyor
deletes them from the world at the crunch — a substitution for a tour they should be leaving, not a
world they should be leaving.

**Money only ever leaves.** No junior level pays prize money, which is correct and real (juniors pay
to play — that IS the "invest without knowing the return" thesis). But it means the career is a pure
sink for ever: parent contribution, the local sponsor's cameo, the academy kit grant and savings
interest are the entire income side. There is no moment where the thing she is good at starts paying.

**Nothing ends.** `world.fundsCents < 0` adds a `'funds'` stop reason to `advanceWeeks` and the weeks
keep ticking; she simply cannot afford to enter anything. Retirement does not exist for her. The
conveyor retires every rival and cannot touch her — she is not in `world.cohort`, she is ranked
beside it as `KID_ID`.

---

## 2. The adult ladder

The real women's ladder above juniors, in order: **ITF World Tennis Tour W15 → W35 → W50 → W75 →
W100**, then **WTA 125**, then **WTA 250 / 500 / 1000**, then the Slams. We ship it the way we shipped
the juniors: the dense entry rungs first, one prestige rung, the rest as content later.

| rung | purse (real, 2025) | what it is in our ladder |
| --- | --- | --- |
| W15 | $20k/event | THE entry rung. Dense. Where a 19-year-old finds out what she is. |
| W35 | $30k/event | The step that means she is actually a professional. |
| W100 | — | Rare, prestige, four a year, like j300 is today. |
| WTA 125 / 250 | CH125 title ≈ $28k; ATP 250 R1 ≈ $6.9k | Later content. The population has to exist first. |

Everything the junior ladder already does carries over unchanged: `enterPointBand` overlaps so two
rungs are always open, `everyNWeeks` cadence, `entrantPctBand`, surface blocks, travel by tier.

**Ranking window.** Ours is ITF Reg 10 — best-6 over 52 weeks — because the junior tour is what we
modelled. The WTA rule is **best-16** (18 for Finals qualifiers). Whether the adult rungs switch
window is an open question (§5): it changes what "playing more" is worth, which is the whole shape of
a professional season.

---

## 3. The money, and the cliff

Prize money is not a reward, it is the **cliff**, and it is what the whole valley-of-death fantasy
turns on. From `docs/research/02-tennis-economics.md`:

- W15: title ≈ **$2–3k**, first-round loser ≈ **$100–160**. Qualifying R1 can be **$50**.
- Break-even ranking ≈ **WTA 150**. Only about **251 women a year** break even.
- Brenda Fruhvirtova won **8 ITF titles** in 2022 and earned **$43,071** for the year.
- Kiranpal Pannu, 2022: earned **$6,771**, spent **$34,500**.

Mechanically:

- A new `'prize'` income category, paid at `finalizeTournament` off a per-tier payout table indexed
  by finish, exactly parallel to the existing `points` array. One number per finish, no draws.
- **Unlike the juniors, a first-round loss is not zero.** It is a token — $100 against a $900+ trip.
  That difference is the design: the junior tour pays nothing ever, the adult tour pays something and
  the something is an insult until she is good. The player should be able to feel the exact week the
  arithmetic flips.
- **Prize money must NOT scale with the wealth corridor.** Travel, coaching and medical all scale
  with family background; the cheque does not. It is the one number in the game that is the same for
  a working family and a wealthy one, and that is worth saying out loud in the code.
- The bench's standing caveat ("prize money is NOT modeled") comes out of `tools/econ-bench.ts` on
  the day this lands, and the reach targets stop being proxies.

---

## 4. The handover at 19, and the four endings

### 4.1 The handover

`maxAgeYears: 18` on the J tiers (real ITF juniors is U18), plus an age view in `selectEntrants` so a
J30 field is juniors and a W15 field is adults.

**This cannot ship before §2 and §3.** Cap the junior tiers first and at 19 her calendar loses
everything she has been climbing, leaving Local / Regional / National — a step *down* into a dead
end. That is not a cliff, it is a wall. The adult rungs are what turn 19 into a fork.

The domestic ladder stays open at every age. It is ours, not the ITF's, and it is where an adult who
is not good enough still plays — which is most of them, and is the truth.

### 4.2 The endings

Four, and they are different in kind. All four want the same epilogue surface, and the material for
it already exists: the durable milestone ledger (`world.milestones`, v18) is her life.

**A. The decision at 19 — the player's, once, with everything on the table.** The same question the
academy asks every rival at the crunch: will anybody pay for the next part? She is shown her rank,
the family balance, that the scholarship has just ended (it is junior support — that is already in
the code), and what a W15 costs against what it pays. Continue → the adult tour. Stop → epilogue.
This is the game's second act beginning, and it should be the most expensive click in it.

**B. Bankruptcy.** Today this stalls. It should end. The shape wants a warning phase before the fact —
a season where the family is visibly running out, the planner refuses trips, the conversation happens
— and then a definition sharp enough to code: no path back. A candidate is "funds below zero and
unable to fund the cheapest entry on the calendar for N consecutive weeks", but the number is a
design decision, not an obvious one.

**C. The career-ending injury.** Exists in the fiction, not in the code. Either a severity above the
current band, or an accumulation rule (`injuryHistory` is already persisted and already counts).
Should be rare enough that it is a story and not a difficulty setting.

**D. The natural end.** Her own decline starts at 29 (`ECONOMY.development.ageCurve.declineStart`),
the field's hard stop is 34 (`CONVEYOR.hardRetireAge`). Hers should be a decision with a floor: the
game stops asking somewhere in the thirties, and before that it is hers to make.

---

## 5. Open questions — owner's calls

1. **Best-6 or best-16** for the adult ranking window? Best-16 makes a full professional schedule
   worth playing and makes a thin one visibly thin; best-6 keeps one engine for both tours.
2. **Does she keep the domestic ladder as an adult?** Letting her farm Regionals at 24 is comfortable
   and probably wrong; taking it away is a demotion the game could make her feel instead.
3. **Is there play after the ending?** The dynasty / second-child meta is in the post-v1 backlog. If
   the answer is yes, the epilogue is a handover screen rather than a credits roll.
4. **How hard is the 19 fork?** Should "stop" ever be the *right* answer — a career the game tells
   you honestly to end — or is it always a loss?

---

## 6. Sequencing

1. **Adult rungs + prize money.** Purely additive: new tiers, a new income category, no age rule yet.
   Nothing existing breaks and the bench's biggest caveat disappears.
2. **The handover** — `maxAgeYears` on the J tiers + age-aware entrant selection.
3. **The fork at 19** + the epilogue surface.
4. **Bankruptcy and injury endings**, onto that same surface.

---

## 6. The owner's calls on §5 — settled 30.07.2026

He answered all four at once («согласен со всеми четырьмя»), against the recommendations below. Recorded here
because until now they lived only in a conversation.

**1. The adult ranking window is BEST-16, not our best-6.** The WTA rule, and it is the one that makes a full
professional season worth playing and a thin one visibly thin. Under best-6 "playing more" is worth nothing
past six results — which would waste the availability currency the whole load-manager wave built, exactly at
the point the game starts being about scheduling.

**2. She KEEPS the domestic ladder as an adult.** It is ours, not the ITF's, and it is where an adult who is
not good enough still plays — which is most of them, and is the truth. Farming Regionals at 24 reads
uncomfortable; taking it away is a demotion the game should let her FEEL rather than write as a rule.

**3. NO play after the ending, in v1.** The epilogue is a scroll, not a handover. The dynasty / second-child
meta stays in the post-v1 backlog; if it ever lands, an epilogue can become a handover screen, and that
direction is much cheaper than the reverse.

**4. "STOP" CAN BE THE RIGHT ANSWER at 19, and it is a real ending without shame.** A game about honest
economics in which "continue" is always correct lies precisely where it promised not to. Break-even is
around WTA 150 and about 251 women a year clear it. If she is 19, outside the real, and the family is at
zero, the game has earned the right to say so. Otherwise the four endings are three failures and one
success, rather than four fates.

---

## 7. The work plan

Two waves, in this order, because §4.1 cannot ship first: cap the junior tiers before the adult rungs exist
and 19 is a wall into Local/Regional/National rather than a fork.

### Wave A — the adult tour (task #17)

**A1. The rungs.** W15 → W35 → W100 in `season/calendar.ts`, built the way the J family was: overlapping
`enterPointBand` so two rungs are always open, `everyNWeeks` cadence, `entrantPctBand`, surface blocks,
travel by tier. W100 is rare and prestigious — four a year, like J300.

**A2. Prize money, and it is the cliff.** A new `'prize'` income category paid at `finalizeTournament` off a
per-tier payout table indexed by finish, exactly parallel to the existing `points` array. One number per
finish, zero draws.
- ⚠ **A first-round loss is NOT zero here** — it is a token, ~$100 against a $900+ trip. The junior tour pays
  nothing ever; the adult tour pays something and the something is an insult until she is good. The player
  should be able to feel the exact week the arithmetic flips.
- ⚠ **Prize money must NOT scale with the wealth corridor.** Travel, coaching and medical all do; the cheque
  does not. It is the one number in the game that is identical for a working family and a wealthy one.
- On the day this lands, the standing caveat "prize money is NOT modeled" comes out of `tools/econ-bench.ts`
  and the reach targets stop being proxies.

**A3. The ranking window.** Best-16 on the adult rungs per the owner's call (1). This is the risky half of
Wave A: it changes what a season is worth, so it needs its own bench pass rather than a re-read of the
existing one.

**A4. Measure.** `bench:econ` and a new adult-tour arm: does the cliff produce a real valley? The number to
watch is the week prize money first exceeds the week's costs, and how many careers ever reach it.

### Wave B — the handover and the four endings (task #47)

**B1. The cap.** `maxAgeYears: 18` on the J tiers (real ITF juniors is U18) plus an age view in
`selectEntrants`, so a J30 field is juniors and a W15 field is adults. Blocked on A1.

**B2. The fork at 19.** One decision, once, with everything on the table: her rank, the family balance, the
scholarship that has just ended (junior support — already true in the code), and what a W15 costs against
what it pays. Continue → the adult tour. Stop → epilogue. Per the owner's call (4), "stop" must be able to be
the right answer and must read as an ending rather than a failure.

**B3. The epilogue surface.** Built on the durable milestone ledger (`world.milestones`, v18) — it is already
her life, written down. A scroll, not a handover (owner's call 3).

**B4. Bankruptcy as a real ending.** Today `fundsCents < 0` only adds a `'funds'` stop reason and the weeks
keep ticking. It wants a **warning phase** before the fact — a season where the family is visibly running
out, the planner refuses trips, the conversation happens — and then a definition sharp enough to code. A
candidate: "funds below zero and unable to fund the cheapest entry on the calendar for N consecutive weeks".
⚠ N is a design decision, not an obvious one, and it should be measured before it is picked.

**B5. The career-ending injury.** In the fiction, not the code. Either a severity above the current band or an
accumulation rule (`injuryHistory` is persisted and already counts). Rare enough to be a story, never a
difficulty setting.

**B6. The natural end.** Her decline starts at 29 (`ageCurve.declineStart`); the field's hard stop is 34
(`CONVEYOR.hardRetireAge`). Hers should be a decision with a floor: the game stops asking somewhere in the
thirties, and before that it is hers to make.

### Order, and what can be done in parallel

A1 → A2 → A3 → A4 must be sequential (each measures the last). In Wave B, **B4/B5/B6 are independent of
B1/B2/B3** and of each other — three endings that share only the epilogue surface — so they can be split
across agents once B3 exists. B1 and B2 are the critical path and should not be split.

### The risks worth naming before starting

- **A3 (best-16) is a balance change disguised as a rule change.** It alters what every adult season is
  worth. Measure before and after, on the same seeds, or we will not know which of A2 and A3 moved things.
- **B2 is the most expensive click in the game** and it lands on systems that were all re-tuned in the last
  week. Expect the fork's numbers to need a second pass after the first playtest, and do not tune them
  before that playtest exists.
- **The endings need art.** Four of them, plus an epilogue. That is the owner's, and it should be asked for
  early rather than discovered at the end — the art has been the long pole twice already.
