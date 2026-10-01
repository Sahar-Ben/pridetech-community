# Working on this repo

PrideTech's community admin: a React + Vite app on GitHub Pages that reads and
writes the community's Google Sheet. Pushing to `main` deploys to the live site,
and the live site writes to real data.

## Before every push

Run all of these and fix anything red, including tests that were already
there; never skip, delete or loosen a test to get green:

```bash
npm run lint
npx tsc -b
npm test           # unit tests
npm run test:e2e   # browser tests on e2e/harness (phone, small phone, desktop)
```

## When adding or changing something

- Add a unit test next to the code for the logic, and extend `e2e/` for
  anything a person sees or taps: a new screen, control, list or flow.
- New data shapes go in `e2e/harness/fixtures.ts`, including the worst case
  (very long unbroken text, Hebrew, blanks).
- Layout rules the e2e suite enforces on every screen: nothing wider than the
  screen, only `main` scrolls, the header and bottom nav stay pinned, every
  `href` is absolute (`https://`, `mailto:`, `tel:`), every control has a name,
  touch targets are at least 44px on a phone.
- Overlays (dialogs, sheets, menus over the page) render through
  `createPortal(…, document.body)` and sit above the nav (`z-50`).
- Free-text from the sheet goes through a normaliser before it becomes a link
  (see `src/app/linkedInUrl.ts`).
- Read `docs/plans/` before changing how the sheet is read or written.
