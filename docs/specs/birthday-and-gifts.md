---
type: spec
status: current
area: content/birthday
canonical: true
last-reviewed: 2026-08-25
---

# The birthday, and what you give her

## Current truth

**SHIPPED at schema v48.** The owner, 11.08: «День рождения как-то незаметно проходит… Важный момент,
всё-таки» – round-16 item #9. His three rulings on the mechanic are in §2 and they settle the shape;
nothing in this document was redesigned on the way in.

**Where it lives.** `src/engine/world/birthday.ts` is the whole mechanic – the catalogue, the ask, the
record and the one command. `src/components/BirthdayDialog.vue` prints what the engine hands it.
`tests/birthday-gifts.test.ts` is §4's ship rule, one block per clause;
`tests/component/birthday-dialog.test.ts` is the mounted card, and each of its blocks names the
mutation that was applied to prove it fails.

**What ships:** the popup fires on her birthday week and blocks the advance until one of four column
buttons is pressed; she asks for one thing in prose and exactly one option answers it, unmarked; no
money moves and no price is shown; one row per birthday is persisted and the diary reads it; her
birth date is on the bio page as `B-Day 12 June`; confetti falls on Home for the week.

⚠ **THE SCHEMA NUMBER IS 48, NOT THE 49 §2b PREDICTED**, and §2b has been corrected in place. The
prediction assumed `wave/flags-grant` would take 48; that wave was still documents and nothing had
claimed 48 in code, so this took it and `docs/plans/wave-flags-grant.md` now reserves 49. The rule is
"whoever lands in code first owns the number", and it is written into both documents so the next
reader does not have to reconstruct which wave won.

⚠ **AND IT SHIPPED ON TOP OF A FIX TO THE NUMBER IT PRINTS.** §3's popup names the age she turns, and
`birthdayTurning` was announcing it a year low for every girl born on the 1st–6th of a month – on the
owner's own save, «15» twice and never «19». Round-16 #100, fixed first and separately
(`docs/specs/season-anchor.md` §7): a popup built on a wrong number would have shipped the wrong
number four times a career, in a dialog nobody can dismiss.

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

⚠ **THREE OF THESE WERE WRITTEN AS CATEGORIES AND SHIPPED AS CATEGORIES, AND §8 IS WHY THAT WAS A
BUG.** "Something not about tennis", "something for a home that is no longer yours" and "the thing she
would never buy herself" are how a designer describes a slot; they are not how a parent describes a
present. Each is now the concrete thing the slot was always standing in for, and the sentence that
used to be the description is where it belongs – in the ask, or in the note.

### 14 – she is still a child, and the gift should know it
A bicycle · a phone · **something not about tennis at all** – *paints and a pad*, since round-18 #10a
· her first racquet bag that is hers · a poster of a player she admires.

⚠ **The trap here is deliberate and stays.** A parent who gives a fourteen-year-old nothing but
equipment is a character, and the game should let somebody be that character without ever nudging
them into it. The non-tennis option is always present and is never marked as the correct one.

⭐ **And since 16.08 this is the birthday the professional tour opens on** – W15's floor is 14, the
sport's own – which sharpens the trap rather than moving it: the year the game first lets her be a
professional is the year the copy insists she is still a child. Nothing in the catalogue changes.

### 15 – she has started travelling
Headphones for the road · a camera · her own suitcase · **tickets to WATCH a professional
tournament** – not to play in one. A very real thing in tennis families.

