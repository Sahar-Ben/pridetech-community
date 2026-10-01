/* Phone numbers arrive as people typed them -- `052-265-3289`, `+972 52 265
   3289`, `0522653289` -- and sometimes as the sheet rewrote them: a number
   typed without formatting is stored as a number, which drops its leading
   zero (`522653289`). Links need digits only, and WhatsApp needs the full
   international form without a plus. The community is in Israel, so a local
   number is read as Israeli. */

const ISRAEL_COUNTRY_CODE = '972'

/* Fewer digits than this is not a number anybody can be reached on. */
const MINIMUM_DIGITS = 7

const digitsOf = (value: string): string => value.replace(/\D/g, '')

export const toInternationalDigits = (phone: string | undefined): string | undefined => {
  const trimmed = phone?.trim() ?? ''
  const digits = digitsOf(trimmed)
  if (digits.length < MINIMUM_DIGITS) {
    return undefined
  }
  if (trimmed.startsWith('+')) {
    return digits
  }
  if (digits.startsWith('00')) {
    return digits.slice(2)
  }
  if (digits.startsWith(ISRAEL_COUNTRY_CODE) && digits.length >= 11) {
    return digits
  }
  if (digits.startsWith('0')) {
    return `${ISRAEL_COUNTRY_CODE}${digits.slice(1)}`
  }
  /* A mobile number the sheet stored as a number: nine digits starting 5. */
  if (digits.length === 9 && digits.startsWith('5')) {
    return `${ISRAEL_COUNTRY_CODE}${digits}`
  }
  return digits
}

export const toWhatsAppHref = (phone: string | undefined): string | undefined => {
  const international = toInternationalDigits(phone)
  return international === undefined ? undefined : `https://wa.me/${international}`
}

export const toTelHref = (phone: string | undefined): string | undefined => {
  const international = toInternationalDigits(phone)
  return international === undefined ? undefined : `tel:+${international}`
}
