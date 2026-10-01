import { describe, expect, it } from 'vitest'
import { initialsOf } from './initials'

describe('initialsOf', () => {
  it('should take the first letter of the first two words', () => {
    expect(initialsOf('Noa Levi Cohen')).toBe('NL')
  })

  it('should give one letter for one word', () => {
    expect(initialsOf('dana@example.com')).toBe('D')
  })

  it('should ignore runs of spaces', () => {
    expect(initialsOf('  yoni   shapiro ')).toBe('YS')
  })
})
