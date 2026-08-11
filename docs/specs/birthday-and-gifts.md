---
type: spec
status: draft
area: content/birthday
canonical: false
last-reviewed: 2026-08-11
---

# The birthday, and what you give her

**Design proposal. Nothing built.** The owner, 11.08: «День рождения как-то незаметно проходит…
Важный момент, всё-таки» – round-16 item #9. His three rulings on the mechanic are in §2 and they
settle the shape.

## 0. The three rules that make it a gift and not a shop

**A gift gives no skill.** The moment a frame is worth +2 serve, the player stops choosing a present
and starts optimising a purchase, and the scene is dead. The effect is on the relationship and on
what gets remembered – never on the radar, never on condition.

**⭐ A GIFT COSTS NOTHING IN THE LEDGER.** The owner, 11.08: «про цену момент, давай не будем это
учитывать в нашем кошельке вообще.» No charge, no line in Money, no corridor pricing, **and no price
shown** – a displayed price that is never taken would be a lie on the screen.

⚠ **This is the ruling that saves the feature, and it is worth understanding why.** A priced
catalogue would have made the ask (§2ab) a wealth gate by arithmetic: the `working` family
disappoints her every year because it cannot reach what she wanted, the `wealthy` one never does,
and a scene about a parent silently becomes a scene about a balance. With no price, **the four
options differ only in WHAT THEY ARE**, so the choice is entirely "what do I think she wants" –
which is the only question this scene was ever about.

It also settles the catalogue: one list for every background, no `working`/`wealthy` variants, no
affordability test anywhere in the code.

**"Nothing" must be a real answer.** A day off together has to read as one of the good choices, or
the scene collapses into a menu with a correct order.

## 1. The catalogue, by age

Written as what is TRUE about her life at that age, not as a price ladder.

### 14 – she is still a child, and the gift should know it
A bicycle · a phone · **something not about tennis at all** – a book, paints, a game · her first
racquet bag that is hers · a poster of a player she admires.

⚠ **The trap here is deliberate and stays.** A parent who gives a fourteen-year-old nothing but
equipment is a character, and the game should let somebody be that character without ever nudging
them into it. The non-tennis option is always present and is never marked as the correct one.

### 15 – she has started travelling
Headphones for the road · a camera · her own suitcase · **tickets to WATCH a professional
tournament** – not to play in one. A very real thing in tennis families.

### 16 – the year it turns serious
Our own W series opens at 16 (`TIERS.w15.minAgeYears`), so this birthday is already a threshold in
the model. A frame chosen **with** her rather than for her · driving lessons · a document wallet,
because the travelling is now her job · a proper winter coat for the indoor season.

### 17 – the last full school year
A laptop – school and tournament admin both · a suitcase built to survive a season · a watch.

### 18 – school ends, the professional begins
**The biggest birthday in the game**, and the gift should mark the threshold. Her own bank card and
account, because she is earning now · the classic eighteenth watch · a trip that is not a tournament.

### 19 to 21 – independence
A deposit towards her own place · a car · something for a home that is no longer yours.

### 22 to 28 – the peak, where things matter less
A week with the family between seasons · jewellery · the thing she would never buy herself.

### 29 and after – the late career
**An album of the whole career** – and it is both the most moving option and the cheapest to build,
because the data is already there: the diary, the memories, `captureMilestone`'s first title and
first final per tier.

## 2. The mechanic – the owner's three rulings, 11.08

### 2a. The popup ALWAYS fires
> «я бы оставил попап на ДР всегда»

Unconditional on the birthday week. It follows the repo's existing blocking-dialog pattern (round 14
defect D1: the blocking popups are real dialogs and hold the keyboard), not a toast.

⚠ **AND THAT FORCES ONE CONSEQUENCE: "nothing" must be an explicit BUTTON, never a dismissal.** If
the dialog can be closed with an X, then closing it silently becomes the "gave nothing" branch and
the player will make that choice by accident, repeatedly, and never know. The options are the three
priced gifts plus **"just the day together"** – all four are choices, and the dialog does not close
any other way.

**Laid out in a COLUMN** (owner, 11.08: «в колонку ставь, там хватит места»), which settles the
375px question §5 used to ask: four stacked rows fit where four side-by-side buttons would not.

### 2ab. ⭐ SHE ASKS FOR SOMETHING, and one of the options is it

The owner, 11.08, turning §5's open question into the design: «отличный ход написать в этом попапе
что-то вроде "она просила …" и один из вариантов это удовлетворит, другие нет».

This is the piece that makes the scene a scene. The dialog opens with a line about what she has been
asking for; **exactly one of the four options answers it** and the others do not. And it costs
almost nothing, because the want is only DISPLAYED and RECORDED – nothing consumes it yet, so it
needs no morale system to exist (§2b).

⚠ **IT SPLITS THE OUTCOME INTO THREE WHERE THERE WERE TWO**, which is the whole gain for the future:

| what happened | recorded as |
|---|---|
| she got what she asked for | `asked` + `given` match |
| she got something else, and it was a real present | they differ |
| she got nothing | `given` is null |

"Gave the wrong thing" and "gave nothing" are not the same act and a parent knows it. One field
buys that distinction.

