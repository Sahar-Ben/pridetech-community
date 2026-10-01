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
npm test          # unit tests (vitest, jsdom)
npm run test:e2e  # browser tests (Playwright) on an in-memory sheet
npm run test:all  # both
npm run lint
npm run build
```

`npm run test:e2e` starts `e2e/harness`, the real workspace on fake data built
to break layouts (very long unbroken names and addresses, Hebrew, every shape
of LinkedIn cell), and checks every screen at 390px, 320px and 1280px: nothing
wider than the screen, the header and nav where they belong after scrolling,
links that leave the app, controls with names and thumb-sized targets, no
console errors, and the main flows (search, sort, filter, approve, decline).
The deploy runs it before publishing, and the Checks workflow runs it on every
other branch and pull request. Locally it needs Chromium once:
`npx playwright install chromium`.

## Why it is built this way

`docs/plans/` holds the design document and the implementation plan, including
the alternatives that were rejected and why. Read those before changing how the
sheet is read or written — several of the rules there exist because of specific
ways real data broke earlier versions.
