# Round 20 – a micro-round, and one of them is mine (13.08.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[!]` REOPENED.

- [>] **1. «Coach travels не активно на про карьере»** – the travel toggle is drawn disabled with a
  sub-line saying when it arrives. Either its precondition is wrong for a professional or the line
  is lying about when.
- [>] **2. «Cancelled по травме говорит "nothing cancelled", несмотря на 2 турнира подряд на обоих
  неделях травмы»** – the injury report counts withdrawals and found none where two exist.
- [>] **3. ⚠ «Экран про ранг 50+ … сейчас его даже не закрыть» – THIS BROKE HIS PLAYTEST, and it is
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
