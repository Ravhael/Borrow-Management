import { escapeHtml, removeApprovalCta } from './shared'

export type ReminderBeforeInfo = {
  audienceLabel?: string
  returnDateLabel?: string
  daysLeftLabel?: string
  autoScheduleLabel?: string
  manualHint?: string
  borrowerName?: string
}

export type ReminderAfterInfo = {
  audienceLabel?: string
  returnDateLabel?: string
  daysLeftLabel?: string
  autoScheduleLabel?: string
  manualHint?: string
  borrowerName?: string
  accumulatedFineLabel?: string
  daysLeftNumber?: number
}

export function computeDaysUntil(returnDate?: string): number | undefined {
  if (!returnDate) return undefined
  const due = new Date(returnDate)
  if (Number.isNaN(due.getTime())) return undefined
  const today = new Date()
  const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Use Math.floor for day differences so overdue days are counted correctly (no negative rounding to -1 when >1 day overdue)
  const diffDays = Math.floor((dueOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays
}

export function formatReminderCountdown(days?: number): string {
  if (typeof days !== 'number' || Number.isNaN(days)) return '-'
  if (days < 0) return `${Math.abs(days)} hari terlambat`
  if (days === 0) return 'Jatuh tempo hari ini'
  if (days === 1) return '1 hari lagi'
  return `${days} hari lagi`
}

export function formatReminderUrgency(days?: number): string {
  if (typeof days !== 'number' || Number.isNaN(days)) return ''
  if (days < 0) return `H+${Math.abs(days)}`
  if (days === 0) return 'Hari H'
  if (days === 1) return 'H-1'
  return `H-${days}`
}

export function formatDateOnly(dateStr?: string): string {
  if (!dateStr) return '-'
  const parsed = new Date(dateStr)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  // Fallback: strip time component if present
  const candidate = String(dateStr).split('T')[0].split(' ')[0]
  return candidate || '-'
}

export function renderReminderBeforeBlock(info: ReminderBeforeInfo = {}): string {
  const label = info.audienceLabel ? `(${escapeHtml(info.audienceLabel)})` : ''
  const borrower = escapeHtml(info.borrowerName || 'Peminjam')
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#fff9ed,#fffef8);border-radius:10px;border:1px solid rgba(255,152,0,0.18);padding:12px;margin-bottom:18px;color:#3b2400;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#ff9800,#f57c00);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">⏰</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#4a2a00;margin-bottom:8px;">Pengingat Pengembalian Barang.</div>
          <div style="font-size:12px;color:#5b3b05;opacity:0.9;margin-bottom:8px;">${borrower} meminjam barang yang akan jatuh tempo. Mohon koordinasi agar barang segera dikembalikan sesuai jadwal.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#5b3b05;">
            <tr>
              <td style="width:210px;padding:6px 8px;font-weight:700;color:#4a2a00;vertical-align:top;">Tanggal Pengembalian</td>
              <td style="padding:6px 8px;">${escapeHtml(formatDateOnly(info.returnDateLabel))}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#4a2a00;vertical-align:top;">Sisa Waktu</td>
              <td style="padding:6px 8px;">${escapeHtml(info.daysLeftLabel || '-')}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:8px 0;">
                <div style="background:linear-gradient(90deg,#fff4e6,#fff8f0);border:1px solid rgba(255,152,0,0.18);border-radius:8px;padding:12px;display:flex;gap:12px;align-items:flex-start;">
                  <div style="font-size:20px;line-height:1;color:#b45309;font-weight:800;margin-top:2px;">⚠️</div>
                  <div style="color:#7a2f00;font-weight:700;font-size:13px;line-height:1.25;"><strong>Pemberitahuan penting:</strong> Pengembalian yang dilakukan melewati batas waktu akan dikenakan denda keterlambatan sebesar <strong>Rp100.000 per hari</strong> sesuai dengan kebijakan yang berlaku.</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export function renderReminderAfterBlock(info: ReminderAfterInfo = {}): string {
  const label = info.audienceLabel ? `(${escapeHtml(info.audienceLabel)})` : ''
  const borrower = escapeHtml(info.borrowerName || 'Peminjam')
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:linear-gradient(90deg,#fff9ed,#fffef8);border-radius:10px;border:1px solid rgba(255,152,0,0.18);padding:12px;margin-bottom:18px;color:#3b2400;font-family:Inter, Arial, sans-serif;">
      <tr>
        <td width="60" style="padding:8px;vertical-align:top;">
          <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#ff9800,#f57c00);display:inline-block;line-height:44px;text-align:center;color:white;font-weight:800;font-size:18px;">⏰</div>
        </td>
        <td style="padding:8px 8px 8px 4px;vertical-align:top;">
          <div style="font-weight:800;font-size:16px;color:#4a2a00;margin-bottom:8px;">Pemberitahuan Keterlambatan Pengembalian Barang.</div>
          <div style="font-size:12px;color:#5b3b05;opacity:0.9;margin-bottom:8px;">Peminjaman barang atas nama ${borrower} telah melewati tanggal pengembalian yang ditentukan. Diharapkan agar barang segera dikembalikan untuk menghindari penambahan denda keterlambatan. Mohon koordinasi agar barang segera dikembalikan.</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;color:#5b3b05;">
            <tr>
              <td style="width:210px;padding:6px 8px;font-weight:700;color:#4a2a00;vertical-align:top;">Tanggal Pengembalian</td>
              <td style="padding:6px 8px;">${escapeHtml(formatDateOnly(info.returnDateLabel))}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#4a2a00;vertical-align:top;">Status</td>
              <td style="padding:6px 8px;">${escapeHtml(info.daysLeftLabel || '-')}</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;font-weight:700;color:#4a2a00;vertical-align:top;">Denda</td>
              <td style="padding:6px 8px;color:#7a2f00;font-weight:700;">${info.accumulatedFineLabel ? `<strong>${escapeHtml(info.accumulatedFineLabel)}</strong>` : '-'}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:8px 0;">
                <div style="background:linear-gradient(90deg,#fff4e6,#fff8f0);border:1px solid rgba(255,152,0,0.18);border-radius:8px;padding:12px;display:flex;gap:12px;align-items:flex-start;">
                  <div style="font-size:20px;line-height:1;color:#b45309;font-weight:800;margin-top:2px;">⚠️</div>
                  <div style="color:#7a2f00;font-weight:700;font-size:13px;line-height:1.25;"><strong>Pemberitahuan penting:</strong> Setiap keterlambatan pengembalian akan dikenakan denda sebesar <strong>Rp100.000 (seratus ribu rupiah)</strong> per hari, terhitung sejak tanggal jatuh tempo hingga barang dikembalikan, sesuai dengan kebijakan yang berlaku.</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export function makeReminderHtml(baseHtml: string, info?: ReminderBeforeInfo): string {
  if (typeof baseHtml !== 'string') return baseHtml
  const block = renderReminderBeforeBlock(info)
  let out = baseHtml.replace('Permintaan Peminjaman', 'Pengingat Peminjaman')
  out = out.replace(/<div style="background:#f6fbff[\s\S]*?<\/div>\s*<section/, `${block}<section`)
  return out
}

export function buildReminderSubject(borrower?: string, daysLeft?: number, manual?: boolean): string {
  const base = manual ? 'Manual Pengingat Pengembalian Barang' : 'Pengingat Pengembalian Barang'
  const urgency = formatReminderUrgency(daysLeft)
  const suffix = borrower ? ` - ${borrower}` : ''
  return `${base}${urgency ? ` (${urgency})` : ''}${suffix}`
}

export function stripReminderCta(html: string): string {
  return removeApprovalCta(html)
}
