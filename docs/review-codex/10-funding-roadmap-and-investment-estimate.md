# Funding Roadmap and Investment Estimate

Review date: 2026-08-01  
Currency: USD unless explicitly stated  
Scope: Ties Break from the current polished PoC/MVP to a commercially supported end-user release

## Executive recommendation

Ties Break should be financed as a **premium, PC-first independent game**, not as a venture-scale live-service startup. Its strongest capital story is:

1. use a **$150,000–$300,000 bridge** to turn the current broad MVP into an investor-ready, end-to-end vertical slice;
2. raise **$1.2M–$1.9M of project/publisher finance** after that slice demonstrates career integrity, safe pacing, daughter agency, a real ending, and market demand;
3. target an **all-in commercial budget of roughly $1.4M–$2.2M**, with a bottom-up base case of **$1.77M**;
4. launch a complete premium PC product first, budgeted around a $24.99 list price, then fund mobile and console expansion from revenue or separately negotiated platform/publisher money;
5. retain the IP, keep sequel/platform rights separable, and avoid selling studio equity merely to finish one title.

The lower-risk **staffed commercial** alternative is a deliberately narrower $450,000–$850,000 self-published version. The higher-ambition publisher version is approximately $3.2M–$5.8M. A $7M–$13M venture-backed studio strategy only makes sense if the investment proposition becomes a repeatable studio/franchise rather than one premium game.

For a cash-constrained solo developer, a separate chapter below models paths from $3,000 validation work to $200,000 specialist-supported production. Its specific recommendation for the existing Ties Break codebase is **$50,000–$100,000 cash**, one complete junior/family chapter, PWA demo plus Android premium launch, and iOS only after evidence. That plan has a much higher economic cost once unpaid founder labor is counted, but it is a legitimate way to reach users without raising a publisher-sized round.

These are planning estimates, not quotes. They exclude founder money already spent, income taxes, financing costs, and unknown licensed-tennis rights. Every range must be replaced with actual local employment, contractor, porting, legal, localization, and marketing quotes before signing finance.

## The current funding environment

Capital exists, but investors are more selective than during the 2020–2022 funding cycle. GDC's 2025 survey of more than 3,000 industry professionals reported shrinking investment opportunities; 56% of respondents had used their own money, compared with 28% using project or publishing deals. Co-development had the highest “very successful” response at 37% ([GDC State of the Game Industry](https://gdconf.com/article/gdc-2025-state-of-the-game-industry-devs-weigh-in-on-layoffs-ai-and-more/)). Konvoy reported only $193M of gaming VC funding in Q2 2025, down 47% quarter over quarter and 62% year over year ([Konvoy Q2 2025 report](https://www.konvoy.vc/reports/gaming-industry-report-q2-2025)).

The practical implications are:

- a good idea and attractive build are necessary but insufficient;
- investors want proof that the team can finish, the audience can be reached, and the budget can recoup;
- project finance and publishing are a more natural fit for a single premium title than equity VC;
- a polished vertical slice, disciplined scope, market evidence, and credible team plan carry more weight than a large total addressable market slide;
- multiple funding sources are normal, but their rights and recoup waterfalls must not conflict.

