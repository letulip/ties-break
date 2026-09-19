// =================================================================================================
// ⭐⭐⭐ ROUND 44 #7 – THE STAFF'S YEAR-END POST ON PAPER, MOUNTED.
// =================================================================================================
//
// The owner, 18.09: «письмо от тренера по итогу года мне так и не пришло, да и ни от одного
// специалиста не пришло.»
//
// WHEN each seat writes, WHICH seats may write at all and what each may honestly claim are the
// engine's half, pinned in tests/wave7-staff-letters.test.ts. THIS file is the sheet – and it exists
// because of a failure mode no engine test in the repo can see: `OfferLetter`'s template is a `v-if`
// ladder over the kinds, so a new kind whose arm nobody wrote FALLS OFF THE END and paints an empty
// article. Every engine test stays green while the player's inbox opens onto nothing. Round 43 #11's
// own mounted test names that trap first; this is the same guard for four seats at once.
//
// ⚠ THE LETTERS ARE BUILT BY THE ENGINE'S OWN RAISER, never typed here. `raiseStaffLetter` is the
// only writer, so the terms rendered below are the terms a career really carries – a hand-built
// object would drift the day the shape changes and this file would go on passing.
//
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4) and tabled in
// docs/plans/life-wave-7-strings-2026-09.md §7. The assertions below are deliberately about what the
// sheet CONTAINS and what it MUST NOT contain, never about a whole sentence's wording: a вычитка
// pass that rewrites these letters must not have to rewrite this file too.
//
// ⚠ MUTATION-VERIFIED – the ARMS table at the foot of the file.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { raiseStaffLetter } from '../../src/engine/offers'
import { weekLabel } from '../../src/shared/dates'
import type { Offer, StaffLetterTerms, StaffSeat } from '../../src/shared/protocol'

const WRAP = 257

/** One real letter, written by the engine's own raiser. */
function staffLetter(terms: Partial<StaffLetterTerms> & Pick<StaffLetterTerms, 'seat'>): Offer {
  const offers: Offer[] = []
  return raiseStaffLetter(offers, WRAP, { seasonIndex: 4, weeksServed: 49, ...terms })
}

function mountLetter(offer: Offer, week = WRAP + 2) {
  return mount(OfferLetter, { props: { offer, week }, attachTo: document.body })
}

const ALL_SEATS: StaffSeat[] = ['coach', 'masseur', 'psychologist', 'sparring']

describe('round 44 #7 – the sheet each seat writes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ ALL FOUR SEATS RENDER – a kind with no template arm is a silent blank page', () => {
    // ⚠⚠ THE ASSERTION THIS FILE EXISTS FOR, and it is per SEAT rather than per KIND: the four seats
    // share one `v-if` arm but branch inside it, so a seat nobody wrote a branch for falls through to
    // the LAST `v-else` and quietly wears the hitting partner's letter. One kind is not one sheet.
    for (const seat of ALL_SEATS) {
      const w = mountLetter(staffLetter({ seat }))
      expect(w.find('.offer-letter').exists(), `${seat}: the sheet is on screen`).toBe(true)
      expect(w.text().trim().length, `${seat}: and it is not a blank page`).toBeGreaterThan(80)
      w.unmount()
    }
  })

  it('⭐⭐ each seat SIGNS ITS OWN SHEET – four letters, four distinct signatures', () => {
    // The mechanical form of «a seat cannot inherit a signature in silence»: if any two seats shared
    // a branch, their sign-offs would collide here.
    const signs = ALL_SEATS.map((seat) => {
      const w = mountLetter(staffLetter({ seat }))
      const sign = w.find('.offer-sign-off').text().trim()
      w.unmount()
      return sign
    })
    expect(new Set(signs).size, 'four distinct signatures').toBe(4)
    expect(signs.every((s) => s.startsWith('–')), 'the house form, short dash').toBe(true)
  })

  it('⭐ it is a NOTICE – no decision is offered, because a report is not a proposal', () => {
    for (const seat of ALL_SEATS) {
      const w = mountLetter(staffLetter({ seat }))
      expect(w.findAll('button'), `${seat}: no actions on a notice`).toHaveLength(0)
      expect(w.text(), `${seat}: the foot only says when it was filed`).toContain(`Filed ${weekLabel(WRAP)}`)
      w.unmount()
    }
  })

  it('⭐ the SHORT DASH only – the house rule, and a letter is prose where it is easiest to break', () => {
    for (const seat of ALL_SEATS) {
      const w = mountLetter(
        staffLetter({ seat, wins: 30, losses: 12, bestFinish: 1, titles: 2, layoffs: 2, weeksSaved: 5, focus: 'coolhead', composureBonus: 2 }),
      )
      expect(w.text(), `${seat}: no long em-dash anywhere on the paper`).not.toContain('—')
      w.unmount()
    }
  })
})

