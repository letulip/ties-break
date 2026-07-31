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

A `PaperNote` — but **a letter, not a scrap**, and the owner named the difference: «надо
модифицировать, чтобы была чистая и аккуратная бумага без скотча, это всё-таки письмо, а не
записка».

⚠ **And almost none of that is a modification, which is worth checking before anyone writes CSS.**
`tape`, `torn` and `marginRule` are all **opt-in props** that default to false, and the component's
base is already exactly a letter's stock: `--paper-card`, `--radius-paper`, `--shadow-paper`,
`--paper-ink`, Caveat. A plain `<PaperNote>` is a clean, untaped, un-torn sheet today. Nothing has to
be built to get there — it has to be *not asked for*.

What genuinely differs is **proportion and posture**, and there are exactly two:

1. **A letter is a page, not a corner scrap.** The base padding is `12px 14px`, sized for a line of
   handwriting tucked beside a photograph. Correspondence wants a margin — call it the `letter` size
   variant, and let it fill the column rather than sit in it.
2. ⚠ **A letter does not tilt, and it is the first paper object in this game that must not.** The
   handoff's principle 1 says paper is laid on the page «всегда с небольшим наклоном и тенью» — and
   that is right for an *artefact*: a memory, a receipt, a note dropped on a surface. A letter you
   are deciding on is a letter you are **holding**, square to the reader. The tilt is what makes
   everything else read as found rather than addressed to you. So `tilt` stays 0 here, deliberately,
   and that exception is worth a comment where the caller sets it — otherwise the next person will
   "fix" it back to the house angle.

`marginRule` stays off for the same class of reason: the red rule is a school exercise book, and a
sponsor does not write to you on one.

Under the letter, two controls: **Sign** and **Refuse** — and, quietly, how many weeks are left.

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

## 4b. THE STRATEGY THIS HAS TO SERVE — measured, and it changes §4.3

The owner, after the need curve: «мы видим, что в текущих реалиях, что у 8к, что у 25к всё хорошо.
Значит у нас есть рычаг… Давай нормальную стратегию строить, чтобы реально надо было выбирать.»

### The diagnosis: caution is free

12 seeds a cell, 14→16, `peakDeficit` = the lowest the balance ever reaches:

| preset · policy | trough | worst seed | survived | week to red |
|---|---|---|---|---|
| 8k · self-coached | $7,880 | $6,819 | 12/12 | – |
| 8k · budget coach · **grinder** | $3,481 | **−$3,191** | **10/12** | 81 |
| 8k · budget coach · player | $6,364 | $4,639 | 12/12 | – |
| 8k · middle coach · **grinder** | **$676** | **−$2,860** | **5/12** | **65** |
| 8k · middle coach · player | $4,179 | −$802 | 11/12 | 90 |
| 25k · self-coached | $25,000 | **±$0** | 12/12 | – |
| 25k · budget coach · player | $24,070 | $17,871 | 12/12 | – |

Two readings, and the second is the design problem.

**Danger exists, and it is in exactly one corner** — a working family reaching above its coach rung.
Same coach, two policies: 10/12 against 5/12. **The owner's own instinct is correct and the game
already rewards it**: he budgets, picks his tournaments, picks his vacations, and never enters the
corner where careers die.

⚠ **And that is the problem. Careful play costs nothing.** A 25k family that hires nobody sits at
$25,000 with a standard deviation of **zero** — it does not spend at all. There is no decision in
that, because one branch is simply better. A strategy game needs the safe road to have a price, and
right now it has none: what the player gives up by being careful is invisible, because the ceiling he
is declining was never made concrete.

### What the three instruments are FOR, restated

Not safety nets. **Each one is a way to buy a ceiling by giving up safety** — which is the decision
the game is currently missing:

- the **sponsor** buys money with an obligation to play (against a bench that says playing more
  loses);
- the **agent** buys access with a permanent tax;
- the **investor** buys a coach the family cannot afford with a share of a future that may not exist.

⚠ **This replaces §4.3's framing, which the measurement disproved.** I wrote that the investor
"sells time" — money now to bridge a hard patch, repaid later. **There is no hard patch.** The curve
is not a dip and a recovery; it is a countdown (week-to-red 65 and 81) or a flat line. So an investor
is not a bridge. He is **leverage**: he does not save a family, he lets one reach past its income.
Which is both truer to the sport and a better decision, because it has no safe answer.

### The ladder of instruments, by age

The owner's own sequencing, and it is right — each rung matches what a family that age can actually
be offered:

**14–15 · kit, not cash.** The local shop sees a strong first season and offers **equipment**, not
money. ⚠ Strategically this is a different object from a cheque and that is why it goes first: it
does not add income, it **removes a cost line** (`gear`, `stringing`). It buys no freedom — it makes
one specific path cheaper. This is also what junior deals really are: `02-tennis-economics.md`'s own
figure is "mostly product-only (racquets/strings/shoes, ~$1k+/yr value)", which is the shape the
existing `ECONOMY.sponsorship` already pays in cash for want of a mechanism.

**15–16 · the cash cameo, but earned.** Today `ECONOMY.sponsor` is a 6% weekly roll, paid only to a
`working` family — a need-based gift with no occasion. It should attach to **a reason**: a title, a
national final, a first win abroad. Same money, but "the shop backed her because she won something"
instead of "the shop backed her because you are poor". That converts luck into consequence, and it
removes the automatic parachute that is currently holding the 8k family up.

