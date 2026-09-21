/* Header cell and body cell live in different components, so a column's width
   and the viewport it disappears at are written once: a column that hid in one
   place and not the other would shift every row. */
export const REGISTRANT_COLUMN_CLASSES = {
  name: 'w-[30%]',
  email: 'w-[26%] hidden sm:table-cell',
  company: 'w-[18%] hidden md:table-cell',
  link: 'w-[22%]',
  status: 'w-[18%]',
} as const
