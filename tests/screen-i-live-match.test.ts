import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { courtToCanvas, courtScale, type Viewport } from '../src/viz/geometry'
import { COURT } from '../src/viz/types'

// Screen I (docs/design/README.md §I, docs/specs/ui-inventory.md §4 Q2) – the live match, rebuilt
// onto the design and given the running commentary the owner ruled it was missing. These are
// source-shaped pins in the house style: they protect the DECISIONS, not the pixels.
const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8')

/** The SFC's <template> block, so a mention of a tag in a code comment is not mistaken for markup. */
const templateOf = (sfc: string): string => sfc.slice(sfc.indexOf('<template>'), sfc.indexOf('</template>'))
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
  sfc
    .slice(sfc.indexOf('<template>'), sfc.lastIndexOf('</template>'))
    .replace(/<!--[\s\S]*?-->/g, '')
/** The <style scoped> block with its comments stripped – prose about a colour is not a colour. */
const stylesOf = (sfc: string): string =>
  sfc.slice(sfc.indexOf('<style scoped>')).replace(/\/\*[\s\S]*?\*\//g, '')

describe('screen I – the commentary is actually on the screen', () => {
  const viewer = read('../src/components/MatchViewer.vue')

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
  const viewer = read('../src/components/MatchViewer.vue')
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
    expect(markupOf(viewer)).toMatch(/v-if="props\.mode === 'replay' && finished"[\s\S]{0,120}Watch again/)
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
    expect(viewer).toMatch(/v-if="props\.mode === 'live' && !finished" class="mv-shout"/)
    // Read off `markupOf` for the reason this file's own header gives: the ⚠ note that replaced the
    // placeholder QUOTES its tooltip, and a pin a comment can satisfy is not a pin.
    expect(markupOf(viewer), 'the placeholder tooltip outlived the placeholder').not.toContain(
      'Coming in Phase 6',
    )
    expect(viewer).toContain('Shout 📣')
  })

  // ⚠ ADDED 30.07. `mode` had a DEFAULT of `'live'`, added in round 4 "so existing call sites need no
  // change", and the convenience shipped a lie: TournamentFlow mounted the viewer with no `mode` at
  // all, so the busiest match screen in the app blinked a red "Live" over a bracket the engine had
  // already resolved during the tick. A prop whose default is wrong for three of its four callers is
  // the trap, so there is no default - the compiler asks every caller instead.
  it('`mode` has no default, so no call site can claim to be live by forgetting to say', () => {
    expect(viewer).toMatch(/^\s*mode: 'live' \| 'replay'$/m)
    const defaults = /withDefaults\([\s\S]*?\{([^}]*)\},\s*\)/.exec(viewer)?.[1] ?? ''
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
    const markup = markupOf(viewer)
    const row = markup.slice(markup.indexOf('class="mv-shout"'), markup.indexOf('class="mv-actions"'))
    expect(row, 'the phrases are a real dropdown').toMatch(/<select v-model="shoutPhrase"/)
    expect(row, 'and a button beside it').toMatch(/<button class="mv-shout-go"[^>]*@click="shoutIt"/)
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
    expect(viewer).toMatch(/buildCommentary\(props\.match/)
    expect(viewer, 'a shout was fed into the deterministic narrator').not.toMatch(
      /buildCommentary\([^)]*shout/i,
    )
    const commentary = read('../src/viz/commentary.ts')
    expect(commentary.toLowerCase(), 'the pure narrator learned about shouting').not.toContain('shout')
    // and a fresh watch starts with an empty mouth: the shouts belong to the run, not to the match.
    expect(viewer).toMatch(/shouts\.value = \[\]/)
  })

  it('the controls are the app\'s segmented control, not two <select>s', () => {
    expect(templateOf(viewer)).not.toContain('<select')
    expect(viewer).toContain("import SegmentedRow from './ui/SegmentedRow.vue'")
    // Values, never indices – SegmentedRow's contract, and speed is a number so it needs an adapter.
    expect(viewer).toContain('speedSeg')
  })

  it('the match panel is the shared Card, and the screen owns no colour of its own', () => {
    expect(viewer).toContain("import Card from './ui/Card.vue'")
    expect(viewer).toMatch(/<Card variant="photo" class="mv-panel">/)
    // One accent, and it arrives as a token. No hex, no eyedropper, no second lime, and no
    // hand-mixed alpha either – the two white-alpha tokens the sheet declares cover what the
    // export spells out as rgba(255,255,255,.05)/.03.
    const styles = stylesOf(viewer)
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
    const surfaceTop = courtToCanvas({ x: -COURT.doublesHalfWidth, y: 0 }, vp).y
    const bandOnPhone = surfaceTop * (299 / w)
    expect(bandOnPhone, `run-off is only ${bandOnPhone.toFixed(1)} CSS px on a 375pt phone`).toBeGreaterThan(30)
    // Symmetric, so the bottom has the same air the owner asked for.
    expect(surfaceTop).toBeCloseTo(h - courtToCanvas({ x: COURT.doublesHalfWidth, y: 0 }, vp).y, 6)
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
    expect(viewer).toContain("import WeatherPlate from './ui/WeatherPlate.vue'")
    expect(templateOf(viewer)).toContain('<WeatherPlate v-if="temperatureC != null"')
    expect(viewer).toContain('temperatureC?: number | null')
    // The number must never be computed twice: the view may not reach for the engine's generator.
    // (Prose about it in the prop's own comment is the point; an IMPORT of it would be the bug.)
    expect(viewer).not.toMatch(/import[\s\S]{0,80}eventTemperature/)
    expect(viewer).not.toMatch(/eventTemperature\(/)
    const plate = read('../src/components/ui/WeatherPlate.vue')
    // Wind does not exist in the engine in any form, so no wind figure may appear here.
    expect(plate).not.toMatch(/m\/s|km\/h|mph/)
  })

  it('the export\'s clock slot carries a real reading rather than an invented one', () => {
    // The engine has no time model, so "Match time 00:07" cannot be told honestly. The slot keeps
    // its shape and carries the live game score instead (and the point count once it is over).
    expect(viewer).toContain('gameScore')
    expect(viewer).toContain('The export gives this slot to a wall clock')
  })
})

