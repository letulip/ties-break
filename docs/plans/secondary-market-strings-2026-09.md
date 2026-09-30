---
type: plan
status: current
area: economy
last-reviewed: 2026-09-30
---

# The secondary market – the strings table

Every sentence the secondary-market wave adds for a player to read, laid out for his wording pass: id, where it lives, the
sentence, and its status. The wave's plan ([secondary-market-builder-2026-09.md](secondary-market-builder-2026-09.md)) asks for
this file: nothing he already reads changes, and every new sentence is listed here so that any of them can be rewritten.
`tests/secondary-market-strings-roundtrip.test.ts` holds each row to the sentence in the code, letter for letter, so the table and
the code go red together whichever one is edited – **the table and that test own the count; this prose states none.**

Every row is a draft until he has read it. Sections are added step by step, and a step that ships no new sentence adds none.

## 1. Step S2 – putting a thing on the market, and taking it off

`src/engine/world/shop.ts`: four refusals and two lines in the family's Money feed.

The four refusals are the engine's answers to a request the screens will not normally make – a stale tab, a hand-built
request – so a player should rarely read one. Two more refusals in the same commands reuse sentences that already shipped, so
they are not new copy and are not tabled: «The family does not own that» for something the family does not hold, and «That one
cannot be sold right now» for a contract that is still being delivered.

`${label}` is what the shelf calls the thing. For the academy it is the name the family gave it, and the stage's own name if it
never named it.

| id | home | text | status |
| --- | --- | --- | --- |
| SM1 | `src/engine/world/shop.ts` | That is money, not a thing – it cannot be put on the market | `DRAFT` |
| SM2 | `src/engine/world/shop.ts` | The academy cannot be put on the market while a stage is still being built | `DRAFT` |
| SM3 | `src/engine/world/shop.ts` | That is already on the market | `DRAFT` |
| SM4 | `src/engine/world/shop.ts` | That is not on the market | `DRAFT` |
| SM5 | `src/engine/world/shop.ts` | Put on the market: ${label} | `DRAFT` |
| SM6 | `src/engine/world/shop.ts` | Taken off the market: ${label} | `DRAFT` |

- **SM1** – the savings deposit and the index fund are money, not a thing, so they never go on the market and keep today's
  instant partial sale. Both commands refuse them with this sentence.
- **SM2** – the academy is one lot: listing it means every stage, so it cannot be listed while any stage is still being built.
  The popup will warn before this; the engine enforces it.
- **SM3** and **SM4** – putting a thing on the market twice, and taking off a thing that is not on it.
- **SM5** and **SM6** – the two lines in the Money feed. They carry no amount, because no money moves.

## 2. Step S5 – the screens

The sentences a player reads around the engine's numbers: the popup a thing's Sell opens, the badge on a listed row, the buyer's letter, and the
notice that an ad has gone quiet. They live in the screens' own code, not the engine's, because the screens compose them from numbers the engine
already worked out – so this section's homes are the screens' own files, each a bare path, and the round-trip test names them.

Nothing he already reads changes. These sentences are reused as they shipped and are not tabled: «That one cannot be sold right now» (the academy's
instant sale refuses with it while a stage is still being built), the sale question «Sell … for …? That is …», its «Sell it» button, the letter's
«Sign» and «Refuse», the foot «… to decide. The terms will not change.», the record lines «Filed …», «Turned down.» and «Expired – they needed an
answer.», and the ledger line «Sold: … – …» (which now names the academy by the name the family gave it, and by its stage's own name if it never
named it – the same rule the listing lines above follow).

`${weeks}` and `${weeksLo}`…`${priceHi}` are the engine's figures; `${unit}` is «week» or «weeks»; `${label}` is what the shelf calls the thing (the
academy's given name included); `${price}` is the figure printed on the paper; `${week}` is the letter's deadline, spelled the way every week is.
`${weeks}` in SM22 is the market's memory window from the economy table (12 weeks today), so a retune moves the sentence with it.

