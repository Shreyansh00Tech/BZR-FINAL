# Blue Zone Residency (bzr.co.in)

Phone-first static marketing site for Blue Zone Residency, Noida. No build step, no dependencies.

## Files
- `index.html` – page, SEO tags, link-preview (Open Graph) tags, structured data, inline SVG icons
- `style.css` – styles (self-hosted fonts via `@font-face`)
- `main.js` – menu, gallery lightbox, tabs, FAQ, bottom-sheet enquiry form (Web3Forms)
- `fonts/` – Cormorant Garamond (headings) and Manrope (body), self-hosted woff2
- `*.webp` – photos (`hero-building*`, 4:5 gallery tiles, `full-*` for the lightbox, `card-*` for 2 BHK / 3 BHK)
- `og-image.jpg` – 1200x630 share image shown in WhatsApp / Facebook / LinkedIn previews
- `vercel.json`, `robots.txt`, `sitemap.xml` – hosting and SEO (canonical host is `www.bzr.co.in`)

## Deploy
Pushing to `main` auto-deploys on Vercel.

## To do when available
- Add the UP RERA registration number in the footer (see the TODO comment in `index.html`).
- Replace the sample interior photos on the 2 BHK / 3 BHK cards with the matching flat photos and floor plans.
- In the Web3Forms dashboard, restrict the access key to the `bzr.co.in` / `www.bzr.co.in` domains.
