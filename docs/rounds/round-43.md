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

- [x] **1. THE CHEMISTRY WAVE, C1.** Spec [the-chemistry-2026-09](../specs/the-chemistry-2026-09.md),
  all thirteen questions C1–C13 ruled by him on 16.09. C1 ships the roster's per-career `manner` and
  `style` draw, affinity, the weekly corridor and phase, the three event channels, `coachPairs` +
  v79, one line in `coachFactor`, and B0/B9/B10/B11 as acceptance. Builder in flight.
  ⚠ **It owes FOUR DRAFT seasonal lines** (anti-match / ordinary / good / click) and the anti-match
  one is load-bearing – a negative pairing nobody can see is a hidden tax. His to rule before ship.

- [x] **2. THE SUPPORT-SEAT PORTRAITS ARE NOT ON ANY SCREEN (his 16.09).** «Я не увидел в пришедшем
  обновлении картинок для support stuff, мне казалось, что мы их уже должны были сделать.»
  ⚠ **He is right and the record already said so.** Round 42 #53 shipped the CONVERSION and left the
  PLACEMENT open – its ledger line is `[~]`, not `[x]`. Verified rather than remembered:
  `git grep support-stuff -- src/` returns **nothing**; the four `.webp` are tracked and ship, and
  nothing renders them.
  ⚠⚠ **AND ONLY TWO OF THE FOUR ARE PLACEABLE, which this item said badly.** It read «his four
  portraits placed» and then parked the broker, implying three. There is no third seat: the sparring
  partner's keys (`sparringHired` / `sparringRung` / `sparringTravels`) are RESERVED in the schema with
  **no reader anywhere on the tree** – nothing crosses the wire and `SupportStaffTab`'s `members` has
  two entries. A face needs a card. The masseur and the psychologist ship; the sparring partner gets
  his when **F2** builds the seat, and the broker stays on the shelf by the owner's own word.

  **What ships:** the two placeable portraits, by the coach strip's principle (his own ruling of
  16.09: «тренерская полоска… принцип похож, просто соотношение сторон будет немного другое»), i.e.
  a fixed-width strip, `object-fit: cover`, an `object-position` that keeps the head whole, the body's
  height driving the picture, and the floor derived from **this** ratio – `strip × 624/448`, never the
  coach masters' `× 264/162`. The broker has no surface yet and stays on the shelf.

- [x] **3. THE PRICES INSIDE THE SEAT OPTIONS READ TOO SMALL (his 16.09).** «Сами цены внутри опций
  этих специалистов надо сделать покрупнее и можно пожирнее даже.» Typography only – **no string
  moves**, which is what makes it safe under invariant 4.

