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
| [round-3-qa.md](round-3-qa.md) | 3 – owner Q&A (2026-07-22) | 19 | mostly shipped across phases 3–6; a handful still deferred (radar, weather, age curves, mom/dad choice, Moments gallery) |
| [round-4.md](round-4.md) | 4 – quick fixes + viz polish + sound wiring | 17 | all shipped |
| [round-5.md](round-5.md) | 5 – owner playtest to W53 (2026-07-23/24) | 37 | 30 shipped (1 of those – the segmented control – later superseded in round 6), 7 backlog items still open |
| [round-6.md](round-6.md) | 6 – this bundle (music/splash/birth-month/docs) + interim follow-ups + mid-task additions | 14 | all shipped |
| [round-7.md](round-7.md) | 7 – owner's post-playtest list: economy pain pass + match/audio/season-UI polish (2026-07-24) | 21 | 20 shipped, 1 deferred (per-day calendar detail screens → Phase 4); plus 7 extras landed in the same push, listed under "Дополнительно" (SFX master-volume balance, an owner icon refresh, and 5 items first shipped in round 6 – birth-month field, Stats tab, best-6 help popover, splash screen, background music) |

Every item's checkbox and comment lives in its own file – this table is just navigation, not a
duplicate ledger.
