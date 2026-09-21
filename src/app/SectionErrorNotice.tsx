import { NoticeBanner } from './NoticeBanner'
import { COMPACT_BUTTON_SIZE_CLASSES, SHELL_BUTTON_CLASSES } from '../theme/controls'

const RETRY_BUTTON_CLASSES = `mt-4 ${SHELL_BUTTON_CLASSES} ${COMPACT_BUTTON_SIZE_CLASSES}`

type SectionErrorNoticeProps = {
  message: string
  onRetry: () => void
}

/* A failed read says what failed and offers the read again, rather than
   rendering the empty screen a successful read of an empty tab would produce. */
export const SectionErrorNotice = ({ message, onRetry }: SectionErrorNoticeProps) => (
  <section className="mx-auto w-full max-w-4xl px-4 py-10">
    <NoticeBanner role="alert" title={message} tone="danger" />
    <button className={RETRY_BUTTON_CLASSES} onClick={onRetry} type="button">
      Try again
    </button>
  </section>
)
