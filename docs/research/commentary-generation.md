---
type: research
status: reference
area: content/commentary
canonical: false
last-reviewed: 2026-08-10
---

# Commentary generation: the craft, the mechanics, and what to do here

Scope: HOW running sports commentary is written and generated, and what is already known about
doing it well. Not a survey of what commentary products exist – that is covered elsewhere.

The document is in two halves. §1 is what this repo already does, with file:line, because a
recommendation the engine cannot support is worthless. §2–§4 is the research. §5 is the specific
proposal for this codebase, including how it satisfies the RNG invariant.

---

## 1. Grounding: what the game already does

### 1.1 The generator

`src/viz/commentary.ts` (718 lines) is the whole commentary system. It is a pure function
`buildCommentary(match, playerA, playerB): Beat[]` (`commentary.ts:497`) from an `AnnotatedMatch`
to an ordered list of beats. `MatchViewer.vue:906` calls it once per match; `MatchViewer.vue:912`
reveals beats progressively by comparing `beat.pointIndex` to `displayedPointIndex`.

It was commissioned as a gap-filler: `docs/specs/ui-inventory.md:74` states plainly that the match
engine produces the points and nothing turns them into readable beats.

**Eight beat kinds** (`commentary.ts:99`): `open`, `break`, `hold`, `tiebreak`, `streak`, `rally`,
`set`, `match`.

**The design is already a salience system, not a point log.** Its four load-bearing rules:

| rule | where | value |
|---|---|---|
| one beat per point, biggest kind wins | `commentary.ts:193-206`, `:710-717` | PRIORITY map |
| at most one streak and one rally per set | `commentary.ts:662-707` | the longest only |
| silence is allowed – a dull set says only its set beat | `commentary.ts:39-40` | design note |
| a row is capped at 120 chars, colour clause dropped first | `commentary.ts:132`, `:141-151` | `clauses()` |

Measured density is ~4–6 beats per set, pinned by `tests/viz/commentary.test.ts:72`.

**The `key` cut is a second salience threshold.** `commentary.ts:189` sets `KEY_SWING = 0.1`, and
`commentary.ts:161-188` records the measurement that chose it (209 matches, a six-row sweep table).
Structural beats (`open`/`set`/`tiebreak`/`match`) are always kept; everything else is kept only if
the engine's live win probability travelled at least `KEY_SWING` across the beat's own span
(`commentary.ts:520-526`). At 0.10 it keeps 50% of breaks, 84% of streaks, 26% of holds, 2% of
rallies.

**The variety mechanism is one function.** `commentary.ts:255-257`:

```ts
function variant(pointIndex: number, n: number): number {
  return (Math.imul(pointIndex + 1, 2654435761) >>> 0) % n
}
```

It is applied to exactly two phrase pools: `BREAK_LINES` (3 strings, `commentary.ts:239-243`) and
`LEVEL_LINES` (2 strings, `commentary.ts:247-250`). Every other sentence in the file is a single
authored string with slots. **This is the whole of the variety machinery today.**

**Zero RNG, by pin.** `commentary.ts:79-93` states the module draws no random numbers from any
stream. `tests/viz/commentary.test.ts:43` asserts zero draws; `tests/viz/commentary.test.ts:58`
asserts the module *imports* no RNG at all. See §5.4 – this matters.

### 1.2 What state exists per point

Everything below is already computed, already deterministic, already reachable from
`buildCommentary`'s single argument.

**Per point – `AnnotatedPoint` (`src/viz/types.ts:45-56`)**

| field | line | note |
|---|---|---|
| `entry: PointLogEntry` | 46 | see below |
| `rally: Rally` | 47 | shot-by-shot |
| `winProbA` | 50 | side A's match-win probability AFTER this point |
| `deuceCourt` | 52 | never read by commentary.ts |
| `gameEnd`, `setEnd` | 54, 56 | read |

**Per point – `PointLogEntry` (`src/engine/match/types.ts:91-97`, extends `PointContext:80-89`)**

`pointNumber`, `server`, `tiebreak`, `breakPoint`, `setPointFor`, `matchPointFor`, `winner`,
`pServe`, `scoreAfter`.

- `setPointFor` / `matchPointFor` are computed by cloning the score and probing both branches –
  `scoring.ts:66-71`. That probe pattern is exactly what §5.2 reuses.
- **`pServe` (`types.ts:94`) is the modified per-point serve probability after momentum, big-point
  nerve and fatigue. `commentary.ts` never reads it.**
- **`scoreAfter` (`types.ts:96`) is the formatted score string ("6-4 2-1 30-30", `scoring.ts:77-85`,
  `scoring.ts:185-192`). `commentary.ts` never reads it** – it re-derives a love-forty special case
  by hand at `commentary.ts:341-344`.

