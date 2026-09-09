---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# Who she is – temperament, the personalities of a private life, and the layer's face

The owner, 09.09, asking for exactly this file:

> «мне кажется, нам надо каким-то образом показать разные персоналии: много отношений, мало,
> умеренно, одни на всю жизнь. Возможно какие-то темпераменты нужны, на которые мы будем опираться
> везде? Что, как и на что влияет в игре? Надо всё детально расписать и утвердить.»

> «Как вообще выглядит это слой? будем ли мы добавлять дополнительный гаудж или останемся как-то
> словестно с настроением, и будем через него как-то показывать? Тут надо хорошенько подготовиться,
> потому что этот слой меняет всю игру буквально»

⚠ **A DESIGN SPEC, NOTHING BUILT, NOTHING RULED THAT HE HAS NOT RULED.** It answers his three
questions – the personalities, the influence map, the surface – and every number in it is a
proposal for a bench, not a ruling. The build authority stays
[the-private-life-build.md](../plans/the-private-life-build.md); when this spec is approved, its
constants land inside that plan's waves (the re-base pass owes the merge).

⚠ What forced the question: in the build plan as written, every girl runs the SAME romance hazards
(arrival 1.0/2.5%/wk, end 1.2%/wk, cooldown 26). Variety across careers would be dice alone – and
dice produce one modal biography (a handful of medium romances) with the owner's four archetypes as
tail luck. «Одна на всю жизнь» would be an accident, never an identity. This spec makes the
biographies first-class.

---

## 1. The shape: ONE trait, two axes, four temperaments

**`temperament`** – one value per career, drawn at birth, never chosen, never re-rolled, never
shown as a label. Two independent axes compose it:

* **Openness** (открытая ↔ закрытая) – how much of her life reaches the parent, and how soon.
* **Intensity** (ровная ↔ порывистая) – how hard events hit her and how fast she comes back.

⭐ **The axis law that keeps the system honest: INTENSITY MOVES THE NUMBERS, OPENNESS MOVES WHAT
THE PARENT KNOWS.** One axis is physics (hazards, amplitudes, recovery), the other is fog (feed
lag, wants, how the diary speaks). They never trade jobs, so no combination double-charges.

The four temperaments (working names – ids for code; every player-facing word is his):

| id | axes | his word | the biography it tends to produce |
| --- | --- | --- | --- |
| `sunny` | open + steady | «умеренно» | 2–3 romances, told about early; a long one likely reaches the marriage latch |
| `fiery` | open + intense | «много» | 4–6 romances by the latch, short cooldowns, everything on the surface, deeper dips and faster fires |
| `quiet` | private + steady | «одни на всю жизнь» | first love later (median ~18), and it LASTS – the modal quiet career carries its first or second love into the latch |
| `deep` | private + intense | «мало» | 1–3 romances, each guarded, each hitting hard when it ends; the parent often learns late |

⚠ Tendencies, not scripts – the per-week draws stay live, so a `quiet` girl CAN have three loves
and a `fiery` girl CAN marry her first. The temperament biases the dice; it never replaces them.
(His own 23.08 ruling stands: several romances and one long romance are both first-class – this
spec is that ruling given a cause.)

**Rejected alternative, recorded so it is not re-litigated:** continuous axes (two 0..1 floats)
instead of four buckets. Subtler in the engine, but the copy system needs VOICES – a diary line
pool per personality – and a voice needs a discrete speaker. Four buckets are four voices; a float
is none. (The design plan's own law: one state, not five systems – and not a parameter cloud
either.)

---

## 2. Where it comes from

* **Drawn once from the seed**: `rngFromSeed(`${seed}:temperament`)` at `createWorld` – two
  uniform picks, one per axis. (seed)-keyed, nothing of the calendar's, nothing of the player's –
  she was born this way, which is invariant 2's strongest form.
* **Shares**: uniform 25/25/25/25 proposed. The census bench (§5) prints the realised biography
  mix; reweighting is a one-line retune after his read.
* **Migration derives, it does not draw**: existing careers get their temperament from the SAME
  formula on their own seed – byte-stable, zero draws on any stream, no re-roll anxiety. A career
  already in flight simply turns out to have always been her.
