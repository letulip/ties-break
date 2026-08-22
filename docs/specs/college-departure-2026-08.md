---
type: spec
status: current
area: engine/college
canonical: false
last-reviewed: 2026-08-22
---

# The College Departure – ask when school ends, hold the place, leave in September (22.08.2026)

**Round 24, wave 3 / D2, on `wave/round24`.** The owner, round 24 #5:

> «В колледж она пошла ровно в день своего рождения, а должна была в начале учебного года»

ruled in as a DESIGN CHANGE («пункт 5 запускай как обсудили», docs/plans/college-the-flow.md,
rulings §3): **the fork is asked after school ends, the place is RESERVED, she keeps playing, and
she departs when the academic year starts** – and **B1's entry release moves with her**, from the
answer to the departure.

⚠ This spec does not restate the freeze (`college-as-a-second-act-2026-08.md`), the quotes
(`the-college-choice-2026-08.md`), the League (`the-college-league-2026-08.md`) or the birthday
pause. It records the three moments, their derivations, and the measurements.

---

## 1. THE THREE MOMENTS, AND WHERE EACH ANCHORS

| moment | week | age | code |
| --- | --- | --- | --- |
| **ASK** | `schoolEndWeek(birthMonth)` – 242 (Jan–Aug births) / 294 (Sep–Dec), season offset 34 | 18.00–18.92 | `forkDue` (engine/ending.ts) reads `schoolIsOver`; raised in `resolveEndings` 7c |
| **HOLD** | ask → departure, exactly 52 weeks | 18–19 | `answerFork` college branch: chosen quote locked, `fork.departsWeek` booked, **nothing else** |
| **DEPART** | `nextAcademicYearStart(answer week)` – 294 / 346 | 19.00–19.96 | `resolveCollegeDeparture` (world/endings.ts, step 7c′): builds `world.college`, releases entries, latches the ending |

**No new clock was invented.** Both anchors derive from `SCHOOL_YEAR_TURNS_AT` = 34, the one
September offset `kidLife.ts` has always run on: the ask is the game's own «school is over» fact
(«Конец школы – в конце учебного года»), and the departure is `nextAcademicYearStart` – the next
offset-34 week strictly after the answer. Strictly after, because the ask itself lands ON a
September; `>=` would collapse ask and departure into one week and delete the gap.

### 1a. ⭐⭐ The identity that makes the gap coherent

Measured over all twelve birth months: **`schoolEndWeek + 52` is also the first academic-year start
after her NINETEENTH birthday.** Under the old clock the fork+enrolment landed on the birthday week
(measured: w261 Jan-born, w282 Jun, w291 Aug, w296 Sep, w309 Dec – all age ≈19.0). Under the new
one the junior story still runs out at nineteen – **inside the gap** – and she leaves at 19.0–19.96.
The gap is her last junior season, played instead of skipped, for every girl the game can generate.
`ENDINGS.forkAgeYears` stays as the record of that identity; nothing gates on it any more.

---

## 2. WHAT «RESERVED» MEANS – decided, and in the codebase's own direction

The reservation **locks the quote she picked**: the tier and the prices persisted in `fork.offer`
at the ask, `chosen` written at the answer, tier openness re-validated engine-side **at the answer**
(cheapest-open fallback unchanged). The departure re-validates nothing and re-measures nothing –
`ForkState.offer`'s own doctrine («a later re-tune cannot silently re-price a career halfway
through a bill it had already accepted») extended across the gap. Her junior record may improve in
the gap year; the programmes signed her on what they saw when they looked. `resolveCollegeBill`,
`collegeCoachFactor` and `collegeMatchesThisWeek` all read `chosenQuoteOf(world.fork?.offer)` gated
on `inCollege`, so the first tuition debit is the enrolment week's.

---

## 3. THE GAP'S SEMANTICS

**Everything stays alive**, by construction rather than by exemption: every freeze gate in the
engine reads `inCollege(world)` (false – `world.college` is null through the hold) or
`world.ending` (null). Entries, reveals, results, knocks, sponsors, the academy, gear, her 19th
birthday (an ordinary tour birthday now – the fork is no longer the birthday's question, and
`kidAgeThroughWeek` keeps its documented look-ahead with no caller).

* **An entry scheduled before September is played and its result stands** – pinned on a walked
  career (tests/college-departure.test.ts).
* **An entry still outstanding at the departure is released exactly as B1 releases it**: full
  refund past the deadline included, ITF/pro slot back, season mirror dropped, desk letter in the
  desk's voice (`RELEASE_LINE_PREFIX.college`), zero penalties – «мы ни за что не наказываем».
  `releaseEntriesForTheFreeze` is called from the departure, verbatim, and from nowhere else.
