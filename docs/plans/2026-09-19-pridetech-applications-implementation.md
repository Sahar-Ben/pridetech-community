# PrideTech Applications Queue — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the Applications review queue — sign in with Google, read pending applications from
the `Leads` tab, approve one into a `Members` row (carrying every field across and setting gender),
or decline it — deployed to GitHub Pages.

**Architecture:** A React + Vite SPA with no backend. Google Identity Services provides an access
token with the non-sensitive `drive.file` scope; Google Picker selects the Dashboard spreadsheet
once and its file ID is remembered in `localStorage`; all reads and writes go straight to the
Sheets REST API from the browser. Domain logic (header mapping, matching, lead→member conversion)
is pure and unit-tested with no Google involved; the Sheets client is the single boundary and is
faked in every test above it.

**Tech Stack:** TypeScript (strict), React 19, Vite, Vitest, React Testing Library, Tailwind CSS,
Google Identity Services, Google Picker, Sheets API v4, GitHub Actions → GitHub Pages.

**Scope:** Applications only. Events, check-in, reconcile and the dashboard stats are a later plan,
per the build order in `2026-09-19-pridetech-community-crm-design.md`.

---

## Before you start

- **Work on a branch.** The `branch-guard` hook hard-blocks commits on `main`. This is a personal
  repo with no Linear ticket, so the ticket-prefix rule will warn but allow:
  `git checkout -b applications-queue`
- **Every commit needs** a `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer, or
  `coauthored-by-guard` rejects it.
- **`commit-gate` blocks each commit** until the diff is reviewed. Invoke `/dl-diff`, let the user
  pick a tool and approve, then re-run with `APPROVED_BY_USER=1`.
- Commit commands below are written without the trailer and the prefix for readability. Add both.
- **Write `\u{XXXX}`, never `\uXXXX`, in any source file.** The file-writing tooling silently
  converts the four-digit form into the raw character before the bytes reach disk, while the brace
  form survives intact. This fails in the worst direction: a test fixture meant to contain an
  escaped zero-width character ends up containing the literal character, which a later formatter
  or copy-paste can strip — leaving a test that passes while guarding nothing. Verify with
  `LC_ALL=C grep '[^ -~]' <file>` (expect no output), and check the staged blob too via
  `git show :<path>`, not just the working tree. A regex using brace escapes needs the `u` flag.

---

## Task 1: Manual data preparation (user, not Claude)

This is the only task Claude cannot do. It unblocks Task 15 onward; everything before that runs
against fakes, so start the build in parallel.

1. Open the `PrideTech Dashboard` spreadsheet → File → Make a copy → name it
   `PrideTech Dashboard — backup 2026-09-19`. Do not touch it again.
2. On the **`Leads`** tab, add a column to the right of the last form column, header exactly
   `Status`. Leave every cell empty — empty means pending.
3. On the **`Members`** tab, add three columns to the right of `Notes`, headers exactly
   `Status`, `Removal reason`, `Approved at`.
4. On `Members`, delete the blank row 27 so the block is contiguous.
5. Note the Dashboard's spreadsheet ID from its URL — needed in Task 16.

**Verification:** `Leads!A1:Z1` ends with `Status`; `Members!A1:Z1` ends with
`Status`, `Removal reason`, `Approved at`.

---

## Task 2: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`,
  `src/App.tsx`, `src/setupTests.ts`, `.gitignore`

**Step 1: Scaffold**

```bash
cd ~/git/pridetech-community
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2: Configure Vitest and Tailwind**

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pridetech-community/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
```

`src/setupTests.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

**Step 3: Enforce the house TypeScript rules**

In `tsconfig.json` `compilerOptions`, confirm `"strict": true` and add
`"noUncheckedIndexedAccess": true`. Sheet rows are ragged — Google omits trailing empty cells — so
indexing a row must yield `string | undefined`, not `string`. This setting is what forces the code
to handle short rows instead of crashing on them.

**Step 4: Verify the toolchain**

Run: `npm run test`
Expected: "No test files found" (exit 1) — acceptable, it proves Vitest resolves.

Run: `npm run build`
Expected: builds to `dist/`.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react typescript project"
```

*(`no-bulk-staging` blocks `git add -A`. Stage the scaffold files by name, or ask the user to
approve this one bulk add explicitly.)*

---

## Task 3: Header mapping

The single most important pure function. Every RSVP sheet and the Leads tab have differently
worded headers, some blank, some duplicated. This turns a header row into column indices.

**Files:**
- Create: `src/sheets/headerMap.ts`
- Test: `src/sheets/headerMap.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildHeaderMap, findColumn } from './headerMap'

describe('buildHeaderMap', () => {
  it('should map each header to its column index when headers are unique', () => {
    const map = buildHeaderMap(['Timestamp', 'Name', 'Email'])
    expect(map.get('timestamp')).toBe(0)
    expect(map.get('email')).toBe(2)
  })

  it('should match case-insensitively and ignore surrounding whitespace', () => {
    const map = buildHeaderMap(['  TIMESTAMP ', 'arrived'])
    expect(map.get('timestamp')).toBe(0)
    expect(map.get('arrived')).toBe(1)
  })

  it('should keep the first index when a header is duplicated', () => {
    const map = buildHeaderMap(['Waiting', 'Phone', 'Waiting', 'Phone'])
    expect(map.get('waiting')).toBe(0)
    expect(map.get('phone')).toBe(1)
  })

  it('should skip blank headers without shifting later indices', () => {
    const map = buildHeaderMap(['', 'Full Name', 'Email'])
    expect(map.get('full name')).toBe(1)
    expect(map.get('email')).toBe(2)
  })
})

describe('findColumn', () => {
  const aliases = ['email', 'your email', 'e-mail']

  it('should find the column by any of its aliases', () => {
    const map = buildHeaderMap(['Timestamp', 'Name', 'Your Email'])
    expect(findColumn({ headerMap: map, aliases })).toBe(2)
  })

  it('should return undefined when no alias is present', () => {
    const map = buildHeaderMap(['Timestamp', 'Name', 'arrived'])
    expect(findColumn({ headerMap: map, aliases })).toBeUndefined()
  })
})
```

