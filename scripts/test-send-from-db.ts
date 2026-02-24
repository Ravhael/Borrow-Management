import { prisma } from '../lib/prisma'
import { emailService } from '../utils/emailService'

async function run() {
  // Create a DB-backed loan with needDetails set to a distinctive sample
  function makeSubmissionIdFor(date = new Date()) {
    const yyyy = String(date.getFullYear())
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    // use a fixed small sequence for tests
    return `${yyyy}${mm}${dd}-1`
  }

  const loan = await prisma.loan.create({
    data: {
      id: makeSubmissionIdFor(),
      submittedAt: new Date().toISOString(),
      borrowerName: 'DB Test User',
      entitasId: 'DGM',
      needType: 'DEMO_PRODUCT',
      productDetailsText: 'db-test product details',
      company: ['IVP Richard'],
      useDate: new Date('2025-12-02T00:00:00Z'),
      returnDate: new Date('2025-12-08T00:00:00Z'),
      needDetails: { customerName: 'FromDB Inc.', companyName: 'FromDB Co', address: 'Jl DB No.1', phone: '021-999-000' }
    }
  })

  console.log('Created test loan id:', loan.id)

  try {
    // Force mock send so we can see logs regardless of SMTP config
    const ok = await emailService.sendLoanSubmissionNotification(loan as any, [
      { email: 'db-marketing@example.invalid', role: 'Marketing' },
      { email: 'db-admin@example.invalid', role: 'Admin' }
    ])

    console.log('sendLoanSubmissionNotification returned ->', ok)
  } finally {
    // Clean up the test loan so DB doesn't get cluttered if using a dev DB
    try {
      await prisma.loan.delete({ where: { id: loan.id } })
      console.log('Test loan cleaned up')
    } catch (e) {
      console.warn('Failed to cleanup test loan', e?.message ?? e)
    }
  }
}

run().catch(err => { console.error(err); process.exitCode = 1 })
