---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-04
---

# RU-06 – Money, staff, shop, sponsors and inbox

## 1. Scope and voice

This batch owns the family budget, recurring bills, equipment, support staff, the family shelf and
businesses, sponsorship and academy money, the inbox and every letter that can arrive there. All
Russian copy is `DRAFT`; prices, gates, deterministic offer selection and accounting remain engine
facts.

The money voice is the least figurative voice in the game. It says what entered or left the account,
what a decision will cost, whether a figure is exact or approximate, and what is already included in
another total. It never disguises a charge with a euphemism. Letters retain the sender's character,
but their terms remain just as explicit.

Preferred chapter terms:

| English | Russian | Note |
| --- | --- | --- |
| `Family Budget` | `Семейный бюджет` | sentence case |
| `Spending` | `Расходы` | current and period spending |
| `Bills` | `Обязательства` | recurring commitments, not an inbox of invoices |
| `History` | `История` | completed seasons and transaction ledger |
| `Shop` | `Магазин` | the family shelf and purchases |
| `Her Kit` | `Её экипировка` | racket, strings and shoes |
| `Advs Portfolio` | `Рекламные контракты` | avoid the opaque abbreviation and financial `портфель` |
| `Inbox` | `Входящие` | shared glossary term |

## 2. Formatting contracts

### 2.1 Money

The game remains dollar-denominated. Russian mode keeps `$` before the amount (`$1 240`), rounds
cents exactly as the current formatter does and uses a non-breaking thousands separator. Signed
ledger values are `+$1 240` and `−$860`; use the true minus glyph only if the shared design permits
it consistently, otherwise retain the app's short hyphen. The locale must never change the integer
cents held by the engine.

`Around {money}` is **`Около {money}`** only for estimates. Exact balances, allowances, paid travel,
purchase confirmations and ledger rows never receive `около`.

### 2.2 Weeks, years and percentages

All counts use Russian plural categories:

- `{n, plural, one {# неделя} few {# недели} many {# недель} other {# недели}}`;
- `{n, plural, one {# год} few {# года} many {# лет} other {# года}}`;
- `{n, plural, one {# сезон} few {# сезона} many {# сезонов} other {# сезона}}`.

The shared `weekLabel` needs a localized display shape. The internal week index remains unchanged;
Russian copy must not interpolate the English `W14 '31` result. A compact candidate is
`14-я неделя · 2031`, with `Неделя 14 · 2031` as the narrow fallback to inspect on a phone.
`weeksLeftBracket` becomes `(осталась 1 неделя)`, `(осталось 2 недели)`, `(осталось 5 недель)` and
`(последняя неделя)`.

### 2.3 Stored financial history

`MoneyScreen.vue` currently renders `row.event.text` and the receipt renders `receipt.text`.
Those are completed English strings persisted in `WorldEvent`. Translating the surrounding screen
does not localize either surface, including old saves.

The implementation therefore needs a semantic financial-event representation such as
`messageId + typed args`, while retaining the legacy string only for compatibility or diagnostics.
The RU renderer must cover every known legacy financial shape during migration. Unknown text must
fail localization LQA visibly in development; it may not silently appear as an English island in a
Russian career. Message ids, not localized text, remain the stable values in saves, tests and RNG
inputs.

## 3. Family budget shell

| id | source meaning | English | Russian |
| --- | --- | --- | --- |
| RU06-M01 | back aria | `Back to Home` | `Вернуться на экран «Дом»` |
| RU06-M02 | screen heading | `Family Budget` | `Семейный бюджет` |
| RU06-M03 | account subtitle | `{money} in the account · {week}` | `На счёте {money} · {week}` |
| RU06-M04 | chapter group aria | `Which part of the budget` | `Раздел семейного бюджета` |
| RU06-M05 | spend tab aria | `Where the money went in the chosen period` | `Куда ушли деньги за выбранный период` |
| RU06-M06 | bills tab aria | `The recurring costs the family has signed up to` | `Регулярные расходы семьи` |
| RU06-M07 | history tab aria | `Every season, and every transaction` | `Все завершённые сезоны и операции` |
| RU06-M08 | shop tab aria | `What the family can buy with what is left` | `Что семья может купить на оставшиеся деньги` |
| RU06-M09 | tabs | `Spending / Bills / History / Shop` | `Расходы / Обязательства / История / Магазин` |

Debt warning:

