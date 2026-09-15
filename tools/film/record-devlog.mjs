// Film TWO TALENTED PLAYERS. TWO VERY DIFFERENT CAREERS. – 1080x1080, two real careers side by side.
//
// ⚠ NOTHING HERE IS A REPLAY AND NOTHING IS RE-SIMULATED. Both panels are the shipped app reading a
// career that was put on that origin's disk through the shipped import door; every screen the film
// stands on is the screen a player taps to. The recorder navigates, measures, crops and holds. It
// does not compute a game value, and the only strings it owns are the captions and the labels.
//
// ⚠ THE OWNER'S FILES ARE NEVER WRITTEN TO AND NEVER LEAVE THE MACHINE. They are read once, passed
// as base64 into a throwaway browser profile, and the two careers live in two dev-server origins
// that are not the browser the owner plays in.
//
// ⚠ CAPTURE. Playwright records at CSS resolution 1:1, so `--force-device-scale-factor=2` on the
// browser is what turns a 1080 CSS stage into a true 2160x2160 screencast; the assembler halves it.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/devlogfilm'
const LEFT = process.argv[3] || '/Users/letulip/Downloads/tennis-sim_prologue-kbakekls_w517.tsave'
const RIGHT = process.argv[4] || '/Users/letulip/Downloads/tennis-sim_alice_prologue-pmb8nzwh_w405.tsave'
const PORT_A = 5843
const PORT_B = 5844
fs.mkdirSync(OUT, { recursive: true })

const WATCHDOG_MS = Number(process.env.FILM_WATCHDOG_MS || 12 * 60 * 1000)
let lastStep = 'boot'
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: no completion – last step: ${lastStep}`)
  process.exit(3)
}, WATCHDOG_MS)
const step = (s) => {
  lastStep = s
  console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${s}`)
}
const T0 = Date.now()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// =================================================================================================
// THE SHOTS – the owner's script, with the screen each one stands on
// =================================================================================================
// `card` is the selector the crop is measured from, resolved INSIDE each frame and unioned across
// the two so both panels get one rect. `pad` is breathing room in layout px.
const SHOTS = [
  {
    key: 'kid', hold: 3.4, screen: 'kid', card: null,
    caption: ['Two talented players.', 'Two very different careers.'],
    when: ['Week 517 · Age 23', 'Week 405 · Age 21'], note: '',
  },
  {
    key: 'slam-peek', hold: 1.6, screen: 'trophies', card: { shelf: 'Slam' }, keepCaption: true,
    caption: ['Two talented players.', 'Two very different careers.'],
    when: ['Week 517 · Age 23', 'Week 405 · Age 21'], note: 'Trophy cabinet · Grand Slam shelf',
  },
  {
    key: 'coach', hold: 6.0, screen: 'kid', card: { sel: '.kid-tile', from: 2, to: 5 },
    caption: ['Different resources.', 'Different support.'],
    when: ['Week 517 · Age 23 · working background', 'Week 405 · Age 21 · wealthy background'],
    note: 'Current coach – not coaching across the whole career',
  },
  {
    key: 'radar', hold: 7.0, screen: 'kid', card: { panel: 'SKILLS' },
    caption: ['Zoe: exceptional composure.', 'Alice: stronger return, groundstrokes.'],
    when: ['Week 517 · Age 23', 'Week 405 · Age 21'],
    note: 'Developer observation · the radar is the game’s own fog of war',
  },
  {
    key: 'first250', hold: 7.0, screen: 'trophies', card: { shelf: 'WT250' },
    caption: ['Their first WTA 250 titles:', 'Zoe – week 274 · Alice – week 112'],
    when: ['First WTA 250 title · week 274', 'First WTA 250 title · week 112'],
    note: 'Weeks from career start',
  },
  {
    key: 'season5', hold: 7.0, screen: 'stats', card: { rows: ['2035'] },
    caption: ['End of season 5:', 'Zoe #98 · Alice #3'],
    when: ['Season 5 · 2035', 'Season 5 · 2035'],
    note: 'Season by season · Professional table',
  },
  {
    key: 'history', hold: 7.0, screen: 'stats', card: { section: '#stats-seasons' },
    caption: ['A slower climb can still', 'become a top-ten career.'],
    when: ['Recorded seasons 1–10', 'Recorded seasons 1–7'],
    note: 'Season-end Professional rank, as recorded',
  },
  {
    key: 'shelves', hold: 7.0, screen: 'trophies', card: { shelfSpan: ['WT500', 'Slam'] },
    caption: ['Six WTA 500 titles against eleven.', 'No Slam yet, against one.'],
    when: ['Week 517 · Age 23', 'Week 405 · Age 21'],
    note: 'At these save points \u00b7 different career lengths',
  },
]
const LOGO_CAPTION = ['Talent is not a single number.']
const LOGO_HOLD = 4.0
const LOGO_TAIL = 2.0

