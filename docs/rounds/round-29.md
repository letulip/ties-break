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

- [~] **14. «Ни одной победы в 45 году, только 2е место на 500 и 250 и 2 взрыва ярости за год по
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

- [~] **17. «проверь предыдущие раунды на предмет "что забыто и не сделано" пожалуйста»** – **audit.**
  ⭐ Runs FIRST, because its output changes what the rest of this round should do.

- [x] **19. ⭐ «вроде бы я всё мержил и обновление прилетало на телефон, где информация об этом?
  может быть стоит какую-то версию добавить в настройках внизу строчкой? И в pull-request скилле
  обновлять при деплое?»** – **build, and it closes a hole that just cost us.** ⚠⚠ **I asserted his
  save predated round 28 and was wrong** – it is schemaVersion 65, i.e. round 28 was in it. Nothing
  on his screen says which build he is playing, so every defect he reports carries an unknown.

  What it owes: a version line at the foot of Settings, updated at deploy, identifying the build
  precisely enough to map a report onto a commit. ⭐ Recommend a short commit SHA plus the date rather
  than a semver – a semver says what we intended, a SHA says what he is running, and it is the second
  question we keep needing. Pairs with 18: the `pull-request` skill updates it.

  ⚙ **SHIPPED.** `[ ]` -> `[x]`. One muted line at the foot of More, on every tab – its SHAPE, since
  the SHA is by definition whatever commit the build was made from:

  > *Build 9201e53 · 2026-08-28 · save schema v65*

  Three fields, and the third is deliberate: the save schema is the OTHER number that misled us
  tonight, it costs nothing, and it is the BUILD's constant rather than the loaded save's – so it
  prints with no career open, which is exactly what the About table's `snapshot.schemaVersion` row
  cannot do. `scripts/build-stamp.mjs` (+ `.d.mts`), `src/buildStamp.ts`,
  `composables/buildInfo.ts`, and eleven lines of `MoreScreen.vue`.

  ⚠ **OUTSIDE THE TAB SWITCHER, NOT INSIDE `About`.** The man reading it is halfway through
  reporting a defect; asking him to first know which tab the answer lives on is asking him to
  already have it.

  ⚠⚠ **AND `define` IS NOT THE ROAD, WHICH IS A MEASUREMENT AND NOT A PREFERENCE.** It is the obvious
  one and it was tried first. A root `define` reaches the app build and the `unit` project (which
  sets `extends: true`); it is **silently dropped for the `component` project**, which does not – and
  so is a project-level `define` on it, and so is one contributed by a plugin's `config` hook. All
  three probed. The mounted assertion that the foot of Settings prints the REAL commit would have
  passed against `unknown`: a green test measuring its own fallback, the exact class of dead guard
  this round has been finding. `import.meta.env.VITE_*` is resolved per project through Vite's own
  `loadEnv` (which copies matching `process.env` keys), so the app build, the unit project and the
  component project all see one pair – and it is the repo's EXISTING shape for a build switch,
  `VITE_TB_SW` having lived in `src/vite-env.d.ts` since e2e.

  ⚙ **BAKED, CONFIRMED IN `dist/` AND NOT BY A GREP OF THE SOURCE.** `vite build` substitutes the
  reads into string literals – `const yB="9201e53",kB="2026-08-28"` in `dist/assets/index-*.js` – and
  **zero** occurrences of `VITE_BUILD_SHA` or `import.meta.env.VITE_BUILD` survive anywhere in the
  output. Nothing is resolved at runtime, so the line cannot disagree with the bundle printing it.
  It survives the PWA update path by construction: the stamped file is content-hashed, it is in
  `dist/sw.js`'s precache manifest (`"assets/index-B5qryx3R.js",revision:null`), so a new build is a
  new precache entry and the update he taps brings the new stamp with it.

  ⚙ **AND IT FOLLOWS `HEAD`, WHICH IS A SECOND BUILD AND NOT AN INFERENCE.** Rebuilt one commit later:
  the bundle's literal moved `9201e53` -> `6e21d49`, the old stamp appears **zero** times anywhere in
  `dist/`, and the asset's content hash moved with it (`index-B5qryx3R.js` -> `index-CsPKBW4L.js`),
  which is the same fact the service worker reads as "a new file to precache". A cached or
  config-time-frozen value would have failed exactly here.

  ⚠ **AND IT DOES NOT BREAK WHERE GIT CANNOT ANSWER.** A ladder, most direct first: the CI's own
  `GITHUB_SHA`/`CI_COMMIT_SHA` (exact, and it survives a container with no git binary), then
  `git rev-parse`, then an explicit `unknown`. The formatter validates SHAPE, not just emptiness –
  `HEAD`, `zzzzzzz` and an unsubstituted `__BUILD_SHA__` all render `unknown`, because a plausible
  wrong SHA costs the reader the whole investigation while `unknown` costs him one lookup.

  **Evidence.** `tests/component/round29-build-line.test.ts` (8) – MOUNTED on the real screen, and the
  SHA it expects is recomputed with `git rev-parse` independently of the code under test, so a define
  that stopped substituting turns it red instead of quietly rendering `unknown`; plus the foot
  placement, the tab sweep, and the git-less ladder against the real script.
  `tests/component/round29-build-line-fallback.test.ts` (3) – the same screen MOUNTED with the
  constants absent (the injection point mocked, formatter and component real), asserting the exact
  sentence `Build unknown · unknown · save schema v65`: not blank, no dangling separator, no
  identifier on screen. ⚠ Its own file because `vi.mock` is file-scoped and would otherwise mock the
  very constants the first file exists to read.
  ⚠ **Mutation-verified, 12 of 12 red, each alone**: the line deleted from the template (7 red); the
  SHA and the date each replaced by a placeholder (1, 1); the line hidden behind the About tab (7);
  a sibling appended after it (1); the schema clause dropped (4) and the schema hard-coded to the
  misleading 63 (3); the `unknown` fallback replaced by the raw value (3) and by an empty string (3);
  the script returning `''` instead of `unknown` (2); the CI variable trusted without a shape check
  (1); Cyrillic put in the rendered line (5).

  ⚙ **THE SKILL HALF («И в pull-request скилле обновлять при деплое?»).** Step 4d was already
  written; what it lacked was a way to run it. It now names two commands –
  `node scripts/build-stamp.mjs` prints what a build made now bakes, and a `grep` of `dist/assets/*.js`
  proves the bundle carries it – so the step is checkable with no browser and no phone. ⚠ With the
  caveat that matters: the SHA it prints is the BRANCH HEAD, and the merge makes a different commit,
  so what the step proves is the mechanism and not a value to paste into a PR body.

  ⚠ Schema **65**, unmoved – this is a string. No engine file touched; the frozen MAIN capture
  (41550 / `e6b0c709`) and the career hashes cannot see a version line.

- [x] **18. «добавить в скилл pull-request проверку несделанных пунктов из раунда»** – **build (skill).**
  ⭐ 17 and 18 are the same instinct: he has noticed that items go quiet, and wants the PR step to
  catch it mechanically rather than by my memory.

---

## Where the round stands, 29.08

**17 built · 4 answered · 0 open.** Every item he filed has a verdict. ⚠ What is NOT closed is
**seven decisions that are his**, listed in the PR body and in "Asks" below – they are not unfinished
work, they are work that must not be done without him.

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


---

# Part two – his answers, 29.08. THE ROUND IS NOT CLOSED UNTIL THESE ARE

⚠⚠ **I mis-filed these as a "round 30" and he corrected me**: «подожди, какой раунд 30? я думал, что
отвечал на вопросы 29… Как раз вот этот блок должен закрыть 29 раунд целиком.» He is right – the PR
body ended with «seven decisions that are his», and this is him making them. **They belong here, and
round 29 stays open until they are done.**



Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open · `[?]` his ·
`[!]` REOPENED.

**His replies to round 29's report.** Several are RULINGS that settle round 29's open questions; the
rest are new. 

---

## Rulings that CLOSE round 29's open questions

- [~] **R29 masseur on a shoot week** – ⚙ **CLOSED, no defect**: «ты же сам сказал, что получает, ведь
  он отбивает эти 7 обратно. Всё ок.»
- [~] **R29 item 14 / the 92%** – ⚙ **CLOSED, nothing to fix**: «да нет, судя по всему всё в норме, она
  же продвинулась до 20 места за этот сезон. так что "се ля ви", нечего чинить.» ⚠ So the top-25
  title rate stands as shipped; do not re-open it off round 29's measurement.
- [~] **R29 round 21 #12** – ⚙ **NOT overturned**, and my report was wrong to say it partly was:
  «нет, не отменяет, потому что % всё ещё будут начисляться.»

---

