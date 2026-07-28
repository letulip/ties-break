# Handoff: Tennis Parent — мобильная игра (8 экранов)

## Overview
Мобильная нарративная игра-менеджер: игрок — родитель юной теннисистки (Bianca Tran, 16 лет).
Он планирует сезон, следит за календарём, бюджетом семьи, состоянием и настроением дочери,
проходит турниры и матчи. Визуальный язык — «тёмный спортивный дашборд + бумажные артефакты»
(записки, полароиды, скотч), кислотно-лаймовый акцент.

Пакет содержит **9 экранов** первого игрового цикла: A. Home, B. Season Planner, C. Kid Profile,
D. Weekly Story, E. Tournament (Preview), F. Match Day (Live), G. Family Budget, H. Calendar (Week View),
I. Live Match (Court).

**F vs I.** Это два разных представления живого матча. **F** — кинематографичное: арт-сцена во весь экран,
компактный счёт, реплика тренера. **I** — «диспетчерское»: схематичный корт с анимацией, полная статистика,
лог очков, управление скоростью. F — для эмоциональных моментов, I — для длинных матчей, которые игрок
проматывает. Реализовать оба; переключение между ними — вне рамок этих макетов.

## About the Design Files
Файлы в `design/` — **дизайн-референсы, сделанные в HTML**. Это прототипы, показывающие
задуманный вид и поведение, а НЕ продакшн-код для копирования.

Задача: **воссоздать эти экраны в целевой кодовой базе средствами её окружения**
(React Native, Unity UI, Flutter, SwiftUI, React/web — что уже используется в проекте),
следуя её паттернам и библиотекам. Если окружения ещё нет — выбрать подходящий стек
(для мобильной игры этого типа разумны Unity UI Toolkit, Godot Control-ноды или React Native)
и реализовать экраны там.

Разметка в референсе — inline-стили внутри одного файла, потому что это инструмент прототипа.
В проде это должны быть нормальные компоненты + токены (см. `tokens.css` / `tokens.json`).

## Fidelity
**High-fidelity (hifi).** Все цвета, шрифты, размеры, отступы и радиусы — финальные и точные.
Воссоздавать пиксель-в-пиксель, беря значения из `tokens.css` и из спецификаций ниже.

Исключения (сознательно низкая точность, не копировать буквально):
- **Иллюстрации/арты** — в прототипе это пустые drop-зоны (`<image-slot>`). В проде — реальные
  арты персонажей, локаций, матчей. Список слотов см. в разделе Assets.
- **Флаги стран** нарисованы полосками div-ов — заменить на реальный набор иконок флагов.
- **Иконки** нарисованы вручную как inline SVG в стиле 1.5–1.9px stroke, 24×24 grid
  (близко к Lucide / Feather). В проде — взять Lucide и совпадающие по смыслу глифы.
- **Смайл настроения** (жёлтый круг «tired») собран из div-ов — заменить на арт-набор эмоций.
- **Корт на экране I** — схематичный (div-ы + CSS-анимация), это осознанный «диспетчерский» вид, а не арт.
  Разметку корта и цвета копировать точно; движение мяча/игроков в проде должно управляться игровой
  симуляцией, а не зацикленной анимацией.

## Дизайн-принципы (важно соблюсти)
1. **Тёмный интерфейс, светлая бумага.** Данные и UI — на тёмных панелях; человеческое,
   эмоциональное, рукописное (заметки, цели, фото) — на бумаге поверх интерфейса, всегда
   с небольшим наклоном (−4°…+6°) и тенью. Бумага НЕ имеет border-radius (кроме 2px у карточек),
   у неё рваный край через `clip-path` и линейная разлиновка.
2. **Один акцент.** Лайм `#cfe152` = «твоё, активное, действие». Больше ничего не красится
   в акцент. Заголовки секций внутри карточек — лаймовый uppercase eyebrow 10px/800/0.1em.
3. **Цвет = смысл.** Зелёный `#4ac96a` — доход/рост, красный `#ef4b3a` — расход/live,
   оранжевый `#e2822f` — грунт (clay), жёлтый `#f3c94a` — настроение.
4. **Никаких скруглённых «пузырей».** Радиусы карточек 14–18px, кнопки — pill 999px.
5. **Плотность.** Экран всегда заполнен полностью, скролла в макетах нет: контент-области
   растягиваются через flex, а не через жёсткие высоты.

## Общий каркас экрана
- Логический размер: **390 × 844** (iPhone 13/14 логические px). Радиус корпуса 30px —
  это рамка прототипа, в проде корпус не рисуется.
