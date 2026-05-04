# JaboHouse Static Microsite

This is a no-build static site suitable for Cloudflare Pages.

## Files

- `index.html` - page structure, copy, product terms, and Zoho Forms inquiry embed
- `styles.css` - colors, typography, spacing, and responsive layout
- `script.js` - temporary email-draft inquiry behavior
- `assets/images/` - launch photography placeholders

## Editing

Update brand colors in `styles.css` under `:root`.

Replace photos by keeping the same filenames in `assets/images/`, or update the matching `src` attributes in `index.html`.

The inquiry section embeds the JaboHouse Reservation Inquiry form from Zoho Forms. Update the iframe URL in `index.html` if the Zoho form permalink changes.