- [x] **4. THE MASSEUR ASKS FOR RAISES (his 16.09 ruling).** Raised by the architect's audit: the
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

  ✅ **SHIPPED 16.09, spec [the-masseurs-ask-2026-09](../specs/the-masseurs-ask-2026-09.md).**
  `raisePerYear: 0.04`, compounding once per completed year on the payroll, rounded to whole dollars.
  ⭐ **NO SCHEMA MOVED:** `hireMasseur` already writes one kept, tagged row per change of the
  arrangement, so `masseurWeeksServedAt` sums the hired SPANS off the ledger – `coachSinceWeek`'s own
  doctrine one seat over. The spans are summed rather than measured from the first hire because a
  clock that restarted on a re-hire would be a free THIRD branch, and a dominant one.

  **Predicted vs measured** (`npm run bench:masseurraise`): the drift is 1.04× / 1.37× / 2.19× at 1 /
  8 / 20 years against the coach's 1.05×–1.15× / 1.48×–3.06× / 2.65×–16.37× – under the corridor's
  floor at every horizon, as predicted.
  ⭐⭐ **AND THE BOTTOM-RUNG FEAR WAS WRONG FOR A STRUCTURAL REASON.** The parents' own contribution
  compounds **5–10% a season** (his round-12 ruling), so 4% LOSES to the slowest income ladder and
  the entry rung gets cheaper against the household every year – 61% → 31% of a working family's
  weekly contribution over twenty years. The constraint cannot be violated while `raisePerYear <
  incomeGrowthBand[0]`, **which also puts a hard ceiling of 5%/yr on this design that is his own
  earlier ruling rather than an architect's taste.** 12 paired careers × 728 weeks: zero extra
  releases, zero extra bankruptcies (the one career that goes under does so in BOTH arms) and 18.5%
  more salary paid.

  ⚠⚠ **AND A CORRECTION TO THIS ITEM'S OWN ILLUSTRATION, recorded because it would have set the
  number.** «Seven sessions a week bought at 22 are four by 26 on the same money» implies 7/4 = 1.75×
  in four years = **15%/yr, the coach's CEILING** – the opposite of «не так интенсивно». At 4% that
  sentence takes fifteen years. It is also the wrong SHAPE: the dial sells 2/4/7 and nothing between,
  so a constant spend stops covering its rung on the FIRST ask and the erosion is never gradual. What
  the drift really does is price his two branches against each other annually – find 4% more, or save
  43–50% by working him less. See the spec's §5.

  ⚠ **Honestly small on a successful career** (§6): the household ends on $4–6M and 18.5% more
  masseur salary is noise. That is the same arithmetic that makes the reachability guarantee hold, so
  it is recorded rather than tuned around – **the lever for a sharper bite is the rung ladder, not
  the drift.**

  ⭐ **THE TWO STRINGS ARE RULED (17.09) and they are his** (the second because a family on the entry
  rung has no rung to drop to, and offering one would be the screen lying about a choice – this
  round's own #5):
  > `The masseur's rate rises to $78 a session starting this week. Keep the current schedule at the higher rate, or book fewer sessions.`
  > `The masseur's rate rises to $78 a session starting this week. She is already down to twice a week, so there is no shorter schedule to choose.`

  ⚠⚠ **His own bottom-rung line said «already down to one session a week» and that rung does not
  exist** – `ECONOMY.masseur.rungs` opens at **2** («Twice a week»). The sentence was corrected rather
  than shipped, and it now reads the rung's own label instead of a literal. See the spec's §7.

- [x] **5. THE BUSINESS TAB DOES NOT SAY WHOSE MONEY IT IS SHOWING (his 16.09).** He asked whether
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

- [x] **7. THE SOFT-BEAT CHIP GETS THE AVATAR'S GLOW (his 16.09).** «Пульсирующую рамку вокруг её
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

- [~] **8. THE SMALL-TALK CORPUS IS TOO THIN, AND TWO OF THEM CAME BACK-TO-BACK (his 16.09).** «Она
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

  ✅ **(a) SHIPPED 16.09** – `withoutRecentSituations` (`src/engine/world/lifeBeat.ts`), the last two
  conversations taken off the table BEFORE the subject is drawn, degrading oldest-first and never
  emptying the pool. No schema, no migration, no golden fixture, no copy: `world.lifeLog` already
  stored every row. ⚠ **Before the subject draw and not after** – four of the six subjects hold one
  situation, so a subject drawn over the unnarrowed set can win the weights and then have nothing
  behind it.

  **Measured, `npm run bench:smalltalk` (K1–K5, §P2.6's own list):** K2's acceptance – adjacent pairs
  whose later draw HAD an alternative – goes **3129/5683 → 0/5683** on a posed career and **2118/4011
  → 0/4011** on a bare one (240 careers per arm); K3 on draws with three to choose from,
  **54/131 → 0/131**. Careers with at
  least one adjacent repeat fall 100% → 25%, and every survivor is a week whose reachable pool was
  ONE, where no exclusion can help and the degradation is doing its job.
  ⚠⚠ **AND K4 FAILS EVERY CELL, WHICH IS (b)'s HALF AND NOT A BUG IN (a).** On the shipped
  eleven-situation catalogue a 40-conversation career meets **~2.5 distinct situations** and **14.1%
  of her conversations fall through to the legacy generic opener**. K5 passes: all eleven are
  reachable. The mechanism is built and proven; the corpus is what is missing.

  **(b) THE CORPUS, his:** ⭐ **RULED 16.09 – «давай сделаем 44 ситуации… или можно 55 для
  уверенности».** At 40 conversations in a ten-season career, 44 situations put each line at **1–2
  appearances** and leave some unseen in a playthrough, which is his own reasoning. 55 buys more.
  ⚠ New situations are new player-facing strings, so they are DRAFTS: the architect writes the
  document, he proofreads, nothing ships before he has.

- [~] **9. THE KNOCK CADENCE INTERRUPTS TOO OFTEN – round 42 #27's own parked signal has arrived.**
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

- [x] **10. ⭐⭐ THE KNOCK WINDOW SHOULD ANSWER «WHY?» – grown out of #9 rather than out of a complaint.**
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

- [x] **11. ⭐ A LETTER WHEN A BUILD FINISHES (his 16.09).** «Давай на почту присылать письмо про те
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

- [~] **13. ✅ C1a REFUSED (his 17.09) – and the question had a false premise.** The wave benched the
  per-career `style` draw and handed back a trade: three points of corner C against a 4.7% coaching
  discount. He read it and asked the right question back: «при чём тут вообще стили и цены? у нас в каждом
  тире 4 тренера (по 1 на стиль), коридоры их цен вообще не должны были измениться.»

  ⚠⚠ **He is right and the roster proves it: it is a 4×4 LATIN SQUARE** – every tier carries four
  coaches, one of each style. So «this tier has nobody for her game» is impossible by construction,
  and the only way to make it possible is to BREAK the square, which is what the benched draw did
  (independently per slot). The 4.7% discount was the price of a broken invariant, not of variability:
  24% of careers drew two great fits at a rung and 25% drew none, both arithmetically impossible while
  the square holds.
  ⭐ And the square-preserving version buys nothing – permuting which named man plays which style
  leaves the tier offering all four, so no player can tell. There is no third option.
  ⭐ The corners arrive without it anyway: the style shuffle moved B by one point and C by three; A, D
  and E were unmoved. §1's corners are made by the CHEMISTRY draw.
  ⚠ **Pinned by shape**, mutation-verified: `tests/round43-chemistry.test.ts` asserts four coaches and
  four distinct styles per tier, and duplicating one style reddens it.
  ⚠ **The architect's own error is recorded rather than edited away:** the trade was put to him on a
  false premise. The right question was «do we break the one-coach-per-style guarantee», and he had
  answered that on 30.07. A trade-off offered on a false premise is worse than no question.

- [~] **14. ⚠ THE MASSEUR'S OWN MONEY FORMATTER – a second implementation of a house rule, removed.**
  Found by his copy review of round 43's DRAFT strings, not by anything failing: `masseur.ts` carried
  its own `dollars()` reading `` `$${Math.round(cents / 100)}` `` – no thousands separator, no sign –
  so a four-figure rate would print `$1234` where every other surface prints `$1,234`.
  ⭐ **Real and invisible at once:** at 4%/yr the session rate does not reach four figures inside a
  normal career, so nothing could ever have caught it. `formatCents` is the one formatter and
  `shop.ts` and `sponsors.ts` already import it across the same boundary.

- [x] **12. ⭐⭐⭐ WAVES F1 AND F2 – `world.form` AND THE SPARRING PARTNER'S SEAT.** Spec
  [the-form-and-the-sparring-2026-09](../specs/the-form-and-the-sparring-2026-09.md), whose eight open
  questions O1–O8 he ruled on 16.09 («все по твоим рекомендациям»), so its own «Done when» was
  satisfied and the gate was open. Schema **v80**. The full predicted-vs-measured record is that
  spec's new §10; what a reader of this ledger needs is below.

  **F1 ships** `world.form` – tenths, 0-centred, clamped [−10, +10], zero draws (O4) – with both
  channels (the slump's residual against the odds ring, the rust's drift past a three-week gap), the
  return to neutral, ONE reader (`composureEff = composure + form × K` at `MatchPlayer` build time),
  the radar showing MODULATED composure (O3), and the coach's two sentences. **F2 ships** the third
  salaried seat: the engine leaf, the ladder, the money, the travel switch his 15.09 override asked
  for, the card on `SupportStaffTab` – and the portrait that has been in every install since round 42
  #53 and on no screen, which is round 43 #2's parked half finally closed.

  ⭐ **O1 WAS IMPLEMENTED RATHER THAN SKIPPED.** The scale arm ran and `K = 0.6` is measured at
  **1.64 pp** at the clamps against the ruled **[0.5, 4]** corridor – the spec's own proposal
  surviving its own test. ⚠ Every candidate from 0.4 to 1.2 is also inside, so the corridor admits a
  factor of three and the sweep is in the spec for him to move it against.

  ⚠⚠ **THREE DEFECTS WERE FOUND BY MEASURING, AND TWO OF THEM WERE IN THE SPEC'S OWN NUMBERS.**
  1. **§1c and §1b cannot both be true.** Reversion 0.5/wk applied first, drift 0.4/wk toward a floor
     of −4: the map's only attractor is the 2-cycle {0, −0.4}, so the floor is unreachable by a factor
     of ten and the whole sparring seat would be cutting four hundredths of a composure point. The fix
     keeps BOTH of his numbers and changes a rule instead of a dial – **reversion stands down on a
     rusting week**, because reversion is ordinary competition pulling her back and on a week she
     plays nothing there is nothing pulling. The floor is then reached in exactly ten matchless weeks.
  2. **§4's rung cuts collapse in tenths.** 0.4 × 0.35 and 0.4 × 0.15 both ratchet the number down by
     one tenth a week, so the top two rungs measured IDENTICAL (+0.312 / +0.312) – the masseur §4 law
     broken. Re-fitted to **0.75 / 0.5 / 0.25**, which are exact in tenths: the floor arrives in
     13 / 20 / 40 weeks against 10 unaided.
  3. **The bench's own instrument lied once.** Its event cursor was `events.length`, and `pruneEvents`
     shrinks that array – so every row after the first prune was invisible and the salary column read
     $1,250 a season for a $500/wk seat. Fixed to a monotone event id, which also un-killed the
     coach's good line (0.00 → 0.28 a season).

  ⭐ **ROUND 42 #48's PREDICTION HELD.** The stay-at-home stance reaches **88.9 / 87.0 / 84.7%** of the
  seat's whole effect against its predicted 89.4%, and only the not-travelling top rung ($69,656 a
  season measured against its predicted $72,800) lands inside the research's $50–80k band. The
  default stance is «stays home» and the card says so. §4's own «travelling is the job» stays
  overruled, now with two independent measurements behind it.

  ⚠ **FROZEN CAREERS RE-STAMPED** – 92 cells, per-key protocol first, control = the weekly pass
  neutralised IN PLACE. 3 / 34 / 33 keys of 94 moved on the three cells and **`rngMain` is
  byte-identical on all three**. `PRE_V80` is the first rung in that ladder whose values are NOT the
  previous version's live constants, for a reason its own block states at length.

  ⚠⚠ **O3 IS THE ONE RULING THIS WAVE DID NOT TAKE, and it is reported rather than forced.** The
  radar's modulated composure was built, measured and reverted: it breaks four shipped honesty
  contracts of the radar's own geometry, and satisfying all four means widening the drawn band,
  shifting both contours and raising the ceiling haze – a redesign of a picture he has approved,
  rather than a ruling. The spec's §10g carries the four contracts and the cheap alternative.

  ⚠⚠ **EVERY NEW PLAYER-FACING STRING IS A DRAFT and they are collected in the wave's hand-back for
  one pass.** Nine of them: two coach sentences, one receipt, and six on the seat's card and its
  ledger rows.

---

## HIS COPY REVIEW OF ROUND 43'S NEW STRINGS (17.09) – applied

He read every DRAFT string this round shipped and returned a diagnosis before he returned
replacements. **The diagnosis is the part that has to survive**, because it is a rule for the next
string rather than a list of corrections to twenty-one old ones:

> «much of the wording currently sounds translated, procedural, or conspicuously *written*… too many
> explanatory dashes; repeated abstractions such as "a body", "practice weeks", "somebody across the
> net"; internal system language leaking into player-facing copy; poetic phrases appearing inside
> confirmations and accessibility labels, where literal clarity matters; claims slightly broader or
> narrower than the mechanic actually proves.»

⭐⭐ **And the root cause he names, which is now built into the files rather than applied once:**
«trying to give every surface the same lyrical house voice is what currently makes several lines feel
AI-written». **The voices differ BY SURFACE**, and each file that owns one carries the table in its
own docblock:

| surface | voice |
| --- | --- |
| the knock window | reflective parental observation |
| the coach's eye | terse tennis language |
| the order letter | plain professional correspondence |
| confirmations and accessibility labels | **completely literal** |
| feed entries | compact consequences |
| receipts | vivid but restrained observation |

⭐ **One line was kept exactly as written**, and he said why: `Her first match back did not look like a
first match back.` – «the repetition gives it rhythm and makes it feel like an observation rather
than a tooltip». `tests/round43-form.test.ts` §7 pins it so that a later tidy-up cannot remove the
one thing he praised.

### The terminology sheet, and it is now a test

«In management copy, semantic consistency is more valuable than synonym variety.» One wording per
meaning, across every surface of the hitting-partner seat:

| meaning | wording |
| --- | --- |
| role | hitting partner |
| recruitment | hire |
| departure | let go / leaves the team |
| recurring cost | **weekly salary** (chosen; never «weekly fee», never «payroll») |
| function | match-style practice |
| home location | home club |
| travel location | on tour |
| travel cost | one additional fare per trip |
| benefit | helps her keep her timing between matches |

⚠⚠ **Before this pass not one of the seat's engine sentences was pinned by VALUE anywhere in the
repo** – every case asserted the mechanic and would have stayed green under any wording at all, which
is how five of these drifted into the register he objected to. `tests/round43-form.test.ts` §7 is the
contract now: it gathers every sentence the engine owns off a real career and asserts the struck
images are gone from **all** of them, which is a claim about the SET and cannot be checked one string
at a time.

### The three conditional choices he left open, and what decided each

1. **«counting» – SHORT FORM TAKEN.** He offered a longer unlock line for the case where «counting»
   is internal terminology the player has never been taught. It is taught: `CountingResultsTable` is
   a real table on the Stats screen and on the Kid screen, titled «… counting results», and
   `world/mandatory.ts` uses the phrase in a sentence the player reads.
2. **The rung change – «THE ARRANGEMENT CHANGES», not «a new hitting partner joins».** He warned that
   the personnel line «asserts a personnel change the model may not track», and it does not track
   one: there is no identity of any kind on this seat, and the decisive fact is the ledger –
   `SPARRING_CHANGE_KEY` is written by `hireSparring` **alone**, so a rung change does not restart the
   arrangement and «when did this arrangement start» still answers with the original hire. The model
   holds one continuous arrangement whose level moves. §7 asserts the tenure directly, so a future
   wave that makes a rung change write its own tagged row will be told the sentence has become the
   wrong one of the two.
3. **The dial label – «Hitting partner – experience level».** `ECONOMY.sparring.rungs` is a ladder of
   standing («A college hitter» · «A journeyman pro» · «A top-100 partner»), priced off the $50–80k/yr
   band in `docs/research/team-economics-2026-09.md` §4 – quality and experience, not tier 1/2/3 of a
   game system. ⚠ It is also an `aria-label` on the radiogroup rather than visible text, which puts it
   squarely under his «accessibility labels, where literal clarity matters» rule and makes it the
   worst of the four places «who is across the net» had been sitting.

### Every string, before → after

**The knock window** (`src/engine/knock.ts`, `knockCause`) – all four rejected; his faults: «on this
part» is not idiomatic, «a body brings up again» sounds translated, «picks things up» suggests
infection rather than injury, «joints» is too specific (`KNOCK_PARTS` carries a lower back and a
foot), and the fourth «tries too hard to absolve the player».

| | |
| --- | --- |
| – | `We sent her back out on this part before, and that is the one a body brings up again.` |
| **+** | `We sent her back out with a knock to her {part} before. Now the same place is troubling her again.` |
| – | `She went into the week tired, and a worn body picks things up.` |
| **+** | `She began the week already tired. Her body had less room for the work we asked of it.` |
| – | `The week we set was a hard one, and a hard week asks more of her joints.` |
| **+** | `We set a hard week. It asked more of her body than an ordinary one.` |
| – | `Nothing we did – the care we have been taking was working. Some weeks a body complains anyway.` |
| **+** | `No single choice explains this one. We had been careful. Bodies still have bad weeks.` |

⭐ **`part` WAS AVAILABLE, so the stronger first line ships.** `buildKnockPrompt` holds the whole
`Knock`; `knockCause` gained a required fourth parameter and the repeat branch names the real place.
⚠ **And the fourth branch was a CORRECTNESS fix, not a style one:** `fatigue + load <= 0` says the two
terms NETTED to nothing, not that neither existed – at condition 60 on a light week her fatigue term
is a real .088 that a −.090 credit merely covered. The line may report **no identified player-caused
factor**; it may not promise innocence. `tests/knock.test.ts` §5b-9 asserts exactly that.

**The build letter** (`src/components/OfferLetter.vue`, `InboxSheet.vue`) – his faults: «it is the
family's» is unnatural, «paid for on the order» should be «when the order was placed», «so is what it
costs to keep» is needlessly indirect, and a visible sender plus a signature repeats itself.

| | |
| --- | --- |
| – | `{label} is ready. It was ordered {week}, and after {wait} it is the family's from this week.` + two bullets (`There is nothing to pay here. It was paid for on the order.` / `It is on the family's books from this week, and so is what it costs to keep.`) |
| **+** | `{label} is ready.` / `The order was placed in {week}. After {wait}, it now belongs to the family.` / `Nothing is due on delivery; the full price was paid when the order was placed. Upkeep starts this week and will appear in the family accounts.` |
| – | sender `The order desk`, signature `– The order desk` |
| **+** | sender `Order desk`, signature `– Order desk` |

⭐ **THE SIGNATURE STAYS, and he made that conditional on the surface** («only if the interface
requires one; otherwise omit it, because the sender is already visible»). **On this surface it is
not**: `InboxSheet` prints the sender on the LIST row, and opening a letter replaces the list with the
paper alone. All seven letter arms sign; the build would have been the only unsigned one. The article
went because the two other desks are `Tournament desk` and `Tour office` – it belongs to the senders
that are institutions (`The academy`, `Her national federation`).

⚠⚠ **THE WAIT LADDER WAS REBUILT ON HIS CONSTRAINT AND NOT ON HIS EXAMPLE LIST, and this needs his
word.** He asked for `N.5 years` to go and sketched `a week / 6 weeks / 18 months / a year / 2 years /
2½ years`, under a rule that outranks the list: «only convert weeks to months or years when the
conversion is genuinely how the game calendar presents time. An exact 78 weeks is better than a
friendly but inaccurate 18 months.» **This game's calendar answers cleanly in both directions.** A
season is exactly 52 career weeks (`WEEKS_IN_SEASON`, «the only 52 in the engine»), so a **year** is an
exact conversion the player already reads. A **month is not a unit this game has**: no duration
anywhere in the app is stated in months (`monthLabel` exists for one chart axis and names a calendar
month, never a span), and the old ladder's `weeks / 4.33` is a fabricated rate.

| wait | was | now |
| ---: | --- | --- |
| 3 / 6 | `3 weeks` / `6 weeks` | unchanged |
| 12 | `3 months` | `12 weeks` |
| 52 | `a year` | unchanged |
| 78 | `1.5 years` | `78 weeks` – ⭐ his own worked example |
| 104 / 156 / 208 | `2 years` / `3 years` / `4 years` | unchanged |
| 215 (a skip overshoot) | `4 years` | `215 weeks` |

⭐ **So «18 months» and «2½ years» are NOT shipped**, and that is the one place this pass departs from
a wording he wrote down. His constraint was the load-bearing half and it points the other way from
the example rungs. The sweep in `tests/component/round43-build-letter.test.ts` walks every span from
3 to 260 weeks and asserts no month and no fractional year ever reaches the paper – the per-rung
table could not have caught the old ladder, which was wrong on spans nobody had listed.

**The masseur's ask** – see item 4 above; both lines are his, and his bottom-rung sentence named a
one-session rung that does not exist.

**The hitting partner** (`src/engine/world/sparring.ts`, `world/form.ts`, `world/sponsors.ts`,
`src/components/SupportStaffTab.vue`). He approved the title `Hitting partner` («authentic tennis
language»).

| surface | was | now |
| --- | --- | --- |
| coach's eye | `She is striking the ball clean.` | `She is striking the ball cleanly.` |
| coach's eye | `She needs matches under her.` | `She needs match play.` |
| receipt | `Her first match back did not look like a first match back.` | ⭐ **unchanged, his instruction** |
| unlock | `A hitting partner joins a professional operation – her first counting W-series result opens the door.` | `Her first counting W-series result opens a place for a hitting partner.` |
| hire | `A hitting partner is on the payroll now – practice weeks with somebody across the net.` | `A hitting partner joins the team – regular match-style practice on weeks without a match.` |
| release | `The hitting partner is let go – the practice weeks are hers alone again.` | `The hitting partner leaves the team – regular match-style practice between events ends.` |
| rung change | `A different hitting partner from the next bill – {rung}.` | `The hitting-partner arrangement changes with the next bill – {rung}.` |
| travel on | `The hitting partner travels now – one more fare on every trip, and a court on the road.` | `The hitting partner will travel from now on – one additional fare per trip, and a regular practice opponent on tour.` |
| travel off | `The hitting partner stays home – the practice court waits for her there.` | `The hitting partner will stay at the home club – no additional fare, and no regular practice opponent on tour.` |
| expense | `Hitting partner – weekly salary` | unchanged |
| travel expense | `Your hitting partner travels to the {tier} – one more fare{payer}` | `Hitting partner travel to {tier} – one additional fare{payer}` |
| card, hired | `On the practice court – the weeks without a match dull her less.` | `Helps her keep her timing during weeks without a match.` |
| card, unhired | `Somebody across the net on the weeks she is not competing.` | `A regular practice opponent for weeks when she is not competing.` |
| hire confirm | `Put a hitting partner on the payroll at {price} a week ({rung})? Cancellable any week, like the coach.` | `Hire a hitting partner for {price} a week ({rung})? You can end the arrangement any week, like the coach.` |
| release confirm | `Let the hitting partner go? The weekly salary stops, and the practice weeks are hers alone.` | `Let the hitting partner go? The weekly salary stops, and regular match-style practice between events ends.` |
| dial label (a11y) | `Hitting partner – who is across the net` | `Hitting partner – experience level` |
| toggle title | `Hitting partner travels to tournaments` | `Tournament travel` |
| toggle description | `On the road too – one more fare on every trip to a paying event. Most rust is made at home, so this buys the weeks away and nothing else.` | `Bring the hitting partner on tour for one additional fare per trip. Home practice is already covered; this extends the arrangement to travel weeks.` |
| toggle a11y, on | `Hitting partner travels to tournaments - on. Press to keep the practice court at home.` | `Hitting partner travel is on. Press to keep the hitting partner at the home club.` |
| toggle a11y, off | `Hitting partner travels to tournaments - off. Press to buy one more fare on every trip, for a court on the road.` | `Hitting partner travel is off. Press to bring the hitting partner on tour; each trip adds one fare.` |

⚠⚠ **THE UNLOCK LINE NOW DIFFERS IN SHAPE FROM ITS TWO SIBLINGS, DELIBERATELY.**
`world/masseur.ts` and `world/psychologist.ts` carry the same «joins a professional operation»
sentence and his terminology sheet strikes that phrase – but **those two are shipped copy from
earlier rounds and invariant 4 forbids an agent touching them on a task that did not ask.** Evening
the three up is exactly what his own wider note opens (below), and it is his to open.

### The two states he said were missing

1. ⭐ **RETAINED BUT SUSPENDED – IT EXISTED IN THE ENGINE AND ON NO SCREEN, so it was built.**
   `sparringWorksThisWeek` has stood the seat down at the college freeze and on a booked family week
   since it shipped, silently: a family at a university watched a salaried seat charge nothing and
   was told neither half. The new `sparringStoodDown` predicate is what the BILL reads too (one
   spelling), it crosses the wire, and the card prints his sentence verbatim:
   > `The hitting partner remains with the team, but is not working this week. No salary is charged.`

   ⚠ **The third stand-down is deliberately NOT in it.** A partner who does not travel also stands
   down on a week she is away – but that is what the travel switch SELLS rather than a suspension,
   its own row already says so, and it needs `away`, a phase-local fact a snapshot cannot honestly
   hold. `tests/round43-form.test.ts` §8 asserts the exclusion and, more importantly, the
   biconditional: **no week is ever both stood down and charged**, so the card cannot claim a free
   week the ledger took money for.

2. ⚠ **THE PER-RUNG EXPLANATION IS NOT SHIPPED – these are NEW strings and therefore DRAFTS.** His
   ask: «a lowercased rung label tells the player what they selected but not what changes. Each rung
   needs one short, mechanically accurate sentence.» Two candidate sets, both exact against
   `driftCut` (0.75 / 0.5 / 0.25 on a base drift of 0.4 a week):

   **A – the shape, which survives a re-tune of the cuts:**
   > `A college hitter` · `Takes a quarter off the rust of a week without a match.`
   > `A journeyman pro` · `Takes half off the rust of a week without a match.`
   > `A top-100 partner` · `Takes three quarters off the rust of a week without a match.`

   **B – the ladder a player can feel, which pins three constants to copy:**
   > `A college hitter` · `Ten matchless weeks dull her fully on her own; this stretches it to thirteen.`
   > `A journeyman pro` · `…to twenty.`
   > `A top-100 partner` · `…to forty.`

   ⭐ **A is the one to ship if he wants one**: B's three numbers are the measured 13 / 20 / 40, but a
   wave that re-prices the ladder would have to re-write the copy with it, which is the failure round
   42 #46's rule exists to prevent.

### ⚠⚠ A LINE OF COPY IS PERSISTED STATE – the frozen careers were re-stamped for two sentences

The gate went red on all five `coach-travel-edge-*` files, and the cause is worth carrying rather
than just fixing: **the coach's eye is written into `world.events[].text`, `events` is serialised, and
the frozen-career hashes are over that serialisation.** Re-wording «striking the ball clean» →
«cleanly» and «matches under her» → «match play» is therefore a byte change on every career that ever
saw either line. No constant moved, no predicate moved, no draw was taken and `SAVE_SCHEMA_VERSION`
is still 80.

⚠ **Per-key diff taken FIRST, control = this tree with the two sentences reverted in place** (a
reverse edit, never a checkout), `tools/frozen-key-diff.ts` on all three cells:

| cell | keys moved |
| --- | --- |
| 5/0 · 25k middle, grinder | **1 of 93 – `events`** |
| 8/0 · 120k wealthy, elite, grinder | **1 of 93 – `events`** |
| 0/1 · 8k working, self-coached | **0 of 94 – byte-identical** |

⭐ The third cell is the proof rather than a convenience: `coachFormNote` returns `null` with nobody
in the corner, so the self-coached career never saw either sentence – and **not one `selfTravelling`
cell changed in the fixtures file**, which is what that reasoning predicts before the rewrite and
what the diff counts after it. `rngMain` reproduces all three canonical fingerprints
(`1dbff28caca2` / `aebc8101d6df` / `d84bcbf0c481`) and the frozen MAIN capture (41550 / `e6b0c709`)
is unmoved and not re-pinned.

**62 cells re-stamped of 93 visited**, every one of them `middleGrinder` or `eliteGrinder`, computed
by running the exported helpers in a throw-away probe rather than transcribed from a failure message.
The protocol block at the head of `tests/coachTravelEdgeFixtures.ts` carries the whole record.

### Recorded and not acted on

- ⚠ **`masseur` → `massage therapist`.** He prefers it as clearer contemporary English and ruled the
  scope himself: «I would only change it project-wide, though – not in this isolated event.» Open
  question, his.
- ⭐⭐ **HIS WIDER OPENING, AS A ROUND ITEM: «на основе него можно пересмотреть и существующие наши
  письма может быть тоже».** The review could be applied to the game's EXISTING letters too.
  **Deliberately not done here** – it is a large invariant-4 surface and needs its own pass with his
  word per string. Its starting point is already written down: the per-surface voice table and the
  terminology sheet at the head of this section.

  ⭐ **THE FULL LIST, SWEPT BY SCRIPT – 26 live strings**, and the first version of this block was a
  hand-written nine. The nine were what this pass happened to walk past; a sweep over every string
  literal and every `<template>` text node in `src/engine`, `src/components` and `src/shared` finds
  **26**. Eight of the hand-written nine are in it; the ninth is `CoachMarketScreen.vue:899`, the
  `on` half of a toggle pair whose `off` half IS flagged – so the sweep found **eighteen the hand
  list had not**. ⚠ And the first SCRIPTED sweep under-reported too – its
  fare pattern read `one more fare|a second fare` and so missed «the second fare» (four sites) and
  «twice the fare» (two). Same missing-field class this session kept catching elsewhere; the fix was
  to write the rule from his sheet's POSITIVE wording («one additional fare per trip») and flag
  everything that means it and does not say it.

**«professional operation» – struck by the sheet** – 2

| string | where |
| --- | --- |
| `A masseur joins a professional operation – her first counting W-series result opens the door.` | `engine/world/masseur.ts:60` |
| `A psychologist joins a professional operation – her first counting W-series result opens the door.` | `engine/world/psychologist.ts:76` |

**«payroll» – struck; the sheet says «hire» and «weekly salary»** – 6

| string | where |
| --- | --- |
| `Put a masseur on the payroll at ${masseurSalary.value} a week (${masseurRungLabel.value.toLowerCase()})? Cancellable any week, like the coach.` | `components/SupportStaffTab.vue:253` |
| `Put a psychologist on the payroll at ${psychologistSalary.value} a week (${psychologistRungLabel.value.toLowerCase()})? Cancellable any week, like the coac` | `components/SupportStaffTab.vue:358` |
| `A masseur is on the payroll now – table work at home, every week.` | `engine/world/masseur.ts:91` |
| `A psychologist is on the payroll now – one call a week, wherever she is.` | `engine/world/psychologist.ts:117` |
| `The psychologist is off the payroll – the calls stop at the end of the week.` | `engine/world/psychologist.ts:118` |
| `Nobody is taking the call – a year of work needs somebody on the payroll first.` | `engine/world/psychologist.ts:357` |

**the fare – the sheet's wording is «one additional fare per trip»** – 14

| string | where |
| --- | --- |
| `Table work between rounds – one more fare on every trip to a paying event, and the week is billed per match there (${formatCents(masseurRateCents.value)} e` | `components/SupportStaffTab.vue:237` |
| `Masseur travels to tournaments - off. Press to buy one more fare on every trip, for table work between rounds.` | `components/SupportStaffTab.vue:272` |
| `<p v-if="pending?.coachTravelled" class="tf-brief-here">At the tournament with her this week – a second fare on this trip.</p>` | `components/TournamentFlow.vue:1043` |
| `Twice the fare on every trip – a second seat beside hers.` | `components/screens/CoachMarketScreen.vue:319` |
| `Coach travels to tournaments with her – off. Press to buy the second fare on every trip.` | `components/screens/CoachMarketScreen.vue:900` |
| `Coach travels to junior and domestic tournaments – on. Press to stop paying the second fare on the trips that pay no prize money.` | `components/screens/CoachMarketScreen.vue:934` |
| `Coach travels to junior and domestic tournaments – off. Press to buy the second fare on those trips too.` | `components/screens/CoachMarketScreen.vue:935` |
| `Your coach travels to tournaments with her now – a second fare on every trip.` | `engine/world/coachMarket.ts:262` |
| `Your coach travels to junior and domestic tournaments too – a second fare on trips that pay no prize money.` | `engine/world/coachMarket.ts:292` |
| `Your coach stays home for junior and domestic tournaments – the second fare is for the events that pay.` | `engine/world/coachMarket.ts:293` |
| `The masseur travels to tournaments now – one more fare on every trip, and table work between rounds.` | `engine/world/masseur.ts:342` |
| `Your coach can travel to tournaments with her now – the switch is in the coach room, and a trip with the coach costs twice the fare.` | `engine/world/milestones.ts:106` |
| `Your masseur travels to the ${TIERS[event.tier].label} – one more fare${payer}` | `engine/world/sponsors.ts:1216` |
| `Your coach travels to the ${TIERS[event.tier].label} – a second fare${payer}` | `engine/world/sponsors.ts:1300` |

**a hyphen where the house uses the short dash –** – 5

| string | where |
| --- | --- |
| `Masseur travels to tournaments - on. Press to keep the table work at home.` | `components/SupportStaffTab.vue:270` |
| `Masseur travels to tournaments - off. Press to buy one more fare on every trip, for table work between rounds.` | `components/SupportStaffTab.vue:272` |
| `aria-label="Coach note - open the Coach Market` | `components/screens/HomeScreen.vue:1646` |
| `aria-label="Coach - open the Coach Market` | `components/screens/KidScreen.vue:491` |
| `<p v-if="supplyLine" class="season-supply" :title="'Tournaments you can still enter this season, counted across every level open to her - including the rar` | `components/screens/SeasonScreen.vue:1395` |

  ⚠ **Not one of them is touched.** They are shipped copy from earlier rounds, the task did not ask
  for them, and invariant 4 is explicit that fixing something adjacent is not permission. What each
  becomes is his word, string by string.

  ⭐ **Three of his rules were checked against the existing letters and already hold** – worth
  recording, because a clean result is a result:
  - **the recurring cost** – `weekly salary` is already the single spelling (6 live uses); «weekly
    fee» appears once, in `world/sparring.ts`'s binding comment naming the choice. His «choose one»
    is satisfied repo-wide, not just on the new seat.
  - **«counting»** – taught, per the reasoning above, so the short unlock line is right on the
    masseur and the psychologist as well as the hitting partner. Nothing to change.
  - **the dial labels** – `Masseur sessions per week`, `Psychologist – who takes the weekly call`,
    `Psychologist – the year's work` are already literal. His a11y finding was specific to
    «who is across the net» and does not extend to the siblings.

  ⚠⚠ **AND HIS CONDITIONAL WARNING CAME TRUE – THIS ROUND MADE IT TRUE.** He wrote: «make sure the
  economy really charges per session. Existing language such as `Masseur – weekly salary` would
  contradict this model if the underlying expense remains a flat weekly payment.» The check runs the
  other way round. The expense is NOT flat – #4 made the masseur per-session, and
  `masseurWeeklyCents` is `rung.sessions * masseurSessionCents(world)`. Its two siblings ARE flat
  (`psychologistRungOf(world).salaryCents`, `sparringRungOf(world).weeklyCents`), so their rows are
  accurate. **The masseur's is not**: `world/masseur.ts:520` still bills a per-session arrangement as
  > `Masseur – weekly salary`

  ⭐ This is the one finding of the audit that round 43 CAUSED rather than inherited, and it is a
  fact-about-the-model error rather than a register one – but it is still a player-facing string, so
  it is his word like the other 26. The seat's own dial already says the true thing
  (`Masseur – sessions per week`).

  ⚠ **One gap does extend to all three seats: the per-rung explanation.** No seat has a sentence per
  rung – not the masseur, not the psychologist, and not the hitting partner (the two candidate sets
  are drafted above and unshipped). His ask was general: «each rung needs one short, mechanically
  accurate sentence.»

---

## F1's `G`, SWEPT (17.09) – measured, and the shipped value is what the rule selects

The owner, on §10b's finding that the corridor prices a place no career visits: «что предлагаешь,
давай попробуем. **Важно не переборщить**», then «меряй». Swept, not chosen in advance.

**Instrument:** `tools/form-g-sweep.ts` (`npm run bench:gsweep`), 18 careers × 624 weeks an arm –
§10b's own census re-walked once per candidate. ⚠ `K` was READ and never swept: the [0.5, 4] pp
corridor is his ruling and `K` is its consequence; `G` is how far form travels, `K` is what a point
of it is worth. ⚠ The arm was proven first – at `G × 10` the lived band is [−10, +10] and 24.1% of all
weeks sit at a clamp against 0.0% shipped.

| `G` | lived p5 | lived p95 | weeks within 1 of a clamp | careers reaching a clamp | **lived pp swing** |
| ---: | ---: | ---: | ---: | --- | ---: |
| **1.50 – shipped** | **−4.0** | **+1.9** | 0.0% | **0 of 18** | **1.42 pp** |
| 1.75 | −4.2 | +2.5 | 0.0% | 1 of 18 | 1.42 pp |
| 2.00 | −4.9 | +3.2 | 0.3% | 3 of 18 | 1.67 pp |
| 2.25 | −5.4 | +3.6 | 0.5% | 4 of 18 | 1.92 pp |
| 3.00 | −7.2 | +5.8 | 3.2% | 14 of 18 | 2.50 pp |
| 4.00 | −8.8 | +7.0 | 6.7% | 18 of 18 | 2.67 pp |
| 5.00 | −9.6 | +8.3 | 12.4% | 18 of 18 | 2.75 pp |

⭐⭐ **THE RULE – «the largest `G` at which NO career reaches a clamp» – KEEPS 1.5, AND THERE IS NO
HEADROOM ABOVE IT AT ALL.** `G = 1.75`, the smallest increase worth trying, already shelves one career
of eighteen at +10. **Nothing was changed: `ECONOMY.form.gain` is still 1.5.**

⚠ **The honest reading is not «1.5 is optimal».** The shipped census's tails are already +6.3 / −7.6,
within two and a half points of the rail; a dial that stretches p95 from +1.9 to +2.5 stretches the
tail through the clamp at the same time. So the finding is **`G` alone cannot be raised without
shelving somebody** – which is more useful than a number.

⚠ **And §10b's «0.5–0.7 pp» was an inference; the measurement is 1.42 pp** at the widest opponent,
about 85% of the 1.64 pp the mechanism reaches clamp-to-clamp. The gap between what form CAN do and
what it DOES is much smaller than §10b estimated.

⭐ **Three shapes that would raise the bite without shelving anybody, all of them his and none taken:**
widen the clamps together with `G`; raise `K` (§10a measured 0.4–1.2 all INSIDE the corridor, so 0.8
buys 2.25 pp at the clamps with the lived band untouched); or make the gain asymmetric by sign – the
tail that breaks first is the POSITIVE one, because a purple patch compounds faster than a slump
does against a reversion that pulls both ways. The full tables are in the spec's new **§11**.
