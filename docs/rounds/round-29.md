---
type: round-ledger
status: current
area: rounds/29
canonical: false
last-reviewed: 2026-08-28
---

# Round 29 – the pro years, 18 items (28.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in his own numbering**, off save `alice-cfbv_w780` (⚠ personal, `~/Downloads`,
READ-ONLY – never copied into the repo, never a fixture) and three screenshots: the season feed at
W47–W2 '44/'45, the inbox, and the Tour office letter.

⚠⚠ **CORRECTION – the save IS schemaVersion 65, so he played a build WITH round 28 in it.** My first
note here said the opposite. That matters most for item 10: round 28 #15 widened her cut to sponsor
cheques, and it is live in this save.

⭐ **His instruction on how to run this round**, and it shapes every bundle below: «делай план работ,
выбирай агентов и запускай всю волну поочередно в ночь, работы много, мы не торопимся, одновременно
не надо делать, а пошагово вполне отлично». **One agent at a time.** No parallel fan-out – the
contention artefacts of round 28 cost more reading than the wall-clock they saved.

⭐ And his verdict on where we are: «По победам как-будто по-лучше стало» (item 4) and «Сейчас уже
ощутимо хорошо».

---

- [x] **1. «На 23 неделе 44 года у меня в ленте был Шлем и не подал заявку, девушка была exhausted,
  я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет! Текущее место 116 (минус 11) показывает.
  После победы w500 снова появился. Это не очень хороший паттерн.»** – **measure, then build.** ⚠ The
  Slam is rank-gated, so a rank slip past its cut removes it mid-window. **The defect he is naming is
  not the gate, it is that resting COST him the entry and nothing warned him.** Check whether the
  vacation itself moved the rank (points decay over a rolling window) or whether the rank had already
  slipped. ⭐ His «не очень хороший паттерн» is the design complaint: a decision that removes content
  must be legible before it is taken, not after.

  ⚙ **MEASURED FIRST, AND THE MEASUREMENT MOVED THE ANSWER.** 12 careers x 624 weeks through the
  SHIPPED predicates (`toSnapshot`, `feedContext`, `feedShows`, `preferredWeekEvent`), so the probe
  cannot disagree with the screen. **140 Slam cards left the feed:**

  | why | n | share |
  | --- | --- | --- |
  | the slam's OWN WEEK had passed – the eight-week horizon moved on | **134** | **95.7%** |
  | `tierOpen.slam` went false – her rank crossed the acceptance cut | 3 | 2.1% |
  | other | 3 | 2.1% |

  ⚠ **SO THE DOMINANT CAUSE IS A THIRD ONE NEITHER OF US NAMED**: the feed looks eight weeks FORWARD,
  and a week he spends is a week the Slam falls behind. The rank gate is real and is his «116 (минус
  11)» exactly – two of the three crossings are clean: **92 -> 128** and **105 -> 130** against a cut
  of 112, each in a SINGLE week – it is simply not what usually does it.

  ⚙ **AND THE REST ITSELF MOVED NOTHING.** 58 forks taken from weeks where the Slam card was ON SCREEN
  and her rank was within 40 places of the cut, each run THREE ways for four weeks from one world –
  BOOK A FAMILY WEEK / IDLE / PLAY THE POLICY. The rung's verdict was identical in all three arms in
  all 58 (`closed after rest = 1, after idle = 1, after play = 1`); the rank differences between rest
  and idle were small and UNSIGNED, i.e. a diverged world, not a penalty for resting. **The decay is a
  calendar fact: a counted result leaves the 52-week window on its own.** So of the two candidates the
  answer is the second – the slip was going to happen and the vacation spanned the moment.

  ⚙ **THE DELIVERABLE SURVIVES THAT, WHICH IS THE POINT.** `composables/restCost.ts` +
  `PlanWeekSheet.vue`'s Vacation tab: the tab he books from now states, BEFORE the press, what the
  week costs. Two sentences, both facts already on the Snapshot and neither a forecast:

  > *She is defending 130 pts from that week, and a week away banks nothing in their place.*
  > *At #92 she is 20 places inside the Grand Slam cut of 112 – a rung that closes takes its
  > tournaments off the feed.*

  ⚠ **THE TRIGGER IS THE DEFENDING SLOT** – the counted result exactly one ranking window behind the
  booked week, the same arithmetic SeasonScreen's defending badge already uses. A week that defends
  nothing costs her ranking nothing, so a note on it would be furniture on every booking. The cut
  clause RIDES on that trigger and is dropped when she is not near one: `GATE_NEAR_PLACES = 40`, and
  it is **measured, not picked** – the two clean crossings above moved her 36 and 25 places in one
  week, so a threshold that would have warned him has to be at least 36.

  ⚠ **THE GATE IS NOT TOUCHED.** `tierOpen`, `acceptanceRank` and every entry rule are read and never
  written; field access is a later wave's. This is a sentence.

  **Evidence.** `tests/component/round29-rest-cost.test.ts` – 6 cases, 4 of them mounted on the real
  sheet: both lines with their numbers, the note ABSENT on a week that defends nothing, the cut clause
  alone dropped for a girl 41 places clear, and the takeover shell that answers round-20 #3 here (the
  exit is in a header that does not scroll, and the sheet does not block).
  ⚠ Mutation-verified, three, each alone: the gate clause disabled -> 1 red; the trigger widened to
  fire on every week -> 2 red; and the copy pin proved by putting Cyrillic in a template -> 1 red.

- [x] **2. «Надо сделать предзагрузку картинок для оффлайн, у меня в ленте через одну черные плашки
  в сезоне»** – **build.** Every other card in the season feed renders black. PWA precache already
  exists (`118 entries` in the build log); the feed's imagery is evidently not in it.

  ⚙ **DIAGNOSED BEFORE IT WAS FIXED, AND «ЧЕРЕЗ ОДНУ» IS THE WHOLE CLUE.** Nothing is missing from
  disk – every stem `art/venues.ts` and `art/weeks.ts` can spell has its webp, checked both ways by
  two existing tests. What was missing is the FETCH. `vite.config.ts` keeps ALL of `public/images/**`
  out of the precache (`globIgnores`) and serves it through a CacheFirst RUNTIME route, so a picture
  is on the device **if and only if something asked for its URL while there was a network** – and
  nothing did: `art/preload.ts` warms her portraits, her coach and the one journey-home frame, and the
  feed's courts and week frames were on nobody's list. The quiet weeks share four paintings between
  them (`training` + the three off-season frames) so on any phone that has been online they were
  fetched long ago; a tournament card binds a DIFFERENT court every time (`venueArtStem` – one
  photograph per event, forever), so every card he had not already scrolled past was a URL nothing had
  ever requested. **Tournament, quiet, tournament, quiet.**

  ⚙ **REPRODUCED IN A BROWSER, NOT REASONED.** `e2e/offline.spec.ts` gained *"the season feed keeps
  its pictures with the network cut"* – a real production build with a real registered service worker,
  the network cut with `context.setOffline`, and `naturalWidth` read off the feed's own `<img>`s.
  Before the fix it named **seven blank plates** on the `junior` fixture:
  `local-clay-1`, `local-clay-1`, `training`, `regional-clay-1`, `training`, `local-clay-1`,
  `study-young`. After it: **zero**, on the same fixture and the same build.

  ⚙ **THE FIX IS A PRELOADER, AND IT ADDS NOTHING TO THE PRECACHE.** `src/art/feedArt.ts` +
  one watch in `art/autoPreload.ts`, keyed on the WEEK, which is the feed's own trigger.

  | cost | figure |
  | --- | --- |
  | **added to the precache** | **0 bytes.** `globIgnores` untouched, install stays 118 entries / 2826 KiB |
  | what precaching the courts instead would have cost | **+5108 KiB** (73 webp, `ls`) – nearly triple the install, for art most careers never see |
  | fetched at runtime | at most ONE painting per week of the horizon = 8. Courts average 70 KiB, week frames 25-82 KiB, so a cold career's first warm is under ~560 KiB |
  | every later tick | ONE new week – `warm()` is idempotent per URL, so the seven that merely slid along cost nothing |

  ⚠ **ONE PER WEEK, NOT ONE PER EVENT, AND THE GAP IS LARGE.** Measured on the same 12x624 corpus:
  `snapshot.upcoming` holds a **median of 30 events (max 38)** because a week stacks several rungs,
  against a feed that draws a median of 5 cards and never more than 8. Warming `upcoming` would fetch
  ~2 MB per career to paint eight cards. The module asks the feed's OWN question instead – the same
  `feedContext` / `feedShows` / `preferredWeekEvent` the screen asks – so the picture warmed is the
  picture drawn, by construction.

  ⚠ **AND `maxEntries: 80` IS DELIBERATELY LEFT ALONE.** vite.config.ts records that 167 files reach
  `tb-art-v1` against a cap of 80 and leaves the number as an owner storage-budget call. It does not
  need moving for this: a warm write is the most recently used entry, so the eight the feed is about
  to draw are the last things eviction reaches.

  **Evidence.** `e2e/offline.spec.ts` (above – the only layer that can prove a file is ON the device
  with the network gone) and `tests/round29-feed-art.test.ts` – 4 cases: every court the feed will
  draw is in the set, the quiet weeks' frames are in it, the set is bounded by `UPCOMING_WEEKS + 1`
  at weeks 0/20/40/80 however many events stack, and no snapshot means no fetches.
  ⚠ Mutation-verified: the venue arm dropped from `weekUrl` -> 1 red in the unit file, and the e2e
  itself is the mutation proof for the whole module (red at baseline, green after).

  ⚠ **ONE GUARD RE-AIMED, NEVER DELETED.** `tests/redesign-home.test.ts`'s *"the per-band portrait
  budget is untouched"* counts the watches in `art/autoPreload.ts` and stood at 3; the feed's warm is
  a fourth, on its OWN trigger, which is the third time that has happened and the exact reason the
  guard exists. 3 -> 4, plus the new trigger named in the set beside the count, so a fifth addition
  still has to say what it keys on. ⚠ Mutation-verified against the fact it protects: folding
  `preloadFeedArt` into the AGE watch reddens it (`expected 3 to have a length of 4`).

  ⚠ **AND THE WATCH KEYS ON THE ENTRIES AS WELL AS THE WEEK**, which the first draft did not.
  `preferredWeekEvent` puts the ENTERED event at the front of its tiebreaks, so entering a lower rung
  on a stacked week changes which photograph that card draws – and entering works perfectly well with
  no network. Keyed on the week alone, the newly-preferred court would have stayed cold precisely
  when he had just committed to it.

