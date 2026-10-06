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
| ended for too few events | `{brand} kitted her out all season – {worth} of kit – but they asked for {required} events and she played {played}, so they are done.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. По условиям нужно было сыграть {required} {турнир/турнира/турниров}, она сыграла {played}. Контракт не продлили.` |
| ended for ranking | `{brand} kitted her out all season – {worth} of kit – but they back a girl inside the {domestic ladder} top {cut} and she is #{rank}, so they are done.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. Для продления нужно быть в топ-{cut} национального рейтинга, а она сейчас №{rank}. Контракт не продлили.` |
| season of kit, no stated failure | `{brand} kitted her out all season – {worth} of kit, {played} events played.` | `Весь сезон бренд «{brand}» обеспечивал её экипировкой на {worth}. За это время она сыграла {played} {турнир/турнира/турниров}.` |
| signed a kit deal | `She is in {brand}'s kit for next season.` | `В следующем сезоне она будет играть в экипировке бренда «{brand}».` |
| one new offer | `A letter from {brand} – they want to put her in their kit ({ladder} #{rank}). It is in the inbox.` | `Письмо от бренда «{brand}»: предлагают ей экипировку ({полное название рейтинга}: №{rank}). Письмо во входящих.` |
| several new offers | `Letters from {brand list} – they all want to put her in their kit ({ladder} #{rank}). They are in the inbox.` | `Письма от брендов {список брендов}: каждый предлагает ей экипировку ({полное название рейтинга}: №{rank}). Письма во входящих.` |
| apparel-bond notice | `{brand} already have her on their posters and would like her back in their kit – their renewal is in the inbox.` | `Бренд «{brand}» уже размещает её на рекламных плакатах и предлагает снова играть в своей экипировке. Уведомление о продлении — во входящих.` |
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
