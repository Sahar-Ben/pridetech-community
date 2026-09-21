import { NoticeBanner } from './NoticeBanner'

type SampleSectionNoticeProps = {
  sectionName: string
}

/* Naming the sections that do read the sheet was a sentence that had to be
   rewritten every time one of them landed, and it was wrong in between. It
   says what is true of the section it is standing on instead. */
export const SampleSectionNotice = ({ sectionName }: SampleSectionNoticeProps) => (
  <NoticeBanner
    detail="Nothing in this section is read from your spreadsheet, and nothing you change here is written to it."
    title={`Sample data: every ${sectionName} below is invented.`}
    tone="warning"
  />
)
