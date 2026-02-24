import { entitasOptions } from '../../data/entitas'

export type ApprovalInfo = {
  approverName?: string
  approvedAt?: string
  duration?: string
  note?: string
  showApprovalCta?: boolean
}

export function escapeHtml(input: any): string {
  if (input === undefined || input === null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getEntitasName(entitasId: string): string {
  const id = parseInt(entitasId)
  return entitasOptions.find(e => e.id === id)?.label || entitasId
}

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const MONTH_LOOKUP_ENTRIES: Array<[string, number]> = [
  ['jan', 0],
  ['januari', 0],
  ['feb', 1],
  ['februari', 1],
  ['mar', 2],
  ['maret', 2],
  ['apr', 3],
  ['april', 3],
  ['mei', 4],
  ['jun', 5],
  ['juni', 5],
  ['jul', 6],
  ['juli', 6],
  ['agt', 7],
  ['ags', 7],
  ['agu', 7],
  ['agust', 7],
  ['agustus', 7],
  ['sep', 8],
  ['sept', 8],
  ['september', 8],
  ['okt', 9],
  ['oktober', 9],
  ['nov', 10],
  ['november', 10],
  ['des', 11],
  ['desember', 11],
]

const MONTH_LOOKUP = new Map(MONTH_LOOKUP_ENTRIES)

type DateLike = string | number | Date | null | undefined

const pad2 = (value: number): string => (value < 10 ? `0${value}` : String(value))

const coerceYear = (value: number): number => {
  if (value < 100) {
    return value + 2000
  }
  return value
}

const buildDateFromParts = (dayToken: number, monthToken: string, yearToken: number): Date | null => {
  const normalizedYear = coerceYear(yearToken)
  const day = Number.isFinite(dayToken) ? dayToken : Number(dayToken)
  if (!Number.isFinite(day) || day <= 0 || day > 31) return null
  const numericMonth = Number.isNaN(Number(monthToken)) ? undefined : parseInt(monthToken, 10)
  let monthIndex: number | undefined
  if (numericMonth !== undefined) {
    monthIndex = numericMonth - 1
  } else {
    monthIndex = MONTH_LOOKUP.get(monthToken.toLowerCase())
  }
  if (monthIndex === undefined || monthIndex < 0 || monthIndex > 11) return null
  const date = new Date(normalizedYear, monthIndex, day)
  return Number.isNaN(date.getTime()) ? null : date
}

const tryParseFromStringTokens = (value: string): Date | null => {
  const slashParts = value.split('/')
  if (slashParts.length === 3) {
    const [dToken, mToken, yToken] = slashParts.map(part => part.trim())
    const day = parseInt(dToken, 10)
    const year = parseInt(yToken, 10)
    if (Number.isFinite(day) && Number.isFinite(year)) {
      const maybeDate = buildDateFromParts(day, mToken, year)
      if (maybeDate) return maybeDate
    }
  }

  const textMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})/)
  if (textMatch) {
    const [, dToken, mToken, yToken] = textMatch
    const day = parseInt(dToken, 10)
    const year = parseInt(yToken, 10)
    if (Number.isFinite(day) && Number.isFinite(year)) {
      const maybeDate = buildDateFromParts(day, mToken, year)
      if (maybeDate) return maybeDate
    }
  }

  const dashMatch = value.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/)
  if (dashMatch) {
    const [, dToken, mToken, yToken] = dashMatch
    const day = parseInt(dToken, 10)
    const month = parseInt(mToken, 10)
    const year = parseInt(yToken, 10)
    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
      const maybeDate = buildDateFromParts(day, String(month), year)
      if (maybeDate) return maybeDate
    }
  }

  return null
}

export const normalizeDateInput = (value?: DateLike): Date | null => {
  if (value === undefined || value === null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) return parsed
    return tryParseFromStringTokens(trimmed)
  }
  return null
}

