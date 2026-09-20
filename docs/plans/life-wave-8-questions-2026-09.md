---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-20
---

# Wave 8 – the questions, collected as he asked

His instruction opening the wave: «если вопросы будут появляться по пути – собирай в кучу и неси на
конец работ». This is the heap.

Ordered by what a «no» would cost, not by the task that raised each one. **Nothing here blocked the
wave**: everything shipped under a stated reading, and each item names the one edit that changes it.
Wave 6's [questions document](life-wave-6-questions-2026-09.md) is the shape (wave 7 carried its own
in its handoff's «Still his» instead).

## A. The two that are design decisions, not details

### A1. The ramp trap runs BACKWARDS, and the cause is the points economy

§2 T6 predicts the wrong ramp fails more often. Measured twice, independently:

| instrument | result |
| --- | --- |
| T6, 8 careers cloned into two worlds differing only in the answer, 52 weeks of real ticks | straight-back ahead on points **8 of 8** (141 vs 55), on rank 8 of 8 (#352 vs #597) |
| T9's bench, the same question at grid scale | straight-back ahead **16 of 18, zero against** |
| both | protected entries spent: straight-back **12 of 12**, small-first **0** |

The cause is isolated rather than guessed. A third arm – **big draws only**, twelve entries and
nothing else for a year – still beat a full 30–36-event small programme on 4 of 4. **Twelve
first-round exits at a Slam or a 1000, at 0.6 of her wings, out-earn a whole year of W15s.** The
staged factor works exactly as designed; losing the big draws still pays more, and the gap is an
order of magnitude, so no drafted number could close it and invariant 5 forbids moving one to hide it.

⭐ T9 found two things eight careers could not show. Small-first's zero was the **bench policy**, not
the plan – releasing two policy brakes the engine does not enforce, the same plan books 24.2 events a
year. And at **104 weeks the diagnostic arm passes straight-back, 499 points against 450**: the
freeze is spent by then and there is nothing left to ride.

**The half that works is intact** – the freeze IS spent, 12 of 12, and only by the arm the design
calls the trap. What is missing is an **opportunity cost**, and every candidate is design rather than
tuning: a points floor on a draw she is not competitive in, a body cost on big weeks, or accepting
that our economy makes the freeze a good bet and saying so in the copy.

⚠ Pinned in `tests/wave8-return-ramp.test.ts` §D in a shape **built to go red the day somebody fixes
it**. No constant was moved in either direction.

### A2. Sponsors – measured, and the answer is «ship nothing»

§2 T7 said measure before building. Measured, on 240 careers per arm at the same commit, separated
only by one reverse-edited constant so that **each paused career is compared against itself without
the pregnancy** – pairing witnessed to the cent 52 weeks before the announcement:

| window | she keeps |
| --- | ---: |
| the absence (51 weeks) | **82.1%** |
| the year after | **62.5%** |
| the second year after | 63.1% |

**70.0% over 155 weeks – $3,865,406 less per paused career – and 24.3% of the control's kit-deal
weeks in the year after.** Fifteen kit deals died inside the absence window against none in the
control. So no `pauseBrandFactor` ships, and **no constant of any kind entered the engine**.

⭐ The subtle half, which is why a factor would have been actively wrong: the contract still pays
82.1% **through** the absence, because `eventsPlayedInSeason` reads a rolling year that still holds
the season she played. **The bill lands the year after.** A flat multiplier at the research's 0.6
would take her from 70% to ~58% – a second charge nearly the size of the first – and charge it in the
wrong window, burying a deferral the game already models.

⚠ The reverse risk, stated rather than buried: if he reads «partially lost» as sharper than a 30%
three-year haircut, the honest lever is `minEvents` and the sponsor window's verdict, which is a
decision about the whole brand ladder and not about motherhood.

## B. Rulings the architect made inside the wave, each shipped as a revertible commit

**B1. The fall door declines while a pregnancy stands** (`82b23137`, alone). `resolveLeaving` could
latch «She stopped after the fall» about a season she spent off tour having a child: the fall's three
terms are exactly what a year of not playing produces, and the ranking window ages her points out by
construction. ⭐ The deciding fact is that the function **already** carries `if (inCollege(world))
return` – the college absence is excluded by an explicit clause, and `leavingViewOf`'s own note says
«a season she spent at college … is not a season she fell FROM – it is a gap». The maternity pause is
the second kind of absence, so this is the existing rule meeting the new case. ⚠ It deliberately does
**not** cover a fall during the comeback ramp: that one is honest, and it is the research's own ~60%.

**B2. `▶▶ 52 (dev)` can no longer outrun an unanswered blocking beat** (`827efe6f`, alone). The
worker's `decisionOpen` listed the tournament, the knock, the birthday, the ending, the fork, the
retirement offer and the shoot clash – and **not** `pendingLifeBeat`, while both supervised paths
have it. The argument is written directly above that function, about the fork: «a loop that outran
the fork at nineteen would tick a year of her life past the most expensive click in the game with
nobody answering it». ⚠ **It predates wave 8** – `'met'`, `'ended'` and `'engaged'` have all been
blocking – and it is ruled in here because this wave adds two more kinds, one of them the layer's
biggest news. Measured, not just read: mutating the clause away sends the 52-week press straight
through.

**B3. v85 grew one key rather than v86 arriving.** T6 needed persisted state T1's §2 did not list –
the freeze's `entriesLeft` counts down, and the return week is not derivable from `dueWeek`. Since no
save in the world holds v85, the version grew (`world.comeback`) rather than a second seven-part rite
landing inside one wave, so §0's «this wave takes 85» stayed true. The fence is written into the
source: a fourth gap has to be argued aloud.

**B4. The wave ships at most ONE pregnancy per career** – one clause, `world.children.length > 0`,
with **W5 named in the comment as the task that lifts it**. Without it §4's «no repeat pregnancy
enabled» became false the moment T6 cleared the record, quietly and at the first pregnancy's rates.

**B5. ⚠ CLAUDE.md's own sentence about `▶▶` was one guard short of the truth, and the architect
corrected it in place.** It read «the worker's `tick` handler now enforces the same open-knock /
unrevealed-tournament guards»; after B2 it enforces three. The edit is **additive and ~180
characters** – the file measures 20,983 of its 22,000-character budget, so it costs nothing that
matters – and it is flagged here because **CLAUDE.md is his file and what goes in it is his call**.
Revert the line if he would rather write it himself; the fact it records is measured either way.

## C. Words – all drafts, all in the strings table, all his

**C1.** «She came back sooner than last time.» (a **ruled** string) can now print at a **postpartum**
clear, on a career whose marriage ended mid-term. Narrowing a ruled sentence's trigger is exactly what
that row's own history warns against, so it was brought rather than gated. One line if he wants it
break-up-only.

**C2.** «She is expecting – no new entries.» stands, measurably, for the **20 weeks after the birth**
on every career that reaches one, and it survived into a browser assertion. The refusal is right; the
word is stale.

**C3.** P12's label reads warmer than its grade is: «Say we are glad, and that we will worry» is the
**`measured`** grade mechanically – it scales the postpartum shock and weights her return. The three
labels read closer together than the three grades are.

**C4.** P22 shares **60 characters verbatim** with the `peak` blurb, measured as a longest common
substring: «. Nobody put the question to her and nobody had to – it was ». Two of nine epilogues now
open their second sentence identically.

**C5.** P17 is stiff English **because the tail-lint rejected the natural draft** («entering nothing
more» is a banned narrator tail). A guard shaping copy, said out loud.

**C6.** The **diary half** of T3's pregnancy texture was never built – `src/engine/diary/weekNotes.ts`
is untouched by the whole wave. The feed row shipped; a diary band needs a new `DiaryFacts` field and
claims plumbing, which is wave-2 machinery T3 was not asked to reshape. Owed, or W5's?

**C7.** No glyph for `'expecting'`. The row is on the roster with **no pick**, so it wears the
standing white heart. Glyphs are his under §5a.

**C8.** ⭐ **`ENDING_BLURB` is rendered by NOTHING in `src/`** – all nine of them. That is his own
18.08 ruling to keep the record after an agent deleted it for having no consumer, so it is not a
defect. It is worth knowing that nine authored epilogue paragraphs are still waiting for a surface,
and that `'family'`'s is the ninth.

## D. Numbers and shapes, each with the one edit that changes it

**D1.** «She plays on for 8 weeks» is **6 weeks of entering** for anybody, and **3** for a parent who
commits near the deadline. Cause found by T9 and it is three shipped lines: the pause is read at the
EVENT's week, entries close at `week − 2`, and the policy commits within a 3-week look-ahead. Nothing
on screen is wrong – `playsOnWeeks: 8` is a door-closing **date**, not an entry budget. If it should
be a budget, the constant is 10.

**D2.** The hazard curve **cliffs to 0 at 35** rather than tapering. The digest's window closes there
and its oldest observed first child is 35, so a rung at 0 is the honest reading of his own research –
but it is a shape decision, retunable with one number.

**D3.** `validUntilWeek` runs 156 weeks from the **return** (as built), not from the **pause** (105
usable). At the pause the two ruled numbers, twelve entries and three years, would be about different
spans.

**D4.** Should a **withdrawal** hand a protected entry back (as built, capped at twelve) or forfeit it?

**D5.** `warm` postpartum recovery is **shorter than a break-up** (8 vs 10 weeks for an intense girl)
– the one place the ordering crosses. If the postpartum window should be strictly larger at every
grade, the base moves and not the scale.

**D6.** A wedding landing this tick **can** be conceived into on the same week, at roughly 1 in 1700
weddings. Named rather than special-cased, because a marriage-depth threshold would be a constant
nobody drafted.

**D7.** The knock clause's **reason** is a builder's, not the brief's: a knock is the family already
rearranging this calendar around this body, and the announcement's own consequence is a second,
larger rearrangement eight weeks out. Is that the reason he had? The clause ships either way.

**D8.** ⚠ **What counts as «returned successfully»?** The research's ~40% is measured against no bar.
At the strictest – regaining her rank at the pause, median #43 – the answer is **0.0%**, nobody, on
any arm, to three years. At top 100 / 200 / 500 it reads **12.5% / 54.2% / 66.7%**, and the median
returning career lands near #189. **The research's ~40% falls at a bar near the top 150.** T9 did not
pick a softer bar, because picking it decides the answer.

## E. Art, album and the portrait

**E1.** No **birth painting** exists, so the memory face is a `'norm'` draft – not `'happy'`, because
a smile is the one face the same week's arithmetic contradicts.

**E2.** A birth gets **no album page**. The milestone reaches the durable ledger and the scroll, but
`albumBook.ts` selects occasions explicitly. A corpus decision in his own document, flagged as a
choice rather than left as an oversight.

**E3.** The pregnancy painting **yields to a fresh result** (as built, at `rehab`'s rung) rather than
overriding the whole 39-week window – an unconditional override would paint a hand on a belly over
the week she won a tournament. One condition in one computed.

**E4.** `PREGNANT_LAST_WEEKS = 12`, the last twelve of thirty-nine, chosen so the switch lands within
a week of a human third trimester with no second constant. It is a picture, not a mechanic.

**E5.** A live freeze that opens a rung three up now labels the rungs below `outgrown` – a **label**,
never a refusal, but it sorts the small draws down on the very ramp §2 T6 calls the honest one.

## F. Two instruments, and a fixture question

**F1.** `wedding-bench.ts` §(g) will **mis-report on wave 8** and would call this wave's design a P0.
Stated in the handoff; not fixed, because it is wave 7's instrument.

**F2.** The strings provenance grep is fragile **and so is its published remedy**. Only plain
`grep DRAFT` is sound.

**F3.** Should `seeded-careers.spec.ts` ever grow a pregnancy row, or is the twelfth fixture's
exemption permanent? It now covers five of twelve fixtures.
