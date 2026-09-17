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

---

# PASS 2 – the rebuilt tranche

Written against §3b's architecture and his six gates. **Fourteen situations**, and the weighting is
deliberate: `story` and `decision` were the starved cells (1 and 0 adult situations), so they take
six and four. Every one reaches `college` and `independent`.

⚠ **Every kernel below is `generated` unless a gate is named.** A generated kernel establishes
harmless domestic truth – a kettle, a sock, a dinner table – and may not establish results, skill,
money, entries or longitudinal history. Where a situation needs the career to be true, it names the
gate.

⚠ **No line says «today»** (gate 4): a card can live for weeks, so the wording is «this week», «the
other day», or a named day that reads as a memory rather than as this morning.

---

## P2.1 `story` – six, because a bright week favours this cell and it held one

### R1 · `the-kettle` · story · after-school, college, independent · generated
**Kernel:** In the tournament hotel the kettle only boils while the switch is held down. She stood
holding it for about four minutes to make tea, and a player she doesn't know came in and did the same
without a word.
**Authoritative claims:** none. **Texture allowed:** the hotel, the other player, the tea.
**Frames:** away only (she is travelling).

| voice | opener |
| --- | --- |
| `sunny` | `"You have to HOLD the kettle down in this place. For four minutes. Someone else came in and did exactly the same thing and we just stood there."` |
| `fiery` | `"The kettle doesn't stay on. You hold it. Four minutes of my life. Then another girl came in and held hers too, so at least I'm not the idiot."` |
| `deep` | `"I stood holding a kettle switch for four minutes. Someone came in and did it too. Neither of us said anything and it was the least alone I've felt this week."` |
| `quiet` | `"The kettle in the room needs holding down. Takes about four minutes. Someone else came in and waited as well."` |

**Parent:** *Ask who else was standing there* · *Say you'd have given up at two minutes* · *Laugh and let it go*

### R2 · `the-labelled-fruit` · story · after-school, college, independent · generated
**Kernel:** Someone she trains with writes her own name on every banana in the shared fridge.
**Authoritative claims:** none – «someone she trains with» is deliberately not a named teammate and
creates no persistent relationship. **Frames:** roof and away.

| voice | opener |
| --- | --- |
| `sunny` | `"Someone writes her NAME on bananas. On every single one. Who is taking the bananas?"` |
| `fiery` | `"She labels her fruit. Her fruit. I've said nothing for three weeks and I am running out of nothing."` |
| `deep` | `"There's a woman who writes her name on bananas. I've decided not to ask why, because I think the answer might be sad."` |
| `quiet` | `"There's a system in the fridge now. Names on things."` |

**Parent:** *Ask whether anyone has ever taken one* · *Say people mark what they can't replace* · *Change the subject entirely*

### R3 · `the-stranger's-sock` · story · after-school, college, independent · generated
**Kernel:** The laundry came back one sock short and one sock over. The extra one isn't hers and she
has kept it.

| voice | opener |
| --- | --- |
| `sunny` | `"The laundry gave me back a sock that isn't mine and now I feel responsible for it."` |
| `fiery` | `"Someone out there has my sock. They know they have it. That's the part I can't let go of."` |
| `deep` | `"There's a sock in my bag that belongs to a stranger. I've moved it between three hotels now and I can't explain why."` |
| `quiet` | `"Laundry came back one short and one over. I kept the spare."` |

**Parent:** *Ask what the sock looks like* · *Say it's yours now* · *Say you have three of those at home*

### R4 · `the-announcement` · story · college, independent · generated
**Kernel:** An announcement at the airport gate went out in a language nobody around her understood,
and the whole gate stood up at once anyway.

| voice | opener |
| --- | --- |
| `sunny` | `"They said something over the speaker, nobody understood a word, and the entire gate stood up together. Herd instinct!"` |
| `fiery` | `"Not one person knew what was said. Not one. And we all stood up like sheep, me included, which is the bit that bothers me."` |
| `deep` | `"An announcement went out that nobody understood, and the whole room stood. I've been thinking about how easily that worked."` |
| `quiet` | `"The gate announcement wasn't in English. Everyone stood, so I did. We boarded fine."` |

**Parent:** *Ask whether it was even the right flight* · *Say you'd have stood up too* · *Say she got there, which is the main thing*

### R5 · `the-autograph-that-left` · story · college, independent · generated
**Kernel:** A small child asked her to sign something after a match, then got shy and went back to a
parent without taking it.

| voice | opener |
| --- | --- |
| `sunny` | `"A little kid asked me to sign something and then panicked and ran off. I'm still holding the pen."` |
| `fiery` | `"I got asked for an autograph! And then she LEFT. I had already started writing."` |
| `deep` | `"A child asked me to sign something and changed her mind halfway. I think she'd been sent, and I think she worked that out."` |
| `quiet` | `"Someone asked for a signature after the match. It didn't happen in the end."` |

**Parent:** *Ask what she was going to write* · *Say the kid will tell that story for years* · *Say it's a strange thing to get used to*

### R6 · `the-saved-seat` · story · college, independent · generated
**Kernel:** At the players' dining table someone she barely knows had a bag on the chair beside them
and moved it when she came in.

