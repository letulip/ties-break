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

---

## Phase 5 – the horizontal pager, and one line that moved

⚙ **Two owner rulings on 04.09, both after playing the shipped build**, and phase 5 is only those
two. Everything below is a call this phase had to make in carrying them out.

### D33 `[x]` The week's swipe leaves CSS and becomes JavaScript – **HIS RULING**

| | |
| --- | --- |
| **his words** | «Давай уберем свайп css и сделаем js функционал для листания горизонтального, тогда будет полный паритет на всех устройствах и ничего не надо изобретать.» |
| **our mobile** | Round 34 #14 built the week as a scroll-snapping strip; the hotfix on `main` then added `touch-action` / `overscroll-behavior` / `user-select` because he felt all three missing. |
| **shipped** | `scroll-snap-type` and `scroll-snap-align` are **gone**. `touch-action: pan-y` hands the horizontal axis to `composables/weekPager.ts`, which drives `scrollLeft` from a pointer drag, from two arrow buttons and from Left/Right on the keyboard. `overflow-x: auto` **stays**. |
| **why** | «Полный паритет на всех устройствах» is the whole point: a finger, a mouse and a keyboard now reach the same rule through one code path instead of three different browser behaviours. `overflow-x` is not the swipe – `touch-action` is what took the gesture off the browser – and keeping it is what keeps `scrollLeft` a real number, so a focused control is still scrolled into view by the browser itself and round 34's reachability pin still measures the property it always did. |

⚠⚠ **AND THE AXIS IS `pan-y`, NEVER `pan-x`, WHICH IS THE ONE MISTAKE THIS ROW EXISTS TO STOP BEING
REPEATED.** The hotfix on `main` reached for `pan-x` first – «this box handles ONLY horizontal
panning» – and a near-vertical gesture that began on a card then stopped reaching the page at all: on
a run of multi-card weeks **the page froze**. `pan-y` is the safe half by construction: the browser
keeps the axis the PAGE scrolls on, and gives up the one the pager drives. Held by a mounted arm that
names the value, mutation-verified against `pan-x`.

⚠ **`user-select: none` stays on the strip.** The drag-to-select autoscroll it takes away was an
accident of the browser, not a design, and the press-and-hold fix – a hold that became a text
selection and swallowed the tap – depends on it. It is also what lets a MOUSE drag the strip at all.

### D34 `[x]⚠⚠` The arrows are on EVERY device – which **reverses D16**, at his own later ruling
<!-- ⚠ THIS ROW READ «on EVERY width» until phase 7. His ruling of the same evening narrowed that to
     «only where there is something to page» – see the ⚙ note below and D35. The row is left standing
     because its argument (arrows are not a DESKTOP-only control) is what makes them legal at all. -->

| | |
| --- | --- |
| **his words** | «у нас на всех устройствах могут появиться стрелки для листания в дополнение к JS свайпу.» |
| **phase 3 said** | **D16: no arrow pager.** «Arrows would be two new controls per week row, on the desktop and on no other format, which fails «ничего нового по идее не должно появиться» in `e2e/parity.spec.ts` by name.» |
| **shipped** | Two arrows on **every week that stacks more than one card, at every width and on every device**. ⚙ **Phase 7 narrowed «at every width» to «where the strip overflows» – D35.** «On every device» is untouched. |
| **why** | D16's refusal was never about arrows – it was about **desktop-only** arrows, and it says so in its own sentence. A control that appears at 375 and at 1280 alike carries the same token in both fingerprints, so the criterion it would have broken is the criterion it now satisfies. His ruling is what settles the design question; the parity harness is what settles that it is legal. |

⚙ **PARTLY SUPERSEDED BY D35, at his later ruling of the same day.** «На всех устройствах» stands –
the arrows are on every DEVICE and reachable by finger, mouse and keyboard alike. «At every width»
does not: phase 7 draws them only where the strip has something past its edge. The half of this row
that made them legal – that they are not a desktop-only control – is unchanged; what changed is that
they are now a control whose presence depends on the viewport, and that is what D35's exemption pays
for.

⭐⭐ **AND THE MEASUREMENT THAT MADE IT NECESSARY, WHICH NEITHER D16 NOR THE HARNESS COULD SEE.** On an
`overflow-x` strip a mouse has **no swipe**. What it has is shift+wheel, a trackpad's two-finger
gesture – neither of which a player guesses – and drag-to-select autoscroll, which was accidental and
which `user-select: none` has removed. There was no `tabindex` on the strip either, so **a keyboard
could not reach the third card of a week by any route at all.** The parity harness compares controls
across widths; it does not compare INPUT DEVICES, and this is the hole that let a card be «present at
every width» and unreachable for half the players.

⚠ **AND IT IS PROVED, NOT ASSERTED.** `e2e/parity.spec.ts` gained a walk on a career that HAS a
stacked week – see D36 – and `e2e/responsive.spec.ts` drives the last card of one by Tab-and-arrow-key
and by clicking the arrow, in a real browser.

### D35 `[x]⚠⚠` The arrows are HIDDEN when nothing overflows – **RULED 04.09, and it reverses what phase 5 shipped**

| | |
| --- | --- |
| **his words** | «на десктопе неделя из двух карточек показывает две серые стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть что листать.» |
| **phase 5 shipped** | Always on a stacked week; `Back` and `Next` grey out at the ends and were both grey when the whole week fitted. |
| **shipped now** | The pager is drawn on a stacked week **whose strip has something past its edge**, and on no other. The greying stays for the arrow at the end a real strip is actually at. |
| **why** | His ruling. Nothing else – see below, because the argument ran the other way and he was told so. |

#### ⚠⚠ PHASE 5 ARGUED AGAINST THIS IN WRITING, AND IT WAS RIGHT

The reasoning stood in `src/composables/weekPager.ts`, in this row, and in `SeasonScreen.vue`'s
template, and it is kept in all three rather than deleted:

> **Which weeks overflow depends on the WIDTH.** A two-card week overflows by 273px at 375 and fits
> exactly from 768 up (measured on `sinking`); three cards fit at 1280 and do not at 900. So a pager
> that hid itself when everything fitted would be a control present at one width and absent at
> another – exactly the failure «ничего нового … как и старого уйти ничего не должно» names, and
> `e2e/parity.spec.ts` would go red on it.

**Every clause of that is still true.** Phase 7 re-measured it in Chromium on `sinking` and `junior`,
and the boundary is his own 768 rung:

| viewport | strip | card | overflow | pager |
| --- | --- | --- | --- | --- |
| **375** | 343 | 302 (88%) | **273** | drawn |
| **520** | 488 | 429 | **383** | drawn |
| **576** | 520 | 458 | **407** | drawn |
| 768 | 736 | 362 | **0** | – |
| 900 | 868 | 428 | **0** | – |
| 1024 | 772 | 249 | **0** | – |
| 1200 / 1280 / 1440 | 948 | 308 | **0** | – |

– two cards at half a row plus the 12px gutter come to the strip's width **exactly** at 768, which is
why the pair he was looking at is idle on every format above a phone.

#### ⭐ SO THIS IS A TRADE HE MADE, NOT A MISTAKE BEING CORRECTED

The price was put to him in this row's own previous wording – «the price is that `e2e/parity.spec.ts`
then needs a stated exemption for them, because the sets at 375 and 1280 stop matching» – and he
answered **«да»**. **What it costs, stated plainly:** the harness's claim is no longer «the same
things are reachable at every width». It is

> **the same things are reachable at every width, outside the desktop rail's dashboard AND the week
> pager's arrows.**

That sentence is in `e2e/parity.spec.ts`'s own header and in this round's ledger, because a claim
with two exceptions has to state both.

⚠ **AND THE EXEMPTION IS NOT «ARROWS MAY BE MISSING WHENEVER».** His sentence is a biconditional –
«показываем только если есть что листать» – so the harness holds both halves: the arrows are
subtracted from the fingerprint, AND a strip that DOES overflow at a width must have them.
`the HONEST HALF` measures `scrollWidth - clientWidth` per week per width in a real browser and
reddens on a week that overflows by 273px with no pager. **D48** is the boundary; **D49** is how the
overflow is watched.

