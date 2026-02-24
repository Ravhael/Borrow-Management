import { getEffectiveReturnDate } from '../loanHelpers'
import { getAppBaseUrl } from '../getAppBaseUrl'
import {
  ApprovalInfo,
  buildBorrowerEmailHtml,
  formatDateDisplay,
  formatDateTimeDisplay,
  getEntitasName,
  removeApprovalCta,
  renderApprovedBlockHtml,
} from './shared'

export const generateonSubmitMarketingEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  if (!loan) {
    return `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`
  }

  const submittedAt = formatDateTimeDisplay(loan.submittedAt)
  const borrowerName = loan.borrowerName && loan.borrowerName.trim() ? loan.borrowerName : '-'
  const entitasName = loan.entitasId && String(loan.entitasId).trim() ? getEntitasName(loan.entitasId) : '-'
  const borrowerPhone = loan.borrowerPhone && loan.borrowerPhone.trim() ? loan.borrowerPhone : '-'
  const needType = loan.needType && String(loan.needType).trim() ? loan.needType : '-'
  const needDetailsVisibleTypes = ['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA']
  const needTypeKey = String(loan.needType || '').toUpperCase()
  const showNeedDetailsSection = needDetailsVisibleTypes.includes(needTypeKey)
  const customerName = (loan.needDetails?.customerName || loan.needDetails?.namaCustomer) && String(loan.needDetails?.customerName || loan.needDetails?.namaCustomer).trim()
    ? loan.needDetails?.customerName || loan.needDetails?.namaCustomer
    : '-'
  const companyName = (loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan) && String(loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan).trim()
    ? loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan
    : '-'
  const address = (loan.needDetails?.address || loan.needDetails?.alamat) && String(loan.needDetails?.address || loan.needDetails?.alamat).trim()
    ? loan.needDetails?.address || loan.needDetails?.alamat
    : '-'
  const phone = (loan.needDetails?.phone || loan.needDetails?.telepon) && String(loan.needDetails?.phone || loan.needDetails?.telepon).trim()
    ? loan.needDetails?.phone || loan.needDetails?.telepon
    : '-'
  const marketingCompany = loan.company && loan.company.length > 0 && loan.company[0] !== '' ? loan.company.join(', ') : '-'
  const outDate = formatDateDisplay(loan.outDate)
  const useDate = formatDateDisplay(loan.useDate)
  const effectiveReturn = getEffectiveReturnDate(loan)
  const returnDate = formatDateDisplay(effectiveReturn || loan.returnDate)
  const productDetails = loan.productDetailsText && loan.productDetailsText.trim() ? loan.productDetailsText : loan.productDetails || '-'
  const pickupMethod = loan.pickupMethod && loan.pickupMethod.trim() ? loan.pickupMethod : '-'
  const note = loan.note && loan.note.trim() ? loan.note : '-'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:#f6fbff;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:12px 14px;margin-bottom:14px;color:#0d2b4e;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0b2545;">Dear Marketing,</div>
        <div style="font-weight:700;margin-bottom:6px;color:#0b2545;">Permintaan Tinjau & Persetujuan</div>
        <div style="font-size:13px;color:#24425f;line-height:1.4;">
          Notifikasi ini dikirim kepada tim Marketing untuk ditinjau dan disetujui. Mohon periksa detail permintaan peminjaman di bawah ini dan lakukan tindakan (Approve / Reject). Jika ada koreksi, tambahkan catatan pada system FormFlow.
        </div>
      </div>
    `

  const footerHtml = `
          <!-- Approval CTA (moved to bottom) -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;padding-top:18px;border-top:1px dashed rgba(16,40,67,0.06);margin-top:22px;">
            <tr>
              <td align="center">
                <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;text-align:center;font-size:13px;color:#3a5568;opacity:0.95;vertical-align:middle;padding-right:12px;">Silakan tinjau dan setujui/menolak permintaan ini pada System FormFlow melalui button ini  (Form #${loan.id || loan.form_number || '-'}):</td>
                    <td style="padding:10px 0;text-align:center;vertical-align:middle;">
                      <a href="${getAppBaseUrl()}/peminjaman/${loan.id || loan.form_number || ''}?mode=approve" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                        <div style="display:inline-block;background:linear-gradient(135deg,#1976d2,#0d47a1);color:white;padding:10px 14px;border-radius:8px;font-weight:700;">Buka Approvals</div>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
  `

  let out = buildBorrowerEmailHtml({
    isUpdate,
    submittedAt,
    formNumber: loan.id || loan.form_number || '-',
    borrowerName,
    entitasName,
    borrowerPhone,
    needType,
    showNeedDetailsSection,
    customerName,
    companyName,
    address,
    phone,
    marketingCompany,
    outDate,
    useDate,
    returnDate,
    productDetails,
    pickupMethod,
    note,
    headerHtml,
    footerHtml,
    heroBadgeLabel: 'MKT',
  })

  const showApprovalCta = approvalInfo?.showApprovalCta ?? true
  if (!showApprovalCta) {
    out = removeApprovalCta(out)
  }

  return out
}

export const generateonSubmitCompanyEmail = (loan: any, _extra: any[] = [], approverLabel = 'Admin', isUpdate = false, approvalInfo?: ApprovalInfo) => {
  if (!loan) {
    return `<div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`
  }

  const id = loan?.id || loan?.form_number || '-'
  const submittedAt = formatDateTimeDisplay(loan?.submittedAt)
  const borrowerName = loan?.borrowerName && loan.borrowerName.trim() ? loan.borrowerName : '-'
  const entitasName = loan?.entitasId && String(loan.entitasId).trim() ? getEntitasName(loan.entitasId) : '-'
  const borrowerPhone = loan?.borrowerPhone && loan.borrowerPhone.trim() ? loan.borrowerPhone : '-'
  const needType = loan?.needType && String(loan.needType).trim() ? loan.needType : '-'
  const needDetailsVisibleTypes = ['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA']
  const needTypeKey = String(loan?.needType || '').toUpperCase()
  const showNeedDetailsSection = needDetailsVisibleTypes.includes(needTypeKey)
  const customerName = (loan?.needDetails?.customerName || loan?.needDetails?.namaCustomer) && String(loan?.needDetails?.customerName || loan?.needDetails?.namaCustomer).trim()
    ? loan?.needDetails?.customerName || loan?.needDetails?.namaCustomer
    : '-'
  const companyName = (loan?.needDetails?.companyName || loan?.needDetails?.namaPerusahaan) && String(loan?.needDetails?.companyName || loan?.needDetails?.namaPerusahaan).trim()
    ? loan?.needDetails?.companyName || loan?.needDetails?.namaPerusahaan
    : '-'
  const address = (loan?.needDetails?.address || loan?.needDetails?.alamat) && String(loan?.needDetails?.address || loan?.needDetails?.alamat).trim()
    ? loan?.needDetails?.address || loan?.needDetails?.alamat
    : '-'
  const phone = (loan?.needDetails?.phone || loan?.needDetails?.telepon) && String(loan?.needDetails?.phone || loan?.needDetails?.telepon).trim()
    ? loan?.needDetails?.phone || loan?.needDetails?.telepon
    : '-'
  const marketingCompany = loan?.company && loan.company.length > 0 && loan.company[0] !== '' ? loan.company.join(', ') : '-'
  const outDate = formatDateDisplay(loan?.outDate)
  const useDate = formatDateDisplay(loan?.useDate)
  const effectiveReturn = getEffectiveReturnDate(loan)
  const returnDate = formatDateDisplay(effectiveReturn || loan?.returnDate)
  const productDetails = loan?.productDetailsText && loan.productDetailsText.trim() ? loan.productDetailsText : loan?.productDetails || '-'
  const pickupMethod = loan?.pickupMethod && loan.pickupMethod.trim() ? loan.pickupMethod : '-'
  const note = loan?.note && loan.note.trim() ? loan.note : '-'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:#f6fbff;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:12px 14px;margin-bottom:14px;color:#0d2b4e;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0b2545;">Halo,</div>
        <div style="font-weight:700;margin-bottom:6px;color:#0b2545;">Berikut Informasi Permintaan Peminjaman</div>
        <div style="font-size:13px;color:#24425f;line-height:1.4;">Permintaan ini perlu ditinjau dan di Approve / Reject oleh Marketing.</div>
      </div>
    `

  return buildBorrowerEmailHtml({
    isUpdate,
    submittedAt,
    formNumber: id,
    borrowerName,
    entitasName,
    borrowerPhone,
    needType,
    showNeedDetailsSection,
    customerName,
    companyName,
    address,
    phone,
    marketingCompany,
    outDate,
    useDate,
    returnDate,
    productDetails,
    pickupMethod,
    note,
    headerHtml,
    heroBadgeLabel: 'ADM',
  })
}

