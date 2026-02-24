Why some loans had `userId: null` and how to verify/fix

Problem
- Earlier the `/api/submit` handler relied on `req.body.userId` when creating loans.
- The browser form didn't send userId in the request body, so newly-created rows stored `userId` as null.

What I changed
- The server now resolves the authenticated user from the NextAuth token and sets `loan.userId` from the token (`sub`) when creating a loan in `pages/api/submit.ts`.

How to verify locally (developer)
1. Ensure your environment has an active user session (sign-in via the app in the browser). The form page uses getServerSideProps and redirects to /login if not signed in.
2. Start your dev server:

```powershell
npm run dev
```

3. Open the form page, submit a new request while signed in, and confirm the returned ID is valid.
4. Inspect the DB (via psql or Prisma Studio). Example:

```powershell
npx prisma studio
# or query using psql/your preferred DB tool
SELECT id, loanStatus, userId, submittedAt FROM "Loan" ORDER BY submittedAt DESC LIMIT 5;
```

Prisma schema / migration notes
- You already added `userId` to the `Loan` model in `prisma/schema.prisma`. If you haven't applied the migration locally, run:

```powershell
npx prisma migrate dev --name add-loan-userid
npx prisma generate
```

- If you instead used `npx prisma db push` for a quick local sync, still run `npx prisma generate` to refresh the client.

Backfilling old rows
- Existing rows that were created before this fix may still have `userId = NULL`.
- If you can determine which historic rows belong to which user (e.g. by email or other mapping), perform a safe `UPDATE` with a WHERE clause and test first.

Security note
- The server assigns `userId` from the authenticated session (token). Do not trust arbitrary `userId` values from the client for security reasons.

If you want, I can also add a quick integration test or a script to backfill userId for historical rows based on available heuristics.
