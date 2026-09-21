import { describe, expect, it } from 'vitest'
import { toBarChartLayout } from './barChartLayout'

describe('toBarChartLayout', () => {
  it('should spend the width it is given on the track once the columns are paid for', () => {
    const layout = toBarChartLayout(600)

    expect(layout.labelColumnWidth + layout.trackLength + layout.valueColumnWidth).toBe(600)
  })

  it('should give a narrow chart a narrower label column rather than no track at all', () => {
    const narrow = toBarChartLayout(300)
    const wide = toBarChartLayout(800)

    expect(narrow.labelColumnWidth).toBeLessThan(wide.labelColumnWidth)
    expect(narrow.trackLength).toBeGreaterThan(0)
  })

  it('should never let the label column eat the whole chart', () => {
    expect(toBarChartLayout(120).trackLength).toBeGreaterThan(0)
  })

  it('should fit more of a label in when the column is wider', () => {
    expect(toBarChartLayout(800).labelCharacterBudget).toBeGreaterThan(
      toBarChartLayout(300).labelCharacterBudget,
    )
  })
})
