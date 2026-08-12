// CONTRAST, AS A NUMBER A MOUNTED TEST CAN ASSERT ON.
//
// ⚠ WHY THIS EXISTS. Round-17 #3: BirthdayDialog shipped four buttons whose labels were unreadable –
// `background: var(--card, #fff)` with `color: var(--ink, #1c1c1e)`, where `--card` is declared
// NOWHERE in this app and `--ink` is `#f2f6f8`. So the fallback painted the button white and the
// token painted the label near-white: a measured ratio of 1.06:1, on a dialog the player cannot
// dismiss. Every structural assertion in tests/component/birthday-dialog.test.ts passed, because
// none of them could see a colour. `tests/design-tokens.test.ts` rule A could not see it either –
// it skips any `var()` that carries a fallback (`if (ref.fallback) continue`), which is exactly the
// shape of both broken references.
//
// The measurement is WCAG 2.1 relative luminance and contrast ratio, which is the same arithmetic
// every audit tool uses, so a number here means the same thing it means anywhere else.
//
// Requires `css: true` on the component project (vite.config.ts) – without it Vitest drops the
// stylesheets and every element computes to the initial values, which would make this pass on
// anything. `assertLegible` guards against that directly.

/** #rgb / #rrggbb / rgb() / rgba() / transparent -> [r, g, b, a]. Anything else throws: an unparsed
 *  colour must never quietly become black, or a guard turns into a coin flip. */
export function parseColor(css: string): [number, number, number, number] {
  const s = css.trim().toLowerCase()
  if (s === 'transparent' || s === '') return [0, 0, 0, 0]
  const hex = /^#([0-9a-f]{3,8})$/.exec(s)
  if (hex) {
    const h = hex[1]
    const pair = (i: number) => (h.length <= 4 ? parseInt(h[i] + h[i], 16) : parseInt(h.slice(i * 2, i * 2 + 2), 16))
    const a = h.length === 4 ? pair(3) / 255 : h.length === 8 ? pair(3) / 255 : 1
    return [pair(0), pair(1), pair(2), a]
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(s)
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean).map(Number)
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
  }
  throw new Error(`contrast.ts cannot parse the colour ${JSON.stringify(css)}`)
}

/** Source-over compositing, which is what a translucent fill on a card actually does. */
function over(fg: [number, number, number, number], bg: [number, number, number]): [number, number, number] {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)]
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 2.1 contrast ratio, 1..21. */
export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** ⚠ WALKS UP AND COMPOSITES. A choice row is a translucent wash on a `--panel` card on `--bg`, so
 *  reading the element's own `background-color` alone would report `rgba(207,225,82,0.06)` and the
 *  arithmetic would be nonsense. The page's own base is the last resort, not white: this app is
 *  dark, and assuming white is the mistake that shipped #3. */
export function effectiveBackground(el: Element, base: string = '#0a0e13'): [number, number, number] {
  const stack: [number, number, number, number][] = []
  let node: Element | null = el
  while (node) {
    const c = parseColor(getComputedStyle(node).backgroundColor)
    if (c[3] > 0) {
      stack.push(c)
      if (c[3] >= 1) break
    }
    node = node.parentElement
  }
  let out = parseColor(base).slice(0, 3) as [number, number, number]
  for (let i = stack.length - 1; i >= 0; i--) out = over(stack[i], out)
  return out
}

/** The text colour an element actually paints in, inherited through the tree like the browser does. */
export function effectiveColor(el: Element): [number, number, number, number] {
  return parseColor(getComputedStyle(el).color)
}

/**
 * Assert an element's text is legible on what is behind it.
 *
 * `min` defaults to WCAG AA for body text (4.5:1). Pass 3 for large/bold text where AA allows it –
 * and say which, in `label`, so a future reader can tell a considered relaxation from a slip.
 *
 * ⚠ IT ALSO REFUSES TO RUN BLIND. If no stylesheet reached the document the whole measurement is
 * vacuous, and a vacuous guard is worse than none: it would have passed on the shipped bug.
 */
export function assertLegible(el: Element, label: string, min = 4.5): number {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`, and without it this assertion is vacuous')
  }
  const bg = effectiveBackground(el)
  const fg = over(effectiveColor(el), bg)
  const ratio = contrastRatio(fg, bg)
  if (ratio < min) {
    const hex = (c: [number, number, number]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    throw new Error(
      `${label}: ${ratio.toFixed(2)}:1 is below ${min}:1 – text ${hex(fg)} on ${hex(bg)} ` +
        `(declared color ${getComputedStyle(el).color}, own background ${getComputedStyle(el).backgroundColor})`,
    )
  }
  return ratio
}
