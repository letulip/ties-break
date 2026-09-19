// ⭐⭐⭐ THE PARITY HARNESS – «ВСЁ, ЧТО ЕСТЬ НА МОБИЛЕ, ДОЛЖНО БЫТЬ 1 К 1 НА ДРУГИХ ФОРМАТАХ».
//
// Round 36 phase 1 (docs/specs/responsive-2026-09.md). This file is built BEFORE any layout moves,
// and it is the instrument the whole responsive wave is measured by. The owner's acceptance
// criterion, in his own words and quoted in the spec:
//
//     «всё, что есть на мобиле, должно быть 1 к 1 по доступности быть и на других форматах»
//     «Все иконки наши, ничего нового по идее не должно появиться, как и старого уйти ничего не должно»
//
// ⚙ AND PLAYWRIGHT IS HIS OWN SUGGESTION – «возможно здесь как раз нас могу выручить playwright?».
// He is right, and it is the strictly stronger instrument for this question: `tests/component/` runs
// in happy-dom, which has NO LAYOUT ENGINE, so a mounted test can only prove a node EXISTS. A real
// browser proves it is in the accessibility tree, has a box, and is therefore reachable at a real
// viewport. `tests/component/fits.ts`'s whole header is this same argument from the other side.
//
// -------------------------------------------------------------------------------------------------
// WHAT IT DOES
// -------------------------------------------------------------------------------------------------
// For every screen the app has: walk to it at 375, record a FINGERPRINT, then walk to it again at
// 768, 900 and 1280 and assert the three wider fingerprints EQUAL the 375 one. A control present at
// 375 and absent at 1280 fails by name; a control that exists only at 1280 fails the same assertion
// from the other side, which is «ничего нового не должно появиться» as a machine check.
//
// ⭐⭐ ROUND 36 PHASE 3 WIDENED WHAT «IS ON THE SCREEN» MEANS, AND THE OWNER'S OWN WORDING IS WHY:
// every disclosure is opened, at every width, before the fingerprint is taken – so the claim is
// «the same things are REACHABLE at every width», not «the same things are drawn on arrival». See
// `openEveryDisclosure` below for the argument and for what it does not give up.
//
// -------------------------------------------------------------------------------------------------
// ⚠ WHAT IT CANNOT PROVE, SAID PLAINLY, BECAUSE A HARNESS THAT OVERSTATES ITSELF IS WORSE THAN NONE
// -------------------------------------------------------------------------------------------------
// It proves PRESENCE, VISIBILITY and REACHABILITY. It does not prove the layout is good, or that a
// screen is beautiful, or that the wide version is a design rather than a stretched phone. It cannot
// see a control that is on screen but ugly, mis-aligned, overlapping or too small for a thumb. That
// judgement is the owner's and he has said so – «я утром буду всё уже сам глазами смотреть».
//
// Three narrower limits, each of which is a real hole and not a quibble:
//   * IT IS BLIND TO ORDER. The fingerprint is a multiset, so a wide layout may reshuffle the same
//     controls freely. That is deliberate – rearranging IS the wave's job – but it means "the same
//     things are here" and not "in the same places".
//   * IT IS BLIND TO A DECORATIVE GLYPH THAT CARRIES NO FILE. Icons are counted by the asset they
//     load (see `paintFingerprint`), so an inline `<svg>` is counted by its class and a glyph drawn
//     with borders is not counted at all.
//   * IT SEES ONE STATE PER SCREEN. A screen has branches (an empty ledger, an injured week, an open
//     letter) and this walks one career through one route into each. A control that only ever exists
//     in a branch nobody walks is a control this cannot answer for.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ AND IT IS BUILT SO A LATER PHASE CANNOT MAKE IT VACUOUS. Three separate mechanisms:
// -------------------------------------------------------------------------------------------------
//  1. THE SCREEN LIST IS DERIVED FROM THE FILESYSTEM, never written out. `src/components/screens/`
//     is a closed set – `coverage-map.spec.ts` already holds it against `docs/specs/e2e-coverage.md`
//     – and every file in it must have a station below or `every screen has a station` goes red
//     naming the file. A hand-written list is one forgotten screen away from proving nothing.
//  2. AN EMPTY FINGERPRINT IS THE OTHER WAY TO PROVE NOTHING, and it is the quiet one: four empty
//     sets are equal, so a station that silently failed to arrive would pass forever. So every
//     station asserts its own arrival against an anchor BEFORE it measures, and the measurement
//     itself has a floor (`FINGERPRINT_FLOOR`) fitted to the real numbers.
//  3. THE HEIGHT IS FIXED AT 900 FOR ALL FOUR WIDTHS. Only the width varies, so a difference cannot
//     be explained away by a taller viewport rendering more rows.
//
// ⚠ IT MUST BE GREEN THE DAY IT LANDS, and that is its own honesty check rather than a nice
// property: nothing has moved yet, the app is one column at every width, so a red run today would
// mean the harness is wrong. Green today and red the first time phase 2 drops a control is the
// entire point.
//
// -------------------------------------------------------------------------------------------------
// ⭐⭐⭐ ROUND 36 PHASES 6 AND 7, THE SECOND PASS, AND THE ALBUM – THE CLAIM CARRIES FOUR EXCEPTIONS
// -------------------------------------------------------------------------------------------------
// What this file asserts, from the album wave on, is:
//
//     THE SAME THINGS ARE REACHABLE AT EVERY WIDTH, **OUTSIDE THE DESKTOP RAIL'S DASHBOARD, THE
//     WEEK PAGER'S ARROWS, HER IDENTITY BLOCK, AND THE ALBUM'S CHAPTER DOOR AND PAN PILL**.
//
// ⚠⚠ A CLAIM WITH FOUR EXCEPTIONS HAS TO STATE ALL FOUR, which is why the sentence above names
// them and why none is only a decisions row. All four rest on the owner's own words, each written
// down before the exemption was:
//
//   1. THE RAIL'S DASHBOARD (phase 6): «можно вынести эту часть поля навигации из этой проверки? у
//      меня вообще планы небольшие на этот дашборд есть дальше и это исключительно десктопная фича.»
//   2. THE WEEK PAGER'S ARROWS (phase 7): «на десктопе неделя из двух карточек показывает две серые
//      стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть что
//      листать.»
//   3. HER IDENTITY BLOCK (the second pass, P2-6, 05.09.2026): «и аватар с текущей позицией и рангом
//      (так же, как и все остальные плашки) на десктоп в боковом меню живут на всех страницах
//      неизменно.» – the ruling `D75` asked for, whose price was named as exactly this exemption
//      before he took it.
//   4. THE ALBUM'S CHAPTER DOOR AND ITS PAN PILL (the album wave, 19.09.2026) – below, at length,
//      because this one is READ OFF A DOCUMENT rather than quoted out of a chat, and that difference
//      is the whole of what a reader needs to know about it.
//
// ⚠⚠ AND THE SECOND ONE COSTS SOMETHING THIS FILE ARGUED AGAINST, SAID PLAINLY RATHER THAN BURIED.
// Which weeks overflow DEPENDS ON THE WIDTH – a two-card week overflows by 273px at 375 and fits
// whole from 768 up (measured, phase 7) – so arrows drawn only on an overflowing strip really are a
// control present at 375 and absent at 1280. That is exactly what «ничего нового … как и старого
// уйти ничего не должно» forbids, `src/composables/weekPager.ts` said so in its own header, and D35
// put the price to him in those words before he ruled. He ruled. The exemption is the price, and the
// guards below are what stop it being a hole – in particular the HONEST HALF: at a width where a
// strip DOES overflow, the arrows must be there. «Hidden when idle» is the ruling; «hidden whenever»
// is what `the honest half` reddens on.
//
// ⚠⚠ AND EACH EXEMPTION IS BUILT SO IT CANNOT GROW. FOUR PARTS EACH – the same shape twice, because
// phase 6's shape is this round's standard – and the last three are what stop one becoming a hole.
// Each part is a test below, and each has been SEEN to redden; the mutations and what they printed
// are in docs/rounds/round-36.md.
//
// EXEMPTION 1 – THE RAIL'S DASHBOARD:
//   1. ONLY THE DASHBOARD REGION IS EXEMPT. The rail's NAVIGATION is not: the five tabs exist at
//      every width and still fail by name if one goes. `the rail's navigation is NOT exempt` holds
//      exactly that, by asserting the five tab buttons are still IN the fingerprint at 1280.
//   2. THE BOUNDARY IS A CONTAINER, NEVER A LIST OF NAMES. `RAIL_DASHBOARD` below is a structural
//      selector – the region inside the rail, and nothing else in the app – so a later phase cannot
//      dodge the check by naming a control it wants ignored. And because a container is a place
//      rather than a list, the region has to be forbidden to HOLD a control: it is, by
//      `the exempt region holds no control`.
//   3. EVERY FIGURE THE RAIL SHOWS MUST EXIST SOMEWHERE AT 375. That keeps the honest half of his
//      criterion. A card is a SHORTCUT; a number the phone cannot reach at all is a new fact on a
//      desktop and reddens.
//      ⚠ ROUND 42 #23 GREW THE CARD AND THIS PART GREW WITH IT. «В coaching budget я просил отражать
//      всех активных специалистов» put a row per filled seat on the Team-budget card, and both of a
//      row's leaf spans are declared and checked below rather than exempted – MEASURED on the phone,
//      through the doors a player uses: `Coach` and `$389 /wk` are both on the Coach Market at 375,
//      drawn there from the same computed the rail reads. The rename in the same item («Coaching
//      budget» -> «Team budget», his own wording) moved the two title declarations and nothing else.
//      ⭐ AND THE DECLARATION WAS MUTATION-VERIFIED BEFORE IT SHIPPED, 16.09, because declaring a
//      line is one keystroke from exempting it: with `CoachMarketScreen.vue`'s own `.budget-seat`
//      rows deleted – the seat figure on the desktop and nowhere else – this test went **1 RED**
//      naming `"$389 /wk"` in the unreachable list. A declaration that cannot fail is the hole.
//   4. …and the claim is restated in words, above.
//
// EXEMPTION 3 – HER IDENTITY BLOCK (the second pass, P2-6), built to the same four-part shape:
//   1. ONLY THE BLOCK IS EXEMPT. The rail's five tabs and its dashboard are outside it and stay in
//      the check, and so is every other control on every screen: `the exempt region holds ONLY her
//      identity block` names what may be in there – her face, the week, the callout and her rank.
//   2. THE BOUNDARY IS A PLACE, IN BOTH PLACES. `IDENTITY_BLOCK` below is the rail's own container
//      plus the three positions on Home's photograph the block occupies below 1024 – never a list of
//      names, so a later phase cannot widen it by calling a control something.
//   3. ⭐⭐ THE HONEST HALF: THE BLOCK MOVED AND NOTHING WAS LOST. `the block MOVED, nothing was lost`
//      asserts that the controls exempt at 375 are the SAME controls exempt at 1280, name for name –
//      so «her face is chrome now» can never quietly become «her rank chip is gone on a phone».
//   4. …and the claim is restated in words, above.
//
// EXEMPTION 2 – THE WEEK PAGER'S ARROWS (phase 7), built to that same four-part shape:
//   1. ONLY THE ARROWS ARE EXEMPT. The strip, the cards and every control ON a card stay in the
//      check: `only the ARROWS are exempt` asserts the week's own `Enter`/`Withdraw` controls and the
//      card headings survive the subtraction at 1280, and that nothing but `Back`/`Next` is taken.
//   2. THE BOUNDARY IS A CONTAINER. `WEEK_PAGER` below is `#app .week-row > .week-pager` – a PLACE,
//      not a list of names – and because a container is a place, what may live in it is fixed:
//      `the boundary is a container…` asserts every pager holds exactly the two arrows and nothing
//      else, so a later phase cannot park a control in there and out of the check.
//   3. ⭐⭐ THE HONEST HALF: WHERE A STRIP DOES OVERFLOW, THE ARROWS ARE THERE. Without this the
//      exemption would read «arrows may be missing whenever», which is not what he ruled.
//      `the honest half…` measures `scrollWidth - clientWidth` per week per width in the real browser
//      and asserts the biconditional – overflow ⟺ arrows – at all four widths.
//   4. …and the claim is restated in words, above.
//
// EXEMPTION 4 – THE ALBUM'S CHAPTER DOOR AND ITS PAN PILL, built to that same four-part shape:
//   1. ONLY THOSE TWO ARE EXEMPT. `Back to Home`, the two sheet arrows and every dot of the pager
//      stay in the check at all four widths: `only the CHAPTER DOOR and the PAN PILL are exempt`
//      holds exactly that, by name, on the subtracted list the walk really compares.
//   2. THE BOUNDARY IS TWO CONTAINERS, NEVER A LIST OF NAMES. `ALBUM_CHAPTERS` and `ALBUM_PAN_HINT`
//      below are places – the chapter-navigation slot in both of the shapes the app draws it in, and
//      the pill over the page's bottom-right corner – so a later phase cannot dodge the check by
//      naming a control it wants ignored, and `the boundary is the CHAPTER SLOT and the PAN SLOT`
//      fixes what may live in each.
//   3. ⭐⭐ THE HONEST HALF, AND IT IS A DIFFERENT SENTENCE FOR EACH CONTROL, because the two are
//      exempt for different reasons:
//        · the door's FUNCTION has to survive the subtraction – `the chapters are not lost, they
//          are OPEN` opens the phone's sheet, reads its chapters, and asserts the wide rail carries
//          the same ones, name for name, each with a box. A chapter a wide width cannot reach is a
//          fact the phone has and the desktop has not, and reddens.
//        · the pill's absence is conditional on there being nothing to pan – `a page that does NOT
//          fit whole keeps its pill` measures the sheet against the window in the real browser at
//          all four widths and asserts the biconditional. «Hidden when idle» is the ruling; «hidden
//          whenever» is what that arm reddens on. It is exemption 2's own honest half, re-aimed.
//   4. …and the claim is restated in words, above – and in words, HERE, because the provenance of
//      this one is not the provenance of the other three:
//
//      ⚠⚠⚠ THIS EXEMPTION IS AN ARCHITECT'S READING OF AN OWNER DOCUMENT, NOT A RULING HE TYPED IN
//      ANSWER TO IT, AND IT IS FLAGGED TO HIM FOR REVERSAL. The other three are sentences he wrote
//      about this check after playing a build. This one is read off the design archive he sent on
//      19.09.2026 (`album_responsive`, its `README.md`, his own hand), under «Навигация по главам»:
//
//          «1024: все 6 глав сеткой под листом.
//           768: та же лента, скроллится горизонтально.
//           390: кнопка «Chapters» — рейл занял бы полэкрана.»
//
//      That is him specifying, for THIS screen, that the chapter navigation is a BUTTON at 390 and a
//      RAIL at 768 and up – which is the door being a phone-only control by his own design. The
//      second control is covered by the week pager's ruling already quoted above, «Спрятать – да,
//      показываем только если есть что листать»: from 768 up the sheet fits the window whole, so
//      there is nothing to pan to and the pill has nothing to say.
//
//      ⚠ HE HAS NOT BEEN ASKED, AND THE READING MAY BE WRONG. So it is built to be undone in one
//      move: DELETE the `describe` block at the bottom of this file and the two constants it names
//      from `EXEMPT_REGIONS` / `ariaFingerprint`, and `AlbumScreen.vue`'s station goes red again with
//      exactly the two tokens it was red with on 19.09 – `button "Chapters"` and `button "Next
//      half"`. Nothing else in this file depends on it. If he disagrees, the red is the answer.
//
// ⚠ BOTH EXEMPTIONS ARE LOAD-BEARING TODAY AND NEITHER IS A GUARD FITTED TO NOTHING – which is the
// objection phase 4 refused to ship past. The three rail card titles are `heading` nodes, so without
// the subtraction the 1280 fingerprint carries three tokens the 375 one does not and every screen
// goes red; the arrows are `button` nodes present at 375 and gone by 768, so without the subtraction
// the stacked-week room goes red from the other side. `the exemption is doing real work` and
// `the arrows' exemption is doing real work` assert exactly those, so the day either region stops
// contributing anything, this file says so instead of quietly guarding an empty set.

