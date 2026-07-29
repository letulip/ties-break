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
// The bottom bar: five slots, the owner's five, in the owner's order.
//
// RE-AIMED by epic/redesign-home (28.07). R13-12's bar was
//   Home · Season · This week · Stats · More
// and the owner's redesign replaced it with
//   Season · Calendar · Home · Stats · More
// – Home in the CENTRE, which is the point, and which is why the bar keeps five slots although only
// four are live. What R13-12 actually pinned – five entries, a fixed order, no Kid – survives
// verbatim; only the contents of the list moved.
// ===========================================================================
describe('the bottom nav is Season · Calendar · Home · Stats · More, Home in the centre', () => {
  it('TABS carries exactly the five entries, in order, and no Kid entry', () => {
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('/** The one writer'))
    const labels = [...tabs.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
    expect(labels).toEqual(['Season', 'Calendar', 'Home', 'Stats', 'More'])
    const ids = [...tabs.matchAll(/id: '([^']+)'/g)].map((m) => m[1])
    expect(ids).toEqual(['play', 'calendar', 'home', 'stats', 'more'])
    expect(tabs).not.toContain("'kid'")
    // Home is the MIDDLE slot – the one fact the new order exists for.
    expect(ids[Math.floor(ids.length / 2)]).toBe('home')
  })

  it('the Calendar slot is a PLACEHOLDER: inert, and it can never route anywhere', () => {
    // It is in the owner's design and it is not built in this slice. It must look deliberate
    // (dimmed, disabled) and it must be impossible to reach a screen through it – 'calendar' is
    // NOT a TabId, so the only thing standing between the slot and a blank screen is `soon`.
    expect(app).toContain("type NavId = TabId | 'calendar'")
    expect(app).toContain(`{ id: 'calendar', icon: 'week', label: 'Calendar', soon: true }`)
    expect(app).toContain(':disabled="t.soon"')
    expect(app).toContain(`'tab-soon': t.soon`)
    const openNav = app.slice(app.indexOf('function openNav'), app.indexOf('function iconUrl'))
    expect(openNav).toContain('if (entry.soon) return')
    // ...and the dimmed treatment is a real rule, not an inline style nobody can find.
    expect(read('../src/style.css')).toContain('.tab-btn.tab-soon')
  })

  it("the Calendar glyph exists and is its own picture, not a rename of the Season one", () => {
    expect(existsSync(new URL('../public/icons/week.svg', import.meta.url))).toBe(true)
    const calendar = read('../public/icons/week.svg') // the dot-grid calendar, freed by the tab move
    const season = read('../public/icons/season.svg')
    expect(calendar).not.toBe(season)
  })

  it("'kid', 'money' and now 'week' stay valid CONTENT states – screens without a tab button", () => {
    // 'week' JOINED that list in epic/redesign-home: the This-week tab left the bar, its screen did
    // not leave the app. Home's next-tournament card is its door (see the suite below).
    expect(app).toContain("type TabId = 'home' | 'play' | 'week' | 'kid' | 'stats' | 'money' | 'more'")
    expect(app).toContain(`<KidScreen v-else-if="tab === 'kid'" />`)
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'" />`)
  })
})

// ===========================================================================
// Kid: reachable ONLY via the header avatar, with a one-time hint.
// ===========================================================================
describe('R13-12 — the Kid screen opens from her photograph', () => {
  // ⚠ RE-AIMED WHOLESALE by A2 (28.07): the app header that carried the avatar is gone. Every
  // fact R13-12 pinned is still true, it just lives on Home now – the button, the age-only crop,
  // the one-time callout and its localStorage key all moved together, and the shell learns about
  // the navigation the same way it learns about the wallet and This-week: through `navigate`.
  it('the avatar is a button that routes to the kid state – the ONE door', () => {
    expect(home).toContain('data-tour="kid-avatar"')
    expect(home).toContain('@click="openKid"')
    const openKid = home.slice(home.indexOf('function openKid'), home.indexOf('</script>'))
    expect(openKid).toContain("emit('navigate', 'kid')")
    // ...and nothing else asks for that screen: openKid is the only writer, on either side.
    expect(home.split("'kid'").length - 1).toBe(2) // the emit union, and the emit itself
    expect(app.split("tab.value = 'kid'").length - 1).toBe(0)
    expect(app).toContain('@navigate="tab = $event"')
  })

  it('the avatar stays F45-1: neither the move nor the tap wrapper re-routed the crop', () => {
    // The button wraps the SAME age-only crop. Home is the one screen holding both faces now, so
    // this is the pin that keeps them apart: the small one is chrome, the big one is her.
    expect(home).toContain('useHeaderAvatar')
    expect(home).toContain(':src="headerAvatarUrl"')
    expect(home).toContain('class="diary-avatar"')
    // The hero painting is the emotional one and takes a different source entirely.
    expect(home).toContain('class="diary-hero-img" :src="portraitUrl"')
  })

  it('the hint shows until first tap, and the tap persists the dismissal OUTSIDE the save', () => {
    expect(home).toContain("const KID_HINT_KEY = 'tb:kidAvatarHintSeen'")
    // shown iff never dismissed on this device (the TOUR_SEEN_KEY idiom, localStorage)...
    expect(home).toContain('const showKidHint = ref(!localStorage.getItem(KID_HINT_KEY))')
    // ...and the first tap both opens the screen and persists the dismissal.
    const openKid = home.slice(home.indexOf('function openKid'), home.indexOf('</script>'))
    expect(openKid).toContain("localStorage.setItem(KID_HINT_KEY, '1')")
    // The key left App.vue with the header – no second copy can drift out of step.
    expect(app).not.toContain('KID_HINT_KEY')
    // NOT in the save: no store/engine surface knows the key.
    for (const rel of ['../src/stores/game.ts', '../src/engine/world.ts', '../src/shared/protocol.ts']) {
      expect(read(rel)).not.toContain('kidAvatarHint')
    }
  })

  it('the hint copy obeys the player-copy rules: short dash, no Cyrillic', () => {
    expect(home).toContain('Tap the photo – her page lives here')
    const template = home.slice(home.indexOf('<template>'))
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[\u0400-\u04ff]/)
  })
})

