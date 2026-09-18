---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-18
---

# Wave 7 – every player-facing string the wave adds (the вычитка table)

The wedding wave's whole copy set, in one place, for the architect's read and the owner's playtest.
T7 of [the wave-7 builder brief](life-wave-7-builder-2026-09.md); the shape and the rigour are
[wave 5's](life-wave-5-strings-2026-09.md) and [wave 6's](life-wave-6-strings-2026-09.md) strings
documents, which are this file's template.

**Not one shipped string moved in this wave.** Every row below is an ADDITION, quoted **verbatim
from the tree**, and every one is a **DRAFT – awaiting his pass** (invariant 4): nothing here ships
as approved until his word, and the PR says so. The engagement's answer prices, the wedding's cost
(since RULED OUT, 18.09 – §2's note), the hazard and the spouse deltas are NUMBERS, not strings –
they ride T8's bench and are out of this table's scope on purpose (the brief's §4 contract names
them).

**Provenance.** The rows were transcribed from the working tree and reconciled against the wave's
own draft flags: `git diff 1b9eb2b1..HEAD -- src/ | grep '⚠ DRAFT'` at the close of T10 shows every
flagged site, and §6 walks that list against this table – a draft in code missing here is a defect
of T7, and none is missing. The two flagged NON-strings (a portrait-emotion pick and the drafted
constants) are carried in §5 rather than silently dropped.

## 0. The count

| | |
| --- | ---: |
| player-facing **strings** the wave ADDED to the tree | **65** |
| of them **ruled** | **0** |
| of them **draft – awaiting his pass** | **65** |
| removed by his ruling after transcription (18.09 – W2, §2's note) | **1** |
| shipped strings that **MOVED** | **0** |
| per task | T2 **16** · T3 **2** + the 28-name pool · T5 **13** · T10 **6** |
| flagged **non-string** drafts carried in §5 | the memory-face pick · the drafted numbers |

---

## 1. T2 – the engagement beat (`'engaged'`)

`src/engine/world/lifeBeat.ts` – **16 strings**, all draft. She announces; the parent reacts. The
quoted span is shared between the two presences by the вычитка's own law (what presence changes is
the frame, never her sentence). ⚠ No name and no gender in any cell – the name is WRITTEN at this
beat (`partnerNameFor`) but which surfaces SPEAK it is §5 Q-2, his.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| E1 | `lifeBeat.ts` · `ENGAGED_HER_LINE.sunny.roof` | the `'engaged'` card's line while she lives under the roof, bond `close`/`steady`, voice `sunny` | She sat us down at the table and could not keep it in past the kettle. "We are getting married. I wanted you to hear it from me first." | `DRAFT – awaiting his pass` |
| E2 | `ENGAGED_HER_LINE.sunny.away` | the same card from college/independence – the call frame | She called before we had even asked about the week. "We are getting married. I wanted you to hear it from me first." | `DRAFT – awaiting his pass` |
| E3 | `ENGAGED_HER_LINE.fiery.roof` | as E1, voice `fiery` | She came in already talking. "We are getting married. Yes, we are sure. No, we are not waiting." | `DRAFT – awaiting his pass` |
| E4 | `ENGAGED_HER_LINE.fiery.away` | as E2, voice `fiery` | She rang, and led with it. "We are getting married. Yes, we are sure. No, we are not waiting." | `DRAFT – awaiting his pass` |
| E5 | `ENGAGED_HER_LINE.quiet.roof` | as E1, voice `quiet` | She said it while she was clearing the table, as if it were about the schedule. "We are getting married. In a couple of months, probably." | `DRAFT – awaiting his pass` |
| E6 | `ENGAGED_HER_LINE.quiet.away` | as E2, voice `quiet` | She sent the season's dates through, and this was at the top of the message. "We are getting married. In a couple of months, probably." | `DRAFT – awaiting his pass` |
| E7 | `ENGAGED_HER_LINE.deep.roof` | as E1, voice `deep` | She waited until the room had gone quiet and said it once. "We are getting married. I have thought about it. It is right." | `DRAFT – awaiting his pass` |
| E8 | `ENGAGED_HER_LINE.deep.away` | as E2, voice `deep` | She let the call run almost to the end and said it before goodbye. "We are getting married. I have thought about it. It is right." | `DRAFT – awaiting his pass` |
| E9 | `ENGAGED_DRY` | the same card at `strained`/`cold` – the dry rung, not one word of hers | She is getting married. The news reached this house second-hand. | `DRAFT – awaiting his pass` |
| E10 | `ENGAGED_HEADING` | the parent's frame over the card, every bond band, every week | A wedding is coming, and she has made up her mind | `DRAFT – awaiting his pass` |
| E11 | `LIFE_BEAT_OPTIONS.engaged[0]` (`bless`) | the card's first answer button (+2.5 on `bond`, the drafted number – T8's bench) | Give them our blessing | `DRAFT – awaiting his pass` |
| E12 | `LIFE_BEAT_OPTIONS.engaged[1]` (`distance`) | the second button (−1) | Say it is her decision, and step back | `DRAFT – awaiting his pass` |
| E13 | `LIFE_BEAT_OPTIONS.engaged[2]` (`oppose`) | the third button (−4) | Tell her we think it is a mistake | `DRAFT – awaiting his pass` |
| E14 | `ANSWER_EVENT.engaged.bless` | the feed's `info` row after answering `bless` | She said she is getting married. We gave them our blessing. | `DRAFT – awaiting his pass` |
| E15 | `ANSWER_EVENT.engaged.distance` | the same row after `distance` | She said she is getting married. We said it is her decision, and stepped back. | `DRAFT – awaiting his pass` |
| E16 | `ANSWER_EVENT.engaged.oppose` | the same row after `oppose` | She said she is getting married. We told her we think it is a mistake. | `DRAFT – awaiting his pass` |

