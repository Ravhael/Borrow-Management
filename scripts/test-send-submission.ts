import { emailService } from '../utils/emailService'

async function run() {
  const loan = {
    borrowerName: 'Ravhael',
    entitasId: 'DGM',
    needType: 'DEMO_PRODUCT',
    company: ['IVP Richard'],
    useDate: '2025-12-02',
    returnDate: '2025-12-08',
    productDetailsText: 'dvavaae aefaefaef aefae fae f',
    submittedAt: new Date().toISOString()
  }

  const result = await emailService.sendLoanSubmissionNotification(loan, [
    { email: 'local-marketing@example.invalid', role: 'Marketing' },
    { email: 'local-admin@example.invalid', role: 'Admin' }
  ])

  console.log('sendLoanSubmissionNotification result ->', result)
}

run().catch(err => { console.error(err); process.exitCode = 1 })
