import { toRecordedMail, type Member } from './member'
import { toLinkedInHref } from '../../app/linkedInUrl'

/* What "Copy all" puts on the clipboard: the person and how to reach them,
   one fact per line, ready to paste into a message or a note. Blank fields
   are left out rather than written as empty labels, and the LinkedIn line is
   the working address, not the cell as it was typed. */
export const buildMemberContactSummary = (member: Member): string => {
  const role = [member.title, member.company].filter((part) => part !== undefined).join(' · ')
  const linkedIn = toLinkedInHref(member.linkedIn) ?? member.linkedIn
  const lines: ReadonlyArray<string | undefined> = [
    member.name,
    role === '' ? undefined : role,
    toRecordedMail(member) === undefined ? undefined : `Email: ${member.mail}`,
    member.phone === undefined ? undefined : `Phone: ${member.phone}`,
    linkedIn === undefined ? undefined : `LinkedIn: ${linkedIn}`,
    member.city === undefined ? undefined : `City: ${member.city}`,
  ]
  return lines.filter((line) => line !== undefined).join('\n')
}
