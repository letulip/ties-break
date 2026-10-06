---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11F – Other world news and business receipts

This covers additional generated feed writers found after RU-11A–E: professional champions,
junior cohort turnover, academy review, advertising shoots and family-business receipts.
Source modules are `phaseAiWeek.ts`, `phaseObligations.ts`, `shootClash.ts` and
`phaseFinance.ts` under `src/engine/world/`. Russian copy is `DRAFT`; all ranking, travel,
contract and ledger facts stay with the existing engine.

## 1. Champion and cohort news

| source / case | English source | Russian draft |
| --- | --- | --- |
| champion, age unknown | `🏆 {name} won the {tier}.` | `🏆 Победа на турнире «{tier}»: {name}.` |
| champion, age known | `🏆 {name} won the {tier}, at {age}.` | `🏆 Победа на турнире «{tier}»: {name}, {age} {год/года/лет}.` |
| champion, professional debut season | `🏆 {name} won the {tier}, at {age} – a first season on tour.` | `🏆 Победа на турнире «{tier}»: {name}, {age} {год/года/лет}. Первый сезон в профессиональном туре.` |
| champion, final tour season | `🏆 {name} won the {tier}, at {age} – in a last season on tour.` | `🏆 Победа на турнире «{tier}»: {name}, {age} {год/года/лет}. Последний сезон в профессиональном туре.` |
| junior-cohort turnover | `A new intake: {left} players have left the tour and {joined} thirteen-year-olds have taken their places.` | `Новый набор юниорского тура: ушедшие – {left}; тринадцатилетние новички – {joined}.` |
| notable departure suffix | `{name} (#{rank}) is among those who stopped.` | `Среди завершивших выступления – {name} (№{rank}).` |

Dynamic names stay in nominative slots after colons. The champion's first/last-season note is
derived from the same career chair as the English news; do not infer it from age. The cohort
line uses a compact bulletin construction so `1` does not create broken verb agreement.

## 2. Academy annual review and kit grant

| source / branch | English source | Russian draft |
| --- | --- | --- |
| `ACADEMY_NOTICE.arrived` + cover | `An academy has taken her on – a scholarship covering {pct}% of her travel.` | `Академия взяла её в программу – стипендия покрывает {pct}% дорожных расходов.` |
| ended: age | `The academy has ended her scholarship – she has aged out of their junior programme.` | `Академия прекратила стипендию: она выросла из юниорской программы.` |
| ended: too few events | `The academy has ended her scholarship – she barely competed this year.` | `Академия прекратила стипендию: за год она почти не участвовала в турнирах.` |
| ended: insufficient season | `The academy has ended her scholarship – her year did not make their case.` | `Академия прекратила стипендию: результаты этого года их не убедили.` |
| reviewed: cover rises | `Academy review: her scholarship rises to {pct}% of her travel.` | `Пересмотр стипендии: академия теперь покрывает больше дорожных расходов – {pct}%.` |
| reviewed: cover falls | `Academy review: her scholarship falls to {pct}% of her travel.` | `Пересмотр стипендии: академия теперь покрывает меньше дорожных расходов – {pct}%.` |
| all kit already covered | `No academy kit grant this year – {brand} already kits her out.` | `В этом году гранта академии на экипировку нет: бренд «{brand}» уже обеспечивает её всем необходимым.` |
| kit grant, partial brand cover | `Academy kit grant – {uncovered}; {brand} covers her {covered}.` | `Грант академии на экипировку – расходы на {непокрытый список}; бренд «{brand}» оплачивает {покрытый список}.` |
| kit grant, no brand | `Academy kit grant – rackets, strings and shoes for the season` | `Грант академии на сезон: ракетки, струны и обувь.` |

`ACADEMY_NOTICE` is currently used as an **English text-prefix signal** by
`academySpokeThisWeek`, which controls a stop after the review. The technical localization wave
must not localize the stored prefix in place and silently break that detector; it needs a typed
notice/locale rendering boundary or equivalent behavior-preserving test. Lists of kit items
must use RU-06's terms `ракетки`, `струны`, `обувь`, not machine-translated `frames`.

## 3. Advertising shoot collisions and business income

| source / case | English source | Russian draft |
| --- | --- | --- |
| shoot moved | `{brand} shoot moved to {week} – the {tier} week stands.` | `Съёмку для бренда «{brand}» перенесли на {week}; неделя турнира «{tier}» остаётся в плане.` |
| shoot cancelled | `{brand} shoot cancelled – the campaign takes its share back` | `Съёмку для бренда «{brand}» отменили – соответствующую часть гонорара списали со счёта.` |
| shoot and tournament both held | `{brand} shoot and the {tier} in one week – a heavy week ahead.` | `Съёмка для бренда «{brand}» и турнир «{tier}» в одну неделю. Впереди плотная неделя.` |
| merch, no daughter share | `Merch – her name on the shelves` | `Товары с её именем – на полках магазинов` |
| merch, daughter share | `Merch – her name on the shelves, less her {pct}% share` | `Товары с её именем – доход семьи за вычетом её доли {pct}%` |
| daughter's brand share | `{kidName}'s share of the brand – {amount} into her own account` | `{kidName}: доля дохода от бренда – {amount} на личный счёт` |
| academy business income | `The academy – programmes, lodging and its own sponsors` | `Академия – учебные программы, проживание и собственные спонсоры` |

The cancelled-shoot line is an expense/refund of part of an already paid campaign fee, not a
new fee invented by Russian. The merch row with a daughter's share is the family's **net**
income; her separate info row goes to her account. Neither should be counted twice in a
localized Money view. `kidName` is again a nominative label before a colon, so a saved name
needs no declension.
