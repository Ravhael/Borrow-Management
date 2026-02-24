import { prisma } from '../lib/prisma'
import { computeDaysUntil } from '../utils/email-templates/reminderShared'

async function main() {
  const loans = await prisma.loan.findMany({ where: { isDraft: { not: true } } })
  console.log('Checking', loans.length, 'loans')
  for (const loan of loans) {
    const eff = (loan as any).returnDate || (loan as any).endDate
    const days = computeDaysUntil(eff)
    if (typeof days === 'number' && (days <= 7 && days >= -30)) {
      console.log(loan.id, loan.borrowerName, 'returnDate=', eff, 'daysUntil=', days)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
