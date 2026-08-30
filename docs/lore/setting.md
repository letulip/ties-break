---
type: lore-bible
status: reference
area: narrative
canonical: false
last-reviewed: 2026-08-03
---

# Ties Break: Ace Parent – world, tone and art bible

> Dated tone and art reference. Claims audited against the 2026-07-27 build must be rechecked
> against current code before they are presented as shipped behavior. Start with
> [the product and narrative context](../context/product-and-narrative.md).

*For artists, illustrators, video generators and anyone writing prompts for them. Written
27.07.2026 (R11-10), audited against the shipped build the same day (branch `docs/lore-audit`,
from `main` @ `abfda7d`). You do not need to have played the game to use this file.*

Everything here is read out of the shipped build, not invented for the document. Verified sources:
tiers and season structure from `src/engine/season/calendar.ts`; the wealth corridor from
`src/engine/economy.ts`; palette and type from `src/style.css`; the age bands and emotion rules from
`src/shared/avatarEmotion.ts` + `src/composables/kidEmotion.ts`; the asset inventory from the files
on disk in `public/images/fem-euro-brunnet/`, `public/avatars/` and `art-src/`; the art pipeline from
`scripts/optimize-art.mjs`; the money from `docs/research/junior-economics.md` and
`docs/research/02-tennis-economics.md`; the outcome odds from `docs/specs/career-outcome-targets.md`;
the owner's canonical age bands from `docs/decisions.md`.

Where the shipped art contradicts the rules below, that is called out – the rules win, the old asset
is the thing to fix. Where the build is about to change under a claim, the claim is marked rather
than frozen.

---

## 1. The one-line brief

**You are the parent. Your daughter might have talent. "Might" is the whole game – nobody knows yet,
and the bills start now.**

It is a management sim in the Football Manager tradition, except the subject is not a club but a
family, and the real opponent is not the other girl across the net – it is the cost.

## 2. The world and its era

Contemporary, roughly now. Real world, real continents, real airport-and-motorway texture – but every
name in it is invented. Tennis exists exactly as it does in life: a weekly calendar, a rolling
52-week ranking, a surface swing that moves across the year, a junior ladder that starts at the
council courts down the road and ends, for almost nobody, on television.

No science fiction, no alternate history, no magic. The only unreality is that the tours, the
sanctioning bodies, the brands and the players are fictional analogues.

**The season shape** (this is the calendar the art has to sit inside – `SURFACE_BLOCKS`). The engine
counts weeks from 0; the "Weeks" column below is 1-based, the way a person would say it. The date
column is against the build's real-date epoch, career week 0 = Mon 6 Jan:

| Weeks | Dates | Block (player-facing label) | Looks like |
|---|---|---|---|
| 1–10 | 6 Jan – 15 Mar | Hard-court swing | indoor halls, cold light, winter coats in the car park |
| 11–25 | 16 Mar – 28 Jun | Clay swing | European spring, red dust on white socks, long shadows |
| 26–31 | 29 Jun – 10 Aug | Grass window | six weeks only, deliberately scarce – green, damp, English |
| 32–49 | 11 Aug – 14 Dec | Summer hard swing | US and Asian autumn, heat haze, night sessions |
| 50–52 | 15 Dec – 4 Jan | Off-season | no tournaments; kitchens, gyms, family |

Those five labels are player-facing strings – they appear on the Season screen's block strip. The
band names in §5 are not; see the warning there.

**A block is a weighted mix, not a single surface.** This matters for anyone painting a "clay week":
the clay block is 78% clay, 19% hard, 3% grass, and the two hard blocks are 72/22/6. A stray hard
court inside the clay swing is deliberate and correct – it keeps the calendar from being a metronome.
Across a whole year the mix lands at roughly hard 0.50 / clay 0.37 / grass 0.13. The grass window is
6 weeks of 49 playable ones, and it is meant to feel scarce.

## 3. Tone – the three rules

**Honest.** The drama is in the numbers and the decisions, never in a cutscene. Nothing is
heightened. If a scene would need a swelling orchestra to work, it is wrong.

**Unglamorous.** This is a sport played, for the first eight years, in front of eleven people and a
laminated draw sheet taped to a fence. Junior events pay no prize money at all – that is a real ITF
rule, it is enforced in the engine, and there is a test that fails if a prize field ever appears. The
family is roughly $300–400k out of pocket across the whole junior road, break-even does not arrive
until about the 150th-best player alive, and about a third of top juniors end their careers
financially positive. Art that implies wealth she has not earned contradicts the mechanics the player
is being asked to suffer through.

