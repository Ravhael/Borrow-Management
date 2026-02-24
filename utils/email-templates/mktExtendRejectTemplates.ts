import { getEffectiveReturnDate } from '../loanHelpers'
import { getAppBaseUrl } from '../getAppBaseUrl'
import {
  ApprovalInfo,
  buildBorrowerEmailHtml,
  escapeHtml,
  formatDateDisplay,
  formatDateTimeDisplay,
  getEntitasName,
  removeApprovalCta,
  renderApprovedBlockHtml,
} from './shared'

type ExtendRejectionDecision = {
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  rejectionNote?: string
}

const extractExtendRejectionDecision = (loan: any, approvalInfo?: ApprovalInfo): ExtendRejectionDecision => {
  if (!loan) return {}

  const approvals = (loan.approvals?.companies as Record<string, any>) || {}
  const rejectionEntry = Object.keys(approvals).reduce<any | undefined>((acc, key) => {
    if (acc) return acc
    const entry = approvals[key]
    if (entry && (entry.approved === false || entry.rejectionReason || entry.note)) {
      return entry
    }
    return undefined
  }, undefined)

  const rejectedBy = rejectionEntry?.approvedBy || approvalInfo?.approverName
  const rejectedAt = rejectionEntry?.approvedAt || approvalInfo?.approvedAt || loan?.updatedAt || loan?.submittedAt
  const rejectionReason = rejectionEntry?.rejectionReason
    || loan?.rejectionReason
    || loan?.extendStatus?.rejectionReason
    || loan?.warehouseStatus?.rejectionReason
  const rejectionNote = rejectionEntry?.note
    || approvalInfo?.note
    || loan?.extendStatus?.note
    || loan?.warehouseStatus?.note

  return {
    rejectedBy,
    rejectedAt,
    rejectionReason,
    rejectionNote,
  }
}

