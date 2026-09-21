import { describe, expect, it } from 'vitest'
import { buildRegistrant } from '../../testing/eventFactory'
import { buildCheckInBoard, findTabForArrowKey } from './checkInBoard'
import type { Registrant } from './registrant'

const ARRIVED_EARLY = '2026-09-24T19:00:00.000Z'
const ARRIVED_LATE = '2026-09-24T19:40:00.000Z'

const ronit = buildRegistrant({
  id: 'r1',
  name: 'Ronit Amsalem',
  email: 'ronit.amsalem@example.com',
})
const nadav = buildRegistrant({ id: 'r2', name: 'Nadav Peleg', email: 'nadav.peleg@example.com' })
const talArrivedFirst = buildRegistrant({
  id: 'r3',
  name: 'Tal Rimon',
  email: undefined,
  checkedInAt: ARRIVED_EARLY,
})
const shaiArrivedLast = buildRegistrant({
  id: 'r4',
  name: 'Shai Lavon',
  email: 'shai.lavon@example.com',
  checkedInAt: ARRIVED_LATE,
})

const everyone = [nadav, talArrivedFirst, ronit, shaiArrivedLast]

const namesOf = (registrants: readonly Registrant[]): readonly string[] =>
  registrants.map((registrant) => registrant.name)

describe('buildCheckInBoard counts', () => {
  it('should count everybody who has not arrived as pending', () => {
    const board = buildCheckInBoard({ registrants: everyone, searchText: '', activeTab: 'pending' })

    expect(board.pendingCount).toBe(2)
  })

  it('should count everybody who has arrived as arrived', () => {
    const board = buildCheckInBoard({ registrants: everyone, searchText: '', activeTab: 'pending' })

    expect(board.arrivedCount).toBe(2)
  })

  it('should count the whole room rather than the search, so the running total stays true', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'ronit',
      activeTab: 'pending',
    })

    expect(board).toMatchObject({ pendingCount: 2, arrivedCount: 2 })
  })
})

describe('buildCheckInBoard pending tab', () => {
  it('should show only the people who have not arrived', () => {
    const board = buildCheckInBoard({ registrants: everyone, searchText: '', activeTab: 'pending' })

    expect(namesOf(board.visibleRegistrants)).toEqual(['Nadav Peleg', 'Ronit Amsalem'])
  })

  it('should narrow the pending list to the search', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'ron',
      activeTab: 'pending',
    })

    expect(namesOf(board.visibleRegistrants)).toEqual(['Ronit Amsalem'])
  })

  it('should move somebody out of pending the moment they are checked in', () => {
    const board = buildCheckInBoard({
      registrants: [{ ...ronit, checkedInAt: ARRIVED_LATE }],
      searchText: '',
      activeTab: 'pending',
    })

    expect(board.visibleRegistrants).toEqual([])
  })
})

describe('buildCheckInBoard arrived tab', () => {
  it('should show only the people who have arrived', () => {
    const board = buildCheckInBoard({ registrants: everyone, searchText: '', activeTab: 'arrived' })

    expect(namesOf(board.visibleRegistrants)).toEqual(['Shai Lavon', 'Tal Rimon'])
  })

  it('should put the most recent arrival first, because that is the mis-tap being undone', () => {
    const board = buildCheckInBoard({
      registrants: [talArrivedFirst, shaiArrivedLast],
      searchText: '',
      activeTab: 'arrived',
    })

    expect(namesOf(board.visibleRegistrants)[0]).toBe('Shai Lavon')
  })

  it('should narrow the arrived list to the search', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'rimon',
      activeTab: 'arrived',
    })

    expect(namesOf(board.visibleRegistrants)).toEqual(['Tal Rimon'])
  })
})

describe('buildCheckInBoard empty state', () => {
  it('should say nothing at all while the tab has people to show', () => {
    const board = buildCheckInBoard({ registrants: everyone, searchText: '', activeTab: 'pending' })

    expect(board.emptyState).toBeUndefined()
  })

  it('should report an empty tab when nobody is in it and nothing was typed', () => {
    const board = buildCheckInBoard({
      registrants: [ronit, nadav],
      searchText: '',
      activeTab: 'arrived',
    })

    expect(board.emptyState).toEqual({ kind: 'empty-tab' })
  })

  it('should report a search that matches nobody anywhere', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'zzz',
      activeTab: 'pending',
    })

    expect(board.emptyState).toEqual({ kind: 'no-match' })
  })

  it('should say the searched person is on the other tab, not that nobody matches', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'rimon',
      activeTab: 'pending',
    })

    expect(board.emptyState).toEqual({
      kind: 'matched-on-other-tab',
      matches: [talArrivedFirst],
    })
  })

  it('should point at pending when somebody searched on the arrived tab has not come yet', () => {
    const board = buildCheckInBoard({
      registrants: everyone,
      searchText: 'nadav',
      activeTab: 'arrived',
    })

    expect(board.emptyState).toEqual({ kind: 'matched-on-other-tab', matches: [nadav] })
  })
})

describe('findTabForArrowKey', () => {
  it('should move to the other tab on the right arrow', () => {
    expect(findTabForArrowKey({ key: 'ArrowRight', activeTab: 'pending' })).toBe('arrived')
  })

  it('should wrap back to the first tab from the last one', () => {
    expect(findTabForArrowKey({ key: 'ArrowRight', activeTab: 'arrived' })).toBe('pending')
  })

  it('should move to the other tab on the left arrow', () => {
    expect(findTabForArrowKey({ key: 'ArrowLeft', activeTab: 'arrived' })).toBe('pending')
  })

  it('should jump to pending on Home', () => {
    expect(findTabForArrowKey({ key: 'Home', activeTab: 'arrived' })).toBe('pending')
  })

  it('should jump to arrived on End', () => {
    expect(findTabForArrowKey({ key: 'End', activeTab: 'pending' })).toBe('arrived')
  })

  it('should leave every other key to the browser, so typing still reaches the search box', () => {
    expect(findTabForArrowKey({ key: 'a', activeTab: 'pending' })).toBeUndefined()
  })
})
