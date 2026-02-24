import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const outDir = path.join(process.cwd(), 'data')

function writeFile(fileName: string, data: any) {
  const target = path.join(outDir, fileName)
  fs.writeFileSync(target, JSON.stringify(data, null, 2))
  console.log(`Wrote ${target}`)
}

async function run() {
  try {
    console.log('Exporting current DB to data/*.json...')
    const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } })
    const directorates = await prisma.directorate.findMany({ orderBy: { id: 'asc' } })
    const entitas = await prisma.entitas.findMany({ orderBy: { id: 'asc' } })
    const mktCompanies = await prisma.mktCompany.findMany({ orderBy: { id: 'asc' } })
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } })
    const mailSettings = await prisma.mailSettings.findUnique({ where: { id: 1 } }).catch(() => null)
    const appscriptConfig = await prisma.appscriptConfig.findUnique({ where: { id: 1 } }).catch(() => null)

    // Convert Date objects to ISO strings where present
    const normalizeDates = (obj: any) => {
      if (!obj) return obj
      const copy: any = { ...obj }
      for (const k of Object.keys(copy)) {
        const v = copy[k]
        if (v instanceof Date) copy[k] = v.toISOString()
      }
      return copy
    }

    writeFile('roles.json', roles.map(normalizeDates))
    writeFile('directorates.json', directorates.map(normalizeDates))
    // Transform entitas objects into the JSON snapshot shape we use in the repo
    const entitasOut = entitas.map((e: any) => {
      const copy = normalizeDates(e)
      return {
        id: copy.id,
        name: copy.name,
        code: copy.code,
        description: copy.description,
        // For backwards compatibility, make a grouped emails object using the existing single email as Head
        emails: {
          Head: copy.email ?? '',
          Finance: '',
          Admin: '',
          Others: ''
        },
        isActive: copy.active ?? true,
        directorateId: copy.directorateId
      }
    })

    writeFile('entitas.json', entitasOut)
    // For users, we intentionally write the password value as-is (commonly hashed).
    // If passwords are plaintext in your DB, run the hash migration first.
    writeFile('users.json', users.map(normalizeDates))

    // Write MktCompany snapshot (marketing companies)
    const mktOut = mktCompanies.map((c: any) => ({
      value: c.value,
      label: c.label,
      description: c.description ?? null,
      userId: c.userId ?? null,
      isActive: c.isActive ?? true,
      emails: c.emails ?? {}
    }))
    writeFile('mkt-company.json', mktOut)

    // Mail settings: write single row (or empty object)
    writeFile('mail-settings.json', mailSettings ?? {})
      // Write AppscriptConfig snapshot if present
      writeFile('appscript-config.json', appscriptConfig ?? {})

    console.log('Export complete — you can now use these files as the default seed.')
  } catch (err) {
    console.error('Failed to export DB seed:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
