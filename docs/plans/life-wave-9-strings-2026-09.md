---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-21
---

# Wave 9 – the strings table

Every player-facing string this wave adds, in the standing format: id · where it shows · the draft ·
status. ⚠ **All of them are DRAFTS awaiting his pass** (invariant 4). The eight motherhood lines he
passed on 21.09 are NOT in this table – they shipped in wave 8b and nothing here touches them.

⚠ The provenance check is plain `grep DRAFT` on this file (wave 8's F2 ruling); nothing clever.

## 1. T4 – the motherhood band in her four voices

`src/engine/diary/weekNotes.ts` · `MOTHERHOOD_WORDS` – **28 strings**, seven bands × four voices.
The licence is written once per band and the words once per voice, so a voice can never be
selectable on a week another voice is not.

⚠ **Every line is inside the 80-character scrap budget**, which is the diary's own pin and not a
style note: nineteen of the first drafts were over it and were rewritten rather than the budget
being argued with.

⚠ **Husband-agnostic by test** – the walk in `tests/week-notes.test.ts` refuses any line in this
band that names a partner, on his decoupling ruling («развелись и развелись, жизнь продолжается»).

⚠ **No figure, no meter, no due date** – the band's own discipline, inherited from his eight.

| # | voice | band | the string, verbatim | status |
| ---: | --- | --- | --- | --- |
| M1 | `sunny` | `announced` | She told us at the door, still in her coat. "It is the good kind of news." | `DRAFT – awaiting his pass` |
| M2 | `sunny` | `early` | She rang while cooking. "No entries for a while. I plan them anyway." | `DRAFT – awaiting his pass` |
| M3 | `sunny` | `mid` | She sent a photo of the kit bag. "Not yet. I like looking at it." | `DRAFT – awaiting his pass` |
| M4 | `sunny` | `last` | She called after her walk. "Heavy, slow, and oddly happy about it." | `DRAFT – awaiting his pass` |
| M5 | `sunny` | `birth` | She rang in the morning, laughing. "We are all here. Come when you can." | `DRAFT – awaiting his pass` |
| M6 | `sunny` | `postpartum` | She sent a voice note at an odd hour. "Tired, and I do not mind." | `DRAFT – awaiting his pass` |
| M7 | `sunny` | `returned` | She rang from the car park. "My legs remember more than I did." | `DRAFT – awaiting his pass` |
| M8 | `fiery` | `announced` | She said it before her coat was off. "Everything changes. Good." | `DRAFT – awaiting his pass` |
| M9 | `fiery` | `early` | She left a voice note at dawn. "No entries. I will go quietly mad." | `DRAFT – awaiting his pass` |
| M10 | `fiery` | `mid` | She called mid-pace, walking. "I am not sitting still for this." | `DRAFT – awaiting his pass` |
| M11 | `fiery` | `last` | She rang late. "Everyone says rest. I have never rested in my life." | `DRAFT – awaiting his pass` |
| M12 | `fiery` | `birth` | She called, hoarse. "Hardest thing I have ever done, and I won." | `DRAFT – awaiting his pass` |
| M13 | `fiery` | `postpartum` | She messaged at three in the morning. "Awake again. I chose this." | `DRAFT – awaiting his pass` |
| M14 | `fiery` | `returned` | She rang from the courts. "Everything hurts. I have missed it." | `DRAFT – awaiting his pass` |
| M15 | `quiet` | `announced` | She said it plainly, at the table, and then asked about our week. | `DRAFT – awaiting his pass` |
| M16 | `quiet` | `early` | She called briefly. "Nothing in the calendar. Strange, but fine." | `DRAFT – awaiting his pass` |
| M17 | `quiet` | `mid` | She rang on her way home. "Walked the long way. All quiet." | `DRAFT – awaiting his pass` |
| M18 | `quiet` | `last` | She called, unhurried. "Not long. I stopped counting out loud." | `DRAFT – awaiting his pass` |
| M19 | `quiet` | `birth` | She rang once, early. "She is here. I will call properly tomorrow." | `DRAFT – awaiting his pass` |
| M20 | `quiet` | `postpartum` | She called while the house was still. "Mostly sleeping. Mostly her." | `DRAFT – awaiting his pass` |
| M21 | `quiet` | `returned` | She rang after practice. "Hit for an hour. Nearly like it used to be." | `DRAFT – awaiting his pass` |
| M22 | `deep` | `announced` | She told us in her own time, late on. "I wanted to be sure first." | `DRAFT – awaiting his pass` |
| M23 | `deep` | `early` | She called, late. "The season carries on. That bothers me less than I thought." | `DRAFT – awaiting his pass` |
| M24 | `deep` | `mid` | She rang, thoughtful. "I think about what I will tell her about this." | `DRAFT – awaiting his pass` |
| M25 | `deep` | `last` | She called after dark. "It is close now. I have been sitting with that." | `DRAFT – awaiting his pass` |
| M26 | `deep` | `birth` | She rang, steady. "She is here. I do not know what I feel yet." | `DRAFT – awaiting his pass` |
| M27 | `deep` | `postpartum` | She called before the house woke. "Some mornings I just sit." | `DRAFT – awaiting his pass` |
| M28 | `deep` | `returned` | She rang from the road. "I am a different player. I want to meet her." | `DRAFT – awaiting his pass` |

## 2. What the wave adds beyond these

Nothing yet. T2 (the travel calculus) is a spirit cost with no words on any surface, and T3 (the
second pregnancy) re-enters wave 8's own machinery – it raises the SAME `'expecting'` card, whose
strings are wave 8's and already in his hands.

⚠ If T5's resilience bonus ships with anything the player can read, its strings land here.
