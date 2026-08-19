---
type: proposal
status: draft
area: governance
canonical: false
last-reviewed: 2026-08-19
---

# Proposal: make the balance-work method a standing rule – ⚠ NOT ADOPTED, awaiting the owner

**This is a proposal and nothing more.** Nothing in it is in force, no wave has been asked to follow
it, and no test or script enforces it. It is written because
the principles review's chapter 04
set out a method for balance work under the heading *"Review guidance for future balance work"*, and
that guidance was **never adopted and never rejected** – it has sat in an audit document for a day
while two balance changes shipped past it. An unruled rule is worse than either answer, because
everyone can cite it and nobody has to follow it.

**The ask is one sentence from you: yes, no, or yes-with-these-changes.**

---

## 1. What is being proposed

Three rules, all from chapter 04, none of them new inventions:

1. **Distributions, not anecdotes.** A balance claim ships with before/after evidence over a seed
   set, not one seed and not one hand-played career.
2. **Median plus tails.** Report the middle AND the failure modes, not the average alone. An average
   hides the two careers in thirty that go bankrupt.
3. **A correction is not a tuning change, and they are labelled apart.** A *correction* is "same
   situation, different result, because the old result was wrong". A *tuning change* is "same
   situation, deliberately different result, because we want a different game". They need different
   evidence and different permission, and today they arrive in the same commit under the same word.

Chapter 04 lists three more that this project already does without being told – retain deterministic
seed sets when changing a rule, test the player-facing explanation against the exact engine verdict,
and preserve integer cents and zero-draw transformations. They are in the proposal for completeness,
not because anything suggests they are at risk.

---

## 2. The concrete case for it, and it is not hypothetical

**TB-04 shipped without its bench arm, and it said so out loud.** The change: a manual skip now pays
the same eight condition points a medical withdrawal pays, because the two weeks are the same week.
You ruled it a fix rather than a tuning call – **«она и в одном случае не играла и в другом»**.

The commit's own words:

> ⚠ NOT MEASURED, AND WHY: no tool in `tools/` calls `skipEvent`, so a bench would return an
> identical diff – the null-arm trap, named rather than run.

That is the honest thing to have done, and it is exactly why the rule is worth writing down. Read
the sentence carefully and it says three separate things:

* **The measurement was impossible, not skipped.** Every bench career in `tools/` enters or is
  refused; none of them chooses not to enter. Running one would have produced a byte-identical diff
  and a confident "no effect" – a **null arm dressed as a null result**, which is the failure
  `CLAUDE.md` already records twice from 17.08 and which cost most of a day each time.
* **The reason it was impossible is a gap in the instrument, not in the change.** A mechanic the
  player uses and no bench exercises is a mechanic whose balance we cannot speak about at all.
* **And chapter 04's third rule is what made the ship safe.** Because TB-04 is a *correction* –
  nobody designed the eight points; both constants were 2 when the code was written and the
  condition-v2 flip parted them – it needs a demonstration that the old result was wrong, and it has
  one. Had it been a *tuning* change ("skipping should cost less"), the missing distribution would
  have been disqualifying. **The label is what decides which evidence is required**, and today the
  label is a matter of taste in a commit message.

**The same wave gives the other half of the argument, from the opposite direction.** The live
professional table shipped one day, was measured, and was still wrong: winnings were added on top of
a derived book that already contained them. What caught it was not a review but a distribution – the
inflation landed on ~350 of 1,600 pros, so the AVERAGE moved a little and the TAIL moved enormously,
and a ten-season career reached the W tour in no season at all. **A median-plus-tails report is
precisely what turns that from a surprise into a number.** Two of this wave's three corrections to
that mechanic were found by guards reading the tail.

---

## 3. What adopting it would actually cost

Honestly, and where it is unestablished it is marked as such.

| | cost |
| --- | --- |
| Rules 1–3 on a change that already runs a bench | **Nothing.** It is a reporting format, not extra work. |
| Rule 3, the correction/tuning label | **Nothing.** One word in the commit and the spec. |
| Rules 1–2 on a mechanic with no bench coverage | **This is the real cost**, and it is unestablished: nobody has counted how many shipped mechanics `tools/` cannot reach. `skipEvent` is one confirmed case, found by trying. |

⚠ **The honest risk of adopting it is that it becomes a ritual.** A rule that says "ship a
distribution" invites a distribution measured on the wrong arm, which reads far more convincing than
no distribution at all – and this repo has been burned by exactly that, twice in one hour on 17.08.
**If the rule is adopted it should carry the provenance check with it**: name the commit each arm was
built at, and confirm the reader is present in the A tree. Otherwise it buys confidence rather than
truth.

---

## 4. What is NOT being proposed

* **Not a gate.** No test, no CI check, no `npm run check` step. Chapter 04 is guidance about how to
  argue, and a mechanical check would only measure whether a file exists.
* **Not retroactive.** Nothing already shipped gets re-measured to satisfy it.
* **Not a bench for `skipEvent`.** That is a separate, small, buildable question – and worth asking
  only if you adopt rule 1, because otherwise it has no consumer.
* **Not a change to `ECONOMY`.** Chapter 04's advice to compress its historical essays before
  splitting it is a different subject and is not in this proposal.

---

## 5. The three answers this can get

1. **Adopted as a standing rule** → it goes into `docs/decisions.md` dated, and one line lands in
   `CLAUDE.md`'s invariant 4 beside "Tuning is measured, not guessed", which is the same rule already
   half-written. ⚠ `CLAUDE.md` is yours; nothing is written there without you.
2. **Rejected** → this file is marked `superseded` and the review's chapter 04 stops being quotable
   as pending. A rejection is a perfectly good outcome and closes the question properly.
3. **Adopted in part** – most likely rule 3 alone, the correction/tuning label, which costs one word
   and is the rule that did the actual work in TB-04.

Until one of those happens, waves keep doing what this wave did: measuring well, labelling by
instinct, and declaring the gaps in a commit message that nobody reads twice.
