---
type: spec
status: draft
area: narrative-and-copy
canonical: false
last-reviewed: 2026-09-17
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

## 3. ⚠⚠ The target, and the measure this section used to give is WITHDRAWN

This section used to hold a table converting «situations written» into «reachable per career», one for
one. **His 17.09 review struck it and he is right:** six situations carry career gates, so they are
not simultaneously reachable, and a given career may never satisfy all of them. A single number
cannot say what a career meets.

⭐ **The honest quantities are the ones the bench already produces** – K1's weighted effective pool
per (voice × stage × register) and K4's distinct situations actually encountered over a career.
**Nothing in this document may quote a reachability figure the bench has not produced.**

⚠ What survives from the struck table is only the DIRECTION, and it needs no number to be true: a
voice-locked catalogue reaches one girl in four, and a four-voiced one reaches every girl. That is
the reason for the restructure; the size of the win is K1's to report.

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

# ⚠⚠ WHAT THIS DOCUMENT IS, AFTER HIS SECOND REVIEW (17.09) AND THE REPLIES PASS

**It was a corpus of OPENER KERNELS, and calling it an exchange corpus was the first finding of his
review.** It is now an exchange corpus, because he accepted the kernels on 17.09 – «ядра принимаю,
пиши ответы». The arithmetic, re-derived by script from this file rather than carried forward:

| written | count |
| --- | ---: |
| daughter openers (43 × 4 voices) | **172** |
| parent option labels (43 × 3) | **129** |
| daughter replies (43 × 4 voices × 3 stances) | **516** |

⚠⚠ **THAT TABLE IS THE REPLIES PASS'S OWN ARITHMETIC AND IT IS STILL TRUE OF THE 43. IT IS NO LONGER
THE WHOLE DOCUMENT.** Round 44 moved the EIGHT situations that shipped before this file existed into
it (`R45`–`R52`, the section above PASS 2) and brought them to four voices each, so the totals a
script derives from this file are now:

| the whole document, since round 44 | count |
| --- | ---: |
| situations (43 + the eight that shipped first) | **51** |
| daughter openers (51 × 4 voices) | **204** |
| parent option labels (51 × 3) | **153** |
| daughter replies (51 × 4 voices × 3 stances) | **612** |
| ⭐ shared second beats (`court-four` alone, the one two-beat row) | **4** |

⚠ Both tables are derived by `tools/small-talk-corpus-parse.ts` on every read, per §3a's rule, and
`tests/round44-corpus-roundtrip.test.ts` asserts the five figures before it compares a single string –
the anti-vacuity half, because a comparison of two empty lists passes.

⭐ **The replies waited on his instruction – «Replies should not be written until the factual and
voice problems below are resolved» – and that instruction paid.** Three kernels were replaced and
four repaired between the first draft and his acceptance; every one of them would have taken twelve
replies down with it.

## ⭐⭐ THE LAYOUT THE REPLIES TAKE, and why this one

Each situation keeps the opener table exactly as he ruled it («форма строк верна»), and the replies
go **underneath, in three blocks – one per parent stance**, each headed by that stance's own label:

    **invite** · *Ask who else was standing there*
    - `sunny`  "…"
    - `fiery`  "…"
    - `deep`   "…"
    - `quiet`  "…"

**Three reasons, and the first is the one that decided it.** ⭐ The reply sits directly under the
sentence it answers, so «does this answer THAT stance?» is a four-line read rather than a hunt back
up a column header – and that question is the one his review keeps having to ask. ⚠ The other two
gates read the same way: the four voices are ADJACENT inside a block, so «same event, four ways» and
«no voice contradicts another's edition» are both read down four consecutive lines. And one reply per
line keeps a diff readable; a fourth and fifth table column would have made a 450-character row that
nobody can review in a diff.

⚠ **The block header is not retyped.** It is read out of the row's own `**Parent:**` line by the
injector, in order, so a label and its replies cannot drift apart – the failure §8d.1 of the exchange
spec is named for. A script re-asserts the match on every read.

⚠ **43, not 44.** `R26` was withdrawn on his verdict – it re-opened the foundational-agency beat
§P2.5 had already moved `why-tennis` out of small talk for. Padding back to a round number would be
worse than being one short; the target was always the per-cell floor, never the headline.

## ⭐⭐ The quotation is the SPOKEN PAYLOAD, and the frame is a separate layer

His review asked for `roof:` / `away:` frames on every row. **The engine already answers this and the
answer is better than per-row frames:** `PresenceCell` in `world/lifeBeat.ts` carries `roof` and an
optional `away`, and its own note says presence changes «the scene the parent is standing in – never
the sentence she says inside the quotation marks». §D of its pin file **extracts both spans and
asserts they are identical**, which makes it a property rather than a convention.

⭐ So a situation owes ONE spoken line per voice – which is what this document holds – and the
delivery frame is drawn from a **deterministic frame pool** keyed on presence. That pool is owed and
is not in this document; it is named here so the gap is visible rather than assumed away.

## ⚠ «44 reachable per career» was the wrong measure and is withdrawn

Seven situations name career gates, so they are not simultaneously reachable and a given career may
never satisfy all of them. The honest quantities are the ones the bench already reports: the
**weighted effective pool** per (voice × stage × register) and the **distinct situations actually
encountered** over a career. K1 and K4 are those numbers; nothing in this document may quote a
reachability figure the bench has not produced.

---

# THE EIGHT THAT SHIPPED BEFORE THIS DOCUMENT – brought into it, and brought up to four voices

**Round 44, on his 17.09 ruling about the old catalogue:** «надо их причесать, актуализировать,
дописать и использовать, я считаю. Больше вариативности – хорошо. И добрый ситуативный юмор
приветствуется.»

These eight are the situations the game has actually been running since wave 2. They were written
into `SMALL_TALK_SHIPPED` in `src/engine/world/lifeBeat.ts` by hand while the 43 above were generated
out of this file, so the catalogue had **two sources of truth in two formats** – and «fixed in the
code, the document drifted» was one careless edit away the whole time. `SMALL_TALK_SHIPPED` is
deleted; these are rows of this document like every other row, and the round-trip pin
(`tests/round44-corpus-roundtrip.test.ts`) now covers all **51** instead of 43.

⚠⚠ **THEIR IDS DID NOT CHANGE AND MAY NOT.** A situation id is PERSISTED into `lifeLog` as half of
the row's `detail` and is read back by the album, so renaming one orphans an old career's record of a
conversation that really happened. `practice-clicked` · `line-call` · `march-entry` · `coach-real` ·
`watching-players` · `court-four` · `new-place` · `beat-her-conqueror`, verbatim.

⚠⚠ **AND THEY SIT FIRST WHILE THEIR REF NUMBERS RUN LAST, WHICH IS DELIBERATE.** A ref (`R45`…) is an
allocation name; the ORDER of this file is a live career's situation draw, because the situation is
picked with `pickInt` over the filtered pool and `pickInt` reads position. Putting them where they
already were keeps that draw where it already was. Renumbering `R1`–`R44` so the two agree would move
every shipped career's conversations to buy tidiness, and his review names rows by number.

⭐ **WHAT MOVED WITH THEM: THE RULINGS THEIR BANNER COMMENTS CARRIED.** Each row below repeats the
one that governs it, because a ruling deleted in a refactor is a ruling nobody can obey. The fog law
they all sit under, from `lifeBeat.ts`' own §8d.5 preamble: **a practice that felt easy is a MOOD,
never a training gain; a name mentioned is a name, never a relationship the rest of the engine has to
honour.**

⚠⚠ **THE TWENTY-ONE NEW VOICE-ENTRIES ARE DRAFTS, EVERY ONE.** `court-four` already had four voices;
the other seven had one each, so seven openers and sixty-three replies were written for this round.
They are marked **NEW** in each table and each block. The lines marked **HIS** are his own copy,
carried character for character out of the deleted array – invariant 4, and the reason this move is a
transcription rather than a rewrite.

⭐ **«Добрый ситуативный юмор приветствуется» is his, 17.09, and it lives INSIDE the quotation marks**
where the voice carries it. Never in a frame: one frame wraps all 51 situations including the
worries, which is his own rule from the frame pool's rejected list.

⚠ **THREE OF THE EIGHT CARRY «today», WHICH THE 43 DO NOT.** Gate 4 («no stale today») was written
after these shipped and they are his sentences, so they are left exactly as they are and the
exception is recorded here rather than edited away. The new voices of those three rows follow the
row's own register rather than the 43's, for the reason §4 gives: four voices must publish ONE
edition of the same evening.

### R45 · `practice-clicked` · good-news · school, after-school, college, independent · generated
**Kernel:** A practice finally felt easy. Nothing she can name changed; she stopped fighting it.
**Authoritative claims:** none. **Texture allowed:** the session, the ordinary feeling.
⭐ **HIS RULING, CARRIED FROM THE DELETED BANNER:** this row is the fog law's own example – **a
practice that felt easy is a MOOD, never a training gain.** No voice here may say she improved.
⚠ `deep` is **HIS** (spec §8a, the one entry the spec gave both frames for). The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"Practice was easy today. Properly easy. I've no idea why and I don't want to jinx it."` |
| `fiery` | `"Practice was easy today and I'd like to know who to thank, because it wasn't me."` |
| `deep` | `"Practice finally felt easy today."` |
| `quiet` | `"Practice was easy today. I thought I'd mention it."` |

**Parent:** *Ask what made it good* · *Tell her we're glad* · *Let her enjoy it*

**invite** · *Ask what made it good*
- `sunny` `"Nothing! That's the best part. It just went, and I'm not going to interrogate it."`
- `fiery` `"Nothing changed. Same drills, same court, and this time it felt easy. I'd like to know why."`
- `deep` `"Nothing I can name. I just stopped fighting it. I wanted to tell someone who'd know that's rare."`
- `quiet` `"Nothing in particular. It just felt easier than usual."`

**respond** · *Tell her we're glad*
- `sunny` `"I knew you would be. I wanted to say it before it wore off."`
- `fiery` `"Good. Somebody should be, because tomorrow it'll probably be awful again."`
- `deep` `"Maybe it doesn't sound like much. It felt like a lot."`
- `quiet` `"Thanks. It was a good one."`

**space** · *Let her enjoy it*
- `sunny` `"Don't worry. I'm keeping this one for a rainy day."`
- `fiery` `"I intend to. And I'm writing down what I did, in case."`
- `deep` `"I will. I only wanted to say it out loud once."`
- `quiet` `"I will. It'll do for the week."`

### R46 · `line-call` · worry · school, after-school · **fact: `played-recently`**
**Kernel:** A call in a match went against her and she cannot put it down.
⚠ **Gated**, because she has to have been on a court. The gate licenses that she played – **not that
she lost, and not when.**
⚠⚠ **HIS RULING, CARRIED FROM THE DELETED BANNER, AND IT IS A COLLISION LEFT STANDING.** This row's
`respond` label «Tell her what worries us» is one of the three generic forms §8d.1 of the exchange
spec names as defective – the label promises a view and her reply answers an opinion the player never
heard. His 15.09 revision rewrote the other two situations and not this one, **so the sentence
standing here is his most recent word on it and it is NOT edited** (invariant 4). The collision is
pinned by name in `tests/round42-small-talk-exchange.test.ts` §G; the day he rules, that list goes
empty and the case becomes the flat law.
⚠ `fiery` is **HIS** (spec §8b, his 14.09 pass). The other three are NEW, and all four answer the
same unheard-view label, which is the collision arriving in four voices instead of one.

| voice | opener |
| --- | --- |
| `sunny` | `"There was a call today that was wrong and I can't seem to put it down."` |
| `fiery` | `"There was a call today that was just wrong."` |
| `deep` | `"One call today was wrong, and I have replayed it more than anything else that happened."` |
| `quiet` | `"There was a call today I didn't agree with. It's still there."` |

**Parent:** *Let her keep going* · *Tell her what worries us* · *Say she needn't solve it tonight*

**invite** · *Let her keep going*
- `sunny` `"It was in. I saw it. Everyone near it saw it. And that's that, apparently."`
- `fiery` `"And I know I'm supposed to move on. I replayed it the whole way home instead."`
- `deep` `"I keep going back to the same second of it. Not the point. The second."`
- `quiet` `"It was in. I've stopped saying so out loud."`

**respond** · *Tell her what worries us*
- `sunny` `"That's fair. I don't want to be the one who's still on about it next week."`
- `fiery` `"I hear you. I don't want it in my head for the next one either."`
- `deep` `"You're right, and knowing you're right is not the same as being able to stop."`
- `quiet` `"I know. I'll put it down before the next one."`

**space** · *Say she needn't solve it tonight*
- `sunny` `"Good. I'll be annoyed about it in the morning instead."`
- `fiery` `"Yeah. Okay. Tomorrow."`
- `deep` `"No. I'd only take it apart again and find the same thing in it."`
- `quiet` `"All right. I'll leave it where it is."`

### R47 · `march-entry` · decision · school, after-school · **fact: `march-entry-open`**
**Kernel:** A tournament in March is open, she has not entered, and she is turning it over.
⚠ **Gated.** The gate licenses that an entry is open and there is time to decide – **not what it
costs.** No voice here names a price or a fare.
⭐ **HIS RULING, CARRIED FROM THE DELETED BANNER:** the `respond` label is his 15.09 revision and it
is the form §8d.1 asked for – «Say the travelling matters too» names the parent's actual position
instead of gesturing at an unheard one.
⚠ `quiet` is **HIS**. The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"I'm not sure about the March tournament. Can we talk about it now, before I forget?"` |
| `fiery` | `"I don't think I want to do the March tournament. Ask me again in an hour, obviously."` |
| `deep` | `"I've been turning the March tournament over and I still cannot get to an answer."` |
| `quiet` | `"I'm not sure about the March tournament."` |

**Parent:** *Ask what she's weighing* · *Say the travelling matters too* · *Say there's time to decide*

**invite** · *Ask what she's weighing*
- `sunny` `"The travelling, mostly. And whether I'd rather be at training. It's not more complicated than that."`
- `fiery` `"The trip. The training I'd miss. And everybody asking me what I've decided."`
- `deep` `"The trip against the training, and the part where I don't know which answer I'd regret."`
- `quiet` `"It's a long trip. I'd miss Tuesday training. I'm not sure it's worth it."`

**respond** · *Say the travelling matters too*
- `sunny` `"That helps, actually. I was only counting what I'd lose by going."`
- `fiery` `"Fine. Then it's the travelling against the training and I still have to pick one."`
- `deep` `"I hadn't put it on that side of the list. It changes the shape of it."`
- `quiet` `"That's the bit I keep coming back to."`

**space** · *Say there's time to decide*
- `sunny` `"There is. I'll stop bringing it up at dinner, I promise."`
- `fiery` `"There's time. I'd rather decide now and be wrong than carry it about."`
- `deep` `"There is. I'm not sure more time makes it a different question."`
- `quiet` `"I'll look at it again on Sunday."`

### R48 · `coach-real` · curiosity · school, after-school · **fact: `coach-employed`**
**Kernel:** She has started wondering how anyone tells a good coach from a kind one.
⚠ **Gated.** The gate licenses that she HAS a coach – **nothing about that coach's quality, and no
coaching outcome.** The row is her question, never an answer to it.
⚠⚠ **AND NOT ONE LINE HERE CARRIES A MASCULINE PRONOUN.** `tests/coach-voice.test.ts` forbids one
anywhere a player can read it, and the single exception in the whole game is `court-four`'s invented
dad. Her coach's sex is real in the save (`ECONOMY.coach.roster` carries a `gender` per slot) and
this row never names it, so the neutral singular is not squeamishness – it is the only form that
cannot contradict the career.
⚠ `sunny` is **HIS** 15.09 revision. The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"How do you know when you've got a real coach and not just a nice one?"` |
| `fiery` | `"I want to know whether my coach is actually good, and nobody will give me a straight answer."` |
| `deep` | `"I've been working out the difference between a coach who is kind and one who is good."` |
| `quiet` | `"How does anyone tell a good coach from a nice one?"` |

**Parent:** *Ask what made her wonder* · *Say a good coach explains what they're changing* · *Say she doesn't have to work it out now*

**invite** · *Ask what made her wonder*
- `sunny` `"Mine's lovely. Everyone's lovely. I can't tell if that's the same as good."`
- `fiery` `"Everybody's nice. Nice is easy. I'd like to know what I'm actually being taught."`
- `deep` `"Nothing happened. I noticed I have no way of telling, and that bothered me."`
- `quiet` `"No reason. It came up and stayed."`

**respond** · *Say a good coach explains what they're changing*
- `sunny` `"Okay. I'll ask why next time, not just what."`
- `fiery` `"Right. Then I'm asking why on Tuesday and I'm not letting it go."`
- `deep` `"That's something I can actually check. I hadn't thought of it as checkable."`
- `quiet` `"That's useful. I'll listen for it."`

**space** · *Say she doesn't have to work it out now*
- `sunny` `"All right. I'll go back to enjoying the nice one for a bit."`
- `fiery` `"Fine. But I'm coming back to this one."`
- `deep` `"No. I'd still like to know, and I think I'll keep asking myself."`
- `quiet` `"No. I'll see what happens at the next session."`
### R49 · `watching-players` · observation · college, independent · generated
**Kernel:** The players she has been watching hardly ever talk about winning. They talk about what
they are working on next.
**Authoritative claims:** none – it is what she has noticed, and no other player's result is named.
⭐ **HIS RULING, CARRIED FROM THE DELETED BANNER:** the hedge in `deep`'s `respond` stays – «an adult
capable of questioning her interpretation feels more human than one who always speaks in
certainties». ⚠ `sunny` and `quiet` carry a hedge of their own for the same reason; `fiery` does NOT,
and that is her temperament rather than an oversight – «the verdict arrives before the explanation,
and she does not let go of it». A row where all four hedge would be one girl told four times.
⚠ **A CALL**, so the away stages only: this is the row he reported the repeat on (round 43 #8).
⚠ `deep` is **HIS** 15.09 revision. The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"The players I've been watching hardly mention winning. I keep waiting for it and it never comes."` |
| `fiery` | `"Nobody I've been watching talks about winning. Not one of them. I find that genuinely annoying."` |
| `deep` | `"The players I've been watching barely talk about winning."` |
| `quiet` | `"The players I've been watching talk about other things. Not winning."` |

**Parent:** *Ask her to go on* · *Say we've noticed it too* · *Let the thought settle*

**invite** · *Ask her to go on*
- `sunny` `"They talk about what they're working on. Never the result. It's so odd once you hear it."`
- `fiery` `"They talk about drills. Drills! Not one of them mentions the scoreboard."`
- `deep` `"They talk about Tuesday. What they're working on next. I've started noticing that."`
- `quiet` `"Mostly what's next. What they're fixing. That sort of thing."`

**respond** · *Say we've noticed it too*
- `sunny` `"Have you? Good. I'd started to think I was inventing the whole thing."`
- `fiery` `"Then why does nobody say it out loud? Everyone acts like the score is the point."`
- `deep` `"You have? I thought I might be reading too much into it."`
- `quiet` `"You have? I wasn't sure it was a real thing."`

**space** · *Let the thought settle*
- `sunny` `"I will. I'll probably still be watching for it next week."`
- `fiery` `"It's settled. I've decided they're right and everyone else has it backwards."`
- `deep` `"Mm. I'll keep watching."`
- `quiet` `"All right. I'll keep an eye on it."`

### R50 · `court-four` · story · school, after-school · generated
**Kernel:** A serve clipped the net cord and landed in a spectator's full cup of coffee. He put the
lid back on. She had to serve next, and nobody went to fetch the ball.
**Authoritative claims:** none – the dad exists only inside the sentence and nothing else in the
engine reads him.
⭐⭐ **HIS TEST IS WHAT THIS ROW IS FOR, AND THE BANNER SAID SO:** §8d.3 – «Same event, same facts,
same age, same parental choice – four different ways of noticing, disclosing and responding.» That
test could not be built out of the spec's eight, because no two of them shared an event, so ONE event
was written across all four voices and it is the DOMESTIC one (no career fact behind it) **so the
test can pose a bare world.** ⭐ And «not one shared phrase» is NOT the target: his own note says real
people all say «Okay».
⚠⚠ **THE FACTS ARE DELIBERATELY IDENTICAL IN ALL FOUR** – the net cord, the coffee, the full cup, the
dad putting the lid back on, her having to serve next, nobody fetching the ball. §8d.5's stable
invented detail, and the only axis left free is the voice.
⚠⚠ **THE ONE MASCULINE EXCEPTION IN THE WHOLE GAME LIVES HERE**, counted and pinned at ten literals
across seven distinct sentences (`tests/coach-voice.test.ts`). A fifth voice column of this story, or
one new masculine sentence in it, reddens that file on purpose – the exception is argued each time,
never inherited.
⚠ **A `story` IS TWO BEATS**, which is why this is the one row in the document with a `**shared**`
block: the incident is heard by every route before its own branch, and the branch is the aftermath.
⚠ `fiery` is **HIS**; `sunny`, `quiet` and `deep` were drafted for the voice test and are carried
here character for character.

| voice | opener |
| --- | --- |
| `sunny` | `"You have to hear what happened on court four."` |
| `fiery` | `"You won't believe what happened on court four."` |
| `deep` | `"The best thing today had nothing to do with tennis."` |
| `quiet` | `"Something happened on court four today."` |

**shared**
- `sunny` `"Someone's serve clipped the net cord and went straight into a dad's coffee. A full one. He just sat there holding it."`
- `fiery` `"She serves, the ball catches the net cord – and lands in a dad's coffee. Full cup. He just looked at it."`
- `deep` `"A serve clipped the net cord and went into a dad's coffee. Full cup. He looked at it for a long time."`
- `quiet` `"A serve caught the net cord and landed in someone's dad's coffee. A whole cup of it."`

**Parent:** *Ask what he did* · *Laugh with her* · *Let her finish*

**invite** · *Ask what he did*
- `sunny` `"Put the lid back on. Very carefully. Like the lid was the problem."`
- `fiery` `"Took the ball out. Put the lid on. Like that would stop the next one."`
- `deep` `"Put the lid back on. I think he wanted the morning back and the lid was the nearest thing."`
- `quiet` `"He put the lid back on. Then he moved his chair. That was all."`

**respond** · *Laugh with her*
- `sunny` `"I know! And I had to serve after that. I was still going."`
- `fiery` `"Exactly! And then I had to serve. I couldn't look at him."`
- `deep` `"I didn't laugh then. I had to serve next. I have been laughing about it since."`
- `quiet` `"It was quite funny. I didn't laugh at the time. I had to serve."`

**space** · *Let her finish*
- `sunny` `"Anyway. Nobody asked for the ball back. That's my favourite part."`
- `fiery` `"Anyway, nobody wanted the ball back. That's the important part."`
- `deep` `"That's the whole of it. The ball is probably still there."`
- `quiet` `"That's it, really. Nobody went to get the ball."`

