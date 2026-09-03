---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-03
---

# Round 35 – the prologue, played end to end for the first time since it merged (03.09.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

⚠ This round is against `main` – the prologue landed there with PR #120 while round 34 was being
built. `round/34` does not touch the prologue and merges independently of this.

---

- [x] **1. «у нас на прологе турнир как-то сразу в матчи идет, давай сделаем наш нормальный
  полноценный флоу пожалуйста, чтобы был первый экран с артом турнира, потом матчи и переходы между
  ними как обычно. И с результатами в конце или с кубком, как у нас. А потом уже продолжаем наши
  прологовые карточки»** – **build, and the diagnosis is already confirmed.**
  `src/components/PrologueLocalOpen.vue` imports `MatchViewer` directly and calls `simulateMatch`
  itself; it never reaches `TournamentFlow.vue`. ⭐ The prologue built a second, smaller tournament
  flow instead of using the game's own – which is this repo's named recurring disease, two surfaces
  answering one question.
  – `[x]` **SHIPPED – THE WEEKEND HAS THE BEATS HE ASKED FOR. ⚠ AND `TournamentFlow.vue` COULD NOT
  BE MOUNTED TO PROVIDE THEM; the blockers are named below and they are facts, not wiring.**

  **WHAT HE GETS NOW**, in his own order: the tournament's own screen (the venue painting, square and
  full width, the surface and the draw size under it, the first pairing, and `Begin`), then a
  transition in front of **every** match naming the round and the girl on the other side of the net
  (`Watch match`), then the match in the shipped `MatchViewer`, then the next round's transition –
  and the weekend still ends on the result scene the prologue's own cards draw, which is where «а
  потом уже продолжаем наши прологовые карточки» starts. Nothing new was invented to say it:
  `venueArtUrl` is the photograph `TournamentFlow`'s own splash hangs, `stageLabel` is the game's
  namer, and `Begin` / `Watch match` / `N-player draw` are `TournamentFlow.vue`'s own strings, moved
  into `LOCAL_OPEN_COPY` so they stay a table edit.

  **WHY THE ONE FLOW COULD NOT SERVE BOTH – the blockers, one by one:**
  1. **It is driven by the store.** `useGameStore()`: 9 reads of `snapshot`, 12 of `busy`, and four
     engine round-trips (`tournamentReveal`, `tournamentSkip`, `tournamentClose`, `skipEvent`). The
     prologue has **no career** – `newCareer` is called on the far side of the ninth card – so
     `snapshot` is null for the whole walk and all four commands would refuse: there is no
     `world.pendingTournament` to advance.
  2. **It is driven by `PendingView`, which the engine composes**, and four of its fields cannot be
     filled honestly. The fatal one is that the Local Open's `tier` **is** real (`local`): the splash
     prints `TIERS[tier].points[0]` as «N pts», `prizeCentsFor(tier, 0)` as the winner's cheque and
     `eventCrowd`'s band as a gate – and pool.ts's fourth guard is «NO POINTS ARE EVER COMPUTED».
     The main splash over this fixture would put a points figure on a weekend that pays nothing.
     `ladder` / `kidRank` / `opponent.rank` have no answer either (there is no ranking in this pool
     and there is not going to be one), and a **null** `ladder` *requires* a non-null `ladderNote`,
     which is a **sentence the owner has never seen** – invariant 4. `temperatureC`, `crowd` and
     `coachTravelled` are engine-drawn per event; `profile.playStyle`, which `coachLine` reads, is
     §4's EARNED field and does not exist until `createWorld`.
  3. **Its finale is the wrong girl.** `useKidEmotion()` reads the same store and hangs
     `finaleUrl(stage, emotion)` – the fourteen-year-old finale paintings. She is ten, and this set
     has its own art, picked by him (`src/art/prologue.ts`).
  4. **Its «Continue» flies a trophy to the tab bar**, which `App.vue` renders and which does not
     exist during the prologue – and there is no cabinet entry to fly to: a prologue weekend puts
     nothing in `trophiesByTier`.

  ⭐ **THE SMALLEST SEAM, PROPOSED AND NOT BUILT, so the next wave does not re-derive it.** (1) is
  one line: `const game = useGameStore()` becomes `inject(HOST, null) ?? useGameStore()` against a
  narrow structural interface the store already satisfies – all 26 call sites untouched, the main
  game's path byte-identical. (2) is the real work and **it has a precedent twice over**: the Local
  Open is the THIRD rungless fixture, and the two before it (round 26 #6's College League, round 27
  #6's Nations Cup tie) were absorbed into this one flow by **widening `PendingView`** – `tier:
  null`, `drawSize: null`, `ladder: null` + `ladderNote`. A weekend that awards nothing at all needs
  the same widening for the points, the cheque and the crowd. That is a wave, not a bundle item.

  **EVIDENCE**: `tests/component/round35-prologue.test.ts` – the mounted walk «art screen ->
  transition -> match -> transition -> match -> the weekend ends» on a seed she wins a match in (so
  it crosses a transition BETWEEN two matches), the escape measured above the fold on both new
  beats, and an arm that reddens if a points figure, a cheque, a rank or the word «ranking» ever
  reaches the screen. ⚠ Mutation-verified: `beat` starting at `'match'` reddens 4 arms; `next()`
  jumping back to the court reddens the transition arm.

- [x] **2. «мне кажется в прологе можно без подложек с рамкой делать флоу, а просто квадратный арт
  во всю ширину (как на home) и ниже весь текст с выбором, как раз и места вертикально немного
  появится»** – **build**, layout only. ⭐ He names the model himself: the Home screen's square art.
  – `[x]` **SHIPPED, AND THE ROOM IS MEASURED RATHER THAN CLAIMED.**

  The framed backing plate is gone from the prologue: `.prologue-overlay` (src/style.css) drops
  `.dialog-overlay`'s 16px inset and its dim – there is no page behind the prologue to dim – and
  `.prologue-card` / `.handover-card` drop the panel tone, the hairline, the corners and the top
  padding, painting `--bg` instead. The painting is `calc(100% + 32px)` square and spans the phone;
  the text and the choices keep 16px gutters, which is what Home does too.

  ⚠ **THE ROUND-20 #3 GUARANTEE IS UNTOUCHED AND IS THE ONE WAY THIS COULD HAVE STOPPED A CAREER**:
  `max-height: 100%; overflow-y: auto` lives on `.dialog-card` and is still inherited, so the cards
  are still bounded and still scroll.

  **MEASURED at 375x667 on `tests/component/fits.ts`, before -> after:**

  | | before | after | |
  | --- | --- | --- | --- |
  | room the overlay leaves | **635px** | **667px** | +32 on every scene |
  | the text column | **311px** | **343px** | +32 – fewer wrapped lines |

  Scroll past the fold, per scene (content floor minus room):

  | age | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | before | 1423 | 23 | 0 | 118 | 164 | 143 | 123 | 214 | 23 |
  | after | 1382 | **0** | 0 | 118 | 123 | **77** | 106 | 214 | **0** |

  ⭐ **THREE OF THE NINE SCENES NOW FIT A PHONE WITH NOTHING BELOW THE FOLD** (6, 7, 13) and none got
  worse. The age-10 card – the one he called excellent – lost 66px of scroll, and the age-5 card came
  from 2058px to 2049px of content floor, so `prologue-walk.test.ts`'s 2200 ceiling was **re-aimed
  down to 2100** rather than left where 150px of new copy could arrive unnoticed.

  ⚠ **ONE THING I DID NOT TOUCH AND HE MAY WANT**: the answer buttons keep their own wash and
  hairline border. «Подложки с рамкой» read to me as the frame around the FLOW, and he asked in the
  same breath for «весь текст с выбором» to stay below the art – so the choices stayed choices. If he
  meant those too it is a three-line change.

  **EVIDENCE**: `tests/component/round35-prologue.test.ts` – the room asserted at 375x667, all four
  dropped declarations asserted by name, every painting square and spanning the phone, and every
  scene (with and without its tournament question) still handing the player its answers. ⚠
  Mutation-verified: restoring `.prologue-overlay`'s padding reddens 2 arms; restoring the card's
  padding reddens the ceiling.

- [ ] **3. «кажется, что в режиме ключевых моментов у нас время матча идет как обычно, а не по
  ключевым моментам»** – **measure first**, then build or answer.

- [x] **4. «мне кажется какие-то экраны у нас повторяются, я увидел "she asks more", "juniour tour
  opens at fourteen" дважды… Похоже, что это как-то связано с последующими турнирами, но если так -
  то это максимально невнятно и странно»** – **build. HIS HYPOTHESIS IS CORRECT AND THE CAUSE IS
  FOUND.** `ChildhoodPrologue.vue`'s `answer()` runs a card as TWO beats on one painting: `card`
  (its own choice), then `ask` (that year's tournament question) – the code's own words, «the second
  beat, on the same painting». Nothing is duplicated in the data; the same card is rendered twice.
  ⚠ So the fix is a design one, not a bug fix: either the ask earns its own identity on screen, or
  the two beats become one.
  – `[x]` **SHIPPED – THE TWO BEATS ARE ONE, WHICH IS WHAT ITEM 2's ROOM BOUGHT.**

  `ChildhoodPrologue`'s `beat` ref is gone. The year's own decision and that year's tournament
  question are on ONE screen: the painting, the scene, the two read lines, the card's own answers,
  then the ask's own line and its two answers, in one column. Neither commits on its own – the card
  moves on when **both** are answered (`cardAnswered`, run.ts, which `isComplete` now reads too, so
  «this card is done» and «the childhood is done» cannot answer the same question two ways). The
  answer already taken is marked, because the screen can now be half-answered.

  ⚠ **THE ASK WAS NOT DROPPED AND ITS ESCALATION IS INTACT** – four different sentences, one per
  asking, and «Put her name down» / «Not this year» both still there. What it lost is the second
  drawing of the card behind it.

  ⚠ **ONE CARD CHANGED SHAPE, and it is the thirteenth**: it carries no decision of its own
  (`sameAsLastYear`), so its synthesised «Wait for the coach» would have sat directly above «Put her
  name down» / «Not this year» – a third answer to a two-answer question. The ask's pair IS the way
  on there now. **No wording was added, removed or rewritten anywhere** (invariant 4).

  **IT FITS, MEASURED**: the two ask-carrying decision cards are 773px and 881px of content floor
  against 667px of room – 106px and 214px of scroll, both **unchanged from before the merge**,
  because the room item 2 freed pays for the ask's line and its two rows. The thirteenth, which used
  to need 23px of scroll, now fits with none.

  **EVIDENCE**: `tests/component/round35-prologue.test.ts` – a walk through a whole childhood that
  reddens if one HEAD (the year, the heading and the painting – what a player recognises a screen by)
  is ever drawn with two different bodies under it, which is exactly the defect he reported; a
  per-card arm asserting the card's own answers and its scene SURVIVE the year's answer; and the four
  askings asserted present with their own line. ⚠ Mutation-verified – **restoring the two-beat
  version reddens three arms and names the twelfth and the thirteenth by their titles**, which is the
  reproduction of what he saw. `prologue-tournaments.test.ts`, `prologue-two-paths.test.ts` and
  `e2e/prologue.spec.ts` were RE-AIMED with ⚠ notes at each change site; none was deleted or loosened.

- [x] **5. «Первый экран с заходом на турнир был отличным, надо остальные в такой же манере
  сделать»** – **build**. ⭐ Praise plus a target: the tournament-entry screen is the standard the
  other prologue screens should meet. Read it before changing anything else.
  – `[x]` **READ FIRST, AND HERE IS WHAT IT DOES.** The screen is the **age-10 card** – «There is a
  Local Open in six weeks.» – which is the first place the prologue asks about a tournament. Four
  things make it work, and they are now the rule the other screens are built to:

  1. **A PICTURE BEFORE A DECISION.** A square painting at the top, the whole of it in frame, and
     nothing written over it. You have looked at the year before you are asked anything about it.
  2. **PLAIN FACT, NOT INTERPRETATION.** «Under-twelves, one weekend, forty minutes down the
     motorway. An entry, a hotel night if she wins on the Saturday, and a draw sheet with her name on
     it.» Not one word tells the parent how to feel about it, and no number about HER appears.
  3. **THE COST IS RELATIVE AND HONEST.** «An entry and a weekend – about a month of the group,
     once.» A price you can weigh without a balance on screen.
  4. **THE CHOICE IS LAST AND IS NOT MARKED.** Two answers, same treatment, neither pointed at.

  ⭐ **AND IT IS THE SHORTEST DECISION CARD IN THE WALK** – measured, 744px of content floor against
  667px of room, 77px of scroll after this round (143px before it). The other screens were brought to
  it by items 1, 2 and 4: the weekend's own new first screen is built from exactly those four
  properties (painting, one line of plain fact, the pairing, the choice last, nothing on the art),
  the nine cards and the handover lost the frame that made them read as popups rather than as this
  screen does, and the twelfth and thirteenth stopped being drawn twice.

  ⚠ **THE ONE THING I COULD NOT BRING UP TO IT** is the age-5 card, which is still 1382px of scroll
  because it carries the wizard's four identity controls. It came down 41px and no further; the
  honest fix is his call about what the first screen must ask.

- [ ] **6. «Тай брейки в режиме ключевых моментов по-моему идут полноценно, видно каждое очко, но
  может это и нормально»** – **measure**, then answer. ⚠ He is unsure himself, so the answer may be
  «it is deliberate, here is why» rather than a change.

- [x] **7. «На последнем кадре пролога после турнира случилось странное: мне показали сначала арт с
  кубком, потом еще какой-то экран (я не успел прочесть что там), который сразу сменился на She is
  fourteen (в чем я не уверен, честно говоря, потому что ДР у нее в июне) и This is the girl you
  raised»** – **reproduce first.** Three things in one report: a screen that flashed past unread, an
  age line he doubts, and the handover. ⚠ The age doubt is checkable against the one-clock ruling –
  round 34 item 3 fixed exactly this class of defect on the main game's birthday, and the prologue
  has its own clock.
  – `[x]` **REPRODUCED, AND BOTH HALVES SHIPPED. HIS DOUBT WAS RIGHT AND SO WAS HIS READING OF THE
  SEQUENCE.**

  **1. THE SCREEN THAT FLASHED PAST WAS THE THIRTEENTH CARD, «The junior tour opens at fourteen.»**
  The order he saw is exactly what the code did: the last weekend's result scene (the trophy art –
  `OUTCOME_FACES.won`), then `begin()`, which awaits `newCareer` – **a worker round-trip** – while
  `at` still pointed at the thirteenth and nothing else claimed the screen, so the template fell
  through to `<PrologueCard>` and re-drew the card he had just finished. Then the handover. That is
  also the THIRD sighting of that title in one childhood, which is half of what he filed as item 4.
  **FIX:** the gap is a state now (`creating`) and it draws the prologue's own ground and no copy at
  all – a screen that cannot be read in the time it is up should not have anything on it to read.
  ⚠ It is not `game.busy`: that flag is true for every store command, including the `deleteCareer`
  inside «Start again», and blanking the walk on any of them is a much larger claim.

  **2. THE AGE. HE IS RIGHT, AND IT WAS WRONG FOR 359 OF 365 BIRTH DATES.** `HANDOVER_COPY.kicker`
  was the literal `'She is fourteen'` and `roseTitle` said «at fourteen»; neither was computed from
  anything. Career week 0 opens on **Monday 6 January 2031** and every girl in the band was born
  fourteen years before that January – so only a girl born **1–6 January** has HAD her fourteenth
  birthday when the handover is drawn. `DEFAULT_PROFILE` is born **15 June** – his own «ДР у нее в
  июне», and the girl he played – and `kidAgeYears(0, 6, 15)` is **THIRTEEN**.

  | at the handover | dates | |
  | --- | --- | --- |
  | she is fourteen | **6** | 1–6 January only |
  | she is thirteen | **359** | everything else, including his own default |

  **FIX – ROUND 34 #3's, ONE SCREEN EARLIER.** That item refused to give a screen a display age of
  its own («a second clock on the wire in so many words») and moved the caption instead; this does
  the same. `ChildhoodPrologue` reads `Snapshot.ageYears` – i.e. `kidAgeAt(world, world.week)`, the
  ONE clock of 09.08 and the same number Home prints – spells it with **`ageInWords`**, the game's
  own speller that the birthday feed line and the birthday dialog already read, and hands the WORD to
  the handover, whose copy table puts it in its own sentence. ⚠ **NO WORDING MOVED** (invariant 4):
  the sentence is the shape it always was and only the number in it is computed. The prop is
  **required**, so a mount that forgets it cannot compile.

  ⚠ **THE SPELLING HAPPENS IN THE CONTAINER AND NOT IN `src/prologue`, AND A GUARD IS WHY.**
  `tests/prologue-pool.test.ts` pins that no file in `src/prologue` names `engine/world` or anything
  under it. The first version imported `ageInWords` into `handover.ts` and that pin caught it on its
  first run – correctly. Passing the word down satisfies both: the prologue names no engine module,
  and the handover still cannot spell fourteen a second way.

  **3. THE HANDOVER ITSELF** is unchanged apart from that, and it lost its frame with the rest of the
  prologue (item 2 / item 5).

  ⚠ **ONE THING FOR HIM**: «She is thirteen» is now what almost every prologue career reads on that
  screen, and «This is the girl you raised.» follows it. If he wants the line to say something else
  at thirteen, that is a table edit in `HANDOVER_COPY` and it is his sentence to write.

  **EVIDENCE**: `tests/component/round35-prologue.test.ts` – the sequence reproduced with the career
  creation **held open** the way a worker round-trip is (a stub that resolved on the next microtask
  passed against the defect, and the first draft of this test did exactly that), the 365-date sweep,
  and the rendered handover asserted to carry the computed age through the real walk. ⚠
  Mutation-verified: dropping `creating` reddens the reproduction and **names the screen – «The
  junior tour opens at fourteen.»**; putting the literal back reddens the age arms.
  `tests/component/prologue-handover.test.ts` was RE-AIMED (it pinned the rose's name against the
  old literal, which is the defect itself) with a ⚠ note; nothing was deleted or loosened.

---

## Where this came from

He played the merged prologue end to end and reported in one message. Item 5 is the only one that is
praise, and it is the standard the rest are measured against.

---

- [ ] **8. «после последнего мержа основная кнопка Proceed на главной стала с очень худым шрифтом, а
  на других экранах нормально, я думал, что это один общий компонент - проверь пожалуйста и сделай
  на всех экранах одинаково с нормальным весом шрифта пожалуйста»** – **build, and it is my own
  regression from round 34 that exposed a far bigger one.**

  ⭐ It is not one shared component: `button.primary` sets 600 and round 34 #10 gave
  `.next-week-btn` its own rule at 400. But the reason it LOOKS thin is the finding:

  ```
  Manrope ships 400 and 500 only.  button.primary asks for 600.
  ```

  ⭐⭐ **So Proceed is the only button in the app rendering a REAL face, and every other one is
  synthetically bolded** – the renderer draws the stroke twice, offset. He read the honest one as
  thin against a screenful of fakes.

  **Measured across the whole app** – explicit weight requests in rules that also set the family:

  | family | heaviest shipped | asked above it |
  | --- | --- | --- |
  | `--font-heading` (Sora) | 600 | **700 (2 rules), 800 (20 rules)** |
  | `--font-body` (Manrope) | 500 | **600 (7), 700 (2), 800 (2)** |
  | `--font-hand` (Caveat) | 600 | none |

  Plus the bulk of the component tree, which inherits Manrope from `body` and asks it for 600/700/800.

  ⚙ **His ruling: ship the missing faces** («B, и Sora проверь тоже, лишнее долой»). Manrope 600/700/800
  (~42 KB) and Sora 700/800 (~30 KB); Caveat needs nothing. **~72 KB total**, against the 9.6 MB of
  art already precached.

  ⚠ **«Лишнее долой» has no target: nothing shipped is unused.** All three families' shipped faces are
  asked for. The defect was only ever the missing end.

  ⚠ **He should be told before it lands, not after:** real Sora 800 will look visibly different from
  today's synthesised version in twenty places – the largest type in the app. Cleaner and usually a
  little narrower. Not a regression; the first time the type renders as drawn.

  ⚠ Blocked on the shop bundle: the faces live in `src/style.css`, where that agent is working.

- [ ] **9. «доход от ее бренда давай тоже как проценты с призовых будем делить: т.е. в интерфейсе
  напишем про ее долю, в недельном доходе будет семье на руки сумма меньше»** – **build.**

  ⭐ The mechanism he is pointing at already exists and has one owner. `kidPrizeShareBps(ageYears)`
  is the ramp – 0 before 18, then 10 / 15 / 20 / 25 / 30 / 35 / 40 / 45 / 50 % at 18…26+ – and
  `world.ts` around lines 649-665 shows the shipped discipline for spending it: **her share is
  rounded ONCE and the family gets the remainder by SUBTRACTION**, so the two halves add up to the
  cheque exactly. A pair of independent `Math.round`s loses or invents a cent on half the finishes,
  and this money lands in two balances a player can add up on screen.

  ⭐⭐ **There is exactly one place to change**, and its own comment says so:
  `assetEarningsRateCents` (`src/engine/world/assets.ts:358`) is «the ONE place a career becomes a
  weekly cheque», routed through `businessIncome` at `src/engine/world/business.ts:51`. The split
  belongs at the banking site, not in the rate – the rate is also what the VALUATION multiplies
  (`brandGrossWorthCents`), and splitting it there would quietly halve what the brand is worth.

  ⚠ **That is the trap to avoid and it must be measured, not assumed:** after the change the brand's
  WORTH must not move. Round 32 fixed the multiple into a 6–9x corridor and round 34 checked it
  again at 7.46x on his save; the same corridor must hold afterwards.

  ⚠ Precedent to follow rather than re-invent: round-28 #15 already did this to the ADVERTISING
  cheque – «ребёнку тоже нужно % перечислять, как и с призовых» – and `bankSponsorCheque` is where
  it lives. Read it first; the brand's split should read the same way.

  **On screen:** the weekly figure becomes what the family actually banks, and her share is stated –
  «в интерфейсе напишем про её долю». ⭐ `KidScreen`'s `life.ownAccount` note already spells the
  ramp for the prize split and is the register to match.

  ⚠ Queued behind the shop bundle: it touches `business.ts` and the money surfaces, where that agent
  is working.

- [ ] **10. «когда мы на неделе с множеством турниров уже подали заявку на какой-то, давай на других
  на этой же неделе кнопки подачи задазаблим? Тогда не будет текущее кривое … вообще не надо будет
  рисовать»** – **build**, and ⭐ it is the better fix by his own argument: a control that cannot be
  used should be visibly unusable, and then the warning it needed has nothing to warn about.
  ⚠ It lands directly on round 34 item 14's week stack – a week now offers a card per enterable
  rung, so «the others on this week» is a set that only just started existing.

- [ ] **11. «на домашнем экране сверху висит оверлей с красными буквами, но он находится ПОД hero
  картинкой и его не видно, тоже проверь»** – **reproduce, then build.** A stacking defect: the
  overlay paints under the hero art. ⭐ He found it while reasoning about item 10 and it is the
  reason that item is worth doing – the message the game tries to show is invisible today.

- [ ] **12. «Инвест тоже докинь пожалуйста в эту же ветку, вроде не сложная правка»** – **build.**
  ⚠ The shop bundle deliberately skipped Invest because round 34's #19/#20 were not in this tree –
  `round/34` merged to main as PR #121 AFTER `round/35` was branched. **`origin/main` is now merged
  in, so the inline stake row and the fund chart with its four ranges are present** (verified:
  `.shop-stake-row` x7 in `MoneyScreen.vue`, its CSS at line 3803, the chart's readers x20). What is
  left is whatever frame **W-shop-investments.png** asks for beyond them – measure that before
  building, and if the answer is «nothing», say so.

- [ ] **13. Catalogue corrections he gave on 03.09** – **build.**
  * `house-garden` moves to **$590,000** (it ships at $520,000; his art is `property-590`). ⚙ «Дом
    пусть будет за 590к - ок».
  * the seat counts: **the big plane carries 8 passengers, the new small one 6.** ⚠ Its shipped
    blurb already says «Eight seats», so the big one needs no words changed; the small one gains its
    own count.
  * ⚠ **[?] OPEN – one price needs his word.** He wrote «самолет за 12м - 8 пассажиров», but the
    shipped `plane.entryCents` is **$18,000,000** and his own previous message said «большой на 12
    мест остается как был за 18м». Twelve was the SEAT count and appears to have slid into the
    price. Do NOT move that price until he answers.

---

## ⭐ The art side: he ruled, and the builder was right against my brief

> «у машин картинки слева; у домов, яхт и самолетов справа»

That is exactly what the shop bundle shipped – `cars` + `academy` left, `property` + `water` + `air`
right – and it built that AGAINST my brief, which said cars and water right. ⭐⭐ Its reasoning was
better than mine and is worth keeping: «градиент справа (как на тренерах)» describes a picture on the
LEFT, because `.cm-art` sits at `left: 0` under a right-fading mask; his own handoff §X says «строки
с фото … слева и кнопкой Buy справа»; and «water – карточки как на домах» forces property and water
onto the SAME side, which my version could not satisfy. **Nothing to change.**