**Warm.** This is not misery. It is a family that loves each other doing something enormous and
mostly unrewarded. Coaches are kind. Other parents share flasks of coffee. The girl on the next court
becomes a rival and then, ten years later, the only person who understands. Bleak and honest are not
the same thing – aim for honest.

The in-game writing voice is dry and understated. Match art should match that register: no fist-pump
poster energy unless she has actually just won something, and even then it is a club trophy and a
folding table.

## 4. The cast

**The daughter.** The protagonist you draw. In the shipped art she is a European brunette
(`fem-euro-brunnet` – the character-set folder name is literally that). She starts detailed
simulation at **14** (`START_AGE_YEARS`). She is a person, not an asset: she has morale, fatigue, a
relationship with the parent, a school she is failing to attend, and the right to quit. She is a
**minor for most of the game** – see the NEVER list.

Her name is *rolled*, not fixed: onboarding draws a first name and a surname at random from the
game's own pools (44 given names × 210 surnames) and the player can re-roll or type over either. The
hard-coded fallback profile is Vera Martin, which is why "V. Martin" shows up in code comments and
placeholder art – but no career actually opens on it unless the dice land there. **Do not letter any
one name into a painting as though it were hers.** If a scoreboard needs a name, invent initials.

**The parent.** The player. Almost never depicted, and when present, at the edge of the frame: on the
far side of the fence, in the car, holding the bag. The design principle is *parent as observer* –
they shape circumstances and react, they never decide for her. Art should never put the parent in a
commanding position over her.

**The cohort.** 199 invented juniors, all born the same year as her and all generated at age 14, who
age and develop alongside her – the girl who beat her at 14 turning up in a qualifying draw at 22.
They are drawn from **36 weighted tennis nations**, heaviest first: US, ES, FR, IT, RU, DE, GB, AU,
then CZ / RS / AR, then HR / JP / CN / CA / CH / GR / PL, and a long tail down to single-weight
entries (SI, BG, NO, HU, TN, KR, PT). They share the same 210-surname pool the player's daughter
draws from, so a draw sheet reads international rather than like one extended family.

**The coach, the physio, the other families.** Present, ordinary, underpaid. A coach with a clipboard
and a tracksuit, not a guru.

## 5. Her arc – the bands the art is cut into

⚠ **The band names are internal file conventions. They are not player-facing words, they are not
in-game vocabulary, and no player ever sees one.** They exist so a filename can say which painting of
her this is. Do not invent player-facing labels for them, do not letter them into art, and do not
treat `milf` as a description of anything – it is a legacy folder token for "the oldest band", and
it is the reason this section carries this warning.

> ⚠⚠ **THE FIFTH BAND IS `lateCareer` EVERYWHERE AS OF 30.08 – IN CODE, IN THE CROP TABLE AND ON
> DISK.** The owner's ruling, round 30 #20: «имеет смысл их переименовать со сленга на **lateCareer**
> или **grown**, давай сделаем разом.» R2-18 had already moved the TYPE; that round moved the
> seventeen files and every key of `src/art/faceRects.ts`, so `portraitAssetStem` is now identity on
> all five bands. **Name new art `lateCareer-<emotion>`, never `milf-<emotion>`.** The rest of this
> section keeps the old word where it is recounting history – that is the record of how the band got
> here and it is not restated as instruction. The table below is the live mapping.

There are **five** bands in the art set. Only four of them exist in code.

| Band | Shipped resolver (`portraitStage`) | Owner canon (`docs/decisions.md`, 24.07) | Art on disk |
|---|---|---|---|
| `jun` | under 11 | under 12 | yes |
| `young` | 11–16 | 12–15 | yes |
| `teen` | 17–22 | 16–22 | yes |
| `adult` | **23–30** | 23–28 | yes |
| `lateCareer` | **31 and up** | 29 and up | yes |

The shipped resolver is the one the build actually runs, and it is the later instruction: the owner
moved `young` down to 11 on 25.07 so the coming childhood prologue has a band to live in.

**RESOLVED 27.07.** This file previously recorded the biggest open item in it: the resolver returned
four bands, `adult` had no upper bound, and the eight `milf` paintings shipped with no code path able
to reach them. The owner settled the boundaries – `adult` 23–30, `milf` 31 and up – and both are now
in `portraitStage()` with a test over the whole band range. `adult` also gained the 256px face crops
it never had (it used to borrow `teen`'s, so a woman of 30 wore a seventeen-year-old's face), and
`milf` got its own. The remaining discrepancy in this table is between the shipped resolver and the
older numbers in `docs/decisions.md`; only the owner can reconcile those.

