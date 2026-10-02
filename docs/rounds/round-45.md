---
type: round
status: current
area: rounds
last-reviewed: 2026-10-02
---

# Round 45 – плейтест владельца, 10 пунктов (02.10.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent
named · `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was
not). Branch `round/45`. Bundles are collision surfaces; agents run **sequentially** (the 29.09
law), each owns only its own lines.

⚠ Invariant 4: every NEW player-facing string an item needs goes in the DRAFT table at the bottom,
never straight into the owner's voice. His sketches (item 4) are the draft, still his to bless.

- [x] **1. «2 матча Шлема снимают 8% кондиции, а 2 матча 250 - 10%. У нас всё ещё перерасход
  кондиции присутствует. 3 игры на 1000 снимают 15%. 24% за 5 игр 500 и 26% за 6 игр 1000. Давай
  проверим что там вообще, мы хотели немного подкорректировать начальные матчи по-моему.»**
  – Reading: per-match condition drain looks tier-blind (≈4–5%/match everywhere: Slam 4.0, 250 5.0,
  1000 5.0→4.3, 500 4.8), and he remembers an earlier intent to soften EARLY matches. This is
  tuning – invariant 5: measure first, change second, predicted-vs-measured in a spec note.
  Class: **measure → build**. Bundle **B1** (condition/match drain + probe).
  Evidence: a deterministic probe table (tier × round → drain) from real engine draws, the prior
  intent found in docs (or stated absent), and – if changed – the same table after, with the pin
  updated and the frozen-capture verdict stated.
  **B1 outcome (02.10) – `[?]`: measured, NO code change, options for the owner.**
  `tools/condition-drain-probe.ts` (real matches, 140k fixed-seed runs) reproduces all five of his
  figures as NET of the travelling masseur (3 per night between rounds, 19.09): each sits between the
  all-straight-sets floor and the all-hard ceiling – Slam 2 → 8 and 250 2 → 10 ARE the floors – and
  every gross floor (11 · 13 · 18 · 34 · 39) is above his number, so none can be a gross figure. The
  drain is tier-blind BY DESIGN: the scoreline part averages 2.6 at every tier and round, and every
  top rung plateaus at 7 per straight-sets match from round 3 (250/500: surcharge 4 + ladder 1;
  1000/Slam: 5 + 0). Only the openers differ: the Slam's first two (5, 6) are 1 cheaper than a 250's
  (6, 7) – his own 14.08 ramp `[-2,-1,0]` meeting the 01.08 W ladder. Intent in the docs: the 14.08
  ramp is shipped as he wrote it; the 19.09 «уменьшить усталость на глубоких турнирах» shipped as
  masseur relief 2 → 3 and its concave-tail half is HELD for his ruling (the-season-equation §10f; it
  does not touch openers); a ruling to soften the 250/500 openers is ABSENT. Options A–D with
  predicted tables are in the B1 report – his pick, one sentence.
  **B11 outcome (02.10) – `[x]`: BUILT, his second shape («J тоже 1-2-3, а W … 1 для 15-75, 2 для 100-250, а 3 для 500+»).**
  `tierMatchFatigue`: J30/J60/J300 3/4/5 → 1/2/3 · W15–W75 2/2/2/3 → 1 · W100/WTA125/WTA250 3/3/4 → 2 · WTA500/1000/Slam 4/5/5 → 3; the rest untouched. Net per visit (140k runs,
  masseur travelling): WTA250 11.2 → 7.2 · WTA500 11.0 → 9.0 · WTA1000 9.4 → 5.5 · Slam 9.5 → 5.6; his first shape (not shipped) 9.2 / 9.0 / 7.4 / 7.5. Holidays a season 7.2 → 4.8 (12 careers x 2 presets,
  control cell). Predicted == measured to the digit; frozen keys 45/39/38 of ~102, 128/128 hash literals re-pinned, rngMain and the 41550-draw capture unmoved. Spec §11 of the-season-equation.
  B13 (02.10): 7 walked-career fixtures re-aimed to the new trajectories, claims unchanged (round23-kid-share, round45-first-number-one D1, season-mirror, wave10-handover,
  wave10-walker-retirement, ladder-floor, wave5-elite-gate); `econ-reach` NOT re-aimed – its 14→18 band tripwire fired (19 of 30 against a ceiling of 18), left red for the owner, note in the file.

- [?] **2. «Сверху интерфейса периодически появляется горизонтальная полоса в 1 пиксель на всю
  ширину экрана»** – Reading: an intermittent 1px full-width line at the very top of the UI –
  a border/edge of some top-chrome element (notice bar, update toast, safe-area filler) that shows
  while its body is hidden. Class: **build** (bug hunt). Bundle **B7** (App.vue top chrome).
  Evidence: the exact element named with the mechanism of «периодически», the CSS/markup fix, and
  a mounted assertion that the collapsed state renders 0px tall (goes red on revert).
  **B7 result – NOT reproduced, so NOT fixed (nothing in `src/` moved).** The shell's top chrome
  cannot be the strip: `.update-banner`, `.recovered-banner` and `.stop-toast` are each `v-if`'d,
  carry 10–12px of padding and a content row, and nothing in `App.vue` renders an always-present
  top element. Measured row by row on a production build (service worker off) over the top 8 css
  px: the Moto G8 Plus profile (411x869, DPR 2.625) on Season, Calendar, Home, Stats and Trophies,
  and desktop 1280x800 at DPR 1 and 2 on Home with and without the Tour Office card up – no
  uniform full-width row, no element 4px or thinner within 3px of the top. Also excluded: every
  hero portrait (rows 0–9 are a smooth gradient, no edge line), `theme_color` / `background_color`
  / `--bg` (all `#0a0e13`, so no status-bar seam), the confetti (absolute inside a card). Ranked,
  still open: (1) platform overscroll – `html` and `body` set no `overscroll-behavior-y` (only `-x`
  on three scrolling rows), so Android Chrome paints its edge glow / pull-to-refresh at scrollTop 0
  on a top-edge fling: periodic, device-only, full width, invisible to headless desktop; the fix
  would be one declaration. (2) a transient frame of a mounting `.dialog-overlay` or tour
  spotlight (both `position: fixed`, full viewport) – steady states were scanned, mount frames
  were not. (3) the update banner after a deploy – but that is 40px of text, not 1px.
  **Asks him:** what colour is the line, and what had he just done (pulled the page down, closed
  a card, a week ticked)? Grey-white points at (1), page-dark at a seam, green at our own accent.

