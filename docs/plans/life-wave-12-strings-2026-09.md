---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-23
---

# Wave 12 – the strings table (the parting)

Every player-facing string the wave adds, for his pass (invariant 4): id · home · the string ·
status. ⚠ The provenance check is plain `grep DRAFT` on this file (wave 8's F2 ruling), and the
whole table is pinned to the source character for character by
`tests/wave12-strings-roundtrip.test.ts` – **the TABLE and the TEST own the count, this prose
deliberately states none** (wave 9's finding: a count written in prose survives a full gate because
no test reads it). The home column is a path, and the pin holds each string against that file's
source.

⚠ **Not in this table, deliberately:** the four numbers of `ECONOMY.divorce` and the shock row
`-27/-42` – those are constants rather than copy, they are flagged DRAFT at their own sites, and
§10 of the spec carries what the bench measured them doing. This table is words.

⚠ **Nothing here re-words a shipped string.** Every row below is NEW copy for a card, a row or a
line that did not exist before this wave; not one existing sentence moved (invariant 4).


## 1. The card – her voice, the dry rung and the parent's frame

`src/engine/world/lifeBeat.ts` §3m. Her line is keyed voice x presence (under the roof, or away),
which is the ending's own shape one rung up; the dry rung is what a `strained` or `cold` house is
told instead. ⚠ The two headings carry her READ – the same `seed:life:ends:<week>:react` draw the
break-up card reads, and the only surface that carries it at every bond band.

| id | home | text | status |
| --- | --- | --- | --- |
| P1 | `src/engine/world/lifeBeat.ts` | She said it at the table, and said the kind part first. "We are ending it. It is not a disaster and I am not in pieces. I wanted you to hear it from me." | `DRAFT` |
| P2 | `src/engine/world/lifeBeat.ts` | She rang in the evening and said the kind part first. "We are ending it. It is not a disaster and I am not in pieces. I wanted you to hear it from me." | `DRAFT` |
| P3 | `src/engine/world/lifeBeat.ts` | She said it standing up, in one go, and did not sit down afterwards. "The marriage is over. It has been decided. I am not going through it." | `DRAFT` |
| P4 | `src/engine/world/lifeBeat.ts` | She rang, said it in one go, and the call was short. "The marriage is over. It has been decided. I am not going through it." | `DRAFT` |
| P5 | `src/engine/world/lifeBeat.ts` | She came by about something else and this was underneath it. "We are separating. There is a lot to sort out, so I will be slow for a while." | `DRAFT` |
| P6 | `src/engine/world/lifeBeat.ts` | She sent the month's dates through, and this was under them. "We are separating. There is a lot to sort out, so I will be slow for a while." | `DRAFT` |
| P7 | `src/engine/world/lifeBeat.ts` | She let the evening get late before she said anything at all. "It is over. We were a long time getting here. I would rather not say more than that." | `DRAFT` |
| P8 | `src/engine/world/lifeBeat.ts` | The call went quiet twice before she said it. "It is over. We were a long time getting here. I would rather not say more than that." | `DRAFT` |
| P9 | `src/engine/world/lifeBeat.ts` | The marriage is over. She is getting on with the week and not talking about it. | `DRAFT` |
| P10 | `src/engine/world/lifeBeat.ts` | Her marriage is over, and she wants the room to herself | `DRAFT` |
| P11 | `src/engine/world/lifeBeat.ts` | Her marriage is over, and she does not want to be on her own with it | `DRAFT` |

## 2. The four answers, and the four rows they leave

`src/engine/world/lifeBeat.ts` – `LIFE_BEAT_OPTIONS.divorced` and `ANSWER_EVENT.divorced`.
⚠ The labels are UNTOUCHED BY THE FLIP: same four sentences under both readings, because a button
that changed its words with its price would be the meter this layer refuses to build, one step
removed. ⚠ And the third label is the one place this pool parts from the break-up's – «put it
right» is a power the game does not hold once the marriage is already over.
⚠⚠ **The fourth says «them» and not «him», and that is the schema rather than a style choice:**
`LoveEpisode` persists NO GENDER at any point in the arc – arrival, wedding or ending – so the
pronoun would be a guess however married the two of them are. The first draft said «him» and
`tests/coach-voice.test.ts`'s R15-7 sweep refused it.

| id | home | text | status |
| --- | --- | --- | --- |
| P12 | `src/engine/world/lifeBeat.ts` | Give her room, and say we are here | `DRAFT` |
| P13 | `src/engine/world/lifeBeat.ts` | Keep her company, and stay close this week | `DRAFT` |
| P14 | `src/engine/world/lifeBeat.ts` | Offer to help her sort out the practical side | `DRAFT` |
| P15 | `src/engine/world/lifeBeat.ts` | Say she is better off without them | `DRAFT` |
| P16 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We gave her room, and said we were there. | `DRAFT` |
| P17 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We kept her company through the week. | `DRAFT` |
| P18 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We offered to help with the practical side of it. | `DRAFT` |
| P19 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We said she was better off without them. | `DRAFT` |

## 3. The two rows the week leaves on the feed

The news row (`type: 'life'`) and the album's line (`type: 'milestone'`). ⚠ This is the ONE week
in the game that writes to both channels, so the two are deliberately written not to stutter: the
first says what the week did, the second what the career reads back later.

| id | home | text | status |
| --- | --- | --- | --- |
| P20 | `src/engine/world/lifeBeat.ts` | Her marriage ended this week, and there is nobody in her life now. | `DRAFT` |
| P21 | `src/engine/world/lifeBeat.ts` | The marriage ended. Nothing about it was decided in this house, and the phone still rang. | `DRAFT` |

## 4. The album's own label

`src/engine/world/album.ts` – the scroll row, with no detail cell beside it. ⚠ It settles
nothing: no fault, no duration, no name, no money – the world holds none of them.

| id | home | text | status |
| --- | --- | --- | --- |
| P22 | `src/engine/world/album.ts` | The marriage ended | `DRAFT` |

## 5. The diary – the weeks after

`src/engine/diary/weekNotes.ts` – `DIVORCED_WORDS`, four voices inside the 80-character scrap
budget, licensed for `DIVORCED_WEEKS` weeks after it. ⚠ Every line is the PARENT reporting a week:
no interior stated as fact, no husband named, no fault and no date.

| id | home | text | status |
| --- | --- | --- | --- |
| P23 | `src/engine/diary/weekNotes.ts` | She talked about the flat, and about the diary, and not about the rest. | `DRAFT` |
| P24 | `src/engine/diary/weekNotes.ts` | She trained. The subject came up once and went straight back down. | `DRAFT` |
| P25 | `src/engine/diary/weekNotes.ts` | Boxes in her hall this week. She had the week planned to the hour. | `DRAFT` |
| P26 | `src/engine/diary/weekNotes.ts` | She was on her own a lot, and did not seem to mind it as much as we did. | `DRAFT` |

## 6. The fork's aftermath – the architect's proposal on his «предложи что-то»

`src/engine/diary/weekNotes.ts` – `FORK_AFTERMATH_WORDS`, four voices x two arms, on the ONE week
the fork resolves. ⚠⚠ THE `against` ARM PASSES NO VERDICT – the fact in her own register and then
nothing: no «should», no «wrong», no consequence foretold. ⚠ And neither arm names the want, because
the line is about whether she was heard and the fork's own screen said which of the three it was.
⚠ This is the one section of this table the owner may strike whole; the wave loses nothing else.

| id | home | text | status |
| --- | --- | --- | --- |
| P27 | `src/engine/diary/weekNotes.ts` | She thanked us twice, and then talked about something else entirely. | `DRAFT` |
| P28 | `src/engine/diary/weekNotes.ts` | She took it well, out loud. She said less than usual for the rest of it. | `DRAFT` |
| P29 | `src/engine/diary/weekNotes.ts` | She was out the door before the sentence finished. That is a yes from her. | `DRAFT` |
| P30 | `src/engine/diary/weekNotes.ts` | She heard it, said fine, and trained like the week owed her something. | `DRAFT` |
| P31 | `src/engine/diary/weekNotes.ts` | She wrote the next month out that evening, without being asked to. | `DRAFT` |
| P32 | `src/engine/diary/weekNotes.ts` | She asked what the dates were now, and wrote them down in the same pen. | `DRAFT` |
| P33 | `src/engine/diary/weekNotes.ts` | She did not say much. She has not put the racquet down all week either. | `DRAFT` |
| P34 | `src/engine/diary/weekNotes.ts` | She said she understood. She has said nothing about it since. | `DRAFT` |

## 7. The booth

`src/viz/commentary.ts` – two lines for the story told RIGHT and two for the story told WRONG,
the second pair existing because the break-up's own sentence has one. ⚠ `${who}` is the speaking
name the booth already uses. ⚠ The booth may claim what it can see from its own seat and what the
front pages in front of it are running, and nothing about how she feels.

| id | home | text | status |
| --- | --- | --- | --- |
| P35 | `src/viz/commentary.ts` | The papers have the marriage over this week, and ${who} came out for this one on her own. | `DRAFT` |
| P36 | `src/viz/commentary.ts` | It is a divorce, and every front page has run it – and here ${who} is, serving at two in the afternoon. | `DRAFT` |
| P37 | `src/viz/commentary.ts` | The papers have ${who} divorcing this week, and no two of them tell it the same way. | `DRAFT` |
| P38 | `src/viz/commentary.ts` | A divorce on every front page beside ${who}, and not one of them has the same story. | `DRAFT` |
