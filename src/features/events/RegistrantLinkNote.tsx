import type { RegistrantLink } from './registrantLink'

const NEUTRAL_CLASSES = 'text-ink-muted'
const UNRESOLVED_CLASSES = 'font-semibold text-warning-ink'

type RegistrantLinkNoteProps = {
  link: RegistrantLink
}

/* Four different things, deliberately not collapsed into "unknown": a guest is
   here legitimately, a row from a sheet with no email column can never be
   matched, and an email that matches nobody is the only one worth reviewing. */
export const RegistrantLinkNote = ({ link }: RegistrantLinkNoteProps) => {
  if (link.kind === 'member') {
    return <span className={NEUTRAL_CLASSES}>Member</span>
  }
  if (link.kind === 'guest') {
    return <span className={NEUTRAL_CLASSES}>Guest of {link.hostName}</span>
  }
  if (link.kind === 'no-email') {
    return <span className={UNRESOLVED_CLASSES}>No email on this sheet</span>
  }
  return <span className={UNRESOLVED_CLASSES}>Not matched to a member</span>
}
