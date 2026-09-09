---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# Wave 2 – the reaction surface: the builder's runbook

Build order for the layer's second wave. Design authority:
[the-private-life-build](the-private-life-build.md) §3 (re-based 09.09) and
[who-she-is-2026-09](../specs/who-she-is-2026-09.md) (§5b for every spoken word;
§4a for the bar this wave inherits). The voice law is
[voice-bibles-2026-09](../specs/voice-bibles-2026-09.md) – every line she speaks obeys its two
shape rules, now pinned in `tests/week-notes.test.ts`. This file sequences; it does not design.

**Scope in one sentence:** the game learns to STOP a week for a life beat – a new `'life'`
StopReason, the `lifeLog` record-as-queue, an engine-assembled dialog where every button is an
answer – and proves the machinery on its first beat: her stated want at the college fork, heard
before the parent may answer the fork, with `spirit` and `bond` colouring what she wants and his
reaction landing on `bond` twice (the words, then the deed).

## 0. Preconditions

1. Branch from FRESH main after the wave-1 merge: `git checkout main && git pull origin main &&
   git checkout -b life/wave-2`. This runbook is the branch's first commit.
2. `SAVE_SCHEMA_VERSION` reads **72** – this wave takes the NEXT number (v73 below; re-count at
   land, never quote).
3. ⚠ Debt check from the wave-1 review: `docs/decisions.md` must carry the voice-bibles pass and
   the first-person ruling as a dated entry. If the merge landed without it, writing that entry
   is THIS branch's second commit – the rule is «his approval is a ruling, logged the same day».
4. **Open ask to carry, non-blocking:** the wave-1 bench found played-hurt −4 fires 8.1–8.8×
   per career in BOTH arms – the biggest bond lever in the game, untouched by policy. His word
   (keep as honest life, or narrow the trigger) is wanted BEFORE this wave's deltas stack on
   top; ask early, build meanwhile.
5. **Two agents are allowed in this wave – under protocol.** The engine half and the Vue half
   split ONLY after the protocol wire lands as its own commit. In one shared checkout:
   pathspec commits ONLY (`git commit -m … -- <files>`), no gating while both work, no
   `git checkout <sha> -- src` ever. Gates run once, after both finish, one at a time.

## 1. The wire first (one commit, unblocks the split)

In `src/shared/protocol/events.ts`: add `'life'` to the `StopReason` union (with its doc
comment: BLOCKS) and to `STOP_PRECEDENCE` (:605) – **after `'birthday'`, before `'fork'`** (the
ruled collision contract, build plan §3). In `src/shared/protocol/messages.ts`: the
`answerLifeBeat` command and the prompt wire (the pending beat rides the Snapshot the way
`pendingBirthday` does – engine-assembled copy, option ids, never raw state). In
`src/shared/protocol/narrative.ts` (or the protocol home that fits): the `LifeBeatRecord` type.
Commit the wire alone; both agents build against it.

## 2. Engine – `src/engine/world/lifeBeat.ts` (the generalised birthday)