New project-finance vehicles continue to appear. For example, Griffin Gaming Partners announced a $100M Special Opportunities Fund in 2026 that finances individual indie games for a share of game revenue rather than company equity ([fund announcement](https://www.businesswire.com/news/home/20260506817311/en/Griffin-Gaming-Partners-Launches-New-%24100-Million-Fund-to-Champion-World-class-Indie-Games)). This does not mean Ties Break will qualify; it confirms that project-level capital remains an active structure even while ordinary gaming VC is constrained.

## How capital will perceive Ties Break

### Assets already present

- A working, visually coherent product rather than a pitch-only concept.
- A differentiated parent perspective and unusually specific tennis/economic thesis.
- Deterministic simulation, strong test volume, local-first privacy, and minimal runtime dependencies.
- A watchable match surface with mobile-friendly presentation.
- Substantial source, content, design documentation, and reusable art.
- A premium-friendly product with no server fleet, multiplayer concurrency, or content moderation burden.

### Investment objections to answer

- There is no complete career ending, so the advertised product is not yet finishable.
- One-week pacing makes the full career-length promise commercially risky.
- The daughter-agency thesis is stronger in copy than in mechanics.
- Save concurrency and persistence failures can destroy trust in a long-running career.
- The current Vue/PWA stack needs a proven desktop distribution and update path.
- The audience, willingness to pay, and acquisition channels are not yet evidenced in the repository.
- The fixed heroine and niche sport create strong identity but narrow the immediately addressable audience.
- Console support is not a routine compile target from the current web stack.
- A one-title studio is a poor fit for most equity VC return models.

An investor-ready build does not need the whole game, but it must remove these uncertainties in miniature.

## Recommended commercial product definition

The financial model assumes:

- premium single-player sports-management/narrative simulation;
- PC-first launch through a packaged desktop build, with Steam as the primary discovery/store channel and itch.io available for controlled playtests/direct community sales;
- $24.99 target PC list price, with final pricing validated through comparable-title research and player testing;
- no advertisements, loot boxes, gacha, or mandatory subscription;
- complete playable career or an explicitly marketed complete junior chapter;
- English at launch plus professionally scoped high-value localization based on wishlists/demo geography;
- accessibility, offline play, save migration, and 6–12 months of funded post-launch support;
- premium mobile adaptation only after control, screen, retention, and price tests;
- consoles only after a technical feasibility spike and separate budget/partner decision.

This positioning is aligned with the product's ethics and architecture. A free-to-play mobile conversion would require a different game: recurring content, analytics, acquisition experiments, live operations, monetization design, remote services, and a much larger marketing budget. It should not be presented as a cheap additional channel.

## Cost basis and estimating method

The estimates use team-months, external production, launch costs, post-launch runway, and contingency. They do not assume that the current codebase is worthless; the existing MVP removes much prototype and visual-discovery cost. They also do not treat accumulated code as finished commercial value: completing the career, correcting persistence, adding platform delivery, and validating the market still require substantial work.

### Loaded monthly planning bands

| Delivery base | Loaded cost per full-time-equivalent month | Intended use |
|---|---:|---|
| Southeast Asia-centered remote team | $4,500–$7,500 | Lean local core with selective international specialists |
| International hybrid indie team | $7,000–$12,000 | Recommended planning band |
| North America/Western Europe-heavy team | $12,000–$19,000 | Senior employees/contractors in high-cost markets |

“Loaded” includes cash compensation, employer costs or contractor premium, ordinary equipment/tools, paid leave, and a share of administration. It is not take-home salary. As a high-cost reference, the U.S. Bureau of Labor Statistics reported a May 2025 mean wage of $148,100 for software developers and $117,490 for web/digital interface designers ([BLS occupational wage table](https://www.bls.gov/news.release/ocwage.t01.htm)). Private-industry benefits were 29.7% of total employer compensation in March 2025 ([BLS employer compensation](https://www.bls.gov/news.release/archives/ecec_06132025.pdf)). The lower planning bands are internal assumptions for a geographically distributed team and must be tested against actual hiring locations.

### Scope scenarios

| Cost category | Narrow self-published | Recommended commercial | Expanded publisher-backed |
|---|---:|---:|---:|
| Product hardening and investable slice | $40k–$80k | $120k–$220k | $200k–$350k |
| Core production payroll | $200k–$320k | $500k–$800k | $1.0M–$1.6M |
| Art, narrative, animation, and audio specialists | $30k–$70k | $120k–$220k | $300k–$600k |
| QA, accessibility, localization, certification/ports | $20k–$45k | $70k–$130k | $200k–$450k |
| Legal, accounting, tools, hardware, administration | $15k–$30k | $40k–$70k | $80k–$140k |
| Community, PR, festivals, creators, and paid marketing | $50k–$120k | $180k–$350k | $600k–$1.2M |
| Funded post-launch support | $30k–$60k | $100k–$180k | $250k–$450k |
| Contingency | 15–20% | 15–20% | 20% |
| **Estimated all-in total** | **$450k–$850k** | **$1.4M–$2.2M** | **$3.2M–$5.8M** |

Ranges overlap because team geography, founder salary, content volume, platform count, and marketing confidence matter more than nominal quality labels.

## Bottom-up recommended budget: $1.77M

This is the reference plan, not a promise that $1.77M is sufficient under every scope decision.

### Core team: $720,000

| Role allocation | Approximate active months | Budget |
|---|---:|---:|
| Founder/game director/technical lead | 21 | $144k |
| Two engine/front-end engineers | 19 average each | $300k |
| UI/technical artist | 16 | $108k |
| Systems/economy designer | 14 | $90k |
| Producer/QA/community hybrid | 14 | $78k |
| **Core team total** |  | **$720k** |

The role plan assumes people enter and leave by phase rather than a fixed six-person payroll for the whole project. The founder role may be split if technical leadership and creative direction cannot sustainably coexist.

### External production and launch: $840,000

| Item | Budget | What it buys |
|---|---:|---|
| Narrative design, editing, and sensitivity review | $45k | Agency spine, decision arcs, endings, ethical review |
| Additional art, animation, audio, and trailer production | $90k | Content completion and market-facing polish |
| External QA, accessibility, and localization | $85k | Device/browser matrix, screen-reader work, priority languages |
| Desktop packaging, performance, and distribution specialist | $40k | Installer/update/save paths and store readiness |
| Legal, accounting, tools, hardware, and administration | $70k | Chain of title, contracts, entity, finance operations |
| Positioning, key art, store assets, and trailer | $40k | Commercial identity and conversion assets |
| Community, PR, and regular campaign content | $100k | Community operator, PR support, production calendar |
| Festivals, creator outreach, and paid creative tests | $120k | Demo beats, events, creator seeding, message tests |
| Launch paid media reserve | $100k | Scaled only after evidence of conversion |
| Six to twelve months of post-launch support | $150k | Patches, community, compatibility, sales beats |
| **External/launch subtotal** | **$840k** |  |

### Contingency: $210,000

Twenty percent of core production, external production, and operating costs is reserved for schedule movement, specialist replacement, platform issues, localization growth, and commercial rework. It is not a stretch-goal fund.

**Reference total: $720k + $840k + $210k = $1.77M.**

## Alternative development scopes

### Option 1 — Founder-led, narrow PC release: $450k–$850k

**Team and product**

- founder plus one senior engineer, part-time designer/producer, and specialist contractors;
- PC only;
- one complete, deliberately narrower career arc;
- reuse current visual direction and avoid large animation/content expansion;
- limited professional localization;
- focused accessibility and QA matrix;
- organic/community-led marketing with small paid tests.

**Upside**

- lowest dilution and recoup exposure;
- strongest creative control;
- a moderate success can fund continued development;
- easiest product to stop or reshape when evidence is weak.

**Downside**

- founder concentration and burnout risk;
- slower correction of the architectural and content backlog;
- weak launch reach unless community traction becomes exceptional;
- limited ability to support simultaneous platform or language launches.

**Use when**

The founder can contribute significant time/capital, the scope is honestly reduced, and market validation is promising but insufficient for a large advance.

### Option 2 — Recommended premium indie: $1.4M–$2.2M

**Team and product**

- four to six active contributors at peak;
- complete, paced PC career;
- durable saves, daughter agency, narrative arcs, accessibility, localization, and professional QA;
- disciplined 18–24 month production plus funded post-launch support;
- meaningful but test-gated marketing.

**Upside**

- best match between the current MVP and a credible commercial product;
- enough specialization to reduce founder dependency;
- sufficient marketing to create a launch rather than merely upload a build;
- budget can fit project-finance and many publisher mandates.

**Downside**

- requires roughly 120,000–190,000 full-price-equivalent PC sales to recover under conservative unit economics;
- publisher/project finance may delay developer royalties until recoup;
- scope discipline remains essential despite the larger budget.

**Use when**

The investor slice proves that players understand the premise, complete the demo, want the full career, and can be reached through PC premium channels.

### Option 3 — Expanded publisher-backed launch: $3.2M–$5.8M

**Team and product**

- six to ten contributors plus porting/localization/QA partners;
- broader content, deeper narrative coverage, professional voice or expanded audio, more languages;
- PC plus mobile or one console family, subject to technology feasibility;
- larger creator, PR, event, and paid marketing program;
- stronger platform certification and live-support capacity.

**Upside**

- materially greater audience reach and launch presence;
- less reliance on the founder for every discipline;
- opportunity to establish Ties Break as a durable franchise.

**Downside**

- much higher recoup hurdle and contractual complexity;
- a console migration can consume money without proving demand;
- larger team increases production management and creative-coordination risk;
- pressure to broaden or monetize the product can weaken its identity.

**Use when**

The PC demo already shows exceptional demand, a publisher funds platform expansion separately, or an official sports/strategic partnership materially changes expected reach.

### Option 4 — Venture-backed studio/franchise: $7M–$13M

**What would have to change**

The equity story must become a company-scale thesis: multiple management games, reusable simulation/presentation technology, sequels, licensed sports, user-created scenarios, or a repeatable publishing capability. “Fund this one premium game” is not a venture-return proposition.

**Upside**

- multi-title runway and the ability to build permanent studio functions;
- capital for business development, licensing, platform relationships, and simultaneous products;
- equity capital is not normally recouped from one game's first receipts.

**Downside**

- permanent dilution and investor governance;
- expectations of outsized growth, future rounds, and eventual liquidity;
- risk that company strategy pulls attention away from finishing the best first title;
- currently poor fit with a constrained gaming VC market.

**Recommendation**

Do not pursue this path until the team can show a second-title thesis, experienced leadership bench, and evidence that the studio—not merely this build—has compounding value.

## Solo and cash-constrained mobile-first path

The budgets above describe staffed commercial production. They are not the minimum price of releasing a worthwhile game, and they should not be read as “raise $1.4M or stop.” A solo developer can ship for much less by exchanging money for personal time, accepting a longer schedule, reusing the current assets, selecting one platform, and making the product boundary radically smaller.

The central rule is:

> A shortage of cash must reduce scope and simultaneous platforms—not save integrity, completion, accessibility basics, or the founder's ability to survive.

For Ties Break specifically, the current MVP is already broader than a typical solo mobile project. The solo path is therefore not “finish every reviewed proposal cheaply.” It is “freeze most systems, correct the trust-breaking defects, and sell one complete authored chapter.”

### Cash budget versus economic budget

Solo projects have two valid but different costs:

- **Cash budget:** money that must actually leave the bank—living runway, contractors, devices, store fees, legal/accounting, software, and marketing.
- **Economic budget:** cash budget plus the market value of the founder's unpaid labor and income they could have earned elsewhere.

The first answers “Can I survive and ship?” The second answers “What did the product really cost, and what budget would another team need?” Keep both in the pitch. Calling 18 months of unpaid work a “$20,000 game” makes later investment planning unreliable and undervalues the founder's contribution.

### Solo funding bands

| Solo path | Cash required | Founder arrangement | Expected schedule | Honest outcome |
|---|---:|---|---:|---|
| Near-zero-cash validation | $3k–$15k | Keeps primary job/client work | 6–12 months for proof | Public demo, audience evidence, no promise of full release |
| Part-time commercial chapter | $20k–$50k | Reliable outside income covers living costs | 18–36 months | PWA/Android chapter with limited contractor polish |
| Runway-supported solo release | $50k–$100k | 12–18 months of modest personal runway | 12–20 months | Recommended minimum for a complete narrow Ties Break mobile release |
| Solo plus specialist production | $100k–$200k | Full-time founder plus recurring contractors | 15–24 months | Strong premium mobile/PC chapter, professional QA/content/marketing |
| Solo-led micro-studio | $200k–$350k | Founder plus one sustained collaborator | 15–24 months | Broader complete product, but no longer economically “solo” |

These ranges assume the existing code, art direction, and content are reusable. Starting a comparable project from zero would cost more. Personal runway varies too much by country and household to use an industry average; insert the founder's real minimum, including tax, healthcare, dependants, equipment replacement, and an emergency reserve separate from project money.

### The solo cash formula

Use this formula before deciding what to raise:

```text
required cash =
  (monthly household floor × full-time months)
  + contractor quotes
  + devices, store, legal, accounting, and software
  + launch and support reserve
  + 20% project contingency
  - reliable after-tax outside income assigned to the project period
```

Do not subtract hoped-for launch sales, an unawarded grant, uncertain client work, or a publisher conversation.

### Worked $75,000 solo example

This example assumes 15 months, a $1,500 monthly household floor, the existing Ties Break code/assets, Android/PWA first, and the founder doing engineering, game design, production, and community work.

| Cash item | Budget |
|---|---:|
| Founder living runway: $1,500 × 15 months | $22,500 |
| Desktop/mobile packaging and engineering review | $8,000 |
| Targeted UI/art/animation help | $5,000 |
| Audio finishing | $2,000 |
| Narrative edit and sensitivity consultation | $3,000 |
| External QA, devices, and accessibility pass | $7,000 |
| Store, legal, accounting, and tools | $3,000 |
| Trailer/store assets/community/creator launch | $12,000 |
| Subtotal | $62,500 |
| 20% contingency | $12,500 |
| **Cash required** | **$75,000** |

If the founder's true household floor is $3,000, the same plan needs another $22,500. If outside work reliably supplies $1,000 after tax each month without reducing the development schedule, required project cash falls by $15,000. Change the spreadsheet, not the facts.

This plan still has an economic cost above $75,000. For example, a conservative $3,000 monthly replacement value for 15 months adds $45,000 of founder labor before opportunity-cost differences.

### What a solo Ties Break release should contain

#### Must ship

- One fixed protagonist and family setup.
- One complete three-to-five-season chapter with a real ending and epilogue.
- Durable restore, serialized actions, honest failure handling, and recoverable saves.
- Safe one-week and multi-week advancement with automatic stopping before decisions.
- A small daughter-agency spine: preferences, remembered parental pattern, and three consequential conflict/consent arcs.
- The current strongest tournament, economy, condition, and match systems, frozen rather than expanded laterally.
- Clear causal match presentation for the most important attributes.
- Android or installable PWA as the first mobile product; one store at launch.
- Keyboard/touch basics, readable narrow mobile layouts, modal focus semantics, reduced motion, and visible errors.
- A privacy/data explanation, export or recovery route, support email/page, and funded patch reserve.

#### Defer until revenue or funding

- Full adult career through the thirties.
- Multiple protagonists, gender tours, or character creator.
- Licensed players, tournaments, academies, brands, or federations.
- Voice acting and large bespoke animation expansion.
- Console port, simultaneous iOS/Android/PC release, or cloud saves.
- Multiplayer, social platform, accounts, backend, telemetry warehouse, or live-service calendar.
- Many languages before demand geography is known.
- DLC, sequel hooks, modding, or user-generated scenarios.
- Detailed parent-job simulation beyond one weekly work/presence choice.

#### Remove or hide

- The 52-week developer shortcut and all production-facing debug actions.
- Unfinished adult/endgame surfaces that imply a campaign the solo release cannot complete.
- Claims such as “full career” if the sold product is a junior chapter.
- Features that exist only in docs and cannot be supported after release.

The chapter can later become the first part of a larger product, but its price and store language must describe what exists today.

### Solo mobile platform plan

#### Stage 1 — PWA and direct testing

Keep the browser/PWA build for frictionless testing, feedback, and a free demo. Incremental cash can remain near $0–$2,000 for hosting, domain, test devices/services, and small deployment work. Do not depend on the PWA alone for premium discovery.

#### Stage 2 — Android first

For the current web stack, a wrapper/package feasibility spike should come before a native rewrite. Planning allowances:

- founder-led wrapper, signing, billing-free premium package, file/lifecycle fixes, and store setup: $2k–$8k cash;
- experienced contractor plus device QA and release assistance: $10k–$30k;
- broader rewrite caused by unsupported runtime behavior: stop and rescope before spending.

Google Play charges a one-time $25 developer registration fee, while service-fee programs and regional rules vary ([official registration](https://support.google.com/googleplay/android-developer/answer/6112435) and [fee overview](https://support.google.com/googleplay/android-developer/answer/11131145)). The store fee is trivial compared with QA, lifecycle, support, and discovery.

#### Stage 3 — iOS only after validation

Apple's Developer Program is $99 per year, and qualifying small developers can receive a 15% commission rate ([membership](https://developer.apple.com/programs/whats-included/) and [Small Business Program](https://developer.apple.com/app-store/small-business-program/)). Budget $5k–$15k for a straightforward incremental wrapper/review/device pass or $15k–$50k when platform behavior, accessibility, purchasing, export, or layout requires specialist work.

Do not launch both stores merely because registration is affordable. Each store creates screenshots/copy, compliance, review, device, support, update, and ranking work.

### Mobile premium unit economics

A deep, offline, no-ads management game is better aligned with premium pricing than free-to-play. Free-to-play would add analytics, remote configuration, content cadence, monetization, customer support, acquisition testing, and privacy/compliance costs that a cash-constrained solo developer cannot absorb safely.

For a conservative mobile planning case, assume:

- average paid price after regional pricing and discounts: 70% of list;
- refunds, consumption tax, and leakage: 10%;
- qualifying small-developer store commission: 15%;
- net before company/income tax: about 53.55% of list price.

| List price | Planning net per paid copy |
|---:|---:|
| $4.99 | $2.67 |
| $9.99 | $5.35 |
| $14.99 | $8.03 |

| Cash to recover | At $2.67 net | At $5.35 net | At $8.03 net |
|---:|---:|---:|---:|
| $25k | 9,364 copies | 4,673 copies | 3,114 copies |
| $75k | 28,090 copies | 14,019 copies | 9,340 copies |
| $150k | 56,180 copies | 28,038 copies | 18,680 copies |

These are paid copies needed to recover cash, not profit or a forecast. A low price can increase conversion but also signals a smaller game and requires far more support-paying customers. Test $9.99–$14.99 for a complete substantial chapter rather than assuming mobile players will only pay $4.99.

### Mobile discovery with a small budget

Allocate effort before paid acquisition:

1. Interview 20–30 target players and observe at least 30 complete sessions.
2. Run 100–300 closed testers through PWA, Google Play testing, or TestFlight as applicable.
3. Build an email/community list that the founder controls; store followers are useful but not owned.
4. Produce one clear trailer and three message variants: tennis authenticity, management/economy, and parent-child story.
5. Seed small creators in tennis, management, simulation, and narrative niches with personal outreach.
6. Use relevant communities transparently; participate before promoting.
7. Spend the first $500–$2,000 of paid media only to test creative/store conversion, not to “buy a launch.”
8. Stop paid spend when the estimated cost to acquire a buyer approaches or exceeds the net receipt per copy.
9. Keep $2k–$10k for launch assets, creator support, and post-launch content if the organic response is promising.

Premium mobile discovery is difficult because the store is dominated by free downloads. The solo advantage is not paid reach; it is a distinctive premise, a playable browser link, authentic domain content, and a founder who can build direct relationships over time.

### Solo funding ladder

Raise only enough to reach the next evidence milestone.

#### $0–$5k: establish proof

- keep outside income;
- repair the most dangerous save path;
- define the sold chapter and ending;
- create a landing page, mailing list, short build, and target-player interview set;
- apply to no-cost incubators and actually eligible grants.

**Do not:** resign from stable work, commission expensive trailers, or promise a release date.

#### $10k–$25k: establish commercial feasibility

- obtain an engineering/packaging review;
- build the complete short vertical slice;
- pay for targeted narrative/art/audio work rather than general “polish”;
- run external device/accessibility QA;
- collect first credible audience and price evidence.

**Likely sources:** savings, small grant, accelerator, limited client-work surplus, friends/family only under documented terms, or a tiny games-savvy project investment.

#### $25k–$75k: buy focused runway

- reduce outside work for a defined period;
- finish the chapter and Android/PWA delivery;
- fund QA, store assets, community, legal/accounting, and post-launch reserve;
- create a fallback plan that still ships if no further money arrives.

**Likely sources:** grant/accelerator plus founder capital, a small angel/project fund, or rewards campaign backed by an existing audience.

#### $75k–$150k: ship with professional support

- fund 12–18 months of modest founder runway;
- use specialists for the founder's weakest disciplines;
- launch one platform properly and validate the second;
- reserve at least 15–20% and post-launch support cash.

**Likely sources:** a micro-publisher/project-revenue deal, larger grant, strong crowdfunding campaign, games angel, or a blend.

### Solo deal discipline

- Do not sell company equity for $10k–$25k without understanding the permanent cost.
- Do not sign away global multi-platform rights when a partner only funds Android marketing.
- Do not accept personal guarantees for speculative development debt.
- Put friends/family money in writing and state clearly that total loss is possible.
- Budget legal review before signing a publisher, project-revenue, equity, or licensing deal.
- Preserve the source code, IP, accounts, signing keys, and store pages under the studio/founder's controlled entity.
- Keep personal emergency savings outside the project account.
- Record founder advances and unpaid labor consistently for later diligence and tax advice.

### Solo operating rhythm

A solo founder has five jobs: product, engineering, content, business, and support. Pretending all five can be full-time at once creates hidden schedule failure.

A sustainable week might reserve:

- three days for product/engineering;
- one day for content, QA, and playtests;
- one day for community, business, finance, and administration;
- a fixed maximum working week and at least one non-working day;
- one monthly build that an external person can install without help.

When launch approaches, business/support load rises and feature output falls. Plan it as capacity, not an interruption.

### Solo go/no-go rules

- **Continue part-time** when players value the slice but audience growth is slow.
- **Seek $25k–$75k** when the complete chapter is technically feasible and external players want it.
- **Seek a micro-publisher/project fund** when the founder can build the game but cannot credibly perform launch, QA, or platform work alone.
- **Cut the platform** when packaging/certification exceeds 20–25% of the whole cash budget.
- **Cut the feature** when it cannot be finished, tested, explained, and supported by one person.
- **Do not launch paid** while restore/save integrity or the sold ending is uncertain.
- **Stop or pause** before consuming personal emergency funds, high-interest debt, or health.

### Best solo recommendation for the current project

For Ties Break as reviewed, the most credible constrained plan is:

- **cash target:** $50k–$100k;
- **schedule:** 12–20 months full-time, or 20–36 months part-time;
- **scope:** one complete junior/family chapter rather than the full-life career;
- **platform:** PWA demo plus Android premium release; iOS after evidence;
- **price test:** $9.99–$14.99 mobile, with final value/market validation;
- **team:** founder plus short specialist engagements in QA/accessibility, narrative/sensitivity, audio/art finishing, and packaging;
- **funding:** founder/outside income + eligible regional grant/incubator + optional $25k–$75k project/micro-publisher top-up;
- **marketing:** direct community and creator outreach, one strong trailer, $2k–$10k launch reserve, no scaled paid acquisition until unit economics work;
- **quality floor:** safe saves, complete ending, time compression, daughter agency, mobile legibility, visible errors, and six months of patch capacity.

If only $5k–$20k is available, do not call it the full production budget. Use it to create the complete short proof, grow an owned audience, and qualify for the next $25k–$75k. That is a valid development path—not a lesser imitation of a publisher production.

## Financing routes

No single route is universally best. The relevant distinction is what the funder receives: nothing, rewards, repayment/revenue share, publishing rights, or company equity.

| Route family | Capital provider receives | Typical role for Ties Break |
|---|---|---|
| Founder/work-for-hire | Nothing or delivery of unrelated client work | Proof bridge |
| Grant/rebate/accelerator | Eligibility, reporting, local spend, or program participation | Non-dilutive slice/production reduction |
| Rewards crowd | Promised rewards and community access | Validation plus partial production cash |
| Early Access/customer revenue | A playable product worth today's price | Late production feedback, not completion dependency |
| Publisher | Recoup, revenue share, and defined publishing rights | Full production and go-to-market |
| Project/revenue fund | Capped or time-limited game receipts | Full or gap finance without studio equity |
| Angel/VC/equity crowd | Ownership or future ownership of the studio | Company runway/multi-title thesis |
| Platform | Content, launch, inclusion, exclusivity, or port obligations | Incremental platform/marketing money |
| Strategic partner | License, brand association, access, or commercial rights | Authenticity, reach, selective cash |
| Debt/revenue loan | Repayment, interest, priority, or receipt percentage | Post-revenue/contracted receivables only |
| Co-development | Cash and/or revenue share for a defined production contribution | Fill a specialist, content, QA, or port gap |

### Route A — Founder capital, consulting, or work-for-hire

**Structure:** founders fund the studio through savings, salary sacrifice, contract development, or profits from other work.

**Best use:** the first $50k–$200k needed to fix investor-blocking defects and build proof.

**Advantages:** no dilution, no recoup, maximum negotiating leverage, and freedom to stop.

**Risks:** context switching, slow schedule, hidden unpaid labor, personal financial exposure, and burnout. Founder labor must still appear at a fair replacement cost in the investor budget; otherwise later funding asks look artificially low.

**Ties Break fit:** strong as a bridge, weak as the only plan for a polished full-career release unless scope remains narrow.

### Route B — Grants, rebates, accelerators, and regional programs

**Structure:** non-dilutive grants, matched funding, tax rebates, prototype programs, incubation, mentorship, or export support. Eligibility usually depends on incorporation, local expenditure, ownership/control, team status, or cultural tests.

**Advantages:** preserves equity and IP, validates the project, and can finance the exact vertical slice needed for later publishers.

**Risks:** restricted spending, long decisions, reimbursement timing, reporting, match requirements, location constraints, and no guaranteed marketing/distribution.

Examples illustrate the pattern rather than a universal menu:

- Screen Australia's current production fund offers up to A$100,000 to eligible Australian-controlled companies with prototypes and project budgets up to A$500,000 ([official guidelines](https://www.screenaustralia.gov.au/fund/games-production-fund/)).
- The UK Games Fund has offered £50,000–£150,000 Content Fund grants with eligibility and leverage requirements ([UK government evaluation](https://www.gov.uk/government/publications/evaluation-of-the-uk-games-fund/evaluation-of-the-uk-games-fund)).
- For an Indonesia-based studio, Telkom Indonesia's Indigo Game accepts a deck and build year-round, describes development/publishing support, and reports more than $600,000 delivered across its portfolio—not per project ([Indigo Game](https://game.indigo.id/)). Regional pitch programs such as LEVEL UP KL require an English deck and playable build and connect selected SEA studios with global publishers/investors ([MDEC Pitch Day example](https://www.mdec.my/levelupkl/pitch-day)).
- Epic MegaGrants support eligible Unreal/open ecosystem work, but Ties Break's Vue stack is not a natural fit; changing engines merely to chase a grant would be destructive ([MegaGrants](https://www.unrealengine.com/megagrants)).

**Ties Break fit:** very good for the $150k–$300k investor-readiness bridge if the studio's incorporation and spending location qualify. Do not include unawarded grants in committed runway.

### Route C — Rewards crowdfunding

**Structure:** players pledge for digital copies, soundtrack/art rewards, naming/credit tiers, development access, or other finite rewards. Kickstarter charges 5% plus roughly 3–5% payment processing on successful campaigns ([official fees](https://help.kickstarter.com/hc/en-us/articles/115005028634-What-are-the-fees)).

**Advantages:** non-equity capital, demand evidence, community ownership, press beat, and a base of advocates.

**Risks:** it is a marketing launch before the game launch; failure is public; taxes, failed payments, community work, stretch goals, and reward delivery reduce usable proceeds. Kickstarter's 2024 platform-wide data showed a 57.3% project success rate but only 39% for first-time creators; that is not a video-game-specific forecast ([Kickstarter benefit statement](https://d3mlfyygrfdi2i.cloudfront.net/Kickstarter_PBC_Report_2024_FIN2-d4dacc8.pdf)).

**Ties Break fit:** use only after a strong public demo, a compelling trailer, an existing audience, and a fully costed minimum goal. Prefer digital rewards and avoid physical fulfillment. A gross $200k campaign might provide only about $160k–$180k of usable production cash after platform/processing, taxes, campaign production, customer support, and contingency; model the exact entity/tax position separately.

### Route D — Premium Early Access revenue

**Structure:** sell a genuinely valuable unfinished build while players influence remaining development.

**Advantages:** revenue, community feedback, pricing evidence, and no equity.

**Risks:** launch visibility is partly consumed early; public reviews attach to unfinished work; save compatibility and update cadence become obligations; revenue may be far below the remaining budget.

Valve explicitly says Steam Early Access is not a crowdfunding mechanism and should not be used when completion depends on selling a specific number of copies ([Steam Early Access rules](https://partner.steamgames.com/doc/store/earlyaccess)).

**Ties Break fit:** possible only after career integrity is fixed and the available chapter is worth its price with a meaningful ending. Do not use the present “no ending” build to finance the ending.

### Route E — Traditional publisher advance

**Structure:** a publisher funds development/marketing/services against milestones, recoups defined costs from receipts, then shares revenue. Rights may cover platforms, territories, sequel/options, merchandising, subscriptions, and duration.

**Advantages:** development cash, production support, QA/localization/ports, platform access, marketing, and commercial expertise.

**Risks:** recoup can delay developer cash for years; marketing may be recoupable; approval and delivery rights can reduce control; cross-collateralization can make one platform pay for another; IP/sequel clauses can outlive the useful relationship.

Public terms show why headline revenue share is insufficient. Raw Fury's publicly discussed model retained developer IP and split post-recoup revenue 50/50, while recoup included development cost, a markup, services, and marketing. The waterfall—not “50/50”—determines when the developer is actually paid ([WIPO's game-business guide](https://tind.wipo.int/record/45851) and [Raw Fury discussion](https://www.gamesradar.com/games/we-are-buying-into-your-vision-blue-prince-publisher-raw-fury-reflects-on-10-years-of-indie-game-magic/)).

**Ties Break fit:** strongest full-production route if the publisher understands premium management/narrative games, agrees to a PC-first plan, funds a real marketing minimum, and leaves IP/unsupported platforms with the studio.

### Route F — Project investment or revenue-share fund

**Structure:** capital is invested into one game in exchange for capped or time-limited repayment/revenue share, without acquiring studio equity or performing full publishing.

**Advantages:** preserves company equity and often IP; simpler alignment around one title; can coexist with a marketing/distribution partner if contracts permit.

**Risks:** the studio still owns production and go-to-market execution; return can burden receipts; multiple financiers can create incompatible waterfalls.

Indie Fund says it is not a publisher and does not provide QA/marketing; its public model expires if the investment has not been repaid within two years after release ([Indie Fund terms overview](https://indie-fund.com/about)). Its pitch guidance focuses on whether the game is special, the team can deliver, and the budget/schedule can both repay investment and leave the developer able to make another game ([pitch guidance](https://indie-fund.com/articles/How-to-Pitch-Your-Game-to-Indie-Fund-or-just-about-anyone)).

**Ties Break fit:** excellent in principle, provided the team also budgets a producer, marketing, QA, legal, and platform capability that a fund does not supply.

### Route G — Angel, SAFE, or priced equity round

**Structure:** investors buy or obtain future rights to part of the studio, not merely the game's receipts.

**Advantages:** capital is not ordinarily recouped from one game's revenue; money can build the team, company, and future pipeline; investors may add network and commercial skill.

**Risks:** permanent dilution, governance/information rights, pressure for future rounds, and misalignment if the investor expects a venture exit from a premium one-game studio.

**Ties Break fit:** reasonable for a small $150k–$500k bridge from games-savvy angels who believe in the studio, especially if paired with non-dilutive money. Offer an equity story only if there is a real second-product/company thesis. Obtain local and cross-border securities/tax counsel; do not copy a U.S. SAFE without checking the incorporation jurisdiction.

### Route H — Institutional venture capital

**Structure:** equity investment into a high-growth studio/company, normally expecting large follow-on value or exit.

**Advantages:** larger and longer-duration capital, recruiting credibility, and access to a professional network.

**Risks:** poor match for one finite premium game, significant dilution, growth pressure, board/control terms, liquidation preferences, and future-financing dependency.

**Ties Break fit:** not recommended now. Revisit if Ties Break validates a franchise and the studio can present reusable capabilities, multiple titles, and a path to returns far beyond recouping one development budget.

### Route I — Platform, subscription, exclusivity, and port funding

**Structure:** a platform pays for inclusion, timed exclusivity, a port, launch support, minimum guarantee, prototype, or marketing placement.

**Advantages:** non-equity cash, distribution reach, platform credibility, and reduced port cost.

**Risks:** opaque availability, negotiation lead time, delivery/certification obligations, potential audience loss through exclusivity, and dependency on discretionary curation.

ID@Xbox has no application, certification, publication, or update fee, offers approved concepts access to development kits, and invites partners to pitch for deal consideration ([official program](https://www.xbox.com/en-us/games/publish)). Sony offers eligible newly registered partners complimentary loaned PS5 development and test kits ([PlayStation Indies](https://sonyinteractive.com/en/blog/playstation-indies-development-hardware-loan-program/)); Nintendo portal registration/tools are free but development hardware remains a cost ([Nintendo FAQ](https://developer.nintendo.com/faq)). None of these programs guarantees financing or solves the current web-stack port.

**Ties Break fit:** treat platform money as upside after PC traction or publisher interest, never as base-case committed funds.

### Route J — Strategic brand, tennis, media, or academy partner

**Structure:** sponsorship, licensed content, co-marketing, research/access partnership, branded edition, or direct strategic investment.

**Advantages:** authenticity, domain access, audience, earned media, and possibly non-dilutive cash.

**Risks:** approval delays, creative restrictions, morality clauses, rights complexity, regional limitations, and pressure to turn the child/equipment economy into advertising.

**Ties Break fit:** useful for research and reach, but keep the initial game fictional unless a license partner pays its full incremental cost and preserves editorial independence. The investor/child-asset theme makes brand integration particularly sensitive.

### Route K — Debt or revenue-based financing

**Structure:** repayable loan or percentage of receipts, usually with interest/fee and priority over residual cash.

**Advantages:** no equity dilution and clear end date.

**Risks:** repayment obligation exists even when launch underperforms; personal guarantees/covenants can be dangerous; pre-revenue game cash flow is too uncertain for ordinary debt.

**Ties Break fit:** avoid for core pre-release development. Consider only after contracted platform/publisher receivables or stable post-launch revenue exist.

### Route L — Co-development or production partnership

**Structure:** another studio supplies an engineering, art, QA, content, localization, or porting team for cash, milestone fees, revenue share, reciprocal services, or a mixture. It may also finance part of delivery in exchange for participation in one platform's receipts.

**Advantages:** fills a proven capability gap without permanently hiring a whole department; creates credible delivery capacity for publisher diligence; can move certification/port risk to an experienced partner. GDC's 2025 respondents gave co-development the highest “very successful” rating among reported financing methods, although satisfaction does not guarantee suitable terms ([GDC survey summary](https://gdconf.com/article/gdc-2025-state-of-the-game-industry-devs-weigh-in-on-layoffs-ai-and-more/)).

**Risks:** coordination and integration cost, dependency on the partner's schedule, inconsistent quality, ownership ambiguity, background-technology licenses, and revenue shares that continue long after the work is delivered.

**Ties Break fit:** strong for desktop packaging, console feasibility, accessibility QA, localization, art/animation bursts, and launch QA. Define source access, acceptance, warranty, IP assignment/license, security, credit, maintenance, and exit assistance. Do not outsource the core product thesis or authoritative simulation ownership.

### Route M — Regulated equity crowdfunding or community round

**Structure:** eligible members of the public invest in the studio through a regulated securities platform, receiving shares or a security that may convert into shares. Rules, investor limits, disclosures, solicitation, nominee structures, and availability depend heavily on the company and investor jurisdictions.

**Advantages:** lets a validated community participate in studio upside; can raise company capital without assigning publishing rights; provides a public commercial proof point.

**Risks:** it is a securities offering, not rewards crowdfunding. It can create expensive compliance, public disclosure, an unwieldy cap table, investor communications, valuation pressure, and conflicts with later institutional rounds. Fans may not understand that equity can become worthless or illiquid.

**Ties Break fit:** only after a real audience and multi-title company thesis exist. Prefer a regulated nominee/special-purpose structure where lawful and commercially sensible. Do not advertise financial returns to the player community without qualified local counsel, approved disclosures, and platform compliance.

## Recommended financing stack

The preferred structure separates proof capital from production capital.

### Stage 1 — $150k–$300k investor-readiness bridge

Suggested sources:

| Source | Target contribution |
|---|---:|
| Founder capital/paid founder labor | $50k–$100k |
| Eligible grant, accelerator, or regional development fund | $50k–$150k |
| Games-savvy angel or small project fund | $50k–$150k |

The totals are alternatives/overlapping targets, not an instruction to raise all three maximums. Use the bridge only to deliver the proof milestone described below. Do not hire the full production team before production money is committed.

### Stage 2 — $1.2M–$1.9M production and launch financing

Preferred order:

1. publisher or project-revenue fund covering the complete base scope;
2. regional grant/rebate reducing recoupable development expense;
3. crowdfunding only when an existing community can supply a meaningful portion;
4. small equity top-up for studio runway, not to conceal an underbudgeted game;
5. platform/port money as separate expansion finance.

A strong example stack for the $1.77M base case could be:

| Capital source | Example amount | Rights/cost |
|---|---:|---|
| Founder capital and existing work | $120k | No external rights |
| Grant/accelerator | $100k | Reporting and eligible-spend conditions |
| Rewards crowdfunding net proceeds | $150k | Reward/community obligations |
| Publisher/project finance | $1.30M | Recoup/revenue share or publishing rights |
| **Total** | **$1.67M** |  |
| Additional contingency/marketing facility unlocked by milestones | **$100k** | Pre-negotiated, not assumed until triggered |

This is illustrative. A publisher may reduce its offer by non-recoupable grant money or insist on controlling crowdfunding timing. Every source must consent to the same budget, rights map, revenue waterfall, and reporting definitions.

### Why this stack is preferable

- The founder reaches market proof before accepting the most expensive terms.
- Non-dilutive money reduces publisher recoup.
- Community finance demonstrates demand without pretending to fund the whole game.
- Project finance matches a finite premium title.
- Studio equity remains available for a sequel/company thesis rather than being spent on avoidable production risk.

## Development and fundraising roadmap

The schedule is milestone-based. Calendar durations are planning bands, not deadlines.

### Phase 0 — Company and evidence foundation

**Timing:** month 0–2  
**Incremental cash:** $25k–$60k

**Work**

- establish the development entity, cap table, banking/accounting, and founder agreements;
- verify chain of title for code, fonts, music, images, narrative, contractors, datasets, and any AI-assisted assets;
- place source art masters in recoverable versioned storage;
- convert the full review into a scoped v1 product contract and risk register;
- build the first bottom-up budget, hiring plan, cash-flow model, and financing-source map;
- define PC packaging/updates and complete a small desktop feasibility spike;
- select target comparable titles by audience, price, depth, and production—not merely “sports games.”

**Gate**

The company owns or controls everything it proposes to finance; the scope has a real ending; the budget includes founder labor, marketing, QA, and post-launch support; the current technology can ship on the first target platform.

### Phase 1 — Investor-ready vertical slice

**Timing:** month 2–7  
**Incremental cash:** $125k–$250k

**Work**

- make restore durable and serialize/transactionalize commands;
- add worker/storage recovery and remove the shipped 52-week developer action;
- implement safe time compression with stopping reasons;
- build one short but complete arc from planning through tournament, family trade-off, daughter disagreement/consent, and a meaningful mini-epilogue;
- make match evidence explain key attributes while preserving deterministic results;
- correct modal/navigation/mobile accessibility blockers;
- package a stable PC build and establish crash/support diagnostics that remain privacy-respecting;
- create near-final key art, a 60–90 second trailer, six strong screenshots, and a 20–40 minute public-demo plan.

**Gate**

External players can understand the fantasy, finish the slice without developer help, trust the save, perceive meaningful causes, and describe why they would buy the full game. The build looks like the proposed product rather than an engineering prototype.

### Phase 2 — Market validation and fundraising

**Timing:** month 5–9, overlapping Phase 1  
**Incremental cash:** $35k–$100k plus ongoing team burn

**Work**

- create and publish the Steam Coming Soon page when positioning/art are ready;
- run closed playtests, then a controlled public demo;
- collect consent-based aggregate product evidence: starts, completion, session length, return intent, wishlist conversion source, survey purchase intent, usability failures, and qualitative quotes;
- build a press/creator list around sports management, family/narrative games, simulation, and tennis—not only general gaming press;
- apply to relevant grants, incubators, regional pitch events, and project funds;
- run a structured publisher process with the same build, deck, budget, and requested terms;
- decide whether a crowdfunding campaign has enough owned audience to justify its cost.

Steam charges a $100 recoupable Direct fee after $1,000 of adjusted gross revenue ([Steam Direct documentation](https://partner.steamgames.com/doc/gettingstarted/appfee)). Steam Next Fest permits each eligible unreleased title to participate once and requires a public store page plus playable demo, so the timing should be chosen strategically rather than used automatically at the first opportunity ([Next Fest documentation](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest)).

**Gate**

At least two capital routes show real diligence interest, player evidence supports the product/pricing thesis, and the team can identify which promised features drove demand. If the evidence is weak, reduce scope or reposition before taking expensive capital.

### Phase 3 — Full production

**Timing:** month 8–20  
**Incremental cash:** $650k–$1.05M in the recommended plan

**Work**

- complete the career/endgame contract;
- expand daughter agency and parent work/presence across age bands;
- finish tournament, academy, injury, contract, adult economy, and epilogue arcs;
- build content tools and reusable narrative/evidence patterns rather than one-off conditionals;
- execute architecture decomposition only behind behavior tests;
- complete accessibility semantics, localization infrastructure, settings/recovery, and offline behavior;
- run quarterly deterministic full-career balance reports;
- maintain a playable public demo branch while the main product evolves.

**Gate**

Feature complete means every promised system exists, every supported career state reaches an ending, save compatibility is declared, all content is available for localization, and no major architecture work remains on the launch critical path.

### Phase 4 — Alpha, beta, and launch campaign

**Timing:** month 16–24  
**Incremental cash:** $300k–$550k including launch marketing

**Work**

- external QA across target operating systems, displays, input devices, save/migration paths, offline update, and accessibility;
- tune with versioned balance artifacts rather than anecdote alone;
- complete localization and linguistic QA;
- lock price, launch window, store page, trailer, review build, press kit, creator plan, and support documentation;
- run a festival/demo beat only when the team can respond to attention;
- scale paid media only after creative and store conversion tests justify it;
- prepare launch rollback, hotfix, review-response, community, and crisis plans.

**Gate**

The build has no career-integrity blocker, achieves declared performance/accessibility targets, completes a clean install/update/offline cycle, and can be supported for six months even if launch receipts are zero.

### Phase 5 — Launch and supported long tail

**Timing:** launch through month +12  
**Reserved cash:** $100k–$250k

**Work**

- rapid integrity/accessibility fixes, then lower-cadence quality updates;
- transparent save-schema and compatibility notes;
- planned discount/festival beats without training players to wait immediately;
- player-support and review-theme analysis;
- mobile/console feasibility decisions based on actual audience and economics;
- investor/publisher reporting against one agreed net-receipts definition;
- sequel/DLC decision only after the base game is stable and recoup trajectory is understood.

## What investors and publishers need to see

### The pitch in one sentence

> Ties Break is a premium parent-perspective tennis career simulation: you cannot play the points, so you shape a daughter's circumstances, live with the economics, watch honest deterministic matches, and discover what ambition did to the family.

The sentence must be tested with players and commercial partners. It currently communicates the differentiators more effectively than “tennis manager.”

### Required pitch package

1. **Playable build:** stable, distributable, controller/keyboard/touch-aware, with 20–40 minutes of representative play and a complete dramatic/mechanical payoff.
2. **60–90 second gameplay trailer:** parent choice, visible cost, match spectacle, daughter response, and consequence—not a list of menus.
3. **10–12 slide deck:** hook, audience, product, proof, comparable positioning, business model, roadmap, team, budget, sales cases, risks, and exact ask.
4. **One-page product sheet:** platforms, price, scope, languages, age rating, release window, contacts, and build access.
5. **Financial model:** monthly cash flow, headcount, contingency, three sales cases, platform/tax assumptions, post-launch runway, and recoup waterfall.
6. **Production roadmap:** externally verifiable milestones with acceptance criteria rather than feature percentages.
7. **Data room:** company documents, cap table, founder/contractor agreements, IP chain of title, financial history, budget quotes, privacy/security posture, source/asset continuity, and litigation/debt disclosure.
8. **Market evidence:** playtest cohort definitions, demo funnel, wishlists and sources, community growth, press/creator response, retention/return intent, pricing survey, and rejected hypotheses.
9. **Team plan:** current strengths, missing hires, named external specialists, and evidence that the founder is not the only delivery path.
10. **Deal memo:** amount requested, use of funds, rights offered, rights reserved, milestones, launch responsibility, marketing minimum, and negotiation boundaries.

Indie Fund's public guidance says reviewers ask whether a game is special/well-crafted, whether the team can achieve it, whether it can repay the investment and finance the developer's next game, and whether the budget/schedule can produce financial success. It also emphasizes an actual prototype/vertical slice and market feedback ([Indie Fund pitch guidance](https://indie-fund.com/articles/How-to-Pitch-Your-Game-to-Indie-Fund-or-just-about-anyone)). Ties Break already has much of the raw material; it needs a sharper complete slice and commercial evidence.

### Evidence targets for the fundraising process

These are proposed internal gates, not universal investor rules or sales guarantees:

| Signal | Minimum useful evidence | Stronger fundraising evidence |
|---|---:|---:|
| Moderated playtests | 30–50 target players | 100+ across player segments |
| Public demo starts | 500+ | 2,000+ with attributable sources |
| Demo completion | 35%+ of qualified starts | 50%+ after usability fixes |
| Steam wishlists | 5,000+ before full raise | 15,000–30,000 with organic momentum |
| Store-visit to wishlist conversion | 8%+ | 12%+ on qualified traffic |
| “Would buy near target price” survey response | 25%+ | 40%+ with behavior corroboration |
| Publisher/project-fund process | 20–40 well-matched targets | 3+ in diligence / 2+ term discussions |

Do not manipulate denominators or present friend/family testing as market proof. Investors will care about sources, cohort quality, and trend more than a naked wishlist number. Wishlists are not sales.

## Fundraising process

### Build a targeted list, not a mass mailing

Segment 30–60 organizations by actual fit:

- premium simulation/management publishers;
- narrative and authored-indie publishers;
- project-revenue funds;
- Southeast Asian incubators/publishers and export programs;
- sports/games angels;
- platform programs;
- grant programs tied to the studio's real location;
- strategic tennis/media partners.

For each target, record check size, platform/genre history, territories, services, recoup behavior, IP stance, recent releases, conflicts, and warm-introduction path. A publisher that cannot reach the intended audience is not improved by a large logo.

### Run one bounded process

1. Secure five to ten friendly reviews of the materials.
2. Approach the highest-learning targets first, but reserve the best-fit dream partners until the pitch has been tested.
3. Send batches over 4–6 weeks so offers can be compared.
4. Use the same build/budget and disclose material changes consistently.
5. Track open, play, follow-up, diligence, pass reason, and next step.
6. Ask every pass one question: product, proof, team, budget, timing, portfolio conflict, or terms?
7. Create competitive timing without inventing offers.
8. Keep at least six months of runway at process start; fundraising from a cash cliff destroys leverage.

### Conferences and introductions

Use events as scheduled meeting density, not as speculative booth spend. A small private meeting room, polished portable build, and 20 pre-booked relevant meetings often matter more than an expensive public booth. SEA-based teams should monitor IGDX, LEVEL UP KL, regional publisher days, Gamescom Asia, and global online pitch programs, while verifying each year's eligibility and dates.

## Revenue and break-even model

### Unit assumption

For planning, the base model assumes:

- $24.99 list price;
- average paid price after discounts/regional mix: 75% of list;
- refunds, sales/consumption taxes, and transaction leakage: 10% of that amount;
- store/platform share: 30% in the conservative PC model;
- rounded net receipts to the publisher/rightsholder before publisher recoup/share: **$11.50 per copy**.

The arithmetic before rounding is $24.99 × 75% × 90% × 70% = $11.81. Actual contracts calculate taxes, refunds, fees, currency, and deductions differently. Mobile small-business programs can have lower commissions: Apple states a 15% rate for qualifying developers under its $1M program and $99 annual membership ([Apple program](https://developer.apple.com/app-store/small-business-program/) and [membership details](https://developer.apple.com/programs/whats-included/)); Google Play states 15% for the first $1M for enrolled developers in applicable markets and a one-time $25 registration fee ([Google Play fees](https://support.google.com/googleplay/android-developer/answer/10632485) and [registration](https://support.google.com/googleplay/android-developer/answer/6112435)). These lower commissions do not make mobile demand or porting free.

### Copies required to recover cash cost

| Cash to recover | At $9 net/copy | At $11.50 net/copy | At $14 net/copy |
|---:|---:|---:|---:|
| $150k proof bridge | 16,667 | 13,044 | 10,715 |
| $650k narrow midpoint | 72,223 | 56,522 | 46,429 |
| $1.77M recommended base | 196,667 | 153,914 | 126,429 |
| $2.5M | 277,778 | 217,392 | 178,572 |
| $4.0M expanded midpoint | 444,445 | 347,827 | 285,715 |

This is project cash recoup, not studio profit. It excludes residual publisher share, investor return premium, corporate tax, future development, and working capital. If a publisher recoups $1.8M of development plus $500k of marketing/services, $2.3M must be recovered from the agreed receipts before the post-recoup split; at $11.50 that is 200,000 copies. Whether marketing is recoupable, capped, pre-approved, or deducted “off the top” is therefore a primary economic term.

### Three commercial cases for the $1.77M plan

| Case | Lifetime units | Net at $11.50 | Project result before post-recoup share/tax |
|---|---:|---:|---:|
| Downside | 50,000 | $575k | Does not recover production cost |
| Base/viable | 175,000 | $2.01M | Recovers base cost with thin surplus |
| Strong | 400,000 | $4.60M | Supports royalties, studio runway, and expansion |
| Breakout | 1,000,000 | $11.50M | Franchise-scale outcome |

The funding plan must survive the downside without personal guarantees or an unfunded support promise. Investors should see the base case as plausible from comparable evidence, not as the arithmetic required to make the budget look safe.

## Marketing investment plan

Marketing starts during product definition, not three weeks before launch. The recommended $360k marketing allocation is staged:

| Stage | Budget | Purpose | Release condition |
|---|---:|---|---|
| Positioning, key art, store assets, trailer | $40k | Make the product understandable and clickable | Qualitative message tests pass |
| Community, PR, and campaign content | $100k | Consistent owned audience and earned reach | Content pipeline and public build are stable |
| Festivals, creator outreach, and paid creative tests | $120k | Find audience/channel fit | Demo completion and store conversion are credible |
| Launch paid media reserve | $100k | Scale proven creative/audiences | Measured acquisition economics justify spend |

### Audience lanes

- tennis fans who want system authenticity;
- Football Manager and sports-management players;
- narrative-management and family-choice players;
- deterministic simulation/economy players;
- parents/former junior-sport families attracted by the human premise;
- mobile-first premium players after PC validation.

Each lane needs different trailer cuts and store copy. “Tennis game” invites comparison with action tennis; “management game” can hide the emotional thesis; “parenthood game” can hide the match spectacle. Test all three pillars.

### Marketing movements

1. **Proof diaries:** short clips showing honest deterministic outcomes, money decisions, and the daughter's point of view.
2. **Developer credibility:** transparent systems posts about no rigging, real tennis economics, and save integrity.
3. **Playable beats:** controlled itch.io playtests, Steam Playtest, then one strategically timed Next Fest.
4. **Creator seeding:** management/simulation creators first, tennis/sports second, narrative creators third; provide save-safe builds and concise hooks.
5. **Press story:** the unusual parent perspective and research, not “another indie made with Vue.”
6. **Community:** newsletter/Discord or equivalent with predictable updates, but do not create a moderation-heavy social platform.
7. **Launch:** reviews and creator coverage coordinated into a narrow window, followed by patches and honest roadmap communication.
8. **Long tail:** seasonal tennis moments, tournaments, awards/festivals, localization beats, and later platform announcements.

Paid media is not a substitute for wishlists, creator resonance, or store conversion. If $5,000–$15,000 of controlled creative tests cannot identify promising messages/audiences, do not unlock the $100,000 reserve.

## Platform roadmap and incremental costs

### PC packaged release — included in the recommended estimate

The existing web architecture can plausibly be delivered in a desktop shell, but the choice must be validated for file-system saves/exports, worker behavior, GPU/canvas performance, installers, signing, updates, overlays, achievements, controller input, screen readers, and crash recovery. The $40k specialist line is a feasibility/implementation allowance, not proof.

### Browser/PWA — keep as demo and direct channel

Browser builds are valuable for zero-friction playtests and direct demos. They are less attractive as the only premium distribution mechanism because purchasing, offline media, filesystem exports, platform discovery, and desktop expectations need additional work.

### itch.io — low-cost direct channel

itch.io allows creators to choose the platform revenue share from 0% to 100%, with a 10% default, plus payment processing ([official payment guide](https://itch.io/docs/creators/payments)). It is useful for closed/public tests, direct supporter editions, DRM-free delivery, and experimental pricing, but should not be assumed to provide Steam-scale discovery.

### Premium mobile — add $180k–$450k

Incremental work includes native packaging, store compliance, lifecycle/background behavior, cloud/transfer strategy, device QA, touch/accessibility adaptation, performance/battery, purchase restoration, customer support, and mobile-specific marketing. Validate that players will pay a premium price; otherwise mobile becomes a different business model.

### One console family — add $250k–$700k after feasibility

The current Vue/Web Worker implementation may require a different runtime, significant wrapper work, or a UI/engine port. Budget a paid technical spike before promising a console. The range covers engineering/port partner, platform services, controller/UI, TRC/certification QA, achievements, save behavior, localization certification, and contingency; licensing/hardware terms may be confidential.

### Simultaneous PC, mobile, and console

Do not promise this in the base raise. It increases test combinations, certification dependencies, marketing coordination, and cash tied up before learning which audience responds. A publisher can propose simultaneous launch, but must finance the incremental work and risk.

## Publisher and investment terms to negotiate

Headline cash and revenue percentage are not enough. Obtain experienced games counsel and model the waterfall using the actual contract.

### Non-negotiable clarity

- exact definition of gross revenue, net receipts, taxes, refunds, platform fees, currency conversion, reserves, chargebacks, and deductions;
- which development, localization, QA, porting, marketing, legal, and overhead costs are recoupable;
- whether recoup is 100%, from whose share, and across which platforms/titles/territories;
- payment/reporting frequency, audit rights, reserves, late payment, and statement detail;
- minimum guaranteed marketing cash and services, approval process, and spending cap;
- milestone acceptance criteria, cure periods, termination, and what happens to incomplete work;
- IP ownership, sequel/DLC/remake/merchandising/film rights, options, and reversion;
- platform and territory rights by duration; do not grant rights the partner will not actively exploit;
- launch-date, pricing, discount, bundle, subscription, key, and giveaway authority;
- creative approval and change-control boundaries;
- warranties for tools/assets/AI use and realistic indemnity/liability caps;
- insolvency, assignment/change of control, source code, build access, and rights reversion;
- post-launch support scope and who pays;
- treatment of grants, crowdfunding, tax credits, platform guarantees, and third-party port finance.

### Preferred Ties Break position

- studio retains IP;
- publisher receives defined game/platform/territory rights for a fixed term;
- sequels and unrelated sports titles remain with the studio, with at most a short first-negotiation window;
- non-recoupable marketing minimum is contractually specified where possible;
- no uncapped discretionary recoupable marketing;
- no cross-collateralization with other titles or unsupported platforms;
- milestone payments cover actual monthly burn plus contingency release;
- developer receives statement access sufficient to reconcile platform receipts;
- rights revert on non-launch, material breach, insolvency, or prolonged non-exploitation;
- save/privacy/product ethics cannot be traded away without explicit founder approval.

## Risk-adjusted go/no-go gates

### Gate 1 — Spend the proof bridge?

Proceed if the founder is committed to a defined v1 scope, chain of title is clean, and the desktop technical spike succeeds. Stop or restructure if the technology cannot reach the target platform without a rewrite the budget does not include.

### Gate 2 — Raise full production?

Proceed if external players finish and value the complete slice, investor/publisher diligence is real, and the budget is supported by team/contractor quotes. Reduce scope if demand is positive but modest. Do not raise the expanded budget merely because it is offered.

### Gate 3 — Crowdfund?

Proceed only if the campaign can plausibly receive 30–40% of its goal from the existing owned audience in its opening days, the minimum goal fully funds a deliverable milestone, and rewards are mostly digital. Otherwise use the demo as publisher evidence instead.

### Gate 4 — Enter Early Access?

Proceed only if the current build is worth the price, has a complete chapter/ending, safe saves, and funded completion without Early Access receipts. Otherwise keep it as a free Playtest/demo.

### Gate 5 — Add mobile or console?

Proceed when PC wishlists/sales show the relevant audience, the control/technology spike passes, and incremental financing is contracted. Do not fund ports from the base game's launch-support reserve.

### Gate 6 — Raise equity VC?

Proceed only when there is a credible multi-title studio plan, experienced leadership beyond one founder, and a capital-efficient path to company-scale value. Project success alone is not a venture thesis.

## First 90 days

### Weeks 1–2

- choose complete-v1 versus complete-junior-chapter scope;
- create entity/IP/contract checklist;
- assign a fair monthly cost to founder labor;
- build a month-by-month cash model for the $1.77M base case;
- define deal rights that are available and reserved;
- identify desktop packaging options and hire a short feasibility review.

### Weeks 3–6

- implement the highest-risk career-integrity fixes;
- storyboard the investor slice around one family/tennis conflict with a payoff;
- recruit narrative/sensitivity, production, and commercial advisers;
- prepare comparable-title research using real price/review/audience/channel data;
- start 20–30 target-player interviews before polishing the pitch deck;
- inventory every third-party asset and contractor right.

### Weeks 7–10

- run the first external slice tests;
- commission key art/trailer treatment rather than a final expensive trailer;
- prepare the 12-slide deck, one-page brief, monthly budget, and sales sensitivity;
- shortlist 30–60 funders/publishers by fit and rights behavior;
- map actually eligible Indonesia/SEA or other regional programs based on incorporation and spend;
- establish a newsletter/community capture path and consent-based test analytics.

### Weeks 11–13

- revise product and budget from evidence;
- complete a stable private pitch build;
- run friendly mock diligence with one producer, one publisher/business developer, and one finance/legal adviser;
- apply to selected bridge programs/funds;
- schedule the production-finance process only when the slice has a dated completion path;
- maintain at least six months of operating runway before formal publisher outreach.

## Final recommendation by founder objective

| Founder objective | Best route | Expected capital | Main sacrifice |
|---|---|---:|---|
| Ship the smallest honest game and keep full control | Bootstrap + grant + narrow self-publish | $450k–$850k total | Scope and marketing reach |
| Deliver the strongest commercially realistic Ties Break | Bridge + publisher/project finance + selective grant/crowd | $1.4M–$2.2M total | Recoup/revenue share and partner oversight |
| Maximize platform/content reach | Full publisher/co-development | $3.2M–$5.8M total | Higher hurdle, complexity, and rights pressure |
| Build a multi-title sports-management company | Angel/pre-seed then games VC | $7M–$13M runway | Equity, governance, and growth expectations |
| Validate demand before any large deal | $150k–$300k bridge only | $150k–$300k | More fundraising later |

For the present project, the second route is the best balance. The current MVP is too substantial to pitch as an idea, but too incomplete to price as a low-risk production deal. A focused proof bridge converts the most important review findings into investment leverage; a project/publisher round then pays for the complete product and its route to market. Classic VC should remain an option for the future studio, not the default answer to finishing Ties Break.

## Limitations

- No sales/wishlist/community analytics were present in the reviewed repository, so demand remains unpriced.
- Founder location, incorporation, compensation expectation, current team, past shipped titles, existing audience, and capital already invested were not supplied.
- Platform and publisher agreements are negotiated/confidential and can differ materially from public examples.
- Costs vary sharply with geography, employment model, language count, voice content, licensed rights, and console technology.
- The model does not constitute investment, legal, tax, securities, employment, or accounting advice.
- Grants and platform programs change; eligibility and dates must be reverified when applying.
- Sales cases are scenario arithmetic, not forecasts.
