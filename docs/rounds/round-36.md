---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-04
---

# Round 36 – the interfaces on tablet and desktop (04.09.2026)

The spec is [`docs/specs/responsive-2026-09.md`](../specs/responsive-2026-09.md), approved by the
owner on 03.09 – «скорректируй план пожалуйста и запускай в работу весь план пошагово». It carries
his breakpoint ladder, his acceptance criterion and the five phases. This ledger tracks them.

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

| phase | what it is | status |
| --- | --- | --- |
| 1 | the parity harness + the container follows his ladder | `[x]` **shipped, this document** |
| 2 | tablet, 768–900 | `[x]` **shipped, this document** |
| 3 | desktop, 1024–1200 – the rail, the new shell | `[x]` **shipped, this document** |
| 4 | the screens the design does not cover | `[x]` **shipped, this document** |
| 5 – the build | ⚙ **his two rulings of 04.09: the week's listing becomes a JS pager with arrows on EVERY width, and the pre-draw figure's line moves off the season cards** | `[x]` **shipped, this document** |
| 5 – the document | `responsive-decisions-2026-09.md`, the contentious calls | `[>]` opened by phase 2, **forty-seven rows** after phase 6 – it is written AS the work happens |
| 6 | ⚙ **the rail's mini-dashboard, at his 04.09 ruling** – three desktop-only cards on every page, and the harness exemption that has to ship with them | `[x]` **shipped, this document** – both halves together, and both guards seen to bite |

---

## `[x]` PHASE 1 – the harness and the container