- [x] **3. «В разделе календаря недели всё ещё нет блоков про съёмки… а если это выпадает на неделю
  турнира, то на затраченной энергии должно отражаться. А, увидел на пустой неделе, но на
  чемпионатской нет. Может сделать возможность переноса съёмки или всё-таки жарить прямо с
  чемпионатом с последствиями.»** – **build + ask.** ⚠ Round 28 #1/#6 shipped the shoot week and
  **deliberately exempted a tournament week** – the engine pays the masseur nothing there and the
  builder recorded «lights and flights, not his table». **He has looked at that exemption and does not want it** –
  «но она же осталась на турнирной неделе, значит надо понять как с ней быть».

  ⚙ **HIS RULING, and it is better than the fork I offered him.** I asked him to pick between moving
  the shoot and paying for it; he says the CHOICE BELONGS TO THE PLAYER, and named all three arms:

  1. **cancel the tournament**;
  2. **cancel or move the shoot** – ⚠ and cancelling «явно должны быть последствия какие-то», moving
     presumably not;
  3. **shoot and play in the same week**, paying for it in condition – his own figure: **«+1 в день,
     т.к. съемка занимает не один час, то нагрузка будет мощной на всю неделю»**.

  ⭐ So this is a decision surface, not an automatic resolution. The week must ASK.

  ⚠⚠ **AND A DEFECT HE FOUND FROM FIRST PRINCIPLES WHILE READING MY ANSWER** – «а вот не очень
  понятно как связано. Если есть турнир или тренировки, то есть и массажист.» He is right, and my
  sentence to him («съёмочная неделя массажисту не платит») was **wrong** – I repeated an agent's
  phrasing instead of reading the code.

  **The engine and the screen disagree, and only on the shoot:**

  | | rule |
  | --- | --- |
  | engine, `masseurWorksThisWeek` | hired · not college · not a booked holiday → **he works and is billed** |
  | screen, `weekDays.ts:429` | hired · not frozen · not booked off · **`&& !shooting`** · home-or-travels |

  **`!shooting` exists only in the UI.** So a shoot week **charges for the masseur and draws none of
  his sessions** – precisely «the "you paid and cannot see it" failure the plan bans specialists for»,
  which is written in that same file fifteen lines above the bug.

  ⭐⭐ **Third time this round the UI has invented a rule the engine does not hold** – calendar Part 0,
  the domestic-points plaque, and now this. That is a pattern, not three accidents, and it is worth a
  standing check rather than three separate fixes.

  ⚙ **SHIPPED, BOTH HALVES.** `[ ]` -> `[x]`.

  **THE WEEK ASKS, with four buttons for his three arms** (the second is «cancel or move», and a card
  that hid that pair behind one control would ask him to choose twice). Built on the fork's and the
  knock's own shape rather than a new one – `shootClashOpen` is a predicate `advanceRefusal` blocks
  on, `Snapshot.shootClash` carries the card, `blockingOverlay` places it in the queue, and
  `answerShootClash` is the one command that clears it. `engine/world/shootClash.ts`,
  `components/ShootClashDialog.vue`.

  ⚠⚠ **IT IS RAISED THE WEEK BEFORE, AND THAT IS FORCED BY HIS OWN ANSWERS RATHER THAN CHOSEN.**
  `cancelEntry` refuses outright once `event.week <= world.week` («That week has already started –
  skip the tournament instead») and `skipEvent` needs a `pendingTournament` that does not exist until
  the tick has run; and a shoot cannot be moved out of a week already being lived. So two of the four
  arms only EXIST before the week starts, which is also why this blocks rather than merely halting: an
  advance that rolled past it would silently pick one of the other two for him.

  | arm | what it does | what it costs |
  | --- | --- | --- |
  | pull out | `cancelEntry` – the engine's existing withdrawal | the fee, forfeited past the deadline, plus the late-withdrawal points where `mandatoryBinds` says the event bound her. ⚠ **Nothing new was invented**: it costs exactly what pulling out of that tournament costs from the calendar on any other week |
  | move the shoot | the first week the letter's own promises still allow – in-season, inside the term, non-adjacent to the other shoot, and not another entry | nothing, as he said |
  | cancel the shoot | the week leaves `shootWeeks` | ⭐ **his «явно должны быть последствия»**, read off the CONTRACT and not tuned: `cashCents / shootCount`, the shoot's own share of the campaign fee, back to the brand under 'sponsor' ($10,000 of Quiet Hour's $20,000) |
  | do both | both stand, the week is latched | **his own figure**: `clashConditionPerDay` (1) x `PLAN_DAYS` (7) = **7 condition off the week**, on top of the travel-figure recovery a shoot week already pays |

  ⚠ **THE PRICE IS CHARGED OFF THE FACT, NEVER OFF THE ANSWER.** `accrueCondition` reads the shoot
  week and `isCompetitionWeek`; the latch (`shootClashAccepted`) exists only to stop the question
  being asked twice. So a career that reaches the collision by any other road – a save written before
  the question existed included – is charged correctly.

  ⚠ **SCHEMA STAYS 65.** One optional persisted field, `WorldState.shootClashAccepted?: number[]`,
  absent meaning exactly what every historical save already means. `WorldEvent.entryRef`'s own rule.
  `ToWorker` gains a command; the wire is not the save.

  **AND THE MASSEUR DEFECT IS FIXED IN THE ENGINE'S DIRECTION** – the bill is right, the drawing was
  not. `masseurWorksInWeek` is `masseurWorksThisWeek`'s body taking primitives (`spanWorthOffering`'s
  precedent) and `weekDays.ts` asks it instead of re-spelling it.

  ⚠⚠ **ONE CORRECTION TO THE TABLE ABOVE, AND IT SHARPENS THE PATTERN RATHER THAN SOFTENING IT.**
  «`!shooting` exists only in the UI» is not quite right: `accrueCondition` has one too, and has since
  the round-25 collect – «lights and flights, not his table». So the screen was not inventing a rule,
  it was mirroring the WRONG ENGINE READER: the one that decides the condition bonus, instead of the
  one that decides the BILL. That is a worse failure mode than invention, because it looks correct at
  every step. **`accrueCondition`'s term is deliberately UNTOUCHED** – it is owner-approved, it is
  about the condition sum rather than about the man, and retuning it was not asked for. ⭐ **Open for
  him:** on a shoot week the family now pays the masseur, sees his days on the calendar, and still
  gets no condition bonus from them. That is coherent (his work goes into getting her through the
  shoot) but it is a decision, and it is his.

  **Evidence.** `tests/round29-shoot-clash.test.ts` – 18 cases on ticked worlds: the refusal with zero
  ticks, the prompt on the snapshot, three negatives (a shoot alone, a tournament alone, a collision
  she is laid up for), one case per arm reading the outcome off the world, the condition price read
  out of `accrueCondition` AND out of a real `tickWeek` against a control that differs only in where
  the shoot is, and a case per arm proving the career is unblocked afterwards.
  `tests/component/round29-shoot-clash-ui.test.ts` – 11 mounted: the card on the real shell, one
  button per answer through the real click path, the move arm ABSENT when the term has no room
  (R10-16), the copy rules, and round-20 #3's phone fit at 375x667 and 320x568, mutated.
  ⚠ Mutation-verified: the condition term dropped -> 2 red in the engine file, the rest green; the
  refusal dropped -> the zero-tick case alone.
  `tests/component/round29-masseur-parity.test.ts` – 10 mounted, and the parity block is the point:
  one world, two readers, four week kinds. ⚠ **The asymmetry is the record** – the engine rule mutated
  (`masseurWorksInWeek` ignoring `bookedOff`) reddens this file AND `tests/masseur.test.ts` (3 cases);
  `&& !shooting` put back in the UI alone reddens this file and the re-aimed round-28 case and nothing
  engine-side. ⭐ That is the third instance of this class this round, and it is now checkable.

- [~] **4. «По победам как-будто по-лучше стало»** – ⚙ **his own verdict, recorded, nothing to build.**

