import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { searchMembersToLink } from './memberLinkSearch'
import type { Registrant } from './registrant'
import { keepFocusInDialog } from '../../app/dialogFocus'
import { NoticeBanner } from '../../app/NoticeBanner'
import type { EmailLinkMode } from '../members/linkEmailToMember'
import { formatOtherEmails, toRecordedMail, type Member } from '../members/member'
import {
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  TOUCH_BUTTON_SIZE_CLASSES,
} from '../../theme/controls'
import { FIELD_BORDER_CLASSES, FIELD_CONTROL_CLASSES, FIELD_LABEL_CLASSES } from '../../theme/fields'
import { WORK_PANEL_CLASSES } from '../../theme/surfaces'

/* Above the bottom nav (z-40), anchored to the bottom on a phone and centred
   from `sm` up, the same as every other dialog in the app. */
const SCRIM_CLASSES = [
  'fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4',
  'bg-[rgb(4_3_10/0.7)] backdrop-blur-sm animate-fade',
].join(' ')

const DIALOG_CLASSES = `${WORK_PANEL_CLASSES} flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain rounded-[var(--radius-brand)] px-5 py-5`

const PRIMARY_CLASSES = `${PRIMARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const SECONDARY_CLASSES = `${SECONDARY_BUTTON_CLASSES} ${TOUCH_BUTTON_SIZE_CLASSES}`

const RESULT_CLASSES = [
  'flex min-h-11 w-full flex-col items-start gap-0.5 rounded-2xl border border-hairline px-4 py-2 text-left',
  'transition-colors duration-150 ease-brand hover:bg-surface-raised',
].join(' ')

const EMAIL_LABEL_CLASSES = FIELD_LABEL_CLASSES

const EMAIL_VALUE_CLASSES = 'text-[15px] font-semibold wrap-anywhere text-ink'

type LinkToMemberDialogProps = {
  registrant: Registrant & { email: string }
  members: readonly Member[]
  isBusy: boolean
  errorMessage: string | undefined
  onLink: (options: { member: Member; mode: EmailLinkMode }) => void
  onCancel: () => void
}

const EmailLine = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex flex-col gap-0.5">
    <span className={EMAIL_LABEL_CLASSES}>{label}</span>
    <span className={EMAIL_VALUE_CLASSES}>{value ?? 'None recorded'}</span>
  </div>
)

/* Two steps in one dialog: find the member this person is, then decide what
   their registration address becomes. The second step puts both addresses side
   by side, because whether to keep the old one is only answerable by somebody
   looking at the two of them. Nothing is written until one of its two buttons
   is pressed. */
export const LinkToMemberDialog = ({
  registrant,
  members,
  isBusy,
  errorMessage,
  onLink,
  onCancel,
}: LinkToMemberDialogProps) => {
  const headingId = useId()
  const searchId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchText, setSearchText] = useState(registrant.name)
  const [chosenMember, setChosenMember] = useState<Member | undefined>(undefined)
  const results = searchMembersToLink({ members, searchText })

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const cancelUnlessBusy = () => {
    if (!isBusy) {
      onCancel()
    }
  }

  return createPortal(
    <div className={SCRIM_CLASSES}>
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className={DIALOG_CLASSES}
        onKeyDown={(keyboardEvent) =>
          keepFocusInDialog({ keyboardEvent, dialog: dialogRef.current, onEscape: cancelUnlessBusy })
        }
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="text-lg font-bold wrap-anywhere text-ink" id={headingId}>
          Link {registrant.name} to a member
        </h2>

        {chosenMember === undefined ? (
          <>
            <p className="text-sm text-ink-muted">
              They registered with <span className="font-semibold wrap-anywhere text-ink">{registrant.email}</span>,
              which is not on the Members tab. Find the member they are.
            </p>

            <label className="flex flex-col gap-1" htmlFor={searchId}>
              <span className={FIELD_LABEL_CLASSES}>Search members</span>
              <input
                aria-label="Search members"
                className={`${FIELD_CONTROL_CLASSES} ${FIELD_BORDER_CLASSES}`}
                id={searchId}
                onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
                placeholder="Name or email"
                ref={searchRef}
                type="search"
                value={searchText}
              />
            </label>

            {results.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {searchText.trim() === ''
                  ? 'Type a name or an email.'
                  : 'No member matches that. Try their surname alone, or another email they use.'}
              </p>
            ) : (
              <ul aria-label="Matching members" className="flex flex-col gap-2">
                {results.map((member) => (
                  <li key={member.rowNumber}>
                    <button
                      className={RESULT_CLASSES}
                      onClick={() => setChosenMember(member)}
                      type="button"
                    >
                      <span className="font-semibold wrap-anywhere text-ink">
                        {member.name === '' ? 'No name recorded' : member.name}
                      </span>
                      <span className="text-sm wrap-anywhere text-ink-muted">
                        {toRecordedMail(member) ?? 'No email recorded'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button className={SECONDARY_CLASSES} onClick={onCancel} type="button">
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-2xl border border-hairline px-4 py-3">
              <EmailLine label="Registered for this event with" value={registrant.email} />
              <EmailLine
                label={`${chosenMember.name}'s email on the Members tab`}
                value={toRecordedMail(chosenMember)}
              />
              {chosenMember.otherEmails.length > 0 && (
                <EmailLine
                  label="Their other emails"
                  value={formatOtherEmails(chosenMember.otherEmails)}
                />
              )}
            </div>

            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">Add as another email</span> keeps their
              email and matches them on both from now on.{' '}
              <span className="font-semibold text-ink">Replace their email</span> puts the
              registered one in place of their email, for when the old one is wrong or no longer
              used.
            </p>

            {errorMessage !== undefined && (
              <NoticeBanner role="alert" title={errorMessage} tone="danger" />
            )}

            <div className="flex flex-col gap-2">
              <button
                className={PRIMARY_CLASSES}
                disabled={isBusy}
                onClick={() => onLink({ member: chosenMember, mode: 'add' })}
                type="button"
              >
                {isBusy ? 'Saving\u{2026}' : 'Add as another email'}
              </button>
              <button
                className={SECONDARY_CLASSES}
                disabled={isBusy}
                onClick={() => onLink({ member: chosenMember, mode: 'replace' })}
                type="button"
              >
                Replace their email
              </button>
              <button
                className={SECONDARY_CLASSES}
                disabled={isBusy}
                onClick={() => setChosenMember(undefined)}
                type="button"
              >
                Choose a different member
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
