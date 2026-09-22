---
type: design
status: draft
area: life
canonical: false
last-reviewed: 2026-09-22
---

# The months before she says it – the hidden window, the loss, and a parent who cheered the wedding

⚠⚠ **NOTHING HERE IS BUILT AND NOTHING HERE IS RULED.** It is the document he asked for on 22.09
after raising the scenario himself, and it exists so the idea survives until its step. No code, no
constants, no schema.

Three things he asked this file to hold: the hidden window between conception and the announcement,
how the **four temperaments** differ through all of it, and the case where a parent blessed the
wedding and does not want the child at all («рано, у тебя карьера в апогее»). What it also has to
hold, because it is the heaviest content this game has considered, is the boundary the loss must be
built inside.

## 1. Where this belongs

**With step 8 (a death in the family), not with the pregnancy branch.** The private-life design's own
sentence about step 8 – *«it should be built last, carefully, and with the option to turn it off»* –
applies here word for word. Wave 9 shipped the child; the branch is complete without any of this,
and every item below can wait for a wave that is about weight rather than about mechanics.

## 2. ⚠⚠ The one thing this must never model: the parent as the cause

The scenario he sketched has a parent who pushes hard training while she is quietly pregnant, and a
loss follows. **The mechanism is the part to refuse, and it is a fact rather than a scruple.**

* Elite athletes train and compete through pregnancy – it is ordinary rather than reckless.
* The great majority of early losses are chromosomal: not caused by anything anybody did.
* So a game where a hard training block CAUSES a miscarriage is asserting something untrue, and is
  telling every player the sentence women already hear too often: *you did this by not resting.*

⭐ **The drama survives the refusal intact, and gets sharper.** What estranges her is not the block
he set while he did not know – it is **what he says when he finds out**, which is the layer's own
law (§4a: she decides, he reacts, the reaction moves `bond`). A parent who hears «I lost it» and
answers about the calendar has done something the game can price honestly, because he really did it.

⚠ And the off switch is not optional here. Bereavement's own design already reserves one; a
pregnancy loss rides with it.

## 3. The hidden window – the part worth building first, and the cheapest

Today the `'expecting'` card fires the week the hazard does. In life there are **four to eight weeks**
between conception and «I have something to tell you», and she does not always tell at the end of
them. That window is free drama we already own the machinery for:

* **She knows and he does not.** The layer has this shape already – arrivals reach the parent through
  the feed with a LAG, drawn per openness (`ECONOMY.life.lag`: an `open` girl tells inside 1–4 weeks
  70% of the time; a `private` one can take up to 12).
* **What the parent does inside the window is his own, and innocent.** He plans a brutal block
  because he does not know. When she tells him, the weeks behind him are re-read – by him, not by
  the game. **No mechanic prices those weeks.** The game does not need to punish him for the
  scene to land.
* **Cost**: one persisted week (`conceivedWeek`) and a lag draw. That is the whole of it.

## 4. How the four voices differ – and it is all ONE axis plus one

The temperaments are **two axes and not four personalities** (`who-she-is` §4): openness
(`sunny`/`fiery` open, `quiet`/`deep` private) and intensity (`sunny`/`quiet` steady,
`fiery`/`deep` intense). The whole of this scenario falls out of those two, which is what keeps it
from becoming four hand-written stories:

| | **how long the window lasts** | **the announcement** | **a loss, if it comes** | **a parent who says «too early»** |
| --- | --- | --- | --- | --- |
| `sunny` (open, steady) | shortest – she tells almost at once | to his face, plainly, expecting gladness | tells him, and wants him there | hurt, and it heals: her spirit dips and returns at the steady rate |
| `fiery` (open, intense) | short, and she may tell him **before** she is sure | an announcement, not a question | tells him fast and loud, then does not want to discuss it | ⚠ the sharpest break in the table – she answers, and the bond loss is the deepest |
| `quiet` (private, steady) | long – she may be at the pause before he knows | a sentence at the end of an evening | he may learn from the absence of entries, not from her | says nothing, and the distance is the price – measured in weeks of silence |
| `deep` (private, intense) | longest, and she tells when she has decided what she feels | considered, and she has rehearsed it | ⚠ the one who may not tell him at all | takes it inward; the bond moves least on the day and most over a season |

⭐ **Two design consequences worth naming now.** The window's length is ALREADY a drawn number per
openness, so three of the four columns above need no new constant. And the `deep` girl who does not
tell is the strongest scene in the whole sketch – the parent learns from a silence, which is a thing
this game can do and almost no other kind of game can.

## 5. «The wedding yes, the child no» – his second case

A parent can bless a marriage and refuse the pregnancy, and the words he gave it are the ones a real
parent uses: *«рано, у тебя карьера в апогее»*. Mechanically this needs **nothing new**: the
`'expecting'` card already has three priced answers, and `support` already persists and already
reaches both the postpartum recovery and her decision to return.

What the case asks for is **content rather than machinery**:

* the third answer's words are today the career-first one, and they should be allowed to be
  *reasonable* – «not now, look where you are» is a position, not a villain's line;
* ⚠ and the game must not settle who was right. If she returns to a top-ten career, he was right
  about the tennis and wrong about her; if she does not, the reverse. **The album is where that
  lands, and it should not editorialise either.**
* the reaction's PRICE is already measured (wave 8: bond medians heal within a season, `cold`
  lengthens the postpartum window and lowers her chance of returning) – so the case is already
  playable and only the wording is missing.

## 6. What we would need to know before building §2's loss

Two research asks, both small, both of which should land in
[life-events-motherhood.md](../research/life-events-motherhood.md) before a line is written:

1. **How far into a pregnancy do professionals actually train and compete?** The game currently
   stops entries `playsOnWeeks` (8) after the announcement; with a 4–8 week hidden window that puts
   her last event at roughly three to four months, which matches the handful of well-known cases but
   is not sourced. If the real answer is «training throughout, competing through the first
   trimester», our own numbers are close and should say so out loud.
2. **The real frequency of loss by age**, which is the only honest basis for a hazard. It rises with
   age and our window is 24–38, so a flat number would be wrong in both directions.

## 7. The shape, if he ever says build it

1. `conceivedWeek` and the lag – the hidden window alone, no loss, no new content. Cheap, and it
   makes every scene below possible.
2. The four voices' announcement lines, crossed as §4's table – content, no mechanics.
3. The «too early» answer's words, and the album's refusal to settle who was right.
4. ⚠ **The loss, last, with the off switch, its own hazard, and nothing in the engine that lets the
   parent's plan reach it.** If that separation is ever hard to hold, that is the signal to stop.
