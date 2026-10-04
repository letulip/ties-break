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

## 16. Specialists chapter

The parent tab label is RU-05's **`Специалисты`**. The shared household strip above it reuses §5
without a second wording. The three seats keep distinct jobs:

- the massage therapist helps the body recover and may travel;
- the psychologist works by weekly call, never needs a travel fare and receives one yearly focus;
- the hitting partner protects match timing during gaps and may extend that work to tour weeks.

| English | Russian |
| --- | --- |
| `Masseur` | `Массажист` |
| `Psychologist` | `Психолог` |
| `Hitting partner` | `Спарринг-партнёр` |
| `{money} /wk` | `{money} в неделю` |
| `Locked` | `Закрыто` |
| `Hire` | `Нанять` |
| `Let go` | `Уволить` |
| confirm `Set it` | `Выбрать` |

`Массажист` follows the established product term even though the work described includes broader
recovery. Do not alternate it with `массажистка` based on portrait art: the engine stores a seat,
not a character identity or grammatical gender.

Shared professional gate:

| seat | Russian locked detail |
| --- | --- |
| massage therapist | `Первый зачётный результат в серии W откроет место для массажиста.` |
| psychologist | `Первый зачётный результат в серии W откроет место для психолога.` |
| hitting partner | `Первый зачётный результат в серии W откроет место для спарринг-партнёра.` |

`Зачётный результат` reuses the ranking vocabulary that Stats teaches. `Серия W` retains the
product's tier mark rather than expanding it into an invented tour name.

## 17. Massage therapist

### 17.1 Card states and schedule

| state | English | Russian |
| --- | --- | --- |
| available, not hired | `Table work at home every week, and a hand on every rehab – layoffs end sooner.` | `Работа за массажным столом дома каждую неделю и помощь при восстановлении – паузы после травм становятся короче.` |
| active injury, time saved | `Working the rehab – her return is closer than the clinic promised.` | `Помогает с восстановлением – она вернётся раньше первоначального срока.` |
| active injury, no save yet | `On the table through the layoff – the rehab is in professional hands.` | `Работает с ней всю паузу – восстановлением занимается специалист.` |
| recent saved weeks | `Weeks bought back – the last layoff ended sooner than it should have.` | `Удалось вернуть несколько недель – последняя пауза закончилась раньше первоначального срока.` |
| ordinary hired week | `Fresh legs – the weekly table work keeps her body ahead of the grind.` | `Ноги успевают восстановиться – еженедельный массаж помогает телу выдерживать нагрузку.` |

`Клиника обещала` is rejected for the first line: a clinic does not make a personal promise, and the
saved fact is the original medical return date. `Несколько недель` deliberately carries no exact
number, matching the room-note fog law.

Schedule control:

| English | Russian |
| --- | --- |
| group aria `Masseur sessions per week` | `Сеансы массажа в неделю` |
| `Twice a week` | `Дважды в неделю` |
| `Every other day` | `Через день` |
| `Daily` | `Каждый день` |
| invalid choice | `Такого расписания нет: доступны сеансы дважды в неделю, через день или каждый день.` |

Hire confirmation:

> `Нанять массажиста за {salary} в неделю ({schedule})? Договор можно прекратить в любую неделю, как и договор с тренером.`

Release confirmation:

> `Уволить массажиста? Еженедельные выплаты прекратятся, а восстановлением снова будет заниматься только клиника.`

The schedule in parentheses is a localized grammatical fragment already suited to that position;
never lowercase or inflect a display label mechanically.

### 17.2 Tournament travel

| English | Russian |
| --- | --- |
| heading | `Массажист ездит на турниры` |
| no booked trips | `Массаж между матчами. Каждая поездка добавляет ещё один билет, а турнирная неделя оплачивается по числу сыгранных матчей – {sessionPrice} за сеанс – вместо обычной недельной ставки.` |
| booked trips suffix | `По {trips} заявленным поездкам дополнительные билеты стоят {fare}.` |
| travel on aria | `Поездки массажиста включены. Нажмите, чтобы массажист оставался дома.` |
| travel off aria | `Поездки массажиста выключены. Нажмите, чтобы добавить массаж между матчами; каждая поездка потребует ещё одного билета.` |
| on benefit | `Ездит с ней: массаж между матчами. Чем дальше она проходит, тем больше пользы; после поражения в первом круге дополнительных сеансов нет.` |
| off benefit | `Остаётся дома в турнирные недели. На каждой поездке семья экономит один билет.` |

