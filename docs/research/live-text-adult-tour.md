---
type: research
status: reference
area: content/commentary
canonical: false
last-reviewed: 2026-08-10
---

# Live text commentary in adult professional tennis

**What real running text about a tennis match actually looks like, so our generated commentary can be
modelled on it rather than invented.** Scope is the adult professional game: ATP, WTA, and the four
Grand Slams. Juniors, wheelchair and ITF tiers are out of scope except where they share a feed.

## 0. Method, and what is verified vs. characterised

Everything in sections 2 and 3 marked **verified** was read directly out of the live product in a
browser on 10–11 August 2026: the pages were opened, the tabs clicked, and in several cases the
underlying JSON response body was captured. Those are the load-bearing findings.

Two important sources could **not** be read directly in this session: **theguardian.com** and
**bbc.co.uk/bbc.com** both refuse the automated fetch agent. Their formats are described in section
2.6 and are marked **not directly verified** – treat those specific paragraphs as lower confidence
than the rest of the document.

Where a claim could not be established, it says so. There are several of those and they are more
useful than a plausible guess.

---

## 1. The product classes

There are **five** distinguishable products, not four. The brief listed four; the fifth – LLM-written
per-point prose on an official Grand Slam site – is new since 2025 and is the single most relevant
one for us.

| # | Product | Producer | Human / machine | Granularity | Prose? | Access |
|---|---|---|---|---|---|---|
| A | Editorial live blog | Guardian, BBC Sport, NYT/Athletic, Eurosport, Al Jazeera, Sky, national outlets | Human journalist, 1–3 per blog | Notable moment; tightens to per-game or per-point in a dramatic passage | Yes, paragraphs | Free (Guardian, BBC, Al Jazeera); paywalled (Athletic) |
| B | Official deterministic point-by-point | Wimbledon/US Open (IBM), Australian Open + Roland-Garros (Infosys), ATP Tour (Infosys/Hawk-Eye) | Machine, template-filled | **Every point**, plus game/set/match boundaries | Yes – one fixed-grammar sentence per point | Free, no login |
| C | Official LLM point-by-point | Australian Open, Roland-Garros ("AI Commentary", Infosys) | Machine, generative | Every point **and** every game | Yes – a 3–5 sentence paragraph per point, 5–9 sentences per game | Free, no login |
| D | Aggregator point-by-point | Flashscore/Tennis24, Sofascore, LiveScore | Machine, from the official scoring feed | Every point | **No prose at all** – score strings and flags only | Free, ad-supported |
| E | Social / short-form | @Wimbledon, @usopen, @atptour, @WTA, tournament accounts | Human editor, often from a template card | Per set, per break, per match point; rarely per game | Yes, one line + graphic | Free |

Two structural observations that matter more than the taxonomy:

1. **The aggregators carry no language whatsoever.** Flashscore and Sofascore are pure score-state
   machines. If we are copying "point-by-point feeds", copying them gives us nothing to write.
2. **The prose ladder is: official deterministic (B) → official generative (C) → human (A).** These
   are three different registers, and a good match viewer probably wants two of them running at once
   – a terse always-on line per point, and an occasional richer paragraph. That is exactly the
   architecture the Australian Open ships.

### 1.1 Class B in detail – official deterministic

**Wimbledon** and the **US Open** run IBM SlamTracker. **Australian Open** and **Roland-Garros** run
the Infosys Match Centre. (Common write-ups put IBM at Roland-Garros; that is wrong. IBM is
Wimbledon and the US Open only, and has no ATP relationship.) Despite different vendors, Wimbledon
and Melbourne emit **the same sentence grammar** – see 2.1. That is a strong signal that the grammar
is the de facto industry standard rather than one vendor's style.

**ATP Tour** (atptour.com) is the odd one out. Its Stats Centre has a **MatchBeats** view which is
point-by-point but *graphical* – a strip of point scores per game with hold/break labels and game
duration. Its only prose is a **single rolling status string** for the match as a whole plus a
per-set "Insight" sentence. Verified.

**WTA** (wtatennis.com) has **no public point-by-point view at all.** The match centre is aggregate
stats only, and the free API carries a coded status message per match but no per-point history.
Verified. It does, however, sell both point-by-point **and live text commentary** through a
subscription developer API – see 4.1.1, this is the only official live-commentary feed found
anywhere in this research.

### 1.2 Class E – social

Characterised, **not verified in this session** (no search budget remained to sample accounts). The
observable pattern from ordinary use is: official accounts post at set boundaries, at breaks in
decisive games, and at match point; the text is one sentence plus a score graphic, and the score in
the text is the *set* score, not the game score. Do not rely on this paragraph for design decisions
without checking it.

---

## 2. The language and structure

This is the useful part. It is presented as **patterns with slots**, not as quoted commentary.

### 2.1 The deterministic grammar (verified, IBM Wimbledon + Infosys Australian Open)

Read directly from the 2026 Wimbledon Gentlemen's Singles final (Sinner–Zverev) point history and
the 2026 Australian Open Men's Singles final (Alcaraz–Djokovic) commentary tab. Every single line in
both products fits **one** template:

```
{Player} {VERB-PHRASE} with {ARTICLE} {SHOT-DESCRIPTOR}
```

There is no other shape. No score in the sentence, no adjectives, no variation in rhythm.

**VERB-PHRASE inventory (complete, as observed across a full 4-set match):**

| Verb phrase | Fires when |
|---|---|
| `wins the point` | ordinary point, ended by the named player's winning shot |
| `loses the point` | ordinary point, ended by the named player's error |
| `wins the game` | game-deciding point, winner framing |
| `loses the game` | game-deciding point, error framing |
| `wins the set` | set-deciding point, winner framing |
| `loses the set` | set-deciding point, error framing |
| `wins the match` | match-deciding point |
| `wins the break point` | break point converted, winner framing |
| `loses the break point` | break point lost by the returner's error |
| `saves the break point` | server survives a break point with a winning shot |
| `fails to convert the break point` | returner loses a break point with an error |

Note the elegance of this: **the subject of the sentence is always the player who hit the last ball**,
and the verb flips between win/lose depending on whether that ball was a winner or an error. That one
rule generates natural-sounding attribution from a Markov engine that only knows
`(pointWinner, endingShot)`.

Non-point events use flat standalone sentences with a period: players arriving on court, players
warming up. The Australian Open adds a game-start line of the shape
`{Server} is serving game {N}`.

**SHOT-DESCRIPTOR inventory (complete, as observed):**

```
ace
service winner
double fault
{forehand|backhand} winner
{forehand|backhand} volley winner
{forehand|backhand} smash winner
{forehand|backhand} unforced error
{forehand|backhand} forced error
{forehand|backhand} volley unforced error
{forehand|backhand} volley forced error
```

So the descriptor is a three-slot composite: `[wing] [shot-type] [outcome]`, with `ace`, `service
winner` and `double fault` as three special-cased atoms that take no wing. Article is `a` except
before `ace` (`an`). Wimbledon renders the descriptor lower case; the Australian Open renders it
Title Case ("Forehand Unforced Error"). Otherwise identical.

