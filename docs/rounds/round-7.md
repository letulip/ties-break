# Round 7 – economy pain pass + match/audio/season-UI polish (21 items)

Source: two-part pass on `feat/round5-season-ux`, covering the owner's post-playtest round-7 list
(21 numbered items). **Part 1 – economy** shipped in commit `91cd77a` ("Round-7 pt1: economy pain
tuning, expense breakdown, real tier strip, season-end popup"); there's no standalone
`docs/specs/round7-economy.md` for it, the commit message is the spec of record for that half.
**Part 2 – match/audio/season UI** has a full written spec, `docs/specs/round7-match-audio.md`, and
shipped in commit `66f5dde`. Item numbers below match the owner's own list, per that spec's own
note ("Owner item numbers below match his list").

Gates (part 2, superset of part 1's): `npx vue-tsc -b` clean, `npx vitest run` → 308 passed (304
baseline + 4 new timeline-gap tests), `npm run build` clean, live-verified at 375 px.

- [x] **Экономика «боль»** – единый конфиг-файл `src/engine/economy.ts` (`ECONOMY`): доход
      родителя, расходы, спонсор, клапан – всё оттуда; экипировка построчно по категориям,
      с тиеринговым флейвор-текстом по классу; спонсор нужде-ориентирован (платит только
      working); wealthy-фактор расходов ×1.25 → ×1.4; клапан продуктового спонсорства (rank ≤30 –
      половина стоимости экипировки, ≤10 – бесплатно, событие всё равно эмитится). 52-недельный
      burn на неспонсированном ребёнке (batch из 16 сидов, `tests/economy.test.ts`): working
      ≈$5.8k, middle ≈$11.2k, wealthy ≈$17.7k – внутри целевых полос владельца (проверено прогоном
      теста напрямую: working 5782/mid 11225/wealthy 17722). Schema **v10**
      → `src/engine/economy.ts`, `src/engine/world.ts`, `src/shared/protocol.ts`, commit `91cd77a`.
- [x] **Ручки экономики** – все тюнинговые величины сведены в один файл `economy.ts` (единая
      ручка владельца, как и просили). UI-ручки бюджета игрока (тир экипировки/тренер в
      разъездах или нет/физио вкл-выкл в Money) в этот проход не вошли – вынесены в отдельный
      follow-up после этого пасса, см. `docs/decisions.md` § "2026-07-24 – Phase 4/5/6…" ("UI-ручки
      кошелька")
      → `src/engine/economy.ts`.
- [x] **Money – круговая диаграмма трат** – SVG-donut без зависимостей + построчная разбивка по
      категориям, переключатель "12 недель / этот сезон", доход одной зелёной строкой сверху,
      леджер остаётся ниже
      → `MoneyScreen.vue`.
- [x] **Season strip = реальный прогресс по тирам** – строится от `bestFinishByTier`
      (Local/Regional/National реально отражают лучший результат, ITF по-прежнему заблокирован
      до Phase 3), заглушка "Phase-3 hint" убрана
      → `HomeScreen.vue`, поле `bestFinishByTier` в `protocol.ts`/`world.ts`.
- [x] **«?» в конец строки Junior Rank** – кнопка-спейсер в конце ряда открывает
      `RankHelpDialog` (переиспользует `CountingResultsTable` из round 6)
      → `HomeScreen.vue`, `RankHelpDialog.vue`.
- [x] **Попап итогов сезона** – `SeasonSummaryDialog` авто-показывается на Home при
      `stopReason === 'season-end'` и наличии `lastSeasonSummary`, закрывается кнопкой "Continue"
      → `SeasonSummaryDialog.vue`, `App.vue`.
- [x] **Пояснение квадратиков недели** – буквы дней `M T W T F S S` под точками недели +
      легенда ("training"/"rest")
      → `WeekRecapCard.vue`.
- [x] **Ротация реплик тренера** – 5 фраз на каждый стиль игры, меняются по неделям
      (`week % 5`, детерминированно, не статично)
      → `HomeScreen.vue` `COACH_QUOTES`.
- [x] **MediaSession в шторке уведомлений** – заголовок "Ties Break", артист "Ace Parent",
      обложка `logo-tb-line-light.webp`; play/pause в шторке переключают мьют музыки (сам
      `<audio>` стартует/стопается как побочный эффект); всё фича-детектится
      (`'mediaSession' in navigator`, `typeof MediaMetadata !== 'undefined'`)
      → `src/audio/music.ts`.
- [x] **Матчи «дышат»** – новый тихий таймлайн-ивент `gap` (`POINT_END_GAP`/`GAME_END_GAP`/
      `SET_END_GAP`), пауза после каждого конца очка/гейма/сета перед следующим стартом очка,
      подавляется на последнем очке матча; полосы длительности реплеев пере-центрированы
      260→290с (full) / 100→120с (key) под новую длину (тот же принцип пере-центровки, что и в
      round 4 для смены сторон)
      → `src/viz/timeline.ts`, `src/viz/types.ts`.
- [x] **«Рассаживайтесь» держит экран до конца клипа (~3.6с)** – `SEATS_PREROLL_MS` 1500 → 3600мс
      (реальная длина клипа ≈3.5с), действует только на ×1/×2
      → `MatchViewer.vue`.
- [x] **«out»-реплика — не каждый третий, а вероятностно 1 из 3–5** – детерминированный per-match
      RNG (`rngFromSeed(match.result.seed + ':outcall')`), порог 3–5 аут/сетевых очков перед
      новым вызовом, идентично при реплее; новых аудиофайлов не добавлялось (один `out.mp3`) –
      только логика
      → `MatchViewer.vue`.
- [x] **Хаптики на кликах кнопок + переключатель More** – `vibrate()`/`supportsHaptics()`,
      навешено на тот же делегированный клик-обработчик, что и звук клика; переключатель
      "Haptics" в More (с подсказкой "not supported on this device", где недоступно)
      → `src/audio/haptics.ts`, `src/audio/sfx.ts`, `MoreScreen.vue`.
- [x] **Финал аплодисментов – правило исправлено** – дочка выбывает раньше финала: её последний
      (проигранный) матч играет обычные короткие аплодисменты на конце матча, а грустный экран
      итога – тихий; дочка играет финал: у финального матча аплодисменты на конце подавлены
      (`suppressEndApplause`), а `applauseFinal` играет один раз на экране итога – одинаково для
      чемпионки и финалистки
      → `MatchViewer.vue`, `TournamentFlow.vue`.
- [x] **Плашка раунда подсвечена над кортом** – новый проп `stageLabel`: акцентная плашка
      (акцентный фон, тёмный текст) поверх левого верхнего угла корта
      → `MatchViewer.vue`.
- [x] **Нет паузы в живом просмотре** – Play/Pause полностью убраны из live-режима (матчи и так
      короткие и автоиграют); replay-режим по-прежнему держит один "Watch again ↻"
      → `MatchViewer.vue`.
- [x] **Короткие имена под кортом с обеих сторон + фамилия на карточке дома** – корневая
      причина исправлена в движке: `kidMatchPlayer().name` теперь полное "Имя Фамилия" (было
      только имя), поэтому `formatShortName` даёт "V. Martin" и для дочки тоже – во всех трёх
      местах, где встраивается MatchViewer (турнир, Season-реплей, товарищеский матч)
      → `src/engine/world.ts` `kidMatchPlayer`.
- [x] **Кнопка Watch в Season использует иконку play.svg (не глиф ▶)** – глиф ломал вёрстку
      строки; замена той же CSS-mask-техникой, что и таб-иконки (следует цвету текста); кнопка
      Watch в News сохраняет свой глиф по указанию владельца
      → `SeasonScreen.vue`.
- [x] **Full-draw = настоящая визуальная сетка турнира, инлайн-шагом** – сворачиваемый список
      заменён инлайн-брекетом (колонка на каждый раскрытый раунд, путь дочки подсвечен акцентной
      рамкой/заливкой), показывается между раундами и на финале – никогда поверх пре-матч
      карточки или во время реплея, и никогда как сворачиваемый блок, который закрывает поток
      → `TournamentFlow.vue`.
- [ ] **Экраны детализации по дням** – отложено: не будет иметь смысла, пока не появится система
      "тренировка даёт эффект" → **Phase 4** (явно зафиксировано как деферрал в
      `docs/specs/round7-match-audio.md`).
- [x] **«Closed W{n}» прошедшим временем на закрытых событиях** – плашка календарного события
      читается "Closed W{n}", как только `week > deadlineWeek`, иначе "closes W{n}"
      → `SeasonScreen.vue`.

## Дополнительно

Не входит в пронумерованный список владельца, но сдано в этом же проходе (или ранее в round 6,
здесь – для полноты картины перед архитекторским гейтом round 7):

- [x] **Баланс громкости SFX** – единая ручка `SFX_MASTER = 0.40` (тот же принцип, что и
      `economy.ts`: одна владельческая константа); удары (`hit`) звучат тише музыки (0.30),
      `KEY_VOICE`-веса задают баланс между самими звуками
      → `src/audio/sfx.ts`.
- [x] **Обновление иконок владельца** – свежие версии `home/more/play/season/stats.svg` от
      владельца (asset-only коммит)
      → commit `2d36e70`.
- [x] **Поле месяца рождения** (schema v9, из round 6) – `profile.birthMonth`, влияет на
      возрастную когорту, сам эффект – Phase 4
      → см. `round-6.md`.
- [x] **Таб Stats** (из round 6) – отдельный нижний таб со стандингами, вынесенными из Season
      → см. `round-6.md`.
- [x] **Попап-помощник best-6** (из round 6) – "?" на карточке дома открывает таблицу подсчёта
      результатов
      → см. `round-6.md`.
- [x] **Splash-экран** (из round 6) – полноэкранная заставка при каждом запуске, логотип +
      "Tap to start"
      → см. `round-6.md`.
- [x] **Фоновая музыка** (из round 6) – зацикленный трек, дакинг на матчах, переключатель Music
      в More
      → см. `round-6.md`.