`{trips}` is a complete counted form (`1 заявленной поездке`, `2 заявленным поездкам`). The fare is
the total over those trips, not a per-trip value.

### 17.3 Raises, changes and receipts

These strings are feed or ledger events and need semantic ids for old-save conversion:

| source event | Russian |
| --- | --- |
| hired | `Массажист присоединяется к команде – еженедельная работа дома.` |
| released | `Массажист покидает команду – восстановлением снова занимается только клиника.` |
| rate raise, can reduce | `С этой недели сеанс массажа стоит {rate}. Можно сохранить нынешнее расписание по новой цене или сократить число сеансов.` |
| rate raise, bottom rung | `С этой недели сеанс массажа стоит {rate}. Уже выбрано минимальное расписание – {schedule}; сократить его нельзя.` |
| schedule changed | `Расписание массажиста изменено – {schedule} начиная со следующего счёта.` |
| travel enabled | `Теперь массажист ездит на турниры – ещё один билет на поездку и массаж между матчами.` |
| travel disabled | `В турнирные недели массажист остаётся дома – работа продолжится после её возвращения.` |
| weekly expense | `Массажист – сеансы на этой неделе` |
| return receipt | `Вернулась из поездки – дополнительный сеанс помогает снять накопившуюся нагрузку с ног.` |

The raise notice is two different message ids because the available decision differs. Localizing a
single English lead and appending conditional prose would again encourage invalid string assembly.

## 18. Psychologist

### 18.1 Roster and card

| English | Russian |
| --- | --- |
| group aria `Psychologist – who takes the weekly call` | `Психолог – кто проводит еженедельную сессию` |
| `Counsellor` | `Консультант` |
| `Sport psychologist` | `Спортивный психолог` |
| `Tour-grade specialist` | `Специалист уровня тура` |
| not hired | `Еженедельная сессия для психологической подготовки. Направление работы выбирается на год.` |
| hired, no focus | `На контракте – одна дистанционная сессия в неделю, где бы она ни находилась.` |
| no travel fare | `Дополнительный билет не нужен: сессии проходят дистанционно – дома, в поездках и во время восстановления.` |
| invalid roster choice | `Такого варианта нет: доступны консультант, спортивный психолог и специалист уровня тура.` |

Hire confirmation:

> `Нанять психолога за {salary} в неделю ({rung})? Договор можно прекратить в любую неделю, как и договор с тренером.`

Release confirmation:

> `Уволить психолога? Еженедельные выплаты прекратятся, а последняя сессия пройдёт на этой неделе.`

The English line says the calls end “with the week”; `последняя сессия пройдёт на этой неделе`
makes that boundary legible instead of sounding as though a call is currently being disconnected.

### 18.2 The year's work

Group aria: **`Направление работы с психологом на этот год`**.

| focus id | English label | Russian label | Russian explanation |
| --- | --- | --- | --- |
| coolhead | `Cool head` | `Хладнокровие` | `В этом году работа сосредоточена на решающих розыгрышах – и на том, с какой головой она к ним подходит.` |
| recovery | `Back on her feet` | `Вернуться в форму` | `В этом году работа сосредоточена на возвращении после тяжёлых недель и срывов.` |
| listen | `Learning to listen` | `Учиться слышать её` | `В этом году работа помогает вам лучше слышать её. Содержание сессий остаётся её личным делом.` |
| herself | `Working on herself` | `Работа над собой` | `В этом году работа касается того, о чём она не говорит вслух. Но этого должна хотеть она сама.` |
| publicLife | `The public life` | `Публичная жизнь` | `В этом году работа касается жизни под камерами – и того, сколько сил у неё отнимает чужое внимание.` |

