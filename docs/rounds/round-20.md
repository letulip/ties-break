# Round 20 – a micro-round, and one of them is mine (13.08.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[!]` REOPENED.

- [x] **1. «Coach travels не активно на про карьере»** – ⚠ THERE IS NO PRECONDITION. `disabled` is a
  literal, not a binding, and `setCoachOnEventWeeks` has NO CALLER anywhere in `src/`. The owner
  CANCELLED the mechanic on 30.07 after all three versions were measured and failed, and
  `docs/decisions.md` (08.08) already recorded the consequence – travel never becomes possible, so a
  notice saying it is coming would be false. **Nobody acted on it for two weeks.** The sub-line was
  lying, and so was the `aria-label`, which is what a screen reader got instead of the paragraph.
  Both now name the two reasons instead of a date.
- [x] **2. «Cancelled по травме говорит "nothing cancelled"»** – BOTH shapes were wrong, each
  reproduced on a real career. (a) **The count was blind since 05.08**: the row matches withdrawals
  by their opening words, and it still looked for `'Withdrew from '` after `releasedBy` split the
  message so the desk's action would stop reading as a receipt for the player's choice – the injury
  arm writes `'Taken out of …'`. Measured: a 9-week layoff released two Local Opens and refunded both
  fees while the row rendered «Nothing». (b) **And in HIS shape the sentence was backwards**: for two
  events on CONSECUTIVE weeks the lists close two weeks out, so nothing is cancelled at all – she
  stays on both lists, the fees stay committed and the weeks resolve as walkovers. «Nothing – every
  entry stands» was the opposite of the truth. It now says the lists had closed and names them
  forfeited.
- [x] **3. ⚠ «Экран про ранг 50+ … сейчас его даже не закрыть» – THIS BROKE HIS PLAYTEST, and it is
  mine.** `TourBriefingDialog.vue`, shipped in round-18 #8 eight days ago: it carries a lead, a
  requirements list, five cost bullets and a closing line, on the shared `dialog-card` with **no
  `max-height` and no `overflow` of its own**. On a phone the dismiss control leaves the viewport
  and the dialog cannot be dismissed – and it is a BLOCKING overlay, so the career stops there.
  Wanted: full width on a phone, no wider than the content container on desktop, and scrollable.
- [x] **4. «Добавь образовательное правило проверять что попапы влезают в экран перед отправкой на
  прод»** – earned the hard way by #3. In `CLAUDE.md`'s gotchas, with the measurement that would
  have caught it.

## Why #3 got through, since the rule in #4 has to answer that

The dialog HAD a mounted test (`tests/component/tour-briefing.test.ts`) and it measured the right
things for the wrong risk: contrast through the real cascade, once-ness, the numbers coming from
`ECONOMY.mandatory` rather than the template. **Nothing measured whether it fits.** Every check was
about what the card SAYS; none about what the screen can HOLD.

That is the general shape and it is why the rule is worth writing down: a dialog's content grows by
one honest sentence at a time, and nothing in the suite ever objects until it is taller than a
phone. The other blocking dialogs are one to three short paragraphs, so the shared `dialog-card`
never needed a height rule and does not have one.
