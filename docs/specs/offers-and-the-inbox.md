# The inbox: sponsors, agents and investors — design note (31.07.2026, pre-code)

The owner, on the kit deal that already exists:

> «мне кажется я замечал, но кажется хотелось бы какой-то попапчик получить с письмом-предложением
> рукописным… И кнопка sign/refuse и наверное эту же идею можно и дальше развить будет и
> использовать. Кстати, для этого можно завести inbox на home возле колокольчика и давать человеку
> какое-то время на подумать, прежде чем подписывать (вдруг придет более интересное предложение)»

and, on the three entities: «мне кажется надо все три внедрять, они все крутые».

**Nothing here is implemented.** This is the design, written down before any code.

---

## 1. What already exists, because this is assembly rather than invention

Every ingredient ships today. That is the strongest argument for the shape below.

| ingredient | where | state |
|---|---|---|
| **the handwritten letter** | `src/components/ui/PaperNote.vue` | warm stock, tape, tilt, a hand-cut `clip-path` edge, Caveat inside. Five callers already. It IS the envelope. |
| **a decision with a deadline** | `SeasonEvent.deadlineWeek` | the entry list closes on a date; `enterEvent` throws past it, `skipEvent` refunds inside it. The pattern is proven and its edge cases are already argued. |
| **the bell on Home** | `HomeScreen.vue:606` `.diary-tool` | ⚠ and its dot rule is exactly right to copy: *"the bell's dot asserts one FACT and not the 'unread' it cannot know"* — it says the week put something in the feed. An inbox dot should assert "an offer is open", never "unread". |
| **money that arrives with a sentence** | `reviewLocalSponsor` (`world.ts:2910`) | `world.fundsCents += amount` plus an `income`/`sponsor` event. |
| **a durable per-career ledger** | `world.milestones`, `trophiesByTier` | the shape an offer list should follow. |

**And what is missing is exactly one thing: the decision.** Today the kit deal is an automatic
consequence of being inside the national top 30 — `localSponsorCents(rank)` returns a number, the
number is added, a line appears in the feed. The player is never asked. The owner is not asking for a
new economy; he is asking for the money to arrive **as an offer** instead of as weather.

---

## 2. The Inbox

One durable list on the world, surfaced on the Snapshot, rendered behind a second `.diary-tool`
beside the bell.

```ts
interface Offer {
  id: string
  kind: 'kit' | 'agent' | 'investor'
  /** the week it arrived, and the week it expires. Same contract as SeasonEvent.deadlineWeek:
   *  inside the window it can be signed or refused; past it, it is gone. */
  week: number
  deadlineWeek: number
  /** what the letter says, and what signing does – see §4. Terms are FIXED at arrival. */
  terms: OfferTerms
  state: 'open' | 'signed' | 'refused' | 'expired'
}
```

**⚠ The window is the feature, not a courtesy.** The owner: *«давать человеку какое-то время на
подумать… вдруг придет более интересное предложение»*. So the design has to make waiting a real
gamble in both directions:

- a better offer may arrive while this one is open — and it may not;
- **an offer left to expire is gone**, and the next one is not guaranteed to be as good;
- ⚠ **and terms never improve while you hold the letter.** An offer that quietly got better for
  waiting would make the deadline a formality and the decision free.

**Signing is irreversible.** This is the one place in the game where a player commits the future, and
the whole point is that he cannot see it. `ConfirmDialog` already exists and every destructive action
in More goes through it; an investor's signature deserves the same gate.

### The dot rule

Copy the bell's discipline exactly: the dot asserts **"an offer is open and its deadline has not
passed"**, which is a fact the engine holds. It must never mean "unread", which the engine cannot
know. When the last open offer is signed, refused or expires, the dot goes out on its own.

---

## 3. The letter

A `PaperNote` with `tape`, a `tilt` from the design's own angles, and `torn` with a direction. Under
it, two controls: **Sign** and **Refuse** — and, quietly, how many weeks are left.

Player copy rules apply in full: short dash "–", never "—", **no Cyrillic anywhere in a template**.

⚠ **The letter must state its terms in words the player can act on, not in flavour.** "We would love
to support your daughter" is the voice; "$2,000 a season, and she plays at least six events a year"
is the offer. Both belong on the paper, and the second one is what the button commits to. A letter
whose consequence is not on its face is a trap rather than a decision.

---

## 4. The three, and they are genuinely different instruments

They share one shape — an offer, a deadline, sign or refuse — and that is why one inbox and one
letter component serve all three. What makes them worth having is that they cost **different things**.