import type { Locator, Page } from '@playwright/test'
import { test, expect, type CareerAt } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, enterConfirmButton, weekButton } from './journey'
// ⚠ THE STATION MAP MOVED OUT ON 06.09 (T-09) AND NOTHING ABOUT IT CHANGED. `e2e/a11y.spec.ts` runs
// axe over the same screens by the same routes, and two copies of this walk would drift; the
// argument is written out in e2e/stations.ts's own header. Mechanism 1 of this file's header is
// UNCHANGED and still lives here: `every screen in src/components/screens/ has a station` holds
// `SCREENS_ON_DISK` – still read off the filesystem – against `STATIONS`.
import { STATIONS, SCREENS_ON_DISK, park, navTab, type Station } from './stations'

// =================================================================================================
// HIS LADDER, AS THE FOUR WIDTHS THAT ARE ACTUALLY WALKED
// =================================================================================================
//
// One width per band of docs/specs/responsive-2026-09.md, so a rung that breaks names its own band:
//
//     375   the phone – the BASE every other width is compared against
//     768   the bottom of the tablet band, where the column first grows past the phone
//     900   the top of the fluid tablet band and the value the 901–1023 plateau pins to
//    1280   desktop, past the 1200 cap, so the column is capped AND centred
//
// ⚠ 375 IS THE BASE AND NOT 576. The suite's usual viewport is the owner's own phone; this file
// drops to the narrowest width the app supports because that is where «всё, что есть на мобиле»
// is measured – the smallest set is the one the wider formats must match.
const BASE_WIDTH = 375
const WIDER_WIDTHS = [768, 900, 1280] as const
const WIDTHS = [BASE_WIDTH, ...WIDER_WIDTHS] as const

/** ⚠ THE SAME HEIGHT AT EVERY WIDTH. Only the width is the variable under test; a viewport that got
 *  taller as it got wider would let "more rows fit" masquerade as a difference, and would let a real
 *  difference hide behind one. 900 is tall enough that no screen here is height-clipped. */
const VIEWPORT_HEIGHT = 900


// =================================================================================================
// THE FINGERPRINT
// =================================================================================================

/** The roles that carry the owner's criterion: something you can press, type in or read as a
 *  landmark heading, and something drawn that SAYS what it is.
 *
 *  ⚠ A CLOSED SET, for the reason journey.ts gives for its own two: a fingerprint over "every role"
 *  would fold in `text`, `paragraph`, `generic` and every list item on the page, and would then go
 *  red on a copy edit rather than on a lost control – which is the fastest way to teach somebody to
 *  ignore this gate. What is here is what «1 к 1» is about. */
const FINGERPRINTED_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'slider',
  'spinbutton',
  'tab',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'heading',
  'img',
  'figure',
  'meter',
  'progressbar',
  'table',
])

/**
 * The accessibility tree, as a list of `role "name"` tokens.
 *
 * ⚠ PLAYWRIGHT'S OWN ENGINE COMPUTES THE NAMES, and that is why this is an aria snapshot rather than
 * a hand-rolled DOM walk. An accessible name is `aria-labelledby`, then `aria-label`, then `alt`,
 * then the element's own text, with whitespace folded – four fallbacks and a normalisation that a
 * spec re-implementing them would get subtly wrong and then assert against itself.
 *
 * ⚠ AND THE SNAPSHOT IS ALREADY VISIBILITY-FILTERED, which is the property this file needs and the
 * reason a `querySelectorAll` walk would be weaker: `display: none`, `visibility: hidden` and
 * `aria-hidden` are all absent from the a11y tree, so a control hidden at 1280 by any of the three
 * disappears from this list and is named by the diff.
 */
/**
 * ⭐⭐⭐ ROUND 36 PHASE 6 – THE ONE EXEMPT REGION IN THE WHOLE APP, AS A CONTAINER.
 *
 * The owner's rail dashboard (`src/components/RailDashboard.vue`), and the selector is STRUCTURAL on
 * purpose: it names the place – the block inside the app's one rail – and not the things inside it.
 *
 * ⚠⚠ THAT IS THE PART THAT KEEPS THE EXEMPTION SMALL. An exemption written as a list of accessible
 * names («ignore `In the account`…») is one edit away from ignoring a control: whoever adds the
 * control also adds the name. A container cannot be extended that way – a later phase would have to
 * move an element INTO the rail's dashboard, and `the exempt region holds no control` fails the
 * moment anything interactive lands there.
 *
 * ⚠ `#app >` IS LOAD-BEARING TOO: it pins the region to the app frame's own navigation rather than
 * to any `.rail-dash` that might be drawn elsewhere, and `the boundary is one container` asserts the
 * document holds exactly one of them.
 */
const RAIL_DASHBOARD = '#app > nav.tab-bar > .rail-dash'

/**
 * ⭐⭐⭐ ROUND 36 PHASE 7 – THE SECOND EXEMPT REGION, AND IT IS A CONTAINER FOR THE SAME REASON.
 *
 * The week pager's two arrows (`src/components/screens/SeasonScreen.vue`), which his 04.09 ruling
 * takes off a strip with nothing to page. They live in a `div.week-pager` that exists ONLY to be this
 * boundary – it is `display: contents`, so it draws no box and costs the identity census nothing.
 *
 * ⚠⚠ THE SAME ARGUMENT AS `RAIL_DASHBOARD`, AND IT MATTERS MORE HERE. An exemption written as
 * «ignore `Back` and `Next`» would ignore those two words ANYWHERE in the app – `EndingScreen`'s
 * album pager uses exactly them – and would be one edit away from ignoring a third control somebody
 * decided to call `Back`. A container cannot be widened that way: a later phase would have to move an
 * element INTO a week's pager, and `the boundary is a container` fails the moment anything but the
 * two arrows is in there.
 *
 * ⚠ `#app` AND THE CHILD COMBINATOR ARE BOTH LOAD-BEARING: the region is a direct child of a week's
 * own row inside the app frame, so a `.week-pager` drawn anywhere else is not exempt and is named by
 * the ordinary walk instead.
 */
const WEEK_PAGER = '#app .week-row > .week-pager'

/**
 * ⭐⭐⭐ ROUND 36 SECOND PASS, P2-6 – THE THIRD EXEMPT REGION, AND HE PRICED IT BEFORE HE BOUGHT IT.
 *
 * The owner, 05.09.2026: «и аватар с текущей позицией и рангом (так же, как и все остальные плашки)
 * на десктоп в боковом меню живут на всех страницах неизменно». That is his ruling on `D75`, which
 * had named this exact cost and left it to him: three controls that are on nine screens at 1280 and
 * on none of them at 375 fail «ничего нового по идее не должно появиться» BY NAME.
 *
 * ⚠⚠ AND IT IS TWO PLACES, NOT ONE, WHICH IS WHAT MAKES IT HONEST RATHER THAN CONVENIENT. The block
 * is her face, the week beside it and her rank chip; past 1024 it is the rail's, and below 1024 it is
 * on Home's photograph, where it has always been. Exempting only the rail would leave HOME failing
 * from the other side – its own copies would be counted at 375 and subtracted at 1280 – so the
 * exemption is «her identity block, wherever the app draws it», and `the block MOVED, nothing was
 * lost` below asserts that the two places carry the SAME controls.
 *
 * ⚠ STILL STRUCTURAL, AND STILL AS NARROW AS THE OTHER TWO. Three positions on the photograph and
 * one container in the rail – places, never accessible names – so a later phase cannot dodge the
 * check by naming a control it wants ignored; it would have to move an element into her header row,
 * under her hero, into her `.diary-id`, or into the rail's own block, and
 * `the exempt region holds ONLY her identity block` fails the moment anything else lands there.
 */
const RAIL_IDENTITY = '#app > nav.tab-bar > .rail-id'
const HOME_IDENTITY =
  '#app .diary-head > .diary-avatar-btn, #app .diary-hero > .diary-kid-hint, #app .diary-id > .diary-rank'
const IDENTITY_BLOCK = `${RAIL_IDENTITY}, ${HOME_IDENTITY}`

/**
 * ⭐⭐⭐ THE ALBUM WAVE, 19.09.2026 – THE FOURTH EXEMPT REGION, AND IT IS TWO PLACES FOR THE SAME
 * REASON HER IDENTITY BLOCK IS.
 *
 * ⚠⚠ READ THE FOURTH BLOCK OF THIS FILE'S HEADER BEFORE THIS LINE. Unlike the three above, this
 * exemption is an ARCHITECT'S READING of the owner's design archive and not a sentence he wrote in
 * answer to this check; the header says so, says what deleting it restores, and is where the quote
 * lives. These two constants are only the place.
 *
 * THE CHAPTER SLOT IS WHEREVER THE APP DRAWS THE CHAPTER NAVIGATION, and the README gives that one
 * list three shapes: a grid at 1024, the same strip panned sideways at 768, and a BUTTON at 390
 * because «рейл занял бы полэкрана». So the door at the foot of the phone's screen and the rail
 * under the wide page are the SAME control wearing the width's own shape – exempting only the door
 * would leave the walk failing from the other side, naming every plate of the rail as a control that
 * appeared on a desktop. That is the identity block's argument exactly (`IDENTITY_BLOCK` above), and
 * `the chapters are not lost, they are OPEN` asserts the two places carry the same chapters.
 *
 * ⚠ STILL STRUCTURAL, AND STILL AS NARROW AS THE OTHER THREE. One button in the foot row, one `nav`
 * under the album, one pill on the stage – places, never accessible names – so a later phase cannot
 * widen this by calling a control something. It would have to move an element INTO the foot row's
 * door, into the chapter rail or into the pan pill, and `the boundary is the CHAPTER SLOT and the
 * PAN SLOT` fails the moment anything that is not a chapter plate lands in there.
 *
 * ⚠ `#app` AND THE CHILD COMBINATORS ARE LOAD-BEARING, exactly as they are for the week pager: an
 * `.album-rail` or an `.album-half` drawn anywhere else in the app is NOT exempt and is named by the
 * ordinary walk instead. The arms below assert the document holds exactly one of each.
 */
const ALBUM_CHAPTER_DOOR = '#app .album-foot-row > .album-chapters-btn'
const ALBUM_CHAPTER_RAIL = '#app .album > nav.album-rail'
const ALBUM_CHAPTERS = `${ALBUM_CHAPTER_DOOR}, ${ALBUM_CHAPTER_RAIL}`
const ALBUM_PAN_HINT = '#app .album-stage > .album-half'
const ALBUM_EXEMPT = `${ALBUM_CHAPTERS}, ${ALBUM_PAN_HINT}`

/** All four exempt regions, as one selector list – the form `Element.closest` takes. */
const EXEMPT_REGIONS = `${RAIL_DASHBOARD}, ${WEEK_PAGER}, ${IDENTITY_BLOCK}, ${ALBUM_EXEMPT}`

/** `a` minus `b` as MULTISETS, raw – the same counting `missingFrom` does, without its rendering.
 *  Removing exactly as many copies as `b` holds is what makes the subtraction exact rather than
 *  approximate: a token the dashboard shows twice takes two copies out of the page's list and no
 *  more, so an identical token belonging to the SCREEN survives. */
function subtractOnce(a: string[], b: string[]): string[] {
  const left = new Map<string, number>()
  for (const token of b) left.set(token, (left.get(token) ?? 0) + 1)
  const out: string[] = []
  for (const token of a) {
    const owed = left.get(token) ?? 0
    if (owed > 0) left.set(token, owed - 1)
    else out.push(token)
  }
  return out
}

/** The aria tokens of ONE box – the body for the page, the dashboard for the region it exempts. */
async function ariaTokensOf(target: Locator): Promise<string[]> {
  const yaml = await target.ariaSnapshot()
  const tokens: string[] = []
  for (const line of yaml.split('\n')) {
    // `- button "Home"`, `- heading "Season" [level=2]`, `- img "Season ladder rung"`, and the
    // unnamed `- button`. A `- /url: "#x"` child line cannot match: it does not start with a letter.
    const match = /^\s*-\s+([a-z][a-z-]*)(?:\s+"((?:[^"\\]|\\.)*)")?/.exec(line)
    if (!match) continue
    const [, role, rawName] = match
    if (!FINGERPRINTED_ROLES.has(role)) continue
    const level = role === 'heading' ? (/\[level=(\d+)\]/.exec(line)?.[1] ?? '?') : ''
    const name = rawName === undefined ? '<unnamed>' : rawName.replace(/\\"/g, '"')
    tokens.push(`${role}${level} "${name}"`)
  }
  return tokens
}

/** The page, MINUS the four exempt regions – part 2 of each exemption, applied.
 *
 *  The rail's dashboard is `display: none` at 375 / 768 / 900, so it is absent from the accessibility
 *  tree and subtracts nothing there; at 1280 it takes out exactly what the three cards contribute.
 *  The pager's arrows run the other way round – present at 375, where a two-card week overflows by
 *  273px, and gone from 768 up where it fits whole. The album's slot is the only one that subtracts
 *  something at EVERY width and a different thing at each: the chapter door at 375, the rail's plates
 *  from 768 up. Between them the subtractions leave the screen's own set, which is what the walk
 *  compares. */
async function ariaFingerprint(page: Page): Promise<string[]> {
  const whole = await ariaTokensOf(page.locator('body'))
  const exempt = [
    ...(await railDashboardTokens(page)),
    ...(await weekPagerTokens(page)),
    ...(await identityTokens(page)),
    ...(await albumTokens(page)),
  ]
  return exempt.length === 0 ? whole : subtractOnce(whole, exempt)
}

async function railDashboardTokens(page: Page): Promise<string[]> {
  const region = page.locator(RAIL_DASHBOARD)
  // The block is in the DOM at every width (`display: none` is what makes it desktop-only), so this
  // is a real count and not a proxy for "is it a desktop". An empty career draws no dashboard at
  // all, and an absent region exempts nothing.
  if ((await region.count()) === 0) return []
  return ariaTokensOf(region)
}