// =================================================================================================
// FRAME PLUMBING
// =================================================================================================
const inFrame = (f, fn, arg) => f.evaluate(fn, arg)

async function dismissDialogs(f) {
  for (let i = 0; i < 10; i++) {
    const open = await inFrame(f, () => !!document.querySelector('.dialog-overlay'))
    if (!open) return
    await inFrame(f, () => {
      const bs = Array.from(document.querySelectorAll('.dialog-overlay button'))
      const pick = bs.find((b) => /^(continue|not now|close|later|ok|dismiss)/i.test((b.innerText || '').trim())) ?? bs[bs.length - 1]
      if (pick && !pick.disabled) pick.click()
    })
    await wait(550)
  }
  throw new Error('a dialog would not close')
}

/** A box on screen in LAYOUT px – rects come back in visual px, so both are divided by the zoom. */
async function rectOf(f, sel) {
  return inFrame(f, (s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  }, sel)
}

async function goTab(f, label) {
  const ok = await inFrame(f, (l) => {
    const b = Array.from(document.querySelectorAll('.tab-btn')).find((x) => x.querySelector('.tab-label')?.textContent?.trim() === l)
    if (!b || b.disabled) return false
    b.click()
    return true
  }, label)
  if (!ok) throw new Error(`no tab "${label}"`)
  await wait(700)
  await dismissDialogs(f)
}

async function goKid(f) {
  await goTab(f, 'Home')
  // ⚠ NOT THE «Tap the photo» CALLOUT. That is R13-12's ONE-TIME hint (`.diary-kid-hint`): it is
  // gone from the second visit onwards, and a walk that relied on it reached her page once and then
  // could not find the door. The avatar itself is the door and it is always there.
  const ok = await inFrame(f, () => {
    const b = document.querySelector('.diary-avatar-btn')
    if (!b) return false
    b.click()
    return true
  })
  if (!ok) throw new Error('no way through to her page – the avatar is not on Home')
  await wait(800)
  await dismissDialogs(f)
}

async function goStats(f) {
  await goTab(f, 'Stats')
  // The Professional table, explicitly – `kidRank` is the international alias and the film is not
  // allowed to show it by accident.
  const picked = await inFrame(f, () => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Professional')
    if (!b) return 'missing'
    b.click()
    return 'clicked'
  })
  if (picked === 'missing') throw new Error('no Professional tab on Stats')
  await wait(600)
}

async function goScreen(f, screen) {
  if (screen === 'kid') return goKid(f)
  if (screen === 'trophies') return goTab(f, 'Trophies')
  if (screen === 'stats') return goStats(f)
  throw new Error(`unknown screen ${screen}`)
}

/** Put the shot's subject at a known place in the frame's own viewport, then hand back its box.
 *
 * ⚠ EVERY NUMBER HERE IS PLAIN CSS px. The frame is a fixed 414 x 896 element and the stage scales
 * it with a transform, so nothing inside the frame is ever zoomed and a rect means what it says.
 * The scroll is a `scrollBy` delta straight off a rect rather than an absolute `scrollTo`: the
 * screens scroll the document itself and a delta needs no assumption about where it started. */
