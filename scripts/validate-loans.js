const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function isISODate(str) {
  return !isNaN(Date.parse(str))
}

function isValidEmail(email) {
  if (!email) return false
  // simple regex
  return /\S+@\S+\.\S+/.test(email)
}

function normalizePhoneNumber(p) {
  if (!p) return p
  // Remove spaces, dashes
  return p.replace(/[^0-9+]/g, '')
}

async function validate() {
  const file = path.join(process.cwd(), 'data', 'loans.json')
  if (!fs.existsSync(file)) {
    console.error('data/loans.json not found')
    process.exit(2)
  }

  const raw = fs.readFileSync(file, 'utf8')
  let loans = []
  try { loans = JSON.parse(raw) } catch (err) { console.error('Invalid json', err); process.exit(2) }

  console.log(`Found ${loans.length} loan(s) in data/loans.json`) 

  const summary = { total: loans.length, issues: [], perLoan: {} }

  // cache company + entitas names for quick lookup
  const companies = await prisma.mktCompany.findMany({ select: { value: true } })
  const companySet = new Set(companies.map(c => c.value))
  const entitas = await prisma.entitas.findMany({ select: { code: true } })
  const entitasSet = new Set(entitas.map(e => e.code))

  for (const loan of loans) {
    const id = loan.id || '(no-id)'
    summary.perLoan[id] = { warnings: [], errors: [] }
    const issues = summary.perLoan[id]

    // Required fields
    const required = ['id','submittedAt','borrowerName','entitasId','company','outDate','useDate','returnDate']
    for (const key of required) {
      if (loan[key] === undefined || loan[key] === null || loan[key] === '') {
        issues.errors.push(`missing required field: ${key}`)
      }
    }

    // Date checks
    if (loan.submittedAt && !isISODate(loan.submittedAt)) issues.errors.push('submittedAt is not ISO date')

    const dOut = loan.outDate ? new Date(loan.outDate) : null
    const dUse = loan.useDate ? new Date(loan.useDate) : null
    const dRet = loan.returnDate ? new Date(loan.returnDate) : null
    if (dOut && dUse && dOut > dUse) issues.errors.push('outDate > useDate')
    if (dUse && dRet && dUse > dRet) issues.errors.push('useDate > returnDate')

    // Email and phone formats
    if (loan.borrowerEmail && !isValidEmail(loan.borrowerEmail)) issues.warnings.push('borrowerEmail looks invalid')
    if (loan.borrowerPhone && !/^\+?\d[\d\s\-]+$/.test(loan.borrowerPhone)) {
      issues.warnings.push('borrowerPhone format is unusual')
    }

    // Normalize phone suggestion
    if (loan.borrowerPhone) {
      const norm = normalizePhoneNumber(loan.borrowerPhone)
      if (norm !== loan.borrowerPhone) issues.warnings.push(`borrowerPhone can be normalized -> ${norm}`)
    }

    // entitas checks
    if (loan.entitasId && !entitasSet.has(String(loan.entitasId))) issues.errors.push(`entitasId '${loan.entitasId}' not found in DB entitas table`)

    // company checks
    if (loan.company) {
      const comps = Array.isArray(loan.company) ? loan.company : [loan.company]
      for (const c of comps) {
        if (!companySet.has(c)) issues.errors.push(`company '${c}' not found in DB mktCompany table`)
      }
    }

    // notification objects: check for empty email fields
    const checkNotifications = (obj, banner) => {
      if (!obj) return
      // iterate recursively if it's an object of objects with email fields
      const scan = (o, pathParts = []) => {
        if (typeof o !== 'object' || o === null) return
        for (const [k,v] of Object.entries(o)) {
          if (v && typeof v === 'object' && 'email' in v) {
            if (!v.email) issues.warnings.push(`${banner} at ${[...pathParts, k].join('.')} has empty email`)            
            else if (!isValidEmail(v.email)) issues.warnings.push(`${banner} at ${[...pathParts, k].join('.')} has invalid email: ${v.email}`)
          } else if (typeof v === 'object') {
            scan(v, [...pathParts, k])
          }
        }
      }
      scan(obj)
    }

    checkNotifications(loan.submitNotifications, 'submitNotifications')
    checkNotifications(loan.approvalNotifications, 'approvalNotifications')
    // Reminder notifications moved into reminderStatus[<key>].notifications
    if (loan.reminderNotifications) {
      // still validate legacy field if present
      checkNotifications(loan.reminderNotifications, 'reminderNotifications')
    }
    if (loan.reminderStatus) {
      Object.entries(loan.reminderStatus).forEach(([k, v]) => {
        if (v && v.notifications) {
          checkNotifications(v.notifications, `reminderStatus.${k}.notifications`)
        }
      })
    }
    checkNotifications(loan.returnNotifications, 'returnNotifications')
    // validate extension-notification payloads if present
    checkNotifications(loan.extendNotification, 'extendNotification')

    // approvals structure
    if (!loan.approvals || !loan.approvals.companies) {
      issues.warnings.push('approvals.companies missing')
    }

    // product details
    if (!loan.productDetailsText || loan.productDetailsText.trim().length < 5) {
      issues.warnings.push('productDetailsText is short or missing')
    }

    // if no errors or warnings add check mark
    if (issues.errors.length === 0 && issues.warnings.length === 0) {
      issues.ok = true
    }

    if (issues.errors.length) summary.issues.push({ id, type: 'errors', details: issues.errors })
    if (issues.warnings.length) summary.issues.push({ id, type: 'warnings', details: issues.warnings })
  }

  console.log(JSON.stringify(summary, null, 2))
  await prisma.$disconnect()
}

validate().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
