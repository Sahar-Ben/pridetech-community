import type { Lead } from './lead'
import { QuickActions } from '../../app/QuickActions'

type ApplicantContactLinksProps = {
  lead: Lead
}

/* LinkedIn first because gender is decided from the profile; WhatsApp rather
   than a call, because that is how the organisers reach applicants. */
export const ApplicantContactLinks = ({ lead }: ApplicantContactLinksProps) => (
  <QuickActions
    actions={['linkedin', 'email', 'whatsapp']}
    email={lead.email}
    linkedIn={lead.linkedIn}
    phone={lead.phone}
  />
)
