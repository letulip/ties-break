# Round 3 – owner Q&A (19 items)

Source: `docs/decisions.md` § "Owner Q&A round (19 items, all approved)", 2026-07-22. That section
is Claude's English digest of the owner's answers, not a verbatim transcript – the Russian titles
below are a reconstruction from that digest (the owner's own phrasing wasn't preserved in the repo
for this particular round), kept short and close to how he put each point in the conversation.

> **STATUS, re-audited 09.08 (backlog #88).** Seven boxes were open. Two are now ticked – the
> **radar** (which this round's own decision parked, and which shipped 29.07) and the **age curves**
> (shipped as the development curve plus serve speed's own). Five remain genuinely open, and each
> one's note below now says what was verified rather than what was assumed in July.

- [x] **Seed – убрать из онбординга** (сид всегда генерируется, показан в More для шаринга/репродукции)
      → Package K, `docs/specs/package-k-careers.md`; More screen "Seed" row with copy button.
- [ ] **Kid tab по имени ребёнка + Team card (коуч, физио)**
      → частично: таб переименован в "Kid" (не в буквальное имя ребёнка) и профиль там живёт; карточка
      команды (коуч/физио) не сделана – коуча/физио как отдельных сущностей ещё нет в движке →
      Phase 4/5, вместе с системой развития.
      → **REASON CORRECTED 09.08 – the old one is now false, but the item is still open.** The coach
      IS a full entity: a named roster with rungs and a market screen (`src/engine/coach.ts`,
      `src/engine/world/coachMarket.ts`, `src/components/screens/CoachMarketScreen.vue`,
      `docs/specs/coach-tiers.md`), and the Kid screen carries a **Coach tile** – who she trains with
      today, his rung, and the door to the market. The physio is a real paid service too
      (`world.physioActive`, `physioRiskFactor`). What is still missing is the rest: the physio does
      not appear on the Kid screen at all (only in the planner, the wallet and the calendar), there is
      no single Team card, and the tab is still called "Kid". Two thirds of a card, so not ticked.
- [ ] **Возрасты: 5 стадий по арту (5-7/11-12/18/28/35), ускоренный пролог для стадий 1-2**
      → частично: полный life-arc арт (jun/teen/young/adult/milf × эмоции) отгружен в round 5, но сам
      ускоренный детский пролог (стадии 1-2, недельная детализация с ~13-14) не реализован →
      Phase 6. `START_AGE_YEARS=14` остаётся заглушкой, не решением.
      → **STILL OPEN, verified 09.08** – backlog #71. `src/engine/world/age.ts` still says "detailed
      weekly simulation starts here; childhood becomes a prologue (Phase 6)". The spec exists
      (`docs/specs/childhood-prologue.md`) and the engine has been built to receive it – the serve
      speed is a function of age rather than a two-row table precisely so `serveSpeedBase(6)` already
      answers, and `src/art/weeks.ts` reserves a band for it – but nothing runs a childhood.
- [x] **News = события/вехи, Money = леджер** (структурированные события вместо плоского log)
      → Phase 3, `WorldEventType` в `shared/protocol.ts`; News/Money разделены на отдельных экранах.
- [x] **Fast-forward = 1 месяц (4 нед.) с авто-стопом на событиях; «52» → dev-инструмент**
      → Package N, `game.advance(1|4)` + `stopReason`; "▶▶ 52 (dev)" в More/Danger zone.
- [x] **Шапка с деньгами кликается в Money**
      → `App.vue` `.status-pill` → `tab = 'money'`; после round-6 таба "Money" в панели нет, но пилюля
      по-прежнему туда ведёт (см. round-6.md).
- [x] **Saves: один автосейв (2 поколения) + именные + confirm-попапы**
      → Package K2, `src/db/saves.ts`, `ConfirmDialog.vue`.
- [ ] **Gallery ("Moments")** – посты по значимым событиям, архив вычищенных News
      → не сделано → Phase 6 (framework можно готовить раньше, per исходное решение).
      → **LEFT OPEN 09.08, and this one is a judgement call the reader should be able to re-make.**
      Three shipped things stand in its neighbourhood and none of them is it: the **family diary**
      (`docs/specs/family-diary.md`, `src/engine/diary/*`) writes a post about the week just gone
      with a photo card, which is "посты по значимым событиям" on a weekly cadence; the **ending
      album** (`src/components/EndingScreen.vue`, `docs/specs/endings-and-the-album.md`) is seven
      polaroids of the career's milestone weeks; the **trophy cabinet**
      (`src/components/screens/TrophiesScreen.vue`) is a gallery of every piece of silverware.
      What does NOT exist is the item as asked: a Moments SCREEN, and an archive of cleared News –
      `pruneEvents` in `src/engine/world.ts` caps the feed at 400 rows and drops the excess; only
      rows marked `keep: true` (milestones) survive, and nothing collects them anywhere.
- [x] **Career profiles** (careerId, список карьер в More, отдельные сейвы на карьеру)
      → Phase 3 / Package K, до основных данных мира, как и требовалось.
- [x] **Match viz polish mini-package**: дотягивание игроков до мяча по обеим осям, подсветка
      подающего, реальные смены сторон с паузой
      → round-4 viz, `docs/specs/round4-viz.md` §1-3.
- [x] **Radar chart (Phase 4)** – оси без цифр, контур проявляется по мере уверенности коуча
      → **SHIPPED 29.07** – `docs/specs/skills-radar.md`, `src/engine/radar.ts`,
      `src/components/SkillsRadar.vue`, on the Kid screen where the placeholder was. The spec names
      this round as its origin: "the idea has been parked since round 3 waiting for two things that
      did not exist" (the coaches and real development), and both landed that week. Built exactly as
      asked – no numbers on the axes, and the contour sharpens as the coach sees more of her: "the
      solid shape is where she is; the haze around it is how sure he is". ⚠ Round 15's item 15 finds
      the one thing it lacks: the dashed CEILING edge has no legend anywhere.
- [x] **Match results commit до просмотра; реплеи ~100 байт**
      → результат считается заранее (детерминированно) как и просили; ОДНАКО момент КОММИТА очков/
      ранга в мир позже изменён `feat/tournament-experience` (schema v8) на пост-ревью –
      "reveal, don't re-run": очки/ранг фиксируются только после того, как игрок прошёл раунды, а не
      сразу при разрешении недели. См. `docs/specs/tournament-experience.md`. Реплеи – `WorldMatch`
      (seed + скилл-снапшоты), компактны, как и просили.
- [x] **Dependency graph (mermaid) в plan.md**
      → `docs/plan.md` § "System dependency graph", поддерживается по фазам.
- [ ] **Weather (Phase 3/4 backlog)** – дождь/жара/ветер, indoor/outdoor флаг
      → не сделано → Phase 3/4 backlog **#67**. Verified 09.08: no weather concept anywhere in
      `src/`, and no indoor/outdoor flag on a tournament. Genuinely open.
      → ⚠ **REASON CORRECTED 24.08 – "no weather concept anywhere in `src/`" is false, and the item
      is still open.** A COSMETIC weather layer shipped 29.07 and is live: `eventTemperature`
      (`src/engine/season/preview.ts:147`) puts a deterministic degrees figure on
      `EventPreview.temperatureC`, `WeatherPlate.vue` draws it on the Season card and over the
      court, and `viz/preview.ts` speaks it in the pre-match commentary (round-17 #25). What is
      absent is everything MECHANICAL the item asked for: no rain, no wind, no indoor/outdoor flag
      on a tournament, and the temperature reaches nothing in `src/engine/` – it is read only for
      display. So the row stands, but as "the weather does nothing", not "there is no weather".
      The backlog row is [the-living-world.md](../backlog/the-living-world.md) #10.
- [x] **Age curves для точности/мощности (Phase 4)** – свои возрастные кривые, калиброванные
      харнессом
      → **SHIPPED, in a different shape than the ask, and the difference matters.** The engine has
      age curves: `ECONOMY.development.ageCurve` + `ageFactor()` / `declineFactor()` in
      `src/engine/development.ts` (steep 13→18, plateau from 23, decline from 29, calibrated to the
      plan's own targets – "first points 17-18, top-100 about 4.5 years later"), and serve speed has
      its own logistic in `src/engine/match/serveSpeed.ts` after the owner's «мои "пушки" показывают
      иной раз 160+ км/ч». The relative age effect on top of it is `relativeAgeHeadStart`
      (`docs/specs/relative-age.md`), and the whole model was benched –
      `docs/specs/skill-model-audit-2026-08.md`.
      ⚠ NOT PER-ATTRIBUTE, and the named attributes never existed: it is ONE curve over all five
      skills (`serve`, `ret`, `composure`, `stamina`, `groundstrokes`), and there is no "точность" or
      "мощность" attribute to give its own curve to. The old note – "движок пока без возрастных
      кривых параметров" – is simply false now, which is why this box moved.
- [x] **Birth month = relative age effect** – пик при онбординге
      → поле `profile.birthMonth` отгружено в round-6 (schema v9, `docs/rounds/round-6.md`); САМ
      эффект (временное преимущество/дефицит в возрастных когортах) ещё не подключён → Phase 4/6.
      → **NOTE CORRECTED 09.08: the effect IS connected now** (the box was already ticked for the
      field alone). `relativeAgeYears` / `relativeAgeHeadStart` in `src/engine/development.ts` give
      the December girl a real deficit at `createWorld` and let it wash out through the age curve –
      "the birth month stops being decoration", `docs/specs/relative-age.md`. Round 15's ruling 1
      («Есть год рождения и дата. Это всё») is the next move on the same thread: the age BAND stops
      standing in for her age on every surface and gate.
- [ ] **Mom or dad при онбординге** – тональность пресетов текстов, оба варианта без карикатуры
      → не сделано, нужен арт родителя → Phase 6. Verified 09.08: no parent-gender concept anywhere
      in `src/` and no parent art in `public/images/`. Genuinely open.
- [x] **Spacing discipline (4/8/12/16/24)**
      → применено как проход в следующем UI-пакете и закреплено как стоящее правило (см. комментарии
      в `style.css`, напр. у `.pill`).
- [x] **«Рычаги» меняются по мере взросления (ключевой принцип)** – детство: прямое управление тренировкой
      → юниоры: выбор людей/календаря/денег → взрослость: влияние через отношения/финансы/наследие
      → принят как несущий принцип продукта (`docs/plan.md`), исполняется по фазам 3→6, не отдельная
      фича с единой датой готовности.
