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

- [>] **8. «после последнего мержа основная кнопка Proceed на главной стала с очень худым шрифтом, а
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
  – `[>]` **HALF SHIPPED, AND THE OTHER HALF IS STOPPED AT THE ONE THING I WILL NOT INVENT.**

  **1. WHAT HE ASKED FOR IS DONE: EVERY AFFIRMATIVE BUTTON IN THE APP IS ONE WEIGHT.**
  `button.primary` is **500** and `button.next-week-btn`'s own rule is **DELETED** rather than moved
  to the same number – a second declaration of one value is how a stale weight outlives the rule
  that matters, which is the argument round 34 #10's own note makes about the dead `800`. So
  «одинаково» is true by construction now, not by two rules agreeing.

  ⚙ **WHY 500 AND NOT 600, WHICH IS THE NUMBER THE OTHER SCREENS WERE READING.** It is the only
  weight BOTH of his rulings allow. Round 34 #10 was «мне не нравятся жирные буквы … сделай
  обычные»; this round is «стала с очень худым шрифтом … нормальный вес». 500 is the heaviest
  Manrope face that actually ships, so it is a step of body over 400 without being the synthesised
  bold he rejected – and round 34's own note offered it in advance: «500 is one step away if he
  wants a touch more body in it – one number, say the word». He has now said the word. Putting the
  CTA back to 600 would have reversed his own ruling of eight days ago AND drawn it fake-bold again.

  ⭐ **AND IT COSTS HIM ALMOST NOTHING ON THE OTHER SCREENS.** Today's 600 has no face, so those
  buttons already render the 500 face – with the renderer drawing the stroke a second time, offset.
  What they lose at 500 is only the fake second stroke; the CTA gains real body. The gap he was
  looking at closes from both ends and every primary button in the app now renders a face that
  exists.

  **2. THE FONT FILES COULD NOT BE FETCHED, AND NOTHING WAS INVENTED IN THEIR PLACE.**
  `public/fonts/README.md` records the provenance – "Google Fonts (gstatic), latin subset only",
  curl'd by hand – and this environment **refused the network call**. Everything else was checked
  first: no variable font is shipped (all four woff2 are single-weight statics), no `@fontsource`
  package is in `node_modules`, the design export embeds no base64 faces, git history has never held
  another weight, and the four other Ties Break checkouts on this machine carry the same four files.
  There is no honest local source, so per the brief this **stopped rather than substituting a
  different family or a re-weighted fake**. ⚠ It needs one command from a machine with network
  access; the five files are Manrope 600/700/800 and Sora 700/800, latin subset, ~72 KB, and their
  OFL texts are already in `public/fonts/` and stay valid as is.

  **3. «ЛИШНЕЕ ДОЛОЙ» HAS NO TARGET – VERIFIED, NOT REPEATED.** Census over all of `src/`
  (`tests/component/round35-ui.test.ts` runs it as a standing arm now, so a face that ever does go
  unasked shows up):

  | shipped face | rules that ask for it |
  | --- | --- |
  | Manrope 400 | `body`'s own shorthand + 14 rules |
  | Manrope 500 | 74 |
  | Sora 600 | 4 |
  | Caveat 600 | 2 |

  Nothing self-hosted is dead weight, so nothing was removed. ⚠ **The `font-weight: 400` grep is the
  trap here**: the app's default face is set by `body { font: 15px/1.45 var(--font-body) }` and by
  nothing else, so a naive scan calls Manrope 400 unused and deletes the face every screen's prose
  is read in.

  **4. THE MEASUREMENT HE ASKED FOR, AND THE HALF OF IT THAT DOES NOT EXIST YET.**

  | family | heaviest shipped | rules asking above it |
  | --- | --- | --- |
  | Sora (`--font-heading`) | 600 | **700 x3, 800 x21** |
  | Manrope (`--font-body`), family named | 500 | 600 x7, 700 x2, 800 x2 |
  | Manrope, family inherited off `body` | 500 | **600 x76, 700 x88, 800 x36** |
  | Caveat (`--font-hand`) | 600 | **none** – it falls back cleanly, as I said |

  **235 rules in the app ask for a face that does not ship.** On a mounted Home at 375x667 that is
  **111 elements** rendering a synthesised face right now, which is the before-number and is pinned
  as a one-way ratchet.

  ⚠⚠ **THE BEFORE/AFTER ON ONE HEADING CANNOT BE MEASURED UNTIL THE FILES LAND, AND SAYING SO IS
  THE HONEST ANSWER.** The heading is **`.diary-name` – her name on Home, `--font-heading` at 42px /
  800 / -0.025em, the largest type in the app by 16px** (the next are `.ob-hero-title` 26px,
  `.tf-hero-title` 22px, `.kid-name` and `.season-title` 20px). BEFORE is measurable and is measured:
  it computes to 800 against a Sora that ships 600 only, so what he is looking at today is the 600
  face emboldened by the rasteriser. AFTER is a claim about glyph outlines, and neither happy-dom
  (no layout engine, no `document.fonts`) nor this branch (no 800 file) can produce it. **What is
  certain and what he should be told: those 21 places – her name most of all – WILL change the day
  the file lands.** Real 800 is cleaner and usually slightly narrower than a faked one; it is not a
  regression, it is the type rendering as drawn for the first time.

  **EVIDENCE**: `tests/component/round35-ui.test.ts` – the CTA and a bare `button.primary` measured
  through the real cascade on a mounted `App` shell and asserted EQUAL at 500; 500 asserted to be a
  face the sheet declares and 600 asserted **not** to be, which is the finding itself rather than a
  number pin; the src-wide census; and the 111-element ratchet. ⚠ **What could not be asserted, said
  plainly in the file's header**: happy-dom ships no `document.fonts`/`FontFace`, so the brief's
  `document.fonts.check()` is unavailable – the substitute reads the `@font-face` rules back off
  `document.styleSheets`, which is the same set a browser builds its face table from. The
  RASTERISATION – that a faked 600 is one stroke drawn twice – is Chromium's to show and no test here
  claims it. ⚠ Mutation-verified: putting `button.primary` back to 600 reddens 3 arms.
  ⚠ `tests/component/round34-home-type.test.ts` was **RE-AIMED** at each of its three 400s with ⚠
  notes, and its «only the home CTA moved» arm – whose whole claim was the SPLIT he has now rejected
  – re-aimed to assert the two are EQUAL. Nothing deleted, nothing loosened; it runs 14/14.

  ⚠ **ONE OUTLIER LEFT AND IT IS HIS CALL, NOT MINE TO TAKE QUIETLY.** `PrimaryPill`'s
  `.tb-pill--cta` is still **800** – the big affirmative on TournamentFlow, EndingScreen and the
  onboarding wizard. Round 34 explicitly reserved it («a different button … he named the home CTA»),
  and those are screens he called «нормально», so it was left alone rather than swept in. If
  «на всех экранах» is meant to include it, that is one number.

