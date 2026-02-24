import { generateonSubmitMarketingEmail } from '../utils/emailTemplates'
import fs from 'fs'

const html = generateonSubmitMarketingEmail({ id: '0001', borrowerName: 'Test' })
let out = html.replace('Permintaan Peminjaman', 'Peminjaman disetujui')
const approvedBlock = `<div style="background:#f6fbff;border-radius:8px;border:1.5px solid rgba(13,71,161,0.12);padding:12px 14px;margin-bottom:14px;color:#0d2b4e;"><div style="font-weight:700;margin-bottom:6px;color:#0b2545;">Peminjaman telah disetujui,</div><div style="font-size:13px;color:#24425f;line-height:1.4;"><div><strong>Di setujui oleh :</strong> Entitas Approver</div><div><strong>Tanggal dan Waktu :</strong> 2025-11-02</div><div><strong>Durasi Peminjaman :</strong> 2025-11-10 -> 2025-11-15 </div></div></div>`
out = out.replace(/<div style="background:#f6fbff[\s\S]*?<\/div>\s*<section/, `${approvedBlock}<section`)

const marker = '<!-- Approval CTA'
const start = out.indexOf(marker)
console.log('start', start)
const firstClose = out.indexOf('</table>', start)
console.log('firstClose', firstClose)
const secondClose = out.indexOf('</table>', firstClose + 8)
console.log('secondClose', secondClose)
const end = secondClose !== -1 ? secondClose + 8 : firstClose + 8
const removed = out.slice(0, start) + out.slice(end)
console.log('Contains Buka Approvals before:', out.includes('Buka Approvals'))
console.log('Contains Buka Approvals after removal:', removed.includes('Buka Approvals'))
fs.writeFileSync('tmp_test_remove_after.html', removed)