* **The prologue REVEALS it, never shapes it.** Childhood choices must not author her personality
  – a chosen temperament is a menu wearing a soul, and it would hand min-maxers a «correct» girl.
  What the prologue MAY do (open question 5): one glimpse scene per axis – the girl who cried in
  the car after losing vs the one who shrugged; the girl who tells everything at dinner vs the one
  you learn from her coach. Cheap, sells «персоналии» in the first ten minutes, touches prologue
  copy (his wording law applies).
* **Rivals have no temperament** in v1 – their private lives do not exist (the standing boundary).
  If rival life ever ships, this field is where its texture would come from.

---

## 2a. ⭐ Can she change? – his 09.09 question, and the two-channel answer

His ask verbatim:

> «что если мы сделаем функционал, что в зависимости от выбора родителя (и работы с психологом)
> ребенок может на протяжении карьеры потихоньку меняться или усиливаться в своих осях? т.е. если
> изначально она была закрытая и порывистая, то может быть если ее больше поддерживать и обнимать,
> она станет менее закрытая или вообще открытая, а если всё время "пинать", то такая и останется.»

The recommendation is YES – in two channels that must never be confused, because «стала более
открытой С ТОБОЙ» and «стала другим человеком» are different facts, and the game already owns a
number for the first one.

**Channel 1 – expression through `bond` (cheap, ships with waves 3–4).** Her nature stays fixed;
what the parent EXPERIENCES of it follows the relationship. A `private` girl at a `close` bond
band tells him sooner – the feed-lag draw reads the band and shaves the lag toward the open
distribution – and her wants read a shade clearer in the wording. Nothing of her temperament
moved: she trusts THIS parent. ⚠ Not a new mechanic – `bond` already has the memory property;
this is its second reader (the diary is the first). It also makes the fog axis care-responsive
without making openness trainable.

**Channel 2 – true drift, slow and BIDIRECTIONAL (⭐ his 09.09 ruling re-cut the sketch).** The
draft here said «never backward»; it did not survive contact with him, verbatim:

> «как в спеке, да, но "пинать → такая и останется" - здесь надо предусмотреть, что если она
> стала более открытой, а ее начали пинать, то она вполне может и назад откатиться. И наоборот:
> если она изначально была открытая и хотела всё рассказывать, а ее пинали, то вполне может
> стать закрытой. И про другие характеристики то же самое.»

He is right that the one-way door was the thesis half-applied – «отношения можно укрепить или
разрушить» (his 20.08 law) must hold for who she becomes, not only for the standing. The model,
re-cut:

* **Each axis keeps a slow internal LEANING** – a bond-like accumulator, persisted, never shown
  on any surface. The four buckets stay the only expressed truth (the voices, the physics); a
  bucket flips only when the leaning crosses a threshold **with hysteresis**, so a flip is an
  event of seasons, never a flicker, and churn is capped by the timescale rather than by a hard
  counter. ⚠ Not the rejected continuous model returning: no reader and no line ever sees the
  leaning – it exists purely so change can be gradual, rare and honest.
* **Toward the care pole (open, steady) the road is DELIBERATE**: sustained `close`/`steady`
  bond AND the psychologist retained with the matching year-focus chosen (his 08.09 year-focus
  idea finds its second job here). Care alone opens the telling (channel 1); it does not rewrite
  her. ⭐ The focus-gate is also what protects a well-loved `quiet` girl from being hugged into
  an extravert: without the chosen work, her nature holds and only the relationship opens.
* **Toward the hurt pole (closed, intense) the road is NEGLECT ITSELF** – no purchase required:
  seasons where the kick pattern dominates (pushed knocks, played hurt, refused asks, zero
  vacations) at a `strained`/`cold` bond walk the leaning the other way. An open girl who is
  kicked learns to stop telling; a steady one learns to brace. ⭐ The asymmetry is the design:
  repair costs deliberate work, damage costs only carelessness.
* **Why this is not «наказание»** (the principle survives, applied honestly): nothing here is a
  scripted penalty – it is the slow, telegraphed, nameable consequence of the parent's own
  sustained pattern, visible on every surface the layer ships (the face dims, the Mood word
  cools, the diary goes guarded, the feed goes quiet) for seasons before a flip lands – and the
  road back always exists: a closed-again girl can be opened again, which the album will know
  how to say. A career can round-trip; that sentence is earned drama, not damage.
