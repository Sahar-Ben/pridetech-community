# Apps Script

Scripts that run inside Google, attached to the community spreadsheet. They are
kept here so they are versioned; they are not part of the web app build.

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
