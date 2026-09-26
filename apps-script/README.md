# Apps Script

Scripts that run inside Google, attached to the community spreadsheet (the
`PrideTech Dashboard`, which holds `Leads`, `Members` and `Events`). They are
kept here so they are versioned; they are not part of the web app build.

Both scripts can live in the same Apps Script project: in the editor, add each
as its own file (**+ → Script**).

## `createEventForms.gs`

When you add an upcoming event in the app, within five minutes this:

1. Creates a folder for it in the shared Events folder, named
   `Event name d.m.yy` (e.g. `Moabet 14.10.26`).
2. Creates the RSVP form in that folder, titled with the event name, with the
   date, location and host in its description. Questions: Full Name, Email
   (required, must be a valid address), Company, Job Title.
3. Creates the response sheet in the same folder and links the form to it.
4. Adds the sheet to the `Event sheets` tab with its columns already mapped, so
   the app can read who registered.
5. Puts the form's link in a `Form link` column at the end of the `Events` tab,
   ready to send out.

It skips past events, archived events, events that already have a form link,
and events you attached a sheet to yourself.

### Setup (once)

1. Open the Dashboard spreadsheet → **Extensions → Apps Script**.
2. Add a file named `createEventForms` and paste in `createEventForms.gs`.
   Save.
3. Pick `installEventFormTrigger` in the function dropdown and click **Run**.
   Allow the permissions Google asks for (Drive, Forms, Sheets). This also
   creates forms for any upcoming events already in the tab.
4. Reload the spreadsheet: a **PrideTech** menu appears with **Create forms for
   new events now**, for when you don't want to wait five minutes.

Your account needs **edit** access to the Events folder, since the script
creates folders there as you.

### After a form is created

- **Edit the form freely** in Google Forms: add questions, change the wording,
  add a banner. Keep the first four questions in place and in order, since the
  app reads Name, Email, Company and Job Title from those columns.
- **The first time you open the event in the app**, it will say the response
  sheet can't be opened and offer **Give access**. Pick the response sheet in
  the event's folder once. The app can only read files you have picked
  yourself, and the script made this one, not the app. Each other organiser
  does the same once per event.

## `duplicateApplicationEmail.gs`

When someone submits the membership form with an email address the community
already has, this emails them automatically:

- **Already on the Members tab** → "You're already a PrideTech member".
- **On an earlier `Leads` row** → "We've already got your application".
- **New address** → nothing is sent.

The form still accepts the submission (Google Forms can't refuse one), and the
new row stays in the sheet. The CRM's Leads tab already groups repeat
applications so a reviewer can clean them up.

### Setup (once)

1. Open the spreadsheet the form writes to (the one with the `Leads` tab).
2. **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with `duplicateApplicationEmail.gs` from
   this folder, then save.
4. Pick `installTrigger` in the function dropdown and click **Run**. Google asks
   for permission to read the spreadsheet and send email as you. Allow it.

That's it. To check it works, submit the form twice with your own address. The
second submission should get the "already applied" email within a minute.

### Good to know

- The emails come **from the Google account that ran `installTrigger`**. Replies
  go back to that inbox.
- Gmail accounts can send about 100 of these a day; Workspace accounts about
  1,500.
- Edit the subject and body text near the top of the script.
- To turn it off: in the Apps Script editor go to **Triggers** (clock icon) and
  delete the `onApplicationSubmitted` trigger.
- It looks for the email column under the same headers the CRM reads (`Email`,
  `Your email`, `E-mail`, `Mail`, or `Email Address`). If the form's email
  question is worded differently, add that heading to `EMAIL_HEADERS`.
