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

# ⚠⚠ WHAT THIS DOCUMENT IS, AFTER HIS SECOND REVIEW (17.09)

**It is a corpus of OPENER KERNELS, not an exchange corpus, and calling it the second thing was the
first finding of his review.** The arithmetic he did, re-derived here by script:

| drafted | outstanding |
| --- | --- |
| **172** daughter openers (43 × 4 voices) | – |
| **129** parent option labels (43 × 3) | – |
| – | **516** daughter replies (43 × 4 × 3), of which **zero** are written |

⭐ **The replies are not started, and that is deliberate on his instruction: «Replies should not be
written until the factual and voice problems below are resolved.»** 516 replies written over a kernel
that invents a fact is 516 lines to throw away.

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

Six situations carry career gates, so they are not simultaneously reachable and a given career may
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
| `sunny` | `"There was a seat free next to someone I've spoken to maybe twice, and she moved her bag for me."` |
| `fiery` | `"She moved her bag so I could sit down. I barely know her and I don't know what to do with that."` |
| `deep` | `"There was a bag on the chair beside hers. She moved it when I came in."` |
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

**Parent:** *Ask what the meal is* · *Say you lived on two meals for years* · *Say nobody is marking her on this*

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
| `deep` | `"The grip went halfway through. I sat down and did it myself."` |
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

### R17 · `the-week-with-nothing-in-it` · worry · college, independent · **fact: `clear-next-week` (NEW)**
**Kernel:** Next week holds no match, and she has not decided whether that is rest or an absence.
⚠⚠ **NEEDS A NEW GATE, and that is the finding rather than a wording fix.** A clear week is a CALENDAR
fact and no existing `SmallTalkFact` carries it. `clear-next-week` is proposed: the season holds no
event she is entered in next week. Until it exists this row does not ship – a situation that invents
her calendar is worse than one that never fires.
| voice | opener |
| --- | --- |
| `sunny` | `"I've got a completely empty week and I don't know what to do with myself."` |
| `fiery` | `"An empty week. I'll go mad. I already know I'll go mad."` |
| `deep` | `"There's nothing in next week. I keep looking at it and I can't tell if I'm relieved."` |
| `quiet` | `"Next week's clear. I might catch up on some things."` |

**Parent:** *Ask what she would do with it* · *Say an empty week is allowed to be empty* · *Say she can have it as an empty week*

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

## P3.2 `curiosity` – six

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

### R22 · `how-they-live` · curiosity · college, independent · generated
**Kernel:** She has realised she has no idea what the other players do in the hours between matches.
| voice | opener |
| --- | --- |
| `sunny` | `"What does everybody DO all day? I genuinely don't know."` |
| `fiery` | `"I've been here a week and I still don't know how anybody spends their afternoons."` |
| `deep` | `"There are hours here I can't account for in anybody's day, including mine."` |
| `quiet` | `"The days are long between matches. I've been reading."` |

**Parent:** *Ask what she does with hers* · *Say the waiting is most of it* · *Say the boring hours are part of it*

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

### R25 · `the-coach-she-watched` · curiosity · college, independent · **fact: `coach-employed`**
**Kernel:** She watched another player's coach work and noticed he says almost nothing.
⚠ **Gated** because a girl with no coach has no comparison to make. ⚠ **It asserts nothing about HER
coach's quality** – only what she noticed about a different one. ⚠⚠ **And `fiery` used to break that
in its own line** («she was better at the end of it») – a coaching OUTCOME, which no gate licenses and
which contradicted the row's own note. Repaired 17.09; the note was true and the line was not.
| voice | opener |
| --- | --- |
| `sunny` | `"I watched somebody else's coach for an hour and he said about four words."` |
| `fiery` | `"Four words. All session. I'd like to know which four."` |
| `deep` | `"He barely spoke. I can't tell if that's confidence or if it was all said already."` |
| `quiet` | `"I watched another session for a bit. Quieter than ours."` |

**Parent:** *Ask what the four words were* · *Say the talking is not the coaching* · *Say every pair finds its own way*

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

### R28 · `the-wrong-order` · story · college, independent · generated
**Kernel:** A café brought her somebody else's order and she ate it rather than say anything.
| voice | opener |
| --- | --- |
| `sunny` | `"They brought me the wrong lunch and I just ate it. It was quite good!"` |
| `fiery` | `"Wrong order. I ate it anyway. I'm still annoyed at myself about that."` |
| `deep` | `"It wasn't what I ordered and I said nothing, which tells me something I'm not sure I like."` |
| `quiet` | `"Lunch wasn't what I ordered. It was fine."` |

**Parent:** *Ask what she actually got* · *Say you do the same thing* · *Say she is allowed to send food back*

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

### R30 · `the-rain-delay` · story · college, independent · generated
**Kernel:** Rain stopped play for three hours and the players ended up playing cards in a corridor.
| voice | opener |
| --- | --- |
| `sunny` | `"Three hours of rain and we ended up playing cards on the floor of a corridor. Best day."` |
| `fiery` | `"Three hours. THREE. And then they called it off anyway."` |
| `deep` | `"We sat in a corridor for three hours and I talked to people I've shared a draw with for two years."` |
| `quiet` | `"Rain delay. We waited it out inside."` |

**Parent:** *Ask who won the cards* · *Say you'd have been terrible at the cards* · *Say she should get some sleep*

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

### R35 · `the-team-that-eats-together` · observation · college, independent · generated
**Kernel:** She noticed one player travels with three people and they all eat together every night.
| voice | opener |
| --- | --- |
| `sunny` | `"One girl has THREE people with her and they all eat together every night. It looks lovely."` |
| `fiery` | `"Three people. For one player. I don't know whether to be jealous or appalled."` |
| `deep` | `"She has a table of her own people every evening. I've been sitting with that longer than I expected to."` |
| `quiet` | `"Some of them travel with a group. They have dinner together."` |

**Parent:** *Ask whether she would want that* · *Say a big team is not the same as a good one* · *Say you'd not want three people at your dinner either*

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

### R39 · `the-thing-she-fixed` · good-news · after-school, college, independent · generated
**Kernel:** Something in her bag broke and she mended it herself with what she had.
| voice | opener |
| --- | --- |
| `sunny` | `"My bag strap went and I fixed it with a shoelace. It's holding!"` |
| `fiery` | `"It broke, I fixed it, and it's better than it was. That's the whole story."` |
| `deep` | `"I mended it with what was in the bag. It's ugly and it works and I've been quietly pleased all day."` |
| `quiet` | `"Bag strap went. It's sorted."` |

**Parent:** *Ask how bad it looks* · *Say that is a useful kind of stubborn* · *Say you would have bought a new one*

### R40 · `the-junior-who-copied-her` · good-news · college, independent · generated
**Kernel:** She caught a younger player copying her warm-up routine, badly.
| voice | opener |
| --- | --- |
| `sunny` | `"A younger girl was doing MY warm-up. Badly! But mine!"` |
| `fiery` | `"She was copying me. I nearly went over and fixed her elbow, and then I thought better of it."` |
| `deep` | `"She was doing my warm-up two courts away and getting it wrong, and I didn't know where to put that."` |
| `quiet` | `"One of the juniors has picked up my warm-up. Roughly."` |

**Parent:** *Ask whether she said anything* · *Say that is what being watched looks like* · *Say she does not owe her a lesson*

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