- [x] **3. «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
  массажист растёт сам по себе тихо ежегодно»** – Reading: specialists (physio, psychologist,
  masseur…) send progress letters but no raise requests; the masseur's fee indexes silently
  yearly – inconsistent. Wanted: raise-request letters with accept/decline, masseur included
  (no more silent growth). Class: **build** (+ asks on cadence/size if no pattern exists to
  mirror). Bundle **B2** (specialist economy + letters).
  Evidence: a seeded career where a specialist's raise letter arrives, both doors exercised in a
  test (accept → fee moves, decline → consequence per existing law), masseur's silent index shown
  replaced by the same letter flow. New copy → DRAFT rows.

  **B2 outcome (02.10) – `[?]`: the masseur's letter is built, the other seats' are NOT.** The
  anniversary tick that used to raise his rate silently now writes ONE open letter (`kind: 'staff'`
  with `terms.ask`, the sponsor letters' four-week window, Decline / Accept through the existing
  `declineOffer` / `acceptOffer`); the fee is derived from the signed papers
  (`staffAsksWithheld`), so Decline and a lapse leave it where it was, nothing is punished, and a
  save with no such papers keeps every raise it already pays – no schema move. Proof:
  `tests/round45-staff-ask.test.ts` A+B (both doors, lapse, a real `tickWeek`, the old feed row
  dead) and `tests/component/round45-staff-ask-letter.test.ts`. **Open at B2, closed by B2b below:**
  the psychologist and the hitting partner did not ask yet (their cards quoted flat per-rung prices).

  **B2b outcome (02.10) – `[x]`: the psychologist and the hitting partner ask too, and their cards
  tell the truth.** The same open staff letter on each seat's own anniversary – the hire ledger
  already tags both seats (`psychologist-since-`, `sparring-since-`), so no persisted field and no
  schema move – with the sponsor letters' four-week window and the same two doors; `acceptOffer`
  re-validates that the seat is still hired. The fee is DERIVED: the rung's catalogue price ×
  1.04^(requests the family SIGNED), whole dollars. So Decline and a lapse leave the fee, the
  forgone year is not banked, the next request is one step above what the seat is paid now, and a
  save that predates the letters pays exactly what it paid (these two seats never rose, so the
  exponent counts signed papers where the masseur's legacy rule counts years). The snapshot now
  carries what each rung costs this career (`psychologistRungSalaryCents`,
  `sparringRungSalaryCents`; the headline `*SalaryCents` fields were already the bill's) and the
  dial reads them, never the catalogue. Proof: `tests/round45-staff-ask-seats.test.ts` (both seats:
  letter, accept, decline, lapse, a real `tickWeek` walk, re-hire clock, snapshot, masseur parity)
  and `tests/component/round45-staff-ask-card.test.ts` (the dial off an engine-built and a doctored
  snapshot; the letter's unit); mutations M1–M10 each turn a test red. Frozen MAIN capture
  unmoved (no draw), save untouched. ⚠ **4% IS A DEFAULTED PARAMETER awaiting the owner** – the
  masseur's own `raisePerYear`, lent to both seats (`staffRaisePerYear()` in `world/staffRaise.ts`
  is the one seam to give a seat its own); the four-week window is the sponsor letters' (also
  defaulted, B2). **Open for the owner:** the coach keeps his own ruled round-43 auto-raise (a
  notice, rate applied) – converting him to a letter is his call and was not touched.

- [x] **4. «Для психолога мне кажется нужно сделать чтобы если игрок забыл выбрать направление, то
  оставалось предыдущее. А в письме следующего года писать "мы не выбрали новое, поэтому работали
  по предыдущему" вроде того»** – Reading: unanswered yearly psychologist direction ⇒ carry the
  previous one; next year's letter says so (his sketch is the draft wording). Class: **build**.
  Bundle **B2** (same files as 3).
  Evidence: a test career with the choice ignored – direction persists, the next letter carries
  the carry-over line (rendered, with real data), DRAFT row for the line.

  **B2 outcome (02.10) – `[x]`.** Measured first: nothing ever cleared `psychologistFocus` and the
  seat's work never read the season stamp, so a forgotten off-season already left the previous
  direction working and never blocked a week – what was missing was the SAYING (a stale stamp made
  the year-end letter go quiet about the direction). The letter now carries
  `focusCarriedFrom` (the season the carried pick was last chosen for) and prints the carry-over
  line with that year (DRAFT R45-S9); an answered year – including re-choosing the same direction –
  prints no such line. Proof: `tests/round45-staff-ask.test.ts` «round 45 #4» (a real `tickWeek`
  walk, both arms) and the mounted pair in `tests/component/round45-staff-ask-letter.test.ts`.