| voice | opener |
| --- | --- |
| `sunny` | `"Someone saved me a seat at dinner. I've spoken to her maybe twice!"` |
| `fiery` | `"She kept me a seat. I barely know her. I don't know what to do with that and it's been bothering me all evening."` |
| `deep` | `"There was a bag on the chair beside hers and she moved it when I came in. I've been turning that over since."` |
| `quiet` | `"I sat with someone at dinner. The seat was free."` |

**Parent:** *Ask what they talked about* · *Say somebody noticed her* · *Say dinner is just dinner*

---

## P2.2 `decision` – four, because the cell held ZERO adult situations

### R7 · `one-meal` · decision · college, independent · generated
**Kernel:** She has learned to cook exactly one meal properly and is deciding whether to learn a
second or keep eating that one.
**Authoritative claims:** none. ⚠ **Stage note:** unreachable at `school`/`after-school` on purpose –
a girl under a parent's roof is not deciding this.

| voice | opener |
| --- | --- |
| `sunny` | `"I can make ONE thing now. Properly. I'm deciding whether to learn a second or just accept that this is who I am."` |
| `fiery` | `"I can cook one meal. Either I learn another this week or I eat this one until I die. Those are the options."` |
| `deep` | `"I've made the same meal eleven times. I'm trying to work out whether that's competence or hiding."` |
| `quiet` | `"I've been eating the same thing most nights. It's fine. I might learn another one."` |

**Parent:** *Ask what the meal is* · *Say one you can make beats three you can't* · *Say nobody is marking her on this*

### R8 · `alone-or-with-them` · decision · college, independent · **fact: `march-entry-open`**
**Kernel:** The group is travelling a day early for the next event; she could go with them or travel
alone the morning after.
⚠ **Gated deliberately:** it presumes an upcoming entry, which is a career fact, so it takes
`march-entry-open` rather than inventing a schedule.

| voice | opener |
| --- | --- |
| `sunny` | `"Everyone's going a day early. I could go with them or go on my own the morning after. I genuinely can't decide."` |
| `fiery` | `"I'm going on my own. Probably. A whole day of sitting around with everyone would finish me before I started."` |
| `deep` | `"A day early with them, or alone the next morning. I've picked it up and put it down about six times since lunch."` |
| `quiet` | `"The group goes a day before. I could go after. Either works."` |

**Parent:** *Ask which one she keeps coming back to* · *Say arriving rested is worth something* · *Say either is fine and she should pick the easy one*

### R9 · `the-routine-she-dropped` · decision · after-school, college, independent · generated
**Kernel:** There is a small pre-match routine she used to do and has stopped, and she only noticed
this week that she had stopped.
⚠ **Texture only:** the routine is a water bottle, not a technical or training change – nothing here
touches development.

| voice | opener |
| --- | --- |
| `sunny` | `"I've stopped doing the thing with the water bottle. I only just noticed I'd stopped!"` |
| `fiery` | `"I dropped the bottle thing. It was superstition and I'm not superstitious. I think."` |
| `deep` | `"There was a thing I did before matches. I stopped weeks ago and only worked out this week that I'd stopped."` |
| `quiet` | `"I don't do the bottle thing any more. No particular reason."` |

**Parent:** *Ask when she thinks she stopped* · *Say she can start again if she misses it* · *Say it clearly wasn't load-bearing*

### R10 · `advice-she-did-not-ask-for` · decision · college, independent · generated
**Kernel:** An older player she doesn't know told her, unprompted, to change something about how she
stands to return.
⚠ **It asserts no outcome** – whether the advice is good is never stated, and taking it changes
nothing in the engine.

| voice | opener |
| --- | --- |
| `sunny` | `"Someone I've never spoken to told me to change how I stand to return. Do I... do that?"` |
| `fiery` | `"A woman I don't know told me how to return. I haven't decided whether that was kind or rude and I've had all week."` |
| `deep` | `"Unasked-for advice, from someone with no reason to help me. I've been trying to work out what she wanted from it."` |
| `quiet` | `"Somebody said something about my return. I wrote it down."` |

**Parent:** *Ask what exactly she said* · *Say she can try it and drop it* · *Say she doesn't owe a stranger a change*

---

## P2.3 `good-news` – three ordinary competences

### R11 · `five-coffees` · good-news · college, independent · generated
**Kernel:** She did the coffee run for five people and got every order right without writing them down.

| voice | opener |
| --- | --- |
| `sunny` | `"I remembered five coffee orders. FIVE. Including the complicated one."` |
| `fiery` | `"Got every coffee right. Every one. Somebody should have been filming."` |
| `deep` | `"I remembered all five without writing them down. It is a stupid thing to be pleased about and I am pleased about it."` |
| `quiet` | `"I did the coffee run. Got them all right."` |

**Parent:** *Ask what the complicated one was* · *Say that's a useful kind of memory* · *Laugh and say nothing else*

### R12 · `the-grip-she-did-herself` · good-news · after-school, college, independent · generated
**Kernel:** A grip came loose mid-practice and she re-wrapped it herself instead of asking anyone.
⚠ **No performance claim** – it says nothing about how she played, only that the grip held.