The blank-header case is `Microsoft Pride RSVP`, the duplicate case is `Playtika`, and the
undefined case is the five meetup sheets with no email. These are not hypotheticals.

**Step 2: Run to verify failure**

Run: `npx vitest run src/sheets/headerMap.test.ts`
Expected: FAIL — "Failed to resolve import './headerMap'"

**Step 3: Implement**

```ts
export type HeaderMap = ReadonlyMap<string, number>

const normalizeHeader = (header: string): string => {
  return header.trim().toLowerCase()
}

export const buildHeaderMap = (headerRow: readonly string[]): HeaderMap => {
  const map = new Map<string, number>()
  headerRow.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    if (normalized === '') {
      return
    }
    if (map.has(normalized)) {
      return
    }
    map.set(normalized, index)
  })
  return map
}

export const findColumn = ({
  headerMap,
  aliases,
}: {
  headerMap: HeaderMap
  aliases: readonly string[]
}): number | undefined => {
  for (const alias of aliases) {
    const index = headerMap.get(normalizeHeader(alias))
    if (index !== undefined) {
      return index
    }
  }
  return undefined
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/sheets/headerMap.test.ts`
Expected: PASS, 6 tests

**Step 5: Commit**

```bash
git add src/sheets/headerMap.ts src/sheets/headerMap.test.ts
git commit -m "feat(sheets): map sheet headers to column indices"
```

---

## Task 4: Column aliases

**Files:**
- Create: `src/sheets/columnAliases.ts`
- Test: `src/sheets/columnAliases.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildHeaderMap, findColumn } from './headerMap'
import { COLUMN_ALIASES } from './columnAliases'

describe('COLUMN_ALIASES', () => {
  it('should find email across every wording used by the real forms', () => {
    const headerRows = [
      ['Timestamp', 'Name', 'Email'],
      ['Timestamp', 'Name', 'Your Email'],
      ['Timestamp', 'Name', 'E-Mail'],
    ]
    headerRows.forEach((row) => {
      const column = findColumn({ headerMap: buildHeaderMap(row), aliases: COLUMN_ALIASES.email })
      expect(column).toBe(2)
    })
  })

  it('should find company across every wording used by the real forms', () => {
    const headerRows = [
      ['Company'],
      ['Your Company'],
      ['Current Employer / Organization / Company'],
      ['Current Employer / Organization'],
    ]
    headerRows.forEach((row) => {
      const column = findColumn({ headerMap: buildHeaderMap(row), aliases: COLUMN_ALIASES.company })
      expect(column).toBe(0)
    })
  })

  it('should not treat "Arrived to the bus" as an attendance column', () => {
    const map = buildHeaderMap(['Arrived to the bus'])
    expect(findColumn({ headerMap: map, aliases: COLUMN_ALIASES.arrived })).toBeUndefined()
  })
})
```

That last test is the Playtika trap: the column is shuttle logistics, and mapping it to attendance
would mark bus passengers as the only attendees.

**Step 2: Run to verify failure**

Run: `npx vitest run src/sheets/columnAliases.test.ts`
Expected: FAIL — cannot resolve `./columnAliases`

**Step 3: Implement**

```ts
export const COLUMN_ALIASES = {
  timestamp: ['timestamp'],
  name: ['name', 'full name'],
  jobTitle: ['job title', 'your job title', 'current job title', 'title'],
  company: [
    'company',
    'your company',
    'current employer / organization / company',
    'current employer / organization',
  ],
  email: ['email', 'your email', 'e-mail', 'mail'],
  phone: ['phone', 'phone number'],
  linkedIn: ['linkedin', 'linkedin profile (link)', 'linkedin profile'],
  city: ['city', 'which city do you currently live in?'],
  interests: ['interests', 'please select your areas of interest (you can choose multiple)'],
  status: ['status'],
  arrived: ['arrived'],
} as const satisfies Record<string, readonly string[]>
```

`arrived` deliberately excludes `arrived to the bus` — an exact-alias match, never a substring one.

**Step 4: Run to verify pass**

Run: `npx vitest run src/sheets/columnAliases.test.ts`
Expected: PASS, 3 tests

**Step 5: Commit**

```bash
git add src/sheets/columnAliases.ts src/sheets/columnAliases.test.ts
git commit -m "feat(sheets): define column aliases for real form wordings"
```

---

## Task 5: Row reading helper

Sheets omits trailing empty cells, so a row can be shorter than its header row. Every read goes
through this.

**Files:**
- Create: `src/sheets/readCell.ts`
- Test: `src/sheets/readCell.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { readCell } from './readCell'

describe('readCell', () => {
  it('should return the trimmed value at the column', () => {
    expect(readCell({ row: ['a', '  b  '], column: 1 })).toBe('b')
  })

  it('should return undefined when the column is beyond the end of a short row', () => {
    expect(readCell({ row: ['a'], column: 5 })).toBeUndefined()
  })

  it('should return undefined when the column index is undefined', () => {
    expect(readCell({ row: ['a'], column: undefined })).toBeUndefined()
  })

  it('should return undefined for a cell containing only whitespace', () => {
    expect(readCell({ row: ['a', '   '], column: 1 })).toBeUndefined()
  })
})
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/sheets/readCell.test.ts`
Expected: FAIL — cannot resolve `./readCell`

**Step 3: Implement**

```ts
export const readCell = ({
  row,
  column,
}: {
  row: readonly string[]
  column: number | undefined
}): string | undefined => {
  if (column === undefined) {
    return undefined
  }
  const value = row[column]
  if (value === undefined) {
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return undefined
  }
  return trimmed
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/sheets/readCell.test.ts`
Expected: PASS, 4 tests

**Step 5: Commit**

```bash
git add src/sheets/readCell.ts src/sheets/readCell.test.ts
git commit -m "feat(sheets): read cells safely from ragged rows"
```