### 16 – the year it turns serious
~~Our own W series opens at 16 (`TIERS.w15.minAgeYears`), so this birthday is already a threshold in
the model.~~ ⚠ **CORRECTED 16.08 – the W series opens at 14, not 16**, since the owner's ruling that
the tour's age floors are the sport's own. The sentence is kept because it is why this age was
written as *"the year it turns serious"*, and the framing survives on a different number: sixteen is
where the entry allowance goes from ten professional events to **twelve**, so it is the first
birthday that buys her more tour rather than a door. **Grid, stated once and not restated here:**
[`docs/specs/college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).
A frame chosen **with** her rather than for her · driving lessons · a document wallet,
because the travelling is now her job · a proper winter coat for the indoor season.

### 17 – the last full school year
A laptop – school and tournament admin both · a suitcase built to survive a season · a watch.

### 18 – school ends, the professional begins
**The biggest birthday in the game**, and the gift should mark the threshold. Her own bank card and
account, because she is earning now · the classic eighteenth watch · a trip that is not a tournament.

### 19 to 21 – independence
A deposit towards her own place · a car · something for a home that is no longer yours – *a kitchen
table for her flat*, since round-18 #10a · **lessons in the language she keeps apologising for** ·
**a storage unit for the boxes still in our garage** – the last two added by round-26 #9b, see §10.

### 22 to 28 – the peak, where things matter less
A week with the family between seasons · jewellery · the thing she would never buy herself – *the
painting from the gallery window*, since round-18 #10a. The concept survives in the note ("she has
the money for it, she has had it for years, and she will not"); what changed is that the button now
names an object, so a line about her can point at it. ⚠ **And since round-26 #4 that note is
LICENSED** – it is the row's `means: 'plenty'` claim and it is swapped for a family that has not got
the money (§9). **· a dog, and we keep it while she is away · the court at her first club,
resurfaced** – added by round-26 #9b.

⚠ **The peak band is declared once and the late band uses it** (`PEAK_GIFTS` in
`world/birthday.ts`). It was two hand-kept copies of the same objects until this round asked both to
grow.

### 29 and after – the late career
**An album of the whole career** – and it is both the most moving option and the cheapest to build,
because the data is already there: the diary, the memories, `captureMilestone`'s first title and
first final per tier. The album is offered ALONGSIDE the peak band's five (§5.2's licensed repeat),
so the band holds six.

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
CLAUDE.md invariant 3). ~~⚠ `docs/plans/wave-flags-grant.md` already claims v48, so this is v49 unless
the owner reorders – stated here so two waves cannot both take the same number.~~

> **✅ SHIPPED AT v48**, and the reservation above was resolved the other way. `wave/flags-grant` was
> still documents when this was built and nothing had claimed 48 in code, so this took 48 and that
> plan now reserves 49. The field is `WorldState.birthdays: BirthdayRecord[]`; the migration is a pure
> default (`[]`) and the golden fixture is `tests/fixtures/saves/v48.json`.
>
> ⚠ **`[]` MEANS "no birthdays recorded", NOT "gave nothing every year"** – ship rule 5, and the
> migration comment spells out the temptation it refuses. A v47 career HAD birthdays: the feed said
> «She is sixteen this week» every year and `birthdayWeek` can name every one of them exactly. Walking
> the calendar and writing a row per year with `given: null` would have been easy, and the statement
> it made would be that this parent gave his daughter nothing on every birthday of her life. He was
> never asked.
>
> **AND ONE MORE PLACE IS ABSENT RATHER THAN ZERO, decided in the build:** the four years at college.
> `resumeFromCollege` spends them in ONE call with nobody able to answer, so a blocking birthday there
> would strand the jump – the identical reason `rollKnock` is skipped inside the freeze. Her birthday
> still reaches the FEED those years; what the engine does not do is invent a parent's decision out of
> a freeze, so those birthdays carry no row.

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

   ⚠ **NARROWED, ROUND-17 #18, AND THE CLAUSE AFTER THE COMMA IS WHY.** The hazard this rule names is
   "*or the choice re-rolls the world*" – input-independence – and that is what stays absolute. What
   was too wide is the sentence before it. On the owner's own save the ask ignored the record the
   feature was already writing: `age 19: asked day, given car`, then `age 20: asked car`. He had
   bought her a car twelve months earlier and she asked him for a car.
   **So the ask now reads `birthdays[]` – but only to REMOVE a present she already has.** The key is
   still `seed:birthday:<age>` and nothing else, the stream is drawn exactly as many times as before,
   the four options are byte-identical (§5.2's licensed repeat is intact), and MAIN is not reached.
   The record is immutable and this birthday's own row does not exist yet when the draw happens, so
   reloading cannot move it – which is the whole of what "never re-rollable" was protecting.
   The day together is never spent: it is not a possession, and she may want one every year.
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

   ⚠ **AND SINCE ROUND-18 #10c THE POPUP NOTICES TOO.** The diary noticing after the fact was never
   the whole job: the player was choosing a second car from a row that read exactly like the first
   one. The OFFER is still byte-identical – see §8c for why that is load-bearing – but a row for
   something already on the record prints different words. §8c has the durable/repeatable table.
3. **She asks, and one option answers it.** Promoted out of "open" and into the design – §2ab.

4. **The ask is stated in PROSE and nothing is marked.** Owner, 11.08: «не помечай, пусть игрок
   читает». No highlight, no badge, no reordering that puts the answer first – the line says what
   she has been asking for and the four options say what they are. A marked answer would turn the
   scene into a quiz and collapse the choice.

## 6. Still open

1. **Can she ask for something not on the list?** A want the catalogue cannot satisfy is the
   sharpest version of the scene and the cruellest. Out of scope here; noted.

## 7. What the build settled that this document did not ask

Three questions the spec did not reach, each answered the way its own rulings pointed:

1. **How the "exactly one option answers it" guarantee is bought.** The ask is drawn from the FOUR
   OFFERED rather than from the catalogue and then matched – so the property is true by construction
   rather than by a test, and `day` being one of the four is what makes it reachable as the ask.
   Sub-stream `seed:birthday:<age>`: keyed on immutable state only, so it cannot be re-rolled by
   reloading and last year's choice cannot move this year's want.
2. **⭐ The ask id is NOT ON THE WIRE.** «не помечай, пусть игрок читает» could have been kept as a
   promise the component makes; instead the client is never told which option answers, and
   `chooseGift` re-derives it engine-side. No future component can mark it even by accident. The only
   correspondence between the ask and an option is the English, which is the scene.
3. **Where four options come from at 29+.** §1 names only the album for the late career, and §2a
   requires four. The peak band's three come with it – §5.2's licensed repeat rather than invented
   content – so the album is chosen alongside things she has been given before, which is the callback
   the diary was built to notice.

**Measured, not asserted:** the same seed through all four options ends the season on identical
`fundsCents`, identical `careerTotals` and the identical count of Money lines; identical skills,
condition and `kitState`; and a birthday week taps no MAIN draw a quiet week does not.

## 8. Round-18 #10 – the reading game, repaired

The owner, 13.08, playing his own save: «странные сообщения в днях рождения с очень явными странными
же ответами. Что-то вроде "чего бы она себе никогда не купила" и ответ в таком же духе. А еще был
вариант запроса "день вместе", а в ответах была неделя вместе. Т.е. когда будем мораль делать может
быть надо будет учитывать оба. И в предыдущем раунде я уже спрашивал про обратную память ответов,
чтобы мы новую машину не раз в год покупали (хотя почему и нет, с другой стороны, но если так, то
надо как-то обыграть)».

⚠ **THE YARDSTICK IS §2ab, NOT TASTE.** She asks for ONE thing, exactly one option answers it, the
others do not, and nothing marks which. §7.1 already made "exactly one option answers it" true by
construction – the ask is drawn from the four offered. What round 18 found is that being true in the
ENGINE bought nothing if it was not also true in the ENGLISH: an ask nobody can attach to a row, or
one that two rows answer, leaves the player with four buttons and a coin. `tests/birthday-ask.test.ts`
is the whole of §8 asserted on the whole catalogue, one rule per block, every block
mutation-verified.

### 8a. The ask was the answer, rephrased – six pairs, and what each one now says

Found by sweeping every ask against every option it can appear beside, not by reading the three he
quoted. Two rules did all the work: **a row names a THING** (rule 1) and **an ask shares a word with
its own row that no other row of that band shares** (rule 2).

| band | id | shipped | now | which rule |
| --- | --- | --- | --- | --- |
| 22-28, 29+ | `neverbuy` | "The thing she would never buy herself" ← ask "the one thing she has the money for and will not buy" | "The painting from the gallery window" ← ask "She sent us a photograph of a gallery window at midnight, and then said it was ridiculous." | 1 (and 2) |
| 22-28, 29+ | `jewellery` | ask "something with nothing to do with tennis. Anything." – which the week at home answers just as well | ask "the box on her shelf, and how everything in it that shines, she won" | 2 |
| 29+ | `album` | ask "whether anybody kept any of it. The whole thing, from the start." – its only shared word was "whole", which the DAY row also carries | ask names the album, the photographs and the draw sheets | 2 |
| 0-14 | `notennis` | "Something that is not tennis" ← ask "something with no tennis in it" – and the bicycle's own note reads "nothing to do with any of this" | "Paints, and a pad for them" ← ask about paints and a pad | 1 (and 2) |
| 19-21 | `home` | "Something for a home that is not ours", beside "A deposit towards her own place" – both answer "a place of her own" | "A kitchen table for her flat" ← ask about the table she eats off | 1 (and 2) |
| 19-21 | `deposit` | ask "a place of her own. Not asking for it. Asking about it." – one shared word, "place", straight off its own label | ask "sending us listings … nobody has said the word deposit out loud yet" | 2 |

⚠ **THE TRAP AT FOURTEEN IS UNTOUCHED.** §1's non-tennis option is still always in the pool and still
never marked – it is a pot of paints now instead of a category, which makes it easier to choose and
no more correct.

### 8b. The ask and the answer disagreed on scale

«был вариант запроса "день вместе", а в ответах была неделя вместе». Three options are the same want
at three sizes – **the day** (every band), **a week at home** (22-28, 29+), **a trip** (18) – and in
three of the seven bands two of them are on screen together. When they are, the unit is the only
thing between them, and a unit buried mid-sentence is not a discriminator anybody reads.

Each of the three asks now names its own unit **and rules the others out in so many words** ("One
day, she said – not a week, not a trip"), in both directions, and no other ask in the catalogue is
allowed to drop `day` / `week` / `trip` in as a red herring – the bicycle's "Every single week" is
gone for that reason. Rule 3.

⚠ **AND THIS IS WHERE MORALE WILL READ.** «когда будем мораль делать может быть надо будет учитывать
оба» – a day and a week must not be worth the same. They are three separate ids in
`BirthdayRecord.given` precisely so a future weighting can price them apart with no schema change,
and that is only still possible because nobody collapsed them into one "time together" option. The
seam is the `TIME_TOGETHER` table in `engine/world/birthday.ts`, which carries that note; when
`docs/specs/form-and-slump.md` and the psychologist arrive, that table is the ladder and the record
is already the history to weigh against it. Keeping them distinct now is preparation, not pedantry.

### 8c. A repeat is played, not silent

Round-17 #18 taught the ASK to read the record – but **only to remove** a present she already has,
and it left the OFFER byte-identical on purpose (§5.2). So a parent could still be shown "A car" at
nineteen, twenty and twenty-one with the identical four rows, and buy three. He raised it a second
time and answered himself: «хотя почему и нет, с другой стороны, но если так, то надо как-то
обыграть». So a repeat is **allowed** and the game says it out loud.

**Durable vs repeatable**, and the line is whether a second one can arrive without anybody noticing:

* **`repeatable` – she may want it every year of her life.** `day`, `familyweek`, `trip`, `tickets`,
  `notennis`, `jewellery`. A day, a week at home, a trip, a different tournament, another pot of
  paints, another piece for the box: none of these is a possession, or the point of it is that it is
  a new one. The second offer reads as a tradition – "We had one of these last time".
* **`durable` – it is in the house and a second one is a decision.** `bicycle`, `phone`, `kitbag`,
  `poster`, `headphones`, `camera`, `suitcase`, `frame`, `driving`, `wallet`, `coat`, `laptop`,
  `watch`, `bankcard`, `deposit`, `car`, `home`, `album`, `neverbuy`. The second offer says she has
  one – "There is a car outside from us already. This one would be the second."

⚠ **THE COPY CHANGES; THE OFFER DOES NOT.** Filtering an already-given gift out of the four was the
other candidate and it is wrong twice over: **four bands hold exactly three material gifts**, so
removing one ships a three-row dialog against §2a, and filtering before the shuffle would change how
many times the sub-stream is drawn. Swapping a note costs no `rng()` call, so the ids, the order and
the draw count are exactly what they were and a long-record career sees the same four rows as a fresh
one.

⚠ **AND IT DOES NOT MARK THE ANSWER.** «не помечай, пусть игрок читает» is about the ANSWER, and the
ask never names a present she already holds (round-17 #18) – so a row that says "she has one" is
removing a decoy the player himself created, not pointing at the one that is right. The note is
REPLACED rather than appended, so a repeated row is not taller than the others either: a row that
grew would be a mark by accident.

### 8d. Determinism, checked rather than assumed

Every band keeps exactly the gifts it had and every id is unchanged (they are persisted in
`BirthdayRecord`; a renamed id would orphan `giftNoun` for every save already written). No `rng()`
call was added or removed. The sub-stream `seed:birthday:<age>` is drawn exactly `gifts.length + 3`
times – `(n-1)` for the band shuffle, three for the four, one for the ask – and the test replays that
count against an independent generator on the same key, so an extra draw anywhere diverges. MAIN is
not reached at all: `tests/condition.test.ts` is green on 41550 draws / hash `e6b0c709`, unchanged.


## 9. Round-26 #4 – a wish may not assume a wallet the family has not got

**His line, 24.08**, reading `tennis-sim_alice-cfbv_w502.tsave` – Alice, 20, Year 2 of 4 on a
scholarship:

> «Очень странное пожелание на день рождения **She was looking fares home at two in the morning** для
> студентки с кошельком 500к+ с предложением подарить велосипед.»

**$584,375 in the family wallet and $59,220 in her own account.** The line is a good one for a family
that cannot face the fare and a false one for his – the same defect class as R2-18's «Her own keys»,
which asserted a residence the model had not got, one axis along.

### 9a. The predicate, and where its numbers come from

`src/engine/world/means.ts`. One named function, the shape R2-18 gave the life stage
(`familyHomeVoice` / `collegeVoice`) rather than a wealth test re-derived per surface:

| band | the wallet | read from |
| --- | --- | --- |
| `tight` | at or below **$8,000** | `ECONOMY.startingFundsCents.working` |
| `comfortable` | between them | – |
| `moneyed` | at or above **$120,000** | `ECONOMY.startingFundsCents.wealthy` |

⚠ **Neither number is chosen.** The three opening war chests are the only BALANCES the design ever
named – everything else in `ECONOMY` is a weekly flow or a per-bill factor – and the whole economy
was tuned against them. `tight` is therefore "poorer than the game's own poorest family is on the day
it starts", not "poor by a figure somebody liked".

⚠ **The fare is the SANITY CHECK, not the source.** The dearest journey the domestic ladder prices is
`TIERS.national.travelCostCents` at $400-900. At the `tight` ceiling a $900 fare is **11.3%** of
everything the family has; at the `moneyed` floor **0.75%**; on his save **0.14%**. A threshold tuned
against a fare would need re-tuning every time a tier's travel band moved.

⚠ **The wallet is both purses** – `world.fundsCents + world.kidFundsCents`. v54 keeps them apart in
the ledger and nothing here merges them; the question "is money scarce in this household" is asked of
the money the household has, and his own report quoted both numbers in one breath.

### 9b. Licence by FACT, not by a blacklist of words

A row DECLARES what its words rest on – `BirthdayGift.means` is `'hardship' | 'plenty'` – and carries
`unlicensed`, the same sentences for when the claim does not hold. Nothing scans copy for "fare" or
"afford": the next hardship noun would walk straight past that, exactly as "the hall mirror" walked
past the week-note blacklist. Three of the 33 rows make a claim:

| row | claim | the swap |
| --- | --- | --- |
| `flighthome` | hardship | the ask loses the fares and keeps the distance |
| `books` | hardship | the ask loses the prices and keeps the reading |
| `neverbuy` | plenty | the note loses "she has the money" and keeps the years |

⚠ **The asymmetry is deliberate.** Hardship needs the family to be actually `tight`; plenty is
refused only when money is plainly scarce, because a mid-career family with $60,000 does have the
money for a painting and stripping the line would be a second false sentence in place of the first.

⚠ **THE OFFER NEVER SEES THE WALLET, AND CANNOT.** `birthdayOffer` takes (seed, age, alreadyGiven,
atCollege) and no means; §0's ruling – ONE list for every background, no affordability test anywhere
– is untouched, and the means reaches only `buildBirthdayPrompt` and `birthdayOptions`. What moves is
a sentence: the identical discipline §8c's `again` is written under.

### 9c. And the gift beside the wish was NOT a defect

He read "a bicycle" as the child's. It is `campusbike` – *"A bicycle for getting about there"*,
fifteen minutes between buildings – the COLLEGE band's own row, and correct for a girl of twenty in a
hall of residence. Verified on a walked career rather than asserted: R2-18's band really is being
picked, and the child's `bicycle` is unreachable at her residence at any age.

## 10. Round-26 #9b – the offer walks the band instead of sampling it

**His line, 24.08:** «Just a day together на день рождения случается подозрительно часто. Сколько у
нас вариантов подарков? Неужели мы не можем нагенерить так, чтобы они если и повторялись, то не так
часто?»

**Measured first** (`tools/birthday-pool.ts`, 12 walked careers, 201 tour birthdays and 48 college
birthdays). His impression was right and understated. The day was never the problem – it is on every
dialog by his own 11.08 ruling – **the whole dialog repeated**:

| | before | after |
| --- | --- | --- |
| consecutive birthdays with the IDENTICAL four rows (tour) | **100/189 = 53%** | **0/189 = 0%** |
| longest run of identical dialogs in one career | **8** | **1** |
| consecutive identical at college | **8/36 = 22%** | **0/36 = 0%** |
| distinct gift ids in the catalogue | 29 | **33** |

**The cause was arithmetic, not luck.** `shuffled(band.gifts).slice(0, 3)` samples WITH REPLACEMENT,
and four bands held exactly three material gifts – C(3,3) = 1, so there was only ever one dialog to
sample. The peak band alone is seven consecutive birthdays.

**Both halves were needed, and the shape follows round 24's own ruling** (`docs/decisions.md`,
19.08, on the college birthday lines): «one line per year and not a random pick, deliberately – four
college birthdays is the whole of the population, so a pool would repeat within a single career.»

1. **A wider pool.** Two rows each to the 19-21 and the peak bands: C(5,3) = 10 and, with the album,
   C(6,3) = 20. The rule the tests hold is per birthday, not ">1": **a band must be able to print at
   least as many dialogs as it holds birthdays**, bounded for the open-ended late band by
   `ENDINGS.stopAskingAgeYears`. A one-year band (17, 18) cannot repeat inside itself and is left.
2. **A walk, not a draw.** Every combination of the band is ENUMERATED, shuffled ONCE per career per
   band on `seed:birthday:cycle:<band>`, and indexed by her age. Consecutive birthdays take
   consecutive entries, so two in a row can never be identical while the band has more than one
   combination, and the whole population is seen before anything comes round again.

⚠ **No persisted state, so no schema move.** The walk is a pure function of (seed, band, age) exactly
as the draw it replaces was a pure function of (seed, age); it is still immutable and still cannot be
re-rolled by reloading, and a player's choice still cannot move it.

⚠ **The draw counts moved and the guard was re-aimed, not weakened.** There are two sub-streams now:
`seed:birthday:cycle:<band>` drawn C(n,3)−1 times once per career, and `seed:birthday:<age>` drawn
exactly **four** times for every band – three to order the rows, one for the ask. MAIN is not reached
by either: `tests/condition.test.ts` is green on 41550 draws / hash `e6b0c709`, unchanged.

⚠ **§8d's sentence about `gifts.length + 3` is superseded by this section**, and its determinism
claim is not: every id is still unchanged and still persisted, and `giftNoun` still walks the whole
catalogue.

---

## 11. Round-26 #4, second pass – the wish beside the bicycle (26.08.2026)

> «надо переписать значит **саму фразу для велосипеда** для соответствия ее пожеланиям и **достаток
> здесь вообще не при чем**. У меня нет проблем с велосипедом, может быть это должна быть как раз
> **просьба на первый ДР во время учебы** вообще.»

### 11a. What the first pass got wrong, and it was not the licence

He read one dialog: the ask was `flighthome`'s **«She has been looking up fares home at two in the
morning and booking none»** and the bicycle was sitting in the options. He read the two as a **pair** –
a girl who cannot afford a train ticket, offered a bike. §9 answered the half that was visible (a
hardship sentence printed over a $584,375 wallet) and left the half he was actually pointing at:

**`campusbike` had no wish of its own that a player would connect to it.** Its ask was «She has counted
the minutes she spends walking between buildings. It is a lot.» – hooked on «minutes» (rule 2, §8) and
never said the word *bicycle*. So the only sentence at the top of that dialog that could point at the
bike pointed at it obliquely, and the one that pointed loudly pointed somewhere else.

⚠ **The means predicate is NOT the tool for this row and is not touched.** «достаток здесь вообще не
при чем.» `campusbike` carries no `means` and must not grow one. §9's licence stays exactly where it
was earned – `flighthome` and `books` (hardship), `neverbuy` (plenty) – and
`tests/college-birthday.test.ts` now asserts that split mechanically, including that the bicycle
declares nothing in any of its four strings.

### 11b. The wish

| | |
| --- | --- |
| was | *She has counted the minutes she spends walking between buildings. It is a lot.* |
| **is** | ***Everyone there has a bicycle. She walks, and she has mentioned it twice.*** |

* **It is about the bicycle.** It names the thing, which the old line never did.
* **It is means-blind.** Everyone on a campus having a bicycle is as true of a rich family as of a
  poor one, and what she wants is to stop being the one walking. Measured, not asserted: the same
  first wish renders identically at a household wallet of **$1,200** and of **$643,595**.
* **It hooks harder, not softer** (§8 rule 2). Two hooks where the old line had one – *bicycle* is on
  this row's label and on no other row of the band, *walks* is in its note and nowhere else – and both
  are words on the button the player is looking at.
* **It is 71 characters against 76**, so the prompt is SHORTER than the one it replaces and the
  round-20 fit rule is not newly stressed.

### 11c. Her first college birthday asks for it

> «может быть это должна быть как раз просьба на первый ДР во время учебы вообще»

**Yes, and there is a reason beyond his suggestion.** A bicycle is a fresher's problem: the fifteen
minutes between buildings are a discovery in the first term and solved furniture by the fourth year.
The band's other three rows are not like that – the room, the journey home and the reading list are
true of all four years – so this is the one row that belongs to a particular year, and it is the first.

**And a deterministic college year is the house's own shape**, not an invention: `docs/decisions.md`,
19.08, «one line per year and not a random pick, deliberately – four college birthdays is the whole of
the population».

How it is built, and each half is load-bearing:

1. **The bicycle is guaranteed to be ON that dialog.** The band holds 4 gifts and a dialog shows 3, so
   C(4,3) = 4 combinations and **exactly one omits the bicycle**. `materialFor` rotates the shuffled
   cycle left until entry 0 contains it – at most one step, no draw.
2. **The college walk is indexed by the college BIRTHDAY, not by her age.** She enrols at 18, 19 or 20
   depending on the career, so `age % 4` puts her first college birthday anywhere in the cycle and no
   fixed rotation can land entry 0 on it for every career. `collegeBirthdayIndexOf(world)` counts the
   birthday rows at or after `college.fromWeek` – derived from the record, like `pendingBirthday`
   itself, never a second counter and never a save field.
3. **The ask is OVERRIDDEN, not re-drawn.** `pool[Math.floor(rng() * pool.length)]` still runs, so
   `seed:birthday:<age>` is still drawn **exactly four times for every birthday in the game** – the
   identical reason the `alreadyGiven` filter is applied to the pool and never to the draw. The
   override then takes the bicycle **out of `pool`**, so §2ab's two properties hold unchanged: the ask
   is one of the four on screen, and it is never a present she already holds (a poked save that
   somehow owns the bicycle falls through to the drawn ask).

⚠ **And the three derivations became one.** `buildBirthdayPrompt` and `chooseGift` must build the
identical offer (invariant 1 – the worker is not the gate), and `tools/birthday-pool.ts` re-derives the
ask to measure it. That was three copies of the arguments held in line by a comment, and this round
would have made them four arguments long. `birthdayOfferFor(world, age)` is the one seam now; all
three call it.

### 11d. Measured after – `tools/birthday-pool.ts`, 12 walked careers

| | tour band | college band |
| --- | --- | --- |
| birthdays | 274 | **48** (4 per career, ages 20-23) |
| back-to-back IDENTICAL four rows | **0/189 – 0%** | **0/36 – 0%** |
| longest run of identical dialogs | 1 | **1** |
| each row's share of the dialogs | – | 36/48 = **75%** each, i.e. 3 of the 4 combinations |

* **Her four college birthdays are still four different dialogs.** The 75% per row is the arithmetic
  proof: every one of the four combinations is visited exactly once. The rotation preserved round 26
  #9b's claim rather than trading it away – a rotation of a four-cycle is still a four-cycle.
* **The bicycle is asked for on 20 of 48 college birthdays (42%)** – twelve of those are the
  first-birthday pin, one per career, and eight are ordinary draws on later years.
* **No schema move.** The index is derived, the rotation is a pure function of the shuffled cycle, and
  nothing is persisted. `tests/condition.test.ts` green on **41550 / `e6b0c709`**, unchanged.

⚠ **The instrument was broken before it was read, which is the finding worth keeping.**
`tools/birthday-pool.ts` walks the freeze by pressing three times a year, and round 26 #6 gave the
college year a SECOND stop (the championship reveal). Run on 26.08 before that was fixed it printed
**«no birthdays recorded»** for the entire college band and a college wallet census of `none` – a
stalled walk reported as a population. The fix (answer the reveal, six presses a year) reproduces §9's
own census exactly: 48 college birthdays, median wallet **$133,514**, **0 in the `tight` band**.
