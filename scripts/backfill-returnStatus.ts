#!/usr/bin/env node
/*
  Backfill script -- normalize legacy returnStatus objects

  Problem this addresses:
  - Older records incorrectly stored the previous warehouse status (e.g. 'Dipinjam') in
    returnStatus.status which makes the UI display the wrong label for the return card.

  What this script does:
  - Finds loans with a non-null returnStatus
  - If returnStatus.status !== WAREHOUSE_STATUS.RETURNED it moves that value into
    returnStatus.previousStatus (if missing) and sets returnStatus.status = WAREHOUSE_STATUS.RETURNED

  Usage:
    node -r tsx/register scripts/backfill-returnStatus.ts       # dry-run (default)
    npx tsx scripts/backfill-returnStatus.ts --apply           # apply changes

  The script is idempotent and logs changed records.
*/

import { prisma } from '../lib/prisma'
import { WAREHOUSE_STATUS } from '../types/loanStatus'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log('\nBackfill returnStatus normalization —', apply ? 'APPLY MODE' : 'DRY-RUN (no DB changes)')

  // Fetch loans where returnStatus is present
  const rows = await prisma.loan.findMany({ where: { NOT: { returnStatus: null } }, select: { id: true, returnStatus: true, warehouseStatus: true } })
  console.log(`Found ${rows.length} loan(s) with returnStatus present`)

  const toUpdate: Array<{ id: string; before: any; after: any }> = []

  for (const r of rows) {
    const id = r.id
    const rs = (r.returnStatus as any) || {}
    const ws = (r.warehouseStatus as any) || {}

    if (!rs || String(rs?.status || '').trim() === '') {
      // Nothing meaningful to normalize (no status present) — skip
      continue
    }

    // If status is already the returned token we can skip
    if (rs.status === WAREHOUSE_STATUS.RETURNED) continue

    const before = { ...rs }

    const after = { ...rs }
    // move the old status into previousStatus (if not already present)
    after.previousStatus = after.previousStatus ?? after.status ?? (ws.status ?? WAREHOUSE_STATUS.BORROWED)
    // ensure the canonical returned token is stored as the main status
    after.status = WAREHOUSE_STATUS.RETURNED

    toUpdate.push({ id, before, after })
  }

  if (toUpdate.length === 0) {
    console.log('No records require normalization. Exiting.' )
    process.exit(0)
  }

  console.log(`\n${toUpdate.length} loan(s) would be updated:`)
  toUpdate.forEach(item => console.log(` - ${item.id} : status "${item.before.status}" -> "${item.after.status}" (previousStatus will be set to "${item.after.previousStatus}")`))

  if (!apply) {
    console.log('\nDry-run complete — run the script with --apply to persist changes.')
    process.exit(0)
  }

  // Apply updates
  for (const item of toUpdate) {
    try {
      await prisma.loan.update({ where: { id: item.id }, data: { returnStatus: item.after } })
      console.log(`[APPLIED] updated loan ${item.id}`)
    } catch (err) {
      console.error(`[FAILED] could not update loan ${item.id}`, err)
    }
  }

  console.log('\nBackfill apply complete')
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Backfill script failed', err); process.exit(2) })
