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
    expect(viewer).toMatch(/v-if="props\.mode === 'replay'"[\s\S]{0,120}Watch again/)
    expect(viewer).toMatch(/v-else disabled title="Coming in Phase 6"/)
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
