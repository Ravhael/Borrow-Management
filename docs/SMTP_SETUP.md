# SMTP Setup & Security (FormFlow)

This document explains how to enable real SMTP sending in this project, how the application picks up `mailSettings`, and recommendations for securing credentials.

## How the app resolves SMTP configuration

Order of precedence:
1. DB entry (Prisma model `MailSettings` with id=1) — used by production and dev when present
2. `data/mail-settings.json` — used as a dev fallback and included in repo for convenience
3. Environment variables (useful in production / CI) — see variables below

## Safe credential storage recommendations

- Use environment variables (e.g. in Vercel/Netlify/Azure/GCP) or a secret manager in production.
- Do NOT commit SMTP passwords or usernames into the repo. Remove any committed secret from git using tools like the GitHub secret-remover and rotate the credentials.
- Locally, create a `.env` file (not committed) and add secrets there.

Suggested .env variables (add to `.env` or CI secrets):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=some-user@example.com
SMTP_PASSWORD=super-secret
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME="FormFlow"
```

## Seeding mail settings into the DB

There is a helper script included that upserts the repo `data/mail-settings.json` into the DB:

```powershell
# from the project root on Windows PowerShell
npm run upsert-mail-settings
# or
npx tsx scripts/upsert-mail-settings.ts
```

You can also run the prisma seed (if configured) to populate default mail settings:

```powershell
npm run seed-db
# or
npx tsx prisma/seed.ts
```

## Testing email sending

1. Ensure SMTP details exist (in DB or `.env`)
2. Start the dev server:

```powershell
npm install
npm run dev
```

3. Use the UI: /admin/mailsettings — input a test recipient and press Send Test Email.
4. Or call the test endpoint directly:

```powershell
curl -X POST http://localhost:3000/api/admin/mailsettings/test-email -H "Content-Type: application/json" -d '{"email":"you@yourdomain.com"}'
```

## Notes & caveats

- The app will fall back to a mocked console logging mode when no SMTP configuration can be found. This keeps the app safe for local development.
- If you find a `data/mail-settings.json` with real credentials in the repo, remove it and rotate the credentials immediately.