### `jun` – under 11. The prologue.
A child, not an athlete. Kit that does not match. A racquet slightly too big. Held at the club down
the road, entry fee about $40, draw of 8. Adults are enormous here. This band is a narrative
flashback in the current build – the onboarding "first time on court" frame on the summary step is
hard-coded to `jun-norm`, deliberately, and does not follow her age. The childhood prologue proper is
still to come.

### `young` – 11 to 16. Where the game starts.
The default opening band: a new career begins at 14, so **this is the art the player meets first**.
She is recognisably good now, and the money has begun in earnest. The research bands the family's
spending by how much they can commit rather than by her age: about $10–20k a year for a modest
competitive schedule, $25–40k for a club high-performance programme, and $80–100k at the elite end of
the 13–18 window. She plays local, regional and national events, and from 13 the international junior
ladder opens. School is losing.

### `teen` – 17 to 22. The valley.
The hardest years and the ones the game is really about. First professional points arrive around
17–18; the road to a top-100 ranking takes another 44–54 months **if it arrives at all**, putting
top-100 entry around 21.5–22. She is travelling to other countries, sometimes alone, sleeping in
cheap rooms, earning nothing. Physically adult, financially a dependent.

The design targets, measured against careers that reach the horizon: about **50–65% see the
professional contour** at all, **15–25% end up living from tennis**, **3–6% become a genuine star**,
**under 1% reach the top**, and **5–10% quit of their own accord** – a reversible outcome, not a
failure state. (These are design intent, not measured output: the spec notes they are not yet wired
as bench assertions.)

### `adult` – 23 and up. The contour of a professional life.
Peak years are roughly 23–28 across all players; for a woman specifically the peak is nearer **23–24**,
with decline from about 29 – women peak around two years earlier than men and have shorter careers.
Depict a working professional, or an adult who used to be one – the same face, older, with the same
tiredness.

This band carries the mid-life milestones, and each one already exists as a painting: `bride`,
`graduated`, `pregnant-early`, `pregnant-last`, `funeral`. Play them straight, domestic and quiet.
The game does not yet reach any of them.

### `lateCareer` – 29 and up. After.
*The band the previous draft of this document omitted entirely. Named in the owner's decision log as
29+; not implemented in the resolver; eight paintings shipped.*

**Who she is.** The end of the thing, and the first person she has to be afterwards. If she made it,
she is a professional in her last two seasons – still fit, visibly older than the `adult` frames,
carrying the mileage in the shoulders and around the eyes rather than in the face. If she did not
make it, she is the same woman with a different life and the same body memory. Either way the
question the whole game asked – *was it worth it* – gets answered in this band, and the answer is
supposed to be complicated. This is the band where the parent, if still drawn at all, is old.

**What the art shows.** Eight paintings ship: the standard six (`norm`, `happy`, `sad`, `serious`,
`tired`, `injury`) plus two milestones unique to this band – `retired` and `farewell`. The two
milestones are the same beat from two angles: the last match, the wave to the crowd, the bag over the
shoulder, a career-highlights board behind her. `happy` in this band is not a club trophy – it is a
trophy *wall*, medals, confetti, the accumulated evidence. That is the one place in the whole game
where the "unglamorous" rule is suspended, because by then she has earned it.

⚠ Every currently-shipped frame in this band is on the fix list – see §9. They are the frames that
carry a real player's surname, real tour and Slam names, and recognisable kit and equipment brands.
**Do not use the shipped `lateCareer` frames as style reference for de-branded work.**

**What the game is doing at this point in the career.** Nothing yet, and that is the honest answer.
`portraitStage` stops at `adult`; there is no retirement, no post-career, and no code path that can
request a `lateCareer` file. The later-life design work that would drive this band lives in
`docs/research/life-events-motherhood.md`, which puts marriage around 22–30, a first pregnancy across
a wide 24–35 window, a return to the tour at roughly six months post-birth with about a 40% success
rate, and a second child at 28–38. Career end is not settled: the plan says retirement around 33, the
decision log says 30–35, the economics research says decline after 29. **Anyone briefing this band
should treat its age floor as 29 and its ceiling as unsettled.**

## 6. What the tour actually looks like, tier by tier

Six tiers ship. Entry fees set the production scale of the venue: a family that pays $40 to enter is
not at a stadium.