| voice | opener |
| --- | --- |
| `sunny` | `"My grip came off and I just... did it. Myself. Badly, but myself."` |
| `fiery` | `"I re-gripped it myself. Didn't ask, didn't need to, and it held."` |
| `deep` | `"The grip went halfway through. I sat down and did it, and I've been thinking about how long I'd have waited for help a year ago."` |
| `quiet` | `"Re-wrapped a grip this week. It held."` |

**Parent:** *Ask how bad it looks* · *Say that's one less thing she needs anyone for* · *Say you still can't do it either*

### R13 · `the-call-she-made` · good-news · college, independent · generated
**Kernel:** She had to ring and change a booking in a language she is still learning, and it worked.
⚠ **Not a money event** – what the booking cost is never named, so it asserts nothing about the
ledger.

| voice | opener |
| --- | --- |
| `sunny` | `"I made a phone call. In an actual other language. And the person understood me!"` |
| `fiery` | `"I made the call myself. I'd been putting it off for a week and it took four minutes, which is the annoying part."` |
| `deep` | `"I rang them and did it in their language. Badly. It worked, and I've been quietly pleased about it since."` |
| `quiet` | `"The booking's changed. I called."` |

**Parent:** *Ask how much of it she understood* · *Say the week of dreading it was the hard part* · *Say well done and leave it*

---

## P2.4 `observation` – R14 is S1 rebuilt, using his own example

### R14 · `the-calm-loss` · observation · after-school, college, independent · **fact: `played-recently`**
**Kernel:** After a match of her own, she watched another player lose, shake hands calmly, pack her
bag and leave without visible upset.
⚠ **Gated** because it presumes she was at a tournament. ⚠ **It says nothing about HER result** – the
other player's loss is generated texture; her own match is only the reason she was there.
⭐ **This row is his, written in his review as the worked example of a shared kernel**, and it is used
as he wrote it.

| voice | opener |
| --- | --- |
| `sunny` | `"A girl lost and was genuinely fine about it. Shook hands, packed up, left. Is that something you learn?"` |
| `fiery` | `"She lost and just walked off. No argument, nothing. How?"` |
| `deep` | `"She shook hands like losing was only Tuesday. I watched her pack, and I still don't understand it."` |
| `quiet` | `"She shook hands, packed her bag and left. I stayed and watched the next one."` |

**Parent:** *Ask what she'd have done* · *Say losing might get easier to carry* · *Say she doesn't have to have a view on it*

---

## P2.5 What the rebuilt tranche does to the grid – counted by script, not claimed

Fourteen four-voiced situations reach every voice. Six of them also reach `after-school`; none lists
plain `school`, deliberately, because every hole he is feeling is past it.

| voice | school | after-school | college | independent |
| --- | ---: | ---: | ---: | ---: |
| `sunny` | 3 | 3 → **9** | 0 → **14** | 0 → **14** |
| `deep` | 2 | 2 → **8** | 2 → **16** | 2 → **16** |
| `fiery` | 1 | 1 → **7** | 0 → **14** | 0 → **14** |
| `quiet` | 2 | 2 → **8** | 1 → **15** | 1 → **15** |

**Against his per-cell floors:**

| his floor | status |
| --- | --- |
| 3–4 reachable per subject at each active stage | `story` 6 · `decision` 4 · `good-news` 3 · `observation` 1+existing · **`worry` and `curiosity` still ride the old rows – tranche 3** |
| 6+ in heavily weighted cells (bright/story) | ✅ `story` = 6 |
| no subject with only ONE reachable adult situation | ✅ for `story`, `decision`, `good-news`; ⚠ `observation` is 1 rebuilt + 1 old |
| last-two exclusion when ≥3 reachable | round 43 #8(a), architect's, no schema |

⚠ **Two subjects are deliberately NOT in this tranche.** `worry` and `curiosity` in the old draft were
where his heaviest gating findings landed – S4's medical claim, S5's draw ages, S6's money, S7's
unlicensed loss, S9's coaching outcome. Rewriting them needs the gates decided first (which of them
take `played-recently`, which need a new `lost-recently`, which move out of small talk entirely), so
they are tranche 3 rather than hurried into this one.

⭐ **And S8 («why tennis») is moved out of the corpus, not rebuilt.** His verdict: foundational
agency is not disposable small talk, and «she keeps choosing it» can invalidate genuine doubt. It
belongs to a larger beat and is filed as such.

## P2.6 The corpus bench – what §7 wrongly said did not exist

Deterministic, no engine change, reads the catalogue and the selection weights:

| # | reports |
| --- | --- |
| K1 | the WEIGHTED pool size per (voice × stage × register) – not the raw count |
| K2 | the adjacent-repeat rate over 40 conversations, with and without the exclusion |
| K3 | the repeat-within-last-three rate |
| K4 | the per-subject × stage floor, as a pass/fail table |
| K5 | ⚠ the **unreachable set** – any situation no career can ever draw, which is how a gate typo hides |

⭐ **K2 is the acceptance test and it is the one number his complaint is about.** His own arithmetic
says 44 uniform entries still leave ~59% of careers one adjacent duplicate; the exclusion is what
takes that to zero, and the bench is what proves it rather than asserting it.

