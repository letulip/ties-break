---
type: plan
status: current
area: delivery
last-reviewed: 2026-09-30
---

# The feedback channel – the strings table

Every sentence the feedback channel puts in front of a player or into the report he sends, laid out for his wording
pass: id, where it lives, the sentence, and its status. The spec ([feedback-channel-2026-09.md](../specs/feedback-channel-2026-09.md))
rules that every sentence is a draft in a table like this one. `tests/feedback-strings-roundtrip.test.ts` holds each row to the
sentence in the code, letter for letter, so the table and the code go red together whichever one is edited – **the table and
that test own the count; this prose states none.**

Every row is a draft until he has read it. All of them live in one file, `src/feedback.ts`, so his pass edits one place and
the Vue files carry no copy of these. The address itself (`FEEDBACK_ADDRESS`, ruled 30.09 in the spec) is not a sentence and
is not tabled; where it is spelled into a sentence, the row shows the placeholder.

## 1. Inside the report – the share sheet's title, the email, the report text

What the player sees in the share sheet or the mail composer, and what the report says about itself. `mailto:` cannot attach a
file and its body caps at about 2 KB, which is why one line asks for the attachment and one line says the body was cut.

| id | home | text | status |
|----|------|------|--------|
| FB1 | `src/feedback.ts` | Ties Break feedback | `DRAFT` |
| FB2 | `src/feedback.ts` | Please attach the save file that was just downloaded before sending this email. | `DRAFT` |
| FB3 | `src/feedback.ts` | No save is attached: no career is open, or it could not be read. | `DRAFT` |
| FB4 | `src/feedback.ts` | Recent errors, newest first: | `DRAFT` |
| FB5 | `src/feedback.ts` | No errors were recorded in this session. | `DRAFT` |
| FB6 | `src/feedback.ts` | [The rest was cut to fit an email link.] | `DRAFT` |

FB1 is the share sheet's title and the email's subject. FB2 also shows on the dialog once the fallback has downloaded the file,
and FB3 and FB5 also show on the dialog's list, so the dialog says the same words the report does.

## 2. The control and the dialog

The control sits in More, on the Saves tab, beside the Saves strip; its exact spot is his to rule on at this pass. Tapping it
opens the dialog, which starts preparing the report at once and lists what will be sent before anything leaves.

| id | home | text | status |
|----|------|------|--------|
| FB7 | `src/feedback.ts` | Send feedback | `DRAFT` |
| FB8 | `src/feedback.ts` | The report contains: | `DRAFT` |
| FB9 | `src/feedback.ts` | The save of the active career | `DRAFT` |
| FB10 | `src/feedback.ts` | Checking for a save… | `DRAFT` |
| FB11 | `src/feedback.ts` | Nothing is sent until you choose where to send it. | `DRAFT` |
| FB12 | `src/feedback.ts` | Send | `DRAFT` |
| FB13 | `src/feedback.ts` | Close | `DRAFT` |
| FB14 | `src/feedback.ts` | 1 recent error | `DRAFT` |
| FB15 | `src/feedback.ts` | ${n} recent errors | `DRAFT` |
| FB16 | `src/feedback.ts` | Send it to ${FEEDBACK_ADDRESS} | `DRAFT` |

FB7 is both the control's label and the dialog's title. FB9 is the list's save line when there is a career to attach and FB3
takes its place when there is not; FB10 shows for the fraction of a second before the report is ready. The error line is FB5
when nothing went wrong, FB14 for one row and FB15 for two or more, where `${n}` is the number of rows the report carries.
FB16 is there because a share sheet cannot address the email, so the player has to know where to send it.

Nothing else on the card is copy: the build line is the one the Settings footer already prints.
