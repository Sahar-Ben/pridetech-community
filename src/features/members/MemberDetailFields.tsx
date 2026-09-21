import { MemberDetailField } from './MemberDetailField'
import type { Member } from './member'

type MemberDetailFieldsProps = {
  member: Member
}

export const MemberDetailFields = ({ member }: MemberDetailFieldsProps) => (
  <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
    <MemberDetailField label="Status" value={member.status} />
    {member.status === 'Ex-member' && (
      <MemberDetailField label="Removal reason" value={member.removalReason} />
    )}
    <MemberDetailField label="Title" value={member.title} />
    <MemberDetailField label="Company" value={member.company} />
    <MemberDetailField label="Gender" value={member.gender} />
    <MemberDetailField href={`mailto:${member.mail}`} label="Email" value={member.mail} />
    <MemberDetailField label="Phone" value={member.phone} />
    <MemberDetailField label="City" value={member.city} />
    <MemberDetailField href={member.linkedIn} label="LinkedIn" value={member.linkedIn} />
    <MemberDetailField label="Interests" value={member.interests} />
    <MemberDetailField label="Shirt size" value={member.shirtSize} />
    <MemberDetailField label="Informed for membership" value={member.informedForMembership} />
    <MemberDetailField label="Approved at" value={member.approvedAt} />
    <MemberDetailField label="Notes" value={member.notes} />
  </dl>
)
