---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-23
---

# Wave 11 – the strings table (the weight)

Every player-facing string the wave added, for his pass (invariant 4): id · home · the string ·
status. Assembled by the architect on 23.09 from the builder's report and the shipped source on
`main` after PR #154. ⚠ The provenance check is plain `grep DRAFT` on this file (wave 8's F2
ruling), and the whole table is pinned to the source character for character by
`tests/wave1011-strings-roundtrip.test.ts` – the TABLE and the TEST own the count, this prose
deliberately states none. A `#` in the home column means the pin compares the LIVE exported
value; a bare path means the pin holds the string against that file's source.

His three rulings of 23.09 already bind this corpus: the four extended announcement quotes STAND
(the wave-8 originals are superseded), the bereavement card keeps ONE unpriced answer, and the
row wears no dedicated glyph. What remains is the wording pass itself.

## 1. The switch (`WEIGHT_COPY`)

One declaration, three surfaces: the prologue's opening card, the wizard, the settings row.

| id | home | text | status |
| --- | --- | --- | --- |
| W1 | `src/composables/identityCopy.ts#WEIGHT_COPY.title` | The weight | `DRAFT` |
| W2 | `src/composables/identityCopy.ts#WEIGHT_COPY.lead` | Some careers meet a pregnancy that ends, or a death in the family. They are written carefully and they are part of the story this game tells. You can leave them out. | `DRAFT` |
| W3 | `src/composables/identityCopy.ts#WEIGHT_COPY.on` | Include them | `DRAFT` |
| W4 | `src/composables/identityCopy.ts#WEIGHT_COPY.off` | Leave them out | `DRAFT` |
| W5 | `src/composables/identityCopy.ts#WEIGHT_COPY.note` | You can change this later in More. Turning it off stops what has not happened yet – it never erases what a career has already lived. | `DRAFT` |
| W6 | `src/composables/identityCopy.ts#WEIGHT_COPY.groupLabel` | The weight | `DRAFT` |
| W7 | `src/composables/identityCopy.ts#WEIGHT_COPY.settingsHint` | Off: no new loss or bereavement arrives. What a career has already lived stays. | `DRAFT` |

## 2. The announcement, her quoted span extended (`EXPECTING_HER_LINE`)

The narration frames are wave 8's rows; wave 11's delta is the window clause inside the quotation
marks – ruled STANDING on 23.09. Listed whole because the whole string is what the player reads;
roof and away per voice.

| id | home | text | status |
| --- | --- | --- | --- |
| W8 | `src/engine/world/lifeBeat.ts` | She waited until we were all sitting down, and then said it straight out. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both." | `DRAFT` |
| W9 | `src/engine/world/lifeBeat.ts` | She called on a Sunday, before anything else had been said. "We are having a baby. I have barely sat on it. I am happy and I am frightened, and I wanted you to know both." | `DRAFT` |
| W10 | `src/engine/world/lifeBeat.ts` | She came in and said it before her coat was off. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished." | `DRAFT` |
| W11 | `src/engine/world/lifeBeat.ts` | She rang between flights and led with it. "We are having a baby. I did not wait to be sure. I have thought about the tennis. I am not finished." | `DRAFT` |
| W12 | `src/engine/world/lifeBeat.ts` | She mentioned it while she was looking at the calendar, as if it were a fixture change. "We are having a baby. I have known a while. I will play a while yet, and then I will not." | `DRAFT` |
| W13 | `src/engine/world/lifeBeat.ts` | She sent the next block of dates through, and this was underneath them. "We are having a baby. I have known a while. I will play a while yet, and then I will not." | `DRAFT` |
| W14 | `src/engine/world/lifeBeat.ts` | She sat with it through most of the evening, and then put it in one sentence. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it." | `DRAFT` |
| W15 | `src/engine/world/lifeBeat.ts` | She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I have known a long time, and I needed to know what I felt about it first. I know what it costs. I want it." | `DRAFT` |

## 3. The third answer, re-worded to a position

The old label «Ask her what this does to the tennis» and its feed row are superseded.

| id | home | text | status |
| --- | --- | --- | --- |
| W16 | `src/engine/world/lifeBeat.ts` | Say it is too early – look where she is | `DRAFT` |
| W17 | `src/engine/world/lifeBeat.ts` | She is expecting a child. We said it was too early. | `DRAFT` |

