import { describe, expect, it } from 'vitest'
import { buildMember } from '../../testing/memberFactory'
import { buildRegistrant } from '../../testing/eventFactory'
import { resolveRegistrantLink } from './registrantLink'

const dana = buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana.sorkin@example.com' })
const members = [dana]

describe('resolveRegistrantLink', () => {
  it('should match a registrant to the member with the same email', () => {
    const registrant = buildRegistrant({ email: 'dana.sorkin@example.com' })

    expect(resolveRegistrantLink({ registrant, members, eventRegistrants: [] })).toEqual({
      kind: 'member',
      memberName: 'Dana Sorkin',
      rowNumber: 2,
    })
  })

  it('should match regardless of how the email was capitalised on the form', () => {
    const registrant = buildRegistrant({ email: ' Dana.Sorkin@Example.com ' })

    expect(resolveRegistrantLink({ registrant, members, eventRegistrants: [] })).toEqual({
      kind: 'member',
      memberName: 'Dana Sorkin',
      rowNumber: 2,
    })
  })

  it('should say a registrant with no email cannot be matched, rather than guessing by name', () => {
    const registrant = buildRegistrant({ name: 'Dana Sorkin', email: undefined })

    expect(resolveRegistrantLink({ registrant, members, eventRegistrants: [] })).toEqual({
      kind: 'no-email',
    })
  })

  it('should say plainly when an email matches nobody in the community', () => {
    const registrant = buildRegistrant({ email: 'stranger@example.com' })

    expect(resolveRegistrantLink({ registrant, members, eventRegistrants: [] })).toEqual({
      kind: 'unmatched',
    })
  })

  it('should name the member a plus-one came with instead of calling them unmatched', () => {
    const guest = buildRegistrant({
      id: 'guest',
      name: 'Shira Bental',
      email: 'shira.bental@example.com',
      guestOfEmail: 'dana.sorkin@example.com',
    })

    expect(resolveRegistrantLink({ registrant: guest, members, eventRegistrants: [] })).toEqual({
      kind: 'guest',
      hostName: 'Dana Sorkin',
    })
  })

  it('should name the host from the event sheet when the host is not a member either', () => {
    const host = buildRegistrant({ id: 'host', name: 'Noa Falk', email: 'noa.falk@example.com' })
    const guest = buildRegistrant({
      id: 'guest',
      name: 'Shira Bental',
      email: 'shira.bental@example.com',
      guestOfEmail: 'noa.falk@example.com',
    })

    expect(
      resolveRegistrantLink({ registrant: guest, members, eventRegistrants: [host, guest] }),
    ).toEqual({ kind: 'guest', hostName: 'Noa Falk' })
  })

  it('should fall back to the host email when nothing names the member who brought them', () => {
    const guest = buildRegistrant({ guestOfEmail: 'unknown.host@example.com' })

    expect(resolveRegistrantLink({ registrant: guest, members, eventRegistrants: [] })).toEqual({
      kind: 'guest',
      hostName: 'unknown.host@example.com',
    })
  })
})
