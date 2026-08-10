---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-10
---

# Retirement and withdrawal – what a stopped match is worth

Compiled 2026-08-10. Answers the five questions the dials wave has to settle before a builder can
model **a player who is hurt during a match and stops**. Primary sources throughout – the 2026 ITF
World Tennis Tour Regulations, the 2026 ITF World Tennis Tour Juniors Regulations, the 2026 WTA
Official Rulebook and the 2026 Official Grand Slam Rule Book, all read as PDFs and quoted by
regulation number. Every dated or secondary figure is flagged in §9. Nothing here changes game
logic; §10 is a recommendation for the owner and is labelled as such.

The game today has two states – she plays, or she never turned up. The rules have four, and they are
not the four the game's vocabulary suggests.

## 0. The headline

1. **A retirement pays the round she reached, everywhere that pays anything.** ITF W15–W100:
   a player who retires "shall receive the loser's prize money for the round in which she retired",
   and the loser's ranking points for the same round (2026 WTT Regs, Women's §XII.C.5.b). WTA: the
   same, reached through the withdrawal-after-the-first-match clauses (Rulebook §VIII.B.3.a.i(b),
   §IX.C.1.a.ii). **The round she got to is the entire answer. When inside the match she stopped is
   irrelevant** – there is no partial credit, no discount, no "she was two games from the set".
2. **A first-round retirement is not paid differently. It is *policed* differently.** No rulebook
   docks the points or the cheque for a main-draw first-round retirement. Two rulebooks punish
   *repetition* instead: the WTA fines a player for every main-draw first-round retirement "in
   excess of two (2) per Tour Year" (§IV.C.5.a), and the Grand Slam Referee may fine up to
   first-round prize money for failing a professional standard, listing "the player did not complete
   the match" among the factors (2026 GS Rule Book §G, First-Round Performance).
3. **Juniors are the exception, and it turns on a piece of paper.** No prize money exists at all
   (Juniors Reg 58). Points follow the round reached – but a junior who retires for medical reasons
   "without a valid medical certificate" **forfeits all ranking points won in all events at that
   tournament** (Juniors Reg 31 b). The certificate, not the injury, is the switch.
4. **The opponent gets a full, undiscounted win.** "A match won by retirement, default or walkover
   will count as a match won for ranking points and prize money" (WTT Regs, Women's §XII.C.1.b). The
   Grand Slam book says the same in different words: a match "is played when it is won as a result of
   any injury or a misconduct default" (§J.1). The result is *recorded* as RET, but nothing about the
   winner's entitlement is reduced.