export function formatDateDisplay(value?: DateLike): string {
  const date = normalizeDateInput(value)
  if (!date) return '-'
  const day = pad2(date.getDate())
  const month = MONTH_ABBREVIATIONS[date.getMonth()] ?? pad2(date.getMonth() + 1)
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTimeDisplay(value?: DateLike): string {
  const date = normalizeDateInput(value)
  if (!date) return '-'
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  return `${formatDateDisplay(date)} ${hours}:${minutes}`
}

const RANGE_SPLITTER = /\s*(?:→|->|—|–|s\/d|s\.d\.|sd|hingga|sampai|to)\s*/i

const extractRangeParts = (input?: string): { start?: string; end?: string } => {
  if (!input) return {}
  const parts = String(input)
    .split(RANGE_SPLITTER)
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length >= 2) {
    return { start: parts[0], end: parts[1] }
  }
  return {}
}

export function formatDateRangeDisplay(start?: DateLike, end?: DateLike, separator = ' → '): string {
  const startLabel = formatDateDisplay(start)
  const endLabel = formatDateDisplay(end)
  if (startLabel === '-' && endLabel === '-') return '-'
  if (endLabel === '-') return startLabel
  if (startLabel === '-') return endLabel
  return `${startLabel}${separator}${endLabel}`
}

export function calculateInclusiveDays(start?: DateLike, end?: DateLike): number | null {
  const startDate = normalizeDateInput(start)
  const endDate = normalizeDateInput(end)
  if (!startDate || !endDate) return null
  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  const diffDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1
  return diffDays >= 0 ? diffDays : null
}

