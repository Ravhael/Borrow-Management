How to apply the Loans table migration

1) Ensure DATABASE_URL in your environment points to the target Postgres DB.

2) Run the migrations already present in prisma/migrations:

```
npx prisma migrate deploy
```

This will apply the manual migration in `prisma/migrations/20251126_create_loans_table/migration.sql` which creates the `Loans` table.

3) (Optional) Verify the table was created using psql or a DB client; or use Prisma Client in a script to query the table.

4) If you want to seed fixture file `data/loans.json` into the table, you can write a small script to read the JSON and upsert rows using Prisma Client (I can write this helper if you'd like).

Note: The Loans table stores dynamic need-specific fields in a single JSON column called `needDetails` (previously called `demo`). For example:
- If `needType` is `DEMO_PRODUCT` the object in `needDetails` can be { namaCustomer, namaPerusahaan, alamat, telepon }.
- If `needType` is `BARANG_BACKUP` or `LAINNYA`, `needDetails` can contain different key/value pairs appropriate for the type.

This lets the DB keep a flexible shape for the loan details while keeping the main columns stable.
