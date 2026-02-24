import { prisma } from '../lib/prisma'

async function main() {
  const loanId = process.argv[2]
  if (loanId) {
    console.log('Inspecting single loan id:', loanId)
    const r = await prisma.loan.findUnique({ where: { id: loanId }, select: { id: true, needType: true, needDetails: true } })
    console.log(JSON.stringify(r, null, 2))
    return
  }
  console.log('Inspecting Loans.needDetails — fetching sample rows (limit 50)')

  const rows = await prisma.loan.findMany({
    take: 50,
    orderBy: { submittedAt: 'desc' },
    select: { id: true, needType: true, needDetails: true }
  })

  console.log('\n--- SAMPLE ROWS (id, needType, needDetails) ---\n')
  console.log(JSON.stringify(rows, null, 2))

  // aggregate keys usage
  const keyCounts: Record<string, number> = {}
  rows.forEach(r => {
    const nd = r.needDetails as Record<string, any> | null
    if (!nd) return
    Object.keys(nd).forEach(k => { keyCounts[k] = (keyCounts[k] || 0) + 1 })
  })

  console.log('\n--- KEY FREQUENCY (in this sample) ---\n')
  const sorted = Object.entries(keyCounts).sort((a, b) => b[1] - a[1])
  sorted.forEach(([k, c]) => console.log(k.padEnd(40) + c))

  console.log('\nIf the DB contains more rows you want checked, increase take: in this script or run without limit (careful!).')
}

main().catch(e => {
  console.error('Failed to inspect Loans.needDetails:', e)
  process.exit(1)
})
