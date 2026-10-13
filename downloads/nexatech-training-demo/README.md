# NexaTech Training Platform — Warehouse Safety Learning (prototype)

## How to run

Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). No installation, server or internet connection is needed (an internet connection only loads the brand fonts; the platform falls back to system fonts without it).

## Quick demonstration (5 minutes)

1. On the sign-in screen choose **Trainee**, **Supervisor** or **Administrator** under "Or explore instantly as" — or create your own account.
2. **Trainee:** My training → open a zone → drag the 360° scene and open all three markers → PPE check → knowledge check. Then Emergency scenarios → Final assessment → My records → Print certificate.
3. **Supervisor:** Team dashboard → filter, open a trainee's details, view Hazard reports, export CSV.
4. **Administrator:** Administration → edit zone content, settings, export/import a backup, view the activity log.
5. Anyone: Safety guide, Report a hazard, text size (A−/A+) and High contrast in the top bar.
6. Sign out → "Verify a certificate" with the ID shown in My records.

## What is included

- 3 training zones with draggable 360° scenes, hazard markers, PPE check and 3-question knowledge check
- 3 branching emergency scenarios (fire, chemical spill, forklift incident)
- Randomised final assessment, certificate with verifiable ID, training statement and JSON record
- Supervisor dashboard (filters, drill-down, needs-attention flags, CSV export) and hazard/near-miss reporting
- Administrator tools: content editor, pass mark and contacts, backup/import, activity log
- Achievement badges, accessibility options, safety guide and glossary

## Security and data (prototype limits)

All accounts, progress, reports and edits are stored in this browser's local storage only; nothing is sent anywhere. Passwords are salted and hashed (SHA-256) before storage, sign-in locks for 30 seconds after five wrong attempts, and sessions end after 20 minutes of inactivity. This is still **not production authentication**: a real release needs a secure back end (server-side authentication and role checks, a database, audit logging, privacy controls, penetration testing). Do not enter real employee data. Training content is illustrative and must be validated against the client's own site rules before real use.

## Files

`index.html` · `css/style.css` · `js/content.js` (training content) · `js/scenes.js` (360° viewer) · `js/platform-core.js` (storage, accounts, progress) · `js/platform-trainee.js` · `js/platform-staff.js` · `js/platform-app.js`
