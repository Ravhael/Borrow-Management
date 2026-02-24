import { generateonSubmitMarketingEmail, generateonSubmitCompanyEmail } from '../utils/emailTemplates'
import fs from 'fs'

const sample = {
  id: '0002',
  borrowerName: 'Tester',
  useDate: '2025-11-10',
  returnDate: '2025-11-15',
  company: ['Marketing - PT Sample'],
  approvals: { companies: { 'Marketing - PT Sample': { approved: true, approvedBy: 'Rizal', approvedAt: '2025-11-02T10:30:00Z', note: 'Looks good' } } }
}

const approvalInfo = {
  approverName: 'Rizal',
  approvedAt: '2025-11-02T10:30:00Z',
  duration: `${sample.useDate} → ${sample.returnDate}`,
  note: 'Looks good',
  showApprovalCta: false
}

const htmlMarketing = generateonSubmitMarketingEmail(sample as any, [], false, approvalInfo)
console.log('Marketing HTML contains "Peminjaman Telah di Approve" ->', htmlMarketing.includes('Peminjaman Telah di Approve'))
console.log('Marketing HTML contains checkmark icon ->', htmlMarketing.includes('✓') || htmlMarketing.includes('check'))
console.log('Marketing HTML contains approval note ->', htmlMarketing.includes('Catatan:') || htmlMarketing.includes('Looks good'))
console.log('Marketing HTML contains total duration (6 Hari) ->', htmlMarketing.includes('(6 Hari)'))
console.log('Marketing HTML contains CTA ->', htmlMarketing.includes('Buka Approvals'))
fs.writeFileSync('tmp_test_approved_marketing.html', htmlMarketing)

const htmlAdmin = generateonSubmitCompanyEmail(sample as any, [], 'Admin', false, approvalInfo)
console.log('Admin HTML contains "Peminjaman Telah di Approve" ->', htmlAdmin.includes('Peminjaman Telah di Approve'))
console.log('Admin HTML contains checkmark icon ->', htmlAdmin.includes('✓') || htmlAdmin.includes('check'))
console.log('Admin HTML contains approval note ->', htmlAdmin.includes('Catatan:') || htmlAdmin.includes('Looks good'))
console.log('Admin HTML contains total duration (6 Hari) ->', htmlAdmin.includes('(6 Hari)'))
fs.writeFileSync('tmp_test_approved_admin.html', htmlAdmin)

console.log('Wrote tmp_test_approved_*.html')