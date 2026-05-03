# JaboHouse

Mobile-first static microsite for JaboHouse, built for GitHub and Cloudflare Pages.

This site has no build step. Cloudflare Pages can publish it directly from the repository root.

## Project Structure

- `index.html` - page structure, copy, product terms, and inquiry form fields
- `styles.css` - colors, typography, spacing, and responsive layout
- `script.js` - carousel, lightbox, mobile navigation, YouTube film behavior, and temporary inquiry behavior
- `assets/images/` - production imagery, founder photo, favicon, and crest assets
- `_headers` - basic Cloudflare Pages response headers

## Cloudflare Pages Settings

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Production branch: `main`

## GitHub Setup

1. Create a new GitHub repository, such as `jabohouse.com`.
2. Upload this folder's contents to the repository.
3. Connect the repository in Cloudflare Pages.
4. After the first deploy, add `JaboHouse.com` as a custom domain in Cloudflare Pages.

## Zoho Mail

Use Zoho Mail for `troy@JaboHouse.com` by adding Zoho's domain verification, MX, SPF, and DKIM DNS records in Cloudflare DNS.

## Inquiry Form

The inquiry form currently opens an email draft addressed to `troy@JaboHouse.com`.

For production, replace the current mail draft behavior in `script.js` with either:

- a Cloudflare Pages Function that emails the inquiry to Zoho Mail, or
- a form service endpoint such as Formspree, Basin, Tally, or Zoho Forms.

Do not put Zoho passwords, SMTP credentials, or API keys into frontend JavaScript.

## Editing

Update brand colors in `styles.css` under `:root`.

Replace photos by keeping the same filenames in `assets/images/`, or update the matching `src` attributes in `index.html` and `script.js`.
