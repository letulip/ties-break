---
type: research
status: reference
area: content/commentary
canonical: false
last-reviewed: 2026-08-10
---

# Commentary lexicon: the words themselves

A working inventory of the **generic** tennis vocabulary a commentary generator can draw on, with
notes on when each term is correct. Scope is the raw words and formulae. It is not about what
coverage products exist, how junior differs from adult, how a generator is engineered, or where to
find transcripts – four sibling documents cover those.

## How to use this file

Every list below is meant to be lifted into a phrase bank, but **not wholesale**. Three filters
apply on the way in:

1. **Situational fit.** A term marked *only when …* is wrong outside that situation, and using it
   loose is the fastest way to sound like a machine. `SLICE` on a serve and `SLICE` on a backhand
   are different balls; `heavy` describes topspin and never a flat drive.
2. **Register tier.** Terms are tagged `[BrE]`, `[AmE]`, `[official]`, `[written]`, `[slang]`,
   `[dated]`. Mixing tiers in one sentence is what reads as caricature. See §5.
3. **The two hard constraints below.**

### ⚠ Trademark and fiction constraint

Tournaments and organisations in this game are fictional. **No vocabulary list in this file contains
a real tournament, tour-body, or player name, and none should be extended to.** Real bodies, events
and researchers are named only in the source citations and in the descriptions of published
research, which is evidence about the real world and never game content.

Three specific traps, because they are tennis vocabulary that looks generic and is not:

- **`SABR`** – a real shot-strategy acronym whose expansion is a real player's first name. Do not
  use. The generic description is *chip-and-charge off the return* or *taking the return on the
  rise from inside the baseline*.
- **`Gran Willy` / `Great Willy`** – a listed synonym for the tweener, derived from a real player's
  forename. Use `tweener` or `between-the-legs shot`.
- Any *"the [Surname]"* shot name, any *"[Surname] slide"*, any tour-body-branded scoring name.
  Generic equivalents exist for all of them.

Also: **"ladies' singles" is a real-organisation formula and a gender-marked one** (§6). Use
`singles`.

### ⚠ Copyright discipline

Everything below is either a term of art, a dictionary word, or a short official formula. No blocks
of commentary prose have been copied. Keep it that way when extending this file: collect **words and
slots**, not sentences someone wrote.

---

## 1. Shots and strokes

### 1.1 Serve – spin types

| Term | What it does | When correct |
| --- | --- | --- |
| `flat serve` | little or no spin, maximum pace | first serves mostly; a flat second serve is a story in itself |
| `slice serve` | sidespin, curves and stays low, pulls the receiver wide or jams her | any serve; the standard wide serve from the deuce court for a right-hander |
| `kick serve` | heavy topspin, high net clearance, bounces high and away | the canonical second serve; never describe a kick serve as *skidding* |
| `topspin serve` | neutral synonym for kick | interchangeable with `kick serve`; slightly more technical register |
| `twist serve` | topspin **plus** sidespin, curving trajectory and a bounce that jumps sideways | a narrower claim than `kick`; only use when you mean the sideways kick |
| `second serve` | the safety serve | as a noun; also `a second serve` after a fault |

`American twist` is the older name for the twist serve. Treated here as `[dated]`; I did not find
it in current governing-body coaching copy.

Governing-body framing worth copying: the LTA reduces the whole family to three – flat, slice,
kick – and describes a flat serve as having a *true bounce*, a slice serve as taking longer in the
air and bouncing out to the side, and a kick serve as clearing the net higher and bouncing higher.

### 1.2 Serve – placement

`down the T` · `out wide` · `into the body` · `at the hip` · `jammed her` · `body serve`
· `wide serve` · `T serve` · `spot serving` (deliberately hitting a precise target)

Notes:
- **`down the T`** – the T is the intersection of the centre service line and the service line.
  Correct for a serve into the middle of the box, never for a groundstroke.
- **`into the body` / `body serve` / `jam`** – aimed at the receiver's torso or hitting hip so she
  cannot extend her arms. `jammed` is the verb: *jammed her for room*. The receiver's counter is
  described as *clearing space* or *blocking it back*.
- **Side matters.** From the deuce court a right-hander's slice goes wide; from the ad court her
  slice goes down the T. If the generator knows handedness and court side, this is free realism.
  If it does not, keep placement and spin in separate sentences.

### 1.3 Serve – quality and outcome

`ace` · `service winner` (unreturned but touched, or returned to nothing) · `unreturnable` ·
`fault` · `double fault` · `let` (see §4) · `foot fault` · `first-serve percentage` ·
`held to love` · `free points on serve` · `big first serve` · `landed the first serve`

Speed vocabulary: `[kph]/[mph]`, `heat on it`, `pace`, `took pace off it`, `a soft second`.
Avoid inventing precise speeds unless the engine actually models them.

### 1.4 Return

