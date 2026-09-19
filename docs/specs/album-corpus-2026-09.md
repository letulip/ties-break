---
type: spec
status: draft
area: narrative-and-copy
canonical: false
last-reviewed: 2026-09-19
---

# The album corpus – the parent's handwriting, in four daughters' voices

**The album spec's §8 step 2**, and it is the half of the album that is words: the pasted notes, the
polaroid captions and the loose handwritten lines on the sheets. `docs/specs/the-album-2026-09.md`
is the authority for everything else – chapters, sheets, layouts, frames, tickets, selection. This
document is the authority for the strings, and it is the ONLY place any of them is authored.

⚠⚠ **EVERY STRING BELOW IS A DRAFT FOR THE OWNER.** Player-facing wording is his (invariant 4).
Nothing here reaches a screen until he has read it. The three strings marked **HIS** are carried
character for character off his own mockups and are not edited by anybody.

⭐ **It is built in the small-talk corpus's shape**, deliberately: the document is the source of
truth, `tools/album-corpus-emit.ts` projects it into `src/engine/world/albumCorpus.ts`, and
`tests/album-corpus-roundtrip.test.ts` re-parses the document on every run and compares the
committed catalogue to it string for string. A hand-edit of the generated module goes red. A
document edit that was never re-emitted goes red. That second arm is the one this file is for:
see `docs/specs/small-talk-corpus-2026-09.md` and `tests/round44-corpus-roundtrip.test.ts` for the
round that proved the shape works.

---

## 1. Three registers, and they are three different things a parent does on a page

His confirmation, 19.09, on the mockups' own two strings: «всё верно». The album is written by the
PARENT. What changes between the three registers is who he is writing to.

| register | who it addresses | its place on the sheet | its size |
| --- | --- | --- | --- |
| **note** | **her** – second person, «you» | the pasted, lined, torn-edged note | one or two sentences |
| **caption** | **about her** – third person, «she» | the polaroid's bottom lip | a handful of words |
| **line** | **nobody** – the parent thinking | loose in the margin, unruled | shortest of the three |

His examples, all three from the mockups and all three carried into `A1` unedited:

- note – `First day on court. You were so excited.`
- caption – `She asked if she could try.`
- line – `Some journeys start with a simple "Can I?"`

**The registers do not paraphrase each other.** A sheet can show all three at once, so three
restatements of one thought would read as a stutter. The note carries the event and what she did;
the caption carries the one thing the photograph shows; the line carries what the parent is left
with. Where they touch, they touch on purpose.

⚠ **No quotation marks around the handwriting.** These are written, not spoken – the opposite of
the small-talk corpus, where every payload is a quotation. A quotation mark appears only where
somebody is being quoted inside the writing, which happens once in the whole corpus (`A1`'s line,
and it is his).

**Two of these rules are mechanical, so the pin asserts them rather than a reviewer noticing:**

1. ⭐⭐ **Every note addresses her and no caption or loose line does.** That is the register
   boundary in one sentence, and it is the only one a machine can check: 136 notes carry «you» or
   «your», and the other 264 strings carry neither. It caught a real slip in the first draft –
   `A7`'s `fiery` line read «They ask when you lose», an impersonal «you» that on a margin scrap
   reads as the parent talking to her.
2. **A caption is short, and shorter than its own note** – at most 60 characters, and it is the
   photograph's lip. ⚠ **A «the line is the shortest» rule is NOT pinned, deliberately**: his own
   `A1` line is one character longer than his own `A1` note, so the rule is true of the corpus in
   spirit and false of the two strings that matter most. A pin that reddens on his copy is a pin
   that gets his copy edited (invariant 4), which is exactly backwards.

## 2. The four voices, and why the album is the first surface that has them

⭐⭐ **The fog law is LIFTED here** – spec §2.8, his ruling 19.09. Until this screen, temperament
reached the facts and no surface (`tests/spirit.test.ts` pins that). The album is the exception,
and his reasoning is the payoff: at the end there is nothing left to hide, and twenty years of
learning to recognise a daughter by her voice get paid.

**So the voice is hers and the hand is his.** The parent is one man in all four columns – same
affection, same dryness, same fallibility. What differs is the daughter he is describing, and
therefore what there was to notice. The four are the engine's own 2×2 (`kidLife.ts`,
`docs/specs/voice-bibles-2026-09.md` §«The four voices»): open/private × steady/intense.

| voice | she is | so the parent's page records… |
| --- | --- | --- |
| `sunny` | open + steady | **what she said, in the week she said it** – she volunteered it, so the note is full of her words and often of the wrong detail first (the airport ceiling, the food, the crowd) |
| `fiery` | open + intense | **the verdict, and his amusement at it** – she arrived with the judgement already made, so the page carries the complaint, the demand, the reversal a week later |
| `deep` | private + intense | **the delay and then the precision** – she said nothing for a day and then one exact sentence, so the page records the wait as much as the sentence |
| `quiet` | private + steady | **what she did instead of saying it** – the schedule, the calendar, the packed bag, the single photograph; the parent reads the act, not a statement |

⚠ **The test is the small-talk corpus's, and it is not «no shared phrases»**: same occasion, same
facts, four different things noticed. Where a phrase repeats down a column – `quiet`'s pencil in
`A11` and her pen in `A15`, her flight times in `A5`, `A14` and `A29` – it repeats because it is
the same girl doing the same thing years apart, which is the point of an album. ⚠ **No two of the
400 are the same STRING**, which is a different claim and the one the pin makes: a first draft had
`A4` and `A11` sharing a `deep` caption verbatim, and two identical sheets in one book read as a
copy-paste rather than as a habit.

⚠ **The parent is fallible in interpretation, never in fact** (voice bible, «the fallible
parent»). He guesses at her, guesses wrong, and says so – `A30`'s «we were among them», `A8`'s «I
think you knew», `A32`'s «you will find the one week I have got wrong». He never states her
interior as fact and never asserts a world-fact the sim can contradict.

### ⚠⚠ The measured risk in this corpus, stated rather than left to be noticed

**A note tends to open on a label and then say what he saw** – «First day on court. You were so
excited.» That shape is HIS, from the one worked example the mockups gave, and on a page of
handwriting it is right: the parent writes what the sheet is about, then what happened. **But four
notes that all open on the SAME label is a formula, and a formula is what generated copy reads
like.**

So it was measured on the first draft rather than argued about: **25 of the 32 occasions had all
four notes sharing an opening clause**, the worst of them 52 characters long (`A23`, where the
label swallowed most of the sentence). Nineteen notes across the ten worst rows were rewritten to
move the label, drop it or put it at the end. **The corpus now stands at 15 of 32, longest shared
clause 26 characters** – the length of his own, and at that size it reads as the album's habit
rather than as a template.

⚠ **This is the number to look at first in a review.** It is the one property of the corpus that
degrades quietly as rows are added, it is not pinned (a threshold here would be a guess dressed as
a rule), and it is re-derivable from this document in one pass whenever somebody wants to know.

