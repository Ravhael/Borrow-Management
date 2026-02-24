const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.loanMktCompany.count()
  console.log('LoanMktCompany count:', count)
  const sample = await prisma.loanMktCompany.findMany({ take: 10, include: { mktCompany: true } })
  console.log('Sample mappings:', sample)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})