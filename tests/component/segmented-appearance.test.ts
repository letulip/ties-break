// ⭐⭐ DRY-8 – THE THREE COPIES BECOME ONE NAMED STATE, AND THIS IS WHAT HOLDS THEM TOGETHER.
//
// Stats, Money and More each carried the same four declarations stripping `SegmentedRow`'s plate,
// and two of them a `:deep(.tab-pill)` escape on top to grow the pills. The review filed it as DRY-8
// and the code answered "the copying is DELIBERATE" – which was true of the alternative it was
// arguing with (a GLOBAL rule), and not of an opt-in state. This is that state, and these are the
// two owner rulings behind it, pinned mechanically for the first time:
//
//   02.08 «Мне не нравится круглая обводка у переключателя уровня турниров в stats, без нее было
//         лучше... Давай просто кнопки оставим и всё»            -> appearance="bare"
//   05.08 «Верхние переключатели-вкладки в ledger и настройках сделать немного крупнее и с отступом
//         внизу небольшим»                                        -> appearance="chapter"
//
// ⚠ THROUGH THE REAL CASCADE. `src/style.css` is imported below because that is where the states
// live – the component still declares no styles of its own, which its own header promises. A test
// that asserted on class names instead would pass while the page looked wrong.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedRow from '../../src/components/ui/SegmentedRow.vue'
import '../../src/style.css'

const OPTIONS = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Second' },
]

function row(appearance?: 'plate' | 'bare' | 'chapter') {
  const wrapper = mount(SegmentedRow, {
    attachTo: document.body,
    props: { options: OPTIONS, groupLabel: 'Which one', modelValue: 'a', ...(appearance ? { appearance } : {}) },
  })
  const root = wrapper.get('[role="group"]').element as HTMLElement
  const pill = wrapper.get('.tab-pill').element as HTMLElement
  return { wrapper, root, pill, rootStyle: getComputedStyle(root), pillStyle: getComputedStyle(pill) }
}

describe('SegmentedRow appearance – DRY-8', () => {
  it('⚠ the DEFAULT is untouched: every existing caller still gets the plate', () => {
    // The whole safety of the change. Thirteen call sites pass nothing; if this arm moves, they all did.
    const { rootStyle, wrapper } = row()
    expect(rootStyle.borderTopStyle, 'the plate lost its hairline').not.toBe('none')
    expect(rootStyle.backgroundColor, 'the plate lost its fill').not.toBe('rgba(0, 0, 0, 0)')
    expect(rootStyle.paddingLeft, 'the plate lost its inset').not.toBe('0px')
    wrapper.unmount()
  })

  it('⭐ `bare` takes the plate off – all four declarations, from the shared sheet', () => {
    // ⚠ COMPARED AGAINST THE PLATE ITSELF, not against a colour string. happy-dom hands back the
    // authored `none` rather than normalising it to `rgba(0, 0, 0, 0)`, and a test that pinned either
    // spelling would be asserting about the style engine instead of about the app.
    const plate = row()
    const { rootStyle, wrapper } = row('bare')
    expect(rootStyle.borderTopStyle).toBe('none')
    expect(rootStyle.backgroundColor, 'the fill is still the plate\'s').not.toBe(plate.rootStyle.backgroundColor)
    expect(rootStyle.paddingLeft).toBe('0px')
    expect(rootStyle.borderTopLeftRadius).toBe('0px')
    plate.wrapper.unmount()
    wrapper.unmount()
  })

  it('⭐ `chapter` is bare AND a real touch target – the 05.08 ruling, measured', () => {
    // ⚠ THE NUMBER IS THE POINT, not the class. Measured at the owner's own 576-wide viewport when
    // the ruling was made: the pill was 27px tall, against 51px for the bottom bar's `.tab-btn` and
    // the 44px both platform guidelines ask for. `chapter` exists to end that, so the assertion is
    // on the BOX and not on a font-size somebody could tune away.
    const bare = row('bare')
    const chapter = row('chapter')
    expect(chapter.rootStyle.backgroundColor, 'chapter must also be bare').toBe(bare.rootStyle.backgroundColor)
    expect(chapter.rootStyle.borderTopStyle, 'chapter must also be bare').toBe('none')
    const heightOf = (s: CSSStyleDeclaration) =>
      parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.fontSize) * 1.2
    expect(
      heightOf(chapter.pillStyle),
      'the chapter picker is back under a thumb-sized target',
    ).toBeGreaterThan(heightOf(bare.pillStyle))
    expect(parseFloat(chapter.pillStyle.paddingTop), 'the 05.08 ruling is not being applied').toBeGreaterThanOrEqual(10)
    bare.wrapper.unmount()
    chapter.wrapper.unmount()
  })

  it('⚠ and `chapter` never reaches a pill outside its own row – the reason it is opt-in', () => {
    // The objection the three private copies were protecting: the shared `.tab-pill` is also the
    // draw's round switcher and the 12w/season filter six pixels below one of these rows. A global
    // rule would inflate a filter INSIDE a chapter to the size of the chapter picker above it.
    const chapter = row('chapter')
    const plain = row()
    expect(plain.pillStyle.paddingTop, 'a plain row grew with the chapter row – the state leaked').not.toBe(
      chapter.pillStyle.paddingTop,
    )
    chapter.wrapper.unmount()
    plain.wrapper.unmount()
  })
})
