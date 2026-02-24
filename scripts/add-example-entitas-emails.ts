import fs from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'data', 'entitas.json')

function makeEmail(local: string, code: string) {
  const domain = 'example.company'
  // sanitize code
  const c = String(code).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${local}-${c}@${domain}`
}

function addExampleEmails() {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const arr = JSON.parse(raw)

  const updated = arr.map((e: any) => {
    // create email addresses using code as suffix
    const code = e.code ?? e.name ?? `entitas-${e.id}`
    const emails = e.emails ?? { Head: '', Finance: '', Admin: '', Others: '' }

    return {
      ...e,
      emails: {
        Head: emails.Head && emails.Head.trim() !== '' ? emails.Head : makeEmail('head', code),
        Finance: emails.Finance && emails.Finance.trim() !== '' ? emails.Finance : makeEmail('finance', code),
        Admin: emails.Admin && emails.Admin.trim() !== '' ? emails.Admin : makeEmail('admin', code),
        Others: emails.Others && emails.Others.trim() !== '' ? emails.Others : makeEmail('others', code)
      }
    }
  })

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  console.log('Updated entitas.json with example emails for', updated.length, 'entries')
}

addExampleEmails()
