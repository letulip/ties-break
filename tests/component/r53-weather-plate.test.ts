// ⭐ ROUND 53 · STEP 10 – the plate prints the word beside the degrees, and nothing when the day has none.
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherPlate from '../../src/components/ui/WeatherPlate.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('WeatherPlate – wind and rain (weather stage 1)', () => {
  it('prints the word for each state, beside the temperature', () => {
    const w = mount(WeatherPlate, { props: { temperatureC: 31, wind: 'strong', rain: 'falling' } })
    expect(w.text()).toContain('31°')
    expect(w.text()).toContain('Strong wind')
    expect(w.text()).toContain('Rain')
    expect(w.find('.tb-weather-wind').exists()).toBe(true)
    expect(w.find('.tb-weather-rain').exists()).toBe(true)
    const f = mount(WeatherPlate, { props: { temperatureC: 20, wind: 'fresh', rain: 'possible' } })
    expect(f.text()).toContain('Fresh wind')
    expect(f.text()).toContain('Rain possible')
  })
  it('a calm dry day, and a caller without weather, are the plate it always was', () => {
    const dry: { temperatureC: number; wind?: 'none'; rain?: 'none' } = { temperatureC: 20, wind: 'none', rain: 'none' }
    for (const props of [dry, { temperatureC: 20 }]) {
      const w = mount(WeatherPlate, { props })
      expect(w.find('.tb-weather-extra').exists()).toBe(false)
      expect(w.text()).toBe('20°')
    }
  })
})
