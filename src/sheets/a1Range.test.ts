import { describe, expect, it } from 'vitest'
import { buildCellRange } from './a1Range'

describe('buildCellRange', () => {
  it('should address a single cell by its tab, column and row', () => {
    expect(buildCellRange({ tabName: 'Leads', columnIndex: 10, rowNumber: 4 })).toBe('Leads!K4')
  })

  it('should address a single cell past the Z boundary', () => {
    expect(buildCellRange({ tabName: 'Leads', columnIndex: 26, rowNumber: 4 })).toBe('Leads!AA4')
  })
})