/**
 * Everything inside every week pager on the screen.
 *
 * ⚠ THERE ARE SEVERAL OF THEM AND THAT IS THE DIFFERENCE FROM THE RAIL. The dashboard is the shell's
 * and there is exactly one; a pager belongs to a WEEK, and a Season feed can draw one per stacked
 * week – four arrows on `sinking` at 375. So this walks them all rather than asserting one.
 *
 * ⚠ IT SNAPSHOTS THE CONTAINER'S CHILDREN, NOT THE CONTAINER. `.week-pager` is `display: contents`
 * (it must be, or it would be a box the identity census counts), and a box-less element is not a
 * thing an accessibility snapshot can be rooted at. Reading the children is the same claim – whatever
 * is IN the region, whatever that turns out to be – and `the boundary is a container` is what fixes
 * what may be in there.
 */
async function weekPagerTokens(page: Page): Promise<string[]> {
  const inside = await page.locator(`${WEEK_PAGER} > *`).all()
  const tokens: string[] = []
  for (const el of inside) tokens.push(...(await ariaTokensOf(el)))
  return tokens
}

/**
 * Her identity block, in BOTH of the two places the app draws it.
 *
 * ⚠ THE RAIL'S COPY IS `display: none` BELOW 1024 AND HOME'S ARE `display: none` FROM 1024, so at
 * any one width exactly one set is in the accessibility tree and the other contributes nothing –
 * which is what makes this a single subtraction rather than two competing ones. On the nine screens
 * that are not Home there is nothing at 375 and the rail's block at 1280, which is the difference
 * this exemption exists to allow.
 *
 * ⚠ EACH MATCH IS SNAPSHOTTED SEPARATELY, like the week pagers and unlike the dashboard: this is a
 * selector LIST over four positions rather than one container, so a single locator would be
 * strict-mode ambiguous.
 */
async function identityTokens(page: Page): Promise<string[]> {
  const tokens: string[] = []
  for (const el of await page.locator(IDENTITY_BLOCK).all()) tokens.push(...(await ariaTokensOf(el)))
  return tokens
}

/**
 * The album's chapter slot, in BOTH of the shapes the app draws it, and its pan pill.
 *
 * ⚠ THE THREE POSITIONS ARE NEVER ALL IN THE TREE AT ONCE, which is what makes this one subtraction
 * rather than three competing ones: below 768 the door and the pill are on the screen and the rail is
 * `display: none`; from 768 up the rail is on the screen and the other two are gone. So this takes
 * `button "Chapters"` and `button "Next half"` at 375, and the rail's chapter plates at 768, 900 and
 * 1280 – which is the difference the exemption exists to allow, in both directions.
 *
 * ⚠ EACH MATCH IS SNAPSHOTTED SEPARATELY, like her identity block and the week pagers: this is a
 * selector LIST over three positions rather than one container, so a single locator would be
 * strict-mode ambiguous. It costs nothing on a screen that is not the album, where it matches none.
 */
async function albumTokens(page: Page): Promise<string[]> {
  const tokens: string[] = []
  for (const el of await page.locator(ALBUM_EXEMPT).all()) tokens.push(...(await ariaTokensOf(el)))
  return tokens
}

/**
 * EVERY ICON AND EVERY PAINTING, BY THE FILE IT LOADS – the half the accessibility tree cannot see.
 *
 * ⚠ THIS EXISTS BECAUSE OUR ICONS ARE DELIBERATELY INVISIBLE TO IT. `ui/AppIcon.vue` draws a glyph
 * as a masked `<span aria-hidden="true">` – a mask takes only the SVG's alpha so one file serves
 * every colour – and Home's hero is `<img alt="">`. Both are correct accessibility (they are
 * decoration beside a named control), and both mean the owner's «все иконки наши» would be
 * unmeasured if `ariaFingerprint` were the whole instrument. So the glyphs are counted by the ASSET
 * they load, which is stable under a re-tint, a resize and a re-theme.
 *
 * ⚠ VISIBILITY IS MEASURED, NOT DECLARED: a box with no client rects, or no area, or
 * `visibility: hidden` is not on the screen whatever the stylesheet says. This is the check
 * happy-dom cannot make – it has no layout engine, so every rect there is zero.
 */
async function paintFingerprint(page: Page): Promise<string[]> {
  return page.evaluate((exemptSelector) => {
    const assetOf = (value: string): string | null => {
      const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(value)
      if (!url) return null
      const raw = url[1]
      // A data URI has no name worth printing; its length is a stable enough identity for a diff.
      if (raw.startsWith('data:')) return `data:${raw.length}`
      return raw.split('?')[0].split('/').pop() || raw
    }

    const tokens: string[] = []
    for (const el of Array.from(document.querySelectorAll('*'))) {
      // ⭐ PART 2 OF BOTH EXEMPTIONS, ON THE PAINT HALF. `closest` is matched against the WHOLE
      // structural selector list, so this skips a node only when its ancestor really is the rail's
      // own dashboard or a week's own pager – an element that merely carries the class somewhere else
      // is not exempt and is named by the boundary tests instead.
      // ⚠ AND THE PAGER HALF IS NOT DECORATION: an arrow's glyph is a MASK, so without this line the
      // 375 fingerprint would carry `icon back.svg ×2` that 1280 has not, and the aria subtraction
      // alone would not have caught it. Phase 5's deliberate break named exactly that token.
      if (el.closest(exemptSelector)) continue
      if (el.getClientRects().length === 0) continue
      const box = el.getBoundingClientRect()
      if (box.width <= 0 || box.height <= 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden') continue

      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src')
        if (src) tokens.push(`art ${assetOf(`url(${src})`) ?? src}`)
        continue
      }
      if (el.tagName === 'svg') {
        tokens.push(`svg ${el.getAttribute('class') ?? '<unclassed>'}`)
        continue
      }
      const mask =
        assetOf(cs.getPropertyValue('mask-image')) ??
        assetOf(cs.getPropertyValue('-webkit-mask-image'))
      if (mask) tokens.push(`icon ${mask}`)
      const background = assetOf(cs.backgroundImage)
      if (background) tokens.push(`art ${background}`)
    }
    return tokens
  }, EXEMPT_REGIONS)
}

/**
 * ⚠⚠ SCROLL THE WHOLE SCREEN BEFORE MEASURING IT, AND THIS WAS FOUND THE HARD WAY.
 *
 * The first run of this file went red on `CoachMarketScreen.vue` with fifteen coach portraits
 * "appearing" at 768 that were "missing" at 375 – and every one of them was a false alarm. The
 * portraits are `loading="lazy"`, the market is a long list, and a narrow column is a TALLER page:
 * at 375 the ones far below the fold had never been fetched, so they measured 0x0 and dropped out of
 * the fingerprint. Nothing about the app differed. The measurement did.
 *
 * ⭐ THE FIX IS THE STRONGER CLAIM, WHICH IS WHY IT IS A SETTLE STEP AND NOT AN EXEMPTION FOR
 * `<img loading=lazy>`. «Всё, что есть на мобиле» is about what the SCREEN holds, not about what
 * happens to be inside the first 900px of it, so the walker rides the page to the bottom – in
 * viewport-sized steps, because Chromium arms lazy images as they approach rather than on a jump –
 * comes back to the top, and waits for every image to finish. Then the census is of the whole
 * screen at every width, which is the question actually being asked.
 *
 * ⚠ AND IT CHANGES NOTHING ELSE ABOUT THE MEASUREMENT: `paintFingerprint` records sizes, never
 * positions, and a scroll moves boxes without resizing them.
 */
/**
 * ⭐⭐⭐ ROUND 36 PHASE 3 – OPEN EVERY DISCLOSURE, AT EVERY WIDTH, BEFORE MEASURING ANYTHING.
 *
 * THIS CHANGES WHAT THE HARNESS CLAIMS, AND IT IS A STRENGTHENING RATHER THAN A LOOSENING. Phase 1
 * fingerprinted what a screen PAINTS on arrival. That was already one reading of «1 к 1» too narrow
 * for the owner's own sentence, which is about ACCESS:
 *
 *     «всё, что есть на мобиле, должно быть 1 к 1 ПО ДОСТУПНОСТИ быть и на других форматах»
 *
 * A control behind a disclosure is on the phone, and a wide screen that draws the same control
 * without the disclosure has neither added nor removed anything – it has spent a tap. Measuring the
 * first paint would call that a difference and be wrong; measuring the REACHABLE set calls it what
 * it is. It came up on Home's season ladder – the owner, 04.09: at 768 and up the ladder may be
 * drawn already open, «это ничему не противоречит» – and it is D9 in
 * docs/specs/responsive-decisions-2026-09.md.
 *
 * ⚠ IT DOES NOT WEAKEN THE CRITERION. A control that is genuinely absent at one width is still
 * absent after every disclosure is open, and still fails by name; a control that exists ONLY at
 * 1280 still fails from the other side. What it stops failing on is a screen that shows the same
 * things behind one fewer press.
 *
 * ⚠ AND IT IS A LOOP RATHER THAN ONE PASS, because opening one disclosure can reveal another (and
 * on Home the ellipsis chips come in pairs – above the window and below it – where pressing either
 * closes both). The cap is a guard against a control that toggles rather than opens: without it a
 * pair of buttons that re-collapse each other would spin here for ever instead of failing.
 */
async function openEveryDisclosure(page: Page): Promise<void> {
  for (let pass = 0; pass < 12; pass++) {
    const shut = page.locator('[aria-expanded="false"]:visible')
    const count = await shut.count()
    if (count === 0) return
    for (let i = count - 1; i >= 0; i--) {
      const control = shut.nth(i)
      // Re-checked rather than assumed: the press before this one may have re-rendered the row.
      if (await control.isVisible().catch(() => false)) {
        await control.click({ timeout: 2_000 }).catch(() => undefined)
      }
    }
  }
  throw new Error(
    'a disclosure on this screen never stayed open after 12 passes - it toggles rather than ' +
      'opens, and the fingerprint below would depend on how many times it was pressed',
  )
}

async function settleScreen(page: Page): Promise<void> {
  await openEveryDisclosure(page)
  await page.evaluate(async () => {
    const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()))
    for (let y = 0; y <= document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await frame()
    }
    window.scrollTo(0, 0)
    await frame()
  })
  // Web-first, so this is a retry rather than a sleep – `page.waitForTimeout` is banned in this
  // directory (e2e/README.md) and a guess about a fetch queue is exactly what it would be.
  await expect
    .poll(() => page.evaluate(() => Array.from(document.images).every((img) => img.complete)), {
      message: 'an image on this screen never finished loading, so its box cannot be measured',
    })
    .toBe(true)
}

async function fingerprint(page: Page): Promise<string[]> {
  await settleScreen(page)
  const [aria, paint] = await Promise.all([ariaFingerprint(page), paintFingerprint(page)])
  return [...aria, ...paint].sort()
}

/**
 * ⚠⚠ THE FLOOR THAT STOPS AN EMPTY MEASUREMENT PASSING. Four empty sets are equal, so a station
 * whose walk silently landed nowhere would be green forever – the exact failure mode round 35's
 * three blind tests had, and the one the spec's own warning is about.
 *
 * MEASURED, NOT GUESSED (CLAUDE.md invariant 5). Every station's fingerprint was counted on this
 * build at 375, and the ten came out:
 *
 *     Calendar 19 · Stats 20 · ThisWeek 25 · Kid 31 · More 32 · Money 35
 *     Season 46 · Home 52 · Trophies 59 · CoachMarket 60
 *
 * – identical at 768, 900 and 1280, which is the harness passing. The floor is set under the
 * smallest of them with room to spare: it is a tripwire for a walk that collapsed, not a pin on how
 * much any screen happens to draw, and a screen legitimately losing four controls should not have
 * to come here. The run is recorded in docs/rounds/round-36.md.
 */
const FINGERPRINT_FLOOR = 15

/** Everything in `a` that `b` does not also have, COUNTED – so losing one of three identical pills
 *  is a difference, not a rounding error. Rendered as `name ×2` when the count is what moved. */
function missingFrom(a: string[], b: string[]): string[] {
  const left = new Map<string, number>()
  for (const token of a) left.set(token, (left.get(token) ?? 0) + 1)
  for (const token of b) {
    const seen = left.get(token)
    if (seen) left.set(token, seen - 1)
  }
  return [...left.entries()]
    .filter(([, count]) => count > 0)
    .map(([token, count]) => (count === 1 ? token : `${token} ×${count}`))
    .sort()
}

// =================================================================================================
// THE WALK
// =================================================================================================

test.describe('every screen is 1 to 1 at 375, 768, 900 and 1280', () => {
  test('every screen in src/components/screens/ has a station in this file', () => {
    // ⚠ THE ASSERTION THAT KEEPS THE LIST DERIVED, and the same shape coverage-map.spec.ts uses on
    // the same directory. A screen added by a later phase with no route here fails BY FILENAME, so
    // "which screens does the parity harness cover" can never quietly become "the ones somebody
    // remembered". The reverse holds too: a station outliving its screen is a route to nowhere.
    expect(
      Object.keys(STATIONS).sort(),
      'e2e/parity.spec.ts and src/components/screens/ disagree. A new screen needs a station – ' +
        'the door a player uses to reach it, and an anchor that proves the walk arrived.',
    ).toEqual(SCREENS_ON_DISK)
  })

  for (const [screen, station] of Object.entries(STATIONS)) {
    test(`${screen} carries the same controls at every width`, async ({ page, careerAt }) => {
      await walkOneScreen(page, careerAt, screen, station)
    })
  }
})

