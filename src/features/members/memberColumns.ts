/* The header cell and the body cell of a column are written in different
   components, so the width and the viewport it disappears at live here once:
   a column that hid in one place and not the other would shift every row. */
export const MEMBER_COLUMN_CLASSES = {
  name: 'w-[23%]',
  title: 'w-[21%] hidden md:table-cell',
  company: 'w-[20%] hidden sm:table-cell',
  city: 'w-[13%] hidden lg:table-cell',
  gender: 'w-[9%]',
  status: 'w-[14%]',
} as const