| Tier | In-game label | Draw | Entry | Base travel | How often | What you see |
|---|---|---|---|---|---|---|
| `local` | Local Open | 8 | $40 | $60–120 | every 2 weeks | Two municipal courts behind a chain-link fence. A laminated draw sheet cable-tied to the gate. A folding table with a cash box and a tin of balls. Parents on a wooden bench, one dog. Nobody in a uniform. Her first title lives here. |
| `regional` | Regional Championship | 16 | $75 | $150–400 | every 4 weeks | A proper club: four to six courts, a clubhouse with a urn and a sign-up sheet, a low sponsor banner from a local car dealer, a hand-operated flip scoreboard, maybe thirty people. A drive of two or three hours, so the day starts in the dark. |
| `national` | National Series | 32 | $120 | $400–900 | 6 a year (4 + 2 extra in the back half) | A national training centre. Uniform court surfaces, a real umpire chair, accreditation lanyards, a printed order of play on a noticeboard, a physio table under a gazebo. Federation logos on everything (invented ones). A hotel with a breakfast buffet. |
| `j30` | Junior Tour 30 | 32 | $200 | $900–2,000 | every 2 weeks, from age 13 | The entry rung of the international junior ladder. Abroad: a different alphabet on the road signs, a shuttle bus, a tournament desk with a laptop and a pile of passports, players from nine countries eating the same free bananas. Still no crowd. |
| `j60` | Junior Tour 60 | 32 | $250 | $1,100–2,400 | every 3 weeks, from age 13 | The same, one notch more serious: streamed on a fixed camera nobody is watching, a small stand along one court, national team tracksuits. |
| `j300` | Junior Tour 300 | 32 | $400 | $1,600–3,200 | 4 a year, from age 13 | The season is planned around these. A recognisable venue with a show court, actual seating, a scoreboard with names, a media wall, agents leaning on the fence. This is the closest a junior gets to the thing on television – and it still pays nothing. |

**Travel is a band, then a wealth multiplier.** The figures above are the *base* draw. Every trip is
then scaled by the family's background – working ×0.7–0.8, middle ×0.95–1.05, wealthy ×1.2–1.3 – and
the scaled number is what the player is charged and shown. So a working family's Local Open trip is
$42–96 and a wealthy family's Junior Tour 300 trip is $1,920–$4,160. If a brief calls for "how the
family travels", that corridor is the difference between a night bus and a booked flight, and it is
worth drawing.

**Surfaces.** Hard (blue or green, most of the year), clay (red-brown European spring), grass (six
weeks, English, damp). Surface is a strategic season block, not decoration – see §2.

**⚠ Ranking points and ladder order are mid-change – do not build art around tier prestige right
now.** The current points are known to be wrong against the real ladder, and
`docs/research/ranking-points-by-tier.md` proposes a retable that also **reorders the ladder** to
`local < regional < j30 < j60 < national < j300`. If that lands, National Series stops being a
mid-rung and becomes the second-most-valuable thing in the game, above both dense J levels. The venue
descriptions above are about *production scale*, which does not move; but any art that implies a
ranking of prestige between National Series and the J tiers should wait. No numbers are quoted here
on purpose.

## 7. The look of the build

The art must sit inside a specific dark UI. These values are the real ones, from `src/style.css`, and
all seven verified exact.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0f172a` | page background – deep navy, near-black |
| `--panel` | `#16213c` | panel/card fill – one step lighter navy |
| `--line` | `#263457` | borders, table rules |
| `--text` | `#dbe4f5` | body text – cool near-white |
| `--muted` | `#7d8db0` | secondary text – slate blue |
| `--accent` | `#d9f24f` | THE accent – tennis-ball lime. Used sparingly: one primary action, one highlighted number |
| `--danger` | `#f2664f` | coral-red. Money going wrong, injury, a warning |

**Type.** Sora 600 for headings, Manrope 400/500 for body, both self-hosted, latin subset. Tight,
dense, tabular. The house description is *"tables, but stylish"*.

**UI idiom.** Dark panels with 10px radii, capsule pills (`--radius-pill: 999px`) for chips and
progress bars, true circles (`50%`) only on square elements – avatars, dots. Dense numeric tables are
the main event on most screens.

**The sizes the art is actually seen at.** Nothing is ever displayed at its native resolution, and
two of the four surfaces are tiny. This is the most-ignored constraint in the whole file:

| Surface | Asset | Rendered at |
|---|---|---|
| App header, every screen | 256px crop | **30 × 30**, circular, 1.5px lime ring |
| Home player card | 256px crop | **64 × 64**, 14px radius, 1.5px lime ring |
| Kid screen portrait | 512px painting | up to **360px** wide, 12px radius |
| Tournament finale / pre-match splash | the 512px painting (no separate set) | up to **180px** wide, 12px radius |

