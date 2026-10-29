# BAM Studios — Contact Form Worker

Cloudflare Worker for BAM Studios website contact form.

## Live URL
https://bam-studios-contact.buisch2314.workers.dev

## Flow
1. Website form submits POST
2. Worker validates input
3. Sends email via Resend API
4. Returns JSON to frontend

## Environment Variables
- RESEND_API_KEY (Secret) — set in Cloudflare dashboard
- ALLOWED_ORIGIN (Var) — CORS allowed origin
- RECIPIENT_EMAIL (Var) — where emails go

## Deploy
proot-distro login ubuntu -- bash -c "cd /data/data/com.termux/files/home/bam-contact-worker && wrangler deploy"

## Debug
proot-distro login ubuntu -- bash -c "cd /data/data/com.termux/files/home/bam-contact-worker && wrangler tail"

## Related
- Website: https://bam-studios-website.pages.dev
- Website repo: https://github.com/BurhanMughal01/bam-studios-website

