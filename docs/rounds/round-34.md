---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-02
---

# Round 34 – a full career on the round-33 build, 21 items (02.09.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

⚠ His save came with it: `tennis-sim_vera-8oem_w569.tsave` (Vera, week 569). He asked for a full
read of her performance against our benchmarks – filed as item 22 below, since it is work he asked
for and would otherwise have no line.

---

- [x] **1. «в начале 2го сезона все очки в региональном уровне у меня обнулились, мне снова
  закрылся регионарный и национальный чемпионаты, хотя мы до них добрались. И кажется, что оно
  обнуляется каждой год. Или это так надо? … совершенно непонятно как выйти в j уровень»**
  – **measure first, then answer or build.** The ranking window is a rolling 52 weeks, so a season
  boundary CAN look like a reset; whether the tier gates re-close is the actual question. ⚠ His last
  sentence is the real complaint: the route to the J tour is unreadable.
  – `[x]` **MEASURED, ANSWERED, AND THE LAST SENTENCE SHIPPED.** Three questions, three different
  answers, and the premise in the triage line above is wrong: the domestic table is **not** a rolling
  52 weeks.

  **THE MEASUREMENT** (`tools/r34-domestic-reset.ts`, 25k middle career, seed 0, four seasons walked
  through the real engine; only the boundary weeks and the weeks a gate MOVED are printed):

  | week | season week | national pts | Regional | National | J30 | J30 chip |
  | --- | --- | --- | --- | --- | --- | --- |
  | 25 | 25 | 68 | open | shut | shut | `68 / 250 national pts` |
  | **51** | **51** | **106** | **open** | shut | shut | `106 / 250 national pts` |
  | **52** | **0** | **0** | **SHUT** | shut | shut | `0 / 250 national pts` |
  | 66 | 14 | 150 | open | open | shut | `150 / 250 national pts` |
  | 77 | 25 | 251 | open | open | **open** | `Open – on the calendar` |
  | **103** | **51** | **251** | **open** | **open** | open | – |
  | **104** | **0** | **0** | **SHUT** | **SHUT** | **open** | – |
  | 155 | 51 | 0 | shut | shut | open | – |
  | 207 | 51 | 0 | shut | shut | open | – |

  1. **DO THE POINTS ZERO AT A SEASON BOUNDARY? YES – and it is HIS OWN RULING, not a bug.**
     `WINDOW_BY_TRACK.domestic` is `'seasonToDate'` (round 23 #12/#13: shown leave-it /
     season-to-date / widen-the-window, he chose season-to-date – «да, это мелочь, а будет хорошо,
     мне кажется. Тем более, что первый сезон у нас показательный»). The two hypotheses are told
     apart by folding the same ledger twice at week 52: a rolling-52 window still carries **all** of
     season one there, the shipped rule carries only what season TWO has paid. So it is a RESET, not
     an ageing-out, and «оно обнуляется каждый год» is exactly right. ⚠ Only the domestic table: the
     ITF and WTA tables are `'rolling52'` and genuinely do carry over.
  2. **DO THE GATES RE-CLOSE? YES, MEASURED – w52 Regional, w104 Regional AND National.**
     `tierFloorOpen` reads that season-to-date total LIVE, so a rung she cleared in September is shut
     again in January. ⚠⚠ **This is the consequence nobody priced when the race was approved, and it
     is the half of his report that is NOT covered by the round-23 ruling.** ⭐ The engine already
     owns the mechanism that would fix it: the two on-ramps LATCH (`onRampCleared`), which is why in
     the table above J30 is still open at w207 on a book of 0 while Regional – cleared at w25 – is
     shut. **Not changed here: latching a cleared domestic floor is a balance decision and his to
     make.** It is a ~1-line change (`tierFloorOpen`'s domestic arm ORed with a never-pruned
     `bestFinishByTier` read – no schema bump), and it is pinned as a red-on-change guard so it
     cannot move in silence.
  3. **«СОВЕРШЕННО НЕПОНЯТНО КАК ВЫЙТИ В J УРОВЕНЬ» – SHIPPED, and it is presentational.** The route
     is J30's floor of 250 national points, and the screen never said those 250 have to be earned
     **inside one season**. The table above is the cost of that silence: 106 at week 51 is not 106 of
     the way to 250, and she did not cross until week 77 of the NEXT season. `tierOpensWhen`'s points
     clause now names the window it is counted over – «age 13 and 250 national pts **in one
     season**» – and the lock's long form ends «…, and the table starts again each season.»
     ⚠ **DERIVED FROM `WINDOW_BY_TRACK`, never written down**: that constant is a plain object
     precisely so `tools/domestic-season-to-date.ts` can patch it for an A/B arm, and a hardcoded
     clause would lie through such a run and through a re-ruling. W15's 120 ITF points are untouched.
     ⚠ **NEW COPY, and he should see the exact strings** – it is the one thing invariant 4 asks be
     named. Two clauses, both additive, on the surface whose own header says it exists so a player
     can read «what do I need to earn to get there» off one screen.

  Evidence: `tests/round34-ladder-plaques.test.ts` (the fold-it-twice arm that separates reset from
  ageing-out, the two measured gate closures, the J-latch asymmetry, the derivation) and the MOUNTED
  `tests/component/round34-j-route.test.ts` – the real Tour guide rendered over a real career, the
  `Opens at` cell read back for J30/Regional/National, and the two arms that fail if the clause
  spreads to a table that does not reset. ⚠ Mutation-verified: dropping the clause reddens 2 unit +
  2 mounted arms; hardcoding it instead of deriving reddens the derivation arm; deleting the
  tooltip's half reddens its own.

- [x] **2. «Тренер на главном экране (почему-то, давай на карточку тренера вернём лучше) написал 14
  летней девочке Close to her ceiling … звучит как приговор … не рановато ли? … давай подумаем в
  какой конкретно момент должно это появляться»** – three asks in one, split:
  - **2a** the read moved to Home and he wants it back on the coach card – **build**
    – `[x]` **SHIPPED.** `HomeScreen.vue` no longer renders it: the `roomBand` computed, its
    `<p class="coach-room">` and the CSS rule that dressed it are gone. Nothing was invented to fill
    the gap – his coach's round-7 quote and the signature are untouched, the card keeps its
    `card-short` box and is simply one line shorter, which is the shape it had before round 24. The
    read still renders exactly once, unchanged, above the coach list on the Coach Market
    (`.cm-room-band`). Evidence: `tests/component/round24-coach-card.test.ts` – the mounted file that
    used to pin the line ON Home – re-aimed to assert both halves in one test: absent on Home at six
    headrooms and under each of the four labels, present on the market card with its argument under
    it. ⚠ Mutation-verified: putting the line back on Home reddens two arms, and the non-vacuity arm
    reddens if the read is deleted rather than moved. ⚠ One collateral catch, recorded because it
    nearly shipped silently: naming the pin's filename in a comment above the card put a second
    `coach-card` string in the file and moved `tests/coach-market.test.ts`'s region marker up 900
    lines. `tests/helpers/source.ts` caught it; the note is worded around the marker now.
  - **2b** «Close to her ceiling» at 14 reads as a verdict – **measure**: what does the band
    actually say at 14, and on his save?
    – `[x]` **SHIPPED to §A1.** `realisedShare` (new in `world/coachMarket.ts`, one definition read
    by both `coachRoomNote` and `coachRoomBandOf`) divides `(skills − born)` by `(potential − born)`
    with `born = startingSkills(seed, profile)`, and `coachRoomBandIndex`'s edges are the approved
    **0.40 / 0.75 / 0.90**. `ROOM_BANDS` is untouched – four labels, same words, invariant 4 – and
    the round-23 measurement table over that function is kept with a ⚠ note saying the MEASURE moved
    under it and that the table describes the superseded quantity. Evidence:
    `tests/round34-ceiling-read.test.ts` – the inversion in two real careers (born-high-and-stalled
    reads a LOWER band than born-low-and-grown, where the old ratio ordered them the other way), a
    girl at her birth build reads «Huge potential» however well she was born (the old measure had her
    over 0.90 before her first session), the three edges pinned from both sides, monotone over the
    whole range, and the four labels asserted byte-identical. ⚠ Mutation-verified: reverting to
    `level / (level + room)` reddens 6 tests across 3 files; moving one edge by 0.05 reddens the edge
    pin; renaming one label reddens the invariant-4 pin.
    ⚠ **§A1 names `handoverRoomBand` as the model "in the same file" and it is not on this branch** –
    it lives on `prologue/wave` (`git show prologue/wave:src/engine/world/coachMarket.ts`). Its
    approach was copied from there rather than reinvented, and the note over `realisedShare` says so.
    ⚠⚠ **MEASURED CONSEQUENCE HE SHOULD SEE, and it contradicts nothing in §A1 but was not in it.**
    On the new scale the TOP band is a late, elite reading. Walked through the real engine to 29 (780
    weeks, the whole growth arc before `declineFactor`): «At her ceiling» is reached on 6 of 8 elite
    careers, at weeks 745–776, and on NONE of eight budget / middle / high ones, which peak at 0.855
    / 0.879 / 0.895 realised. A middle-rung career now reads «Huge potential» → «Still room to grow»
    (week 81) → «Close to her ceiling» (week 296) and never hears the fourth line. That is 0.90 doing
    exactly what he approved it to do; it is filed here because the fourth band is now about as rare
    as the first one was dead before round 23, and if he wants it audible on an ordinary career the
    **edge** is the knob, not the measure.
  - **2c** when should it appear at all – **ask**
    – `[~]` **ANSWERED BY THE THRESHOLDS; nothing built.** On the approved ladder the verdict arrives
    after twenty instead of at fourteen. Measured on the career `tests/round23-coach-copy.test.ts`
    walks: under the OLD measure it heard «Close to her ceiling» at week 78 (age 15.5) and «At her
    ceiling» at week 158 (age 17.0) – his complaint reproduced to the week – and on the new one it
    reads «Still room to grow» at 16 and «Close to her ceiling» at 24, the same pair §A1 predicted for
    Vera. The share it reads at each birthday is written into that test.
  ⚠ He then withdrew part of it himself: «А вот и At her ceiling в 16 лет случилось – видимо моя
  претензия снимается». ⭐ But he still asked for the save to be read: «Но сейв всё-таки посмотри».