* **Never guaranteed, in either direction** – held conditions arm a hazard on a purpose-scoped
  sub-stream; two identical patterns can differ by a season, and the census prices both roads.
* **Bench option, ruled with step 5's rungs:** does a retained psychologist SLOW the backward
  walk even without the matching focus – a second legible thing the retainer buys? Priced at the
  bench, his word then.

**The convergence guard, re-aimed for two poles** – the trap is any policy that reliably
manufactures ONE bucket. Grind careers drifting closed+intense is the game telling the truth;
every caring career ending open+steady would not be – the focus-gate is the dam. The census (§4)
prints flip shares in both directions under a caring arm and a grinding arm, plus the
end-of-career distribution, so erosion is a number before it is a fact.

**The album arc this buys** – his §7.6 ruling: «напишем с чего начиналось и к чему пришли».
The honest endings for the line (copy drafts, his): unchanged – she was always the quiet one;
opened WITH him – quiet with the world, but by the end she told you everything (channel 1);
genuinely softened – the girl who cried in the car learned to breathe (channel 2); and, since
the 09.09 re-cut, the hurt roads – the girl who stopped telling you things, and the round trip
that came back. The start is drawn at birth; the end is earned; the album gets a sentence only a
whole career can write.

---

## 3. «Что, как и на что влияет» – the influence map

Every reader, what it reads, when it ships, and what bounds it:

| # | reader | what temperament changes | wave | bounded by |
| --- | --- | --- | --- | --- |
| 1 | romance arrival hazard | multiplier per temperament (§4) | 3 | hazards stay (seed, week)-keyed sub-streams |
| 2 | romance end hazard + cooldown | multiplier per temperament (§4) | 4 | same |
| 3 | feed lag (when he finds out) | openness shifts the lag draw (§4) | 3 | the truth always moves on time; only the telling lags |
| 4 | her `wants` reads (private/open, space/company) | openness biases the draw ~70/30 (§4) | 3–4 | per-event draw stays live – she is a person, not a formula |
| 5 | spirit physics | intensity scales perturbations ×0.8/×1.25, return 5/3 per week, break-up shock −22/−34 (§4) | 1 | `spiritMatchFactor` floor 0.90 and knee 60 stand for everybody – temperament never touches the factor curve itself |
| 6 | diary + feed voice | four line pools under the SAME licences – what is true stays machine-checked; how she says it is hers | 1+ | honesty pins; all copy DRAFT for him |
| 7 | birthday ask weighting | mild re-weight of which of the four offered she asks for (fiery → the trip; quiet → the day together) | 1+ | the ask stays drawn on `seed:birthday:<age>` – deterministic re-weight, the record shape untouched |
| 8 | life-beat prompt wording | the beat's copy carries her register (a `quiet` girl's «met someone» row is two guarded lines; a `fiery` girl's is a storm) | 2+ | engine-assembled copy, all DRAFT for him |
| 9 | marriage timing (later) | steadiness nudges the latch hazard earlier once 22+ | 6 | his 22+ gate is absolute |
| 10 | the psychologist's wants-read rung (later) | a `private` girl's wants are harder to read unaided – the top rung's brief is worth more exactly for her | 5 | the psychologist spec's own bench |
| 11 | the album (later, his reserved redesign) | the ARC line – ruled 09.09: «напишем с чего начиналось и к чему пришли», §2a's three endings | album wave | §2a |

### ⚠⚠ THE FENCE – what temperament must NEVER touch

Named now, because «этот слой меняет всю игру» is exactly why the edges must be walls:

* **No direct tennis.** No skill effects, no match term of its own, no development-speed change.
  Its only road to the court is through `spirit`, whose factor is bounded (0.90 floor) for every
  temperament equally. ⚠ A hidden birth trait that moved match maths directly would be the
  rejected hidden-heart-stat family (season-life-future §2) coming back in a nicer coat.
* **No fork want.** Her college/tour want at the fork stays on its own draw – temperament colours
  HOW she says it, never WHAT she wants. Otherwise temperament becomes a career script.
