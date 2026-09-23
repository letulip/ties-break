---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-23
---

# Wave 12 – the strings table (the parting)

Every player-facing string the wave adds, for his pass (invariant 4): id · home · the string ·
status. ⚠ **His strings review was APPLIED on 23.09** – four structural findings and the
replacement sets, every row below carries the post-review text and the status says so; the
pre-review drafts live in this file's git history. The provenance check (wave 8's F2 ruling) is
mechanised by `tests/wave12-strings-roundtrip.test.ts`, which pins every row to the source
character for character AND pins the status cell – **the TABLE and the TEST own the count, this
prose deliberately states none** (wave 9's finding: a count written in prose survives a full gate
because no test reads it).

⚠ **Not in this table, deliberately:** the four numbers of `ECONOMY.divorce` and the shock row
`-27/-42` – those are constants rather than copy, they are flagged at their own sites, and §10 of
the spec carries what the bench measured them doing. This table is words.

⚠ **Nothing here re-words a string shipped before this wave.** Every row is copy for a card, a
row or a line that did not exist before the parting; not one pre-wave sentence moved (invariant 4).

## 1. The card – her voice, the dry rung and the parent's frame

`src/engine/world/lifeBeat.ts` §3m. ⚠ **The presence axis is GONE** (his review, must-fix 1): the
latch needs 23+, `independent` begins at 22 and `college` is an away stage too, so every divorce a
real career can produce is `away` – her line is one channel-honest string per voice, and the quotes
carry contractions (his 11.09 P2 ruling, the spoken register). The dry rung is what a `strained` or
`cold` house is told instead. ⚠ The two headings carry her READ – the same
`seed:life:ends:<week>:react` draw the break-up card reads, and the only surface that carries it at
every bond band; his review kept both untouched.

| id | home | text | status |
| --- | --- | --- | --- |
| P1 | `src/engine/world/lifeBeat.ts` | She called before the news could travel. "We're ending it. I'm all right. I wanted you to hear it from me." | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P2 | `src/engine/world/lifeBeat.ts` | She called and went straight to it. "The marriage is over. It's decided. I don't want to pick it apart." | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P3 | `src/engine/world/lifeBeat.ts` | She called about the next few weeks. "We're separating. There are things to sort out. I may go quiet for a bit." | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P4 | `src/engine/world/lifeBeat.ts` | The call went quiet before she said it. "It's over. That's all I can say about it today." | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P5 | `src/engine/world/lifeBeat.ts` | The marriage is over. The news did not come from her. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P6 | `src/engine/world/lifeBeat.ts` | Her marriage is over, and she wants the room to herself | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P7 | `src/engine/world/lifeBeat.ts` | Her marriage is over, and she does not want to be on her own with it | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 2. The four answers, and the four rows they leave

`src/engine/world/lifeBeat.ts` – `LIFE_BEAT_OPTIONS.divorced` and `ANSWER_EVENT.divorced`.
⚠ The labels are UNTOUCHED BY THE FLIP: same four sentences under both readings, because a button
that changed its words with its price would be the meter this layer refuses to build, one step
removed. ⚠ The third label is the one place this pool parts from the break-up's – «put it right»
is a power the game does not hold once the marriage is already over.
⚠⚠ **The fourth says «them» and not «him», and that is the schema rather than a style choice:**
`LoveEpisode` persists NO GENDER at any point in the arc – arrival, wedding or ending – so the
pronoun would be a guess however married the two of them are. The first draft said «him» and
`tests/coach-voice.test.ts`'s R15-7 sweep refused it.

| id | home | text | status |
| --- | --- | --- | --- |
| P8 | `src/engine/world/lifeBeat.ts` | Give her room, and say we are here | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P9 | `src/engine/world/lifeBeat.ts` | Stay close, without asking for the whole story | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P10 | `src/engine/world/lifeBeat.ts` | Offer to help with whatever needs sorting | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P11 | `src/engine/world/lifeBeat.ts` | Say she is better off without them | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P12 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We gave her room, and said we were there. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P13 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We kept her company that week. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P14 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We offered to help with what needed sorting. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P15 | `src/engine/world/lifeBeat.ts` | Her marriage ended. We said she was better off without them. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 3. The two rows the week leaves on the feed