Do not recreate the English lowercased splice. The hired card can render two complete Russian
sentences: `На контракте. {focusExplanation}`. Each explanation remains valid by itself under the
choice card, which removes a locale-specific first-letter mutation.

Focus confirmation:

> `Выбрать направление «{focus}» на этот сезон? Направление выбирается один раз на сезон; следующий выбор откроется в следующее межсезонье.`

Refusals:

| source fact | Russian |
| --- | --- |
| nobody hired | `Еженедельную сессию пока никто не проводит. Сначала наймите психолога.` |
| unknown internal id | `Такого направления работы нет.` |
| already chosen | `Направление на этот сезон уже выбрано. Следующий выбор откроется в межсезонье.` |
| adult joint decision declined | `Теперь это её решение не меньше, чем ваше – и она не согласна.` |
| herself not ready | `К этому она пока не готова – такого решения прежде всего должна хотеть она сама.` |

The adult decline is daughter agency, not a system failure. It stays direct and does not expose the
hidden relationship band. The invalid-id refusal is unreachable UI diagnostics and need not carry
the English conversational `that is not one of them` flourish.

### 18.3 Psychologist events

| source event | Russian |
| --- | --- |
| hired | `Психолог присоединяется к команде – одна дистанционная сессия в неделю.` |
| released | `Психолог покидает команду – сессии заканчиваются на этой неделе.` |
| roster changed | `Еженедельные сессии теперь проводит {rung}; новая ставка начнёт действовать со следующего счёта.` |
| weekly expense | `Психолог – еженедельная оплата` |

Focus-effect observations that fire in other engine modules belong to RU-11's generated-feed pass;
their semantic ids must still reference the focus ids above rather than duplicate the labels.

## 19. Hitting partner

### 19.1 Card and experience ladder

| English | Russian |
| --- | --- |
| active | `Помогает сохранять чувство мяча в недели без матчей.` |
| available, not hired | `Постоянный соперник для игровых тренировок в недели без турниров.` |
| stood down | `Спарринг-партнёр остаётся в команде, но на этой неделе не работает. Оплата не списывается.` |
| group aria | `Уровень спарринг-партнёра` |
| `A college hitter` | `Игрок студенческой лиги` |
| `A journeyman pro` | `Опытный профессионал` |
| `A top-100 partner` | `Партнёр из топ-100` |
| first rung note | `На четверть сокращает потерю игрового ритма за неделю без матча.` |
| second rung note | `Вдвое сокращает потерю игрового ритма за неделю без матча.` |
| third rung note | `На три четверти сокращает потерю игрового ритма за неделю без матча.` |

`Чувство мяча` is natural tennis speech for timing in the compact card. The rung explanations use
the more explicit `игровой ритм`, because they describe a measured mechanic and must distinguish a
quarter **removed** from a quarter **remaining**.

Hire confirmation:

> `Нанять спарринг-партнёра за {salary} в неделю ({rung})? Договор можно прекратить в любую неделю, как и договор с тренером.`

Release confirmation:

> `Уволить спарринг-партнёра? Еженедельные выплаты прекратятся, и регулярных игровых тренировок между турнирами больше не будет.`

### 19.2 Tournament travel

| English | Russian |
| --- | --- |
| heading | `Поездки на турниры` |
| base rule | `Взять спарринг-партнёра в тур – ещё один билет на каждую поездку. Домашние тренировки уже включены; эта настройка добавляет работу в турнирные недели.` |
| booked suffix | `По {trips} заявленным поездкам дополнительные билеты стоят {fare}.` |
| on aria | `Поездки спарринг-партнёра включены. Нажмите, чтобы спарринг-партнёр оставался в домашнем клубе.` |
| off aria | `Поездки спарринг-партнёра выключены. Нажмите, чтобы брать спарринг-партнёра в тур; каждая поездка добавит один билет.` |

### 19.3 Hitting-partner events