So: the emotion must be legible in a 30px circle, which means it has to live in the eyes, the mouth
line and the head angle – not in a prop. Fine background storytelling in the big paintings is
genuinely enjoyable but is *never* seen above 360px and usually at 180px. Both crop surfaces already
carry a lime ring, which is a second reason not to put lime inside the frame.

**What this means for art.** Every painting is viewed as a bright rectangle inside a dark navy page.
So:
- keep the subject's value range **higher** than the UI around it – the art is the light source;
- avoid navy-dominant backgrounds, they dissolve into the page;
- warm light (late afternoon, sodium lamps, low sun) reads well against the cool UI and is already
  the set's signature;
- lime `#d9f24f` belongs to the interface. Do not paint large lime objects – a ball is fine, a lime
  wall competes with the buttons.

## 8. The art that already exists

Everything below is the file inventory as it stands, counted on disk – not what the code expects.

**The masters.** Finished JPEGs at **1254 × 1254** live in `art-src/images/fem-euro-brunnet-jpeg/`
(42 of them). These are the real reference for style-matching – not the shipped WebP. **`art-src/` is
gitignored**: the masters exist only on the author's machine, and git is not their backup.

**How new art gets in** – drop the masters into `public/images/<set>-jpeg/` and build. The build
encodes them to WebP in `public/images/<set>/` (≤512 px longest side, quality stepping
82 → 79 → 76 → 75 until the file is under 120 KB) and then MOVES the masters into `art-src/`, out of
`public/` – anything left under `public/` is copied verbatim into the bundle. Raw jpeg/png is never
committed and never served; only the WebP is.

**Finale paintings** – there is no separate set. The tournament result splash shows the SAME
`happy | serious | sad` frames the Kid screen uses. A parallel `-fs8` copy of every frame used to
exist (a filename artefact of the pngquant era, meaning nothing about quality); it was an incomplete
duplicate, it 404'd for `adult`, and it has been deleted. Do not reintroduce the suffix.

**Full paintings** – `public/images/fem-euro-brunnet/fem-euro-brunnet-{band}-{emotion}.webp`,
512 × 512, 36–79 KB. **The whole shipping set is clean-named:**

| Band | Standard six (`norm happy sad serious tired injury`) | Milestones |
|---|---|---|
| `jun` | all six | – |
| `young` | all six | – |
| `teen` | all six | – |
| `adult` | all six | `bride`, `graduated`, `pregnant-early`, `pregnant-last`, `funeral` |
| `lateCareer` | all six | `retired`, `farewell` |

Every band × emotion the code can resolve exists. The milestone frames are later-life content
nothing reaches yet – deliberately kept out of the service worker's precache for that reason. Exact
counts are deliberately NOT quoted here: they moved twice in one day, and a number in a document is
wrong the moment the set changes. `ls public/images/fem-euro-brunnet/` is the answer.

**One naming inconsistency to know about before adding files:** `angry` exists as a JPEG master for
all five bands. Whether it ships depends on whether the code can request it – the pipeline carries a
`NOT_SHIPPED` list precisely so art no code path can reach is not encoded into every player's
download, and `angry` came off that list on 27.07 when it became the seventh member of `AvatarEmotion`. It now has art, a type
AND a trigger (fix/world-trio): she turns angry on a run of consecutive losses, the exact length
drawn per streak in 4-6 so the player cannot count to a fixed number. The cause the emotion was
waiting for turned out not to be inside any single result – it is the SHAPE of several of them, and
the engine is what observes that. It is painted for all five bands and precached like every other
reachable face.

**Header crops** – `public/avatars/{band}-{emotion}.webp`, 256 × 256, 11–20 KB. Tight face/shoulders
crop of the same painting, cut from the 1254px master with an explicit crop rectangle (the recipe for
the `jun` set is recorded in `docs/specs/round5-brand.md`). Crops exist for `jun`, `young` and `teen`
only – **18 files**. There is no emotion-keyed `adult` crop, so `adult` clamps to `teen` on both crop
surfaces. (A stray emotionless `adult.webp` sits in the folder; nothing references it.) **A full
`adult` crop set, and then a `lateCareer` one, is the cheapest high-value art work on this list.**

