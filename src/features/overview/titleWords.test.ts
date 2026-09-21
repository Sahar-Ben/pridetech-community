import { describe, expect, it } from 'vitest'
import { containsAnyKeyword, toTitleWords } from './titleWords'

describe('toTitleWords', () => {
  it('should lowercase the words it reads', () => {
    expect(toTitleWords('Product Manager')).toEqual(['product', 'manager'])
  })

  it('should split a hyphenated title into its words', () => {
    expect(toTitleWords('Co-founder, CEO')).toEqual(['co', 'founder', 'ceo'])
  })

  it('should keep an ampersand inside the word it belongs to', () => {
    expect(toTitleWords('VP R&D')).toEqual(['vp', 'r&d'])
  })

  it('should read no words out of a title that was never filled in', () => {
    expect(toTitleWords(undefined)).toEqual([])
  })

  it('should read no words out of punctuation alone', () => {
    expect(toTitleWords(' - / ')).toEqual([])
  })
})

describe('containsAnyKeyword', () => {
  it('should match a whole word rather than a fragment of one', () => {
    expect(containsAnyKeyword({ words: ['legitimate', 'work'], keywords: ['it'] })).toBe(false)
    expect(containsAnyKeyword({ words: ['it', 'support'], keywords: ['it'] })).toBe(true)
  })

  it('should match a keyword made of several words', () => {
    expect(containsAnyKeyword({ words: ['head', 'of', 'research'], keywords: ['head of'] })).toBe(
      true,
    )
    expect(containsAnyKeyword({ words: ['head', 'chef'], keywords: ['head of'] })).toBe(false)
  })

  it('should match nothing in a title with no words', () => {
    expect(containsAnyKeyword({ words: [], keywords: ['engineer'] })).toBe(false)
  })
})
