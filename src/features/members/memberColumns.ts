/* The header cell and the body cell of a column are written in different
   components, so the width and the viewport it disappears at live here once:
   a column that hid in one place and not the other would shift every row. */
export const MEMBER_COLUMN_CLASSES = {
  name: 'w-full sm:w-[27%]',
  title: 'w-[21%] hidden md:table-cell',
  company: 'w-[18%] hidden sm:table-cell',
  city: 'w-[12%] hidden lg:table-cell',
  gender: 'w-px sm:w-[9%]',
  status: 'w-px pr-4 sm:w-[13%]',
} as const