### 4.1 The kit sponsor — pays for visibility, costs obligation

This is the deal that already exists (`ECONOMY.sponsorship`: $1,000 a season inside the national top
30, $2,000 inside the top 10), and the change is that it arrives as a letter rather than as weather.

**What it should ask in return, and this is the interesting half:** a sponsor pays to be seen, so it
wants her **playing**. A minimum number of events a season is the natural obligation — and it lands
directly on the system the coach exists to manage.

> ⚠ **This is the design's best interaction and it should be protected: a sponsor pays the family to
> overplay her.** The coach's whole job is load management (`docs/specs/coach-as-load-manager.md`),
> the bench has now measured three times that resting beats racing — «игрок» reaches the target
> 25-29 careers in 30 against the grinder's 2-8 — and a sponsor cheque is a standing bribe to do the
> thing that loses. That is a real decision with a real trap in it, and it is true to the sport.

Failing the obligation should cost the deal, not the family's savings: the contract lapses at the
season boundary and is not renewed. Nothing is clawed back — a junior kit deal is not a loan.

### 4.2 The agent — sells access, costs a percentage

⚠ **An agent is worthless until there is money to take a cut of, so it belongs to the adult tour and
must not be offered before it.** Prize money landed with the W rungs (`prizeCentsFor`), and until she
plays them an agent is offering to take 15% of nothing.

**What he gives is doors, not cash**: entry to events her ranking does not yet open. Our engine
already has exactly the right hook for this — `enterPct`, the acceptance list, is the gate that says
no. An agent should move that gate for her, not her ranking. That keeps the ladder honest: **she is
not better, she is better represented.**

**What he takes is a percentage of prize money and of every contract, for as long as he is signed.**
The decision is whether access is worth a permanent tax, and it should be genuinely close: cheap
enough to be tempting at W15, expensive enough to hurt at W100.

### 4.3 The investor — sells time, costs the future

The one this game is actually about.

**Cash now, in exchange for a share of her prize money for N years.** A family that cannot afford the
travel to a W15 can take $30,000 at sixteen and pay 20% of everything back until she is twenty-two.
If she makes it, that was the most expensive money she ever took. If she does not, it was the only
money anyone was ever going to give her.

⚠ **And the rule that makes it bite: the terms should be worst exactly when the need is greatest.**
An investor offering a struggling family money asks for more of it, because that is what risk costs —
and it is what makes the offer arrive at precisely the wrong moment. The best terms come to the
family that does not need them.

This is the mechanic the adult career has been missing: **a decision with no correct answer, whose
price is only knowable ten years later.** Everything else in this game is honest about cost up front;
this one cannot be, and that is the point.

---

## 5. Rules the implementation may not break

- ⚠ **The frozen MAIN-stream capture (41550 draws / `e6b0c709`) must not move.** Whether an offer
  arrives is randomness, so it comes off a **purpose-scoped sub-stream** — `seed:offer:<week>` — read
  and thrown away, exactly as `seed:weather:` and `seed:crowd:` are. Never a draw on the weekly
  stream.
- **A schema step.** `Offer[]` is durable per-career state: a signed investor deal has to outlive
  every prune, so it belongs on `WorldState` with a migration, not in the event feed (which caps at
  400) and not in the Snapshot alone.
- ⚠ **A signed obligation must be visible after signing.** The Family Budget already has the room and
  the vocabulary — an agent's cut and an investor's share are *deductions from prize money* and
  belong beside the `prize` category, in their own `--cat-*` colour. A percentage the player cannot
  see being taken is the same class of dishonesty as a chart that invents years.
- **Nothing may be offered that cannot be honoured.** If an agent promises access, the acceptance
  gate must actually move; if a sponsor requires six events, the count must be the one the season
  really plays.

## 6. The order to build them in, and why

1. **The inbox and the letter, carrying the kit deal that already exists.** It is the smallest
   possible first step, it changes no economy at all, and it proves the whole shape — arrival,
   deadline, sign, refuse, expiry — against a number that is already balanced.
2. **The investor.** The strongest of the three, and independent of everything else: it needs only
   prize money, which shipped with the adult tour.
3. **The agent.** Last on purpose — it moves the acceptance gate, which is the same machinery the
   mixed-ladder defect lives in, and that should be fixed first.

⚠ **And a measurement before step 2, not after it.** The investor's whole design rests on «terms are
worst when need is greatest», and we do not yet know what a family's funds curve looks like across a
career now that prize money exists. The econ bench answers this and it works again; it should be
asked before any percentage is picked, the way `PUSH_TOLERANCE` was measured rather than guessed.
