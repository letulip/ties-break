# Ties Break: Ace Parent – world, tone and art bible

*For artists, illustrators, video generators and anyone writing prompts for them. Written 27.07.2026
(R11-10). You do not need to have played the game to use this file.*

Everything here is read out of the shipped build, not invented for the document: the tiers come from
`src/engine/season/calendar.ts`, the palette and type from `src/style.css`, the money from
`docs/research/junior-economics.md` and `docs/research/02-tennis-economics.md`, the outcome odds from
`docs/specs/career-outcome-targets.md`, and the existing art from `public/images/` and
`public/avatars/`. Where the shipped art contradicts the rules below, that is called out – the rules
win, the old asset is the thing to fix.

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

**The season shape** (this is the calendar the art has to sit inside – `SURFACE_BLOCKS`):

| Weeks | Dates | Block | Looks like |
|---|---|---|---|
| 1–10 | early Jan – mid Mar | Hard-court swing | indoor halls, cold light, winter coats in the car park |
| 11–25 | mid Mar – late Jun | Clay swing | European spring, red dust on white socks, long shadows |
| 26–31 | late Jun – mid Aug | Grass window | six weeks only, deliberately scarce – green, damp, English |
| 32–49 | mid Aug – mid Dec | Summer hard swing | US and Asian autumn, heat haze, night sessions |
| 50–52 | mid Dec – early Jan | Off-season | no tournaments; kitchens, gyms, family |

## 3. Tone – the three rules

**Honest.** The drama is in the numbers and the decisions, never in a cutscene. Nothing is
heightened. If a scene would need a swelling orchestra to work, it is wrong.

**Unglamorous.** This is a sport played, for the first eight years, in front of eleven people and a
laminated draw sheet taped to a fence. Junior events pay no prize money at all. The family is roughly
$300–400k out of pocket across the whole junior road, break-even does not arrive until about the
150th-best player alive, and about a third of top juniors end their careers financially positive.
Art that implies wealth she has not earned contradicts the mechanics the player is being asked to
suffer through.

**Warm.** This is not misery. It is a family that loves each other doing something enormous and
mostly unrewarded. Coaches are kind. Other parents share flasks of coffee. The girl on the next court
becomes a rival and then, ten years later, the only person who understands. Bleak and honest are not
the same thing – aim for honest.

The in-game writing voice is dry and understated. Match art should match that register: no fist-pump
poster energy unless she has actually just won something, and even then it is a club trophy and a
folding table.

## 4. The cast

**The daughter.** The protagonist you draw. In the shipped art she is a European brunette
(`fem-euro-brunnet` – the character-set folder name is literally that); the player names her at
onboarding and the default is A. Martin. She starts detailed simulation at **14**. She is a person,
not an asset: she has morale, fatigue, a relationship with the parent, a school she is failing to
attend, and the right to quit. She is a **minor for most of the game** – see the NEVER list.

**The parent.** The player. Almost never depicted, and when present, at the edge of the frame: on the
far side of the fence, in the car, holding the bag. The design principle is *parent as observer* –
they shape circumstances and react, they never decide for her. Art should never put the parent in a
commanding position over her.

**The cohort.** 199 invented juniors born the same year, who age and develop alongside her for the
whole game – the girl who beat her at 14 turning up in a qualifying draw at 22. They come from a
weighted spread of tennis nations (US, ES, FR, IT, RU, DE, GB, AU, CZ, RS, AR, JP, CN and a long
tail) and now draw from a pool of **210 surnames**, so a draw sheet reads international, not like one
extended family.

**The coach, the physio, the other families.** Present, ordinary, underpaid. A coach with a clipboard
and a tracksuit, not a guru.

## 5. Her arc – the four bands the art is cut into

The build resolves a portrait **stage** purely from her age (`shared/avatarEmotion.ts`
`portraitStage`). These four words – `jun`, `young`, `teen`, `adult` – are the filenames, so they are
also the art brief.

### `jun` – under 11. The prologue.
A child, not an athlete. Kit that does not match. A racquet slightly too big. Held at the club down
the road, entry fee about $40, draw of 8. Adults are enormous here. This band is a narrative
flashback in the current build (the onboarding "first time on court" frame) and the childhood
prologue to come.

### `young` – 11 to 16. Where the game starts.
The default opening band: a new career begins at 14, so **this is the art the player meets first**.
She is recognisably good now, and the money has begun in earnest – $10–20k a year for a modest
competitive schedule, $25–40k for a club high-performance programme. She plays local, regional and
national events, and from 13 the international junior ladder opens. School is losing.