| source event | Russian |
| --- | --- |
| hired | `Спарринг-партнёр присоединяется к команде – регулярные игровые тренировки в недели без матчей.` |
| released | `Спарринг-партнёр покидает команду – регулярные игровые тренировки между турнирами заканчиваются.` |
| rung changed | `Уровень работы со спарринг-партнёром изменится со следующего счёта – {rung}.` |
| travel enabled | `Теперь спарринг-партнёр ездит с ней – ещё один билет на поездку и постоянный соперник для тренировок в туре.` |
| travel disabled | `Спарринг-партнёр остаётся в домашнем клубе – без дополнительного билета и без постоянного соперника для тренировок в туре.` |
| weekly expense | `Спарринг-партнёр – еженедельная оплата` |
| first-match-back receipt | `Первый матч после паузы не выглядел первым матчем после паузы.` |

The repetition in the receipt is intentional and survives Russian. `Не был похож` would be smoother
but turns the line into a detached comparison; `не выглядел` keeps the parent's observed verdict.

## 20. Specialists implementation and LQA

- Seat ids, rung indices and psychologist focus ids remain internal and locale-independent.
- Every card line/refusal from the engine becomes a semantic message, not a finished string on the
  snapshot. The command and disabled card must resolve the same message id.
- Rung changes pass a rung id to the renderer. Do not lowercase English labels or persist Russian
  labels in history.
- Hire/release/travel/salary events need typed legacy conversion so an old save shows Russian feed
  and ledger rows.
- At 320 px, inspect the three rung controls, psychologist five-focus grid, fare copy and the longest
  `Специалист уровня тура` label.
- Exercise every seat locked, available, hired, stood down and released; for the masseur also every
  injury-room note and zero/one/many booked trips.
- Exercise psychologist focus at ages below and above the joint-choice boundary and all relationship
  refusals without exposing a hidden bond number.
- Verify that toggling travel or a rung changes the household strip by the exact same cents as before
  localization.

## 21. Family assets – front door

`The shelf` is a useful English metaphor but a literal `Полка` makes the Russian screen sound like
an inventory puzzle. The chapter contains deposits, property, businesses and commissioned builds,
so its Russian product name is **`Семейные активы`**. Individual copy may say `актив`, `вложение`,
`машина` or `дом` when the object is known; it must not force every possession into financial
jargon.

| id | source meaning | English | Russian |
| --- | --- | --- | --- |
| RU06-S01 | shop home heading | `The shelf` | `Семейные активы` |
| RU06-S02 | category group aria | `Which part of the shelf` | `Раздел семейных активов` |
| RU06-S03 | owned summary label | `What you own` | `В собственности` |
| RU06-S04 | owned count | `{count} thing / things` | `{count, plural, one {# актив} few {# актива} many {# активов} other {# актива}}` |

Intro:

> `Это собственные деньги семьи, и ни одна сумма здесь не принадлежит ей. Ничто из этого не сделает её сильнее, быстрее или выносливее: здесь видно, во что превращаются деньги, когда теннису они больше не нужны.`

Empty state:

> `У вас пока ничего нет. Самый доступный вариант – {label}, от {money}.`

The first sentence describes ownership, not moral entitlement: her business share is already
removed before these family figures are shown. Keep `ни одна сумма здесь не принадлежит ей`; do not
soften it into `это не её деньги`, which can read like a parental reprimand.

## 22. Category cards and family introductions

### 22.1 Six category cards

| key | label | accessible title |
| --- | --- | --- |
| `invest` | `Вложения` | `Деньги, которые остаются деньгами` |
| `business` | `Бизнес` | `То, чем владеет и на чём зарабатывает семья, включая академию` |
| `cars` | `Машины` | `Семейный гараж` |
| `property` | `Жильё` | `Свой дом` |
| `water` | `На воде` | `Лодки и яхты, которые строятся на заказ` |
| `air` | `В воздухе` | `Семейный самолёт` |

The short labels are shared by the illustrated front door and the inner segmented row. The academy
remains inside `Бизнес`; it does not become a seventh category in Russian.

### 22.2 Family headings and notes

