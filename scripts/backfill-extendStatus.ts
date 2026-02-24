#!/usr/bin/env node
/*
  Backfill script for extendStatus normalization

  - Finds loans with a non-null extendStatus
  - If extendStatus contains legacy fields (processedAt/processedBy) moves them
    to requestAt/requestBy
  - Ensures approveAt and approveBy keys exist (null if missing)

  Usage:
    npx tsx scripts/backfill-extendStatus.ts       # dry-run (default)
    npx tsx scripts/backfill-extendStatus.ts --apply  # apply changes
*/

import { prisma } from '../lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  console.log('\nBackfill extendStatus normalization —', apply ? 'APPLY MODE' : 'DRY-RUN (no DB changes)')

  const rows = await prisma.loan.findMany({ where: { extendStatus: { not: null } }, select: { id: true, extendStatus: true } })
  console.log(`Found ${rows.length} loan(s) with extendStatus present`)

  const toUpdate: Array<{ id: string; before: any; after: any }> = []

  for (const r of rows) {
    const id = r.id
    const es = (r.extendStatus as any) || {}

    // Build the new target shape according to your requested schema
    // { note, requestedReturnDate, requestAt, requestBy, reqStatus, photoResults, approveAt, approveBy, approveNote, approveStatus, previousStatus }
    const before = es
    function normalizeEntry(el: any) {
      const e = el ?? {}
      return {
        note: e.note ?? '',
        requestedReturnDate: e.requestedReturnDate ?? '',
        requestAt: e.requestAt ?? e.processedAt ?? '',
        requestBy: e.requestBy ?? e.processedBy ?? '',
        reqStatus: (e.reqStatus ?? e.status) ?? '',
        photoResults: e.photoResults ?? [],
        approveAt: e.approveAt ?? (e.approveAt === null ? '' : ''),
        approveBy: e.approveBy ?? '',
        approveNote: e.approveNote ?? '',
        approveStatus: e.approveStatus ?? '',
        previousStatus: e.previousStatus ?? ''
      }
    }

    // 'item' isn't needed here — we'll use normalizeEntry directly below

    // If requestBy or approveBy looks like an email or id, try to resolve to user's name
    async function resolveToName(value: string) {
      if (!value || typeof value !== 'string') return value
      const trimmed = value.trim()
      if (trimmed === '') return trimmed

      // If value looks like an email, try finding user by email
      if (trimmed.includes('@')) {
        const u = await prisma.user.findUnique({ where: { email: trimmed }, select: { name: true } })
        if (u && u.name) return u.name
        return trimmed
      }

      // If value looks like a user id, try to find user's name
      try {
        const u2 = await prisma.user.findUnique({ where: { id: trimmed }, select: { name: true } })
        if (u2 && u2.name) return u2.name
      } catch (_) {
        // ignore
      }

      return trimmed
    }

    // Build normalized array from existing value
    let afterArr: any[] = []
    if (Array.isArray(es)) {
      afterArr = await Promise.all(es.map(async (el: any) => {
        const normalized = normalizeEntry(el)
        if (normalized.requestBy && typeof normalized.requestBy === 'string') normalized.requestBy = await resolveToName(normalized.requestBy)
        if (normalized.approveBy && typeof normalized.approveBy === 'string') normalized.approveBy = await resolveToName(normalized.approveBy)
        return normalized
      }))
    } else {
      // single object -> normalize and wrap
      const normalized = normalizeEntry(es)
      if (normalized.requestBy && typeof normalized.requestBy === 'string') normalized.requestBy = await resolveToName(normalized.requestBy)
      if (normalized.approveBy && typeof normalized.approveBy === 'string') normalized.approveBy = await resolveToName(normalized.approveBy)
      afterArr = [normalized]
    }

    // Skip if already equal
    if (JSON.stringify(before) === JSON.stringify(afterArr)) continue

    toUpdate.push({ id, before, after: afterArr })
  }

  if (toUpdate.length === 0) {
    console.log('No extendStatus rows require normalization. Exiting.')
    process.exit(0)
  }

  console.log(`\n${toUpdate.length} loan(s) would be updated:`)
  toUpdate.forEach(item => console.log(` - ${item.id} : keys changed: ${Object.keys(item.before).filter(k => !(k in item.after)).join(', ')} -> ${Object.keys(item.after).filter(k => !(k in item.before)).join(', ')}`))

  if (!apply) {
    console.log('\nDry-run complete — run the script with --apply to persist changes.')
    process.exit(0)
  }

  for (const item of toUpdate) {
    try {
      await prisma.loan.update({ where: { id: item.id }, data: { extendStatus: item.after } })
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
