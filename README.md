# Form Notification - Next.js

Aplikasi Next.js untuk manajemen form peminjaman dengan integrasi Google Sheets.

## Features

- ✅ Form submission dengan validasi
- ✅ Email notifications otomatis
- ✅ Dashboard admin dengan role-based access
- ✅ Approval workflow
- ✅ **Google Sheets integration** - Data form otomatis tersimpan ke Google Spreadsheet
- ✅ Responsive design dengan Material-UI

## Quick Start

```powershell
cd 'd:\Ravhael\Project\Form Notification\form'
npm install
npm run dev
```

Buka http://localhost:3000 di browser Anda.

## Setup Google Sheets Integration

Untuk mengaktifkan penyimpanan data ke Google Sheets:

1. Ikuti panduan di `GOOGLE_SHEETS_SETUP.md`
2. Akses `/admin/appscript-config` sebagai administrator
3. Konfigurasi Spreadsheet ID dan Apps Script URL
4. Submit form akan otomatis menyimpan ke Google Sheets

## Tech Stack

- Next.js 16
- React 18
- Material-UI (MUI)
- TypeScript
- Google Apps Script

## API Routes

- `POST /api/submit` - Submit form data
- `GET/POST /api/google-settings` - Manage Google Sheets settings

Database migration note:
- New Prisma model `AppscriptConfig` added to `prisma/schema.prisma` to store Google Apps Script settings (fields: spreadsheetId, scriptUrl, sheetName, enabled, createdAt, updatedAt).

To create the table in your database run (locally where DATABASE_URL is set):

```bash
# create migration and apply
npx prisma migrate dev --name add_appscriptconfig

# or push schema without a migration
npx prisma db push

# regenerate client and seed from data snapshot
npx prisma generate
npm run seed-db
```
- `GET /api/loans` - Get loan data
- `GET /api/company` - Get company data
- `GET /api/entitas` - Get entity data

### Data snapshot (read-only)

This project keeps a set of JSON snapshot files under `data/*.json` (roles.json, users.json, directorates.json, entitas.json) for convenience and local exports. IMPORTANT: these files are export snapshots and are treated as read-only at runtime. The canonical source-of-truth for users in the running application is the database (Prisma). Use the provided scripts (e.g. `scripts/export-current-db.ts`) to regenerate the `data/` snapshots when you want to update them.

## User Roles

- **Administrator**: Full access + Appscript (appscript-config)
- **Marketing**: Form submission + approvals
- **Warehouse**: Warehouse-specific features
- **User**: Basic form access

## Development

```bash
npm run build    # Build production
npm run start    # Start production server
npm run dev      # Start development server
```

### Email minification (dev toggle)

Outgoing HTML emails are minified in production to reduce payload and avoid client clipping. You can control this behavior with the EMAIL_MINIFY environment variable:

- Set EMAIL_MINIFY=false to disable minification (useful for byte-for-byte debugging of preview vs send).
- If EMAIL_MINIFY is not set, the app will minify in production but skip minification in development by default.


## Checkpointing the database (make current DB the default seed)

If you'd like to take the current live database and make it the default seed state (a checkpoint), there are two helper scripts in this repo:

- Export the current DB into the repository's snapshot files (writes into data/*.json):

```bash
npm run checkpoint-db
```

If you'd like to not only export but also automatically commit the updated snapshot files into the repository, use:

```bash
npm run checkpoint-and-commit
```

Note: `checkpoint-and-commit` will only attempt to commit changes when run inside a Git repository. If your environment doesn't use Git the script will simply export snapshots into `data/*.json` and skip any commit steps — use `npm run checkpoint-db` if you only need an export.

- Restore (apply) the project snapshot into the database (upserts using prisma seed script):

```bash
npm run restore-default-db
```

Notes: `checkpoint-db` is an alias that runs `scripts/export-current-db.ts` and `restore-default-db` calls the prisma seeding script which reads `data/*.json`.

Note: the checkpoint/export now includes `data/mail-settings.json` (the project's SMTP config snapshot) and `data/appscript-config.json` (Apps Script / Google Sheets config). The Prisma seeder will attempt to upsert MailSettings (id=1) and AppscriptConfig (id=1) when you run `npm run restore-default-db`.

