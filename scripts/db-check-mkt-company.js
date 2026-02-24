const { PrismaClient } = require('@prisma/client');

;(async () => {
  try {
    const prisma = new PrismaClient()
    const rows = await prisma.mktCompany.findMany({ orderBy: { label: 'asc' } })
    console.log(JSON.stringify(rows, null, 2))
    await prisma.$disconnect()
  } catch (err) {
    console.error('ERROR', err)
    process.exit(1)
  }
})()
