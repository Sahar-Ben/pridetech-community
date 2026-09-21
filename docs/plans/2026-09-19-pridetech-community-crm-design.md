# PrideTech Community CRM — Design

**Date:** 2026-09-19
**Status:** Approved, pending implementation plan

## Problem

PrideTech is a community of ~700 LGBTQ tech professionals. Membership and events are run
entirely out of Google Sheets, Google Forms and Drive folders. Three things are breaking:

1. **The application queue is the bottleneck.** The application form has 1,086 responses
   against ~700 members. Several hundred applications sit undecided, and the form itself
   apologises for a review that "may take a few weeks."
2. **Attendance is not recorded anywhere.** RSVP is intent, not attendance. Nothing in the
   current sheets answers "how many events has this person been to?" or "who no-showed?"
3. **Member data is lost at the hand-off.** The application form requires LinkedIn and phone
   and collects city and interests, yet those columns are empty on the Members tab. The data
   is captured for 1,086 people and dropped when a lead becomes a member.

## Current state

### `PrideTech Dashboard` spreadsheet

| Tab | Contents |
| --- | --- |
| `Leads` | Live Google Form response tab. Timestamp, Name, Job Title, Company, LinkedIn, E-Mail, Phone, City, Interests. Approval state is carried as yellow cell highlighting. |
| `Members` | Name, Company, Title, Gender, Mail, Informed for membership, Meetup, Phone, City, LinkedIn, Interests, Shirt Size, Notes. Phone, City, LinkedIn, Interests, Shirt Size and Notes are largely empty. |
| `Event Checklist` | Event runbook and comms timeline. Out of scope. |
| `1st`–`4th Meetup` | Abandoned per-event invite lists. Dead — superseded by the Drive event folders. |

### `PrideTech/Events` Drive folder

19 event folders spanning `1st Event (16.4.25)` through `Moabet 14.10.26`. Each holds its own
RSVP Google Form, that form's Responses sheet, and marketing assets.

### Known data quality issues

- `Members` row 27 is blank, breaking any contiguous-range read.
- Company and title are swapped in some rows (e.g. `Omer Gerson | VP Data & AI | Playtika`).
- Row background colour carries status that no programmatic read can see.
- Event response sheets accumulate hand-added columns with duplicate headers
  (Playtika has `Waiting` and `Phone` twice).
- The `Meetup` column on `Members` holds a single value, so it cannot express attendance history.
- Event dates disagree between the dead meetup tabs and the Drive folders
  (`3rd Meetup (16.7.25)` vs `3rd Event (18.6.25)`).
- The Drive folder is under *Shared with me* — owned by another account.

Audit of all 22 RSVP response sheets (2026-09-19):

- **Six have no email column** — `1st Event` and `2nd`–`5th Meetup` (the latter existing twice).
- Header wording varies freely: `Name` / `Full Name`, `Company` / `Your Company` /
  `Current Employer / Organization / Company`, `Arrived` / `arrived` / `Arrived to the bus`
  (the last being shuttle logistics, not attendance, despite the name).
- `Microsoft Pride RSVP` has an **empty A1 header** over the timestamp column.
- `TikTok RSVP` carries a junk `Column 1` header.
- Four files are duplicates of another event's sheet (GAGA 1st ×2, 5th Meetup ×2,
  Singles #1 vs Singles #1 - NEW).
- The `attending` and `Arrived` columns recently added to several sheets are empty.
- `Google Event RSVP` has its entire data block filled red; `Alison Event RSVP` has rows where
  values sit in the wrong columns (a company reading `8200`, Hebrew names shifted).

## Architecture

A React + Vite single-page app, built by GitHub Actions and served from GitHub Pages out of the
project repo. No backend, no database, no secrets to manage.

**Google Sheets stays the source of truth.** The browser talks directly to the Sheets API as the
signed-in organiser. Access control is Drive sharing: whoever the sheets are shared with can use
the app. Three organisers, all trusted.

**Auth is Google sign-in**, not OTP. A hand-rolled OTP was considered and rejected — it costs
money to deliver, and it is the classic place small apps leak (no rate limiting, guessable codes,
replayable links). Google sign-in restricted to the people the sheets are shared with is simpler
and stronger, and it grants sheet access as a side effect.

