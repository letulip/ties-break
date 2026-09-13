---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-13
---

# Wave 5 – every player-facing string the wave added (the вычитка table)

The wave's whole new copy set, in one place, for the architect's read and the owner's playtest.
T9 of [the wave-5 builder brief](life-wave-5-builder-2026-09.md); its §5 is the gate this table
feeds – **every word below is the owner's, the вычитка is the architect's, and the builder's job
here was collection and the lints, never judgment.** Not one string was rewritten, shortened or
"fixed" to build this document (CLAUDE.md invariant 4).

**Provenance.** Collected from the diff `4ceb7c0d..HEAD` – the wave's base to its head – and never
from a task report or from memory. Every added line of `src/` was swept for string literals, and
every literal the sweep found is either a row below or is named in §9 with the reason it is not one.
The pool cells are extracted from the source text by axis walk rather than transcribed by hand, so
a cell that exists in the code exists here.

## 0. The count

| | |
| --- | ---: |
| player-facing strings the wave ADDED | **82** |
| of them **ruled** – the spec's own wording, transcribed | **9** |
| of them **draft** – written in this wave | **73** |
| player-facing strings the wave CHANGED | **0** (measured: no removed string literal in the diff) |

Per group: T2 the seat **15** (3 ruled) · T3 the focus **14** (4 ruled) · T4 the recovery receipt
**1** (ruled) · T5 the cool-head sentence **1** (ruled) · T6/T6b the legible pools **40** (all
draft) · T8 the counsel seat **11** (all draft).

