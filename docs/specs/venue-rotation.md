# Venue art: the anti-repeat rotation (04.08.2026, `feat/adult-venue-art`)

> **Shipped.** `src/art/venues.ts` rule 3. Guards: `tests/art/venue-rotation.test.ts` (new),
> `tests/redesign-home.test.ts` "the venue paintings", `tests/art-placeholders.test.ts`. Every guard
> in this spec was mutation-verified – broken on purpose and watched go red – before it was believed.

## What changed and why

The owner generated 42 adult venue masters (backlog #86: *"venue art stops at j30, ten adult rungs
show a junior photograph"*) and asked for one behavioural change to ship with them:

> «можно переименовать в clay-2 и использовать рандомно, чтобы как можно меньше повторов в ленте
> было. Например, если идет два w15 clay подряд, то чтобы они точно разные картинки показывали, если
> именно clay не хватает – то показывать venue. И вообще разбавлять ленту артами, должны быть
> использованы все.»

Three asks, and they are the acceptance criteria:

1. two events of the same tier AND surface in a row show **different** pictures;
2. when the surface's own courts run short, the tier's **surface-neutral** establishing shot covers
   the gap rather than a repeat;
3. **every master that ships is reachable** – no file in the download that nothing can request.

## The constraint that outranks all three

`src/art/venues.ts` rule 1: **a tournament's photograph is STABLE FOREVER.** It may not change
between two renders, two reloads or two replays of the same career, and it must be the same on all
five surfaces that draw a card (Home, Season, Calendar, Money, TournamentFlow).

That is in direct tension with ask 1, because "no repeats in a row" is a statement about
**neighbouring** events and the picker sees one event at a time. The resolution is a **stable
ordinal**, not state: an event's position in its own tier's chronological sequence is a fixed,
replayable fact, so the pick stays a pure function of `(tier, surface, eventId, seed)` while still
being aware of its neighbours.

```
ring   = venueVariants(tier, surface)          // the ladder's courts, then the tier's venue frames
offset = floor(rngFromSeed(`${seed}:venue:${tier}:${surface}`)() * ring.length)
stem   = ring[(venueOrdinal(tier, eventId, seed) + offset) % ring.length]
```

Consecutive events of one tier have ordinals **exactly one apart**, so they land on different rungs
of the ring for any ring of two or more. That is ask 1, by construction. Walking the ring spends
every court before it reaches a gate – that is ask 2. And a cycle visits every member – ask 3.

### Where the ordinal comes from

`world.season` is dealt one 52-week block at a time by
`buildSeason(`${seed}:s${block}`, block * SEASON_CHUNK, SEASON_CHUNK, background)` (`ensureSeason`),
and `buildSeason` is a pure function of the seed. So the UI can reproduce the block and count:

```
venueOrdinal(tier, eventId, seed) =
    (events of `tier` in every EARLIER block)  +  (events of `tier` in this block, before this week)
```

memoised per `(seed, block)`. Measured cost of one block: **0.161 ms**; a career touches eight.

Three properties are worth stating because each of them was a bug at some point in the build:

- **Count the earlier blocks, do not multiply by the block index.** Block 0 is SHORT –
  `MIN_FIRST_EVENT_WEEK` floors the first placement so no event opens already-closed. `block *
  weeks.length` therefore jumps the seam: `slam` stepped `0-w34` → `1-w54` by **two**, and the two
  events either side of the join showed the same photograph. Found by the ordinal test, not by eye.
- **The ordinal is counted in the CALENDAR, never in the list on screen.** `snapshot.upcoming` is
  filtered to `week > world.week`, so a list position shrinks as the career advances and the same
  tournament would repaint itself every week. Guarded directly.
- **The borrower is counted in its OWN sequence.** A W75 event takes its ordinal from the W75
  calendar even though its frames are W100's, so two consecutive W75 clay events differ. Counting in
  the lender's sequence would have made the rotation follow a calendar the event is not in.

## The measurement that chose the design

The obvious first answer needs no calendar at all – rotate by the event's week, `week %
ring.length`. It was measured before it was rejected. Corpus: 20 seeds × 8 seasons of real
`buildSeason` calendars, **14,112** pairs of events adjacent in a tier's own sequence and on the
same surface (rings of two or more only).

| ordinal | adjacent same-(tier, surface) pairs that REPEAT |
|---|---|
| `week % ring.length` | **4,765 – 33.8 %** |
| tier-sequence index (shipped) | **0 – 0.00 %** |

33.8 % is no better than the coin flip it was meant to replace, and the reason is structural rather
than unlucky: event gaps are not arbitrary. A dense rung runs every ~2 weeks, half the rings are two
frames long, and an anchored rung (`wta250` … `slam`) repeats a FIXED week offset every year – so
the gap is a multiple of the ring length far more often than chance. `local/hard` alone contributed
822 repeats, `wta1000/hard` 620.

The 33.8 % figure is kept as a live test (`a week-derived ordinal would NOT do`), so the number can be
re-run and a future simplification back to the week has to walk past it.

## What the ring is, and why the establishing shots are always in it

`venueCandidates` (rule 2's ladder – exact tier+surface, else this tier's neutral shot, else the
nearest LOWER tier on the right surface) is unchanged and still decides what a card is **allowed**
to show. `venueVariants` is a separate function that appends the tier's own `-venue-` frames as the
ring's tail. Two functions on purpose: the ladder is about CORRECTNESS, the ring is about VARIETY,
and keeping them apart means rule 2's pins do not move when rule 3 changes.

The neutral frames are in the ring even when the surface already has two courts, and that is what
makes ask 3 true: every adult tier paints all three surfaces, so an establishing shot outside its
own tier's ring would be a file **nothing could ever request**. A tier with one court and two venue
frames therefore shows the court one lap in three. That is the owner's «разбавлять ленту артами»;
the cure for wanting the court more often is a second court master, not a weighting.

A tier with no establishing shot rotates its courts and nothing else – it may not borrow another
tier's gate, because that frame would promise the wrong SCALE.

## Randomness

One draw, on a purpose-scoped sub-stream keyed by the rung and the surface –
`rngFromSeed(`${seed}:venue:${tier}:${surface}`)`. **Zero MAIN-stream draws**, re-derived at the call
site, persisting nothing, nothing inside the tick; the frozen capture cannot move. It replaces the
per-event draw that was there before, which had the same properties. Its job is to start two careers
at different rungs of the same ring, and to stop two rungs that share a borrowed set (W75 and W100)
from walking it in step.

## Acceptance – and the honest exceptions

Green:

- 0 repeats over 20 careers × 8 seasons, every pair checked (`checked > 10000`).
- every one of the 68 stems reachable structurally, and 66 of them actually shown by 30 real careers.
- the same career rendered twice picks the identical photograph for every event; an event keeps its
  photograph as 40 weeks pass under it; ten calls give one answer.

Three exceptions, each pinned **by name** so it cannot widen quietly, and each registered in
`docs/art-placeholders.md`:

1. **Six (tier, surface) pairs have one frame and therefore must repeat**: `local/clay`,
   `local/grass`, `regional/clay`, `regional/grass`, `slam/clay`, `slam/grass`. `local` and
   `regional` ship no establishing shot at all to fall back on. Art gap, not a picker decision.
2. **`wta1000-grass-1` / `-2` are art the simulation cannot ask for.** `wta1000` is anchored –
   `anchorWeeks: [5, 8, 12, 18, 31, 37, 41, 45]` – and an anchored event takes its block's dominant
   surface. None of those weeks is inside the grass window (25–30), so the calendar never schedules a
   WTA 1000 on grass. Not fixable in the art layer; inventing one would be a lie about the tour.
3. **W15 and W35 are the same four photographs.** The owner's unnumbered spares (`w15-clay.webp` →
   `w15-clay-2`, and the grass/hard/venue equivalents) are byte-identical to the whole W35 set.
   Nothing repeats inside one rung – W15's ring holds five distinct pictures – but a W15 card and a
   W35 card can show the same frame. Four real W35 masters clear it. (It was three rungs while W50
   borrowed W35; W50's own art landed the same evening.)

## W50 arrived mid-wave

The rung was wired as a BORROWER (`w50` → `w35`, nearest populated rung) with three `absent` rows in
`docs/art-placeholders.md`, exactly as `w75` still is. At 19:01 the same evening the owner dropped
five raw `.jpg` masters – `w50-{clay,grass,hard}-1`, `w50-venue-{1,2}` – straight into
`public/images/fields/`, next to the webp they belong with rather than into a `-jpeg` inbox.

`npm run art` handled that without a change: `scripts/optimize-art.mjs` encodes raw art found
anywhere under `public/` **in place** and moves the master out to gitignored `art-src/` (that door
was opened on 01.08 for exactly this reason – "a human replaces a file where he can see the file").
Five webp at q82, 59.7–78.7 KB each. The borrow entry and its registry rows came straight back out,
which is the loop this registry exists to close: written down when it was a debt, deleted the hour it
stopped being one.

**W75 is the only adult rung still borrowing.**

## Weight

Measured with `npm run build` on the branch base and again on the finished branch:

| | entries | precache |
|---|---|---|
| before (21 masters) | 107 | 2354.06 KiB |
| after (63 masters) | 107 | 2357.32 KiB |

**+3.26 KiB, and none of it is a picture.** The delta is `dist/assets/index-*.js` going 419.12 kB →
422.46 kB – this module's own code. `vite.config` carries `globIgnores: ['**/images/**']` and
`/images/*.webp` is a CacheFirst RUNTIME route, so a field master is fetched if and only if a
component asks for its URL; `grep -c images/fields dist/sw.js` is **0**. The 42 new files add
3,023,618 bytes (~2.88 MiB) to `dist/` and **0 bytes to every user's install**.

Nothing in `src/art/preload.ts` warms venue art, and nothing should. A card's own `<img src>` is the
request, and the rotation means a career sees a fraction of the set – the preloader's standing rule
("warm every face a surface can request, and nothing else") would be violated by warming a ring the
career will walk two rungs of. It stays as it is.
