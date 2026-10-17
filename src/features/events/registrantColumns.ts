/* Header cell and body cell live in different components, so a column's width
   and the viewport it disappears at are written once: a column that hid in one
   place and not the other would shift every row. */
export const REGISTRANT_COLUMN_CLASSES = {
  name: 'sm:w-[30%]',
  email: 'w-[26%] hidden sm:table-cell',
  company: 'w-[18%] hidden md:table-cell',
  link: 'sm:w-[22%]',
  status: 'sm:w-[18%]',
} as const

/* Below `sm` a person is a card rather than a table row: three narrow columns
   on a phone left a fifth of the width for "Attended" and broke it a letter at
   a time. The table keeps its roles written out, because some screen readers
   stop announcing a table once its parts are no longer displayed as one. */
export const REGISTRANT_TABLE_CLASSES = 'block w-full text-sm sm:table sm:table-fixed'

export const REGISTRANT_HEAD_CLASSES = 'bg-surface-raised max-sm:sr-only'

export const REGISTRANT_BODY_CLASSES = 'block sm:table-row-group'

/* Name and status share the card's first line; who they are in the community
   takes the line under it. */
export const REGISTRANT_ROW_CLASSES =
  'grid grid-cols-[minmax(0,1fr)_auto] border-t border-hairline sm:table-row'

export const REGISTRANT_CARD_PLACEMENT = {
  name: 'max-sm:col-start-1 max-sm:row-start-1 max-sm:pb-1',
  link: 'max-sm:col-span-2 max-sm:row-start-2 max-sm:pt-0',
  status: 'max-sm:col-start-2 max-sm:row-start-1 max-sm:pb-1',
} as const