- Фон экрана: `#0f1720`.
- Вертикальный стек: header (flex:none) → контент (flex:1, min-height:0) → tab bar (flex:none).
- Боковой gutter контента: **14px** (у header'ов 18–20px).
- Шрифт: **Manrope** (400/500/600/700/800). Рукописный: **Caveat** 600.
  `-webkit-font-smoothing: antialiased`.

### Tab bar (общий для A, B, C)
- `display:grid; grid-template-columns:repeat(5,1fr); padding:12px 6px 24px`
  (нижние 24px — safe-area), фон `#0c141b`, верхняя граница `1px rgba(255,255,255,0.06)`.
- Пункт: иконка 23×23 → gap 6px → подпись 11px.
- Неактивный: stroke/цвет `#8e9ba4`, weight 600. Активный: `#cfe152`, weight 700,
  stroke-width 1.8 (вместо 1.7).
- Пункты: Home, Season, Calendar, Bianca, More (More = сетка 3×2 точек 3.5px, gap 3px).

---

## Screens / Views

### A. Home
**Purpose:** ежедневный вход в игру. Одна эмоциональная сцена + 4 плитки состояния мира.

**Layout:** hero 390×398 (flex:none) → сетка плиток `grid-template-columns:1fr 1fr; gap:11px;
padding:2px 14px 14px; align-content:start` → tab bar.

**Hero:**
- Полноразмерный арт персонажа (`image-slot` id `hero-portrait`).
- Верхний скрим: `linear-gradient(180deg, rgba(6,10,14,.78) 0%, rgba(6,10,14,.18) 22%, rgba(6,10,14,0) 40%)`.
- Нижний скрим (уходит в цвет экрана, opacity управляется проп-ом `heroScrim`):
  `linear-gradient(180deg, rgba(9,14,19,0) 46%, rgba(11,17,23,.72) 78%, #0f1720 100%)`.
- Строка статуса: слева дата «Sat, Jul 3, 2033» 13.5px/600 `rgba(255,255,255,.86)`;
  справа — иконки bell (22px) и settings (22px), gap 16px, top 20px, left 20 / right 18.
  На bell — бейдж 9×9 `#ef4b3a`, `box-shadow:0 0 0 2px rgba(10,15,20,.55)`, показывается при unread > 0.
- Приветствие, left 20px, top 74px: «Good evening» 14.5px/500 `rgba(255,255,255,.78)` →
  имя «Bianca» **42px/800, letter-spacing −0.025em, line-height 1**, `text-shadow:0 2px 18px rgba(0,0,0,.45)` →
  «16 years old» 14.5px/500.
- Плашка-цитата (bottom 30px, left 18px, max-width 250px): `rgba(10,15,20,.6)` + `backdrop-filter:blur(12px)`,
  radius 13px, padding 13px 16px 14px; лаймовая точка 7px с `box-shadow:0 0 8px rgba(207,225,82,.6)`,
  gap 11px, текст 15px/500, line-height 1.42. Копия: «She didn't smile after today's practice."».

**Плитки (4 шт):** фон `linear-gradient(180deg,#17212b 0%,#121a22 100%)`, border `1px rgba(255,255,255,.055)`,
radius 17px, padding 14px. Верхние — min-height 172px, нижние — 132px.
1. **Next tournament** — eyebrow «NEXT TOURNAMENT»; тайтл «Regional Championship» 15.5px/700, max-width 118px;
   «Clay» / «Jul 6 – Jul 11» 13px/500 `#8e9ba4`; внизу «Travel budget» 12.5px `#6d7a83` + «$137» 19px/800.
   Справа — арт венью 112×136, radius `56px 56px 14px 14px`, растворяется маской
   `linear-gradient(100deg,transparent 4%,#000 44%)`.
2. **Family budget** — «Income $247» (`#4ac96a`) / «Spent -$430» (`#ef4b3a`), значения 17px/700;
   делитель 1px `rgba(255,255,255,.07)`; «This week»; внизу sparkline 146×46:
   лаймовая polyline 1.8px + заливка `linear-gradient` от `rgba(207,225,82,.42)` в 0,
   на каждой точке кружок r=2.8 (лайм `#dbe45a` = хороший день, оранжевый `#f0913c` = средний,
   `#ef6a3a` = плохой).
3. **Coach note** — слева фото тренера 74px на всю высоту; текст 13.5px/500 `#e3eaee`, line-height 1.42;
   подпись «M. Ricci» — Caveat 17px `rgba(207,225,82,.72)`.
4. **Recent memory** — полароид 88px (наклон = проп `polaroidTilt`, по умолчанию 3°): фон `#f3f0e8`,
   padding `5px 5px 15px`, фото 66px, `box-shadow:0 8px 20px rgba(0,0,0,.45)`; «кнопка-пин» 24×24
   radius 7px `#151d25`. Тайтл «First regional semifinal» 14.5px/700 max-width 95px, дата 13px/500.

### B. Season Planner
**Purpose:** обзор сезона по покрытиям и выбор турниров на ближайшие недели.

**Layout:** header (26/18/16) → полоса фаз сезона → две карточки турниров (`flex:1` каждая, gap 12) →
CTA → tab bar (активен Season).

- **Header:** слева «гамбургер» из 3 полосок разной длины (19/13/16 × 2px, gap 4px) —
  намеренно неровный, рукотворный; тайтл «Season Planner» 20px/800 −0.02em, «2033» 13px/500;
  справа иконка фильтра 21px и кнопка календаря 34×34 radius 10px border `rgba(255,255,255,.16)`.
- **Полоса фаз:** `grid repeat(5,1fr)`, padding 0 12px 14px. Ячейка: название 12.5px/700 +
  недели 11.5px/500. Активная («Clay / W11-25») — border `1px #cfe152`, radius 11px, оба текста лаймовые/700.
  Неактивные разделяются `border-left:1px rgba(255,255,255,.08)`.
  Значения: Hard W1-10, Clay W11-25, Grass W26-31, Hard W32-49, Off W50-52.
- **Карточка турнира:** radius 18px, фон `#121a22`, border `rgba(255,255,255,.055)`;
  арт венью справа на 74% ширины, маска `linear-gradient(90deg,transparent 0%,#000 42%)`;
  поверх — вертикальный скрим `rgba(11,17,23,.55) → .12 (34%) → .55 (78%) → .86`.
  Контент padding 16px: тайтл 21px/800 −0.02em + погода (иконка солнца `#f5b942` 17px + «23°» 17px/700);
  строка покрытия — кольцо-иконка clay (19px круг border 1.5px `#e2822f` с внутренним 9px кругом),
  «Clay» 13.5px/600, вертикальный делитель 1×13px, даты 13.5px/500 `#c3ccd2`;
  hairline на всю ширину (`margin:14px -16px 0`); пин-локация + город 13.5px/600;
  «Travel budget» 13px/500 `#a8b3ba` и сумма: «$» 15px/600 `#c3ccd2` + число 23px/800 `#fff`.
  Внизу (прижата `margin:auto 12px 12px`) плашка тренера: border `rgba(255,255,255,.14)`,
  фон `rgba(10,15,20,.62)`, blur 10px, radius 13px, padding 11px 13px — «Coach says:» 12px/600
  + реплика 13.5px/500, справа кольцо шанса 46px (см. компонент Chance ring).
  Данные: Regional Championship / Clay / Jul 6–11 / Nice, France / $137 / «Good field. Many solid players.» / 42%;
  Local Open / Clay / Jul 20–25 / Marseille, France / $84 / «Good for confidence.» / 68%.
- **CTA** «+ Plan week» — pill `#cfe152`, текст `#111a10` 14.5px/800, padding 12px 26px, min-width 206px,
  `box-shadow:0 8px 24px rgba(207,225,82,.18)`.

### C. Kid Profile
**Purpose:** карточка героини — характер, состояние, вехи биографии.

**Layout:** hero 392px → сетка 3×2 атрибутов → блок «Important moments» → tab bar (активен Bianca).

- **Hero:** арт `kid-portrait`; скрим сверху и снизу
  `rgba(6,10,14,.82) 0 → .2 18% → 0 34% → rgba(11,17,23,.55) 84% → #0f1720 100%`.
  Заголовок по центру: «Bianca Tran» 20px/800 + флаг 24×16 (radius 2px) в одну строку gap 9px,
  под ним «16 years old» 13px/500. Слева back-arrow 22px, справа settings 21px.
  Справа снизу (right 16, bottom 56) бумажная карточка 88px, наклон −4°, фон `#eee6d3`,
  radius 2px, padding 13px 12px 15px, текст «Right-Handed» 15px/700 `#2b2721`.
- **Атрибуты:** `grid repeat(3,1fr); gap 8px; padding 0 14px`, ячейка min-height 88px,
  radius 14px, фон `#141d26`, border `rgba(255,255,255,.055)`, padding 11px 9px.
  Лейбл 10.5px/600 `#8e9ba4`; значения 11.5px/600 `#e9eef1`, по 2 строки, gap 4px, `white-space:nowrap`.
  Значения: Personality «Competitive / Hard on herself»; Confidence — кольцо 56px (r23, stroke 3.5px,
  трек `rgba(255,255,255,.13)`, прогресс `#e8f04a`, dasharray 144.5, offset 54.9 = 62%) с «62%» внутри
  (15px/800 + 10px/700); Mood «Tired» 17px/700 + жёлтый смайл 36px `#f3c94a`;
  School «10th grade / Missing classes»; Friends «Close to Emma / Good support»;
  Coach «J. Sinclair / Since age 10».
- **Important moments:** карточка radius 16px `#141d26`, margin `10px 14px 0`, padding 14px 10px 16px.
  Заголовок 13.5px/700 + «See all» 12.5px/500 `#8e9ba4`.
  Таймлайн: горизонтальная линия 2px `#e8f04a` (left/right 12%, top 13px) под 4 узлами
  `grid repeat(4,1fr)`; узел = иконка 26px (фон `#141d26`, чтобы «прорезать» линию) + подпись
  10px/600 `#d3dade` + дата 10px/500 `#8e9ba4`. Узлы: First tournament Feb 7 2028 (галочка в круге),
  First title Oct 14 2030 (кубок), Regional SF May 24 2033 (заполненная точка, подпись 700 `#eef3f6`),
  Today (звезда).

### D. Weekly Story
**Purpose:** итог недели — модальный «разбор», который закрывается крестиком.

**Layout:** header 26/20/16 («Week 27 · Jun 27 – Jul 3, 2033» 13.5px/600 `#c3ccd2` по центру, справа ×) →
контент `flex:1; padding:0 14px 18px`. Таб-бара НЕТ (это оверлей поверх игры).
- Арт недели 286px, radius 16px (`week-scene`).
- **Рукописная записка** заезжает на арт: `margin:-34px -2px 0`, наклон −0.5°, фон `#eae1c8`,
  разлиновка `repeating-linear-gradient(180deg, rgba(58,48,30,.13) 0 1px, transparent 1px 26px)`,
  рваный край `clip-path:polygon(0.6% 2%,99.4% 0,100% 96%,0 100%)`, красная маргинальная линия
  1px `rgba(190,90,80,.5)` на left 17px, padding 16px 62px 18px 26px, текст Caveat 23px/1.32 `#2b2721`,
  дудл-сердце 34px в правом нижнем углу. Копия: «Bianca quietly fell asleep in the car after the tournament.»
- **Сетка 2×2 итогов** (`flex:1`, gap 10px, radius 15px, `#141d26`, padding 12px 13px);
  заголовок карточки 12.5px/700 **лаймом**:
  Finances (Income $247 / Spent −$430 / hairline / Balance −$183 16px/800 красным);
  Training (Fitness +6%, Backhand +2%, Serve +8% — значение 12.5px/700 + зелёный треугольник-стрелка 11×12);
  Mood (смайл 38px + «Tired» 17px/700; внизу «Energy» + прогресс-бар 7px radius 4px,
  трек `rgba(255,255,255,.12)`, заливка лайм 42%, значение «42%» 12px/700);
  Highlights (3 строки 12.5px/500 с точкой 3px `#8e9ba4`).
- **Записка-цель** внизу: наклон +0.4°, тот же бумажный стиль, `clip-path:polygon(0.6% 0,99.4% 2%,100% 100%,0 97%)`,
  сверху по центру «скотч» 44×15 `rgba(240,236,222,.72)` наклон −2°;
  «Next goal» Caveat 20px `#4a4235` + цель Caveat 21px `#2b2721`, дудл-кубок 40px справа.
  Копия: «Win one match at the Regional Championship».

### E. Tournament (Preview)
**Purpose:** брифинг перед турниром и запуск матча.

**Layout:** hero 300px → контент `flex:1; gap:12px; padding:0 14px 20px` из 3 блоков. Таб-бара нет.
- **Hero:** арт `tournament-hero`, скрим `rgba(6,10,14,.62) → .1 26% → rgba(11,17,23,.45) 66% → rgba(15,23,32,.94)`;
  сверху back-arrow и погода справа («23°» 18px/700 + «Nice, France» 12.5px/500);
  снизу тайтл «Regional Championship» 22px/800 −0.02em + «Clay · Jul 6 – Jul 11, 2033» 13px/500.
- **Строка фактов:** `grid repeat(4,1fr); gap 6px; padding 14px 8px`, radius 16px,
  фон `rgba(20,29,38,.72)`, border `rgba(255,255,255,.05)`. Ячейка: плитка иконки 34×34 radius 11px
  `rgba(255,255,255,.07)` → лейбл 10.5px/500 `#a8b3ba` → значение 12.5px/700.
  Surface Clay · Prize Money — · Ranking Points 75 · Spectators Small.
- **First Round:** карточка radius 17px `#141d26`, padding 14px 12px; лейбл «First Round» 13px/600.
  Два «игрока» `flex:1` (radius 14px, `#17212b`, border `rgba(255,255,255,.06)`, padding 8px,
  портрет 46×80 radius 10px) с «VS» 17px/700 `#8e9ba4` между ними; правый игрок отражён
  (текст справа, портрет справа). Внутри: флаг 24×16, имя 12.5px/800, ранг 11.5px/500 `#8e9ba4`.
  Данные: Bianca Tran #96 (флаг AR) vs L. Moreau #112 (флаг FR); внизу по центру
  «Their meeting: First time» 12px/500.
- **Прогноз + запуск:** карточка radius 17px `#141d26`, padding 14px, две колонки (правая 168px):
  «Coach prediction» 12.5px/700 `#c3ccd2`, реплика 13.5px/500 line-height 1.42
  («"She plays steady. Be patient."»), подпись Caveat 16px лаймом 0.7;
  справа «Your chance to win» 11.5px/500 + кольцо 46px (44%) и **primary CTA «Start Match»**
  (pill `#cfe152`, `#111a10` 14.5px/800, padding 13px 18px, shadow `0 8px 24px rgba(207,225,82,.18)`).

### F. Match Day (Live)
**Purpose:** живой матч: счёт, сцена, реплики тренера.

**Layout:** header 26/18/14 → scoreboard → сцена `flex:1` с оверлеем тренера. Таб-бара нет.
- **Header:** back-arrow; «Regional Championship» 15px/700 + «First Round» 12.5px/500;
  справа live-индикатор: точка 7px `#ef4b3a` `box-shadow:0 0 8px rgba(239,75,58,.7)` + «Live» 12.5px/700
  `#ef4b3a`, ниже «Clay · 23°» 11.5px/500.
- **Scoreboard:** `margin:0 14px`, radius 15px, фон `#151f29`, border `rgba(255,255,255,.06)`.
  Две строки игроков: слева флаг 22×15 + имя 14.5px/700 (у подающего — лаймовая точка 9px
  `#e8f04a` с glow), колонка отделена `border-right:1px rgba(255,255,255,.08)`;
  справа 4 ячейки 36×34 radius 8px: сеты — фон `rgba(255,255,255,.05)`, текст 18px/700 `#f2f6f8`;
  текущий гейм — фон `#d9e455`, текст 18px/800 `#161f0c`.
  Данные: B. Tran 6 4 2 **30**; L. Moreau 4 6 1 **15**.
  Футер строкой: «Second Serve» / «Match time 1:58» 12px/500 `#a8b3ba`,
  border-top `rgba(255,255,255,.07)`, фон `rgba(255,255,255,.015)`.
- **Сцена:** арт `match-live` во всю область; снизу скрим 220px до `rgba(12,18,24,.8)`.
  Оверлей тренера (left/right 14, bottom 34): radius 17px, фон `rgba(15,23,32,.92)`, blur 12px,
  border `rgba(255,255,255,.08)`; слева фото 78px во всю высоту (без радиуса, обрезано контейнером),
  «Coach» 12px/600 `#a8b3ba` + реплика 15px/600 line-height 1.35 max-width 132px
  («Great point! Keep going.»), справа круглая кнопка 42px `#f4f7f8` с иконкой чата `#141d26`.

### G. Family Budget
**Purpose:** деньги семьи за период, по категориям.

**Layout:** header 28/18/18 → сводка → переключатель периода → контент `flex:1` (список слева 202px,
бумажные артефакты справа абсолютом). Таб-бара нет.
- **Header:** back-arrow, «Family Budget» 19px/800 −0.02em, «Year 2033» 12.5px/500;
  справа 3 точки 4px `#c3ccd2` (горизонтально, gap 4px).
- **Сводка:** `grid 1fr 1fr 1fr`, radius 16px `#141d26`, padding 14px 4px; ячейки разделены
  вертикальными hairline; лейбл 11.5px/500 `#a8b3ba`, значение 20px/800 −0.025em.
  Total Income **$18,247** (`#a5db4b`) · Total Spent **−$24,390** (`#ef4b3a`) ·
  Balance **−$6,143** (`#ef4b3a`). Выравнивание: лево / центр / право.
- **Период:** 3 сегмента `flex:1`, padding 10px 4px, radius 11px, 12.5px;
  активный — border `1px #cfe152`, фон `rgba(207,225,82,.06)`, текст лайм/700;
  остальные — border `rgba(255,255,255,.1)`, текст `#c3ccd2`/600. This week / This month / This year.
- **Категории:** колонка 202px, каждая строка `flex:1; min-height:0` (высота делится поровну),
  padding 14px 2px, `border-bottom:1px rgba(255,255,255,.06)`: иконка 17px stroke `#c3ccd2` →
  название 13.5px/600 `#e9eef1` → сумма 13.5px/700 `#ef4b3a`.
  Travel −$1,890 · Tournaments −$2,340 · Coaching −$4,800 · Equipment −$1,250 ·
  Fitness & Medical −$640 (13px, −0.01em — влезает в колонку) · Other −$530.
  Под списком CTA-pill «View all transactions» (`margin-top:20px`, 13.5px/800).
- **Артефакты справа:** записка-квитанция 158px (наклон +2°, бумажный стиль, разлиновка шаг 24px,
  Caveat 19px: «Hotel / Nice, France / Jun 28 – Jul 1 / $182» — сумма выровнена вправо) на `top:74px`;
  ниже полароид 146px (наклон −3°, фон `#f0ead8`, padding 8px 8px 30px, фото 126px,
  «скотч» 58×17 `rgba(226,203,150,.85)` сверху) на `top:326px`.

### H. Calendar (Week View)
**Purpose:** неделя по часам: учёба, тренировки, переезды, турнир.

**Layout:** header → строка дней → сетка часов 476px → блок заметок `flex:1`. Таб-бара нет.
- **Header:** круглая кнопка «назад» 36px `rgba(255,255,255,.07)`; «Week 27» 19px/800 −0.02em +
  «Jun 27 – Jul 3, 2033» 13px/500; справа стрелка вперёд 20px, иконка календаря 20px, 3 вертикальные точки.
- **Строка дней:** `grid 38px repeat(7,1fr)`, padding 0 12px, hairline сверху и снизу;
  ячейка: день недели 10.5px/500 `#8e9ba4` + число 15px/700 `#f2f6f8`, `border-left` между колонками.
  Mon 27 … Sun 3.
- **Сетка:** `grid 38px repeat(7,1fr)`, высота 476px; шаг **68px = 2 часа** (34px = 1 час).
  Часовые метки в первой колонке (07.00…19.00, 10.5px/500 `#8e9ba4`, шаг 68px).
  Линии сетки — `repeating-linear-gradient(180deg, rgba(255,255,255,.05) 0 1px, transparent 1px 68px)`.
  Событие: `position:absolute; left/right:3px`, radius 8px, padding 4px, `overflow:hidden`,
  текст **8.5px/600, line-height 1.25, letter-spacing −0.02em, word-break:break-word**.
  Цвета по типу: тренировка `#46685d` / `#2f5c4e` / `#3c6b62`; школа `#57626a` / `#5c4550`;
  дриллы `#7d4326`; матч `#3b5f7d` / `#3d5580`; учёба `#49545d`; переезд `#584a8c`;
  отдых `#3f5665`; **турнир `#9c5a1c` + border `1px #d9a441`, weight 700** (единственное событие с обводкой).
- **Заметки:** `flex:1`, margin 20px 14px 24px; подложка radius 18px `#141d26`
  с крупным дудлом-зонтом 62px (stroke `rgba(255,255,255,.72)` 0.9px) у правого края;
  поверх — бумажка 264px (наклон −0.8°, «Notes» 12.5px/600 `#4a4235` + Caveat 20px
  «Remember to pack rain jacket.») и оторванный клочок 52×48 `#e2d6b4` (наклон +6°).

### I. Live Match (Court)
**Purpose:** длинный матч, который игрок наблюдает и проматывает: схема корта, полный счёт,
статистика, лог очков, управление скоростью.

**Layout:** header (flex:none) → большая панель матча (корт + счёт + подача + статистика) →
лог очков (`flex:1; min-height:0; overflow:hidden`) → две вторичные кнопки → primary CTA. Таб-бара нет.

- **Header** (padding 22px 18px 12px): верхняя строка — back-arrow 22px слева и ссылка
  «Skip match →» справа (12.5px/600 `#8fb2d6`, `border-bottom:1px rgba(143,178,214,.45)`, стрелка 13px).
  Ниже по центру: «National Hard Open» 19px/800 −0.02em, затем «Round of 16 · Jan 19 – 25, 2033»
  12.5px/500 `#8e9ba4` (разделитель — точка 3.5px `#5c6a74`, gap 9px).
- **Панель матча:** `margin:0 14px`, radius 17px, `overflow:hidden`, фон `#141d26`, border subtle.
  Внутри — 5 секций сверху вниз, разделённых `border-top:1px rgba(255,255,255,.07)`:

  1. **Корт**, высота 160px, фон `linear-gradient(180deg,#1b3a5f,#16304f)` (зона выката).
     Игровая площадка: `inset:20px 24px`, фон `#22456f`, border `1.6px rgba(255,255,255,.8)`.
     Ориентация — **ландшафтная, сетка вертикально по центру**. Разметка линиями `1.4px rgba(255,255,255,.72)`:
     одиночные боковые (inset 16px сверху и снизу), линии подачи (24% слева и справа),
     центральная линия подачи (между линиями подачи, по середине высоты), метки центра на задних линиях (9px).
     Сетка: полоса 9px с «сеткой» `repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 1px, transparent 1px 3px)`
     + трос `2.4px rgba(255,255,255,.95)`, выступает на 7px за площадку сверху и снизу.
     Игроки — точки 11px: подающая `#ffffff` с ободком `0 0 0 2.5px rgba(207,225,82,.55)` (left 11px, top 56%),
     соперница `#e8eef4` (right 11px, top 38%). Мяч — 7px `#e8f04a`, glow `0 0 10px rgba(232,240,74,.85)`.
     Анимации (все 2.8s ease-in-out infinite, синхронно): `rally` — мяч по траектории через сетку
     (12%/58% → 82%/34% → назад), `ballHop` — пульсация масштаба на отскоках,
     `playerNear` / `playerFar` — вертикальное смещение игроков ±13px/11px в противофазе.
     Оверлеи: слева сверху бейдж «Live» (pill `rgba(8,13,18,.72)` + blur 8px, красная точка 7px
     с анимацией `livePulse` 1.1s), справа снизу чип погоды («23°» 14px/700 + «2 m/s» 10.5px/500).
  2. **Строки игроков** (2 шт, padding 11px 12px 4px и 4px 12px 11px): индикатор подачи — лаймовая точка 7px
     (у неподающей — прозрачный спейсер 7px для выравнивания) → флаг 24×16 → имя 14.5px/700
     (**у своей игроницы имя лаймом `#cfe152`**, у соперницы `#f2f6f8`) + сид «(4)» 12px/600 `#8e9ba4`,
     под именем возраст 11px/500 → 4 ячейки счёта 38×34 radius 8px:
     текущий сет у ведущей — `#d9e455` / текст `#161f0c` 17px/800; сыгранные — `rgba(255,255,255,.05)`,
     17px/700; будущие — `rgba(255,255,255,.03)`, «–» 15px/600 `#5c6a74`.
     Данные: Bianca Tran (4), 16 y.o. — 1 0 – – ; Dana Delgado, 17 y.o. — 0 0 – –.
  3. **Строка подачи:** pill «Serving: B. Tran» (border `1px #cfe152`, текст лайм 12.5px/700,
     padding 7px 13px) и справа «Match time» 12px/500 (`white-space:nowrap`) + «00:07» 13.5px/700.
  4. **Статистика:** `grid repeat(3,1fr)`, padding 12px 4px 14px, колонки разделены hairline.
     Лейбл 11.5px/500 `#a8b3ba`.
     *Momentum* — два polyline 104×26: свой лайм 1.8px, соперницы `rgba(255,255,255,.22)` 1.4px,
     подпись «Slight edge» 11px `#8e9ba4`.
     *1st Serve %* — «53%» 16px/800 лаймом | делитель 1×12px | «46%» 15px/700 `#8e9ba4`;
     ниже бар 6px radius 3px, трек `rgba(255,255,255,.1)`, лаймовая заливка 53%.
     *Break points* — «0/0» 16px/800 `#f2f6f8` | «0/0» 15px/700 muted; ниже два пустых бара 6px.
- **Лог очков:** `flex:1; min-height:0; overflow:hidden`, radius 17px `#141d26`, padding 6px 12px 10px.
  Вертикальная линия таймлайна: `position:absolute; left:56px; top:20px; bottom:48px; width:1.5px;
  rgba(255,255,255,.09)`. Строка (`padding:6px 0`, `border-bottom:1px rgba(255,255,255,.05)`):
  время 11.5px/500 `#8e9ba4` (ширина 34px) → точка 9px (последнее событие — `#e8f04a` с glow,
  остальные `#46545f`) → текст 13px/500 (последнее — `#e3eaee`, остальные `#c3ccd2`;
  ключевое слово выделяется 800 лаймом, напр. «Ace!») → счёт 13px/700 (последний `#f2f6f8`,
  остальные `#c3ccd2`, `letter-spacing:0.01em`).
  Копия: 00:07 «Ace! Clean serve down the T.» 1 – 0 · 00:03 «Rally of 9. Bianca wins the point.» 40 – 15 ·
  00:01 «Good first serve.» 30 – 15 · 00:00 «Match started.» 0 – 0.
  Внизу «Show more ⌄» 12.5px/600 `#8e9ba4` по центру.
  **Внимание:** высота лога — остаток по флексу (≈165px при 390×844). Строки специально сжаты
  до `padding:6px 0`, иначе «Show more» уходит под `overflow:hidden`. В проде лог скроллится,
  «Show more» разворачивает историю.
- **Вторичные кнопки:** `grid 1fr 1fr; gap 10px`, padding 14px 8px, radius 14px, `#141d26`,
  border `rgba(255,255,255,.1)`: «Coach advice» (иконка чата 18px + бейдж-круг 19px `#cfe152`
  с числом 11px/800 `#161f0c`) и «Match stats» (иконка столбиков 18px `#8fb2d6`). Подписи 13.5px/700.
- **CTA «Speed up»:** pill `#cfe152`, padding 15px 12px, иконка ▷▷ 19px `#111a10`, текст 15px/800,
  `box-shadow:0 8px 24px rgba(207,225,82,.18)`. Нижний отступ экрана 22px.

---

## Interactions & Behavior
Прототип статичный; ниже — задуманное поведение.

**Навигация:** tab bar переключает 4 основных раздела (Home / Season / Calendar / Bianca) + More.
Экраны D, E, F, G, H открываются как push/modal поверх и имеют back-arrow или × вместо таб-бара.

**Переходы:**
- Home → плитка «Next tournament» → **E. Tournament (Preview)**.
- Home → плитка «Family budget» → **G. Family Budget**; «Coach note» → лента сообщений тренера;
  «Recent memory» → альбом воспоминаний.
- Season → карточка турнира → **E**; «+ Plan week» → **H. Calendar** в режиме планирования.
- E → «Start Match» → **F. Match Day**.
- Конец недели (игровой тик) → **D. Weekly Story** как модалка; × возвращает на Home.
- C открывается по табу «Bianca»; «See all» в moments → полная биография.
- E → «Start Match» → **F** (кинематографичный) или **I** (диспетчерский, для проматывания).
- I: «Skip match →» → сразу результат матча; «Coach advice» → шторка с советами (бейдж = непрочитанные);
  «Match stats» → полная статистика; «Speed up» → переключение скорости симуляции (1× / 2× / 4×).

**Анимации** (все — 180–260ms, `cubic-bezier(.2,.8,.2,1)`):
- Появление экрана-модалки: slide-up 24px + fade.
- Бумажные артефакты при появлении: fade + `rotate` от 0° к целевому наклону + `scale` 0.96→1,
  задержка 80ms после карточки — эффект «положили сверху».
- Кольца прогресса (Confidence, Chance): анимация `stroke-dashoffset` от полного к целевому, 600ms ease-out.
- Sparkline на Home: `stroke-dasharray` рисуется слева-направо 700ms.
- Live-точка в F: пульсация opacity 1→0.35, 1.1s, infinite.
- Смена счёта в F: текущая ячейка гейма — `scale` 1→1.12→1, 200ms.
- Корт в I: мяч и игроки — 2.8s ease-in-out, зацикленно (`@keyframes rally / ballHop / playerNear / playerFar`).
  В проде длительность обратна скорости симуляции: при «Speed up» цикл ускоряется, а не подменяется.
- Новая запись в логе I: вставка сверху, slide-down 12px + fade 200ms; у прежней верхней строки
  точка гаснет с лайма в `#46545f`.

**Состояния (press/hover):**
- Карточка/плитка: `brightness(1.08)` + `scale(0.985)` при нажатии.
- Primary pill: фон → `#dcec6a`, тень тускнеет; disabled — фон `rgba(207,225,82,.25)`, текст `rgba(17,26,16,.5)`.
- Сегмент периода / фаза сезона: неактивный при нажатии — border `rgba(255,255,255,.28)`.
- Событие в календаре: press → border `1px rgba(255,255,255,.35)`.

**Loading / empty / error:**
- Арты: пока не загружены — плейсхолдер `#141d26` + shimmer `rgba(255,255,255,.05)`.
- Пустой список категорий/турниров: центрированный текст 13px/500 `#8e9ba4` + рукописная подсказка Caveat.
- Ошибка данных: строка-тост внизу, фон `#151f29`, border `rgba(239,75,58,.4)`, текст `#ef4b3a`.

**Responsive:** макеты рассчитаны на 390pt. При 360–430pt тянуть по ширине;
фиксировать: gutter 14px, высоты hero (398/392/300px), шаг календаря 68px, tab bar.
Высоты плиток Home задавать как min-height, тексты — `text-wrap:pretty`.
Календарь H и колонка категорий G — единственные места с горизонтально плотным текстом:
при узкой ширине уменьшать шрифт события до 8px, но не менять сетку.

## State Management
Игровые сущности (минимальный набор для этих экранов):

- `gameDate` — текущая игровая дата (Sat, Jul 3, 2033), номер недели (27), сезонная фаза (Clay W11-25).
- `kid`: name, age, handedness, personality[], school, friends, coach, `confidence` (0-100),
  `mood` (enum: happy/ok/tired/down), `energy` (0-100), skills { fitness, backhand, serve, … } с недельным дельтой.
- `budget`: income, spent, balance по периодам (week/month/year) + categories[] {icon, name, amount}
  + `weeklySeries` (7 точек для sparkline с оценкой дня).
- `calendar`: events[] { dayIndex 0-6, startHour, durationHours, type, title } — type определяет цвет.
- `season`: tournaments[] { name, surface, dateRange, city, travelBudget, coachComment, winChance,
  rankingPoints, spectators, prizeMoney, opponent }.
- `match` (активный): sets[[6,4],[4,6],[2,1]], currentGame ['30','15'], server, matchTime,
  serveState ('Second Serve'), coachMessages[].
- `match` (экран I, расширенно): players[{name, seed, age, flag, isPlayer}], setScores (4 слота),
  serving, matchTime, `simSpeed` (1|2|4), stats { momentum: number[] × 2, firstServePct × 2,
  breakPoints '0/0' × 2 }, `pointLog`[] { time, text, highlight?, score, isLatest },
  `courtState` { ballSide, ballPos, players: [{x,y}] } — источник анимации корта,
  `coachUnread` (бейдж на «Coach advice»).
- `memories`: [] { title, date, photo } — источник плитки Recent memory и таймлайна moments.
- `weeklyReport`: собирается на конце недели — scene art, narrative line, finances, training deltas,
  mood, highlights[], nextGoal.
- `notifications`: unreadCount (бейдж на bell).

Переходы состояния: игрок планирует неделю (H) → тик недели пересчитывает budget/skills/mood →
формирует `weeklyReport` → показывает D. Турнир (E) → матч (F) → результат обновляет ranking,
memories, budget.

Данных с бэкенда в макетах нет — всё локальный игровой стейт; сохранение — снапшот раз в игровую неделю.

## Design Tokens
Полный набор — в `tokens.css` (CSS custom properties) и `tokens.json` (для JS/Unity/Flutter).
Кратко:

**Surfaces:** canvas `#0a0e13` · screen `#0f1720` · card `#141d26` · card-alt `#121a22` ·
card-raised `#151f29` / `#17212b` · card-gradient `linear-gradient(180deg,#17212b,#121a22)` ·
tabbar `#0c141b` · glass `rgba(15,23,32,.92)` / `rgba(10,15,20,.62)`.

**Borders:** subtle `rgba(255,255,255,.055)` · default `rgba(255,255,255,.06)` ·
strong `rgba(255,255,255,.1)` · glass `rgba(255,255,255,.14)` · divider `rgba(255,255,255,.07)`.

**Accent:** lime `#cfe152` · lime-bright `#e8f04a` · lime-chip `#d9e455` ·
on-lime `#111a10` / `#161f0c` · lime-wash `rgba(207,225,82,.06)` · lime-glow `rgba(207,225,82,.18)`.

**Semantic:** positive `#4ac96a` · positive-lg `#a5db4b` · negative `#ef4b3a` ·
warning `#f5b942` · mood `#f3c94a` · clay `#e2822f` · day-ok `#dbe45a` · day-mid `#f0913c` · day-bad `#ef6a3a`.

**Text:** primary `#f2f6f8` · on-art `#ffffff` · secondary `#e9eef1` / `#e3eaee` ·
tertiary `#c3ccd2` / `#a8b3ba` · muted `#8e9ba4` · faint `#6d7a83`.

**Paper:** lined `#eae1c8` · card `#eee6d3` · polaroid `#f0ead8` / `#f3f0e8` ·
ink `#2b2721` · ink-soft `#4a4235` · rule `rgba(58,48,30,.13)` · margin-rule `rgba(190,90,80,.5)` ·
tape `rgba(240,236,222,.72)` / `rgba(226,203,150,.85)`.

**Typography:** Manrope 400/500/600/700/800; Caveat 600.
Scale: 42 (hero name) · 23 · 22 · 21 · 20 · 19 · 18 · 17 · 16 · 15 · 14.5 · 13.5 · 13 · 12.5 · 12 ·
11.5 · 11 · 10.5 · 10 · 8.5 (только события календаря).
Letter-spacing: display −0.025em · heading −0.02em · label −0.01em · eyebrow +0.1em (uppercase).
Line-height: 1 (числа) · 1.25 (плотные подписи) · 1.35–1.42 (реплики) · 1.3 (Caveat).

**Spacing:** 2 · 3 · 4 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 14 · 16 · 18 · 20 · 24 · 26 (шаг ≈ 2px, база 14px gutter).

**Radius:** 8 (событие) · 10 · 11 · 13 · 14 · 15 · 16 · 17 · 18 (крупная карточка) · 999 (pill) ·
50% (круг) · 2 (бумага) · 30 (корпус прототипа).

**Shadows:** device `0 40px 90px rgba(0,0,0,.6)` · paper `0 14px 30px rgba(0,0,0,.45)` ·
paper-sm `0 8px 20px rgba(0,0,0,.45)` · cta `0 8px 24px rgba(207,225,82,.18)` ·
text-on-art `0 2px 14px rgba(0,0,0,.55)` · glow-dot `0 0 8px <color>`.

**Rotation (бумага):** −4° · −3° · −0.8° · −0.5° · +0.4° · +2° · +3° · +6°.

## Переиспользуемые компоненты
Их стоит вынести в код первыми:
1. **ScreenShell** — 390×844 каркас: header slot / content slot / tabbar slot.
2. **TabBar** — 5 пунктов, активный по индексу.
3. **Card** — radius 17, `#141d26`, border subtle, padding 14; вариант `gradient` и `raised`.
4. **Eyebrow** — uppercase 10px/800/0.1em лаймом (заголовок внутри карточки).
5. **PaperNote** — бумага: props `tilt`, `ruled`, `torn`, `tape`, `marginRule`; внутри Caveat-текст.
6. **Polaroid** — белая рамка + фото + опциональный скотч, props `tilt`.
7. **ProgressRing** — размер 46/56, трек + прогресс, подпись в центре (Chance / Confidence).
8. **StatRow** — «лейбл … значение» с семантическим цветом (бюджет, тренировки).
9. **PlayerChip** — флаг + имя + ранг + портрет, `mirrored` для правой стороны.
10. **Scoreboard** — 2 строки × (флаг, имя, индикатор подачи, ячейки счёта).
11. **PrimaryPill** — лаймовая кнопка + тень; `ghost`-вариант для сегментов.
12. **SegmentedRow** — период / фазы сезона.
13. **CalendarGrid** — 7 колонок, шаг 68px = 2ч, события по (day, hour, duration, type).
14. **Sparkline** — polyline + заливка + цветные точки по оценке дня.
15. **CoachBar** — фото + реплика + действие (варианты: glass-плашка и оверлей матча).
16. **MoodFace** — состояние настроения (заменить на арт).
17. **CourtDiagram** — схема корта (ландшафтная, сетка по центру) + позиции игроков и мяча,
    props `ballPos`, `players`, `serving`, `speed`; вся разметка — данные, не картинка.
18. **PointLog** — таймлайн событий матча со скроллом и разворотом.
19. **StatTriplet** — строка из трёх метрик с hairline-разделителями (Momentum / 1st Serve / Break points).

## Assets
Все изображения в прототипе — **пустые слоты** (`<image-slot>`), заполняются пользователем.
Нужно подготовить реальные арты для:

| id слота | экран | назначение | размер (pt) |
|---|---|---|---|
| `hero-portrait` | A | портрет героини, полный кадр | 390×398 |
| `tournament-venue` | A | венью, вписан в скруглённую форму | 112×136 |
| `coach-photo` | A | тренер, вертикальная полоса | 74×132 |
| `memory-photo` | A | фото в полароид | 78×66 |
| `venue-nice`, `venue-marseille` | B | арт венью, растворяется влево | ~289×высота карточки |
| `kid-portrait` | C | портрет героини | 390×392 |
| `week-scene` | D | сцена недели | 362×286 |
| `tournament-hero` | E | венью турнира | 390×300 |
| `player-bianca`, `player-moreau` | E | портреты игроков | 46×80 |
| `match-live` | F | сцена матча | 390×~330 |
| `coach-live` | F | тренер в оверлее | 78×~110 |
| `trip-photo` | G | фото поездки в полароид | 130×126 |

Иконки: собственные inline SVG в стиле Lucene/Feather (24×24, stroke 1.5–1.9, round caps) —
в проде заменить на Lucide. Флаги — заменить на реальный набор.
Шрифты: **Manrope** и **Caveat** — Google Fonts (SIL Open Font License), можно бандлить.

## Screenshots
`screenshots/` — рендеры всех восьми экранов, 780×1688 (2× от 390×844 pt), PNG:
`A-home.png`, `B-season-planner.png`, `C-kid-profile.png`, `D-weekly-story.png`,
`E-tournament-preview.png`, `F-match-day-live.png`, `G-family-budget.png`, `H-calendar-week.png`,
`I-live-match-court.png`.

Экран I на скриншоте — один кадр зацикленной анимации; мяч и игроки в движении.

Арт-слоты на скриншотах пустые (видны как плейсхолдеры) — это ожидаемо, см. Assets.
Скриншоты — для сверки пропорций и композиции; **точные значения брать из `tokens.css` и спецификаций выше**,
а не пипеткой из PNG.

## Files
- `design/Home Screen.dc.html` — все 9 экранов, открывается прямо в браузере (двойной клик).
  Экраны идут подряд, каждый подписан курсивом (A…H).
- `design/support.js`, `design/image-slot.js` — рантайм прототипа (нужны, чтобы файл открылся).
  **В продакшн не переносить.**
- `tokens.css` — токены как CSS custom properties.
- `tokens.json` — те же токены для JS / генераторов тем.

Прототип содержит 4 «тюнера» (props): `showQuote` (плашка-цитата на Home),
`unread` (бейдж уведомлений), `heroScrim` (плотность затемнения hero), `polaroidTilt` (наклон полароида).
В проде это, соответственно: правило показа цитаты дня, счётчик нотификаций, константа скрима
и случайный наклон артефакта (±8°).
