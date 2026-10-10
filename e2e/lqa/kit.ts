// THE LQA RUNNER'S KIT (L4-3) – what the eight routes of `routes.lqa.ts` and the PWA route share.
//
// WHAT THIS LAYER IS. `npm run lqa:ru` is NOT part of `test:e2e` and NOT part of `npm run check`: it is an on-demand instrument
// that rides the e2e harness (the production build, the seeded careers of `careerAt`, the typed locators) to drive RU-14's
// acceptance matrix under `tb-locale=ru` and to READ THE MISS COUNTER after every screen. Its product is a report
// (`lqa-ru-report.md/.json`), not a verdict on the app: a route that cannot be driven end to end says so (`partial` / `gap`) and
// says why, instead of failing a build over copy the owner has not read yet.
//
// ⚠ THE WALK IS LABEL-AGNOSTIC BY DESIGN, and that inverts the e2e suite's rule on purpose. The English suite addresses controls
// by role and accessible NAME because the names are the contract. Here the names are the thing UNDER TEST: they are English today
// (every key not in ru.json falls back, which is exactly what this run counts) and Russian one row at a time as the owner
// approves them. A walk that clicked «Season» would break on the day «Season» is translated, and a runner that breaks when
// translation succeeds measures nothing. So controls are reached by (a) the app's own structural hooks – the tab bar's
// `data-tour="tab-…"`, the Home doors' `data-tour`, the prologue's `.prologue-answers` column – or (b) `nameOf(key)`, which matches
// the English literal OR whatever `src/i18n/ru.json` carries for it TODAY, so it follows the catalog in both directions.
//
// ⚠ NO `waitForTimeout`, as everywhere in this directory. The only "settle" is two animation frames – a frame boundary, not a guess
// about a queue – so the counter is read after the screen has painted. Waits on the app are web-first assertions or `expect.poll`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'
import { test as careerTest, TOUR_ANSWERED, type CareerAt } from '../careerAt'
import type { FixtureName } from '../../tools/e2e-fixtures-read'
import type { RouteRecord, Verdict, VisitRecord } from '../../tools/lqa-ru-report'

// -------------------------------------------------------------------------------------------------
// the catalog as the NAVIGATION sees it
// -------------------------------------------------------------------------------------------------

const RU_PATH = fileURLToPath(new URL('../../src/i18n/ru.json', import.meta.url))
/** Read once per worker, at import: the Russian catalog exactly as the build under test ships it. */
export const RU: Readonly<Record<string, string>> = JSON.parse(readFileSync(RU_PATH, 'utf8')) as Record<string, string>

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Every rendering the app can show for an English key right now: the literal itself, plus the catalog's value for it (under any context tag). */
export function renderings(en: string): string[] {
  const out = new Set<string>([en])
  for (const [key, value] of Object.entries(RU)) {
    const bar = key.indexOf('|')
    const text = bar >= 0 ? key.slice(bar + 1) : key
    if (key === en || text === en) out.add(value)
  }
  return [...out]
}

/** A role-name matcher that follows the catalog: `{placeholders}` match any text, everything else is literal. */
export function nameOf(en: string, mode: 'exact' | 'prefix' | 'contains' = 'exact'): RegExp {
  const alts = renderings(en).map((r) =>
    r
      .split(/\{[A-Za-z0-9_]+\}/)
      .map(escapeRe)
      .join('.+?'),
  )
  return new RegExp(`${mode === 'contains' ? '' : '^'}(?:${alts.join('|')})${mode === 'exact' ? '$' : ''}`, mode === 'contains' ? 'i' : '')
}

/** The tab bar's seats – the app's own `data-tour` hooks, locale-independent. */
export type TabId = 'play' | 'calendar' | 'home' | 'stats' | 'trophies'
export const tabButton = (page: Page, id: TabId) => page.locator(`[data-tour="tab-${id}"]`)

/** The doors on Home that open the tabless screens, by the same hooks the onboarding tour points at. */
export const DOOR = {
  settings: '[data-tour="home-settings"]',
  budget: '[data-tour="family-budget"]',
  tournament: '[data-tour="next-tournament"]',
  kid: '[data-tour="kid-avatar"]',
} as const

