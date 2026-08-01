// P7 – THE PAPERWORK GATE.
//
// WHY THIS FILE EXISTS. The repo's legal posture used to live entirely in README prose: no
// LICENSE file, no `license` field in package.json, four OFL fonts redistributed without the
// license text the OFL conditions require, 5.8 MB of shipped art with no provenance record,
// and no privacy statement despite a save format that holds a child's chosen name and birthday
// (docs/review/08-cross-cutting-gaps.md, confirmed at b7a9358). None of that breaks a build –
// which is exactly the failure mode: a deleted LICENSE, a renamed OFL file or a new font family
// dropped in bare would ship silently. This gate makes absence loud.
//
// WHAT IT PINS, in one rule: every legal/provenance artifact the repo promises is PRESENT and
// still says the thing that makes it valid. Presence and load-bearing phrases only – whether
// PRIVACY.md still tells the truth about network calls, or the art manifest's attestations are
// honest, stays a human review job (the manifest's own header says whose).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

// ===============================================================================================
// LICENSE – the root license is the real, named text, not prose or a template blank
// ===============================================================================================
describe('LICENSE', () => {
  it('exists and is the canonical PolyForm Shield 1.0.0 text', () => {
    expect(existsSync(join(ROOT, 'LICENSE'))).toBe(true)
    const license = read('LICENSE')
    expect(license).toContain('PolyForm Shield License 1.0.0')
    expect(license).toContain('https://polyformproject.org/licenses/shield/1.0.0')
    // Spot-check the clause that makes Shield the right pick over its runner-ups: the noncompete
    // is the whole reason this license and not Noncommercial (review P7, "What" section).
    expect(license).toContain('Noncompete')
  })

  it('carries a resolved Required Notice – the owner name, no template blank left', () => {
    const license = read('LICENSE')
    expect(license).toContain('Required Notice: Copyright 2026 Igor Vladimirskiy')
    // The old README shipped a literal `[Igor Vladimirskiy / T Software]` placeholder for weeks.
    // A bracketed blank in a license file is worse than none – it reads as "nobody filled this in".
    expect(license).not.toMatch(/\[[^\]]*(?:OWNER|fill)[^\]]*\]/i)
  })

  it('package.json points at it the way npm expects for a custom license', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.license).toBe('SEE LICENSE IN LICENSE')
  })

  it('README defers to LICENSE as the authoritative text and has no placeholder left', () => {
    const readme = read('README.md')
    expect(readme).toContain('LICENSE')
    expect(readme).toContain('PolyForm Shield')
    expect(readme).not.toContain('[Igor Vladimirskiy / T Software]')
  })
})

// ===============================================================================================
// FONTS – every shipped woff2 family travels with its OFL text (an OFL 1.1 CONDITION, not a nicety)
// ===============================================================================================
describe('font licenses', () => {
  const fontsDir = join(ROOT, 'public/fonts')
  const woff2 = readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'))
  // `sora-600.woff2` -> family stem `sora` -> `OFL-Sora.txt`. New family without an OFL file fails here.
  const families = [...new Set(woff2.map((f) => f.split('-')[0]))]

  it('every font family has its OFL text beside it, upstream copyright line included', () => {
    for (const family of families) {
      const oflName = `OFL-${family[0].toUpperCase()}${family.slice(1)}.txt`
      const oflPath = join(fontsDir, oflName)
      expect(existsSync(oflPath), `${oflName} missing for ${family}-*.woff2`).toBe(true)
      const ofl = readFileSync(oflPath, 'utf8')
      expect(ofl, `${oflName} lacks the full license text`).toContain('SIL OPEN FONT LICENSE Version 1.1')
      // The OFL requires the copyright notice to accompany every copy – the license text alone
      // is not compliance. Every google/fonts OFL.txt opens with exactly this line shape.
      expect(ofl, `${oflName} lacks the upstream copyright notice`).toMatch(/^Copyright \d{4} The .* Project Authors/)
    }
  })

  it('public/fonts/README.md names every shipped woff2 file', () => {
    const readme = read('public/fonts/README.md')
    for (const f of woff2) expect(readme, `${f} not documented`).toContain(f)
  })

  it('...and the scan is real – the four known files are actually there to be checked', () => {
    // Vacuous-truth insurance: an emptied fonts dir would pass every loop above by looping zero times.
    expect(woff2.length).toBeGreaterThanOrEqual(4)
    expect(families.sort()).toEqual(['caveat', 'manrope', 'sora'])
  })
})