- [x] **3. «Увидел попап про 15 летите … а затем на home перешёл, а там написано 14 лет.
  Подозреваю, что это из-за дат: ДР 15го, а начало недели 14го, но раз мы показали попап – то уже
  можно и возраст менять, либо сам попап в таких случаях в конце недели показать»** – **build**.
  The birthday popup and the age line disagree within one week. ⭐ He named both fixes; pick one and
  say why. ⚠ He also noted the popup says «1 день вместе» and wondered whether that age should carry
  more of a request – filed as **3b**, an **ask**.
  – `[x]` **SHIPPED – I TOOK HIS SECOND FIX («попап в конце недели»). HIS DIAGNOSIS WAS EXACT.**

  A career week is Monday..Sunday. Home prints `Snapshot.ageYears`, which is `kidAgeYears` read at
  the week's **Monday** – the right instant for a clock that governs a whole week, and the 09.08
  ruling's own consequence. The popup announced `birthdayTurning`, which fired in the week
  **containing her date**. Birthday on the 15th, week opening on the 14th: the popup is one week
  ahead of the age line, exactly as he says.

  **WHY NOT FIX 1 («раз мы показали попап – то уже можно и возраст менять»).** It means bumping
  `Snapshot.ageYears` inside the birthday week – and that field is not a caption. `composables/tierState.ts`
  gates the ladder cards on it, `weekGrid` picks her age band from it, `kidPrizeShareBps` prices her
  share off it and `portraitStage` chooses the art. Bumping it opens a rung on screen a week before
  `kidAgeAt` opens it in the engine (a dead click, then a refusal), and giving Home a *display* age
  of its own is a second clock on the wire in so many words. ⚠ **The ONE-CLOCK RULING allows exactly
  one, so the fix had to move the announcement rather than the age.** It does: `kidAgeExact` is
  untouched and **no age-keyed gate moves at all**.

  **THE CHANGE IS ONE PREDICATE** (`birthdayYearIn`, `engine/world/age.ts`). The carry clause that
  was already there for the dates the calendar cannot place – "the first career week whose Monday is
  on or after her date" – is now the **whole** rule instead of the exception. That makes the
  predicate literally «`kidAgeYears(w) > kidAgeYears(w-1)`»: the clock's own tick. The popup, the
  feed line, the Home confetti and `diary.facts.birthdayAge` all move together, because all four
  read this one function.

  **MEASURED**, all 365 birth dates × 14 seasons:

  | | before | after |
  | --- | --- | --- |
  | announcements printing an age Home did not agree with | **4365 of 5106** | **0 of 5099** |
  | birth dates on which that can happen | **365 of 365** | **0** |
  | weeks the clock ticked and nothing was said | 4359 | **0** |
  | weeks something was said and the clock had not ticked | 4359 | **0** |

  **WHAT HE WILL SEE MOVE.** For a birthday on any day but a Monday (6 dates in 7) the popup, the
  «She is fifteen this week» line, the confetti and the gift week all land **one week later** than
  before – the week Home's number changes. ⚠ **No copy changed:** the sentences are byte-identical
  and the week they are true of is now the week they are shown in.

  ⭐ **TWO THINGS FELL OUT, BOTH GOOD.** (a) The dates **7–12 January** used to announce «turning 14»
  at **week 0** while Home printed **13** – his own complaint, in the first week of the game – and are
  marked in week 1 now, where the two agree. (b) The whole LOST-BIRTHDAY class is retired rather than
  patched a fourth time: a clock cannot lose a tick, so 31 December and 1–6 January are ordinary
  dates here. Swept over 20 seasons × 365 dates: **no age doubled, none skipped.** ⚠ The one cost is
  one date: a girl born **6 January** has her fourteenth inside week 0, which has no previous week to
  have ticked from, so she opens the game at 14 (`kidAgeYears(0) = 14`, honest) and her first marked
  birthday is her fifteenth. That puts her alongside 1–5 January, which have always been that way.

  **EVIDENCE.** `tests/birthday-announce.test.ts` gains the property the item is about – *the popup
  and the Home age line can never disagree, all 365 dates, fourteen seasons* – **mutation-verified**:
  restoring the old date-week rule reddens it with all 4359 disagreements. ⚠ **Five arms in that file
  were RE-AIMED, none deleted or loosened**, each with a ⚠ note at the change site saying round 34
  moved it and why. The one worth naming: *«the announcement may lead the printed age by ONE WEEK,
  and never by more»* shipped as the LICENCE for this gap – «pinned so a reader who meets the
  one-week disagreement on screen finds it measured here rather than filing it twice». He met it and
  filed it. That arm is now **tightened to zero**, not relaxed.

  **THE BLAST RADIUS, MEASURED RATHER THAN GUESSED.** The full suite named 33 red assertions in six
  files, all of them mine (the control – my own change reverted in this tree – is green). None was a
  behaviour regression; every one was a FIXTURE built on a birthday landing in a particular week:

  | file | what it holds | re-aim |
  | --- | --- | --- |
  | `blocking-overlay` | the fork and the cake in one week | the collision date 5 Sep -> **1 Sep**, measured as the only date left whose nineteenth is marked in its own `schoolEndWeek` |
  | `college-birthday` | the championship + the cake; the boundary birthday | 2 Apr -> **25 Mar** (10 of 10 seasons), 3 Sep -> **27 Aug** (12 of 12) |
  | `r2-13-advance-span` | the birthday refusal, and birthday + reveal | week 21 -> **22**; the collision case gets its own birth date, because the default profile's birthday now lands in the school-exam fortnight where `enterEvent` refuses |
  | `round26-span-gate` | the offer rule is not a refusal | the exception is NAMED now (`engineCanMove === (birthdayPrompt === null)`) rather than asserted as `true` |
  | `coach-travel-edge` x2 | the frozen careers | **re-freeze #14** – see below |

  ⭐⭐ **RE-FREEZE #14, AND THE PER-KEY DIFF IS THE NARROWEST THIS FILE HAS RECORDED.**
  `tools/frozen-key-diff.ts` on all three frozen careers, control = my own change reverted in this
  same tree: **5/0 moved 0 keys of 72; 8/0 and 0/1 moved 1 of 72, and the key is `events`.** Read
  rather than trusted – dumping every event of all three careers as JSON and diffing the arms gives
  **24 lines**, all of them one fact: «She is sixteen this week.» moves from week 127 to week 128,
  and the monotone event `id` counter renumbers by one behind it (the 120k career's whole diff is one
  match row, `"id":215` -> `"id":214`, every character of the score, opponent, surface, skills and
  condition identical). `rngMain` is byte-identical on all three, `birthdays` too, and the frozen
  MAIN capture (41550 / e6b0c709) is untouched. Only `eliteGrinder` and `selfTravelling` are re-cut;
  every `middleGrinder` constant still reproduces. ⚠ **This is the wave's ONE re-freeze** – the other
  bundles were green on these hashes when the control was taken. A later bundle that moves a frozen
  career must re-cut once with a fresh diff rather than stack a second one on top of this.

  ⚠ **ONE CONSEQUENCE HE MAY MEET, AND IT IS NOT A DEFECT.** The default profile is born 15 June, and
  the Monday that marks her birthday now falls inside the school-exam fortnight (season weeks 23-24).
  The birthday, the popup and the gift all happen exactly as before; what she cannot do that week is
  enter a tournament – which was already true of the exam block whatever week her cake was in.

- [?] **3b. «1 день вместе» – should the ask carry more of a request?** – **ask, not built.**
  ⚠ **OPEN FOR HIM, deliberately undesigned.** `DAY_TOGETHER` is the one option offered at every
  birthday and never marked, and its whole ruling (spec §0.3) is that «nothing» must be a real
  answer: «she does not want a thing, she wants you». Its ask already names the unit three times
  over («One day – not a week, not a trip») because round-18 #10b found the day and the week at home
  reading as the same row. So the question is genuinely his: **should the day, at some ages, read as
  something she is ASKING for rather than as the absence of a present – and if so at which ages?**
  Anything I wrote here would be new copy he did not ask for (invariant 4), and the row's own rule
  is that no option may be marked as the right one, so «make it more of a request» is a design
  decision about where that line sits. Nothing built, nothing reworded.

- [x] **4. «На плашке next tournament, family budget для названия турнира и денег используй
  пожалуйста шрифт Sora»** – **build**, copy/type only.
  – `[x]` **SHIPPED – AND ONE OF THE TWO WAS ALREADY DONE, WHICH IS WHY A THIRD ELEMENT MOVED.**

  **MEASURED FIRST**, through the real cascade on a mounted 375x667 Home (`getComputedStyle`, never
  a grep for the string «Sora» in a stylesheet – the two disagree, see below):

  | what he sees | before | after |
  | --- | --- | --- |
  | `.note-title` – the tournament NAME on the next-tournament plate | Manrope | **Sora** |
  | `.note-figure` – `Travel budget / $117`, same plate | Manrope | **Sora** |
  | `.budget-total` – the balance on Family budget | **already Sora** (since 29.07) | Sora, now pinned |

  ⭐ **THE FINDING, AND IT DECIDED THE BUILD.** The money on Family budget has carried
  `--font-heading` since the U0 port on 29.07, so under the narrow reading of his sentence half of
  this item was a no-op on the day it was filed. The only money on either of the two plates he named
  that was NOT Sora is the travel figure under the tournament – so that is the one that moved, and
  his sentence stops being half a no-op. ⚠ **If he meant only the family-budget total, deleting one
  line at `.note-figure` in `HomeScreen.vue` puts it back** – the note sits on the rule.

  ⚠ REUSED, NOT REINVENTED. All three ask for `var(--font-heading)` – the token declared once in
  `src/style.css` beside the single `@font-face`. No second loader and no open-coded stack, and that
  is asserted as an EQUALITY against the token's own computed value, so an element carrying its own
  copy of the family would fail the arm.

  ⚠ TYPE ONLY (invariant 4). No size, weight, leading, column or word moved: the shipped numbers –
  15.5px/700/118px/1.25, 23px/800, 19px/800 – are pinned beside the families, because a font swap
  that quietly re-sizes a caption is exactly the restyle he did not ask for. ⚠ And nothing here
  claims a caption overflows: happy-dom has no layout engine, a per-character width is a model and
  not a measurement, and he has twice said nothing overflows on those captions.

  Evidence: `tests/component/round34-home-type.test.ts` – 7 mounted arms, plus a round-20 #3 arm
  that walks each caption's room from the viewport through its ancestors. ⚠ Mutation-verified one
  rule at a time: taking Sora off `.note-title` reddens 3 arms, off `.note-figure` 2, off
  `.budget-total` 2.

- [?] **5. «с нашим текущим "процент прохода 1го круга" на карточках турниров планировать всё равно
  не получается, потому что за неделю нельзя сняться с турнира бесплатно – это бессмысленная фича…
  Какие у нас ещё здесь варианты? … надо хотя бы что-то примерное писать до жеребьевки»** – **ask**,
  and it reopens round 31 #4. ⚠ The band was supposed to be the pre-draw information; he is saying it
  is not enough to plan on. Round 31 #3 already measured the band as degenerate on junior and domestic
  cards – that finding and this complaint are the same defect.