⭐ **The one thing phase 5's argument was right about that the ruling does not cover** is recorded in
the ledger rather than hidden here: the arrows are now the FIRST control in this app whose presence
depends on the viewport, and the parity harness can no longer answer for them – only the honest-half
arm can, and it can only reach the widths a fixture actually overflows at. No fixture draws a week of
three or more enterable rungs, so **no career this suite has ever overflows above 576.**

### D36 `[x]` The parity harness gained a station on a DIFFERENT CAREER, because `pro` has no stacked week

| | |
| --- | --- |
| **the problem** | The harness walks every screen on the `pro` fixture – «the heaviest career, on purpose». Measured: `pro`'s Season feed is **three rows of ONE card**, so it draws no pager at all. Four fingerprints with no arrow in any of them are equal, and the harness would have reported perfect parity about a control it had never seen. |
| **shipped** | `Station` gained an optional `career`, defaulting to `pro`, and a hand-written room walks Season on **`sinking`** (two stacked weeks, four arrows) at all four widths. |
| **why** | Identical to phase 4's finding about the shop: a map that cannot REACH a state proves nothing about it, and the honest fix is to reach it rather than to exempt it. The room's arrival anchor is the `Next` arrow itself, so a pager that stopped drawing fails there before any fingerprint is taken. |

⭐ **The deliberate break was aimed at this phase's own control and it named it.** Hiding only the
`Back` arrow at ≥1024 – so the room's anchor still lands and the FINGERPRINT has to do the work –
reddens with `button "Back" ×2` and `icon back.svg ×2`. That is also the proof the fingerprint really
contains the arrows, by role-and-name and by asset.

### D37 `[x]` The glyph is `back.svg` MIRRORED, and the «a back control is bare» rule gains its second argued exception

