import type { RegistrantLink } from './registrantLink'

/* Silence for a matched member is the point: at a members-only door almost
   everybody is one, and a badge on every row would bury the two that matter.
   A row from a sheet with no email column says so in place of its email, and
   calling it a non-member would turn a gap in the data into an accusation. */
export const describeNonMemberMarker = (link: RegistrantLink): string | undefined => {
  if (link.kind === 'guest') {
    return `Guest of ${link.hostName}`
  }
  if (link.kind === 'unmatched') {
    return 'Not in the member list'
  }
  return undefined
}