`block return` (short backswing, absorbs pace – correct against a big serve, wrong against a soft
second) · `chip return` (underspin, low) · `chip-and-charge` (chip and follow it in) ·
`return of serve` · `stepped in on the second` · `took it early` · `on the rise` ·
`return winner` · `return ace` (returner's shot untouched by the server) · `deep return` ·
`neutral return` · `floated the return`

`Return +1` is the returner's counterpart to serve +1 (§2.2).

### 1.5 Groundstrokes

`forehand` · `backhand` · `two-handed backhand` · `one-hander` · `drive` (flat, hard) ·
`topspin forehand` · `slice backhand` · `chop` (extreme underspin – rare, `[dated]` in broadcast) ·
`buggy whip` (forehand finishing over the same shoulder – `[slang]`, technical audiences) ·
`approach shot` · `passing shot` · `pass` · `lob` · `rally ball` · `neutral ball` ·
`inside-out forehand` · `inside-in forehand` · `running forehand` · `on the stretch`

Verbs for hitting: `drilled` · `laced` · `carved` · `flicked` · `punched` · `nudged` · `steered` ·
`floated` · `dumped it in the net` · `sent it long` · `sprayed it wide` · `missed by inches` ·
`clipped the tape` · `caught the line` · `found the corner`

### 1.6 Directions – the four-way grid

| Term | Meaning | Trap |
| --- | --- | --- |
| `cross-court` | diagonally | the higher-percentage direction: the net is lower in the middle and the court longer diagonally |
| `down the line` | parallel to the sideline | the riskier direction; commentary usually frames it as *going for it* |
| `inside-out` | run round the backhand, hit the forehand **cross-court** | only from the backhand corner; nonsense from the forehand corner |
| `inside-in` | run round the backhand, hit the forehand **down the line** | same restriction |

`down the middle` is a real fifth option and under-used in generated commentary; it is the correct
description of a deep neutralising ball that gives the opponent no angle.

### 1.7 Net play and touch shots

`volley` · `forehand volley` · `backhand volley` · `low volley` · `half-volley` (struck
immediately off the bounce – correct only at the moment of the bounce, not for any low ball) ·
`stop volley` / `drop volley` (absorbs pace, dies over the net) · `stick volley` (crisp, downward) ·
`drive volley` / `swinging volley` (full swing at a floating ball, usually shoulder height) ·
`smash` / `overhead` · `backhand smash` · `swinging overhead` · `put it away` · `putaway` ·
`drop shot` · `disguised the drop shot` · `touch` · `feel` · `soft hands` ·
`tweener` / `between-the-legs` / `hot dog` (`[slang]`, use sparingly – see §7) ·
`lob volley` · `skyhook` (overhead struck behind the body – rare)

Doubles-only: `poach` · `poaching` · `crossed` · `held her position` · `I-formation`.
Do not emit these in a singles match.

### 1.8 Defensive shots

`slice` (as defence: low, keeps the ball out of the strike zone, buys time) ·
`block` · `moonball` (very high, heavy topspin, lands deep – a real tactical shot, especially on
clay and in junior tennis; not automatically a pejorative) · `lob` · `scrambled it back` ·
`got a racket on it` · `dug it out` · `stayed in the point` · `reset the point` ·
`bought herself time` · `hung in`

### 1.9 How the ball behaves

These are the highest-value adjectives in the whole file because they are the ones that let the same
event be described five ways.

| Word | Means | Only correct when |
| --- | --- | --- |
| `heavy` | so much topspin the ball feels heavy on the strings | topspin only. A flat ball is never *heavy* |
| `flat` | little spin, travelling fast and low | never combined with *kicking* or *looping* |
| `loopy` | high arc, slow, lands deep | typically topspin defence and moonballs |
| `skidding` | staying low and shooting through | grass, slice, low-bouncing hard courts. **Never a kick serve** |
| `biting` | spin gripping the surface, ball checking or jumping | clay above all |
| `kicking` | jumping up off the bounce | topspin/kick serves; clay |
| `sitting up` | a slow, high ball begging to be hit | describing a mistake by the previous hitter |
| `dipping` | topspin dropping the ball at the volleyer's feet | passing shots and returns against a net rusher |
| `floating` | slow and rising, no spin holding it down | usually a defensive slice that failed |
| `deep` / `short` | landing near the baseline / near the service line | *short* is not automatically bad – a drop shot is short by design |
| `angled` / `sharp angle` | pulling the opponent off the court sideways | ties to §2.2 opening the court |
| `penetrating` | going through the court, not sitting up | pace + depth |
| `clipped the line` / `caught the tape` | landed on the line / hit the net cord | one-off events only |

Deliberate ambiguity to avoid: `hard`. It reads as *hard court* half the time. Prefer `flat`,
`fast`, `struck cleanly`.

### 1.10 Outcomes

`winner` · `clean winner` · `error` · `forced error` · `unforced error` · `net cord` ·
`framed it` / `frame shot` (mis-hit off the frame) · `shanked it` · `mis-hit` · `let cord winner`

See §7 for the caution about narrating `unforced error` as an explanation rather than a statistic.

---

## 2. Court geography and tactics

### 2.1 Named areas

| Term | Definition | Register |
| --- | --- | --- |
| `deuce court` | the right-hand half as the player faces the net – the side served to at deuce | universal |
| `ad court` | the left-hand half – the side served to at advantage | universal |
| `the T` | intersection of the centre service line and the service line | universal |
| `service box` | the target rectangle for the serve | universal |
| `service line` | line parallel to the net, 21 ft / 6.4 m from it | universal |
| `baseline` | back boundary | universal |
| `no-man's land` | the strip between service line and baseline, the worst place to stand | universal, mildly informal |
| `tramlines` | the doubles corridors | `[BrE]` |
| `alley` / `doubles alley` | same thing | `[AmE]` |
| `backcourt` | between baseline and service line | universal, more technical |
| `half court` | around the service line | coaching register |
| `the net` / `at net` / `net position` | – | universal |
| `the corner` / `the deuce corner` / `the ad corner` | – | universal |
| `the elbow` | where the baseline meets the doubles sideline | rare; safe to skip |
| `behind the baseline` / `well behind the baseline` | court position, not a shot | universal |
| `inside the baseline` | the aggressive court position | universal |

### 2.2 Named patterns

| Pattern | What it is | Note |
| --- | --- | --- |
| `serve +1` | the serve and the **first shot after it** treated as one unit | strategy-coaching vocabulary from Craig O'Shannessy's Brain Game work; the usual instance is *serve wide, forehand into the open court* |
| `return +1` | the mirror on the returner's side | same source |
| `first-strike tennis` | winning the point within the first four shots | the underlying claim is that most points end in 0–4 shots |
| `serve-and-volley` | serve and move straight in | on grass and indoors most plausible; a full-time serve-and-volleyer is now rare enough to be a character trait, not a default |
| `chip-and-charge` | slice the return and follow it in | returner's version of the above |
| `going behind her` / `hitting behind her` | hitting back to the side she has just left | requires the opponent to be moving; nonsense from a neutral position |
| `wrong-footing` | any shot that catches the opponent moving the other way | broader than *going behind*; `wrong-footed her` is the verb |
| `opening up the court` | using angle to drag the opponent off court and expose space | the setup half of a two-shot pattern |
| `into the open court` | the payoff half | pair them; using the payoff alone reads thin |
| `body jam` / `jamming` | serving or hitting at the body to deny extension | §1.2 |
| `the one-two punch` | serve then forehand | plain-English synonym for serve +1 |
| `working the backhand` | repeated targeting of the weaker wing | needs a modelled weakness or it is a lie |
| `changing direction` | taking a cross-court ball down the line | technically the hardest thing in a rally; good for describing risk |
| `taking time away` | standing closer, hitting earlier | position + timing, not power |
| `pushing her back` | depth forcing the opponent behind the baseline | – |
| `drawing her in` | short ball to bring a poor volleyer forward | – |
| `the drop-shot-and-lob` | drop shot, then lob over the player who chases it | classic clay pattern |
| `constructing the point` | building rather than swinging | slower register, good for clay |
| `going for the lines` | high-risk targeting | usually paired with a momentum claim |
| `playing the percentages` | the opposite | – |

### 2.3 Movement and positioning verbs

`slid into it` (clay only) · `changed direction` · `recovered` · `covered the line` ·
`left the cross-court open` · `camped on the backhand` · `stepped in` · `backed up` ·
`closed the net` · `hung back` · `split step` · `on the stretch` · `wrong side` · `caught flat` ·
`stranded` · `left flat-footed`

---

## 3. Pressure and momentum

The most valuable section for variety, because these are the words that turn identical scorelines
into different sentences.

### 3.1 Score-situation nouns – the ladder of stakes

`game point` → `break point` → `set point` → `match point` → `championship point`

Precision rules the generator must respect, because these are widely misused:
- **`break point`** exists only when the **receiver** is a point from the game.
- A single point can be several things at once: on a returner's match point, it is a break point
  **and** a match point.
- **`championship point`** is only correct in a **final**. In any earlier round it is `match point`.
  This is a free escalation lever (§5.3).
- `set point down` / `facing set point` / `saved set point` – the defending framing.
- `break back point` is not standard. Say `break point` and let the context carry the *back*.

Related: `on serve` (nobody up a break) · `a break up` / `a double break` · `serving for the set` ·
`serving to stay in the set` · `serving to stay in the match` · `consolidate the break` ·
`break back` · `holds` · `hold to love` · `love hold` · `love game` · `bagel` (6-0) ·
`breadstick` (6-1) · `golden set` (a set won without losing a point) ·
`the deciding point` (no-ad) · `deciding set` / `final set`.

`bagel` and `breadstick` are `[slang]` and read as fan/written register more than broadcast.

### 3.2 Tightening up, nerves, and the choke problem

**The word `choke` is largely avoided on air.** It is documented as the word players and coaches
historically would not say, and at least one broadcaster has publicly pledged not to use it on the
grounds that labelling a player that way is unfair. A current player has argued the phenomenon is
better described as a momentum shift and the handling of nerves. Practical upshot for the
generator: **do not emit `choke` or `choked`.** Emit the euphemism ladder instead.

The euphemism ladder, roughly weakest to strongest:

`a nervy game` · `the arm got a bit tight` · `tightened up` · `tight` · `stiff` ·
`the ball-toss dropped` · `shortened the swing` · `stopped swinging through it` ·
`played it safe at the wrong moment` · `pushed it` · `the double fault at the worst time` ·
`the legs went` · `couldn't find the first serve` · `didn't want to lose it, and that is different
from wanting to win it` · `froze` · `the moment got her`

Adjacent, weaker, and safe: `edgy` · `jumpy` · `rushed` · `hurried` · `snatched at it` ·
`overhit` · `went for too much` · `played the occasion` · `over-thinking it`.

`the yips` is golf/darts vocabulary. It appears in tennis discussion but is not native tennis
register; use it rarely if at all.

### 3.3 Momentum

`momentum` · `momentum shift` · `the swing` · `turned it round` · `the tide turned` ·
`took control` · `wrestled it back` · `seized it` · `let it slip` · `gave it back` ·
`immediate break back` · `the momentum did not last a game` ·
`purple patch` (`[BrE]`, a run of success – Collins marks it as sport-idiomatic) ·
`a hot streak` (`[AmE]` equivalent) · `on a roll` · `rolling` · `running away with it` ·
`the wheels came off` · `the set got away from her` · `pegged her back` · `clawed it back` ·
`hung around` · `stayed in touch` · `kept it on serve`

Structural note: momentum language is only earned by an actual pattern in the point stream –
consecutive points, consecutive games, break-and-consolidate. Emitting momentum words at random is
the single most detectable generator tell.

### 3.4 Holding up under pressure

`held under pressure` · `saved two break points` · `came up with a first serve when she needed one` ·
`served her way out of trouble` · `big serve at 30-40` · `clutch` (`[AmE]`) · `ice in the veins`
(cliché, use once a season if at all) · `composed` · `unflustered` · `steady` · `solid` ·
`took her chances` · `converted` · `made no mistake` · `closed it out` · `served it out` ·
`saw it out` (`[BrE]`) · `rode it out` · `weathered it` · `absorbed the pressure`

### 3.5 Reading the game

`read it` · `read the serve` · `picked the direction` · `anticipated` · `saw it early` ·
`covered the obvious ball` · `guessed and guessed right` (honest and good – it admits uncertainty) ·
`sniffed it out` · `she knew what was coming` · `she was there before the ball was`

### 3.6 Physical state

`legs` · `heavy legs` · `laboured` · `blowing` · `hands on knees` · `stretched her back` ·
`called the trainer` · `strapping` · `taped` · `moving freely` · `sharp` · `flat` (as energy,
distinct from the shot sense – avoid using both senses in one paragraph) · `running on empty` ·
`found a second wind`

---

## 4. Score and official language

The umpire's register is the most formulaic language in tennis and therefore the easiest to
generate correctly and the most valuable for contrast against a commentator's voice.

### 4.1 Score calls – the exact formulae

From the ITF's published *Duties and Procedures for Officials*, which sets these out as scripts:

- **Server's score is always called first, except in the tie-break.**
- Point calls: `Fifteen-Love`, `Love-Fifteen`, `Thirty-Love`, `Love-Thirty`, `Forty-Love`,
  `Love-Forty`, `Fifteen-All`, `Fifteen-Thirty`, `Thirty-Fifteen`, `Fifteen-Forty`, `Forty-Fifteen`,
  `Thirty-All`, `Forty-Thirty`, `Thirty-Forty`, `Deuce`, `Advantage`, `Game`.
- **`Deuce`, never `Forty-All`.** This is an explicit prohibition, and a good detail to get right.
- No-ad scoring after deuce: `Deciding point, receiver's choice`.
- End of game with running score: `Game [name], [name] leads 4-2, first set` /
  `Game [name], 3 games all, first set`.
- End of set: `Game and third set [name], 7 games to 5. [other] leads 2 sets to 1`.
- Start of a set: `Second set, [name] to serve`.
- Reaching the tie-break: `Game [name], 6 games all. Tie-break`.
- **In a tie-break the score is given first and the leader's name second**: `1-0 [name]`, `1-All`,
  `2-1 [name]`. And **`Zero`, not `Love`** in a tie-break.
- End of tie-break: `Game and set, 7-6`.
- End of match: `Game, set and match [name]`, then the sets, and in each set the winner's game count
  is spoken first.
- Warm-up countdown: `Three minutes` / `Two minutes` / `One minute` / `Thirty seconds` / `Time`,
  then `[name] to serve, play`.
- Changeover: `Time` at 60/90 seconds; `15 seconds` as a prompt.
- Crowd: `Quiet please, thank you` · `Please be seated, thank you` · `Seats quickly, please` ·
  `No flash photography, please`.

Note the deliberate flatness. The umpire never editorialises, never says *great shot*, never uses a
player's first name. That contrast is a free source of texture (§5.2).

### 4.2 Line and chair calls

`Fault` · `Out` · `Net` (serve clipping the net and going over) · `Through` (ball goes through the
net) · `Foot Fault` · `Let` · `Not Up` (played after the second bounce) · `Foul Shot` (double hit or
hit before the ball crosses) · `Touch` (player or clothing touches the net or the opponent's court)
· `Hindrance` · `Wait, please` · `Correction, the ball was good`

Two explicit prohibitions worth honouring, because they mark the boundary between official and
commentator register:
- **Do not call `Double fault`.** The umpire calls `Fault` again; only the commentator says *double
  fault*.
- Do not say `Outside`, `Over`, `Just Missed`. Only `Out`.

Also documented: on clay the chair umpire is told not to be too quick to call the score, in case a
ball-mark inspection is needed. That single hesitation is a good clay-only beat.

### 4.3 Violations

- `Start of Match Violation, [name]`
- `Code Violation, [offence], Warning, [name]`
- `Code Violation, [offence], Point Penalty, [name]`
- `Code Violation, [offence], Game Penalty, [name]`
- `Code Violation, [offence], Default, [name]`
- Offence labels in the published examples: `Delay of Game`, `Racquet Abuse`, `Verbal Abuse`,
  `Unsportsmanlike Conduct`, `Physical Abuse`, `Partisan Crowd` (team events).
- Time violations: `Time Violation, Warning, [name]`; then
  `Time Violation, Loss of Serve, [name], Second Serve` or `Time Violation, Point Penalty, [name]`.
- **After a point or game penalty the new score is announced.** Free structural detail.
- Escalation is a fixed schedule: warning → point penalty → game penalty → default.
- Referral: the chair announces that she is calling the supervisor or referee to discuss the code
  violation.

### 4.4 Medical

- `The Physio has been called to the court`
- `[name] is now receiving a Medical Time-Out`
- Off-mic countdown to the physio: `Two minutes remaining` / `One minute remaining` /
  `Thirty seconds remaining` / `Treatment complete`, then `Time` in public.
- A medical time-out is **three minutes of treatment**, normally taken at a changeover or set break
  unless the condition is acute.
- `medical evaluation` precedes it and is a distinct step.
- Cramping has its own rule: it is not treatable under a medical time-out in the normal way, and a
  player who insists is announced as conceding points and games to the next changeover.
- Commentator-side vocabulary: `called the trainer` (`[AmE]`) · `called the physio` (`[BrE]`) ·
  `taped up` · `strapping` · `treatment` · `she is struggling with something`.

### 4.5 Review and challenge

- `[name] is challenging the call on the [line], the ball was called IN/OUT`
- `[name] has X challenges remaining`
- `Electronic Review is unavailable, the original call of IN/OUT stands`
- At 6-all: `6 games all, tie-break. Each player receives one additional challenge`.
- Commentator side: `challenge` · `review` · `it's gone upstairs` · `the ball was in/out by
  millimetres` · `she has one challenge left` · `she used it well` · `wasted a challenge`.
- With live electronic line calling there is nothing to challenge; the correct commentary framing is
  the **absence** of a challenge – *no argument available*. Whether the fictional tour in this game
  has electronic calling is a content decision, but the two worlds have different vocabularies and
  should not be mixed.

### 4.6 Ending a match other than by winning it

| Term | Precise meaning | Trap |
| --- | --- | --- |
| `retirement` / `retired` | a player stops **after the match has started** | counts as a result; the opponent *advances*, and did not *beat* her |
| `walkover` | opponent cannot **start** – withdrawal before the first point | not a win-loss record entry in the usual sense; never say *won by walkover 6-0 6-0* |
| `default` | removed by officials, typically for a code violation | disciplinary, not medical |
| `withdrawal` | pulling out of the event before the match is scheduled/played | pre-tournament register |
| `suspended` | play stopped, match to resume | not an ending |
| `abandoned` | not resumed | rare in tennis |

Commentary phrasing that stays accurate: `she cannot continue` · `she has retired` ·
`she shook hands at 4-1 in the second` · `it ends with a handshake at the net, not a winner`.

### 4.7 Written score conventions

- Sets written winner-first from the perspective of the match winner: `6-4, 3-6, 7-6`.
- **Tie-break sets carry the loser's point total in brackets**: `7-6(5)` means the tie-break finished
  7 points to 5. The bracket is the loser's score – a detail almost never explained aloud, and one
  the game's UI can get right for free.
- A `10-point match tie-break` replacing a final set is announced in advance:
  *a ten-point match tie-break will now be played to decide this match*.
- `6-0` is a **bagel**, `6-1` a **breadstick**, in written/fan register only.
- **The asterisk-for-server convention** – `*` beside the name or score of the player currently
  serving, e.g. `4-3*` – is standard in live-scoring displays and written live text. **Verification
  is weak**: I found it described only as the low-tech substitute for a tennis-ball glyph on
  scoreboards, not defined in any governing-body document. Treat it as a convention of scoring
  services and live blogs, not an official notation.
- Live-text convention for a game in progress: `*5-4, 30-15` with the point score after the game
  score.
- `(rtd.)` and `(w/o)` are the standard draw-sheet abbreviations for retired and walkover.

---

## 5. Register variation – where the variety actually comes from

Ferguson's *Sports Announcer Talk* (Language in Society, 1983) is the foundational description here
and is directly useful: it treats sportscasting as a **register** and identifies its syntactic
markers – **simplification** (dropping the sentence-initial noun phrase, dropping the copula),
**inversions**, **heavy modifiers**, **result expressions**, and **routines**. Tense follows the
event: simple present for short discrete actions, present progressive for something in progress,
present perfect for recaps.

That gives a generator four structurally different sentence moulds for the same event:

| Mould | Shape | Example shape (generic) |
| --- | --- | --- |
| full clause | `[Name] [verb]s [object]` | *She drives the backhand down the line.* |
| NP-drop | `[verb]s …` | *Drives it down the line.* |
| copula-drop / verbless | `[NP], [modifier]` | *Backhand down the line, and that is a winner.* |
| result expression | `[event] → [consequence]` | *Long, and it is break point.* |

### 5.1 British vs American register

**Documented lexical differences:**

| British | American |
| --- | --- |
| `tramlines` | `alley` / `doubles alley` |
| `knock-up` (the pre-match hit) | `warm-up` |
| `physio` | `trainer` |
| `purple patch` | `hot streak` / `on a roll` |
| `saw it out` | `closed it out` |
| `on the front foot` | `on the attack` |
| `nil` is **not** used in tennis (it is `love` in both) | – |

**Documented tonal difference, with a caveat.** Contemporary comment reports American coverage as
more talkative and British coverage as more restrained, and a Trinity University honours thesis
(Farrell, 2017) did a content analysis of ESPN and BBC coverage of the 2016 finals explicitly to
examine regional differences. The summary available to me confirms the study examined those
differences but does not enumerate them, so **treat "BBC is quieter than ESPN" as a widely repeated
observation, not a finding I verified.** What is safe to model:

- British register leans on **understatement and litotes** – *that was not bad at all*, *she will not
  be happy with that* – and on hedges.
- American register leans on **superlatives and explicit stakes**, statistical framing, and direct
  address of the viewer.
- British register uses more idiom-of-place (*the far corner*, *the Members' end*); keep generic in
  a fictional world.

### 5.2 Written live blog vs spoken broadcast

| | Spoken broadcast | Written live text |
| --- | --- | --- |
| Tense | present / present progressive | present, with past for the point just finished |
| Sentence length | fragments, one clause | can carry a longer aside |
| Score | said aloud constantly | shown as a header line, `*4-3, 30-15` |
| Silence | meaningful – silence is a tool | impossible; a blank blog is broken |
| Repair | self-corrects aloud (*no, it was called out*) | edits invisibly |
| Voice | two voices, play-by-play plus analyst, interrupting each other | one voice, dryly funny, aware it is writing |
| Digression | almost none during play | expected between games – weather, the crowd, the reader's emails |
| Named person | first name in speech, surname in formal moments | surname-led, first name for warmth |
| Typical unit | one clause per ball | one paragraph per game, plus a line for big points |

The single most useful structural fact for a generator: **the written form has a fixed skeleton per
game** (score header, one or two lines of what happened, occasional aside), while speech has no
skeleton at all. If the game's UI is a scrolling text log, it is a **live blog**, not a broadcast,
and should be written in that register. Borrowing broadcast fragments into a text log is what makes
generated commentary read as fake.

### 5.3 Escalation ladder – routine hold to championship point

Five tiers. The lever is not adjectives, it is **what gets mentioned at all**.

| Tier | Situation | What the commentary does |
| --- | --- | --- |
| 0 | routine hold, early round, first set | often **says nothing**. Silence is the correct output for most games |
| 1 | a hold with something in it – a break point saved, a long game | one line, plain verbs, no stakes language |
| 2 | a break of serve | names the event, gives the new score, one clause of manner |
| 3 | serving for a set, tie-break, set point | brings in stakes nouns (`set point`), physical detail (the ball toss, the walk to the line), and the crowd |
| 4 | serving for the match, match point | slows down. Shorter sentences. The score is repeated. Time between points is described |
| 5 | championship point in a final | the word `championship`, the scoreboard read in full, and – the strongest single device – **a beat of nothing**, then the outcome |

Rules that make the ladder work:
- **Vocabulary should not escalate uniformly.** Tier 5 is not tier 1 with more adjectives; it has
  *fewer* adjectives and *more* concrete physical detail.
- The stakes noun changes at each tier and is the cheapest signal: `game point` → `break point` →
  `set point` → `match point` → `championship point`.
- Crowd and silence only appear at tier 3 and above.
- The word *history* and the word *legacy* belong at tier 5 or nowhere.

### 5.4 Surfaces

| Surface | Vocabulary that becomes correct | Vocabulary that becomes wrong |
| --- | --- | --- |
| **Clay** | `slide`, `slid into it`, `the ball bites`, `kicks up`, `high bounce`, `heavy`, `grinding`, `attritional`, `constructing the point`, `the ball mark`, `long rallies`, `moonball`, `drop shot` (rewarded), `sliding into the backhand corner` | `skidding` serves, `net rushing` as a default, short-point framing |
| **Grass** | `skids`, `stays low`, `low bounce`, `slice comes into its own`, `short points`, `serve-and-volley`, `free points on serve`, `bad bounce`, `the court is greasy early / worn by the second week` | `slide` (players slip, they do not slide by design), `attritional`, `heavy topspin` as the dominant weapon |
| **Outdoor hard** | `true bounce`, `consistent`, `neutral`, `medium-paced`, `the ball sits up in the heat`, `punishing on the legs` | `bite`, `ball mark`, `slide` (limited slide is real but do not lead with it) |
| **Indoor hard** | `quick`, `no wind`, `the conditions are the same all night`, `flat hitting rewarded`, `serve dominates`, `the ball flies`, `no elements to fight` | `wind`, `sun`, `bad light`, `the roof` |

Sourced facts behind the table: clay gives the slowest, highest bounce and rewards spin and
patience; grass gives a low bounce with the ball skidding through; hard courts give a *true* bounce,
predictable and free of the bad bounces of the other two.

### 5.5 Conditions

- **Wind.** `swirling`, `gusting`, `the ball is moving in the air`, `serving into the wind`,
  `with the wind`, `hard to judge the ball toss`, `she has the wind at her back this end`,
  `tossed and caught it`. Note the structural gift: conditions **swap at every changeover**, so a
  wind fact can be re-used with the sign flipped every odd game.
- **Heat.** `heat`, `the heat rule`, `a ten-minute break`, `ice towels`, `wet towels round the
  neck`, `shade`, `the court temperature`. The governing bodies use a **Wet Bulb Globe Temperature**
  measure combining temperature, humidity, wind and sun, and the WTA has had a heat rule since 1992
  which can allow a ten-minute break between sets. Commentary shorthand for humidity is
  `heavy air`, `the ball is not going anywhere`, `sapping`.
- **Cold / heavy air.** `the ball is not flying`, `hard to get the ball through the court`,
  `numb hands`.
- **Night session.** `under lights`, `the ball comes through differently at night`, `cooler and
  slower`, `the night crowd`, `it is a different atmosphere after dark`.
- **Roof.** `the roof is closing`, `they have called for the roof`, `once it is closed the match
  finishes indoors`, `the conditions change completely`, `quicker under the roof`, `the noise is
  trapped in here`. The published protocol for at least one major treats the event as an outdoor
  daytime event, with the roof used in good weather only when it is too dark to play without it –
  so *closing the roof* is a decision worth narrating, not a default.
- **Rain.** `a delay`, `covers on`, `the covers are coming off`, `a resumption`, `a rain break`,
  `she had forty minutes to think about it` (the classic momentum framing).
- **Bad light.** `bad light`, `they are struggling to see the ball`, `the umpire has been asked
  about the light`, `play suspended for the night`, `they will come back tomorrow`. Suspension for
  darkness is normally done **at the end of a set or after an even number of games** – a precise,
  correct detail.

---

## 6. Women's tennis specifically

The question asked was whether the descriptive vocabulary used for women's matches is documented as
differing from men's, and whether there is published analysis or critique. **Yes to both, in
peer-reviewed sociolinguistics and sports sociology going back three decades.** Reported neutrally,
because the practical use here is a checklist of pitfalls, not a position.

### 6.1 What the research reports

**Messner, Duncan & Jensen (1993), "Separating the men from the girls: the gendered language of
televised sports", *Gender & Society* 7, 121–137.** Analysed commentary from the 1989 US Open
(women's and men's singles, doubles and mixed) alongside NCAA basketball. Two named categories of
difference:
- **Gender marking** – the women's event is labelled (*women's final*), the men's is the unmarked
  default (*the final*).
- **A hierarchy of naming** – women referred to by first name far more often than men, who are named
  by surname; the paper links this to infantilisation.

**Cambridge English Corpus / Cambridge University Press (2016), research by Sarah Grieves.** Over
160 million words of sport language. Reported findings:
- Men are mentioned roughly three times as often as women in the sport corpus.
- Collocates skew: for men *fastest, strong, big, real, great*, and verbs *mastermind, beat, win,
  dominate, battle*; for women *aged, older, pregnant, married, unmarried*, and verbs *compete,
  participate, strive*.
- Women are twice as likely to be called *girls* as men are to be called *boys*, and twice as likely
  to be called *ladies* as men are to be called *gentlemen*.
- The headline framing is "aesthetics over athletics": disproportionate attention to appearance,
  clothes and personal life.

**Yip (2018), "Deuce or advantage? Examining gender bias in online coverage of professional
tennis", *International Review for the Sociology of Sport*.** Content analysis of 357 articles
across a major-tournament official site and a large broadcaster's site. Reported that both outlets
portrayed female players more negatively, foregrounding athletic weakness, mental weakness, and
non-competitive roles – appearance, attire, family, relationships.

**Farrell (2017), "Breaking Back", Trinity University honours thesis.** Content analysis of ESPN and
BBC coverage of the 2016 Wimbledon finals; reports continued gendered naming practices in both, with
some improvement in language around emotion, coaching and family.

**Vincent et al. (2004), "Game, Sex, and Match", *Sociology of Sport Journal* 21(4)** – British
newspaper coverage of the 2000 Championships; and **"Pinning down the gap" (*Corpora*, 2021)** – a
corpus study of the online representation of professional tennis players. Both extend the same
finding into print and online registers. I list these from citation metadata; I did not read the
full texts.

**Grunting.** A specific, tennis-only strand. Multiple outlets document that the criticism has been
applied overwhelmingly to women players and that proposals to legislate it have targeted the women's
game, while male players grunt without comparable comment. Treated here as a **topic to omit**
rather than a term to use carefully.

### 6.2 What this means for our generator, practically

Because this game is WTA-first, **every player in a match is a woman, so the asymmetry cannot show
up as a contrast.** It can still show up in absolute terms. Concrete rules:

1. **No gender marking anywhere.** The event is `the final`, the draw is `singles`. Never `ladies'`,
   never `women's final` as a label inside the fiction – there is nothing to distinguish it from.
2. **Never `girls` or `ladies` for adult players.** In a junior context `girls` may be structurally
   correct as an age category, and even there prefer `juniors` / `the under-16s`.
3. **The sentence must be about the tennis.** The cleanest operational test: could this line be
   generated for a men's match with only the pronouns changed? If not, ask why. Appearance, outfit,
   hair, family, boyfriend, marital status and age-as-decline have no place in a point-by-point
   commentary generator at all.
4. **Do not over-weight the mental frame.** The Yip finding – women foregrounded for *mental*
   weakness – is the trap most relevant to us, because a Markov engine makes it very easy to
   generate nothing but nerve narration. Balance every pressure line with a technical or tactical
   one. A useful ratio to enforce in the phrase-bank weighting: at least two shot/tactic lines for
   every pressure/nerves line.
5. **Naming.** The existing generator deliberately uses first names for everyone
   (`src/viz/commentary.ts`), on the design ground that a running commentary is spoken about people.
   In an all-women cast this is internally consistent and creates no hierarchy – there is no male
   surname register to contrast against. Worth keeping the reasoning recorded next to the code so it
   is not "fixed" into a half-state where some players are surnamed and others are not. **The
   inconsistent case is the dangerous one.**
6. **Power and finesse are shot descriptions, not player categories.** Describe the ball. Avoid
   building a taxonomy where one player is *the athlete* and another is *the artist* – that pairing
   is exactly what the literature criticises.
7. **Emotion is allowed when it is observable.** *She turned to her box* is an event. *She looked
   like she wanted to be anywhere else* is a projection. Prefer the first.

---

## 7. What to avoid

### 7.1 Cliches that are widely mocked

Collected from fan and forum discussion, so treat as **community sentiment, not measured data**, but
consistent enough across sources to act on:

- *forced into unforced errors* – self-contradictory, and the most-quoted example of the genre.
- *she's playing within herself*.
- *she's keeping her opponent honest*.
- *it's hers to win and hers to lose*.
- *against anyone else that would have been a winner three times over*.
- *point of the tournament – no, point of the year!* – deflated by weekly repetition.
- *she needs to want it more* / *she wants it more*.
- *you can't teach that*.
- *she's got all the shots*.
- *anything can happen in women's tennis* – doubly bad: cliché **and** a gender-marked claim about
  unpredictability that has been examined critically in the literature.
- *she's in the zone*, *ice in the veins*, *the crowd is on its feet* – not wrong, but they are
  currency; spend them once a match at most.

### 7.2 Statistical language used as narrative

`unforced error` is a real broadcast statistic, but the strategy coach Craig O'Shannessy is on
record with the position that "There's no such thing as an unforced error" – it is a judgement call
by a scorer, not a fact about the ball. Practical rule: use it as a **count** (*twelve unforced
errors in that set*), not as an **explanation** (*she lost because of unforced errors*).

Same caution: `winners-to-errors ratio`, `first-serve percentage`, `break points converted`. All
real; all boring in quantity; none of them explains a match on their own.

### 7.3 Dated terms

| Term | Status |
| --- | --- |
| `cannonball` | 1970s–80s slang for a flat serve; recognisable, reads period |
| `wood shot` | mis-hit off a wooden frame; the object no longer exists |
| `American twist` | older name for the twist serve |
| `chop` | extreme underspin; survives in coaching, rare on air |
| `bisque` | a handicap stroke, abolished by the LTA in 1890 |
| `challenge round` | the champion's bye into the final, used at the Championships 1877–1921 |
| `all-comers` | the tournament everyone but the champion played |
| `carpet court` | dropped from major professional events in 2009 |
| `Cyclops` | the service-line electronic device superseded by camera tracking |
| `shamateurism` | pre-open-era term |
| `sudden death tiebreak` | the best-of-nine variant; historically real, now archaic |

None of these should appear in default output. Several are useful if the game ever wants a
deliberately old-fashioned commentator character, and `bisque` / `challenge round` / `all-comers`
are usable **only** in a historical aside.

### 7.4 Structural things that read as generated

- **Naming every event.** Real commentary is silent for most of a routine game.
- **Uniform sentence length.** Vary between one word and twenty.
- **Momentum claims with no supporting run** (§3.3).
- **Adjective stacking** – *a brilliant, aggressive, inside-out forehand winner*. One modifier.
- **Mixed registers in one line** – an umpire formula next to slang.
- **Mixing eras or tours** – challenge language in a world with electronic line calling, `physio`
  and `trainer` in the same match, `tramlines` and `alley` in the same match.
- **Explaining basics repeatedly.** Explain the tie-break bracket once, in the UI, not on air.
- **Mind-reading.** *She knew she had lost the match right there.* Describe what is visible.

### 7.5 Trademark and fiction traps in vocabulary

Never emit: real tour names or their abbreviations, real tournament names, real venue names,
`SABR`, `Gran Willy`, any *"the [Surname]"* shot name, real coach or commentator names, real
sponsor names on court. Real **surnames must not be constructible** from generated strings – this
applies to the commentary generator's name handling as much as to the world generator.

---

## 8. Notes for lifting into a generator

- **The highest-variety axis is not synonyms for `hits`, it is which of the four sentence moulds in
  §5 is used** and whether the line mentions the shot, the direction, the ball behaviour, the court
  position, the pattern, or the consequence. Six slots, each optionally filled, gives more real
  variety than a hundred verbs.
- **Adjective compatibility must be enforced, not sampled.** `heavy` requires topspin; `skidding`
  requires slice or grass; `biting` requires clay; `kicking` requires topspin. A compatibility table
  keyed on (spin, surface) prevents the most obvious errors.
- **Tie vocabulary to the surface and conditions the match already knows about.** Clay unlocks
  `slide`, `bite`, `ball mark`, `long rallies`; grass unlocks `skid`, `low`, `short points`. This is
  free variety from data already in the engine.
- **Escalation is gated on stakes, not on rhetoric** (§5.3). The tier decides which slots may be
  filled at all.
- **Silence is an output.** Tier 0 emitting nothing is what makes tiers 3–5 land, and the existing
  `src/viz/commentary.ts` already builds on that principle.
- **The umpire register is a separate voice with a fixed grammar** (§4). It is cheap to generate
  correctly and gives strong contrast against the commentary voice at no cost in variety.

---

## Sources

Governing bodies and officiating

- ITF, *Duties and Procedures for Officials 2026* (PDF) – https://www.itftennis.com/media/2509/duties-procedures-for-officials-2026.pdf
- ITF, *Duties and Responsibilities for Officials 2019* (PDF mirror) – https://hts.hr/wp-content/uploads/2019/07/ITF_2019-Duties_and_Procedures_for_Officials_v2.pdf
- USTA, *Officiating Techniques and Procedures 2026* (PDF) – https://www.usta.com/content/dam/usta/coach-organize/content-fragments/resource-library/assets/pdfs/usta-officiating-techniques-and-procedures.pdf
- USTA, *Friend at Court* handbook of rules and regulations (PDF) – https://www.usta.com/content/dam/usta/coach-organize/content-fragments/resource-library/assets/pdfs/friend-at-court.pdf
- USTA, tennis scoring rules – https://www.usta.com/en/home/improve/tips-and-instruction/national/tennis-scoring-rules.html
- Tennis Australia, procedures for matches played without a chair umpire (PDF) – https://www.tennis.com.au/content/dam/tennisaustralia/documents/policies/officiating/procedures-for-matches-played-without-a-chair-umpire.pdf

Glossaries and terminology

- Wikipedia, Glossary of tennis terms – https://en.wikipedia.org/wiki/Glossary_of_tennis_terms
- NBC Olympics, tennis terminology and glossary – https://www.nbcolympics.com/news/tennis-101-olympic-terminology-and-glossary
- LTA, guide to serve spins – https://www.lta.org.uk/play/tennis-tips-and-techniques/guide-to-serve-spins/
- LTA, tennis court surface guide – https://www.lta.org.uk/play/tennis-tips-and-techniques/hard-clay-grass-and-astroturf-tennis-court-surface-guide/
- Cambridge Dictionary, "knock up" – https://dictionary.cambridge.org/us/dictionary/english/knock-up
- Collins English Dictionary, "purple patch" – https://www.collinsdictionary.com/dictionary/english/purple-patch
- Wikipedia, Match point – https://en.wikipedia.org/wiki/Match_point
- Wikipedia, Choke (sports) – https://en.wikipedia.org/wiki/Choke_(sports)

Coaching and tactics

- Brain Game Tennis (Craig O'Shannessy), serve +1 – https://braingametennis.com/webinar-16-serve-1-strategy/
- Brain Game Tennis, the first four shots – https://braingametennis.com/the-first-4-shots/
- Tennishead, serve plus one pattern – https://tennishead.net/how-to-serve-more-effectively-utilise-this-serve-plus-one-pattern/
- Mouratoglou Academy, back-of-the-court tactics – https://www.mouratoglou.com/en/coaching-corner/tennis-technique/tactics-back-court/
- TennisCompanion, types of serves – https://tenniscompanion.org/types-of-serves/
- Tennis.com, what is an unforced error – https://www.tennis.com/news/articles/what-is-an-unforced-error-a-meditation-on-the-tennis-player-s-least-favorite-stat

Surfaces and conditions

- Washington Post, what makes tennis surfaces different – https://www.washingtonpost.com/sports/interactive/2024/what-makes-tennis-surfaces-different/
- Wikipedia, Australian Open extreme heat policy – https://en.wikipedia.org/wiki/Australian_Open_extreme_heat_policy
- ATP Tour, new heat rule effective 2026 – https://www.atptour.com/en/news/new-heat-rule-effective-from-2026
- Tennis.com, use of the Wimbledon roof – https://www.tennis.com/news/articles/use-of-wimbledon-roof-has-some-players-bewildered

Register and broadcast language

- Ferguson, C. A. (1983), "Sports announcer talk: syntactic aspects of register variation",
  *Language in Society* 12 – https://www.cambridge.org/core/journals/language-in-society/article/abs/sports-announcer-talk-syntactic-aspects-of-register-variation/6B134D8B6D90BD6B5B073B6C10A33FC0
- ERIC record for the same – https://eric.ed.gov/?id=EJ281197
- Functional and stylistic features of sports announcer talk (ETSU thesis, PDF) – https://dc.etsu.edu/cgi/viewcontent.cgi?article=3878&context=etd
- Farrell, S. A. (2017), "Breaking Back: a content analysis of Wimbledon singles coverage in American and British broadcasts" – https://digitalcommons.trinity.edu/comm_honors/13/

Gender and sports language

- Messner, Duncan & Jensen (1993), "Separating the men from the girls", *Gender & Society* 7 – https://journals.sagepub.com/doi/abs/10.1177/089124393007001007
- University of Cambridge, "Aesthetics over athletics when it comes to women in sport" (2016, Sarah Grieves, Cambridge English Corpus) – https://www.cam.ac.uk/research/news/aesthetics-over-athletics-when-it-comes-to-women-in-sport
- Yip, A. (2018), "Deuce or advantage? Examining gender bias in online coverage of professional tennis", *International Review for the Sociology of Sport* – https://journals.sagepub.com/doi/abs/10.1177/1012690216671020
- Vincent et al. (2004), "Game, Sex, and Match: the construction of gender in British newspaper coverage of the 2000 Wimbledon Championships", *Sociology of Sport Journal* 21(4) – https://journals.humankinetics.com/view/journals/ssj/21/4/article-p435.xml
- "Pinning down the gap: gender and the online representation of professional tennis players", *Corpora* (2021) – https://euppublishing.com/doi/abs/10.3366/cor.2021.0227
- Tejkalova & Kristoufek (2021), "Anything can happen in women's tennis, or can it? An empirical investigation into bias in sports journalism" – https://journals.sagepub.com/doi/10.1177/2167479519890571
- Kemble, M., corpus-based critical discourse analysis of gender bias in sports reportage (Univ. of Sydney thesis, PDF) – https://ses.library.usyd.edu.au/bitstream/handle/2123/33800/Kemble_M_thesis.pdf
- Tennis.com, "The Rally: the politics of grunting" – https://www.tennis.com/news/articles/the-rally-the-politics-of-grunting
- Medium / Women in Sport, criticising female players for grunting – https://medium.com/women-in-sport/criticising-female-tennis-players-for-grunting-is-sexist-e2c71ed45752

Cliches (community sentiment, not measured data)

- Men's Tennis Forums, most hated cliches in tennis commentary – https://www.menstennisforums.com/threads/most-hated-cliches-in-tennis-commentary.1018054/
- Talk Tennis, stupid commentary quotes – https://tt.tennis-warehouse.com/index.php?threads/stupid-commentary-quotes-what-are-your-favorites.242219/
- Tennis Forum, commentators' cliche phrases – https://www.tennisforum.com/threads/commentators-cliche-phases.6915/
- PressReader / The Commercial Appeal, a broadcaster declining to use the word "choke" – https://www.pressreader.com/usa/the-commercial-appeal/20181024/281844349620575

Score notation

- Unicode mailing list, standalone tennis ball symbol (the asterisk-for-server substitution) – https://www.unicode.org/mail-arch/unicode-ml/y2013-m01/0183.html

## Verification status

- **Verified against a primary source:** all §4 umpire formulae (ITF *Duties and Procedures*), the
  §1.1 serve-spin descriptions (LTA), the §6 research findings as reported by the publishing
  institutions, the §5 Ferguson register markers, the surface characteristics in §5.4.
- **Verified against secondary sources only:** the serve +1 / first-strike framing, the heat-rule
  thresholds, the roof protocol, the retirement / walkover / default distinctions.
- **Not verified:** the asterisk-for-server notation as an official convention (§4.7); the specific
  claim that BBC coverage is quieter than American coverage (§5.1) – the study that examined it
  exists but its enumerated findings were not available to me; the currency of `American twist`;
  the exact cliche list in §7.1, which is forum sentiment rather than measured usage.