**Scope is `drive.file`, not full spreadsheet access.** The app uses Google Picker: an organiser
picks a sheet once and the app remembers its file ID. Broad spreadsheet access is a *sensitive*
scope, which triggers Google's unverified-app warning screen until the app passes verification.
`drive.file` is non-sensitive, so verification is avoided entirely. Cost: one extra click the
first time a sheet is added.

### Consequences accepted

- Every stat is computed in the browser from live sheet reads. Fine at 700 members and ~20 events.
- No referential integrity. A typo'd email in an event sheet would become a phantom person —
  which is why reconcile-on-open exists.
- Anything the app can do, a signed-in organiser can do. Acceptable for three trusted people.
- No restricted "door volunteer" role. Drive sharing cannot express it. If that is needed later,
  it requires a backend.

## Data model

The Dashboard spreadsheet becomes the app's home. Two new tabs:

**`Events`** — one row per event: name, date, host, location, status, and **one or more attached
response sheets**, each with its own file ID, role (`main` or `waiting list`) and column mapping.
An event is not one sheet. Google Event keeps its waiting list in a separate form and sheet,
Playtika keeps it in a column, and most events have none at all — so the registry models a list
of sheets, and rows from a sheet marked `waiting list` land as `waitlist` attendance. Replaces
the dead meetup tabs. The existing events are backfilled once, one Picker click per sheet.

**`Attendance`** — one row per person per event: email, event, status
(`registered` / `attended` / `no-show` / `waitlist`), plus `guest of` — the email of the member
who brought them, empty for members attending in their own right.

The Singles events collect a plus-one by name and email. Those guests attend legitimately without
being members, so they must not land in the reconcile queue as unknown people. A plus-one becomes
an attendance row with `guest of` set to the member who registered them, and no Members row.

Attendance is centralised rather than written back into each event's Responses sheet. The
deciding factor is the main query: "how many events has this person been to?" against a central
tab is one read, against per-event sheets it is a read per event, growing every two weeks. It
also avoids racing Google Forms for the same sheet. The cost is that attendance no longer sits
beside the RSVP row in Drive.

A consequence worth stating: **the app never writes to the event Responses sheets** — it only
reads them. Write access is needed on the Dashboard spreadsheet alone, which the organisers own.
The Drive events folder being under *Shared with me* therefore does not block anything.

`Members` keeps its existing columns and file. The app reads and writes it in place. The `Meetup`
column becomes irrelevant once `Attendance` exists but is left rather than deleted.

Status becomes explicit data instead of cell colour: `Status` on `Leads`
(`Pending` / `Approved` / `Declined`) and on `Members` (`Active` / `Ex-member`).

## Member lifecycle

**Lead → Member → Ex-member**, one direction.

Approving a lead writes a Members row carrying Name, Job Title → Title, Company, E-Mail → Mail,
LinkedIn, Phone, City and Interests across — fixing the lossy hand-off. Declining records the
decision.

Removing a member sets `Status` to `Ex-member` rather than deleting the row. Deleting would rewrite
history: past events would lose their attendees and unique-people-reached counts would drop.

Removal records a **reason** alongside the status — a short picklist plus an optional free-text
note. A picklist rather than free text so the reasons can be counted and filtered; someone leaving
the tech industry and someone removed after an incident are not the same signal and should not
blur together in a search. Starting set: `Left tech`, `Requested removal`, `Moved abroad`,
`Unreachable`, `Code of conduct`, `Other`. The note carries the specifics.

**Gender** is not asked on the application form and will not be — it is determined during the
LinkedIn check that is already part of approval. It therefore becomes a field on the approve
step, where the organiser is already looking at the person's LinkedIn, with an `unknown` option
so nobody is forced to guess to clear the screen. This makes the field get filled consistently
rather than sporadically.

## Events

Full CRUD. Creating an event records name, date, location and capacity, then attaches its
Responses sheet via Picker and confirms the column mapping. Deleting archives the event — it
never touches the Google Sheet or Form in Drive.

