---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# The four voice bibles, the flat pool, the Mood words, and her first quoted lines

⚠⚠ **EVERY PLAYER-FACING WORD BELOW IS A DRAFT FOR THE OWNER.** `CLAUDE.md` invariant 4 binds this
document twice over: it is nothing but wording, and none of it is wired. No string here ships until
he has read it and said so, and nothing that already ships is touched or proposed for change by
this file. The bibles are the style guide; the quoted lines are the first draft written against it.

The design authority is [who-she-is-2026-09](who-she-is-2026-09.md) – §1 (the four temperaments),
§4 (the numbers, which win on any drift), §5b (the composition rule, the three tiers, rulings
V1–V4). This document adds no design and rules nothing: it turns §5b's «four voice bibles» line
item into the artifact the next writing session cites.

**Scope.** Wave 1 ships **tier 0 only** – her quoted line inside the parent's week story. The diary
stays HIS journal; she speaks in quotation marks within it (§5b's tier table, ruling V1). Tier 1
(small talk) and tier 2 (the big beats) are waves 3 and 2–4, written later against these same
bibles.

**Two mechanical facts the lines are written to**, so a later writer does not rediscover them:

* **The scrap holds 80 characters.** `tests/week-notes.test.ts` measures the RENDERED sentence,
  parent frame and quotation together. Every line below is inside it.
* **The narrator stays third person.** The same pin forbids a bare `I` and any `you` / `your` in a
  week note. Her quoted speech is therefore written in reply register – «Fine.», «Best week of the
  year!», «It held» – which is how English drops the subject anyway, and which keeps her clipped.
  It costs the voices nothing and it means these lines are shippable against today's pins.

---

## A. The four voice bibles

The axis law (who-she-is §1, restated 09.09): **INTENSITY owns how hard things land and how long
they hold** – tempo, punctuation, the size of the words. **OPENNESS owns her flow with people** –
how much reaches the parent, how directly, and how soon.

So the four bibles are two rules crossed, and every entry below is one of the two speaking:

| | steady | intense |
| --- | --- | --- |
| **open** | `sunny` – says the whole week, evenly | `fiery` – says the whole week, at speed |
| **private** | `quiet` – says the schedule, evenly | `deep` – says one thing, hard, late |

### The age rails, and the field they are written against

⚠ The rails are expressible on `DiaryLifeStage` – `'school' | 'after-school' | 'college' |
'independent'` (`src/shared/protocol/narrative.ts:141`) – and on nothing else. A rail the facts
cannot read is a rail no test can pin. In prose:

| stage value | reads as | the dictionary at this rail |
| --- | --- | --- |
| `school` | young, then teen | the small world in front of her: the court, the bus, dinner, the papers. Short clauses, today's tense, no career vocabulary, no money. The parent shares the day, so she can be overheard rather than reported |
| `after-school` | late teen, still at home | the timetable is gone and the season replaces it: she talks in weeks, not days. Same house, so the same closeness, wider vocabulary |
| `college` | young adult, away | she reports instead of showing. The student's world survives; the distance markers arrive (the drive back, the call). Nothing that needs the parent in the room |
| `independent` | adult | her own household and her own trade – the block, the swing, the schedule, the bill. The furniture of his house leaves the dictionary for good |

⚠ **`domestic` may only ride the first two rails.** It is the KNOWLEDGE licence – it asserts the
parent was in the house to see it (`weekNotes.ts:100`, and the honesty pin re-derives it from
`lifeStage` independently). An adult-stage line carrying `domestic` is a failing test, not a style
choice.

⚠ The rails are **maturity, not personality**. A `quiet` thirty-year-old is still quiet; she is
quiet in an adult's vocabulary. A rail never lends one voice another voice's habits.

---

### A1. `sunny` – open + steady

His word: «умеренно». Warm, plain, unhurried, and she tells him.

**Vocabulary register.** Reaches for: concrete everyday nouns (the court, dinner, the bus, the
strings), plain adjectives that a parent uses (good, hard, fine, all right, long), the practical
detail, the small joke at her own expense, the word «we» about the family. Never uses: stacked
superlatives, catastrophe words (never, ruined, hate), clinical or coach vocabulary about herself,
irony as a shield. She is the only one of the four who will say a feeling word about herself in a
plain sentence and mean exactly it.

**Sentence length and rhythm.** Complete sentences, six to twelve words, one clause hooked to
another with a comma. The tempo does not change when the news does – a title and a lost first
round arrive at the same speed. Two sentences is her natural size; three is a lot.

**What she names and what she leaves out.** She names the whole week, boring parts included: what
she did, what it cost, what she thinks about it, and what she wants next. She leaves out almost
nothing – **and that is the load-bearing fact about her voice: when a sunny girl omits something,
it is an event.** Her silences are legible precisely because they are rare, so the writer must
spend them: one withheld sentence from her carries more than a paragraph from `deep`.

**Punctuation habits.** Full stops and commas. At most one exclamation mark, and only for a real
delight. No ellipses – she does not trail off. Question marks are ordinary and asked outright.

**Age rails.** `school`: dinner-table register, present tense, the day as a list. `after-school`:
the same warmth about the season instead of the day. `college` / `independent`: still tells him
everything, now down a phone and about her own life, with the household detail replaced by her own
– what she cooked, what the flight cost, who she trained with.

---

### A2. `fiery` – open + intense

His word: «много». Everything on the surface, at speed, with the volume the week deserves and then
some.

**Vocabulary register.** Reaches for: absolutes (best, worst, never, always, everything, nothing),
speed and heat words, immediate verdicts delivered before the evidence, repetition of a word for
emphasis. Never uses: hedges (quite, a bit, fairly, probably), measured summaries, the passive
voice, «it was all right». Her superlatives are honest at the moment she says them and she will
contradict them by Thursday – the writer must let both stand, because the contradiction IS the
temperament.

**Sentence length and rhythm.** Bursts. Three words, then three words, then one long spill that
runs past where a sentence should stop. Nothing in the middle range. Intensity owns tempo, so her
line reads faster than the other three even at the same length.

**What she names and what she leaves out.** She names the peak and the crash and skips the middle:
the writer gets the verdict, never the account. She leaves out **proportion** – a bad Tuesday and a
lost final arrive in the same register – and she leaves out the second thought, because she has not
had it yet. She never withholds on purpose; if something is missing it is because she has already
moved on.

**Punctuation habits.** Exclamation marks, used and not saved. Question marks used as exclamations
(«Six weeks?!»). Full stops as brakes mid-sentence. The short dash `–` for the swerve. Never an
ellipsis: she does not trail off, she stops.

**Age rails.** `school`: volume with a small vocabulary – the same storm about a school test.
`after-school`: the storm gains the season's stakes. `college` / `independent`: the volume survives
intact into adulthood and only the subjects grow up; an adult `fiery` girl is not a calmer one, she
is one with a bigger vocabulary for the same weather.

---

### A3. `quiet` – private + steady

His word: «одни на всю жизнь». Even, unhurried, and she says the third thing instead of the first.

**Vocabulary register.** Reaches for: understatement (all right, fine, manageable, not bad), the
practical detail standing in for the feeling, the schedule, the object, the other person. Never
uses: superlatives, feeling words about herself, «hate», «amazing», anything that would need
following up. Her adjectives are one rung below the truth in both directions – «all right» covers a
very good week and a hard one, and the parent has to read the week to know which.

**Sentence length and rhythm.** Short and level – four to nine words, one clause. Even tempo,
never hurried, never clipped for effect. She does not build to anything. A second sentence usually
changes the subject.

**What she names and what she leaves out.** ⭐ **This is where her voice actually lives.** She names
the practical surface: what time, which court, who else was there, what it cost. She leaves out
**herself** – the reason, the feeling, the ask, and the part of the week that mattered. The writer's
whole job in this voice is choosing what she talks about INSTEAD, because the parent learns what
happened from the thing she did not mention. A `quiet` line that states a feeling directly is a
broken line, however good it reads.

**Punctuation habits.** Full stops. One comma at most. No exclamation marks, ever. No question
marks – she does not ask, she waits, and the writer must let the parent ask first. No dashes.

**Age rails.** `school`: the small world, reported flatly – the fixture, the bus, the papers.
`after-school`: the same flatness about bigger things, which makes the omissions bigger too.
`college` / `independent`: distance and privacy compound, so her lines get shorter, not longer, and
the parent's own sentence around them has to carry more.

---

### A4. `deep` – private + intense

His word: «мало». One thing, exactly, hard, and usually after it is over.

**Vocabulary register.** Reaches for: short weighted words, absolutes used once and never repeated,
plain nouns doing a paragraph's work. Never uses: chatter, small talk, hedges, jokes about herself,
qualifiers of any kind. Where `fiery` says «Six weeks?! Six?», `deep` says «Twelve weeks.» and
nothing else – the same size of feeling, none of it spent on the sentence.

**Sentence length and rhythm.** Two to six words. Sometimes one. A full stop where a comma belongs,
which is what makes her read heavy rather than merely brief. The second sentence, when it comes,
arrives later in the week and the parent's frame has to say so.

**What she names and what she leaves out.** She names one thing and it is the true one – but late,
and stripped of its size. She leaves out the middle, the ask, and above all **the timing**: the
parent learns after the fact, which is §1's «the parent often learns late» made audible. She never
volunteers the second half. ⚠ The failure mode to avoid: writing her as sullen. She is not
withholding to punish; the words are simply expensive for her, and the line should read as weight,
not as a door closing. The closed door is section B, and it is a different sound.

**Punctuation habits.** Full stops only. No exclamation marks – the intensity is in the content, and
a mark would spend it. No ellipses; she does not hesitate in public. Rarely a question mark, and
when it comes it is the whole line.

**Age rails.** `school`: very few words and no abstraction – the weight lands in what a child does
not say. `after-school`: the same economy about the season. `college` / `independent`: adulthood
gives her the vocabulary to say the hard thing exactly, so an adult `deep` line is the most precise
of the sixteen registers in this document, and the latest.

---

## B. The flat pool – what `strained` and `cold` sound like

At a `strained` or `cold` bond the four voices **collapse into one shared pool** (who-she-is §5b).
This is not a fifth temperament. It is the same girl with her walls up, and the point is that the
player cannot tell which of the four he is listening to any more.

**The style, stated as rules:**

* **One to four words, then the parent's own sentence carries the rest.** Nothing she says is long
  enough to have a shape.
* **The vocabulary is the smallest set in the document**: fine, okay, all right, same, nothing,
  on schedule, it is healing. Six or seven words, reused. Reuse is the feature – a pool that reads
  varied has failed.
* **No feature of any voice survives**: no `fiery` exclamation mark, no `sunny` warmth, no `quiet`
  substituted detail, no `deep` weight. Full stops and flat vowels.
* **She answers; she never offers.** Every flat line is a reply to a question the parent asked. The
  four voices all volunteer something; this one does not, and the parent's frame usually has to
  contain the question.
* **She is never rude.** ⚠ This is the trap. Hostility would be a scene, and a scene is a
  relationship. The loss the player is supposed to hear is that there is nothing there – politeness
  with the person taken out of it.
* **It claims almost nothing.** A flat line asserts only that she answered, which is why one line
  can serve every week – and that interchangeability is the mechanical shape of the same fact.

**And the second step of the loss, which the writer must not soften:** the tier table gives tier 0
«rare at strained; **absent at cold**». So a career walks down a ladder with three rungs – her own
voice, then this pool, then nothing at all, with the parent's line alone under the painting. Wave
1's flat pool is licensed on the ordinary training week and on the layoff only (see D5): at
`strained` she has nothing to say about the weeks that actually mattered, which is the truest
sentence in this section.

---

## C. The five Mood words – ⚠ ALL FIVE DRAFT FOR HIM

The word ladder the Mood tile gains for `spirit`. A word, never a bar, never a number, never an
arrow (who-she-is §5, the fog law).

| word | the state it covers |
| --- | --- |
| **Glowing** | the top of her range – her life, not her results, has gone right, and it shows on a week nobody won anything. Rare by design |
| **Bright** | above her own baseline: things have landed, and she has room to spare |
| **Steady** | her ordinary state – nothing pressing in either direction. ⚠ **Shared with condition's own word by his ruling** (who-she-is §7, tail 4: «the neutral state is one state and gets one word»); the gamma lives in the other four, and the tile's priority rule – injury first, then the larger deviation of body vs mood – decides which reading the shared word is carrying |
| **Dimmed** | below her baseline and visible: the week has cost her something. Not a crisis, and the road back is ordinary |
| **Heavy** | the bottom of her range – the weeks under the knee, where the match factor starts reading her |

⚠ **Two facts around the ladder, stated so nothing is proposed by accident.** (1) The tile already
speaks eight words today, off her face – Steady, Happy, Low, Focused, Tired, Hurt, On the mend,
Angry (`KidScreen.vue`, `WeekRecapCard.vue`). **None of them is touched, moved or renamed by this
document**; the five above are the spirit ladder joining them under the priority rule, and «Steady»
is the deliberate overlap he ruled. (2) The numeric cut points between the five are **not proposed
here** – they belong to wave 1's bench, which carries the ≥ 2 % occupancy bar per word (who-she-is
§4: a gamma that never fires is dead copy).

