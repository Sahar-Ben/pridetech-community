import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { filterRegistrantsForCheckIn } from './checkInSearch'

const ronit = buildRegistrant({
  id: 'a',
  name: 'Ronit Amsalem',
  email: 'ronit.amsalem@example.com',
})
const nadav = buildRegistrant({ id: 'b', name: 'Nadav Peleg', email: 'nadav.peleg@example.com' })
const namelessEmail = buildRegistrant({
  id: 'c',
  name: 'Tal Rimon',
  email: undefined,
})

const everyone = [ronit, nadav, namelessEmail]

const namesOf = (registrants: readonly { name: string }[]): readonly string[] =>
  registrants.map((registrant) => registrant.name)

describe('filterRegistrantsForCheckIn', () => {
  it('should show everybody before anything is typed', () => {
    expect(namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: '' }))).toEqual(
      ['Ronit Amsalem', 'Nadav Peleg', 'Tal Rimon'],
    )
  })

  it('should find someone from the first few letters of their name', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'ron' })),
    ).toEqual(['Ronit Amsalem'])
  })

  it('should find someone from their surname alone', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'pel' })),
    ).toEqual(['Nadav Peleg'])
  })

  it('should find someone by email', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'nadav.peleg@' })),
    ).toEqual(['Nadav Peleg'])
  })

  it('should ignore capitals, since nobody types them at a door', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'RONIT' })),
    ).toEqual(['Ronit Amsalem'])
  })

  it('should narrow on each word typed, so a first and last initial is enough', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'ro am' })),
    ).toEqual(['Ronit Amsalem'])
  })

  it('should still search a registrant whose sheet never captured an email', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'rimon' })),
    ).toEqual(['Tal Rimon'])
  })

  it('should return nobody when the search matches nobody', () => {
    expect(filterRegistrantsForCheckIn({ registrants: everyone, searchText: 'zzz' })).toEqual([])
  })

  it('should ignore surrounding whitespace left by a phone keyboard', () => {
    expect(
      namesOf(filterRegistrantsForCheckIn({ registrants: everyone, searchText: '  ronit  ' })),
    ).toEqual(['Ronit Amsalem'])
  })
})
