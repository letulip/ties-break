---
type: plan
status: current
area: testing
canonical: true
last-reviewed: 2026-08-08
---

# The e2e fixture engine


## Current truth

- **Five committed career states** – `fresh` (w0) · `junior` (w120) · `pro` (w412, inside the sponsor
  window) · `broke` (one week short of the bankruptcy latch) · `ending` (past the fork at nineteen).
  288 KiB in total, written by the shipped `saveCodec` so a fixture can never disagree with what the
  product reads.
- **Found, not forced.** Every state is reached by walking a real career under a real policy and
  stopping when the engine says so – `broke` is `bankruptcyGraceWeeks - 1`, not "week 88". A fixture
  that could not have happened in play would test nothing.
- **`tests/e2e-fixtures.test.ts` is the rot alarm**, on the PR gate: each fixture loads through BOTH
  doors (export file and database), its manifest facts are re-derived, and one assertion **goes red
  deliberately on the next schema bump** – otherwise a stale fixture would pass everything else and
  the e2e layer would silently be testing a migrated old save.
- **Regenerate with `npm run e2e:fixtures`** (~4 s, byte-identical across runs).
- **This is not the golden-save corpus.** `tests/fixtures/saves/` is one save per schema version, for
  ever, proving *migrations work*. This is five states at the current version, regenerated rather than
  migrated, providing *somewhere for a browser to start*. Neither can do the other's job.
**This is the build of §3 of `docs/plans/playwright.md`** – the load-bearing idea of the whole
Playwright integration: *a test starts at week 412 instead of clicking through 412 weeks.* Nothing
here needs a browser, and none of it depends on the harness; it is a node tool, five binaries, a
manifest and a test.

```bash
npm run e2e:fixtures                 # regenerate all five (~4 s, byte-identical every time)
npm run e2e:fixtures -- --only pro   # one of them; the other four keep their manifest rows
npm run e2e:fixtures -- --budget 40  # how many seeds a search may try before it gives up
```

| file | what it is |
|---|---|
| `tools/e2e-fixtures.ts` | the generator, and the reader the harness and the test both come through |
| `e2e/fixtures/*.tsave` | five career saves in the app's own export format |
| `e2e/fixtures/manifest.json` | seed, week, schema version and the facts a spec may assert on |
| `tests/e2e-fixtures.test.ts` | the rot alarm, in the `unit` project, on the PR gate |

## The five

Generated 08.08.2026 at schema **v43**. Every one was found on the FIRST seed tried – these are
ordinary careers, not lottery tickets.

| fixture | seed | week | age | funds | rank | size | what it is for |
|---|---|---|---|---|---|---|---|
| `fresh` | `e2e-fresh-0` | 0 | 13 | $25,000 | 120 | 23.4 KiB | the boot path, onboarding, the empty screens |
| `junior` | `e2e-junior-0` | 120 | 15 | $8,085 | 59 | 54.6 KiB | first ranking earned – ladder, standings, a feed with something in it |
| `pro` | `e2e-pro-0` | 412 | 21 | $102,448 | 83 | 77.0 KiB | eight seasons in, **inside the sponsor window with two unopened letters**, ledgers full |
| `broke` | `e2e-broke-0` | 88 | 15 | **-$461** | 59 | 51.8 KiB | eleven weeks under water – one week short of the bankruptcy latch |
| `ending` | `e2e-ending-0` | 282 | 19 | $66,989 | 95 | 74.4 KiB | past the fork at nineteen, racket down, career read-only |

**281 KiB of saves** (288 KiB with the manifest), the largest single file 77 KiB. That is not a nuisance and there is no
trade to propose: for comparison, the golden-save corpus these sit next to is **9.8 MB** of
uncompressed JSON, and `v43.json` alone is 372 KB – nearly five times the week-412 fixture, because
these are gzipped by the product's own codec. If the set ever does grow (more fixtures, a bigger
world), the lever to reach for first is fewer fixtures rather than smaller ones: a fixture that has
been trimmed to fit is no longer a career the app could have written.

`fresh` reads **age 13** and that is correct, not an off-by-one: `kidAgeExact` says a January girl is
14.0 at week 0 and a June girl (the default birth month) is 13.5. The band is 14; her birthday has
not come round yet.

## Two corpora, two jobs – do not confuse them

