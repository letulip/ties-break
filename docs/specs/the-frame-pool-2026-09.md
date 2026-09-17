---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-17
---

# The frame pool – the scene she says it in, which is not the thing she says

Owed by `small-talk-corpus-2026-09.md`, which names the gap rather than assuming it away: «a
situation owes ONE spoken line per voice – which is what this document holds – and the delivery
frame is drawn from a deterministic frame pool keyed on presence. That pool is owed and is not in
this document.» **This file is the brief for it.** The lines are the owner's; everything below is
what they have to satisfy, so he is choosing words rather than guessing at a shape.

## What a frame IS

A short lead-in sentence that sits before the quotation and puts the parent somewhere:

> **She put the kettle on.** `"Practice finally felt easy today."`
> **She mentioned it halfway through the call.** `"Practice finally felt easy today."`

⭐⭐ **The quoted span is IDENTICAL in both.** That is a law with a test behind it, not a habit:
`tests/wave3-presence.test.ts` §D extracts both spans and asserts they match. Presence changes the
scene the parent is standing in – **never the sentence she says inside the quotation marks.**

## The two presences, and the trap in the second one

`presenceOf(stage)` is `awayVoice(stage)`, which is `lifeStage === 'college' || 'independent'`.

| presence | what it means | which stages |
| --- | --- | --- |
| `roof` | she lives in the house | `school`, `after-school` |
| `away` | **she lives somewhere else** | `college`, `independent` |

⚠⚠ **`away` DOES NOT MEAN «at a tournament this week».** It is a life stage, not a travel week. The
same frame has to work for a nineteen-year-old in a dorm and a twenty-eight-year-old in her own
flat – `diary/words.ts` says it outright: «a dorm kid sends the same voice notes a tenant does».
So an away frame may not mention a room, a flatmate, a lecture, a hotel or a tournament. What it may
mention is **the channel and the distance**: the call, the message, the drive home at Christmas, how
long it took her to bring it up.

⚠ A `roof` frame may not assume a time of day or a meal unless it survives every week of the year.
«Over dinner» is fine; «before school» is not, because she is not always at school.

## How many, and why that number

⭐ **Eight per presence is enough, because the repeat is stopped by a MECHANISM and not by a bigger
pool.** `SMALL_TALK_EXCLUDE_LAST` already refuses the situation said most recently – round 43 #8(a)
built it after his «она пришла 2 раза подряд». Extending the same exclusion to the frame makes a
back-to-back repeat **impossible by construction**, and then eight is generous rather than thin.

Without that extension the frame repeats at 1-in-N by luck, and the number would have to be 12-15 to
feel unrepeated. **The mechanism is the cheaper half of the answer and it already exists.**

| pool | slots | note |
| --- | --- | --- |
| `roof` | 8 | the catalogue currently inlines 5, all usable as a starting point |
| `away` | 8 | the catalogue inlines **one**, which is the whole of the gap |

## The five rules a frame has to pass

1. **It says where the parent is standing, not what she feels.** Her mood is the voice's job –
   `sunny`, `fiery`, `deep`, `quiet` already carry it in the quoted line. A frame that says «she was
   upset» publishes a second, competing edition of her.
2. **It asserts no fact the situation might contradict.** No result, no placing, no money, no
   number, no named person. The frame is drawn INDEPENDENTLY of the situation, so anything it
   asserts has to be true of all 43.
3. **It carries no time-of-day or season that fails in some weeks** (see the `roof` note above).
4. **It works under every subject.** The same frame will wrap a piece of good news and a worry, so a
   frame that is funny or grave locks itself to half the corpus. ⚠ **This is the hardest of the
   five**, and if it turns out to be impossible the honest answer is to key the pool on
   `subject` as well as presence – say so and the shape changes, rather than the lines straining.
5. **Short.** Every one of the five that already exist is one clause, under twelve words.

## His own five, as the starting point

Live in `SMALL_TALK_SITUATIONS` today, written by him, all `roof`:

- She put the kettle on.
- She was straight into it before her bag was down.
- She was halfway out of her shoes and already telling it.
- She said it to the cupboard door, putting things away.
- She started it in the doorway and finished it sitting down.

And the single `away`: **She mentioned it halfway through the call.**

⭐ The precedent for the whole exercise is his own: `PresenceCell`'s note records that he wrote
**19 away frames for 20 cells** on wave 3 and named the twentieth himself as channel-neutral. This
is the same job, one beat kind over, and it is eight lines rather than nineteen.

## What the engine does with them – so nothing here is a surprise later

`smallTalkOpener` currently reads `situation.opener.roof` / `.away` and THROWS when the frame it
needs is absent. After this pool lands it draws the frame from the pool on a purpose-scoped
sub-stream (`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)` – never MAIN, invariant 2) and joins it
to the situation's one spoken line. The 43 rows then carry a payload each and no frames at all,
which is the whole reason the document holds one line per voice.


---

# THE POOL, WRITTEN (his, 17.09)

Sixteen lines, his, delivered against the brief above. **Not keyed on `subject`** – he tested the
most dangerous frame (`whole-message`) against a piece of good news, a worry and an observation and
it carried all three, so a subject matrix would be premature complication.

⭐ **He corrected one of his own shipped lines in the same pass.** `shoes` read «She was halfway out
of her shoes and **already telling it**», and his note: «по-английски рассказывают `a story` или
`someone something`, но не универсальное `it`». ⚠ That line is LIVE in `SMALL_TALK_SITUATIONS`, so
it is written into `world.events[].text` on every career that saw it – the correction carries a
frozen-career re-stamp with it, exactly as round 43's two coach sentences did.