The birthday is the precedent; what generalises lands here ONCE (build plan §3's table):

1. **The BLOCK contract**: the `'life'` guard at the top of `advanceWeeks`, and collected
   inside the loop – a beat can share a week with a tournament (already the covered case).
2. **The record IS the queue**: `world.lifeLog` rows with `answer: null` are pending; several
   beats in one week answer one dialog at a time in lifeLog order; no second boolean to desync.
3. **Engine-side re-validation**: a stale dialog cannot record an unoffered option id.
4. **The no-cents rule**: an answer is NEVER a purchase – `addEvent` without `amountCents`, no
   price in any words.
5. **`buildLifeBeatPrompt`**: copy assembled engine-side from the approved pools – the UI
   renders what it is handed, verbatim.
6. **`guardNotEndedForGood`** semantics per the plan; the fork-opinion beat itself fires at the
   fork's opening tick, outside any college latch question.

## 3. The proving beat – her opinion at the fork

1. **Trigger**: the tick that opens the college fork also writes a `'fork-opinion'` row.
2. **Her want** (`college` / `tour` / `stop`) drawn on `seed:life:fork:<seasonIndex>`, weighted
   by her ladder standing **and by `spirit` and `bond`** (ruled 09.09: a worn-down girl leans
   `stop`, a close one dares more). ⚠ THE FENCE HOLDS: temperament NEVER enters the want's
   weighting – it colours only the wording of how she says it (who-she-is §3).
3. **The order is mechanical, not UI**: the `'life'` guard sits ABOVE the fork guard in
   `advanceWeeks`, and `answerFork` REFUSES while her row is unanswered – he hears her out
   first, enforced by the engine (invariant 1).
4. **His reaction** – responses, never her choices: back her want / press the other way /
   listen and say nothing. `bond` **+2 / −2 / 0**.
5. **The second delta lands where the DEED does**: `answerFork` matching her recorded want
   **+3**, contradicting it **−4**. Two deltas, separate on purpose – a parent can disagree out
   loud and then do as she asked.
6. ⚠ No `spirit` movement from any of this – his words move `bond` only (§4a.2's law); her
   want-draw reads spirit, it never writes it.

## 4. The schema move (v73, the three-part law)

`world.lifeLog: LifeBeatRecord[]` – `{ week, kind: 'fork-opinion' (a union that grows per
step), detail, answer: string | null }`, append-only, never pruned. Bump 72 → 73; append-only
migration back-fills `[]`; golden fixture `tests/fixtures/saves/v73.json` through the real
migration on `v72.json`; `npm run e2e:fixtures` re-run; frozen careers re-frozen by the wave-1
pattern – the `PRE_V73` peel-the-new-key identity, and the null-arm proven both ways.

## 5. The dialog – `src/components/LifeBeatDialog.vue`

1. **Every button is an answer, there is no X** – walking away must not silently become an
   answer; the week stays stopped until he speaks (the birthday's own law).
2. **Selecting controls are real radios** – round 40's conventions: `role="radio"` in a
   `role="radiogroup"`, the accent-token ball dot, availability derived every render.
3. **Copy verbatim from the approved pools**; her lines obey the bibles' two shape rules (the
   pins extend to the beat pools – §6.4).
4. **The round-20 popup law**: a mounted 375×667 assertion that the LAST control's box is on
   screen – proven by mutation (a too-tall variant must fail it).
5. App.vue mounts it beside BirthdayDialog/ForkDialog; the store facade stays thin RPC.

## 6. Tests – and this time every net's mutation is RECORDED

The wave-1 review's finding: mutation-verification happened silently. This wave writes each arm
down (commit body or test comment – the masseur's «eight arms, eight catches» is the format):

1. **The revert-the-reaction equality gate** (the wave's own «done when»): same seed, answer A
   vs answer B – `bond` differs by exactly the table, deterministically; an equality test, no
   SEM.
2. **Precedence pin**: `'life'` sits after `'birthday'`, before `'fork'` in `STOP_PRECEDENCE`,
   and a week holding both a birthday and a beat surfaces the birthday first.
3. **The refusal pin**: `answerFork` refuses while the row is unanswered, with its own sentence;
   answering the beat unlocks it.
4. **The queue pin**: two pending rows resolve one at a time, in lifeLog order, none lost.
5. **Voice pins extend to the beat pools**: kind × temperament × register completeness (flat
   pool only at strained/cold), the one-quoted-span rule, the narration-contains-`she` rule.
6. **Input-independence arm**: a career that answers every beat and one that is never advanced
   past the stop draw IDENTICAL MAIN sequences; the fork-want draw is byte-stable across both.
7. **The 375×667 mounted pin**, mutation-proven; the radio-conventions mounted assertions.
8. The capture pin re-run – this wave adds ZERO draws on any stream (the want is sub-stream
   keyed; answers are arithmetic).

## 7. The bench duty – bar 3 lives here now

⚠⚠ **Bar 3 (bond gap ≥ 12 at season 3) was RE-AIMED to this wave by his ruling** («перевесить
обе планки на волны, где приходят события»). The duty, in the standing order: write the
PREDICTED gap first – honestly: the fork-opinion beat fires ONCE per career, so the new decision
mass is one ±2 reaction plus one +3/−4 congruence delta; off wave-1's measured 4.84 the
arithmetic ceiling is roughly 7–10, and **the bar may fail again**. Then run
(`npm run bench:spirit`, the beat-answering arms added: care backs her want and matches at the
fork; grind presses and contradicts), record measured-vs-predicted in who-she-is §4a, and if it
fails – **a finding for the owner, never a tune**: the honest choices are a further re-aim to
waves 3–4 (where met/ended beats multiply the decision mass) or his retune of the flat 0.5/week
regression. The constants are his; the bench only prices the roads.

## 8. Gates, docs, PR

1. `npm run check` → file; `npm run test:sim` → file; `npm run test:e2e` + **the wave's own new
   case** (the beat stops the week, the dialog answers, the fork unlocks – on a fixture near
   its fork); the parity run 375/768/900/1280; `pins:check`, `context:audit`, `doc:facts`.
2. **Docs owed in the same PR**: who-she-is §4a extended with bar 3's predicted-vs-measured;
   the decisions entry for any mid-wave ruling THE SAME DAY (the wave-1 lesson); the unpause
   bookkeeping – round-24 #6, R2-16 and college-the-remainder #7 were «paused until steps 1–2
   exist» and this wave delivers step 2: close each row with WHERE, or re-state what still
   waits; one line in voice-bibles-2026-09.md updating «the pin does not exist yet» (it landed
   in wave 1 – the sentence is stale by its own success).
3. New strings this wave (her want lines per voice/register, his three option labels, the feed
   row, every dialog word) go to the owner as drafts BEFORE wiring – the same stop the bibles
   honoured.
4. Assemble via the `pull-request` skill; the unfinished block names bar 3's verdict wherever
   it lands.

## The fence – what wave 2 must NOT do

* No arrivals, no endings, no attachment, no episodes – waves 3–4 own the slot.
* No walls/leanings, no drift – step 5's schema owns them.
* No spirit deltas from anything in this wave – words move `bond` only.
* No new emotion/Mood rules – the shock-vs-title collision is wave 4's, and wave 2 ships no
  shocks.
* Temperament stays OUT of the want's weighting – wording only.
* No wording beyond the owner-approved drafts – not one adjacent «fix» (invariant 4).
* The dialog never exposes a number – no bond meter grows a first pixel here.
* Stop-after-any-step stands: this wave alone must leave the game strictly better – a player
  who never reaches the fork must lose nothing and see nothing half-built.
