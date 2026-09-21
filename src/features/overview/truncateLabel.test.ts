import { describe, expect, it } from 'vitest'
import { truncateLabel } from './truncateLabel'

describe('truncateLabel', () => {
  it('should leave a label that fits exactly as it was written', () => {
    expect(truncateLabel({ label: 'Engineering', maximumCharacters: 20 })).toBe('Engineering')
  })

  it('should cut a label too long for its column and mark that it was cut', () => {
    expect(truncateLabel({ label: 'Brightfell Media Group International', maximumCharacters: 20 }))
      .toBe('Brightfell Media Gr\u{2026}')
  })

  it('should not leave a space dangling before the ellipsis', () => {
    expect(truncateLabel({ label: 'Salted Mind Systems', maximumCharacters: 12 })).toBe(
      'Salted Mind\u{2026}',
    )
  })

  it('should leave an empty label empty', () => {
    expect(truncateLabel({ label: '', maximumCharacters: 20 })).toBe('')
  })
})