**Per point – `Rally` (`src/viz/types.ts:37-43`) and `Shot` (`:28-35`)**

`shots[]` with `by`, `kind` (`serve1`/`serve2`/`rally`), `direction`, `bounce`, `result`
(`in`/`winner`/`net`/`out`), plus flags `ace` and `doubleFault`. `commentary.ts:398-410` reads only
the LAST shot plus the two flags, to build a `Manner` that is used as an adjective on a beat that
already earned its row (`commentary.ts:29-33`).

**Per match – `MatchResult` (`src/engine/match/types.ts:111-147`)**

`winner`, `sets`, `stats: [SideMatchStats, SideMatchStats]`, `log`, `totalPoints`,
**`seed` (`types.ts:131`)**, `retired?`.

`SideMatchStats` (`types.ts:99-109`): `pointsWon`, `servePointsPlayed`, `servePointsWon`,
`breakPointsFaced`, `breakPointsSaved`, `breaksWon`, `longestPointStreak`. **None of these is read
by `commentary.ts`** – it recomputes per-game break-point counts itself in `scan()`
(`commentary.ts:332`).

**Derived, available, unused by commentary**

| value | where | what it would buy |
|---|---|---|
| `matchWinProbability(score, pA, pB)` | `liveProb.ts:142-157` | exact DP, pure, callable at any score – see §5.2 |
| `pointServeSpeeds(seed, point, a, b)` | `serveSpeed.ts:134-158` | per-serve km/h, `{shotIndex, side, kmh, secondServe}` |
| `computeMatchStats(annotated, a, b)` | `matchStats.ts:62-111` | aces / DFs / winners / UEs / mean rally length per side |
| `MatchPlayer.composure/stamina/age` | `types.ts:8-44` | frozen on the snapshot |
| momentum state | `engine.ts:102-106`, `point.ts:162-165` | `MOMENTUM_MIN_STREAK = 3`, bonus 0.015 |
| fatigue onset | `point.ts:59`, `:108-121` | `FATIGUE_START = 120` points; `spentness()` |

### 1.3 The precise gap

The engine gives commentary.ts a rich per-point record. commentary.ts uses: the winner, the server,
the break/set/match-point flags, the game and set boundaries, the last shot of the rally, and the
post-point win probability. It uses **none** of: `pServe`, `scoreAfter`, `deuceCourt`, serve speed,
running match totals, player attributes, or the win-probability model as a *forward-looking*
function.

And its variety budget is five authored strings behind one memoryless hash.

---

## 2. How sports commentary generation is actually done

### 2.1 The classical NLG pipeline

The reference architecture is Reiter and Dale's three-stage pipeline: **document planning**
(content determination + structuring), **microplanning**, and **surface realisation**. The
microplanner has three distinct jobs – **lexicalisation** (which words and syntactic constructs),
**aggregation** (how much goes in each sentence), and **referring expression generation** (how to
name an entity so the reader can identify it). Modern neural systems collapse these stages; the
distinction still matters as a design vocabulary, and §5.3 uses it directly.

Content selection is the first and hardest stage: given a dataset with dozens of fields, deciding
which are worth mentioning. Sports recap generation is the canonical example.

`commentary.ts` is a document planner with a hand-written surface realiser and **no microplanner
at all**. That is the structural diagnosis of the variety problem here.

### 2.2 Template/slot systems and their failure mode

Commercial data-to-text is overwhelmingly rule-based templating: canned text interspersed with
variables, function calls and conditionals, plus a mapping layer and morphological processing. The
Cambridge *Natural Language Engineering* survey of the vendor landscape (Dale, 2023–24) describes
Arria, Automated Insights, Narrative Science, Yseop, United Robots, Narrativa, AX Semantics and
others as sharing that shape, and notes that sports reports were an early fit precisely because
they display their template-based nature.

The failure mode is well documented in the automated-journalism literature: output reads formulaic
and closely hews to a pattern; readers describe automated content as descriptive and boring; human
reporters remain regarded as the more engaging storytellers even where credibility scores level
out. Knowing text is automated primes readers to hunt for the tell.

**The uncanny sameness is not a phrasing problem, it is a structure problem.** A template system
produces one row per qualifying event with the same information order every time; even with several
synonyms the *shape* repeats. Variety in the phrase pool alone does not fix it.

### 2.3 The RoboCup commentator systems – the closest prior art

Three systems generated real-time spoken commentary on RoboCup simulation-league matches and
jointly won the RoboCup-98 scientific award: **Rocco** (DFKI), **Byrne** (Sony CSL) and **MIKE**
(ETL). They are the most directly relevant published work, because they face exactly this problem:
a continuous event stream in which most events are unremarkable.

**MIKE is the mechanism worth copying.** Its architecture, as described in the literature:

1. Analyser modules consume the simulator stream and emit typed **propositions** (a tag plus an
   attribute – a pass by player 5 becomes `PASS 5`).
2. There is a large **inventory of remarks** keyed to event types.
3. Each candidate comment carries an **importance score**.
4. **The score decays over time**, and MIKE speaks the highest-scoring candidates.

That decay is the anti-repetition mechanism, and it is elegant: a comment that has just been made
becomes less attractive, so the system drifts to fresher material without anyone enumerating
"don't say X twice". It is a **stateful salience queue**, not a template list.

**Byrne** (Binsted, 1998) is the affect axis: an animated commentator generating speech and facial
expression conditioned on the character's personality, emotional state and the state of play. The
lesson is that *register* is a separate generation input from *content* – the same fact told at two
arousal levels is two different lines without two templates.

### 2.4 The automated-journalism products

**Automated Insights Wordsmith** – the system behind AP's earnings stories and its NCAA sports
recaps. Publicly described structure: users upload data, then author a template that reads like a
mad lib. Customisation has three components – **data, synonyms, and branches**. A branch is
conditional logic selecting different text. The vendor's own guidance is that nesting more synonyms
and branches is what keeps narratives from reading alike.

**United Robots** (Sweden, sports and local news since 2015) – an insight engine decides the story,
then an NLG application designs the text, with different angles per target audience. The stack is
explicitly rules-based, which the company frames as what makes auto-publishing safe: correct data
plus correct algorithm gives a traceable result. On variety, they state their dynamic text design
tool can produce "dozens of different texts from the same set of data points".

**AP** adopted Automated Insights for corporate earnings and then for thousands of NCAA sports
stories.

**What the industry says about LLMs.** The NLE survey found vendors overwhelmingly limit LLM use to
*template authoring* rather than runtime generation, citing hallucination and QA overhead. Its
conclusion is that reliability – the absence of hallucinatory risk – is the moat, and that until
generated text is demonstrably less hallucination-prone than scripted text, "the reliability moat
will remain unbridged" (Dale, NLE).

### 2.5 Tennis-specific and point-by-point work

Directly on tennis, the published work is thin and mostly vision-driven:

- **Generating commentaries for tennis videos** (IEEE, 2017) – computer vision (ball tracking, court
  fitting, stroke recognition) feeding LSTM and structured-SVM commentary generation, trained on 633
  annotated video/commentary pairs.
- **TennisVL / TennisExpert** (arXiv 2603.13397) – 202 broadcast matches, 471.9 hours, 40,523
  rally-level clips with natural-language captions, aimed at real-time commentary research.
- **IBM at Wimbledon** – the most operationally interesting. A model consumes score, play-by-play,
  crowd noise level, player gestures and expressions, and radar ball speed, and produces an
  **excitement score** per scene. Highlights packages are assembled from the top-scoring scenes, and
  the excitement score is then fed to a second model that generates a script which **modulates on
  the excitement of the action**. Bias handling is explicit: crowd-noise normalisation so vocally
  supported or demonstrative players do not dominate the highlight reel.

The two structural lessons from IBM: (a) salience is scored first and narration is conditioned on
the score, not the other way round; (b) a salience signal built on audience reaction needs
normalising, or it measures popularity rather than tennis.

Adjacent point-by-point work: **BoxComm** (boxing, arXiv 2604.04419) is the only benchmark that
treats **narration rhythm** as a first-class target. It classifies commentary into play-by-play,
tactical and contextual, and evaluates rhythm with temporal IoU against human speech windows plus
KL divergence between per-minute distributions of commentary *type*. Its finding on streaming
models is the failure mode named directly: they degrade into "repetitive words or eventually fail
to generate any commentary".

### 2.6 What LLM approaches change, and what they break

The 2025 survey *From Multimodal Perception to Strategic Reasoning* (arXiv 2506.17294) lays out the
trade space. Condensed:

| approach | gains | costs |
|---|---|---|
| template | fast, factually safe, deterministic | rigid, repetitive |
| retrieval | coherent natural language | latency, limited flexibility |
| neural | fluent, diverse | hallucination, compute |
| LLM | reasoning, few-shot, register control | latency, cost, unpredictable factuality |

Its named open problem is the one this document is about: **event selection is largely unsolved.**
Most systems generate commentary *given* predetermined events rather than selecting salient moments
themselves.

For this codebase specifically, an LLM at render time would break four things at once: the module's
honesty property (`commentary.ts:88-92` – a beat may assert nothing the point log does not carry),
the determinism pin (`tests/viz/commentary.test.ts:29-67`), offline-first, and the zero-cost
property of a PWA. The industry answer applies cleanly: **use an LLM to author the phrase inventory
offline, check the strings into source, generate deterministically at runtime.**

---

## 3. The variety problem

