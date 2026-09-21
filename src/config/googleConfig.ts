export type GoogleConfig = {
  clientId: string
  apiKey: string
  appId: string
}

export type EnvironmentValues = Readonly<Record<string, string | undefined>>

const CLIENT_ID_KEY = 'VITE_GOOGLE_CLIENT_ID'
const API_KEY_KEY = 'VITE_GOOGLE_API_KEY'
const APP_ID_KEY = 'VITE_GOOGLE_APP_ID'

const REQUIRED_KEYS = [CLIENT_ID_KEY, API_KEY_KEY, APP_ID_KEY] as const

const readRequired = ({
  environment,
  key,
}: {
  environment: EnvironmentValues
  key: string
}): string => (environment[key] ?? '').trim()

export const findMissingGoogleConfigKeys = (environment: EnvironmentValues): string[] =>
  REQUIRED_KEYS.filter((key) => readRequired({ environment, key }) === '')

export const parseGoogleConfig = (environment: EnvironmentValues): GoogleConfig | undefined => {
  if (findMissingGoogleConfigKeys(environment).length > 0) {
    return undefined
  }
  return {
    clientId: readRequired({ environment, key: CLIENT_ID_KEY }),
    apiKey: readRequired({ environment, key: API_KEY_KEY }),
    appId: readRequired({ environment, key: APP_ID_KEY }),
  }
}