### `teen` – 17 to 22. The valley.
The hardest years and the ones the game is really about. First professional points arrive around
17–18; the road to a top-100 ranking takes another 44–54 months **if it arrives at all**. She is
travelling to other countries, sometimes alone, sleeping in cheap rooms, earning nothing. Physically
adult, financially a dependent. Around **15–25% of careers that reach the horizon end up living from
tennis; 3–6% become a genuine star; under 1% reach the top.**

### `adult` – 23 and up. The contour of a professional life.
Peak years for a woman are roughly 23–28. This band carries the later-life content: a career, a
retirement, a wedding, a funeral, a pregnancy, a return. Depict an adult professional or an adult
who used to be one – the same face, older, with the same tiredness.

## 6. What the tour actually looks like, tier by tier

Six tiers ship. Entry fees and travel costs are the real in-game values, so they set the production
scale of the venue: a family that pays $40 to enter is not at a stadium.

| Tier | In-game label | Draw | Entry | Travel | How often | What you see |
|---|---|---|---|---|---|---|
| `local` | Local Open | 8 | $40 | $60–120 | every 2 weeks | Two municipal courts behind a chain-link fence. A laminated draw sheet cable-tied to the gate. A folding table with a cash box and a tin of balls. Parents on a wooden bench, one dog. Nobody in a uniform. Her first title lives here. |
| `regional` | Regional Championship | 16 | $75 | $150–400 | every 4 weeks | A proper club: four to six courts, a clubhouse with a urn and a sign-up sheet, a low sponsor banner from a local car dealer, a hand-operated flip scoreboard, maybe thirty people. A drive of two or three hours, so the day starts in the dark. |
| `national` | National Series | 32 | $120 | $400–900 | 6 a year | A national training centre. Uniform court surfaces, a real umpire chair, accreditation lanyards, a printed order of play on a noticeboard, a physio table under a gazebo. Federation logos on everything (invented ones). A hotel with a breakfast buffet. |
| `j30` | Junior Tour 30 | 32 | $200 | $900–2,000 | every 2 weeks, from age 13 | The entry rung of the international junior ladder. Abroad: a different alphabet on the road signs, a shuttle bus, a tournament desk with a laptop and a pile of passports, players from nine countries eating the same free bananas. Still no crowd. |
| `j60` | Junior Tour 60 | 32 | $250 | $1,100–2,400 | every 3 weeks, from age 13 | The same, one notch more serious: streamed on a fixed camera nobody is watching, a small stand along one court, national team tracksuits. |
| `j300` | Junior Tour 300 | 32 | $400 | $1,600–3,200 | 4 a year | The season is planned around these. A recognisable venue with a show court, actual seating, a scoreboard with names, a media wall, agents leaning on the fence. This is the closest a junior gets to the thing on television – and it still pays nothing. |

**Surfaces.** Hard (blue or green, most of the year), clay (red-brown European spring), grass (six
weeks, English, damp). Surface is a strategic season block, not decoration – see the table in §2.

## 7. The look of the build

The art must sit inside a specific dark UI. These values are the real ones, from `src/style.css`.

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
progress bars, true circles only on square elements (avatars, dots). Dense numeric tables are the
main event on most screens.

**What this means for art.** Every painting is viewed as a bright rectangle inside a dark navy page.
So:
- keep the subject's value range **higher** than the UI around it – the art is the light source;
- avoid navy-dominant backgrounds, they dissolve into the page;
- warm light (late afternoon, sodium lamps, low sun) reads well against the cool UI and is already
  the set's signature;
- lime `#d9f24f` belongs to the interface. Do not paint large lime objects – a ball is fine, a lime
  wall competes with the buttons.

## 8. The art that already exists

**Full paintings** – `public/images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp`
512px longest side, WebP q82, 35–79 KB each. `{stage}` is `jun|young|teen|adult`, `{emotion}` is
`norm|happy|sad|serious|tired|injury`. All 24 exist. These are the big Kid-screen / Home portraits.

**Finale paintings** – the same, with a legacy `-fs8` suffix
(`...-{stage}-{emotion}-fs8.webp`), for `happy|serious|sad` only. These are what the tournament result
splash shows. The suffix is a historical filename artefact from the pngquant era and means nothing
about quality.

**Header crops** – `public/avatars/{stage}-{emotion}.webp`, 256px, 11–20 KB. Tight face/shoulders
crop of the same painting. No `adult` crop exists yet, so `adult` falls back to `teen`.

**Style of the existing set.** Painterly semi-realistic illustration, close to high-end anime-adjacent
digital painting: soft brushwork, warm rim light, shallow depth of field, richly detailed backgrounds
carrying the story (a scoreboard with the match score on it, a banner with a slogan, other girls
lining up, a pink backpack on the bench). Faces are expressive and specific, never doll-like. The
camera is close – waist-up or tighter for emotion frames, wider for celebrations.

