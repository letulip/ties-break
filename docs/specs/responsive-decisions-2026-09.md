---
type: spec
status: current
area: ui
canonical: false
last-reviewed: 2026-09-04
---

# The contentious calls of round 36 – for the owner to review

> «всё, что будет спорно выноси в отдельный документ мне на ревью»

Phase 5 of [`responsive-2026-09.md`](responsive-2026-09.md), opened in phase 2 and **written as the
work happens, never reconstructed**. One row per call where his design pack and our shipped app
disagreed, or where an instruction of his had more than one honest reading.

The standing rule every row is decided under is his:

> «где они будут расходиться с дизайном – отдаем приоритет нашим пропорциям, то же самое с цветами,
> стилями, подложками»

…so **ours wins by default**, and a row where the DESIGN won says why in its own words.

**How to read a row.** *What the design shows* · *what our mobile does* · *what shipped* · *why*.
A row marked `[?]` is one where a look at the running app could reasonably change the answer, and
those are the ones worth his morning.

---

## Phase 2 – the tablet band, 768–900

### D1 `[?]` Season: a week SWIPES, it is not a grid

| | |
| --- | --- |
| **the design** | The handoff's «Правила раскладки» §6 is explicit: «Сетки вместо каруселей. Неделя в Season Planner – `grid` (2 колонки на 768, 3 на 1024), не горизонтальный свайп … **Свайп-ряды и стрелки ‹ › были пробой и отвергнуты**.» |
| **our mobile** | Round 34 #14 built the week as a scroll-snapping strip, at his own ask – «чисто интерфейсная правка на свайп карточек». |
| **shipped** | **His instruction, not his design.** «1 неделя = 1 ряд, максимум 2 карточки видно, свайп для 3+.» |
| **why** | It is his own later ruling on the screen he called his hardest case, and it is the reading that builds nothing: the strip, the snapping, the 12px gutter and the "the next card's own edge is the affordance" rule are round 34's, with one number changed. A grid would have been a new mechanism on a screen he asked us not to restyle. |

⚠ The two answers only differ from three cards up. At one and two cards a grid row and a swipe row
are the same picture; the divergence is what a week with **three or more** entries does – ours keeps
the third a thumb away instead of dropping it to a second line.

### D2 `[?]` Season: a week with ONE card is still half a row

| | |
| --- | --- |
| **the design** | `AD-season-tablet-768.png` draws W3 and W5 with a single card each, and both stop at the middle of the screen. |
| **our mobile** | A one-card week is the full width of the phone. |
| **shipped** | **Half the column, at every week.** |
| **why** | One column width for every week is what makes a row legible AS a week. The alternative – full width when a week offers one choice, half when it offers two – rocks the calendar left and right down the page, and «1 неделя = 1 ряд» would be the only thing holding it together. |

⚠⚠ **AND THIS IS THE ROW MOST WORTH HIS EYES, because the frame does not show its cost.** AD has
three week rows. A real season has forty-eight, and in the `pro` career every one of them offers a
single choice – so the right half of the calendar is empty from the first row to the last.
Measured: Season is 3,746px tall at 768 before this change and 2,784px after, so the page is a third
shorter and half of it is unused. If he wants the empty half back, **the one-line answer is to let a
lone card stretch** – and D1's swipe is untouched by that choice.

### D3 Coach market: «4 карточки» is four on screen, two to a row

| | |
| --- | --- |
| **the design** | `AJ-coach-market-tablet-768.png` lays the coaches **two to a row**, and the handoff's §1 says the point is «Coach Market показывает 4 тира сразу». |
| **our mobile** | One full-width row per coach. |
| **shipped** | **Two to a row**, which puts the first tier's four coaches in the first screenful. |
| **why** | Four *per row* is 184px per card at 768 – narrower than the phone's 343 – for a card carrying a name, a fit pill, a style, a description, two bands and a load note. It is also the only reading that climbs: phase 3 gives the desktop «2–3 в ряд», and a tablet cannot show more per row than a desktop. |

### D4 Coach market: the portrait STAYS at 62px

| | |
| --- | --- |
| **his words** | «картинка может быть шире, чем на мобиле, **если влезает**, тот же стиль, во всю высоту.» |
| **shipped** | The strip is 62px at every width, exactly as on the phone. What he does get is «во всю высоту»: the two cards in a row are the same height now, and the portrait fills the taller of the pair. |
| **why** | **His own condition is not met.** A two-up card at 768 is 362px – nineteen pixels wider than the phone's 343 – so there is no room to spend. Spending it would also have to break two shipped rules: round-18 #2 ties the 62px to the mask geometry (the fade has to reach transparent exactly at the clip line, or the portrait gets a hard edge down his side), and `coach-match-edge.md` §4's anti-shopping rule reserves the wider 78px strip for **the coach she already has**. |

⚠ If he wants the picture bigger anyway, the honest lever is the 78px the current row already uses –
and that is a ruling about the anti-shopping rule, not about the tablet.

### D5 Coach market: our page is longer than his frame, and it has to be

| | |
| --- | --- |
| **the design** | AJ shows **two coaches per tier**, eight of the fifteen it counts in its own header. |
| **shipped** | All sixteen. |
| **why** | **His acceptance criterion forbids the frame here** – «всё, что есть на мобиле, должно быть 1 к 1 по доступности на других форматах». A coach on the phone and not on the tablet fails `e2e/parity.spec.ts` by name. Nothing was decided by us; the frame and the criterion disagree and the criterion is the one with a test behind it. |

### D6 Home: the hero's tablet shape is the design's number, as a RATIO

