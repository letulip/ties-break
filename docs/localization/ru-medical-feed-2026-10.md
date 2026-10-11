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

## ⚙ 11.10 agent-authored (бланкет) – the injury row and the medical category, as whole keys

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

`injury.ts` writes the onset row as **24 whole sentences** (a retirement that is serious / pushed through / plain, the same three off court, each × a niggle or the severity's descriptor × `wk` or `wks`) and keeps the English `text` beside them in six forms; `bookings.ts` names the medical category. RU-05 §20.5 drafted the six paths with a `{kind}` slot a localized diagnosis would fill; the live keys carry the part (`{0}`: `ankle`) and the descriptor (`{1}`: `strain`) as **two English words in two holes**, with `niggle` spelled into the key. The 31 rows below are the six paths re-cut to that shape. `DRAFT`, his live edit follows.

**Nothing is inflected around the part or the descriptor.** They sit in nominative positions – descriptor, dash, part (`strain – ankle`) – and the niggle keeps RU-05 §20.1's pattern (`лёгкий дискомфорт – {0}`), so the sentence stays the same Russian when the code hands in `растяжение` and `голеностоп`. **The weeks are a number**, so every row has the Russian plural over it and the `wk` / `wks` twins carry the same one. After `около` the noun is in the genitive (`около 1 недели`, `2 недель`, `21 недели`); RU-05 §20.5's `около {weeks}` stood on an accusative duration, which `около` does not take. The tails are RU-05's (`Это удар по мечте.`, `То самое место, с которым мы продолжили тренировки.`), the family is `мы`, the daughter `она`. The six `ledger` rows are the stored English `text` (`{0}` the English `kind`, `{1}` the English `3 wks`); no code asks for them.

**Seam that is code, not translation:** `BODY_REGIONS` and `SEVERITY_DESCRIPTOR` reach the sentence in English, so a Russian row prints `Травма: strain – ankle; пропустит около 3 недель.` until the diagnosis is a pair of ids (RU-05 §19.1, §20.1 and §20.6 carry the Russian words and ask for the change).

### A niggle – the one-week knock the code spells into the key

| id | English | Russian |
| --- | --- | --- |
| RU21-MED-01 | `Bad news from the clinic: {0} niggle – out ~{1} wk. The dream takes a hit.` | `Плохие новости из клиники: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. Это удар по мечте.` |
| RU21-MED-02 | `Bad news from the clinic: {0} niggle – out ~{1} wks. The dream takes a hit.` | `Плохие новости из клиники: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. Это удар по мечте.` |
| RU21-MED-03 | `She stopped, and this time it is serious: {0} niggle – out ~{1} wk. The dream takes a hit.` | `Она остановилась, и на этот раз всё серьёзно: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. Это удар по мечте.` |
| RU21-MED-04 | `She stopped, and this time it is serious: {0} niggle – out ~{1} wks. The dream takes a hit.` | `Она остановилась, и на этот раз всё серьёзно: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. Это удар по мечте.` |
| RU21-MED-05 | `Injury: {0} niggle – out ~{1} wk.` | `Травма: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}.` |
| RU21-MED-06 | `Injury: {0} niggle – out ~{1} wks.` | `Травма: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}.` |
| RU21-MED-07 | `Injury: {0} niggle – out ~{1} wk. The knock we trained through.` | `Травма: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. То самое место, с которым мы продолжили тренировки.` |
| RU21-MED-08 | `Injury: {0} niggle – out ~{1} wks. The knock we trained through.` | `Травма: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. То самое место, с которым мы продолжили тренировки.` |
| RU21-MED-09 | `She had to stop: {0} niggle – out ~{1} wk.` | `Она не смогла продолжить: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}.` |
| RU21-MED-10 | `She had to stop: {0} niggle – out ~{1} wks.` | `Она не смогла продолжить: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}.` |
| RU21-MED-11 | `She had to stop: {0} niggle – out ~{1} wk. The knock we trained through, in front of everybody.` | `Она не смогла продолжить: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |
| RU21-MED-12 | `She had to stop: {0} niggle – out ~{1} wks. The knock we trained through, in front of everybody.` | `Она не смогла продолжить: лёгкий дискомфорт – {0}; пропустит около {1, plural, one {{1} недели} few {{1} недель} many {{1} недель} other {{1} недели}}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |

### The severity's descriptor – two English words, a dash between them

| id | English | Russian |
| --- | --- | --- |
| RU21-MED-13 | `Bad news from the clinic: {0} {1} – out ~{2} wk. The dream takes a hit.` | `Плохие новости из клиники: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. Это удар по мечте.` |
| RU21-MED-14 | `Bad news from the clinic: {0} {1} – out ~{2} wks. The dream takes a hit.` | `Плохие новости из клиники: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. Это удар по мечте.` |
| RU21-MED-15 | `She stopped, and this time it is serious: {0} {1} – out ~{2} wk. The dream takes a hit.` | `Она остановилась, и на этот раз всё серьёзно: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. Это удар по мечте.` |
| RU21-MED-16 | `She stopped, and this time it is serious: {0} {1} – out ~{2} wks. The dream takes a hit.` | `Она остановилась, и на этот раз всё серьёзно: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. Это удар по мечте.` |
| RU21-MED-17 | `Injury: {0} {1} – out ~{2} wk.` | `Травма: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}.` |
| RU21-MED-18 | `Injury: {0} {1} – out ~{2} wks.` | `Травма: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}.` |
| RU21-MED-19 | `Injury: {0} {1} – out ~{2} wk. The knock we trained through.` | `Травма: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. То самое место, с которым мы продолжили тренировки.` |
| RU21-MED-20 | `Injury: {0} {1} – out ~{2} wks. The knock we trained through.` | `Травма: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. То самое место, с которым мы продолжили тренировки.` |
| RU21-MED-21 | `She had to stop: {0} {1} – out ~{2} wk.` | `Она не смогла продолжить: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}.` |
| RU21-MED-22 | `She had to stop: {0} {1} – out ~{2} wks.` | `Она не смогла продолжить: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}.` |
| RU21-MED-23 | `She had to stop: {0} {1} – out ~{2} wk. The knock we trained through, in front of everybody.` | `Она не смогла продолжить: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |
| RU21-MED-24 | `She had to stop: {0} {1} – out ~{2} wks. The knock we trained through, in front of everybody.` | `Она не смогла продолжить: {1} – {0}; пропустит около {2, plural, one {{2} недели} few {{2} недель} many {{2} недель} other {{2} недели}}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |

### The stored English text – six forms, no count inflected

`{0}` is the English `kind` (`ankle strain`) and `{1}` the English `3 wks`, printed as given; no code asks for these.

| id | English | Russian |
| --- | --- | --- |
| RU21-MED-25 | `Bad news from the clinic: {0} – out ~{1}. The dream takes a hit.` | `Плохие новости из клиники: {0}; пропустит около {1}. Это удар по мечте.` |
| RU21-MED-26 | `She stopped, and this time it is serious: {0} – out ~{1}. The dream takes a hit.` | `Она остановилась, и на этот раз всё серьёзно: {0}; пропустит около {1}. Это удар по мечте.` |
| RU21-MED-27 | `Injury: {0} – out ~{1}.` | `Травма: {0}; пропустит около {1}.` |
| RU21-MED-28 | `Injury: {0} – out ~{1}. The knock we trained through.` | `Травма: {0}; пропустит около {1}. То самое место, с которым мы продолжили тренировки.` |
| RU21-MED-29 | `She had to stop: {0} – out ~{1}.` | `Она не смогла продолжить: {0}; пропустит около {1}.` |
| RU21-MED-30 | `She had to stop: {0} – out ~{1}. The knock we trained through, in front of everybody.` | `Она не смогла продолжить: {0}; пропустит около {1}. То самое место, с которым мы продолжили тренировки, – на глазах у всех.` |

### The medical category

| id | English | Russian |
| --- | --- | --- |
| RU21-MED-31 | `Medical` | `Медицина` – ⚙ RU-05 §20.5 |