5. **A walkover is not the same thing, and our current use of the word is the wrong one.** A walkover
   is something a player *receives*, never something she *does*. It is also worth less than a played
   win: an ITF first-round walkover pays prize money but **no ranking points** (Women's §XII.C.4.a).
   Our engine uses "walkover" for a player who was entered and could not turn up – the rules call
   that a **withdrawal** (or a **No Show** if she never told anyone).
6. **The consequences land next week, not this week.** WTA: after retiring she must be examined at
   the current tournament, carry the form to the following week's tournament and be examined there
   too; fail any step and she is **automatically withdrawn** from next week (§IV.C.1). ITF WTT: the
   on-site medical certificate is valid "in that week only" and explicitly cannot excuse a late
   withdrawal the following week (Code of Conduct §III.B.2). ITF Juniors is the *opposite* – a
   certificate obtained within 24 hours of retiring **does** excuse next week (Juniors CoC §III.B.2.b).
7. **There is a real intermediate state between playing and retiring.** One three-minute medical
   time-out per distinct treatable condition, plus treatment at changeovers and set breaks. So "she
   is hurt mid-match" has three outcomes in the real rules, not two: treated and continued, retired,
   or – rarely – retired *by the Supervisor* over her objection.
8. **How common: 2.73% of women's ITF World Tennis Tour matches ended in a retirement** – 7,291 of
   roughly 266,900 (PLOS ONE, June 2024; women's data 1994–2018). About one match in 37. Walkovers
   and defaults together were 0.47%, so **a retirement is roughly six times commoner than the state
   the game already models.** The rate *falls* as she climbs – ~1.7% on the WTA main tour, ~1.0% at a
   women's Slam. **This is a once-or-twice-a-season event, not a once-a-career one.**

## 1. The four words, exactly

This is where a simulation usually goes wrong, so the distinctions come first. All four are
recognised at all three levels; they differ in *when* they happen and *who* they describe.

**Only one of the four rulebooks actually defines them**, and it is worth saying which. The **WTA
Rulebook, Appendix M – Glossary** carries formal entries for all four. The ITF WTT Regulations' own
§II Definitions defines **only** Withdrawal, Late Withdrawal, Late Withdrawal Amnesty and Withdrawal
Deadline – Retirement, Walkover and Default are used operationally but never defined. The Juniors
Regulations have no glossary of these terms at all. **So the WTA glossary is the citable authority
for the vocabulary at every level**, and the ITF texts must be read for what they *do* with the words.

The WTA definitions, in short (Appendix M): a **Retirement** is when, after a match has started, "a
player does not finish the match because of illness or injury". A **Walkover** is when the match "did
not begin" because the losing player was ill or injured, or was barred by the Code of Conduct "before
first serve of match was struck" – and explicitly is not used when a Lucky Loser is substituted. A
**Withdrawal** is "the written communication by a player after her acceptance" that she will not
participate. A **Default** is when "the losing player is defaulted under the Code of Conduct after the
match has been called."

**The boundary is the first serve.** Before it: walkover for the opponent, withdrawal for her.
After it: retirement, or default if the cause is disciplinary.

| | When | Who it describes | Match started? | Typical code |
|---|---|---|---|---|
| **Withdrawal (WD)** | Before her match | The player pulling out | No | WD |
| **Walkover (W/O)** | Her opponent failed to appear or withdrew after the draw/order of play | **The player who advances** | No | W/O |
| **Retirement (RET)** | During the match | The player stopping | **Yes** | RET |
| **Default (DEF)** | Before or during | The player being thrown out | Either | DEF / Def |

Four consequences follow, and they are genuinely different:

- **Withdrawal** is a paperwork event with a deadline attached. Early enough, it is free. Late, it
  is a **Late Withdrawal** offence with a fine schedule that scales with *how late*; if she does not
  withdraw at all and simply fails to appear, it is a **No Show**, which is worse. The ITF fine
  guidelines put a women's main-draw late withdrawal at $125 rising to $500 for a fourth offence at
  W15/W35/W50, and $250 rising to $500 at W75/W100; a No Show runs to $500 at the lower tiers and
  $1,000 at W75/W100. Each player gets four **Late Withdrawal Amnesties** a year (WTT CoC §III.B.1)
  and, at WTA level, separate **Excused / Prize Money Withdrawal** allowances (WTA §IV.A.5–6).
- **Walkover** is the *beneficiary's* result. She advances without hitting a ball, and – this is the
  part simulations miss – at ITF and WTA level a first-round walkover is deliberately worth **less
  than a win**: prize money yes, ranking points no (ITF Women's §XII.C.4.a). The WTA phrases it as
  points "from the round preceding her/their elimination" (§VIII.B.3.c.i). Once she has played and
  won a match, a later walkover pays in full.
- **Retirement** is a *played* match that stopped. She keeps the round she reached. The tournament
  counts on her record. The opponent gets a full win.
- **Default** is a punishment, and it is the only one of the four that takes money and points *away*.
  "Any player who is defaulted shall lose all prize money, hospitality and points earned for that
  event at that Tournament" (ITF Women's §XII.C.2.a) – with a carve-out that matters here: **a
  default "as a result of a medical condition" does not trigger the forfeiture** (§XII.C.2.a.ii).
  The WTA restricts its forfeiture clause to "any disciplinary default" (§VIII.B.3.d, §IX.C.4).
  Defaults arise from the Point Penalty Schedule (a fourth code violation), from refusing an order,
  or from a Supervisor ruling a player unfit.

⚠ **Our engine's "walkover" is a withdrawal.** In `src/shared/protocol.ts` and `src/engine/world.ts`
the term is used for a career state where the kid was entered, an injury layoff covered the week, and
she never took the court – 0 points, entry fee forfeited, `finalizeTournament` never reached. In the
rulebooks that is a **withdrawal** (a late one, and a medically excused one). The word "walkover"
belongs to whoever was drawn against her. This is a naming bug, not a behaviour bug, and §10 says
what to do about it.

## 2. Ranking points on a retirement

### ITF World Tennis Tour, W15–W100 – primary, and unusually explicit

The 2026 WTT Regulations carry a dedicated section, Women's **§XII.C.5 Withdrawals and
Retirements**, and it separates the two cases deliberately.

**Main draw singles** (§XII.C.5.b.ii.1): if a player retires from a match, "she shall receive the
loser's points for the round in which she retired". The only listed exception is a Qualifier who has
played at least one qualifying match and retires in the first round of the main draw – she receives
Qualifier points.

**Qualifying** is harsher, and the asymmetry is instructive (§XII.C.5.a.ii): a player *withdrawing
or retiring in the first round of qualifying* receives no points **and the tournament does not count
on her record**. A retirement in a later qualifying round pays the round reached.

So the level's answer to "is a first-round retirement different?" is: **not in the main draw; yes in
qualifying, where it is worth nothing at all.**

⚠ Worth noting for balance: at the bottom rung, "points for the round reached" is frequently **zero
anyway**. The 2026 W15 (32-draw) row of WTT Appendix K pays 15/10/6/3/1 for W/F/SF/QF/R16 and nothing
below – a first-round loss at a W15 is 0 points whether she was beaten or retired. The rule and the
outcome coincide at the tier our kid starts on.

### WTA – the answer is real but it is assembled from two rules

The WTA Rulebook has **no heading called "Retirements" in either its ranking section (§VIII) or its
prize money section (§IX)**. It handles retirement as a withdrawal that happened after the match
started:

- §VIII.B.3.a.i(b): a player who withdraws "after the start of her first match" receives ranking
  points for reaching the round in which she withdrew (Qualifier exception as above).
- §VIII.B.3.b.i, on byes, gives the game away by naming it: a player who "loses (or retires from)"
  her first match played receives first-round losers' points.
- §IV.B.b.ii requires a retiring player to **submit a WTA Withdrawal Form** – the rulebook's own
  paperwork treats a retirement as a species of withdrawal.

**Judgement, flagged as ours**: the three read together settle it – a WTA retirement pays the round
reached. But the reader should know this is an inference across three clauses rather than one stated
sentence, and that the ITF text is the one that says it in so many words.

### ITF Juniors – points for the round, and a forfeiture clause with real teeth

Juniors **Reg 31 a) i)** governs allocation: no points until a player "has played and won a round in
the Main Draw", and advancement by walkover or "by retirement following the commencement of a match"
is equivalent to winning a round. Because a first-round loss pays nothing on the junior table
anyway, a first-round junior retirement is worth **zero, structurally** – there is no clause needed.

**Reg 31 b) is the clause that matters**, and it has no analogue on the pro tours:

