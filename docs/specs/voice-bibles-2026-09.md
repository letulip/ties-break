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
the owner has read it and approved it, and nothing that already ships is touched or proposed for
change by this file. The bibles are the style guide; the quoted lines are the first draft written
against it.

The design authority is [who-she-is-2026-09](who-she-is-2026-09.md) – §1 (the four temperaments),
§4 (the numbers, which win on any drift), §5b (the composition rule, the three tiers, rulings
V1–V4). This document adds no design and rules nothing: it turns §5b's «four voice bibles» line
item into the artifact the next writing session cites.

**Scope.** Wave 1 ships **tier 0 only** – her quoted line inside the parent's week story. The diary
stays the parent's journal; she speaks in quotation marks within it (§5b's tier table, ruling V1).
Tier 1 (small talk) and tier 2 (the big beats) are waves 3 and 2–4, written later against these same
bibles.

## The mechanical facts the lines are written to

So that a later writer does not rediscover them, and so that nothing here is described from memory.

**1. The scrap holds 80 characters.** `tests/week-notes.test.ts:664-665` measures the RENDERED
sentence, parent frame and quotation together. Every line below is inside it.

⚠ **Slot 10 is measured against the pin's fixture, not against the longest age word.** The fixture
sets `birthdayAge: null` (`tests/week-notes.test.ts:105`), so the birthday template renders
`capitalise(ageWord(null))` = **«A year older»** (`src/engine/diary/words.ts:161`) – twelve
characters, against the nine of «Seventeen». That is the worst case for the budget, and it is the
string slot 10 is measured on below.

**2. How she speaks – the owner's ruling of 09.09, and the shape rules that make it checkable.**

* **She may speak in the first person inside her own quotation marks.** `I`, `me`, `mine` and `we`
  are hers to use there, and so is addressing the parent directly. That is how a person talks.
* **Outside the quotation the narration stays third person about her**, and carries no `I`, `you`,
  `your`, `me`, `mine` or `we`. The diary is still the parent's journal; the ruling moves the
  boundary of the rule, it does not lift the rule.
