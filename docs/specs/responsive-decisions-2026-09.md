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
those are the ones worth his morning. `[x]` is a row he has now ruled on; his words are in it.

---

## ⚠⚠ A CORRECTION TO A LIMIT PHASE 2 STATED, AND IT WAS NEVER THERE

**`e2e/parity.spec.ts` compares SETS OF ACCESSIBLE NAMES. It does not look at positions.** Phase 2's
D8 and D12 both leaned on a caution that re-flowing a grid might trouble the harness; it cannot. Four
rungs laid 2x2 and the same four laid 1x4 carry the same four names, so the fingerprint is identical
and the assertion never sees the difference. **Only ADDING a control or REMOVING one is forbidden** –
which is exactly what the owner's «ничего нового не должно появиться, как и старого уйти ничего не
должно» says, and nothing more.

⭐ **And phase 3 widened it in the direction he actually asked for.** The harness now opens every
disclosure at every width before it measures, so what it compares is what is REACHABLE rather than
what is painted on arrival – «должно быть 1 к 1 **по доступности**», his own word. A control behind
an ellipsis on a phone and drawn openly on a tablet is the same control, one press cheaper; a control
that is genuinely absent still fails by name, and the break in `docs/rounds/round-36.md` shows it
doing so. The rows below are decided under the corrected rule.

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

### D2 `[x]` Season: a week with ONE card is still half a row – PUT TO HIM AGAIN, AND KEPT

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

⭐⭐ **RULED, 04.09, WITH THE COST IN FRONT OF HIM: «тянется на всю колонку – не надо, будет плохо,
пусть пока 1 карточка остается.»** The stretch was built (one card fills the row, two split it,
three or more shrink and swipe), measured, and reverted; the rule this row describes is the shipped
one, unchanged from phase 2. His reason is the card itself – it was drawn for 343px, and a lone
tournament card 736px wide at 768 or 948px wide at 1280 is a different object.

⚠ **AND PHASE 3 CARRIES THE SAME RULE UP A RUNG, which is where it lands on the desktop.** «One
column width for every week» is half a row at 768 and a THIRD at 1024, because three cards fit
there – so a one-card week is a third of the row at 1280, which is what `AE-season-desktop-1024.png`
draws for its own W3 and W5. Measured on the shipped build at 1280: the card is 307.98px, against
343 on the phone and 362 at 768.

⚠ An idea of his that could NOT be built is recorded here rather than lost: a `Training week` card
beside a tournament on wide screens. `SeasonScreen`'s row `kind` is exactly one of
`event | training | off-season | exam | vacation | practice` – **a week is one kind** – so an entered
week is never also a training week. A second card there would be a control the phone never renders
(the harness would name it) and it would offer to plan a week she has already entered.

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

### D8 `[x]` Home: the news feed stays ONE column – and the DESKTOP takes AC's two-column page

| | |
| --- | --- |
| **the design** | `AB-home-tablet-768.png` runs the news in **two columns by week**, and the handoff's §1 names it: «News идут двумя колонками по неделям». |
| **our mobile** | One list, newest first, grouped by week. |
| **shipped** | **One column, unchanged.** |
| **why** | He named four screens for phase 2 and Home's entry was the hero alone; everything he did not name is «расширить колонку, больше ничего не менять». Splitting the feed is a restyle of something that is not moving, which is rule 2 of every phase. |

⭐⭐ **RULED, 04.09: «давай тогда приведем к виду AC: одна колонка Season, вторая News со скроллом
внутри.»** Built in phase 3, and it is what the desktop draws: the season ladder is the left cell of
the last row and the news feed is the right one, with its own internal scroll. ⭐ **The scroll cost
nothing** – `.log` has been `max-height: 300px; overflow-y: auto` since the feed was written, so the
column he asked for was already a scroller looking for a column.

⚠ **THE 768–900 BAND IS UNCHANGED and that is deliberate**: his ruling names AC, which is the desktop
frame, and the tablet's own «News идут двумя колонками по неделям» is a different arrangement (two
columns OF NEWS, by week) that he has not asked for. The feed is one column at 768 and one column,
beside the ladder, at 1024.

⚠ And the caution phase 2 attached to this row was wrong: see the correction at the top of this
document. Re-flowing costs nothing against the harness.

### D9 `[x]` Home: the season strip OPENS ITSELF from 768 – reversed twice on 04.09

| | |
| --- | --- |
| **the design** | «Season раскрывается в 17 чипов без обрезки» – the whole ladder, unelided, at 768. |
| **our mobile** | A fixed set of rungs plus a `…` control that opens the rest. |
| **shipped** | **Unchanged.** |
| **why** | ⚠ **Phase 2 read his two instructions as colliding and let the criterion win.** Measured on that build, the strip rendered the same seven boxes at 375 and at 768, so drawing seventeen rungs at 768 alone would have put controls on the tablet that are not on the phone. |

