import { describe, expect, it } from 'vitest'
import { buildColumnChoices, describeColumnChoice } from './columnChoices'

describe('buildColumnChoices', () => {
  it('should offer every column of the header row, by the letter it sits in', () => {
    expect(buildColumnChoices({ headerRow: ['Timestamp', 'Name'] })).toEqual([
      { columnIndex: 0, letter: 'A', heading: 'Timestamp' },
      { columnIndex: 1, letter: 'B', heading: 'Name' },
    ])
  })

  it('should offer the column under a blank heading, which is the only way to map it', () => {
    expect(buildColumnChoices({ headerRow: ['', 'Name'] })[0]).toEqual({
      columnIndex: 0,
      letter: 'A',
      heading: undefined,
    })
  })

  it('should offer both columns when two share a heading, since they are different columns', () => {
    const choices = buildColumnChoices({ headerRow: ['Name', 'Email', 'Name'] })

    expect(choices.map((choice) => choice.letter)).toEqual(['A', 'B', 'C'])
  })

  it('should offer nothing for a sheet whose header row is empty', () => {
    expect(buildColumnChoices({ headerRow: [] })).toEqual([])
  })
})

describe('describeColumnChoice', () => {
  it('should name a column by its letter and its heading', () => {
    expect(
      describeColumnChoice({ columnIndex: 2, letter: 'C', heading: 'E-Mail' }),
    ).toBe('C \u{2014} E-Mail')
  })

  it('should say a column has no heading rather than show an empty label', () => {
    expect(describeColumnChoice({ columnIndex: 0, letter: 'A', heading: undefined })).toBe(
      'A \u{2014} (no heading)',
    )
  })

  it('should tell two columns with the same heading apart by their letters', () => {
    const [first, , third] = buildColumnChoices({ headerRow: ['Name', 'Email', 'Name'] })

    expect(first === undefined || third === undefined).toBe(false)
    expect(first && describeColumnChoice(first)).not.toBe(third && describeColumnChoice(third))
  })
})