// =================================================================================================
// ⭐⭐ ROUND 36 PHASE 4 – THE ROOMS BEHIND A CHAPTER, AND WHY THEY NEED A SECOND MAP
// =================================================================================================
//
// The map above is DERIVED from `src/components/screens/`, which is what stops it becoming «the
// screens somebody remembered». Its cost is that a screen file is the unit: `MoneyScreen.vue` has
// ONE station, and that station lands on the Spending chapter. Everything behind the other three
// chapter buttons – History, Bills and, since round 35, a two-level SHOP – is in the same file and
// therefore already «covered» as far as the derivation is concerned, while no fingerprint has ever
// been taken of it.
//
// ⚠⚠ AND PHASE 4 FOUND THAT OUT THE HONEST WAY: its own deliberate break had to be aimed at the
// chapter ROW, because a control hidden inside the shop would not have been seen at all. Phase 4
// rebuilt the shop's front door and its shelf rows for wide screens, so «1 к 1» on those two rooms
// is exactly the claim this round is about, and it was unmeasured.
//
// ⚠ SO THIS MAP IS HAND-WRITTEN AND SAYS SO. It cannot be derived – there is no directory of
// chapters – which is the property the map above has and this one has not. What keeps it honest is
// the same three mechanisms: an arrival anchor before anything is measured, the fingerprint floor,
// and one fresh career per station. A room that stops being reachable fails at its anchor.
const ROOMS: Record<string, Station> = {
  'MoneyScreen.vue – the shop’s front door': {
    visit: async (page) => {
      await page.getByRole('button', { name: /^Family budget/ }).click()
      await page
        .getByRole('group', { name: 'Which part of the budget' })
        .getByRole('button', { name: 'Shop' })
        .click()
    },
    // Round 35 #3's six category cards. `Invest` is the first of them and is a card, not a segment:
    // the shelf's own switcher is one press deeper, which is what makes this the FRONT DOOR.
    arrived: (page) => page.getByRole('button', { name: 'Invest' }).first(),
  },

  // ⭐⭐⭐ ROUND 36 PHASE 5 – A WEEK THAT STACKS, WHICH IS WHERE THE PAGER'S ARROWS LIVE.
  //
  // The owner ruled the week's horizontal listing into JavaScript and asked for arrows with it: «у
  // нас на всех устройствах могут появиться стрелки для листания в дополнение к JS свайпу.» Two new
  // controls is exactly what phase 3's D16 refused – on a desktop and on no other format they fail
  // «ничего нового по идее не должно появиться» BY NAME – so «на всех устройствах» is the whole of
  // what makes them legal, and this room is the machine check for it.
  //
  // ⚠⚠ THE STATION ABOVE COULD NOT SEE THEM. `SeasonScreen.vue`'s own station walks `pro`, whose
  // feed is three rows of ONE card (measured), and a week with one card has nothing to page. Four
  // fingerprints with no arrow in any of them are equal, and that is this harness passing while
  // proving nothing about the thing the phase added – the same hole phase 4 found behind Money's
  // chapter row. `sinking` draws two stacked weeks, so this walk carries four arrows at every width.
  'SeasonScreen.vue – a week that stacks several rungs': {
    career: 'sinking',
    visit: (page) => navTab(page, 'Season'),
    // ⚠⚠ PHASE 7 MOVED THIS ANCHOR OFF THE ARROW, AND HAD TO. It was the `Next` button – «so a pager
    // that stopped drawing fails HERE» – and after his ruling a pager that does not draw is the
    // CORRECT behaviour at 768, 900 and 1280, where a two-card week fits whole (measured: overflow
    // 273px at 375, 0 from 768 up). Anchoring on it would have failed the room at three of its four
    // widths for doing the right thing.
    // ⭐ So the anchor is the STACK itself – `.swipeable` is on a week's strip exactly when the week
    // offers more than one card – which is the property this room exists to walk. A week that stopped
    // stacking still fails here before any fingerprint is taken; a pager that stops drawing where it
    // SHOULD draw is caught by `the honest half…` below, which is a stronger check than an anchor.
    arrived: (page) => page.locator('.week-row > .week-stack.swipeable').first(),
  },

  // ⭐⭐⭐ ROUND 36 ITEM 17 – THE LIVE MATCH, AND IT HAD NEVER BEEN FINGERPRINTED AT ALL.
  //
  // ⚠⚠ THE HOLE, FOUND THE SAME HONEST WAY AS THE OTHER TWO IN THIS MAP. The station map above is
  // derived from `src/components/screens/`, and `MatchViewer.vue` is not in that directory – it is
  // mounted by FOUR callers (TournamentFlow, PracticeFlow, MatchReplay and Season's sandbox), none of
  // which is a screen file. So the busiest surface in the app – the one the owner watches a match on
  // – was outside the harness while the round's own rule was «всё, что есть на мобиле, должно быть
  // 1 к 1». It matters most on exactly this screen: his item 17 rebuilds it for tablet and desktop
  // and his own warning with it – «ВАЖНО: наши контролы скорости и моментов остаются с нами, дизайн
  // их забыл» – and a speed plate dropped at 1280 was not a thing this file could have said.
  //
  // ⭐ WHAT IT CARRIES, and it is the whole of his warning as a machine check: the VIEW plate
  // (`Every point` / `Key points only`), the SPEED plate (`Normal speed` / `Double speed` /
  // `Quadruple speed`), the shout picker and its button, and `Skip to the result`. Nine controls the
  // frames do not draw, held at 375, 768, 900 and 1280 by name.
  //
  // ⚠ `junior` RATHER THAN THE DEFAULT `pro`, for the same reason phase 5's stacked week is walked on
  // `sinking`: this room needs a career one week from a tournament it can enter, which is what the
  // junior fixture boots holding. `pro` boots with nothing entered.
  'MatchViewer.vue – the live match, on the court': {
    career: 'junior',
    // See `Station.park`. A takeover covers the tab bar, so the way back is a new document.
    //
    // ⚠ THE WORDMARK IS PART OF THE ROUTE AND NOT A NUISANCE. «The splash shows on EVERY launch and
    // waits for `game.init()` to settle» (careerAt.ts, at its own click on it), so pressing it is
    // both the way in and the wait for the store to have finished asking the worker for its careers –
    // which is exactly why this is a web-first click and not a poll.
    park: async (page) => {
      await page.reload()
      await page.getByRole('button', { name: 'Tap to start' }).click()
      await answerOpeningKnock(page)
    },
    visit: async (page) => {
      // ⚠⚠ THE SCREEN BEHIND IS OPENED BEFORE IT IS COVERED, AND THAT IS NOT A CONVENIENCE. The
      // takeover is a layer over Home, not a replacement for it: Home stays mounted, visible to the
      // accessibility tree and therefore inside the fingerprint. `settleScreen` opens every
      // disclosure before measuring, and Home's season ladder is a disclosure – one that is drawn
      // already open from 768 up (D9) and shut at 375. Left to `settleScreen` it would be pressed
      // THROUGH a blocking overlay, which cannot be done: the click is intercepted, the chip stays
      // shut, and `openEveryDisclosure` throws after twelve passes. Pressing it while it is still
      // reachable is both the honest reading and the only one that works.
      await openEveryDisclosure(page)
      // The week button ticks the world into the tournament reveal, and only the FIRST width does
      // it: the pending tournament is world state, so every later reload lands straight on the
      // splash with the same bracket and the same first-round pairing.
      const begin = page.getByRole('button', { name: 'Begin', exact: true })
      if (!(await begin.isVisible().catch(() => false))) await weekButton(page).click()
      await expect(begin).toBeVisible()
      await begin.click()
      // The pre-match card's two doors. `Watch match` is the one that opens the court; `Skip` would
      // resolve it and land on a box score.
      await page.getByRole('button', { name: 'Watch match' }).click()
    },
    // ⚠ THE ANCHOR IS A CONTROL OF THE VIEWER'S OWN, and deliberately not the court: `.mv-court` is a
    // CSS class, and this file's one rule is that arrival is proved by role and accessible name. It
    // is also the one control on the screen that no other surface in the app draws.
    arrived: (page) => page.getByRole('button', { name: 'Skip to the result' }),
  },

  'MoneyScreen.vue – a shelf inside the shop': {
    visit: async (page) => {
      await page.getByRole('button', { name: /^Family budget/ }).click()
      await page
        .getByRole('group', { name: 'Which part of the budget' })
        .getByRole('button', { name: 'Shop' })
        .click()
      await page.getByRole('button', { name: 'Cars' }).first().click()
    },
    arrived: (page) => page.getByRole('group', { name: 'Which part of the shelf' }),
  },
}

test.describe('the rooms behind a chapter are 1 to 1 too', () => {
  for (const [room, station] of Object.entries(ROOMS)) {
    test(`${room} carries the same controls at every width`, async ({ page, careerAt }) => {
      await walkOneScreen(page, careerAt, room, station)
    })
  }
})

// =================================================================================================
// ⭐⭐⭐ ROUND 36 PHASE 6 – THE EXEMPTION'S OWN GUARDS
// =================================================================================================
//
// Four tests, and they are the reason phase 4 refused to ship the exemption on its own: a guard
// fitted to nothing passes over an empty set forever, which is this file's «four empty sets are
// equal» warning wearing a green tick. Each of these has been SEEN to redden – the mutations and
// what they printed are in docs/rounds/round-36.md under phase 6.
//
// ⚠ THEY WALK ONE SCREEN AND THAT IS ENOUGH, because the dashboard is the SHELL's: `App.vue` mounts
// it inside the single `nav.tab-bar` the whole app has, so «одинаковые на всех страницах» is a
// property of where it lives rather than of ten screens agreeing. The fourth test measures that
// claim across every station rather than trusting it.

/** The roles a dashboard card may never carry. His constraint, in his own words: «никаких контролов
 *  новых они не поставят, это просто шорт-кат с информацией из внутренних разделов.» */
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'slider',
  'spinbutton',
  'tab',
  'tablist',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'treeitem',
])

/** Every role the region's accessibility tree carries, unfiltered – a wider net than the
 *  fingerprint's, because this arm is asking «is there a CONTROL here» and not «what is compared». */
async function rolesInside(page: Page): Promise<string[]> {
  const yaml = await page.locator(RAIL_DASHBOARD).ariaSnapshot()
  const roles: string[] = []
  for (const line of yaml.split('\n')) {
    const match = /^\s*-\s+([a-z][a-z-]*)(?:\s+"((?:[^"\\]|\\.)*)")?/.exec(line)
    if (match) roles.push(match[2] === undefined ? match[1] : `${match[1]} "${match[2]}"`)
  }
  return roles
}

/** Boot `pro` and clear the two doorways every seeded save wakes up holding. */
async function boot(page: Page, careerAt: CareerAt): Promise<void> {
  await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
  await careerAt('pro')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
}

/**
 * ENTER THE SOONEST TOURNAMENT SHE CAN, WHICH IS WHAT MAKES THE THIRD CARD EXIST.
 *
 * ⚠⚠ MEASURED, AND IT IS WHY ONE ARM BELOW IS SEPARATE FROM THE OTHERS. `pro` boots with NOTHING
 * entered – «Nothing entered yet» is the first thing `tournament-entry.spec.ts` asserts about it – so
 * the dashboard draws TWO cards and the «My entries» card, the one whose figures are a LIST rather
 * than a single number, is never seen by a walk on this fixture. Ten fingerprints that never
 * contained it are equal, which is this file's own «four empty sets are equal» failure one level up.
 *
 * ⚠⚠ AND ENTERING CANNOT SIMPLY BE FOLDED INTO `boot`, WHICH WAS TRIED AND MEASURED. An entry
 * changes what Home's Next-tournament plate OPENS (round 31 #1: the plate carries
 * `entry: 'tournament'`, and with something entered `ThisWeekScreen` draws the tournament instead of
 * its own «This week» heading), so `STATIONS['ThisWeekScreen.vue']`'s arrival anchor stops holding –
 * exactly the failure a walk on the `junior` fixture produces, for exactly the same reason. **The
 * station map is calibrated for a `pro` with nothing entered**, which is worth writing down: it is a
 * real property of the map and not of this phase.
 *
 * So the ten-station corpus walk stays on the career the map is built for, and the third card gets
 * its own arm, which needs no station map at all – it compares the rail's list against the strip it
 * is a shortcut TO, on the one screen that owns it.
 */
async function enterOneTournament(page: Page): Promise<void> {
  // The soonest event she can enter – the top card of a feed ordered by week, which is the one a
  // player presses. Positional for `tournament-entry.spec.ts`'s reason: WHICH event a fixture offers
  // is the generator's business, and pinning one by name makes the test a hostage to the calendar.
  await navTab(page, 'Season')
  const enter = page.getByRole('button', { name: /^Enter the / }).first()
  await expect(enter, '`pro` boots with no enterable event, so nothing here can be entered').toBeVisible()
  await enter.click()
  await enterConfirmButton(page).click()
  // The engine took it, so the strip the rail card shortcuts to is now on the screen. Asserted here
  // rather than assumed: a refused entry would leave the arm below measuring an absent card and
  // passing over an empty set.
  await expect(
    page.getByRole('heading', { name: 'My entries' }).first(),
    'the entry was not taken, so the third rail card has nothing to shortcut to',
  ).toBeVisible()
}

/** Home at one width, settled – the state every arm below measures from. */
async function homeAt(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
  await park(page)
  await settleScreen(page)
}

