---
type: round
status: current
area: delivery
last-reviewed: 2026-10-05
---

# Round 46 – the owner's playtest after round 45 merged, 22 items (05.10)

He played the merged build (round/45 went in as PR #164 the same day). The list mixes asset-card
UI, the year-summary popup, life-event presentation (a wedding happened with NO screen), an index-fund
cost-basis defect, two dev tools he wants for debugging, and one architecture question (a micro-LLM
in the browser). Item 16 says a save is attached – **no attachment reached the architect's session**;
item 20 explains he currently cannot export saves at all, which 20 itself is meant to fix.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

---

- [ ] **1. «Когда выбрали залистить айтем на продажу появляется кнопка withdraw выше sell на карточке
  машин. Предлагаю в один ряд сделать, а ещё, если случился list, то sell заменять на sell now и
  жёлтую. На карточке домов кнопки лежат одна сверху другой. Надо проверить во всех разделах и
  сделать одинаково.»** – split:
  - **1a** – listed-item cards stack `withdraw` above `sell`; put the two in ONE ROW, and make the
    layout identical across EVERY asset section (cars, houses, and whatever else sells: check the
    whole market surface). Class: **build**.
  - **1b** – once an item is listed, the `sell` button becomes **`sell now`** and turns **yellow**
    (his own copy and colour – the wording is his ruling, verbatim). Class: **build**.

- [ ] **2. «the weight дублирует the weight в настройках, надо второе переписать и может немного
  развернуть»** – two settings rows both read «the weight»; rewrite the SECOND one (he delegates the
  new wording – and «развернуть» = it may grow a few words of explanation). New string = DRAFT row
  for his blessing. Class: **build**.

- [ ] **3. «Похоже у нас такой же небольшой гринд на недвижимости есть: я только что продал первый
  дом за 332к, и мне предлагаю купить новый за 240к. На счёт инфляции на дома я ещё думаю, кстати,
  что ты думаешь на эту тему?»** – split:
  - **3a** – the housing grind: sell a house at 332k, be offered the next at 240k – the same class
    as round 45 #10 (the brand's 13,800). Measure the actual sell/offer spread and whether flipping
    houses is profitable grind. Class: **measure**.
  - **3b** – house-price inflation: he is still thinking and asks the architect's opinion. Class:
    **answer** (architect's recommendation, his decision).
  - **A0 · 3a MEASURED to the digit**: house-first `entryCents` $240k × 1.03¹² years × 0.97 resale
    basis ≈ **$332k – his number**; the catalogue's entry prices never move, so the same rung is
    re-offered at $240k and the churn pockets ~$92k per cycle, repeatable forever.
  - **OWNER RULED (05.10)**: «Дом на 3% в год - смотри, чтобы он всё ещё при этом остался инвест
    активом, пусть и небольшим, т.е. его рост должен обгонять инфляцию.» → entry prices index at
    **+2 %/yr, strictly below the family's +3 % appreciation**: a quick flip goes negative (−$2.7k
    at year 2), the 12-year churn shrinks to ~$28k (noise), the holder keeps beating the late
    buyer. Class: **build** → bundle **B14**.

- [ ] **4. «Альбом стал лучше, а давай ещё повернём немного вот этот цветной горизонтальный билет на
  на 5 градусов по часовой стрелке?»** – the coloured horizontal TICKET scrap in the album rotates
  +5° clockwise. Class: **build** (identify the exact scrap asset, rotate in the placement resolver,
  pin the value).

- [ ] **5. «На 29й день рождения она просила свой счёт в банке - это смешно. Давай наверное сделаем,
  что она будет где-то в адекватном возрасте и обстоятельствах его спрашивать? Может жёстко к 18
  привязать, например. Или, если можно раньше, то в коридоре 16-18»** – the own-bank-account birthday
  ask fired at 29. Gate it to an adequate age: his preference = hard 18, or a 16–18 corridor if the
  beat can naturally fire earlier. Class: **build** (find why it fired at 29 first – the fix must name
  the cause, not just clamp).

- [ ] **6. «Может для своей яхты тоже поставим -15% вероятности травмы?»** – «тоже» = something
  already grants −15% injury (find the existing owner of that bonus – presumably the own plane);
  mirror it for the OWN YACHT. Tuning change → measured, not guessed (invariant 5): bench arm or
  probe + spec note. Class: **build + measure**.

- [ ] **7. «Выигранный 1000 снимает сейчас 12 кондишина, и кажется, что 500 снимает ощутимо больше.
  Проверь пожалуйста»** – under the 02.10 tariff (500/1000/Slam all = 3) a WON 1000 drains 12 and a
  WON 500 seems to drain MORE – an inversion if true. Probe both with the drain probe; if confirmed,
  diagnose (draw sizes? match counts? run ladder?) and propose. Class: **measure**, then his word or
  an obvious fix.
  - **A0 · MEASURED** (tools/condition-drain-probe.ts, no dice, SHIPPED column): net straight-sets
    title runs with the travelling masseur – 250:**12**, 500:**17**, 1000:**12** (his «12» to the
    digit), Slam:**14**. A won 500 outprices a Slam. Cause: the deep-draw run-ladder discount
    `[-2,-1,0]` (R64/R128 open at 3–4 per match against the 500's flat 5) compounding with the
    masseur's per-match tour relief.
  - **OWNER RULED (05.10)**: «по 7 надо сделать разумно, например: 250-12, 500-15, 1000-18,
    шлем-21… посчитай по нашей математике… в 1000 на 1 матч больше, чем в 500, а в шлеме на 2. Мне
    кажется это справедливая логика.» The computed shape that lands his four numbers EXACTLY: the
    run ladder for 500/1000/Slam becomes `[0,0,0,1,1,1,1]` (first three matches free of run
    surcharge, +1 from the fourth) and the deep-draw discount is DELETED; his 02.10 tier
    surcharges, the W15–250 ladder, juniors and domestic do not move a digit. Predicted nets
    12/15/18/21, spacing +3 per extra match (6 gross − 3 relief). Early exits at 1000/Slam rise
    3–4 → 5 per short visit (the discount's death – big sheets stop being cheap trips). Corridors
    (econ-reach, injury %, holiday bench) re-pin after the build, round-45 style. Class: **build**
    → bundle **B13**.

- [ ] **8. «В попапе итогов года что-то странное с доход-расход, в расходы явно что-то лишнее
  попадает, а в доходах общее состояние и прирост не учитываются, надо исправить»** – the year-summary
  popup's income/expense split: something extra lands in expenses; income ignores net worth and its
  growth. Engine-UI parity class: find what the popup sums vs what the engine's own ledgers say.
  Class: **build**.

- [x] **9. «А у нас где-то есть индикатор, что у неё есть отношения в данный момент? Может сделать
  что-то на личной странице или заменить after school, например, когда он станет неактуальным?
  С подсчётом сколько они уже вместе например или ещё что-то?»** – no current-relationship indicator
  exists(?); add one on the personal page – e.g. replace the stale «after school» block once it is no
  longer relevant, showing the partner and how long they have been together. He gave design latitude
  («или ещё что-то»). New strings = DRAFT rows. Class: **build**.
  - **B4 · 9 SHIPPED – a relationship line on her personal page, UNDER the tile grid beside the school and
    college sentences; the After-school cell is untouched.** While it stands: `Together with {name} for {span}`;
    once married: `Married to {name} – together for {span}`; while she has not given a name: `Together for {span}`
    (the engine writes the name at the engagement, so for most of a relationship there is none). The screen
    prints `snapshot.life.togetherNote` and derives nothing.
    **The «replace after school» call.** That cell does go quiet – its ladder ends at `Grown up` / `Her own life
    now` from 22 – but it cannot honestly host the line. A name plus `1 year and 6 months` does not fit a `nowrap`
    tile line (the reason the school and college sentences already sit under the grid), and the line has to stand
    while the cell is still current (a girl of 19 on `Tennis full-time`), so a swap would show it in two different
    places depending on her age. The owner's idea stays open as a later move; nothing here blocks it.
    **Laws kept.** It is the PARENT'S attachment – `knownPartner`, never `activeEpisode` – so a girl who has not
    told him shows nothing, and an ended one shows nothing. The span is B1's `relationshipDurationWeeks` in
    `togetherSpan`'s words (one count with the wedding card); «married» is `latchedEpisode`. Snapshot: ONE derived
    field, `life.togetherNote`, fed by an optional `together` fact on `KidLifeWorldView` (optional so the
    hand-built views in six test files need no edit); persisted nowhere, no schema move, zero draws.
    DRAFT: R46-S10 (wired), R46-S11 (alternate).
    **Tests** – `tests/component/round23-kid-page.test.ts`, extended (5 new arms, 10/10 green): standing and
    named, unnamed, married (and a nameless married row), nobody / ended / not told yet, the school cell reading the
    same beside the line, and the notes-stack wrap check. Every expected span is built from the real primitives
    off the same world, never typed. **Mutations**, each alone and restored byte for byte (`cmp`): span source set
    to 0 reddens the named and married arms; the paragraph removed reddens named, married, seat and phone; `married`
    forced false reddens the married arm alone; the fog gate dropped (`knownPartner(world, Infinity)`) reddens the
    not-told-yet arm alone. Also green: the 18 component files that mount KidScreen (202 tests) and 38 unit files
    around `kidLife`, the template rules, import cycles and the barrel pins (839 tests); `vue-tsc -b --force` clean.

- [ ] **10. «На экране между матчами с большой картинкой немного съехала вёрстка в ширину и есть
  горизонтальный скрол, надо проверить и починить»** – the between-matches screen with the big
  picture overflows horizontally (horizontal scroll exists). Fix + a mounted no-overflow assertion at
  phone width. Class: **build**.

- [x] **11. «И кстати, она объявит о свадьбе заранее (увидел, объявила, можно там тоже писать сколько
  они вместе, кстати, как вариант)? Или это от отношений и темперамента зависит? И поставим ли мы
  свадьбу в календарь? Картинка есть. Я дождался свадьбы, но самого экрана этого события не было!
  Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать
  оверлей на весь экран, например.»** – split:
  - **11a** – does the advance wedding announcement depend on relationship/temperament, or always?
    Class: **answer** (read the code, tell him the actual law).
    - **B1 · 11a ANSWER** (read from `src/engine/world/lifeBeat/wedding.ts`): the announcement is
      **unconditional once the roll fires – it depends on neither the quality of the relationship nor on
      temperament.** The gate is `weddingEligible` (wedding.ts:36-44): age ≥ 23 (`ECONOMY.wedding.ageGate`),
      a standing love episode, ≥ 52 weeks together (`minEpisodeWeeks`), no earlier `'engaged'` beat. The roll is
      ONE flat uniform per eligible week against `ECONOMY.wedding.perWeek` = 0.6 % (wedding.ts:56), and the
      header says so plainly: «NO TEMPERAMENT TERM, AND THAT IS THE DRAFTED SHAPE RATHER THAN AN OVERSIGHT»
      (wedding.ts:50). The announcement IS the blocking `'engaged'` card, raised in the week the roll fires
      (wedding.ts:68, the one raise site). The day itself lands `weeksAfterEngagement` = 8 weeks later on **any**
      answer – opposing does not stop it (wedding.ts:99, 108). What the relationship DOES change is only the
      card's WORDING (her own voice by temperament, or the dry card when the bond is low: `ENGAGED_HER_LINE` /
      `ENGAGED_DRY`), never whether it happens. The one way it fails to land: the episode ENDS inside the 8 weeks
      (wedding.ts:110) – and the calendar mark and the screen both follow that.
  - **11b** – put the wedding into the CALENDAR (the art exists). Class: **build** unless the answer
    to 11a changes the shape – the calendar entry follows the announcement.
    - **B1 · 11b SHIPPED.** A band «Her wedding» (bride painting, week label, dates) on `CalendarScreen`, from the
      week she is announced until the day lands. Feed: `upcomingWeddingWeek(world)` (wedding.ts – `landWedding`'s
      own predicate read forward) → `snapshot.weddingWeek` → `weddingMarkFor` (`composables/weekDays.ts`) → band.
      Parity with the day itself is a test: it drives the real `landWedding` week by week and demands the same
      week. Tests: `tests/life-moment-engine.test.ts` (11b block), `tests/component/calendar-wedding-mark.test.ts`.
      DRAFT: R46-S5.
  - **11c** – ⚠ THE DEFECT: he waited for the wedding and **no event screen appeared** despite the
    art existing. Audit ALL big life events – wedding, funerals, pregnancy, birth – which have art
    and which have a presentation moment; wire the missing ones as a full-screen overlay (his
    suggestion). Class: **build** (the round's biggest item).
    - **B1 · 11c AUDIT** (each row read in code, not assumed):

      | moment | what resolves it today | presentation before this round |
      |---|---|---|
      | wedding ANNOUNCEMENT | blocking `'engaged'` beat | `LifeBeatDialog` card, words only (no painting) |
      | wedding DAY | `landWedding` | feed line + album milestone ONLY – **no screen (the defect)** |
      | funeral | blocking `'bereavement'` beat (only on careers with the weight mode on, `weightEnabled`, bereavement.ts) | `LifeBeatDialog` card WITH the funeral painting (`BEAT_FACE`) – it has its moment; he has likely never met one |
      | pregnancy NEWS | blocking `'expecting'` beat | `LifeBeatDialog` card, words only (the pregnancy art rides the portrait via `pregnancyFace`, not the card) |
      | birth DAY | `landBirth` | feed line + album milestone ONLY – **no screen (same defect)** |

    - **B1 · 11c SHIPPED – the wedding DAY and the birth DAY, one mechanism.** `lifeMomentOf(world)` (new,
      `engine/world/lifeMoment.ts`) derives the moment from the milestone ledger: the week a wedding/birth landed IS
      the current week – so no new state and no schema move. Payload `snapshot.lifeMoment` = {kind, week, face, line,
      confirm}; the LINE is the feed's own kept row (no new sentence), the painting is the album's table
      (`MEMORY_EMOTION`: bride / birth). `LifeMomentOverlay.vue`: the shared dialog-card, one Continue control,
      Escape dismisses, owns no sentence; gated behind every blocking question (`lifeMomentMayShow` – deliberately NOT
      in `blockingOverlay`'s list, the engine waits on nothing) and shown once per week (in-memory dismissal – a
      reload inside the same week shows it once more). Tests: `tests/component/life-moment-overlay.test.ts` (renders
      for a resolved wedding and not otherwise · Continue dismisses · the gate · the control inside 375x667 and
      320x568, with DOM arms that go red on a too-tall mutation AND a source mutation that drops the shared card),
      `tests/life-moment-engine.test.ts`. DRAFT: R46-S3, R46-S4.
      **LEFT (art call, not a moment):** the `'expecting'` announcement card has no painting – one row in
      `LifeBeatDialog`'s `BEAT_FACE` plus widening `MemoryFace` to the pregnancy faces would add it.
    - **OWNER RULED (05.10)**: «картинка для родов есть и для беременности две разных, проверь и
      добавляй» – the full set found and named: `adult-bride.webp` (named *bride*, which is why the
      first grep missed it), `adult-birth.webp`, `adult-pregnant-early.webp` /
      `adult-pregnant-last.webp`, `adult-funeral.webp` (wired v87, weight mode only). B1 shipped
      bride + birth; **B1b** wires the `'expecting'` card's early face and verifies the portrait
      serves `pregnant-last` late in term (else adds the late moment).
    - **B1b · SHIPPED (the agent built it, the architect finished it).** The `'expecting'` card wears
      `adult-pregnant-early` through `BEAT_FACE` + the stage-free `pregnantUrl` road – B1b correctly
      REFUSED the brief's «widen MemoryFace» (the pregnancy pair is no band face; a `FACE_BANDS` row
      would have broken the 11.09 lateCareer ruling) and typed the row as a local union instead. Its
      census test pins ALL 13 beat kinds (exactly two draw a painting: funeral, expecting) and the
      painting's band-independence at ages 12/19/25/33. The agent then hung waiting on its own test
      run and died unreported; the architect verified the diff by hand: the run was HONESTLY RED –
      the painting pushed the expecting card's unaided content to 681.2px against the v85 T10 phone
      floor of 635 (the TourBriefingDialog class). Fix: the expecting card wears the art as a 2:1
      band (`life-beat-art-compact`), the funeral keeps its v87 3:2 byte-untouched; file green 65/65
      (`B1B_TEST2_EXIT=0` from the log). **`pregnant-last` verdict**: served by the engine –
      `pregnancyFaceAt` (shared/avatarEmotion.ts:871) returns it for the final `PREGNANT_LAST_WEEKS`
      before the due week on the portrait, `pregnant-early` from the announcement; nothing more to
      add. No strings changed.
  - **11d** – the announcement can also carry «сколько они вместе» (how long together) – shares the
    duration primitive with #9. Class: **build**, DRAFT strings.
    - **B1 · 11d SHIPPED.** Primitive `relationshipDurationWeeks(world, episode?)` in `engine/world/loveEpisodes.ts`:
      the start is `episode.sinceWeek`, ALREADY in state – **no schema move**; null with no partner; a past
      attachment stops counting at `endedWeek`. **#9's personal page (B4) reads this same function.** Threaded into
      the `'engaged'` card: its `said` gets ONE appended sentence (`They have been together for 1 year and 6
      months.` – `engagedWithTogether` / `togetherSpan` in weddingCopy.ts); the pool lines are byte-untouched.
      DRAFT: R46-S1, R46-S2. Tests: `tests/life-moment-engine.test.ts` (11d block).

- [x] **12. «Надо проверить наш вординг на предмет дублей: "The one she married has something to say
  about this season / The one she married stayed back after the plates were cleared." The one she
  married повторяется дважды, давай может всё-таки напишем он, супруг, или вроде того. Мы за здоровые
  отношения.»** – the spouse feed card repeats «The one she married» in header AND first line.
  De-duplicate: pronoun / «her husband» forms. ⚠ Check first whether the phrase is deliberately
  gender-neutral (can she marry a woman?) – the replacement must survive the actual spouse model.
  New wording = DRAFT rows, his blessing. Class: **build**.
  - **B3 · 12 DONE – the heading no longer opens «The one she married»; the pool is untouched.** The dialog's
    heading and every pool line opened with the same four words, so the card said them twice in two lines.
    **Gender verdict:** the spouse model holds NO gender – `LoveEpisode.partnerName` is a first name drawn from
    `PARTNER_NAME_POOL` (28 fictional MALE names) and the copy law is «no gender anywhere in the pool» until he
    rules – so the form that survives any partner is his own «супруг»: **WIRED (R46-S7)** `Her spouse has something
    to say about this season` (one constant, `SPOUSE_VIEW_HEADING`). Alternates, not wired: S8 `Her husband has …`,
    S9 `He has …` (both gendered). **Left alone, listed so he can ask:** the Home card `The one she married wants a
    word.`, the four pool lines and two diary notes (`weekNotes.ts`) still carry the phrase – none is a repeat on
    one screen and the ask named the heading. Test: `tests/wave7-spouse-view.test.ts` §G – the heading and every
    pool line open on different three words, on the constants and on the card the engine assembles; heading
    reverted → 3 RED. The one literal pin that moved with the string is §C's heading assertion. DRAFT: R46-S7,
    R46-S8, R46-S9.

- [ ] **13. «Is there another year in this? - картинка съехала и голову обрезает»** – the
  season-decision screen's picture crops the head – same class as round 45 #7 (crop anchored too
  low). Find the screen, anchor the crop, pin it. Class: **build**.

- [ ] **14. «Индексный фонд не пересчитывается после изъятия почти всех денег и захода снова:
  "8131.90 units – bought at $9,969 each, $10,212 now / +$49,610,632 since you bought it (33%)" - я
  только пару недель назад зашёл на 80млн, они ещё не могли дать такой прирост»** – the index-fund
  cost basis survives a near-total withdrawal: after re-entering with 80M, «since you bought it»
  still claims +49.6M (33%). The basis must recompute on the re-entry (or the sell must realise the
  gain). Engine economy defect + tests over his exact scenario. Class: **build**.

- [x] **15. «Эта фраза вылезла 2 раза с разницей в месяц или два (и вообще он очень разговорчивый и
  часто повторяется): "…The next tournament is half a world away. I knew the life I married into.
  Some weeks I would just like it nearer."»** – the same spouse line verbatim twice within a month or
  two, and the spouse talks too often overall. Add a no-repeat memory (and look at the overall
  chattiness rate). ⚠ Likely touches the save schema if lines-said must persist. Class: **build**.
  - **B3 · 15 DONE – a no-repeat memory, DERIVED (no schema), and the chattiness measured: 5.18 → 2.92 per latched
    season.** **The road: derivation.** The save already keeps what is needed – every `'spouse-view'` row in the
    append-only, never-pruned `lifeLog` carries its week and its occasion (`detail`) – so `rollSpouseView` drops the
    occasions raised inside the last `ECONOMY.wedding.spouseViewNoRepeatWeeks` (52, a season) weeks and picks among
    the rest; none left = a silent week. **No schema bump, no migration, no golden fixture, no `e2e:fixtures`
    regeneration – and nothing new is saved** (H5 round-trips a world through JSON half way and the continuation is
    identical). **RNG:** the pick was already a purpose-scoped sub-stream (`<seed>:life:spouse-view:<week>`, never
    MAIN); it is still ONE draw on that key over fewer candidates, and a stale-only week derives no key. The frozen
    MAIN capture (`tests/condition.test.ts`) is green and the bench's input-independence arm (g) holds. **What he
    saw:** the pool is ONE line per occasion and the pick is uniform over the occasions true this week; three are
    true on most weeks, the 10-week cooldown was the only brake and the surface sat on it (spec §4: 5.13 of 5.2), so
    the line he had just heard came back with probability 1/2 to 1/3. **Chattiness, measured** (`bench:wedding
    --seeds 20`, 60 careers, one walk, 117.2 latched seasons in both arms): **5.18 → 2.92 beats per latched season**
    (predicted 2.5–3.0), mix within 2 points, every other bench line byte-identical. His cooldown of 10 is untouched;
    the one further knob is the window (78 → about 2.0, 104 → about 1.5, predicted) – his call. Tests:
    `tests/wave7-spouse-view.test.ts` §H (H1–H5 plus the old-roll control) – mutations: filter removed → 3 RED, window
    off by one → 2 RED, stream hoisted above the empty check → 2 RED. Spec: `the-wedding-2026-09.md` §6.

- [x] **16. «W11 2049 в календаре показали injured, на home injured walkover, но при этом пустили
  играть на w500 и далее выиграли 2 мачта, что-то странное было. Сейв во вложении»** – calendar said
  injured, home said injured walkover, yet she PLAYED the W500 and won 2 matches. ⚠ **The save did
  not reach this session** (and #20 says he currently cannot export saves at all). Hunt the
  injured-entry/walkover law in code + sim reproduction; ask him to re-send the save once #20 ships.
  Class: **measure/hunt**, honest status if not reproducible blind.
  - **B2 · 16 DIAGNOSED, REPRODUCED, FIXED** (the save never arrived – found in code, then reproduced on the
    unmodified build). **The engine is right and two screens lied.** The law: the surfaces he names – home's
    `snap.arrival` (`arrivalPreview`, snapshot.ts) and the Calendar grid (`calendarWeekFor` → `injuredNow`,
    weekDays.ts) – ask the CLINIC's `weeksRemaining` whether the layoff covers next week (`arrivalStatus` →
    `layoffCovering`); the tick asks what is left after `rollInjury` has ALSO paid the masseur's rehab week
    (injury.ts:395 and :419, `tickWeek` increments the week first, tick.ts:206). Clinic = 2 weeks left and his
    cadence landing on the next tick ⇒ screens «injured / walkover», tick 2 − 1 − 1 = 0 ⇒ cleared, the entered
    W500 is PLAYED (the walkover arm, phaseHerWeek.ts ~944-956, only fires on a still-injured arrival). One week
    wide per layoff and only on the cadence's parity – hence «что-то странное». Round 34 #21 closed this gap for
    the onset sweep and round 41 #19 for the dialog; the preview never got it and its own doc claimed «the layoff
    cannot move».
    **Killed:** walkover-then-play in one week (one if/else-if chain on one `enteredThisWeek`; the walkover arm
    stashes nothing); a play-time hole in the entry law (the verdict is re-read on the play week; the test asserts
    «plays ⇔ layoff over» in every sweep cell; the dev ▶▶ and `advanceWeeks` both run `tickWeek`); a pre-injury
    entry never re-validated (it is, on arrival).
    **Reproduced** (`tests/round46-arrival-masseur-parity.test.ts`, red before the fix): his state gave home
    `injured`, grid `injured`, tick `play`; the 54-cell sweep (3 rungs × layoff 1–6 × 3 cadence phases) disagreed
    in exactly 10 cells, every one «clinic has 2, cadence lands on the next tick». **Fix – a parity read, no
    wording, no RNG, no schema:** `arrivalPreview` asks `layoffCoversWeek(week, weeksRemaining −
    masseurRehabWeeksAhead, eventWeek)`; the Calendar grid and the Season chips go through the new
    `layoffHoldsWeek` (weekDays.ts), which reads the wire's `expectedWeeks` for the PLAYED week only. Byte-identical
    for every career without a masseur. One source pin re-aimed (`round12-view.test.ts:203`).
    **NOT touched – the architect's / owner's calls:** (a) the look-ahead rows (they start at week + 2) and the
    Season rows past next week still draw the clinic's window, so a calendar glanced at earlier can still say
    «injury» on a week the masseur then clears – widening it breaks round 34's «the countdown is not rewritten»;
    (b) the ENTRY GATE and the planner (`layoffCovering`, the clinic's window) still refuse a NEW entry or booking
    in a week the replay says she is back – the same class one gate over, and making `layoffCovering` masseur-aware
    is the entry law itself. **Still wanted:** his save once #20 ships, to confirm it was the masseur case
    (a masseur hired and two weeks left on the clinic's clock at W10).

- [~] **17. «А может быть нам какую-то микро языковую модель подключить для этих всех смолл токов
  можно (я знаю такие есть крохотные) и запускать прямо в браузере внутри приложения для генерации
  фраз и ответов? Это вообще возможно? Мне кажется это дало бы нам очень мощный буст вариативности на
  основе всех наших существующих фраз и всей истории уже сказанного ранее.»** – an in-browser micro
  LLM for smalltalk variability. Class: **answer** (the architect's feasibility analysis: size,
  offline-first, determinism law, voice control – with a recommendation and alternatives).
  - **ANSWERED IN CHAT, OWNER CLOSED IT: «уговорил.»** (05.10). The case: +100–350 MB before the
    prologue against the offline-first funnel; cross-device float nondeterminism against his own
    reproducible-variability law; a 135M–500M model against the wording law (unblessed strings,
    off his voice, hallucinating against the career). The path taken instead: build-time LLM
    generation he blesses in DRAFT batches + combinatorial slots + the #15 no-repeat memory +
    diary callbacks. **Smalltalk-corpus expansion goes to the NEXT round's list.** Full entry:
    decisions.md 05.10.

- [ ] **18. «Я нажал that's enough и снова увидел не наш красивый альбом, а набор детских фото и в
  конце 1 взрослую. Надо исправить, давать возможность посмотреть весь альбом и подумать какой вообще
  там флоу.»** – pressing «that's enough» (retirement) shows a legacy reel of childhood photos + one
  adult shot instead of the real album book. Route the epilogue to the full album and propose the
  flow. Class: **build** (+ the flow proposal in the report).

- [ ] **19. «Потраченные суммы на итогах снова не соответствуют действительности. А ещё там верстка
  пляшет. Можно миллионы сокращать до М, например и красиво все выстроить.»** – the summary's SPENT
  amounts are wrong **again** («снова» – check earlier rounds' ledgers; if a prior round reported
  this fixed, mark `[!]` REOPENED with what the first fix aimed at). Plus the layout dances; his
  formatting ruling: abbreviate millions to «M» and align. Same surface as #8 – one bundle. Class:
  **build**.

- [ ] **20. «Не могу сейв выгрузить кажется теперь никак из-за последнего экрана, у меня там много
  вопросов было на проверить. Может для служебных целей сделать там отдельную кнопку для сейва? Тогда
  я его смогу выгрузить на анализ»** – the final screen blocks reaching the save export; add a
  service export-save control reachable there (the ▶▶ 52 precedent: dev controls ship in every build
  by his ruling). Unblocks #16's save. Class: **build**.

- [ ] **21. «Если выбираем A daughter came later то имя точно не как у мамы должно быть мне
  кажется»** – in the epilogue's «A daughter came later» the daughter's name must never equal her
  mother's (the played kid's) name. Exclude it in the pick + test. Class: **build**.

- [x] **22. «хотел дождаться, чтобы она родила, но так и не случилось - может быть в целях разработки
  можно в найстройках сделать переключатель, поднимающий шансы наступления этих событий в разы для
  отладки?»** – a dev settings toggle multiplying life-event hazard rates (pregnancy/birth and kin)
  for debugging. ⚠ Design with the RNG law in hand: sub-stream hazards only, MAIN untouched, dev-only
  surface. Class: **build**.
  - **B1 · 22 SHIPPED.** A dev switch `▶ life events ×8 (dev)` in More beside `▶▶ 52 (dev)`. A TRANSIENT worker
    flag (`engine/world/lifeBoost.ts`), set by the new `devLifeBoost` command through the existing RPC (reply = the
    snapshot, whose `devLifeBoost` is the switch's state), on no `WorldState` – so in no save. It multiplies the
    probability at the four compares where a rolled uniform meets a chance (wedding, pregnancy, partner arrival,
    bereavement); `rollEnds` and every gate are untouched, so she still cannot marry before 23. **MEASURED** (30
    seeds, posed worlds, `tests/life-moment-boost.test.ts`): wedding first-fire mean OFF 208.3 weeks → ON 22.5
    weeks (185.7 weeks, 3.6 years, earlier); pregnancy arrives inside her window on 10/30 seeds OFF vs 26/30 ON;
    ON ≤ OFF on EVERY seed for all four hazards (the uniform per week is the same, `u < p` ⇒ `u < 8p`). OFF is
    `p * 1`, bit-identical: the byte-identity case, MAIN untouched, the frozen capture (`tests/condition.test.ts`) and
    the ten wedding/pregnancy/bereavement/birth wave files all green. ⚠ A save made UNDER the boost carries the
    boosted outcomes (an early wedding is a real wedding), never the switch. A dev surface, not a balance change –
    so no spec. DRAFT: R46-S6 (dev label).

---

## The plan – bundles by collision surface, sequential dispatch (token law 29.09)

Orientation facts the bundles are built on: spouse heading = `spouseViewCopy.ts:29` (header and the
`distant-swing` line both open «The one she married»); the bank-account ask is a birthday-gift row in
`birthday.ts:534` with no age gate visible; `lifeBeat/wedding.ts` is 121 lines and no wedding appears
in `LifeBeatDialog.vue`'s painting table (the funeral painting IS wired there, v87); the sell/withdraw
cards live in `ShopPanel.vue` + `MoneyScreen.vue`; the year summary is `SeasonSummaryDialog.vue` and
the spent-totals surface was already worked in round 31 (#19 is a REOPEN candidate – audit first);
«Is there another year in this?» = `RetirementDialog.vue`; «A daughter came later» = `EndingScreen.vue`;
the album ticket = `AlbumTicketPass.vue`; no −15% injury modifier surfaced for ANY asset in the first
grep – B9 confirms what «тоже» refers to before copying it.

| Step | Items | Surface owned (no two bundles share a file) | Model · budget |
| --- | --- | --- | --- |
| A0 (architect) | 7 probe, 3a probe | tools/ probes, read-only | – |
| B1 | 11a 11b 11c 11d 22 | `lifeBeat/wedding*`, `pregnancy.ts`, `LifeBeatDialog.vue`, calendar wiring, worker dev command | sonnet · 70 |
| B2 | 16 | engine entry/injury law, sim repro (read + fix if found) | sonnet · 50 |
| B3 | 12 15 | `spouseViewCopy.ts`, `weekNotes.ts`, no-repeat memory | sonnet · 55 |
| B4 | 9 | personal page (`KidScreen.vue`), consumes B1's duration primitive | sonnet · 40 |
| B5 | 8 19 | `SeasonSummaryDialog.vue` + the engine ledger it reads | sonnet · 55 |
| B6 | 13 18 20 21 | `RetirementDialog.vue`, `EndingScreen.vue` | sonnet · 60 |
| B7 | 1a 1b | `ShopPanel.vue`, `MoneyScreen.vue` asset cards | sonnet · 45 |
| B8 | 5 | `birthday.ts` age gate | sonnet · 30 |
| B9 | 14 | index-fund cost basis (economy module + tests) | sonnet · 45 |
| B10 | 6 | yacht injury modifier + bench/spec note | sonnet · 40 |
| B11 | 10 | between-matches screen overflow (`MatchScene.vue` candidate) | sonnet · 35 |
| B12 | 4 | `AlbumTicketPass.vue` rotation | sonnet · 25 |
| B1b | 11c art follow-up | `LifeBeatDialog.vue` BEAT_FACE + MemoryFace (pregnancy faces) | sonnet · 20 |
| B13 | 7 (ruled 05.10) | run ladders in `engine/economy/condition.ts` + probe + corridor re-pins | sonnet · 55 |
| B14 | 3 (ruled 05.10) | house entry-price indexation (shop quote path) + tests | sonnet · 35 |
| Architect | 3b ✓, 17 ✓, succession spec (ruled: Александра-мать · дом+машина+слайс через мультипликатор финиша · спека сейчас, стройка пост-лонч), gates, report | – | – |

Sequencing notes: B1 first (biggest, and #22's hazard multiplier shares its files); B2 early so a
found defect leaves room for a follow-up fix agent; B4 after B1 (the «how long together» primitive
is built once, in B1). Schema: any bundle that cannot derive its state does the FULL four-part move
(v92+, append-only), and says so in its report – B3's lines-said memory is the likely candidate, the
brief's preference is derivation from the diary.

## Cross-references

- #3a is the round-45 #10 class (the brand grind) on a new asset class.
- #8 + #19 are one surface (the year summary) – one bundle, and #19 may be a REOPEN (audit first).
- #9 + #11d share the «how long together» primitive – build it once.
- #12 + #15 share the spouse voice/corpus surface – one bundle.
- #16 is blocked on a save that #20 unblocks – ship #20, then ask for the save again.
- #17 answers feed #15's design (the no-repeat memory is the non-LLM half of his variability ask).
- #18 + #20 + #21 live on the epilogue surface – one bundle.

## DRAFT strings (R46-S…)

Every PLAYER-FACING string a builder adds this round lands here as a draft for the owner's blessing (invariant 4:
a label, tab, button or sentence on screen changes only when the task asked, and these are the new ones the asks
required). Rows are appended in the order they are written; ids continue where the last builder stopped (B1 holds
S1–S6, B3 holds S7–S9). A row the owner rewords changes ONE constant, named in the second column.

| id | where | the line |
|---|---|---|
| R46-S1 | 11d – the `'engaged'` announcement card, appended after her line (`weddingCopy.ts` `engagedWithTogether`) | `They have been together for {span}.` – e.g. `They have been together for 1 year and 6 months.` |
| R46-S2 | 11d – the span words (`weddingCopy.ts` `togetherSpan`; #9's page may reuse them) | `1 year` · `{N} years` · `1 month` · `{N} months` · `{N} years and {M} months` · `less than a month` |
| R46-S3 | 11c – the one control on the full-screen wedding / birth moment (`lifeMomentCopy.ts` `LIFE_MOMENT_CONFIRM`) | `Continue` |
| R46-S4 | 11c – NOT new: the lines the moment shows are the feed's EXISTING kept lines, unchanged (listed so he knows what the new screen will say) | wedding: `Her wedding day. The family was there, whatever had been said about it.` · birth: `Her daughter was born this week. The family has somebody new in it.` |
| R46-S5 | 11b – the calendar band (`CalendarScreen.vue`), the shared week label and dates beside it | `Her wedding` |
| R46-S6 | 22 – dev-only label in More (not player copy; listed for completeness) | `▶ life events ×8 (dev)` |
| R46-S7 | 12 – the spouse beat's heading, **WIRED** (`spouseViewCopy.ts` `SPOUSE_VIEW_HEADING`; the dialog's frame over the line; was `The one she married has something to say about this season`, which opened with the same four words as the line under it) | `Her spouse has something to say about this season` |
| R46-S8 | 12 – ALTERNATE for S7, NOT wired (the same one constant) | `Her husband has something to say about this season` – gendered: the partner's name pool is 28 male first names, so it never contradicts a name on screen, but the schema holds no gender and the pool's «no gender» law stands until he rules |
| R46-S9 | 12 – ALTERNATE for S7, NOT wired (the same one constant) | `He has something to say about this season` – his own «он» and the shortest; the Home card above it (`The one she married wants a word.`, unchanged) is its only antecedent; also gendered |
| R46-S10 | 9 – the personal page's relationship line, **WIRED** (`kidLife.ts` `togetherNote`, one function; the sentence sits under the tile grid on `KidScreen`, beside the school and college notes; the span words are S2's and are not repeated here) | `Together with {name} for {span}` – e.g. `Together with Anton for 1 year and 6 months` · married: `Married to {name} – together for {span}` · before the engagement has written a name: `Together for {span}` · married with no name (hand-built rows only – the engine names him at the engagement, before any wedding): `Married – together for {span}` |
| R46-S11 | 9 – ALTERNATE for S10, NOT wired (the same one function) | name-first and shorter: `{name} – together for {span}` · `Together for {span}` · `Married to {name} – together for {span}`; the cost is that the unnamed form reads as a fragment with no subject, which is why S10 keeps «with» in the named form |
