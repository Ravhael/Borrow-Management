import { generateonSubmitMarketingEmail, generateonSubmitCompanyEmail } from '../utils/emailTemplates'
import { minifyHtmlForEmail } from '../utils/minifyHtml'

const sampleLoan = {
  borrowerName: 'Budi Santoso',
  entitasId: 'Contoh Entitas',
  needType: 'Pinjam Peralatan',
  needDetails: { customerName: 'CV. Maju Jaya', companyName: 'PT. Contoh Perusahaan', address: 'Jl. Contoh No.10, Jakarta', phone: '021-555-0123' },
  company: ['Marketing - PT Contoh'],
  outDate: '2025-11-05',
  useDate: '2025-11-10',
  returnDate: '2025-11-15',
  productDetailsText: 'Laptop Dell XPS 13 (Qty: 2) \nMouse, Kabel Charger',
  pickupMethod: 'Ambil di Gudang',
  note: 'Contoh catatan untuk preview'
}

function printSizes(title: string, src: string) {
  const min = minifyHtmlForEmail(src)
  console.log(`\n--- ${title} ---`)
  console.log('original length:', src.length, 'bytes')
  console.log('minified length:', min.length, 'bytes')
  console.log('savings:', (100 - Math.round((min.length / src.length) * 100)) + '%')
}

const m = generateonSubmitMarketingEmail(sampleLoan)
const a = generateonSubmitCompanyEmail(sampleLoan)

printSizes('MARKETING (raw)', m)
printSizes('ADMIN (raw)', a)

// quick sample output head/tail for manual inspection
console.log('\nMARKETING sample snippet:\n', m.slice(0, 600))
console.log('\nMARKETING minified snippet:\n', minifyHtmlForEmail(m).slice(0, 600))
