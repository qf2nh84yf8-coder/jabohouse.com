# JaboHouse Static Microsite

This is a no-build static site suitable for Cloudflare Pages.

## Files

- `index.html` - page structure, copy, product terms, and the native inquiry form
- `styles.css` - colors, typography, spacing, and responsive layout
- `script.js` - carousel, menu, sound toggle, video, header logo, and inquiry form behavior
- `functions/api/inquiry.js` - validation, optional Turnstile protection, and Cloudflare Email Service delivery
- `assets/images/` - site photography, product, founder, delivery, and care-guide images
- `assets/media/` - transparent header logo animation and still logo fallback
- `assets/audio/` - jungle ambience audio

## Editing

Update brand colors in `styles.css` under `:root`.

Replace photos by keeping the same filenames in `assets/images/`, or update the matching `src` attributes in `index.html`.

## Native inquiry form

The inquiry form submits to the Cloudflare Pages Function at `/api/inquiry`. The Function delivers new inquiries through Cloudflare Email Service and never exposes an API token in the browser.

Required production setup:

1. Onboard `jabohouse.com` under Cloudflare **Email Service > Email Sending**. This adds sending records on the `cf-bounce` subdomain without replacing the existing Zoho MX records.
2. Create a Cloudflare API token with **Email Sending: Edit** access and store it as the Pages secret `CLOUDFLARE_EMAIL_API_TOKEN`.

Cloudflare Email Routing is not required for this form. Zoho continues receiving mail for `@JaboHouse.com` through the existing MX records.

Recommended spam protection:

1. Create a Turnstile widget for `jabohouse.com`.
2. Store its public site key as `TURNSTILE_SITE_KEY` and its secret as `TURNSTILE_SECRET_KEY` in the Cloudflare Pages production environment.

Optional environment variables are `CLOUDFLARE_ACCOUNT_ID`, `INQUIRY_RECIPIENT`, and `INQUIRY_SENDER`. Defaults are already set for the current JaboHouse Cloudflare account and email addresses.

Zoho currently handles incoming email for `@JaboHouse.com`. Cancel only the Zoho Forms product unless the mailbox is migrated separately.

## Publishing

Upload the contents of this folder to the root of the GitHub repository connected to Cloudflare Pages. After GitHub commits the files, Cloudflare Pages should redeploy the live website automatically.
