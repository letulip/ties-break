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
5. **Two flagged NON-strings ride other gates, named so nothing hides.** The wedding memory's
   portrait face (`MEMORY_EMOTION.wedding = 'happy'`, `diary/facts.ts`) is a drafted PICK with its
   argument in place – one word, his. Every drafted NUMBER of the wave (`ECONOMY.wedding` whole,
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
| `diary/facts.ts` `MEMORY_EMOTION.wedding` – a PICK, not a string | §5.5 |
| `economy.ts` `ECONOMY.wedding` – NUMBERS, «draft for the bench» | §5.5 |

Three additions the sweep shows that are deliberately NOT rows, with the reason: the engine's
invariant throw messages (`A spouse-view row carries no occasion: …` and its siblings) are
unreachable through any interface and follow the standing precedent of every prior wave's tables,
which carried none of their kind; the `'engaged'`/`'spouse-view'`/`'own-key'` rows in `DRAIN_ANSWER`
and the tests' transcribed literals are harness material, not player copy; and the wave-7 doc
comments themselves flag rules, not strings.