**The nine ruled rows, and where each is ruled from.** The four focus NAMES and the two RECEIPT
sentences are [the psychologist's year](../specs/the-psychologists-year-2026-09.md) §2's own
table, transcribed; the three rung LABELS are its §3 roster («a counsellor · a sport psychologist ·
a tour-grade specialist»), with the article dropped and the first letter capitalised for a card
pill. ⚠ Two of the spec §2's four sentences were NOT transcribed – see §8.

## 1. T2 – the seat

`src/engine/world/psychologist.ts`, `ECONOMY.psychologist.rungs`, `SupportStaffTab.vue` – **15 strings**, 3 ruled / 12 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_LOCKED_DETAIL` | under his name on the Support-staff card while the professional career is still locked – and thrown by `hirePsychologist` if a stale screen presses Hire | A psychologist joins a professional operation – her first counting W-series result opens the door. | `draft` |
| 2 | `src/engine/world/psychologist.ts` · `hirePsychologist`, the `text` ternary (hire arm) | a kept feed row, the week a psychologist goes on the payroll | A psychologist is on the payroll now – one call a week, wherever she is. | `draft` |
| 3 | `src/engine/world/psychologist.ts` · `hirePsychologist`, the `text` ternary (fire arm) | a kept feed row, the week the psychologist comes off the payroll | The psychologist is off the payroll – the calls stop at the end of the week. | `draft` |
| 4 | `src/engine/world/psychologist.ts` · `setPsychologistRung`, the inline `throw` | never on a live card – thrown when a stale screen asks for a rung the roster does not hold | No such arrangement – the call is taken by a counsellor, a sport psychologist or a tour-grade specialist. | `draft` |
| 5 | `src/engine/world/psychologist.ts` · `setPsychologistRung`, the event `text` | a feed row, the week a HIRED seat's rung changes (silent while unhired) | The weekly call changes hands – ${chosen.label.toLowerCase()} from the next bill. | `draft` |
| 6 | `src/engine/world/psychologist.ts` · `resolvePsychologist`, the expense `text` | the feed, every week he is not stood down by a college freeze or a booked family week | Psychologist – weekly salary | `draft` |
| 7 | `src/engine/economy.ts` · `ECONOMY.psychologist.rungs[0].label` | the first pill of his rung selector, its price beside it – and inside the hire confirm | Counsellor | `ruled` |
| 8 | `src/engine/economy.ts` · `ECONOMY.psychologist.rungs[1].label` | the second pill (the default rung) | Sport psychologist | `ruled` |
| 9 | `src/engine/economy.ts` · `ECONOMY.psychologist.rungs[2].label` | the third pill | Tour-grade specialist | `ruled` |
| 10 | `src/components/SupportStaffTab.vue` · `psychologist.name` | his name on the Support-staff card, always | Psychologist | `draft` |
| 11 | `src/components/SupportStaffTab.vue` · `psychologistLine`, hired arm | the line under his name while hired | On retainer – one call a week, wherever she is. | `draft` |
| 12 | `src/components/SupportStaffTab.vue` · `psychologistLine`, unhired arm | the line under his name while the seat is unlocked and nobody is hired | A call a week for her head – the year's work is chosen one year at a time. | `draft` |
| 13 | `src/components/SupportStaffTab.vue` · `psychologist.hireMessage` | the keyed confirm when the parent presses Hire | Put a psychologist on the payroll at ${psychologistSalary.value} a week (${psychologistRungLabel.value.toLowerCase()})? Cancellable any week, like the coach. | `draft` |
| 14 | `src/components/SupportStaffTab.vue` · `psychologist.releaseMessage` | the keyed confirm when the parent presses Release | Let the psychologist go? The weekly salary stops, and the calls end with the week. | `draft` |
| 15 | `src/components/SupportStaffTab.vue` · `psychologist.dial.label` | ⚠ never painted – the rung radiogroup's `aria-label`, read by assistive tech only | Psychologist – who takes the weekly call | `draft` |

## 2. T3 – the year-focus

`src/engine/world/psychologist.ts`, `SupportStaffTab.vue` – **14 strings**, 4 ruled / 10 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LABEL.coolhead` | the first focus pill (the row renders only while hired) | Cool head | `ruled` |
| 2 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LABEL.recovery` | the second focus pill (the row renders only while hired) | Back on her feet | `ruled` |
| 3 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LABEL.listen` | the third focus pill (the row renders only while hired) | Learning to listen | `ruled` |
| 4 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LABEL.herself` | the fourth focus pill (the row renders only while hired) | Working on herself | `ruled` |
| 5 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LINE.coolhead` | the note under the focus row while `coolhead` is the running year and nothing is refused | The year goes on the big points – the head she takes into them. | `draft` |
| 6 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LINE.recovery` | the note under the focus row while `recovery` is the running year and nothing is refused | The year goes on the weeks after something breaks – the walk back up. | `draft` |
| 7 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LINE.listen` | the note under the focus row while `listen` is the running year and nothing is refused | The year goes on your own ear for her – the sessions themselves stay hers. | `draft` |
| 8 | `src/engine/world/psychologist.ts` · `PSY_FOCUS_LINE.herself` | the note under the focus row while `herself` is the running year and nothing is refused | The year goes on the things she never says out loud – and she has to want it. | `draft` |
| 9 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL` | never on a live card (the row is hidden while unhired) – thrown at a stale screen that picks a year with nobody on the payroll | Nobody is taking the call – a year of work needs somebody on the payroll first. | `draft` |
| 10 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL` | never on a live card – thrown when a command names a focus that is not one of the four | No such year of work – there are four, and that is not one of them. | `draft` |
| 11 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_FOCUS_SEASON_REFUSAL` | the note under the focus row (and the throw behind a disabled pill) once a focus exists and this week is outside the off-season, or the off-season's one change is spent | The year already has its work – the next one is chosen in the off-season, once a season. | `draft` |
| 12 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL` | the note under the focus row from her 18th birthday at a `strained`/`cold` bond – the whole row is closed | This is her call as much as yours now – and she is not saying yes to it. | `draft` |
| 13 | `src/engine/world/psychologist.ts` · `PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL` | the note under the focus row when only «Working on herself» is closed – a `strained`/`cold` bond, at any age under 18 | She is not ready for that one – it is the year she has to want first. | `draft` |
| 14 | `src/components/SupportStaffTab.vue` · `psychologist.focus.label` | ⚠ never painted – the focus radiogroup's `aria-label`, read by assistive tech only | Psychologist – the year's work | `draft` |

## 3. T4 – «Back on her feet»: the recovery receipt

`src/engine/spirit.ts` – **1 strings**, 1 ruled / 0 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/spirit.ts` · `RECOVERY_RECEIPT` | a no-cents feed row on the week a shock clears, if the recovery year was held for at least half the shock's weeks (`recoveryReceiptEarned`) | She came back sooner than last time. | `ruled` |

## 4. T5 – «Cool head»: the sentence

`src/engine/development.ts` – **1 strings**, 1 ruled / 0 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/development.ts` · `COOLHEAD_RECEIPT` | a no-cents feed row on a week his term alone carries `composure` over a whole point (`coolheadCrossedAPoint`) – one to three times a season | The big points feel slower to her than they used to. | `ruled` |

## 5. T6 / T6b – the legible pools

`src/engine/world/lifeBeat.ts` – **40 strings**, 0 ruled / 40 draft.

⚠ Four pools, `Record`-total by type in their own axes, so a missing cell is a compile error.
The shape and the FULL cell list are below – 40 rows, not a sample. Every cell is reached only when
the «Learning to listen» year is being worked that week (the seat hired, working, `focus === 'listen'`)
AND the uniform on `seed:psy:listen:<kind>:<week>` lands under `ECONOMY.psychologist.listenClarity`
at the rung; on a miss the standing ambiguous wording prints, byte-identical.

`voice` is her **birth** temperament (who-she-is §3's fence – the voices read birth, never T7's
expressed reading).

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `sunny/open` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and there is no ask hidden in it – she does not mind who knows | `draft` |
| 2 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `sunny/private` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and the ask is the part she leaves out – she wants it kept between us | `draft` |
| 3 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `fiery/open` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and she has drawn no line round it – she does not mind who knows | `draft` |
| 4 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `fiery/private` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and she has drawn a line round it – she wants it to go no further | `draft` |
| 5 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `quiet/open` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and it is not a thing she is keeping – it can be ordinary news | `draft` |
| 6 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `quiet/private` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and it is to stay where it is – with us, and no further | `draft` |
| 7 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `deep/open` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and that is the whole of it – she is not asking us to keep anything | `draft` |
| 8 | `src/engine/world/lifeBeat.ts` · `MET_HEADING_HEARD` · `deep/private` | the `'met'` card's heading, the week the parent is told there is someone – only when the listen year is worked and its coin lands under `listenClarity` (voice = her BIRTH temperament / her drawn `wants`) | There is someone, and it is hers to keep – never ours to pass on | `draft` |
| 9 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `sunny/open` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life, and she does not mind who knows. There was no ask hidden in it. | `draft` |
| 10 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `sunny/private` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life, and it is to stay between us. The ask was in the part she left out. | `draft` |
| 11 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `fiery/open` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life. No line drawn round it, and we took it as it came. | `draft` |
| 12 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `fiery/private` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life. She drew a line round it, and we read the line. | `draft` |
| 13 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `quiet/open` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life, and it was never a thing she was keeping. That was understood. | `draft` |
| 14 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `quiet/private` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life, and it is to go no further than us. That was understood. | `draft` |
| 15 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `deep/open` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life. She asks nothing of us about it, and nothing needed adding. | `draft` |
| 16 | `src/engine/world/lifeBeat.ts` · `MET_EVENT_HEARD` · `deep/private` | the kept feed row written the same week, and the album keeps it for the career (voice / `wants`) | There is someone in her life. It is hers to keep, and we knew it without being asked. | `draft` |
| 17 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `sunny/told-now/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. Being alright comes first with her, and the asking after – she wants the room to herself | `draft` |
| 18 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `sunny/told-now/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. Being alright comes first with her, and the asking after – she does not want to be on her own with it | `draft` |
| 19 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `sunny/told-late/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. With her the alright comes first – she wants the room to herself | `draft` |
| 20 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `sunny/told-late/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. With her the alright comes first – she does not want to be on her own with it | `draft` |
| 21 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `fiery/told-now/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. A subject shut fast is shut with her – she wants the room to herself | `draft` |
| 22 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `fiery/told-now/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. A subject shut fast is not a door shut, with her – she does not want to be on her own with it | `draft` |
| 23 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `fiery/told-late/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. A shut subject is shut with her – she wants the room to herself | `draft` |
| 24 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `fiery/told-late/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. A shut subject is not a shut door with her – she does not want to be on her own with it | `draft` |
| 25 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `quiet/told-now/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. The arrangements are where she puts herself – and what she wants is the room to herself | `draft` |
| 26 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `quiet/told-now/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. The arrangements are where she puts herself – and what she wants is somebody in the room | `draft` |
| 27 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `quiet/told-late/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. The arrangements always come first with her – she wants the room to herself | `draft` |
| 28 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `quiet/told-late/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. The arrangements always come first with her – she wants somebody in the room | `draft` |
| 29 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `deep/told-now/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. With her the size of a thing is never the size of the words – she wants the room to herself | `draft` |
| 30 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `deep/told-now/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | It is over. With her the size of a thing is never the size of the words – she does not want to be on her own with it | `draft` |
| 31 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `deep/told-late/space` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. Few words are not a small thing with her – she wants the room to herself | `draft` |
| 32 | `src/engine/world/lifeBeat.ts` · `ENDED_HEADING_HEARD` · `deep/told-late/company` | the `'ended'` card's heading, on both registers (voice / told-now vs told-late / her drawn read) | There was someone and it is already over. Few words are not a small thing with her – she wants somebody in the room | `draft` |
| 33 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `sunny/space` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she wants the room to herself. | `draft` |
| 34 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `sunny/company` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The alright always comes first with her – she does not want to be on her own with it. | `draft` |
| 35 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `fiery/space` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she wants the room to herself. | `draft` |
| 36 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `fiery/company` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The heat is never the measure of it – she does not want to be on her own with it. | `draft` |
| 37 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `quiet/space` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she wants the room to herself. | `draft` |
| 38 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `quiet/company` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. The arrangements always come first with her – she does not want to be on her own with it. | `draft` |
| 39 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `deep/space` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she wants the room to herself. | `draft` |
| 40 | `src/engine/world/lifeBeat.ts` · `ENDED_EVENT_HEARD` · `deep/company` | the kept feed row of a told-LATE ending only – ruling O leaves the told-now row read-free in both arms (voice / read) | There had been someone in her life, and it was over before we heard of it. Few words are never a small thing with her – she does not want to be on her own with it. | `draft` |

## 6. T8 – the counsel seat

`src/engine/world/lifeBeat.ts` – **11 strings**, 0 ruled / 11 draft.

| # | home (`file` + constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| 1 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.plain/worn` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is tired the way a long season makes a person tired, and tired has an end to it." | `draft` |
| 2 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.plain/strained` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. What she is short of is a room where the answer is already yes, and that is not a room I can build from a call." | `draft` |
| 3 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.plain/own` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Nothing is sitting on top of this one. She is clear, she has been clear for a while, and being clear is not a symptom." | `draft` |
| 4 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.breakup/worn` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. Underneath it she is also tired, and those are two different things to be." | `draft` |
| 5 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.breakup/strained` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. She has been carrying it a long way from home, and distance makes a weight feel permanent when it is not." | `draft` |
| 6 | `src/engine/world/lifeBeat.ts` · `PSY_COUNSEL.breakup/own` | his card, raised the same tick as the coach's after the parent answers her `stop` row, while the seat is WORKING that week – the register half is the live `spiritShock.kind` or `plain`, the driver half the coach's own read | Her psychologist rang that evening, after the coach. "Something outside the court landed on her and has not lifted. What she wants is her own and I would not argue it – only that a want stated this month is partly the month." | `draft` |
| 7 | `src/engine/world/lifeBeat.ts` · `PSY_HEADING` | the parent's frame over that card, keyed on nothing | She wants to stop, and her psychologist has asked for a word too, before we answer | `draft` |
| 8 | `src/engine/world/lifeBeat.ts` · `LIFE_BEAT_OPTIONS['fork-psy'][0].label` | the first button on that card (priced 0 in both registers) | Thank the psychologist for the straight read | `draft` |
| 9 | `src/engine/world/lifeBeat.ts` · `LIFE_BEAT_OPTIONS['fork-psy'][1].label` | the second button on that card (priced 0 in both registers) | Say we will keep it in mind when we answer | `draft` |
| 10 | `src/engine/world/lifeBeat.ts` · `ANSWER_EVENT['fork-psy'].straight` | a kept feed row, the week the parent answers with the first button | Her psychologist called about her wanting to stop. We said thank you for the straight read. | `draft` |
| 11 | `src/engine/world/lifeBeat.ts` · `ANSWER_EVENT['fork-psy'].keep` | a kept feed row, the week the parent answers with the second button | Her psychologist called about her wanting to stop. We said we would keep it in mind. | `draft` |

## 7. The mechanical checks – every verdict, and nothing fixed

Run from log files the commands themselves appended, mtimes newer than each run's start; no pipe,
no background notification (the wave's own count of that lie stands at ten).

| check | verdict |
| --- | --- |
| **R15-7's pronoun machine** (`tests/coach-voice.test.ts`) | **GREEN.** `Test Files 3 passed (3) · Tests 62 passed (62) · VITEST_EXIT=0` – run together with `tests/wave5-psychologist-listen.test.ts` and `tests/wave5-psy-counsel.test.ts`. It is a corpus sweep over every `.ts`/`.vue` under `src/` with comments stripped, so all 82 strings are inside it. An independent sweep of the 82 for `\b(he\|his\|him\|himself)\b` also returns **0**. |
| **Short dash only** (`–` U+2013, never the em-dash U+2014) | **CLEAN. 0** em-dashes in the 82 strings; 52 of them carry the house `–` (U+2013). Swept on the ADDED LINES of the diff, not the diff text: **0** em-dashes in any added `src/` line, and **0** in any added line of `src`+`tests`+`tools`+`docs` except four, all of them the *lints that ban it* (a `.not.toMatch` whose pattern IS the em-dash). ⚠ **The warned-of false alarm did not reproduce**: **0** hunk headers in the whole wave diff carry an em-dash. The trap here is the opposite one – a naive grep flags the four test lines. |
| **No Cyrillic in any `<template>`** | **CLEAN.** Every `.vue` under `src/` walked, template region cut and template comments stripped: **0** Cyrillic characters. (`SupportStaffTab.vue`'s Cyrillic is in `<script>` comments – the owner's own words, exempt by `coach-voice.test.ts`'s own header.) |
| **No Cyrillic in any player-facing string** | **CLEAN. 0** of the 82. |
| **No digits, no prices, no `amountCents` in any life line** | **CLEAN.** The 53 life strings (T4, T5, T6, T8) contain **0** digits and **0** `$`; the T8 answer row is written through the one shared `addEvent` at the foot of `answerLifeBeat` (`type: 'info'`, no `amountCents`), and both receipts are `addEvent` with no `amountCents` and no category. ⚠ **Two T2 strings do carry a figure, correctly and by design, and they are not life lines**: the hire confirm (`${psychologistSalary.value} a week`) is a purchase confirm, and the ledger row `Psychologist – weekly salary` is an `'expense'`/`'staff'` row whose `amountCents` is the point of it. The rung-change feed row interpolates a LABEL, not a number, deliberately. |
| **Pool completeness** | **CLEAN** – see §7a. |
| **T6's confidentiality lint** (he coaches the parent, never reports her sessions) | **GREEN, and it still sweeps every remaining cell.** It walks `everyLegible()`, which the same file asserts is **40** – and it carries a positive control (`expect(all.map(c => c.text)).toContain('There is someone in her life. It is hers to keep, and we knew it without being asked.')`) so a sweep over an empty set cannot pass. 14 banned substrings (`psychologist`, `session`, `says she`, …) plus the masculine-pronoun assertion, per cell. |
| **T6's no-telling lint** (no legible cell may assert a telling) | **GREEN, and it still sweeps every remaining cell.** Same 40-cell walk, its own positive control (`'There is someone, and she has drawn a line round it – she wants it to go no further'`), 13 banned substrings led by the widened `telling`. ⚠ Ruling O shrank `ENDED_EVENT_HEARD` from 16 to 8 and the sweep followed it: the ended-row axis is now `voice × read`, and the file's own ruling-O case separately pins the told-now row byte-identical across the toggle for all four voices and both reads. |
| **Ruling G.3 – no college-freeze refusal drafted** | **OBEYED.** **0** of the 82 strings name college, the programme or the freeze. `COLLEGE_FREEZE_REFUSAL` lives at `src/engine/world/constants.ts:55`, was present at `4ceb7c0d`, and the wave's `src/` diff touches it **0** times; all three new commands (`hirePsychologist`, `setPsychologistRung`, `setPsychologistFocus`) reach it through `guardNotEnded` and each says so in its own comment. |
| **Duplicate / near-duplicate strings** | **0 exact duplicates** among the 82. Near-duplicates: see §8, items 5–7. |

### 7a. Pool completeness – the cell count per pool, and the arithmetic

Every pool is a `Record` **total by type** over its declared axes, so the count is a restatement of
the types and the compiler is the guarantee. Axes: `Temperament` = 4 (`sunny`, `fiery`, `quiet`,
`deep`) · `LoveEpisode['wants']` = 2 (`open`, `private`) · `EndsRegister` = 2 (`told-now`,
`told-late`) · `EndsRead` = 2 (`space`, `company`) · `PsyRegister` = 2 (`plain`, `breakup`) ·
`ForkStopDriver` = 3 (`worn`, `strained`, `own`).

| pool | shape | arithmetic | cells |
| --- | --- | ---: | ---: |
| `MET_HEADING_HEARD` | voice × wants | 4 × 2 | **8** |
| `MET_EVENT_HEARD` | voice × wants | 4 × 2 | **8** |
| `ENDED_HEADING_HEARD` | voice × register × read | 4 × 2 × 2 | **16** |
| `ENDED_EVENT_HEARD` | voice × read (told-late only) | 4 × 2 | **8** |
| | | **the legible total** | **40** |
| `PSY_COUNSEL` | register × driver | 2 × 3 | **6** |

**40 = 8 + 8 + 16 + 8**, which is ruling O's own number: the ruling struck the told-now half of
`ENDED_EVENT_HEARD` (16 → 8) and «the wave's new string count falls from 48 to 40». Counts extracted
from the source text, not transcribed; `tests/wave5-psychologist-listen.test.ts` §B asserts the same
40 twice – once as the axis arithmetic, once as the literal.

**The wave's total of 82** = the 40 legible cells + `PSY_COUNSEL`'s 6 + T8's other 5 (1 heading,
2 option labels, 2 answer rows) + T4's 1 + T5's 1 + T2's 15 + T3's 14.

### 7b. The doc gates

No gate run is owed by a doc-only commit; these two are, and both were read out of a log file the
command itself appended.

| gate | verdict, quoted |
| --- | --- |
| `node scripts/doc-facts.mjs` | `doc facts: ok – schema v76, live wave round 41` · `DOC_FACTS_EXIT=0` |
| `npm run context:audit` | `result: ok` · `CONTEXT_AUDIT_EXIT=0` – 394 Markdown files, `0 grandfathered docs edited without classifying (136 of 136 hashed)`. Its size lines are the standing WARNINGS the script itself calls «warnings, never a failure»; this wave adds `src/engine/world/psychologist.ts - 25,119 comment characters over 20,000` and `src/engine/world/lifeBeat.ts - 3,641 lines over 1,000` to them. |

## 8. Flagged for the architect's read – NOT fixed, NOT touched

1. ⚠ **`PSY_COUNSEL.breakup.own`, the clause «only that a want stated this month is partly the
   month»** – already on the architect's list (the reading is right, the phrasing clumsy). Carried
   here unchanged.
2. ⚠ **`PSY_HEADING`'s «too»** – already on the architect's list, and load-bearing on the coach
   always calling first. For the read: the shipped `COUNSEL_HEADING` is «She wants to stop, and her
   coach has asked for a word before we answer»; the psy heading inserts «too» and a comma before
   «before we answer». The claim IS structurally true – both rows are raised on one condition
   (`counselDriver !== null`), his second, and the queue answers in `lifeLog` order – so the word is
   a fact about the queue. It is also the only word in the pair that would go false if the coach's
   raise ever moved.
3. ⚠⚠ **`RECOVERY_RECEIPT` («She came back sooner than last time.») is false on a reachable state,
   and it is one of the nine RULED rows.** `spiritShock` is a single nullable record
   (`{ week, kind, weeks? } | null`) and the engine keeps **no** count or history of previous
   shocks – grepped: no `shockCount`, no `lastShock`, nothing. `recoveryReceiptEarned` asks only
   «were at least half this shock's weeks worked», so the line prints on a career's **first ever**
   shock, where there is no last time to be sooner than. This is the class of error T6 found six of.
   It is the spec §2's own sentence, so the fix is a ruling, not a builder's edit.
4. ⚠⚠ **`PSY_COUNSEL.breakup.strained`'s clause «She has been carrying it a long way from home, and
   distance makes a weight feel permanent when it is not» asserts a distance the driver does not
   carry.** `strained` is a BOND reading and nothing else – `stopRootsOf` computes it as the
   distance BELOW `ECONOMY.bond.start`, i.e. a strained HOME. The beat is reachable at every life
   stage, including a girl still living under the roof who has never been far from it. Same family
   as the T6 telling errors: true-sounding, false on part of the ladder.
5. **The told-late ending says the same observation twice in one tick, under the listen focus.** The
   card's heading (`ENDED_HEADING_HEARD[voice]['told-late'][read]`) and the album's row
   (`ENDED_EVENT_HEARD[voice][read]`) are raised together, and for three of the four voices the
   middle clause is the same sentence or one word off: `quiet` is identical («The arrangements
   always come first with her»); `deep` differs by `not`/`never`; `sunny` by word order. `fiery` is
   the one that differs outright. Both surfaces then close on the SAME read tail by the pools' own
   deliberate rule. Ruling O settled which surfaces exist – this is a question about the words on
   the two that do.
6. **`PSY_COUNSEL`'s six cells share a two-clause opening** – «Her psychologist rang that evening,
   after the coach.» on all six, plus a per-column second clause shared by three («Nothing is
   sitting on top of this one.» / «Something outside the court landed on her and has not lifted.»).
   The pool's own note calls this «the point of the family», the coach's «The tennis is not the
   question» read across. Reported, not judged.
7. **`ANSWER_EVENT['fork-psy']`'s two rows share their first sentence** («Her psychologist called
   about her wanting to stop.»), which is `'fork-counsel'`'s established shape one pool over.
8. **Two strings are never painted** – `psychologist.dial.label` and `psychologist.focus.label` are
   `:aria-label` on the two radiogroups and reach no pixel. They are still copy, and assistive tech
   reads them, so they are in the table; the вычитка should know it cannot see them in a playtest.
9. **Two strings never reach a live card** – `PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL` (the row is hidden
   while unhired) and `PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL` / the rung-roster throw (a stale screen
   naming something the roster does not hold). They are the engine's half of the R10-16 one-story
   doctrine and exist so a refused click has a sentence.
10. **A claim the player cannot check, by construction, on both receipts.** `COOLHEAD_RECEIPT` says
    the big points feel slower; `composure` is never shown as a number (the radar carries a fogged
    estimate into a polygon, decisions.md #11 «axes without numbers»). `RECOVERY_RECEIPT` says she
    came back sooner; `spirit` is never shown as a number either (the fog law). That unverifiability
    is the point of the receipts – they are the only channel those two focuses have – but it is also
    exactly «a promise of a number the player cannot check», so it is named rather than assumed
    settled.
11. **Every trigger in the table is stated in one clause.** There is no string in this wave whose
    trigger the builder could not state; the nearest thing to an exception is `PSY_COUNSEL`, whose
    clause needs two facts (the coach's driver and the live shock's kind) and is written as such.

## 9. What the brief and the record did not account for

1. ⚠ **The builder brief's own T9 list (§2) has six items and does not include T5's sentence.** It
   names «6. The recovery receipt line (T4)» and stops. `COOLHEAD_RECEIPT` exists anyway, and the
   reason is in `development.ts`'s own note: the spec §2 gives every focus its sentence and on drift
   the spec wins (the brief's single-source rule), and T5's receipt is measured to be that focus's
   ONLY channel. The architect's own grouping for T9 does list it; the brief does not.
2. ⚠⚠ **Two of the spec §2's four ruled sentences were deliberately NOT transcribed, and both
   departures look right.** The spec gives `listen` «He is teaching you to hear what she does not
   say.» – which opens with a masculine pronoun R15-7 forbids and describes the seat reporting – and
   `herself` «She has been talking to someone about the things she never says to us.» – which
   reports her sessions, against the 09.09 re-cut. The code's `PSY_FOCUS_LINE.listen` and
   `.herself` are drafts written in their place. Recorded so the вычитка is not comparing against a
   spec row the code never took.
3. **No shipped string moved.** Measured rather than assumed: the removed lines of the `src/` diff
   contain no player-facing string literal at all. `ENDED_NOW_EVENT`'s rewrite (named at length in
   `lifeBeat.ts`'s comments as T6's) happened in **wave 4** – the sentence is byte-identical at
   `4ceb7c0d` – so nothing in that comment is this wave's diff.
4. **One added literal is not in the table and is not player-facing**: the throw
   `` `A fork-psy row carries no register and driver: ${detail}` `` in `lifeBeatSaid`'s `'fork-psy'`
   case. It guards a hand-built row and is unreachable from any command; it is raised at snapshot
   build time, not printed as a refusal. Named because a throw in this codebase is sometimes copy.
5. **A stale count in a test name, not in any string**:
   `tests/wave5-psychologist-listen.test.ts` still titles its house-style case «house style on all
   forty-**eight**» while walking the 40 that survived ruling O. Green, correct, misnamed. Reported,
   not fixed (T9 touches no source file).
6. **The architect's em-dash warning did not reproduce.** No hunk header in the wave's diff carries
   an em-dash; the four em-dashes in the diff are the lints that ban it. The instruction to check
   added lines rather than diff text is still the right instruction – it is what kept those four out
   of this report as findings.
