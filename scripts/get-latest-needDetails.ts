import { prisma } from '../lib/prisma'

;(async () => {
  try {
    const loan = await prisma.loan.findFirst({ orderBy: { submittedAt: 'desc' } })
    if (!loan) {
      console.log('NO_LOANS_FOUND')
      return
    }
    console.log('LATEST_LOAN_ID:', loan.id)
    console.log('needDetails:' + '\n' + JSON.stringify(loan.needDetails, null, 2))
  } catch (e) {
    console.error('DB QUERY ERROR', e)
    process.exitCode = 2
  } finally {
    await prisma.$disconnect()
  }
})()