test.describe("the desktop rail's dashboard is exempt – and the exemption is bounded", () => {
  test('the boundary is ONE container, inside the rail, and it is desktop-only', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)

    // ⚠ THE REGION IS IN THE DOM AT EVERY WIDTH – `display: none` is what makes it desktop-only, not
    // a `v-if` – so «desktop-only» is measured as «has no box», which is the question a player asks.
    for (const width of [BASE_WIDTH, 768, 900]) {
      await homeAt(page, width)
      await expect(
        page.locator(RAIL_DASHBOARD),
        `the dashboard has a box at ${width}px, and it is his desktop-only feature`,
      ).toBeHidden()
    }

    await homeAt(page, 1280)
    const region = page.locator(RAIL_DASHBOARD)
    await expect(region, 'the dashboard is on screen at 1280').toBeVisible()

    // ⭐ EXACTLY ONE, AND NOTHING ELSE IN THE APP IS EXEMPT. A second block carrying the class – in
    // the rail or anywhere else – would be a second hole, so the count is asserted rather than the
    // presence. `#app > nav.tab-bar >` is what ties the one region to the app's own navigation.
    expect(await page.locator('.rail-dash').count(), 'one dashboard in the document').toBe(1)
    expect(await region.count(), 'and it is the one inside the rail').toBe(1)

    // ⚠ ANTI-VACUITY, AND IT IS THE WHOLE REASON THIS PHASE SHIPS THE CARDS AND THE EXEMPTION
    // TOGETHER: an exemption over an empty region is a guard fitted to nothing, and it would pass
    // for ever. So the region is asserted to hold HIS THREE CARDS, by their titles - the set he
    // named, «IN THE ACCOUNT, COACHING BUDGET, MY ENTRIES».
    // ⚠ RE-AIMED 16.09 BY ROUND 42 #23 – the second card is «TEAM BUDGET» now, and the rename is the
    // owner's own proposed wording («переименовать в Week budget или team budget»), read by both
    // surfaces off `TEAM_BUDGET_LABEL`. The DECLARATION moved; the claim did not - this is still the
    // named set, and a card appearing or leaving still reddens here by name.
    // ⚠ TWO AND NOT THREE, AND IT IS MEASURED RATHER THAN LOOSENED. `pro` boots with nothing
    // entered, and «My entries» is silent then – exactly as the Season strip it shortcuts to is
    // (`v-if="myEntries.length"`). The third card is asserted in its own arm below, on a career that
    // has just entered something; asserting `>= 2` here instead would be the loose version of this
    // line and would stop naming the set.
    expect(
      await page.locator(`${RAIL_DASHBOARD} .rail-dash-title`).allInnerTexts(),
      'the exempt region does not hold the cards this career draws',
    ).toEqual(['IN THE ACCOUNT', 'TEAM BUDGET'])
  })

  test('the exempt region holds no control – it is information, and that is his constraint', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)
    await homeAt(page, 1280)
    await expect(page.locator(RAIL_DASHBOARD)).toBeVisible()

    // ⭐⭐ GUARD ONE, AND IT IS THE ONE THAT STOPS THE EXEMPTION GROWING. A later phase that parks a
    // control inside this region would be moving it OUT of the parity check, which is precisely what
    // the boundary-by-container is for. Two nets, because they catch different things: the
    // accessibility tree sees `role="button"` on a div and an `<a href>`, and the DOM query sees a
    // focus stop that carries no role at all.
    const roles = await rolesInside(page)
    expect(
      roles.filter((r) => INTERACTIVE_ROLES.has(r.split(' ')[0])),
      'a control is inside the rail dashboard, which is the ONE region parity does not check. It ' +
        'is a shortcut to information, by his own ruling - so either it is not a control, or it ' +
        'does not belong here.',
    ).toEqual([])

    const focusable = await page.evaluate((selector) => {
      const root = document.querySelector(selector)
      if (!root) return ['<the dashboard is not on the page>']
      const query =
        'a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,' +
        '[tabindex],[contenteditable],[onclick],[role]'
      return Array.from(root.querySelectorAll(query)).map(
        (el) => `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : ''}`,
      )
    }, RAIL_DASHBOARD)
    expect(focusable, 'nothing in the rail dashboard is a focus stop or carries an explicit role').toEqual(
      [],
    )

    // ⭐ AND AGAIN WITH THE THIRD CARD UP, because «My entries» is the one card whose body is a LIST
    // and a list is where a control usually creeps in (a chip that opens the event, a withdraw
    // affordance). Two cards proving nothing about the third is the same hole as a walk that never
    // reaches a state.
    await homeAt(page, BASE_WIDTH)
    await enterOneTournament(page)
    await homeAt(page, 1280)
    expect(
      await page.locator(`${RAIL_DASHBOARD} .rail-dash-title`).allInnerTexts(),
      'the third card did not appear, so this second pass measured the first two again',
    // ⚠ RE-AIMED 16.09 BY ROUND 42 #23, with the arm above and for its reason: the second card's
    // title is «TEAM BUDGET» now. The third card is still what this pass exists to reach.
    ).toEqual(['IN THE ACCOUNT', 'TEAM BUDGET', 'MY ENTRIES'])
    expect(
      (await rolesInside(page)).filter((r) => INTERACTIVE_ROLES.has(r.split(' ')[0])),
      'a control is inside the rail dashboard once an entry is on the card',
    ).toEqual([])
  })

  test("the rail's NAVIGATION is not exempt, and the exemption is doing real work", async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)

    await homeAt(page, BASE_WIDTH)
    const phone = await ariaTokensOf(page.locator('body'))

    await homeAt(page, 1280)
    const desktopRaw = await ariaTokensOf(page.locator('body'))
    const exempt = await railDashboardTokens(page)

    // ⭐ PART 1 – ONLY THE DASHBOARD IS EXEMPT. The five tabs are OUTSIDE the region, so they are
    // still in the fingerprint at 1280 and still fail by name if one goes. Asserted against the
    // SUBTRACTED list, which is what the walk above really compares.
    const desktop = subtractOnce(desktopRaw, exempt)
    for (const tab of ['Season', 'Calendar', 'Home', 'Stats', 'Trophies']) {
      expect(desktop, `the rail's ${tab} tab is still inside the parity check`).toContain(
        `button "${tab}"`,
      )
    }
    expect(exempt.some((t) => /^button /.test(t)), 'no tab was swallowed by the exemption').toBe(false)

    // ⭐⭐ AND THE ANTI-VACUITY ARM PHASE 4 ASKED FOR, STATED AS AN EQUALITY. Without the
    // subtraction the two widths DISAGREE, and what they disagree about is exactly the dashboard –
    // nothing more and nothing less. So this one assertion says three things at once: the exemption
    // is load-bearing (the day it stops being, this line reddens), it is not hiding anything else,
    // and the rest of Home really is 1:1 on its own.
    expect(exempt.length, 'the dashboard contributes nothing, so the exemption guards an empty set').toBeGreaterThan(0)
    expect(
      missingFrom(desktopRaw, phone),
      'the ONLY thing at 1280 that is not on the phone must be the rail dashboard itself',
    ).toEqual(missingFrom(exempt, []))
    expect(missingFrom(phone, desktopRaw), 'and nothing on the phone is missing at 1280').toEqual([])
  })

  test('every figure the rail shows exists somewhere at 375', async ({ page, careerAt }) => {
    await boot(page, careerAt)
    await homeAt(page, 1280)
    await expect(page.locator(RAIL_DASHBOARD)).toBeVisible()

    // ⭐⭐⭐ GUARD TWO – THE HONEST HALF OF HIS CRITERION, KEPT. «Ничего нового не должно появиться»
    // is relaxed for the rail because a card is a SHORTCUT: a balance beside Season is a figure that
    // lives on Home and on Money. That argument only holds while the figure really does live
    // somewhere the phone can reach. A number the phone cannot reach AT ALL is a new fact on a
    // desktop, and it reddens here.
    const shown = await page.evaluate((selector) => {
      const root = document.querySelector(selector)
      if (!root) return null
      const text = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      const titles = Array.from(root.querySelectorAll('.rail-dash-title')).map(text)
      const figures = Array.from(root.querySelectorAll('.rail-dash-figure')).map(text)
      // ⭐⭐ ROUND 42 #23 – A THIRD DECLARED KIND OF LINE, AND IT IS DECLARED SO IT CAN BE CHECKED.
      // «в coaching budget я просил отражать всех активных специалистов» put a row per FILLED SEAT
      // on the Team-budget card – `Coach · $389 /wk`, and a Masseur and a Psychologist line beside
      // it once those seats are taken. Each row is two leaf spans, so both fell out of the stray net
      // below the day the item shipped.
      // ⚠⚠ THE REPAIR IS NOT «IGNORE `.budget-seat`». Waving the rows through the net would hand
      // them the exact dodge the net exists to stop - a number in an undeclared span, skipping the
      // «exists at 375» check at the bottom of this test. So they are DECLARED here, one list for
      // the seat's name and one for its weekly figure, and both go through that check with the
      // card figures. ⚠ THEY ARE DELIBERATELY NOT FOLDED INTO `figures`: the count assertion below
      // holds `titles.length` against the number of CARDS, and a payroll row is not a card.
      const seatNames = Array.from(root.querySelectorAll('.budget-seat .seat-name')).map(text)
      const seatCosts = Array.from(root.querySelectorAll('.budget-seat .seat-cost')).map(text)
      // ⚠ AND NOTHING MAY HIDE FROM THIS LIST. Every leaf in the region that carries text must be a
      // declared title, a declared figure or a declared seat line - otherwise a card could print a
      // number in an undeclared span and skip the check below, which is the same dodge the container
      // boundary exists to stop one level up.
      const strays = Array.from(root.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 && text(el) !== '')
        .filter((el) => !el.closest('.rail-dash-title, .rail-dash-figure, .budget-seat'))
        .map((el) => `${el.tagName.toLowerCase()}: ${text(el)}`)
      return { titles, figures, seatNames, seatCosts, strays }
    }, RAIL_DASHBOARD)

    expect(shown, 'the dashboard was not on the page, so this measured nothing').not.toBeNull()
    expect(
      shown!.strays,
      'a line in the rail dashboard is neither a declared title nor a declared figure, so it ' +
        'would slip past the «every figure exists at 375» check below',
    ).toEqual([])
    // Anti-vacuity, in the same shape as FINGERPRINT_FLOOR: an empty list of figures passes every
    // membership test ever written.
    expect(shown!.figures.length, 'the dashboard shows no figure at all').toBeGreaterThanOrEqual(2)
    expect(
      shown!.titles.length,
      'a card in the dashboard carries no title, so the region is not the set it claims to be',
    ).toBe(await page.locator(`${RAIL_DASHBOARD} .rail-dash-card`).count())
    // ⚠ AND THE SEAT LIST IS ANTI-VACUOUS TOO, for the same reason as every other floor in this
    // file: an empty payroll would satisfy every membership test below. `pro` has a coach – measured
    // at head, one seat, `Coach · $389 /wk` – so a career that walked in here with nobody hired
    // would mean round 42 #23's own rows are unmeasured rather than passing.
    expect(
      shown!.seatCosts.length,
      'the Team budget card lists no filled seat, so round 42 #23`s rows are not being checked at all',
    ).toBeGreaterThan(0)
    expect(shown!.seatNames.length, 'a seat row shows a figure with no name beside it').toBe(
      shown!.seatCosts.length,
    )

    // Now the phone, screen by screen, through the doors a player uses. Every disclosure is opened
    // on the way (`settleScreen`), so «reachable» here means the same thing it means in the walk.
    const corpus = new Map<string, string>()
    for (const [screen, station] of Object.entries(STATIONS)) {
      await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
      await park(page)
      await station.visit(page)
      await expect(
        station.arrived(page),
        `${screen} at ${BASE_WIDTH}px - the walk did not arrive, so its text proves nothing`,
      ).toBeVisible()
      await settleScreen(page)
      corpus.set(
        screen,
        (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim(),
      )
    }
    const total = [...corpus.values()].join(' ')
    expect(total.length, 'the phone walk collected almost no text, so it can prove nothing').toBeGreaterThan(
      2_000,
    )

    // ⭐⭐ ROUND 42 #23's ROWS GO THROUGH THE SAME DOOR AS THE CARD FIGURES, and this is the half
    // that makes declaring them a strengthening rather than an exemption. MEASURED at head, on the
    // phone, through the doors a player uses: `Coach` and `$389 /wk` are both on `CoachMarketScreen`
    // at 375 – the market's own meter draws `.budget-seat` from the very same computed the rail
    // reads (`composables/coachingBudget.ts`), which is why the shortcut argument holds for them.
    // ⚠ EACH PART SEPARATELY AND NOT THE ROW'S WHOLE TEXT: the two spans are laid out as a flex row,
    // so the phone's `innerText` puts whitespace between them where `textContent` puts none, and
    // comparing the concatenation would fail on the RENDERING rather than on reachability.
    const unreachable = [...shown!.figures, ...shown!.seatNames, ...shown!.seatCosts].filter(
      (figure) => !total.includes(figure),
    )
    expect(
      unreachable,
      'the rail shows these figures on a desktop and the phone cannot reach them on any screen. ' +
        'A rail card is a SHORTCUT to something that already exists; a number that exists nowhere ' +
        'else is a new fact on the desktop, which is the half of «1 к 1» the exemption does NOT relax.',
    ).toEqual([])
  })

  test("«My entries» shows the Season strip's own entries, and the phone has every one", async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐ THE THIRD CARD'S OWN ARM, and it makes a STRONGER claim than «the figure exists somewhere»:
    // the rail's list is the Season strip's list, string for string. That is what a SHORTCUT means,
    // and it is the claim that would have caught the defect this phase's composable exists to
    // prevent - two surfaces filtering «she is entered» their own way and disagreeing on a desktop,
    // side by side, at the same moment.
    await boot(page, careerAt)
    await enterOneTournament(page)

    // The strip, on the phone, on the screen that owns it.
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await park(page)
    await navTab(page, 'Season')
    await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()
    await settleScreen(page)
    const strip = (await page.locator('.entries-strip .pill').allInnerTexts()).map((t) =>
      t.replace(/\s+/g, ' ').trim(),
    )
    expect(strip.length, 'the Season strip drew no entry, so there is nothing to compare').toBeGreaterThan(
      0,
    )
    // ⚠ AND THE STRIP IS INVISIBLE TO THE RAIL AT THIS WIDTH – the dashboard is `display: none` below
    // 1024 – so this really is the screen's own rendering and not the card's, read twice.
    await expect(page.locator(RAIL_DASHBOARD)).toBeHidden()

    // The card, on the desktop, on a page that is not Season at all – which is the whole of «карточки
    // сквозные … на всех страницах».
    await homeAt(page, 1280)
    const card = (
      await page.locator(`${RAIL_DASHBOARD} .rail-dash-entry`).allInnerTexts()
    ).map((t) => t.replace(/\s+/g, ' ').trim())
    expect(
      card,
      'the rail card and the Season strip disagree about what she is entered for. They read one ' +
        'predicate (`composables/seasonEntries.ts`) precisely so they cannot.',
    ).toEqual(strip)
  })

  test('the same set of cards is on every page – «карточки сквозные, одинаковые»', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)
    const seen = new Map<string, string>()
    for (const [screen, station] of Object.entries(STATIONS)) {
      await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT })
      await park(page)
      await station.visit(page)
      await expect(station.arrived(page), `${screen} at 1280px - the walk did not arrive`).toBeVisible()
      await expect(page.locator(RAIL_DASHBOARD)).toBeVisible()
      seen.set(screen, (await page.locator(RAIL_DASHBOARD).innerText()).replace(/\s+/g, ' ').trim())
    }
    const [first, ...rest] = [...seen.entries()]
    expect(first[1].length, 'the dashboard is empty, so ten empty strings would be equal').toBeGreaterThan(
      10,
    )
    for (const [screen, text] of rest) {
      expect(text, `the rail dashboard differs on ${screen} - it is the shell's, and the same set ` +
        'lives in the strip on every page').toBe(first[1])
    }
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 36 SECOND PASS, P2-6 – THE IDENTITY BLOCK'S EXEMPTION, AND ITS OWN FOUR GUARDS
// =================================================================================================
//
// His ruling, 05.09.2026, after playing the review wave: «и аватар с текущей позицией и рангом (так
// же, как и все остальные плашки) на десктоп в боковом меню живут на всех страницах неизменно».
//
// Same shape as the two above, because a bounded exemption is this round's standard: only the block
// is exempt, the boundary is a place, the honest half is asserted, and the claim is in words at the
// top of the file. The `⭐ ACCEPTED` mutations for these four are in the P2-b scratch log.

/** The controls the block is allowed to hold, as accessible names. ⚠ THIS IS NOT THE BOUNDARY – the
 *  boundary is the selector list, which is a PLACE. This is the anti-vacuity list the arms below
 *  compare against, so «the exemption swallowed something» fails by name rather than by count. */
const IDENTITY_CONTROLS = ['Open her profile', 'How ranking points work']

async function identityNamesAt(page: Page, width: number): Promise<string[]> {
  await homeAt(page, width)
  return (await identityTokens(page)).sort()
}