### R51 · `new-place` · worry · college, independent · generated
**Kernel:** She has moved somewhere new and does not much like it. It is clean and it is fine and she
has been eating standing up.
**Authoritative claims:** none – **the STAGE is the fact.** A girl who has not moved out has no new
place, which is why this row lists the two away stages and nothing else.
⭐ **HIS RULING, CARRIED FROM THE DELETED BANNER, AND HIS OWN VERDICT ON THE SET:** «the best scene».
The `respond` branch ASKS something real instead of gesturing at an unheard opinion – §8d.1's fix, in
his words.
⚠ **AND ONE SENTENCE OF HIS LEFT THIS ROW IN ROUND 44 WITHOUT BEING EDITED.** «A pause on the line,
longer than the others.» was its per-row LEAD-IN, and per-row lead-ins no longer exist: the frame is
drawn from `SMALL_TALK_FRAMES` now, because one scene wraps all 51 situations. It was the one
exception to the rule that a narration names her, so its disappearance is recorded rather than
assumed. The quotation it used to wrap is carried whole.
⚠ `quiet` is **HIS**. The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"I don't think I like the new place much. There, I've said it out loud."` |
| `fiery` | `"I don't like the new place. I've been trying to and I've stopped trying."` |
| `deep` | `"I've worked out that I don't like the new place. It took me a week to notice."` |
| `quiet` | `"I don't think I like the new place much."` |

**Parent:** *Let her keep going* · *Ask whether she's been eating properly* · *Say she needn't solve it tonight*

**invite** · *Let her keep going*
- `sunny` `"It's fine! It's clean, it's warm, and I've not once sat down to eat in it."`
- `fiery` `"It's clean. It's fine. And I've eaten standing up every night I've been here."`
- `deep` `"Nothing is wrong with it. I have been eating standing up and calling that settling in."`
- `quiet` `"It's fine. It's clean. I've been eating standing up for a week. I only noticed tonight."`

**respond** · *Ask whether she's been eating properly*
- `sunny` `"I have! Just never sitting down. I'm starting to think the flat has no chairs."`
- `fiery` `"I've been eating. Standing at a counter like a horse, but eating."`
- `deep` `"I have. It turns out that where you eat counts for more than I expected."`
- `quiet` `"I have. Just not sitting down, apparently."`

**space** · *Say she needn't solve it tonight*
- `sunny` `"I know. I'll like it better once there's something of mine in it."`
- `fiery` `"I'm not solving it tonight. I'm not pretending it's lovely either."`
- `deep` `"No. I'd rather sit with not liking it than talk myself out of it."`
- `quiet` `"Good. Tomorrow, then. Not tonight."`

### R52 · `beat-her-conqueror` · good-news · school, after-school · **fact: `beat-her-conqueror`**
**Kernel:** She beat an opponent who had beaten her four times and never lost to her.
⚠⚠ **THE STRICTEST GATE IN THE CATALOGUE, AND BOTH HALVES OF HER CLAIM ARE CHECKED AGAINST THE FEED.**
A win inside the window, against an opponent with exactly FOUR previous wins over her and no losses.
`=== 4` and not `>= 4`, because **she says the number out loud**: at five it is her miscounting, and
the spec's own line is «she may interpret an outcome however she likes; she may not invent the
outcome». So «four» is licensed here and nowhere else in the document.
⭐ **HIS NOTE ON TEMPERAMENT RIDES ON THIS ROW, CARRIED FROM THE DELETED BANNER:** the single «Four!»
does not make her `fiery` – **«temperament shapes the pattern, not the punctuation»**. That is the
whole reason a `sunny` girl may shout a number here and still be `sunny`.
⚠ `sunny` is **HIS**. The other three are NEW.

| voice | opener |
| --- | --- |
| `sunny` | `"I beat someone I've never beaten."` |
| `fiery` | `"I beat her. I have never beaten her and today I beat her."` |
| `deep` | `"I beat someone who has always beaten me, and I am still working out how I feel."` |
| `quiet` | `"I won today. Against someone I've never won against."` |

**Parent:** *Ask what made it good* · *Tell her we're glad* · *Let her enjoy it*

**invite** · *Ask what made it good*
- `sunny` `"She's beaten me four times. Four! Today I got nervous – and kept playing."`
- `fiery` `"Four times she's beaten me. Four. I was nervous the whole way and it didn't matter."`
- `deep` `"She has beaten me four times. The good part was noticing the nerves and going anyway."`
- `quiet` `"She'd beaten me four times before. I didn't stop this time."`

**respond** · *Tell her we're glad*
- `sunny` `"I can tell. You're doing the face."`
- `fiery` `"You should be! I'm going to be glad about this for a week."`
- `deep` `"I know. I wanted to say it to someone who knew how many times it was."`
- `quiet` `"Thanks. I'm still a bit surprised, honestly."`

**space** · *Let her enjoy it*
- `sunny` `"Oh, I'm going to. All evening."`
- `fiery` `"I am enjoying it. I'll enjoy it again tomorrow, and probably on Friday."`
- `deep` `"I will. I'd like to keep this one somewhere I can find it again."`
- `quiet` `"I will. It's a nice thing to take upstairs."`

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
| `deep` | `"I stood holding a kettle switch for four minutes. Someone came in and did the same. Neither of us said a word."` |
| `quiet` | `"The kettle in the room needs holding down. Takes about four minutes. Someone else came in and waited as well."` |

**Parent:** *Ask who else was standing there* · *Say you'd have given up at two minutes* · *Laugh and let it go*

**invite** · *Ask who else was standing there*
- `sunny` `"I've no idea who she was. We just stood there like two people waiting for a bus."`
- `fiery` `"No idea who she was. She didn't speak, I didn't speak, and we stood there anyway."`
- `deep` `"I don't know her name. I've thought about that more than I've thought about the kettle."`
- `quiet` `"Didn't catch her name. She was gone before the tea was."`

**respond** · *Say you'd have given up at two minutes*
- `sunny` `"I nearly did. And then I'd have had no tea and nothing to show for it."`
- `fiery` `"You'd have given up at two and had no tea. I had tea."`
- `deep` `"You'd have put it down. I thought about putting it down."`
- `quiet` `"Probably. I'd already started, so I stayed with it."`

**space** · *Laugh and let it go*
- `sunny` `"It was quite funny. You had to be there, holding a kettle."`
- `fiery` `"Fine. Laugh. I'm still holding that kettle somewhere in my head."`
- `deep` `"Mm. I liked that she didn't say anything either."`
- `quiet` `"It's only a kettle. I've got tea now."`

### R2 · `the-labelled-fruit` · story · after-school, college, independent · generated
**Kernel:** Someone she trains with writes her own name on every banana in the shared fridge.
**Authoritative claims:** none – «someone she trains with» is deliberately not a named teammate and
creates no persistent relationship. **Frames:** roof and away.
⚠ **REPAIRED IN ROUND 44 – HIS [P2], AND THE ROW'S OWN NOTE IS WHAT CONVICTS IT:** the line above
says this row creates no persistent relationship, and `fiery`'s opener said «I've said nothing for
three weeks», which is three weeks of a relationship with somebody the row will not name. The joke
survives the repair intact, which is the test a repair of this kind has to pass.

| voice | opener |
| --- | --- |
| `sunny` | `"Someone writes her NAME on bananas. On every single one. Who is taking the bananas?"` |
| `fiery` | `"She labels her fruit. Her fruit. I've said nothing about it and I am running out of nothing."` |
| `deep` | `"There's a woman who writes her name on bananas. I've decided not to ask why, because I think the answer might be sad."` |
| `quiet` | `"There's a system in the fridge now. Names on things."` |

**Parent:** *Ask whether anyone has ever taken one* · *Say you'd have eaten one by now* · *Change the subject entirely*

**invite** · *Ask whether anyone has ever taken one*
- `sunny` `"Not once. Nobody's ever taken one. That's the part I keep getting stuck on."`
- `fiery` `"Never. Not one. She's protecting fruit from a thief who doesn't exist."`
- `deep` `"No one has. I think somebody took something from her once, somewhere else."`
- `quiet` `"Not that I know of. They're all still in there."`

**respond** · *Say you'd have eaten one by now*
- `sunny` `"I know you would. I'd never dare. I'd just stand there looking at them."`
- `fiery` `"That's what I keep telling myself. And then I don't."`
- `deep` `"You would. I've thought about it and I've never once put my hand in."`
- `quiet` `"You would, yes. I bring my own."`

**space** · *Change the subject entirely*
- `sunny` `"Fine, fine. Ask me something else. I'm still thinking about the bananas."`
- `fiery` `"No. We're not moving on. Somebody has to acknowledge the bananas."`
- `deep` `"All right. I brought it up for a reason and I've lost what it was."`
- `quiet` `"Sure. What else is happening?"`

### R3 · `the-strangers-sock` · story · after-school, college, independent · generated
**Kernel:** The laundry came back one sock short and one sock over. The extra one isn't hers and she
has kept it.

| voice | opener |
| --- | --- |
| `sunny` | `"The laundry gave me back a sock that isn't mine and now I feel responsible for it."` |
| `fiery` | `"Someone out there has my sock. They know they have it. That's the part I can't let go of."` |
| `deep` | `"There's a stranger's sock in my bag. I still haven't thrown it away."` |
| `quiet` | `"Laundry came back one short and one over. I kept the spare."` |

**Parent:** *Ask what the sock looks like* · *Say it's yours now* · *Say you have three of those at home*

**invite** · *Ask what the sock looks like*
- `sunny` `"Grey, a bit bobbly, definitely not mine. It's nicer than my ones, which is annoying."`
- `fiery` `"Grey. Plain. Honestly a downgrade on the one I lost, which is about right."`
- `deep` `"Grey, with a worn heel. Somebody's been running in it."`
- `quiet` `"Grey. Bit longer than mine. It's in the side pocket."`

**respond** · *Say it's yours now*
- `sunny` `"I don't think it works like that. Although I have started thinking of it as mine."`
- `fiery` `"It is not mine. I'm keeping it, but it isn't mine. There's a difference."`
- `deep` `"I know. I still haven't put it with my own ones."`
- `quiet` `"Maybe. I haven't worn it."`

**space** · *Say you have three of those at home*
- `sunny` `"Do you? Then it's a family problem and I feel much better about it."`
- `fiery` `"Then why am I the one carrying a stranger's sock around?"`
- `deep` `"Everyone has one. I'd still like to know whose this is."`
- `quiet` `"Right. I'll stop mentioning it."`

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

**invite** · *Ask whether it was even the right flight*
- `sunny` `"It was, in the end. We all stood there for ages before anything actually happened."`
- `fiery` `"It was the right one. That's not the point. Nobody checked."`
- `deep` `"It was. I only know that because it was, not because anybody checked."`
- `quiet` `"It was the right gate. We boarded a while after that."`

**respond** · *Say you'd have stood up too*
- `sunny` `"Everybody would. That's what was so good about it."`
- `fiery` `"Everyone would. That's exactly what bothers me about it."`
- `deep` `"You would. So would I. I did."`
- `quiet` `"So did I. It seemed easier than sitting."`

**space** · *Say she got there, which is the main thing*
- `sunny` `"I did get there. I'll stop picking at it."`
- `fiery` `"I got there. I'd still like to know what she actually said."`
- `deep` `"I got there. I'm still thinking about how fast we all moved."`
- `quiet` `"I got there. That's the whole of it."`

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

**invite** · *Ask what she was going to write*
- `sunny` `"My name. That's all I've got. I hadn't thought past my own name."`
- `fiery` `"My name, obviously. I'd already started. The pen was moving."`
- `deep` `"My name. I'd have written it badly. I was more nervous than she was."`
- `quiet` `"Just my name. I'd started it."`

**respond** · *Say the kid will tell that story for years*
- `sunny` `"Do you think? I hope she does. I'd like her version better than mine."`
- `fiery` `"She won't. She ran off. I'm the one who'll be telling it."`
- `deep` `"Maybe. She didn't look like somebody making a memory. She looked caught."`
- `quiet` `"Maybe. She didn't take it with her."`

**space** · *Say it's a strange thing to get used to*
- `sunny` `"It is. I'm not used to it at all. I'm quite glad about that."`
- `fiery` `"I don't want to get used to it. That's the bit I'd keep."`
- `deep` `"I don't think I want to. Not yet, anyway."`
- `quiet` `"It is, a bit. I didn't mind it."`

### R6 · `the-saved-seat` · story · college, independent · generated
**Kernel:** At the players' dining table someone she barely knows had a bag on the chair beside them
and moved it when she came in.

| voice | opener |
| --- | --- |
| `sunny` | `"There was a seat free next to someone I've spoken to maybe twice, and she moved her bag for me."` |
| `fiery` | `"She moved her bag so I could sit down. I barely know her and I don't know what to do with that."` |
| `deep` | `"There was a bag on the chair beside hers. She moved it when I came in."` |
| `quiet` | `"I sat with someone at dinner. The seat was free."` |

**Parent:** *Ask what they talked about* · *Say somebody noticed her* · *Say dinner is just dinner*

**invite** · *Ask what they talked about*
- `sunny` `"Nothing much. The food, mostly. It was easy, which I wasn't expecting."`
- `fiery` `"Not much. The food. I spent the whole meal waiting for it to get awkward."`
- `deep` `"Not a lot. We ate. It was the first quiet meal I've had in a while."`
- `quiet` `"The food. Where she's staying. Nothing you'd write down."`

**respond** · *Say somebody noticed her*
- `sunny` `"She did, didn't she? I keep coming back to that."`
- `fiery` `"She moved a bag. I'm trying not to make it into more than that."`
- `deep` `"She did. That's the part I've kept."`
- `quiet` `"Somebody did. It was a good dinner."`

**space** · *Say dinner is just dinner*
- `sunny` `"It is. It was a nice one, though."`
- `fiery` `"It isn't, though. You know it isn't."`
- `deep` `"Usually. That one wasn't."`
- `quiet` `"Probably. I'll sit there again."`

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

**Parent:** *Ask what the meal is* · *Say you lived on two meals for years* · *Say nobody is marking her on this*

**invite** · *Ask what the meal is*
- `sunny` `"Rice and eggs. That's it. But it's good rice and they're good eggs."`
- `fiery` `"Rice and eggs. Don't laugh. I can do it without thinking now."`
- `deep` `"Rice and eggs. I got good at it because I stopped trying anything else."`
- `quiet` `"Rice and eggs. It's quick."`

**respond** · *Say you lived on two meals for years*
- `sunny` `"Two. You were ahead of me. That's actually quite encouraging."`
- `fiery` `"Two is one more than me. So one of us got somewhere."`
- `deep` `"You've never said that. I assumed you'd always been able to cook."`
- `quiet` `"Two's fine, then. I'll stop worrying about it."`

**space** · *Say nobody is marking her on this*
- `sunny` `"Nobody's marking me. I might learn a second one anyway."`
- `fiery` `"I'm marking me. That's usually enough."`
- `deep` `"I know. I've still been counting how many times I've made it."`
- `quiet` `"No. I'll learn another one sometime."`

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

**invite** · *Ask which one she keeps coming back to*
- `sunny` `"Going on my own. Every time. And then I feel bad about it, every time."`
- `fiery` `"On my own. I keep landing there and then talking myself out of it."`
- `deep` `"Alone. I keep coming back to alone and I keep not booking it."`
- `quiet` `"The morning after. I keep looking at that one."`

**respond** · *Say arriving rested is worth something*
- `sunny` `"That's a point. Going with them is probably the restful one, annoyingly."`
- `fiery` `"Rested doing what? Sitting around with all of them for an extra day?"`
- `deep` `"It is. I'm not sure rested is what I'm choosing between."`
- `quiet` `"It is. That's the argument for going early."`

**space** · *Say either is fine and she should pick the easy one*
- `sunny` `"Then I'll go with them. Deciding was the hard part, honestly."`
- `fiery` `"Neither of them is the easy one. That's why I'm still going round it."`
- `deep` `"That's the one I keep trying to find."`
- `quiet` `"All right. I'll take the later one."`

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

**invite** · *Ask when she thinks she stopped*
- `sunny` `"No idea. That's the strange bit. I can't find the day I stopped."`
- `fiery` `"I don't know. That's what's annoying. It just went and I didn't notice."`
- `deep` `"I can't find the day. I've gone back through the weeks and it isn't there."`
- `quiet` `"Couldn't say. Sometime before this week."`

**respond** · *Say she can start again if she misses it*
- `sunny` `"I could. I'm not sure I do miss it, which surprised me."`
- `fiery` `"I could. I'd feel ridiculous starting it again now."`
- `deep` `"I could. I've reached for it since and stopped myself."`
- `quiet` `"I might. It's not really a decision."`

**space** · *Say it clearly wasn't load-bearing*
- `sunny` `"Apparently not. It held nothing up at all."`
- `fiery` `"Then why did I do it for so long?"`
- `deep` `"No. I'd still like to know why I started."`
- `quiet` `"Seems not. I've been fine without it."`

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

**invite** · *Ask what exactly she said*
- `sunny` `"That I stand too square. She showed me, then walked off. Very brisk."`
- `fiery` `"That I'm square to the net when I should be turned. Then she left."`
- `deep` `"That I stand square. She said it, showed me once, and went."`
- `quiet` `"Something about being too square. It's in my phone."`

**respond** · *Say she can try it and drop it*
- `sunny` `"That's what I'll do. Try it once and see if I hate it."`
- `fiery` `"I'll try it. If it's wrong, I'll know straight away."`
- `deep` `"I can. I keep wondering why she bothered telling me at all."`
- `quiet` `"I might try it in practice."`

**space** · *Say she doesn't owe a stranger a change*
- `sunny` `"I know. I'd quite like to try it anyway."`
- `fiery` `"I don't owe her anything. I still can't stop thinking about it."`
- `deep` `"No. It's sitting there whether I owe her or not."`
- `quiet` `"No. I'll leave it for now."`

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

**invite** · *Ask what the complicated one was*
- `sunny` `"Oat flat white, extra shot, and please don't stir it. I got it right."`
- `fiery` `"Oat flat white, extra shot, unstirred. Who orders that? I remembered it anyway."`
- `deep` `"Oat milk, extra shot, not stirred. I repeated it the whole way there."`
- `quiet` `"Oat flat white, extra shot. She didn't want it stirred."`

**respond** · *Say that's a useful kind of memory*
- `sunny` `"Is it? I can't remember where I put my keys, so it's a mixed gift."`
- `fiery` `"It's useful for coffee. Nothing else has ever stayed in there."`
- `deep` `"For coffee, apparently. I've lost whole conversations this week."`
- `quiet` `"Sometimes. It works better for other people's things."`

**space** · *Laugh and say nothing else*
- `sunny` `"You're laughing. Good. That's exactly what it deserved."`
- `fiery` `"Laugh away. I'd have been furious if I'd got one wrong."`
- `deep` `"Mm. I'll take the laugh."`
- `quiet` `"That's fair. It's only coffee."`

### R12 · `the-grip-she-did-herself` · good-news · after-school, college, independent · generated
**Kernel:** A grip came loose mid-practice and she re-wrapped it herself instead of asking anyone.
⚠ **No performance claim** – it says nothing about how she played, only that the grip held.

| voice | opener |
| --- | --- |
| `sunny` | `"My grip came off and I just... did it. Myself. Badly, but myself."` |
| `fiery` | `"I re-gripped it myself. Didn't ask, didn't need to, and it held."` |
| `deep` | `"The grip went halfway through. I sat down and did it myself."` |
| `quiet` | `"Re-wrapped a grip this week. It held."` |

**Parent:** *Ask how bad it looks* · *Say that's one less thing she needs anyone for* · *Say you still can't do it either*

**invite** · *Ask how bad it looks*
- `sunny` `"Bad. There's a lump near the bottom. But it's my lump."`
- `fiery` `"It's lumpy at the end. I'm not redoing it. It held, didn't it?"`
- `deep` `"There's a ridge near the bottom. I can feel it every time."`
- `quiet` `"Uneven at the bottom. You wouldn't notice from across a court."`

**respond** · *Say that's one less thing she needs anyone for*
- `sunny` `"I suppose so. Mostly I just didn't want to interrupt anybody."`
- `fiery` `"It's one. I'd like the rest of the list as well."`
- `deep` `"Maybe. I did it because asking felt like more effort than doing it."`
- `quiet` `"Suppose so. It wasn't a big thing."`

**space** · *Say you still can't do it either*
- `sunny` `"You can't. I've watched you. It's the one thing I'm ahead on."`
- `fiery` `"You've never tried. That's not the same as can't."`
- `deep` `"You've never had to. That's the difference."`
- `quiet` `"It's not hard. I'll show you sometime."`

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

**invite** · *Ask how much of it she understood*
- `sunny` `"About half? I understood the important half. The booking's changed, so something worked."`
- `fiery` `"Enough. I understood enough, and she understood me, which is all it needed."`
- `deep` `"Less than she thought I did. I said yes to things I'm not certain about."`
- `quiet` `"Most of it. Enough to answer."`

**respond** · *Say the week of dreading it was the hard part*
- `sunny` `"It really was. The call was nothing. The dreading took everything."`
- `fiery` `"That's the annoying part. All that dread for something that short."`
- `deep` `"It was. I'd rather have made the call the day I started dreading it."`
- `quiet` `"Probably. I kept meaning to do it."`

**space** · *Say well done and leave it*
- `sunny` `"Thank you. I'm going to be smug about this for a bit."`
- `fiery` `"I'll leave it. I'm making the next one straight away, though."`
- `deep` `"Thank you. That's all I wanted to do with it."`
- `quiet` `"Thanks. It's done now."`

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

**invite** · *Ask what she'd have done*
- `sunny` `"Not that. I'd have sat there for ages. I'd probably still be sitting there."`
- `fiery` `"Sat down. Said something I'd regret. Definitely not packed my bag neatly."`
- `deep` `"I'd have stayed in the chair a long time. I know that much."`
- `quiet` `"Taken longer. I'd have packed slowly."`

**respond** · *Say losing might get easier to carry*
- `sunny` `"Does it? I'd like that. I'd also like to know when it starts."`
- `fiery` `"I don't want it easier. I want to know how she does it."`
- `deep` `"Might. She didn't look like somebody carrying anything."`
- `quiet` `"Maybe. She made it look ordinary."`

**space** · *Say she doesn't have to have a view on it*
- `sunny` `"I know. I've got one anyway."`
- `fiery` `"I've got a view. I've had one since I watched her walk off."`
- `deep` `"No. I keep seeing her zip the bag."`
- `quiet` `"No. It was only something I noticed."`

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

### Addendum 18.09 – the K5 instrument healed (wave 7 T9; round 44 §13's backlog item)

Everything above this line is the record of the runs that happened and is not rewritten. What
follows is the repair of the INSTRUMENT, not of the corpus.

⚠⚠ **What was wrong, named exactly.** Round 44's K5 run reported the college/independent gated rows
– R8 `alone-or-with-them`, R17 `the-week-with-nothing-in-it`, R20
`the-money-she-did-not-ask-about`, then R44 `the-two-quiet-days` – as never drawn: **16 voice
columns written, shipped and never seen.** §13 named the likely cause so this pass would not
re-derive it, and it was right twice over: the bench's `walkCareer` does not even stall on pending
decisions – it never ticks AT ALL. It moves `world.week` by hand, so `world.college` stays null for
the career's whole life (**no walk can reach the `college` stage**, structurally) and the season
calendar stays the one `createWorld` built (**no March entry ever opens again**, so
`march-entry-open` dies with season 0). The rows were fine; the walk could not visit the world they
live in.

**The repair** (`tools/small-talk-corpus-bench.ts`, K5b): a real-career arm on the house recipe –
`openCareer` + `stepCareerWeek` + the `tools/_lifeBeats` drain, the same walk
`tools/wedding-bench.ts` uses, with the college years spent through `resumeFromCollege` presses in
`tests/college-birthday.test.ts`'s own shape (the named donor). 24 careers, half through college,
25 years each; K5 now reads the posed sweep ∪ the real draws. K1–K4 are untouched and still
measured on the posed walk. The posed arms plus the real arm run in ~6 minutes
(`npx vite-node tools/small-talk-corpus-bench.ts`, 18.09).

⚠⚠ **THE TABLE BELOW IS AN 18.09 SNAPSHOT AND NOT A CURRENT STATEMENT – R8 AND R20's COLLEGE CELL
IS 0.0 % SINCE 26.09.** The owner's ruling 3(a) on C-07 (the 26.09 principles review) gates
`march-entry-open` on `!inCollege(world)`, because the fact certified a March entry the freeze
refuses – measured 24 of 95 college pause-weeks asked, refused 24 of 24. So both rows' college
reachability is now **0.0 %** and their `independent` column is untouched by the ruling. Re-measured
the same day with the same command, K5b: `24.6 % -> 0.0 %` on 130 college pause-weeks, independent
unmoved. ⚠ The independent column has ALSO drifted on its own, for a different reason and on a
different day – today's run reads 66.1 % of 16,448 weeks where this table says 66.5 % of 17,017 – so
the cells below are not half-corrected here: the whole table is the 18.09 measurement, kept verbatim
for provenance, and this note is what is true now. ⚠ No gate reads either number (the prose-number
class `CLAUDE.md` names); a pin that compares this table with the bench is a test item, not a
correction.

**The healed numbers** (that command, 18.09 – 240 posed seeds, 24 real careers, 12 through
college; 2,241 college weeks lived, 73 college-stage small-talk rows raised):

| row | gate | drawn (college / independent) | reachable, college pause-weeks (n 130) | reachable, independent weeks (n 17,017) |
| --- | --- | --- | ---: | ---: |
| R8 `alone-or-with-them` | `march-entry-open` | 0 / 3 | 24.6% | 66.5% |
| R17 `the-week-with-nothing-in-it` | `clear-next-week` | 1 / 5 | 98.5% | 45.9% |
| R20 `the-money-she-did-not-ask-about` | `march-entry-open` | 0 / 7 | 24.6% | 66.5% |
| R44 `the-two-quiet-days` | `clear-next-week` | 1 / 7 | 98.5% | 45.9% |

**Verdict: the instrument was the fault.** All four rows are drawn by walked careers – 16 flagged
columns before, **4 after**, and the residual four (`alone-or-with-them` sunny/quiet,
`the-week-with-nothing-in-it` sunny, `the-money-she-did-not-ask-about` quiet) are per-voice
sampling luck in a 24-career arm, each row being drawn in its other voices in the same run – not a
gate any career cannot pass.

⚠ **Against the live «91% of college weeks» measurement** (round 44 §13's own figure, whose
instrument was not recorded): the college freeze runs a year per press, so inside it this arm can
ask only on PAUSE weeks – birthdays, championships, call-ups, life beats – a real sample of college
weeks and a **biased** one, said so. On that sample the `clear-next-week` rows read **98.5%**,
which AGREES with «the rows are live» and sits beside the 91% comfortably. The `march-entry-open`
rows read **24.6%**, which is NOT 91% and is reported as a disagreement, not averaged: either the
91% was measured on the `clear-next-week` gate alone (24.6% is mechanically what a March deadline's
seasonal window gives – open roughly a quarter of the calendar), or the two instruments disagree
about the march gate at college and the next pass must say which. Both candidate readings are left
standing for the architect; neither number was adjusted toward the other.

⭐ **He ruled the form on tranche 1, 17.09: «форма строк верна, дописывай остальные 30 и присылай на
ревью».** So PASS 3 drafted **thirty** on the same architecture and the same six gates. ⚠ **Twenty-nine
of them survive** – `R26` was withdrawn in the same review, so the corpus is **43**, not the 44 this
paragraph claimed until the replies pass re-derived it. What is measured on the axis that matters is
that 43 written = 43 reachable per voice, because every situation carries all four.

⚠ **The two subjects tranche 1 held back arrive here.** `worry` and `curiosity` were where his
heaviest gating findings landed – the medical claim, the draw ages, the money, the unlicensed loss,
the coaching outcome – so they were deferred until the gates were settled rather than hurried. Each
one below either carries a career gate or asserts nothing the career could contradict.

⚠ **And the copy review of 17.09 binds this tranche too**: no explanatory dashes where a full stop
will do, no abstractions standing in for a thing, and the parent's stances are plain rather than
aphoristic.

---

## P3.1 `worry` – six, all gated or generated-safe

### R15 · `the-bag-she-repacked` · worry · after-school, college, independent · generated
⚠⚠ **REPLACED 17.09 – the row here was `the-hand-that-aches` and it was a STOP SIGN, not a wording
problem.** It asserted an ache (a body fact the engine owns), «it did not ache last year»
(longitudinal history) and a left hand – and **this game stores no handedness at all**, verified:
every `handed` in `src/engine` is the ordinary English word. A generated kernel may not invent a body.

**Kernel:** She has repacked her bag three times this week and still feels she has forgotten something.
**Authoritative claims:** none. **Texture:** the bag, the packing, the feeling.

| voice | opener |
| --- | --- |
| `sunny` | `"I've packed this bag three times and I still think I've forgotten something."` |
| `fiery` | `"Three times. I've packed it three times and it's still wrong somehow."` |
| `deep` | `"I keep repacking. I don't think it's about the bag."` |
| `quiet` | `"I've repacked it three times. It's fine now."` |

**Parent:** *Ask what she thinks is missing* · *Say you do that before trips too* · *Say the bag is packed and she can stop*

**invite** · *Ask what she thinks is missing*
- `sunny` `"I don't know. That's the whole problem. Everything's in there and it still feels wrong."`
- `fiery` `"Nothing. I know nothing's missing. I'm going to open it again anyway."`
- `deep` `"Nothing is missing. I've checked three times and I'm still going to check."`
- `quiet` `"Couldn't tell you. Everything's on the list."`

**respond** · *Say you do that before trips too*
- `sunny` `"Do you? That helps, weirdly. I thought it was only me."`
- `fiery` `"You do it once. I've done it three times. It's not the same thing."`
- `deep` `"You do. You don't do it three times."`
- `quiet` `"I know. I've watched you do it."`

**space** · *Say the bag is packed and she can stop*
- `sunny` `"It is packed. I'll leave it alone. Probably."`
- `fiery` `"I'll stop when I'm out of the door and not before."`
- `deep` `"It's packed. I'm going to open it once more."`
- `quiet` `"It's packed. I'll leave it by the door."`

### R16 · `the-one-who-stopped` · worry · college, independent · generated
**Kernel:** A name she looked for is not in this draw, and nobody has said why.
⚠ **Repaired 17.09:** the row said «at every event» and «since the spring» – longitudinal history a
generated kernel cannot assert. One draw she can see is enough for the same feeling.
⚠⚠ **AND REPAIRED AGAIN IN ROUND 44 – HIS [P2], IN THE ROW ALREADY REPAIRED FOR EXACTLY THIS.**
`sunny`'s `invite` said «we've shared a warm-up a few times», which manufactures an ongoing
relationship AND counts past occasions – the same class of claim the 17.09 pass took out of the
openers, left standing one layer down in a reply. That is the finding worth keeping: **a repair
applied to a row's kernels is not a repair of the row.**
| voice | opener |
| --- | --- |
| `sunny` | `"There's a name I expected to see in the draw and it isn't there."` |
| `fiery` | `"She's not in the draw. Nobody will say why, and I hate that."` |
| `deep` | `"A name I looked for isn't there. Nobody has mentioned it."` |
| `quiet` | `"There's a name missing from the draw."` |

**Parent:** *Ask whether she knew her well* · *Say people leave for ordinary reasons too* · *Say she does not have to find out*

**invite** · *Ask whether she knew her well*
- `sunny` `"Not really. I'd know her to look at and that's honestly the whole of it."`
- `fiery` `"Not well. Well enough to notice she's gone, which is apparently not the same."`
- `deep` `"Not well. I'd have said hello. I don't think I ever did."`
- `quiet` `"Enough to say hello. Not much past that."`

**respond** · *Say people leave for ordinary reasons too*
- `sunny` `"They do. I'd just like one of the ordinary reasons to be the reason."`
- `fiery` `"Then somebody could say which ordinary reason. That's all I want."`
- `deep` `"They do. I'd still like to know which one it was."`
- `quiet` `"Probably. It isn't my business."`

**space** · *Say she does not have to find out*
- `sunny` `"I don't. I'll probably look at the next draw anyway."`
- `fiery` `"I don't have to. I'm going to ask somebody."`
- `deep` `"No. I'll keep looking for her name, though."`
- `quiet` `"No. I'll notice if she's not in the next one."`

### R17 · `the-week-with-nothing-in-it` · worry · college, independent · **fact: `clear-next-week`**
**Kernel:** Next week holds no match, and she has not decided whether that is rest or an absence.
✅ **THE GATE IS WRITTEN (his 17.09: «пиши гейт по R17») and this row ships with the rest.**
`clear-next-week` is `SMALL_TALK_FACTS`' fifth claim and `nextWeekIsClear` is its read
(`world/lifeBeat.ts`), mutation-verified in `tests/round43-clear-next-week.test.ts`.
⚠ **It is TWO clauses, not the one proposed here.** «The season holds no event she is entered in
next week» is true all winter – every off-season and college-freeze week is empty by construction,
and `sunny`'s «I've got a completely empty week» would be a worry in July and a description of
February. The kernel says «rest or an ABSENCE», so the week must also HOLD an event she could have
been at. A calendar with nothing in it is not a gap in her season.
| voice | opener |
| --- | --- |
| `sunny` | `"I've got a completely empty week and I don't know what to do with myself."` |
| `fiery` | `"An empty week. I'll go mad. I already know I'll go mad."` |
| `deep` | `"There's nothing in next week. I keep looking at it and I can't tell if I'm relieved."` |
| `quiet` | `"Next week's clear. I might catch up on some things."` |

**Parent:** *Ask what she would do with it* · *Say an empty week is allowed to be empty* · *Say she can have it as an empty week*

**invite** · *Ask what she would do with it*
- `sunny` `"Sleep, mostly. And then panic halfway through it and go and find a court."`
- `fiery` `"Train. Obviously train. That's the problem with giving me an empty week."`
- `deep` `"I don't know. That's what's bothering me, not the week itself."`
- `quiet` `"Laundry. Sleep. The things that don't fit anywhere else."`

**respond** · *Say an empty week is allowed to be empty*
- `sunny` `"It is. I'll try to let it be one. I'm not promising."`
- `fiery` `"Allowed by who? I'm the one who has to sit in it."`
- `deep` `"It's allowed. I'm not sure I know how to have one."`
- `quiet` `"That's true. I'll find something quiet to do."`

**space** · *Say she can have it as an empty week*
- `sunny` `"Then I'll have it. I might even enjoy it."`
- `fiery` `"Fine. Ask me at the end of it how empty it stayed."`
- `deep` `"All right. I'll try it as rest and see what it turns into."`
- `quiet` `"All right. Nothing in it, then."`

### R18 · `the-match-she-is-still-carrying` · worry · after-school, college, independent · **fact: `played-recently`**
**Kernel:** A match she played is still in her head days later, and she cannot say which part of it.
⚠ **Gated** because it presumes a recent match. ⚠ **It does not say she LOST** – `played-recently`
does not license that. ⚠ **And it no longer says WHEN.** «Four days» and «Tuesday» were durations the
gate does not license either; repaired 17.09.
| voice | opener |
| --- | --- |
| `sunny` | `"I'm still thinking about that match and I can't work out which bit."` |
| `fiery` | `"That match is still in my head. I want it out."` |
| `deep` | `"It isn't one point I'm stuck on. It's the shape of the whole thing."` |
| `quiet` | `"I keep coming back to the last match. It's fine."` |

**Parent:** *Ask which part she keeps returning to* · *Say some matches take a week to put down* · *Say you can talk about something else*

**invite** · *Ask which part she keeps returning to*
- `sunny` `"That's the thing – I can't find a part. It's all of it, just sitting there."`
- `fiery` `"I can't pick one. If I could pick one I'd have dealt with it by now."`
- `deep` `"There isn't a part. I've gone looking for one and there isn't."`
- `quiet` `"Not one bit in particular. The whole thing, I suppose."`

**respond** · *Say some matches take a week to put down*
- `sunny` `"Do they? Then I'm not behind. That's quite a relief, actually."`
- `fiery` `"I don't want to give it a week. I want it gone."`
- `deep` `"Some do. This one hasn't started going anywhere yet."`
- `quiet` `"Maybe. I'll give it a bit longer, then."`

**space** · *Say you can talk about something else*
- `sunny` `"Can we? Yes. Tell me something that isn't a match."`
- `fiery` `"No. I brought it up, so I'd rather finish it."`
- `deep` `"Not yet. I haven't got anything else in my head."`
- `quiet` `"Yes. What's been happening with you?"`

### R19 · `the-name-she-heard` · worry · college, independent · generated
**Kernel:** She overheard two people discussing her, could not hear what was said, and has been
turning it over since.
| voice | opener |
| --- | --- |
| `sunny` | `"Two people were talking about me and I couldn't hear a word. That's worse than hearing it."` |
| `fiery` | `"They were talking about me. I should have walked over. I keep thinking about not walking over."` |
| `deep` | `"I heard my own name across a room and nothing else. It has been sitting with me all week."` |
| `quiet` | `"I heard my name in the corridor. Could not tell you what about."` |

**Parent:** *Ask who it was* · *Say people talk about players, it is the job* · *Say you would not have heard it either*

**invite** · *Ask who it was*
- `sunny` `"I didn't see. That's what's killing me. Two voices and my own name."`
- `fiery` `"I don't know. I heard two voices and my name and then nothing."`
- `deep` `"I didn't turn round. I've been regretting that more than the talking."`
- `quiet` `"Couldn't see from where I was. Two of them."`

**respond** · *Say people talk about players, it is the job*
- `sunny` `"I know. It's still different when you hear it happening."`
- `fiery` `"It's the job. It's still my name, and I'd like to know what followed it."`
- `deep` `"It is the job. I'd like to have heard the rest of the sentence."`
- `quiet` `"I know. It's fine. It just sat with me."`

**space** · *Say you would not have heard it either*
- `sunny` `"You wouldn't. Nobody would. I'm going to stop replaying it."`
- `fiery` `"You'd have walked straight over. So will I, next time."`
- `deep` `"You'd have heard it. You'd have gone over."`
- `quiet` `"Probably not. I'll stop listening for it."`

### R20 · `the-money-she-did-not-ask-about` · worry · college, independent · **fact: `march-entry-open`**
**Kernel:** She knows an entry is open and has not brought it up, because she does not know what it
costs.
⚠ **Gated on a real open entry**, so the situation presumes no schedule of its own. ⚠ **It names no
figure** – what the trip costs is the ledger's, not a conversation's.
| voice | opener |
| --- | --- |
| `sunny` | `"I haven't asked about the entry because I didn't want to make it a whole thing."` |
| `fiery` | `"I'm not going to ask what it costs. I'd rather not know, and then I can't argue about it."` |
| `deep` | `"The entry's been open a while and I haven't mentioned it once."` |
| `quiet` | `"The entry's open. I haven't put my name down."` |

**Parent:** *Ask whether she wants the entry* · *Say you can look at the numbers together* · *Say she needn't decide on this call*
⚠⚠ **The old third stance promised gameplay and suppressed the decision** – «put her name down and
you will sort the rest» both performs an entry the exchange cannot perform and takes the money
question off the table, which is the one thing this situation is about. ⚠ And the new third stance is
only legal while the entry's deadline proves waiting is possible, which `march-entry-open` does.

**invite** · *Ask whether she wants the entry*
- `sunny` `"I do. I didn't want to say so before you knew what it cost."`
- `fiery` `"Yes. I've wanted it since it opened and I've said nothing."`
- `deep` `"I want it. I've wanted it for a while and asked for nothing."`
- `quiet` `"I'd like to. It depends what it comes to."`

**respond** · *Say you can look at the numbers together*
- `sunny` `"Can we? That's all I actually wanted. Just to know."`
- `fiery` `"Then let's look. I'd rather see the number than imagine it."`
- `deep` `"I'd like that. I've been doing the imagining on my own."`
- `quiet` `"All right. Whenever you've got time."`

**space** · *Say she needn't decide on this call*
- `sunny` `"Okay. I'll think about it properly and come back to you."`
- `fiery` `"I've already decided. It's the asking I can't do."`
- `deep` `"No. I'd rather not carry it into the next one."`
- `quiet` `"Fine. There's time before it closes."`

## P3.2 `curiosity` – five, because `R26` was withdrawn from this cell

### R21 · `what-the-good-ones-do-first` · curiosity · college, independent · generated
**Kernel:** She has started watching what other players do in the first ten minutes on court rather
than during points.
| voice | opener |
| --- | --- |
| `sunny` | `"I've started watching what people do before the match instead of during it. It's fascinating."` |
| `fiery` | `"The good ones all do something in the first ten minutes. I want to know what it is."` |
| `deep` | `"I stopped watching the points and started watching the warm-ups. There's more in them."` |
| `quiet` | `"I've been getting to the courts earlier. You see different things."` |

**Parent:** *Ask what they do* · *Say she is watching like a coach now* · *Say she can just watch the tennis*

**invite** · *Ask what they do*
- `sunny` `"They're slower. All of them. They take the whole ten minutes and nobody rushes."`
- `fiery` `"Nothing fast. They walk. They take every second of the ten minutes."`
- `deep` `"They finish settling before the first point. I've started copying the walking."`
- `quiet` `"They're unhurried. Same routine every time, as far as I can tell."`

**respond** · *Say she is watching like a coach now*
- `sunny` `"Am I? I only got bored of watching the points."`
- `fiery` `"I'm watching because I want what they've got. That isn't coaching."`
- `deep` `"Maybe. I started doing it because I got there early once."`
- `quiet` `"I don't know about that. I just get there earlier."`

**space** · *Say she can just watch the tennis*
- `sunny` `"I do watch the tennis. I watch the other bit as well now."`
- `fiery` `"I could. I won't."`
- `deep` `"I could. The first ten minutes is the part I want."`
- `quiet` `"I still do. This is only extra."`

### R22 · `how-they-live` · curiosity · college, independent · generated
**Kernel:** She has realised she has no idea what the other players do in the hours between matches.
| voice | opener |
| --- | --- |
| `sunny` | `"What does everybody DO all day? I genuinely don't know."` |
| `fiery` | `"I've been here a week and I still don't know how anybody spends their afternoons."` |
| `deep` | `"There are hours here I can't account for in anybody's day, including mine."` |
| `quiet` | `"The days are long between matches. I've been reading."` |

**Parent:** *Ask what she does with hers* · *Say the waiting is most of it* · *Say the boring hours are part of it*

**invite** · *Ask what she does with hers*
- `sunny` `"Nap. Message people. Walk to the same café and back. It isn't exciting."`
- `fiery` `"Nothing useful. I wait, I check my phone, I get annoyed about waiting."`
- `deep` `"I wait. I've got better at waiting and I'm not sure that's good."`
- `quiet` `"Read, mostly. Wash things. The day goes."`

**respond** · *Say the waiting is most of it*
- `sunny` `"Is it? Nobody said that to me before I started doing it."`
- `fiery` `"Then somebody should have warned me. I'd have brought more to do."`
- `deep` `"It is. Nobody looks like they're waiting, though. That's the bit."`
- `quiet` `"It is. I'd not thought of it as most of it."`

**space** · *Say the boring hours are part of it*
- `sunny` `"They are. I'd still love to know what everybody else is doing."`
- `fiery` `"Part of it, fine. I'd still like to be better at them."`
- `deep` `"They are. I keep thinking somebody's found a better way to spend them."`
- `quiet` `"I know. I don't mind them much."`

### R23 · `the-word-she-keeps-hearing` · curiosity · after-school, college, independent · generated
**Kernel:** A word the older players use about matches keeps coming up and she has not asked what it
means.
| voice | opener |
| --- | --- |
| `sunny` | `"Everybody keeps saying a word and I've been nodding along without knowing it."` |
| `fiery` | `"I'm going to ask what it means. I've decided. Probably."` |
| `deep` | `"There's a word they all use. I've guessed at it and I'm still guessing."` |
| `quiet` | `"I heard that word again. I looked it up this time."` |

**Parent:** *Ask what the word is* · *Say asking is faster than guessing* · *Say she will pick it up*

**invite** · *Ask what the word is*
- `sunny` `"Flat. Everyone was flat, she played flat. I've been nodding along at it."`
- `fiery` `"Flat. That's it. Flat. And nobody will say what it actually means."`
- `deep` `"Flat. They use it about matches and I don't think they all mean the same thing."`
- `quiet` `"Flat. It isn't in the dictionary the way they use it."`

**respond** · *Say asking is faster than guessing*
- `sunny` `"It is. I'll ask the next person who says it."`
- `fiery` `"I know it is. I've had the question ready and said nothing."`
- `deep` `"It is faster. I've worked out that I'd rather guess."`
- `quiet` `"Probably. I'd rather look it up."`

**space** · *Say she will pick it up*
- `sunny` `"I will. I've nearly got it, I think."`
- `fiery` `"I don't want to pick it up. I want somebody to say it."`
- `deep` `"I might. I'd rather be told than work it out from tone."`
- `quiet` `"Probably. Everyone else did."`

### R24 · `why-anyone-watches` · curiosity · college, independent · generated
**Kernel:** A small crowd stayed to the end of a match that had stopped being close, and she cannot
work out why.
⚠ **Repaired 17.09:** the row said «dead rubber», which belongs to a TEAM TIE and asserts a
competition format this game does not have on tour. A one-sided match needs no format at all.
| voice | opener |
| --- | --- |
| `sunny` | `"People stayed to the end of a match that was already over. Why would you?"` |
| `fiery` | `"People sat through that to the end. I wouldn't have."` |
| `deep` | `"It stopped being a contest long before it finished. They stayed anyway."` |
| `quiet` | `"There were still people there at the end. Not many."` |

**Parent:** *Ask if she would have stayed* · *Say some people just like tennis* · *Say she does not have to explain a crowd*

**invite** · *Ask if she would have stayed*
- `sunny` `"No. I'd have gone and found lunch, which is probably not a great look."`
- `fiery` `"No. I left. I came back at the end to see who was still there."`
- `deep` `"I stayed. I've been telling it like I didn't."`
- `quiet` `"No. I had things to do."`

**respond** · *Say some people just like tennis*
- `sunny` `"They must. I'd never thought of it as a reason on its own."`
- `fiery` `"Liking it isn't the same as sitting through that."`
- `deep` `"Some do. Nobody looked like they were enjoying it, though."`
- `quiet` `"That's probably it. It was a nice afternoon."`

**space** · *Say she does not have to explain a crowd*
- `sunny` `"I don't. I'm still going to wonder about it."`
- `fiery` `"I don't have to. I'd like to know anyway."`
- `deep` `"No. I'd like to have asked one of them."`
- `quiet` `"No. It was only a crowd."`

### R25 · `the-coach-she-watched` · curiosity · college, independent · **fact: `coach-employed`**
**Kernel:** She watched another player's coach work and noticed they say almost nothing.
⚠ **Gated** because a girl with no coach has no comparison to make. ⚠ **It asserts nothing about HER
coach's quality** – only what she noticed about a different one. ⚠⚠ **And `fiery` used to break that
in its own line** («she was better at the end of it») – a coaching OUTCOME, which no gate licenses and
which contradicted the row's own note. Repaired 17.09; the note was true and the line was not.
| voice | opener |
| --- | --- |
| `sunny` | `"I watched somebody else's coach for an hour and they said about four words."` |
| `fiery` | `"Four words. All session. I'd like to know which four."` |
| `deep` | `"They barely spoke. I can't tell if that's confidence or if it was all said already."` |
| `quiet` | `"I watched another session for a bit. Quieter than ours."` |

**Parent:** *Ask what the four words were* · *Say the talking is not the coaching* · *Say every pair finds its own way*

**invite** · *Ask what the four words were*
- `sunny` `"Again. Both feet. Good. That was it, the whole session, four words."`
- `fiery` `"Again. Both feet. Good. Four words, and she got on with it."`
- `deep` `"Again. Both feet. Good. I counted them because I couldn't believe it."`
- `quiet` `"Again. Both feet. Good. That's all I heard."`

**respond** · *Say the talking is not the coaching*
- `sunny` `"That's what I'm starting to think. It looked like a lot was happening."`
- `fiery` `"Then what is? I'd like to know what I'm missing."`
- `deep` `"No. Something was going on and none of it was out loud."`
- `quiet` `"Maybe not. It looked like they'd done it before."`

**space** · *Say every pair finds its own way*
- `sunny` `"They must. I'd still like to try a session of four words."`
- `fiery` `"Maybe. I'd go mad in a silence like that."`
- `deep` `"They do. I'd like to know how long theirs took to find."`
- `quiet` `"I suppose so. Ours is louder."`

### R26 · ⚠⚠ **WITHDRAWN 17.09 – `what-she-would-be` IS THE SAME BEAT §P2.5 ALREADY MOVED OUT**

The row asked what she would be doing if not this, and she had no answer. That is foundational
AGENCY – the identical territory `S8 · why-tennis` was moved out of small talk for, on the owner's own
verdict that «foundational agency is not disposable small talk». Writing it back in under a different
name is how a removed thing returns.

⚠ **It is withdrawn rather than replaced, and the count moves with it: the corpus is 43, not 44.**
Padding back to a round number with a filler situation would be worse than being one short, and the
number was never the target – the per-cell floor was.

Filed with `why-tennis` for the larger beat.

## P3.3 `story` – six more, taking the heaviest cell to twelve

### R27 · `the-lift-that-stopped` · story · college, independent · generated
**Kernel:** The hotel lift stopped between floors for ten minutes with her and two other players in it.
| voice | opener |
| --- | --- |
| `sunny` | `"The lift stopped. Ten minutes. Three of us. We know each other very well now."` |
| `fiery` | `"Stuck in a lift. Ten minutes. With two people who wouldn't stop talking."` |
| `deep` | `"Ten minutes in a stopped lift with two strangers. Nobody panicked and I found that oddly reassuring."` |
| `quiet` | `"The lift stopped for a while. It started again."` |

**Parent:** *Ask what they talked about* · *Say you would have hated that* · *Laugh and move on*

**invite** · *Ask what they talked about*
- `sunny` `"Everything. Where we're from, what we eat, the lift. Ten minutes goes fast."`
- `fiery` `"They talked. I listened. I know an alarming amount about both of them now."`
- `deep` `"Food, mostly. Nobody mentioned the lift once we knew it would move."`
- `quiet` `"Not much. Where everyone was from. Then it moved."`

**respond** · *Say you would have hated that*
- `sunny` `"You'd have hated it. I quite liked it, which surprised me."`
- `fiery` `"You'd have hated it less than I did. They didn't stop talking."`
- `deep` `"You would. I kept waiting to mind it and I didn't."`
- `quiet` `"You would have. It wasn't that bad."`

**space** · *Laugh and move on*
- `sunny` `"Ten minutes and now I know their whole lives. Worth it."`
- `fiery` `"Laugh. I'm taking the stairs for the rest of the week."`
- `deep` `"Mm. Three of us and nobody panicked."`
- `quiet` `"It started again. That's the end of it."`

### R28 · `the-wrong-order` · story · college, independent · generated
**Kernel:** A café brought her somebody else's order and she ate it rather than say anything.
| voice | opener |
| --- | --- |
| `sunny` | `"They brought me the wrong lunch and I just ate it. It was quite good!"` |
| `fiery` | `"Wrong order. I ate it anyway. I'm still annoyed at myself about that."` |
| `deep` | `"It wasn't what I ordered and I said nothing, which tells me something I'm not sure I like."` |
| `quiet` | `"Lunch wasn't what I ordered. It was fine."` |

**Parent:** *Ask what she actually got* · *Say you do the same thing* · *Say she is allowed to send food back*

**invite** · *Ask what she actually got*
- `sunny` `"A toasted sandwich. I'd ordered soup. The sandwich was better, so, fine."`
- `fiery` `"A toasted sandwich. I ordered soup. I ate the sandwich like a coward."`
- `deep` `"A toasted sandwich instead of soup. I ate all of it without saying anything."`
- `quiet` `"A sandwich. I'd asked for soup. It was fine."`

**respond** · *Say you do the same thing*
- `sunny` `"Do you? Then I know exactly where I get it from."`
- `fiery` `"I know you do. I'd rather not have got it from you."`
- `deep` `"You do. I've watched you do it and I still did it."`
- `quiet` `"I know. I've seen you."`

**space** · *Say she is allowed to send food back*
- `sunny` `"I know I am. I'm never going to, though."`
- `fiery` `"Allowed isn't the problem. I had the words and I ate the sandwich."`
- `deep` `"I am allowed. I'd still rather eat the wrong thing."`
- `quiet` `"I know. I'll say something next time."`

### R29 · `the-borrowed-thing` · story · after-school, college, independent · generated
**Kernel:** Somebody borrowed something small of hers and returned it in better condition than she
lent it.
⚠ **REPAIRED IN ROUND 44 – HIS [P2]:** `quiet`'s `respond` said «we talk a bit more now», which
manufactures an ongoing relationship out of one borrowed towel. A `generated` kernel holds the towel;
it does not hold a friendship that has changed since.

| voice | opener |
| --- | --- |
| `sunny` | `"She gave it back CLEANER than I lent it. Who does that?"` |
| `fiery` | `"She cleaned it before giving it back. Now I feel like a slob and I did nothing wrong."` |
| `deep` | `"It came back in better condition than it left. I've been thinking about what that says about her."` |
| `quiet` | `"I got it back. Better than it was, actually."` |

**Parent:** *Ask what it was* · *Say that is somebody worth knowing* · *Say she should lend her more things*

**invite** · *Ask what it was*
- `sunny` `"A towel. Just a towel. It came back washed and folded like a hotel."`
- `fiery` `"A towel. That's all. And she washed it and folded it into a square."`
- `deep` `"A towel. She washed it. I haven't used it since she gave it back."`
- `quiet` `"A towel. It came back cleaner than it went."`

**respond** · *Say that is somebody worth knowing*
- `sunny` `"She is. I didn't really know her before this."`
- `fiery` `"She is. It's still a lot of effort for a towel."`
- `deep` `"I think so. It took her longer than borrowing it was worth."`
- `quiet` `"She might be. I said thank you and that was that."`

**space** · *Say she should lend her more things*
- `sunny` `"I might. I've got a whole bag of things that need washing."`
- `fiery` `"I'm not running a laundry service in reverse."`
- `deep` `"Maybe. I'd rather work out what I can do back."`
- `quiet` `"Maybe. She can have the towel."`

### R30 · `the-rain-delay` · story · college, independent · generated
**Kernel:** Rain stopped play for three hours and the players ended up playing cards in a corridor.
⚠ **REPAIRED IN ROUND 44 – HIS [P2], TWO OPENERS, AND BOTH WERE THE SAME LAW LEAKING:** a line may
not assert more than its kernel licenses. `fiery` said «and then they called it off anyway», which is
an OUTCOME – whether play resumed is a scheduling fact a `generated` kernel does not hold. `deep` said
«people I've shared a draw with for two years», which is competitive longitudinal history and is the
sharpest of the two; PASS 4 below had already flagged it and left it, and his review is the ruling
that lets it be repaired. The three hours stay: they are the kernel's own.

| voice | opener |
| --- | --- |
| `sunny` | `"Three hours of rain and we ended up playing cards on the floor of a corridor. Best day."` |
| `fiery` | `"Three hours. THREE. And the best thing that happened all day happened in a corridor."` |
| `deep` | `"We sat in a corridor for three hours and I talked to people I have only ever nodded at."` |
| `quiet` | `"Rain delay. We waited it out inside."` |

**Parent:** *Ask who won the cards* · *Say you'd have been terrible at the cards* · *Say she should get some sleep*

**invite** · *Ask who won the cards*
- `sunny` `"Not me. Somebody who had obviously done it before. I lost every hand."`
- `fiery` `"Not me. I don't think anyone explained the rules properly, which is my excuse."`
- `deep` `"Not me. I spent most of it watching rather than playing."`
- `quiet` `"Not me. I was mostly dealing."`

**respond** · *Say you'd have been terrible at the cards*
- `sunny` `"You would. We're the same at this. It was still the best bit."`
- `fiery` `"You'd be worse than me. That's the only comfort I've got."`
- `deep` `"You would. I was terrible and it didn't matter for three hours."`
- `quiet` `"You'd have been fine. Nobody was keeping score."`

**space** · *Say she should get some sleep*
- `sunny` `"I will. I'm not sorry about the three hours, though."`
- `fiery` `"I'll sleep. Three hours in a corridor and I'm wide awake."`
- `deep` `"I will. I'd forgotten what it's like to have nothing to do."`
- `quiet` `"I will. It's late here."`

### R31 · `the-child-on-the-next-court` · story · after-school, college, independent · generated
**Kernel:** A very small child on the next court hit one clean ball and celebrated as if it were a
final.
| voice | opener |
| --- | --- |
| `sunny` | `"A tiny kid hit ONE good ball and celebrated like she had won a Slam. I loved it."` |
| `fiery` | `"One ball. She screamed. Honestly? Correct behaviour."` |
| `deep` | `"A child hit one clean ball and celebrated it completely. I stood and watched and I couldn't tell you the last time I did that."` |
| `quiet` | `"There was a kid on the next court. She was pleased with herself."` |

**Parent:** *Ask what the shot was* · *Say she used to do exactly that* · *Say nothing and just laugh*

**invite** · *Ask what the shot was*
- `sunny` `"A forehand. One forehand, straight down the middle, and she went completely mad."`
- `fiery` `"A forehand. One. Down the middle. And then the noise she made."`
- `deep` `"A forehand down the middle. She watched it land before she started."`
- `quiet` `"A forehand. Middle of the court. It went in."`

**respond** · *Say she used to do exactly that*
- `sunny` `"Did I? I'd love to have seen me. I bet I was loud."`
- `fiery` `"I still would if I was allowed."`
- `deep` `"I know. I've seen the photographs. I don't remember the feeling."`
- `quiet` `"You've said. I don't remember it."`

**space** · *Say nothing and just laugh*
- `sunny` `"That's exactly the right response. I've not stopped thinking about her."`
- `fiery` `"Good. Somebody should be that pleased about one ball."`
- `deep` `"Mm. I stood there longer than I meant to."`
- `quiet` `"It was funny. That's all."`

### R32 · `the-song-in-the-gym` · story · college, independent · generated
**Kernel:** The gym played a song she has not heard since she was small and she stopped what she was
doing.
| voice | opener |
| --- | --- |
| `sunny` | `"They played a song I haven't heard since I was about six and I completely stopped."` |
| `fiery` | `"They put that song on in the gym and it ruined my whole session."` |
| `deep` | `"A song came on that I had not heard since I was small, and I stood there until it finished."` |
| `quiet` | `"They were playing old music in the gym. I stayed a bit longer."` |

**Parent:** *Ask which song* · *Say you remember it* · *Say nothing and let her have it*

**invite** · *Ask which song*
- `sunny` `"The one that was always on in the car. You know the one. That one."`
- `fiery` `"The car one. The one you played until we all hated it."`
- `deep` `"The one from the car. I knew it before I knew what it was."`
- `quiet` `"The car one. You'd know it if I hummed it."`

**respond** · *Say you remember it*
- `sunny` `"Of course you do. It was always on. I'd forgotten it completely."`
- `fiery` `"You'd better remember it. You're the reason it's in my head."`
- `deep` `"You would. I didn't think I did until it started."`
- `quiet` `"I thought you might. It's been a long time."`

**space** · *Say nothing and let her have it*
- `sunny` `"Thank you. I'm going to find it and play it properly."`
- `fiery` `"I'm still annoyed about the session. And I'm going to play it again."`
- `deep` `"Thanks. I'd rather not explain it."`
- `quiet` `"It was nice. That's all it was."`

## P3.4 `observation` – five more, because the cell that started this held ONE

### R33 · `the-one-who-never-sits` · observation · college, independent · generated
**Kernel:** She has noticed one player who never sits down at changeovers, all match.
⚠ **REPAIRED IN ROUND 44 – HIS [P3], AND HIS OWN SENTENCE IS THE DIAGNOSIS: «the label is the defect,
not the reply».** «Ask if it seemed to help her» asks for an OUTCOME – whether another player's habit
worked – which a `generated` kernel does not hold, so all four voices had to decline it («I couldn't
tell», «No idea», «I can't say», «Hard to tell»). That reads true once and reads like a dodge four
times in a row. The label now asks for the thing she actually watched, and the four replies answer it
instead of refusing it.
⚠ **`quiet`'s «twice now» IS NOT REPAIRED AND IS REPORTED.** It counts observations across matches,
PASS 4's own list names it, and **his six findings do not.** Invariant 4 and his scope instruction
both point the same way here.

| voice | opener |
| --- | --- |
| `sunny` | `"There's a girl who never sits down at changeovers. Not once, the whole match."` |
| `fiery` | `"She doesn't sit down. Ever. It's either brilliant or a pose and I can't decide which."` |
| `deep` | `"She stood through every changeover. I don't think it was for show."` |
| `quiet` | `"One of them doesn't sit at the changeovers. I noticed it early on."` |

**Parent:** *Ask what she did instead of sitting* · *Say players find odd things that work* · *Say she does not have to copy anyone*

**invite** · *Ask what she did instead of sitting*
- `sunny` `"Stood there. Bounced about a bit. Looked completely normal about the whole thing."`
- `fiery` `"Stood. Faced the back fence. Like the chair had personally offended her."`
- `deep` `"She stood with her back to the court and looked at her strings. Every single time."`
- `quiet` `"Stood at the back. Same spot each time."`

**respond** · *Say players find odd things that work*
- `sunny` `"They do. I'd like one of my own, honestly."`
- `fiery` `"Then I want an odd thing. Mine are all completely ordinary."`
- `deep` `"They do. Hers didn't look odd from where I was sitting."`
- `quiet` `"I know. Most of them have something."`

**space** · *Say she does not have to copy anyone*
- `sunny` `"I'm not going to. I did think about it, though."`
- `fiery` `"I'm not copying her. I'd just like to know what it's for."`
- `deep` `"No. I'd still like to try it."`
- `quiet` `"No. I only noticed it, that's all."`

### R34 · `the-second-serve-everyone-attacks` · observation · college, independent · **fact: `played-recently`**
**Kernel:** She has noticed that the better players move forward on a second serve without thinking
about it.
⚠ **Gated**, because it presumes she has been on a court where she could see it. ⚠ It asserts nothing
about her own second serve.
⚠⚠ **REPAIRED IN ROUND 44 – HIS [P2], AND THE ROW WAS CROSSING ITS OWN STATED BOUNDARY.** The line
directly above says this row asserts nothing about her own second serve, and then `invite` asked «Ask
what she does on hers» and got four answers establishing a persistent technical pattern – «I stay
back, mostly», «I've never once just gone». **His own suggested label is used:** ask what she notices
immediately before the better players move. The four replies are rewritten to answer THAT, and they
describe the players she is watching rather than her own tennis.
⚠ **THE OTHER TWO STANCES ARE LEFT AS THEY ARE AND THE CONCERN IS REPORTED.** «Say that is a decision
made in practice, not in a match» is his label and it invites her to talk about her own practice;
`deep`'s answer to it («I've been trying to decide it in the wrong place») is the same class of claim
the `invite` block was repaired for. **His six findings name `invite` and only `invite`**, and his
scope instruction is «repair the factual seams rather than conduct another broad prose rewrite», so
this is a sentence for him rather than an edit.

| voice | opener |
| --- | --- |
| `sunny` | `"The good ones just step in on a second serve. They don't even think about it."` |
| `fiery` | `"They walk in on the second serve like it's owed to them. I want to do that."` |
| `deep` | `"Nobody decides to step in. It's already decided before the ball is tossed, and that's the part I'm missing."` |
| `quiet` | `"They stand closer on the second serve. All of them."` |

**Parent:** *Ask what she notices just before they move* · *Say that is a decision made in practice, not in a match* · *Say she is watching well*

**invite** · *Ask what she notices just before they move*
- `sunny` `"They're leaning in while the ball's still going up. Every one of them does it."`
- `fiery` `"They move before the toss comes down. That's the whole trick and nobody hides it."`
- `deep` `"Nothing changes in their feet. They are already there before the ball is."`
- `quiet` `"They take a step in while she's still tossing it."`

**respond** · *Say that is a decision made in practice, not in a match*
- `sunny` `"That makes sense. I'd never have got there on my own."`
- `fiery` `"Then I'll do it in practice until I stop thinking about it."`
- `deep` `"That's probably right. It is not a thing to work out mid-point."`
- `quiet` `"I'd not thought of it that way. It's practice, then."`

**space** · *Say she is watching well*
- `sunny` `"Thank you. I'd rather be doing it than watching it, mind."`
- `fiery` `"Watching isn't the thing I want to be good at."`
- `deep` `"Thanks. I've been watching it instead of practising it."`
- `quiet` `"Thanks. I've been paying attention, at least."`

### R35 · `the-team-that-eats-together` · observation · college, independent · generated
**Kernel:** She noticed one player travels with three people and they all eat together every night.
| voice | opener |
| --- | --- |
| `sunny` | `"One girl has THREE people with her and they all eat together every night. It looks lovely."` |
| `fiery` | `"Three people. For one player. I don't know whether to be jealous or appalled."` |
| `deep` | `"She has a table of her own people every evening. I've been sitting with that longer than I expected to."` |
| `quiet` | `"Some of them travel with a group. They have dinner together."` |

**Parent:** *Ask whether she would want that* · *Say a big team is not the same as a good one* · *Say you'd not want three people at your dinner either*

**invite** · *Ask whether she would want that*
- `sunny` `"Some of it. Not three people. Maybe one, at dinner."`
- `fiery` `"Not three. I'd want one person who actually knew me."`
- `deep` `"Not the three. The table, maybe. I'd want the table."`
- `quiet` `"I don't know. It looks tiring as well as nice."`

**respond** · *Say a big team is not the same as a good one*
- `sunny` `"That's true. It did look like a good one, though."`
- `fiery` `"I know. It still looked better than eating on my own."`
- `deep` `"No. I'd not thought about whether hers is good. Only that it's there."`
- `quiet` `"Probably not. They seemed to get on."`

**space** · *Say you'd not want three people at your dinner either*
- `sunny` `"You wouldn't. You'd be under the table by the pudding."`
- `fiery` `"You wouldn't. I think I might, some nights."`
- `deep` `"You wouldn't. I've been eating alone and telling myself I prefer it."`
- `quiet` `"You wouldn't, no. I don't mind either way."`

### R36 · `the-long-match-on-court-one` · observation · college, independent · generated
⚠⚠ **REPLACED 17.09 – the row here read patterns ACROSS HALVES OF MULTIPLE DRAWS** («the same half
keeps doing it», «twice now»), which is competitive history and not generated texture. One match she
watched carries the same noticing and asserts nothing.
⚠⚠ **REPAIRED AGAIN IN ROUND 44 – HIS [P1], AND THE ONLY ONE OF HIS SIX FINDINGS THAT WAS A ROW
CONTRADICTING ITSELF RATHER THAN OVERREACHING ITS KERNEL.** The kernel and two openers put her at the
END of the match while all four `invite` replies said she had left before it. **His fix, applied as
he wrote it:** the kernel becomes «when she left, both were still moving properly», the two openers
follow, and «Ask who won it» is replaced – a winner is an authoritative claim a `generated` kernel
does not hold, which is also his [P3] finding about this same label.
⚠ **A FOURTH LINE CARRIED THE SAME CLAIM AND HIS INVENTORY DID NOT NAME IT**, so it is repaired WITH
the three he did name and reported here rather than quietly: `sunny`'s `respond` said «they were both
still running at the end». He named the kernel, the two openers and `quiet`'s «walked off fine»;
leaving `sunny`'s would have left the row describing an ending she did not witness in one voice of
four, which is the finding itself, unclosed. **It is his line to put back if he wants it.**
⚠ **AND ONE FLAGGED LINE IS LEFT EXACTLY WHERE IT IS.** `fiery`'s «three hours» is a duration nothing
licenses for a match she left in the middle of – PASS 4's own list names it – and **his six findings
do not.** His scope instruction governs: «repair the factual seams rather than conduct another broad
prose rewrite.»

**Kernel:** A match on the next court ran far longer than anything else that day, and when she left
it both players were still moving properly.

| voice | opener |
| --- | --- |
| `sunny` | `"There was a match on court one that went on forever and they were both still fine when I left."` |
| `fiery` | `"Hours of it, and neither of them was limping. I'd have been on the floor."` |
| `deep` | `"It went far longer than anything else out there. They were both still moving properly when I left."` |
| `quiet` | `"One of the matches ran very long. I watched some of it."` |

**Parent:** *Ask how much of it she saw* · *Say that is a different kind of fitness* · *Say she does not have to measure herself against it*

**invite** · *Ask how much of it she saw*
- `sunny` `"A good chunk of it. I kept meaning to leave and then not leaving."`
- `fiery` `"Enough of it. And then I left in the middle, which I'm annoyed about."`
- `deep` `"The middle of it. I left before the end and I have thought about that since."`
- `quiet` `"Some of the middle. I left before it finished."`

**respond** · *Say that is a different kind of fitness*
- `sunny` `"It really is. They were still running when I gave up watching."`
- `fiery` `"It is. I'd have been sitting down long before that."`
- `deep` `"It is. Neither of them looked like they were surviving it."`
- `quiet` `"It is. Neither of them had slowed down when I went."`

**space** · *Say she does not have to measure herself against it*
- `sunny` `"I know. I did a bit anyway, standing there."`
- `fiery` `"I already did. That's what watching it was."`
- `deep` `"No. I'd still like to know what that feels like."`
- `quiet` `"No. I was only watching."`

### R37 · `what-they-do-after` · observation · college, independent · generated
**Kernel:** She has started noticing what players do in the ten minutes after a loss rather than
during the match.
| voice | opener |
| --- | --- |
| `sunny` | `"I've started watching what people do AFTER. It tells you more than the match does."` |
| `fiery` | `"Some of them are fine in ten minutes. Ten. I'm not built like that and I'm not sure I want to be."` |
| `deep` | `"The ten minutes after is where the real thing is. I've started staying to watch it."` |
| `quiet` | `"I've been staying a bit longer after matches. Watching."` |

**Parent:** *Ask what she has seen* · *Say you'd never thought to watch that* · *Say she can leave when the match ends*

**invite** · *Ask what she has seen*
- `sunny` `"All sorts. Some of them are laughing by the time they reach the gate."`
- `fiery` `"Some of them are fine straight away. Some of them aren't fine at all."`
- `deep` `"Nobody does the same thing. That's what I keep noticing."`
- `quiet` `"Some pack up fast. Some sit for a while."`

**respond** · *Say you'd never thought to watch that*
- `sunny` `"Nor had I. I only noticed because I was waiting for somebody."`
- `fiery` `"Nobody does. Everyone watches the match and then leaves."`
- `deep` `"Nor had I. It's the ten minutes nobody films."`
- `quiet` `"Neither had I. I just started staying."`

**space** · *Say she can leave when the match ends*
- `sunny` `"I could. I'd rather stay, now that I've started."`
- `fiery` `"I could leave. I'd rather know what happens next."`
- `deep` `"I could. I've started staying and I'm not sure I want to stop."`
- `quiet` `"I know. I'll stay a bit anyway."`

## P3.5 `good-news` – four more

### R38 · `the-warm-up-she-runs` · good-news · college, independent · generated
**Kernel:** She led a group warm-up for the first time because nobody else started one.
| voice | opener |
| --- | --- |
| `sunny` | `"Nobody started the warm-up so I did. And everybody just... followed me?"` |
| `fiery` | `"I ran the warm-up. Somebody had to and nobody was moving."` |
| `deep` | `"I started it because the silence was getting long, and then everybody did what I said."` |
| `quiet` | `"I started the warm-up this week. It went fine."` |

**Parent:** *Ask how it felt* · *Say somebody had to, and it was her* · *Say well done and leave it*

**invite** · *Ask how it felt*
- `sunny` `"Strange. Good strange. I kept waiting for somebody to take it off me."`
- `fiery` `"Good. Better than standing about waiting for somebody else to start."`
- `deep` `"Frightening at the start. Then it was only a warm-up."`
- `quiet` `"Fine. Nobody made anything of it."`

**respond** · *Say somebody had to, and it was her*
- `sunny` `"It was me. I still don't quite know why it was me."`
- `fiery` `"Somebody had to. I'd been waiting long enough to be annoyed."`
- `deep` `"It was. I'd been waiting for somebody else to be the somebody."`
- `quiet` `"Somebody did. It happened to be me."`

**space** · *Say well done and leave it*
- `sunny` `"Thanks. I'll probably do it again next time, actually."`
- `fiery` `"I'll leave it. I'm doing it again, though."`
- `deep` `"Thank you. I'd not have told anybody else."`
- `quiet` `"Thanks. It was only a warm-up."`

### R39 · `the-thing-she-fixed` · good-news · after-school, college, independent · generated
**Kernel:** Something in her bag broke and she mended it herself with what she had.
| voice | opener |
| --- | --- |
| `sunny` | `"My bag strap went and I fixed it with a shoelace. It's holding!"` |
| `fiery` | `"It broke, I fixed it, and it's better than it was. That's the whole story."` |
| `deep` | `"I mended it with what was in the bag. It's ugly and it works and I've been quietly pleased all day."` |
| `quiet` | `"Bag strap went. It's sorted."` |

**Parent:** *Ask how bad it looks* · *Say that is a useful kind of stubborn* · *Say you would have bought a new one*

**invite** · *Ask how bad it looks*
- `sunny` `"Terrible. There's a shoelace holding my bag together. It isn't subtle."`
- `fiery` `"It looks like a shoelace holding a bag together, because that's what it is."`
- `deep` `"Bad. You can see the lace from across a room."`
- `quiet` `"You'd see it. The lace doesn't match anything."`

**respond** · *Say that is a useful kind of stubborn*
- `sunny` `"Is that what it is? I only didn't want to carry it home in pieces."`
- `fiery` `"It's stubborn. I'd have been annoyed all day carrying a broken bag."`
- `deep` `"Maybe. I didn't feel stubborn. I felt like somebody with a shoelace."`
- `quiet` `"Suppose so. It was quicker than the alternative."`

**space** · *Say you would have bought a new one*
- `sunny` `"You would have. I like this one, though."`
- `fiery` `"You would. I didn't want a new one, I wanted this one working."`
- `deep` `"You would. I'd rather it stayed the bag I've had."`
- `quiet` `"You would, yes. This one's fine now."`

### R40 · `the-junior-who-copied-her` · good-news · college, independent · generated
**Kernel:** She caught a younger player copying her warm-up routine, badly.
| voice | opener |
| --- | --- |
| `sunny` | `"A younger girl was doing MY warm-up. Badly! But mine!"` |
| `fiery` | `"She was copying me. I nearly went over and fixed her elbow, and then I thought better of it."` |
| `deep` | `"She was doing my warm-up two courts away and getting it wrong, and I didn't know where to put that."` |
| `quiet` | `"One of the juniors has picked up my warm-up. Roughly."` |

**Parent:** *Ask whether she said anything* · *Say that is what being watched looks like* · *Say she does not owe her a lesson*

**invite** · *Ask whether she said anything*
- `sunny` `"No. I pretended I hadn't seen. I didn't want to embarrass her."`
- `fiery` `"No. I got as far as standing up and then sat down again."`
- `deep` `"No. I watched her get it wrong and said nothing."`
- `quiet` `"No. She'd have stopped doing it."`

**respond** · *Say that is what being watched looks like*
- `sunny` `"I suppose it is. It hadn't occurred to me that anybody was."`
- `fiery` `"Then I'd like to be watched by somebody doing it properly."`
- `deep` `"Is it? I've only ever been the one watching."`
- `quiet` `"Maybe. It was only a warm-up."`

**space** · *Say she does not owe her a lesson*
- `sunny` `"I don't. I might still show her the first bit."`
- `fiery` `"I don't owe her anything. That elbow is still going to bother me."`
- `deep` `"No. I keep thinking about who I copied it from."`
- `quiet` `"No. I'll leave her to it."`

### R41 · `the-language-she-managed` · good-news · college, independent · generated
**Kernel:** She got through a whole conversation in a language she barely has and the other person
did not switch to English.
| voice | opener |
| --- | --- |
| `sunny` | `"We had a whole conversation and she never switched to English. Never!"` |
| `fiery` | `"She didn't switch. Most of them switch. That felt like a win."` |
| `deep` | `"She let me be bad at it rather than making it easy. I think that was kind."` |
| `quiet` | `"I managed a conversation this week. In theirs, not ours."` |

**Parent:** *Ask what it was about* · *Say people notice the trying* · *Say well done and change the subject*

**invite** · *Ask what it was about*
- `sunny` `"The weather, mostly. And her dog. I know a lot about her dog now."`
- `fiery` `"Nothing. The weather. And I was proud of every word of it."`
- `deep` `"Her dog, mostly. It took us a long time to get there."`
- `quiet` `"Weather. Her dog. Nothing complicated."`

**respond** · *Say people notice the trying*
- `sunny` `"Do they? I hope so. I was trying very obviously."`
- `fiery` `"She noticed. She just didn't make it easy, and I'm glad."`
- `deep` `"She noticed. She let me finish the sentences badly."`
- `quiet` `"Maybe. She didn't say."`

**space** · *Say well done and change the subject*
- `sunny` `"Thanks. I'll stop going on about it. Probably not immediately."`
- `fiery` `"Not yet. I haven't finished being pleased about it."`
- `deep` `"Thank you. I'd like to sit with it a bit longer."`
- `quiet` `"Thanks. What's your news?"`

## P3.6 `decision` – three more

### R42 · `the-invitation` · decision · college, independent · generated
**Kernel:** A group has asked her to something on the evening before a practice day and she has not
answered.
| voice | opener |
| --- | --- |
| `sunny` | `"I've been invited to a thing the night before practice and I haven't replied."` |
| `fiery` | `"I want to go. I shouldn't go. I've been arguing with myself about it."` |
| `deep` | `"I've left it so long that the silence is starting to answer for me."` |
| `quiet` | `"There's something on Friday. I haven't said either way."` |

**Parent:** *Ask whether she wants to go* · *Say one late evening is not a career* · *Say she can say no without a reason*

**invite** · *Ask whether she wants to go*
- `sunny` `"I do. That's the annoying bit. If I didn't want to go it'd be easy."`
- `fiery` `"Yes. Obviously yes. That's why I haven't answered."`
- `deep` `"I want to go. I've known that since they asked."`
- `quiet` `"I think so. It's the morning after I'm thinking about."`

**respond** · *Say one late evening is not a career*
- `sunny` `"It isn't. I keep making it into one, though."`
- `fiery` `"It isn't. Try telling me that at the start of practice."`
- `deep` `"No. I've been treating it like one all the same."`
- `quiet` `"That's true. I'll probably go."`

**space** · *Say she can say no without a reason*
- `sunny` `"I know. I'd still want to give them one."`
- `fiery` `"I can. I'm not saying no, I'm just not saying yes."`
- `deep` `"I could. I'd rather say something than let it run out."`
- `quiet` `"I know. I'll answer them properly."`

### R43 · `the-racket-she-is-not-sure-about` · decision · after-school, college, independent · generated
**Kernel:** She has been offered a different racket setup to try and cannot decide whether to disturb
what works.
⚠ **It asserts no change to her equipment** – the engine owns that; this owns the hesitation.
| voice | opener |
| --- | --- |
| `sunny` | `"Someone offered to set my racket up differently and now I can't stop thinking about it."` |
| `fiery` | `"I'm not changing anything mid-season. Probably."` |
| `deep` | `"It might be better. It might stop feeling like mine. That's the part I can't get past."` |
| `quiet` | `"There's a different setup I could try. I haven't."` |

**Parent:** *Ask what would change* · *Say trying is not the same as switching* · *Say if it works, leave it*

**invite** · *Ask what would change*
- `sunny` `"More weight in the handle, apparently. It's meant to feel steadier."`
- `fiery` `"Weight in the handle. That's it. That's the whole offer."`
- `deep` `"Weight in the handle. It's a small change and I still can't decide."`
- `quiet` `"A bit more weight in the handle. Nothing else."`

**respond** · *Say trying is not the same as switching*
- `sunny` `"That's a good point. I'd been treating them as the same thing."`
- `fiery` `"It is if I like it. Then I've got a problem."`
- `deep` `"It isn't. I'd still know what the other one felt like."`
- `quiet` `"I suppose not. I could try it once."`

**space** · *Say if it works, leave it*
- `sunny` `"That's probably right. I'll leave it and stop thinking about it."`
- `fiery` `"It works. That's not the same as it being the best one."`
- `deep` `"I know. I'd still like to have tried it once."`
- `quiet` `"Probably. I'll leave it as it is."`

### R44 · `the-two-quiet-days` · decision · college, independent · **fact: `clear-next-week`**
⚠⚠ **REPLACED 17.09 – the row here was `the-early-flight` and it asserted four things at once:** a
gap in the calendar, a home to fly to, a flight, and two fares costing the same. Calendar, residence,
travel and money are all the engine's, and none of them is licensed by a generated kernel. The
decision underneath was good, so the kernel keeps the decision and drops every claim.

**Kernel:** She has two quiet days and cannot decide whether to fill them or leave them alone.
**Authoritative claims:** the calendar gap, and it is GATED rather than asserted (his 17.09:
«загейти R44 на clear-next-week»). ⚠ The note here used to read «no calendar gap is named» while the
kernel said she has two quiet days – his review caught it: that IS a calendar fact, R17's class
exactly. Nowhere is travelled to and no price is quoted. **Texture:** the two days and the
hesitation.

| voice | opener |
| --- | --- |
| `sunny` | `"I've got two quiet days and I can't work out whether to do something with them."` |
| `fiery` | `"Two days. I'll either do something stupid with them or waste them entirely."` |
| `deep` | `"Two quiet days. I've been deciding what to do with them for longer than they'll last."` |
| `quiet` | `"A couple of quiet days coming. Nothing planned."` |

**Parent:** *Ask what she'd like to do* · *Say quiet days are allowed to stay quiet* · *Say she can decide on the day*

**invite** · *Ask what she'd like to do*
- `sunny` `"Nothing. Genuinely nothing. And then I'll feel guilty about the nothing."`
- `fiery` `"Something. I don't know what. That's the whole problem with two days."`
- `deep` `"Sleep. And then I'd want the two days back to do properly."`
- `quiet` `"Not much. Wash things. Read a bit."`

**respond** · *Say quiet days are allowed to stay quiet*
- `sunny` `"They are. I'm terrible at letting them, though. I always find something."`
- `fiery` `"Allowed. Everyone keeps saying allowed. I still can't sit down."`
- `deep` `"They are. I'm not good at leaving a day alone."`
- `quiet` `"That's true. I'll see how they go."`

**space** · *Say she can decide on the day*
- `sunny` `"I will, then. That's easier than working it out in advance."`
- `fiery` `"I'll have decided by then. I always decide early and then change it."`
- `deep` `"All right. I'd rather know now, but all right."`
- `quiet` `"Fine. I'll leave it until then."`


---

## Addendum 14.10 – `story` for the school years: four more, because the cell held one (round 51, item 17)

**The owner, 14.10:** «ситуация "Она подает, мяч задевает трос сетки - и падает в кофе одного папы." очень крутая. Но я ее видел уже 3 раза. Давай сделаем разнообразие этих юморных зарисовок и как-то сделаем, чтобы они более рандомно происходили?»

**Why he saw it three times.** The draw was already random: the subject and then the situation are each drawn on their own sub-stream, and the last two conversations are kept off the table. What was missing was something to draw. In the school years the `story` cell held one situation that needs no career fact, `court-four` – the net cord and the coffee. Every other situation a school-age girl can reach is either another subject or waits on a fact (a match played, a coach hired, an entry open). On a career with none of those facts the ungated school pool is two situations, `practice-clicked` and `court-four`, so whenever the story subject came up it was `court-four` – and the rule that keeps the last two off the table then kept the story subject itself off the table for the next two conversations, which is why it came back in bursts. Measured on 120 careers over their school years (a close bond, no match played, no coach hired): `court-four` was every school story, 621 of 621, and a third of all school conversations, 33.2% of 1,870.

**What this adds.** Four sketches in the same register as `court-four`, each told by all four voices: a teaser, then the incident, then three replies. The weekly chance, the season cap and the depth of the memory are untouched – the pool was the problem, and a bigger pool lets the same dice show more variety. The school `story` cell goes from one situation to five. The after-school `story` cell, which held six, goes to nine. Measured the same way after: `court-four` is 170 of the 914 school stories (18.6%) and 9.1% of all school conversations, and the other four are drawn 200, 199, 183 and 162 times. The school conversations are the same 1,870 – the cadence did not move. Stories are a larger part of them (914, up from 621) because the memory no longer empties the story subject; the subject weights are untouched.

| row | stages | what happens |
| --- | --- | --- |
| R53 `the-gran-with-sunscreen` | school | a gran walks onto the court at a changeover and does both players' ears, then the umpire's neck |
| R54 `the-rooster-ringtone` | school, after-school | a phone at the fence goes off mid-rally, the ringtone is a rooster, and a mum whispers so that three courts hear |
| R55 `the-coin-and-the-drain` | school, after-school | the coin goes down a drain at the toss, so they spin a racket and cannot agree which end is up |
| R56 `the-gull-in-the-chair` | school, after-school | a seagull takes the umpire's chair and the umpire sits on the bottom step |

**Where they sit.** Last in this document, so the catalogue's first 51 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages.** A gran stepping onto the court is a junior event's scene, so R53 is school only. A phone at the fence, a coin and a gull do not depend on her age, so the other three reach both stages, the way `court-four` does.

**What the lines were written against.**

- Nothing a career could contradict: no result, score, placing, injury, money or coach. Nobody wins or loses anything in these four.
- No masculine pronoun. The gran and the mum are «she», the gull is «it», and the umpire gets no pronoun at all. `court-four` stays the one masculine exception and its count is untouched.
- No «today», no exclamation mark, and no number that the row does not hold itself: three courts, two minutes, a minute.
- A two-beat story's three buttons appear under the teaser, before the incident is told, so each label names only what all four openers say – the changeover, the phone and the rally, the coin toss, the umpire's chair.
- The facts are the same in all four voices. Each reply then adds one fact of its own, and no voice contradicts another's edition of the evening.

**The arithmetic after these four**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 55 rows, 220 openers, 165 labels, 660 replies and 20 shared beats. The figures in the older sections are of the 51 and stay as the record of the passes that produced them.

### R53 · `the-gran-with-sunscreen` · story · school · generated
**Kernel:** At a changeover somebody's gran walked onto the court with a tube of sunscreen and did both players' ears, then the umpire's neck. Nobody stopped her. The umpire thanked her and called time. The girl smelled of coconut for the rest of the day.
**Authoritative claims:** none – the gran and the umpire exist only inside the sentence and nothing else in the engine reads them.
**Fixed in all four voices:** the tube, both players' ears, the umpire's neck, nobody stopping her. Each reply adds one fact: the umpire's thanks (invite), the girl holding in a laugh (respond), the coconut (space).

| voice | opener |
| --- | --- |
| `sunny` | `"Wait till you hear what happened at the changeover."` |
| `fiery` | `"That changeover should not have been allowed."` |
| `deep` | `"I keep thinking about the changeover. Not the tennis – the changeover."` |
| `quiet` | `"The changeover went on a bit."` |

**shared**
- `sunny` `"Somebody's gran walked onto the court with a tube of sunscreen and did both our ears. Then the umpire's neck. Nobody stopped her."`
- `fiery` `"A gran walks onto the court with a tube of sunscreen – both our ears, then the umpire's neck. Nobody stopped her."`
- `deep` `"Somebody's gran came onto the court with a tube of sunscreen. Both our ears, then the umpire's neck. It didn't cross anyone's mind to stop her."`
- `quiet` `"A gran came on with sunscreen. She did both our ears, and the umpire's neck. Nobody stopped her."`

**Parent:** *Ask what happened at the changeover* · *Say you wish you had been there* · *Let her tell it*

**invite** · *Ask what happened at the changeover*
- `sunny` `"The umpire said thank you. Properly. Then called time, as if it was planned."`
- `fiery` `"The umpire thanked her. THANKED her. Then called time like it was normal."`
- `deep` `"The umpire thanked her. I think it was the only thing left to say."`
- `quiet` `"The umpire said thank you. Then we played."`

**respond** · *Say you wish you had been there*
- `sunny` `"You'd have loved it. I looked at my shoes for a whole game."`
- `fiery` `"You'd have laughed. I held it in with my whole face."`
- `deep` `"I wish you had been. Would you have laughed, or stood very still?"`
- `quiet` `"You'd have liked it. I kept very still."`

**space** · *Let her tell it*
- `sunny` `"Anyway. I smelled of coconut for the rest of the day. I didn't mind."`
- `fiery` `"Anyway, I smelled of coconut until the last game. Nobody warns you."`
- `deep` `"That's all of it. The coconut stayed with me until the last game."`
- `quiet` `"That's all. I smelled of coconut for a while."`

### R54 · `the-rooster-ringtone` · story · school, after-school · generated
**Kernel:** A phone went off at the fence in the middle of a rally. The ringtone was a rooster. A mum answered it and whispered that she couldn't talk, she was at the tennis, and three courts heard. It rang again two minutes later, the same rooster and the same whisper. By the next changeover every parent along the fence had checked their phone.
**Authoritative claims:** none – the mum exists only inside the sentence and is never named.
**Fixed in all four voices:** the rooster, the mum's whisper, three courts hearing. Each reply adds one fact: the second call (invite), the girl turning away or staring at the net to keep from laughing (respond), the parents checking their phones (space).

| voice | opener |
| --- | --- |
| `sunny` | `"A phone went off in the middle of a rally and I'm still not over it."` |
| `fiery` | `"A phone went off in the middle of a rally. Of course it did."` |
| `deep` | `"A phone went off in the middle of a rally, and I've been thinking about it since."` |
| `quiet` | `"A phone went off during a rally."` |

**shared**
- `sunny` `"The ringtone was a rooster. A mum answered it and whispered that she couldn't talk, she was at the tennis. Three courts heard."`
- `fiery` `"The ringtone's a rooster – and a mum answers it, whispering that she can't talk, she's at the tennis. Three courts heard."`
- `deep` `"The ringtone was a rooster. A mum answered, whispering that she couldn't talk, she was at the tennis. Three courts heard every word."`
- `quiet` `"It was a rooster. A mum answered and whispered that she was at the tennis. Three courts heard."`

**Parent:** *Ask whose phone it was* · *Say you're already smiling* · *Let her tell the rest*

**invite** · *Ask whose phone it was*
- `sunny` `"No idea which mum. It rang again two minutes later. Same rooster, same whisper."`
- `fiery` `"Somebody's mum. I never found out which. Two minutes later: same rooster, same whisper."`
- `deep` `"I never found out which mum. Two minutes later: the same rooster, the same whisper."`
- `quiet` `"I don't know which mum. It rang again two minutes later."`

**respond** · *Say you're already smiling*
- `sunny` `"Good. I was too. I had to turn my back and bounce a ball."`
- `fiery` `"Good. I had to stare at the net like it owed me money."`
- `deep` `"I was, a little. It was the whisper – so careful, and so loud."`
- `quiet` `"It was funny. I looked at my strings."`

**space** · *Let her tell the rest*
- `sunny` `"Oh, and at the next changeover every parent along the fence checked their phone."`
- `fiery` `"At the next changeover every parent along that fence checked their phone. Good."`
- `deep` `"That's the whole of it. By the next changeover every parent had quietly checked their phone."`
- `quiet` `"That's it. At the next changeover everyone checked their phones."`

### R55 · `the-coin-and-the-drain` · story · school, after-school · generated
**Kernel:** At the coin toss the coin bounced, rolled across the baseline and went down a drain. Nobody had another, so they spun a racket – hers – and it took a minute to agree which end was up. Afterwards she looked down the drain.
**Authoritative claims:** none – the toss decides nothing the engine records, and no reply says who won it or what followed.
**Fixed in all four voices:** the drain, no second coin, the spun racket. Each reply adds one fact: the minute spent on which end was up (invite), the girl looking down the drain (respond), that it was her racket (space).

| voice | opener |
| --- | --- |
| `sunny` | `"The coin toss was the funniest part of the day. I'm not joking."` |
| `fiery` | `"A coin toss. How hard can a coin toss be?"` |
| `deep` | `"Something small went wrong at the coin toss and I haven't been able to let it go."` |
| `quiet` | `"There was a problem with the coin toss."` |

**shared**
- `sunny` `"The coin bounced, rolled across the baseline and dropped straight down a drain. Nobody had another one. We spun a racket instead."`
- `fiery` `"The coin lands, rolls across the baseline – and goes down a drain. Nobody had another. We spun a racket instead."`
- `deep` `"The coin hit the court, rolled to the baseline and went down a drain. Nobody had another, so we spun a racket."`
- `quiet` `"The coin went down a drain. Nobody had another, so we spun a racket."`

**Parent:** *Ask what went wrong with the coin toss* · *Say you can tell this one is good* · *Let her carry on*

**invite** · *Ask what went wrong with the coin toss*
- `sunny` `"Then we spent a minute working out which end of the racket was up."`
- `fiery` `"Then we argued about which end of a racket is up. A whole minute."`
- `deep` `"Then we spent a minute agreeing which end was up. Strange what you forget."`
- `quiet` `"Then we had to agree which end was up. It took a minute."`

**respond** · *Say you can tell this one is good*
- `sunny` `"It is. I looked down the drain afterwards, just in case."`
- `fiery` `"It is. I looked down that drain afterwards. Nothing. I'm not climbing in."`
- `deep` `"It is. I looked down the drain afterwards. I don't know what for."`
- `quiet` `"It is. I looked down the drain afterwards. Nothing."`

**space** · *Let her carry on*
- `sunny` `"And it was my racket we spun. It's never had so much attention."`
- `fiery` `"For the record, it was my racket we spun. Mine was the one nearest."`
- `deep` `"That's the end of it. It was my racket, and I felt oddly responsible."`
- `quiet` `"That's all, really. It was my racket, as it happens."`

### R56 · `the-gull-in-the-chair` · story · school, after-school · generated
**Kernel:** While the umpire was at the net a seagull walked up the steps and sat in the umpire's chair. The umpire came back and sat on the bottom step, and called the score from there for the whole of the next game. When the gull flew off, the umpire checked the seat before sitting down.
**Authoritative claims:** none – the gull and the umpire exist only inside the sentence.
**Fixed in all four voices:** the steps, the chair, the bottom step. Each reply adds one fact: the next game and the score called from the step (invite), the gull's calm (respond), the umpire checking the seat (space).

| voice | opener |
| --- | --- |
| `sunny` | `"The umpire's chair got taken. I can't tell you how funny it was."` |
| `fiery` | `"Someone else got the umpire's chair. I'm not exaggerating."` |
| `deep` | `"Something unexpected took the umpire's chair, and I keep going back to it."` |
| `quiet` | `"The umpire's chair was occupied."` |

**shared**
- `sunny` `"A seagull walked up the steps and sat in it while the umpire was at the net. The umpire came back and sat on the bottom step."`
- `fiery` `"A seagull walks up the steps and takes it while the umpire's at the net. The umpire came back and sat on the bottom step."`
- `deep` `"A seagull climbed the steps and sat down while the umpire was at the net. The umpire came back, looked at it, and sat on the bottom step."`
- `quiet` `"A seagull sat in it while the umpire was at the net. The umpire sat on the bottom step."`

**Parent:** *Ask who was in the umpire's chair* · *Say you can picture it* · *Say nothing and let her go on*

**invite** · *Ask who was in the umpire's chair*
- `sunny` `"It stayed the whole next game. The umpire called the score from the step, politely."`
- `fiery` `"The whole next game. Score called from the step. The gull never looked up."`
- `deep` `"The whole next game. The umpire called the score from the step, a little lower than usual."`
- `quiet` `"The whole next game. The umpire called the score from the step."`

**respond** · *Say you can picture it*
- `sunny` `"You can, can't you? Best seat in the place, and none of the paperwork."`
- `fiery` `"Then you've got it. The most senior person on court, and it knew it."`
- `deep` `"It sat very still, as if it had been there longer than us. It probably had."`
- `quiet` `"It was very calm about it. No one argued."`

**space** · *Say nothing and let her go on*
- `sunny` `"Oh, and when it flew off, the umpire checked the seat very thoroughly."`
- `fiery` `"And when it finally left, the umpire inspected the chair before sitting. Wise."`
- `deep` `"After it flew off, the umpire checked the seat first. I respected that."`
- `quiet` `"That's everything. When it left, the umpire checked the seat first."`

---

## Addendum 14.10 (continuation) – `observation` for the school years: three, because the cell held none (round 51)

**The owner, 14.10:** «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

**The hole, measured.** Builder B12's corpus bench (`npm run bench:smalltalk -- --seeds 60`, K4) counted what a school-age girl can be handed, per subject: `worry` 1, `good-news` 2, `decision` 1, `curiosity` 1 and `observation` **0**; after-school, `curiosity` 2 and `observation` 1. This document's own floor (§3b) is «minimum situations per subject × stage (3–4)». The one after-school observation is R14 `the-calm-loss`, which waits on a fact (`played-recently`), so on a career that has played nothing the cell was empty at both stages. Two later builders take `curiosity` and `good-news`, and `worry` and `decision`; this addendum is `observation` only.

**What an observation is, here.** Something she noticed and brings home. Not a story – nothing happens to her, there is no punchline and no second beat – and not a curiosity: she is not asking for anything. Each of the three is one thing she watched, told four ways (§2, §4); the parent's three buttons are the same for all four voices, and her replies then add one fact of their own.

| row | stages | what she noticed |
| --- | --- | --- |
| R57 `the-warm-up-friends` | school, after-school | two girls on the next court are friendly all through the warm-up, strangers from the first serve, and talking again at the net |
| R58 `the-sound-of-a-clean-ball` | school, after-school | a ball on the next court is hit so cleanly that everybody looks round at the sound |
| R59 `the-fence-says-unlucky` | school, after-school | the adults at the fence say «unlucky» after nearly every miss, even a plain bad shot, and the players nod |

**Where they sit.** Last in this document, after R56, so the catalogue's first 55 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages and facts.** A warm-up, a sound and a fence do not depend on her age, so all three reach both school and after-school, the way `court-four` does. All three are `generated` (no career fact): a row gated on `played-recently` does not lift the floor on a career that has played nothing, and that is the career the hole was measured on.

**What the lines were written against.**

- Nothing a career could contradict: no result, score, placing, injury, money or coach. The girls, the ball and the adults exist only inside the sentence and nothing in the engine reads them. No button asks for an outcome (R36's lesson: «Ask who won it» is an authoritative claim a `generated` kernel does not hold).
- No pronoun for a professional – none appears – and no masculine pronoun anywhere (`tests/coach-voice.test.ts`).
- No «today», no exclamation mark (the fiery voice carries its edge in short verdicts and capitals, as R53–R56 do), no digit, no long dash.
- Her replies describe what the OTHER players and the adults did, or what she will do with the thought – never a persistent pattern of her own tennis (R34's finding).
- The facts are the same in all four voices. Each reply then adds one fact of its own, and no voice contradicts another's edition of the scene.
- ⚠ Every new line was searched for in `src/` before it was emitted: round 51's «Nobody argued.» sat in `albumCorpus.ts` too and turned an album test red at the closing gate.

**The arithmetic after these three**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 58 rows, 232 openers, 174 labels, 696 replies and 20 shared beats (an observation has no second beat). The figures in the older sections are of the 51 and 55 and stay as the record of the passes that produced them.

**Measured after** (`npm run bench:smalltalk -- --seeds 60`, the bench B12 ran, 14.10): K4 `observation` school **0 → 3**, after-school **1 → 4**. The other K4 cells read exactly as B12 reported them (school `worry` 1, `good-news` 2, `decision` 1, `curiosity` 1; after-school `curiosity` 2), which is the check that this is the same arm and that nothing but the observation cell moved. Cells under the floor: seven → five – what remains is the `curiosity`, `good-news`, `worry` and `decision` cells the later builders take. K2 and K3: zero repeats wherever an alternative existed, in the posed career and the bare one alike. K5: 58 situations · 232 voice columns, the same four gated situations flagged as before and none of the three among them.

### R57 · `the-warm-up-friends` · observation · school, after-school · generated
**Kernel:** Two girls on the next court talked and laughed all through the warm-up. From the first serve until the match was over they did not look at each other. At the net afterwards they were talking again.
**Authoritative claims:** none – the two girls exist only inside the sentence, no score, winner or result is named, and nothing here is about a match of her own.
**Fixed in all four voices:** the next court, a friendly warm-up, and the first serve after which they stopped. Each reply adds one fact: that the change came exactly at the first serve (invite), and that it came back at the net (respond). The third stance relieves her of working it out and adds no fact.

| voice | opener |
| --- | --- |
| `sunny` | `"The two on the next court were so friendly in the warm-up. Then the first point started and they were strangers."` |
| `fiery` | `"Best friends in the warm-up. Strangers from the first serve. Where is that switch, and how do I get one?"` |
| `deep` | `"They were kind to each other in the warm-up. Once the first ball went up, neither looked at the other."` |
| `quiet` | `"Two of them on the next court talked all through the warm-up. Then the match began, and they stopped."` |

**Parent:** *Ask when it changed* · *Say it probably went back at the net* · *Say she does not have to work it out*

**invite** · *Ask when it changed*
- `sunny` `"At the very first serve. Before it they hit to each other's rackets. After it, neither of them did."`
- `fiery` `"The first serve. That's the whole switch. A ball goes up and suddenly they've both got a grudge."`
- `deep` `"The first serve. The moment the ball left the hand, they were somebody else."`
- `quiet` `"At the first serve. That was all it took."`

**respond** · *Say it probably went back at the net*
- `sunny` `"It did. They shook hands and started chatting again as if nothing had happened."`
- `fiery` `"It did. Straight away. That's the part I can't get over."`
- `deep` `"It did. How easily it came back is the part I keep thinking about."`
- `quiet` `"It did. They were talking again at the net."`

**space** · *Say she does not have to work it out*
- `sunny` `"I'm not trying to. I'm just glad I got to see it."`
- `fiery` `"I'll work it out anyway. I'd like to be able to do that."`
- `deep` `"I know. I'll probably keep watching for the exact moment it turns, though."`
- `quiet` `"I know. I only wanted to tell somebody."`

### R58 · `the-sound-of-a-clean-ball` · observation · school, after-school · generated
**Kernel:** A ball on the next court was hit so cleanly that everybody looked round at the sound – a short, solid knock.
**Authoritative claims:** none – the ball and whoever hit it exist only inside the sentence, and nobody is named and no score is mentioned.
**Fixed in all four voices:** the next court, one ball hit cleanly, everyone looking round. Each reply adds one fact: the sound was a short, solid knock (invite), and that other people hear it too (respond). The third stance relieves her of chasing it and adds no fact.

| voice | opener |
| --- | --- |
| `sunny` | `"One ball on the next court sounded so good that everybody looked round. Nobody said a word."` |
| `fiery` | `"One ball made one sound and every head on the court turned. I want that sound."` |
| `deep` | `"A ball on the next court was hit so cleanly that everyone looked round. It was a while before I stopped hearing it."` |
| `quiet` | `"A ball on the next court made a sound and everyone looked round. I did too."` |

**Parent:** *Ask what it sounded like* · *Say you know that sound* · *Say she does not have to chase it*

**invite** · *Ask what it sounded like*
- `sunny` `"A short, solid knock. Like tapping a really good table."`
- `fiery` `"A knock. Short, solid, final. A door that has made up its mind."`
- `deep` `"A knock with nothing around it. Over before I'd looked up, and I can still hear it."`
- `quiet` `"A short knock. That's all it was."`

**respond** · *Say you know that sound*
- `sunny` `"I thought you might. It's the best noise in the sport, honestly."`
- `fiery` `"Then you know. It's the one honest sound in the whole game."`
- `deep` `"You do? I wasn't sure anyone else heard it the way I do."`
- `quiet` `"Then it isn't only me. Good."`

**space** · *Say she does not have to chase it*
- `sunny` `"I'm not chasing it. I'd just like to hear it again."`
- `fiery` `"I'm chasing it anyway. That sound is the point."`
- `deep` `"I know. You can't go after it. It turns up, and I want to be listening when it does."`
- `quiet` `"I know. I'll just listen for it."`

### R59 · `the-fence-says-unlucky` · observation · school, after-school · generated
**Kernel:** The adults at the fence say «unlucky» after nearly every miss, including the ones that were plainly a bad shot. The players nod.
**Authoritative claims:** none – the adults and the players are generic, no player is named, and ⚠ whether the parent is one of the adults at that fence is deliberately not said: the row is about the word, and the three buttons let the parent decide what to do with it.
**Fixed in all four voices:** the adults at the fence, the word «unlucky», said after a miss that was a bad shot. Each reply adds one fact: the players nod (invite), that she would rather be told what happened (respond), and that the word is kindly meant but tells nobody anything (space).

| voice | opener |
| --- | --- |
| `sunny` | `"The adults at the fence say 'unlucky' after every miss, even a bad shot. It's funny once you start listening."` |
| `fiery` | `"Every adult at the fence said 'unlucky'. That was not unlucky. That was a bad shot and everybody could see it."` |
| `deep` | `"I've started listening to the fence. 'Unlucky,' after nearly every miss, even the bad shots. I can't stop hearing it."` |
| `quiet` | `"The adults at the fence say 'unlucky' a lot. Even when it was only a bad shot."` |

**Parent:** *Ask what the players do when they hear it* · *Say you will try to say what you actually see* · *Say it is mostly kindness*

**invite** · *Ask what the players do when they hear it*
- `sunny` `"They nod. Every time, very politely. It's like a password."`
- `fiery` `"They nod. Every single one. As if it were an actual explanation."`
- `deep` `"They nod. I think they know exactly what the word is covering for."`
- `quiet` `"They nod, mostly."`

**respond** · *Say you will try to say what you actually see*
- `sunny` `"Please do. I'd rather know what I actually did. Politely, though."`
- `fiery` `"Good. Tell me what you see. I can take it."`
- `deep` `"I'd like that. I can use a true thing. I can't use 'unlucky'."`
- `quiet` `"That would help. 'Unlucky' never does."`

**space** · *Say it is mostly kindness*
- `sunny` `"I know. It's very kind. I just keep waiting for somebody to say what happened."`
- `fiery` `"It's kind. It's also not true. I'm allowed to notice both."`
- `deep` `"I think it is. I just don't think it helps whoever missed."`
- `quiet` `"Probably. It doesn't tell anyone anything, though."`

## Addendum 14.10 (second continuation) – `curiosity` and `good-news` for the school years: three, because the cells held one and two (round 51)

**The owner, 14.10:** «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

**The hole, measured.** Builder B12's corpus bench (`npm run bench:smalltalk -- --seeds 60`, K4) counted what a school-age girl can be handed, per subject, and builder E1 re-measured it the same day after his three observations: school `worry` 1, `good-news` 2, `decision` 1, `curiosity` **1**; after-school `curiosity` **2**. K4 counts a row by the stages it lists and not by its fact. The one school curiosity is R48 `coach-real`, which also waits on `coach-employed`; the two after-school ones are R48 and R23 `the-word-she-keeps-hearing`. The school `good-news` pair is R45 `practice-clicked` and R52 `beat-her-conqueror`, the second of them the strictest gate in the catalogue. This document's own floor (§3b) is «minimum situations per subject × stage (3–4)». A third builder takes `worry` and `decision` after this one; this addendum is `curiosity` ×2 and `good-news` ×1.

**What they are, here.** A `curiosity` is something she wants to understand and ASKS the parent about – the three buttons are to ask what she saw, to give the answer a parent could honestly give, and to let her off knowing it yet. A `good-news` is something good she brings home, kept small and true: no title, no result and no ranking, which are other beats (R52 owns the one result). Each of the three is one scene told four ways (§2, §4); the parent's three buttons are the same for all four voices, and her replies then add one fact of their own.

| row | subject | stages | what it is |
| --- | --- | --- | --- |
| R60 `the-ball-she-let-go` | curiosity | school, after-school | an older player let a ball go by without a step, it landed out, and she asks how anyone can tell |
| R61 `sorry-for-a-lucky-point` | curiosity | school, after-school | a girl said sorry for winning a point off the net cord, and she asks why you would |
| R62 `the-older-girl-knew-her-name` | good-news | school | one of the older girls said hello to her by name, and she had not thought the girl knew it |

**Where they sit.** Last in this document, after R59, so the catalogue's first 58 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages and facts.** An older player, a ball, a hand and a net do not depend on her age, so both curiosities reach school and after-school, the way `court-four` and the three observations do. The good news is the one honest exception: «one of the older girls» is a school-years sentence, so R62 stops at school and does not claim after-school. All three are `generated` (no career fact), because a row gated on a fact does not lift the floor on a career that has not earned the fact.

**What the lines were written against.**

- Nothing a career could contradict: no result, score, placing, injury, money or coach. The older players, the girls, the ball and the hand exist only inside the sentence and nothing in the engine reads them. The one point named is won off the net cord by someone else; no button asks for an outcome (R36's lesson).
- No professional appears – no coach, umpire, teacher or physio – so none needs a pronoun (R15-7), and no masculine pronoun anywhere (`tests/coach-voice.test.ts`). The `she` and `her` in these rows are players and girls.
- No «today», no exclamation mark (the fiery voice carries its edge in short verdicts, as R53–R59 do), no digit, no long dash.
- Her replies describe what the OTHER players did, or what she will do with the thought – never a persistent pattern of her own tennis (R34's finding). ⚠ R60 in particular: no voice says she has got better at reading a ball. She says she will watch more of them, the way R45 keeps a good practice a mood and not a gain (the fog law).
- The facts are the same in all four voices. Each reply then adds one fact of its own, and no voice contradicts another's edition of the scene.
- ⚠ Every new line was searched for in `src/` before it was emitted: round 51's «Nobody argued.» sat in `albumCorpus.ts` too and turned an album test red at the closing gate.

**The arithmetic after these three**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 61 rows, 244 openers, 183 labels, 732 replies and 20 shared beats (neither a curiosity nor a good news has a second beat). The figures in the older sections are of the 51, 55 and 58 and stay as the record of the passes that produced them.

**Measured after** (`npm run bench:smalltalk -- --seeds 60`, the bench B12 ran, 14.10): K4 `curiosity` school **1 → 3** and after-school **2 → 4**, `good-news` school **2 → 3**. The other K4 cells read exactly as builder E1 reported them (`worry` school 1 and after-school 3, `decision` school 1 and after-school 3, `observation` 3 and 4, `story` 5 and 9), which is the check that this is the same arm and that nothing but these three cells moved; K4 counts the catalogue and does not depend on the seeds. Cells under the floor: five → two – what remains is school `worry` and school `decision`, the cells the later builder takes. ⚠ Each of those two is held by a row that also waits on a career fact (R46 `line-call` on `played-recently`, R47 `march-entry` on `march-entry-open`), because K4 counts a row by the stages it lists. K2 and K3: zero repeats wherever an alternative existed, in the posed career (adjacent 171/2340 → 0, within three 331/2340 → 0) and the bare one (167/2340 → 0, 328/2340 → 0) alike. K5: 61 situations · 244 voice columns, the same four gated situations flagged as before (five voice columns) and none of the three among them.

### R60 · `the-ball-she-let-go` · curiosity · school, after-school · generated
**Kernel:** One of the older players let a ball go by without taking a step, and it landed out. She cannot see how anyone can tell that early, and she asks.
**Authoritative claims:** none – the older player and the ball exist only inside the sentence, no point, score or result is named, and nothing here is about a ball of her own.
**Fixed in all four voices:** an older player, a ball she did not move for, and that it landed out. Each reply adds one fact: that the player did nothing at all but watch it (invite). The respond stance takes the parent's answer and says she will watch more balls, and the third relieves her of seeing it yet; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"How does an older player know a ball is going out? One just let it go by."` |
| `fiery` | `"An older player didn't move for a ball, and it landed out. I want to know how she knew."` |
| `deep` | `"An older player left a ball alone, and it landed out. I keep wondering what she saw."` |
| `quiet` | `"An older player let a ball go by. It landed out. How did she know?"` |