---

## D. The tier-0 quoted lines – first drafts, with the licence each claims

**How to read a row.** Every line is one entry in the ordinary-week note pool
(`src/engine/diary/weekNotes.ts`): the parent's sentence with her words inside it. «Claims» names
the `WeekClaims` members the entry asserts – all of them exist in the code today. «Owed» names what
wave 1 must add before the line can be selected at all.

**The three OWED licences, named once here rather than per row:**

| owed | what it is | where it comes from |
| --- | --- | --- |
| `closeBond` / `strainedBond` | the bond band as a claim, so a warm line cannot fire in a cold week | build plan §1e – `DiaryFacts` gains `bondBand` (close ≥ 80 / steady 55..79 / strained 35..54 / cold < 35) and `WeekClaims` gains the two members |
| register – `bright` / `level` / `low` | the spirit register of the moment, collapsed to three for speech. ⚠ **A licence on the variant, NOT a new pool** (who-she-is §5b's composition rule): most moments carry one line and only split where a low week changes the words | wave 1's own spirit; needs one reader on the facts |
| the voice id itself | `sunny` / `fiery` / `quiet` / `deep` – the licence all 44 lines below read | `world.temperament` reaching `DiaryFacts`. ⚠ Not named in the runbook's §4 exposure list; it is owed by the same commit as `bondBand` or none of these lines is selectable |

Unless a row says otherwise: every line claims `notTravellingWeek` (the pool's own precondition),
requires **not `strained` and not `cold`** on the bond, and takes the **`level`** register – the
one variant that is not a low week. Rows marked **low** take the `low` register instead.

⚠ **`bodyGroup` is deliberately claimed by no tier-0 line in wave 1.** It exists
(`weekNotes.ts:118`) and the parent's own anatomy lines use it, but a group-scoped quoted line would
need three variants per voice – leg, arm, trunk – or the completeness pin fails on the two groups
the voice does not have. Twelve lines for one moment is the explosion section E exists to prevent.

### D1. `sunny` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | Six days on court. "Hard week, good week," she said at dinner. | `grind` | |
| 2 | "Two mornings free," she said, and spent one of them at the courts. | `light` | |
| 3 | "Legs are back," she said, and took the stairs two at a time. | `freshBody` | register `bright` |
| 4 | "Papers first, then the court." She kept to it all week. | `exams` | |
| 5 | "No rankings this week," she announced on the first morning. | `vacation` | |
| 6 | "A week off is a week off," she said, and went to find a book. | `restingKnock` | |
| 7 | "It held all week," she said. She taped it herself every morning. | `pushingKnock` | |
| 8 | "Six weeks, then," she said, and asked the physio to write it down. | `injured` | |
| 9 | "Nothing left this week," she said, which she never says. | `tired` | **low** |
| 10 | `Seventeen` today. "Same cake as last year," she said. | `birthday`, `domestic` | rail `school`; template on `ageWord` |
| 11 | "Six weeks of nothing," she said, and listed plans for all of them. | `offSeason` | rail `independent` |

### D2. `fiery` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | Six days on court. "Best week of the year!" she said. Twice. | `grind` | |
| 2 | "Two mornings off and nothing to do!" She was on court by ten. | `light` | |
| 3 | "Everything works today!" she said, and served until it got dark. | `freshBody` | register `bright` |
| 4 | "Papers, papers, papers." Then: "One more hour on court. One!" | `exams` | |
| 5 | "No calendar, no coach, nothing!" She said it three times. | `vacation` | |
| 6 | "Bored. Bored by Tuesday!" she said, on Tuesday. | `restingKnock` | |
| 7 | "Nothing wrong with it. Nothing!" Every session, all week. | `pushingKnock` | |
| 8 | "Six weeks?! Six?" An hour later she had the rehab plan printed. | `injured` | |
| 9 | "Empty. Completely empty." She said it flat, which is the tell. | `tired` | **low** |
| 10 | `Seventeen` today. "Cake first, questions later!" she announced. | `birthday`, `domestic` | rail `school` |
| 11 | "Six weeks off and already restless!" she said, in week one. | `offSeason` | rail `independent` |

### D3. `quiet` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | Six days on court. "It was all right," she said. That was all. | `grind` | |
| 2 | Asked about Sunday: "The court was free." Nothing further. | `light` | |
| 3 | "The legs are fine now." Nothing else about it, all week. | `freshBody` | register `bright` |
| 4 | "They went as expected." She did not say how they went. | `exams` | |
| 5 | "The lake was cold," she said, of a week we thought had been good. | `vacation` | |
| 6 | "A week is a week," she said, and put the racquet by the door. | `restingKnock` | |
| 7 | "It is manageable." That is her word for something else. | `pushingKnock` | |
| 8 | "Twelve weeks," she said, and then changed the subject to lunch. | `injured` | |
| 9 | "Just tired," she said. Two words did the whole week's work. | `tired` | **low** |
| 10 | `Seventeen` today. "It does not need to be a thing," she said. | `birthday`, `domestic` | rail `school` |
| 11 | "Quiet here," she said, of six weeks she had been waiting for. | `offSeason` | rail `independent` |

### D4. `deep` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | Six days on court. "It was a lot," she said, on Sunday night. | `grind` | |
| 2 | "Two mornings." She did not say what she did with either. | `light` | |
| 3 | "Better." One word, and the first one about her legs in a month. | `freshBody` | register `bright` |
| 4 | "They are done." Nothing more until the results came. | `exams` | |
| 5 | "It helped." She said it on the last day, about the whole week. | `vacation` | |
| 6 | "A week." Then, on Thursday: "It has been a long week." | `restingKnock` | |
| 7 | "It is holding." She said it once, on Monday, and not again. | `pushingKnock` | |
| 8 | "Twelve weeks." She told us four days after the physio did. | `injured` | |
| 9 | "Nothing left." She had said nothing at all for three days first. | `tired` | **low** |
| 10 | `Seventeen` today. "No fuss." The cake stayed in its box until six. | `birthday`, `domestic` | rail `school` |
| 11 | "Six weeks." She did not say whether that was good or bad. | `offSeason` | rail `independent` |

### D5. The flat pool – 8 lines, shared by all four voices

⚠ Every row owes `strainedBond` and claims `notTravellingWeek`. Rows 1–6 are licensed on the
ordinary training week and carry `f.injured === null`; rows 7–8 claim `injured`, because the
standing rule of this pool is that **a layoff takes the note** – a line selectable on an injured
week must say so.

| # | line | claims |
| --- | --- | --- |
| 1 | "Fine," she said. Nothing else, all week. | – |
| 2 | "It was okay." That was all of it. | – |
| 3 | "Same as last week," she said. It was not. | – |
| 4 | We asked how the week went. "Fine." | – |
| 5 | "Nothing to report," she said, and that was the report. | – |
| 6 | "All right." The same two words as last week. | – |
| 7 | "It is healing," she said. Nothing about how it felt. | `injured` |
| 8 | "On schedule," she said, about twelve weeks of her life. | `injured` |

---

## E. The arithmetic – why this does not explode

**The rule (who-she-is §5b).** Per spoken moment: ~4 dialog variants (×2 where a low week changes
the words) + 4 one-liners + the shared flat pool + the feed row ≈ **9–14 lines, not 4 × 5 × 4 = 80.**
The three owners each own one part of a line – temperament the shape, spirit the register, bond the
channel – so they compose instead of multiplying.

**What wave 1 actually spends.** Tier 0 is the cheapest of the three tiers: no dialog tree, no reply
options, no feed row of its own, one line per voice per moment.

| block | count |
| --- | --- |
| 8 shared moments × 4 voices (`grind`, `light`, `freshBody`, `exams`, `vacation`, `restingKnock`, `pushingKnock`, `injured`) | 32 |
| 1 low-register variant × 4 voices (the `tired` week – the one moment where a low week changes the words) | 4 |
| 2 rail-scoped lines × 4 voices (`birthday` at the `school` rail with `domestic`; `offSeason` at the `independent` rail) | 8 |
| **voiced total** | **44** |
| the shared flat pool, written once for every moment and every voice | 8 |
| **grand total, the whole of wave 1's voice** | **52** |

**Per moment, which is the number the rule is about:** 4 lines (one per voice), 6 at the layoff
where the flat pool has its own two, plus a share of the 6 ordinary flat lines wherever the week is
a plain training week. Against the naive shape – 4 voices × 3 registers × 4 bond bands = **48 lines
per moment** – the eleven moments here would have cost **528**. They cost 52.

**Where the saving comes from, in order of size:**

1. **The flat pool is written once, not per moment and not per voice** – it is one pool of 8 lines
   standing in for 4 voices × 11 moments at two bond bands. It is the single largest economy in the
   design, and it is free because interchangeability is the artistic point.
2. **Register is a licence, not a pool.** Only one moment in eleven splits low vs not-low, so 11
   moments cost 12 variants rather than 33.
3. **Bond selects, it does not multiply** – `close` and `steady` share the voiced line, `strained`
   takes the flat pool, `cold` takes silence. Four bands, two pools, no third.
4. **The rails scope lines, they do not duplicate them** – 9 of each voice's 11 lines are
   stage-neutral and reach every rail; 2 are rail-scoped, and both sit on moments that already have
   a neutral sibling, so no stage and no voice is ever left without a line.
