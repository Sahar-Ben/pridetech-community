import { describe, expect, it } from 'vitest'
import { splitInterests, summariseInterests } from './applicantTags'

describe('splitInterests', () => {
  it('should split the multi-select answer on commas and trim each part', () => {
    expect(splitInterests('AI,  Product , Leadership / Management')).toEqual([
      'AI',
      'Product',
      'Leadership / Management',
    ])
  })

  it('should give nothing for a blank cell', () => {
    expect(splitInterests(undefined)).toEqual([])
    expect(splitInterests(' , ')).toEqual([])
  })
})

describe('summariseInterests', () => {
  it('should show three and count the rest', () => {
    expect(summariseInterests('AI, Product, SaaS, Cyber, Cloud')).toEqual({
      shown: ['AI', 'Product', 'SaaS'],
      hiddenCount: 2,
    })
  })

  it('should count nothing hidden when three or fewer were chosen', () => {
    expect(summariseInterests('AI, Product')).toEqual({ shown: ['AI', 'Product'], hiddenCount: 0 })
  })
})