describe('round 44 #7 – the coach, and the one line that could leak', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐ the record, the run and the titles are on the paper when the row carried them', () => {
    const w = mountLetter(staffLetter({ seat: 'coach', wins: 31, losses: 14, bestFinish: 1, titles: 2, endRank: 120, rankTrack: 'wta' }))
    const text = w.text().replace(/\s+/g, ' ')
    expect(text, '45 matches played').toContain('45')
    expect(text, 'won').toContain('31')
    expect(text, 'lost').toContain('14')
    expect(text, 'the deepest run, in the wording every other surface uses').toContain('Runner-up')
    expect(text, 'the table she played, named').toContain('Professional #120')
    w.unmount()
  })

  it('⭐⭐ THE CHEMISTRY LINE PRINTS NO NUMBER – only the sign is ever said', () => {
    // ⚠⚠ The engine decides WHETHER the pair may be spoken about at all (`chemistryReading`'s drawn
    // per-pair bar); this is the other half of that guard. By rendering the SIGN alone the sheet
    // cannot disagree with the coach card's ring either – «a band NAME beside the level would be a
    // second spelling of one fact», and a FIGURE beside it is the same hazard with a number on it.
    for (const chem of [62, -62]) {
      const w = mountLetter(staffLetter({ seat: 'coach', chem }))
      const text = w.text()
      expect(text, `chem ${chem}: the level is never printed`).not.toContain('62')
      expect(text.length, 'but something IS said about the pair').toBeGreaterThan(80)
      w.unmount()
    }
  })

  it('⭐⭐ the two signs say DIFFERENT things – a positive pair and a negative one are not one sentence', () => {
    const up = mountLetter(staffLetter({ seat: 'coach', chem: 62 }))
    const upText = up.text()
    up.unmount()
    const down = mountLetter(staffLetter({ seat: 'coach', chem: -62 }))
    const downText = down.text()
    down.unmount()
    expect(upText).not.toBe(downText)
  })

  it('⭐⭐ NO CHEMISTRY ON THE TERMS MEANS NOT ONE WORD ABOUT THE PAIR', () => {
    // The gauge is still hiding this pair, so the letter is silent about it – and the silence has to
    // be VISIBLE as a shorter sheet, or the assertion above is measuring nothing.
    const withChem = mountLetter(staffLetter({ seat: 'coach', chem: 62 }))
    const withLen = withChem.text().length
    withChem.unmount()
    const without = mountLetter(staffLetter({ seat: 'coach' }))
    const withoutLen = without.text().length
    without.unmount()
    expect(withoutLen, 'the hidden-pair sheet is strictly shorter').toBeLessThan(withLen)
  })

  it('⭐⭐ ...AND THE SILENCE LEAVES NO EMPTY BULLET BEHIND IT', () => {
    // ⚠ THIS CASE WAS ADDED AFTER A MUTATION ARM CAME BACK GREEN, which is the only reason it is
    // here: dropping `v-if="staffChemLine"` so the line renders unconditionally left the length
    // comparison above completely unmoved – an empty `<li>` contributes no text – while the sheet
    // grew a blank bullet on every career whose pair the gauge is hiding. A length is not a
    // structure, and the claim «the letter says nothing about the pair» is a claim about both.
    const w = mountLetter(staffLetter({ seat: 'coach', wins: 20, losses: 9 }))
    const items = w.findAll('.offer-terms li')
    expect(items.length, 'the sheet has bullets to speak of').toBeGreaterThan(0)
    for (const li of items) {
      expect(li.text().trim().length, 'and not one of them is blank').toBeGreaterThan(0)
    }
    w.unmount()
  })

  it('⭐ a season with no scoring finish says so, and does not print a zero', () => {
    const w = mountLetter(staffLetter({ seat: 'coach', wins: 4, losses: 11 }))
    expect(w.text(), 'never «Champion» off an absent bestFinish').not.toContain('Champion')
    w.unmount()
  })
})

