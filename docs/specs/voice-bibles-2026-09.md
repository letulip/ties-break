---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-11
---

# Voice bible and tier-zero copy

This document has two jobs:

1. define the durable writing rules for her four temperaments – the bible every later copy
   pass (B5, C1–C5, tiers 1–2) writes against;
2. specify the four-stage expansion of tier-zero week notes that `voice/wave-b` carries.

Restructured 11.09 to the third editorial review's layout: one current truth, permanent rules
with explicit strength, no superseded copy reproduced here (git and `decisions.md` hold it).
Rule strength vocabulary: **MUST** – a factual, licensing or interface invariant, usually
pinned by a test; **SHOULD** – a voice default, bendable for an earned effect; **MAY** –
permitted variation; **DRAFT** – player-facing wording awaiting the owner's read.

⚠ CLAUDE.md invariant 4 binds every player-facing word here and in the pool: agents draft,
the owner rules. Nothing on `voice/wave-b` merges before his вычитка of the full table.

## Current truth

* **`main` ships wave 1**: 44 voiced tier-0 lines + 8 flat = 52, one dictionary across all
  ages – the limitation the two editorial reviews named.
* **`voice/wave-b` (this branch) carries the four-stage corpus**: 148 voiced lines + 8 flat
  = 156, wired and pin-green, **editorial drafts until the owner's вычитка**. The copy's
  single source is `VOICE_LINES` / `EXAM_LINES` / `BIRTHDAY_LINES` / `OFF_SEASON_LINES` in
  `src/engine/diary/weekNotes.ts`; this document holds rules, never a duplicate of the pool.
* The design authority is [who-she-is-2026-09](who-she-is-2026-09.md) – §1 temperaments, §4
  numbers, §5b composition and tiers. Where this document conflicts with executable code,
  code and tests describe current behaviour; the corpus section below describes the branch.

## Permanent voice rules

**The composition rule (MUST, §5b).** Three owners for three parts of a line, so pools
compose instead of multiplying: TEMPERAMENT owns the shape (what she notices, omits, how she
structures a thought), SPIRIT owns the register of the moment (`bright` / `level` / `low`),
BOND owns the channel (her own voice at `close`/`steady`, the flat pool at `strained`,
silence at `cold`).

**The craft law (MUST).** Temperament shows in content and structure, never in a narrator's
adverb. The narration outside her quotation carries facts and objects the parent saw – a kit
bag where she dropped it, the desk light late – never an interpretation of her delivery, and
never an explanation of its own signal (short words ARE the tiredness; a frame that says so
has failed). A low week DISTURBS her normal voice rather than swapping in a stock sad one.
Closeness shortens lines – warmth is brevity with shared referents, not added sweetness. The
childhood prologue is the corpus's tonal benchmark.

**The honesty law, in two tiers (MUST; reworded 11.09, doc-review finding 5).**

* **Consequential facts must be licensed by a claim**: results and skill quality, counts,
  durations and dates, money, places and destinations, plans, other people and relationships,
  her body's specifics. The sim does not know how many racquets she owns, how her serve was,
  how many papers she sat, when rehab starts, or what the holiday package looks like – so
  «six racquets drying», «even the serve», «two down», «starting tomorrow», «nothing booked»
  on a package week are all failures of licence, not of taste.
* **Non-consequential scene texture MAY ride the delivery frame it belongs to**: the cup on
  the table, the hour a message arrived, the doorway she said it from, the engine turned off.
  Texture asserts no consequential fact and no presence beyond the line's own licence; the
  moment it does (a named place, a counted object, a dated plan), it moves up a tier and
  needs the claim. Without this tier the law would be enforced by whichever detail a reviewer
  happened to notice.

**The presence law (MUST; 11.09, doc-review finding 3).** `lifeStage` owns diction and
scale; it never proves the parent observed the week. At the two roof stages cohabitation
licenses household observation (`domestic`, re-derived by the honesty pin). At `college` and
`independent` the stage only restricts the available frames: every away line carries its own
delivery frame – a call, a text, a forwarded plan, a named visit – because distance makes
observation something the line has to earn, not assume.

**The narration law (MUST, pinned).** She may speak first-person inside her own quotation
marks, and may address the parent there (owner ruling 09.09). Outside the quotation the
narration is third person about her, no `I` / `you` / `your` / `me` / `mine` / `we`, and:
at most ONE quoted span per line; the narration around a quotation names `she`. Both shape
rules and the strip they make safe live in `tests/week-notes.test.ts` (see «SHAPE RULE 1»,
«SHAPE RULE 2», «is written ABOUT her, in the third person»).

**The banned narrator tails (MUST, linted).** «at speed» · «at volume» · «which is the
tell» · «which is how she says it» · «nothing further» · «nothing more» · «in those words» ·
«three times over» · «more than once» · «that was the whole answer» · «did the whole week's
work» · «no second sentence» · «she announced» · «left it there». Adding to the list
tightens the ratchet (`THE TAIL-LINT` in `tests/week-notes.test.ts`); removing is the
owner's call.

