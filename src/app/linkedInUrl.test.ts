import { describe, expect, it } from 'vitest'
import { toLinkedInHref } from './linkedInUrl'

describe('toLinkedInHref', () => {
  it.each([
    ['https://www.linkedin.com/in/dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['http://linkedin.com/in/dana', 'http://linkedin.com/in/dana'],
    ['linkedin.com/in/dana-maman', 'https://linkedin.com/in/dana-maman'],
    ['www.linkedin.com/in/dana-maman/', 'https://www.linkedin.com/in/dana-maman/'],
    ['il.linkedin.com/in/dana', 'https://il.linkedin.com/in/dana'],
    ['LinkedIn.com/in/Dana', 'https://linkedin.com/in/Dana'],
    ['  https://www.linkedin.com/in/dana  ', 'https://www.linkedin.com/in/dana'],
    ['//www.linkedin.com/in/dana', 'https://www.linkedin.com/in/dana'],
    ['in/dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['/in/dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['@dana-maman', 'https://www.linkedin.com/in/dana-maman'],
    ['My profile: https://www.linkedin.com/in/dana.', 'https://www.linkedin.com/in/dana'],
    [
      'https://www.linkedin.com/in/dana?utm_source=share&utm_medium=member_ios',
      'https://www.linkedin.com/in/dana?utm_source=share&utm_medium=member_ios',
    ],
  ])('should turn %j into %j', (cell, expected) => {
    expect(toLinkedInHref(cell)).toBe(expected)
  })

  it('should keep a Hebrew profile address working', () => {
    expect(toLinkedInHref('linkedin.com/in/דנה-ממן')).toBe(
      'https://linkedin.com/in/%D7%93%D7%A0%D7%94-%D7%9E%D7%9E%D7%9F',
    )
  })

  it.each(['', '   ', 'N/A', 'none', '-', 'לא', 'I do not have one yet', 'dana@example.com'])(
    'should find no address in %j',
    (cell) => {
      expect(toLinkedInHref(cell)).toBeUndefined()
    },
  )

  it('should find no address in an empty cell', () => {
    expect(toLinkedInHref(undefined)).toBeUndefined()
  })
})