- [x] **5. «В магазине всё ещё не хватает яхт, самолётов и стойки академии»** – **build.** Slice 1
  (cars) shipped; the spec [the-shop-2026-08.md](../specs/the-shop-2026-08.md) already carries yachts,
  the parents' plane and the academy. This is round 28 #7 with the queue position now given.

  ⚙ **ALL THREE STOREYS SHIPPED – the spec's slice 3 AND slice 5 in one branch, because they are one
  sentence of his.** `[ ]` -> `[x]`. Everything below is §3f and §3g of the spec, and §13 there is the
  as-built record with the numbers. **`SAVE_SCHEMA_VERSION` DID NOT MOVE – it is still 65**, and the
  spec predicted that a slice in advance: §12a's «slice 3 can add `readyWeek?: number`
  (absent = delivered) … with **no migration at all**». It did, so there is no v66, no migration and
  no golden fixture.

  **THE ELITE ARE NOT BOUGHT, THEY ARE COMMISSIONED** – his own framing («купил и ждешь пока будет
  готово, яхты строят несколько лет»), and each rung carries the THREE numbers he asked for rather
  than one («потерю стоимости в год + годовое обслуживание (недельный кост, ага)»):

  | thing | price | wait | loses / yr | **a week to keep** |
  | --- | --- | --- | --- | --- |
  | The launch | $900,000 | 1 yr | 7% | $1,038 |
  | The motor boat | $2,400,000 | 1.5 yr | 7% | $2,769 |
  | The yacht | $12,000,000 | 3 yr | 5% | **$23,077** |
  | The big yacht | $28,000,000 | 4 yr | 5% | **$53,846** |
  | The plane | $18,000,000 | 2 yr | 6% | **$27,692** |
  | The long-range plane | $38,000,000 | 3 yr | 6% | **$58,462** |

  ⭐ **THE WEEKLY BILL IS A REAL BILL** – `resolveAssetUpkeep` charges it in the same phase that
  charges the coach, one ledger row per thing by name, and it is inside
  `coachBilling.household.outgoingCents`, which is the strip round 28 #8 exists for. A yacht is
  roughly thirty-eight coaches a week; a cost that bypassed that total would be round 28 #8's own
  defect again and larger.

  ⚠⚠ **AND NOTHING HERE CAN STRAND A FAMILY, which was checked rather than assumed.** The two states
  are disjoint by construction: **while it is being built it cannot be sold and it charges NOTHING;
  the week it arrives the upkeep starts and it becomes sellable the same week.** There is no week in
  which the family is paying for a thing it has no way out from under.

  ⭐⭐ **A WEEK ON THE YACHT IS THE SEVENTH VACATION PACKAGE**, his own idea. Free at the point of use
  (the money went years ago), gain **48 – a tie with the elite programme** – and `buffFactor: 1`
  against elite's 0.85, so it wins on price and elite keeps the injury buff. That is §3f's own veto
  satisfied («the yacht must NOT be the strictly best rest week available»), and it is the first arm
  of the fork the spec named and did not answer. It has its own drawn week on the calendar grid and
  its own two diary lines – ⚠ **found by two existing guards going red**, not by inspection: a
  package with no arc and no line would have shipped as a blank week and a generic sentence.

  ⭐⭐ **THE PLANE IS THE PARENTS' AND IT HAS TWO EFFECTS, one loud and one silent** – his correction
  and his figure. The fare cut is **half** of every seat the family pays for, hers and the staff's,
  because it is one aeroplane; the fatigue point is **hidden**, by his own ruling about the court it
  is an analogy of («верно, но только если знают об этом, я предложил сделать бонус скрытым»). ⚠ The
  split is deliberate: money facts are always on screen here, and «hidden means never a number on a
  card». ⚠ **The two +1s cannot stack**: the court's lands on weeks she is NOT competing and the
  plane's on weeks she IS, which is §3f's own answer to the stacking worry.

  ⭐ **THE ACADEMY IS FOUR STAGES IN HIS ORDER** – land $2M, courts $3M, the clubhouse $4M, the staff
  $3M = **$12M**, the middle of his «$8–15M» band. Each stage is a decision and a bill, the chain is
  enforced (`requiresId`), and a half-built academy is a real state: the stages it has are valued,
  the ones it does not keep their price on screen and name the one that comes first.

  ⚠⚠ **THREE PLACES THE SPEC WAS SILENT AND I CHOSE, all recorded in the spec's §13b for him to
  overrule:** the four academy prices are MINE (§3g gives a band and four names, exactly as §12b's
  house tiers were mine); the plane's fare cut is **half** and not the whole fare (his verb is
  «резать», not «убрать», and a fare that fell to zero would take the travel line off the ledger);
  and the yacht week ties elite rather than beating it.

  ⚠⚠ **AND ONE THING IS NOT BUILT, DELIBERATELY: THE EPILOGUE DOES NOT NAME THE ACADEMY.** That is
  the second half of the spec's slice-5 acceptance, and it depends on §10.4 – «Does the shop survive
  an ending?» – which that file still lists as **HIS** and which has never been ruled on. Building a
  retirement card off an un-ruled proposal is the scope-widening the house forbids. **It needs one
  word from him**, and it is small when it comes.

  ⚠ **THE GATE IS UNCHANGED AND THAT IS WORTH HIS EYE.** `shopUnlocked` (the professional era) opens
  the whole shelf, storeys included – §12c settled the buy-gate question with his own words
  («магазин есть и всё, мы не можем запретить там что-то покупать»), so no second gate was invented.
  What gates a $38M aeroplane is its price: most careers will look at these rows and never press one.

  **Evidence.** `tests/round29-shop-elite.test.ts` – 23 engine cases in six blocks: the ladder IS the
  spec's table; ordered-not-bought (the wallet, the contract, no upkeep, no depreciation while it
  builds); delivered (the ledger line, the value clock starting at ARRIVAL and not at the order, the
  bill leaving the wallet measured as a difference of differences against the same career with the
  boat sold, and the same figure inside `householdWeekly`); the academy's four stages and their
  order; ⭐ the plane's fare on both seats and its HIDDEN point, asserted as an absence with an
  anti-vacuity arm; and the yacht week appearing only once delivered, disappearing again on a sale.
  `tests/component/round29-shop-elite.test.ts` – 13 mounted on the real screens: every new rung's
  real price and real weekly figure, the ordered row's date and its missing Sell, the academy's
  stages and their «has to come first» line, the household strip's bill, the planner sheet with and
  without a yacht, and the order confirm inside a 375x667 phone (CLAUDE.md's dialog rule – its
  sentence is the longest this dialog has ever carried).

  ⚠ **MUTATION-VERIFIED, FIFTEEN, EACH APPLIED ALONE AND RESTORED.** What each actually reddened,
  measured rather than predicted: the upkeep never charged -> the WALLET case alone; the upkeep left
  out of `householdWeekly`'s outgoing -> the household case alone (the two are separate claims and
  they separate); the meter reading no upkeep at all -> the household case AND the mounted strip; a
  contract made sellable again -> the contract case; the value clock started at the ORDER -> both
  value cases; the plane's point dropped -> both hidden-bonus cases; the point widened to every week
  -> the rest-week case alone; ⭐⭐ **the bonus PRINTED on the card -> both «is not displayed» cases,
  engine and mounted** – that is the one a careless build gets backwards; the yacht granting nothing
  -> four cases across three files; the grant check dropped from `bookVacation` -> three; the sheet's
  filter dropped -> two mounted; the stage order unenforced -> the academy case; the plane's cut
  removed -> the fare case; `travelCovered` pointed back at the plane -> the scholarship case;
  delivery never happening -> eleven.

  ⚠ **FOUR GUARDS RE-AIMED WITH A NOTE, NONE DELETED**, and two of them were re-aimed because they
  are about the LADDER MONEY BUYS rather than about the catalogue: `tests/shop.test.ts`'s catalogue
  pin (8 ids -> 18, and its negative moved with it so it can no longer refuse the words this slice
  legitimately adds) and its input-independence sweep (it now asks `sellableAsset` before selling,
  which makes it STRICTER – the contracts stay on the books and the delivery and the bill are inside
  the claim); `tests/planner.test.ts`'s six-package pin and price-floor ladder (the seventh rung is
  free by design and not on the general shelf, so it is not a step in a price ladder – with an
  anti-vacuity case proving the filter removes exactly one); and `tests/calendar-grid.test.ts`'s
  treatment monotonicity (the yacht week's 48 is not bought with a programme, and forcing a clinic's
  week onto a boat to satisfy an arithmetic would be the drawing lying to keep a test green).

  ⚠ **FROZEN HASHES: ALL THREE CAREERS UNMOVED, and the null arm is named honestly rather than
  claimed.** `tests/coach-travel-edge.test.ts` is green, so no re-freeze was owed and no per-key diff
  was owed with it. ⚠ But byte-identical proves nothing on its own here, so the READER was measured:
  over the same three 156-week careers, **two of the three DO open the shelf** (`shopUnlocked` true
  on 8/0 and 0/1) and **none of them ever buys anything** – 0 assets, 0 upkeep rows, 0 delivery rows
  on all three. So every new code path has zero readers in that corpus by construction, and its
  liveness is the fifteen mutations above rather than the freeze. The frozen MAIN capture
  (41550 / `e6b0c709`) is untouched: `world/shop.ts` and the new `world/assets.ts` import no RNG and
  take no `Rng`, which is the guarantee rather than a claim about one.

  ⚠⚠ **AND ONE HAZARD FROM CLAUDE.md BIT INSIDE THIS ITEM, so it is recorded rather than quietly
  survived.** The first mutation harness restored the tree with `git checkout -- <path>`. Checkout
  restores from the INDEX, and these edits were UNSTAGED – so it deleted the wave's work on
  `phaseFinance.ts` and `coachMarket.ts` instead of undoing the mutation. Caught by the NEXT
  mutation reddening a test it had no business touching, both files were rewritten, and the harness
  now restores from a file copy with the reason written above it. **Nothing was lost.**

