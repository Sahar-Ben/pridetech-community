import type { Gender } from './decision'
import { toGenderCell } from './genderCell'
import type { Lead } from './lead'
import { buildMemberSheetRow } from './memberSheetColumns'

const NEW_MEMBER_STATUS = 'Active'

/* Every field the form collects is carried across, including the ones the
   applicant left blank: the Members tab is the record the community works from,
   and a member whose city is missing there because the write skipped it looks
   identical to one who never gave a city. */
export const buildMemberRow = ({
  lead,
  gender,
  membersHeaderRow,
  approvedAt,
}: {
  lead: Lead
  gender: Gender
  membersHeaderRow: readonly string[]
  approvedAt: string
}): string[] =>
  buildMemberSheetRow({
    membersHeaderRow,
    writes: [
      { target: 'name', value: lead.name ?? '' },
      { target: 'company', value: lead.company ?? '' },
      { target: 'title', value: lead.jobTitle ?? '' },
      { target: 'gender', value: toGenderCell(gender) },
      { target: 'mail', value: lead.email },
      { target: 'phone', value: lead.phone ?? '' },
      { target: 'city', value: lead.city ?? '' },
      { target: 'linkedIn', value: lead.linkedIn ?? '' },
      { target: 'interests', value: lead.interests ?? '' },
      { target: 'status', value: NEW_MEMBER_STATUS },
      { target: 'approvedAt', value: approvedAt },
    ],
  })
