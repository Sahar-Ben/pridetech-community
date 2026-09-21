import { doesTextMatchSearch } from './searchWords'
import type { Registrant } from './registrant'

const toSearchableText = (registrant: Registrant): string =>
  [registrant.name, registrant.email ?? ''].join(' ')

export const doesRegistrantMatchSearch = ({
  registrant,
  searchText,
}: {
  registrant: Registrant
  searchText: string
}): boolean => doesTextMatchSearch({ text: toSearchableText(registrant), searchText })

export const filterRegistrantsForCheckIn = ({
  registrants,
  searchText,
}: {
  registrants: readonly Registrant[]
  searchText: string
}): readonly Registrant[] =>
  registrants.filter((registrant) => doesRegistrantMatchSearch({ registrant, searchText }))
