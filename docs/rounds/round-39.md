---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-08
---

# Round 39 – Ines's career on the merged round-38 build, 15 items (08.09.2026)

Save under analysis: `~/Downloads/tennis-sim_ines-xgv7_w832.tsave` – **read-only, never committed,
never a fixture.**

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

Class: **build** · **answer** · **measure** · **ask** · **already-works**

---

- [x] **1. «A spare key on her own ring... В 35 лет звучит уже довольно странно. Давай проведём
  общее ревью этих фразочек на home с целью максимально убрать вот такие вот несоответствия»** –
  **build.** Home's flavour lines are written for a child and are still printed at 35. This is not
  one string: he is asking for a SWEEP of the home copy against the age it is shown at. Done means
  every home line has an age (or life-stage) gate that a mounted test can fail on.

  **SHIPPED (wave A).** The pool is `DIARY_POOL` (`src/engine/diary/pool.ts`) – Home's `photoLine`
  and `conditionNote`, 105 entries. Every entry now has a declared age/life-stage gate:
  `tests/r39-home-age-gates.test.ts` carries a per-line gate map (also a verbatim pin on every
  string, invariant 4's friend), fails any entry with no declaration, licenses the whole pool
  against a stage x age x scenario grid (school 13/16, after-school 19/21, college 20, independent
  22/24/29/35) and fails any line selectable outside its window. Mutation-verified: un-gating the
  spare-key line went red on two arms, restored green. The spare key itself: `freshlyIndependent`
  (independent AND under 25 – `SETTLED_ADULT_AGE` in `diary/words.ts`), so it prints in her first
  flat years and never at 29/35. 17 further licence-only edits (no wording touched): witness lines
  («She hummed in the car…», «She fell asleep holding the draw sheet.», «A finalist. We let that
  word sit at dinner.», «An early bus home…», «She didn't say much on the way home.», «She slammed
  the car door…», «The racquet stayed by the door all weekend.») gated `underOneRoof`; the
  phone-register lines (both away birthday captions, voice note, trophy photo, «home safe», car-park
  call, nineteen-second call, ice-pack photo, slow replies, changed-subject, money-after-call)
  widened `independentVoice` → `awayVoice` so COLLEGE stops borrowing family-home lines and gets its
  own voice (a college birthday licensed NO caption at all before this). Two NEW lines for his
  review (the gated ones' age-appropriate siblings): «An early exit. She was fine on the evening
  call.» (away softened loss) and «The Sunday call ran long. Nobody minded.» (settled-adult quiet
  week, the spare key's counterweight). A pool-did-not-thin arm pins that college/20 and
  independent/35 still license a photo line for won/sad/angry/tired/quiet/birthday weeks. Left
  alone deliberately: the vacation captions (they describe the booked package, not her age) and the
  Calendar fridge note (not Home; already stage-switched). Observed, not fixed (no ask): college has
  no off-season condition line – falls back to «The week went by.»

- [x] **2a. «„Past her peak – down 57 places on the year, and her body has about 6 more seasons in
  it." – вот это как раз можно на карточку тренера в списке тренеров перенести, много текста»** –
  **build.** The long decline sentence moves off Home and onto the coach card in the coach list.

  **SHIPPED (wave A).** The whole engine sentence renders on the CURRENT coach's card in the market
  list (`.cm-row.current .cm-decline`, CoachMarketScreen – beside his plaque, `.cm-plaque`'s own
  treatment) and Home renders it nowhere: the round-38 `.coach-decline` paragraph is gone and the
  card text carries no body clause. The headroom hint above the list – which has fallen through to
  the decline read since round 38 #7b – stands down while his card carries the sentence (one screen
  may not say one sentence twice); a SELF-COACHED career keeps the fallthrough, since there is no
  card to carry it. Mounted evidence: `tests/component/r39-decline-surfaces.test.ts` (card carries
  the exact engine string; hint absent beside it; self-coached fallthrough; growing career still
  reads a headroom band) – mutation-verified by deleting the card line (2 arms red, restored).
  `r38-decline-voice.test.ts`'s Home arms re-aimed with ⚠ notes.

- [>] **2b. (REOPENED 08.09) «А вот на home хотелось бы увидеть что-то короткое, емкое и яркое (в плане цвета), как
  было до этого про потолок и прочее»** – **build.** Home keeps a SHORT, coloured read. ⚠ The old
  ceiling plate is the shape he is naming; match its length and its colour treatment, not its words.

  **SHIPPED (wave A), wording = DRAFT FOR HIS REVIEW.** New engine field `Snapshot.coachDeclineShort`
  (one derivation, `declineRead` in `world/coachMarket.ts`, feeds both the long card and this – the
  two surfaces cannot disagree; '' on every growing career, the round-34 child guarantee held in the
  data). Home renders it as `.coach-decline-short` in the OLD CEILING PLATE'S OWN treatment – round
  24's `.coach-room` rule revived for the new line: 11px / weight 600 / `var(--accent)`, under the
  coach quote. ⚠ The three draft strings, each the long sentence's own clause compressed, no new
  vocabulary – say the word and any of them moves:
  «Past her peak – down 57 places on the year» · «Past her peak – 48 places below her best» ·
  «Past her peak – about 4 seasons left» (fallback when the table shows no fall; singular-safe).
  Mounted evidence: the plate renders the exact engine string, starts with the label, carries no
  body clause, and its COLOUR is asserted through the real cascade (`getComputedStyle` = `--accent`,
  weight 600, attachTo per birthday-dialog's rule) – mutation-verified by de-accenting the CSS rule
  (red, restored). A growing fourteen-year-old still sees no plate of either length.

- [>] **3. «У нас все контракты стали на 12 месяцев? Или мне только кажется? Увидел пару штук на 2
  года - лучше. Но мы обсуждали, что на 12 месяцев дают контракты тем, кто только идёт в топ, а чем
  выше - тем дольше. В спорте я видел, что они и на 5, и на 10 лет заключают. А некоторые и
  пожизненно»** – **measure then build.** First measure the actual term distribution by rank on his
  save; then make term scale with standing. His examples set the ceiling: 5 and 10 years exist, and
  a lifetime deal exists at the very top.

  **MEASURED on his save (`tools/r39-save-read.ts --report`) – he is right, and the ceiling is
  harder than he thinks: NOTHING above 3 years exists in the game at all.** Every signed deal of the
  career, term in years:

  | | 1y | 2y | 3y | 4y+ |
  | --- | --- | --- | --- | --- |
  | kit (7 signed) | 1 | 3 | 3 | **0** |
  | ad (15 signed) | 5 | 6 | 4 | **0** |

  ⚠ And the term does NOT track standing today. At wta#5 she signed a 3-season kit; at wta#91 she
  signed a 2-season one; the 3-year ad deals land at wta#7 and wta#16 alike. So this is not «all
  contracts became 12 months» – it is a flat 1-3 ladder with no top end.

  **OWNER (08.09):** «ну давай тоже какой-то ресерч проведем может быть на эту тему, чтобы было на
  что опираться? я бы сказал, что для растущей карьеры не больше, чем на 12 месяцев, для топ-100 до
  1-2 года, топ-50 1-3 года, для топ-20 и выше до 10 лет. Но может у тебя есть предложения лучше.»
  → research on real endorsement terms is MINE, then the ladder proposal comes back to him.

  **RESEARCHED (08.09):** real anchors – Sharapova-Nike 8y, Federer-Uniqlo 10y/$300M,
  Djokovic-Lacoste 5y, McIlroy-Nike 10y; lifetime deals exist (Messi, Ronaldo, LeBron) but are the
  icon exception, mostly outside tennis. The game ALREADY holds an 8-year capstone gated on four
  top-10 seasons – the long top end half-exists. Proposed ladder is in the report of 08.09; ordinary
  letters stay churnable (max 5y at the top), the 8y capstone stands, and a once-per-career LIFETIME
  letter is proposed at legend status. `[?]` waiting on his word.

  **OWNER (08.09): «давай так попробуем, как ты предложил» → wave EF builds the ladder.**

- [x] **4. «В яхтах и (подразумеваю) самолётах на уже купленных тоже убрать с карточки серую надпись

  „paid ..."»** – **build.** The `paid …` caption must not show on an owned yacht or plane. He
  assumes planes have it too – verify rather than assume, and fix every shelf rung that shows it.

  **SHIPPED on `r39/wave-b` (08.09).** Verified – planes DID have it. The mechanism is round 36's
  own: `SHELF_NO_PAID_META` in MoneyScreen.vue grows `boat` and `plane`, the meta stops being
  passed, nothing on the card re-worded or moved. Shelf census (the caption has exactly two
  sources, both MoneyScreen): on OWNED cards it now remains only on `investment` and `business` –
  the two families no round has named, reported rather than touched (invariant 4; the brand's
  witness arm in round35-shop.test.ts still asserts it). And the `On order` card (water and air
  build to order) keeps its own `paid $N` untouched: that card has no «Worth now» and no gain line,
  so the paid figure is the ONLY money on it and removing it would LOSE the number – the exact
  check rounds 35/36 ran before the caption could go from an owned card, where «Worth now» minus
  the gain still states it. Evidence: `tests/component/r39-owned-shelf-paid.test.ts` mounts a
  delivered yacht and a delivered small plane (caption absent, worth + gain still on the card) and
  holds two PRESENT arms (ordered boat, merch brand). Mutation-verified: `'boat'` removed from the
  array -> the yacht arm red alone; `'plane'` removed -> the plane arm red alone; restored -> 57/57
  green across the five shelf files (r39-owned-shelf-paid, round35-shop, round29-shop-elite,
  shop-tab, round36-review).

- [>] **5. (REOPENED) «Я завел бренд у Инэс, он за несколько недель стал стоить 22 млн, я его продал. Потом
  купил новый за 250к, а он снова за несколько недель уже 30+ стоит. Кажется надо ещё что-то с этой
  механикой подумать»** – **REOPENED against round 38 #15/#16.**

  ⚠ **Why the first fix missed, precisely.** Round 38 reported «the ramp closed every sell-and-rebuy
  loop: merch-brand $0» – and that measurement was taken **at `weeksHeld = 0`**, where
  `rampedWorthCents` returns the paid price *by construction*. So the $0 was true and meaningless:
  it proved the loop is shut on the day of the trade and never tested it OVER TIME, which is the
  only place the money was. His cycle is sell at the ramped 22M, re-buy at the catalogue's flat
  250k, wait for the ramp to climb back. The re-buy price is the hole, not the sale.

  **measure then ask.** Measure the cycle's true yield per week on his save, then put the shape to
  him – the catalogue price is his own 07.09 ruling («неизменно для первого открытия стоит 250к»),
  so what changes is what a RE-purchase costs or what a sale pays.

  ⭐⭐ **MEASURED, and it is worse than he reported.** Her fame is at the cap (100.0), which puts the
  ramp's half-life at its **13.3-week floor**. A brand bought TODAY for $250,000 is worth:

  | after | worth |
  | --- | ---: |
  | **1 week** | **$1,844,174** |
  | 5 weeks | $8,243,530 |
  | 13 weeks | $17,658,878 |
  | 26 weeks | $26,620,223 |
  | 52 weeks | $33,488,605 |

  **One week turns $250,000 into $1.84 million** – 7.4x, and the cycle restarts the moment it is
  sold. His own brand: paid $250,000 at week 597, held 235 weeks, now $35,879,827.

  **OWNER (08.09):** «мне сложно проверить, но кажется что у меня свежекупленный бренд возвращался к
  своей стоимости уже в течение 5 недель… Мне кажется, что нам надо как-то вообще более вариативно
  смотреть на цену бренда с точки зрения развития карьеры. Но и с продажей надо что-то тоже подумать
  как быть. Надо подумать хорошенько. У тебя какие мысли?» → the measured 5-week point is $8,243,530
  (23% of derived) – his feel is right in kind. Design proposal is MINE, back to him before any build.

  **PROPOSED (08.09):** A+C – a REPEAT founding is priced at the market's current derived worth
  (the $250k garage price is a one-time story; his first-purchase law untouched), and the ramp's
  half-life floor rises 13 -> ~52 weeks so even a first brand is «процесс»: week-1 worth $723k
  instead of $1,844,174, half-value at a year. Alternative D (the sold brand keeps living and eats
  the new one's reach) named as the richer, heavier road. `[?]` waiting on his choice.

  **OWNER (08.09): «давай попробуем, а D можно в беклог развернуто записать» → wave EF builds A+C;
  D is written out in docs/now-next-later.md's Later.** He also refined the observation: «кажется
  что у меня свежекупленный бренд возвращался к своей стоимости уже в течение 5 недель» – at the
  13.3-week floor the 5-week point is $8.2M of $35.9M, so the feel was right in kind.

- [~] **6. «2 года подряд спонсор с духами не пришёл»** – **measure.** A named sponsor category
  absent two seasons running. Is the perfume slot gated (rank, fame, exclusivity) or is it draw
  luck? Measure the arrival rate before touching anything.

  **ANSWERED – a rank gate working exactly as designed, not luck.** `fragrance` is the icon-band
  category and `ECONOMY` gates it at the **top 10** («watches early, cars at top-100, fragrance at
  top-10»). She signed it twice – Blanche & Noir $2,500,000 (w573) and Rivelle $2,500,000 (w683) –
  and her WTA end-rank since is **#16, #14, #15**. Three seasons out of the top ten, so the most
  valuable category in the game stopped writing. ⚠ Worth telling him plainly: the perfume deal IS
  the top-10 bonus, and it is what sliding to #15 costs.

  **OWNER (08.09), REOPENING THE ANSWER:** «я это помню, но кажется, что 2 сезона в топ-10 прошли без
  него.» → so the question is now the offer CADENCE, not the gate: when did she hold a top-10 rank,
  when did fragrance offers arrive, and what cooldown sits between ad offers of one category. MINE.

  **MEASURED (08.09):** `reviewAdOffer` rolls weekly per category at `offerChance = 0.05`, gate
  band 4 = LIVE wta <= 10, and `adSpokenFor` silences a category while its deal runs. A fully
  top-10 season with the slot open still goes dry with P = 0.95^44 ≈ 10% – his two dry seasons are
  either that die or weeks where her live rank sat 11-15 (the save keeps no live-rank history, so
  the two cannot be told apart retrospectively). Remedy options in the report: a pity timer
  (guaranteed letter within 26 weeks of entering the band), a wider gate, or leave it. `[?]`.

  **OWNER (08.09): «окей, пусть пока без изменений останется, я еще понаблюдаю» → closed, observed.**

- [~] **7. «Странно, что после шлема в 40м году она не смогла взять больше ни одного»** –
  **measure.** One Slam in season 40 and never again. Read her actual title history and the field
  she met off the save; a single Slam followed by nothing may be correct for her level, or may be a
  ceiling in the draw model.

  **MEASURED, and it is not the slam alone – she cannot get PAST the fourth round.** Since week 634
  she has played **11 slams, 40 matches, best result the Round of 16 three times, ZERO
  quarterfinals.** Over the same window she won **6 WTA1000 titles** (weeks 551, 629, 642, 684, 785,
  825) and 10 WTA500s. One extra round cannot explain it: at her observed 70.4% match rate a slam QF
  is p^4 = 24%, so eleven attempts should have produced two or three. ⚠ A real asymmetry between the
  slam draw and every other tier, and it needs its own measurement before any fix.

  **OWNER (08.09), REFRAMING:** «вот у меня и вопрос тогда, а корректно ли работает наша формула по
  скиллам и прочему, тут даже не совсем в ранге и позиции в таблице вопрос, сколько в её скиллах и
  тому, как они относятся к остальным соперникам, особенно ниже 50» → #7 and #10 merge into ONE
  audit: her skills against the field's, expected win probabilities from the match model, actual
  results over them – slams and sub-top-50 opponents as the two lenses. MINE.

  ⭐⭐ **MEASURED (08.09, `--audit`): THE FORMULA IS CONSISTENT – she slightly OVER-performs it.**
  Closed-form p(win) over her 247 logged matches, current skills/ranks (stated caveat):

  | window | n | model expects | actual |
  | --- | --- | --- | --- |
  | 198 weeks, all | 247 | 64.6% | 70.4% |
  | 42 weeks, all | 58 | 66.4% | 69.0% |
  | 42 weeks, vs outside top 50 | 34 | 71.9% | 73.5% |
  | 198 weeks, slams only | 40 | 63.1% | 62.5% |
  | 198 weeks, wta1000 only | 98 | 59.9% | **74.5%** |

  The sub-50 losses are ON MODEL: her build is lopsided – serve **53.1** and composure **50.6**
  against a 26-50-band average of 56.3/57.7 (composure is below even the 51-100 band's 55.7), while
  ret 69.0 and groundstrokes 70.6 are top-10 class. The model prices ~25-28% loss risk per sub-50
  match and she plays dozens. Slam exits are exactly on model; the single slam (w494) was won at her
  peak. The one anomaly is the OLD window's wta1000 over-performance (+14.3 wins), which the neutral
  probe (max condition, hard, today's skills) cannot attribute – flagged, not diagnosed.

  **OWNER (08.09):** «хорошо, что формула работает как задумано… Разве что можно в беклог отношений
  записать, что-то вроде возможности работать с психологом в плане хладнокровия (тот же Федерер…
  поработал над собой, стал лучше), как раз можно будет у психолога делать выбор над чем работать в
  ближайший год» → recorded in the Later backlog beside the morale/relationship layer. And on the
  slam itself: «мне просто было странно, что Шлем случился на пике топовой спортсменки всего 1 раз,
  но может быть это окей для спорта».

- [~] **8. «Meridian sport прислал контракт за 300к для #7»** – **measure then build.** A world #7
  offered $300k reads as insulting. Measure the offer curve against rank and check whether the top
  of the ladder is being underpaid.

  ⚠⚠ **CONFIRMED, and the defect is bigger than the one offer.** Meridian Sport's clothing deal was
  **$300,000** at w697 and again at w720. The same brand and the same category paid her
  **$1,000,000** at w575 – when she was ranked LOWER (wta#14 against wta#7). And it is every
  category, not just clothing:

  | category | season 11 | season 14-16 |
  | --- | ---: | ---: |
  | fragrance | $2,500,000 | – (gated out, see #6) |
  | cars | $2,000,000 | **$800,000** |
  | airline | $1,500,000 | **$600,000** |
  | watches | $1,200,000 | **$500,000** |
  | clothing | $1,000,000 | **$300,000** |

  Every ad category roughly HALVED between season 11 and season 14 while she stayed top-20. That is
  the item; the $300k offer is one symptom of it.

  **ANSWERED (08.09):** the halving is the band ladder he approved in round 34 – bands maxWtaRank
  [400, 200, 100, 50, 10]; clothing pays $1M at band 4 (live top-10) and $300k at band 3 (11-50).
  The $300,000 letters landed when her LIVE rank had slipped out of the top ten; «для #7» was the
  end-of-PREVIOUS-season rank. Working as ruled; the felt defect is the 3.3x cliff at the 10/11
  boundary. Remedy options in the report (tenure-buffered band, an 11-25 half-band, or leave). `[?]`.

  **OWNER (08.09): «может сделать более плавные ступеньки всё-таки? хотя возможно наша новая система
  контрактов и подправит ситуацию, давай так пока оставим, как есть» → closed for now; re-read after
  the term ladder ships.**

- [x] **9. «Опять just one day (REOPENED against round 26 #9). Я просил сделать много вариантов подарков для разных возрастных

  групп. Мне кажется, что вполне допустимо чтобы что-то повторялось, но не больше 2-3 раз за всю
  карьеру и с разницей не меньше 5 лет»** – **REOPENED against round 26 #9.**

  ⚠ **What round 26 aimed at and why it missed this.** It measured the pool (29 gifts, 9 bands),
  found four bands holding exactly three gifts – C(3,3) = 1, one possible dialog – and built
  repetition control over CONSECUTIVE birthdays. His complaint now is not about consecutive years:
  it is about a gift's TOTAL count across a whole career and the gap between its appearances. Round
  26's guard cannot see either, so it is green while he sees the same gift again.

  **build, and now he has given the number:** at most 2-3 appearances per career, never closer than
  5 years apart.

  **CONFIRMED on his save.** Her 13 birthdays: trip(18), home(19), car(20), deposit(21),
  **day(22)**, familyweek(23), **day(24)**, dog(24), **day(25)**, jewellery(26), **day(27)**,
  oldclub(28), album(29). ⭐ **`day` four times – at 22, 24, 25 and 27, gaps of 2, 1 and 2 years.**
  Against his rule (at most 2-3 a career, never under 5 years apart) that is double the count at a
  third of the spacing. Every other gift appears exactly once.

  **R39-C, `r39/wave-c` – BUILT, his sentence as constants.** `GIFT_CAREER_CAP = 3` appearances per
  career, `GIFT_REPEAT_GAP_WEEKS = 260`, in `src/engine/world/birthday.ts`. An appearance = a
  birthday row that ASKED for the gift or GAVE it; **the day counts as an ASK only** – its presence
  on every card is the untouched 11.08 ruling, and freely GIVING the day stays unlimited. The ask
  now walks a four-rung ladder: strict (cap + gap + the round-27 cooldown) → gap relaxed → cap
  relaxed → `options`, never a crash, and **within a rung the least-used gift wins** (a third
  appearance only when nothing fresher qualifies). Relaxations are reported (`eased`) and the ORDER
  is pinned in `tests/birthday-career.test.ts`. The OFFER (which four rows print) is untouched by
  the record – reload-immutability and every round-26 pin stand; the record only shapes the voice.

  **Four NEW gifts** (band pools were too thin to seat the rule – the round-26 finding says why):
  peak 22-28 gets `recipes` («The family recipes, bound into one book») and `guitar` («A guitar to
  travel with»); the late 29+ band gets `olives` («Olive trees, planted in her name») and
  `firstracquet` («Her first racquet, restrung and framed»). Catalogue 33 → **37**; peak C(7,3)=35
  dialogs for 7 birthdays, late C(10,3)=120 for 13.

  **MEASURED before/after** (`tools/birthday-pool.ts` §5, 12 granting careers = 190 birthdays –
  his own shape, asked === given):

  | granting walk | before | after |
  | --- | --- | --- |
  | gifts over 3 appearances in one career | **10** | **0** |
  | gifts repeated inside 260 weeks | **15** | **0** |
  | `day` worst career count | **7** | **2** |
  | `day` tightest gap | **103 weeks** | **365 weeks** |
  | top repeats after | – | recipes 2x/260w · oldclub 2x/363w · day 2x/365w |

  The ids[0] walk (a player who hoards the first row regardless of the ask) still shows given-driven
  repeats – the player's hand is his own – but its ASKS obey the rule too: 3 relaxations over 194
  birthdays, all `gap`, all reported. ⚠ **RNG: zero MAIN draws added or moved** – the ask is still
  the fourth draw on `seed:birthday:<age>`; `tests/condition.test.ts` green on **41550 /
  `e6b0c709`**, unchanged, and **not one existing guard test needed re-aiming** (the ladder
  degenerates to the round-27 chain, pool for pool, for every caller without a record). Spec:
  `docs/specs/birthday-and-gifts.md` §12. No schema move – the rule reads rows v48 already persists.

- [x] **9c. NOT RAISED BY HIM, found in the same log: two birthdays one week apart.** Week 569
  `day` at age 24 and week 570 `dog` at age 24. Folded in because it lives in the same file.

  **R39-C – DIAGNOSED (read-only off his save), REPRODUCED, FIXED, PINNED.** She is born **21
  December**. Round 34 #3 moved the marked birthday week from «the week CONTAINING her date» to
  «the first week whose Monday has reached it» – one week later for every non-Monday date – and his
  career was standing exactly in that seam when the build updated: **week 569 (Dec 16-22, 2041,
  contains Sunday the 21st) was asked and answered under the OLD rule; the round-34 build then found
  week 570 (Monday Dec 23) fresh**, because `pendingBirthday`'s dedupe compared WEEKS
  (`b.week === world.week`). The save proves the interleave: every row before the deploy sits on the
  old marked week (466, 518, 569...), every row after on the new one (622, 674, 727, 779, 831), and
  the two rules overlap at exactly one birthday – the doubled 24. **Fix: an AGE is answered once,
  not a week** – the dedupe now also blocks any age already on the record, so no future move of the
  marked week (calendar or rule) can double-ask a birthday; the week half of the guard survives for
  poked saves. Regression pin with his exact shape (Dec 21, stale week-569 row, week-570 check) in
  `tests/birthday-career.test.ts`, «ROUND 39 #9c».

- [~] **10. «Очень печально смотреть, как она регулярно сливает кому-то, сильно ниже #50 (хотя может
  только кажется, что регулярно). Проанализируй сейв пожалуйста с момента, где все покупки
  случились и дальше - это как раз новые правки пришли»** – **measure.** ⚠ He flags his own doubt
  («может только кажется»), so the honest answer is a rate, not an anecdote: her loss rate to
  opponents ranked far below her, from the week the purchases land onward, against what her skill
  gap predicts. Round 38's C4 changed AI match results, so this window is the first read of it.

  ⚠⚠ **HE IS RIGHT, AND MY FIRST READ SAID THE OPPOSITE.** The first pass reported «0 of 73» – it
  had mapped NOTHING, because `RankingRow` is `{playerId, points, rank}` and the lookup was keyed on
  `r.id`, which is `undefined` on every row. A lookup that silently misses looks exactly like a
  clean result. Corrected:

  | window | record | losses to a player now outside the top 50 |
  | --- | --- | --- |
  | from w634 (198 weeks) | 174W 73L | **33 of 73 – 45%** |
  | from w750 (82 weeks) | 68W 32L | 15 of 32 – 47% |
  | from w790 (42 weeks) | 40W 18L | 9 of 18 – 50% |
  | **from w802 (30 weeks)** | 30W 11L | **6 of 11 – 55%** |

  She is WTA #17. The worst are #124, #107, #101, #101, #96, #91. ⚠ The honest caveat: those are
  ranks TODAY, not at match time, so an old loss may have been to someone then-strong – which is why
  the recent window matters most, and there it is WORSE (55%), not better.

- [~] **11a. «Бренд за 33м выглядит как имба, особенно на фоне академии за 17м совокупно, но может
  быть я придираюсь»** – **measure then ask.** The two shelves' valuations against what each one
  earns. Related to 5: the same brand, at the top of its ramp.

- [~] **11b. «При этом академия больше денег приносит, кстати»** – **answer.** Confirm or correct
  with the two weekly figures off his save; if the academy earns more while being worth half, that
  is the imbalance 11a is really about.

  ⚠ **MEASURED, and half of this is the other way round.** Brand worth **$35,879,827** against the
  academy's four rungs at **$21,057,495** – 1.70x, so he is right that it dwarfs them. But the weekly
  income is **brand $34,500 vs academy $33,169**: the brand earns **4% MORE**, not less. The academy
  cost $12,000,000 and is worth $21.1M; the brand cost **$250,000** and is worth $35.9M. That gap –
  143x on the purchase price – is the same fact as #5.

  **OWNER (08.09):** «видимо вторая половина её, но ее не видно, поэтому и был вопрос, т.к. в
  интерфейсе доход около 17к» → the engine pays $33,169 and his screen says ~17k. Find where the
  half goes on the MoneyScreen and either show it or name it. MINE to measure, then a small build.

  **FOUND (08.09):** per-rung income is land $0 · courts $4,346 · building $11,438 · staff
  **$17,385** – his «около 17к» is the STAFF rung's own line, and the screen never sums the family.

  ⚠⚠ **BUILT UNASKED, REVERTED ON HIS WORD (08.09).** A family total line shipped here on the
  architect's own inference – and the owner had asked a QUESTION, not for a build: «я вообще не
  просил этого делать, верни как было пожалуйста. Я говорил о другом, но ты уже всё мне объяснил»,
  and on the sum itself: «убираем и сумму и тест, игрок справится 3 числа сложить». The line and its
  test are reverted; the ANSWER above is the whole deliverable. The lesson joins invariant 4's
  family: an observation about the screen licenses an explanation, never an element.

- [~] **16. «просканируй последние сейвы Инэс и Алисы… были ли у её соперниц сходы по травмам в
  матчах, если у нас есть эта информация вообще. И если были, то с какой периодичностью? А по
  сравнению с ней самой?»** – **answer, measured (`--retire`).** The record exists per match
  (`MatchRecord.retiredId`). Her logged matches: **Ines 3 of 247 = 1.21%** (she 1× w783, opponents
  2× w750/w769), **Alice 3 of 226 = 1.33%** (she 2× w1006/w1068, opponents 1× w996) – against the
  calibrated 2.73% either-side anchor (ITF corpus, PLOS ONE). ⚠ Two honest caveats: the diary logs
  ONLY her matches and prunes old ones, so the denominator is the retained set; and **AI-vs-AI
  matches resolve as one Bernoulli against the closed form – a rival cannot retire in a match she
  is not part of.** So «сходы у соперниц в их собственных матчах» do not exist mechanically; the
  door exists only where the point loop runs, which is her court.
  и не считать в неделе: мы и так платим за самолёт еженедельно. Или это не так работает?»** –
  **answer first, then build if it confirms.** He is asking how it works before asking for a change.
  Read what a plane actually does to the weekly flight cost today; if it already zeroes it, the card
  is lying and the fix is on the card.

  **ANSWERED, measured:** `ECONOMY.shop.planeTravelShare = 0.5`. The plane takes exactly **half**
  the fare, never all of it, so a flight still costs and still counts. On her calendar right now:

  | event | sticker | after academy + kit | after her own plane |
  | --- | ---: | ---: | ---: |
  | w833 w50 | $3,067 | $1,534 | **$767** |
  | w832 w15 | $1,748 | $874 | **$437** |
  | w832 local | $97 | $49 | **$24** |

  So the card is not lying – it shows a real, halved fare. Striking it out entirely is a CHANGE (his
  call), and the money at stake is small: the whole remaining calendar is a few thousand dollars
  against the plane's own upkeep.

  **OWNER (08.09):** «окей, хорошо, но вот я и пытаюсь понять он должен их вообще снимать или нет,
  т.к. мы уже платим недельный тариф, я не знаком так глубоко с частной авиацией. Нужен небольшой
  ресерч.» → research on what owning an aircraft actually removes per trip is MINE, verdict back to him.

  **RESEARCHED (08.09), verdict: it must NOT clear the fare.** Owning removes the charter's margin
  and fixed share; the variable cost of every trip remains – fuel $1,500-4,000+/hr, crew, landing
  and handling, ~$3,000/hr all-in against fixed costs of ~$500k-1.5M/yr. Our weekly upkeep is the
  fixed half, the halved fare is the variable half – the 0.5 share is a fair model of reality. The
  card stays honest as it is; a strikethrough-style clarity pass is possible if he wants it. `[~]`
  unless he overrules.

- [x] **13a. «Ей почти 29, а тренер говорит, что она протянет ещё 13 сезонов, при этом она уже
  начинает постепенно сдавать, что видно в статистике сезонов: уже не топ-10»** – **build.** The
  coach's remaining-seasons number contradicts the decline the same screen is reporting. 13 seasons
  at 29 puts her at 42.

  **CONFIRMED, with the cause.** The card reads «Past her peak – down 1 places on the year, and her
  body has about **13** more seasons in it.» at age **29.0**. The number comes from
  `seasonsOfBodyLeft`, which extrapolates from `physicalMean / peakPhysical` – and hers is **63.03
  of 63.19 = 99.7%**. She has barely declined yet, so the extrapolation runs to age 42.

  **SHIPPED (wave A), measured.** The walk was honest and aimed at the wrong END: it ran to
  `ENDINGS.lastOfferPeakShare` (0.55) – the winter the retirement QUESTION runs out, the owner's own
  26.08 dial, age ~41-42, Federer territory. The coach's sentence now stops at
  `COACH_BODY_END_SHARE = 0.70` (`world/coachMarket.ts`) – the model's own end of a PROFESSIONAL
  body: 0.70 is the share the deleted hard finish at 38 mapped to, and `tests/ending.test.ts` still
  pins that 70%⇔38 equivalence as a tripwire, so the two dials cannot drift apart silently. The
  0.70→0.55 stretch is the borrowed-time tail and reads the honest floor «about 1 more season».
  ⚠ Tuning measured, not guessed – `tools/r39-body-seasons.ts`, synthetic states only (the 27 row
  uses the direct-route pair 22/27; the rest the shipped 23/29; `live` = the real
  `coachDeclineNote` after the change, and it matched the 0.55 column exactly before it):

  | age | share | walk→0.55 says | walk→0.70 says (shipped) |
  | ---: | ---: | ---: | ---: |
  | 27.0 | 99.7% | 13 | **9** |
  | 27.0 | 97% / 93% / 88% | 12 / 12 / 11 | 9 / 8 / 7 |
  | 29.0 | **99.7% (his case)** | **13** | **9** |
  | 29.0 | 97% / 93% / 88% | 12 / 12 / 11 | 9 / 8 / 7 |
  | 31.0 | 99.7% / 97% / 93% / 88% | 11 / 11 / 11 / 10 | 8 / 8 / 7 / 6 |
  | 33.0 | 99.7% / 97% / 93% / 88% | 10 / 10 / 9 / 9 | 7 / 7 / 6 / 5 |
  | 35.0 | 99.7% / 97% / 93% / 88% | 9 / 9 / 8 / 8 | 6 / 6 / 5 / 4 |

  A barely-declined 29-year-old hears **9**, single-digit; and on the r38 fixture's Alice shape
  (35.3, 80.4%) the sentence says **2** – his own «ей осталось играть пара лет» register from 07.09,
  which round 38 could not derive from the 0.55 stop. ⚠ Re-aimed guards, none deleted:
  `r38-decline-voice.test.ts`'s cross-check arm derives from `COACH_BODY_END_SHARE` now (⚠ note in
  place), its swept shares moved above the new stop (0.95/0.9/0.8), and the singular arm pins BOTH
  edges of the 1-season tail. Mutation-verified: stop reverted to 0.55 → two arms red, restored.
  His decline-note tests and the fresh #13c pins stayed green throughout.

- [x] **13c. NOT RAISED BY HIM, found in the same sentence: «down 1 places».** `coachDeclineNote`
  interpolates `down ${yearMove} places` with no singular. Folded in – same file, same line.

  **SHIPPED (wave A).** A `places(n)` helper in `coachDeclineNote` – «down 1 place» / «down 2
  places» – and the SAME one-word defect fixed in the other rank arm («1 place below her best
  season»), which would have printed the day her year-fall was exactly one. Pinned in
  `tests/component/r39-decline-surfaces.test.ts` (both arms, singular and plural, long note and
  short plate) and mutation-verified: singular removed → both pins red, restored green.

- [~] **13b. «Но очень хорошо, что тренер стал обращать внимание, что перформанс падает»** –
  **answer, nothing to build.** Round 38's decline note landing well. Recorded so it is not lost.

- [>] **14a. «„She said it in the car. Three seasons on the professional table and it has not moved…"
  - одно и то же опять, давай какую-то вариативность в этих фразах сделаем, какие варианты?»** –
  **build + ask.** The retirement-thought copy repeats verbatim. He is asking BOTH for variety and
  what the variants should be, so the variants come back to him as a choice before they ship.

  **OWNER (08.09):** «да, подумай пожалуйста» → the variant sets and the she-is-done mechanism are
  MINE to draft, back to him before any build.

  **DRAFTED (08.09), in the report:** four plateau ledes keyed DETERMINISTICALLY on
  `oneMoreYearCount` (0 = the shipped sentence byte-identical; 1, 2, 3+ escalate in her voice –
  no new dice), plus the mechanism: today `final: true` fires only on `physicalShare <=
  lastOfferPeakShare`, so a plateau card can repeat for YEARS (hers: physicalShare 99.7%,
  oneMoreYearCount already 3). Proposal: the plateau path also turns final after K one-more-years
  (K=4 suggested), with the escalating ledes as the warning – plus a Home line after each
  one-more-year so the state is visible in-season. `[?]` copy and K wait on him.

  **OWNER (08.09): «интересный механизм, давай только подумаем когда его реально включать, потому
  что сейчас получается она буквально на пике карьеры начинает говорить, что "всё". Может быть это
  тоже на какие-то показатели завязать? например хладнокровие+выносливость или вроде того, тогда это
  будет менее предсказуемо, более вариативно и живо» → MINE: measure candidate triggers
  (composure+stamina composites, physical share, plateau x decline overlap) across preset careers,
  bring back WHEN each would fire, then the copy and K ship together.**

- [>] **14b. «И как-то надо подсветить, когда она сама дальше вообще не готова играть продолжать.
  Какой-то механизм для этого»** – **ask then build.** Today the line always ends «She will keep
  playing if you want her to». He wants a state where she genuinely will not, and a signal for it.
  That is a mechanic, not copy – sharpen it to a choice before building.

- [>] **15a. (EXTENDED 08.09) «В прологе во время травмы нужно как-то аккуратно объяснить игроку, что всё нормально
  и ребёнок выживет и вернётся в строй»** – **build.** A first-time player reads a child's injury as
  a catastrophe. The prologue must say, in its own voice, that she recovers.

  **SHIPPED – and the finding first: THE PROLOGUE HAS NO INJURY CARD.** The one injury the prologue
  can show is the in-match retirement during a Local Open – the real match engine's own door, «A
  long match on tired legs» – and its popup said she «could not continue», after which the walk
  moved on as if nothing had happened: a prologue weekend stores no injury, so no layoff report
  ever follows the way one does in the career. That silence is the catastrophe. The missing
  sentence is `LOCAL_OPEN_COPY.hurtNote` now (src/prologue/cards.ts, DRAFT like every prologue
  word): **«She is alright – worn out, nothing more. She sleeps the whole drive home, and in a few
  days she is asking to play again.»** The viewer takes it as an optional note
  (`MatchViewer.hurtNote`, default null) drawn under the popup's reason; ONLY the prologue passes
  it, because in the career the same moment opens a real layoff and `InjuryStopDialog` still owes
  its report – «she is alright» there would be a lie contradicted one screen later. Every career
  surface is byte-identical, and the mounted CONTROL asserts it (the popup without the note carries
  no trace of the line). Evidence: `tests/component/round39-prologue-injury.test.ts`,
  mutation-verified twice – the popup's note paragraph removed → that test red with the control
  green; the `:hurt-note` binding removed → the wiring test red; both restored. RNG: strings and
  one null-default prop, zero draws added on any stream.

  **ASK, not shipped – the career's own injury popup wants the same sentence.** «Ребёнок выживет и
  вернётся в строй» also describes `InjuryStopDialog` (she is thirteen there too, one screen after
  the handover), whose closing line is clinical: «Rest and rehab now – the news feed tracks her
  recovery.» A warm variant is drafted and NOT shipped, because that dialog is not a prologue
  surface and invariant 4 prices the ask at one sentence: **«She comes back from this. Rest and
  rehab now – the news feed tracks her recovery.»** His word lands it or kills it.

- [x] **15b. «И вообще чуть больше тепла в этих экранах надо сделать, как мне кажется. Например на
  варианте rest добавить hug и ещё как-то над самим текстом подумать»** – **build.** Warmth pass on
  the prologue injury screens; `hug` named explicitly as an addition to the `rest` option.

  **SHIPPED – the hug is on the rest option, and the rest option is the knock's.** The one control
  named `rest` in the whole game is the knock dialog's «Rest it» (`decide('rest')`,
  KnockDialog.vue), whose copy is the engine's (`buildKnockPrompt`); the prologue itself carries no
  rest variant anywhere, so «на варианте rest» can only be that screen and the warmth pass lands
  there. The rest branch's sentence (engine/knock.ts `restCost`) was «She trains next to nothing
  for a week. That week of work is gone.» and is now: **«A hug, the sofa, and a week of next to no
  tennis. That week of work is gone.»** The cost clause is kept verbatim – warmth may not blur the
  legibility rule the dialog exists for – and the push branch stays cold on purpose: it is a
  warning, and a warm warning is a worse one. The house sweeps still hold (no digits, under 110
  chars, short dash only, rest never equals push – tests/knock.test.ts green). Evidence:
  `tests/component/round39-prologue-injury.test.ts` mounts the real dialog off the real prompt –
  the REST button carries the hug and the PUSH button does not, on first knocks and repeats alike;
  mutation (restCost reverted to the old sentence) → both assertions red, restored. Together with
  15a's line, the injury moment's warmth pass is: the reassurance on the prologue popup, the hug on
  rest – and nothing else reworded without his word.

  **OWNER (08.09) on the finding and the warmth: «да, вот в этом и дело может быть, мне жена сказала
  "мой ребенок травмировался, а я даже ничего не поняла, ни обнять, ни понять что дальше". Надо
  как-то это обыграть, если травма вообще случилась. Тёплые варианты ок - делаем» → wave D2: the
  prologue injury moment becomes a beat the parent can hold (hug + what happens next), and the
  career InjuryStopDialog takes the approved warm line.**

---

## Bundles (dispatched 08.09, owner's «можно запускать дальше»)

No two bundles touch the same file. Each agent appends to its OWN ledger lines only, on its own
branch, and reports per item number.

| wave | branch | items | surface |
| --- | --- | --- | --- |
| A | `r39/wave-a` | 1, 2a, 2b, 13a, 13c | Home's flavour + coach voice: HomeScreen.vue, coachMarket.ts, the coach list card |
| B | `r39/wave-b` | 4 | the shelf's owned-asset cards (yacht, plane) |
| C | `r39/wave-c` | 9, 9c | birthday.ts and its tests |
| D | `r39/wave-d` | 15a, 15b | the prologue injury screens |

MINE, not waved: 3 + 12 (research), 5 (design), 6 + 8 (sponsor economy measure), 7 + 10 (the skill
formula audit), 11 (the invisible half of the academy's income), 14 (variants + the mechanism).