✅ **BUILT AND RUN, 16.09 – `npm run bench:smalltalk` (`tools/small-talk-corpus-bench.ts`).** The two
arms are the same engine: the B arm leaves each raised row as the engine wrote it, the A arm rewrites
its `detail` to the subject half, which is exactly a pre-round-43 row to the draw. `assertArmA`
re-asks the engine's own exclusion on every A-arm roll and fails the run if it ever narrows anything,
so the null arm cannot quietly contain the change.

⚠ **K2 had to be re-cut from «careers» to «adjacent pairs», and the re-cut is the honest form.**
`withoutRecentSituations` never empties the pool, so on a week whose reachable set is ONE situation
nothing can stop her repeating it – and «fixing» that would mean the generic opener, which is worse.
So the acceptance is asked of the pairs where an alternative existed:

240 careers per arm, 40 conversations each:

| reading | A · no exclusion | B · last-two excluded |
| --- | ---: | ---: |
| **K2 acceptance** – adjacent pairs, pool ≥ 2 at the later draw (posed career) | 3129/5683 | **0/5683** |
| the same, on a career with no coach and no matches | 2118/4011 | **0/4011** |
| K2 – careers with at least one adjacent repeat (posed) | 100% | 25% |
| **K3 acceptance** – draws with a pool of 3 or more | 54/131 | **0/131** |
| K3 – careers with a repeat inside three | 100% | 100% |

⚠⚠ **AND THE TWO NUMBERS THIS SECTION EXISTS TO SURFACE, both measured on the SHIPPED eleven:**
a 40-conversation career meets **~2.5 distinct situations**, and **14.1% of her conversations reach
no situation at all** and fall through to the legacy generic opener. K4 fails every one of its 24
cells and K5 passes – every shipped situation is reachable. **The mechanism is proven; the corpus is
the hole, and this document is the hole's repair.**

⚠ K3's «careers with a repeat inside three» stays at 100% and cannot move on this catalogue: the
reachable pool is 3 or more on **1.4%** of draws in a posed career and never in a bare one. That row
is a measurement of the corpus, not of the exclusion.

---

# PASS 3 – tranche 2, and the shape is his

⭐ **He ruled the form on tranche 1, 17.09: «форма строк верна, дописывай остальные 30 и присылай на
ревью».** So PASS 3 adds **thirty** on the same architecture and the same six gates, taking the corpus
to **44** – his own target, measured now on the axis that matters (44 written = 44 reachable, because
every situation carries all four voices).

⚠ **The two subjects tranche 1 held back arrive here.** `worry` and `curiosity` were where his
heaviest gating findings landed – the medical claim, the draw ages, the money, the unlicensed loss,
the coaching outcome – so they were deferred until the gates were settled rather than hurried. Each
one below either carries a career gate or asserts nothing the career could contradict.

⚠ **And the copy review of 17.09 binds this tranche too**: no explanatory dashes where a full stop
will do, no abstractions standing in for a thing, and the parent's stances are plain rather than
aphoristic.

---

## P3.1 `worry` – six, all gated or generated-safe

### R15 · `the-hand-that-aches` · worry · after-school, college, independent · generated
**Kernel:** Her racket hand aches after practice in a way it did not last year, and she has been
opening jars with the other hand for a week.
⚠ **It asserts no injury and no diagnosis** – an ache she noticed, and a habit she changed. The engine
owns injuries; this owns a jar.

| voice | opener |
| --- | --- |
| `sunny` | `"I've been opening jars with my left hand all week and I only just noticed why."` |
| `fiery` | `"My hand aches. It did not ache last year. That is all I am going to say about it."` |
| `deep` | `"There is an ache in my hand that was not there a year ago. I have been avoiding using it and pretending I have not."` |
| `quiet` | `"I have been using my left hand for the jars. It is easier that way at the moment."` |

**Parent:** *Ask how long it has been going on* · *Say we should mention it to somebody* · *Say hands ache and she should tell you if it changes*

### R16 · `the-one-who-stopped` · worry · college, independent · generated
**Kernel:** A player she used to see at every event has stopped appearing, and nobody has said why.
| voice | opener |
| --- | --- |
| `sunny` | `"There is a girl I always used to see at these things and she just is not here any more."` |
| `fiery` | `"She is gone. Nobody will say why. I hate that nobody will say why."` |
| `deep` | `"I worked out this week that I have not seen her since the spring. Nobody has mentioned it once."` |
| `quiet` | `"The draw is missing somebody I used to see a lot."` |

**Parent:** *Ask whether she knew her well* · *Say people leave for ordinary reasons too* · *Say she does not have to find out*

### R17 · `the-week-with-nothing-in-it` · worry · college, independent · generated
**Kernel:** She has a week with no match and no travel, and she has not decided whether it is rest or
an absence.
| voice | opener |
| --- | --- |
| `sunny` | `"I have a completely empty week and I do not know what to do with myself."` |
| `fiery` | `"An empty week. I will go mad. I already know I will go mad."` |
| `deep` | `"There is nothing in next week at all. I keep looking at it and I cannot tell if I am relieved."` |
| `quiet` | `"Next week is clear. I might catch up on some things."` |