- [x] **5. «В альбоме вполне можно сделать чуть ли не отельную страницу, если она на #1 в мире
  выходит, даже если в моменте, а не по итогам года, это значимый момент»** – Reading: the album
  gets a dedicated page the first time she touches world #1, mid-season counts – not only the
  year-end review. Class: **build**. Bundle **B5** (album engine/composition).
  Evidence: a career that reaches #1 mid-season produces the page (read from the composed album
  state), a career that never reaches #1 produces none; deterministic; page copy → DRAFT rows.

  **B5 outcome (02.10) – `[?]`: STOPPED at the schema move, nothing built, his pick needed.**
  The first-#1 week is NOT derivable from a save. What persists is the year-end close per table
  (`seasonHistory[].byTrack.wta.endRank`, and the ITF-only `season-rank` milestone), the live
  `kidRankWta`, and `prevKidRankWta` (one week back); `world.results` is a 52-week window and the
  field it was ranked against is not kept. `bestRankOn` in `world/ladder.ts` says it in its own
  words: no rank history exists. So a mid-season touch needs ONE new persisted fact – a first-touch
  latch (`kidRankWta === 1` with WTA points held, written in `recomputeKidRank` beside
  `peakDomesticPoints`) – and that is the three-part move at v91. Cost, measured on the last one
  (v90, `6b8cdb0b`): 43 files – migration, a 32,000-line golden fixture, `e2e/fixtures/unheard.tsave`,
  the barrel and economy pins, the generated symbol map – plus a new corpus occasion (4 voices × 3
  registers = 12 DRAFT strings in `docs/specs/album-corpus-2026-09.md`, re-emitted by
  `tools/album-corpus-emit.ts --write`) and the composition (a `rare` occasion between
  `top-tier-title` 100 and `years-at-the-top` 98; a truly separate page needs a solo-frame flag in
  `sheetsOf` / `chapterSheetPlan`, engine side, no component change – single-frame A and C sheets
  already render). Over this bundle's budget, so it stops here.
  ⚠ **For his one-sentence pick – it touches a ruling.** `docs/specs/the-reckoning-2026-09.md` §4a
  (18.09): he REFUSED a persisted running minimum («достаточно лучшего ранга по итогам сезона») and
  the section says it is not to be re-proposed. His 02.10 sentence asks for the mid-season moment
  explicitly, and a first-touch latch is narrower than a running minimum – but whether the newer ask
  supersedes the refusal for this one fact is his to say, not an agent's. Options: (A) the v91 latch
  plus a `first-number-one` page, as its own bundle (~60 moves); (B) a year-end-only page now, zero
  schema, from `seasonHistory` – which is the reading he said is NOT enough; (C) leave the album as
  it is. One more question for him: «#1 в мире» is the Professional table only (the draft's reading)
  or the junior International table too? No copy was written, so no DRAFT row was added.

  **B8 outcome (02.10) – `[x]`: BUILT, v91 (the three-part move).** The latch is `world.firstNo1 = { wta?, junior? }` –
  the first week the live fold said #1 on the professional world table (`kidRankWta`) and on the international junior one
  (`kidRank`); the domestic table is not latched (a national #1 is not a page). It is written ONCE per key in
  `recomputeKidRank` (`latchFirstNo1`, `world/ladder.ts`) on `rank === 1` with points held, created lazily, never rewritten –
  so a June touch that ends the season at №3 keeps its page, which is exactly his «даже если в моменте». Zero draws.
  **Migration backfill:** v90 -> v91 sets a latch to the CURRENT week only where the cached rank is 1 as the save is written,
  otherwise leaves the key absent – a past touch is unknowable and the step may not invent one (the comment says so).
  **The page:** two `rare` occasions at priority 99 – `first-number-one` (A35, the world list) and `first-number-one-junior`
  (A36, the junior list) – TWO and not one with a table parameter, because the corpus forbids interpolation (corpus §3.2);
  24 DRAFT strings, R45-S15 – S22 below, also in `docs/specs/album-corpus-2026-09.md`, re-emitted with the emitter against the
  round-trip pin. No component change: the page is a frame the existing single-frame A/C sheets already render.
  **Measured** (`tools/first-number-one-probe.ts`, 18 walked careers): the junior #1 latched on 2 (ages 15 and 16, earliest
  week 122), the world #1 on 3 (ages 18, 19 and 25); every career whose best rank was 1 carries the latch and no other does –
  no early-field artefact. Proof: `tests/round45-first-number-one.test.ts` (23 cases, ten mutation arms, ledger in its head).