⚠ **The ask is drawn ACROSS the catalogue, and the day together must be reachable** – she does not
want a thing, she wants you, and that is the best case the scene has. (The price-correlation hazard
this rule used to guard against is gone: §0's no-cost ruling removed it at the root. Recorded here
because a future reader may wonder why the ask is unconstrained.)

**RNG:** the ask is drawn from a purpose-scoped sub-stream keyed on (seed, age) – never MAIN, and
never on anything the player has done, so it cannot re-roll the world and cannot be re-rolled by
reloading. Same discipline as `seed:injury:<week>`.

### 2b. A refusal counts, but the system that reads it is not built yet
> «я бы сказал влияет, но мораль и психологи у нас в будущем, так что сейчас можно просто подготовку
> сделать»

So this slice **records and does not consume**. The minimum that makes the future possible:

* persist one row per birthday – the week, the age she turned, **what she asked for**, and what was
  chosen (a gift id, the day together, or nothing);
* the **diary** reads it immediately, which is the whole visible payoff today – and it can call back
  in later years («the headphones you gave her still go everywhere»);
* nothing else reads it. No morale, no condition, no mood modifier. When
  `docs/specs/form-and-slump.md` and the psychologist arrive, the history is already there to read.

⚠ **Schema.** One append-only field, and it is a three-part move (bump + migration + golden fixture,
CLAUDE.md invariant 3). ⚠ **`docs/plans/wave-flags-grant.md` already claims v48**, so this is v49
unless the owner reorders – stated here so two waves cannot both take the same number.

### 2c. The gift never returns to equipment
> «я бы сказал нет»

A frame or a bag does NOT reset kit wear. The moment it does, the gift is useful, and a useful gift
is a purchase. `kitState` is untouched by this whole feature.

## 3. What is shown

* **The popup**, on the birthday week, with the four choices in a column.
* **Confetti on Home** for that week, the owner's own suggestion.
* **A diary entry**, and it is the thing that will still matter three seasons later.
* **⭐ HER BIRTH DATE ON THE BIO PAGE, beside her age.** Owner, 11.08: «на странице био девочки тоже
  можно день и месяц рождения добавить возле возраста. А то у нас нет этого нигде.» He is right and
  it is worse than an omission: `profile.birthDay` and `profile.birthMonth` have existed since v25,
  they drive the relative-age effect, `kidAgeExact`, the injury age curve and the birthday itself –
  and **the player is never told either of them.** A parent who does not know their daughter's
  birthday is the one fact the game must not withhold. Independent of the rest of this spec and
  cheap: two numbers already on the profile.

**Format: day and month, no week and no year.** Owner, 11.08: «а можно просто день и месяц без
недель? B-Day 12 june или вроде того». So `B-Day 12 June`, beside her age – not a career week, not a
birth year (the year is derivable from her age and would only add width).

⚠ **AND THAT FORMAT IS ALSO WHAT MAKES IT IMMUNE TO THE CALENDAR RE-ANCHOR (task #99).**
`birthdayWeek` is one of the two engine nodes that branch on a real date, so the WEEK her birthday
lands in can move when the drift fix ships. The day and the month cannot – they are her birth date,
stored on the profile since v25. Printing the date rather than the week is therefore both what he
asked for and the version that never needs revisiting.

## 4. The ship rule, authored before anything is built

1. **No skill, no condition, no mood moves.** Assert it: the same seed, run with every gift option
   and with none, produces byte-identical skills, condition and results. If any of those move, this
   became a shop.
2. **RNG.** The catalogue offered is a function of her age and the family's means, both of which are
   state. If any draw is wanted (which of three same-age options are offered), it goes on a
   purpose-scoped sub-stream, never MAIN – and it must not depend on what the player picked LAST
   year, or the choice re-rolls the world. CLAUDE.md invariant 2.
3. **The ledger does not move.** Assert it directly: the same seed run through every gift option
   ends the season on identical `fundsCents`. No `expense` event, no Money line, no corridor.
   ⚠ This is the assertion that keeps §0's ruling true after somebody later "just adds a small cost
   for realism".
4. **The catalogue is background-blind.** The four options offered at a given age are the same for
   `working`, `middle` and `wealthy`. If a background ever changes what is offered, the wealth gate
   has come back through a different door.
5. **The record survives a save round-trip**, and an old career migrated forward reads as "no
   birthdays recorded" rather than as "gave nothing every year". Absent is not zero – the same
   distinction v45 and v46 were built around.

## 5. Settled by the owner, 11.08 – all three of this section's questions

1. **Four buttons, in a column.** «в колонку ставь, там хватит места» – see §2a.
2. **The catalogue repeats.** «вполне можно» – the same present at 15 and at 16 is real parent
   behaviour and a content saving, **and the diary is expected to notice**. A callback on a repeat
   is content the system gets for free.
3. **She asks, and one option answers it.** Promoted out of "open" and into the design – §2ab.

4. **The ask is stated in PROSE and nothing is marked.** Owner, 11.08: «не помечай, пусть игрок
   читает». No highlight, no badge, no reordering that puts the answer first – the line says what
   she has been asking for and the four options say what they are. A marked answer would turn the
   scene into a quiz and collapse the choice.

## 6. Still open

1. **Can she ask for something not on the list?** A want the catalogue cannot satisfy is the
   sharpest version of the scene and the cruellest. Out of scope here; noted.
