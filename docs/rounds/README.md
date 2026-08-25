# Round tracking

One checklist per owner feedback round, starting from the first Q&A round (round 3 – rounds 1/2
predate this format and stay in `docs/decisions.md`'s "Initial concept round" / "Stack confirmed" /
"UI detour" sections). Each file lists every item the owner raised in that round, checked off with
where it landed, or left unchecked with the reason it's deferred and the phase it's aimed at.

Sources of truth this index is built from: `docs/decisions.md` (round digests, dated), the
`docs/specs/round4-*.md` / `round5-*.md` / `tournament-experience.md` spec files, and `git log`.
When a status here and a spec/commit disagree, the spec/commit wins – these files are an audit
trail, not an independent record.

**A later round can supersede an earlier one.** Where that happened (e.g. round 5's
Calendar/Standings segmented control, removed again in round 6), both files say so explicitly
rather than quietly editing the earlier entry's checkbox.

| File | Round | Items | Status |
| --- | --- | --- | --- |
| [round-3-qa.md](round-3-qa.md) | 3 – owner Q&A (2026-07-22) | 19 | 14 shipped; 5 still open – Team card, childhood prologue, Moments gallery, weather (#67), mom/dad choice. The radar and the age curves shipped later and were ticked in the 09.08 re-audit. ⚠ The weather box's REASON was corrected 24.08: a cosmetic temperature layer is live (`eventTemperature`, `WeatherPlate.vue`, the commentary's conditions line) – what is absent is every mechanical half of the ask |
| [round-4.md](round-4.md) | 4 – quick fixes + viz polish + sound wiring | 17 | all shipped |
| [round-5.md](round-5.md) | 5 – owner playtest to W53 (2026-07-23/24) | 37 | 33 shipped (1 of those – the segmented control – later superseded in round 6), 4 backlog items still open. Equipment wear, class-differentiated vacations and the scholarship chance all shipped in Phase 5 and were ticked in the 09.08 re-audit; the wealthy-track academy invitation did NOT ship – the academy that exists is a need-based scholarship, the other side of the class ladder |
| [round-6.md](round-6.md) | 6 – this bundle (music/splash/birth-month/docs) + interim follow-ups + mid-task additions | 14 | all shipped |
| [round-7.md](round-7.md) | 7 – owner's post-playtest list: economy pain pass + match/audio/season-UI polish (2026-07-24) | 21 | 20 shipped, 1 still deferred (per-day calendar detail screens) – no longer blocked: round 15's ruling 3 puts the per-day training controls first, design on `docs/training-dials`. Plus 7 extras landed in the same push, listed under "Дополнительно" (SFX master-volume balance, an owner icon refresh, and 5 items first shipped in round 6 – birth-month field, Stats tab, best-6 help popover, splash screen, background music) |
| [round-8.md](round-8.md) | 8 – owner playtest, main-screen pass (2026-07-25) | 10 | 8 shipped, 2 open. NOT "all shipped" – the 09.08 re-audit found R8-9 (pre-history), R8-7b (ladder floor, 08.08) and R8-10 (coach-as-choice + split bill, 06.08) had shipped unticked, and that **R8-1** (in-tournament player card) is untouched since 25.07 – the oldest open item here. **R8-3** was CLOSED 24.08 – its header half is the owner's 27.07 ruling (`headerAvatar.ts`, F45-1) and its Home half has been emotion-driven since R9-13/15; only the portrait ART ORDER survives it, in `docs/backlog/college-the-remainder.md` #4 |
| [round-9.md](round-9.md) | 9 – owner playtest, condition/fatigue redesign round (2026-07-26) | 22 | all shipped |
| [round-10.md](round-10.md) | 10 – owner playtest on the wave-3 build (2026-07-26) | 17 | all shipped on `r10/fix`+`r10/ui`+`r10/view`; R10-11 later reverted by R11-15 |
| [round-11.md](round-11.md) | 11 – owner playtest, two full careers (2026-07-27) | 15 | waves A, C, D and E shipped; wave B shipped 2 of 3. Only **R11-1b** (post-return injury fragility) is open. The old "nothing started (waits on the five open branches)" row was stale for a fortnight – this round has a status list at the top of its file now |
| [round-12.md](round-12.md) | 12 – owner playtest, three careers on the week-numbering + age-caps build (2026-07-27) | 17 + 2 screenshot finds | all shipped. Waves A and B landed and were never ticked back; the two design items were ruled and built later under other names – R12-2/13/17 as the ladder floor (08.08), R12-17b as the living field + junior conveyor |
| [round-13.md](round-13.md) | 13 – owner's first Diary-1 playtest, quick pass (2026-07-28) | 8 + 2 additions | all shipped on `fix/r13-quick`; the R13-7 economy half deferred to the economy wave by design; second visit same day folded in the economy DECISIONS (recorded, docs only → `specs/economy-wave.md`) and R13-12, the nav restructure (Kid behind the header avatar, the This week tab) |
| [round-14.md](round-14.md) | 14 – owner playtest on the week-255 save (2026-08-06) | 18 | groups A, B, D and F shipped, 13 answered. Group **C** shipped 10.08 (`db6d6a1`); group **E** shipped 10.08 (`bea7cc2`) and its two boxes stayed open for three days until the 13.08 audit ticked them. Only **17** (the difficulty wrapper) is left, and it needs a ruling, not a build. Argument in `specs/round14-triage.md` |
| [round-15.md](round-15.md) | 15 – owner playtest, two saves + a 200-career bench (2026-08-09) | 19 | the owner's five rulings are at the top of the file – they are what the round is worked against. ⚠ **This file was the worst in the folder until 13.08**: all four "in flight" branches landed on 09–10.08 and **thirteen boxes stayed open for four days**. Now: shipped 1, 19a, 5, 7, 8, 10, 11, 12, 15, 16, 17, 18 + the sponsor floor; open **3, 6, 9, 13**; answered 2, 4, 14. Argument in `specs/round15-triage.md` |
| [round-16.md](round-16.md) | 16 – owner playtest, third Olivia season (2026-08-11) | 20 + the pre-match preview | ⚠ **This ledger did not exist until 13.08 and was reconstructed after the fact** – the round went straight to `specs/round16-triage.md` and the boxes were never written. 16 shipped (incl. the preview and the #100 birthday-age fix – **9b was ticked 24.08**, its own body having said "shipped" under an open box), 3 answered, **4 open: 6** (no repro), **8** (kit wear on holiday – asked three times, never built), **10** (`key` as a highlights reel, explicitly left alone), **20** (the wake lock, no code at all). Specs: `round16-triage.md`, `round16-injuries.md`, `round16-commentary.md` |
| [round-17.md](round-17.md) | 17 – owner playtest, twenty-eight items + a live day of follow-ups (2026-08-12) | 28 + 13 | the first round to get its ledger the same day, and the reason the ledger discipline held. 25 shipped, 4 answered; **15** and **22** are `[>]` awaiting his word, **H** is task #84. ⚠ **14 was re-marked `[!]` by the 13.08 audit** – both its fixes landed on Home, and the coach PICKER he was talking about was never touched – and it was **ticked 24.08**: the picker fix is in the tree as round-18 #2 (`src/style.css:3736`) and nobody closed either ledger. Argument in `specs/round17-triage.md`, `specs/round17-match-screen.md` |
| [round-18.md](round-18.md) | 18 – the first round run through `/fix-round` (2026-08-13) | 11 | items 1-3 are re-reports of round-17 #14's miss; 5 (the skill) shipped; **6 is this audit**, task #88. ⚠ **Four boxes were ticked on 24.08 against the tree** – 1, 2, 3 (all three shipped and all three still read `[!]`: `HomeScreen.vue:2234`, `src/style.css:3736`, `CoachMarketScreen.vue:70`) and 8 (`[>]` over a body that already said «Shipped» – `TourBriefingDialog.vue`). **Nothing from round 18 is open.** 7 and 11 answered |
| [round-19.md](round-19.md) | 19 – the wrap week lies to a climbing girl (2026-08-13) | 2 | all shipped |
| [round-20.md](round-20.md) | 20 – a micro-round, and one of them is mine (2026-08-13) | 4 | all shipped. #3 is the blocking dialog that stopped his career on a phone, and #4 is the rule it earned in `CLAUDE.md` |
| [round-21.md](round-21.md) | 21 – a full playtest on the 128-draw build (2026-08-14) | 12 | all shipped. ⚠ **Boxes 1 and 9 stayed `[ ]` for four days after the work landed** (`ac5ea3d`, 15.08) and #9's own body already read "✅ BUILT" above an unticked box; both were ticked by the 19.08 documentation pass, which found them being carried forward as open work in `now-next-later.md`. #2 became its own wave – the coach travels, and the bonus is his own coach ladder doubled |
| [round-22.md](round-22.md) | 22 – the age clock, the living table, and the review's first three waves (2026-08-18/19) | 20, in commit-subject numbering | ⚠ **The only round in this folder whose ledger was written AFTER the wave, from the commits.** His own numbered list was never captured on any branch, so `#2-5` and `#9-14` do not divide evenly across what shipped and the file says so instead of reconstructing it. The file is **current through `faa5a6c`** and says so – the wave was still landing commits while it was written. Everything shipped; one thing is left open and three wait on him, listed at the foot of the file – and the tier-label flag narrowed on 24.08 to the single word `Grand Slam`, the `WTA …` rungs having been `World Tour …` in the code since his own 18.08 instruction |
| [round-23.md](round-23.md) | 23 – twenty items on a five-season profile (2026-08-19) | 20 | ⚠ **This row did not exist until 24.08** – the fourth time this table has lagged its own folder. Nothing is open: 13 shipped, 6 answered, and **#9 (the ~340k staffed year) was ticked 24.08** – the count landed in `plans/the-travelling-team-2026-08.md` and «профессионально звучит» is answered yes. Its own "Still open" table was three rows stale and is corrected in place |
| [round-24.md](round-24.md) | 24 – the college flow (2026-08-20/22) | 7 asked + 8 forced | all shipped bar **#6** («где-то её мнение увидеть»), `[>]` PAUSED by his own ruling until the private-life layer's steps 1–2 exist. Schema v54→v58 in one round. What the wave did NOT build is indexed in `../backlog/college-the-remainder.md`, not here |
| [round-25.md](round-25.md) | 25 – the staff, the deal, and the git hygiene (2026-08-22/23) | 9 | 8 shipped; **#9** (перебаланс травм безалаберных) is `[?]` and, since 24.08, waiting on HIM alone – the measurement it was blocked on landed as `specs/the-injury-landscape-2026-08.md` |

Every item's checkbox and comment lives in its own file – this table is just navigation, not a
duplicate ledger. Round 12 had no row here at all until 09.08, rounds **16, 17 and 18** had no row
until 13.08, rounds **19, 20, 21 and 22** had none until 19.08, and rounds **23, 24 and 25** had none until
24.08 – four times now, which is its own lesson about a navigation table nobody is required to
update.

## ⚠ Two traps for the next auditor, found on 13.08

**1. "round N" in a commit message is ambiguous before 06.08.** Between 29.07 and 01.08 the repo
used a SECOND, unrelated numbering for build waves: `integrate/round-15`, `round 16: fix/chrome`,
`integrate/round-17`, `fix/round-18`, `fix/round-19` are all from 30–31.07 and have nothing to do
with this folder's rounds 15–19. One of them (`fde515d`, 01.08) even says "round 15: nine owner
items". Owner feedback DID flow into those waves and **never got a ledger file here** – the gap
between round 13 (28.07) and round 14 (06.08) is unaccounted for in this folder. If those nine items
matter, they need his own sentence, not an inference from a commit subject.

**2. The `R15-*` source tags are two different rounds.** `R15-3`, `R15-5`, `R15-6`, `R15-8` and
`R15-9` in `src/` belong to the 01.08 build wave. `R15-7`, `R15-10`, `R15-15`, `R15-17` and `R15-18`
belong to this folder's round 15 (09.08). Grepping a tag is not enough; check the date in the comment
beside it.

## The 13.08 re-audit (round-18 item 6, task #88)

Rounds 8–17 were re-read against the current build and a sample of sixteen `[x]` marks was verified
independently for the first time. Findings, the reconstructed round-16 ledger and the list of what to
put in front of the owner first are in **[AUDIT-2026-08.md](AUDIT-2026-08.md)**. Two marks came back
false (`[!]`): round-10's R10-2/R10-8 and round-17's #14.

## Keeping this true

These files rotted between round 11 and round 15 for one reason: **nothing forced an update when
work shipped.** Waves landed under branch names and spec names that carried no round tag, the boxes
stayed open, and by 09.08 most "open" items were work that had shipped months earlier under a
different name. A tool that reports false negatives is a tool nobody can trust – which is the point
the owner made when he refused to retire it.

So, at the end of a wave, before the branch is merged:

1. **Grep the round tags the wave touched** (`git grep -n "R12-15"` and so on). A tag in `src/` or
   `tests/` is the evidence; paste it into the box.
2. **Tick the boxes and say WHERE.** A spec path, a commit, or a source symbol. Never an inference,
   and never "probably done".
3. **If it shipped under a different name, say BOTH names.** R8-7b shipped as "the ladder floor";
   R12-17b shipped as "the living field"; round 5's scholarship shipped as "the academy scholarship".
   Every one of those sat open for weeks because only one of its two names was ever written down.
4. **A half-shipped item stays open**, with a note naming which half landed. R8-10's visible half
   shipped and its controllable half did not; the box says so rather than averaging the two.
5. **Update this table's row** for every round the wave touched, and add a row for a new round.
6. **New round → new file here**, on the day it is triaged. Rounds 14 and 15 went to
   `docs/specs/round*-triage.md` and had no file here for three days; the spec is where the argument
   belongs and this is where the checklist belongs.

⚠ **This is a convention and nothing enforces it.** There is no hook, no test and no CI gate that
fails when a wave ships without ticking its boxes – `npm run context:audit` checks frontmatter and
links, not truth. The only thing standing between this ledger and the state it was in on 09.08 is
somebody doing the six steps above. If it rots again, the fix is a mechanical check, not another
audit.