Quoting one example under the copyright limit: the Wimbledon feed's line for a net point reads
"wins the point with a backhand volley winner" (IBM SlamTracker, wimbledon.com).

### 2.2 How the score is attached (verified)

**The score is never inside the deterministic sentence.** It is a separate rendered element sitting
next to it. This is the most important structural fact in the document and it is universal across
IBM, Infosys, Flashscore and Sofascore.

Conventions observed:

| Context | Rendering | Source |
|---|---|---|
| Game score, official Slam sites | `40 - 30`, `15 - 40`, `AD - 40`, `40 - AD` – **server first**, spaced hyphen, `AD` not "advantage" | Wimbledon, AO (verified) |
| Game score, Flashscore | `0:15`, `30:40`, `40:A` – **colon**, and **home-player first, not server first** | Flashscore (verified) |
| Game score, Sofascore API | `homePoint` / `awayPoint` as `"0" "15" "30" "40" "A"` | Sofascore (verified) |
| Deuce | rendered as `40 - 40` / `40:40`, **not** as the word "Deuce", on all four | verified |
| Tiebreak | plain integers in the same slot: `7 - 8` | Wimbledon (verified) |
| Game-boundary marker | the score slot is replaced by a word: `FINISH` (Wimbledon), `Game` (AO), `GAME` / `BREAK` / `SET` (Flashscore) | verified |
| Set score in a game header | `Game 8 - A. Zverev 4-4` = game number, server, set score **after** the game | Wimbledon (verified) |
| Match result string | `[12]B. Bencic d [25]A. Eala 6-4,6-0` – seed in brackets, `d` for "defeated", no spaces after commas | WTA API (verified) |
| Set list in prose | `6-2 6-4` space-separated, or `2-6, 6-2, 6-3, 7-5` comma-separated | ATP / AO (verified) |

**The asterisk convention** (`*6-4 3-2`, asterisk marking the server) is a *live-blog and
messageboard* convention, not an official-feed one. It appears in Guardian-style running text and in
some aggregator compact views. It did **not** appear in any of the official feeds inspected. I could
**not verify** its usage directly this session because the Guardian is unreachable to the fetch
agent – treat it as a real convention but confirm before shipping it as our default.

Practical consequence for us: **pick one orientation and never change it.** Official Slam sites are
server-first; aggregators are fixed-player-first. Mixing them inside one viewer is how you get bug
reports.

### 2.3 The generative layer (verified, Australian Open "AI Commentary")

The Australian Open ships a second commentary tab, labelled "AI Commentary / New", generated by
Infosys on an AWS Bedrock foundation model over the Bolt6 tracking feed. It replaces every
deterministic one-liner with a **paragraph**. This is the closest thing in the real world to what a
game's commentary generator should aim at.

**Per-point paragraph, observed structure – four beats, in this order:**

1. **Serve beat.** Server, serve number, speed in km/h, direction (`out-wide` / `down-the-T` /
   `to the body`), and its effect on the returner's position.
2. **Return beat.** Returner, wing, speed, direction (`cross-court`), depth (`deep` /
   `medium-deep`), and whether they were stretched.
3. **Decisive beat.** Who ended it, with what shot, and a judgement adverb – the model reaches for
   words meaning *inexplicably* or *surprisingly*, and for a clause noting the player was under
   little pressure, when the ending shot was an unforced error from a neutral position.
4. **Score beat.** One clause restating the resulting score.

**Per-game paragraph, observed structure – five beats:**

1. Outcome headline: held or broken, and the resulting set score.
2. Stakes: what the game means for the match, in the register of "keeps his championship hopes alive"
   (Australian Open AI Commentary, ausopen.com).
3. Statistical spine: serve speed range across the game, number of deuces, break points faced.
4. The single highlight point, named with its score context.
5. Forward look: what the next game is now.

**Failure modes observed in the shipped product** – worth copying as anti-patterns:

- **Unrounded numbers leak.** Serve speeds appear as clean integers but return speeds appeared to two
  decimal places in the same sentence. Round everything at the template boundary.
- **Raw coordinates leak.** One paragraph reported a player stretched "at -3.83m", a tracking-frame
  value that means nothing to a reader. Never let a raw engine value reach the text.
- **The score beat is inconsistent.** Across three consecutive points it appeared as "Score: X 30 -
  Y 15", "X now leads 15-40", and "leveling the score at 15-15". Pick one and lock it.
- **One verb dominates.** The construction "gifting X the point" recurs on nearly every error point.
  A generator needs a rotation with suppression of recently-used variants.

Also documented (IBM, Wimbledon 2024 "Catch Me Up"): factual errors in generated text – a player
described with the wrong national ranking, two established players called up-and-comers, and win
totals off by one to five. The lesson is that generated prose must only ever assert facts the engine
actually holds, never inferred colour.

### 2.4 The ATP's one-line status string (verified)

The ATP live feed carries a single rolling `Message` / `ExtendedMessage` string per match, which the
site prints under the scoreboard. Two states were captured directly:

- match end – a "Game Set and Match {names}" clause followed by a second sentence restating the
  winner and set scores;
- suspension – a single flat sentence, quoted here under the limit: "The match has been suspended due
  to rain." (ATP Tour Hawk-Eye match stats feed, atptour.com).

Both carry visible template artefacts (a literal `\r\n`, doubled spaces around interpolated scores, a
space before the closing period). Real machine feeds look machine-made, and nobody minds. We should
not over-polish ours to the point that it stops reading as a feed.

The ATP also emits a **per-set editorial-style insight sentence** in MatchBeats, of the shape
`{Player} took a crucial break in the {N}th game.` – one sentence per set, not per point.

### 2.5 The rarer events (partially verified)

| Event | What the feeds do |
|---|---|
| **Break point** | Has its own four verb phrases (2.1) plus a boolean flag triple in the data (`BreakPoint`, `BreakPointWon`, `BreakPointOpportunity`). Flashscore/Sofascore render a `BP` badge on the point. **Verified.** |
| **Set point / match point** | Flashscore renders `SP` badges (and by extension `MP`); the Slam feeds have no distinct sentence – they use `wins the set` / `wins the match` on the point that lands. **Verified for Flashscore and Wimbledon.** |
| **Medical timeout** | The WTA platform carries a dedicated match state `M = "Medical Timeout"`, and `D = "Timeout"`. So it is a *state change on the scoreboard*, not a commentary line. **Verified** from the WTA translation bundle. |
| **Retirement / walkover** | WTA renders `RET` and `WO` as score-line abbreviations. Result strings become e.g. a set score followed by `RET`. **Verified** (labels), **not verified** (the prose sentence, if any). |
| **Suspension** | ATP: a full flat sentence replacing the score message; WTA state `S = "Suspended"`. **Verified.** |
| **Challenge / review** | WTA carries a match state `R = "Challenge"` and the Wimbledon point record still has a `ChallengeWon` field. But **challenges are effectively dead**: electronic line calling is mandatory ATP-wide and at Wimbledon since 2025, and at the AO/US Open since 2021. Roland-Garros still used human line judges through 2026. What replaced it is **Video Review** (not-up, foul shot, touch, hindrance, scoring error), rolled out across the ATP Masters 1000 in 2025. If our game is set in the present day, a challenge system is an anachronism except on clay. |

