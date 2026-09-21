import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { replaceMember } from './memberUpdates'

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin' })
const tomer = buildMember({ rowNumber: 3, name: 'Tomer Reznik' })

describe('replaceMember', () => {
  it('should put the edited member back in the place of the old one', () => {
    const updatedMember = { ...dana, company: 'Northbridge Labs' }

    expect(replaceMember({ members: [dana, tomer], updatedMember })).toEqual([
      updatedMember,
      tomer,
    ])
  })

  it('should leave everyone else untouched', () => {
    const updatedMember = { ...dana, name: 'Dana Sorkin-Levi' }

    const [, second] = replaceMember({ members: [dana, tomer], updatedMember })

    expect(second).toBe(tomer)
  })

  it('should not change the list it was given', () => {
    const members = [dana, tomer]

    replaceMember({ members, updatedMember: { ...dana, name: 'Dana Sorkin-Levi' } })

    expect(members[0]).toBe(dana)
  })

  it('should leave the list alone when the row is not in it', () => {
    const strangerRow = buildMember({ rowNumber: 99, name: 'Nobody Here' })

    expect(replaceMember({ members: [dana, tomer], updatedMember: strangerRow })).toEqual([
      dana,
      tomer,
    ])
  })
})
