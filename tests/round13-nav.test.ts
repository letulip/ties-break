// R13-12 – the navigation restructure (the owner's #12, his design, agreed; 28.07.2026, second
// visit to fix/r13-quick). New bottom nav Home · Season · This week · Stats · More; the Kid
// screen moved behind the header avatar (one-time hint); Home became the diary page; the
// This-week tab took the plan controls and the WeekRecapCard (with a fresh-recap accent dot);
// the sticky advance bar went GLOBAL. Ledger: docs/rounds/round-13.md, "R13-12".
//
// The file-reading tests are the house discipline (round10/11/12-view): these are facts about
// templates, and those are exactly the facts that silently rot. The dot rule is pinned as REAL
// unit tests on the pure pair in src/composables/weekRecap.ts.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { recapExists, thisWeekDotShows } from '../src/composables/weekRecap'
import type { Snapshot, WorldEvent } from '../src/shared/protocol'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const app = read('../src/App.vue')
const home = read('../src/components/screens/HomeScreen.vue')
const weekScreen = read('../src/components/screens/ThisWeekScreen.vue')
const tour = read('../src/components/OnboardingTour.vue')

// ===========================================================================
// The bottom bar: five tabs, the owner's five, in the owner's order.
// ===========================================================================
describe('R13-12 — the bottom nav is Home · Season · This week · Stats · More', () => {
  it('TABS carries exactly the five entries, in order, and no Kid entry', () => {
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('function iconUrl'))
    const labels = [...tabs.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
    expect(labels).toEqual(['Home', 'Season', 'This week', 'Stats', 'More'])
    const ids = [...tabs.matchAll(/id: '([^']+)'/g)].map((m) => m[1])
    expect(ids).toEqual(['home', 'play', 'week', 'stats', 'more'])
    expect(tabs).not.toContain("'kid'")
  })

  it("the This-week tab's icon exists and is its own glyph, not a rename of the Season calendar", () => {
    expect(existsSync(new URL('../public/icons/week.svg', import.meta.url))).toBe(true)
    const week = read('../public/icons/week.svg')
    const season = read('../public/icons/season.svg')
    expect(week).not.toBe(season)
  })

  it("'kid' and 'money' stay valid CONTENT states – screens without a tab button", () => {
    expect(app).toContain("type TabId = 'home' | 'play' | 'week' | 'kid' | 'stats' | 'money' | 'more'")
    expect(app).toContain(`<KidScreen v-else-if="tab === 'kid'" />`)
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'" />`)
  })
})

// ===========================================================================
// Kid: reachable ONLY via the header avatar, with a one-time hint.
// ===========================================================================
describe('R13-12 — the Kid screen opens from the header avatar', () => {
  it('the avatar is a button that routes to the kid state – the ONE door', () => {
    expect(app).toContain('data-tour="kid-avatar"')
    expect(app).toContain('@click="openKid"')
    const openKid = app.slice(app.indexOf('function openKid'), app.indexOf('</script>'))
    expect(openKid).toContain("tab.value = 'kid'")
    // ...and no other site in the shell sets the kid state (openKid is the only writer).
    expect(app.split("tab.value = 'kid'").length - 1).toBe(1)
  })

  it('the avatar stays F45-1: the tap wrapper did not re-route the crop', () => {
    // The button wraps the SAME age-only crop – interactivity was added, the emotion path was not
    // (tests/round11-followups.test.ts still sweeps the shell for the emotion composable).
    expect(app).toContain('useHeaderAvatar')
    expect(app).toContain(':src="avatarUrl"')
  })

  it('the hint shows until first tap, and the tap persists the dismissal OUTSIDE the save', () => {
    expect(app).toContain("const KID_HINT_KEY = 'tb:kidAvatarHintSeen'")
    // shown iff never dismissed on this device (the TOUR_SEEN_KEY idiom, localStorage)...
    expect(app).toContain('const showKidHint = ref(!localStorage.getItem(KID_HINT_KEY))')
    // ...and the first avatar tap both opens the screen and persists the dismissal.
    const openKid = app.slice(app.indexOf('function openKid'), app.indexOf('</script>'))
    expect(openKid).toContain("localStorage.setItem(KID_HINT_KEY, '1')")
    // NOT in the save: no store/engine surface knows the key.
    for (const rel of ['../src/stores/game.ts', '../src/engine/world.ts', '../src/shared/protocol.ts']) {
      expect(read(rel)).not.toContain('kidAvatarHint')
    }
  })

  it('the hint copy obeys the player-copy rules: short dash, no Cyrillic', () => {
    expect(app).toContain('Tap the photo – her page lives here')
    const template = app.slice(app.indexOf('<template>'))
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
  })
})

