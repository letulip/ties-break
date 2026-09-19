---
type: spec
status: current
area: narrative-and-copy
canonical: false
last-reviewed: 2026-09-18
---

# The album's seven pages – what they actually show, measured (round 47 item 11)

The owner, 18.09, off his finished career:

> «странный набор фотографий на 7 шагов: 6 детских и юношеских и 1 взрослая в конце. Предлагаю
> как-то более гладко сделать и можно чуть больше фоточек из разных периодов. Можно например добавить
> стройку академии (если была) или еще какие-то значимые даты.»

This is the concrete shape of a standing item of his own, recorded in
[now-next-later.md](../now-next-later.md): «Текущий слайдер из 7 не подходит для объемной и
насыщенной карьеры, я хочу концептуально другое» – **he has reserved that design.** So this document
does one thing and stops at the line where his decisions begin: it MEASURES the claim, inventories
what material each era of a career actually holds, and hands him a numbered proposal. **Nothing in
`src/` changed for this item.** §5 says why that is the honest answer and not a small one.

The instrument is `tools/album-spread-probe.ts`. It walks careers through the public engine
commands, builds each one's real album with `buildAlbum`, and reports the age and the PORTRAIT BAND
of every page. Zero MAIN draws are added.

```
npx vite-node tools/album-spread-probe.ts --careers 27 --long 0   # the ordinary career
npx vite-node tools/album-spread-probe.ts --careers 27 --long 1   # the longest one the rules allow
```

## 1. The claim, as a number – CONFIRMED

Two arms, 27 careers each, spread over all nine `PRESETS`, with the shop on so an academy can exist.
`--long 0` retires at the first offer (ends median 26); `--long 1` says «one more year» to every
offer but the last (ends median 39) and is `tools/album-money-probe.ts`' own arm.

**His sentence is about PHOTOGRAPHS, so it is counted on photographs.** `AlbumPage.stage` is
`portraitStage(age)` and it is what picks the file that is drawn; the owner's five bands are
`jun <11 · young 11-16 · teen 17-22 · adult 23-30 · lateCareer 31+`.

| arm | faces per album that are jun/young/teen | adult/lateCareer | albums that are EXACTLY his 6 + 1 |
| --- | ---: | ---: | ---: |
| ordinary (`--long 0`) | **median 6 of 7** | 1 | **13 of 27** |
| long (`--long 1`) | median 5 of 7 | 2 | 6 of 27 |

On the ordinary career his description is the MODE, not an impression: 13 albums in 27 are six
childhood-and-youth pictures and one adult one, and another 11 are five and two. Over 189 pages:

| arm | `jun` | `young` 11-16 | `teen` 17-22 | `adult` 23-30 | `lateCareer` 31+ |
| --- | ---: | ---: | ---: | ---: | ---: |
| ordinary | **0%** | 48% | 30% | 22% | **0%** |
| long | **0%** | 47% | 26% | 8% | 19% |

⚠ **Two of the five painted bands are never drawn on the ordinary career.** `jun` cannot be (the
album has no page before week 0) and `lateCareer` cannot be either, because that career has ended
before 31. And on the LONG career the starving band moves rather than closes: `adult` 23-30 – the
middle of her adult life, which is where the academy is finished, the houses are bought and the
wedding happens – carries **8%** of the pages.

### 1a. Where each page lands

Median age per slot, both arms:

| slot | the page | ordinary | long | pinned by |
| ---: | --- | ---: | ---: | --- |
| 1 | the beginning | **13** (13-13) | 13 | week 0, by construction |
| 2 | her first win | **13** (13-14) | 13 | the EARLIEST title |
| 3 | the first cheque | **15** (14-17) | 15 | the EARLIEST prize |
| 4 | the best week | 21 (15-28) | 21 | the HIGHEST rung won |
| 5 | the worst week | 18 (13-27) | 19 (13-37) | the LONGEST layoff |
| 6 | the turn | 18 (16-22) | 18 | the break-even milestone |
| 7 | the last week | 26 (15-29) | 39 (15-41) | the ending |

⚠ **Slots 1 and 2 are the same year in 27 careers out of 27.** The album opens on two pictures of
the same girl in the same season, because her first title arrives in her first year on the ladder.
That is a third of the childhood weighting on its own, and neither page can move: one is week 0 and
the other says «the earliest one she ever won».

⚠ **An empty page draws her face at the END of the career**, not at the moment it is about –
`page()` falls back to `world.week` when there is no date. It is visible in the probe as a
`lateCareer` face on slot 3 or 6 in the long arm. That is defensible (the album is made at the end)
and is recorded here rather than changed.

## 2. The candidate inventory – what each era holds

Every dateable fact in a finished save, whether the album uses it or not. Coverage is the share of
the 27 careers holding at least one; the age is the median of the FIRST occurrence. Ordinary arm.