const FIND = `(c) => {
  const up = (s) => (s || '').trim().toUpperCase()
  const shelves = () => Array.from(document.querySelectorAll('section.trophy-shelf'))
  const byEyebrow = (name) => shelves().find((s) => up(s.querySelector('h2')?.textContent) === up(name))
  let els = []
  if (c.shelf) els = [byEyebrow(c.shelf)]
  else if (c.shelfSpan) {
    const all = shelves()
    const i = all.indexOf(byEyebrow(c.shelfSpan[0]))
    const j = all.indexOf(byEyebrow(c.shelfSpan[1]))
    if (i >= 0 && j >= i) els = all.slice(i, j + 1)
  } else if (c.panel) {
    els = [Array.from(document.querySelectorAll('.kid-panel')).find((p) => up(p.querySelector('h2,h3')?.textContent) === up(c.panel))]
  } else if (c.sel) {
    els = Array.from(document.querySelectorAll(c.sel)).slice(c.from, c.to)
  } else if (c.section) {
    els = [document.querySelector(c.section)]
  } else if (c.rows) {
    const table = document.querySelector('#stats-seasons table') || document.querySelector('#stats-seasons')
    if (table) {
      const rows = Array.from(table.querySelectorAll('tr')).filter((r) => c.rows.some((y) => (r.innerText || '').includes(y)))
      const head = table.querySelector('thead tr') || table.querySelector('tr')
      els = [head, ...rows]
    }
  }
  return els.filter(Boolean)
}`

async function placeCard(f, card, pad = 26) {
  if (!card) {
    await inFrame(f, () => window.scrollTo(0, 0))
    await wait(260)
    return { x: 0, y: 0, w: 414, h: 896 }
  }
  const arg = JSON.stringify(card)
  const found = await inFrame(f, ([raw, find, p]) => {
    const els = eval(find)(JSON.parse(raw))
    if (!els.length) return 0
    window.scrollBy(0, els[0].getBoundingClientRect().top - p)
    return els.length
  }, [arg, FIND, pad])
  if (!found) return null
  await wait(340)
  return inFrame(f, ([raw, find]) => {
    const els = eval(find)(JSON.parse(raw))
    if (!els.length) return null
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const e of els) {
      const r = e.getBoundingClientRect()
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top)
      x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom)
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  }, [arg, FIND])
}

const PANEL_MAX_W = (1080 - 2 * 44 - 40) / 2 // 476
const PANEL_MAX_H = 778

// ⚠ ASYMMETRIC, AND MEASURED. A symmetric pad let the line BELOW the subject bleed into the bottom
// of the crop – on the coach shot that was half a sentence about her bank account.
function cropFor(a, b, pad = 14, foot = 4) {
  const x = Math.max(0, Math.min(a.x, b.x) - pad)
  const y = Math.max(0, Math.min(a.y, b.y) - pad)
  const w = Math.min(414 - x, Math.max(a.x + a.w, b.x + b.w) - x + pad)
  const h = Math.min(896 - y, Math.max(a.y + a.h, b.y + b.h) - y + foot)
  const zoom = Math.min(PANEL_MAX_W / w, PANEL_MAX_H / h, 2.4)
  return { zoom, x, y, w, h }
}

// =================================================================================================
// THE TAKE
// =================================================================================================
const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 2160, height: 2160 } },
})
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))

for (const [port, path] of [[PORT_A, LEFT], [PORT_B, RIGHT]]) {
  step(`install ${path.split('/').pop()} on :${port}`)
  const b64 = fs.readFileSync(path).toString('base64')
  await page.goto(`http://localhost:${port}/tools/film/install-save.html`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => typeof window.__install === 'function', null, { timeout: 45000 })
  const meta = await page.evaluate((b) => window.__install(b), b64)
  step(`  -> ${meta.kid} seed ${meta.seed} week ${meta.week} schema ${meta.schemaVersion}`)
}