- [x] **6. «Расположение фото в альбоме конфликтуют с надписями в самом альбоме и с некоторыми
  записками, которые перекрывают надписи на фото, надо подумать как лучше сделать»** – Reading:
  album layout collisions – photos vs album captions, notes overlapping photo labels. He asks for
  a thought-through layout, not a nudge. Class: **build**. Bundle **B6** (album UI).
  Evidence: a mounted test measuring bounding boxes of photo labels vs notes/captions on the
  offending page shapes – zero intersection, red on revert; before/after reasoning in the report.

  **B6 outcome (02.10) – `[x]`.** Nothing on a sheet is engine-composed: every coordinate is a pixel
  number in `AlbumLayoutA/B/C.vue`, drawn for short words, so the cause was text length – layout B's
  bottom-anchored note grew up over both top-row captions, C's over the hero's, A's loose line ran under
  the second photograph's caption, C's second photograph hung off the page. Fix: `album/albumPlacement.ts`,
  a pure resolver the three layouts render through (a note or line stays where it was drawn only if no
  caption band touches it, else the cheapest free spot; photo windows shrink one 8% rung and the note
  widens before it may cover a picture). **Before/after, 48 posed careers, 335 sheets: 303 had a note or a
  line on a caption (A 115, B 67, C 121); 0 after**, none needing the stack-below fallback; real Chromium on
  the seeded `pro` career: 6 of 6 sheets before, 0 of 6 after. Red on revert: the resolver replaced by the
  layout's own drawing gives «303 of 335 sheets still put a note or a line on a caption» and 4 mounted reds.
  Not solved, said plainly: on about half of layout C's pages the note still sits over part of the hero's
  *picture* (same area as before, the caption is now free); B's long notes shrink the photographs on 45 of
  67 sheets; 16 B and 13 C sheets touch furniture; 24 C sheets keep a three-line second caption past the
  page edge. Those are the layouts being over-full, and the answer is a composition, not a nudge – his call.

- [x] **7. «Кроп фото в альбоме берёт среднюю часть фото, на некоторых обрезается голова»** –
  Reading: album photo crop anchors to center; portraits lose heads – anchor should favour the
  top. Class: **build**. Bundle **B6** (same files as 6).
  Evidence: the measured object-position/crop rule before and after, asserted in the mounted
  album test (red on revert).

  **B6 outcome (02.10) – `[x]`.** The mechanism is `object-fit: cover` at the default centre in
  `ui/Polaroid.vue` (untouched). `AlbumPhoto` now hands it `object-position: 50% 10%`. A crop ANCHOR, not
  face detection: a head within the top few percent of a painting can still lose a sliver. Pinned by a
  source pin on `AlbumPhoto.vue` and a mounted `img.style.objectPosition` on all three layouts; both
  red with the style removed.

- [x] **8. «Постараться сделать, чтобы одинаковых фоточек не было на одной странице»** – Reading:
  de-duplicate photo picks within one album page (deterministically – sub-stream law, MAIN
  untouched). Class: **build**. Bundle **B5** (same files as 5).
  Evidence: a sweep over many seeded careers asserting no page holds duplicate photo ids, and the
  frozen-capture verdict stated (should be unmoved – sub-streams only).

  **B5 outcome (02.10) – `[x]`.** There was no draw to repeat: a frame's picture is a TABLE (mood from
  the occasion, one band portrait per face), so two same-mood frames of one chapter were the same
  file by construction. `pickDistinct` (`world/albumBook.ts`) now assigns a page's pictures together –
  a search: fewest repeats first, earliest frames on their earliest choices, so a page that already
  differed is byte-identical – and the ladder offers stand-ins: the other three journey scenes of the
  same mood, and neighbouring faces on the calm side (`PORTRAIT_STAND_INS`; the ruled `rehab` never
  becomes `injury` or `sad`, a lost final never smiles). One-moment paintings never move. No MAIN, no
  sub-stream, no schema, no wording. A pool smaller than the page is answered (the repeat is shown),
  not refused. Proof: `tests/round45-album-distinct-frames.test.ts` – a 48-career posed sweep, zero
  pages with a repeated picture; with the de-duplication mutated out the same sweep reds with 24
  pages. Frozen capture unmoved (`tests/condition.test.ts`, 51 green).