**Parent:** *Ask what the player did* · *Say they have watched so many balls they just know* · *Say she does not have to see it yet*

**invite** · *Ask what the player did*
- `sunny` `"Nothing. She watched it all the way with her racket down. So calm."`
- `fiery` `"Nothing. Not a step. She watched it land out like she'd arranged it."`
- `deep` `"Nothing. She stood still and watched, as if she already knew."`
- `quiet` `"Nothing. She just watched it go."`

**respond** · *Say they have watched so many balls they just know*
- `sunny` `"So it's just watching, lots and lots of it. I can do that."`
- `fiery` `"Then I'll watch more. A lot more. Starting with the very next ball."`
- `deep` `"So it is looking, for a long time. I cannot hurry it."`
- `quiet` `"So I'll watch more of them."`

**space** · *Say she does not have to see it yet*
- `sunny` `"Okay. I'll keep watching and see if it starts to make sense."`
- `fiery` `"Fine. But I'm watching her feet next time."`
- `deep` `"I know. I would still like to see it once."`
- `quiet` `"Okay. I'll watch for it next time."`

### R61 · `sorry-for-a-lucky-point` · curiosity · school, after-school · generated
**Kernel:** A ball clipped the net and dropped over for a point. The girl who won it said sorry, and the other girl nodded. She does not see why you would say sorry for winning a point.
**Authoritative claims:** none – the two girls exist only inside the sentence, no score, match or result is named (a point off the net cord is not a result), and nothing here is about a match of her own.
**Fixed in all four voices:** a ball that clipped the net, and the sorry said for the point it won. Each reply adds one fact: that the other girl nodded (invite). The respond stance takes the parent's answer, that it is a way of admitting the point was luck, and the third shares the not-knowing; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"Why do people say sorry when the ball clips the net and drops over? It's still a point."` |
| `fiery` | `"You don't say sorry for a point. A girl did, when the ball clipped the net. Why?"` |
| `deep` | `"I keep wondering what a girl was sorry for when she won a point off the net cord."` |
| `quiet` | `"A girl said sorry for a point off the net cord. I didn't know you did that."` |