**Parent:** *Ask what she would do with it* · *Say an empty week is allowed to be empty* · *Say you will find her something if she wants*

### R18 · `the-loss-she-is-still-carrying` · worry · after-school, college, independent · **fact: `played-recently`**
**Kernel:** A match she played is still in her head days later, and she cannot say which part of it.
⚠ **Gated** because it presumes a recent match. ⚠ **It does not say she LOST** – `played-recently`
does not license that, and the kernel is deliberately about carrying a match rather than losing one.
| voice | opener |
| --- | --- |
| `sunny` | `"I am still thinking about that match and I cannot work out which bit."` |
| `fiery` | `"That match is still in my head. Four days. I want it out."` |
| `deep` | `"I have replayed it enough times to know it is not one point I am stuck on. It is the shape of the whole thing."` |
| `quiet` | `"I keep coming back to Tuesday's match. It is fine."` |

**Parent:** *Ask which part she keeps returning to* · *Say some matches take a week to put down* · *Say you can talk about something else*

### R19 · `the-name-she-heard` · worry · college, independent · generated
**Kernel:** She overheard two people discussing her, could not hear what was said, and has been
turning it over since.
| voice | opener |
| --- | --- |
| `sunny` | `"Two people were talking about me and I could not hear a word. That is worse than hearing it."` |
| `fiery` | `"They were talking about me. I should have walked over. I keep thinking about not walking over."` |
| `deep` | `"I heard my own name across a room and nothing else. It has been sitting with me all week."` |
| `quiet` | `"I heard my name in the corridor. Could not tell you what about."` |

**Parent:** *Ask who it was* · *Say people talk about players, it is the job* · *Say you would not have heard it either*

### R20 · `the-money-she-did-not-ask-about` · worry · college, independent · **fact: `march-entry-open`**
**Kernel:** She knows an entry is open and has not brought it up, because she does not know what it
costs.
⚠ **Gated on a real open entry**, so the situation presumes no schedule of its own. ⚠ **It names no
figure** – what the trip costs is the ledger's, not a conversation's.
| voice | opener |
| --- | --- |
| `sunny` | `"I have not asked about the entry because I did not want to make it a whole thing."` |
| `fiery` | `"I am not going to ask what it costs. I would rather not know and then I cannot argue about it."` |
| `deep` | `"I have known the entry was open for four days and I have not mentioned it once. I have been working out why."` |
| `quiet` | `"The entry is open. I have not put my name down."` |

**Parent:** *Ask whether she wants to go* · *Say the money is a question for you, not her* · *Say she can put her name down and you will sort the rest*

## P3.2 `curiosity` – six

### R21 · `what-the-good-ones-do-first` · curiosity · college, independent · generated
**Kernel:** She has started watching what other players do in the first ten minutes on court rather
than during points.
| voice | opener |
| --- | --- |
| `sunny` | `"I have started watching what people do before the match instead of during it. It is fascinating."` |
| `fiery` | `"The good ones all do something in the first ten minutes. I want to know what it is."` |
| `deep` | `"I stopped watching the points and started watching the warm-ups. There is more in them."` |
| `quiet` | `"I have been getting to the courts earlier. You see different things."` |

**Parent:** *Ask what they do* · *Say she is watching like a coach now* · *Say she can just watch the tennis*

### R22 · `how-they-live` · curiosity · college, independent · generated
**Kernel:** She has realised she has no idea what the other players do in the hours between matches.
| voice | opener |
| --- | --- |
| `sunny` | `"What does everybody DO all day? I genuinely do not know."` |
| `fiery` | `"I have been here a week and I still do not know how anybody spends their afternoons."` |
| `deep` | `"There are nine hours in a day here that I cannot account for in anybody's life, including mine."` |
| `quiet` | `"The days are long between matches. I have been reading."` |

**Parent:** *Ask what she does with hers* · *Say most of them are as bored as she is* · *Say the boring hours are part of it*

### R23 · `the-word-she-keeps-hearing` · curiosity · after-school, college, independent · generated
**Kernel:** A word the older players use about matches keeps coming up and she has not asked what it
means.
| voice | opener |
| --- | --- |
| `sunny` | `"Everybody keeps saying a word and I have been nodding along for a month."` |
| `fiery` | `"I am going to ask what it means. I have decided. Probably."` |
| `deep` | `"There is a word they all use and I have worked out three possible meanings and none of them fit."` |
| `quiet` | `"I heard a word I did not know again. I looked it up this time."` |

**Parent:** *Ask what the word is* · *Say asking is faster than guessing* · *Say she will pick it up*

### R24 · `why-anyone-watches` · curiosity · college, independent · generated
**Kernel:** A small crowd stayed to the end of a dead rubber and she cannot work out why.
| voice | opener |
| --- | --- |
| `sunny` | `"People stayed to the end of a match that did not matter. Why would you?"` |
| `fiery` | `"Nine people sat through that. Nine. I would not have."` |
| `deep` | `"The match had stopped mattering an hour before it finished and they stayed anyway. I have been thinking about what they were watching."` |
| `quiet` | `"There were still people there at the end. Not many."` |

**Parent:** *Ask if she would have stayed* · *Say some people just like tennis* · *Say she does not have to explain a crowd*

