# NexaTech Solution — Promotional Website (CET257 Task B2)

## Open the website

Open `index.html` in any modern browser. No server or build step is needed.

## Pages

Home · About · Services (incl. skills & tools) · Training Platform · Case Study · **Brand identity** (logo, mission, vision, values, palette, typography, tone) · **Zero-budget marketing plan** (objectives, audience, channels, 12-week calendar, £0 budget, KPIs, risks; printable) · Contact · Privacy & accessibility · 404.

## Features

- Responsive layout, mobile menu, skip link, visible focus states, reduced-motion support, print styles.
- Contact form: required-field and email validation, character counter, consent, spam honeypot, service preselection (`contact.html?service=website`). On success it saves a local copy and offers **Open email to send** (pre-filled mailto to hello@nexatechsolution.dev), **Copy enquiry text** and **Download receipt**.
- Launchable and downloadable **Training Platform** (`downloads/nexatech-training-demo/`): draggable 360° hazard zones, PPE checks, knowledge checks, branching emergency scenarios, final assessment, verifiable certificate, badges, supervisor dashboard, hazard reporting, admin content tools. See that folder's README.
- SEO basics: titles, descriptions, Open Graph tags, favicon, `sitemap.xml`, `robots.txt`.
- Logo files in `assets/` (full lockup, reversed lockup, shield mark, favicon), downloadable from the Brand page.

## Putting it online (free, for the URL you must submit)

1. GitHub Pages: create a repository, upload everything in this folder, then Settings → Pages → deploy from the main branch. Or drag the folder onto netlify.com/drop.
2. Update the two URLs in `sitemap.xml` and `robots.txt` if your address is not nexatechsolution.dev.
3. Submit the live URL plus a ZIP of this folder, with your design documentation and marketing plan, as the B2 folder.

## Important assessment note

This is a front-end functional prototype. It deliberately stores accounts, progress, local content edits and enquiries in the browser's local storage only. It does **not** send email, authenticate real users, store data centrally or make compliance decisions. A production release would need a secure back end, password hashing, server-side role authorisation, database storage, audit logging, consent/privacy controls and deployment security testing.

## Suggested demonstration journey

1. Open **Training Platform** and select **Launch interactive demo**.
2. Create a trainee account, explore the three hotspots in a zone, pass its knowledge check, and mark it complete.
3. Open **My records** to show the saved status and print/download options.
4. Create a separate supervisor demonstration account to show the dashboard and CSV export.
5. Create a separate content-administrator demonstration account to show editable local content.

The original prototype files remain untouched in:

C:\Users\NITRO V 15\Desktop\Enterprise Project\Team2_NexaTech_Website final for prototype demonstartion
