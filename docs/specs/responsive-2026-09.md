---
type: spec
status: approved
area: ui
canonical: true
last-reviewed: 2026-09-03
---

# The interfaces on tablet and desktop (round 36)

⚙ **Approved by the owner on 03.09.2026** – «скорректируй план пожалуйста и запускай в работу весь
план пошагово». His design pack is `AB`–`AQ`, sixteen screens in tablet/desktop pairs.

---

## The breakpoints, HIS ruling

> «768 как раз тоже можно до 900 тянуть вполне, потом фиксировать посередине, а дальше десктоп от 1024.»

    < 768        mobile, unchanged
    768 - 900    TABLET, fluid – the column grows with the window
    901 - 1023   tablet layout FIXED AT 900 and centred
    >= 1024      DESKTOP, fluid to 1200, then capped and centred

⚠ **The 901–1023 band is a deliberate plateau, not an oversight.** The tablet layout stops growing
and sits centred until the desktop shell takes over. Anything that stretches through it is wrong.

## What the app does today, measured before any of this was planned

| | |
| --- | --- |
| `--app-max-width` | **880px**, a hard cap |
| breakpoints in `style.css` | 520, 480, 420, 320, 560, 880 – **all `max-width`** but one |
| the one `min-width` | 560px |

⭐⭐ **The app is a phone column that never grows**, so on a 1200px screen it renders 880 wide and
centred. That splits this round in two, and the halves carry very different risk: **768–900 is
INSIDE the existing cap** – his «это по сути широкий телефон» – while **1024+ is a shell that has
never existed.**

---

## ⭐⭐⭐ THE ACCEPTANCE CRITERION, and it is a machine check

His words, and they govern every phase:

> «всё, что есть на мобиле, должно быть 1 к 1 по доступности быть и на других форматах»
> «Все иконки наши, ничего нового по идее не должно появиться, как и старого уйти ничего не должно»

⚠ **A responsive pass is exactly the change that breaks this silently.** Nothing throws; a control
stops being rendered at one width and nobody notices for a month. Round 35 shipped three tests that
went BLIND rather than red when a screen moved.

⚙ **His own suggestion, and it is the right instrument: «возможно здесь как раз нас могу выручить
playwright?»** Yes – and it is stronger than the component runner for exactly this. happy-dom does
no real layout, so it can only prove a node EXISTS. Playwright proves it is **visible, positioned and
reachable at a real viewport.**

**PHASE 1 BUILDS THE PARITY HARNESS BEFORE ANY LAYOUT MOVES:**

1. Walk every screen at **375** in a real browser and record a fingerprint: every interactive
   element by accessible name, every heading, every figure, every icon.
2. Repeat at **768**, at **900**, and at **1280**.
3. **Assert the sets are equal.** A control present at 375 and absent at 1280 fails BY NAME.

⭐ That turns «1 к 1» into a check that runs on every future wave, and it answers the second half –
«ничего нового не должно появиться» – because a control that exists only at 1280 fails the same
assertion from the other side.

⚠ Its honest limit, stated up front: it proves presence, visibility and reachability. **It does not
prove the screen is beautiful.** That judgement stays his, and he has said so – «я утром буду всё
уже сам глазами смотреть».

---

## Phase 1 – the harness and the container

* the Playwright parity sweep above, red on any difference
* the container becomes fluid on his ladder: 768→900, plateau to 1023, 1024→1200, capped
* a viewport-aware sibling to `tests/fits.ts`
* ⚠ **nothing moves yet.** This phase must be able to land with the app looking identical at every
  width it already supported – that is its own honesty check.

## Phase 2 – tablet, 768–900

Everything here is «a wider phone»: the mobile component stays and its container widens.

* **Home** – the hero stops being square; **every text overlay stays exactly where it is**
* **Season** – ⭐ his design in his own words: **1 week = 1 row, at most 2 cards, swipe for 3+**.
  Card format, decoration and buttons are the mobile ones, unchanged
* **Tournament (AF)** – the image takes the same proportion as the home hero
* **Coach market** – 4 cards; the picture may be wider than mobile if it fits, same style, full height
* **Family budget (AM)** – «Her own account» is our current card with the photograph
* everything else – widen the column, change nothing else

## Phase 3 – desktop, 1024–1200

The new shell, and the only phase that invents structure.

* **The rail** goes left, full height, scrolls on overflow, **identical on every page**. It carries
  the nav AND the card set – `AC` is the reference for the whole set
* **Bell, mail, settings** stay top-right, inside the container
* ⚠ **The yellow CTA follows the MOBILE pattern, NOT the design**: pinned over the page at the
  bottom with a margin from the edge, **and no words beside it**. His explicit correction of his own
  mockup
* **Season** – as tablet, but 3 cards may fit; if not, an arrow pager. Cards unchanged
* **Tournament (AG)** – image at the home hero's proportion
* **Coach market** – 2–3 per row, wrapping
* **Family budget (AM)** – ⚠ the photo is **square**; «там ошибка в дизайне». «Her own account» need
  not stretch full width

## Phase 4 – the screens the design does not cover

Onboarding, the match viewer, the draw, the endings, the shop. Same principles; the harness has
covered them since phase 1, so they cannot be forgotten.

⚙ **The prologue is included, at his ruling:** «пусть агент сделает, а я посмотрю результат и решим.
Подход и концепция в этих 16 экранах есть вполне.» So it is adapted on the same principles rather
than exempted, and the result is his to judge.

## Phase 5 – the review document

> «всё, что будет спорно выноси в отдельный документ мне на ревью»

`docs/specs/responsive-decisions-2026-09.md`: one row per contentious call – what the design showed,
what our mobile does, which was chosen, why. **Written as the work happens, never reconstructed.**

---

## Standing rules for every phase

1. ⚠ **Our proportions beat the design.** «где они будут расходиться с дизайном - отдаем приоритет
   нашим пропорциям, то же самое с цветами, стилями, подложками». Every such divergence is a row in
   the review document.
2. ⚠ **No new icons, no new components, no restyle of anything that is not moving.** «Все иконки
   наши, ничего нового по идее не должно появиться.»
3. ⚠ **No engine changes and no copy changes at all.** Invariant 4 is at its most fragile in a
   layout wave, because a label that wraps badly is tempting to reword. It is not to be reworded.
4. ⚠ **The 880 cap is load-bearing somewhere we have not found.** Expect surprises; each is a
   finding, not a nuisance.
5. ⚠ **A left rail changes what «the page» is.** Sticky bars, the CTA and `fits.ts` itself now
   measure a narrower box. Round 35 has a live example of a paint-order bug that appeared only when
   a container moved.