test.describe('her identity block is exempt – and the exemption is bounded', () => {
  test('the boundary is her block in the RAIL and her block on the PHOTOGRAPH, and nothing else', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)

    // ⚠ THE RAIL'S BLOCK IS IN THE DOM AT EVERY WIDTH – `display: none` is what makes it
    // desktop-only, exactly as with the dashboard – so «desktop-only» is measured as «has no box».
    for (const width of [BASE_WIDTH, 768, 900]) {
      await homeAt(page, width)
      await expect(
        page.locator(RAIL_IDENTITY),
        `the rail's identity block has a box at ${width}px, and it is a desktop block`,
      ).toBeHidden()
      await expect(
        page.locator('#app .diary-head > .diary-avatar-btn'),
        `her face left the photograph at ${width}px, which is where a player taps it`,
      ).toBeVisible()
    }

    await homeAt(page, 1280)
    await expect(page.locator(RAIL_IDENTITY), 'the block is on screen at 1280').toBeVisible()
    await expect(
      page.locator('#app .diary-head > .diary-avatar-btn'),
      'the photograph kept a second face at 1280 – exactly one of the two is ever on screen',
    ).toBeHidden()

    // ⭐ EXACTLY ONE, AND IT IS THE ONE INSIDE THE RAIL. A second `.rail-id` anywhere would be a
    // second hole, so the count is asserted rather than the presence.
    expect(await page.locator('.rail-id').count(), 'one identity block in the document').toBe(1)
    expect(await page.locator(RAIL_IDENTITY).count(), 'and it is the one inside the rail').toBe(1)
  })

  test('the exempt region holds ONLY her identity block – her face, the week and her rank', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)
    await homeAt(page, 1280)

    // ⭐⭐ THE GUARD THAT STOPS THE EXEMPTION GROWING. A later phase parking a control in the rail's
    // identity block would be moving it OUT of the parity check, which is what a boundary-by-place
    // is for. Named rather than counted, so the failure says which control appeared.
    const inside = await page.evaluate((selector) => {
      const root = document.querySelector(selector)
      if (!root) return ['<the block is not on the page>']
      const query =
        'a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,' +
        '[tabindex],[contenteditable],[onclick],[role]'
      return Array.from(root.querySelectorAll(query)).map(
        (el) => el.getAttribute('aria-label') ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      )
    }, RAIL_IDENTITY)
    // The callout is a one-time control and this career may or may not still be holding it, so it is
    // allowed and not required; anything ELSE is a control that has been taken out of the check.
    const stray = inside.filter(
      (name) => !IDENTITY_CONTROLS.includes(name) && name !== 'Tap the photo – her page lives here',
    )
    expect(
      stray,
      'a control that is not part of her identity block is inside the ONE region P2-6 exempts. ' +
        'The block is her face, the week beside it and her rank chip - so either it belongs ' +
        'somewhere else, or the exemption has quietly grown.',
    ).toEqual([])

    // …and the two that MUST be there are, or this guards an empty set.
    for (const name of IDENTITY_CONTROLS) {
      expect(inside, `the rail's block does not hold «${name}», so the exemption guards nothing`).toContain(
        name,
      )
    }
  })

  test('⭐⭐ THE HONEST HALF – the block MOVED, nothing was lost: the same controls at 375 and 1280', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)

    // ⚠⚠ WITHOUT THIS ARM THE EXEMPTION WOULD READ «her face and her rank may differ between a phone
    // and a desktop», which is not what he ruled. What he ruled is that the block LIVES in the rail
    // on the desktop – the same block, with the same controls, that the photograph carries on a
    // phone. So the two exempt sets are compared to each other, name for name.
    const phone = await identityNamesAt(page, BASE_WIDTH)
    const desktop = await identityNamesAt(page, 1280)
    expect(phone.length, 'nothing is exempt at 375, so this compares two empty sets').toBeGreaterThan(1)
    expect(
      desktop,
      'her identity block is not the same set of controls in the rail as it is on the photograph. ' +
        'The exemption is «the block moved»; a control on one side and not the other is a control ' +
        'lost, and that is what «1 к 1» forbids.',
    ).toEqual(phone)
  })

  test('the block is on EVERY screen at 1280 and on none of them at 375 – which is what it buys', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)

    // ⭐⭐⭐ THE PROPERTY HE ASKED FOR, MEASURED ON ALL TEN SCREENS RATHER THAN TRUSTED. Before this
    // item the block was HomeScreen's and teleported, so on Season, Calendar and Stats at 1280
    // `.rail-id` measured an EMPTY 171x20 slot while the dashboard tiles beside it were 171x218.
    // Same walk as «the same set of cards is on every page», for the same reason: it is a claim
    // about where the block LIVES, and ten screens agreeing is the only way to see it.
    const seen = new Map<string, string>()
    for (const [screen, station] of Object.entries(STATIONS)) {
      await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT })
      await park(page)
      await station.visit(page)
      await expect(station.arrived(page), `${screen} at 1280px – the walk did not arrive`).toBeVisible()
      await expect(
        page.locator(RAIL_IDENTITY),
        `her identity block is not on ${screen} at 1280 – it is chrome now, on every page`,
      ).toBeVisible()
      for (const name of IDENTITY_CONTROLS) {
        await expect(
          page.locator(RAIL_IDENTITY).getByRole('button', { name, exact: true }),
          `«${name}» is not in the rail on ${screen} at 1280`,
        ).toBeVisible()
      }
      // ⚠ THE ONE-TIME CALLOUT IS SUBTRACTED FROM THE COMPARISON, AND IT IS THE ONLY THING THAT IS.
      // It is dismissed by the first tap on her face – and the walk to `KidScreen` IS that tap – so
      // a career that has opened her page once legitimately shows a shorter block afterwards.
      // Comparing it would be asserting that a one-time hint is permanent, which is the opposite of
      // what it is. Everything else in the block is compared verbatim.
      seen.set(
        screen,
        (await page.locator(RAIL_IDENTITY).innerText())
          .replace('Tap the photo – her page lives here', '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
    }
    const [first, ...rest] = [...seen.entries()]
    expect(first[1].length, 'the block is empty, so ten empty strings would be equal').toBeGreaterThan(10)
    for (const [screen, text] of rest) {
      expect(
        text,
        `the identity block differs on ${screen} – «неизменно» is his own word, and it is the ` +
          'shell that draws it, from one composable',
      ).toBe(first[1])
    }

    // …and the other half of «desktop-only», on a screen that is not Home: at 375 the bottom bar
    // never grows a face.
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await park(page)
    await navTab(page, 'Stats')
    await expect(page.getByRole('heading', { name: 'Stats', level: 2 })).toBeVisible()
    await expect(
      page.locator(RAIL_IDENTITY),
      'the identity block has a box at 375 on Stats, so the phone gained a control',
    ).toBeHidden()
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 36 PHASE 7 – THE ARROWS' EXEMPTION, AND ITS OWN FOUR GUARDS
// =================================================================================================
//
// His ruling, 04.09, after playing the phase-5 build: «на десктопе неделя из двух карточек показывает
// две серые стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть
// что листать.»
//
// ⚠⚠ AND `weekPager.ts` ARGUED THE OPPOSITE IN ITS OWN HEADER, CORRECTLY. Which weeks overflow
// depends on the WIDTH, so hiding an idle pager makes it a control present at 375 and absent at 1280
// – which is what this file fails by name. D35 put that price to him as «a stated parity exemption»
// and he took it. These four are the shape phase 6 used for the rail, applied to the arrows.
//
// ⚠ THEY WALK `sinking` AND NOT `pro`, for D36's reason: `pro`'s Season feed is three rows of ONE
// card, so it draws no pager at all and four fingerprints with no arrow in any of them are equal.
// `sinking` draws two stacked weeks – four arrows at 375, none from 768 up.

/** Every week row on the Season screen as the browser actually measures it – the overflow the ruling
 *  turns on, and the arrows it turns on and off. Read from the live boxes, never from the stylesheet:
 *  a card width of `88%` / `calc(50% - 6px)` / `calc(44% - 6px)` is exactly the thing that must not
 *  be re-derived here, or this arm would be asserting the rule against a copy of itself. */
async function weekRowsAt(page: Page): Promise<
  { cards: number; overflow: number; arrows: string[]; pagers: number }[]
> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.week-row')).map((row) => {
      const strip = row.querySelector('.week-stack')
      return {
        cards: row.querySelectorAll('.event-card').length,
        overflow: strip ? strip.scrollWidth - strip.clientWidth : 0,
        // ⚠⚠ ON THE SCREEN, NOT IN THE DOM, AND THAT IS A CORRECTION A MUTATION FORCED. The first
        // draft counted `querySelectorAll('.week-arrow')` and would have passed a break that hid the
        // arrows with `display: none` – which is the shape phase 5's own deliberate break took, and
        // the shape a later media query would take. The rest of this file measures visibility rather
        // than declaring it (`paintFingerprint`, and the aria snapshot's own filter); so does this.
        arrows: Array.from(row.querySelectorAll('.week-arrow'))
          .filter((a) => a.getClientRects().length > 0)
          .map((a) => a.getAttribute('aria-label') ?? '<unnamed>'),
        pagers: row.querySelectorAll('.week-pager').length,
      }
    }),
  )
}

/** `sinking`'s Season feed at one width, settled – the state every arm below measures from. */
async function seasonAt(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
  await park(page)
  await navTab(page, 'Season')
  await expect(
    page.getByRole('heading', { name: 'Season Planner' }),
    `the walk did not arrive on Season at ${width}px`,
  ).toBeVisible()
  await settleScreen(page)
  // ⚠ THE PAGER IS DRAWN FROM A MEASUREMENT, NOT FROM A PROP, so the render that shows or hides an
  // arrow is one ResizeObserver callback behind the resize. This waits for the reading to STOP
  // MOVING – the same answer twice in a row – rather than for a fixed sleep, which is what makes
  // these arms deterministic on a slow machine.
  //
  // ⚠⚠ AND IT DELIBERATELY DOES NOT WAIT FOR THE RULE TO HOLD, which the first draft did. Polling
  // until «overflow ⟺ arrows» is true makes the helper assert the very thing the arms below are
  // there to measure: a break then fails HERE, as a timeout, with a message about settling instead
  // of a message naming the week that lost its arrows. Measured – mutation B printed exactly that.
  let previous = ''
  await expect
    .poll(
      async () => {
        const now = JSON.stringify(await weekRowsAt(page))
        const stable = now === previous
        previous = now
        return stable
      },
      { message: `the Season feed at ${width}px never stopped re-measuring itself` },
    )
    .toBe(true)
}

test.describe("the week pager's arrows are exempt – and the exemption is bounded", () => {
  test('the boundary is a CONTAINER, and it holds NOTHING but the two arrows', async ({
    page,
    careerAt,
  }) => {
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await careerAt('sinking')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await seasonAt(page, BASE_WIDTH)

    // ⚠ ANTI-VACUITY FIRST. Every assertion below is over the set of pagers on the screen, and an
    // empty set satisfies all of them for ever. 375 is the width the fixture's two-card weeks
    // overflow at, so this is where the region is guaranteed to exist.
    const pagers = await page.locator(WEEK_PAGER).count()
    expect(pagers, 'no week pager is on the screen at 375, so this arm guards an empty set').toBeGreaterThan(
      0,
    )

    // ⭐⭐ GUARD ONE, AND IT IS THE ONE THAT STOPS THE EXEMPTION GROWING. A later phase that parks a
    // control inside a pager would be moving it OUT of the parity check – which is precisely what a
    // boundary-by-container is for. The region may hold the two arrows and NOTHING else: not a third
    // button, not a wrapper, not a text node.
    const contents = await page.evaluate((selector) => {
      // ⚠ TAG AND ACCESSIBLE NAME, NOT THE CLASS LIST. `ui/IconButton.vue` puts its own
      // `tb-iconbtn tb-iconbtn--plate` on the element, and pinning those here would make this arm a
      // hostage to that component's internals rather than a statement about what is in the region.
      // The `week-arrow` marker is asserted separately, below, which is the part that is ours.
      const describe = (el: Element): string =>
        `${el.tagName.toLowerCase()} "${el.getAttribute('aria-label') ?? ''}"`
      return Array.from(document.querySelectorAll(selector)).map((region) => ({
        children: Array.from(region.children).map(describe),
        strays: Array.from(region.children)
          .filter((el) => !el.classList.contains('week-arrow'))
          .map(describe),
        // ⚠ TEXT AS WELL AS ELEMENTS. A bare text node has no tag to enumerate and would slip past a
        // children-only check, and a word drawn in the exempt region is a word the parity walk stops
        // comparing – the same dodge the rail's «no undeclared text» arm exists to stop.
        text: (region.textContent ?? '').replace(/\s+/g, ' ').trim(),
        parent: region.parentElement?.className ?? '<detached>',
      }))
    }, WEEK_PAGER)

    for (const region of contents) {
      expect(
        region.children,
        'a week pager holds something that is not its two arrows. This region is the ONE place on ' +
          'the Season screen parity does not check, by his ruling that an idle pager is hidden - so ' +
          'anything parked in here is a control that has left the check.',
      ).toEqual(['button "Back"', 'button "Next"'])
      expect(
        region.strays,
        'something in a week pager is not one of the pager’s own arrows',
      ).toEqual([])
      expect(region.text, 'a week pager carries text of its own, which the parity walk would stop comparing').toBe(
        '',
      )
      // ⭐ AND THE PLACE IS THE PLACE. `#app .week-row > .week-pager` is the selector; asserting the
      // parent here is what stops a `.week-pager` appearing somewhere else in the app and being
      // exempt by accident.
      expect(region.parent, 'a week pager is not a child of a week row').toContain('week-row')
    }

    // ⭐ NOTHING ELSE IN THE APP CARRIES THE CLASS. A second kind of `.week-pager` – in another
    // screen, or nested – would be a second hole, so the two counts are asserted equal rather than
    // the presence of one.
    expect(
      await page.locator('.week-pager').count(),
      'a `.week-pager` exists outside a week row, which is a second exempt region nobody declared',
    ).toBe(pagers)
  })

  test('only the ARROWS are exempt – the strip, the cards and their controls stay in the check', async ({
    page,
    careerAt,
  }) => {
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await careerAt('sinking')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await seasonAt(page, BASE_WIDTH)

    const exempt = await weekPagerTokens(page)
    // ⭐ PART 1 – THE EXEMPTION TAKES THE TWO ARROWS AND NOTHING ELSE. Asserted as a set equality
    // over the distinct tokens, so a third kind of token appearing in the region fails by name
    // rather than being absorbed.
    expect(exempt.length, 'the arrows contribute nothing, so the exemption guards an empty set').toBeGreaterThan(
      0,
    )
    expect(
      [...new Set(exempt)].sort(),
      'the exemption is taking something that is not a pager arrow out of the parity check',
    ).toEqual(['button "Back"', 'button "Next"'])

    // ⭐ …AND THE WEEK'S OWN CONTROLS ARE STILL IN THE CHECK. The cards, their headings and the
    // `Enter` on each of them are OUTSIDE the pager, so they still fail by name if one goes. This is
    // the arrows' version of «the rail's NAVIGATION is not exempt».
    const kept = await ariaFingerprint(page)
    const cardControls = (await ariaTokensOf(page.locator('body'))).filter(
      (t) => /^button "Enter the /.test(t) || /^heading3 /.test(t),
    )
    expect(
      cardControls.length,
      'the feed drew no card control at all, so «they stay in the check» is a claim about nothing',
    ).toBeGreaterThan(0)
    for (const token of new Set(cardControls)) {
      expect(kept, `${token} is on a season card and the exemption swallowed it`).toContain(token)
    }
    expect(
      exempt.some((t) => !/^button "(Back|Next)"$/.test(t)),
      'the exemption took a token that is not one of the two arrows',
    ).toBe(false)
  })

  test('⭐⭐ the HONEST HALF – a strip that DOES overflow has its arrows, at every width', async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐⭐ THIS IS THE ARM THAT STOPS THE EXEMPTION MEANING «ARROWS MAY BE MISSING WHENEVER».
    // His ruling is «показываем только если есть что листать» – a biconditional, not a licence. So
    // the overflow is measured in the real browser, week by week and width by width, and the arrows
    // must follow it in BOTH directions: absent where the week fits, PRESENT where it does not.
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await careerAt('sinking')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    let overflowing = 0
    let fitting = 0
    for (const width of WIDTHS) {
      await seasonAt(page, width)
      const rows = (await weekRowsAt(page)).filter((r) => r.cards > 1)
      expect(rows.length, `no week stacks at ${width}px, so this width measured nothing`).toBeGreaterThan(
        0,
      )
      for (const row of rows) {
        // The 1px band is `pagerEnds`' own fractional-pixel slack, read back here rather than
        // re-derived: a strip whose scroll is a sub-pixel has nothing a player could page to.
        if (row.overflow > 1) {
          overflowing++
          expect(
            row.arrows,
            `at ${width}px a week of ${row.cards} cards overflows by ${Math.round(row.overflow)}px ` +
              'and has NO pager. The exemption is for an idle pager, not a missing one: «показываем ' +
              'только если есть что листать» is a biconditional and this is the half of it that ' +
              'keeps the exemption honest.',
          ).toEqual(['Back', 'Next'])
          expect(row.pagers, `and its arrows are inside the one exempt container at ${width}px`).toBe(1)
        } else {
          fitting++
          expect(
            row.arrows,
            `at ${width}px a week of ${row.cards} cards fits whole and still draws a pager - which ` +
              'is the pair of grey arrows his ruling took off the screen',
          ).toEqual([])
          expect(row.pagers, `and no exempt container is drawn at ${width}px either`).toBe(0)
        }
      }
    }

    // ⚠⚠ ANTI-VACUITY, BOTH WAYS. A run in which nothing overflowed would pass the whole loop while
    // proving only that absent arrows stay absent - and a run in which everything overflowed would
    // never exercise the ruling at all. The fixture must show this walk both states or the arm says
    // so instead of going quietly green.
    expect(
      overflowing,
      'no week overflowed at any of the four widths, so the honest half was never tested',
    ).toBeGreaterThan(0)
    expect(
      fitting,
      'no week fitted whole at any of the four widths, so his ruling was never tested',
    ).toBeGreaterThan(0)
  })

  test("the arrows' exemption is doing real work, and it is the ONLY difference the pager makes", async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐ THE ANTI-VACUITY ARM PHASE 4 ASKED FOR, AS AN EQUALITY – the same shape as the rail's, from
    // the opposite direction. The rail adds tokens at 1280 that 375 has not; the pager adds tokens at
    // 375 that 1280 has not. This one assertion says three things at once: the exemption is
    // load-bearing TODAY (the day it stops being, this line reddens), it hides nothing else, and the
    // rest of the Season feed really is 1:1 on its own.
    await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
    await careerAt('sinking')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    // ⚠ THE OTHER TWO REGIONS ARE SUBTRACTED FROM BOTH SIDES FIRST, AND THAT IS NOT A CONVENIENCE.
    // At 1280 the Season screen also carries the rail's dashboard and (since P2-6) her identity
    // block, so a raw 375-vs-1280 diff would name their controls too and this arm would be measuring
    // three regions at once. The claim here is about the pager alone, so the other two are taken out
    // on each side by their own subtractions, exactly as the walk does.
    const others = async (): Promise<string[]> => [
      ...(await railDashboardTokens(page)),
      ...(await identityTokens(page)),
    ]
    await seasonAt(page, BASE_WIDTH)
    const phoneRaw = subtractOnce(await ariaTokensOf(page.locator('body')), await others())
    const exempt = await weekPagerTokens(page)

    await seasonAt(page, 1280)
    const deskRaw = subtractOnce(await ariaTokensOf(page.locator('body')), await others())
    const deskExempt = await weekPagerTokens(page)

    expect(exempt.length, 'the pager contributes nothing at 375, so the exemption guards an empty set').toBeGreaterThan(
      0,
    )
    expect(deskExempt, 'a week that fits whole at 1280 still draws a pager').toEqual([])
    // Without the subtraction the two widths DISAGREE, and what they disagree about is exactly the
    // arrows – nothing more and nothing less.
    expect(
      missingFrom(phoneRaw, deskRaw),
      'the ONLY thing on the phone that is not at 1280 must be the pager arrows themselves',
    ).toEqual(missingFrom(exempt, []))
    expect(
      missingFrom(deskRaw, phoneRaw),
      'and with the rail and her identity block taken off both sides, nothing at 1280 is missing ' +
        'on the phone',
    ).toEqual([])
  })
})

