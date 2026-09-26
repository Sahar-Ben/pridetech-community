/* A1 notation reads `Event sheets!A1` as a broken reference, and every tab this
   app addresses beyond the two original ones has either a space in its name or
   a name somebody else chose: a picked response sheet is named by whoever made
   the Google Form. Quoting is always legal, so the only reason to leave a name
   bare is that `Members!B3` is the spelling the existing ranges and their tests
   already use. */
const BARE_TAB_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

/* `A1!B2` parses, but Sheets is entitled to read a bare `AB12` as a cell, so a
   tab named like a cell reference is quoted whatever else it is made of. */
const CELL_SHAPED_NAME = /^[A-Za-z]{1,3}\d+$/

export const toRangeTabName = (tabName: string): string => {
  if (BARE_TAB_NAME.test(tabName) && !CELL_SHAPED_NAME.test(tabName)) {
    return tabName
  }
  return `'${tabName.replaceAll("'", "''")}'`
}
