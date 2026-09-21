import { describe, expect, it } from 'vitest'
import { toBarValueLabel, toBarValueText } from './barValueLabel'

const labelFor = ({
  count,
  percentage,
  barLength,
  valueColumnWidth = 66,
}: {
  count: number
  percentage: number
  barLength: number
  valueColumnWidth?: number
}) => toBarValueLabel({ count, percentage, barLength, valueColumnWidth })

describe('toBarValueText', () => {
  it('should write the count and its share together', () => {
    expect(toBarValueText({ count: 112, percentage: 14, showsShare: true })).toBe('112 (14%)')
  })

  it('should write the count alone when the share was left off', () => {
    expect(toBarValueText({ count: 112, percentage: 14, showsShare: false })).toBe('112')
  })
})

describe('toBarValueLabel', () => {
  it('should write the count and its share on a bar with room for both', () => {
    expect(labelFor({ count: 112, percentage: 14, barLength: 200 })).toEqual({
      showsShare: true,
      isInside: true,
    })
  })

  it('should keep a short bar label beside it rather than crammed into it', () => {
    const wide = labelFor({ count: 9, percentage: 43, barLength: 120 })
    const narrow = labelFor({ count: 9, percentage: 43, barLength: 30 })

    expect(wide.isInside).toBe(true)
    expect(narrow.isInside).toBe(false)
  })

  it('should drop the share rather than let the label overflow its column', () => {
    expect(labelFor({ count: 112, percentage: 14, barLength: 8, valueColumnWidth: 34 })).toEqual({
      showsShare: false,
      isInside: false,
    })
  })

  it('should keep the count on a bar too short to hold the share', () => {
    const label = labelFor({ count: 7, percentage: 1, barLength: 44 })

    expect(label).toEqual({ showsShare: false, isInside: true })
  })

  it('should label a bar nobody is in rather than leaving the row blank', () => {
    expect(labelFor({ count: 0, percentage: 0, barLength: 0 })).toEqual({
      showsShare: true,
      isInside: false,
    })
  })

  it('should never claim room inside a bar of no length', () => {
    expect(labelFor({ count: 0, percentage: 0, barLength: 0 }).isInside).toBe(false)
  })
})