**Nothing about the app's appearance changed at any width it already supported, and that is measured
below rather than asserted.** Six files: `e2e/parity.spec.ts` (new) and this ledger (new); the
breakpoint ladder in `src/style.css`; `docs/specs/e2e-coverage.md` (two journey rows and a `parity`
entry on all ten screen rows, so the new spec is inside the coverage map's own rot alarm);
`tests/component/round14-group-c.test.ts` (the R14-9 pin, re-aimed – see below); and a row in
`docs/rounds/README.md`.

⚠ **A seventh file was corrected, and it was already broken when this phase started.**
`docs/specs/responsive-2026-09.md` – this round's own approved spec, committed by the session before
– carried `status: approved` and `canonical: true`, and `npm run check` was RED on `round/36` before
a line of phase 1 existed, with four errors: `approved` is not one of the audit's statuses
(`current` / `draft` / `reference` / `audit` / `historical` / `superseded`), a canonical document
must be `current`, must carry a `## Current truth` section, and **area `ui` already has a canonical
document** – `docs/context/ui-and-design.md`. Fixed to `status: current` / `canonical: false`, which
is what 97 of the 99 documents in `docs/specs/` say. **Frontmatter only; not one word of his spec
was touched.**

⚠ **And shipping this ledger obliged one more edit, by design.** `scripts/doc-facts.mjs` sources the
live wave from the newest file in `docs/rounds/`, so `docs/now-next-later.md`'s machine-checked
«⚙ THE LIVE WAVE IS ROUND 35» line went stale the moment `round-36.md` existed. Updated to 36 with a
paragraph naming this wave – which is the router working as intended rather than a chore.

---

### ⭐⭐⭐ THE FINDING THAT CHANGES WHAT EVERY LATER PHASE IS WORKING WITH

**`--app-max-width: 880px` is the FRAME. The column is 520.**

The spec's own "what the app does today" table records `--app-max-width` at 880px and concludes «the
app is a phone column that never grows», which is right about the conclusion and wrong about the
number. `--app-max-width` caps `#app` – the padded frame. What a player actually reads is
`main.app-content` INSIDE it, and that has been capped at a flat `520px` since the app shell was
written. Measured in Chromium on `origin/main`:

| viewport | `#app` | `.app-content` – what he actually sees |
| --- | --- | --- |
| 375 | 375 | **343** |
| 576 | 576 | **520** |
| 768 | 768 | **520** |
| 1280 | 880 | **520** |

So on his 1280px screen the app today is a **520px column with 380px of empty page down each side**,
not the 880 the token suggested. Three consequences, and they are the reason this is at the top:

1. ⚠ **Widening only `#app` would have changed NOTHING on screen** – and the parity harness would
   have stayed green while doing it. That is the quietest way a responsive pass can be vacuous: a
   ladder that ships, measures clean, and moves nothing.
2. **There is more room to fill than anyone budgeted for.** Phase 3's rail and card set are being
   laid into a column that has to grow 520 → 1168, not 880 → 1168.
3. **Five rules carried that literal `520px`, not one** – counted, not quoted: `.app-content`,
   `.tab-bar`, `.next-week-bar`, `.recovered-banner`/`.stop-toast` and `.update-banner`. Three are on
   the token now; the two notice strips are deliberately left at 520 – see the decisions below.

---

### THE LADDER, AS SHIPPED

His ruling, unchanged: `< 768` mobile · `768–900` fluid · `901–1023` fixed at 900 and centred ·
`>= 1024` fluid to 1200, then capped.

Three tokens in `src/style.css` – `--app-shell-max` (the frame), `--app-col-max` (the column),
`--app-bar-max` (the two fixed bars) – and three media blocks, at 768, 901 and 1024. **Every rule
starts at 768, so below it not one computed value moved.**

| viewport | `#app` | column | tab bar / CTA |
| --- | --- | --- | --- |
| 375 / 520 / 576 | 375 / 520 / 576 | 343 / 488 / 520 | unchanged |
| 768 → 900 | grows with the window | 736 → 868 | tracks the column exactly |
| 901 → 1023 | **900, centred** | **868** | 868 – ⭐ the plateau holds, the offset grows 16.5 → 77.5 |
| 1024 → 1200 | grows | 992 → 1168 | tracks |
| 1280 / 1440 | **1200, centred** | **1168** | 1168 |

#### ⚠⚠ THE LADDER WAS BUILT THE WRONG WAY ROUND FIRST, AND A TEST CAUGHT IT

Worth recording in full, because the wrong answer was the more *principled*-looking one.

`--app-max-width` has two consumers besides `#app`, both full-screen takeovers outside the frame:
the onboarding wizard (R14-9) and the tour briefing. `tests/component/round14-group-c.test.ts` pins
them to that token with the sentence *"a hard-coded 880 here would be a second cap that drifts the
first time the app frame moves"* – so the first build laddered `--app-max-width` itself, reasoning
that this was that time and that splitting the token was the drift the pin forbids. It even looked
confirmed: that pin stayed green with no edit.

**`tests/component/tour-briefing.test.ts` went red instead**, with the whole argument in one line:

    ⭐ on a phone it is FULL WIDTH, and on desktop no wider than the content container
    AssertionError: capped at the content container, not at the room: expected 1200 to be 880

That is round-20 #3's own mutation-verified measurement, and it was right. Laddering the shared
token made the tour briefing – a **dialog** – 1200px wide on a desktop, and the onboarding wizard
with it. Phase 1's contract is «nothing moves yet»; how wide an onboarding column should be on a
1440px monitor is a design decision, and it belongs to phase 3's shell and phase 5's review
document, not to a container change that was supposed to be invisible.

**So the ladder moved onto its own token, `--app-shell-max`, and the two takeovers keep the 880 they
have today at every width.** ⚠ And re-reading R14-9's pin, the reversal does not violate it: what it
forbids is a **hard-coded 880 in a component** – the two takeovers still share ONE NAMED TOKEN and
still spell no number of their own. It was never a claim that the frame and the takeovers must be
the same number forever. `round14-group-c.test.ts` was edited to say which half of it moved and
which did not; `tour-briefing.test.ts` needed no edit at all, which is the signal that the second
formulation is the right one.

---

### `[x]` THE PARITY HARNESS – `e2e/parity.spec.ts`

His own suggestion – «возможно здесь как раз нас могу выручить playwright?» – and it is the stronger
instrument: `tests/component/` runs in happy-dom, which has no layout engine, so a mounted test can
only prove a node EXISTS. A real browser proves it is in the accessibility tree, has a box, and is
reachable.

**WHAT IT COVERS: all ten screens, at 375 / 768 / 900 / 1280, one test per screen.**

`HomeScreen` · `SeasonScreen` · `CalendarScreen` · `StatsScreen` · `TrophiesScreen` · `MoneyScreen` ·
`MoreScreen` · `KidScreen` · `CoachMarketScreen` · `ThisWeekScreen`

**HOW THE LIST IS DERIVED, because a hand-written one is one forgotten screen away from proving
nothing:** it is `readdirSync('src/components/screens/')`, the same closed set `coverage-map.spec.ts`
already holds against this repo. Every file in it must have a station – a door a player uses and an
anchor that proves the walk arrived – or the test `every screen in src/components/screens/ has a
station in this file` goes red **naming the file**. A screen added by phase 2, 3 or 4 cannot join the
app without joining this walk.

**THE FINGERPRINT**, per screen per width: every interactive element and every heading by ROLE and
ACCESSIBLE NAME (Playwright's own aria snapshot, which is already visibility-filtered –
`display:none`, `visibility:hidden` and `aria-hidden` are absent from the a11y tree), plus every icon
and painting by the FILE IT LOADS. The second half exists because our icons are deliberately
invisible to the first: `ui/AppIcon.vue` draws a masked `<span aria-hidden="true">`, so «все иконки
наши» would otherwise be unmeasured.

#### ⚠ WHAT IT CANNOT PROVE, stated in the file itself

It proves **presence, visibility and reachability**. It does not prove the layout is good. It cannot
see a control that is on screen but ugly, mis-aligned, overlapping or too small for a thumb – that
judgement is his, and he has said so: «я утром буду всё уже сам глазами смотреть». Three narrower
holes, each real: it is **blind to order** (the fingerprint is a multiset, so a wide layout may
reshuffle freely – deliberate, since rearranging is the wave's job); it is **blind to a decorative
glyph that carries no file**; and it **sees one state per screen**, so a control that only exists in
a branch nobody walks is one it cannot answer for.

#### THE FOUR-WIDTH RESULT – green, and every screen the same size at every width

`npm run test:e2e -- -g "1 to 1"` → **11 passed, `E2E_EXIT=0`** (read from the log file, not from a
pipe and not from a background notification – the notification for the run before it said *exit code
0* while the log said `E2E_EXIT=1`, which is CLAUDE.md's gotcha (c) happening).

Fingerprint size per screen at 375, and **identical at 768, 900 and 1280**:

    Calendar 19 · Stats 20 · ThisWeek 25 · Kid 31 · More 32 · Money 35
    Season 46 · Home 52 · Trophies 59 · CoachMarket 60

`FINGERPRINT_FLOOR` is set at 15 off those numbers – under the smallest with room to spare. It is the
tripwire for a walk that collapsed: **four empty sets are equal**, so a station that silently failed
to arrive would pass forever. Two more mechanisms guard the same hole: every station asserts arrival
against a role-and-name anchor before it measures, and the viewport height is fixed at 900 for all
four widths so "more rows fit" can never masquerade as a difference.

#### ⚠ ONE RED RUN ON THE WAY, AND IT MADE THE HARNESS STRONGER

The first run failed on `CoachMarketScreen.vue`: fifteen coach portraits "appeared" at 768 that were
"missing" at 375. Every one was a false alarm. The portraits are `loading="lazy"`, the market is a
long list, and a narrow column is a TALLER page – so at 375 the ones far below the fold had never
been fetched, measured 0x0, and dropped out. Nothing about the app differed; the measurement did.

The fix is the stronger claim rather than an exemption for lazy images: the walker now rides the page
to the bottom in viewport-sized steps, comes back, and waits for every image to finish before
measuring. «Всё, что есть на мобиле» is about what the SCREEN holds, not about what happens to be
inside the first 900px of it.

#### ⭐⭐ THE DELIBERATE BREAK – the harness has been seen to fail

A harness whose failure has never been seen is not a harness. Home's Settings gear was hidden at
desktop only and the suite re-run:

```css
@media (min-width: 1024px) { .diary-tool { display: none } }   /* inside HomeScreen.vue, scoped */
```

→ `BREAK_EXIT=1`, and it names them:

```
HomeScreen.vue: these are on the phone at 375px and NOT at 1280px.
«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»
  + "button \"Go to the news feed\""
  + "button \"Open the inbox\""
  + "button \"Settings\""
  + "img \"A letter waiting on an answer\""
  + "svg <unclassed> ×3"
```

Reverted immediately; `HomeScreen.vue` verified byte-identical afterwards.

⚠ **AND THE FIRST ATTEMPT AT THE BREAK WAS INERT, which is its own lesson.** The same rule appended
to `src/style.css` globally left the suite GREEN – `HomeScreen.vue`'s own scoped `.diary-tool` rule
carries a `[data-v-…]` attribute and outranks it, so the gear never hid. A mutation that does not
mutate looks exactly like a harness that does not bite. The rule was moved inside the scoped block –
where a real phase-2 change would live – before the verdict was believed.

---

### `[x]` NOTHING MOVED AT A WIDTH THE APP ALREADY SUPPORTED – measured, not asserted

The control is `origin/main`'s `src/style.css` swapped into this tree and built (CLAUDE.md: the
control is your change reverted, in your own tree). Both builds were driven through the same walk of
all ten screens, and **every element in the document** was censused – tag, class, document-order
index, and its box to 2dp.

| viewport | screens | element boxes | boxes that moved between `origin/main` and this branch |
| --- | --- | --- | --- |
| **375** | 10 | 2321 | **0** |
| **520** | 10 | 2319 | **0** |
| **576** | 10 | 2319 | **0** |
| 768 | 10 | 2319 | 2169 |
| 1280 | 10 | 2319 | 2175 |

⚠ **The two wide rows are the point of the table, not a footnote.** A null result is a claim and needs
the same provenance as a positive one; without a demonstrated detector, "0 boxes moved" is equally
consistent with an instrument that is blind. The same census, on the same screens, in the same run,
moves ~2,170 boxes at each width where the ladder bites. So the three zeros are a measurement.

The computed caps, `origin/main` → this branch, confirm the mechanism and the finding at the top:

```
 375   main  #app 880px->375px  .app-content 520px->343px   head  identical
 576   main  #app 880px->576px  .app-content 520px->520px   head  identical
 768   main  #app 880px->768px  .app-content 520px->520px
       head  #app 100% ->768px  .app-content 100% ->736px
1280   main  #app 880px->880px  .app-content 520px->520px
       head  #app 1200px->1200px .app-content 100%->1168px
```

⚠ A curiosity worth recording, because it is NOT a defect and the next person will meet it: at 375
Home carries two more elements than at 768 – `button.diary-kid-hint` and `span.note-dot`. It appears
**identically in both arms**, so it is not this change. It is state, not width: visiting `KidScreen`
and `ThisWeekScreen` earlier in that walk dismisses the hint and marks the recap seen. The parity
harness is immune to it because each station gets **its own test and its own career**, and that
isolation is now load-bearing rather than incidental.

---

### Decisions taken in phase 1 that later phases inherit

1. **The frame's ladder is `--app-shell-max`; the two takeovers stay on `--app-max-width` at 880.**
   Argued above. ⭐ **A row for `responsive-decisions-2026-09.md` in phase 5**: should the onboarding
   wizard and the tour briefing follow the frame out to 1200 on a desktop? Phase 1's answer is «not
   in this phase, and not by accident» – it is his call, and the token is the single place it gets
   made.
2. **The tab bar and the floating CTA follow the column.** `src/style.css` already said the bar
   «hugs the content column»; a 520px bar under a 1168px column would be the container change
   half-applied. They track it exactly at every width – measured, not assumed.
3. **The two top notices stay at 520.** `.recovered-banner` / `.stop-toast` and `.update-banner` are
   notice strips, not the shell; a 1168px-wide toast is a redesign nobody asked for. They are
   centred in the column and read as deliberate. Revisit in phase 3 if he says otherwise.
4. **`e2e/parity.spec.ts` is the viewport-aware sibling the spec's phase-1 bullet asks for.**
   `tests/component/fits.ts` models boxes in happy-dom because it has no layout engine; this measures
   them in a browser. Both stay – they answer different questions.

### Open at the end of phase 1

- `[?]` do the onboarding wizard and the tour briefing follow the frame to 1200 on a desktop, or
  stay at 880? Phase 1 left them at 880 deliberately – decision 1 above, and a phase-5 row
- `[ ]` phases 2–5, unstarted

---

## Gates

Run one at a time on a quiet machine – never concurrently, per CLAUDE.md's contention gotcha – and
**every exit code read out of the log file**, never from a pipe and never from a background task's
completion notice. Both lies showed up in this round: the notification for the first harness run said
*exit code 0* over a log that said `E2E_EXIT=1`, and the wrapper for the final chain said *exit code
0* over `CHECK_EXIT=1`.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** – the whole browser suite, parity included |
| `npm run test:component` | **`COMPONENT_EXIT=0`** – 1304 tests |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |
| `npm run check` | **`CHECK_EXIT=0`** – red before this phase on the spec's frontmatter, above |

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

---

## `[x]` PHASE 2 – THE TABLET BAND, 768–900

His design for it, in his own words: «планшеты – это по сути широкий телефон, hero image на home
будет НЕ квадратной, но все оверлеи с текстом остаются как у нас.»

**Seven files of app, five of tests, two of documents.** `src/style.css` (the `--hero-aspect` rung
and the coach market's tablet grid); `HomeScreen.vue` and `NextTournamentPanel.vue` (the two heroes,
onto one token); `SeasonScreen.vue` (the week, two cards to a row); `WeekRecapCard.vue` (a picture
that had stopped growing at 390px); `CalendarScreen.vue` and `ThisWeekScreen.vue` (the two floating
CTA boxes phase 1's own decision missed). Tests: `fits.ts` gains `TABLET`, and the tablet arms went
into the four files that already own each mechanism – `round34-week-stack`, `round18-coach`,
`round30-next-tournament-layout`, `vacation-crop`. Documents: `docs/specs/responsive-decisions-2026-09.md`
(new, twelve rows) and this ledger.

⭐ **No new component, no new icon, no new string.** The diff is nine CSS rules and one token; every
mechanism it moves was already in the tree, and `git diff` on the templates is empty except for
nothing at all – not one `.vue` template line changed in this phase.

---

### WHAT MOVED, PER SCREEN, MEASURED

Boxes are `x,y,w,h` in Chromium at a 900px-tall viewport, off the same walk of all ten screens the
mobile-identity census below uses. `before` is phase 1 as shipped (`db331979`).

| | 375 | 768 before → after | 900 before → after |
| --- | --- | --- | --- |
| the column (`.app-content`) | 343 | 736 (phase 1) | 868 (phase 1) |
| **Home** hero | 375×375 | 768×**540** → 768×**400** | 900×540 → 900×**468.75** |
| **Season** week card | 343 | **736** → **362** | 868 → **428** |
| **Season** tournament card | 343 | **736** → **362** | 868 → **428** |
| **Coach market** row | 343 | **736** → **364** | 868 → **430** |
| **This week** recap painting | 343×251 | **390×286** → **736×286** | 390×286 → **868×286** |
| Calendar / This-week CTA box | 375 | **520** → **736** | 520 → **868** |

…and the pages got shorter, which is the whole of «больше видно одновременно»:

| page height | 768 before → after | 900 before → after |
| --- | --- | --- |
| Home | 1553 → **1413** | 1553 → **1482** |
| Season | 3746 → **2784** | 4122 → **2936** |
| Coach market | 3001 → **2388** | 3001 → **2191** |

#### Season – the two numbers he asked for by name

«1 неделя = 1 ряд, максимум 2 карточки видно, свайп для 3+», frame `AD-season-tablet-768.png`.

* **Two cards fill the row exactly.** At 768 each card is `calc(50% - 6px)` = 362px, and
  362 + 12 + 362 = **736**, the whole column. At 900: 428 + 12 + 428 = **868**. Both cards are on
  screen and nothing hangs past them.
* **Three or more shrink so the third shows.** `calc(44% - 6px)` = 317.8px at 768, so two cards and
  the gutter come to 647.7 and **88px of the third is showing** – the phone's own affordance (its
  card is 88% and the next card's edge is what tells a thumb to swipe), spent on the same 12%. At
  900 the sliver is 104px. ⚠ **The swipe itself is round 34's and was not touched**:
  `.week-stack.swipeable` carries `overflow-x: auto` and `scroll-snap-type` outside any media query,
  and round 34's own phone arm still asserts them.
* **A one-card week is half a row too** – the frame's own answer, and the most contentious call in
  the phase. **D2** in the decisions document, with the cost measured and a one-line reversal named.

#### Coach market – «4 карточки»

Two to a row, so the first tier's four cards are in the first screenful, which is what AJ draws.
The card is 364px against the phone's 343 – **nineteen pixels** – which is why the portrait strip
stays at 62px: his «если влезает» is a condition and it is not met (**D3** and **D4**).

#### The two heroes, joined by a token

`--hero-aspect` is `1 / 1` below 768 and `768 / 400` above it, and BOTH `.diary-hero` and `.nt-hero`
read it – because «Tournament (AF): the image takes the same proportion as the home hero» is a join,
not a coincidence. Round 30 #6 had already said «по примеру главной» and the two shapes agreed only
by both spelling `1 / 1`; they cannot drift now.
⭐ **Every text overlay stayed where it was, for free**: they are all `position: absolute` against the
hero's own box, so a shorter hero moves none of them relative to the picture.

---

### ⚠⚠ THREE THINGS THIS PHASE FOUND THAT WERE ALREADY BROKEN

**1. The week recap's painting stopped growing at 390px.** `.recap-art` measures 343×251 at 375 and
then **390×286 at 520, 576, 768, 900 AND 1280** – a block with an `aspect-ratio` and a violated
`max-height` has its WIDTH transferred back down the ratio. So at 768 a 390px photograph sat under
the 736px paper note that rides on it. The cap's own comment («capped at D's number so a tablet does
not turn the story into a poster») describes a 736×286 BAND, which is what `width: 100%` now gives.
⚠ **Fixed at ≥768 only.** 520 and 576 carry the identical collapse and phase 2 may not move anything
below 768 – it is left, deliberately, and it is **D11**.

**2. Two of the three floating CTA boxes were still 520px.** Phase 1's decision 2 said «the tab bar
and the floating CTA follow the column» and put `.next-week-bar` on `--app-bar-max`; `.cal-go`
(Calendar) and `.week-proceed` (This week) are the same six declarations in two SFCs and kept a
literal 520. Both are on the token now. **Nothing on screen moves** – the button inside each is
centred, so the box was wrong without being visible – which is exactly why it survived phase 1.

**3. `happy-dom` reads media queries, at 1024, and two shipped pins had never noticed.**
`round30-next-tournament-layout.test.ts` asserted `.nt-hero` is `1 / 1` **at happy-dom's default
1024px** – a width the app had no rule for, so the answer happened to be a phone's. It is width-explicit
now (`PHONE` for the square, `TABLET` for the tablet shape) and that is a fix to the test, not a
loosening of it. ⭐ The same is true of round-18 #2's two coach-strip measurements: mutating `.cm-art`
to 78px inside the tablet block reddens BOTH of them, so they have been guarding this band all along.

**4. …and a fourth thing was caught by a pin, on this phase's own comment.** `round13-nav.test.ts`
reads `ThisWeekScreen.vue` and `CalendarScreen.vue` as TEXT and refuses the shell bar's class name in
either of them – the pin that keeps the week-advance act in the App shell. Both new comments named
that class while explaining that these two boxes are copies of it, and the unit suite went red on a
sentence. **The comments were reworded; the pin was not touched.** It is right to be that blunt – it
cannot tell a comment from markup, and the thing it protects is a career that cannot be advanced
twice – so the note now says which pin it is walking around and why.

Three happy-dom facts were measured on the way and are written down beside `TABLET` in
`tests/component/fits.ts` and in the rules themselves, because each cost a wrong answer first:

* a media query is evaluated on an element's **first computed-style read and then cached** – so
  `setViewport` must come BEFORE the mount, or the measurement reads the previous screen;
* `calc((100% - 12px) / 2)` is **dropped entirely** (the property comes back as `''`), which is why
  the Season widths are spelled `calc(50% - 6px)`. A form the mounted gate cannot read is a rule
  with no test;
* at **equal specificity a rule inside `@media` loses to one outside it** – the reverse of what a
  browser does. The Season rules therefore win on specificity (`.event-cards …`) rather than on
  source order, which is correct in both engines.

---

### `[x]` NOTHING BELOW 768 MOVED – re-run, and still zero

The instrument phase 1 built and did not commit, rebuilt: every element in the document at all ten
screens, censused as tag + class + document-order index + box to 2dp, at six widths, one fresh career
per width. Arm A is phase 1's shipped head (`db331979`), arm B is this phase.

| viewport | element boxes | boxes that moved, phase 1 → phase 2 |
| --- | --- | --- |
| **375** | 2321 | **0** |
| **520** | 2321 | **0** |
| **576** | 2321 | **0** |
| 768 | 2321 | 709 |
| 900 | 2321 | 707 |
| 1280 | 2321 | 502 |

**6,963 boxes across the three mobile widths, and not one of them moved.** The three wide rows are
what makes the three zeros a measurement rather than a blind instrument – the same census, the same
screens, the same run.

⚠ 1280 moves 502 rather than 709 because Home's hero does not change there: at 1280 the frame is
1200 wide and `max-height: 60vh` already clamped the square to 540 – the same 540 the ratio yields.
The desktop band is phase 3's.

### ⚠ THE ANTI-VACUITY CHECK, AND THE HONEST ANSWER IS NOT THE ONE THAT WAS ASKED FOR

Phase 1 reported **2,169** boxes moving at 768 between `origin/main` and its own head. This phase's
instrument reproduces that: a third arm, C, built by putting `origin/main`'s `src/` into this tree,
scores **2,170** (the one-box difference is 2,321 boxes here against phase 1's 2,319 – its walk
carried two state-dependent elements on Home that a fresh career per width avoids). So the
instruments agree and the comparison is real.

**But the cumulative count barely moves: `origin/main` → phase 2 is 2,178 against phase 1's 2,170 –
eight boxes.** That is not phase 2 doing nothing; it is the metric **saturating**. Phase 1's ladder
already moved 93.5% of every box on the app, and a box that has already moved cannot move again in a
count. Only **8 boxes at 768** (7 at 900) are ones phase 1 left where `origin/main` had them.

So the count is answered with a second measurement it cannot fake – **total displacement**, the sum
of |Δx| + |Δy| + |Δw| + |Δh| over every box:

| at 768 | boxes | pixels moved |
| --- | --- | --- |
| `origin/main` → phase 1 (the container ladder) | 2,170 | **497,232** |
| phase 1 → phase 2 (this phase) | 709 | **448,651** |

**Phase 2 moves 90% as much geometry as the whole container ladder did, on a third as many boxes.**
At 900 it is 523,154px against 783,123. That is the number this phase should be read by; the
cumulative count is the wrong instrument for anything after phase 1 and saying so is part of the
measurement.

---

### `[x]` PARITY – green at 375 / 768 / 900 / 1280, on every screen

`e2e/parity.spec.ts` was run against every change as it was made, not once at the end. Nothing
appeared and nothing went: the census above records **2,321 element boxes at every one of the six
widths in both arms**, which is the same claim from the other side – phase 2 changed where things
are, never whether they are.

### THE DECISIONS DOCUMENT – `docs/specs/responsive-decisions-2026-09.md`, twelve rows

Phase 5's document, opened here and written as the work happened. Four of the twelve are marked
`[?]` – the ones where his eyes could reasonably change the answer:

| | |
| --- | --- |
| **D1** `[?]` | Season SWIPES; the design's §6 explicitly rejected swipe rows in favour of a grid. **His instruction beat his design.** |
| **D2** `[?]` | A one-card week is half a row – AD's own answer. ⚠ The frame has three week rows; a season has forty-eight, and in the `pro` career every one offers a single choice, so **the right half of the calendar is empty down the page**. The cost is measured and the reversal is one line. |
| **D3** | «4 карточки» read as four on screen (two per row), not four per row. |
| **D4** | The coach portrait stays 62px – his «если влезает» is not met at 362px, and two shipped rules (round-18 #2's mask geometry, `coach-match-edge.md` §4's anti-shopping rule) stand behind it. |
| **D5** | Our market shows sixteen coaches where AJ shows eight – **his acceptance criterion forbids the frame**. |
| **D6** | The hero's tablet shape is the DESIGN's 400px, expressed as a ratio. The one place this phase took the design's number over ours, because ours was the square he asked us to stop drawing. |
| **D7** | «Her own account» is ours with the photograph; AL draws it without one. Not one declaration touched. |
| **D8** `[?]` | Home's news feed stays ONE column; AB and the handoff both give it two. |
| **D9** | Home's season strip keeps its «…»; the design opens all 17 rungs. ⚠ **His two instructions collide** – the strip renders the same seven boxes at 375 and 768, so opening it at 768 alone would put controls on the tablet that are not on the phone and fail the parity harness by name. |
| **D10** | The recap painting grows to the column – a defect fix on a screen his phase-2 list does not name. |
| **D11** | …and the same collapse at 520/576 is deliberately left, because nothing below 768 may move. |
| **D12** `[?]` | Her Kit keeps its 2×2 rung grid; AP stands it four in a row. Same question as D8: **does «widen the column» include re-flowing a grid the extra width has made loose?** One answer settles both. |

### Gates – phase 2

Run one at a time, and **every exit code read out of the log file**, never from a pipe and never from
a background task's completion notice. Both lies fired again in this phase: the wrapper reported
*exit code 0* over a chain whose logs said `CHECK_EXIT=2` and then `QUIET_EXIT=1`, and there were two
real failures inside it.

| gate | result |
| --- | --- |
| `npm run check` | **`CHECK_EXIT=0`** – the whole pre-push gate, 1314 component tests and the build |
| `npm run test:quiet` | **`QUIET_EXIT=0`** – green in 332s |
| `npm run test:component` | **`COMPONENT_EXIT=0`** – 1314 tests (1304 before this phase; ten new arms) |
| `npm run test:e2e` | **`E2E_EXIT=0`** – 46 tests, the eleven parity walks among them |

⚠ **One run of `npm run check` exited 1 with an EMPTY LOG** – no output at all, not one assertion,
not one `vue-tsc` line. Re-run unchanged in the same tree it exited 0 and printed all of it. That is
CLAUDE.md's contention gotcha wearing its quietest face: a failure with no failing thing in it is the
machine, and the way to tell is to run it again rather than to go looking for a cause.

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

### The ten new test arms, and every one is mutation-verified

| file | arms | what a mutation reddened |
| --- | --- | --- |
| `round34-week-stack.test.ts` | 4 | the tablet width back to 88% → the two-card arm alone; the `:has()` width raised → the three-or-more arm alone; the week-card width dropped → the non-tournament arm alone; the whole media block moved out of reach → all three, with the phone arm still green |
| `round18-coach.test.ts` | 3 | one grid column → the two-up arm alone; the row's margin restored → the gutter arm alone; the portrait widened to 78px → the new arm AND round-18 #2's own two strip tests |
| `round30-next-tournament-layout.test.ts` | 1 (+2 re-aimed) | a literal `1 / 1` back on `.nt-hero` → the tablet arm; one on `.diary-hero` → the join |
| `vacation-crop.test.ts` | 2 | `width: 100%` removed → the tablet arm; moved out of the media query → the phone arm |

⚠ **And one mutation of mine went green when it should not have, recorded because it nearly passed as
evidence**: `width: 88%` inserted ABOVE the tablet width in the same rule changes nothing, because
the later declaration wins. A mutation has to be a replacement, not an addition.

### Open at the end of phase 2

- `[?]` **D1, D2, D8, D12** – his morning, and D2 is the one to look at first
- `[?]` the onboarding wizard and the tour briefing at 880 vs 1200 (phase 1's decision 1)
- `[ ]` `.recap-art`'s 390px collapse at 520 and 576 (D11) – a phase-4 or an owner call
- `[ ]` phases 3, 4 and 5

---

## `[x]` PHASE 3 – THE DESKTOP SHELL, 1024–1200

His design for it, in his own words: «Рельса слева, на всю высоту, скроллится при переполнении,
одинаковая на каждой странице… Колокольчик, почта и настройки остаются справа сверху, внутри
контейнера… Жёлтая кнопка **не как в дизайне** – прижата к низу с отступом от края, дополнительных
слов возле кнопки нет.»

**Seven files of app, one of the harness, nine of tests, four of documents.** `src/style.css` (the
frame's grid, the rail, four new tokens and the market's desktop row); `HomeScreen.vue` (frame AC's
two columns, and the ladder that opens itself); `SeasonScreen.vue` (three cards to a row);
`NextTournamentPanel.vue` (the hero's cap); `MoneyScreen.vue` (the kit ladder, and «Her own
account»); `CalendarScreen.vue` and `ThisWeekScreen.vue` (the two floating CTA copies, onto the two
new tokens). The harness is `e2e/parity.spec.ts`, which now measures what is REACHABLE. Tests: one
new file (`tests/component/round36-desktop-shell.test.ts`) and eight re-aimed or extended. Documents:
nine new rows and four rewritten in `docs/specs/responsive-decisions-2026-09.md`, this ledger, the
coverage map's `parity` line and the rounds README.

⭐ **No new component, no new icon, no new string.** The rail is the bottom bar; Home's desktop is
Home's own DOM re-flowed; every control on every screen is the one the phone has.

---

### ⭐⭐⭐ THE RAIL IS THE BOTTOM BAR STANDING UP, AND THAT IS THE ONLY READING HIS CRITERION ALLOWS

A rail that DUPLICATED the five tabs would put five buttons on a desktop that are not on a phone, and
`e2e/parity.spec.ts` fails «ничего нового по идее не должно появиться» by name. So there is one
`nav.tab-bar` at every width and the media query only re-lays it: `position: sticky`, full height,
`overflow-y: auto`, the tabs running down instead of across, and the active one on the app's own
`--accent-wash` instead of only a colour.

**The frame carries it.** `#app` becomes `display: grid` past 1024 with the rail as column 1 and
everything else as column 2 – so the rail is a COLUMN of the centred 1200px frame rather than a box
positioned against the window, and there is no viewport arithmetic anywhere in the shell. Three
things about that rule are load-bearing and each cost a wrong answer first:

* ⚠ **`:has(> nav.tab-bar)` is not a flourish.** `#app` is also the parent of the storage-recovery
  screen and the «Loading…» line, which render INSTEAD of the tab shell; a grid whose first column is
  196px of rail would indent both behind a rail that is not there.
* ⚠ **The rows are declared.** `grid-row: 1 / -1` counts `-1` from the end of the EXPLICIT grid, so
  with no `grid-template-rows` it degenerates to one row and the rail's sticky range collapses to the
  height of whatever shares it. Four `auto` rows cost nothing empty and cover the shell's real worst
  case (two top notices, the main column, one spare).
* ⚠⚠ **AND THE COLUMN HAD TO BE TOLD TO FILL ITS TRACK – a defect that shipped for one build of this
  phase and was caught by measuring rather than by looking.** `.app-content` is
  `max-width: var(--app-col-max); margin: 0 auto`, and **a grid item with AUTO INLINE MARGINS does
  not stretch**: auto margins beat `justify-self: stretch`, so the box falls back to max-content and
  the margins centre what is left. Measured in Chromium before the fix: Home filled its 948px track
  (its cards are wider than that) and **Season came out 698.89px wide, centred, with 124px of page
  down each side** – the same screen at the same width, two different column widths, out of one
  declaration written for a block layout. `width: 100%` makes the auto margins resolve to zero.

⚠ **What the rail does NOT carry is the card set, and that is D13 – the row most worth his morning.**
Three of AC's four rail cards do not exist in this app as blocks; his own frames disagree about
whether the set is on every page (AC four, AE one, AK one, AG none, AM none); and Home's cards on
every page would put controls on Season and Calendar at 1280 that the phone has not got. The
navigation IS identical on every page, which is the half that can be.

---

### WHAT MOVED, PER SCREEN, MEASURED

Boxes are `x,y,w,h` in Chromium at a 900px-tall viewport, off the same walk of all ten screens the
identity census below uses. `before` is phase 2 as shipped (`6a2bb372`).

| | 375 | 1024 before → after | 1280 before → after |
| --- | --- | --- | --- |
| the frame (`#app`) | 375 | 1024 | 1200, centred |
| the rail (`nav.tab-bar`) | 375×52, along the bottom | 992×52, bottom → **212×900, down the left** | 1168×52, bottom → **212×900, down the left** |
| the reading column (`.app-content`) | 343 | 992 → **772** | 1168 → **948** |
| **Home** hero | 375×375 | 1024×533.33 → **415.08×368.95** | 1200×540 → **511.08×454.28** |
| **Home** next-tournament / budget cards | 166, side by side | 490.50, side by side → **345.92, stacked beside the hero** | 578.50 → **425.92, stacked beside the hero** |
| **Home** coach note / memory cards | 166 | 490.50 → **415.08** | 578.50 → **511.08** |
| **Season** week card | 343 | 490 → **249.33** | 578 → **307.98** |
| **Coach market** row | 343 | 492 → **382** | 580 → **470** |
| **Family budget** «Her own account» | 343 | 992 → **640** | 1168 → **640** |
| **Her kit** rung (behind the Bills tab) | 153.5, 2×2 | 2×2 → **one row, 172 wide at 768** | 2×2 → **one row, 225 wide** |
| the floating CTA box | 375 | 992, centred on the window → **772, centred on the COLUMN** | 1168 → **948, centred on the COLUMN** |

…and the two screens he looks at most got a third shorter:

| page height | 1024 before → after | 1280 before → after |
| --- | --- | --- |
| Home | 1547 → **1140** | 1553 → **1207** |
| Season | 3064 → **2706** | 3296 → **2703** |
| Coach market | 2162 → **2375** | 2012 → **2162** |

⚠ **The market is the one page that got LONGER, and the rail is why** – it takes 220px off every
screen, so two coaches to a row are 382px at 1024 where they had 492. That is D21, and
`--app-rail-w` is the single place it is decided if he wants the strip narrower.

#### Home is frame AC, and it is Home's own DOM re-flowed

`AC-home-desktop-1024.png` lays the page as two columns: the photograph down the left with the
next-tournament and family-budget cards stacked beside it, then the coach note and the recent memory
side by side, then the season ladder and the news feed side by side. **That is exactly the six blocks
this screen already renders, in exactly the order it already renders them.**

⭐ The mechanism is `display: contents` on `.card-grid`. A box cannot be a cell of its parent's grid
AND spread its children across it; `display: contents` removes only the WRAPPER's box, so the four
notecards become items of the shell's grid directly. **No wrapper is deleted, no card moves in the
DOM, and the parity harness sees the same elements it sees at 375.** It is safe for the fingerprint's
paint half too, because `.card-grid` carries no background, border or icon of its own – a wrapper
with a picture on it could not be dissolved this way.

⭐ The hero spans both card rows, and a spanning item sizes the tracks it crosses – so when the
photograph is the taller of the pair the two cards grow to meet it and the row closes exactly.
`align-self: start` stops the reverse case from silently overriding `--hero-aspect` (a stretched box
takes its height from the row and its width from the column, and the ratio is simply not applied),
which matters because that token is the join `.nt-hero` reads.

#### The two heroes now share a SIZE as well as a shape

Phase 2 joined them on `--hero-aspect`. On a desktop that was not enough: Home's photograph is a
column of a two-column page and the tournament's is a block in a full-width one, so the shared ratio
drew **a 511px picture on one screen and a 980px one on the other** – «ту же пропорцию» read
literally and visibly wrong. `--hero-max: 512px` is the other half of the join, and at 1280 the two
are the same photograph to within a pixel. The shape itself is AC's own `450 / 400` (D19), the second
time this round takes a number of the design's, and for D6's reason: at `768/400` the desktop hero is
511×266 against a 433px pair of cards beside it, and the row does not close.

---

### ⭐⭐ FOUR OWNER RULINGS LANDED MID-PHASE, AND ONE OF THEM CORRECTED A LIMIT THIS ROUND INVENTED

⚠⚠ **`e2e/parity.spec.ts` compares SETS OF ACCESSIBLE NAMES. It does not look at positions.** Phase
2's D8 and D12 both leaned on a caution that re-flowing a grid might trouble the harness. It cannot:
four rungs laid 2×2 and the same four laid 1×4 carry the same four names. Only ADDING a control or
REMOVING one is forbidden, which is exactly what he asked for and nothing more. The correction is at
the top of the decisions document so the next reader does not inherit it.

| ruled 04.09 | what it changed |
| --- | --- |
| **D12** «а в чем проблема сделать для планшетов и десктопов в одну строчку?» | Her kit's four rungs go one row from 768. One line, three ladders, 66px of height back on each. |
| **D8** «давай тогда приведем к виду AC: одна колонка Season, вторая News со скроллом внутри» | Built – and the internal scroll cost nothing: `.log` has been `max-height: 300px; overflow-y: auto` since the feed was written. |
| **D9** «можно этот список сразу раскрытым рисовать, это ничему не противоречит» | Home's season ladder opens itself from 768. See below – it is what changed the harness. |
| **D2** «тянется на всю колонку – не надо, будет плохо, пусть пока 1 карточка остается» | The stretch was BUILT, measured and reverted. A one-card week stays half a row at 768 and is a third of one at 1024, which is what AE draws. |

⚠ **D12 is the one thing in this phase that moves a tablet box phase 2 settled**, deliberately and at
his ruling – see the census below, where it is separated from everything else.

#### ⭐⭐⭐ THE HARNESS'S CLAIM CHANGED, AND IT IS STRONGER FOR IT

D9 asked for a strip drawn already open at 768+. Phase 2 had refused it on the grounds that the
harness would name the extra chips – and it would have, because it fingerprinted what a screen
PAINTS on arrival. That was one reading too narrow for his own sentence, which is about ACCESS:

> «всё, что есть на мобиле, должно быть 1 к 1 **по доступности** быть и на других форматах»

Every rung is ALREADY on the phone, one tap behind the ellipsis. So `openEveryDisclosure` now presses
every `[aria-expanded="false"]` on the screen, at every width, until none remain, and the fingerprint
is taken after that. **The claim is now «the same things are REACHABLE at every width».** A control
that is genuinely absent still fails by name; a control that exists only at 1280 still fails from the
other side. What it stops failing on is a screen that shows the same things behind one fewer press.

⚠ It is a LOOP with a cap rather than one pass, because opening one disclosure can reveal another –
and the cap is a guard against a control that toggles rather than opens, which would otherwise spin
for ever instead of failing.

⚠ **And his word was corrected rather than followed.** He wrote `detectdevicewidth`; what shipped is
`window.matchMedia('(min-width: 768px)')`, because a 768px browser window on a 27-inch monitor is not
a tablet and the rule is about the width of the COLUMN. It is read once, at setup: a window dragged
from 1200 to 400 keeps an open strip, with its own `−` on screen to close it.

---

### `[x]` THE IDENTITY CENSUS – 0 BELOW 768, AND ONE DELIBERATE SCREEN ABOVE IT

Every element in the document at all ten screens, censused as tag + class + document-order index +
box to 2dp, at seven widths, one fresh career per width. Arm A is phase 2's shipped head
(`6a2bb372`), arm B is this phase.

| viewport | element boxes | boxes that moved | pixels moved | new boxes |
| --- | --- | --- | --- | --- |
| **375** | 2321 | **0** | **0** | 0 |
| **520** | 2321 | **0** | **0** | 0 |
| **576** | 2321 | **0** | **0** | 0 |
| **768** | 2321 → 2344 | **141, all on Home** | 9,024 | 23 |
| **900** | 2321 → 2344 | **141, all on Home** | 10,070 | 23 |
| 1024 | 2321 → 2344 | 2,095 | **973,055** | 23 |
| 1280 | 2321 → 2344 | 2,100 | **1,023,303** | 23 |

**6,963 boxes across the three mobile widths, and not one of them moved.**

⚠ **AND THE 768–900 ROWS ARE NOT ZERO, WHICH IS THE HONEST VERSION OF THIS TABLE.** Every one of
those 141 boxes is on **Home**, and every one is the season ladder opening itself (D9, his ruling) or
something it pushes down the page: the other nine screens are byte-identical at both widths, and the
23 new boxes are the rungs the open ladder draws plus the `−` that closes it. Home's page grew
1413 → 1472 at 768. ⚠ **D12's kit ladder does not appear in this table at all** – it lives behind the
Bills tab, which this walk does not open. It was measured separately: per kit line, 313×126px in two
rows at 375, and 706×60 and 918×60 in ONE row at 768 and 1280.

### ⚠ THE ANTI-VACUITY NUMBER, AND PHASE 2'S CAVEAT APPLIES

Phase 2 recorded that the box COUNT saturates: phase 1's ladder already moved 93.5% of every box on
the app, and a box that has already moved cannot move again in a count. So the number this phase is
read by is **total displacement** – the sum of |Δx| + |Δy| + |Δw| + |Δh| over every box:

| | boxes | pixels moved |
| --- | --- | --- |
| `origin/main` → phase 1, at 768 (the container ladder) | 2,170 | 497,232 |
| phase 1 → phase 2, at 768 | 709 | 448,651 |
| **phase 2 → phase 3, at 1024** | 2,095 | **973,055** |
| **phase 2 → phase 3, at 1280** | 2,100 | **1,023,303** |

**Phase 3 moves more than twice the geometry either earlier phase did**, which is what a phase that
invents a shell should look like beside two that widened a column. The three zeros and the
nine-screens-of-ten at 768–900 are what make it a measurement rather than a blind instrument: the
same census, the same screens, the same run.

---

### `[x]` PARITY – green at 375 / 768 / 900 / 1280, on every screen

`e2e/parity.spec.ts` was run against every change as it was made, not once at the end – four full
green sweeps across the phase, plus the deliberate break below. The final run is in the gates.

#### ⭐⭐ THE DELIBERATE BREAK – RE-RUN, BECAUSE THE HARNESS'S SEMANTICS CHANGED

A harness whose failure has never been seen is not a harness, and one whose CLAIM changed and whose
failure has not been re-seen is not one either. The break was chosen to bite the new semantics
specifically: Home's ladder-collapse control was hidden at desktop only.

```css
@media (min-width: 1024px) { .season-strip .strip-more { display: none } }   /* HomeScreen.vue, scoped */
```

→ `BREAK_EXIT=1`, and it names it:

```
HomeScreen.vue: these are on the phone at 375px and NOT at 1280px.
«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»
  + "button \"Show only her current levels\""
```

⭐ **That control does not exist at 375 on arrival.** It appears only after the harness presses the
ellipsis – so the run proves the new reachable-state pass is what is doing the measuring, and that it
still names a genuinely absent control. Reverted immediately; `HomeScreen.vue` verified byte-identical
afterwards by checksum (`f2eb2f0c…` before and after).

---

### The new and re-aimed test arms, and every one is mutation-verified

| file | arms | what a mutation reddened |
| --- | --- | --- |
| `round36-desktop-shell.test.ts` (new) | 12 | the `#app` grid rule deleted → the frame and column arms; `sticky` back to `fixed` → the standing-up arm alone; the `width: 100%` fill rule deleted → the auto-margin arm alone; either CTA token's 1024 rung deleted → that token's arm alone; `display: contents` back to `grid` → the dissolve arm alone; the hero's `grid-row` dropped → the span arm alone |
| `round34-week-stack.test.ts` | 3 | the desktop base width back to the tablet's half → the third-of-a-row arm; the desktop `:has(3)` rule deleted → the grown-strip arm, because the tablet's 44% rule is heavier and wins again; the fourth `.event-cards` dropped from the four-or-more rule → the sliver arm, because the two `:has()` rules then tie and happy-dom keeps the first |
| `round18-coach.test.ts` | 1 | `repeat(3, …)` in the 1024 block → the desktop row arm alone; the doubled `.tier-block.tier-block` reduced to one class → the same arm, because the 768 rule then wins the tie |
| `round30-next-tournament-layout.test.ts` | 1 (+1 re-aimed) | `max-width: var(--hero-max)` dropped from `.nt-hero` → the cap arm; the 1024 rung removed from `--hero-aspect` → the shape arm |
| `round21-bills.test.ts` | 2 | the 768 block deleted → the one-row arm alone; its media query removed → that arm AND the phone arm |
| `week-recap-kid-share.test.ts` | 2 | the `max-width` deleted → the desktop arm alone; its media query removed → that arm AND the phone arm |
| `home-strip-and-mail.test.ts` | 1 (+4 re-aimed) | `stripExpanded = ref(false)` → the tablet/desktop arm, phone green; `ref(true)` → the phone arm alone |
| `round13-nav.test.ts`, `round20-ui.test.ts` | 4 re-aimed | – |

⚠⚠ **FOUR SHIPPED TESTS WERE MEASURING AT HAPPY-DOM'S DEFAULT 1024 AND HAD TO BE AIMED**, which is
phase 2's own finding arriving again with more force: happy-dom's default viewport is **1024×768**,
i.e. inside this phase's band, and only 40 of 118 files under `tests/component/` set a viewport at
all. `round20-ui.test.ts`'s three season-strip arms and
`round30-next-tournament-layout.test.ts`'s full-bleed arm all made phone claims at a width that had
no rule until this phase. Each is `setViewport(PHONE)` now, and that is a fix to the test rather than
a loosening of it: the width a claim is measured at is part of the claim.

⚠ **And one existing pin went red on a number moving into a token**, which is the shape phase 2 met
too: `round13-nav.test.ts` asserted `.week-proceed` carries `bottom: 58px`. It reads
`bottom: var(--app-bar-bottom)` on the rule and `--app-bar-bottom: 58px` out of the sheet now, so the
number is still pinned – one file further out, where the desktop's own answer is decided.

---

### Gates – phase 3

Run one at a time, and **every exit code read out of the log file**, never from a pipe and never from
a background task's completion notice.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** – 46 tests, the eleven parity walks among them |
| `npm run check` | **`CHECK_EXIT=0`** – the whole pre-push gate: the doc audit, the pin ratchet, the decision index, `vue-tsc`, 1337 component tests and the build |
| `npm run test:component` | **1337 passed across 119 files**, inside `check` (1314 before this phase; twenty-three new arms) |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

### Open at the end of phase 3

- `[?]` **D13 – the rail's card set.** The one that needs him: three of AC's four rail cards are
  blocks this app does not have, and a set that shows on every page cannot pass his own criterion.
- `[?]` **D19, D20** – the desktop hero's shape, and the screens (`AI`, `AO`, `AQ`) whose two-column
  desktop layouts his phase-3 list does not name.
- `[?]` **D1** – Season swipes where the handoff's §6 asked for a grid (phase 2, still his)
- `[?]` the onboarding wizard and the tour briefing at 880 vs 1200 (phase 1's decision 1) – the rail
  does not change the question; both are takeovers outside `#app`
- `[ ]` `.recap-art`'s 390px collapse at 520 and 576 (D11) – a phase-4 or an owner call
- `[ ]` phases 4 and 5

---

## `[x]` PHASE 4 – THE SCREENS THE DESIGN PACK DOES NOT DRAW

His design is sixteen frames over ten screens. This phase is everything else: the onboarding wizard,
the match viewer and the live court, the draw, the finale poster, the epilogue, the shop and the
prologue – adapted on the same principles, and the prologue at his own ruling, «пусть агент сделает,
а я посмотрю результат и решим».

**Seven files of app, one of the harness, one of tests, three of documents.** `src/style.css` (one
new token and two rules onto it); `MatchViewer.vue` (the court's cap); `OnboardingWizard.vue` (a
reading column); `EndingScreen.vue` (a column); `PrologueLocalOpen.vue` (a column); `TournamentFlow.vue`
(the venue plate's shape); `MoneyScreen.vue` (the shop's front door and its shelf). The harness is
`e2e/parity.spec.ts`, which gained a second, hand-written map of the two ROOMS behind a chapter.
Tests: `tests/component/round36-phase4.test.ts` (new, eighteen arms). Documents: **eleven new rows
(D22–D32) and a rewritten D13** in `docs/specs/responsive-decisions-2026-09.md`, this ledger, and
the coverage map's `MoneyScreen` row.

⭐ **No new component, no new icon, no new string.** One template line changed in the whole phase –
`.mv-court` gained a `:style` binding – and it adds no element and no text.

---

### ⭐⭐⭐ THE FINDING: THE TAKEOVER'S COLUMN IS 480px, AND IT NEVER GREW

Phase 1's own headline finding was that `--app-max-width` is the FRAME and the column is 520. Phase 4
met its sibling one layer out. **A takeover covers the tab shell rather than living inside it, so it
inherits nothing from `#app`** – and `.tf-body` and `.tf-top` each spelled out `max-width: 480px`.

Measured in Chromium on phase 3's head, walking a real tournament at five widths:

| | 375 | 768 | 900 | 1024 | 1280 |
| --- | --- | --- | --- | --- | --- |
| the takeover body | 375 | **480** | **480** | **480** | **480** |
| the live court | 341 | **446** | **446** | **446** | **446** |
| the brief's venue plate | 343×300 | 448×300 | 448×300 | 448×300 | 448×300 |
| the draw's cell | 297 | 402 | 402 | 402 | 402 |

**The match screen was the same picture at four screen sizes.** So the whole tournament experience –
the brief, the pre-match scene, the court, the draw, the poster – plus the match replay, the inbox
sheet and the week planner sat in a 448px column with 400px of empty page down each side at 1280.

⭐ **The fix is one token and no fourth number.** `--takeover-col-max` is 480 below 768 and
`--app-max-width` above it – the cap the wizard (R14-9) and the tour briefing already share, named
in `src/style.css` as «the TAKEOVER cap … one token for the two of them». It is three of them now,
which is worth more than a new number: phase 1's open question for the owner is still decided in
exactly one place. **D22.**

---

### WHAT MOVED, PER SCREEN, MEASURED

Boxes are `w × h` in Chromium at a 900px-tall viewport, off a census of twenty-five surfaces walked
at seven widths. `before` is phase 3 as shipped (`2a5f49ee`).

| | 375 | 768 before → after | 1280 before → after |
| --- | --- | --- | --- |
| the takeover column (`.tf-body`) | 375 | 480 → **768** | 480 → **880** |
| **the live court** (`.mv-court`) | 341×211 | 446×275 → **680×420** | 446×275 → **680×420** |
| the commentary log | 317 | 422 → **710** | 422 → **822** |
| the brief's venue plate | 343×300 | 448×300 → **736×329** | 448×300 → **848×329** |
| the draw's cell | 297 | 402 → **690** | 402 → **802** |
| the finale poster | 343 | 448 → **736** | 448 → **848** |
| **the wizard's name field** | 275 | 668 → **584** | 780 → **584** |
| the wizard's country tile | 103 | 234 → **206** | 271 → **206** |
| **the epilogue's album pager** | 309 | 702 → **446** | **1214** → **446** |
| **the shop's category tile** | 109×168 | 240×370 → **208×321** | 311×479 → **208×321** |
| **the shop's shelf row** | 343 | 736 → **362** | 948 → **468** |
| the prologue's card | 375 | 420 → 420 | 420 → 420 |
| the prologue weekend's painting | 341×341 | **734×734** → **410×410** | **1246×1246** → **410×410** |

…and the two shop pages got markedly shorter, which is «больше видно одновременно» on a screen his
list never named:

| page height | 768 before → after | 1280 before → after |
| --- | --- | --- |
| the shop's front door | 1297 → **1198** | 1534 → **1217** |
| the shop's Cars shelf | 1195 → **922** | 1214 → **948** |

⚠ **The other surfaces are the same height and that is the honest half of the table.** The tournament
brief is 1526 at 768 and 1202 at 1280 in BOTH arms, and the epilogue fits a 900px window either way:
this phase widened columns and capped runaway blocks, and neither of those changes how much a page
holds. Only the shop had a block that grew with the window.

⚠ **AND RULE 4 WAS SWEPT RATHER THAN EYEBALLED.** «A wide viewport makes a full-width control look
wrong long before it breaks» is a claim about EVERY control, so every `button`, `input` and `select`
on all twelve walked surfaces was measured at 1280 and sorted by width. After this phase's caps,
**exactly two are over 700px**: `View all transactions` on the Family Budget at 794 (D20's own parked
pill – not this phase's screen, and left to him, with the lever named in **D32**) and Calendar's
`.cal-marker` at 948, which is a list ROW and is full width by the same rule every ledger row is.
Nothing else in the app stretches.

⚠ **The epilogue's number is the pager, not the page.** `.album-nav` was 1214px wide at 1280 with
**Back at x=33 and Next at x=1208** – 1175px apart, around a photograph 285px wide sitting between
them. That is the single most concrete defect this phase found and D27 is its row.

#### The court, and the one cap in this round with a mechanical reason

The canvas is a **fixed 680×420 bitmap** scaled by `devicePixelRatio`. While the column was 480 it
could never reach that; at 848 it would be upscaled 1.25×, and inside the prologue's weekend – which
had no column at all – the takeover itself measured **1,256px at 1280** and `.mv` inherits its width,
so the court was taking an 1.85× enlargement of a 680px bitmap. So `.mv-court`
stops at `CSS_W` and centres, **and the cap is bound inline off the same constant the aspect ratio is
written from**, because a literal 680 in the stylesheet is exactly the drift that file's own comment
says the ratio is bound to avoid. Measured after: 680×420 at 768, 900, 1024 and 1280 alike, with the
commentary log taking the leftover width. R17 #8 asked for a bigger court and this is 52% more of it.

#### The prologue, and the answer is «it does not grow» WITH A TABLE BEHIND IT

His ruling was to build it and look. The measurement is the argument, and it is in **D28** in full:
the painting is square and full-bleed, so **the column's width IS the picture's height**, and a
desktop window is not taller than a tablet's. Forcing the cap and reading the card back at 1280:

    cap 420 -> first answer at y=894    cap 512 -> y=986    cap 640 -> y=1093

Every 60px of column is 60px more scroll before the decision. **So the nine cards keep their 420 at
every width**, and phase 4's work on the prologue is the one surface that had no column at all – the
Local Open weekend, whose venue painting measured **734×734 at 768 and 1246×1246 at 1280**. It takes the
cards' own 420 now; the match inside it takes the takeover column, because 420 would have made the
prologue's court narrower than the 744px it has on a tablet today.

---

### `[x]` NOTHING BELOW 768 MOVED – and the eight boxes that did are the INSTRUMENT

Every element in the document at twenty-five surfaces – the ten tab screens, the shop's two rooms,
the six wizard steps, the prologue's first card, the epilogue and five beats of a tournament –
censused as tag + class + document-order index + box to 2dp, at seven widths. Arm A is phase 3's
shipped head (`2a5f49ee`), arm B is this phase.

| viewport | element boxes | boxes that moved | pixels moved | new | gone |
| --- | --- | --- | --- | --- | --- |
| **375** | 4983 | **8** | 303 | 0 | 0 |
| **520** | 4983 | **8** | 235 | 0 | 0 |
| **576** | 4983 | **2** | 33 | 0 | 0 |
| 768 | 5131 | 944 | 187,868 | 0 | 0 |
| 900 | 5131 | 948 | 275,449 | 0 | 0 |
| 1024 | 5131 | 948 | 269,639 | 0 | 0 |
| 1280 | 5131 | 948 | 284,410 | 0 | 0 |

⚠⚠ **THE THREE MOBILE ROWS ARE NOT ZERO, AND THE CONTROL IS WHAT MAKES THEM A ZERO ANYWAY.** All
eight boxes are on two wizard steps, and every one is a TEXT box whose width changed while its x and
y did not – `<dt>` 180.53 → 173.34 on the summary, a paragraph 65.25 → 43.5 tall on the welcome. The
wizard is reached from a fresh boot, so it rolls a random name and a random opening line every run.

**So the same build was censused against ITSELF**, second run against first, at the three mobile
widths:

| viewport | boxes | moved, arm B vs arm B again |
| --- | --- | --- |
| 375 | 538 | **8** |
| 520 | 538 | **8** |
| 576 | 538 | **2** |

– the same eight, the same eight, the same two. **The movement is the walk, not the change**, and
that is a measurement rather than an argument. Every one of the other twenty-three surfaces is
byte-identical at 375, 520 and 576.

⚠ And every rule this phase shipped is inside a `min-width` query or is an inline cap that cannot
bite below 680px of column, so the three zeros are structural as well as measured.

### ⚠ THE ANTI-VACUITY NUMBER

Phase 2 recorded that the box COUNT saturates and phase 3 inherited the caveat, so the number this
phase is read by is **total displacement** – the sum of |Δx| + |Δy| + |Δw| + |Δh| over every box:

| | boxes | pixels moved |
| --- | --- | --- |
| `origin/main` → phase 1, at 768 (the container ladder) | 2,170 | 497,232 |
| phase 1 → phase 2, at 768 | 709 | 448,651 |
| phase 2 → phase 3, at 1024 | 2,095 | **973,055** |
| phase 2 → phase 3, at 1280 | 2,100 | **1,023,303** |
| **phase 3 → phase 4, at 1024** | 948 | **269,639** |
| **phase 3 → phase 4, at 1280** | 948 | **284,410** |

⚠ **The comparison is not like for like and saying so is part of the measurement.** Phases 1–3 moved
the ten TAB screens, which is what the earlier censuses walked; this phase does not touch one of them
– **all ten are byte-identical at every one of the seven widths** – and every box it moves is on a
surface the earlier numbers never included: the two rooms behind Money's chapter row, six wizard
steps, the epilogue and five beats of a tournament. Read per surface rather than per phase: the
tournament draw alone moves 207 boxes at 1280, the finale poster 111, the live match 99, the six
wizard steps 330 between them, the shop's two rooms 101 and the epilogue 8.

---

### `[x]` PARITY – green at 375 / 768 / 900 / 1280, and TWO NEW ROOMS

`e2e/parity.spec.ts` was run against every change as it was made. The final run is in the gates:
**`PARITY_EXIT=0`, twelve walks** – and two of those are new.

#### ⭐⭐ THE HARNESS GREW, BECAUSE THE DELIBERATE BREAK SHOWED WHERE IT COULD NOT SEE

The station map is DERIVED from `src/components/screens/`, which is what stops it becoming «the
screens somebody remembered». Its cost is that a FILE is the unit: `MoneyScreen.vue` has one station
and it lands on the Spending chapter, so **the shop – rebuilt by round 35 and re-laid by this phase –
had never been fingerprinted at all.** That was found honestly rather than reasoned about: phase 4's
own deliberate break had to be aimed at the chapter ROW, because a control hidden inside the shop
would not have been seen.

So a second map, hand-written and saying so in its own header, walks two ROOMS behind that chapter:
the shop's front door and one shelf. Both are 1:1 at all four widths. **D30**, with the limit that
remains stated in the same row.

#### ⭐⭐ THE DELIBERATE BREAK – RE-RUN ON THIS PHASE'S OWN SCREEN

A harness whose failure has never been seen is not a harness. The Family Budget's chapter row was
hidden at desktop only:

```css
@media (min-width: 1024px) { .money-tabs { display: none } }   /* MoneyScreen.vue, scoped */
```

→ `BREAK_EXIT=1`, and it names all four:

```
MoneyScreen.vue: these are on the phone at 375px and NOT at 1280px.
«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»
  + "button \"Bills\""
  + "button \"History\""
  + "button \"Shop\""
  + "button \"Spending\""
```

Reverted immediately; `MoneyScreen.vue` verified byte-identical afterwards by checksum
(`9955ddd0…` before and after).

#### ⭐ AND «1 К 1» FOR THE FIFTEEN SURFACES THE HARNESS DOES NOT WALK

Most of phase 4's screens are takeovers reached by PLAYING – a tournament, a weekend, a career's end,
a new career's first six steps – so the walk cannot reach them without a journey each. They are
answered by the census instead, compared across widths rather than across arms: every element of each
surface at 375 against the same surface at 768, 900, 1024 and 1280, keyed by tag and class so a
re-flow is invisible.

**Nineteen of twenty-five surfaces are element-for-element identical at every width.** The six that
differ are Home and the five tournament beats, and the difference is the same one on all six: Home's
season ladder drawing itself open from 768 (**D9, his own ruling**) – `strip-more` gone, twelve
`strip-arrow` and fourteen chips in its place – which shows through behind the tournament takeovers
because they are `position: fixed` layers over Home. ⭐ That is also what makes this instrument a
measurement rather than a blind one: it found the one legitimate difference in the app.

---

### The eighteen new test arms, and fourteen mutations were run against them

`tests/component/round36-phase4.test.ts`, mounted, at `PHONE` / `TABLET` / `DESKTOP`.

| what it holds | arms | what a mutation reddened |
| --- | --- | --- |
| the takeover's column | 2 | the 768 rung deleted from the token → the wide arm AND the prologue's match arm; `.tf-top` back to a literal 480 → the wide arm alone |
| the court's cap | 2 | the `:style` binding removed → both arms; `margin-inline: auto` deleted → the cap arm alone |
| the wizard's column | 2 | the media block deleted → the wide arm, phone green |
| the epilogue's column | 2 | the media block deleted → the desktop arm, phone green |
| the prologue's weekend | 3 | `.plo > *` deleted → the column arm; `.plo > .mv` deleted → the match arm alone |
| the shop | 5 | `width: 100%` dropped from `.shelf-cats` → the stretch arm; the 1024 block deleted → the desktop row arm |
| the venue plate's shape | 2 | the media block deleted → the wide arm, phone green |

⚠⚠ **TWO MUTATIONS DID NOT BITE, AND THAT IS RECORDED RATHER THAN QUIETLY DROPPED.** Phase 3's note
on `.tier-block.tier-block` says a media query adds no specificity and that a browser and happy-dom
settle the resulting tie in OPPOSITE directions. Measured here on this file's own arms, the doubled
selector is NOT what is doing the work:

    `.shop-family.shop-family` -> one class (the 768 rung)        NOTHING WENT RED
    `.shop-family.shop-family.shop-family` -> two classes (1024)  NOTHING WENT RED
    `.shop-family.shop-family.shop-family` -> ONE class (1024)    RED, and by name

– so what is genuinely load-bearing is that the DESKTOP rung outweighs the TABLET rung; against the
base rule outside the query, source order is enough in both engines. The extra classes stay (they
cost nothing, and a rule that wins only on source order is one re-order away from losing) but the
comment in `MoneyScreen.vue` now says which of the two claims the tests actually hold.

⚠ **And two happy-dom facts are written down beside the helpers that work around them**, each of
which cost a wrong red first: an unset `max-width` computes to the EMPTY STRING rather than to
`none`, and `margin-inline: auto` is not expanded into `marginLeft`/`marginRight`. A third is worth
more: **`getPropertyValue('--takeover-col-max')` on the root returns the BASE declaration at every
viewport**, so the ladder is read through the rules that consume it – `max-width: var(…)` resolves
correctly – rather than off the custom property, which would have said 480 everywhere and been wrong
about a rule that works.

---

### ⚠⚠ THREE THINGS THIS PHASE FOUND ALREADY BROKEN AND DID NOT FIX

All three are below 768, and the contract this round has held for four phases is that **not one box
moves at 375, 520 or 576**. Each is **D31** (or D11) rather than a quiet fix on the way past.

1. **The pre-match scene overhangs its own column by 8px.** `.tf-scene.tf-scene` cancels `24px` of
   gutter; `.tf-body`'s gutter has been `--app-pad-x` (16px) since R17 #8. Measured: 391px wide at
   x=-8 on a 375px screen, and the same 8px each side at every width. It is contained – the body
   clips it and the page does not scroll sideways – which is why it has survived.
2. **The prologue weekend's painting does not span the phone**, though its own comment says it does:
   `.plo-hero` cancels `.plo`'s 12px, but its parent `.plo-splash` is a bare `<section>` carrying the
   app's own 16px inset. Measured 341px on a 375px screen, and 410 in the 420 column this phase gives
   it against the nine cards' 420.
3. **D11 is still open** – `.recap-art`'s 390px collapse at 520 and 576, inherited from phase 2.

---

### ⚙ HIS 04.09 RULING ON THE RAIL, AND WHY IT IS PHASE 6 RATHER THAN THE TAIL OF THIS ONE

**D13 is settled and it is a BUILD.** «Надо создать новые компоненты и показывать их только на
десктоп», «карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске, т.е.
на всех страницах» – so `IN THE ACCOUNT`, `COACHING BUDGET` and `MY ENTRIES` are built as
desktop-only components on every page. ⚠ His FRAMES disagree about that (AC four, AE one, AK one, AG
none, AM none); **his words win over his frames.**

And he ruled on the objection that sent it to him: «можно вынести эту часть поля навигации из этой
проверки? … это исключительно десктопная фича.» So the rail's DASHBOARD is exempt from the
per-screen parity check – the rail is chrome rather than screen content, and a balance beside Season
is a shortcut to a figure that lives on Home and on Money.

**THE EXEMPTION IS SPECIFIED IN D13 AND SHIPS WITH THE CARDS. It is deliberately not built here**,
and the reason is this round's own lesson: an exemption built before the thing it exempts is a guard
fitted to nothing – its boundary test would pin a container no template renders, and its «every
figure the rail shows exists at 375» arm would pass over an empty set. **Four empty sets are equal**
is the sentence `e2e/parity.spec.ts` is built around, and round 35 shipped three tests that went
BLIND rather than red for exactly that reason. The two halves land together or the guard is theatre.

⚠ It is also **the one place in this round where «no new components, no new strings» is suspended**,
by him, for three cards. That wants its own phase, its own measurement and its own morning – not the
tail of a six-surface layout pass. It is phase 6 in the table at the top.

---

### Gates – phase 4

Run one at a time, and **every exit code read out of the log file**, never from a pipe and never from
a background task's completion notice.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** – 48 tests, the thirteen parity walks among them |
| `npm run check` | **`CHECK_EXIT=0`** – the whole pre-push gate: the doc audit, the pin ratchet, the decision index, `vue-tsc`, the component suite and the build |
| `npm run test:component` | **1355 passed across 120 files**, inside `check` (1337 before this phase; eighteen new arms, one new file) |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code. It belongs to whoever assembles the round's PR.

### Open at the end of phase 4

- `[?]` **D28 – the prologue.** He asked to see the result and decide: the answer is «the column does
  not grow», with the table that says what growing it costs, and the two alternatives that were
  rejected named with their reasons.
- `[?]` **D22, D24** – the takeover cap now decides THREE surfaces, and the wizard's 640 column
  re-frames phase 1's open question rather than answering it.
- `[?]` **D25** – six category cards in one row on a desktop is one declaration, and it is his call.
- `[?]` **D32** – `View all transactions` is 794px on the desktop Family Budget. D20 parked it
  because capping it would have moved a tablet box; a rung at 1024 no longer does. His screen, his
  parking, one rule.
- `[?]` **D1, D19, D20** – still open from phases 2 and 3.
- `[ ]` **phase 6, the rail's mini-dashboard** – his ruling, specified in D13, unbuilt.
- `[ ]` **D31 and D11** – three pre-existing defects below 768 that this round's identity contract
  forbids touching. They need a word from him, or a wave that is allowed to move a phone.
- `[ ]` turning the takeovers into parity stations (D30's remaining limit) – each needs a journey.

---

## `[x]` PHASE 5 – THE HORIZONTAL PAGER, AND ONE LINE THAT MOVED

⚙ **Two owner rulings, both made on 04.09 after playing the shipped build, and this phase is only
those two.** Neither is in the spec's five phases; both are his, and both are quoted in full where
Cyrillic is allowed – `src/composables/weekPager.ts` for the first, `FIELD_FIGURE_NOTE` in
`src/composables/eventCard.ts` for the second.

> «Давай уберем свайп css и сделаем js функционал для листания горизонтального, тогда будет полный
> паритет на всех устройствах и ничего не надо изобретать.»
> «у нас на всех устройствах могут появиться стрелки для листания в дополнение к JS свайпу.»

---

### ⭐⭐⭐ THE MEASUREMENT THAT MAKES THIS A DEFECT AND NOT A PREFERENCE: A MOUSE HAS NO SWIPE

Round 34 #14 made a week with several enterable rungs a scroll-snapping strip. That is a swipe on a
finger. On a pointer, what an `overflow-x` strip actually offers is **shift+wheel**, a trackpad's
**two-finger gesture** – neither of which a player guesses – and **drag-to-select autoscroll**, which
was accidental and which the hotfix's `user-select: none` has since removed. And there was **no
`tabindex` on the strip at all**, so from a keyboard there was no route to the second card of a week
by any number of presses.

⚠⚠ **THE PARITY HARNESS CANNOT SEE THIS, AND SAYING SO IS PART OF THE FINDING.** `e2e/parity.spec.ts`
compares the same controls across four WIDTHS. It does not compare INPUT DEVICES. A card that is
present in every fingerprint and unreachable for everybody without a touchscreen passes it four times
over. That is the exact shape of hole the round's own criterion is blind to, and it is why this phase
adds a browser test that drives a keyboard.

---

### WHAT REPLACED WHAT, IN `.week-stack.swipeable`

| | before | after |
| --- | --- | --- |
| `scroll-snap-type: x mandatory` | the CSS swipe | **gone** – `snapTarget()` on the drag's release |
| `scroll-snap-align: start` (card) | the CSS snap point | **gone** – the same function |
| `touch-action` | *(absent on this branch)* | **`pan-y`** – the page keeps the vertical axis |
| `overscroll-behavior-x` | *(absent)* | `contain` |
| `user-select` | *(absent)* | `none` (+ `-webkit-`) |
| `overflow-x: auto` | the scroll container | **kept, deliberately** |
| `tabindex` | *(none)* | `0` on a stacked strip |

⚠⚠ **`pan-y`, NEVER `pan-x`.** The hotfix on `main` reached for `pan-x` first – «this box handles
ONLY horizontal panning» – and a near-vertical gesture that began on a card then stopped reaching the
page: on a run of multi-card weeks **the page froze**. `pan-y` cannot fail that way by construction –
the browser keeps the axis the PAGE scrolls on and gives up the one the pager drives, and a vertical
gesture here simply cancels the drag (`pointercancel`) and scrolls the page. There is a mounted arm
that names the value and reddens on `pan-x`.

⭐ **`overflow-x` STAYS, and that is the decision that kept this phase small.** It is not the swipe –
`touch-action` is what took the gesture off the browser – and keeping the element a real scroll
container means `scrollLeft` is the pager's single piece of state, the browser still scrolls a focused
control into view by itself, and round 34's reachability pin measures the same property it always
measured. **D33** in `docs/specs/responsive-decisions-2026-09.md`.

⚠ **`user-select: none` is kept on purpose.** The drag-to-select autoscroll it removes was an accident
of the browser, not a design; the press-and-hold fix depends on it; and it is what lets a MOUSE drag
the strip at all.

---

### THE PAGER ITSELF – `src/composables/weekPager.ts`

One instance per screen; each strip registers itself by its own week through a template `:ref`.

* **the swipe**, on every device through ONE code path – `pointerdown` on the strip, `pointermove` /
  `pointerup` / `pointercancel` on `window`, a 6px threshold before anything moves, and a
  capture-phase click blocker so a drag cannot open the tournament a tap was aiming at.
  ⚠ **No `setPointerCapture`**: capturing on `pointerdown` retargets the `click` that follows to the
  capturing element, which would break every button on every card.
* **two arrows**, `Back` and `Next`, on every stacked week at every width.
* **the keyboard**: the strip is a tab stop, and Left/Right are handled on the ROW – so they work
  from the strip itself AND from any control inside a card, and the route does not depend on which of
  them happens to hold focus.
* **the arithmetic is pure and exported** (`pagerEnds` / `pageTarget` / `snapTarget`), which is a
  testability decision: happy-dom has no layout engine, so `tests/component/` can prove the arrows
  exist and can prove NOTHING about where a press sends the strip.

---

### `[x]` THE REACHABILITY CLAIM, MEASURED IN A BROWSER RATHER THAN ASSERTED

`e2e/responsive.spec.ts`, on the `sinking` career, whose Season feed draws two stacked weeks.

**At 375 – the strip genuinely overflows, and both routes arrive:**

| | |
| --- | --- |
| the strip | 2 cards, **overflow 273px**, `Back` disabled, `Next` enabled |
| before any press | the last card is **not** wholly inside the window, and neither is the control on it |
| **by keyboard alone** | Tab from a blurred document reaches the strip (asserted: no `.focus()`, no click – a route a player cannot walk is not a route); one `ArrowRight` and the last card is **wholly inside**, its `Enter` pressable |
| **by the arrow** | from a fresh mount: `Back` disabled / `Next` enabled → one click → last card wholly inside, and `Next` now disabled with `Back` enabled |

**At 1280 – the complement, which is what stops the test above being half an argument:** the same
week's `overflow` is **0** (three cards fit at this width – phase 3's D16, read back in a browser),
and both arrows are **present and disabled**. A pager that hid itself there would be a control at 375
and not at 1280.

⚠⚠ **THE HONEST LIMIT, AND IT IS THE ONE THE TASK ASKED ABOUT.** «The THIRD card at 1280» cannot be
driven in a browser from the fixtures this repo has: **no e2e career draws a week with three or more
enterable rungs.** Measured, all six: `fresh` [1,1,1,1] · `broke` [1,1,1,1] · `pro` [1,1,1] ·
`junior` [1,1,1,2,1] · `sinking` [1,1,2,2] (`ending` has no Season). Twenty weeks of advancing
`sinking` and `broke` moved neither. So the depth claim is held where it CAN be held, on the app's
own measured geometry, in `tests/weekPager.test.ts`:

* **375** – `.app-content` 343px, cards `88%` = 301.84: the **third card of a four-card week is two
  presses away** and arrives whole.
* **1280** – the row is 948px (the rail takes 220 of the 1168 column – D21) and cards are
  `calc(33.333% - 8px)` = 308: **three fit, so the press that matters reaches the FOURTH**, in one.
  It lands on `maxScroll` rather than on the card's own edge, because the last card starts past the
  end of the scroll.

...and the arrows' **presence** at all four widths on a real stacked week is held by the parity
harness, below. Three layers, and each says what the layer under it cannot.

---

### `[x]` PARITY – GREEN AT 375 / 768 / 900 / 1280 WITH THE ARROWS PRESENT

**`PARITY_EXIT=0`, fourteen walks** (twelve after phase 4). ⭐ **And the arrows are at 375 too – that
is the whole reason they are legal**, and it is a machine check rather than a sentence: the
fingerprint at 375 and the fingerprint at 1280 carry the same `button "Back"`, `button "Next"` and
`icon back.svg` tokens, or the walk goes red naming the difference.

⚠⚠ **THE HARNESS COULD NOT HAVE SEEN THEM WITHOUT A CHANGE, AND THAT IS THE PHASE'S SECOND FINDING.**
Every station walks `pro` – «the heaviest career, on purpose». Measured: **`pro`'s Season feed is
three rows of ONE card**, so it draws no pager at all, and four fingerprints with no arrow in any of
them are equal. The harness would have reported perfect parity about a control it had never met –
the same hole phase 4 found behind Money's chapter row, one screen further on.

So `Station` gained an optional `career` (default `pro`, unchanged for every existing station) and a
room walks Season on **`sinking`**, which draws two stacked weeks and four arrows. Its arrival anchor
is the `Next` arrow itself, so a pager that stopped drawing fails there before a fingerprint is taken.
**D36.**

#### ⭐⭐ THE DELIBERATE BREAK – AIMED AT THIS PHASE'S OWN CONTROL, AND RUN TWICE

A harness whose failure has never been seen is not a harness.

**Break 1 – both arrows hidden at ≥1024**, inside `SeasonScreen.vue`'s scoped block (phase 1's lesson:
a rule appended to `src/style.css` loses to the scoped one and mutates nothing):

```
Error: SeasonScreen.vue – a week that stacks several rungs at 1280px – the walk did not arrive
Locator: getByRole('button', { name: 'Next', exact: true })
```

**Break 2 – only the `Back` arrow**, so the room's own anchor still lands and the FINGERPRINT has to
be what names the loss:

```
SeasonScreen.vue – a week that stacks several rungs: these are on the phone at 375px and NOT at 1280px.
  + "button \"Back\" ×2"
  + "icon back.svg ×2"
```

⭐ That second run is also the proof the fingerprint really **contains** the arrows – by role-and-name
AND by the asset they load – so the green run above is a measurement rather than a coincidence.
`SeasonScreen.vue` was restored from a copy taken before the break and verified byte-identical
(`shasum` b2c57fe6…, both sides). ⚠ Never with `git checkout -- <file>`.

---

### `[x]` THE IDENTITY PROOF, RE-RUN – NINE OF THE TEN TAB SCREENS ARE UNTOUCHED AT SEVEN WIDTHS

Arm A is phase 4's shipped head (`cbfa4113`, the four files swapped back in this same tree), arm B is
this phase. Both driven through the same walk of all ten tab screens at 375 / 520 / 576 / 768 / 900 /
1024 / 1280, every element censused as tag + class + document-order index + box to 2dp. **Two
careers**, because `pro` never draws a pager and would have measured the copy move alone.

| screen | boxes (all widths) | moved | new | gone |
| --- | --- | --- | --- | --- |
| Home · Calendar · Stats · Trophies · Money · More · Kid · CoachMarket · ThisWeek | 13,551 (`pro`) / 12,609 (`sinking`) | **0** | **0** | **0** |
| **Season** (`pro`) | 1,666 | 807 | 21 | 21 |
| **Season** (`sinking`) | 2,520 | 1,673 | 84 | 35 |

⚠ **SEASON MOVES BELOW 768 AND THAT IS THIS PHASE DELIBERATELY CHANGING IT**, which is the one thing
the round's rule 4 permits. The three numbers decompose exactly:

* **gone** – the `.field-note` line, one per pre-draw card (3 per width on `pro`, 5 on `sinking`).
  That is item 2.
* **new** – `div.week-row`, one per event week, plus on `sinking` the four arrow buttons and the four
  `span.tb-icon` inside them. That is item 1.
* **moved** – the reflow under a card that is one line shorter. Every card in the feed sits lower or
  higher by the height of the line that left.

⭐ **AND THE NINE ZEROS ARE A MEASUREMENT, NOT A BLIND INSTRUMENT.** The same census, in the same run,
on the same careers, moves **239 boxes and 20,907px on Season at 375** – so the instrument is
demonstrably sensitive at the width where the other nine screens report nothing.

Per width, `sinking`, so the shape is visible rather than summed:

| viewport | element boxes | boxes that moved | pixels moved | new | gone |
| --- | --- | --- | --- | --- | --- |
| **375** | 2151 | 239 | 20,907 | 12 | 5 |
| **520** | 2149 | 239 | 13,437 | 12 | 5 |
| **576** | 2149 | 239 | 13,436 | 12 | 5 |
| 768 | 2170 | 239 | 17,249 | 12 | 5 |
| 900 | 2170 | 239 | 17,249 | 12 | 5 |
| 1024 | 2170 | 239 | 24,719 | 12 | 5 |
| 1280 | 2170 | 239 | 17,249 | 12 | 5 |

– the same 239 at every width, which is what «this is one change, not a responsive one» looks like:
nothing here is behind a media query.

---

### `[x]` ITEM 2 – THE LINE MOVED, AND IT IS A MOVE

`FIELD_FIGURE_NOTE` is off every card in the Season feed and on **`NextTournamentPanel`** – the
tournament screen reached from Home's «Next tournament» plate – under the same field ring, on the same
condition. **Not one character of the string changed**, which is the round's one sanctioned copy
change spent on placement and nothing else.

⚠ **THE PANEL DID NOT ALREADY CARRY IT.** Checked before assuming: it draws the field RING (round 34
#5) and `DRAW_NOT_MADE_NOTE` on the first-round plate, and neither says what will happen to the
number. Deleting the line would have given back the unexplained 9.1-point step at the draw that round
34 #5 measured and round 31 #4 was reported for.

**Proved in the app, not only in a mount.** On the `pro` career, entering the furthest-out tournament
in the feed and opening the tournament screen:

```
MOVED_LINE {"panel":true,"fieldRing":true,
            "note":"A typical figure for this level – it sharpens when the draw is made.",
            "inText":true}
```

⚠ **The ink changed and the sentence did not.** `--ink-soft` was legible on the feed's flat card; this
block stands ON the photograph, so the line takes `.nt-read-label`'s white-on-art pair – the same
shift `.nt-hero .coach-note` already makes beside it. **D38.**

⚙ `opponentRingShown` / `fieldRingShown` moved with it into `composables/eventCard.ts`, unchanged and
with their comment carried verbatim: the season card no longer asks the question and the panel now
does.

---

### The new and re-aimed test arms

| where | what it holds |
| --- | --- |
| `tests/weekPager.test.ts` (new, 12 arms) | the paging rule as arithmetic, on the app's own measured 375 and 1280 geometries – which arrows are live, where one press lands, where a released drag settles |
| `tests/component/round34-week-stack.test.ts` (+7) | the arrows on every stacked week at PHONE / TABLET / DESKTOP; none on a one-card week; the strip is a tab stop; no snapping is declared anywhere; `pan-y` and not `pan-x`; both arrows load `back.svg` and the forward one is that file mirrored |
| `tests/component/round31-draw-reveal.test.ts` (re-aimed) | the pair BOTH ways – the line is gone from every card in the feed AND present on the panel before the draw, absent after |
| `e2e/parity.spec.ts` (+1 room, +`Station.career`) | the arrows are 1:1 at 375 / 768 / 900 / 1280 on a career that actually has a stacked week |
| `e2e/responsive.spec.ts` (+2) | the reachability table above |
| `tests/ui-control-system.test.ts` (allowlist +1) | the «a back control is bare» rule gains its second **argued** exception – D37 |

#### ⚠⚠ FOURTEEN MUTATIONS, AND THREE OF THEM DID NOT BITE

Each applied alone, and the verdicts differ – which is what says these are separate claims rather
than one claim written six times.

| mutation | what reddened |
| --- | --- |
| the arrows' `v-if` → `false` | the three width arms; **and the one-card arm stayed GREEN** – the pair |
| ...→ `true` | the one-card arm ALONE, from the other side |
| `touch-action: pan-y` → `pan-x` | the axis arm ALONE – the freeze `main`'s hotfix walked into |
| `scroll-snap-type: x mandatory` put back | the «the CSS swipe is gone» arm ALONE |
| `:tabindex` dropped | the mounted tab-stop arm ALONE |
| `pageTarget`'s clamp → `return target` | two unit arms (the two-card phone case and the range guard) |
| `pagerEnds`'s `>= max - 1` → `>= max` | the fractional-end arm ALONE |
| `PAGER_DRAG_PX` → 0 | the threshold arm ALONE |
| the arrows never render (browser) | **three** e2e tests – the parity room and both reachability tests |
| `pageTarget` → `return scrollLeft` (browser) | the reachability test ALONE |
| `pagerEnds` → always both ends (browser) | the reachability test ALONE |

**...and the three that went green, recorded rather than dropped:**

1. **`pageTarget`'s `ahead ?? (direction === 1 ? maxScroll : 0)` fallback gutted → nothing reddened.**
   Its own comment claimed it was what runs the strip to its end. It is not: with every card NARROWER
   than the strip (which `round34-week-stack.test.ts` pins) there is always a card ahead until the
   strip is already at its end, and **the CLAMP is what does that work**. The fallback is the guard
   for a strip with no cards at all. It stays; **the source comment was rewritten to say what the
   mutation proved**, which is the point of running it.
2. **`snapTarget`'s right-hand-end guard removed → nothing reddened.** Same invariant from the other
   side: `maxScroll` can only exceed the last card's own offset when that card is WIDER than the
   strip, and the same pin forbids it. Kept as the guard for the day that pin moves, and labelled as
   unreachable in the source.
3. **`:tabindex` dropped, measured IN THE BROWSER → the e2e keyboard route stayed green.** Chromium
   now gives an overflowing scroll container a tab stop of its own, so the browser cannot tell the
   two apart. Firefox and Safari do not, so the declaration is what makes the route real for the
   other half of the players – and the **mounted** arm, which reads the attribute, is what holds it.
   ⭐ A gap between two layers found by mutating rather than by reasoning, which is why both layers
   exist.

⚠ One footnote on the first two arrow mutations: they also redden the «no new icon» arm, and that is
the marker helper doing its job rather than a fourth claim – the region is cut on the `v-if` those
mutations rewrite, and `region()` THROWS on an absent marker instead of silently widening.

---

### Gates – phase 5

Run one at a time on a quiet machine, and **every exit code read out of the log file** – never from a
pipe, never from a background task's completion notice.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** |
| `npm run test:component` | **`COMPONENT_EXIT=0`** |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |
| `npm run check` | **`CHECK_EXIT=0`** |

⚠⚠ **AND `test:quiet` WAS RED FIRST, WITH FIVE REAL FAILURES, ALL OF THEM THIS PHASE'S.** Recorded
because each one is a rule this repo wrote down and this phase walked into:

* **three files, Cyrillic in a TEMPLATE** – the owner's two rulings were quoted in the markup
  comments. `tests/template-copy-rules.test.ts` and `tests/ladder.test.ts` forbid it, comments
  included. Both quotes moved to `composables/weekPager.ts`, where Cyrillic is allowed, and the
  template points at them.
* **a second focus ring.** `.week-stack.swipeable:focus-visible` declared `outline: 2px` –
  `tests/ui-control-system.test.ts` holds that the app declares exactly ONE ring and `src/style.css`
  owns it, and that nothing is outlined thicker than a hairline. The rule was deleted; the app's own
  ring applies to the strip for free.
* **the back control's shape.** `IconButton label="Back"` must be `variant="bare"`; the pager's is
  `plate`, because it stands on a photograph. Added to the rule's allowlist **with the argument
  written in**, beside `OnboardingWizard`'s – the only other entry, and the same reason: a pager is
  not the top-left «leave this screen» affordance. **D37.**

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code.

### Open at the end of phase 5

- `[?]` **D35** – on a desktop a two-card week shows two greyed arrows it will never need. Hiding
  them there is one line, and the price is a stated exemption in `e2e/parity.spec.ts`. His trade.
- `[?]` **the depth claim at 1280 has no browser arm**, because no e2e fixture draws a week with
  three or more enterable rungs. A fixture that does would close it; it is not phase 5's to add.
- `[ ]` phase 6 – the rail's mini-dashboard, untouched by this phase

---

## `[x]` PHASE 6 – THE RAIL'S MINI-DASHBOARD, AND THE EXEMPTION THAT SHIPS WITH IT

His ruling of 04.09, in full: «надо создать новые компоненты и показывать их только на десктоп»,
«карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске, т.е. на всех
страницах», «никаких контролов новых они не поставят, это просто шорт-кат с информацией из
внутренних разделов», and on the objection that sent it to him: «можно вынести эту часть поля
навигации из этой проверки? у меня вообще планы небольшие на этот дашборд есть дальше и это
исключительно десктопная фича.» `AC-home-desktop-1024.png` is the reference for the set.

**Three files of app, two of composable, one of test, one of harness, three of documents.**
`src/components/RailDashboard.vue` (new); `src/App.vue` (it is mounted in the one `nav.tab-bar` the
app has); `src/style.css` (`display: none`, and the 1024 rung that turns it on);
`src/composables/coachingBudget.ts` and `src/composables/seasonEntries.ts` (new – the two derivations
the cards had to NOT copy, with `CoachMarketScreen.vue` and `SeasonScreen.vue` re-pointed at them);
`e2e/parity.spec.ts` (the exemption and its four guards); `tests/component/round36-rail-dashboard.test.ts`
(new, eleven arms); and this ledger, `docs/specs/responsive-decisions-2026-09.md` (nine rows, D39–D47)
and `docs/specs/e2e-coverage.md`.

⭐ **No new icon, no engine change, no copy change anywhere else, and no new string.** The three card
titles already existed in this app – see D44.

---

### ⭐⭐⭐ WHAT EACH CARD READS, AND FROM WHERE – NOT ONE FIGURE IS DERIVED IN THE COMPONENT

| card | the figure | where it already lived | how the card gets it |
| --- | --- | --- | --- |
| **In the account** | `$1,953,147` on `pro` | Home's Family-budget card (`.budget-total`) and the Family Budget screen's own «… in the account» line | `formatCents(snapshot.fundsCents)` – the app's ONE money formatter, no arithmetic at all |
| **Coaching budget** | `$474` on `pro` | the Coach Market's meter, printed **beside those exact words**: `<strong>{{ formatCents(freeCents) }}</strong> /week free` | `useCoachingBudget().freeCents` – **the same computed the meter reads** |
| **My entries** | `Regional Championship · W18 '33` and its siblings | Season's «My entries» strip, as `label · week` | `enteredEvents(snapshot.upcoming)` – **the same predicate the strip filters on** |

⚠⚠ **THE TWO COMPOSABLES ARE THE POINT OF THIS PHASE, NOT PLUMBING.** A rail card is a SHORTCUT, and
a shortcut that recomputes its own number is this repo's named recurring disease – `HouseholdStrip.vue`'s
header records the version that actually shipped, where «the coaching meter read the current ROSTER
ROW's price instead of `coachBilling.weeklyCents` and therefore told a self-coached family it was
committing $0.00 a week while it paid court rent». **On a desktop the rail and the screen it shortcuts
to are on screen at the same moment**, which makes a drift strictly worse than the round-28 case where
the two surfaces were at least on different tabs. So the arithmetic moved:

* `src/composables/coachingBudget.ts` – `committedCents` / `capCents` / `freeCents` / `meterPct`, the
  four lines that stood in `CoachMarketScreen.vue`, carried **verbatim with their comments**. The
  market's own meter now reads them from there.
* `src/composables/seasonEntries.ts` – `enteredEvents(upcoming)`, one line, which was already written
  out three times (`SeasonScreen`'s strip, `HomeScreen`/`ThisWeekScreen`'s `nearestEntered`,
  `art/autoPreload.ts`'s key). `SeasonScreen`'s `myEntries` now calls it.

⭐ **And that is measured rather than asserted.** Mutating `freeCents` reddens the market's own
`round21-coach.test.ts` AND the rail's arm, together; mutating `enteredEvents` reddens both of the
rail's entries arms. The table of mutations is below.

---

### ⭐⭐⭐ THE EXEMPTION, IN FOUR PARTS – AND EVERY GUARD HAS BEEN SEEN TO BITE

**The harness's claim, restated in words** (its own header, and here):

> **THE SAME THINGS ARE REACHABLE AT EVERY WIDTH, OUTSIDE THE DESKTOP RAIL'S DASHBOARD.**

| part | how it is built | the test |
| --- | --- | --- |
| **1. Only the DASHBOARD is exempt; the navigation is not** | the five tabs are outside the region, so they stay in the fingerprint at 1280 | `the rail's NAVIGATION is not exempt…` asserts all five `button "…"` tokens survive the subtraction |
| **2. The boundary is a CONTAINER, never a list of names** | `RAIL_DASHBOARD = '#app > nav.tab-bar > .rail-dash'`, plus «exactly one in the document» and «this region holds no interactive role and no focus stop» | `the boundary is ONE container…` and `the exempt region holds no control…` |
| **3. Every FIGURE the rail shows exists somewhere at 375** | the region's figures are read at 1280, then all ten screens are walked at 375 and their text searched | `every figure the rail shows exists somewhere at 375` |
| **4. The claim states its exception** | in the file header, in this ledger, and in D47 | – |

…and two more the region earned on its own: **nothing in the dashboard may be text that is not a
declared title or figure** (otherwise a card could hide a number from part 3), and **the same set is
in the strip on every page** – his «карточки сквозные, одинаковые», walked across all ten stations at
1280 and compared string for string.

#### ⭐⭐ THE MUTATIONS – WHAT EACH ONE ACTUALLY PRINTED

Each applied alone, run, and reverted by copying the pristine file back (never `git checkout --`).

| # | the mutation | what reddened |
| --- | --- | --- |
| **1** | a `<button>More</button>` parked inside the exempt region | **THREE arms, independently.** `holds no control`: `+ "button \"More\""`. `NAVIGATION is not exempt`: «no tab was swallowed by the exemption». `every figure…`: «a line in the rail dashboard is neither a declared title nor a declared figure» → `+ "button: More"` |
| **1b** | `tabindex="0"` on a figure – a focus stop with **no role**, inside a declared figure, so the accessibility net alone cannot see it | `holds no control`, on its second net: `+ "p.rail-dash-figure"` |
| **2** | the coaching card re-derived so it names a number no screen prints (`freeCents * 3 + 1234567`) | `every figure the rail shows exists somewhere at 375`: `+ "$13,767"` |
| **3** | ⭐⭐⭐ **the exemption itself switched off** (the subtraction removed) | **ALL THIRTEEN parity walks go red**, naming `heading2 "In the account"` and `heading2 "Coaching budget"` as «at 1280px and NOT on the phone at 375px». That is the proof phase 4 asked for: the exemption is load-bearing TODAY and is not a guard fitted to nothing |
| **4** | the ordinary parity path, deliberately broken – `.week-arrow.back { display: none }` past 1024 (phase 5's own break, re-run) | the stacked-week room alone: `button "Back" ×2`, `icon back.svg ×2` – **and the other twelve walks stayed green**, so the exemption has not blinded the harness to a real loss |

---

### `[x]` THE IDENTITY PROOF, RE-RUN – 0 MOVED, 0 NEW, 0 GONE BELOW 1024

Arm A is phase 5's shipped head (`dc838ccd`, its four files restored in this same tree with
`git show HEAD:<path>` – read-only, no checkout); arm B is this phase. Both walked through the same
ten tab screens at 375 / 520 / 576 / 768 / 900 / 1024 / 1280, **one fresh career per width** (the
`careerAt` fixture is one-shot per test by design), every element that RENDERS censused as
tag + class + occurrence + box to 2dp.

| career | width | boxes | moved | new | gone | pixels |
| --- | --- | --- | --- | --- | --- | --- |
| `pro` (ten screens) | **375 / 520 / 576** | 2212 | **0** | **0** | **0** | **0** |
| `pro` (ten screens) | **768 / 900** | 2235 | **0** | **0** | **0** | **0** |
| `pro` (ten screens) | 1024 / 1280 | 2234 | **0** | 70 | **0** | **0** |
| `sinking` (Season) | **375 → 900** | 357 | **0** | **0** | **0** | **0** |
| `sinking` (Season) | 1024 / 1280 | 357 | **0** | 7 | **0** | **0** |

⭐ **Nothing MOVED at any width, including the two the dashboard is drawn at.** The 70 new boxes are
seven per screen across ten screens – `div.rail-dash`, two `article.rail-dash-card`, two
`h2.rail-dash-title`, two `p.rail-dash-figure` – and every one of them is the dashboard itself. It
takes the rail's empty column and pushes nothing: `margin-top: auto` puts it under the five tabs,
which is where `AC` draws it.

⚠ **THE ONE HONEST COST, NAMED RATHER THAN BURIED.** The block is in the DOM at every width and
`display: none` below 1024 (D43), so the RAW element count rises by **7 per screen** – 2321 → 2391 on
the ten-screen `pro` walk, 367 → 374 on `sinking`'s Season. Those nodes have no box, no paint and no
accessibility node: they are invisible to the census above, to `e2e/parity.spec.ts` and to a player.
The alternative – a `v-if` on `matchMedia` – costs zero nodes and a second copy of the number 1024,
and stops responding to a resized window. D43 is that trade.

#### ⭐⭐ AND THE NINE ZEROS ARE A MEASUREMENT, NOT A BLIND INSTRUMENT

The same census, in the same run, on the same careers, with **only** `.rail-dash { display: none }`
commented out:

| width | boxes moved | new | pixels moved |
| --- | --- | --- | --- |
| **375** | **160** | 70 | **42,462** |
| **768** | **160** | 70 | **42,417** |

– so the instrument is demonstrably sensitive at exactly the widths where it reports nothing.

---

### ⚠ AND IT WAS LOOKED AT, NOT ONLY MEASURED – TWO THINGS FOR HIS MORNING

The rail was screenshotted in Chromium at 1280 (`pro`, before and after an entry) and at 1024
(`sinking`). It draws the way `AC` does: five tabs at the top, the card set at the FOOT of the strip,
each card the app's own notecard – the lime eyebrow, the Sora figure, the card gradient and hairline.
A negative balance takes `.negative`'s danger tint, which is Home's own rule on the same figure
(`sinking` reads **-$1,326**). Two things are worth his eye rather than a test:

* ⚠ **ON HOME, THE BALANCE IS NOW ON SCREEN TWICE** – the Family-budget card in the column and
  «In the account» in the rail, four inches apart. That is the direct consequence of «карточки
  сквозные … на всех страницах», and `AC` itself draws both, so it shipped as he described it. **If
  he would rather the set stood down on the pages that already carry a figure, that is a rule about
  WHICH page rather than about the cards, and it is one condition per card.**
* The set sits at the bottom of a mostly empty column – `margin-top: auto`, which is where `AC` puts
  it. On a career with several entries the third card grows upwards and the rail scrolls itself,
  which is «скроллится при переполнении» doing its job.

---

### `[x]` PARITY – GREEN AT 375 / 768 / 900 / 1280, WITH THE EXEMPTION IN PLACE

`E2E_EXIT=0`, **57 tests** (51 before this phase), the six new dashboard guards among them. Every
exit code read out of a log file, never from a pipe and never from a background task's completion
notice.

---

### ⚠⚠ TWO FINDINGS THIS PHASE MADE ABOUT ITS OWN INSTRUMENTS

**1. `pro` HAS NOTHING ENTERED, so the third card is invisible to a plain walk on it.** Measured:
the dashboard draws TWO cards on `pro` – «Nothing entered yet» is the first thing
`tournament-entry.spec.ts` asserts about that fixture. Ten fingerprints that never contained the
«My entries» card are equal, which is this round's own «four empty sets are equal» one level up, and
the same hole phase 5 found behind `pro`'s un-stacked weeks and phase 4 found behind Money's chapter
row. ⭐ **The honest fix is to reach the state**: the entries arm presses `Enter` on the soonest event
the feed offers and then compares the rail's list with the Season strip's.

⚠ **And folding that entry into every guard was tried and reverted, because it breaks a station.**
An entry changes what Home's Next-tournament plate OPENS (round 31 #1: with something entered,
`ThisWeekScreen` draws the tournament instead of its own «This week» heading), so
`STATIONS['ThisWeekScreen.vue']`'s arrival anchor stops holding – which is exactly what a walk on the
`junior` fixture does, for exactly the same reason. **The station map is calibrated for a `pro` with
nothing entered.** That is a property of the map, not of this phase, and it is written down here
because the next person to widen the walk will meet it.

**2. ⚠⚠ THE FIRST DRAFT OF THE «one world, two surfaces» ARMS COULD NOT BITE, AND THE MUTATION IS
WHAT SHOWED IT.** They compared the RAIL's render with the SCREEN's render. That is a SHARING claim
only: mutate the shared computed and both move together. Measured – `freeCents` reduced to the cap
alone reddened `round21-coach.test.ts` and left the rail's arm **green**. It is the «comparing a thing
with itself yields a byte-identical diff» failure CLAUDE.md records, in a new costume. Both arms now
rebuild the expected value from the snapshot's OWN fields (`weeklyIncomeCents` minus the current
row's `weeklyCents`; `upcoming.filter(entered)` mapped to `label · week`) and keep the render-to-render
comparison as the second assertion – which is `round28-household-shared.test.ts`'s own discipline,
followed properly the second time.

⚠ **A third instrument was too weak and was fixed the same way:** the entries fixture had ONE event on
the calendar, so «the entered ones» and «all of them» were the same list, and replacing
`enteredEvents`' filter with `slice()` reddened only the negative arm. With two events and one entry
it reddens both.

---

### The eleven new test arms, and every one is mutation-verified

| where | what it holds |
| --- | --- |
| `tests/component/round36-rail-dashboard.test.ts` §1 (4 arms) | the block is a DIRECT child of the one `nav.tab-bar`; `display: flex` at 1280; `display: none` at 375 and at 768 – and the element is in the DOM at all three, which is what makes «desktop-only» a stylesheet fact rather than a `v-if` |
| §2 (4 arms) | each card prints what the screen it shortcuts to prints, expected value rebuilt from the snapshot; and the entries card is SILENT with nothing entered |
| §3 (2 arms) | the rendered dashboard has no button, link, input, focus stop or explicit role **with the entries card up**; and the FILE declares no `@click` / `v-on` / `<button` / `IconButton` / `tabindex` / `role=` – the one net that catches a Vue listener, which attaches no DOM attribute |
| §4 (1 arm) | all three titles are already phrases on the surfaces the figures live on |
| `e2e/parity.spec.ts` (+6 tests) | the four parts of the exemption, plus «no undeclared text in the region» and «the same set on every page» |

**Component mutations, each applied alone against the whole `component` project:**

| mutation | what reddened |
| --- | --- |
| `freeCents` forgets what is committed | `round21-coach.test.ts` **and** the rail's coaching arm – the pair that proves they share a source |
| `committedCents` back to the round-28 defect (a self-coached family commits nothing) | `round21-coach`, `round28-household-block` **and** the rail's coaching arm |
| `enteredEvents` stops filtering | **both** of the rail's entries arms (after the fixture was strengthened – see above) |
| the account card a dollar out | the rail's account arm alone |
| `.rail-dash { display: none }` deleted | the phone arm and the tablet arm, together; the desktop arm green |
| the 1024 rung never turns it on | the desktop arm alone; the phone and tablet arms green |
| ⭐ `@click` on a figure – a Vue listener, which attaches **no DOM attribute and no aria role** | the FILE pin alone, by name («RailDashboard.vue's template carries `@click`»), with the rendered arm green beside it. That asymmetry is what makes the source pin worth its place: it is the only net in either suite that can see this |

#### ⚠ THE MUTATIONS THAT DID NOT BITE, RECORDED AS PHASES 4 AND 5 DID

| mutation | what it should have reddened | why it did not |
| --- | --- | --- |
| `freeCents` forgets what is committed (**first draft of the arms**) | the rail's coaching arm | it compared two RENDERS of one computed. Fixed – the expected value is now rebuilt from the snapshot; see finding 2 above |
| `enteredEvents` stops filtering (**with the one-event fixture**) | the positive «My entries» arm | with a single event on the calendar, «entered» and «all» are the same list. Fixed – the fixture now carries two events and one entry |
| a `<button>` parked in the region | the DOM focus-stop net in `holds no control` | the accessibility net asserts first and threw before it ran. It is not blind – mutation **1b** (a `tabindex` with no role) reaches it and reddens it by name |

⚠ **One unrelated red appeared once and did not reproduce:** `prologue-handover.test.ts`'s
«he never names a ceiling» went red in the `committedCents` run and was green in every other run of
the same suite, including the clean one after it. Nothing in this phase reaches that surface; it is
recorded rather than explained, and the clean full-suite run below is the control.

---

### Gates – phase 6

Run one at a time, and **every exit code read out of the log file**, never from a pipe and never from
a background task's completion notice.

| gate | result |
| --- | --- |
| `npm run test:e2e` | **`E2E_EXIT=0`** – 57 tests, the thirteen parity walks and the six exemption guards among them |
| `npm run test:quiet` | **`QUIET_EXIT=0`** |
| `npm run test:component` | **1375 passed across 121 files** (1364 before this phase; eleven new arms, one new file) |
| `npm run check` | **`CHECK_EXIT=0`** – the doc audit, the pin ratchet, the decision index, `vue-tsc`, `check:tools`, the component suite and the build |

⚠ **`npm run test:sim` was NOT run** – the standing regime (owner's ruling, 22.08) puts it in front of
a PR assembly, and this phase touches no engine code.

### Open at the end of phase 6

- `[?]` **D39** – one component with three cards, where his word was «компоненты». Splitting them is
  cheap and does not move the exemption's boundary; it is his feature, so it is his call.
- `[?]` **D40** – three information cards now sit inside the `navigation` landmark. They hold no
  control, so nothing a keyboard can reach moved; a `complementary` region of their own costs a
  wrapper element at every width, which is the identity contract.
- `[?]` **D46** – `AC` draws a fourth rail card, `CONDITION`. He named three, so three shipped. It is
  the smallest of the four to add and it costs a fourth title.
- `[?]` **the balance is on Home twice** – the card and the rail, on the one page that already
  carries the figure. His ruling and his frame both say the set is on every page; standing a card
  down where its own screen is open is one condition per card if he wants it.
- `[ ]` everything still open from phases 1–5, unchanged by this phase.