| | |
| --- | --- |
| **the design** | «Герой перестаёт быть портретом на всю ширину. 768 – **400px** с горизонтальным скримом.» |
| **our mobile** | A3 (owner, 28.07): the hero is SQUARE, because the paintings are 512x512 and a square shows the whole frame with nothing cut. |
| **shipped** | `768 / 400` as an aspect ratio – his 400px exactly at 768, growing to 469 at 900, and the 901–1023 plateau then holds it. |
| **why** | ⚠ **This is the one place phase 2 takes the design's number over ours, and only because ours is the thing he asked us to stop drawing** – «hero image на home будет НЕ квадратной». A flat 400px would not grow through the band he defined, so the number is expressed as the shape it describes. |

⭐ The second half of his sentence – «но все оверлеи с текстом остаются как у нас» – cost nothing:
every overlay on that photograph is positioned against the hero's own box (the date and the identity
block off its top, the caption and the condition ring off its bottom), so a shorter hero moves none
of them relative to the picture they are laid on.

### D7 Family budget: «Her own account» is OURS, unchanged

| | |
| --- | --- |
| **the design** | `AL-family-budget-tablet-768.png` draws it as a full-width outlined strip of two paragraphs, **with no photograph**. |
| **our mobile** | Round 35 #3 shipped it with the polaroid beside the words. |
| **shipped** | **Ours, and not one declaration was touched.** |
| **why** | His own instruction – «Her own account» is our current card with the photograph. The row is here because a frame in the pack shows something else, and a later reader comparing the two should find the answer rather than the discrepancy. |

### D8 `[?]` Home: the news feed stays ONE column

| | |
| --- | --- |
| **the design** | `AB-home-tablet-768.png` runs the news in **two columns by week**, and the handoff's §1 names it: «News идут двумя колонками по неделям». |
| **our mobile** | One list, newest first, grouped by week. |
| **shipped** | **One column, unchanged.** |
| **why** | He named four screens for phase 2 and Home's entry was the hero alone; everything he did not name is «расширить колонку, больше ничего не менять». Splitting the feed is a restyle of something that is not moving, which is rule 2 of every phase. It is a small, contained change if he wants it – hence the `[?]`. |

### D9 Home: the season strip keeps its «…», and the criterion is why

| | |
| --- | --- |
| **the design** | «Season раскрывается в 17 чипов без обрезки» – the whole ladder, unelided, at 768. |
| **our mobile** | A fixed set of rungs plus a `…` control that opens the rest. |
| **shipped** | **Unchanged.** |
| **why** | ⚠ **His two instructions collide here and the acceptance criterion wins.** Measured on the shipped build, the strip renders the same seven boxes at 375 and at 768 – so drawing seventeen rungs at 768 would put controls on the tablet that are not on the phone, and «ничего нового по идее не должно появиться» fails by name in `e2e/parity.spec.ts`. Opening the strip needs the rungs to exist at BOTH widths, which is a change to the strip, not to the breakpoint. |

### D10 The week recap's picture grows to the column – on a screen he did not name

| | |
| --- | --- |
| **what we found** | `.recap-art` measures 343x251 at 375 and then **390x286 at every width above it** – 520, 576, 768, 900 and 1280 alike. Its `max-height: 286px` was written for exactly this case («capped at D's number so a tablet does not turn the story into a poster») but a block with an `aspect-ratio` and a violated `max-height` has its **width** transferred back down the ratio. At 768 that is a 390px photograph under the 736px paper note that rides on it. |
| **shipped** | `width: 100%` inside the tablet block: a 736x286 band, which is the shape that paragraph is describing. |
| **why it is here** | It is a defect fix, not a design call, and it lands on a screen his phase-2 list does not mention. The row exists so he sees a picture that changed size without him asking. |

### D11 …and the same collapse at 520 and 576 is deliberately LEFT

Phase 2's contract is that nothing below 768 may move. Those two widths carry the identical 390px
collapse and are **not touched** – it is his call whether phase 4 goes back for them, and it is
recorded in `docs/rounds/round-36.md` rather than quietly fixed on the way past.

### D12 `[?]` Her Kit keeps its 2×2 ladder; the design puts it four in a row

| | |
| --- | --- |
| **the design** | `AP-bills-kit-tablet-768.png` stands the kit rungs **four to a row**, and the handoff's §1 gives the reason: «ступени кита встают 4-в-ряд вместо 2×2 (лестница читается как лестница)». |
| **our mobile** | `.kit-rungs` is `grid-template-columns: 1fr 1fr` at every width – a fixed 2×2. |
| **shipped** | **Unchanged**, so at 768 the four rungs are 2×2 at ~365px each. |
| **why** | Same answer as D8, and for the same rule: his phase-2 instruction for Family Budget was «Her own account» alone, and everything he did not name is «расширить колонку, больше ничего не менять». Re-flowing a grid is changing something else. |

⚠ **It is a one-line change** (`repeat(4, 1fr)` inside the tablet block) and it adds and removes
nothing, so it cannot break his «1 к 1» criterion. D8 and D12 are the same question asked about two
blocks: **does «widen the column» include re-flowing a grid that the extra width has made too
loose?** One answer would settle both.

---

## Phase 3 – desktop, 1024–1200

*(nothing yet – phase 3 has not run)*

⭐ One row is already owed to it, from phase 1: **should the onboarding wizard and the tour briefing
follow the frame out to 1200 on a desktop, or keep the 880 they have today?** Phase 1 left them at
880 deliberately and put the decision on one token (`--app-max-width`), so it is made once, wherever
he makes it.
