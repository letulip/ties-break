---
type: spec
status: draft
area: narrative-and-copy
canonical: false
last-reviewed: 2026-09-17
---

# The two doors – everything a player reads, in one pass

This is the copy for round 45's two new endings: she leaves at the peak, and she leaves after the
fall. The mechanics are in `the-two-more-doors-2026-09.md`; nothing here is about mechanics.

Everything below is a draft. It is in the build so the two endings are playable and so the tests
have something real to read, but not one of these sentences is settled, and a word you change here
is a word that changes in the game. Ten lines in total: four exits, two epilogue paragraphs, two
epilogue headlines, two faces.

A quick way to review it: read section 2 straight through, four lines, and ask whether those are
four different girls. That is the whole design – you asked «Что у нас ещё темпераменты могут
сказать?» and the answer this round gives is that they say which door she goes out of, not just how
she phrases it.

---

## 1. Where each line appears

There are two feed rows when a door opens, in this order:

1. **Her exit line** – section 2. One sentence in her own voice, written once and printed in the
   feed the week she goes.
2. **The record** – the headline from section 4 and a short factual fragment, composed as
   «*She left at the top – she was #4 the week she said it.*»

And then, on the album's last page:

3. **The headline** – section 4, printed as that page's reason.
4. **Her face** – section 5.

The fragment in row 2 is not written by hand. It is the numbers the player just watched: her place
for the peak, and the two places for the fall (`#13 to #59 in one season`, which is your own
example from the spec).

One honest note about section 3. The six epilogue paragraphs that exist are not rendered anywhere
yet – you kept them in August when an agent proposed deleting them («может быть мы просто не
добрались еще до концовок и рано что-то удалять»), and the ending screen still has not been built
out to the point of showing them. The two new ones are written to stand beside the six for the day
it is. So sections 2, 4 and 5 are read in play today; section 3 is not yet.

---

## 2. The four exits

One per temperament. Each girl has exactly one door available to her for life, so a `fiery` girl can
only ever leave this way and a `deep` girl can only ever leave the other way.

### The fall – she will not go on after a season that fell apart

**fiery** – «хлопнула дверью и ушла»

> She said she was not going to stand out there and be watched losing it back. She said it once and
> she did not say it again.

**quiet** – «не выдержала», without a scene

> There was never a conversation about it. She did not enter anything for next season, and when you
> finally asked she said she thought you already knew.

The second one is literal rather than a figure of speech: the door opens in the off-season, before
next season's entries, so «she did not enter anything» is a description of the actual week.

### The peak – she goes while she is at the top

**deep** – decided over a year, told when it was settled. Barty's shape, and «больше не хочу играть»

> She had already decided, and she had decided a long time before she told you. She waited until the
> season was finished so it would be something she had done and not something she was thinking
> about.

**sunny** – a good day, and for a life rather than against tennis

> She said it on a good day and she meant it as a good thing. She is not leaving tennis, she said –
> she is going to go and have the rest of it.

The `sunny` one was the hardest of the four. It is the only leaving in the game that is not a loss,
and it has to be warm without congratulating the player on it.

---

## 3. The two epilogue paragraphs

**She left at the top**

> She was at the top of the sport the season she stopped. Nobody put the question to her and nobody
> had to – it was decided before anybody else heard about it.

**She stopped after the fall**

> One season took most of what the years in front of it had built. She did not enter the next one.
> Nobody asked her to stop and nobody talked her out of it.

The six paragraphs already in the game are held to one rule – none of them may console the player
about the ending. These two are held to it from both sides: the peak one may not cheer either, since
a paragraph that celebrates is the game grading her just as much as one that commiserates.

---

## 4. The two headlines

| ending | headline |
| --- | --- |
| peak | **She left at the top** |
| fall | **She stopped after the fall** |

For comparison, the six that exist: *She stopped after school* · *She went to college* · *The money
ran out* · *The body stopped first* · *She played until she was done* · *She had gone as far as she
was going*. They are all flat statements of what happened, with no adjective and no verdict, and
these two are written to sit in that list.

---

## 5. Her face

| ending | face |
| --- | --- |
| peak | happy |
| fall | serious |

The peak one is the only `happy` in the table. It is her face rather than a verdict, the same way
bankruptcy's `sad` is hers.

The fall takes `serious` and not `sad` or `angry`, and this is the one choice here worth arguing
about. The door has two voices – one of them slams it, one of them says nothing at all – and the
face is per ending rather than per voice. A `sad` face tells the `fiery` girl's story wrong and an
`angry` one tells the `quiet` girl's story wrong. `serious` is the one that is true of both. If you
would rather the face followed the voice, that is a small engine change and worth doing.

---

## 6. The rules these ten lines are written under

Three, and they are not new – they are the rules the existing endings already keep. They are here so
you can check the drafts against them rather than against taste.

**A line may not blame a body, a load or a decision.** This is the rule `lastWordLine` records. The
measurements behind it: she opens her *last* seasons better than her early ones, and the physical
share is a function of age alone, so a line that implies she wore out, or that the schedule did it,
or that you should have managed it differently, is a promise the engine does not keep. None of the
four exits names a body, a coach, a schedule or money.

**A line may say what she believes and never what the world is going to do.** The plateau card's own
rule, and it was measured: of 52 careers where that card fired, 52 later beat the rank they held the
day it did. Read as her doubt it is always right; read as a forecast it is almost always wrong.

**The game never tells you that you failed. It tells you what happened.** So nothing here grades the
career, and nothing consoles.

A test enforces all three mechanically – `tests/two-doors.test.ts` section E – by refusing a
vocabulary rather than by pinning the sentences, so you can rewrite any of these ten lines without
turning a test red. That is deliberate: the words are yours and a test that pinned them would have
to be edited every time you touched one.

---

## 7. What is not in this document

The rate (how often either door opens), the gates (what counts as a peak and what counts as a
collapse), and the measurement of both are in `the-two-more-doors-2026-09.md` §6. The only number
that appears here is the one in the fragment, and it comes from her season rather than from a
template.

## 8. The open questions

1. Are these four girls, or one girl in four registers? That is the test section 2 has to pass.
2. Should the fall's face follow the voice rather than the ending – `angry` for `fiery`, `sad` for
   `quiet`? It is a small change and this document is the place to say so.
3. Is «She stopped after the fall» the right headline? It is the one line here that names a mechanic
   («the fall») rather than a thing that happened, and it may be too much of a label.
4. Each voice has one exit line, so every `fiery` career that ends this way ends on the same
   sentence. The plateau card solved the same problem with four variants keyed on how many times she
   had already said «one more year». There is no equivalent state here – a leaving happens once –
   but there could be variants keyed on her place, or on how long she had been at the top. Worth
   doing, once these four are settled.
