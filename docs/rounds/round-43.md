---
type: round
status: current
area: process
canonical: false
last-reviewed: 2026-09-16
---

# Round 43 – the chemistry wave, and the support seats get their faces

Opened 16.09.2026, the day round 42 merged (`ad640c18`, PR #145). Same regime as 42: one builder at
a time, the architect gates each bundle with the full `npm run check` on a quiet machine, commits by
FILE pathspec, and the round ends with its own PR through `/pull-request`.

⚠ **Statuses:** `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him.

---

- [>] **1. THE CHEMISTRY WAVE, C1.** Spec [the-chemistry-2026-09](../specs/the-chemistry-2026-09.md),
  all thirteen questions C1–C13 ruled by him on 16.09. C1 ships the roster's per-career `manner` and
  `style` draw, affinity, the weekly corridor and phase, the three event channels, `coachPairs` +
  v79, one line in `coachFactor`, and B0/B9/B10/B11 as acceptance. Builder in flight.
  ⚠ **It owes FOUR DRAFT seasonal lines** (anti-match / ordinary / good / click) and the anti-match
  one is load-bearing – a negative pairing nobody can see is a hidden tax. His to rule before ship.

- [ ] **2. THE SUPPORT-SEAT PORTRAITS ARE NOT ON ANY SCREEN (his 16.09).** «Я не увидел в пришедшем
  обновлении картинок для support stuff, мне казалось, что мы их уже должны были сделать.»
  ⚠ **He is right and the record already said so.** Round 42 #53 shipped the CONVERSION and left the
  PLACEMENT open – its ledger line is `[~]`, not `[x]`. Verified rather than remembered:
  `git grep support-stuff -- src/` returns **nothing**; the four `.webp` are tracked and ship, and
  nothing renders them.
  **What ships:** his four 448×624 portraits placed by the coach strip's principle (his own ruling of
  16.09: «тренерская полоска… принцип похож, просто соотношение сторон будет немного другое»), i.e.
  a fixed-width strip, `object-fit: cover`, an `object-position` that keeps the head whole, the body's
  height driving the picture, and the floor derived from **this** ratio – `strip × 624/448`, never the
  coach masters' `× 264/162`. The broker has no surface yet and stays on the shelf.

- [ ] **3. THE PRICES INSIDE THE SEAT OPTIONS READ TOO SMALL (his 16.09).** «Сами цены внутри опций
  этих специалистов надо сделать покрупнее и можно пожирнее даже.» Typography only – **no string
  moves**, which is what makes it safe under invariant 4.

- [~] **4. THE MASSEUR ASKS FOR RAISES (his 16.09 ruling).** Raised by the architect's audit: the
  masseur is **$75/session × 2/4/7 a week = $150/$300/$525/wk = $7.8k/$15.6k/$27.3k a year**, a FLAT
  contract per rung with no corridor, no jitter and no draw – the one seat left whose price reads
  nothing about her. Round 42 #19 closed the coach's half of the research's own verdict that our top
  team total is «an order under reality» ($80–130k/yr against $600k–1M); the masseur's half was never
  touched, and the research carries **no masseur figure**, so there is nothing to price him against.
  ⭐ **His ruling, and it is better than a new band:** «массажист тоже вполне может просить надбавок
  за свои часы ежегодно (может быть не так интенсивно как тренер)… это может нам скомпенсировать все
  ранги и будет справедливо». So the correction rides on HIS OWN LABOUR rather than on a wealth or
  rank corridor – the same shape the coach's annual ask has, at a lower intensity.
  ⚠ **The psychologist is explicitly out:** «Психолога не трогаем наверное.»
  ⭐⭐ **AND HIS 16.09 FOLLOW-UP CLOSES THE DESIGN – there is no missing number and the item that asked
  for one is withdrawn.** «Мы начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и
  просит прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество процедур.»
  ⚠ **The architect had filed #6 asking for a research figure. That was the wrong question:** today's
  price IS the anchor, and the MECHANIC is the drift away from it. An external benchmark would only
  be needed to re-price him from scratch, which is not what was asked.

  **The shape, and it adds no new dial:**
  * the ask moves **`perSessionCents`**, once a year;
  * the family's answer is the rung dial (2 / 4 / 7) that already exists – **pay more for the same
    hands, or hold the bill and drop a rung**. Both branches are his own words;
  * ⚠ **there is no third «refuse» branch, and there must not be.** «Альтернативы нет» means refusal
    cannot mean «he leaves and you hire another», and a punishment with no counterplay contradicts
    «мы ни за что не наказываем». Two branches, neither of them losing.

  **The driver is TIME SERVED, not her results.** The coach asks against a progress basket because
  DEVELOPING her is his job; the masseur MAINTAINS her, and his value is his hours.
  ⚠ Letting him read her titles would do two bad things at once: make him a second coach, and charge
  her success twice – the exact C13 problem the chemistry wave has just had to damp.

  ⭐ **The consequence is the one he wanted:** the rung dial stops being a one-time purchase and starts
  ERODING. Seven sessions a week bought at 22 are four by 26 on the same money – a live pressure that
  scales with the career and needs no new corridor, which is his «скомпенсировать все ранги» exactly.

  ⚠ **Intensity is measured against the COACH, not against a market.** His «не так интенсивно как
  тренер» is the yardstick: the coach's corridor is 5–15% (#51), so this sits clearly under it.
  That is what invariant 5 binds here.

  ⚠ **The one thing the bench must check:** the drift must never push the BOTTOM rung out of a modest
  family's reach, or the poor lose the seat to arithmetic rather than to a decision.

  ⭐⭐ **AND A SEQUENCING FINDING: there is no annual-ask machinery in this game at all.** `coach.ts`'s
  `coachSeasonUplift` is a development projection, not a raise, and the coach's own ask (#51) is not
  built. So the masseur's would be the FIRST – and it is the simpler one, reading time rather than a
  basket. **Build it first and #51 inherits a tested mechanism** instead of the round inventing two.

- [~] **5. THE BUSINESS TAB DOES NOT SAY WHOSE MONEY IT IS SHOWING (his 16.09).** He asked whether
  Zoe's brand was correct: «13000 в неделю при стоимости бренда 28м+».
  ⭐ **The numbers are right and the SCREEN is what is wrong.** `worth = weekly GROSS × 52 × multiple`
  and the multiple is hard-capped at `maxX: 20`, so $13k/wk of gross could never support $28M. But
  $13k is not gross: `business.ts:141` hands the family `assetWeeklyIncomeCents − assetKidShareCents`,
  and her share is the PRIZE ramp – 10% from 18, capped at **60% at 23**. Unwound: gross
  $13,000/0.40 = **$32,500/wk → $1.69M/yr → a multiple of 16.6×**, inside the band and near its top,
  which is exactly right for a mature star.
  ⚠ **So the defect is legibility, not arithmetic:** the tab puts his 40% of the income beside the
  whole business's worth and says neither, so anyone who divides one by the other gets 41× and
  concludes the game is lying.
  ⭐ **Same shape as round 42 #40** – brands pay 43% of the junior bill, the family sees 9%, and the
  gap is a split nobody states. There it was the manager's 15/85; here it is her 60/40.
  **His ask:** «Наверху вкладки Business можно добавить строчку про ту долю, которая уходит в семью и
  ей отдельно, сказав, что видимые суммы - это семейный чистый доход.»
  ⚠ **The line must be LIVE, not fixed** – her share ramps, so a hard-coded «60/40» lies to a
  nineteen-year-old. The percentages come from the engine.
  **DRAFT, his to rule:**
  > **A.** `Her share is 60% – the figures below are the family's net.`
  > **B.** `Every week this shelf earns, she takes 60% and the family keeps 40%. The figures below are the family's net.`
  > **C.** `She takes 60% of what these earn; the figures below are the family's 40%. A holding's worth is the whole business.`

  ⭐ **Architect recommended C, and ✅ HE RULED C (16.09, «окей»).** A and B say «this is net» and leave
  the valuation puzzle exactly where it was; C closes both halves – the split AND the fact that the
  worth is of the whole business rather than of his share, which is the half that produced his 41×.
  So the line that ships is:

  > `She takes 60% of what these earn; the figures below are the family's 40%. A holding's worth is the whole business.`

  ⚠ **The two percentages are ENGINE-READ, not literals** – `kidPrizeShareBps` at her age today, with
  `collegePausedShareYears` folded in exactly as the prize ramp reads it. A hard-coded 60/40 is a lie
  to a nineteen-year-old, and this round's own #5 is about a screen that lies by omission.

- [~] **6. WITHDRAWN – THE MASSEUR NEEDED NO OUTSIDE FIGURE.** This item asked him to name a real-world
  masseur price, or the round to run a research pass, because `team-economics-2026-09`'s audit row
  gives none. ⭐ **His answer made the question unnecessary rather than answering it:** the seat starts
  at today's prices and the mechanic is the DRIFT away from them, so the anchor is our own number and
  the yardstick for the drift is the coach's ask. See #4.
  ⚠ Recorded as withdrawn rather than deleted, because «the architect asked for a benchmark a design
  did not need» is the kind of wrong question worth being able to find again.

- [ ] **7. THE SOFT-BEAT CHIP GETS THE AVATAR'S GLOW (his 16.09).** «Пульсирующую рамку вокруг её
  просьбы поговорить на home сделать по аналогии с рамкой вокруг аватарки, чтобы тоже подсветка была по
  краям небольшая, а не только сама рамка.»

  **The pattern to copy is already in the repo and it is his own from round 42 #29(b)** –
  `src/style.css:3159`, the avatar's mood ring:

      box-shadow:
        0 0 0 1.5px var(--mood-ring-halo),              /* the dark halo, the colour's neighbour */
        0 0 9px 1px rgba(var(--mood-ring-rgb), 0.55),   /* the glow, blooming past it */
        0 2px 10px rgba(0, 0, 0, 0.45);                 /* the drop shadow, restated */

  ⭐ **Two properties of that ring are the design and must carry across**, because they are why it
  reads as a glow rather than as a thick border: the SHADOW ORDER (the first paints on top, so the
  halo sits between the colour and the bloom) and the fact that `mood-ring-breathe` moves **only the
  bloom** – the hue, the hairline and the halo are constant, so the ring never disappears and never
  changes colour mid-cycle. The chip's `soft-beat-pulse` should breathe the same way, in
  `--accent-soft` rather than a mood hue: an invitation, not an alarm (round 42 #20's own ruling).

  ⚠⚠ **AND THE CHIP'S OWN COMMENT BECOMES WRONG AND MUST BE AMENDED, NOT LEFT.** `HomeScreen.vue`
  around the `soft-beat-card` rule says today: «ONLY the border tint moves … costs no layout and no
  paint outside the card's own edge, so nothing under the finger shifts.» His ask deliberately
  reverses the second half. The first half still holds and is worth keeping: a `box-shadow` paints
  outside the border box without reflowing anything, so **nothing under the finger moves even with the
  glow** – which is the sentence the amended note should make.

  ⚠ The reduced-motion killswitch below it keeps its job: with less motion asked for, the chip takes
  a STEADY soft-accent edge and glow rather than a breathing one. A player who asked for calm still
  has to be able to find the chip.

- [ ] **8. THE SMALL-TALK CORPUS IS TOO THIN, AND TWO OF THEM CAME BACK-TO-BACK (his 16.09).** «Она
  пришла 2 раза подряд с the players I've been watching barely talk about winning. Мне кажется этих
  микро диалогов должно быть много и они точно не должны так часто повторяться, иначе в чём смысл.»

  ⚠⚠ **DIAGNOSED, AND IT IS A GUARANTEE RATHER THAN BAD LUCK.** His line is `id: 'watching-players'`,
  subject **`observation`** – and `observation` holds **exactly one situation in the whole catalogue**.
  Four of the six subjects are single-entry, so any repeat of those subjects is repeated VERBATIM:

  | subject | situations |
  | --- | ---: |
  | `story` | 4 |
  | `good-news` · `worry` | 2 each |
  | **`observation` · `decision` · `curiosity`** | **1 each** |
  | **total** | **11** |

  ⚠ **And there is no memory at all.** `rollSmallTalk` draws the subject and the situation fresh every
  week (`seed:life:smalltalk:<week>`) and excludes nothing that was said before.

  ⭐ **The arithmetic says the catalogue is not the first defect.** `smallTalkPerWeek` is 0.08 at a
  close bond, capped by `smallTalkCapPerSeason: 4` – so a season holds **four conversations against
  eleven situations**. Four of eleven could easily have been four different ones; two identical in a
  row is the worst outcome a pool that size can produce, and only a missing exclusion can produce it.

  **(a) THE FIX, architect's, no schema and no copy:** `raiseLifeBeat` already pushes
  `{ week, kind, detail }` into `world.lifeLog`, so the history is ALREADY STORED – read back recent
  `small-talk` rows and exclude their situations from the draw.
  ⚠ **It must degrade gracefully:** `reachableSituations` narrows by career facts, so the reachable
  set can be three rather than eleven. Drop the OLDEST exclusions first and never empty the pool, or
  the draw falls through to the generic subject line.

  **(b) THE CORPUS, his:** ⭐ **RULED 16.09 – «давай сделаем 44 ситуации… или можно 55 для
  уверенности».** At 40 conversations in a ten-season career, 44 situations put each line at **1–2
  appearances** and leave some unseen in a playthrough, which is his own reasoning. 55 buys more.
  ⚠ New situations are new player-facing strings, so they are DRAFTS: the architect writes the
  document, he proofreads, nothing ships before he has.

- [ ] **9. THE KNOCK CADENCE INTERRUPTS TOO OFTEN – round 42 #27's own parked signal has arrived.**
  «Мне всё ещё очень часто падают не травмы, а предупреждения, что ей надо отдохнуть.»

  ⭐ **The logic WAS checked – round 42 #27, off his own save** – and that item closed with exactly
  this trigger: «if the FEEL stays wrong after this reading, the knock cadence becomes a tuning
  question with a bench arm – his call». The signal is here, so the tuning pass is now owed.

  **The model, in one line** (`knock.ts`): `0.1 + (100 − condition) × 0.0022 + (train − 75) × 0.006`,
  rate-limited by `KNOCK_COOLDOWN_WEEKS = 4`.

  | week | weekly chance | expected gap incl. cooldown |
  | --- | ---: | ---: |
  | rested, light (cond 100, train 60) | **1%** | ~104 wk |
  | steady (cond 80, train 75) | **14.4%** | ~11 wk |
  | working (cond 65, train 80) | **20.7%** | ~9 wk |
  | grinding (cond 60, train 85) | **24.8%** | ~8 wk |

  ⭐⭐ **THE STRUCTURAL FINDING: at the pivot the FATIGUE term is twice the base.** At condition 60 it
  contributes 8.8 points against the base's 10, so «she needs rest» fires mostly because she IS
  tired – the model is behaving correctly.
  ⚠ **Which means the real question may not be the knock door at all, but whether a careful player
  can hold condition high enough to stay off it.** If an ordinary working week sits at 60–65, then
  20%/week is a CONSEQUENCE of the condition economy, and retuning `KNOCK_BASE_CHANCE` would be
  treating a symptom.

  **So the arm measures TWO things, not one:** the realised distribution of `condition` and
  `plan.train` across a live career, and only then the realised knock cadence that falls out of it.

  ⚠ **AND THE TARGET IS HIS, because the complaint is about INTERRUPTIONS rather than injuries** – a
  knock that is shrugged off still stopped the week. The question to rule is «how many times a season
  may the game interrupt a careful player», and the bench measures against his number rather than
  against the architect's taste.

  ✅ **STOOD DOWN 16.09 – «по ноккам отбой тогда (гриндит – это объясняет всё)».** The cadence is
  the model doing its job at the operating point his career sits on. No tuning pass, no bench arm.

- [ ] **10. ⭐⭐ THE KNOCK WINDOW SHOULD ANSWER «WHY?» – grown out of #9 rather than out of a complaint.**
  «Мой первый вопрос – ПОЧЕМУ? Мне кажется, в этом окошке можно игроку подсветить, что может быть причиной…
  или хотя бы предложить, на что посмотреть.»

  ⭐ **The place is free: `KnockPrompt` is DERIVED at snapshot time, no schema cost**, and it already
  carries `repeat: boolean` – one of the causes is computed and simply never used to explain anything.

  **The answer is arithmetic, not a guess.** `knockChance` is three terms:
  `base 0.100 + fatigue (100−cond)×0.0022 + load (train−75)×0.006`.

  ⚠⚠ **BUT «WHICH TERM IS BIGGEST» IS THE WRONG QUESTION AND WOULD LIE.** At his own grinding point
  (cond 60, train 85) the terms are base **0.100**, fatigue 0.088, load 0.060 – the BASE is the largest
  single term, yet «nothing you did» would be false: the family's choices added 0.148 on top of the
  floor, so **60% of that week's risk was theirs**.

  ⭐ **So the measure is HOW MUCH THE FAMILY'S CHOICES ADDED, and which of them added more:**

  | week | base | fatigue | load | the honest line |
  | --- | ---: | ---: | ---: | --- |
  | grinding (60 / 85) | 0.100 | **0.088** | 0.060 | she went in tired |
  | heavy plan, fresh legs | 0.100 | low | **high** | the week was a hard one |
  | careful (90 / 70) | 0.100 | 0.022 | **−0.030** | **nothing you did – the light week was working** |
  | `repeat` is true | – | – | – | you have sent her back out on this part before (×3.0) |

  ⚠⚠ **AND THE HARD RULE WITHOUT WHICH THIS MUST NOT BE BUILT: the window has to be able to say
  NOTHING.** A game that always offers a cause teaches that there is always something to fix, and
  manufactures guilt where there is none – straight against his own «мы ни за что не наказываем».
  The careful row is not a missing answer; it is a GOOD one: caution was working and the 10% floor is
  irreducible.

  ⚠ **No numbers on the card.** He asked for the cause named or «хотя бы предложить, на что
  посмотреть», and a named cause is enough. ⭐ Nothing hidden is revealed either: condition is on
  screen and `plan.train` is a slider he sets, so the window only points at what he already has.

  ⚠ The four lines are player-facing and therefore DRAFTS – written for his reading, not shipped.

- [ ] **11. ⭐ A LETTER WHEN A BUILD FINISHES (his 16.09).** «Давай на почту присылать письмо про те
  объекты, которые у нас строятся в магазине, в момент, когда они достроены.» His own word for it: a
  cheap micro-idea.

  **Why it is genuinely cheap:** the shelf already knows. A build-to-order rung carries its own weeks
  and the build ring on the tile (round 41 #28) is drawn from that same count, so «it finished this
  week» is a transition the world can already see – no new state and no new stream.

  ⚠ **The thing to get right is WHICH week it fires.** The ring reaching full and the delivery are
  not automatically the same instant, and a letter that arrives a week early or late about a thing
  standing in the garden is worse than no letter. The build reads the delivery, not the ring.

  ⚠ **Copy is his** – the letter is player-facing and arrives as a DRAFT.

  ✅ **RULED 16.09: only the rungs with build times.** «Всё верно, я так и сказал, только те, которые
  имеют сроки построек.» So an index-fund purchase that lands the same week writes nothing – the
  letter exists for the wait, and where there was no wait there is no news. That is exactly the set
  round 41 #28's build ring is drawn for, so the two surfaces answer the same question about the same
  rungs.

  ⚠ **The remaining build question is the WEEK, and it is not a design choice:** the ring filling and
  the delivery landing are not automatically the same instant. The letter reads the DELIVERY.