> a player who "retires from a tournament for medical reasons without a valid medical certificate"
> will forfeit all ranking points won in all events at that tournament

That is total, retrospective, and cross-event – singles points won earlier that week and doubles
points both go. The same text is repeated in the Juniors Code of Conduct §P (Leaving the Tournament),
which adds Suspension Points on top. **At junior level the medical certificate is the mechanic.**

## 3. Prize money on a retirement

Confirmed at all three levels: **prize money is paid by round reached, and a retirement does not
forfeit it.**

- **ITF W15–W100** (Women's §XII.C.5.b.i.1): "If a player retires from a match, she shall receive the
  loser's prize money for the round in which she retired." No exception, no percentage haircut. The
  same section's *withdrawal* rules are much stingier – a directly-accepted main-draw player who
  withdraws in the first round "will receive no prize money, and the Tournament shall not count on
  their record" (§XII.C.5.b.i.2.d), and a withdrawal from a semi-final or final is docked 50% of the
  step-up (§XII.C.5.b.i.2.e). **Retiring pays better than withdrawing, and that is deliberate: the
  tour wants her to start the match.**
- **WTA** (§IX.C.1.a.ii): a player who withdraws after starting her first match "will receive prize
  money for reaching the round in which she withdrew". Before her first match: nothing, unless she
  uses a **Prize Money Withdrawal** – no more than twice a Tour Year, on site, before her first match,
  which pays main-draw first-round prize money and no ranking points (§IV.A.6, §IX.C.1.a.i(b)).
- **ITF Juniors**: not applicable. Reg 58 – no prize money in any form is paid at a juniors
  tournament, to players or to their national associations. Gifts to a winner are capped at $750
  (Reg 59).
- **Grand Slams**, as the comparator that shows the boundary: "Prize money shall be paid only for
  matches played" (§J.1), with a codified 50% consolation for an **on-site withdrawal** before the
  first match – conditional on being declared unfit by the Tournament Doctor, on having competed in
  the previous 21 days, and capped at two Slams a year. The same section grants the Referee authority
  to **withhold prize money in whole or in part** "if a player retires or withdraws for any reason".

⚠ That last clause is the one honest caveat on the whole of §3: the Grand Slam Referee has a
discretionary power to withhold. It is discretion, not a tariff, and no equivalent standing power
appears in the ITF or WTA texts – their forfeitures are tied to *defaults*, not retirements.

## 4. What the opponent gets

**A full win, at every level, with no discount.** The advancing player receives the ranking points
and prize money of the round she has reached:

- ITF Women's §XII.C.1.b: "A match won by retirement, default or walkover will count as a match won
  for ranking points and prize money", subject to two exceptions that are both about *walkovers*, not
  retirements – no points for a first-round walkover, and none where the player has not won a match
  in a previous round.
- WTA §VIII.B.3.d.i / §IX.C.4.a: the advancing player receives points and prize for the round
  reached (stated for defaults; walkovers are §VIII.B.3.c and §IX.C.3, which pays "prize money for
  the round reached" in any round).
- Juniors Reg 31 a) i): advancement "by retirement following the commencement of a match" is
  equivalent to winning a round.
- Grand Slam §J.1: a match "is played when it is won as a result of any injury or a misconduct
  default of an opponent".

**Is it recorded differently?** As a notation, and – in the one place a rulebook addresses records at
all – as a slightly lossy one. The result is published as a score with "ret." appended, the match
counts on both players' records, and the tournament counts as played.

The single primary statement found on how a retirement is *scored into a record* is the WTA's
**Appendix L, United Cup**, in its tie-break procedures: defaulted and retired matches "are scored as
completed for purposes of matches played" and count as a straight-set win or loss, "however, games won
or lost" in such a match are not counted toward percentage of games won. ⚠ That is scope-limited to
one team event's standings arithmetic and must not be generalised – but it is the shape of the answer
the rest of the sport applies informally: **the match counts, the scoreline does not.**

⚠ **One place where the rules do discount an unplayed win**, and it is the walkover, not the
retirement: the WTT regulations exclude walkovers from the **System of Merit** wild-card calculation
("wins by retirement or default (after the match has started) count as wins, but byes and walkovers
do not", §VI.B). That is a direct statement that the tours regard a retirement win as a *real* win
and a walkover as not one.

⚠ **Not found**: outside that United Cup clause, no rulebook consulted states a policy on head-to-head
*records* as such. Head-to-head tables are a media and data-provider artefact, not a regulated object.
Treat any claim about how RET matches appear in a head-to-head as convention, not rule.

## 5. What happens next – the after-effects

This is where the three levels genuinely diverge, and the divergence is the finding.

### WTA – the strictest, and it is a gate rather than a fine

**§IV.B, Retirements.** A retiring player must call for the PHCP (Primary Health Care Provider) and
the Supervisor *before* retiring to give the reason; then immediately afterwards meet the on-site
PHCP and Tournament Physician for an evaluation, complete a **WTA Medical Information Form** before
leaving the tournament city, submit a WTA Withdrawal Form, and provide a quotation for the media.

**§IV.C.1, The Following Week's Tournament.** If she is forced to retire for a medical condition and
is entered the following week, she must be examined at the current tournament, submit that
examination at the following week's tournament, **and be examined again there**. She is
**automatically withdrawn** from next week if she retired "without cause or for unprofessional
reasons", if she fails to produce the signed form, if she fails the second examination, or if her
next match this week clashes with her first match next week. Contravening the rule costs her the
following week's ranking points plus a fine.

**§IV.C.5.a, Unsportsmanlike Conduct.** "for each Main Draw first round retirement (singles and/or
doubles) **in excess of two (2) per Tour Year**", a fine under the Unsportsmanlike Conduct section.
**This is the one rule that makes a first-round retirement different from any other, and it is a
counter, not a per-event penalty.** The first two of the year are free. ⚠ The clause names no figure;
the Unsportsmanlike Conduct line of the fines table (Appendix I) reads **"up to $10,000"**, so the
ceiling is one inference hop away rather than stated in §IV.C.5.a itself.

