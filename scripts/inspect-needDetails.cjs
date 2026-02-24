#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const loanId = process.argv[2]
  if (loanId) {
    console.log('Inspecting single loan id:', loanId)
    const r = await prisma.loan.findUnique({ where: { id: loanId }, select: { id: true, needType: true, needDetails: true } })
    console.log(JSON.stringify(r, null, 2))
    await prisma.$disconnect()
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

  const keyCounts = {}
  rows.forEach(r => {
    const nd = r.needDetails || null
    if (!nd) return
    Object.keys(nd).forEach(k => { keyCounts[k] = (keyCounts[k] || 0) + 1 })
  })

  console.log('\n--- KEY FREQUENCY (in this sample) ---\n')
  Object.entries(keyCounts).sort((a,b)=>b[1]-a[1]).forEach(([k,c]) => console.log(k.padEnd(40)+c))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1) })