- [x] **6. «W35 · 🔒 163 / 0 international pts вот это вот что значит? И на следующих тирах такое
  же»** – **measure**, then build or answer. A lock showing `163 / 0` is either a swapped pair or a
  zero that should be the requirement.
  – `[x]` **SHIPPED.** Neither guess: it is a **requirement that failed to resolve**, and «на
  следующих тирах такое же» is literally true – EVERY acceptance rung printed it.

  **THE REPRODUCTION** (`tools/r34-zero-lock.ts` – nine presets x two seeds, walked 13→21 through the
  real `toSnapshot` and the shipped `tierState`, so a hit is the string the strip renders):

  | rung | first week it printed a requirement of 0 | chip | tooltip |
  | --- | --- | --- | --- |
  | J60 / J300 | career **week 0**, age 13 | `0 / 0 national pts` | `locked: 0 more national pts (she has 0 of 0)` |
  | W35 / W50 / W75 / W100 / Slam | week 23, age 14 | `0 / 0 international pts` | same shape |
  | WT125 / WT250 / WT500 / WT1000 | week 76, age 15 | `64 / 0 international pts` | `locked: **-64** more international pts (she has 64 of 0)` |

  ⭐ **HIS 163 IS THE SAME ROW AT A BIGGER JUNIOR BOOK.** The tooltip is worse than the chip: the
  arithmetic goes NEGATIVE.

  **THE CAUSE.** Since PR-09 / TB-05 the ENGINE's refusal decides whether `tierState` calls a rung
  locked, and an acceptance-list rung is refused on a **rank** (`rankToEnter`), never on points. The
  points arm then fell back to the tier's own `enterPointBand[0]`, which is `0` on every acceptance
  rung – so it printed her book over a threshold that does not exist. ⚠ **It is a regression the
  projection introduced**: before the refusal existed, `bandLocked` was `bandPoints < 0` = false on
  those rungs, so they fell through to the acceptance arm and read «Opens in the top 700».

  **THE FIX.** `refusedOnRank` (a `locked` refusal carrying `rankToEnter` and no `pointsToEnter`)
  routes to the acceptance arm instead of the points arm. The rung is still LOCKED – `isTierOpen` is
  false either way, no rung opened – and the chip is the string that arm **already** printed for this
  state, so no new wording enters the app: `Opens in the top 700`. The tooltip becomes the ENGINE's
  own `detail` («World Tour 35 takes the top 700 – she has no professional ranking yet»), which also
  names the right table: the arm's fallback sentence says "her international ranking" for every rung,
  true of the J rungs it was written for and false of the W ones.

  ⭐ **IT CLOSES THE W15 CASE `tierState.ts`'s OWN NOTES DESCRIBE, from the far side.** Their fix was
  `engineOpen === true` short-circuiting the band; what stayed live was the engine holding W15 SHUT
  on the junior RESERVED PLACE – `rankToEnter`, no `pointsToEnter` – where the plaque priced her book
  against W15's 120 and never mentioned the place. Same arm, same repair. This is the **fifth**
  occurrence of that family and the notes now name it.

  After: `tools/r34-zero-lock.ts` reports **0** distinct (preset, rung) pairs printing a requirement
  of zero, against 11 rungs before. Evidence: `tests/round34-ladder-plaques.test.ts` – the
  reproduction at his own numbers, a sweep over every rung x six books that fails on `/ 0 `, on
  `of 0)` and on any negative distance, the W15 reserved-place arm, and two non-regression arms (a
  genuine points refusal still prints `112 / 150 national pts`; a lock with NO distance is still
  «Outgrown», round 28 #12's arm). ⚠ Mutation-verified: reverting the one boolean reddens 3 arms.

- [x] **7. «в 18 лет предлагают подписать копеечные контракты на 2 и 3 года … в фильме Финальный
  сет показывали, что игроку на 240 месте в мире предлагают контракты за 5к за каждый сыгранный матч
  с нашивкой спонсора. У нас сейчас 5000-12000 в год да ещё и на расцвет карьеры. Давай
  пересмотрим»** – **measure, then balance**. With **11**, **12** and **13** this is one subject.
  – `[x]` **SHIPPED – A FIFTH BAND AT ≤400, AND THE ≤200 ROW LIFTED TENFOLD.** His approved table,
  built cell by cell and generated back out of `ECONOMY` by a test so a later edit cannot move it
  quietly (`tests/round29p2-ladder-monotone.test.ts`, «ROUND 34 – THE BAND TOTALS ARE THE OWNER'S OWN
  TABLE»):

  | band | per deal-year, all categories | what changed |
  | --- | --- | --- |
  | 201–400 | **$200,000** | new: clothing $120,000 + drinks $80,000, everything else shut |
  | 101–200 | **$450,000** | the four open cells x10, their shape preserved to the cent |
  | 51–100 | $1,100,000 | untouched |
  | 11–50 | $2,600,000 | untouched |
  | top 10 | $9,200,000 | untouched |

  ⭐ The two cliffs are gone and both are asserted: there is a shelf below #200 at all, and the step
  from #101 to #100 fell from **24x to 2.4x**. A rank-300 career now receives a drinks letter at the
  ≤400 cell and a rank-401 receives nothing (`tests/ad-offer.test.ts`, «THE SHELF NOW REACHES #400»).

  **THE TWO HAZARDS, BOTH RE-VERIFIED RATHER THAN ASSUMED.**

  * **The index shift is safe for saves – confirmed.** `AdOfferTerms` carries nine fields and none of
    them is a band index (`tier`, `category`, `termYears`, `brand`, `trade`, `cashCents`, `termWeeks`,
    `shootCount`, `shootWeeks`); `adTermsForCategory` spends the index at construction and freezes
    `cashCents` and `bands[band].shootWeeksPerYear` as VALUES. Nothing persisted moves.
  * **The kit ladder is NOT disturbed – confirmed by grep and now by a test.** `tour` / `premium` /
    `icon`'s `maxWtaRank` are literals in `ECONOMY.sponsorship`; no code path reads `advertising.bands`
    into the kit ladder or the reverse (`git grep advertising -- offers.ts equipment.ts world/sponsors.ts
    world/kit.ts` finds only advertising's own call sites). The monotone test now pins
    `[tour, premium, icon].maxWtaRank === [200, 50, 10]` beside the band list, so a future prepend that
    DID disturb them reddens.

  **⚠⚠ WHAT THE APPROVED CELLS BROKE, AND WHAT IT COST TO REPAIR.** The per-category ladders are no
  longer monotone – clothing pays **$120,000 at ≤400 against $50,000 at ≤200**, drinks pays **$80,000
  at both**, and the tenfold lift put watches at **$200,000 at ≤200 as well as at ≤100**. That is the
  approved table and nothing about it was changed. But it falsifies the premise `adBandOfTerms` was
  written on – «the ladders are strictly increasing wherever they are not null» – and that function is
  how a delivered shoot finds its band in the fame floor. A plain walk from the top read a $120,000
  clothing letter written at ≤400 as a **≤100** letter. Repaired by matching the cheque EXACTLY first
  (strongest match wins, which is the shipped rule unchanged) and keeping the old walk only as the
  fallback for a legacy fee that is nobody's cell.

  ⚠ **One ambiguity is left standing and is his to close.** A new ≤400 **drinks** letter states
  $80,000, which is also the ≤200 cell, so it reads back one rung high. Nothing on the paper can tell
  them apart – round 32 #5's design is that the cheque IS the record of the band – and the cost is
  bounded to one rung of `fame.shootFloorByBand`, i.e. 0.01 of a fame point per delivered shoot.
  Closing it means storing the band on `AdOfferTerms`, which is a save-schema move. Pinned by name in
  `tests/round32-brand-inertia.test.ts` so a third collision cannot appear silently.

  **⚠ TWO FIGURES THE PREPEND FORCED THAT HE NEVER SAW.** `ECONOMY.fame.shootFloorByBand` and
  `shootFloorHalfLifeByBand` are indexed BY the advertising band, and both had four entries. Left at
  four, the new top index would have read `undefined` – `?? 0` – and **the global house's shoots would
  have started buying zero fame**. Both gained a fifth rung; the four shipped values are unchanged to
  the digit and simply moved one index right. The new ≤400 rungs are **0.03** and **13 weeks**. The
  0.03 is not free choice: 0.02 (the ladder's own first difference continued down) stretches the whole
  ladder's span from 2.75x to 5.5x and breaks round 32 #5's measured «a global house, not a hundred of
  them» bound of 4x; 0.03 holds it at 3.67x and leaves the span above the round-32 anchor identical.
  The criterion set the constant. **Both are his to overrule.**

- [~] **8. «на 18 она просит свой счёт в банке, а что будет если отказать? … Можно как-то обыграть,
  например если отказали – она сама пошла и открыла и на морали/отношениях отразится (это в
  бэклог)»** – **answer** what refusal does today; the moral/relationship version is **his own
  backlog instruction**.

- [x] **9. «Если отпуск назначен, то на карточке турнира в сезоне надо убрать Exhausted … Или
  считать из отпуска восстановится ли и тогда убирать Exhausted»** – **build**. ⭐ He named the
  better of the two himself: compute the recovery, do not just hide the word.
  – `[x]` **SHIPPED – COMPUTED, NOT HIDDEN.**

  **WHAT WAS WRONG.** `availabilityStatus` reads the INJURY window at the **event's** week (R10-17
  fixed that in July) and read her CONDITION at **today's**, with a note saying why: a future
  condition is unknowable. That is true of an ordinary week and false of a booked holiday – a
  holiday week is a HARD BLACKOUT, so it cannot turn into a match week, and `resolveVacation` pays
  its package gain unconditionally. So the one number in the future that IS knowable was the one
  being ignored, and a card three weeks out said «Exhausted» over a week away the family had already
  paid for.

  **THE FIX.** `bookedRestGainBetween(world, week)` sums the `conditionGain` of the holidays booked
  **strictly between** now and the event, and the fatigue caution is decided on `condition + that`.
  ⚠ **It deliberately UNDER-counts**: a holiday week also earns the ordinary free-week recovery, and
  so does every quiet week in between, and none of that is added – those weeks are the unknowable
  kind, and a forecast that over-claims takes the warning off a card she really does arrive tired to.
  Under-counting fails the safe way (the word stays). ⚠ The DOCTOR'S VETO is **not** given the
  forecast: it is a refusal about a body that is not cleared today, he asked about the Exhausted
  caution, and a medical floor lifted by a holiday that has not happened would be the game promising
  clearance it cannot give.

  **EVIDENCE – BOTH ARMS** (`tests/round34-exhausted-holiday.test.ts`), at `national` (floor 40) with
  her at 25, tired but cleared (the doctor's floor is 15):

  | booked | arrives at | card |
  | --- | --- | --- |
  | nothing | 25 | **Exhausted** – unchanged, byte for byte |
  | `staycation` (+10) | 35 | **Exhausted stays** |
  | `grandma` (+18) | 43 | **word gone**, level `ok` |
  | two staycations (+20) | 45 | **word gone** – it is the arithmetic, not a flag |
  | `grandma` booked AFTER the event | 25 | **Exhausted** |

  **MUTATION-VERIFIED IN BOTH DIRECTIONS, which is the point of two arms.** Zeroing the gain reddens
  the «does restore» arm only; implementing his FIRST phrasing instead – hide the word whenever a
  holiday exists – reddens the «does not restore» arm only. A one-armed test passes both. ⚠ No copy
  changed: «Exhausted – racing risks injury.» is untouched, and a family that books nothing takes a
  path that is character-for-character what it was.

- [x] **10. «Мне не нравятся жирные буквы на главной жёлтой кнопке, сделай обычные пожалуйста. А
  может быть мне кажется и там две кнопки или надписи рисуется вообще? Проверь пожалуйста»** –
  **build** plus a **reproduce**: he suspects a doubled label.
  – `[x]` **SHIPPED. THE ANSWER TO HIS QUESTION IS ONE BUTTON AND ONE LABEL – ⭐ BUT HE WAS SEEING
  SOMETHING REAL, AND IT HAS A NAME.**

  **THE COUNT – the reproduction he asked for.** The whole `App` shell mounted on Home at 375x667,
  counted over the entire document, not over one component's subtree:

  | counted | on screen |
  | --- | --- |
  | `.next-week-bar` – the floating bar | **1** |
  | `.next-week-btn` – the yellow button | **1** |
  | controls wearing the app's lime `.primary` | **1** of 15 buttons on screen |
  | leaf elements anywhere printing that exact label | **1** – the button itself |
  | the button's own child nodes | **1**, a text node; no `::before`/`::after`, no `text-shadow` |

  ⭐⭐ **WHAT HE ACTUALLY SAW.** Manrope is self-hosted at 400 and 500 ONLY (`public/fonts/`). The
  button was computing **600**, which has no real face, so the renderer emboldens the 500 one – and
  synthetic bold thickens a stroke by drawing it AGAIN, offset. One label, drawn twice by the
  rasteriser. «Мне кажется» was not imagination and it was not a second button; the regular weight
  ends it, because 400 is a face that actually ships.

  ⚠⚠ **AND THE `font-weight: 800` IN THE SHEET HAD NEVER APPLIED.** The element is
  `<button class="primary next-week-btn">`: `button.primary` is specificity 0-1-1, `.next-week-btn`
  is 0-1-0, so the weight the player has been reading all along is `button.primary`'s **600**, not
  the 800 the stylesheet appeared to promise. Measured on a mount, not deduced. The dead declaration
  is DELETED rather than edited – a rule that loses its own cascade tells the next reader a number
  the screen never used – and the new weight is declared at `button.next-week-btn`, the smallest
  selector that can win without touching `button.primary` itself: twelve files of affirmative
  buttons hang off that rule and he named exactly one button.

  **THE BUILD:** `font-weight: 400`, which is CSS `normal` and the literal «обычные». ⚠ 500 is one
  step away if he wants a touch more body in it – one number, say the word.
  ⚠ `PrimaryPill`'s `.tb-pill--cta` keeps its 800 on purpose: a different button, on TournamentFlow,
  EndingScreen and the wizard, and it never renders on Home.

  ⚠ **THE ONE STATE WHERE THAT BAR HOLDS TWO CONTROLS IS HIS OWN.** On a long injury layoff the span
  pill stands to the LEFT of the CTA – round 26 #1, «давай сделаем ее во-первых слева от основной».
  Two controls, still one yellow button: the pill is the outline variant deliberately (one CTA per
  screen). Asserted in that state too, so the answer holds in both.

  Evidence: `tests/component/round34-home-type.test.ts` – 7 mounted arms, including `assertRowFits`
  at 375x667 in BOTH bar states (round-20 #3). ⚠ Mutation-verified: demoting the new rule back to
  `.next-week-btn` reddens 3 arms; the count arms clone the button and inject a bare second label
  into the live document and watch both counts move, so a real double could not hide from them.

- [x] **11. «129 место в мире, тот же контракт на 12к в год на 3 года. Не верю»** – with 7/12/13.
  – `[x]` **ANSWERED BY THE ≤200 LIFT (item 7).** A #129 stood in the ≤200 band and the whole shelf
  there was worth $45,000 a year – watches $20,000, cars $12,000, drinks $8,000, clothing $5,000. The
  same shelf now writes **$450,000**: $200,000 / $120,000 / $80,000 / $50,000, the shipped row times
  ten with its shape preserved to the cent. The «12к в год» letter he did not believe was the cars
  cell; it is $120,000 now.

- [x] **12. «99 место в мире, тот же контракт на 20к в год на 2 года»** – with 7/11/13.
  – `[x]` **ANSWERED BY THE SAME LIFT (item 7).** A #99 is already in the ≤100 band, where he ruled
  nothing was to be touched – «Про 50–100 отвечаю прямо: пересматривать не надо» – so the $20,000 he
  was reading at #99 was **not** that band's cheque. It was the ≤200 watches cell arriving at a
  standing that had since climbed past it, and the letter's terms are frozen at arrival by design (the
  snapshot rule): a paper written at #150 states $20,000 for its whole term however high she goes. Two
  things follow, and both are now true: the ≤200 watches cell is $200,000, so the same letter written
  today is ten times the cheque; and the ≤100 shelf it graduates into is unchanged at $1,100,000 a
  year. ⭐ Nothing above the top 100 moved, which is his ruling honoured to the cent.

- [~] **13. «А 100 позиции и выше это как раз Бублик с его кучей спонсоров. Хотя может быть для
  нашего масштаба наша система нормальная, цифры только на первом тире и условия не очень, надо
  разумно сделать»** – ⭐ his own hedge: the ladder may be right in shape and wrong at its foot.
  – `[~]` **HIS HEDGE WAS RIGHT, AND IT IS WORTH SAYING SO PLAINLY: the shape is sound, the foot was
  broken.** «Может быть для нашего масштаба наша система нормальная, цифры только на первом тире и
  условия не очень» – that is exactly what the measurement found. The ladder's DESIGN – one live deal
  per category, the shelf's shape constant at every band, the cheque the only axis that scales, 2.4x /
  2.4x / 3.5x steps above the top 100 – is the round-29 part four design and not one line of it was
  touched. What was wrong was two rungs at the bottom: nothing at all below #200, and a 24x jump on a
  single ranking place from #101 to #100. Both are fixed under item 7; everything he suspected might be
  «нормальная» is, and stayed.

- [?] **14. «Календарь сезона надо ещё раз переделать … на 105 месте доступны 50, 250, 500 и шлемы,
  при этом нет 75, 100 и 125. Мне кажется, они прячутся на тех же неделях… Предлагаю с повышением
  ранга заменять более низкие турниры в сетке более высокими… они не конфликтуют в сетке, а
  заменяются динамично один другим видом»** – **measure, then design**. ⚠ The largest item in the
  round and it touches the calendar the last three rounds worked on.
  – `[?]` **MEASURED IN FULL. HIS DIAGNOSIS IS CONFIRMED TO THE TIER. HIS REMEDY IS ALREADY SHIPPED
  AND IS THE MECHANISM PRODUCING THE SYMPTOM – so nothing was built, and the two candidate designs
  are below for him to rule on.**

  **THE MEASUREMENT** (`tools/r34-calendar-tiers.ts`): careers walked to WTA #95–#117 at a season
  start, then ONE FULL SEASON recorded week by week through the shipped predicates the two calendar
  surfaces use – `toSnapshot` for the cards, `feedContext` / `feedShows` / `preferredWeekEvent` for
  the row – so the table cannot disagree with the screen. Six seasons that stayed outside the top 50
  (a seventh climbed to #15 and is excluded: play-down then shuts W50–W100 and it measures a
  different player).

  | rung | generated / season | SHOWN by the calendar | share | rows a season |
  | --- | --- | --- | --- | --- |
  | WT500 | 10 | 60 of 60 | **100%** | 10.0 |
  | W50 | 12 | 31 of 72 | 43% | **5.2** |
  | WT250 | 8 | 30 of 48 | 63% | **5.0** |
  | Slam | 4 | 24 of 24 | **100%** | 4.0 |
  | WT125 | 4 | 20 of 24 | 83% | 3.3 |
  | W75 | 8 | 18 of 48 | 38% | 3.0 |
  | W100 | 4 | 12 of 24 | 50% | 2.0 |

  ⭐⭐ **THE CUT FALLS EXACTLY WHERE HE PUT IT.** Ordered by rows a season, his «доступны» set
  {50, 250, 500, шлемы} is the top four and his «нет» set {75, 100, 125} is the bottom three, in
  order. ⚠ Note it is ROWS and not share that reproduces his reading: W50 is the second least
  visible rung by percentage and he still sees it, because 43% of twelve is more cards than 83% of
  four.

  ⭐ **AND «ОНИ ПРЯЧУТСЯ НА ТЕХ ЖЕ НЕДЕЛЯХ» IS EXACTLY THE MECHANISM.** Every missing row is a
  same-week loss, recorded by the thief. One season, week by week (elite seed 0, w468, age 22,
  WTA #111 – `gen` is every event the engine put on the week, strongest first):

  ```
  w470  gen [Slam W75 J30 Regional Local]              shown Slam
  w476  gen [WT1000 WT125 W75 W35 W15 J30 Local]       shown WT125
  w483  gen [WT500 W75 J60]                            shown WT500
  w489  gen [Slam WT250 W75 Regional Local]            shown Slam
  w494  gen [Slam W75 W50 W15 J300 J60 J30 Local]      shown Slam
  w502  gen [Slam W75 W35 W15 J60 J30]                 shown Slam
  w506  gen [W75 W50 W35 J30 National]                 shown W75   <- the only one
  w512  gen [WT125 W75 J300 J60]                       shown WT125
  ```

  ⚠⚠ **AND THE HALF HE DID NOT NAME, WHICH IS THE BIGGER NUMBER: 12 of the 48 eventful weeks show
  her NOTHING** (w474, 477, 480, 481, 488, 491, 493, 499, 504, 505, 509, 516). Every event on those
  weeks is a rung she has outgrown (W15/W35 play-down-barred at #111, the J rungs age-shut at 22, the
  domestic three shut on the pro table) or one she cannot reach (WT1000 takes the top 65). So the
  season is not short of tennis – it carries ~50 events she may enter across 48 weeks – it is
  **badly distributed for her rank**: a quarter of her weeks are empty while a quarter stack two to
  four rungs she could play and only one survives.

  **⚠⚠ WHY NOTHING WAS BUILT.** «Заменять более низкие турниры в сетке более высокими с повышением
  ранга» is `preferredWeekEvent`'s third tiebreak, shipped 05.08/06.08 and measured in
  `docs/specs/ladder-floor-2026-08.md` §2: on a stacked week the row shows the ENTERED event, else
  the one she may actually ENTER, else the **highest rung** – so as her rank rises the taller rung
  takes the slot and the lower one is replaced. That rule IS the thing hiding his W75. Building it
  would be building the cause, and the brief's own instruction is to stop and report rather than
  invent a third design.

  **THE REAL CAUSE, for whichever design he picks.** The three anchored rungs – Slam `[2,21,26,34]`,
  WT500 `[4,10,15,19,24,28,33,39,43,47]`, WT1000 `[5,8,12,18,31,37,41,45]` – claim **22 of the 49
  playable week-offsets, the same offsets in every world for ever**, before a single cadence rung is
  placed. `buildSeason` then places the cadence rungs by `tierPhase` + jitter with no knowledge of
  the anchors, so a rung with 4–8 events a season loses roughly half of them to a taller rung on the
  same week – and the sparser the rung, the fewer survive. That is the same fixed-grid failure
  `tierPhase`'s own note records and fixes for the cadence rungs; the anchors reintroduced it.

  **THE TWO DESIGNS, AND WHAT EACH COSTS – his call:**
  - **(A) SUPPLY.** Place a cadence rung away from weeks already claimed by a taller one («они не
    конфликтуют в сетке»). ~6 lines in `buildSeason`. ⚠ It changes `world.season`, so the AI field
    and the season RNG stream move → invariant 5 wants a bench and a spec, and it partly reverses his
    own ruling recorded in `calendar.ts`: «ONE EVENT PER TIER PER WEEK, NOT ONE EVENT PER WEEK … with
    J-tiers, empty weeks stop being boredom and become CHOICE». Existing saves keep their dealt
    blocks (`ensureSeason` never re-deals), so only future seasons change.
  - **(B) DISPLAY.** Let a week that stacks several rungs she may enter offer more than one card.
    ⚠ It is NOT what he proposed – he asked for them not to conflict – and it retires R15-9's
    one-row-per-week rule that rounds 31/32/33 all built on.

  ⚠ A generation-time fix cannot be rank-aware (a year block is dealt once, and her rank moves
  through the season) and a rank-aware fix cannot be at generation time – which is why (A) and (B)
  are genuinely different games rather than two spellings of one.

- [x] **15. «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она не должна
  меняться, просто новое поступление будет меньше»** – **reproduce**, then build.
  – `[x]` **REPRODUCED, THEN SHIPPED. IT IS AN AMOUNT, NOT A RATE, AND HE IS EXACTLY RIGHT.**

  **THE REPRODUCTION** (`tools/r34-savings-income.ts` – $100,000 opened, held ten years through the
  real engine, then half taken out with the real `sellAsset`). The card carries three numbers that
  could be read as «доход», and the walk prints all three so the numbers say which one he saw:

  | what the card says | before the withdrawal | after |
  | --- | --- | --- |
  | «Gains about 3% a season» (`annualRatePct`) | 3% | 3% – a RATE, and it did not move |
  | «Brings in $N a week right now» (`incomeCents`) | $0 | $0 – zero on a deposit by design |
  | **«+$36,626 since they bought it (37%)»** (`changeCents`) | **$36,626** | **$18,313** |

  So it is the lifetime-gain AMOUNT, and it was being recomputed from the balance that REMAINS:
  `changeCents = valueCents − paidCents`, and a part sale scales both by the same fraction. The
  family was not poorer – the $68,313 was in the wallet – but the card answered «what is the gain on
  what is still held» to a sentence that asks «what has this earned».

  **THE FIX.** `sellAsset` already computes both halves of the part that leaves for its own ledger
  sentence (`deltaCents` = the realised gain, `costSoldCents` = what it cost). They are now kept on
  the row (`realisedGainCents`, `realisedCostCents`), and the card reads
  `valueCents − paidCents + realised`. The same walk now prints **$36,626 → $36,626, moved by $0**.
  ⚠ The PERCENTAGE needed the second field or the fix would have moved the number he did not
  complain about: `paidCents` is the cost of what is still held, so a lifetime gain over it alone
  would have jumped 37% → 73% on the same withdrawal. Over lifetime cost it holds at 37%.

  ⭐ **HIS SECOND CLAUSE NEEDED NOTHING** – «просто новое поступление будет меньше» is what the
  engine already does. The tool prints the halved balance accruing **$41** in the week after the
  withdrawal, and it is now PINNED rather than left as an observation: an arm asserts the week's
  accrual falls after a part sale, and that doubling it returns the full-balance week's figure.

  ⚠ **NOT A SCHEMA MOVE, ON THIS REPO'S OWN RULE** (`gearRestWeeks?`, `shootClashAccepted?`,
  `WorldEvent.entryRef`): both fields are optional and ABSENT means exactly what every save written
  before today means – no realised gain recorded – so an in-flight career reads the figure it read
  yesterday, to the cent, and starts remembering from its next withdrawal. Asserted rather than
  assumed, in its own arm.

  Evidence: `tests/round34-savings-income.test.ts` (6 arms: the reproduction as an assertion, the
  percentage, the realised+unrealised identity, a realised LOSS staying realised, backwards
  compatibility, and his second clause) + a mounted arm in
  `tests/component/round34-money-shelf.test.ts` that the SENTENCE on the card does not move.
  ⚠ Four-mutation ledger in the test header; the four verdicts differ from one another, which is
  what says the arms measure different things. `tests/round29p2-part-sale.test.ts`'s identity was
  **re-aimed, not loosened** – it read «the unrealised half and nothing else», which is the defect –
  and gained a non-vacuity arm so it cannot pass by both sides being zero.

- [x] **16. «Business пододвинуть к Invest в магазине»** – **build**, ordering only.
  – `[x]` **SHIPPED.** `SHELF_TAB_OPTIONS` in `MoneyScreen.vue` now reads Invest / **Business** /
  Cars / Property / Water / Air. Only the ORDER moved: every label, title and the tab-to-family map
  are untouched (invariant 4 – he asked for a position, not a word), and `SHOP_FAMILIES` is
  deliberately NOT reordered with it, because that array is the order INSIDE a tab (it is what puts
  the brand above the academy under Business) and nothing on screen reads it across tabs.
  Evidence: two mounted arms in `tests/component/round34-money-shelf.test.ts` – the rendered pills
  put Business at `indexOf('Invest') + 1`, and pressing the moved segment still opens
  `The business` + `Her academy`, so an order change that quietly repointed a tab is caught too.
  `tests/component/shelf.ts`'s `SHELF_TAB_LABELS` re-aimed with a ⚠ note; `round30-subtabs.test.ts`
  reads that constant and still fails the moment the screen and it disagree.

- [x] **17. «89 место доход опустился с 200 до 65 долларов в неделю с бизнеса… Она доходит в Шлеме
  до QF и вообще стабильно в 100 держится, плюс есть мощные рекламные контракты… мне кажется нам
  надо улучшить формулу рассчета доходности и стоимости ее бренда»** – **measure**. ⚠ Round 32
  reworked exactly this; a fall from $200 to $65 while she is top-100 is either the fame decay
  working as designed or a defect the rework introduced. Must be read off HIS save.
  – `[x]` **SHIPPED IN THREE PARTS – F1 finals pay fame, F2 the season ladder reaches below the top
  100, F4 the brand follows the contracts. Read off his own save through the game's own import door
  (`tools/r34-brand-foot.ts`, read-only, never copied into the repo).**

  **WHERE SHE ACTUALLY STANDS**, week 569: WTA **#113**, eleven seasons banked, eight of them carrying
  a WTA end-rank – **#349, #177, #95, #92, #89, #93, #97, #113**. Fame **8.925**, the brand taking
  **$244** a week and priced at **$76,822** on a multiple of **6.04x**. Live sponsor deals worth
  **$550,000** a year.

  **F1 – A LOST FINAL PAYS 40% OF ITS TIER'S TITLE, on the title clock.** `trophiesByTier[tier]
  .finals` has been a dated, per-tier, never-pruned ledger since schema v31 and NOTHING read it except
  at 'slam'. His save carries **16** runner-up plates worth exactly zero – 5 local, 2 regional, 1
  national, 1 w15, 4 w50, 2 w100, 1 wta125. Eight of them are at tiers `fame.titleFloor` names and
  therefore pay; the domestic eight stay at zero, because the world does not read those draws, and his
  approved target reproduces on exactly that reading:

  | | before | after | approved |
  | --- | --- | --- | --- |
  | fame | 8.925 | **10.258** | 10.3 |
  | weekly | $244 | **$323** | $323 |
  | worth | $76,822 | **$104,044** | $104,044 |

  ⭐ To the cent on two of the three. `fameEventWeeks` gained the finals as well, or `brandStrengthAt`
  would have walked a list that no longer holds every week fame can rise on.

  **⚠⚠ THE `finalX` DECISION, WITH THE MEASUREMENT, because the brief asked for it explicitly. IT
  STAYS.** `business.merch.value.finalX` prices the same finals into the valuation MULTIPLE and has
  since round 30 #24, so after F1 a lost final moves the income AND the multiple – exactly as a title
  has since round 32 #3. The test for a double-count is the corridor round 32 repaired the free float
  to, and it passes: **with both terms live the multiple reads 6.20x**, inside 6–9x. Held out, it
  drops to 5.40x and the worth to **$90,614** – against the **$104,044 he approved**. His own approved
  figure was therefore measured with `finalX` live, so the approved figure is the ruling. Nothing was
  removed and nothing shrank.

  ⚠ Slam finals are excluded BY NAME, not by arithmetic: `slamFinalFloor` (12) already pays that plate
  and pays more than the share would (0.4 x 25 = 10). Two arms in `tests/round29p5-business.test.ts`
  fail if either half breaks – one if finals stop paying, one if a second Slam final ever adds
  `slamFinalFloor + the share` instead of `slamFinalFloor`.

  **F2 – THE SEASON-END LADDER REACHES BELOW THE TOP 100.** `academy.reputationBands` gained
  **top-150 +0.05** and **top-250 +0.025**, and the flat career cap of 4 became **4 + 0.5 per
  professional season played**. On his save the ladder picks up two seasons it could not see – #113
  (top-150) and #177 (top-250) – so his reputation goes **1.500 -> 1.575**.

  ⚠⚠ **THE CAP MEASUREMENT HE ASKED FOR, AND IT SAYS THE CAP STOPS BEING A CAP.** The bands add at
  most 0.6 a season, so the ceiling only overtakes the ladder when `1 + 0.6n > 4 + 0.5n`, i.e. past
  **thirty** professional seasons:

  | professional seasons | cap (4 + 0.5n) | most the ladder can reach (1 + 0.6n) | does the cap bind? |
  | --- | --- | --- | --- |
  | 5 | 6.5 | 4.0 | no |
  | 10 | 9.0 | 7.0 | no |
  | 12 | 10.0 | 8.2 | no – it used to sit ON the old flat 4 |
  | 20 | 14.0 | 13.0 | **no** |
  | 31 | 19.5 | 19.6 | yes, first |

  ⭐ So it does not run away – the ladder holds it well under the ceiling at every career length the
  engine can produce – but the ceiling is no longer what holds reputation. The band ladder is.
  ⚠ **AND IT MOVES A WINDOW HE DID NOT ASK ABOUT.** `academy.stageIncomeCents` was sized so the $12M
  academy repays in 5–10 seasons at the cap; that window is reputation **3.18–6.37**, and nine top-10
  seasons now reach 6.4. A long elite career repays the academy in under five seasons. Not compensated
  for here – the figure is his – and pinned by name in `tests/round29p5-business.test.ts`.

  **F4 – THE BRAND FOLLOWS THE CONTRACTS: +1 reach per $50,000 of LIVE annual contract value, capped
  at +30.** Fed into `brandReachOf` as a signal and into nothing else: her sponsor money already
  arrives through the deals themselves, and a second line in the brand's income would pay one contract
  twice. It is added OUTSIDE the `max(fame, retention x strength)` – a contract is current form and
  has no business raising a career's high-water mark – and the total is clamped at `ECONOMY.fame.cap`,
  so round 32 #3's ceiling cannot move. `baseX` and the fame³ slope were not touched.

  His approved row reproduces:

  | | fame | weekly | a year | worth | multiple |
  | --- | --- | --- | --- | --- | --- |
  | approved: his shape, $1M of deals, own fame 8.9 | 8.9 -> 28.9 | $2,600 | $135,000 | $1,130,000 | 8.4x |
  | measured | 8.9 -> **28.9** | **$2,567** | **$133,479** | **$1,113,823** | **8.34x** |

  ⭐ Inside 1.5% on every money column and inside the 6–9x corridor, so the free-float defect does not
  return.

  ---

  **⚠⚠ FOUR FIGURES OF HIS THAT MY MEASUREMENT CONTRADICTS. Reported, not adjusted.**

  1. **«Vera #144» is wrong; she is #113.** `kidRankWta` reads 113 at week 569 and her last banked
     season ended #113. Nothing was built on the 144, so nothing moved – but the approved section says
     it twice and it should be corrected before it is quoted again.
  2. **«a decade of top-150 tennis has earned her 0.27 in total» is wrong; it is 0.500.** Five of her
     seasons ended inside #100 and each paid the ladder's lowest rung, **+0.1**. The two new rungs
     take that to **0.575**, not from 0.27. The case for the change is unaffected and is if anything
     sharper: three of her eleven seasons ended below every rung the ladder had.
  3. **F4's first row cannot be produced by the shipped income curve.** «top-100, $600k of deals, own
     fame 6» gives fame **18 exactly**, which reproduces – but the weekly at reach 18 is
     `perFamePointCents x 18² / famePivot x crowdMult` = **$972 x crowdMult**, and `crowdMult` is
     clamped to [0.9, 1.15]. **The most the curve can pay at reach 18 is $1,118 a week**, against the
     approved **$1,350** – 17% short, and no career shape can close it because every other signal
     reaches the income only through the crowd tilt. $1,350 corresponds to a reach of ~21.2, i.e.
     $750,000 of deals rather than $600,000. ⚠ The mechanic is built as approved; it is the money
     column of that one row that the arithmetic will not produce.
  4. **«his save, $1M of deals» is not his save's present state.** At week 569 his LIVE annual
     contract value is **$550,000** – drinks $150,000 (to w572) and cars $400,000 (to w658). The
     $1,000,000 was his shelf through weeks **404–452**, when the airline, drinks, cars and watches
     ran together. The approved row reproduces as a SCENARIO at $1M (table above); applied to the save
     as it stands today the term is +11, and his brand reads fame-signal **19.9**, **$1,218** a week,
     **$462,972** and **7.31x** – still a sixfold repair of the $244 he complained about, and still
     inside the corridor.

  **AND THE COMPLAINT ITSELF, ANSWERED.** «доход опустился с 200 до 65 долларов в неделю» is the fame
  half-life doing exactly what round 29 designed it to do on a career whose fame the model could
  barely see: eight professional seasons, five of them inside the top 100, sixteen finals and a
  million dollars of sponsor paper, adding up to a fame stock of 8.9. All three parts of this item
  attack that one number rather than the payout curve. Together on his save, at his real $550,000 of
  live paper: fame signal **8.9 -> 21.3**, weekly **$244 -> $1,386**, worth **$76,822 -> $538,030**,
  multiple **6.04x -> 7.46x**.

- [x] **18. «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую,
  как с тренером делали»** – **build**.
  – `[x]` **SHIPPED, AND IT IS LITERALLY THE COACH'S FRAME.** «как с тренером делали» is the half
  that decided the implementation: he is naming round-21 #11, so `.shop-row.is-owned` carries
  `.cm-row.current`'s own three declarations – `rgba(var(--accent-rgb), .07)` behind it,
  `border-color: var(--accent)`, and the `box-shadow: 0 0 0 1px var(--accent)` ring that makes it
  read as a FRAME rather than a hairline. One `--accent`, not a second convention: move the token
  and the coach she has and the things they own move together. ⚠ An outer shadow paints outside the
  border box, so a framed card and an unframed one still line up in the feed – round-21 #11's own
  reasoning, reused rather than rediscovered.
  ⚠ The predicate is the CARD'S OWN (`row.valueCents !== null`), which is already what decides
  whether the card draws its owned half or its shop window – so a rung can never be framed and
  priced at the same time, and there is no second definition of «owned» to keep in step.
  ⚠ No word, price or control moved with it.
  Evidence: three mounted arms in `tests/component/round34-money-shelf.test.ts`, one of which reads
  the shipped `.cm-row.current` through the real cascade and compares all three values, and one of
  which walks all six segments to assert **framed on screen == owned in the engine**. Mutation
  ledger in the header: deleting the CSS reddens the paint arm alone, and widening the predicate to
  `true` reddens all three for three different reasons – a frame that means nothing is caught as
  loudly as a frame that is missing.

- [x] **19. «для индексного фонда давай график нарисуем с точками его стоимости за пай с
  возможностью выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной
  цифре за месяц средней»** – **build**, and ⚠ storing a monthly figure is a schema move.
  – `[x]` **SHIPPED – AND ⚠⚠ IT IS NOT A SCHEMA MOVE AFTER ALL. NOTHING IS STORED, AND THE TRIAGE
  LINE ABOVE IS WRONG. THIS NEEDS THE OWNER'S EYE.**

  **WHY.** `unitPriceCents(seed, week, item)` is a PURE function – its own header says «Pure: no
  world, no MAIN draw, no clock» – because `world/market.ts` was built on one load-bearing idea:
  «**THE MARKET EXISTS WHETHER OR NOT SHE BUYS** … a path drawn from the career's seed alone, READ
  at the weeks a holding spans rather than DRAWN when one is opened». So **every past week's price
  is computable from the seed**, and the monthly series he offered to store is derivable. His
  sentence «мы же сможем хранить» was answering an objection about COST; on this engine the chart is
  cheaper than that.

  **WHAT DERIVING IT BUYS, and the first one is what decided it:**
  * ⭐ **HIS OWN LIVE CAREER OPENS ON A FULL CHART.** Vera is at week 569. A stored series starts
    EMPTY, so he would have opened the new screen on an empty box and waited five years for the
    feature he asked for. Derived, all sixty months are there the moment he loads. Pinned in a test
    at his own week.
  * The chart cannot disagree with the card above it – both ask `unitPriceCents`. A recorded series
    is a second source of truth for a number the engine already computes, which `world/shop.ts`
    itself calls «a screen and a valuation disagreeing, this repo's most-repeated defect».
  * No migration is spent. Migrations are append-only FOREVER (CLAUDE.md item 3), so a schema
    version added for data nothing reads is a permanent cost for no benefit.

  ⚠ **THE ONE THING STORAGE WOULD HAVE BOUGHT** is a record of what the player SAW if the market
  model is ever re-tuned. `world/market.ts` has already ruled on that – «Nothing persists any of it,
  so this is a debugging convenience rather than a compatibility promise» – and a re-tune already
  rewrites what a holding is worth today (`revalueAssets` re-prices `units × price(week)` every
  tick), so a frozen chart beside a re-priced holding would BE the disagreement, not the protection.
  ⭐ **If he wants the series recorded anyway, that is one field and a migration and I will build
  it – but it should be his call, not a default.**

  **WHAT SHIPPED.** `unitPriceHistory(seed, week, item, months)` in `engine/world/assets.ts`: one
  averaged figure per **real calendar month** (`shared/dates.ts`'s own months, so the chart's axis
  and every other date on screen read one calendar), oldest first, rounded once at the engine
  boundary. Twelve months a season, so five years is **60 points** – the number his own sentence
  arrives at. On the card: the polyline, one dot a month («с точками»), a low–high span and the two
  end months, and his four windows as a picker – `6 months / 1 year / 2 years / 5 years`, the
  numbers in `SHOP_PRICE_RANGE_MONTHS` so the picker and the engine's series length cannot disagree.
  ⚠ The predicate is `ShopItem.volBps` – does this rung ride the market – so the fund he named has a
  chart, the deposit's dead-flat exponential does not (a line with nothing to read, on a card he did
  not mention), and a wilder fund added tomorrow gets one because of what it IS.

  ⚠ **A CAREER TOO YOUNG FOR A LINE GETS AN HONEST SENTENCE, NEVER A BACK-FILL.** `marketWave` is
  happily defined for negative weeks, so the real failure mode of a derived series is inventing
  history the family did not live; the walk stops at week 0. A career in its first month has one
  point and the card says «One month of prices so far – the chart starts next month.»

  ⚠ **COST, MEASURED RATHER THAN ASSUMED**, because `shopView` runs on every `toSnapshot`: the
  60-month series is **0.28 ms** and is the whole of `shopView`'s move from 0.03 ms to 0.30 ms. The
  walk is bounded by the ANSWER's size (~4.34 weeks a month, ~260 iterations) and not by the
  career's length, so a thirty-season career costs what a two-season one does. Suite A/B on the same
  machine, same shard: `bulk` **110s before, 112s after** – inside the run-to-run noise.

  Evidence: `tests/round34-fund-chart.test.ts` (10 arms – the four windows, real calendar months,
  the month's mean, determinism, retroactivity at his own week 569, nothing behind week 0, the short
  young series, and the `volBps` predicate) + six mounted arms in
  `tests/component/round34-money-shelf.test.ts`, **one per range button** (6/12/24/60 dots), the
  honest short-career line, no chart on the rungs that do not ride the market, and a `fits.ts`
  assertion that the four range controls fit a 375x667 phone. Mutation ledgers in both headers, and
  one entry is recorded because it changed NOTHING: the `Math.max(0, …)` clamp in `unitPriceHistory`
  is belt and braces, since the walk's own `w >= 0` conditions are the real floor.
  ⚠ `tests/week-numbering.test.ts`'s R11-6 guard – «no surface prints a raw absolute week» – caught
  the chart's time axis and was **re-aimed, not loosened**: `monthLabel(` joins the five shared
  formatters already on its allow-list, for the reason the list exists (it prints «Jan '31», never an
  integer), and every other spelling is still refused.
  ⚠ `npm run e2e:fixtures` re-run: byte-identical, no diff – this item stores nothing, so no fixture
  could move. ⚠ `SAVE_SCHEMA_VERSION` is untouched at 69, and no other bundle moved it either.

- [x] **20. «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»** – **build**.
  – `[x]` **SHIPPED, AND MEASURED AGAINST A PHONE.** A `.shop-stake-row` wrapper puts each control
  beside the field it acts on – «Add more, from $X» with **Put more in**, and «Take out how much…»
  with **Sell it for $X**. Nothing else moved: both keep their sentence, their `disabled` predicate,
  their command and their `v-if`. ⚠ The sell wrapper is drawn UNCONDITIONALLY so the control stays a
  single element rather than two copies behind opposite `v-if`s – a car has no amount to type and
  comes out of the row exactly as the bare button did, which is its own arm.
  ⚠ **ROUND-20 #3 IS THE HALF THAT NEEDED WORK.** `fits.ts` could only measure a `position: fixed`
  bar, so it gained `availableWidth` / `rowItemWidth` / `assertInlineRowFits` – the same arithmetic
  read against a room WALKED down the real ancestor chain, and reading a control's declared `width`
  (a form field carries no text, so the old `demandedWidth` scored `.shop-stake-input` as its
  padding). Measured at 375x667: the sell row on a $1,000,000 holding demands **285px of a 349px
  line**, so it really is one row on his phone. `flex-wrap` plus `white-space: nowrap` is what a
  bigger figure spends – a line inside the card, never the edge of the screen.
  Evidence: three mounted arms in `tests/component/round34-money-shelf.test.ts`. ⚠ The mutation that
  matters: widening `.shop-stake-input` from 8.5em to 30em with the STRUCTURE untouched reddens the
  375x667 arm and nothing else in the file – which is what says the row was measured against a phone
  and not against a desktop.

- [x] **21. «С массажистом она выздоровела быстрее после травмы, а с турнира была снята тем не менее
  и теперь на турнир не зайти, надо учитывать наличие массажиста при автоматической отмене
  событий»** – **build**. ⚠ The withdrawal is decided before the masseur's recovery is applied.
  – `[x]` **SHIPPED – AND THE ORDERING WAS THE BUG, MEASURED.**

  **THE TWO CALL SITES.** `onsetInjury` (`engine/world/injury.ts`) shortens `weeksOut` by the
  **physio's** factor, writes `world.injury`, and then sweeps the entries the layoff swallows. The
  **masseur's** shortening is paid out one week at a time by `rollInjury`, which does not run until
  the following tick. So of the two people the family pays to shorten a layoff, one was **inside**
  the withdrawal decision and the other was **after** it – the desk cancelled her tournaments against
  a return date only a girl with no masseur would ever have had.

  **THE MEASURED ORDERING, before:** at onset the sweep read `sinceWeek + totalWeeks`, i.e. the
  clinic's dealt number with zero masseur weeks taken off it, while the countdown she actually keeps
  is shorter by his cadence:

  | rung | dealt | sweep read | she is back | weeks she was pulled out for nothing |
  | --- | --- | --- | --- | --- |
  | Twice a week | 4–12 | w4 … w12 | w3 … w9 | **1–3** |
  | Every other day | 3–12 | w3 … w12 | w2 … w8 | **1–4** |
  | Daily | 3–12 | w3 … w12 | w2 … w6 | **1–6** |

  **After:** the sweep reads `weeksOut − masseurRehabWeeksAhead(world)`, which is `rollInjury`'s own
  cadence replayed forward, so the two dates are the same date and the table's last column is 0.

  ⚠ **IT IS THE RECOVERY DATE THAT MOVED, NOT THE WITHDRAWAL RULE.** The question at the release
  line is still the same R10-17 question asked of the same shared window arithmetic – there is no
  `if (masseurHired)` deciding whether an entry survives, and an event that is inside the layoff on
  BOTH readings is still cancelled (its own arm). ⚠ And the **countdown on screen is deliberately not
  rewritten**: `weeksRemaining` stays the clinic's number and his weeks keep arriving one receipt at
  a time («Rehab ahead of schedule – the masseur bought a week back»), because that is the whole
  legible difference between him and the physio. The forecast governs only the decision that cannot
  be undone later – lists close two weeks out, which is his «теперь на турнир не зайти».

  ⚠ **THE PRACTICE SWEEP BESIDE IT KEEPS THE CLINIC'S WINDOW, on purpose.** A cancelled ENTRY cannot
  be re-made once the list closes; a practice is re-bookable any week and its rental comes back in
  full. He asked about «автоматической отмене **событий**», nothing measured says a forecast belongs
  on the friendly, and the asymmetry is written down at the site.

  **EVIDENCE** (`tests/round34-masseur-withdrawal.test.ts`): scripted dice deal an 8-week layoff in
  week 10, entry for week 15 (list closes week 13). With the daily rung she is measured back in
  **week 14** and the entry **survives**; the identical injury with no masseur **still cancels it**,
  and the countdown is walked to prove she really is laid up on the day. Mutation-verified: forcing
  the forecast to 0 – the old order – reddens the "entry survives" arm alone.

- [~] **22. His save, read in full** – «посмотри пожалуйста полностью историю её перформанса, мне
  очень интересно как она себя показывает вообще относительно наших бенчмарков. Мне кажется если мы
  разберемся с доходностью бренда и прочими мелочами может вполне сносно быть играть даже с
  настолько средней по скиллам девочкой.» – **measure**. ⭐ His hypothesis is the interesting part:
  that an average girl is playable once the economy is right.

---

## APPROVED BY THE OWNER, 02.09.2026 – the numbers agents build to

⚠ Everything below was proposed with measurements, discussed, and approved verbatim: «да, всё
утверждаю, запускай волну 34». No agent may re-derive, round, or "improve" these figures. If a
measurement contradicts one, STOP and report it – do not adjust it yourself.

### A1 – the ceiling bands read TRUE realisation (items 2a/2b/2c)

`coachRoomBandOf` divides `level / (level + room)`, which counts the skill she was BORN with as
achievement. `handoverRoomBand` in the same file already does it correctly, against
`potential − startingSkills(seed, profile)`, and is the model to copy.

Measured on his save before the change: Vera hears «Close to her ceiling» at **41.6%** truly
realised and «At her ceiling» at **76.3%**, while a high-ceiling girl hears the same two sentences
at **72.3%** and **87.7%** – the verdict arrives EARLIER for the girl with less talent. That
inversion is the defect.

Approved band edges, on true realisation:

| realised | line |
| --- | --- |
| 0–40% | Huge potential |
| 40–75% | Still room to grow |
| 75–90% | Close to her ceiling |
| 90–100% | At her ceiling |

Why these two numbers and not others – measured on his save:

* her whole remaining headroom is worth **31 rating points** (mean 55.35 → 56.73, rating 1786 → 1817)
* which is **54.4% instead of 50%** against an opponent she splits with today
* compounding over a draw: 3/4/5/6 rounds → **+29% / +40% / +52% / +66%** relative title chance
* saying «at her ceiling» at 75% writes off **8 rating points**; at 90% it writes off **3**

⭐ On this scale Vera reads «Still room to grow» at 16 and «Close to her ceiling» at 24 – which is
what he asked for: the verdict arrives after twenty, not at fourteen.

### F1 – finals pay fame (item 17)

`trophiesByTier` ALREADY records finals per tier; nothing reads them. Only Slam finals pay today
(`slamFinalFloor`). Vera has **16 finals** – 5 local, 2 regional, 1 national, 1 w15, 4 w50, 2 w100,
1 wta125 – worth exactly zero.

Approved: **a final pays 40% of that tier's own title value**, decayed on the same clock as a title.
Slam finals keep `slamFinalFloor` and are NOT double-counted.

Measured effect on his save: fame 8.9 → 10.3, weekly $244 → $323, worth $76,822 → $104,044.

### F2 – the ranking ladder reaches below the top 100 (item 17)

Season bands stop at top-100 (+0.1). Vera is #144, i.e. BELOW the lowest rung, and a decade of
top-150 tennis has earned her **0.27** in total.

Approved: extend the ladder – **top-150 +0.05, top-250 +0.025** – and make the career cap on season
bands GROW WITH SEASONS PLAYED instead of the flat 4-for-ever it is now, so a long professional
career is worth something.

### F3 – the endorsement ladder below the top 100 (items 7/11/12/13)

Today, per deal-year, all categories signed:

| rank | today | approved |
| --- | --- | --- |
| 201+ | **$0** (no band exists – `adBandFor` returns null) | **$200,000** |
| 101–200 | $45,000 | **$450,000** |
| 51–100 | $1,100,000 | unchanged |
| 11–50 | $2,600,000 | unchanged |
| top 10 | $9,200,000 | unchanged |

⚠ The two cliffs this removes: nothing at all below 200, and a **24x jump on a single ranking
place** from #101 to #100. Above the top 100 the ladder already steps 2.4x / 2.4x / 3.5x and is
NOT to be touched – his ruling: «Про 50–100 отвечаю прямо: пересматривать не надо».

The $200,000 anchor is his, from the film «Cinquième Set»: ~$5,000 a match under a sponsor at ~40
matches a year. ⭐ It was checked against the engine and holds – Vera plays **22 events ≈ 44
matches** a year. The figure is the BAND TOTAL across all categories, never one category's fee.

⚠ The new band is PREPENDED, so every existing band index shifts by one. Verified safe for saves:
the index is spent at signature (`cashCents`, `shootCount` are stored as values, never the index).
⚠ BUT the kit ladder reads `tour`/`premium`/`icon`'s `maxWtaRank` off these bands "read and not
imported" (see the comment in `economy.ts`) – that coupling MUST be checked, not assumed.

### F4 – the brand follows the contracts (item 17)

The incoherence: the sponsor market prices Vera at **$1,000,000 a year** of live deals, while the
brand model says her whole brand is worth **$76,822** and pays **$244 a week**. Her brand is worth
less than one of her contracts for one year.

Approved: **+1 fame per $50,000 of live annual contract value, the contribution capped at +30.**

⭐ The cap is the point: contracts lift the floor under an unglamorous professional, but an icon is
still made by titles, not by her agent. A top-10 saturates the term and has to win the rest.

Measured against his own acceptance test – «как только человек накопит 250к, чтобы его открыть – он
уже будет что-то приносить, а не 200 в неделю как оскорбление»:

| | fame | weekly | a year | brand worth |
| --- | --- | --- | --- | --- |
| top-100, $600k of deals, own fame 6 | 6 → 18 | $1,350 | $70,000 | $520,000 |
| Vera #144, $1M of deals, own fame 8.9 | 8.9 → 28.9 | $2,600 | $135,000 | $1,130,000 |

The $250,000 unlock pays itself back in **3.6 years** and climbs with her. Vera's multiple lands at
**8.4x**, inside the 6–9x corridor round 32 fixed – the free-float defect does not return.

### Backlog, NOT this wave – approved as its own future wave

Per-match sponsor pay, and contract terms of six months / a season / a named group of tournaments
(his: «контракты могут быть на 6 месяцев или год или только на какую-то группу турниров»). It is
the better mechanic – money follows playing, a lost season genuinely costs her – but it rewrites the
letter copy and the moment money arrives, which is a save-schema move. Not to be started here.

---

## ⚠ OPEN FOR THE OWNER, raised by the measurement in bundle A – the top band went elite-only

The approved edge of **0.90** does exactly what he asked, and bundle A shipped it. But walking the
real engine to age 29 (780 weeks, the whole growth arc) measured what it costs:

| rung | peak true realisation | ever hears «At her ceiling»? |
| --- | --- | --- |
| budget | 0.855 | **no** |
| middle | 0.879 | **no** |
| high | 0.895 | **no** |
| elite | – | yes, 6 of 8 careers, weeks 745–776 |

A middle-rung career reads Huge potential → Still room to grow (w81) → Close to her ceiling (w296)
and **never hears the fourth line at all**.

⭐ The original complaint is fully cured: on his own save the old measure said «Close to her
ceiling» at week 78 (age 15.5) and «At her ceiling» at week 158 (age 17.0) – his «приговор» to the
week. The new ladder says «Still room to grow» at 16 and «Close to her ceiling» at 24.

⚠⚠ **But the fourth band also carries advice, not just a verdict**: its note reads «no coach can add
much more now, whatever the price». If an ordinary career never reaches it, a parent whose girl has
stopped growing is never told to stop paying for a coach who can no longer buy anything. That is a
function lost, not only a sentence unheard.

⭐ **My recommendation: move the top edge to 0.85.** It restores the advice on budget/middle/high
careers (all three peak above it), and it is still far from his complaint – on his save the girl is
at 0.416 realised at 14 and 0.876 at 24, so 0.85 fires near her peak and nowhere near her teens.

⚙ **NOT CHANGED. 0.90 is what he approved and 0.90 is what shipped.** This is a decision for him.

---

# ⚠⚠ CORRECTIONS TO MY OWN APPROVED FIGURES – found by bundle F, reported not adjusted

The numbers in "APPROVED BY THE OWNER" are left as he approved them. Four of them were wrong when I
put them to him, and the mechanism was built to the approved SHAPE in every case. Each is recorded
here rather than quietly edited, because he approved what is written above and deserves to see
exactly which parts of it my measurement got wrong.

### 1. «Vera #144» – she is **#113**

Caught by me mid-wave and corrected in bundle F's brief before it built. `brandSignalsOf` carries no
rank at all; the save reads `kidRankWta: 113`. **Nothing was built on the 144.**

### 2. «0.27 in total» – the season ladder had earned her **0.500**

My probe derived it as a residual (`fame / shootMult − titles`) instead of summing the ladder, and
came out low. The true figure is five top-100 seasons x 0.1 = 0.500, and the new rungs take it to
**0.575**. ⭐ The argument is unchanged and if anything blunter: eleven seasons of professional
tennis, six of them inside the world top 115, are worth **half a point**.

### 3. ⚠⚠ «$1,350 a week at fame 18» is ARITHMETICALLY UNREACHABLE – the real ceiling is $1,118

This is the one that matters. The weekly is `3000 × reach²/10 × crowdMult` with `crowdMult` clamped
to [0.9, 1.15], so reach 18 tops out at **$1,118/week, 17% under the figure I gave him**. No career
shape closes it; $1,350 needs reach ≈ 21.2, i.e. **$750,000** of live deals rather than $600,000.

⚙ **My error, not the builder's.** I read $1,350 off my own transfer curve when the curve I had
measured says $994 at fame 18. The row was illustrative and the mechanism is built as approved – but
he was given a number the engine cannot produce, and that is the kind of thing this ledger exists to
catch.

### 4. «his save, $1M of deals» – his live value at week 569 is **$550,000**

The four deals I added ($250k + $400k + $200k + $150k) were never all live at once. $1,000,000 was
his shelf through weeks **404–452**. The approved row still reproduces as a scenario; **applied to
his save as it actually stands today** the term is +11 and the result is:

| | today | after round 34 |
| --- | --- | --- |
| weekly | **$244** | **$1,386** |
| brand worth | $76,822 | $538,030 |
| multiple | 6.04x | 7.46x – inside the 6–9x corridor |

⭐ The headline he cared about survives every correction: **$244 a week becomes $1,386.**

---

# ⚠ FIVE THINGS THAT NEED HIS RULING – nothing was decided for him

1. **The ceiling read's top edge.** 0.90 shipped as approved, and it made «At her ceiling» elite-only:
   budget/middle/high careers peak at 0.855 / 0.879 / 0.895 and never hear it. ⚠ The band also
   carries ADVICE – «no coach can add much more now, whatever the price» – so an ordinary career is
   never told to stop paying. **My recommendation: 0.85.** See "OPEN FOR THE OWNER" above.
2. **Item 14, the calendar.** Measured in full, not built: his diagnosis is confirmed to the tier and
   his remedy is already shipped and is the cause. **My recommendation: design (A), the supply-side
   fix, as its own wave** – it is what his words describe, and it is the only one of the two that
   touches the 12 of 48 weeks that show her nothing.
3. **Item 5, the tournament card before the draw.** ⭐ His complaint has two halves and only one is
   about the number: a forecast he cannot act on is trivia at any accuracy, because withdrawal is
   not free. **My recommendation: make withdrawal free until the draw** (and, if he wants both,
   replace the first-round percentage with an expected finish range).
4. **Item 19, the fund chart.** Built derived rather than stored, which is why his own week-569
   career opens on a full chart instead of an empty box. Storage would only buy a record of what the
   player SAW if the market model is re-tuned. **Cheap either way, his call.**
5. **The F2 cap.** `4 + 0.5/season` only overtakes the band ladder past **31** seasons, so it no
   longer binds at all – a 20-season all-top-10 career reaches 13.0 against a cap of 14.0. It does
   not run away, but it also stopped being a cap, and it lifts the academy above the P7 payback
   window. **His call whether that is what he wanted.**

⚠ Two figures the band prepend FORCED, which he never saw and which are his to overrule:
`fame.shootFloorByBand` and `shootFloorHalfLifeByBand` are indexed BY the advertising band and had
four entries. Left at four, the new top band would read `undefined ?? 0` and **a global house's
shoots would have bought zero fame**. Both gained a fifth rung – **0.03** and **13 weeks** – with
the four shipped values unchanged and moved one index right. The 0.03 is round 32 #5's own measured
bound: 0.02 stretches the ladder 2.75x → 5.5x and breaks its «a global house, not a hundred of them»
guard.

---

# The three items I owned – no agent, no code

## Item 8 `[~]` – «а что будет если отказать?» **Nothing, because there is nothing to refuse.**

Traced end to end: `ECONOMY.kidShare.fromAgeYears: 18` («Her own bank account is the eighteenth's
gift»), and `kidPrizeShareBps(ageYears)` reads **her age and nothing else** – 0 before 18, then
10 / 15 / 20 / 25 / 30 / 35 / 40 / 45 / 50 % at 18…26+. **No consent flag, no decision, no offer and
no refusal path exists anywhere in the engine.**

What he saw is `life.ownAccount` (`narrative.ts`, rendered at `KidScreen.vue:499`) – a NOTE stating
what the account holds and what she keeps this year. ⚠ It reads like a request and is an
announcement. That mismatch is the only real defect in the item, and it is copy, not mechanics.

⚙ His own instruction covers the rest and it is **backlog, not this wave**: «если отказали – она
сама пошла и открыла и на морали/отношениях отразится (это в бэклог)».

## Item 22 `[~]` – his save, read in full against our benchmarks

**She is precisely average.** Against the 199 live professionals in her own save, on the four skills
they share: hers **54.89**, field mean 53.74, median 53.73, best 71.77, worst 36.06 – above 107 of
199, the **54th percentile**.

**What that girl achieved in eleven seasons:**

    domestic  s0-2:  #11  -> #6   -> #2
    ITF       s2-4:  #69  -> #30  -> #27
    WTA       s3-10: #349 -> #177 -> #95 -> #92 -> #89 -> #93 -> #97 -> #113

* career high **#89**, today #113, never outside the top ~115 in six seasons
* **Slam quarter-final**, WTA 500 semi-final, **2 x WTA 250 titles**, WTA 125 final
* **14 titles and 16 finals** across every tier from local to WTA 250
* 6 injuries, 18 weeks lost, one retirement question already asked and answered

**Against `docs/specs/career-outcome-targets.md`:** lives from tennis ✅ (held eight seasons);
top-100 ever ✅ at #89; top-100 by 18 ❌; Slam-level ❌. ⚠ Read the second honestly – the game makes
a top-100 player **93.3%** of the time against a 35% target, a known open finding in that spec.

**The money, which is the real answer:**

| | |
| --- | --- |
| career prize | $3,076,136 |
| earned / spent (family side) | $4,969,007 / $4,829,142 |
| **family net over eleven seasons** | **+$139,865** |
| **she holds** | **$5,449,406** |

⭐⭐ **His hypothesis is right and stronger than he put it.** A 54th-percentile girl took a Slam
quarter-final, two tour titles and five and a half million dollars. Nothing about her talent needed
fixing; what was broken is that the game looked at that career and offered her **$244 a week**.

⭐ The half worth his eye: the FAMILY cleared $139,865 across eleven seasons while the daughter
banked $5.45M. Thematically right for a game where you play the parent – but the parent's own
balance is nearly flat however well she does. ⚠ Not routing: endorsement money IS split at her age's
rate (round-28 #15). It is spending – eleven seasons of coaching, travel, court and academy cost
$4.83M of the $4.97M that came in.

## Item 5 `[?]` – the ask, sharpened. See ruling 3 in the section above.

---

# ⚙ MERGE ORDER FOR HIM – measured, with the one conflict already resolved on paper

Two branches wait on him and both touch `src/engine/world/coachMarket.ts`. Dry-run merge against
their real merge base `c6114b71`:

* `docs/now-next-later.md` – auto-merges
* `src/engine/world/coachMarket.ts` – **exactly ONE conflict, and it is a comment**
* `review/principles-2026-09-02` – **zero** overlap with round/34, merges cleanly in any order

⭐ The two functions do NOT duplicate each other and both should live: `handoverRoomBand` (prologue)
measures how BIG her room is, `realisedShare` (round 34) how much of it she has FILLED. Both
branches rewrote the same comment above the `startingSkills` import to name their own consumer.
**The resolution is one comment naming both:**

    // ⭐ HER BIRTH BUILD, RE-DERIVED, and two readers need it: `handoverRoomBand` measures how big
    // her room is (`potential − born`) and `realisedShare` – round 34 #2b – measures how much of it
    // she has FILLED, because the skill she was born with is not an achievement. Pure and seed-only
    // (`startingSkills` ignores its profile argument), and `engine/radar.ts` already re-derives it
    // at snapshot time for exactly the same reason: it is cheaper than a stored field and it cannot
    // go stale. `player.ts` imports nothing from this module, so this runs one way.

⚠ Not applied to `round/34` – that would put prologue's text on a branch without prologue's code.
Either merge order works.

---

# Bundle G – the review's two gate findings (QA-34, ARCH-36)

Not one of his 22 items. He asked for this bundle directly after reading tonight's gate report –
«да, запускай в эту же волну агента по фиксам ревью пожалуйста» – so it carries the top two findings
of the principles review of 02.09.2026 (`review/principles-2026-09-02`,
`docs/review-principles-2026-09-02/README.md`) and **nothing else from it**. That review has many
other findings; they are not in this wave.

## QA-34 `[x]` – the archival tools sweep was red, and nothing ran it. Both halves fixed.

**BEFORE and AFTER, both read out of a FILE** rather than off a pipe or a background notice
(`npm run check:tools > log 2>&1; echo "TOOLS_EXIT=$?" >> log`):

| | |
| --- | --- |
| before | `TOOLS_EXIT=2` – nine TypeScript errors across six tools, exactly the nine the review lists |
| after | **`TOOLS_EXIT=0`** |

### ⚠ FIRST, THE THING THE WAVE HAD TO CONFIRM: not one of the nine is round 34's

If a round-34 tool had been among them, tonight's report to him was wrong. It is not. The last commit
to touch each failing file:

| tool | last touched by | wave |
| --- | --- | --- |
| `tools/birthday-pool.ts` | `0af7eaa6` | round 27 #7 |
| `tools/his-careers-brackets.ts` | `8ada9d3a` | round 29 #20 |
| `tools/market-probe.ts` | `a13e5226` | round 30 #14 |
| `tools/r29-item14-anger.ts` | `9201e534` | round 29 #14 |
| `tools/r29-item14-read.ts` | `9201e534` | round 29 #14 |
| `tools/r31-surface-kings.ts` | `531b7b12` | round 31 #5-6 |

No round-34 commit touches any of them, and the wave's own five probes – `r34-brand-foot`,
`r34-calendar-tiers`, `r34-domestic-reset`, `r34-savings-income`, `r34-zero-lock` – are **inside** the
swept set (`tsconfig.tools.json` includes `tools/**/*.ts`) and typecheck clean.

⭐ **And the two hard errors are not this wave's ENGINE changes either**, which is the second way a
round-34 fingerprint could have got in. `kidAgeExact` already took `(week, birthMonth, birthDay)` at
the merge base `c6114b71`; round 34's own birthday commit `dc82d791` states in its message that
`kidAgeExact` is untouched, and the tree agrees. `WorldEvent` carried no `kind` field at `c6114b71`
either.

⚠⚠ **The finding under the finding: both r29 errors were wrong the day they were written.** At
`9201e534` – the 29.08 commit that ADDED both files – `kidAgeExact` already took three arguments and
`WorldEvent` already named its discriminator `type`. So these probes never compiled, and because a
TypeScript error does not stop `vite-node`, they RAN: one printed `age NaN` and the other printed
`kind=undefined` into the evidence they exist to produce. Nothing objected for five days, because
nothing ran the only check that could see them – the 02.09 review found them by running the sweep by
hand, which is the only reason they reach this ledger at all.

### The per-tool decision: SIX REPAIRED, NONE FROZEN

| tool | error | verdict | why |
| --- | --- | --- | --- |
| `birthday-pool.ts` | TS6133 `Rng` declared, never read | **repaired** | a type-only import left behind by an edit; deleting it removes nothing the file uses |
| `his-careers-brackets.ts` | TS6133 `conditionMatchFactor` declared, never read | **repaired** | the name survives twice in the file's own comments, which is where it belongs – the value import was dead |
| `market-probe.ts` | TS6133 `maxRatioSeen`, `minRatioSeen` | **repaired** | born dead in `cab690a6`, the one commit that wrote them, and never read since: the printed worst ratios come from `worstCrashFreeRatio` / `worstMarketRatio` instead |
| `r29-item14-anger.ts` | TS2339 `kind` not on `WorldEvent` (x3) | **repaired** | the field it wants exists under its real name, `type`; the repair is that rename and nothing else |
| `r29-item14-read.ts` | TS2554 expected 3 arguments, got 1 | **repaired** | `kidAgeExact(world)` -> `kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)`. The repo has 77 calls of this function across 41 files and this was the ONLY one-argument one; the other 76 compile, which is how we know the convention rather than guessing it |
| `r31-surface-kings.ts` | TS2459 `Surface` declared locally but not exported | **repaired** | imported from `src/engine/match/types`, the module that DECLARES it |

⭐ **Nothing was classified frozen, and that is a decision rather than an omission.** The review's bar
is «clearly classify frozen evidence that CANNOT BE MAINTAINED», and none of the six clears it: every
repair is a rename, a deleted dead symbol or a call convention, and not one of them required guessing
what a moved API now means. A repair that has to guess would be fabricating evidence and would earn
the frozen label instead – so the test applied was «does fixing this change what the probe MEASURES?»
and six times the answer was no. The two `r29-item14-*` probes are the closest call, because their
question (round 29 #14) is closed and they need his personal save to run at all; they were repaired
anyway, because their errors were never engine drift – they were typos that the absent gate let
through – and a probe that prints `NaN` for her age is not a record of anything. Freezing them would
have taken two files out of the swept set to preserve two defects.

⚠ Nothing was silenced. There is no new `@ts-ignore`, no new `exclude`, and `tsconfig.tools.json`
still sweeps `tools/**/*.ts` whole.

⚠ `r31-surface-kings.ts` took the **import fix, not the export**, as the brief asked. `Surface` is
already public from `src/engine/match/types`; `src/shared/protocol/competition` merely imports it for
two of its own field types and never re-exported it. Adding an export there would have widened a
module's public surface to satisfy one archival probe, and `his-careers-brackets.ts` was already
importing `Surface` from `match/types` two files away.

### ⭐⭐ The half that matters most: it is in the gate now

Nine errors sat unread for months precisely because `npm run check` did not run `check:tools`, and two
earlier waves recorded the redness as «baseline» and moved on. ⚠ That is not a rhetorical flourish –
both entries are still in the tree: `docs/rounds/round-29.md:2364` («`check:tools` (6 errors) and
`tools:registry:check` are red at baseline») and `docs/specs/the-drought-2026-08.md:630` («2 errors,
both baseline … This wave adds **0**»). Both waves were honest and both were measuring the wrong
thing: «adds none» is the only claim a person can make about a number nobody is allowed to fail on.
⭐ And the number moved while it was being filed as a constant – **2 errors in the drought spec, 6 in
round 29, 9 at the review**. A baseline that grows is a debt, not a floor.
Both scripts the review names are now gate steps, in `npm run check` and in CI's `test-build` job:

* `npm run tools:registry:check` – with the other cheap document checks, before the typecheck
* `npm run check:tools` – immediately after `vue-tsc -b --force`, because the tools cannot be right
  while the engine they import is wrong, and a reader should see the app's own errors first

### The cost, measured BEFORE it was wired in

The review offered an escape hatch – a scheduled or post-wave integrity job – if the per-PR cost were
unreasonable. It is not, so the escape hatch was **not** taken:

| step | run 1 | run 2 | run 3 |
| --- | ---: | ---: | ---: |
| `npm run check:tools` | 2.53 s | 2.49 s | 2.56 s |
| `npm run tools:registry:check` | 0.17 s | 0.14 s | 0.14 s |
| for scale: `vue-tsc -b --force`, already in the gate | 6.81 s | | |

**~2.7 s added to a gate whose unit suite alone runs for minutes.** Choice taken: **every run, local
and CI** – the option the review preferred – rather than the scheduled job, which would have kept the
«somebody will remember» failure mode that produced the finding.

### The wiring proved by a deliberate break

A `const deliberateBreak: number = "not a number"` was added to `tools/r31-surface-kings.ts`. That
file is ARCHIVAL – it is not listed in `tsconfig.app.json` – so it is invisible to the typecheck the
gate already had, which makes it the honest test of the new step and its own control:

| run, on the identical broken file | exit code, read from a file |
| --- | --- |
| `npx vue-tsc -b --force` – the gate's pre-round-34 typecheck | **`VUETSC_EXIT=0`** – blind, as it was to all nine |
| `npm run check:tools` – the new step | `TOOLS_EXIT=2` – `TS2322` on line 57 |
| `npm run check` – the whole gate | **`CHECK_EXIT=2`**, failing at `check:tools` after passing every step before it |

The break was then removed; the file's remaining diff is the import line and its comment.

## ARCH-36 `[x]` – the second symbol map is gone, not corrected

`tools/generated/world-symbol-map.md` said `WorldState` and `SAVE_SCHEMA_VERSION` live in
`src/engine/world/state.ts`; `docs/context/engine-symbol-map.md` still pointed both at the barrel. The
generated map was right – `node scripts/world-map.mjs WorldState` prints `state.ts:320`, and
`scripts/doc-facts.mjs` has read the schema constant out of `state.ts` since the move.

⭐ **The correction was NOT to repair the hand-written row.** That would have left two maps of one
thing, one of them checked and one of them not, and the checked one would have been right again in a
month. `docs/context/engine-symbol-map.md` is now a short route: it keeps the routing question, states
the barrel problem, and hands the answer to `node scripts/world-map.mjs <symbol>` and the generated
table – including what the command says when a symbol is NOT on the barrel's surface, so a reader gets
`no export named '…' reaches src/engine/world.ts` instead of a wrong answer.

Evidence that the page no longer owns a symbol:

* `grep -c "^| " docs/context/engine-symbol-map.md` -> **0** table lines (it had 32)
* `grep -c "engine/world/" docs/context/engine-symbol-map.md` -> **0** – the owner spelling the old
  table used appears nowhere; the only module path left is `src/engine/world.ts` itself, twice, as the
  barrel the page is about
* `npm run map:world:check` -> `world map: … is current (384 symbols)`, and `npm run context:audit`,
  `node scripts/doc-facts.mjs`, `npm run decisions:check`, `npm run pins:check` all exit 0

⚠ The stale row in the second table also went: the page announced «three areas» over four rows, one of
which named rule modules the barrel does not re-export at all.

## The judgement calls, named

1. **Six repaired, none frozen** – reasoning above. If a later wave moves an API under one of these
   probes in a way that cannot be mechanically followed, THAT is the moment for the frozen label, and
   the gate will now be the thing that raises it.
2. **Import over export** for `Surface`, so no module's public surface widened for a probe.
3. **`docs/context-index.md`'s tools row was stale and was corrected in passing** – it advertised «24
   live, 114 archival» against a measured 26 and 151. It is the same defect QA-34 names («the registry
   says archival probes remain reproducible»), one line from the map row this bundle rewrote, so it was
   fixed rather than left; it is the only line touched outside the two findings.
4. **`CLAUDE.md` was deliberately NOT edited.** Its one-line summary of `check` («vue-tsc -b --force +
   unit tests + build») was already a summary rather than a list – it never named `context:audit` or
   `pins:check` either – so it does not become false, and the file is the project's own instruction
   sheet.
5. **`tools/README.md` is generated and was regenerated**, because `scripts/tools-registry.mjs` used to
   render the words «typechecked on demand» and that stopped being true tonight.

**Gate:** `npm run check` green end to end on this branch with both new steps in it – **`CHECK_EXIT=0`**
read from the log file, 412 s wall clock, every step in the chain including `node scripts/units.mjs`
(= `test:quiet`; `unit: green in 356s`) and `npm run test:component` (109 files, 1158 tests passed).
`npm run check:tools` alone: `TOOLS_EXIT=0`. No guard test went red, so none was re-aimed, and none
was deleted or loosened.