---

## Task 6: Lead parsing

**Files:**
- Create: `src/features/applications/lead.ts`, `src/features/applications/parseLeads.ts`
- Test: `src/features/applications/parseLeads.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { parseLeads } from './parseLeads'

const HEADER_ROW = [
  'Timestamp', 'Name', 'Job Title', 'Company',
  'LinkedIn Profile (Link)', 'E-Mail', 'Phone Number',
  'Which city do you currently live in?',
  'Please select your areas of interest (you can choose multiple)',
  'Status',
]

describe('parseLeads', () => {
  it('should parse a complete row into a lead', () => {
    const [lead] = parseLeads({
      rows: [HEADER_ROW, [
        '3/8/2025 14:25:20', 'Matan Kaufman', 'Director of Marketing', 'Investing.com',
        'https://linkedin.com/in/matan', 'Matankau@gmail.com', '972542353073',
        'Tel Aviv', 'AI, Marketing', '',
      ]],
    })
    expect(lead).toEqual({
      rowNumber: 2,
      name: 'Matan Kaufman',
      jobTitle: 'Director of Marketing',
      company: 'Investing.com',
      linkedIn: 'https://linkedin.com/in/matan',
      email: 'matankau@gmail.com',
      phone: '972542353073',
      city: 'Tel Aviv',
      interests: 'AI, Marketing',
      status: 'pending',
    })
  })

  it('should lowercase the email so matching is case-insensitive', () => {
    const [lead] = parseLeads({
      rows: [HEADER_ROW, ['t', 'A', 'B', 'C', 'D', 'MiXeD@Example.COM', '', '', '', '']],
    })
    expect(lead?.email).toBe('mixed@example.com')
  })

  it('should treat an empty Status cell as pending', () => {
    const [lead] = parseLeads({ rows: [HEADER_ROW, ['t', 'A', '', '', '', 'a@b.com']] })
    expect(lead?.status).toBe('pending')
  })

  it('should read Approved and Declined statuses', () => {
    const leads = parseLeads({
      rows: [
        HEADER_ROW,
        ['t', 'A', '', '', '', 'a@b.com', '', '', '', 'Approved'],
        ['t', 'B', '', '', '', 'b@b.com', '', '', '', 'Declined'],
      ],
    })
    expect(leads.map((lead) => lead.status)).toEqual(['approved', 'declined'])
  })

  it('should give each lead its 1-based sheet row number so writes target the right row', () => {
    const leads = parseLeads({
      rows: [HEADER_ROW, ['t', 'A', '', '', '', 'a@b.com'], ['t', 'B', '', '', '', 'b@b.com']],
    })
    expect(leads.map((lead) => lead.rowNumber)).toEqual([2, 3])
  })

  it('should skip rows with no email, since they cannot be matched or contacted', () => {
    const leads = parseLeads({ rows: [HEADER_ROW, ['t', 'Nameless', '', '', '', '']] })
    expect(leads).toEqual([])
  })

  it('should return an empty list when the sheet has only a header row', () => {
    expect(parseLeads({ rows: [HEADER_ROW] })).toEqual([])
  })

  it('should throw when the sheet has no email column at all, rather than silently returning nothing', () => {
    const rows = [['Timestamp', 'Name', 'Company'], ['t', 'Dana', 'Salted Mind']]
    expect(() => parseLeads({ rows })).toThrow(/no email column/i)
  })
})
```

`rowNumber` matters: approving writes `Status` back to that exact row, and an off-by-one would
mark the wrong person approved.

**Step 2: Run to verify failure**

Run: `npx vitest run src/features/applications/parseLeads.test.ts`
Expected: FAIL — cannot resolve `./parseLeads`

**Step 3: Implement**

`src/features/applications/lead.ts`:

```ts
export type LeadStatus = 'pending' | 'approved' | 'declined'

export type Lead = {
  rowNumber: number
  name: string | undefined
  jobTitle: string | undefined
  company: string | undefined
  linkedIn: string | undefined
  email: string
  phone: string | undefined
  city: string | undefined
  interests: string | undefined
  status: LeadStatus
}
```

`src/features/applications/parseLeads.ts`:

```ts
import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'
import type { Lead, LeadStatus } from './lead'

const HEADER_ROW_COUNT = 1

const parseStatus = (value: string | undefined): LeadStatus => {
  const normalized = value?.toLowerCase()
  if (normalized === 'approved') {
    return 'approved'
  }
  if (normalized === 'declined') {
    return 'declined'
  }
  return 'pending'
}

export const parseLeads = ({ rows }: { rows: readonly (readonly string[])[] }): Lead[] => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    return []
  }
  const headerMap = buildHeaderMap(headerRow)
  const columnOf = (aliases: readonly string[]): number | undefined => {
    return findColumn({ headerMap, aliases })
  }
  const emailColumn = columnOf(COLUMN_ALIASES.email)
  if (emailColumn === undefined) {
    throw new Error('The Leads tab has no email column — check its header row')
  }

  return dataRows.flatMap((row, index) => {
    const email = readCell({ row, column: emailColumn })
    if (email === undefined) {
      return []
    }
    return [{
      rowNumber: index + HEADER_ROW_COUNT + 1,
      name: readCell({ row, column: columnOf(COLUMN_ALIASES.name) }),
      jobTitle: readCell({ row, column: columnOf(COLUMN_ALIASES.jobTitle) }),
      company: readCell({ row, column: columnOf(COLUMN_ALIASES.company) }),
      linkedIn: readCell({ row, column: columnOf(COLUMN_ALIASES.linkedIn) }),
      email: email.toLowerCase(),
      phone: readCell({ row, column: columnOf(COLUMN_ALIASES.phone) }),
      city: readCell({ row, column: columnOf(COLUMN_ALIASES.city) }),
      interests: readCell({ row, column: columnOf(COLUMN_ALIASES.interests) }),
      status: parseStatus(readCell({ row, column: columnOf(COLUMN_ALIASES.status) })),
    }]
  })
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/features/applications/parseLeads.test.ts`
Expected: PASS, 7 tests

