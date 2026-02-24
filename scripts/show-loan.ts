import { prisma } from '../lib/prisma'

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: npx tsx scripts/show-loan.ts <loanId>')
    process.exit(1)
  }
  const loan = await prisma.loan.findUnique({ where: { id } })
  console.log(JSON.stringify(loan, null, 2))
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
