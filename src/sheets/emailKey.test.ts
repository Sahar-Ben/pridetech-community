import { describe, expect, it } from 'vitest'
import { toEmailKey } from './emailKey'

describe('toEmailKey', () => {
  it('should fold case so the same address written two ways lands on one key', () => {
    expect(toEmailKey('Dana.Sorkin@Example.com')).toBe(toEmailKey('dana.sorkin@example.com'))
  })

  it('should fold away stray spaces, so one address pasted with a space is not two', () => {
    expect(toEmailKey(' Dana.Sorkin@Example.com ')).toBe('dana.sorkin@example.com')
  })

  it('should leave an already-lowercase address untouched', () => {
    expect(toEmailKey('dana.sorkin@example.com')).toBe('dana.sorkin@example.com')
  })
})