export const generateonSubmitEntitasEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  if (!loan) {
    return `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`
  }
  const submittedAt = formatDateTimeDisplay(loan.submittedAt)
  const borrowerName = loan.borrowerName && loan.borrowerName.trim() ? loan.borrowerName : '-'
  const entitasName = loan.entitasId && String(loan.entitasId).trim() ? getEntitasName(loan.entitasId) : '-'
  const borrowerPhone = loan.borrowerPhone && loan.borrowerPhone.trim() ? loan.borrowerPhone : '-'
  const needType = loan.needType && String(loan.needType).trim() ? loan.needType : '-'
  const needDetailsVisibleTypes = ['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA']
  const needTypeKey = String(loan.needType || '').toUpperCase()
  const showNeedDetailsSection = needDetailsVisibleTypes.includes(needTypeKey)
  const customerName = (loan.needDetails?.customerName || loan.needDetails?.namaCustomer) && String(loan.needDetails?.customerName || loan.needDetails?.namaCustomer).trim()
    ? loan.needDetails?.customerName || loan.needDetails?.namaCustomer
    : '-'
  const companyName = (loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan) && String(loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan).trim()
    ? loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan
    : '-'
  const address = (loan.needDetails?.address || loan.needDetails?.alamat) && String(loan.needDetails?.address || loan.needDetails?.alamat).trim()
    ? loan.needDetails?.address || loan.needDetails?.alamat
    : '-'
  const phone = (loan.needDetails?.phone || loan.needDetails?.telepon) && String(loan.needDetails?.phone || loan.needDetails?.telepon).trim()
    ? loan.needDetails?.phone || loan.needDetails?.telepon
    : '-'
  const marketingCompany = loan.company && loan.company.length > 0 && loan.company[0] !== '' ? loan.company.join(', ') : '-'
  const outDate = formatDateDisplay(loan.outDate)
  const useDate = formatDateDisplay(loan.useDate)
  const effectiveReturn = getEffectiveReturnDate(loan)
  const returnDate = formatDateDisplay(effectiveReturn || loan.returnDate)
  const productDetails = loan.productDetailsText && loan.productDetailsText.trim() ? loan.productDetailsText : loan.productDetails || '-'
  const pickupMethod = loan.pickupMethod && loan.pickupMethod.trim() ? loan.pickupMethod : '-'
  const note = loan.note && loan.note.trim() ? loan.note : '-'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:#f6fbff;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:12px 14px;margin-bottom:14px;color:#0d2b4e;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0b2545;">Halo,</div>
        <div style="font-weight:700;margin-bottom:6px;color:#0b2545;">Permintaan Peminjaman Baru</div>
        <div style="font-size:13px;color:#24425f;line-height:1.4;">
          Notifikasi ini dikirim kepada entitas peminjam. Berikut informasi permintaan peminjaman yang telah diajukan oleh peminjam.
        </div>
      </div>
    `

  return buildBorrowerEmailHtml({
    isUpdate,
    submittedAt,
    formNumber: loan.id || loan.form_number || '-',
    borrowerName,
    entitasName,
    borrowerPhone,
    needType,
    showNeedDetailsSection,
    customerName,
    companyName,
    address,
    phone,
    marketingCompany,
    outDate,
    useDate,
    returnDate,
    productDetails,
    pickupMethod,
    note,
    headerHtml,
    heroBadgeLabel: 'PJM',
  })
}

export const generateonSubmitBorrowerEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
  if (!loan) {
    return `
      <div style="padding:16px;font-family:Arial, sans-serif;color:#b71c1c;background:#fff3f3;border-radius:6px;border:1px solid rgba(183,28,28,0.08)">No persisted loan found — preview requires a loan stored in the DB.</div>`
  }

  const submittedAt = formatDateTimeDisplay(loan.submittedAt)
  const borrowerName = loan.borrowerName && loan.borrowerName.trim() ? loan.borrowerName : '-'
  const entitasName = loan.entitasId && String(loan.entitasId).trim() ? getEntitasName(loan.entitasId) : '-'
  const borrowerPhone = loan.borrowerPhone && loan.borrowerPhone.trim() ? loan.borrowerPhone : '-'
  const needType = loan.needType && String(loan.needType).trim() ? loan.needType : '-'
  const needDetailsVisibleTypes = ['DEMO_PRODUCT', 'BARANG_BACKUP', 'LAINNYA']
  const needTypeKey = String(loan.needType || '').toUpperCase()
  const showNeedDetailsSection = needDetailsVisibleTypes.includes(needTypeKey)
  const customerName = (loan.needDetails?.customerName || loan.needDetails?.namaCustomer) && String(loan.needDetails?.customerName || loan.needDetails?.namaCustomer).trim()
    ? loan.needDetails?.customerName || loan.needDetails?.namaCustomer
    : '-'
  const companyName = (loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan) && String(loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan).trim()
    ? loan.needDetails?.companyName || loan.needDetails?.namaPerusahaan
    : '-'
  const address = (loan.needDetails?.address || loan.needDetails?.alamat) && String(loan.needDetails?.address || loan.needDetails?.alamat).trim()
    ? loan.needDetails?.address || loan.needDetails?.alamat
    : '-'
  const phone = (loan.needDetails?.phone || loan.needDetails?.telepon) && String(loan.needDetails?.phone || loan.needDetails?.telepon).trim()
    ? loan.needDetails?.phone || loan.needDetails?.telepon
    : '-'
  const marketingCompany = loan.company && loan.company.length > 0 && loan.company[0] !== '' ? loan.company.join(', ') : '-'
  const outDate = formatDateDisplay(loan.outDate)
  const useDate = formatDateDisplay(loan.useDate)
  const effectiveReturn = getEffectiveReturnDate(loan)
  const returnDate = formatDateDisplay(effectiveReturn || loan.returnDate)
  const productDetails = loan.productDetailsText && loan.productDetailsText.trim() ? loan.productDetailsText : loan.productDetails || '-'
  const pickupMethod = loan.pickupMethod && loan.pickupMethod.trim() ? loan.pickupMethod : '-'
  const note = loan.note && loan.note.trim() ? loan.note : '-'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  // Header section for generateonSubmitBorrowerEmail
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:#fffef6;border-radius:8px;border:1.5px solid rgba(115, 125, 93, 0.09);padding:12px 14px;margin-bottom:14px;color:#333;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0b2545;">Halo ${borrowerName !== '-' ? borrowerName : 'Peminjam'},</div>
        <div style="font-weight:700;margin-bottom:6px;color:#0b2545;">Permintaan Peminjaman Anda Telah Diterima</div>
        <div style="font-size:13px;color:#24425f;line-height:1.4;">
          Terima kasih! Permintaan peminjaman Anda telah diterima. Kami akan meninjau dan memproses permintaan ini. Berikut adalah rincian permintaan Anda.
        </div>
      </div>
    `

  let out = buildBorrowerEmailHtml({
    isUpdate,
    submittedAt,
    formNumber: loan.id || loan.form_number || '-',
    borrowerName,
    entitasName,
    borrowerPhone,
    needType,
    showNeedDetailsSection,
    customerName,
    companyName,
    address,
    phone,
    marketingCompany,
    outDate,
    useDate,
    returnDate,
    productDetails,
    pickupMethod,
    note,
    headerHtml,
  })

  const showApprovalCta = approvalInfo?.showApprovalCta ?? false
  if (!showApprovalCta) {
    out = removeApprovalCta(out)
  }

  return out
}
