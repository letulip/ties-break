---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11K – Remaining short world receipts

Short `addEvent` writers audited after the larger RU-11 modules. Sources are named per row.
Russian lines remain `DRAFT`; this is not a runtime change.

| Source / case | English source | Russian draft |
| --- | --- | --- |
| `create.ts`, first kept row | `{kidName}'s career started (seed "{seed}"). Family budget: {funds}.` | `{kidName}: карьера началась. Стартовый бюджет семьи – {funds}. Код карьеры: {seed}.` |
| `bookkeeping.ts`, season calendar expands | `New events on the calendar` | `В календаре появились новые турниры` |
| `age.ts`, birthday age row | `She is {ageWords} this week.` | `На этой неделе ей исполнилось {age, plural, one {{age} год} few {{age} года} many {{age} лет} other {{age} лет}}.` – ⚙ 11.10 русский склоняет по числу {age}, ключ отдаёт возраст словом ({ageWords}): нужен числовой аргумент `QUESTION` |
| `tick.ts`, no-show travel unwind | `Travel refunded: {tier}` | `Возврат дорожных расходов: турнир «{tier}»` |
| `tick.ts`, no-show entry | `Skipped {tier} – entry fee forfeited.` | `Турнир «{tier}» пропущен – заявочный взнос не возвращается.` |
| `kit.ts`, paid kit purchase | `Bought: {gradeLabel}` | `Куплено: {gradeLabel}` |
| `kit.ts`, brand-covered kit purchase | `Bought: {gradeLabel} – on {brand}` | `Куплено: {gradeLabel}; за счёт бренда «{brand}»` |

The birthday formatter uses the exact `turning` value already calculated by `birthdayTurning`;
Russian cardinal and `год/года/лет` are one shared locale rule. Do not copy English `ageInWords`
into a rendered Russian row. RU-09 owns the more personal birthday copy. The seed is a literal
technical identifier, not English prose; preserving it lets the player share/reproduce a career.
The refund row's amount remains the amount **actually paid**, not the full list fare; academy
coverage is unwound in the existing ledger. The no-show row is separate from medical withdrawal
and walkover (RU-11J). Kit labels are localized from stable equipment grade and line identifiers;
the brand name is a proper name and may remain unchanged.

The remaining `shop.ts` feed, sale tails and market reports are already mapped in RU-06 §26–27.
The birthday gift event is already mapped in RU-09. `mandatory.ts` penalties and suspension are
in RU-11G. `knock.ts` choices/history are in RU-05 §19.7. This file records those audits to avoid
creating contradictory second translations.

## ⚙ 11.10 agent-authored (бланкет) – the birthday age row, as its live key

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

`age.ts` writes `She is {0} this week.` with `{0}` the age **in English words** (`seventeen`, from `ageInWords`), not a number – which is why the row above parked its Russian as `QUESTION`: it inflects `год/года/лет` over a number the key does not carry. The row below is the live key, built so that nothing is inflected: Russian says an age without a noun (`ей семнадцать`), so the hole stands alone at the end. Until the code hands in a Russian number word or a numeric argument, a Russian row prints `На этой неделе ей seventeen.` `DRAFT`, his live edit follows.

### The key

| id | English | Russian |
| --- | --- | --- |
| RU21-WRC-01 | `She is {0} this week.` | `На этой неделе ей {0}.` |