`tests/fixtures/saves/vN.json` already existed and looks superficially similar. It is a different
thing and the difference is worth stating, because the wrong instinct (fold them together, or
migrate these instead of regenerating them) breaks both.

| | `tests/fixtures/saves/` – the golden corpus | `e2e/fixtures/` – this set |
|---|---|---|
| **question it answers** | does every historical save still load? | where does a browser test start? |
| **one per** | schema version (v0 … v43, all of them, for ever) | career STATE (five, at the current version) |
| **format** | raw world JSON, no envelope | the app's own export file: envelope + gzip + SHA-256 |
| **when the schema moves** | a NEW file is added; old ones are never touched | all five are REGENERATED; the old bytes are replaced |
| **what it must contain** | shapes nobody writes any more | only shapes the app writes today |
| **enforced by** | `tests/goldenSaves.test.ts` (one fixture per version) | `tests/e2e-fixtures.test.ts` (facts still hold, version is current) |

The golden corpus proves **migrations** work. This set provides **states to test against**. A golden
save has no funds or ranking worth asserting on; a fixture at the current version proves nothing
about v12. Keep both.

## How a fixture is made – and the rule it obeys

The generator drives the **real engine** headlessly: `createWorld`, then the shared career loop
`stepCareerWeek` from `tools/econ-bench.ts` (the same loop the econ, endings and sponsor benches use,
so the world evolution is defined in exactly one place), then `encodeExportFile` from
`src/engine/saveCodec.ts`. Nothing re-implements the save format, so a fixture cannot disagree with
what the product reads – and before any file is written the generator decodes its own bytes through
`decodeExportFile`, the app's untrusted-input door, and checks the facts survived the round trip.

**Fixtures are found, not forced.** No world is ever poked into shape. Where a state is rare the
generator enumerates seeds (`e2e-<name>-0`, `-1`, …) and plays each career until one genuinely
arrives, then records the seed. A state nobody can reach in play is a state no test should assert
on. Two consequences worth spelling out:

- **`broke` is a WALK, not a target week.** The recipe steps week by week under the reckless
  ("grinder") policy on the tightest corridor – an 8k working family paying for a middle coach, the
  cell the econ bench measures going under – and stops the first week the debt spell reaches
  `ENDINGS.bankruptcyGraceWeeks - 1`. Every spell that ever reaches the latch passes through that
  week, so the state is genuinely on the way to bankruptcy rather than staged next to it.
- **`ending` is an ANSWER, not a flag.** The fork at nineteen is a question the engine raises on her
  birthday week; the recipe answers `stop` through `answerFork`, which is one of the three taps a
  player has. The career then refuses every command (`guardNotEnded`), which is exactly the
  read-only state the app is in after the epilogue.

The one thing the generator does choose is `careerId` – and only because the engine does not own it
either: the worker mints one from `Date.now()` outside the deterministic engine, so the fixtures pin
`c-e2e-<name>` and the manifest records it.

### RNG discipline

The generator takes **no MAIN draw of its own** and cannot perturb the frozen capture. It hands the
engine the world's own persisted position, `resumeMain(world.rngMain)` – the serializer rule written
out in `tools/demo-save.ts`. A raw `rngFromSeed` tap would produce the same career and ship a
week-412 save claiming zero draws spent, so the app would resume its main stream from the beginning
and quietly replay eight seasons of dice. The rot alarm checks the s/n algebra and the plausibility
bound on every fixture, which is what would catch that.

The only other randomness is the engine's own purpose-scoped sub-streams: `seed:surname` for the
kid's family name (the same door onboarding's dice use) and `seed:e2e-given-name` for her first
name. The seed SEARCH is a deterministic enumeration, not a roll.

### Names