> `{weeksBelowZero} без денег на счёте · до окончательного банкротства {weeksLeft}. Одна неделя с положительным остатком обнулит этот срок.`

Both counts require plural-aware duration values. `Без денег на счёте` is preferable to literal
`ниже нуля`: it names the situation rather than asking the player to decode a chart metaphor.
The last sentence preserves the real reset rule and must not become the vaguer `исправит положение`.

## 4. Spending summary and periods

| English | Russian |
| --- | --- |
| `Last 12 weeks` | `Последние 12 недель` |
| short `12 weeks` | `12 недель` |
| `This season` | `Этот сезон` |
| `Budget period` | `Период бюджета` |
| `Total income` | `Доходы` |
| `Total spent` | `Расходы` |
| `Balance` | `Итого` |
| `No spending in this window yet.` | `За этот период расходов пока нет.` |
| `Income` | `Доходы` |
| donut `spent` | `потрачено` |
| `View all transactions` | `Все операции` |

`Итого` is the net change for the selected period; `Остаток` is reserved for the live account
balance. Calling both figures `Баланс` would hide that difference.

### 4.1 Expense categories

| category id | English | Russian |
| --- | --- | --- |
| coaching | `Coaching` | `Тренер` |
| facility | `Courts & facility` | `Корты и база` |
| travel | `Travel` | `Поездки` |
| entry | `Entry fees` | `Заявочные взносы` |
| gear | `Gear` | `Экипировка` |
| stringing | `Stringing` | `Натяжка струн` |
| physio | `Fitness & medical` | `Подготовка и медицина` |
| staff | `Support staff` | `Команда` |
| vacation | `Vacations` | `Отпуск` |
| practice | `Practice matches` | `Тренировочные матчи` |
| tuition | `College tuition` | `Учёба в университете` |
| shop | `The shop` | `Магазин` |
| other | `Other` | `Прочее` |

`Команда` is intentionally broader than `Персонал`: the category holds salaried specialists who
travel with her, not employees of a venue. If later staff includes non-sport household labour, the
label must be revisited against the actual category membership.

### 4.2 Training bill and coach share

With a hired coach:

> `Ориентир на неделю – {total}: тренер {coach}, корты {facility}. Итог каждой недели немного отличается: меняется число занятий и стоимость кортов. Обычный диапазон – {lo}–{hi}.`

When the family coaches her:

> `Ориентир по кортам на неделю – {facility}. Вы тренируете её сами, поэтому отдельной оплаты тренеру нет. Итог каждой недели немного отличается: меняется число занятий и стоимость кортов. Обычный диапазон – {lo}–{hi}.`

Coach results share:

> `Доля тренера от результатов – {money} {window}; сумма уже входит в строку «Тренер» выше. Тренеру перечисляется {pct}% с каждого призового чека.`

`{window}` is a complete grammatical fragment: `за этот сезон` or `за последние 12 недель`. It
must not be produced by lowercasing the tab label.

## 5. Weekly household strip

| source meaning | English | Russian |
| --- | --- | --- |
| heading | `Household, every week` | `Семья за неделю` |
| figures | `{in} in – {out} out – {net} short` | `доход {in} – расход {out} – не хватает {net}` |
| positive figures | `{in} in – {out} out – {net} left over` | `доход {in} – расход {out} – остаётся {net}` |
| positive shelf | `The shelf is in that – it adds {money} a week at today's rates.` | `Имущество уже учтено: по текущим ставкам оно приносит {money} в неделю.` |
| negative shelf | `The shelf is in that – it costs {money} a week at today's rates.` | `Имущество уже учтено: по текущим ставкам оно обходится в {money} в неделю.` |
| upkeep | `Keeping what you own is {money} a week of that, and it is real money.` | `Содержание имущества уже стоит семье {money} в неделю – это реальные расходы.` |
| businesses | `Their businesses bring in {total} a week of that – {parts}.` | `Семейные проекты уже приносят {total} в неделю: {parts}.` |
| merch part | `merch {money}` | `бренд {money}` |
| academy part | `the academy {money}` | `академия {money}` |

The strip must render the positive and negative sentence as separate locale messages. Translating
`short / left over` as a suffix would produce ungrammatical fragments and an inaccessible reading
order.

## 6. Recurring budget and rehabilitation

