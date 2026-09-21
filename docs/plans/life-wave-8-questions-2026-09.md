---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-21
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

---

### ⚠⚠ ONE NEW QUESTION THE BATCH RAISED, AND IT IS HIS

**Q-9 (the strings table's §8).** Four of his eight diary lines break this pool's pinned
80-character scrap budget – **87, 88, 106, 89** – and two put the journal in the SINGULAR first
person, where its voice has been a household «we» for a year and his own 09.09 ruling put `I` / `me`
inside HER quotation marks only. **Nothing was reworded and neither law was loosened**: the six
sentences are baselined with custody in `tests/week-notes.test.ts`, named, dated, counted and
re-arming on any edit. ⚠ It is NOT a layout defect – checked, the scrap card has no max-height, clamp
or overflow – so it is an editorial call. **The one edit that closes each**: four shorter sentences,
or a ruling that the motherhood band keeps its own budget; and either his «I» stands as the band's
voice or the two lines move to «we».

⚠ **And one punctuation question, offered rather than fixed.** C3's passed label carries a full stop
(«Say we are glad – and start counting the weeks.») and its two siblings do not («…in the house»,
«…the tennis»). It shipped **exactly as he passed it**, punctuation included, rather than being tidied
to match.

---

## ⭐⭐⭐ HIS OWN PASS – 21.09, in session, and what wave 8b built on it

His rulings opening the batch, verbatim: **«да, деноминируем, и Алисину руку тоже давай. Делай спеку
на все эти обсужденные по результатам ревью задачи, я билдера отправлю доделывать, потом финальный
гейт»** – plus an «ок» given per item on the four strings. Thirteen rows moved; the SHA is the
receipt, and every row not listed here is untouched.

| row | his word | what shipped | where |
| --- | --- | --- | --- |
| **A1** | *(still his)* | ⚠⚠ **NOT CLOSED, AND THE RE-DENOMINATION DID NOT CLOSE IT** – see the new measurement below | `1c45efc9` |
| **C1** | **ruled: stays as shipped** | nothing touched – neither the string nor its trigger. «She came back sooner than last time» is true at a postpartum clear | – |
| **C2** | «ок» | `POSTPARTUM_PAUSE_DETAIL`, the post-birth variant, ONE condition on the existing gate | `d3cd523e` |
| **C3** | «ок» | P12's label; the GRADE did not move | `d3cd523e` |
| **C4** | «ок» | `ENDING_BLURB.family`'s second sentence – the sixty-character overlap with `peak` is now **five** | `d3cd523e` |
| **C5** | «ок» | P17's natural draft back, with a PER-ROW tail-lint exemption that its own test proves is per row | `d3cd523e` |
| **C6** | asked for, with the eight lines | the diary band – and it cost **no schema move**, which is the half the wave-8 handoff got wrong | `ff4adbd2` |
| **C7** | **ruled: no glyph, the white heart stands** | nothing picked – glyphs are his under §5a | – |
| **D3** | *(closed by the architect)* | the one-line deviation note lands in the motherhood spec | `T8` |
| **D5** | **«давай рекомендацию сделаем»** | the postpartum base −30 → **−36**; the scale untouched; `warm` now LEVEL with the break-up at both intensities | `ef19cb0e` |
| **E1** | commissioned the painting | `fem-euro-brunnet-adult-birth.webp` ships; `MEMORY_EMOTION.birth` is the one-word change wave 8 predicted | `8704608e` |
| **E2** | **«да, получает, картинка теперь есть»** | A34 in his corpus document, twelve DRAFT strings, and a test that WALKS to a birth | `f0481383` |
| **F2** | *(closed by the architect)* | plain `grep DRAFT` named in the strings table's header, with both defective forms and their counts | `d3cd523e` |
| **T3** | **«да, деноминируем»** | `comebackStages` in Elo, `eloPerCore` BY IMPORT | `1c45efc9` |
| **T7** | **«Алисину руку тоже давай»** | [the-unclosable-head-2026-09.md](../research/the-unclosable-head-2026-09.md) – measurement only, four levers named and unmoved | `edaa0f03` |

### ⚠⚠⚠ A1 IS STILL OPEN, AND THE RE-DENOMINATION MADE IT WIDER

The staircase research's §5 predicted that re-denominating the comeback ramp in Elo would flip the
inversion: «small-first ≥ straight-back on points at 52 weeks – the trap points the right way». **It
did not.** A paired A/B on the same eight seeds – arm A a detached worktree at `5de1b2a1`, arm B the
tree that ships – measures:

| | arm A (×0.6 staircase) | arm B (−200 Elo staircase) |
| --- | --- | --- |
| straight-back ahead | 8 of 8 | **8 of 8** |
| mean WTA points | 141 straight / 55 small | **191 straight / 54 small** |
| mean live rank | #352 / #597 | **#308 / #605** |
| protected entries spent | 12.0 / 0.0 | 12.0 / 0.0 |

⭐ Arm A reproduces the shipped transcription to the digit, which is the receipt that the control is
the right tree. **The gap WIDENED, 2.6× to 3.5×**, and the mechanism is arithmetic: a shallower
handicap makes her a STRONGER returner, a stronger returner earns more from a big draw than from a
W15 because the big ladder is an order of magnitude steeper, so the change helps both arms and helps
straight-back more. Small-first's harvest barely moves because a W15 title is worth 15 points however
strong she is.

**So T9's own sentence stands and is now measured twice**: «no drafted number could close it – the
gap is an order of magnitude». The three candidates are unchanged and all three are design – a points
floor on a draw she is not competitive in, a body cost on big weeks, or accepting that our economy
makes the freeze a good bet and saying so in the copy. ⚠ **No constant was moved to hide it**, and
`tests/wave8-return-ramp.test.ts` §D still carries the pin built to go red the day somebody fixes it.

⚠ AND THE BRIEF EXPECTED THAT PIN TO GO RED ON THIS CHANGE. It did not, correctly: its shape is «the
wrong ramp WINS in this build», which fails on a FIX and not on a re-denomination.

---

## The architect's pass – 21.09, on his delegation «вопросы сам разбери, если что – приноси мне»

Two verdicts exist: **CLOSED** – the architect's own call, made here and final unless he objects;
**CARRIED** – on his desk, travelling with the recommendation written beside it. Seventeen closed,
thirteen carried (two of those as FYI needing no answer), E5 folded into A1 – thirty-one in all.
(⚠ An earlier line here said «thirteen closed» – a miscount, corrected in its own commit.) ⚠ No closed verdict edited any code: a
ruling that costs an edit waits for his wording batch, so the wave's gate stays a measurement of
one head.

### A – both carried; they are design

* **A1 – ⚠⚠ STILL CARRIED AFTER 21.09, AND THE RE-DENOMINATION MADE IT WIDER** (the paired A/B is
  in the section above: 141/55 → 191/54, the gap 2.6× → 3.5×, straight-back ahead 8 of 8 on both
  trees). ⭐ The instrument arm this row asked for – «what does a first-round exit at the top tiers
  pay relative to a small-tier TITLE there, and what is our ratio» – was ANSWERED by the staircase
  research's §1 before the batch opened: **our points tables ARE the real tables**, digit for digit,
  and reality also pays twelve big-draw R1 exits ≈ 120 points ≈ eight W15 titles. So the ratio is
  HONEST and the fix is NOT tuning: his choice among the three candidates is open, and it is the
  same three. Originally: The finding
  compares our economy against itself; the missing comparison is against the REAL points tables:
  what does a first-round exit at the top tiers pay relative to a small-tier TITLE there, and what
  is our ratio? If ours is inflated at the big draws' bottom rungs, the fix is TUNING with a bench
  and invariant 5, not new design – and only if the ratio is honest does his choice among the
  three candidates (points floor / body cost / accept-and-say-so) actually open. **E5 rides with
  A1**: if small-first is to be the honest path, the `outgrown` label must stop sorting it down –
  one sort key, same decision.
* **A2 – STANDS as measured, carried as FYI.** Ship nothing is right, and the deferral finding
  (82.1% through the absence, the bill the year after) is exactly why a flat factor would have
  been wrong. The one lever if he reads «partially lost» sharper – `minEvents` and the sponsor
  window's verdict – is a whole-ladder decision and waits for him to want it.

### B – verified one by one against the diff; all five stand

* **B1 CLOSED** – read at the clause: one line beside the identical college exclusion, the
  comeback ramp deliberately uncovered, self-terminating because `resolveReturnDecision` nulls
  the state on both arms. The existing rule meeting a new case, as claimed.
* **B2 CLOSED** – `pendingLifeBeat` joins `decisionOpen`, one predicate, the hole measured by
  mutation and older than the wave. Right on both counts.
* **B3 CLOSED** – the licence («nothing has shipped») is written at the fence, the peel rung held
  through the growth, one golden covers all three keys. House precedent recorded: an UNSHIPPED
  version may grow; a shipped one never.
* **B4 CLOSED** – the SCOPE BRAKE with W5 named in the comment is exactly how §4's «no repeat
  pregnancy enabled» stays true. W5 lifts it by design, not by surprise.
* **B5 CARRIED** – CLAUDE.md is his file; the 180-character correction makes a sentence true and
  the architect recommends keeping it, but the questions file's own framing is right: revert if
  he would rather write it himself.

### C – his by invariant 4; drafts prepared where a draft helps

* **C1 ⭐ RULED 21.09 – STAYS AS SHIPPED** (the recommendation taken). Originally: «She came back sooner than last time» stays true at a
  postpartum clear – she did come back. Narrowing a ruled string's trigger needs his word; the
  architect's read is that no narrowing is needed.
* **C2 ⭐ CLOSED 21.09 – «ок», and it shipped** (`d3cd523e`). Originally: The refusal is right, the word is stale for the 20 post-birth
  weeks. Draft variant row for that window: «She is home with the baby – no new entries yet.»
* **C3 ⭐ CLOSED 21.09 – «ок», the LABEL moved and the grade did not** (`d3cd523e`). Originally: P12 reads a shade warmer than `measured` is. Draft: «Say we are
  glad – and start counting the weeks.»
* **C4 ⭐ CLOSED 21.09 – «ок»; the overlap is now five characters, re-measured** (`d3cd523e`). Originally: P22's second sentence should stop sharing sixty characters with
  `peak`. Draft: «She had a child, and the months after it went by without an entry in them. No
  one asked her to choose – by spring the choice had long been made.»
* **C5 ⭐ CLOSED 21.09 – «ок», exempt PER ROW and its own test proves it** (`d3cd523e`). Originally: A lint shaping copy is the tail wagging: one exemption
  row for P17, and the natural draft returns for his pass.
* **C6 ⭐ RE-OPENED AND BUILT 21.09 – he asked for it and gave eight lines** (`ff4adbd2`); ⚠ the W5 deferral below was right about the FIELD and wrong about the STATE – it cost no schema move. Originally: The diary band needs a `DiaryFacts` field and claims plumbing – wave-2
  machinery T3 was right not to reshape. The W5 brief carries it as a named task.
* **C7 ⭐ RULED 21.09 – NO GLYPH, the white heart stands until his own pick.** Originally: the `'expecting'` glyph is one emoji pick under §5a; the white heart stands
  until then.
* **C8 CARRIED as FYI.** Nine authored epilogues wait for a surface; `'family'`'s is the ninth.
  The surface is the finale shell the album wave listed as not-built – the two backlog rows are
  one row.

### D – numbers and shapes

* **D1 CLOSED.** `playsOnWeeks` is a door-closing date and stays one; the drafted intent («she
  plays into the early months») is what ships, and the player-facing side is C2's fix, not a
  constant's.
* **D2 CLOSED.** The cliff at 35 is the digest's own oldest observation; a taper is one number
  on the day he wants one.
* **D3 CLOSED.** The anchor stands as built (from the return). The digest's letter is post-birth
  – ~26 weeks less generous – and the measured consumption (12/12 spent inside year one, or 0)
  makes the difference immaterial. One sentence in the spec names the deviation in his batch.
* **D4 CLOSED.** A withdrawal hands the entry back, capped at twelve – generous but bounded;
  revisit only if a bench ever shows the cap farmed.
* **D5 ⭐ RULED 21.09 – «давай рекомендацию сделаем»** (`ef19cb0e`: base −30 → −36, the scale untouched). Originally: the postpartum window is never shorter than a break-up at the
  same grade.** A birth is physically the larger event; support should shorten it, not below
  the break-up's floor. The base moves, the scale stays, the bench re-runs – on his word.
* **D6 CLOSED.** One in 1700 weddings conceiving the same tick is named and harmless; a depth
  threshold would be an undrafted constant solving a non-problem.
* **D7 CLOSED.** The builder's reason is accepted as written – it is a true reason. If the owner
  had a different one, the comment gains a second sentence; the clause is the same either way.
* **D8 CLOSED.** The spec already reports the full ladder (12.5 / 54.2 / 66.7) and names the
  top-150 calibration without electing a bar – that treatment is the ruling: report the curve,
  never pick the answer.

### E, F – art, album, instruments

* **E1 ⭐ RULED 21.09 – HE COMMISSIONED THE PAINTING** (`8704608e`). Originally: does he want a birth painting? The `'norm'` face stands meanwhile, for the
  stated reason (the week's arithmetic contradicts a smile).
* **E2 ⭐ RULED 21.09 – «да, получает, картинка теперь есть», and it landed THIS batch rather than W5** (`f0481383`). Originally: A birth is the largest life event the album could
  hold and the corpus is his document – an occasion row plus his lines, landing with the child's
  own wave.
* **E3 CLOSED** – yielding to a fresh result is right; the belly-hand over a title week would be
  the exact defect class his corpus review named.
* **E4 CLOSED** – twelve of thirty-nine stands; it is a picture.
* **E5 → folded into A1.**
* **F1 CLOSED → W5.** The wedding bench's §(g) heal is a named T-instrument task in the W5 brief
  – K5's own precedent from wave 7.
* **F2 ⭐ WRITTEN INTO THE TABLE'S HEADER 21.09** (`d3cd523e`). Originally: Plain `grep DRAFT` is the documented remedy from here on; the strings table's
  header says so in his batch, one line.
* **F3 CLOSED.** The exemption stands while the twelfth fixture covers the pregnancy path in a
  real browser; it is revisited the day pregnancy UI grows beyond the pause texture.
