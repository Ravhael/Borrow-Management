const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  const entitasCode = 'IVP'
  const matched = await prisma.mktCompany.findMany({ where: { value: { startsWith: entitasCode, mode: 'insensitive' } }, select: { value: true } })
  const matchedValues = matched.map(m => m.value)
  console.log('matchedValues:', matchedValues)
  const loans = await prisma.loan.findMany({ where: { OR: [ { loanMappings: { some: { mktCompany: { value: { in: matchedValues } } } } }, { company: { hasSome: matchedValues } } ] }, take: 50 })
  console.log('loans length:', loans.length)
  console.log(loans.slice(0,5).map(l => ({ id: l.id, company: l.company })))
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })