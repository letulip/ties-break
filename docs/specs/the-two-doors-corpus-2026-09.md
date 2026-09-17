---
type: spec
status: draft
area: narrative-and-copy
last-reviewed: 2026-09-17
canonical: false
---

# The two doors – everything a player reads, in one pass

This is the copy for the two new endings: she leaves at the peak, and she leaves after the fall. The
mechanics are in `the-two-more-doors-2026-09.md`; nothing here is about mechanics.

Everything below is a draft. It is in the build so the two endings are playable and so the tests have
something real to read, but not one of these sentences is settled, and a word you change here is a
word that changes in the game. You can rewrite any of them without a test going red – that is
deliberate, and section 6 says how far the tests actually reach.

**Second pass, after your review of 17.09.** Three things you found were about facts rather than
taste, and all three are fixed here rather than argued with: a line may not claim something the
engine never tells it, a line may not lean on an event the player can never see, and the sunny exit
may not say she is not leaving tennis in the week the game ends her tennis career. The biggest change
is a count: **there are eight exits now, not four.**

## What changed, and why there are eight

You deleted the table that gave each temperament one door for life. That was the right call and the
mechanics document records it. But it has a consequence for the writing that is worth a paragraph,
because it doubled the work and improved the result.

When a `fiery` girl could only ever leave after a collapse, one line could be her whole exit. Now she
can also leave as world number one, and «she was not going to be watched losing it back» is a sentence
about a bad year in the mouth of a champion. So each voice needs two: what she says at the top, and
what she says after the fall. Four voices, two doors, eight lines.

A quick way to review it: read section 2 straight through and ask two things. Down each column – are
these four different girls? Across each row – is this the same girl in two different years?

---

## 1. Where each line appears

There are two feed rows when a door opens, in this order:

1. **Her exit line** – section 2. One sentence in her own voice, printed in the feed the week she
   goes.
2. **The record** – the headline from section 4 and a short factual fragment, composed as
   «*She left at the top – she was #4 the week she said it.*»

And then, on the album's last page:

3. **The headline** – section 4, printed as that page's reason.
4. **Her face** – section 5.

The fragment in row 2 is not written by hand. It is the numbers the player just watched: her place
for the peak, and the two places for the fall (`#13 to #59 in one season`, which is your own example
from the spec).

**One repair to that fragment, and it was your finding.** The peak door can open two ways – a top-ten
finish, or a title at the top of the sport – and the fragment used to name her place whenever she had
one. So a champion who finished the year at #15 read «She left at the top – she was #15 the week she
said it», which argues with itself in one sentence. The fragment now names whichever of the two
actually opened the door: her place if the place did it, the title if the title did. Her place is not
wrong in that case, it is just not the reason she is standing there.

One honest note about section 3. The eight epilogue paragraphs that exist are not rendered anywhere
yet – you kept them in August when an agent proposed deleting them («может быть мы просто не добрались
еще до концовок и рано что-то удалять»), and the ending screen still has not been built out to the
point of showing them. So sections 2, 4 and 5 are read in play today; section 3 is not yet.

---

## 2. The eight exits

Every girl can reach both doors now. Her temperament decides the words and nothing else.

### The peak – she goes while she is at the top

**fiery**

> She said she was stopping at the top, and that was the whole conversation.

**quiet**

> She said she was stopping here, while it was still good, and she did not make a thing of it.

**deep**

> She said she had known for a while, and that she waited until the season was over so it would be
> finished and not just decided.

**sunny**

> She said she was going to go and have the rest of her life, and she sounded like someone with
> plans.

### The fall – she will not go on after a season that fell apart

**fiery**

> She said she was not going to be watched losing it back, and she said it once.

**quiet**

> She said she was stopping, and she said it as if it were something you already knew.

**deep**

> She said she had been turning it over all season, and that the season had only told her what she
> already thought.

**sunny**

> She said she was glad she had done it, and that she did not want to spend the next year getting it
> back.

### What your three findings cost, line by line

You were right on all three and the rewrites are not cosmetic, so here is what each one moved.

**The function is told two things – which door, and which voice – so a line may say nothing else.**
The old `deep` exit said she had decided «a long time before she told you», the old `quiet` one said
«when you finally asked», and the old `sunny` one said she said it «on a good day». None of those is a
thing the engine knows: there is no conversation in the model, no day, and no record of when she made
up her mind. Every line above is now either «She said …», which is a claim about what she said and is
therefore always safe, or a statement about the door itself.

**The quiet exit contradicted itself and leaned on an event nobody can see.** «There was never a
conversation about it» followed by «when you finally asked» is two claims that cannot both hold. And
the fact underneath it – that she did not enter anything for next season – is not observable: the
career latches on the off-season wrap week, before next season is playable, so the player never
reaches an entry list to find her missing from it. The new `quiet` line keeps what was good about the
old one, which was her assuming you already knew, and drops the scene that was built out of two
things that were not there.