| English | Russian |
| --- | --- |
| heading `Budget` | `Регулярные расходы` |
| `Physio recovery` | `Физиотерапия` |
| weekly retainer note | `Абонемент снижает риск травмы, ускоряет восстановление и понемногу поддерживает форму. Оплата списывается только за недели без травмы.` |
| hurt now | `Она травмирована, поэтому на этой неделе оплачивается восстановление: {band} – независимо от абонемента выше.` |
| healthy comparison | `Неделя с травмой вместо этого оплачивается по тарифу восстановления: {band} – независимо от абонемента выше.` |
| starting funds | `На старте карьеры у семьи было {money}.` |
| bills subgroup aria | `Раздел обязательств` |

`Физиотерапия` is the service on this card; the person remains `физиотерапевт` elsewhere. The two
rates remain separate messages so Russian syntax does not depend on injecting half a sentence from
a conditional template.

## 7. Her equipment

### 7.1 Frame and condition

| English | Russian |
| --- | --- |
| `Her kit` | `Её экипировка` |
| `Strings` | `Струны` |
| `Racket` | `Ракетка` |
| `Shoes` | `Обувь` |
| `Fresh` | `Новая` |
| `Fine` | `В порядке` |
| `Worn` | `Изношена` |
| `Gone` | `Пора менять` |

`Новая / Изношена` agrees with each of the three Russian line nouns only by accident for racket and
shoes and fails for plural `струны`. Condition therefore cannot remain one translated string table.
Use a neutral condition family (`Новые`, `В порядке`, `Изношены`, `Пора менять`) for strings and the
feminine family for racket/shoes, or store complete per-line labels. Do not infer grammatical number
from an English display label.

Equipment explanation:

> `Новая экипировка играет одинаково при любой цене. Более высокий уровень даёт другое: она дольше не изнашивается. Семья платит при каждой замене, а не один раз. Цена следующей замены немного меняется, поэтому ниже указан ориентир.`

Rung metadata:

- `{goodWeeks} без заметного износа`;
- current rung: `{goodWeeks} без заметного износа · осталось {weeksLeft}`;
- estimated price: `Около {money}`;
- fully covered estimate: `Около {sticker} · бесплатно для семьи`;
- partly covered estimate: `Около {sticker} · семье {payable}`.

`goodWeeks` and `weeksLeft` are plural-aware durations. `Хороших недель` is rejected: it sounds
like a judgement on training quality rather than the equipment wear model.

### 7.2 Purchase confirmation

Full family payment:

> `Купить {item} за {price}? Она начнёт играть с этой экипировкой на этой неделе, а все следующие замены будут оплачиваться на этом уровне.`

Sponsor covers everything:

> `Купить {item}? Спонсор оплатит всю сумму – {sticker} из сезонного лимита. Она начнёт играть с этой экипировкой на этой неделе, а все следующие замены будут оплачиваться на этом уровне.`

Partly covered:

> `Купить {item} за {payable}? Спонсор покроет {covered} из полной цены {sticker}. Она начнёт играть с этой экипировкой на этой неделе, а все следующие замены будут оплачиваться на этом уровне.`

Button: `Купить`. The item name needs an accusative-ready localized form or a neutral construction
such as `Перейти на уровень «{label}»`. Concatenating an English-style label after `купить` is not a
general Russian solution.

### 7.3 Equipment catalogue copy

Fictional product names remain marks; generic rung names are translated. Their descriptions are
player-facing engine data and must not pass through the snapshot as finished English prose.

| line / rung | display name | Russian description |
| --- | --- | --- |
| strings / starter | `Клубная синтетика` | `Недорогой нейлон – через пару недель теряет упругость.` |
| racket / starter | `Ashline Alloy` | `Тяжёлая стартовая алюминиевая ракетка – медленная, жёсткая и сильно нагружает руку.` |
| shoes / starter | `Court Basics` | `Плоская подошва без поддержки – скользит там, где должна держать корт.` |
| strings / standard | `Multifil Standard` | `Обычная натяжка – служит нормально, пока вдруг не перестаёт.` |
| racket / standard | `Ashline Composite` | `Такая ракетка есть у большинства юниорок. В ней нет ничего плохого.` |
| shoes / standard | `Baseline Trainer` | `Полноценная теннисная обувь среднего уровня.` |
| strings / performance | `Kestra Control` | `Хорошо держит натяжение – даже на четвёртой неделе струны ещё живые.` |
| racket / performance | `Kestra Team 98` | `Современная серийная ракетка, которая гораздо дольше остаётся в порядке.` |
| shoes / performance | `Kestra Grip` | `Надёжная поддержка стопы. Меньше подвернутых голеностопов.` |
| strings / tour | `Kestra Tour Gut` | `Такими струнами пользуются в туре. Всегда свежая натяжка.` |
| racket / tour | `Kestra Pro Stock` | `Индивидуальный вес. Она уже не перерастёт эту ракетку.` |
| shoes / tour | `Kestra Tour` | `Подогнаны по ноге, хорошо амортизируют и меняются до износа.` |

