import { MemberDetailField } from './MemberDetailField'
import { toRecordedMail, type Member } from './member'
import { toLinkedInHref } from '../../app/linkedInUrl'

type MemberDetailFieldsProps = {
  member: Member
}

export const MemberDetailFields = ({ member }: MemberDetailFieldsProps) => {
  /* A row with no address is shown as a row with no address, rather than as a
     `mailto:` link to nobody. */
  const recordedMail = toRecordedMail(member)

  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      <MemberDetailField label="Status" value={member.status} />
      {member.status === 'Ex-member' && (
        <MemberDetailField label="Removal reason" value={member.removalReason} />
      )}
      <MemberDetailField label="Title" value={member.title} />
      <MemberDetailField label="Company" value={member.company} />
      <MemberDetailField label="Gender" value={member.gender} />
      <MemberDetailField
        href={recordedMail === undefined ? undefined : `mailto:${recordedMail}`}
        label="Email"
        value={recordedMail}
      />
      <MemberDetailField label="Phone" value={member.phone} />
      <MemberDetailField label="City" value={member.city} />
      <MemberDetailField
        href={toLinkedInHref(member.linkedIn)}
        label="LinkedIn"
        value={member.linkedIn}
      />
      <MemberDetailField label="Interests" value={member.interests} />
      <MemberDetailField label="Shirt size" value={member.shirtSize} />
      <MemberDetailField label="Informed for membership" value={member.informedForMembership} />
      <MemberDetailField label="Approved at" value={member.approvedAt} />
      <MemberDetailField label="Notes" value={member.notes} />
    </dl>
  )
}