A best-of-three match here is ~150–200 points (`commentary.ts:14`). Most are unremarkable. The
engineering problem is not detection, it is restraint plus non-repetition.

### 3.1 Silence is the primary technique, and it is medium-dependent

Broadcast tennis is the extreme case. Tennis withholds almost nothing visually – the court is
fully framed, the ball is visible, the score is on screen, and crowd sound carries the tension –
so there is little for a commentator to add during a point, and per Betting Pundits the good ones
"supply nothing at all". Television commentary between points is **punctuation rather than
narration**: one observation carries further than continuous talk. Radio inverts the job entirely,
because the pictures are gone. Same sport, opposite job, decided by the medium.

**This is a live design input for the game, and it cuts against a naive copy of TV practice.** The
match viewer has a schematic canvas court, no audio commentary, and a text log that is the primary
carrier of what happened. That is nearer to a **live text feed** than to television. So the correct
density here is higher than a TV commentator's – but nowhere near per-point, and the current
~4–6 beats per set is a defensible place to sit. The lever to pull is not *more rows*, it is *more
distinct rows*.

### 3.2 Six techniques that actually work

1. **Salience gating.** The largest single contributor. Say fewer things and the repetition rate
   collapses mechanically. Already the design here.
2. **Recency-decayed importance (MIKE).** Score candidates, decay a candidate's score when its kind
   or phrase family has just been used, take the top. Gives variety *and* density control from one
   mechanism. **The current `variant()` hash is memoryless and cannot do this.**
3. **Microplanning instead of more templates.** Lexicalisation, aggregation and referring-expression
   generation are three orthogonal axes that multiply. Adding a fourth string to a phrase pool adds
   one line; adding a subject-choice function multiplies every line by three.
4. **Varying the grammatical subject.** The same fact has several legitimate subjects: the winner,
   the loser, the score, the shot. Subject choice is a function of what was last said, not a
   template variant.
5. **Callbacks.** Referring back to earlier in the match – a streak that has now ended, a player who
   has not been broken since the first set. Commentary craft literature treats storyline threading
   as the core engagement technique. Callbacks are the only variety mechanism that **improves as the
   match lengthens**, exactly where template systems degrade.
6. **Register escalation.** Byrne's emotional-state conditioning and IBM's excitement-modulated
   script are the same idea: one content plan, several deliveries. Escalation is also what makes a
   log *feel* like a match rather than a list.

---

## 4. What makes a moment worth narrating

### 4.1 The published answer for tennis exists, and it is exact

**Morris (1977), "The most important points in tennis"** defines a point's **importance** as the
change in match-win probability between winning and losing that point:

```
I(state) = P(A wins match | A wins this point) - P(A wins match | A loses this point)
```