⚠ **E14–E16 open on the same clause**, the `met`/`ended` pools' established parallel shape, kept
deliberately (the `'ended'` pool's own T6 note records the same call and the same open question).

## 2. T3 – the wedding lands

`src/engine/world/lifeBeat.ts` (`landWedding`), `src/engine/world/album.ts` – **2 strings** (a
third, W2, was removed by ruling – the note under the table).

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| W1 | `lifeBeat.ts` · `landWedding`'s `fireMilestone` text | the KEPT feed line on the wedding week – survives every prune, once per episode | Her wedding day. The family was there, whatever had been said about it. | `DRAFT – awaiting his pass` |
| W3 | `album.ts` · `SCROLL_LABEL.wedding` | the album scroll's label for the `'wedding'` milestone; the detail cell is deliberately empty (the milestone's `kind` is the episode id, a machine value) | Her wedding | `DRAFT – awaiting his pass` |

⚠ **W2 – removed by his ruling, 18.09.** The row carried the Money ledger's expense line for the
drafted `ECONOMY.wedding.costCents` – «The wedding – the family's side of the day» – until his word
closed the spec's Q-1 while T8's numbers were in front of him: «я думаю как с подарками, никто и
нисколько» – like the gifts, nobody pays and nothing. The charge and its ledger event left the
engine; [the wedding spec](../specs/the-wedding-2026-09.md) §3c keeps the measurement of what the
drafted $12,000 weighed. W1 and W3 keep their numbers so earlier reads of this table stay legible.

### 2a. The partner name pool – 28 names, every one a draft

`src/engine/world/lifeBeat.ts` · `PARTNER_NAME_POOL`. Drawn once per episode at the engagement on
`seed:life:partner-name:<episodeId>`, persisted, never re-derived – so his pass can EDIT the pool
for future careers, but a name a save already holds stays held. Single tokens only, no surname
anywhere in the wave, so no real person's name is constructible (house trademark law by
construction). ⚠ Append-only once shipped: the draw indexes by pool length.

| # | the names, verbatim, in draw order | |
| ---: | --- | --- |
| N1–N8 | Anton · Bruno · Casper · Daniel · Elias · Felix · Gabriel · Henrik | `DRAFT – awaiting his pass` |
| N9–N16 | Ivo · Jonas · Karel · Lukas · Matteo · Niko · Oskar · Pavel | `DRAFT – awaiting his pass` |
| N17–N24 | Rafael · Samuel · Tomas · Viktor · Willem · Xavier · Yann · Zeno | `DRAFT – awaiting his pass` |
| N25–N28 | Andrei · Marco · Ruben · Stefan | `DRAFT – awaiting his pass` |

⚠ **No surface speaks any of these yet.** The name is persisted and no card, row or label prints it
– that is §5 Q-2, deliberately left for his ruling rather than defaulted.

## 3. T5 – the spouse's opinion surface (`'spouse-view'`)

