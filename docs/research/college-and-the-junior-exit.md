---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# College and the junior exit – what the route really is, and what it costs to walk through it

**The owner, 14.08, verbatim:**

> «да, по колледжу надо комбо и понять устройство этого механизма и допуска в реальности. Сколько
> игроков из волны растущих реально идут в колледж, сколько реально доходят до w75 до этого момента,
> насколько корректна наша лестница в текущий момент вообще?»

**This document answers the first three – the sourced half.** The fourth («насколько корректна наша
лестница») is measurement on our own engine and lives in `docs/specs/college-fork-2026-08.md`, with
its own n. The two are deliberately kept apart: **nothing here is evidence about our build, and
nothing there is evidence about the sport.** Where this document needs one of our measured numbers to
size a proposal, it says so and names the file.

---

## ⚠ THE SOURCING RULE, AND WHY IT IS THE FIRST SECTION

`docs/specs/acceptance-cuts-2026-08.md` §0 finding 2 records what happened here on 2 August 2026: a
whole table of "the real tour's own entry ranges" entered the repo **already printed as fact, with no
citation**, and then propagated through three specs, each citing the one before it. Two of the ranges
turned out to be wrong. That is the failure this document is written against.

**Every number below carries a tag.**

* `[S]` – **stated** in the cited source, at the URL given.
* `[I]` – **inferred** here from sourced inputs, with the arithmetic shown and the inputs' URLs.
* `[GAP]` – **looked for and not found.** A stated gap is worth more than a plausible invention, and
  §4 is long on purpose.
* `[WEAK]` – found, but the source is commercial, secondary, or has an interest in the answer. Usable
  for shape, never for a decimal.

**No figure from this repo's own documents appears below as external evidence.**

---

## 0. THE THREE ANSWERS, IN ONE BOX

> ### 1. THE RULE OUR ENGINE MODELS HAS BEEN REPEALED – TWICE OVER, THE SECOND TIME IN APRIL 2026.
> `ENDINGS.collegeClosedFromTier`'s comment says: *"A player who has taken professional prize money has
> spent her college eligibility."* **That was never quite the rule, and it is not the rule now.** The
> old bylaw let a prospective college tennis player keep **$10,000 of prize money per calendar year**
> before enrolment, **plus actual and necessary expenses above that** `[S]`. Since **15 April 2026** the
> operative bylaw carries **no cap at all** before enrolment `[S]`. **There is no money threshold left
> in reality to copy** – and the word *"amateurism"* now appears **zero times** in the Division I
> Manual `[S]`.
>
> ### 1b. AND THE EDGE THAT DOES EXIST IS AT ENROLMENT, NOT AT A RUNG.
> **After** full-time enrolment the old rule still stands untouched: prize money **may not exceed actual
> and necessary expenses** `[S]`. So the real cliff in a tennis career is one day wide – unlimited on
> one side, net-zero on the other – and it is a *door she walks through*, not a *result she posts*.
>
> ### 2. AND THE PROOF IS THE PLAINTIFF HERSELF, AT A LEVEL FAR ABOVE W75.
> Reese Brantmeier played the **2021 US Open as a high-school junior**, won **about $50,000**, kept
> $10,000 plus expenses, forfeited the rest – **and went on to play NCAA Division I tennis for North
> Carolina**, winning the 2023 NCAA team title at No. 1 singles `[S]`. A Grand Slam, fifty thousand
> dollars, and the college place survived it. **Our rule shuts the door on one won match at a W75.**
>
> ### 3. THE REAL GATE IS NOT A RULE, IT IS A ROSTER. AND THE ROSTER IS SMALL.
> All of NCAA Division I women's tennis holds about **2,866 players** across four year-groups `[I]`,
> i.e. roughly **715 places per incoming class worldwide** `[I]` – and **62–66% of them go to
> international players** `[WEAK]`. College is not a right she forfeits by earning. **It is a scarce
> place somebody has to offer her**, and no threshold of any kind models that.

---

## 1. HOW THE COLLEGE ROUTE ACTUALLY WORKS

### 1a. The supply: how many places and how many scholarships exist per year

| figure | value | tag | source |
| --- | --- | --- | --- |
| US high-school girls' tennis participants, 2024-25 | **204,721** | `[S]` | [NCAA, Probability of Competing Beyond High School](https://www.ncaa.org/student-athletes/probability-of-competing-beyond-high-school/) |
| → reach **any** NCAA division | **8,137** = **4.0%** | `[S]` | same |
| → reach **Division I** | **1.4%** | `[S]` | same |
| **D-I women's tennis players, all four years** | **≈ 2,866** | `[I]` | 204,721 × 1.4%, both inputs from the NCAA page above |
| **D-I roster places opening per incoming class** | **≈ 715** | `[I]` | 2,866 ÷ 4 year-groups |
| D-I women's tennis teams | **312**, ~2,836 players, average roster ~9 | `[WEAK]` | commercial recruiting sites; **cross-checks the NCAA-derived 2,866 to within 1%**, which is why it is quoted at all |
| International share of D-I women's tennis rosters | **~62–66%** | `[WEAK]` | an X post and a commercial recruiting page citing 66% for 2022. **No primary ITA or NCAA figure was found.** |

