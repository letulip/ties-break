---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11E – Sponsor, travel and commission ledger lines

This is the remaining player-facing sentence pass over `src/engine/world/sponsors.ts`. RU-06
already covers offer cards and staff terminology; these lines are money/feed receipts emitted
by the simulation. Russian drafts are `DRAFT`. Every `{amount}` is the same integer-cent value
formatted by the shared money layer; translation must not recompute the charge or the split.

## 1. Offers and sponsor payments

| source | English | Russian draft |
| --- | --- | --- |
| ad contract signed | `{brand} endorsement – the campaign fee, on signing` | `Рекламный контракт с брендом «{brand}» – оплата кампании при подписании` |
| missing offer error | `That letter is not in the inbox.` | `Этого письма нет во входящих.` |
| signed offer error | `That deal is already signed.` | `Этот контракт уже подписан.` |
| unavailable offer error | `That offer has already gone.` | `Этого предложения уже нет.` |
| commission suffix, only if nonzero | `{receipt}, the manager's {rate}% of {gross}` | `{квитанция}; комиссия менеджера – {rate}% от {gross}` |
| daughter's sponsor share | `{kidName}'s share of the sponsor money – {herAmount} into her own account` | `{kidName}: доля спонсорского платежа – {herAmount} на личный счёт` |
| quarterly retainer | `{brand} retainer – quarterly` | `Квартальная выплата от бренда «{brand}»` |
| lifetime ad anniversary | `{brand} endorsement – year {index}, for life` | `Рекламный контракт с брендом «{brand}» – год {index}, пожизненный договор` |
| fixed-term ad anniversary | `{brand} endorsement – year {index} of {total}` | `Рекламный контракт с брендом «{brand}» – год {index} из {total}` |

`{kidName}` is placed before a colon in nominative form, not after a Russian preposition or
possessive requiring name declension. The commission suffix is conditional on a nonzero parent
share; a zero fee must not print a misleading `0%` clause. For old saves, the stored receipt's
typed event identity and amounts must be preferred over parsing this English sentence.

## 2. Travel receipts and payers

The seat labels follow RU-06 exactly: `Тренер`, `Массажист`, `Спарринг-партнёр`. The general
travel cost and each extra staff fare remain separate ledger rows. `payer` appears only when a
contract or academy actually covered part of the fare.

| source / case | English | Russian draft |
| --- | --- | --- |
| coach extra fare | `Coach travel to {tier} – one additional fare{payer}` | `Поездка тренера на турнир «{tier}» – ещё один билет{плательщик}` |
| masseur extra fare | `Masseur travel to {tier} – one additional fare{payer}` | `Поездка массажиста на турнир «{tier}» – ещё один билет{плательщик}` |
| hitting-partner extra fare | `Hitting partner travel to {tier} – one additional fare{payer}` | `Поездка спарринг-партнёра на турнир «{tier}» – ещё один билет{плательщик}` |
| staff fare, brand partly pays | ` ({brand} covers {share}%)` | ` (бренд «{brand}» покрывает {share}%)` |
| base travel, no support | `Travel to {tier}` | `Поездка на турнир «{tier}»` |
| base travel, academy only | `Travel to {tier} – academy covers {academyShare}%` | `Поездка на турнир «{tier}» – академия покрывает {academyShare}%` |
| base travel, brand only | `Travel to {tier} – {brand} covers {brandShare}%` | `Поездка на турнир «{tier}» – бренд «{brand}» покрывает {brandShare}%` |
| base travel, academy + brand | `Travel to {tier} – academy {academyShare}% + {brand} {brandShare}%` | `Поездка на турнир «{tier}» – академия покрывает {academyShare}%, бренд «{brand}» – {brandShare}%` |

`{tier}` is a localized tournament name kept inside quotes; no generic English tier label
should leak into the receipt. The one-additional-fare text is not a second copy of the base
travel charge. Percentages come from the exact contract share and academy rule already used
by the engine; they are not reverse-calculated from rounded cents.

### ⚙ 10.10 добавка (№40, усмотрение архитектора): коллизия съёмки и турнира (ShootClashDialog) – русская колонка твоя (DRAFT); общие ключи (Close, Continue, #{rank}, Unranked) живут в своих таблицах

| id | English | Russian |
| --- | --- | --- |
| SPL-SC01 | `Cancel the shoot` | |
| SPL-SC02 | `Do both` | |
| SPL-SC03 | `Lights, flights and a draw in one week – {0} condition off the week.` | |
| SPL-SC04 | `Move the shoot to {0}` | |
| SPL-SC05 | `Pull out of the {0}` | |
| SPL-SC06 | `She plays as planned and the campaign waits – nothing is paid for it.` | |
| SPL-SC07 | `She plays as planned, and {0} take back {1} of the campaign fee.` | |
| SPL-SC08 | `She shoots, and the {0} entry comes back, and a late withdrawal counts against her.` | |
| SPL-SC09 | `She shoots, and the {0} entry comes back.` | |
| SPL-SC10 | `She shoots, and the {0} entry is forfeited, and a late withdrawal counts against her.` | |
| SPL-SC11 | `She shoots, and the {0} entry is forfeited.` | |
| SPL-SC12 | `Something has to give. All four answers are hers to make.` | |
| SPL-SC13 | `Two things at once – {0}` | |
| SPL-SC14 | `{0} want her that week, and so does the {1}.` | |
