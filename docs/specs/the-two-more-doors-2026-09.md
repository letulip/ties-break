---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# Two more doors out – leaving at the peak, and leaving after the fall

His 17.09, on finding that the model has exactly two doors and neither fits the cases he cares
about. It ends in questions for him, and every sentence a player would read is a DRAFT.

⭐ **BUILT IN ROUND 45 (`round/45-two-doors`).** §1–§4 were the design and stand unchanged; §6 below
is the build's own record – what was built, what was measured, and where the measurement disagreed
with the prediction. **The copy is still a draft and is collected for him in one document:
`docs/specs/the-two-doors-corpus-2026-09.md`.**

⚠⚠ **HE REVIEWED THE BUILD THE NIGHT IT SHIPPED (§9) AND §10 IS THE REPAIR.** Read §6 as the record
of what was built first, not as the description of what is in the tree: **§4's one-voice-one-door
table, §6.1's «no age gate», §6.2 entirely, and every rate in §6.5 are SUPERSEDED BY §10.** They are
kept because the mistake is the useful half – a partition defended as «not a career script» by an
argument that its own measurement had already refuted is the kind of thing worth being able to read
back.

## §1 The correction he asked for, first

He wrote: «правда с нашими текущими модификациями это [обвал] может стать незначительным или даже
недостижимым (поправь меня, если я не прав здесь)».

⭐ **He is not right, and the reason is worth keeping: a collapse is a RESULTS event, not a decline
event.** His own career is the worked example. The fall from #13 to #59 was three terms:

| term | size |
| --- | --- |
| ageing over the season | ~1.7 points, the ONLY term the seats touch |
| two mid-match retirements, both in 128-draws | the two events that pay most, exited at the rounds that pay least |
| the rolling 52-week points sum | 4,008 expiring against 1,584 replacing them |

The seats soften skill loss by a couple of points over years. They prevent no injury, no retirement
and no variance. **A collapse stays exactly as reachable as it was.**

⭐⭐ **And they make it BETTER material rather than worse.** A well-staffed player who collapses
anyway collapsed for a reason that is not neglect – which is precisely the story he wants this door
to tell, and it is one the game could not tell before, because until this wave a collapse and a
neglected career looked identical from outside.

## §2 Door 3 – she leaves at the peak

His calibration, and it is a RATE rather than a rule: **«менее 1–2% игрового тура»**, with four
named cases – Barty at 25 as the reigning world number one and Australian Open champion; Henin as
the ranked leader; Bartoli forty days after Wimbledon; Dementieva inside the top ten just after an
Olympic title.

⚠ **What they share is not an age.** It is that she is AT the top when she goes, and that the
decision is HERS. That second half is the part the current model cannot express at all: both
existing doors ask the PARENT a question. This one is her telling him.

**Shape to build:** a per-season draw at the off-season, purpose-scoped
(`rngFromSeed(\`${seed}:ending:peak:${season}\`)`, never MAIN), gated on her actually being at a peak
– a top ranking or a Slam inside the season – and firing at the rate he named. ⚠ Its FREQUENCY is
measured by bench and recorded predicted-against-measured, per invariant 5; «1–2%» is his target, not
a constant to paste.

## §3 Door 4 – she leaves after the fall

His: «обвал мы вполне можем с точки зрения эмоций использовать как триггер на уход, это тяжело точно
и мне кажется, что мы уже это знаем».

⚠⚠ **This is the door `plateauReading` explicitly refuses to be**, and its comment says so: «"No
improvement" alone would fire on a career that is FALLING APART – which is a different story and one
the natural end should not be telling.» The plateau was right to refuse it. **This spec is the story
it was deferring to.**

**Shape to build:** a draw gated on a REAL collapse – a season that loses most of its points and a
large rank fall – at a rate he sets. Not certainty: most players who fall keep playing, which is his
own «абсолютное большинство выступают до тех пор, пока позволяют здоровье, мотивация».

## §4 ⭐⭐⭐ WHAT THE TEMPERAMENTS SAY – his question, and it is the best part of this

He asked: «Что у нас ещё темпераменты могут сказать?» and gave three shapes himself – «хлопнула
дверью и ушла», «не выдержала и сдалась», «больше не хочу играть».

⭐ **They map one voice to one door, two voices each, and each one is a different exit rather than a
different sentence about the same exit:**

| voice | door | the shape of her leaving |
| --- | --- | --- |
| `fiery` | the fall | **she will not be seen losing.** Slams the door, at the moment it stops being bearable – his «хлопнула дверью» |
| `quiet` | the fall | **she does not announce it.** She is simply not entered next season – «не выдержала», without a scene |
| `deep` | the peak | **decided over a year and told when settled**, not while deciding. Barty's shape exactly – «больше не хочу играть» |
| `sunny` | the peak | **she leaves on a good day, FOR a life rather than AGAINST tennis.** The hardest of the four to write and the only one that is not a loss |

⚠⚠ **AND THE CONSEQUENCE THAT MAKES THIS COHERENT: if her temperament decides WHICH door she can
take, the ending is a fact about HER and not about the parent's management.** That is the same law
`lastWordLine` already obeys – «a line blaming a body, a load or a decision would be a promise the
engine does not keep». Two players in identical careers leave differently because they are different
people, which is this game's whole argument.

## §5 What is owed before any of this is built

- ✅ **THE RATES ARE RULED (his 17.09): «у обоих не больше 1–2%»** – and his reason is the design
  constraint rather than a realism note: **«это всё-таки событие, которое принудительно заканчивает
  игру».** ⚠⚠ That changes what the feature owes. A door that ENDS the career without the player
  choosing it has to be rare enough that it reads as a story rather than as the game being taken
  away, and the bench measures the rate against 1–2% of careers rather than of seasons – the two are
  a decade apart and only the first is what he said.