describe('A2 — the app header is gone', () => {
  it('the shell renders no header at all, and none of its parts survived as dead markup', () => {
    expect(app).not.toContain('<header')
    expect(app).not.toContain('app-header')
    for (const gone of ['avatarUrl', 'kidName', 'weekDates', 'status-pill', 'formatFunds']) {
      expect(app, `App.vue still carries ${gone}`).not.toContain(gone)
    }
  })

  it('its CSS went with it – no rule is left that nothing can render', () => {
    const css = read('../src/style.css')
    for (const dead of ['.app-header {', '.avatar-btn {', '.kid-name {', '.status-pill {', '.kid-hint {']) {
      expect(css, `dead rule still in the sheet: ${dead}`).not.toContain(dead)
    }
  })

  it('the tour still has both of its Home anchors, on the elements that replaced the header', () => {
    // The coach-mark steps are unchanged; the elements they point at moved.
    const tour = read('../src/components/OnboardingTour.vue')
    expect(tour).toContain('[data-tour="home-header"]')
    expect(tour).toContain('[data-tour="kid-avatar"]')
    expect(home).toContain('data-tour="home-header"')
    expect(home).toContain('data-tour="kid-avatar"')
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
      'diary-hero', // the living photo – full-bleed since epic/redesign-home (was `photo-card`)
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
  })

  it('epic/redesign-home: the dot MOVED with the tab – the shell decides it, the Home card shows it', () => {
    // It used to be `t.id === 'week' && weekTabDot` on the bottom bar. The bar has no This-week
    // slot any more, so the dot rides the card that opens the screen instead. The RULE did not
    // move: App.vue still owns the watermark and still computes `weekTabDot` off the shared
    // predicate – it is only handed down and rendered elsewhere.
    expect(app).not.toContain(`t.id === 'week' && weekTabDot`)
    expect(app).toContain(':recap-fresh="weekTabDot"')
    expect(home).toContain('defineProps<{ recapFresh: boolean }>()')
    expect(home).toContain('v-if="recapFresh"')
  })
})

// ===========================================================================
// The advance bar: GLOBAL, in the App shell, in no tab screen.
// ===========================================================================
describe('the advance button lives in the App shell, and splits by what a stray tap costs', () => {
  it('ADVANCING is Home-only; RESUMING a paused tournament stays global', () => {
    // ⚠ RE-AIMED by wave 2 (owner, 28.07). R13-12 made the button global so no tab could strand a
    // career, and that was right while it sat in a bar of its own. Wave 2 floated it, and floating
    // it lands under the thumb on every screen - where a stray tap SPENDS A WEEK, the one action in
    // this game that cannot be undone.
    //
    // So the button splits by cost, and both arms are pinned here:
    //   * advancing is irreversible  -> Home only. Home is one tap from everywhere.
    //   * resuming a paused reveal costs nothing -> global, which is what lets R13-8's deleted
    //     paused-tournament banner STAY deleted (see the sibling test below).
    expect(app).toContain(`<div v-if="tab === 'home' || game.snapshot?.pending" class="next-week-bar">`)
    // ...and the room reserved under it follows the same rule rather than being paid on every tab.
    expect(app).toContain(`<main class="app-content with-next-week-bar" :class="{ home: tab === 'home' }">`)
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
  it('no step points at the dead Kid tab or the dead This-week tab', () => {
    expect(tour).not.toContain('tab-kid')
    expect(tour).toContain('[data-tour="kid-avatar"]')
    // epic/redesign-home: the This-week tab anchor died with the tab. The step it carried now
    // points at the card that opens that screen – the same re-aim R13-12 did for the Kid mark.
    // The bracketed form only: the file's prose explains the re-aim and names the old anchor.
    expect(tour).not.toContain('[data-tour="tab-week"]')
    expect(tour).toContain('[data-tour="next-tournament"]')
  })

  it('every selector the tour names resolves in a rendered template', () => {
    const tabs = app.slice(app.indexOf('const TABS'), app.indexOf('/** The one writer'))
    // A PLACEHOLDER slot is not a destination – a coach mark may never point at one.
    const liveTabIds = [...tabs.matchAll(/\{ id: '([^']+)'(?![^}]*soon: true)[^}]*\}/g)].map((m) => m[1])
    // The anchors live in the two templates the tour can be open over: the shell, and Home (the
    // default tab, and the only screen the tour runs on).
    const rendered = `${app}\n${home}`
    // the bracketed form only – the file's prose comment writes data-tour="..." as an example
    for (const m of tour.matchAll(/\[data-tour="([^"]+)"\]/g)) {
      const anchor = m[1]
      if (anchor.startsWith('tab-')) {
        // tab anchors are generated (`tab-${t.id}`) – the id must be a LIVE, non-placeholder TABS
        // entry, which is the check that caught the dead tab-kid mark R13-12 re-aimed.
        expect(liveTabIds, `dead tour anchor: ${anchor}`).toContain(anchor.slice('tab-'.length))
        expect(app).toContain('`tab-${t.id}`')
      } else {
        expect(rendered, `no template renders data-tour="${anchor}"`).toContain(`data-tour="${anchor}"`)
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
