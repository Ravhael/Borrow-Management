#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Backfill script: scanning loans for normalization issues')

  const loans = await prisma.loan.findMany()
  console.log(`Found ${loans.length} loans in DB`)

  const updates: Array<{ id: string; changes: any }> = []

  for (const loan of loans) {
    const change: any = {}
    // Normalize warehouseStatus: empty-string status is ambiguous — remove it so getLoanStatus will not return empty string
    const ws = loan.warehouseStatus as any
    if (ws && typeof ws === 'object') {
      const status = (ws.status || '') as string
      if (typeof status === 'string' && status.trim() === '') {
        // set warehouseStatus to null to avoid empty-string status
        change.warehouseStatus = null
      }
    }

    // Normalize approvals: remove empty-string keys and coerce companies -> object if present
    const approvals = loan.approvals as any
    if (approvals && typeof approvals === 'object') {
      if (approvals.companies && typeof approvals.companies === 'object') {
        const keys = Object.keys(approvals.companies)
        // if only a single empty key like "" exists, drop it
        if (keys.length === 1 && keys[0].trim() === '') {
          change.approvals = { companies: {} }
        } else if (keys.length > 0 && keys.some(k => k.trim() === '')) {
          const cleaned: Record<string, any> = {}
          for (const k of keys) {
            if (k.trim() === '') continue
            cleaned[k] = approvals.companies[k]
          }
          change.approvals = { companies: cleaned }
        }
      }
    }

    if (Object.keys(change).length > 0) {
      updates.push({ id: loan.id, changes: change })
    }
  }

  if (updates.length === 0) {
    console.log('No loans require normalization. Done.')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${updates.length} loans that would be updated.`)

  const args = process.argv.slice(2)
  const apply = args.includes('--apply') || args.includes('-a')

  if (!apply) {
    console.log('Dry run mode (no changes applied). Use --apply to write changes.')
    for (const u of updates) {
      console.log(`Would update loan ${u.id}: ${JSON.stringify(u.changes)}`)
    }
    await prisma.$disconnect()
    return
  }

  console.log('Applying updates...')
  let applied = 0
  for (const u of updates) {
    try {
      await prisma.loan.update({ where: { id: u.id }, data: u.changes as any })
      applied++
      console.log(`Updated ${u.id}`)
    } catch (err) {
      console.error(`Failed to update ${u.id}:`, (err as Error).message)
    }
  }

  console.log(`Applied ${applied}/${updates.length} updates.`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
