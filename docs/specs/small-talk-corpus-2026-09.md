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

| voice | opener |
| --- | --- |
| `sunny` | `"Someone writes her NAME on bananas. On every single one. Who is taking the bananas?"` |
| `fiery` | `"She labels her fruit. Her fruit. I've said nothing for three weeks and I am running out of nothing."` |
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

### R3 · `the-stranger's-sock` · story · after-school, college, independent · generated
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

---

# PASS 3 – tranche 2, and the shape is his

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
| `quiet` | `"I've repacked a couple of times. It's fine now."` |

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
| voice | opener |
| --- | --- |
| `sunny` | `"There's a name I expected to see in the draw and it isn't there."` |
| `fiery` | `"She's not in the draw. Nobody will say why, and I hate that."` |
| `deep` | `"A name I looked for isn't there. Nobody has mentioned it."` |
| `quiet` | `"There's a name missing from the draw."` |

**Parent:** *Ask whether she knew her well* · *Say people leave for ordinary reasons too* · *Say she does not have to find out*

**invite** · *Ask whether she knew her well*
- `sunny` `"Not really. We've shared a warm-up a few times. That's about it."`
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

### R18 · `the-loss-she-is-still-carrying` · worry · after-school, college, independent · **fact: `played-recently`**
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
- `quiet` `"She's all right. We talk a bit more now."`

**space** · *Say she should lend her more things*
- `sunny` `"I might. I've got a whole bag of things that need washing."`
- `fiery` `"I'm not running a laundry service in reverse."`
- `deep` `"Maybe. I'd rather work out what I can do back."`
- `quiet` `"Maybe. She can have the towel."`

### R30 · `the-rain-delay` · story · college, independent · generated
**Kernel:** Rain stopped play for three hours and the players ended up playing cards in a corridor.
| voice | opener |
| --- | --- |
| `sunny` | `"Three hours of rain and we ended up playing cards on the floor of a corridor. Best day."` |
| `fiery` | `"Three hours. THREE. And then they called it off anyway."` |
| `deep` | `"We sat in a corridor for three hours and I talked to people I've shared a draw with for two years."` |
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
| voice | opener |
| --- | --- |
| `sunny` | `"There's a girl who never sits down at changeovers. Not once, the whole match."` |
| `fiery` | `"She doesn't sit down. Ever. It's either brilliant or a pose and I can't decide which."` |
| `deep` | `"She stood through every changeover. I don't think it was for show."` |
| `quiet` | `"One of them doesn't sit at the changeovers. I noticed it twice now."` |

**Parent:** *Ask if it seemed to help her* · *Say players find odd things that work* · *Say she does not have to copy anyone*

**invite** · *Ask if it seemed to help her*
- `sunny` `"I couldn't tell. She looked the same at the end as she did at the start."`
- `fiery` `"No idea. She didn't look tired, which annoyed me more than it should have."`
- `deep` `"I can't say. She never sat, and I watched her instead of the match."`
- `quiet` `"Hard to tell. She kept doing it, so probably."`

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
| voice | opener |
| --- | --- |
| `sunny` | `"The good ones just step in on a second serve. They don't even think about it."` |
| `fiery` | `"They walk in on the second serve like it's owed to them. I want to do that."` |
| `deep` | `"Nobody decides to step in. It's already decided before the ball is tossed, and that's the part I'm missing."` |
| `quiet` | `"They stand closer on the second serve. All of them."` |

**Parent:** *Ask what she does on hers* · *Say that is a decision made in practice, not in a match* · *Say she is watching well*

**invite** · *Ask what she does on hers*
- `sunny` `"I think about it. That's the difference. By then the ball's gone past."`
- `fiery` `"I think about it first. They don't. That's the bit I hate."`
- `deep` `"I decide. Every time. I've never once just gone."`
- `quiet` `"I stay back, mostly. I've been trying not to."`

**respond** · *Say that is a decision made in practice, not in a match*
- `sunny` `"That makes sense. I'd never have got there on my own."`
- `fiery` `"Then I'll do it in practice until I stop thinking about it."`
- `deep` `"That's probably right. I've been trying to decide it in the wrong place."`
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

**Kernel:** A match on the next court ran far longer than anything else that day, and both players
were still moving properly at the end of it.

