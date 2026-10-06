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
| `create.ts`, first kept row | `{kidName}'s career started (seed "{seed}"). Family budget: {funds}.` | `{kidName}: карьера началась. Стартовый бюджет семьи — {funds}. Код карьеры: {seed}.` |
| `bookkeeping.ts`, season calendar expands | `New events on the calendar` | `В календаре появились новые турниры` |
| `age.ts`, birthday age row | `She is {ageWords} this week.` | `На этой неделе ей исполнилось {age} {год/года/лет}.` |
| `tick.ts`, no-show travel unwind | `Travel refunded: {tier}` | `Возврат дорожных расходов: турнир «{tier}»` |
| `tick.ts`, no-show entry | `Skipped {tier} – entry fee forfeited.` | `Турнир «{tier}» пропущен — заявочный взнос не возвращается.` |
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