## `roof` – she lives in the house

| id | frame |
| --- | --- |
| `kettle` | `She put the kettle on.` |
| `bag-down` | `She was straight into it before her bag was down.` |
| `shoes` | `She was halfway out of her shoes when she started.` |
| `cupboard` | `She said it to the cupboard door, putting things away.` |
| `doorway` | `She started it in the doorway and finished it sitting down.` |
| `table` | `She stopped beside the kitchen table and said it.` |
| `sofa` | `She sat on the arm of the sofa and began.` |
| `phone-counter` | `She set her phone on the counter and started talking.` |

## `away` – she lives somewhere else

| id | frame |
| --- | --- |
| `call-middle` | `She mentioned it halfway through the call.` |
| `call-open` | `She opened the call with it.` |
| `call-late` | `She said it near the end of the call.` |
| `voice-note` | `She sent it in a voice note.` |
| `whole-message` | `She sent it as the whole message.` |
| `other-message` | `She added it to a message about something else.` |
| `mid-something` | `She said it in the middle of something else.` **– the architect's, DRAFT** |
| `visit` | `She brought it up when she came by.` |

⭐ Four forms of distance rather than eight variations of one: **a live call, a voice note, text, and
the rare visit.** `visit` is the one that keeps the model honest – `away` does not mean they never
meet, it means the parent no longer watches her ordinary day by default.

## ⚠ `bag-down`'s urgency – CLOSED, and he closed it himself

He flagged that `bag-down` and `shoes` show her speaking fast while `cupboard` shows her speaking
sideways, and named the condition that makes it safe: **these frames may never be bound to a voice.**
They are not. The pool is keyed on presence ALONE and the draw is independent of temperament, so the
human variation stays variation instead of re-encoding `sunny` and `quiet` a second time.

## ✅ `family-chat` – REPLACED, and the reason was sharper than the one he gave

He flagged it for publicity: «сказанное видит не только родитель». **The check made it worse.** There
is no second parent and no sibling anywhere in `WorldState` – the household this game models is the
parent and her. So «the family chat» does not expose the line to somebody; it **implies a somebody
who does not exist**, which is R25's class of defect rather than a privacy question.

⚠ **His own alternative was set aside on his instruction** («бери свою замену», 17.09). `She put it
into a message without any lead-in.` is clean but sits very close to `whole-message`, which would
have spent the eighth slot on a near-synonym.

⭐ **THE REPLACEMENT IS THE ARCHITECT'S AND IS THEREFORE A DRAFT** – written on his explicit
instruction, which is the only thing that makes an agent's sentence admissible here at all:

> `mid-something` · **She said it in the middle of something else.**

**Why this form and not another.** The `roof` pool has a SIDEWAYS frame – `cupboard`, where she says
it without facing you, putting things away – and `away` had no equivalent: all seven of its lines
place the utterance in a CHANNEL. This one places it in her attention instead, which is the axis the
away pool was missing rather than a fifth way of saying «she sent a message».

⚠ It is distinct from `other-message`, and the distinction is worth stating because the two look
close: `other-message` is about the MESSAGE being about something else, this is about HER being in
the middle of something else. One is content, the other is attention, and they can both be true at
once.

**Against his own five rules:** it says where she is rather than what she feels; it asserts nothing a
situation could contradict (she is always doing something); it carries no time of day; it is
channel-neutral, so it survives the call, the voice note and the text alike; and it is one clause of
eight words. **Against his rejected list** it takes no intent, no struggle, no travel, no number and
no joke.

## THE THREE MECHANICAL RULINGS, AND WHAT THE THIRD ONE COSTS

1. ✅ **Stable ids, and the exclusion compares IDS rather than rendered text.** Adopted.
2. ✅ **Each presence pool remembers its own last two** – «roof remembers roof, away remembers away»
   – so two evenings at home separated by one call cannot repeat a frame from where he is sitting.
   Adopted; this is `SMALL_TALK_EXCLUDE_LAST`'s shape, one layer over.
3. ⚠⚠ **«The frame must not change after a save, a reload, or the array growing» IS A SCHEMA MOVE,
   and it is worth saying out loud before the wave starts.** A frame DERIVED from a purpose-scoped
   stream (`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)`) survives a reload perfectly – but a
   pool that grows from 8 to 9 re-derives a different member for a beat already on screen, which is
   the second half of what he ruled out. **So the chosen frame id must be PERSISTED on the
   `LifeBeatRecord`**, which is `SAVE_SCHEMA_VERSION` v80 → v81 and the full six-part move: bump,
   append-only migration, golden fixture, regenerated e2e fixtures, a `doc-facts` sentence and a
   frozen-career peel rung.

   ⭐ The field is optional and old rows fall back, which is what makes the migration trivial: rows
   written before this pool name the retired situations, and those carry their OWN inline frames, so
   nothing historical is re-rendered through the pool at all.

## What he ruled out, and it is a better list than a rule

Recorded verbatim because each one names a different way a frame can colour what it wraps:

| rejected | what it smuggles in |
| --- | --- |
| `She waited until the end of the call.` | makes the subject sound heavy |
| `She finally said it.` | asserts an inner struggle |
| `She called because she needed to tell us.` | attributes intent |
| `She sent it from the hotel.` | turns `away` into travel |
| `She said it on her way home.` | asserts a journey |
| `She dropped it into the conversation.` | faintly comic, too authorial |
| `She called out of nowhere.` | false if calls between them are ordinary |
| `She sent one line.` | a number, and it can contradict a long quotation |
