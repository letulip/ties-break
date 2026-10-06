---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-11J – Injury, recovery and medical feed

This covers persisted history from `src/engine/world/injury.ts` and tournament-week medical
messages from `phaseHerWeek.ts`. The knock feed in `knock.ts` is **already mapped** in RU-05 §19.7;
its body-region lexicon is reused here. All Russian wording remains `DRAFT`.

## Injury onset and recovery

| Source condition | English source | Russian draft |
| --- | --- | --- |
| masseur shortens rehab | `Rehab ahead of schedule – the masseur bought a week back.` | `Восстановление идёт быстрее: благодаря массажу срок сократился на неделю.` |
| recovered early | `Back on court – cleared to play, ahead of schedule.` | `Она вернулась на корт: допуск к игре получен раньше ожидаемого срока.` |
| recovered on ordinary schedule | `Back on court – cleared to play.` | `Она вернулась на корт: допуск к игре получен.` |
| onset bill | `Medical – scans and treatment` | `Медицинская помощь — обследование и лечение` |
| ongoing bill | `Physio / recovery session` | `Физиотерапия — сеанс восстановления` |

The early-return receipt means exactly one week is saved by the masseur's service cadence, not
that a doctor has changed the clinical diagnosis. `weeksRemaining` stays the source number;
RU-05 §20.3 separately explains the estimated recovery time shown in the injury stop.

## Six onset paths

`{diagnosis}` is the localized combination of body region and descriptor from RU-05 §20.1,
**not** the persisted English `world.injury.kind`. `{weeksOut}` is an approximate duration in
Russian (`около 1 недели`, `около 2 недель`, `около 5 недель`). The source has three mid-match
retirement paths and three off-court paths:

| Moment / severity | English source | Russian draft |
| --- | --- | --- |
| match retirement, severe | `She stopped, and this time it is serious: {kind} – out ~{wks}. The dream takes a hit.` | `Ей пришлось остановить матч. На этот раз травма серьёзная: {diagnosis}. Вне корта — {weeksOut}. Это удар по её мечте.` |
| match retirement, trained through knock | `She had to stop: {kind} – out ~{wks}. The knock we trained through, in front of everybody.` | `Ей пришлось остановить матч: {diagnosis}. Вне корта — {weeksOut}. То самое место, с болью в котором мы решили продолжить тренировки.` |
| match retirement, ordinary | `She had to stop: {kind} – out ~{wks}.` | `Ей пришлось остановить матч: {diagnosis}. Вне корта — {weeksOut}.` |
| off-court, severe | `Bad news from the clinic: {kind} – out ~{wks}. The dream takes a hit.` | `Из клиники пришли тяжёлые новости: {diagnosis}. Вне корта — {weeksOut}. Это удар по её мечте.` |
| off-court, trained through knock | `Injury: {kind} – out ~{wks}. The knock we trained through.` | `Травма: {diagnosis}. Вне корта — {weeksOut}. То самое место, с болью в котором мы решили продолжить тренировки.` |
| off-court, ordinary | `Injury: {kind} – out ~{wks}.` | `Травма: {diagnosis}. Вне корта — {weeksOut}.` |

The English severe line says *dream*; Russian keeps that stake, but does not announce a career
ending. The `pushing` line is licensed by the recorded knock choice, not inferred from the injury
itself. The two moments must not collapse into one generic injury template: a mid-match stop also
has a retirement result in the tournament feed.

## Tournament arrival and warning

| Source condition | English source | Russian draft |
| --- | --- | --- |
| walkover while still injured | `Walkover: too injured to play the {tier} – 0 pts, entry fee forfeited.` | `Поражение без игры: из-за травмы она не может выступить на турнире «{tier}». Очков — 0, заявочный взнос не возвращается.` |
| withdrawn on medical grounds | `Withdrawn from the {tier} – not cleared to play on medical advice. 0 pts, entry fee forfeited.` | `Её сняли с турнира «{tier}» по медицинским показаниям: допуска к игре нет. Очков — 0, заявочный взнос не возвращается.` |
| cleared only just | `Doctor's warning – she is cleared for the {tier}, but only just. A warning is all it is; nobody can forbid it.` | `Предупреждение врача: она допущена к турниру «{tier}», но едва. Это только предупреждение — запретить ей играть никто не может.` |

The first two lines are **not** equivalent: in the walkover she remains injured; in the medical
withdrawal she fails the arrival clearance. Neither line invents a travel charge, points, refund
or discretionary parent action. The warning leaves the choice to play legally possible, as the
source does. Dynamic `tier` labels need a localized display form and nominative placement after
`турнире «…»`; do not attempt case inflection on arbitrary tier strings.

## Runtime boundary

An old save may contain `kind` as English `<region> <descriptor>` and these English feed rows.
Implement a semantic classifier or migration for known templates, with a regression fixture for
every onset path. Translating only future `addEvent` strings would leave existing careers visibly
bilingual. Event type, week, expense category `physio`, amount in integer cents and match-retirement
state must remain unchanged. RU-05 already owns the knock choice/history rows; do not duplicate
their catalogue with competing phrasing.
