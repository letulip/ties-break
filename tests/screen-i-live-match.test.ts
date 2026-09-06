import { describe, it, expect } from 'vitest'
import { componentLogic, componentFile } from './worldSource'
// The marker helpers (R2-12). Every one of them THROWS on an absent marker instead of letting
// `indexOf`'s -1 reach a `slice` bound and widen the region to the rest of the file – the family
// this repo has been burned by, and which had bitten this very file (see the shout row below).
import { after, region, regionToLast } from './helpers/source'
import { readdirSync, readFileSync } from 'node:fs'
import { courtToCanvas, courtScale, type Viewport } from '../src/viz/geometry'
import { COURT } from '../src/viz/types'

// Screen I (docs/design/README.md §I, docs/specs/ui-inventory.md §4 Q2) – the live match, rebuilt
// onto the design and given the running commentary the owner ruled it was missing. These are
// source-shaped pins in the house style: they protect the DECISIONS, not the pixels.
const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** The SFC's <template> block, so a mention of a tag in a code comment is not mistaken for markup. */
const templateOf = (sfc: string): string => region(sfc, '<template>', '</template>')
/**
 * THE WHOLE template, as MARKUP ONLY.
 *
 * ⚠ WHY THIS EXISTS BESIDE `templateOf`, WHICH IS UNCHANGED. `templateOf` stops at the FIRST
 * `</template>`, and both of the big match SFCs use `<template v-if>` inside their markup –
 * MatchViewer's serve pill at line ~920, TournamentFlow's phase branches at ~604 – so it only ever
 * saw the top of those two files. Every pin above it is about something in that top region and each
 * one still reads exactly what it always read; the 30.07 pins below are about the header slot, the
 * pinned bar and the box score, all of which live past the cut. Same widening `redesign-home` and
 * `round13-nav` made for the same reason, and for the same reason it also strips HTML comments: the
 * notes in these templates QUOTE the strings that were removed ("Skip tournament", "Close ✕"), and a
 * pin that a comment can satisfy is not a pin.
 */
const markupOf = (sfc: string): string =>
  regionToLast(sfc, '<template>', '</template>').replace(/<!--[\s\S]*?-->/g, '')