**Step 5: Commit**

```bash
git add src/features/applications/lead.ts src/features/applications/parseLeads.ts src/features/applications/parseLeads.test.ts
git commit -m "feat(applications): parse leads from the Leads tab"
```

---

## Task 7: Converting an approved lead into a member row

**Files:**
- Create: `src/features/applications/buildMemberRow.ts`
- Test: `src/features/applications/buildMemberRow.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { buildMemberRow } from './buildMemberRow'
import type { Lead } from './lead'

const MEMBERS_HEADER_ROW = [
  'Name', 'Company', 'Title', 'Gender', 'Mail', 'Informed for membership', 'Meetup',
  'Phone', 'City', 'LinkedIn', 'Interests', 'Shirt Size', 'Notes',
  'Status', 'Removal reason', 'Approved at',
]

const lead: Lead = {
  rowNumber: 5,
  name: 'Hadas Almog',
  jobTitle: 'Chief people officer',
  company: 'Cloudinary',
  linkedIn: 'https://linkedin.com/in/hadas',
  email: 'hadas.almog@cloudinary.com',
  phone: '0501234567',
  city: 'Tel Aviv',
  interests: 'AI, People',
  status: 'pending',
}

describe('buildMemberRow', () => {
  it('should place every carried field under its matching Members header', () => {
    const row = buildMemberRow({
      lead,
      gender: 'F',
      membersHeaderRow: MEMBERS_HEADER_ROW,
      approvedAt: '2026-09-19',
    })
    expect(row[0]).toBe('Hadas Almog')
    expect(row[1]).toBe('Cloudinary')
    expect(row[2]).toBe('Chief people officer')
    expect(row[3]).toBe('F')
    expect(row[4]).toBe('hadas.almog@cloudinary.com')
    expect(row[7]).toBe('0501234567')
    expect(row[8]).toBe('Tel Aviv')
    expect(row[9]).toBe('https://linkedin.com/in/hadas')
    expect(row[10]).toBe('AI, People')
    expect(row[13]).toBe('Active')
    expect(row[15]).toBe('2026-09-19')
  })

  it('should leave columns it does not own untouched', () => {
    const row = buildMemberRow({
      lead, gender: 'F', membersHeaderRow: MEMBERS_HEADER_ROW, approvedAt: '2026-09-19',
    })
    expect(row[11]).toBe('')
    expect(row[12]).toBe('')
    expect(row[14]).toBe('')
  })

  it('should write an empty gender cell rather than a guess when gender is unknown', () => {
    const row = buildMemberRow({
      lead, gender: 'unknown', membersHeaderRow: MEMBERS_HEADER_ROW, approvedAt: '2026-09-19',
    })
    expect(row[3]).toBe('')
  })

  it('should produce a row exactly as long as the header row', () => {
    const row = buildMemberRow({
      lead, gender: 'M', membersHeaderRow: MEMBERS_HEADER_ROW, approvedAt: '2026-09-19',
    })
    expect(row).toHaveLength(MEMBERS_HEADER_ROW.length)
  })

  it('should survive a Members tab whose columns have been reordered', () => {
    const reordered = ['Mail', 'Name', 'Gender', 'Status']
    const row = buildMemberRow({
      lead, gender: 'F', membersHeaderRow: reordered, approvedAt: '2026-09-19',
    })
    expect(row).toEqual(['hadas.almog@cloudinary.com', 'Hadas Almog', 'F', 'Active'])
  })
})
```

The reordering test is the point of the whole function: it writes by header name, never by a
hard-coded position, so someone inserting a column in the sheet cannot silently corrupt writes.

**Two corrections to the implementation sketch below, both about silent failure.** The `write`
helper as drafted returns early when a header is absent, so renaming a Members column would make
approval quietly write a row with that field blank — no error, no sign, and nobody notices until
someone looks for a LinkedIn URL that was never saved. Instead, resolve each target through
`findColumn` and `COLUMN_ALIASES` rather than a bare `headerMap.get`, and collect every required
target that resolves to nothing; if the list is non-empty, throw naming them. Add a test that a
Members tab missing its `Mail` column throws rather than appending a row with no email.

`Gender` has no alias group — `COLUMN_ALIASES` defines only the eleven the plan specified, and
Members also carries `Gender`, `Informed for membership`, `Meetup` and `Shirt Size`. Add a
`gender: ['gender']` group as part of this task, since this is the first consumer that needs it.
The other three are written by hand and need none.

**Step 2: Run to verify failure**

Run: `npx vitest run src/features/applications/buildMemberRow.test.ts`
Expected: FAIL — cannot resolve `./buildMemberRow`

**Step 3: Implement**

```ts
import { buildHeaderMap } from '../../sheets/headerMap'
import type { Lead } from './lead'

export type Gender = 'M' | 'F' | 'unknown'

const genderCell = (gender: Gender): string => {
  if (gender === 'unknown') {
    return ''
  }
  return gender
}

export const buildMemberRow = ({
  lead,
  gender,
  membersHeaderRow,
  approvedAt,
}: {
  lead: Lead
  gender: Gender
  membersHeaderRow: readonly string[]
  approvedAt: string
}): string[] => {
  const headerMap = buildHeaderMap(membersHeaderRow)
  const row: string[] = new Array<string>(membersHeaderRow.length).fill('')

  const write = (header: string, value: string | undefined): void => {
    const column = headerMap.get(header)
    if (column === undefined || value === undefined) {
      return
    }
    row[column] = value
  }

  write('name', lead.name)
  write('company', lead.company)
  write('title', lead.jobTitle)
  write('gender', genderCell(gender))
  write('mail', lead.email)
  write('phone', lead.phone)
  write('city', lead.city)
  write('linkedin', lead.linkedIn)
  write('interests', lead.interests)
  write('status', 'Active')
  write('approved at', approvedAt)

  return row
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/features/applications/buildMemberRow.test.ts`
Expected: PASS, 5 tests