`src/engine/world/lifeBeat.ts`, `src/engine/diary/weekNotes.ts` – **13 strings**. The first pool in
the layer whose speaker is neither her nor staff. ⚠ Every reference to him is «the one she married»
– gender-free and name-free until §5 Q-1/Q-2 are ruled. ⚠ No figure anywhere (the `money` occasion
says «a large bill» and stops).

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| S1 | `lifeBeat.ts` · `SPOUSE_VIEW_SAID['distant-swing']` | the card's line when the next entered event crosses a border | The one she married stayed back after the plates were cleared. "The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer." | `DRAFT – awaiting his pass` |
| S2 | `SPOUSE_VIEW_SAID['road-stretch']` | when the family paid travel in 4+ of the trailing 12 weeks (the friends tile's own band) | The one she married said it plainly, on a quiet evening. "The family has been on the road for weeks now. The house does not really get lived in between the trips." | `DRAFT – awaiting his pass` |
| S3 | `SPOUSE_VIEW_SAID['no-vacation']` | on the season-wrap week spirit.ts prices −3/−3 – a season with no family week | The one she married brought it up as the season closed. "A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all." | `DRAFT – awaiting his pass` |
| S4 | `SPOUSE_VIEW_SAID.money` | a large family spend after the wedding while her account holds more than the wallet | The one she married asked it without an edge. "That was a large bill, and the season sits in her account now. I am not counting anybody's money. I am asking how this house plans." | `DRAFT – awaiting his pass` |
| S5 | `SPOUSE_VIEW_HEADING` | the parent's frame over the card, every occasion | The one she married has something to say about this season | `DRAFT – awaiting his pass` |
| S6 | `SPOUSE_VIEW_CARD` | the Home card's invitation while the row is live (three weeks) | The one she married wants a word. | `DRAFT – awaiting his pass` |
| S7 | `LIFE_BEAT_OPTIONS['spouse-view'][0]` (`hear`) | the first answer button (+1 on `bond`, drafted) | Say the point is fair, and talk it through | `DRAFT – awaiting his pass` |
| S8 | `LIFE_BEAT_OPTIONS['spouse-view'][1]` (`level`) | the second (−0.5) | Say the season is what it is | `DRAFT – awaiting his pass` |
| S9 | `LIFE_BEAT_OPTIONS['spouse-view'][2]` (`brush`) | the third (−1.5) | Say there is nothing to worry about | `DRAFT – awaiting his pass` |
| S10 | `weekNotes.ts` · the `spouseSpoke` band, `distant-swing` line | the diary scrap on the raise week (the coin rations it like every ordinary-week band) | The one she married would like the season nearer home. We heard it. | `DRAFT – awaiting his pass` |
| S11 | the same band, `road-stretch` line | as S10 | A word at home about the weeks on the road. It was not unfair. | `DRAFT – awaiting his pass` |
| S12 | the same band, `no-vacation` line | as S10 | The one she married asked for one week of the year. That was all. | `DRAFT – awaiting his pass` |
| S13 | the same band, `money` line | as S10 | A careful question at home about a large bill. Nobody raised a voice. | `DRAFT – awaiting his pass` |

⚠ **S7–S9 are ONE answer set for all four occasions** – tier 1's own shipped precedent («three
parent moves that fit a worry, a joy or a question alike»). Per-occasion labels are one overlay away
(`lifeBeatOptionsFor`'s fourth parameter, round 42 #15's machinery) – §5 Q-3, his call, not taken.

## 4. T10 – the independent-life beat (`'own-key'`)

`src/engine/world/lifeBeat.ts`, `src/engine/diary/weekNotes.ts` – **6 strings**, one-time,
narrative-only. ⚠ The card quotes nobody, which is what keeps the one-cell pool inside the voice
law; a voiced line of hers here is §5 Q-4.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| K1 | `lifeBeat.ts` · `OWN_KEY_SAID` | the card's one line, on the first `independent`-stage week | She has a place of her own now. A spare key went onto the hook by our door, and Sunday dinner is a standing thing. | `DRAFT – awaiting his pass` |
| K2 | `OWN_KEY_HEADING` | the parent's frame over it | She lives behind her own door now | `DRAFT – awaiting his pass` |
| K3 | `OWN_KEY_CARD` | the Home card's invitation (three weeks) | She came by with a spare key. | `DRAFT – awaiting his pass` |
| K4 | `OWN_KEY_ROW` | the KEPT `life` feed row, once per career, white-heart marked until he picks a glyph | She has her own place now. A spare key lives on the hook, and Sunday dinner stands. | `DRAFT – awaiting his pass` |
| K5 | `LIFE_BEAT_OPTIONS['own-key'][0]` (`keep`) | the card's single zero-priced acknowledgment | Put the key on the hook | `DRAFT – awaiting his pass` |
| K6 | `weekNotes.ts` · the `ownKey` line | the diary scrap on the raise week | She has her own front door now. The spare key went onto our hook. | `DRAFT – awaiting his pass` |

---

## 5. Questions for the owner – wording his table decides

