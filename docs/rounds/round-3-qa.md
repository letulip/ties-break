# Round 3 – owner Q&A (19 items)

Source: `docs/decisions.md` § "Owner Q&A round (19 items, all approved)", 2026-07-22. That section
is Claude's English digest of the owner's answers, not a verbatim transcript – the Russian titles
below are a reconstruction from that digest (the owner's own phrasing wasn't preserved in the repo
for this particular round), kept short and close to how he put each point in the conversation.

- [x] **Seed – убрать из онбординга** (сид всегда генерируется, показан в More для шаринга/репродукции)
      → Package K, `docs/specs/package-k-careers.md`; More screen "Seed" row with copy button.
- [ ] **Kid tab по имени ребёнка + Team card (коуч, физио)**
      → частично: таб переименован в "Kid" (не в буквальное имя ребёнка) и профиль там живёт; карточка
      команды (коуч/физио) не сделана – коуча/физио как отдельных сущностей ещё нет в движке →
      Phase 4/5, вместе с системой развития.
- [ ] **Возрасты: 5 стадий по арту (5-7/11-12/18/28/35), ускоренный пролог для стадий 1-2**
      → частично: полный life-arc арт (jun/teen/young/adult/milf × эмоции) отгружен в round 5, но сам
      ускоренный детский пролог (стадии 1-2, недельная детализация с ~13-14) не реализован →
      Phase 6. `START_AGE_YEARS=14` остаётся заглушкой, не решением.
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
- [x] **Career profiles** (careerId, список карьер в More, отдельные сейвы на карьеру)
      → Phase 3 / Package K, до основных данных мира, как и требовалось.
- [x] **Match viz polish mini-package**: дотягивание игроков до мяча по обеим осям, подсветка
      подающего, реальные смены сторон с паузой
      → round-4 viz, `docs/specs/round4-viz.md` §1-3.
- [ ] **Radar chart (Phase 4)** – оси без цифр, контур проявляется по мере уверенности коуча
      → не сделано, Kid screen показывает только заглушку "Skills & development – Phase 4" →
      Phase 4.
- [x] **Match results commit до просмотра; реплеи ~100 байт**
      → результат считается заранее (детерминированно) как и просили; ОДНАКО момент КОММИТА очков/
      ранга в мир позже изменён `feat/tournament-experience` (schema v8) на пост-ревью –
      "reveal, don't re-run": очки/ранг фиксируются только после того, как игрок прошёл раунды, а не
      сразу при разрешении недели. См. `docs/specs/tournament-experience.md`. Реплеи – `WorldMatch`
      (seed + скилл-снапшоты), компактны, как и просили.
- [x] **Dependency graph (mermaid) в plan.md**
      → `docs/plan.md` § "System dependency graph", поддерживается по фазам.
- [ ] **Weather (Phase 3/4 backlog)** – дождь/жара/ветер, indoor/outdoor флаг
      → не сделано → Phase 3/4 backlog.
- [ ] **Age curves для точности/мощности (Phase 4)** – свои возрастные кривые, калиброванные
      харнессом
      → не сделано, движок пока без возрастных кривых параметров → Phase 4.
- [x] **Birth month = relative age effect** – пик при онбординге
      → поле `profile.birthMonth` отгружено в round-6 (schema v9, `docs/rounds/round-6.md`); САМ
      эффект (временное преимущество/дефицит в возрастных когортах) ещё не подключён → Phase 4/6.
- [ ] **Mom or dad при онбординге** – тональность пресетов текстов, оба варианта без карикатуры
      → не сделано, нужен арт родителя → Phase 6.
- [x] **Spacing discipline (4/8/12/16/24)**
      → применено как проход в следующем UI-пакете и закреплено как стоящее правило (см. комментарии
      в `style.css`, напр. у `.pill`).
- [x] **«Рычаги» меняются по мере взросления (ключевой принцип)** – детство: прямое управление тренировкой
      → юниоры: выбор людей/календаря/денег → взрослость: влияние через отношения/финансы/наследие
      → принят как несущий принцип продукта (`docs/plan.md`), исполняется по фазам 3→6, не отдельная
      фича с единой датой готовности.