export function renderApprovedBlockHtml(info: ApprovalInfo): string {
  const rangeParts = extractRangeParts(info?.duration)
  const formattedRange = rangeParts.start || rangeParts.end
    ? formatDateRangeDisplay(rangeParts.start, rangeParts.end)
    : info?.duration ?? ''
  const totalDays = calculateInclusiveDays(rangeParts.start, rangeParts.end)
  const durationWithTotal = (formattedRange || '-') + (totalDays ? ` (${totalDays} Hari)` : '')
  const at = formatDateTimeDisplay(info?.approvedAt ?? Date.now())

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#e8f9ee,#f4fff8);border-radius:10px;border:1px solid rgba(33,150,83,0.12);padding:12px;margin-bottom:18px;color:#07341f;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#43a047,#66bb6a);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">✓</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#0b3f2b;margin-bottom:8px;">Peminjaman Telah di Approve</div>
          <div style="font-size:12px;color:#0b3f2b;opacity:0.85;margin-bottom:8px;">Notifikasi ini menunjukkan permintaan peminjaman telah disetujui dan dapat diproses lebih lanjut.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#153d2a;">
            <tr>
              <td style="width:160px;padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Disetujui oleh</td>
              <td style="padding:6px 8px;">${escapeHtml(info?.approverName ?? '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Tanggal & Waktu</td>
              <td style="padding:6px 8px;">${escapeHtml(at)}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Durasi Peminjaman</td>
              <td style="padding:6px 8px;">${escapeHtml(durationWithTotal || '-')}</td>
            </tr>
            ${info?.note ? `<tr><td style="padding:6px 8px;font-weight:700;color:#0b3f2b;vertical-align:top;">Catatan</td><td style="padding:6px 8px;"><div style="background:rgba(255,255,255,0.9);padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);color:#0a3626;white-space:pre-wrap;">${escapeHtml(info.note)}</div></td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `
}

export function removeApprovalCta(html: string): string {
  if (typeof html !== 'string') return html
  const marker = '<!-- Approval CTA'
  const start = html.indexOf(marker)
  if (start === -1) return html

  const firstClose = html.indexOf('</table>', start)
  if (firstClose === -1) return html
  const secondClose = html.indexOf('</table>', firstClose + 8)
  const end = secondClose !== -1 ? secondClose + 8 : firstClose + 8

  return html.slice(0, start) + html.slice(end)
}

export type BorrowerEmailTemplateParams = {
  isUpdate?: boolean
  submittedAt?: string
  formNumber?: string | number
  borrowerName: string
  entitasName: string
  borrowerPhone: string
  needType: string
  showNeedDetailsSection: boolean
  customerName: string
  companyName: string
  address: string
  phone: string
  marketingCompany: string
  outDate: string
  useDate: string
  returnDate: string
  productDetails: string
  pickupMethod: string
  note: string
  headerHtml: string
  footerHtml?: string
  heroBadgeLabel?: string
  extendReturnDates?: string[]
}

export const extractApprovedExtendDates = (loan: any): string[] => {
  const entries = Array.isArray(loan?.extendStatus)
    ? loan.extendStatus
    : loan?.extendStatus
      ? [loan.extendStatus]
      : []
  return entries
    .filter(entry => entry && typeof entry === 'object')
    .filter(entry => {
      const status = String(entry?.approveStatus || '').toLowerCase()
      return status.includes('setuj')
    })
    .map(entry => formatDateDisplay(entry?.requestedReturnDate || entry?.approveAt || entry?.requestAt))
    .filter(label => label && label !== '-')
}

export const extractLatestApprovedExtendDate = (loan: any): string | null => {
  const entries = Array.isArray(loan?.extendStatus)
    ? loan.extendStatus
    : loan?.extendStatus
      ? [loan.extendStatus]
      : []
  const approved = entries
    .filter(entry => entry && typeof entry === 'object')
    .filter(entry => {
      const status = String(entry?.approveStatus || '').toLowerCase()
      return status.includes('setuj')
    })
    .map(entry => entry?.requestedReturnDate || entry?.approveAt || entry?.requestAt)
    .filter(Boolean)
  return approved.length ? approved[approved.length - 1] : null
}

export function buildBorrowerEmailHtml(options: BorrowerEmailTemplateParams): string {
  const {
    isUpdate,
    submittedAt,
    formNumber,
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
    footerHtml = '',
    heroBadgeLabel = 'BRW',
    extendReturnDates = [],
  } = options

  const effectiveFormNumber = formNumber ?? '-'
  const safeBorrowerName = borrowerName || '-'
  const safeSubmittedAt = submittedAt || '-'
  const extendRowsHtml = extendReturnDates.length
    ? extendReturnDates
        .map(dateLabel => `
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Extend :</td>
                  <td style="padding:8px 0;color:#24425f">${dateLabel}</td>
                </tr>`)
        .join('')
    : ''

  return `
    <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; background:#f4f6f8;">
      ${isUpdate ? `<div style="background:#fff8e1;padding:10px;border-radius:6px;border:1px solid #ffe08a;margin-bottom:12px;color:#6a4a00;font-weight:600;">UPDATE: This is an update version of the notification</div>` : ''}

      <div style="max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 8px 20px rgba(20,20,40,0.06);overflow:hidden;border:1.5px solid rgba(0,0,0,0.12);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1976d2 0%,#0d47a1 100%);color:#fff;padding:14px 0;border-collapse:collapse">
          <tr>
            <td align="center">
              <table role="presentation" width="900" cellpadding="0" cellspacing="0" style="width:100%;max-width:900px;margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 16px;vertical-align:middle;width:64px;text-align:left;">
                    <div style="display:inline-block;width:46px;height:46px;border-radius:6px;background:rgba(255,255,255,0.12);color:white;font-weight:700;line-height:46px;text-align:center;font-family:Inter, Arial, sans-serif;">${heroBadgeLabel}</div>
                  </td>
                  <td style="padding:12px 16px;vertical-align:middle;text-align:left;">
                    <div style="font-family:Inter, Arial, sans-serif;font-size:18px;font-weight:700;">Informasi Peminjaman</div>
                    <div style="font-size:13px;opacity:0.92;margin-top:6px;color:rgba(255,255,255,0.92);">Tanggal Pengajuan : ${safeSubmittedAt}</div>
                  </td>
                  <td style="padding:12px 16px;vertical-align:middle;text-align:right;width:180px;">
                    <div style="background:rgba(255,255,255,0.12);color:#fff;padding:6px 10px;border-radius:6px;display:inline-block;font-weight:700;font-size:13px;font-family:Inter, Arial, sans-serif;">Form #${effectiveFormNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="padding:20px 28px;">
                  ${headerHtml}
          <section style="margin-bottom:18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:10px;">
              <tr>
                <td style="width:46px;vertical-align:middle;padding-right:12px;">
                  <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#e3f2ff,#cfe9ff);display:inline-block;text-align:center;color:#0d47a1;font-weight:800;font-size:14px;line-height:36px;">#</div>
                </td>
                <td style="vertical-align:middle;padding:0;">
                  <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Peminjam</div>
                  <div style="font-size:12px;color:rgba(0, 0, 0, 0.89);display:block;padding-top:6px;line-height:1.25;">Detail informasi peminjam yang akan menerima barang</div>
                </td>
              </tr>
            </table>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Nama Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${safeBorrowerName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Entitas Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${entitasName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">No Telepon Peminjam :</td>
                  <td style="padding:8px 0;color:#24425f">${borrowerPhone}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.2px solid rgba(0,0,0,0.08);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Jenis Kebutuhan :</td>
                  <td style="padding:8px 0;color:#24425f">${needType}</td>
                </tr>
              </tbody>
            </table>
          </section>

  ${showNeedDetailsSection ? `
          <section style="margin-bottom:18px;">
            <div style="margin-bottom:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:46px;vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#fff2e6,#ffe7d1);display:inline-block;text-align:center;color:#b45309;font-weight:800;font-size:14px;line-height:36px;">#</div>
                  </td>
                  <td style="vertical-align:middle;padding:0;">
                    <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Kebutuhan Peminjaman &quot;${needType}&quot;</div>
                    <div style="font-size:12px;color:rgba(0, 0, 0, 0.77);display:block;padding-top:6px;line-height:1.25;">Data spesifik kebutuhan peminjaman dan alamat/instansi terkait</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Nama Customer :</td>
                  <td style="padding:8px 0;color:#24425f">${customerName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Nama Perusahaan / Institusi :</td>
                  <td style="padding:8px 0;color:#24425f">${companyName}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Alamat :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${address}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.2px solid rgba(0,0,0,0.08);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">No Telepon :</td>
                  <td style="padding:8px 0;color:#24425f">${phone}</td>
                </tr>
              </tbody>
            </table>
          </section>
          ` : ''}

          <section>
            <div style="margin-bottom:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:46px;vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#e8f5e9,#dff2e4);display:inline-block;text-align:center;color:#2e7d32;font-weight:800;font-size:14px;line-height:36px;">#</div>
                  </td>
                  <td style="vertical-align:middle;padding:0;">
                    <div style="font-weight:800;color:#0d2338;font-size:15px;">Informasi Detail Peminjaman</div>
                    <div style="font-size:12px;color:rgba(0,0,0,0.86);display:block;padding-top:6px;line-height:1.25;">Informasi detail produk, tanggal keluar, pemakaian, dan pengembalian</div>
                  </td>
                </tr>
              </table>
            </div>
            <div style="height:1.5px;background:linear-gradient(90deg, rgba(16,40,67,0.14), rgba(16,40,67,0.06));margin:10px 0 14px;border-radius:2px;"></div>
            <table style="width:100%;border-collapse:collapse;color:#16324b;font-size:13px;border-spacing:0;">
              <tbody>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="width:260px;padding:8px 0;font-weight:700;color:#253053;">Marketing Company :</td>
                  <td style="padding:8px 0;color:#24425f">${marketingCompany}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang keluar dari gudang :</td>
                  <td style="padding:8px 0;color:#24425f">${outDate}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang dipakai :</td>
                  <td style="padding:8px 0;color:#24425f">${useDate}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1.4px solid rgba(0,0,0,0.12);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Tanggal barang dikembalikan :</td>
                  <td style="padding:8px 0;color:#24425f">${returnDate}</td>
                </tr>
                ${extendRowsHtml}
                <tr style="vertical-align:top;border-bottom:1px solid rgba(16,40,67,0.06);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Rincian Product :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${productDetails}</td>
                </tr>
                <tr style="vertical-align:top;border-bottom:1px solid rgba(16,40,67,0.06);">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Metode Pengambilan Barang :</td>
                  <td style="padding:8px 0;color:#24425f">${pickupMethod}</td>
                </tr>
                <tr style="vertical-align:top;">
                  <td style="padding:8px 0;font-weight:700;color:#253053;">Catatan :</td>
                  <td style="padding:8px 0;color:#24425f;white-space:pre-wrap;">${note}</td>
                </tr>
              </tbody>
            </table>
          </section>

          ${footerHtml || ''}

        </div>
      </div>
    </div>
  `
}
