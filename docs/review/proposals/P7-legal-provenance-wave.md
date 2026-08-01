<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P7 – Legal & provenance wave: LICENSE, font OFL texts, art manifest, privacy, contributor plumbing

One-line: Turns review chapter 08's paperwork gaps into shipped files – a real source-available LICENSE (PolyForm Shield 1.0.0), OFL license texts beside the shipped fonts, an owner-attested art provenance manifest, an honest PRIVACY.md surfaced on the More screen, and a minimal .github contribution set – all guarded by one repo-gate test.

**Priority:** Tier 3 – quick wins · **Effort:** M · **Risk:** low

## Why (problem)

Five gaps, all confirmed in the code at b7a9358, all from docs/review/08-cross-cutting-gaps.md:

1. **No LICENSE file** (08:20). The entire commercial posture lives as README prose (README.md:30-54). package.json (lines 1-5) has no `license` field; there are zero copyright headers in src/, yet README.md:46 forbids removing "the original copyright and license notices" – there are none to remove. README.md:54 ships a literal template placeholder: `© 2026 [Igor Vladimirskiy / T Software]`. The prose also self-contradicts: forking is Allowed (README.md:38) while redistributing the source is Not Allowed (README.md:45) – a public GitHub fork is redistribution. GitHub reports the repo as unlicensed.
2. **OFL fonts shipped without their licenses** (08:22). Four woff2 files are tracked and deployed – public/fonts/{sora-600,manrope-400,manrope-500,caveat-600}.woff2, confirmed via `git ls-files public/fonts` and present bare in dist/fonts/. Sora, Manrope and Caveat are all SIL OFL 1.1; the OFL conditions require that every copy of the Font Software be accompanied by the copyright notice and the license text. Today the only record is a CSS comment: "curl'd from Google Fonts/gstatic, latin subset only" (src/style.css:1-8). Both the public repo and the GitHub Pages deployment redistribute the fonts in violation of that condition.
3. **5.8 MB of art with zero provenance** (08:24). Six shipped sets under public/images/ – fem-euro-brunnet (64 files, 3.0 MB, archetype × age-stage × emotion portraits incl. bride/funeral/pregnant), fields (20, 1.3 MB), weeks (16, 792 KB), trophies (12, 496 KB), coaches (16, 196 KB), sponsors (3, 28 KB) – with no README, while audio has a model standard: public/music/README.md pins the Pixabay Content License per file with an update protocol, and public/sounds/README.md attests every SFX as the owner's own recording. docs/decisions.md:55 says only "Owner-supplied character art appeared". The design prototype's own tooling enforced Unsplash attribution (docs/design/prototype/image-slot.js:96-104), proving stock photography was in the pipeline at some point – so "it's all owner art" is an assumption, not a record. Masters are deliberately outside git (art-src/ ignored), so the repo cannot answer a rights question at all.
4. **No privacy statement despite portal targets** (08:32). Verified: the only network call in src/ is a same-origin HEAD probe for sound files (src/audio/sfx.ts:137); grep for fetch/sendBeacon/analytics/XHR finds nothing else. But the app stores a child's chosen name and birth month (src/shared/protocol.ts:21, :35) in IndexedDB saves and .tsave exports, and the post-v1 plan targets CrazyGames/Yandex portal builds (docs/plan.md:119) which require a policy URL. `grep -ri privacy` over the repo returns nothing.
5. **PR policy without plumbing** (08:34). "No unsolicited feature PRs – open an Issue first" exists only at README.md:51-52; .github/ contains workflows only (ci.yml, deploy.yml, simulation.yml). The policy will first reach a contributor as a rejection of finished work.

## What (proposed change)

**(a) Adopt PolyForm Shield License 1.0.0** as the root LICENSE. The README's stated intents are: view/fork/study/run-locally/private-mods yes (README.md:36-40); public instance, competing product, commercial service, selling copies no (README.md:42-46). Comparison against the four candidates:

- **PolyForm Noncommercial 1.0.0** permits any noncommercial use *including public deployment* – a free public mirror of the game would be fully licensed, directly violating README.md:43. Fails the single most important intent. Runner-up only.
- **PolyForm Strict 1.0.0** forbids modification and distribution outright – contradicts README.md:37-40 (fork, study, private mods explicitly Allowed).
- **Elastic License 2.0** only bans managed services and license-key tampering; commercial redistribution and a rebranded portal build arguably pass. Too weak for a game whose whole value is the game.
- **BUSL 1.1** mandates a Change Date (max 4 years) after which the code converts to an open source license. The owner has expressed no intent to ever open-source; wrong instrument.
- **PolyForm Shield 1.0.0** grants use, modification and distribution with notices preserved, *except* for anything that competes with the software or with a product the licensor offers using it. Every realistic abuse – public clone, portal redeploy, commercial reskin, competing tennis sim – competes with the game itself and is prohibited; learning, local play, private mods and inert GitHub forks are permitted. Shield also dissolves the README's fork-vs-redistribution contradiction: redistribution with notices intact is fine, competing offerings are not.

