---
type: round-ledger
status: current
area: rounds/28
canonical: false
last-reviewed: 2026-08-28
---

# Round 28 – a full career replayed, 17 items (28.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in his own numbering, from one playthrough carried past college into the pro years.**
Read off save `alice-cfbv_w675` (⚠ his personal save, `~/Downloads`, READ-ONLY – never copied into the
repo, never a fixture) plus three screenshots: the Trophies cabinet, and two Season views.

⚠⚠ **THIS SAVE PREDATES THE COLLEGE FIXES.** It was played on `main` before
[#112](https://github.com/letulip/ties-break/pull/112) existed, so anything round 27 closed is
**not in this build**. Item 3 is the visible case and it is not a regression – see its line.

⚠ **THIS FILE IS THE LEDGER, NOT THE ARGUMENT.** Diagnoses, measurements and refusals live in the
specs each item names.

⭐⭐ **Items 3, 11, 12, 13 and 16 are not five questions.** 11/13/16 are one question asked from three
directions – *she reaches the top 100, and yet the 250s and 500s are a wall* – and 12 is the schedule
that feeds them. They are measured together or not at all, and they inherit round 27 §3, which was
held open for exactly this reason.

---

- [x] **1. «При наличии массажиста добавить в соответствии с выбранным тиром сессии массажа в
  расписании»** – **build.** The masseur is bought and billed but never appears in the week. The tier
  should decide how many sessions land, the way the coach's tier decides his.
  ⭐ **SHIPPED, and it was a SURFACING job – no schema move.** The dial already existed
  (`masseurSessionsPerWeek`, `ECONOMY.masseur.rungs` = 2 / 4 / 7); no week had ever drawn one of its
  sessions. `CalendarWeek.masseurDays` now carries exactly `masseurSessionsPerWeek` day indices
  (`masseurDaysFor`: her training days first, then the free ones – so `Daily` is every day) and
  `weekGrid.ts` draws one `Body work` hour on each, in the last free hour of that day so it can never
  paint over a session. ⚠ **The weeks that draw NONE are the weeks the ENGINE pays him nothing for** –
  college, a booked family week, a trip he did not travel to, and a SHOOT week (`accrueCondition`:
  «lights and flights, not his table»). Evidence: `tests/component/round28-week-and-season.test.ts`
  mounts CalendarScreen at two rungs and counts the rendered blocks – 2 vs 7, each equal to its rung –
  and the middle rung lands at 4. Mutation-verified five ways (rung ignored → red; hire clause dropped
  → red; shoot exemption dropped → red).

- [ ] **2. «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой уже
  истёк срок рассмотрения мне казалось мы договаривались про 5 недель»** – **build.** w44 → w48 is
  **four** weeks of shelf life against a ruling of five. Either the constant is 4, or it is 5 and the
  arithmetic is inclusive/exclusive by one. ⭐ His memory of the ruling is the spec here.

- [ ] **3. «Снова "один день" на день рождения. Эта правка была до колледжа или нет ещё? Может быть
  надо какую-то логику дополнительную сделать, например раз в несколько лет иди просто вообще 1 раз
  только такое пожелание показывать?»** – **answer + ask, NOT a reopen.** ⚠ The fix is round 27 #7 and
  it is sitting in [#112](https://github.com/letulip/ties-break/pull/112), unmerged – **this save was
  played without it.** Shipped there: a one-birthday cooldown on the VOICE, longest run **4 → 1**,
  careers that ever run three in a row **4 of 12 → 0 of 12**, share 30% → 24%. ⭐ **But he is now
  asking for something stronger than what #112 ships** – «раз в несколько лет» or «вообще 1 раз». That
  is a new ruling, not the old fix, and it collides with his 11.08 ruling that the day must stay on the
  card every year. Sharpened as an ask below.

- [x] **4. «Для съёмочных недель для спонсоров надо сделать какие-то отдельные плашки или хотя бы
  какой-то символ выделения в календаре в сезоне»** – **build.** A shoot week is currently
  indistinguishable from a training week in the season feed.
  ⭐ **SHIPPED, also pure surfacing** – the feed already had the fact (`snapshot.adShoot.weeks`) and
  never read it. `CalendarRow` gained a `shoot` FLAG beside `injured`/`exam` rather than a `kind`,
  because a shoot week is «not blocked and not double-charged»: a tournament, a family week and a
  friendly on a shoot week all genuinely happen, so a mark that had to displace one of them would lie
  about the week on the four rows it is not. The chip (`.shoot-chip`, the wallet's `--cat-shop`
  magenta, the injury chip's shape) therefore renders on **all five row shapes**, and a week with
  nothing else on it is also TITLED `Shooting week`. Evidence:
  `tests/component/round28-week-and-season.test.ts` – a shoot week renders the mark, a training week
  does not, and two named weeks render exactly two marks. Mutation-verified three ways.

- [ ] **5. «2 травмы за первый год после колледжа»** – **measure.** ⚠ Prevalence was measured this
  month at **30–54%** across a career; two in one season is a different statistic (a per-season rate),
  and it has never been read out. ⚠⚠ And college suspends body cost entirely (round 27 #11, his own
  ruling) – **the first year back is the first year her body is loaded again**, so the question may be
  a re-entry spike rather than a rate.

- [x] **6. «И на кнопки соответственно перед съёмочной недели тоже надо писать Shooting week и как бы
  в продолжении деле тоже комбинации делать и тренировочных дней и слоты фотосессии добавлять»** –
  **build**, and it is 4's other half: the button that advances into a shoot week must name it, and the
  week itself should mix training days with shoot slots rather than consuming the whole week.
  ⭐ **SHIPPED, both halves.** (a) `useWeekAhead` gained a `shoot` kind labelled **`Shooting week`**,
  sitting exactly where `lookAheadFor` puts a shoot – below the bookings and an entered event, above
  the blackouts – so the marker under the grid and the button above the tab bar cannot disagree; it
  feeds BOTH week controls through `useWeekAction`, and `QUIET_AHEAD` gained `'shoot'` so the span
  pill behaves exactly as it did (the engine ticks straight through a shoot week). (b) The week
  COMBINES: a ninth `DayKind` `'shoot'` takes **the plan's free days and only those**, which is the
  engine's own charge drawn – `accrueCondition` pays a shoot week the travel figure, i.e. it keeps her
  sessions and forfeits the REST. Her session count does not move; the eyebrow and the read-out name
  the brand. Evidence: mounted assertions that `.cal-go-btn` reads `Shooting week` on a shoot week and
  `Training week` otherwise, and that the drawn week carries training blocks AND shoot blocks with the
  shoot landing on exactly the free days. Mutation-verified (label branch deleted → red; shoot takes
  every day → red; shoot takes none → red).

- [ ] **7. «Что с остальными разделами магазина? Яхты, самолёты, строительство академии»** –
  **answer.** Slice 1 (cars) shipped; the spec carries yachts, the parents' plane and the academy.
  Their queue position is his call.

- [ ] **8. «На странице коучей в верхнем блоке с недельными тратами и доходами можно совокупную всю
  цифру показывать с учётом массажиста (и психолога в будущем), и даже на магазин растянуть, т.к. там
  тоже есть и с доходностью инструменты и с расходом»** – **build.** One weekly figure that actually
  totals the household, not just the coaching line.

- [ ] **9. «Может быть с появлением магазина надо переписать спеку про безусловную % доходность на
  текущий счёт? И оставить этот момент уже на управление игроку, убрав текущую автоматическую, т.к.
  довольно часто на текущий счёт никаких % не приходит в банке обычно»** – **ask.** ⭐ He is right about
  the real world, and this is a balance decision, not a bug: the automatic interest is a large silent
  income line. Removing it makes the shop's yield instruments matter and makes the parent manage money
  – it also removes a floor that the economy may currently lean on. Needs a measurement before a ruling.

- [x] **10. «На всплывающих сверху уведомлениях есть кнопка Dismiss с 3 словам на ней, выглядит
  неаккуратно, давай просто оставим Dismiss и всё»** – **build.** One word, one button.
  ⭐ **SHIPPED. Three top-of-screen notification surfaces, enumerated:** `.recovered-banner` (damaged
  autosave) and `.stop-toast` (the advance's stop reason) both carried the three-word copy and now
  read exactly `Dismiss`; `.update-banner` (the PWA update prompt) has no dismiss control at all – its
  only button is `Update` – and is asserted as such so the day it grows one, it gets the same word.
  ⚠ This OVERRULES defect D11, which had deliberately put the disambiguation in the VISIBLE copy; the
  two banners can be on screen together, so the names moved to `aria-label` («Dismiss autosave
  notice» / «Dismiss stop notice»). WCAG 2.5.3 is satisfied, not breached: each label STARTS with the
  visible word. `tests/a11y-banner-names.test.ts` is **re-aimed, not deleted**, and points at the new
  layer. ⭐⭐ **And `App.vue` is mountable for the first time** – the `virtual:pwa-register` import that
  blocked it is now aliased to a stub on the `component` project alone – so
  `tests/component/round28-top-notices.test.ts` raises both strips at once and asserts the RENDERED
  text, which is the claim D11 could only ever state backwards. Mutation-verified: restoring the old
  copy turns three blocks red.

- [ ] **11. «Alice за 2 года до топ-100 добралась, это нормальный темп?»** – **answer**, and the
  measurement already exists: [how-fast-she-grows-2026-08.md](../specs/how-fast-she-grows-2026-08.md).
  ⚠ Median first top-100 is **18.9** and the research anchor is ~22, with 22 sitting at the **p90** –
  so no, two years is not normal, it is the median case of a curve we already know is too fast. Round
  27 §9. ⭐ **This is the same finding he is reporting from the other end in 16.**

- [ ] **12. «Посмотри на скриншот с распределением турниров… Давай подумаем как распределить турниры
  по году ещё раз в зависимости от уровня игрока и закрывать дыры одновременно в расписании… Проверь
  пожалуйста доступные турниры для Alice из сейва и сравни с выдачей в сезоне, всё ли корректно?»** –
  **measure first, then build.** Two claims to check separately: (a) the calendar has holes – his
  screenshot shows runs of three and four consecutive training weeks; (b) the entitlement he can see
  («Also open to her: WT125 Grass – none scheduled in the next 8 weeks») disagrees with what the season
  actually offers. ⭐ His own proposal: **let higher tiers replace lower ones** so density and choice
  survive as she climbs.

- [ ] **13. «Нормально ли с Alice с таким количеством вылетов в первых раундах вообще до топ-100
  добирается? Или мне только кажется, что это странно?»** – **answer.** ⚠ This is the sharpest question
  in the round, because it points at a possible contradiction in the model rather than at a defect:
  first-round exits and a top-100 rank should not coexist this comfortably. ⚠⚠ It also touches round
  27 #14 (**our favourites are SAFER than the research, 11% vs 19.2%**), which he has just put on hold –
  answering 13 must not quietly re-open 14.

- [ ] **14. «Нужно ли на время колледжа приостановить накопление % на выплаты ребенку от выигрышей или
  нет?»** – **ask.** ⭐ College already suspends the coach and the masseur and zeroes body cost; her
  cut is the one standing instruction that has never been examined against the freeze.

- [ ] **15. «С чеков спонсоров мне кажется ребёнку тоже нужно % перечислять, как и с призовых, давай
  сделаем»** – **build.** A ruling, not a question: her cut extends to sponsor cheques.

- [ ] **16. «250 и 500 всё ещё выглядят почти как стена… в 35 году она взяла 2 250 победой, а с тех
  пор после колледжа смогла только 1 раз до 2 места дойти… А в 500 вообще пусто. При этом она около
  топ-100. Проверь пожалуйста этот момент. И вообще оцени её перформанс опираясь на скиллы и
  статистику»** – **measure.** The cabinet: **WT250 champion ×2 (both '35), runner-up ×1 ('42), WT500
  empty, WT1000 empty.** ⚠⚠ **The shape he is describing is a career that got WORSE after college
  while its rank did not** – two titles at 17-ish, nothing for seven years. That is the growth curve
  (round 27 §9: 90% of her ceiling spent by **16.4**) seen from the trophy cabinet, and it is why §3
  was held. ⭐ His «оцени её перформанс опираясь на скиллы» is the right instrument: read her actual
  skills out of the save and ask what result they DESERVE.

- [ ] **17. «Baseline athletic 2 раза письмо о спонсорстве прислали на 48 и 52 неделе одинаковое»** –
  **build.** A duplicate offer from one brand four weeks apart. Related to 2 – both are the sponsor
  offer clock – and they belong to one agent.

---

## Rulings he gave with this round

| | what he said | effect |
| --- | --- | --- |
| round 27 **1/1a/1b** | «если у нас всё ок – мне ок» | ⚙ **delegated to me** – pick the entry-age band and build it |
| round 27 **3** | «надо что-то придумать с этим. Какие варианты?» | ⚙ options owed, see below |
| round 27 **8** | «да, я уже понял, не страшно» | ⚙ **CLOSED**, no repair |
| round 27 **14** | «тогда на стопе пока» | ⚙ **ON HOLD** by his ruling – must not be re-opened sideways by 13 |

## What this round is waiting on

| | what | who |
| --- | --- | --- |
| ⚠ **first** | **the growth curve** – 11, 13 and 16 all reduce to it, and 12 feeds it | measurement, then him |
| **ask** | 3 – how hard to suppress the birthday day, against his 11.08 ruling | the owner |
| **ask** | 9 – remove automatic interest, or keep it as a floor | the owner, after a measurement |
| **ask** | 14 – does her cut pause during college | the owner |
| **ask** | 7 – queue position for yachts, the plane and the academy | the owner |