// =====================================================================================================
// The owner's 30.07 playtest of watching a match: the chrome around the court, and the two controls he
// could not name. Six items, and five of them are one theme – rows of furniture between the header and
// the playing surface. These pins protect what each row's REMOVAL rests on, so a future slice cannot
// put a row back by accident or take the guarantee out from under the pinned bar.
// =====================================================================================================
describe('the pinned control bar can never reach the playing surface', () => {
  const viewer = read('../src/components/MatchViewer.vue')

  it('is sticky rather than fixed, so it costs no height until it would otherwise be gone', () => {
    // Owner: «maybe we need to make lower buttons on match screen fixed so we could use them
    // anytime?». Measured at 375pt: the row starts on screen at y=636 and is pushed to y=806 – off
    // the bottom – once the commentary log fills to its four rows. A `position: fixed` bar would
    // have bought that back by charging its height for the whole watch; sticky charges nothing.
    const styles = stylesOf(viewer)
    const bar = styles.slice(styles.indexOf('.mv-controls {'), styles.indexOf('.mv-seg {'))
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
    const markup = markupOf(viewer)
    const panelAt = markup.indexOf('class="mv-panel"')
    const belowAt = markup.indexOf('class="mv-below"')
    const logAt = markup.indexOf('class="mv-log"')
    const barAt = markup.indexOf('class="mv-controls"')
    const boxAt = markup.indexOf('class="mv-boxscore"')
    expect(panelAt, 'the panel is still the first thing in the viewer').toBeGreaterThan(-1)
    expect(belowAt, 'the sticky bar still has its own containing block').toBeGreaterThan(panelAt)
    // The log opens the wrapper, so the wrapper's top edge IS the log's top edge – below the panel.
    expect(logAt, 'the log is the wrapper\'s first child').toBeGreaterThan(belowAt)
    expect(barAt, 'the bar is inside .mv-below, after the log').toBeGreaterThan(logAt)
    // and the box score is inside it too, so the bar can still pin while the box score is on screen.
    expect(boxAt, 'the box score is inside the wrapper as well').toBeGreaterThan(barAt)
    expect(stylesOf(viewer)).toContain('.mv-below {')
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
    const markup = markupOf(viewer)
    const bar = markup.slice(markup.indexOf('class="mv-controls"'), markup.indexOf('class="mv-actions"'))
    expect(bar).toContain('viewSeg')
    expect(bar).toContain('speedSeg')
    expect(bar).toContain('Shout')
    expect(bar).not.toContain('Watch again')
    // ...and it is ONE sticky block, not a bar with a loose row under it: the shout is a SECOND ROW
    // of `.mv-controls` rather than a sibling that scrolls away on its own, which is the whole
    // complaint. Pinned as a full-bar cell, because the flex version of this silently failed - a
    // `max-width` clamp feeds the hypothetical main size, so all three controls shared one line and
    // the two plates were squeezed to 109px. See the rule's own note for the measurement.
    const styles = stylesOf(viewer)
    expect(styles).toMatch(/\.mv-controls\s*\{[^}]*display:\s*grid/)
    expect(styles).toMatch(/\.mv-shout\s*\{[^}]*grid-column:\s*1 \/ -1/)
  })

  it('the segmented labels fit the bar, so "Skip" cannot render as "Ski" again', () => {
    // Both rows want ~359px of pill at the sheet's 16px-a-side `.tab-pill` padding; inside a
    // .tf-card on a 375pt phone they get 293px, and the view row used to overflow its half and
    // paint over the speed plate. Trimmed for THIS bar only – the sheet's own padding is untouched,
    // and so is every other SegmentedRow.
    const styles = stylesOf(viewer)
    expect(styles).toMatch(/\.mv-controls :deep\(\.tab-pill\)/)
    expect(read('../src/style.css'), 'the shared pill padding stays the shared pill padding').toContain(
      'padding: 6px 16px',
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
   */
  const subOf = (sfc: string): string => {
    const m = markupOf(sfc)
    const at = m.indexOf('<template #sub>')
    expect(at, 'the header sub line is a #sub slot').toBeGreaterThan(-1)
    return m.slice(at, m.indexOf('</template>', at))
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

  it('the round badge rides the date line instead of renting a row', () => {
    // Owner: «on tournament match screen move quarterfinal badge higher nearby date». Same capsule,
    // now inside `.tf-sub`, which was already being drawn – and only while a match is on screen.
    // ⚠ RE-AIMED 30.07: read off the `#sub` slot rather than the `.tf-sub` element, because the
    // element belongs to the shell now. See `subOf` for the whole of what moved.
    const sub = subOf(flow)
    expect(sub).toMatch(/v-if="replayOpen" class="tf-replay-round"/)
    // ⚠ RE-AIMED, same slice: this read `pending.roundLabel`, which is the round on DECK. Moving the
    // badge onto the header line exposed a mislabel it had inherited from the old head row – on the
    // "Watch again" path the reveal has already advanced that pointer, so the badge named the next
    // round while the viewer replayed the last one. The protected fact is unchanged (the badge names
    // the round, on the date line, only while a match is open); it now names the round IN THE VIEWER.
    expect(sub).toContain('watchedRoundLabel')
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
    expect(sub).toMatch(/<SurfaceMark v-if="!replayOpen"/)
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
  // panel wrapped around a stack of panels the viewer already draws (`.mv-panel`, `.mv-log`,
  // `.mv-boxscore` are each a `Card`), so it was a border around a border. Measured at 375pt before and
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
      expect(markup, `${name} wraps the viewer in a panel`).not.toMatch(
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
    expect(markup).toMatch(/<SurfaceMark v-if="!replayOpen"/)
    // 3. and the strip really is ABOVE the viewer in the markup, which is what made it the thing the
    //    player met first when the screen opened.
    const stripAt = markup.indexOf('class="tf-strip"')
    const viewerAt = markup.indexOf('<MatchViewer')
    expect(stripAt).toBeGreaterThan(-1)
    expect(viewerAt).toBeGreaterThan(stripAt)
  })
})
