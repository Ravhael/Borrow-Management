#!/usr/bin/env node
/*
  Clean up warehouseStatus JSON where return fields were mixed into the warehouseStatus object.

  This script will:
  - Find loans where returnStatus exists and warehouseStatus contains return-related fields (returnedAt, returnedBy, returnProofFiles, returnStatus) or where warehouseStatus.status == returnStatus.status
  - Trim those return-related fields from warehouseStatus, and if warehouseStatus.status equals returnStatus.status (usually 'Dikembalikan'), replace it with returnStatus.previousStatus (if available) or keep as-is

  Usage (dry-run):
    npx tsx scripts/clean-warehouseStatus-returnFields.ts
  To apply changes:
    npx tsx scripts/clean-warehouseStatus-returnFields.ts --apply

  The script is idempotent and safe to run multiple times.
*/

import { prisma } from '../lib/prisma'
import { WAREHOUSE_STATUS } from '../types/loanStatus'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log('\nClean warehouseStatus return fields —', apply ? 'APPLY MODE' : 'DRY-RUN (no DB changes)')

  const rows = await prisma.loan.findMany({ where: { NOT: { returnStatus: null } }, select: { id: true, warehouseStatus: true, returnStatus: true } })
  console.log(`Found ${rows.length} loan(s) with returnStatus present`)

  const toUpdate: Array<{ id: string; before: any; after: any }> = []

  for (const r of rows) {
    const id = r.id
    const ws = (r.warehouseStatus as any) || {}
    const rs = (r.returnStatus as any) || {}

    // Check if warehouseStatus contains any return-related keys
    const hasReturnFields = ws.returnedAt || ws.returnedBy || ws.returnProofFiles || ws.returnStatus || (rs.status && ws.status && String(ws.status).trim() === String(rs.status).trim())
    if (!hasReturnFields) continue

    const before = { ...ws }

    // Build cleaned warehouse status
    const cleaned: any = { ...ws }
    // Remove fields that belong to returnStatus
    delete cleaned.returnedAt
    delete cleaned.returnedBy
    delete cleaned.returnProofFiles
    delete cleaned.returnStatus

    // If the status currently equals the returnStatus.status (usually 'Dikembalikan'), replace with previousStatus if present
    if (rs.status && cleaned.status && String(cleaned.status).trim() === String(rs.status).trim()) {
      cleaned.status = rs.previousStatus ?? WAREHOUSE_STATUS.BORROWED
    }

    // if nothing changed, skip
    const noChange = JSON.stringify(before) === JSON.stringify(cleaned)
    if (noChange) continue

    toUpdate.push({ id, before, after: cleaned })
  }

  if (toUpdate.length === 0) {
    console.log('No warehouseStatus rows require cleaning. Exiting.')
    return process.exit(0)
  }

  console.log(`\n${toUpdate.length} loan(s) would be updated:`)
  toUpdate.forEach(item => console.log(` - ${item.id} : ${Object.keys(item.before).filter(k => !Object.keys(item.after).includes(k)).join(', ')}`))

  if (!apply) {
    console.log('\nDry-run complete — run with --apply to persist changes to the DB')
    return process.exit(0)
  }

  for (const item of toUpdate) {
    try {
      await prisma.loan.update({ where: { id: item.id }, data: { warehouseStatus: item.after } })
      console.log(`[APPLIED] cleaned warehouseStatus for loan ${item.id}`)
    } catch (err) {
      console.error(`[FAILED] could not update loan ${item.id}`, err)
    }
  }

  console.log('\nCleaning complete')
}

main().then(() => process.exit(0)).catch(err => { console.error('Script failed', err); process.exit(2) })
