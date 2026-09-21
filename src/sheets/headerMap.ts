export type HeaderMap = ReadonlyMap<string, number>

const whitespaceRun = /\s+/g

const normalizeHeader = (header: string): string =>
  header.trim().replace(whitespaceRun, ' ').toLowerCase()

export const buildHeaderMap = (headerRow: readonly string[]): HeaderMap => {
  const headerMap = new Map<string, number>()
  headerRow.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    if (normalized === '') {
      return
    }
    if (headerMap.has(normalized)) {
      return
    }
    headerMap.set(normalized, index)
  })
  return headerMap
}

export const findColumn = ({
  headerMap,
  aliases,
}: {
  headerMap: HeaderMap
  aliases: readonly string[]
}): number | undefined => {
  const matchedHeader = aliases
    .map((alias) => normalizeHeader(alias))
    .find((alias) => headerMap.has(alias))
  if (matchedHeader === undefined) {
    return undefined
  }
  return headerMap.get(matchedHeader)
}