/** The <style scoped> block with its comments stripped – prose about a colour is not a colour. */
const stylesOf = (sfc: string): string =>
  after(sfc, '<style scoped>').replace(/\/\*[\s\S]*?\*\//g, '')

// ⚠ THE PINNED CONTROL BAR IS ITS OWN COMPONENT SINCE R2-11 ("prop-driven controls/readout"), so the
// pins that used to read it out of the viewer read it where it lives. Two bindings, per CLAUDE.md's
// pin hygiene and `tests/pin-hygiene.test.ts`: `transport` widens to the SFC PLUS the composables it
// imports and is for POSITIVE claims only; `transportFile` is the `.vue` ALONE and is the only honest
// corpus for a negative claim or for slicing its markup and styles.
// ⚠ NOT CALLED `bar`: two tests below already bind that name to a slice of markup and assert
// negatively on it, and the hygiene guard is name-based and file-scoped.
const transport = componentLogic('components/MatchControls.vue')
const transportFile = componentFile('components/MatchControls.vue')

describe('screen I – the commentary is actually on the screen', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  // ⚠ RE-AIMED BY T-07 (05.09): a region CUT from `viewer` is as wide as `viewer`, so every
  // negative claim below reads the `.vue` alone. tests/pin-hygiene.test.ts follows one level now.
  const viewerFile = componentFile('components/MatchViewer.vue')

  // ⚠ ROUND 16 ITEM 14 (owner, 11.08: align the commentary bullets with the rail, nudge them left).
  // A SOURCE-SHAPED PIN, and deliberately so: this is pure layout arithmetic, happy-dom runs no layout
  // engine, and `tests/component/` therefore cannot see a two-pixel misalignment at all. What is
  // protected is the DECISION that closed the bug rather than the number - the rail and the dots used
  // to be placed by two unrelated mechanisms that happened to nearly agree (an absolute `left: 33px`
  // against a grid column's centre), and nearly is what the owner was looking at.
  it('the rail and the commentary dots are placed from ONE number, so they cannot drift apart', () => {
    const styles = stylesOf(viewerFile)
    // `region` makes BOTH halves loud. The hand-written `expect(at).toBeGreaterThan(-1)` this
    // replaces guarded the SELECTOR only; the closing `}` was unguarded, so a rule that lost its
    // brace would have run the block to the end of the stylesheet in silence. Same claim, both ends.
    const rule = (sel: string): string => region(styles, `${sel} {`, '}')
    // The custom property is declared once, on the list that owns the rail...
    expect(rule('.mv-log-list')).toMatch(/--mv-rail-x:\s*[\d.]+px/)
    // ...and BOTH the rail and the dot are positioned off it. Either one carrying a bare number is
    // the state this item was reported from.
    expect(rule('.mv-log-list::before'), 'the rail is back on a hand-written offset').toMatch(
      /left:\s*calc\(var\(--mv-rail-x\)/,
    )
    const dot = rule('.mv-beat-dot')
    expect(dot, 'the dot is centred in its grid column again, not placed on the rail').toContain(
      'justify-self: start',
    )
    expect(dot).toMatch(/margin-left:\s*calc\(var\(--mv-rail-x\)/)
    // ...and the arithmetic still refers to the grid it is placed in: column 1 (22px) + the gap (8px)
    // opens column 2 at 30px, and a 9px dot needs half of itself back. 30 + 4.5 = 34.5.
    expect(rule('.mv-beat')).toMatch(/grid-template-columns:\s*22px 12px/)
    expect(rule('.mv-beat')).toMatch(/gap:\s*8px/)
    expect(dot).toContain('34.5px')
    expect(dot).toMatch(/width:\s*9px/)
  })

  it('the viewer builds the commentary and renders it as the log', () => {
    // A derivation nobody calls is not a feature. The whole point of the slice is that the beats
    // reach the player, so the wiring is pinned as hard as the derivation itself.
    expect(viewer).toContain("from '../viz/commentary'")
    expect(viewer).toContain('buildCommentary(props.match')
    expect(viewer).toContain('mv-beat')
    expect(viewer).toContain('mv-beat-lead')
  })

  it('beats are revealed in step with the score, never all at once mid-match', () => {
    // `visibleBeats` filters on displayedPointIndex – the same cursor the score cells read – so a
    // beat cannot appear before the point it describes has been played on screen.
    expect(viewer).toMatch(/b\.pointIndex <= displayedPointIndex\.value/)
  })

  it('it REPLACES the point log rather than sitting beside it, and says why', () => {
    expect(viewer).toContain('REPLACES the point log')
  })
})

describe('screen I – the design and the rulings it has to keep', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  const viewerFile = componentFile('components/MatchViewer.vue')
  const sheet = read('../src/style.css')

  it('replay is the live match MINUS the blinking Live and MINUS shouting (ui-inventory §2)', () => {
    // Both affordances are gated on the same prop, in the template, so the replay cannot grow
    // either of them back by accident.
    expect(viewer).toMatch(/v-if="props\.mode === 'live' && !finished" class="mv-live"/)
    // ⚠ READ OFF `markupOf`, NOT THE RAW FILE, and only because of a comment. The gate moved from the
    // pill onto its row when Shout left (a row that holds one button does not need a `v-else`), and the
    // note explaining that sits between the two - more than the 120 characters this pattern allowed.
    // Comments are not markup: stripping them is what every other 30.07 pin in this file already does.
    // ⚠ RE-AIMED 30.07: the gate gained `&& finished`, and it is the line's own comment finally being
    // kept. "Watch again only means anything once the match is over" was written above this button and
    // was not true of it - it sat there through the whole replay. It has to be true now, because
    // TournamentFlow and PracticeFlow became replays in the same round and both already hand the player
    // a box score with a "Watch again" of their own the instant playback ends. The protected fact is
    // unchanged and narrower: the re-watch belongs to the ONE caller that has no screen after the match.
    // ⚠ RE-AIMED R17 #10, AND THE GATE GOT STRONGER AGAIN FOR THE REASON ABOVE. "The instant playback
    // ends" is no longer true: a caller that names a `proceedLabel` keeps the viewer on screen until
    // the player presses it, so on a re-watch this button WOULD have appeared beside Proceed - which
    // is exactly the duplication the paragraph above forbids. The condition it grew says so directly.
    expect(markupOf(viewer)).toMatch(
      /v-if="props\.mode === 'replay' && finished && !props\.proceedLabel"[\s\S]{0,200}Watch again/,
    )
    // ⚠ RE-AIMED 30.07, AND THE GATE GOT STRONGER RATHER THAN WEAKER. Shout used to be the `v-else`
    // of the "Watch again" branch, so "the replay does not shout" was true only as a side effect of
    // the two sharing one row. The owner moved it into the pinned bar («на экране live матча кнопку
    // shout тоже надо оставить в sticky блоке»), which broke that pairing - so it now carries the
    // condition ITSELF, and it is the same condition the Live badge above is pinned on. The protected
    // fact is word for word §2's: the replay is the live match minus the blinking Live and minus
    // shouting. What changed is that the two halves are now gated identically instead of one of them
    // leaning on the other's markup.
    // ⚠ RE-AIMED AGAIN, 30.07, AND THE STRING IT MATCHED ON IS GONE ON PURPOSE. It read
    // `title="Coming in Phase 6"`, which was the disabled placeholder's tooltip; the owner asked for
    // the real control («можем какой-то набор фраз в дропдаун селект сделать и кнопку рядом. Выбрал,
    // крикнул»), so the placeholder is a phrase picker plus a verb and has no such title. The GATE is
    // what §2 is about and the gate is untouched - `props.mode === 'live' && !finished`, the Live
    // badge's own condition, now carried by the row that holds both halves of the control.
    // ⚠ RE-AIMED (R2-11), AND THE GATE IS NOW TWO HALVES IN TWO FILES – so both are pinned, which is
    // strictly more than the one line was saying. The bar is a prop-driven leaf
    // (`MatchControls.vue`); the viewer decides that this is a live match, the bar decides that the
    // row is therefore drawn. §2's fact is untouched: a replay has no shout.
    expect(viewerFile, 'the viewer stopped telling the bar which kind of match this is').toMatch(
      /:live="props\.mode === 'live'"/,
    )
    expect(transportFile).toMatch(/v-if="live && !finished" class="mv-shout"/)
    // Read off `markupOf` for the reason this file's own header gives: the ⚠ note that replaced the
    // placeholder QUOTES its tooltip, and a pin a comment can satisfy is not a pin.
    expect(markupOf(viewerFile), 'the placeholder tooltip outlived the placeholder').not.toContain(
      'Coming in Phase 6',
    )
    expect(markupOf(transportFile), 'the placeholder tooltip came back with the bar').not.toContain(
      'Coming in Phase 6',
    )
    expect(transportFile).toContain('Shout 📣')
  })

  // ⚠ ADDED 30.07. `mode` had a DEFAULT of `'live'`, added in round 4 "so existing call sites need no
  // change", and the convenience shipped a lie: TournamentFlow mounted the viewer with no `mode` at
  // all, so the busiest match screen in the app blinked a red "Live" over a bracket the engine had
  // already resolved during the tick. A prop whose default is wrong for three of its four callers is
  // the trap, so there is no default - the compiler asks every caller instead.
  it('`mode` has no default, so no call site can claim to be live by forgetting to say', () => {
    expect(viewer).toMatch(/^\s*mode: 'live' \| 'replay'$/m)
    const defaults = /withDefaults\([\s\S]*?\{([^}]*)\},\s*\)/.exec(viewerFile)?.[1] ?? ''
    expect(defaults.length, 'the defaults object was not found').toBeGreaterThan(10)
    expect(defaults, 'mode is back in the defaults').not.toContain('mode')
    // ⚠ RE-AIMED, AND ON THE OWNER'S OWN DEFINITION OF THE WORD (30.07): «Для меня live это "watch
    // it" и без вариантов, всё остальное replay». This pin used to require that exactly ONE caller
    // say 'live' - the sandbox - on the reading that a pre-resolved match is never live. His reading
    // is cleaner and it is the one the game now uses: LIVE MEANS THE PLAYER HAS NOT SEEN IT YET. The
    // engine has always decided first, for every surface but the sandbox, so "has the engine decided"
    // was never the distinction a player could feel; "have I seen this" is.
    //
    // THE PROTECTED FACT IS UNCHANGED and is the one that caught the original bug: no caller may be
    // live BY SILENCE. Every one still states its mode, and a re-watch is still never live. What
    // moved is that TournamentFlow is allowed to be BOTH, chosen by `replayAdvances` - a first watch
    // of a round is live, the box score's "Watch again" is not.
    const modes = new Map<string, string[]>()
    for (const rel of [
      '../src/components/TournamentFlow.vue',
      '../src/components/PracticeFlow.vue',
      '../src/components/MatchReplay.vue',
      '../src/components/screens/SeasonScreen.vue',
    ]) {
      const m = markupOf(read(rel))
      expect(m, `${rel} says which mode it is`).toMatch(/(:mode="|mode=")/)
      // ⚠ Read the MODE ATTRIBUTES ONLY. A looser sweep for the quoted words also catches the
      // `mv-live` class and any comment that names them, which is how this pin first came out
      // claiming a replay screen was live.
      modes.set(
        rel,
        [...m.matchAll(/:?mode="([^"]*)"/g)].flatMap((x) => [...x[1].matchAll(/(live|replay)/g)].map((y) => y[1])),
      )
    }
    // The sandbox is unconditionally live - it simulates at the moment the button is pressed.
    expect(modes.get('../src/components/screens/SeasonScreen.vue')).toEqual(['live'])
    // A replay and a friendly's re-watch are never live.
    expect(modes.get('../src/components/MatchReplay.vue')).toEqual(['replay'])
    expect(modes.get('../src/components/PracticeFlow.vue')).toEqual(['replay'])
    // ...and the tournament round decides per watch, off the flag that already knew.
    expect(markupOf(read('../src/components/TournamentFlow.vue'))).toMatch(
      /:mode="replayAdvances \? 'live' : 'replay'"/,
    )
  })

  // ⚠ ADDED 30.07 (owner: «можем какой-то набор фраз в дропдаун селект сделать и кнопку рядом.
  // Выбрал, крикнул»). Two facts, and the second one is the load-bearing one.
  it('the shout is a picker plus a verb, and it never enters buildCommentary', () => {
    // ⚠ RE-AIMED (R2-11): the row is `MatchControls.vue`'s markup now, and its neighbour below is the
    // skip link rather than `.mv-actions` (which stayed with the viewer). The two facts are the same
    // two: a real dropdown, and a verb beside it that shouts.
    // ⚠⚠ RE-AIMED 24.08, AND THE OLD END MARKER WAS NEVER THERE. The end read `class="mv-skip"`;
    // the skip link is written `class="link mv-skip"` – it takes the shared `.link` skin – so
    // `indexOf` returned -1 for the whole life of this pin, `slice(start, -1)` ran to one character
    // before the end of the markup, and "the shout row" was in fact the shout row PLUS the skip
    // button PLUS the bar's closing tags (414 chars where the row is 335). Green throughout, because
    // both claims below are positive and both needles live in the first third of the widened text.
    // This is the -1 slice CLAUDE.md lists, caught by `region` on its first pass over this file.
    // NOTHING ASSERTED HERE CHANGES – the two facts are still "a real dropdown" and "a verb beside
    // it", and both still hold on the narrowed row; what changes is that the pin now reads the row
    // it names, and dies loudly if the skip link is renamed again.
    const markup = markupOf(transportFile)
    const row = region(markup, 'class="mv-shout"', 'class="link mv-skip"')
    expect(row, 'the phrases are a real dropdown').toMatch(/<select v-model="shoutPhrase"/)
    expect(row, 'and a button beside it').toMatch(/<button class="mv-shout-go"[^>]*@click="\$emit\('shout'\)"/)
    // ...and the phrase the picker writes goes UP to the viewer, which owns the pool and the log.
    expect(transportFile).toMatch(/'update:shoutPhrase': \[string\]/)
    // A handful, in the parent's voice, short dash only and no Cyrillic in copy the player reads.
    const pool = /const SHOUT_PHRASES = \[([\s\S]*?)\] as const/.exec(viewer)?.[1] ?? ''
    const phrases = [...pool.matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(phrases.length, 'a handful, not a phrasebook').toBeGreaterThanOrEqual(4)
    expect(phrases.length).toBeLessThanOrEqual(8)
    for (const p of phrases) {
      expect(p, `"${p}" uses the long dash`).not.toContain('—')
      expect(p, `"${p}" has Cyrillic in player-facing copy`).not.toMatch(/[Ѐ-ӿ]/)
      // docs/lore/setting.md §3, and the six phrases tests/travel-home.test.ts already bans from this
      // family's mouth. A shout notices her; it does not console her and it does not grade her.
      expect(p, `"${p}" is consolation`).not.toMatch(
        /\bwell played\b|\bgood effort\b|\bproud of\b|\bnext time\b|\bunlucky\b|\bso close\b/i,
      )
    }
    // ⚠ THE ONE THAT MATTERS. `buildCommentary` is a pure function of the match with a determinism pin
    // on it - the same match must narrate identically, every replay, forever - and a button press is
    // not match data. So the shout may reach the LOG but never that function: the two lists meet in
    // `visibleRows`, at display time, and nowhere earlier.
    expect(viewerFile).toMatch(/buildCommentary\(props\.match/)
    expect(viewerFile, 'a shout was fed into the deterministic narrator').not.toMatch(
      /buildCommentary\([^)]*shout/i,
    )
    const commentary = read('../src/viz/commentary.ts')
    expect(commentary.toLowerCase(), 'the pure narrator learned about shouting').not.toContain('shout')
    // and a fresh watch starts with an empty mouth: the shouts belong to the run, not to the match.
    expect(viewer).toMatch(/shouts\.value = \[\]/)
  })

  it('the controls are the app\'s segmented control, not two <select>s', () => {
    // ⚠ RE-AIMED (R2-11) AND MADE STRICTER RATHER THAN LOOSER. The claim used to be "the viewer's
    // template has no `<select>`", which is now trivially true of a file that has no controls in it
    // at all. It is stated where the controls are, plus the one `<select>` that IS legitimate: the
    // shout's phrase picker, which is a finding rather than a choice (see its own note in the bar).
    expect(templateOf(viewerFile), 'a raw select came back to the screen').not.toContain('<select')
    expect(transportFile).toContain("import SegmentedRow from './ui/SegmentedRow.vue'")
    expect((markupOf(transportFile).match(/<select/g) ?? []).length, 'the plates went back to selects').toBe(1)
    expect(markupOf(transportFile)).toContain('class="mv-shout-pick"')
    // Values, never indices – SegmentedRow's contract, and speed is a number so it needs an adapter.
    expect(transportFile).toContain('speedSeg')
  })

  it('the match panel is the shared Card, and the screen owns no colour of its own', () => {
    expect(viewer).toContain("import Card from './ui/Card.vue'")
    expect(viewer).toMatch(/<Card variant="photo" class="mv-panel">/)
    // One accent, and it arrives as a token. No hex, no eyedropper, no second lime, and no
    // hand-mixed alpha either – the two white-alpha tokens the sheet declares cover what the
    // export spells out as rgba(255,255,255,.05)/.03.
    const styles = stylesOf(viewerFile)
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(styles).not.toMatch(/rgba?\(\s*\d/)
  })

  it("the viewer's rules left the shared sheet for the component's scoped block", () => {
    // U0's rule: a screen's styles are the screen's business. `.viewer*` / `.prob-*` /
    // `.score-line` were one component's rules living in shared vocabulary.
    for (const dead of ['.viewer {', '.viewer-canvas {', '.viewer-readout {', '.prob-bar {', '.score-line {']) {
      expect(sheet, `${dead} should be gone from the sheet`).not.toContain(dead)
    }
    expect(viewer).toContain('<style scoped>')
    expect(templateOf(viewer)).toContain('class="mv-panel"')
    expect(stylesOf(viewer)).toContain('.mv-court')
  })

  it('best-of-THREE set cells, because that is the only format the engine plays', () => {
    // The export draws four boxes; a fourth would be a permanently empty dash claiming a format
    // we do not have. Deliberate deviation, pinned so it is not "fixed" back to the mockup.
    expect(viewer).toContain('const SET_CELLS = 3')
    expect(viewer).toContain('bo3')
  })

  it('NOTHING overlaps the playing surface: the court has a run-off band big enough for its furniture', () => {
    // Owner, 29.07: «над и под полем больше воздуха ... чтобы плашка live на поле не заходила».
    // The canvas size is read OUT OF THE COMPONENT, so this cannot pass against a version that
    // quietly went back to 2:1.
    const w = Number(/const CSS_W = (\d+)/.exec(viewer)?.[1])
    const h = Number(/const CSS_H = (\d+)/.exec(viewer)?.[1])
    expect(Number.isFinite(w) && Number.isFinite(h)).toBe(true)
    const vp: Viewport = { width: w, height: h }

    // 1. The court is WIDTH-bound, which is what makes the air free: a taller canvas adds run-off
    //    without moving a court pixel. If this ever flips to height-bound, raising CSS_H would
    //    start SHRINKING the court instead, silently.
    const widthArm = (w * (1 - 2 * 0.08)) / (COURT.halfLength * 2)
    expect(courtScale(vp)).toBeCloseTo(widthArm, 6)
    // and therefore the drawn court is identical to the old 2:1 canvas's:
    expect(courtScale(vp)).toBeCloseTo(courtScale({ width: w, height: w / 2 }), 6)

    // 2. The run-off band above the painted surface, in internal px and on a 375pt phone (where
    //    the canvas renders about 299 CSS px wide). The furniture in that band - the Live badge
    //    and the weather plate - is ~19px tall at `top: 6px`, so it needs about 25 and gets more.
    //    ⚠ 31.07: THE BOTTOM BAND IS FURNISHED TOO NOW - the score counter, at `bottom: 6px`, the
    //    mirror of the row above. The symmetry assertion at the end of this test is what makes one
    //    measurement cover both, and it is why the counter could take the band without a second
    //    arithmetic: the same ~19px of reading in the same ~34px of run-off.
    //    ⚠ AND THE SERVE SPEED JOINED IT AT THE BAND'S ENDS (owner, after playing). It shares the
    //    counter's single line and is SMALLER than it (12px against 15px, see `.mv-speed`), so the
    //    band's tallest furniture is still the counter and the arithmetic above is still the whole
    //    arithmetic. That size relation is what this pin depends on, so it is asserted rather than
    //    assumed - a speed that grew past the score would be a second measurement to make.
    const surfaceTop = courtToCanvas({ x: -COURT.doublesHalfWidth, y: 0 }, vp).y
    const bandOnPhone = surfaceTop * (299 / w)
    expect(bandOnPhone, `run-off is only ${bandOnPhone.toFixed(1)} CSS px on a 375pt phone`).toBeGreaterThan(30)
    // Symmetric, so the bottom has the same air the owner asked for.
    expect(surfaceTop).toBeCloseTo(h - courtToCanvas({ x: COURT.doublesHalfWidth, y: 0 }, vp).y, 6)

    // ...and the bottom band's tallest reading is still the score counter, which is what lets the
    // one measurement above stand for both bands (see the ⚠ note).
    const styles = stylesOf(viewerFile)
    const sizeIn = (rule: string): number => {
      const block = region(styles, rule, '}')
      return Number(/font-size: ([\d.]+)px/.exec(block)?.[1])
    }
    expect(sizeIn('.mv-speed {')).toBeLessThan(sizeIn('.mv-score {'))
  })

  it('the "Changing ends" pill left the middle of the court for the run-off band', () => {
    // It used to be drawn at the canvas centre - which is the net, the most-watched square inch on
    // the screen - covered for 0.9s at every change of ends.
    const renderer = read('../src/viz/courtRenderer.ts')
    expect(renderer).toContain('const surfaceTop = courtToCanvas')
    expect(renderer).not.toMatch(/const cy = vp\.height \/ 2/)
  })

  it('the weather plate is one line, off the court, and shares the Season card\'s plate', () => {
    // Owner, 29.07: the decorative temperature that already ships on the Season card, in one line
    // and off the playing surface. Not re-derived here - it arrives as a prop.
    // ⚠ RE-AIMED 31.07 ONLY IN ITS SLICE, and the protected fact is untouched. The plate lost its
    // `class="mv-weather"` when the two pieces of top-band furniture became one centred row (owner:
    // «align the weather element and move it down so it sits on the same line as live»), so the two
    // absolute offsets that class carried belong to the row now. What this test is for - one line,
    // off the surface, the Season card's own plate, never re-derived - reads exactly as it did.
    expect(viewer).toContain("import WeatherPlate from './ui/WeatherPlate.vue'")
    expect(templateOf(viewer)).toContain('<WeatherPlate v-if="temperatureC != null"')
    expect(viewer).toContain('temperatureC?: number | null')
    // The number must never be computed twice: the view may not reach for the engine's generator.
    // (Prose about it in the prop's own comment is the point; an IMPORT of it would be the bug.)
    expect(viewerFile).not.toMatch(/import[\s\S]{0,80}eventTemperature/)
    expect(viewerFile).not.toMatch(/eventTemperature\(/)
    const plate = read('../src/components/ui/WeatherPlate.vue')
    // Wind does not exist in the engine in any form, so no wind figure may appear here.
    expect(plate).not.toMatch(/m\/s|km\/h|mph/)
  })

  it('the elapsed clock measures the MATCH, and is derived rather than invented', () => {
    // ⚠ R17 #24 – THE ITEM IS THIS PIN'S OWN PREMISE BEING OVERTURNED, so read the note below before
    // the assertions. The rule was "the engine has no time model, so a clock would be a number we
    // made up", and it was right for as long as nothing derived one. The owner asked for the elapsed
    // time between the Live badge and the weather, and the brief set the terms a clock has to meet to
    // be honest: correlate with a real match, and advance at different rates at ×1/×2/×4.
    // `viz/matchClock.ts` is that derivation - rally shots, changeovers and set breaks, measured
    // against 400 matches - and it is the same number the box score's duration prints.
    // WHAT SURVIVES UNCHANGED is the thing the old pin actually protected: nothing on this screen may
    // print a reading it cannot derive. So the assertions below say the clock comes from the module
    // and the export's LABEL is still refused - "Match time" belongs to a wall clock over a fixture
    // list, and this is not one.
    expect(viewer).toContain("import { buildClockTrack, clockSecondsAt, formatMatchClock")
    expect(templateOf(viewer)).toContain('class="mv-clock num"')
    // The reading is a function of the PLAYBACK POSITION, which is the whole of the speed half: this
    // file must not reach for `speed` to scale it, or the clock would be two implementations of one
    // rate and they would disagree the first time either moved.
    // ⚠ BOTH NEGATIVES READ `viewerFile`, THE .vue ALONE - `tests/pin-hygiene.test.ts` enforces it and
    // it is right to: the claim is about what this FILE does not do, and the widened corpus would
    // trip on a composable that legitimately mentions the speed.
    const mirror = after(viewerFile, 'elapsedMatchSeconds.value =')
    expect(mirror.slice(0, 120), 'the clock was scaled by hand instead of read off the clock').not.toContain('speed')
    // The engine still has no time model of its own - the derivation is presentation, and it lives in
    // viz/. A clock built out of WALL-CLOCK seconds would be the invented number all over again.
    expect(viewerFile).not.toMatch(/Date\.now\(\)|performance\.now\(\)[\s\S]{0,40}elapsed/)
    // ⚠ AND THE BOTTOM BAND KEEPS THE SCORE, which is the half of the old pin that is untouched. The
    // export gave the bottom slot to its wall clock; ours carries the live game score there and the
    // point total once the match is over, and the elapsed time went to the TOP band where the owner
    // asked for it. Two readings, two bands, neither displacing the other.
    expect(viewer).toContain('gameScore')
    expect(viewer).toContain('The export gives this slot to a wall clock')
    // Read off the MARKUP, for this file's own standing reason: `gameScore`'s doc comment QUOTES the
    // export's label to explain why we do not print it, and a pin a comment can satisfy is not a pin.
    expect(markupOf(viewerFile), 'the export\'s own label came back with it').not.toContain('Match time')
  })
})

// =====================================================================================================
// The owner's 30.07 playtest of watching a match: the chrome around the court, and the two controls he
// could not name. Six items, and five of them are one theme – rows of furniture between the header and
// the playing surface. These pins protect what each row's REMOVAL rests on, so a future slice cannot
// put a row back by accident or take the guarantee out from under the pinned bar.
// =====================================================================================================
describe('the pinned control bar can never reach the playing surface', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  // ⚠ RE-AIMED BY T-07 (05.09): a region CUT from `viewer` is as wide as `viewer`, so every
  // negative claim below reads the `.vue` alone. tests/pin-hygiene.test.ts follows one level now.
  const viewerFile = componentFile('components/MatchViewer.vue')
  it('is sticky rather than fixed, so it costs no height until it would otherwise be gone', () => {
    // Owner: «maybe we need to make lower buttons on match screen fixed so we could use them
    // anytime?». Measured at 375pt: the row starts on screen at y=636 and is pushed to y=806 – off
    // the bottom – once the commentary log fills to its four rows. A `position: fixed` bar would
    // have bought that back by charging its height for the whole watch; sticky charges nothing.
    // ⚠ RE-AIMED (R2-11): the rule moved into `MatchControls.vue`'s own scoped block with its markup.
    // It HAD to move rather than staying behind – a parent's scoped selector reaches a child's root
    // but nothing under it, so `.mv-seg`, `.mv-shout*`, `.mv-skip` and the `:deep` pill trim would all
    // have stopped applying. The measurement in the rule's comment is unchanged.
    const styles = stylesOf(transportFile)
    const bar = region(styles, '.mv-controls {', '.mv-seg {')
    expect(bar).toContain('position: sticky')
    expect(bar).toContain('bottom: 0')
    expect(bar).not.toContain('position: fixed')
    // It needs an opaque floor, or the log scrolls THROUGH it instead of under it.
    expect(bar).toMatch(/background: var\(--[a-z0-9-]+\)/)
  })

  it('lives in a containing block that starts BELOW the panel that holds the court', () => {
    // ⚠ THIS IS THE WHOLE GUARANTEE, and it is structural rather than arithmetical. A sticky element
    // cannot travel outside its containing block, so as long as `.mv-controls` sits inside
    // `.mv-below` – whose first child is the log, strictly after `.mv-panel` – the bar cannot reach
    // the court at ANY viewport height. Flatten the wrapper and the bar inherits `.mv`'s box, whose
    // top edge IS the top of the court; on a short enough viewport it would then pin over the
    // playing surface, which is the one rule this screen does not bend (owner, 29.07).
    const markup = markupOf(viewerFile)
    const panelAt = markup.indexOf('class="mv-panel"')
    const belowAt = markup.indexOf('class="mv-below"')
    const logAt = markup.indexOf('class="mv-log"')
    // ⚠ RE-AIMED (R2-11): the bar is a child component, so what the viewer's markup shows is where it
    // is MOUNTED – which is precisely what this test is about. A sticky element cannot leave its
    // containing block, and the containing block is decided by where the tag sits, not by which file
    // the tag's insides live in.
    const barAt = markup.indexOf('<MatchControls')
    expect(panelAt, 'the panel is still the first thing in the viewer').toBeGreaterThan(-1)
    expect(belowAt, 'the sticky bar still has its own containing block').toBeGreaterThan(panelAt)
    // The log opens the wrapper, so the wrapper's top edge IS the log's top edge – below the panel.
    expect(logAt, 'the log is the wrapper\'s first child').toBeGreaterThan(belowAt)
    expect(barAt, 'the bar is inside .mv-below, after the log').toBeGreaterThan(logAt)
    // ...and it really is the sticky bar that was mounted there, not a renamed something else.
    expect(stylesOf(transportFile), 'the mounted child is not the sticky bar').toMatch(
      /\.mv-controls \{[^}]*position: sticky/,
    )
    // ⚠ RE-AIMED 12.08: the box score used to be pinned inside the wrapper here, after the bar; the
    // owner had that panel deleted («не нужна всё»), and it may not grow back - the guarantee this
    // test protects (the bar cannot reach the court) never rested on it.
    expect(markup.indexOf('class="mv-boxscore"'), 'the deleted box score grew back').toBe(-1)
    expect(stylesOf(viewer)).toContain('.mv-below {')
  })

  it('⚠ ...and the block sits on the FLOOR of the screen, with the log as the only row that gives', () => {
    // ⚠ ADDED 06.08 (owner: «давай вообще этот блок full/key/speed/shout кнопок внизу экрана в матче
    // закрепим просто, а текстовая трансляция будет до него "разворачиваться"») - and the reason it
    // is a separate fact from `position: sticky` above is that sticky did not deliver it. Sticky only
    // bites when the bar would otherwise be BELOW the fold; on a tall phone it never is, so the block
    // sat wherever the log's last row left it. MEASURED AT 576x1280, his own screen, before this:
    // the block ended at y=1110 with 170px of empty scroller under it. After: log 568->1120 (its
    // content 617px, so it scrolls inside itself), block 1120->1256, and `.tf-body` no longer
    // scrolls at all (scrollHeight === clientHeight === 1206).
    //
    // The guarantee is a chain of four rules and every link is load-bearing, so all four are pinned:
    // the viewer grows into the takeover's column, the wrapper takes what is left, the log is the one
    // flexible row, and `min-height: 0` is what lets a long log scroll inside itself instead of
    // pushing the block back off the bottom.
    const styles = stylesOf(viewerFile)
    // `region` makes BOTH halves loud. The hand-written `expect(at).toBeGreaterThan(-1)` this
    // replaces guarded the SELECTOR only; the closing `}` was unguarded, so a rule that lost its
    // brace would have run the block to the end of the stylesheet in silence. Same claim, both ends.
    const rule = (sel: string): string => region(styles, `${sel} {`, '}')
    expect(rule('.mv')).toMatch(/flex:\s*1/)
    expect(rule('.mv'), 'without this the log cannot shrink and the block is pushed off').toMatch(
      /min-height:\s*0/,
    )
    expect(rule('.mv-below')).toMatch(/flex:\s*1/)
    expect(rule('.mv-below')).toMatch(/min-height:\s*0/)
    const log = rule('.mv-log')
    expect(log, 'the log is not the row that gives').toMatch(/flex:\s*1/)
    expect(log, 'a log that cannot scroll inside itself pushes the block away').toMatch(
      /overflow-y:\s*auto/,
    )
    // ...and the furniture around it does NOT give, or the court and the box score would shrink
    // alongside it in a deficit.
    expect(styles).toMatch(/\.mv-panel,[\s\S]{0,120}\{\s*flex:\s*none/)
  })

  it('⚠ "Skip" left the view switch for a control that says what it does', () => {
    // Owner, 06.08: «а skip оттуда из этого переключателя вообще надо убрать - оно полностью матч
    // пропускает, это вообще неявно в этом месте». Full and Key are two answers to "how much of this
    // match do I watch"; skipping ends the watching, and a segmented control's third pill is the last
    // place a player expects to lose the whole match.
    // THE CAPABILITY IS NOT GONE and this pins that too - `viewMode` still takes 'skip', so every
    // path that reads it (jumpToEnd, retimeForMode's exemption, More's default-view picker) is
    // reached exactly as before. What is pinned is that the door is named and that it is inside the
    // block, where a control you reach for mid-match belongs.
    // ⚠ RE-AIMED (R2-11): the option tables and the skip link are the transport's. The capability's
    // own line changed SHAPE and not meaning – the bar no longer holds the ref, it says what the
    // player chose – so the pin follows it to the emit. Every path that reads `viewMode` is untouched.
    const options = region(transportFile, 'const VIEW_OPTIONS', 'const SPEED_OPTIONS')
    expect(options).toContain("value: 'full'")
    expect(options).toContain("value: 'key'")
    expect(options, 'skip is back in the view switch').not.toContain("value: 'skip'")
    const bar = markupOf(transportFile)
    expect(bar).toContain('mv-skip')
    expect(bar).toContain('Skip to the result')
    expect(transport, 'the skip capability itself was deleted rather than moved').toContain(
      "emit('update:view', 'skip')",
    )
    // ...and the viewer still accepts it, so the door leads somewhere.
    expect(viewer, "the screen stopped honouring 'skip'").toContain("viewMode.value === 'skip'")
  })

  it('pins everything you reach for mid-rally, and nothing you do not', () => {
    // ⚠ RE-AIMED 30.07 (owner: «на экране live матча кнопку shout тоже надо оставить в sticky блоке»).
    // The old line drew the boundary at SETTINGS-vs-ACTIONS and pinned Shout OUT of the bar on that
    // basis. He looked at it and the category was the wrong one: the real test is whether you would
    // reach for the control WHILE A POINT IS BEING PLAYED, which is why the speed and the view are
    // pinned in the first place - and shouting at your kid is the most mid-rally thing on the screen.
    // Left outside is exactly what fails that test: "Watch again" cannot be wanted before the match
    // has finished, and it only exists in replay mode at all. So the protected fact is the same one,
    // stated by the criterion that actually decided it, and the bar still is not a dumping ground.
    // ⚠ THE SLICE IS THE PLAYING BAR, AND SINCE 12.08 THAT MATTERS. `class="mv-controls"` matches
    // only the `v-else` row - the finished one is `class="mv-controls mv-controls-done"` - so this
    // reads the bar as it stands DURING a match, which is what the criterion above is about. The
    // finished row is a different question and its own answer: the owner asked for `Watch again |
    // Proceed` there («2 кнопки рядом просто в этом нижнем блоке с контролами»), so "Watch again is
    // not in the bar" is true of the bar you watch a match through and deliberately not of the bar
    // you are left with. tests/component/match-viewer.test.ts pins the finished row's own contents.
    // ⚠ RE-AIMED (R2-11): the bar's markup is `MatchControls.vue`'s. The slice still lands on the
    // PLAYING row - `class="mv-controls"` matches only the `v-else`, since the finished one is
    // `class="mv-controls mv-controls-done"` - and it now runs to the end of that file, because
    // `.mv-actions` stayed behind with the viewer. "Watch again is not in the playing bar" is
    // therefore still a real claim: the finished row above the slice has one, and it is excluded.
    const markup = markupOf(transportFile)
    const bar = after(markup, 'class="mv-controls"')
    expect(bar).toContain('viewSeg')
    expect(bar).toContain('speedSeg')
    expect(bar).toContain('Shout')
    expect(bar).not.toContain('Watch again')
    expect(markup, 'the slice is vacuous - the finished row has no Watch again to exclude').toContain(
      'Watch again',
    )
    // ...and it is ONE sticky block, not a bar with a loose row under it: the shout is a SECOND ROW
    // of `.mv-controls` rather than a sibling that scrolls away on its own, which is the whole
    // complaint. Pinned as a full-bar cell, because the flex version of this silently failed - a
    // `max-width` clamp feeds the hypothetical main size, so all three controls shared one line and
    // the two plates were squeezed to 109px. See the rule's own note for the measurement.
    const styles = stylesOf(transportFile)
    expect(styles).toMatch(/\.mv-controls\s*\{[^}]*display:\s*grid/)
    expect(styles).toMatch(/\.mv-shout\s*\{[^}]*grid-column:\s*1 \/ -1/)
  })

  it('...and its floor reaches the bottom, because the takeover stopped padding its scrollport', () => {
    // ⚠ ADDED 31.07 (owner: «the bottom buttons float in the air: there is unpainted space beneath
    // them through which the text commentary shows. Paint it»). The bar HAS an opaque floor and
    // always did - the floor stopped 24px early.
    //
    // MEASURED IN CHROME ON THE SHIPPED LAYOUT: `position: sticky; bottom: 0` pins against the scroll
    // container's CONTENT box, not the scrollport, so `.tf-body`'s 24px of bottom padding left the
    // pinned bar 24.0px short of the visible bottom edge - and padding does not clip, so the log went
    // on scrolling through that strip under the bar (`elementFromPoint` 12px below the bar returned a
    // commentary row). The fix is in the SHEET rather than in the viewer, because a painted skirt on
    // the bar would have to match the gap exactly or cover the box score that follows it on a
    // finished match. Take the room off the scrollport and no sticky child of any takeover can have a
    // gap under it at any viewport height.
    //
    // THE ROOM MUST SURVIVE THE MOVE, which is the half a careless "fix" would drop: measured before
    // and after, scrollHeight 839 -> 839, and the last card still stands 24.2px off the bottom edge.
    const sheet = read('../src/style.css')
    const body = after(sheet, '.tf-body {\n  padding-bottom')
    expect(body, 'the scrollport is padding the bottom again').toMatch(/^\.tf-body \{\s*padding-bottom: 0;/)
    // ...and the room it gave up is back as content, so nothing is flush against the bottom edge.
    expect(sheet).toMatch(/\.tf-body::after \{[\s\S]*?height: 24px/)
    expect(sheet, 'the spacer would add the column gap on top of the room').toMatch(
      /\.tf-body::after \{[\s\S]*?margin-top: -16px/,
    )
    // The cancelled gap has to BE the gap, or the room silently becomes 24 + whatever it really is.
    expect(sheet).toMatch(/\.tf-body \{[^}]*gap: 16px/)
    // The wizard shares the base rule and has no sticky children, so it keeps its padding - the
    // override is `.tf-body`'s alone.
    expect(sheet).toMatch(/\.onboarding-body,\s*\n\.tf-body \{[^}]*padding: 8px 24px 24px/)
    expect(sheet).not.toContain('.onboarding-body::after')
  })

  it('the segmented labels fit the bar, so "Skip" cannot render as "Ski" again', () => {
    // Both rows want ~359px of pill at the sheet's 16px-a-side `.tab-pill` padding; inside a
    // .tf-card on a 375pt phone they get 293px, and the view row used to overflow its half and
    // paint over the speed plate. Trimmed for THIS bar only – the sheet's own padding is untouched,
    // and so is every other SegmentedRow.
    const styles = stylesOf(transportFile)
    expect(styles).toMatch(/\.mv-controls :deep\(\.tab-pill\)/)
    expect(read('../src/style.css'), 'the shared pill padding stays the shared pill padding').toContain(
      'padding: 6px 16px',
    )
  })

  it('the pills divide their plate instead of bunching at its left-hand end', () => {
    // ⚠ ADDED 31.07 (owner: «the speed and brevity buttons are bunched to the left of their plates -
    // distribute them evenly across the plate, and make it tidy»). It is the previous test's own
    // headroom, seen from the other side: `.tab-row` is a plain flex row and `.tab-pill` is
    // content-sized, so the ~52px the padding trim recovered became empty plate at the right-hand end
    // of each row - and, because "Full/Key/Skip" and "1x/2x/4x" are different widths, the two rows did
    // not even run out at the same place.
    const styles = stylesOf(transportFile)
    expect(styles).toMatch(/\.mv-controls :deep\(\.tab-pill\) \{[^}]*flex: 1/)
    // THE TRIM IS LOAD-BEARING UNDER `flex: 1`, not leftover: a flex item's automatic minimum size is
    // its content size, so the padding no longer sets the pill's width but still sets the width below
    // which it refuses to shrink. At the sheet's 16px that floor is the ~359px that overflowed in the
    // first place. Deleting the trim as "redundant now" would put the overflow straight back.
    expect(styles).toMatch(/\.mv-controls :deep\(\.tab-pill\) \{[^}]*padding-left: 9px/)
    // SCOPED, like the padding: `.tab-row`/`.tab-pill` have five callers, and the draw's round tabs
    // deliberately opt OUT of flexing because they scroll horizontally instead.
    expect(read('../src/style.css'), 'the shared plate learned to flex').not.toMatch(
      /\.tab-pill \{[^}]*flex:/,
    )
    expect(read('../src/components/BracketTabs.vue')).toMatch(
      /\.bt-tabs :deep\(\.tab-pill\) \{[^}]*flex: 0 0 auto/,
    )
  })
})

describe('one header slot per match screen, and it says where it takes you', () => {
  const flow = read('../src/components/TournamentFlow.vue')
  const practice = read('../src/components/PracticeFlow.vue')
  const replay = read('../src/components/MatchReplay.vue')

  /**
   * THE HEADER'S SUB LINE, WHEREVER IT IS WRITTEN.
   *
   * ⚠ ADDED 30.07 BECAUSE THE LANDMARKS MOVED, AND ONLY THE LANDMARKS. Two pins below used to slice
   * their file between `class="tf-sub"` and `</header>` - both of which were markup in TournamentFlow
   * until `ui/TakeoverShell.vue` took the header away from all four match surfaces (owner: one
   * component, no needless duplication). The `.tf-sub` element and the `</header>` tag still exist,
   * once, in the shell; what a CALLER writes now is a `#sub` slot. So this reads the slot, and the
   * facts underneath are checked exactly as they were.
   *
   * ⚠ AND THE SLOT ITSELF CAN CARRY A CONDITION NOW (R17 #9). The tournament draws no sub line at all
   * while a match is on screen, so its opening tag is `<template v-if="…" #sub>` - the landmark moved
   * again, and again only the landmark. Matching the `#sub>` end of the tag rather than a fixed
   * prefix is what makes this survive the next attribute somebody puts on it.
   */
  // ⚠ THE START IS A REGEX, so it cannot be handed to `region` as a marker – the MATCHED TAG TEXT
  // is, which is the same landmark and keeps the note above true. The END was the unguarded half:
  // `m.indexOf('</template>', at)` returning -1 would have widened the slot to the rest of the
  // markup, silently, exactly the way the shout row above did. `region` throws on it instead.
  const subOf = (sfc: string): string => {
    const m = markupOf(sfc)
    const tag = /<template[^>]*\s#sub>/.exec(m)?.[0]
    if (!tag) throw new Error('the header sub line is a #sub slot')
    return region(m, tag, '</template>')
  }

  it('the tournament never offers the one-match exit and the whole-draw exit at once', () => {
    // Owner: «what's the difference between to results and skip tournament on top of tournament
    // match screen?». They ARE different – endReplay leaves this match for its box score, skipAll
    // resolves every remaining round and lands on the poster – so the fix was to stop showing both
    // and to make the big one admit its scope. The label is the bug, not the button.
    const markup = markupOf(flow)
    expect(markup).toMatch(/v-if="replayOpen"[\s\S]{0,80}@click="endReplay"[\s\S]{0,30}To result/)
    expect(markup).toMatch(/v-else-if="!pending\.finished && phase !== 'finale'"[\s\S]{0,140}skipAll/)
    expect(markup).toContain('Skip all rounds')
    // ⚠ "Skip tournament" is the string that could not say whether it meant this match or the draw.
    expect(markup).not.toContain('Skip tournament')
    // The splash's withdrawal is a THIRD thing (forfeit, no points) and keeps its own place.
    expect(markup).toContain('Skip this event – withdraw')
  })

  it('the round rides the tournament\'s own line instead of renting a row', () => {
    // Owner, 30.07: «on tournament match screen move quarterfinal badge higher nearby date». It went
    // onto the date line, which was already being drawn, and cost no row.
    // ⚠ RE-AIMED R17 #9, AND THE ROW IT DID NOT COST IS THE ROW THAT IS NOW GONE. The owner took the
    // move one step further – the date becomes "W36 '35", and the date and the round go up onto the
    // TOURNAMENT's line – so while a match is on screen there is no sub line at all and 25.75px of a
    // 667px phone go to the commentary log (measured at 375x667; see tools/header-probe.mjs).
    // The protected fact is what it always was: the round is named while a match is open, it is not
    // named by a row of its own, and it is the round IN THE VIEWER rather than the one on deck.
    //
    // ⚠⚠ RE-AIMED AGAIN, 12.08, AND THIS PIN HAD BEEN HOLDING THE DEFECT IN PLACE. It read
    // `[weekShort, watchedRoundLabel]` and passed all day while the owner was looking at the bug:
    // «Quarterfinal наверху раньше был выделен цветом овалом вокруг, надо вернуть». R17 #9 moved the
    // round onto the title line through an ARRAY OF STRINGS, which has no way to say that one of two
    // facts is louder, so the accent capsule it had worn since 30.07 was dropped - and this line
    // pinned the exact shape that dropped it. A pin that spells out an implementation cannot notice
    // that the implementation lost a property; `tests/component/round17-surfaces.test.ts` mounts the
    // header and reads the capsule's own background, which is the assertion that would have caught
    // it. What is pinned HERE is only which slot each fact goes in, which is this file's subject.
    expect(flow).toMatch(/:headline-meta="replayOpen \? \[weekShort\] : null"/)
    expect(flow).toMatch(/:headline-badge="replayOpen \? watchedRoundLabel : null"/)
    // ⚠ SPELLED OUT, AND WHAT PAID FOR IT IS THE TITLE. The item's own risk was that the round would
    // not fit: with the full tournament name `Regional Championship` (188.5px) + `W36 '35` (44.2) +
    // `Quarterfinal` (68) is 320.3px against 283.8px of room at 375pt, and it wraps. Dropping the
    // tournament's generic noun IN THIS HEADER ONLY bought the room - the worst line in the ladder is
    // now 254.6px - so nothing is abbreviated. Both halves are the pin: the round is whole, and the
    // title is the short form while a match is on screen and the full one everywhere else.
    expect(flow).toMatch(/:title="phase === 'splash' \? null : replayOpen \? shortTierLabel\(pending\.tierLabel\) : pending\.tierLabel"/)
    expect(flow).toContain('shortTierLabel')
    // The date is the game's own short week label, from the one place that spells it.
    expect(flow).toContain('const weekShort = computed(() => weekLabel(')
    expect(flow).toMatch(/if \(replayAdvances\.value\) return p\.roundLabel/)
    expect(flow).toContain('p.bracket[p.bracket.length - 1]?.roundLabel')
  })

  it('the surface pill stands down only while a match is on screen', () => {
    // It is the one thing on that line the court below says better – but the preview, the pre-match
    // card, the box score and the poster have no court to read it off, so they keep it.
    // ⚠ RE-AIMED 30.07 for the same reason as the pin above: the sub line is a slot the caller fills,
    // not an element the caller writes. See `subOf`.
    const sub = subOf(flow)
    // ⚠ RE-AIMED AT THE INTEGRATION MERGE, and the fact is unchanged. The surface was three
    // hand-written readouts and became one `SurfaceMark` on the icon-system branch (one of the
    // three had `surf-clay` HARD-CODED beside the word "clay", so every other court showed an
    // orange ring labelled clay). What this test protects is not the markup: it is that the
    // surface STEPS ASIDE on this line while a match is on screen, and nowhere else.
    // ⚠ RE-AIMED R17 #9: the gate moved from the mark to the WHOLE SLOT. The sub line is not drawn at
    // all while a match is on screen now, so the surface steps aside by not being there – a stronger
    // version of the same fact, and the only one available once the row it lived on is gone.
    expect(flow).toMatch(/<template v-if="!replayOpen" #sub>/)
    expect(sub).toMatch(/<SurfaceMark :surface="pending\.surface"/)
    // and the friendly's header keeps its own mark unconditionally – its surface is stated once.
    expect(markupOf(read('../src/components/PracticeFlow.vue'))).toMatch(/<SurfaceMark[^>]*:surface="match\.surface"/)
  })

  it('the friendly says "Practice match" once, and its header goes to the result', () => {
    // Owner: «let's remove practice match sign nearby a court since we already have one on top of
    // the screen as a header, and let's put To results instead of Close». The head row held only
    // those two things, so it went with them – 34px (a 22px pill plus its 12px of air).
    const markup = markupOf(practice)
    expect((markup.match(/Practice match/g) ?? []).length, 'said once, in the header title').toBe(1)
    // ⚠ RE-AIMED 30.07: the title is a PROP on `ui/TakeoverShell.vue` now, not a `.tf-title` element
    // this screen writes. The `.tf-title` div still exists once, in the shell, and it still carries
    // this string - the protected fact ("said once, in the header title") is checked by the count
    // above and is unchanged.
    expect(markup).toContain('title="Practice match"')
    expect(markup).toMatch(/v-if="phase !== 'post'"[\s\S]{0,80}@click="toResult"/)
    // ⚠ The box score's own "Done" is the way out of a finished friendly; a second exit beside it
    // is what the owner was asking about, so the header slot is empty there.
    expect(markup).toContain('@click="close">Done')
  })

  it('no match screen keeps a head row above the court any more', () => {
    // The row is what all three complaints were really about. `.tf-card-head` is still declared in
    // the sheet (the Money breakdown's head shares the rule) but no match screen draws one.
    for (const [name, src] of [
      ['TournamentFlow', flow],
      ['PracticeFlow', practice],
      ['MatchReplay', replay],
    ] as const) {
      expect(markupOf(src), `${name} draws no head row above the court`).not.toContain('class="tf-card-head"')
    }
  })
})

describe('live and replay open the same way – the popup, which is the one he likes', () => {
  const replay = read('../src/components/MatchReplay.vue')
  const shell = read('../src/components/ui/TakeoverShell.vue')

  /** Every place MatchViewer is mounted. The fourth one is the point of the 30.07 slice. */
  const SURFACES = [
    ['TournamentFlow', '../src/components/TournamentFlow.vue'],
    ['PracticeFlow', '../src/components/PracticeFlow.vue'],
    ['MatchReplay', '../src/components/MatchReplay.vue'],
    ['SeasonScreen', '../src/components/screens/SeasonScreen.vue'],
  ] as const

  it('the replay is the takeover, not a centred card that cannot scroll', () => {
    // Owner: «I suppose we need the same principle of opening live and replay matches. Maybe a popup
    // format (current live) is better – it looks just like a separate screen and works fine, let's
    // stick to it». `.dialog-overlay` centres its child and does not scroll, so a finished replay
    // measured 1243px inside an 812px viewport at y=-215.5: the court, the close button and the
    // bottom of the box score were all off screen with no way to reach them.
    // ⚠ RE-AIMED 30.07, AND THE THREE CLASSES MOVED ONE FILE ACROSS. They were written out by hand in
    // MatchReplay, PracticeFlow and TournamentFlow; `ui/TakeoverShell.vue` owns them now, so the three
    // assertions about the LAYER live where the layer does, and this file's own job is to say the
    // replay reaches for it. Nothing about the protected fact changed: a replay is a full-screen
    // takeover with a real scroller, not a centred card.
    const markup = markupOf(replay)
    expect(markup).toContain('<TakeoverShell')
    const chrome = markupOf(shell)
    expect(chrome).toContain('class="tournament-flow"')
    expect(chrome).toContain('class="tf-top"')
    expect(chrome).toContain('class="tf-body"')
    expect(markup, 'the overlay is what clipped it').not.toContain('class="dialog-overlay"')
    expect(markup).not.toContain('class="replay-card"')
  })

  // ⚠ ADDED 30.07 (owner: «Есть четвёртое место, где живёт просмотрщик матча - надо все одинаково
  // сделать оверлеем поверх всего экрана ... Будет один компонент и без ненужных дублей кода»). This is
  // the pin the fourth surface never had, and its absence is what let the bug live: SeasonScreen's
  // sandbox exhibition drew the viewer INLINE on a tabbed screen, where the DOCUMENT is the scrollport
  // and the app's `position: fixed` tab bar owns y=760..812. Measured at 375x812 with the box score on
  // screen: the pinned control bar sat at y=736.5..791.5, so 31.5 of its 55px were behind the tab bar
  // and `elementFromPoint` at the bar's own bottom edge returned `.tab-icon`. Inside a takeover the
  // scrollport is `.tf-body` and the tab bar is covered.
  it('all FOUR match surfaces open the viewer through the one takeover, and nothing writes its own', () => {
    for (const [name, rel] of SURFACES) {
      const markup = markupOf(read(rel))
      const at = markup.indexOf('<MatchViewer')
      const shellAt = markup.indexOf('<TakeoverShell')
      expect(at, `${name} mounts the viewer`).toBeGreaterThan(-1)
      expect(shellAt, `${name} opens a takeover`).toBeGreaterThan(-1)
      expect(at, `${name} puts the viewer inside the takeover`).toBeGreaterThan(shellAt)
      // ...and it does NOT hand-write the chrome any more. Three files agreeing on a layout is how the
      // fourth came to disagree, so the classes may appear in exactly one place: the component.
      for (const cls of ['class="tournament-flow"', 'class="tf-top"', 'class="tf-body"']) {
        expect(markup, `${name} hand-writes ${cls} instead of using the shell`).not.toContain(cls)
      }
    }
  })

  // ⚠ RE-AIMED 30.07, and the protected fact is the one this test was named for: all three match
  // screens open a match THE SAME WAY. What changed is what "the same way" is. It used to be "inside a
  // `.tf-card`", and the owner has taken that box off: «на экране матча у нас двойная рамка, она
  // съедает место, давай внешний контур уберем, он не нужен». It was a 16px-padded, hairline-bordered
  // panel wrapped around a stack of panels the viewer already draws (`.mv-panel`, `.mv-log` - and,
  // until 12.08, `.mv-boxscore` - each a `Card`), so it was a border around a border. Measured at 375pt before and
  // after: the canvas went 291 -> 327px wide, the painted court 244.4 -> 274.9px, and each screen got
  // 32px of height back. So the test now pins the ABSENCE as hard as it used to pin the presence -
  // three screens agreeing on no frame is exactly as protective as three agreeing on one, and a
  // re-added wrapper on one screen would be the drift.
  it('no match surface wraps the viewer in a panel of its own', () => {
    // ⚠ RE-AIMED 30.07 AND SPLIT IN TWO. The half that read "it is in the takeover's own scroller"
    // moved up to the FOUR-surface pin above, where it is checked against the shell instead of against
    // three hand-written copies of `class="tf-body"`. What is left here is the other protected fact,
    // unchanged and now covering the fourth surface too.
    for (const [name, rel] of SURFACES) {
      const markup = markupOf(read(rel))
      // No panel is its wrapper. Matched as "a `.tf-card` element whose first content is the viewer",
      // which is precisely the markup that was deleted - and precisely what would come back.
      // Deliberately NOT "the file contains no .tf-card": the tournament's draw, box score, spectate
      // card and poster are all still panels, in other phase branches, and must stay ones.
      expect(markup, `${name} wraps the viewerFile in a panel`).not.toMatch(
        /class="tf-card[^"]*"[^>]*>\s*<MatchViewer/,
      )
    }
  })

  it('a cross exists only where the screen decides nothing and has nowhere else to go', () => {
    // Owner: «match screen close should be a cross custom SVG and what this close stands for? does
    // it skip the game or what? maybe it's redundant?». It was redundant on the friendly, where it
    // sat beside a "To result →" that did the useful thing; on a replay it is the only exit there
    // could be, because a replay decides nothing.
    // ⚠ RE-AIMED AT THE INTEGRATION MERGE — and this test asked for it. The note here said
    // "ADOPTION POINT for the icon system's cross SVG"; the owner's own `close.svg` and the
    // `IconButton` that carries it landed on the sibling branch in the same round, so the glyph
    // became a named control with a real asset.
    // ⚠ RE-AIMED AGAIN 30.07, AND THE COUNT WENT FROM ONE TO TWO. It was called "exactly one cross is
    // left in the match flow, and it is the replay's" - a COUNT standing in for the criterion the test's
    // own note already spelled out. The criterion is what the owner asked about ("what this close stands
    // for?"), and it is: a cross is right where the screen decides NOTHING and has no screen after it,
    // and wrong where a useful exit exists. Making SeasonScreen's sandbox exhibition a takeover added a
    // second surface that meets it exactly - a hit-out that costs nothing, is written nowhere and has no
    // result screen, so "out" is the only thing an exit there could mean. The half that was really doing
    // the work is untouched and now enumerated over the whole flow: the two screens that DO have a
    // useful exit (the friendly's "To result →", the tournament's two) offer no cross, and no screen
    // types the glyph.
    const CROSS_IS_THE_ONLY_EXIT = ['../src/components/MatchReplay.vue', '../src/components/screens/SeasonScreen.vue']
    const HAS_A_USEFUL_EXIT = ['../src/components/PracticeFlow.vue', '../src/components/TournamentFlow.vue']
    for (const rel of CROSS_IS_THE_ONLY_EXIT) {
      expect(markupOf(read(rel)), `${rel} needs its cross`).toMatch(/<IconButton[^>]*icon="close"/)
    }
    for (const rel of HAS_A_USEFUL_EXIT) {
      expect(markupOf(read(rel)), `${rel} has a useful exit and must not also offer a close`).not.toMatch(
        /icon="close"/,
      )
    }
    for (const rel of [...CROSS_IS_THE_ONLY_EXIT, ...HAS_A_USEFUL_EXIT]) {
      expect(markupOf(read(rel)), `${rel} types the glyph`).not.toContain('Close ✕')
    }
    // anti-vacuity: the two lists really are the whole match flow, and they do not overlap
    expect(new Set([...CROSS_IS_THE_ONLY_EXIT, ...HAS_A_USEFUL_EXIT]).size).toBe(SURFACES.length)
  })
})

// =====================================================================================================
// The owner's 31.07 playtest. Seven items; six of them are this screen's, and they share one sentence –
// «inside the match the screen should be the match and information about the match, nothing else».
// =====================================================================================================
describe('a hidden screen is a stopped match', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  /** The `.vue` alone – the only honest corpus for the negative claim below. */
  const viewerFile = componentFile('components/MatchViewer.vue')

  it('pauses on visibilitychange the way the music already does, and only resumes what was running', () => {
    // Owner, 31.07: «pause the game and the match when the screen is minimised, the way music
    // pauses». src/audio/music.ts's R8-2 listener is the model, and the shared rule is the one worth
    // pinning: remember whether the thing was ACTUALLY running when the screen went away, and only
    // then start it again. A match the player had paused on purpose must come back paused.
    expect(viewer).toContain("addEventListener('visibilitychange', onVisibilityChange)")
    expect(viewer, 'the listener outlives the component').toContain(
      "removeEventListener('visibilitychange', onVisibilityChange)",
    )
    expect(viewer).toMatch(/resumeOnVisible = playing\.value && !finished\.value/)
    expect(viewer).toMatch(/if \(resumeOnVisible\) pauseInternal\(\)/)
    // ...and the music's listener is still the precedent this claims to follow.
    expect(read('../src/audio/music.ts')).toContain("addEventListener('visibilitychange'")
  })

  it('the resume is clean: the clock restarts where it stopped, never ahead of it', () => {
    // `pauseInternal` nulls `lastTs`, and `frame` seeds `lastTs` from the first timestamp it sees –
    // so the first frame back measures zero elapsed time. That pairing IS the guarantee that no time
    // is skipped and none is replayed, and it is easy to break by "tidying" either half away.
    expect(viewer).toMatch(/function pauseInternal\(\)[\s\S]{0,320}lastTs = null/)
    expect(viewer).toMatch(/function frame\(ts: number\)[\s\S]{0,120}if \(lastTs === null\) lastTs = ts/)
  })

  // ⚠ ADDED WITH R2-11, AND IT IS THE EXTRACTION'S OWN GUARANTEE. The review's rule is "never allow
  // two clock/timer owners", and the cheapest way a second one arrives is by habit: something needs a
  // short delay, `setTimeout` is one line, and now two things decide whether the match is running.
  // The behavioural half is mounted (tests/component/match-viewer-clock.test.ts counts the live
  // handles); this is the structural half, and it is a NEGATIVE claim about two specific files, so it
  // reads `componentFile()` – the `.vue` ALONE – exactly as CLAUDE.md's pin hygiene requires.
  // `componentLogic()` would fold in `playbackClock.ts`, where the one legitimate timer lives, and
  // the assertion would be a lie about the file it is talking about.
  it('⚠ neither the screen nor its control bar owns a clock of its own', () => {
    for (const [name, sfc] of [['MatchViewer', viewerFile], ['MatchControls', transportFile]] as const) {
      for (const call of ['requestAnimationFrame', 'setTimeout', 'setInterval']) {
        expect(sfc, `${name} armed a ${call} of its own`).not.toContain(`${call}(`)
      }
    }
    // ...and the one owner is where it says it is, with both of its handles.
    const clock = read('../src/composables/playbackClock.ts')
    expect(clock).toContain('rafId = requestAnimationFrame(frame)')
    expect(clock).toContain('preRollTimer = setTimeout(')
    expect(clock, 'the pre-roll timeout is not cleared by the one pause').toMatch(
      /function pauseInternal\(\)[\s\S]{0,320}clearTimeout\(preRollTimer\)/,
    )
    expect(clock, 'the frame loop is not cancelled by the one pause').toMatch(
      /function pauseInternal\(\)[\s\S]{0,320}cancelAnimationFrame\(rafId\)/,
    )
  })

  it('...and a frame can never carry a whole absence, whatever the browser did or did not fire', () => {
    // ⚠ THE HALF THAT HOLDS WITHOUT THE EVENT. iOS backgrounds through pagehide/freeze without
    // reliably firing `visibilitychange`, and a sleeping device dispatches nothing at all – in both
    // cases rAF simply stops and the first frame back hands `frame()` the entire gap as one delta,
    // which `advance()` would walk through the timeline in a single call. Clamping COSTS that time
    // rather than skipping any of it: the timeline is pre-computed and the walk is ordered, so every
    // event still plays exactly once, in order. Presentation only – the result is the engine's and is
    // already in the save file.
    expect(viewer).toContain('const MAX_FRAME_DT =')
    expect(viewer).toMatch(/const dtReal = Math\.min\(\(ts - lastTs\) \/ 1000, MAX_FRAME_DT\)/)
    const cap = Number(/const MAX_FRAME_DT = ([\d.]+)/.exec(viewer)?.[1])
    // Loose enough to be tuned, tight enough that it is still a CLAMP: above a real frame hitch
    // (tens of ms) and far below any absence a player would notice as a jump.
    expect(cap).toBeGreaterThan(0.05)
    expect(cap).toBeLessThan(1)
  })
})

describe('who is serving is said twice, attached to something, and never in a spare row', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  // ⚠ RE-AIMED BY T-07 (05.09): a region CUT from `viewer` is as wide as `viewer`, so every
  // negative claim below reads the `.vue` alone. tests/pin-hygiene.test.ts follows one level now.
  const viewerFile = componentFile('components/MatchViewer.vue')
  const markup = markupOf(viewerFile)
  const styles = stylesOf(viewerFile)

  it('the serving end is outlined as well as coloured, and the row cannot move when it changes', () => {
    // Owner, 31.07: «who's serving is already indicated by colour - add an outline on top of that».
    // ON TOP OF, not instead of - so the accent has to survive alongside the new border.
    expect(styles).toMatch(/\.ends-labels \.serving \{[^}]*border-color: var\(--accent\)/)
    expect(styles).toMatch(/\.ends-labels \.serving \{[^}]*color: var\(--accent\)/)
    // ⚠ THE HALF THAT IS EASY TO "TIDY" AWAY. The capsule is declared on BOTH ends and left
    // transparent on the one not serving. `.ends-labels` is `justify-content: space-between`, so a
    // border drawn only on the serving side would change that side's width and both baselines every
    // time the serve changed hands - which, on a change of ends, is every other game. A row that
    // twitches once a game is worse than no outline at all.
    expect(styles).toMatch(/\.ends-labels > span \{[^}]*border: 1px solid transparent/)
    // ...and the word stays, because colour and an outline are both decoration and neither reaches a
    // screen reader or a monochrome screen.
    expect(markup).toContain("' · serving'")
  })

  it('the third saying of it - the bottom pill - is gone, and the two that are left are attached', () => {
    // Owner: «remove the duplicate indicator at the bottom». It said the same fact a third time, in
    // a row of its own, at the far end of the panel from where the eye is. What survives is the two
    // sayings that are attached to something the player is already looking at: the END directly under
    // the court, and the serving player's own row.
    expect(markup, 'the duplicate serve pill is back').not.toContain('mv-serve-pill')
    expect(markup, 'the row it lived in is back').not.toContain('class="mv-serving"')
    expect(styles).not.toContain('.mv-serving {')
    expect(markup, 'the ends row still names the server').toMatch(/liveServer === leftSide/)
    expect(markup, 'the player row still carries the accent dot').toMatch(
      /class="mv-serve-dot" :class="\{ on: liveServer === side \}"/,
    )
  })

  it('the score counter sits in the court\'s bottom band, the way the weather sits in the top one', () => {
    // Owner: «move the score counter up so it sits directly under the court, positioned the way the
    // weather element is, but at the bottom edge - this buys back some vertical space». Taken
    // structurally rather than by eye: the same right inset as the row above, and a `bottom` that
    // mirrors that row's `top`, so the two run-off bands are used identically and neither reading is
    // on the playing surface.
    //
    // ⚠ RE-AIMED BY THE SERVE-SPEED SLICE, and only where it had to move. The counter is no longer
    // pinned to the band's right edge with its own `position: absolute` - it is the middle column of
    // `.mv-runoff`, which is the box that now owns the band (owner, after playing: «этот счет сета
    // ... поставим посередине, а справа и слева ... будем скорость подачи писать»). So the two
    // offsets this test reads belong to the ROW now, exactly as the weather plate's did when the top
    // band became `.mv-chrome` one slice earlier - same widening, same reason. What the pin is FOR
    // is untouched and still asserted here: the band is used the way the top one is, the counter is
    // inside the court box rather than costing a row of panel, and it still says both things the
    // deleted serve row said.
    const chrome = region(styles, '.mv-chrome {', '.mv-live {')
    const runoff = region(styles, '.mv-runoff {', '.mv-score {')
    expect(chrome).toMatch(/top: 6px/)
    expect(chrome).toMatch(/right: 10px/)
    expect(runoff).toMatch(/bottom: 6px/)
    expect(runoff).toMatch(/right: 10px/)
    // Neither reading may keep an absolute pin of its own, or the row is decoration over two boxes
    // that are really still stuck to the band's corners - the mistake `.mv-chrome` was made to end.
    expect(styles).not.toMatch(/\.mv-score \{[^}]*position: absolute/)
    expect(styles).not.toMatch(/\.mv-speed \{[^}]*position: absolute/)
    // It is INSIDE the court box - that is what "under the court" costs nothing - and it is the last
    // thing in it, after the top row.
    const courtAt = markup.indexOf('class="mv-court"')
    const chromeAt = markup.indexOf('class="mv-chrome"')
    const scoreAt = markup.indexOf('class="mv-score num"')
    expect(courtAt).toBeGreaterThan(-1)
    expect(chromeAt).toBeGreaterThan(courtAt)
    expect(scoreAt).toBeGreaterThan(chromeAt)
    // ...and it still says both things the deleted row said, so this was a move and not a loss.
    //
    // ⚠ RE-AIMED (owner, 04.08: «выделять желтым цифру нашего игрока» + «при смене сторон счет тоже
    // должен меняться сторонами»). This used to pin the exact ternary `finished ? points : gameScore`
    // — which was a pin on the IMPLEMENTATION of one reading, and the reading has since grown two
    // requirements that a single interpolated string cannot serve: one digit must be able to take
    // the accent, and the pair must reorder with the players' ends. So the score is markup now
    // (`courtScore` → three spans) and the finished reading kept its own. What this line is FOR is
    // unchanged and is asserted more directly below: BOTH readings still exist on this element, so
    // the move did not quietly drop one. The behaviour itself is covered by mounted tests in
    // tests/component/match-viewer.test.ts, which is the net a source pin cannot be.
    // ⚠ RE-AIMED 14.08 AND THE WORD IS NOW THE ASSERTION. `} points` matched both the old reading
    // and the new one, so it could not have caught the defect it is here to guard: "points" alone
    // reads as RANKING points, which this flow writes one screen later as «+130 pts», and the owner
    // filed a WTA 1000 first round as paying 163 three times before it turned out to be a word.
    expect(viewer).toMatch(/const scoreReadout = computed\([\s\S]{0,80}pointsPlayed\.value\} points played/)
    expect(viewer).toMatch(/const courtScore = computed\(/)
    expect(markup).toContain('v-else-if="scoreReadout"')
  })

  it('the badge, the clock and the weather share ONE row, each in a seat that does not move', () => {
    // Owner: «align the weather element and move it down so it sits on the same line as live». They
    // were two absolutely-positioned boxes at the same `top: 6px`, which aligns top EDGES - and the
    // badge is a 19px pill while the plate is a bare 13px reading, so their centre lines sat 3px
    // apart. A 3px nudge would have fixed today's two sizes and nothing else; ONE ROW with
    // `align-items: center` is true whatever either piece becomes.
    //
    // ⚠ RE-AIMED 12.08, AND THE OLD IMPLEMENTATION HALF OF IT WAS THE BUG. This pinned
    // `justify-content: flex-end` plus `margin-right: auto` on `.mv-live`, and wrote the right
    // principle beside it: "the badge is optional (no badge on a replay), so the plate must be held
    // by the ROW and not by the badge being there to push it." Auto margins do not do that. They
    // SPLIT the free space, so the arrangement was only correct while every piece was present - and
    // when R17 #24 added a third tenant, the clock, it held its place with a second `margin-right:
    // auto` and slid to the left end on every replay and at the end of every live match (owner,
    // 12.08: «на match replay часы тоже должны остаться посередине экрана, а они сейчас уезжают
    // налево»). Measured at 375pt: the clock's centre was 173.5 with the badge and 25 without it.
    // The row is a three-column grid now, the same one `.mv-runoff` uses one band lower for the same
    // reason, and a column holds its seat whether or not anything is in it: measured after, the
    // clock's centre is 187.5 in BOTH modes, which is the canvas centre exactly.
    // THE PROTECTED FACT IS UNCHANGED and is now asserted by the thing that actually delivers it:
    // one row, centred on each other, and NO piece's position depending on another piece existing.
    const chrome = region(styles, '.mv-chrome {', '.mv-live {')
    expect(chrome).toMatch(/display: grid/)
    expect(chrome).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\)/)
    expect(chrome).toMatch(/align-items: center/)
    // Each of the three names its own seat. This is the assertion that would have caught the clock:
    // a piece with no `grid-column` falls into the first free one the moment a neighbour is absent.
    expect(styles).toMatch(/\.mv-live \{[^}]*grid-column: 1/)
    expect(styles).toMatch(/\.mv-clock \{[^}]*grid-column: 2/)
    expect(styles).toMatch(/\.mv-weather \{[^}]*grid-column: 3/)
    // ⚠ AND `.mv-weather` HAS A RULE AGAIN, WHERE THIS TEST USED TO FORBID ONE. That ban was right
    // for a flex row - the plate simply ended it, and a class with no rule behind it is the next
    // thing somebody re-adds a rule to. A grid has to be TOLD which column each end holds, so the
    // rule is now load-bearing rather than vestigial, which is the condition the ban was protecting.
    expect(styles).toContain('.mv-weather {')
    // Neither piece may keep a pin of its own, or the row is decoration over two absolute boxes.
    expect(styles).not.toMatch(/\.mv-live \{[^}]*position: absolute/)
    // A full-width box over the court that is not a control must not eat taps meant for the canvas.
    expect(chrome).toMatch(/pointer-events: none/)
  })
})

// =====================================================================================================
// THE SERVE SPEED, ON THE COURT (owner, after playing on 31.07):
//
//   «на экране матча давай вот этот счет сета (справа внизу 0-0 под полем) поставим посередине,
//    а справа и слева, в зависимости от того, кто подает, будем скорость подачи писать - это будет топ»
//
// Two changes to one band, and the pins below are in the order of how much it costs to get them
// wrong. The FIRST is not about layout at all: this is the second reader of a number the box score
// already reports, and two readings of one serve that disagree are worse than no reading at all.
// =====================================================================================================
describe('the serve speed on the court is the same number the box score reports', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  const viewerFile = componentFile('components/MatchViewer.vue')

  it('⚠ the per-point speed stream is seeded in EXACTLY ONE file, and it is not the viewer', () => {
    // The same discipline the trophy URL slice just established: a fact that two screens must agree
    // on gets ONE producer, and the pin is a whole-tree count rather than a spot check, because a
    // second seeding is only ever added by someone who did not know the first existed.
    //
    // `<match seed>:spd:<point number>` IS the agreement. Reproduce that string anywhere else - even
    // correctly, even today - and the two readings are one refactor away from drifting: change the
    // draw order, or add a third serve kind, and only one copy learns about it.
    const walk = (dir: URL): URL[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const child = new URL(e.name + (e.isDirectory() ? '/' : ''), dir)
        return e.isDirectory() ? walk(child) : /\.(ts|vue)$/.test(e.name) ? [child] : []
      })
    const seeders = walk(new URL('../src/', import.meta.url)).filter((f) =>
      // The seeding itself, not prose about it: a template literal that interpolates into ':spd:'.
      /\$\{[^}]*\}:spd:/.test(readFileSync(f, 'utf8')),
    )
    const names = seeders.map((f) => f.pathname.split('/src/')[1])
    expect(names, `the ':spd:' stream is seeded in ${names.length} files`).toEqual([
      'engine/match/serveSpeed.ts',
    ])
  })

  it('both readers go through pointServeSpeeds - the viewer imports it and derives nothing', () => {
    // The box score's avg/max rows...
    // ⚠ RE-AIMED BY R2-06, NOT WEAKENED. The box score moved from `src/engine/match/matchStats.ts`
    // to `src/viz/match/matchStats.ts` (it is presentation, and only screens read it), so its import
    // of the speed model is now a relative hop into the engine rather than a sibling `./serveSpeed`.
    // Both halves of the claim are unchanged: the SAME symbol, from the SAME module, called with the
    // SAME four arguments. The path read below throws ENOENT if the module moves again, which is how
    // this pin announced the move in the first place.
    const stats = read('../src/viz/match/matchStats.ts')
    expect(stats).toContain("import { pointServeSpeeds } from '../../engine/match/serveSpeed'")
    expect(stats).toContain('pointServeSpeeds(seed, point, playerA, playerB)')
    // ...and the live reading under the court, from the same call.
    expect(viewer).toContain("import { pointServeSpeeds, type StruckServe } from '../engine/match/serveSpeed'")
    expect(viewer).toContain('pointServeSpeeds(props.match.result.seed, point, props.playerA, props.playerB)')
    // The viewer may not reach past it for any piece of the model, which is how a "just this once"
    // second derivation starts. (tests/match/matchStats.test.ts proves the two agree numerically;
    // this pin is what stops a future change from having to be caught numerically at all.)
    expect(viewerFile).not.toMatch(/serveSpeedOf|expectedServeSpeed|serveSpeedBase|SPEED_JITTER|SECOND_SERVE_DROP/)
  })

  it('the seed came off the match it already had - no new prop, no new snapshot field', () => {
    // `AnnotatedMatch.result` is a `MatchResult` and `MatchResult.seed` is the match's own seed, so
    // the fact was already on the props. The same is true of the ages and the serve skills, which
    // ride `MatchPlayer`. Nothing was added to the payload for this reading, and the pin says so in
    // the two places it could have been: the prop list, and the number of props the callers pass.
    const propsBlock = region(viewerFile, 'defineProps<{', '}>(),')
    for (const invented of ['seed', 'serveSpeed', 'speeds', 'kmh']) {
      expect(propsBlock, `a "${invented}" prop was added for a fact the viewerFile already had`).not.toContain(
        `${invented}?:`,
      )
    }
    expect(viewer).toContain('props.match.result.seed')
  })
})

describe('the run-off band reads speed · score · speed, and the speed is on the server\'s side', () => {
  const viewer = componentLogic('components/MatchViewer.vue')
  // ⚠ RE-AIMED BY T-07 (05.09): a region CUT from `viewer` is as wide as `viewer`, so every
  // negative claim below reads the `.vue` alone. tests/pin-hygiene.test.ts follows one level now.
  const viewerFile = componentFile('components/MatchViewer.vue')
  const markup = markupOf(viewerFile)
  const styles = stylesOf(viewerFile)

  it('the score is CENTRED on the court, not centred on what the speed left over', () => {
    // Owner: «этот счет сета ... поставим посередине». `1fr auto 1fr` is what makes that true of the
    // COURT rather than of the row's remaining space - and it has to be, because only one end is
    // ever occupied, so a `space-between` score would sit off centre nearly all the time and jump
    // sideways every time a serve landed.
    const runoff = region(styles, '.mv-runoff {', '.mv-score {')
    expect(runoff).toMatch(/display: grid/)
    expect(runoff).toMatch(/grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\)/)
    expect(runoff).not.toMatch(/justify-content: space-between/)
    // The middle column, explicitly - the score is dropped before the first point lands and each
    // speed only exists at its own end, so auto-placement would put a lone reading in column 1.
    expect(styles).toMatch(/\.mv-score \{[^}]*grid-column: 2/)
    expect(styles).toMatch(/\.mv-speed\.left \{[^}]*grid-column: 1/)
    expect(styles).toMatch(/\.mv-speed\.right \{[^}]*grid-column: 3/)
    // ...and the two insets are EQUAL, or the middle column is not the court's middle. Measured at
    // 375pt, an 8/10 pair (which is what the top row uses, for the Live badge's sake) puts the score
    // 1px off centre - invisible, but free to get exactly right.
    const runoffRule = region(styles, '.mv-runoff {', '}')
    const left = /left: (\d+)px/.exec(runoffRule)?.[1]
    const right = /right: (\d+)px/.exec(runoffRule)?.[1]
    expect(left, 'the band is inset unequally, so "in the middle" is off by half the difference').toBe(right)
  })

  it('the band is ONE line whichever end is serving - the row is pinned, not just the column', () => {
    // ⚠ THIS IS A REAL BUG THAT SHIPPED, and no other check in this suite could have seen it: jsdom
    // has no layout, so a band that silently becomes two rows tall passes every test we own.
    // Owner, 31.07, after playing: «левая цифра встала как надо, а правая всё ещё выше возле самого
    // корта». Only the RIGHT end was wrong, which is the shape of the answer - grid auto-placement
    // is SPARSE and never walks the cursor backwards. The markup is speed-then-score, so:
    //   * left  serve → speed takes column 1, cursor stops short of 2, the score fits on row 1;
    //   * right serve → speed takes column 3, cursor is past 2, the score CANNOT be placed on row 1
    //     and opens a second one.
    // Measured in a browser against this exact markup and these exact rules: left → band 15px, the
    // two readings on one baseline; right → band 35px, the speed 22.5px above the score and back on
    // the PLAYING SURFACE, which the 29.07 rule forbids outright.
    // Naming a column without naming a row is what allowed it, so both readings name both.
    expect(styles).toMatch(/\.mv-score \{[^}]*grid-row: 1/)
    expect(
      region(styles, '.mv-speed {', '.mv-speed.left {'),
      'the row pin belongs on the shared .mv-speed rule, so the two ends cannot drift apart again',
    ).toMatch(/grid-row: 1/)
  })

  it('the two readings sit on one BASELINE, which is not the same as one centre line', () => {
    // Owner, 31.07: «скорость подачи ... на уровне с цифрами счета посередине». `center` aligns the
    // BOXES, and the boxes are different heights - 12px against 15px, both at `line-height: 1` - so
    // their midpoints matched while their digits did not. Measured with the rows pinned: `center`
    // still leaves the speed 1px high, `baseline` lands it at 0.5px, which is font rounding.
    // Baseline is what "level with" means for text, and it keeps holding if either size ever moves.
    const runoff = region(styles, '.mv-runoff {', '.mv-score {')
    expect(runoff).toMatch(/align-items: baseline/)
  })

  it('a three-digit speed can never collide with the score at 375pt', () => {
    // ⚠ STRUCTURAL, NOT ARITHMETICAL, and deliberately so. The sum does work out - "183 km/h" (the
    // model's plateau plus a 90 serve plus the jitter band) is ~52px at 12px, the widest score the
    // band can hold is "196 points" at ~85px, and the band is ~279px wide on a 375pt phone - but a
    // guarantee that rests on a sum is one longer string away from being false.
    // `minmax(0, 1fr)` gives the EDGE columns a zero floor, so under pressure they are the ones that
    // give; `nowrap` + `clip` means the speed then loses its tail instead of wrapping onto the
    // playing surface above or sliding under the score.
    const runoff = region(styles, '.mv-runoff {', '.mv-score {')
    expect(runoff).toContain('minmax(0, 1fr)')
    const speed = region(styles, '.mv-speed {', '.mv-speed.left {')
    expect(speed).toMatch(/white-space: nowrap/)
    expect(speed).toMatch(/overflow: hidden/)
    // A row of readings over the court that is not a control must not eat taps meant for the canvas,
    // the same rule `.mv-chrome` lives by.
    expect(runoff).toMatch(/pointer-events: none/)
  })

  it('the reading sits at the END of the player who struck it, and moves when the serve does', () => {
    // Owner: «справа и слева, в зависимости от того, кто подает». The end is resolved through the
    // SAME `leftSide` the ends-labels row uses, so the speed and the server's name can never end up
    // on opposite sides of the screen; and it is keyed off the side that STRUCK the serve rather
    // than off `liveServer`, which is the one difference that matters when the two could disagree.
    expect(viewer).toMatch(/liveServeSpeed\.value\.side === leftSide\.value \? 'left' : 'right'/)
    // One element that moves between the columns, so there is one piece of markup to keep true.
    expect(markup).toContain('<span v-if="serveSpeedEnd" class="mv-speed num" :class="serveSpeedEnd"')
    // km/h, and an integer - `serveSpeedOf` rounds, so the template must not re-format it.
    expect(markup).toContain('km/h')
    expect(markup).not.toMatch(/toFixed|Math\.round\(liveServeSpeed/)
  })

  it('the reading covers the serve and the reply, then goes - never a whole rally, never a flash', () => {
    // The two failure modes pull opposite ways: a number left up through a twenty-shot rally reads
    // as if it described the ball in play, and one taken down when the ball is struck is a 0.28s
    // flash at ×2 (the speed the viewer opens on). "Serve +1" is the window tennis already has.
    expect(viewer).toContain('const SERVE_READING_SHOTS = 1')
    expect(viewer).toMatch(/onScreen - latest\.shotIndex > SERVE_READING_SHOTS/)
    // The POINT-END beat falls back to the shot the point ended on, which is the half that saves the
    // ace / service winner / double fault from being the flash - those points ARE one or two shots
    // long, so without it they would be the only ones that never got read.
    expect(viewer).toMatch(/point\.rally\.shots\.length - 1/)
    // ⚠ AN ALLOW-LIST OF TWO EVENT KINDS, and it is a deny-list that this pin exists to prevent
    // coming back. Measured on a live match: with the ceremony beats let through, a game-ending ace
    // held its number through point-end, the quiet gap, game-end, ITS gap and the change of ends -
    // four seconds at ×1, eight if it also ended a set. Allow-listing 'shot' and 'point-end' rules
    // out those, the match-end curtain, and any beat a future slice invents, all at once. It also
    // rules out 'point-start', which is what stops a reading surviving into a point it did not come
    // from and sitting under the wrong player when the serve changes hands.
    expect(viewer).toMatch(/ev\.kind !== 'shot' && ev\.kind !== 'point-end'/)
    for (const ceremony of ['game-end', 'set-end', 'change-ends', 'gap']) {
      expect(
        region(viewer, 'function serveReadingFor', 'function updatePlayers'),
        `serveReadingFor learned about '${ceremony}' - the allow-list became a deny-list`,
      ).not.toContain(`'${ceremony}'`)
    }
    expect(viewer).toMatch(/liveServeSpeed\.value = null/)
  })
})

describe('the match screen is the match, and nothing else', () => {
  const flow = read('../src/components/TournamentFlow.vue')

  it('no list of OTHER matches is drawn above the court', () => {
    // Owner, 31.07: the live match screen was opening with the rounds already played stacked above the
    // court. Outside the match that strip is the right thing on the right screen - it is how a player
    // reads her path between rounds - so this is a placement fix and not a deletion, and the pin has to
    // say both halves or it would be satisfied by ripping the strip out altogether.
    const markup = markupOf(flow)
    // 1. The strip still exists, and it still refuses the finale (the L/M poster draws her whole path
    //    itself - see §L - so printing it twice one card apart was the older version of this same bug).
    expect(markup).toContain('class="tf-strip"')
    expect(markup).toMatch(/v-if="pending\.bracket\.length && phase !== 'finale' && !replayOpen"/)
    // 2. ...and it is gated on the SAME flag every other piece of tournament furniture on this screen
    //    already yields to, which is the fact worth protecting: one condition means "a match is on
    //    screen", so a future row cannot be added that only half-knows about it.
    expect(flow).toMatch(/const showBracket = computed\(\s*\(\) =>[\s\S]{0,160}!replayOpen\.value/)
    // ⚠ RE-AIMED R17 #9: the surface mark no longer carries the flag itself because the whole sub line
    // it lives on is gated on it now (the date and the round moved up onto the tournament's line).
    // Same flag, one level up - which is what "one condition means a match is on screen" asks for.
    expect(markup).toMatch(/<template v-if="!replayOpen" #sub>/)
    // 3. and the strip really is ABOVE the viewer in the markup, which is what made it the thing the
    //    player met first when the screen opened.
    const stripAt = markup.indexOf('class="tf-strip"')
    const viewerAt = markup.indexOf('<MatchViewer')
    expect(stripAt).toBeGreaterThan(-1)
    expect(viewerAt).toBeGreaterThan(stripAt)
  })
})

describe('the viewer OPENS on the settings defaults, and a match never writes them (02.08)', () => {
  // «Default match speed and text match settings setup in settings» - the two dials became
  // preferences in composables/matchDefaults.ts, the dayCross/weekRecap idiom exactly: plain
  // localStorage behind pure functions, working (as session state) even where storage is not -
  // which is also what lets this project's node runner exercise them directly.
  it('the plumbing round-trips, and falls back to the shipped openings (2×, key)', async () => {
    const d = await import('../src/composables/matchDefaults')
    // Under the node runner there is no localStorage, so the getters answer the shipped openings -
    // the exact values the refs were hard-coded to before this slice.
    expect(d.MATCH_SPEEDS).toContain(d.matchSpeedDefault())
    expect(d.MATCH_VIEWS).toContain(d.matchViewDefault())
    // A set sticks for the session even with no storage behind it (the try/catch contract)...
    d.setMatchSpeedDefault(4)
    d.setMatchViewDefault('skip')
    expect(d.matchSpeedDefault()).toBe(4)
    expect(d.matchViewDefault()).toBe('skip')
    // ...and back, so this test leaves the module the way it found it.
    d.setMatchSpeedDefault(2)
    d.setMatchViewDefault('key')
    expect(d.matchSpeedDefault()).toBe(2)
    expect(d.matchViewDefault()).toBe('key')
  })

  it('MatchViewer seeds its refs from the getters - and imports no setter', () => {
    // ⚠ THE RAW SFC, NOT `componentSource`, and the distinction is load-bearing. This block makes a
    // NEGATIVE claim about the SFC's OWN imports. `componentSource` widens the text to include every
    // composable the component imports - correct for "this logic exists somewhere in the component",
    // wrong here: it would pull in matchDefaults.ts, where `setMatchSpeedDefault` is DEFINED, and the
    // assertion would fail on the definition it is not talking about. (Found exactly that way.)
    const viewerFile = componentFile('components/MatchViewer.vue')
    expect(viewerFile).toContain("const viewMode = ref<ViewMode>(matchViewDefault())")
    expect(viewerFile).toContain('const speed = ref<MatchSpeed>(matchSpeedDefault())')
    // ⚠ ONE-WAY: the pills mid-match write the refs and only the refs. The viewer cannot even
    // reach the stored defaults - the setters' one caller is the settings screen.
    expect(viewerFile).not.toContain('setMatchSpeedDefault')
    expect(viewerFile).not.toContain('setMatchViewDefault')
  })

  it('the settings screen offers every value of both dials, in the pace row\'s own shape', () => {
    const more = read('../src/components/screens/MoreScreen.vue')
    expect(more).toContain('const matchSpeed = ref(matchSpeedDefault())')
    expect(more).toContain('const matchView = ref(matchViewDefault())')
    expect(more).toContain('setMatchSpeedDefault(v)')
    expect(more).toContain('setMatchViewDefault(v)')
    // both pickers derive from the composable's own total lists - a fourth speed or view mode
    // shows up here the day it exists, or fails to compile in its Record labels first
    expect(more).toContain('v-for="s in MATCH_SPEEDS"')
    expect(more).toContain('v-for="v in MATCH_VIEWS"')
  })
})