**The scholarship position, and it moved in 2025.**

* Historically D-I women's tennis was capped at **8 scholarships** per team, against an average roster
  of **9.4** `[S]` – [Business of College Sports, roster-limit table](https://businessofcollegesports.com/other/new-roster-limits-set-by-house-v-ncaa/) (*"Tennis (W) | 8 | 9.4 | 10"*).
* Under the **House v. NCAA** settlement the NCAA Division I Board **formally adopted roster limits in
  place of sport-specific scholarship limits on 23 June 2025, effective 1 July 2025** `[S]` –
  [NCAA.org](https://www.ncaa.org/news/2025/6/23/media-center-di-board-of-directors-formally-adopts-changes-to-roster-limits.aspx).
  For schools that **opt in**, the cap is now a **roster limit of 10** for women's tennis, and a school
  may fund any or all of those ten `[S]` (same table).
* Practical effect: women's tennis becomes an **equivalency** sport – scholarships divisible into
  partial awards rather than ten full rides `[WEAK]`. ⚠ **This is the single most decision-relevant
  fact about the college route for a career sim and it is the one I could only source commercially.**

⚠ **THE ARITHMETIC THAT MATTERS.** ~715 D-I places per year worldwide `[I]`, of which perhaps a third
go to Americans `[WEAK]`, against a global population of ranked junior girls in the thousands (§2).
**The route is narrow.** Whatever our engine does with the college ending, offering it as a guaranteed
third answer to any nineteen-year-old who asks is not a model of this.

### 1b. ⚠⚠ THE PRIZE-MONEY RULE AS IT STANDS TODAY – AND A 2015 ANSWER IS TWO REPEALS OUT OF DATE

**The primary source is the live manual.** The NCAA's Legislative Services Database serves the current
**2026-27 Division I Manual** at
[web3.ncaa.org/lsdbi/reports/getReport/90008](https://web3.ncaa.org/lsdbi/reports/getReport/90008); the
copy read for this document carries the footer date **8/15/26**, i.e. today's operative text. Every
bylaw quoted below is from it.

#### The old structure, and it was one level deeper than most reporting says

| bylaw | scope | limit |
| --- | --- | --- |
| 12.1.2.4.1 | sports **other than tennis**, pre-enrolment | actual and necessary expenses |
| 12.1.2.4.2 | parent heading, *"Exception for Prize Money – Tennis"* | – |
| **12.1.2.4.2.1** | **tennis, BEFORE enrolment** | **$10,000 per calendar year**, then per-event amounts up to that event's actual and necessary expenses |
| 12.1.2.4.2.2 | tennis, **AFTER** enrolment | actual and necessary expenses only |

`[S]` – the structure is set out in Judge Eagles' 7 October 2024 opinion, footnote 2
([govinfo, 1:24-cv-00238](https://www.govinfo.gov/content/pkg/USCOURTS-ncmd-1_24-cv-00238/pdf/USCOURTS-ncmd-1_24-cv-00238-0.pdf)),
and corroborated by the redline in Proposal 2025-8. The $10,000 lived at **12.1.2.4.2.1**.

> **So even under the OLD rule, "she took prize money, therefore college is closed" was false.** A
> junior could bank $10,000 a year, every year, **plus her expenses at every event above that**, and
> remain fully eligible. `docs/specs/college-fork-2026-08.md` §4f measures our own careers against
> exactly this rule and finds it **four times more generous than ours, firing two years later**.

#### What it is now: no cap at all, before enrolment

Current operative text, **12.1.2.4.1** *(revised 6/6/25 effective 7/1/25, and 4/15/26)* `[S]`:

> *"Before initial full-time collegiate enrollment, an individual may accept prize money based on place
> finish or performance in an athletics event."*

**No dollar figure. No calendar-year aggregate. No expense test. And no tennis-specific bylaw at all any
more** – the sport-specific carve-out was collapsed into one all-sports rule. Two conditions survive:
the money must come from the **event sponsor**, and that sponsor must not be an *"associated entity or
individual"* (the House-settlement booster/collective definition, Bylaws 22.02.1–22.02.2).

Adopted by the Division I Cabinet **15 April 2026**
([NCAA.org](https://www.ncaa.org/media-center-di-cabinet-adopts-changes-to-eligibility-rules-for-prospects/)) `[S]`.

#### ⚠⚠ BUT AFTER ENROLMENT NOTHING CHANGED, AND THAT IS THE REAL CLIFF

**12.1.2.4.2** *(current)* `[S]`:

> *"After initial full-time collegiate enrollment, an individual may accept prize money based on place
> finish or performance in an athletics event. Such prize money may not exceed actual and necessary
> expenses…"*

The settlement left this deliberately untouched, and says so; the NCAA's own April 2026 announcement
says *"no change"* to the post-enrolment rules `[S]`. **So the sharp edge in a real tennis career is not
a rung and not a sum – it is the moment of full-time enrolment**: unlimited on one side, net-zero-after-
expenses on the other.

Three mechanics soften "expenses only" more than the phrase suggests, all from the current manual `[S]`:

* **12.02.1** defines actual and necessary expenses **broadly** – meals, lodging, apparel, equipment,
  **coaching and instruction**, insurance, transportation, medical, facility usage, **entry fees**, and
  *"other reasonable expenses"*.
* **12.02.1.2** – in **individual sports the calculation is on a calendar-year basis, not per event**.
  A player may set one large cheque against a whole year's coaching, travel and entry costs.
* **12.02.4 / 12.02.5** – a **$300 de minimis** either side of enrolment: exceed expenses by $300 or
  less and eligibility is unaffected.
* **12.02.1.1** – but the calculation may **not** include anyone else's expenses. This is exactly what
  caught Brantmeier (§3).

#### The settlement's status – preliminarily approved, not final

| fact | value | tag |
| --- | --- | --- |
| Case | ***Brantmeier v. NCAA***, No. **1:24-cv-00238-CCE-JEP**, M.D.N.C., Chief Judge **Catherine C. Eagles** | `[S]` |
| Suit filed | March 2024 | `[S]` |
| Term sheet executed | **25 February 2026** – the date the notice deems the rule change effective | `[S]` |
| Proposed settlement filed | **28 April 2026** | `[S]` |
| Judge questioned the terms | ordered briefing by 11 June 2026 on the **absence of injunctive relief for enrolled players**, notice sufficiency, and a possible intra-class conflict | `[S]` |
| **Preliminary approval** | **29 June 2026** | `[WEAK]` – plaintiffs' counsel press release + Carolina Journal; **the order itself could not be read** |
| Opt-out / objection deadline | **28 September 2026** | `[S]` |
| **Final fairness hearing** | **8 January 2027**, Greensboro NC | `[S]` |
| Fund | **$2,000,000** damages fund; **$10,000 service award** to each named plaintiff; fees and expenses paid separately by the NCAA | `[S]` |

Sources: [settlement site](https://www.ncaatennisprizemoneyclassaction.com/) ·
[Long Form Notice (PDF)](https://www.ncaatennisprizemoneyclassaction.com/pdf/Long-Form-Notice.pdf) ·
[Carolina Journal](https://www.carolinajournal.com/judge-questions-terms-of-ncaa-settlement-with-unc-tennis-player/).

⚠ **SO IT IS NOT FINAL.** Final approval is scheduled for **January 2027**. Treat "no pre-enrolment
limit" as the operative bylaw today (it is in the manual) with the settlement that produced it still
awaiting final approval.

⚠ **AND THE CLASS SIZE I ORIGINALLY WROTE HERE – "≈12,000" – IS WITHDRAWN.** It appears in neither
class definition, the notice, the settlement site nor the press releases. **It was a search-summary
figure with no document behind it, which is precisely the failure this document's §0 rule exists to
stop.** The classes are defined by participation, not by a count: the *Injunctive Class* is everyone
who competed in D-I tennis between 19 March 2020 and judgment (or was ineligible under the prize-money
rules); the *Damages Class* is those who forfeited prize money in that window up to 21 November 2025
`[S]`.

#### ⚠⚠ AND A SECOND 2026 CHANGE THAT MATTERS MORE TO US THAN THE MONEY ONE

New **Bylaw 12.6, "Five-Year Period of Eligibility"** *(revised 24 June 2026, effective 1 August
2026)* `[S]`:

> *"An individual's five-year period of eligibility begins with the earlier of … (a) the regular
> academic term in which the individual enrolls … full time …; or **(b) the beginning of the regular
> academic year immediately after the individual's 19th birthday.**"*

Adopted as the Division I **age-based eligibility model**
([NCAA.org, 23 June 2026](https://www.ncaa.org/division-i-adopts-age-based-eligibility-model/)) `[S]`.
It **eliminates seasons-of-competition, redshirts, sport-specific eligibility rules and extension
waivers** – the phrase *"season of competition"* now appears **zero times** in the manual `[S]`.
Phase-in: enrol by autumn 2026 and you get whichever regime helps; from autumn 2027 the age model is
the only one.

> ⭐ **READ THAT AGAINST OUR OWN FORK, WHICH IS ALSO AT NINETEEN.** Reality now starts a five-year
> college clock at nineteen **whether or not she enrols**. A girl who grinds the tour until
> twenty-one and then takes a scholarship has already burned two of her five years – **not because she
> earned money, but because she got older.** That is a real, sourced, age-based mechanism that lands on
> exactly the birthday our fork already uses, and it is a far better model of "the college door
> closing" than any prize-money threshold. **Nobody in this project has costed it.**

#### One more thing the same 2026 package changed

**12.3.1** *(adopted 15 April 2026)*: before initial full-time enrolment a prospect **may now be
represented by an agent** to market her ability and secure a professional opportunity `[S]`. Agent
representation after enrolment remains barred (12.3.2). **"Signed with an agent" is no longer a
college-ending act for a junior.**

### 1c. When a junior commits

| figure | value | tag | source |
| --- | --- | --- | --- |
| D-I coaches may send written material | from **1 September of sophomore year** | `[WEAK]` | commercial recruiting calendars |
| D-I coaches may telephone | from **15 June after sophomore year** | `[WEAK]` | same |
| Official and unofficial visits | from **1 August of junior year** | `[WEAK]` | same |
| **The National Letter of Intent was eliminated** | **9 October 2024**, Division I | `[S]` | [Husch Blackwell](https://www.huschblackwell.com/newsandinsights/ncaa-eliminates-national-letter-of-intent-program) · [Cavalier Daily](https://www.cavalierdaily.com/article/2024/10/ncaa-enacts-unprecedented-changes-to-national-letter-of-intent-program) |
| Replaced by | a **written offer of athletics aid / financial aid agreement**, which now carries the binding function | `[S]` | same |
| D-II | still uses the NLI | `[S]` | same |
| **Typical commitment age** | **≈ 16–17**, matriculating at **≈ 18** | `[I]` | from the recruiting-calendar dates above; US school years |

⚠ **THE COMMITMENT HAPPENS AT SIXTEEN OR SEVENTEEN, NOT AT NINETEEN.** Our fork is raised on her
nineteenth birthday (`ENDINGS.forkAgeYears`). **In reality the decision is two to three years earlier**
– at roughly the age our own engine measures the college door slamming (mean 17.3,
`college-fork-2026-08.md` §3). Our timing of the *closure* is closer to reality than our timing of the
*question*.

---

## 2. WHAT SHARE OF A JUNIOR COHORT GOES TO COLLEGE RATHER THAN THE TOUR

**⚠ THE HONEST HEADLINE: THERE IS NO PUBLISHED FIGURE FOR THE QUESTION AS ASKED.** I could not find any
source that takes an ITF-ranked junior year-group as the denominator and reports what fraction reaches
an NCAA roster. What exists is four different numbers with **four different denominators**, and the
commonest error in this area is quoting them as if they were the same number.

| claim | value | denominator – **read this column first** | tag | source |
| --- | --- | --- | --- | --- |
| US high-school girls' tennis → any NCAA division | **4.0%** | **US high-school team participants** | `[S]` | [NCAA](https://www.ncaa.org/student-athletes/probability-of-competing-beyond-high-school/) |
| US high-school girls' tennis → NCAA **Division I** | **1.4%** | same | `[S]` | same |
| U17/U18 juniors → "professional level" | **≈ 10%** | international U17/U18 juniors; a systematic review quoted by the paper, not the paper's own data | `[WEAK]` | cited in [BMC Sports Sci Med Rehabil, 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12910927/) |
| ITF junior **top-20 girls** → a professional WTA ranking | **99%** | the top twenty of the world junior list, 1995–2002 cohorts | `[WEAK]` | [PubMed 19735036](https://pubmed.ncbi.nlm.nih.gov/19735036/), secondary summary |
| WTA top-150 → previously ITF junior top-100 | **86%** | **runs backwards** – professionals, not juniors | `[WEAK]` | already in `docs/research/tennis-academies.md` §7, flagged secondary there too |
| ITF year-end junior **top-100 girls, 2020**: American girls with college plans | **3 of 10** | the ten Americans inside the world junior top 100 in one year | `[S]` | [ZooTennis](http://tenniskalamazoo.blogspot.com/2021/01/a-look-at-itf-top-100-year-end-world.html) |

⚠ **THE NCAA'S 4.0% AND 1.4% ARE THE WRONG DENOMINATOR FOR US, AND THE NCAA SAYS SO ITSELF.** Its
methodology note states that because *"the high school figures account only for participants on high
school teams and not those competing exclusively on club teams"*, the true rate *"could be lower in
some sports (e.g., ice hockey, tennis)"* `[S]`. A girl on the ITF junior tour is very often exactly the
club-only player this excludes. **These two percentages describe American schoolgirls, not our
character.**

**What CAN be said, and it is less than the question wants:**

* The girls' ITF junior population is large: **8,413 junior female player-year observations across ITF
  year-end lists, 2004–2024** `[S]` ([BMC 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12910927/)) –
  ⚠ *player-years across 21 seasons*, not distinct girls in a year, and the paper does not state the
  latter.
* That paper **explicitly did not compute a junior→WTA transition rate**, and lists doing so as future
  work `[S]`. So the most recent, most quantitative study of exactly this population declines to answer
  exactly this question.
* At the very top the junior list is highly predictive (99% of top-20 girls got a professional ranking)
  `[WEAK]`, and among the elite the college route is a minority choice: **3 of the 10 Americans** in the
  2020 world junior top 100 `[S]`.
* Against ≈**715 D-I places per incoming class** `[I]` and a **62–66% international** intake `[WEAK]`,
  the route is numerically real but narrow.

**`[GAP]` What nobody publishes:** the join. Nobody appears to have taken an ITF junior ranking list,
followed it forward, and counted college vs tour vs stopped. Until someone does, **any single percentage
we put in a spec for "how many growing players really go to college" would be an invention** – which is
precisely the failure §0's sourcing rule exists to prevent.

---

## 3. HOW FAR UP THE PROFESSIONAL LADDER A COLLEGE-BOUND JUNIOR TYPICALLY GETS FIRST

**The direct answer, and it is a single very well-documented case that goes far past W75.**

> **Reese Brantmeier** competed in the **2021 US Open** – qualifying singles, out in the third round,
> plus mixed doubles – **as a high-school junior**, and won **about $50,000** `[S]`. Under the rule then
> in force she kept **$10,000 plus documented expenses**. **She then played NCAA Division I tennis for
> North Carolina**, and in 2023 played **No. 1 singles on the NCAA team title winners** `[S]`
> ([The Assembly](https://www.theassemblync.com/news/culture/sports/tennis-ncaa-us-open-reese-brantmeier/), 2 Sep 2024).
>
> ⚠ **AND WHAT ACTUALLY COST HER A SEASON WAS THE EXPENSE ACCOUNTING, NOT THE PRIZE MONEY.** The NCAA
> rejected several claimed deductions – among them a receipt scanner and **her mother's lodging** during
> the tournament, a few hundred dollars' worth, disallowed under 12.02.1.1's bar on counting another
> person's expenses. She was ruled **ineligible for her freshman autumn, 2022**, and required to
> **donate $5,100 to charity**; she returned in spring 2023 `[S]` (same source).

**Maya Joint**, the co-plaintiff, earned about **$140,000** for reaching the **second round of the 2024
US Open** as an incoming University of Texas player, and could keep roughly **$10,000** – about 7%
`[S]` ([Front Office Sports](https://frontofficesports.com/maya-joint-tennis-texas-prize-money/), 27 Aug 2024).
She left college at the end of 2024 to turn professional. ⚠ Some later reporting gives $147,000; the
conflict is unresolved, so **use "about $140,000"**.

⚠ **THE $48,913 FIGURE, WHICH I HAD IN AN EARLIER DRAFT OF THIS DOCUMENT, IS WITHDRAWN.** It is widely
repeated in secondary reporting that could not be fetched directly, and no primary source was found for
the exact cents. The sourced statement is *"about $50,000"*. **A precise-looking number with no document
behind it is the exact failure §0 exists to prevent, and it got into this document once already.**

Three things follow, and all three bear directly on `collegeClosedFromTier`:

1. **Playing professional events as a junior is normal, not disqualifying.** The whole architecture of
   the old rule – an annual allowance, an expenses top-up, a forfeiture mechanism – exists *because*
   college-bound juniors routinely enter professional events. A rule that assumed they did not would
   not need a $10,000 line in it.
2. **The ceiling is not W75. It is the US Open.** Our engine closes the door on one won match at a
   W75 – measured at mean age **17.4**, in **93%** of careers (`college-fork-2026-08.md` §3). Reality
   let a Grand Slam main-draw player with $48,913 keep the place.
3. **The eligibility risk was real but it was never about RESULTS.** Brantmeier's lost season came from
   a disputed expense schedule – her mother's hotel room – not from the round she reached or the size of
   the cheque. **Our engine closes the door on a result. Reality has never closed it on a result.**

**The reverse direction – who skips college:** several of the strongest recent American junior girls
turned professional instead of enrolling – Ashlyn Krueger, Elvina Kalieva, Robin Montgomery, Katrina
Scott `[WEAK]` (ZooTennis, named in passing rather than as a study). And **Maya Joint**, the
co-plaintiff, is now a touring professional. **`[GAP]`** No published rank-or-result rule of thumb for
"at this level you turn pro instead" was found.

**`[GAP]` The distribution I most wanted and could not get:** the WTA rankings of incoming D-I women's
tennis freshmen. A resource exists – *collegetennisranks.com*'s "WTA Singles Rankings for College
Players" – but the table is script-rendered and could not be retrieved, and the ITA's own preseason
rankings page returned HTTP 403. **So "what rank does a college-bound girl typically hold" is unsourced
here, and must not be guessed.**

---

## 4. ⚠ COULD NOT SOURCE – the long section, and it is allowed to be long

1. **The share of an ITF-ranked junior cohort that reaches an NCAA roster.** §2. Nobody publishes the
   join. The most recent quantitative study of the ITF junior girls' population explicitly leaves it as
   future work.
2. **The number of distinct girls holding an ITF junior ranking in a given year.** The BMC paper gives
   8,413 *player-years over 21 seasons*; it does not give the annual list size, and I did not find an
   ITF publication that does.
3. **The WTA-ranking distribution of incoming D-I freshmen.** §3. Two candidate sources, one
   script-rendered, one 403.
4. **The international share of D-I women's tennis rosters, from a primary source.** The 62–66% figures
   come from an X post and a commercial recruiting page. **No ITA or NCAA demographic table was found.**
   ⚠ This matters more than it looks: it decides whether ~715 places a year are open to the world or
   mostly to Americans.
5. ~~What an athlete may earn while enrolled~~ – **ANSWERED, §1b**: expenses only, unchanged, Bylaw
   12.1.2.4.2. Left in the list struck through because it was the largest gap in the first draft and the
   answer inverted the shape of the whole finding.
6. **The preliminary-approval order itself.** Preliminary approval on **29 June 2026** rests on
   plaintiffs' counsel's own press release and one news outlet – the order could not be read (govinfo
   carries only the October 2024 opinion for this docket; Justia returned 403). **Final approval is not
   granted; the fairness hearing is 8 January 2027.**
7. **Whether the settlement was substantively revised** after the judge's questions, or merely
   re-briefed with a plaintiff added. Determining this needs the docket.
8. **The effective-date gap.** The settlement notice deems the rule change effective **25 February
   2026**; the adopted bylaw applies to those **initially enrolling full time on or after 1 August
   2026** – a **157-day** window in which a mid-year enrolee's treatment depends on which instrument
   controls. **No source reconciles the two.**
9. **The LSDBi proposal record for the 15 April 2026 action.** The adopted text and its `4/15/26`
   revision stamp are in the manual, so the substance is certain; the proposal number is not.
10. **How many of the ten roster places on a D-I team open per year, in practice.** The ÷4 in §1a assumes
    an even four-year cycle. Transfers, the transfer portal and now the age-based clock (§1b) make that a
    simplification, and I found no published freshman-intake count.
11. **Whether "college" outside the US is a comparable route at all.** Everything above is NCAA. The
    European university system has no equivalent scholarship-plus-team structure, and our game is
    WTA-first and nation-agnostic. **No source was sought and none should be assumed.**
12. **What a real WTA #183 nineteen-year-old has actually banked in career prize money.**
    `college-fork-2026-08.md` §5 flags our engine's figure – **$129,190 by nineteen** – as the number
    most worth checking against reality. ⚠ **This remains the highest-value open item in this document**,
    and it is the one that decides whether every threshold discussed here is even sizable.
13. ~~A published NCAA statement of the new rule's text~~ – **ANSWERED**: the 2026-27 Division I Manual,
    Bylaw 12.1.2.4.1, served live at
    [web3.ncaa.org/lsdbi/reports/getReport/90008](https://web3.ncaa.org/lsdbi/reports/getReport/90008).
14. **What the new age-based eligibility clock (Bylaw 12.6) would cost our character**, who is asked the
    fork question on precisely the birthday the clock starts. **Nobody in this project has costed it**
    and it is not measured in `college-fork-2026-08.md` either.

---

## 5. ⚠ THE COMBO – THIS SECTION IS A PROPOSAL, NOT A FINDING

Everything above is what the sources say. Everything below is what I think we should do, sized against
both halves. **It changes no constant and it is not a recommendation to ship.**

The owner approved a three-part combo: **(a)** a money threshold instead of a rung, **(b)** plus a
result arm that keeps the door open below some rank at 19 whatever she earned, **(c)** plus a warning
before the entry that costs it. Each is sized below, and the honest verdict on two of the three is that
the research and the measurement point the same way and it is not the way the combo assumes.

### 5a. What the research changes about the premise

`ENDINGS.collegeClosedFromTier`'s comment rests on one sentence: *"A player who has taken professional
prize money has spent her college eligibility."* **§1b shows that sentence has been false for the whole
life of this project.** Under the old rule she could take **$10,000 a year plus expenses** and stay
eligible; under the April 2026 settlement she may take prize money **without restriction** before
enrolment. And §3 shows the sport permitting exactly the case our rule forbids – a Grand Slam main draw
and $48,913, with the college place intact.

⚠ **THIS DOES NOT MEAN THE CONSTANT IS WRONG.** It means its **stated justification** is wrong. There is
a perfectly good reason to keep a rung threshold – *a girl who is a professional does not go to
college* – and the owner's own marker («offers the academy to a girl already earning on W75+») is that
argument, not the eligibility one. **The comment should stop citing a rule that does not exist, whatever
the number ends up being.** That is a correction the owner can make independently of any balance change.

### 5b. (a) THE MONEY ARM – ⚠ I GOT THIS WRONG FIRST TIME, AND THE ERROR IS INSTRUCTIVE

**What I measured first, and what it appeared to prove.** I swept a **flat cumulative dollar line** –
"the door closes once she has banked $M in total" – across eight values. Every one of them failed:
$10,000 cumulative is crossed at mean age **16.6** by 86 of 90 careers, i.e. it would shut the door
*earlier* than our rung does (17.3), and nothing below $30,000 behaves differently. On that evidence I
wrote that the money arm was dead.

**That refuted a SHAPE, not the arm** – and the shape was mine, not the sport's. Reality's rule was
never a lifetime total. As written it is **annual**, and it **forgives the cost of competing**:
$10,000 per calendar year, *plus* per-event amounts up to actual and necessary expenses above that
`[S]` (§1b). Measured that way on the same 90 careers (`college-fork-2026-08.md` §4f):

| rule | fires in | mean age | median age |
| --- | --- | --- | --- |
| **ours** – a won match at W75 or above | **86 / 90** | 17.3 | **17.1** |
| $10,000 in a season, bare | 83 / 90 | 17.4 | **17.0** |
| **$10,000 + that season's travel & entry – the cap AS WRITTEN** | **65 / 90** | 18.7 | **19.0** |

> ⭐ **THE SPORT'S OWN RULE IS FOUR TIMES MORE GENEROUS THAN OURS AND IT FIRES TWO YEARS LATER.**
> 25 careers of 90 keep the answer instead of 4, and the closure lands **at** the fork rather than two
> years before it. The mechanism is visible season by season: in her **16→17** season **56 of 90**
> careers clear a bare $10,000 but only **3** clear it net of what the travelling cost. The rule does
> not start biting until the **18→19** season (64/90) – **the season the decision is actually about.**

⚠ **AND IT STILL DOES NOT SORT.** It is more generous, not more discriminating: it keeps the door for
more careers without keeping it for the *right* ones, because at nineteen our cohort has no gap in it
(weakest third banks $114,260 against the strongest third's $155,865, and the weak band's p75 sits
**above** the top band's p25). **Generosity and discrimination are two different asks and the owner
should decide which one he is buying.**

⚠ **AND THE RULE IN FORCE TODAY IS MORE PERMISSIVE STILL.** Since the April 2026 settlement there is
**no pre-enrolment money limit at all** (§1b). Under that rule **90 of 90** careers keep the door, and
the only remaining gate is whether a roster place was offered – which our engine does not model.
**So "copy reality" is now a choice between two eras**, and the $10,000-plus-expenses rule is the more
useful one precisely because it is the one that still has a number in it.

### 5c. (b) THE RESULT ARM – #200 is the only defensible line, and it is already in the engine

Measured rank at nineteen (`college-fork-2026-08.md` §4c, n = 90): top third median **#151**, weakest
third **#205** – and the weakest third is **not worse than the middle third** (#211). The distributions
interleave here too. Sweeping candidate lines, the best separation in the whole sweep is at:

> **R = #200** – excludes the strong third almost perfectly (**1 of 30**), keeps the door for **15 of
> 30** of the weak third, opens it for **36%** of all careers, **47 points of separation**.
>
> ⭐ **And it is not a fitted number: `TIERS.wta250.acceptsRank` is already 200.** It is where our own
> ladder says the main tour starts admitting her. A rule that reads *"if the main tour would not take
> her, the college place is still there"* is one sentence, uses a constant that already exists, and is
> the only measured line that beats a coin flip.

⚠ **It is still not a clean cut** – it leaves half the weak band closed – and **the combo as a whole
does not beat the rung it replaces**: seven candidate `(M, R)` pairs all land at 6–8 careers open of
90, against the shipped rung's 7 (`college-fork-2026-08.md` §4e). **If the money arm is dropped, the
rank arm alone at #200 is the only part of the combo that does anything measurable.**

### 5d. (c) THE WARNING – the one part of the combo that is unambiguously right

This is the part I would build, and it needs no constant to move.

* **Where it goes.** On the **entry**, not the fork. Measured: **76% of closures are a W75**, at mean
  age **17.3**, and **92% of all closures land in the eleven months after her seventeenth birthday**
  (`college-fork-2026-08.md` §3). So one rung, one season, one sentence.
* **Which surface.** Two entry paths exist and both already carry a confirmation: `SeasonScreen`'s
  `ConfirmDialog`, and `CalendarScreen`'s marker card, which is documented as *its own* confirmation.
  The warning belongs on both, because a player who enters from the calendar would otherwise never see
  it.
* **Why before and not after.** `round-21.md` #8 shipped the explanation *at the fork* – a line on
  `ForkDialog` telling her why the third answer is missing. That was right and it is not enough: it
  explains a door that shut **two years earlier**, at 17.3, and the player could not have known at the
  time. `endings-and-the-album.md` names the same gap and leaves it to the owner: *"nothing at
  seventeen tells the player that a good week there spends something."*
* ⚠ **It must not recommend.** Ruling 4 (30.07): the card «may not recommend». The warning states a
  consequence – *entering this event can cost the college ending* – and stops. It is the same register
  as `TourBriefingDialog`, which explains a regulation and never advises.
* ⚠ **AND IT MUST BE MEASURED AGAINST A PHONE.** CLAUDE.md's round-20 #3 gotcha: any dialog we add or
  lengthen gets a mounted assertion that its dismiss control's box is inside a 375×667 viewport, proved
  by mutation. A warning added to `TourBriefingDialog`-adjacent copy is exactly the "one honest sentence
  at a time" growth that produced that rule.
* ⚠ **One design consequence of §1b, though.** If the comment's eligibility justification goes, the
  warning cannot say *"prize money at that level spends her college eligibility"* – that sentence is
  now factually wrong about the sport. It should say what is true in our world: *a real result here
  makes her a professional, and the college answer is for a girl who is not one yet.*

### 5e. What I would actually propose, in order

1. **Fix the comment, not the constant.** `ENDINGS.collegeClosedFromTier` should stop citing an
   eligibility rule the NCAA has repealed (§1b) and should cite the owner's own argument – *a girl who
   is already a professional does not go to college* – which needs no rulebook to stand up. **Zero
   balance risk, and it stops a false fact propagating**, which is the failure mode
   `acceptance-cuts-2026-08.md` was written about.
2. **Ship the warning (c).** The only part of the combo that is unambiguously right, it needs no
   constant, and the round-21 ledger and the endings spec have each asked for it once already.
3. **Keep the money arm (a) – but in the sport's shape, not a flat line.** `$10,000 per season, net of
   that season's travel and entry`, measured at **65/90 firing, median age 19.0** against our rung's
   **86/90 at 17.1** (§5b). ⚠ **This reverses what I wrote in the first draft of this document**, and
   the reversal came from measuring the rule as written rather than as I had paraphrased it.
4. **If a rank arm is wanted, #200** (§5c) – one existing constant, the best measured separation, and
   it is already `TIERS.wta250.acceptsRank`.
5. **Cost the age clock before any of the above is called finished.** Reality's newest rule (Bylaw
   12.6, §1b) starts a five-year college clock at **nineteen, whether or not she enrols** – the exact
   birthday our fork already uses. It models "the college door closing" as *time*, which is what it
   actually is, and it costs the grinding-junior strategy something real without ever mentioning money.
   **It is unmeasured here and it is the most promising unexplored option in this document.**
6. **And know that none of this makes college a DISCRIMINATING choice.** `college-fork-2026-08.md` §5:
   at nineteen our cohort has an interquartile range of **#151–#235** and **$103,803–$154,978**, nine
   careers in ten converge, and no line through a degenerate distribution can sort it. **The compression
   is the prior defect** – and item 12 of §4 is the check that would tell us whether the compression is
   in the ladder or in the prize tables.

---

## 6. FOR THE OWNER – four things, and only one of them is a balance decision

1. **The justification in the code is factually wrong and that is free to fix.** The NCAA permitted
   $10,000 a year **plus expenses** before enrolment, and since April 2026 permits prize money before
   enrolment **without any cap**. Our comment says taking prize money spends her eligibility. Correcting
   the *comment* changes no behaviour and removes a false fact from the codebase.
2. ⭐ **The money arm is worth having after all – in reality's shape.** A flat lifetime dollar line is
   dead (it fires at 16.6, earlier than our rung). **$10,000 a season net of the cost of competing** is
   not: 65 of 90 careers instead of 86, at median age **19.0** instead of 17.1. **The shape was carrying
   the result, not the number**, and my first draft of this document got that wrong.
3. **Reality's own answer to «допуск» is a roster and a clock, not a rule about money.** ~715 D-I places
   a year worldwide, most going to international players, the commitment made at **16–17**, and – since
   1 August 2026 – a **five-year eligibility clock that starts at nineteen whether she enrols or not**.
   That last one lands on our own fork birthday and **nobody has costed it**.
4. **The combo as approved does not beat the constant it replaces** – seven candidate pairs, 6–8 careers
   open of 90, against the rung's 7. Worth keeping: the **warning**, the **annual-net money rule**, and
   **#200** if a rank line is wanted.
5. **The highest-value unanswered question is not about college at all.** Our median career has banked
   **$129,190** in prize money by nineteen at rank **#183**. Whether a real nineteen-year-old at #183 has
   banked anything like that is unsourced (§4 item 12) – and if she has not, our prize tables are the
   defect that makes every threshold in this document unsizable.
