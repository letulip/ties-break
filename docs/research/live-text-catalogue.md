---
type: research
status: reference
area: content/commentary
canonical: false
last-reviewed: 2026-08-10
---

# Catalogue of real, openable tennis live text

Every entry below was fetched and confirmed on 10–11 August 2026. Nothing here is
reproduced: the value is the link plus the characterisation, so the owner opens the
real thing at the source. Where a page could not be fetched it is filed under
"blocked / unverified" rather than listed as confirmed.

**Access note that matters before you start.** `theguardian.com`, `bbc.com` and
`bbc.co.uk` refuse Anthropic's crawler outright, so `WebFetch`/`WebSearch` cannot see
them at all. They open perfectly in an ordinary browser. Every Guardian and BBC entry
below was therefore verified through a real browser session (HTTP 200 + parsed DOM),
not through the crawler. If a future agent reports "Guardian live blogs are
unavailable", that is a crawler artefact, not a fact about the site.

**Headline finding.** Aggregator point-by-point is **not** ephemeral. Flashscore and
Sofascore both still serve full per-point records for matches from 2019. The thing
that actually vanished is the opposite of what we expected: Jeff Sackmann's ATP, WTA
and Grand Slam point-by-point repositories have been **deleted from GitHub**. Details
in the last two sections.

---

## 1. Guardian minute-by-minute (MBM)

Free, no paywall, no registration. Index: `https://www.theguardian.com/sport/tennis+tone/minutebyminute`
– 1,347 tennis MBMs, 68 pages, reaching back past 2015. All URLs below returned HTTP 200.

### How the Guardian writes a match

One block per game, occasionally one block per cluster of points inside a tense game.
The block **heading is the running score**, formatted as
`Third set: Muchova* 2-6, 7-5, 0-3 Noskova`, with a bracketed note
"(* denotes next server)" (The Guardian). Cumulative set scores stay in the heading all
match, so any block is self-locating. A break rewrites the heading as
`Noskova breaks: ...` or `Muchova breaks!`; a set closes with
`Muchova wins the second set 7-5!!` – exclamation marks scale with drama. A routine
hold gets a one-line heading and two or three sentences, often about something other
than the tennis. Inside a tight game the prose drops to genuine per-point granularity,
running the point scores as a comma-chain (`15-0`, `30-0`, `30-15`, `30-all`) with the
shot that decided each. Reader emails are quoted inline and answered, which is a
distinctive register a simulator will not want to copy. Timestamps every 3–7 minutes.
Blocks lazy-load: the initial HTML holds 30–55 of them, the rest arrive on scroll.