- ✅ **THE UNION WIDENING IS CHECKED (his «надо попробовать, но проверь, конечно») and the answer is
  in two halves:**
  - **Free for SAVES.** `src/engine/saveGuard.ts` does not mention `ending` at all and no migration
    touches `ending.type`, so nothing validates the field on load and no old save can hold a new
    value. No schema move.
  - ⚠ **NOT free for CODE, and that is the good kind of failure.** Three TOTAL records are keyed on
    the union – `ENDING_BLURB` and `ENDING_TITLE` (`engine/ending.ts`) and `EMOTION_BY_ENDING`
    (`world/album.ts`) – so widening it goes red until all three are filled. ⭐ **A new ending
    therefore cannot ship without its blurb, its title and her face**, enforced by the compiler
    rather than by anybody remembering.
- ✅ **THE COPY IS COMMISSIONED (his «всё готовь по нашим лекалам и присылай на вычитку»).** Four
  exits × four voices, plus each ending's blurb, title and avatar emotion, written to the house
  patterns and sent to him as one document the way the 516 were. **Every line is a DRAFT until he
  has read it**, and the corpus's own law governs the writing: a line may not assert more than its
  situation licenses, and a leaving may not blame a body, a load or a decision.
- ✅ **SCOPE RULED (his 17.09: «может быть ты и прав»). THIS IS ROUND 45, built immediately after 44
  merges.** Not because it matters less – it is the most interesting thing either of us has designed
  this week – but because round 44 already carries a schema move, an 817-string catalogue, a
  development-model change and two UI surfaces, and a PR nobody can read is how a wave stops being
  reviewable.

  ⭐ **The copy can be written and sent to him WHILE 44 is in his hands**, since it is a document and
  not a diff. That is the one part of this spec with no reason to wait.

---

# §6 THE BUILD (round 45, `round/45-two-doors`) – what was built and what it measured

## §6.1 The two triggers, as shipped

Both are read on **one week a year** – the off-season wrap week, `WEEKS_PER_YEAR - OFF_SEASON_WEEKS`,
which is the same week the natural end's offer is raised on. `resolveLeaving` runs as step **7c″** of
`resolveEndings`, above 7d, and the order is deliberate: *a girl who has already decided is not asked
whether there is another year in this.* Behind a latch, and inside the college freeze, it does not
run at all.

⚠ **THE TABLE BELOW IS THE 17.09 BUILD, NOT THE TREE.** Its `voices` row and its `peak` gate are
superseded by §10: every voice reaches both doors now, and the peak gate carries his 25+ floor.

| | door #7 `peak` | door #8 `fall` |
| --- | --- | --- |
| voices | `deep`, `sunny` – **superseded, §10: all four** | `fiery`, `quiet` – **superseded, §10: all four** |
| table | the paid one, always (`activeLadderOf === 'wta'`) | the same |
| gate | season-end place inside `peakRankBand` **or** a title at the ladder's top rung inside the season | points at most `fallPointsShare` of last season's, from a season of at least `fallPointsFloor`, **and** the place at least `fallRankFactor`× larger **and** at least `fallRankPlaces` places worse |
| draw | `seed:ending:peak:<season>`, one value, `< peakLeavingChance` | `seed:ending:fall:<season>`, one value, `< fallLeavingChance` |
| shipped knobs | `peakRankBand: 10`, `peakLeavingChance: 0.02` | `fallPointsShare: 0.5`, `fallPointsFloor: 200`, `fallRankFactor: 2`, `fallRankPlaces: 30`, `fallLeavingChance: 0.02` |
| measured career rate (§6.5) | **1.89%** | **1.16%** |

⚠⚠ **«No age gate on either» WAS THIS BUILD'S READING OF §2 AND HE OVERTURNED IT (§9, §10).** What
it said: «What they share is not an age», so the place gate does the work an age floor would have done
badly. What the bench then measured: a median first eligible peak winter at **21**. His ruling: «я бы
сказал 25+». `ENDINGS.peakMinAgeYears` is in the tree and §10 measures what it cost.

⚠ **Every fall threshold is anchored on his own worked example** (§1's table: #13 → #59, 4,008 points
expiring against 1,584 replacing them). That case reads share **0.40**, factor **×4.54** and **46
places**, so it passes all three with room – which is the least a door can owe the case it was
written for. `tests/two-doors.test.ts` §C pins it.

## §6.2 The temperament mapping, and why it is not a career script

⚠⚠⚠ **THIS WHOLE SECTION IS WRONG AND IS KEPT AS THE RECORD OF HOW. `DOOR_BY_TEMPERAMENT` IS DELETED
(§9, §10).** Its argument was that a partition cannot be a career script because «the same chance on
both sides» – and the numbers that refute it are four paragraphs further down this same document
(19.4% against 40.3% reachability). Below is what shipped, verbatim, so the shape of the error is
readable rather than summarised.

`DOOR_BY_TEMPERAMENT` in `engine/ending.ts` is §4's table, written once. Both predicates refuse on the
wrong voice before they look at anything else, so **a girl can only ever be offered her own door** –
pinned for all four voices against both a collapse and a peak.

⚠⚠ **It reads BIRTH temperament and may not read `expressedTemperamentOf`.** Expression drifts with
`wallsFlipped`, which the psychologist and the shape of the career move, so reading it would make the
door a fact about **the parent's management** – which is the exact opposite of §4's own consequence
(«the ending is a fact about HER»). `world.temperament` is immutable by construction, so a career
hashes the same girl at week 0 and at the door.

⚠ **This is a narrow override of `drawForkWant`'s fence and the difference is arithmetic, not
rhetoric.** That fence reads «HER TEMPERAMENT DOES NOT AND MAY NOT [weight the draw] … otherwise
temperament becomes a career script.» It does not become one here, because the mapping is a
**PARTITION and not a weight**: two voices each, gates that are mutually exclusive by construction (a
season cannot be a peak and a collapse), and **the same chance on both sides**. Temperament therefore
moves WHICH story a leaving is and never HOW LIKELY a leaving is. A test asserts the equal split and
the equal chance side by side, so a wave that broke either would go red.

