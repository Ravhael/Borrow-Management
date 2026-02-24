Added `description` and `userId` columns to MktCompany model

What changed
- Prisma schema: added `description String?` and `userId String?` (optional FK to `User.id`) to `MktCompany` model.
- Data file `data/mkt-company.json` updated with `description` keys (currently empty strings) so seed data will populate descriptions when available.
- `prisma/seed.ts` updated to persist `description` and `userId` on upsert.
- `pages/api/company.ts` updated to accept `description` when creating/updating companies.
- Admin UI (`pages/company.tsx` and `components/company/*`) was updated to include Description in form modal, table column, and search/filter.

Developer actions to apply DB change locally
1. Apply the migration locally (recommended):

```powershell
npx prisma migrate dev --name add_mktcompany_userid
npx prisma generate
```

2. (Alternative quick sync) Use db push then generate:

```powershell
npx prisma db push
npx prisma generate
```

3. (Optional) Re-run seed to populate description values from `data/mkt-company.json`:

```powershell
npx ts-node prisma/seed.ts
```

Notes
- Existing DB rows will need an explicit migration and/or backfill if you want non-null descriptions for existing companies.
- UI and API changes are backward-compatible: `description` is optional (nullable).