* **No economy, no knock/injury system, no endings hazard, no rival reads.**
* **The parenting price list is universal.** The `bond` delta table (what a reaction costs or
  earns) does not vary by temperament – temperament changes what happens to her and what she
  wants, never the price of being her parent. The situations differ; the arithmetic of care does
  not. (It also keeps the table benchable.)
* **Not a difficulty setting.** §5's fairness corridor is the mechanical guarantee.

---

## 4. The numbers – all proposals for the bench

**Hazard multipliers** (on the build plan's base: arrival 1.0%/wk before 18, 2.5% from 18; end
1.2%/wk; cooldown 26):

| temperament | arrival | end | cooldown | expected biography, ages 16→24 (before the latch truncates) |
| --- | ---: | ---: | ---: | --- |
| sunny | ×1.2 | ×0.6 | 26 | ~2–3 romances, median duration ~1.8 seasons |
| fiery | ×1.6 | ×1.5 | 12 | ~4–6 romances, median ~0.7 seasons |
| quiet | ×0.6 | ×0.35 | 39 | first arrival median ~18; ~1–2 romances, median ~3 seasons |
| deep | ×0.5 | ×0.9 | 52 | ~1–3 romances, median ~1.2 seasons, each ending −34 |

**Feed lag** (arrival's `knownWeek − sinceWeek`): open – 0 with p 0.45, else uniform 1..5;
private – 0 with p 0.10, else uniform 2..12. (The build plan's single distribution retires; its
~50% «he learns 4+ weeks late» average survives as the mix of the two.)

**Wants weights**: open girls draw `'open'` / `'company'` at ~70%; private girls `'private'` /
`'space'` at ~70%. The read stays surfaced only in the feed line's wording, as designed.

**Spirit physics** (the build plan's §1b table stands; intensity scales it):

| | steady | intense |
| --- | ---: | ---: |
| perturbation scale | ×0.8 | ×1.25 |
| return toward baseline | 5/wk | 3/wk |
| break-up shock | −22 | −34 |
| weeks under the knee after a lifted-75 break-up | ~1–2 | ~6–7 |

**The fairness corridor** (the not-a-difficulty-setting bar): the wave-1 and wave-4 benches run
per-temperament arms; paired lifetime deltas across temperaments must land inside **±1.5 pp of
career match-win rate** and prize inside noise. Predicted: intense girls lose ~10–25 more
sub-knee weeks per career than steady ones ≈ well under 1 pp lifetime – inside the corridor
without help. ⚠ If the bench says otherwise, the compensator is NOT a stat rebate: an intense
girl responds harder to support (matched reactions and the psychologist buy +1 extra on her) –
«она ярче во всём», paid for by the parent showing up. His word before any compensator ships.

**The census – what «показать разные персоналии» means measurably** (`tools/life-arrival.ts`
grows arms): 200 careers per temperament print – romance count distribution (medians must
separate: fiery ≥ 4, sunny 2–3, deep ≤ 3, quiet ≤ 2), first-arrival age medians (quiet ≥ 17.5,
fiery ≤ 17), «first or second love reaches the latch» share (quiet ≥ 50%, fiery ≤ 20%), late-feed
share by openness (private ≥ 60%, open ≤ 25%). These eight numbers are the acceptance table his
«утвердить» signs. Once §2a's drift ships, the census adds the drift prints: flip shares in BOTH
directions under a caring arm and a grinding arm, and the end-of-career temperament distribution
– the two-pole convergence guard made numbers.

---

## 5. The layer's face – his gauge question, answered

> «будем ли мы добавлять дополнительный гаудж или останемся как-то словестно с настроением?»

**No new gauge. The layer's face is HER face – and the game already built it.**

The three carriers, all existing surfaces:

1. **The portrait.** The emotion decision is already ENGINE-side and singular
   (`assembleDiaryFacts` → `avatarEmotion` → `snapshot.diary.facts.emotion`, one decision the
   painting and the words both read – diary.ts:100). Today it reads tennis and body only:
   condition, injury, last result, title, loss streak, rank climb. **`spirit` joins those inputs
   at wave 1** – and her face starts carrying her life: a `sad` week nobody lost a match in IS
   the layer, readable in one glance, zero new chrome, zero new art (the seven faces – norm,
   happy, sad, serious, tired, injury, angry – already cover it). ⚠ F45-1 stands: the header
   avatar stays age-only; only the Home hero and Kid screen portraits emote.
2. **The Mood tile's word.** KidScreen and WeekRecapCard already render «a 36px face beside a
   word – Hurt, Tired, Steady». The word ladder gains spirit states – proposal, five words, ALL
   DRAFT FOR HIM: `Glowing / Bright / Steady / Dimmed / Heavy`. A word, never a bar, never a
   number, never an arrow.
3. **The diary and the feed** – as the build plan already lays out (`bondBand` licences, the feed
   rows, the beats), now spoken in four voices (§3.6).

### 5a. Emoji beside the Mood word – his 09.09 question

> «что если для этих 5 слов мы добавим по одному эмоджи рядом соответствующему? у нас их нигде
> нет, а здесь могут оказаться вполне уместными и наглядными. я понимаю, что это "удешевляет", но
> может быть имеет смысл, всё-таки их много доступно, можно еще больше подчеркнуть гамму чувств»

The honest read: **the Mood tile already carries the game's own emoji – her 36px face.** The face
is stage-true (it ages with her), emotion-true (engine-decided, the same decision the words read)
and HERS – a Unicode glyph beside it would say the same thing twice in two visual languages, and
platform emoji fonts sit oddly against the painted art. Recommendation: **not beside the Mood
word.**

⭐ Where a glyph WOULD do real work, if he wants the gamma: **the life rows of the feed.** A
career's feed is hundreds of tennis rows; the private-life thread (met someone · it ended · the
wedding · the birthday ask) is exactly the thread a player will want to re-find seasons later,
and one small mark per life-row kind makes the whole biography scannable at a scroll. That is
navigation, not decoration – and it is the one surface with no face to spend. Two routes there:
Unicode emoji (cheap, his pick of glyphs), or the house route – tiny drawn glyphs in the game's
own language, the round-40 tennis-ball-radio-dot family. Either is one line per row kind, and
removable.

⚠ Whichever is ruled, the wording law extends to glyphs: the set is his to pick, and no agent
adds or swaps one unasked.

⭐ **RULED 09.09: the feed's life rows, Unicode emoji** – the recommendation taken («Фид:
эмоджи»); nothing lands beside the Mood word. The glyphs ship with wave 3's first life rows, and
the proposed set goes to him as drafts then – one glyph per row kind, his to swap.