| # | Match | Event / round / year | URL | Free | Granularity | Length | Why it is here |
|---|---|---|---|---|---|---|---|
| G1 | Noskova d. Muchova (W) | Wimbledon 2026, final | `/sport/live/2026/jul/11/karolina-muchova-v-linda-noskova-wimbledon-2026-womens-singles-final-live` | free | per game, per point in key games | 41 blocks / ~4.5k words | All-time drama: five missed championship points, a set-and-break comeback, tears at the trophy |
| G2 | Andreeva d. Chwalinska (W) | Roland Garros 2026, final | `/sport/live/2026/jun/06/maja-chwalinska-mirra-andreeva-french-open-2026-womens-singles-final-live` | free | per game | 52 blocks / ~8.8k words | Straight-sets slam final, the longest women's blog in this set |
| G3 | Swiatek d. Paolini (W) | Roland Garros 2024, final | `/sport/live/2024/jun/08/iga-swiatek-jasmine-paolini-french-open-tennis-womens-final-live` | free | per game | 33 blocks / ~5.7k words | **Heavy favourite, routine 6-2 6-1.** The best example of how the language thins out when nothing is at stake |
| G4 | Sabalenka d. Zheng (W) | Australian Open 2024, final | `/sport/live/2024/jan/27/zheng-qinwen-aryna-sabalenka-australian-open-womens-singles-final-live` | free | per game | 35 blocks / ~6.3k words | Second routine-final sample; the Guardian headline verb is "routs" |
| G5 | Paolini d. Vekic; Krejcikova d. Rybakina (W) | Wimbledon 2024, semi-finals | `/sport/live/2024/jul/11/wimbledon-2024-semi-finals-donna-vekic-jasmine-paolini-barbora-krejcikova-elena-rybakina-live` | free | per game, per point in the breaker | 43 blocks / ~7.0k words | **Deciding-set tie-break**, Paolini 7-6 in the longest women's SF in Wimbledon history |
| G6 | Krejcikova d. Paolini (W) | Wimbledon 2024, final | `/sport/live/2024/jul/13/barbora-krejcikova-v-jasmine-paolini-wimbledon-2024-womens-singles-tennis-final-live` | free | per game | 45 blocks / ~7.7k words | Three-set slam final; pairs with G5 for the same players two days apart |
| G7 | Gauff d. Zheng (W) | WTA Finals 2024, title match | `/sport/live/2024/nov/09/coco-gauff-v-zheng-qinwen-wta-finals-title-decider-live` | free | per game, per point in the breaker | 49 blocks / ~6.5k words | **Deciding-set tie-break** at a non-slam elite event |
| G8 | Svitolina d. Stephens (W) | WTA Finals 2018, final | `/sport/live/2018/oct/28/wta-finals-sloane-stephens-v-elina-svitolina-final-live` | free | per game | 42 blocks / ~6.7k words | Season-ending championship voice, no slam mythology attached |
| G9 | Kerber d. Osaka (W) | WTA Finals 2018, round robin | `/sport/live/2018/oct/24/angelique-kerber-naomi-osaka-wta-finals-group-stage-live-tennis` | free | per game | 40 blocks / ~6.3k words | Dead-rubber-adjacent group match: how the writer fills time when the stakes are procedural |
| G10 | Osaka d. S. Williams (W) | US Open 2018, final | `/sport/live/2018/sep/08/serena-williams-naomi-osaka-live-us-open-womens-final` | free | per game | 27 blocks / ~7.2k words | The code-violation final. Shows how live text handles an off-court incident swallowing the match |
| G11 | S. Williams d. Safarova (W) | Roland Garros 2015, final | `/sport/live/2015/jun/06/serena-williams-v-lucie-safarova-french-open-2015-womens-final-live` | free | per game | 49 blocks / ~7.3k words | Classic three-setter with a visibly ill favourite; illness/fitness vocabulary |
| G12 | Suárez Navarro v Razzano (W) | Roland Garros 2015, R1 | `/sport/live/2015/may/27/carla-suarez-navarro-v-virginie-razzano-french-open-2015-live` | free | per game | 15 blocks / ~4.1k words | **The ordinary early-round match.** Sparsest blog in the set – the honest baseline |
| G13 | Stephens d. Watson (W) | Roland Garros 2015, R2 | `/sport/live/2015/may/28/heather-watson-v-sloane-stephens-french-open-2015-live` | free | per game | 22 blocks / ~5.1k words | Second ordinary-round sample, home-player framing |
| G14 | Multi-match day (W+M) | Wimbledon 2026, day six | `/sport/live/2026/jul/04/wimbledon-2026-swiatek-rybakina-zverev-and-anisimova-in-action-on-day-six-live` | free | selected moments across courts | 35 blocks / ~5.6k words | Day-blog format: cuts between matches, top seeds knocked out |
| G15 | Cobolli w/o Arnaldi (M) | Roland Garros 2026, semi-finals | `/sport/live/2026/jun/05/french-open-2026-jakub-mensik-alexander-zverev-cobolli-arnaldi-mens-semi-finals-live` | free | per game, then withdrawal | 53 blocks / ~8.8k words | **Withdrawal.** How a blog absorbs a match that never happens |
| G16 | Wimbledon day four (W+M) | Wimbledon 2024, day four | `/sport/live/2024/jul/04/wimbledon-2024-djokovic-swiatek-in-action-plus-murray-in-the-doubles-on-day-four-live` | free | selected moments | 32 blocks / ~6.0k words | Day-blog containing an in-match retirement |
| G17 | Djokovic d. Auger-Aliassime (M) | Wimbledon 2026, quarter-finals | `/sport/live/2026/jul/07/wimbledon-2026-quarter-finals-sinner-osaka-djokovic-and-gauff-in-action-live` | free | per game | 53 blocks / ~7.1k words | Five-set marathon; the endurance register |
| G18 | Sinner d. Zverev (M) | Wimbledon 2026, final | `/sport/live/2026/jul/12/wimbledon-tennis-jannik-sinner-alexander-zverev-mens-singles-final-live` | free | per game | 47 blocks / ~8.0k words | Men's-final control sample against G1 |

