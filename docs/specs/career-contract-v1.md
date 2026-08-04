# The v1 career contract — DRAFT for the owner

One page that answers a single question: **what is a career in version one, and where does it
end?** Everything downstream depends on it — the endings wave implements against this page, the
epilogue shows what it promises, and the store description has to be able to quote it without
lying.

⚠ **THIS IS A DRAFT.** The architect wrote it from what is already decided and already measured;
every genuinely open decision is marked **OPEN** with the options and a recommendation. The owner
edits, strikes and answers, and the signed version becomes the entry criterion for W2-ENDINGS.

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

- **No dynasty.** The epilogue is a scroll, not a handover (ruling 3, 30.07). A second child, an
  inherited academy, a coach career — all post-v1.
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
| 2 | **College** | the player's decision at the fork | **OPEN — §5** |
| 3 | **Bankruptcy** | funds below zero and unable to fund the cheapest entry for N weeks | any age |
| 4 | **The career-ending injury** | severity above the band, or an accumulation rule | any age |
| 5 | **The natural end** | her decision, from 29, with a floor in the late thirties | 29+ |
| 6 | **"I cannot reach the top"** | her decision after a measured plateau | **OPEN — §5** |

⚠ **"Stop" must be able to be the right answer** (ruling 4, 30.07). A game about honest economics
in which "continue" is always correct lies exactly where it promised not to. If she is nineteen,
outside the real, and the family is at zero, the game has earned the right to say so — without
shame, and without calling it a loss.

---

## 5. The OPEN decisions — the owner's calls

**5.1 — Does COLLEGE ship in v1?** *(architect's recommendation: YES)*

Four years of student tennis on a scholarship: the family stops paying, she plays a lot in a closed
league that pays no ranking points, and she comes out at twenty-two with a degree, an unbroken body
and no ranking at all — back in through qualifying, or through a protected entry. It is the only
fork in the game where the money goes the other way, and it turns the binary at nineteen into a
real three-way choice. Cost: a branch in the endings wave plus a small engine slice (a four-year
freeze, the scholarship in the budget, the way back in). Precedent is real — Danielle Collins came
through college and won a major at thirty.

**5.2 — Does the PLATEAU ending ship in v1?** *(recommendation: yes, as flavour of the natural end
rather than a sixth mechanism)*

The owner's own words for it: «не могу выйти в топ – уйду». Cheapest honest form: the natural end
already asks her from 29; a plateau reading (no rung cleared in N seasons, rank flat) lets her ask
it earlier, and the epilogue says which of the two it was.

**5.3 — Where does the career FLOOR sit?** *(recommendation: 38)*

The natural end is her decision from 29 with a hard stop somewhere in the thirties. 38 is the
oldest plausible playing age in the research and leaves a decade of "one more year" decisions.

**5.4 — Is PREGNANCY in v1 or post-v1?** *(recommendation: POST-v1)*

The owner has raised it twice as a real mechanic (the comeback through a protected ranking). It is
a whole system — a partner, a relationship, a pause, a return — and it belongs with the "life off
court" layer, after psyche. Naming it here as post-v1 is what stops it quietly becoming v1 scope.

**5.5 — What does the EPILOGUE show?** *(recommendation: the ledger, not a score)*

Every durable milestone in the order it happened, the money spent and earned over the whole career,
the best rank held and the week it was held, and one closing line that names what she became. ⚠ NO
grade, NO score, NO stars. The evidence is the reward.

**5.6 — Is there a replay loop in v1?** *(recommendation: a new career, nothing carried over)*

Restart = a new seed, a new daughter, a new world. Nothing persists between careers — no unlocks,
no meta-currency. The replay is "what if I had spent it differently", which is the game's own
question asked again.

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

## 7. Signed

Owner: _______________  ·  date: _______________

Once signed, this page is the entry criterion for W2-ENDINGS and the source of truth for the
README's claims. A change to it after signing is a decision with a date, recorded in
docs/decisions.md like every other.