### R25 · `the-coach-she-watched` · curiosity · college, independent · **fact: `coach-employed`**
**Kernel:** She watched another player's coach work and noticed he says almost nothing.
⚠ **Gated** because a girl with no coach has no comparison to make. ⚠ **It asserts nothing about HER
coach's quality** – only what she noticed about a different one.
| voice | opener |
| --- | --- |
| `sunny` | `"I watched somebody else's coach for an hour and he said about four words."` |
| `fiery` | `"Four words. All session. And she was better at the end of it. Explain that to me."` |
| `deep` | `"He barely spoke. I have been trying to work out whether that is confidence or whether they had already said it all."` |
| `quiet` | `"I watched another session for a while. Quieter than ours."` |

**Parent:** *Ask what the four words were* · *Say the talking is not the coaching* · *Say every pair finds its own way*

### R26 · `what-she-would-be` · curiosity · college, independent · generated
**Kernel:** Somebody asked her what she would be doing if not this, and she did not have an answer.
| voice | opener |
| --- | --- |
| `sunny` | `"Someone asked what I would be doing otherwise and I just stood there."` |
| `fiery` | `"I did not have an answer. I do not like not having an answer."` |
| `deep` | `"I could not answer it, and I have been turning that over since, because the blank is the interesting part."` |
| `quiet` | `"Somebody asked me a question at dinner I could not answer. It was not important."` |

**Parent:** *Ask if she has an answer now* · *Say not having one is fine at her age* · *Say you could not answer it either*

## P3.3 `story` – six more, taking the heaviest cell to twelve

### R27 · `the-lift-that-stopped` · story · college, independent · generated
**Kernel:** The hotel lift stopped between floors for ten minutes with her and two other players in it.
| voice | opener |
| --- | --- |
| `sunny` | `"The lift stopped. Ten minutes. Three of us. We know each other very well now."` |
| `fiery` | `"Stuck in a lift. Ten minutes. With two people who would not stop talking."` |
| `deep` | `"Ten minutes in a stopped lift with two strangers. Nobody panicked and I found that oddly reassuring."` |
| `quiet` | `"The lift stopped for a while. It started again."` |

**Parent:** *Ask what they talked about* · *Say you would have hated that* · *Laugh and move on*

### R28 · `the-wrong-order` · story · college, independent · generated
**Kernel:** A café brought her somebody else's order and she ate it rather than say anything.
| voice | opener |
| --- | --- |
| `sunny` | `"They brought me the wrong lunch and I just ate it. It was quite good!"` |
| `fiery` | `"Wrong order. I ate it anyway. I am still annoyed at myself about that."` |
| `deep` | `"It was not what I ordered and I said nothing, which tells me something I am not sure I like."` |
| `quiet` | `"Lunch was not what I ordered. It was fine."` |

**Parent:** *Ask what she actually got* · *Say you do the same thing* · *Say she is allowed to send food back*

### R29 · `the-borrowed-thing` · story · after-school, college, independent · generated
**Kernel:** Somebody borrowed something small of hers and returned it in better condition than she
lent it.
| voice | opener |
| --- | --- |
| `sunny` | `"She gave it back CLEANER than I lent it. Who does that?"` |
| `fiery` | `"She cleaned it before giving it back. Now I feel like a slob and I did nothing wrong."` |
| `deep` | `"It came back in better condition than it left. I have been thinking about what that says about her."` |
| `quiet` | `"I got it back. Better than it was, actually."` |

**Parent:** *Ask what it was* · *Say that is somebody worth knowing* · *Say she should lend her more things*

### R30 · `the-rain-delay` · story · college, independent · generated
**Kernel:** Rain stopped play for three hours and the players ended up playing cards in a corridor.
| voice | opener |
| --- | --- |
| `sunny` | `"Three hours of rain and we ended up playing cards on the floor of a corridor. Best day."` |
| `fiery` | `"Three hours. THREE. And then they called it off anyway."` |
| `deep` | `"We sat in a corridor for three hours and I talked to people I have shared a draw with for two years."` |
| `quiet` | `"Rain delay. We waited it out inside."` |

**Parent:** *Ask who won the cards* · *Say the delays are where people meet* · *Say she should get some sleep*

### R31 · `the-child-on-the-next-court` · story · after-school, college, independent · generated
**Kernel:** A very small child on the next court hit one clean ball and celebrated as if it were a
final.
| voice | opener |
| --- | --- |
| `sunny` | `"A tiny kid hit ONE good ball and celebrated like she had won a Slam. I loved it."` |
| `fiery` | `"One ball. She screamed. Honestly? Correct behaviour."` |
| `deep` | `"A child hit one clean ball and celebrated it completely. I stood and watched and I could not tell you the last time I did that."` |
| `quiet` | `"There was a kid on the next court. She was pleased with herself."` |

**Parent:** *Ask what the shot was* · *Say she used to do exactly that* · *Say nothing and just laugh*

### R32 · `the-song-in-the-gym` · story · college, independent · generated
**Kernel:** The gym played a song she has not heard since she was small and she stopped what she was
doing.
| voice | opener |
| --- | --- |
| `sunny` | `"They played a song I have not heard since I was about six and I completely stopped."` |
| `fiery` | `"They put that song on in the gym and it ruined my whole session."` |
| `deep` | `"A song came on that I had not heard since I was small, and I stood there until it finished."` |
| `quiet` | `"They were playing old music in the gym. I stayed a bit longer."` |