Shield is marginally more permissive than README.md:44's blanket "any commercial product" ban (a non-competing commercial reuse of, say, a math helper would be licensed) – that is an acceptable trade for getting a lawyer-drafted standard text instead of unvetted custom prose. Owner name stays a single marked blank `[OWNER LEGAL NAME – fill before next deploy]` in both LICENSE and README.md:54.

**(b) Font license texts**: public/fonts/OFL-Sora.txt, OFL-Manrope.txt, OFL-Caveat.txt (upstream copyright notice + full OFL 1.1 text, verbatim from the google/fonts repo: ofl/sora/OFL.txt, ofl/manrope/OFL.txt, ofl/caveat/OFL.txt) plus public/fonts/README.md in the public/music/README.md table format. Vite copies public/ into dist verbatim, so the deployed site becomes compliant automatically; the workbox precache glob (vite.config.ts:78, `**/*.{js,css,html,svg,png,webp,woff2}`) covers neither .txt nor .md, so install size is untouched.

**(c) Art provenance manifest**: public/images/README.md – per-folder README chosen over a root ART-PROVENANCE.md because per-folder is the repo's existing, working convention (public/music, public/sounds cross-reference each other already). One row per set; origin/rights columns are owner-attested, never builder-invented.

**(d) PRIVACY.md** at repo root (single source of truth; policy URL for portals = the GitHub blob URL), surfaced in-app as a new row in the More screen's About table (src/components/screens/MoreScreen.vue:466-488).

**(e) Minimal .github set**: CONTRIBUTING.md at root, .github/ISSUE_TEMPLATE/bug_report.yml + feature_request.yml, .github/pull_request_template.md.

## How (implementation sketch)

Zero engine files, zero RNG draws, zero schema changes. The only src/ edit is MoreScreen.vue (UI layer – invariant 3 untouched, no golden-save impact).