describe('round 44 #7 – the three support seats say only what they hold', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐ the masseur states the layoffs he worked and the weeks he bought back', () => {
    const w = mountLetter(staffLetter({ seat: 'masseur', layoffs: 2, weeksSaved: 5 }))
    const text = w.text().replace(/\s+/g, ' ')
    expect(text).toContain('2')
    expect(text).toContain('5')
    w.unmount()
  })

  it('⭐⭐ a year with no layoff is NOT an apology, and it is a different sheet', () => {
    const none = mountLetter(staffLetter({ seat: 'masseur', layoffs: 0, weeksSaved: 0 }))
    const noneText = none.text()
    none.unmount()
    const some = mountLetter(staffLetter({ seat: 'masseur', layoffs: 2, weeksSaved: 5 }))
    const someText = some.text()
    some.unmount()
    expect(noneText).not.toBe(someText)
    expect(noneText.length, 'the quiet year still says something').toBeGreaterThan(80)
  })

  it('⭐⭐ the psychologist has a DISTINCT sentence for every focus – five, none borrowed', () => {
    // The `Record<PsyFocus, string>` in the component is type-forced, so a sixth focus cannot ship
    // without its sentence; this is the runtime half – that the five it holds are actually five.
    const lines = (['coolhead', 'recovery', 'listen', 'herself', 'publicLife'] as const).map((focus) => {
      const w = mountLetter(staffLetter({ seat: 'psychologist', focus }))
      const text = w.text()
      w.unmount()
      return text
    })
    expect(new Set(lines).size, 'five focuses, five different sheets').toBe(5)
  })

  it('⭐⭐ the composure line rides with `coolhead` alone and never claims a YEAR`S GAIN', () => {
    const w = mountLetter(staffLetter({ seat: 'psychologist', focus: 'coolhead', composureBonus: 2.5 }))
    const text = w.text().replace(/\s+/g, ' ').toLowerCase()
    // It is a decaying stock, so the sheet may say where she STANDS and may not say what the year
    // ADDED. The number itself is deliberately not printed – it is tenths of an internal ceiling.
    expect(text, 'never a gain').not.toMatch(/this year (gave|bought|added)/)
    expect(text, 'never the raw figure').not.toContain('2.5')
    expect(text, 'but the standing IS said').toContain('stands')
    w.unmount()
  })

  it('⭐⭐ THE HITTING PARTNER REPORTS NO OUTCOME – the honest shape of a seat that retains none', () => {
    const w = mountLetter(staffLetter({ seat: 'sparring' }))
    const text = w.text().replace(/\s+/g, ' ')
    expect(text, 'his weeks are on the paper').toContain('49')
    // ⚠ HIS OWN 17.09 RULING: «somebody across the net» was struck from this very seat's feed rows as
    // an image «used often enough that it begins to feel generated». A new letter for the same seat
    // is exactly where it would come back.
    expect(text.toLowerCase(), 'the struck image stays struck').not.toContain('across the net')
    w.unmount()
  })
})

// ===========================================================================
// ARMS – every assertion above was watched to fail before it was believed.
//
//   1. the whole `v-else-if="isStaff"` arm deleted from OfferLetter.vue
//      -> RED [15]: EVERY case in the file. The letter falls through to the kit arm, which reads
//         `terms` as a kit deal and throws inside `coveredList` – so the trap is caught twice over.
//         This is the blank-page hazard and it is the reason the file exists: an engine-only net
//         stays ENTIRELY GREEN under this mutation.
//   2. the four seat branches collapsed to one (the `sparring` `v-else` alone)
//      -> RED [7]: the four-signature case, the per-seat content cases and the focus sweep.
//   3. `staffSignOff` returning one constant for all four seats
//      -> RED [1]: the four-signature case.
//   4. the chemistry line rendered as `{{ staffTerms.chem }}` instead of the sign-only sentence
//      -> RED [2]: the no-number case (both signs), and the two-signs case survives – which is why
//         the no-number case is the one that carries this claim.
//   5. `v-if="staffChemLine"` dropped so the sentence renders unconditionally
//      -> ⚠⚠ FIRST MEASURED **GREEN**, AND THAT IS WHY THE EMPTY-BULLET CASE EXISTS. The
//         hidden-pair case compares sheet LENGTHS and an empty `<li>` contributes no text, so the
//         blank bullet was invisible to it. The claim needed a structural assertion beside the
//         length one. -> RED [1] once the empty-bullet case was added.
//   6. `PSY_FOCUS_LINE` given the same sentence for `recovery` and `listen`
//      -> RED [1]: the five-focus sweep.
//   7. the masseur's `v-else` (the quiet year) deleted
//      -> RED [1]: the no-layoff case.
//   8. «match-style practice» swapped back to «somebody across the net»
//      -> RED [1]: the struck-image case.
//   9. a Sign/Refuse foot copied onto the arm from the kit letter
//      -> RED [1]: the notice case, on all four seats.
//  10. the short dash in a sign-off replaced with an em-dash
//      -> RED [1]: the short-dash sweep.
// ===========================================================================