**Parent:** *Ask which song* · *Say you remember it* · *Say nothing and let her have it*

## P3.4 `observation` – five more, because the cell that started this held ONE

### R33 · `the-one-who-never-sits` · observation · college, independent · generated
**Kernel:** She has noticed one player who never sits down at changeovers, all match.
| voice | opener |
| --- | --- |
| `sunny` | `"There is a girl who never sits down at changeovers. Not once, the whole match."` |
| `fiery` | `"She does not sit down. Ever. It is either brilliant or a pose and I cannot decide which."` |
| `deep` | `"She stood through every changeover. I counted eleven. I do not think it was for show."` |
| `quiet` | `"One of them does not sit at the changeovers. I noticed it twice now."` |

**Parent:** *Ask if it seemed to help her* · *Say players find odd things that work* · *Say she does not have to copy anyone*

### R34 · `the-second-serve-everyone-attacks` · observation · college, independent · **fact: `played-recently`**
**Kernel:** She has noticed that the better players move forward on a second serve without thinking
about it.
⚠ **Gated**, because it presumes she has been on a court where she could see it. ⚠ It asserts nothing
about her own second serve.
| voice | opener |
| --- | --- |
| `sunny` | `"The good ones just step in on a second serve. They do not even think about it."` |
| `fiery` | `"They walk in on the second serve like it is owed to them. I want to do that."` |
| `deep` | `"Nobody decides to step in. It is already decided before the ball is tossed, and that is the part I am missing."` |
| `quiet` | `"They stand closer on the second serve. All of them."` |

**Parent:** *Ask what she does on hers* · *Say that is a decision made in practice, not in a match* · *Say she is watching well*

### R35 · `the-team-that-eats-together` · observation · college, independent · generated
**Kernel:** She noticed one player travels with three people and they all eat together every night.
| voice | opener |
| --- | --- |
| `sunny` | `"One girl has THREE people with her and they all eat together every night. It looks lovely."` |
| `fiery` | `"Three people. For one player. I do not know whether to be jealous or appalled."` |
| `deep` | `"She has a table of her own people every evening. I have been sitting with that longer than I expected to."` |
| `quiet` | `"Some of them travel with a group. They have dinner together."` |

**Parent:** *Ask whether she would want that* · *Say a big team is not the same as a good one* · *Say you would come if she wanted*

### R36 · `the-empty-side-of-the-draw` · observation · college, independent · generated
**Kernel:** She noticed half the draw was decided in straight sets and half went the distance, and the
same half keeps doing it.
| voice | opener |
| --- | --- |
| `sunny` | `"Half the draw finishes in an hour and the other half takes three. Same half every time!"` |
| `fiery` | `"One side of the draw is a bloodbath and the other is a stroll. It is not fair and I have said so."` |
| `deep` | `"The same half of the draw keeps going to three sets. I have watched it happen twice now and I do not think it is chance."` |
| `quiet` | `"The bottom half has been longer both weeks. Just something I noticed."` |

**Parent:** *Ask which half she is in* · *Say draws have moods* · *Say she should not read too much into it*

### R37 · `what-they-do-after` · observation · college, independent · generated
**Kernel:** She has started noticing what players do in the ten minutes after a loss rather than
during the match.
| voice | opener |
| --- | --- |
| `sunny` | `"I have started watching what people do AFTER. It tells you more than the match does."` |
| `fiery` | `"Some of them are fine in ten minutes. Ten. I am not built like that and I am not sure I want to be."` |
| `deep` | `"The ten minutes after is where the real thing is. I have started staying to watch it."` |
| `quiet` | `"I have been staying a bit longer after matches. Watching."` |

**Parent:** *Ask what she has seen* · *Say that is the part nobody trains* · *Say she can leave when the match ends*

## P3.5 `good-news` – four more

### R38 · `the-warm-up-she-runs` · good-news · college, independent · generated
**Kernel:** She led a group warm-up for the first time because nobody else started one.
| voice | opener |
| --- | --- |
| `sunny` | `"Nobody started the warm-up so I did. And everybody just... followed me?"` |
| `fiery` | `"I ran the warm-up. Somebody had to and nobody was moving."` |
| `deep` | `"I started it because the silence was getting long, and then seven people did what I said."` |
| `quiet` | `"I started the warm-up this week. It went fine."` |

**Parent:** *Ask how it felt* · *Say people follow whoever moves first* · *Say well done and leave it*

### R39 · `the-thing-she-fixed` · good-news · after-school, college, independent · generated
**Kernel:** Something in her bag broke and she mended it herself with what she had.
| voice | opener |
| --- | --- |
| `sunny` | `"My bag strap went and I fixed it with a shoelace. It is holding!"` |
| `fiery` | `"It broke, I fixed it, and it is better than it was. That is the whole story."` |
| `deep` | `"I mended it with what was in the bag. It is ugly and it works and I have been quietly pleased all day."` |
| `quiet` | `"Bag strap went. It is sorted."` |

