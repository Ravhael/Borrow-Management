const { PrismaClient } = require('@prisma/client')

;(async () => {
  const prisma = new PrismaClient()
  try {
    const models = ['role','directorate','entitas','user','mktCompany']
    const out = {}
    for (const m of models) {
      const count = await prisma[m].count()
      const sample = await prisma[m].findMany({ take: 3, orderBy: [{ id: 'asc' }] })
      out[m] = { count, sample }
    }
    console.log(JSON.stringify(out, null, 2))
    await prisma.$disconnect()
    process.exit(0)
  } catch (err) {
    console.error('ERROR', err)
    await prisma.$disconnect()
    process.exit(1)
  }
})()