**Style of the existing set.** Painterly semi-realistic illustration, close to high-end
anime-adjacent digital painting: soft brushwork, warm rim light, shallow depth of field, richly
detailed backgrounds carrying the story (a scoreboard with the match score on it, a banner with a
slogan, other girls lining up, a pink backpack on the bench). Faces are expressive and specific, never
doll-like. The camera is close – waist-up or tighter for emotion frames, wider for celebrations.

**The emotion set, and what each frame must carry:**

| Emotion | When the game shows it | What it must read as |
|---|---|---|
| `norm` | default, healthy, nothing recent | composed, mid-effort, unremarkable – this is the most-seen frame |
| `happy` | she won a match or a title **this week** | earned joy at the scale of the tier. A club trophy, not a Slam |
| `serious` | runner-up; any Local Open loss; a loss while a recent title still shields her; or condition below 60 | focused and contained. NOT sad – this is the runner-up frame too |
| `sad` | a real loss, not softened | private disappointment. Alone, or turned away. Never theatrical |
| `tired` | condition below 40 | end of a long week: heavy shoulders, damp hair, a towel |
| `injury` | an active injury | strapping, ice, a physio table, sitting out. Not gore |

Two rules behind that table are worth knowing, because they change how often you see each frame. A
**recent title shields her** – a champion losing early the following week still reads `serious`
rather than `sad`, for one to three weeks depending on the tier. And since round 11, a **practice
match does not change her face at all**: only tournament results do, so she never comes home from a
club hit-out looking crushed.

`serious` is the hardest-working painting in the set. It does triple duty: the runner-up finale, the
pre-tournament splash before every event, and the low-condition idle state. There is no dedicated
silver artwork – a programmatic gold-to-silver desaturation was tried and looked patchy – so the
losing finalist gets `serious` plus a silver-styled card frame in CSS. **If you make one dedicated
runner-up painting, that is the highest-value single asset on this list.**

## 9. What the art must NEVER show

These are the permanent rules. They do not expire, and they apply to every band, every asset class
and every prompt in §10.

1. **Real players.** No real name, likeness or surname – on a scoreboard, a draw sheet, an order of
   play, a banner, a shirt, anywhere. If a scene needs a name, invent initials.
2. **Real tours, federations or sanctioning bodies.** No WTA, ATP or ITF, no Grand Slam names, no
   "World No. 1" phrasing borrowed from a real ranking, and none of their visual identities –
   including the marks of individual real tournaments on a scoreboard or a net banner. Invented
   equivalents only; the in-game tiers are called Local Open, Regional Championship, National Series,
   and Junior Tour 30 / 60 / 300, and those are safe to letter into a scene. The game's own
   "Ties Break: Ace Parent" mark is also safe.
3. **Real brands.** No swooshes, stripes, crocodiles, or any recognisable logo on kit, bags, shoes,
   racquets, drinks bottles, banners or courts. Blank kit, or the game's own invented marks.
4. **Any sexualisation of a minor.** She is 14 through most of the game and a child before that. No
   posing for the viewer, no camera interest in the body, no adult styling, no cropping that frames
   anything but sport and face. Sportswear as sportswear. This one is absolute and no brief
   overrides it. It is also the reason the internal band token `lateCareer` must never surface in a prompt,
   a caption or a filename anyone outside the team sees – see the warning at the top of §5.
5. **Glamour the economics forbid.** No private jets, no sports cars, no designer luggage, no
   sponsor-drenched pro kit in the junior bands, no packed stadium below the top tier, no cash. The
   family is spending $300–400k and earning nothing. A frame that says otherwise sells the fantasy
   the whole game exists to argue with. (The `lateCareer` `happy` frame is the one sanctioned exception –
   by then she has actually won the things on the table.)
6. **Heightened misery.** No tears streaming in the rain, no injury as body horror, no parental
   shouting. Understatement always.
7. **Later-life content shown gratuitously.** The milestone frames – a wedding, a graduation, a
   pregnancy, a funeral, a retirement, a farewell – are played straight, domestic and quiet.

> **Status note, 27.07.2026 – shipped-set compliance. Remove this block once the re-art lands.**
>
> At the time of writing, known violations of rules 1–3 are concentrated in the **`milf` band**, not
> in `adult` as an earlier draft of this document said. Across `lateCareer-retired`, `lateCareer-farewell` and
> `lateCareer-norm`: a real player's surname (L. Svitolina) appears as the opponent on career scoreboards;
> career-highlight boards read in real-tour and Grand Slam vocabulary; and kit, wristbands, racquet
> bag and drinks bottle carry recognisable real brand marks, alongside a real tournament's identity
> on a scoreboard.
>
> **The owner is re-doing this art himself and this note cannot see that work.** Treat it as a
> pointer to which files were flagged and when – not as a claim that they are still broken, and not
> as a claim that they are fixed. Verify against the current files before acting, and delete this
> block when the replacements land. The rules above stand regardless.