**§XVII.D.4.a.xi, Failure to Complete Match.** The WTA's own version of the ITF's FCM offence: a
player "must complete a match in progress unless she is reasonably unable to do so", carrying a fine
of up to $5,000, **immediate default**, and treatment as a Major Offense of Aggravated Behavior. As at
ITF level, the "reasonably unable" clause is what makes a genuine injury retirement not an offence –
**this is the rule that separates retiring from quitting**, and it is the only route by which stopping
mid-match can cost her the money and points she had already earned.

**§IV.A.7, Consecutive Withdrawals** – opt-in, and the most interesting rule in this document for
game purposes. A player who withdraws for a medical condition may withdraw from the *next*
tournaments she has entered without spending allowances or paying late-withdrawal fines. The price:
during a Consecutive Withdrawal she "cannot play any WTA Tournament, Grand Slam Tournament, ITF World
Tennis Tour event (including Juniors, 15s+ …), Olympic … or Exhibition/Non-WTA Event" – a genuine
self-imposed lockout, in exchange for the penalties being waived. Off-site, it also requires a
physician's evaluation and a full Medical Information Form with clinical records within 10 days.

### ITF World Tennis Tour – a fine schedule and a certificate with a one-week shelf life

**Code of Conduct §IV.O, Failure to Complete Match or Tournament (FCM).** "A player must complete a
match in progress, and complete the Tournament, unless he/she is reasonably unable to do so."
Fine up to $750; the fines guidelines put main-draw FCM at **$500–750** and qualifying at $100.
⚠ **The "reasonably unable" clause is doing all the work** – a genuine injury retirement is not an
FCM offence. FCM is the charge for walking off, not for being hurt.

**Code of Conduct §III.B.2, On-site Medical Withdrawal.** A player who retires on site for medical
reasons must obtain an on-site medical certificate from the Tournament Doctor or Sports
Physiotherapist. And then the sentence that decides the next-week question: the certificate is valid
for that tournament **"in that week only"** and "cannot be used to cancel a Late Withdrawal from a
tournament in the following week". So retiring this week does **not** excuse pulling out of next
week's event – she pays a Late Withdrawal offence or burns one of her four annual **Late Withdrawal
Amnesties** (four per year, each covering up to four consecutive weeks, capped at nine weeks total).

**One tournament per week** is enforced at all levels; a committed player must play the tournament to
completion or elimination.

### ITF Juniors – the most protective of the three

**Reg 41.** A junior who "is a no show or who withdraws or retires from either singles or doubles main
draw in any round may not participate in singles or doubles in any other tournament during the same
week", on pain of default and forfeiture of that tournament's points. A hard, immediate lockout for
the remainder of the week – no equivalent exists at pro level in this form.

**Juniors Code of Conduct §III.B.2.b–c.** The junior version of the medical certificate is the
*mirror image* of the adult one. A player who sustains a medical condition during the tournament week
may obtain a certificate **within 24 hours of completing her final match or of retiring from a match**,
and that certificate excuses withdrawal from **the following week's** tournament without penalty –
indeed §III.B.2.c extends the excuse to "any subsequent tournament until the player next competes in
any tennis event", provided each withdrawal is filed through IPIN before the sign-in deadline. Notice
requirements: inform the ITF and next week's Supervisor within 48 hours, or before qualifying sign-in,
whichever is earliest.

**Reg 31 b / CoC §P**: no certificate, and she loses every point she won that week – **and it is not
only the points.** "Leaving the Tournament" is worth **5 suspension points** on the Juniors
**Suspension Points** ladder (CoC §X), and **ten suspension points inside a rolling 52-week period is
a four-week suspension** from all ITF juniors events, with entries in that window cancelled. The rest
of the ladder, for scale:

| Offence | Suspension points |
|---|---|
| Late withdrawal, 13–7 days before Monday of main-draw week | 1 |
| Late withdrawal, 7 days before to Freeze Deadline | 2 |
| Late withdrawal, Freeze Deadline to Qualifying Sign-in | 3 |
| Late withdrawal, after Sign-in and before first match | 4 |
| **Leaving the Tournament** (incl. retiring with no certificate) | **5** |
| No Show / failure to withdraw | 6 |
| Immediate Default for a single Code violation | 6 |
| Default for punctuality | 4 |

So the junior consequence of a certificate-less retirement is: every point from that tournament gone,
plus half the distance to a four-week ban. **This is by a wide margin the harshest treatment of a
retirement anywhere in the four rulebooks, and it lands on the under-18s.** The counterweight is that
with the certificate – which a genuinely injured player will get – none of it fires.

### The doctor can end it without her

At all three levels the same structure exists: if a player is considered physically unable to compete,
the medical staff recommend and the **Supervisor/Referee decides** whether to "retire the player from
the match in progress" (WTA §XVIII.B.6, Physical Incapacity; Juniors Appendix on medical procedures;
GS §W.3.h). All three add that she may afterwards play another event *at the same tournament* if the
doctor clears her – so a singles retirement does not automatically end her doubles.