**17–18 · the agent.** Access for a percentage. Worthless before prize money exists, so it cannot
arrive earlier.

**17–19 · the investor**, and the owner has already written the pitch: «бери дорогого тренера и
будешь миллионером – мне 20% всех будущих призовых». Keep that voice. He is not offering rescue, he
is **offering a gamble** — and the letter should read like it.

### ⚠ The blocker the investor has, and it must be fixed first

**That pitch is currently a lie the game would punish.** The expensive coach is measurably a trap:
`25k · high coach` ends at **−$1,487 / −$6,192** with 2–11 careers in 30 surviving, and
`120k · elite · player` is **worse than high** (17/30 against 30/30, $9,041 against $123,896). Sell a
player 20% of her future to buy the elite rung today and the game takes her money and her career.

The likely cause is honest and fixable: **the coach ladder was tuned in a world with no prize money.**
An elite coach that reaches W100 can now pay for herself, and could not before. So before the
investor ships, the top two rungs need re-measuring against the adult tour — the same "measure, then
pick" order this project keeps.

**Sequencing consequence:** the investor comes AFTER the coach ladder is re-measured, not before. If
the elite rung is still a trap after that measurement, then the investor's money must buy something
else, and that is a design decision to take with the number in hand.

---

## 4c. THE INVESTOR IS THE ONE INSTRUMENT THAT LIES — and that is the design

The owner, on being told the pitch is a lie the game would punish:

> «и это хорошо! Надо эту идею развить, сыграть на жадности и кажущейся легкости пути, где гарантии
> не просто нет, а быть не может в принципе.»

⚠ **This reverses §4b's conclusion and it is the better reading.** I treated "the elite coach is
measurably a trap" as a blocker to be fixed before the investor could ship honestly. It is not a
blocker. **It is the trap he walks you into**, and building the instrument around it is more truthful
than tuning the trap away.

The reason it is truthful: this is what the money actually is. Nobody offering a tennis parent
$30,000 for a share of a fourteen-year-old is offering a fair price, because **a fair price cannot
exist** — the asset is a child who may or may not become someone, and the person selling you the
dream knows the base rates and you do not.

### The heart of it: he asks you to bet on a number the game has never shown you

This connects to machinery that already exists, and that is the strongest argument for it.

`potential` is **hidden by construction**. The radar shows a band, never a value — its own comment:
*"the two ceiling edges are a haze over a `potential` the screen never shows… you learn the range,
never the number."* Every other system in this game is honest about its costs up front. The radar is
honest about one thing only: **that it cannot tell you how good she is.**

**The investor is the fog with money on it.** He asks the parent to sell a share of his daughter's
future earnings against his own guess about a number the game has deliberately, permanently refused
to reveal. There is no guarantee not because we withheld one, but because — as the owner puts it —
**there cannot be one in principle.** That is the same sentence the radar has been saying since it
shipped; the investor is the first system that charges money for disagreeing with it.

### ⚠ THE ONE RULE THAT KEEPS IT A DECISION

**It has to sometimes work.**

A trap that always loses is not a decision, it is a punishment — and it fails in exactly the same way
"caution is free" fails, only mirrored: the correct play becomes "always refuse", and we are back to a
branch that is simply better. The gamble must be **bad, not hopeless**.

Three properties that keep it honest:

1. **The odds are genuinely poor and genuinely non-zero.** Rare enough that the story is usually the
   cautionary one; real enough that a player who hears "somebody's daughter actually made it" is
   hearing the truth.
2. **The player's OTHER choices move the odds.** Load management, which events she enters, when he
   takes the money — these already decide careers (10/12 against 5/12 on the same coach). The
   investor should amplify what the parent does, not replace it. Otherwise it is a coin flip wearing
   a decision's clothes.
3. ⚠ **The game never editorialises.** No warning beyond the standard confirm, no diary line that
   wags a finger, no "are you sure? this is usually a mistake". The whole point is that it looks
   easy. A game that tips its hand has taken the decision away and left the player with homework.

### The pitch: every number true, the implication false

The letter should be **factually honest and emotionally predatory**, which is exactly how this works
in life:

- *"20% of prize money until she is 22"* — a fact, and it will be honoured exactly.
- *"With the right coach she could be top 100"* — true of somebody, unknowable of her.
- *"You'll be a millionaire"* — the owner's own phrasing for the pitch, and the part that is a hope
  wearing a fact's clothes.

⚠ **Tone matters and should not be gleeful.** This game's subject is a parent gambling with a child's
future; the letters must be warm, plausible and likeable, because that is what makes them work. A
moustache-twirling villain teaches nothing — the man who ruins you is charming, believes his own
pitch, and sends a nice letter.

### The second letter

A family that took the money and is now bleeding **gets another offer, on worse terms**. That is how
it goes, and it is the cheapest possible way to make a spiral feel like one: the first letter is a
choice, the second is the first letter's consequence pretending to be a choice.

### What this changes about the coach ladder

§4b said the top rungs must be re-measured before the investor ships. **That is now optional rather
than blocking** — but it is still worth doing, for a different reason: we need to know whether elite
coaching is a trap *always* or only *for a family that cannot carry it*. Those are different games.
If the elite rung genuinely pays for a career that reaches W100, the investor's pitch is a bad bet
with a real prize at the end, which is property (1) above, satisfied by the economy rather than by a
dice roll. **Measure it to find out which instrument we are building — not to decide whether to
build it.**
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
