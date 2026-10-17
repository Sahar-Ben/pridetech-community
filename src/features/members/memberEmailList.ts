import { toRecordedMail, type Member } from './member'
import { toEmailKey } from '../../sheets/emailKey'

export type MemberEmailList = {
  text: string
  emailCount: number
  /* Members on the list with no address on the Members tab, so the button can
     say who the paste will leave out. */
  withoutEmailCount: number
  /* Rows whose address is already on the list from another row, which is why
     the copied count can be lower than the members shown. */
  repeatedCount: number
}

/* Main addresses only, one per person, in a form Gmail's To and Bcc fields
   take as pasted: separated by a comma and a space. The same address on two
   rows is listed once, so nobody is emailed twice. */
export const buildMemberEmailList = (members: readonly Member[]): MemberEmailList => {
  const seen = new Set<string>()
  const emails: string[] = []
  let withoutEmailCount = 0
  let repeatedCount = 0

  members.forEach((member) => {
    const mail = toRecordedMail(member)
    if (mail === undefined) {
      withoutEmailCount += 1
      return
    }
    const key = toEmailKey(mail)
    if (seen.has(key)) {
      repeatedCount += 1
      return
    }
    seen.add(key)
    emails.push(mail.trim())
  })

  return { text: emails.join(', '), emailCount: emails.length, withoutEmailCount, repeatedCount }
}
