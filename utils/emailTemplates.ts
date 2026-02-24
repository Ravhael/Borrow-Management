import { generateAccountApprovalEmail, generateAccountCreationEmail, generatePasswordResetEmail } from './email-templates/authTemplates'
import { generateonSubmitCompanyEmail, generateonSubmitMarketingEmail, generateonSubmitEntitasEmail, generateonSubmitBorrowerEmail } from './email-templates/onSubmitTemplates'
import { computeDurationDays, generateApprovedBorrowerEmail, generateApprovedCompanyEmail, generateApprovedEntitasEmail, generateApprovedWarehouseEmail, makeApprovedHtml, stripApprovalCta } from './email-templates/approvedTemplates'
import {
  applyExtendSubmitCopy,
  buildExtendSummaryBlock,
  formatExtendTimestamp as formatExtendRequestTimestamp,
  generateExtendSubBorrowerEmail,
  generateExtendSubCompanyEmail,
  generateExtendSubEntitasEmail,
  generateExtendSubMarketingEmail,
} from './email-templates/extendRequestTemplates'
import {
  buildExtendDecisionBlock,
  describeExtendDecision,
  formatExtendTimestamp as formatExtendDecisionTimestamp,
  makeExtendDecisionHtml,
  generateExtendAppBorrowerEmail,
  generateExtendAppCompanyEmail,
  generateExtendAppEntitasEmail,
} from './email-templates/extendApprovedTemplates'
import {
  formatDurationRange,
  formatLateDays,
  formatReturnTimestamp,
  makeReturnedHtml,
  renderReturnedBlock,
  generateReturnedAppBorrowerEmail,
  generateReturnedAppCompanyEmail,
  generateReturnedAppEntitasEmail,
} from './email-templates/returnedApprovedTemplates'
import { applyReturnRequestCopy, buildReturnRequestBlock, formatReturnRequestTimestamp, generateReturnedSubpBorrowerEmail, generateReturnedSubCompanyEmail, generateReturnedSubEntitasEmail, generateReturnedSubWarehouseEmail } from './email-templates/returnedRequestTemplates'
import { buildReminderSubject, computeDaysUntil, formatReminderCountdown, formatReminderUrgency, makeReminderHtml, renderReminderBeforeBlock } from './email-templates/reminderShared'
import { generateReminderBeforeBorrowerEmail, generateReminderBeforeCompanyEmail, generateReminderBeforeEntitasEmail } from './email-templates/reminderBeforeTemplates'
import { generateReminderAfterBorrowerEmail, generateReminderAfterCompanyEmail, generateReminderAfterEntitasEmail } from './email-templates/reminderAfterTemplates'
import { buildCompletedInfo, generateCompletedBorrowerEmail, generateCompletedCompanyEmail, generateCompletedEntitasEmail, makeCompletedHtml } from './email-templates/statusCompletedTemplates'

export type { ApprovalInfo } from './email-templates/shared'
export type { ExtendRequestInfo } from './email-templates/extendRequestTemplates'
export type { ExtendDecisionInfo, ExtendDecisionSummary } from './email-templates/extendApprovedTemplates'
export type { ReturnBlockInfo } from './email-templates/returnedApprovedTemplates'
export type { ReturnRequestInfo, ReturnRequestOptions } from './email-templates/returnedRequestTemplates'
export type { ReminderBeforeInfo } from './email-templates/reminderShared'
export type { CompletedInfo } from './email-templates/statusCompletedTemplates'

export {
  // account/auth flows
  generatePasswordResetEmail,
  generateAccountCreationEmail,
  generateAccountApprovalEmail,
  // submission notifications
  generateonSubmitMarketingEmail,
  generateonSubmitCompanyEmail,
  generateonSubmitEntitasEmail,
  generateonSubmitBorrowerEmail,
  // approved/decision helpers
  makeApprovedHtml,
  computeDurationDays,
  stripApprovalCta,
  generateApprovedBorrowerEmail,
  generateApprovedCompanyEmail,
  generateApprovedEntitasEmail,
  generateApprovedWarehouseEmail,
  makeExtendDecisionHtml,
  buildExtendDecisionBlock,
  describeExtendDecision,
  formatExtendDecisionTimestamp,
  generateExtendAppBorrowerEmail,
  generateExtendAppCompanyEmail,
  generateExtendAppEntitasEmail,
  // extend submission helpers
  applyExtendSubmitCopy,
  buildExtendSummaryBlock,
  formatExtendRequestTimestamp,
  generateExtendSubBorrowerEmail,
  generateExtendSubCompanyEmail,
  generateExtendSubEntitasEmail,
  generateExtendSubMarketingEmail,
  // returned status helpers
  makeReturnedHtml,
  renderReturnedBlock,
  formatReturnTimestamp,
  formatDurationRange,
  formatLateDays,
  generateReturnedAppBorrowerEmail,
  generateReturnedAppCompanyEmail,
  generateReturnedAppEntitasEmail,
  // return request generators
  applyReturnRequestCopy,
  buildReturnRequestBlock,
  formatReturnRequestTimestamp,
  generateReturnedSubpBorrowerEmail,
  generateReturnedSubCompanyEmail,
  generateReturnedSubEntitasEmail,
  generateReturnedSubWarehouseEmail,
  // reminder helpers
  makeReminderHtml,
  renderReminderBeforeBlock,
  computeDaysUntil,
  formatReminderCountdown,
  formatReminderUrgency,
  buildReminderSubject,
  generateReminderBeforeBorrowerEmail,
  generateReminderBeforeCompanyEmail,
  generateReminderBeforeEntitasEmail,
  generateReminderAfterBorrowerEmail,
  generateReminderAfterCompanyEmail,
  generateReminderAfterEntitasEmail,
  // completed status generators
  makeCompletedHtml,
  buildCompletedInfo,
  generateCompletedBorrowerEmail,
  generateCompletedCompanyEmail,
  generateCompletedEntitasEmail
}

const emailTemplates = {
  generatePasswordResetEmail,
  generateAccountCreationEmail,
  generateAccountApprovalEmail,
  generateonSubmitMarketingEmail,
  generateonSubmitCompanyEmail,
  generateonSubmitEntitasEmail,
  generateonSubmitBorrowerEmail,
  makeApprovedHtml,
  makeReturnedHtml,
  makeReminderHtml,
  makeCompletedHtml,
  generateApprovedBorrowerEmail,
  generateApprovedCompanyEmail,
  generateApprovedEntitasEmail,
  generateApprovedWarehouseEmail,
  generateExtendAppBorrowerEmail,
  generateExtendAppCompanyEmail,
  generateExtendAppEntitasEmail,
  generateReturnedAppBorrowerEmail,
  generateReturnedAppCompanyEmail,
  generateReturnedAppEntitasEmail,
  generateExtendSubBorrowerEmail,
  generateExtendSubCompanyEmail,
  generateExtendSubEntitasEmail,
  generateExtendSubMarketingEmail,
  generateReturnedSubpBorrowerEmail,
  generateReturnedSubCompanyEmail,
  generateReturnedSubEntitasEmail,
  generateReturnedSubWarehouseEmail,
  generateReminderBeforeBorrowerEmail,
  generateReminderBeforeCompanyEmail,
  generateReminderBeforeEntitasEmail,
  generateReminderAfterBorrowerEmail,
  generateReminderAfterCompanyEmail,
  generateReminderAfterEntitasEmail,
  buildCompletedInfo,
  generateCompletedBorrowerEmail,
  generateCompletedCompanyEmail,
  generateCompletedEntitasEmail
}

export default emailTemplates