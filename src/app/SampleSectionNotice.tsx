const NOTICE_CLASSES =
  'rounded-md border-2 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-600 dark:bg-amber-950'

type SampleSectionNoticeProps = {
  sectionName: string
}

/* Applications now shows real people from the real sheet, so the invented
   sections need to say so where they are, not only where an edit is attempted. */
export const SampleSectionNotice = ({ sectionName }: SampleSectionNoticeProps) => (
  <div className={NOTICE_CLASSES}>
    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
      {`Sample data: every ${sectionName} below is invented.`}
    </p>
    <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
      This section does not read your spreadsheet yet. Only Applications does.
    </p>
  </div>
)