**Step 5: Commit**

```bash
git add src/features/applications/buildMemberRow.ts src/features/applications/buildMemberRow.test.ts
git commit -m "feat(applications): build a member row from an approved lead"
```

---

## Task 8: Duplicate detection

Approving someone who is already a member would create a second row and double every count they
appear in.

**Files:**
- Create: `src/features/applications/findExistingMember.ts`
- Test: `src/features/applications/findExistingMember.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { findExistingMember } from './findExistingMember'

const rows = [
  ['Name', 'Company', 'Title', 'Gender', 'Mail'],
  ['Hadas Almog', 'Cloudinary', 'CPO', 'F', 'Hadas.almog@cloudinary.com'],
  ['Omer Gerson', 'Playtika', 'VP', 'M', 'omer.gerson@gmail.com'],
]

describe('findExistingMember', () => {
  it('should find a member whose email differs only by case', () => {
    const match = findExistingMember({ rows, email: 'hadas.almog@cloudinary.com' })
    expect(match?.name).toBe('Hadas Almog')
  })

  it('should return undefined when nobody has that email', () => {
    expect(findExistingMember({ rows, email: 'nobody@example.com' })).toBeUndefined()
  })

  it('should ignore surrounding whitespace in the stored email', () => {
    const padded = [rows[0] ?? [], ['X', '', '', '', '  x@y.com ']]
    expect(findExistingMember({ rows: padded, email: 'x@y.com' })?.name).toBe('X')
  })
})
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/features/applications/findExistingMember.test.ts`
Expected: FAIL — cannot resolve `./findExistingMember`

**Step 3: Implement**

```ts
import { COLUMN_ALIASES } from '../../sheets/columnAliases'
import { buildHeaderMap, findColumn } from '../../sheets/headerMap'
import { readCell } from '../../sheets/readCell'

export type ExistingMember = {
  rowNumber: number
  name: string | undefined
}

export const findExistingMember = ({
  rows,
  email,
}: {
  rows: readonly (readonly string[])[]
  email: string
}): ExistingMember | undefined => {
  const [headerRow, ...dataRows] = rows
  if (headerRow === undefined) {
    return undefined
  }
  const headerMap = buildHeaderMap(headerRow)
  const emailColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.email })
  const nameColumn = findColumn({ headerMap, aliases: COLUMN_ALIASES.name })
  const wanted = email.trim().toLowerCase()

  const index = dataRows.findIndex((row) => {
    return readCell({ row, column: emailColumn })?.toLowerCase() === wanted
  })
  if (index === -1) {
    return undefined
  }
  const matched = dataRows[index]
  if (matched === undefined) {
    return undefined
  }
  return { rowNumber: index + 2, name: readCell({ row: matched, column: nameColumn }) }
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/features/applications/findExistingMember.test.ts`
Expected: PASS, 3 tests

**Step 5: Commit**

```bash
git add src/features/applications/findExistingMember.ts src/features/applications/findExistingMember.test.ts
git commit -m "feat(applications): detect leads who are already members"
```

---

## Task 9: The Sheets client

The one boundary to Google. Everything above it is faked in tests; this is tested against a fake
`fetch`.

**Files:**
- Create: `src/sheets/sheetsClient.ts`
- Test: `src/sheets/sheetsClient.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { createSheetsClient } from './sheetsClient'

const okResponse = (body: unknown): Response => {
  return { ok: true, status: 200, json: async () => body } as Response
}

describe('createSheetsClient', () => {
  it('should request the named range with a bearer token', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(okResponse({ values: [['a']] }))
    const client = createSheetsClient({
      spreadsheetId: 'sheet-1', getAccessToken: () => 'token-1', fetchImpl: fetchSpy,
    })

    await client.readRange({ range: 'Leads!A1:Z' })

    const [url, options] = fetchSpy.mock.calls[0] ?? []
    expect(url).toContain('/v4/spreadsheets/sheet-1/values/Leads!A1%3AZ')
    expect(options?.headers?.Authorization).toBe('Bearer token-1')
  })

  it('should return an empty array when the range holds no values', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's', getAccessToken: () => 't',
      fetchImpl: vi.fn().mockResolvedValue(okResponse({})),
    })
    expect(await client.readRange({ range: 'Leads!A1:Z' })).toEqual([])
  })

  it('should append a row with USER_ENTERED so dates and links stay usable in the sheet', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(okResponse({}))
    const client = createSheetsClient({
      spreadsheetId: 's', getAccessToken: () => 't', fetchImpl: fetchSpy,
    })

    await client.appendRow({ range: 'Members!A:Z', values: ['a', 'b'] })

    const [url, options] = fetchSpy.mock.calls[0] ?? []
    expect(url).toContain(':append')
    expect(url).toContain('valueInputOption=USER_ENTERED')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({ values: [['a', 'b']] })
  })

  it('should throw a message naming the range when the API rejects the call', async () => {
    const client = createSheetsClient({
      spreadsheetId: 's', getAccessToken: () => 't',
      fetchImpl: vi.fn().mockResolvedValue({
        ok: false, status: 403,
        json: async () => ({ error: { message: 'Caller lacks permission' } }),
      } as Response),
    })

    await expect(client.readRange({ range: 'Leads!A1:Z' })).rejects.toThrow(
      /Leads!A1:Z.*403.*Caller lacks permission/,
    )
  })
})
```

The error test matters more than it looks: a `drive.file` token that has not been granted this
particular file fails with exactly this 403, and a bare "request failed" would send the next
person debugging in the wrong direction.

Two details in `readRange` are load-bearing rather than incidental. `valueRenderOption` is pinned
explicitly even though `FORMATTED_VALUE` is the API default: under `UNFORMATTED_VALUE` the API
returns real JSON numbers, booleans and serial-number dates, and every downstream `.trim()` would
throw at runtime with nothing in the type system catching it, because rows are typed as strings at
this boundary. The `String(cell)` coercion is the belt to that braces — the response is `unknown[][]`
until this function says otherwise. Add a test that a numeric cell arrives as a string.