`Ashline`, `Kestra`, `Multifil Standard`, `Court Basics` and other fictional catalogue marks may
remain Latin-script names by design; they are not accidental English fallback. The decision should
be applied to the same names in purchase events and sponsor letters.

## 8. Equipment sponsorship

Covered line terms:

| source data | Russian display |
| --- | --- |
| strings | `струны` |
| frame / racquets | `ракетки` |
| shoes | `обувь` |

The list formatter produces `струны и ракетки` or `струны, ракетки и обувь`; do not insert a
pre-translated English conjunction at the component call site.

Contract term:

> `{seasons} · {fromWeek} – {untilWeek} {weeksLeft}`

Contract obligations:

> `Спонсор предоставляет ей {coveredItems}, а она должна сыграть не менее чем на {events} за сезон.`

The event count expands to `не менее чем на 1 турнире / 2 турнирах / 5 турнирах`. Do not render
`на 1 турнире` by joining a number to an invariant noun.

| English | Russian |
| --- | --- |
| `Allowance left this season` | `Остаток лимита на сезон` |
| `{spent} of {allowance} used` | `Использовано {spent} из {allowance}` |
| projection | `При таком темпе лимит закончится примерно к {week}.` |

Allowance spent:

> `Сезонный лимит исчерпан. До начала нового сезона семья оплачивает {coveredItems} полностью. Спонсор по-прежнему следит за своевременной заменой, а с первой недели нового сезона снова начнёт оплачивать покупки.`

Per-line states:

- no allowance: `Спонсор следит за своевременной заменой, но сезонный лимит исчерпан. До нового сезона эту покупку оплачивает семья.`
- partial: `Спонсор предоставляет эту экипировку и следит за своевременной заменой. В лимите осталось только {remaining}, поэтому более дорогой уровень будет оплачен частично: зачёркнута полная цена, рядом указана доля семьи.`
- covered: `Спонсор предоставляет эту экипировку и следит за своевременной заменой. Пока в сезонном лимите остаётся {remaining}, покупки оплачивает спонсор.`

## 9. Advertising contracts

| source label | Russian |
| --- | --- |
| `Watches` | `Часы` |
| `Cars` | `Автомобили` |
| `Drinks` | `Напитки` |
| `Clothing` | `Одежда` |
| `Airline` | `Авиакомпания` |
| `Fragrance` | `Парфюмерия` |
| `The capstone` | `Главный контракт` |
| `The lifetime deal` | `Пожизненный контракт` |

Portfolio explanation:

> `В каждой категории может быть один контракт. Сумма зависит от её положения, число мест – нет. Контракт записывается на полную сумму, а семья получает {pct}% комиссии за работу менеджера.`

Fame line:

> `Узнаваемость – {fame} из 100. Результаты на корте задают основу, рекламные съёмки усиливают её, а собственный бренд продаёт благодаря ей.`

States and gates:

| English shape | Russian |
| --- | --- |
| `Open – nobody signed` | `Открыто – контракта пока нет` |
| `Not open yet` | `Пока закрыто` |
| `Opens inside WTA #{rank}` | `Откроется при месте в рейтинге WTA не ниже {rank}` |
| `{held} of {needed} top-10 seasons` | `Сезонов в топ-10: {held} из {needed}` |
| `{held} of {needed} Slams` | `Титулов Большого шлема: {held} из {needed}` |
| `{money} a year · for life` | `{money} в год · пожизненно` |
| `{money} a year · one year · runs to {week}` | `{money} в год · 1 год · до {week}` |
| `{money} a year · {n} years · runs to {week}` | `{money} в год · {years} · до {week}` |
| open cash note | `Следующее письмо в этой категории предложит около {money} в год при её нынешнем положении.` |
| empty below age gate | `Показывать пока нечего. Категории открываются с {age}, а затем заполняются письмами по мере её роста.` |