| family | heading | note |
| --- | --- | --- |
| investment | `Вложения` | `Деньги, которые остаются деньгами. Указанная сумма – минимум, а не цена: можно вложить больше.` |
| car | `Машины` | `В следующем сезоне каждая из них будет стоить меньше, чем сегодня. Так устроены машины.` |
| house | `Недвижимость` | `Крупная и неспешная покупка, после которой больше не нужно платить за чужое жильё.` |
| business | `Собственный бизнес` | `Первый актив здесь, который приносит доход. Он зависит от того, насколько она известна – от съёмок и титулов, а не от места в рейтинге.` |
| boat | `На воде` | `Их не покупают готовыми, а заказывают: деньги уходят сейчас, лодка приходит через годы. Содержание каждой стоит одной зарплаты в неделю.` |
| plane | `В воздухе` | `Семейный самолёт вдвое сокращает стоимость перелёта на каждый турнир, но и содержать его приходится как самолёт.` |
| academy | `Её академия` | `Четыре последовательных этапа, и каждый – отдельное решение. После завершения каждый этап приносит доход: чем выше и дольше она держалась в рейтинге, тем больше. Академия останется после завершения карьеры.` |

Business-share explanation:

> `Она получает {kidPct}% дохода; ниже показаны семейные {familyPct}%. Стоимость актива – это стоимость всего бизнеса.`

The sentence is hidden at a zero daughter share exactly as it is today. `Дохода`, not `прибыли`, is
deliberate: the engine splits the incoming amount and does not model company costs before that split.

## 23. Asset catalogue

These are display resources keyed by the existing stable item ids. The retired long-range plane is
included because an old save may still own and render it.

| asset | Russian label | Russian description |
| --- | --- | --- |
| savings deposit | `Сберегательный вклад` | `Самый спокойный вариант: деньги не пропадут, но и большого дохода не принесут.` |
| index fund | `Индексный фонд` | `Доля всего рынка. Плохие годы у него бывают; плохого десятилетия ещё не было.` |
| sensible estate | `Практичный универсал` | `Пять дверей и багажник для сумок с экипировкой. Никто не обернётся вслед.` |
| luxury four-by-four | `Роскошный внедорожник` | `Высокий, тихий – и ни разу не съедет с асфальта.` |
| poster sports car | `Тот самый с плаката` | `Два места, никакого багажника – тот самый, что висел на стене.` |
| unreasonable convertible | `Совершенно неразумный` | `Четыре места, никакой крыши и ни одного разумного оправдания.` |
| first house | `Своё жильё` | `Больше никакой аренды. Небольшое, их по документам, и стены можно красить как хочется.` |
| garden house | `Дом с садом` | `Места хватит всем, а сад больше не нужно ни с кем делить.` |
| villa | `Вилла с бассейном` | `Стекло, тёплый камень и собственный бассейн.` |
| headland house | `Дом на мысе` | `Над морем, с бассейном, который будто переливается прямо в него.` |
| merchandise brand | `Собственный бренд` | `Её имя на футболках и сумках. Пока о ней говорят, всё это продаётся.` |
| sailing boat | `Парусная лодка` | `Две каюты, мачта и выходные, которыми распоряжается ветер.` |
| small yacht | `Небольшая яхта` | `Флайбридж, четыре спальных места и бухта, где можно встать на якорь.` |
| yacht | `Яхта` | `Команда из шести человек и неделя, за которую до них никто не доберётся.` |
| big yacht | `Большая яхта` | `Та самая, ради которой в гавани освобождают место.` |
| small plane | `Небольшой самолёт` | `Семь мест, короткие полосы и возможность вернуться домой в тот же день.` |
| plane | `Самолёт` | `Десять мест и ни одного аэропорта, который заставит их ждать.` |
| retired long-range plane | `Дальнемагистральный самолёт` | `До Мельбурна без посадки и с кроватью на обратном пути.` |
| academy land | `Земля` | `Двенадцать гектаров за городом и имя в документах на собственность.` |
| academy courts | `Корты` | `Шестнадцать кортов и освещение, с которым можно играть до девяти.` |
| academy clubhouse | `Клубный дом` | `Зал, кухня, сорок мест и комната для домашних заданий.` |
| academy staff | `Команда академии` | `Тренеры, физиотерапевты и человек, который отвечает на звонки.` |

