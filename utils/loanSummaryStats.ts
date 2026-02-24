import { LoanData } from '../types/loan';
import { isLoanActive } from './activeLoanHelpers';
import { computeFineForLoan, isStatusEligibleForFine } from './fineSync';
import { getLoanStatus, formatLifecycleStatusLabel } from './peminjamanHelpers';
import { getOverallStatus } from './loanHelpers';
import { MarketingStats } from '../types/marketingDashboard';
import { WAREHOUSE_STATUS } from '../types/loanStatus';

const normalizeStatus = (value?: string | null) => (value ? String(value).toLowerCase() : '');

export const DEFAULT_LOAN_SUMMARY_STATS: MarketingStats = {
  totalLoans: 0,
  activeLoans: 0,
  returnedComplete: 0,
  returnedIncomplete: 0,
  returnedDamaged: 0,
  overdueLoans: 0,
  totalRejected: 0,
};

export const buildLoanSummaryStats = (loans: LoanData[]): MarketingStats => {
  if (!Array.isArray(loans) || loans.length === 0) {
    return { ...DEFAULT_LOAN_SUMMARY_STATS };
  }

  const summary: MarketingStats = {
    totalLoans: loans.length,
    activeLoans: 0,
    returnedComplete: 0,
    returnedIncomplete: 0,
    returnedDamaged: 0,
    overdueLoans: 0,
    totalRejected: 0,
  };

  loans.forEach((loan) => {
    if (isLoanActive(loan as any)) {
      summary.activeLoans += 1;
    }

    const statusText = normalizeStatus(getLoanStatus(loan as any));
    let countedDamaged = false;

    if (
      statusText.includes('rusak') ||
      statusText.includes('cacat') ||
      statusText.includes('perlu tindak lanjut') ||
      statusText.includes('followup') ||
      statusText.includes('follow-up') ||
      statusText.includes('return_followup')
    ) {
      summary.returnedDamaged += 1;
      countedDamaged = true;
    } else if (statusText.includes('tidak lengkap')) {
      summary.returnedIncomplete += 1;
    } else if (
      statusText.includes('dikembalikan') ||
      statusText.includes('returned') ||
      statusText.includes('selesai')
    ) {
      summary.returnedComplete += 1;
    }

    // Count rejects (exclude return-related rejections)
    try {
      const formatted = formatLifecycleStatusLabel(String(getLoanStatus(loan as any))).toLowerCase()
      const rawWarehouse = normalizeStatus((loan as any).warehouseStatus?.status)
      const isReturnReject = statusText.includes('return') || statusText.includes('pengembalian') || formatted.includes('pengembalian') || rawWarehouse.includes('return') || rawWarehouse.includes('pengembalian')
      if (!isReturnReject) {
        const isMarketingReject = formatted.includes('ditolak marketing') || (formatted.includes('ditolak') && formatted.includes('marketing')) || normalizeStatus(String((loan as any).loanStatus)).includes('marketing')
        const isWarehouseReject = rawWarehouse.includes('reject') || rawWarehouse.includes('wh') || rawWarehouse.includes('ditolak gudang') || rawWarehouse.includes('whrejected') || rawWarehouse === WAREHOUSE_STATUS.REJECTED.toLowerCase()
        if (isMarketingReject || isWarehouseReject) summary.totalRejected = (summary.totalRejected ?? 0) + 1
      }
    } catch (e) {}


    const overallStatus = getOverallStatus(loan as any);
    const normalizedOverall = normalizeStatus(String(overallStatus));
    if (
      !countedDamaged &&
      (
        normalizedOverall.includes('perlu tindak lanjut') ||
        normalizedOverall.includes('followup') ||
        normalizedOverall.includes('follow-up')
      )
    ) {
      summary.returnedDamaged += 1;
      countedDamaged = true;
    }

    if (isStatusEligibleForFine(overallStatus)) {
      const existingFine = (loan as any)?.totalDenda;
      const fineAmount = Number(existingFine?.fineAmount ?? 0);
      if (fineAmount > 0) {
        summary.overdueLoans += 1;
      } else {
        const computedFine = computeFineForLoan(loan as any);
        if (computedFine && computedFine.fineAmount > 0) {
          summary.overdueLoans += 1;
        }
      }
    }
  });

  return summary;
};
