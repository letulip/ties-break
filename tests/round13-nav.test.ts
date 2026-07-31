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

  // ⚠ RE-AIMED BY THE CALENDAR SLICE, AND THE FACT IT GUARDED IS THE ONE THING THAT LEGITIMATELY
  // CHANGED: screen H is built. This test was called "the Calendar slot is a PLACEHOLDER: inert, and
  // it can never route anywhere", and it pinned five pieces of machinery that made that true –
  // `type NavId = TabId | 'calendar'`, `soon: true` on the entry, `:disabled="t.soon"`, the
  // `'tab-soon': t.soon` class binding, `if (entry.soon) return` in `openNav`, and a
  // `.tab-btn.tab-soon` rule in the sheet.
  //
  // WHY EVERY ONE OF THEM IS NOW ASSERTED ABSENT rather than simply dropped from the test: a reserved
  // slot and a live one are opposite states of the same seat, so the useful guard is the same shape
  // pointed the other way. Machinery that dims a tab nothing can reach, left in the file after the
  // screen lands, is precisely the dead markup the A2 suite below sweeps for – it would read to the
  // next person as "there is still something unfinished here", which is the opposite of true.
  //
  // WHAT IS UNCHANGED, and it is the seat itself: the entry is still the second of five, still
  // week.svg, still labelled Calendar, and Home is still the middle slot (the test above).
  it('the Calendar slot is LIVE: it routes to screen H, and the placeholder machinery is gone', () => {
    expect(app).toContain(`{ id: 'calendar', icon: 'week', label: 'Calendar' }`)
    expect(app).toContain(`<CalendarScreen v-else-if="tab === 'calendar'"`)
    expect(app).toContain("import CalendarScreen from './components/screens/CalendarScreen.vue'")
    // `openNav` is still the ONE writer of `tab` from the bar, and it no longer has a slot to refuse.
    const openNav = app.slice(app.indexOf('function openNav'), app.indexOf('function iconUrl'))
    expect(openNav).toContain('tab.value = entry.id')
    expect(openNav).not.toContain('soon')
    // Not one piece of the dimming survives – not the flag, not its bindings, not its rule.
    expect(app).not.toContain("type NavId")
    expect(app).not.toContain('soon: true')
    expect(app).not.toContain(':disabled="t.soon"')
    expect(app).not.toContain(`'tab-soon'`)
    expect(read('../src/style.css')).not.toContain('.tab-btn.tab-soon {')
  })

  it("the Calendar glyph exists and is its own picture, not a rename of the Season one", () => {
    expect(existsSync(new URL('../public/icons/week.svg', import.meta.url))).toBe(true)
    const calendar = read('../public/icons/week.svg') // the dot-grid calendar, freed by the tab move
    const season = read('../public/icons/season.svg')
    expect(calendar).not.toBe(season)
  })

  it("'kid', 'money', 'week' and now 'market' stay valid CONTENT states – screens without a tab button", () => {
    // 'week' JOINED that list in epic/redesign-home: the This-week tab left the bar, its screen did
    // not leave the app. Home's next-tournament card is its door (see the suite below).
    //
    // ⚠ RE-AIMED BY THE COACH MARKET (screen T): 'market' joins the same list, and the reason is
    // this test's own rule rather than an exception to it. The design sheet for T proposes replacing
    // "More" with a fifth "Market" tab; the bar is pinned to exactly five entries in exactly this
    // order two tests above, and that pin is the owner's, so the screen takes the door-and-content
    // route every other tabless screen takes. Its door is the Kid screen's Coaching row - the row
    // already names who coaches her, so "tap it to change that" needs no new concept.
    // ⚠ RE-AIMED BY THE CALENDAR SLICE: `'calendar'` joined the union, and it is the one member that
    // arrived by being BUILT rather than by leaving the bar. The protected fact is untouched and is
    // what the rest of this test is about – 'kid', 'money', 'week' and 'market' are still CONTENT
    // states with no button in the five-entry bar. 'calendar' is the opposite case (a button that
    // finally has a screen), so it belongs in the union and NOT in the list below.
    expect(app).toContain(
      "type TabId = 'home' | 'play' | 'calendar' | 'week' | 'kid' | 'stats' | 'money' | 'more' | 'market'",
    )
    // ⚠ RE-AIMED BY THE BACK FIX (round 18): this pinned the mount as ONE LINE OF MARKUP, and the fix
    // reformatted it - the market's two doors now route through `openMarket(from)` so "back" returns to the
    // screen you actually came from, which is a `$event === 'market' ? ... : ...` and does not fit on the
    // old line. The FACT is that 'kid' is a live content state with a navigate handler, so that is what it
    // says now: a mount exists for the tab, and it can navigate. Formatting is not the guarded thing.
    expect(app).toMatch(/<KidScreen[\s\S]{0,200}?tab === 'kid'/)
    expect(app).toMatch(/<KidScreen[\s\S]{0,300}?@navigate=/)
    // ...and the market's back destination is REMEMBERED rather than hard-wired, which is the fix itself.
    // It was `@back="tab = 'kid'"`, so a player who opened the market from Home was returned somewhere he
    // had not been. The owner found it by playing.
    expect(app).toContain(`@back="tab = marketFrom"`)
    expect(app).toContain('function openMarket(')
    // ⚠ RE-AIMED BY W1 (owner, 30.07: he played a full season and never once saw the Weekly Story).
    // What moved: the mount now carries `@close="tab = 'home'"`, because the story OPENS ITSELF when a
    // week resolves (App.vue's `week` watcher – the handoff's own flow: end of the week -> D, and the
    // × returns to Home) and a screen the player was SENT to needs its × to be a way back out.
    // THE PROTECTED FACT IS UNCHANGED and is the only thing this test is about: 'week' is still a
    // tabless CONTENT state mounted by `tab === 'week'`, with no button in the five-entry bar. The
    // assertion is split so it pins the state and the id rather than the exact attribute list, which
    // is what let one added handler read as a nav change.
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'"`)
    expect(app).toContain(`<CoachMarketScreen v-else-if="tab === 'market'"`)
    // ...and the screen asks the shell rather than writing `tab` itself, like every other screen.
    const market = read('../src/components/screens/CoachMarketScreen.vue')
    expect(market).not.toContain('tab.value')
    const kid = read('../src/components/screens/KidScreen.vue')
    expect(kid).not.toContain('tab.value')
    expect(kid).toContain("emit('navigate', 'market')")
    // Copy rules apply to the new screen too: no em dash, no Cyrillic in the template.
    const marketTemplate = market.slice(market.indexOf('<template>'))
    expect(marketTemplate).not.toContain('—')
    expect(marketTemplate).not.toMatch(/[\u0400-\u04ff]/)
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
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
    const template = home.slice(home.indexOf('<template>'), home.lastIndexOf('</template>'))
    expect(template.length).toBeGreaterThan(1000) // a real bound, never a silent empty slice
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
      // ⚠ RE-AIMED by U0: the news heading is still an <h2> and still says "News", but it is
      // rendered by `<Eyebrow as="h2">` now – the lime 10/800/0.1em kicker was already ONE rule
      // shared between the card kickers and these strip headings, and U0 makes it a component.
      // The protected fact is unchanged: Home still carries a News section, headed, at the bottom.
      '<Eyebrow as="h2">News</Eyebrow>',
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
    // ⚠ W5 ADDED ONE NAME TO THE SHELL'S IMPORT (`storyOpensItself` – the settings handle's door; see
    // the W1 suite). The protected fact is untouched and is what both lines still assert: the card and
    // the dot read the SAME module, so neither can hand-copy the rule.
    expect(weekScreen).toContain("import { recapExists } from '../../composables/weekRecap'")
    expect(app).toContain("import { recapExists, storyOpensItself, thisWeekDotShows } from './composables/weekRecap'")
    // ...and the CARD still renders on `recapExists` alone. The preference stops the page opening
    // itself; it must never stop the This-week tab from having the week's story on it.
    expect(weekScreen).toContain('recapExists(game.snapshot)')
    expect(weekScreen).not.toContain('storyOpensItself')
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

  // ⚠ RE-AIMED BY W4 (owner, 30.07, twice in one playtest: «увидел экран week recap для прошедшего
  // турнира, но уже, получается через неделю ... ставить week recap сразу после турнира, как будто
  // домой едем» / «после турнира не появился week recap»).
  //
  // WHAT MOVED: this test asserted the OPPOSITE of its own first line – no story at all on a week
  // carrying a `tournament` event. That clause existed to keep two full-screen takeovers off one
  // tick, back when the card was a block on Home that simply appeared; it is deleted, because
  // `pending` already says which surface owns the week and the story is a ROUTE now, so it can be
  // TIMED rather than deleted.
  //
  // THE PROTECTED FACT IS UNCHANGED, and it is what this test still asserts: the tournament's own
  // flow and the week's story are never both up. `TournamentFlow`'s `v-if` is `snapshot.pending`, and
  // the story's gate is `!pending` – so the pair stays mutually exclusive by construction. What moved
  // is the boundary between them: from "this week has a tournament in it" to "the flow has not let go
  // of this week yet", one beat later, which is the beat he asked for.
  it('a tournament week HAS a story once the flow lets go of it – W4', () => {
    const tourney = [event({ type: 'tournament', week: 3 })]
    // mid-reveal the flow owns the week – this is the old exclusion's real content
    expect(recapExists({ week: 3, pending: pendingRun, events: tourney })).toBe(false)
    // the finale's Continue clears `pending`: the drive home, and its story
    expect(recapExists({ week: 3, pending: undefined, events: tourney })).toBe(true)
    // ...and an OLD tournament never blocked the week after it, and still does not
    expect(recapExists({ week: 4, pending: undefined, events: tourney })).toBe(true)
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
  it('the FLOATING bar is Home-only; RESUMING a paused tournament stays global', () => {
    // ⚠ RE-AIMED by wave 2 (owner, 28.07). R13-12 made the button global so no tab could strand a
    // career, and that was right while it sat in a bar of its own. Wave 2 floated it, and floating
    // it lands under the thumb on every screen - where a stray tap SPENDS A WEEK, the one action in
    // this game that cannot be undone.
    //
    // So the button splits by cost, and both arms are pinned here:
    //   * advancing is irreversible  -> Home only. Home is one tap from everywhere.
    //   * resuming a paused reveal costs nothing -> global, which is what lets R13-8's deleted
    //     paused-tournament banner STAY deleted (see the sibling test below).
    //
    // ⚠ RE-AIMED, IN ITS TITLE, BY THE CALENDAR SLICE - and only in its title, because the two
    // assertions below are unchanged and still true. It was called "ADVANCING is Home-only", and that
    // sentence is no longer a fact about the app: the owner asked for the main action button on the
    // Calendar screen too ("a real functional screen with the main action button, like Home has"), and
    // screen H has one. A guard whose NAME claims something false is worse than no guard, so the name
    // now says what is actually pinned - the FLOATING bar, `.next-week-bar`, and the padding that pays
    // for it, are Home's (plus resume, everywhere).
    //
    // The cost argument survives intact, which is why the calendar is an exception and not a breach:
    // a stray tap is dangerous on a screen whose subject is elsewhere, and the calendar's whole
    // subject is the seven days that press spends. The sibling test below is where the calendar is
    // held to the half that has not moved an inch - the ACT stays the shell's.
    expect(app).toContain(`<div v-if="tab === 'home' || game.snapshot?.pending" class="next-week-bar">`)
    // ...and the room reserved under it follows the same rule rather than being paid on every tab.
    expect(app).toContain(`<main class="app-content with-next-week-bar" :class="{ home: tab === 'home' }">`)
  })

  // ⚠ RE-AIMED BY THE CALENDAR SLICE, AND IT GREW A THIRD FILE RATHER THAN LOSING ITS POINT. This read
  // "no tab screen carries an advance control of its own", over two files, and it was pinning two
  // different things under one sentence: that a screen does not draw the BAR, and that a screen does
  // not perform the ACT. Screen H draws a control (the owner asked for one) and performs no act - it
  // emits `advance` and App.vue's `playWeek` does the work, the same way Home and Kid emit `navigate`
  // rather than writing `tab`. So the two halves are now stated separately, and the ACT half - the one
  // that actually protects the career from a duplicated week-advance - covers all three screens.
  it('no tab screen ADVANCES: the act is the shell\'s, and the bar is nobody else\'s', () => {
    for (const rel of [
      '../src/components/screens/ThisWeekScreen.vue',
      '../src/components/screens/HomeScreen.vue',
      '../src/components/screens/CalendarScreen.vue',
    ]) {
      const src = read(rel)
      expect(src, `${rel} must not carry the bar`).not.toContain('next-week-bar')
      expect(src, `${rel} must not advance`).not.toContain('game.advance(')
    }
    // ...and the one screen that DOES carry a week control asks for it by event, so `playWeek` stays
    // the single door: same handler, same composable, same mode.
    const cal = read('../src/components/screens/CalendarScreen.vue')
    expect(cal).toContain('const emit = defineEmits<{ advance: [] }>()')
    expect(cal).toContain("emit('advance')")
    expect(app).toContain(`<CalendarScreen v-else-if="tab === 'calendar'" @advance="playWeek(1)" />`)
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
// W1 — THE WEEKLY STORY IS REACHED, not just reachable.
//
// The owner played a full season and never once saw Screen D («Экран конца недели не показывается
// вообще ни разу его не увидел»). A live 52-week trace (seed `week-trace-1`) said `recapExists` was
// true on 30 of the 52 weeks, the card rendered on every one of them and `weekTabDot` fired – so
// nothing about the GATE was broken. What was broken was that the only door to the screen is Home's
// NEXT TOURNAMENT card, whose entire content is about the tournament ahead, and whose only hint that
// last week has a story is a 7px dot with a `title` tooltip. There is no hover on a phone.
//
// So the story now opens itself when a week resolves, which is what the handoff asked for in the
// first place (docs/design/README.md §Interactions: the end of the week goes to D, and its × returns
// to Home). These are template facts, which is exactly the kind of fact that rots silently.
// ===========================================================================
describe('W1 — the end of a week lands on the story', () => {
  it('the shell routes to the story on any advance that leaves one, by the SHARED rule', () => {
    // Watching the SNAPSHOT rather than the sticky button: SeasonScreen advances a week too (the
    // hole R11-1 had to patch for the injury dialog), and a story shown on only one of two paths is
    // the bug again.
    //
    // ⚠ RE-AIMED BY W4: the routing condition grew a SECOND door (`runClosed`, below), so the pin is
    // the assignment rather than the whole line – the protected fact is unchanged and is exactly what
    // it always was: the shell routes to 'week' off the SHARED predicate, never off a hand-copy.
    //
    // ⚠ RE-AIMED AGAIN BY W5, and only the NAME of the shared predicate moved. The owner asked for a
    // handle to turn the automatic page off («можем сделать отдельную ручку для их отключения в
    // настройках»), so the door now reads `storyOpensItself` = `recapExists` AND the player's
    // preference – and it is still ONE function in composables/weekRecap.ts, still never a hand-copy,
    // which is the whole protected fact here. What is deliberately NOT re-aimed is the existence rule
    // itself: `recapExists` may not learn about the preference (the sibling test below reads its body),
    // because the card and the dot read it and the story must still EXIST when the page is switched off.
    expect(app).toContain("storyOpensItself(snap)) tab.value = 'week'")
    expect(app).toContain("if ((advanced || runClosed) && storyOpensItself(snap))")
    expect(app).toContain("import { recapExists, storyOpensItself, thisWeekDotShows } from './composables/weekRecap'")
    // ...and it must be an ADVANCE of the SAME career, not merely a higher week number. `week` is
    // `snapshot?.week ?? 0`, so the first snapshot of a load reads as 0 -> N; the first draft of this
    // fix opened last week's story on every app start because of it. Caught in the browser.
    expect(app).toContain('const sameCareer = snap.careerId === seenCareerId')
    expect(app).toContain('const advanced = sameCareer && snap.week > seenWeek')
  })

  // ===========================================================================
  // W4 — THE RECAP COMES HOME WITH HER. The owner, 30.07: «Я предлагаю ставить week recap сразу
  // после турнира, как будто домой едем», and, separately, «после турнира не появился week recap».
  //
  // W1's trigger is an ADVANCE, and an advance that reaches a tournament comes back with `pending`
  // set – so there was no story on that snapshot and no advance left to fire on once the flow was
  // finished. The week's story rode the NEXT tick, a week late, or never arrived at all.
  // ===========================================================================
  it('W4 — the tournament run CLOSING is the second door, and it cannot fire on a load', () => {
    // set -> null on the same career: the finale's Continue (or a post-deadline withdrawal).
    expect(app).toContain("const runClosed = sameCareer && seenPendingId !== null && !snap.pending")
    // ...tracked explicitly, exactly like the week, so `undefined -> null` on the first snapshot of a
    // LOAD is not a close. This is the same trap W1 was caught by in the browser.
    expect(app).toContain('let seenPendingId: string | null = null')
    expect(app).toContain('seenPendingId = snap.pending?.eventId ?? null')
    // ...and a career switch / a fresh career resets it with the rest of the watermark.
    const reset = app.slice(app.indexOf('if (!snap) {'), app.indexOf('const sameCareer'))
    expect(reset).toContain('seenPendingId = null')
  })

  it('W4 — the two takeovers still cannot both be up: the flow renders on the same `pending`', () => {
    // The old way of keeping them apart was deleting the week's story outright (the exclusion in
    // composables/weekRecap.ts). The way they are kept apart NOW is that the flow's own `v-if` is the
    // very fact the story's gate refuses on, so the flow has already unmounted on the snapshot that
    // opens the story.
    expect(app).toContain('<TournamentFlow v-if="game.snapshot?.pending && !tournamentHidden"')
    // ...and the deleted clause is gone from the RULE, not merely bypassed. Read the function body,
    // not the file: the note above it quotes the deleted line verbatim on purpose, so that whoever
    // finds this next knows what used to be here and why it went.
    const rule = read('../src/composables/weekRecap.ts')
    const body = rule.slice(rule.indexOf('export function recapExists'), rule.indexOf('/** The This-week tab'))
    expect(body).toContain('return !snap.pending')
    expect(body).not.toContain('snap.events')
  })

  it("the story's × is a real close: it silences the week AND leaves by the week's own door", () => {
    // ⚠ RE-AIMED BY THE AUTO-SELECT (owner, 30.07: the Calendar is «активной при нетурнирных неделях», and
    // the reading he meant is the tab you LAND on). The close used to be a literal `tab = 'home'`; it reads
    // `afterWeekTab()` now, which is the SAME rule the direct landing uses. That singularity is the point:
    // if the two picked separately, switching the story off would silently change where a week leaves you,
    // and the story handle is about whether the story is SHOWN - never about navigation.
    //
    // The guarded fact - the × really closes, silences the week, and hands the screen back rather than
    // stranding the player - is unchanged. Only the destination learned to be two places.
    expect(weekScreen).toContain('const emit = defineEmits<{ close: [] }>()')
    const dismiss = weekScreen.slice(weekScreen.indexOf('function dismissRecap'))
    expect(dismiss.slice(0, 200)).toContain("emit('close')")
    expect(dismiss.slice(0, 200)).toContain('dismissedRecapKey.value')
    expect(app).toContain(`<ThisWeekScreen v-else-if="tab === 'week'" @close="tab = afterWeekTab()" />`)
  })

  it('Home keeps its door and its dot – the manual route back into the story is untouched', () => {
    expect(home).toContain(`@click="emit('navigate', 'week')"`)
    expect(home).toContain('v-if="recapFresh"')
    expect(app).toContain(':recap-fresh="weekTabDot"')
  })
})

// ===========================================================================
// W4 — THE STORY'S OWN FURNITURE. Three more things the owner asked for on the same page, all of
// them template facts, which is the kind of fact this file exists to keep from rotting quietly.
//
//   * «внизу на week recap давай добавим кнопку Proceed посередине, как на home» – a centred bottom
//     control in Home's shape. It must NOT be an advance: that is the wave-2 split the sibling suite
//     above pins, so the label names its destination instead of implying a tick.
//   * «She played her practice match - Watch it live на кнопке. Ну точно не live, а replay, да?»
//   * «на week recap после отпуска можно использовать картинки соответствующих отпусков»
// ===========================================================================
describe('W4 — the story has a way out, and its painting is the week it is about', () => {
  const card = read('../src/components/WeekRecapCard.vue')
  const season = read('../src/components/screens/SeasonScreen.vue')

  it('the Proceed pill is Home\'s CTA shape, centred at the bottom, and only on a story week', () => {
    // ONE shared object for the shape (U0 #7's `cta` variant IS the export's pill, the same thing
    // Home's button renders by hand), so the two can never drift in appearance...
    expect(weekScreen).toContain('<PrimaryPill variant="cta" class="week-proceed-btn"')
    expect(weekScreen).toContain("import PrimaryPill from '../ui/PrimaryPill.vue'")
    // ...floating, centred, one thumb off the tab bar - Home's own geometry.
    const bar = weekScreen.slice(weekScreen.indexOf('.week-proceed {'), weekScreen.indexOf('.week-proceed-btn'))
    expect(bar).toContain('position: fixed')
    expect(bar).toContain('justify-content: center')
    expect(bar).toContain('bottom: 58px')
    // ...and it exists only while there is a story to leave.
    expect(weekScreen).toContain(`<template v-if="showRecap" #footer>`)
  })

  it('Proceed is NOT an advance: same handler as the ×, and a label naming where it goes', () => {
    // ⚠ THE SIBLING PIN IS THE POINT: "no tab screen carries an advance control of its own" (above)
    // reads this file for the advance bar's class and for `game.advance(`. A bare "Proceed" on a page
    // about a week that just ended reads as "play the next one", and a stray tap spends the one thing
    // in this game that cannot be undone - so the copy says the destination.
    expect(weekScreen).toContain('>Proceed to Home</PrimaryPill>')
    expect(weekScreen).toContain('@click="dismissRecap"')
    // one handler behind both controls: the × and the pill silence the same week and go the same way
    expect(weekScreen.split('@click="dismissRecap"').length - 1).toBe(2)
  })

  it('nothing on a resolved match is called live any more', () => {
    // ⚠ THE RENDERED COPY, not the file: both files quote the owner's own words in a note, and those
    // words contain the old label. That is deliberate - whoever reads these next should find out what
    // the button used to promise and why it stopped. So the sweep is bounded to the template, which is
    // the same discipline the Cyrillic pins in this file use and for the same reason.
    const rendered = (src: string) => src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
    const cardT = rendered(card)
    const seasonT = rendered(season)
    expect(cardT.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
    expect(seasonT.length).toBeGreaterThan(500)
    expect(cardT).toContain('>Watch the replay</PrimaryPill>')
    expect(cardT).not.toContain('Watch it live')
    // ...and the Season screen's copy of the control, which is the same promise one tick removed:
    // the click ticks the week, the engine resolves the friendly, the viewer replays it.
    // ⚠ THE ARROW CAME OFF (round 18): «я просил из убрать со всех кнопок», asked a second time. The
    // guarded fact is the PROMISE the label makes - "watch", never "live" - and that is untouched; the
    // decoration is not part of it. tests/ui-control-system.test.ts now bans an arrow on any button label,
    // so this string cannot quietly grow one back.
    expect(seasonT).toContain('Play it and watch')
    expect(seasonT).not.toContain('Watch it live')
  })

  // ⚠ RE-AIMED BY W5, AND THE RE-AIM IS THE ITEM. This pinned THE CARD'S OWN TERNARY CHAIN – three
  // `expect(card).toContain(...)` over an expression that decided, inside a component, what a week was.
  // The owner asked for a story on every week («week recap сделаем на каждую неделю ... для недель с
  // восстановлением после травмы соответственно»), and the chain could not grow a fourth arm honestly:
  // two kinds of week had a picture and every other week fell through to `weekArtStem`, which answers
  // `training` for every in-year week, so a nine-week layoff drew nine paintings of ladder drills.
  //
  // THE DECISION MOVED TO THE ENGINE (`engine/diary.ts weekSceneFor`, on the snapshot as `diary.scene`),
  // which is where the priority order is now written down and argued. So the pin follows it: what is
  // asserted here is that the card no longer decides – it renders ONE answer through ONE builder – and
  // the ORDER itself is pinned as behaviour, on facts, in tests/week-scene.test.ts, which is strictly
  // stronger than three string matches over a ternary. Every fact the old test protected is still
  // protected: the journey outranks the holiday, WHICH holiday comes off the booking rather than off the
  // boolean, and the frame is described for anyone who cannot see it.
  it('the painting is the week, and the CARD does not decide which – W5', () => {
    // one answer, one builder: no branch on the week's facts anywhere in this file
    expect(card).toContain('const scene = computed(() => game.snapshot?.diary.scene ?? null)')
    expect(card).toContain('weekSceneArtUrl(scene.value)')
    expect(card).toContain("import { weekArtUrl, weekSceneArtUrl } from '../art/weeks'")
    // ...and the two things it must NOT do again: read the journey's fields, or find the booking itself
    expect(card).not.toContain('travelHomeScene.value')
    expect(card).not.toContain('snap.vacations.find')
    // the DESCRIPTION stays a screen's job, and still names which of the six weeks away it was, off the
    // catalogue's own label rather than a second table in a component
    expect(card).toContain("import { vacationPackage } from '../engine/economy'")
    expect(card).toContain('The family week away –')
    // ...and the layoff frame, which W5 added, says what it is for the same reason
    expect(card).toContain('On the bench, working her way back')
  })

  it('the vacation price is a figure, not a chip: bigger, and no capsule round it', () => {
    const sheet = read('../src/components/PlanWeekSheet.vue')
    // it wore `.pill` - a 12px muted capsule with a hairline, i.e. this app's LABEL treatment
    expect(sheet).toContain('<span class="num pkg-price"')
    expect(sheet).not.toContain('class="pill pkg-price"')
    // ...and the size is a rung that exists: --fs-value-md (16px) at the 800 weight the design pairs
    // with it for a money figure (D's own Balance). Never a number invented for this row.
    const css = read('../src/style.css')
    const price = css.slice(css.indexOf('.pkg-price {'), css.indexOf('.pkg-price.ok'))
    expect(price).toContain('font-size: 16px')
    expect(price).toContain('font-weight: 800')
    expect(price).not.toContain('border')
    // the dead rule that used to back the price in its OLD corner went with it
    expect(css).not.toContain('.pkg-head .pill {')
  })
})

// ===========================================================================
// Player copy – every string this item added: short dash only, no Cyrillic.
// ===========================================================================
describe('R13-12 player copy', () => {
  // ⚠ W4 WIDENED THE SWEEP, and found two violations of its own writing while doing it. The list was
  // App / This-week / Home / Tour, so the two surfaces this slice's items are ABOUT - the story card
  // itself and the vacation booking sheet - were never checked, and a comment quoting the owner in
  // Russian went into each of their templates before this pin caught it. The rule is unchanged and no
  // assertion is relaxed; it simply now reads every template the touched items render through.
  it('no long dash, no Cyrillic in the rendered copy of the touched surfaces', () => {
    const card = read('../src/components/WeekRecapCard.vue')
    const sheet = read('../src/components/PlanWeekSheet.vue')
    for (const src of [app, weekScreen, home, tour, card, sheet]) {
    // ⚠ RE-AIMED by U0 – the EXTRACTION, not the assertion. `slice(indexOf('<template>'))` ran to
    // the end of the FILE, which was the whole template only while these SFCs had no <style> block.
    // U0 gave Home and Season one, and CSS comments in this codebase quote the owner in Russian by
    // convention. Bounding at the last `</template>` reads exactly what the player can see, which is
    // what the rule was always about. The assertions are untouched and neither is weaker.
      const template = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
      expect(template.length).toBeGreaterThan(500) // a real bound, never a silent empty slice
      expect(template).not.toContain('—')
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
    for (const s of ['This week', 'Next tournament', 'Nothing entered yet', 'Training plan', 'Tap the photo – her page lives here']) {
      expect(s).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})
