import { describe, expect, it } from 'vitest'
import { toTenureBucketKey, UNKNOWN_TENURE_BUCKET } from './tenure'

const asOf = new Date(2026, 8, 21)

describe('toTenureBucketKey', () => {
  it('should put somebody who applied last month under a year', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2026, 7, 21), asOf })).toBe('under-1-year')
  })

  it('should put somebody one day short of a year under a year', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2025, 8, 22), asOf })).toBe('under-1-year')
  })

  it('should move somebody onto their anniversary the day it arrives', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2025, 8, 21), asOf })).toBe('one-to-two-years')
  })

  it('should put a two year old application in the two to four band', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2024, 8, 21), asOf })).toBe('two-to-four-years')
  })

  it('should put a four year old application in the longest band', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2022, 0, 1), asOf })).toBe('four-years-or-more')
  })

  it('should refuse to date somebody from an application stamped in the future', () => {
    expect(toTenureBucketKey({ appliedAt: new Date(2027, 0, 1), asOf })).toBe(
      UNKNOWN_TENURE_BUCKET.key,
    )
  })

  it('should report an unknown tenure when there is no application to date from', () => {
    expect(toTenureBucketKey({ appliedAt: undefined, asOf })).toBe(UNKNOWN_TENURE_BUCKET.key)
  })
})