**Parent:** *Ask what the other girl did* · *Say it is a way of admitting it was luck* · *Say you never worked it out either*

**invite** · *Ask what the other girl did*
- `sunny` `"She just nodded, like it was completely normal. Maybe it is."`
- `fiery` `"She nodded. Like a debt had just been paid."`
- `deep` `"She nodded. They both knew what it meant. I did not."`
- `quiet` `"She nodded. That was all."`

**respond** · *Say it is a way of admitting it was luck*
- `sunny` `"Oh. So it's like saying, I know that was lucky. I like that."`
- `fiery` `"So it's manners about luck. All right. I'm still keeping the point."`
- `deep` `"So it is honesty about luck. I had not thought of that."`
- `quiet` `"Oh. It's a polite way of saying it was luck."`

**space** · *Say you never worked it out either*
- `sunny` `"Really? Good. Then I'm not behind. We can wonder together."`
- `fiery` `"Great. Two of us who don't get it. I'll find out first."`
- `deep` `"Then we are both still wondering. I do not mind that."`
- `quiet` `"Okay. I'll ask someone else, then."`

### R62 · `the-older-girl-knew-her-name` · good-news · school · generated
**Kernel:** One of the older girls said hello to her by name in passing, and she had not thought the girl knew it. Nothing more happened.
**Authoritative claims:** none – the older girl exists only inside the sentence, no name, result, ranking or reputation is claimed, and ⚠ nothing here says she is known on the circuit: one hello is one hello.
**Fixed in all four voices:** one of the older girls, hello and the name, and that it was said in passing. Each reply adds one fact: what was said, and that the girl walked on (invite). The respond and space stances add none – they are what she feels and what she will do with it.