- [x] **9. «Deposit towards her own place случился после того, как она пару лет назад принесла
  свой spare key. И мне кажется этот депозит вполне можно где-то на более ранних периодах делать,
  а не когда у неё на счёту уже 150+ млн»** – Reading: narrative inversion – the own-place deposit
  fired years AFTER the spare-key beat, and only at absurd wealth. Wanted: the deposit eligible
  earlier (age/wealth corridor down) and ordered before (or suppressed after) the key beat.
  Class: **build** (corridor tuning – measured). Bundle **B3** (kidLife/life-beat gating).
  Evidence: a before/after distribution over seeded careers (ages + bank at deposit; % of careers
  where deposit precedes key), corridors stated in the report.

  **B3 outcome (02.10) – `[x]`.** Measured first: the deposit's gate holds no money or age corridor –
  it is a row of the 19-21 birthday band and her bank is read by nothing there. What put it after the
  key was round 42 #26's refill (a given durable leaves the card, the shortfall is topped up from the
  neighbour bands, the independence band first). On 72 walked careers the deposit stood on a card
  AFTER the key in 29 of 69 for a parent who grants every ask (49 cards at 26-34, her bank median
  $9.9M, p90 $15.9M) and in 61 of 69 for one who declines it (166 cards, median $9.5M, max $36.7M).
  Two rules, no new draw, no schema: the own-key receipt makes the deposit moot (retired like a given
  durable, the card refills to four rows), and her nineteenth birthday carries it and asks for it.
  After: first ask median 20 → 19, p75 27 → 19, p90 31 → 19; cards after the key 49 → 0 and 166 → 0;
  her bank at the first ask p90 $14.5M → $0.29M. `tests/round45-deposit-before-key.test.ts` (three
  mutation arms measured red); frozen capture unmoved. Open: his 150M+ is beyond this sample's tail
  (max $36.7M) – the same mechanism on a richer career.

