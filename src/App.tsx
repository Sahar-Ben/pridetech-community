import { useMemo } from 'react'
import { CommunityApp } from './app/CommunityApp'
import { ConfigurationErrorScreen } from './app/ConfigurationErrorScreen'
import { buildGoogleAdapters } from './app/googleAdapters'
import { findMissingGoogleConfigKeys } from './config/googleConfig'
import { createSheetsClient } from './sheets/sheetsClient'

export const App = () => {
  const environment = import.meta.env
  const googleAdapters = useMemo(() => buildGoogleAdapters(environment), [environment])

  if (googleAdapters === undefined) {
    return <ConfigurationErrorScreen missingKeys={findMissingGoogleConfigKeys(environment)} />
  }

  return (
    <CommunityApp
      createAccessTokenRequester={googleAdapters.createAccessTokenRequester}
      pickSpreadsheet={googleAdapters.pickSpreadsheet}
      createClient={createSheetsClient}
      deviceLock={googleAdapters.deviceLock}
    />
  )
}