The WTA also codifies the money side of an involuntary retirement (§VIII.B.3.e, §IX.C.5): withdrawn
under the Physical Incapacity Rule **after** her first match starts, she receives points and prize per
the round from which she was withdrawn – i.e. exactly as if she had retired herself. Withdrawn
*before* her first match, she receives first-round prize money under the Prize Money Withdrawal rules
**and it does not count against her allowance** – the one place in any rulebook where being ruled unfit
is strictly better than pulling out voluntarily.

## 6. Medical time-outs – the intermediate state is real

The rules do let a player be treated and continue, and they are specific about it. The three texts are
near-identical; ITF WTT §VI.A.3.c, WTA §XVIII.B.6.c, GS §W.3.c–d.

- **One medical time-out per distinct treatable medical condition**, limited to **three minutes of
  treatment**, taken at a changeover or set break unless the condition is acute and needs immediate
  attention. ⚠ WTA words the allowance as "one (1) MTO **per match** for each distinct treatable
  medical condition"; ITF and Grand Slam omit "per match".
- ⚠ **At W15, W35, M15 and M25 only, "the Supervisor may extend the time allowed for treatment if
  necessary"** (WTT Regs). The bottom rung of the pro ladder – exactly where our kid starts – has a
  softer clock than everywhere above it, because those events often have no physiotherapist at all.
- **Additional treatment at changeovers and set breaks** is allowed beyond the MTO – as a guideline
  two changeovers per condition, before or after the MTO, not necessarily consecutive.
- **Two consecutive MTOs** may be granted when the player has developed two distinct acute treatable
  conditions at once.
- **What counts as one condition**: all clinical manifestations of heat illness = one; all treatable
  musculoskeletal injuries "that manifest as part of a kinetic chain continuum" = one. This is the
  anti-farming clause – a player cannot buy a second three minutes by renaming the same injury.
- **Cramping is not treatable by MTO.** Treatment only at changeovers/set breaks, maximum two in a
  match; a player who stops play claiming an acute condition and is found to be cramping is ordered
  to resume immediately, and may concede points/games to reach a changeover to get treatment.
- **Non-treatable** conditions get nothing: anything that cannot be improved in the time available,
  anything that did not develop or worsen during the warm-up or match, and **general player fatigue**.
- Delay after treatment is punished under Delay of Game; abuse of the rule under Unsportsmanlike
  Conduct.

**Design consequence, stated plainly**: the honest model of "she is hurt mid-match" has an
intermediate state. She is hurt, she is treated for three minutes, and then she either continues
(usually at reduced effectiveness) or retires. The rules also decide *when* she may be treated – at a
changeover, not at the moment of injury – which is a real source of drama that costs nothing to model
if the match engine already knows about changeovers.

## 7. How common is it, really

**Primary quantitative source, flagged as a secondary source about the game world rather than a rule:**
Palau, Baiget, Cortés, Martínez, Crespo & Casals, *Retirements of professional tennis players in
second- and third-tier tournaments on the ATP and WTA tours*, **PLOS ONE, 3 June 2024**
(doi:10.1371/journal.pone.0304638). Open access; figures below read from the paper's Results and
Tables 5–7.

The study's population is **exactly our game's ladder** – the tiers *below* the main tour.

| | Matches | Retirements | Share |
|---|---|---|---|
| **ITF Women's World Tennis Tour + WTA 125** (1994–2018) | 267,380 | 7,306 | **2.73%** |
| – of which ITF Women's World Tennis Tour alone | ~266,900 (99.81% of rows) | 7,291 | **2.73%** |
| – of which WTA 125 | ~510 | 15 | 2.94% |
| ATP Challenger + ITF Men's (1978–2019), for comparison | 584,806 | 19,314 | **3.30%** |
| – ITF Men's alone | – | – | 3.44% |
| – ATP Challenger alone | – | – | 2.94% |

Other figures from the same study, women's database:

- Incidence rate **1.36 retirements per 1000 games played** (95% CI 1.33–1.39); men 1.56.
- **Walkovers and defaults combined were 1,251 rows, 0.47%** of all women's matches – so on this
  ladder a retirement is roughly **six times more common than a walkover or default**.
- By surface: hard 2.78%, clay 2.75%, carpet 2.38%, **grass 2.21%** – a real but modest spread.
- By round: preliminary rounds 2.65%, final rounds 3.00%. ⚠ The 4.35% "qualifying round" figure is
  2 retirements in 46 matches and must not be used.
- Median age of a retiring player: **21.00** vs 20.67 for completed matches – i.e. **age barely
  predicts it** on this circuit.

**The rate falls as she climbs, and that is a design gift.** The same author group published a
companion paper on the *top* tier – Oliver et al., *Retirements of professional tennis players in ATP
and WTA tour events*, European Journal of Sport Science 24(10), 2024, doi:10.1002/ejsc.12177 – which
reports **WTA main tour at 1.73%** (801 of 46,268 matches, 1975–2019) against ATP's 2.11%, and women's
Grand Slam matches at **1.01%**, the lowest subgroup measured anywhere. ⚠ **Flagged harder than the
PLOS figures**: this paper is paywalled, was not read at source, and its numbers here are taken from
two independent secondary summaries that agreed. Treat the *direction* as solid and the decimals as
provisional.

So the honest gradient across our ladder is roughly **2.7% at ITF, 1.7% on the WTA main tour, 1.0% at
a Slam**. A retirement is a **bottom-of-the-ladder** event – which is exactly the right shape for a
career sim, because it makes the grind rungs feel more precarious than the ones she is climbing
towards without any special pleading.