## §6.3 The union widening – what the compiler actually made us fill

Free for saves exactly as §5 predicted: no schema bump, no migration, no fixture. **Not free for
code, and it was verified by mutation rather than by reading.** With `peak` deleted from each of the
three records in turn, `vue-tsc -b --force` came back `exit 2` naming all three:

```
src/engine/ending.ts       TS2561  'XXpeak' does not exist in type 'Record<CareerEndingType, string>'   (ENDING_BLURB)
src/engine/ending.ts       TS2741  Property 'peak' is missing in type '{ stopped … plateau; fall }'      (ENDING_TITLE)
src/engine/world/album.ts  TS2741  Property 'peak' is missing in type '{ stopped … plateau; fall }'      (EMOTION_BY_ENDING)
```

⚠ No line numbers are quoted above, deliberately: a line number in a document is a fact that rots on
the next edit, and this file has already been edited since the run. The file, the code and the record
name are what reproduce.

⭐ **And a fourth appeared that §5 had not predicted:** `tests/ending.test.ts`'s `details` sweep is a
`Record<CareerEndingType, string>` too, so the epilogue-line test could not stay green without a real
`peak` and `fall` detail *off their real producer*. The claim «a new ending cannot ship without its
copy» is therefore stronger than it was written: it cannot ship without its copy **or without a test
reading that copy through the engine**.

⚠ **Two hand-written lists were found beside them that would NOT have gone red, and both are now
derived from `ENDING_TITLE`'s keys instead** – the mounted epilogue sweep in
`tests/component/endings-ui.test.ts` and the terminal-ending refusal guard in
`tests/round24-college-refusals.test.ts`. A Record total over the union has exactly the union's
members at runtime, so a ninth ending joins both guards by existing. Before this, `peak` and `fall`
could have shipped without the ending screen ever mounting them.

## §6.4 RNG – the frozen verdict

Both draws are purpose-scoped sub-streams derived at the call site, persisting nothing. **MAIN is
untouched and that was measured on three separate arms, not argued:**

| arm | verdict |
| --- | --- |
| the frozen MAIN capture (`tests/condition.test.ts`) | **41550 / `e6b0c709` unchanged**, 51 tests green |
| the eighteen frozen careers (`coach-travel-edge*`, 3 files) | **33 tests green, NOT ONE HASH MOVED** – no per-key diff and no re-stamp owed |
| `world.rngMain` across a latching door, directly | byte-identical before and after (`tests/two-doors.test.ts` §D2) |

⭐ **Why the frozen careers could not move, stated so the next wave does not re-derive it:** a frozen
career is 156 weeks from age 14 and never reaches the paid table at all, so `leavingViewOf` reads
`professional: false` on every one of them and both gates refuse before any draw is derived. And even
where a draw IS derived, `rngFromSeed` opens a fresh sub-stream and consumes nothing from MAIN.

## §6.5 THE RATE – predicted against measured (invariant 5)

⚠⚠ **EVERY RATE IN §6.5 WAS MEASURED ON THE PARTITIONED BUILD AND IS SUPERSEDED BY §10.4.** Its
denominators are half the corpus per door, because half of the girls were ineligible for each door by
construction. **What is NOT superseded, and is the reason to keep reading it:** the population
argument (`player`, not `grinder`), the distinct-seed trap and `--spread`, the sweep's exactness, and
the absurd-value arm. Those four are method rather than number, and §10 uses all of them again.

`npm run bench:doors`, `tools/two-doors-bench.ts`. **9 presets × 8 seeds = 72 careers, `player`
policy, fourteen to forty-four.**

### The population first, because a rate over the wrong population is not a rate

⚠⚠ **THE HOUSE DEFAULT POLICY WOULD HAVE PRODUCED A NULL ARM WEARING A MEASUREMENT'S CLOTHES, AND IT
WAS CAUGHT BEFORE THE FIRST REAL RUN.** On `grinder` – `POLICIES[0]`, the arm every other bench in
this repo defaults to – **1 career of 9 ever reached a professional winter at all**, and her best
paid-table place ever was **#332**. Both doors read 0.0% there, at every band down to top 50, for a
reason that is entirely about the entry policy and nothing about the doors. On `player` – «the model
of a reasonable parent» – **65 of 72 careers reach a professional winter, median best place ever #12,
best #2.** That is the population these doors live in, so it is the bench's default and
`--policy grinder` is the flag.

### The prediction, and it was wrong by three to five times

| | predicted | measured (EXPECTED, 72 careers) |
| --- | ---: | ---: |
| `peakLeavingChance: 0.12` | inside his 1–2% of careers | **6.73%** |
| `fallLeavingChance: 0.12` | inside his 1–2% of careers | **7.09%** |

⭐ **0.12 was a guess and the bench says so plainly.** It is recorded rather than quietly corrected,
because the correction is the interesting half: the per-winter chance and the per-CAREER rate are
separated by however many eligible winters a career has, and that number (a median career at the top
is eligible for several winters running) is what the guess did not account for.

### The sweep, which is exact and set the number

The eligibility census does not depend on the chance – the gate is read before the draw, and the
walk defuses the door and keeps going – so **one pass prices every candidate**, exactly as
`sweepGrace` prices the bankruptcy window:

| chance per eligible winter | peak, % of all careers | fall, % of all careers | both |
| ---: | ---: | ---: | ---: |
| 1% | 0.80% | 0.62% | 1.42% |
| **2%** | **1.55%** | **1.24%** | **2.79%** ← shipped |
| 3% | 2.24% | 1.85% | 4.09% |
| 5% | 3.48% | 3.05% | 6.54% |
| 8% | 5.06% | 4.82% | 9.87% |
| 12% | 6.73% | 7.09% | 13.82% |
| 25% | 10.26% | 13.93% | 24.19% |