| candidate | coverage | median age at first | era |
| --- | ---: | ---: | --- |
| `title` / `final` | 100% | 13 | childhood |
| `international` (first trip abroad) | 100% | 14 | junior |
| `injury` (first) | 100% | 14 | junior |
| `season-rank` / season close | 100% | 14 | junior |
| `prize` (first cheque) | 96% | 15 | junior |
| `break-even` | 93% | 16 | junior |
| `life:episode-start` (someone appeared) | 96% | 17 | junior |
| **`school` (the last school year is over)** | **96%** | **18, in every career** | young |
| **`house-first`** | **93%** | **18** | young |
| **`merch-brand`** | **93%** | **19** | young |
| `car-sensible` | 89% | 19 | young |
| **`academy-land`** | **78%** | **20** | young |
| `life:episode-end` | 85% | 20 | young |
| **`academy-courts`** | 59% | 22 | adult |
| **`academy-building`** | 41% | 23 | adult |
| **`academy-staff`** (the academy finished) | 37% | 23.5 | adult |
| `house-garden` / `house-villa` | 37% / 30% | 24 / 23.5 | adult |
| `boat-launch` | 33% | 24 | adult |
| **`wedding`** | 19% ordinary · **74% long** | 25 ordinary · 33 long | adult / late |

⚠ **The academy's construction is already a dateable fact and needs no engine work.** `OwnedAsset`
carries `boughtWeek` per rung and an `entries[]` row per payment, so «the week the land was bought»
and «the week the last stage opened» are both readable from a finished save today. No schema move,
no new capture, no migration.

⚠ **What the adult years hold in bulk is injuries and season closes** – 248 season closes and 127
layoffs after 18, against 95 titles. A page selected on «significance» alone would therefore drift
towards the injury ward; the interesting adult material is the SPARSE kind (the academy, the house,
the brand, the wedding), and sparse material means a page that some careers cannot fill.

## 3. The art check – the constraint that shapes every proposal

**The album's picture is always HER.** `EndingScreen` draws `portraitUrl(page.stage, page.emotion)`,
so a page about a building shows the girl at the age the building went up. There is no place, court
or house art anywhere in the game, and none is needed for any page below – but if he wants the
academy PICTURED, that is new art and a new kind of page, not a new slot rule.

What exists, per band (`public/images/fem-euro-brunnet/`):

| band | faces available |
| --- | --- |
| `jun` <11 | angry happy injury norm rehab sad serious tired **training** |
| `young` 11-16 | angry happy injury norm rehab sad serious tired |
| `teen` 17-22 | angry happy injury norm rehab sad serious tired |
| `adult` 23-30 | angry **bride** **funeral** **graduated** happy injury norm **pregnant-early** **pregnant-last** rehab sad serious tired |
| `lateCareer` 31+ | angry **farewell** happy injury norm rehab **retired** sad serious tired |

⚠ **Every page proposed in §4 can be drawn today**, because `AlbumPage.emotion` is `AvatarEmotion`
(`norm happy sad serious tired injury angry`) and all seven exist in all five bands.

> ⭐⭐⭐ **AMENDED 18.09 – `bride` IS WIRED NOW, and the paragraph below is superseded for that one
> face only.** The wedding's MEMORY draws it (`MEMORY_EMOTION.wedding = 'bride'`), through a third
> union – `MemoryFace = PortraitEmotion | 'bride'` – rather than through `AvatarEmotion`, which
> `avatarCropPath` is total over and may never be made to name a file that is not on disk. The
> paragraph's own caution was checked and answered: **nothing persisted was touched**, because
> `MemoryCard` is built by `toSnapshot` and saved nowhere, and `SAVE_SCHEMA_VERSION` did not move.
> **The ALBUM still cannot draw her:** `AlbumPage.emotion` is still `AvatarEmotion`, deliberately, so
> A6 below is unchanged and still a proposal. What the wiring adds is the ONE thing a page would
> need next – an explicit band fallback (`paintedFaceFor`), so `lateCareer` shows a woman of
> thirty-one rather than a 404. See `shared/avatarEmotion.ts`.