- [x] **1. «У нас есть одна сумма призовых, допустим 55200, тогда и ее доля будет 27600 и у нас income
  должен показывать 27600, а на соседней строчке все остальные расходы. Можно это сделать?»** –
  **build.** ⚠⚠ He did not want the base explained, he wanted the ledger to stop netting silently.
  **One prize figure, her half, the family's half, expenses beside it.** The row must mean what its
  name says.

  ⚙⚙ **SHIPPED, AND THE DECISION HE ASKED FOR IS: THE PERSISTED LEDGER STAYS NET, THE TILE STOPS
  NETTING.** Both shapes were on the table and this one was chosen for three reasons, all of them
  about not rewriting a career's past:

  1. **`financeWeeks` IS PERSISTED AND HIS SAVE HOLDS SIXTY OF THEM**, every one written under the NET
     convention. A gross `byCategory.prize` would make `financeWindow` fold sixty net rows together
     with new gross ones and print a season income the family never had. ⚠ **Forward-only means the
     historical weeks read exactly as they read** – and only a display can promise that.
  2. **`careerTotals.prizeCents` is «prize money THE FAMILY KEPT»** (the album's break-even page), and
     booking her cut as a family EXPENSE is what `finalizeTournament`'s own note forbids in as many
     words: it «would count the same cents twice».
  3. **The engine already carries the gross** – `FinanceWeek.kidShare.baseCents`, added by #10 for
     exactly this. So nothing new is persisted, **`SAVE_SCHEMA_VERSION` STAYS AT 65**, and the fix is
     the USE of that field the item actually wanted: rows, not a footnote.

  **THE TILE, on a week that split a cheque** (his w780 figures):

  | row | figure |
  | --- | --- |
  | Before her cut | **+$55,200** |
  | Her cut 50% | **–$27,600** |
  | Other income | +$1,446 |
  | Spent | –$6,883 |
  | **Balance** | **+$22,164** |

  ⭐ **They ADD UP, and that is his own test read literally**: `base − cut + other − spent ≡
  income − spent ≡ balance`, exactly, in cents. `balanceCents` did not move by a penny.

  ⚠ **«Before her cut» AND NOT «Prize money», deliberately.** `accrueKidShare` sums the gross of every
  cheque the ramp touched that week – the tournament's prize, the kit contract's result bonus and, on
  a quarter week, the retainer (#10's own table). A row called «Prize money» would name a source on a
  week a sponsor cheque supplied half of it. This name is true whatever the mix and it says what the
  figure is FOR: the base of the percentage on the very next line.

  ⚠ **AND IT FALLS BACK RATHER THAN GUESSING.** No recorded base – which is every week his save has
  already banked – keeps the Income / Spent / Balance shape it printed before, plus the foot that says
  out loud what `Income` there is. Same for the rare week where the derivation would print a NEGATIVE
  «Other income».

  ⚠ Evidence: `tests/component/week-recap-kid-share.test.ts` – a mounted arm that reads the four
  figures back **off the rendered card**, sums them and compares to the rendered balance (±$2, which
  is four independently-rounded dollar figures and nothing else). Mutation-verified: `other = income`
  (the double-count rebuilt), the gross row dropped, and `-split.cut` unsigned each redden that arm
  and only it.

- [x] **2. «Her cut 50% of $55,200 – $27,600 – это усложнило и фразу и интерфейс – верни Her cut 50% –
  $27,600 как было раньше пожалуйста»** – **build, revert.** ⚠ Round 29 #10 fixed the arithmetic's
  legibility by lengthening the sentence; he wants the sentence back and item 1 fixes the cause
  properly. **Do 1 first, then this is a pure revert.**

  ⚙ **SHIPPED, AND IT IS ONE LINE SHORTER THAN THE THING HE ASKED TO GO BACK TO.** The memo reads
  **«Her cut 50% – $27,600 into her own account.»** – his exact string, dash included, with the
  destination on the same line. The `of $55,200` clause is gone and **so is the branch**: one sentence
  for every week now, because the only reason the long form existed was that the base was nowhere
  else on the card, and item 1 has put it on the card as a row.

  ⚠ **HIS DASH, NOT THE PRE-#10 ONE.** The memo before #10 read «Her cut 50% $27,600» with no
  separator; he quoted the target back as «Her cut 50% **–** $27,600», and a quoted target beats my
  reading of «как было раньше». One character, said out loud rather than left to be spotted.

  ⚠ **THE OLD FOOT SURVIVES ON THE FALLBACK SHAPE ALONE** – «The income above is what the family
  kept.» It exists to stop a reader taking the memo for a deduction, and on the new rows that is said
  by the arithmetic; on a pre-#10 week, where `Income` really is a netted figure with nothing beside
  it, it still earns its place.

  ⚠⚠ **THE PIN IS RE-AIMED AND STRONGER, NOT DELETED.** #10's guard tied the stated percentage to the
  engine's actual share by reading one rendered figure against a snapshot field. The base is a ROW
  now, so the pin reads **two rendered figures**: `round(base × pct / 100) ≈ cut`, both taken off the
  screen. Mutation-verified – putting the `of $X` clause back reddens the short-sentence arm and the
  forward-only arm together, which is right: neither shape may carry a base inside the sentence again.

- [x] **3. «не вижу проблем сделать ставку 3.17% на Savings»** – ⚙ **RULING.** Savings takes the rate
  the current account used to pay, so the replacement is whole rather than 63% of one.

  ⚙⚙ **SHIPPED: `annualRateBps` 200 → 317 on the deposit, and it is his number, not a tuning.** 3.17%
  is exactly what the current account used to pay – `ECONOMY.savings.apyWeekly: 0.0006` annualised,
  `(1.0006)^52 − 1 = 3.17%`, the constant #12 deleted. The index fund is untouched at 700 bps: he
  named Savings, and #12's own «the fund would recover 221%» is why widening it by hand would have
  been the tuning he did not ask for. ⚠ The screen prints «Gains about **3%** a season» – the display
  rounds, the logic does not, which is his own whole-numbers rule of 26.08.

  ⚠⚠ **RE-MEASURED, SIX ARMS, `tools/r29p2-savings-sweep.ts`.** #12's ad-hoc three-career run is not
  reproducible, so this is its question re-asked at bench scale: 18 cells (9 presets × 2 policies) ×
  30 seeds × 3 horizons = **1,620 careers per arm**, the same shape #12 used. Total wealth = wallet +
  shelf. Arms A and B are **separate worktrees at `fd959b0`** (A = that tree with `74cb407` reverted,
  so the interest is back and its readers confirmed present); C is this branch. The sweep policy keeps
  a **$5,000** living float and puts the rest in the deposit, taking back exactly what it needs when
  the float runs short – ⭐ **the second half is only expressible because item 4 shipped part sales.**

  **THE CLEAN HORIZON (14→16, the junior sink – #12's own instruction to read this row and discount
  the other two, because it is the only one where the arms differ by the money and nothing else):**

  | arm | what it is | end wealth mean | survivors |
  | --- | --- | --- | --- |
  | A | the interest, as it was | **$26,155** | 453/540 |
  | B | neither (shipped `fd959b0`) | **$24,168** | 451/540 |
  | C | Savings, swept | **$36,500** | **461/540** |

  ⚙ **THE INTEREST WAS WORTH +$1,987 A CAREER** (A − B), positive in **17 of 18 cells** – which
  reproduces #12's **−$1,954, 18 of 18** on a tree that has moved ~15 commits since 28.08. The old
  figure is corroborated, not contradicted.

  ⚠⚠ **AND «C − B = +$12,332» IS NOT THE ANSWER TO HIS QUESTION, WHICH IS THE MOST IMPORTANT LINE
  HERE.** Money swept off the current account also makes the family look POORER to every
  affordability check in the bench's own policy, so it enters fewer tournaments and buys less
  coaching – in the junior sink, where none of that pays back. That is a property of my sweep policy,
  not of his ruling, and calling it «the deposit earned that» would be the false attribution #12's own
  table warned about. **So the rate was isolated**: the same sweep, the same careers, only
  `annualRateBps` moved.

  | deposit rate | end wealth mean (14→16, sweep on) | yield vs 0% | recovers of the $1,987 |
  | --- | --- | --- | --- |
  | 0 bps | $34,422 | – | – |
  | 200 bps (shipped) | $35,737 | **+$1,314** | **66%** |
  | **317 bps (his ruling)** | **$36,500** | **+$2,078** | **105%** |

  ⚙⚙ **SO THE ANSWER IS YES, AND IT IS PARITY RATHER THAN AN OVERSHOOT.** The 200 bps row independently
  reproduces #12's **63%** at 66% – measured on a different horizon, a different policy and a
  different instrument, which is the strongest thing that can be said for either number. At his
  3.17% the replacement pays **105%** of the wage it replaced, and the 5% is inside this instrument's
  resolution: careers diverge on money (the yield is positive in 15 of 18 cells, not 18), so nothing
  is tuned and nothing needs to be. ⭐ **Savings now IS the current account's interest, moved behind a
  decision** – which is precisely what he ruled on 28.08: «одни должны друг друга заменить».

  ⚠⚠ **SURVIVAL, ALL THREE HORIZONS, 1,620 CAREERS PER ARM – AND #12's FIGURE COMES BACK TO THE
  CAREER:**

  | arm | survivors | #12 said |
  | --- | --- | --- |
  | A – the interest | **1,034** / 1,620 | **1,034** |
  | B – neither | 1,010 / 1,620 | 1,022 |
  | **C – Savings, swept** | **1,086** / 1,620 | – |

  ⭐ Arm A reproduces #12's 1,034 **exactly**; arm B lands 12 careers below its 1,022, which is the
  tree having moved ~15 commits. ⚙ **And the replacement does not merely restore survival, it beats
  it: 1,086 against the interest's 1,034.** That is not a paradox – a family that keeps a $5,000
  float and pulls money back when it dips is running a better cash policy than one that simply
  spends, and item 4's partial sale is what makes «pull some back» a move at all.

  ⚠ **AND THE 14→20 WEALTH ROW IS THE ONE TO DISTRUST, exactly as #12 said of its own**: A $538,223 ·
  B $498,960 · C $383,090. The sweep arm ends POORER and yet survives more often, which is the same
  spending brake read at the horizon where entering tournaments finally pays: fewer entries, fewer
  prize cheques, fewer bankruptcies. Those numbers measure career divergence under a bench policy,
  not this ruling – the 14→16 rate table above is the one that answers his question.

  ⚠⚠ **AND THE NULL ARM IS NAMED HONESTLY, AS THE BRIEF DEMANDED.** Running this same tool on THIS
  branch with `--sweep=off` reproduces arm B **exactly, on all three horizons** – $24,168 / 451,
  $36,094 / 303, $498,960 / 256, and **1,010 / 1,620** overall – because
  nothing in items 3 or 6 has a reader unless somebody BUYS. That is not a null result about the
  change; it is proof that the sweep is the reader. Proven the other way too: with the deposit set to
  an absurd **99,999 bps**, the sweep arm's 14→16 mean goes from $33,213 to **$4,057,323** on the same
  three seeds, while all three frozen careers stay byte-identical.

  ⚠ **FROZEN CAREERS: BYTE-IDENTICAL, AND THAT PROVES NOTHING ON ITS OWN – SO IT WAS PROVEN BY
  MUTATION.** Per-key diff first (`tools/frozen-key-diff.ts`, control = a detached worktree at
  `fd959b0`, headers checked against each invocation because ⚠ the word-split trap DID bite once here
  – zsh does not word-split an unquoted `$var`, and three files came back all reading
  `# preset 0 policy 1`). All three careers (5/0, 8/0, 0/1) are **byte-identical, `rngMain` included**,
  and the frozen MAIN capture (41550 / `e6b0c709`) is untouched. ⚠ But the frozen careers are 14–17
  over 156 weeks and **no bench policy in that file buys anything**, so there is no reader there: the
  absurd-rate arm above is what makes that a proven absence rather than an assumed one, and
  `tests/coach-travel-edge.test.ts` already asserts `world.assets === []` in all three.

- [x] **4. «при продаже бумаг надо дать возможность только часть продавать, иными словами при продаже
  надо дать цифровой инпут для ввода суммы продажи»** – **build.** A numeric input on the sale, not
  all-or-nothing. ⭐ His own reasoning: with partial sales the instrument becomes a real cash
  management decision instead of a one-way door.

  ⚙⚙ **SHIPPED.** `sellAsset(world, itemId, amountCents?)` – absent means «sell the lot», which is
  what every caller written before this meant and still means. The screen draws a numeric box beside
  the sale control, blank by default, and the control renames itself «Take out $30,000» the moment a
  smaller figure is in it.

  ⚠ **«БУМАГ» IS LOAD-BEARING AND IT IS THE `stake` AGAIN.** A part sale is offered on `'open'` rungs
  and refused on `'fixed'` ones – `buyAsset`'s top-up predicate read from the other end. An 'open'
  rung is «a product you choose an amount for» and takes money in and out in parts; a car has one
  price and one sale. One property decides both directions, so a third investment added tomorrow is
  divisible because of what it IS.

  ⚠⚠ **AND IT DOES NOT BREAK #11's P&L – WHICH IS THE TRAP, AND THE FIRST TEST I WROTE FOR IT WAS
  DEAD.** `revalueAssets` recomputes `valueCents` from `basisCents`/`basisWeek` every tick, so a sale
  that only lowered the value is undone the following week with the cash already banked. The sale
  therefore rebases exactly as the top-up does (`basisCents` = what is left, struck today) and gives
  up the cost of what left (`round(paidCents × proceeds / value)`, **the remainder by subtraction** –
  `kidPrizeShareCents`' one-rounding discipline), so realised + unrealised = the gain, to the cent.
  ⚠⚠ **The arm that was supposed to catch this passed under mutation**: a freshly-bought deposit
  carries no `basisCents` at all, the fallback reads `paidCents`, and `paidCents` had been scaled by
  the same fraction – which made the rebase-less mutant arithmetically identical on that fixture. The
  fixture is a TOPPED-UP holding now, where the basis is real and stale, and there the mutant restores
  the whole holding. Written out in the test rather than quietly fixed.

  ⚠ **THE THREE GUARDS, each mutation-verified alone:** more than is held (refused, with the figure in
  the sentence), negative (refused), **zero (refused, and NO ledger row written** – a zero-op that
  still charges would have printed «Sold $0 of:»). Two more that the item did not name and that the
  code needed:
  - **`NaN` is the same refusal, and the first draft of the guard did not catch it.** `NaN <= 0` is
    false and `NaN > value` is false, so a malformed amount off the wire would have walked past every
    comparison and written `NaN` into `valueCents` and `basisCents` – a corrupted career behind a
    guard that read like it covered this. `!(asked > 0)` is the form that catches it, and mutating it
    back to `asked < 0` reddens the zero arm and the NaN arm together.
  - **An amount on a FIXED rung is refused rather than ignored**, which is the one place this does not
    mirror `buyAsset` – ignoring a stake on a buy means paying the catalogue's stated price, ignoring
    an amount on a sale would mean disposing of a whole car when half was asked for.

  ⚠ **DISPLAY ROUNDED, LOGIC NOT.** Every figure in `sellAsset` is integer cents; the only rounding is
  the one cost split, and `formatCents` does the dollars on screen.

  ⚠ Evidence: `tests/round29p2-part-sale.test.ts` (10 arms – two sales in sequence asserting the
  wallet, the remaining holding and the P&L identity at each step; the rebase; the top-up interaction;
  the guards) and `tests/component/round29p2-part-sale.test.ts` (4 mounted arms, `game.sellAsset`
  spied so the ARGUMENT is what is asserted – a screen that drew a perfect box and then sold the whole
  holding would pass every rendering check ever written for it).

- [x] **5. «мировые топы должны иметь все возможности достучаться до топовой спортсменки»** –
  ⚙ **RULING on round 29's `global`-dominated-by-`tour` defect.** The global rung must be at least as
  good as the one below it. ⚠ Its terms, not its gate.

  ⚙⚙ **SHIPPED, AND THE SPEC PREDICTED THIS DEFECT AT DESIGN TIME AND NOBODY EVER TOOK THE CALL TO
  YOU.** `docs/specs/act2-pro-tour.md` §7, verbatim, written when the professional rungs were
  proposed: «`tour`'s WTA ≤ 200 sits deliberately BELOW global's 31 in strength while above it in
  kind, **which is the one thing to resolve when it is built** … an owner's call at build time, not
  now.» It was never resolved. The rungs went in side by side, and `global` ended up sorted ABOVE
  `tour` while paying **less**: the same $5,000 of kit and the same 25% of the fare, but **no
  retainer** against tour's $6,000 a season and **no result bonus** against its 20% of every W75+
  cheque, locking three seasons against two. Your ruling is that call, finally made, and §7 is
  amended where it stood open.

  ⭐ **WHAT IT TAKES, AND NEITHER NUMBER IS INVENTED.** A **$2,000/quarter retainer** ($8,000 a
  season) – the TOP of §7's own «~$3–8k/yr» band, where `tour` takes the middle – and `tour`'s bonus
  **verbatim** (20% from W75). Strictly better on the retainer rather than merely equal, on purpose:
  a rung that matched the one below it and still locked a third season would remain the worse deal.
  The bonus is not stepped because a fourth value between 20% and `premium`'s 25% would be a number
  invented to fill a gap the design does not have – 20 / 20 / 25 / 30 is non-decreasing and adds
  nothing to retune.

  ⚠ **THE GATE IS NOT TOUCHED.** `maxItfRank: 8` and `maxWtaRank: 87` are read and never written.

  ⚠⚠ **YES – `kit-776` IN YOUR SAVE KEEPS ITS BAD TERMS, AND YOU WILL SEE IT.** The Play Beyond
  letter open in your inbox was written from the old catalogue, and `kitTermsFor`'s standing rule
  freezes every term at ARRIVAL («terms never improve while you hold the letter»). That rule is the
  reason a held letter can never pay you for waiting, and repairing this one in place would mean a
  contract whose numbers change under you – so the fix is **forward-only** and the open letter is
  the one career-week that pays for it. **The next Play Beyond letter carries the retainer.**
  Refusing this one to wait for that is a real choice and a real cost (a season of kit); it is
  yours, and the game will not make it for you.

  ⭐ **THE GUARD IS A PROPERTY OVER THE WHOLE LADDER, NOT A CASE ABOUT `global`** –
  `tests/round29p2-ladder-monotone.test.ts`. Two arms: every rung is **at least as good as the one
  below it on every term that pays her** (kit allowance, freshness ceiling, lines covered, travel
  share, retainer, appearance fee, bonus share, and how far down the ladder the bonus reaches), and
  every rung **improves somewhere**, so no rung can be pure ceremony. It reads the catalogue through
  `kitTermsFor` – the same function the engine reads it through – so a rung fixed in `ECONOMY` and
  dropped on the floor in `kitTermsFor`, which is exactly how this could have half-shipped, fails
  there. `global` paid less than `tour` from **04.08** (`dd2997c`, the commit that added the three
  professional rungs) to today – twenty-five days – and nothing in the repo objected, because the
  ordering's promise lived only in `windowLadder`'s header, and **prose does not fail a build**.

  ⚠ **AND THE PROPERTY FOUND A SECOND INVERSION I HAD NOT LOOKED FOR, WHICH IS REPORTED AND NOT
  FIXED.** `minEventsPerSeason` runs 8 / 10 / **14 / 12** / 16 / 16 – `tour` asks fourteen events and
  `global`, one rung above it, asks twelve. Both rungs' comments read «the step of two» off an order
  in which global comes fourth and tour fifth, which is not the order `SPONSOR_TIERS` has: the same
  artefact of `tour`'s insertion. ⭐ **It is left alone deliberately** – an obligation that FALLS as
  the rung improves is the player-favourable direction, so it is not a domination and not the defect
  you ruled on. Raising it would make a deal harder to keep, which is a balance decision and is
  yours. Pinned as literals so it cannot be «tidied» into a real domination by accident.

  ⚙ **AND THE REACH BENCH NO LONGER PRINTS THE WARNING IT USED TO.** `tools/sponsor-ladder-reach.ts`
  has always ended its worth-table with a domination check, and every run before this one closed
  with `⚠ global is presented ABOVE tour and pays LESS on: retainer, bonus – and locks 3 seasons
  against 2`. It is gone. ⚠ **The tool itself had to be fixed to say that honestly**: its table was
  hand-built when `global` had no cash fields, so it read ZERO for both and would have kept flagging
  the defect for a whole run AFTER the ruling shipped.

  ⚠ Mutation-verified: reverting `global`'s retainer and bonus reddens the property, the
  improves-somewhere arm and the named-defect arm together.

  ⚠⚠ **FROZEN CAREERS: BYTE-IDENTICAL ON ALL THREE ARMS, AND I AM NAMING THE NULL ARM HONESTLY
  BECAUSE THAT ON ITS OWN PROVES NOTHING.** Per-key diff first (`tools/frozen-key-diff.ts`, control =
  **this commit reverted in a detached worktree**, not the previous commit), headers checked against
  each invocation – `# preset 5 policy 0`, `# preset 8 policy 0`, `# preset 0 policy 1`, three
  different lines, which is the trap that has bitten three agents. All three arms **byte-identical on
  every key, `rngMain` included**, and the frozen MAIN capture (41550 / `e6b0c709`) is untouched –
  nothing in this wave draws.
  ⭐ **THE ABSENCE IS PROVEN, NOT ASSUMED.** These careers run 156 weeks to age 17, and
  `tools/econ-bench.ts` **never signs an offer** – so no retainer is ever paid, no `seasonSpokenFor`
  is ever true, and eighteen never arrives for an advertising letter. Proven by two mutations rather
  than by that argument alone: setting `global.retainerCents` to an absurd **$99,999,999** moves
  **nothing on any arm**, while setting `sponsorship.seasonCents` – a constant these careers DO read –
  to the same absurd value moves the `offers` key on **all three**. The instrument is live; the
  reader for this change is simply not in that fixture.

- [x] **6. «магазин открыт всегда с начала игры»** – ⚙ **RULING.** `shopUnlocked`'s professional gate
  goes. ⭐ This also closes round 29's ask 12b: the junior years get the Savings replacement they
  had no access to.

  ⚙⚙ **SHIPPED, AND THE GATE IS DELETED RATHER THAN LEFT RETURNING TRUE.** `shopUnlocked`,
  `SHOP_LOCKED_DETAIL`, the `ShopView.unlocked` / `lockedDetail` pair, `buyAsset`'s first guard and
  the screen's shut arm are all gone. That is `ECONOMY.savings`' own precedent from #12 one round
  earlier, verbatim in its situation: «a live balance constant that nothing charges is a decision
  nobody can find, and the next reader wires it back up believing it is a knob». A predicate that
  cannot be false and a refusal string nothing prints are the same hazard. What went, and why, is
  written out where the predicate stood (`src/engine/world/shop.ts`), and §13e of the shop spec is
  amended from «THE GATE IS UNCHANGED, AND THAT IS A DECISION» to his ruling.

  ⚠ **`masseurUnlocked` KEEPS THE SAME PREDICATE THIS ONE USED TO SHARE.** His ruling is about the
  shop; a seat on the staff is not a thing on a shelf.

  ⭐ **WHAT A FOURTEEN-YEAR-OLD CAN NOW SEE AND BUY – and nothing in the catalogue breaks at that
  age.** Checked rung by rung, because a rung that BREAKS at 14 is a defect where a rung merely out of
  reach is not:
  - **Reachable at 14:** the **savings deposit ($1,000)** and, for a wealthy family, the **index fund
    ($5,000)**. That pair is exactly what ask 12b was about, and it is the whole of what changes
    materially.
  - **Visible and priced out:** five cars ($60k–$300k), the houses, the boats, the planes ($38M) and
    the four academy stages. That is §2's own «a shop window is a thing you look into before you can
    afford it», and `affordable` moves the CONTROL rather than the row.
  - **Nothing breaks.** Nothing on the shelf reads about her or reaches her – §1's «the shelf belongs
    to the PARENT» is the catalogue's rule and the two items that were about her were struck before
    slice 1 shipped. `requiresId` still orders the academy stages, `buildWeeks` still makes a boat a
    contract before it is a boat, upkeep is still charged on delivered rungs only, and
    `guardNotEndedForGood` is now the only door in the file.

  ⚠ **Guard tests RE-AIMED, NOT DELETED** – four of them, and they are the arms that would catch the
  gate creeping back: `tests/shop.test.ts`' gate block now asserts a junior family CAN buy on the very
  fixture that used to be refused (plus a week-0 arm), its `shopView` arm asserts the whole shelf where
  it asserted a shut one, `tests/round24-college-refusals.test.ts`' shop arm now asserts a SUCCESS
  where it used to assert a second refusal standing in (a strictly stronger claim), and
  `tests/component/shop-tab.test.ts`' «the junior years get ONE SENTENCE» is inverted to «the junior
  years get THE WHOLE SHELF» – rows drawn, the deposit's control live and pressable at 14, with §2's
  three prohibitions (no locked row, no progress bar, no teaser) kept as absences.

- [x] **7. «Запихнуть туда корты стоило бы +5108 КБ – это не очень большая цена, надо сделать, чтобы
  можно было полностью оффлайн играть без помех… Возможно все надо в установку PWA добавлять. А с
  обновлением догружать то, чего нет или обновлять то, что обновилось, а не весь сет.»** – ⚙ **RULING,
  and it overturns round 29 #2's conservative choice.** Full offline is the goal. ⚠⚠ **The second
  sentence is the hard half and the more important one**: an update must fetch only what is new or
  changed, never the whole set. Inventory every art directory first and report the total.

  ⚙⚙ **SHIPPED. `globIgnores: ['**/images/**']` IS DELETED AND ALL 205 PAINTINGS ARE IN THE INSTALL.**
  Read from the build's own output, before and after:

  | | entries | size |
  | --- | --- | --- |
  | before (`b8a405d`) | 108 | **2636 KiB** |
  | after | **313** | **12255 KiB** |

  ⚠ **THE 118 / 2826 KiB IN #2's TABLE IS FOUR WEEKS STALE** – the real baseline on this branch is
  **108 / 2636**, measured rather than quoted. The direction and the argument are unchanged; the
  number is not, and this round has already lost time to one stale count.

  ---

  ### THE INVENTORY HE ASKED FOR – «посмотреть что еще там у нас есть из артов»

  Every directory in `public/`, by `stat`, on 29.08. **IN** = swept into the install by
  `globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}']`.

  | directory | files IN | KiB IN | files OUT | KiB OUT | status |
  | --- | ---: | ---: | ---: | ---: | --- |
  | `images/fields` – courts | 73 | **4989** | – | – | ⭐ **NEW – his +5108 КБ** |
  | `images/fem-euro-brunnet` – her portraits | 64 | **2915** | – | – | ⭐ NEW |
  | `images/weeks` – week cards | 14 | 765 | – | – | ⭐ NEW |
  | `images/trophies` – the cabinet | 32 | 749 | – | – | ⭐ NEW |
  | `images/coaches` | 16 | 165 | – | – | ⭐ NEW |
  | `images/sponsors` | 6 | 38 | – | – | ⭐ NEW |
  | `images/README.md` – rights record | – | – | 1 | 5 | not art, stays out |
  | `(public root)` – pwa icons, logos, ball | 17 | 1082 | – | – | was already in |
  | `avatars` – 256px crops | 37 | 369 | – | – | was already in |
  | `icons` + `icons/styles` | 38 | 58 | – | – | was already in |
  | `fonts` | 4 | 92 | 4 | 15 | woff2 in, OFL licences out |
  | `music` | – | – | 3 | **2552** | ⚠ **OUT – his call** |
  | `sounds` | – | – | 24 | **435** | ⚠ **OUT – his call** |
  | **total** | **301** | **11221** | **32** | **3007** | |

  The build turns those 301 public files into **313 precache entries / 12255 KiB** once `index.html`
  and the hashed bundles join them. ⚠ Six entries are DUPLICATES – `ball.svg`, `favicon.png` and the
  four pwa icons are named by both `includeAssets` and `globPatterns` – so the cache actually holds
  **307 keys**. Harmless, and worth knowing before anybody counts cache entries and finds six missing.

  ⚠⚠ **AUDIO IS NOT SWEPT IN, AND THAT IS DELIBERATELY LEFT TO HIM.** ~3 MB would be another 25% on
  the install for one decision that is not obviously his:

  - **`music/theme.mp3` – 2524 KiB.** The single biggest skippable file in the repo, and it is a
    loop a player can mute on the first screen. ⚠ It is NOT blocked on licensing, contrary to what I
    was briefed: `public/music/README.md` records it as "Clean Sound" under the **Pixabay Content
    License** – commercial use permitted, no attribution required. So this is purely a size question.
  - **`sounds/*.mp3` – 431 KiB across 23 clips**, the owner's own recordings. This is the arguable
    half: offline the match is **silent today**, because `src/audio/sfx.ts` probes each file, fails,
    remembers the miss and never retries. If «без помех» includes the applause, this is 431 KiB and
    the change is one extension in `globPatterns`.

  ⭐ **A one-line question for him: add `mp3` (+3 MB, everything sounds offline), add the sounds only
  (+431 KiB, the match stops being silent), or leave both?** `tests/round29p2-offline-install.test.ts`
  holds the current answer so it cannot drift in by accident, and says in its own comment that his
  ruling re-aims it rather than deleting it.

  ⚠ **FONTS NEEDED NO DECISION** – `woff2` has been in the glob all along, so all four faces (92 KiB)
  already precache. That is why offline text has never fallen back to a system stack.

  ---

  ### IS 12.3 MB TOO LARGE FOR A MID-RANGE PHONE? NO – AND THE HONEST CAVEAT IS NAMED

  On disk it is nothing: a modern origin quota is a share of free storage measured in GB, and the app
  was already asking for ~2.6 MB plus a runtime art cache that could reach ~7 MB by itself. **The real
  cost is the one-time install download** – ~9.6 MB more, about 35 s on a poor 3 Mbit/s link, once.
  Every visit after that is the same as before.

  ⚠ **And it is the last big jump available.** `public/` is 14.6 MB in total and 12.3 of it is now in
  the install; the only things left out are 3 MB of audio and the licence files. If he later wants
  the install smaller, the levers are named rather than guessed: the 11 unreachable
  `fem-euro-brunnet` frames (**~496 KiB** – 7 story frames waiting on a life-events feature, 4
  `-sleepy-` files that `docs/art-placeholders.md` already records as superseded) are the only art in
  the repo that no code path can request, and deleting art is his call, not a builder's.

  ---

  ### ⚠⚠ THE HARD HALF: AN UPDATE FETCHES ONE FILE, NOT 313 – MEASURED, NOT ASSUMED

  Workbox is *documented* to do this and that is not evidence, so it was put to a real browser.
  `tools/precache-delta.mjs` (committed, re-runnable) builds twice with **one painting altered**,
  serves build A to a real Chromium until its worker has precached all 307 keys, swaps the served
  directory to build B, lets the update install, and **counts the requests at the server** – with
  `Cache-Control: no-store` on everything, so the browser's own HTTP cache cannot hide a fetch and
  the measurement is biased AGAINST the claim.

  | arm | requests the second install made | of them images | bytes |
  | --- | ---: | ---: | ---: |
  | **one painting changed** | **3** | **1** | **120.8 KiB** |
  | every revision rewritten (control) | 305 | 205 | 11263.8 KiB |

  ⭐ **One painting of 205. 120.8 KiB of 12.3 MB** – and the other two requests are `sw.js` and the
  workbox runtime, which a browser re-fetches to notice an update at all. **His ruling holds:
  «догружать то, чего нет… а не весь сет».**

  ⚠⚠ **THE SECOND ROW IS THE INSTRUMENT'S OWN CONTROL AND IT IS WHY THE FIRST ROW MEANS ANYTHING.**
  A counter that cannot report a full re-download is not evidence that there wasn't one. That arm
  rewrites every revision in `sw.js` without rebuilding a single file, and the tool duly reports 305
  requests and 11.3 MB. ⚠ It fetches 303 assets rather than 307, and the four it skips are the right
  four: `assets/*` are content-hashed filenames carrying `revision: null`, so the URL IS the key and
  a bundle that did not change is not re-downloaded either.

  ---

  ### THE RUNTIME ART ROUTES ARE GONE, AND THE OLD CACHES ARE DELETED OFF HIS PHONE

  `precacheAndRoute` registers its route FIRST and workbox's router takes the first match, so
  `tb-art-v1` (CacheFirst, 80) and `tb-art-small-v1` (StaleWhileRevalidate, 48) could never fire
  again. A route that cannot fire is a dead guard wearing a comment.

  ⭐ **AND THE PRECACHE FIXES WHAT THE SPLIT WAS FOR.** `tb-art-small-v1` existed because he
  repainted two trophies on 01.08 and his phone kept the old ones – CacheFirst never revalidates. A
  precache entry is keyed on url+revision, so a repainted trophy has a NEW key and the next update
  fetches exactly it: one file, which is the 120.8 KiB row above. ⭐ And `maxEntries: 80` against 167
  reachable files – a silent-eviction risk vite.config has carried since 19.08 – stops being a number
  anybody has to size.

  ⚠ **`cleanupOutdatedCaches` DOES NOT TOUCH A RUNTIME CACHE**, only old precaches, so up to 128
  entries of art (~7 MB) would have sat on his phone forever beside the new 12 MB install. The
  install would have looked twice as expensive as it is. `dropLegacyArtCaches()` in `src/pwa.ts`
  deletes both – gated on a **positive fact rather than a version guess**: it runs only once the live
  precache is answering for `/images/`. ⚠ That gate is the safety property, not decoration: with
  `registerType: 'prompt'` he sits on the old worker until he taps Update, and on that worker
  `tb-art-v1` still holds the only copy of a painting he has.

  ---

  ### EVIDENCE

  **`e2e/offline.spec.ts` – three claims where round 29 #2 made one**, from a real production build
  with a real registered worker and the network cut with `context.setOffline`:

  1. **the install carried the art and no warm did** – >200 `/images/` keys in the precache, and
     `caches.has('tb-art-v1')` is **false**: the runtime cache is not empty, it is never created;
  2. ⭐ **all 205 shipped paintings answer from cache offline** – the URL list is walked off
     `public/images/` rather than written out, so it is "every file that ships" on the day, not a
     list that agrees with itself. No warm could ever satisfy this: a cold install has asked for
     nothing;
  3. ⭐ **and he can PLAY there** – Season and the trophy cabinet render with **zero blank plates**,
     then a week is advanced with the plug pulled: RPC into a real Web Worker, a real engine tick, a
     real IndexedDB autosave, the diary line coming back.

  ⚠ **ONE GUARD RE-AIMED, NEVER DELETED, AND IT WOULD HAVE REPORTED THE FIX AS A REGRESSION.** #2's
  poll waited for `tb-art-v1` to fill. That cache no longer exists, so it would have hung to timeout.
  It is inverted at the precache instead, and the pair is stronger than either half.
  ⚠ Same for `tests/round13-nav.test.ts`, which asserted `globIgnores: ['**/images/**']` is PRESENT:
  it now asserts the opposite fact, because what must not happen silently is unchanged in kind –
  somebody quietly changing whether a player's install contains this art.

  ⚠ **MUTATION-VERIFIED, AND TWO MUTANTS SURVIVED THE FIRST DRAFT** – written up in the test file
  rather than quietly fixed:

  - **the new unit file's extension set was hand-written**, so deleting `webp` from `globPatterns` –
    the exact regression it exists to catch, the one that takes all 205 paintings back out – left
    all ten tests GREEN. A constant compared with itself, the family this round keeps finding. It is
    parsed out of `vite.config.ts` now, and that mutation reddens two arms.
  - **the «no CacheStorage» arm was covered by the `try/catch` as well as by the guard it claimed to
    test**, so deleting that guard changed nothing. Merged into one honest arm; `src/pwa.ts` says so
    at the guard itself.

  Live mutations, each verified red: `globIgnores` back → the e2e names it AND `round13-nav` goes
  red; with claim 1 also neutered, claim 2 reports **«205 of 205 paintings are not on the device
  offline»**; `webp` out of the glob → 2 red; `mp3` INTO the glob → red (audio cannot be swept in
  silently); the runtime routes back → red; either legacy cache name dropped → red; the call
  unwired from `initPwa` → red; the `try/catch` removed → red.

  ⚠ **SCHEMA 65 UNMOVED, frozen careers and the frozen MAIN capture (41550 / `e6b0c709`) UNTOUCHED** –
  a precache manifest is not a world change, and nothing in this item reaches `src/engine`.

- [ ] **8. «она же бесплатная только при наличии яхты, верно? я могу сделать для нее отдельный арт,
  тогда можно просто на постоянку добавить в ленту сначала с реальной стоимостью, а после покупки
  яхты это станет бесплатным»** – **build.** The yacht week is a permanent vacation line, priced
  normally, and becomes free once the yacht is owned. ⚠ He is also supplying art.

- [ ] **9. «изначально стоит дороже немного (х1.4 вроде мы считали, да?)»** – **verify then build.**
  Confirm the ×1.4 against the spec before using it; if the spec says another number, his memory is
  the thing to check, not the source of truth.

- [ ] **10. «Эпилог… надо добавить, мне кажется. Это всё-таки финал игры.»** – ⚙ **RULING**, settling
  the shop spec's §10.4. The epilogue names the academy. He is supplying art for every item and
  academy stage.

- [ ] **11. «добавь пожалуйста вообще идею и концепцию фотоальбома для эпилога в бэклог отдельной
  задачей»** – **backlog entry**, not a build. A photo album for the epilogue, as a concept.

- [x] **12. «открытое сейчас в вашем ящике продление Baseline закроет и следующую зимнюю почту… вот с
  этим надо что-то делать, там без спонсора грустновато немного живется»** – **build.** A renewal
  should not shut the winter's post. ⚠ Round 28 #17 made the renewal suppress the ladder's letter to
  stop a duplicate; this is the cost of that fix showing up, so read that reasoning before changing it.

  ⚙⚙ **SHIPPED, AND IT IS NOT ROUND 28 #17 BEING UNDONE.** That fix stops ONE BRAND writing twice in
  a winter and is untouched, still mutation-verified, and asserted again by the new arms. The rule
  that shut your winter is the OTHER one – `seasonSpokenFor`, «one brand at a time» – and only its
  top edge moves.

  ⚙ **MEASURED FIRST, ON THE SHIPPED CODE (108 careers x 780 weeks, `tools/sponsor-ladder-reach.ts`),
  AND THE MEASUREMENT IS WHY THE SHAPE IS THIS SHAPE.** 1,274 sponsor windows lived through:

  | what the winter did | n | share |
  | --- | ---: | ---: |
  | produced no kit letter at all | **416** | 32.7% |
  | ...of which: the season ahead was already promised to a running deal | **360** | 28.3% |
  | ...and letters raised in those 360 anyway | **0** | – |
  | ⭐ a **strictly stronger** rung was cleared and standing behind that closed door | **191** | 15.0% |

  ⭐ **AND THE COMMONEST SHUT-OUT IS YOUR SAVE TO THE BRAND: `global` standing in front of `premium`
  (84 of the 191)** – Play Beyond's contract, Meridian Sport's letter. Then `national` in front of
  `tour` (26), `tour` in front of `premium` (24), `premium` in front of `icon` (24).

  ⭐ **THE FIX: A RUNNING DEAL TURNS AWAY EVERY RUNG AT OR BELOW ITS OWN, AND A STRICTLY STRONGER ONE
  MAY WRITE** (`rungTurnedAway`, read per rung inside `raiseKitOffers` instead of once at the top).
  Three things it does NOT change, each load-bearing and each asserted:
  - **One brand at a time survives literally.** Two contracts are never live at once, because signing
    the stronger letter ENDS the running one with the season it is in – the same `endDealWithSeason`
    snap a failed deal takes – and the successor starts the week after.
  - **The term still bites, and it bites hardest where the deals are longest.** A running `premium`
    contract can be written over by `icon` and by nothing else – one of six rungs – and NOTHING can
    write over `icon` at all. Only the weak end of the ladder is genuinely permeable. A long contract
    is still a real decision, which is what `seasons` is for.
  - **Nothing is manufactured.** The stronger rung still has to be one `standingClears` would have,
    and still rolls its own dice on its own slot.

  ⭐ **AND THE BRAND SHE LEAVES WRITES TO SAY SO** – a fourth `KitEndReason`, `'stepped'`, with its
  own sentence («We hear she is going somewhere bigger, and honestly we are not surprised»). It is
  NOT re-used `term`, because `term` means «terms honoured on both sides» and this deal was not
  served out; the goodbye is the only place you ever learn a contract stopped, so it must not lie.
  Raised at the signature so the true reason is the one that survives – `reviewSponsors` would reach
  the same deal a week later and call it `term`, and `raiseKitEndLetter` is idempotent on its id.

  ⚠ **THIS IS WHY ITEM #5 HAD TO LAND FIRST.** «A stronger rung may interrupt a weaker one» is only
  safe when a stronger rung is genuinely worth more – otherwise it would let a WORSE deal replace a
  better one, which is the same defect wearing the opposite sign. The monotonicity property guards
  both.

  ⚠ Evidence, all in `tests/offers.test.ts` beside the rules they are about: **a winter carrying a
  renewal AND another brand's letter with no brand writing twice** (round 28 #17's property asserted
  again, in the same arm); **the winter after a two-season renewal**, where Meridian Sport now writes
  over a running Baseline contract while `local`, `national` and `tour` are still turned away by it;
  and the step-up signed end to end – the incumbent pulled back to this season's contract end, at
  most one live deal on every week of the successor's term, and the `stepped` goodbye in the inbox.
  ⚠ **Two guard arms RE-AIMED with ⚠ notes, not deleted**, and the sentence one of them used to
  assert was the defect itself: «she is top 8 in the world now, **and it does not matter**». Both now
  ask the weaker direction, which is the half of the rule that survives; the stale-screen arm signs
  the stronger letter and forces the weaker one, which is where its refusal still lives.
  ⚙ **AND THE SAME MEASUREMENT RE-RUN ON THE FIX, which is what says it worked rather than compiled.**
  1,273 winters: **362 silent** where 416 were (−13%), and of the 429 winters in which a contract
  already covered the season ahead, **124 raised letters anyway** where the shipped code raised
  **zero**. The kit ladder's own reach moves with it, which is the sentence the item is really about
  – the top rungs can finally get to her:

  | rung | letters written, before → after | signed, before → after |
  | --- | ---: | ---: |
  | `premium` (Meridian Sport) | 39% → **44%** | 39% → **44%** |
  | `icon` (Aurelia) | 16% → **23%** | 16% → **23%** |

  ⚠⚠ **AND ONE CONSEQUENCE YOU SHOULD SEE BEFORE THIS MERGES, BECAUSE IT IS BIG AND IT IS YOURS TO
  ACCEPT.** Career sponsor CASH (retainer + appearance + bonus) over the same 108 careers goes from a
  median of **$1,942,862 to $4,321,847** – it more than doubles – and the largest career from $8.6M
  to $12.2M. Two causes, both intended and neither hidden: `global` now pays a retainer at all
  (item #5), and the two richest rungs are reachable years earlier because a running contract no
  longer hides them. A knock-on the same run shows: a season in the WTA 11–50 band now COSTS
  $173,210 where it cost $254,972, because those rungs pay half to three quarters of her fares. If
  that is too rich, the knob is `premium`/`icon`'s reach and not this rule – say so and it is a
  half-hour.

  ⚠ **AND ONE MORE BOUNDARY ARM, BECAUSE ROUND 28 #17-b MADE IT REACHABLE:** every kit letter now
  carries five weeks from its own arrival, so one from the window's LAST slot can be answered inside
  the season it was for. By then the running contract is no longer covering «the season ahead», so
  the step-up QUEUES behind it (`dealStartsAt`) instead of ending it – which is the right answer, and
  the invariant is asserted either way: at no week are two contracts live, and no `stepped` goodbye
  is written because nobody was stepped over.

  ⚠⚠ **AND THAT ARM CAUGHT A DEAD GUARD IN MY OWN DRAFT – THE NINTH IN FOUR DAYS, AND THE SAME SHAPE
  AS THE LAST ONE.** The supersede test was written as
  `untilWeek >= coveredSeasonStart(week) && untilWeek > contractEndWeek(week)`, and mutating the
  second clause away left the suite **GREEN**: `coveredSeasonStart` is `52k + 52` and
  `contractEndWeek` is `52k + 49`, so the first test implies the second and the trap arm was
  arithmetically identical to its control. The clause is deleted and the arithmetic written where it
  stood; the mutation that actually distinguishes the boundary (supersede anything merely LIVE this
  week) reddens the arm on the first try.

  ⚠ Mutation-verified five ways: the total bite restored (red), no bite at all (red), the goodbye
  dropped (red), the incumbent left running so two contracts overlap (red), and the queue boundary
  collapsed into an interruption (red).

- [ ] **13. «вот и можно как раз добавить cut тренера на weekly экране для прозрачности»** – **build.**
  The coach's 10%/5% share on the weekly screen, not only as a sentence on the coaches page.

- [?] **14. «травмы бывают долгими и рехаб может быть с вещами, я бы тут еще подумал – мы это вроде бы
  делали: у нас кроссовки участвуют в рехабе вроде бы. Проверь пожалуйста.»** – **answer.** ⚠ Round 29
  #20 implemented the vacation half of the 09.08 ruling and recorded the injury half as unruled.

  ⚙ **ANSWERED, and he remembers right but about a different mechanic.** Shoes DO reach injuries –
  `kitInjuryFactor` lifts the weekly threshold from 1 on new kit to `1 + 0.20` (soles) `+ 0.12`
  (frame) on dead kit, which is his «экип влияет и на травмы», shipped. ⚠ **But that is whether she
  gets hurt, not what rehab does to the kit.** His 09.08 sentence was about wear DURING recovery, and
  no such term exists: `resolveGear` knows about college and, since round 29 #20, about a holiday –
  **a week in a cast wears her shoes exactly like a week of training.**

  ⭐ And he left this half open himself – «я бы тут ещё подумал». **It is an unanswered question, not
  forgotten work.** The question, sharpened: **does rehab stop the wear clock the way a holiday now
  does?** ⚠ The argument against is his own: «рехаб может быть с вещами» – she is in them, she just
  is not playing. `[?]` his.

- [?] **15. «Закупки семьи — это расписание, а не часы… вот это интересно да, что можем сделать, чтобы
  это исправить? или уже исправили?»** – **answer, then possibly build.** Gear is REPLACED on a
  schedule while it WEARS on a clock, so a holiday changes its condition and never its price.

  ⚙ **ANSWERED: it is a real defect and it is exactly where he felt it.** Wear is derived from the
  purchase week (and now pauses on holiday); replacement is `ECONOMY.gear.shoes`'s 10–14 week cadence,
  which fires **whatever condition the old pair is in**. ⚠⚠ **So a holiday hands her fresher shoes and
  saves her nothing** – she still buys on the calendar and throws away a less worn pair. His «расписание,
  а не часы», precisely.

  **The fix that makes the two halves agree**: replace on CONDITION rather than on the calendar – buy
  when wear crosses a threshold. Then a holiday and a rehab both save money, not just kit.

  ⚠ **The cost is why this is his call and not mine**: it moves the weekly outgoings of EVERY career,
  so it is a balance change with a bench and a frozen re-pin, not a one-liner. `[?]` his.

- [ ] **16. «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых 7 это
  весьма странно. Давай подумаем как это можно сделать красиво и просто.»** – **design, then his
  ruling.** ⚠⚠ The hard constraint: **RNG input-independence is permanent law** – a fund that moves
  must not draw from the MAIN weekly stream. Propose mechanics that respect it, cheaply.

- [ ] **17. «Оставь он это так… починили?»** – **answer.** The `define` trap in round 29 #19.

- [ ] **18. «Что там с playwright? Разобрались, он теперь работает?»** – **answer.**

- [x] **19. «я не увидел наш список спонсоров для съемок и прочего, не спортивных. С ними что и на
  каких уровнях и что дают… Хочу увидеть их список и что дают.»** – **answer.** ⚠ Round 29 #7/#15
  reported the KIT ladder and never the ADVERTISING one; that is a real gap in my report, not in his
  reading.

  ⚙⚙ **THE LIST, WHOLE. IT WAS ONE ROW, AND I HAVE TO SAY THAT PLAINLY BEFORE ANYTHING ELSE.**

  | house | what it is | gate | pays | when | costs her |
  | --- | --- | --- | ---: | --- | --- |
  | Quiet Hour | a watchmaker | 18+, WTA ≤ 200, **no upper bound at all** | $20,000 once, on signature | ~13 weeks after she crosses the bar (median), 5% a week | 2 shoot weeks a year |

  That is not a summary. `ECONOMY.advertising` held exactly one house, and its own comment admitted
  the design: *«The bigger asks – campaigns 3-4, global houses 5-6, a cap of 6 a year – are RECORDED
  in the plan doc only and deliberately not built: this catalogue has one house.»* So «на каких
  уровнях» had no answer: there was one level, and everybody from #200 to #1 was on it.

  ⚙ **BUILT – THREE HOUSES, AND THE SHIPPED ONE DOES NOT MOVE BY A CENT** (`ECONOMY.advertising.houses`):

  | rung | house | trade | gate | fee | shoot weeks | share of the band's outgoings |
  | --- | --- | --- | --- | ---: | ---: | ---: |
  | `watch` | **Quiet Hour** | watches | WTA ≤ 200 | **$20,000** | 2 | 23.1% |
  | `campaign` | **Northmere Air** | an airline | WTA ≤ 50 | **$40,000** | 4 | 23.1% |
  | `house` | **Rivelle** | a cosmetics house | WTA ≤ 10 | **$55,000** | 6 | 22.9% |

  ⭐ **THE SIZING IS THE PRINCIPLE THE OLD COMMENT ALREADY REVEALED** – a rung is a SHARE of the
  outgoings of the stage it opens for, not an absolute sum – with the anchor's own realised share
  setting the rule, so no new number was invented and $20,000 justifies the other two rather than the
  other way round. ⚠ The old comment sized it off ONE career («about 31% of Alice's-stage $64,000»);
  measured across 108 careers the band's median annual outgoings are **$86,474**, so its realised
  share is 23.1%. Cross-checked the other way – as a price per week of her season – the three rungs
  come out at **$10,000 / $10,000 / $9,167** a shoot week, two independent readings inside 8%.

  ⚠⚠ **WHAT THE BIGGEST HOUSE COSTS HER IN WEEKS, since round 29 #3 made a shoot on a tournament week
  a four-way decision: SIX of her 49 in-season weeks – 12% of the playing year.** Each recovers like
  a travel week instead of a rest week (−9 condition per deficit shoot week, `ad-shoot-recovery`),
  and each is a week she must either keep clear or pay 7 condition to play through. The gates are the
  kit ladder's own professional cuts (200 / 50 / 10) read and not imported, and the shoot counts are
  the TOP of each band the plan recorded – which makes the plan's «6 shoot weeks a year» cap
  **structural** rather than a rule to remember: one deal at a time plus a one-year term means the
  most she can ever owe in a year is the biggest single house's six, and a fourth rung would have
  nothing left to ask for.

  ⭐ **AND EVERY RUNG IS ACTUALLY SEEN – measured, because a rung nobody reaches is not shipped.**
  Over 108 careers x 780 weeks: `watch` written to 40% of careers, `campaign` 45%, `house` 21%.

  ⚠ Evidence: `tests/round29p2-ad-ladder.test.ts` walks three real careers to eighteen through
  `tickWeek`, stands each in a different band (searched, not a points literal, and re-asserted), and
  checks the letter that ARRIVES is that house's and the money it PAYS reaches both wallets to the
  cent. `tests/round29p2-ladder-monotone.test.ts` holds the gate at every boundary and the catalogue's
  own ordering. ⚠ Mutation-verified: handing every standing the bottom rung again reddens the gate
  arm, and a letter that forgets which house wrote it reddens the arrival arms.

- [x] **20. «предлагать контракт за 20к долларов на год для 100 и выше ракетки мира выглядит весьма
  сомнительно, как мне кажется, поправь меня, если я ошибаюсь»** – **measure and answer.** ⭐ He has
  invited correction, so the answer must be a real comparison against what a real top-100 woman earns
  off court, not agreement.

  ⚙⚙ **YOU ARE RIGHT, AND THE RESEARCH SAYS SO MORE SHARPLY THAN YOU DID – BUT THE NUMBER IS NOT THE
  DEFECT.** The sourced comparison is `docs/research/off-court-money.md`, tagged `[S]` / `[I]` /
  `[GAP]` and read from the sources rather than from summaries of them.

  ⭐ **THE STRONGEST THING THE SOURCES SAY IS NOT ABOUT SIZE, IT IS ABOUT ORDER.** Forbes' 2025
  earnings table and the WTA's own prize-money PDF cross-check each other to the digit, and together
  they say off-court money is **not ordered by ranking at all**:

  | player | on court `[S]` | her place on the WTA prize list `[S]` | off court `[S]` |
  | --- | ---: | ---: | ---: |
  | Zheng Qinwen | $1.6M | **30th** | **$21M** |
  | Naomi Osaka | $2.5M | 14th | $10M |
  | Elena Rybakina | $8.5M | **3rd** | $4M |

  **The 30th-best earner on court was the 2nd-best off it.** That is `the-face-and-the-court.md`'s
  own claim – «a photogenic #40 with a story can out-earn a dour #8» – measured rather than asserted.

  ⚠⚠ **AND THE HONEST `[GAP]`: NO PUBLISHED NON-ENDEMIC CONTRACT VALUE EXISTS FOR ANY WTA PLAYER
  OUTSIDE ROUGHLY THE TOP 25.** Forbes stops at the sport's top ten; the WTA publishes prize money and
  not endorsements; the ITF's circuit reporting does not break it out. The figures that circulate for
  the band below («$50,000–$200,000 outside the top 100») end at an aggregator quoted by a blog, and
  read carefully they describe *equipment and apparel* – which is the ENDEMIC kit ladder we already
  model rung for rung, not a house paying cash for a face. Recorded as circulating, and not used.

  ⭐⭐ **SO THE VERDICT SPLITS, AND YOUR INSTINCT IS RIGHT TO THE RANK YOU NAMED.** Measured against
  the game's own budgets, $20,000 is:

  | band | median annual outgoings | $20,000 is | verdict |
  | --- | ---: | ---: | --- |
  | WTA 151–200 | $84,738 | 23.6% | ⭐ defensible |
  | WTA 101–150 | $80,696 | 24.8% | ⭐ defensible |
  | WTA 51–100 | $149,582 | 13.4% | thin |
  | WTA 21–50 | $240,164 | 8.3% | ⚠ thin |
  | WTA 1–10 | $348,855 | 5.7% | ⚠⚠ noise |

  **The line is crossed at almost exactly WTA #100 – the rank you named** («для 100 и выше»). The
  bands were split evenly before the numbers were read; nobody went looking for that boundary.

  ⚠ **These are the medians BEFORE items #5 and #12 landed, and they are the ones the verdict was
  reached against** – so they are the ones printed here. Those two items cut what a season costs
  (the top kit rungs now reach her and pay half to three quarters of her fares), which is why item
  #19's table quotes lower figures for the same bands. The verdict does not turn on which set is
  used: a fifth to a quarter of a season's costs at the bottom of the band on either, single digits
  at the top on either.

  ⚠ **AND THE REAL WORLD AGREES AT BOTH ENDS.** At the depth of the tour where a season is worth
  $226k–$358k `[S]` against $53–105k of touring costs `[S]`, a $20,000 endorsement is a fifth to two
  fifths of what it costs her to be there – real money. In the top ten it sits against $3M–$25M of
  actual endorsement income `[S]`.

  ⭐ **SO THE FIX IS NOT A RETUNE OF $20,000 – IT IS THE CEILING THAT WAS NEVER THERE.**
  `maxWtaRank: 200` was a FLOOR with no upper bound, and its comment defended that on the plan's §3:
  «there is deliberately no UPPER cutoff: a top-10 girl still qualifies, her cheque is simply noise,
  which is §3's claim and not a bug». That was a defensible reading of a one-row catalogue and it is
  not a defensible ladder. Item #19 above is the ladder; **$20,000 stays exactly where it is, as the
  bottom rung it was always written to be**, and it is pinned as such in
  `tests/round29p2-ladder-monotone.test.ts` so a later wave cannot «fix» #20 by moving the one number
  the research does not object to.

  ⚠ **ONE DELIBERATE DEPARTURE FROM THE SOURCES, STATED SO NOBODY «CORRECTS» IT BACK.** The real
  curve is violently convex – Gauff at $25M off court against $8M on it – and a game that copied it
  would hand a top-ten career eight figures and end its own economy. The ladder holds a **constant
  share of the stage's outgoings** instead, so every rung is equally felt and none of them solves the
  endgame. That is a design decision taken against this research, not in ignorance of it, and it is
  written down in `ECONOMY.advertising.houses` and in §5 of the research file.


---

## Part three – his rulings of 29.08 on the shop and the manager's cut

These arrived while the economy measurement was running and they change what that measurement is FOR:
it now has to answer «can the parent reach the shelf» against a **smaller** parent income, not a
larger one.

- [ ] **P1. «моторка $2.4М – давай переделаем на парусную яхту пожалуйста»** – **build.** The
  `motor boat` rung becomes a sailing yacht: label, art hook and copy. ⚠ Price, build weeks and
  upkeep unchanged unless he says otherwise – he asked to change what it IS, not what it costs.

- [ ] **P2. ⭐⭐ «для каждой стадии академии нам нужен доход… подвязать пропорционально к
  максимальному месту ребенка на турнирах… чем выше и дольше место – тем выше будет доход у каждой
  стадии»** – **build, and it is the biggest idea in this round.**

  ⚙ **Feasible, and the data already exists.** `seasonHistory` keeps a year-end rank per season and
  survives the 52-week prune – measured on his own save: `#411 → #198 → #155 → #106 → #97 → [college]
  → #385 → #173 → #98 → #106 → #42 → #23`, i.e. **4 seasons closed inside the top 100, 2 inside the
  top 50, 1 inside the top 25, 0 inside the top 10.** No schema move.

  ⚠ **Honest limit: the resolution is SEASONAL, not weekly.** Weekly ranks live in a rolling 52-week
  window and are erased, so «weeks held in the top 10» is unrecoverable; «seasons finished inside the
  top 10» is exact. ⭐ And the seasonal measure is the better one anyway – «the academy earns because
  its graduate has closed three straight years in the top 20» is a sentence the game can say.

  ⭐⭐⭐ **Why this matters beyond the feature**: it makes the parent's wealth a function of how well he
  raised her, instead of a cut of her money. The academy stops being a $12M purchase that only bills
  upkeep and becomes the business the shop is actually FOR.

- [ ] **P3. ⭐⭐⭐ «как менеджер может от этого что-то получать в свою очередь. 10-20% например…
  контракт на полную сумму ребенку приходит на почту, после подписания видим на счету уже
  родительский кат»** – ⚙ **RULING, and it settles the question I could not.**

  I put it to him that taking half of a cheque paid for her face reads as the parent living off the
  daughter; he agreed – «полностью согласен» – and gave the shape: **the letter is addressed to her
  at its full value, and after signing the parent sees a manager's commission.** Sponsor money is
  hers; the parent earns a fee for the work.

  ⚠⚠ **This REDUCES the parent's income (50% → 10-20%) and therefore pushes the shelf FURTHER away,
  not closer.** He is choosing the honest version knowingly and pairing it with P2 as the answer.
  **The running economy measurement must be re-read against this, not against the shipped 50%.**

  ⚠ Scope: this is about SPONSOR cheques. Prize money's 50/50 is his standing ruling and is untouched
  unless he says otherwise. The exact percentage inside 10-20 is still his.


- [ ] **P4. ⭐ «до академии можно запустить свой бренд одежды (мерча) – это может стать хорошим шагом
  и подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это дешевле академии»** –
  **design, then build.**

  ⭐⭐ **It lands on exactly the gap P2 and P3 opened.** The manager's commission takes money away from
  the parent (50% → 10–20%); the academy gives it back but costs **$12M**, which the reachability
  measurement may well say nobody gets to. **A merch brand is the missing FIRST rung of the parent's
  own business** – cheap enough to start mid-career, and the same shape: income that scales with how
  known she is rather than with what she banked.

  ⚠ Open, and his: what it costs to start, what it earns against what, and whether it scales on rank,
  on seasons-in-band (P2's measure), or on something else entirely – merch plausibly follows FAME
  rather than ranking, and the two are not the same thing in this game. **Nothing to build until the
  reachability numbers are in** – they say how big the hole is that this is filling.

- [x] **16. THE FUND** – ⚙ **APPROVED**: «вроде посмотрел, давай сделаем, а я пощупаю и скажу свои
  ощущения потом.» Building the seeded market path: `marketIndex(seed, week)` off a purpose-scoped
  sub-stream, value = `paid × index(now) / index(basisWeek)`. ⚠ He will judge it by feel after
  playing, so the numbers are provisional by his own framing.
---

## His 29.08 reply to the advertising ladder – I sized it in the wrong order, and the shop is the reason

> «Без всех этих пунктов не очень понятно зачем нам вообще магазин пока что.»
>
> «это смотря с кем она едет, потому что с тренером и массажистом расходов уже 200к+, а с психологом
> будет еще больше. А с учетом 50% отчислений дочери так и вообще доход практически не ощущается.»
>
> «игрок устанет смотреть на одно и то же название без смены ГОДАМИ – давай добавим в каждый тир
> разных несколько с немного похожими чеками.»
>
> «я рассчитывал увидеть реальные чеки из спорта, например федерер получал от Nike 10 миллионов…
> Может быть у нас тоже могут появиться долгосрочные контракты с реальными деньгами.»
>
> «можно как-то привязать крутые контракты либо к прогрессу, либо ко времени, проведенном в топ-100,
> 50, 10 и т.д. Чем больше лет – тем мощнее контракт.»

⚠⚠ **HE IS RIGHT THAT I DID IT BACKWARDS.** #19 and #20 sized every rung as «a share of the OUTGOINGS
of the stage it opens for» and never once asked whether the thing that money is FOR is reachable. The
sink is the shelf; the shelf's price list is the real denominator. So this is the measurement that
should have come first.

---

### ⭐⭐⭐ THE ONE SENTENCE

⚠⚠ **READ THE LAST SECTION OF THIS FILE WITH IT.** Your 29.08 ruling on the manager's commission
(«10-20% например») landed while this was being measured, and it **changes the answer**: at the
shipped share the median career reaches the house with the garden and the best of 72 reaches the big
yacht; **at a 10% commission the median drops a rung and the big yacht becomes reachable by nobody.**
Everything below is the SHIPPED share; the ruling's arm is measured separately at the end.

**Yes – a career can buy the shop, and the shop is not the problem. But it is bought with PRIZE
MONEY, never with advertising: the top advertising rung pays $55,000 a year against a yacht that
costs $1,200,000 a year to keep, which is 4.6% of the crew's wages.** The median career stops at
**the house with the garden ($520,000)**, reached at age 20; the p90 career reaches **the plane
($18,000,000)**; the best of 72 reaches **the big yacht ($28,000,000)**; and **the long-range plane
($38,000,000 with $58,462 a week of upkeep) is reached by NOBODY** – 0 of 72, and only 2 of 72 could
even clear its sticker price without a year of crew behind it. ⚠ **And the two dearest rungs are
never DELIVERED to anybody at all** – their build times run past the end of the career that could pay
for them, which is a separate defect and it is written up below.

⚠ **So «зачем нам магазин» has an answer and it is not the one I expected.** The shelf works. What
does not work is the SENTENCE THAT JOINS IT TO THE ADVERTISING LADDER – your own «как раз будет куда
рекламное тратить». Measured over a whole career the entire advertising post is worth **0.67% of a
career's money** at the median and **1.92%** at p90. It cannot buy anything on the elite shelf and no
defensible retune of it can: to make the top rung pay one year of the yacht's crew it would have to
be **21.8 times** bigger ($1,200,000 / $55,000), i.e. **453%** of a top-10 season's measured outgoings
($1,200,000 / $265,024) instead of the 20.8% it is.

---

### The instrument, the sample and the seeds

`tools/sponsor-ladder-reach.ts` – **the existing bench, extended with a reporting block, not a fourth
harness.** It already owned the 780-week horizon and the outgoings-by-rank reading; the career loop
is still `openCareer` / `stepCareerWeek` from `tools/econ-bench.ts`, so no second entry policy exists
anywhere in this measurement.

* **72 careers x 780 weeks** (age 14 → 29): 9 presets x 2 policies x 4 seeds, seeds
  `bench-{working|middle|wealthy}-{0..3}`. Run:
  `npx vite-node tools/sponsor-ladder-reach.ts -- --weeks 780 --seeds 4`.
* ⭐ **The run reproduces the shipped figure exactly**, which is what says the arm is real: kit cash
  median **$4,321,847**, the same number #12 recorded after its fix. Nothing drifted.
* ⚠ **NO ENGINE FILE WAS TOUCHED.** `git diff -- src/` is empty; the frozen MAIN capture is
  **verified unmoved** (41550 / `e6b0c709`, `tests/condition.test.ts` 51/51 green, exit read from the
  file). `check:tools` (6 errors) and `tools:registry:check` are red at baseline and **byte-identical
  red with my change reverted** – confirmed by restoring the committed file from `git show` and
  re-running, not assumed.

---

### 1. What a career actually banks, over its whole life

Read off `world.careerTotals` (accumulated at each ledger write, **never pruned** – `financeWeeks`
keeps sixty weeks and `events` four hundred rows, so a horizon-end read of either would have reported
the last season and called it a career).

| | median | p90 | best of 72 |
| --- | ---: | ---: | ---: |
| gross into the household (incl. her cut) | **$1,696,541** | $45,548,567 | $65,350,002 |
| ...of which HER cut left for her own account | $343,989 | $14,230,700 | $22,366,527 |
| what the FAMILY actually banked | $1,352,552 | $31,467,690 | $42,983,475 |
| what the family spent | $817,946 | $3,206,225 | $4,122,407 |
| **the most the wallet ever held AT ONCE** | **$552,837** | **$28,733,412** | **$39,596,000** |

⚠⚠ **THE ECONOMY IS BIMODAL AND THAT IS THE WHOLE FINDING.** Split the 72 on one question – did she
ever finish a season inside the world's top ten?

| | careers | peak wallet, median | the extreme |
| --- | ---: | ---: | ---: |
| ever inside WTA #10 | **15 (21%)** | **$28,733,412** | **minimum $14,210,192** – every one of them can buy the yacht |
| never inside WTA #10 | 57 (79%) | **$166,330** | max $19,793,158 (one outlier) |

**There is no middle.** The peak-wallet deciles are $25,000 · $91,499 · **$552,837** · $15,092,002 ·
$28,733,412 – the p50-to-p75 step is a factor of **27**. A career either reaches the top ten and the
whole shelf opens at once, or it does not and the shelf ends at a house.

---

### 2. The shelf against that money – rung by rung

Two columns, and **the second is the honest one**: «afforded» is the wallet clearing the sticker in
some week; «+1yr upkeep» adds one year of the rung's own upkeep on top, because a $12M yacht is also
$23,077 **a week** and a family that clears the hull and not the crew has reached a bill, not a rung.
Both are generous – neither leaves a penny for the tennis, and the bench never buys anything, so the
wallet only ever goes up. **These are ceilings.**

| rung | price | upkeep/wk | afforded | +1yr upkeep | median age afforded |
| --- | ---: | ---: | ---: | ---: | --- |
| the sensible estate | $60,000 | – | 78% | 78% | 18.6 |
| the good saloon | $110,000 | – | 72% | 72% | 18.6 |
| the one from the poster | $190,000 | – | 58% | 58% | 19.5 |
| a place of their own | $240,000 | – | 57% | 57% | 19.6 |
| the unreasonable one | $300,000 | – | 56% | 56% | 19.8 |
| the house with the garden | $520,000 | – | 50% | 50% | 20.0 |
| the launch | $900,000 | $1,038 | 49% | 49% | 20.2 |
| the academy – land | $2,000,000 | – | 46% | 46% | 21.0 |
| the motor boat | $2,400,000 | $2,769 | 46% | 46% | 21.3 |
| the academy – courts / staff | $3,000,000 | – | 46% | 46% | 21.6 |
| the academy – clubhouse | $4,000,000 | – | 46% | 46% | 22.1 |
| **the yacht** | $12,000,000 | $23,077 | 29% | **26%** | 25.1 |
| **the plane** | $18,000,000 | $27,692 | 15% | **14%** | 24.2 |
| **the big yacht** | $28,000,000 | $53,846 | 11% | **4%** | 28.0 |
| **the long-range plane** | $38,000,000 | $58,462 | 3% | **0%** | 28.6 |

**How far up the shelf, with the upkeep carried:**

* **median career → the house with the garden, $520,000**
* **p90 career → the plane, $18,000,000**
* **best of 72 → the big yacht, $28,000,000**
* reached nothing at all: **0 of 72**

⚠ **The academy row above is per-stage and `requiresId` chains the four**, so the honest reading is
cumulative:

| through | cumulative spend | reachable by |
| --- | ---: | ---: |
| the land | $2,000,000 | 33 of 72 (46%) |
| + the courts | $5,000,000 | 33 of 72 (46%) |
| + the clubhouse | $9,000,000 | 27 of 72 (38%) |
| **+ the staff – the whole academy** | **$12,000,000** | **21 of 72 (29%)** |

⭐ **The academy is the most reachable thing above a million on the shelf**, and the reason is
structural: it is the only elite family with **no upkeep at all** and **no build wait**. A career that
can reach $12M can finish it.

#### ⚠⚠ AND THE DEFECT THIS MEASUREMENT FOUND – REPORTED, NOT FIXED. THE TOP TWO RUNGS ARE MONEY SPENT ON A THING THAT NEVER EXISTS.

`sellableAsset` refuses while a rung is building and the clock starts at the ORDER, so a rung whose
build time runs past the end of the career is $28,000,000 that leaves the wallet, cannot be sold back,
and never arrives. Measured against each career's own end week:

| rung | build | could pay + carry | **and it actually ARRIVED** |
| --- | ---: | ---: | ---: |
| the launch | 52w | 35 of 72 | 34 of 72 |
| the motor boat | 78w | 33 of 72 | 33 of 72 |
| the plane | 104w | 10 of 72 | 8 of 72 |
| **the yacht** | 156w | 19 of 72 | **11 of 72** – eight pay and never see it |
| **the big yacht** | 208w | 3 of 72 | **0 of 72** |
| **the long-range plane** | 156w | 0 of 72 | **0 of 72** |

**`yacht-big` and `plane-long` are delivered to nobody**, and `plane-long` is not bought by anybody
either (0 with a year of crew carried, 2 on the sticker alone). That is precisely the failure
`tools/brand-gate-bench.ts` was written for the first time it happened: a rung that is theoretically
open and empirically never seen. **The spec's own acceptance for this slice – «a career orders a
yacht, WAITS THREE YEARS» – holds for the yacht (11 of 19 see it) and cannot hold for the two above
it, because 208 weeks after the week the wallet first clears them is past the end of the game.**

**Your call, and I am not building any of it without a ruling:**
1. leave them as the aspiration at the top of a shelf you are meant to look at and never own;
2. cut their build times so they can arrive (the yacht's 156 weeks is your own «яхты строят несколько
   лет» and should stay; 208 is the one that cannot fit);
3. cut their prices;
4. leave both and accept they are for a career that goes further than these 72 did – but then the
   money-that-buys-nothing case above should at least refuse or warn at the counter.

---

### 3. Where the money actually goes – and your correction is confirmed to the dollar

As a share of the GROSS money of each stage (everything that came in, including her cut):

| stage | gross in | coach | court | masseur | physio | travel | entry | gear | vacation | **her cut** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 14–18 the junior sink | $13.3M | 12.2% | 12.7% | 0.0% | 4.0% | **37.4%** | 8.7% | 4.0% | 4.8% | – |
| 18–23 the climb | $331.5M | 2.1% | 0.5% | 0.0% | 0.2% | 4.5% | 1.0% | 0.1% | 0.6% | **20.6%** |
| 23–29 the cap years | $680.6M | 2.2% | 0.3% | 0.0% | 0.1% | 3.0% | 0.7% | 0.0% | 0.5% | **42.4%** |

⭐⭐ **YOUR «200к+» IS RIGHT AND THE $64,000 THE CODE WAS SIZED AGAINST IS A JUNIOR NUMBER.** Annual
outgoings, per career, per stage:

| stage | median | p75 | p90 | worst |
| --- | ---: | ---: | ---: | ---: |
| 14–18 the junior sink | $31,592 | $54,348 | $83,597 | $96,079 |
| 18–23 the climb | $60,196 | $144,767 | $205,733 | $347,203 |
| **23–29 the cap years** | $69,537 | **$198,449** | **$296,801** | $381,428 |

**$198,449 at p75 – and that is WITHOUT the masseur** (see the null below). The dearest masseur rung
is $525/wk = **$27,300 a year**, which puts your career at **$225,749**. That is «200к+», measured.
The $64,000 that `ECONOMY.advertising`'s original comment sized $20,000 against is the median of the
CLIMB stage, i.e. a nineteen-year-old's budget, and the game has moved a long way past it.

⚠⚠ **BUT THE TWO HALVES OF YOUR SENTENCE ARE NOT THE SAME SIZE, AND THE MEASUREMENT SAYS SO
SHARPLY.** «с тренером и массажистом расходов уже 200к+, а с учетом 50% отчислений дочери так и
вообще доход практически не ощущается» reads as two costs. At your stage they are not comparable:

* the coach is **2.2%** of gross, the court **0.3%**, physio **0.1%**, travel **3.0%** – the WHOLE
  tennis bill is about **7%** of the money coming in;
* **her cut is 42.4%** – six times the entire cost of running the career.

**What makes the income stop being felt at the top is the 50% split, not the staff.** The staff is
what makes it felt in the JUNIOR years, where coach + court is **24.9%** of everything coming in and
travel is another **37.4%**. The staff bill does not grow into the money – the money grows past the
staff bill. That is a real finding about the shape
of the ramp and it is yours to rule on – I am not proposing to move `kidShare`.

---

### 4. The four things you asked for, with numbers

#### ⭐ (a) VARIETY – several houses a rung, similar cheques. Cheapest of the four, and it needs no balance decision.

**Each rung's houses AVERAGE to its shipped anchor, to the cent**, so the sizing rule of #19 is
untouched and there is nothing here for you to accept or reject on balance grounds – only names.

| rung | gate | house | trade | cheque |
| --- | --- | --- | --- | ---: |
| `watch` | WTA ≤ 200 | **Quiet Hour** (shipped, unchanged) | watches | $20,000 |
| | | Marchfield Bank | a bank | $18,000 |
| | | Coldbrook Spring | bottled water | $19,500 |
| | | Vantage Optics | eyewear | $22,500 |
| | | | **mean** | **$20,000** |
| `campaign` | WTA ≤ 50 | **Northmere Air** (shipped, unchanged) | an airline | $40,000 |
| | | Verain | a fashion house | $44,000 |
| | | Casala Motors | cars | $36,000 |
| | | Lindhalt & Roe | a private bank | $40,000 |
| | | | **mean** | **$40,000** |
| `house` | WTA ≤ 10 | **Rivelle** (shipped, unchanged) | perfume | $55,000 |
| | | Maison Aubry | couture | $61,000 |
| | | Halbrand Jewellers | jewellery | $52,000 |
| | | Pacific Halcyon | an airline group | $52,000 |
| | | | **mean** | **$55,000** |

**Shoot weeks stay per rung (2 / 4 / 6) and must**, because they are the structural annual cap: one
deal at a time x the biggest house's six IS «never more than 6 shoot weeks a year». Varying them per
house would turn a structural guarantee into a rule somebody has to remember.

**Cost:** the draw picking a house inside a rung is new randomness, so it goes through a
purpose-scoped sub-stream (`rngFromSeed` on a `seed:adhouse:week` key) and **never MAIN** – the frozen
capture cannot see it. `AdOfferTerms` gains an optional `houseId`, frozen at arrival; absent means
«the rung's first house», which is exactly what every letter already written means, so it is the
`WorldEvent.entryRef` widening and **not a schema bump**. Repeat-avoidance («без смены ГОДАМИ») is
free: exclude the house that wrote last time by reading `world.offers`, which is not pruned for kit
and ad letters.

#### ⭐ (b) LONG-TERM CONTRACTS – multi-year, and the fee becomes ANNUAL

Every rung is `termWeeks: 52` today. Proposed:

| rung | term now | term proposed | fee | paid |
| --- | ---: | ---: | ---: | --- |
| `watch` | 1 year | **1 year** (unchanged – the entry deal should stay short) | $20,000 | on signature |
| `campaign` | 1 year | **2 years** | $40,000 **a year** | signature + each anniversary |
| `house` | 1 year | **3 years** | $55,000 **a year** | signature + each anniversary |

**Annual and not a lump**, for two reasons that agree: it is how the real paper works (§4 of
`docs/research/off-court-money.md`: «a base fee … upon execution»), and it is already this codebase's
own shape – `payRetainer` pays the kit ladder quarterly. **Shoot weeks become per YEAR, not per
term**, or a 3-year deal asking six shoots in total would be cheaper per season than the 1-year deal
it replaced and the ladder would invert.

⚠⚠ **AND MULTI-YEAR NEEDS #12's ESCAPE HATCH OR IT REBUILDS #12's DEFECT.** `adSpokenFor` is «one deal
at a time». A 2-year `campaign` deal signed at #45 would hide the `house` rung for two years if she
reaches #8 in year two – which is exactly the closed door #12 just opened on the kit side. So a
**strictly stronger house must be allowed to write over a running ad deal**, with the incumbent pulled
back to the end of its current contract YEAR. That is the real build cost of this item and it is not
small; the kit-side version took a wave.

#### ⭐⭐ (c) TENURE – and the world already records it, so this is NOT a schema question

⭐⭐ **CHECKED, AND THE ANSWER IS THAT IT COSTS NOTHING.** `seasonHistory[].byTrack.wta.endRank`
(schema v46) banks her professional place at **every season's wrap**, appended once a year at
`wrapSeason`, capped at 30 seasons (a 15-season career never reaches it) and **never pruned** by the
60-week finance window or the 400-row event cap. «Years spent inside the top 100 / 50 / 10» is a
**fold over an existing field**. **SAVE_SCHEMA_VERSION stays at 65.** No migration, no golden fixture.

⚠ The one limit, stated: it is **season** granularity, not weeks. «She was in the top ten for 26
weeks» is not recoverable and would be a real schema move – a per-band week counter on the world, a
migration, a fixture, a version bump, and a forward-only back-fill problem because `pruneResults`
deleted the history years ago. **Your own words are seasons anyway** («чем больше ЛЕТ»), so I propose
we never pay for weeks.

**Measured over the 72 – the tenure ladder has real fuel:**

| band | careers that ever ended a season there | ≥2 seasons | ≥4 seasons | most any career held |
| --- | ---: | ---: | ---: | ---: |
| WTA #200 | 37 (51%) | 36 (50%) | 36 (50%) | **13** |
| WTA #100 | 35 (49%) | 35 (49%) | 34 (47%) | 13 |
| WTA #50 | 35 (49%) | 33 (46%) | 32 (44%) | 12 |
| **WTA #10** | **15 (21%)** | 13 (18%) | **7 (10%)** | **10** |

⭐ **And it is steep exactly where it should be.** In the top 200 and top 50, a career that gets there
stays 9–11 seasons, so the bonus fills almost at once. **In the top ten the seasons held are
1,1,2,2,2,2,3,3,4,4,5,5,7,8,10** – fewer than half of the fifteen who get there ever reach four. The
big contract is genuinely earned at the top and nearly free at the bottom, which is what you asked
for.

**The proposal, with the number:** the cheque is multiplied by `1 + 15% x min(seasons already ended
inside THIS RUNG'S OWN BAND, 4)` – **+15% a season, capped at +60%.**

| rung | base | at the cap (4 seasons in band) | this run's median band outgoings | share, base → cap |
| --- | ---: | ---: | ---: | ---: |
| `watch` | $20,000 | **$32,000** | $86,526 | 23.1% → **37.0%** |
| `campaign` | $40,000 | **$64,000** | $175,207 | 22.8% → **36.5%** |
| `house` | $55,000 | **$88,000** | $265,024 | 20.8% → **33.2%** |

All three stay under 40% of a season's outgoings at the cap, so «felt, not budget-solving» survives.
⚠ The denominators are this run's own (72 careers) and differ by 1–10% from #19's 108-career figures
($86,474 / $173,210 / $240,343) – sampling, not drift, and the base shares are 23.1% / 22.8% / 20.8%
against 23.1% / 23.1% / 22.9%. The verdict does not turn on which set is used.
⚠ **One decision is yours**: seasons in THIS rung's band (proposed – the deeper the band the harder
to accumulate, which is the honest reading of «в топ-100, 50, 10») or seasons anywhere professional
(easier, and the top rung would arrive already maxed).

#### (d) REAL MONEY – the sourced comparison

⭐⭐ **RESEARCHED PROPERLY, AND THE SOURCES CORRECT YOUR INSTINCT ON ONE POINT.** Same tagging as
`docs/research/off-court-money.md`: `[S]` read in the cited source, `[I]` computed here with the
arithmetic shown, `[WEAK]` circulates but the trail ends at an aggregator, `[GAP]` looked for and not
found.

**Your Federer number is right and it is confirmed.** Nike paid him a reported **~$10M a year on a
ten-year deal, 2008–2018** `[S]` (SportsPro, 2 Jul 2018; the term from his agent, SI 9 Oct 2025) –
$100M in all `[I]`. ⭐ **And the deal he left it for is the better template for what you are asking
about**: **Uniqlo, $300,000,000 guaranteed over TEN YEARS = $30M a year** `[I]` from `[S]`
(ESPN/Rovell, 2 Jul 2018), **and he collects it even if he never plays again** `[S]`. That is a
non-endemic house, a real cheque and a real term, all three at once.

**The women's numbers, with terms – every one of these is a real reported contract:**

| player | brand | endemic? | value | term | tag |
| --- | --- | --- | ---: | ---: | --- |
| Sharapova | Nike | kit | **up to $8.75M/yr** ($70M) | **8 years** (2010) | `[S]` total+term, `[I]` per-yr |
| Osaka | Nike | kit | **$10M/yr** | reported through 2025 | `[S]` value, `[WEAK]` end date |
| Osaka | Adidas | kit | **$8.5M/yr** – «the largest in the history of women's tennis» | – | `[S]` (The Times via CBS) |
| Venus Williams | Reebok | kit | **$8M/yr** ($40M) | **5 years** (2000) | `[S]`+`[I]` |
| Serena Williams | Nike | kit | **up to $6.875M/yr** ($55M) | **5 years + a 3-year performance option** | `[S]`+`[I]` |
| **Raducanu** | **Vodafone** | **non-endemic** | **~$4M/yr** (£3M) | signed 2021, **not renewed 2025** | `[S]` (Mail on Sunday via SportsPro) |
| **Raducanu** | **Uniqlo** | **non-endemic** | **$3.5M/yr** + performance bonuses | «long-term» | `[S]`, Feb 2026, unconfirmed by Uniqlo |
| **Raducanu** | **Dior** | **non-endemic** | **$2M/yr** | – | `[S]` (Daily Mail via SI) |
| **Raducanu** | **Tiffany** | **non-endemic** | **$2M/yr** – ⚠ conflicting `[S]`: $0.75M on a **1-year** deal | 1 year | two `[S]` sources disagree |
| **Raducanu** | **Porsche** | **non-endemic** | **$1.5M/yr** | ended by 2025 | `[S]` (GlobalData) |
| Raducanu | Nike | kit | **$100,000/yr**, signed at **15** | ~8 years | `[S]`, ⚠ conflicts with GlobalData's $1.5M/yr |
| Sharapova | Porsche / Land Rover | non-endemic | `[GAP]` – never disclosed | **3 years each** | term `[S]` |
| Swiatek | Oshee | non-endemic | `[GAP]` | **2 years + option** | term `[S]` |
| Zheng Qinwen | 10 brands | mixed | **$5.5M/yr in aggregate** `[I]` from ¥39.44M `[S]` | «from 2–3 years» `[S]` | per-deal `[GAP]` |

⭐⭐⭐ **AND THE FINDING THAT SHOULD CHANGE THE DESIGN, BECAUSE IT SAYS OUR TWO ASKS ARE FIGHTING EACH
OTHER.** In every figure that could be sourced, **the long deals are the KIT deals and the short deals
are the non-endemic ones**:

* **kit / apparel: 8–10 years, and signed YOUNG** – Sharapova 8, Serena 5+3, Venus 5, Alcaraz 10,
  Federer 10, Djokovic 5 then a 4-year extension. **Gauff signed New Balance at 14** `[S]`;
  **Raducanu signed Nike at 15 for $100,000 a year** `[S]`.
* **non-endemic: 1–3 years, renewed or dropped** – Sharapova/Porsche 3, Sharapova/Land Rover 3,
  Swiatek/Oshee 2+option, Raducanu/Tiffany 1, and Raducanu's Vodafone and Porsche deals **both
  lapsed** within four years. Federer/Uniqlo at ten years is the outlier ESPN itself called
  «unprecedented» `[S]`.

⚠⚠ **So «долгосрочные контракты» belongs on the KIT ladder and «несколько разных названий» belongs on
the advertising one, and the sources say each of them separately.** A long non-endemic deal is exactly
what would make you stare at one name for years – the complaint you opened with. **Churn IS the
variety.** Revised proposal, replacing (b) above where they disagree:

| ladder | term | why |
| --- | --- | --- |
| **advertising** | **1–2 years, several houses a rung, a house may not write twice running** | the sourced shape of a real non-endemic deal, and it is what puts a new name in the inbox |
| **kit** `premium` / `icon` | **6 seasons / 8 seasons** (from 3 / 4 today) | Sharapova's 8, Serena's 5+3, Venus's 5 – the long deal is the apparel deal |
| ⭐ **a new JUNIOR kit rung, signed at 14–16** | **8 seasons**, a small cheque | Gauff at 14 and Raducanu at 15 are both `[S]`, and it is a genuine decision for the parent: take $100,000 a year now and be locked out of the big money for eight years, or wait |

⭐ **THE CAPSTONE – if you want one deal that is «реальные чеки», here is one with a number.**
Everything above keeps the constant-share rule. This deliberately breaks it, once, at the very top:

| | |
| --- | --- |
| **gate** | **4 seasons ended inside WTA #10** – reached by **7 of 72 careers (10%)**, and by 47% of the fifteen who ever get there |
| **cheque** | **$500,000 a year** |
| **term** | **8 years**, the Sharapova/Nike shape `[S]` – **$4,000,000 in all** |
| **shoots** | 6 a year, the top rung's existing allowance – it replaces the `house` deal, it does not stack |
| **share of a top-10 season's outgoings** | **189%** – it is meant to feel like winning, which is the whole point of a capstone |
| **against the shelf** | pays **42%** of the yacht's annual crew, **a third** of the whole academy |
| **what it does to the doubling** | **+$4M to the top 10% of careers and ZERO to everybody else** – those careers already bank $28–45M, so it is +9–14% for them and no change at all to the median |

⚠ **The scale gap is stated rather than closed, and it is enormous.** A real top-ten WTA woman earns
**$3M–$25M a year off court** `[S]`; our top rung is $55,000 and this capstone is $500,000. Copying the
real curve would hand a top-ten career eight figures and end the economy – the decision
`docs/research/off-court-money.md` §5 already recorded and this does not overturn. **The capstone is
one rung, once, for a tenth of careers.**

⭐ **And Raducanu is the case that says the design is right about ORDER.** She won one major as a
qualifier and assembled a **$9.03M-a-year** non-endemic portfolio in 2022, rising to **$14M in 2024**
`[S]`, while ranked nowhere near the top ten. That is the plan's own «a photogenic #40 with a story
can out-earn a dour #8» with a name and a number on it.

⚠ **`[GAP]`, restated and now doubly confirmed: there is still no published non-endemic contract value
for any WTA player outside roughly the top 25.** The one figure I chased for a lower-ranked player –
«Eala, $10M» – turned out to be a journalist's forward projection, not a contract; and Rappler has
had to publish a fact-check debunking an invented $45M Eala/Wilson deal. **Invented tennis
endorsement figures circulate widely enough to need debunking**, which is the reason for the tagging.

---

### ⚠⚠ WHAT ALL OF THIS DOES TO THE DOUBLING ALREADY FLAGGED THIS WAVE

#12 flagged that career sponsor CASH went from a median of **$1,942,862 to $4,321,847**. **Saying
nothing about a second increase stacked on top of that would be dishonest, so here it is, measured on
the same 72 careers:**

| arm | lifetime advertising cash, median | p90 | as a share of lifetime gross |
| --- | ---: | ---: | ---: |
| **shipped** (1-year terms, flat fee) | $120,000 | $440,000 | 0.67% / 1.92% |
| **+ tenure at 15%/season, cap 4** | **$162,000** | $621,500 | 0.95% / 2.66% |
| + tenure at 25%/season, cap 4 | $190,000 | $742,500 | 1.14% / 3.16% |
| + tenure at 15%/season, cap 8 | $165,000 | $671,000 | 1.03% / 2.79% |

⭐ **The proposed arm multiplies total advertising money by 1.405 and adds $42,000 to the median
career – which is 1.7% of the size of the change #12 already asked you to accept.** It moves a
career's total money by **+0.28 percentage points**. Variety (a) moves the expectation by **zero, by
construction**. Long terms (b) move the money by **zero** – the fee becomes annual, so a 3-year deal
pays what three 1-year deals paid; what changes is that the post is quiet in between and the money is
predictable.

⚠ **The one that WOULD stack is «real money».** If the top rung went to $250,000 a year to chase the
real curve, lifetime advertising cash at p90 goes from $440,000 to roughly $2M and the ladder stops
being a fifth of a season's budget and starts being the season's budget. **That is a decision, not a
tuning, and it is yours** – see the sourced section.

---

### ⚠ THE NULLS, NAMED HONESTLY – what these instruments COULD NOT have shown

1. ⚠⚠ **The masseur column reads 0.0% in every stage and that is the BENCH, not the game.**
   `tools/econ-bench.ts`'s career loop never hires one – there is no `hireMasseur` call in it – so the
   `staff` category is structurally empty and this instrument **could not have** shown a masseur cost
   however large it was. Every outgoings figure above is therefore a FLOOR, understated by up to
   $27,300 a year against a career that keeps the dearest rung. **This is exactly the line you named,
   and it is the one line the bench is blind to.** The psychologist is not shipped at all
   (`docs/plans/` only), so it is absent for the different and correct reason.
2. **The shop column reads 0.0% because the bench never buys.** Peak wallet therefore equals end
   wallet for most careers and the reachability figures are ceilings: a family that really bought the
   car at 19 has less at 25. A shopping arm would only make the table WORSE, never better.
3. **`byTrack` is optional (v46).** A season banked before it existed has no professional rank, and
   the fold skips those rows rather than counting them as unranked. On these 72 careers – all created
   at the current version – no row was skipped, so the tenure table is complete here and would be
   incomplete against a genuinely old save.
4. **72 careers, not 108.** #19 and #20 used `--seeds 6`; this is `--seeds 4`, for run time. The
   cross-check that says the arm is nonetheless the same one: kit cash median came back at
   **$4,321,847**, #12's own post-fix figure, unchanged.

---

## ⭐⭐⭐ HIS 29.08 RULINGS ON WHOSE MONEY IT IS – measured, and one of them changes the answer above

> «как менеджер может от этого что-то получать в свою очередь. **10-20% например**… контракт на полную
> сумму ребенку приходит на почту, после подписания видим на счету уже родительский кат.»
>
> «для каждой стадии академии нам нужен доход… подвязать пропорционально к максимальному месту ребенка
> на турнирах… **чем выше и дольше место – тем выше будет доход** у каждой стадии»

### ⚠⚠ FIRST, A CORRECTION TO THE FRAMING – the parent does not keep 50% of sponsor money today, he keeps more

I was told the drop is «from 50% to 10–20%». **Checked against the code rather than accepted.** Every
sponsor cash line – the kit retainer, the appearance fee, the result bonus and the advertising fee –
goes through **one** function, `bankSponsorCheque`, and it splits by **her prize ramp**
(`kidPrizeShareBps`): **0% before her eighteenth**, 10% at 18, +5 points a birthday, **50% only from
her twenty-sixth**. So what the parent keeps today is:

| her age | parent keeps today | parent keeps at 10% | parent keeps at 20% | the drop |
| --- | ---: | ---: | ---: | ---: |
| under 18 | **100%** | 10% | 20% | **10.0x / 5.0x** |
| 18 | 90% | 10% | 20% | 9.0x / 4.5x |
| 22 | 70% | 10% | 20% | 7.0x / 3.5x |
| 26+ | 50% | 10% | 20% | **5.0x / 2.5x** |

**«2.5–5x» is the FLOOR of the effect, not the effect** – it is the drop in the last years only.
Averaged over a career the cut is deeper, because the early cheques are the ones the parent currently
keeps almost all of.

⭐ **One real cushion, and it is not affected by the ruling at all**: the KIT ALLOWANCE and the TRAVEL
SHARE are cost covers, not cash – they reduce a bill rather than credit the wallet, so they never
touch `bankSponsorCheque` and the family keeps 100% of both under any commission. At `icon` that is
$12,000 of kit and **75% of her fares**, and on this run a top career’s season carries about $123,000 of fares, so the cover is worth ~$92,000 + $12,000 of kit against a $150,000 retainer of which a 10% manager keeps $15,000. **Under the ruling the cost covers become the larger half of an icon deal by six to one.**

### ⚠⚠ THE MEASUREMENT, RE-RUN UNDER THE RULING – three arms, same 72 careers, same seeds

`npx vite-node tools/sponsor-ladder-reach.ts -- --weeks 780 --seeds 4 [--commission 10|20]`. The
commission arm **takes the money out of the wallet the week the cheque lands**, so the career that
follows is genuinely poorer – its reserve is smaller and `reserveFor` gates coach rungs and entries
off exactly that. It is a real B arm, not a subtraction at the end. ⚠ It writes cents and taps **no
draw**, so it cannot move the frozen MAIN capture; it does make the arms diverge downstream in MAIN
(a career that enters fewer events rolls different dice), which is why 10% and 20% are not a paired
comparison with each other. **Verified the arm is live**: the shipped run reports the parent keeping
**63.1%** of gross sponsor money, the 10% arm **10.0%** and the 20% arm **20.0%**.

**What the parent's wallet does:**

| peak wallet | shipped | at 10% | at 20% |
| --- | ---: | ---: | ---: |
| median | $552,837 | **$422,871** (−23.5%) | $446,355 (−19.3%) |
| p75 | $15,092,002 | **$10,109,777** (−33.0%) | $11,044,569 (−26.8%) |
| p90 | $28,733,412 | **$20,277,728** (−29.4%) | $20,965,399 (−27.0%) |
| best of 72 | $39,596,000 | **$28,461,483** (−28.1%) | $30,426,545 (−23.2%) |

⚠ **10% and 20% are inside each other's noise at n=72 and 20% is not consistently better than 10%** –
that is trajectory divergence, not a finding. **What is far outside the noise is "a commission at
all" against "today": every percentile loses a fifth to a third of the wallet.**

⭐ **And nobody goes bankrupt from it**: 22 of 72 careers ended before the horizon on all three arms,
unchanged. The ruling makes the parent poorer, not ruined.

### ⭐⭐⭐ SO THE ONE SENTENCE, RESTATED UNDER THE RULING

**It was reachable at the shipped share, and the ruling takes the top of the shelf away.**

| how far up the shelf (price + a year of upkeep) | shipped | at 10% | at 20% |
| --- | --- | --- | --- |
| **median career** | the house with the garden **$520,000** | **the unreasonable one $300,000** | the unreasonable one $300,000 |
| **p90 career** | the plane **$18,000,000** | the plane $18,000,000 | the plane $18,000,000 |
| **the best of 72** | **the big yacht $28,000,000** | **the plane $18,000,000** | the plane $18,000,000 |

| rung, reached with a year of upkeep | shipped | at 10% | at 20% |
| --- | ---: | ---: | ---: |
| the yacht $12M | 19 of 72 | **11** | 15 |
| the plane $18M | 10 of 72 | 8 | 8 |
| **the big yacht $28M** | 3 of 72 | **0** | **0** |
| the long-range plane $38M | 0 of 72 | 0 | 0 |
| **the WHOLE academy $12M** | **21 of 72 (29%)** | **14 (19%)** | 15 (21%) |

⚠⚠ **The big yacht joins the long-range plane as content nobody reaches**, and the median career drops
a rung. **This is the finding, unsoftened: the ruling is right about whose money it is, and it makes
the shop harder to reach, not easier.**

### ⚠⚠ AND THE COUNTERWEIGHT CANNOT REACH THE PEOPLE THE COMMISSION HITS

The academy is the intended offset. **Measured, it cannot be one for most careers:**

* the commission takes money from **36 of 72 careers** – everybody who ever signs a brand;
* the whole academy is inside the peak wallet of **14 of 72** under a 10% commission;
* **so 22 careers lose sponsor money and gain nothing**, because a $12,000,000 business is not a
  consolation for somebody whose whole career banks $1.7M.

⭐ **That does not make the academy a bad mechanic – it makes it a mechanic for a different job.** It
gives the top career something to do with its money and ties the parent's reward to how well he
raised her, which is exactly what «чем выше и дольше место – тем выше будет доход» is for. It is not
a replacement for the sponsor money the commission gives up, and pricing it as if it were would over-
pay the fourteen who need it least. **If the median career is meant to be made whole, the knob is the
commission RATE or a floor under it – not the academy.**

### ⭐⭐ THE ACADEMY AS A BUSINESS – the table, sized to the gap

**The reputation multiplier**, off `seasonHistory[].byTrack.wta.endRank` – ⭐ **no schema move, no
migration, no new persisted state**: which stages are owned is already in `world.assets` and the ranks
are already banked. **Best band per season, counted once, capped at 4.0:**

| a season she ended inside | adds |
| --- | ---: |
| WTA #100 | +0.10 |
| WTA #50 | +0.20 |
| WTA #25 | +0.35 |
| WTA #10 | **+0.60** |

**On your own save** – `#411 → #198 → #155 → #106 → #97 → [college] → #385 → #173 → #98 → #106 → #42
→ #23` – that is two seasons inside #100, one inside #50 and one inside #25: **reputation 1.75.**
Across the 72 bench careers the multiplier is 1.00 at the median, 2.90 at p75 and **4.00 at p90**;
nine careers hit the cap. ⚠ Of the fourteen who can actually BUILD it, **every one is between 2.90 and
4.00** – the academy is only ever owned by a career that earned a high multiplier, which is the
mechanic working rather than a coincidence.

**The income, per stage, per week – sized so that the academy exactly repays what a 10% commission
takes from the careers that can build it:**

| stage | at reputation 1.0 | at 1.75 (your save) | at 4.0 (the cap) | a year, at the cap |
| --- | ---: | ---: | ---: | ---: |
| the land | **$0** – it is a field | $0 | $0 | $0 |
| the courts | $750/wk | $1,313/wk | $3,000/wk | $156,000 |
| the clubhouse | $2,000/wk | $3,500/wk | $8,000/wk | $416,000 |
| the staff | $3,000/wk | $5,250/wk | $12,000/wk | $624,000 |
| **the whole academy** | **$5,750/wk** | **$10,063/wk** | **$23,000/wk** | **$1,196,000** |
| ...as a return on the $12,000,000 | 2.5% a year | 4.4% | **10.0%** | |

⭐⭐ **WHY THAT SIZE AND NOT A ROUND NUMBER.** The 10% commission costs the p90 career **$8,455,684** of
peak wallet. The academy is affordable at about age 22, so it is owned for roughly **7 seasons**;
seven seasons at reputation 4.0 pays **$8,372,000**, which is **99% of the gap**. Nothing here was
picked and then justified – the base is the gap divided by the multiplier those careers actually
hold.

⚠ **AND IT DELIBERATELY DOES NOT BEAT THE INDEX FUND EXCEPT AT THE TOP.** 2.5% a year at reputation
1.0, against the fund's 7%. The academy out-earns the market only for a parent who raised a top-ten
player, which keeps the shop spec's own §0 – «assets never beat a career, they only survive one» –
and stops property becoming the correct answer to every question.

⚠ **The one real cost, and it is a schema question.** The income needs a category to be booked
under, and the three honest options are not equal:
* **a new `WorldEventCategory`** – the right sentence on the Money screen, and **a new member of that
  union is a schema change by CLAUDE.md invariant 3**: the v43 → v44 step exists for exactly this
  («'facility'… a new member of that union is a schema change by the rule in CLAUDE.md §3, so the
  version moves»). So **SAVE_SCHEMA_VERSION 65 → 66**, a no-op migration step, one golden fixture.
  Nothing to back-fill – it is a forward-only income line.
* reuse `'income'` – zero schema, but the Money screen folds the academy into «the parent's job».
* reuse `'academy'` – zero schema, but that category today means «the scholarship SHE receives», and
  making it also mean «the business HE owns» is precisely the two-facts-one-name defect the v44 split
  was built to end.

**Recommended: pay the version bump.** It is the smallest honest option and it is one step.

### ⚠ A CONSEQUENCE OF THE «rename only» ON THE MOTOR BOAT

«моторка $2.4М – давай переделаем на парусную яхту». **None of my figures move** – price, rate, upkeep
and build time are untouched, so every table above stands. ⚠ **But the rename is not free of
meaning**: `grantsVacationId: 'yacht-week'` is carried by `yacht` and `yacht-big` only, and the
catalogue's own comment defends that as «the spec calls neither of them a yacht». **Rename
`boat-motor` to a sailing yacht and that sentence stops being true of it**, so whoever builds the
rename has to rule on whether it now grants the week. **A rename that leaves the comment standing
would leave the file arguing against itself.**

---

### ⚠⚠ A SECOND DEFECT, AND THIS ONE IS IN A MEASUREMENT THAT ALREADY WENT INTO A REPORT

**`tools/sponsor-ladder-reach.ts`'s retainer regex was end-anchored and matched nothing.**

```
const RETAINER_RE = / retainer – quarterly$/
```

`bankSponsorCheque` **appends** «, less her N% share ($X)» to every row it splits, from her eighteenth
birthday onward – and the rungs that pay a retainer at all gate on WTA #200, first cleared at 18–20.
So in practice **every** retainer row carries the suffix and an end-anchored pattern sees none of
them. **Probed on one wealthy/player career over 780 weeks: 0 matched, 32 missed.** The other two
patterns are prefix-anchored (`/^Appearance fee – /`, `/^Sponsor bonus – /`) and were never affected,
which is why the total looked plausible instead of looking like zero.

⚠ **Round 29 part two #12's headline – «career sponsor cash: median $1,942,862 → $4,321,847» – was
measured with the retainer line missing from both arms.** Paired on identical seeds, 72 careers, the
same 780 weeks, the only difference being the pattern:

| | broken pattern | fixed pattern |
| --- | ---: | ---: |
| kit cash, median of the 36 careers paid | $3,870,633 | **$4,443,897** (+14.8%) |
| the largest career | $12,211,523 | **$12,832,023** (+5.1%) |

⭐ **The DOUBLING #12 reported is still real** – both of its arms had the same blind spot, so the ratio
survives. **The LEVEL was understated by about 15%.** Fixed in the tool (a measurement correction, not
a behaviour change; `git diff -- src/` is still empty) and reported here so the published figure is
not quoted again as it stands.

⚠ **The advertising fee was never in that regex set at all** – `sponsorIncomeCents` means «what the
KIT brands paid» and the ad fee is a different post. It is now counted on its own line rather than
folded in, so neither number changes meaning: median $76,000 a career, p90 $219,000.

---

### ⚠⚠ AND THE HONEST TOTAL – WHAT ALL OF THIS DOES TO A CAREER'S MONEY, IN ONE PLACE

Four changes are now on the table at once and **three of them push in opposite directions**. Stacked,
on the median career and on the p90 career:

| change | median career | p90 career |
| --- | ---: | ---: |
| **the commission at 10%** (his ruling) | **−$129,965** peak wallet | **−$8,455,684** |
| the tenure ladder (+15%/season, cap 4) | +$42,000 lifetime | +$181,500 |
| variety (several houses a rung) | **$0 by construction** – each rung's houses average to its shipped anchor | $0 |
| long terms (annual fee over a multi-year term) | **$0** – three 1-year deals pay what one 3-year deal pays | $0 |
| the capstone ($500,000 x 8 years, gate: 4 seasons in the top 10) | $0 – unreachable | $0 at p90; **+$4,000,000** to the top 10% |
| the academy as a business (base $5,750/wk) | $0 – it cannot be built | **+$8,372,000** over 7 seasons |
| **net, capstone excluded** | **−$88,000** | **≈ +$98,000** |

⚠ The capstone is left out of the net on purpose: its gate (4 seasons inside WTA #10) is cleared by
**7 of 72 = the top 9.7%**, which sits exactly on the p90 line, so counting it there would be a coin
toss dressed as arithmetic. A career that does clear it adds $4,000,000 to a lifetime of $28–45M.

⭐⭐ **So the whole package is roughly neutral for the career that can build an academy and a straight
LOSS for the one that cannot.** That is the design's real shape and it is the thing to rule on: the
commission is a flat tax on everybody who ever signs a brand, and every counterweight proposed here
is a reward for the top of the distribution. **If that is the intent, it ships as is. If it is not,
the fix belongs on the commission side** – a floor (say, the parent keeps 100% of the first $50,000 a
season), or a rate that starts at 20% and falls to 10% as she grows, mirroring her own ramp.


---

## Part four – his design rulings of 29.08, after the reachability numbers

- [~] **P5. ⚙ «И я ниразу не сказал, что каждая карьера должна иметь возможность скупить весь магазин.
  Нет такого требования.»** – **RULING, and it retires a framing of mine.** The reachability report
  presented «22 careers lose and gain nothing» and the bimodal economy as a problem needing a knob.
  **It is not a problem – it is the design.** The top shelf is for exceptional careers; the median is
  not owed a yacht. Do not re-open this from the measurement.

- [ ] **P6. ⚙ «Федерер получал контракт с Nike на 10+ миллионов, это 1-2млн для родителя. Таких
  контрактов может быть несколько.»** – **RULING that resizes the advertising ladder.** My «0.67% of
  a career's money» measured OUR shipped rungs ($20k–$55k), not the concept's ceiling – at real-world
  scale a top contract is $10M+/yr, which at the 10–20% commission is **$1–2M/yr for the parent**, and
  several can run at once. ⚠ «Таких контрактов может быть несколько» also overturns the plan's
  one-ad-deal-at-a-time §4.1 for the upper tiers – a top player holds a PORTFOLIO. Needs the research
  below before numbers are picked.

- [ ] **P7. His three-part order, verbatim:**
  1. «разнотировые рекламные контракты с реальными суммами, можешь сделать ресерч на эти суммы для
     общего понимания и калибровки»
  2. «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов
     и прочего»
  3. «нам нужна академия, которая зарабатывает» – «Посчитать сколько должна приносить академия или
     поискать в интернете на примере Надаля»

  ⭐ The chain is his own economy loop, stated end to end: **early and plentiful contracts → shoots →
  fame → merch income → the academy.** Fame's floor comes from court results and shoots MULTIPLY it
  (his explicit agreement in this session), merch follows fame, the academy follows seasons-in-band.

- [x] **P8. The fame spec** – [fame-and-the-shoots-2026-08.md](../specs/fame-and-the-shoots-2026-08.md),
  written this session; his «здесь полностью согласен» covers the floor-and-multiplier shape.


## Part four, continued – his rulings on the research (29.08)

- [ ] **P9. ⚙ «межсезонье – "слишком много съёмок и никакого отпуска" – вот это то, чего у нас вообще
  нет, у нас 6 пустых недель там.»** – **RULING, and it overturns §5.2's in-season-only rule.** The
  advertising plan wrote «an off-season cost is free money wearing a cost's clothes» and pinned every
  shoot in-season. Zheng's own complaint is the counter-model: **real shoots eat the off-season, and
  the cost there is the VACATION they displace** – recovery into the new season, not condition inside
  it. Our 6 empty winter weeks become the shoot season; resting through them stays a real choice.
  ⭐ This also fits the fame spec's floor-and-multiplier shape: the player who shoots all winter buys
  fame and starts the season less rested.

- [ ] **P10. ⚙ «значит убрать этот самолет за 38М и всех делов =)»** – **RULING: `plane-long` leaves
  the catalogue.** The reachability measurement (0 of 72 delivered, upkeep alone eats a $20M
  portfolio's whole commission) said it is a rung nobody can hold; he removes it rather than resizing
  it. ⚠ Forward-safety: a save that somehow owns one must still value and sell it – tombstone the id,
  do not strand the money.

- [ ] **P11. ⚙ His calibration correction, with his own data point**: «Доход Александра Бублика от
  рекламных и спонсорских контрактов оценивается примерно в $1–2 миллиона в год. – это даже не 50
  ракетка. Твои цифры всё еще мимо частично. **Это доход у топ-100, у топ-50 точно больше, D – очень
  хорошо.**» – So the bands lift: **top-100 ≈ $1–2M/yr off-court total, top-50 above that, D capstone
  approved as proposed.** The research's `[GAP]` below top-25 stands, but his data point fills it from
  the owner's side and the ladder follows it.
