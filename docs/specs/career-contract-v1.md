# The v1 career contract — the owner's answers, 05.08

One page that answers a single question: **what is a career in version one, and where does it
end?** Everything downstream depends on it — the endings wave implements against this page, the
epilogue shows what it promises, and the store description has to be able to quote it without
lying.

⚠ **FIVE OF THE SIX OPEN DECISIONS ARE ANSWERED** (owner, 05.08 — §5 records each verbatim). The
sixth, the epilogue's SHAPE, he accepted in principle and reopened in practice: «давай попробуем,
но надо понять как именно показать». That is the one thing still to design, and §5.5 says so.

The sixth answer also changed the game's shape more than its question suggested — see §5.6.

---

## 1. The promise, in one paragraph

*You are the parent. You raise one daughter from fourteen to the end of her playing life, and you
find out what it costs. The tennis is real — a Markov point engine you can watch, an honest ladder
from a local club draw to a Grand Slam, points and prize money taken from the real tables. The
economics are real too: break-even is around the world's 150th player, and most careers never
reach it. The game never tells you that you failed. It tells you what happened.*

That paragraph is the contract with the player. Every rule below exists to keep it true.

---

## 2. What v1 contains

**The full career, into the late thirties** (owner's ruling, 03.08: «мы уже где-то делали ресерч
до скольки играют, там до поздних 30 есть примеры – так и делаем»). Not a junior chapter, not a
demo of a bigger game.

- **The ladder is complete**: Local → Regional → National → J30 → J60 → J300 → W15 → W35 → W50 →
  W75 → W100 → WTA 125 → 250 → 500 → 1000 → Slam. Sixteen rungs, real points, real cheques.
- **The window slides**: three rungs live at once through the middle, widening to four at the top,
  and a rung she has passed closes rather than being hidden.
- **The season is a real year**: named majors on fixed weeks, ~20–25 events entered, blank weeks
  normal, fatigue that accumulates and an off-season that resets it.
- **The world lives**: 199 juniors on a conveyor plus ~364 derived professionals, a table whose
  points-to-rank curve matches the real WTA's.
- **The obligations are real at the top**: top-50 must play the majors or take penalty points, and
  every obligation arrives as a letter before it can bite.
- **One save, one daughter.** Multiple careers exist as save slots, not as a roster.

## 3. What v1 does NOT contain

Stated as plainly as §2, because a contract that only lists gifts is marketing.

- **No dynasty in the mechanical sense** — no inherited academy, no carried ranking, no
  meta-currency, no unlocks (ruling 3, 30.07). ⚠ REFINED 05.08 by §5.6: the epilogue DOES offer a
  next career at one tap, and if a child was born during this one she is the next daughter. That is
  a lineage in the fiction, not progress in the save.
- **No doubles, no mixed, no team events.** The engine models singles.
- **No real names.** Every player, tournament and brand is fictional by construction.
- **No multiplayer, no online anything.** The game is offline-first and stays that way.
- **No second tour.** The men's tour is data-shaped but not shipped.

---

## 4. How a career ends — the supported endings

An ending is not a game-over screen. It is the week the story stops having a next week, and every
one of them lands on the same epilogue surface built from `world.milestones`.

| # | ending | trigger | reachable when |
| --- | --- | --- | --- |
| 1 | **She stops at nineteen** | the player's decision at the fork | always |
| 2 | **College** | the player's decision at the fork | ✅ v1 (§5.1) |
| 3 | **Bankruptcy** | funds below zero and unable to fund the cheapest entry for N weeks | any age |
| 4 | **The career-ending injury** | severity above the band, or an accumulation rule | any age |
| 5 | **The natural end** | her decision, from 29; the game stops asking at 38 | 29+ (§5.3) |
| 6 | **"I cannot reach the top"** | her decision after a measured plateau | ✅ v1, as a reading of #5 (§5.2) |

⚠ **"Stop" must be able to be the right answer** (ruling 4, 30.07). A game about honest economics
in which "continue" is always correct lies exactly where it promised not to. If she is nineteen,
outside the real, and the family is at zero, the game has earned the right to say so — without
shame, and without calling it a loss.

---

## 5. The decisions — answered 05.08

**5.1 — COLLEGE SHIPS IN v1.** ✅ «согласен»

Four years of student tennis on a scholarship: the family stops paying, she plays a lot in a closed
league that pays no ranking points, and she comes out at twenty-two with a degree, an unbroken body
and no ranking at all — back in through qualifying, or through a protected entry. It is the only
fork in the game where the money goes the other way, and it turns the binary at nineteen into a
real three-way choice. Cost: a branch in the endings wave plus a small engine slice (a four-year
freeze, the scholarship in the budget, the way back in). Precedent is real — Danielle Collins came
through college and won a major at thirty.

**5.2 — THE PLATEAU ENDING SHIPS, in the cheap form.** ✅ «согласен»

The owner's own words for it: «не могу выйти в топ – уйду». Cheapest honest form: the natural end
already asks her from 29; a plateau reading (no rung cleared in N seasons, rank flat) lets her ask
it earlier, and the epilogue says which of the two it was.

**5.3 — THE FLOOR IS 38, AND IT IS AN ENDING.** ✅ «в смысле концовка? если да, то вполне, у нас же
есть живые данные, всё под них»

He asked the right clarifying question, so the answer is written plainly: 38 is not a rule that
retires her, it is the age at which the game **stops asking**. From 29 the natural end is offered
each off-season and she may always say no; at 38 the last offer is made and taken. So the decade
from 29 is a decade of "one more year" decisions, and the floor is the week the question runs out
rather than a mechanic that ends her career for her.