- [x] **6. «Листалка на 4 недели кажется весьма бессмысленной: у меня был слот 6 недель, я нажал,
  увидел сообщение о конце года и странное окошко с отчётом о двух пройденных днях, а календарь так и
  остался на 51й неделе. Наверное эта кнопка будет полезна только для длительных травм, и то не точно.
  Её необходимость под большим вопросом.»** – **build (bug) + ask (keep it at all).** ⚠ Three separate
  wrongnesses in one press: it stopped at the year end, it reported **two days** for a six-week slot,
  and **the calendar did not move**. Fix the lie first; whether the control survives is his call.

  ⚙ **THE LIE IS REPAIRED AND THE CONTROL STANDS.** `[ ]` -> `[x]` for the build; the «нужна ли она
  вообще» half is still HIS – deleting is available in the morning, restoring is not.

  **Three wrongnesses, three different mechanisms, and none of them was the one the sentence
  suggests:**

  1. **IT OFFERED FOUR AGAINST A SLOT OF SIX.** `MULTI_WEEK_SPAN` was written on the label AND passed
     to the press, so the button stated the engine's historical step and never the week it stood on.
     `spanWeeksFor` counts the consecutive weeks with nothing OF HERS in them (`eventIsHers`, the
     look-ahead marker's own rule), capped at `UPCOMING_WEEKS` – ⚠ **a derived bound, not a picked
     one**: beyond that horizon `snapshot.upcoming` is clipped and the shell has no information about
     her calendar at all. `multiSpanOf` answers offered-at-all and how-many together, so the label and
     the press cannot differ. `MULTI_WEEK_SPAN` survives as the FLOOR – below four a "span" is the
     week button pressed twice.
  2. **THE YEAR END TRUNCATED IT.** `advanceWeeks` broke on 'season-end', which cuts every press made
     at the tail of a season – the longest quiet gap a career has, and therefore exactly where the
     pill appears. The loop now breaks on a reason that HALTS (`SPAN_REPORTS_ONLY`). ⚠ **Measured, not
     assumed:** the recap dialog reads `snapshot.lastSeasonSummary` against a per-season watermark and
     has since round 19 #2, so it still shows, once, on the week it was banked. The reason is still
     collected and still returned in its precedence slot (R11-1); only the break moved, and the list
     has exactly one member.
  3. **«THE CALENDAR DID NOT MOVE»** was 1 and 2 together: the press left him three weeks further into
     the same dead stretch he pressed from, which is not a place a career visibly moves to.

  ⚠ `ToWorker.advance.weeks` widens `1 | 4` -> `number`. **No save field, no migration, schema stays
  65** – the wire is not the save, and the dev fast-forward's `tick` has always carried a plain count.

  ⭐⭐ **AND THE FIRST-USE LINE SHIPS WITH IT** – the round-29 audit found this item is **round 26 #1**,
  whose actual ask was a sentence explaining the control («Что за кнопка Next 4 weeks у меня появилась
  прямо под пальцем?»). That item produced a GATE and never produced the sentence. One muted line
  above the bar, cleared by the first press, watermarked per career: *"Quiet stretch ahead – the left
  button spends those weeks in one press, and stops early on anything worth reading."*

  **Evidence.** `tests/component/round29-span-repair.test.ts` – 7 mounted on the real shell, built on
  a six-week gap that STRADDLES the year end (his own week): ⭐ the chain – **the pill says six, the
  press commands six, the calendar lands six weeks on and across the wrap, and the card says six** –
  plus a second fixture proving the number follows the calendar rather than being a new constant, and
  the first-use line rendering once and not after a fresh mount.
  `tests/r2-13-advance-span.test.ts` gains the discriminating straddle case the old SEASON-END guard
  could not be (it landed the wrap on the span's LAST week, so it never exercised the break).
  ⚠ Mutation-verified, three, each alone: the break restored -> the chain and the straddle red; the
  label pinned back to the constant -> 4 red across two files; `markSpanHintUsed` disconnected -> the
  once-ness case alone.
  ⚠ Guards re-aimed with a note, never deleted: `round11`'s break pin (the claim is ONE break after
  the whole week is read, and that is untouched), `worker-reply-pairs`' `1 | 4` payload pin,
  r2-13's SEASON-END case and its span-is-four pin, and `r2-13-span-report`'s two label/press pins –
  ⚠ **which had been comparing the constant with itself and so could never have caught this.**

- [~] **7. «А что у нас со спонсорами вообще, кстати? Кроме часов за 20к есть ещё кто-то и когда
  появляется? Мы что-то говорили о больших чеках вроде.»** – **answer.** Read the ladder out of the
  code and tell him what exists, at what standing each rung opens, and what the largest cheque in the
  model actually is. ⭐ Pairs with 15, which is the same question from the other side.

  ⚙ **ANSWERED, AND NOTHING WAS BUILT – the one defect the measurement DID find is a balance ruling
  and is written up under 15, not fixed here.** «Часов за 20к»
  is **Quiet Hour**, the advertising house – a watchmaker, $20,000 cash, and the ONE letter on its own
  clock. Everything else is the **six-rung kit ladder** and it is entirely separate from it:

  | rung | brand | opens at | term | kit/season | and what else it writes |
  | --- | --- | --- | --- | --- | --- |
  | `local` | String House | national #30 · ITF #128 · any W standing | 1 season | $1,000 ($2,000 top-10 at home) | – |
  | `national` | Netrally Distribution | ITF #32 **or** WTA #350 | 2 seasons | $3,000 | – |
  | `tour` | Baseline Athletic | WTA #200 | 2 seasons | $5,000 | retainer $1,500/qtr · 25% of travel · **20% of every W75+ cheque** |
  | `global` | Play Beyond | ITF #8 **or** WTA #87 | 3 seasons | $5,000 | 25% of travel |
  | `premium` | Meridian Sport | **WTA #50** | 3 seasons | $8,000 | retainer $7,500/qtr · 50% of travel · **$15,000 an appearance** (WTA250+) · **25% of every W50+ cheque** |
  | `icon` | **Aurelia** | **WTA #10** | 4 seasons | $12,000 | retainer $37,500/qtr · 75% of travel · **$40,000 an appearance** · **30% of every W50+ cheque** |

  ⚙ **THE LARGEST CHEQUE THE MODEL CAN PRODUCE IS $900,000, AND IT IS THE ICON RESULT BONUS ON A SLAM
  TITLE** – 30% of the $3,000,000 first prize, paid as one line the week she wins it. It is not
  hypothetical: the corpus below produced it, and the ledger row a family actually banks was
  **$585,000** after her own 35% cut ($315,000 – round 28 #15's widening, which is live in his save).
  A full icon season is that plus **$150,000** of retainer, **$40,000 per WTA250-or-better appearance**,
  $12,000 of kit and three quarters of every fare.

  ⚙ **AND IT IS REACHED. 108 careers x 780 weeks** (9 econ-bench presets x 2 policies x 6 seeds, to
  age 29 – the length of his own save), each signing the strongest live letter the week it lands, so
  no rung is being missed by a cautious parent. `tools/sponsor-ladder-reach.ts`:

  | rung | careers that CLEARED it | ...were WRITTEN to | ...SIGNED it | median week it opens |
  | --- | --- | --- | --- | --- |
  | local | 108 (100%) | 106 (98%) | 106 (98%) | w47 – age 14.9 |
  | national | 60 (56%) | 49 (45%) | 49 (45%) | w151 – age 16.9 |
  | tour | 52 (48%) | 40 (37%) | 40 (37%) | w255 – age 18.9 |
  | global | 50 (46%) | 45 (42%) | 45 (42%) | w307 – age 19.9 |
  | premium | 49 (45%) | 42 (39%) | 42 (39%) | w359 – age 20.9 |
  | **icon** | **24 (22%)** | **17 (16%)** | **17 (16%)** | **w463 – age 22.9** (earliest w307) |

  ⭐ **SO THE TOP OF THE LADDER IS NOT DEAD CONTENT** – the finding this item was told to look for is
  absent. 31 of 108 careers were inside WTA #10 at some point and 24 of them were there in a sponsor
  window, which is the only week a brand can write; of those 24, seventeen actually got the Aurelia
  letter. Career sponsor CASH over the 51 careers that received any: median **$1,942,862**, most
  **$8,599,241**.

  ⚙ **AND WHY HIS OWN CAREER HAS NOT SEEN THEM – MEASURED ON HIS SAVE, NOT GUESSED, AND USED AS ONE
  DATA POINT.** `tools/sponsor-ladder-reach.ts -- --save <his .tsave>` (read-only; nothing copied into
  the repo): at w780 he is **WTA #21, ITF unranked, national #200**, and he **CLEARS local · national ·
  tour · global · premium** – five of the six. Only `icon` (WTA #10) is genuinely out of reach at #21.

  **Premium has never written to him, and this winter is the reason in miniature.** The window ran
  w775–779 and the slot ids say exactly what happened: `windowLadder` is strongest-first, so slot 0
  (`kit-775`) was Meridian Sport, slot 1 `kit-776` **is Play Beyond**, slot 2 was skipped because the
  incumbent is `tour`, slot 3 `kit-778` **is Netrally**. That arrangement is only consistent with
  premium holding slot 0 – had he not cleared it, slot 1 would carry `tour`, not `global`. **So
  Meridian Sport rolled its 70% chance and missed.** Nothing is manufactured, by design.

  ⚠⚠ **AND THE OTHER HALF IS THE RULE HE KEEPS RE-SIGNING.** 4 of his 15 winters (w203, w307, w619,
  w723) produced **no post at all** – not silence, `seasonSpokenFor`: a multi-season deal promises the
  season ahead and `raiseKitOffers` returns empty. He has been in Baseline Athletic's two-season kit
  almost continuously since w151. ⭐ **The sentence he can act on: the Baseline renewal sitting open in
  his inbox right now shuts next winter's post, and Meridian Sport is the letter it would be shutting
  out.** Play Beyond's open letter (3 seasons) shuts three winters.

  ⭐ **NOTHING BUILT, DELIBERATELY.** Reach is not the problem: the top rungs are not out of his reach,
  and he has simply been holding one brand's hand. ⚠ Two things the measurement cannot settle and
  neither is fixed silently: whether 22% is the right frequency for `icon`, and the ordering defect
  the same run DID find – **`global` is dominated by `tour`**, written up under item 15 because it is
  the brand-side half and it is the one thing here that wants a ruling from him.

- [x] **8. «При клике на Next Tournament на главном экране давай сделаем может быть какой-то
  информационный экран? Например со списком соперников, прогнозами и комментариями тренера ещё
  какой-то информацией о турнире, картинкой с ним… Можно частично переиспользовать экран начала
  турнира»** – **build.** ⭐ His own implementation hint is the cheap road and should be taken.

  ⚙ **HIS HINT IS TAKEN AND THE NAVIGATION IS UNCHANGED.** Home's card is a door onto the This-week
  tab (R13-12) and it stays one; what was behind it was a single pill of text. `NextTournamentPanel.vue`
  is the tournament-start splash shown ONE ENTRY EARLIER, on the same screen: the hero photograph, the
  same four facts in the same order (Surface / Prize money / Winner / Spectators), the two-sided first
  round with the draw size on it, the read-plus-ring, and what the trip costs.

  ⚠ **THE CSS COULD NOT BE SHARED AND THAT IS SAID RATHER THAN HIDDEN.** `TournamentFlow.vue`'s block
  is `<style scoped>`, so its `tf-*` classes exist only inside that component; hoisting a 600-line
  style block into the global sheet to borrow four of them is a bigger change than the panel. The
  SHAPE is the reuse.

  ⚠ **AND THE COACH'S VOICE STAYS SEASONSCREEN'S.** `coachSays` there picks one of four wordings per
  verdict off the event's own sub-stream and is bounded by source-region pins in three test files;
  copying that table would give two surfaces two sentences for one engine verdict, which is the class
  this repo has already paid for four times. The panel prints the VERDICT plainly and lets the feed
  keep the voice.

  ⭐⭐ **THREE OF THE FOUR THINGS HE NAMED EXIST AND ARE DRAWN. THE FOURTH DOES NOT AND IS NOT
  INVENTED.**

  | his ask | what it is drawn from |
  | --- | --- |
  | «прогнозами» | `preview.firstMatchChance` – the engine's own round-one odds, on the same `ProgressRing` through the same `readingColor` ramp and the same accessible sentence the feed uses |
  | «комментариями тренера» | the field's reading (`preview.fieldStrength`), the court's verdict for her build (`surfaceStyleHint`, consumed not re-worded), and the hired coach's note about this trip (`UpcomingEvent.coachCaution`) when he has one |
  | «картинкой с ним» | `venueArtUrl` – one tournament, one photograph, wherever it appears |
  | «информацией о турнире» | winner's cheque (`prizeCentsFor`), winner's points, draw size, crowd, weather, entry fee, travel budget |
  | ⚠ **«списком соперников»** | **NOT SHIPPED, and the panel says so.** `EventPreview` carries exactly ONE opponent, because the draw is not made until `runTournament` runs on the tick. The first round is named in full – both flags-or-not, both ranks read off THIS rung's table – and one line states that the rest of the bracket is made when she gets there. A list of eight invented names on a screen he trusts is worse than an honest sentence. |

  ⚠ **NO OPPONENT FLAG**, for the same reason: `EventPreview` carries a name and a rank and no nation.
  Absent, not blank – a blank flag slot opposite a filled one reads as a bug.

  **Evidence.** `tests/component/round29-next-tournament.test.ts` – 13 cases, mounted on a REAL ticked
  career with the engine's own event: the picker's exact URL, the four facts against `TIERS` and
  `prizeCentsFor`, the ring's value/label against `preview`, both sides of the first round, the money
  to the cent, the panel ON the This-week screen for an ENTERED tournament and absent when nothing is,
  and the copy rules on all three templates this wave touched.
  ⚠ Mutation-verified, four: the honest-gap sentence deleted -> 1 red; an invented opponent flag -> 1
  red; Cyrillic in a template -> 1 red; ⚠⚠ **and the fourth is the important one** – re-pointing her
  rank at the ITF alias left the first draft GREEN, because that fixture's event is an ITF rung and a
  young career is unranked in every table, i.e. it was comparing a value with itself. That is the dead
  guard class this round found twice elsewhere. A second case now places three DIFFERENT ranks and
  mounts a domestic rung; the same mutation now reddens it (`expected '#77' to be '#41'`).

- [x] **9. «В строке с машиной и другими вещами `Worth now / paid $60,000 / $59,361` – давай
  последнюю цифру сделаем либо белой, либо жёлтой, с красным перебор.»** – **build.** One colour token.

  ⚙ **SHIPPED – WHITE, and the token was already named for this.** `StatRow`'s three tones are the
  app's money vocabulary and each has a documented sense: `negative` is `--money-out`, **money
  LEAVING** – a bill, a fare, a cheque – and that is what was wrong here, not the shade. What the
  figure states is what the thing IS WORTH, which is a BALANCE, and `StatRow` already has the word
  for that: `plain` = «a number with no direction (a count, a balance)», painted `--ink`. So it is
  the existing palette's white and no colour was invented.

  ⚠ **AND THE DIRECTION IS NOT LOST.** It moves one line down to `.shop-row-change`, the SIGNED
  difference, which is the row that is genuinely about a direction – a car that lost $639 still says
  so in red under a worth that is now just a worth. Mounted assertion on the rendered class token
  (`tb-statrow--plain`, and NOT `--negative`) in `tests/component/round29-shop-topup.test.ts`;
  mutation-verified by restoring the old ternary, which reddens that arm alone.

- [x] **10. «По результатам w500 мне пишут Income +$29,046 · Spent -$6,883 · Balance +$22,164 ·
  Her cut 50% $27,600 – это не 50% по сравнению с income»** – **build (bug).** ⚠⚠ **$27,600 against an
  income of $29,046 is 95%, not 50%.** Either the label lies about the base or the split is wrong;
  round 28 #15 has just widened her cut to sponsor cheques and **is live in this save (v65)**.

  ⚠⚠ **MEASURED, and it is neither of the two readings we had.** I first called it 95% by dividing
  where I should have added; he corrected me – «это 27,600 + 29,046, это НЕ 95%, но и не 50%». The
  save says a third thing. Across all 27 weeks that credited her:

  | week | prize | her cut | bps | ratio |
  | --- | --- | --- | --- | --- |
  | 730 | $62,000 | $74,400 | 5000 | **1.20** |
  | 733 | $82,500 | $99,000 | 5000 | **1.20** |
  | 738 | $23,000 | $27,600 | 5000 | **1.20** |
  | 749 | $95,000 | $114,000 | 5000 | **1.20** |
  | 754 | $41,000 | $49,950 | 5000 | **1.22** |
  | 767 | $13,250 | $16,650 | 5000 | **1.26** |

  **The field states `bps: 5000` and pays 120% of the prize – more than the whole prize.** 24 of 27
  weeks land on exactly 1.20 and two drift to 1.22 / 1.26, so there is a VARIABLE term, not merely a
  wrong constant. ⚠ Candidate, unverified: the kit contract's `bonusShare: 0.2` (a 20% bonus on prize
  money from w75 up). **The base must be identified before anything is changed** – I have already been
  wrong once on this item.

  ⭐ Two weeks (728, 741) credit **$750 with a prize of zero** – the sponsor-cheque cut of round 28 #15
  doing its job, and evidence the two paths are separate.

  ⚙⚙ **SHIPPED, AND THE ANSWER IS: THE LABEL LIES, THE SPLIT DOES NOT.** The base was found before
  anything was changed, by driving the engine rather than by reasoning from the ratio – which is what
  produced both earlier wrong readings.

  **What the writer actually does.** `finalizeTournament` credits the family `prize − herShare`, so
  the ledger's `prize` row is **already net of her cut**. `kidShare.cents` is her half of the
  **gross** – and of a second gross cheque, the kit contract's result bonus, which `resultBonusFor`
  computes as `bonusShare × TIERS[tier].prizeCents[finish]`, i.e. a fraction of the same gross prize
  table, and which round 28 #15 correctly split too. At the cap (5000 bps) on a `tour` kit deal
  (`bonusShare: 0.2`) that is `0.5P + 0.5×0.2P = 0.6P` of cut against a `0.5P` prize row: **ratio
  1.20, with no variable term anywhere.**

  **All six of his rows reconcile to the cent**, and the two "drifting" ones are not drift – they are
  the quarterly retainer's own $750 landing on a tournament week. Weeks **728 / 741 / 754 / 767 are
  thirteen apart to the week**, which is `WEEKS_PER_YEAR / 4`, the retainer's cadence:

  | week | gross prize | her prize cut | her bonus cut | retainer cut | total | he saw |
  | --- | --- | --- | --- | --- | --- | --- |
  | 738 | $46,000 | $23,000 | $4,600 | – | **$27,600** | $27,600 |
  | 754 | $82,000 | $41,000 | $8,200 | $750 | **$49,950** | $49,950 |
  | 767 | $26,500 | $13,250 | $2,650 | $750 | **$16,650** | $16,650 |

  ⚙ **SO THE MONEY IS RIGHT AND THE SENTENCE WAS NOT.** «Her cut 50%» stood beside `Income`, which is
  the family's **remainder of the very cheque being split** – the one figure it can never be 50% of.
  The base, his week 738's $55,200, was the only number never on the card. `FinanceWeek.kidShare` now
  carries `baseCents` (the gross, **summed** across the week's cheques, **carried and never re-derived
  by division** – that division is the penny `kidPrizeShareCents` forbids and the arithmetic that
  misled us twice), and the memo reads **«Her cut 50% of $55,200 – $27,600»**.

  ⚠ **FORWARD-ONLY, as required.** `baseCents` is optional and absent means «not recorded». No save is
  back-filled, no ratio invents a base for a week already banked, and those weeks keep the exact line
  they printed before. **`SAVE_SCHEMA_VERSION` STAYS AT 65** – this is the optional widening
  `WorldEvent.entryRef` writes the rule for in the same file («absent is exactly what every historical
  save already means, so no migration is owed, no golden fixture is added and `SAVE_SCHEMA_VERSION`
  does not move»), with commit `2763caa` as the recorded precedent. Saying it out loud because the
  brief pre-authorised a v66: a bump here would have owed a migration that **must not** back-fill,
  and a golden fixture pinning nothing.

  ⚠ Evidence: `tests/round29-kid-cut-base.test.ts` (7 arms – drives a real prize week with a live kit
  deal, asserts her credit is the stated share of the recorded base, and reproduces his 1.20) plus a
  re-aimed and strengthened arm in `tests/component/round29-shop-topup.test.ts`' sibling,
  `tests/component/week-recap-kid-share.test.ts`, which now pins the LABEL against that same base.
  Mutation-verified: rebuilding the original defect (`familyShare` as the base) reddens the identity
  arm and the label arm **together**; dropping the base from the memo reddens the mounted arm alone.

- [x] **11. «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
  будет вести себя так же – тоже надо исправить. А ещё было предложение делать доходность индексного
  фонда плавающей, на сколько я помню, мы это делали? Иначе не очень понятно зачем вообще Savings»** –
  **build + answer.** Top-ups for both instruments; and answer whether the floating yield shipped.
  ⭐ His «иначе непонятно зачем вообще Savings» is the design test the answer has to pass.

  ⚙ **ANSWERED BY HIM 28.08, and it binds 11 and 12 into ONE change**: «в реальности на текущем счете
  нет процентного дохода, максимум кешбек, и то не за все, мы для этого делаем Savings как раз. **Одни
  должны друг друга заменить**». Savings is the REPLACEMENT for the automatic interest, not a rival –
  a real current account pays nothing, and the player who wants yield MOVES money. That is the
  decision the mechanic exists to create.

  ⚠⚠ **So 11 is the PREREQUISITE for 12.** Removing the interest while top-ups are broken strands the
  player: no passive income and no working way to feed its replacement. Top-ups first, verified, then
  the removal.

  ⭐ And it sharpens 12's bench: not «what does the economy lose» but **«does a player who moves his
  money into Savings land roughly where the interest used to put him?»** If the replacement falls
  short, the RATES are what to look at – never the ruling.

  ⚠ **Cashback is NOT a request** – he named it as reasoning about why a current account pays nothing.
  Recorded as a possible future line; nobody builds it off that sentence.

  ⚙ **TOP-UPS SHIPPED, BOTH INSTRUMENTS.** `buyAsset` now treats an owned `stake: 'open'` rung as a
  top-up and only a `'fixed'` one still refuses – **the predicate is the STAKE, never a list of two
  ids**, so a third investment added to the catalogue tomorrow tops up because of what it is. No new
  command: it is the same decision out of the same wallet through the same validation, and
  `world/constants.ts` calls that guard list «short on purpose».

  ⚠ **THE HARD PART IS THE COMPOUNDING, NOT THE WALLET.** Value is `basis × (1+r)^years` off ONE start
  week, so money added in season six must not be treated as though it had been growing since season
  one. A top-up **rebases**: `OwnedAsset.basisCents` becomes today's worth plus the new money and
  `basisWeek` restarts the clock – exactly `V(1+r)^t + T(1+r)^t`, with no second value model.
  `paidCents` meanwhile keeps accumulating the **cash**, so `changeCents` stays the honest lifetime
  P&L and the shelf's «the ledger shows the loss to the cent» survives a top-up; `boughtWeek` is not
  rewritten. Both new fields are optional widenings, **so `SAVE_SCHEMA_VERSION` stays 65** – same rule
  and same precedent as item 10 above.

  ⚠ Evidence: `tests/component/round29-shop-topup.test.ts` tops up each instrument **twice**, with
  real ticked weeks between, and asserts the wallet moved by exactly each tranche and that each
  tranche compounded over **its own** span. Mutation-verified: back-dating the new money to the
  original purchase reddens the two arithmetic arms alone – the failure a screen test could never see.

  ⚙⚙ **HIS QUESTION, ANSWERED FROM THE CODE: THE FLOATING YIELD DID NOT SHIP.** Neither instrument
  floats. `assetValueCents` is `round(basis × (1+annualRateBps/10_000)^years)` – deterministic
  compound interest, **zero draws**, and `world/shop.ts`' own header says it: «no drift, no shock, no
  freeze». The economy catalogue says the same thing beside the fund's own blurb: «§3a's index fund
  *can be DOWN for a whole season and still be the right holding* – that is **slice 2's drift, and
  until it lands the blurb may not describe a movement the engine does not make**». So he is
  remembering the **proposal**, which is real and is written down; it was never built.

  ⚙ **AND HIS TEST IS THE RIGHT ONE – AS SHIPPED, SAVINGS IS DOMINATED.** Both are `stake: 'open'`,
  both are sellable **any week** (`sellableAsset` returns true unconditionally – no lock-up, no
  freeze), and neither can lose a penny. The only differences are the entry minimum and the rate:

  | | entry | rate | can it fall? | locked? |
  | --- | --- | --- | --- | --- |
  | A savings deposit | $1,000 | +2% a season | no | no |
  | An index fund | $5,000 | +7% a season | **no** | no |

  So the deposit's ONLY remaining reason to exist is **a stake between $1,000 and $4,999** – below the
  fund's door. At $5,000 and up the fund beats it on the single axis that differs, with no offsetting
  risk, because the risk is exactly the unshipped drift. **His «иначе непонятно зачем вообще Savings»
  is correct as a verdict on the shipped state**, and the deposit stays decorative until either the
  fund can genuinely go down or the deposit gets something the fund has not.

  ⚙⚙ **AND HE HAS ALREADY ANSWERED IT – 28.08, so this is no longer an ask.** «В реальности на
  текущем счете нет процентного дохода, максимум кешбек, и то не за все, **мы для этого делаем Savings
  как раз. Одни должны друг друга заменить.**»

  ⭐ **Savings is what the current account's automatic interest TURNED INTO.** That is the answer to
  «зачем вообще Savings» and it is a better one than either fork I was going to offer him: the wallet
  stops paying a wage, and the player who wants yield moves the money – which is a decision, which is
  the mechanic. ⚠ It also makes **this item the prerequisite for 12**, and it shipped first
  (`db6da62` before `74cb407`): removing the wage while the instrument replacing it could not be fed
  would have left the player with neither.

  ⚠ **WHAT REMAINS TRUE AND IS STILL HIS TO RULE ON is a narrower thing than «why does Savings
  exist»**: the index fund still cannot fall, so between the two instruments the fund is strictly the
  better holding above $5,000. That does not make Savings pointless any more – it makes the FUND
  under-priced for its risk-free-ness. Re-filed as ask **11b** in those terms, and the measurement of
  whether Savings actually covers what the interest paid is under item 12.

- [x] **12. «И я предлагал убрать авто начисление % на текущий счёт»** – ⚙ **his RULING**, and it
  settles round 28 #9, which was filed as an ask. Remove the automatic interest on the current
  account. ⚠ It is a large silent income line – measure what the economy loses before shipping, and
  say so, but the direction is decided.

  ⚙ **SHIPPED, AND MEASURED FIRST.** `resolveInterest` is gone from the weekly tick,
  `ECONOMY.savings` is deleted (not left at zero – a live balance constant that nothing charges is a
  decision nobody can find, and the next reader wires it back up believing it is a knob), and the
  term came out of `familyWeeklyIncomeCents` with it.

  ⚠ **THE BENCH, BOTH ARMS, 1,620 careers each** (`npm run bench:econ`, 18 presets × 30 seeds × 3
  horizons; arm A = this branch with the accrual, arm B = the same tree with it removed):

  | horizon | interest earned (arm A) | end-funds delta | blocks where funds fell | survivors |
  | --- | --- | --- | --- | --- |
  | **14→16** (junior sink) | **$2,137** mean ($243–$6,777) | **−$1,954** mean | **18 of 18** | 454 → 451 (**−0.7%**) |
  | 14→18 | $3,547 mean | +$1,812 mean | 12 of 18 | 311 → 310 (−0.3%) |
  | 14→20 | $16,181 mean | +$7,804 mean | 9 of 18 | 269 → 261 (−3.0%) |
  | **all** | – | – | – | 1,034 → 1,022 (**−1.2%**) |

  ⚠⚠ **READ THE 14→16 ROW AND DISCOUNT THE OTHER TWO.** The junior sink pays no prize money, so it is
  the only horizon where the two arms differ *by the interest and nothing else* – and there the answer
  is perfectly consistent: **every one of 18 presets loses money, mean −$1,954 a career.** Past 16 the
  arms diverge chaotically (deltas swing from **−$422,642 to +$640,444**, and the MEAN goes positive):
  a few dollars of funds changes an entry decision, which changes a result, which changes a prize
  cheque. Those numbers measure career divergence, not this change, and quoting the +$7,804 as «the
  economy gained» would be exactly the false-null trap CLAUDE.md's own note is about.

  ⚙ **VERDICT: NOT A BANKRUPTCY EVENT, so it ships.** −0.7% on the clean arm and −1.2% overall, and
  **survival ROSE in 12 of the 54 blocks** – impossible under a pure «less money» model, and the
  explanation is that the economy already has need-based backstops (the academy scholarship and the
  local sponsor cameo are both gated on the family being short) which absorb part of the loss. That
  is the opposite of a silent economy-wide punishment, so «мы ни за что не наказываем» is not
  breached.

  ⚠ **ONE CAVEAT THAT IS HIS TO RULE ON, and it is the honest half of this.** The replacement for the
  wallet's yield is the shelf – the deposit at +2% and the index fund at +7%, both of which item 11
  just made toppable – but `shopUnlocked` gates the whole shelf on the **professional** ladder. So in
  the junior years, which is exactly the horizon where the loss is cleanest and the family is
  poorest, **there is now no way to earn yield at all.** That is defensible (a fourteen-year-old's
  family is not an investor) but it should be a decision, not a side effect. Added to the asks.

  ⚠ **AND IT PARTLY UNDOES ROUND 21 #12, HIS OWN EARLIER RULING** – said out loud rather than left for
  him to rediscover. That item was «на счету 1млн, а элитного тренера какого-то нельзя брать», and its
  fix was to count the interest into the coach-affordability cap; on that million it was **$600/wk
  against the parents' $482**, more than half the family's weekly money. With the accrual gone the cap
  has to stop quoting it, so **a wealthy family will see Elite rungs flagged «over» again**. ⚠ FLAGGED,
  NEVER REFUSED – `hireCoach` does not consult the budget at all – so this warns, it cannot lock
  anybody out, which is what keeps it inside house law. The answer to the re-opened complaint is the
  shelf: a family that puts the million into the index fund is earning again, deliberately, and
  `householdWeekly` already shows that money in the household's week.

  ⚙⚙ **HIS SECOND RULING ON THIS, 28.08 – AND IT BINDS 12 TO 11.** «Здесь логика простая: в
  реальности на текущем счете нет процентного дохода, максимум кешбек, и то не за все, мы для этого
  делаем Savings как раз. **Одни должны друг друга заменить.**»

  ⭐ **So Savings is the REPLACEMENT, not a competitor** – the current account pays nothing because
  that is what a real current account does, and the player who wants yield MOVES money. That is the
  decision the mechanic exists to create, and it also **answers his own «иначе непонятно зачем вообще
  Savings»**: it is what the interest turned into. ⚠ Shipped in that order: **11's top-ups first
  (commit `db6da62`), 12's removal after (`74cb407`)** – removing the wage while the instrument that
  replaces it could not be fed would have stranded the player with neither.

  ⚠⚠ **AND HIS SHARPER QUESTION, MEASURED: CAN A PLAYER WHO MOVES HIS MONEY INTO SAVINGS LAND WHERE
  THE INTEREST USED TO PUT HIM?** Three arms, same seeds, 312 weeks (14→20), total wealth = wallet +
  shelf. Arm A on a control worktree (this branch with `74cb407` reverted, reader confirmed present);
  arms B and C on the branch; arm C moves every surplus above a $25,000 living reserve into the
  deposit each week the shop is open.

  | career | A – interest | B – neither | C – Savings | shop opens |
  | --- | --- | --- | --- | --- |
  | 25k middle · middle coach · grinder | $9,241 | $15,041 | **$15,041** | ⚠ **never** |
  | 120k wealthy · elite · grinder | −$37,044 | −$37,534 | **−$37,534** | w152, ⚠ **overdrawn** |
  | 8k working · self · player | $1,456,450 | $1,548,965 | **$1,914,678** | w122 |

  ⚙ **THE ANSWER IS: FOR ONE CAREER OF THREE, YES, AND HANDSOMELY – AND FOR THE OTHER TWO, NOT AT
  ALL.** Where the shelf is reachable and there is a surplus, Savings does not merely cover the loss,
  it beats it (**+$365,713, +23.6%** over arm B on the same code and the same dice). ⚠ But the gap is
  **structural, not a rate gap**, and it has two halves:

  1. **AVAILABILITY.** `shopUnlocked` gates the whole shelf on the **professional** ladder. The
     middle-family grinder above **never opened the shop in 312 weeks**, and the wealthy career was
     overdrawn when it did. The junior sink – the horizon where the loss is cleanest, at −$1,954 a
     career – has **no replacement at all**, and a career that never turns professional never gets one.
  2. **RATE.** On the same money the deposit pays **2.00%/yr against the current account's 3.17%**
     (`apyWeekly 0.0006` annualised), so it recovers **63%** of the removed rate. The index fund at
     7% would recover 221%, but he named Savings.

  ⚠ **NOTHING TUNED, per instruction.** Both halves are his to rule on – the availability half is
  filed as ask **12b** and is the sharper of the two, because no rate change fixes a locked door.

  ⭐ **CASHBACK – RECORDED, NOT BUILT.** «Максимум кешбек, и то не за все» is his reasoning for why a
  current account pays nothing, not a request. Filed here as a possible future line and deliberately
  left unbuilt: a small rebate on some spending categories would be the realistic replacement for the
  wage on the wallet, and it is the natural companion to 12b if he decides the junior years need
  something. **No code exists for it and none should until he asks.**

  ⚠ Guard tests **re-aimed, not deleted**: `tests/round9.test.ts`' R9-1 block now asserts the ABSENCE
  of everything it used to assert the presence of (six arms, including the zero-RNG arm re-proven
  against the step's removal, which is what keeps the frozen MAIN capture provably untouched);
  `tests/events.test.ts`' week-order pin is back to the parent contribution opening the week; and the
  three coach-cap arms now expect one stream instead of two. The **category** `'interest'` survives on
  purpose – every save already written carries rows under it and a career's own past has to keep
  rendering.

  ⚠⚠ **AND THE THREE FROZEN CAREERS WERE RE-STRUCK, WITH THE PER-KEY DIFF FIRST** (`tools/frozen-key-diff.ts`,
  control = this branch with `74cb407` reverted in a dedicated worktree, reader confirmed present on
  the control before measuring). The two grinder careers move **7 of 73 keys** – `careerTotals`,
  `events`, `financeWeeks`, `fundsCents`, `lastSeasonSummary`, `nextEventId`, `seasonHistory`: money
  and the money's paper trail, nothing else. The **player** career moves **26 of 72**, including
  `skills`, `results`, `kidRank` and `vacations` – ⚠ not a leak but the economy: that policy enters
  tournaments and books holidays out of the wallet, so a poorer family enters fewer and finishes
  elsewhere. An income change that could not reach a career's results would not be an income change.
  ⚠⚠ **`rngMain` is BYTE-IDENTICAL on all three arms** – the dice did not move, the decisions did, so
  input-independence holds and the frozen MAIN capture (41550 / `e6b0c709`) is untouched.

- [x] **13. «А мы что-то перечисляем тренеру за финал каких-то турниров в итоге? Мне кажется эта
  информация стоит того, чтобы добавить её на странице тренеров»** – **answer + build.** Read the
  bonus rule out of the code, then surface it once on the coaches page.

  ⚙ **THE ANSWER IS YES, AND IT HAS BEEN PAID SINCE ROUND 24** – it is his own ruling of 22.08 («тренер
  может не ездить, но долю получать наверное за победы или 2е места вполне может. За 2е только
  по-меньше»), and nothing on any screen said so. `finalizeTournament` takes
  `staffResultShareBps('coach', finishIdx)` of the **GROSS** cheque:

  | finish | coach | masseur |
  | --- | --- | --- |
  | title | **10%** (`titleBps 1000`) | 3% |
  | runner-up | **5%** (`finalBps 500`) | 1.5% |
  | anything below a final | **nothing** | nothing |

  ...on the **professional tour only** (`track === 'wta'`) and only into a **filled seat** – a
  self-coached family owes nothing. It is a UNIVERSAL rule, not a contract form: nothing is chosen at
  hire and nothing is persisted.

  ⚙ **SHIPPED, ONCE, WHERE HIS INSTRUCTION PUTS IT.** `.cm-share-note` on `CoachMarketScreen.vue`'s
  Coaches tab, directly under the weekly-bill line, because the two are the halves of what a coach
  costs. His own «общая для всех … в одном месте» is the design: a line per card would be six copies
  of one fact about none of them.
  > *Every coach here also takes **10%** of a prize cheque when she wins a tour title and 5% when she
  > is runner-up – nothing below a final, and nothing on the junior ladder, which pays no prize money.*

  ⚠⚠ **AND THE PERCENTAGES ARE READ OUT OF THE ENGINE, NEVER TYPED.** `staffResultShareBps('coach',
  0 | 1)` is the SAME function that pays him, so a retune of `ECONOMY.staffShare` moves the sentence
  and the cheque together. ⭐ That is the point item 10 turned out to be tonight: **a line that
  describes a rule is pinned to the rule.**

  **Evidence.** `tests/component/round29-coach-share.test.ts` – 9 mounted cases in three sections:
  ONCE-ness against a roster of >3 cards (with no card carrying a copy); the two percentages **parsed
  off the rendered line** and then applied to a REAL driven title and a REAL driven runner-up through
  `finalizeTournament`, asserting the coach's expense row is that percentage of that cheque; and both
  exclusions the copy names – a driven semi-final writes no row, and the junior clause is proved by
  temporarily GIVING `j300` a prize table so the `track === 'wta'` guard is observable instead of dead.
  ⚠ Mutation-verified, three, each alone: dropping `track === 'wta' &&` at the call site → 1 red;
  hard-coding the title rate at 12 in the template → 2 red; moving the sentence onto every coach card
  → the once-ness test red.

  ⚠ **THE TWO NEIGHBOURS ARE UNTOUCHED AND PINNED AS SUCH** – round 28 #8's household strip
  (`.budget-household`) and the sessions-a-week note (`.cm-plan-note`) are both asserted present on
  the same mount, so tonight's shop upkeep keeps feeding the strip it always fed.

- [ ] **14. «Ни одной победы в 45 году, только 2е место на 500 и 250 и 2 взрыва ярости за год по
  случаю полосы вылетов в 1м раунде – не самый удачный год для 23 ракетки мира»** – **measure.**
  ⚠ Round 28 measured the drought at 23.9% of seasons and **66.1% in the #81–120 band** – but he is
  **#23**, where our rate was 15.3% against a real 50%. **A title-less year at #23 is normal by the
  real censuses and abnormal by our own numbers.** Check which of the two his season actually is.

- [~] **15. «И где все наши топовые спонсоры, интересно? Кроме Netrally, Baseline athletic, Play
  beyond? На других аккаунтах я помню один был мощный.»** – **answer/measure.** Same question as 7
  from the brand side: does the top of the brand ladder ever open, and what gates it.

  ⚙ **ANSWERED BY THE SAME MEASUREMENT – see item 7 for the ladder, the money and the 108-career
  census. The three names he lists are rungs 2, 3 and 4 of six.** The two above them are **Meridian
  Sport** (`premium`, WTA #50, $8,000 kit + $7,500/qtr + $15,000 an appearance + 25% of every W50+
  cheque) and **Aurelia** (`icon`, WTA #10, $12,000 + $37,500/qtr + $40,000 an appearance + 30%).
  ⭐ **«Один был мощный» is real and is almost certainly one of those two** – 22% of measured careers
  clear `icon` and 16% are written to by it, so an account that saw one is not a misremembering.

  ⚠⚠ **AND THE GATE THAT IS ACTUALLY HOLDING HIM IS NOT THE RANKING.** He clears `premium` today at
  WTA #21 (item 7's save read). What has kept Meridian Sport off his doormat is `seasonSpokenFor` –
  four of his fifteen winters produced no post at all because the season ahead was already promised to
  the Baseline Athletic deal he keeps renewing – and, in the one winter that IS open (w775, right now),
  premium held slot 0 and its 70% roll missed. **Both are the design working; neither is a bug.**
  ⭐ The reachable consequence, in one sentence he can act on: **signing the Baseline renewal in his
  inbox shuts next winter's post, and Meridian Sport is what it shuts out.**

  ⚠⚠ **AND THE MEASUREMENT DID TURN UP ONE REAL DEFECT, WHICH IS NOT ABOUT REACH – `global` IS
  DOMINATED BY `tour`.** Read straight off `ECONOMY.sponsorship`, printed by the tool's own
  monotonicity check, and it needs no simulation because the constants settle it:

  | | kit/season | retainer/season | bonus | travel | lines | locks |
  | --- | --- | --- | --- | --- | --- | --- |
  | `tour` – Baseline Athletic | $5,000 | **$6,000** | **20% of every W75+ cheque** | 25% | 3 | 2 seasons |
  | `global` – Play Beyond | $5,000 | **$0** | **none** | 25% | 3 | **3 seasons** |

  **Play Beyond is listed ABOVE Baseline Athletic, is sorted above it in the inbox, and pays strictly
  less money for a longer lock.** That contradicts the ladder's own stated safety property, written in
  `windowLadder`'s header: *«Strongest-first makes signing on sight always safe and waiting always
  optional»*. For a junior at ITF #8 the shape is right – she wins no W75 cheques – but the moment she
  holds a professional ranking the "better" letter is the worse deal. ⭐⭐ **It is live on his own save
  right now: `kit-776` Play Beyond is open in his inbox and would lock three winters for less than the
  Baseline renewal beside it.**

  ⚠ **NOT FIXED HERE, DELIBERATELY.** Both candidate fixes – giving `global` a retainer and a bonus, or
  moving it below `tour` in `SPONSOR_TIERS` – are BALANCE changes, and this house ships those with a
  bench run and a spec against an owner ruling (CLAUDE.md invariant 4), not inside an answer. **It is
  his call, and it is the one thing in 7/15 that wants one.**

- [x] **16. ⚠ «письмо с Заголовком Entries Suspended – я точно это заводил уже в одном из предыдущих
  раундов, мне кажется этот заголовок сбивает с толку… Может его как-то и озаглавить про топ-50
  правила»** – **build**, and ⚠⚠ **CHECK THE EARLIER ROUND FIRST.** If he filed it before, this is
  `[!]` REOPENED and the ledger must say what the first fix aimed at and why it missed. The letter's
  body is the top-50 mandatory regime (4 Slams, 8 × WT1000, 6 of 10 × WT500, 2 penalty points, 10
  points suspends for 4 weeks); the title announces a suspension that has not happened.

  ⚙ **NOT A REOPEN, AND THE HISTORY IS THE FIRST THING SETTLED.** He DID file this letter before –
  **round 23 #2** – but what he named then was «особенно последняя строчка», the CLOSING LINE of the
  suspension sheet («Nothing is owed and nothing is taken back»), and that fix landed and still holds:
  `tests/component/round23-tour-suspension.test.ts` is untouched and green. **The heading was never
  mentioned in that round.** So `[x]`, not `[!]`.

  ⚙ **AND IT IS A MISSING BRANCH, NOT A WORDING.** The tour desk raises **four** notices
  (`TourLetterTerms.notice` – `due` · `penalty` · `suspension` · `season`). `InboxSheet.subjectOf`
  branched on **two** of them and then **fell through** to `return 'Entries suspended'`, so the SEASON
  BRIEFING – the quiet yearly letter about the top-50 regime – was posted under a title announcing a
  suspension that had not happened. **The title was FALSE, which is worse than confusing**, and it is
  the exact failure that function's own header forbids: *«a subject line that promised something the
  sheet does not say would be worse than no subject line».*

  ⚙ **THE FIX IS THE MISSING ARM, NAMED FROM THE SHEET'S OWN FIRST SENTENCE.** The paper opens «Her
  ranking is inside the top N, so the season ahead is a required one», so the subject is now
  **`Required season – the top 50`** – the sibling of the `due` letter's `Required event – X`, and his
  own «озаглавить про топ-50 правила». ⚠ **The N is `terms.maxRank`, i.e.
  `ECONOMY.mandatory.maxRank` as the desk wrote it**, never a literal.

  ⚠⚠ **AND THE FALL-THROUGH CANNOT HAPPEN SILENTLY AGAIN.** `suspension` is an explicit arm now and
  the function ends on `const unhandled: never = t.notice`, so a fifth notice **fails to compile**
  rather than inheriting whichever title happened to be last.

  **Evidence.** `tests/component/round29-inbox-subjects.test.ts` – **17 mounted cases pinning all
  THIRTEEN subject lines across all six letter kinds**, which is thirteen more than existed before it
  (`git grep subjectOf -- tests` returned one comment and zero assertions). All four tour notices are
  built **by the engine** – `settleTourSeasonNotice`, `chargeMandatoryPenalty` to the tenth point,
  `raiseMandatoryDueLetter` – so the season letter's number is the rule's. The last case renders the
  whole post at once and asserts **no two letters share a title**, which is the mechanical form of
  "the next fall-through cannot be silent".
  ⚠ Mutation-verified, three, each alone: restoring the fall-through → **3 red** (the season claim,
  the four-distinct-subjects claim, and the duplicate detector); hard-coding `the top 50` in the
  subject and moving `ECONOMY.mandatory.maxRank` to 42 → 1 red, which is what proves the pin reads the
  rule; collapsing the kit renewal's title into the new-deal one → 1 red, which proves the nine
  table-driven cases are live tests and not a loop that generates nothing.

- [ ] **17. «проверь предыдущие раунды на предмет "что забыто и не сделано" пожалуйста»** – **audit.**
  ⭐ Runs FIRST, because its output changes what the rest of this round should do.

- [ ] **19. ⭐ «вроде бы я всё мержил и обновление прилетало на телефон, где информация об этом?
  может быть стоит какую-то версию добавить в настройках внизу строчкой? И в pull-request скилле
  обновлять при деплое?»** – **build, and it closes a hole that just cost us.** ⚠⚠ **I asserted his
  save predated round 28 and was wrong** – it is schemaVersion 65, i.e. round 28 was in it. Nothing
  on his screen says which build he is playing, so every defect he reports carries an unknown.

  What it owes: a version line at the foot of Settings, updated at deploy, identifying the build
  precisely enough to map a report onto a commit. ⭐ Recommend a short commit SHA plus the date rather
  than a semver – a semver says what we intended, a SHA says what he is running, and it is the second
  question we keep needing. Pairs with 18: the `pull-request` skill updates it.

- [ ] **18. «добавить в скилл pull-request проверку несделанных пунктов из раунда»** – **build (skill).**
  ⭐ 17 and 18 are the same instinct: he has noticed that items go quiet, and wants the PR step to
  catch it mechanically rather than by my memory.

---

## Revived from the audit – his rulings, 28.08

- [~] **Stats header tiles (round 10)** – ⚙ **NOT a regression; he has looked and has no complaint**:
  «к этому претензий нет уже поправлено». ⚠ **And the audit over-claimed**: it reasoned from character
  count («18 chars against the 11 it was measured at… which clips») and never measured a rendered
  width. `nowrap` forbids wrapping, it does not clip; three tiles at 375px give each ~117px and
  «International rank» at 11.5px needs ~105. **Counting characters is not measuring, in either
  direction** – the same error as proving a UI fix with a source grep.
  ⚠ One real residue: `StatsScreen.vue:239` still claims «"Season points" is now "Season pts"» and
  **no such string exists** – the tile prints `Points`. The comment lies even though the layout does not.

- [x] **20. ⚠⚠ KIT WEAR ON HOLIDAY – the audit's worst find, and his: «вот это важно, да»** – ruled
  **09.08**, re-asked as round 16 #8, and `src/engine/equipment.ts` carries **no vacation term at all**.
  **Fourth asking, no code.** ⭐ Its own family is already correct – college suspends the coach and the
  masseur – so a holiday that wears her rackets at full rate
  is the odd one out, not a new idea. Own step in the wave.
  → ✅ **SHIPPED, `r29d/holiday-gear-wear`.** The ruling implemented is **ruling 5 of 09.08** verbatim
  («Ну да, занятий же нет, по-моему логично»), read in `docs/rounds/round-15.md:31` – the round-15
  header "The owner's five rulings, 09.08" – and cross-read against round-15 #14 and round-16 #8.
  It answers the question fully, so no interpretation was needed: **vacation weeks stop the wear
  clock.** Round-15 #14's own phrasing is the implementation – *wear should count weeks she trained
  or played* – and `kitAgeWeeks` now subtracts the booked-holiday weeks that fall inside the span
  before the curve is walked. Spec: `docs/specs/equipment-and-serve-speed.md` §2.
  → ⚠ **SCOPE HELD TO THE HOLIDAY.** A training week is a week she plays, so a week that merely
  lacks a tournament still wears at the normal rate; college is not a rest week; and **the injury
  half stays unruled**, in his own words. `tests/kit-holiday-wear.test.ts` carries both the claim and
  the over-reach guard, and **both were mutation-verified**: neutralising the wear term reddens the
  two holiday claims, and widening the rule to "any week without a tournament" reddens both guards.
  → ⚠ **NOT folded into `masseurWorksThisWeek` or `coachWorksThisWeek`**, deliberately – round 27 #10
  recorded an ACCEPTED asymmetry in that family (the physio bills through the college freeze, the
  coach does not), so "everything stops together" is not the house rule and one edit must not move
  three seats.
  → ⚠⚠ **WHAT THE EARLIER ROUNDS GOT WRONG, and it is why three askings produced no code.** Every
  previous pass described this as a one-line change to `kitWearAt` – round-16 #8 and round-15 #14
  both point at `equipment.ts:175` and say the term is simply missing. **It is not a one-liner**: the
  wear model is DERIVED from a purchase week, so the question is "how many rest weeks fell in this
  span", and `world.vacations` **cannot answer it** – `prunePlannerBookings` keeps only four trailing
  weeks, so a holiday is gone from that array long before the shoes it stood down are replaced.
  Deriving from it would have passed a unit test and been wrong on every real career. The change
  needs a small persisted ledger (`gearRestWeeks`, windowed at 52 weeks, written at `housekeep`
  ahead of the prune) – ⚠ optional, so **no schema move**: absence means "no rest recorded", which is
  the shipped behaviour byte for byte (`kit?` precedent; widening precedent `2763caa`), so
  `SAVE_SCHEMA_VERSION` stays **65** and no migration or golden fixture is owed.
  → ⭐ **MEASURED** (`tools/frozen-key-diff.ts`, preset 0, control = this change reverted in a
  detached worktree): **policy 0** (books no vacation) is **byte-identical on every key**; **policy 1**
  (books vacations) moved **only** `events` + the new `gearRestWeeks`. `rngMain` is byte-identical
  (`d84bcbf0c481`) in **all four arms** and the frozen MAIN capture (41550 / `e6b0c709`) is UNMOVED.
  ⚠ And the `events` move is **two match scorelines** over 156 weeks – same opponents, rounds and
  winners – with **no money row changed**: the earlier framing expected gear SPEND to move, and it
  does not. The family's recurring buys are a schedule, not a clock, so a holiday changes the
  CONDITION of her kit and never its price.
## Folded in from the audit – same surfaces, near-zero marginal cost

⭐ Both were found by item 17's audit (`docs/rounds/AUDIT-2026-08-28.md`) on files this wave was
already inside, so they cost the wave almost nothing and they shrink the audit's own open list.

- [x] **round 27 #8 – two screens said «за сезон» and meant different seasons.** His report was «в
  History расход за сезон написан 36 тысяч, а на вкладке расходов 25 тысяч» and his conclusion «явно
  что-то не ладно с нашей математикой». ⚠⚠ **THE ARITHMETIC WAS NEVER WRONG.** Both figures were right
  about DIFFERENT seasons: the spending tab folds the season **still running** (34 of 52 weeks on his
  save) while History lists seasons that have **wrapped** – and neither surface said which. A label,
  not a repair, exactly as the audit priced it. The period switcher now reads **«Season so far»** and
  the history card **«Completed seasons»**. Mounted arm in
  `tests/component/round29-shop-topup.test.ts`.

- [x] **round 17 #28 – `TierGuide.vue:49` was still printing `$0`.** Flagged 13.08, the item marked
  `[x]`, and this last surface never fixed – the audit called it «half-false» and it was. `shared/money.ts`
  already carries the rule («a fact – "no entry fee" – and a missing value – "$0" – must not look the
  same») and the only rung it can fire on is the slam, where charging nothing is the real rule. The
  cell now reads **«none»**. ⚠ Not `entryFeeLabel` here: this is a `.num` cell under a header that
  already says «Entry fee», so the helper's full sentence would have printed «no entry fee» under
  «Entry fee» and wrapped a numeric column. Mounted arm in the same file, mutation-verified.

---

## Asks – batched, so he answers in one pass

| | the choice |
| --- | --- |
| **6** | the multi-week skip: **(A)** repair it (it must move the calendar and report the real span), **(B)** delete the control, **(C)** keep it only for an injury lay-off |
| **11** | ~~Savings vs Index fund: what makes Savings worth holding once the fund can be topped up~~ – ⚙ **ANSWERED BY HIM, 28.08**: «мы для этого делаем Savings как раз, одни должны друг друга заменить». Savings is what the current account's interest turned into. |
| **12b** | ⭐ **THE JUNIOR YEARS NOW EARN NOTHING AT ALL** – the shelf replaces the wallet's yield but `shopUnlocked` gates it on the professional ladder. **(A)** leave it (a fourteen-year-old's family is not an investor), **(B)** open the two investment rungs early, **(C)** open them at some earlier mark |
| **11b** | ⭐ **RE-FILED after his «одни должны друг друга заменить» answered the bigger question.** The floating yield never shipped, so the index fund cannot fall – it is a risk-free 7% beside a risk-free 2%. **(A)** ship slice 2's drift so the fund really floats, **(B)** leave it, and accept that the fund is the strictly better holding above $5,000 |
