import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getCanonicalRole } from '../../../config/roleConfig'
import { GoogleSheetsService } from '../../../utils/googleSheetsService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const formatApprovedAt = (date: Date) => {
    if (Number.isNaN(date.getTime())) return ''
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const get = (type: string) => parts.find(p => p.type === type)?.value || ''
      const dd = get('day')
      const mm = get('month')
      const yyyy = get('year')
      const HH = get('hour')
      const MM = get('minute')
      if (dd && mm && yyyy && HH && MM) return `${dd}-${mm}-${yyyy}/${HH}-${MM}`
    } catch (_) {
      // ignore
    }
    const pad2 = (n: number) => String(n).padStart(2, '0')
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}/${pad2(date.getHours())}-${pad2(date.getMinutes())}`
  }

  try {
    const session: any = await getServerSession(req, res, authOptions as any)
    if (!session?.user?.id) return res.status(401).json({ message: 'Not authenticated' })
    const role = getCanonicalRole(session.user.role)
    if (role !== 'admin' && role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' })

    // Fetch loans that are Approved and have no MKT Status recorded (best-effort)
    const loans = await prisma.loan.findMany({ where: { loanStatus: 'Approved' } })
    const results: Array<{ id: string; ok: boolean; message?: string }> = []

    for (const loan of loans) {
      try {
        const approvedAtText = formatApprovedAt(new Date())
        const statusText = `Status : Disetujui, Disetujui oleh : (sync), Disetujui pada : ${approvedAtText}, Catatan : (sync)`
        const ok = await GoogleSheetsService.updateMktStatusForLoan(loan, statusText)
        results.push({ id: loan.id, ok, message: ok ? 'ok' : 'failed' })
      } catch (err: any) {
        results.push({ id: loan.id, ok: false, message: String(err?.message ?? err) })
      }
    }

    return res.status(200).json({ message: 'mkt-sync completed', results })
  } catch (err: any) {
    console.error('mkt-sync failed', err)
    return res.status(500).json({ message: 'Internal server error', error: String(err?.message ?? err) })
  }
}