⭐ **2% is the largest candidate at which BOTH doors sit inside his 1–2% band**, and it is the same
number on both sides – which §6.2 needs, since an unequal pair would turn the partition into a
career script. 3% puts the peak at 2.24%, outside.

⚠ **AND THE HEADLINE IS EACH DOOR, NOT THE SUM.** Their combined 2.79% is over his ceiling read as a
total. Two readings are possible and only he can settle it – «у обоих не больше 1–2%» most naturally
means each, which is how it is built. **If he meant the pair, the value is 1% and the table above
prices it at 1.42% combined, one line to change.**

### The gates are reachable, which is the other thing a 0% has to be told apart from

| | careers whose gate ever opened (= the rate at chance 1.0) |
| --- | ---: |
| peak | **19.4%** (14 of the 26 `deep`/`sunny` careers) |
| fall | **40.3%** (28 of the 46 `fiery`/`quiet` careers) |

So neither door is `injuryPriorWeeksOut`'s failure – «it is not rare, it is impossible». The knob has
room in both directions, and the peak's band sweep says where: top 3 would open on 9.7% of all
careers, top 10 on 19.4%, top 20 on 31.9%, and nothing above top 30 buys anything (the paid table's
own ceiling in this population is reached).

### ⚠⚠ THE EFFECTIVE SAMPLE IS 24, NOT 72, AND EVERY SEED-DERIVED FIGURE HAS TO BE READ THAT WAY

`openCareer`'s seed is **`bench-${background}-${index}`** – it carries the background and the index
and **not the coach tier** – so 9 presets × 8 indices is **24 distinct seeds, each walked 3, 4 or 2
times** (working ×3, middle ×4, wealthy ×2 presets). Her temperament and both doors' coins are
functions of the seed alone, so for anything seed-derived this run is an n of **24**.

⭐ **Verified rather than inferred.** `temperamentFor` over the 24 distinct seeds gives
`{deep 6, fiery 8, sunny 3, quiet 7}`, and weighted by each seed's replication that is
`{deep 19, fiery 26, sunny 7, quiet 20}` – **the bench's partition table, career for career.** So the
apparently lopsided 9.7% `sunny` is 3 girls of 24 and not a broken 25/25/25/25; `temperamentFor`'s
two uniform axis picks are untouched.

⚠ **This is what explains the peak's REALISED 0.0% at the 12% arm**, and it is why that null was not
believed: the 14 «eligible peak careers» are drawn from only 9 distinct girls, and a seed-keyed coin
gives the same answer in all of a seed's replicas. The absurd-value arm below is what settles it.

⭐ The bench now **prints the distinct-seed count in its own header** and takes `--spread` (one preset
per background, so careers and distinct seeds are the same number). A trap that has to be remembered
is a trap that catches the next person.

### ⭐⭐⭐ THE ABSURD-VALUE ARM – the null was a null arm, and this is what proved it

CLAUDE.md's own rule for a null result: «set the constant to an absurd value and watch the output
move; if it does not, the arm is wrong before the hypothesis is.» Both chances set to **1.0**, the
same 9 × 8 run:

| door | ELIGIBLE | EXPECTED | REALISED | median age at the door |
| --- | ---: | ---: | ---: | ---: |
| peak | 19.4% | 19.4% | **19.4%** (14 careers) | **21** |
| fall | 40.3% | 40.3% | **40.3%** (29 careers) | **32** |

⭐ **REALISED equals ELIGIBLE exactly, on both doors.** At a chance of 1 every career whose gate ever
opened must leave through it, and every one of them did – so `resolveLeaving` really is called, on
the right week, reading the right gate, latching the right ending and writing the right two rows. The
0.0% at 12% was the sample, not dead code.

⭐⭐ **And the run bought a second confirmation nobody asked for.** The chance sweep printed at 1.0 is
**byte-identical** to the sweep printed at 0.12, cell for cell – which is the empirical half of the
claim the sweep rests on: *the eligibility census does not depend on the chance.* It was argued from
the code (the gate is read before the draw; a fired-and-defused door leaves only display-ledger rows
behind); now it is also measured.

⚠⚠ **AND IT SURFACED THE ONE DESIGN QUESTION THE BENCH WAS ASKED TO ANSWER: the peak door's median
age is 21.** §6.1 left the age gate out on §2's instruction («What they share is not an age») and said
the bench would report the age so a floor could be wanted on evidence. Here is the evidence, with the
caveat that makes it readable: **at a chance of 1 the door fires on her FIRST eligible winter by
construction, so 21 is the median age at which the peak gate first OPENS, not the median age she
leaves at the shipped rate** – at 2% the draw is spread across all her eligible winters and the
realised median is later. Even so, his four named cases are 25, 25, 28 and 28, and a `deep` girl
leaving at twenty-one as world #4 is a story the model can now tell whether or not he wants it.
**This is his call and it is a one-line gate either way; it is listed in §6.6.**

### ⭐⭐⭐ THE SHIPPED VALUE, MEASURED ON A CLEAN POPULATION – and this is the answer to his 1–2%

`npm run bench:doors -- --spread --seeds 24` at `peakLeavingChance = fallLeavingChance = 0.02`.
**72 careers, 72 DISTINCT seeds** – the trap above closed, so every seed-derived figure here has an
effective n of 72 rather than 24. 69 of the 72 reached a professional winter; best paid-table place
ever held, median #12, best #1.

| door | ELIGIBLE | **EXPECTED** | REALISED | median age at the door |
| --- | ---: | ---: | ---: | ---: |
| peak | 22.2% | **1.89%** | 1.4% (1 career) | 23 |
| fall | 37.5% | **1.16%** | 2.8% (2 careers) | 34 |

⭐ **BOTH DOORS ARE INSIDE HIS 1–2% OF CAREERS. His constraint is met, per door.**

