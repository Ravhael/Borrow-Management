/**
 * Backfill Loan ↔ MktCompany mappings.
 * Usage: node scripts/backfill-loan-companies.js --createMissing=true
 */
import { PrismaClient } from '@prisma/client'
import minimist from 'minimist'

async function main() {
  const argv = minimist(process.argv.slice(2))
  const createMissing = argv.createMissing === 'true' || argv.createMissing === true

  const prisma = new PrismaClient()
  try {
    const loans = await prisma.loan.findMany({ select: { id: true, company: true } })
    console.log(`Found ${loans.length} loans`)

    let createdMappings = 0
    let createdCompanies = 0

    for (const loan of loans) {
      const companies = Array.isArray(loan.company) ? loan.company : (loan.company ? [loan.company] : [])
      for (const comp of companies) {
        const normalized = String(comp || '').trim()
        if (!normalized) continue

        // find best match: exact case-insensitive value first, then startsWith (case-insensitive)
        let companyRow = await prisma.mktCompany.findFirst({ where: { value: { equals: normalized, mode: 'insensitive' } } })
        if (!companyRow) {
          companyRow = await prisma.mktCompany.findFirst({ where: { value: { startsWith: normalized.split(' ')[0] || normalized, mode: 'insensitive' } } })
        }

        if (!companyRow && createMissing) {
          companyRow = await prisma.mktCompany.create({ data: { value: normalized, label: normalized, isActive: false, emails: {} } as any })
          createdCompanies++
          console.log(`Created missing MktCompany: ${normalized} (id=${companyRow.id})`)
        }

        if (!companyRow) {
          console.warn(`No MktCompany match for '${normalized}', skipping mapping for loan ${loan.id}`)
          continue
        }

        // upsert mapping (avoid duplicates)
        const exists = await prisma.loanMktCompany.findUnique({ where: { loanId_companyId: { loanId: loan.id, companyId: companyRow.id } } }).catch(() => null)
        if (!exists) {
          await prisma.loanMktCompany.create({ data: { loanId: loan.id, companyId: companyRow.id } })
          createdMappings++
        }
      }
    }

    console.log(`Backfill complete. Created ${createdCompanies} companies and ${createdMappings} mappings.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