⭐⭐ **RULED TWICE ON 04.09, AND THE SECOND ONE STANDS.** First «не надо раскрывать, он будет вести
себя как на мобиле в точности», then, on being shown that the rungs are already reachable: «мы же
можем использовать detectdevicewidth и если у нас 768+, то можно этот список сразу раскрытым
рисовать, это ничему не противоречит». **He is right, and phase 2's objection was answerable rather
than fatal:** every rung is ALREADY on the phone, one tap behind the ellipsis – so a wide screen
drawing them is the same information one press cheaper, not a control the phone has not got.

⭐⭐⭐ **SO THE HARNESS CHANGED, AND IT GOT STRONGER.** `e2e/parity.spec.ts` now opens every
disclosure at every width before it measures. Its claim is «the same things are REACHABLE at every
width» rather than «the same things are drawn on arrival» – which is his own sentence, «должно быть
1 к 1 **по доступности**». A control that is genuinely absent at one width still fails by name; the
deliberate break in `docs/rounds/round-36.md` proves it on a control that at 375 exists only AFTER
the disclosure is opened.

⚠ **ONE CORRECTION TO HIS WORDING, AND THE CORRECTION IS THE POINT RATHER THAN THE WORD.** He wrote
`detectdevicewidth`; what shipped is the breakpoint ladder – `window.matchMedia('(min-width: 768px)')`
– because a 768px browser window on a 27-inch monitor is not a tablet and the rule is about the width
of the COLUMN. ⚠ It is read ONCE, at setup: a window dragged from 1200 to 400 keeps an open strip,
with its own `−` on screen to close it, and re-collapsing a row under someone's cursor because they
resized is the worse direction.

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

### D12 `[x]` Her Kit's rungs go ONE ROW from 768 – ruled 04.09

| | |
| --- | --- |
| **the design** | `AP-bills-kit-tablet-768.png` stands the kit rungs **four to a row**, and the handoff's §1 gives the reason: «ступени кита встают 4-в-ряд вместо 2×2 (лестница читается как лестница)». |
| **our mobile** | `.kit-rungs` is `grid-template-columns: 1fr 1fr` at every width – a fixed 2×2. |
| **shipped** | **Unchanged**, so at 768 the four rungs are 2×2 at ~365px each. |
| **why** | Same answer as D8, and for the same rule: his phase-2 instruction for Family Budget was «Her own account» alone, and everything he did not name is «расширить колонку, больше ничего не менять». Re-flowing a grid is changing something else. |

⭐⭐ **RULED, 04.09: «а в чем проблема сделать для планшетов и десктопов в одну строчку?»** – none,
and phase 2 was wrong to imply there was one. It shipped as `repeat(4, minmax(0, 1fr))` inside a
`@media (min-width: 768px)` block: one line, three ladders (racket, shoes, strings), nothing added
and nothing removed. Measured on the shipped build, per ladder:

    375   313 x 126 px, two rows, each rung 153.5 wide
    768   706 x  60 px, ONE row,  each rung 172 wide
    1280  918 x  60 px, ONE row,  each rung 225 wide

– so each of the three kit lines gives back 66px of height, and the rungs are WIDER than the phone's
in the bargain. ⚠ `repeat(4, …)` and not `auto-fit`: the rungs are a LADDER, and a fourth grade
wrapping under the first would be the one arrangement worse than the 2x2 it replaces.

⚠⚠ **THIS IS THE ONE THING IN PHASE 3 THAT MOVES A TABLET BOX PHASE 2 SETTLED**, deliberately and at
his ruling. It is called out beside the identity census in `docs/rounds/round-36.md` so that
«nothing below 1024 moved» is not quietly untrue.

---

## Phase 3 – desktop, 1024–1200

### D13 `[x]⚠⚠` The rail carries the NAVIGATION – **RULED 04.09: the card set is to be BUILT**

⭐⭐⭐ **HIS RULING, AND IT OVERTURNS THE ANSWER BELOW.** «Надо создать новые компоненты и показывать
их только на десктоп», and «карточки сквозные, одинаковые, как мини-дашборд живут всегда в
вертикальной полоске, т.е. на всех страницах». So the three blocks this app does not have –
`IN THE ACCOUNT`, `COACHING BUDGET`, `MY ENTRIES` – are **built as desktop-only components and shown
on every page**. ⚠ His FRAMES disagree with each other about that (AC four cards, AE one, AK one, AG
none, AM none, counted below); **his words win over his frames**, and that is this row's decision.

⭐⭐ **AND HE ALSO RULED ON THE OBJECTION, WHICH IS THE PART THAT NEEDED HIM.** Reason 3 below is
that a card set on every page puts controls on the desktop the phone has not got, and
`e2e/parity.spec.ts` names each one. His answer: «можно вынести эту часть поля навигации из этой
проверки? у меня вообще планы небольшие на этот дашборд есть дальше и это исключительно десктопная
фича.» So the rail's DASHBOARD is exempt from the per-screen parity check – the rail is chrome, not
screen content, and a balance shown beside Season is a shortcut to a figure that lives on Home and
on Money rather than a new fact about Season.