⚠ **READ `EXPECTED` AS THE RATE AND `REALISED` AS THE CONFIRMATION, NOT THE OTHER WAY ROUND.** At
these rates one career is 1.4 percentage points, so REALISED is 1 and 2 careers against expectations
of 1.4 and 0.8 – ordinary sampling either side of the line, and not a number to tune on.
`EXPECTED` is the honest estimate because it is computed over the whole eligibility census (**1,479
comparable professional winters**), not over three coin flips that happened to land.

⚠ **THE COMBINED FIGURE IS 3.05% ON THIS POPULATION** (1.42–1.55% at a chance of 1%). The pair
reading of his sentence is still open and still costs one line – §6.6 item 2.

⚠ **AND THE PEAK'S MEDIAN AGE OF 23 IS ONE CAREER**, so it is an anecdote rather than a
distribution. The absurd arm's 21 is the figure with 14 careers behind it, and its own caveat is in
the block above. Both point the same way and neither settles §6.6 item 3.

⭐ **The mix it produces**, shipped arm: `natural` 73.6%, `injury` 22.2%, `fall` 2.8%, `peak` 1.4%,
nothing still playing. The two doors displace `natural` almost exclusively, which is what a door that
opens at the top or after a collapse should do – it takes the careers that would otherwise have run
all the way to the last offer.

---

## §6.6 What is open, and every one of them is his

⚠ **ALL FOUR WERE ANSWERED ON 17.09 – see §9 for his words and §10.6 for what is left.** Items 2 and
3 became rulings, item 1 became nine findings, and item 4 was half-taken (the peak's face moved; a
per-voice face is still open). The list below is the question as the build asked it.

None of these is a defect and none of them blocks the wave. They are the four places where the build
reached a question only he can answer, listed so they are asked rather than decided quietly.

1. **THE COPY, all ten lines.** Four exits, two epilogue paragraphs, two headlines, two faces. They
   are collected for one pass in `docs/specs/the-two-doors-corpus-2026-09.md`, which also carries its
   own open questions. Invariant 4: a word here is a word in the game and none of them is settled.
2. **«у обоих не больше 1–2%» – each door, or the two together?** Built as each (1.55% / 1.24%). If
   he meant the pair, `peakLeavingChance` and `fallLeavingChance` go to 0.01 and the sweep prices
   that at 1.42% combined. One line, already measured.
3. **Does the peak door want an age floor?** §2 says what the four cases share is not an age and the
   build took that literally – there is no age in the gate. The bench then reported a median FIRST
   eligible winter at **21** against his four cases at 25, 25, 28 and 28. A floor is one line; so is
   leaving it out. What the build will not do is invent one.
4. **Should the fall's avatar follow the VOICE rather than the ending?** `EMOTION_BY_ENDING` is keyed
   on the ending, so a `fiery` girl who slams the door and a `quiet` girl who says nothing share one
   face (`serious`). Making it per voice is a small engine change. The corpus document asks the same
   question in his own terms.

## §6.7 What this wave did NOT do, said out loud

* **No schema move**, no migration, no golden fixture – `saveGuard.ts` really does not mention
  `ending` (one grep, one false positive on the word «nesting») and no migration writes `ending.type`.
* **No UI.** The epilogue screen switches on nothing but `type === 'college'`, so both doors render
  through the surfaces that already exist. `ENDING_BLURB` is still unrendered writing, exactly as it
  was for the other six – kept on his own 18.08 ruling.
* **No new dialog**, so no 375×667 assertion is owed: these two doors do not ask the player anything,
  which is the whole point of them.
* **No change to any existing ending.** The plateau, the natural end, the fork's two answers,
  bankruptcy and the career-ending injury are untouched, and step 7c″ sits above 7d rather than inside
  it.


---

## §9 HIS REVIEW OF THE BUILD AND THE COPY (17.09) – «I would not approve the copy yet»

Two rulings and nine findings. **The two [P1]s are about MECHANICS TRUTH rather than wording**, and
one of them is the architect's own design error.

### His two rulings

- ✅ **«не больше 1–2%» IS PER DOOR** – «верно». Built as each; the combined 3.05% stands.
- ✅ **THE PEAK DOOR OPENS AT 25+.** «медианный возраст первой подходящей недели у пика — 21 … это
  вообще не очень по отношению к игроку, особенно на супер-талантливом сиде. Я бы сказал 25+.»
  ⚠ §2 had said «what they share is not an age, so none was invented» – that reasoning was about
  their SPREAD (25/25/28/28), and it does not license taking the career away from a twenty-one-year-old
  who has just arrived. An age floor goes in.

### ⚠⚠ [P1] THE PARTITION IS A CAREER SCRIPT, AND THAT IS THE ARCHITECT'S ERROR