// =================================================================================================
// ⭐⭐⭐ THE ALBUM WAVE, 19.09.2026 – THE CHAPTER DOOR AND THE PAN PILL, AND THEIR OWN FOUR GUARDS
// =================================================================================================
//
// ⚠⚠ THE PROVENANCE IS IN THIS FILE'S HEADER AND IS DELIBERATELY NOT REPEATED HERE, because it is
// the part a reader must not skim: the quote is the owner's own design README of 19.09.2026, the
// READING of it is an architect's, he has not been asked, and deleting this `describe` block plus the
// two constants restores the red. What follows is only the machinery.
//
// Phase 6's shape, applied to a screen that hides a control at BOTH ends of the ladder: the door is
// on the phone and not on the desktop, the rail is on the desktop and not on the phone, and they are
// the same list of chapters wearing the width's own shape. So this exemption has to be honest in two
// directions where the other three are honest in one, and `the chapters are not lost, they are OPEN`
// is the arm that carries it.
//
// ⚠ THEY WALK THE STATION MAP'S OWN ROUTE rather than a second copy of it, for the reason
// `e2e/stations.ts` gives for existing at all: two walks to one screen drift, and the day they
// disagreed nobody would know which one was the app. `pro` earns six sheets and five chapters
// (measured 19.09), which is what makes every floor below a real one rather than a hopeful `>= 0`.

/** The album's route and its arrival anchor, taken from the one map – never re-written here. */
const ALBUM_STATION = STATIONS['AlbumScreen.vue']

/** Everything in the app that may be focused or carry a role – the wider of the two nets the rail
 *  dashboard's own guard uses, and the one that catches a focus stop with no role at all. */
const FOCUSABLE_QUERY =
  'a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,' +
  '[tabindex],[contenteditable],[onclick],[role]'

/** The album at one width, settled – the state every arm below measures from. */
async function albumAt(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
  await park(page)
  await ALBUM_STATION.visit(page)
  await expect(
    ALBUM_STATION.arrived(page),
    `the walk did not arrive on the album at ${width}px, so nothing measured below is the album`,
  ).toBeVisible()
  await settleScreen(page)
}

