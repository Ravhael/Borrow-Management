#!/usr/bin/env node
/*
  Backfill script to convert legacy extendNotification object shape to
  new structured array shape:

  [ { extendSubmitNotifications: { companies: {...} } },
    { extendApproveNotifications: { entitas: {...}, companies: {...}, borrower: {...} } } ]

  Usage:
    npx tsx scripts/backfill-extendNotification.ts         # dry-run
    npx tsx scripts/backfill-extendNotification.ts --apply # persist changes
*/

import { prisma } from '../lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log('\nBackfill extendNotification to new array shape —', apply ? 'APPLY MODE' : 'DRY-RUN (no DB changes)')

  const rows = await prisma.loan.findMany({ where: { extendNotification: { not: null } }, select: { id: true, extendNotification: true } })
  console.log(`Found ${rows.length} loan(s) with extendNotification present`)

  const toUpdate: Array<{ id: string; before: any; after: any }> = []

  for (const r of rows) {
    const id = r.id
    const en = (r.extendNotification as any) || {}

    // If already new shape (array), skip
    if (Array.isArray(en)) continue

    // Build new shapes
    const legacy = en || {}

    // Build submit notifications (Admin + Marketing only)
    const submit: any = { companies: {} }
    const oldCompanies = legacy.companies || {}
    Object.keys(oldCompanies).forEach(companyKey => {
      const src = oldCompanies[companyKey] || {}
      submit.companies[companyKey] = {}
      ;['Admin', 'Marketing'].forEach(role => {
        const entry = (src[role] || {})
        submit.companies[companyKey][role] = {
          sent: entry.sent ?? false,
          email: String(entry.email ?? ''),
          sentAt: entry.sentAt ?? ''
        }
      })
    })

    // Build approve notifications
    const approve: any = { entitas: {}, companies: {}, borrower: null }
    const oldEntitas = legacy.entitas || {}
    Object.keys(oldEntitas).forEach(entKey => {
      approve.entitas[entKey] = {}
      const src = oldEntitas[entKey] || {}
      Object.entries(src).forEach(([role, v]) => {
        approve.entitas[entKey][role] = { sent: (v as any).sent ?? false, email: String((v as any).email ?? ''), sentAt: (v as any).sentAt ?? '' }
      })
    })

    Object.keys(oldCompanies).forEach(companyKey => {
      const src = oldCompanies[companyKey] || {}
      approve.companies[companyKey] = {}
      Object.entries(src).forEach(([role, v]) => {
        approve.companies[companyKey][role] = { sent: (v as any).sent ?? false, email: String((v as any).email ?? ''), sentAt: (v as any).sentAt ?? '' }
      })
    })

    if (legacy.borrower) {
      const br = legacy.borrower || {}
      approve.borrower = { sent: br.sent ?? false, email: String(br.email ?? ''), sentAt: br.sentAt ?? '' }
    }

    const after = [{ extendSubmitNotifications: submit }, { extendApproveNotifications: approve }]

    // Skip if no significant change
    if (JSON.stringify(en) === JSON.stringify(after)) continue

    toUpdate.push({ id, before: en, after })
  }

  if (toUpdate.length === 0) {
    console.log('No extendNotification rows require normalization. Exiting.')
    process.exit(0)
  }

  console.log(`\n${toUpdate.length} loan(s) would be updated:`)
  toUpdate.forEach(item => console.log(` - ${item.id}`))

  if (!apply) {
    console.log('\nDry-run complete — run the script with --apply to persist changes.')
    process.exit(0)
  }

  for (const item of toUpdate) {
    try {
      await prisma.loan.update({ where: { id: item.id }, data: { extendNotification: item.after } })
      console.log(`[APPLIED] updated loan ${item.id}`)
    } catch (err) {
      console.error(`[FAILED] could not update loan ${item.id}`, err)
    }
  }

  console.log('\nBackfill apply complete')
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Backfill failed', err); process.exit(2) })