* **An event playing ON the departure week plays first**: the departure runs in the same deferred
  block `finalizeTournament` closes the reveal from, so the run resolves, then she leaves. (The
  finale path also means a reservation due on a finale week latches over the still-open reveal –
  the exact state rule 2's refusal exists for, re-pinned in tests/college-freeze.test.ts.)
* **Entering an event past the departure week is legal** and simply comes back as the full-refund
  release. A refusal at entry («she leaves before this one» as an `entryStatus` reason) would be
  the politer surface – flagged for the owner as a follow-up; it touches C2's refusal codes and was
  not part of this ruling.

**A terminal ending in the gap voids the reservation.** `resolveCollegeDeparture` sits below
`resolveEndings`' `if (world.ending) return` AND guards on the latch itself (it is exported):
bankruptcy or the career-ending injury in the gap ends the career with `world.college` null forever
– no resurrect on later ticks (`tickWeek` is total and re-ticks ended worlds in `replayMainState`;
pinned), no college on the epilogue (`buildEndingView.college` reads `collegeProgressOf`, null),
no departure marker on the wire.

**Old saves keep their geometry.** A v≤57 career already enrolled keeps its birthday-week
`fromWeek` and continues byte-for-byte (`resolveCollegeDeparture` is inert behind an enrolment –
pinned against the v57 golden fixture). New organic enrolments always land on offset 34, so every
new college year holds the League (season week 12) at year-week 30, two weeks before the call-up
that reads it – `the-college-league-2026-08.md` §2a's year-one edge survives only in migrated saves.

---

## 4. SURFACES

* The fork card: «School is over.» – she is 18 on it; the junior rungs close at nineteen (stated,
  not asserted as already true); the college answer reads **Reserve the college place** and the
  lede names the departure week (`Snapshot.collegeDepartsWeek`, prospective while the fork is open).
* The reservation milestone in the feed names the September (`weekLabel`), and the departure's own
  milestone is the college latch's, as always.
* The calendar look-ahead marks the departure week – kind `college`, «Leaves for college» – the
  booked-week idiom, no art. The marker leaves the wire at enrolment and on a voided reservation.
* The stopped ending's copy moved off «nineteen» («She stopped after school») because the stop
  answer is taken at 18 now.

---

## 5. SCHEMA – v57 → v58

`fork.departsWeek`, optional-nullable (the `pendingYearStart` pattern; readers normalise `?? null`).
**Null is the true value for every v57 save, by construction**: the birthday-era answer enrolled in
the same command, so no old save can hold an answered-but-not-departed fork. An old OPEN fork
answered on new code books a real departure at its next September (departsWeek derives from the
answer week, not from `schoolEndWeek`, precisely for these late-asked migrated careers). Golden
fixture v58.json = the real migration's output on v57.json; `npm run e2e:fixtures` re-generated the
six e2e saves – the `ending` fixture now stops at week 242, age 18.

---

## 6. RNG – measured, both captures

* The ask is a week comparison, the reservation is state, the departure is state + `releaseEntry`'s
  arithmetic: **zero draws on any stream**. The offer's own sub-stream key changes value
  (`seed:collegeoffer:242` instead of `:283`) – post-draw, input-independent.
* **Frozen MAIN capture: 41550 / e6b0c709, unmoved** – re-run green before and after (the capture
  is a 52-week walk; the ask sits at 242).
* **The three frozen careers of tests/coach-travel-edge.test.ts moved on exactly one key of 66:
  `schemaVersion`** – per-key diff on all three presets, control = the wave reverted in a detached
  worktree at `8b057bc` (docs-only on top of `7c64ea6`). `rngMain` unmoved, fifteenth wave running.
  Re-pinned with the file's own `PRE_V58` rollback identity: stamping 57 onto the new worlds
  reproduces the previous three hashes byte for byte.
* Pairwise input-independence arms re-proven through the new path (answer → gap walk → departure →
  years, vs bare ticks): identical MAIN position and next-draw equality
  (tests/ending.test.ts, tests/college-second-act.test.ts, tests/college-league.test.ts).

---

## 7. WHAT THE REDESIGN IS PINNED BY – tests/college-departure.test.ts

1. The three moments on an ORGANIC walked career: ask at `schoolEndWeek` (not the birthday), age
   18, the school-over milestone; reservation with `departsWeek = schoolEndWeek + 52`; the gap
   playable (an entry made after the answer plays, its result stands, no refund row); departure at
   the booked week with `fromWeek`/`untilWeek`/`resumesWeek` exact and B1's release predicates.
2. Terminal-void: bankruptcy in the gap – she never departs, later ticks resurrect nothing, the
   epilogue carries no college.
3. v57 continuation: migrated latched career spends its next year exactly as before, departure step
   byte-inert.
4. Two departure alignments (birth months 6 and 10 – departs 294 / 346): four full years each, the
   League floor in every year (season week 12), four answered college birthdays each.

Plus the re-aimed guards: college-freeze (release at departure, refusals untouched), blocking-overlay
(the eight-date sweep now pins the school-end clock; the 5-Sep collision keeps the cake-first
ordering), college-league / college-birthday / college-second-act / round24-college-refusals /
round23-kid-life fixtures walk the gap, endings-bench's college arm presses at the latch.