⚠ AND IT IS ANCHORED, NOT PICKED: the age curve, the retirement research and the conveyor's own
hard stop are all already in the repo, and 38 sits at the top of what they support.

**5.4 — PREGNANCY IS POST-v1.** ✅ «согласен» — but see §5.6: his replay answer gives it a v1 seam
it did not have.

The owner has raised it twice as a real mechanic (the comeback through a protected ranking). It is
a whole system — a partner, a relationship, a pause, a return — and it belongs with the "life off
court" layer, after psyche. Naming it here as post-v1 is what stops it quietly becoming v1 scope.

**5.5 — THE LEDGER, NOT A SCORE — AGREED IN PRINCIPLE, THE SHAPE IS STILL OPEN.** ⚠ «давай
попробуем, но надо понять как именно показать»

Settled: no grade, no score, no stars. The evidence is the reward.

STILL TO DESIGN, and it is a real problem rather than a formatting question. A fifteen-season
career leaves hundreds of milestones; printing them is a database dump, and a database dump is not
an ending. The material that exists: `world.milestones` (durable, never pruned), the finance
ledger, the rank history, the trophy cabinet. Three candidate shapes, to be worked out with the
owner before W2-ENDINGS builds it:

  a. **The scroll** — every milestone in order, one line each, paged by season. Complete, honest,
     and long. Risk: the reader stops before the end of her own story.
  b. **The five numbers** — money in, money out, best rank, titles, matches — then the milestones
     underneath for whoever wants them. Risk: five numbers ARE a score, whatever we call them.
  c. **The seven weeks** — the career told through the handful of weeks that turned it, chosen by
     the engine (first title, first pro cheque, the injury, the best week, the last one), each
     with what it cost and what it changed. Risk: the engine picking "what mattered" is the game
     doing the judging §6 promises it will not do.

⚠ The architect leans to (c) with the choosing rule made VISIBLE — the player can see why a week
was chosen — and (a) reachable underneath it. But this is the owner's page.

**5.6 — A NEW CAREER, ONE QUESTION ASKED — AND THE OWNER'S ANSWER MOVED THE GAME.** ✅ «можно
сделать в конце какой-то выбор с авто-созданием нового рандомного персонажа, спросим только вилку
начального капитала и все. Т.е. если ребенка родила за игру - то вполне может попробовать
продолжить. Почему нет?»

Settled: nothing mechanical carries over. No unlocks, no meta-currency, no inherited skills — the
replay is still "what if I had spent it differently". What changes is the SEAM: the epilogue ends
with an offer rather than a credits roll, the next daughter is generated automatically, and the
player is asked exactly ONE question — the starting-capital fork he already answers at onboarding.
One tap from an ending to a beginning.

⚠⚠ AND THE SECOND SENTENCE IS THE BIG ONE. «Если ребенка родила за игру - то вполне может
попробовать продолжить» — if a child was born during the career, THAT child is the next daughter.
Which means:

  * §3's "no dynasty" is now precise rather than absolute: no inherited academy, no carried
    ranking, no meta-progress — but a LINEAGE, one generation deep, when the fiction earned one.
  * It gives pregnancy a v1 SEAM even though the system itself is post-v1 (§5.4). The v1 build
    must not close the door: the epilogue's hand-off needs to be able to read "was there a child"
    even while the answer is always no.
  * The generated daughter is otherwise random, so the mother's career buys narrative, not
    advantage — which is the same line the equipment ladder and the coach ladder already hold.

⚠ ONE THING TO DECIDE WHEN IT IS BUILT: whether the second career starts from the mother's final
family money or from a fresh capital fork. The architect recommends the FRESH FORK — carrying her
balance is exactly the meta-currency this section rules out, and a family that ended rich would
start the next daughter's story with its central tension already resolved.

---

## 6. What the player is promised on the box

Four lines, each of which must be defensible against the shipped build:

1. **One daughter, fourteen to the end.** A full playing life, not a season.
2. **Watch every match, or none of them.** The tennis is simulated point by point and you may look
   at as much or as little of it as you like.
3. **The money is real and it is brutal.** Break-even is the world's top 150. Most careers never
   see it.
4. **The game never grades you.** It tells you what happened and leaves the judging to you.

---

## 7. What the answers changed, for the wave that builds this

W2-ENDINGS now implements SIX endings, not four, and two of them are new work rather than new copy:

- **College** (§5.1) needs a four-year freeze, the scholarship on the budget, and a way back in at
  twenty-two through qualifying or a protected entry. It is the only ending that RESUMES.
- **The plateau** (§5.2) needs a reading, not a mechanism: no rung cleared in N seasons and a flat
  rank lets the natural end ask early. N is a bench number.
- **The floor at 38** (§5.3) is one constant and one sentence of copy — the game stops asking.
- **The epilogue** (§5.5) is BLOCKED on the owner and me choosing its shape. It is the one thing
  here that cannot be specced by an agent, because the choice is what the ending MEANS.
- **The hand-off** (§5.6) is a screen and a seam: one tap to a new career, one question asked, and
  a `wasThereAChild` hook that always answers no in v1 and must not be closed off.

Nothing here changes the schema beyond what the endings wave already needed.

---

## 8. Signed

Owner: _______________  ·  date: _______________

Once signed, this page is the entry criterion for W2-ENDINGS and the source of truth for the
README's claims. A change to it after signing is a decision with a date, recorded in
docs/decisions.md like every other.
