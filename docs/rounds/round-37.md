---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-05
---

# Round 37, his six from the stand on the review wave (05.09.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him

He read the review, took `round/37` on the stand and came back with six. Five are builds and one
is half a question. His numbering, his words, then the reading.

- [>] **1. «Coach Note на home desktop tablet все буквы убрать с картинки и сдвинуть направо с
  небольшим отступом от самой картинки (примерно как на карточках тренеров), место есть, станет
  аккуратнее»** – build. The words currently sit ON the coach's painting; they move off it and to
  the right of it, with the gap the coach market's own cards use (`.cm-body`'s 12px corridor is the
  named model). Desktop and tablet only.

- [>] **2. «Recent memory photo прямоугольное - сделать квадратное оставить текущую ширину desktop
  tablet»** – build. The polaroid on Home's Recent memory is a rectangle; it becomes a square at the
  width it already has. ⚠ Round 36 review item 6 (`D81`) set that width to 104px; this changes the
  height to match, not the width.

- [>] **3. «Season - давай сделаем сетку на 2 карточки desktop (как на tablet) по дефолту, а те
  недели, где 3 карточки будет и больше (их вроде не очень много) будут иметь листалки (мы же этот
  функционал реализовали уже?)»** – build, and the answer to his question is **yes**: the JS pager
  with arrows shipped in round 36 phase 5 (`src/composables/weekPager.ts`), and it already draws its
  arrows only when the strip overflows, which is his own «показываем только если есть что листать».
  So this is a grid change: the desktop stops fitting three cards and takes the tablet's two, and
  the weeks with three or more become paged strips by the rule that is already there.

- [>] **4. «На экране stats для всех интерфейсов добавить под первой плашкой STATS полосу с
  переключателем по разделам seasons/ranking/results для каждой категории турниров для удобной
  навигации на странице»** – build. A navigation strip under the first plate, on every width.
  ⚠ The three words are HIS – seasons / ranking / results – and the screen already spells two of them
  in its own headings (`{{ LADDER_LABEL[shown] }} ranking`, `Counting results`). The strip must reuse
  what the headings say rather than invent a fourth spelling.

- [>] **5. «Картинки тренеров в общем списке сделали шире? Есть ещё возможность немного расширить на
  desktop tablet?»** – answer first, then build if the answer is yes. **Yes, 62 → 66px this
  morning (`D89`).** Whether there is more is a measurement, and round 37's own note says where the
  two ceilings are: the mask allows 71.94px, the TEXT COLUMN allowed only 66 without a card growing
  taller at some width. What is left to establish is how much of that 6px is affordable now.

- [>] **6. «Плитку тренера напротив выбранного текущего сделать обычной высоты (как на экранах
  магазина реализовано), сейчас она тоже высокая»**, clarified by him the same hour: «выбранный
  тренер, с ним всё ок, а вот напротив него есть НЕ выбранный тренер (как НЕ купленная машина) -
  эту карточку прошу сделать обычного размера, не высокую»** – build, and it reverses half of `D4`.

  ⚠ **I read this wrong the first time** and had briefed it as "the hired coach's row is too tall".
  It is not: **the hired card is fine**. The card he means is the one BESIDE it in the two-up row –
  an ordinary, un-hired coach that is being stretched to the hired card's height because the row
  makes them equal. His own model is the shop, where a car nobody bought keeps its natural height
  next to one that was.

  ⭐ `D4` (round 36) says this in its own words: «What he does get is "во всю высоту": the two cards
  in a row are the same height now, and the portrait fills the taller of the pair.» That equalising
  is what he is now asking to undo for the un-hired side.

  ⚠ **The hired card's own geometry does NOT move**: `.cm-row.current` keeps its 132px floor and its
  78px window, which is `coach-match-edge.md` §4's anti-shopping rule – the wider portrait belongs to
  the coach she already has. Only the sibling stops matching it.