`Флайбридж` is accepted Russian yachting vocabulary; replacing it with a long explanation would
flatten the one place where the purchase is allowed to sound knowingly luxurious. `До девяти`
retains the human clubhouse image without inventing whether that means morning or evening.

## 24. Price, ownership, build and chart copy

### 24.1 Rates, upkeep and dependencies

| source shape | Russian |
| --- | --- |
| `Worth {x} years of what it sells` | `Оценивается в {x} годовых выручки` |
| `Loses {pct}% a season` | `Теряет {pct}% за сезон` |
| `Neither gains nor loses` | `Стоимость не меняется` |
| `Gains about {pct}% a season` | `Растёт примерно на {pct}% за сезон` |
| `{money} a week to keep` | `Содержание – {money} в неделю` |
| `Brings in {money} a week right now` | `Сейчас приносит {money} в неделю` |
| `{prior} has to come first.` | `Сначала нужен предыдущий этап: {prior}.` |

`{x}` is a valuation multiple, not a count of calendar years. Keep this message separately keyed
from ordinary year pluralization even though the visible noun is `годовых`.

### 24.2 Commissioned builds

| source meaning | Russian |
| --- | --- |
| progress-ring aria | `Готово {pct}% · завершение: {week}` |
| build wait | `Изготовление на заказ займёт около {duration}.` |
| ordered status | `В заказе` |
| ordered explanation | `До доставки продать нельзя. До этого момента расходов на содержание не будет.` |

`{duration}` uses the normal Russian week/month/year plural rules. Do not build it by concatenating
a number with one English-style unit branch. The due week remains the row value beside `В заказе`.

### 24.3 Owned value and units

| source meaning | Russian |
| --- | --- |
| current-value label | `Текущая стоимость` |
| paid meta | `вложено {money}` |
| units held | `Долей: {units} · средняя цена покупки {average} · сейчас {current}` |
| unowned unit price | `Цена одной доли на этой неделе – {money}` |
| chosen business name | `Работает под названием {name}` |
| change with percentage | `{signedMoney} с момента покупки ({signedPct}%)` |
| change without percentage | `{signedMoney} с момента покупки` |

`formatUnits` must use the active locale, so `1.25` becomes `1,25`. Leading with `Долей:` avoids
trying to inflect a noun after an arbitrary fractional value. The selected name is player-authored
content and is rendered unchanged.

### 24.4 Fund chart

| source meaning | Russian |
| --- | --- |
| range group aria | `Период графика` |
| ranges | `6 месяцев / 1 год / 2 года / 5 лет` |
| empty plot | `Пока есть цены только за один месяц – график появится в следующем.` |
| unavailable summary | `Пока недостаточно месяцев, чтобы построить график` |
| chart summary | `Одна доля, помесячно: с {from} по {to}; минимум {low}, максимум {high}` |
| purchase-mark aria | `Покупка: {month}, {money}` |
| purchase bubble | `{month} – {money}` |
| purchase bubble detail | `Долей: {units} · цена доли: {unitPrice}` |

Month labels, money and decimal units come from locale-aware formatters. The visible plot, its
screen-reader summary and its popup must consume the same formatted values rather than implementing
three miniature date or number formatters.

## 25. Buying, naming and selling directly

### 25.1 Inputs and compact actions

| source meaning | Russian |
| --- | --- |
| open stake label | `Сумма, от {minimum}` |
| shared holding field aria | `Сумма, от {minimum} · оставьте поле пустым, чтобы продать всё ({value})` |
| add more | `Пополнить` |
| sell | `Продать` |
| put it in | `Вложить` |
| order it | `Заказать` |
| buy it | `Купить` |
| naming label / aria | `Как это будет называться` |
| naming placeholder | `или введите своё название` |

### 25.2 Name suggestions