| voice | opener |
| --- | --- |
| `sunny` | `"One of the older girls said hello to me by name. I didn't think she knew it."` |
| `fiery` | `"One of the older girls knows my name. She used it. I heard it."` |
| `deep` | `"One of the older girls said my name in passing. I did not think she knew it."` |
| `quiet` | `"One of the older girls said hello. She used my name."` |

**Parent:** *Ask what the older girl said* · *Say it's good to be noticed* · *Let her just have this*

**invite** · *Ask what the older girl said*
- `sunny` `"Just hello, and my name, like it was nothing. Then she kept walking."`
- `fiery` `"Hello, and my name. Then she walked off like it was nothing. It was not nothing."`
- `deep` `"Hello, and my name, in passing. She did not even stop."`
- `quiet` `"Just hello and my name. Then she walked on."`

**respond** · *Say it's good to be noticed*
- `sunny` `"It really is. I feel a foot taller and I'm trying to hide it."`
- `fiery` `"It is. I'd like a few more of them to notice, frankly."`
- `deep` `"It is. I did not know I wanted it until it happened."`
- `quiet` `"It is. I'd noticed her too."`

**space** · *Let her just have this*
- `sunny` `"I will. I'm going to say hello back properly next time."`
- `fiery` `"Oh, I will. And next time I'm saying her name first."`
- `deep` `"I will. I would like to remember exactly how it sounded."`
- `quiet` `"I will. It was a nice bit of the week."`

## Addendum 14.10 (third continuation) – `worry` and `decision` for the school years: four, because each cell held one and both waited on a career fact (round 51)

**The owner, 14.10:** «остальные школьные темы тонкие - это тоже можно сюда же взять на двух языках, весь тон-оф-войс для референса и все рулинги у тебя есть.»

**The hole, measured.** Builder B12's corpus bench (`npm run bench:smalltalk -- --seeds 60`, K4) counted what a school-age girl can be handed, per subject, and builders E1 and E2 re-measured it after their rows. The two cells still under this document's own floor (§3b, «minimum situations per subject × stage (3–4)») were school `worry` **1** and school `decision` **1**. K4 counts a row by the stages it lists and not by its fact, and each of those two is held by a gated row: R46 `line-call` waits on `played-recently` and R47 `march-entry` on `march-entry-open`. So the count flattered the cells: R46 reaches a career only in the weeks after a match was played, and R47 only in the weeks before a March deadline. Measured on 120 careers walked for sixteen years (a close bond, a fresh world with nothing earned, the same 1,882 school conversations on both arms), the school years handed out **no worry at all and 23 decisions (1.2%)** before this item – the 23 are R47 in the weeks its door was open – against 128 worries (6.8%) and 390 decisions (20.7%) after it. After-school, `worry` and `decision` already held three each.

**What they are, here.** A `worry` is something she carries and brings to the parent: small, sized for the school years, and not a crisis, an injury or money – those are other beats. A `decision` is a choice she has to make and wants to talk through: small and hers, and not a fork of the career (the March entry in R47 and the college fork are other beats). Each of the four is one scene told four ways (§2, §4); the parent's three buttons are the same for all four voices, and her replies then add one fact of their own.

| row | subject | stages | what it is |
| --- | --- | --- | --- |
| R63 `the-film-she-has-not-seen` | worry | school | she told a girl she had seen the film the girl loves, and she has not; the girl keeps bringing it up |
| R64 `the-girl-she-walked-past` | worry | school, after-school | a girl was crying by herself near the gate, she walked past, and she cannot tell whether she should have stopped |
| R65 `the-maybe-she-gave` | decision | school, after-school | a younger girl asked her to hit and she said maybe; an answer is owed |
| R66 `the-match-she-said-she-would-watch` | decision | school, after-school | a friend's match is the last one on, she said she would stay and watch, and it is a long wait |

**Where they sit.** Last in this document, after R62, so the catalogue's first 61 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages and facts.** A film and a small lie are a school-years sentence, so R63 stops at school. A gate, a younger girl who asks for a hit and a friend's match do not depend on her age, so the other three reach school and after-school, the way `court-four` and the earlier tranche do. All four are `generated` (no career fact), and that is the point of the item: a gated row does not lift a cell on a career that has not earned the fact, and R46 and R47 are what held these two cells at one.

**What the lines were written against.**

