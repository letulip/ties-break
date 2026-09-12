import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { decodeExportFile, decompressWorld, sha256 } from '../src/engine/saveCodec'
import {
  SAVE_SCHEMA_VERSION,
  STARTING_FUNDS_CENTS,
  activeEpisode,
  advanceRefusal,
  answerFork,
  lifeLogOf,
  liveSoftBeat,
  loveEpisodesOf,
  maxMainDraws,
  pendingLifeBeat,
  schoolEndWeek,
  tickWeek,
  toSnapshot,
  FORK_UNHEARD_REFUSAL,
} from '../src/engine/world'
import { mainStateConsistent, resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { MOOD_WORD, SPIRIT_BANDS } from '../src/engine/spirit'
import { ENDINGS } from '../src/engine/ending'
import { isSponsorWindowWeek } from '../src/engine/offers'
import { FIRST_NAMES, SURNAMES } from '../src/engine/season/cohort'
import { TIER_SHORT } from '../src/engine/season/calendar'
import {
  careerIdFor,
  factsOf,
  FIXTURE_DIR,
  FIXTURE_NAMES,
  loadManifest,
  readFixtureBytes,
  slotFor,
  splitEnvelope,
  type FixtureEntry,
} from '../tools/e2e-fixtures'

// THE ROT ALARM for the Playwright fixture set (docs/plans/e2e-fixtures.md).
//
// The fixtures in e2e/fixtures/ are career saves a browser test boots into instead of clicking
// through four hundred weeks. They are BINARIES IN GIT, and the save schema moved four times in
// three days last week – so the one thing that can go wrong quietly is that a fixture stops being
// the career its manifest says it is. A stale fixture is a test that lies, and it lies in the
// slowest, least readable layer of the stack.
//
// So every claim the manifest makes is re-derived here, from the file, through the PRODUCT'S OWN
// reader – `decodeExportFile`, which is the untrusted-input door with the full guard chain and the
// real migration ladder behind it. Nothing in this file parses a save by hand. It runs on the PR
// gate with the rest of the unit project, in well under a second – and, unlike the browser suite, it
// runs in `npm run check` too, which is what makes it the right place for this alarm.
//
// ⚠ CORRECTED 12.09, MEASURED. That sentence used to end «rather than the nightly e2e job», and
// there is no nightly e2e job: `.github/workflows/ci.yml` is «CI (pull requests)», `on:
// pull_request`, and its e2e job runs `npm run test:e2e` unconditionally (:274), so the fixtures ARE
// covered before a merge. simulation.yml's Monday sim run is the only cron in the repo. What the
// browser suite is absent from is `npm run check`, the LOCAL pre-push gate, which excludes it on
// purpose (scripts/e2e.mjs's own header). So what this file buys is the LENGTH OF THE FEEDBACK LOOP –
// green on the builder's machine, red later in a browser – and never coverage that was missing.
//
// ⚠ NOT tests/goldenSaves.test.ts, AND THE DIFFERENCE IS THE POINT. The golden corpus is one raw
// world per schema version and it proves MIGRATIONS work – it must keep old shapes for ever, and its
// v19 file is deliberately ancient. These ten are playable STATES at the CURRENT version and they
// prove a browser has somewhere to start; when the schema moves they are regenerated, not migrated.
// Neither can do the other's job: a golden save has no funds worth asserting on, and a fixture at
// the current version proves nothing about v12.

const manifest = loadManifest()

/** The trademark rule (CLAUDE.md Style): tournament and organisation names are fictional, and real
 *  player surnames must not be constructible. A fixture inherits it from the engine that generated
 *  it – this is the check that the inheritance actually holds.
 *
 *  ⚠ RE-AIMED AND STRICTLY STRENGTHENED BY THE OWNER'S RENAME (18.08). It used to read *"`WTA nnn`
 *  IS EXPECTED AND IS NOT A LEAK"*, because `TIER_SHORT` spelled the four professional rungs
 *  "WTA 125" … "WTA 1000" while the five below them were already fictional – so the corpus
 *  legitimately carried a trademark and this scan had to exempt it. Those four are "World Tour
 *  125/250/500/1000" (short "WT125" … "WT1000") now, and with them the LAST licensed trademark
 *  string left the catalogue: a save this engine writes today should contain none at all.
 *
 *  The allowlist stays DERIVED from `TIER_SHORT` rather than emptied, and that is deliberate – it is
 *  the exemption's one legitimate source, so a rung that ever needs one again is covered by the
 *  table it is declared in instead of by a literal somebody has to remember to add here. What this
 *  test forbids is a fixture carrying an organisation string the shipped catalogue does not license –
 *  which is what a generator inventing its own names, or a stale binary from before a rename, would
 *  produce. */
const ALLOWED_TRADEMARK_STRINGS = new Set(Object.values(TIER_SHORT))
const TRADEMARK = /\b(?:ITF|WTA|ATP)\b/

function trademarkOffenders(json: string): string[] {
  // Every quoted string in the payload that names a tour, minus the shipped tier labels.
  const strings = json.match(/"(?:[^"\\]|\\.)*"/g) ?? []
  const offenders = new Set<string>()
  for (const quoted of strings) {
    if (!TRADEMARK.test(quoted)) continue
    const value = quoted.slice(1, -1)
    // A feed line quotes a label inside a sentence ("Travel to WTA 125"), so the test is whether
    // every trademark token in it belongs to a shipped label, not whether the whole string is one.
    const stripped = [...ALLOWED_TRADEMARK_STRINGS].reduce((s, label) => s.split(label).join(''), value)
    if (TRADEMARK.test(stripped)) offenders.add(value)
  }
  return [...offenders]
}