* ⚠⚠ **Two shape rules make that machine-checkable, and every one of the 52 lines below obeys both:**
  1. **At most ONE quoted span per line.** A greedy `/".*"/` strip over two spans swallows the
     narration between them, so a two-span line can hide a first-person narrator from the check.
  2. **The narration outside the quotation contains `she` or `She`.** A paired `/"[^"]*"/g` strip
     cannot tell her quotation from anyone else's – `"You are not going back until I say so," we
     said.` would otherwise pass it – so the `she` is what names the speaker as her.
* ⚙ **THE PIN LANDED (wave 1, step 4)** – this bullet used to say it did not exist yet, and the
  sentence went stale by its own success. `tests/week-notes.test.ts` now asserts the third-person law
  on the narration OUTSIDE her quotation and both shape rules above as their own cases, and wave 2
  extended the same three pins to the life-beat pools. Section D is selectable, and every line the
  layer adds from here is held to the same contract.

⚠ **What today's pin actually asserts**, stated plainly because both earlier drafts of this document
described it wrongly. `tests/week-notes.test.ts:672` matches `/\bYou\b|\byour\b|\bYour\b/` –
**case-sensitive, and with no lowercase `you` arm at all** – and `:678` matches `/\bI\b/`. There is
**no `me`, `mine` or `we` arm anywhere in it.** So today the first-person ban is one word wide, the
address ban misses the commonest spelling of the word it bans, and the whole of it scans the
rendered note without knowing where the quotation marks are. Step 4 replaces it; it does not merely
relax it.

---

## A. The four voice bibles

The axis law (who-she-is §1, restated 09.09): **INTENSITY owns how hard things land and how long
they hold** – tempo, punctuation, the size of the words. **OPENNESS owns her flow with people** –
how much reaches the parent, how directly, and how soon.

So the four bibles are two rules crossed, and every entry below is one of the two speaking:

| | steady | intense |
| --- | --- | --- |
| **open** | `sunny` – says the whole week, evenly | `fiery` – offers the first verdict, at speed |
| **private** | `quiet` – says the schedule, evenly | `deep` – says one thing, hard, late |

Openness is that she volunteers without being asked; the four differ in WHAT she volunteers.

### The age rails, and the field they are written against

⚠ The rails are expressible on `DiaryLifeStage` – `'school' | 'after-school' | 'college' |
'independent'` (`src/shared/protocol/narrative.ts:141`) – and on nothing else. A rail the facts
cannot read is a rail no test can pin. In prose:

| stage value | reads as | the dictionary at this rail |
| --- | --- | --- |
| `school` | young, then teen | the small world in front of her: the court, the bus, dinner, the papers. Short clauses, today's tense, no career vocabulary, no money. The parent shares the day, so she can be overheard rather than reported |
| `after-school` | late teen, still at home | the timetable is gone and the season replaces it: she talks in weeks, not days. Same house, so the same closeness, wider vocabulary |
| `college` | young adult, away | she reports instead of showing. The student's world survives; the distance markers arrive (the drive back, the call). Nothing that needs the parent in the room |
| `independent` | adult | her own household and her own trade – the block, the swing, the schedule, the bill. The furniture of the parent's house leaves the dictionary for good |

⚠ **`domestic` may only ride the first two rails.** It is the KNOWLEDGE licence – it asserts the
parent was in the house to see it (`weekNotes.ts:100`, and the honesty pin re-derives it from
`lifeStage` independently). An adult-stage line carrying `domestic` is a failing test, not a style
choice.

⚠ The rails are **maturity, not personality**. A `quiet` thirty-year-old is still quiet; she is
quiet in an adult's vocabulary. A rail never lends one voice another voice's habits.

**How the rails apply without multiplying the pool.** A line may cross all four rails only when both
its quotation and its parent frame are genuinely age-neutral. `She said` records disclosure;
`she left it by the kitchen door every morning` records co-presence and therefore cannot cross to
the `college` or `independent` rail. Age-marked nouns and delivery frames require a rail licence.
The wave-1 table keeps its common rows universal by using reported speech rather than unlicensed
household observation; the school birthday and the independent off-season stay explicitly scoped.

⚠ **The shared distance frames already exist and ship today** – they are not a later tier's
problem. The pool already reaches an adult daughter by voice note, by call, by message and by visit:
`src/engine/diary/weekNotes.ts:219` («Three voice notes this week, all sent after dark.»),
`weekNotes.ts:261` («A light week. She called before nine…»), `src/engine/diary/pool.ts:616` («The
family chat got one photo: racquet, coffee, rain.»), and the whole set is gated by `awayVoice`
(`src/engine/diary/words.ts:79`). **A distance frame is the licensed way an adult-rail line reaches
the parent**, and later tiers extend an existing mechanism rather than cloning every spoken line by
age.

---

### A1. `sunny` – open + steady

Owner shorthand: «умеренно». Warm, plain, unhurried, and she tells the parent.

**Vocabulary register.** Reaches for: concrete everyday nouns (the court, dinner, the bus, the
strings), plain adjectives that a parent uses (good, hard, fine, all right, long), the practical
detail, the small joke at her own expense, the word «we» about the family. Never uses: stacked
superlatives, catastrophe words (never, ruined, hate), clinical or coach vocabulary about herself,
irony as a shield.

⚠ **She is the only one of the four who will say a feeling word about herself in a plain sentence,
in the week it happened, and mean exactly it.** The qualifier is load-bearing and it is what makes
the claim true: `deep` says the feeling late and stripped of its size, `quiet` does not say it at
all, and `fiery` says a verdict where a feeling would go.

**Sentence length and rhythm.** Complete thoughts, six to twelve words, one clause hooked to another
with a comma. Two sentences is her natural size; three is a lot.

⚠ **`sunny` holds SPEED constant** – a title and a lost first round arrive at the same speed. That
is her property and it is not `fiery`'s; the two are named in these words so they cannot be
confused (see A2).

**What she names and what she leaves out.** She names the whole week, boring parts included: what
she did, what it cost, what she thinks about it, and what she wants next. She leaves out almost
nothing – **and that is the load-bearing fact about her voice: when a sunny girl omits something,
it is an event.** Her silences are legible precisely because they are rare, so the writer must
spend them: one withheld sentence from her carries more than a paragraph from `deep`.

**Punctuation habits.** Full stops and commas. At most one exclamation mark, and only for a real
delight. No ellipses – she does not trail off. Question marks are ordinary and asked outright.

**Age rails.** `school`: dinner-table register, present tense, the day as a list. `after-school`:
the same warmth about the season instead of the day. `college` / `independent`: still tells the
parent everything, now down a phone and about her own life, with the household detail replaced by
her own – what she cooked, what the flight cost, who she trained with.

---

### A2. `fiery` – open + intense

Owner shorthand: «много». Everything on the surface, at speed, with the volume the week deserves and
then some.

**Vocabulary register.** Reaches for: absolutes (best, worst, never, always, everything, nothing),
speed and heat words, immediate verdicts delivered before the evidence, repetition of a word for
emphasis. Never uses: hedges (quite, a bit, fairly, probably), measured summaries, the passive
voice, «it was all right». A `fiery` line carrying a hedge IS a `quiet` line, which is why the list
is a rule and not a preference.

Her superlatives are honest at the moment she says them and she will contradict them by Thursday –
the writer must let both stand, because **the contradiction IS the temperament**. ⚠ It is not a
hidden third axis: who-she-is §1 gives intensity «how hard things land **and how long feelings
hold**», so a verdict that has moved by Thursday is intensity expressed, not impulsiveness smuggled
in as a fifth rule. ⚠ **The honesty constraint on it:** every line still claims only what its own
week's facts license, so the contradiction is written ACROSS weeks and never inside one unlicensed
line.

**Sentence length and rhythm.** Bursts. Three words, then three words, then one long spill that
runs past where a sentence should stop. Nothing in the middle range. Intensity owns tempo, so her
line reads faster than the other three even at the same length.

**What she names and what she leaves out.** She names the peak and the crash and skips the middle:
the writer gets the verdict, never the account. She leaves out the second thought, because she has
not had it yet. **She never withholds on purpose; if something is missing it is because she has
already moved on** – that is the boundary with `deep`, who withholds on purpose.

⚠ **`fiery` holds VOLUME constant** – a bad Tuesday and a lost final arrive at the same volume.
That is her property and it is not `sunny`'s speed; say it in these words.

**Punctuation habits.** Exclamation marks, used and not saved. Question marks used as exclamations
(«That long?!»). Full stops as brakes mid-sentence. The short dash `–` for the swerve. Never an
ellipsis: she does not trail off, she stops.

**Age rails.** `school`: volume with a small vocabulary – the same storm about a school test.
`after-school`: the storm gains the season's stakes. `college` / `independent`: the volume survives
intact into adulthood and only the subjects grow up; an adult `fiery` girl is not a calmer one, she
is one with a bigger vocabulary for the same weather.

---

### A3. `quiet` – private + steady

Owner shorthand: «одни на всю жизнь». Even, unhurried, and she says the third thing instead of the
first.

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
**herself** – the reason, the feeling, the emotional ask, and the part of the week that mattered.
A practical question may still be direct. The writer's whole job in this voice is choosing what she
talks about INSTEAD, because the parent learns what happened from the thing she did not mention.

**A `quiet` line that states a feeling directly is a broken line, however good it reads.** ⚠ That is
the tier-0 rule and it is hard for this wave. A tier-2 life beat in waves 2–4 may earn the
exception – a feeling from her would be worth more than a paragraph from anyone else, precisely
because tier 0 spent none – and that is ruled there, not here.

**Punctuation habits.** Full stops. One comma at most. Exclamation marks are exceptional.
**Questions are practical only** – the time, the court, the cost, when rehab starts – and she does
not ask the parent for a feeling or fish for one to be offered. ⚠ **Privacy is not passivity**: she
is not sitting still waiting to be asked, she is asking about the schedule instead of about herself.
Dashes are rare.

**Age rails.** `school`: the small world, reported flatly – the fixture, the bus, the papers.
`after-school`: the same flatness about bigger things, which makes the omissions bigger too.
`college` / `independent`: distance and privacy compound, so her lines get shorter, not longer, and
the parent's own sentence around them has to carry more.

---

### A4. `deep` – private + intense

Owner shorthand: «мало». One thing, exactly, hard, and usually after it is over.

**Vocabulary register.** Reaches for: short weighted words, absolutes used once and never repeated,
plain nouns doing a paragraph's work. Never uses: chatter, small talk, hedges, jokes about herself,
qualifiers of any kind. Where `fiery` reacts to the size of a layoff, `deep` asks one exact question
and waits for the answer – the same size of feeling, none of it spent on the sentence. ⚠ The
example is deliberately duration-free: `injured` licenses that an injury exists and nothing at all
about its length (see D, slot 8).

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
player cannot tell which of the four voices this is any more.

**The style, stated as rules:**

* **One to four words, then the parent's own sentence carries the rest.** Nothing she says is long
  enough to have a shape.
* **The vocabulary is the smallest set in the document**: fine, okay, all right, same, nothing,
  on schedule, it is healing. Six or seven words, reused. Reuse is the feature – a pool that reads
  varied has failed.
* **No feature of any voice survives**: no `fiery` exclamation mark, no `sunny` warmth, no `quiet`
  substituted detail, no `deep` weight. Full stops and flat vowels. ⚠ Stated this way on purpose –
  it can be checked by reading a line, which «no feature is reliable enough to identify her» cannot.
* **She answers; she never offers.** Every flat line is a reply to a question the parent asked. The
  four voices all volunteer something; this one does not, and the parent's frame usually has to
  contain the question.
* **She is never rude.** ⚠ This is the trap. Hostility would be a scene, and a scene is a
  relationship – and a separately licensed one, which this pool is not. The loss the player is
  supposed to hear is that there is nothing there – politeness with the person taken out of it.
* **It claims almost nothing.** A flat line asserts only that she answered, which is why one line
  can serve every week – and that interchangeability is the mechanical shape of the same fact.

**And the second step of the loss, which the writer must not soften:** the tier table gives tier 0
«rare at strained; **absent at cold**». So a career walks down a ladder with three rungs – her own
voice, then this pool, then nothing at all, with the parent's line alone under the painting. Wave
1's flat pool is licensed on the ordinary training week and on the layoff only (see D5): at
`strained` she has nothing to say about the weeks that actually mattered, which is the truest
sentence in this section.

---

## C. The five Mood words – ⚠ ALL FIVE DRAFT FOR THE OWNER

The word ladder the Mood tile gains for `spirit`. A word, never a bar, never a number, never an
arrow (who-she-is §5, the fog law). ⚠ The five words are the owner's to rule and nothing in the code
decides them; they are recorded here as drafted and are not renamed by review.

| word | the state it covers |
| --- | --- |
| **Glowing** | the top of her range – her life, not her results, has gone right, and it shows on a week nobody won anything. Rare by design |
| **Bright** | above her own baseline: things have landed, and she has room to spare |
| **Steady** | her ordinary state – nothing pressing in either direction. ⚠ **Shared with condition's own word by owner ruling** (who-she-is §7, tail 4: «the neutral state is one state and gets one word»); the gamma lives in the other four, and the tile's priority rule – injury first, then the larger deviation of body vs mood – decides which reading the shared word is carrying |
| **Dimmed** | below her baseline and visible: the week has cost her something. Not a crisis, and the road back is ordinary |
| **Heavy** | the bottom of her range – the weeks under the knee, where the match factor starts reading her |

⚠ **«Heavy» is the one gloss in this table anchored to a number**, which is why it is worded that
way: `ECONOMY.spirit.knee = 60` (`src/engine/economy.ts:3335`), and `spiritMatchFactor`
(`src/engine/spirit.ts:116-120`) returns 1.0 at or above 60 and falls linearly to the
`ECONOMY.spirit.floor` of 0.90 at spirit 0. «Under the knee» is therefore a checkable sentence and
not a mood about a mood.

⚠ **Two facts around the ladder, stated so nothing is proposed by accident.**

**(1) The tile already speaks eight words today, off her face** – Steady, Happy, Low, Focused,
Tired, Hurt, On the mend, and then a word the two surfaces **do not agree on**:
`src/components/screens/KidScreen.vue:129` says `angry: 'Angry'`, while
`src/components/WeekRecapCard.vue:646` says `angry: 'Frustrated'`. ⚠⚠ Earlier drafts of this
document listed «Angry» for both and gave `KidScreen.vue` without its `screens/` directory; both
were wrong. **This document proposes no change to either surface.** The disagreement is recorded
here for one reason only: when the engine-side Mood word arrives it must not silently unify them as
a side effect of landing. **None of the eight is touched, moved or renamed by this document**; the
five above are the spirit ladder joining them under the priority rule, and «Steady» is the
deliberate overlap the owner ruled.

**(2) The numeric cut points between the five are not proposed here** – they belong to wave 1's
bench, which carries the ≥ 2 % occupancy bar per word (who-she-is §4: a gamma that never fires is
dead copy).

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

**And a fourth thing is owed, which is a test and not a field: the quote-aware pin.** Every line
below is written to the owner's 09.09 ruling – first person legal inside her quotation, third person
and no address outside it – and today's pin cannot express that. Step 4 must replace
`tests/week-notes.test.ts:672` and `:678` with an assertion that strips **one** quoted span, checks
that the remainder contains `she` or `She`, and then holds the remainder to `/\bI\b/`, `/\byou\b/i`,
`/\byour\b/i`, `/\bme\b/`, `/\bmine\b/` and `/\bwe\b/`. The two shape rules in the preamble are what
make that strip safe, and all 52 lines below obey them. Until it lands, no line here is selectable.

Unless a row says otherwise: every line claims `notTravellingWeek` (the pool's own precondition),
requires **not `strained` and not `cold`** on the bond, and takes the **`level`** register – the
one variant that is not a low week. Rows marked **low** take the `low` register instead.

⚠ **`bodyGroup` is deliberately claimed by no tier-0 line in wave 1.** It exists
(`weekNotes.ts:118`) and the parent's own anatomy lines use it, but a group-scoped quoted line would
need three variants per voice – leg, arm, trunk – or the completeness pin fails on the two groups
the voice does not have. Twelve lines for one moment is the explosion section E exists to prevent.

⚠ **Three standing constraints the table is written to, so no row has to repeat them.**

* **No duration, count or place is asserted on a claim that does not carry one.** `injured` carries
  `{kind, weeksRemaining, totalWeeks}` (`src/shared/protocol/narrative.ts:181`), so a length may be
  named **only through a template**, the way `src/engine/diary/pool.ts:661` does it – every slot-8
  line below is duration-free instead. `offSeason` says only that this is an off-season week, and
  `OFF_SEASON_WEEKS = 3` (`src/engine/season/calendar.ts:1701`), so no line may count them.
  `vacation` has **no `WeekClaims` member for the package at all**, so no line may name a place, a
  destination or the weather – the catalogue it would be guessing at is
  `staycation / grandma / camping / seaside / resort` (`src/engine/economy.ts:4174+`) and it holds no
  lake.
* **`DiaryFacts` is ONE week.** There is no previous-week field, so no line compares this week with
  another, counts how often she says a thing, or reaches into her history.
* **The frame stays inside the week the note is for**, and it records disclosure rather than
  co-presence unless the row carries `domestic` with a rail.

### D1. `sunny` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | "Hard week, good week, and I would take another," she said. | `grind` | |
| 2 | "Two mornings free, and that felt like plenty," she said. | `light` | |
| 3 | "I feel good this week. Properly good," she said. | `freshBody` | register `bright` |
| 4 | "Papers first, then the court." She kept to it all week. | `exams` | |
| 5 | "A whole week with nothing booked, and I needed it," she said. | `vacation` | |
| 6 | "A week off is still a week, and I'll take it," she said. | `restingKnock` | |
| 7 | "It held all week and I was careful with it," she said. | `pushingKnock` | |
| 8 | "All right. Tell me what comes first," she said. | `injured` | duration-free |
| 9 | "This one took everything I had," she said, in those words. | `tired` | **low** |
| 10 | `A year older` today. "Save me the corner piece," she said. | `birthday`, `domestic` | rail `school`; template on `capitalise(ageWord(f.birthdayAge))`, shown at the pin's fixture value |
| 11 | "Nothing to play for a while, and I've made a list," she said. | `offSeason` | rail `independent` |

### D2. `fiery` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | "Six days! Every one of them at full speed!" she said. | `grind` | |
| 2 | "Free mornings! Two of them! I need a plan," she said at speed. | `light` | |
| 3 | "Everything works today! Everything!" she said, at volume. | `freshBody` | register `bright` |
| 4 | "Papers, papers, papers! Then one hour on court. One!" she said. | `exams` | |
| 5 | "No rankings, no schedule, nothing!" she said, three times over. | `vacation` | |
| 6 | "Resting is the worst part!" she said, more than once. | `restingKnock` | |
| 7 | "Nothing wrong with it. Nothing!" she said after training. | `pushingKnock` | |
| 8 | "That long?! There has to be another way," she said straight off. | `injured` | duration-free |
| 9 | "Empty. Completely empty." She said it flat, which is the tell. | `tired` | **low** |
| 10 | `A year older` today. "Cake first, questions later!" she announced. | `birthday`, `domestic` | rail `school` |
| 11 | "No matches and I'm already restless!" she wrote. | `offSeason` | rail `independent` |

### D3. `quiet` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | "Hard enough," she said. She named the hours, not the week. | `grind` | |
| 2 | "The court was free," she said, when asked how she spent it. | `light` | |
| 3 | "Better today," she said. Nothing further. | `freshBody` | register `bright` |
| 4 | "The papers are done," she said. Nothing about how they went. | `exams` | |
| 5 | Asked about the break, she said: "It was quiet." Nothing more. | `vacation` | no place, no weather, no package |
| 6 | "The court can wait," she said. That was the whole answer. | `restingKnock` | |
| 7 | "Manageable," she said. No second sentence followed. | `pushingKnock` | |
| 8 | "When does rehab start?" she asked. Nothing else. | `injured` | duration-free; the practical question A3 licenses |
| 9 | "Just tired," she said. Two words did the whole week's work. | `tired` | **low** |
| 10 | `A year older` today. "Can we keep it small?" she asked. | `birthday`, `domestic` | rail `school` |
| 11 | She said it by message and left it there: "Quiet here." | `offSeason` | rail `independent`; distance frame |

### D4. `deep` – 11 lines

| # | line | claims | notes |
| --- | --- | --- | --- |
| 1 | "It was a lot," she said, and not until it was over. | `grind` | |
| 2 | "Sunday was mine." She did not say what she did with it. | `light` | |
| 3 | "Ready," she said before the first session. | `freshBody` | register `bright` |
| 4 | "Done." She said it about the exams and nothing else. | `exams` | |
| 5 | "It helped." She said so on the last day and not before. | `vacation` | |
| 6 | "Long week," she said on Thursday. | `restingKnock` | |
| 7 | "It is holding." She said it once, on Monday, and not again. | `pushingKnock` | |
| 8 | "How long?" she asked. Nothing else until the answer. | `injured` | duration-free |
| 9 | "Nothing left." She waited until Sunday to say it. | `tired` | **low** |
| 10 | `A year older` today. "No fuss," she said. She let the cake wait. | `birthday`, `domestic` | rail `school` |
| 11 | "It is over for now." She did not say if that was good or bad. | `offSeason` | rail `independent` |

### D5. The flat pool – 8 lines, shared by all four voices

⚠ Every row owes `strainedBond` and claims `notTravellingWeek`. Rows 1–6 are licensed on the
ordinary training week and carry `f.injured === null`; rows 7–8 claim `injured`, because the
standing rule of this pool is that **a layoff takes the note** – a line selectable on an injured
week must say so.

| # | line | claims |
| --- | --- | --- |
| 1 | "Fine," she said. Nothing else, all week. | – |
| 2 | "It was okay," she said. That was all of it. | – |
| 3 | Asked about training, she said: "Same." Nothing after it. | – |
| 4 | Asked how the week went, she said only: "Fine." | – |
| 5 | "Nothing to report," she said, and that was the report. | – |
| 6 | "All right," she said. Two words, and no opening in them. | – |
| 7 | "It is healing," she said. Nothing about pain. | `injured` |
| 8 | "On schedule," she said. That was the whole of the update. | `injured` |

---

## E. The arithmetic – why this does not explode

**The rule (who-she-is §5b).** Per spoken moment: ~4 dialog variants (×2 where a low week changes
the words) + 4 one-liners + the shared flat pool + the feed row ≈ **9–14 lines, not 4 × 5 × 4 = 80.**
The three owners each own one part of a line – temperament the shape, spirit the register, bond the
channel – so they compose instead of multiplying.

**What wave 1 actually spends.** Tier 0 is the cheapest of the three tiers: no dialog tree, no reply
options, no feed row of its own, one line per voice per moment. ⚠ Recomputed against the table
above, not carried over from either draft: no merged line gained a rail, because every household
frame in section D was rewritten as reported speech, so the rail-scoped count is still two per
voice and the totals stand.

| block | count |
| --- | --- |
| 8 shared moments × 4 voices (`grind`, `light`, `freshBody`, `exams`, `vacation`, `restingKnock`, `pushingKnock`, `injured`) | 32 |
| 1 low-register variant × 4 voices (the `tired` week – the one moment where a low week changes the words) | 4 |
| 2 rail-scoped lines × 4 voices (`birthday` at the `school` rail with `domestic`; `offSeason` at the `independent` rail) | 8 |
| **voiced total** | **44** |
| the shared flat pool, written once for every moment and every voice | 8 |
| **grand total, the whole of wave 1's voice** | **52** |

⚠ **Slot 9 asserts two different things and this row has to say so.** `tired` is a **BODY** claim:
the shipped lines license it on `conditionBand` being `worn` or `drained`
(`src/engine/diary/weekNotes.ts:201`, `:336`; `ConditionBand` is `'fresh' | 'ok' | 'worn' |
'drained'`, `src/shared/protocol/narrative.ts:135`). `low` is the **SPIRIT** register, the licence
on the variant. They are two different numbers and neither implies the other – a drained body on a
level spirit is an ordinary week, and slot 9 is the one moment in eleven that needs both at once.
The row above counts it once, as the register split; the claim is separate and is written in the
table.

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
4. **The rails scope lines, they do not duplicate them.** Per voice: **8** of the 11 lines carry no
   stage licence and reach every rail; **1** (slot 4, `exams`) carries no stage licence either but
   is bounded by its own fact – `examsWeek` is `isExamWeek(week, schoolOver)` and returns `false`
   once school is over (`src/engine/season/calendar.ts:1729-1733`), so it costs no rail and adds no
   line while reaching only the first two rails; and **2** are rail-scoped. Both rail-scoped moments
   sit beside a neutral sibling, so no stage and no voice is ever left without a line.

⚠ **One consequence, recorded for the owner and deliberately not fixed here.** `birthday` is scoped
to `school` (it carries `domestic`) and `offSeason` is scoped to `independent`. `offSeasonWeek` is
calendar-only – `isOffSeasonWeek(week)` at `src/engine/diary.ts:158`, with no stage gate – so the
scope on slot 11 is this document's choice, not the engine's. The consequence is that **no single
career ever hears both voiced lines**: a girl young enough for the birthday line is not independent
yet, and by the time she is, the birthday line has left the pool. Whether slot 11 should also carry
an `after-school` variant is the owner's call, not this document's.