## 4. The loss – open tells, private is silence (`LOSS_HER_LINE`)

`quiet` and `deep` are `null` by ruling: the silence is the telling, and the parent reads the
absence. Told and untold arms for the two open voices.

| id | home | text | status |
| --- | --- | --- | --- |
| W18 | `src/engine/world/lifeBeat.ts` | She rang the same evening and did not soften it. "We lost it. I did not want you to hear it from anyone else, and I would like you here." | `DRAFT` |
| W19 | `src/engine/world/lifeBeat.ts` | She rang the same evening and said two things in one breath. "There was a child coming and there is not any more. I had not told you yet. I would like you here." | `DRAFT` |
| W20 | `src/engine/world/lifeBeat.ts` | She called once, said it flat out, and was off the phone inside a minute. "We lost it. I am not talking about it. I will ring you when I am ready to." | `DRAFT` |
| W21 | `src/engine/world/lifeBeat.ts` | She called once, said it flat out, and was off the phone inside a minute. "I was pregnant. I am not any more. I am not talking about it. I will ring you when I am ready to." | `DRAFT` |

## 5. The bereavement card

The deceased is UNNAMED in mechanics and in copy (ruled 22.09) – no relation word anywhere. Her
line per voice and presence; the dry card for the strained/cold distances; one frame; ONE answer
at 0 bond (ruled 23.09) and its feed row.

| id | home | text | status |
| --- | --- | --- | --- |
| W22 | `src/engine/world/lifeBeat.ts` | She came round in the evening and said it before she had taken her coat off. "There has been a death in the family. I would rather you heard it from me." | `DRAFT` |
| W23 | `src/engine/world/lifeBeat.ts` | She rang in the evening, before anything else had been said. "There has been a death in the family. I would rather you heard it from me." | `DRAFT` |
| W24 | `src/engine/world/lifeBeat.ts` | She said it in the hall, loudly, and then would not sit down with it. "There has been a death in the family. I am not going to be much use this week." | `DRAFT` |
| W25 | `src/engine/world/lifeBeat.ts` | She rang and led with it, and was off the phone not long after. "There has been a death in the family. I am not going to be much use this week." | `DRAFT` |
| W26 | `src/engine/world/lifeBeat.ts` | She mentioned it while she was putting something away, as if it were an errand. "There has been a death in the family. There are arrangements to make." | `DRAFT` |
| W27 | `src/engine/world/lifeBeat.ts` | She sent the week's dates through, and this was underneath them. "There has been a death in the family. There are arrangements to make." | `DRAFT` |
| W28 | `src/engine/world/lifeBeat.ts` | She sat in the kitchen a long time before she said anything at all. "There has been a death in the family." | `DRAFT` |
| W29 | `src/engine/world/lifeBeat.ts` | The call was mostly quiet. She said it once, near the end of it. "There has been a death in the family." | `DRAFT` |
| W30 | `src/engine/world/lifeBeat.ts` | There has been a death in her family. The house heard it from somebody else. | `DRAFT` |
| W31 | `src/engine/world/lifeBeat.ts` | There has been a death in the family | `DRAFT` |
| W32 | `src/engine/world/lifeBeat.ts` | Say you will come | `DRAFT` |
| W33 | `src/engine/world/lifeBeat.ts` | There has been a death in the family. We said we would come. | `DRAFT` |

## 6. The weeks after, in the diary (`BEREAVED_WORDS`)

Four scraps over the bereaved window – the parent reporting a week, no interior stated as fact,
no relation, no date, no number.

| id | home | text | status |
| --- | --- | --- | --- |
| W34 | `src/engine/diary/weekNotes.ts` | She rang more than usual this week, and talked about ordinary things. | `DRAFT` |
| W35 | `src/engine/diary/weekNotes.ts` | She trained through it. Nobody suggested otherwise. | `DRAFT` |
| W36 | `src/engine/diary/weekNotes.ts` | A quiet week at her place. The kettle went on a lot. | `DRAFT` |
| W37 | `src/engine/diary/weekNotes.ts` | She did not say much. She stayed later at the court than she needed to. | `DRAFT` |
