---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Small-talk conversations: varied openings and responsive follow-ups

**Status: draft, second pass.** Rewritten 14.09 after the owner's review of the first draft. His
central verdict, kept at the top because it is the whole point:

> Small talk should reveal her, and the kind of parent the player is being, without becoming a
> scored test.

His review found the diagnosis right and the direction right, but the first draft's design still
did not know what the conversation was *about* – so more sentences after a generic opener would
have made the exchange longer without making it more human. This pass fixes that. Everything below
is a proposal; every quoted line is a draft for his wording pass.

The two owner asks that raised the work:

> #15: «выбрал пункт, чтобы она сказала больше, а попап закрылся… может быть мы можем какие-то
> ситуации сгенерировать и сделать всё-таки какие-то продолжения для диалогов и разные варианты
> реакции ребенка на разные ответы? Сейчас выглядит как "сказала А, но никогда не сказала Б".»

> #24: «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
> разнообразия, это же наша главная фича.»

---

## 1. The core design

Small talk becomes a two-step conversation. She opens with a concrete subject, in the register of
her temperament and her life stage. The player then chooses whether to invite more, respond to
what she said, or give her space.

None of these choices changes bond, and none is marked correct. They stay meaningfully different:
inviting lets her keep going, responding lets her meet what the parent actually said, and giving
space closes the subject without punishing either of them. Her follow-up keeps the opener's
subject, her maturity, and its delivery frame (home or a call), so the conversation stays about the
one thing she brought.

```
  1. She opens        a concrete subject, in her voice and at her age
  2. The parent       invite more  ·  respond  ·  give space   (worded per subject)
  3. She follows up    invite → a continuation; respond/space → a shorter reaction
  4. Close             the beat ends; still bond-neutral, still missable
```

The economy does not change: the beat stays bond-neutral, non-blocking, missable, four a season.
What it gains is a second line of hers, and a reason for the first line to be different each time.

---

## 2. The subjects – real material, not a speech act

The first draft kept the shipped subjects `worry / joy / question`, and that is the root of the
repetition the owner keeps hitting. `worry` and `joy` name emotional *material*; `question` names a
*speech act*. Because the ordinary-mood week always resolves to `question`, the ordinary opener
always collapses to "I want to ask you something." No amount of paraphrase fixes a taxonomy that
puts a verb where the other two put a feeling.

So the subjects become six kinds of small thing she might bring:

| subject | what it is |
| --- | --- |
| `worry` | something sitting wrong |
| `good-news` | something that went right |
| `decision` | a small choice she is turning over |
| `curiosity` | a question she actually wants answered |
| `observation` | a thing she noticed, no ask attached |
| `story` | something that happened, told for its own sake |

Mood sets the **weights**, not the subject. A heavy week leans toward `worry` but can still produce
a tired `observation` or a small `decision`; a bright week leans toward `good-news` or `story`; an
ordinary week leans toward `curiosity`, `decision` or `observation`. The pick is a deterministic
draw on the beat's own `(seed, week)` sub-stream, so two careers meet different small things and any
one career replays identically. Replacing `smallTalkSubjectFor`'s hard mapping with a weighted draw
is the one mechanical change in this section; it stays on the existing key family, so MAIN and the
frozen capture are untouched.

---

## 3. The replies are keyed to the subject

The shipped set – "Ask her to say more" / "Tell her what we think" / "Tell her it can keep" – does
not mean the same thing around all six subjects. "It can keep" is dismissive over a worry and has
no referent over good news; "Tell her what we think" promises an opinion about content the game has
not written. A generic reply set is exactly why the reactions cannot become specific.

So the three stances stay, but each subject words them for itself. The stances are always the same
three shapes – **invite more · respond · give space** – and never one of them is the right one:

| subject | invite more | respond | give space |
| --- | --- | --- | --- |
| `worry` | Let her keep going | Tell her what worries us | Say she needn't solve it tonight |
| `good-news` | Ask what made it good | Tell her we're glad | Let her enjoy it |
| `decision` | Ask what she's weighing | Say how we see it | Say there's no rush |
| `curiosity` | Ask what she wants to know | Answer her honestly | Say it can wait |
| `observation` | Ask her to go on | Say we've noticed it too | Just let it sit |
| `story` | Ask what happened next | Say we're listening | Let her tell it her way |