⚠⚠ **THE EXEMPTION IS SPECIFIED HERE AND SHIPS WITH THE CARDS, NOT BEFORE THEM.** Four parts, and
the last three are what stop an exemption becoming a hole:

1. **Only the dashboard region is exempt.** The rail's NAVIGATION is not: the five tabs exist at
   every width and must still fail by name if one goes.
2. **The boundary is asserted by CONTAINER, never by a list of strings**, so a later phase cannot
   park a control inside the exempt region to dodge the check.
3. **Every FIGURE the rail shows must exist somewhere at 375.** A rail card is a shortcut; a number
   the phone cannot reach at all is a real finding and reddens.
4. The harness's claim becomes, in these words: **«the same things are reachable at every width,
   outside the desktop rail's dashboard»** – because a claim with an exception has to state it.

⚠⚠ **PHASE 4 DID NOT BUILD EITHER HALF, DELIBERATELY, AND THE REASON IS THE SECOND HALF.** An
exemption built before the thing it exempts is a guard fitted to nothing: its boundary test would
pin a container no template renders and its «every figure exists at 375» arm would pass over an
empty set – which is this round's own «four empty sets are equal» warning, and the exact way round
35 shipped three tests that went BLIND rather than red. The two land together or the guard is
theatre. ⭐ It is also the one place in the round where «no new components, no new strings» is
suspended, by him, for three cards – so it wants its own phase, its own measurement and its own
morning, not the tail of a six-surface layout pass. **Everything below stands as the record of why
the question reached him; the answer is the ruling above.**

---

### D13 (the phase-3 answer, kept as the record) The rail carries the NAVIGATION. It does not carry the card set.

| | |
| --- | --- |
| **his words** | «Рельса слева, на всю высоту, скроллится при переполнении, одинаковая на каждой странице. Несёт навигацию И набор карточек – `AC-home-desktop-1024.png` эталон для всего набора, и набор просвечивает на каждой странице.» |
| **shipped** | The rail is `nav.tab-bar` turned on its side: full height, sticky, scrolls itself, **identical on every page** – and nothing else in it. |
| **why** | Three separate reasons, and the third is a machine check. |

**1. THREE OF AC'S FOUR RAIL CARDS DO NOT EXIST IN THIS APP.** AC's rail holds `CONDITION`,
`IN THE ACCOUNT`, `COACHING BUDGET` and `MY ENTRIES`. We have none of them as blocks. The nearest
things we own are Home's `Family budget` notecard (a different card, with a sparkline), the condition
ring (an overlay on the hero, not a card) and the coaching budget bar (inside the Coach Market
screen). Building the four would be **four new components and every string on them**, which is rule
2 of every phase («ничего нового по идее не должно появиться») and CLAUDE.md invariant 4.

**2. HIS OWN FRAMES DO NOT AGREE THAT THE SET IS ON EVERY PAGE.** Counted off the pack: `AC` has four
rail cards, `AE` has one (`MY ENTRIES`), `AK` has one (`COACHING BUDGET`), `AG` has none and `AM` has
none. «Одинаковая на каждой странице» and «набор просвечивает на каждой странице» are true of the
NAVIGATION in every frame and of the cards in none of them.

**3. AND CARRYING HOME'S CARDS ONTO EVERY PAGE FAILS HIS OWN CRITERION BY NAME.** Home's cards are
not on Season, Calendar or Stats at 375. Putting them in a rail that shows on every page puts
controls on the desktop that the phone has not got, and `e2e/parity.spec.ts` names each one.

⚠⚠ **THIS IS THE ROW MOST WORTH HIS MORNING IN PHASE 3.** What the rail looks like is five tabs and
a lot of empty column – honest, but emptier than AC. **The lever, if he wants the cards:** decide
which of the four he wants BUILT (they are new blocks with new copy, so they are his to word), and
whether they may be Home-only – because a set that shows on every page cannot pass the harness.

### D14 The bell, the mail and the gear stay on the photograph

| | |
| --- | --- |
| **his words** | «Колокольчик, почта и настройки остаются справа сверху, внутри контейнера 1024–1200 – им там должно быть хорошо, никому не должны мешать.» |
| **the design** | `AC` puts them in a band above everything, at the container's far right; `AE` puts them at the BOTTOM-LEFT of the rail, which is the placement he is overruling. |
| **shipped** | Top-right of Home's **hero**, which on the desktop is the left column – so top-right of the page's first block rather than of the whole container. |
| **why** | They are `position: absolute` inside `.diary-hero`, which is `overflow: hidden`. Moving them to the container's own corner means re-parenting them out of the hero – a template change to a block he asked us not to restyle – and it would land them over the Next-tournament card. On the phone they are the hero's chrome; the desktop keeps them there, and «никому не должны мешать» is satisfied where they are. |

