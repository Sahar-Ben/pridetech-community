const MESSAGES_BY_TYPE: Readonly<Record<string, string>> = {
  popup_closed: 'The Google sign-in window was closed before it finished. Try again.',
  popup_failed_to_open:
    'The browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
  access_denied:
    'Google sign-in was declined. This app needs permission to open the spreadsheet you pick.',
}

const GENERIC_MESSAGE = 'Google sign-in failed.'

export const describeTokenError = ({
  type,
  message,
}: {
  type: string | undefined
  message: string | undefined
}): string => {
  const knownMessage = type === undefined ? undefined : MESSAGES_BY_TYPE[type]
  if (knownMessage !== undefined) {
    return knownMessage
  }
  const detail = [type, message].filter((part) => part !== undefined && part.trim() !== '')
  if (detail.length === 0) {
    return GENERIC_MESSAGE
  }
  return `${GENERIC_MESSAGE} ${detail.join(': ')}`
}
