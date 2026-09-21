import { NOTICE_SURFACE_CLASSES } from '../theme/surfaces'

type NoticeTone = keyof typeof NOTICE_SURFACE_CLASSES

const BANNER_CLASSES = 'rounded-[var(--radius-data)] border-2 px-4 py-3 shadow-data'

type NoticeBannerProps = {
  tone: NoticeTone
  title: string
  detail?: string
  role?: 'alert' | 'status'
}

/* Opaque, two-pixel bordered, and deliberately outside the glass system. These
   are the sentences that stop somebody working from invented data at a real
   door, so they are the one part of the screen that is not allowed to soften
   into the background it sits on. */
export const NoticeBanner = ({ tone, title, detail, role }: NoticeBannerProps) => (
  <div className={`${BANNER_CLASSES} ${NOTICE_SURFACE_CLASSES[tone]}`} role={role}>
    <p className="text-sm font-bold">{title}</p>
    {detail !== undefined && <p className="mt-1 text-sm font-medium">{detail}</p>}
  </div>
)