Use `топ-10` consistently, not a mixture of `Top 10`, `ТОП-10` and `первая десятка`. `WTA` remains
the tennis mark. `С {age}` requires the age formatter (`с 16 лет`), not a bare interpolated number.

## 10. Academy support

| English | Russian |
| --- | --- |
| `Her academy` | `Её академия` |
| support note | `Академия оплачивает {pct}% каждой поездки, на которую она заявлена. Суммы поездок в календаре и истории уже показаны за вычетом этой поддержки. Условия пересматриваются раз в год.` |
| `Travel they have paid` | `Оплачено академией` |
| `since the last review` | `с последнего пересмотра` |
| `With them since {week}.` | `В академии с {week}.` |

`Скидка` is avoided: the academy pays part of the travel; it is not a shop discount. The ledger
must still clarify whether the displayed trip is gross or net.

## 11. Season history and ledger

| English | Russian |
| --- | --- |
| `Completed seasons` | `Завершённые сезоны` |
| `Her first season is still running – it lands here when the year wraps up.` | `Первый сезон ещё идёт. После его завершения здесь появится итог.` |
| `Season {n} – {year}` | `Сезон {n} · {year}` |
| `{money} in` | `доход {money}` |
| `not recorded` | `нет данных` |
| legacy note | `В сезонах, сыгранных до этой версии, сохранялся только итоговый остаток, поэтому точные расходы неизвестны. Все следующие сезоны записываются полностью.` |
| `All transactions` | `Все операции` |
| `No transactions yet.` | `Операций пока нет.` |

The current value column shows spending as a signed negative amount and metadata shows income. The
heading and accessible description must name that ordering; screen-reader output should not reduce
the row to three unexplained numbers.

The ledger and pinned receipt both consume the same localized financial-event renderer described
in §2.3. A receipt may not translate a saved event differently from its ledger row.

## 12. Her own account on Money

The heading and balance language reuse RU-05. The longer Money explanation becomes:

> `Каждый призовой чек делится до зачисления на этот счёт: её доля поступает ей, остальное получает семья. В строках призовых выше показана сумма, оставшаяся семье; в каждой строке отдельно указана её доля.`

The percentage ramp and balance come from the same RU-05 semantic messages used on Profile. Do not
persist or translate a second prose version of the mechanic.

## 13. Shared action labels

| English | Russian |
| --- | --- |
| `Buy it` | `Купить` |
| `Order it` | `Заказать` |
| `Sell it` | `Продать` |
| `Cancel` | `Отмена` |

The question and button must use the same action: construction with a waiting period is
`заказать`, an immediate acquisition is `купить`, disposal is `продать`.

## 14. Implementation boundary for this first slice

Runtime localization must move these display facts out of the component without moving business
logic into the catalogue:

- category ids, tab ids, kit line ids and ad category ids stay stable English/internal enums;
- locale selects labels after the engine has selected a category, row and deterministic corpus id;
- `formatCents`, dates and durations become locale-aware shared formatters;
- the full positive/negative household sentences are message variants, not translated suffixes;
- kit condition strings receive grammatical number from semantic line metadata;
- advertising gates render from typed values rather than English string concatenation;
- stored financial events receive semantic message ids and typed arguments, with tested migration
  coverage for old saves.

## 15. LQA checklist for Money

- Inspect 320 px and 390 px widths for the four chapter labels and `Рекламные контракты` subtab.
- Exercise positive, zero and negative account balances, including the debt countdown at 1, 2, 5,
  11, 21 and 22 weeks.
- Verify hired-coach and self-coached bill notes against the same snapshot numbers as the ledger.
- Exercise full, partial and exhausted sponsor allowance states for every kit line.
- Check singular/few/many years and weeks, including `последняя неделя`.
- Load a pre-localization save and confirm that the ledger and receipt contain no English event
  text.
- Compare every ledger amount and running balance before/after localization; only presentation may
  change.
- Screen-reader pass: chapter controls, period controls, kit rungs and transaction rows must remain
  meaningful without layout or colour.

The remaining sections of RU-06 will extend this file with support staff, shop/assets, inbox and
all offer-letter corpora. This first slice is complete for `MoneyScreen.vue` and
`HouseholdStrip.vue`; shared dialogs and event writers are completed with their owning later
sections rather than duplicated here.
