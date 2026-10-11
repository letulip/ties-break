---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11D – Sponsor and kit news in the feed

`src/engine/world/sponsors.ts` writes one winter recap from kit-contract endings, new letters,
an apparel-bond notice and a renewal. RU-06 covers the offer UI and inbox; this document covers
the separate feed prose that would otherwise stay English. All lines are `DRAFT`. The brand,
money, national/ITF ranking and event counts come from the same saved terms as the English
line, with no new value inferred in translation.

## 1. Winter kit recap clauses

| branch | English source | Russian draft |
| --- | --- | --- |
| ended for too few events | `{brand} kitted her out all season – {worth} of kit – but they asked for {required} events and she played {played}, so they are done.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. По условиям нужно было сыграть {required, plural, one {{required} турнир} few {{required} турнира} many {{required} турниров} other {{required} турниров}}, она сыграла {played}. Контракт не продлили.` |
| ended for ranking | `{brand} kitted her out all season – {worth} of kit – but they back a girl inside the National top {cut} and she is #{rank}, so they are done.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. Для продления нужно быть в топ-{cut} национального рейтинга, а она сейчас №{rank}. Контракт не продлили.` |
| season of kit, no stated failure | `{brand} kitted her out all season – {worth} of kit, {played} events played.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. За это время она сыграла {played, plural, one {{played} турнир} few {{played} турнира} many {{played} турниров} other {{played} турниров}}.` |
| signed a kit deal | `She is in {brand}'s kit for next season.` | `В следующем сезоне она будет играть в экипировке бренда «{brand}».` |
| one new offer | `A letter from {brand} – they want to put her in their kit ({ladder} #{rank}). It is in the inbox.` | `Письмо от бренда «{brand}»: предлагают ей экипировку ({полное название рейтинга}: №{rank}). Письмо во входящих.` – ⚙ 11.10 ключи письма различаются названием рейтинга внутри (National / International): русскому нужен свой ряд на каждый `QUESTION` |
| several new offers | `Letters from {brand list} – they all want to put her in their kit ({ladder} #{rank}). They are in the inbox.` | `Письма от брендов {список брендов}: каждый предлагает ей экипировку ({полное название рейтинга}: №{rank}). Письма во входящих.` – ⚙ 11.10 ключи письма различаются названием рейтинга внутри (National / International): русскому нужен свой ряд на каждый `QUESTION` |
| apparel-bond notice | `{brand} already have her on their posters and would like her back in their kit – their renewal is in the inbox.` | `Бренд «{brand}» уже размещает её на рекламных плакатах и предлагает снова играть в своей экипировке. Уведомление о продлении – во входящих.` |
| incumbent renewal | `{brand} would like another season on the same terms – their letter is in the inbox, and it goes when the season opens.` | `Бренд «{brand}» предлагает ещё один сезон на прежних условиях. Письмо во входящих; с началом сезона оно исчезнет.` |

The first two endings say **why** the deal stopped; the neutral third line does not invent a
reason. `{worth}` is the value of kit already supplied, not a cash payment. For dynamic brand
names use `бренд «{brand}»` or a quoted nominative, not an English-style possessive suffix and
not an invented Russian declension. The list of multiple brands needs a locale list formatter,
including the final `и`.

`{required}` and `{played}` need Russian forms (`1 турнир`, `2 турнира`, `5 турниров`). The
ranking phrase uses RU-07's full localized ladder label rather than lowercasing the English
`LADDER_LABEL`. Do not say the signed offer is still waiting in the inbox: the source selects
the signed branch first. The incumbent renewal's expiry is this opening week, so its urgency is
fact, not marketing colour.

## ⚙ 11.10 agent-authored (бланкет) – the new kit letters, as four whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

§1 above parked the two «new offer» rows as `QUESTION` because the code spells the table's name into the key (`International #{rank}` / `National #{rank}`), which a single `{ladder}` slot cannot carry. The four keys are the live sentences – one letter or several, for the International or the National table – and the rows say the table in Russian (RU-07's `международный рейтинг` / `национальный рейтинг`, lower-cased inside the bracket). The brand is `бренд «{0}»`; the several-brands list is the engine's comma-joined string plus the last name (`{0} и {1}`), so it takes no case. `DRAFT`, his live edit follows.

### The four letters

| id | English | Russian |
| --- | --- | --- |
| RU21-SPF-01 | `A letter from {0} – they want to put her in their kit (International #{1}). It is in the inbox.` | `Письмо от бренда «{0}»: предлагают ей экипировку (международный рейтинг: №{1}). Письмо во входящих.` |
| RU21-SPF-02 | `A letter from {0} – they want to put her in their kit (National #{1}). It is in the inbox.` | `Письмо от бренда «{0}»: предлагают ей экипировку (национальный рейтинг: №{1}). Письмо во входящих.` |
| RU21-SPF-03 | `Letters from {0} and {1} – they all want to put her in their kit (International #{2}). They are in the inbox.` | `Письма от брендов {0} и {1}: каждый предлагает ей экипировку (международный рейтинг: №{2}). Письма во входящих.` |
| RU21-SPF-04 | `Letters from {0} and {1} – they all want to put her in their kit (National #{2}). They are in the inbox.` | `Письма от брендов {0} и {1}: каждый предлагает ей экипировку (национальный рейтинг: №{2}). Письма во входящих.` |
