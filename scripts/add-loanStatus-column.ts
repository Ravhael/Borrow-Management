import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add loanStatus column if it does not exist, with default 'PENDING'
  // This uses raw SQL to alter the table directly instead of using prisma migrate
  const sql = `ALTER TABLE "Loans" ADD COLUMN IF NOT EXISTS "loanStatus" TEXT NOT NULL DEFAULT 'PENDING';`

  console.log('Running SQL to add loanStatus column (if missing) on table Loans...')
  try {
    await prisma.$executeRawUnsafe(sql)
    console.log('✅ loanStatus column ensured on Loans (default PENDING)')
  } catch (err) {
    console.error('Failed to add loanStatus column to Loans:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