| voice | opener |
| --- | --- |
| `sunny` | `"There was a match on court one that went on forever and they were both still fine at the end."` |
| `fiery` | `"Three hours and neither of them was limping. I'd have been on the floor."` |
| `deep` | `"It went far longer than anything else out there. They were both still moving properly at the end."` |
| `quiet` | `"One of the matches ran very long. I watched some of it."` |

**Parent:** *Ask who won it* · *Say that is a different kind of fitness* · *Say she does not have to measure herself against it*

**invite** · *Ask who won it*
- `sunny` `"No idea. I left before the end. I keep meaning to look it up."`
- `fiery` `"I don't know and nobody's said. That's what gets me about it."`
- `deep` `"I never found out. I watched the middle and missed the end of it."`
- `quiet` `"Didn't see the end. It was still going when I left."`

**respond** · *Say that is a different kind of fitness*
- `sunny` `"It really is. They were both still running at the end."`
- `fiery` `"It is. I'd have been sitting down long before that."`
- `deep` `"It is. Neither of them looked like they were surviving it."`
- `quiet` `"It is. They both walked off fine."`

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

### R44 · `the-two-quiet-days` · decision · college, independent · generated
⚠⚠ **REPLACED 17.09 – the row here was `the-early-flight` and it asserted four things at once:** a
gap in the calendar, a home to fly to, a flight, and two fares costing the same. Calendar, residence,
travel and money are all the engine's, and none of them is licensed by a generated kernel. The
decision underneath was good, so the kernel keeps the decision and drops every claim.

**Kernel:** She has two quiet days and cannot decide whether to fill them or leave them alone.
**Authoritative claims:** none – no calendar gap is named, nowhere is travelled to, and no price is
quoted. **Texture:** the two days and the hesitation.

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

## P3.7 The corpus at 43 – counted by script, not claimed

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

**Every one of the 43 reaches `college` and `independent`.** **Seven** name a career gate – R8, R14,
R17, R18, R20, R25, R34 – and **all seven can ship.** R17's `clear-next-week` was the one claim no
`SmallTalkFact` carried; it was written on 17.09 at his ask and is now the fifth member of
`SMALL_TALK_FACTS`.
The other 36 are `generated` kernels that assert nothing the career could contradict. No line
anywhere, opener or reply, says «today».

⚠ **Against his per-cell floors:** 3–4 per subject at each active stage – **met** at 5–12 for adult
stages. 6+ in the heavily weighted cell – **met** (`story` = 12). No subject with only ONE reachable
adult situation – **met**, the thinnest is 5. The last-two exclusion – shipped as round 43 #8(a).

⚠ **What is still measured as a hole:** `school` and `after-school`. Thirteen of the 43 reach
`after-school`; **none** lists plain `school`, deliberately, because every hole he reported was past
it. A school-years tranche is its own pass and its own reading.

⭐ **What B0/K4 should now say.** Before this corpus, the bench measured a 40-conversation career
meeting **~2.5 distinct situations** with **14.1% of conversations reaching none at all**. Re-run K1–K5
against 43 four-voiced situations before shipping any of it – the corpus is the input to that bench,
not a substitute for it.

---

# PASS 4 – the replies, on his 17.09 word «ядра принимаю, пиши ответы»

**516 written: 43 situations × 4 voices × 3 parent stances.** Every number below is derived from this
file by script, per §3a's rule, and the script is the same one that derives the opener figures.

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

1. ⚠ **Four labels ask for what their own kernel cannot license, so all four voices must decline.**
   R30 «Ask who won the cards» is harmless; **R36 «Ask who won it» and R33 «Ask if it seemed to help
   her» are not** – a winner and an outcome are authoritative claims, and a `generated` kernel holds
   neither. The replies answer honestly («I never found out», «I can't say»), which reads true once
   and reads like a dodge four times in a row. The label is the defect, not the reply.
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
| R34 all four invite | «I stay back, mostly», «By then the ball's gone past» | the closest the corpus comes to her describing her own tennis. No result and no skill claim – but the label «Ask what she does on hers» asks for one, and this is the row where that boundary is thinnest. |
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

* 516 replies, 43 × 3 × 4, none missing and none empty;
* every block header matches its row's own `**Parent:**` label, in order;
* no exact duplicate anywhere in the 516;
* no «today» in any opener or reply.