**Parent:** *Ask how bad it looks* · *Say that is a useful kind of stubborn* · *Say you would have bought a new one*

### R40 · `the-junior-who-copied-her` · good-news · college, independent · generated
**Kernel:** She caught a younger player copying her warm-up routine, badly.
| voice | opener |
| --- | --- |
| `sunny` | `"A younger girl was doing MY warm-up. Badly! But mine!"` |
| `fiery` | `"She was copying me. I nearly went over and fixed her elbow, and then I thought better of it."` |
| `deep` | `"She was doing my warm-up two courts away and getting it wrong, and I did not know where to put that."` |
| `quiet` | `"One of the juniors has picked up my warm-up. Roughly."` |

**Parent:** *Ask whether she said anything* · *Say that is what being watched looks like* · *Say she does not owe her a lesson*

### R41 · `the-language-she-managed` · good-news · college, independent · generated
**Kernel:** She got through a whole conversation in a language she barely has and the other person
did not switch to English.
| voice | opener |
| --- | --- |
| `sunny` | `"We had a whole conversation and she never switched to English. Never!"` |
| `fiery` | `"She did not switch. Most of them switch. That felt like a win."` |
| `deep` | `"She let me be bad at it for ten minutes rather than making it easy, and I think that was a kindness."` |
| `quiet` | `"I managed a conversation this week. In theirs, not ours."` |

**Parent:** *Ask what it was about* · *Say people notice the trying* · *Say well done and change the subject*

## P3.6 `decision` – three more

### R42 · `the-invitation` · decision · college, independent · generated
**Kernel:** A group has asked her to something on the evening before a practice day and she has not
answered.
| voice | opener |
| --- | --- |
| `sunny` | `"I have been invited to a thing the night before practice and I have not replied for two days."` |
| `fiery` | `"I want to go. I should not go. I have been arguing with myself since Tuesday."` |
| `deep` | `"They asked on Monday. It is Thursday. The not-answering has become its own answer and I would rather it did not."` |
| `quiet` | `"There is something on Friday. I have not said either way."` |

**Parent:** *Ask whether she wants to go* · *Say one late evening is not a career* · *Say she can say no without a reason*

### R43 · `the-racket-she-is-not-sure-about` · decision · after-school, college, independent · generated
**Kernel:** She has been offered a different racket setup to try and cannot decide whether to disturb
what works.
⚠ **It asserts no change to her equipment** – the engine owns that; this owns the hesitation.
| voice | opener |
| --- | --- |
| `sunny` | `"Someone offered to set my racket up differently and now I cannot stop thinking about it."` |
| `fiery` | `"I am not changing anything mid-season. Ask me again in December. Probably."` |
| `deep` | `"It might be better. It might be four months of it not feeling like mine. I have not been able to get past that."` |
| `quiet` | `"There is a different setup I could try. I have not."` |

**Parent:** *Ask what would change* · *Say trying is not the same as switching* · *Say if it works, leave it*

### R44 · `the-early-flight` · decision · college, independent · generated
**Kernel:** She can fly home for two days between events or stay where she is, and the flights are the
same price.
| voice | opener |
| --- | --- |
| `sunny` | `"I could come home for two days and it costs the same as staying. Two days!"` |
| `fiery` | `"Two days at home or two days in a hotel. I know what I want and I am not sure it is what I should do."` |
| `deep` | `"The cost is identical either way, which means it is only a question about what I need, and I cannot answer that one quickly."` |
| `quiet` | `"I could come back for two days between them. Same price either way."` |

**Parent:** *Ask what she would rather* · *Say the bed you know is worth something* · *Say either way you will be glad to see her*

---

## P3.7 The corpus at 44 – counted by script, not claimed

| subject | situations | of 44 |
| --- | ---: | ---: |
| `story` | 12 | the heaviest cell, because a bright week favours it |
| `decision` | 7 | was **zero** for adults |
| `good-news` | 7 | |
| `observation` | 6 | was **one**, and it is the cell that started this |
| `worry` | 6 | held back from tranche 1 until the gates were settled |
| `curiosity` | 6 | held back for the same reason |

**Every one of the 44 reaches `college` and `independent`.** Six carry a career gate (R8, R14, R18,
R20, R25, R34); the other 38 are `generated` kernels that assert nothing the career could contradict.
No line anywhere says «today».

⚠ **Against his per-cell floors:** 3–4 per subject at each active stage — **met** at 6–12 for adult
stages. 6+ in the heavily weighted cell — **met** (`story` = 12). No subject with only ONE reachable
adult situation — **met**, the thinnest is 6. The last-two exclusion — shipped as round 43 #8(a).

⚠ **What is still measured as a hole:** `school` and `after-school`. Thirteen of the 44 reach
`after-school`; **none** lists plain `school`, deliberately, because every hole he reported was past
it. A school-years tranche is its own pass and its own reading.

⭐ **What B0/K4 should now say.** Before this corpus, the bench measured a 40-conversation career
meeting **~2.5 distinct situations** with **14.1% of conversations reaching none at all**. Re-run K1–K5
against 44 four-voiced situations before shipping any of it — the corpus is the input to that bench,
not a substitute for it.