⚠ **The special faces are NOT reachable from an album page.** `bride`, `graduated`, `funeral`,
`farewell`, `retired`, `training` and the two `pregnant` paintings are outside `AvatarEmotion`, so
drawing one on a polaroid means widening that union – and `adult-bride` in particular is painted,
on disk, and referenced by **nothing in `src/`** today (the wedding's own 23+ minimum was ruled
because of it: `economy.ts` and `lifeBeat.ts` both say so). A wedding page that showed the bride
would be the first consumer that painting has ever had. ⚠ Before building that, check whether
`AvatarEmotion` reaches any persisted structure; the band (`PortraitStage`) provably does not
(`avatarEmotion.ts`'s own note), and the emotion appears to be snapshot-only, but that is a claim to
verify rather than inherit.

## 4. The proposal – numbered pages, every one a DRAFT

⚠ **The COUNT is his and so is every sentence.** These are candidates with their coverage, their
era and the art they would draw, so he can pick a set and a number. The copy is drafted so the
proposal is concrete, and every line is `⚠ DRAFT – awaiting his pass`; the strings table's §9
carries the same rows for the вычитка.

The four eras that are starving, and what is available in each:

| # | the page | when it fires | coverage | median age / band | the art it draws |
| ---: | --- | --- | ---: | --- | --- |
| **A1** | **The last day of school** | the `school` milestone | **96%** | 18 / `teen` | `teen-happy` |
| **A2** | **The first house** | `house-first`'s `boughtWeek` | **93%** | 18 / `teen` | `teen-happy` |
| **A3** | **Her name on something** (the brand) | `merch-brand`'s `boughtWeek` | **93%** | 19 / `teen` | `teen-serious` |
| **A4** | **The academy begun** | `academy-land`'s `boughtWeek` | **78%** | 20 / `teen` | `teen-serious` |
| **A5** | **The academy finished** | `academy-staff`'s `boughtWeek` | 37% ordinary · 59% long | 23.5 / `adult` | `adult-happy` |
| **A6** | **Her wedding** | the `wedding` milestone | 19% ordinary · **74% long** | 25 / 33 · `adult`/`lateCareer` | `adult-happy` today, `adult-bride` if the union widens |
| **A7** | **The first trip abroad** | the `international` milestone | **100%** | 14 / `young` | `young-happy` |
| **A8** | **The season she stood highest** | the best season CLOSE on her own table | 100% | varies | by age |

Drafted copy, in the shape every existing page has (`why` – the rule, printed on the page; `caption`
– the handwriting on the polaroid's lip; `fact` – the line underneath):

| # | `why` (the selection rule, shown) | `caption` | `fact` |
| ---: | --- | --- | --- |
| A1 | The last year of school – it ends once, and it ended here | We put the uniform away | The last school year is over, `<season>` |
| A2 | The first thing the tennis bought that was not tennis | A door of our own | `<season>` – `<price>` |
| A3 | The week her name went on something | Somebody printed her name | `<season>` – the first of it |
| A4 | The week the academy was only a field | We bought the ground | `<season>` – `<price>` |
| A5 | The week the academy was finished | It opened | `<season>` – `<n>` of `<n>` stages standing |
| A6 | Her wedding day | The whole family was there | `<season>`, aged `<age>` |
| A7 | The first time she left the country to play | The passport we had just got her | `<tier>`, `<season>` |
| A8 | The highest she ever stood at a season's close | Number `<rank>` | #`<rank>` at the close of `<year>` |

⚠ **A8 is not a new page, it is slot 4's FALLBACK promoted.** `slotBestWeek` already computes it and
already has his approved copy for it; it only ever renders for a career that never won a title.
Promoting it to a page of its own is the cheapest way to add an adult-era picture with no new
sentence at all – but it puts the same text on two pages of some albums, which is a layout decision
and his.

⚠ **A6 must not be a page on a career where nothing happened.** The wedding covers 19% of ordinary
careers, so seven of eight albums would carry an empty face with a sentence about a wedding that
never was. Slot 3's empty face is deliberate and measured (`SLOT6_EMPTY_WHY`'s own note); an empty
face at eight to one is a different object. **The ask this raises is the real design question**: does
the album keep FIXED slots, where a sparse page is empty most of the time, or does it become a
SELECTED set, where a career shows the pages it can fill? The second is what «более гладко» would
need, and it is exactly the «концептуально другое» he has reserved.

## 5. Why nothing was built

**Every one of the seven slots is a superlative or a first, and five of them are pinned by their own
sentence to a moment that cannot move**: week 0, the earliest title, the earliest cheque, the
break-even week, the last week. There is no era-balancing to be done inside them.

The one slot that looked like it had freedom was measured and does not. Slot 4 takes the highest
rung she ever won on; when a rung is won several times the tie is broken by taking the FIRST, and
the LAST would be equally true of every word on the page. **Measured over 27 careers it would move
the page later on ZERO of them**, because the highest rung a career reaches is won exactly once –
which is how it comes to be the highest. So that lever is a null result and is recorded as one.

What is left is the page COUNT and the page COPY, and both are his by invariant 4 and by his own
reservation of this design. Building an era-balanced selector behind seven pages that cannot use it
would be dead code; changing what a slot MEANS is writing him a new sentence. So the instrument, the
numbers and the proposal are the deliverable, and the branch touches no `src/` file for this item.

## 6. Open questions for him

1. **How many pages?** Seven was sized for a 14→18 career. Eight to ten covers §4's starving eras
   without the pager becoming a scroll; the measurement does not pick a number and neither does this.
2. **Fixed slots, or a selected set?** §4's note under A6. This is the fork the whole item rests on
   and it is the one he has already reserved.
3. **Does the album get the special faces?** `adult-bride` is painted and unwired; `graduated`,
   `farewell` and `retired` are painted and used nowhere near the album. Widening `AlbumPage.emotion`
   is a small change with an art check in front of it.
4. **Should the money pages carry a figure?** A2 and A4's drafts print a price. The album's existing
   money page (slot 6) does, so the precedent is there – but a house's price on a polaroid is a
   different register from the career's break-even.
