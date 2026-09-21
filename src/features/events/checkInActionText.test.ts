import { describe, expect, it } from 'vitest'
import { describeCheckInToggle, describeWalkInAdded } from './checkInActionText'

describe('describeCheckInToggle', () => {
  it('should name the person who was just checked in', () => {
    expect(describeCheckInToggle({ name: 'Ronit Amsalem', wasCheckedIn: false })).toBe(
      'Ronit Amsalem checked in',
    )
  })

  it('should name the person whose check-in was just undone', () => {
    expect(describeCheckInToggle({ name: 'Ronit Amsalem', wasCheckedIn: true })).toBe(
      'Ronit Amsalem check-in undone',
    )
  })
})

describe('describeWalkInAdded', () => {
  it('should say a community member was added from the member list', () => {
    expect(
      describeWalkInAdded({ name: 'Dana Sorkin', isCommunityMember: true, isMembersOnly: true }),
    ).toBe('Dana Sorkin added from the member list and checked in')
  })

  it('should warn that a non-member was let into a members-only event', () => {
    expect(
      describeWalkInAdded({ name: 'Shai Lavon', isCommunityMember: false, isMembersOnly: true }),
    ).toMatch(/members only/i)
  })

  it('should still record the non-member, because the door decided to let them in', () => {
    expect(
      describeWalkInAdded({ name: 'Shai Lavon', isCommunityMember: false, isMembersOnly: true }),
    ).toMatch(/Shai Lavon/)
  })

  it('should say nothing about policy at an event that accepts non-members', () => {
    expect(
      describeWalkInAdded({ name: 'Shai Lavon', isCommunityMember: false, isMembersOnly: false }),
    ).toBe('Shai Lavon added as a walk-in and checked in')
  })
})