// ===============================================================================================
// ART – every shipped set has a provenance row, and no row overclaims
// ===============================================================================================
describe('art provenance manifest', () => {
  const imagesDir = join(ROOT, 'public/images')
  const sets = readdirSync(imagesDir).filter(
    (d) => !d.startsWith('.') && statSync(join(imagesDir, d)).isDirectory(),
  )

  it('public/images/README.md has a table row for every shipped set', () => {
    const manifest = read('public/images/README.md')
    for (const set of sets) {
      // A table row, not a passing mention: `| set |` (leading cell) is the manifest's row shape.
      expect(manifest, `no manifest row for public/images/${set}/`).toMatch(new RegExp(`^\\| \`${set}\``, 'm'))
    }
  })

  it('every row is honest about method – attested AI-assisted, or explicitly pending, never blank', () => {
    // The architect's rule for this wave: record what is attested (trophies = ChatGPT image
    // generation, owner post-processed), and mark everything unverifiable from the repo as
    // pending rather than inventing a method. A row that claims neither is an invented claim.
    const manifest = read('public/images/README.md')
    for (const set of sets) {
      const row = manifest.split('\n').find((l) => l.startsWith(`| \`${set}\``)) ?? ''
      expect(
        /AI-assisted|attestation pending/.test(row),
        `manifest row for ${set} neither attests a method nor marks it pending: "${row}"`,
      ).toBe(true)
    }
  })

  it('...and the scan is real – the six known sets are actually there to be checked', () => {
    expect(sets.length).toBeGreaterThanOrEqual(6)
    for (const known of ['fem-euro-brunnet', 'trophies', 'weeks', 'fields', 'coaches', 'sponsors']) {
      expect(sets, `expected shipped set ${known} vanished`).toContain(known)
    }
  })
})

// ===============================================================================================
// PRIVACY – the statement exists and the app surfaces it
// ===============================================================================================
describe('privacy statement', () => {
  it('PRIVACY.md exists and states the two facts that make it a policy', () => {
    const privacy = read('PRIVACY.md')
    // Load-bearing phrases only. Whether these stay TRUE is re-checked by humans when any
    // networked feature lands – PRIVACY.md's own closing line names that trigger.
    expect(privacy).toContain('IndexedDB')
    expect(privacy).toMatch(/no analytics/i)
  })

  it('the More screen links to it (the in-app route portals will ask for)', () => {
    const more = read('src/components/screens/MoreScreen.vue')
    expect(more).toContain('PRIVACY.md')
  })
})

// ===============================================================================================
// CONTRIBUTOR PLUMBING – the README's issues-first policy has actual files behind it
// ===============================================================================================
describe('contribution set', () => {
  it('CONTRIBUTING.md exists and carries the issues-first policy', () => {
    const contributing = read('CONTRIBUTING.md')
    expect(contributing.toLowerCase()).toContain('issue')
  })

  it('the .github templates exist, and the bug form asks for what a repro needs', () => {
    expect(existsSync(join(ROOT, '.github/pull_request_template.md'))).toBe(true)
    const bug = read('.github/ISSUE_TEMPLATE/bug_report.yml')
    // Seed + schema version are the two fields that make a save-related bug reproducible;
    // both are visible on More -> About precisely so this form can ask for them.
    expect(bug).toContain('seed')
    expect(bug.toLowerCase()).toContain('schema')
    expect(existsSync(join(ROOT, '.github/ISSUE_TEMPLATE/feature_request.yml'))).toBe(true)
  })
})
