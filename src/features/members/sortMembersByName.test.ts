import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { sortMembersByName } from './sortMembersByName'

const named = (name: string) => buildMember({ name, rowNumber: name.length + 1 })

const orderedNames = (names: readonly string[]): readonly string[] =>
  sortMembersByName(names.map(named)).map((member) => member.name)

describe('sortMembersByName', () => {
  it('should order Latin names without regard to case', () => {
    expect(orderedNames(['Zohar Amit', 'adi levi', 'Ben Gurion'])).toEqual([
      'adi levi',
      'Ben Gurion',
      'Zohar Amit',
    ])
  })

  it('should order Hebrew names by the Hebrew alphabet', () => {
    expect(orderedNames(['\u{5ea}\u{5de}\u{5e8}', '\u{5d0}\u{5d1}\u{5d9}\u{5d2}\u{5d9}\u{5dc}', '\u{5d3}\u{5e0}\u{5d4}'])).toEqual([
      '\u{5d0}\u{5d1}\u{5d9}\u{5d2}\u{5d9}\u{5dc}',
      '\u{5d3}\u{5e0}\u{5d4}',
      '\u{5ea}\u{5de}\u{5e8}',
    ])
  })

  it('should keep a mixed-script directory in one predictable order', () => {
    expect(
      orderedNames([
        'Zohar Amit',
        '\u{5ea}\u{5de}\u{5e8} \u{5e8}\u{5d6}\u{5e0}\u{5d9}\u{5e7}',
        'adi levi',
        '\u{5d0}\u{5d1}\u{5d9}\u{5d2}\u{5d9}\u{5dc} \u{5db}\u{5d4}\u{5df}',
      ]),
    ).toEqual([
      '\u{5d0}\u{5d1}\u{5d9}\u{5d2}\u{5d9}\u{5dc} \u{5db}\u{5d4}\u{5df}',
      '\u{5ea}\u{5de}\u{5e8} \u{5e8}\u{5d6}\u{5e0}\u{5d9}\u{5e7}',
      'adi levi',
      'Zohar Amit',
    ])
  })

  it('should put a member with no recorded name last rather than first', () => {
    expect(orderedNames(['Zohar Amit', '', 'adi levi'])).toEqual(['adi levi', 'Zohar Amit', ''])
  })

  it('should keep every nameless member rather than collapsing them into one', () => {
    const nameless = [
      buildMember({ rowNumber: 8, name: '', mail: 'first@example.com' }),
      buildMember({ rowNumber: 9, name: '', mail: 'second@example.com' }),
    ]

    expect(sortMembersByName(nameless).map((member) => member.mail)).toEqual([
      'first@example.com',
      'second@example.com',
    ])
  })

  it('should leave the members it was given untouched', () => {
    const members = [named('Zohar Amit'), named('adi levi')]

    sortMembersByName(members)

    expect(members.map((member) => member.name)).toEqual(['Zohar Amit', 'adi levi'])
  })
})