His finding: «a `fiery` world #1 cannot leave at the peak, while a `deep` player cannot leave after a
collapse. That is a temperament-driven career script.» And the arithmetic behind it: equal 2% coins
do NOT give equal likelihood, because the gates are not equally reachable – **peak opens for 19.4% of
eligible careers and fall for 40.3%** (the builder's own measurement).

⭐ **§4 of this spec proposed the one-voice-one-door mapping and it was wrong.** Its own sentence was
«two players in identical careers leave differently because they are different people» – which is a
claim about HOW she leaves, not about which exits exist for her. A partition turns a colour into a
cage.

**Taken: his option (b).** Every temperament reaches BOTH doors; the temperament decides the VOICE
and nothing else. That is what the design said it wanted, and it deletes the unequal-likelihood
problem rather than documenting it.

### ⚠⚠ [P1] A VALID PEAK ENDING CAN RENDER A SELF-CONTRADICTORY RECORD

Confirmed in the code. The gate opens on a title ALONE (`if (view.topTitleThisSeason) return true`),
and the renderer prefers the rank **whenever it is non-null**. So a champion who finished #15 reads:

> «She left at the top – she was **#15** the week she said it.»

**The detail must mirror WHICH CLAUSE opened the door**, not which field happens to be populated.

### ⚠⚠ [P1] THE QUIET EXIT CONTRADICTS ITSELF AND NAMES AN EVENT THE ENGINE NEVER SEES

«There was never a conversation» followed by «when you finally asked». And the literal fact it leans
on – that she did not enter the next season – is not observable: **the career latches before the next
season is playable**, so the player never gets an entry opportunity to notice.

### The [P2]s, each verified in kind

- **Lines assert state the copy function never receives.** `leavingLine` takes only the temperament,
  yet the drafts claim the parent «finally asked», that `deep` decided «a long time before», and that
  `sunny` said it «on a good day». Either her own reported account («She said she'd known for a
  while») or nothing.
- **The fall epilogue overstates the gate.** «the years in front of it» against a gate that compares
  the closing season with the one before it and asks only 200 prior points.
- **The sunny line says the opposite of the terminal event** – «She is not leaving tennis» in the week
  the engine ends her tennis career.
- **The peak face.** `happy` fits `sunny` and not `deep`; if the fall's faces are voice-specific the
  peak's should be too, or `serious` is the safer shared one.
- **The document overstates its own tests.** They check uniqueness, minimum length and banned words –
  **a lexical safety net**, not enforcement of the factual contract.
- **[P3] Four plots, not yet four voices.** The door-slamming `fiery` is 27 words in two sentences.

⭐ **What he approved**: the feed ordering matches the implementation, the headline family is
coherent, `serious` is the safest shared fall face, and no line blames the parent, the body, the
schedule or the money.

---

# §10 THE REPAIR (`round/44-doors-repair`, 17.09) – his nine findings, one by one

Everything in this section supersedes the part of §6 it names. The two [P1]s about mechanics truth
are §10.1 and §10.3; his 25+ ruling is §10.2; the copy is §10.5; the re-measurement is §10.4.

## §10.1 THE PARTITION IS DELETED, and the note that replaces it is longer than the table was

`DOOR_BY_TEMPERAMENT` is gone from `engine/ending.ts`, and both gates now read no temperament at all.
`LeavingView.temperament` stays on the view for one purpose – `leavingLine`, the words – and the
comment beside it says so.

⭐ **HIS OPTION (b), TAKEN WHOLE: every temperament reaches both doors, and the temperament decides
the VOICE and nothing else.** §4's own sentence is what makes this the design rather than a
concession to it – «two players in identical careers leave differently because they are different
people» is a claim about HOW she leaves, and a partition turned it into a claim about which exits
exist for her.

⚠⚠ **AND THE ARITHMETIC THE ORIGINAL DEFENCE GOT WRONG IS WORTH KEEPING, because it is a shape of
error that will come back.** §6.2 argued the mapping could not be a career script because it was «a
PARTITION and not a weight: two voices each, and the same chance on both sides». Equal coins are not
equal likelihood when the gates are not equally REACHABLE – and the refutation was **four paragraphs
further down the same document**, in the build's own measurement: the peak gate opened for 19.4% of
careers and the fall's for 40.3%. Two voices were therefore about twice as likely to leave at all as
the other two. The defence was checkable against a number the defender had already written down.

**What went red in the tests, and what replaced it.** `tests/two-doors.test.ts` section A pinned the
partition in three cases – the table itself, «the two doors split the four evenly», and «a girl can
only ever be offered HER door». All three are **replaced rather than deleted**, and the section's own
header names what stood there:

| the assertion that was there | its successor |
| --- | --- |
| `DOOR_BY_TEMPERAMENT` equals §4's table | *(gone with the symbol)* |
| «a girl can only ever be offered HER door» | **«all four voices reach both doors»** – the same collapse and the same peak, read for every voice, eight answers that all used to depend on her temperament |
| «the two doors split the four evenly, so no temperament is likelier to leave than another» | **«neither gate reads her voice AT ALL»** – six views swept over all four voices, every answer identical. Strictly stronger: it is the property the even split was offered as evidence FOR |
| *(nothing)* | **«the voice still decides which words she leaves in»** – four distinct lines at each door, and no voice says the same thing at both |

⚠ **ONE ASSERTION WAS DROPPED WITHOUT A SUCCESSOR AND THAT IS DELIBERATE: `peakLeavingChance ===
fallLeavingChance`.** Its stated reason was the partition («two halves of one partition at two
different rates would be a career script»), and the partition is gone. The two knobs are still the
same number, because the sweep puts both there, but nothing couples them any more and a pin that
outlives its reason starts asserting something nobody decided.

⚠ **AND ONE THING BECAME LOAD-BEARING THAT WAS NOT.** `leavingDoorDue` tests the peak first, and its
old comment said the order was a reader's convenience because each girl was asked only one gate. With
both doors open to everyone a single season can pass both – the peak's TITLE clause carries no rank,
so a champion who still lost most of her points and thirty-odd places is through both. **Peak wins
that season** (a year that ended with the top title in the sport is not a year she left after a
collapse) and a case pins it. The peak's RANK clause cannot collide at all: a place inside the top
ten and a fall of thirty places would need a rank above zero.

## §10.2 THE PEAK DOOR OPENS AT 25+ (`ENDINGS.peakMinAgeYears`)

His ruling, on the build's own measurement of a median first eligible winter at 21: «это вообще не
очень по отношению к игроку, особенно на супер-талантливом сиде. Я бы сказал 25+.»

⚠ **§2's «what they share is not an age» was about their SPREAD** – 25, 25, 28, 28 – and it licensed
not inventing a narrow window around four cases that do not share one. It did not license taking the
career away from a twenty-one-year-old who has just arrived. A floor is the bottom of his own four
cases, not a fifth fact on top of them.

Three things about how it is built:

* **It is a FLOOR, not a gate.** It can only refuse a season the place or the title already opened,
  so every other clause still says exactly what it said.
* **It sits ABOVE the title clause.** The clause that exists to WIDEN the door may not be the clause
  that steps around the floor: a girl who won the biggest tournament there is at twenty-one has more
  career in front of her, not less.
* **The fall has no floor and the asymmetry is a decision.** His ruling named the peak and its reason
  does not transfer – the fall's own three terms already require a real season to have fallen FROM.
  If he wants one there it is one line; this build will not invent it.

`LeavingView` gained `ageYears`, read in `leavingViewOf` off `kidAgeYears` – the one clock that is
hers (world/age.ts ruling 1, 09.08) – and `resolveLeaving` now stamps the ending with the SAME number
the gate read, rather than calling the clock twice.

## §10.3 THE PEAK RECORD CAN NO LONGER CONTRADICT ITSELF

His [P1], confirmed in the code: the gate opens on a title ALONE, and `endingForLeaving` preferred
the rank whenever it was non-null. A champion who finished the year at #15 latched a perfectly valid
`peak` and then read:

> «She left at the top – she was **#15** the week she said it.»

**The detail now mirrors WHICH CLAUSE opened the door.** `peakRankClauseOpened` is one predicate with
two readers – the gate asks it whether the door opens, the record asks it which fact to name – so the
two cannot drift apart again by anybody forgetting. Her place is not wrong in that case; it is simply
not the reason she is standing there.

⭐ **The pin fails on the renderer that shipped**, which is the only way to know it is this test:
with the old two-line ternary restored, `⚠⚠ the peak detail mirrors WHICH CLAUSE opened the door` is
the one case that goes red. The same mutation check was run on the other two repairs – restoring the
partition reddens three cases in sections A and C, deleting the floor reddens three in B and D.

## §10.4 THE RE-MEASUREMENT – and one door misses his band

`npm run bench:doors -- --spread --seeds 24`, **72 careers over 72 DISTINCT seeds**, `player` policy,
fourteen to forty-four. Same instrument, same population and same flags as §6.5's shipped arm, so the
two are comparable line for line. 69 of 72 reached a professional winter; best paid-table place ever
held, median #12, best #1.

### First, the reachability he asked about – per voice, per door

⚠ **THE BENCH'S OWN TABLE CHANGED SHAPE HERE AND THAT IS PART OF THE FIX.** It used to print «THE
PARTITION: one door per girl» – each voice, its one door, and one eligibility figure – which is a
layout in which the defect is invisible. Both doors, per voice, side by side:

| voice | girls | peak gate ever opened | fall gate ever opened |
| --- | ---: | ---: | ---: |
| `sunny` | 17 | 35.3% | 88.2% |
| `fiery` | 19 | **15.8%** | 78.9% |
| `quiet` | 16 | **37.5%** | 75.0% |
| `deep` | 20 | 35.0% | 65.0% |

⭐ **Every voice reaches both doors. A `fiery` girl's peak column was 0% by construction the day
before this, and a `deep` girl's fall column was 0%.**

⚠ **THE SPREAD INSIDE EACH COLUMN IS SAMPLING AND NOT A RESIDUAL PARTITION**, and it is worth saying
why rather than hoping: **neither predicate can read a temperament at all** – there is no branch to
carry one, and `tests/two-doors.test.ts` section A sweeps six views over all four voices and requires
every answer to be identical. What is left is 16 to 20 careers per voice, in which one career is five
to six percentage points. `fiery`'s 15.8% is three girls of nineteen.

### The rates, at the shipped 2% per eligible winter

| door | ELIGIBLE | **EXPECTED** | REALISED | median age at the door | median age at the FIRST eligible winter |
| --- | ---: | ---: | ---: | ---: | ---: |
| peak | 30.6% | **1.72%** | 0.0% (0 careers) | – | **25** (min 25, n 22) |
| fall | 76.4% | **2.23%** | 2.8% (2 careers) | 34 | 31 (min 20, n 55) |

⚠⚠ **THE FALL DOOR IS OUTSIDE HIS BAND AT THE SHIPPED VALUE AND THE CONSTANT WAS NOT MOVED TO HIDE
IT.** «У обоих не больше 1–2%» is a ceiling and 2.23% is over it. The peak is inside at 1.72%. The
exact sweep, one pass over the same census:

| chance per eligible winter | peak, % of all careers | fall, % of all careers | both |
| ---: | ---: | ---: | ---: |
| **1%** | **0.88%** | **1.12%** | 2.00% |
| **2%** | **1.72%** | **2.23%** ⚠ over | 3.96% ← shipped |
| 3% | 2.55% | 3.33% | 5.88% |
| 5% | 4.12% | 5.51% | 9.63% |
| 8% | 6.32% | 8.71% | 15.03% |
| 12% | 8.95% | 12.86% | 21.81% |
| 25% | 15.74% | 25.43% | 41.17% |

**`fallLeavingChance: 0.01` prices the fall at 1.12% and is one line.** It is not taken here because
the rate is his and because the shape of the miss matters to the decision: the un-partitioning roughly
doubled the fall's eligible population (37.5% → 76.4% of careers) without touching a single threshold,
so this is the same door meeting twice as many girls rather than a door that got looser. Whether that
wants a smaller coin or a tighter gate is a design question, not an arithmetic one.

⚠ **AND READ `EXPECTED` AS THE RATE, `REALISED` AS THE CONFIRMATION** – §6.5's own warning, and it
applies harder here. The peak's REALISED 0.0% is **zero careers against an expectation of 1.24**,
which is an ordinary outcome at this rate and not a dead door: the same run's ELIGIBLE column says the
gate opened for 22 of the 72, and §6.5's absurd-value arm already showed REALISED equals ELIGIBLE
exactly when the chance is 1. `EXPECTED` is computed over the whole census – **1,479 comparable
professional winters** – rather than over three coin flips.

⭐ **The mix, shipped arm**: `natural` 73.6%, `injury` 23.6%, `fall` 2.8%, `peak` 0.0%, nothing still
playing.

### What the age floor cost, isolated

⚠ **A SECOND ARM, BECAUSE «THE MEDIAN MOVED FROM 21 TO 25» IS NOT BY ITSELF ATTRIBUTION** – the
un-partitioning moved the population in the same run. One constant changed on the same tree,
`peakMinAgeYears: 25 → 0`, same seeds, same flags. That is CLAUDE.md's own null-result discipline used
forwards: if the output does not move, the floor is not doing what its comment says.

| | no floor | shipped floor (25+) |
| --- | ---: | ---: |
| peak gate ever opened | 38.9% | **30.6%** |
| peak EXPECTED at 2% | **3.21%** ⚠ over his band | **1.72%** |
| median age at the FIRST eligible winter | **22** (min **18**) | **25** (min 25) |
| top-10 band, careers eligible | 28/72 | 22/72 |

⭐⭐ **THE FLOOR IS NOT COSMETIC AND THE ARM SAYS SO IN TWO WAYS AT ONCE.** Without it the peak door
would open on an **eighteen-year-old** – six seasons younger than his youngest named case, and exactly
the «супер-талантливый сид» his ruling is about. And it would fire at **3.21% of careers**, which is
over his own rate ceiling. **His two rulings of 17.09 turn out to be one ruling: the age floor is what
puts the peak door back inside the band the un-partitioning took it out of.**

⚠ **THE ARM'S OWN CONTROL IS THE `fall` ROW, WHICH IS BYTE-IDENTICAL IN BOTH RUNS** (76.4% / 2.23% /
31). A constant that moved the door it names and nothing else is an arm that contains its reader – the
provenance check CLAUDE.md asks for before a measurement is believed, satisfied by the run rather
than argued.