## 3. ⚠⚠ What the handwriting may not contain

**3.1 No number the world owns.** The corpus cannot know how old she was, how many titles she has,
how long a season ran or what a cheque was worth. So no line writes one. `A17` says «you kept
saying the number» and never the number; `A12`'s line says «two bad weeks» and not «two weeks out
of fifty», because the fifty is the calendar's. The one exception is a count the GATE licenses,
and no occasion in this corpus needs one.

⭐ **The date and her age are the SHEET's, not the corpus's.** His ruling – «Даты с неделями можно
писать вполне и возраст тоже можно использовать» – is a ruling about the album, and the mockup
renders them as their own line above the handwriting («May 12, 2032 / Age 5»). They are drawn from
the frame's week and her birth year, where they are true. A corpus string that said «at five»
would be a lie on every career whose first pick came at a different age.

**3.2 No name, ever.** Her name is the player's. The note says «you», the caption says «she», and
neither ever needs a name. There is no placeholder, no token, no interpolation in any string here –
the catalogue is 400 finished sentences, not 400 templates. A pin asserts it.

**3.3 No claim a career can contradict.** The honesty law's consequential tier (voice bible):
results, counts, durations, dates, money, places, other people, her body's specifics all need a
licence. So: no body part is ever named (`A7` says «you said everything was fine», never which
joint); no coach, rival or partner is named or characterised; no tournament, city or country is
named – the road occasions say «abroad» and «the country», because the calendar's names are
fictional and generated per career.

**3.4 Non-consequential texture is allowed and is most of the warmth.** The kitchen table, the
garden, the hall, the hat, the boot of the car, the calendar. Same tier as the small-talk corpus's
kettle: it asserts nothing the engine has to honour. The moment a detail becomes a place, a count
or a date, it moves up a tier and needs a licence it has not got.

