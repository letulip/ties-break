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
| onset bill | `Medical – scans and treatment` | `Медицина – обследование и лечение` (RU-05 §20.5) |
| ongoing bill | `Physio / recovery session` | `Физиотерапия – сеанс восстановления` |

The early-return receipt means exactly one week is saved by the masseur's service cadence, not
that a doctor has changed the clinical diagnosis. `weeksRemaining` stays the source number;
RU-05 §20.3 separately explains the estimated recovery time shown in the injury stop.

## Six onset paths – owned by RU-05

RU-05 §20.5 already maps all six `injury.ts` onset branches: three mid-match retirement paths
(severe, trained-through knock, ordinary) and three off-court paths with the same split. Use
those exact drafts here; do not create a second wording table. RU-05 §20.1 also owns the
localized combination of body region and descriptor. The persisted English
`world.injury.kind` must never be displayed raw in Russian. A mid-match onset also has a
retirement result in the tournament feed; the two moments must not collapse into one template.

## Tournament arrival and warning

| Source condition | English source | Russian draft |
| --- | --- | --- |
| walkover while still injured | `Walkover: too injured to play the {tier} – 0 pts, entry fee forfeited.` | `Поражение без игры: из-за травмы она не может выступить на турнире «{tier}». Очков – 0, заявочный взнос не возвращается.` |
| withdrawn on medical grounds | `Withdrawn from the {tier} – not cleared to play on medical advice. 0 pts, entry fee forfeited.` | `Её сняли с турнира «{tier}» по медицинским показаниям: допуска к игре нет. Очков – 0, заявочный взнос не возвращается.` |
| cleared only just | `Doctor's warning – she is cleared for the {tier}, but only just. A warning is all it is; nobody can forbid it.` | `Предупреждение врача: она допущена к турниру «{tier}», но едва. Это только предупреждение – запретить ей играть никто не может.` |

The first two lines are **not** equivalent: in the walkover she remains injured; in the medical
withdrawal she fails the arrival clearance. Neither line invents a travel charge, points, refund
or discretionary parent action. The warning leaves the choice to play legally possible, as the
source does. Dynamic `tier` labels need a localized display form and nominative placement after
`турнире «…»`; do not attempt case inflection on arbitrary tier strings.

## Runtime boundary

An old save may contain `kind` as English `<region> <descriptor>` and these English feed rows.
Implement a semantic classifier or migration for known templates, with a regression fixture for
every onset path in RU-05 §20.5. Translating only future `addEvent` strings would leave existing careers visibly
bilingual. Event type, week, expense category `physio`, amount in integer cents and match-retirement
state must remain unchanged. RU-05 already owns the knock choice/history rows; do not duplicate
their catalogue with competing phrasing.
