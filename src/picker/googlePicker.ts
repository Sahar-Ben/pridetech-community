import type { PickedSpreadsheet, PickSpreadsheet } from './spreadsheetPicker'
import type { GooglePickerResponse } from '../google/googleGlobals'
import { describeError } from '../errors/describeError'

const PICKER_TITLE = 'Choose your PrideTech Dashboard spreadsheet'
const SCRIPT_MISSING_MESSAGE =
  'Google Picker has not loaded yet. Check your connection and reload the page.'
const PICKER_FAILED_MESSAGE = 'The Google Picker could not be opened.'
const NO_FILE_IN_RESPONSE_MESSAGE = 'Google Picker returned no file. Try choosing it again.'

const readPickedSpreadsheets = (response: GooglePickerResponse): readonly PickedSpreadsheet[] =>
  (response.docs ?? []).flatMap((document) =>
    document.id === undefined ? [] : [{ spreadsheetId: document.id, name: document.name }],
  )

export const createGoogleSpreadsheetPicker = ({
  apiKey,
  appId,
}: {
  apiKey: string
  appId: string
}): PickSpreadsheet => {
  return ({ accessToken, title, allowMultiple, onPicked, onPickedAll, onCancelled, onError }) => {
    const gapi = window.gapi
    if (gapi === undefined) {
      onError(SCRIPT_MISSING_MESSAGE)
      return
    }
    gapi.load('picker', () => {
      try {
        const pickerApi = window.google?.picker
        if (pickerApi === undefined) {
          onError(SCRIPT_MISSING_MESSAGE)
          return
        }
        const spreadsheetsView = new pickerApi.DocsView(pickerApi.ViewId.SPREADSHEETS)
        const builder = new pickerApi.PickerBuilder()
        const multiselect = pickerApi.Feature?.MULTISELECT_ENABLED
        if (allowMultiple === true && multiselect !== undefined) {
          builder.enableFeature?.(multiselect)
        }
        const picker = builder
          .addView(spreadsheetsView)
          .setOAuthToken(accessToken)
          .setDeveloperKey(apiKey)
          .setAppId(appId)
          .setTitle(title ?? PICKER_TITLE)
          .setCallback((response) => {
            /* The picker also reports 'loaded' and other lifecycle actions; only a
               pick or a cancel is an answer to the question we asked. */
            if (response.action === pickerApi.Action.CANCEL) {
              onCancelled()
              return
            }
            if (response.action !== pickerApi.Action.PICKED) {
              return
            }
            const spreadsheets = readPickedSpreadsheets(response)
            const [first] = spreadsheets
            if (first === undefined) {
              onError(NO_FILE_IN_RESPONSE_MESSAGE)
              return
            }
            if (allowMultiple === true && onPickedAll !== undefined) {
              onPickedAll(spreadsheets)
              return
            }
            onPicked(first)
          })
          .build()
        picker.setVisible(true)
      } catch (error) {
        onError(describeError({ error, fallback: PICKER_FAILED_MESSAGE }))
      }
    })
  }
}