**What deliberately gets NO surface:**

* **`bond` – no meter, ever.** The relationship lives in scenes and the diary's bands. A trust
  gauge turns parenting into an optimisation puzzle – P2's own argument, already accepted into
  the build plan (§1e: no meter, no tile, no snapshot number).
* **`temperament` – no label, ever.** The parent LEARNS who she is across seasons – from the
  prologue's glimpses, from when the feed tells him things, from how the diary talks. A
  character-sheet line («темперамент: холерик») would flatten the one discovery the layer is
  about. The album naming her at the end (§3.11) is the earned exception, his call.
* **A numeric spirit gauge – REJECTED, recorded with reasons**: it breaks the house fog rule
  (`coachRoomNote`'s law, the masseur's note, the build plan's «neither is ever shown as a
  number»), it converts reactions into slider-feeding, and it is the inverse of the decorative-
  staff failure – instead of «you paid and cannot tell», «you see the number and stop seeing
  her». The КidScreen Confidence-tile re-point stays deferred (his earlier call), unchanged here.

⭐ The whole surface answer in one sentence: **the layer ships no instrument – it makes the
instruments the game already has (her face, her words, her diary) finally mean her.**

---

## 6. Landing on the build plan – what moves where

| wave | carries from this spec | schema |
| --- | --- | --- |
| 1 (two numbers) | `world.temperament` (drawn + derived migration), intensity's spirit physics, emotion input, Mood word ladder, diary voices v1 | the trait rides wave 1's move (v72), one field |
| 2 (reaction surface) | prompt registers per voice | – |
| 3 (someone exists) | arrival multipliers, feed-lag by openness, wants weights, census arms | – |
| 4 (it ends) | end/cooldown multipliers, shock by intensity, fairness-corridor arms | – |
| 5 (psychologist) | the wants-read rung's extra worth for `private` girls | that spec's own |
| 6+ (marriage, album) | latch timing nudge; the arc line (§2a) | those waves' own |