/** Seed options for a career whose tour has been answered and whose language is Russian. */
export function ruCareer(extra: Record<string, string> = {}): { splash: RegExp; localStorage: Record<string, string> } {
  return { splash: nameOf('Tap to start'), localStorage: { 'tb-locale': 'ru', ...TOUR_ANSWERED, ...extra } }
}

export async function bootCareer(careerAt: CareerAt, name: FixtureName, extra: Record<string, string> = {}): Promise<void> {
  await careerAt(name, ruCareer(extra))
}

// -------------------------------------------------------------------------------------------------
// the recorder
// -------------------------------------------------------------------------------------------------

interface HookTake {
  count: number
  keys: string[]
  capped: boolean
}
interface HookShape {
  locale(): string
  htmlLang(): string
  take(): HookTake
  reset(): void
}
const HOOK = '__tbLqa'

export const OUT_DIR = process.env.LQA_OUT ?? `${process.cwd()}/lqa-out`

/** Wait for the LQA build's hook and prove the page is in Russian – the instrument's own precondition, failed loudly. */
export async function hookReady(page: Page, expected: 'ru' | 'en' = 'ru'): Promise<void> {
  await page.waitForFunction((name) => Reflect.has(window, name), HOOK)
  expect(await page.evaluate((name) => (Reflect.get(window, name) as HookShape).locale(), HOOK), `the LQA runner expected locale ${expected}`).toBe(expected)
}

/** An error as one readable line: colour codes stripped, the first two informative lines kept (Playwright puts the locator on the second). */
export function whyFailed(error: unknown): string {
  // eslint-disable-next-line no-control-regex
  const plain = (error instanceof Error ? error.message : String(error)).replace(/\u001b\[[0-9;]*m/g, '')
  const lines = plain.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('Error:'))
  return (lines.slice(0, 2).join(' / ') || 'unknown error').slice(0, 260)
}

export class Recorder {
  readonly visits: VisitRecord[] = []
  readonly notes: string[] = []
  verdict: Verdict = 'driven'
  why = ''
  private failures = 0

  constructor(
    readonly page: Page,
    readonly route: number,
    readonly part: string,
    readonly title: string,
  ) {
    page.on('pageerror', (error) => this.notes.push(`page error: ${error.message.split('\n')[0]}`))
  }

  /** Two frames, then read-and-clear the counter: what THIS screen missed. */
  async visit(label: string, facts: Record<string, string | number | boolean> = {}): Promise<VisitRecord> {
    await this.page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const read = await this.page.evaluate((name) => {
      const hook = Reflect.get(window, name) as HookShape
      const taken = hook.take()
      const root = document.documentElement
      return { taken, overflowPx: Math.max(0, root.scrollWidth - root.clientWidth), width: window.innerWidth, height: window.innerHeight, lang: hook.htmlLang() }
    }, HOOK)
    const visit: VisitRecord = {
      label,
      misses: read.taken.count,
      keys: read.taken.keys,
      capped: read.taken.capped,
      facts: { viewport: `${read.width}x${read.height}`, overflowPx: read.overflowPx, htmlLang: read.lang, ...facts },
    }
    this.visits.push(visit)
    return visit
  }

  /** Discard what the counter holds (boot noise, a state we are only passing through). */
  async clear(): Promise<void> {
    await this.page.evaluate((name) => (Reflect.get(window, name) as HookShape).reset(), HOOK)
  }

  note(text: string): void {
    this.notes.push(text)
  }

  /** The route reached this far and no further – recorded, not thrown: the report carries the reason. */
  partial(why: string): void {
    if (this.verdict === 'driven') this.verdict = 'partial'
    this.why = this.why ? `${this.why}; ${why}` : why
  }

  gap(why: string): void {
    this.verdict = 'gap'
    this.why = why
  }

  /** What puts the page back on a screen a walk can continue from after a step failed (set by the route). */
  recover: () => Promise<void> = async () => {}