## 10. Prompt fragments

Paste the **style preamble** first, then one asset block. They are written for image generators but
read fine as a brief for a human illustrator. Band tokens in `[brackets]` are internal – strip them
before the text reaches anyone outside the team.

### Style preamble (always include)

```
Painterly semi-realistic digital illustration, high-end anime-adjacent rendering with soft
visible brushwork. Warm natural light (late afternoon or low sun), cool shadows, shallow depth
of field. Expressive specific face, not doll-like. Rich storytelling background detail kept
soft behind the subject. Square 1:1 composition. Value range kept bright: this image is viewed
inside a dark navy interface. Emotion must read clearly from the eyes, mouth and head angle
alone – this crop is also shown at 30 pixels. No text overlays except signage described below.
No logos, no brand marks, no real-world tour, tournament or federation names, no real player
names. Blank unbranded sportswear, unbranded racquet, unbranded bag.
```

### Avatars by age band

```
[jun]   A girl of about nine on a municipal tennis court, hair tied back, mismatched
        kit slightly too big, holding a racquet that is a size too large. Chain-link
        fence, a wooden bench, a pink backpack, a laminated notice taped to a board
        reading "LOCAL JUNIOR TOURNAMENT". Sunlight through trees. She is small in
        the frame; the adults around her are cropped at the waist.

[young] A girl of about fourteen in plain sports kit, dark ponytail, wristband, mid-match
        on a club hard court. Low sponsor-free banner along the fence, a hand-flipped
        scoreboard, twenty spectators on a low stand. Late-afternoon sun. Waist-up,
        three-quarter view, racquet in frame.

[teen]  A young woman of about nineteen, athletic, tired around the eyes, in plain
        sportswear on a national-centre court. Umpire chair, accreditation lanyards
        on the officials, small stand half full. Overcast or hard midday light.
        Close, waist-up, ready position or between points.

[adult] A woman in her mid-twenties, professional athlete, on a show court with real
        seating and a media wall carrying invented sponsor names only. Night session
        lighting or strong late sun. Close, waist-up. She looks like the same person
        as the teen frame, older and harder.

[lateCareer]  A woman of about thirty, a professional at the end of a long career. The same
        face as the adult frame, five or six years further on: fine lines at the eyes,
        a squarer jaw, hair up and slightly greying at the temple, shoulders and
        forearms carrying two decades of load. Plain unbranded kit, plain wristbands,
        an unbranded bag beside her. A show court between points, or a bench at a
        changeover. Warm low sun. Close, waist-up. She is tired in a way sleep does
        not fix, and entirely composed about it.
```

Append the emotion line:

```
norm     – composed, mid-effort, neutral expression, unremarkable moment
happy    – earned delight, holding a small club trophy or a medal, confetti of the
           cheap paper kind, a handful of people applauding
serious  – focused and contained, jaw set, eyes forward; disappointed but upright
sad      – private disappointment, alone on a bench or turned away from the court,
           head down, no tears required
tired    – end of a long week: heavy shoulders, damp hair, towel around the neck,
           sitting on court side
injury   – strapping or ice on a limb, sitting out on a physio table or bench, a
           physio's hands in frame, calm and clinical
```

### Milestone frames (`adult` and `lateCareer` only)

One painting each, all of them quiet. No crowd reaction, no ceremony staging, no swelling moment.

```
bride           – a small wedding, day of, not the aisle: a registry office step, a
                  garden, a handful of people. Plain dress. She looks like an athlete
                  in a dress, because she is.
graduated       – a distance degree finished late, in a rented gown, photographed by
                  one person. Ordinary corridor or lawn.
pregnant-early  – early, barely showing, ordinary clothes, at home or at a court she
                  is no longer playing on. Calm, private, slightly unresolved.
pregnant-last   – late term. Domestic. A racquet visible somewhere in the room and not
                  in her hands.
funeral         – a small gathering, dark coat, weather. Her face does the work. No
                  graveside theatre, no rain-on-the-face.
retired         – her last match, just finished: turned away from camera, one hand
                  raised to the stand, bag over the shoulder, racquet still in hand.
                  A results board behind her carries invented initials only and no
                  real tour, tournament or Slam name anywhere.
farewell        – the same beat, wider and later: walking off, the court behind her
                  emptying, low sun. Golden without being triumphal.
```