describe('e2e fixtures: the manifest and the files agree', () => {
  it('carries exactly the ten fixtures the plan asks for, in the registry\'s order', () => {
    expect(manifest.fixtures.map((f) => f.name)).toEqual([...FIXTURE_NAMES])
  })

  it('the trademark scan is looking at real text (positive control)', async () => {
    // Without this, `trademarkOffenders` returning [] would be indistinguishable from a regex that
    // never matches anything – the empty-set pass every scanner of this shape eventually rots into.
    //
    // ⚠ RE-AIMED BY THE OWNER'S RENAME (18.08), AND THE ARM MOVED BECAUSE THE OLD ARM STOPPED
    // EXISTING. Liveness used to be proved on `pro.tsave` itself: a played career quoted "WTA 250" in
    // its feed, so the scan had to both FIND that token and exempt it. The four professional rungs
    // are World Tour rungs now, so a fixture this engine writes carries no trademark at all – and a
    // corpus with nothing to find cannot tell a live scanner from a dead one. So liveness moves to a
    // PLANTED payload, which is the honest place for it: it exercises the string extractor and the
    // regex without needing the shipped corpus to contain a leak. The corpus is then held to the
    // stronger claim the rename earned – not "its trademarks are licensed" but "it has none".
    const planted = JSON.stringify({ events: [{ text: 'B. Karras won the WTA 250.' }] })
    expect(TRADEMARK.test(planted)).toBe(true)
    expect(trademarkOffenders(planted), 'the scan still finds a leak when there is one').toEqual([
      'B. Karras won the WTA 250.',
    ])
    // ⚠ AND THE PLANT IS THE FEED LINE THE OLD FIXTURES ACTUALLY CARRIED, not an invented one, so
    // this doubles as the regression pin for the rename: a stale binary generated before it goes red
    // on the fixtures below, and the sentence that would have made it go red is right here.
    const json = JSON.stringify(await decodeExportFile(readFixtureBytes('pro.tsave')))
    expect(TRADEMARK.test(json), 'no shipped label licenses a trademark any more').toBe(false)
    expect(trademarkOffenders(json)).toEqual([])
  })

  it(`is written at the current schema (v${SAVE_SCHEMA_VERSION}) – REGENERATE with \`npm run e2e:fixtures\` after a bump`, () => {
    // THE ALARM THAT GOES OFF ON A SCHEMA BUMP, and it is meant to. Everything below would still
    // pass on a fixture a version or two behind – that is exactly what the migration ladder is for –
    // and passing is the problem: the e2e layer would silently be testing "an old save, migrated"
    // instead of "the state the app writes today". Save schema changes are already a three-part move
    // (CLAUDE.md invariant 3); this makes the fixture set the fourth part, and it costs one command.
    expect(manifest.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const entry of manifest.fixtures) {
      expect(entry.schemaVersion, `${entry.name}.tsave was written at v${entry.schemaVersion}`).toBe(
        SAVE_SCHEMA_VERSION,
      )
    }
  })

  for (const entry of manifest.fixtures as FixtureEntry[]) {
    describe(entry.name, () => {
      it('is on disk, unedited, with the header the manifest describes', async () => {
        expect(existsSync(`${FIXTURE_DIR}${entry.file}`)).toBe(true)
        const bytes = readFixtureBytes(entry.file)
        expect(statSync(`${FIXTURE_DIR}${entry.file}`).size).toBe(entry.bytes)
        expect(bytes.byteLength).toBe(entry.bytes)
        // The envelope's own SHA-256 covers the payload; the manifest's covers the header too, so a
        // re-headered or truncated file is caught before anything tries to decode it.
        const digest = [...(await sha256(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
        expect(digest).toBe(entry.sha256)
        const envelope = splitEnvelope(bytes)
        expect(envelope.schemaVersion).toBe(entry.schemaVersion)
        expect(envelope.checksum.byteLength).toBe(32)
        expect(envelope.payload.byteLength).toBe(entry.payloadBytes)
      })

      it('loads through the real import door and still holds the facts its manifest claims', async () => {
        // decodeExportFile IS the app's import path: size cap, magic, declared version, checksum,
        // bounded inflation, the bounds walk, the declared schema's spine, then the migration ladder.
        const world = await decodeExportFile(readFixtureBytes(entry.file))

        expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
        expect(world.seed).toBe(entry.seed)
        expect(world.careerId).toBe(entry.careerId)
        expect(world.careerId).toBe(careerIdFor(entry.name))
        expect(entry.slot).toBe(slotFor(entry.name))
        expect(world.profile.kidName).toBe(entry.profile.kidName)
        expect(world.profile.kidLastName).toBe(entry.profile.kidLastName)
        expect(world.profile.country).toBe(entry.profile.country)
        expect(world.profile.background).toBe(entry.background)
        expect(world.profile.coachTier).toBe(entry.coachTier)

        // The whole fact sheet, re-derived by the same function that wrote it. This is the alarm:
        // any drift between what a spec was told and what the save holds fails here.
        expect(factsOf(world)).toEqual(entry.facts)
        expect(world.week).toBe(entry.facts.week)
      })

      it('loads through the DATABASE door too – the one the harness actually seeds', async () => {
        // TWO DOORS, TWO TRUST LEVELS (saveCodec.ts's own header). The test above uses the FILE
        // door; a fixture written into IndexedDB is read back through `decompressWorld`, which is a
        // different function with a different guard set. That is the path every seeded spec takes,
        // so it gets its own assertion rather than being assumed from the file door's green.
        const { payload, checksum } = splitEnvelope(readFixtureBytes(entry.file))
        const world = await decompressWorld(payload, checksum)
        expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
        expect(factsOf(world)).toEqual(entry.facts)
      })

      it('carries a MAIN stream position it could actually have reached', async () => {
        // v35's two halves, the same pair goldenSaves.test.ts checks: the s/n redundancy algebra
        // (the pair IS the checksum) and the plausibility bound from the weekly draw budget.
        //
        // ⚠ THIS IS THE TEST THAT CATCHES A GENERATOR TAKING A RAW `rngFromSeed` TAP. A fixture
        // built that way looks perfect – right week, right funds – and claims zero draws spent, so
        // the app resumes its main stream from the beginning and replays four hundred weeks of dice.
        // tools/e2e-fixtures.ts draws through `resumeMain(world.rngMain)` for exactly this reason.
        const world = await decodeExportFile(readFixtureBytes(entry.file))
        expect(mainStateConsistent(world.seed, world.rngMain)).toBe(true)
        expect(world.rngMain.n).toBeGreaterThanOrEqual(0)
        expect(world.rngMain.n).toBeLessThanOrEqual(maxMainDraws(world.week, world.cohort.length))
        // A career that has played weeks has spent draws; a week-0 one has not.
        expect(world.rngMain.n > 0).toBe(world.week > 0)
      })

      it('names only people the engine could have named', async () => {
        const world = await decodeExportFile(readFixtureBytes(entry.file))
        // The kid's name comes out of the shipped pools through the engine's own dice, never
        // invented by the generator – so no real player's surname is constructible from a fixture.
        expect(FIRST_NAMES).toContain(world.profile.kidName)
        expect(SURNAMES).toContain(world.profile.kidLastName)
        for (const player of world.cohort) {
          const [first, ...rest] = player.name.split(' ')
          expect(FIRST_NAMES, `cohort given name "${first}"`).toContain(first)
          expect(SURNAMES, `cohort surname "${rest.join(' ')}"`).toContain(rest.join(' '))
        }
        expect(trademarkOffenders(JSON.stringify(world))).toEqual([])
      })
    })
  }
})

// --- and that each one is still the STATE its name promises ---------------------------------------
//
// The block above proves a fixture matches its own manifest, which a fixture regenerated from a
// broken recipe would also do. These assertions are tied to the ENGINE's constants instead, so a
// balance change that moves a state out from under a fixture is caught as well as a stale binary.

describe('e2e fixtures: each is the state its name promises', () => {
  const facts = (name: string) => manifest.fixtures.find((f) => f.name === name)!.facts
  const entry = (name: string) => manifest.fixtures.find((f) => f.name === name)!

  it('fresh is week 0 with the background\'s starting funds and no ranking', () => {
    const f = facts('fresh')
    expect(f.week).toBe(0)
    expect(f.fundsCents).toBe(STARTING_FUNDS_CENTS[entry('fresh').background])
    expect(f.rankedDomestic).toBe(false)
    expect(f.rankedItf).toBe(false)
    expect(f.rankedWta).toBe(false)
    expect(f.seasonsPlayed).toBe(0)
    expect(f.endingType).toBeNull()
  })

  it('junior has earned a ranking and has seasons behind her', () => {
    const f = facts('junior')
    expect(f.week).toBeGreaterThan(52)
    // ⚠ A RANKING, WHICHEVER TABLE CARRIES IT (16.08) – the third and last place the corpus pinned
    // the DOMESTIC one, and this test's own name was always the wider claim. The junior-ladder wave
    // made the narrow version unsatisfiable: at week 120 only 46 careers in 120 hold domestic points
    // against 114 holding ITF ones. ⚠ That is a rolling 52-week window aging out, NOT a ladder she
    // skipped – P6 measured 90 of 90 earning a domestic ranking at 13.6, first of the three, every
    // time. tools/e2e-fixtures.ts's recipe carries the measurement and the correction it needed.
    expect(f.rankedDomestic || f.rankedItf || f.rankedWta).toBe(true)
    expect(f.domesticPoints + f.itfPoints + f.wtaPoints).toBeGreaterThan(0)
    expect(f.seasonsPlayed).toBeGreaterThanOrEqual(2)
    expect(f.endingType).toBeNull()
  })

  it('pro is deep in a professional career, inside the sponsor window, with paper on the table', () => {
    const f = facts('pro')
    expect(f.week).toBeGreaterThanOrEqual(400)
    expect(f.endingType).toBeNull()
    // Not the junior table: at twenty-one her ITF points are years gone. Three tables, three
    // currencies – a spec that asks the wrong one gets a career that reads as unranked.
    expect(f.rankedWta).toBe(true)
    expect(f.wtaPoints).toBeGreaterThan(0)
    expect(f.inSponsorWindow).toBe(true)
    expect(isSponsorWindowWeek(f.week)).toBe(true)
    expect(f.openKitLetters + (f.hasActiveKitDeal ? 1 : 0)).toBeGreaterThan(0)
    // "full ledgers": the finance ledger and the feed are both at their pruned length, which is what
    // a career this old looks like and what the money and news screens have to render.
    expect(f.financeWeeks).toBeGreaterThan(0)
    expect(f.feedEvents).toBeGreaterThan(0)
    expect(f.seasonsPlayed).toBeGreaterThanOrEqual(7)
  })

  // ⚠ THE TWO DEBT FIXTURES ARE CHECKED AGAINST EACH OTHER, NOT ONLY AGAINST THE CONSTANT, because
  // the thing that makes them two fixtures rather than one is the DISTANCE between them. `sinking`
  // exists so that a spec can advance a week and still have a career on the other side of it; a
  // regeneration that let it drift up against the latch would take that away while every assertion
  // written per-fixture still passed.
  it('sinking is under water with weeks in hand – advanceable, and not against the latch', () => {
    const f = facts('sinking')
    expect(f.fundsCents).toBeLessThan(0)
    expect(f.debtWeeks).toBe(Math.floor(ENDINGS.bankruptcyGraceWeeks / 2))
    // Room on BOTH sides: a spell already long enough to have a countdown worth printing, and at
    // least two weeks before anything latches, so one advance cannot end the career.
    expect(f.debtWeeks).toBeGreaterThan(1)
    expect(ENDINGS.bankruptcyGraceWeeks - f.debtWeeks).toBeGreaterThan(1)
    expect(f.debtWeeks).toBeLessThan(facts('broke').debtWeeks)
    expect(f.endingType).toBeNull()
  })

  it('broke is under water and exactly one week short of the bankruptcy latch', () => {
    const f = facts('broke')
    expect(f.fundsCents).toBeLessThan(0)
    // Tied to the engine's own constant, not to the number 11: if the grace window is ever retuned,
    // this fixture is no longer "one week short" and the alarm says so.
    expect(f.debtWeeks).toBe(ENDINGS.bankruptcyGraceWeeks - 1)
    expect(f.endingType).toBeNull()
  })

  it('ending is past the fork at nineteen, with the racket down', () => {
    const f = facts('ending')
    expect(f.endingType).toBe('stopped')
    // ⚠ 18.08 – THE AGE READING IS 18 HERE AND THE FIXTURE IS STILL PAST THE FORK. This career sits in
    // the very week she turns nineteen: the date clock reports the age at the week's MONDAY, and the
    // fork is raised on the birthday itself (`kidAgeThroughWeek`, engine/world/endings.ts §7c), so the
    // two legitimately differ for exactly this one week. It used to read 19 because the month clock
    // turned her age on the first Monday of her birth month, days before the birthday.
    //
    // So the claim is asserted on the thing it is about - she reached the fork and answered it - and
    // the age is bounded rather than dropped, so a fixture that regressed to seventeen still fails.
    expect(f.ageYears).toBeGreaterThanOrEqual(ENDINGS.forkAgeYears - 1)
    expect(f.endingType, 'and the fork was genuinely reached and answered').toBe('stopped')
  })

  it('unheard is parked on an unanswered life beat, with the fork open behind it', async () => {
    // ⚠ THE ONE ASSERTION IN THIS BLOCK THAT DECODES THE SAVE, and the reason is worth stating: the
    // state this fixture exists for is not in `FixtureFacts` at all. That sheet is one fixed shape
    // every fixture shares and every manifest row carries, so adding a `lifeLog` column to all seven
    // to describe one of them would rewrite six rows to say nothing – and the manifest's own bytes
    // are pinned by the specs above. So the claim is read off the WORLD, through the same import
    // door every test in this file uses.
    //
    // ⚠ AND IT IS TIED TO THE ENGINE'S OWN PREDICATES, never to the week the search stopped at:
    // `pendingLifeBeat` is what `advanceWeeks` blocks on, `advanceRefusal` is the gate itself, and
    // the week is asked of `schoolEndWeek` rather than written as 242. A wave that moves the beat
    // off the fork's opening tick fails here by name instead of leaving a browser to time out.
    const world = await decodeExportFile(readFixtureBytes('unheard.tsave'))
    expect(world.ending, 'the unheard fixture is meant to be a career still being played').toBeNull()

    const pending = pendingLifeBeat(world)
    expect(pending, 'the unheard fixture is meant to hold a life beat nobody has answered').not.toBeNull()
    expect(pending!.kind).toBe('fork-opinion')
    expect(pending!.answer).toBeNull()
    expect(advanceRefusal(world), 'and it is what the engine refuses to move the week for').toBe('life')
    expect(world.week).toBe(schoolEndWeek(world.profile.birthMonth))

    // ⭐ THE FORK IS OPEN BEHIND HER, AND REFUSED WHILE SHE STANDS. Both halves matter to
    // e2e/life-beat.spec.ts: the first is what makes its "no fork answers on the page" step a
    // REFUSAL rather than an absence, and the second is the wave's contract itself.
    expect(world.fork, 'the fork is meant to be open behind her').not.toBeNull()
    expect(world.fork!.answer).toBeNull()
    expect(() => answerFork(world, 'continue')).toThrow(FORK_UNHEARD_REFUSAL)
  })

  it('soft is parked on a live tier-1 row on a week the engine never stopped', async () => {
    // ⚠⚠ WHY THIS BLOCK EXISTS, AND THE REASON IS A LOCAL GATE RATHER THAN A MISSING ONE.
    // e2e/soft-beat.spec.ts already presses this fixture in front of every pull request –
    // `.github/workflows/ci.yml` is «CI (pull requests)», `on: pull_request`, and its e2e job runs
    // `npm run test:e2e` unconditionally (:274) – so `soft.tsave` is covered before a merge, and any
    // claim that it is not (this file carried two, corrected 12.09) is worth checking against the
    // workflow before it is repeated.
    //
    // ⭐ WHAT IS MISSING IS THE SHORT LOOP. `npm run check` – the pre-push gate – deliberately
    // excludes the browser suite (scripts/e2e.mjs's own header: «NOT PART OF `npm run check`, ON
    // PURPOSE», because the gate is already ~7 minutes). So a builder who regenerates the corpus
    // sees green on their own machine and learns nothing until PR time, in a browser, through a
    // timeout on a card that never came up. This block re-derives the claim in the unit project
    // `npm run check` DOES run (`node scripts/units.mjs`), in well under a second, so the rot is
    // caught before the push instead of after it. That is the hole T8 closed for `breakup` and
    // `belated`, and `soft` – wave 3's T15 fixture – was the one left out of it.
    const world = await decodeExportFile(readFixtureBytes('soft.tsave'))
    expect(world.ending, 'the soft fixture is meant to be a career still being played').toBeNull()

    // ⚠⚠ THE ROW IS PROVEN PRESENT BEFORE ANYTHING IS ASSERTED TO BE NULL, and that ordering is the
    // whole reason this block is not three assertions that cannot fail. `pendingLifeBeat`,
    // `advanceRefusal` and `world.ending` are ALL null on a career carrying no life rows at all – so
    // read on their own they would be satisfied by a fixture that had lost the state entirely, which
    // is precisely the regeneration failure this block is here to catch. The tier-1 row is therefore
    // read straight off the log FIRST, and without the selector, so that every null below is a claim
    // about a row that demonstrably exists.
    const soft = lifeLogOf(world).filter((row) => row.kind === 'small-talk')
    expect(soft.length, 'the soft fixture is meant to hold exactly one tier-1 row').toBe(1)
    expect(soft[0].answer, 'and nobody is meant to have answered it').toBeNull()

    // ...AND IT IS INSIDE ITS WINDOW, ASKED AS ARITHMETIC RATHER THAN THROUGH THE SELECTOR. The
    // window is DERIVED (`ECONOMY.life.smallTalkTtlWeeks`, 3 = the raise week and the two after it)
    // and never stored, and this is the one fact that separates `soft` from the rest of the corpus.
    //
    // ⚠ COUNTED OVER THE TEN, NOT QUOTED FROM THE SEVEN (CLAUDE.md: «count it, do not quote it»).
    // e2e/soft-beat.spec.ts's header records «six carry `'small-talk'` rows – 40 of them» and that
    // census is STALE – it predates `breakup` and `belated`, which carry 7 and 14 of their own.
    // Re-measured over the current corpus: NINE of the ten carry `'small-talk'` rows, 62 in all,
    // every one of them unanswered, and `soft` is the ONLY fixture of the ten holding a LIVE one –
    // every other row is expired, the closest miss being `junior`'s youngest at 4 weeks against a
    // window of 3. So a regeneration that parked on any other career would sail straight through the
    // existence check above and fail HERE, which is the discrimination the fixture exists to make.
    const age = world.week - soft[0].week
    expect(age, 'a row from the future is not a live one').toBeGreaterThanOrEqual(0)
    expect(age, 'and an expired row is the state every OTHER fixture in the corpus is already in').toBeLessThan(
      ECONOMY.life.smallTalkTtlWeeks,
    )

    // ⭐ AND THE ENGINE'S OWN SELECTOR AGREES, ON THAT SAME ROW. `liveSoftBeat` is what
    // `buildSoftBeatInvite` asks, which is what `snapshot.softBeat` carries, which is what Home's
    // card is drawn from – so this is the assertion that says a browser booting here really will see
    // an invitation. ⚠ It is asserted AGAINST the row read above rather than instead of it: the two
    // independent readings AGREEING is the claim, where either one alone would largely be a property
    // of its own definition.
    const live = liveSoftBeat(world)
    expect(live, 'the soft fixture is meant to hold a LIVE tier-1 row').not.toBeNull()
    expect(live!.week, 'and the selector is meant to be looking at that same row').toBe(soft[0].week)

    // ⭐⭐⭐ AND THE WEEK WAS NEVER STOPPED – THE WHOLE CLAIM OF TIER 1, AND THEREFORE OF THIS FIXTURE.
    // ⚠ `pendingLifeBeat` returning null is NOT a contradiction of the live row three lines up, it is
    // the MECHANISM: `LIFE_BEAT_BLOCKING['small-talk']` is false, so the queue's blocking half never
    // returns the row and the week ticks on regardless (§5b's «soft – answerable, never lost»). With
    // the row proven present, this now reads «the one thing standing here does not block» instead of
    // «nothing is standing here», and those are different sentences.
    expect(pendingLifeBeat(world), 'a tier-1 row is not a blocking beat').toBeNull()
    expect(advanceRefusal(world), 'and nothing at all is stopping the week').toBeNull()

    // ⭐⭐⭐ AND SHE IS STILL WAITING ONE TICK LATER, PROVEN THE WAY THE RECIPE'S OWN LOOK-AHEAD PROVES
    // IT – clone, tick, and ask `liveSoftBeat` for the SAME row back (tools/e2e-fixtures.ts's
    // `after === null || after.week !== row.week` clause, verbatim in intent). This is a SEPARATE
    // claim and not a restatement: a career parked ON its raise week is live now and says nothing
    // about being live after the press, and e2e/soft-beat.spec.ts's second step – «the week moved and
    // she is still waiting» – is the half that needs it. It is also the half its own ARM B found, by
    // shrinking the window to `<= 0` and watching step 1 stay green.
    //
    // ⚠ THE TICK IS THE PRODUCT'S OWN, RESUMED FROM THE SAVE'S OWN MAIN POSITION – `resumeMain`,
    // never a fresh `rngFromSeed`, which is the serializer rule these fixtures are written under
    // (tools/e2e-fixtures.ts's header). A raw tap here would walk a different sequence from the one
    // the worker walks, and the claim would be about a week nobody will ever see.
    const probe = structuredClone(world)
    tickWeek(probe, resumeMain(probe.rngMain))
    expect(probe.week, 'the week must actually move, or the tick above asserted nothing').toBe(world.week + 1)
    const after = liveSoftBeat(probe)
    expect(after, 'her row is meant to survive the week the browser presses past').not.toBeNull()
    expect(after!.week, 'and be the SAME row, not a fresh one raised on the way').toBe(soft[0].week)
  })

  // ===============================================================================================
  // ⭐⭐⭐ v75 T8 – THE TWO ENDING FIXTURES, AND THEY ARE ASSERTED HERE BECAUSE THE BROWSER IS NOT ON
  // THE **LOCAL** GATE. `npm run check` does not run Playwright – deliberately (scripts/e2e.mjs's own
  // header) – so a fixture whose CLAIM had rotted stays green in front of the builder who broke it,
  // and only goes red later, in a browser, through a timeout on a card that never came up.
  //
  // ⚠ CORRECTED 12.09, MEASURED. This used to say the rot «would sail through every gate and fail in
  // the nightly e2e job», and both halves were wrong: `.github/workflows/ci.yml` is «CI (pull
  // requests)», `on: pull_request`, and line 274 runs `npm run test:e2e` unconditionally, so these
  // fixtures are covered BEFORE a merge; and there is no nightly e2e job in this repo at all –
  // simulation.yml's Monday sim run is the only cron. What is bought here is the length of the
  // feedback loop, not coverage that was otherwise absent. The error is worth the correction rather
  // than a quiet edit: it travelled from a wave report into this file and then back out of it into a
  // task brief, because a comment naming the wrong gate reads exactly like one naming the right one.
  //
  // `unheard`'s and `soft`'s own blocks above make the same argument; these two
  // carry a STATE THAT IS ONE TICK AWAY rather than one that is already on the world, so both blocks
  // below tick the career forward exactly as the browser's first press does.
  //
  // ⚠ THE TICK IS THE PRODUCT'S OWN, RESUMED FROM THE SAVE'S OWN MAIN POSITION – `resumeMain`, never
  // a fresh `rngFromSeed`, which is the serializer rule these fixtures are written under
  // (tools/e2e-fixtures.ts's header). A raw tap here would walk a different sequence from the one the
  // worker walks and the whole claim would be about a week nobody will ever see.
  // ===============================================================================================

  /** The rung of the Mood ladder the Kid screen would be showing, 0 = `Glowing` … 4 = `Heavy`, −1 if
   *  the tile is not speaking a spirit word at all. `tools/e2e-fixtures.ts`' `moodRung`, asked the
   *  same way and for the reasons its own note gives – through `toSnapshot`, which is the wire the
   *  browser reads, and never through `spiritBandOf`, which would miss the channel decision. */
  const moodRung = (world: Parameters<typeof toSnapshot>[0]): number => {
    const word = toSnapshot(world).diary.facts.moodWord
    return word === null ? -1 : SPIRIT_BANDS.findIndex((band) => MOOD_WORD[band] === word)
  }

  it('breakup is one press from the end of an attachment he was told about, and from her Mood dropping', async () => {
    const world = await decodeExportFile(readFixtureBytes('breakup.tsave'))
    expect(world.ending, 'the breakup fixture is meant to be a career still being played').toBeNull()

    // ⭐ THE WEEK IT BOOTS ON IS ORDINARY, which is the half e2e/breakup.spec.ts presses. Asked of the
    // engine's own gate rather than of a list of things that might be standing there.
    expect(pendingLifeBeat(world), 'it is meant to boot with nothing to answer').toBeNull()
    expect(advanceRefusal(world), 'and with nothing stopping the week').toBeNull()

    // ⭐⭐⭐ SOMEBODY IS THERE AND HE HAS BEEN TOLD – the two facts that make the next tick's card the
    // TOLD-NOW one. ⚠ IT IS THE `'met'` RECEIPT AND NEVER `knownWeek <= endedWeek` (ruling A): the
    // receipt is what `rollEnds` asks, the two readings disagree on a reachable week, and a fixture
    // classified by the other rule would be a fixture for a scene the browser never shows.
    const live = activeEpisode(world)
    expect(live, 'the breakup fixture is meant to hold a LIVE attachment').not.toBeNull()
    expect(
      lifeLogOf(world).some((row) => row.kind === 'met' && row.detail === live!.id),
      'and one the parent has already been told about – without the receipt the next tick raises the ' +
        'TOLD-LATE card instead, which is the other fixture',
    ).toBe(true)
    expect(world.spiritShock, 'nothing has happened to her yet').toBeNull()

    const before = moodRung(world)
    expect(before, 'her Mood tile is meant to be speaking a SPIRIT word, so the rungs are comparable').toBeGreaterThanOrEqual(0)

    // ⭐⭐⭐ ONE TICK – the browser's first press – AND THE WHOLE SCENE ARRIVES.
    tickWeek(world, resumeMain(world.rngMain))
    const raised = pendingLifeBeat(world)
    expect(raised, 'the tick after this fixture is meant to end it and ask about it').not.toBeNull()
    expect(raised!.kind).toBe('ended')
    expect(raised!.detail, 'and about THIS attachment – the row\'s detail is the episode id').toBe(live!.id)
    expect(world.spiritShock).toEqual({ week: world.week, kind: 'breakup' })
    expect(
      loveEpisodesOf(world).find((e) => e.id === live!.id)!.endedWeek,
      'the row stays and is dated – nothing is nulled (`endEpisode`)',
    ).toBe(world.week)

    // ...AND HER MOOD IS TWO RUNGS LOWER. The ladder runs top-down, so a dip is a LARGER index.
    // ⚠⚠ TWO AND NOT ONE, AND THE REASON IS A MEASUREMENT RATHER THAN A MARGIN: with the shock
    // summand removed from `accrueSpirit` this career still moves ONE rung, because the attachment
    // lift comes off on the same tick (spirit 75 -> 72) and the tile then falls back to the BODY
    // ladder's «Steady» – the one word the two ladders share, by the owner's ruling. The bar is the
    // shock's own size, and `tools/e2e-fixtures.ts` enforces it on the fixture so the browser spec
    // can assert it honestly without being able to see `moodWord`'s nullability.
    const after = moodRung(world)
    expect(after, 'and her Mood tile is still speaking a spirit word on the week it ended').toBeGreaterThanOrEqual(0)
    expect(
      after - before,
      `her Mood read ${MOOD_WORD[SPIRIT_BANDS[before]]} before the ending and ` +
        `${after < 0 ? 'a body word' : MOOD_WORD[SPIRIT_BANDS[after]]} after it. The shock is ` +
        '`ECONOMY.spirit.shock.breakup`; one rung of that is the attachment lift alone.',
    ).toBeGreaterThanOrEqual(2)
  })

  it('belated is one press from news that arrives already over, and no arrival card is ever raised for it', async () => {
    const world = await decodeExportFile(readFixtureBytes('belated.tsave'))
    expect(world.ending, 'the belated fixture is meant to be a career still being played').toBeNull()
    expect(pendingLifeBeat(world), 'it is meant to boot with nothing to answer').toBeNull()
    expect(advanceRefusal(world), 'and with nothing stopping the week').toBeNull()

    // ⭐⭐⭐ THE STATE, IN THE SCHEMA'S OWN TERMS: a row that is ALREADY OVER, whose news is owed next
    // week, and which has never produced a beat of either kind. This is exactly the row
    // `deliverKnownPartner` scans for (ruling B) and the reason `loveEpisodes` is a LIST rather than a
    // nullable slot – wave 3's own re-cut, made visible.
    const due = loveEpisodesOf(world).find(
      (episode) =>
        episode.endedWeek !== null &&
        episode.knownWeek === world.week + 1 &&
        !lifeLogOf(world).some((row) => (row.kind === 'met' || row.kind === 'ended') && row.detail === episode.id),
    )
    expect(
      due,
      'the belated fixture is meant to hold an episode that ended BEFORE its knownWeek and has never ' +
        'been delivered. If this is the only red test after a regeneration, the recipe stopped ' +
        'finding one: it is the rarest state in the corpus – it needs a lag that survived the bond ' +
        'shave AND the end hazard landing inside it.',
    ).not.toBeUndefined()
    expect(due!.endedWeek!, 'and it ended before he was ever told').toBeLessThan(due!.knownWeek!)

    tickWeek(world, resumeMain(world.rngMain))
    const raised = pendingLifeBeat(world)
    expect(raised, 'the tick after this fixture is meant to deliver the news').not.toBeNull()
    expect(raised!.kind).toBe('ended')
    expect(raised!.detail).toBe(due!.id)

    // ⭐⭐⭐ AND NO `'met'` BEAT, EVER – the brief's «no `'met'` beat fires for a finished episode»,
    // asserted on a career rather than on a reading of the code. ⚠ THIS IS THE QUIET FAILURE RULING A
    // WAS WRITTEN FOR: the variant that goes wrong does NOT produce a loud double row – it raises the
    // card, lets delivery see a receipt and skip, and the week's news never reaches the album at all.
    expect(
      lifeLogOf(world).filter((row) => row.detail === due!.id).map((row) => row.kind),
      'the delivery raised an arrival beat for an episode that was already over',
    ).toEqual(['ended'])

    // ...and the album has the one honest late row, stamped with the kind the glyph column reads.
    const rows = world.events.filter((e) => e.week === world.week && e.type === 'life')
    expect(rows.map((e) => e.lifeKind), 'ONE feed row and never two, and it is the ending\'s').toEqual(['ended'])
    expect(rows[0].amountCents, 'a life beat is never a purchase').toBeUndefined()
  })
})
