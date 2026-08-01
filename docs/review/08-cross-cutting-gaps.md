<!-- Full project review, 2026-08-01, reviewed at origin/main b7a9358 (branch docs/full-review). -->
<!-- Method: independent reviewer agent per dimension, read-only; top findings adversarially verified (see README.md). -->

# Cross-cutting gaps

## Verdict

The seven dimension reviews missed a whole layer: the paperwork that turns a very good codebase into a defensible product. The code's privacy story is genuinely spotless (zero telemetry, zero external calls, zero XSS sinks) and audio asset provenance is documented to an unusual standard – but the same discipline stops at exactly the assets and documents with legal weight. There is no LICENSE file behind the README's source-available claims (and the copyright line still contains template brackets), three SIL-OFL fonts ship without their required license texts, 5.8 MB of art has no provenance record at all, and 542 commits have produced zero tags, zero CHANGELOG and no build id a bug reporter could quote. The three actions that matter: (1) write a real LICENSE file and fix the copyright line, (2) add provenance READMEs for fonts and images matching the existing music/sounds standard, (3) inject a build id into the app and surface it plus a feedback link on the More screen.

## Strengths

- **The no-telemetry claim is real.** index.html loads nothing third-party; the only network call in src/ is a same-origin HEAD probe for sound files (src/audio/sfx.ts:137). No analytics SDK, no error reporting, no fonts from CDN. Combined with zero v-html/innerHTML in src/, the local-only privacy posture survives a hostile audit.
- **Audio provenance is a model to copy.** public/music/README.md pins the Pixabay Content License per file with an update protocol; public/sounds/README.md documents that every SFX is the owner's own recording and cross-references the music note. This is exactly the standard the rest of the assets need.
- **.gitignore is a legal firewall with its incident history written in.** Deny-all *.png/*.jpg with five named PWA-icon exceptions, raw art masters excluded by design, and *.tsave excluded after two exports were actually committed on 29.07. Rare care.
- **Right-of-publicity and trademark exposure is designed out.** Generated rivals ban real players' surnames (src/engine/season/cohort.ts:72); sponsors are generic local/national/global tiers, not real brands.
- **The 57-spec corpus is not silently rotting.** Unshipped designs declare it in the first lines ('Nothing here is implemented' – docs/specs/adult-tour-and-endings.md, childhood-prologue.md), and scope cuts are written decisions (docs/decisions.md:32-33: EN only, no monetization at launch).

## Findings

**[high] No LICENSE file – the terms protecting the code exist only as README prose** (README.md:30-54). There is no LICENSE/COPYING/NOTICE file at the root, no license field in package.json, and zero copyright headers in src/ – although README.md:46 forbids 'removing or obscuring the original copyright and license notices', there are none to remove. README.md:54 ships a literal template placeholder: '© 2026 [Igor Vladimirskiy / T Software]'. The grant also contradicts itself (forking Allowed at line 38, redistribution Not Allowed at line 45 – a public fork is redistribution). GitHub will report the repo as unlicensed. Fix: adopt a named source-available license (PolyForm Noncommercial/Shield or a lawyer-checked custom text) in a root LICENSE file, reference it from package.json, fill in the copyright line, and add a NOTICE the README's own rule can point at.

**[medium] OFL fonts distributed without their licenses** (src/style.css:1-8, public/fonts/). Sora, Manrope and Caveat are all SIL OFL 1.1; the OFL requires its text and copyright notice to accompany any redistribution of the font software, and both the public repo and the deployed sites redistribute the four woff2 files with nothing but a CSS comment ('curl'd from Google Fonts/gstatic'). Fix: public/fonts/README.md with the three OFL notices, in the music-README format. Note there too that the files are latin-subset only – the planned RU localization (docs/plan.md:119) will need Cyrillic subsets of at least Manrope and Caveat.

**[medium] No provenance for 5.8 MB of shipped art** (public/images/). Six sets ship (character portraits including bride/funeral/pregnant variants, 16 coach portraits, 14 week frames, fields, trophies, sponsors) with no README or license record; docs/decisions.md:55 says only 'Owner-supplied character art appeared'. The design prototype's own tooling enforces Unsplash attribution (docs/design/prototype/image-slot.js:96-104), proving stock photography was in the pipeline, but the repo cannot say whether any shipped frame derives from stock – and the masters are deliberately outside git (art-src ignored). A portal submission or a DMCA claim would find the repo mute. Fix: one public/images/README.md, per-set provenance rows, same standard as sounds.

**[medium] Zero release discipline** (package.json:5). Version 0.1.0 across 542 commits since 22.07; git tag is empty; no CHANGELOG; no build id compiled into the app; MoreScreen.vue contains no external link at all, so an installed-PWA player has neither a version to quote nor a route to the GitHub Issues the README invites. The only moving version is the save schema (v34). With two public deployments whose mains have already diverged once, field bugs are unmappable to commits. Fix: Vite define with git SHA + date, render it on the More screen next to an Issues link, tag deploys.

**[medium] i18n door welding shut** (src/engine/diary.ts). 'EN only for now' (decisions.md:32) is a fine decision, but the cost is compounding invisibly: ~300 copy lines are hard-coupled to the honesty-licence system inside engine modules, there is no string table anywhere, and toLocaleString('en-US') is hardcoded at 19 call sites. plan.md:119 lists 'RU localization' as a one-line later item, priced like a string swap; it is actually a re-authoring of the entire licensed corpus. Fix: record the real cost in decisions.md, and let the already-flagged money-format DRY fix collapse the formatter scatter while it is cheap.

**[low] Dormant ad hooks promised, never designed** (docs/decisions.md:33). 'Design the hook points early, keep them dormant' – grep finds no hook point in src/. Retrofitting interstitial-shaped pauses later means surgery on MatchViewer (2235 lines) and the season flow. Either mark the 3-4 sites with typed no-op events now or delete the word 'early' from the decision.

**[low] No privacy statement despite portal targets** (README.md, whole repo). grep -i privacy returns nothing anywhere. The substance is excellent – nothing leaves the device – but CrazyGames/Yandex require a policy URL, and the app does collect a child's name and birthday into saves and exports. One honest paragraph turns a compliance blank into a differentiator.

**[low] PR policy without the GitHub plumbing** (README.md:51-52). 'No unsolicited feature PRs' lives only in the README; .github/ has workflows only – no CONTRIBUTING.md, no templates. The policy will first reach a contributor as a rejection of finished work.

## Recommendations

1. **LICENSE file now** – it is the cheapest fix on this list and the entire commercial posture rests on it. Fill in the bracketed copyright line the same day.
2. **Provenance READMEs for fonts and images**, copying the format that already exists in public/music and public/sounds. Fold the week-frame copyright obligations the owner tracks informally into the images README so the repo can answer rights questions itself.
3. **Build id + Issues link on the More screen, and start tagging deploys** – the first field bug report from the installed PWA will otherwise cost an afternoon of guessing which build the player has.
4. **Write the true price of RU localization into decisions.md** and stop the en-US formatter scatter via the money-format extraction already recommended by the code-quality review.
5. Low priority, batchable: privacy paragraph, CONTRIBUTING.md, and a decision on whether 'design ad hooks early' is still policy.