Every person in a fixture is named out of the shipped pools in `src/engine/season/cohort.ts`
(44 given names × 210 surnames, curated so that no real player's surname is constructible). The
generator never invents a name, and the rot alarm asserts it: kid and cohort names must be pool
members.

⚠ **One inherited finding, and it is upstream of this work.** The adult rungs are labelled
`WTA 125` / `250` / `500` / `1000` in `TIER_SHORT` (`season/calendar.ts`), a deliberate and argued
choice recorded there – so the feed quotes them and they reach the save bytes. Four fixtures
therefore contain the string "WTA". The rot alarm allows exactly those shipped labels and fails on
any OTHER organisation string, which is the part a fixture could realistically get wrong. If the
trademark rule is ever tightened to cover the tier labels, it is a change to the calendar and the
fixtures inherit the fix for free on the next regeneration.

## What the harness does with them

The fixture file is the **export envelope**: `MAGIC(8) | schemaVersion u32 BE | sha256(32) | gzip(JSON)`.
That single artefact serves both doors:

- **the file round trip** – it is byte-for-byte what "Export save" writes and what the `.tsave` file
  input accepts, so an import spec can hand it straight to `setInputFiles`;
- **the IndexedDB seed** – `splitEnvelope(bytes)` cuts the header off and hands back the `payload`
  and `checksum` a `saves` record holds. It is a SLICE, not a re-encode: `compressWorld` produced
  exactly those bytes and `decompressWorld` verifies that checksum against them on read, so a
  seeded record is indistinguishable from one the app wrote.

The record the harness writes (see `src/db/saves.ts` for the shape) needs `slot`, `careerId`,
`savedAt`, `week`, `seed`, `bytes`, `kidName`, `country`, `revision`, `checksum`, `payload` – every
one of which is in the manifest or the envelope. The manifest already names the slot
(`auto:c-e2e-<name>:a`), and a `careers` row must be written in the same transaction or the career
list will not show it.

Import the reader from the generator rather than re-deriving any of it:

```ts
import { loadManifest, readFixtureBytes, splitEnvelope } from '../tools/e2e-fixtures'
```

## The rot alarm

`tests/e2e-fixtures.test.ts`, 33 assertions, ~0.6 s (1.4 s with a whole other suite running beside
it), in the `unit` project – so it runs on the PR gate for free rather than waiting for a nightly
browser job. For every fixture it:

1. checks the file is unedited – size and a SHA-256 over the **whole** envelope (the envelope's own
   checksum covers only the payload, so this catches a re-headered or truncated file too);
2. loads it through `decodeExportFile` – the real guard chain and the real migration ladder;
3. re-derives the entire fact sheet with `factsOf`, the same function that wrote the manifest, and
   compares. This is the alarm: any drift between what a spec was told and what the save holds fails
   here;
4. loads it AGAIN through `decompressWorld` – the **database** door, which is a different function
   with a different guard set and is the one a seeded spec actually comes through. Two doors, two
   trust levels (`saveCodec.ts`'s own header); the file door being green does not prove the DB one is;
5. checks the MAIN position is one the career could have reached;
6. checks every name came from the pools and no organisation string leaked in;
7. asserts each fixture is still the STATE its name promises, against the engine's own constants –
   `broke` is `ENDINGS.bankruptcyGraceWeeks - 1` weeks under water, not "11"; `ending` is past
   `ENDINGS.forkAgeYears`. A balance change that moves a state out from under a fixture is caught as
   well as a stale binary.

Then one assertion for the whole set: **the manifest's schema version is the current one.** It goes
red on the next `SAVE_SCHEMA_VERSION` bump, and it is meant to. Everything above would still pass on
a fixture a version behind – that is what the migration ladder is for – and passing is the problem,
because the e2e layer would silently be testing *an old save, migrated* rather than *the state the
app writes today*. Save schema changes are already a three-part move (`CLAUDE.md` invariant 3); this
makes the fixture set the fourth part, and it costs one command.

**Mutation-verified**, as this repo asks: tampering with a manifest fact fails (1 test), flipping one
bit in a `.tsave` fails (4 tests), a stale schema version fails (1 test). All three were run, and the
set regenerates byte-identically afterwards.

## Regenerating

```bash
npm run e2e:fixtures
```

Deterministic: same seeds, same careers, same bytes, verified by checksum across runs. Run it after
any `SAVE_SCHEMA_VERSION` bump, and after any balance change big enough to move a fixture's facts –
the rot alarm will tell you which. If a recipe can no longer find its state inside the seed budget,
the generator refuses to write anything and says so. **Raise `--budget`, or change the recipe and
record why here – never hand-edit a world to make the state exist.**

## The rule that outranks all of this

⚠ **The owner's own save is never a fixture.** It may be read locally for diagnosis and must never be
committed, derived from or copied. Every byte in `e2e/fixtures/` came out of this generator.
