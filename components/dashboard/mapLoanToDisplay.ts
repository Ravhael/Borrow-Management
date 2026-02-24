import { LoanData } from '../../types/loan'
import { LoanDisplay } from './LoanFieldGrid'
import { getNeedTypeLabel } from '../../utils/needTypes'
import { getEntitasName } from '../../utils/email-templates/shared'
import { getLoanStatus } from '../../utils/peminjamanHelpers'

export const mapLoanToDisplay = (loan: LoanData): LoanDisplay => {
  const companyLabel = Array.isArray(loan.company)
    ? loan.company.filter(Boolean).join(', ')
    : (loan.company as unknown as string) || null

  return {
    loanId: loan.id || null,
    borrower: loan.borrowerName || null,
    company: companyLabel,
    entitasId: loan.entitasId || null,
    entitasLabel: loan.entitasId ? getEntitasName(String(loan.entitasId)) : null,
    needType: getNeedTypeLabel(loan.needType) || loan.needType || null,
    marketing: companyLabel,
    returnDate: loan.returnDate || null,
    statusLabel: getLoanStatus(loan),
    loanStatus: loan.loanStatus || null,
    warehouseStatus: loan.warehouseStatus || null,
    returnStatus: loan.warehouseStatus?.returnStatus || null,
    extendStatus: (loan as any)?.extendStatus || null,
    totalDenda: (loan as any)?.totalDenda || null
  }
}
