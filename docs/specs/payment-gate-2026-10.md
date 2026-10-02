---
type: spec
status: draft
area: delivery
last-reviewed: 2026-10-01
---

# The payment gate – one purchase, four doors

Status: DRAFT spec (M0), 01.10.2026. Owner rulings pending – §8.
Commissioned 01.10: «ворота для оплаты… бесплатный сегмент для пролога и первого года юниорской
карьеры с последующим призывом к оплате полной версии (это для мобильных приложений и веба), а для
Стима, видимо, нужно будет сразу оплату делать… для меня… темный лес в полном смысле слова».

## 1 · The model, in one paragraph

One product, one price, bought once: **Ties Break – Full Game**, a non-consumable unlock. The free
segment is the childhood prologue plus the first junior season, playable in full on web, Android
and iOS; at the wall the career pauses – it never resets – and continues the moment the unlock
arrives. Steam is bought up front, so the Steam build starts entitled and never shows a wall.
No subscriptions, no consumables, no second SKU.

## 2 · The stance that shrinks the forest

This game is **source-available**: anyone can build the full game from the repository today. A
payment gate here is a tollbooth for the convenient builds, not a fortress – the fortress is
already open on one side by design, and that is a known, viable model (Aseprite sells compiled
builds of a public source tree). Three consequences, each of which deletes a swamp:

- **Client-side entitlement is enough.** No server validates receipts; the stores' own signed
  answers and an offline-verifiable key are trusted on the device. A determined pirate was never
  the customer.
- **No backend, v1.** No accounts, no license server, no database. The one possible exception is a
  ~40-line stateless webhook relay if the chosen web merchant cannot deliver keys on its own
  (§4, web) – optional, free-tier, holds no state.
- **No monetisation SaaS.** No RevenueCat-class dependency: each door is a thin adapter over the
  platform's own API, in our code, in the house style.

## 3 · The wall

**Where it stands.** `FREE_HORIZON`, one shared constant: the career week on which the first
junior season closes (recommendation – the week after the first season-review screen, so the free
segment ends on the season's natural narrative peak with the next calendar visible but locked;
the alternative is a flat 52 weeks). M1 measures the exact week on a seeded career and pins it;
the owner rules on the boundary feel (§8.1).

**How it refuses.** The same guard family as the dev fast-forward button: `advanceWeeks` refuses
to cross the horizon when the run is not entitled, and the worker's `tick` handler enforces the
identical predicate at entry and mid-loop. Entitlement reaches the engine as a command argument,
not as state – nothing about the wall is written into a save, so there is **no schema change**.
A save made in the demo is simply a save; purchase on the same device continues the same career.

**What it must not do.** No RNG draws anywhere in the gate. The gate's pin is a twin run – same
seed, entitled vs not – byte-identical through the wall week: the demo truncates the world, it
never diverges from it.

**What the player sees.** A wall screen, not a dead end: the career so far, what the full game
opens, the purchase button for the active door, and a restore path («уже куплено» / key entry).
Every string is a DRAFT row for the owner's editorial stack (late batch, per his order). The
screen gets the mounted 375x667 pin with a mutation arm – the TourBriefingDialog law, applied
before it exists rather than after it traps someone.

**The playtest stays open.** The deployed GitHub Pages build is the owner's playtest device today.
The wall ships **dark**: a build-time default keeps every current build entitled until the owner
says «включаем», and the launch flip is one config commit he can read. Nothing about merging M1
changes what testers experience.

## 4 · The four doors

All doors implement one interface in `src/monetize/`: `{ kind, isEntitled(), purchase(),
restore() }`, chosen by context detection at boot; the resulting entitlement record
`{ source, token, when }` persists app-level (next to the locale setting, never in a career save)
and is re-announced to the worker on every boot.

| door | mechanism | restore | can be verified without owner accounts? |
| --- | --- | --- | --- |
| Steam | build flag in the Electron shell (`shells/win` already carries the Steam flag): Steam build ⇒ entitled, no UI, no Steamworks DRM in v1 | n/a | yes – it is a constant |
| Web | a signed license key (Ed25519, ~tiny audited dependency): payload = product + issue date, public key in the app, verification offline. Keys minted by `tools/license-sign.ts`; the private key lives in `~/.tiesbreak/` beside the Android keystore and joins `npm run shell:backup`. The merchant of record sells the game and delivers the key (their built-in license delivery, or the 40-line relay if theirs cannot carry ours) | re-enter the key | yes – test keypair end to end |
| Android (Play) | the Digital Goods API inside the TWA (`getDigitalGoodsService('https://play.google.com/billing')` + Payment Request): purchase, acknowledge, `listPurchases()` for restore. Play policy requires Play Billing for digital goods in Play-distributed apps, and forbids steering to external purchase from inside them – so in the Play context the web door never shows. A sideloaded apk (his Moto playtest) has no DGA and falls back to the web door lawfully – it is not Play-distributed | `listPurchases()` | code + mocked DGA yes; a real purchase loop needs his Play Console and an internal-testing track |
| iOS | StoreKit 2 in the Capacitor shell (~100 lines of Swift: product, purchase, `Transaction.currentEntitlements` – OS-verified locally), exposed through the existing `__TIES_SHELL_BRIDGE__` pattern | `currentEntitlements` | yes – Xcode StoreKit testing runs the whole purchase flow in the simulator with a local `.storekit` config, no paid account needed |