- [x] **9. «доход от ее бренда давай тоже как проценты с призовых будем делить: т.е. в интерфейсе
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

  – `[x]` **SHIPPED. HER RAMP NOW SPLITS THE BRAND'S WEEK, THE FAMILY BANKS THE REMAINDER, AND THE
  BRAND'S WORTH DID NOT MOVE – measured before and after, with the trap priced.**

  **WHERE THE SPLIT WENT, and it is the one place it could go.** `resolveBusinessIncome`
  (`world/phaseFinance.ts`) is the banking site: the merch line is split there, her share rounded
  ONCE (`assetKidShareCents` -> `kidPrizeShareCents`, the very function `finalizeTournament` divides
  a prize by) and the family taking the **remainder by subtraction**, so the two balances re-add to
  the brand's gross to the cent. ⚠ THE ACADEMY IS NOT SPLIT and the guard is in the arithmetic rather
  than at the call site: «её бренд» is the merch, the academy is the parent's business bought with
  the parent's money. `bankSponsorCheque`'s shape is followed to the line, including the `info`
  transfer row with no `amountCents` (booking her share as a family expense would count the same
  cents twice against `careerTotals.spentCents`).

  **⚠⚠ THE TRAP, MEASURED RATHER THAN AVOIDED BY ASSERTION.** `assetEarningsRateCents` and
  `brandGrossWorthCents` both read `brandWeeklyGrossCents`, so a split placed anywhere upstream of
  the worth would have looked exactly like this change on the weekly line and quietly repriced the
  brand. `tools/r35-brand-share.ts` is the instrument. Before/after on the bench walk (9 presets x 4
  seeds x 780 weeks, **2,779 earning weeks**):

  | | before | after |
  |---|---|---|
  | multiple, min / p50 / max | 2.5251x / 4.6550x / 7.1214x | **byte-identical** |
  | peak brand worth | $35,626 | **byte-identical** |

  ⚠⚠ **AND THAT NULL IS WEAK ON ITS OWN, so it is not what the claim rests on** – the bench policy
  buys no shop rung, so the split never fires in it (CLAUDE.md: «prove the arm contains both the
  change and its reader»). The file therefore carries a second section on a hand-planted career that
  **actually owns the brand**, at week 500, her age 23, ramp 35%:

  * brand weekly **gross $1,898** – her cut **$664**, the family banks **$1,234**, re-adding exactly;
  * `split is LIVE: YES` – the arm runs the new code;
  * brand **worth $740,096**, multiple **7.4976x** – ⭐ **inside the 6–9x corridor**, and within
    0.05x of round 34's 7.46x reading on his own save;
  * ⭐⭐ the **counterfactual**, printed so the measurement can be seen to be sensitive: the same
    split placed upstream would read **$481,060**, a **$259,035** hole. The instrument moves when the
    defect is present, which is what makes the null above worth anything.

  ⚠ Structural confirmation beside the numbers: `src/engine/world/brand.ts` and
  `src/engine/world/assets.ts` are **not in the diff at all** – `assetEarningsRateCents` is untouched
  to the character.

  **THE SURFACES THAT NOW READ THE FAMILY'S HALF**, all through one function
  (`assetWeeklyFamilyIncomeCents`), so they cannot disagree: the till, `familyWeeklyIncomeCents`
  (the coach-market cap), `householdWeekly.merchCents` (the strip) and the shop card's `incomeCents`.
  ⭐ The precedent is inside `familyWeeklyIncomeCents` itself, where the retainer has been netted
  since round 29 P3 on the rule «the meter must read what the till actually banks».

  **ON SCREEN**, on her own page, in the register the frame's «Her own account» card uses and
  appended to the shipped sentence rather than replacing it:

  > Her own account – $X. She keeps 30% of every prize cheque now, 5 points more every birthday up
  > to 50%. Sponsor cheques are hers, less the manager's 15%. **The same share comes off her brand's
  > weekly income.**

  ⚠ «the same share», not a second percentage – two spellings of one number on one line is how a
  stale one survives. ⚠ And the clause is drawn **only when a brand is actually paying**
  (`ownsBrand`, off the till's own predicate): a family with no brand is not told the terms of a
  business it does not own.

  ⚠ **THE MEMO IS TAGGED `brand`, NOT `prize`, and round 31 #2 is why.** The week recap prints ONE
  line and picks the `prize` part by name, after he refused a second weekly row about money he had
  not asked to see weekly («что там снова за цифры странные появились?»). Folding brand cents into
  the prize part would put a bigger number under a label that says prize. **No schema move**:
  `FinanceWeekKidShare.brand` is optional and forward-only on `prize`/`sponsor`'s own recorded
  precedent (commit 2763caa); absent is already meaningful on every save.

  **EVIDENCE** – `tests/round29p5-business.test.ts` (the halves re-add on **60 lived weeks**, one
  rounding at her age, income never negative; the brand books its own `kidShare` part at her ramp
  and never a prize part; the strip and the shop card both quote the family's half; the academy
  stays whole) and `tests/round23-kid-share.test.ts` (the clause on screen, both directions).
  ⚠ **Mutation-verified**: `assetKidShareCents` forced to 0 reddens exactly four arms – the re-add,
  the brand part, the strip total and the shop card – and nothing else. Deleting the brand clause
  reddens the screen arm alone.

- [x] **10. «когда мы на неделе с множеством турниров уже подали заявку на какой-то, давай на других
  на этой же неделе кнопки подачи задазаблим? Тогда не будет текущее кривое … вообще не надо будет
  рисовать»** – **build**, and ⭐ it is the better fix by his own argument: a control that cannot be
  used should be visibly unusable, and then the warning it needed has nothing to warn about.
  ⚠ It lands directly on round 34 item 14's week stack – a week now offers a card per enterable
  rung, so «the others on this week» is a set that only just started existing.
  – `[x]` **SHIPPED, AND IT TURNS OUT TO BE THE ENGINE'S OWN RULE FINALLY REACHING THE SCREEN.**

  ⭐⭐ **`enterEvent` HAS REFUSED A SECOND ENTRY ON A WEEK SINCE THE LADDER-UP WAVE** – «She is
  already entered in a tournament that week», engine/world/entries.ts, with its own note beside it:
  «She has one body and one week – the abundance is a CHOICE between events, not a licence to play
  two.» The screen was drawing a live Enter over that refusal. Round 34 #14 then put a card on the
  week for every rung she can enter, which is what made the refusal reachable by swiping: press,
  answer a confirm, and be told no. That is «текущее кривое», and his own argument for the fix is
  the right one – a control that cannot be used is drawn unusable now, and the warning has nothing
  left to warn about.

  **THE BUILD:** one predicate, `weekEntryTaken` (composables/tierState.ts, beside `weekEventStack`
  where his ruling on the stack lives), read once per ROW by SeasonScreen and added to the Enter's
  existing `:disabled`. ⚠ It is deliberately **not** folded into `eventActionable`: that question is
  «may she act on this card at all» and it must keep saying yes, because the entered card's own
  Withdraw / Cancel entry is the way back out. Folding it there would have deleted the second card
  instead of greying its button – «не надо рисовать» applied to the wrong element. The week keeps
  every card round 34 #14 earned it.

  ⚠ **NO COPY WAS ADDED, AND THE APP'S OWN CONVENTION IS WHY.** I looked for one first, as asked.
  This screen already handles a refusal that covers several cards at once, and it states the reason
  **ONCE at the head of the feed, never per card** – `COLLEGE_FREEZE_REFUSAL`, whose own note says
  «eight cards carry a disabled Enter and eight copies of one sentence would be the noisiest thing
  on the screen». This refusal is per WEEK, so a note would be per card by construction. The week
  already says it: the committed card wears **`Entered`** and stands FIRST in the same swipe strip
  (`preferredWeekEvent`'s first tiebreak). ⚠ If he wants a sentence anyway, the honest source is the
  engine's own – the college note's exact pattern – and it is his call.

  ⚠ **ONE RESIDUE I LEFT ALONE AND HE SHOULD KNOW ABOUT.** The two lines that can sit under an Enter
  – the engine's «Exhausted – race anyway? Rest would be wiser.» and the hired coach's own caution –
  still draw on a card whose Enter is now greyed, so a spent week can show advice about a press that
  is no longer offered. Removing them is a copy decision on his surface, not a bug fix, and he asked
  for the buttons; say the word and it is a `v-if`.

  ⭐ **THE CALENDAR NEEDED NOTHING, AND THAT IS BY CONSTRUCTION RATHER THAN LUCK.** The other Enter
  in the app is CalendarScreen's marker card, and its markers pick through `preferredWeekEvent`
  (weekDays.ts) – ONE event per week, entered first – so on a committed week the marker IS the
  entered event and the card draws «She is in. Withdrawing lives on the Season tab.» rather than an
  Enter. There is no second door to close.

  **EVIDENCE**: `tests/component/round35-ui.test.ts` – **both arms on the same week of the same
  golden save (`v46.json`), one fact different**: with an entry made through the engine, every OTHER
  card on that week draws a DISABLED Enter while the committed one draws no Enter at all and still
  offers Withdraw/Cancel entry; with nothing entered, at least two live Enters stand on one week.
  ⚠ The disabled arm asserts the THREE PRE-EXISTING reasons away – the purse covers every fee,
  `game.busy` is false, no college freeze – so the attribute can only come from the new rule.
  ⚠⚠ The finder is deliberately BLIND to the rule under test (round 34 #14b's finder made exactly
  the opposite mistake and its note says so), and every arm rebuilds its own world: the walk is
  cached, the world is not, because three arms mutate it with `enterEvent` and a shared fixture
  would have let the first arm's entry decide the second arm's verdict.
  ⚠ Mutation-verified in BOTH directions: dropping `entryTaken(row)` from the binding reddens the
  entered arm; making the predicate true on every non-empty week reddens the live arm.

- [x] **11. «на домашнем экране сверху висит оверлей с красными буквами, но он находится ПОД hero
  картинкой и его не видно, тоже проверь»** – **reproduce, then build.** A stacking defect: the
  overlay paints under the hero art. ⭐ He found it while reasoning about item 10 and it is the
  reason that item is worth doing – the message the game tries to show is invisible today.
  – `[x]` **REPRODUCED AND SHIPPED. ⭐ THE CAUSE IS NOT A `z-index` – THERE ISN'T ONE – AND NOT A
  STACKING CONTEXT EITHER. IT IS PAINT ORDER, CAUSED BY A NEGATIVE MARGIN.**

  **WHAT THE RED LETTERS ARE.** `<p v-if="game.error" class="error">` at the top of
  `HomeScreen.vue` – `.error` is `color: var(--danger)` (#ef4b3a), and `game.error` carries the
  sentence the worker threw. On his week that sentence was `enterEvent`'s «She is already entered in
  a tournament that week», which is item 10 exactly. The two items are one story and he found them
  in the right order.

  **THE CAUSE, TWO FACTS THAT ONLY BITE TOGETHER.**
  1. `.diary-hero` carries `margin-top: calc(-1 * var(--app-pad-top))` – **-24px** – written to
     cancel `#app`'s top inset so the photograph reaches the top of the phone (the A3 full-bleed
     ruling of 28.07). That comment says "cancel the shell's gutter EXACTLY", which is true of an
     EMPTY inset and a lie about an occupied one. The `<p>` stood OUTSIDE `<ScreenShell>`, so the
     hero was still the shell body's `:first-child` and the -24px ate **the sentence** instead of
     the padding.
  2. `.diary-hero` is `position: relative` (it has to be – three scrims and the confetti are
     absolutely positioned inside it) and the `<p>` is static. **CSS 2.1 Appendix E paints
     positioned descendants in step 8 and in-flow block content in steps 4/7**, so the picture wins
     whatever the source order says. Putting the paragraph first in the DOM – which it already was –
     could never have saved it.

  ⭐ Arithmetic: `#app` opens at 24px, the line sits at y≈32 and is ≈19px tall (13px/1.45), the hero
  starts at ≈40 – so roughly **8px of a 19px line** showed and the rest was under the painting.
  «Висит … и его не видно» is precise.

  **THE FIX IS THE OVERLAP, NOT THE PAINT ORDER, which is what the brief asked for.** The paragraph
  moved INSIDE `<ScreenShell>`, so the hero stops being `:first-child`, and one new rule –
  `.diary-hero:not(:first-child) { margin-top: 0 }` – drops the cancellation, because the app's top
  inset is no longer empty space, it is holding a sentence. **`:first-child` is the condition that
  margin always meant, said out loud.** No `z-index` was added anywhere, nothing is stacked on
  anything, and it generalises: anything ever inserted above the hero is safe for free.

  ⚠ **THE FULL-BLEED HERO IS UNTOUCHED WHEN THERE IS NO ERROR** – hero is `:first-child`, margin is
  -24px, screen byte-identical. That is asserted, because it is the thing this fix could have cost.
  ⚠ **NO WORDING MOVED** (invariant 4): the element, its class and its text are the engine's own,
  moved and not rewritten.

  **EVIDENCE**: `tests/component/round35-ui.test.ts` – with the refusal on screen, the hero's climb
  over the line above it asserted to be **0px**, computed off the real cascade; the structural half
  (the paragraph is inside the shell and is the hero's immediate preceding sibling, so
  `:first-child` has something to be false about); the no-error arm asserting the -24px is still
  exactly `--app-pad-top` read as a token rather than a literal; and a fourth arm that takes the
  refusal string OUT OF THE ENGINE, puts it on the store and asserts Home renders it – the two items
  joined in one measurement.
  ⚠⚠ Mutation-verified against **the shipped defect itself**: putting the paragraph back outside the
  shell reddens 3 arms; keeping the move but dropping `:not(:first-child)` reddens 2. ⚠ One honest
  limit, recorded in the file: happy-dom has no layout engine, so this measures the OVERLAP through
  the computed cascade (a negative margin here *is* the overlap) rather than through a real
  `getBoundingClientRect`.

- [x] **12. «Инвест тоже докинь пожалуйста в эту же ветку, вроде не сложная правка»** – **build.**
  ⚠ The shop bundle deliberately skipped Invest because round 34's #19/#20 were not in this tree –
  `round/34` merged to main as PR #121 AFTER `round/35` was branched. **`origin/main` is now merged
  in, so the inline stake row and the fund chart with its four ranges are present** (verified:
  `.shop-stake-row` x7 in `MoneyScreen.vue`, its CSS at line 3803, the chart's readers x20). What is
  left is whatever frame **W-shop-investments.png** asks for beyond them – measure that before
  building, and if the answer is «nothing», say so.

  – `[x]` **SHIPPED, AND «NOTHING LEFT» WAS THE WRONG ANSWER – HE CHECKED THE FRAME HIMSELF.**

  > «инвесту разрешил ответить "делать нечего" - нет, не так, сверься с макетами пожалуйста, там две
  > кнопки о поле инпута одно, всё в ряд стоит»

  **THE MEASURED DELTA, and it is one thing.** Round 34 #20 put each control beside its OWN input,
  which satisfied «в одну строку с инпутами» **twice** and left a holding carrying **two** number
  fields. The frame has **one**, with both buttons after it. So: one shared field, `Add more` and
  `Sell` beside it, one row. `stakeDollars` is now the single value and `stakeCentsFor` /
  `sellCentsFor` are its two readers – no predicate, command or minimum moved, and the dedicated
  `sellDollars` ref is gone (a second value nothing on screen can show is worse than the two fields
  it replaced).

  ⚙ **The words are his, ruled 03.09** – quoted here so a later reader can see they were asked for
  and not tidied up by a builder (CLAUDE.md invariant 4):

  > «"Add more" и "Sell" - хорошо, меньше места занимают»

  So `Put more in` -> **Add more** and `Sell it for $X` / `Take out $X` -> **Sell**.

  **⚠ ROUND-20 #3, RE-MEASURED WITH HIS WORDS IN PLACE** (which is the point – the shorter labels are
  what buys the width the third control needs). At **375x667**, on the widest holding this row can
  produce (a $1,000,000 deposit), the field plus both buttons demand their room and leave
  **85.82px of slack**. ⚠ Mutation-verified: `.shop-stake-input` widened 8.5em -> 30em reddens that
  arm **alone**.

  ⭐ **BEHAVIOUR, and the one subtlety a shared field creates, written down rather than discovered
  later.** An empty box is not ambiguous – each verb keeps the default it already had: `Add more`
  adds the **minimum** (`stakeCentsFor` floors an unusable figure at `entryCents`, which is exactly
  what the placeholder in the box promises) and `Sell` sells **all of it** (`sellCentsFor` returns
  null, the engine's `amountCents === undefined`). Both are pressable and they do different things.
  More than they hold is still refused.

  **EVIDENCE** – `tests/component/round34-money-shelf.test.ts`, re-aimed from two rows to one and
  never loosened: one field on the whole card, both controls in the same row element (structure, not
  class names), the two labels, the 375x667 fit, a fixed rung still coming out with a single control
  and no field, and both verbs reading the one box. Re-aimed with ⚠ notes in
  `round29p2-part-sale.test.ts`, `round29-shop-topup.test.ts` and `shop-tab.test.ts`.

  **[?] TWO THINGS FOR HIM, both deliberate rather than forgotten:**
  1. **The two captions are gone.** «Add more, from $5,000» and «Take out how much, or leave it
     blank for all $X» labelled two fields; there is one now, and the frame draws it bare with the
     minimum as its placeholder. The sentence a screen reader needs is kept as an `aria-label` built
     from the engine's own figures, so nothing is lost to accessibility – but the visible captions
     are two shipped sentences that went, and that is his call to confirm.
  2. **The frame paints `Add more` filled lime and `Sell` outlined.** Both ship outlined today
     (`.shop-action` is already the outline style). He ruled the words, not the fill, and his
     standing note is «есть нюансы, делаем не точно так» – so the treatment is unchanged and this is
     one line from him either way.

- [x] **13. Catalogue corrections he gave on 03.09** – **build.**
  * `house-garden` moves to **$590,000** (it ships at $520,000; his art is `property-590`). ⚙ «Дом
    пусть будет за 590к - ок».
  * the seat counts: **the big plane carries 8 passengers, the new small one 6.** ⚠ Its shipped
    blurb already says «Eight seats», so the big one needs no words changed; the small one gains its
    own count.
  * ⚙ **CLOSED, 03.09:** «самолет 18м стоит (верно) мест пусть будет 10. У маленького 7. всё.»
    So the big plane keeps **$18,000,000** and its blurb changes from «Eight seats» to **ten**; the
    new small plane at **$7,000,000** carries **seven**. No price moves.
    ⭐ His own research (`docs/research/private-jets-in-tennis.md`) prices Nadal's real Cessna
    Citation CJ2+ at $5–7M for up to 8 passengers, so the $7M rung sits on a real aircraft – the
    number was chosen before the research and survived it.

  – `[x]` **SHIPPED, ALL THREE, AND NO PRICE MOVED BUT THE ONE HE MOVED.**

  * **`house-garden` $520,000 -> $590,000** («Дом пусть будет за 590к - ок»). ⭐ The painting was
    right all along: his art for this rung has been named `property-590` since round 35 #1, and
    round 35 #7 deliberately left the price alone because he had asked to ADD two tiers and nothing
    else. The note it left in `economy.ts` recording that disagreement is now the record of it being
    settled, and `src/art/shelf.ts`'s «two of his stems do not match» block reads the other way
    round: both stems agree with their prices again.
  * **The big plane keeps $18,000,000 and its blurb says «Ten seats»** («самолет 18м стоит (верно)
    мест пусть будет 10»).
  * **The small plane keeps $7,000,000 and now says «Seven seats»** («У маленького 7. всё.»).
    ⭐ Round 35 #9 shipped that row deliberately SILENT on the cabin – its own catalogue note says
    why, and that «one word from him closes it». He gave two, and the pair is consistent for the
    first time: seven below, ten above.

  ⚠ This is the one kind of wording change invariant 4 allows: he asked for these numbers by name.
  Nothing else on either row changed a syllable, and the prices are cross-checked in the same test
  so a seat edit cannot travel with a price edit.

  **⚙ THE SCHEMA ANSWER: `SAVE_SCHEMA_VERSION` STAYS AT 69, and he closed the question himself** –
  «Дом за 520к кто-то мог купить - никто не купил, нет игроков». ⚠ But the mechanical half was
  checked rather than assumed, because «no players» is not the same claim as «no save moves»:

  * `entryCents` is read **live** at exactly two sites – `buyAsset` (what leaves the wallet) and
    `shopView` (what the card quotes). Neither writes it anywhere.
  * an **owned** row is valued off its own `paidCents`, never off the catalogue:
    `assetWorthCents` -> `assetValueCents(item, owned.paidCents, ...)`. Ongoing upkeep is
    `assetUpkeepCents(item, owned.paidCents, ...)` – also `paidCents`, and a house carries no
    `upkeepBps` anyway.
  * **no golden fixture holds a `house-garden`** (`grep` over `tests/fixtures/saves/` – zero hits),
    so no frozen serialisation can move.

  So an existing holding is arithmetically untouched by the edit; nothing is added, renamed or
  removed; no migration is owed. A price edit is strictly smaller than the shop bundle's three
  catalogue ADDITIONS, which already owed nothing.

  **EVIDENCE** – `tests/component/round35-shop.test.ts`: the property ladder re-aimed to
  240k / **590k** / 1.4M / 3M read out of `ECONOMY` (⚠ the old note *predicted this exact line*:
  «If he wants the rung repriced it is one number here and this line goes red first, which is the
  point» – it did), the stem cross-checked against the price, and a new arm pinning both cabins with
  the negative that catches a revert («Eight seats» must not come back). ⚠ **Mutation-verified**:
  restoring $520,000 reddens the ladder pin; restoring the two old blurbs reddens the seat pin.

---

## ⭐ The art side: he ruled, and the builder was right against my brief

> «у машин картинки слева; у домов, яхт и самолетов справа»

That is exactly what the shop bundle shipped – `cars` + `academy` left, `property` + `water` + `air`
right – and it built that AGAINST my brief, which said cars and water right. ⭐⭐ Its reasoning was
better than mine and is worth keeping: «градиент справа (как на тренерах)» describes a picture on the
LEFT, because `.cm-art` sits at `left: 0` under a right-fading mask; his own handoff §X says «строки
с фото … слева и кнопкой Buy справа»; and «water – карточки как на домах» forces property and water
onto the SAME side, which my version could not satisfy. **Nothing to change.**

- [ ] **14. «на неделе перед турниром случилась жеребьевка, мне сказали "играем против №118 шанс
  71%", пошел турнир - соперник в первом раунде №76»** – **build. The diagnosis is complete and it
  undermines round 34 #5.**

  ⭐⭐⭐ **The draw is never stored. It is recomputed from live inputs every time it is asked for.**
  `preview.ts` builds `alive = drawnField(event, cohort, ranking, rivalConditions(results, week),
  kid, seed, excluded, standing)` and `firstRoundOpponent` is «a pure index lookup into the finished
  draw». The RNG is stable – `seed:kidtour:<eventId>`, and the file says so – **but `ranking`,
  `rivalConditions(..., world.week)` and the standing table all move every week.** So at week −1 the
  field was built one way and the jury drew #118 out of it; a week later the field rebuilt itself and
  **the very same draw** produced #76.

  ⚠ Round 31 #4 taught us to stop NAMING the opponent early (`DRAW_LEAD_WEEKS`). It never made the
  draw a fact. We learned not to say the name too soon and went on inventing it fresh every week.

  ⭐ **The fix: when the draw is shown, it has happened, so it is written down.** Her first-round
  opponent is persisted the week `drawMade` first turns true and read from there afterwards.
  ⚠ Not the whole field: `season/types.ts` warns that «a stored field shifts every subsequent
  attribute for all 199» – that is about the COHORT, and one opponent id is not it.
  ⚙ Cheap by his own ruling of 03.09: no players exist, so the schema move is the four-part ritual
  and no compatibility at all.