- Nothing a career could contradict: no result, score, placing, injury, money, tiredness or coach. The girls, the film, the gate and the match exist only inside the sentence and nothing in the engine reads them. Condition is the engine's, so R66 says the wait is long and that she promised – never that she is tired. R66's match is a friend's and not hers, and no button asks for an outcome (R36's lesson). R64 names no cause for the crying: nobody lost anything here.
- No professional appears – no coach, umpire, teacher or physio – so none needs a pronoun (R15-7), and no masculine pronoun anywhere (`tests/coach-voice.test.ts`). The `she` and `her` in these rows are players and girls.
- No «today», no exclamation mark (the fiery voice carries its edge in short verdicts, as R53–R62 do), no digit, no long dash.
- Her replies describe what the OTHER girl did, or what she will do with the thought – never a persistent pattern of her own tennis (R34's finding). ⚠ R65 in particular: no voice says she is the stronger player, or that she has the time. She says she will hit once, or that she will answer by the end of the week.
- The facts are the same in all four voices. Each invite reply then adds one fact of its own, and no voice contradicts another's edition of the scene.
- ⚠ Every new line was searched for in `src/` before it was emitted: round 51's «Nobody argued.» sat in `albumCorpus.ts` too and turned an album test red at the closing gate.

**The arithmetic after these four**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 65 rows, 260 openers, 195 labels, 780 replies and 20 shared beats (a worry and a decision have no second beat). The figures in the older sections are of the 51, 55, 58 and 61 and stay as the record of the passes that produced them.

**Measured after** (`npm run bench:smalltalk -- --seeds 60`, the bench B12 ran, 14.10): K4 `worry` school **1 → 3** and after-school **3 → 4**, `decision` school **1 → 3** and after-school **3 → 5**. The other K4 cells read exactly as builder E2 reported them (`good-news` 3 and 4, `curiosity` 3 and 4, `observation` 3 and 4, `story` 5 and 9), which is the check that this is the same arm and that nothing but these four cells moved; K4 counts the catalogue and does not depend on the seeds. **Cells under the floor: two → zero.** ⚠ K4 counts by listing, and the two school cells are 3 listed and **2 reachable on a bare career** (R46 and R47 are the third): the same is true of school `good-news` and `curiosity`, whose third rows are R52 and R48. K2 and K3: zero repeats wherever an alternative existed, in the posed career (adjacent 104/2340 → 0, within three 232/2340 → 0) and the bare one (127/2340 → 0, 271/2340 → 0) alike. K5: 65 situations · 260 voice columns, the same gated situations flagged as before and none of the four among them.

**The subject mix after the whole tranche** – the real draw, 120 careers walked for sixteen years with a close bond and a fresh world, the walk of `tests/round51-school-worry-decision-pool.test.ts`. The school years hand out 1,882 conversations and after-school 1,512 on every tree in the table, because the cadence does not depend on the pool. «Before the tranche» is the tree before builder B12's stories (0fe15aca), «before this item» the tree after E2 (2ef31844).

| subject | school, before the tranche | school, before this item | school, final | after-school, before the tranche | after-school, before this item | after-school, final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| observation | 0% | 29.8% | **22.8%** | 0% | 23.2% | **22.8%** |
| curiosity | 33.4% | 29.3% | **20.9%** | 27.0% | 21.2% | **20.6%** |
| decision | 1.8% | 1.2% | **20.7%** | 26.9% | 20.6% | **21.8%** |
| story | 32.5% | 20.7% | **14.5%** | 17.2% | 12.8% | **12.6%** |
| good-news | 32.4% | 19.1% | **14.3%** | 20.6% | 15.7% | **15.3%** |
| worry | 0% | 0% | **6.8%** | 8.3% | 6.4% | **7.0%** |

Counts, final tree: school observation 430, curiosity 393, decision 390, story 272, good-news 269, worry 128; after-school observation 344, decision 330, curiosity 311, good-news 231, story 190, worry 106.

**How to read it.** The final shares sit within 1.5 points of the weights of the `level` mood register (`SMALL_TALK_SUBJECT_WEIGHT`: curiosity 3, decision 3, observation 3, story 2, good-news 2, worry 1 – that is 21, 21, 21, 14, 14 and 7%), and a fresh career is in that register in every week (measured: 104 of 104 walked weeks). The earlier skews were the memory rule and the pool depths, not the weights: a subject with one situation is kept off the table for two conversations after each use, so the subject with the most rows won (story reached 49% on builder B12's tree, 914 of 1,870), and each builder's rows moved the share to the next subject that was thin. Now every subject has at least two reachable rows at school and the draw looks like the weights. ⚠ **Worry is the rarest by design**: it weighs 5 of 12 when her spirits are low and 1 of 14 in a level week, so a walk of fresh careers understates it – a career with a low stretch is handed far more of it. This addendum changes no weight.

### R63 · `the-film-she-has-not-seen` · worry · school · generated
**Kernel:** She told a girl she had seen the film the girl loves, and she has not. The girl keeps bringing it up, and the lie has already grown by a sentence.
**Authoritative claims:** none – the girl and the film exist only inside the sentence, no title is named, and nothing here touches a result or her tennis. The lie is hers and it is small; nothing says anybody was hurt by it.
**Fixed in all four voices:** she told a girl she had seen the film the girl loves, and she has not. Each invite reply carries the same fact: she told the girl the ending was good. The respond stance takes the parent's own confession and the third says one sentence puts it right; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"I told a girl I'd seen the film she loves. I haven't. Now she wants to talk about it every single day."` |
| `fiery` | `"I lied about a film. A girl loves it, I said I'd seen it, and now she will not stop talking about it."` |
| `deep` | `"I told a girl I had seen the film she loves. I had not. Every time she mentions it, the lie feels a little bigger."` |
| `quiet` | `"A girl keeps mentioning a film. I told her I'd seen it. I haven't."` |

**Parent:** *Ask what she told the girl about it* · *Say you have done the same* · *Say it can be put right with one sentence*

**invite** · *Ask what she told the girl about it*
- `sunny` `"That I loved the ending. I don't even know how it ends."`
- `fiery` `"That the ending was the best part. I have never seen the ending."`
- `deep` `"That I loved the ending. I do not know what happens in it. I said it as if I did."`
- `quiet` `"That the ending was good. She was pleased."`

**respond** · *Say you have done the same*
- `sunny` `"Have you? Good. Then I'm in decent company."`
- `fiery` `"Of course you have. So that's where I get it."`
- `deep` `"I did not think you ever had. It makes it feel smaller."`
- `quiet` `"All right. That helps a little."`

**space** · *Say it can be put right with one sentence*
- `sunny` `"One sentence. I can do one sentence. Maybe after the weekend."`
- `fiery` `"One sentence? Then I've been dreading nothing."`
- `deep` `"It is one sentence. It is the saying of it that I keep rehearsing."`
- `quiet` `"One sentence. I'll find a time."`

### R64 · `the-girl-she-walked-past` · worry · school, after-school · generated
**Kernel:** A girl was crying by herself near the gate. She walked past, and she cannot decide whether she should have stopped.
**Authoritative claims:** none – the girl exists only inside the sentence. ⚠ **No cause is named for the crying, and no match, score or result either**: nothing says anybody lost, and no button asks why. Nobody is hurt and nobody is in danger; the weight is only that she cannot tell whether the girl wanted company.
**Fixed in all four voices:** a girl crying by herself near the gate, and that she walked past. Each invite reply carries the same fact: the girl was sitting on her bag with her hood up. The respond stance takes the parent's own history and the third says that noticing counts; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"A girl was crying on her own by the gate and I walked past. I think I should have stopped."` |
| `fiery` | `"I walked straight past a girl who was crying. Straight past. I should have stopped."` |
| `deep` | `"A girl was crying by herself near the gate and I walked past her. I keep going back to the moment I decided not to stop."` |
| `quiet` | `"A girl was sitting by the gate, crying. I kept walking."` |

**Parent:** *Ask what she saw* · *Say you have walked past too* · *Say it counts that she noticed*

**invite** · *Ask what she saw*
- `sunny` `"She was sitting on her bag with her hood up. All on her own."`
- `fiery` `"On her bag, hood up, on her own. Nobody anywhere near her."`
- `deep` `"She was sitting on her bag with her hood up, and nobody was near her."`
- `quiet` `"On her bag, with her hood up."`

**respond** · *Say you have walked past too*
- `sunny` `"You too? Then it's not just me. I still wish I'd stopped."`
- `fiery` `"Everyone has. That's not an excuse. That's the problem."`
- `deep` `"I believe you. It does not make her any less alone."`
- `quiet` `"Okay. That doesn't change it, but okay."`

**space** · *Say it counts that she noticed*
- `sunny` `"Does it? Then I'll say hello to her next time. That's a start."`
- `fiery` `"Noticing doesn't do anything for her. Next time I'm stopping."`
- `deep` `"Perhaps. It is the only part of it I got right."`
- `quiet` `"Maybe. I'll look for her."`

### R65 · `the-maybe-she-gave` · decision · school, after-school · generated
**Kernel:** A younger girl asked her to hit with her, and she said maybe. An answer is owed and she has not decided.
**Authoritative claims:** none – the younger girl exists only inside the sentence. ⚠ **Nothing here changes a session, a plan or her load**: one hit is a hit and not a lesson, and no professional is involved. No voice says she is the stronger player.
**Fixed in all four voices:** a younger girl asked her to hit, and she said maybe. Each invite reply carries the same fact: the younger girl waits at the end of the court for a gap. The respond stance takes the parent's own history and the third lets the answer wait; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"A younger girl asked if I'd hit with her. I said maybe. I should probably say yes or no."` |
| `fiery` | `"A younger girl asked me to hit with her and I said maybe. Maybe isn't an answer. I know that."` |
| `deep` | `"A younger girl asked me to hit with her. I said maybe, and I keep seeing her face when I said it."` |
| `quiet` | `"A younger girl asked if I'd hit with her. I said maybe."` |

**Parent:** *Ask what the younger girl is like* · *Say someone once made time for you* · *Say she can answer when she knows*

**invite** · *Ask what the younger girl is like*
- `sunny` `"Shy, I think. She keeps standing at the end of the court, waiting for a gap."`
- `fiery` `"She doesn't say much. She stands at the end of the court and waits for a gap."`
- `deep` `"She does not say much. She stands at the end of the court and waits for a gap, as if she has done it before."`
- `quiet` `"Quiet. She waits at the end of the court for a gap."`

**respond** · *Say someone once made time for you*
- `sunny` `"Did they? Then I think I'll say yes. One hit, to start."`
- `fiery` `"Fine. One hit, and then we'll see. I'm not a ball machine."`
- `deep` `"I did not know that. It makes it harder to say no, which I suppose is the point."`
- `quiet` `"All right. I'll tell her yes."`

**space** · *Say she can answer when she knows*
- `sunny` `"Good. I'll tell her by the end of the week, either way."`
- `fiery` `"Fine. But she's waiting. I'd like to stop making her wait."`
- `deep` `"I know. I do not want to leave her wondering for long."`
- `quiet` `"Okay. Not for long, though."`

### R66 · `the-match-she-said-she-would-watch` · decision · school, after-school · generated
**Kernel:** A friend has a match that is the last one on, and she said she would stay and watch it. It is a long wait and she cannot decide whether to stay for all of it.
**Authoritative claims:** none – the friend and her match exist only inside the sentence, and the match is not hers. ⚠ **No result, score or placing is named and no button asks for one** (R36's lesson). ⚠ **Nobody says she is tired**: condition is the engine's, so the pull is that the wait is long and that she promised.
**Fixed in all four voices:** a friend's match, the last one on, and that she said she would stay and watch it. Each invite reply carries the same fact: she promised all of it. The respond stance takes the parent's view of a promise and the third lets her go when she has had enough; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"I told a friend I'd stay and watch her match. It's the last one on, so that's a lot of waiting."` |
| `fiery` | `"I made a promise too quickly. I said I'd watch a friend's match, and it's the last one on."` |
| `deep` | `"I told a friend I would stay and watch her match. I meant it then. It is the last match on, and I am not sure I mean it now."` |
| `quiet` | `"I said I'd watch a friend's match. It's the last one on."` |

**Parent:** *Ask how much she promised to watch* · *Say you would keep a promise like that* · *Say she can go when she has had enough*

**invite** · *Ask how much she promised to watch*
- `sunny` `"All of it. That was the silly part. Half would have been fine."`
- `fiery` `"All of it. I said all of it. Why did I say all of it."`
- `deep` `"All of it. I told her I would stay to the end, and she thanked me."`
- `quiet` `"All of it. That's what I said."`

**respond** · *Say you would keep a promise like that*
- `sunny` `"I know you would. I think that's why I haven't gone yet."`
- `fiery` `"Fine. Then I stay. I'm not going to enjoy the last hour, though."`
- `deep` `"I know. That is what I am weighing it against."`
- `quiet` `"I know. That's what I keep thinking."`

**space** · *Say she can go when she has had enough*
- `sunny` `"Okay. Then I'll stay for the start and see how I feel."`
- `fiery` `"Good. I'll stay for the start, and I'm not saying sorry for the rest."`
- `deep` `"Perhaps. I would still know I had left, though."`
- `quiet` `"Okay. I'll see how long I last."`

## Addendum 14.10 (round 52, builder F4) – three coach-feel situations: she brings up how it is going with her coach, and which of the three depends on how she feels about it

**The owner, 14.10:** «я хочу сделать систему, что ребенок может намекать, что ей ок, норм или вообще не ок с этим тренером, чтобы у игрока была какая-то обратная связь от ребенка для принятия решения». Of the three channels offered (the plate on her screen, the week notes, a conversation) he chose this one as well: «Отдельный разговор – редкая беседа о тренере её голосом… самый живой». On how sure she may sound: «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но" или что-то в таком духе, т.е. она еще не уверена, а просто сомневается».

**What this is.** Her feel for the coach is one reading, `coachFeel(world)` (round 52 F1: a scale of five steps and «too early»). The Coach plate on her screen (F2) and the diary's week notes (F3) already say it. This is the third channel: three small-talk situations in her own voice, each waiting on one SIDE of that scale, so that the conversation can only be about what is true. The owner's «rare» is the existing cadence – this addendum changes no weekly chance, no season cap, no depth of the memory and no subject weight.

| row | subject | stages | fact | what it is |
| --- | --- | --- | --- | --- |
| R67 `the-thing-that-makes-sense` | good-news | school, after-school, independent | `coach-feel-warm` | something her coach asks for has started to make sense to her; she is glad, and does not say it will last |
| R68 `practice-feels-different` | observation | school, after-school, independent | `coach-feel-unsure` | practice with her coach feels different, and she cannot tell yet whether different is better |
| R69 `the-thing-she-cannot-name` | worry | school, after-school, independent | `coach-feel-cold` | practice with her coach is «fine», but something is not landing, and she has not found a way to say it that is fair |

**The three facts.** All three live in `lifeBeat.ts`'s `SMALL_TALK_FACT` beside the five that were there, and all three read `coachFeel(world)` and nothing else – the primitive the plate and the notes read (the parity law: a gate that re-derived a band from the chemistry level would be a second answer to «how does she feel about her coach»).

| fact | true when her feel is | false on |
| --- | --- | --- |
| `coach-feel-warm` | `seems-good` or `good` | `too-early`, `unsure`, `seems-off`, `off`, no coach, college |
| `coach-feel-unsure` | `unsure` | `too-early`, `seems-good`, `good`, `seems-off`, `off`, no coach, college |
| `coach-feel-cold` | `seems-off` or `off` | `too-early`, `unsure`, `seems-good`, `good`, no coach, college |

**Where they sit.** Last in this document, after R66, so the catalogue's first 65 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages and facts.** School, after-school and independent – **not college**, twice over. The coach does not work in college weeks (`coachWorksThisWeek`: «the family stops paying»), so a girl in a dorm has no practice to be unsure about; and each fact carries `!inCollege(world)` besides (the C-07 clause of `march-entry-open`), so the FACT is true to itself and not only the stage list. In the independent years she talks about her coach on the phone; the lines say nothing about where she is, as R45 and `court-four` do not, and the presence layer's frame says it. `too-early` (the first weeks together) has no row and no fact: there is nothing to talk about yet, and a girl asked about someone she met last week would be inventing a feeling. With nobody employed `coachFeel` is `null` and every fact is false.

**Subjects, by this document's own definitions.** R67 is a good news – something good she brings home, kept small and true. R68 is an observation and not a curiosity: something she noticed, and she asks the parent for nothing. R69 is a worry – small, hers, and not a crisis. Each subject keeps every row it had; the three new rows join a cell only while their fact is true.

**What the lines were written against.**

- **The gate licenses a FEELING and nothing else.** She may say how it feels with her coach; she may not say that the coach is good or bad, that she has improved or fallen back (the fog law – R45: a practice that felt easy is a mood and never a training gain), or any result.
- **His register is doubt and never a verdict.** «Не "всё плохо"»: no line calls anything bad, wrong or over. The cold row says practice is FINE first, in every voice; the unsure row says she cannot tell; the warm row will not promise that it lasts. A girl who is sure (`good`, `off`) reads the same row as a girl who is not (`seems-good`, `seems-off`) – the lines are true of both.
- **The coach is never pronoun-ed and never gendered (R15-7).** «My coach» and «the coach» as nouns only, and no line that names the coach carries a third-person pronoun at all. The Russian keeps the same discipline: no past-tense verb or adjective takes the coach as its subject.
- **Her answers move nothing** (ruling V2: tier-1 replies move nothing). No effect is added; only R48 `coach-real`'s `view` opens the chemistry gauge, and these rows do not touch it. The player's feedback is what she says; what he does with it is his.
- No «today», no exclamation mark, no digit, no long dash; the fiery voice carries its edge in short verdicts, as R53–R66 do. Her replies describe what she noticed or what she will do with the thought – never a persistent pattern of her own tennis (R34's finding).
- The facts are the same in all four voices. Each invite reply then adds one fact of its own, and no voice contradicts another's edition of the scene.
- ⚠ Every new line was searched for in `src/` before it was emitted (round 51's «Nobody argued.» sat in `albumCorpus.ts` too and turned an album test red at the closing gate); the sweep is kept in `tests/r52-coach-feel-talk.test.ts`.

**The arithmetic after these three**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 68 rows, 272 openers, 204 labels, 816 replies and 20 shared beats (a good news, an observation and a worry have no second beat). The figures in the older sections are of the 51, 55, 58, 61 and 65 and stay as the record of the passes that produced them.

**Measured after** (14.10, the tree this addendum ships with).

**K4** (`npm run bench:smalltalk -- --seeds 60`, the bench B12 ran): `good-news`, `observation` and `worry` each gain one listed row at school (3 → 4, 3 → 4, 3 → 4), after-school (4 → 5, 4 → 5, 4 → 5) and independent (to 9, 8 and 8); college is unchanged (8, 7 and 7) because the rows do not list it. Cells under the floor: zero before and zero after. K4 counts a row by the stages it lists and not by its fact, so these three are listed everywhere they can be heard but reachable only while her feel is on their side. **K2 and K3:** zero repeats wherever an alternative existed, in the posed career (adjacent 104/2340 → 0, within three 232/2340 → 0) and the bare one (121/2340 → 0, 247/2340 → 0) alike. **K5:** 68 situations · 272 voice columns; ten voice columns flagged "never drawn", three of them the `march-entry-open` ones as before and seven the new rows' (R67 fiery and deep, R68 sunny, fiery and deep, R69 quiet and deep). That is RARITY and not unreachability: the bench's posed career poses `coach-employed` but no feel, and its 24 real careers are too few to meet a row that comes about once in nineteen coached years. The test's walk below draws every row at all three stages.

**⚠ HOW OFTEN A PLAYER MEETS ONE – and it is rare, rarer than «редкая беседа» can mean.** The real draw on played, coached careers (7 presets that start with a coach × 6 careers × 312 weeks = **252 coached years**; `R52_F4_SCALE=big R52_F4_REPORT=1 npx vitest run --project unit tests/r52-coach-feel-talk.test.ts -t "how often|round 52 F4 D"`): she talked 304 times (1.21 a coached year – the played bond keeps the weekly chance under the close-bond 0.08 the bench uses) and **13** of those conversations were a coach-feel one: warm 4, unsure 5, cold 4. That is **0.052 a coached year, about one in nineteen**, 4.3% of her conversations, and any ONE of the three about once in 50–63 coached years. A fourteen-year career meets 0.7 of them: a coin toss whether a player meets even one. On the walk of the same file with a close bond and her level posed (36 careers × 24 years = 864 coached years, 3.3 conversations a year, 2849 in all) the draw hands out 71: warm 23 (6 school, 6 after-school, 11 independent), unsure 35 (9, 9, 17) and cold 13 (1, 2, 10) – 0.082 a coached year, and every one of the 71 had its fact true at the moment of the roll. The cold row is rarest at school because a school-years pool is small and `worry` is the lightest subject (1 of 14 in a level week): the rows join cells of 3–9 and a subject is drawn by its weight first.

**What would move it, not built.** The rarity is the cadence and the pool depth, which this addendum deliberately left alone (no weight, no chance, no cap moved). The lever, if the owner's feedback channel should be SEEN, is a lead like the week notes got in F3: when a coach-feel fact is true, the matching row takes the pick on a share of the conversations (its own purpose-scoped sub-stream, zero MAIN draws). Predicted from the measured 1.21 conversations a coached year, and since some side is true on every coached week past the first six: a share of 1/4 is about 0.3 a coached year (once in three years), 1/3 about 0.4, 1/2 about 0.6. It changes the draw of every coached career (the digest pins move again), so it is the architect's call, as F3's was.

### R67 · `the-thing-that-makes-sense` · good-news · school, after-school, independent · **fact: `coach-feel-warm`**
**Kernel:** Something her coach asks for has started to make sense to her. She is glad of it and careful with it: she tells the parent, and she does not say it will last.
**Authoritative claims:** `coach-feel-warm` – she has a coach and her feel for the coach stands on the warm side of the scale, `seems-good` or `good`. It licenses that things are coming together for her – **not** that the coach is good, that she has improved (the fog law, R45: a practice that felt easy is a mood and never a training gain), or any result. ⚠ One set of lines serves both steps, so every voice keeps a clause that is true of the hedged step and of the confident one: it might not stay, or she will say so if it does.
**Fixed in all four voices:** something her coach asks for has started to make sense to her, and she is not promising it will last. Each invite reply carries the same fact: the instruction is about where to be before the ball arrives. The respond stance takes the parent's gladness and the third says it need not last to be good news; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"Something my coach asks for has started to make sense. I'm trying not to say it too loudly."` |
| `fiery` | `"I think I finally get what my coach has been asking for. Don't make a fuss. It might not stay."` |
| `deep` | `"Something my coach asks for has begun to make sense. I wanted to tell you, and I did not want to promise it will last."` |
| `quiet` | `"My coach asked for the same thing twice. It made sense both times."` |

**Parent:** *Ask what has started to make sense* · *Say you are glad it makes sense* · *Say it does not have to last to be good news*

**invite** · *Ask what has started to make sense*
- `sunny` `"Where to be before the ball arrives. It sounded like nothing until I saw what it was for."`
- `fiery` `"Where to be before the ball arrives. Obvious, I know. It wasn't obvious until it was."`
- `deep` `"Where to be before the ball arrives. It is a small thing. I have been turning it over, and it fits."`
- `quiet` `"Where to be before the ball arrives. I wrote it down so I wouldn't lose it."`

**respond** · *Say you are glad it makes sense*
- `sunny` `"Thanks. I wanted somebody to know. I'm keeping it quiet everywhere else."`
- `fiery` `"Good. Be glad quietly. If it goes, I don't want to explain it."`
- `deep` `"Thank you. I wanted somebody to know before I knew whether it holds."`
- `quiet` `"Thanks. I only wanted to mention it."`

**space** · *Say it does not have to last to be good news*
- `sunny` `"That's fair. It's nice this week, even if it doesn't stay."`
- `fiery` `"Fine. It's good news right now. If it stays, I'll say so."`
- `deep` `"I know. I would still like it to stay. I'll try not to hold on too tightly."`
- `quiet` `"True. I'll take it while it's here."`

### R68 · `practice-feels-different` · observation · school, after-school, independent · **fact: `coach-feel-unsure`**
**Kernel:** Practice with her coach feels different, and she cannot tell yet whether different is better. She says exactly that and asks the parent for nothing.
**Authoritative claims:** `coach-feel-unsure` – she has a coach and her feel is `unsure`, the owner's «я пока не очень поняла». It licenses that she has not made up her mind – **not** that anything about the training changed (the engine models no session), and not that it is better or worse. ⚠ The one thing a reply names as different is the ORDER of a session, the hard part first: a texture of the sentence that nothing in the engine reads and no button asks the parent to confirm.
**Fixed in all four voices:** practice with her coach feels different, and she cannot tell yet whether that is better. Each invite reply carries the same fact: the order of the session changed and the hard part comes first. The respond stance takes the parent's patience and the third lets her keep noticing; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"Practice with my coach feels different. I can't tell yet if different is better."` |
| `fiery` | `"Practice with my coach is different. Better or worse, I can't say, and it's annoying."` |
| `deep` | `"Practice with my coach has changed in a way I cannot name. I do not know yet if it is better. I keep waiting to know."` |
| `quiet` | `"Practice with my coach felt different this week. I haven't worked out if that's good."` |

**Parent:** *Ask what is different* · *Say it can take a while to know* · *Say she can just keep noticing*

**invite** · *Ask what is different*
- `sunny` `"The order, mostly. We do the hard part first now. I can't decide if I like it."`
- `fiery` `"The order. The hard part comes first now. I'd like a reason and I haven't got one."`
- `deep` `"The order of things. The hard part comes first now. I am still deciding what I think of it."`
- `quiet` `"The order. The hard part comes first."`

**respond** · *Say it can take a while to know*
- `sunny` `"That's what I'm hoping. I'll keep showing up and see."`
- `fiery` `"A while isn't an answer. Fine. I'll give it a while."`
- `deep` `"I know. I only wanted to say that I don't know yet."`
- `quiet` `"Probably. I'll give it time."`

**space** · *Say she can just keep noticing*
- `sunny` `"I can do that. Noticing is the easy part. Deciding is the hard part."`
- `fiery` `"Noticing, fine. I'll keep track."`
- `deep` `"Yes. I will keep noticing, and I will say when I know."`
- `quiet` `"Okay. I'll keep an eye on it."`

### R69 · `the-thing-she-cannot-name` · worry · school, after-school, independent · **fact: `coach-feel-cold`**
**Kernel:** Practice with her coach is fine, but something is not landing. She cannot name it and has not found a way to say it that is fair, so she brings it as a feeling and not as a complaint.
**Authoritative claims:** `coach-feel-cold` – she has a coach and her feel stands on the cold side, `seems-off` or `off`, the owner's «вроде нормально, но…». It licenses that something is not landing for her – **not** that the coach is bad, that anything is wrong, or what the something is. ⚠⚠ His register is doubt and never «всё плохо»: every voice says practice is FINE first, calls the thing small and unnamed, and one of them says outright that she does not want to be unfair to her coach by guessing. The confident step (`off`) reads the same row: a girl who is sure something is wrong may still be unable to say it, which is the honest version of both.
**Fixed in all four voices:** practice with her coach is fine, something small and unnamed does not land, and she has not said it. Each invite reply carries the same fact: she cannot tell what it is, it is small, and it keeps coming back. The respond stance takes the parent's having felt that way before and the third lets her say it once she knows what it is; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"Practice with my coach is fine. It really is. There's just something I can't quite put into words."` |
| `fiery` | `"Practice with my coach is fine. That's the verdict. I just have a feeling something isn't landing, and I don't know how to say it."` |
| `deep` | `"Practice with my coach is fine. It is only that something does not land, and I have not found a way to say it that is fair."` |
| `quiet` | `"Practice with my coach was fine. I keep thinking there's something I haven't said."` |

**Parent:** *Ask what she thinks is not landing* · *Say you have felt that way before* · *Say she can find the words once she knows what it is*

**invite** · *Ask what she thinks is not landing*
- `sunny` `"I can't tell. It isn't big. It's small and it keeps showing up."`
- `fiery` `"If I knew, I'd have said it. It's small, it keeps coming back, and that's what's annoying."`
- `deep` `"I cannot tell. It is small, and it comes back. I do not want to be unfair to my coach by guessing."`
- `quiet` `"I can't tell. It's small. It keeps coming back."`

**respond** · *Say you have felt that way before*
- `sunny` `"Have you? That's a relief. I thought I was just making a fuss."`
- `fiery` `"Then you know it isn't nothing. I'm not making it up."`
- `deep` `"I thought it might only be me. It helps to know it isn't."`
- `quiet` `"Okay. Knowing that helps a bit."`

**space** · *Say she can find the words once she knows what it is*
- `sunny` `"Okay. That takes the pressure off. I'll say it when I can."`
- `fiery` `"Fine. But it's going to come out one way or another."`
- `deep` `"Thank you. I would rather say it once, and say it properly."`
- `quiet` `"Okay. I'll say it when I know what it is."`

## Addendum 14.10 (round 52, builder H2) – six stint situations: she brings up the coach again at half a year and at a year together, and which of the three depends on how she feels about it

**Superseded in part, 15.10 (J6).** The owner narrowed the two windows below on his review of R71 and R73 to R75: half a year is now weeks together 24 to 31 (not 24 to 43) and a year is weeks 48 to 63 (not 48 and later). The tables and the paragraph «Why those weeks» below are the record of 14.10; the current numbers are in «Addendum, round 52 J6 (15.10)», at the end of the H3 section.

**The owner, 14.10:** «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять». Earlier the same day, on how sure she may sound: «не "всё плохо" а "я пока не очень поняла" или "вроде нормально, но"… она еще не уверена, а просто сомневается».

**What this is.** The first three coach-feel situations (R67–R69) are her first impression, heard in the weeks after the six that count as too early. The owner wants her voice on the coach during the first year or two of a stint, not once in a career. This addendum adds the other two checkpoints of the design in `docs/rounds/round-52.md` (weeks together 12, 32 and 56): three situations for **half a year** (R70–R72) and three for **a year together** (R73–R75), each behind one side of the same feel (`coachFeel`) and now also behind the stint's age. The mechanism that brings them up at the checkpoint weeks is a separate item; until it lands, they come up in ordinary small talk, whenever their fact is true.

| row | subject | stages | fact | what it is |
| --- | --- | --- | --- | --- |
| R70 `half-a-year-and-it-fits` | good-news | school, after-school, independent | `coach-feel-warm-half` | months in, practice with her coach fits her; the drill changed twice this month just as she was getting restless |
| R71 `half-a-year-and-still-unsure` | observation | school, after-school, independent | `coach-feel-unsure-half` | half a year and she still cannot say whether it is the right coach; her answer changes from one month to the next |
| R72 `months-in-and-still-waiting` | worry | school, after-school, independent | `coach-feel-cold-half` | practice is fine, and months in she is still waiting for it to click; she blames nobody |
| R73 `a-year-and-she-would-not-swap` | good-news | school, after-school, independent | `coach-feel-warm-year` | a year in, she would not change it; every session starts with a question about what she wants to work on |
| R74 `a-year-and-she-still-does-not-know` | decision | school, after-school, independent | `coach-feel-unsure-year` | a year and she still does not know; she asks whether they should look around, which would only mean looking |
| R75 `a-year-in-we-need-to-talk` | decision | school, after-school, independent | `coach-feel-cold-year` | practice is fine and a year in it still is not working; she thinks they should talk about whether this is the right coach |

**The six facts.** Each is the side of the scale R67–R69 use, with a window of weeks together added. The side is read from `coachFeel(world)` and nothing else (the parity law of R67–R69). The window is `world.week` minus `coachSinceWeek(world)`, the stint's age, which restarts on every hire and every release, so a new coach is a new first impression and then a new half year.

| fact | true when | false on |
| --- | --- | --- |
| `coach-feel-warm-half` | weeks together 24 to 43, feel `seems-good` or `good` | any other week; `too-early`, `unsure`, `seems-off`, `off`; no coach; college |
| `coach-feel-unsure-half` | weeks together 24 to 43, feel `unsure` | any other week; `too-early`, `seems-good`, `good`, `seems-off`, `off`; no coach; college |
| `coach-feel-cold-half` | weeks together 24 to 43, feel `seems-off` or `off` | any other week; `too-early`, `unsure`, `seems-good`, `good`; no coach; college |
| `coach-feel-warm-year` | weeks together 48 or more, feel `seems-good` or `good` | before week 48; the other sides; no coach; college |
| `coach-feel-unsure-year` | weeks together 48 or more, feel `unsure` | before week 48; the other sides; no coach; college |
| `coach-feel-cold-year` | weeks together 48 or more, feel `seems-off` or `off` | before week 48; the other sides; no coach; college |

**Why those weeks.** Her feel is redrawn every four weeks (`COACH_FEEL.periodWeeks`), and the checkpoints 12, 32 and 56 are multiples of four, so the feel has just been read on the week a checkpoint arrives. The half-year window opens at 24 (six periods, half a year rounded down to a period), so the checkpoint at 32 sits eight weeks inside it, and it closes at 44 (eleven periods), twelve weeks after the checkpoint: room for the mechanism to try again if the checkpoint week is taken by another beat. It closes four weeks before the year window opens at 48 (twelve periods, a year rounded down to a period; the checkpoint at 56 sits eight weeks inside), so a line that says «months» is never heard beside one that says «a year». The year window has no end: «a year» is a floor and the stint does not get younger. ⚠ That makes «a year in» loose in a stint of three years; if the owner wants it tighter it is one constant (`COACH_TALK_YEAR_UNTIL_WEEK`).

**Where they sit.** Last in this document, after R69, so the catalogue's first 68 rows keep their order. A situation is chosen by position in the filtered pool, so a pool of a different length reads a different position for the same seed: a career already under way may be shown a different situation next time than it would have been. That draw is on its own sub-stream (`seed:life:smalltalk:situation:<week>`), nothing is stored and the main stream does not move.

**Stages and facts.** School, after-school and independent, **not college**, for the reason R67–R69 give: the coach does not work in college weeks, and each fact refuses college besides (the same `inCollege` the other coach-feel facts use; the leaf that holds the six is handed it by the hub, so there is one spelling of that question). `too-early` has no row, and with nobody employed `coachFeel` is `null` and every fact is false.

**Subjects, by this document's own definitions.** R70 and R73 are good news: something good she brings home, kept small and true. R71 is an observation: something she noticed about herself, and she asks the parent for nothing. R72 is a worry: small, hers, not a crisis. R74 and R75 are decisions: a choice she wants to talk through. Here the choice is whether to look at other coaches, and the conversation is all it is. Nothing in these rows opens the coach market, hires or releases anyone, and no answer moves the bond, her spirits or the coach pair (ruling V2: her answers move nothing). Each subject keeps every row it had; the six new rows join a cell only while their fact is true.

**What the lines were written against.**

- **The gate licenses a feeling and nothing else.** She may say how it feels to be with this coach after months or a year; she may not say that the coach is good or bad, that she has improved or fallen back (the fog law, R45), or any result. Where a line says the drill changed, it is a texture of her telling, which nothing in the engine reads (the engine models no session).
- **His register is doubt and never a verdict.** The cold rows (R72, R75) say practice is FINE first, in every voice, as R69 does, and then that it has not clicked or is not working for her. R72 says outright that she blames nobody; R75 asks to TALK and does not ask for anyone to go. The unsure rows say she cannot tell, and R71 says her answer moves from month to month, which is what the feel does (it is redrawn every four weeks). A girl who is sure (`good`, `off`) reads the same row as a girl who is not (`seems-good`, `seems-off`): the lines are true of both.
- **The age is said in words that match the window.** The half-year rows say «months» or «half a year», never «a year»; the year rows say «a year» and never «months». The test keeps that, so a line cannot contradict the weeks the fact stands on.
- **The coach is never pronoun-ed and never gendered (R15-7).** «My coach» and «the coach» as nouns only, and no line that names the coach carries a third-person pronoun. The Russian keeps the same discipline: no past-tense verb or adjective takes the coach as its subject (where the English says the coach changed the drill, the Russian says the drill was changed).
- No «today», no exclamation mark (the fiery voice carries its edge in short verdicts), no digit, no long dash. Her replies describe what she noticed or what she will do with the thought, never a pattern of her own tennis (R34's finding).
- The facts are the same in all four voices. Each invite reply adds one fact of its own, and the respond and space replies add none.
- Every new line was searched for in `src/` before it was emitted (round 51's «Nobody argued.» sat in `albumCorpus.ts` too and turned an album test red at the closing gate); the sweep is kept in `tests/r52-coach-feel-talk.test.ts`.

**The arithmetic after these six**, derived by `tools/small-talk-corpus-parse.ts` rather than carried: 74 rows, 296 openers, 222 labels, 888 replies and 20 shared beats (a good news, an observation, a worry and a decision have no second beat). The figures in the older sections are of the 51, 55, 58, 61, 65 and 68 and stay as the record of the passes that produced them.

**Measured after** (14.10, the tree this addendum ships with).

**The facts and the roll.** Over a grid of five careers, fourteen weeks and seven chemistry levels that reaches all six steps of the scale and both sides of every window edge (weeks 23|24, 43|44 and 47|48), each fact is true exactly when her feel is on its side and the stint is inside its window. Cut down to the six rows, the shipped roll raises each of them on a pose where its fact is true, raises a half-year row only on weeks 24 to 43 and a year row only from week 48, and none of the answers moves the bond, her spirits or the coach pair. A stint counted from the last hire reads the same: let go and hired back at week 100, week 124 is a half-year week and week 148 a year week. Six deliberate breaks of the leaf `coachFeel.ts`, each restored byte for byte, turn the test file red: the half-year window closing at 48 instead of 44 (5 tests), the year window opening at 44 instead of 48 (5), the cold year reading `unsure` as well (7), the college clause removed (1), and each edge moved by one week (4 and 6).

**K4** (`npm run bench:smalltalk -- --seeds 60`): every cell passes. The six rows list school, after-school and independent, so each of those three stages gains two good news, one observation, one worry and two decisions; the reachable cells now read school 6 / 5 / 5 / 5, after-school 7 / 6 / 6 / 7 and independent 11 / 9 / 9 / 9 (good news / observation / worry / decision), and college is unchanged at 8 / 7 / 7 / 7 because the rows do not list it. **K2 and K3:** zero repeats wherever an alternative existed, in the posed career (adjacent 104/2340 → 0, within three 232/2340 → 0) and the bare one (115/2340 → 0, 233/2340 → 0) alike. **K5:** 74 situations · 296 voice columns; 29 voice columns flagged "never drawn": the three `march-entry-open` ones as before, eight of R67–R69 and eighteen of the new six. That is rarity and not unreachability: the bench's posed career poses a coach but neither a feel nor a stint age, and the half-year window is twenty weeks long.

**How often a player meets one, before any checkpoint mechanism – still rare.** On played, coached careers (7 presets that start with a coach × 6 careers × 312 weeks = **252 coached years**; `R52_F4_SCALE=big R52_F4_REPORT=1 npx vitest run --project unit tests/r52-coach-feel-talk.test.ts -t "H2 R|H2 M"`) she talked 304 times and **16** of those conversations were a stint row: **0.063 a coached year**, against 0.052 for the three first-impression rows (13), so any of the nine coach-feel rows comes up about **0.115 a coached year – once in nine coached years**, where R67–R69 alone were once in nineteen. On the walk of the same file (36 careers × 24 years, a close bond, her level posed) the draw hands out 102 stint rows: `a-year-and-she-still-does-not-know` 41, `a-year-in-we-need-to-talk` 37, `a-year-and-she-would-not-swap` 22, `months-in-and-still-waiting` 2 and the two other half-year rows **none**, every one with its fact true at the roll. The half-year rows are the rare ones by construction: their window is twenty weeks of a stint, about one conversation, and each is one row among several in its subject. Ordinary small talk will not put the owner's «half a year» in front of a player; the checkpoint mechanism is what does, and that is the next item.

**What it costs the pins that read the draw.** The six rows join a coached career's pool for part of every stint, and a situation is picked by position in the pool, so the digest pins that hash a played career move again (coach-travel-edge, succession-s1-start-year, the l3-7 twin and PICK-STABILITY in i18n-l3-5). They are not re-stamped here; with the six facts forced to false all thirteen of those files are green, which is the control that the rows, and nothing else in the change, moved them.

### R70 · `half-a-year-and-it-fits` · good-news · school, after-school, independent · **fact: `coach-feel-warm-half`**
**Kernel:** A few months into the stint, practice with her coach fits her. She is glad of it and says so plainly. She does not say the coach is the best, or that she has improved; only that it fits.
**Authoritative claims:** `coach-feel-warm-half` – she has a coach, they have been together at least twenty-four weeks and fewer than forty-four, and her feel for the coach stands on the warm side of the scale, `seems-good` or `good`. It licenses that the arrangement fits her – **not** that the coach is good, that she has improved (the fog law, R45) or any result. ⚠ One set of lines serves both steps, so every voice keeps a clause that is true of the hedged step and of the confident one: «seems to», «so far», «I don't think».
**Fixed in all four voices:** a few months in, practice with her coach fits her, and she says it plainly. Each invite reply carries the same fact: twice this month the drill changed just as she was getting restless, and she had not said anything. The respond stance takes the parent's gladness and the third lets her leave it unexplained; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"A few months in, and practice with my coach just fits. I noticed this week. I wanted you to know."` |
| `fiery` | `"Months in, and practice finally makes sense. My coach seems to know what I need before I do. I'll only say it once."` |
| `deep` | `"Months in, practice with my coach fits. I checked it against how I felt last month and the month before. It has held so far."` |
| `quiet` | `"It's been a few months. I stopped looking at the clock in practice with my coach, and I only noticed this week."` |

**Parent:** *Ask what she has noticed* · *Say you are glad it fits* · *Say she does not have to explain it*

**invite** · *Ask what she has noticed*
- `sunny` `"Twice this month my coach changed the drill right when I was getting restless. I hadn't said anything. It's a small thing, but I noticed."`
- `fiery` `"Twice this month my coach changed the drill right as I got restless. I hadn't said a word. Make of that what you like."`
- `deep` `"Twice this month my coach changed the drill at the moment I began to get restless. I had said nothing. I have thought about that more than I expected to."`
- `quiet` `"Twice this month my coach changed the drill when I was getting restless. I hadn't said anything."`

**respond** · *Say you are glad it fits*
- `sunny` `"Thanks. It's nice to say it out loud to someone."`
- `fiery` `"Good. So am I. Don't make a thing of it."`
- `deep` `"Thank you. I waited a while to say it, so that it would not be something I said in a good week."`
- `quiet` `"Thanks. I just thought you should know."`

**space** · *Say she does not have to explain it*
- `sunny` `"Okay, good, because I can't. It just fits."`
- `fiery` `"Good, because I can't. It fits. That's the whole report."`
- `deep` `"I could not explain it if I tried. It fits, and I am content to leave it there."`
- `quiet` `"Okay. It just fits."`

### R71 · `half-a-year-and-still-unsure` · observation · school, after-school, independent · **fact: `coach-feel-unsure-half`**
**Kernel:** Half a year with her coach, and she still cannot say whether it is the right one. She says exactly that and asks the parent for nothing. What she has noticed is about her own mind: the answer changes from one month to the next.
**Authoritative claims:** `coach-feel-unsure-half` – she has a coach, they have been together at least twenty-four weeks and fewer than forty-four, and her feel is `unsure`: the owner's «я пока не очень поняла», at half a year. It licenses that she has not made up her mind – **not** that this is the wrong coach, that anything about the training changed, or that she is better or worse. ⚠ «From one month to the next» is the engine's own truth said as a texture and not a number: her doubt is redrawn every four weeks.
**Fixed in all four voices:** half a year with her coach, and she still cannot say whether it is the right one. Each invite reply carries the same fact: her answer changes from one month to the next. The respond stance takes the parent's view that half a year is not long, and the third lets her not know yet; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"It's been half a year with my coach, and I still can't tell if it's the right fit. I thought I'd know by now."` |
| `fiery` | `"Half a year with my coach and I still can't say if it's the right one. You'd think I'd know by now."` |
| `deep` | `"Half a year with my coach, and I have tried more than once to decide whether it is the right one. I cannot. Nothing has settled it either way."` |
| `quiet` | `"Half a year with my coach, give or take. I'm still not sure what I think."` |

**Parent:** *Ask what keeps her unsure* · *Say half a year is not that long to know* · *Say she does not have to know yet*

**invite** · *Ask what keeps her unsure*
- `sunny` `"It changes. Some months I'd say yes straight away, and the next month I'm not so sure. It doesn't settle."`
- `fiery` `"It changes. One month I'd say yes, the next I'd say I don't know. It refuses to hold still. I'd like it to pick a side."`
- `deep` `"My answer changes from one month to the next. In one I am nearly sure, and in the next I am not. I cannot find what moves it."`
- `quiet` `"It changes month to month. This month I'm not sure."`

**respond** · *Say half a year is not that long to know*
- `sunny` `"Maybe not. I just thought it would be clearer by now."`
- `fiery` `"Maybe. Half a year feels like plenty to me. Fine. I'll give it longer."`
- `deep` `"Perhaps. I would still have liked to know by now. I will try to be patient with not knowing."`
- `quiet` `"Maybe. I'll wait and see."`

**space** · *Say she does not have to know yet*
- `sunny` `"That helps. I'll stop quizzing myself every week."`
- `fiery` `"Good. Then I'll stop asking myself every week. It hasn't helped."`
- `deep` `"Thank you. It is a relief to be allowed not to know. I will say so when I do."`
- `quiet` `"Okay. I'll let it be for now."`

### R72 · `months-in-and-still-waiting` · worry · school, after-school, independent · **fact: `coach-feel-cold-half`**
**Kernel:** Months in, practice with her coach is fine, and she keeps waiting for it to click. It has not. She does not blame anyone, and she brings it as a worry and not as a complaint.
**Authoritative claims:** `coach-feel-cold-half` – she has a coach, they have been together at least twenty-four weeks and fewer than forty-four, and her feel stands on the cold side, `seems-off` or `off`: the owner's «вроде нормально, но…», at half a year. It licenses that it has not clicked for her yet – **not** that the coach is bad, that anything is wrong, or what would make it click. ⚠⚠ His register is doubt and never «всё плохо»: every voice says practice is FINE first, as R69 does, says «yet» or «not really», and the invite reply says she blames nobody. The confident step (`off`) reads the same row.
**Fixed in all four voices:** months in, practice is fine, and she keeps waiting for it to click. Each invite reply carries the same fact: she is waiting for it to feel as though she and her coach are working on the same thing, and she blames nobody. The respond stance takes the parent's having waited for something too, and the third lets her decide nothing yet; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"It's been a few months and practice with my coach is fine. I'm still waiting for it to click, though. It hasn't yet."` |
| `fiery` | `"It's been months. Practice with my coach is fine. I keep waiting for it to click. It hasn't, not really."` |
| `deep` | `"Practice with my coach has been fine for months. I keep waiting for it to click. Lately I have started to wonder whether it will."` |
| `quiet` | `"Months now, and practice with my coach is still fine. I keep waiting for it to be more than fine."` |

**Parent:** *Ask what she is waiting for* · *Say you have waited for something to click too* · *Say she does not have to decide anything yet*

**invite** · *Ask what she is waiting for*
- `sunny` `"For it to feel like we're working on the same thing. I can't say it any better than that. I'm not blaming anyone."`
- `fiery` `"For us to be working on the same thing. That's all. It's nobody's fault, so you can skip that question."`
- `deep` `"For it to feel as if we are working on the same thing. I do not blame anyone for that. I only notice that it has not come."`
- `quiet` `"For it to feel like we're working on the same thing. I'm not blaming anyone."`

**respond** · *Say you have waited for something to click too*
- `sunny` `"Did you? That helps, actually. I was worried I was being picky."`
- `fiery` `"Then you know. It isn't nothing. It just sits there."`
- `deep` `"Did you? Then I am a little less afraid that it is only me."`
- `quiet` `"Oh. Okay. That helps a little."`

**space** · *Say she does not have to decide anything yet*
- `sunny` `"Good. I wasn't going to. I just needed to say it somewhere."`
- `fiery` `"I wasn't going to decide anything. I just wanted it said."`
- `deep` `"I know. I am not deciding. I only did not want to carry it alone."`
- `quiet` `"Okay. I wasn't going to."`

### R73 · `a-year-and-she-would-not-swap` · good-news · school, after-school, independent · **fact: `coach-feel-warm-year`**
**Kernel:** A year with her coach, and she would not change it. She says so plainly, as something she has noticed and is glad of. She does not say the coach is the best, or that she has improved; only that she would not swap.
**Authoritative claims:** `coach-feel-warm-year` – she has a coach, they have been together at least forty-eight weeks, and her feel stands on the warm side of the scale, `seems-good` or `good`. It licenses that she would stay – **not** that the coach is good, that she has improved (the fog law, R45) or any result. ⚠ One set of lines serves both steps: the hedged ones say «I don't think I'd», the confident ones say it flat, and every invite reply is true of both.
**Fixed in all four voices:** a year with her coach, and she would not change it. Each invite reply carries the same fact: every session starts with her coach asking what she wants to work on, and after a year she still has an answer ready. The respond stance takes the parent's gladness and the third lets her simply enjoy it; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"A whole year with my coach already. I don't think I'd change a thing."` |
| `fiery` | `"A whole year with my coach. I wouldn't swap it. There. I said it."` |
| `deep` | `"A year with my coach. I have asked myself whether I would change it, more than once, and each time the answer was no."` |
| `quiet` | `"A year with my coach, give or take. I wouldn't change anything."` |

**Parent:** *Ask what she would miss* · *Say you are glad it has gone this way* · *Say it is fine to just enjoy it*

**invite** · *Ask what she would miss*
- `sunny` `"How my coach starts every session by asking what I want to work on. A year of it, and I still have an answer ready."`
- `fiery` `"How every session starts. My coach asks what I want to work on. A year of that, and I still have an answer ready."`
- `deep` `"That every session begins with my coach asking what I want to work on. I have answered that question for a year, and it has never been an empty ritual."`
- `quiet` `"That every session starts with a question about what I want to work on. I've always had an answer."`

**respond** · *Say you are glad it has gone this way*
- `sunny` `"Me too. I didn't know a year could feel this short."`
- `fiery` `"Good. I'm glad too. Don't tell my coach I said so."`
- `deep` `"Thank you. A year is long enough for me to trust it, and I did not expect to say that."`
- `quiet` `"Thanks. Me too."`

**space** · *Say it is fine to just enjoy it*
- `sunny` `"Okay. That's what I'll do."`
- `fiery` `"I will. I'm not going to analyse it."`
- `deep` `"I will try. I tend to look for the catch, and I would like to stop."`
- `quiet` `"Okay. I will."`

### R74 · `a-year-and-she-still-does-not-know` · decision · school, after-school, independent · **fact: `coach-feel-unsure-year`**
**Kernel:** A year with her coach, and she still does not know whether it is the right one. She has started to wonder whether they should look around, and she asks the parent what they think. It is a question and not a request.
**Authoritative claims:** `coach-feel-unsure-year` – she has a coach, they have been together at least forty-eight weeks, and her feel is `unsure`. It licenses that she has not decided and would like to talk about looking – **not** that this is the wrong coach, or that anyone should be replaced. ⚠ **Nothing here opens the coach market, hires or releases anyone**: «look around» is a thing she asks, and what the parent does with it is the parent's.
**Fixed in all four voices:** a year with her coach, she still does not know, and she asks whether they should look around. Each invite reply carries the same fact: looking around would only mean looking, to see who else is out there, and she is not saying leave. The respond stance takes the parent's offer to look together and the third takes the parent's saying there is no hurry; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"It's been a year with my coach, and I honestly can't tell if it's right. Should we maybe look around?"` |
| `fiery` | `"A year with my coach and I still don't know. Should we be looking around?"` |
| `deep` | `"A year with my coach, and I still cannot say whether it is the right one. I have started to think we should look around, and I wanted to ask you before I decided anything."` |
| `quiet` | `"A year with my coach, give or take. I still don't know. Do you think we should look around?"` |

**Parent:** *Ask what looking around would mean* · *Say you could look around together* · *Say there is no hurry to decide*

**invite** · *Ask what looking around would mean*
- `sunny` `"Only looking. Seeing who else is out there. I'm not saying leave. I'd just like to know what the choice is."`
- `fiery` `"Looking. That's all. Not leaving. I want to see what else there is, so that staying is a choice and not a habit."`
- `deep` `"Only looking. I am not asking to leave. I would like to know what else exists, so that if I stay, I stay because I chose it."`
- `quiet` `"Just looking. Not leaving. I'd like to know what else there is."`

**respond** · *Say you could look around together*
- `sunny` `"Together would be better. I wouldn't know where to start."`
- `fiery` `"Together. Good. But I'm the one who says yes or no."`
- `deep` `"I would like that. I would not want to do it alone, and I would not want it done for me."`
- `quiet` `"Okay. Together is good."`

**space** · *Say there is no hurry to decide*
- `sunny` `"That's a relief. I'll keep going and see how it feels."`
- `fiery` `"Fine. No hurry. But I'm not going to wonder forever."`
- `deep` `"Thank you. I will keep going to practice and keep watching how I feel. I will tell you when it settles."`
- `quiet` `"Okay. I'll keep going and see."`

### R75 · `a-year-in-we-need-to-talk` · decision · school, after-school, independent · **fact: `coach-feel-cold-year`**
**Kernel:** A year in, practice with her coach is fine, and it still is not working for her. She thinks they should talk about it. She has not decided anything, and she wants the parent in the conversation.
**Authoritative claims:** `coach-feel-cold-year` – she has a coach, they have been together at least forty-eight weeks, and her feel stands on the cold side, `seems-off` or `off`. It licenses that she wants to talk – **not** that the coach is bad, that anything is wrong, or that the coach must go. ⚠⚠ This is the owner's «тот тренер или лучше поменять» put into her mouth as a conversation, and it keeps his register: practice is FINE first, in every voice; it still does not land; and she asks to TALK. The confident step (`off`) reads the same row, because a girl who is sure something is not working may still not know the answer. Nothing here opens the coach market, hires or releases anyone.
**Fixed in all four voices:** a year in, practice is fine and it still is not working for her, and she thinks they need to talk about it. Each invite reply carries the same fact: what she wants to talk about is whether this is the right coach for her, and she does not know the answer. The respond stance takes the parent's wish to talk it through and the third lets her start when she is ready; neither adds a fact.

| voice | opener |
| --- | --- |
| `sunny` | `"A year in, and practice with my coach is fine, but it still isn't working for me. I think we should talk about it."` |
| `fiery` | `"A year in. Practice with my coach is fine, and it still isn't working. I think we need to talk about it."` |
| `deep` | `"Practice with my coach has been fine for a year, and it has never quite felt right. I have thought about this for a long time, and I think we need to talk."` |
| `quiet` | `"A year of practice with my coach, give or take. It's fine, and it still isn't working. Can we talk about it?"` |

**Parent:** *Ask what she wants to talk about* · *Say you would like to talk it through* · *Say she can start whenever she is ready*

**invite** · *Ask what she wants to talk about*
- `sunny` `"Whether this is the right coach for me. I don't know the answer. I only know I can't keep not asking."`
- `fiery` `"Whether this is the right coach for me. I don't have the answer. I'm done pretending I'm not asking."`
- `deep` `"Whether this is the right coach for me. I do not know the answer, and I do not think it is anyone's fault. I only know I cannot go on not asking."`
- `quiet` `"Whether this is the right coach for me. I don't know. I just can't keep not asking."`

**respond** · *Say you would like to talk it through*
- `sunny` `"Thank you. I was a bit scared to bring it up."`
- `fiery` `"Good. That's all I wanted. Talking. We can argue about the rest later."`
- `deep` `"Thank you. I was afraid that asking would sound like an accusation. I only want it to be a question."`
- `quiet` `"Okay. Thanks. I'd like that."`

**space** · *Say she can start whenever she is ready*
- `sunny` `"Okay. I want to find the words first."`
- `fiery` `"Fine. Soon, though. I've waited a year already."`
- `deep` `"Thank you. I will say it when I can say it without making it worse."`
- `quiet` `"Okay. I'll let you know."`

---

## Addendum 14.10 (round 52, builder H3) – the stint checkpoints: her talk about the coach arrives on its own at weeks 12, 32 and 56 of a stint

**Superseded in part, 15.10 (J6).** The half-year checkpoint moved from week 32 to week 28 on his review of R71, so the checkpoints are now 12, 28 and 56, and the half-year window ends at 32. The numbers in this addendum (the rules table, the sides at week 32, the measurements and the pin table) are the record of 14.10; see «Addendum, round 52 J6 (15.10)» below.

**The owner, 14.10:** «на тему смол-тока – нам это важно и критично как раз знать не один раз в 19 лет, а в первые год-два сотрудничества, чтобы понять это "тот" тренер или лучше поменять. Давай что-то на эту тему решим.»

**What this is.** R67–R75 are nine situations about the coach, and until now they came up in ordinary small talk, on the lottery: H2 measured 0.063 of them a coached year (16 conversations in 252 coached years), and the half-year rows did not drop once in 36 careers. This addendum adds the mechanism the design in `docs/rounds/round-52.md` asks for. At **12, 32 and 56 weeks together** (about three months, seven and thirteen) the roll asks first whether a checkpoint is due, and if one is, she brings up the coach on that week and does not wait for the die. The weeks are `COACH_TALK_CHECKPOINTS` in `src/engine/world/coachFeel.ts`; the due-check and the raise are `coachTalkCheckpointDue` and `raiseCoachCheckpointTalk` in `src/engine/world/lifeBeat/smallTalk.ts`, called on the first line of `rollSmallTalk`. No string changed (the rows exist) and nothing is persisted (no schema move).

**The rules, as built.**

| rule | as built | why |
| --- | --- | --- |
| when | a week whose weeks together `w` has `cp <= w < cp + 4`, for cp in 12 / 32 / 56 | each checkpoint is a multiple of the feel period (4), so her feel was just re-read that week; 32 and 56 sit inside the half-year and year windows of H2, and the window is one period long |
| once | the checkpoint is **said** when a small-talk row of one of its three situations was raised at a week at or after `coachSinceWeek + cp`; read off the life log | the log is the memory, as it is for the season tally; a row the lottery raised inside the window counts, one raised before it does not; a re-hire or a release moves the stint start, so a new coach restarts all three |
| which row | the one of the checkpoint's three situations that `reachableSituations` says is reachable now: her real feel, the stint's window, the stage and her voice have already said which | one spelling of her side, not a second table of sides next to the facts; `too-early` and college are on no side |
| if the week is taken | a live card or a pending beat holds the week; she tries again **the next week** of the window | the lottery's own two guards, `liveSoftBeat` and `pendingLifeBeat`: one thing at a time |
| after the window | the checkpoint is **skipped for good** | «a year in» said at week 60 is no longer on time, her feel has been re-read since, and the next checkpoint is the place for the next word |
| not at | a bond band with no small talk (strained, cold: `smallTalkPerWeek` is 0); college; nobody employed | at strained and cold she does not confide, and the tile and the week notes still speak. This is a single clause in `raiseCoachCheckpointTalk` if the owner rules otherwise |
| exempt from | the weekly chance (the 8% and 4% die) and the season cap of four | it is not chatter: a talk that is **due** at a fixed week is the thing the owner asked for, and a die or a full season must not eat the one conversation that tells him whether to keep the coach. The row still lands in the log, so it counts toward the season's tally for the chatter that follows |
| draws | none on MAIN; no gate die, no subject draw and no situation draw (the pick is determined); one frame draw on its own key `seed:smalltalk:frame:<week>`, as every small-talk row has | invariant 2; the row enters the recency memory like any other, and (next row) the memory can refuse it |
| repeats | a pick that is among her **last two** small-talk rows is refused, and that week is a held week like any other | the owner's round-43 law (#8(a)): she does not repeat what she has just said. The ordinary pick keeps it by narrowing the pool; a checkpoint's pick is a pool of one, so the memory can only veto. **This rule is not in the design.** The first draft did not have it and repeated one of her last two conversations in 9 of 4728 (`tests/round51-school-story-pool.test.ts`, «the memory still holds»); the lottery had raised the same coach situation in the weeks before the window opened, where it does not count as the checkpoint's talk |

**Prediction** (written before the scale run; the two-career gate arm of the test file had been run once while the harness was built and read six windows of six, and the figures below are the reasoning, not that sample). Cohort: econ-bench presets that start with a coach, 7 presets × 6 careers × 312 weeks, in two parent arms: *answers* (a card is answered the week it is raised, so it holds nothing) and *ignores* (a card lives its three weeks unanswered).

| what is measured | predicted | reasoning |
| --- | --- | --- |
| stints that reached 60 weeks and got all three talks, among those with at least one steady-or-close week in each window | **answers 96–100%, ignores 92–99%**; the owner's target is 90% | a window is four weeks and the only things that hold a week are a pending beat (rare) and, in *ignores*, a card raised in the two weeks before (a card is live for three weeks, so it can hold the first two weeks of a window and never the last two); missing a window takes a card plus a second blocker |
| talked windows that were deferred | **answers under 5%, ignores 8–16%**; none later than three weeks | a card is raised in about 4–8% of weeks and holds the next two |
| coach talks per coached year, first two years of a stint | **with the mechanism 1.3–1.6, without it 0.05–0.5**; three talks in two years is 1.5 before gates | F4/H2 measured 0.052 and 0.063 for the rows alone; the two-career gate arm read about 0.5 without the mechanism, so the lower bound is a range |
| sides at each checkpoint, against builder F1's bench B14 at the nearest weeks | week 12: warm 24%, unsure 48%, cold 28% (B14 at 13); week 32: 26% / 38% / 36% (between B14's 26 and 52); week 56: 28% / 22% / 50% (B14 at 52). Played pairs differ from the bench's, so ±10 points | the cold share rises and the unsure share falls with the stint, which is the shape B14 measured |
| windows with no talk because the bond was strained or cold for the whole window | **under 3% of windows** | the bench policies keep the bond steady or better; this is by design and is counted, not a miss |
| windows missed for any other reason | **0–3%** | if it is more, the cause is named below |

**Measured** (14.10, the tree this addendum ships with). Two runs of the played-career harness in `tests/r52-coach-talk-checkpoints.test.ts` §H. **The scale run**, `R52_H3_REPORT=1 R52_H3_SCALE=big npx vitest run --project unit tests/r52-coach-talk-checkpoints.test.ts -t "how many stints"`: 7 presets that start with a coach × 6 careers × 312 weeks = 42 careers, each kept its founding coach, so 42 stints and every one past 60 weeks (83.2 coached years in the first two years of a stint). **The wide run** for the sides, `R52_H3_CAREERS=24 R52_H3_WEEKS=70 R52_H3_ARMS=answers R52_H3_NOOFF=1`: 168 stints. The scale run ends with vitest's own «Timeout calling onTaskUpdate» (the birpc stall the house documents for a file longer than 60 s); the test in it passed. The gate runs a two-career, 156-week arm of about five seconds.

| what is measured | predicted | measured |
| --- | --- | --- |
| stints past 60 weeks that got all three talks, among those with a steady-or-close week in every window | answers 96–100%, ignores 92–99%; the owner's target is 90% | **scale run: 40 of 40 (100%) in both arms. Wide run: 152 of 155 (98.1%).** |
| the same over ALL stints past 60 weeks, the strained-or-cold ones included | not predicted separately | scale run 40 of 42 (95.2%); wide run 152 of 168 (**90.5%**, only just over the 90%, and every point of the gap is the bond or the veto below) |
| talked windows that were deferred | answers under 5%, ignores 8–16%; none later than three weeks | answers 1 of 124 (0.8%, at +2); **ignores 15 of 124 (12.1%): 2 at +1 week, 13 at +2**; wide run 5 of 488 (1.0%, all at +2). None later than two weeks |
| coach talks per coached year, first two years of a stint | with the mechanism 1.3–1.6, without 0.05–0.5 | **with 1.575 (answers) and 1.563 (ignores); without 0.180 and 0.168** – about nine times as many. Three talks in two years is 1.5; the other 0.07 is the lottery |
| windows with no talk because the bond was strained or cold for the whole window | under 3% | scale run 2 of 126 (1.6%); wide run 13 of 504 (2.6%). Counted, not a miss: by design |
| windows missed for any other reason | 0–3% | scale run 0 of 124; wide run **3 of 491 (0.6%)** – all three are the recency veto, below |
| MAIN draws with and without the mechanism | identical | identical in all 42 careers and both parent arms: the draw count and the next three values |

**The sides at each checkpoint**, against builder F1's bench B14 at the nearest weeks (`docs/specs/the-chemistry-2026-09.md` §17.3), wide run, 488 talks:

| checkpoint | talks | warm | unsure | cold | B14 (warm / unsure / cold) |
| --- | --- | --- | --- | --- | --- |
| 12 | 166 | 38 (22.9%) | 83 (50.0%) | 45 (27.1%) | week 13: 23.9 / 47.8 / 28.4 |
| 32 | 167 | 51 (30.5%) | 65 (38.9%) | 51 (30.5%) | between weeks 26 and 52: about 25.7 / 38.5 / 35.8 |
| 56 | 155 | 65 (41.9%) | 39 (25.2%) | 51 (32.9%) | week 52: 27.9 / 23.3 / 48.8 |

(The scale run, 42 stints, has the same shape: 10 / 24 / 8 at 12, 9 / 23 / 10 at 32, 16 / 10 / 14 at 56.) **The prediction held at 12 (within 3 points) and at 32 (within 6) and MISSED at 56**: warm 14 points above the band and cold 16 below. At 155 talks a share has a standard error near 4 points, so it is not noise. The played careers' pairs are warmer a year in than B14's 1200 random pairs, so the cold talk (R75, the one that asks to talk about another coach) is met by a third of the stints against the half B14 would suggest. The mechanism reads her real feel and is indifferent to this; it is reported as a finding and was not investigated further.

**The three windows that were not talked, and why.** Each had a steady bond, a school stage and no other beat near it, and each had the same cause: the recency veto. In two of them the lottery had raised R68 (`practice-feels-different`) at week 7, the first week after the «too early» weeks, and nothing was said between; at week 12 the pick would have repeated her latest conversation. In the third the lottery had raised R71 (`half-a-year-and-still-unsure`) at week 25, a week after the half-year window opened, with nothing since; the pick at week 32 would have repeated it. So in all three the player did hear that conversation, five to seven weeks early, and the checkpoint stayed quiet instead of saying it twice. The alternative (count a same-side row from the two periods before a checkpoint as its talk) would make these three windows talked and is a rule the owner can ask for.

**What it costs the pins that read the draw.** `npx vitest run --project unit coach-travel-edge i18n-l3-7-twin succession-s1-start-year i18n-l3-5-life-beats wave3-small-talk round42-small-talk-exchange wave3-soft-surface r52-coach-feel-talk round44-corpus-roundtrip principles-a06-life-beat-direction principles-a03 import-cycles tests/condition.test.ts r51-coach-real-hunch sim-serialisation principles-b08-presence-reach round51- pin-hygiene principles-t514 world-symbol`: 34 files, 8 red, 26 green (37 tests of 505). **Control: with `COACH_TALK_CHECKPOINTS` emptied** (which `tests/r52-coach-talk-checkpoints.test.ts` §G shows is the pre-H3 roll, row for row) the same digest files are red anyway, because F4's and H2's rows had already lengthened a coached career's pool:

| file | red with the mechanism | red with it emptied | what it is |
| --- | --- | --- | --- |
| `coach-travel-edge-recent-schemas` | 10 | 10 | digests of a played coached career, v85–v94 roll-backs |
| `succession-s1-start-year` | **9** | 3 | three default careers at creation and after 110 weeks: **H3 adds 6** |
| `coach-travel-edge-late-schemas` | 8 | 8 | v77–v84 |
| `coach-travel-edge-prior-schemas` | 3 | 3 | v74–v76 |
| `coach-travel-edge` | 3 | 3 | a hired coach who stays at home |
| `i18n-l3-5-life-beats` | 1 | 1 | PICK-STABILITY, career 5/0 |
| `i18n-l3-7-twin` | 2 | 2 | the twin's two leaves, red before F4 as well (`tests/r52-coach-feel-talk.test.ts` header) |
| `round51-school-story-pool` | **1** | 0 | **not a digest: a sample floor.** «the story subject was actually drawn» wants more than 250 school stories in 120 careers × 12 years and reads 241. A checkpoint talk is a conversation of its own that counts toward the season's tally of four, so in a close-bond season with one the lottery has a slot fewer. The second case of that file, «the memory still holds», was red (9 of 4728) until the recency veto and is green |

None of them is re-stamped here: the architect harvests the digests once at the close. `tests/condition.test.ts` (the frozen MAIN capture, 41550 draws / hash `e6b0c709`) did not move, and `wave3-small-talk`, `round42-small-talk-exchange`, `wave3-soft-surface`, `r52-coach-feel-talk` and `round44-corpus-roundtrip` stay green.

**The two levers, if the owner rules otherwise.** (1) At a strained or cold bond she does not confide here; to let the talk through anyway, delete the one `smallTalkChanceFor(...) <= 0` clause in `raiseCoachCheckpointTalk`. (2) The recency veto is `repeatsOneOfHerLastTwo`; without it the three windows above are talked and she may repeat herself in about one career in thirteen (9 repeats in the 120 careers of the story-pool walk).


### Addendum, round 52 J1 (14.10) – the checkpoint the bond shut, and the silence that shows

**The ruling.** The owner approved the recommendation («давай по рекомендациям», round 52, his answers on the close, №1): at a strained or cold bond she does not confide at a stint checkpoint either – the checkpoint talk keeps the bond gate every small talk has – and **the silence shows**. A checkpoint the bond shuts leaves a note in the parent's voice on the week's diary scrap, so the player can see what the relationship cost. This is the first lever of the paragraph above, answered: the clause stays, and now it is visible.

**The rule, in five parts.**

1. *One spelling.* `bondLetsHerConfide(world)` in `world/lifeBeat/smallTalk.ts` answers «does the bond let her confide». The lottery's gate (`smallTalkEligible`), the checkpoint talk (`raiseCoachCheckpointTalk`) and the new fact all call it; the first two behave exactly as before. A test moves the table and watches all three move together.
2. *A fact, derived.* `DiaryFacts.coachTalkShut: 'strained' | 'cold'`, valued by the band like `coachFeelRead`. It is present on a week if and only if a coach is employed, a stint checkpoint is due and not yet spoken, the bond does not let her confide, and it is the first week of that checkpoint's window (weeks together equal the checkpoint: 12, 32 or 56) – ⚠ widened on 14.10 by J1b, below, to the first week of the window on which the line could be heard. So it appears once per checkpoint – at most three times in a stint's first 56 weeks – and the key is absent on every other week; an uncoached career's facts, and a coached career's at a steady or close bond, are byte-identical to what they were. Nothing is persisted and nothing is drawn (no MAIN, no new stream).
3. *Four lines*, in the parent's voice, drafts for his pass (`RU09D-CFW-11` to `-14` in Russian). The licence is the fact's band, she is at the table (`underOneRoof`), she did not travel that week (`notTravellingWeek`) and she is not laid off. It is not necessarily a plain training week: a holiday, an exam week or the off-season still has a table.

| band | line |
| --- | --- |
| strained | `Asked about the coach, she said: "Fine." Nothing after it.` |
| strained | `She did not mention the coach once. We did not know how to ask.` |
| cold | `The coach was not mentioned. She had closed up, and we left it alone.` |
| cold | `Dinner was quiet. Whatever she thinks of the coach, she kept it to herself.` |

   The doctrine of who-she-is §5b holds. At strained and cold the voices collapse into one flat pool and tier 0 (her quoted words inside the parent's story) is absent at cold, so the two cold lines carry **no words of hers**, and the strained pair has one flat-pool answer («Fine.») and one line that quotes nobody. The coach is a noun and never a pronoun (R15-7), there are no contractions, and every line fits the 80-character scrap.
4. *The lead.* In `weekNoteLine`, on a week a silence line is licensed the silence lines are the whole pool – they lead the ten coach-feel lines of F3 and everything else – and the one-in-three coin does **not** silence the week. A checkpoint is due, not chatter (H3's own reason for the talk). The coin is still drawn, from the same stream in the same order, and only its `return null` is skipped on that week, so no other week's output moves.
5. *The one narrowing the brief did not name.* The licence also requires that she is not laid off. A standing rule of this pool, pinned in `tests/week-notes.test.ts`, is that every line licensed on an injured week claims the injury («a layoff takes the note»); a checkpoint that falls in a layoff week therefore shows the injury note and not the silence. The measurement below counts those.

**Prediction, written before the measurement (J1, 14.10).** *Posed:* a coached career whose bond is held in the cold band (and, in a second arm, the strained band) for the first 60 weeks of the stint meets three shut checkpoints, at 12, 32 and 56 weeks together. The fact is present on all three (the coach and the bond are posed, nothing else can spoil it). The note prints when that first week is a roof-stage week she did not travel and was not laid off. A tournament or a journey is a large share of a junior's calendar, so I expect **50–65% of the shut checkpoints to print (1.5–1.9 of 3)**, and the shortfall to be travel (**30–45%**), a layoff (**2–8%**) and the roof stages never (**0%**, the first 60 weeks are school age). I therefore expect travel to cost **more than a quarter**, which would put the widening to the first non-travelling week in front of the architect. *Played:* shut checkpoints are rare in a played career (H3 measured 2.6% of windows with a strained or cold bond all through), so I expect about **0.02 silence notes per coached year** (range 0–0.05), and **exactly none at a steady or close bond**, where the fact cannot be present by construction.

**Measured (J1, 14.10)** with `tests/r52-checkpoint-silence.test.ts` at `R52_J1_REPORT=1`. *Posed:* presets 2 and 5, twelve careers each, the bench's `POLICIES[0]`, the bond held at cold (arm one) and at strained (arm two) for the 60 weeks after the stint began; the stint begins at a spread of weeks of the calendar (0, 5, 10, 15, ... – a coach let go and hired back, H3's fixture). *Played:* presets 1, 2, 4, 5, 6, 7 and 8, six careers each, 156 weeks, the parent answering each card the week it is raised (H3's `answers` arm), the bond left to move.

| posed, 144 shut checkpoints (24 careers x 3 checkpoints x 2 bands) | predicted | measured |
| --- | --- | --- |
| the fact present on the checkpoint's first week and on no other of the 60 | all 144 | **144 of 144** |
| the note printed | 50–65% | **62 (43.1%)** – a miss, low by seven points |
| lost to a travelling week (a tournament, a journey, the week home) | 30–45% | **78 (54.2%)** – a miss, high by nine |
| lost to a layoff | 2–8% | 4 (2.8%) |
| lost to the roof stages | 0% | 0 |
| lost for no named reason | 0 | 0 |

**Travel costs the note more than half of the shut checkpoints, well over the quarter that was the line for telling the architect.** The two bands read the same twenty-four careers (the bond does not feed the calendar), so they give identical numbers and the sample is 72 distinct checkpoints rather than 144. The first measurement began every stint at week 0 (`R52_J1_ALIGNED=1`), which puts the checkpoints on the same three calendar weeks of every career, and the bench calendar is the same in all of them: 30 printed (20.8%), 104 lost to travel (72.2%), 10 to a layoff (6.9%). The spread start is the better estimate of a hire on any week; both are far over a quarter. The bench policy enters tournaments eagerly, and a parent who plans lighter has more free weeks.

**Not built by J1, built by J1b the same day (below): the first free week of the window.** If the note could print on the first week of the four-week window that is at the table, at home and not a layoff, instead of only on the first week, the same 144 checkpoints would carry it as follows. Week 0 (as built) 62 (43%); by week 1, 100 (69%); by week 2, 112 (78%); by week 3, 130 (90%); never in the window, 14 (10%). Doing it would mean the fact lasting through the window until the checkpoint is spoken, which is a change to `coachTalkShutRead`'s first-week clause and to the "once per checkpoint" argument above, and nothing of it is built. ⚠ **Built on 14.10 by J1b, below**; the figures in this paragraph were the ceiling it was measured against.

| played, 126 coached years (6552 coached weeks) | predicted | measured |
| --- | --- | --- |
| weeks at a steady or close bond carrying the fact, or a silence line | none | **none, in 5709 weeks** |
| first weeks of a checkpoint the bond shut | – | 3 (0.024 a coached year) |
| silence notes printed | about 0.02 a coached year (0–0.05) | **0** – two on a travelling week, one in a layoff; at the 43% print share the chance of none in three is 0.19, so this is not a miss |
| the roll read a steady bond and the snapshot a strained one, or the reverse, on a checkpoint's first week (the one-week lag, `coachTalkShutRead`) | – | 0 and 0 |

A shut checkpoint is rare in a played career, as H3 found, and the note is rarer: it is a signal for the careers that have earned it, not a regular line. On that first week F3's coach-feel lines are displaced by design (the checkpoints are multiples of the feel period, so her feel is re-read the same week).

**What it costs the pins.** Three pool-size pins in `tests/i18n-l3-4-diary-corpora.test.ts` are re-aimed with a dated note (explicit rows 145 to 149, static cells 311 to 315, week notes 337 to 341), and F3's «every other line is byte-identical» pin in `tests/week-notes.test.ts` takes the four out of the rest by claim, its count (301) and hash unchanged. **Every digest family H3's table named is green with this change** (the ten `coach-travel-edge*` files, `succession-s1-start-year`, `i18n-l3-5-life-beats` with its PICK-STABILITY, `i18n-l3-7-twin`, `r51-coach-real-hunch`, `round51-school-story-pool`: 16 files, 199 tests), **and still green with the fact made absurd** (the bond clause deleted, so every coached career carries it at 12, 32 and 56). So none of them reads the week note or the diary facts, and this change gives the architect nothing to harvest there. The frozen MAIN capture (`tests/condition.test.ts`, 41550 draws, `e6b0c709`) did not move: the fact and the lines draw nothing from MAIN.

**Proved by mutation, each restored byte for byte:** dropping the bond clause from the fact, dropping the lead, dropping the coin exemption, dropping the layoff narrowing (the standing rule's own pin goes red) and re-spelling the clause in the checkpoint talk (the one-spelling arm goes red) each turn at least one arm red.

### Addendum, round 52 J1b (14.10) – the silence waits for the first week it can be heard

**The ruling.** The architect, on J1's own number: 43% is not «the silence shows». J1 measured the note on the checkpoint's first week alone and found a travelling week took 54.2% of the 144 shut checkpoints (stints begun at week 0 read 72%). So the fact is **widened**, not retuned: it is present on the **first week of the checkpoint's window (cp <= w < cp + 4) on which the line could be heard**, and on no other week. Still once per checkpoint, still derived: nothing is persisted, no schema move, zero draws, and the four lines stay exactly as they are.

**The rule, as built.** At week *w* inside the window, `coachTalkShut` is present if and only if (a) a checkpoint is due and unspoken and the bond does not let her confide (J1's clauses, unchanged; a talk she gave inside the window clears it), (b) *w* is a week the line could be heard, and (c) no earlier week *u* of the window (cp <= *u* < *w*) was. «Could be heard» is the licence's own three inputs: she is at the table (`underOneRoof`), she did not travel (`notTravellingWeek`) and she is not laid off.
- *Where it lives.* `coachTalkShutRead(world, heardAt)` in `world/lifeBeat/smallTalk.ts` owns the window arithmetic (the world's). `heardAt` is `silenceHeardAtFor(view)` in `diary.ts`, which asks `silenceCouldBeHeard` (`diary/weekNotes.ts`, the predicate the licence now uses too) of the week's journey facts. `toSnapshot` assembles the diary view first, then asks, then hands the view the fact; the world layer imports nothing new.
- *One spelling.* The week's journey facts (the events at the week, the **net** travel spend – a refunded trip nets to 0 –, «did she play», the scene of the journey home) were read inline in `assembleDiaryFacts`. They are now one pure function of the week, `weekAwayOf` in the new leaf `diary/weekAway.ts`, called by `assembleDiaryFacts` for the current week (its output byte-identical: the diary tests) and by `silenceHeardAtFor` for each earlier week. `notTravellingWeek` takes the three facts it reads rather than a whole `DiaryFacts`, so the same predicate answers both. The net travel spend also had two spellings (the diary's inline sum and `travelCentsIn`); it has one now.
- *The cap.* The look-back reaches 3 weeks. `pruneEvents` spares the newest `EVENTS_ORDINARY_FLOOR` (120) ordinary rows – the travel rows and the tournament summary are ordinary – and trims her matches oldest-first, so the last three weeks are the last to go. The arms pin it with an oracle: at every snapshot of the played careers, the reading of each of the previous three weeks taken now from the capped log is compared with the reading recorded on that week.
- *What has no history.* The roof (life stage), an injury, the bond band and the spoken state have no per-week record, so an earlier week is read with **today's** value and the approximation is counted below. A reveal in flight (`pendingUnfinished`) belongs to the current week only – the tick refuses to leave a week with one – so an earlier week is read with none.

**Prediction, written before the run (J1b, 14.10).** The same 144 posed shut checkpoints (24 careers x 3 checkpoints x 2 bands; the two bands read one calendar, so 72 distinct). J1's own count of the window is the ceiling: a free week exists in the window of 130 of 144 (90.3%). So:
1. **Printed 85–92%** (123–132 of 144), the shortfall being the checkpoints whose four weeks are all away – **about 14 of 144 (10%)**, which is what J1 counted as «never in the window».
2. **Zero double prints.** A week that printed was hearable under today's values, so it hides every later week of the window; the argument is on `coachTalkShutRead`. The arm counts checkpoints with two printed weeks.
3. **The print lands on the first free week**: by offset 0 62 (43%), by offset 1 100 (69%), by offset 2 112 (78%), by offset 3 130 (90%) – the shape J1 counted, now as a printed share.
4. **The approximation costs 1% or less (at most 1–2 of 144 misses).** The roof cannot change inside four weeks of a school-age stint (0 expected); the bond is posed (0). What is left is a layoff that began and ended inside one window before the first free week: J1 saw a layoff on the first week of 4 of 144, and only the subset that heals in time and hides a free week behind it can cost a print.
5. **The cap costs nothing**: 0 disagreements between the reading of an earlier week now and the reading recorded on that week, over every snapshot of the played careers.
*Played:* the shut-checkpoint rate does not move (J1: 3 in 126 coached years, 0.024 a year); the widening turns a print share of 0 of 3 into about 90% of whichever arrive, so I expect **0–3 silence notes in 126 coached years**, and none at a steady or close bond, where the fact cannot be present.

**Measured (J1b, 14.10)** with `tests/r52-checkpoint-silence.test.ts` at `R52_J1_REPORT=1` (`-t "J1 E"`): the same 144 posed shut checkpoints as J1 (presets 2 and 5, twelve careers each, both bands, the stint begun at a spread of weeks), and the same played run (7 presets x 6 careers x 156 weeks, 126 coached years). *Before J1b the note printed on 62 of the 144 (43.1%); it now prints on 128 (88.9%).*

| posed, 144 shut checkpoints | predicted | measured |
| --- | --- | --- |
| the note printed | 85–92% (123–132) | **128 (88.9%)** |
| double prints (a checkpoint printed twice) | 0 | **0** |
| no free week in the window, so no note | about 14 (10%) | **14 (9.7%)** – 4 whose four weeks were all away on a trip or a tournament, 10 where a layoff covered at least one of the four; 0 roof |
| the approximation's cost: a free week existed and nothing printed | 1% or less (1–2 of 144) | **2 (1.4%)** – inside the count, 0.4 points over the percent |
| a print on a week other than the first free week | 0 | **0** |
| cumulative print by window week (0 / 1 / 2 / 3) | 62 / 100 / 112 / 130 (J1's ceiling) | 62 / 100 / 112 / **128** |

By checkpoint, per band: 12 weeks together 21 of 24 (87.5%), 32 weeks 23 of 24 (95.8%), 56 weeks 20 of 24 (83.3%). The two bands read one calendar and give identical numbers, so the sample is 72 distinct windows and **the two approximation misses are one window read twice**: the checkpoint at 56 weeks of one career, whose first free week was the window's last, hidden behind a layoff earlier in the window that had healed by then (the arm checks that every miss has such a week; it is the approximation working as documented on `coachTalkShutRead`: an injury has no per-week record, so an earlier week is read as healthy). The roof stages cost 0 (school age), the bond is posed and so cost nothing here, and the 14 windows with no free week are the honest 10% J1 counted: the note is only ever said at the table.

| played, 126 coached years (6552 coached weeks) | predicted | measured |
| --- | --- | --- |
| weeks at a steady or close bond carrying the fact, or a silence line | none | **none, in 5709 weeks** |
| windows in which the bond was shut on some week with the talk still due | – | 3 (J1 saw the same 3) |
| silence notes printed | 0–3 in 126 years | **2 (0.016 a coached year)** – J1 printed 0 of the 3; the third window had no week that was both shut and free |
| the roll read the bond shut and the snapshot read it open, on a window week, with the talk still due (the band edge) | – | 1 (the roll reads the new bond the next week, so the talk is raised in the window); the reverse, on a week carrying the fact: 0 |
| **the cap oracle**: an earlier week read now from the capped feed against the same week read on the day | 0 disagreements | **0 of 19,404 comparisons**; the feed reached 402 rows (the cap is 400, so pruning was in play), and the widest four weeks of ordinary rows (neither kept nor a match) were 50, against the floor of 120 |

A shut checkpoint is still rare in a played career (0.024 a coached year), and the widening makes the rare one visible: two of the three that arrived now leave the note. The `R52_J1_REPORT=1` run takes about 125 seconds and **exits 1 with all 24 tests green** – `Timeout calling "onTaskUpdate"`, the birpc 60-second ceiling the sim suite also carries (CLAUDE.md), not a failure.

**Proved by mutation, each restored byte for byte (`shasum` before = after):** dropping clause (c), the earlier-weeks check, turns four tests red (J1's once-per-checkpoint arm and three of F: the fact on every later free week); dropping clause (b), the week itself, turns three red (the fact on the away weeks); widening the window's bound by one week in `coachTalkCheckpointAt` turns the travel-pattern arm red (the window with four away weeks prints on its fifth).

---

### Addendum, round 52 J6 (15.10) – the half-year talk moves to week 28, and the windows close: half a year [24, 32), a year [48, 64)

**The owner, 15.10**, two questions on his review sheet and his two answers.

- On R71: «реплика говорит «полгода», но окно факта открыто с 24-й по 43-ю неделю, а обязательная точка — 32-я (почти восемь месяцев).» His answer: **«Точку на 28-ю нед.»**
- On R73–R75: ««год» доступен с 48-й недели без верхней границы. Может ли R73–R75 выпасть в обычном small talk спустя два-три года с тем же тренером?» His answer: **«Окно 48–63 нед.»**

**What changed.** Three numbers and one table key, all in the code that decides *when*; no string changed in either language, nothing is persisted, and nothing draws from the main stream.

| where | before | after |
| --- | --- | --- |
| `COACH_TALK_CHECKPOINTS` (`world/coachFeel.ts`) | 12, 32, 56 | 12, **28**, 56 |
| the half-year row of `COACH_TALK_CHECKPOINT_ROWS` (`world/lifeBeat/smallTalk.ts`) | keyed 32 | keyed **28** |
| `COACH_TALK_HALF_YEAR_UNTIL_WEEK` (the half-year window closes) | 44 | **32** |
| `COACH_TALK_YEAR_UNTIL_WEEK` (the year window closes) | no ceiling | **64** |

The two opening weeks (24 and 48) stay. A half-year line can now be told only on weeks together 24 to 31, and the checkpoint takes the last four of them (28 to 31), so ordinary small talk has four weeks (24 to 27) in which it could say «half a year» on its own. A year line can be told only on weeks 48 to 63: the checkpoint at 56 takes weeks 56 to 59, and ordinary small talk has weeks 48 to 55 and 60 to 63. Past week 63 of a stint no «half a year» and no «a year» line is true, so a girl two or three years into the same coach hears neither. Every edge (24, 28, 32, 48, 56, 64) is a multiple of four, the length of a feel period, so each one still falls on a week her feel was just re-read. Week 28 is six and a half months, which is why he could call the line «полгода» and not be contradicted by the calendar.

**Prediction, written before the run (J6, 15.10).** Same cohort and harness as H3 (`tests/r52-coach-talk-checkpoints.test.ts` section H, `R52_H3_REPORT=1 R52_H3_SCALE=big`: 7 presets that start with a coach, 6 careers each, 312 weeks, both parent arms; and the wide run for the sides, `R52_H3_CAREERS=24 R52_H3_WEEKS=70 R52_H3_ARMS=answers R52_H3_NOOFF=1`), measured against H3's own figures above. One new count, rows of the six stint situations per coached year split into the checkpoint's own weeks and everything else (`tests/r52-coach-talk-windows.test.ts`, `R52_J6_REPORT=1`), run on the parent commit and on this one.

| what is measured | H3, 14.10 | predicted now | reasoning |
| --- | --- | --- | --- |
| stints past 60 weeks that got all three talks (steady or close bond in every window) | 100% scale (40 of 40), 98.1% wide (152 of 155) | **scale 100%, wide 98 to 100%** (152 to 155 of 155) | H3's three misses were all the recency veto. The half-year one was a lottery row at week 25, ahead of the old checkpoint; with the checkpoint at 28 the lottery has four weeks before it instead of eight, so that cause can only get rarer. The other two (a row at week 7, before checkpoint 12) are untouched |
| coach talks per coached year, first two years of a stint, checkpoints live | 1.575 (answers), 1.563 (ignores) | **1.52 to 1.56** | three checkpoint talks in two years is 1.5; the rest was the lottery, and the stint rows' lottery weeks in those two years drop from 68 to 16 |
| the same with the checkpoints emptied (the lottery alone) | 0.180 and 0.168 | **0.10 to 0.14** | the first-impression rows (R67 to R69) are untouched; the stint rows lose about two thirds of their weeks in the first two years (76 to 24) |
| sides at the half-year checkpoint, now at week 28 | week 32: warm 30.5%, unsure 38.9%, cold 30.5% (51 / 65 / 51 of 167) | **warm 27 to 34%, unsure 38 to 46%, cold 24 to 32%** | the bench B14 says the cold share rises and the unsure share falls with the stint, so week 28 sits about two points earlier on that slope than 32. At 167 talks a share has a standard error near four points, so the move will not be told apart from noise |
| ordinary small talk's R70 to R72 rows per coached year | not counted; about 16 lottery weeks per stint | **before 0.004 to 0.008 (1 to 2 rows in 252 coached years), after 0.000 to 0.004 (0 to 1)** | exposure falls from 16 weeks to 4 per stint, a quarter; at H2's rates (about 0.001 to 0.002 a week) that is one row or none |
| ordinary small talk's R73 to R75 rows per coached year | not counted; H2 saw 16 stint rows in 252 coached years, about 14 of them these | **before 0.05 to 0.10 (12 to 26 rows), after 0.000 to 0.008 (0 to 2)** | exposure falls from about 250 weeks per stint to 12, a twentieth |
| rows outside their windows | none could be (the old windows) | **exactly 0**: no R70 to R72 row outside weeks together [24, 32), no R73 to R75 row outside [48, 64), the half-year talk always inside [28, 32) | a hard property, not a rate |
| the silence J1 and J1b print for a checkpoint the bond shut | 88.9% of 144 shut checkpoints printed (128), 23 of 24 at week 32 | **still 85 to 92% in all, on the first free week of [28, 32)** | the rule did not change; the weeks the window sits on did, so the share at the half-year checkpoint may move by a window or two |
| MAIN draws | identical with and without the mechanism | **identical** | nothing here touches the main stream; the frozen capture (41550 draws, hash `e6b0c709`) must not move |

The pins that hash a played coached career (the coach-travel files, `succession-s1-start-year`, PICK-STABILITY in `i18n-l3-5-life-beats`, the `i18n-l3-7-twin` leaves) are expected to go red again, because the half-year talk lands four weeks earlier and the stint rows come up far less often; the story-pool sample floor may too. None is re-stamped here.

**Measured (J6, 15.10).** Two arms of the same harness: this tree, and a worktree at the parent commit `a4db32f6`, which is the change reverted in full (checkpoints 12, 32, 56, the half-year window to 44, the year window without a ceiling). The parent arm reproduces H3's 14.10 figures to the digit (40 of 40 and 152 of 155; 1.575 and 1.563; 0.180 and 0.168; 51 / 65 / 51 at week 32), so the two arms differ in this change and in nothing else. Denominators: the scale run is 42 stints (7 presets, 6 careers each, 312 weeks: 252 coached years, 83.2 of them in the first two years of a stint, 126 checkpoint windows of which 124 had a steady or close week); the wide run is 168 stints of 70 weeks (504 windows, 491 with an eligible week). Commands: the H3 harness as above, `R52_J6_REPORT=1 R52_J6_SCALE=big npx vitest run --project unit tests/r52-coach-talk-windows.test.ts -t "lottery rows"` (the parent arm with `R52_J6_BEFORE=1`, which counts against the 14.10 windows), and `R52_J1_REPORT=1 npx vitest run --project unit tests/r52-checkpoint-silence.test.ts -t "J1 E"`.

| what is measured | predicted | measured, parent then J6 |
| --- | --- | --- |
| stints past 60 weeks with all three talks, among those with a steady or close week in every window | scale 100%, wide 98 to 100% | **scale 40 of 40 (100%) then 40 of 40; wide 152 of 155 (98.1%) then 152 of 155.** Over all 42 stints it is 40 (95.2%) both times, the other two being a shut bond. The three wide-run misses are the same three recency vetoes: the half-year one is the lottery's row at week 25, which the narrower window still allows (weeks 24 to 27), so that cause did not get rarer in this cohort, against the prediction's reasoning; the figure stayed inside the range |
| coach talks per coached year, first two years, checkpoints live | 1.52 to 1.56 | **1.575 then 1.539** (answers); ignores 1.563 then 1.539 |
| the same with the checkpoints emptied (the lottery alone) | 0.10 to 0.14 | **0.180 then 0.084** (answers); ignores 0.168 then 0.084. Below the range: the stint rows were 0.096 of the 0.180, and none was drawn in the 83.2 coached years after the change, so what is left is R67 to R69 alone |
| sides at the half-year checkpoint (wide run, 167 talks; the checkpoint was at 32, now at 28) | warm 27 to 34%, unsure 38 to 46%, cold 24 to 32% | **warm 51 / unsure 65 / cold 51 (30.5 / 38.9 / 30.5) then 52 / 64 / 51 (31.1 / 38.3 / 30.5).** One talk moved between sides, well inside the noise. Scale run: 9 / 23 / 10 then 11 / 21 / 10 |
| R70 to R72 ordinary rows per coached year (252 coached years) | before 0.004 to 0.008 (1 to 2 rows), after 0.000 to 0.004 (0 or 1) | **with the checkpoints live 0 then 0; the lottery alone 1 (0.004) then 0** |
| R73 to R75 ordinary rows per coached year | before 0.05 to 0.10 (12 to 26 rows), after 0.000 to 0.008 (0 to 2) | **live 12 (0.048) then 0; the lottery alone 15 (0.060) then 0.** All twelve were past week 64: four on weeks 72 to 95, eight on week 120 or later, the last on weeks 268 to 271, a stint of five years. That is the «a year» line he asked about |
| rows outside their windows | exactly 0 | **0 of 82 stint rows with the checkpoints live** (42 half-year rows, all on weeks 28 to 31, and 40 year rows, all on weeks 56 to 59) and 0 of 0 with them emptied. The reachability sweep agrees: a half-year row is in the pool on exactly weeks 24 to 31 and a year row on exactly weeks 48 to 63, in a founding stint and in one re-hired at week 100, on all three sides at each edge |
| windows deferred (not predicted) | | answers 1 of 124, at +2 weeks, then the same; ignores 15 of 124 (12.1%) then 12 of 124 (9.7%: 2 at +1, 10 at +2) |
| the silence J1 and J1b print, bond posed shut for 60 weeks (144 shut checkpoints) | still 85 to 92% in all, on the first free week of [28, 32) | **MISSED: 128 of 144 (88.9%) then 112 of 144 (77.8%).** The first-impression and year checkpoints are as J1b measured them (21 of 24 and 20 of 24); the half-year one is **15 of 24 (62.5%) at 28 against 23 of 24 (95.8%) at 32**. In 8 of the 24 posed windows all four weeks 28 to 31 are away weeks in the bench calendar (travel alone in 5, an injury among the weeks in 3), against 1 of 24 at 32. That is where the new window falls in a calendar, and not the rule: the suite is green and the note still prints on the first free week of every window that has one. In played careers nothing moved: 3 shut windows, 2 notes, 0.016 a coached year, as J1b counted |
| MAIN draws | identical | **identical** in the H3 harness (both parent arms), and the frozen capture (41550 draws, hash `e6b0c709`) did not move |

**Proved by mutation, each restored byte for byte (`shasum` before = after: `coachFeel.ts` 6aabb427fb01f896, `smallTalk.ts` 7a5da2560628fdfa).** The checkpoint put back at 32 (the array and the rows key) turns 29 tests red of 91 in four files (the new file 2, the checkpoint file 19, the silence file 8, the feel-talk file 0). The half-year window put back at 44 turns 8 red of 72 (the new file 3, the feel-talk file 5, the checkpoint file 0). The year window put back to no ceiling turns 10 red of 72 (the new file 4, among them the played careers; the feel-talk file 6, among them the 24-year walk). The half-year window's close is invisible to the checkpoint file and to the played gate cohort; the reachability sweep in the new file is what holds it.

**What it costs the pins.** The pins that were pinned to 32, to [24, 44) or to an open year are re-aimed with dated notes naming his rulings: the checkpoint file (the design table, the rows key, the edge table, the re-hire case), the feel-talk file (both windows, the grid weeks and its edges, the numbers case, the re-hire case, the parity poses, the long-stint roll) and the silence file (its checkpoint list and two cases). The digest family, run on this tree and on the parent (34 files, 505 tests): **green on the parent, 36 tests red on this tree in 7 files**, so every one is red because of this change and of nothing earlier.

| file | red on this tree | red on the parent |
| --- | --- | --- |
| `coach-travel-edge-recent-schemas` | 10 of 10 | 0 |
| `coach-travel-edge-late-schemas` | 8 of 8 | 0 |
| `coach-travel-edge-prior-schemas` | 3 of 6 | 0 |
| `coach-travel-edge` | 3 of 5 | 0 |
| `succession-s1-start-year` | 9 of 24 | 0 |
| `i18n-l3-7-twin` | 2 of 6 | 0 |
| `i18n-l3-5-life-beats` (PICK-STABILITY) | 1 of 35 | 0 |

The story-pool sample floor in `round51-school-story-pool` stays green. The other 27 files stay green, among them `tests/condition.test.ts`, `wave3-small-talk`, `import-cycles`, `principles-a03`, `principles-a06`, `principles-b08`, `principles-t514`, `pin-hygiene` and `world-symbol`. None of the seven is re-stamped here; the architect harvests them once at the close.

## P3.7 The corpus at 43, and the whole document at 51 – counted by script, not claimed

⚠⚠ **THIS SECTION SAID 44 UNTIL THE REPLIES PASS RE-RAN ITS OWN COUNT, AND IT WAS THE DOCUMENT'S OWN
RULE THAT CAUGHT IT.** §3a: «any number in a document that can be derived FROM that document is
derived by script before the commit». The table below was written before `R26` was withdrawn and
never re-derived, so `curiosity` stood at 6 against a real 5 and the total at 44 against a real 43 –
while the head of this same file already said 43 twice. **The fourth counting slip of this family,
and the first one the rule caught rather than the owner.**

| subject | situations | of 43 |
| --- | ---: | ---: |
| `story` | 12 | the heaviest cell, because a bright week favours it |
| `decision` | 7 | was **zero** for adults |
| `good-news` | 7 | |
| `observation` | 6 | was **one**, and it is the cell that started this |
| `worry` | 6 | held back from tranche 1 until the gates were settled |
| `curiosity` | 5 | held back for the same reason; `R26` withdrawn from it |

**Every one of the 43 reaches `college` and `independent`.** **Eight** name a career gate – R8, R14,
R17, R18, R20, R25, R34, R44 – and **all eight can ship.** R17's `clear-next-week` was the one claim
no `SmallTalkFact` carried; it was written on 17.09 at his ask and is now the fifth member of
`SMALL_TALK_FACTS`, and `R44` was gated on it the same day.
The other 35 are `generated` kernels that assert nothing the career could contradict. No line
**of the 43**, opener or reply, says «today».

⚠⚠ **THAT SENTENCE SAID «SEVEN – R8, R14, R17, R18, R20, R25, R34» UNTIL ROUND 44 DERIVED IT AGAIN,
AND THIS IS THE FIFTH SLIP OF THE FAMILY §3a IS NAMED FOR.** `R44` was gated on `clear-next-week` on
17.09 at his own ask – «загейти R44 на clear-next-week» – its own row records the change, and this
list was never re-run. **A number written and never checked against the thing it counts**, again, and
again catchable in one line. The figures in this section are now derived by
`tools/small-talk-corpus-parse.ts` rather than maintained.

⚠ **THE «no line anywhere says today» SENTENCE USED TO BE UNSCOPED AND ROUND 44 MADE IT FALSE, SO IT
IS SCOPED RATHER THAN QUIETLY LEFT.** Three of the eight that shipped before this document DO say
«today» – `practice-clicked`, `line-call` and `court-four`'s `quiet` column. Gate 4 was written after
those shipped and they are his sentences (invariant 4), so the rows carry them and the exception is
stated here rather than edited away.

⭐ **THE WHOLE DOCUMENT, DERIVED RATHER THAN CARRIED FORWARD** (`51` rows; the eight are `R45`–`R52`):

| subject | of 51 | of 43 | what the eight added |
| --- | ---: | ---: | --- |
| `story` | 13 | 12 | `court-four` |
| `good-news` | 9 | 7 | `practice-clicked`, `beat-her-conqueror` |
| `worry` | 8 | 6 | `line-call`, `new-place` |
| `decision` | 8 | 7 | `march-entry` |
| `observation` | 7 | 6 | `watching-players` |
| `curiosity` | 6 | 5 | `coach-real` |

**Twelve of the 51 name a career gate** – the eight above plus `line-call` (`played-recently`),
`march-entry` (`march-entry-open`), `coach-real` (`coach-employed`) and `beat-her-conqueror`, whose
own fact is the strictest in the game.

⚠ **Against his per-cell floors:** 3–4 per subject at each active stage – **met** at 6–13 for adult
stages. 6+ in the heavily weighted cell – **met** (`story` = 13). No subject with only ONE reachable
adult situation – **met**, the thinnest is 6. The last-two exclusion – shipped as round 43 #8(a).

⚠ **What is still measured as a hole:** `school`, and it is a SMALLER hole than this section used to
describe. Nineteen of the 51 reach `after-school` and **six list plain `school`** – all six of them
among the eight that shipped before this document, because those were written for the school years
and the 43 were written for the holes he reported past them. A school-years tranche of the corpus's
own standard is still its own pass and its own reading.

⭐ **What B0/K4 should now say.** Before this corpus, the bench measured a 40-conversation career
meeting **~2.5 distinct situations** with **14.1% of conversations reaching none at all**. Re-run K1–K5
against **51** four-voiced situations before shipping any of it – the corpus is the input to that
bench, not a substitute for it.

---

# PASS 4 – the replies, on his 17.09 word «ядра принимаю, пиши ответы»

**516 written: 43 situations × 4 voices × 3 parent stances.** Every number below is derived from this
file by script, per §3a's rule, and the script is the same one that derives the opener figures.

⚠ **THE MEASUREMENTS IN THIS PASS ARE OF THE 43 AND ARE LEFT THAT WAY**, because they are the record
of a pass that happened. Round 44's **84** added lines – the eight rows' 21 new voice-entries, each an
opener and three replies, so 21 openers and 63 replies; their 24 labels and 4 shared beats are his and
were carried, not written – move
every average by a decimal place or two and change nothing they were arguing: over all 51 the
contraction habit and the shape hold – openers 15.5 / 15.2 / 16.7 / 10.2 words, replies 11.9 / 11.7 /
11.5 / 7.7, `deep` still shorter than `sunny` and `fiery` rather than longer, `quiet` still the
shortest of the four by a wide margin.

## What was measured

| | sunny | fiery | deep | quiet |
| --- | ---: | ---: | ---: | ---: |
| openers – average words | 15.7 | 15.4 | 17.4 | 10.4 |
| **replies – average words** | **11.8** | **11.5** | **11.0** | **7.4** |
| replies – contractions | 140 | 164 | 134 | 104 |
| replies – lines carrying one, of 129 | 100 (78%) | 104 (81%) | 99 (77%) | 88 (68%) |

⭐ **The contraction figure is the one his «formal and AI-authored» note was about.** The rejected
tranche ran four contractions in 120 lines. These run **542 across 516**, and three voices in four
carry one on better than three lines in four. `deep` is at 77% and keeps her uncontracted forms
deliberately, for weight – «It is the job», «Nothing is missing».

⚠ **A reply is shorter than an opener in every voice, and that is the shape, not a shortfall.** An
opener has to put a whole scene on the table; a reply answers one sentence. The gap widens with the
stance, which is the exchange working: invite 13.4 / 12.7 / 12.4 / 8.5, respond 11.8 / 11.3 / 10.9 /
7.3, space 10.2 / 10.4 / 9.7 / 6.4. She gives most when asked for more and least when let go.

⚠⚠ **`deep` is now the SHORTEST of the three, and that is deliberate and reversible.** His note was
that she «repeatedly explains the meaning of her own scene» and sounds like a screenwriter finishing
the interpretation for her; the openers went 21.4 → 17.4 on it. Her replies sit at 11.0 – below
`sunny` and `fiery` rather than above them. **If he reads that as too far, the fix is hers to ask
for:** it is not a rule that `deep` must be the longest, and letting her notice and stop was the
instruction.

## The gates the replies were written against

| gate | what a reply may therefore assert | what it may NOT |
| --- | --- | --- |
| `generated` | harmless domestic truth – a kettle, a towel, a sandwich | results, skill, money, entries, medical facts, longitudinal history |
| `played-recently` | she was at a tournament and played | that she LOST, or WHEN |
| `march-entry-open` | an entry is open and there is time to decide | what it costs |
| `coach-employed` | she has a coach | anything about his quality, or a coaching outcome |

⭐ **Every number, duration and person in all 516 was checked against its own kernel by script.**
Ninety-one reply lines contain a numeral token; **62 of those are the indefinite «one» or «once»**
(«the one I lost», «I've never once»), leaving **29 that are really counting**. All 29 are the
kernel's own – R15's three repackings, R21's and R37's ten minutes, R27's ten minutes and three
people, R30's three hours, R35's three people, R44's two days, R19's two voices, R25's four words –
or the parent's own, where she is answering the number he has just said (R1's two minutes, R7's two
meals). **No reply names a figure of money, a placing, a date or a result.**

## The three checks that found something

1. ✅ **REPAIRED IN ROUND 44 ON HIS [P3] – and the finding below is kept verbatim because it is the
   reasoning the repair used.** ⚠ **Four labels ask for what their own kernel cannot license, so all
   four voices must decline.** R30 «Ask who won the cards» is harmless; **R36 «Ask who won it» and
   R33 «Ask if it seemed to help her» are not** – a winner and an outcome are authoritative claims,
   and a `generated` kernel holds neither. The replies answer honestly («I never found out», «I can't
   say»), which reads true once and reads like a dodge four times in a row. The label is the defect,
   not the reply.
   ⭐ **His review reached the same two labels and the same sentence** – «the label is the defect, not
   the reply» – so both are replaced and their eight replies rewritten to answer the new question:
   R36's becomes «Ask how much of it she saw» and R33's «Ask what she did instead of sitting». Neither
   new label asks the row for anything the row does not hold.
2. ⚠ **R17's `respond` and `space` say nearly the same thing** – «an empty week is allowed to be
   empty» and «she can have it as an empty week» – so two of its three columns had to be written
   apart by tone alone. R22 has a milder version of the same. Flagged, not edited: the labels are his.
3. ⚠⚠ **Openers carry numbers their own kernels do not, and the count has to be read rather than
   quoted.** A blunt numeral/duration diff flags **30 of the 172**; most are harmless («this week»,
   which gate 4 names as the correct form, «lunch», «all day»). **About a dozen are real** – a count
   or a specific duration nothing licenses: R2's three weeks of silence, R6's «maybe twice», R7's
   eleven times, R8's six times since lunch, R9's «weeks ago», R10's and R19's «all week», R13's four
   minutes, R22's «I've been here a week», R25's hour, R32's «about six», R33's «twice now», R36's
   three hours, R42's Friday. ⚠ **The two sharpest:** `R30`'s `deep` says «people I've shared a draw
   with for two years», which is competitive longitudinal history in a `generated` row; and `R36`'s
   `fiery` says «three hours», in the row that was REPLACED on 17.09 for asserting exactly this class
   of fact. **They are his accepted kernels and are left alone** (invariant 4) – but **no reply uses
   any of them**, which is why several replies answer «when?» with «I can't find the day».
   ⭐ **ROUND 44 SPLIT THOSE TWO APART, AND HIS REVIEW IS WHAT MADE THE DIFFERENCE LEGIBLE.** «Left
   alone» was the right call while the only argument against them was an agent's; it stopped being
   the right call for the ones HE named. `R30`'s `deep` is repaired on his [P2] (and `R30`'s `fiery`
   with it, «and then they called it off anyway», an outcome the kernel does not hold). `R36`'s
   «three hours» is NOT named in his six, so it stays exactly where it is – which is the whole of the
   rule: **the owner's own list is the licence, and an agent's agreement with it is not.**
   ⚠ R2's «three weeks» and R16's «a few times» were on this same left-alone list and are repaired for
   the same reason: his [P2] names them. `R33`'s «twice now», `R6`'s «maybe twice», `R7`'s eleven
   times and the rest are not named, and stay.

## «Space is not agreement», measured

Of the 172 `space` replies, **76 hold on to the subject** in some way and 96 let it go, by the proxy
`/\b(still|anyway|though|rather|keep|going to|won't|wouldn't|not yet|never|isn't|already|might)\b/i`.
⚠ **That is a LOWER bound and the proxy is named so it can be re-run:** it misses «I've not stopped
thinking about her» and «I'm taking the stairs for the rest of the week», both of which hold on.
Exactly one situation (R35) has all four voices holding on; three (R11, R27, R31) read to the proxy
as four clean acceptances, and two of those three contain a hold the regex cannot see.

⭐ **`quiet` holds on 3 times in 43, and that is her, not a gap.** «She talks about the schedule
instead of herself, and nothing spills» – a girl who closes a subject when she is offered the door is
the temperament working. Her two refusals are sideways rather than argued: «I'll notice if she's not
in the next one», «I'll say something next time».

## ⭐ THE SEVEN LINES PUT IN FRONT OF HIM RATHER THAN BURIED

Written, kept, and flagged – because a line an agent quietly dropped is a line he never got to rule
on, and a line he would have cut is cheaper to find here than in play.

✅ **RULED 17.09: «оставляй, если соответствует ревью и нашему тон оф войс».** All seven stay, and
the judgment he delegated was applied rather than waved through. Five need no argument. **Two are
named here with the concern intact**, because agreeing with him is not the same as pretending the
reading was unanimous:

- **R29 `fiery` space** – «I'm not running a laundry service in reverse.» is a CONSTRUCTED INVERSION,
  and «what currently makes several lines feel AI-written» is his own phrase for exactly that shape.
  It is the one line in the 516 that reads written rather than spoken. Kept under his ruling; a
  flatter «I'm not washing it twice» would be the same joke in her mouth.
- **R12 `space`, three voices** – the concern is not any one line but CONVERGENCE: three of four
  spend the stance telling the parent what he cannot do. The corpus's whole instrument is one event
  in four voices, and here three of them arrive at the same move. One re-aim would restore it.

⭐ **The nine invented details stay without reservation** (R7's rice and eggs, R11's coffee order,
R23's «flat», R25's four words, R28's soup-for-sandwich, R29's towel, R32's «the one from the car»,
R41's dog, R43's weight in the handle). They are small domestic specifics pinned identical across all
four voices, which is the register the corpus is for and the discipline that keeps the voices from
publishing different editions of the same afternoon.

| where | the line | why it is flagged |
| --- | --- | --- |
| R2 `deep` invite | «I think somebody took something from her once, somewhere else.» | the only reply that invents a BACKSTORY for a person the row deliberately leaves unnamed. Hedged, and consistent with her own opener («I think the answer might be sad»), but it is invention. |
| R24 `deep` invite | «I stayed. I've been telling it like I didn't.» | the only reply that takes a position the kernel leaves open – whether SHE stayed. It is the best reveal in the set and it sits next to `fiery`'s opener, «I wouldn't have». |
| ✅ R34 all four invite | «I stay back, mostly», «By then the ball's gone past» | the closest the corpus comes to her describing her own tennis. No result and no skill claim – but the label «Ask what she does on hers» asks for one, and this is the row where that boundary is thinnest. **CLOSED IN ROUND 44 ON HIS [P2]:** he read the same row the same way, the label is now «Ask what she notices just before they move», and the four replies describe the players she is watching. ⭐ The flag was right and the fix was his to authorise – which is exactly what putting it in front of him bought. |
| R2 `fiery` space | «No. We're not moving on. Somebody has to acknowledge the bananas.» | the flattest refusal of a parent in the corpus. Funny at the table, possibly rude on a card. |
| R29 `fiery` space | «I'm not running a laundry service in reverse.» | the most joke-shaped line in the 516 – nearest thing here to a written gag rather than a girl talking. |
| R35 `sunny` space | «You'd be under the table by the pudding.» | teasing the parent. Warm in one reading, pert in another. |
| R12 space, three voices | «You can't. I've watched you.» · «You've never tried.» · «You've never had to.» | three of the four spend the stance telling him what he cannot do. Each is fine alone; together they gang up. |

✅ **THE ONE BUILD COLLISION, RULED AND CLOSED (his 17.09: «надо исправить»).** `R25`'s kernel said
another player's coach «**he** says almost nothing». `tests/coach-voice.test.ts` forbids a masculine
pronoun anywhere a player can read one, and the exchange spec pins the size of its single exception
(`court-four`'s invented dad) precisely so a new one reopens the question instead of inheriting it.

⭐ **His instinct was that the pronoun should follow the portrait – and the check ran the other way,
which is why it was worth running.** The he/she split is real and it is HER coach's:
`ECONOMY.coach.roster` carries a `gender` per slot and `coach.ts:601` picks the first name from
`COACH_FIRST_M` or `COACH_FIRST_F` by it. **But no other player has a coach at all** – nothing in
`season/rival.ts` or `season/cohort.ts` models one. R25's subject is a person who exists only inside
the sentence, so there is no gender to agree with; a pronoun there is a guess wearing agreement's
clothes, which is the exact thing R15-7 exists to stop.

⚠⚠ **THE FIRST REPAIR PASS MISSED A THIRD LINE, AND THE SENTENCE THAT SAID OTHERWISE WAS WRONG WHEN
IT WAS WRITTEN.** It read «repaired in the two lines that carried it – the kernel and `sunny`'s
opener – and no other voice or reply in R25 held one». `deep`'s opener held one: «**He** barely
spoke.» The check behind that sentence was `grep -E "\\b(he|his|him)\\b"` – **case-sensitive**, and
the quotation opens with a capital `He`, so the search could not see it. ⭐ It is this document's own
named failure family, one rung worse: a claim written, asserted as verified, and never checked
against the thing it counts. Found by the builder that emitted the catalogue, because
`tests/coach-voice.test.ts` reads `src/` and the line had finally become code.

**Repaired in all three lines that carried it** – the kernel, `sunny`'s opener and `deep`'s – with
the neutral singular. A case-INSENSITIVE sweep of all 43×4 openers and all 516 replies confirms
these were the only ones:
> `"I watched somebody else's coach for an hour and they said about four words."`

⚠ The alternative was to draw a sex for the observed coach on a purpose-scoped sub-stream and splice
it. Legal, and rejected: it buys one word of texture at the price of new randomness and a variable
threaded through sixteen strings, for a stranger the row is deliberately vague about.

## What a script re-asserts on every read

⚠⚠ **SINCE ROUND 44 THIS IS NOT A SCRIPT SOMEBODY REMEMBERS TO RUN – IT IS `tools/small-talk-corpus-parse.ts`,
AND EVERY READ OF THIS DOCUMENT GOES THROUGH IT.** The emitter that wrote
`src/engine/world/smallTalkCorpus.ts` used it, and `tests/round44-corpus-roundtrip.test.ts` re-parses
this file on every test run and compares the committed catalogue to it STRING FOR STRING. An edit
here that never reached the emitter is red; a hand-edit of the generated module is red.

* **612 replies, 51 × 3 × 4**, none missing and none empty, and **204 openers, 153 labels** – the
  parser refuses a short row rather than skipping it, so a count is a count and not a floor;
* the one two-beat row (`court-four`) owes **4 shared** lines – all four voices or none;
* every block header matches its row's own `**Parent:**` label, in order;
* no exact duplicate anywhere in the 612 – **measured at 0** across all 973 authored strings
  (openers, shared beats, labels and replies) after the eight joined;
* no «today» in any opener or reply **of the 43** – and three of the eight that shipped before this
  document carry his «today», which §P3.7 states as the exception rather than editing out;
* ⚠ no masculine pronoun outside `court-four` – **measured at 0**, with `court-four`'s own seven
  distinct sentences pinned by count in `tests/coach-voice.test.ts`.
