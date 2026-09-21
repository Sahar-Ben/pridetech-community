const NOTICE_CLASSES =
  'rounded-md border-2 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950'

type SampleSectionNoticeProps = {
  sectionName: string
}

/* Naming the sections that do read the sheet was a sentence that had to be
   rewritten every time one of them landed, and it was wrong in between. It
   says what is true of the section it is standing on instead. */
export const SampleSectionNotice = ({ sectionName }: SampleSectionNoticeProps) => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
      {`Sample data: every ${sectionName} below is invented.`}
    </p>
    <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
      Nothing in this section is read from your spreadsheet, and nothing you change here is
      written to it.
    </p>
  </div>
)
