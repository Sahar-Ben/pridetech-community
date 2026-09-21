import { useCallback, useState } from 'react'
import type { PickSpreadsheet } from './spreadsheetPicker'
import { describeError } from '../errors/describeError'

const NOTHING_CHOSEN_MESSAGE = 'No spreadsheet was chosen, so nothing changed.'
const PICKER_FAILED_MESSAGE = 'The Google Picker could not be opened.'

export type SpreadsheetPicker = {
  choose: () => void
  message: string | undefined
}

export const useSpreadsheetPicker = ({
  pickSpreadsheet,
  accessToken,
  onPicked,
}: {
  pickSpreadsheet: PickSpreadsheet
  accessToken: string | undefined
  onPicked: (spreadsheetId: string) => void
}): SpreadsheetPicker => {
  const [message, setMessage] = useState<string | undefined>(undefined)

  const choose = useCallback(() => {
    if (accessToken === undefined) {
      return
    }
    setMessage(undefined)
    try {
      pickSpreadsheet({
        accessToken,
        onPicked: (spreadsheetId) => {
          setMessage(undefined)
          onPicked(spreadsheetId)
        },
        onCancelled: () => {
          setMessage(NOTHING_CHOSEN_MESSAGE)
        },
        onError: (failureMessage) => {
          setMessage(failureMessage)
        },
      })
    } catch (error) {
      setMessage(describeError({ error, fallback: PICKER_FAILED_MESSAGE }))
    }
  }, [accessToken, onPicked, pickSpreadsheet])

  return { choose, message }
}