### The win image (champion)

```
[age-band block] + happy. She is holding a trophy proportionate to the tier: a small
engraved cup at Local Open, a shield at Regional, a proper silver cup only at Junior
Tour 300. Behind her, the actual scale of the event: a folding table and a dozen people
at the low tiers, a real stand only at the top. Confetti, if any, is cheap and paper.
Gold and warm light dominate. Her kit is unbranded. The scoreboard, if visible, shows
invented initials only.
```

### The runner-up image

```
[age-band block] + serious. Second place, immediately after the final. She holds a
smaller plate or a medal, or nothing at all. Composed, not crying, not smiling for the
camera – looking somewhere past it. Cool silver light rather than gold; the winner is
out of frame or blurred behind her. The whole image should read as "a good result that
still hurts", never as defeat.
```

### Venue backdrops (no character, for use behind UI)

```
[local]    Two municipal courts behind chain-link fence, cracked green paint, a
           laminated draw sheet cable-tied to the gate, folding table with a cash box
           and a tin of balls, wooden bench, one dog, suburban trees. Empty of people.
[regional] A small tennis club, four courts, clubhouse with a tea urn visible through
           a window, hand-flipped scoreboard, low banner from an invented local car
           dealer, a low stand of thirty seats. Early morning.
[national] A national training centre: uniform courts, umpire chair, printed order of
           play on a noticeboard, physio gazebo, invented federation signage, a hotel
           shuttle in the car park.
[j30]      An international junior venue abroad: tournament desk with a laptop and a
           stack of passports, shuttle bus, flags of many invented nations, players
           from several countries queueing for fruit. No crowd.
[j60]      The same abroad venue one notch up: a single fixed streaming camera on a
           tripod nobody is watching, a small stand along one court only, national
           team tracksuits on a bench, a printed draw taped inside a window. Still
           thin on spectators.
[j300]     A show court with real seating, a lit scoreboard with invented names, a media
           wall, a camera position, agents leaning on the fence. The biggest stage in
           the game, and still not television.
```

Append the surface line:

```
hard  – blue or green acrylic court, crisp white lines, hard shadows
clay  – red-brown European clay, dust on the lines, a drag mat leaning on the net post,
        spring green trees beyond
grass – English grass court, worn baseline patches, damp overcast light, ivy or hedging,
        a short six-week-of-the-year feeling
```

---

## 11. What this document does not settle

Honest gaps, so nobody assumes an answer is in here. The first four are the ones that would actually
block an artist or a video generator today.

- **No character sheet.** There is no turnaround, no reference of her from multiple angles, no colour
  script, no eye/hair hex values, no height or build note. Consistency across the shipped set comes
  from the frames themselves. Use the **1254px masters in `art-src/`** as reference, not the shipped
  512px WebP, and expect drift. This is the single largest gap in the pack.
- **No `milf` age is implemented, and no career end is agreed.** The band's floor (29) exists only in
  the decision log; its ceiling does not exist anywhere, and three documents give three different
  retirement ages. Nobody can brief the end of the arc until the owner picks one.
- **The `adult` and `milf` crop sets do not exist.** Both bands fall back to `teen` in the 30px header
  and the 64px Home card, which means a 31-year-old is currently represented on two of the four art
  surfaces by a nineteen-year-old. Cheap to fix, visible everywhere.
- **No motion spec at all.** No animation, camera-move, shot-length, frame-rate or aspect conventions
  exist – and a video generator needs every one of them. Everything in this file is square 1:1 stills.
  The match view is a schematic top-down court, not video, so there is no in-engine footage to match
  a cut to either.
- **The other 199 juniors.** No art exists for any of them and no rival portrait system is specified.
  Their nations and names are generated; their faces are not. A draw sheet or a stand full of rivals
  currently has to be painted as anonymous.
- **The parent.** Never designed. Age, gender and appearance are undecided by intent (the player
  chooses a background, not a body).
- **The country.** The family's nation is a player choice at onboarding from 36 possibilities, so no
  single national setting is canon. Draw the venue, not the flag.
- **The runner-up problem.** Whether the fix is a dedicated painting per band or a treatment of the
  existing `serious` frame is an open design question.
- **No venue or crowd art exists at all.** §10 has backdrop prompts, but nothing has been produced
  from them, and no UI surface currently consumes a backdrop.
- **Milestone staging beyond a one-line brief.** The seven milestone frames now have prompt text
  above, written from the shipped paintings – but no scene direction, no supporting cast, no season
  or location, and the game does not yet reach any of them.