**Per-event column mapping** is required because every RSVP form differs. Playtika asks about
food restrictions and a shuttle; others do not. The app reads the header row, guesses which
column is email / name / timestamp, shows the guess for correction, and saves the mapping to the
`Events` row so every organiser inherits it. Duplicate headers are disambiguated by position.

**Reconcile on open.** Every registrant email is looked up against `Members`. Unmatched rows go
to a review list where the organiser links them to an existing member or adds them. This replaces
the current honour system — the Playtika form asks people to self-declare "I confirm that I am a
PrideTech member" and nothing verifies it.

Five early events (`1st Event`, `2nd`–`5th Meetup`) have **no email column** — their forms never
asked. There is nothing to backfill, so those reconcile by name with the organiser confirming
ambiguous matches. A one-time cost on five past events. Going forward, Email must be a required
question on the RSVP template form; this is the one form change the design depends on.

**Check-in** is a mobile-friendly screen for event day. Tap people present; registered-but-not-
checked-in becomes a no-show. Writes to the `Attendance` tab.

The app does not create Google Forms. That needs a broader scope, which would drag back the
unverified-app warning the `drive.file` decision avoids — a bad trade to save one click every
two weeks. Forms continue to be made by duplicating a template.

## Screens

| Screen | Purpose |
| --- | --- |
| **Applications** | The review queue. Pending applications oldest-first with name, title, company, LinkedIn, interests. Approve (setting gender) or decline. |
| **Members** | Searchable, filterable by status, company, city, interests, gender, attendance. Profile shows details plus full event history. |
| **Events** | Upcoming and past. An event opens to its registrants, the reconcile panel, and check-in. |
| **Dashboard** | *Composition:* gender split, top companies, cities, interests, growth over time. *Engagement:* attendance distribution, no-show rate, members who have never attended, and members who used to attend and stopped. |

The two engagement segments are the actionable ones: with 700 members and 30–300 seats per
event, knowing who to prioritise inviting is what the spreadsheet cannot answer today.

## Migration

1. **Snapshot** the Dashboard as a frozen dated backup before anything writes to it.
2. **Clean the live file in place** — add `Status` columns, close blank row 27, fix swapped
   company/title rows, retire the `Meetup` column and the 1st–4th meetup tabs, dedupe headers.
3. **Backfill** LinkedIn, phone, city and interests onto existing members by matching `Leads`
   on email.
4. **Register** the existing events and their Responses sheets. Four files are duplicates —
   `GAGA 1st Event RSVP` ×2 (identical rows), `5th Meetup RSVP` ×2, and `Singles #1 RSVP` vs
   `Singles #1 RSVP - NEW`. Registering the wrong copy would double-count or lose people, so the
   organiser picks the canonical one per event rather than the app guessing.
5. **Make Email required** on the RSVP template form.

The spreadsheet is **not** duplicated into a cleaner parallel file. The `Leads` tab is bound to
the live Google Form, and that binding does not survive duplication — new applications would keep
landing in the original while the "organized" copy went stale. Cleanup is a one-time migration of
the live file.

During development the app points at a throwaway copy so a bug cannot corrupt 1,086 real rows,
and is switched to the live file once approval and check-in work.

## Build order

**Applications first.** It is the actual bottleneck, it is simpler (one sheet, no per-event
mapping), and it is useful the day it ships. The event side only pays off at the next event.

## Rejected alternatives

| Option | Why not |
| --- | --- |
| App owns the data (import from Sheets once) | Would stop the organisers working in Sheets, which they want to keep. |
| Two-way sync between app DB and Sheets | Conflicts and duplicates become the main maintenance cost. |
| Next.js on Vercel + service account + email OTP | Needed only because of the OTP requirement, which was dropped. Adds a backend, a secret, and a deploy target for no gain. |
| Google Apps Script web app | Poor dev experience, dated UI toolkit, and "published on GitHub" degrades to a copy of a script. |
| Attendance written back into each event sheet | Turns the core stat into a read per event, and races Google Forms. |
| Inferring gender from first names | Guesswork, and in this community guesswork that would be wrong about exactly the people it most matters to be right about. |
