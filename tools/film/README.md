# `tools/film` – No good ending. No bad ending.

A 828x1792 devlog clip: all eight career endings, each one latched by the shipped resolver on a real
career, shown on the real epilogue.

```bash
# the dev server has to be up (.claude/launch.json -> tb-endfilm, port 5845)
npx vite-node tools/film/coin-search.ts                    # whose 2% / 1% coin lands – no walking
INDICES=6,7,8,15 npx vite-node tools/film/door-scan.ts      # ...and whose door was open as well
I_PEAK=98 S_PEAK=11 FIXTURE_RUN=build OUT=/tmp/ending-fixtures npx vite-node tools/film/ending-fixtures.ts
node tools/film/record-endings.mjs   /tmp/endfilm /tmp/ending-fixtures   # ~3 min, 1656x3584 webm
node tools/film/assemble-endings.mjs /tmp/endfilm out/no-good-ending.mp4 public/music/theme.mp3 public/sounds/hit-3.mp3
node tools/film/provenance-endings.mjs /tmp/endfilm out/no-good-ending-provenance.md
```

| file | what it is |
| --- | --- |
| `ending-fixtures.ts` | walks real careers and lets the shipped resolvers end them; writes twelve saves |
| `coin-search.ts` | which (seed, door, season) coins land – a pure function, enumerated in ms |
| `door-scan.ts` | which careers had the door OPEN, which is the rare half |
| `install-ending.ts/.html` | puts a fixture on this origin's disk through the shipped codec + `adoptAutosave` |
| `EndingFilm.vue` + `endings-film.html/.ts` | the 828x1792 stage: caption lane, phone window, note |
| `record-endings.mjs` | installs, boots each career, navigates the real epilogue, holds |
| `assemble-endings.mjs` | cuts the holds to the scripted seconds, xfades, theme + one racket impact per movement |

## Nothing is tuned, and the two doors are CAST

`ENDINGS` is read and never written. `resolveLeaving` draws
`rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()` against 0.02 (peak) and 0.01 (fall), so
whether a given career's coin lands is a **fact about that career** – enumerable without walking
anything. `coin-search.ts` lists the landing pairs; `door-scan.ts` then proves the door was open too.
Choosing which career to film by that is casting, and it is the only way to film a 1.72% event on
purpose without touching the 1.72%.

**The peak in the film is a natural latch**: `bench-wealthy-98` reached its twelfth wrap at age 25,
on the paid table, #3 in the world, and the engine latched it inside the tick.

## The two places state was PLACED

Both are in `out/no-good-ending-provenance.md` in full. In short: the fall's two season figures are
the owner's own (`#13`/4,008 → `#59`/1,584), written into that career's season table and then judged
by the shipped `fallLeavingDue`; and her four exit lines are QUOTED off the saves, because
`resolveLeaving` writes them into the diary and an ended career can never reach the news feed.

## Gotchas paid for in takes

- **Five fixtures shared one `careerId`.** The fall's pre-latch save and its four voices are copies of
  one career, so `adoptAutosave` – which keys its slot on `careerId` – had each install overwrite the
  last. The film booted one ended world five times while asking for five different ones. Every fixture
  is stamped `film-<name>` now.
- **A face is not loaded until something asks for it.** The stage opens with an empty caption lane, so
  `document.fonts.check('600 40px Sora')` answered false and the recorder refused a take whose type
  would have been correct the moment the first caption rendered. A hidden probe span keeps Sora
  requested from the first paint, which is what makes the check mean anything.
- **The last retirement offer is not a question.** `answerRetirement(world, false)` THROWS on a `final`
  offer (`LAST_OFFER_NOT_A_QUESTION`), so "ask for one more year, every time" has to mean every offer
  that still has a next one. A walk that did not know it died on the first long career.
- **The fall career takes its own door.** The walk comes back with the ending already latched, so the
  fixture winds the latch back (and removes the diary line it wrote) before placing the owner's rows
  and asking the same resolver again on the same coin.
- **A college ending never reaches the epilogue.** `showCollege` diverts while `collegeProgressOf` is
  non-null, and it is non-null for the whole four years – so the film shows the real college week,
  which is the honest screen for the one ending that resumes.
- **Never `pkill -f vite-node` on this machine.** Other sessions run benches out of other worktrees;
  match your own script's path instead.