### 2.6 The human live blog (partially verified)

**Verified directly (Al Jazeera, Wimbledon 2025 final live blog):**

- Reverse-chronological. Newest entry at the top.
- Byline names 2–3 journalists at the head of the page, not per entry.
- Each entry: a timestamp (`13 Jul 2025 - 19:34 (19:34 GMT)`), a **short bold headline** of 2–7 words,
  then 1–4 short paragraphs of 1–3 sentences each.
- Headlines are *editorial*, not scoreboard: they are things like "It's a wrap" or "Tale of the tape",
  or a pull-quote from a player. They are not "Break point Sinner".
- Granularity is **notable moment**, not per point. Entries interleave photos, player quotes,
  historical context, and cross-promotion of other events.
- The page title carries the "– as it happened" suffix once the match ends, and the live blog is
  closed with a pointer to the match report.
- Stats appear in prose, in a dedicated "tale of the tape" entry, as percentages with both players
  contrasted in one sentence.

**Not directly verified in this session (Guardian and BBC blocked to the fetch agent).** From search
result summaries plus general familiarity, and flagged accordingly:

- **BBC Sport live text** numbers its entries and prefixes each with a **scoreboard-style label** –
  search snippets confirm labels of the form "Set point" and "Break point" followed by a player name,
  and confirm tiebreak scores rendered in parentheses. This is the *opposite* editorial choice from
  Al Jazeera: BBC labels are score-state, Al Jazeera labels are narrative.
- **The Guardian** runs a game-by-game format where each entry opens with a bolded score line naming
  both players with the set and game score, then a paragraph of running prose. This is where the
  asterisk-for-server convention lives.

Both of the above should be re-verified against the live sites before we copy them literally.

### 2.7 Tone and length modulation – the actual rule

Across all five product classes the modulation is not "the writer gets more excited". It is
**structural**:

| Situation | Deterministic feed | Generative feed | Human blog |
|---|---|---|---|
| Routine point, love game | one 8-word sentence, unchanged | 3-sentence paragraph, flat verbs | **nothing at all** – the point is not mentioned |
| Break point | same sentence, different verb phrase (`saves` / `fails to convert`) | paragraph gains a stakes clause | gets its own entry |
| Game/set/match end | verb changes to `wins the game/set/match`; a boundary marker replaces the score | a 5-beat summary paragraph is inserted | entry with score header and 2–3 paragraphs |
| Long rally | not mentioned | rally length becomes the subject of sentence 1, with the shot count as the headline number and both players' endurance as the theme | described, often with the shot count |
| Momentum swing | not mentioned | per-set narrative | a dedicated reflective entry |

**The single most transferable rule: the deterministic layer never changes register, and the human
layer's escalation is expressed as _entry frequency_ and _entry length_, not as louder adjectives.**
A tennis live blog goes quiet during a 6-1 set and dense during a tiebreak. A generator that emits
one line per point at constant length will read as a feed, not as commentary – which is fine, as long
as something else provides the peaks.

### 2.8 Vocabulary observed, for a word bank

From the deterministic and generative feeds combined, the recurring content words are narrow. Serve:
*out-wide, down-the-T, to the body, first serve, second serve, delivery, unreturnable*. Return:
*cross-court, down the line, deep, medium-deep, stretched, defensive, quality*. Rally: *baseline
exchange, groundstroke, penetrating, corner to corner, direction change, endurance*. Outcome:
*winner, unforced error, forced error, ace, double fault, netted, sailed long, wide*. Pressure:
*under pressure, championship composure, saving, converting, holding, breaking, clinical, crumbled*.
Court: *deuce court, ad court, sideline, baseline, net*.

Notably absent from every official feed: superlatives about the crowd, career narrative, and
anything the data cannot support.

---

## 3. The data fields the automated feeds actually carry

### 3.1 The Wimbledon / IBM per-point record (verified verbatim)

Captured from the `PointHistory` GraphQL response on the 2026 Gentlemen's Singles final. This is the
richest publicly reachable per-point record in tennis and is worth treating as the reference schema.
Field names are exactly as returned:

**Identity and sequence**
`MatchID`, `SetNo`, `GameNo`, `PointNumber`, `ServeNumber`, `Stage`, `ElapsedTime`,
`EpochTimeStart`, `EpochTimeEnd`

**The commentary itself**
`Sentence` – the machine-generated line described in 2.1
`History` – a 5-digit opaque code

**Score state after the point**
`P1Score`, `P2Score` (as `"0" "15" "30" "40" "AD"`), `P1GamesWon`, `P2GamesWon`, `P1SetsWon`,
`P2SetsWon`, `P1PointsWon`, `P2PointsWon`

**Who did what**
`PointWinner`, `GameWinner`, `SetWinner`, `MatchWinner`, `PointServer`, `ServeIndicator`

**Point classification flags (0/1, or player index)**
`Ace`, `Winner`, `DoubleFault`, `UnforcedError`, `NetPoint`, `BreakPoint`, `BreakPointWon`,
`BreakPointOpportunity`, `ChallengeWon`, `Rally20OrMore`, `Deuces5OrMore`

**Shot / serve detail**
`Speed_KMH`, `Speed_MPH` – serve speed
`ServeWidth` – single-letter code; `W` (wide), `B` (body), `C` (centre) observed
`ServeDepth` – `CTL` (close to line) / `NCTL` (not close to line)
`ReturnDepth` – `D` (deep) / `ND` (not deep)
`KickHeight` – a `metres,feet` pair
`WinnerType`, `WinnerShotType` – `B` for backhand observed
`RallyCount` – shot count for the point

**Geometry and physicality**
`Court`, `CourtIndicator` – `A` / `D` for ad and deuce court
`TeamOrientStart`, `TeamOrientEnd`
`P1DistanceRun`, `P2DistanceRun`, `P1DistanceRunTotal`, `P2DistanceRunTotal` – each a
`metres,feet` pair, per point and cumulative

**Momentum**
`P1Momentum`, `P2Momentum` – small integers, observed in the 1–7 range and moving each point
`PointTrack`, `SetTrack`

Observed sample values from one real point: serve 212 km/h / 132 mph, `ServeWidth` `W`, `ServeDepth`
`CTL`, `RallyCount` 1, `Ace` 1 – i.e. a wide ace down the line, one shot. Another: `RallyCount` 22,
`Rally20OrMore` 1, distances run of roughly 55 m and 51 m for that single point.