### D15 The yellow CTA is the mobile one, and the words the design puts beside it are NOT added

| | |
| --- | --- |
| **his words** | «Не как в дизайне: жёлтая кнопка прижата к низу с отступом от края, дополнительных слов возле кнопки нет.» His explicit correction of his own mockup. |
| **the design** | `AC` prints «No tournament entered for W25 — the week goes to training» beside the CTA and `AE` prints «Friendly: Alice vs Top seed — clay, no points, no money.» beside its own. |
| **shipped** | The floating pill, alone, exactly as on the phone – and **centred on the reading COLUMN, not on the window**, because the rail takes 220px off the left of the page. `--app-bar-left` and `--app-bar-bottom` are the two tokens that say so once for all three copies of that box. |
| **why** | His instruction, and a sentence beside a button would be new copy either way (invariant 4). ⚠ The bottom offset changes meaning rather than value: 58px was «clear of the 52px tab bar»; past 1024 there is no bar under it, so it becomes the margin off the page edge he asked for, spelled as the frame's own inset. |

### D16 Season: three fit, so there is no arrow pager

| | |
| --- | --- |
| **his words** | «Как на планшете, но могут влезть три карточки; если не влезают – стрелочная листалка.» |
| **shipped** | Three fit (307.98px each at 1280), and from four the strip keeps round 34's swipe with the fourth card's edge showing – 114px of it at 1280. **No arrows.** |
| **why** | His own sentence makes the pager the fallback for «if they do not fit», and they do. Arrows would also be **two new controls per week row, on the desktop and on no other format**, which fails «ничего нового по идее не должно появиться» in `e2e/parity.spec.ts` by name – the same collision D9 records, and this time the criterion is not in conflict with anything he asked for. |

### D17 Coach market: as many to a row as fit at the PHONE's own card width

| | |
| --- | --- |
| **his words** | «2–3 в ряд, с переносом, как на планшете.» |
| **the design** | `AK-coach-market-desktop-1024.png` draws **two**, at about 385px each. |
| **shipped** | `repeat(auto-fill, minmax(343px, 1fr))` – two at 1024 (382px each) and two at 1280 (470px), and three the moment there is room for three at no less than the phone's width. |
| **why** | ⚠ **Three per row was built first and measured worse.** The rail leaves 772px of column at 1024 and 948 at 1280, so three cards are 252px and 310px – both NARROWER than the phone's 343 – and the market got TALLER for it: the page went 2,162 → 3,041px at 1024 and 2,012 → 2,521px at 1280, because a card carrying a name, a fit pill, a style, a description, two bands and a load note wraps its way back down the screen. That is D3's own objection to «four per row» arriving one breakpoint later. So «2–3» is expressed as the RULE that produces it rather than as a number typed in, and the floor is the card he already has. |

### D18 Family budget: the photo is already square, and «Her own account» stops at a reading width