**3.5 House rules.** Short dash `–`, never the long one. No Cyrillic in any string (the owner's
own quoted rulings in this document's prose are Russian and stay). No `|` and no backtick inside a
payload – both would break the table this document is read out of.

## 4. ⭐ Coverage: which occasions, how deep, and why that split

The spec's §4b measured his own nine careers, and the measurement decides this document's shape
rather than decorating it:

- **`season-rank`, `title` and `final` are 89% of a dense career's pool** (21 + 13 + 13 of 53). One
  occasion each would mean every season sheet in a twenty-one-season album says the same sentence.
  **So those three carry ten occasions between them** – the deep half of this corpus.
- **The `jun` band is empty on every career measured, 0 of 9.** No occasion carries it. Chapter 1
  is the prologue, per spec §3.
- **`lateCareer` exists for almost nobody** – 5 milestones on one career of nine, 1 on another, 0 on
  the rest. It is a band on the occasions that can reach it and never an occasion of its own.
- **Everything else occurs once per career at most** – a first house, a brand, the academy's three
  stages, break-even, school, a wedding, the closing frames. **One occasion each**, written once and
  well, because a second variant would never be reached.
- **The super-rare three are his addition** (§5) and are written once each knowing they will fire
  rarely. `bestFinishByTier.slam` was 2 on his densest career, so `A28` may never be seen at all;
  that is the correct amount of writing for it.

| family | occasions | why that many |
| --- | ---: | --- |
| prologue (chapter 1) | 4 | his ruling (а): first court, first tournament, first win, first cup |
| `title` | 4 | 13 per dense career; the spec's own «the fourteenth only if it is about something» |
| `final` | 2 | 13 per dense career, and a final is either her first or one she lost |
| `season-rank` | 4 | 21 per dense career – the largest single kind in the pool |
| `injury` | 2 | mass material; the second is the getting up, which is what §7 rules the mood on |
| money and the road | 3 | `prize`, `international`, `break-even` – one apiece, once per career |
| life | 2 | `school`, `wedding` |
| assets | 5 | first house, brand, academy land / courts / building |
| super-rare | 3 | his 19.09 addition; each fires seldom by design |
| closing | 3 | `graduated`, `farewell`, `retired` – the spec's three written frames |
| **total** | **32** | **× 4 voices × 3 registers = 384 strings** |

⚠ **What is deliberately NOT written, and why.** Academy STAFF (37% coverage, spec §5) has no
occasion: it lands in the same year as the building on almost every career that reaches it, and
the selection rule caps one kind at a third of a chapter's sheets, so it would be written to be
skipped. The same reasoning excludes a second `wedding` occasion for a second marriage (`kind`
carries the `LoveEpisode.id`, so the engine can reach `A21` twice; the handwriting does not need
to know which time it is) and a `break-even` variant for the second crossing.

⚠ **`A8` (`title-last`) is only reachable on a finished career.** Mid-career the album cannot know
which title was the last, so the occasion never fires while she is playing. That is stated here
rather than discovered by whoever builds the selector.

## 5. ⭐ The arc – one entry, a matrix, and nothing at all for the eight

Spec §4b's finding: the psychologist was hired in **1 career of 9**, and that is exactly the career
where `wallsLean` moved. On the other eight it is `{open: 0, reg: 0}`. So the arc is real and
**earned**, and the spec's own correction stands: the closing sheet takes a different line when the
lean never moved – it does not write «she stayed herself» to eight careers out of nine.

**Therefore this document writes nothing for the never-drifted case.** That is not an omission; it
is the ruling. The closing sheet's ordinary line is `A32`.

The arc is keyed on **`temperament` × direction**, not on an occasion, because its whole sentence is
«she was born this and became that» – two points, and the first is the temperament. Eight cells:

- **`open`** – the lean moved towards open. She came further out than she was born.
- **`reserved`** – the lean moved the other way. She drew in.

⚠ **The sign is the engine's.** `wallsLean`'s own convention decides which direction a given move
is; this document writes both and names neither number.

⚠ **Two registers, not three, and the reason is the register's own size.** The arc's sentence needs
both points in it – what she was and what she became – and a caption is a handful of words on the
lip of a photograph. It cannot hold two points without becoming a note in the wrong place. So the
arc carries a **note** and a **line**, the closing sheet's polaroid keeps `A31`/`A32`'s caption, and
the completeness pin knows the arc has its own shape rather than a hole.

## 6. The format a machine reads

The parser (`tools/album-corpus-parse.ts`) throws on any shape it does not recognise, for the
reason round 44 gives: a parser that silently skips a row turns a document defect into a missing
occasion nobody notices. An occasion is:

    ### A<n> · `<id>` · <kind> · <band, band, …> · <`any` | **gate: `<name>`**>
    **The occasion:** one sentence of what happened.
    **Where it comes from:** the field or ledger the engine reads.
    (any number of ⚠ / ⭐ notes)

    | voice | note |
    | --- | --- |
    | `sunny` | `…` |
    | `fiery` | `…` |
    | `deep`  | `…` |
    | `quiet` | `…` |

    …then the same table for `caption`, then for `line`.

**The four voices are in the small-talk corpus's own order** – `sunny`, `fiery`, `deep`, `quiet` –
so the two documents read down the page the same way. `TEMPERAMENTS` in `src/engine/spirit.ts`
happens to list them `sunny, fiery, quiet, deep`; the emitted catalogue is a `Record`, which has no
order, so the two never disagree about anything but reading.

**`kind`** is the family the engine selects from: `prologue`, the nine `MilestoneType`s, `asset`,
`rare`, `closing`. **`bands`** are the album's chapters – `prologue`, `young`, `teen`, `adult`,
`lateCareer`; `jun` appears nowhere, per §4. **`gate`** is the named condition beyond the kind,
resolved engine-side; `any` means the kind alone is the occasion.

## 7. The arithmetic, derived and not typed

⚠ Every number here is re-derived from this file by `tools/album-corpus-parse.ts` on every read and
asserted by the round-trip test before it compares a single string – the small-talk corpus's §3a
rule («any number in a document that can be derived FROM that document is derived by script before
the commit»), and the anti-vacuity half, because a comparison of two empty lists passes.

| written | count |
| --- | ---: |
| occasions | **32** |
| notes (32 × 4 voices) | **128** |
| captions (32 × 4 voices) | **128** |
| lines (32 × 4 voices) | **128** |
| arc cells (2 directions × 4 voices) | **8** |
| arc strings (8 × note + line) | **16** |
| ⭐ authored strings in total | **400** |

**Completeness**: every one of the 32 occasions carries all four voices in all three registers.
There is no partial row and no «voice to be written later» – the parser refuses a short table, and
the pin asserts 128/128/128 rather than «some of each». The arc's two-register shape is the only
declared exception in the document and §5 gives its reason.

---

# THE OCCASIONS

## Chapter 1 – the prologue

⭐ **RULED 19.09, path (а):** «хорошо бы, чтобы в финальный альбом что-то оттуда попадало тоже
вообще. Первый раз на корте, первый турнир и/или победа, может еще что-то». These four are that
list. Their source is the prologue trace persisted at handover (spec §3); a career created by the
wizard has none, and its album honestly begins at chapter 2.

### A1 · `first-court` · prologue · prologue · **gate: `first-pick-on-court`**
**The occasion:** the first time she stood on a court.
**Where it comes from:** the prologue trace's early picks.
⭐⭐ **`sunny`'s note, caption and line are HIS** – all three mockup strings, carried character for
character. They are the anchor the rest of this corpus was written against, and nobody edits them.
⚠ The sheet renders the date and her age above the note (§3.1). No line here writes either.

| voice | note |
| --- | --- |
| `sunny` | `First day on court. You were so excited.` |
| `fiery` | `First day on court. You wanted to know why the net was in the way.` |
| `deep` | `You stood at the fence a long time before you went in. Then you didn't want to come off.` |
| `quiet` | `First day on court. You didn't say anything about it until we were in the car.` |

| voice | caption |
| --- | --- |
| `sunny` | `She asked if she could try.` |
| `fiery` | `She asked whose court it was.` |
| `deep` | `She watched the whole hour first.` |
| `quiet` | `She carried the racquet all the way home.` |

| voice | line |
| --- | --- |
| `sunny` | `Some journeys start with a simple "Can I?"` |
| `fiery` | `She argued with a net.` |
| `deep` | `She watched first. She still does.` |
| `quiet` | `She took it home with her.` |

### A2 · `first-tournament` · prologue · prologue · **gate: `first-open-played`**
**The occasion:** the first weekend she entered anything.
**Where it comes from:** the first played weekend in the prologue trace.

| voice | note |
| --- | --- |
| `sunny` | `Your first tournament. You told everybody in the queue that it was your first tournament.` |
| `fiery` | `Your first tournament, and you wanted to know who decides the order of play.` |
| `deep` | `You didn't eat breakfast and you didn't say why until the drive home. Your first tournament.` |
| `quiet` | `Your first tournament. You put your shoes by the door the night before.` |

| voice | caption |
| --- | --- |
| `sunny` | `She made friends in the queue.` |
| `fiery` | `She read the draw sheet twice.` |
| `deep` | `She was quiet all morning.` |
| `quiet` | `Shoes by the door the night before.` |

| voice | line |
| --- | --- |
| `sunny` | `A whole weekend, and she never sat down.` |
| `fiery` | `Somebody had to explain the draw.` |
| `deep` | `She held it in until the car.` |
| `quiet` | `She was ready before we were.` |

### A3 · `first-win` · prologue · prologue · **gate: `first-open-with-a-win`**
**The occasion:** the first weekend she won a match.
**Where it comes from:** the first played weekend in the trace whose wins are above zero.

| voice | note |
| --- | --- |
| `sunny` | `You won one. You told me about the point, not the score.` |
| `fiery` | `You won one, and you were furious about the game you dropped.` |
| `deep` | `You won one. You said one sentence about it and then wanted to go home.` |
| `quiet` | `You won one. You asked what time we were leaving.` |

| voice | caption |
| --- | --- |
| `sunny` | `She wanted to tell somebody.` |
| `fiery` | `She was still cross about one game.` |
| `deep` | `She said it once, quietly.` |
| `quiet` | `She asked about the drive home.` |

| voice | line |
| --- | --- |
| `sunny` | `She led with the point.` |
| `fiery` | `One game. One.` |
| `deep` | `She keeps the good ones somewhere I can't see.` |
| `quiet` | `She never once said the word.` |

### A4 · `first-cup` · prologue · prologue · **gate: `first-open-won-outright`**
**The occasion:** she won a whole weekend.
**Where it comes from:** the first played weekend in the trace that she finished top.

| voice | note |
| --- | --- |
| `sunny` | `You won the whole thing. You carried it to the car with both hands.` |
| `fiery` | `You won the whole thing and announced it before the handshake had finished.` |
| `deep` | `You won the whole thing. You looked at it for a long time before you picked it up.` |
| `quiet` | `You won the whole thing. You put it in the boot yourself.` |

| voice | caption |
| --- | --- |
| `sunny` | `Both hands, all the way to the car.` |
| `fiery` | `She told the car park.` |
| `deep` | `She looked at it a long time.` |
| `quiet` | `She carried it herself.` |

| voice | line |
| --- | --- |
| `sunny` | `She wouldn't let go of it.` |
| `fiery` | `The handshake was still going.` |
| `deep` | `She was checking it was real.` |
| `quiet` | `Nobody else was allowed to carry it.` |

## The titles – four, because a dense career has thirteen

⭐ Spec §3: «первый титул – да, четырнадцатый – только если он о чём-то (высшая ступень,
возвращение после травмы, последний в карьере)». These four are exactly that sentence.

### A5 · `first-title` · title · young, teen, adult · **gate: `first-of-kind`**
**The occasion:** her first title.
**Where it comes from:** the earliest `title` row in `world.milestones`.

| voice | note |
| --- | --- |
| `sunny` | `Your first. You rang before you had left the court and I couldn't hear a word of it.` |
| `fiery` | `Your first. You said you should have had it a year ago.` |
| `deep` | `Your first. You called late, and the first thing you said was about the second set.` |
| `quiet` | `Your first. You told me the flight time, and then at the end you told me.` |

| voice | caption |
| --- | --- |
| `sunny` | `She rang from the court.` |
| `fiery` | `A year late, she said.` |
| `deep` | `She called after midnight.` |
| `quiet` | `She mentioned it last.` |

| voice | line |
| --- | --- |
| `sunny` | `I heard the crowd before I heard her.` |
| `fiery` | `Nothing is ever on time for her.` |
| `deep` | `Late, and exact, as usual.` |
| `quiet` | `The flight time came first.` |

### A6 · `title-step-up` · title · young, teen, adult, lateCareer · **gate: `tier-above-every-previous-title`**
**The occasion:** a title at a higher rung than any she had won before.
**Where it comes from:** the `tier` on the `title` row, against every earlier one.

| voice | note |
| --- | --- |
| `sunny` | `A step up, and you were straight on the phone about the court and the noise and the food.` |
| `fiery` | `A step up. You said the draw had been harder and you wanted that on the record.` |
| `deep` | `A step up. You said it was the same game with more people watching, and then you went quiet.` |
| `quiet` | `A step up. You sent the scoreline and nothing else.` |

| voice | caption |
| --- | --- |
| `sunny` | `A bigger court, and she noticed all of it.` |
| `fiery` | `She wanted the draw noted.` |
| `deep` | `The same game, she said.` |
| `quiet` | `Just the scoreline.` |

| voice | line |
| --- | --- |
| `sunny` | `She told me about the food.` |
| `fiery` | `For the record, then.` |
| `deep` | `More people watching. Same girl.` |
| `quiet` | `She let the number do it.` |

### A7 · `title-after-injury` · title · teen, adult, lateCareer · **gate: `first-title-after-a-layoff`**
**The occasion:** the first title after time out.
**Where it comes from:** the first `title` row after an `injury` row's layoff ended.
⚠ **No body part is named in any voice** (§3.3). The injury's kind is real in the save and varies;
the handwriting says «everything» and «it».

| voice | note |
| --- | --- |
| `sunny` | `The first one back. You said you had forgotten how much of it is just standing about waiting.` |
| `fiery` | `The first one back, and you said nobody asks about the months off when you win.` |
| `deep` | `You had been afraid of the first serve, you told me, and then you weren't. The first one back.` |
| `quiet` | `The first one back. You said everything was fine. You said it twice.` |

| voice | caption |
| --- | --- |
| `sunny` | `She had forgotten the waiting.` |
| `fiery` | `Nobody asks now, she said.` |
| `deep` | `Afraid of the first serve, then not.` |
| `quiet` | `She said it twice.` |

| voice | line |
| --- | --- |
| `sunny` | `All that standing about.` |
| `fiery` | `They only ask when she loses.` |
| `deep` | `She named the fear once it was over.` |
| `quiet` | `Twice is how I knew.` |

### A8 · `title-last` · title · adult, lateCareer · **gate: `last-title-of-the-career`**
**The occasion:** the last one, which nobody could know at the time.
**Where it comes from:** the newest `title` row **on a finished career only** – see §4.

| voice | note |
| --- | --- |
| `sunny` | `Nobody told us it was the last one. You would have made more of it, and so would I.` |
| `fiery` | `Nobody told us it was the last one. You would have had a great deal to say about that.` |
| `deep` | `You always knew which ones mattered. I think you knew this one was the last before I did.` |
| `quiet` | `It was the last one and nobody knew. You packed the same as always.` |

| voice | caption |
| --- | --- |
| `sunny` | `Nobody knew it was the last.` |
| `fiery` | `She would have had words about it.` |
| `deep` | `She may have known.` |
| `quiet` | `She packed the same as always.` |

| voice | line |
| --- | --- |
| `sunny` | `We would have made more of it.` |
| `fiery` | `No speech. She would have hated that.` |
| `deep` | `She knew which ones mattered.` |
| `quiet` | `Same bag, same folding.` |

## The finals – two, and the second is the one she lost

### A9 · `first-final` · final · young, teen, adult · **gate: `first-of-kind`**
**The occasion:** the first final she reached.
**Where it comes from:** the earliest `final` row.
⚠ **Result-neutral in all four voices.** A `final` row means she REACHED one, and a title captures
it too, so this occasion cannot assume she lost – or won.

| voice | note |
| --- | --- |
| `sunny` | `Your first final. You told me who was in the stands and what the walk out was like, and I had to ask for the score.` |
| `fiery` | `Your first final. You wanted to be there again next week and you said so before you had sat down.` |
| `deep` | `Your first final. You said the walk out was longer than you had expected.` |
| `quiet` | `Your first final. You told me about the clock at the side of the court.` |

| voice | caption |
| --- | --- |
| `sunny` | `I had to ask for the score.` |
| `fiery` | `Again next week, she said.` |
| `deep` | `The walk out was longer than she expected.` |
| `quiet` | `She noticed the clock.` |

| voice | line |
| --- | --- |
| `sunny` | `The stands came first.` |
| `fiery` | `Already booking the next one.` |
| `deep` | `She counted the steps out.` |
| `quiet` | `The clock, of all things.` |

### A10 · `final-lost` · final · young, teen, adult, lateCareer · **gate: `final-with-no-title-that-week`**
**The occasion:** a final she lost.
**Where it comes from:** a `final` row with no `title` row in the same week.

| voice | note |
| --- | --- |
| `sunny` | `You lost it and you still wanted to talk. That is not nothing, and I hope you know it.` |
| `fiery` | `You lost it and you had already decided why by the time you rang.` |
| `deep` | `You lost it, and two days later you told me the one point it had turned on.` |
| `quiet` | `You lost it. You asked about the garden.` |

| voice | caption |
| --- | --- |
| `sunny` | `She wanted to talk anyway.` |
| `fiery` | `She had the reason ready.` |
| `deep` | `Two days, then one point.` |
| `quiet` | `She asked about the garden.` |

| voice | line |
| --- | --- |
| `sunny` | `She rang. That is the part.` |
| `fiery` | `The verdict arrived first.` |
| `deep` | `She had been holding that point for two days.` |
| `quiet` | `We talked about the garden.` |

## The seasons – four, because they are the largest kind in the pool

⚠ Twenty-one `season-rank` rows on his densest career. Four occasions is the floor at which a
twenty-one-season album is not four sentences repeated.

### A11 · `season-first` · season-rank · young, teen · **gate: `first-season-closed`**
**The occasion:** the first season that closed with a ranking at all.
**Where it comes from:** the earliest `season-rank` row.

| voice | note |
| --- | --- |
| `sunny` | `Your first season, closed. You wanted to know whether the number was good and I didn't know either.` |
| `fiery` | `Your first season closed on a number you said was wrong and would fix.` |
| `deep` | `Your first season, closed. You looked at the number for a while and then put the phone down.` |
| `quiet` | `You wrote the number on the calendar in pencil. That was your first season, closed.` |

| voice | caption |
| --- | --- |
| `sunny` | `Neither of us knew if it was good.` |
| `fiery` | `She intends to fix it.` |
| `deep` | `She sat with the number a while.` |
| `quiet` | `On the calendar, in pencil.` |

| voice | line |
| --- | --- |
| `sunny` | `A number with nothing to compare it to.` |
| `fiery` | `Wrong, apparently.` |
| `deep` | `She read it more than once.` |
| `quiet` | `In pencil, so it could move.` |

### A12 · `season-best` · season-rank · young, teen, adult, lateCareer · **gate: `rank-better-than-every-previous-close`**
**The occasion:** the best year so far.
**Where it comes from:** the `rank` on the row, against every earlier close.

| voice | note |
| --- | --- |
| `sunny` | `The best year so far. You listed every week of it and then said you were tired, which was the true part.` |
| `fiery` | `The best year so far, and you spent the whole call on the two weeks that went wrong.` |
| `deep` | `The best year so far. You said it had felt like one long week, and I think that was the whole report.` |
| `quiet` | `The best year so far. You asked whether we were coming at Christmas.` |

| voice | caption |
| --- | --- |
| `sunny` | `Tired, and pleased, in that order.` |
| `fiery` | `She only talked about the bad weeks.` |
| `deep` | `One long week, she called it.` |
| `quiet` | `She asked about Christmas.` |

| voice | line |
| --- | --- |
| `sunny` | `The tired bit was the true bit.` |
| `fiery` | `Two bad weeks, and that was the call.` |
| `deep` | `One long week. That was the report.` |
| `quiet` | `Christmas mattered more.` |

### A13 · `season-held` · season-rank · teen, adult, lateCareer · `any`
**The occasion:** a year that neither climbed nor fell – the ordinary one, and the commonest.
**Where it comes from:** any `season-rank` row the other three do not claim.

| voice | note |
| --- | --- |
| `sunny` | `A year of holding on. You said the middle of it had blurred and I know exactly what you mean.` |
| `fiery` | `A year of holding on. You wanted it to be a jump, it wasn't, and you said so all winter.` |
| `deep` | `A year of holding on. You said staying still takes more than it looks like it does.` |
| `quiet` | `A year of holding on. You sent next season's schedule two days later.` |

| voice | caption |
| --- | --- |
| `sunny` | `The middle of it blurred.` |
| `fiery` | `She wanted a jump.` |
| `deep` | `Staying still costs, she said.` |
| `quiet` | `Next season's schedule, two days later.` |

| voice | line |
| --- | --- |
| `sunny` | `A year she can't quite remember.` |
| `fiery` | `Holding on was not the plan.` |
| `deep` | `She is right about that.` |
| `quiet` | `Straight on to the next one.` |

### A14 · `season-down` · season-rank · adult, lateCareer · **gate: `rank-worse-than-the-previous-close`**
**The occasion:** a year that went the wrong way.
**Where it comes from:** the `rank` on the row against the previous close.

| voice | note |
| --- | --- |
| `sunny` | `A year that went the wrong way. You said so out loud, which is more than most people manage.` |
| `fiery` | `The year went the wrong way and you had a reason for every week of it, and you meant every one.` |
| `deep` | `A year that went the wrong way. You waited until January to tell me what you thought had happened.` |
| `quiet` | `You told me about the flights and the hotels all year, and never once about the year.` |

| voice | caption |
| --- | --- |
| `sunny` | `She said it out loud.` |
| `fiery` | `A reason for every week.` |
| `deep` | `She waited until January.` |
| `quiet` | `Flights, hotels, not the year.` |

| voice | line |
| --- | --- |
| `sunny` | `Naming it is most of it.` |
| `fiery` | `All of them true, probably.` |
| `deep` | `She needed the distance first.` |
| `quiet` | `Everything except the year.` |

## The body – two, and the second is the one that matters

⭐ **Spec §7, his ruling:** «травма разрешается в rehab, не в injury: альбом помнит, как она
вставала, а не как падала». Both occasions are written to that – `A15` is the week it stopped and
is already about what she did next; `A16` is the week she came back.

### A15 · `injury` · injury · young, teen, adult, lateCareer · `any`
**The occasion:** the week it stopped.
**Where it comes from:** an `injury` row.
⚠ **No body part, no duration, no date** (§3.1, §3.3). The save knows the kind; the handwriting
does not use it.

| voice | note |
| --- | --- |
| `sunny` | `The week it stopped. You went straight on to what you could still do, which frightened me more than crying would have.` |
| `fiery` | `The week it stopped. You were angry at the floor, the shoes, the schedule and me, in that order.` |
| `deep` | `The week it stopped. You asked how long, and when I said I didn't know, you said nothing for a day.` |
| `quiet` | `The week it stopped. You asked for a pen and wrote the dates on the calendar.` |

| voice | caption |
| --- | --- |
| `sunny` | `Straight on to what she could still do.` |
| `fiery` | `Angry at the floor first.` |
| `deep` | `She asked how long.` |
| `quiet` | `Dates on the calendar, in pen.` |

| voice | line |
| --- | --- |
| `sunny` | `I would have preferred the crying.` |
| `fiery` | `The shoes got it worst.` |
| `deep` | `A day of nothing, then a question.` |
| `quiet` | `In pen this time.` |

### A16 · `injury-return` · injury · young, teen, adult, lateCareer · **gate: `first-week-back-after-a-layoff`**
**The occasion:** the first week back.
**Where it comes from:** the week the layoff ended, derived – there is no milestone for it.

| voice | note |
| --- | --- |
| `sunny` | `First week back. You said the ball came at you faster than you had remembered, and you laughed about it.` |
| `fiery` | `First week back. You wanted all of it back at once, were told no, and I heard about that.` |
| `deep` | `First week back. You said you had been more afraid of this week than of the injury.` |
| `quiet` | `First week back. You told me what time the session was, which is how you tell me things.` |

| voice | caption |
| --- | --- |
| `sunny` | `The ball came faster than she remembered.` |
| `fiery` | `All of it back at once, please.` |
| `deep` | `More afraid of this than of that.` |
| `quiet` | `She told me the time of the session.` |

| voice | line |
| --- | --- |
| `sunny` | `She laughed at it, which helped.` |
| `fiery` | `They said no. I heard.` |
| `deep` | `She waited to say the true thing.` |
| `quiet` | `That is how she tells me things.` |

## Money and the road – three, one apiece

### A17 · `first-prize` · prize · young, teen · **gate: `first-of-kind`**
**The occasion:** the first week the tennis paid her.
**Where it comes from:** the `prize` row.
⚠ **No amount is written** (§3.1). `fiery` says «the number» and never says it.

| voice | note |
| --- | --- |
| `sunny` | `The first time it paid. You wanted to spend it on all of us and we had to talk you out of it.` |
| `fiery` | `The first time it paid you said it wasn't very much, and then you kept saying the number.` |
| `deep` | `You said the money made the whole thing real in a way the results hadn't. The first time it paid.` |
| `quiet` | `The first time it paid. You asked what the tax on it was.` |

| voice | caption |
| --- | --- |
| `sunny` | `She wanted to spend it on us.` |
| `fiery` | `Not very much, she said. Repeatedly.` |
| `deep` | `Realer than the results, she said.` |
| `quiet` | `She asked about the tax.` |

| voice | line |
| --- | --- |
| `sunny` | `We talked her out of it.` |
| `fiery` | `She said the number a lot.` |
| `deep` | `Money made it real. Not the winning.` |
| `quiet` | `Straight to the tax.` |

### A18 · `first-international` · international · young, teen · **gate: `first-of-kind`**
**The occasion:** the first time she played abroad.
**Where it comes from:** the `international` row.
⚠ **No country and no city is named** (§3.3) – the calendar's names are fictional and drawn per
career, so a named one here would contradict the ticket on the same sheet.

| voice | note |
| --- | --- |
| `sunny` | `Your first one abroad. You sent a photograph of the airport ceiling, of all things.` |
| `fiery` | `You had a full opinion on the country before the bags came off. Your first one abroad.` |
| `deep` | `Your first one abroad. You said everything sounded different and that you liked it, and that was the message.` |
| `quiet` | `Your first one abroad. You sent the arrival time.` |

| voice | caption |
| --- | --- |
| `sunny` | `A photograph of the airport ceiling.` |
| `fiery` | `An opinion before the bags.` |
| `deep` | `Everything sounded different.` |
| `quiet` | `Just the arrival time.` |

| voice | line |
| --- | --- |
| `sunny` | `The ceiling. Not the court.` |
| `fiery` | `She had decided by baggage reclaim.` |
| `deep` | `She liked the sound of it.` |
| `quiet` | `Landed. That was the message.` |

### A19 · `break-even` · break-even · teen, adult, lateCareer · `any`
**The occasion:** the week it started paying for itself.
**Where it comes from:** the `break-even` row – captured the week it happens, because it cannot be
reconstructed afterwards.

| voice | note |
| --- | --- |
| `sunny` | `The week it paid for itself. You said we could stop doing sums at the kitchen table and I said we would see.` |
| `fiery` | `It paid for itself, and you said you had told us it would, and you had, more than once.` |
| `deep` | `The week it paid for itself. You knew what it had cost. You had always known.` |
| `quiet` | `You asked, in a roundabout way, whether we were all right now. That was the week it paid for itself.` |

| voice | caption |
| --- | --- |
| `sunny` | `No more sums at the kitchen table.` |
| `fiery` | `She had told us. She reminded us.` |
| `deep` | `She always knew what it cost.` |
| `quiet` | `She asked, in her way, if we were all right.` |

| voice | line |
| --- | --- |
| `sunny` | `We would see, I said.` |
| `fiery` | `She had told us. Twice.` |
| `deep` | `She had been carrying that quietly.` |
| `quiet` | `It took her a while to ask.` |

## Life – two

### A20 · `school-done` · school · young, teen · `any`
**The occasion:** school ended.
**Where it comes from:** the `school` row – «Школа должна когда-то закончиться».

| voice | note |
| --- | --- |
| `sunny` | `School finished. You came home and told us everybody else's plans before your own.` |
| `fiery` | `School finished. You said you had been waiting years for it, and then stood in the hall not leaving.` |
| `deep` | `School finished. You said you would miss the mornings, which nobody expected, least of all you.` |
| `quiet` | `School finished. You cleared the desk that evening and didn't mention it again.` |

| voice | caption |
| --- | --- |
| `sunny` | `Everybody else's plans first.` |
| `fiery` | `She stood in the hall a while.` |
| `deep` | `She will miss the mornings.` |
| `quiet` | `The desk was cleared that evening.` |

| voice | line |
| --- | --- |
| `sunny` | `Her own plans came last.` |
| `fiery` | `Years of waiting, and then she waited.` |
| `deep` | `Nobody expected the mornings.` |
| `quiet` | `Cleared, and never mentioned.` |

### A21 · `wedding` · wedding · adult, lateCareer · `any`
**The occasion:** the week she married.
**Where it comes from:** the `wedding` row, whose identity is per episode – a second marriage
reaches this occasion again, and the handwriting does not need to know which time it is (§4).
⚠ **The other person is never named, characterised or given a sex** (§3.3).

| voice | note |
| --- | --- |
| `sunny` | `You talked to everybody. You have always talked to everybody, and it was the right day for it.` |
| `fiery` | `You cried at the wrong moment and were cross about it for a week afterwards.` |
| `deep` | `You said one sentence to me before it started and I have not repeated it to anybody.` |
| `quiet` | `You checked the time of everything, and then you let the day happen without running it.` |

| voice | caption |
| --- | --- |
| `sunny` | `She talked to everybody.` |
| `fiery` | `Cross about the crying, later.` |
| `deep` | `One sentence, before it started.` |
| `quiet` | `She let somebody else run it.` |

| voice | line |
| --- | --- |
| `sunny` | `The right day for it.` |
| `fiery` | `The wrong moment, she says.` |
| `deep` | `I am keeping that one.` |
| `quiet` | `She stopped checking the time.` |

## The assets – five firsts

⚠ Coverage from spec §5: first house 93%, brand 93%, academy land 78%, courts 59%, building 41%.
Each happens once in a career, so each is written once.

### A22 · `first-house` · asset · teen, adult · **gate: `first-home-bought`**
**The occasion:** her own front door.
**Where it comes from:** the first home in `world.assets` and its `boughtWeek`.

| voice | note |
| --- | --- |
| `sunny` | `Your own front door. You rang from the empty hall so that I could hear the echo.` |
| `fiery` | `Your own front door. You had already decided what was wrong with the kitchen.` |
| `deep` | `Your own front door. You said it was strange that a key could do that.` |
| `quiet` | `Your own front door. You sent one photograph, of the door.` |

| voice | caption |
| --- | --- |
| `sunny` | `She rang from the empty hall.` |
| `fiery` | `The kitchen was already wrong.` |
| `deep` | `Strange, what a key can do.` |
| `quiet` | `One photograph. The door.` |

| voice | line |
| --- | --- |
| `sunny` | `I heard the echo.` |
| `fiery` | `Wrong kitchen, right house.` |
| `deep` | `A key, and a different life.` |
| `quiet` | `Just the door.` |

### A23 · `brand` · asset · teen, adult · **gate: `brand-founded`**
**The occasion:** her name on something that is not a draw sheet.
**Where it comes from:** the brand asset and its `boughtWeek`.
⚠ **The brand's own name is never written** – it is generated per career.

| voice | note |
| --- | --- |
| `sunny` | `Your name on something that isn't a draw sheet. You thought it was funny. It was also enormous.` |
| `fiery` | `They put your name on it and you had the colour changed, because of course you did.` |
| `deep` | `Your name on something that isn't a draw sheet. You said it didn't feel like yours yet.` |
| `quiet` | `We found out it existed after you had signed for it. Your name, on a thing.` |

| voice | caption |
| --- | --- |
| `sunny` | `She thought it was funny.` |
| `fiery` | `She had the colour changed.` |
| `deep` | `It didn't feel like hers yet.` |
| `quiet` | `We were told after the signing.` |

| voice | line |
| --- | --- |
| `sunny` | `Funny, and enormous.` |
| `fiery` | `They changed the colour.` |
| `deep` | `Not hers yet, she said.` |
| `quiet` | `Afterwards, as usual.` |

### A24 · `academy-land` · asset · teen, adult, lateCareer · **gate: `academy-land-bought`**
**The occasion:** the field.
**Where it comes from:** the academy land asset and its `boughtWeek`.

| voice | note |
| --- | --- |
| `sunny` | `A field, and you walked us round all of it describing courts that weren't there.` |
| `fiery` | `A field, and you were already annoyed about how long everything was going to take.` |
| `deep` | `A field. You stood at one end of it for a while and didn't say what you were seeing.` |
| `quiet` | `A field. You had measured it before you told us about it.` |

| voice | caption |
| --- | --- |
| `sunny` | `She showed us courts that weren't there.` |
| `fiery` | `Too slow already.` |
| `deep` | `She stood at one end of it.` |
| `quiet` | `She had measured it first.` |

| voice | line |
| --- | --- |
| `sunny` | `All of it, twice round.` |
| `fiery` | `Nothing moves fast enough.` |
| `deep` | `She was seeing something.` |
| `quiet` | `Measured, then mentioned.` |

### A25 · `academy-courts` · asset · adult, lateCareer · **gate: `academy-courts-built`**
**The occasion:** the courts went in.
**Where it comes from:** the academy courts asset and its `boughtWeek`.

| voice | note |
| --- | --- |
| `sunny` | `The courts went in. You hit on the first one before the lines were dry, you said, and I believe you.` |
| `fiery` | `The courts went in. You found a fault with the surface on day one and made them come back.` |
| `deep` | `The courts went in. You said the sound was wrong, and then a week later that it was right.` |
| `quiet` | `The courts went in. You sent a photograph with nobody in it.` |

| voice | caption |
| --- | --- |
| `sunny` | `She hit on the first one straight away.` |
| `fiery` | `They came back and did it again.` |
| `deep` | `The sound was wrong, then right.` |
| `quiet` | `A photograph with nobody in it.` |

| voice | line |
| --- | --- |
| `sunny` | `Before the lines were dry.` |
| `fiery` | `She made them come back.` |
| `deep` | `She was listening to it.` |
| `quiet` | `Empty courts, on purpose.` |

### A26 · `academy-built` · asset · adult, lateCareer · **gate: `academy-building-finished`**
**The occasion:** the building is up.
**Where it comes from:** the academy building asset and its `boughtWeek`.
⚠ **No coach and no member of staff is named or implied** (§3.3) – a career may have had neither.

| voice | note |
| --- | --- |
| `sunny` | `The building is up. You gave us the tour twice and told us who each room was going to be for.` |
| `fiery` | `The building is up. You said the sign was too small and had a bigger one made.` |
| `deep` | `The building is up. You said your name looked too big on the front of it.` |
| `quiet` | `The building is up. You had already worked out where the children would wait.` |

| voice | caption |
| --- | --- |
| `sunny` | `The tour, twice, room by room.` |
| `fiery` | `The sign was too small.` |
| `deep` | `Her name looked too big.` |
| `quiet` | `She knew where they would wait.` |

| voice | line |
| --- | --- |
| `sunny` | `A room for everything.` |
| `fiery` | `A bigger sign, then.` |
| `deep` | `Too big, she said. It isn't.` |
| `quiet` | `She thought about the waiting.` |

## The super-rare three – his 19.09 addition, written once each

⭐ «у нас еще есть супер-редкие события типа lifetime sponsor, побед на шлемах, 4 лет в топе и
прочего, эти тоже могут быть достойны вполне места в альбоме». ⚠ §4b measured her best finish at
the highest step at 2 on the densest of his nine careers, so `A28` may never be seen; and the run
threshold for `A29` is the engine's to pick at a reachable number, not a pretty one.

### A27 · `lifetime-sponsor` · rare · adult, lateCareer · **gate: `lifetime-contract-signed`**
**The occasion:** the contract that does not run out.
**Where it comes from:** the offer history.

| voice | note |
| --- | --- |
| `sunny` | `The one that doesn't run out. You said you would finally stop being nervous every winter, and then you were nervous anyway.` |
| `fiery` | `They offered you the one that doesn't run out. You said it should have come years ago, and signed it the same day.` |
| `deep` | `The one that doesn't run out. You said it was strange to be planned for that far ahead.` |
| `quiet` | `You read the whole thing before you told anybody. The one that doesn't run out.` |

| voice | caption |
| --- | --- |
| `sunny` | `Nervous anyway, every winter.` |
| `fiery` | `Years late, signed the same day.` |
| `deep` | `Strange, being planned for.` |
| `quiet` | `She read all of it first.` |

| voice | line |
| --- | --- |
| `sunny` | `The worry has a habit.` |
| `fiery` | `Late, and signed anyway.` |
| `deep` | `Somebody planned that far ahead.` |
| `quiet` | `All of it, before a word.` |

### A28 · `top-tier-title` · rare · teen, adult, lateCareer · **gate: `title-at-the-highest-step`**
**The occasion:** the biggest one there is.
**Where it comes from:** `bestFinishByTier` at the top step.
⚠ **The step is never named** (§3.3) – our ranks are ours and the mockup's are trademarks.

| voice | note |
| --- | --- |
| `sunny` | `The big one. You rang and couldn't finish a sentence, and neither could I.` |
| `fiery` | `The big one. You said you had been telling people for years and that nobody had listened.` |
| `deep` | `The big one. You said the last game had felt like it belonged to somebody else.` |
| `quiet` | `The big one. You asked whether we had seen it. We had seen it.` |

| voice | caption |
| --- | --- |
| `sunny` | `Neither of us finished a sentence.` |
| `fiery` | `She had been saying so for years.` |
| `deep` | `The last game belonged to somebody else.` |
| `quiet` | `She asked whether we had seen it.` |

| voice | line |
| --- | --- |
| `sunny` | `No sentences, at either end.` |
| `fiery` | `Nobody listened. They do now.` |
| `deep` | `She watched herself do it.` |
| `quiet` | `We had seen it.` |

### A29 · `years-at-the-top` · rare · adult, lateCareer · **gate: `a-run-of-seasons-inside-the-threshold`**
**The occasion:** a run of seasons up there.
**Where it comes from:** a series over `seasonHistory`.
⚠ **No count of years is written** (§3.1) – the run's length is the threshold's, and the threshold
is the engine's.

| voice | note |
| --- | --- |
| `sunny` | `Years of it now. You still ring about the food and the courts and the crowd, exactly as you did the first time.` |
| `fiery` | `Years of it now. You said staying there is harder than getting there and dared anybody to argue.` |
| `deep` | `Years of it now. You said you had stopped noticing it, and then you noticed that.` |
| `quiet` | `Years of it now. You still send the flight times.` |

| voice | caption |
| --- | --- |
| `sunny` | `The same phone calls as the first year.` |
| `fiery` | `Harder to stay, she says.` |
| `deep` | `She had stopped noticing.` |
| `quiet` | `Still the flight times.` |

| voice | line |
| --- | --- |
| `sunny` | `She hasn't changed the call.` |
| `fiery` | `Nobody argued.` |
| `deep` | `Then she noticed that.` |
| `quiet` | `Every time. Flight times.` |

## The closing three

⭐ Spec §5: `adult-graduated` if there was a college, then the pair `lateCareer-farewell` (the last
match, evening) and `lateCareer-retired` (the last frame of the album, daylight).

### A30 · `graduated` · closing · teen, adult · **gate: `college-finished`**
**The occasion:** she finished the degree.
**Where it comes from:** the college branch's completion.

| voice | note |
| --- | --- |
| `sunny` | `You finished it. You said the hat was ridiculous and then wore it all afternoon.` |
| `fiery` | `You finished it. You said nobody had believed you could do both, and you were right, and we were among them.` |
| `deep` | `You finished it. You said the last week of it was the hardest week of the year, and you have had some weeks.` |
| `quiet` | `You finished it. You told us the date, and then the time, and then eventually that you had passed.` |

| voice | caption |
| --- | --- |
| `sunny` | `The hat was ridiculous. She kept it on.` |
| `fiery` | `Nobody believed she would do both.` |
| `deep` | `The hardest week of the year.` |
| `quiet` | `The date, the time, then the news.` |

| voice | line |
| --- | --- |
| `sunny` | `All afternoon in that hat.` |
| `fiery` | `We were among the doubters.` |
| `deep` | `And she has had some weeks.` |
| `quiet` | `The news came third.` |

### A31 · `farewell` · closing · adult, lateCareer · **gate: `the-last-match`**
**The occasion:** the last match – the evening one.
**Where it comes from:** the ending.

| voice | note |
| --- | --- |
| `sunny` | `The last one. You thanked everybody by name and got through it, which I could not have done.` |
| `fiery` | `The last one. You said you weren't going to make a speech, and then made one.` |
| `deep` | `The last one. You stayed on the court after everybody had gone, and I let you.` |
| `quiet` | `The last one. You folded everything into the bag the same way you always have.` |

| voice | caption |
| --- | --- |
| `sunny` | `She thanked everybody by name.` |
| `fiery` | `No speech, she said.` |
| `deep` | `She stayed after everybody had gone.` |
| `quiet` | `The bag, packed the usual way.` |

| voice | line |
| --- | --- |
| `sunny` | `I could not have done it.` |
| `fiery` | `It was a good speech.` |
| `deep` | `I let her have the court.` |
| `quiet` | `Same folding. Last time.` |

### A32 · `retired` · closing · adult, lateCareer · **gate: `the-career-ended`**
**The occasion:** the last frame of the album.
**Where it comes from:** the ending.
⭐ **This is the sheet the arc displaces when the lean moved** (§5). When it did not, this is what
the closing sheet says, and it is not a consolation line – it is the parent handing the book over.

| voice | note |
| --- | --- |
| `sunny` | `That is the album. You will tell it better than I have written it, and louder.` |
| `fiery` | `You will disagree with some of this, and I have left room. That is the album.` |
| `deep` | `That is the album. You will find the one week I have got wrong, and you will be right.` |
| `quiet` | `You will read it all the way through and say very little, and I will know. That is the album.` |

| voice | caption |
| --- | --- |
| `sunny` | `She will tell it louder.` |
| `fiery` | `She will disagree with some of it.` |
| `deep` | `She will find the week I got wrong.` |
| `quiet` | `She will read it all and say little.` |

| voice | line |
| --- | --- |
| `sunny` | `Her version is better.` |
| `fiery` | `I left room for the argument.` |
| `deep` | `She will be right, too.` |
| `quiet` | `I will know what it meant.` |

---

# THE ARC

⭐ His addition, 19.09: «вот это как раз можно и взять в альбом тоже, например писать, что сначала
она была такой-то, а потом стала такой-то, как вариант. Тогда вообще история целиковая
получится.»

The voice column here is **what she was born** – `temperament`, drawn at birth and never changed.
The direction is **where the lean went**. Both points are already stored; nothing new is persisted
for this. ⚠ §5 above: nothing is written for the never-drifted case, and the eight careers of nine
that never hired a psychologist take `A32` instead.

### ARC · `open` – the lean moved towards open

| voice | note |
| --- | --- |
| `sunny` | `You were always easy to talk to. It took me years to learn that easy to talk to and easy to know are not the same thing, and now I know you.` |
| `fiery` | `You always told us what you thought. Somewhere in here you started telling us what you felt, which is a different thing and took longer.` |
| `deep` | `You used to take a week to tell me one true sentence. Lately you say it the same day. It is still one sentence and it is still true.` |
| `quiet` | `For years I got the schedule when I asked how you were. This year I got the answer.` |

| voice | line |
| --- | --- |
| `sunny` | `The bright part was never the whole of it.` |
| `fiery` | `The verdicts were never the hard part.` |
| `deep` | `Same sentence. Sooner.` |
| `quiet` | `She stopped telling me the timetable.` |

### ARC · `reserved` – the lean moved towards reserved

| voice | note |
| --- | --- |
| `sunny` | `You used to tell me everything in the week it happened. Some of it is yours now, and I have had to learn that this is not a door closing.` |
| `fiery` | `You used to decide before the sentence was finished. Now you take the evening first. I miss the noise a little.` |
| `deep` | `You were always exact, and always late with it. You are more exact now, and later still, and I have stopped hurrying you.` |
| `quiet` | `You have always kept your own counsel. You keep more of it now, and what you do say has got heavier, and I listen harder.` |

| voice | line |
| --- | --- |
| `sunny` | `Not a door closing. I had to learn that.` |
| `fiery` | `She kept the fire. She learned where to put it.` |
| `deep` | `I stopped hurrying her.` |
| `quiet` | `Less said. More in it.` |