**This is the field set a commentary generator actually needs.** Our Markov engine will not have
bounce coordinates, but it can plausibly synthesise: serve number, serve speed, serve direction
(3 buckets), rally count, ending shot wing, ending shot type, outcome class, distance run, and the
break/set/match-point flags. That is enough to drive every sentence in 2.1 and most of 2.3.

### 3.2 The Australian Open / Infosys per-point record (inferred from output, not from the wire)

Not captured as JSON, but the generated prose reveals the inputs: serve speed to 1 km/h, serve
direction as an enum, second-serve flag, return speed to 0.01 km/h, return wing, return direction,
return depth as an enum, receiver lateral displacement in metres relative to the sideline, rally
shot count, ending shot wing and type, and per-game aggregates (deuce count, break points faced,
serve speed min/max). Source data is Bolt6 optical tracking, not Hawk-Eye – the AO uses Bolt6
"Sentinel", not Hawk-Eye.

### 3.3 The ATP record (verified)

The ATP site fetches from a path literally named for the vendor, `/-/Hawkeye/MatchStats/{year}/{eventId}/{matchId}`,
returning plain JSON. It is a **match-level** record, not per-point:

- `Match.Message`, `Match.ExtendedMessage` – the rolling status string (2.4)
- `Match.MatchStatus` / `Status` – single letters, `F` finished, `S` suspended
- `Match.ServerTeam`, `Match.LastServer`
- `PlayerTeamN.GamePointsPlayerTeam` – the current game point score as a string
- `PlayerTeamN.Sets[]` – `SetNumber`, `SetScore`, `TieBreakScore`, and a per-set `Stats` block
- Per-set and match `Stats`: `ServeRating`, `Aces`, `DoubleFaults`, `FirstServe`,
  `FirstServePointsWon`, `SecondServePointsWon`, `BreakPointsSaved`, `ServiceGamesPlayed`,
  `ReturnRating`, `BreakPointOpportunities`, `BreakPointsConverted`, `ReturnGamesPlayed`, each as a
  `{Percent, Dividend, Divisor, IsStatBetter}` triple
- `YearToDateStats` for both players, same shape – i.e. the feed ships season context alongside the
  match
- `Match.Reason`, `Match.ScoringSystem`, `Match.NumberOfSets`, `Match.UmpireFirstName/LastName`

The per-point data lives in the separate Infosys MatchBeats endpoint, whose response body is
**encrypted** and decrypted client-side. The rendered view exposes: point score progression per game,
game duration to the second, server, HOLD/BREAK label, running game score, rally-length comparison,
and ace / break point / double fault markers on individual points.

The insight sentences come from an endpoint named `assisted-journalism/insights` – also encrypted.
The name is itself informative: the tour thinks of this as journalism assistance, not commentary.

### 3.4 The WTA record (verified)

`api.wtatennis.com` is a Pulselive-backed public JSON API with no key required. Per match:

`MatchID`, `MatchState`, `MatchTimeStamp`, `MatchTimeTotal`, `NumSets`, `ScoreSys`,
`ScoreSet1A`..`ScoreSet5B`, `ScoreTbSet1`..`ScoreTbSet4`, `ScoreString`, `ResultString`,
`PointA`, `PointB` (current game score), `Serve`, `Winner`, `SeedA`/`SeedB`, `EntryTypeA`/`B`,
player identity fields, `CourtID`, `RoundID`, `DrawLevelType`, `DrawMatchType`, `DateSeq`,
`BinPacketBase64`.

`Message` is a **coded template reference**, not English: values of the form `{11|B. Bencic}` and
`{12|K. Siniakova / S. Zhang}` – a numeric template id plus interpolation arguments, rendered
client-side. I could **not** locate the id→string dictionary; it is not in the public translation
bundle. This is the cleanest real-world example of the architecture we should copy: **the feed emits
a template id plus arguments, and the client owns the wording.** That makes localisation and tone
changes a client concern, which is exactly right for a game.

`MatchState` letters, from the WTA translation bundle (verified verbatim):
`C` On Court, `D` Timeout, `E` LIVE, `F` Finished, `L` Cancelled, `M` Medical Timeout, `P` Live
Match, `R` Challenge, `S` Suspended, `T` Live, `U` Upcoming, `W` Warmup.

WTA match-centre stat labels (verified): Aces, Break Points, Service Winners, Unforced Errors,
Forced Errors, Double Faults, Winners.

### 3.5 The aggregator records (verified)

**Flashscore** point-by-point, per game: serving-player flag, running game score, an ordered list of
point-score strings (`0:15`, `40:A`), per-point badges with `title` attributes `"Break point"` and
`"Set point"`, a game-result marker (`GAME` / `BREAK` / `SET`) placed on the winner's side, and a
`LOST SERVE` badge on the server when broken. Nothing else – no speed, no shot type, no rally length,
no text.

**Sofascore** exposes an undocumented JSON API at `api.sofascore.com/api/v1/event/{id}/point-by-point`.
Shape:

```
pointByPoint[] { set, games[] { game, points[] { homePoint, awayPoint,
                 pointDescription, homePointType, awayPointType },
                 score { homeScore, awayScore, serving, scoring } } }
```

`pointDescription`, `homePointType` and `awayPointType` are small integer enums. **I could not verify
their meanings** – no documentation exists and the sample was not large enough to decode them
reliably. `homePointType` 1 and 5 appear to be won/not-won; 2 and 3 appear on break-point and
set-point situations. Do not rely on this without decoding it against a larger sample.

Sofascore statistics keys (verified): `aces`, `doubleFaults`, `firstServeAccuracy`,
`secondServeAccuracy`, `firstServePointsAccuracy`, `secondServePointsAccuracy`, `serviceGamesTotal`,
`breakPointsSaved`, `pointsTotal`, `servicePointsScored`, `receiverPointsScored`, `maxPointsInRow`,
`gamesWon`, `serviceGamesWon`, `maxGamesInRow`, `firstReturnPoints`, `secondReturnPoints`,
`breakPointsScored`, `tiebreaks`. Available per period `ALL` / `1ST` / `2ND`. No commentary endpoint
exists for tennis (`/comments` and `/incidents` return 404).

### 3.6 Who supplies which raw signal

| Layer | Wimbledon / US Open | Australian Open | Roland-Garros | ATP Tour | WTA |
|---|---|---|---|---|---|
| Digital / AI partner | IBM | Infosys | Infosys (to 2031) | Infosys (to 2028) | Stats Perform (data rights) |
| Optical tracking | Hawk-Eye (Sony) | **Bolt6 "Sentinel"** | human line judges through 2026 | Hawk-Eye | mixed |
| Official scoring | chair umpire device + courtside statisticians | chair umpire device | chair umpire device | chair umpire device | chair umpire device |
| Data company | – | – | – | **Tennis Data Innovations** (ATP + ATP Media JV) | – |
| Advanced metrics | IBM Likelihood to Win, Power Index | Infosys Win Predictor, Momentum, Excitement Rating | same | TennisViz via TDI: In Attack, Conversion Score, Steal Score, Shot Quality | Stats Perform / Opta clutch + win probability |

