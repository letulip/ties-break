---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-08-20
---

# The private life – relationships, loss, and what a parent is allowed to know

The owner, round 24 item 3:

> «Когда будем добавлять отношения, разрывы, свадьбу, беременности, похороны? Всё это объединяет
> мораль и психолог до кучи. Очень большой слой, как мне кажется. Давай хотя бы в отдельный файл план
> и идеи сложим?»

⚠ **A PLAN, NOTHING BUILT.** And the first job of this file is to say why the layer is bigger than it
looks, because that is the part that decides whether it is ever worth starting.

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

---

## 5. The questions only the owner can answer

1. ⭐ **Whose decision is it – hers or his?** Round 23 #18 gave her a bank account at eighteen. The
   same fork is here and it is sharper: does the parent get a say in her private life, ever? A game
   where he can steer it is a different game from one where he can only react – and the second is
   truer to the premise.
2. **Can any of it be refused at the start?** A career sim that inserts a bereavement into somebody's
   evening without asking is a different product from one that does not. This is a settings question
   before it is a design one.
3. **Does the career survive motherhood in OUR model, or is it an ending?** The research says both
   happen in life. The game has to pick, or offer both.
4. **How much can `spirit` move a match?** If it is small, the layer is decoration. If it is large,
   the parent is watching a number he cannot touch decide his daughter's season. ⚠ Neither extreme is
   right and the middle needs a bench, not a taste.
