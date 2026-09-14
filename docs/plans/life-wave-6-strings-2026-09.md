---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 6 – every player-facing string the wave touches (the вычитка table)

The spotlight wave's whole copy set, in one place, for the architect's read and the owner's
playtest. T8 of [the wave-6 builder brief](life-wave-6-builder-2026-09.md); its **§5 is the gate
this table feeds** – **the builder writes against the bibles, the вычитка is the architect's, the
playtest is the owner's** (the 10.09 rule). The shape and the rigour are
[wave 5's strings document](life-wave-5-strings-2026-09.md), which is this file's template.

**Two shipped strings moved in this wave, and each has a written ruling behind it** (§6) – ⚠ but
only ONE of them is T8's own edit, and §0 says which. Nothing else in `src/` was touched by T8.
Every other row below is quoted **verbatim from the tree**, extracted from the source at run time
rather than transcribed – see the provenance note.

**Provenance.** The shipped rows are read out of the working tree by a lint bench that imports the
exported constants and cuts the module-private ones out of their own source with **throwing**
markers (`tests/helpers/source.ts`'s rule: an absent marker raises, it never silently widens the
region). The booth cells are rendered before they are measured, because a raw `(who) => string`
template carries a literal `$` and a money lint asked of the raw form condemns all eight of them
for a dollar sign no player ever sees. So a cell that exists in the code exists here, and a cell
here exists in the code.

## 0. The count

| | |
| --- | ---: |
| player-facing **literals** the wave ADDED to the tree | **14** |
| of them **ruled** – a spec's own wording, transcribed | **1** |
| of them **draft** – written in this wave | **13** |
| shipped surfaces the wave COMPOSES without adding a literal | **1** |
| shipped strings that **MOVED** | **2** – one by ruling P (T3b), one by ruling S (T8) |
| strings **DRAFTED HERE** that have no home in the tree yet | **30** |
| of them **ruled** – a spec's own wording, transcribed | **1** |
| of them **draft** | **29** |
| **the whole вычитка corpus** | **46** |
| of the 46: **ruled 3 · draft 43** | |

⚠ **The brief expected the «moved» answer to be two and it is two, but not the two it named.** It
said «the refusal and, if it needed it, the exposure row». The refusal moved here (§6.1). **The
exposure row did NOT need moving by T8** – T3b had already re-drafted it under ruling P and the
shipped sentence is true of a week that has closed (§6.2, measured). The second mover is that same
T3b edit, one task earlier in this wave. Under **T8's own diff the count is one**; under the
wave's, two.

Per group: T5 the fifth focus **3** (1 ruled) · T8's correction **1** (ruled) · T3/T3b the exposure
row **1** · T6 the leak **3** · T7 the booth **8** · T8's own drafts **30** (1 ruled).

---

## 1. T5 – the fifth focus, «The public life»

`src/engine/world/psychologist.ts`, `src/components/SupportStaffTab.vue` – **3 surfaces**, 1 ruled
/ 2 draft, of which one adds no literal.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| F1 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LABEL.publicLife` | the fifth focus pill on the Support-staff card (the row renders only while hired) | The public life | `ruled` |
| F2 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LINE.publicLife` | the note under the focus row while `publicLife` is the running year and nothing is refused – the ~3 off-season weeks a change is open | The year goes on the weeks under the cameras – and what being looked at takes out of her. | `draft` |
| F3 | `src/components/SupportStaffTab.vue` · `psychologistLine`, hired arm – **COMPOSED, no new literal** | the line under his name all 52 weeks once `publicLife` is the running year (the owner's Q9 ruling of 14.09) | On retainer – the year goes on the weeks under the cameras – and what being looked at takes out of her. | `draft` |

**F1 is `ruled` on wave 5's own standard**: the four existing labels are marked ruled because they
are [the psychologist's year](../specs/the-psychologists-year-2026-09.md) §2's own working names,
transcribed; «The public life» is that table's fifth row read verbatim, so it is transcribed on the
same footing and not written here.

**⚠ Two measurements about F3 the вычитка should have in hand, neither of them a defect.**

1. **All five composed lines carry two short dashes**, and that is wave 5's shape rather than
   something `publicLife` introduced: `On retainer – the year goes on the big points – the head she
   takes into them.` is the `coolhead` frame. The splice pin checks for an ADJACENT doubled dash
   (`– –`) and there is none on any row.
2. **`publicLife`'s composed line is the longest on the card by 12 characters.** Measured:
   `coolhead` 77 · `recovery` 83 · `listen` 88 · `herself` 91 · **`publicLife` 103**. The line
   itself is 89 against a 63–77 sibling range. This surface is not a blocking dialog, so
   CLAUDE.md's 375×667 popup law does not bind it – but it is the surface that is on screen every
   week of the year, and the вычитка is the place to decide whether 103 characters is one line too
   many for a phone. **Stated, not shortened** (invariant 4: the brief asked for the line, not for
   a length).

### 1a. The receipt register – ⚠ DRAFTED HERE, AND IT HAS NO WRITER IN THE TREE

| # | home | when the player would see it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| R1 | **unbuilt** – no constant, no call site | the spec's own receipt for this focus: a no-cents feed row on the week the work shows | The cameras stopped costing her sleep. | `ruled` |

The sentence is the psychologist spec §2's fifth row, transcribed exactly as `COOLHEAD_RECEIPT` and
`RECOVERY_RECEIPT` were. **What does not exist is anything that prints it**, and that is a question
for the architect rather than a gap T8 may close – §8 of the brief forbids this task a new
mechanic, a new constant and a new test. It is §8.1 below.

## 2. T3 / T3b – the exposure feed row

`src/engine/spirit.ts` – **1 string**, 0 ruled / 1 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| E1 | `src/engine/spirit.ts` · `EXPOSURE_ROW` | one no-cents `type: 'life'` feed row on a week whose PREVIOUS week held at least one exposure event of any of the five kinds – kept for the album on the first such week of a season, an ordinary pruning row on the repeats | People were talking about her last week. | `draft` |

**One row per week, not one per event** – §3c's own «the feed is not a ledger». A week that held a
title, a shoot and a wrong story is charged three times and printed once.

### 2a. The per-kind rows the brief asked for – DRAFTED, and ⚠ NOT RECOMMENDED AS THE SHAPE

The brief (T8 item 2) asks for «the exposure feed rows, per kind × plain words». They are drafted
here in full so the architect can read the option rather than imagine it. **None is in the tree.**

| # | kind | what licenses it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| K1 | `'stage'` | a title or a final at `stageTierMin`+ in the closed week (`trophiesByTier`, permanent) | Last week's run at a big one put her on every sports page. | `draft` |
| K2 | `'shoot'` | a delivered shoot week (`completedShootWeeks(world, week + 1)`) | She spent last week under the lights of a shoot. | `draft` |
| K3 | `'publicLoss'` | an early exit at a big stage while she is news (`world.results`, ⚠ honest only inside 52 weeks – ruling G) | Going out early last week happened in front of everybody. | `draft` |
| K4 | `'aired'` | the booth touched her private life at last week's match (T7's stamp) | They talked about her private life on the air last week. | `draft` |
| K5 | `'wrongStory'` | a leak landed WRONG in the closed week (T6) | Last week's story about her was wrong, and it travelled anyway. | `draft` |

**The answer the brief asks for, plainly: ONE row is the better shape for this wave, and five
become right only if the row stops being one-per-week.** Three reasons, and the second is measured
rather than argued.

1. **A week holds ANY MIXTURE of the five.** `exposureEventsOf` returns a list, and T3's term sums
   over it. With five texts and one row a week, a mixed week has to PICK – which is a priority rule,
   i.e. a new mechanic, which §8 forbids – and whichever it picks, the sentence accounts for one
   event's share of the dip while presenting itself as the whole explanation. That is the legibility
   law failing more quietly than the vague sentence does.
2. **⚠ The keep rule is keyed on the row's own TEXT, and five texts silently become five keeps a
   season.** Measured at `src/engine/spirit.ts`: `const firstOfSeason = !world.events.some((e) =>
   e.week >= from && e.text === EXPOSURE_ROW)`. §4's proposal is «keep the FIRST exposure row of a
   season, drop repeats»; under a per-kind set that predicate reads «the first row OF THIS KIND»,
   so a famous season keeps up to five permanent rows instead of one. Nobody asked for that, and it
   is a save-size and album change hiding inside a copy decision.
3. **The five kinds do not partition what the player feels.** `'stage'` and `'publicLoss'` are the
   same lens pointed at two results; `'aired'` and `'wrongStory'` are the same press with and
   without a mistake. The thing all five weeks share is the ATTENTION, which is what E1 names.

**The shape that WOULD carry K1–K5 honestly** is one row per EVENT, which is the ledger §3c
forbids, or a dominant-kind rule, which is a priority mechanic. Either is the architect's to open;
neither is a word swap. §8.2.

## 3. T6 – the leak

`src/engine/world/lifeBeat.ts` – **3 strings**, 0 ruled / 3 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| L1 | `src/engine/world/lifeBeat.ts` · `LEAK_EVENT.true` | a KEPT `type: 'life'` feed row on the week an active, still-private episode leaks and the story lands RIGHT (`publicWrong === false`) – the album keeps it for the career | It is in the papers – there is someone in her life, and they have it right. | `draft` |
| L2 | `src/engine/world/lifeBeat.ts` · `LEAK_EVENT.wrong` | the same row when the story lands WRONG (`publicWrong === true`) – the `story` stream's answer, never a reading of anything the family knows | It is in the papers – a mystery man, and none of it is what happened. | `draft` |
| L3 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEADLINE` | the `'met'` card's heading on the OVERTAKE – the week the leak fires while the parent has not been told yet, so he learns it from the headline. One line on the standing pool, keyed on nothing (not the bond band the three standing frames key on) | We read about it before she told us | `draft` |

**⚠ «A mystery man» is the one gendered noun in the whole wave, and the fabrication is what
licenses it** – the architect's ruling T. The schema persists neither a name nor a gender for a
partner, so the TRUE row stays gender-free and the FALSE one may invent a person: the wrongness is
doing the work, which is §3c-bis's own gem. §7's L3 lint enforces this as a **phrase-scoped**
exception and proves, with its own arm, that a SECOND gendered word in the very same string still
fires.

**⚠ L3 contains `we`, and it is not a narration-law breach.** The narration law («outside the
quotation, no `I` / `you` / `we`») governs HER voiced lines. L3 is the PARENT's frame over a card –
the same surface as wave 5's `PSY_HEADING` («…before **we** answer»), which is shipped. Checked so
the вычитка does not read it as a defect. ⚠ It also carries no full stop, which is `MET_HEADING`'s
own shape on all three standing cells.

## 4. T7 – the booth beats

`src/viz/commentary.ts` – **8 strings**, 0 ruled / 8 draft. ⚠ **Doubly bound** (the brief's §5):
DRAFT under invariant 4 **and** booth-legal under C4. What is TRUE is machine-checked – only a
`publicWeek` fact, only inside `newsWindowWeeks`, only ever once per fact; how it is SAID is his.

Each cell is `(who: string) => string`; `${who}` is the girl's own name, and the SIDE arrives with
the packet so the booth can never air her private life over the other girl's name. Variety is
`variant(pointIndex, n)` – an integer hash, **zero RNG in `src/viz`**.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| B1 | `src/viz/commentary.ts` · `BOOTH_MET_TRUE[0]` | one beat at a changeover of the FIRST revealed match of a big-stage week, while she is news and the `'met'` fact is public, unaired and inside the news window – the world has it RIGHT | `${who}` has somebody in the box this week, and the papers had it before the draw did. | `draft` |
| B2 | `src/viz/commentary.ts` · `BOOTH_MET_TRUE[1]` | the same beat, second variant | A new face in `${who}`'s box, and it has been on the front pages all week. | `draft` |
| B3 | `src/viz/commentary.ts` · `BOOTH_MET_WRONG[0]` | the same beat when the world has the story WRONG – the booth repeats the mistake, and nothing here hedges or apologises | The papers have `${who}` with a mystery man this week, all of them running the same photograph. | `draft` |
| B4 | `src/viz/commentary.ts` · `BOOTH_MET_WRONG[1]` | the same, second variant | A mystery man on every front page beside `${who}`, and no two of them tell it the same way. | `draft` |
| B5 | `src/viz/commentary.ts` · `BOOTH_ENDED_TRUE[0]` | the same beat for the `'ended'` fact, true – the end-titles read | The papers say that is over now, and `${who}` walks out for this one on her own. | `draft` |
| B6 | `src/viz/commentary.ts` · `BOOTH_ENDED_TRUE[1]` | the same, second variant | `${who}`'s box is a seat lighter this week, and the front pages have already explained it. | `draft` |
| B7 | `src/viz/commentary.ts` · `BOOTH_ENDED_WRONG[0]` | the `'ended'` fact as the world got it wrong | The papers have ended it for `${who}` this week, and no two of them tell it the same way. | `draft` |
| B8 | `src/viz/commentary.ts` · `BOOTH_ENDED_WRONG[1]` | the same, second variant | A break-up on every front page beside `${who}`, and not one of them has the same story. | `draft` |

**⚠ B4 and B7 close on the same clause** («and no two of them tell it the same way»), one in each
WRONG pool. Reported, not harmonised – wave 5's вычитка ruled the same family of near-duplication
«variation, and not to be harmonised» (its §8.5–7), and this is the shared shape of one register
rather than an accident. His call.

## 5. T8's own drafts – the voices on an exposure week

⚠ **Nothing in this section is in the tree**, and none of it can be without a mechanic §8 forbids
this task: `SpokenMoment` has no exposure member and `SMALL_TALK_SUBJECTS` no noise member. The
lines are written so a landing task has nothing to invent but the licence. §8.3.

`voice` is her **BIRTH** temperament throughout (§0.6's fence, and the bibles' law) – the mechanics
of this wave read `expressedTemperamentOf`, every LINE reads birth. Mechanically: `VOICE_LINES` is
selected through `weekNotes.ts`'s `voiceOf`, whose body is `f.temperament === t`, and
`DiaryFacts.temperament` is `world.temperament`; `SMALL_TALK_LINE` is indexed by the `voice`
`lifeBeatPromptFor` takes from `lifeBeat.ts`'s own `voiceOf(world)` – `world.temperament ??
temperamentFor(world.seed)` – under a comment at that call site reading «THE VOICE IS BIRTH … the
voices read `world.temperament` and never the expressed reading T7 builds».

### 5a. Tier 0 – the week note (`VOICE_LINES`, a new `'exposure'` moment)

**16 cells**, voice × the four-stage corpus, every one inside the bible's 80-character scrap
measured on the rendered sentence, one quoted span each, third-person narration naming her.

| # | cell | the string, verbatim | |
| ---: | --- | --- | --- |
| D1 | `sunny` / `school` | She mentioned it on the way in. "Lot of noise last week. I'm alright." | `draft` |
| D2 | `sunny` / `after-school` | She brought it up at supper. "Noisy week. I don't mind it much." | `draft` |
| D3 | `sunny` / `college` | She called about something else first. "Loud week. I'm fine, honestly." | `draft` |
| D4 | `sunny` / `independent` | She left a voice note that evening. "Loud week. I'm good, though." | `draft` |
| D5 | `fiery` / `school` | She was straight in at the door. "Everyone had something to say." | `draft` |
| D6 | `fiery` / `after-school` | She dropped her bag and started. "So much noise. All week. All of it." | `draft` |
| D7 | `fiery` / `college` | She rang and went straight in. "Everyone's talking. Let them talk." | `draft` |
| D8 | `fiery` / `independent` | She sent a voice note late on. "Loud week. Louder than it needed." | `draft` |
| D9 | `quiet` / `school` | She put her phone face down at dinner. "It was a lot last week." | `draft` |
| D10 | `quiet` / `after-school` | She left her phone in the hall all week. "Quieter in here." | `draft` |
| D11 | `quiet` / `college` | She said it near the end of a call. "I've stopped reading it." | `draft` |
| D12 | `quiet` / `independent` | She sent the week's plan, one line under it. "Not reading the rest." | `draft` |
| D13 | `deep` / `school` | She said it once, at the door. "Everyone looked. That was the week." | `draft` |
| D14 | `deep` / `after-school` | She said it from the stairs. "A lot of looking. Nothing else to it." | `draft` |
| D15 | `deep` / `college` | She rang between things. "They looked. I let them." | `draft` |
| D16 | `deep` / `independent` | Her message came without a question. "They looked all week." | `draft` |

**Where the spec's sentence lands.** who-she-is §3c asks for «a private girl after a famous win
speaks in guarded lines about the noise». That is the `quiet` and `deep` columns: `quiet` reaches
for an OBJECT (the phone face down, the phone left in the hall) rather than a feeling, which is her
displacement habit; `deep` gives the conclusion and stops («Everyone looked. That was the week.»).
`sunny` and `fiery` are the other half of the same claim – the open voices say it out loud rather
than guard it. ⚠ **And the cells are NOT the pressure scale wearing words.** The scale reads
EXPRESSED openness (×0.75 open / ×1.5 private) and these cells read BIRTH, so a girl born `sunny`
who is behind walls speaks in the `sunny` column while paying the private price. That divergence is
§0.6 working, and it is the one thing a reader is most likely to mistake for an inconsistency.

**⚠ The licence a landing task owes, and it is not drafted here.** A `MOMENTS` row – what the line
ASSERTS and when it may be spoken. The honest claim is «an exposure event landed in the closed
week», the same list T3's row is gated on, plus a register. The honesty pin sweeps the licence
space, so a moment shipped without one is not a copy question but a test failure – named so nobody
lands the cells alone.

### 5b. Tier 1 – small talk (`SMALL_TALK_LINE`, a new `'noise'` subject)

**8 cells**, voice × presence (`roof` / `away`), the pool's established `PresenceCell` shape. The
quoted span is shared across the two distances, exactly as every shipped cell does.

| # | cell | the string, verbatim | |
| ---: | --- | --- | --- |
| S1 | `sunny` / `roof` | She came and sat down with it. "There's a lot being written about me. I'd rather say it out loud than sit on it." | `draft` |
| S2 | `sunny` / `away` | She rang before the usual call. "There's a lot being written about me. I'd rather say it out loud than sit on it." | `draft` |
| S3 | `fiery` / `roof` | She was talking before her bag was down. "People have decided things about me. All of them have." | `draft` |
| S4 | `fiery` / `away` | She rang twice in one evening. "People have decided things about me. All of them have." | `draft` |
| S5 | `quiet` / `roof` | She dried the last plate and stayed put. "There's a lot being said. I'd like one room where it isn't." | `draft` |
| S6 | `quiet` / `away` | She added it under an ordinary message. "There's a lot being said. I'd like one room where it isn't." | `draft` |
| S7 | `deep` / `roof` | She waited for the room to empty. "They looked all week. I have nothing to add to it." | `draft` |
| S8 | `deep` / `away` | Her call came after the day was over. "They looked all week. I have nothing to add to it." | `draft` |

**⚠ S5's frame is deliberately in the owner's kitchen** – his eleven вычитка frames make the roof
column a kitchen (the plates done, the kettle filling, the shelf being stacked) and `quiet`'s
shipped worry cell is «She stayed in the kitchen after the plates were done.» S5 is written into
that room without copying the sentence. Named because a вычитка should know the neighbourhood was
chosen rather than stumbled into.

**⚠ And a defect T8's own lint caught in T8's own draft, recorded rather than quietly fixed.** S1
first read «She came and **found us** with it.» – `us` is first person outside the quotation, which
the narration law forbids. `L8_shape2` condemned it on the first run of the bench; the line was
rewritten, and the ARM now re-splices the original defect so the net that caught it stays proven
(§7).

---

## 6. The two ruled corrections – before and after

### 6.1 `PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL` – MOVED, ruling S

| | |
| --- | --- |
| **before** | No such year of work – there are four, and that is not one of them. |
| **after** | No such year of work – that is not one of them. |

`src/engine/world/psychologist.ts`. **The ruling is what licenses the edit, and it turns on two
facts.** Reachability: the throw fires only when `!PSY_FOCUSES.includes(focus)`, and the card offers
exactly `psychologistFocusOpen`, which filters that same roster – so **no action the interface
permits can produce it**, unlike `..._SEASON_` and `..._NOT_READY_`, which fire on legitimate player
acts. Invariant 4 protects the player's SCREEN from silent redesign and this sentence cannot reach
it. Kind: T1's stale `knownWeek: 139` row was a RECORD of a measurement, so it was annotated; this
is an ASSERTION about the present state, so it is corrected – and the task that made it false is
this wave. **The count comes OUT rather than being bumped to five**: a number there rots on every
roster change and has now done so once. A sixth focus can no longer falsify the line.

**The reader census, and it is why the gate cannot see this change.** All five reader sites go
through the CONSTANT, never the literal: `src/engine/world/psychologist.ts:519` (the throw),
`src/engine/world.ts:152/153` (the barrel's import and re-export),
`tests/wave5-psychologist-focus.test.ts:296` (a `.toThrow` against the imported constant) and
`:374` (the house-style corpus, built from the constant). ⚠ `e2e/` swept by hand and clean of the
literal – **`npm run check` does not run e2e**, and T5 found three hard-coded `4`s there that the
gate could not see. Nothing anywhere asserts the words. **So the edit reddens nothing, which is
CLAUDE.md's own corollary** («a wording change is the one kind of diff no test catches – the pins
assert what the string IS, so they move with it and stay green»), and it is the reason the вычитка
is the gate here rather than a test.

### 6.2 `EXPOSURE_ROW` – CHECKED, and it did NOT need to move

| | |
| --- | --- |
| **T3 shipped** | People were talking about her **this week**. |
| **T3b re-drafted, ruling P** | People were talking about her **last week**. |
| **T8's verdict** | **STANDS. The shipped text is true of a week that has finished.** |

The brief asked T8 to check that the row stops implying the current week. Measured at the call
site rather than read off a report:

* `src/engine/world/phaseHerWeek.ts:483` – `accrueSpirit(world, psychologistWorksThisWeek(world),
  exposureEventsOf(world, world.week - 1))`. The list the row is gated on describes **`world.week −
  1`**, the last CLOSED week.
* `src/engine/spirit.ts` – the row is stamped `week: world.week`, because a feed row is dated by
  the week the player reads it, exactly like the pressure it explains.
* So a row dated W names week W−1, and «last week» is the sentence that agrees with both. **No
  re-draft is owed**, and re-drafting it anyway would have been a diff with no claim behind it.

⚠ **One thing the check DID surface**, and it is §2a's second reason: the row's keep rule is keyed
on the row's own text, so the sentence and the album's «first exposure week of a season» are one
fact. That coupling is invisible until somebody proposes a second sentence.

---

## 7. The lints – every verdict, every ARM, and nothing fixed by the instrument

⚠⚠ **The point of this section is the ARMS.** Wave 5's вычитка found lint instruments that could
not sweep the strings they were pointed at – a banned list that contained a word which excluded the
very symbol under test. **So every lint below was run twice: once on the real corpus, and once on a
corpus with ONE deliberate violation spliced into a string the lint CLAIMS to cover.** A lint whose
arm stays green has not audited this material.

Bench: a scratchpad instrument (never committed – §8 forbids this task a new test beyond the lints
and the splice), read out of a log file the command itself appended. `LINT_EXIT=0`; **13 lints, 17
arm runs, 0 condemnations on the real corpus, 0 lints blind on their own claim.** ⚠ Exactly ONE arm
is deliberately left blind and reported rather than repaired – §7a, and it is a hole in a SHIPPED
pin rather than in this bench.

| lint | what it claims | scope | real corpus | the ARM, and what it catches |
| --- | --- | ---: | --- | --- |
| **L1 short dash** | no em-dash (U+2014), no `--`; the house dash is `–` | 46 | **CLEAN** | an em-dash spliced into T3's shipped `EXPOSURE_ROW` → **FIRES (E1)** |
| **L2 Cyrillic in copy** | no Cyrillic in any player-facing string | 46 | **CLEAN** | the fifth focus's label rewritten in Russian → **FIRES (F1)** |
| **L2b Cyrillic in templates** | no Cyrillic in any `<template>` the wave touched | 3 files | **CLEAN** | a Cyrillic paragraph spliced into `MatchViewer.vue`'s template region → **FIRES** |
| **L3 gender-free** | gender-free partner references, except the ruled «a mystery man» | 46 | **CLEAN** | a gendered partner noun in T6's TRUE leak row → **FIRES (L1)** |
| **L3 – SECOND ARM** | ⚠ the exception is **PHRASE**-scoped, never STRING-scoped | 46 | – | a second gendered noun («and her husband») added to **B3**, a string the licence covers → **FIRES (B3)**. This is the wave-5 failure mode, tested directly. |
| **L4 voices read BIRTH** | the expression that SELECTS a wave-6 string reads no expressed temperament | 5 sites | **CLEAN** | an expression read spliced into `EXPOSURE_ROW`'s own write site → **FIRES** |
| **L5 no money in a life line** | no figure, no `$`, no `amountCents` in any string | 46 | **CLEAN** | a figure («for 3 minutes») in T8's own `aired` draft → **FIRES (K4)** |
| **L5b no `amountCents` on a life ROW** | both `addEvent` calls this wave writes are `type: 'life'` and carry no `amountCents` | 2 sites | **CLEAN** | an `amountCents` field spliced into the exposure row's own `addEvent` → **FIRES** |
| **L6 the splice** | every focus line reads alone AND after «On retainer – » lowered | 5 lines | **CLEAN** | see §7a – **two arms, and one of them exposes a hole in the SHIPPED pin** |
| **L7 the scrap** | a tier-0 line is 80 characters, frame and quotation together | 16 | **CLEAN** | a tier-0 draft pushed past 80 → **FIRES (D13)** |
| **L8 shape rule 1** | at most ONE quoted span per voiced line | 24 | **CLEAN** | a second quoted span in a tier-0 draft → **FIRES (D1)** |
| **L8 shape rule 2** | the narration names her and is third person | 24 | **CLEAN** | the first-person `us` T8's own first draft of S1 carried → **FIRES (S1)** |
| **L10 banned tails** | the voice bible's fourteen linted narrator tails | 24 | **CLEAN** | «She announced it from the stairs.» in a tier-0 draft → **FIRES (D14)** |
| **L9 duplicates** | no two strings in the corpus are byte-identical | 46 | **CLEAN** | a draft made byte-identical to T3's shipped row → **FIRES (E1=K2)** |

**⚠ L4 has to be REGION-scoped, and saying why is half of what it is worth.** `accrueSpirit` and
`rollLeak` both read `expressedTemperamentOf` a few lines from the strings they write – that is
§0.6 working, the mechanics reading the CURRENT her – so a file-scoped sweep would condemn the wave
for obeying its own law, and a builder would then «fix» the wrong thing. What is asserted is
narrower and is the actual rule: the expression that CHOOSES the words reads no expression. The
five sites: `EXPOSURE_ROW`'s write block · `LEAK_EVENT`'s `addEvent` · `MET_HEADING_HEADLINE`'s
ternary · `boothLines` · the card's splice.

**⚠ And the result is stronger than the law requires: not one wave-6 shipped string is keyed on
temperament at all.** The leak rows key on `publicWrong`, the booth on kind × wrong, the headline
on «has he been told yet», the focus row on nothing. The BIRTH fence is live material only for
§5's drafts, which is where the lint's claim will start doing work.

### 7a. ⚠⚠ The splice pin cannot fail on the one opening that would break the card

The shipped pin is `tests/wave6-spotlight-focus.test.ts` §B, total over the roster, plus the
mounted splice case in `tests/component/psychologist-card.test.ts`. Re-implemented clause for
clause and armed twice:

| arm | the structural half (what the shipped pin asserts) | the prefix half (T8's addition) |
| --- | --- | --- |
| **A** – `publicLife` re-drafted to open on a QUOTE MARK | **FIRES** | **FIRES** |
| **B** – `publicLife` re-drafted to open on a PROPER NOUN («Fleet Street decides how the year goes.») | ***BLIND*** | **FIRES** |

Arm B splices to **«On retainer – fleet Street decides how the year goes.»** – a lower-cased proper
noun in the surface that is on screen all 52 weeks – and every structural clause passes it: it
opens on a capital, that capital is a letter, it ends on a full stop, the join doubles no space and
no dash, and the spliced form carries no stray capital *because the lowering is exactly what
removed it*. **The pin is clean and cannot catch the case it exists for.**

The one-line strengthening that closes it is already written down as a rule in the code: the
`PSY_FOCUS_LINE` note calls the «The year goes on …» opening «load-bearing and not a habit», so
`expect(line.startsWith('The year goes on '))` makes the pin measure the claim its own comment
makes. **T8 did not make that edit** – it is a guard change on another task's test, and §8 sends it
up as a question (§8.4) rather than taking it.

### 7b. The gates

Every verdict below was read out of a log file the command itself appended, with a start stamp in
the same file – **never through a pipe and never from a background notification**, which has now
lied six times in this wave.

| gate | verdict, quoted |
| --- | --- |
| `node scripts/doc-facts.mjs` | `doc facts: ok – schema v77, live wave round 41` · `DOC_FACTS_EXIT=0` |
| `npm run context:audit` | `result: ok` · `CONTEXT_AUDIT_EXIT=0`. Its size lines are the standing WARNINGS the script itself calls «warnings, never a failure». |
| `tests/wave5-psychologist-focus.test.ts` + `tests/wave6-spotlight-focus.test.ts` | `Test Files 2 passed (2) · Tests 58 passed (58)` · `PINS_EXIT=0` – the two files that read the moved refusal and the splice. |
| `tests/component/psychologist-card.test.ts` | `Test Files 1 passed (1) · Tests 15 passed (15)` · `COMP_EXIT=0` – the mounted splice, on the real card. |
| the T8 lint bench | `LINT_EXIT=0` – 13 lints, 17 arm runs, 0 condemnations, 0 lints blind on their own claim. |
| `npm run check` | see the wave handoff; the verdict is carried there with its log path and mtime. |

---

## 8. Questions for the architect – what T8 did NOT decide

⚠ **Nothing below was fixed, chosen or quietly shipped.** §8 of the brief: «a fix that seems to
need a third string move is a QUESTION for the architect, not an edit».

1. **⚠⚠ The fifth focus ships without its receipt, and no task in the wave owns one.** R1 («The
   cameras stopped costing her sleep.») is the spec §2's own sentence, transcribed and ready. What
   does not exist is a constant, a trigger or a call site – and T9–T12 are benches, e2e and the
   owner's two microfixes, so nothing downstream will land it either. **The tally, exactly, because
   it decides how urgent this is**: two of the four existing focuses carry a receipt CONSTANT
   (`COOLHEAD_RECEIPT`, `RECOVERY_RECEIPT`); one carries a receipt CHANNEL instead (`listen`,
   through wave 5's 40 legible cells); one carries nothing (`herself` – its spec sentence was
   deliberately not transcribed, wave 5's §9.2, because it reports her sessions against the 09.09
   re-cut). `publicLife` would be the second carrying nothing – and unlike `herself` there is no
   objection to its sentence, only no writer for it. **A trigger proposal, so the
   question is answerable rather than open**: the sentence asserts a BEFORE (they cost her sleep)
   and an AFTER (they stopped), so – on `RECOVERY_RECEIPT`'s own 13.09 precedent, where the sentence
   stood and the TRIGGER moved – it should print on the first exposure week where the focus is
   working AND `spotlightHabituation > 0` AND `habituationScale` has crossed a named point. Both
   facts are already persisted; no new field. **It is still a mechanic, so it is his to open.**
2. **One exposure row or five** – §2a. T8's verdict is ONE, with the mixed-week problem and the
   measured keep-rule coupling as the reasons; the five plain-word rows are drafted so the option
   can be read rather than imagined. A per-kind set needs either a ledger row per event (§3c
   forbids) or a dominant-kind priority rule (a mechanic).
3. **The diary tier-0/1 exposure lines have no mechanic and no licence.** §5's 24 cells are
   written; `SpokenMoment` has no `'exposure'` member and `SMALL_TALK_SUBJECTS` no `'noise'` one.
   A landing task also owes the `MOMENTS` licence row, without which the honesty pin fails. The
   brief asked T8 for the lines and §8 forbids it the mechanic, so the two halves are in different
   hands by construction – flagged so the second half is commissioned rather than discovered.
4. **The splice pin cannot fail on a proper-noun opening** – §7a, with the arm that proves it and
   the one-line fix. A guard re-aim on another task's test is not T8's to take.
5. **The exposure row's glyph** – carried, not re-opened. T3 and T6 both found that an unstamped
   `type: 'life'` row resolves through `lifeRowGlyph(undefined)` to `LIFE_ROW_EMOJI.life`, the
   owner's own 11.09 pick for life rows. who-she-is §5a forbids an agent picking a glyph unasked,
   so none was picked. **It travels with the strings because that is where he will be reading**:
   whether the spotlight deserves a mark of its own is his.
6. **`publicLife`'s composed card line is 103 characters**, 12 more than the longest sibling, on
   the surface visible every week of the year – §1. Measured and stated; shortening it is a wording
   change the вычитка owns.
7. **B4 and B7 close on the same clause** – §4. Wave 5 ruled the same family «variation»; reported
   so the ruling is made again rather than assumed.

## 9. What the brief and the record did not account for

1. **⚠ The brief's «two shipped strings moved» is one under T8's own diff.** The refusal moved
   here; the exposure row was checked against its call site and found already true (§6.2), because
   T3b had moved it one task earlier under ruling P. Both movers have a written ruling behind them,
   which is what the brief was actually asking for – but the second is not T8's edit, and a report
   that claimed it would be claiming a diff it did not make.
2. **⚠⚠ A lint that measures a raw template measures the wrong string.** The money lint condemned
   all eight booth beats on its first run – for the `$` in `${who}`. The bible's own scrap rule
   («measured on the RENDERED sentence») is the general form of this, and it is worth stating
   because the failure is silent in the other direction too: a lint asked of the raw form would
   have missed a figure a template interpolated in. Every booth cell is rendered before it is
   measured.
3. **T8's own first draft carried a real defect and its own lint caught it** – S1's first-person
   `us` (§5b). Recorded rather than tidied away, and the arm preserved, because a net that has
   caught something once is worth more than a net that has never been tested.
4. **The wave adds no player-facing word to any `<template>`.** Measured on the diff `c3c63ddd..HEAD`:
   `MatchViewer.vue` and `TournamentFlow.vue` gain a prop, a comment block and a binding, and no
   text. So the whole corpus is engine and viz copy, and `SupportStaffTab.vue`'s only contribution
   is the composition F3, which adds no literal.
5. **The four other focus labels and lines were not touched**, and the corpus check that reads them
   (`tests/wave5-psychologist-focus.test.ts`'s house-style case) derives its count from
   `PSY_FOCUSES` rather than a literal – so it followed the roster to five on its own, which is why
   T5's re-aim was a strengthening rather than a bump.