Dev door: an explicit developer override for local work, plus the dark-launch default from §3.

## 5 · What stays the owner's hands – the dark-forest map

The code can be built and largely verified first; real commerce needs his accounts. Agents never
create store accounts, never accept agreements or licences, never enter real payment or banking
data – the S1/S3 precedent holds. Test modes and published test cards only, and only in our own
app. His checklist, in the order it blocks:

| door | account | cost | paperwork before first sale |
| --- | --- | --- | --- |
| Web | merchant of record (Paddle / Lemon Squeezy / Gumroad / itch.io as candidates) | ~5–10% of each sale | merchant onboarding; **where payouts can land is the deciding question** – country, entity, bank determine which merchants are open at all (§8.3) |
| Play | Google Play Console | $25 once | merchant profile + tax forms; the appId `com.tiesbreak.aceparent` must be blessed or replaced before first upload (standing); enroll Play App Signing at first upload (standing) |
| iOS | Apple Developer Program | $99/year | Paid Apps agreement + banking/tax in App Store Connect; `APPLE_TEAM_ID` also unlocks the `--archive` build (standing) |
| Steam | Steamworks | $100 per app (recoupable at $1k) | partner onboarding, tax interview, store page review |

Store cuts at our scale: Play 15% (first $1M/yr), Apple 15% (Small Business Program), Steam 30%,
merchant of record ~5% + cents. Refunds and VAT are the stores'/merchant's problem – that is what
the cut buys. Offline web keys are not revocable in v1; the risk is accepted with the stance of §2.

## 6 · Waves and dispatch (token-discipline law; budgets are stop conditions)

| wave | scope | model | budget | gate |
| --- | --- | --- | --- | --- |
| M1 | the wall: shared constant measured + pinned, engine/worker refusals, entitlement store + dev door + dark-launch default, wall screen (DRAFT copy), twin gate, 375x667 pin, mutation arms | sonnet | ~45 moves | twin byte-identity + component |
| M2 | web door: keypair tool (owner mints the production pair), offline verify, key-entry UI, `shell:backup` extension, docs | sonnet | ~35 moves | end-to-end with a test keypair |
| M3 | Play door: context detect, DGA purchase/ack/restore, policy edges, mocked-DGA tests | sonnet | ~30 moves | mocked loop green; real loop parked on §5 |
| M4 | iOS door: StoreKit 2 Swift + bridge extension, `.storekit` config, simulator purchase test | sonnet | ~35 moves | simulator StoreKit loop green |
| M5 | Steam door: flag ⇒ entitled in the shell | sonnet | ~10 moves | shell smoke |

Sequential, one agent one task, gates in the architect's session, one branch per wave. M1 needs
only ruling §8.1 to start; M3's real-money verification waits on accounts without blocking its
code; the launch flip (§3) is a separate owner-read commit at the end.

## 7 · What can go wrong, named now

- **Store policy drift.** Apple's and Google's external-purchase rules are in legal motion;
  v1 deliberately uses only each store's own billing, which is the configuration no ruling has
  ever threatened.
- **Context misdetection.** A Play-installed build must never show the web door (policy), a
  sideloaded build must never pretend to be Play. Detection = DGA availability + the
  `android-app://` referrer, and M3 carries tests for all four combinations.
- **The wall lands mid-career for existing players.** Players of the open playtest have careers
  past the horizon. Ruling §8.4 decides their fate at flip time; the default in this spec is that
  the wall only ever blocks *advancing past* the horizon – a career already beyond it stays
  playable on its device until its owner meets the wall naturally… which it never does. Honest
  options: grandfather them (recommended – they are the playtesters) or gate them too.
- **Key sharing.** A web key works wherever it is pasted. Accepted (§2); the key encodes its issue
  date so a later v2 could rotate the product id without punishing v1 buyers.

## 8 · Owner rulings needed before M1

1. Граница фри-сегмента: конец первого юниорского сезона, сразу после сезонного ревью
   (рекомендация – стена на пике, календарь следующего сезона виден, но заперт), или ровно
   52 недели?
2. Цена и имя SKU (одно на все площадки; региональные цены стораы считают сами; веб-цену задаёт
   мерчант).
3. Самый тяжёлый и только ваш: **куда принимать деньги** – страна/юрлицо/банк. От ответа зависит,
   какие мерчанты и сторы вообще открыты, и в каком порядке двери имеют смысл. Без этого M2–M4
   пишутся и проверяются на тест-режимах, но не продают.
4. Судьба карьер действующих плейтестеров при включении стены: grandfather (рекомендация) или
   стена для всех?
5. Подтверждение стойки §2: без бэкенда, без SaaS, клиентская проверка; и момент включения стены –
   отдельным вашим «включаем».

## 9 · What this spec does not do

No subscriptions, no consumables, no ads, no analytics, no accounts, no cloud saves (file export
remains the save's passport), no DRM beyond each platform's own purchase answer, no price
experiments. The demo is the full engine behind a week-gate, never a separate build – one binary
per platform, entitled or not.