**The fallible parent (MUST; finding 6 of the second editorial review).** Fallible in
interpretation and timing, never in fact – and the miss may not know its own answer. The
arc: the parent ACTS → NOTICES an uncertainty or a consequence → it stays UNRESOLVED. The
narrator never states her interior as fact («She heard the want» is omniscience wearing
doubt), and a miss may not assert a world-fact the sim can contradict (the wrong-gift
birthday line versus `birthdayWanted`).

**The channel palette (SHOULD; renamed 11.09, doc-review finding 4).** Away copy draws from
a varied palette: a call · a text · a voice note · a photograph with one line · a forwarded
schedule · a family-chat message · a delayed reply · a visit · sometimes nothing at all.
The corpus avoids «wrote» entirely, never repeats a channel on adjacent rows of a column,
and keeps college ≠ independent on every shared row – **corpus diversity, not a runtime
guarantee**: moments are selected by the week, so two consecutive weeks can still share a
channel. B5 owns the real per-week rotor (and silence cadence) when it lands.

**Contractions (SHOULD).** `sunny` and `fiery` contract throughout; `quiet` mostly; `deep`
lightly – some of deep's formality is the character, kept where it does work.

**The scrap (MUST, pinned).** 80 characters, frame and quotation together, measured on the
RENDERED sentence («fits on a scrap: 80 characters» in `tests/week-notes.test.ts`). Birthday
templates are measured at the pin's worst case – `birthdayAge: null` renders «A year older»,
twelve characters. No em-dash anywhere player-facing; the short dash `–` only.

## The four voices

The axis law (who-she-is §1): INTENSITY owns how hard things land and how long they hold;
OPENNESS owns her flow with people. Crossed:

| | steady | intense |
| --- | --- | --- |
| **open** | `sunny` | `fiery` |
| **private** | `quiet` | `deep` |

Profiles are tiered (11.09, doc-review findings 6–10): a **core habit** is her default, an
**often/rarely** bends for an earned moment, and **never** is reserved for licensing and
interface law – over a twenty-year career an absolute becomes a caricature. The tiered
wording is DRAFT for the owner; his wave-1 shorthand stands as the anchor of each.

### `sunny` – open + steady («умеренно»)

Core: volunteers context without being prompted, connects what happened to what she wants
next, and is comfortable naming an ordinary feeling in the week it happened. Often: the
practical detail, the small joke at her own expense, family-«we» inside her quotes. Rarely:
withholds – and when she omits an obvious subject the omission is an event, though not proof
of any one cause. Never (licensing): stacked superlatives sold as fact, catastrophe words as
claims. Rhythm: complete thoughts, six to twelve words, two sentences her natural size.

### `fiery` – open + intense («много»)

Core: reaches the verdict before the explanation; language heats quickly and may reverse
once the moment passes – both verdicts stand, written across weeks, never inside one
unlicensed line. Often: absolutes, repetition for emphasis, exclamation spent freely, the
question mark as an exclamation. Rarely: hedges (a hedge is an earned surprise in this
voice, not a habit). **Stakes still affect scale**: small frustrations run sharp and loud;
the biggest weeks can leave her unusually flat – the fire gone flat IS the low register, and
the tired row of the corpus is written to it. Rhythm: bursts – three words, three words,
then one long spill.

### `quiet` – private + steady («одни на всю жизнь»)

Core: talks through arrangements, objects and completed actions – the schedule instead of
herself – and her adjectives sit one rung below the truth in both directions. Often: the
practical question asked outright (privacy is not passivity); displacement (the taped knock,
the pinned plan, the returned books). Rarely: direct feeling language at tier 0 – when it
appears it marks a genuine break in her normal protection, not a new routine; tier-2 beats
may earn it, ruled there. Never (licensing): a stated feeling propped by a narrator tail.
Rhythm: four to nine words, level tempo, the second sentence changes the subject.

### `deep` – private + intense («мало»)

Core: waits until she knows which part matters, then gives the conclusion rather than the
chronology – late, exact, stripped of its size. Often: full stops where commas belong, the
cost or consequence named plainly, the one question that is the whole line. Rarely: her
humour – dry and exact when it comes; her warmth arrives as trust in shared context, not as
added words. She is not sullen and not a closing door (that is the flat pool, a different
sound); the words are simply expensive. Never (licensing): chatter sold as her voice, a
duration or count her claims do not carry. Rhythm: two to six words; sometimes one.

## The flat pool – `strained` and `cold`

At `strained` the four voices collapse into one shared pool of eight lines. **The pool
obscures her voice; it does not erase her personality** (11.09, doc-review finding 11): the
lines are ones plausible for ALL FOUR temperaments – fine, okay, same, on schedule – so the
player cannot reliably tell which girl this is from the reply, though the girl has not
ceased to be herself. She answers and never offers; she is never rude, because hostility
would be a scene and a scene is a relationship. Rows selectable on a layoff claim it («a
layoff takes the note»). At `cold` tier 0 is ABSENT – the parent's own line stands alone
under the painting. Three rungs: her voice, the shared pool, silence.

