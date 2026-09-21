import { describe, expect, it } from 'vitest'
import { readCell } from './readCell'

describe('readCell', () => {
  it('should return the trimmed value at the column', () => {
    expect(readCell({ row: ['a', '  b  '], column: 1 })).toBe('b')
  })

  it('should return undefined when the column is beyond the end of a short row', () => {
    expect(readCell({ row: ['a'], column: 5 })).toBeUndefined()
  })

  it('should return undefined when the column index is undefined', () => {
    expect(readCell({ row: ['a'], column: undefined })).toBeUndefined()
  })

  it('should return undefined for a cell containing only whitespace', () => {
    expect(readCell({ row: ['a', '   '], column: 1 })).toBeUndefined()
  })

  it('should return undefined for a cell containing only a zero-width space', () => {
    expect(readCell({ row: ['\u{200b}'], column: 0 })).toBeUndefined()
  })

  it('should return undefined for a cell holding a directional mark beside whitespace', () => {
    expect(readCell({ row: ['\u{200e}  '], column: 0 })).toBeUndefined()
  })

  it('should strip a leading directional mark so the name matches its unmarked duplicate', () => {
    expect(readCell({ row: ['\u{200e}Dana Levi'], column: 0 })).toBe('Dana Levi')
  })

  it('should strip directional marks from the middle of a mixed-direction value', () => {
    const marked = 'Dana \u{200f}\u{05dc}\u{05d5}\u{05d9}\u{200e} Levi'
    expect(readCell({ row: [marked], column: 0 })).toBe('Dana \u{05dc}\u{05d5}\u{05d9} Levi')
  })

  it('should strip a byte order mark from the middle of a copy-pasted value', () => {
    expect(readCell({ row: ['Tel\u{feff}Aviv'], column: 0 })).toBe('TelAviv')
  })

  it('should strip bidi isolates and embeddings wrapping a Hebrew name', () => {
    const wrapped = '\u{2066}\u{202b}\u{05e9}\u{05e8}\u{05d4}\u{202c}\u{2069}'
    expect(readCell({ row: [wrapped], column: 0 })).toBe('\u{05e9}\u{05e8}\u{05d4}')
  })

  it('should strip a soft hyphen left inside a word by a word processor', () => {
    expect(readCell({ row: ['Ben\u{00ad}Gurion'], column: 0 })).toBe('BenGurion')
  })

  it('should strip a word joiner', () => {
    expect(readCell({ row: ['Tel\u{2060}Aviv'], column: 0 })).toBe('TelAviv')
  })

  it('should strip a leading mark before trimming the space it hides behind', () => {
    expect(readCell({ row: ['\u{200e} Dana Levi'], column: 0 })).toBe('Dana Levi')
  })

  it('should strip a trailing mark before trimming the space it hides behind', () => {
    expect(readCell({ row: ['Dana Levi \u{200e}'], column: 0 })).toBe('Dana Levi')
  })

  it('should keep the zero-width joiner that holds an emoji sequence together', () => {
    const womanTechnologist = '\u{1f469}\u{200d}\u{1f4bb}'
    expect(readCell({ row: [womanTechnologist], column: 0 })).toBe(womanTechnologist)
  })

  it('should keep a flag emoji intact', () => {
    expect(readCell({ row: ['Nicolas Nemni \u{1f1fa}\u{1f1f8}'], column: 0 })).toBe(
      'Nicolas Nemni \u{1f1fa}\u{1f1f8}',
    )
  })

  it('should keep the zero-width non-joiner that is meaningful in Persian', () => {
    const miRavam = '\u{0645}\u{06cc}\u{200c}\u{0631}\u{0648}\u{0645}'
    expect(readCell({ row: [miRavam], column: 0 })).toBe(miRavam)
  })

  it('should keep the zero-width non-joiner that is meaningful in Hindi', () => {
    const kSha = '\u{0915}\u{094d}\u{200c}\u{0937}'
    expect(readCell({ row: [kSha], column: 0 })).toBe(kSha)
  })
})