**The sunny exit said the opposite of what was happening.** «She is not leaving tennis, she said» is
printed in the week the engine ends her tennis career, which is about as directly as a line can argue
with its own event. The warmth was the part worth keeping, so it moved onto what she is going
towards.

**And the fiery voice was 27 words in two sentences**, which is not a door slamming. Both of hers are
one sentence now, and they are the two shortest in the set: 14 and 17 words, against `deep`'s 26 and
22. All eight are single sentences, so the length is doing the work the punctuation used to.

The `sunny` fall line was the hardest of the eight. It has to be warm on the hard door without
consoling you about it, and «glad she had done it» is her verdict on her own career rather than the
game's verdict on yours.

---

## 3. The two epilogue paragraphs

**She left at the top**

> She was at the top of the sport the season she stopped. Nobody put the question to her and nobody
> had to – it was decided before anybody else heard about it.

**She stopped after the fall**

> One season took most of what the season before it had built. Nobody asked her to stop and nobody
> talked her out of it.

The fall paragraph lost two claims on your review, both for the same reason as the exits. It said «the
years in front of it», which overstates the rule by about a decade – the collapse test compares the
closing season with the one immediately before it, and asks only two hundred points of the earlier
one, so a two-season career can pass it and the paragraph would be describing years that never
happened. And it said «She did not enter the next one», which is the same unobservable event the quiet
exit was leaning on.

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

Neither headline changed in this pass. You did not object to them, and the open question about «the
fall» as a label is still open in section 8.

---

## 5. Her face

| ending | face |
| --- | --- |
| peak | serious |
| fall | serious |

**The peak face changed, and the reason is the un-partitioning rather than taste.** It was `happy`,
and you read it against the voices: happy fits `sunny` and it does not fit `deep`. With the table gone
all four voices reach the peak, so a face that fits one of them is wrong three times in four. You had
already settled the same argument on the fall, where `serious` is the face that tells neither the
girl who slams the door nor the girl who says nothing wrong, and that argument is the same argument
here.

If you would rather the face followed the voice at either door, that is a small engine change and
nobody has made it. It is listed in section 8.

---

## 6. The rules these lines are written under, and what the tests actually check

Three rules, and they are not new – they are the rules the existing endings already keep. They are
here so you can check the drafts against them rather than against taste.

**A line may not blame a body, a load or a decision.** This is the rule `lastWordLine` records. The
measurements behind it: she opens her *last* seasons better than her early ones, and the physical
share is a function of age alone, so a line that implies she wore out, or that the schedule did it, or
that you should have managed it differently, is a promise the engine does not keep. None of the eight
exits names a body, a coach, a schedule or money.

**A line may say what she believes and never what the world is going to do.** The plateau card's own
rule, and it was measured: of 52 careers where that card fired, 52 later beat the rank they held the
day it did. Read as her doubt it is always right; read as a forecast it is almost always wrong.

**A line may not assert anything the function was not told.** This is the rule your review added, and
the three lines it caught are described in section 2.

**And here is the correction to what this document claimed last time.** It said a test enforced all
three mechanically. That was not true and you said so. `tests/two-doors.test.ts` section E checks that
the eight lines are eight distinct sentences, that each is long enough to be a sentence, that none of
them uses a banned word, and that none of them carries a long dash. **That is a lexical safety net.**
It is worth having – it catches a rewrite that duplicates a line or reaches for «tired» – but it
cannot tell that a line asserts a conversation the engine never saw, which is exactly why all three of
those lines shipped green and were caught by you reading them.

The answer to that is not a stricter test. A test that pinned the sentences would have to be edited
every time you touched a word, and a wording change is the one kind of change no test catches anyway.
The factual contract is enforced by somebody reading the lines against the rules above. That is what
your review was, and it worked.

---

## 7. What is not in this document

The rate (how often either door opens), the gates (what counts as a peak and what counts as a
collapse), the new age floor on the peak, and the measurement of all of them are in
`the-two-more-doors-2026-09.md` §6 and §10. The only number that appears here is the one in the
fragment, and it comes from her season rather than from a template.

## 8. The open questions

1. Are these eight girls-in-a-year, or one girl in eight registers? That is the test section 2 has to
   pass, and it is now a two-dimensional question: down the column, four different people; across the
   row, one person in two different years.
2. Should the face follow the voice rather than the ending – `angry` for `fiery`, `sad` for `quiet`?
   This was asked about the fall last time and it is now open at both doors, since both of them are
   shared by all four voices. It is a small change.
3. Is «She stopped after the fall» the right headline? It is the one line here that names a mechanic
   («the fall») rather than a thing that happened, and it may be too much of a label.
4. Each voice has one exit line per door, so every `fiery` career that ends at the top ends on the
   same sentence. The plateau card solved the same problem with four variants keyed on how many times
   she had already said «one more year». There is no equivalent state here – a leaving happens once –
   but there could be variants keyed on her place, or on how long she had been at the top. Worth
   doing, once these eight are settled.
