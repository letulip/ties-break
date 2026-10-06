---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11L – The recurring weekly financial corpus

Source: `src/engine/world/phaseFinance.ts` and `src/engine/economy/gear.ts`. These expense and
income rows appear in Money and can become the weekly recap's **first-expense scrap**, so they
need to be true, brief and varied where the source is varied. Every line below is `DRAFT`.

## Fixed receipts

| Source | English source | Russian draft |
| --- | --- | --- |
| parent income | `Parents' contribution` | `Вклад семьи` |
| college coaching not billed | `At college – the programme coaches her, not us` | `Университетская программа занимается её подготовкой — семья не платит за тренера` |
| family vacation coaching not billed | `A week away as a family – no coaching billed` | `Семейная неделя отдыха — тренировки не оплачиваются` |
| local sponsor cameo | `A local sponsor chipped in!` | `Местный спонсор помог с расходами.` |
| delivered asset upkeep | `Upkeep: {item.label}` | `Содержание актива: {item.label}` |
| covered gear suffix | `{gearFlavor} – on {brand}` | `{localizedGearFlavor}; оплачено брендом «{brand}»` |

The first two zero-cost coaching lines keep `amountCents: 0` and the coaching category. The
parent-income row is about a regular family contribution, not a wage from the daughter. The
local sponsor is a need-gated windfall; the Russian line must not imply a signed contract. The
upkeep row is one expense per delivered asset, never a blended bill. Payer names and cents stay
with the existing model. `item.label` needs the RU-06 asset catalogue, not an English fallback.

## Coaching/training flavour pool

One source index is selected from the appropriate five-line pool. Russian changes text **after**
the existing index is chosen; it must not reorder pools or draw again. The working-family variant
replaces only the fifth training line.

| Source pool / slot | English | Russian draft |
| --- | --- | --- |
| training 1 | `Coaching block: technique drills` | `Тренировка: работа над техникой` |
| training 2 | `Coaching block: footwork and conditioning` | `Тренировка: работа ног и выносливость` |
| training 3 | `Practice sets at the local club` | `Тренировочные сеты в клубе` |
| training 4 | `Sparring with the older kids` | `Спарринг с игроками постарше` |
| training 5 | `Video session: studying her last matches` | `Видеоразбор последних матчей` |
| working family, training 5 | `Group clinic at the public courts` | `Групповая тренировка на муниципальных кортах` |

`игроки постарше` preserves age comparison without calling a 28-year-old's opponents *kids*.
The source's English line deserves the same adult-stage review in the technical localization wave;
Russian should not inherit its age mismatch.

## Light-week flavour pool

| Source slot | English | Russian draft |
| --- | --- | --- |
| light 1, school ongoing | `Light week: school catches up` | `Лёгкая неделя: наверстать школьные дела` |
| light 1, after school | `Light week: the rest of life catches up` | `Лёгкая неделя: разобраться с остальной жизнью` |
| light 2 | `Family weekend away from the courts` | `Семейные выходные без корта` |
| light 3 | `Recovery week: stretching and pool` | `Восстановление: растяжка и бассейн` |
| light 4 | `Hitting for fun, no drills` | `Поиграли в своё удовольствие, без упражнений` |
| light 5 | `Off week: she reread her favorite book` | `Свободная неделя: перечитала любимую книгу` |
| wealthy extra 1 | `Physio session` | `Сеанс физиотерапии` |
| wealthy extra 2 | `Massage & recovery` | `Массаж и восстановление` |

The school/post-school swap preserves array length and the chosen index. `schoolOver` is the
mechanical gate, not `lifeStage === 'college'`; this matters in after-school years. Avoid
`уроки` or `общежитие` in an adult's weekly scrap.

## Court venue by background and coach rung

`FACILITY_VENUE[background][step]` is a pure 3 × 4 lookup. The first step is shared by self
coaching and the budget rung. Translate the venue, then append the unchanged number of hours
and one localized time/price clause.

| Family corridor | Step 0 | Step 1 | Step 2 | Step 3 |
| --- | --- | --- | --- | --- |
| working | `Корты клуба` | `Крытые корты` | `Корты академии` | `Тренировочный центр` |
| middle | `Аренда корта` | `Корты академии` | `Тренировочный центр` | `Главные корты` |
| wealthy | `Корты академии` | `Тренировочный центр` | `Главные корты` | `Центральный корт` |

Full row shape: `{venue} — {hours} ч, {clause}`. Keep the numeric hours and one decimal only for
non-whole custom splits. `Главные корты` is a venue tier, not a tournament stage; this is the
closest neutral Russian for *show courts*. The venue label must track the actual court price rung.

| Source clause pool | English variants | Russian drafts in the same index order |
| --- | --- | --- |
| dear week | `peak slots` · `peak rate` · `prime time` · `the busy hours` | `пиковые часы` · `пиковый тариф` · `лучшее время` · `самые занятые часы` |
| cheap week | `off-peak` · `quiet hours` · `early slots` · `off-peak rate` | `вне пика` · `тихие часы` · `ранние часы` · `непиковый тариф` |
| ordinary, school ongoing | `after school` · `evenings` · `the usual slot` · `weekday hours` | `после школы` · `вечером` · `в привычное время` · `по будням` |
| ordinary, after school | `daytime slots` · `mornings` · `the usual slot` · `midweek` | `днём` · `утром` · `в привычное время` · `среди недели` |

The clause is selected on the purpose-scoped `seed:court:<week>` stream after the price band is
known. Locale must never change that stream, the main-stream training draw, or the saved amount.
The house's narrow recap scrap is a phone-LQA target: some Russian clauses are longer than the
English 14-character budget, so the technical wave may need a short display variant rather than
clipping text.

## Recurring kit flavours

The gear category and payer are retained; these 12 strings depend on the family background,
not on who ultimately pays. They are neither one purchase of a whole new kit nor a judgement of
its quality.

| Gear | Working | Middle | Wealthy |
| --- | --- | --- | --- |
| racket | `Новая ракетка — подержанная, по объявлению` | `Новая ракетка — модель из магазина` | `Новая ракетка — изготовлена для игрока` |
| restringing | `Перетяжка — недорогая синтетика` | `Перетяжка — мультифиламентная струна` | `Перетяжка — натуральная струна` |
| shoes | `Новая обувь — прошлогодняя модель` | `Новая обувь — модель для тренировок и матчей` | `Новая обувь — подогнана по ноге` |
| apparel | `Обновление формы — базовый клубный комплект` | `Обновление формы — комплект бренда` | `Обновление формы — дизайнерский комплект` |

The source strings, in table order, are `New racket – used, off the classifieds` /
`New racket – current retail model` / `New racket – custom pro stock`; `Restring – budget
synthetic` / `Restring – multifilament` / `Restring – tour gut`; `New shoes – last season's
model` / `New shoes – mid-range performance` / `New shoes – top-line, fitted`; `Apparel
refresh – club basics` / `Apparel refresh – brand kit` / `Apparel refresh – full designer
kit`. Keep `stringing` as its own ledger category, as the code does. A fully covered purchase
may have `amountCents: 0`; never render negative zero.
