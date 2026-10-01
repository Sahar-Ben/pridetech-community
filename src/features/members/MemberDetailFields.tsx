import { MemberDetailField } from './MemberDetailField'
import { toRecordedMail, type Member } from './member'
import { toLinkedInHref } from '../../app/linkedInUrl'
import { toTelHref } from '../../app/phoneLinks'

type MemberDetailFieldsProps = {
  member: Member
}

const SECTION_CLASSES = 'flex flex-col gap-1'

const SECTION_TITLE_CLASSES =
  'font-mono text-[11px] font-medium tracking-[0.14em] text-accent uppercase'

/* Two groups: how to reach the person, each with a copy button because those
   are what gets pasted into messages, and everything else about them, plain.
   "Copy all contact details" above covers the rest in one go. */
export const MemberDetailFields = ({ member }: MemberDetailFieldsProps) => {
  /* A row with no address is shown as a row with no address, rather than as a
     `mailto:` link to nobody. */
  const recordedMail = toRecordedMail(member)

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Contact" className={SECTION_CLASSES}>
        <h4 className={SECTION_TITLE_CLASSES}>Contact</h4>
        <dl>
          <MemberDetailField
            href={recordedMail === undefined ? undefined : `mailto:${recordedMail}`}
            isCopyable
            label="Email"
            value={recordedMail}
          />
          <MemberDetailField
            href={toTelHref(member.phone)}
            isCopyable
            label="Phone"
            value={member.phone}
          />
          <MemberDetailField
            href={toLinkedInHref(member.linkedIn)}
            isCopyable
            label="LinkedIn"
            value={member.linkedIn}
          />
        </dl>
      </section>

      <section aria-label="Details" className={SECTION_CLASSES}>
        <h4 className={SECTION_TITLE_CLASSES}>Details</h4>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <MemberDetailField label="Status" value={member.status} />
          {member.status === 'Ex-member' && (
            <MemberDetailField label="Removal reason" value={member.removalReason} />
          )}
          <MemberDetailField label="Title" value={member.title} />
          <MemberDetailField label="Company" value={member.company} />
          <MemberDetailField label="Gender" value={member.gender} />
          <MemberDetailField label="City" value={member.city} />
          <MemberDetailField label="Interests" value={member.interests} />
          <MemberDetailField label="Shirt size" value={member.shirtSize} />
          <MemberDetailField label="Informed for membership" value={member.informedForMembership} />
          <MemberDetailField label="Approved at" value={member.approvedAt} />
          <MemberDetailField label="Notes" value={member.notes} />
        </dl>
      </section>
    </div>
  )
}
