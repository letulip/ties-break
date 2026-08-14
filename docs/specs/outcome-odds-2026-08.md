---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-13
---

# What are her odds? A factorial, in probabilities (13.08.2026)

The owner: «я хочу понять какие у нас в текущем сетапе вообще вероятности у разных исходных данных
куда-то добраться … чтобы точно понимать какие у нас исходы в игре и что крутить, и надо ли что-то
крутить вообще.»

`npx vite-node tools/outcome-odds.ts -- --shard i/5 --seeds 12` then `-- --report <dir>`. 32 cells,
12 seeds each, 520 weeks, on the REBUILT bench policy (`the-wall-2026-08.md` §7 – the old one never
got anyone ranked, so this question was unanswerable before it).

⚠ **The talent bands are percentiles of the real draw, not adjectives:** `untalented` = p0-8 (233.4
summed starting points), `average` = p46-54, `talented` = p86-94 (258.4), `prodigy` = p98-100
(271.7). The world is transplanted away from the talent, for the reason §6a records.

## 1. Talent is the dominant factor, and the bottom of the draw has a hard ceiling

| band | top-100 | top-250 | ranked at all | median |
| --- | --- | --- | --- | --- |
| untalented | **0%** | 38% | 84% | #256 |
| average | 9% | 73% | 94% | #218 |
| talented | 17% | 94% | 100% | #164 |
| prodigy | **32%** | 95% | 100% | **#150** |

Monotone and steep. **A bottom-decile draw reached the top hundred in none of its eight cells** – not
with money, not with a coach, not in 96 careers. A `prodigy` does it a third of the time, and with a
coach two thirds of the time reaches the top FIFTY (`prodigy · coach · money` median #26; without
money, #25).

## 2. Money is now worth almost nothing; the coach roughly doubles the top-100 odds

| factor | top-100 | median |
| --- | --- | --- |
| wealthy (120k) | 16% | #194 |
| working (8k) | 14% | #197 |
| with a coach | 19% | #191 |
| self-coached | 10% | #198 |

**Two points and three places between 120k and 8k.** That is the repaired policy: it can now release
the coach, rebuild the cushion and travel, so a poor family is no longer locked out – which was the
whole of §6a's poverty trap. The coach's near-doubling of top-100 odds is the first clean evidence
in any measurement that paying one is worth it.

## 3. ⚠ THE AIM FACTOR IS MINE AND IT MEASURED THE WRONG THING

| arm | top-100 | median |
| --- | --- | --- |
| «does not know what to train» (the default) | **27%** | #168 |
| «knows» (a week of serve blocks) | **2%** | #219 |

I defined "knows what to train" as a week aimed entirely at serve and return, on the grounds that
`ladder-vs-targets` §5c measured those as the pair the match model prices first. It came out
**thirteen times worse**, and the reason is in `development.ts`'s own note: aim REDISTRIBUTES a
conserved rate. `general` feeds all five wings; a narrow block feeds two and starves stamina,
composure and groundstrokes, which the match needs.

So this arm measured **narrow specialisation against spreading evenly**, and its answer is worth
having on its own – **the default is strong and specialising is a trap.** But it is not an answer to
the question asked.

⚠ **And it is confounded twice over:** replacing `plan.week` also changed the session count (7
against the balanced preset's 5). That runs AGAINST the finding – the "knowing" arm trained MORE and
still lost – but it means the size of the effect is not clean.

**The honest arm is still unrun:** aim at her WEAKEST wing, which is what a player who reads the
radar would actually do. Cheap, and it is the one that answers «игрок знает что качать».

## 4. So what is there to tune?

* **Nothing on money.** The wealth ladder is nearly inert on outcomes now. Whether that is right is a
  design question – it makes the game fair and makes the three backgrounds cosmetic.
* **The coach is doing real work** and is the one lever with a clean, sizeable effect.
* **The bottom decile cannot reach the top hundred at all.** That is either the honest ceiling of a
  small talent or a wall worth softening – the owner's call, and the first number to put in front of
  him if he wants "anyone can make it" to be true.