Two cheap lines the 09.09 review pass adds to existing waves:

* **Wave 2+ – her state colours her stated want.** The fork-opinion draw (build plan wave 2)
  already weights her want by deterministic inputs; when `spirit` and `bond` exist they join
  those inputs – a worn-down girl leans `stop`, a close one dares more. One line, no new system,
  and «решения всё равно будут за девочкой» becomes mechanical. (Temperament itself stays out of
  the want – §3's fence holds; this is her STATE speaking, not her birth.)
* **Waves 3–4 – `bond` gates the fog** (§2a channel 1): the feed-lag and wants-clarity reads take
  the bond band as an input beside openness.

**Named later beats** – surfaced by the 09.09 external-review reconciliation (§7a), deliberately
NOT in waves 1–5, recorded here so each is planned once:

| beat | what it is | earliest honest slot |
| --- | --- | --- |
| burnout & the breaking point | sustained overload + low spirit as a PROCESS with an escalating warning ladder (the face → the Mood word → the coach's line → a beat), and – his ruling needed – a morale-driven end: she can be DONE with tennis, not only old. P2's one surviving unplanned concept; season-life-future §2's humane shape («pressure, withdrawal and burnout through humane conversations and support») | after step 5; its own spec and his word |
| the parent in the stands | attend-vs-watch-on-TV (round 5: «кричите в телевизор – её там не слышно»). The travel line already prices two seats, so «stay home» can become a real choice with a bond/spirit meaning – the layer's first money-vs-relationship trade | after step 4; needs a presence model, priced before designed |
| on-court conduct | the July flagship (the racket, in rage): low spirit × intense temperament × no psychologist → an incident with a visible cost – the exact commit that re-adds `conduct` to the penalty union (offers.ts removed the reserved member until a producer exists; act2-pro-tour §6 already names psyche as its source) | with/after burnout; his word |

Costs named honestly: the engine half of this spec is **S–M** (multipliers, one field, one input);
the real weight is **copy – four voices across diary, feed and beats, every line his to approve**
(invariant 4 of `CLAUDE.md` binds every string here twice over). The wave-1 bench grows
per-temperament arms – more grid cells, same instrument.

---

## 7. His rulings of 09.09, and what stays open

Eight questions went to him with recommendations. His answers, verbatim where they decide:

1. **Buckets – RULED: «бакеты ок».** Four voices stand.
2. **Shares – RULED: uniform first.** «взвешенные звучат интереснее, как мне кажется, но если
   версия 25х4 это логичный первый шаг - то можем сначала ее реализовать» – v1 ships 25×4; the
   first census read is the scheduled moment to reweight toward his taste.
3. **The fairness corridor – RULED: «коридор нравится, интересно звучит».** ±1.5 pp stands as
   the bar; the support-responsiveness compensator only if the bench breaches it.
4. **The five Mood words – RULED: «пять слов нравится, добавит гаммы».** The drafts stand for
   his wording pass. ⚠ One tail still his: «Steady» is already condition's word on the same tile
   – spirit shares the word or takes its own middle one.
5. **Prologue glimpses – RULED: «да».** One scene variant per axis, revealing never shaping; the
   glimpse lines go to him as drafts (prologue copy is his).
6. **The album – RULED, with a better shape than the question offered:** «предлагаю в конце
   лучше вариант: напишем с чего начиналось и к чему пришли» – not a label, an ARC: §2a's three
   endings, landing with the album redesign he has reserved.
7. **Birthday ask weighting – RULED: «да».** Mild (~1.5× toward her register), reading the
   existing draw – the asked/given record and its bond rows untouched.
8. **`bond` – RULED: «давай оставим bond».** The name stands beside the offers vocabulary's
   apparel-bond strings (`kit-bond-<week>` – same word, different domain, no runtime collision);
   decided once, here.

**The four tails – all RULED 09.09, same day:**

1. **§2a, can she change – RULED: «как в спеке, да, но…»** – the two-channel model approved,
   AMENDED to bidirectional drift by his word (quoted and re-cut in §2a: the hurt pole is
   reachable by neglect alone, the care pole stays focus-gated, round trips exist).
2. **§5a, emoji – RULED: the feed's life rows, Unicode** («Фид: эмоджи») – nothing beside the
   Mood word; glyph drafts go to him with wave 3.
3. **The reweight moment – RULED: after the first census read** – 25×4 ships; his «взвешенные
   интереснее» is the recorded direction for that conversation, held until it has numbers.
4. **The Steady collision – RULED: spirit shares condition's «Steady»** – the neutral state is
   one state and gets one word; the gamma lives in Glowing/Bright/Dimmed/Heavy, and the tile's
   priority rule (injury first, then the larger deviation of body vs mood) ships with wave 1.

**Nothing in this spec now waits on his word.** The remaining numbers are bench proposals by
nature (invariant 5): measured first, then read together.

---

## 7a. The 09.09 external review, reconciled – covered, adopted, refused

He brought an outside review's «what is not realised» list the same day. Verified against the
code and this spec's plans, item by item, so nothing is double-planned and nothing slips:

**Already covered by the layer's waves 1–4** (the review confirms the plan and adds nothing
here): persistent morale (= `spirit`) · persistent bond · weekly rules for both · consequences
for the emotional tone of parent decisions (the bond delta table: pushed knocks, played-hurt,
zero vacations, refused asks) · bounded morale influence on match day (`spiritMatchFactor`,
floor 0.90 – the review says «composure»; the shipped seam scales all five wings exactly as
condition does, one idiom, same bound) · relationship-aware diary selection (`bondBand` licences
+ §3.6's four voices) · the psychologist (step 5 + the pending reconciliation doc). Its «P2
starting point» is the absorbed proposal – morale = `spirit`, bond = the standing – already
recorded as superseded in [the-private-life-layer.md](../backlog/the-private-life-layer.md) #3.

**Genuinely missing from the plans until today – adopted as §6's named later beats:** burnout &
the breaking point, with the escalating warning ladder and a possible morale-driven quit (P2's
one surviving unplanned concept; round 40's plateau/«she is done» work is AGE-driven and does not
cover «done with tennis») · the parent in the stands (round 5's attend-vs-watch, now cheap to
price because the travel line already bills two seats) · on-court conduct as psyche's penalty
producer (the review correctly reads offers.ts: the reserved `conduct` member was removed until a
producer exists, and the beat above is that producer).

**Deliberately NOT taken, with the reasons recorded so the list is answered rather than
re-absorbed:**

* «Morale reacting to results» – that is form-and-slump's channel, PARKED by his own word
  («форму и спад тоже давай распишем спеком, но уже на потом»); double-charging results into
  `spirit` builds the lose→sad→lose spiral the parking avoided. The perturbation table reads her
  LIFE, not her scorelines – by design.
* «Morale influence on training quality» – a second, invisible reader: a spirit malus inside the
  training week would be condition-style invisible, the decorative failure pointing the other
  way. `spirit`'s one mechanical reader is the match; the diary carries the rest.
* The «visible warning ladder» already ships for WEATHER in §5's carriers (face → word → diary);
  the explicit escalating ladder belongs to the burnout beat, not to waves 1–4.

One doc nit found while verifying: `docs/context/product-and-narrative.md` still calls `conduct`
«a reserved field» – it was removed (YAGNI-2, round-22 review); the re-base pass owes the pack a
one-line correction.

---

## 8. What this spec is deliberately not

* **Not the psychologist's spec** – his reconciliation (recovery slope vs the 08.09 year-focus on
  composure vs the wants-read) is its own document, owed by the re-base wave; §3.10 only names
  the one seam temperament gives him.
* **Not form and slumps** – parked by his own word, and §3's fence keeps this trait out of the
  results-driven channel entirely.
* **Not a reopening of the rejected mental-health shapes** (hidden heart, terminal outcomes) –
  season-life-future §2's ruling block stands; the fence's first bullet is partly there to keep
  this trait from drifting toward it.
* **Not new UI chrome** – §5 is an argument that the game already owns every surface this layer
  needs.

**Done when:** the re-base pass folds this spec into the build plan – §4's constants and census
arms, §2a's two channels (the leaning included), §5a's feed glyphs and §6's two cheap lines,
against the plan's waves 1–5. §7 is fully ruled; nothing else waits on a word.