The typed value and any already-saved asset name remain unchanged in every locale. Russian affects
only newly generated suggestions and the fallback:

- brand: `{initials}`, `{surname}`, `{fullName}`, `Дом «{surname}»`;
- academy: the existing brand name first, then `Академия «{surname}»`,
  `Академия «{fullName}»`, `Академия {initials}`;
- empty-profile fallbacks: `Бренд` and `Академия`.

Generate the localized suggestion before applying the existing 24-code-point cap and de-duplicate
afterward. A migration must never rewrite an English suggestion the player already accepted: once
saved, it is their proper name, not interface copy.

### 25.3 Purchase confirmations

| purchase kind | Russian question |
| --- | --- |
| top-up | `Вложить ещё {amount} в {label}? Сумма спишется со счёта семьи на этой неделе.` |
| commissioned build, no upkeep | `Заказать {label} за {amount}? Деньги спишутся на этой неделе, заказ будет готов через {duration}.` |
| commissioned build, with upkeep | `Заказать {label} за {amount}? Деньги спишутся на этой неделе, заказ будет готов через {duration}. После доставки содержание будет стоить {upkeep} в неделю.` |
| ordinary purchase | `Купить {label} за {amount}? Сумма спишется со счёта семьи на этой неделе.` |

The renderer receives `duration` as a typed count, not the current prebuilt `N weeks`. This is
required for Russian plural forms and also removes an English-only fragment from the confirmation.

### 25.4 Direct-sale confirmations

The three semantic outcome tails are:

| result | Russian tail |
| --- | --- |
| zero | `по цене покупки` |
| loss | `на {money} меньше цены покупки` |
| gain | `на {money} больше цены покупки` |

Whole sale:

> `Продать {label} за {amount}? Это {tail}.`

Partial withdrawal:

> `Вывести {part} из {label}? Эта часть продаётся {tail}, остальное останется вложено.`

Do not interpolate the English tail into a Russian shell. `result = zero | loss | gain` and the
absolute cent difference are separate typed arguments.

## 26. Secondary market

### 26.1 Controls, quote and status

| id | English | Russian |
| --- | --- | --- |
| SM7 | `List` | `Выставить` |
| SM8 | `Sell now` | `Продать сейчас` |
| SM9 | `Keep it` | `Оставить` |
| SM10 | `Withdraw` | `Снять с продажи` |
| SM11 | `On the market · {weeks} ...` | `В продаже · {weeks, plural, one {# неделя} few {# недели} many {# недель} other {# недели}}` |
| SM12 | `Interest has gone quiet · {weeks} ...` | `Интерес угас · в продаже {weeks, plural, one {# неделя} few {# недели} many {# недель} other {# недели}}` |
| SM13 | bounded wait | `Продажа может занять от {weeksLo} до {weeksHi} недель.` |
| SM14 | offer corridor | `Предложения могут быть от {priceLo} до {priceHi}.` |
| SM15 | immediate exit | `Продать сразу можно за {fire}.` |
| SM16 | thin-market warning | `Покупателей с такой суммой мало – актив может не продаться.` |
| SM17 | academy lot warning | `Академия продаётся единым активом: все завершённые этапы уходят вместе, не только корты.` |
| SM27 | open-ended wait | `Продажа займёт не меньше {weeksLo} недель; покупатель может так и не найтись.` |

`Оставить` means close the quote without selling or listing; it does not withdraw an existing ad.
The separate `Снять с продажи` action keeps those two decisions distinct.

### 26.2 Listing events and refusals

| source meaning | Russian |
| --- | --- |
| listed event | `Выставлено на продажу: {label}` |
| withdrawn event | `Снято с продажи: {label}` |
| parked cash refusal | `Это вложение, а не вещь: выставить его на вторичный рынок нельзя.` |
| academy under construction | `Академию нельзя выставить на продажу, пока один из этапов ещё строится.` |
| duplicate listing | `Этот актив уже выставлен на продажу.` |
| missing listing | `Этот актив не выставлен на продажу.` |

