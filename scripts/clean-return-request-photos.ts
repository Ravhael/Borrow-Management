import { prisma } from '../lib/prisma'

async function clean() {
  console.log('Starting cleanup of duplicate returnRequest photoResults...')
  let count = 0
  const loans = await prisma.loan.findMany({ select: { id: true, returnRequest: true } })
  for (const loan of loans) {
    if (!Array.isArray(loan.returnRequest) || loan.returnRequest.length === 0) continue
    const requests: any[] = loan.returnRequest as any[]
    const groups: Record<string, any[]> = {}
    requests.forEach(r => {
      const key = String(r.requestedAt || r.id || 'unknown')
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    let updated = false
    Object.values(groups).forEach(group => {
      // find the original submitted request
      const original = group.find(g => String(g.status || '').toLowerCase().includes('returnrequested') || String(g.status || '').toLowerCase().includes('submitted')) || group[0]
      if (!original || !original.photoResults) return
      group.forEach(g => {
        // remove duplicated photoResults in processing events
        if (g.id !== original.id && g.photoResults && g.photoResults.length > 0) {
          g.photoResults = undefined
          updated = true
        }
      })
    })
    if (updated) {
      count++
      try {
        await prisma.loan.update({ where: { id: loan.id }, data: { returnRequest: requests } })
        console.log(`Updated loan ${loan.id}`)
      } catch (err) {
        console.error(`Failed to update loan ${loan.id}`, err)
      }
    }
  }
  console.log(`Cleanup complete. Modified ${count} loans.`)
}

clean().catch(err => { console.error(err); process.exit(1) })