**Read for design**: 2.73% of matches at the tier she starts on. A player contesting 20 matches a
season retires from one about every other season; one contesting 50 does it roughly once every 15
months. It is a **once-or-twice-a-season-ish event at a full schedule**, not a career-defining rarity
– and it is emphatically more common than the walkover the game already models.

⚠ **Flags on this number.** (a) The women's window is 1994–2018 and the men's 1978–2019; the paper's
own trend figures show the rate *rising* over time, so a 2026 figure is probably higher than the
pooled mean. (b) It counts matches "that started but did not finish for any reason" – illness,
injury and anything else are pooled. (c) Junior retirement rates were **not found** in any primary or
peer-reviewed source; do not assume the ITF-women figure transfers to under-18s, in either direction.

Secondary corroboration, flagged: `docs/research/injury-stats-by-age.md` (owner digest, 25.07.2026)
carries "4.8% of matches unfinished in 2025 vs 3.3% in 2023". That figure's tour and population are
not recorded there, it is roughly double the PLOS women's rate, and it should not be used for balance
until re-sourced. The two are reconcilable if it refers to men's main tour or to "unfinished" in a
wider sense than retirement.

## 8. Juniors specifically – the protective rules an adult tour does not have

Collected because an under-18 circuit was expected to differ, and it does.

1. **No prize money at all** (Reg 58). Retirement cannot cost her money because there is none.
2. **The medical certificate is load-bearing** (Reg 31 b) – no certificate, all points from that
   tournament forfeited, plus 5 suspension points under CoC §P/§X. See §5 for the ladder.
3. **The same-week lockout** (Reg 41): retire from a main draw in any round and she may not play
   singles or doubles in any other tournament that week.
4. **A junior walkover pays points; a pro walkover does not.** Reg 31 a) i) makes advancement "by
   virtue of walkover" equivalent to winning a round, full stop – whereas ITF W15–W100 and the WTA
   both dock ranking points for a first-round walkover. ⚠ This is a real inversion between the levels
   our game spans, and it goes the *opposite* way to the general pattern that juniors are treated more
   protectively. (One junior counterweight: Reg 57 excludes matches in which a player conceded a
   walkover from the round-robin standings calculation.)
5. **A next-week excuse exists and is generous** (CoC §III.B.2.b–c), unlike the ITF pro tour: a
   certificate taken within 24 hours of retiring excuses withdrawal from the following week's event,
   and onward until she next competes.
6. **The Age Eligibility Rule caps how much she may play at all** (Juniors Appendix F). Tournaments
   permitted per year, counted birthday-to-birthday, not by calendar year:

   | Age | Junior tournaments permitted |
   |---|---|
   | 11–12 | 0 (under 13 not eligible for entry) |
   | 13 | 10 (+4 if top-50 ITF junior ranking) |
   | 14 | 14 (+4 if top-20) |
   | 15 | 18 (+4 if top-20) |
   | 16 | 25 |
   | 17–18 | unrestricted |

   These are **in addition** to the professional-tournament allowance under the separate AER in the
   WTT and WTA regulations. ⚠ This table is a hard external constraint on any junior schedule the game
   generates, retirement or no retirement – our 14-year-old is capped at 14 junior events a year.
7. **Lucky Loser status survives a qualifying retirement** (Juniors, LL section): a junior forced to
   retire from the final round of qualifying "due to illness or injury" keeps her Lucky Loser status,
   provided she is cleared by the Tournament Doctor or Sports Physiotherapist.
8. **Doubles that week**: the same-week rule bars *other tournaments*, but the medical procedures
   appendix allows the Supervisor to let her play another event at the *same* tournament if the doctor
   clears her – the regulation's own example is "(e.g. doubles)".
9. **Heat has hard numeric thresholds** (Juniors Appendix D, Extreme Weather): *Modification of Play*
   at WBGT ≥30.1 °C, which permits a 10-minute break between the second and third sets; *Suspension of
   Play* at WBGT ≥32.2 °C, which stops play outright. A protection with no adult-tour equivalent in
   this form, and a plausible future hook if the game ever models conditions.
10. **The lowest junior grades play shorter matches** (Reg 35): J30/J60 round-robin matches and all
   qualifying matches are two tie-break sets plus a 10-point match tie-break rather than a third set.
   ⚠ Grade-based, not age-based – the link to age is practical, not textual. Relevant here only
   because a shorter match is less exposure per event.

## 9. Data-quality flags

- **Solid and primary**: the 2026 ITF World Tennis Tour Regulations (published 12 Dec 2025), the 2026
  ITF World Tennis Tour Juniors Regulations (published 5 Dec 2025), the 2026 WTA Official Rulebook
  (the 22 Dec 2025 printing) and the 2026 Official Grand Slam Rule Book – all downloaded as PDFs from
  `itftennis.com` and read as extracted text, not summarised from search results. Every §/Reg number
  above was read in situ, and independently re-derived by three parallel searches whose findings agreed
  with this reading on every point.
- ⚠ **A later WTA printing exists**: the rulebook linked live from `wtatennis.com/wta-rules` is dated
  **26 June 2026**. It was diffed against the December printing cited here – **the retirement,
  withdrawal, ranking-points, prize-money and medical rules are identical**; the only changes were two
  unrelated doubles-scheduling clauses. Cite either; re-check before external publication.
- ⚠ **The ITF Rules of Tennis itself was not retrieved.** The ITF governance page is behind bot
  protection and no working direct PDF link was found. The Rules of Tennis govern play (scoring,
  service, court) rather than tournament administration, so the points/money/penalty answers above are
  not expected to live there – but this document does not verify that claim by reading it.