  /** One stretch of a route. A failure inside it is RECORDED – the route turns `partial` and the reason (first line of the error) goes in the
   *  report – and the walk goes on from wherever `recover` puts it. It is never a red test: the report, not the exit code, says what was not reached. */
  async step(stage: string, body: () => Promise<void>): Promise<boolean> {
    try {
      await body()
      return true
    } catch (error) {
      const first = whyFailed(error)
      this.failures++
      if (this.failures <= 3) this.partial(`«${stage}» not reached: ${first.slice(0, 200)}`)
      else if (this.failures === 4) this.partial('more steps not reached – see the notes')
      this.notes.push(`step «${stage}» failed: ${first.slice(0, 300)}`)
      await this.recover().catch(() => undefined)
      return false
    }
  }

  record(): RouteRecord {
    return { route: this.route, part: this.part, title: this.title, verdict: this.verdict, why: this.why, visits: this.visits, notes: this.notes }
  }

  save(): void {
    mkdirSync(OUT_DIR, { recursive: true })
    writeFileSync(`${OUT_DIR}/route-${this.route}-${this.part}.json`, `${JSON.stringify(this.record(), null, 2)}\n`)
  }
}

/**
 * WHATEVER THE BOOT PUT IN FRONT OF HOME: a briefing, a knock, a life beat. Each is a screen worth reading (it is recorded as a visit of its
 * own), and each is BLOCKING – the tab bar underneath cannot be clicked until it is answered, so a walk that ignored them would hang on its
 * first click. Pressed through the way the e2e journeys do: a card with answers takes the first answer and then its last control (Proceed);
 * a card with only buttons takes the first. Bounded, and never a red test: whatever is left is reported by the step that meets it.
 */
export async function clearBlockingCards(rec: Recorder): Promise<number> {
  const { page } = rec
  const dialog = page.getByRole('dialog')
  let seen = 0
  for (let i = 0; i < 6; i++) {
    if ((await dialog.count()) === 0) break
    seen += 1
    // What the card is and where it sits – the report says so, because a «blocking card» that is really an off-screen sheet would be a finding of its own.
    const card = await dialog.first().evaluate((el) => {
      const box = el.getBoundingClientRect()
      const heading = el.querySelector('[role="heading"], h1, h2, h3')?.textContent?.trim().slice(0, 60) ?? ''
      const last = Array.from(el.querySelectorAll('button')).pop()?.getBoundingClientRect()
      return { heading, position: getComputedStyle(el).position, top: Math.round(box.top), bottom: Math.round(box.bottom), lastControlBottom: last ? Math.round(last.bottom) : -1, scrollH: el.scrollHeight, clientH: el.clientHeight }
    })
    await rec.visit(`a blocking card at boot (${seen})`, { cardHeading: card.heading, cardPosition: card.position, cardTop: card.top, cardBottom: card.bottom, lastControlBottom: card.lastControlBottom, cardScrollH: card.scrollH, cardClientH: card.clientH })
    const radios = dialog.first().getByRole('radio')
    if (await radios.count()) {
      await radios.first().click()
      await dialog.first().getByRole('button').last().click()
    } else {
      await dialog.first().getByRole('button').first().click()
    }
    await expect(dialog.first(), 'the blocking card did not go away').toBeHidden().catch(() => undefined)
  }
  return seen
}

export type StartRoute = (route: number, part: string, title: string) => Recorder

export const test = careerTest.extend<{ lqa: StartRoute }>({
  lqa: async ({ page }, use) => {
    const started: Recorder[] = []
    await use((route, part, title) => {
      const recorder = new Recorder(page, route, part, title)
      started.push(recorder)
      return recorder
    })
    // Saved on the way out whatever happened – a route that threw before its first visit still leaves a record saying so.
    for (const recorder of started) {
      if (recorder.visits.length === 0 && recorder.verdict === 'driven') recorder.gap('no screen was visited')
      recorder.save()
    }
  },
})

export { expect, TOUR_ANSWERED }
