---
type: design-guide
status: current
area: narrative
canonical: false
last-reviewed: 2026-08-19
---

# Human-voice guide

## The voice in one sentence

A parent notices one small, honest thing about her week and leaves enough unsaid for the player to
feel it.

## Voice matrix

| Surface | Speaker | What they know | Register |
| --- | --- | --- | --- |
| Diary / weekly story | Parent | Snapshot facts and plausible observed detail | Warm, restrained, specific |
| School | Parent in the shared routine | Class, exams, mornings, household detail | Close and lightly amused |
| After school, under 22 | Parent, with growing autonomy | Shared life but fewer permissions | Negotiation rather than control |
| College | Parent at episodic distance | Year outcomes, calls, money, return | Proud without grading |
| Independent, 22+ | Parent outside her household | Calls, texts, visits, photos, family chat | Close, never omniscient |
| Radar | Coach | Evidence from matches | Technical and candid |
| Match commentary | Broadcaster | The generated match record | Immediate and energetic |
| System / money / eligibility | Product | Exact state and consequence | Plain, short, unambiguous |

`22` is a narrative boundary, not a persisted claim that every person moves out on that birthday.
Do not write rent, roommates or a specific address unless the world actually carries them.

## A line that sounds human

Prefer:

- an object: a mug, spare key, draw sheet, charger, ice pack;
- a behaviour: she changes the subject, sends a photograph, calls twice;
- slight friction: dinner fitted around practice, the cake waited;
- uneven cadence: one full sentence followed by a fragment, or the reverse;
- humour belonging to the family, not a punchline delivered by the game;
- a contraction where somebody would naturally use one;
- silence when the pool has nothing worth saying.

Avoid:

- “journey”, “dream”, “warrior”, “chapter”, “destiny” and motivational conclusions;
- naming an emotion when behaviour can carry it;
- three polished clauses that explain the moment completely;
- rephrasing a UI field as prose (“She is 24 today”);
- repeating one sentence frame across a catalogue;
- an adult parent seeing breakfast, laundry or a bedroom without a route to know it;
- congratulations after a loss or an injury;
- novelty synonyms that make the same fact harder to understand.

## Examples

| Flat or age-blind | Preferred |
| --- | --- |
| “She is 24 today.” | “Twenty-four. We found a gap in her calendar.” |
| “She asked for the headphones, and got them.” | “Twenty. The headphones, and a smile she tried to hide.” |
| “She got a different present.” | “A pause, then a very good thank-you.” |
| “Training, sleep, repeat.” at 27 | “Training, laundry, sleep, repeat.” |
| “We said no. She went anyway.” at 25 | “By the time we replied, she had booked the court.” |
| “Homework by the court” during adult rehab | “A photo from rehab: three bands, one coffee, no patience.” |

## Facts and variation

1. Carry the fact into the copy system; do not infer it from a sentence in the news feed.
2. Put age-sensitive wording behind `DiaryLifeStage`, not scattered age comparisons.
3. Keep selection deterministic and presentation-only. Use a purpose-scoped seed; never MAIN.
4. A birthday on a travel or injury week must say both facts or deliberately choose the louder one.
5. Write at least six lines for a recurring state before claiming it is varied. Prefer twelve for a
   weekly state.
6. Preserve the phone budgets: diary scraps and journey notes are at most 80 characters; calendar
   notes are at most 56.

## Review checklist

- Could the speaker know this?
- Is it true at this age and life stage?
- Does the line observe rather than assess?
- Does another line begin and end the same way?
- Is the humour inside the situation?
- Does it still work after a loss, injury or bad financial week?
- Is direct system copy being made needlessly literary?
- Are school-age phrases mechanically unlicensed at 22+?
- Is there a mounted or behavioural test when the words affect layout or interaction?
