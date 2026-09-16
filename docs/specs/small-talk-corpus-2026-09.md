---
type: spec
status: draft
area: narrative-and-copy
canonical: false
last-reviewed: 2026-09-16
---

# The small-talk corpus – the measured hole, and DRAFT situations to fill it

**Round 43 #8.** The owner, 16.09: «она пришла 2 раза подряд с *the players I've been watching barely
talk about winning*… этих микро диалогов должно быть много и они точно не должны так часто
повторяться, иначе в чём смысл», and then the target: «давай сделаем 44 ситуации… или можно 55 для
уверенности».

⚠ **Everything below the diagnosis is a DRAFT.** Player-facing wording is his (invariant 4). Nothing
here ships until he has read it.

---

## 1. The hole, measured

`rollSmallTalk` narrows the catalogue with `reachableSituations(world, voiceOf(world), lifeStageOf(world))`
— **by her VOICE and her STAGE**. A career has exactly one voice for life, so the catalogue a single
girl can ever reach is one row of this grid, not the whole table:

| voice | school | after-school | college | independent |
| --- | ---: | ---: | ---: | ---: |
| `sunny` | 3 | 3 | **0** | **0** |
| `deep` | 2 | 2 | 2 | 2 |
| `fiery` | **1** | **1** | **0** | **0** |
| `quiet` | 2 | 2 | 1 | 1 |

**Three readings, and the third is his bug:**

1. ⚠⚠ **A `fiery` girl has ONE situation in the entire game, and none at all after school.** Every
   small talk she ever has is that one, or the generic fallback line.
2. ⚠ **`sunny` and `fiery` are EMPTY at `college` and `independent`** – past school they get the
   subject-level fallback forever.
3. **His Zoe is `deep`, at `college`/`independent`, where the grid holds TWO.** Against four
   conversations a season (`smallTalkPerWeek` 0.08 at a close bond, `smallTalkCapPerSeason: 4`), a
   back-to-back repeat is a coin toss rather than bad luck.