Buyer offers, quiet-market letters, their subjects and signing confirmation are owned by the inbox
section below. They reuse the same semantic lot label and quote cents; the inbox must not parse a
shop event string to recover them.

## 27. Shop events, market reports and refusals

### 27.1 Events and completed history

| source event | Russian |
| --- | --- |
| holding topped up | `Пополнено: {label}` |
| build ordered | `Заказано: {label}` |
| ordinary purchase | `Куплено: {label}` |
| order receipt | `{label} в заказе · готово: {week}` |
| delivered | `Готово: {label}` |
| part sold | `Из актива «{label}» выведено {money} – {tail}.` |
| whole sold | `Продано: {label} – {tail}.` |

For event rows the sale tail is a statement, not the question fragment from section 25:
`по цене покупки`, `на {money} дешевле цены покупки`, `на {money} дороже цены покупки`.
The message id carries the result kind so question and event renderers can choose their own grammar.

Market-season report:

- unchanged: `Рынок за сезон – {label}: без изменений.`;
- up: `Рынок за сезон – {label}: +{pct}%.`;
- down: `Рынок за сезон – {label}: −{pct}%.`;
- crash: `Рынок за сезон – год обвала: {label}, −{pct}%.`.

This numerical form avoids grammatical gender being inferred from a translated label and keeps a
top-up late in the season from being mistaken for the family's personal return.

### 27.2 Command refusals

| English meaning | Russian |
| --- | --- |
| no catalogue item | `Такого объекта нет в каталоге.` |
| retired item | `Этот объект больше не продаётся.` |
| fixed item already held | `Семья уже владеет этим активом.` |
| prerequisite | `Сначала нужен предыдущий этап: {prior}.` |
| below minimum | `Минимальная сумма – {money}.` |
| insufficient funds | `На счёте недостаточно денег.` |
| not owned | `Этого актива нет в собственности семьи.` |
| temporarily unsellable | `Сейчас этот актив продать нельзя.` |
| whole only | `{label} можно продать только целиком.` |
| invalid sale amount | `Укажите сумму больше нуля.` |
| exceeds holding | `В этом активе у семьи только {money}.` |

These are semantic errors returned through the command boundary. Do not translate thrown English
text in the UI and do not use the English message as a catalogue key.

## 28. Shop implementation and LQA

- Stable asset ids, family ids, stake types, academy prerequisites and secondary-market states stay
  locale-independent. `label` and `blurb` become locale resources selected at presentation edges.
- Shop snapshots must carry facts (`messageId`, cents, weeks, result kind, item id), never a
  localized sentence that another component later has to dissect.
- Existing `WorldEvent.text` entries need typed legacy conversion for purchases, builds, deliveries,
  market summaries, listings and sales. Known old English rows render in Russian; unknown rows are
  surfaced in development rather than silently leaking English into a Russian save.
- `formatUnits`, percentages, month labels, week labels and all wait durations use the active locale.
  No `toFixed(2)` result may be printed directly in Russian mode.
- The catalogue includes the retired long-range plane for old-save rendering. A row being absent
  from today's shop does not make its saved history safe to leave untranslated.
- Player-authored brand and academy names are never translated. Locale-specific suggestions apply
  only before a name is accepted.
- At 320 px, inspect the six category cards, the longest academy family note, `Снять с продажи`, the
  shared amount field, every purchase question and the four chart range controls.
- Exercise zero/one/many owned assets, all three change outcomes, fractional units, a one-month
  chart, old purchases without marks, every commissioned build state and the retired-plane old-save
  case.
- Exercise a normal listing, thin market, horizon quote, stale listing, academy lot, academy build
  refusal, instant sale, partial fund withdrawal and old English sale events.
- Verify that localization changes no price, cent delta, market draw, ready week, listing week,
  offer corridor, RNG state or academy lot membership.

The remaining RU-06 sections cover inbox, sponsorship, build and secondary-market letters, then the
cross-surface implementation checklist. Money, staff and the full shop/assets surface are now
drafted end to end; generated observations owned by later batches remain routed rather than copied.
