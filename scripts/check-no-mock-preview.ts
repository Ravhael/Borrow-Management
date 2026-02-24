const fs = require('fs');
const path = require('path');

const targets = [
  'pages/api/admin/send-preview-email.ts',
  'pages/email-preview.tsx',
  'pages/email-preview-new.tsx'
]

let failed = false
for (const t of targets) {
  const p = path.join(__dirname, '..', t)
  let ok = true
  let content = ''
  try { content = fs.readFileSync(p, 'utf8') } catch (e) { console.error('file missing', p); failed = true; continue }
  if (/sampleLoan/.test(content)) { console.error(`${t}: contains sampleLoan`); ok = false }
  if (/data\/loans.json/.test(content)) { console.error(`${t}: imports data/loans.json`); ok = false }
  if (/loansData/.test(content)) { console.error(`${t}: imports loansData`); ok = false }
  if (!ok) failed = true
}

if (failed) {
  console.error('\nMock/sample loan usage detected in runtime preview/send files — please remove all sample fallbacks.')
  process.exit(2)
}

console.log('OK — runtime preview and preview-send files contain no sample/mock loan usage.')