These are the owner's own worry/good-news/curiosity rows from the review, extended to the other
three subjects in the same spirit. None promises content the game does not have: every "respond"
label is an *action the parent can take* (say how we see it, answer her honestly), not a claim
about a specific written opinion. The labels are the owner's to redraft; they are drafts here.

---

## 4. Her follow-up

Two follow-up shapes, both hers, both bond-neutral:

* **Invite more** → a **continuation**: a second sentence that opens the small thing up. This is
  the `fork-opinion` `listen` detour, generalised – choosing to invite lets her go on, and the
  reward is simply that she continues.
* **Respond / give space** → a **reaction**: one line that meets what the parent did and lets the
  beat close.

The rule that keeps this honest, worded carefully after the review: *none of the choices is marked
correct and none changes bond, but her response still recognises the difference between curiosity,
advice and giving space.* Inviting gets more of her; responding gets her meeting the parent's
actual words; giving space gets a quiet acknowledgement. Different emotional textures, no score.

---

## 5. Life stage, not just presence

Small talk is where age matters most: an eleven-year-old, a college student and a thirty-year-old
professional should not share a line because their temperament and mood happen to match. The engine
already carries this – `lifeBeatSaid` receives `DiaryLifeStage` (`school` · `after-school` ·
`college` · `independent`) – but the shipped small-talk copy throws it away and keys only on
home/away.

So the copy key becomes **temperament × subject × life-stage × delivery frame**. A `deep` girl with
a `curiosity` matures across the stages:

> school → "Can I ask you something?"
> after-school → "I need your take on something."
> college → "Got a minute? I want to run something by you."
> independent → "Can I ask you something – properly, not in passing?"

The delivery frame (home / a call) is the innermost split, as it is today.

---

## 6. Situations, composed rather than copied

The owner's biggest point: lexical variety (F-a in the first draft – a few phrasings of "something")
removes exact duplication but not *conversational* repetition. The player still meets the same empty
setup. Six real conversational seeds beat thirty-six paraphrases of "something."

The fix is to give each subject a small pool of concrete **situations** – a friend, a song stuck all
week, a practice that finally clicked, a bad line-call she can't let go – and to compose the beat
rather than author every branch:

```
  situation          → supplies the concrete fact and the opener
  voice × stage      → how she expresses it
  parent stance      → invite / respond / give space
  subject × voice × stance → the short reaction (respond / space)
  situation × voice  → the continuation (invite only)
```

Only the **continuation** (invite more) needs the exact situation. The short reactions can compose
at the subject level, because "we're glad" or "there's no rush" reads true of any good-news or any
decision. That keeps the situation real without writing an isolated screenplay for every branch.