- ⚠ **Section numbering in the WTT and Juniors PDFs is by article letter within a section, and the
  women's and men's halves of the WTT document repeat the same letters.** All WTT citations above are
  from the **Women's** half. A reader checking them must not land in the men's half, where a handful
  of clauses differ (e.g. Late Withdrawal fine bands).
- ⚠ **The WTA answer on retirement points and prize is an inference, not a quotation.** The rulebook
  has no "Retirements" heading in §VIII or §IX; §IV.B requires a Withdrawal Form from a retiring
  player, and §VIII.B.3.b.i names retirement inside the byes clause. The reading is confident but it
  is assembled. The ITF text is the one that states it outright.
- ⚠ **The Grand Slam Referee's discretionary power to withhold prize money "in whole or in part" if a
  player retires** (§J.1) is a live exception to §3's clean answer. It is Slam-level only and
  discretionary. No standing equivalent found at ITF or WTA level.
- ⚠ **Not found publicly, after searching the four rulebooks**: (a) any general rule fixing how a
  retirement is displayed in a head-to-head record – only the scope-limited United Cup clause in §4;
  (b) **any fixed "banned for N days" rule after an injury retirement** – this was searched for
  explicitly at all three levels and does not exist. The real mechanisms are week-based and
  clearance-based, never a day count. The nearest numeric thresholds are eligibility gates for a
  *benefit*, not bans: a WTA Special Ranking needs 26 weeks unable to compete, and the WTA glossary's
  "Long-Term Injury" is 8+ consecutive weeks; (c) any published junior retirement *rate*; (d) any
  standalone WTA "retirement fine" table – §IV.C.5.a routes to the Unsportsmanlike Conduct schedule
  (up to $10,000), which is one inference hop rather than a stated figure.
- **The retirement rate is a 2024 study over 1994–2018 women's data**, with a rising trend inside the
  window. Treat 2.73% as a floor for a 2026-set game, not a point estimate.
- **The `injury-stats-by-age.md` "4.8% unfinished" figure is unsourced in that document** and is
  roughly double the PLOS women's figure. Flagged, not used.
- **Grand Slam material is included as a comparator only.** Our ladder tops out at WTA level in the
  current design; the Slam first-round-performance fine and the 50% on-site withdrawal rule are quoted
  because they show where the tours draw the line, not because they govern our tiers.

## 10. ⚠ MY RECOMMENDATION – this section is a proposal, not a finding

Everything above is what the rulebooks say. Everything below is what I think we should do, and it is
the architect's and the owner's call, not the research's. I have split it deliberately into **what the
rules settle** (where we would have to have a reason to deviate) and **what is genuinely our design
choice** (where the rules are silent, or offer a menu). Conflating those two is the failure this
document exists to prevent.

### 10.1 The five questions, answered for our game

**Q1 – Ranking points. THE RULES SETTLE THIS.** Pay the points for the round reached, identically to
a loss in that round. In engine terms this is almost free: `finalizeTournament` already derives
`points` from `tier.points[kidFinish]`, so a retirement is *a normal finish index plus a flag*. Do not
invent partial credit. Do not zero it.
⚠ One deviation worth making consciously: the real rules zero a **first-round qualifying** retirement
and do not count the tournament. We have no qualifying draws, so this clause has nothing to attach to
– ignore it rather than simulating a qualifying ladder for its sake.

**Q2 – Prize money. THE RULES SETTLE THIS.** Pay the round reached, in full. Same commit point as the
points, off the same finish index – which is exactly the invariant the comment above `prizeCentsFor`
in `world.ts` already asserts ("a result cannot award one without the other"). A retirement should
reach `finalizeTournament`; that is the whole implementation.
**Design consequence the owner should see coming**: a retirement will therefore *pay*, where the
current walkover pays nothing. That is correct and it is also a small buff to the family's finances –
it is the difference between "she never turned up" and "she showed up and got hurt", and the real tour
prices exactly that difference.

**Q3 – The opponent. THE RULES SETTLE THIS.** Full points, full prize, counted as a win, counted in
the record. Since our engine simulates the field via `p.result.matches`, the correct model is: the
opponent's win is an ordinary win in every respect. **Do not build a discounted "win by retirement".**

**Q4 – What it is called. THE RULES SETTLE THE VOCABULARY; WHAT WE EXPOSE IS OURS.** The four words
are not interchangeable and our current use of "walkover" is wrong. My recommendation:

| Situation in our game | Correct term | Today |
|---|---|---|
| Entered, injury layoff covers the week, never took the court | **Withdrawal** (medical) | called "walkover" |
| Took the court, stopped mid-match | **Retirement** | does not exist |
| Her opponent failed to appear | **Walkover** (she receives one) | not modelled |
| Thrown out for conduct | **Default** | not modelled, and correctly so |

Renaming the existing state is a one-word change in copy plus a `WorldEvent` type rename, and it
touches a save-schema string – so it is a v-bump with an append-only migration, not a free edit
(`docs/specs/season-life-03-injuries.md` C5 and the `'walkover'` member of the protocol union). ⚠ **My
honest read: rename the player-facing copy now, and leave the internal identifier alone.** The engine
string is not visible to the player, a schema bump to fix a noun is a poor trade, and a comment at the
union member saying "historically named 'walkover'; the rules call this a medical withdrawal" costs
nothing and prevents the next reader repeating the confusion.

**Q5 – What happens next. THE RULES OFFER A MENU; PICKING FROM IT IS OURS.** Three real mechanics
exist and they are not equally worth building:

1. **The next-week gate (WTA §IV.C.1)** – she must be cleared before playing the following week.
   ⭐ **Recommended.** This is the one that fits the game we already have: the engine has a doctor
   (`arrivalStatus`, the "medical" stop), a layoff window and a weekly tick. A retirement that sets a
   one-week clearance requirement is a *decision the parent faces next week*, which is the shape of
   every good beat in this game. It is also nearly free – it reuses the existing medical stop.
2. **The repeat-offence fine (WTA §IV.C.5.a, third first-round retirement of the year)**
   – **recommended as a stretch, not as core.** It is a lovely rule and it is genuinely punitive of a
   degenerate strategy (enter everything, retire when losing). But it only bites a player who retires
   three times in a year in the first round, which at our event counts will approximately never
   happen unless the injury model is far more aggressive than 2.73%. **Build it only if the balance
   bench shows first-round retirements clustering.**
3. **The certificate (ITF Juniors Reg 31 b / CoC §III.B.2.b)** – ⚠ **recommended against, despite
   being the most faithful.** At junior level this is the whole mechanic, and it is also a paperwork
   sub-game: obtain the certificate within 24 hours, file through IPIN before a deadline, notify two
   parties within 48 hours. **Modelled honestly it is dull, and modelled as a coin-flip it is a lie.**
   Worse, its consequence does not stand alone: the penalty for missing it is 5 **suspension points**,
   which only mean anything if the 52-week, ten-point suspension ladder is modelled too – so the
   faithful version is not one feature but three. If the owner wants the flavour, the cheap version is
   that the tournament doctor's clearance *always* arrives when she retires with a real injury (which
   is the realistic case), and the forfeiture clause simply never fires – i.e. write the rule into the
   doc and not into the engine.

### 10.2 What the rules do NOT settle – the owner's genuine choices

- **How often it happens.** 2.73% is the real-world rate on our exact ladder, but it is a rate *per
  match*, and our engine resolves a tournament as a week with a finish index rather than as a
  sequence of independently-hazarded matches. Converting 2.73%/match into a per-event or per-week
  probability is a modelling decision with no right answer in the rulebooks. **Naming the number the
  design targets is the owner's call**; the research's contribution is that the honest anchor is
  ~2.7% of *matches* at the ITF rungs, and that a career of ~20 matches a season should see roughly
  one retirement every other season.
- **Whether the rate should fall as she climbs.** The data says it does – 2.7% at ITF, ~1.7% on the
  WTA main tour. Whether to spend a tier-scaled parameter on that, or to run one flat rate and accept
  a slightly too-fragile top tier, is a balance decision. The flat version is cheaper and the
  difference is under one percentage point.
- **Whether a retirement is a distinct injury event or a consequence of the existing one.** The
  rules say nothing. Our engine already has `rollInjury` producing a layoff; the cheapest coherent
  model is that a retirement *is* an injury onset that happened to land during a played week, and the
  layoff that follows is the ordinary one. Nothing in the rules argues against that.
- **Whether the medical time-out becomes a mechanic.** The rules confirm the intermediate state
  exists, and confirm its shape (one MTO per condition, three minutes, at a changeover, cramping and
  fatigue excluded). Whether the game *surfaces* it is entirely a design question. My view, offered as
  opinion: **it is the better feature of the two.** A retirement is a week's outcome the parent cannot
  influence; a medical time-out is a moment where something can be decided or at least watched, and
  the match visualiser is the game's stated USP. But it is a match-engine feature, not a season
  feature, and it should not be smuggled into the dials wave.
- **Whether the parent gets a choice.** The real rules put the decision partly outside the player –
  the Supervisor can retire her over her objection (§XVIII.B.6, Physical Incapacity). That is a
  licence for the game to *take the decision away* in some fraction of cases without being unfaithful,
  which is a useful design permission and is nowhere near a requirement.

### 10.3 Where the honest rule would be expensive or dull

Recorded so the owner learns it now rather than mid-build.

- **The certificate sub-game is dull.** See 10.1 Q5.3. Faithful, cheap to describe, tedious to play.
- **Qualifying draws are expensive and we do not have them.** Several of the sharpest real clauses –
  the zeroed first-round qualifying retirement, Qualifier points, Lucky Loser status surviving a
  retirement – are unreachable without modelling qualifying. **Not worth building a qualifying draw to
  earn the right to a retirement clause.** Skip them and say so in the spec.
- **The doubles half of every rule is roughly half the text and none of the value.** ITF §XII.C.5.c
  and the WTA equivalents run to a page of who-caused-the-withdrawal logic. We do not model doubles.
  Do not port it.
- **The walkover rule is more interesting than the retirement rule and we do not model it.** The real
  asymmetry – a first-round walkover pays money but no points – is a genuinely elegant rule that
  exists to stop a player banking a ranking on absent opponents. It only becomes available to us if the
  field can withdraw, which today it cannot. **Flagging it as a future rung rather than scope for
  this wave.**
- **A retirement that pays is a behaviour change to a state that currently pays nothing.** The engine
  currently guarantees "a skipped event, a walkover or a medical withdrawal never reaches finalize"
  and several comments in `world.ts` and `protocol.ts` lean on that as an invariant (the appearance-fee
  and first-prize-milestone comments both cite it). A retirement *must* reach finalize. **That
  invariant has to be restated, not quietly broken** – it is exactly the kind of load-bearing comment
  the codebase asks to be preserved, and a builder who adds a fourth arrival status without revisiting
  those three comments will leave them lying.