// ===========================================================================
// The This-week tab: the moved block, and the fresh-recap dot.
// ===========================================================================
describe('R13-12 — the This-week tab owns the plan and the recap', () => {
  it('the plan controls and the WeekRecapCard left Home for the This-week screen', () => {
    for (const marker of ['WEEK_PLAN_PRESETS', 'WeekRecapCard', 'this-week-plan', 'Planned spend', 'dismissedRecapKey']) {
      expect(home, `HomeScreen must no longer carry ${marker}`).not.toContain(marker)
      expect(weekScreen, `ThisWeekScreen must carry ${marker}`).toContain(marker)
    }
  })

  it('Home is the diary page now – and everything that stays is still there', () => {
    for (const marker of [
      'photo-card', // the living photo
      'diary.photoLine', // name/phrase
      'diary.conditionNote', // condition + note
      'Next tournament', // the compact summary the diary keeps
      '<h2>News</h2>',
      'diary.memory', // Memory
      'season-strip', // untouched by the move
    ]) {
      expect(home, `HomeScreen must keep ${marker}`).toContain(marker)
    }
  })

  it('the screen leaves room structurally: status and plan are sibling sections', () => {
    expect(weekScreen).toContain('<h2>This week</h2>')
    expect(weekScreen).toContain('<h2>Training plan</h2>')
  })

  it('the card renders by the SHARED existence rule – the same one the dot reads', () => {
    expect(weekScreen).toContain("import { recapExists } from '../../composables/weekRecap'")
    expect(app).toContain("import { recapExists, thisWeekDotShows } from './composables/weekRecap'")
  })
})

describe('R13-12 — the dot rule (unit): a FRESH recap is unseen', () => {
  const event = (over: Partial<WorldEvent>): WorldEvent =>
    ({ id: 1, week: 0, type: 'info', text: 'x', ...over }) as WorldEvent
  const pendingRun = { eventId: 1 } as unknown as Snapshot['pending']

  it('a recap exists after a resolved ordinary week', () => {
    expect(recapExists({ week: 3, pending: undefined, events: [event({ type: 'info', week: 3 })] })).toBe(true)
  })

  it('never on week 0 – a career start has nothing to recap', () => {
    expect(recapExists({ week: 0, pending: undefined, events: [] })).toBe(false)
  })

  it('never on a tournament week (the flow’s own cards cover it), but an OLD tournament does not block', () => {
    expect(recapExists({ week: 3, pending: undefined, events: [event({ type: 'tournament', week: 3 })] })).toBe(false)
    expect(recapExists({ week: 4, pending: undefined, events: [event({ type: 'tournament', week: 3 })] })).toBe(true)
  })

  it('never while a reveal is pending, and never without a snapshot', () => {
    expect(recapExists({ week: 3, pending: pendingRun, events: [] })).toBe(false)
    expect(recapExists(null)).toBe(false)
  })

  it('the dot: exists AND the tab not visited since the week resolved', () => {
    expect(thisWeekDotShows(true, 3, -1)).toBe(true) // never visited – fresh
    expect(thisWeekDotShows(true, 3, 2)).toBe(true) // visited before the week resolved – fresh
    expect(thisWeekDotShows(true, 3, 3)).toBe(false) // visited – seen
    expect(thisWeekDotShows(false, 3, -1)).toBe(false) // no recap, no dot (tournament/pending/week 0)
  })

  it('the wiring: per-career watermark, marked seen on visiting the tab AND on a week landing while on it', () => {
    expect(app).toContain('tb:lastSeenThisWeek:${game.snapshot?.careerId')
    const block = app.slice(app.indexOf('const weekSeenKey'), app.indexOf('const showKidHint'))
    expect(block).toContain("if (t === 'week') markThisWeekSeen()")
    expect(block).toContain("if (tab.value === 'week') markThisWeekSeen()")
    // the dot renders with the same accent idiom as the Season/news dots
    expect(app).toContain(`v-else-if="t.id === 'week' && weekTabDot" class="tab-dot"`)
  })
})

