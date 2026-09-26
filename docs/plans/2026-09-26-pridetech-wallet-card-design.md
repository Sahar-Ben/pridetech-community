# PrideTech Wallet Membership Card — Design

**Date:** 2026-09-26
**Status:** Draft, awaiting approval

## Goal

Every approved member gets a PrideTech membership card they can add to **Apple Wallet** or
**Google Wallet**. The card is emailed to them the moment an organiser approves their
application. Existing members get theirs through a one-off bulk send.

The card is useful for two things: it makes membership feel real, and it carries a QR code
that the event check-in screen can later scan instead of searching for a name at the door.

## What the card shows

| Field | Source | Notes |
| --- | --- | --- |
| Name | `Members` → Name | Primary field. |
| Member since | Approval date | Already written on approve. |
| Member ID | New `Member ID` column on `Members` | Short opaque code such as `PT-7K3Q9D`. Also shown as text under the QR code. |
| QR code | Member ID | Only the ID, never the email. A card photographed and posted online then leaks nothing personal. |
| Branding | PrideTech logo, rainbow strip, brand colour | Same assets as the app. |

Company and title are left off. The card sits on a lock screen and is shown at a door, and a
member's employer is not something the card needs to announce.

## The constraint: signing needs a secret

Both wallets reject a card that is not signed by its issuer:

- **Apple** — a `.pkpass` file is a zip signed (PKCS#7, detached) with a *Pass Type ID
  certificate* issued to an Apple Developer account.
- **Google** — the *Add to Google Wallet* link carries a JWT signed with a Google Cloud
  *service account* key linked to a Google Wallet issuer account.

Neither key can ship to the browser: anyone holding it can mint PrideTech cards. The existing
design is deliberately "no backend, no secrets", so this feature adds the project's **first
server-side component**. It is kept as small as possible: it signs cards and sends one email,
and it never has access to the spreadsheet.

## Architecture

```
Organiser's browser (existing app on GitHub Pages)
  │  approve lead → Members row written (as today) + Member ID generated
  │  POST /issue { name, email, memberSince, memberId }  + organiser's Google access token
  ▼
Wallet worker (Cloudflare Worker, new, in wallet/ in this repo)
  │  1. verify the token is Google's, for our client ID, for an organiser email
  │  2. mint a signed card token (HMAC) holding name, memberSince, memberId
  │  3. email the member two links:  /apple?t=…   /google?t=…
  ▼
Member taps a link on their phone
  /apple  → worker builds + signs the .pkpass on the fly → Wallet opens it
  /google → worker signs a Google Wallet JWT → redirect to pay.google.com/gp/v/save/…
```

**The worker is stateless.** The card's contents travel inside the HMAC-signed token in the
email link, so the worker needs no database and no Sheets access. The `drive.file` access model
is unchanged: the spreadsheet is still touched only by an organiser's browser.

**Organiser authentication** reuses the Google sign-in the app already has. The browser sends
its access token, and the worker checks it with Google's `tokeninfo` endpoint. It accepts only
tokens issued to this app's OAuth client ID, for an email on an `ORGANISER_EMAILS` allowlist
stored as a worker secret. Nobody else can trigger an email or issue a card.

### Why a Cloudflare Worker

| Option | Verdict |
| --- | --- |
| **Cloudflare Worker** | Chosen. Free tier is far beyond ~700 members. Encrypted secrets built in. Deployed from GitHub Actions alongside Pages. Runs `node-forge` for the Apple PKCS#7 signature and Web Crypto for the Google JWT. |
| Google Cloud Function | Same GCP project as the OAuth client, but requires attaching a billing account. |
| Google Apps Script | Already rejected for the app itself. Also has no practical way to produce Apple's PKCS#7 signature. |
| Signing in the browser | Impossible without shipping the private keys. |

### Email

Sent by the worker through **Resend** (free tier: 3,000 emails/month, 100/day), from an address
on a domain PrideTech controls, which needs SPF/DKIM DNS records.

The 100/day cap matters only for the one-off bulk send to ~700 existing members. That send runs
over about a week, or on a paid month. The alternative of sending as the organiser through
Gmail was rejected: `gmail.send` is a *sensitive* scope and would bring back the
unverified-app warning that the `drive.file` decision exists to avoid.

**Fallback if there is no domain:** the approve screen shows *Copy card links* and opens a
pre-filled `mailto:` draft in the organiser's own mail client. Nothing else in the design
changes.

## Changes to the existing app

1. **`Member ID` column on `Members`.** Generated in the browser (random, 6 characters from an
   unambiguous alphabet) when a lead is approved. Backfilled once for existing members, in one
   bulk write, alongside the other migration steps.
2. **Approve flow.** After the Members row is written, call `/issue`. A failure here must not
   undo or block the approval: approval is the source of truth. It shows as a notice with
   *Retry sending card*.
3. **Member detail.** A *Send wallet card* button, used to resend or to reach someone whose
   email was wrong.
4. **Bulk send.** An organiser-only action on Members: *Send cards to active members without
   one*. Needs a `Card sent` date column so it is resumable and never double-sends.
5. **Config.** `VITE_WALLET_WORKER_URL`, added to the Pages build like the other `VITE_*` vars.

## Revocation

Cards do not phone home. An ex-member's card stays in their wallet, since pushing updates needs
Apple's pass web service and Google object updates, which in turn need state. That is accepted:
**the card is not the authority, the `Members` sheet is.** When check-in scans a QR code it
looks up the Member ID and shows the member's *current* status, so an ex-member's card scans as
an ex-member.

## Account setup (one-time, by an organiser)

### Apple — about 1–2 days, $99/year

1. Enrol in the **Apple Developer Program**. Enrolling as an organisation shows "PrideTech" as
   the developer but needs a D-U-N-S number, which is free but takes days. Enrolling as an
   individual is faster. The card itself shows `PrideTech` either way.
2. *Certificates, Identifiers & Profiles* → *Identifiers* → register a **Pass Type ID**, e.g.
   `pass.org.pridetech.member`.
3. Create a **Pass Type ID certificate** for it and export it with its private key as `.p12`.
4. Download Apple's **WWDR G4** intermediate certificate.
5. Hand over, as worker secrets: the certificate and key (PEM), the key's passphrase, the
   WWDR certificate, the Team ID and the Pass Type ID.

### Google — free, publishing needs Google's review

1. Open the **Google Pay & Wallet Console** and create an **issuer account** for PrideTech.
2. In the existing Google Cloud project, enable the **Google Wallet API** and create a
   **service account** with a JSON key.
3. In the Wallet Console, add that service account as a user of the issuer.
4. The issuer starts in **demo mode**: only listed test accounts can save cards. Request
   **publishing access** in the console (Google reviews it, typically days). Build and test in
   demo mode meanwhile.
5. Hand over, as worker secrets: the issuer ID and the service-account JSON key.

### Cloudflare and Resend — free

1. Cloudflare account → an API token for Workers, stored as a GitHub Actions secret for deploys.
2. Resend account → verify the sending domain (DNS records) → an API key as a worker secret.

## Build order

1. **Worker, Google first.** No certificate wait, and demo mode is enough to test end to end.
2. **Worker, Apple.** Once the Pass Type certificate exists.
3. **App: `Member ID` + send on approve + resend button.**
4. **Bulk send** to existing members.
5. **Later, separately designed:** QR scanning on the check-in screen.

Everything testable without real keys is tested with generated throwaway keys: token
round-trips, JWT structure, pass.json contents, manifest hashes, the signature verifying
against its test certificate, and the allowlist rejecting non-organisers.

## Open questions

- Does PrideTech own a domain to send email from? If not, use the `mailto:` fallback.
- Final visual assets: logo at Apple's icon/logo sizes and a strip image. Placeholders are
  generated from the app's brand until then.
- Should `Card sent` be visible in the Members table, or only used by bulk send?

## Rejected alternatives

| Option | Why not |
| --- | --- |
| Static pre-signed `.pkpass` files in the repo or Drive | Would put member names in the repository or need signing on an organiser's laptop per member. |
| Sending email through the organiser's Gmail | Sensitive scope, which brings back the unverified-app screen. |
| Email address as the QR payload | Leaks personal data to anyone who sees or photographs the card. |
| Live-updating cards (Apple pass web service) | Needs a database and push infrastructure to solve revocation, which the check-in lookup already solves. |
| A third-party pass platform (PassKit, Passcreator, etc.) | Monthly cost per active pass, and member data leaves Google Drive for another vendor. |
