import { FormDataShape } from '../types/form'

export type Tokens = Record<string, string>

function safeString(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  try { return JSON.stringify(v) } catch (e) { return String(v) }
}

function toTimestamp(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return String(d.getTime())
}

export function tokenizeForm(data: FormDataShape): Tokens {
  const out: Tokens = {}

  // direct fields
  const direct = [
    'borrowerName','entitasId','borrowerPhone','needType',
    'outDate','useDate','returnDate','productDetailsText','pickupMethod','note','lainnya'
  ]

  direct.forEach(k => {
    out[k] = safeString((data as any)[k])
  })

  // boolean
  out['approvalAgreementFlag'] = data.approvalAgreementFlag ? 'true' : 'false'

  // company array
  const companies: string[] = Array.isArray(data.company) ? data.company : []
  out['company'] = JSON.stringify(companies)
  out['company_csv'] = companies.join(', ')
  out['company_count'] = String(companies.length)

  // timestamps
  out['outDate_ts'] = toTimestamp(data.outDate)
  out['useDate_ts'] = toTimestamp(data.useDate)
  out['returnDate_ts'] = toTimestamp(data.returnDate)

  // computed: loan_days and is_long_loan
  try {
    if (data.useDate && data.returnDate) {
      const use = new Date(data.useDate)
      const ret = new Date(data.returnDate)
      const diff = Math.ceil((ret.getTime() - use.getTime()) / (1000 * 60 * 60 * 24))
      out['loan_days'] = String(isNaN(diff) ? '' : diff)
      out['is_long_loan'] = (diff > 7) ? 'true' : 'false'
    } else {
      out['loan_days'] = ''
      out['is_long_loan'] = 'false'
    }
  } catch (e) {
    out['loan_days'] = ''
    out['is_long_loan'] = 'false'
  }

  // is_weekend_use
  try {
    if (data.useDate) {
      const use = new Date(data.useDate)
      const day = use.getDay() // 0 Sunday, 6 Saturday
      out['is_weekend_use'] = (day === 0 || day === 6) ? 'true' : 'false'
    } else {
      out['is_weekend_use'] = 'false'
    }
  } catch (e) {
    out['is_weekend_use'] = 'false'
  }

  // flatten nested fields with dot in key (e.g. demo.namaCustomer or backup.alasan)
  Object.keys(data).forEach(k => {
    if (k.includes('.') && (data as any)[k] !== undefined) {
      out[k] = safeString((data as any)[k])
    }
  })

  // flatten needDetails object into tokens like needDetails.key
  try {
    if (data && (data as any).needDetails && typeof (data as any).needDetails === 'object') {
      Object.entries((data as any).needDetails).forEach(([k, v]) => {
        out[`needDetails.${k}`] = safeString(v)
      })
    }
    // backwards-compat: if demo or backup nested objects still exist, flatten them
    if (data && (data as any).demo && typeof (data as any).demo === 'object') {
      Object.entries((data as any).demo).forEach(([k, v]) => {
        out[`demo.${k}`] = safeString(v)
      })
    }
    if (data && (data as any).backup && typeof (data as any).backup === 'object') {
      Object.entries((data as any).backup).forEach(([k, v]) => {
        out[`backup.${k}`] = safeString(v)
      })
    }
  } catch (e) {
    // ignore flattening errors - tokenization should be best-effort
  }

  // also include any other non-null primitive/string fields not covered above
  Object.keys(data).forEach(k => {
    if (out[k] !== undefined) return
    const v = (data as any)[k]
    if (v === null || v === undefined) return
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = String(v)
    }
  })

  return out
}

export default tokenizeForm
