# Equipment that matters, and a serve speed that is her age — design (31.07.2026)

Two findings from the same conversation, and they solve each other.

---

## 1. The serve speed is a fourteen-year-old serving like an adult

`src/engine/match/matchStats.ts`, the whole model in one line:

> base **128 km/h** + serve skill × **0.45**, jitter **±8**, second serve **−14**

| serve skill | reported |
|---|---|
| 30 (weak) | 141 ± 8 |
| 50 | 150 ± 8 |
| 70 | **160 ± 8**, i.e. up to **167** |

**There is no age term at all.** A fourteen-year-old and a nineteen-year-old with the same `serve`
attribute serve identically, and the base is a floor: **nobody in this game has ever served slower
than about 120 km/h.**

The owner, playing: «мои "пушки" показывают иной раз 160+ км/ч на подаче».

**Reality, and it is the corridor he approved:** a fourteen-year-old girl's first serve is **120–140
km/h**, a strong one about 150. WTA professionals average roughly 155–165. So we handed every child a
good adult's serve and then added her skill on top.

### The fix, and the owner's own targets

Base scales with age instead of being a constant — about **95 at 14 rising to ~120 at 19** — with the
skill coefficient raised so talent shows more than the floor does. His two checkpoints:

- **14 years, skill 40 → ~117 km/h**
- **19 years, skill 75 → ~161 km/h**

⚠ **And the corridor is a prologue hook, not just a number.** The owner: «мы можем в прологе до него
"дорасти"». A six-year-old who cannot yet reach 90 and a fourteen-year-old at 120 is the same curve
seen from further back — so the age term should be a function, not a table of two rows, and
`docs/specs/childhood-prologue.md` inherits it for free.

### ⚠ THE PART THAT DECIDES WHETHER ANY OF THIS IS WORTH DOING

The owner, twice: **«лишь бы он на что-то влиял вообще»**.

And today it does not. The file's own header says so: *"Serve speeds are a deterministic cosmetic
layer."* The number is decoration.

**The answer is NOT to feed the speed back into the match.** Serve skill already decides points
through `basePServe`; adding the km/h on top would count the same thing twice.

The answer is that **the number must be an honest readout of something real that MOVES**. It already
derives from `serve`. Give it an age term and it becomes her age's number. Let equipment modify the
attributes (§2) and the readout moves when her strings are dead — for a reason the player caused and
can fix. That is the difference between a decoration and an instrument, and it costs no double
counting.

---

## 2. Equipment: three lines that are already billed and do nothing

`ECONOMY.gear` already charges for three things, on a cadence and at a price that **already differ by
background**:

| line | working | wealthy |
|---|---|---|
| racket | $60–120 every **14–18** wk | $480–650 every **10–12** wk |
| **stringing** | $18–30 every **4** wk | $45–70 every **2** wk |
| shoes | $60–90 every 10–14 wk | $170–240 every 10–14 wk |

**So the game already says she plays with a worse racket and restrings half as often. It just never
lets that matter.** This is not new machinery — it is a consequence for a cost we already take.

### It is CONDITION, not vintage — the owner's own correction

> «я вот в падел играю и знаю, что чиненая ракетка работает хуже, чем пусть и старая, но целая»

That is a better model than "tiers of kit", and cheaper: each line carries a **condition** that decays
with use and is restored by the purchase **already on the ledger**. An old sound frame is fine; a
patched one is not. Nothing new is bought — the existing spend simply becomes the thing that keeps
her equipment honest.

### What each line does, and it is small on purpose

The owner: **«Нам нужно совсем немного реализма, % там, половина там, и уже интересно.»**

- **Strings — the biggest and truest lever, and it is CONTROL rather than power.** In real tennis the
  gap between a fresh bed and a dead one is far larger than the gap between a good frame and a great
  one. Freshness decays weekly and resets on the restring we already bill; it should read into
  consistency and return rather than into serve speed, where its real effect is a couple of km/h.
- **Frame — integrity, a small constant.** A sound frame is neutral; a broken-and-patched one is a
  penalty until replaced.
- **Shoes — traction, and it is TWO effects, not one.** The owner: «в плохих коньках ребята не могут
  угнаться за другими в хороших, просто физика так работает.» Worn shoes cost movement *and* raise
  injury risk, and both are true — the second lands on a system we already have.

### ⚠ THE HARD CONSTRAINT: equipment must never make background destiny

This is the one that can wreck the game, so it is a rule and not a preference.

The wealthy family already buys better gear more often — that is in the table above. If the effect is
sized generously, **money buys strokes**, and the whole argument of this project ("a timing or effort
effect must never become a talent effect") is inverted at the last minute by a shopping line.

So: the total swing across all three lines, worst kit to best, must stay **small enough to be
overturned by playing well** — smaller than the coach ladder's own spread, and far smaller than
talent. A player in worn kit who manages her load must still beat a rich one who grinds. **Measure
it: a bench arm with best-kit and worst-kit against identical everything else, and the gap reported
as a number before any coefficient is kept.**

---

## 3. What this unlocks for the offers (`offers-and-the-inbox.md`)

Equipment with an effect is what makes a **kit deal** an actual instrument rather than a rebate. Until
now the shop's contract could only be worth money; once condition matters, top gear for free is worth
something a cheque is not — and the owner's triangle becomes real:

- **cash** (investor) — freedom, spend it how you like, but you must spend it right;
- **kind** (the shop) — best equipment, free, but it obliges her to play and be seen, and it does not
  buy a single plane ticket;
- **representation** (agent) — doors, for a percentage.

⚠ **And one correction to that document, measured:** I wrote there that upgrading the coach at 8k
does not pay (25/30 reach on budget against 19/30 on middle). That reading was too strong. The
bench's `player` arm holds a FIXED policy — a reserve floor, a rest floor — and **never reallocates
between coaching and travel**. So the honest sentence is "the upgrade does not pay *for free*". A
parent who buys the coach and cuts three trips is a policy the bench has never run, and the owner is
right that this is a lever rather than a verdict: «хочешь, трать на тренера, хочешь – на поездки».

**Package sizing, measured:** the budget → middle step costs about **$15,500** over four seasons
($23,531 against $39,043 of coaching at 8k). The owner's instinct of a $10–20k investment lands
exactly on it. ⚠ But an investment that buys *only* the coach starves the travel that earns the
points — so the package has to be sized against **coach plus the season of travel that uses him**, or
the player buys half a thing and loses honestly for the wrong reason.
