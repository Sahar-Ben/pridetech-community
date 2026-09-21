import type { Member } from './member'

/* Hebrew, because the directory is mostly Hebrew names and a code-point sort
   gets both scripts wrong at once: it puts every capital letter ahead of every
   lower-case one, so `adi` lands after `Zohar`, and it orders Hebrew by byte.
   The locale is stated rather than left to the reader's machine, so two
   organisers looking at the same 787 people see the same order. The two scripts
   still come out as two blocks, which no collation can avoid. */
const NAME_LOCALE = 'he'

/* Last, not first: a run of blank cells at the top of a 787-row directory reads
   as a broken screen, and these rows are the exception rather than the entry
   point. */
const NAMELESS_ORDER = 1

const compareByName = (earlier: Member, later: Member): number => {
  if (earlier.name === '' || later.name === '') {
    return earlier.name === later.name ? 0 : (earlier.name === '' ? NAMELESS_ORDER : -NAMELESS_ORDER)
  }
  return earlier.name.localeCompare(later.name, NAME_LOCALE)
}

export const sortMembersByName = (members: readonly Member[]): readonly Member[] =>
  members.toSorted(compareByName)
