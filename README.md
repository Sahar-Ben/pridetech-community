# PrideTech Community CRM

A small web app for running the PrideTech community: reviewing membership
applications, browsing members, and running events.

It has no backend and no database. Google Sheets stays the source of truth —
the browser talks to the community's spreadsheet directly, as whoever is
signed in.

## Access

Sign-in is restricted twice over. Google only admits accounts on the OAuth
consent screen's test-user list, before any of this code runs; and the app can
only touch the one file an organiser hands it through the Drive picker, because
the only scope requested is `drive.file`.

**No member data lives in this repository.** It stays in Google Drive.

## Running locally

```bash
npm install
npm run dev
```

Needs a `.env.local` (gitignored) with `VITE_GOOGLE_CLIENT_ID`,
`VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_APP_ID` from a Google Cloud project with
the Sheets, Drive and Picker APIs enabled.

```bash
npm test     # unit tests
npm run lint
npm run build
```

## Why it is built this way

`docs/plans/` holds the design document and the implementation plan, including
the alternatives that were rejected and why. Read those before changing how the
sheet is read or written — several of the rules there exist because of specific
ways real data broke earlier versions.