Prefix every URL with `https://www.theguardian.com`.

---

## 2. BBC Sport live text

Free. Crawler-blocked, browser-fine. Two URL generations, **both still serving**:

- current: `https://www.bbc.com/sport/tennis/live/<alphanumeric-id>`
- legacy (2014-era): `https://www.bbc.com/sport/live/tennis/<numeric-id>`

### How the BBC writes a match

Entries are far shorter and far more numerous than the Guardian's – 158 posts on a
single semi-final day, paginated rather than one scroll. Each post carries a headline
that is a bare event label plus a to-the-minute timestamp: `Gauff breaks`,
`Gauff holds to love`, `Gauff match points`, `Game, set and match - Gauff` (BBC Sport).
Big moments go all-caps in the older pages (`TIE-BREAK`, `GAME, SET AND MATCH`). A
large share of posts are untitled and render as `Post` – those are the running
one-or-two-sentence beats between the labelled events. There is **no running score in
the heading**, unlike the Guardian; the score lives in the body or in a separate
scoreboard component, which makes BBC posts less self-contained but much closer in
shape to atomic commentary events a game engine would emit. Day pages interleave
several courts plus press-conference quotes.

| # | Match / day | Event, year | URL | Free | Granularity | Length | Notes |
|---|---|---|---|---|---|---|---|
| B1 | Sabalenka and Gauff reach the final (W) | Roland Garros 2025, women's semi-finals | `https://www.bbc.com/sport/tennis/live/c807z70k4kmt` | free | per game, per point at match points | 158 posts, paginated | Best modern BBC women's sample. Covers the Boisson home-crowd story and a straight-sets Gauff close |
| B2 | Day 10 quarter-finals | Wimbledon 2014 | `https://www.bbc.com/sport/live/tennis/28113187` | free | per game, per point in tie-breaks | ~3.9k words/page | **12 years old and still live.** Consecutive `TIE-BREAK` posts show per-point mode |
| B3 | Murray and Djokovic win | Wimbledon 2014 | `https://www.bbc.com/sport/live/tennis/26944986` | free | selected moments across courts | ~121 KB page | Legacy day-blog |
| B4 | Best of day four | Wimbledon 2014 | `https://www.bbc.com/sport/live/tennis/26944894` | free | selected moments | ~114 KB page | Early-round day, lower-profile matches |

---

## 3. Other editorial live blogs

| # | Match | Source | URL | Free | Granularity | Verdict |
|---|---|---|---|---|---|---|
| E1 | Rybakina d. Sabalenka (W), AO 2026 final | Flashscore News | `https://www.flashscore.com/news/tennis-australian-open-wta-singles-australian-open-live-aryna-sabalenka-takes-on-elena-rybakina-in-final-showdown/r78hYW9t/` | free | per set + selected moments only | Confirmed. ~9–10 timestamped entries for a three-set final. Thin, functional, no colour |
| E2 | Rybakina d. Sabalenka (W), AO 2026 final | Outlook India | `https://www.outlookindia.com/sports/tennis/aryna-sabalenka-vs-elena-rybakina-live-score-australian-open-2026-womens-singles-final-update-grand-slam-highlights` | free | mostly per game | Confirmed. ~30 entries. Writes the score as set-label plus games, e.g. first set then `0-2`. Useful contrast with E1 on the identical match |
| E3 | Sabalenka d. Gauff (W), AO 2024 SF | Al Jazeera | `https://www.aljazeera.com/sports/liveblog/2024/1/25/live-aryna-sabalenka-vs-coco-gauff-2024-australian-open-womens-singles-semifinal-updates` | free | **none surviving** | Confirmed dead as live text. The page loads but the blog has collapsed to a closed-page notice plus a one-paragraph result summary. Do not rely on Al Jazeera for archive live text |