// ===========================================================================
// The advance bar: GLOBAL, in the App shell, in no tab screen.
// ===========================================================================
describe('R13-12 — the advance button stays global in the App shell', () => {
  it('the sticky bar renders unconditionally – no tab gate survives on it', () => {
    expect(app).toContain('<div class="next-week-bar">')
    expect(app).not.toContain('v-if="tab === \'home\'" class="next-week-bar"')
    // the content padding that makes room for the bar is unconditional too
    expect(app).toContain('<main class="app-content with-next-week-bar">')
  })

  it('no tab screen carries an advance control of its own', () => {
    for (const rel of [
      '../src/components/screens/ThisWeekScreen.vue',
      '../src/components/screens/HomeScreen.vue',
    ]) {
      const src = read(rel)
      expect(src, `${rel} must not carry the bar`).not.toContain('next-week-bar')
      expect(src, `${rel} must not advance`).not.toContain('game.advance(')
    }
  })
})

// ===========================================================================
// The coach marks follow the furniture.
// ===========================================================================
describe('R13-12 — OnboardingTour anchors survive the restructure', () => {
  it('no step points at the dead Kid tab; the Kid step points at the avatar', () => {
    expect(tour).not.toContain('tab-kid')
    expect(tour).toContain('[data-tour="kid-avatar"]')
    expect(tour).toContain('[data-tour="tab-week"]')
  })

  it('every selector the tour names resolves in the shell', () => {
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('function iconUrl'))
    const tabIds = [...tabs.matchAll(/id: '([^']+)'/g)].map((m) => m[1])
    // the bracketed form only – the file's prose comment writes data-tour="..." as an example
    for (const m of tour.matchAll(/\[data-tour="([^"]+)"\]/g)) {
      const anchor = m[1]
      if (anchor.startsWith('tab-')) {
        // tab anchors are generated (`tab-${t.id}`) – the id must be a LIVE TABS entry, which is
        // exactly the check that would have caught the dead tab-kid mark this item re-aimed.
        expect(tabIds, `dead tour anchor: ${anchor}`).toContain(anchor.slice('tab-'.length))
        expect(app).toContain('`tab-${t.id}`')
      } else {
        expect(app, `App.vue must render data-tour="${anchor}"`).toContain(`data-tour="${anchor}"`)
      }
    }
  })

  it('the Welcome step stopped promising the plan on Home (it moved)', () => {
    expect(tour).not.toContain("this week's plan, and the news feed")
  })
})

// ===========================================================================
// Player copy – every string this item added: short dash only, no Cyrillic.
// ===========================================================================
describe('R13-12 player copy', () => {
  it('no long dash, no Cyrillic in the rendered copy of the touched surfaces', () => {
    for (const src of [app, weekScreen, home, tour]) {
      const template = src.slice(src.indexOf('<template>'))
      expect(template).not.toContain('—')
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
    for (const s of ['This week', 'Next tournament', 'Nothing entered yet', 'Training plan', 'Tap the photo – her page lives here']) {
      expect(s).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})