The null guard is not ceremony: `String(null)` is `"null"` and `String(undefined)` is `"undefined"`,
both non-empty strings that would survive `readCell` and be written into the Members sheet as real
values. Test that a null cell becomes `''`, not `"null"`.

**Step 2: Run to verify failure**

Run: `npx vitest run src/sheets/sheetsClient.test.ts`
Expected: FAIL — cannot resolve `./sheetsClient`

**Step 3: Implement**

```ts
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export type SheetsClient = {
  readRange: (options: { range: string }) => Promise<string[][]>
  appendRow: (options: { range: string; values: readonly string[] }) => Promise<void>
  updateCell: (options: { range: string; value: string }) => Promise<void>
}

type ErrorBody = { error?: { message?: string } }

const failureMessage = async ({
  response,
  range,
}: {
  response: Response
  range: string
}): Promise<string> => {
  const body = (await response.json().catch(() => ({}))) as ErrorBody
  const detail = body.error?.message ?? 'no detail'
  return `Sheets request for ${range} failed: ${response.status} ${detail}`
}

export const createSheetsClient = ({
  spreadsheetId,
  getAccessToken,
  fetchImpl = fetch,
}: {
  spreadsheetId: string
  getAccessToken: () => string
  fetchImpl?: typeof fetch
}): SheetsClient => {
  const request = async ({
    range,
    path,
    method,
    body,
  }: {
    range: string
    path: string
    method: string
    body?: unknown
  }): Promise<unknown> => {
    const response = await fetchImpl(`${SHEETS_API_BASE}/${spreadsheetId}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(await failureMessage({ response, range }))
    }
    return await response.json()
  }

  return {
    readRange: async ({ range }) => {
      const body = await request({
        range,
        method: 'GET',
        path: `/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`,
      })
      const values = (body as { values?: unknown[][] }).values
      if (values === undefined) {
        return []
      }
      return values.map((row) => {
        return row.map((cell) => {
          if (cell === null || cell === undefined) {
            return ''
          }
          return String(cell)
        })
      })
    },

    appendRow: async ({ range, values }) => {
      await request({
        range,
        method: 'POST',
        path: `/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        body: { values: [values] },
      })
    },

    updateCell: async ({ range, value }) => {
      await request({
        range,
        method: 'PUT',
        path: `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        body: { values: [[value]] },
      })
    },
  }
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/sheets/sheetsClient.test.ts`
Expected: PASS, 4 tests

**Step 5: Commit**

```bash
git add src/sheets/sheetsClient.ts src/sheets/sheetsClient.test.ts
git commit -m "feat(sheets): add a typed sheets api client"
```

---

## Task 10: The approve use case

**Files:**
- Create: `src/features/applications/approveLead.ts`
- Test: `src/features/applications/approveLead.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from 'vitest'
import { approveLead } from './approveLead'
import type { SheetsClient } from '../../sheets/sheetsClient'
import type { Lead } from './lead'

const lead: Lead = {
  rowNumber: 4, name: 'Dana Maman', jobTitle: 'Founder', company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana', email: 'dana@saltedmind.co',
  phone: '050', city: 'Tel Aviv', interests: 'AI', status: 'pending',
}

const membersRows = [['Name', 'Company', 'Title', 'Gender', 'Mail', 'Status']]