⚠ **And nothing remembers.** The subject and the situation are drawn fresh each week on
`seed:life:smalltalk:<week>` with no exclusion of what was said before. That fix is architect's work,
needs no schema (`world.lifeLog` already stores every beat's `detail`) and no copy – round 43 #8(a).

---

## 2. ⭐⭐ The structural proposal: one situation, four voices

**The catalogue did not follow his own ruling.** His 15.09 review of the first six exchanges said:

> «Same event, same facts, same age and same parental choice — **four different ways of noticing,
> disclosing and responding**»

The built catalogue does the opposite: each situation is LOCKED to one voice, so three girls in four
can never reach it. Hence a `fiery` girl with one line.

**The proposal:** a situation carries the event, the stages and the fact; the OPENER and the three
branches are written **per voice**. Then:

| | voice-locked (today) | four-voiced |
| --- | ---: | ---: |
| 44 situations written | ~11 reachable per career | **44 reachable per career** |
| stage holes | must be filled four times | filled **once** |
| `fiery`'s famine | needs its own 11 | impossible by construction |
| voice records | 44 | 176 |
| ⚠ **authored utterances** | 176 | **704** – each record is an opener plus three replies |

⭐ It costs four times the writing for the same situation count — and it is the only shape in which
«44 ситуации» means 44 *to the player who is playing*. It also makes the four temperaments legible:
the same evening, four girls, four ways of bringing it up.

⚠ **It needs a small engine change**, and it is genuinely small: `voice: Voice` becomes a per-voice
map of `{ opener, branches }`; `reachableSituations` stops filtering on voice and selects the row
instead. No schema, no new stream, no wording moved on the eleven that exist.

---

## 3. The target, restated on the right axis

His «44, or 55 for certainty» is the right instinct on the wrong axis — per-career reach is what he
is feeling, and today it is 1–3. With four-voiced situations:

| written | reachable per career | each line appears, over ~40 conversations |
| ---: | ---: | --- |
| 11 (today, locked) | **1–3** | endlessly |
| 44 | 44 | **~1 time**, and many never seen |
| 30 | 30 | 1–2 times |
| 20 | 20 | 2 times |

⚠⚠ **THIS TABLE ASSUMES UNIFORM SELECTION AND THE ENGINE DOES NOT SELECT UNIFORMLY** – the subject is
drawn first, weighted by the week's register, and the situation only after. So a bright week favours
`story`, and this tranche has ONE adult story. His arithmetic on the corrected model: 44 uniform
entries still leave a 40-conversation career a ~**59%** chance of one adjacent duplicate, 55 leaves
~51%. **The corpus cannot solve adjacency; only the exclusion can.** The real target is §3b's per-cell
floor, measured.

⭐ **Recommendation: 44, four-voiced, delivered in three tranches he can read in one sitting each.**
Below is **tranche 1 – twelve situations**, weighted to the holes: every one reaches `college` and
`independent`, because that is where two voices have nothing at all.

⚠⚠ **AND §3a IS HIS REVIEW OF EXACTLY THESE TWELVE.** They are kept below as the record of what was
written and why it did not pass; the rebuild follows §3b's architecture and every row here is either
rebuilt, gated or moved. Read §3a first.

---

## 3a. ⚠⚠ HIS REVIEW OF THIS DOCUMENT (16.09) – WHAT IT FOUND, VERIFIED RATHER THAN ACCEPTED

Every counting claim in his review was re-derived from this file by script before being believed.
**All of them hold:**

| his claim | the document said | the truth |
| --- | --- | ---: |
| §3's tranche size is stale | «fifteen situations» | **12** |
| §5's after-school count | «eight» | **7** (S1, S4, S6, S7, S9, S10, S12) |
| §6's grid is one high per voice | – | follows from the line above |
| §7's reply budget | 180 | **144** (12 × 4 × 3) |
| §2's copy budget understates 4× | «176 texts» | 176 voice RECORDS = **704 utterances** (44 × 4 × 4) |
| the subject matrix is uneven | – | observation 3 · worry 3 · curiosity 3 · good-news 2 · **story 1** · **decision 0** |

⚠ **AND THE THIRD COUNTING SLIP OF ONE DAY** – a duplicated ledger block, an empty test file from a
cut script, and now «fifteen/eight». One family: **a number written and never checked against the
thing it counts**, each catchable by a single line. The rule that follows: any number in a document
that can be derived FROM that document is derived by script before the commit.

⭐⭐ **THE FINDING THAT MATTERS MOST IS NOT A COUNT.** §4 sets the test – «one evening, told four
ways» – and §5's own content does not meet it. S1's four voices describe four DIFFERENT events (one
girl losing calmly · half the field not wanting it · a remembered Tuesday · four matches on court
two), and S2–S12 repeat the fault. A row that shares a SUBJECT proves nothing about voice; only a row
that shares an EVENT does.

⚠ **AND ONE CLAIM OF MINE WAS SIMPLY WRONG.** §7 said the restructure has «nothing to measure». It
has: with subject-weighted selection, 44 entries are not equiprobable, and even 44 UNIFORM entries
leave a 40-conversation career about a **59%** chance of one adjacent duplicate (55 → ~51%). Corpus
size cannot fix adjacency; only recency exclusion can. Invariant 5 wanted a corpus bench from the
first draft and this document refused it.

## 3b. The architecture the rebuild uses – his, adopted whole

Every situation is documented as:

    ID / Subject / Stages / Source
    Shared event kernel:      the one thing that happened, in facts
    Authoritative claims:     what it asserts about the career, and under which gate
    Generated texture:        what it may invent
    Roof / away availability
    Sunny / Fiery / Deep / Quiet
    Parent stances: invite / respond / space

⚠ **THREE PROVENANCE CLASSES, because `fact: null` has been carrying far more than it licenses.**
The draft marked as «null»: repeated match-start problems, exact historical counts, draw ages, crowd
allegiance, flight costs, entry deadlines, training changes, shot success rates, arrival times and
weeks of emotional history. Those can contradict the authoritative career.

    type SituationSource =
      | { kind: 'generated'; kernel: string }     // a coffee incident, an awkward meal, a conversation
      | { kind: 'career-fact'; fact: SmallTalkFact }
      | { kind: 'derived'; from: 'stage' | 'mood' | 'calendar' }

A generated kernel may establish harmless domestic truth. It may **not** establish official results,
skill improvement, money, scheduled entries or longitudinal history.

**Six gates every row passes before a single reply is written:**
1. same event and facts across all four voices;
2. no unsupported competitive, medical or financial claim;
3. natural at every declared stage – the money talk cannot be identical for a teenager at home and a
   thirty-year-old professional, so stage variants where the premise moves;
4. no stale «today» – a card can live for weeks, so «this week», «the other day» or a named Tuesday;
5. no parent option promises gameplay that does not exist («we'll get it looked at» schedules nothing);
6. voice difference comes from attention and disclosure, not from punctuation.

⚠ **And the target is no longer a headline number.** It is: minimum situations per subject × stage
(3–4), 6+ in heavily weighted cells such as bright/story, no subject with a single reachable adult
situation, and a last-two exclusion whenever three or more are reachable – measured by a deterministic
corpus bench that reports the weighted pool size, the adjacent-repeat rate and the
repeat-within-last-three rate.

---

## 4. How the four voices are kept apart

Not by style. By the engine's own definitions of the four temperaments (`kidLife.ts`,
`TEMPERAMENT_WORD` and its comments), which are a 2×2 of **open/private × intense/steady**:

| voice | the engine's own words | so she brings a thing up… |
| --- | --- | --- |
| `sunny` | open + steady – «nothing unsaid, and an ordinary feeling named in the week it happened» | **plainly, in the moment**, no build-up and no weight |
| `fiery` | open + intense – «the verdict arrives before the explanation, and she does not let go of it» | **as a verdict first**, explanation only if you ask |
| `deep` | private + intense – «late, exact, everything lands hard, and all of it points one way» | **late, and precisely**, one thing that has been turning over for days |
| `quiet` | private + steady – «she talks about the schedule instead of herself, and nothing spills» | **sideways**, through a fact about the week |

⚠ **This is the test his review already set**, and it is not «no shared phrases»: «Same event, same
facts, same age and same parental choice — four different ways of noticing, disclosing and
responding.» So each row below is ONE evening, told four ways.

⚠ **The three branch labels are the PARENT's and do not change by voice** – he is the same person
whichever daughter he got. What changes is what she says back, and those replies are written AFTER
this document is cut and corrected, for the obvious reason: there is no point writing **144** replies
(12 × 4 × 3) to situations that may not survive the reading.

---

## 5. Tranche 1 – twelve situations, weighted to the empty cells

⭐ **Every one of the twelve reaches `college` and `independent`**, because that is where `sunny` and
`fiery` have nothing at all today. **Seven** also reach `after-school` (S1, S4, S6, S7, S9, S10, S12).

### 5.1 `observation` – what she has noticed about the game

**S1 · `watching-others-lose`** · stages: after-school, college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"I watched a girl lose today and she was fine about it. Properly fine. Is that something you learn?"` |
| `fiery` | `"Half of them don't even want it. You can see it. They turn up and they don't want it."` |
| `deep` | `Late in the call: "I've been thinking about the one who lost on Tuesday. She shook hands like it was a Tuesday."` |
| `quiet` | `"There were four matches on court two today. I stayed for all of them."` |

Branches: **Ask what she saw** · **Say noticing that is the skill** · **Say she can just watch tennis**

**S2 · `the-quiet-ones-win`** · stages: college, independent · fact: `played-recently`

| voice | opener |
| --- | --- |
| `sunny` | `"The ones who win are so BORING between points. I mean that nicely."` |
| `fiery` | `"I talk too much out there. I've known it for a month and I keep doing it."` |
| `deep` | `"I counted. She said nothing for nine games. Nine."` |
| `quiet` | `"I've started walking to the towel every time. Even when I don't need it."` |

Branches: **Ask what she does instead** · **Say the routine is the point** · **Say not everything needs a system**

**S3 · `the-crowd-is-not-for-her`** · stages: college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"Someone shouted my name today and I completely forgot how to serve. It was quite funny."` |
| `fiery` | `"They were cheering for her. In my country. I'm not over it and I don't intend to be."` |
| `deep` | `"The noise stops meaning anything after a while. I think that happened to me today."` |
| `quiet` | `"There were more people than usual. The match was at four."` |

Branches: **Ask how it felt** · **Say a crowd is somebody else's weather** · **Say she doesn't owe the room anything**

### 5.2 `worry` – the thing that is bothering her

**S4 · `the-body-that-answers-late`** · stages: after-school, college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"My legs turned up about twenty minutes after I did today. Weird, right?"` |
| `fiery` | `"Something's wrong with my first hour. Every match. I've had enough of it."` |
| `deep` | `"It's the third time. Same hour, same feeling, and I don't think it's a coincidence any more."` |
| `quiet` | `"I've moved my warm-up earlier. Just so you know, in case the schedule looks odd."` |

Branches: **Ask her to describe it** · **Say we'll get it looked at** · **Say bodies have slow mornings**

**S5 · `everyone-is-younger`** · stages: college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"There was a sixteen-year-old in the draw today and she was really good. Which is fine! It's fine."` |
| `fiery` | `"If one more person tells me I'm young to still be climbing, I'm going to say something I mean."` |
| `deep` | `"I worked out how many seasons I've got. I'd rather not say the number out loud."` |
| `quiet` | `"The draw's been going younger. I looked it up properly, not just a feeling."` |

Branches: **Ask what the number is** · **Say the clock is not the story** · **Say she doesn't have to do the maths tonight**

**S6 · `the-money-she-noticed`** · stages: after-school, college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"I saw what the flights cost. I'm not upset, I just didn't know."` |
| `fiery` | `"Don't hide the numbers from me. I'd rather know what I'm costing than guess."` |
| `deep` | `"I added it up. The travel, the coach, all of it. I've been carrying it around since Tuesday."` |
| `quiet` | `"The entry closes Friday. I can skip it if the week is heavy."` |

Branches: **Ask what she's been thinking** · **Say the money is ours to worry about** · **Say we'll go through it together properly**

### 5.3 `curiosity` – what she wants to understand

**S7 · `what-makes-a-good-loss`** · stages: after-school, college, independent · fact: `played-recently`

| voice | opener |
| --- | --- |
| `sunny` | `"Can a loss be a good one? Like actually good, not a nice thing people say?"` |
| `fiery` | `"There's no such thing as a good loss. Tell me I'm wrong."` |
| `deep` | `"I've been trying to work out which of my losses I'd keep. I think there are two."` |
| `quiet` | `"I've started writing down what went wrong. It's only a list."` |

Branches: **Ask which two** · **Say a loss you can name is one you can use** · **Say she can let it go for tonight**

**S8 · `why-they-chose-tennis`** · stages: college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"Did any of them PICK this? Or did it just sort of happen to everyone like it happened to me?"` |
| `fiery` | `"I picked it. I want that on the record, because people keep assuming."` |
| `deep` | `"I asked one of the older ones why she started. She had to think about it for a long time."` |
| `quiet` | `"Two of the girls came from other sports. I found that interesting."` |

Branches: **Ask what she'd have picked instead** · **Say she picked it and keeps picking it** · **Say it doesn't need an answer**

**S9 · `the-coach-who-explains`** · stages: after-school, college, independent · fact: `coach-employed`

| voice | opener |
| --- | --- |
| `sunny` | `"He told me WHY today, not just what. It was such a different day."` |
| `fiery` | `"I asked him why and he actually answered. I want that every time now."` |
| `deep` | `"He changed one thing on Monday and it's still in my head on Thursday. That's never happened."` |
| `quiet` | `"We've changed the Tuesday session. It's working better, I think."` |

Branches: **Ask what he changed** · **Say that is what a real coach does** · **Say she doesn't have to report the sessions**

### 5.4 `good-news` – the thing that went right

**S10 · `the-shot-that-arrived`** · stages: after-school, college, independent · fact: `played-recently`

| voice | opener |
| --- | --- |
| `sunny` | `"My backhand turned up today! Just turned up, like it had been on holiday."` |
| `fiery` | `"I hit ONE. You'd have heard it. I'm still annoyed about the other four."` |
| `deep` | `"Third game, second point. I've replayed it about forty times and it still holds up."` |
| `quiet` | `"The backhand went where I aimed. Four times out of six."` |

Branches: **Ask her to describe it** · **Say that is months of work arriving** · **Say she's allowed to just enjoy it**

**S11 · `someone-asked-her-for-advice`** · stages: college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"A younger girl asked ME what to do about her serve. Me!"` |
| `fiery` | `"I told her exactly what she was doing wrong. She'll thank me eventually."` |
| `deep` | `"She asked me a question I've been asking myself for two years. I didn't have a clean answer."` |
| `quiet` | `"I stayed late on court three. One of the juniors had a question."` |

Branches: **Ask what she told her** · **Say being asked is its own result** · **Say she's not obliged to teach anyone**

### 5.5 `story` – something that happened, not about tennis

**S12 · `the-long-way-back`** · stages: after-school, college, independent · fact: `null`

| voice | opener |
| --- | --- |
| `sunny` | `"We missed the coach back and walked. It was honestly the best part of the week."` |
| `fiery` | `"Whoever planned that transfer should be made to do it themselves. Twice."` |
| `deep` | `"It was an hour of walking and nobody said anything, and it was the first time I'd felt fine in weeks."` |
| `quiet` | `"The transfer was late. We got back at eleven. Everything's fine."` |

Branches: **Ask about the walk** · **Say those are the bits she'll remember** · **Say she should get some sleep**

---

## 6. What this tranche does to the grid

With these twelve four-voiced, every cell of the grid gains twelve, and the two empty columns stop
being empty:

| voice | school | after-school | college | independent |
| --- | ---: | ---: | ---: | ---: |
| `sunny` | 3 | 3 → **11** | 0 → **12** | 0 → **12** |
| `deep` | 2 | 2 → **10** | 2 → **14** | 2 → **14** |
| `fiery` | 1 | 1 → **9** | 0 → **12** | 0 → **12** |
| `quiet` | 2 | 2 → **10** | 1 → **13** | 1 → **13** |

⚠ **`school` is untouched on purpose and is tranche 2's job.** The holes he is feeling are all past
school, so the first tranche goes where the game is silent rather than where it is merely thin.

---

## 7. What this document does not do

* **It writes no replies.** Each situation shows the parent's three labels; what she says back to each
  is written after he has cut and corrected the openers, because **144** replies (12 × 4 × 3) to situations
  that may not survive a reading is work spent on the wrong thing.
* **It ships nothing.** Every line here is a DRAFT under invariant 4.
* **It does not fix the repeat.** That is round 43 #8(a) – the exclusion read off `world.lifeLog` –
  and it is architect's work with no schema and no copy. A bigger corpus makes a repeat rarer; only
  the exclusion makes a BACK-TO-BACK repeat impossible.
* **It proposes an engine change it has not measured**, because there is nothing to measure: the
  four-voice restructure is a data-shape change, and its whole effect is the grid table in §6.
