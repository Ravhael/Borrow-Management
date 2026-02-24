import { UserRole } from '../types/sidebar'

// Define which stat keys each role is allowed to see.
// Keys correspond to the metric property names used in `stats` objects.
export const allowedStatsByRole: Record<UserRole, string[]> = {
  superadmin: [
    'totalLoans',
    'activeLoans',
    'totalRejected',
    'overdueLoans',
    'returnedComplete',
    'returnedIncomplete',
    'returnedDamaged',
    'totalFine',
    'pendingApprovals',
    'waitingApprovals'
  ],
  admin: [
    'totalLoans',
    'activeLoans',
    'totalRejected',
    'overdueLoans',
    'returnedComplete',
    'returnedIncomplete',
    'returnedDamaged',
    'totalFine',
    'pendingApprovals',
    'waitingApprovals'
  ],
  marketing: [
    'totalLoans',
    'activeLoans',
    'pendingApprovals',
    'waitingApprovals',
    'returnedComplete',
    'returnedIncomplete',
    'overdueLoans'
  ],
  gudang: [
    'totalLoans',
    'activeLoans',
    'totalRejected',
    'overdueLoans',
    'returnedComplete',
    'returnedIncomplete',
    'returnedDamaged'
  ],
  regular: [
    'totalLoans',
    'activeLoans',
    'overdueLoans',
    'completedLoans',
    'totalFine'
  ]
}

export const isStatAllowedForRole = (statKey: string, roleKey: UserRole) => {
  const allowed = allowedStatsByRole[roleKey] || []
  return allowed.includes(statKey)
}
