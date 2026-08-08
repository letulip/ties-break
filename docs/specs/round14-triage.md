---
type: spec
status: current
area: triage
canonical: false
last-reviewed: 2026-08-06
---

# Round 14 – eighteen items, triaged against the save

The owner's playtest list of 06.08, with `tennis-sim_zoe-royv_w255.tsave` attached. Everything below
that claims a number was measured on that save (schema v43, **week 255**, season 4 week 47, ITF #65 /
domestic #106 / WTA #260) before any work was dispatched.

⚠ The save is his own career. Read locally, **never committed**, never a fixture.

## The headline: items 7, 15 and 18 are one defect, and it is large

He reported three separate calendar complaints – four empty weeks at seventeen, an empty week 10 of
'35 with only 125s and 250s, tournaments appearing and vanishing, and a fresh profile going empty
around week 19 because she had "outgrown" everything.

**The calendar is not empty. It is full of tournaments she is not allowed to enter.**

Zoe's season carries **193 events across 53 weeks**; only six weeks have no event scheduled at all.
Running the real `entryStatus` over every future event in her save:

```
future events:  165 blocked · 24 enterable      (12.7% enterable)
weeks where NOTHING is enterable:  27 of 46     (59% of her remaining season)
```

And the reason split is the whole story – everything beneath her says `outgrown`, everything above
says `locked`:

```
w260  CAN: —          blocked: w15(outgrown) j30(outgrown) local(outgrown)
w262  CAN: —          blocked: slam(locked) w15(outgrown) j30(outgrown) local(outgrown)
w267  CAN: —          blocked: w35(outgrown) w15(outgrown) j60(outgrown) local(outgrown)
w268  CAN: —          blocked: wta1000(locked) wta250(locked) wta125(locked) w15(outgrown) j30(outgrown)
w269  CAN: w100,w50   blocked: j60(outgrown) regional(locked)
```

She is standing in a slot roughly one rung wide. Below it the ladder has closed; above it the
acceptance cuts have not opened. **Three fifths of her season is unplayable and the screen is full of
tournaments explaining why not.**

This is backlog #84, and the owner has now ruled on it:

> «Точно надо выровнять наши окна, а лучше как ты говорил, не делать нижний порог вообще, пусть
> играет, просто по приоритету более актуальный турнир показывать, если есть.»

So: **the lower bound stops being a wall and becomes a sorting key.** An outgrown rung is enterable –
it simply loses the card to anything better that week. The upper bound stays: an acceptance cut is
the tour's rule and is not ours to waive.

Note also `regional(locked)` and `national(locked)` at #106 domestic – the domestic ladder has its own
gap and she has fallen into it. Same investigation.

## Everything else, by group

### Group A – the ladder window *(7, 15, 18)*
Above. Engine change with balance consequences, so it is measured: how much of a season becomes
playable, and whether an outgrown rung that now pays points changes her climb.

> **BUILT AND MEASURED, 08.08 – `docs/specs/ladder-floor-2026-08.md`.** The lower bound is a sorting
> key now. On this save the dead weeks go **27 of 46 to 6**, and the two `regional`/`national` locks
> below turn out to be the SAME defect: her domestic book had decayed to zero and the only rung that
> could pay it back was the Local the ceiling had shut. ⚠ It carries a **measured cost** as well as
> the fix – see that spec's §3, which the owner has to read before this ships.

### Group B – the match viewer *(11, 12, 14)*
- **full / key does nothing**, and the running commentary did not appear at all in a WTA 250. Two
  bugs or one, to be established.
- **skip must leave that switch.** It skips the entire match, which is not what a full/key/skip
  triplet implies. It belongs somewhere that says so.
- **key moments must actually differ from full** in the commentary, not only in playback speed.
- **the control block pins to the bottom**, commentary unrolls above it.
- **her dot goes yellow**, like every other place the accent marks her.

### Group C – mail, vacation, onboarding *(1, 2, 9)*
- **A booked vacation cannot be cancelled.** `cancelVacation` is exported from the planner and
  nothing calls it – an engine capability with no way in.
- **The inbox becomes a mail client**: a list, unread bold, click to open, a bin per row once read,
  yes/no on delete.
- **Onboarding is width-capped on desktop**, like every other screen.

### Group D – money and the coach *(4, 6, 10)*
- **His coach's percentage keeps falling** – 0.5–1.0, then 0.4–0.9, now 0.3–0.7. The likely answer is
  that it is honest and unexplained: growth is a share of REMAINING headroom, she is at ~94% of her
  ceiling, and the age curve eases past eighteen. If so the fix is legibility, not arithmetic – but
  it is measured before it is asserted.
- **`coachOnEventWeeks` is `false`** in his save, and `coachActive` reads
  `world.coachOnEventWeeks || !isCompetitionWeek(world)`. He remembers deciding the opposite. Find
  the decision, honour it, and if there is no record, treat his memory as the ruling.
- **A sponsor covering strings and frame did not cover a purchase** made from the bills screen. Either
  the coverage is not consulted on that path, or it is and the copy lies about what is covered.

### Group E – stats and ages *(3, 8)*
- **Opponent ages** in matches and in the stats tables.
- **Season-by-season is showing the wrong currency.** Per level it must show that level's own rank
  and that level's own points; today every row shows the international number and a combined total.
  Same family as the wrap-up bug fixed on 05.08 – a surface reading one track while she plays another.

### Group F – art *(5, 16)*
`w75-hard`, `wta250` trophy, `wta250-clay`. **The owner's to make**; the registry and the guards are
already in place, and `npm run art` must be run after dropping a master – a `.png` sitting in
`public/images/` is invisible until it is encoded (05.08's lesson).

### Answered here, no work needed *(13)*
**Equipment does work, and the reason it is not felt is that it has no upside.** `engine/equipment.ts`:
each of the three lines carries a CONDITION that decays with the weeks since its purchase and is
restored by buying. **Fresh kit is exactly neutral** – every factor is 1, every attribute comes back
byte-identical – and wear only ever subtracts. So buying gear does not make her better; it stops her
getting worse. Whether that is the design or wants an upside is the owner's call, not a defect.

### Needs a ruling before any work *(17)*
A difficulty wrapper expressed as **win rate against reality**, sitting over the existing 8k / 25k /
120k backgrounds. Genuinely attractive – the research for it already exists
(`docs/research/real-ladder-pace.md`: 75.0% of any 32-draw is out by the second match; a real world
#47 sits at 76.5%). But it is a second difficulty axis crossing one that already exists, and the
population/taper work is mid-flight. Proposed as its own wave once the ladder window lands, so it is
calibrated against a game that no longer wastes three fifths of a season.
