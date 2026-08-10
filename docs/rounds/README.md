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
| [round-3-qa.md](round-3-qa.md) | 3 – owner Q&A (2026-07-22) | 19 | 14 shipped; 5 still open – Team card, childhood prologue, Moments gallery, weather (#67), mom/dad choice. The radar and the age curves shipped later and were ticked in the 09.08 re-audit |
| [round-4.md](round-4.md) | 4 – quick fixes + viz polish + sound wiring | 17 | all shipped |
| [round-5.md](round-5.md) | 5 – owner playtest to W53 (2026-07-23/24) | 37 | 33 shipped (1 of those – the segmented control – later superseded in round 6), 4 backlog items still open. Equipment wear, class-differentiated vacations and the scholarship chance all shipped in Phase 5 and were ticked in the 09.08 re-audit; the wealthy-track academy invitation did NOT ship – the academy that exists is a need-based scholarship, the other side of the class ladder |
| [round-6.md](round-6.md) | 6 – this bundle (music/splash/birth-month/docs) + interim follow-ups + mid-task additions | 14 | all shipped |
| [round-7.md](round-7.md) | 7 – owner's post-playtest list: economy pain pass + match/audio/season-UI polish (2026-07-24) | 21 | 20 shipped, 1 still deferred (per-day calendar detail screens) – no longer blocked: round 15's ruling 3 puts the per-day training controls first, design on `docs/training-dials`. Plus 7 extras landed in the same push, listed under "Дополнительно" (SFX master-volume balance, an owner icon refresh, and 5 items first shipped in round 6 – birth-month field, Stats tab, best-6 help popover, splash screen, background music) |
| [round-8.md](round-8.md) | 8 – owner playtest, main-screen pass (2026-07-25) | 10 | 8 shipped, 2 open. NOT "all shipped" – the 09.08 re-audit found R8-9 (pre-history), R8-7b (ladder floor, 08.08) and R8-10 (coach-as-choice + split bill, 06.08) had shipped unticked, and that **R8-1** (in-tournament player card) is untouched since 25.07 – the oldest open item here. **R8-3** is under check in code on `wave/round15` |
| [round-9.md](round-9.md) | 9 – owner playtest, condition/fatigue redesign round (2026-07-26) | 22 | all shipped |
| [round-10.md](round-10.md) | 10 – owner playtest on the wave-3 build (2026-07-26) | 17 | all shipped on `r10/fix`+`r10/ui`+`r10/view`; R10-11 later reverted by R11-15 |
| [round-11.md](round-11.md) | 11 – owner playtest, two full careers (2026-07-27) | 15 | waves A, C, D and E shipped; wave B shipped 2 of 3. Only **R11-1b** (post-return injury fragility) is open. The old "nothing started (waits on the five open branches)" row was stale for a fortnight – this round has a status list at the top of its file now |
| [round-12.md](round-12.md) | 12 – owner playtest, three careers on the week-numbering + age-caps build (2026-07-27) | 17 + 2 screenshot finds | all shipped. Waves A and B landed and were never ticked back; the two design items were ruled and built later under other names – R12-2/13/17 as the ladder floor (08.08), R12-17b as the living field + junior conveyor |
| [round-13.md](round-13.md) | 13 – owner's first Diary-1 playtest, quick pass (2026-07-28) | 8 + 2 additions | all shipped on `fix/r13-quick`; the R13-7 economy half deferred to the economy wave by design; second visit same day folded in the economy DECISIONS (recorded, docs only → `specs/economy-wave.md`) and R13-12, the nav restructure (Kid behind the header avatar, the This week tab) |
| [round-14.md](round-14.md) | 14 – owner playtest on the week-255 save (2026-08-06) | 18 | groups A, B, D and F shipped, 13 answered; groups **C** (cancel a vacation, the mail client, onboarding width) and **E** (opponent ages, per-track season history) not started; 17 (the difficulty wrapper) needs a ruling. Argument in `specs/round14-triage.md` |
| [round-15.md](round-15.md) | 15 – owner playtest, two saves + a 200-career bench (2026-08-09) | 19 | the owner's five rulings are at the top of the file – they are what the round is worked against. In flight on `wave/round15`: `fix/one-clock` (group A), `fix/sponsor-floor` (ruling 2), `fix/surfaces-r15` (group D), `docs/training-dials` (rulings 3/4). Argument in `specs/round15-triage.md` |

Every item's checkbox and comment lives in its own file – this table is just navigation, not a
duplicate ledger. Round 12 had no row here at all until 09.08, which is its own lesson about a
navigation table nobody is required to update.

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