Wimbledon additionally employs around 48 courtside statisticians who key point-by-point data by hand,
in parallel with the optical systems. Volume figures published by the tournaments: the US Open cites
more than 150 data points per point; Wimbledon cites roughly 2.7 million data points per Championships.

Hawk-Eye's `SkeleTRACK` captures 29 skeletal points per player plus 7 on the racket. TennisViz
classifies over 60 shot types with a 0–10 shot-quality score derived from speed, spin, depth, width
and impact on the opponent, with published ATP tour averages (In Attack 23%, Conversion 69%, Steal
31%, serve shot quality 7.9). None of the skeletal or shot-quality data reaches a public per-point
feed; it is broadcast, player-facing (ATP "Tennis IQ") or betting-distributed.

**What is genuinely public per point:** score state, serve number, serve speed, coarse serve
direction and depth, coarse return depth, rally count, outcome classification, distance run,
momentum index, and a generated sentence. Everything else – bounce coordinates, spin rate, net
clearance, contact height, court position at contact – **could not be verified as public in any
product**, and appears only in academic Hawk-Eye literature and vendor marketing.

---

## 4. Programmatic availability

### 4.1 Endpoints that are open right now (verified by direct call)

These were called successfully with no key, no login and no special headers, on 10–11 August 2026.
They are **undocumented and unlicensed** – they are the sites' own front-end endpoints. Using them in
a shipped product is a terms-of-service question, not a technical one.

| What | Endpoint | Notes |
|---|---|---|
| Wimbledon per-point history incl. `Sentence` | `POST https://www.wimbledon.com/graphql` with `op=PointHistory` | Also `op=Slamtracker`, `op=LiveScores`, `op=LiveL2W` (likelihood to win), `op=CompletedMatchDays` |
| ATP match stats | `GET https://www.atptour.com/-/Hawkeye/MatchStats/{year}/{eventId}/{matchId}` | Plain JSON, full schema in 3.3 |
| ATP live matches for an event | `GET https://www.atptour.com/en/-/www/LiveMatches/{year}/{eventId}` | Plain JSON |
| ATP MatchBeats point data | `GET https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/{y}/eventId/{e}/matchId/{m}` | **Encrypted payload** |
| ATP generated insights | `.../prod/api/assisted-journalism/insights/year/{y}/eventId/{e}/matchId/{m}` | **Encrypted payload** |
| WTA tournaments and matches | `GET https://api.wtatennis.com/tennis/tournaments/{id}/{year}/matches?from=&to=` | Plain JSON, no key |
| Sofascore point-by-point | `GET https://api.sofascore.com/api/v1/event/{id}/point-by-point` | Plain JSON, no key |
| Sofascore statistics | `GET https://api.sofascore.com/api/v1/event/{id}/statistics` | Plain JSON, no key |

Two more open, unauthenticated endpoints were confirmed by a parallel investigation:

| What | Endpoint |
|---|---|
| Australian Open results / schedule | `GET https://prod-scores-api.ausopen.com/year/{y}/period/MD/day/{n}/results` (and `/schedule`) |
| Roland-Garros order of play | `GET https://www.rolandgarros.com/api/en-us/order-of-play/{date}/{year}` |
| ESPN tennis scoreboard (ATP and WTA) | `GET https://site.web.api.espn.com/apis/site/v2/sports/tennis/{atp\|wta}/scoreboard?dates=YYYYMMDD` |

Both Slam endpoints are **match/set level, not point level**. The ESPN one is the broadest free live
option and gives set-by-set `linescores` including tiebreak values; note the host must be
`site.web.api.espn.com` – `site.api.espn.com` 403s.

**Wimbledon and US Open static feed paths could not be verified**; the candidate JSON paths return
403/404. The Wimbledon GraphQL route above is the working one.

Flashscore has **no** open JSON endpoint – its point-by-point arrives inside rendered HTML.

**Terms-of-service posture, which is the real constraint here.** Flashscore's `robots.txt` issues a
blanket `Disallow: /` to a named list of data and AI crawlers (CCBot, Diffbot, Bytespider, AI2Bot,
Omgilibot, FacebookBot, Meta-ExternalAgent, DuckAssistBot, ImagesiftBot and others). Sofascore
returns a 403 on `robots.txt` **itself** and blocks non-browser clients outright. Both were read
here through a normal browser for research; **neither is usable as a data source in anything we
ship.** The community scraper libraries that exist are small, mostly football-oriented, and largely
unmaintained.

### 4.1.1 The WTA developer API – the only official live text commentary feed

`https://developers.wtatennis.com/` is a live, WTA-run developer portal. Access is by **API key in a
request header** plus an `api-version: 2.0` header. The documented endpoint catalogue includes:

| Endpoint | Returns |
|---|---|
| `/matches/{year}/{tournamentId}/{matchId}/editorial` | **live text commentary** – documented as "commentary and facts" item types |
| `/matches/{year}/{tournamentId}/{matchId}/point-by-point` | point-by-point |
| `/matches/{matchId}/events` | point events, incremental via a `since` param, filterable by set or by event type (`ace`, `doubleFault`, `winner`), **10-second cache TTL** |
| `/matches/.../advanced-stats` | winners and forced/unforced errors **by stroke**, rally-length buckets, longest rally, net play, per-set breakdowns |
| `/matches/.../win-probability-momentum` | momentum series |
| `/match-info/{eventYear}/{eventId}` | live match state, serve indicator, `pointA` / `pointB` |

Pricing is **not published** – subscription-gated. But the *shape* is the useful part: the WTA
models commentary as **editorial items attached to a match**, separate from the point stream, and
the point stream is polled incrementally with a `since` cursor and typed event filters. That is a
clean design and a good one to mirror.

There is **no** ATP or ITF public developer API. `developers.atptour.com`, `api.atptour.com`,
`api.itftennis.com` and `tennisdatainnovations.com` do not resolve. The Infosys ATP endpoints are
publicly documented in two MIT-licensed GitHub repositories
(`glad94/infotennis`, `glad94/tennis-web-scraping`), which list `match-beats/data`,
`stats-plus/v1/keystats`, `rally-analysis`, `stroke-analysis`, `court-vision` (per point ID, and
**encrypted**), `head-to-head` and `assisted-journalism/insights`, with client polling intervals of
10 s for match status and 20 s for court vision. Those repos also 403 against CloudFront when
called directly with the wrong IDs, so **whether they are now WAF-locked could not be verified.**

### 4.1.2 Who actually owns the rights

| Property | Official data partner |
|---|---|
| ATP Tour + Challenger | **Sportradar**, six-year deal 2024–2029, awarded via TDI; displaced IMG Arena |
| WTA | **Stats Perform / Opta**, official data and streaming partner since November 2020 |
| ITF | **Sportradar** (since 2012) and **LSports** (official distributor from 2025). Note the ITF World Tennis Tour was **removed from Sportradar's Tennis API from 2025** |
| Wimbledon, US Open, Roland-Garros | **Sportradar**, acquired with the **IMG Arena acquisition closed 3 November 2025** |