⚠ And the per-voice peak column moves with it, which is the third confirmation: `sunny` 52.9% → 35.3%,
`quiet` 50.0% → 37.5%, `fiery` 21.1% → 15.8%, `deep` 35.0% → 35.0%. `deep` is unchanged because the
`deep` girls in this corpus who reach the top reach it after twenty-five anyway – a fact about seven
careers, not a property of the voice.

## §10.5 THE COPY – eight exits now, and every finding answered

**The count doubled, and that is a consequence of §10.1 rather than a decision.** With one door per
voice, one line was her whole exit. With both doors open to everyone, «she was not going to be watched
losing it back» is a sentence about a bad year in a champion's mouth. `leavingLine` therefore takes
**the door and the voice**: four voices × two doors = eight lines. They are in
`docs/specs/the-two-doors-corpus-2026-09.md`, which is the one document he reads them in.

⚠⚠ **ALL EIGHT ARE DRAFTS (invariant 4) and the pins are built so they stay drafts** – he can rewrite
any of them without asking and without a test going red.

| his finding | what changed |
| --- | --- |
| **[P1] the `quiet` exit contradicts itself and names an event the engine never sees** | rewritten. «There was never a conversation» / «when you finally asked» cannot both hold, and «she did not enter anything for next season» is unobservable – the career latches on the wrap week, before next season is playable. What survives is the part that was good: she says it as if he already knew |
| **[P2] lines assert state `leavingLine` never receives** | all three cut. The function is told the door and the voice, so a line may say nothing else. Every one of the eight is now «She said …» – a claim about what she said, which is always licensed – or a statement about the door |
| **[P2] the fall epilogue overstates the gate** | «the years in front of it» → «the season before it», which is what `fallLeavingDue` actually compares. It also lost «She did not enter the next one», the same unobservable event as the `quiet` exit |
| **[P2] the `sunny` line says the opposite of the terminal event** | «She is not leaving tennis» is gone. The warmth moved onto what she is going towards |
| **[P2] the peak face** | `EMOTION_BY_ENDING.peak`: `happy` → **`serious`**. With the partition gone all four voices reach the peak, so a face that fits `sunny` is wrong three times in four. `serious` is the face he approved on the fall for exactly this reason. A per-voice face is still open (§10.6) |
| **[P2] the document overstates its own tests** | the corpus document now says plainly that section E is **a lexical safety net** – distinctness, a minimum length, a banned vocabulary, the house dash – and that the factual contract is enforced by reading. ⭐ The tests were NOT made stricter to match the claim: the claim was the error, and a test that pinned the sentences would have to move every time he edits a word |
| **[P3] four plots, not yet four voices** | the `fiery` exits are the two shortest in the set – 14 and 17 words against `deep`'s 26 and 22 – and all eight are single sentences, so length carries the register the punctuation used to |

## §10.6 WHAT IS STILL HIS

1. ⚠⚠ **THE FALL DOOR SITS AT 2.23% AND HIS CEILING IS 2%.** The constant was left where he last saw
   it rather than tuned down to make the table agree, because the rate is his ruling. Two lines are
   available and they say different things about the door: `fallLeavingChance: 0.01` prices it at
   **1.12%** and keeps the gate as written, or a tighter threshold keeps the coin and admits fewer
   girls. The miss is a population effect – the un-partitioning doubled the fall's eligible careers
   from 37.5% to 76.4% without touching a threshold – so it is a design question rather than an
   arithmetic one. §10.4 has the full sweep.
2. **All eight exits, both epilogue paragraphs, both headlines, both faces.** Nothing here is settled.
3. **Should either face follow the VOICE rather than the ending?** `EMOTION_BY_ENDING` is keyed on the
   ending and both doors are now shared by all four voices, so §6.6's item 4 is open at both doors
   rather than one. Small engine change; nobody has asked for it.
4. **Does the fall want an age floor too?** Not ruled, not invented. Its own three terms already need
   a real season to have fallen from, and the bench says the fall's youngest first-eligible winter is
   **20** against the peak's pre-floor **18**. One line either way.
