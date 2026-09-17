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
