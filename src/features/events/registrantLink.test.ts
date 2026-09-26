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

  it('should say a registrant with no email and no member of that name cannot be matched', () => {
    const registrant = buildRegistrant({ name: 'Ronit Amsalem', email: undefined })

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

describe('resolveRegistrantLink, by name for a sheet with no email', () => {
  const members = [
    buildMember({ rowNumber: 2, name: 'Dana Sorkin', mail: 'dana@example.com' }),
    buildMember({ rowNumber: 3, name: 'Noa Levi', mail: 'noa.one@example.com' }),
    buildMember({ rowNumber: 4, name: 'Noa Levi', mail: 'noa.two@example.com' }),
    buildMember({ rowNumber: 5, name: 'Avi', mail: 'avi@example.com' }),
  ]
  const resolve = (name: string) =>
    resolveRegistrantLink({
      registrant: buildRegistrant({ name, email: undefined }),
      members,
      eventRegistrants: [],
    })

  it('should match exactly one member with the same full name, whatever its case and spacing', () => {
    expect(resolve('  dana   SORKIN ')).toEqual({
      kind: 'member-by-name',
      memberName: 'Dana Sorkin',
      rowNumber: 2,
    })
  })

  it('should not match a name two members share', () => {
    expect(resolve('Noa Levi')).toEqual({ kind: 'no-email' })
  })

  it('should not match a first name alone, even when only one member has it', () => {
    expect(resolve('Avi')).toEqual({ kind: 'no-email' })
  })

  it('should not match part of a name', () => {
    expect(resolve('Dana')).toEqual({ kind: 'no-email' })
  })
})