- [~] **10. «Бренд жёстко приносит 13800 и ни центом больше, независимо ни от чего, даже при
  стоимости 35 млн»** – Reading: the brand asset pays a flat weekly income regardless of its
  worth – at 35M worth it still pays 13,800. Wanted: income that scales with the asset's value,
  measured (invariant 5). Class: **measure → build**. Bundle **B4** (economy/ownables income).
  Evidence: the current formula quoted from source with the flat constant named, the new curve
  with a predicted-vs-measured table over worth tiers (incl. 35M), bench arm run.

  **B4 outcome (02.10) – `[?]`: measured, NO code change – the reading above is wrong, the rule
  decided on it is not safe as briefed, and the real lever is his to name.**
  The income is not a flat constant and not independent of the worth – the worth is derived FROM
  it. `assetEarningsRateCents` → `brandWeeklyGrossCents` = `perFamePointCents 3_000 × reach² ÷
  famePivot 10 × crowdMult`, reach clamped at `ECONOMY.fame.cap` 100, crowdMult at 1.15: $300 a
  week at the day-one fame 10 (6.24% a year on the $250,000), $30,000 at the cap, $34,500 with the
  room maxed; worth = `gross × 52 × multiple` (multiple ≤ 20). **His 13,800 is that corner to the
  cent: $34,500 × (1 − 60%)**, the family's 40% once her share has reached `kidShare.capBps` at 23.
  The corner is also where a $35M worth lives (ceiling $35.88M; a derived worth ≥ $35M needs reach
  ≥ 98.8): at $35M the formula pays $33,677–$34,500 gross, $13,471–$13,800 to the family, a ×1.02
  band – against ×2.30 at a $250,000 worth. Each clamp on the way is a standing ruling (fame cap
  and crowd clamp, rounds 32/34 «the top of the shelf does not move»; her 60%, 35 #9 and 42 #25).
  No screen holds the constant (grep of components/stores: none).
  The decided rule (income ∝ current worth, rate calibrated at the entry) fails twice: «today's
  flat figure ÷ entry price» is 13,800 ÷ 250,000 = 5.5% a WEEK; and at the real entry yield
  (0.12% a week) a pure proportional income CUTS today's by 26–77% at reach 10–20, 19–63% at 30,
  5–49% at 50 (range = no career premium … all of it) and lifts only the best-multiple careers
  above reach ~70 (+10% … +25%) – not backward-neutral for any career below the top. The cheap
  variant, a floor `max(today's, 0.12% × worth)`, is byte-identical below reach ~57 and lifts the
  top: +9.5% at reach 70, +23.9% at 90, +24.8% at the cap ($13,800 → $17,222 to the family) –
  still a ceiling, since the worth tops out in the same corner. Bench (`tools/r35-brand-share.ts`,
  780 weeks × 2 seeds): its careers peak at $96 a week and a $35k worth, so the corner is a
  top-career state the bench never visits. HELD for his one-sentence pick: lift the ceiling (what
  grows past the fame cap?), the worth-linked floor, or leave it as designed.

## Bundles → dispatch (sequential, sonnet, budgets are STOP conditions)

| # | bundle | items | surface owned | budget |
| --- | --- | --- | --- | --- |
| B1 | condition drain | 1 | `src/engine/condition.ts`, match drain site, `tools/` probe | ~45 moves |
| B2 | specialist letters | 3, 4 | `src/engine/economy/psychologist.ts`, specialist fee/letter sites, entries | ~45 moves |
| B3 | life-beat deposit | 9 | kidLife/life-beat gating for deposit + own-key | ~35 moves |
| B4 | brand income | 10 | economy/ownables income site + bench | ~35 moves |
| B5 | album engine | 5, 8 | `src/engine/world/albumBook.ts` + corpus | ~40 moves |
| B6 | album UI | 6, 7 | `src/components/album/`, `AlbumScreen.vue` | ~40 moves |
| B7 | top 1px bar | 2 | `src/App.vue` top chrome | ~30 moves |

Gates: none inside agents. One `check` + `test:component` + `test:sim` + `test:e2e` pass in the
architect's session after the last agent, verdicts from files.

## R45 – DRAFT strings (owner's table, nothing ships as final wording)

| id | surface | EN draft | его слова/замечание | status |
| --- | --- | --- | --- | --- |
| R45-S1 | item 3 – inbox subject line of a raise request (`InboxSheet.vue`, staff arm) | `A raise request – {year}` | «повышение они так и не просят» | draft |
| R45-S2 | item 3 – the masseur's raise letter, body (`OfferLetter.vue`) | `I have now worked a full year with her, so I am asking for a raise: my rate would go from {from} to {to} a session.` | «повышение они так и не просят, только массажист растёт сам по себе тихо ежегодно» | draft |
| R45-S3 | item 3 – raise letter foot, while open (the buyer's letter's own sentence, reused word for word) | `{n} weeks to decide. The terms will not change.` | – | draft |
| R45-S4 | item 3 – the two doors | `Decline` / `Accept` | – (the ledger's reading: accept/decline) | draft |
| R45-S5 | item 3 – foot once signed | `Accepted – the rate is {to} a session.` | – | draft |
| R45-S6 | item 3 – foot once refused | `Declined – the rate stays at {from} a session.` | – | draft |
| R45-S7 | item 3 – foot once lapsed unanswered | `Lapsed – the rate stays at {from} a session.` | – | draft |
| R45-S8 | item 3 – the confirm before Accept (`InboxSheet.vue` `confirmMessage`) | `Accept the raise? The rate goes from {from} to {to} a session. This cannot be undone.` | – | draft |
| R45-S9 | item 4 – the psychologist's year-end letter, carry-over line (`OfferLetter.vue`) | `We did not choose a new direction this year, so we kept working on the previous one – the one chosen for {year}.` | «мы не выбрали новое, поэтому работали по предыдущему» | draft |
| R45-S10 | item 3 – the psychologist's and the hitting partner's raise letter, body (`OfferLetter.vue`): R45-S2 with the unit `a week`, because these two seats bill by the week (R45-S1 subject, S3 window and S4 doors are shared by all three seats, unchanged) | `I have now worked a full year with her, so I am asking for a raise: my rate would go from {from} to {to} a week.` | «повышение они так и не просят» | draft |
| R45-S11 | item 3 – their foot once signed (R45-S5 with `a week`) | `Accepted – the rate is {to} a week.` | – | draft |
| R45-S12 | item 3 – their foot once refused (R45-S6 with `a week`) | `Declined – the rate stays at {from} a week.` | – | draft |
| R45-S13 | item 3 – their foot once lapsed unanswered (R45-S7 with `a week`) | `Lapsed – the rate stays at {from} a week.` | – | draft |
| R45-S14 | item 3 – their confirm before Accept (`InboxSheet.vue` `confirmMessage`; R45-S8 with `a week`) | `Accept the raise? The rate goes from {from} to {to} a week. This cannot be undone.` | – | draft |
| R45-S15 | item 5 – album occasion `first-number-one` (A35; the first time at the top of the world list), `sunny` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Number one in the world. You rang to read me the list down the phone, and then you read it again to be sure.` / `She read us the list, and then read it again.` / `Top of the list, and she still checked.` | «если она на #1 в мире выходит, даже если в моменте» | draft |
| R45-S16 | item 5 – album occasion `first-number-one` (A35; the first time at the top of the world list), `fiery` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Number one in the world. You said you had never doubted it, and dared me to say that I had.` / `She never doubted it, she says.` / `She never doubted it. She will say so.` | «если она на #1 в мире выходит, даже если в моменте» | draft |
| R45-S17 | item 5 – album occasion `first-number-one` (A35; the first time at the top of the world list), `deep` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Number one in the world. You said you kept waiting to feel different, and that you mostly felt the same.` / `She waited to feel different.` / `Mostly the same, she said.` | «если она на #1 в мире выходит, даже если в моменте» | draft |
| R45-S18 | item 5 – album occasion `first-number-one` (A35; the first time at the top of the world list), `quiet` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Number one in the world. You mentioned it after the practical things, and only because I asked.` / `She mentioned it last, and only when asked.` / `After the practical things.` | «если она на #1 в мире выходит, даже если в моменте» | draft |
| R45-S19 | item 5 – album occasion `first-number-one-junior` (A36; the first time at the top of the junior list), `sunny` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Top of the junior list. You rang to tell me, and I could hear you smiling the whole way through.` / `First on the junior list, and smiling.` / `I heard the smile before the news.` | «можно и на других уровнях тоже показывать» | draft |
| R45-S20 | item 5 – album occasion `first-number-one-junior` (A36; the first time at the top of the junior list), `fiery` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Top of the junior list. You said it was about time, and then asked what the next one was.` / `About time, she says.` / `Already asking what comes next.` | «можно и на других уровнях тоже показывать» | draft |
| R45-S21 | item 5 – album occasion `first-number-one-junior` (A36; the first time at the top of the junior list), `deep` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Top of the junior list. You said it was odd to be first at something and not know what to do with your hands.` / `First, and not sure what to do with her hands.` / `First on a list, and fidgeting.` | «можно и на других уровнях тоже показывать» | draft |
| R45-S22 | item 5 – album occasion `first-number-one-junior` (A36; the first time at the top of the junior list), `quiet` voice: note / caption / line (`docs/specs/album-corpus-2026-09.md`, emitted into `albumCorpus.ts`) | `Top of the junior list. You sent it as one line at the bottom of a message about something else.` / `She put it at the bottom of the message.` / `Bottom of the message. Top of the list.` | «можно и на других уровнях тоже показывать» | draft |
| R45-S23 | item 3b – the coach's raise letter, body (`OfferLetter.vue`): R45-S2 with the unit `an hour`, because the coach's bill is built from an hourly rate (R45-S1 subject, S3 window and S4 doors are shared by every seat, unchanged) | `I have now worked a full year with her, so I am asking for a raise: my rate would go from {from} to {to} an hour.` | «тренер тоже вполне может просить повышения» | draft |
| R45-S24 | item 3b – the coach's foot once signed (R45-S5 with `an hour`) | `Accepted – the rate is {to} an hour.` | – | draft |
| R45-S25 | item 3b – the coach's foot once refused (R45-S6 with `an hour`) | `Declined – the rate stays at {from} an hour.` | – | draft |
| R45-S26 | item 3b – the coach's foot once lapsed unanswered (R45-S7 with `an hour`) | `Lapsed – the rate stays at {from} an hour.` | – | draft |
| R45-S27 | item 3b – the coach's confirm before Accept (`InboxSheet.vue` `confirmMessage`; R45-S8 with `an hour`) | `Accept the raise? The rate goes from {from} to {to} an hour. This cannot be undone.` | – | draft |

## Owner answers, 02.10 (his numbering = the question batch)

1. Condition – the full in/out table was handed to him in chat (drain per tier/round, masseur
   home rungs +1/+2/+3, tour relief 3/night, return session, recovery 8 junior / 5 pro × age,
   rest-slider +1/+2, blackout +1, shoot week −7); he thinks separately. Item 1 stays `[?]`.
2. The strip was LIGHT-coloured; he will try to reproduce. Pull-to-refresh STAYS – he uses it to
   recover hangs; the speculative overscroll kill is off the table. Item 2 stays `[?]`.
3. (his Q3 = item 5) Build the first-touch latch – «а и б – да, вполне можно сделать», and
   year-end-only misses a June touch that ends the season №3, failing his original «даже если в
   моменте». Other tables page too. → B8 `[>]`, v91 three-part move, decisions 02.10.
4. (his Q4 = item 10) Brand: his reframe – 20-year payback counting family + her share – blessed
   by the architect (~5%/yr on a resellable worth is an honest boring yield; sub-cap income
   already scales). `[~]` – nothing moves.
5. (his Q5 = item 3b, NEW) «плавающая вилка… тренер тоже вполне может просить повышения – с
   удачных лет по-больше, с неудачных по-меньше, как и все остальные». Repeated refusals: the
   17.09 «no third branch» ruling stands (quoted to him; change needs his explicit word). → B9.
6. (his Q6 = item 6b, NEW) His concern restated: note/caption/photo-label collisions remain in
   places; «может быть пересмотреть размер самих записочек… расположение в местах пересечения
   букв»; his per-page list is the fallback if we fail. → B10: note sizing/density pass over the
   tight slots (font step-down on long notes, narrower C slots, hero-coverage → 0 in the sweep).

- [x] **3b.** floating ask size for every seat + the coach converts to the two-door letter – B9. BUILT: «was her
  year good» is ONE verdict (`staffYearVerdict`, world/staffRaise.ts) read off the banked season rows – rank
  movement on her main table and titles, the very facts the staff's year-end letters print (shared leaf
  `world/seasonFacts.ts`); the coach's `coachProgressScore` was NOT reused for the three seats because it is
  measured against marks stored on HIS contract (no deal for a self-coached family, a different stretch of weeks
  from another seat's anniversary). DEFAULTED, the owner picks the figures: good 6% / flat 4% / bad 2%. The fee
  is the chain of signed papers (`staffFeeCents`); the masseur keeps his silent-era raises as the chain's
  baseline. The coach's own 5–15% corridor over his progress score was ALREADY the floating fork, so his size is
  unchanged: his rise is a letter now (accept re-strikes the one stored `coachDeal` fee, decline or lapse leaves
  it), the automatic rise and its feed row are retired. Repeated refusals keep the 17.09 «no third branch».
- [x] **6b.** note sizing/density so notes stop covering the hero picture in C and stop shrinking
  photo windows so hard in B – B10. BUILT (the owner's own idea, sized): a long note is DRAWN SMALLER – the whole
  scrap, laid out at full size and scaled, 1 / 0.9 / 0.82 by 72 / 100 characters, and the resolver may spend smaller
  steps before it shrinks a window; C's hero picture is kept clear (the note slot is the wide strip under it); a
  window rung costs 40 a percent, not 15; the loose line sets in 2-3 widths. Over the 335-sheet sweep: hero
  picture covered 52 -> 0 of 121 C sheets (1.41M px² -> 0), sheets at a shrunk rung A 26 -> 0 of 147, B 45 -> 18 of
  67 (the 0.68 rung 13 -> 1), C 59 -> 29 of 121; captions touched stay 0 of 335. Residual: 52% of notes end at
  the 0.82 floor, and C's hero still gives up to 24% of its window on 21 sheets – the owner's per-page list takes
  what remains.

## Owner answers, 02.10, second batch (off the condition table)

Item 1 goes to BUILD on his own lever – the tier surcharge, not the lettered options: J30/60/300 →
1/2/3; the W family by stage – his second shape ships (W15–W75 → 1, W100/125/250 → 2, 500/1000/Slam
→ 3), his first shape (uniform −1, Slam 4) is measured beside it; «А остальное пока оставить как
есть и попробовать как будет». → B11 `[>]`.

- [>] **1b.** «неделя съёмок… давай по 1 за каждый съемочный день, это может быть вполне
  справедливо» – the clash's flat 7 becomes per-shooting-day. → B12. BUILT: the days are the entered
  event's match days (`log2(drawSize)` – the very days the «do both» schedule already draws the Shoot block
  on), so the clash week costs 3 local / 4 regional / 5 (every 32-draw: juniors, W series, national, WTA
  250/500) / 6 (1000) / 7 (Slam) instead of a flat 7; the card and the charge read one function
  (`clashShootDays`, world/medical.ts), the rate stays 1, no draw, no schema, ECONOMY bytes unmoved.
- [?] **3c.** the third branch for repeated refusals: «вот хотелось бы, но пока не придумал
  ничего. Мы вроде думали… "если не готовы повышать цену, то работаю меньше дней в неделю"» –
  a design seed, parked; his own 17.09 masseur wording («…or book fewer sessions») is the
  half-made shape. No build until he rules it.
- item 6/6b: «альбом глазами посмотрю когда доделаешь» – his eyeball pass comes at the merge;
  the 0.82-floor readability question rides along.

## Owner answers, 02.10, third batch (off the round report)

- 1b REOPENS as a refine, not a miss: his fiction is «съемочных дней всего 2» and the load is
  doubled – 2 days × 3 = 6 flat, schedule redraws two Shoot blocks. → B14 `[>]`.
- [>] **5b.** the same-week collision: a combined world-table occasion (title + №1 in one page),
  priority above `top-tier-title`; junior keeps absorb. → B15.
- 3b: the 6% > 5% ordering confirmed ок. The banked-vs-forgiven question is explained and waits.
- 6b: the ×0.82 floor explained (longest notes draw as a smaller scrap, ~11px on a phone) – his
  eye at the merge decides; raising the floor to 0.9 is measured and costs B 35/67 shrunk sheets.
- Self-coached 6→19 of 30: cause named (juniors/early-W cheapened most, fewer injuries compound
  over the junior era; budget-coach cells still clear more than self – the 22.08 property partly
  stands). Ruled for now: feel it in play, no rollback lever built.