test.describe("the album's chapter door and pan pill are exempt – and the exemption is bounded", () => {
  test('the boundary is the CHAPTER SLOT and the PAN SLOT, and each holds only what it is', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)
    await albumAt(page, BASE_WIDTH)

    // ⭐ EXACTLY ONE OF EACH IN THE DOCUMENT, AND EACH IS THE ONE INSIDE ITS DECLARED PLACE. A second
    // `.album-rail` or a second `.album-half` – on this screen or anywhere else in the app – would be
    // a second hole, so the counts are asserted rather than the presence. This is `#app` and the
    // child combinators earning their place in the two constants.
    for (const [loose, placed, what] of [
      ['.album-chapters-btn', ALBUM_CHAPTER_DOOR, 'the chapter door'],
      ['.album-rail', ALBUM_CHAPTER_RAIL, 'the chapter rail'],
      ['.album-half', ALBUM_PAN_HINT, 'the pan pill'],
    ] as const) {
      expect(await page.locator(loose).count(), `one ${what} in the document`).toBe(1)
      expect(await page.locator(placed).count(), `and ${what} is the one in its declared place`).toBe(1)
    }

    // ⚠ WHICH OF THE THREE HAS A BOX IS THE WHOLE OF THE EXEMPTION, so it is measured at both ends.
    // The rail is in the tree at 375 and `display: none` – the house idiom, stated in src/style.css
    // beside `.rail-dash` – so «phone-only» and «desktop-only» are both measured as «has a box».
    await expect(page.locator(ALBUM_CHAPTER_DOOR), 'the chapter door is on the phone').toBeVisible()
    await expect(page.locator(ALBUM_PAN_HINT), 'the pan pill is on the phone').toBeVisible()
    await expect(
      page.locator(ALBUM_CHAPTER_RAIL),
      'the chapter rail has a box at 375, where the README says a rail «занял бы полэкрана»',
    ).toBeHidden()

    // ⭐⭐ GUARD ONE, PHONE HALF. The door is a leaf: one button, no element inside it, and it hangs
    // off the foot row. A later phase that parked a control «next to Chapters» inside this boundary
    // would be moving it OUT of the parity check, which is what a boundary-by-place is for.
    const door = await page.evaluate((selector) => {
      const el = document.querySelector(selector)
      if (!el) return null
      return {
        tag: el.tagName.toLowerCase(),
        children: Array.from(el.children).map((c) => c.tagName.toLowerCase()),
        parent: el.parentElement?.className ?? '<detached>',
      }
    }, ALBUM_CHAPTER_DOOR)
    expect(door, 'the chapter door was not on the page, so this measured nothing').not.toBeNull()
    expect(door!.tag, 'the chapter door is not a button any more').toBe('button')
    expect(
      door!.children,
      'the chapter door grew something inside it, and anything in there has left the parity check',
    ).toEqual([])
    expect(door!.parent, 'the chapter door is not a child of the foot row').toContain('album-foot-row')

    // ⭐⭐ GUARD ONE, PILL HALF. The pill may hold the half label, the two-position track and ONE
    // control, and nothing else: not a second button, not a wrapper, not a stray word. ⚠ TEXT AS WELL
    // AS ELEMENTS, for the week pager's reason – a word drawn in an exempt region is a word the
    // parity walk stops comparing, and a bare text node has no tag to enumerate.
    const pill = await page.evaluate(
      ({ selector, query }) => {
        const root = document.querySelector(selector)
        if (!root) return null
        const text = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
        return {
          controls: Array.from(root.querySelectorAll(query)).map(
            (el) => el.getAttribute('aria-label') ?? text(el),
          ),
          // Every leaf that carries a word must be one of the two declared ones. ⚠ THE WORDS
          // THEMSELVES ARE NOT PINNED HERE – they are the owner's copy (invariant 4) and this is a
          // structure check – so what is asserted is that there are no OTHERS, and that neither of
          // the two is empty, which is what would make «no others» vacuous.
          declared: ['.album-half-label', '.album-half-next'].map((s) => {
            const el = root.querySelector(s)
            return el === null ? '' : text(el)
          }),
          strays: Array.from(root.querySelectorAll('*'))
            .filter((el) => el.children.length === 0 && text(el) !== '')
            .filter((el) => !el.closest('.album-half-label, .album-half-next'))
            .map((el) => `${el.tagName.toLowerCase()}: ${text(el)}`),
          parent: root.parentElement?.className ?? '<detached>',
        }
      },
      { selector: ALBUM_PAN_HINT, query: FOCUSABLE_QUERY },
    )
    expect(pill, 'the pan pill was not on the page, so this measured nothing').not.toBeNull()
    expect(
      pill!.controls,
      'the pan pill holds a control that is not its one chevron. This region is one of the two ' +
        'places on the album parity does not check, so anything parked in here is a control that ' +
        'has left the check.',
    ).toEqual(['Next half'])
    expect(
      pill!.strays,
      'a word in the pan pill is neither the half label nor the chevron, so the parity walk has ' +
        'quietly stopped comparing it',
    ).toEqual([])
    for (const word of pill!.declared) {
      expect(word.length, 'a declared part of the pan pill draws nothing, so this guards an empty set').toBeGreaterThan(0)
    }
    expect(pill!.parent, 'the pan pill is not a child of the album stage').toContain('album-stage')

    // ⭐⭐ GUARD ONE, RAIL HALF – and it is the one that had to be written differently. The other
    // three exempt regions in this file hold NO control by their own rule; this one is MADE of
    // controls, because a chapter rail is a list of chapters you press. So «it cannot grow» cannot
    // mean «no controls here»; it means EVERY control in here is a chapter plate, every row holds one
    // of them, and no word in the region lives outside a plate.
    await albumAt(page, 1280)
    await expect(page.locator(ALBUM_CHAPTER_RAIL), 'the chapter rail is on screen at 1280').toBeVisible()
    await expect(page.locator(ALBUM_CHAPTER_DOOR), 'the door kept a second way in at 1280').toBeHidden()
    await expect(page.locator(ALBUM_PAN_HINT), 'the pill promises a pan the window does not have').toBeHidden()

    const rail = await page.evaluate(
      ({ selector, query }) => {
        const root = document.querySelector(selector)
        if (!root) return null
        const text = (el: Element): string => (el.textContent ?? '').replace(/\s+/g, ' ').trim()
        const describe = (el: Element): string =>
          `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : ''}`
        return {
          children: Array.from(root.children).map(describe),
          strayControls: Array.from(root.querySelectorAll(query))
            .filter((el) => !el.classList.contains('album-rail-plate'))
            .map(describe),
          plates: root.querySelectorAll('.album-rail-plate').length,
          rows: root.querySelectorAll('.album-rail-list > li').length,
          strays: Array.from(root.querySelectorAll('*'))
            .filter((el) => el.children.length === 0 && text(el) !== '')
            .filter((el) => !el.closest('.album-rail-plate'))
            .map((el) => `${el.tagName.toLowerCase()}: ${text(el)}`),
          parent: root.parentElement?.className ?? '<detached>',
        }
      },
      { selector: ALBUM_CHAPTER_RAIL, query: FOCUSABLE_QUERY },
    )
    expect(rail, 'the chapter rail was not on the page, so this measured nothing').not.toBeNull()
    expect(rail!.children, 'the chapter rail holds something beside its own list').toEqual([
      'ol.album-rail-list',
    ])
    expect(
      rail!.strayControls,
      'a control that is not a chapter plate is inside the chapter rail. The rail is exempt ' +
        'because it IS the «Chapters» button in another shape - anything else in there is a ' +
        'control that has left the parity check under cover of that argument.',
    ).toEqual([])
    // Anti-vacuity, in the same shape as every other floor in this file: an empty rail satisfies
    // all three assertions above for ever.
    expect(rail!.plates, 'the chapter rail draws no plate, so this guards an empty set').toBeGreaterThan(1)
    expect(rail!.rows, 'a row of the chapter rail is not a plate, or a plate is not in a row').toBe(
      rail!.plates,
    )
    expect(
      rail!.strays,
      'a word in the chapter rail lives outside a chapter plate, so the parity walk has quietly ' +
        'stopped comparing it',
    ).toEqual([])
    expect(rail!.parent, 'the chapter rail is not a child of the album').toContain('album')
  })

  test('only the CHAPTER DOOR and the PAN PILL are exempt – Back, the arrows and the dots stay in', async ({
    page,
    careerAt,
  }) => {
    await boot(page, careerAt)
    await albumAt(page, BASE_WIDTH)

    // ⭐ PART 1 – THE EXEMPTION TAKES THOSE TWO AND NOTHING ELSE ON THE PHONE. A set equality over
    // the distinct tokens, so a third kind of token appearing in either region fails BY NAME rather
    // than being absorbed.
    const exempt = await albumTokens(page)
    expect(exempt.length, 'the album exempts nothing at 375, so this guards an empty set').toBeGreaterThan(0)
    expect(
      [...new Set(exempt)].sort(),
      'the exemption is taking something that is not the chapter door or the pan pill out of the check',
    ).toEqual(['button "Chapters"', 'button "Next half"'])

    // ⭐ …AND EVERY OTHER CONTROL ON THE SCREEN IS STILL IN THE CHECK, by name, on the subtracted
    // list the walk really compares. This is the album's version of «the rail's NAVIGATION is not
    // exempt»: `Back`, the two sheet arrows and every dot of the pager still fail by name if one goes.
    const dots = await page.locator('.album-dot').count()
    expect(dots, 'the album drew no dot pager, so «the dots stay in» is a claim about nothing').toBeGreaterThan(1)
    const mustStay = [
      'button "Back to Home"',
      'button "Previous sheet"',
      'button "Next sheet"',
      ...Array.from({ length: dots }, (_, i) => `button "Sheet ${i + 1}"`),
    ]
    const kept = await ariaFingerprint(page)
    for (const token of mustStay) {
      expect(kept, `${token} is an album control and the exemption swallowed it at 375`).toContain(token)
    }

    // …and the same at 1280, where the exempt set is a different set of tokens entirely. The two the
    // phone exempts are GONE from the screen here rather than quietly still exempt, and the ones that
    // must stay are still being compared.
    await albumAt(page, 1280)
    const wide = await albumTokens(page)
    expect(wide.length, 'the album exempts nothing at 1280, so the rail is not in this region').toBeGreaterThan(1)
    expect(
      wide.length,
      'the exempt set at 1280 is not the rail’s plates, so the region holds something else',
    ).toBe(await page.locator(`${ALBUM_CHAPTER_RAIL} .album-rail-plate`).count())
    for (const token of ['button "Chapters"', 'button "Next half"', ...mustStay]) {
      expect(wide, `${token} is exempt at 1280, and it is not one of the rail’s chapter plates`).not.toContain(
        token,
      )
    }
    const keptWide = await ariaFingerprint(page)
    for (const token of mustStay) {
      expect(keptWide, `${token} is an album control and the exemption swallowed it at 1280`).toContain(
        token,
      )
    }
  })

  test('⭐⭐ the HONEST HALF – the chapters are not lost, they are OPEN: every one, at every width', async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐⭐ THIS IS THE ARM THAT STOPS THE DOOR'S EXEMPTION MEANING «THE CHAPTERS MAY BE MISSING».
    // The README's argument is that the door and the rail are the SAME list – «кнопка "Chapters"»
    // at 390 because a rail «занял бы полэкрана», and the rail itself from 768 up. That argument
    // only holds while both really carry the same chapters, so the phone's list is opened, read, and
    // held against the wide one at all three wider widths. A chapter a wide width cannot reach is a
    // fact the phone has and the desktop has not, and it reddens here.
    await boot(page, careerAt)
    await albumAt(page, BASE_WIDTH)

    await page.locator(ALBUM_CHAPTER_DOOR).click()
    await expect(
      page.getByRole('dialog', { name: 'Chapters' }),
      'the chapter door did not open the phone’s list, so there is nothing to compare',
    ).toBeVisible()
    const phone = await chapterLines(page, '.album-chapters-row', '.album-chapters-title', '.album-chapters-age')
    expect(
      phone.length,
      'the phone’s chapter list is empty or holds one row, so four equal lists would prove nothing',
    ).toBeGreaterThan(1)

    // ⚠ AND THE CARD IS DISMISSED BEFORE THE WALK MOVES, which is not tidying – it is round-20 #3's
    // lesson arriving from the test side. `AlbumChaptersSheet.vue` is a BLOCKING overlay, so the tab
    // bar `park()` uses at the next width is in the accessibility tree, has a box, and cannot receive
    // a click: left open, this arm does not fail on a chapter, it hangs on a tab. (Measured – the
    // first run of it timed out here at 60s while its four siblings were green in under two.) It is
    // also what a player does, which is why it is a press on the card's own control and not an Escape.
    await page
      .getByRole('dialog', { name: 'Chapters' })
      .getByRole('button', { name: 'Close' })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'Chapters' }),
      'the phone’s chapter card would not close, and it covers the navigation the walk needs next',
    ).toBeHidden()

    for (const width of WIDER_WIDTHS) {
      await albumAt(page, width)
      // ⭐ THE FUNCTION EXISTS AT THIS WIDTH, which is the first half of the claim: the door is gone
      // BECAUSE the rail is there, not instead of anything being there.
      await expect(
        page.locator(ALBUM_CHAPTER_DOOR),
        `the chapter door still has a box at ${width}px, so this width has two ways to the same list`,
      ).toBeHidden()
      await expect(
        page.locator(ALBUM_CHAPTER_RAIL),
        `the chapter door is gone at ${width}px and NOTHING took its place - the chapters are ` +
          'unreachable at this width, which is a control lost rather than a control moved',
      ).toBeVisible()

      const wide = await chapterLines(page, '.album-rail-plate', '.album-rail-title', '.album-rail-age')
      expect(
        wide,
        `the chapter list behind the phone’s «Chapters» button and the rail at ${width}px are not ` +
          'the same chapters. The exemption is «the door became a rail»; a chapter on one side and ' +
          'not the other is a chapter lost, and that is what «1 к 1» forbids.',
      ).toEqual(phone)

      // ⚠ AND EACH PLATE IS A BOX ON THE SCREEN, NOT A DECLARATION. Measured the way the week
      // pager's arrows are: a plate with no client rects is not reachable whatever the markup says.
      // At 768 the strip pans sideways, which does not cost a plate its box.
      const boxed = await page
        .locator(`${ALBUM_CHAPTER_RAIL} .album-rail-plate`)
        .evaluateAll((els) => els.filter((el) => el.getClientRects().length > 0).length)
      expect(
        boxed,
        `a chapter plate at ${width}px has no box, so the chapter behind it cannot be pressed`,
      ).toBe(phone.length)
    }
  })

  test('⭐⭐ the HONEST HALF – a page that does NOT fit whole keeps its pill, at every width', async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐⭐ AND THIS IS THE ARM THAT STOPS THE PILL'S EXEMPTION MEANING «HIDDEN WHENEVER». His ruling
    // for the week pager is «показываем только если есть что листать» – a biconditional, not a
    // licence – and it is the pill's case almost verbatim: the pill exists to promise that the page
    // continues sideways, and from 768 up the page fits the window whole so there is nothing to
    // promise. So «fits whole» is MEASURED in the real browser rather than read off the breakpoint:
    // the sheet's own box against the window's, width by width, and the pill must follow it in BOTH
    // directions.
    //
    // ⚠ MEASURED AND NEVER RE-DERIVED, for `weekRowsAt`'s reason. `--album-sheet` is 470 / 540 / 556
    // down the ladder and the window is the film's own width; re-computing either here would be this
    // arm asserting the stylesheet against a copy of itself.
    await boot(page, careerAt)

    let panning = 0
    let whole = 0
    for (const width of WIDTHS) {
      await albumAt(page, width)
      const measured = await page.evaluate(() => {
        const film = document.querySelector('.album-pan')
        const first = document.querySelector('.album-pan > .album-sheet')
        if (!film || !first) return null
        const boxed = (selector: string): boolean => {
          const el = document.querySelector(selector)
          return el !== null && el.getClientRects().length > 0
        }
        return {
          window: film.clientWidth,
          sheet: first.getBoundingClientRect().width,
          pill: boxed('.album-half'),
          chevron: boxed('.album-half-next'),
        }
      })
      expect(measured, `the album drew no film at ${width}px, so this width measured nothing`).not.toBeNull()
      expect(measured!.sheet, `the page has no width at ${width}px`).toBeGreaterThan(0)

      // The 1px band is the same fractional-pixel slack the week pager's own arm reads back rather
      // than re-deriving: a sub-pixel of overhang is nothing a reader could pan to.
      if (measured!.sheet - measured!.window > 1) {
        panning++
        expect(
          measured!.pill,
          `at ${width}px the page is ${Math.round(measured!.sheet)}px inside a ${Math.round(measured!.window)}px ` +
            'window - it pans, and the affordance that says so is NOT on the screen. The exemption ' +
            'is for a pill with nothing to promise, not for a missing one: «показываем только если ' +
            'есть что листать» is a biconditional and this is the half of it that keeps the ' +
            'exemption honest.',
        ).toBe(true)
        expect(measured!.chevron, `and its chevron is on the screen at ${width}px too`).toBe(true)
      } else {
        whole++
        expect(
          measured!.pill,
          `at ${width}px the page fits the window whole and the pill still promises a pan - which ` +
            'is the thing at the bottom-right corner of AX and AW that is deliberately not there',
        ).toBe(false)
      }
    }

    // ⚠⚠ ANTI-VACUITY, BOTH WAYS, exactly as the arrows' arm does it. A run in which the page never
    // fitted would pass the whole loop while proving only that a present pill stays present, and a
    // run in which it always fitted would never exercise the ruling at all.
    expect(
      panning,
      'the page fitted the window at every one of the four widths, so the honest half was never tested',
    ).toBeGreaterThan(0)
    expect(
      whole,
      'the page overflowed at every one of the four widths, so the exemption was never exercised',
    ).toBeGreaterThan(0)
  })

  test("the album's exemption is doing real work, and it is the ONLY difference the slot makes", async ({
    page,
    careerAt,
  }) => {
    // ⭐⭐ THE ANTI-VACUITY ARM PHASE 4 ASKED FOR, AS AN EQUALITY – and this screen is the first that
    // needs it in BOTH directions at once. The rail dashboard adds tokens at 1280 that 375 has not;
    // the week pager adds tokens at 375 that 1280 has not; the album does both, because its one list
    // of chapters is a button on the phone and a rail on the desktop. So the two diffs are asserted
    // against the two exempt sets, and between them they say three things: the exemption is
    // load-bearing TODAY (the day either side stops contributing, this reddens), it hides nothing
    // else, and the rest of the album really is 1:1 on its own.
    await boot(page, careerAt)

    // ⚠ THE OTHER THREE REGIONS COME OFF BOTH SIDES FIRST, AND THAT IS NOT A CONVENIENCE. At 1280
    // the album also carries the rail's dashboard and her identity block, so a raw 375-vs-1280 diff
    // would name their controls too and this arm would be measuring three regions at once.
    const others = async (): Promise<string[]> => [
      ...(await railDashboardTokens(page)),
      ...(await weekPagerTokens(page)),
      ...(await identityTokens(page)),
    ]
    await albumAt(page, BASE_WIDTH)
    const phoneRaw = subtractOnce(await ariaTokensOf(page.locator('body')), await others())
    const phoneExempt = await albumTokens(page)

    await albumAt(page, 1280)
    const deskRaw = subtractOnce(await ariaTokensOf(page.locator('body')), await others())
    const deskExempt = await albumTokens(page)

    expect(
      phoneExempt.length,
      'the album exempts nothing at 375, so half of this exemption guards an empty set',
    ).toBeGreaterThan(0)
    expect(
      deskExempt.length,
      'the album exempts nothing at 1280, so the other half guards an empty set',
    ).toBeGreaterThan(0)
    expect(
      missingFrom(phoneRaw, deskRaw),
      'the ONLY things on the phone that are not at 1280 must be the chapter door and the pan pill',
    ).toEqual(missingFrom(phoneExempt, deskExempt))
    expect(
      missingFrom(deskRaw, phoneRaw),
      'the ONLY things at 1280 that are not on the phone must be the chapter rail’s own plates',
    ).toEqual(missingFrom(deskExempt, phoneExempt))
  })
})

/** One chapter per row as `title · age`, read from the DECLARED leaf spans of whichever shape the
 *  width draws – the phone's sheet rows or the wide rail's plates.
 *
 *  ⚠ THE TWO PARTS SEPARATELY AND NEVER THE ROW'S WHOLE TEXT, which is the lesson round 42 #23 wrote
 *  into the rail dashboard's own arm: the phone's row draws the chapter NUMBER and its SHEET COUNT
 *  beside the title and the rail's plate does not, so comparing accessible names would fail on the
 *  rendering rather than on a chapter being unreachable. What is compared is the chapter itself. */
async function chapterLines(
  page: Page,
  row: string,
  title: string,
  age: string,
): Promise<string[]> {
  const titles = await page.locator(`${row} ${title}`).allInnerTexts()
  const ages = await page.locator(`${row} ${age}`).allInnerTexts()
  expect(
    ages.length,
    `a chapter row drawn by \`${row}\` shows a title with no age beside it`,
  ).toBe(titles.length)
  return titles.map((t, i) => `${t.replace(/\s+/g, ' ').trim()} · ${ages[i].replace(/\s+/g, ' ').trim()}`)
}

/**
 * ONE WALK, USED BY BOTH MAPS – extracted in phase 4 rather than copied, because a second copy of
 * this body is a second place for the arrival check, the floor and the two-way diff to drift out of.
 */
async function walkOneScreen(
  page: Page,
  careerAt: CareerAt,
  screen: string,
  station: Station,
): Promise<void> {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // ⚠ THE HEAVIEST CAREER, on purpose. `pro` is "eight seasons in, inside the sponsor window,
  // ledgers full – the heavy-state screens" (e2e/fixtures/manifest.json), so every screen here
  // is drawn with something on it. A fingerprint taken against an empty career would be a
  // smaller claim wearing the same green tick. ⭐ Phase 5 made it the DEFAULT rather than the only
  // choice – see `Station.career`: heaviest is not the same as "reaches every state", and a control
  // that only exists on a week `pro` never has is one this walk could not have seen.
  await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
  await careerAt(station.career ?? 'pro')
  // Both are doorways rather than assertions – journey.ts argues each at length. The knock is a
  // blocking decision every seeded career wakes up holding; the briefing fires on the boot of
  // any career already inside the top 50, which `pro` is.
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  const seen = new Map<number, string[]>()
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
    await (station.park ?? park)(page)
    await station.visit(page)
    // ⚠ ARRIVAL BEFORE MEASUREMENT, ALWAYS. This is mechanism 2 of the three in the header: a
    // walk that landed on the wrong screen would otherwise fingerprint that one four times and
    // report perfect parity about a screen it never visited.
    await expect(
      station.arrived(page),
      `${screen} at ${width}px – the walk did not arrive, so there is nothing to compare`,
    ).toBeVisible()
    seen.set(width, await fingerprint(page))
  }

  const base = seen.get(BASE_WIDTH)!
  expect(
    base.length,
    `${screen} fingerprints only ${base.length} things at ${BASE_WIDTH}px. Either the screen ` +
      'draws almost nothing or the walk did not really arrive - and four near-empty sets are ' +
      'equal, which is this harness passing while proving nothing.',
  ).toBeGreaterThanOrEqual(FINGERPRINT_FLOOR)

  for (const width of WIDER_WIDTHS) {
    const wide = seen.get(width)!
    // ⭐ THE OWNER'S CRITERION, BOTH WAYS ROUND. First half: «старого уйти ничего не должно».
    expect(
      missingFrom(base, wide),
      `${screen}: these are on the phone at ${BASE_WIDTH}px and NOT at ${width}px. ` +
        '«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»',
    ).toEqual([])
    // ⭐ Second half: «ничего нового не должно появиться». A control that exists only on the
    // wide format is as much a break of «1 к 1» as one that vanished.
    expect(
      missingFrom(wide, base),
      `${screen}: these are at ${width}px and NOT on the phone at ${BASE_WIDTH}px. ` +
        '«Все иконки наши, ничего нового по идее не должно появиться»',
    ).toEqual([])
  }

  expect(crashes, `${screen} threw while being walked at four widths`).toEqual([])
}