| | |
| --- | --- |
| **the rule** | `tests/ui-control-system.test.ts`: every control whose name is `Back` must be `IconButton variant="bare" icon="back"` (owner, 30.07: «просто иконка с белым fill»). |
| **shipped** | `IconButton icon="back"` – **but `plate`**, and the forward arrow is the same file under `transform: scaleX(-1)`. One asset, two directions. The allowlist gained one named entry with the argument in it. |
| **why** | The owner's sentence is about the top-left «leave this screen» affordance, and this is a **pager** – it moves within a row, exactly as `OnboardingWizard`'s footer pair (the rule's first exception) moves within a form, and `EndingScreen`'s album is the app's own precedent for the pair of words. `plate` is what `IconButton`'s own header exists for – «it sits ON something (a photo, a dialog's corner, a header row)» – and it is measured rather than preferred: a bare glyph on the painted card was unreadable in the first build and the plate's own fill had to be raised from 72% to 88% before the circle read as a control at all. |

⚠ **NO NEW ICON AND NO NEW WORDS.** `back.svg` is the owner's own asset (30.07). `Back` and `Next`
are `EndingScreen`'s album pager's own two words, taken verbatim rather than invented – which is what
keeps this phase inside «no new strings» while still giving the arrows accessible names.

### D38 `[x]` The figure's line moves off the season cards to the tournament screen – **HIS RULING**

| | |
| --- | --- |
| **his words** | «на каждой карточке с турниром появились серые буквы "A typical figure for this level..." – откуда они взялись? Не надо перегружать сезонные карточки, на них и так много информации, а это вообще шум, потому что везде. У нас есть отдельный экран для турнира (доступен с home) – вот там всей доп. информации самое место.» |
| **where it came from** | ⚙ **He asked for it himself**, round 35 item 5b: «хорошо, можно на карточке ДО жеребьевки писать, что-то на эту тему.» It exists because the pre-draw figure JUMPS when the draw is made – 9.1 points on average, 36 at worst (round 34 #5) – and an unexplained jump is the instability round 31 #4 was reported for. |
| **shipped** | Removed from every card in the Season feed. **Added to `NextTournamentPanel`** – the tournament screen reached from Home's «Next tournament» plate – under the same field ring, on the same condition (`fieldRingShown`). |
| **why** | A MOVE, not a delete. Deleting it would give back the unexplained jump he was being warned about; his own sentence says where the extra reading belongs. |

⚠ **THE PANEL DID NOT ALREADY CARRY IT** – checked before assuming. It carries the field RING (round
34 #5) and `DRAW_NOT_MADE_NOTE` on the first-round plate, and neither says what will happen to the
number. So this is a real move and the pair is held both ways: gone from every card in the feed,
present on the panel before the draw, absent from it after.

⚠ **The ink changed and the sentence did not.** `--ink-soft` was legible on the feed's flat card; the
panel's read block stands ON the photograph, so the line takes `.nt-read-label`'s white-on-art pair –
the same shift `.nt-hero .coach-note` already makes beside it. **Not one character of the string
moved.**

⚙ **And `opponentRingShown` / `fieldRingShown` moved with it**, out of `SeasonScreen.vue` and into
`composables/eventCard.ts`, unchanged: the season card no longer asks the question and the panel now
does, and two surfaces drawing one ring chain is exactly what that module owns.

---

## Phase 6 – the rail's mini-dashboard

⚙ **The suspension is his and it is narrow.** «Надо создать новые компоненты и показывать их только
на десктоп», «карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске,
т.е. на всех страницах», «никаких контролов новых они не поставят, это просто шорт-кат с информацией
из внутренних разделов». `AC-home-desktop-1024.png` is the reference for the set. Everything else in
the round still binds: no new icon, no engine change, no copy change anywhere else. **D13 above is
the settled row; these are the calls made building it.**

### D39 `[?]` ONE component with three cards, not three components

| | |
| --- | --- |
| **his words** | «Надо создать новые **компоненты**» – plural. |
| **shipped** | One file, `src/components/RailDashboard.vue`, drawing three cards. |
| **why** | The plural is about the three BLOCKS not existing, and one file is what the exemption needs: the parity boundary is **a container**, and one container is one place for it to live. Three files would each have to sit inside that same container anyway, and would give three places for the `.rail-dash` boundary and the «no control» rule to drift out of. Each card is three lines of template; the chrome of three SFCs would be longer than the thing. |

⚠ **If he wants them separate the cost is small and the boundary does not move** – three components inside the same `.rail-dash` div. The reason to ask is that «components» is his word and this is his feature.

### D40 `[x]` The dashboard is a CHILD of the rail, not a sibling of it

| | |
| --- | --- |
| **the alternative** | Wrap `<nav>` and the cards in a rail `<div>`, the shape a designer would draw. |
| **shipped** | `<RailDashboard />` is the last child of the one `nav.tab-bar` the app has. |
| **why** | **Measured, twice over.** (1) Past 1024 the bar IS the rail's whole box – `position: sticky`, `height: 100vh`, `overflow-y: auto`, spanning every row of the frame's grid (phase 3) – so a sibling in the same grid column sits UNDER it rather than in it. (2) A wrapper adds an element to the document at **every** width, a phone included, and this round's identity contract is that nothing below 1024 moves at all. A child costs no box below 1024 because the block is `display: none` there. |

⚠ **The honest cost is a landmark question:** three information cards now live inside the `navigation` landmark. It is legal HTML and the cards carry no control, no link and no tab stop, so the landmark still contains exactly the five things a keyboard can reach. **If he would rather they were a `complementary` region of their own, that is the wrapper above and its price is the identity contract.**

### D41 `[x]` The entries are LINES, not the Season strip's lime pills

| | |
| --- | --- |
| **the surface** | Season draws each entry as `<span class="pill ok">` – a bordered lime chip. |
| **shipped** | The same `label · week` text, as the app's own reading line (`--ink-soft`, 12.5px) – `.budget-window`'s pair, which is what sits under money on Home. |
| **why** | **Our proportions beat the design, and the rail is 196px.** A pill per entry down a 156px column is a stack of bordered boxes two lines tall each, and the lime border is the app's «this is live» accent doing a job nothing here is asking for. The STRING is identical to the strip's, which is what the shortcut has to preserve, and `e2e/parity.spec.ts` compares the two lists character for character. |

### D42 `[x]` «My entries» is SILENT with nothing entered

| | |
| --- | --- |
| **the alternative** | Always three cards, with an empty state on the third. |
| **shipped** | The card renders only when she is entered for something – `v-if="entries.length"`, which is the exact condition `SeasonScreen`'s own strip carries. |
| **why** | It mirrors the surface it shortcuts to, and an empty card is a worse answer than no card. ⚠ «Одинаковые на всех страницах» is untouched by this: the set does not vary by SCREEN, which is the property he asked for – it varies by career state, exactly as the strip does. Measured on `pro`, which boots with nothing entered: two cards, and the third appears the moment an entry is taken. |

### D43 `[x]` Desktop-only is `display: none`, never a `v-if` on a media query

| | |
| --- | --- |
| **the alternative** | `v-if="matchMedia('(min-width: 1024px)').matches"`, read once at setup – the app has that pattern already (D9, Home's ladder). |
| **shipped** | The block is in the DOM at every width and `display: none` below 1024, beside the rail's own rules in `src/style.css`. |
| **why** | Two reasons, and the second is measured. (1) A `v-if` is a **second place the number 1024 is written**, and this round has paid for a duplicated number twice already (`--app-pad-x`, `--app-bar-left`). (2) `display: none` is live: a window dragged from 1200 to 400 loses the dashboard and gets it back on the way up. A matchMedia read at setup does not. |
| **the cost, named** | **7 inert DOM nodes per screen at every width below 1024** – one `div`, two `article`s, two `h2`s, two `p`s. They have no box, no paint and no accessibility node, so the census below reports **0 moved / 0 new / 0 gone** boxes at 375–900, and the raw element count rises 2321 → 2391 on the ten-screen `pro` walk. That is the whole price. |

### D44 `[x]` The three titles were TAKEN off the surfaces, not off the frame

| | |
| --- | --- |
| **the rule** | «No new strings beyond the three card titles – and take those from the surfaces the data already lives on rather than from the frame if the two differ.» |
| **shipped** | `In the account` (the Family Budget screen's own «… in the account»), `Coaching budget` (`CoachMarketScreen`'s `.budget-label`, verbatim), `My entries` (`SeasonScreen`'s own `<h2>`). |
| **why** | All three already exist in this app, so the suspension of «no new strings» costs the app **no new vocabulary at all** – only three new PLACES for three phrases it already says. `tests/component/round36-rail-dashboard.test.ts` §4 pins that both ways. ⭐ And the frame's CAPITALS are not a fourth spelling: `Eyebrow` uppercases in CSS, so the case is the app's own rule. |

### D45 `[x]` «Coaching budget» shows what is FREE, not what is committed

| | |
| --- | --- |
| **the choice** | The meter has three figures – committed, the weekly cap, and the gap. |
| **shipped** | The gap (`freeCents`), because that is the figure the Coach Market prints **beside those exact words**: `<strong>{{ formatCents(freeCents) }}</strong> /week free`. |
| **why** | A shortcut quotes the number its label already names. ⚠ And it is the SAME computed, not a copy: the three figures moved into `src/composables/coachingBudget.ts` and the market's own meter reads them from there. This screen has already shipped the two-copies defect once (`HouseholdStrip.vue`'s header: the meter read the roster row instead of `coachBilling` and told a self-coached family it committed $0.00 a week), and on a desktop the rail and the meter are on screen **at the same moment**. |

### D46 `[x]` AC draws FOUR rail cards; three are built and `CONDITION` is not

| | |
| --- | --- |
| **the design** | `AC`'s rail holds `CONDITION`, `IN THE ACCOUNT`, `COACHING BUDGET` and `MY ENTRIES`. |
| **shipped** | The three he named. |
| **why** | **His words beat his frames** (D13), and his ruling names three blocks: «`IN THE ACCOUNT`, `COACHING BUDGET`, `MY ENTRIES`». The fourth is not a missing card but a different KIND of thing – the condition ring is an overlay on Home's photograph, not a block, so building it as a card would be a new component he did not ask for in the one place the round's «nothing new» rule is suspended. ⚠ It is the smallest of the four to add if he wants it, and it costs a fourth title. |

### D47 `[x]` The exemption's boundary is `#app > nav.tab-bar > .rail-dash`, and nothing else

| | |
| --- | --- |
| **the alternative** | Exempt the cards by NAME – «ignore `In the account`, `Coaching budget`, `My entries`». |
| **shipped** | A structural selector naming the PLACE, plus an assertion that the place holds no control and that the document holds exactly one of them. |
| **why** | A name list is one edit away from ignoring a control: whoever adds the control adds the name. A container cannot be extended that way – a later phase would have to move an element INTO the rail's dashboard, and the boundary test fails the moment anything interactive lands there. **Both halves have been seen to bite**; the mutations and what they printed are in `docs/rounds/round-36.md`. |

⚠ **And the claim the harness makes has changed, so it is written out in words** – in the file's own header and in the ledger: **«the same things are reachable at every width, outside the desktop rail's dashboard»**. A claim with an exception has to state the exception.

⚙ **AND PHASE 7 GAVE THAT SENTENCE A SECOND EXCEPTION** – the week pager's arrows (D35). The claim is
now **«the same things are reachable at every width, outside the desktop rail's dashboard AND the
week pager's arrows»**, and it is written out in the harness's header, in the ledger and in D35. **A
claim with two exceptions has to state both.**

---

## Phase 7 – the pager's arrows are hidden when there is nothing to page

⚙ **ONE owner ruling, and phase 7 is only that one.** «На десктопе неделя из двух карточек показывает
две серые стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть что
листать.» **D35 above is the settled row and it carries the trade;** these four are the calls made in
carrying it out.

### D48 `[x]` The exemption's boundary is `#app .week-row > .week-pager`, and it holds nothing but the two arrows

| | |
| --- | --- |
| **the alternative** | Exempt the arrows by NAME – «ignore `Back` and `Next`». |
| **shipped** | A `div.week-pager` that exists only to be this boundary, plus an assertion that every one of them holds **exactly** the two arrows, no other element, and no text of its own. |
| **why** | D47's argument, and it bites harder here. A name list would ignore `Back` and `Next` **anywhere in the app** – `EndingScreen`'s album pager uses exactly those two words – and it is one edit away from ignoring a third control somebody decides to call `Back`. A container cannot be widened that way: a later phase would have to move an element INTO a week's pager, and the boundary test fails on it. ⭐ **Seen to bite:** a `<button>More</button>` parked inside reddens two arms independently, one by DOM and one by the aria subtraction. |

⚠ **The arrows' own accessible names are NOT the boundary, and that matters for a second reason:**
the exempt set is asserted to be exactly `button "Back"` / `button "Next"` **after** the subtraction,
so a control that entered the region would be named by that arm too. Two nets, and they catch
different things – the same pairing D47 used.

### D49 `[x]` Overflow is WATCHED, not computed once – and the cards are observed as well as the strip

| | |
| --- | --- |
| **the problem** | Which weeks overflow depends on the width, so «is there anything to page» is not a property of the career – it is a property of the current viewport, and it changes while the window is being dragged. |
| **shipped** | `useWeekPager`'s `ResizeObserver` – which already existed for `atStart`/`atEnd` – now also drives whether the arrows are RENDERED, and it observes the strip **and every card in it**. |
| **why** | Overflow is `scrollWidth - clientWidth`: the strip's box gives the second term and the CARDS give the first, and a card is `88%` of a phone, half a tablet row and `calc(33.333% - 8px)` on a desktop. A media query can therefore move `scrollWidth` without the strip's own box being what moved, and observing only the strip would leave that transition unmeasured. |

⭐ **Measured in a browser rather than argued:** a window dragged 375 → 768 → 1280 → 900 → 375 → 1280
→ 375 with **no navigation and no remount** gives an arrow count of `4 0 0 0 4 0 4`. ⚠ **And it
cannot loop**, which is the usual hazard when a resize observer changes the DOM: the arrows are
`position: absolute` against `.week-row` and live in a `display: contents` container, so adding or
removing them changes neither the strip's box nor any card's. The identity census reports **0 boxes
moved** at every width, which is that claim as a number.

### D50 `[x]` The container is `display: contents`, so the identity contract pays nothing

| | |
| --- | --- |
| **the alternative** | A wrapper with a box – the shape a designer would draw – or an `inset: 0` overlay with `pointer-events: none`. |
| **shipped** | `.week-pager { display: contents }`. |
| **why** | The boundary has to be an element (D48), and an element that generates a box is a **new box at every width a week still pages at** – which is the identity contract this round is measured by (D43's own trade, from the other side). `display: contents` generates none: it changes no geometry, adds nothing to the census, and leaves the arrows' containing block exactly where it was, `.week-row`, which is what their `left`/`right` resolve against. |

⚠ **The honest cost, named:** **2 inert DOM nodes** on `sinking`'s Season feed – one per stacked week
that still pages – with no box, no paint and no accessibility node. The raw element count on that
screen goes 374 → 376 at 375/520/576, and 374 → **366** from 768 up, where the eight arrow nodes go.

⚠ **And it is why the parity harness reads the container's CHILDREN rather than the container.** A
box-less element is not a thing `ariaSnapshot` can be rooted at; enumerating what is inside it is the
same claim, and D48 is what fixes what may be inside.

### D51 `[x]` The keyboard route is on the ROW, survives the arrows going, and was CHECKED rather than assumed

| | |
| --- | --- |
| **the worry** | Hiding two controls is the classic way to remove a keyboard route by accident. |
| **shipped** | Nothing changed: `@keydown.left` / `@keydown.right` are on `.week-row` and were never on the arrows, and `:tabindex="row.events.length > 1 ? 0 : undefined"` is still on the strip. |
| **why** | It is a claim, so it is measured. `e2e/responsive.spec.ts` now tabs to the strip at **1280 with no arrows on the screen**, presses Left/Right, and finds the route intact: the strip is still a tab stop, the key still reaches `pager.key` (it calls `preventDefault`, which is the observable trace), and the strip **moves nothing** – because a week that fits whole has nowhere to go. |

⭐ **The honest answer, in one line: the route survives; there is simply no journey.** ⚠ And it means
a strip that does not overflow is still a **tab stop that does nothing** – true since phase 5, not
introduced here, and worth his eye if the empty stop ever bothers him: the condition is
`row.events.length > 1`, and pointing it at `overflows` instead is one word.

---

## Item 17 – the match screen on a tablet and on a desktop (04.09)

⚠ **THIS BLOCK TAKES D60–D65 AND LEAVES D52–D59 FREE ON PURPOSE.** Another agent is writing this
round's other seventeen items into this same file at the same time, in the same worktree; a reserved
band cannot collide with theirs, and a gap in the numbering is cheaper than two D52s.

### D60 `[x]` The wide match screen is PLACEMENT, not markup – `.mv-below` becomes `display: contents`

| | |
| --- | --- |
| **the design** | `AU` puts the court on top with the instruments in two columns; `AV` puts the court top-left and the commentary in a full-height right column. |
| **what our mobile does** | One flex column: the panel (court + score + stats), then `.mv-below`, which holds the commentary log, the pinned control bar and the replay's "Watch again". |
| **shipped** | Two media queries in `MatchViewer.vue` and **not one line of template**. `.mv` becomes a two-column grid at 768; `.mv-below` becomes `display: contents`, so the log and the bar become grid items of `.mv` and can be placed in different columns. |
| **why** | The wrapper exists for exactly one reason – it is the sticky bar's containing block, so the bar can never travel up onto the playing surface – and this layout needs the two things inside it in different columns. Reparenting the markup would have moved boxes on a phone; **a grid item's containing block is its grid area**, so placing the bar in row 2 of column 1 keeps the guarantee by the same kind of construction, and the phone keeps the wrapper it has always had. |

⭐ **The identity price is zero and it is measured, not argued.** Every element that renders on the
live match, censused at seven widths, arm A = the shipped head with `MatchViewer.vue` restored from
`HEAD`:

| width | boxes | moved | new | gone | pixels | raw A→B |
| --- | --- | --- | --- | --- | --- | --- |
| **375 / 520 / 576** | 335 | **0** | **0** | **0** | **0** | 369→369 |
| 768 / 900 | 360 | 30 | 0 | 1 | 15,161 / 18,297 | 394→394 |
| 1024 / 1280 | 373 | 90 | 0 | 1 | 49,715 | 394→394 |

The one box **gone** above 768 is `.mv-below` itself, which has no box when it has no display. **The
raw element count is identical at every width** – nothing was added to the DOM and nothing removed,
which is «ничего нового … как и старого уйти ничего не должно» as an element count. The ten tab
screens are **0 moved at all seven widths**, which a scoped stylesheet cannot help being.

### D61 `[x]⭐⭐` The DESKTOP court is narrower than the TABLET court, and that is his own frame

| | |
| --- | --- |
| **the design** | `AU` draws the court **716px** wide on a 768 shell; `AV` draws it **612px** on a 1024 one. His README: «**Корт — 60% ширины шелла**», and «Ширину на десктопе получает только она [трансляция]: это единственный элемент, который умеет ею пользоваться.» |
| **what our mobile does** | The court is the column, capped at the canvas's own 680px since phase 4 (D23) – so it was **680×420 at 768, 900, 1024 and 1280 alike**. |
| **shipped** | Tablet: unchanged, 680×420 on top, centred. Desktop: the court takes his 60% of our column – **506.8×313** – and the commentary takes the rest. |
| **why** | It is his trade and not ours: he spends desktop width on the commentary, not on the tennis, and his own two frames shrink the court by 15% between them for it. Our shell is the takeover column (848px at 1024 and at 1280 alike), so 60% is 508.8 and the feed gets 329.2 – within 15px of the 344 `AV` gives it. |

⚠ **The 680 cap is untouched and simply stops biting.** It is the canvas's own drawing width, and
a court drawn WIDER than it is an upscaled bitmap (D23's mechanical reason); a court drawn NARROWER
is only a smaller picture of the same drawing, which costs nothing.

⭐ **What the desktop buys with it, measured at 1280×900:** the commentary goes from **848×92** – its
own `min-height` FLOOR, about four rows – to **329×819**, about nineteen. `AV` draws fifteen.

### D62 `[?]` The tablet's commentary is 179px tall, not `AU`'s ~600 – and the reason is our own card

| | |
| --- | --- |
| **the design** | `AU`'s right-hand column runs the full height of the instruments block: eight rows of commentary against the phone's four. |
| **what our mobile does** | The court, the ends row, both score rows and the three statistics are **one card** with hairline dividers – design I's own panel. `AU` splits them: the court is one card and the score another, and the score card sits in the LEFT column beside the feed. |
| **shipped** | The whole panel stays one card and takes row 1 across both columns; the feed takes row 2 of the right-hand column. Measured at 768×900: the panel is 629.5 tall, so the feed gets **344×179.5** – up from 736×92, and short of his ~600. |
| **why** | Splitting the card is a change to the PHONE (two cards where one is drawn, a second border, a second background), and rule 4 of this round is that nothing below 768 may move. The alternative that keeps one card – the court in the left column beside a full-height feed – makes the court **380px wide at 768**, barely more than the phone's 341, which is the opposite of what R17 #8 asked for. |

⚠⚠ **AND THE HONEST HALF IS THAT IT IS STILL SHORTER THAN THE PHONE'S.** The log is **343×253 at
375**, so a tablet showing 179px of commentary shows LESS of it than a phone does. The cause is the
court, not the layout: it is 211px tall on a phone and 420 at 768, and those 209px come out of the
feed. This item improves the tablet by 95% on what it had and does not reach the phone.

⚠ **So the honest reading is: `AU`'s shape, our card, and the feed gets what the card leaves.** It is
the one place in this item where his frame is visibly better than what we can draw without touching
the phone, and it is his call whether the panel should split at 768 – that is a separate item, with
the phone in it. **The desktop has no such problem: 329×819, 3.2× the phone.**

### D63 `[x]` Five controls his frames draw were NOT built, because the app has no counterpart

Rule 2 of the round: «Все иконки наши, ничего нового по идее не должно появиться», and the round's
own corollary – **if a control in the frame has no counterpart in the app, it is not built.**

| in the frame | what we did | why |
| --- | --- | --- |
| **`Coach advice 2`** | **not built** | The app has no coach-advice control on a match screen, and no such string exists anywhere in `src/`. Building one is a feature, not a layout. |
| **`Match stats`** | **not built** | There is no such control either. The three statistics the button would open are already **on** the screen (`Momentum` / `1st serve %` / `Break points`), and the full box score is the flow's own next screen. |
| **`Show more ⌄`** at the foot of the feed | **not built** | It existed and the owner had it **removed** on 06.08 – «давай вообще этот блок … закрепим просто, а текстовая трансляция будет до него разворачиваться». The log is a scroller now; `MatchViewer.vue` carries that ruling in full. Re-adding it here would reverse him by way of a mockup. |
| **`Serving: B. Tran`** in the score card | **not built** | Removed at his own 31.07 ruling as the third saying of one fact – «who's serving is already indicated by colour … remove the duplicate indicator at the bottom». The two survivors (the ends row's outlined capsule and the lime dot on the serving player's row) are unchanged. |
| **flags, ages and `Match time` inside the score card** | **not built** | We draw no flags and no ages in the viewer, and the match clock has lived in the court's own top run-off band since R17 #24. Moving it into a score row would be a copy and layout change nobody asked for. |

⭐ **And one that looks missing and is not: `Skip match →`.** The frame's top-right exit is the FLOW's,
not the viewer's: `TournamentFlow` draws `To result` while a match is being watched and
`Skip all rounds` otherwise, and both are in the fingerprint at every width.

### D64 `[x]` Two numbers came from the design; everything else is ours

| taken from him | ours |
| --- | --- |
| **344px** – `AU`'s right-hand commentary column, used as the tablet's second track | the 10px gutter between the two columns (`.mv`'s own column gap), every colour, every radius, the card backings, the hairlines, the type scale |
| **60%** – `AV`'s «корт — 60% ширины шелла», used as the desktop's first track | the shell it is 60% OF (our 880 takeover column, not his 1024 frame), the 680 court cap, the 2:1.62 canvas ratio – his frames draw 2.25:1 and phase 4's cap is mechanical |

⚠ **His court ratio was NOT taken and the reason is not taste.** `AU`/`AV` scale the court at a fixed
`2.25 : 1` with the markings scaled by `k = W / 360`. Ours is a **fixed 680×420 bitmap** scaled by
`devicePixelRatio` (`CSS_W` / `CSS_H`), so its ratio is a property of the drawing surface and not a
layout choice – changing it is an engine change, which rule 3 of the round forbids.

### D65 `[x]` The parity harness had never seen the match screen at all, and now it has a room

| | |
| --- | --- |
| **the hole** | `e2e/parity.spec.ts`'s station map is DERIVED from `src/components/screens/`, and `MatchViewer.vue` is not in that directory – it is mounted by four callers, none of which is a screen file. So the surface his item 17 rebuilds, and the surface his own warning is about, was outside the instrument the whole round is measured by. |
| **shipped** | A third room, `MatchViewer.vue – the live match, on the court`, walked on `junior` at 375 / 768 / 900 / 1280 – plus one small addition to the map's shape, an optional `Station.park`. |
| **why the park** | A takeover covers the app's only navigation, so the default park (Trophies, then Home) cannot be clicked from inside a match. The room reloads instead, which is the STRONGEST version of what park is for: a new document, a new app and a new viewer at every width, and `careerAt`'s seed is a one-shot that deliberately does not re-fire on a navigation. |

⭐ **It is not a guard fitted to nothing, and that was measured.** With the two segmented plates hidden
from 768 up – the design's own omission, as a layout bug – the room fails by name:

```
these are on the phone at 375px and NOT at 768px:
  button "Double speed", button "Every point", button "Key points only",
  button "Normal speed", button "Quadruple speed"
```

⚠ **Its remaining limit, stated in the same row.** The fingerprint is taken over the whole `body`, and
a takeover is a layer OVER the tab screen rather than a replacement for it – so Home is inside this
room's fingerprint too. That is harmless (Home is 1:1 already, by its own station) but it means the
room's failure message names more than the match. It also means the room has to open Home's own
disclosures BEFORE covering them, because a chip under a blocking overlay cannot be pressed.

---

## His review, items 10–16 – the shop's rows and the two money rooms

⚙ **Seven items, seven rows, and the numbering starts at D66 on purpose.** The match agent's item 17
took D60–D65 while these were being built and items 1–9 are being built in the same tree; the block
below is claimed clear of both so two agents cannot mint the same identifier in one afternoon.

⭐ **Every figure in these rows was measured in Chromium at six widths (375 / 520 / 768 / 900 / 1024 /
1280), arm A against arm B**, where arm A is this commit with `MoneyScreen.vue` and
`WeekRecapCard.vue` restored to `HEAD` in the same tree – CLAUDE.md's shared-checkout rule, so the
other two agents' live edits are in BOTH arms and cancel.

### D66 `[x]` The way out of a shop category is the `Shop` chapter button – and the obvious wiring for it is DEAD

| | |
| --- | --- |
| **his words** | «Внутри магазина на внутренних страницах нижнюю стрелку "назад" надо убрать – **точка входа в магазин всегда общая страница категорий, по клику на Shop мы на нее же попадаем**.» |
| **the pin it moves** | Round 35 #3 built the two-level shop and its own test says why the arrow existed: «a level you can enter and not leave» is round-20 #3's family, and it rejected «press the chapter tab again» as a way out **because it was not one** – `screenTab` never left `shop`, so the press did nothing at all. |
| **shipped** | The arrow and its `.shelf-nav` row are gone at **every** width; `openChapter` in `MoneyScreen.vue` resets `shopHome` on a press of the chapter row. `round35-shop.test.ts`'s trap arm is re-aimed at the control he named and a second arm walks the other door (leave for Bills, come back to Shop). |
| **why it is a click and not a model event** | ⚠⚠ **Both obvious hooks are silent on the press he is describing, and the second was BUILT before it was measured.** A `watch` on `screenTab` never fires (the value is already `shop`). And Vue 3.5's `useModel` **returns early from its setter when the value has not changed** (`runtime-core`, `set()`), so `SegmentedRow` emits **no** `update:modelValue` at all on a re-press: a listener there passes every test that enters the shop from another chapter and does nothing for the one he complained about. **Seen: mutation M3 replaces the press with `@update:model-value` and reddens exactly the trap arm.** |

⚠ **It removes a control at every width, which is legal, and the measurement says so:** `.shelf-back`
is a 32×32 box in arm A at 375 / 520 / 768 / 900 / 1024 / 1280 and **absent at all six** in arm B.
`e2e/parity.spec.ts` compares the four fingerprints to each other, so a control that goes everywhere
is invisible to it – one that went at some widths only would fail by name.

### D67 `[x]⚠` His two declarations are used **verbatim**, and the property name is mirrored on the cars

| | |
| --- | --- |
| **his words** | «На Air, Water, Property, Cars давай для всех картинок еще чуть больше горизонтального места дадим, самим картинкам `width: 50%`, а `shop-row-body padding-right: calc(45% + 12px)`» |
| **shipped** | `50%` and `calc(45% + 12px)`, both exactly as he wrote them, on `car` / `house` / `boat` / `plane`. The **only** thing not copied literally is the property NAME on the second one: three of his four families carry the painting on the RIGHT, and the CARS carry it on the LEFT (`SHELF_ART_SIDE`, his own «как на тренерах»), so on a car the inset is `padding-left`. |
| **why** | ⚠ **Copied blind it breaks the card, and that is measured rather than argued.** A car body already carries the left inset; adding his `padding-right` gives it `calc(45% + 12px)` on BOTH sides – about 10% of the card left for the words. **Mutation M5 does exactly that and reddens two arms**, one of them round 35 #5's «the price and the buy control share ONE LINE», which is the card growing the extra row he asked to be rid of. |

⚠⚠ **AND HIS PAIR NO LONGER MEETS, WHICH IS REPORTED RATHER THAN ADJUSTED.** Round 35's pair was
40 / 40 – the inset matched the band, so the words began exactly where the picture stopped. His is
50 / 45, so **the words begin `5% of the card − 12px` before the band ends** and run under its own
fade. Measured, arm B:

| width | card | band | words start at | overlap | mask alpha there |
| --- | --- | --- | --- | --- | --- |
| **375** | 343 | 170.5 | 165.4 | **5.1px** | 7.8% |
| **520** | 488 | 243.0 | 230.7 | **12.3px** | 13.3% |
| **768** | 362 | 180.0 | 174.0 | **6.0px** | 8.8% |
| **900** | 428 | 213.0 | 203.7 | **9.3px** | 11.5% |
| **1024** | 380 | 189.0 | 182.1 | **6.9px** | 9.6% |
| **1280** | 468 | 233.0 | 221.7 | **11.3px** | 12.8% |

– the mask holds full opacity to 62% of the band and fades to nothing at 100%, so every one of those
overlaps lands in the last 5% of the fade, at **13.3% alpha at worst**. It is invisible rather than
absent, and no control sits in that strip: items 12 and 13 move the cars' own button to the other end
of the row, and the `--art-right` families' pill is bounded by `calc(40% − 20px)` of a 50% band, so
its left edge (60% + 10px at the widest) stays clear of the words' new edge (55% − 12px).
⭐ **Both arms of that are pinned** – `round35-shop.test.ts` asserts his `calc` exactly AND that the
words never start before 62% of the band, which is the line between «under the fade» and «on paint».

### D68 `[x]⚠⚠` Item 11 applies at **every** width – and the bill is one wrapped line, twice

| | |
| --- | --- |
| **the rule it bends** | Nothing below 768 moves unless his wording says so. |
| **the reading taken** | **He wrote the declarations himself and put no media query on either.** A CSS rule without one applies everywhere, and this is a card's own geometry rather than a wide-screen composition: scoping it to 768 would give the same object two proportions 21px of card width apart (343 on a phone, 362 at 768). |
| **the price, measured** | Twelve cells – the first car and the first property rung at six widths – and the card height moves in **two** of them, by **+16.2px each, one wrapped blurb line**: property at **375** (139.6 → 155.8) and the first car at **1024** (164.7 → 180.9). The other ten are byte-identical between the arms. The Cars page as a whole is 779.8 → 831.5px at 375. |
| **⭐ if he does not want it** | The four rules are one `@media (min-width: 768px)` away from being tablet-and-up, and this row is where that gets decided. |

### D69 `[x]` Her Academy is **not** in his four, although it is built on the cars

| | |
| --- | --- |
| **the temptation** | The academy rows are `--art-left`, exactly like the cars, by his own round 35 «как на экране машин, такой же принцип». A rule keyed on the SIDE sweeps them up for free. |
| **shipped** | `SHELF_WIDE_ART` is a list of FAMILIES – `car`, `house`, `boat`, `plane` – and the academy keeps round 35's 40 / 40, where the words still begin exactly where the picture stops. |
| **why** | He named four families and this is not one of them: CLAUDE.md invariant 4's argument applied to a proportion instead of to a word. **Seen: mutation M6 adds `academy` to the array and reddens the arm that holds it at 40.** ⭐ One name moves it if he wants the pair to match. |

### D70 `[x]⚠⚠` Items 12 and 13 take a FIGURE off two card families – checked before it went

| | |
| --- | --- |
| **his words** | «С купленной машины убираем paid серые буквы…» and, word for word again, «В разделе Her Academy убираем paid серые буквы…» |
| **the precedent** | Round 35 #7 removed the same line from the HOUSES on his own reason – «раз прибавка и так видна» – and the round's rule is to check that the reason still holds before repeating the removal. |
| **it holds** | `.shop-row-change` is drawn **unconditionally** inside `.shop-row-owned` (it carries no `v-if`) and the engine fills it for every owned rung – `changeCents = valueCents − paidCents + realisedGain`, `src/engine/world/shop.ts`. So a car and an academy stage each print «Worth now $X» and «−$Y since you bought it (−Z%)», and what was paid is X − Y. **Nothing is unrecoverable and nothing is re-worded** – the meta simply stops being passed. |
| **the second clause** | «кнопка buy/sell встает слева ближе к нижнему правому углу карточки» – the control was at the LEFT of its own row on exactly these two families; it goes to the card's bottom-right corner with `margin-left: auto` on the LAST control in the row. |
| **⚠ in the flow, not `position: absolute`** | The `--art-right` families' pill sits in that corner already, but it sits **on the painting**. On a car the corner is inside the WORDS, and a pill lifted out of the flow there shortens the card and prints itself over the last sentence. Round 35's constant through three of his own messages was «the card must not grow taller»; its mirror is that it must not lose the height its words need. |
| **water and air keep theirs** | He named two families. `paid $N` stays on `investment`, `business`, `boat` and `plane`. **Seen: mutation M10 strips it from all seven and reddens the arm that holds the untouched ones.** |

⚠ **AND THESE TWO APPLY AT EVERY WIDTH, deliberately.** Neither names one, and unlike a composition
both are about WHAT THE CARD SAYS: a figure printed on a phone and absent on a desktop is not a
responsive decision, it is two different cards.

### D71 `[x]` Item 14 grows the photograph from 768 up, with `min-height`, and the card's cap is untouched

| | |
| --- | --- |
| **his words** | «Фоточку на Her own account можно сделать крупнее» |
| **shipped** | 66×52 of paper and window becomes **104×82** – the mockup's own 1.269 ratio – from 768 up. Phase 3's D18 cap of 640 on the card is not touched: measured 640.0 in both arms at 1024 and 1280. |
| **the width, and why** | ⚠ **From 768, and the phone is deliberately untouched.** He names no width, and the complaint is a wide-screen one by construction: at 375 this polaroid is 66 of 319px of content – a fifth of the strip – and at 1024 the same 66px sits in a 616px card. The tablet is the first width where the card is wider than the phone's. |
| **⚠⚠ why `min-height` and not `height`** | `Polaroid` writes the window's height as an **inline style** off its `photoHeight` prop, and an inline declaration beats every rule in the screen's sheet – so a media query that widened the paper alone leaves a 52px photograph floating in a 104px frame, **which looks exactly like the item working**. `min-height` is a different property: the used height is the larger of the two, so the cascade raises it with no `!important` anywhere. |
| **two routes tried first, recorded** | A `var()` handed through the component's own `photoStyle` slot – a real browser resolves it and **happy-dom's CSSOM rejects `var()` as a height** (probed: the whole `style` attribute comes back `null`), so the mounted guard could not read the thing it guards. And moving the prop to 82 for every width, which is item 14 applied to a phone he was not looking at. |
| **the price** | The strip is **18.6px taller at 768 and 18.9px at 1280**, because the picture in it is. Its width does not move. |

### D72 `[x]` Items 15 and 16 are wide-screen compositions, and item 16 is three moves

| | |
| --- | --- |
| **item 15** | «всему правому сектору с запиской, фото и пайчартом дать больше воздуха слева и справа – **там есть достаточно места**». The air is `calc(2 * var(--app-pad-x))` – two of the app's own gutter – on **both** sides, because he named both in one breath. Measured: the figures column goes 582 → 526 at 768 and 794 → 738 at 1280, `.money-body` is 546.7px tall in BOTH arms at both widths (no reflow), and the artefacts keep their 146px. |
| **item 16, move 1** | The taped note takes **55%** – the middle of his «на 50-60% ширины». Measured 405.2 of 736 (55.1%) at 768 and 521.8 of 948 (55.0%) at 1280. ⚠ A SHARE and not `.cal-note`'s fixed 280px: the calendar's scrap is the surface he compared it to, not the rule to copy, and a fixed 280 would be a quarter of a scrap at 1280. |
| **item 16, move 2** | «Блок картинок … более квадратным, справа темный фон». The BLOCK keeps phase 2's `width: 100%` and D's 286px height; the photograph inside it becomes **286×286** (from 736×286 at 768 and 948×286 at 1280) and the rest of the band is `--card-bottom`. ⭐ The square is not a second number: the grid's first column IS `--recap-art-h`, which is the same custom property the height cap reads. |
| **item 16, move 3** | «верхнюю записку … ставим тоже квадратиком неправильной формы как раз на это место справа». Measured, the note goes from 740.5px wide at x=13.8 to **422.7 at x=317.6** at 768, and from 952.5 at x=273.8 to **634.5 at x=577.8** at 1280 – in both cases 16px past the picture's right edge. Its paper is untouched: the torn cut, the ruling, the tilt and the doodle are `PaperNote`'s. |
| **⚠ the one declaration the note gives up** | `margin: -34px` lifted it over the painting's bottom edge; beside the painting that lift hangs it out of the top of the card, so it is `align-self: center` in the freed space instead. |
| **the height** | The story card is **25.5px SHORTER** at 768 and at 1280 (773.0 → 747.5, 741.8 → 716.3), because the note no longer takes a row of its own. |
| **the width both are scoped at** | 768. Neither sentence names one and both are wide-screen by construction: 55% of a 343px phone is 189px for «Next goal» plus a sentence at 21px, and there is no space to the right of a phone's picture to put a note in. |

⚠⚠ **AND THE GRID HAD A REAL DEFECT THAT ONLY THE MOUNTED ARM CAUGHT.** Vue's scoping turns
`.recap-card > *` into `.recap-card[data-v] > *[data-v]`, which is **(0,3,0)** against a bare
`.recap-note[data-v]`'s (0,2,0) – so the span won and **the note sat under the picture at full width,
which is the shipped layout wearing a grid**. It was built that way first and the arm read `1 / -1`
back. Both placed items are addressed as children now. **Seen: mutation M15 restores the bare class
and reddens that arm alone.**

---

## His review, items 1–9 and 18 – the prologue, Home, and the one global cap

### D73 `[x]⭐⭐⭐` The prologue's picture stops being the column – and D28's measurement is sidestepped, not overturned

| | |
| --- | --- |
| **his words** | «пролог - так не пойдет, давай делать примерно как у нас home сделан, надо чтобы картинку было видно хорошо, скролла не будет, а текст будет либо ниже и шире (планшет), либо сбоку, ниже и шире (десктоп)» |
| **what D28 measured** | On the shipped layout a wider column IS a taller picture, because the painting is square and ran the full width of the card: `cap 420 → first answer at y=894`, `cap 640 → y=1093`. That is still true of the layout it measured. |
| **shipped** | The picture takes a **size of its own** – Home's hero, which is the model he named. 768–1023: a centred square capped at `min(336px, 33vh)`, the text below it in a 640px column, the answers two to a row. From 1024: a two-column grid over the card's own children – the painting in column 1 spanning, the reading in column 2, the question and the answers `1 / -1` under both, in an 880px card with a 392px picture. |
| **why** | His answer sidesteps D28 rather than contradicting it: the column can grow for the WORDS while the picture stays the size it should be. ⚠ **And «скролла не будет» is the acceptance test, so it is a measurement.** In a real Chromium, `scrollHeight - clientHeight` on the card, against the same walk in both arms: |

    window        before (D28's build)            after
    768 x 1024    age-5 over by 132               0 over on every card walked
    768 x  900    age-5 over by 256, age-11 111   0 over on every card walked
    900 x  900    age-5 over by 256, age-11 111   0 over on every card walked
    1280 x 900    age-5 over by 256, age-11 111   0 over on every card walked
    1280 x 800    age-5 356, ages 8/9/11 over     0 over on every card walked
    375 x 812     unchanged                       unchanged, to the pixel

⚠ **WHAT «EVERY CARD WALKED» MEANS, SAID PLAINLY RATHER THAN ROUNDED UP.** The browser walk answers
its way through **ages 5 to 11** and stops there in BOTH arms – the eleventh is one of the four cards
that carry two questions, and this harness cannot get past it – so ages 12 and 13 are measured by the
mounted walk at the phone only. The two it does not reach are not the risky ones: the walk includes
**the tallest card in the set** (age 5, which carries the whole identity form) and **the card with the
most controls** (age 11, four answers plus the way on, and 716px of a 900px window after this).

⭐ **The tallest card, which is the one he will judge it by:** the age-5 card carries the whole
identity form and was **1156px in a 420 column**. It is **935px at 768x1024** and **634px at
1280x900**. Nothing was shrunk to get there: the type, the fields and the answers are the ones that
shipped.

⚠ **The one number that is a compromise, named:** `33vh`. A flat 336px picture fits an iPad's 1024
with 89px to spare and misses a 900px window by 35 on the age-5 card, so the cap is bounded by the
window as well – **336 square at 768x1024, 297 at 768x900**. If he would rather have the bigger
picture and a short scroll on one card at one window height, that is one number.

⚠ **The fade stands down past 768.** `.prologue-hero-fade` existed to take a FULL-WIDTH painting into
the page so it had no bottom edge; on a centred, rounded picture it is a dark band across the bottom
third of a frame that has edges. The element and its mobile rule are untouched.

### D74 `[x]` The three icons come off the photograph as a SECOND COPY, not as a move

| | |
| --- | --- |
| **his words** | «колокольчик, письмо и шестеренка настроек живут на десктоп в правом верхнем углу вне картинки» – which reverses **D14**. |
| **shipped** | The row is drawn twice inside `HomeScreen.vue`, sharing every handler, every computed and every label: the hero's copy below 1024 and a page copy in the container's top-right corner from 1024, in a 34px band the desktop grid opens above its two columns. Exactly one is on screen at any width. |
| **why** | ⚠ **A MOVE WOULD HAVE MOVED A PHONE BOX, which nothing in this round may do.** `.diary-tools` is the last child of `.diary-head`, and `.diary-date` beside it is `flex: 1`; taking the icons out of that row widens the date's box by 108px at 375. Two copies with one visible costs no box on the side that is off – measured: the identity census reports **0 moved / 0 new / 0 gone at 375, 520 and 576**. ⚠ And it is AFTER the photograph in the DOM, never before: `.diary-hero:not(:first-child)` is round 35 #11's fix, and a sibling in front of the hero – even a hidden one – switches it off at every width. |

### D75 `[?]⚠⚠` Her face and her rank are TELEPORTED into the rail – and they are on Home, not on every page

| | |
| --- | --- |
| **his words** | «Аватар и ранг тоже уезжают с картинки, но в левый верхний угол в меню над всеми пунктами» |
| **shipped** | `App.vue` holds an empty `#rail-id-slot` as the first child of the one `nav.tab-bar` the app has; `HomeScreen` `<Teleport>`s the avatar button, the rank chip and the one-time callout into it (`defer`, because the slot renders after `<main>`). `order: -2` puts the block above every menu item – it has to beat the Home tab's own `-1` from item 8. The hero's copies stand down from 1024. |
| **why** | ⭐ **The arithmetic stays on Home and only the ELEMENTS travel.** The rank chip is five derived facts deep (`rankChipTrack`, the active ladder, her rank on that table, whether she is ranked at all, the movement since last week) and rebuilding any of it in the shell is this repo's named recurring disease – `HouseholdStrip.vue`'s header records the version of it that actually shipped. A teleport moves the boxes and leaves the derivation where it is. |

⚠⚠ **AND THIS IS THE ROW THAT NEEDS HIM.** The block is HomeScreen's, so it is on screen exactly
while Home is. **Making it permanent chrome on all ten screens is one line** – and it costs a THIRD
exemption in `e2e/parity.spec.ts`, because two controls that appear on nine screens at 1280 and on
none of them at 375 fail «ничего нового по идее не должно появиться» **by name**. That exemption
would also have to subtract Home's own pair to stay honest, which takes her face and her rank out of
the harness's reach everywhere. **His call: the price is a real one and it is not obviously worth
paying for chrome.**

### D76 `[?]⚠` Item 2's «на всех экранах» is NOT built, and this is the reason

His sentence has two halves – «в правом верхнем углу вне картинки» and «доступно на всех экранах,
кроме тех, что займут всё пространство». The first is built (D74). The second is not, and it is not a
layout job:

* the bell is `jumpToNews`, which **scrolls to `#diary-news`** – an element that exists on Home and
  nowhere else. From the Stats screen it would have to navigate first and then scroll, which is new
  behaviour, not a new position;
* the envelope opens `InboxSheet`, which Home mounts. A shell-level copy is a second mount of it;
* and the same parity exemption D75 names, for three more controls.

⭐ **What it would take, so the ask is one word rather than a re-scope:** the three handlers move to
`App.vue` (the two watermark composables are already imported there), `InboxSheet` mounts at the
shell, the bell learns «go to Home, then scroll», and the harness gains its third bounded exemption.
**Named here rather than half-built.**

### D77 `[x]` Home's two desktop tracks are AC's own numbers – a CAP and a FLOOR, not a ratio

| | |
| --- | --- |
| **his words** | «ширина этих карточек в макете около 310 пикселей» |
| **shipped** | `grid-template-columns: minmax(0, var(--hero-max)) minmax(310px, 1fr)` in place of phase 3's `1.2fr 1fr`. Measured: **451 / 310 at 1024** and **512 / 425 at 1280**. |
| **why** | A single ratio cannot hold both ends of the band. His 310 is measured on a 1024 frame and `--hero-max` (D19) on a 1280 one: the ratio that hits 450/310 puts the hero at **554 at 1280**, 42px past a cap that exists so Home's photograph and This Week's are the same picture. Written as a ceiling on column 1 and a floor on column 2, the track algorithm gives him his number where he measured it and spends the slack on the cards rather than on a hole beside a photograph that has stopped growing. |

### D78 `[x]` «Менее высокая» is ONE declaration, and the grid does the rest

| | |
| --- | --- |
| **his words** | «Next tournament — эта карточка менее высокая, чем family budget, т.к. на последней еще график должен поместиться» |
| **shipped** | The tournament card takes `.card-short`'s own 138px floor past 1024. Measured: **171 / 219 at 1024** and **198 / 246 at 1280**. |
| **why** | The hero spans both rows, so whatever height it has beyond the two floors is split equally between them – which makes the DIFFERENCE between the two cards exactly the difference between the two floors, at every width in the band, and the hero's bottom edge still lands on Family budget's. 138 is not a new number: it is the floor the coach note and the recent memory already use. |

### D79 `[x]⚠` The venue painting is sized by the card's HEIGHT, and on the desktop it grows least

| | |
| --- | --- |
| **his words** | «картинку на Next tournament можно смело делать больше, чтобы пропорционально она была похожа на карточку на мобиле и занимала больше места (и на планшете)» |
| **shipped** | `height: 84%; aspect-ratio: 112 / 136` from 768, and the two top cards get a **250px floor on the tablet band only**. Measured, against the phone's 112x136: **171 x 208 at 768**, **128 x 156 at 1024**, **147 x 179 at 1280**. |
| **why** | «Пропорционально как на мобиле» cannot be a pixel count on a card that doubles in width and keeps its height – on a phone the art is 71% of a 190px card, so it is 84% of whatever the card is, at the master's own ratio, and can never be taller than one. ⚠ **AND THE TWO HALVES OF HIS ITEM 4 PULL AGAINST EACH OTHER ON THE DESKTOP, which is said plainly rather than glossed:** the picture grows with the card, and #4's other half makes this the SHORTER card. The tablet lays them side by side and can simply be taller (250), so that is where the painting grows most. If he wants it bigger at 1024 too, the lever is the two cards' floors and it is one number – at the cost of the hero's bottom edge no longer landing on Family budget's. |

### D80 `[x]` The bottom pair gets its own grid through a `display: contents` wrapper

| | |
| --- | --- |
| **his words** | «Нижний блок карточек имеет свою сетку, они равны по ширине» |
| **shipped** | `<div class="card-pair">` around the coach note and the recent memory: `display: contents` at every width, and a two-track grid spanning `1 / -1` from 1024. Measured: **380.5 / 380.5 at 1024** and **468.5 / 468.5 at 1280**, against 415/346 and 511/426 before. |
| **why** | The two were inheriting the hero's column and the cards' column, which are deliberately unequal (D77). A block of their own is the only way they can be equal to each other. ⚠ `display: contents` is **D50's own trick applied a second time and for the same reason**: a wrapper with a box is a new box at every width, and this round's identity contract is that not one moves below 768. Measured: 0 new boxes at 375, 520 and 576. |

### D81 `[x]` Items 6 and 7 are seven declarations, all of them behind 768

| | |
| --- | --- |
| **his words** | «фотокарточку больше размером … сдвинь ее ближе к тексту и чуть дальше от края», «Сам шрифт на Recent memory и Coach note можно сделать крупнее» – both «и на планшете». |
| **shipped** | `.memory-polaroid` 68 → **104px** wide and `right: -4px` → **14px**; its tack moves with it; `.memory-line` and `.memory-when` take a share of the card rather than 80/86px; and four type sizes go one rung up in the families they were already set in – `.coach-line` 12 → 14, `.coach-sign` 17 → 19, `.memory-line` 17 → 20, `.memory-when` 12.5 → 14. |
| **why** | Both directions of «ближе к тексту и чуть дальше от края» are the same two moves: the photograph comes 18px inside the card, and 36px of extra width reaches back toward the words. ⚠ **The coach's portrait is deliberately NOT bounded**, though a taller card draws a wider man: `.coach-body`'s own note names that fix and declines it, because the portrait is `height: 100%; width: auto` on an owner ruling (A2c/d, 28.07 – the whole frame, no vertical crop), and a `max-width` on the strip is a crop by another name. The mask that fades him into the card carries the overlap here exactly as it does on a phone. |

### D82 `[x]` Home leads the rail through `order`, and the cost is named

| | |
| --- | --- |
| **his words** | «Home в боковом меню на первом месте сверху поставь пожалуйста» |
| **shipped** | One declaration: `order: -1` on `.tab-btn[data-tour='tab-home']`, inside the rail's own media block. |
| **why** | `TABS` is the BOTTOM BAR's order and Home's centring is emergent from it – «five slots, Home third», pinned by `ids[floor(len / 2)] === 'home'` – so re-cutting the array to satisfy a desktop rail moves the phone's navigation, which nothing in this round may do. The selector is an attribute the button already carries; `:nth-child(3)` would say «the third one» and go quietly wrong the day the array is re-cut. ⚠ **The cost, named rather than hidden: the rail's VISUAL order now leads with Home while its FOCUS order is still the document's**, so Tab reaches Season first. The alternative moves the phone. |

### D83 `[?]` «Больше информации» was read as THE METER'S OWN SET – cut what you do not want

| | |
| --- | --- |
| **his words** | «Плитки дашборда живут прибитые к меню выше, Coaching budget несёт больше информации» |
| **shipped** | `margin-top: auto` → `0`, so the cards hang off the navigation instead of the window's foot. And the Coaching-budget card gains the meter's other three figures: the fill bar (`meterPct`), «$x committed» and «$y weekly cap». |
| **why** | ⭐ **«Больше» is not specified, so what was added is the set that already exists rather than a figure somebody invented.** `useCoachingBudget()` exposes four things and this card printed one; the Coach Market's meter prints all four, in this order. **Not one number is derived here** – same composable, same call – and **not one word is new**: `committed` and `weekly cap` are `.budget-legend`'s own two, and the bar reuses `.budget-bar` / `.legend-dot`, declared once in `src/style.css` with the market as their other consumer. The free figure is untouched, because **D45 is his ruling about what this card's headline number IS**. |

⭐ **This is what «больше» was read as. Cut what you do not want** – each of the three is one line, and
the free figure alone is what it was.

### D84 `[x]⭐` Item 18 caps the app's CTA pill everywhere from 768 – and the two list ROWS are left

| | |
| --- | --- |
| **his words** | «кнопок в 700 пикселей не должно быть, максимум 500 пожалуйста с выравниванием по центру» – ⚙ his answer to **D20** and **D32**, which both parked this for him. |
| **shipped** | `.tb-pill--cta { max-width: 500px }` from 768, plus `display: block; margin-left/right: auto` inside `#app`. Measured on the Family Budget: «View all transactions» **526 → 500 and centred at 768**, **738 → 500 at 1280**. |
| **why** | Every affirmative CTA in the app is `PrimaryPill variant="cta"`, so the cap is written on the class and reaches the next one before it is written. ⚠ **768 and not 0, and it is «everywhere» in practice**: below 768 the reading column is `--app-col-max` (520) less two 16px gutters = 488px, so nothing inside the app can reach 500 – **censused at 375: zero controls over 500**. Starting lower would only move a takeover on a 560–767px window, and this round's contract is that no box moves below 768. |

⚠⚠ **AND THE CENSUS WAS RE-RUN AT FOUR WIDTHS, NOT ONE – which found a control D32 could not see.**
Every `button` / `input` / `select` on the twelve walked surfaces, sorted by width:

| width | what is over 500 after the cap | what it is |
| --- | --- | --- |
| 375 | – | nothing |
| 576 | `.cal-marker` 520 ×3, `.cm-row` 520 ×14 | list rows, below 768, untouched |
| 768 | `.cal-marker` 736 ×3, **`.news-match-btn` 706 ×9** | list rows |
| 900 | `.cal-marker` 868 ×3, **`.news-match-btn` 838 ×9** | list rows |
| 1280 | `.cal-marker` 948 ×3 | list rows |

⭐ **`.news-match-btn` is new information and D32 could not have had it: its census was taken at 1280
only, and this control is only wide in the TABLET band** (on the desktop Home the news feed is a
425px column). It is a `<button>` inside a `<td>` of the news table – «K. Ostrowski vs G. Lindner
6-2 5-7 · Watch» – and it is **left on D32's own merits, which he has not contradicted**: a row that
is as wide as its list is not a stretched control, and he said «кнопок». Same for `.cal-marker` and
`.cm-row`. ⚠ **If he means these too, it is one more rule – and it would be a restyle of three list
families rather than a cap on a button.**