const fakeClient = (overrides: Partial<SheetsClient> = {}): SheetsClient => {
  return {
    readRange: vi.fn().mockResolvedValue(membersRows),
    appendRow: vi.fn().mockResolvedValue(undefined),
    updateCell: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('approveLead', () => {
  it('should append the member before marking the lead approved', async () => {
    const order: string[] = []
    const client = fakeClient({
      appendRow: vi.fn(async () => { order.push('append') }),
      updateCell: vi.fn(async () => { order.push('update') }),
    })

    await approveLead({ client, lead, gender: 'F', statusColumnLetter: 'J', approvedAt: '2026-09-19' })

    expect(order).toEqual(['append', 'update'])
  })

  it('should mark the lead approved in its own row', async () => {
    const client = fakeClient()
    await approveLead({ client, lead, gender: 'F', statusColumnLetter: 'J', approvedAt: '2026-09-19' })
    expect(client.updateCell).toHaveBeenCalledWith({ range: 'Leads!J4', value: 'Approved' })
  })

  it('should not mark the lead approved when appending the member fails', async () => {
    const client = fakeClient({ appendRow: vi.fn().mockRejectedValue(new Error('quota')) })

    await expect(
      approveLead({ client, lead, gender: 'F', statusColumnLetter: 'J', approvedAt: '2026-09-19' }),
    ).rejects.toThrow('quota')

    expect(client.updateCell).not.toHaveBeenCalled()
  })

  it('should refuse to approve someone who is already a member', async () => {
    const client = fakeClient({
      readRange: vi.fn().mockResolvedValue([
        ['Name', 'Mail'], ['Dana Maman', 'dana@saltedmind.co'],
      ]),
    })

    await expect(
      approveLead({ client, lead, gender: 'F', statusColumnLetter: 'J', approvedAt: '2026-09-19' }),
    ).rejects.toThrow(/already a member/)

    expect(client.appendRow).not.toHaveBeenCalled()
  })
})
```

The ordering and rollback tests encode the failure that actually matters. There are no transactions
here: if the lead were marked approved first and the append then failed, the person would be
invisible in both the queue and the member list. Append first means the worst case is a duplicate
you can see, not a person who vanished.

**Step 2: Run to verify failure**

Run: `npx vitest run src/features/applications/approveLead.test.ts`
Expected: FAIL — cannot resolve `./approveLead`

**Step 3: Implement**

```ts
import type { SheetsClient } from '../../sheets/sheetsClient'
import { buildMemberRow, type Gender } from './buildMemberRow'
import { findExistingMember } from './findExistingMember'
import type { Lead } from './lead'

const MEMBERS_RANGE = 'Members!A1:Z'
const MEMBERS_APPEND_RANGE = 'Members!A:Z'

export const approveLead = async ({
  client,
  lead,
  gender,
  statusColumnLetter,
  approvedAt,
}: {
  client: SheetsClient
  lead: Lead
  gender: Gender
  statusColumnLetter: string
  approvedAt: string
}): Promise<void> => {
  const membersRows = await client.readRange({ range: MEMBERS_RANGE })

  const existing = findExistingMember({ rows: membersRows, email: lead.email })
  if (existing !== undefined) {
    throw new Error(`${lead.email} is already a member (row ${existing.rowNumber})`)
  }

  const [membersHeaderRow] = membersRows
  if (membersHeaderRow === undefined) {
    throw new Error('The Members tab has no header row')
  }

  await client.appendRow({
    range: MEMBERS_APPEND_RANGE,
    values: buildMemberRow({ lead, gender, membersHeaderRow, approvedAt }),
  })

  await client.updateCell({
    range: `Leads!${statusColumnLetter}${lead.rowNumber}`,
    value: 'Approved',
  })
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/features/applications/approveLead.test.ts`
Expected: PASS, 4 tests

**Step 5: Commit**

```bash
git add src/features/applications/approveLead.ts src/features/applications/approveLead.test.ts
git commit -m "feat(applications): approve a lead into a member row"
```

---

## Task 11: The decline use case

**Files:**
- Create: `src/features/applications/declineLead.ts`
- Test: `src/features/applications/declineLead.test.ts`

Mirror Task 10 with a single `updateCell` writing `Declined`, and a test that nothing is appended
to Members. Same shape, four steps, then commit:

```bash
git commit -m "feat(applications): decline a lead"
```

---

## Task 12: Column letter helper

`approveLead` needs the `Status` column as a letter. Deriving it from the header map keeps the
sheet reorderable.

**Files:**
- Create: `src/sheets/columnLetter.ts`
- Test: `src/sheets/columnLetter.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { toColumnLetter } from './columnLetter'

describe('toColumnLetter', () => {
  it('should convert the first column to A', () => {
    expect(toColumnLetter(0)).toBe('A')
  })

  it('should convert the 26th column to Z', () => {
    expect(toColumnLetter(25)).toBe('Z')
  })

  it('should convert the 27th column to AA', () => {
    expect(toColumnLetter(26)).toBe('AA')
  })

  it('should convert the 28th column to AB', () => {
    expect(toColumnLetter(27)).toBe('AB')
  })
})
```

The Leads tab has nine form columns plus `Status`, so it stays single-letter today — but the
application form gains questions over time, and the AA boundary is where naive implementations
break.

**Step 2–4:** Implement with a standard bijective base-26 loop, verify PASS.

**Step 5: Commit**

```bash
git commit -m "feat(sheets): convert column indices to A1 letters"
```

---

## Task 13: The applications list component

**Files:**
- Create: `src/features/applications/ApplicationsQueue.tsx`
- Test: `src/features/applications/ApplicationsQueue.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationsQueue } from './ApplicationsQueue'
import type { Lead } from './lead'

const pendingLead = (overrides: Partial<Lead> = {}): Lead => ({
  rowNumber: 2, name: 'Dana Maman', jobTitle: 'Founder', company: 'Salted Mind',
  linkedIn: 'https://linkedin.com/in/dana', email: 'dana@saltedmind.co',
  phone: '050', city: 'Tel Aviv', interests: 'AI', status: 'pending', ...overrides,
})

describe('ApplicationsQueue', () => {
  it('should show each pending applicant with their title and company', () => {
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByText('Dana Maman')).toBeInTheDocument()
    expect(screen.getByText(/Founder/)).toBeInTheDocument()
    expect(screen.getByText(/Salted Mind/)).toBeInTheDocument()
  })

  it('should link to the applicant LinkedIn profile, since gender is decided from it', () => {
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href', 'https://linkedin.com/in/dana',
    )
  })

  it('should hide applications that have already been decided', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead(), pendingLead({ name: 'Old', status: 'approved' })]}
        onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    expect(screen.queryByText('Old')).not.toBeInTheDocument()
  })

  it('should show oldest applications first, since they have waited longest', () => {
    render(
      <ApplicationsQueue
        leads={[pendingLead({ rowNumber: 9, name: 'Newer' }), pendingLead({ rowNumber: 2, name: 'Older' })]}
        onApprove={vi.fn()} onDecline={vi.fn()}
      />,
    )
    const names = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)
    expect(names).toEqual(['Older', 'Newer'])
  })

  it('should approve with the gender chosen by the reviewer', async () => {
    const onApprove = vi.fn()
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={onApprove} onDecline={vi.fn()} />)

    await userEvent.selectOptions(screen.getByLabelText(/gender/i), 'F')
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith({ lead: expect.objectContaining({ name: 'Dana Maman' }), gender: 'F' })
  })

  it('should default gender to unknown so nobody is approved with a guessed value', async () => {
    const onApprove = vi.fn()
    render(<ApplicationsQueue leads={[pendingLead()]} onApprove={onApprove} onDecline={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /approve/i }))

    expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ gender: 'unknown' }))
  })

  it('should tell the reviewer when the queue is empty', () => {
    render(<ApplicationsQueue leads={[]} onApprove={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByText(/no applications waiting/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify failure**

Run: `npx vitest run src/features/applications/ApplicationsQueue.test.tsx`
Expected: FAIL — cannot resolve `./ApplicationsQueue`

**Step 3: Implement**

A `<ul>` of pending leads sorted by `rowNumber`, each an `<li>` with an `<h3>` name, title and
company, a LinkedIn `<a>`, a labelled `<select>` for gender defaulting to `unknown`, and Approve /
Decline buttons. Keep it under 200 lines; extract `ApplicationCard` if it grows.

**Step 4: Run to verify pass**

Run: `npx vitest run src/features/applications/ApplicationsQueue.test.tsx`
Expected: PASS, 7 tests

**Step 5: Commit**

```bash
git add src/features/applications/ApplicationsQueue.tsx src/features/applications/ApplicationsQueue.test.tsx
git commit -m "feat(applications): render the review queue"
```

---

## Task 14: Error and loading states

**Files:**
- Modify: `src/features/applications/ApplicationsQueue.tsx`
- Create: `src/features/applications/useApplications.ts`
- Test: `src/features/applications/useApplications.test.ts`

Tests to write first:

- should expose the leads once loading finishes
- should expose a loading state while the first read is in flight
- should surface the sheets error message when the read fails
- should remove an approved lead from the list without a full refetch
- should keep the lead in the list when approving it throws

That last one is the one people skip: a failed approve that optimistically removed the card would
lose the application from view while leaving the sheet untouched.

**Commit:** `feat(applications): load and mutate applications with error handling`

---

## Task 15: Google Cloud credentials (user, not Claude)

Claude cannot create these — they live in the user's Google account.

1. <https://console.cloud.google.com> → create project `pridetech-crm`.
2. APIs & Services → Library → enable **Google Sheets API**, **Google Drive API**, **Google Picker API**.
3. OAuth consent screen → **External**, app name `PrideTech CRM`, support email, developer email.
   Add the three organisers as **Test users**. Leave it in Testing — no verification is needed
   because the only scope is non-sensitive.
4. Credentials → **OAuth client ID** → Web application. Authorised JavaScript origins:
   `http://localhost:5173` and `https://<github-username>.github.io`. Copy the **Client ID**.
5. Credentials → **API key**. Restrict it to the Picker API. Copy it.
6. Note the **project number** (the Picker `appId`) from the project dashboard.
7. Put all three in `.env.local` (gitignored):

```
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...
VITE_GOOGLE_APP_ID=...
```

**Scope used by the app — nothing else:** `https://www.googleapis.com/auth/drive.file`

These are public-by-design browser values, not secrets: the client ID and app ID ship in every
page, and the API key is restricted to the Picker. Origin restrictions are what protect them. Even
so, keep them in `.env.local` rather than committed, so a future scope change cannot leak something
that does matter.

---

## Task 16: Google sign-in

**Files:**
- Create: `src/auth/googleAuth.ts`, `src/auth/useGoogleAuth.ts`, `src/auth/SignInScreen.tsx`
- Modify: `index.html` (add `<script src="https://accounts.google.com/gsi/client" async>`)
- Test: `src/auth/useGoogleAuth.test.ts`

Wrap `google.accounts.oauth2.initTokenClient({ client_id, scope, callback })` behind a narrow
`GoogleAuth` type so tests never touch the global. Tests (with a fake `GoogleAuth`):

- should start signed out
- should expose the access token after a successful sign-in
- should surface the error when the user dismisses the consent dialog
- should report signed out again once the token is cleared

**Note for the implementer:** GIS access tokens expire after about an hour and there is no refresh
token in this flow. Treat a 401 from the Sheets client as "ask the user to sign in again" rather
than retrying — and do not build silent-refresh machinery in this task; it is not needed until
someone leaves the tab open through a long check-in session.

**Commit:** `feat(auth): sign in with google`

---

## Task 17: Picking the Dashboard spreadsheet

**Files:**
- Create: `src/picker/useDrivePicker.ts`, `src/config/storedSpreadsheetId.ts`
- Modify: `index.html` (add `<script src="https://apis.google.com/js/api.js" async>`)
- Test: `src/config/storedSpreadsheetId.test.ts`

`storedSpreadsheetId` reads and writes `localStorage`, and must tolerate storage being unavailable
or holding junk. Tests:

- should return undefined when nothing has been stored
- should round-trip a stored id
- should return undefined rather than throwing when localStorage throws

The Picker itself is thin glue — `DocsView(ViewId.SPREADSHEETS)`, OAuth token, developer key, app
id — and is verified manually in Task 18 rather than unit-tested.

**Commit:** `feat(picker): choose and remember the dashboard spreadsheet`

---

## Task 18: Wire it together and verify against the real sheet

**Files:**
- Modify: `src/App.tsx`

Compose: signed out → `SignInScreen`; signed in with no spreadsheet id → Picker prompt; otherwise
`ApplicationsQueue` fed by `useApplications` over a real `createSheetsClient`.

**Manual verification — against the throwaway copy, never the live Dashboard:**

1. `npm run dev`, sign in, pick the copied spreadsheet.
2. The queue lists pending applications, oldest first.
3. Approve one with gender `F`. Confirm in the sheet: a new `Members` row with name, company,
   title, gender, mail, phone, city, LinkedIn and interests filled, `Status` = `Active`; and the
   lead's `Status` cell now reads `Approved`.
4. Reload. The approved lead is gone from the queue.
5. Approve the same email again by hand-clearing its status — confirm it is refused as already
   a member.
6. Decline one. Confirm `Declined` in the sheet and no new Members row.

**Commit:** `feat: wire the applications queue to google sheets`

---

## Task 19: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

Standard Pages workflow: checkout, Node 20, `npm ci`, `npm run test`, `npm run build`,
`actions/upload-pages-artifact` with `dist/`, `actions/deploy-pages`. Pass the three `VITE_*`
values as repository **variables** (not secrets — they are public by design and secrets would
silently fail to inline at build time).

Gate the deploy on tests passing, so a red suite cannot reach the live page.

Then in the repo: Settings → Pages → Source: GitHub Actions. Add the resulting
`https://<user>.github.io` origin to the OAuth client from Task 15 if it is not already there.

**Manual verification:** open the Pages URL, sign in, confirm the queue loads.

**Commit:** `ci: deploy to github pages`

---

## Out of scope for this plan

Events CRUD, the multi-sheet event registry, reconcile-on-open, check-in, plus-one guests, the
`Attendance` tab, member browsing and the dashboard stats. These come next, against the same
sheets client and the same header-mapping primitives built here.
