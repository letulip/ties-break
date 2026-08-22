---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-08-22
---

# The private life – relationships, loss, and what a parent is allowed to know

The owner, round 24 item 3:

> «Когда будем добавлять отношения, разрывы, свадьбу, беременности, похороны? Всё это объединяет
> мораль и психолог до кучи. Очень большой слой, как мне кажется. Давай хотя бы в отдельный файл план
> и идеи сложим?»

⚠ **A PLAN, NOTHING OF THE LAYER BUILT.** And the first job of this file is to say why the layer is
bigger than it looks, because that is the part that decides whether it is ever worth starting.

⚠ **22.08:** the owner paused the fork-opinion surface («где-то её мнение увидеть… да, пока на
паузе») until this layer's steps 1–2 exist – the exact sequencing §6 argues for. And round 24 built
two things this layer will inherit; see the last two rows of §1's table.

---

## 0. ⚠⚠ THE THING THAT MAKES THIS DIFFERENT FROM EVERY OTHER SLICE

Every mechanic in this game so far is something **the parent decides**: which coach, which tournament,
whether to travel, whether to rest. The player IS the parent, and the daughter is the thing being
raised.

**A private life is the first system where the parent does not decide, and cannot.** Who she falls in
love with is not a menu. That is not a limitation to design around – ⭐ **it is the entire point, and
it is the strongest dramatic material the game has available**, because it is the moment the premise
turns over: you have been running a career, and a person walks out of it.

So the design question is never "what does the player choose here". It is:

1. **What does he find out, and when?** – she may not tell him. A parent learning about a boyfriend
   from a photograph is a scene; a parent getting a menu is not.
2. **What can he do about it?** – almost nothing, and the little he can do (say the right thing, or
   the wrong one) is the whole gameplay.
3. **What does it cost or give her?** – this is where it touches the engine, and it must be small
   enough to stay honest and large enough to matter.

⚠ **IF THE ANSWER TO 1 AND 2 IS SKIPPED, THE LAYER BECOMES A SLOT MACHINE**: an event fires, a number
moves, the player watches. That is the failure mode, and it is the reason to be slow here.

---

## 1. What the engine already has that this would use

Named so nobody rebuilds it:

| exists | where | what this layer would do with it |
| --- | --- | --- |
| `world.events` + milestones | `world/age.ts`, `fireMilestone` | every beat is already a feed row with a `keep` flag |
| the ending album | `EndingScreen`, `buildEndingView` | a life has to be summarised at the end; the album already does that |
| `condition` and the injury path | `condition.ts`, `body.ts` | the ONLY existing channel that could carry "she is not herself this month" |
| the fork machinery | `world/college.ts`, `answerFork` | a life decision that stops the career and asks – the exact shape needed |
| `coachRoomNote`'s fog | `coachMarket.ts` | the house rule for saying something true without a number |
| the psychologist | ⚠ NOT BUILT – `docs/plans/the-travelling-team-2026-08.md` | see §4 |
| the birthday dialog + `world.birthdays` | `world/birthday.ts`, round 24 | ⭐ a beat the parent ANSWERS inside a paused week – the exact «reaction surface» shape step 2 needs, already built and walked; the gift is free by the owner's ruling, so a reaction is never a purchase |
| the college pause machinery | `resumeFromCollege` stops, `pendingYearStart` | a life beat can stop a running year and wait on the live shell – built for the birthday, reusable for any beat that must be answered |

⚠ **THERE IS NO MORALE STAT, AND THAT IS THE FIRST DECISION.** The owner's item names «мораль» as if
it exists. It does not. `composure` is a SKILL – a permanent attribute that grows toward a ceiling –
and it is the wrong home: a bad month is not a lost skill.

---

## 2. ⭐ The spine: one state, not five systems

The temptation is a relationship system, a marriage system, a pregnancy system, a bereavement system.
That is four codebases and four sets of edge cases.

**The cheaper and truer spine is one number and one relationship.**

* **A weekly `spirit`** (name it later), moving slowly, bounded, and READ by the match engine the way
  `condition` is – but never a skill, so it cannot be trained and cannot be permanently lost.
* **A single `attachment` slot** – nobody, someone, or the aftermath of someone. Marriage is that slot
  reaching a state; a break-up is it emptying; grief is a different loss aimed at the same number.

Then the five things the owner listed are not five systems. They are **five events that write to two
places**, plus their own copy. That is the difference between a layer that ships and one that does
not.

---

## 3. The beats, in the order they can be built

Each is independently shippable. ⚠ Each also needs its own save-schema move.

### 3a. Someone exists (the smallest whole thing)
She meets someone. The parent finds out through the feed, possibly late. `spirit` lifts a little and
stays lifted. Nothing else changes. **This alone tests whether the layer is wanted**, and it is one
state field and a handful of lines.

### 3b. It ends
The slot empties. `spirit` drops hard and recovers over weeks, not instantly. ⚠ The recovery curve is
the whole mechanic – a fortnight of a professional playing below herself is a real cost, and it is the
first time the game has a cost the parent cannot buy his way out of.

### 3c. Marriage
The slot latches. ⭐ **And this is where the game changes shape, because a spouse is a second adult
with an opinion** – about the travel, about the schedule, about the money that is now half hers.
Round 23 #18 already put her prize share in her own account from eighteen; a marriage is the first
time somebody else has a claim on the career the player has been running.

### 3d. Pregnancy
⚠⚠ **THE ONLY BEAT HERE THAT STOPS THE CAREER**, and the research is already in the repo:
`docs/research/life-events-motherhood.md`. It is a fork of the college kind – months out, a return
that is not guaranteed, and a ranking that decays while she is away (the protected-ranking rule is
real and modellable). **Do not build this before 3a-3c.** It is the payoff, not the entry point.