export const generateExtendRejectCompanyEmail = (loan: any, _extra: any[] = [], approverLabel = 'Admin', isUpdate = false, approvalInfo?: ApprovalInfo) => {
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

  const rejectionDecision = extractExtendRejectionDecision(loan, approvalInfo)
  const rejectedByLabel = rejectionDecision.rejectedBy && String(rejectionDecision.rejectedBy).trim()
    ? String(rejectionDecision.rejectedBy).trim()
    : approverLabel || 'Marketing'
  const rejectedAtLabel = formatDateTimeDisplay(rejectionDecision.rejectedAt || loan?.updatedAt || loan?.submittedAt)
  const rejectionReasonLabel = rejectionDecision.rejectionReason && String(rejectionDecision.rejectionReason).trim()
    ? String(rejectionDecision.rejectionReason).trim()
    : 'Tidak ada alasan penolakan yang diberikan.'
  const rejectionNoteValue = rejectionDecision.rejectionNote && String(rejectionDecision.rejectionNote).trim()
    ? String(rejectionDecision.rejectionNote).trim()
    : ''
  const rejectionNoteHtml = rejectionNoteValue
    ? `<div style="background:rgba(255,255,255,0.92);padding:8px 10px;border-radius:6px;border:1px solid rgba(183,28,28,0.18);color:#5b0b0b;white-space:pre-wrap;line-height:1.45;">${escapeHtml(rejectionNoteValue)}</div>`
    : '<div style="color:#5b0b0b;opacity:0.75;">Tidak ada catatan tambahan.</div>'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:linear-gradient(120deg,#fff7f7,#fff);border-radius:10px;border:1.5px solid rgba(183,28,28,0.18);padding:16px;margin-bottom:18px;color:#5b0b0b;">
        <div style="font-size:15px;font-weight:800;margin-bottom:6px;color:#7d0f0f;">Informasi Penolakan Pengajuan Perpanjangan</div>
        <div style="font-size:13px;line-height:1.45;color:#5b0b0b;opacity:0.92;margin-bottom:12px;">
          Pengajuan perpanjangan peminjaman ini ditolak. Silakan koordinasikan dengan tim terkait untuk tindak lanjut atau perbaikan data bila diperlukan.
        </div>
        <div style="background:#fff;border-radius:10px;border:1px dashed rgba(183,28,28,0.3);padding:12px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#4a0f0f;">
            <tr>
              <td style="width:170px;padding:6px 0;font-weight:700;vertical-align:top;">Ditolak Oleh</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedByLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedAtLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Alasan Penolakan</td>
              <td style="padding:6px 0;">${escapeHtml(rejectionReasonLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Catatan Penolakan</td>
              <td style="padding:6px 0;">${rejectionNoteHtml}</td>
            </tr>
          </table>
        </div>
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

export const generateExtendRejectEntitasEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
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

  const rejectionDecision = extractExtendRejectionDecision(loan, approvalInfo)
  const rejectedByLabel = rejectionDecision.rejectedBy && String(rejectionDecision.rejectedBy).trim()
    ? String(rejectionDecision.rejectedBy).trim()
    : 'Tim Marketing'
  const rejectedAtLabel = formatDateTimeDisplay(rejectionDecision.rejectedAt || loan?.updatedAt || loan?.submittedAt)
  const rejectionReasonLabel = rejectionDecision.rejectionReason && String(rejectionDecision.rejectionReason).trim()
    ? String(rejectionDecision.rejectionReason).trim()
    : 'Tidak ada alasan penolakan yang diberikan.'
  const rejectionNoteValue = rejectionDecision.rejectionNote && String(rejectionDecision.rejectionNote).trim()
    ? String(rejectionDecision.rejectionNote).trim()
    : ''
  const rejectionNoteHtml = rejectionNoteValue
    ? `<div style="background:rgba(255,255,255,0.92);padding:8px 10px;border-radius:6px;border:1px solid rgba(183,28,28,0.18);color:#5b0b0b;white-space:pre-wrap;line-height:1.45;">${escapeHtml(rejectionNoteValue)}</div>`
    : '<div style="color:#5b0b0b;opacity:0.75;">Tidak ada catatan tambahan.</div>'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:linear-gradient(120deg,#fff7f7,#fff);border-radius:10px;border:1.5px solid rgba(183,28,28,0.18);padding:16px;margin-bottom:18px;color:#5b0b0b;">
        <div style="font-size:15px;font-weight:800;margin-bottom:6px;color:#7d0f0f;">Pengajuan Perpanjangan Ditolak</div>
        <div style="font-size:13px;line-height:1.45;color:#5b0b0b;opacity:0.92;margin-bottom:12px;">
          Notifikasi ini dikirim ke entitas peminjam sebagai catatan penolakan perpanjangan. Silakan koordinasikan dengan peminjam atau Tim Marketing untuk langkah berikutnya.
        </div>
        <div style="background:#fff;border-radius:10px;border:1px dashed rgba(183,28,28,0.3);padding:12px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#4a0f0f;">
            <tr>
              <td style="width:170px;padding:6px 0;font-weight:700;vertical-align:top;">Ditolak Oleh</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedByLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedAtLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Alasan Penolakan</td>
              <td style="padding:6px 0;">${escapeHtml(rejectionReasonLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Catatan Penolakan</td>
              <td style="padding:6px 0;">${rejectionNoteHtml}</td>
            </tr>
          </table>
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

export const generateExtendRejectBorrowerEmail = (loan: any, _extra: any[] = [], isUpdate = false, approvalInfo?: ApprovalInfo) => {
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

  const rejectionDecision = extractExtendRejectionDecision(loan, approvalInfo)
  const rejectedByLabel = rejectionDecision.rejectedBy && String(rejectionDecision.rejectedBy).trim()
    ? String(rejectionDecision.rejectedBy).trim()
    : 'Tim Marketing'
  const rejectedAtLabel = formatDateTimeDisplay(rejectionDecision.rejectedAt || loan?.updatedAt || loan?.submittedAt)
  const rejectionReasonLabel = rejectionDecision.rejectionReason && String(rejectionDecision.rejectionReason).trim()
    ? String(rejectionDecision.rejectionReason).trim()
    : 'Tidak ada alasan penolakan yang diberikan.'
  const rejectionNoteValue = rejectionDecision.rejectionNote && String(rejectionDecision.rejectionNote).trim()
    ? String(rejectionDecision.rejectionNote).trim()
    : ''
  const rejectionNoteHtml = rejectionNoteValue
    ? `<div style="background:rgba(255,255,255,0.92);padding:8px 10px;border-radius:6px;border:1px solid rgba(183,28,28,0.18);color:#5b0b0b;white-space:pre-wrap;line-height:1.45;">${escapeHtml(rejectionNoteValue)}</div>`
    : '<div style="color:#5b0b0b;opacity:0.75;">Tidak ada catatan tambahan.</div>'

  const shouldRenderApproved = Boolean(approvalInfo && (approvalInfo.approverName || approvalInfo.approvedAt))
  // Header section for generateonSubmitBorrowerEmail
  const headerHtml = shouldRenderApproved
    ? renderApprovedBlockHtml(approvalInfo as ApprovalInfo)
    : `
      <div style="background:#fff7f7;border-radius:10px;border:1.5px solid rgba(183,28,28,0.18);padding:16px;margin-bottom:18px;color:#5b0b0b;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#7d0f0f;">Halo ${borrowerName !== '-' ? escapeHtml(borrowerName) : 'Peminjam'},</div>
        <div style="font-weight:800;margin-bottom:6px;color:#7d0f0f;">Permintaan Perpanjangan Anda Ditolak</div>
        <div style="font-size:13px;color:#5b0b0b;line-height:1.4;margin-bottom:12px;">
          Kami telah meninjau pengajuan perpanjangan Anda, namun saat ini belum dapat disetujui. Silakan pelajari detail berikut sebelum melakukan pengajuan ulang.
        </div>
        <div style="background:#fff;border-radius:10px;border:1px dashed rgba(183,28,28,0.3);padding:12px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#4a0f0f;">
            <tr>
              <td style="width:170px;padding:6px 0;font-weight:700;vertical-align:top;">Ditolak Oleh</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedByLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Pada Tanggal & Waktu</td>
              <td style="padding:6px 0;">${escapeHtml(rejectedAtLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Alasan Penolakan</td>
              <td style="padding:6px 0;">${escapeHtml(rejectionReasonLabel)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:700;vertical-align:top;">Catatan Penolakan</td>
              <td style="padding:6px 0;">${rejectionNoteHtml}</td>
            </tr>
          </table>
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