step('open the stage')
await page.goto(`http://localhost:${PORT_A}/tools/film/devlog-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__stage === 'object', null, { timeout: 45000 })
await page.evaluate(() => window.__stage.lit(false))

const frames = () => page.frames().filter((f) => f !== page.mainFrame())
for (let i = 0; i < 60 && frames().length < 2; i++) await wait(400)
if (frames().length < 2) throw new Error('both panels never appeared')
const fa = frames().find((f) => f.url().includes(String(PORT_A)))
const fb = frames().find((f) => f.url().includes(String(PORT_B)))
if (!fa || !fb) throw new Error('could not tell the two panels apart')

step('boot both panels')
for (const f of [fa, fb]) {
  for (let i = 0; i < 40; i++) {
    const s = await f.$('[aria-label="Tap to start"]')
    if (s) {
      await s.click()
      break
    }
    await wait(400)
  }
}
await wait(3000)
for (const f of [fa, fb]) await dismissDialogs(f)


// ⚠ SORA, OR THE TAKE IS NOT THE FILM. `document.fonts.ready` on the stage AND inside both frames –
// a fallback face in either place is a different clip from the one that was designed.
await page.evaluate(() => document.fonts.ready.then(() => true))
for (const f of [fa, fb]) await inFrame(f, () => document.fonts.ready.then(() => true))
const fontsLoaded = await page.evaluate(() => document.fonts.check('600 50px Sora'))
if (!fontsLoaded) {
  console.error('REFUSED: Sora is not loaded on the stage')
  process.exit(2)
}

// The two careers, read off the live app rather than off the brief.
const readPanel = async (f) =>
  inFrame(f, () => {
    const g = document.querySelector('.tab-btn')
    return {
      url: location.origin,
      desktopArm: window.matchMedia('(min-width: 768px)').matches,
      layoutWidth: document.documentElement.clientWidth,
      layoutHeight: document.documentElement.clientHeight,
      body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200),
      hasTabs: !!g,
    }
  })
const panelA = await readPanel(fa)
const panelB = await readPanel(fb)
for (const [which, p] of [['left', panelA], ['right', panelB]]) {
  if (p.desktopArm) {
    console.error(`REFUSED: the ${which} panel is in the desktop media arm –`, JSON.stringify(p))
    process.exit(2)
  }
}
step(`panels ready | left ${panelA.layoutWidth}x${panelA.layoutHeight} | right ${panelB.layoutWidth}x${panelB.layoutHeight}`)

const marks = []
const shotLog = []
const filmStart = (Date.now() - T0) / 1000
await page.evaluate(() => window.__stage.lit(true))

let lastScreen = null
let lastCaption = null
for (const shot of SHOTS) {
  const start = (Date.now() - T0) / 1000
  step(`shot ${shot.key}`)
  await page.evaluate(() => window.__stage.floor(false))
  await wait(260)

  if (shot.screen !== lastScreen) {
    for (const f of [fa, fb]) await goScreen(f, shot.screen)
    lastScreen = shot.screen
  }
  const ra = await placeCard(fa, shot.card)
  const rb = await placeCard(fb, shot.card)
  if (!ra || !rb) throw new Error(`[${shot.key}] the subject is not on either screen`)
  const crop2 = cropFor(ra, rb)
  for (const [which, f] of [['left', fa], ['right', fb]]) {
    const lw = await inFrame(f, () => document.documentElement.clientWidth)
    if (Math.abs(lw - 414) > 2) throw new Error(`[${shot.key}] the ${which} panel's layout box is ${lw}, not 414 – the phone arm is not safe`)
  }

  const cap = shot.keepCaption && lastCaption ? lastCaption : shot.caption
  await page.evaluate(
    ([c, capt, when, note, keep]) => {
      window.__stage.crop(c)
      if (!keep) window.__stage.caption(capt)
      window.__stage.labels('Zoe Slavic', 'Alice Martin', when[0], when[1])
      window.__stage.note(note)
    },
    [crop2, cap, shot.when, shot.note, !!shot.keepCaption],
  )
  lastCaption = cap
  await wait(60)
  await page.evaluate(() => window.__stage.floor(true))
  await wait(300)

  // ⚠ THE CAPTION LANE IS A HARD RULE, SO IT IS CHECKED RATHER THAN EYEBALLED. «Maximum two lines»,
  // inside the lane, never across a panel. A wrapped line is a THIRD line and it pushes the copy
  // down over the game – which is exactly what the first take did on two shots.
  const capFit = await page.evaluate(() => {
    const lane = document.querySelector('.lane')
    const el = document.querySelector('.cap')
    if (!el) return { lines: 0, wrapped: [], fits: true }
    const lh = parseFloat(getComputedStyle(el).fontSize) * 1.24
    const rows = Array.from(el.querySelectorAll('.cap-line')).map((n) => ({
      text: n.textContent,
      w: Math.round(n.getBoundingClientRect().width),
      wrapped: n.getBoundingClientRect().height > lh * 1.35,
    }))
    const r = el.getBoundingClientRect()
    const l = lane.getBoundingClientRect()
    return { lines: rows.length, rows, fits: r.top >= l.top - 1 && r.bottom <= l.bottom + 1 }
  })
  if (capFit.lines > 2) throw new Error(`[${shot.key}] the caption is ${capFit.lines} lines – the brief allows two`)
  const wrapped = (capFit.rows ?? []).filter((x) => x.wrapped)
  if (wrapped.length) throw new Error(`[${shot.key}] a caption line wrapped: ${JSON.stringify(wrapped.map((x) => x.text))}`)
  if (!capFit.fits) throw new Error(`[${shot.key}] the caption is outside its lane`)

  // ⭐ THE HOLD IS RECORDED GENEROUSLY AND CUT TO THE SCRIPT LATER. Navigating two real apps to a
  // screen takes seconds, and those seconds cannot live inside a shot whose length the owner wrote
  // down – so the take carries dead air between shots and `assemble-devlog.mjs` keeps only
  // `[holdStart + LEAD, + scripted length]` out of each one.
  const holdStart = (Date.now() - T0) / 1000
  await wait((shot.hold + 0.9) * 1000)
  const end = (Date.now() - T0) / 1000
  marks.push({ key: shot.key, start, end, holdStart, hold: shot.hold, caption: cap, fit: capFit })
  shotLog.push({
    key: shot.key, screen: shot.screen, crop: crop2, caption: cap, when: shot.when, note: shot.note,
    leftText: await inFrame(fa, () => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400)),
    rightText: await inFrame(fb, () => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400)),
  })
}