**The emotion set, and what each frame must carry:**

| Emotion | When the game shows it | What it must read as |
|---|---|---|
| `norm` | default, healthy, nothing recent | composed, mid-effort, unremarkable – this is the most-seen frame |
| `happy` | she won a match or a title **this week** | earned joy at the scale of the tier. A club trophy, not a Slam |
| `serious` | runner-up, a local-round loss, or condition below 60 | focused and contained. NOT sad – this is the runner-up frame too |
| `sad` | a real loss, not softened | private disappointment. Alone, or turned away. Never theatrical |
| `tired` | condition below 40 | end of a long week: heavy shoulders, damp hair, a towel |
| `injury` | an active injury | strapping, ice, a physio table, sitting out. Not gore |

Note `serious` does double duty as the **runner-up** frame – there is no dedicated silver artwork
(a programmatic gold-to-silver desaturation was tried and looked patchy), so the losing finalist gets
`serious` plus a silver-styled card frame in CSS. If you make one dedicated runner-up painting, that
is the highest-value single asset on this list.

## 9. What the art must NEVER show

1. **Real players.** No real name, likeness or surname – on a scoreboard, a draw sheet, an order of
   play, a banner, a shirt, anywhere. *The shipped set currently breaks this: one adult frame has
   "L. SVITOLINA" on the scoreboard. Regenerating that frame is a real to-do.*
2. **Real tours, federations or sanctioning bodies.** No WTA, ATP, ITF, no Grand Slam names or their
   visual identities. *The same adult frame reads "WTA 1000" on the board – also a to-do.* Invented
   equivalents only; the in-game tiers are called Local Open, Regional Championship, National Series,
   Junior Tour 30/60/300, and those are safe to letter into a scene.
3. **Real brands.** No swooshes, stripes, crocodiles, or any recognisable logo on kit, bags, banners
   or courts. *Several shipped frames carry brand-like marks on the kit; treat those frames as
   pending replacement, not as reference.* Blank kit, or the game's own invented marks.
4. **Any sexualisation of a minor.** She is 14 through most of the game and a child before that. No
   posing for the viewer, no camera interest in the body, no adult styling, no cropping that frames
   anything but sport and face. Sportswear as sportswear. This one is absolute and no brief
   overrides it.
5. **Glamour the economics forbid.** No private jets, no sports cars, no designer luggage, no
   sponsor-drenched pro kit in the junior bands, no packed stadium below the top tier, no cash. The
   family is spending $300–400k and earning nothing. A frame that says otherwise sells the fantasy
   the whole game exists to argue with.
6. **Heightened misery.** No tears streaming in the rain, no injury as body horror, no parental
   shouting. Understatement always.
7. **Adult later-life content shown gratuitously.** The `adult` band includes a wedding, a funeral, a
   pregnancy and a retirement. Play them straight, domestic and quiet.

## 10. Prompt fragments

Paste the **style preamble** first, then one asset block. They are written for image generators but
read fine as a brief for a human illustrator.

### Style preamble (always include)

```
Painterly semi-realistic digital illustration, high-end anime-adjacent rendering with soft
visible brushwork. Warm natural light (late afternoon or low sun), cool shadows, shallow depth
of field. Expressive specific face, not doll-like. Rich storytelling background detail kept
soft behind the subject. Square 1:1 composition. Value range kept bright: this image is viewed
inside a dark navy interface. No text overlays except signage described below. No logos, no
brand marks, no real-world tour or federation names, no real player names. Blank unbranded
sportswear.
```

### Avatars by age band

```
[jun]  A girl of about nine on a municipal tennis court, hair tied back, mismatched
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

Honest gaps, so nobody assumes an answer is in here:

- **Her exact face.** There is no character sheet, no turnaround, no reference of her from multiple
  angles. Consistency across the shipped set comes from the frames themselves – use them as the
  reference, and expect drift.
- **The other 199 juniors.** No art exists for any of them and no rival portrait system is specified.
  Their nations and names are generated; their faces are not.
- **The parent.** Never designed. Age, gender and appearance are undecided by intent (the player
  chooses a background, not a body).
- **The country.** The family's nation is a player choice at onboarding, so no single national
  setting is canon. Draw the venue, not the flag.
- **Motion.** No animation, camera-move or shot-length conventions exist yet; the match view is a
  schematic top-down court, not video.
- **The runner-up problem.** Whether the fix is a dedicated painting per band or a treatment of the
  existing `serious` frame is an open design question.
- **Later-life staging.** The wedding, funeral, graduation and pregnancy frames exist as art but have
  no scene brief, and the game does not yet reach them.