| | |
| --- | --- |
| **his words** | «Фото квадратное – там ошибка в дизайне. "Её собственный счёт" – наша с фотографией, во всю ширину растягивать не обязательно, посмотрите, чтобы красиво было.» |
| **the design** | `AM` draws the trip polaroid as a landscape window and runs «Her own account» edge to edge. |
| **shipped** | **The photo needed nothing** – `.money-polaroid` has been a square window since it was written («a 124px-tall window in a 124px-wide one», in the rule's own comment), so his «ошибка в дизайне» is answered by changing nothing. «Her own account» is capped at 640px past 1024. |
| **why** | 948px of column holding two sentences is a line of type nobody can track back to the start of. 640 is the app's own paragraph measure carried out to a desktop. ⚠ D7 stands untouched: the card is still ours, with the photograph the design's frame drops. |

### D19 `[?]` The desktop hero takes the DESIGN's shape, and both heroes take one CAP

| | |
| --- | --- |
| **the design** | `AC` draws the photograph 450 wide by 400 tall, beside the two notecards rather than above them. |
| **our tablet** | `768 / 400` – nearly twice as wide as it is tall (D6). |
| **shipped** | `--hero-aspect: 450 / 400` past 1024, plus a new `--hero-max: 512px` that BOTH heroes read. |
| **why** | This is the second time the round takes a number of the design's, and for the same reason as D6: the two-column Home of frame AC is not possible with a hero twice as wide as it is tall. Measured at 1280: at `768/400` the hero is 511x266 against a 433px pair of cards beside it; at `450/400` it is 511x454 and the row closes. ⭐ **The cap is the half a ratio alone does not give**: Home's photograph is a COLUMN and the tournament's is a full-width block, so the shared ratio drew a 511px picture on one screen and a 980px one on the other – «ту же пропорцию» read literally and visibly wrong. One cap, both heroes, and at 1280 they are the same photograph to within a pixel. |

### D20 `[?]` The screens his phase-3 list does not name get the wider column and the rail, and nothing else

| | |
| --- | --- |
| **the design** | `AI` (calendar), `AO` (bills/advances) and `AQ` (kit) all draw two-column desktop pages. |
| **shipped** | One column, in the narrower box the rail leaves. |
| **why** | He named the rail, the three top-right icons, the CTA, Season, Tournament, Coach market and Family budget. Everything else is phase 2's «расширить колонку, больше ничего не менять», inherited. ⚠ **And now that the false limit at the top of this document is corrected, the only question left is scope, not permission** – re-flowing any of them adds and removes nothing. It is a phase-4 candidate or a word from him. |

⚠ One thing he will see on those screens: **a full-width `View all transactions` pill is 793px on the
desktop Family Budget.** It is `PrimaryPill variant="cta"` at the column's width and has been since
phase 2 widened the column; capping it is a restyle of something that is not moving, and it would
move a 768–900 box he has already accepted. Named here rather than fixed on the way past.

### D21 The rail costs 220px of reading width on every screen, and two pages got longer for it

Not a choice so much as a consequence, recorded because it is visible. `--app-rail-w: 196px` (AC's
own measurement) plus a 24px gap comes off every screen: the reading column is **772px at 1024 and
948px at 1280**, against 992 and 1168 without a rail. Measured: the Coach Market's page went
2,162 → 2,375px at 1024, and Kid and Family Budget each grew about 18px where a line now wraps. Home
and Season are far shorter anyway (1,547 → 1,140 and 3,064 → 2,706 at 1024). If the rail should be
narrower, `--app-rail-w` is the one place that is decided.

### Still open from phase 1, and phase 3 did not touch it

⭐ **Should the onboarding wizard and the tour briefing follow the frame out to 1200 on a desktop, or
keep the 880 they have today?** Phase 1 left them at 880 deliberately and put the decision on one
token (`--app-max-width`), so it is made once, wherever he makes it. The rail does not change the
question: both are full-screen takeovers outside `#app` and neither has a rail beside it.

---

## Phase 4 – the screens the design pack does not draw

Sixteen frames cover ten screens. These are the rest, and the rule they are decided under is his
phase-2 sentence inherited – «расширить колонку, больше ничего не менять» – plus rule 4 of the round,
which is the judgement he asked for by name on «Her own account»:

> «можно его НЕ тянуть на всю ширину, посмотрите, чтобы красиво было»

⚠ **Every number below was measured in Chromium before it was chosen.** The before/after tables are
in [`docs/rounds/round-36.md`](../rounds/round-36.md); the rows here say what was decided and why.

### D22 `[?]` The takeover's reading column joins the wizard and the tour briefing on ONE cap

| | |
| --- | --- |
| **the design** | Nothing. There is no frame for the tournament flow, the match viewer, the draw or the finale poster. |
| **our app** | `.tf-body` and `.tf-top` were both `max-width: 480px`, at every width. Measured: the live court is **446px wide at 768, at 900, at 1024 AND at 1280** – the same picture at four screen sizes, with 400px of empty page down each side on a monitor. |
| **shipped** | `--takeover-col-max`: 480 below 768, `--app-max-width` above it. The column is **736 at 768 and 848 past 900**. |
| **why** | ⭐ It is not a fourth number. `--app-max-width` is already documented in `src/style.css` as «the TAKEOVER cap – the wizard's and the tour briefing's, still one token for the two of them»; the tournament flow is the third takeover in the app and now sits on it too. So phase 1's still-open question – «do the takeovers follow the frame to 1200 on a desktop?» – is decided in exactly one place, and it now decides three surfaces instead of two. |

⚠ **This is the row that carries the most geometry in the phase** – the brief, the pre-match scene,
the live court, the draw and the finale poster all ride it, and so do the inbox sheet and the week
planner. If 848 is too wide for a match screen, `--app-max-width` is the one line that says so.

### D23 The court stops at its own drawing surface, and the cap is bound to the constant

| | |
| --- | --- |
| **what we found** | The canvas is a **fixed 680x420 bitmap** scaled by `devicePixelRatio` (`CSS_W` / `CSS_H` in `MatchViewer.vue`). While the takeover column was 480 it could never reach that; at 848 it would have been upscaled 1.25x, and inside the prologue's weekend – which had no column at all – the court measured **~1256px wide at 1280**, an 1.85x enlargement of a 680px picture. |
| **shipped** | `.mv-court` capped at `CSS_W` and centred, with the cap bound inline off the same constant the aspect ratio is written from. **680 x 420 at 768, 900, 1024 and 1280** alike; the commentary log takes the width instead (710px at 768, 822px past 900). |
| **why** | It is the one cap in this round with a mechanical rather than an aesthetic reason, and it is a cap rather than a stretch – rule 4. ⭐ Binding it inline is what keeps it honest: a literal `680px` in the stylesheet would be a second copy of a number the file already says must not drift, and `MatchViewer.vue`'s own comment gives that as the reason the ratio is bound rather than restated. |

⚠ R17 #8 is satisfied rather than reversed: he asked for the court to be BIGGER («корт станет больше»)
and it is – 446 to 680 at every width from 768 up, which is 52% more tennis.

### D24 `[?]` The wizard reads in a 640px column, and that RE-FRAMES phase 1's open question

| | |
| --- | --- |
| **the design** | The handoff gives the wizard a 22px gutter and no cap; there is no desktop frame for it. |
| **our app** | `.ob-shell` caps at `--app-max-width` (880). Measured at 1280x900: the pane is 842px and **«First name» is a text input 780px wide**. The country tiles are 271px each, the family rows 836px. |
| **shipped** | The head, the body and the foot of `ScreenShell` capped at **640** and centred, from 768. The input is 584px at every width above it. |
| **why** | A name field the width of a laptop is what rule 4 is about, and 640 is the number phase 3 capped «Her own account» at, on his own instruction. The cap is on the three slots rather than on `.ob-pane` because that pane is a scrollport carrying `margin: -3px` for the focus-ring clip of 30.07, and an auto inline margin there would have fought it. |

⚠⚠ **AND IT CHANGES WHAT PHASE 1'S OPEN QUESTION BUYS, WHICH IS SAID HERE RATHER THAN LEFT TO BE
NOTICED.** «Do the takeovers follow the frame to 1200 or keep 880?» is his, and `--app-max-width` is
still the one place it is made. But with the reading column capped, 880 and 1200 differ only in how
much page is either side of the same 640px column – so **if he wants the wizard to feel wider on a
monitor, the lever is this cap and not that token.** The question is cheaper now, not answered.

### D25 `[?]` The shop's six category cards STOP at 640 – the one block that grew

| | |
| --- | --- |
| **his design** | Round 35 #3, in his own words: a front door of six cards, «первый ряд invest, business, property, остальное 2й ряд», and TALL – «не квадратными, как в макете, а высокими (смотри соотношение сторон картинок)». |
| **what we found** | `1fr` columns and a fixed `aspect-ratio` make a tile whose height is its width times 1.542, so the front door grew with the column and took the page with it: **109x168 (grid 344px, page 1057px) at 375 → 311x479 (grid 966px, page 1534px) at 1280.** The shop's front door is 477px TALLER on a monitor than on a phone. Every other screen in this round got shorter. |
| **shipped** | The grid capped at **640 and centred**: a tile is 208 x 320.8, the grid 649.5, and the page 1217 at 1280. His 3x2 and his ratio are untouched. |
| **why** | A cap rather than a re-flow, because the arrangement is his and a re-flow would change it. ⭐ **The lever if he wants it:** six in one row on a desktop is `grid-template-columns` in that one rule and nothing else – it keeps his order, and it would make the door shorter still. That is his call, not ours. |

### D26 The shelf's rows go two to a row, on the coach market's own rule

| | |
| --- | --- |
| **our app** | One row per card: 343px on a phone, 736 at 768 and **948 at 1280**, with a 378px painting at one end and two short sentences at the other. |
| **shipped** | `.shop-family` is a grid: two to a row at 768–900 (362 / 428 each) and `repeat(auto-fill, minmax(343px, 1fr))` past 1024 (380 at 1024, 468 at 1280). The family heading and its note span the row. |
| **why** | A shop row and a coach row are the same object – a photo card with the picture on one side and the words on the other, both 343px on a phone – so they get the same answer rather than a second one. D17's finding applies unchanged: three in a 948px column would be 310px each, NARROWER than the phone's card, and the page grows to pay for it. Measured: the Cars shelf went 1405px tall at 375 to **948 at 1280**. |

### D27 The epilogue gets a column, and the album's pager was 1175px apart

| | |
| --- | --- |
| **our app** | `.ending` is a `position: fixed` takeover, so like the wizard it hangs outside the frame – and unlike the wizard nothing inside it was ever capped. Measured at 1280x900: `.ending-head` 1214px wide, and `.album-nav` **1214px with Back at x=33 and Next at x=1208**, around a photograph 285px wide in the middle of them. |
| **shipped** | The two sections capped at **480** and centred; the head and the pager are 446px. The celebration ground still covers the page. |
| **why** | An album is a page you TURN: the arrows frame the picture, which is what they do at 309px apart on a phone. Sent to opposite ends of a monitor they stop being a pager. **480 is what the content already asked for** – `.ending-totals` caps itself at 460, `.ending-fork` at 360, the polaroid at `min(280px, 78vw)` and the three prose blocks at 34–36ch – so the column is the widest thing on the screen plus the room the arrows sit in. ⚠ The cap is on the sections and not on `.ending`, for the wizard's own reason: capping the painted box would letterbox the epilogue in the page colour. |

### D28 `[?]⭐⭐⭐` The prologue's column does NOT grow, and the measurement is why

⚙ **He asked to see this one and decide: «пусть агент сделает, а я посмотрю результат и решим.»**
So the reasoning is here in full rather than as a verdict.

**What the prologue is.** Nine cards of a childhood, then a handover. Round 35 #2 rebuilt it three
days ago at his ask – no framed backing plate, «просто квадратный арт во всю ширину», the text and
the choices beneath it. One picture, one decision, nothing else. It is not a dashboard and the
question is not what to put beside the painting; it is whether the column grows.

**The law that decides it, and it is peculiar to this screen.** The painting is SQUARE and runs the
full width of the column, so **the column's width IS the picture's height.** Growing the column on a
wide screen does not use the width – it uses the HEIGHT, and a desktop window is not taller than a
tablet's. Measured on the shipped build at 1280, by forcing the cap and reading the card back:

    cap    hero      card scrollHeight   first answer at   overflow at a 900px window
    420    420       1156                y=894             256
    480    480       1216                y=954             316
    512    512       1248                y=986             348
    560    560       1275                y=1013            375
    640    640       1355                y=1093            455
    720    720       1414                y=1152            514

**Every 60px of column is 60px more scroll before the decision.** At today's 420 the four answers
already begin at the fold; at 640 the first one is 193px further down. So growing the column is the
one change that makes this screen worse, and the answer is that **it stays at 420 at every width.**

⚠ **Three alternatives were considered and each is named with its cost, so he is choosing between
real options rather than reading a shrug.**

1. **Grow to 512** – the paintings are 512x512 masters, so 512 is where a square picture stops being
   enlarged, and it is the number `--hero-max` already carries for Home's and the tournament's heroes.
   Cost: 92px more scroll for 92px more picture. Rejected on the table above.
2. **A two-column desktop spread** – the painting left, the words and the four answers right, so the
   picture AND the decision are on screen at once. It is arguably MORE faithful to «one picture, one
   decision» than a scroll is, and the harness would not object (re-flowing costs nothing).
   Rejected for three reasons: it is a third layout language on the surface he rewrote three days ago
   precisely to make it read as one screen; the nine cards carry different amounts of text and some
   carry a second question, so a split that balances on one card leaves the next half empty; and the
   scroll is not a desktop defect – this card scrolls on a phone too, which is why round-20 #3's
   `max-height: 100%; overflow-y: auto` is on it in the first place, and it is the shape he asked
   for.
3. **Leave everything, including the weekend.** Rejected – see below.

⭐⭐ **SO PHASE 4'S WORK ON THE PROLOGUE IS ONE SURFACE, AND IT IS THE ONE THAT HAD NO COLUMN AT
ALL.** `PrologueLocalOpen` – the Local Open weekend – is `inset: 0` with 12px of padding and nothing
else, so its venue painting simply took the window: measured **734 x 734 at 768 and 1246 x 1246 at
1280**, taller than the screen it is on, with the two facts, the VS line and «Begin» pushed off the
bottom. The nine cards and the handover are both `max-width: 420px`; the weekend now takes the same
column, so the prologue holds ONE width from the first card to the last match. ⚠ The MATCH inside it is the exception and takes the takeover
column, because 420 would have made the prologue's court narrower than the 744px it has on a tablet
today – and the court's own cap (D23) is what decides how big the tennis gets. Measured after, at
1280x900: `.plo-head` and `.plo-splash` 420, the painting 410 x 410, the court 680 x 420 centred.

### D29 The tournament brief's venue plate takes a shape rather than a flat height

| | |
| --- | --- |
| **our app** | `.tf-hero` is `min-height: 300px`, which on a 343px column is nearly square – the plate this brief has always drawn. |
| **the cost of D22** | At 848 of column, 848 x 300 is **2.83 : 1 over a 512x512 master** (`public/images/fields/*`, measured): two thirds of the painting thrown away, which is D6's objection to a flat height arriving on a third hero. |
| **shipped** | `aspect-ratio: 768 / 400` from 768 – the token's TABLET rung, which is the shape he accepted for a wide hero. |
| **why** | It does NOT read `--hero-aspect`: that token's desktop rung is AC's `450 / 400`, drawn for a column hero with a `--hero-max` cap, and on this full-width block it would be a **754px-tall** venue photograph above the brief it introduces. ⚠ **And it is an ask rather than a guarantee**, which is measured and not glossed: `.tf-body` is a column flex container and this plate is a shrinkable item in it, so it gets 848 x 441.66 on a 1200px-tall window and 848 x 329.05 on a 900px one. It takes the shape when there is room and gives way when there is not, which is this column's own behaviour. |

### D30 The parity harness gained two rooms, and its remaining limit is stated

| | |
| --- | --- |
| **what we found** | The station map is DERIVED from `src/components/screens/`, which is what stops it becoming «the screens somebody remembered» – and its cost is that a FILE is the unit. `MoneyScreen.vue` has one station and it lands on the Spending chapter; the shop, which round 35 rebuilt and phase 4 re-laid, sits behind a chapter button and had never been fingerprinted. Phase 4 found that out honestly: its own deliberate break had to be aimed at the chapter ROW, because a control hidden inside the shop would not have been seen. |
| **shipped** | A second, HAND-WRITTEN map of two rooms – the shop's front door and one shelf – in its own describe block, running the same walk. Both are 1:1 at 375 / 768 / 900 / 1280. |
| **why** | The map says in its own header that it cannot be derived, which is the property the first map has and this one has not. What keeps it honest is the same three mechanisms: an arrival anchor before anything is measured, the fingerprint floor, and a fresh career per station. |

⚠ **THE LIMIT THAT REMAINS, AND IT IS THE HONEST ONE.** The harness walks screens, and most of phase
4's surfaces are TAKEOVERS reached by playing – a tournament, a weekend, a career's end, a new
career's first six steps. Those are covered instead by the phase's own box census: every element of
25 surfaces at seven widths, in both arms, with **0 boxes appearing and 0 disappearing anywhere** –
and the same census compared ACROSS widths finds **nineteen of the twenty-five element-for-element
identical at 375, 768, 900, 1024 and 1280**. The six that are not are Home and the five tournament
beats, and the difference on all six is the same one: Home's season ladder drawing itself open from
768, which is D9 and his own ruling, showing through behind takeovers that are `position: fixed`
layers over Home. ⭐ That is also what makes the census an instrument rather than a blind one – it
found the one legitimate difference in the app – but it is a throwaway, not a gate. **Turning the takeovers into stations is the next honest step and it is
not a phase-4 job**, because each needs a journey rather than a click.

### D31 Two things phase 4 found already broken and deliberately did NOT fix

Both are below 768, and nothing below 768 may move in this round – the same rule that left D11 open.

1. **The pre-match scene overhangs its own column by 8px.** `.tf-scene.tf-scene` cancels `24px` of
   gutter; `.tf-body`'s gutter has been `--app-pad-x` (16px) since R17 #8. Measured: the scene is 391
   wide at x=-8 on a 375px screen, and 896 at x=192 on a 1280px one – the same 8px each side at every
   width. It is contained (the body clips it, and the page does not scroll sideways), which is why it
   has survived.
2. **The prologue weekend's painting does not span the phone**, though its own comment says it does.
   `.plo-hero` cancels `.plo`'s 12px padding with `calc(100% + 24px)`, but its parent `.plo-splash`
   is a bare `<section>` and carries the app's own 16px section inset. Measured: 341px wide on a 375px
   screen, and 410 in the 420 column phase 4 gives it against the nine cards' 420.

⚠ …and **D11 is still open**: `.recap-art`'s 390px collapse at 520 and 576. Phase 4 could not take it
either, for the same reason – the identity contract this round has held for four phases is that not
one box moves at 375, 520 or 576, and correcting any of these three moves one.

### D32 `[?]` The census of every control at 1280 found exactly TWO over 700px, and both are left

⭐ **This is the round's rule 4 turned into a sweep rather than an impression.** «A wide viewport
makes a full-width control look wrong long before it breaks» is a claim about every control, so every
`button`, `input` and `select` on all twelve walked surfaces was censused at 1280 and sorted by
width. **Two came back over 700px**, and after phase 4's own caps they are the only two:

| | |
| --- | --- |
| `.money-cta` – «View all transactions» | **794px**, on the desktop Family Budget |
| `.cal-marker` – a week's note on the Calendar | **948px**, three of them |

**Neither is changed, and the reasons differ.**

* **The pill is D20's, and D20 parked it for him deliberately** – «capping it is a restyle of
  something that is not moving, and it would move a 768–900 box he has already accepted. Named here
  rather than fixed on the way past.» It is also not phase 4's screen: the Family Budget is frame
  `AM`, phase 3 laid it out, and «Her own account» directly above this button is already capped at
  640 on his own instruction. ⭐ **What phase 4 adds is the lever, because half of D20's objection has
  since dissolved:** put the rung at **1024 instead of 768** and no tablet box moves at all, which is
  the only thing that stopped it. One rule, `max-width: 640px; margin-inline: auto` (plus
  `display: block`, because a `button` is inline-level and auto margins do not centre one), and the
  desktop Family Budget becomes one column instead of a card with a wider button under it. **His
  call, since it is his screen and his parking.**
* **The marker is a LIST ROW and is left on the merits.** A week's note with a `$` at its end is the
  same shape as a ledger row, a kit rung or a shelf row, and a list row is the width of its list
  everywhere in this app. A row that is as wide as its column is not a stretched control; a pill that
  is as wide as its page is.