1. **⚠⚠ What is the spouse CALLED on screen?** Every T5/T10 draft says «the one she married» –
   gender-free by the standing law (`LoveEpisode` persists a name, never a gender; the `engaged`
   pools' own rule). «Her husband» would read naturally and the whole name pool is male – but that
   word puts a fact on screen the schema deliberately does not hold, so it is his to license, not a
   draft's to assume. One word, ~10 sites, after his ruling.
2. **Do any surfaces speak the persisted `partnerName`?** Written at the engagement, held on the
   row, printed NOWHERE – the beat card, the wedding line, the album and the spouse cards all keep
   the unnamed phrasing. Which surfaces (if any) say «Anton» is the ruling T3 deliberately left him.
3. **Per-occasion answer labels for the spouse card** – §3's note: the machinery exists
   (`lifeBeatOptionsFor`'s label overlay), the drafts here are one set for all four occasions, and
   widening is a wording decision plus twelve more drafted labels the day he wants them.
4. **A voiced line of hers on the own-key card** – §4's note: today the card is the parent's
   narration by design (one cell, no voice axis). Her own sentence there means four voices x two
   presences, the standing completeness law.
5. **Two flagged NON-strings ride other gates, named so nothing hides.** ⭐ **The first is CLOSED,
   18.09, and the draft flag is what closed it.** The wedding memory's portrait face was
   `MEMORY_EMOTION.wedding = 'happy'`, flagged as a drafted PICK whose argument read «the bride art
   the 11.09 ruling gated the whole branch on is painted smiling» – right about the painting and
   wrong about which painting was being drawn, because `'happy'` is her ordinary adult face. It is
   now `'bride'`: `fem-euro-brunnet-adult-bride.webp`, which had been on disk since the art set
   shipped and referenced by nothing in `src/`. ⚠ **No string moved and none was added** – it is a
   picture, not a word – and a band the bride is not painted for falls back to that band's own
   neutral portrait rather than 404ing. Every drafted NUMBER of the wave (`ECONOMY.wedding` whole,
   including T5's `spouseViewCooldownWeeks` 10, `spouseViewSpendCents` $2,500 and the three deltas
   +1/−0.5/−1.5) rides T8's bench per the brief's §4 contract – measured first, ruled after.

## 6. The reconciliation – code drafts against this table

The sweep: every `⚠ DRAFT` flag the wave added under `src/` (`git diff 1b9eb2b1..HEAD -- src/`,
read at the close of T10). Verdict: **every flagged string site has rows above; no row above lacks
its flag in code.**

| flagged site (file · what) | rows here |
| --- | --- |
| `lifeBeat.ts` §3g banner + `ENGAGED_HER_LINE` / `ENGAGED_DRY` / `ENGAGED_HEADING` | E1–E10 |
| `lifeBeat.ts` `LIFE_BEAT_OPTIONS.engaged` (three `⚠ DRAFT` rows) | E11–E13 |
| `lifeBeat.ts` `ANSWER_EVENT.engaged` (three `⚠ DRAFT` rows) | E14–E16 |
| `lifeBeat.ts` `landWedding` (the kept line; the ledger line left with the 18.09 ruling – §2's note) | W1 |
| `album.ts` `SCROLL_LABEL.wedding` | W3 |
| `lifeBeat.ts` `PARTNER_NAME_POOL` | N1–N28 |
| `lifeBeat.ts` §3h banner + `SPOUSE_VIEW_SAID` / `_HEADING` / `_CARD` | S1–S6 |
| `lifeBeat.ts` `LIFE_BEAT_OPTIONS['spouse-view']` (three `⚠ DRAFT` rows) | S7–S9 |
| `weekNotes.ts` the `spouseSpoke` band («EVERY LINE HERE IS A DRAFT») | S10–S13 |
| `lifeBeat.ts` §3i banner + `OWN_KEY_SAID` / `_HEADING` / `_CARD` / `_ROW` (+ the `deliverOwnKey` `⚠ DRAFT (§3i)` reference) | K1–K4 |
| `lifeBeat.ts` `LIFE_BEAT_OPTIONS['own-key']` | K5 |
| `weekNotes.ts` the `ownKey` line | K6 |
| `diary/facts.ts` `MEMORY_EMOTION.wedding` – a PICK, not a string (⭐ CLOSED 18.09 – it is `'bride'` now; §5.5) | §5.5 |
| `economy.ts` `ECONOMY.wedding` – NUMBERS, «draft for the bench» | §5.5 |

Three additions the sweep shows that are deliberately NOT rows, with the reason: the engine's
invariant throw messages (`A spouse-view row carries no occasion: …` and its siblings) are
unreachable through any interface and follow the standing precedent of every prior wave's tables,
which carried none of their kind; the `'engaged'`/`'spouse-view'`/`'own-key'` rows in `DRAIN_ANSWER`
and the tests' transcribed literals are harness material, not player copy; and the wave-7 doc
comments themselves flag rules, not strings.

---

## 7. Round 46 items 9/10 – the epilogue's reckoning (⚠ OUTSIDE the wedding wave's count)

⚠ **These rows are NOT part of §0's 65.** They arrived on the same branch from a different intake –
the owner's 18.09 report on his finished career («наша математика затрат и заработков… Эта
математика критична») – and they are carried here because this is where the wave's copy is read, not
because they belong to T7. §0's count, its per-task split and §6's reconciliation are all about the
wedding and are unchanged by this section.

**Two additions, both draft. Not one shipped string moved.** The five labels the owner wrote on that
page – `Won`, `Spent`, `Seasons`, `Best rank`, `Titles` – are untouched, and
`tests/component/round46-the-reckoning.test.ts` asserts them present, unmoved and in his order. What
changed under two of them is the FIGURE, which is the fix: «Spent» now prints the money that left
the family for good rather than every cent that ever left the wallet (see
[the-reckoning-2026-09.md](../specs/the-reckoning-2026-09.md)).

| # | home (`file` · what) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| R46-1 | `EndingScreen.vue` · the epilogue totals `<dl>` | on the album's last page, only when her own account ever received a cheque | Her account | `DRAFT – awaiting his pass` |
| R46-2 | `EndingScreen.vue` · the same `<dl>` | on the album's last page, only when the family still owns something | Still owned | `DRAFT – awaiting his pass` |
| R46-7 | `EndingScreen.vue` · the same `<dl>`, between `Still owned` and `Seasons` | on the album's last page, on **every** career – a family that owns nothing still has a wallet | Family's portfolio | `DRAFT – awaiting his pass` |

⚠ **R46-7 is the row his ruling A of 18.09 asked for** – «А отдельной строчкой напишем целиковый срез
портфеля семьи по деньгам в кошельке и всем магазине на круг». The figure is the wallet plus the
whole shelf at value (`careerMoney.portfolioCents`); the reasoning and the measurement are in
[the-reckoning-2026-09.md](../specs/the-reckoning-2026-09.md) §7c. Two things about the WORD, both
his to move:

* **the article is dropped to match R46-3**, the row he renamed four lines above it on the same day.
  `The family's portfolio` is the other spelling and is equally available.
* **«portfolio» is his own noun** («портфель»), chosen over an invented plainer word precisely
  because picking his is the safest thing a draft can do. If he wants the page's plainer register –
  `Spent`, `Seasons`, `Titles` – the one-word alternative is `All told`.

⚠ **And one question the row raises rather than answers:** `Still owned` (R46-2) is now a strict
subset of it – the two differ only by the wallet. Dropping R46-2 would be tidier and was **not**
done, because nothing asked for it.

### 7a. The wording MISMATCH carried for him rather than fixed

The epilogue's **«Won»** is `careerTotals.prizeCents` – *the family's half* of every prize cheque.
It reads as «what the tennis paid», and on a measured career it was $17,164,973 beside $28,749,334
sitting in HER account, which is why he could not place the figure. **The gross cannot be derived**:
her share leaves before the wallet sees it, and reconstructing it by dividing a rounded net by the
ramp rate is the arithmetic `accrueKidShare` forbids in capitals.

So the number stays what it honestly is, R46-1 states the other half beside it, and the label is his
to rule on. A draft, if he wants the row renamed rather than explained:

| # | home | today | the draft | |
| ---: | --- | --- | --- | --- |
| R46-3 | `EndingScreen.vue` · the first totals label | `Won` | `Family's share` | ⭐ **RULED 18.09 – twice. «да, пойдет» took the draft; «давай Family's share напишем?» is the SPELLING, and it is what ships.** The figure has never moved |

⚠ **R46-3 was ruled twice in one day and the second ruling is the one in the tree.** The draft put to
him read `The family's share`; his own sentence later that day dropped the article, and a spelling he
writes himself is the end of the question. Both moves are his, neither figure moved, and the pin in
`tests/component/round46-the-reckoning.test.ts` carries the dated note beside the assertion – which
is the only thing that makes a wording diff accountable, since a pin asserts what the string IS and
therefore moves with it and stays green.

⚠ **The rename is the epilogue's label and nothing else, which is invariant 4 read strictly.** Two
other surfaces print the same `prizeCents` and neither is the string he ruled on, so neither moved:
`ForkDialog.vue`'s label is **«The tennis has paid»**, and the album's slot 6 says «$X won against
$Y spent» in PROSE. Widening a ruling about one label to every surface that happens to share its
figure is the agent-initiated wording change invariant 4 exists to forbid. If he wants either of
those to follow, that is a separate ask and a separate row.

### 7b. ⭐ RULED 18.09 – the spoken plus goes (round 45 #3b, the question §8c left open)

The chemistry gauge lost its drawn plus on 18.09 and the row's spoken name kept both signs, with the
reason recorded in `docs/specs/the-chemistry-2026-09.md` §8c and the question put to him. His answer:

> «да, потому что все числа по умолчанию положительные, а отрицательные как раз озвучиваются
> дополнительно.»

| # | home (`file` · what) | today | ruled | |
| ---: | --- | --- | --- | --- |
| R45-3c | `CoachMarketScreen.vue` · the coach row's `aria-label`, the chemistry clause | `, chemistry +33%` | `, chemistry 33%` | ⭐ **RULED 18.09. SHIPPED.** The minus is untouched – a negative reading still says `, chemistry -33%` |

⚠ Nothing else about the clause moved: it is the same sentence, the same figure and the same percent
sign, one character shorter upward. `chemSpoken` now delegates to `chemDrawn`, so the two surfaces
cannot drift apart again.

### 7c. ⚠ DRAFTS, NOT BUILT – the per-table best ranks his ruling 1 opens

His refusal of the persisted running minimum came with a second sentence that is a NEW ask:

> «достаточно лучшего ранга по итогам сезона, они у нас все есть, **можно даже все ранги перечислить
> из каждого уровня чемпионатов отдельно**.»

⭐⭐⭐ **RULED AGAIN LATER THE SAME DAY (ruling C) – and the ENGINE HALF IS NOW BUILT.** His second
sentence came back as «Остальные отдельно ниже можно написать или на отдельных слайдах до этого», and
`bestRankOn(world, track)` ships: one fold, the table handed in, all three available, `null` for a
table she never touched. The same ruling moved the PRIMARY row's table – it reads the highest ladder
she ever reached now, not the one she is on ([the-reckoning-2026-09.md](../specs/the-reckoning-2026-09.md)
§8) – and **no string moved for that**, because `Best rank` still prints one number.

**The engine needs nothing built.** `bestRankOn(world, track)` and `bestSeasonClose(world, track)`
both take the table as an argument, `SeasonHistoryEntry.byTrack` (v46) carries an `endRank` for each
of the three, and every table already has a shipped player-facing name in `LADDER_LABEL` (`National`,
`International`, `Professional`). What it needs is **one row on the epilogue becoming three**, which
is a layout decision, and **labels that say these are BESTS** – because `Best rank` cannot survive
being split three ways, and three rows named after the tables alone read as her CURRENT standings.

⚠ **And the layout cost went UP this morning, which is why R46-4/5/6 still have not shipped.** The
same `<dl>` gained R46-7 (the portfolio) under ruling A, so it now carries **eight** rows at 375px
before any split. Three-for-one on top of that is a page decision, not a builder's.

Both are his. Measured on the probe career, the three rows would read #10 / #14 / #12 – against the
single #12 the page prints today, which says nothing about the child who was third in the country at
fourteen.

| # | home (`file` · what) | the draft label | |
| ---: | --- | --- | --- |
| R46-4 | `EndingScreen.vue` · the totals `<dl>`, replacing the single `Best rank` row | `Best at home` | `DRAFT – not built` |
| R46-5 | the same `<dl>` | `Best in the world` | `DRAFT – not built` |
| R46-6 | the same `<dl>` | `Best as a professional` | `DRAFT – not built` |

⚠ An alternative costing one row instead of three, if he prefers it: keep `Best rank` exactly as it
is and let its VALUE carry the list – `#3 National · #8 International · #11 Professional`. Fewer
rows, a longer line at 375px, and the separator is itself new copy. See
[the-reckoning-2026-09.md](../specs/the-reckoning-2026-09.md) §4b for the measured table and the
one content caveat (a save migrated from before v46 can answer for the International table only).

---

## 8. Round 47 item 12 – «Raise another» goes to the beginning (⚠ OUTSIDE §0's count)

⚠ **No row here is an addition. This section exists because the item REMOVES copy, and invariant 4
is why a removal is written down rather than assumed.** Same intake as §7 – his 18.09 report on the
finished career – and the same reason for living here: this is where the wave's copy is read.

His sentence, verbatim, and it is the authority for everything below:

> «еще момент по финалу: Raise another стартует с 13 лет сразу, мне кажется там тоже надо просто на
> начало отправлять и всё.»

**What was measured first** (`tests/component/r47-raise-another-route.test.ts`, which mounts the whole
shell): the epilogue's own handler called `game.newCareer(...)` and emitted afterwards. Creating the
career published a snapshot with no `ending`, so `showEnding` went false and the takeover was
unmounted before the event could reach `App.vue` – the shell was already drawing HomeScreen on a
week-0, thirteen-year-old career, and the parent's handler never ran. The route was not «the wizard»
that App.vue's own comment claimed; it was straight into the game, which is exactly what he saw.

**The route now**: one press, no career created here, and the shell hands the player to the
CHILDHOOD – the same beginning a first-ever launch gets. ⚠ The onboarding TOUR is a different thing
that happens to share that route and is **not** re-offered: it is «once, ever, per device» by his own
ruling, keyed on a device flag the new route deliberately does not touch.

### 8a. The one label that stayed, and the copy the route retired

| # | home (`file` · what) | the string, verbatim | |
| ---: | --- | --- | --- |
| R47-1 | `EndingScreen.vue` · the hand-off's control | `Raise another` | **UNMOVED – his, untouched.** One press now instead of two |

| # | home | the string that is GONE, verbatim | why it could not survive the route | |
| ---: | --- | --- | --- | --- |
| R47-2 | `EndingScreen.vue` · the hand-off's lead | `Nothing carries over. A new daughter, and one question: what the family starts with.` | It promises ONE question and a generated daughter. The beginning asks the family's size on its first card and her name, her birthday and her country beside it, so the sentence is false the moment the press lands there | `REMOVED – his sentence is the authority; flagged for his pass` |
| R47-3 | the three capital cards | `Wealthy` / `Top academies are within reach.` · `Middle class` / `Smart choices, steady progress.` · `Working class` / `Big dreams, hard mode.` | The prologue's first card has asked exactly this question (its three origins) since it shipped. Kept here it would be the same question asked twice, and the player's answer to the first would be overwritten by the second | `REMOVED – same authority; flagged for his pass` |

> ⭐⭐⭐ **RULED 18.09 – R47-2 and R47-3 are ANSWERED, and the answer is in §10.** The removal stands
> («окей, есть пролог, кто захочет – пропустит») and the three capital sentences are KEPT for reuse
> («а вот эти фразы можно использовать у нас где-то…»). ⚠ **They were never lost** – they are the
> onboarding wizard's own blurbs and always have been, and the wizard is the very «экран мимо
> пролога» he named. §10 carries all three verbatim, where they live, and why the prologue's own
> notes were not overwritten with them.

⚠ **If he wants either back**, the cheapest shape is not a re-instatement: it is carrying the band he
picks into the childhood as a preselected origin (a prop on `ChildhoodPrologue`, one line at the
call site). That was considered and NOT built, because the lead sentence still could not say «one
question» and a screen whose promise is false is worse than a screen with one control on it. His
call.

⚠ **Nothing else on the epilogue moved.** The five reckoning labels, «The whole record», the academy
and lifetime-deal notes, `Another year –` on the college branch and every album page are byte
identical – `tests/component/endings-ui.test.ts` still mounts and asserts them.

---

## 9. Round 47 item 11 – the album's spread (⚠ DRAFTS, NOT BUILT, outside §0's count)

⚠ **Not one of these strings is in the tree.** They are the concrete shape of a PROPOSAL, carried
here so his вычитка can read them beside the wave's real copy; the measurement behind them and the
reason nothing was built are in
[the-album-spread-2026-09.md](../specs/the-album-spread-2026-09.md). His sentence:

> «странный набор фотографий на 7 шагов: 6 детских и юношеских и 1 взрослая в конце. Предлагаю
> как-то более гладко сделать и можно чуть больше фоточек из разных периодов. Можно например добавить
> стройку академии (если была) или еще какие-то значимые даты.»

**Measured and confirmed** (27 careers, ordinary arm): median **6 of 7** faces are jun/young/teen and
1 is adult, and 13 albums in 27 are exactly his six-and-one. **The page COUNT is his**, so the pages
below are candidates rather than a set, and every one is `⚠ DRAFT – not built`.

Each page has the three parts every shipped page has: `why` (the selection rule, printed on the
page – never optional, §9.1's law), `caption` (the handwriting on the polaroid's lip) and `fact`
(the line underneath). `<angle brackets>` are values the engine already holds.

| # | the page · when it fires · coverage | `why` | `caption` | `fact` | |
| ---: | --- | --- | --- | --- | --- |
| A1 | the last day of school · the `school` milestone · 96%, age 18 | The last year of school – it ends once, and it ended here | We put the uniform away | The last school year is over, `<season>` | `DRAFT – not built` |
| A2 | the first house · `house-first.boughtWeek` · 93%, age 18 | The first thing the tennis bought that was not tennis | A door of our own | `<season>` – `<price>` | `DRAFT – not built` |
| A3 | the brand · `merch-brand.boughtWeek` · 93%, age 19 | The week her name went on something | Somebody printed her name | `<season>` – the first of it | `DRAFT – not built` |
| A4 | the academy begun · `academy-land.boughtWeek` · 78%, age 20 | The week the academy was only a field | We bought the ground | `<season>` – `<price>` | `DRAFT – not built` |
| A5 | the academy finished · `academy-staff.boughtWeek` · 37% / 59% long, age 23.5 | The week the academy was finished | It opened | `<season>` – `<n>` of `<n>` stages standing | `DRAFT – not built` |
| A6 | her wedding · the `wedding` milestone · 19% / 74% long, age 25 / 33 | Her wedding day | The whole family was there | `<season>`, aged `<age>` | `DRAFT – not built` |
| A7 | the first trip abroad · the `international` milestone · 100%, age 14 | The first time she left the country to play | The passport we had just got her | `<tier>`, `<season>` | `DRAFT – not built` |
| A8 | the best season close · promoted from slot 4's fallback · 100% | *his own approved copy, unchanged* | *unchanged* | *unchanged* | **NO NEW STRING** |

⚠ **A8 costs no copy at all.** It is `slotBestWeek`'s existing fallback – «She never won a title –
this is the highest she ever stood» / «Number `<rank>`» / «#`<rank>` at the close of `<year>`» –
which today only renders for a career that never won anything. Promoting it to a page of its own
adds an adult-era picture with nothing to proof-read, at the price of two pages of some albums
carrying the same sentence.

⚠ **A6's art – AMENDED 18.09, and half the obstacle is gone.** `adult-bride` is painted, is on disk,
and is no longer referenced by nothing: the wedding's **memory** draws it now, through `MemoryFace`
(a third union beside `AvatarEmotion` and `PortraitEmotion` – `shared/avatarEmotion.ts` carries why
it could join neither), with an explicit, tested band fallback for a wedding outside 23-30.

⚠ **The ALBUM still cannot draw it, and that is deliberate rather than pending.** `AlbumPage.emotion`
is still `AvatarEmotion`, so A6 is unchanged and still needs his ruling. What the wiring removed is
the hard part – the fallback – not the decision.

⚠ **A6 also raises the question the whole item rests on**, and it is his reserved design rather
than a wording call: at 19% coverage on an ordinary career, a FIXED wedding slot would be an empty
face in seven albums out of eight. Fixed slots or a selected set – see the spec's §4 and §6.

---

## 10. ⭐⭐⭐ RULING D, 18.09 – the three capital blurbs are KEPT FOR REUSE (and were never lost)

§8a recorded R47-3 as copy the route retired. He read that and ruled twice, in one breath:

> «окей, есть пролог, кто захочет – пропустит»

and then:

> «а вот эти фразы можно использовать у нас где-то, например на экранах "мимо пролога", где есть этот
> выбор. Или вообще в самом прологе.»

**So the removal stands and the sentences are his to keep.** They are recorded here verbatim, under
his own ruling, so that no future route change can take them out of the record.

### 10a. The three sentences, verbatim

| # | the label | the sentence, verbatim | |
| ---: | --- | --- | --- |
| D-1 | `Wealthy` | Top academies are within reach. | **KEPT FOR REUSE – his ruling, 18.09** |
| D-2 | `Middle class` | Smart choices, steady progress. | **KEPT FOR REUSE – his ruling, 18.09** |
| D-3 | `Working class` | Big dreams, hard mode. | **KEPT FOR REUSE – his ruling, 18.09** |

### 10b. ⚠⚠ They are already ON the screen he named, and they never left it

His example is «экраны "мимо пролога", где есть этот выбор» – **the screens that bypass the prologue
and ask this question**. There is exactly one, the onboarding wizard's step 4 (`Family background`),
reached only through the prologue's own skip (`App.vue` → `newGameRoute = 'wizard'`), and it carries
these three sentences **as its own blurbs and always has**:

```
src/components/OnboardingWizard.vue:69-71
  { id: 'wealthy', label: 'Wealthy', budget: '$120,000', blurb: 'Top academies are within reach.' },
  { id: 'middle', label: 'Middle class', budget: '$25,000', blurb: 'Smart choices, steady progress.' },
  { id: 'working', label: 'Working class', budget: '$8,000', blurb: 'Big dreams, hard mode.' },
```

What commit `73592132` deleted was a **second copy** of them on the epilogue's own capital fork –
the same three sentences, the same three labels, without the money line. **Nothing was lost.** The
sentence he wants reused is on the screen he suggested reusing it on, and it is the only executing
copy in the tree.

### 10c. The other surface HAS its own blurbs, so nothing was overwritten

The childhood prologue's first card (`src/prologue/cards.ts:302-323`) asks the same question with a
different set of words – **his**, not these:

| id | label | note |
| --- | --- | --- |
| `working` | A small town, and you both work. | There is nothing spare. Everything after this is a real decision. |
| `middle` | A city, and the bills are paid. | There is some room. Not a lot of it. |
| `wealthy` | Money is not the question in this house. | You still have to decide where she goes and who teaches her. |

⚠ **So «или вообще в самом прологе» was NOT taken, and the reason is invariant 4 read plainly.**
Putting D-1/2/3 on that card means *replacing* the three notes above, which are also his and which
nobody asked to have changed. It is also the one place the wizard's copy could not go unedited:
`PrologueOption.note` carries a typed invariant that **no figure may appear in a note**, which is why
the prologue shows no starting capital while the wizard shows `$120,000 / $25,000 / $8,000`.

### 10d. Where they COULD go, if he wants them somewhere new

1. **Nowhere – already done.** The screen he named is the wizard, and the wizard has them.
2. **The prologue's origin card**, replacing its three notes. One word from him and it is three
   lines; without it, it is an agent rewriting his copy.
3. **Beside** the prologue's notes rather than instead of them – a second line per option. That is a
   layout decision on a card that already carries a question line, three labels and three notes at
   375px, and it is the only option here that adds a new visual element rather than moving words.

⚠ **Nothing in 10d was built.** §10b is the whole of the ruling's practical content: the sentences
survive, on the surface he named, untouched.