### Blocked or unverified – recorded, not listed as confirmed

- **NBC News** live blogs (e.g. Wimbledon 2025 women's final, `rcna218102`): HTTP 403 to automated fetch. Unverified.
- **ESPN** live blogs (e.g. AO 2026 `id/47761084`): page returns only navigation and headline furniture to a fetch; the blog body did not render. Unverified.
- **Olympics.com** "as it happened" pages (e.g. Wimbledon 2025 women's final): two fetch attempts timed out. Unverified.
- **Sky Sports** `/tennis/live-blog/<id>/<id>/<slug>` URLs are **player hubs**, not per-match live text – the Draper and Raducanu pages are career/news pages whose embedded blog widget reported itself unavailable. Negative finding.
- **TNT Sports** (redirected from `eurosport.com`) uses per-match `live.shtml` score pages rather than persistent prose blogs. Not verified as surviving the event.
- **Matchstat** (`matchstat.com`): HTTP 403. Unverified.
- **Telegraph / NYT**: not pursued – both are hard paywalls for archive live blogs, so they fail the "owner can open and read it" test by construction.

---

## 4. Aggregator point-by-point – the durable, free, per-point layer

This is the strongest prose-free source and it is far more persistent than expected.

### Flashscore

Canonical, deep-linkable URL shape:
`https://www.flashscore.com/match/tennis/<p1-slug>/<p2-slug>/summary/point-by-point/set-1/?mid=<matchId>`

Rendering is per set, then per game. Each game line shows a server marker
(`LOST SERVE` when the server is broken), the game score progression as a comma-chain
of point scores, inline `BP` / `SP` / `MP` markers on the relevant points, and a
terminal `GAME` / `BREAK` / `SET` label. Advantage is written `A:40` / `40:A`. No prose
at all – this is effectively a score-state log with event flags, which is much closer
to a simulator's internal representation than any live blog.

| # | Match | Event | URL | Free | Granularity | Notes |
|---|---|---|---|---|---|---|
| F1 | Swiatek d. Anisimova (W) | Wimbledon 2025, final | `https://www.flashscore.com/match/tennis/anisimova-amanda-nwkutKbi/swiatek-iga-jNyZsXZe/summary/point-by-point/set-1/?mid=vHI3O3iM` | free | **per point** | **The routine-blowout reference**: 6-0 6-0 in 58 minutes. Every game in set one is a break or a hold to 40. 13 months old, fully intact |
| F2 | Halep d. S. Williams (W) | Wimbledon 2019, final | `https://www.flashscore.com/match/tennis/halep-simona-nN1Fd8dC/williams-serena-ttsu68nH/summary/point-by-point/set-1/?mid=jFGAo8HU` | free | **per point** | **Seven years old, fully intact.** This is the evidence that Flashscore point-by-point does not expire |
| F3 | WTA 250 archive | Hobart 2025 | `https://www.flashscore.com/tennis/wta-singles/hobart-2025/results/` | free | tournament index, 49 matches, each with its own point-by-point tab | Proof the same depth exists at 250 level, not just slams |
| F4 | Tournament archive index | any event | `https://www.flashscore.com/tennis/wta-singles/wimbledon-2019/results/` | free | results grid | Season-archive pattern: swap the year in the slug |

One caveat found while testing: `.../wta-singles/us-open-2025/results/` rendered the
correct season header but an **empty** results grid, while the Wimbledon and Hobart
equivalents populated normally. Some archive slugs are simply broken; if a page comes
back empty, try the tournament's `ARCHIVE` tab rather than assuming the data is gone.

### Sofascore

Sofascore exposes the same data as **JSON on a public, same-origin endpoint**, which
makes it the most machine-readable of the free live sources:

`https://www.sofascore.com/api/v1/event/<eventId>/point-by-point`

Response is `pointByPoint[] → games[] → points[]`, each point carrying the home and
away point strings, a serving indicator and a point-type flag. Player and event
lookup run through `/api/v1/search/all?q=<name>` and
`/api/v1/team/<id>/events/last/<page>`. Note that `api.sofascore.com` returns 403 to a
plain client – the calls must originate from a `sofascore.com` page.

| # | Match | Event | Event id / URL | Free | Granularity | Notes |
|---|---|---|---|---|---|---|
| S1 | Krejcikova d. Paolini (W) | Wimbledon 2024, final | `https://www.sofascore.com/tennis/match/jasmine-paolini-barbora-krejcikova/YhzsiJC#id:12457915` | free | **per point, JSON** | Two years old, three sets returned in full |
| S2 | Krejcikova d. Rybakina (W) | Wimbledon 2024, semi-final | event id `12457914` | free | per point, JSON | Same event, same depth |
| S3 | Halep d. Azarenka (W) | Wimbledon 2019, R3 | event id `8279689` | free | per point, JSON | **Seven years old, still returns point data.** Second independent proof of persistence |
| S4 | Hipfl v Krutykh (M) | ITF M25 Ceska Lipa, June 2026 | event id `16295417` | free | per point, JSON | **ITF M25 level** – the lowest rung tested, and point-by-point is still there |

### Tennis24 / Livescore

`tennis24.com` is a Flashscore-family site (same operator, same feed shape) covering
"major tennis events as well as challengers and ITF tournaments" (Tennis24). It adds
nothing Flashscore does not already give, so it is a fallback, not a separate source.
`livescore.com` renders nothing useful to a fetch and advertises no point-by-point
depth; not recommended.

---

## 5. Tennis Abstract charted matches – shot-by-shot, free to read

`https://www.tennisabstract.com/charting/<match_id>.html`, where `<match_id>` is
`YYYYMMDD-W-Tournament-Round-Player1-Player2` (underscores for spaces, `W` or `M`).
Free, no login. Each page carries Stats Overview, Serve Statistics, Serve Influence,
Key Point Outcomes, Point Outcomes by Rally Length, Serve Direction, Shot Direction,
Shot Types, Net Points and a full **Point-by-point description** section – prose-free
shot-by-shot rally reconstruction, the single most simulator-shaped human-readable
artefact found in this survey. Pages run 300–370 KB.

The exact `match_id` matters: getting player order wrong 404s. Look the id up in
`charting-w-matches.csv` (see section 7) rather than guessing.

| # | Match | Event / round | match_id | Verified |
|---|---|---|---|---|
| T1 | Krejcikova d. Paolini (W) | Wimbledon 2024, final | `20240713-W-Wimbledon-F-Jasmine_Paolini-Barbora_Krejcikova` | 200, 346 KB |
| T2 | Paolini d. Vekic (W) | Wimbledon 2024, semi-final | `20240711-W-Wimbledon-SF-Jasmine_Paolini-Donna_Vekic` | 200, 372 KB – **deciding-set tie-break** |
| T3 | Kostyuk d. Andreeva (W) | Madrid 2026, final (WTA 1000) | `20260502-W-Madrid-F-Marta_Kostyuk-Mirra_Andreeva` | 200 |
| T4 | Joint v Mertens (W) | Hobart 2025, semi-final (**WTA 250**) | `20250110-W-Hobart-SF-Maya_Joint-Elise_Mertens` | 200, 318 KB |
| T5 | Berecoechea v Charaeva (W) | ITF Pretoria 2024, R16 (**ITF level**) | `20240228-W-ITF_Pretoria-R16-Nahia_Berecoechea-Alina_Charaeva` | 200, 299 KB |

Coverage is slam-skewed but real at every level: the women's file holds 442 Australian
Open, 347 US Open, 279 Wimbledon and 253 Roland Garros matches, then 205 Indian Wells,
192 Miami, 106 Madrid, 101 Doha, and a long tail of named ITF events (Trnava, Pretoria,
Antalya, Bengaluru, Berkeley and dozens more).

---

## 6. Levels we could not fill

- **Juniors: no live text exists that we could find.** Sofascore's search returns no
  junior tennis entities at all. The ITF's World Tennis Tour Juniors pages publish
  draws and scorelines plus a video platform, but no text commentary and no
  point-by-point. Junior events surface in Guardian and BBC day blogs only as passing
  mentions. Treat junior commentary as something the game must invent, with no corpus
  to imitate.
- **Challenger / ITF prose**: none. Editorial live blogs stop at tour level. The only
  coverage below WTA 250 is the aggregator point-by-point layer (S4) and Tennis
  Abstract's charted ITF matches (T5) – both scoreline/shot data, zero prose.
- **Official match centres**: effectively unusable for us.
  `atptour.com` returns **403 to every non-browser client**, including its Stats Centre
  archive pattern `.../en/scores/stats-centre/archive/<year>/<tournId>/<matchId>`
  (which does carry Key Stats, Rally Analysis, Stroke Analysis, Court Vision and
  MatchBeats point-by-point, but only for matches from Antwerp 2021 onwards, and it is
  men's only). `wtatennis.com/scores` loads (HTTP 200) but is a client-side app whose
  server HTML contains no per-match links and no point-by-point markers at all – there
  is no durable public WTA per-match point record we could reach. `wimbledon.com`,
  `usopen.org` and `ausopen.com` timed out or gave nothing conclusive; the practical
  answer is that the slams' own MatchBeats/SlamTracker records are best obtained from
  the scraped archives in section 7 rather than from the tournament sites.

---

## 7. Structured and downloadable – the most valuable finding, and a licence problem

### 7a. What survives

| Dataset | URL | Contents | Licence |
|---|---|---|---|
| **Match Charting Project** (live, maintained) | `https://github.com/JeffSackmann/tennis_MatchChartingProject` | **4,080 women's** and **7,566 men's** charted matches. `charting-w-points-*.csv` gives shot-by-shot data per point; 22 aggregate `-stats-` files per gender | **CC BY-NC-SA 4.0** |
| **Sackmann archival mirror** (the important one) | `https://github.com/Aneeshers/tennis-sackmann-archive` and `https://huggingface.co/datasets/Aneeshers/tennis-sackmann-archive` | `slam_pointbypoint/` – **166 CSVs, 2011–2024, all four slams**, singles + doubles + mixed. `atp/` 174 CSVs and `wta/` 125 CSVs of match results, rankings and player tables through 2026 | **CC BY-NC-SA 4.0** |
| Older fork of the slam data | `https://github.com/halepmania/tennis_slam_pointbypoint` | 2011–2015 slams only, last pushed 2015 | inherits CC BY-NC-SA 4.0, no LICENSE file |
| SCORE Network shot-level extracts | `https://data.scorenetwork.org/tennis/tennis-shot-level-data.html` | Eight gzipped CSVs, one per tour per slam, 176k–646k shots each, derived from the Match Charting Project | CC BY-NC-SA 4.0 |
| ATP scraper (code, not data) | `https://github.com/glad94/infotennis` | Python for pulling ATP Key Stats, Rally Analysis, Stroke Analysis and Court Vision. Men's only, matches from Antwerp 2021 onward | see repo |

**The Grand Slam point-by-point schema is the one to build against.** Verified on
`slam_pointbypoint/2024-wimbledon-points.csv` (7.8 MB, **48,155 point rows** across the
whole draw, men and women). 50 columns per point, including: `ElapsedTime`, `SetNo`,
`P1GamesWon`/`P2GamesWon`, `GameNo`, `GameWinner`, `PointNumber`, `PointWinner`,
`PointServer`, `Speed_KMH`, **`Rally`** (rally length), `P1Score`/`P2Score`, momentum,
and per-point boolean flags for ace, winner, double fault, unforced error, forced
error, net point, net point won, break point, break point won, break point missed,
first/second serve in and won, plus a `History` string. The women's Wimbledon 2024
final is `2024-wimbledon-2701` (Krejcikova v Paolini); women's match numbers are the
`2xxx` block, men's `1xxx`.

The Match Charting Project points schema is different and complementary:
`match_id, Pt, Set1, Set2, Gm1, Gm2, Pts, Gm#, TbSet, Svr, 1st, 2nd, Notes, PtWinner`,
where `1st` and `2nd` hold the hand-charted shot notation for the rally on each serve.

Both are directly consumable as commentary training/reference material: you can derive
"break point saved", "deciding-set tie-break", "routine hold to love", "retirement" and
rally-length bands straight from the columns without any text processing. Worked
example from this survey: filtering `2024-wimbledon-points.csv` for a third set at
6-6 identified all five women's deciding-set tie-breaks that fortnight, including the
Paolini v Vekic semi-final, which then mapped straight onto entries G5 and T2 above.

### 7b. The licence problem, stated plainly

Every structured tennis dataset found is **CC BY-NC-SA 4.0**. The Match Charting
Project README is explicit: "Attribution is required. Non-commercial use only."
(Jeff Sackmann / Tennis Abstract Match Charting Project). The maintainer additionally
warns that continued licence violations may end the project.

For Ties Break this means: fine for **offline research, calibration and model
sanity-checking**; **not** shippable in, or as the basis of, a commercial product,
and the ShareAlike clause would infect any derived dataset we distributed. If the game
is ever monetised, any commentary or match-model artefact traceable to these files is a
legal exposure. Use them to *learn* the distributions, do not embed them.

---

## 8. Ephemerality – what actually disappears

The brief expected aggregator point-by-point to vanish within days or weeks. **Tested
directly, and it does not.**

- Flashscore served complete point-by-point for the **2019** Wimbledon women's final
  (F2) and the 2025 women's final (F1) on demand, seven years and thirteen months after
  the fact respectively.
- Sofascore returned point-level JSON for a **2019** Wimbledon third-round match (S3)
  and for an **ITF M25** match (S4).
- BBC live text pages from **Wimbledon 2014** are still served on their original URLs
  (B2, B3, B4), twelve years on.
- The Guardian MBM index runs to 68 pages and still resolves 2015 blogs (G11–G13).

What *is* fragile is different, and worse:

1. **Jeff Sackmann's ATP, WTA and Grand Slam point-by-point repositories have been
   deleted from GitHub.** As of 11 August 2026 the `JeffSackmann` account has exactly
   **one** public repository, `tennis_MatchChartingProject`. `tennis_atp`,
   `tennis_wta` and `tennis_slam_pointbypoint` all return 404 from both the web UI and
   the GitHub API, while search engines still index their file listings – so any
   tutorial, notebook or agent that cites those URLs is now pointing at nothing. The
   community mirror in section 7a is currently the only complete route to that data.
   **Clone it rather than linking to it.**
2. **Al Jazeera** live blogs self-destruct into a closed-page notice plus a summary
   paragraph (E3). The URL survives, the content does not.
3. **Guardian blogs lazy-load.** A naive fetch captures 30–55 blocks; the rest need
   scroll or block-anchored pagination. A saved copy taken without scrolling is
   silently partial.
4. **Sofascore's date-indexed endpoint is short-window** – querying a past date's
   scheduled events returned zero, while the per-event point-by-point for the same era
   returned in full. Archive by event id, never by date.
5. **Flashscore archive slugs are not uniformly reliable** – the 2025 US Open WTA
   results page rendered empty while its Wimbledon and Hobart equivalents worked.
6. **Bot-blocking is the practical failure mode, not deletion.** `atptour.com`,
   `matchstat.com` and NBC News return 403 to automated clients; `theguardian.com`,
   `bbc.com` and `bbc.co.uk` refuse Anthropic's crawler entirely. All of these are
   readable in a normal browser. Do not confuse "our tools cannot see it" with
   "it is gone".

---

## 9. Practical recommendation

Three layers, in descending order of usefulness to the engine:

1. **Structured** – clone `Aneeshers/tennis-sackmann-archive` now (deletion risk is
   demonstrated, not hypothetical) plus the live Match Charting Project. Research and
   calibration only, given CC BY-NC-SA.
2. **Per-point free web** – Flashscore and Sofascore for any specific match we want to
   inspect, at any level from slam final down to ITF M25, going back at least to 2019.
   Sofascore's JSON endpoint is the one to script against.
3. **Prose register** – the Guardian for the shape of a game-level narrative block with
   the running score in the heading, the BBC for atomic, labelled, timestamped
   commentary events. Read them; do not copy them. The pairs that teach the most are
   G3/G4 versus G1 (routine final versus drama), G12 versus G6 (early round versus
   final), and E1 versus E2 (two outlets on the identical match).
