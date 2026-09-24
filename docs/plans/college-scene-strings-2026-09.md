---
type: plan
status: current
area: college-scene
last-reviewed: 2026-09-24
---

# The college scene – every new string, for his pass

Three strings, and that is the whole of what this wave adds to the screen. The spec is
[the-college-scene-2026-09.md](../specs/the-college-scene-2026-09.md) §7; the wave's rulings are
[college-scene-rulings-2026-09.md](college-scene-rulings-2026-09.md).

⚠ THE COUNT LIVES IN THE PIN AND NOWHERE IN THIS PROSE – wave 9's finding verbatim: a number a
document states about itself survives a full gate, because no test reads it.
`tests/college-scene-strings-roundtrip.test.ts` asserts the row count, the status cell and every
row's text against the shipped source, character for character, and goes red from either side.

⚠ AND TWO OF THE THREE ARE TEMPLATES, so the `text` column carries the template's OWN text with the
interpolation in it – the wave-12 table's convention, for its reason: `${who}` is where her name
lands on screen, and `${year.index}` is where the year's number does.

⚠⚠ THREE THINGS THIS WAVE DID **NOT** ADD, stated so his pass is not looking for them: the bracket
on the year card is shipped copy from 22.08 and not one word of it moved (spec §3); the album's
`graduated` note, caption and line are his corpus's own four voices, untouched (spec §4.1); and no
label, tab or button anywhere changed (invariant 4).

## The album – the graduate's championship record

One template on the `graduated` sheet's checklist, forking on whether she won it.

| id | home | text | status |
| --- | --- | --- | --- |
| C1 | `src/engine/world/albumBook.ts` | Year ${year.index}, ${COLLEGE_LEAGUE.label}: ${wonTheLeague(run) ? 'Won it' : `Went out in the ${leagueExitLabel(run)}`} | `DRAFT` |

What it renders, on a career that won its first year and went out in the quarterfinal of its second –
the two shapes, and the pin reconstructs both from the engine's own constants rather than trusting
this paragraph:

- «Year 1, the College League: Won it»
- «Year 2, the College League: Went out in the Quarterfinal»

The only words this wave invented here are `Year `, the comma, the colon, `Won it` and – his Q3
ruling of 24.09, option B – `Went out in the `. The
competition is named by `COLLEGE_LEAGUE.label` and the round by `leagueExitLabel`, so the album and
the year card cannot come to say different things about one championship – and `Won it` is the word
the card's own fact pair already prints for it.

⚠ HIS OPEN QUESTION ON THIS ONE (question 3 of the wave's report): the exit shape is the bare round
name, exactly as the year card prints it. Read cold beside «Won it», a bare «Quarterfinal» can be
heard as «she reached the quarterfinal» rather than «she went out there». The engine's other sentence
for this fact (`collegeLeagueLine`) spells it «she went out in the Quarterfinal». Either is one edit
and neither grades her.

## The booth – a student cabinet in the line

Two lines, the third arm of `boothLineageLines`, reached only where the booth was already licensed to
speak of the line at all (ruling D – `lineageLicensed` is untouched).

| id | home | text | status |
| --- | --- | --- | --- |
| C2 | `src/viz/commentary.ts` | That surname won a student championship before it ever reached this stage. ${who} is the second of them out here. | `DRAFT` |
| C3 | `src/viz/commentary.ts` | ${who} is not the first in her family to walk out here. Her mother came through the college game, and won it on the way. | `DRAFT` |

⚠ NEITHER NAMES THE MOTHER – the TITLED pool's own rule, and for its reason: the packet carries no
first name, so reaching for one would invent a fact. ⚠ AND NEITHER CLAIMS A PROFESSIONAL STAGE: the
win each of them names is the STUDENT one, in as many words, which is the whole reason the count
crossed the wire as its own field instead of joining `titles`.