1. **Test first** – new tests/legal-assets.test.ts, modeled on the repo-file-gate pattern of tests/design-tokens.test.ts (readFileSync/readdirSync against the repo root, see its imports at line 30). Assertions: LICENSE exists and contains "PolyForm Shield License 1.0.0"; README.md contains "LICENSE"; package.json has a `license` key; for each family stem among public/fonts/*.woff2 (sora, manrope, caveat) a matching public/fonts/OFL-*.txt exists containing "SIL OPEN FONT LICENSE Version 1.1"; public/fonts/README.md names every woff2 file; public/images/README.md contains a table row for every subdirectory of public/images (readdirSync, skip dotfiles); PRIVACY.md and CONTRIBUTING.md exist. Run `npm test` – red.
2. **LICENSE**: verbatim PolyForm Shield 1.0.0 text from polyformproject.org/licenses/shield/1.0.0/, with the PolyForm-style Required Notice prepended: `Required Notice: Copyright 2026 [OWNER LEGAL NAME – fill before next deploy]`.
3. **package.json**: add `"license": "SEE LICENSE IN LICENSE"` (npm's custom-license form; the package is `private: true`, no registry implications).
4. **README.md**: rewrite the Source Code & License section (30-54) to a short human summary plus "The LICENSE file is the authoritative text; if this summary and LICENSE disagree, LICENSE wins." Reconcile the bullets to Shield's shape (fork/study/local/private-mods allowed; competing, public or commercial deployment not; notices must stay). Replace the line-54 placeholder with the same marked blank as LICENSE. Add a Privacy link (step 7).
5. **Fonts**: fetch the three OFL.txt files from github.com/google/fonts, save verbatim (upstream copyright line included) as public/fonts/OFL-{Sora,Manrope,Caveat}.txt. Write public/fonts/README.md: table `file | family/weight | source | license`, one row per woff2 (manrope-400 and manrope-500 both point at OFL-Manrope.txt); note the files are latin-subset only and RU localization (docs/plan.md:119) will need Cyrillic subsets of at least Manrope and Caveat; cross-link the music and sounds READMEs. Do NOT rename any woff2 – src/style.css @font-face URLs stay untouched.
6. **Art manifest**: public/images/README.md with header explaining why the record exists (the prototype's Unsplash pipeline means provenance must be explicit, image-slot.js:96-104) and a table:
   `set | files | depicts | origin | rights holder | masters`
   Builder fills only mechanically verifiable columns (set names, counts, "art-src/ (gitignored)" for masters); every origin/rights cell is written as `TBC-owner`. The owner replaces each TBC during PR review – the builder must not invent provenance. Add one hygiene line: .DS_Store is gitignored but public/ copies verbatim into dist – check the deploy output for stray dotfiles.
7. **PRIVACY.md** (~15 lines, honest and checkable): no accounts, no analytics, no cookies, no third-party requests – the app's only network traffic is same-origin loading of its own assets (the sound-file HEAD probe at src/audio/sfx.ts:137 included); all data, including the child's chosen name and birth month, lives in the browser's IndexedDB/localStorage on the device; export files are created locally and shared only by the user; the service worker caches app files for offline; deleting browser site data removes everything; contact via GitHub Issues. Closing line: "This document will change before any networked feature (cloud backup, ads) ships."
8. **More screen wiring**: in the About table of src/components/screens/MoreScreen.vue (template lines 466-488), add a `Privacy` row: one-line summary text ("Everything stays on this device – no accounts, no analytics") plus an external `<a target="_blank" rel="noopener">` to the PRIVACY.md blob URL on GitHub. This is also the first external link on the screen, closing half of review 08:26's "no route to Issues" note in passing – add an `Issues` link in the same row style if trivially cheap, otherwise leave for the release-discipline item.
9. **Contribution set**: CONTRIBUTING.md – discuss-first policy from README.md:51-52 expanded (Issue before any feature PR; bug fixes with tests welcome; contributions land under the project LICENSE). .github/ISSUE_TEMPLATE/bug_report.yml – fields: what happened, week label, save schema version and seed (both visible/copyable on More → About, MoreScreen.vue:478-485), device/browser, optional .tsave export. feature_request.yml – pitch + which of the three pillars it serves. .github/pull_request_template.md – checkboxes: linked Issue with prior discussion; tests added; no Vue/Pinia imports into engine modules.
10. `npm test` green, then `npm run check` (vue-tsc + unit suite + vite build) – confirms the MoreScreen edit compiles and the new public/ files ride through the build.

## Test plan

TDD order:

1. tests/legal-assets.test.ts written first, red on all counts (step 1 above).
2. Files land (steps 2-9), test goes green with no assertion weakened.
3. Full unit project (`npm test`) – goldenSaves.test.ts and migrations.test.ts must pass *unmodified*: this wave touches no engine code, no schema, no RNG stream, so any golden-save diff is a bug in the wave.
4. `npm run check` – build proof. Then inspect dist/: dist/fonts/ contains the three OFL-*.txt; grep the generated service worker precache manifest for "OFL" and "README" – zero hits proves install size is untouched (glob at vite.config.ts:78 excludes .txt/.md).
5. Manual: More → About shows the Privacy row; link opens the GitHub PRIVACY.md; bug-report form renders on GitHub with seed/schema fields.

## Acceptance criteria

- [ ] LICENSE at repo root is verbatim PolyForm Shield 1.0.0 plus a Required Notice line; the only blank anywhere is the single `[OWNER LEGAL NAME – fill before next deploy]` marker, called out in the PR description.
- [ ] package.json carries `"license": "SEE LICENSE IN LICENSE"`.
- [ ] README license section defers to LICENSE as authoritative; the fork-allowed/redistribution-banned contradiction (old :38 vs :45) is gone; the old :54 placeholder is replaced by the same marked blank.
- [ ] public/fonts/ contains OFL-Sora.txt, OFL-Manrope.txt, OFL-Caveat.txt (full OFL 1.1 + upstream copyright lines) and a README.md row for each of the 4 woff2 files; all four ship in dist/ next to the fonts; none appear in the precache manifest.
- [ ] public/images/README.md has a provenance row for all 6 sets; zero `TBC-owner` cells remain at merge time (owner sign-off is the merge gate).
- [ ] PRIVACY.md exists; every claim in it is grep-verifiable today (only network call = src/audio/sfx.ts:137); More → About links to it.
- [ ] CONTRIBUTING.md, two issue forms and the PR template exist; the bug form asks for seed and save schema version.
- [ ] tests/legal-assets.test.ts is green and guards every presence rule above.
- [ ] No engine/worker/db/shared file changed; no RNG draw added; no schema bump; golden fixtures untouched.

## Risks & alternatives

- **Not legal advice.** PolyForm Shield is a lawyer-drafted standard text, but the owner should read the noncompete clause once before merging. Runner-up: PolyForm Noncommercial 1.0.0 – SPDX-recognized (Shield is not, so GitHub will show "View license" rather than a named badge) and a blanket commercial ban, but it licenses free public mirrors of the game, which the README's own line 43 forbids. Worst option: keeping custom prose – unvetted, unrecognized, and currently self-contradictory.
- **Relicensing risk is minimal now and grows later**: the owner is the sole rights-holder today, so the license can still be swapped freely; every day without a LICENSE adds forks of ambiguous status.
- **Art manifest depends on owner attestation** – the builder can only produce TBC cells. Mitigation: it is a docs PR with no deploy dependency; the merge gate is the owner filling six rows.
- **Privacy statement can drift**: Google Drive backup and ad hooks (docs/plan.md:119, docs/decisions.md:33) will falsify "nothing leaves the device". The closing line in PRIVACY.md names this; the legal-assets test guards presence, not semantics – drift review stays a human job.
- **Scope creep risk**: build id, CHANGELOG and deploy tags (review 08:26) are deliberately NOT in this wave – only the cheap Privacy/Issues link on the More screen overlaps.

## Dependencies

None. If the review's release-discipline item (build id + tags, 08:26) becomes its own proposal, extend .github/ISSUE_TEMPLATE/bug_report.yml with a build-id field there – the form lands here first either way.