Net: there is no route to official live tennis data that does not pass through Sportradar or Stats
Perform.

### 4.2 Licensed commercial providers, with prices where they are published

| Provider | Point-by-point | Text commentary | Price published? |
|---|---|---|---|
| **API-Tennis.com** | **Yes**, a `pointbypoint` array inline in `get_fixtures` and `get_livescore` | No | **Yes – $40/month** |
| **Goalserve** | **Yes**, 5-second refresh | No | **Yes – $150/month** |
| **Entity Sport** | **Yes**, event-by-event, WebSockets | No | **Yes – $150/month** |
| **Sportradar** | **Yes**, seven documented coverage tiers | No | No – quote |
| **Stats Perform / Opta** | Yes | Not stated | No – quote |
| **Enetpulse** | Yes, ATP/WTA tour level | **Yes, automated commentary** | No – quote |
| **SportsDataIO** | Could not verify | Could not verify | No – their pricing page 404s |
| **LSports**, **Broadage**, **BetConstruct** | Could not verify / likely not real tennis | No | Partial or none |
| **Sportmonks** | **No tennis at all** | – | – |

**Verified published prices.** API-Tennis.com: Starter $40/month for 8,000 requests/day, Premium $60
for 80,000, Business $80 for 200,000 plus in-play odds and WebSockets, Ultra $120 for 2,000,000;
14-day trial, term discounts 5/10/15%. Goalserve tennis package: $150 for one month, $900 for six,
$1,500 for twelve, bundling live scores, point-by-point, live game stats, ATP/WTA/Challenger/ITF,
odds and profiles, with a 30-day full trial. Entity Sport: ATP or WTA Silver $150/month, Gold
$500/month, Diamond $900/month for both tours.

**Sportradar's tier structure is worth knowing even if we never buy it**, because it is the industry
reference for what "point-by-point coverage" means: Tier 1 (Grand Slams) gives 100% point-by-point
from round one plus extended stats and post-match corrections; Tier 6 (WTA 250/125k) gives
point-by-point **only from the semifinals**; Tier 7 (Davis/BJK Cup outside World Group) gives none.
Each match carries a `coverage` object with booleans `play_by_play`, `detailed_serve_outcomes`,
`extended_stats`, `scores`. Its timeline events carry `type` (`match_started`, `first_serve`,
`point`, `period_score`), `competitor`, `home_score`, `away_score`, `server`, `first_serve_fault`,
and a `result` enum of `ace` / `double_fault` / `server_won` / `receiver_won` / `unknown`.

That `result` enum is instructive: **the commercial standard is coarser than what we would want.** It
has no wing, no shot type and no forced/unforced distinction. Serve speed and rally length are not
documented as available fields by any commercial provider surveyed. The rich stuff exists only in
the Slam feeds and the free archives.

RapidAPI tier prices for the tennis endpoints (Tennis Live Data, Tennis API ATP/WTA/ITF, SofaScore
listings) are **JS-gated and could not be verified**. Do not trust a quoted RapidAPI price without
opening the page.

### 4.3 Free and open data – the situation has changed

**Checked directly against the GitHub API on 11 August 2026.** The standard recommendation in every
older write-up – "use Jeff Sackmann's repos" – **no longer works**:

| Repository | Status |
|---|---|
| `JeffSackmann/tennis_MatchChartingProject` | **Live.** 401 stars, last updated 25 May 2026. |
| `JeffSackmann/tennis_atp` | **404.** |
| `JeffSackmann/tennis_wta` | **404.** |
| `JeffSackmann/tennis_slam_pointbypoint` | **404.** |

The GitHub API returns exactly **one** public repository for that user. Wayback CDX pins the window:
`tennis_atp` last returned 200 on **14 March 2026** and first 404'd on **24 June 2026**; `tennis_wta`
last returned 200 on **16 November 2025** and first 404'd on **22 June 2026**. The surviving repo's
README states the author is serious about the licence, is disappointed by violations, and may stop
updating if they continue – which reads as the motive, though that is inference, not a stated reason.

**The data survives as a third-party archive** at
`https://huggingface.co/datasets/Aneeshers/tennis-sackmann-archive` – 473 files, last modified 25
June 2026, i.e. captured at the takedown, with the `cc-by-nc-sa-4.0` licence correctly preserved on
the dataset card. It contains `atp/` and `wta/` match CSVs through 2026 plus `slam_pointbypoint/`
(168 files) and the upstream READMEs. Search engines still index the dead GitHub URLs and will
confidently tell you they exist. They do not.

**Every write-up recommending those URLs is now wrong.** If any ties-break document or code points
at them, it needs fixing.

**Match Charting Project** – the one that survives – contains `charting-{m,w}-matches.csv` plus
point files split by decade (`-points-to-2009`, `-points-2010s`, `-points-2020s`) and a family of
aggregate `-stats-` files covering serve, return, net points, rally, shot type, shot direction and
break points. Its shot notation is the most complete public per-shot vocabulary in existence: serve
direction `4`/`5`/`6` for wide/body/T; `f` `b` `s` `r` `v` `l` `o` `m` for forehand, backhand, slice,
forehand slice, volley, lob, overhead and down-the-middle; `7`/`8`/`9` for return depth; `n` `w` `d`
`x` for net, wide, deep and wide-and-deep errors; `@` `#` `*` for unforced error, forced error and
winner; `+` `-` `=` for approach, net and baseline court position.

**Its licence is a blocker.** Verified from the README: it is released under **Creative Commons
Attribution-NonCommercial-ShareAlike 4.0 International**, the README states non-commercial use only
and that attribution is required, and it says the licence is enforced seriously. ShareAlike also
means derived data must carry the same licence. **If ties-break ever takes donations or ships to a
portal, this dataset cannot be used in it.** It is fine as background reading to design a generator;
it is not fine as shipped content or as training data for shipped content.

**The Grand Slam point-by-point archive** (now only via the HuggingFace mirror, same licence) covers
2011–2024, with Wimbledon and the US Open through 2024 and the Australian Open and Roland-Garros
dropped after 2022. Its schema is **the same one this document captured live from Wimbledon in
section 3.1** – strong mutual confirmation. The modern 65-column header:

```
match_id, ElapsedTime, SetNo, P1GamesWon, P2GamesWon, SetWinner, GameNo, GameWinner,
PointNumber, PointWinner, PointServer, Speed_KMH, Rally, P1Score, P2Score,
P1Momentum, P2Momentum, P1PointsWon, P2PointsWon, P1Ace, P2Ace, P1Winner, P2Winner,
P1DoubleFault, P2DoubleFault, P1UnfErr, P2UnfErr, P1NetPoint, P2NetPoint,
P1NetPointWon, P2NetPointWon, P1BreakPoint, P2BreakPoint, P1BreakPointWon,
P2BreakPointWon, P1FirstSrvIn, P2FirstSrvIn, P1FirstSrvWon, P2FirstSrvWon,
P1SecondSrvIn, P2SecondSrvIn, P1SecondSrvWon, P2SecondSrvWon, P1ForcedError,
P2ForcedError, History, Speed_MPH, P1BreakPointMissed, P2BreakPointMissed,
ServeIndicator, Serve_Direction, Winner_FH, Winner_BH, ServingTo, P1TurningPoint,
P2TurningPoint, ServeNumber, WinnerType, WinnerShotType,
P1DistanceRun, P2DistanceRun, RallyCount, ServeWidth, ServeDepth, ReturnDepth
```

Value distributions profiled from the 2024 US Open file (45,289 points) – **these are directly
usable as the target distributions for our engine**:

| Field | Distribution |
|---|---|
| `ServeWidth` | `C` 10,755 · `BW` 8,838 · `W` 8,832 · `BC` 8,136 · `B` 5,366 |
| `ServeDepth` | `NCTL` 28,805 · `CTL` 13,122 |
| `ReturnDepth` | `ND` 22,048 · `D` 15,236 |
| `ServeNumber` | `1` 25,909 · `2` 16,365 · `0` 3,015 |
| `WinnerShotType` | `0` 35,458 · `F` 6,788 · `B` 3,043 |
| `Speed_KMH` | n=41,602, mean **159.2**, max **230.0** |
| `RallyCount` | mean **3.71**, max **39** |

Note `ServeWidth` is a five-value enum (`W` wide, `BW` body-wide, `B` body, `BC` body-centre, `C`
centre), not the three-value one commonly assumed. Coverage is uneven: serve speed, first/second
serve indicator and rally length are missing for many events, present mainly on Hawk-Eye-equipped
courts, and 2018–19 AO/RG records often carry speed `0` and rally length `3` or `0`.

An older, thinner mirror covering only 2011–2015 exists at `halepmania/tennis_slam_pointbypoint`
with **no licence statement and no attribution to the origin** – legally worse, not better.

**Other free sources, briefly:** `tennis-data.co.uk` gives free per-season ATP and WTA CSVs with
results plus bookmaker odds (match level only, no points, no explicit licence); `Tennismylife/TML-Database`
preserves the Sackmann ATP schema plus an `indoor` column but is ATP-only, has no licence file, and
its README says it is kept for historical reference only; Ultimate Tennis Statistics is Apache 2.0
code with CC BY-NC-SA algorithms and is **built on the now-deleted repos**, so its refresh path is
broken; OnCourt is a paid Windows app with a Microsoft Access database that advertises post-match
point-by-point replay but publishes no price (**could not verify**); Wikidata has player and
tournament identifiers but effectively **no match-level or point-level data**.

**Practical conclusion for us:** there is no clean, free, commercially usable per-point tennis
dataset. That is fine, because we do not need one. Everything in section 2 – the sentence grammar,
the slot vocabulary, the score conventions – is *structure*, and structure is not the licensed
asset. Use the free archives **offline, to fit distributions**, then ship the fitted parameters
rather than the data.

---

## 5. What this means for the ties-break match viewer

Concrete, in priority order.

1. **Emit a structured point event, then render text from it.** Copy the WTA's architecture: the
   engine produces `{templateId, args}` and the view owns the wording. Do not have the Markov engine
   produce strings.

2. **The minimum viable point event**, sufficient to drive every real-world sentence shape in this
   document:

   ```
   { setNo, gameNo, pointNo, serveNumber, server,
     pointWinner, endingPlayer, endingWing, endingShotType, outcome,
     rallyCount, serveSpeed, serveDirection,
     isBreakPoint, isSetPoint, isMatchPoint,
     gameWinner, setWinner, matchWinner,
     scoreAfter: { p1, p2, games, sets } }
   ```

   `outcome` ∈ `{ace, serviceWinner, doubleFault, winner, unforcedError, forcedError}`;
   `endingWing` ∈ `{forehand, backhand, none}`; `endingShotType` ∈ `{groundstroke, volley, smash,
   dropShot, lob, none}`; `serveDirection` ∈ `{wide, bodyWide, body, bodyCentre, centre}` – the real
   feeds use **five** buckets (`W`, `BW`, `B`, `BC`, `C`), not three.

   Calibration targets from a real Grand Slam event (2024 US Open, 45k points): serve speed mean
   159 km/h with a 230 km/h ceiling; rally count mean 3.71 with a 39 ceiling; roughly 61% first
   serves; roughly 70% of serves landing not-close-to-line; roughly 59% of returns not deep; and
   about 78% of points ending without a named winner shot type (i.e. on an error or a serve).

3. **Ship two registers, not one.** A terse always-on line per point using the 2.1 grammar, and a
   richer paragraph at game and set boundaries and on converted break points. That is what every
   official product does, and it is what makes a feed feel like coverage.

4. **The terse line writes itself from one rule:** subject = the player who hit the last ball; verb =
   `wins` if that ball was a winner/ace, `loses` if it was an error; object = `a {wing} {shotType}
   {outcome}`. Then override the verb phrase at boundaries (`wins the game/set/match`) and on break
   points (`saves` / `fails to convert`).

5. **Keep the score out of the terse sentence.** Render it as a separate element, server-first,
   `40 - 30` with `AD`, and switch to plain integers in a tiebreak. Replace the score slot with a
   boundary word on the game-deciding point.

6. **Escalate by frequency and length, never by adjective.** Suppress entries in a one-sided game;
   add them in a tiebreak. This is the single behaviour that separates a live blog from a ticker.

7. **Round every number at the template boundary, and never surface an engine coordinate.** Both are
   shipped bugs in the Australian Open's AI commentary.

8. **Rotate phrasing with recent-use suppression.** The observable weakness of real generated
   commentary is one construction dominating an entire match.

9. **Skip the challenge system** unless the game is period-set before 2021, or the match is on clay
   at Roland-Garros. Electronic line calling has removed challenges from the modern adult tour. Use
   Video Review instead if a review mechanic is wanted.

10. **Do not model medical timeouts or suspensions as commentary lines.** In every real feed they are
    a *match state change*, with the scoreboard changing label. Copy that.

11. **If we ever pull real data, pull it offline and ship fitted parameters, not the data.** Every
    free tennis dataset worth having is CC BY-NC-SA 4.0 – non-commercial and share-alike. Fitted
    distributions are not the dataset. Also: do not use aggregator sites as a source; Flashscore and
    Sofascore both explicitly refuse automated clients.

---

## Sources

Directly inspected in a browser, 10–11 August 2026:

- https://www.wimbledon.com/en_GB/scores/slamtracker/1701 – IBM SlamTracker, 2026 Gentlemen's Singles final, point-by-point view
- https://www.wimbledon.com/graphql (ops `PointHistory`, `Slamtracker`, `LiveScores`, `LiveL2W`)
- https://www.wimbledon.com/en_GB/scores/results
- https://ausopen.com/match/2026-carlos-alcaraz-vs-novak-djokovic-ms701 – Infosys Match Centre, Commentary and AI Commentary tabs
- https://ausopen.com/scores
- https://www.atptour.com/en/scores/current
- https://www.atptour.com/en/scores/stats-centre/live/2026/421/MD006 – Stats Centre, Stats and MatchBeats tabs
- https://www.atptour.com/-/Hawkeye/MatchStats/2026/421/MD006
- https://www.atptour.com/en/-/www/LiveMatches/2026/421
- https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/2026/eventId/421/matchId/MD006
- https://itp-atp-sls.infosys-platforms.com/prod/api/assisted-journalism/insights/year/2026/eventId/421/matchId/MD006
- https://www.wtatennis.com/scores
- https://www.wtatennis.com/tournaments/canadian-open/scores/LS005
- https://api.wtatennis.com/tennis/tournaments/806/2026/matches
- https://translations.platform.pulselive.com/wta/en.js – WTA match-state and match-centre label dictionary
- https://www.flashscore.com/tennis/
- https://www.flashscore.com/match/tennis/shnaider-diana-028BdVOj/swiatek-iga-jNyZsXZe/?mid=KfRN8eoe – point-by-point tab
- https://api.sofascore.com/api/v1/event/16662004/point-by-point
- https://api.sofascore.com/api/v1/event/16662004/statistics
- https://www.sofascore.com/tennis
- https://www.aljazeera.com/sports/liveblog/2025/7/13/live-carlos-alcaraz-vs-jannik-sinner-wimbledon-final-2025 – human live blog structure
- https://www.usopen.org/en_US/scores/index.html
- https://www.livescore.com/en/tennis/

Vendor and governing-body material:

- https://newsroom.ibm.com/2026-06-22-wimbledon-and-ibm-introduce-new-ai-powered-fan-experiences-and-modernized-digital-platforms-for-the-championships-2026
- https://newsroom.ibm.com/2025-06-17-the-all-england-lawn-tennis-club-and-ibm-launch-new-ai-features-for-real-time-wimbledon-fan-engagement
- https://newsroom.ibm.com/2025-08-18-ibm-and-the-usta-roll-out-ai-powered-fan-experiences-for-2025-us-open
- https://newsroom.ibm.com/2023-06-21-IBM-Brings-Generative-AI-Commentary-and-AI-Draw-Analysis-to-the-Wimbledon-Digital-Experience
- https://www.consultancy.uk/news/37705/wimbledon-ai-app-mocked-for-unforced-errors – documented factual errors in IBM generated text
- https://www.prnewswire.com/news-releases/infosys-and-tennis-australia-bring-ai-first-experiences-and-accessibility-to-australian-open-2026-302673469.html
- http://www.prnewswire.com/news-releases/infosys-and-roland-garros-serve-up-ai-powered-digital-fan-experiences-extend-partnership-through-2031-302784323.html
- https://www.itftennis.com/en/about-us/tennis-tech/classified-elc-systems/ – ITF classified electronic line calling systems
- https://www.bolt6.ai/ – Australian Open tracking vendor
- https://www.hawkeyeinnovations.com/news/4243365/skeletrack-a-new-era-of-data-in-tennis
- https://www.atptour.com/en/news/video-review-atp-masters-1000-2025 – what replaced challenges
- https://www.atptour.com/en/news/insights-conversion-steal-score-explained
- https://www.atptour.com/en/news/insights-shot-quality
- https://www.atptour.com/en/news/atp-tdi-unveil-tennis-iq-analytics-platform
- https://sportradar.com/content-hub/news/tennis-data-innovations-and-sportradar-team-up-to-expand-official-tennis-data-distribution/
- https://www.wtatennis.com/news/3812740/stats-perform-extends-exclusive-official-rights-partnership-with-the-wta
- https://www.statsperform.com/wta/
- https://tennisviz.com/
- https://defector.com/tennis-deserves-better-than-these-worthless-metrics – critique of the ATP/TennisViz metric layer
- https://data.scorenetwork.org/tennis/tennis-shot-level-data.html – 17-field public per-shot schema
- https://phys.org/news/2018-07-wimbledon-stat.html – Wimbledon courtside statisticians
- https://jobs.wimbledon.com/job/data-entry-statisticians-wimbledon-2026

Programmatic access, checked 11 August 2026:

- https://developers.wtatennis.com/ – WTA developer portal, including the `/editorial` live commentary endpoint
- https://api.wtatennis.com/tennis/tournaments/ and `/tennis/players` – open, unauthenticated
- https://prod-scores-api.ausopen.com/year/2026/period/MD/day/1/results – Australian Open, open
- https://www.rolandgarros.com/api/en-us/order-of-play/2026-05-26/2026 – Roland-Garros, open
- https://site.web.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard – ESPN undocumented API
- https://github.com/glad94/infotennis – MIT, documents the Infosys ATP endpoint surface
- https://github.com/glad94/tennis-web-scraping – MIT, full Infosys REST catalogue and polling intervals
- https://developer.sportradar.com/tennis/docs/ig-data-coverage-tiers – seven coverage tiers, event and result enums
- https://api-tennis.com/ and https://api-tennis.com/documentation – $40/month, inline `pointbypoint`
- https://www.goalserve.com/en/sport-data-feeds/tennis-api/prices – $150/month tennis package
- https://www.entitysport.com/pricing/ – $150/month per tour
- https://enetpulse.com/tennis-data/ – automated text commentary, price on request
- https://investors.sportradar.com/news-releases/news-release-details/sportradar-wins-major-bid-atp-rights
- https://investors.sportradar.com/news-releases/news-release-details/sportradar-announces-close-acquisition-img-arena-and-its
- https://www.statsperform.com/products/official-wta-data-streaming/
- https://www.lsports.eu/lsports-to-become-itfs-official-data-distributor/
- https://www.flashscore.com/robots.txt – explicit AI/data crawler refusal

Open data, checked 11 August 2026:

- https://github.com/JeffSackmann/tennis_MatchChartingProject – live, CC BY-NC-SA 4.0, shot-level notation
- https://www.tennisabstract.com/blog/2015/09/23/the-match-charting-project-quick-start-guide/ – notation reference
- https://huggingface.co/datasets/Aneeshers/tennis-sackmann-archive – the surviving archive of the deleted repos
- https://github.com/halepmania/tennis_slam_pointbypoint – 2011–2015 mirror, unlicensed
- https://github.com/Tennismylife/TML-Database – ATP only, no licence file, historical reference
- http://www.tennis-data.co.uk/notes.txt – field dictionary for the odds-bearing CSVs
- https://www.ultimatetennisstatistics.com/about
- https://www.oncourt.info/
- Dead as of 2026: `github.com/JeffSackmann/tennis_atp`, `/tennis_wta`, `/tennis_slam_pointbypoint`

Unreachable to the fetch agent, described but not verified: theguardian.com, bbc.co.uk/sport.