### 3e. A death in the family
⚠ **DIFFERENT FROM ALL OF THE ABOVE AND MUST NOT SHARE THEIR MACHINERY.** It is not her relationship;
it is the family's. It can hit the PARENT as well as her, it has no counterpart to negotiate with, and
its recovery is not symmetrical with a break-up's.

⭐ **And it is the one beat that can touch the player directly rather than through her** – which, in a
game where the player is a parent, is the most powerful thing on this list and the easiest to get
wrong. If it is ever built, it should be built last, carefully, and with the option to turn it off.

---

## 4. Where the psychologist finally earns his salary

`docs/plans/the-travelling-team-2026-08.md` records the owner's ruling – the masseur travels, the
psychologist works remotely – and the standing task from him: «специалисты не были декоративными, а
реально несли какую-то пользу и это было видно и заметно».

⭐ **THIS LAYER IS THE ANSWER TO THAT.** A psychologist whose effect lands inside `condition` is
invisible – exactly the academy that paid $20,879 of fares without the owner noticing it existed
(round 23 #16). A psychologist who **shortens the recovery in 3b** is legible without a single number:
the player sees her come back sooner than last time, and knows why.

⚠ Which means the ORDER matters: the psychologist should probably not ship before 3a/3b exist, or he
has nothing to be good at.

⭐ **RULED 22.08:** he now officially ships HERE, as step 5 – the owner moved him out of
`the-travelling-team-2026-08.md`'s step 1, for this section's own reason. His salary, his
remote-only shape and his open travel question arrive with him.

---

## 4a. ⭐⭐ ANSWERED BY THE OWNER – and it supplies the mechanic the layer was missing

I asked whether the parent gets a say at all. His answer (20.08):

> «конечно имеет, и мы это обсуждали, но решения всё равно будут за девочкой, а в зависимости от
> выборов родителя будет мораль развиваться. Отношения можно укрепить или разрушить и так далее.»

⭐ **THIS IS THE WHOLE DESIGN, AND IT RESOLVES §0's PROBLEM.** I had framed it as a binary – either
he steers her life or he only watches. It is neither. **She decides; he responds; the response is
what moves the number.** So the player's input is real and constant without ever being a menu of her
choices, which is the thing that would have broken the premise.

Three consequences, and they are what the beats in §3 should be built to:

1. **Every beat needs a REACTION, not a decision.** The scene is not "does she marry him" – it is what
   the parent says when told. The existing dialog machinery already does exactly this shape.
2. **`spirit` becomes two things, and they must not be confused.** ⚠ There is what LIFE did to her (a
   break-up, a loss) and what the PARENT did about it. The first is weather; the second is the
   relationship between them, and it accumulates. A single number cannot carry both honestly – the
   second is «отношения можно укрепить или разрушить», and it is the one with a memory.
3. **A wrong reaction has to be able to cost something**, or the choice is decoration. ⚠ And it must
   be recoverable, or one bad click at fifteen ruins a ten-season career, which is not a game.

⚠ **AND THE FIRST SCENE HAS A HOME WAITING (22.08):** D2 splits the college fork into ask (when
school ends) – hold – depart (September). A decision taken in the spring and acted on in the autumn
is exactly where her opinion has room to matter, and the gap now exists in the engine. When step 2's
reaction surface lands, the fork gap is its readiest beat.

⚠ **AND THE STAT DOES NOT EXIST YET**, which he confirms: «сейчас этого показателя нет вообще, мы как
раз делаем так, чтобы он появился». So this layer is not "add events to an existing system" – it is
where the system itself gets built, and everything in §3 depends on §2's spine landing first.

## 5. The questions only the owner can answer

*(Question 1 – does the parent get a say at all – was answered and now lives as §4a above; the rest
are renumbered.)*

1. **Can any of it be refused at the start?** A career sim that inserts a bereavement into somebody's
   evening without asking is a different product from one that does not. This is a settings question
   before it is a design one.
2. **Does the career survive motherhood in OUR model, or is it an ending?** The research says both
   happen in life. The game has to pick, or offer both.
3. **How much can `spirit` move a match?** If it is small, the layer is decoration. If it is large,
   the parent is watching a number he cannot touch decide his daughter's season. ⚠ Neither extreme is
   right and the middle needs a bench, not a taste.

---

## 6. Steps

Each is its own wave, its own schema move, and its own gate. ⚠ The order is not a preference: every
step reads the one above it.

| # | step | what it is done when |
| --- | --- | --- |
| **1** | **the two numbers** – `spirit` (weather) and the parent's standing (memory). No events yet. | a bench career shows both moving and neither drifting to an extreme |
| **2** | **one reaction surface** – a beat fires, the parent answers, standing moves. Use the existing dialog. | reverting the reaction changes the number, measured |
| **3** | **3a someone exists** – the smallest whole beat, feed-first, possibly late | he can be told about a boyfriend by the feed and it reads as a scene |
| **4** | **3b it ends** – the recovery curve, which is the first cost he cannot buy off | a fortnight of below-herself tennis is visible in results, not just in a stat |
| **5** | **the psychologist** – shortens step 4's curve, and is legible because of it | the player sees her back sooner and knows why, with no number quoted |
| **6** | **3c marriage** – a second adult with a claim on the career | the spouse can disagree with a schedule the player chose |
| **7** | **3d pregnancy** – the fork that stops the career | a protected-ranking return exists and is not automatic |
| **8** | **3e a death in the family** – last, carefully, with an off switch | ⚠ see §3e; this one can reach the player, not only her |

⚠ **STOP AFTER ANY STEP.** Each is shippable alone, and steps 1-4 are a complete feature on their
own. Nothing below step 5 is required for the layer to be worth having.
