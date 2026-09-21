export type GoogleTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

export type GoogleTokenError = {
  type?: string
  message?: string
}

export type GoogleTokenClient = {
  requestAccessToken: () => void
}

export type GoogleTokenClientConfig = {
  client_id: string
  scope: string
  callback: (response: GoogleTokenResponse) => void
  error_callback: (error: GoogleTokenError) => void
}

export type GooglePickerDocument = {
  id?: string
}

export type GooglePickerResponse = {
  action?: string
  docs?: readonly GooglePickerDocument[]
}

export type GooglePickerBuilder = {
  addView: (view: object) => GooglePickerBuilder
  setOAuthToken: (accessToken: string) => GooglePickerBuilder
  setDeveloperKey: (apiKey: string) => GooglePickerBuilder
  setAppId: (appId: string) => GooglePickerBuilder
  setTitle: (title: string) => GooglePickerBuilder
  setCallback: (callback: (response: GooglePickerResponse) => void) => GooglePickerBuilder
  build: () => { setVisible: (isVisible: boolean) => void }
}

export type GooglePickerNamespace = {
  PickerBuilder: new () => GooglePickerBuilder
  DocsView: new (viewId: string) => object
  ViewId: { SPREADSHEETS: string }
  Action: { PICKED: string; CANCEL: string }
}

export type GoogleGlobal = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient
    }
  }
  picker?: GooglePickerNamespace
}

export type GapiGlobal = {
  load: (libraryName: string, callback: () => void) => void
}

declare global {
  interface Window {
    google?: GoogleGlobal
    gapi?: GapiGlobal
  }
}