| id | home | text | status |
| --- | --- | --- | --- |
| SM7 | `src/composables/shop.ts` | List | `DRAFT` |
| SM8 | `src/composables/shop.ts` | Sell now | `DRAFT` |
| SM9 | `src/composables/shop.ts` | Keep it | `DRAFT` |
| SM10 | `src/composables/shop.ts` | Withdraw | `DRAFT` |
| SM11 | `src/composables/shop.ts` | On the market · ${weeks} ${unit} | `DRAFT` |
| SM12 | `src/composables/shop.ts` | Interest has gone quiet · ${weeks} ${unit} on the market | `DRAFT` |
| SM13 | `src/composables/shop.ts` | It may take ${weeksLo} to ${weeksHi} weeks to sell. | `DRAFT` |
| SM14 | `src/composables/shop.ts` | Offers may range from ${priceLo} to ${priceHi}. | `DRAFT` |
| SM15 | `src/composables/shop.ts` | Selling now pays ${fire}, at once. | `DRAFT` |
| SM16 | `src/composables/shop.ts` | Few buyers can pay this much – it may not sell at all. | `DRAFT` |
| SM17 | `src/composables/shop.ts` | The academy sells as one lot – every stage goes together, not the courts alone. | `DRAFT` |
| SM18 | `src/composables/saleLetter.ts` | A buyer | `DRAFT` |
| SM19 | `src/composables/saleLetter.ts` | The market | `DRAFT` |
| SM20 | `src/components/OfferLetter.vue` | A buyer offers ${price} for ${label}. | `DRAFT` |
| SM21 | `src/components/OfferLetter.vue` | The offer stands until ${week}. Refusing it leaves the listing up. | `DRAFT` |
| SM22 | `src/components/OfferLetter.vue` | Interest in ${label} has gone quiet. You can wait it out, or withdraw it and try again later – but buyers remember an ad for about ${weeks} weeks, so a quick re-list starts where this one left off. | `DRAFT` |
| SM23 | `src/components/OfferLetter.vue` | Sold at that price. | `DRAFT` |
| SM24 | `src/components/InboxSheet.vue` | ${label} – an offer of ${price} | `DRAFT` |
| SM25 | `src/components/InboxSheet.vue` | Interest in ${label} has gone quiet | `DRAFT` |
| SM26 | `src/components/InboxSheet.vue` | Sell ${label} for ${price}? The sale settles this week and cannot be undone. | `DRAFT` |

- **SM7–SM10** – the four controls the market adds: the popup's three doors (List puts the ad up; Sell now goes on to the ordinary sale question;
  Keep it closes the popup and does nothing) and the one tap on a listed row that takes the ad down. Withdrawing asks no question – it is free, and
  the market remembers it for a while.
- **SM11 and SM12** – the badge on a listed row: how long the ad has been up, and – from the week the engine decides the ad has gone stale – the
  same fact in its quiet wording. The flip and the notice below arrive in the same week.
- **SM13–SM15** – the popup's three lines, following his own sketch: how long it may take, what offers may range between, and what selling at once
  pays. All three are the engine's numbers, printed as they come.
- **SM16** – only when the engine calls the market thin for that price (the elite car, not the first house).
- **SM17** – only for the academy, whose stages sell together. His ruling asked for the warning «in so many words».
- **SM18 and SM19** – who signs a buyer's letter, and who signs the notice. They are what the sender IS, like the tour office and the order desk,
  and they are shared by the inbox list and the paper.
- **SM20 and SM21** – the buyer's letter: the offer, then how long it stands and what a refusal does.
- **SM22** – the quiet-ad notice, one paragraph: wait it out or withdraw and try again, and the market's memory of an ad in plain words.
- **SM23** – the record line once a buyer's letter has been signed.
- **SM24 and SM25** – the inbox list's subject lines for those two letters.
- **SM26** – the question asked before a buyer's letter is signed.

## 3. Step S6 – when a sale may never come

`src/composables/shop.ts`: one more line in the popup, for the things whose wait has no upper end the engine can name. `${weeksLo}` is the engine's
own figure, the low end of the wait.

| id | home | text | status |
| --- | --- | --- | --- |
| SM27 | `src/composables/shop.ts` | It may take ${weeksLo} weeks or more to sell – there may be no buyer at all. | `DRAFT` |

- **SM27** – the popup's first line INSTEAD OF SM13, and only when the engine's quote reaches its horizon: ten years of weeks pass and the ninetieth-percentile
  buyer still has not turned up (a yacht, a plane, the whole academy). SM13 is unchanged for every other thing. Without this line the popup would print a range
  such as «12 to 520 weeks», whose upper end is only the number where the engine stopped counting.