The news row (`type: 'life'`) and the album's line (`type: 'milestone'`). ⚠ This is the ONE week
in the game that writes to both channels – his ruling of 23.09 keeps both – so the two are written
not to stutter: the first says the one fact (his review, must-fix 3: the old second clause claimed
an emptied life the world does not hold), the second what the family had and did not have a part in.

| id | home | text | status |
| --- | --- | --- | --- |
| P16 | `src/engine/world/lifeBeat.ts` | Her marriage ended this week. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P17 | `src/engine/world/lifeBeat.ts` | The marriage ended. We had no say in it, only in what we said next. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 4. The album's own label

`src/engine/world/album.ts` – the scroll row, with no detail cell beside it. ⚠ It settles
nothing: no fault, no duration, no name, no money – the world holds none of them. His review:
«exactly right».

| id | home | text | status |
| --- | --- | --- | --- |
| P18 | `src/engine/world/album.ts` | The marriage ended | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 5. The diary – the weeks after

`src/engine/diary/weekNotes.ts` – `DIVORCED_WORDS`, four voices inside the 80-character scrap
budget, licensed for `DIVORCED_WEEKS` weeks after it. ⚠ Written for an ADULT WHO LIVES ELSEWHERE
(his review, finding 4): only what reaches a parent down a phone line or a schedule – no flat, no
boxes, no counted mentions, no hour-by-hour access the household does not have.

| id | home | text | status |
| --- | --- | --- | --- |
| P19 | `src/engine/diary/weekNotes.ts` | She called about the court, the weather, the week ahead. Not the marriage. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P20 | `src/engine/diary/weekNotes.ts` | She trained. When the subject came up, she put it straight back down. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P21 | `src/engine/diary/weekNotes.ts` | She sent next week's dates. There was nothing else in the message. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P22 | `src/engine/diary/weekNotes.ts` | She called. We spoke about the week, not the ending. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 6. The fork's aftermath – the architect's proposal, kept by his «ок наверное»

`src/engine/diary/weekNotes.ts` – `FORK_AFTERMATH_WORDS`, four voices x two arms, on the ONE week
the fork resolves. ⚠⚠ Honestly framed (his review, must-fix 2): OCCASIONAL TEXTURE behind the
week-note coin and the pool pick, not guaranteed feedback – a guaranteed aftermath surface is a
backlog item. ⚠⚠ Every line is ANSWER-AGNOSTIC – college, tour and stop are invisible, because
«with her want» can mean agreeing she stops, so no line may imply training or schedules going on.
⚠ The `against` arm passes no verdict: the fact in her register and then nothing.

| id | home | text | status |
| --- | --- | --- | --- |
| P23 | `src/engine/diary/weekNotes.ts` | She thanked us, then changed the subject before it could turn solemn. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P24 | `src/engine/diary/weekNotes.ts` | She said all right, then asked about something else. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P25 | `src/engine/diary/weekNotes.ts` | She said yes before we had finished. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P26 | `src/engine/diary/weekNotes.ts` | She said fine. It landed like a full stop. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P27 | `src/engine/diary/weekNotes.ts` | She wrote the answer down and asked what came next. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P28 | `src/engine/diary/weekNotes.ts` | She wrote the answer down. Nothing beside it. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P29 | `src/engine/diary/weekNotes.ts` | She did not say much. Neither did we. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P30 | `src/engine/diary/weekNotes.ts` | She said she understood. She did not say she agreed. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |

## 7. The booth

`src/viz/commentary.ts` – two lines for the story told RIGHT and two for the story told WRONG,
the second pair existing because the break-up's own sentence has one. ⚠ `${who}` is the speaking
name the booth already uses. ⚠ The booth may claim only what the packet holds (his review,
finding 4): no match time, no word about her box or team, nothing about how she feels.

| id | home | text | status |
| --- | --- | --- | --- |
| P31 | `src/viz/commentary.ts` | The papers say the marriage is over. ${who} is here to play. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P32 | `src/viz/commentary.ts` | Every front page has the divorce. ${who} still has a match to play. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P33 | `src/viz/commentary.ts` | The papers have ${who} getting divorced. No two versions quite agree. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
| P34 | `src/viz/commentary.ts` | Every front page has the divorce. The story changes from one to the next. | `HIS REVIEW APPLIED 23.09 – awaiting his final pass` |