## The five Mood words

`Glowing → Bright → Steady → Dimmed → Heavy` – the spirit ladder, a word never a bar
(who-she-is §5). Pinned as the approved five («the five Mood words are the approved five» in
`tests/week-notes.test.ts`); invariant 4 – the owner's words, renamed by nobody. «Steady» is
the deliberate overlap with condition's neutral word (his §7 ruling); «Heavy» is anchored to
the knee (`ECONOMY.spirit.knee`, the match-factor threshold in `src/engine/spirit.ts`).

⚙ OPEN (11.09, the doc review): «Dimmed» is the ladder's weakest word – the only passive
participle, and readable as something done to her. Candidates if he wants a swap: «Off»
(most conversational) · «Low» (clearest, overlaps existing UI vocabulary) · «Flat» (tennis
double meaning, collides a little with the flat pool). His call; no change proposed by
default.

## The four-stage corpus (`voice/wave-b`)

The owner's «4 полосы» ruling (11.09), replacing the two `home`/`away` rails: **four maturity
dictionaries, one per `DiaryLifeStage`**, each licensed on exactly its stage
(`STAGE_LICENSE`, and the honesty pin re-derives the `rail` claim off `f.lifeStage`).

| stage | reads as | vocabulary, subjects, scale | how a line reaches the parent |
| --- | --- | --- | --- |
| `school` | 11–17, at home | today and this week; the court, the bus, dinner, the papers, the kitchen table. Short, concrete, no career words, no money | co-present: overheard, watched, found (`domestic` licensed) |
| `after-school` | 17–19, still home, tour beginning | the SEASON replaces the timetable – weeks, blocks, draws; wider words, money exists. MUST NOT stage a homecoming: every note claims `notTravellingWeek`, and an arrival scene belongs to the travel note | co-present, same roof – but framed inside the week at home |
| `college` | 18–22, away, a student | campus, the term, the quad, the library; a student's world laid over the tennis one. She reports | a delivery frame, every line: the call home, the term-time text |
| `independent` | 22+, her own household and trade | her block, her own schedule, the bill, the draw; the parent's furniture has left the dictionary | a delivery frame or a named visit; a peer keeping in touch |

The stages are maturity, never personality – a `quiet` thirty-year-old is quiet in an
adult's vocabulary over an adult's channel, and one girl must read as one person growing up
down her column.

**The moment × stage matrix, with its reachability stated** (doc-review finding 2 – what is
engine fact and what is content decision):

* **all four stages** – grind · light · freshBody · vacation · restingKnock · pushingKnock ·
  injured · tired. Reachable at every stage today.
* **exams: `school` ONLY – the engine's fact, not a preference.** `isExamWeek(week,
  schoolOver)` is false the day school ends (`src/engine/season/calendar.ts`; the test
  sweeps refuse the combination as unproducible). The 11.09 first draft said «×3 stages» and
  was corrected against this; college exams, if ever wanted, are a new mechanic before they
  are new copy.
* **birthday: `school` + `after-school` – content scope.** Birthdays happen all career; the
  away stages keep the parent's own birthday lines, and her voiced away birthday belongs to
  C1 (the birthday-voice wave), not v1.
* **offSeason: `college` + `independent` – content scope.** `offSeasonWeek` is
  calendar-derived at every stage; the roof stages keep the parent's own December lines (the
  bag in the cupboard, the louder house).

**Arithmetic**: 8 × 4 + 1 + 2 + 2 = **37 per voice**, × 4 = **148 voiced** + 8 flat =
**156**. The rectangle is total by type (`Record<Temperament, Record<StagedMoment,
Record<DiaryLifeStage, …>>>` – a missing cell is a compile error); the scoped moments are
explicit maps so their smaller shape is visible. Counts and the 10/9/9/9 per-stage split are
pinned («the hundred and fifty-six lines are all there» in `tests/week-notes.test.ts`).

**Kept byte-identical through the re-cut** (the reviews' own keepers): quiet
injured/school (the pen on the calendar) · quiet tired/school (the kettle) · deep
freshBody/school («Ready») · deep offSeason/independent (January) · deep exams and deep
tired school (the shipped lines) · deep birthday/school («No fuss») · fiery tired/school
(the kit bag, «Empty») · sunny injured/school (the rehab sheet).

**The gate**: the full before→after table goes to the owner in two halves (the roof stages,
then the away stages). Nothing merges before his read.

## History

Decision history – wave rulings, both editorial reviews, the 11.09 doc review's verdicts,
the emblem candidate («love means nothing») – lives in [decisions.md](../decisions.md)
(entries 27.08 → 11.09) and in git. Superseded drafts (the wave-1 52-line table, the 10.09
two-rail model) are deliberately not reproduced here.
