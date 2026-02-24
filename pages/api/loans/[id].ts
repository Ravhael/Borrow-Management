import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { requireCrudPermission } from '../../../utils/authorization'

// Runtime uses the Loans DB table — data/loans.json is a seed fixture only

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID is required' })
  }

  try {
    if (req.method === 'GET') {
      const loan = await prisma.loan.findUnique({ where: { id } })
      if (!loan) return res.status(404).json({ message: 'Loan not found' })
      // enforce read permission: only allow if role/user has read on this loan
      // include company values both from loan.company and any mapped MktCompany associations
      const companyValuesFromLoan = Array.isArray(loan.company) ? loan.company : (loan.company ? [loan.company] : [])
      const mappedValuesRows = await prisma.loanMktCompany.findMany({ where: { loanId: loan.id }, select: { mktCompany: { select: { value: true } } as any } })
      const mappedValues = mappedValuesRows?.map(r => (r as any).mktCompany?.value).filter(Boolean) || []
      const resourceCompanyValues = Array.from(new Set([...(companyValuesFromLoan || []), ...(mappedValues || [])]))

      const permCheck = await requireCrudPermission({
        req,
        res,
        action: 'read',
        resourceOwnerId: loan.userId,
        resourceName: 'loan',
        resourceEntitasId: loan.entitasId ?? null,
        resourceCompanyValues
      })
      if (!permCheck) return // response already sent by helper
      return res.status(200).json(loan)
    }

    if (req.method === 'PUT') {
      const updateData = req.body
      try {
        const existing = await prisma.loan.findUnique({ where: { id } })
        if (!existing) return res.status(404).json({ message: 'Loan not found' })
        // require admin or the loan owner to perform updates
        const { getServerSession } = await import('next-auth/next')
        const { authOptions } = await import('../auth/[...nextauth]')
        const sessionAny: any = await getServerSession(req, res, authOptions as any)
        if (!sessionAny || !sessionAny.user) return res.status(401).json({ message: 'Not authenticated' })
        const role = (await import('../../../config/roleConfig')).getCanonicalRole(sessionAny.user.role)
        if (!(role === 'admin' || role === 'superadmin')) {
          if (String(existing.userId) !== String(sessionAny.user.id)) return res.status(403).json({ message: 'Forbidden' })
        }
        const updated = await prisma.loan.update({ where: { id }, data: updateData })
        return res.status(200).json(updated)
      } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ message: 'Loan not found' })
        throw err
      }
    }

    if (req.method === 'DELETE') {
      try {
        const existing = await prisma.loan.findUnique({ where: { id } })
        if (!existing) return res.status(404).json({ message: 'Loan not found' })
        const permCheck = await requireCrudPermission({ req, res, action: 'delete', resourceOwnerId: existing.userId, resourceName: 'loan' })
        if (!permCheck) return // response already sent by helper
        await prisma.loan.delete({ where: { id } })
        return res.status(200).json({ message: 'Loan deleted successfully' })
      } catch (err: any) {
        if (err.code === 'P2025') return res.status(404).json({ message: 'Loan not found' })
        throw err
      }
    }
  } catch (error) {
    console.error('Error processing loan:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan saat memproses data' })
  }
}