**A situation must be a stable fact.** The chosen situation (a practice, a song, a friend's name)
has to be identical across the opener, the continuation, the reaction, every re-render of the
snapshot, and a save/reload. A deterministic `(seed, week)` derivation gives that – the same week
always names the same small thing – and it must stay **narrative texture only**: a practice that
felt easy is a mood, never a training gain; a friend mentioned is a name, never a new relationship
the rest of the engine has to honour. The fog law holds – nothing here writes a consequential fact.

---

## 7. What this actually costs, counted honestly

The first draft counted semantic cells and under-stated the writing. The real units:

| unit | meaning | multiplier |
| --- | --- | --- |
| semantic cell | one (subject, voice, stage, stance) slot | the design's shape |
| quotation | one written line of hers | one per cell |
| delivery frame | home / a call | ×2 on openers and continuations |
| authored string | what actually ships in the file | quotations × frames |

So a continuation table of, say, 6 situations × 4 voices needs up to 24 quotations and, with the
home/away frame, up to **48 authored strings** – before stages multiply it again. This is why the
delivery order below builds a *small real set* first and expands only after playtest, rather than
committing to a full corpus sight unseen. The document should never again quote a "cell" count as if
it were the writing budget.

---

## 8. Two situations, written in full

Real copy, so the texture is reviewable rather than promised. Drafts throughout.

### 8a. A practice that finally clicked (`good-news`, `deep` voice, `college` stage, home)

> She put the kettle on. "Practice finally felt easy today."

* **Ask what made it good** → continuation:
  > "Nothing I can name. I just stopped fighting it. I wanted to tell someone who'd know that's rare."
* **Tell her we're glad** → reaction:
  > "Maybe it doesn't sound like much. It felt like a lot."
* **Let her enjoy it** → reaction:
  > "I will. I only wanted to say it out loud once."

Same situation, on a call (delivery frame changes, the fact does not):

> She mentioned it halfway through the call. "Practice finally felt easy today."

### 8b. A line-call she can't let go (`worry`, `fiery` voice, `after-school` stage, home)

> She was straight into it before her bag was down. "There was a call today that was just wrong."

* **Let her keep going** → continuation:
  > "And I know I'm supposed to move on. I replayed it the whole way home instead."
* **Tell her what worries us** → reaction:
  > "I hear you. I don't want it in my head for the next one either."
* **Say she needn't solve it tonight** → reaction:
  > "Yeah. Okay. Tomorrow."

Neither branch is the win. Each answer acknowledges what the parent actually did, and each has a
different feel.

---

## 9. The existing openers – his proposed rewrites

The owner rewrote nine shipped opener lines in the review; because they are his copy, these are his
own drafts to apply when the bundle builds. Recorded here so they are not lost:

| shipped | his direction |
| --- | --- |
| "I've been worrying at something all week." | "Something's been on my mind all week." |
| "I'd rather say it than carry it." | "I think I need to say it out loud." |
| "Something went well. I'm pleased about it." | "Something went right this week. I'm still smiling about it." |
| "Something's bothering me. It's been bothering me for days." | "Something's bothering me, and I can't leave it alone." |
| "Today was a good one. A really good one." | "Good day. Really good. I needed one." |
| "The morning went the way I wanted it to." | "Today went well." |
| "Something is sitting wrong." | "Something's wrong. I don't know what yet." |
| "That is all I have." | "That's as far as I've got." |
| "Good week. I will take it." | "Good week. I needed that." |

Frame fixes he flagged: "past the point of the call", "rang out of turn", "before hello was done"
and "stacking the shelf" all read as constructed; and `deep` too often waits for a room to go quiet
or empty, which has become a visible authorial tic. The rewrite pass should vary how `deep` opens,
not only what she says.

---

## 10. Delivery order (his, adopted)

1. Build the reaction-capable prompt shape (opener → stance → follow-up, select-then-confirm, no
   auto-answer – this is also round 42 #8's fix).
2. Replace the generic replies with the subject-specific ones (§3).
3. Add six concrete situations – two per current subject to start (§6, §8).
4. Give those situations life-stage-aware opening variants (§5).
5. Write the response copy and playtest the full trees.
6. Expand the situation catalogue only after the small set works.
7. Add further lexical opener variants last – they are the cosmetic layer, not the fix.

This solves the human problem before spending effort on synonym variety, which was the first
draft's mistake.

---

## 11. The laws it keeps

* Bond-neutral: no reaction, continuation or situation carries a delta; the three stances stay
  zero, and the existing pin (`wave3-small-talk.test.ts` §C) stays green.
* Deterministic and private: every draw – subject, situation, opener variant – is on the beat's own
  `(seed, week)` sub-stream, re-derived at the call site, persisting nothing. The frozen capture
  must not move.
* Texture only: a situation is a mood or a name, never a fact the rest of the engine reads.
* Her voice reads birth; the mechanics that read expression do not touch a word of this.
* Missable stays missable: round 42 #20's soft-guard (the leave-anyway line and the pulse) is the
  whole of the beat's urgency.

---

## 12. What needs his word

1. The subject taxonomy and the mood weights (§2) – the one mechanical choice.
2. The subject-keyed reply labels (§3) – his copy.
3. The two starter situations per subject (§6/§8), then the full reaction and continuation tables –
   these are the writing, and they land here for his redaction pass as they are drafted. The first
   draft's 36-line "sample" was not enough real copy to review; §8 is the format the rest will take.
4. The opener rewrites (§9) – his own drafts, to apply with the bundle.
