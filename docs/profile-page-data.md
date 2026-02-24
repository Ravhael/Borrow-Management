Profile page (pages/user/profile)

What changed
- Previously the profile page fetched `/api/users` on the browser and used a mock/fallback selection from the returned array (e.g. picks second user or the first `role === 'User'`).
- Mock stats (totalRequests=12, activeLoans=3, etc.) were hard-coded in the UI.

Now
- The page uses server-side rendering (`getServerSideProps`) to resolve the current session and then loads the actual `User` row from the database using Prisma.
- It also computes basic per-user stats from the `Loans` table:
  - totalRequests: count of Loan rows owned by the user
  - activeLoans: loans not containing the word `return` in their loanStatus (case-insensitive)
  - completedPayments: count of loans where loanStatus contains `return`
  - upcomingPayments: loans with returnDate within next 7 days (and not already returned)

How to verify
1. Ensure you have a running dev server and are signed-in.
2. Open the profile page (match the actual port used by your dev server — Next may auto-pick a different port if 3000 is busy):

   http://localhost:3000/user/profile

3. Confirm the profile fields and the stats are populated with real DB data (or 0 where no rows exist).

Notes
- The page still uses `PUT /api/users` for updates (unchanged).
- If you want different stat definitions, we can refine the counts or add additional DB models for payments and schedule more accurate stats.