Morris estimated it across scorelines and showed points are not equally important, with a
distribution that is (per Kovalchik's *Harvard Data Science Review* account) "extremely
right-skewed" – match outcomes are statistically determined by a small percentage of points.

**Klaassen and Magnus** built the empirical programme on top of it (Wimbledon, ~90,000 points),
testing tennis folklore including "all points are equally important", which they reject, and
finding that players are *less* effective on more important points. This codebase already
implements that second finding – `point.ts:167-170` applies `BIG_POINT_MAX_PENALTY` on break points
scaled by composure, and the comment names Klaassen–Magnus explicitly.

**So the engine already believes Morris's model of importance; it just never narrates from it.**

### 4.2 Importance (ex-ante) is not impact (ex-post)

The sabermetric vocabulary makes the distinction cleanly:

- **Win Probability Added (WPA)** – what a play *did*. Retrospective.
- **Leverage Index (LI)** – how much win probability *could* move. Prospective. LI 1.0 is average;
  above 2.0 is a game hanging in the balance; a blowout is near zero.

Both are explicitly "story stats" – the framing in the analytics community is that they mirror
intuition about drama rather than settling who was better. That is precisely the use here.

`commentary.ts:520-526` `swing()` is a WPA-family measure (magnitude of excursion). Morris
importance is the LI-family measure and **is not computed anywhere in this codebase**.

The distinction has a concrete payoff here. `commentary.ts:510-518` documents a real problem: a hold
from love-forty *ends where it started*, so net displacement is ~0 and the measure discarded almost
every such game (29 of 294 survived at 0.10). The fix was to switch to a travelled/excursion
measure. **Morris importance solves that natively** – a game containing three break points contains
three high-importance points regardless of where the probability finished – without the excursion
workaround.

### 4.3 What the operational systems trigger on

- **IBM/Wimbledon**: score, play-by-play, break points, crowd noise, player gesture and expression,
  ball speed, fused into one excitement score per scene.
- **MIKE**: typed event propositions with importance scores that decay.
- **Data-to-text content selection generally**: rule-based approaches cluster events by relevance
  and mention only the larger clusters; learned approaches rank events by a salience score. Both
  reduce to "score, threshold, take the top", which is what §5.2 proposes.

### 4.4 Where the research is honest about gaps

Two things I could not verify and am not asserting:

- A figure surfaced in search that sports reports mention on average ~5.7 events per game, with a
  CRF event-selection F-score of 67.1%. I could not open the primary source and could not attribute
  it to a specific paper. Treat as unverified. The *direction* – that reports mention a small subset
  – is well supported by the content-selection survey literature.
- The full text of the AI Magazine article on the three RoboCup commentators (AIMag 21(1), 2000) is
  paywalled/403 from here. The MIKE and Byrne mechanism descriptions above come from the paper
  abstracts and secondary descriptions, not from the primary full text.
- **There is no published work I could find on generating commentary for a *simulated* tennis match
  from a Markov point engine.** The vision-based tennis work assumes video input. That gap is in
  this project's favour: it has ground-truth event data that every published tennis system has to
  infer.

---

## 5. Concrete recommendations for this game

### 5.1 Engine values that are available and under-used

Ranked by value-per-line-of-change.

1. **`matchWinProbability` as a forward function** (`liveProb.ts:142`). Exact, pure, memoised DP
   over an arbitrary `MatchScore`. Probing both branches of the next point gives Morris importance
   directly. The probe idiom already exists in this engine at `scoring.ts:66-71`, which clones the
   score and awards a point to each side to derive `setPointFor`/`matchPointFor`. Cost: two DP calls
   per point on an already-memoised solver.
2. **`PointLogEntry.pServe`** (`types.ts:94`). The post-modifier serve probability. Compared against
   `basePServe`, its delta *names which modifier was acting*: momentum (`point.ts:162-165`),
   big-point nerve (`:167-170`), or fatigue (`:172-176`). This is a ready-made "why" channel that
   costs nothing and asserts nothing the log does not carry.
3. **`pointServeSpeeds`** (`serveSpeed.ts:134`). Per-serve km/h, already deterministic, already read
   by two consumers that agree by construction. A first-serve outlier, or a second serve struck at
   first-serve pace, is a classic real-commentary trigger and the number is sitting there.
4. **Running match totals.** `computeMatchStats` (`matchStats.ts:62`) or a single accumulator pass
   inside `buildCommentary`. Enables the two most common real tennis observations that the log
   currently cannot make: *firsts* ("her first ace") and *rates* ("that is one break point taken
   from seven").
5. **`SideMatchStats.breakPointsFaced/Saved`** (`types.ts:104-107`) for match-level framing, versus
   the per-game `bpFaced` already tracked in `scan()` (`commentary.ts:332`).
6. **`entry.scoreAfter`** (`types.ts:96`). The formatted game score. `commentary.ts:341-344` hand-
   tracks only the love-forty case; `scoreAfter` carries every case for free ("from fifteen-forty").
7. **Fatigue onset** (`point.ts:59`, `FATIGUE_START = 120`). A modelled state change with a real
   engine consequence (`retireHazard`, `point.ts:141`). Crossing it is narratable and true.
8. **Serve direction distribution** (`rally.ts:46-55`, `Shot.direction`). `commentary.ts:402-409`
   reads only the final shot. Direction *patterns* across a game are what "she has gone to the T
   every time" is built from.
9. **`deuceCourt`** (`viz/types.ts:52`). Unused entirely.

### 5.2 A salience rule set

**Two layers, matching the LI/WPA distinction.**

**Layer 1 – importance, computed before the point (Morris).**

```
importance(i) = | winProbIf(i, A) - winProbIf(i, B) |
```

where `winProbIf` clones the pre-point score, awards the point to a side, and calls
`matchWinProbability` – the `scoring.ts:66-71` idiom. Pure arithmetic, zero draws.

What it buys, concretely:
- **A guaranteed non-empty highlight.** `argmax(importance)` over the match is exactly one point and
  is always the right one. The current `key` cut has a measured floor problem
  (`commentary.ts:172-176`: at KEY_SWING 0.12, 10% of matches drop below four rows). An
  importance-ranked top-N cannot underfill.
- **Register.** Importance is known *before* the point, so it can raise the register of the sentence
  that describes it. This is the Byrne/IBM mechanism.
- **It fixes the hold problem without the excursion hack** (§4.2).

**Layer 2 – impact, computed after (already exists).** Keep `swing()` (`commentary.ts:520`) for
retrospective beats. It is correct for what it does.

**Layer 3 – a per-set budget rather than per-kind caps.** Today density is controlled by capping
kinds (one streak, one rally per set – `commentary.ts:38`). Replace with: score every candidate,
take the top N per set. Same output shape, but density becomes a stated parameter instead of an
emergent property, and new trigger kinds can be added without renegotiating the caps.

**Trigger inventory** – existing triggers, plus what the data already supports:

| trigger | source | status |
|---|---|---|
| break of serve | `commentary.ts:620-639` | shipped |
| hold saving >= 2 break points / a set or match point | `commentary.ts:646-658` | shipped |
| six-point streak (longest per set) | `commentary.ts:662-682` | shipped |
| 12+ shot rally ending in a winner | `commentary.ts:686-707` | shipped |
| tiebreak reached, set decided, match decided | `commentary.ts:594-618` | shipped |
| **the match's single highest-importance point** | Morris, §5.2 | new, always exists |
| **first ace of the match / of the set** | `rally.ace` + counter | new |
| **serve-speed outlier** | `pointServeSpeeds` | new |
| **double fault at high importance** | `rally.doubleFault` + Morris | new |
| **break points conceded but not converted** | `scan()` accumulation | new |
| **run of consecutive GAMES** | `GameSpan.gamesBefore/After` | new – visible in 6-1 but never said |
| **fatigue onset in a long match** | `point.ts:59` | new |

### 5.3 Variety without combinatorial explosion

**The principle: compose, do not enumerate.** Five orthogonal axes multiply; a fourth string in
`BREAK_LINES` adds one.

1. **Referring expression generation.** `speakingNames` (`commentary.ts:270-283`) decides
   first-name-vs-full-name **once for the whole match**. Real REG decides per mention from discourse
   state: full name on first mention in a set, first name normally, a pronoun when the antecedent is
   unambiguous, an epithet ("the server", "the seventeen-year-old") when a name would be the third
   in two sentences. `commentary.ts:634-636` already does this by hand for exactly one case, with a
   comment explaining that naming her twice reads like a machine. Generalise that one case into a
   function. **Cost: ~30 lines. Effect: every beat that names anyone.**

2. **Grammatical subject rotation.** One event, four legitimate subjects:
   winner-as-agent / loser-as-patient / score-as-subject / shot-as-subject. Choose by what the
   previous beat used. Multiplies the whole phrase inventory by ~3 without new strings.

3. **Register buckets.** Bucket Morris importance into three (flat / raised / peak). Register
   controls sentence length, whether the score is stated, and whether the manner clause survives the
   120-char budget. One content plan, three deliveries. The `clauses()` budget
   (`commentary.ts:141-151`) is already the right machinery – it just needs the budget to vary.

4. **Recency decay (MIKE).** Keep a small used-recently map inside `buildCommentary` and penalise a
   phrase family or beat kind that fired in the last K beats. Because the builder runs one pass over
   an already-finished match (`commentary.ts:497`), this is a plain accumulator – still a pure
   function of the match, still zero RNG. **This is the highest-leverage single fix**, because
   `variant()` is memoryless: a hash of the point index has no way to know it just said the same
   thing.

   Minimal version, if the full queue is too much: feed the use-count into the hash input –
   `variant(pointIndex * 31 + usedCount, n)`. Deterministic, one-line, adds memory.

5. **Callbacks.** `scan()` (`commentary.ts:317-386`) already materialises every game with its server,
   winner, break points and score. Everything needed for "she has not lost serve since the opening
   game" or "that is the streak ended" is already in memory. Callbacks are free content and get
   richer as the match runs.

6. **Aggregation.** `clauses()` currently only truncates. The other microplanning lever is joining:
   two beats on the same game become one sentence. Fewer rows *and* more varied rows.

**The arithmetic of composition.** 8 beat kinds x 3 subject choices x 3 registers x 3 REG forms is
216 distinct surface shapes from roughly today's number of authored strings. That is the answer to
"combinatorial template explosion": the combinatorics live in the *composition functions*, not in a
string table someone has to write and maintain.

### 5.4 The determinism constraint

**⚠ Read this before implementing anything above.**

`CLAUDE.md` invariant 2 permits new randomness through a purpose-scoped sub-stream
(`rngFromSeed(...)`), never MAIN, never dependent on player input. **This module is held to a
stricter standard than that.** `commentary.ts:79-93` states it draws zero random numbers from any
stream, and two tests pin it:

- `tests/viz/commentary.test.ts:43` – "draws ZERO random numbers – not from the main stream, not
  from a sub-stream"
- `tests/viz/commentary.test.ts:58` – "the module imports no RNG at all, so the frozen MAIN capture
  cannot move by construction"

**Every recommendation in §5.1–§5.3 is RNG-free by construction, and that is deliberate:**

| recommendation | why it needs no draw |
|---|---|
| Morris importance | exact arithmetic on the score via `liveProb.ts:142` (pure, no RNG – `liveProb.ts:2`) |
| register buckets | thresholds on that arithmetic |
| subject rotation | function of the previous beat, which is a function of the match |
| REG | function of discourse state, which is a function of the beat sequence |
| recency decay | an accumulator over the beat sequence |
| callbacks | reads `scan()`, which reads the point log |
| serve-speed triggers | `pointServeSpeeds` is already seeded from the match seed (`serveSpeed.ts:142`) and is read, not re-drawn |
| running totals | counting |

**This is strictly stronger than invariant 2 requires, and the recommendation is to keep it that
way.** It means the frozen MAIN capture (41550 draws / hash `e6b0c709`) cannot move even in
principle, and both existing pins stay green with no edit.

**If a future change genuinely wants a draw** – say a 40-string phrase pool sampled uniformly rather
than hashed – the invariant-2-compliant form is:

```ts
const rng = rngFromSeed(`${match.result.seed}:commentary:${pointIndex}`)
```

- **Purpose-scoped sub-stream, not MAIN.** Satisfies invariant 2 bullet 2.
- **Re-derived at the call site, persists nothing.** Satisfies invariant 2 bullet 2.
- **Input-independent.** The match is fully resolved before the viewer ever sees it –
  `MatchViewer.vue:919-926` argues exactly this for the shout feature. A mode switch, a shout or a
  replay cannot change `MatchResult.seed` (`types.ts:131`), which is frozen in the save. So a
  no-action run and an action-laden run tap identical MAIN sequences, unchanged.
- **Precedent in this engine:** `rally.ts:248` (`opts.seed + '#' + pointNumber`) and
  `serveSpeed.ts:142` (`${seed}:spd:${point.entry.pointNumber}`).

**But it would require the owner to relax `tests/viz/commentary.test.ts:58`, which is a deliberate
pin, not an accident.** Do not do that quietly. And there is no need to: hashing gives everything a
uniform draw gives, and §5.3's variety comes from composition rather than from a bigger draw.

### 5.5 What not to do

- **Do not call an LLM at render time.** Breaks the honesty property (`commentary.ts:88-92`), the
  determinism pins, offline-first, and the zero-runtime-cost property. The industry pattern is to
  use an LLM to *author* the inventory offline and check the strings in. That is compatible with
  everything above.
- **Do not lower `KEY_SWING` to get more rows.** `commentary.ts:161-188` already records the sweep
  and why 0.10 is the pick. Add richer *rows*, not more of them.
- **Do not add a fourth string to `BREAK_LINES`.** That is the enumeration trap. Add a subject-choice
  function instead and get 3x on every existing string.
- **Do not build a third view mode.** `full`/`key` is already a two-level salience threshold and it
  is the right architecture. A register axis buys more than a third threshold would.

### 5.6 Suggested order of work

1. Recency decay fed into `variant()` – one line, immediately visible, zero risk.
2. Referring-expression generation – generalises a case the file already argues for by hand.
3. Morris importance as a computed field, used first only for the `key` cut and the guaranteed
   top-moment beat. Measure it against the existing sweep table before changing `KEY_SWING`.
4. Register buckets keyed off importance.
5. Subject rotation.
6. New triggers (first ace, serve-speed outlier, game runs, fatigue onset), gated by the same
   per-set budget so density does not drift. `tests/viz/commentary.test.ts:72` will catch it if it
   does.

Per invariant 4 (tuning is measured, not guessed), steps 3 and 6 want a bench run and a spec in
`docs/specs/` recording predicted vs measured density and beat-kind mix, the way
`commentary.ts:161-188` already did for `KEY_SWING`.

---

## Sources

Research and prior art

- Content Selection in Data-to-Text Systems: A Survey – https://arxiv.org/pdf/1610.08375
- Survey of the State of the Art in Natural Language Generation (Gatt & Krahmer) – https://arxiv.org/pdf/1703.09902
- Building Natural Language Generation Systems, Reiter & Dale, ch. 5 Microplanning – https://www.cambridge.org/core/books/abs/building-natural-language-generation-systems/microplanning/FEB90C3A816AD6A873A1BE85B69A9D0B
- Natural Language Generation lecture notes (content planning / surface realisation), Dusek – https://ufal.mff.cuni.cz/~jurcicek/NPFL099-SDS-2014LS/10-natural-language-generation-ondrej-dusek.pdf

RoboCup commentator systems

- Three RoboCup Simulation League Commentator Systems, AI Magazine 21(1), 2000 – https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/1495 (full text 403 from here)
- Character design for soccer commentary (Byrne), Binsted 1998 – https://arxiv.org/abs/cmp-lg/9807012
- Rocco: A RoboCup Soccer Commentator System – https://link.springer.com/chapter/10.1007/3-540-48422-1_4
- MIKE: an automatic commentary system for soccer – https://www.researchgate.net/publication/3760595_MIKE_an_automatic_commentary_system_for_soccer

Automated journalism / commercial NLG

- Navigating the text generation revolution: traditional data-to-text NLG companies and the rise of ChatGPT, Natural Language Engineering – https://www.cambridge.org/core/journals/natural-language-engineering/article/navigating-the-text-generation-revolution-traditional-datatotext-nlg-companies-and-the-rise-of-chatgpt/F43278ED38F2F7F709488625CDAF5829
- Automated Insights Wordsmith – https://automatedinsights.com/wordsmith/
- Poynter on Wordsmith and AP – https://www.poynter.org/newsletters/2015/with-new-product-automated-insights-hopes-to-make-robot-journalism-cheaper-and-more-plentiful/
- Wordsmith templates: data, synonyms, branches – https://interworks.com/blog/jlyons/2018/09/21/tableau-extensions-natural-language-generation-with-wordsmith-by-automated-insights/
- How the AP writes thousands of content pieces in seconds – https://www.marketingaiinstitute.com/blog/how-the-associated-press-and-the-orlando-magic-write-thousands-of-content-pieces-in-seconds
- United Robots – how the robots automate news – https://www.unitedrobots.ai/about/the-robots
- United Robots – automated sports news – https://www.unitedrobots.ai/content-services/sports
- Guide to Automated Journalism, Columbia Journalism Review / Tow Center – https://www.cjr.org/tow_center_reports/guide_to_automated_journalism.php
- Automated news in practice: a cross-national exploratory study – https://pmc.ncbi.nlm.nih.gov/articles/PMC11008784/
- Quality perceptions and intended engagement in automated journalism – https://arxiv.org/pdf/2409.03500

Sports commentary generation, incl. tennis

- From Multimodal Perception to Strategic Reasoning: A Survey on AI-Generated Game Commentary – https://arxiv.org/pdf/2506.17294
- BoxComm: Category-Aware Commentary Generation and Narration Rhythm in Boxing – https://arxiv.org/html/2604.04419
- MatchTime: Towards Automatic Soccer Game Commentary Generation – https://arxiv.org/html/2406.18530v2
- LLM-Commentator: fine-tuning LLMs for commentary from football event data – https://www.sciencedirect.com/science/article/pii/S0950705124008530 (403 from here)
- Generating commentaries for tennis videos, IEEE – https://ieeexplore.ieee.org/document/7900036/
- TennisExpert / TennisVL – https://arxiv.org/pdf/2603.13397
- Template-free Data-to-Text Generation of Finnish Sports News – https://arxiv.org/abs/1910.01863
- The future of tennis broadcasting: excitement-driven AI sports commentary, IBM – https://www.ibm.com/think/news/future-tennis-broadcasting-ai-sports-commentary (403 from here)
- IBM Watson at Wimbledon, excitement scoring – https://technologymagazine.com/articles/how-ibm-served-up-ai-powered-fan-tools-for-wimbledon
- Wimbledon AI commentary for online highlights – https://interestingengineering.com/innovation/wimbledon-to-use-ibm-tech-to-power-ai-commentary-for-online-highlights

Salience and point importance

- Why Tennis Is Still Not Ready to Play Moneyball (Kovalchik), Harvard Data Science Review – on Morris 1977 point importance – https://hdsr.mitpress.mit.edu/pub/uy0zl4i1/release/1
- Forecasting the winner of a tennis match, Klaassen & Magnus – https://www.janmagnus.nl/papers/JRM065.pdf
- Analyzing Wimbledon, Klaassen & Magnus (book) – https://global.oup.com/academic/product/analyzing-wimbledon-9780199355952
- Klaassen & Magnus's 22 myths of tennis, Stats On the T – http://on-the-t.com/2016/04/24/klaassen-magnus-hypothesis-8/
- Win probability added – https://en.wikipedia.org/wiki/Win_probability_added
- Measuring the moment: MLB Leverage Index explainer, Opta Analyst – https://theanalyst.com/articles/mlb-leverage-index-clutch-adjusted-statistics-explainer
- Win Expectancy and WPA, Baseball-Reference – https://www.baseball-reference.com/about/wpa.shtml
- Story stats like WPA and LI don't reveal everything, Beyond the Box Score – https://www.beyondtheboxscore.com/2015/10/13/9501451/article

Commentary craft

- The voice behind the action: how sports commentary differs across football, F1, tennis, rugby and golf – https://www.bettingpundits.com/the-voice-behind-the-action-how-sports-commentary-differs-across-football-f1-tennis-rugby-and-golf/
- Techniques for engaging commentary, sports journalism notes – https://fiveable.me/sports-journalism/unit-11/techniques-engaging-commentary/study-guide/SSmHzxNRNG1NU5Yf
- Talking Heads: comments on the commentators, The Tennis Island – https://thetennisisland.com/2014/12/08/talking-heads-comments-on-the-commentators/
