/* The LinkedIn cell is free text typed into a Google Form, so it holds every
   shape a person might paste: a full address, the same address without
   `https://`, a profile path, a bare handle, or a sentence with a link in it.
   Google Sheets turns most of those into working links on its own; an `<a>`
   does not, and a value with no scheme is resolved against this app's own
   address -- `linkedin.com/in/dana` became a page of the app that does not
   exist. This turns the cell into an absolute address, or into nothing when
   there is no address in it to find. */

const URL_IN_TEXT = /(?:https?:\/\/|www\.|(?:[a-z]{2,3}\.)?linkedin\.com\/)\S+/i

const LINKEDIN_HOST_PATH = /^(?:[a-z0-9-]+\.)*linkedin\.com(?:[/?#]|$)/i

const PROFILE_PATH = /^\/?(in|pub|company)\/[^\s/]+/i

/* What LinkedIn allows in a custom profile address, Hebrew letters included,
   since the community writes names in both scripts. */
const BARE_HANDLE = /^@?[\p{L}\p{N}][\p{L}\p{N}._-]{1,99}$/u

/* Punctuation that ends a sentence rather than an address: `see
   linkedin.com/in/dana.` must not open a profile called `dana.`. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"»]+$/

const asAbsolute = (candidate: string): string | undefined => {
  const withScheme = /^https?:\/\//i.test(candidate)
    ? candidate
    : candidate.startsWith('//')
      ? `https:${candidate}`
      : `https://${candidate}`
  try {
    const url = new URL(withScheme)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export const toLinkedInHref = (cell: string | undefined): string | undefined => {
  const value = cell?.trim()
  if (value === undefined || value === '') {
    return undefined
  }

  const embedded = URL_IN_TEXT.exec(value)?.[0]?.replace(TRAILING_PUNCTUATION, '')
  if (embedded !== undefined) {
    return asAbsolute(embedded)
  }

  if (LINKEDIN_HOST_PATH.test(value)) {
    return asAbsolute(value)
  }

  const profilePath = PROFILE_PATH.exec(value)?.[0]
  if (profilePath !== undefined) {
    return asAbsolute(`www.linkedin.com/${profilePath.replace(/^\//, '')}`)
  }

  if (BARE_HANDLE.test(value) && !/^(?:n\/?a|none|no|-+|לא|אין)$/i.test(value)) {
    return asAbsolute(`www.linkedin.com/in/${value.replace(/^@/, '')}`)
  }

  return undefined
}