// ── the logo card ────────────────────────────────────────────────────────────────────────────────
step('logo')
const logoStart = (Date.now() - T0) / 1000
await page.evaluate(() => window.__stage.floor(false))
await wait(300)
await page.evaluate((cap) => {
  window.__stage.mode('logo')
  window.__stage.logoStep(0)
  window.__stage.caption(cap)
  window.__stage.note('')
}, LOGO_CAPTION)
await page.evaluate(() => window.__stage.floor(true))
await wait(400)
const logoHoldStart = (Date.now() - T0) / 1000
await wait((LOGO_HOLD + 0.9) * 1000)
marks.push({ key: 'logo', start: logoStart, end: (Date.now() - T0) / 1000, holdStart: logoHoldStart, hold: LOGO_HOLD, caption: LOGO_CAPTION, note: 'Ties Break wordmark – the app\u2019s own splash assets' })
const tailStart = (Date.now() - T0) / 1000
await page.evaluate(() => {
  window.__stage.caption([])
  window.__stage.logoStep(1)
})
await wait(500)
const tailHoldStart = (Date.now() - T0) / 1000
await wait((LOGO_TAIL + 0.9) * 1000)
marks.push({ key: 'logo-tail', start: tailStart, end: (Date.now() - T0) / 1000, holdStart: tailHoldStart, hold: LOGO_TAIL, caption: [], note: 'Ace Parent appears beneath the wordmark' })
await page.evaluate(() => window.__stage.lit(false))
await wait(400)

const total = (Date.now() - T0) / 1000 - filmStart
step(`done – ${total.toFixed(2)}s of film`)
const report = { filmStart, total, marks, panelA, panelB, shots: shotLog, stage: await page.evaluate(() => window.__stage.report()) }
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify(report, null, 1))
clearTimeout(watchdog)
await ctx.close()
await browser.close()

console.log('\nbeats:')
for (const m of marks) console.log(`  ${m.key.padEnd(11)} hold from ${m.holdStart.toFixed(2)} for ${m.hold.toFixed(2)}s (recorded ${(m.end - m.holdStart).toFixed(2)}s)`)
console.log('\ncrops:')
for (const s of shotLog) console.log(`  ${s.key.padEnd(11)} ${s.screen.padEnd(9)} zoom ${s.crop.zoom.toFixed(2)} x${Math.round(s.crop.x)} y${Math.round(s.crop.y)} ${Math.round(s.crop.w)}x${Math.round(s.crop.h)}`)
