import { PrismaClient } from '@prisma/client'
import rolesData from '../data/roles.json'
import directoratesData from '../data/directorates.json'
import entitasData from '../data/entitas.json'
import usersData from '../data/users.json'
import mktCompanyData from '../data/mkt-company.json'
import mailSettingsData from '../data/mail-settings.json'
import appscriptConfigData from '../data/appscript-config.json'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed roles
  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    })
  }
  console.log('Roles seeded')

  // Seed directorates
  for (const directorate of directoratesData) {
    await prisma.directorate.upsert({
      where: { code: directorate.code },
      update: {},
      create: {
        id: directorate.id,
        name: directorate.name,
        code: directorate.code,
        description: directorate.description,
        email: directorate.email,
        active: directorate.active
      }
    })
  }
  console.log('Directorates seeded')

  // Seed entitas
  for (const entitas of entitasData) {
    const entitasCreate: any = {
      id: entitas.id,
      name: entitas.name,
      code: entitas.code,
      description: entitas.description,
      // entitas.json stores multiple emails; store the full object
      emails: entitas.emails ?? { Head: '', Finance: '', Admin: '', Others: '' },
      // isActive indicates if the entitas is active
      isActive: entitas.isActive ?? true,
      directorateId: entitas.directorateId
    }

    await prisma.entitas.upsert({
      where: { code: entitas.code },
      // If an entitas already exists, update its fields so we sync emails / isActive / directorate changes
      update: entitasCreate as any,
      create: entitasCreate as any
    })
  }
  console.log('Entitas seeded')

  // Seed users
  for (const user of usersData) {
          // Determine id for user. If user.id present, use it, otherwise compute a role-based id
          let userId = user.id

          // Resolve role record if roleid supplied as label or numeric
          let roleRecord = null
          if (user.roleid) {
            // Try find role by id first
            roleRecord = await prisma.role.findUnique({ where: { id: String(user.roleid) } })
            if (!roleRecord) {
              // Fallback: try to find by name matching common labels
              const labelToName: Record<string,string> = { admin: 'Admin', superadmin: 'Superadmin', gudang: 'Warehouse', marketing: 'Marketing', regular: 'Peminjam' }
              const desiredName = labelToName[String(user.roleid)] ?? String(user.roleid)
              roleRecord = await prisma.role.findFirst({ where: { name: desiredName } })
            }
          }

          if (!userId) {
            if (roleRecord) {
              // create a role-based id: prefix + 3-digit number
              const roleName = roleRecord.name.toLowerCase()
              const prefixMap: Record<string,string> = { admin: 'adm', superadmin: 'sp', warehouse: 'wh', marketing: 'mkt', peminjam: 'pjm' }
              const prefix = prefixMap[roleName] ?? 'usr'
              const count = await prisma.user.count({ where: { roleid: roleRecord.id } })
              userId = `${prefix}${String(count + 1).padStart(3, '0')}`
            } else {
              // fallback generic id
              const count = await prisma.user.count()
              userId = `usr${String(count + 1).padStart(3, '0')}`
            }
          }

          await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
              id: userId,
              username: user.username,
              password: await bcrypt.hash(user.password ?? '', 12),
              name: user.name,
              email: user.email,
              phone: user.phone,
              roleid: roleRecord ? roleRecord.id : user.roleid,
              directorateid: user.directorateid,
              entitasid: user.entitasid,
              isActive: user.isActive,
              IsLoggedIn: user.IsLoggedIn,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              permissions: user.permissions
            }
          })
  }
  console.log('Users seeded')

  // Seed marketing companies (mkt-company.json)
  for (const comp of mktCompanyData) {
    const companyCreate: any = {
      value: comp.value,
      label: comp.label,
      description: comp.description ?? null,
      emails: comp.emails ?? {},
      isActive: comp.isActive ?? true,
      // optional owner reference (data file may include userId)
      userId: (comp as any).userId ?? null
    }

    await prisma.mktCompany.upsert({
      where: { value: comp.value },
      update: {},
      create: companyCreate as any
    })
  }
  console.log('MktCompany seeded')

  // Seed MailSettings if the repository contains a snapshot
  if (mailSettingsData && Object.keys(mailSettingsData).length > 0) {
    try {
      const existing = await prisma.mailSettings.findUnique({ where: { id: 1 } })
      if (existing) {
        await prisma.mailSettings.update({ where: { id: 1 }, data: { smtp: mailSettingsData.smtp, notes: mailSettingsData.notes } })
        console.log('MailSettings updated (id=1)')
      } else {
        await prisma.mailSettings.create({ data: { smtp: mailSettingsData.smtp, notes: mailSettingsData.notes } })
        console.log('MailSettings created (id=1)')
      }
    } catch (e) {
      console.warn('Failed to seed MailSettings from data/mail-settings.json — continuing', e)
    }
  } else {
    console.log('No mail-settings snapshot found — skipping MailSettings seeding')
  }

  // Seed AppscriptConfig from data snapshot if present
  if (appscriptConfigData && Object.keys(appscriptConfigData).length > 0) {
    try {
      // Some Prisma setups may not generate a typed property for this model; use an untyped access to avoid TS errors
      const clientAny = prisma as any
      const existing = await clientAny.appscriptConfig.findUnique({ where: { id: 1 } })
      if (existing) {
        await clientAny.appscriptConfig.update({
          where: { id: 1 },
          data: {
            spreadsheetId: appscriptConfigData.spreadsheetId,
            scriptUrl: appscriptConfigData.scriptUrl,
            sheetName: appscriptConfigData.sheetName,
            enabled: appscriptConfigData.enabled
          }
        })
        console.log('AppscriptConfig updated (id=1)')
      } else {
        await clientAny.appscriptConfig.create({
          data: {
            spreadsheetId: appscriptConfigData.spreadsheetId,
            scriptUrl: appscriptConfigData.scriptUrl,
            sheetName: appscriptConfigData.sheetName,
            enabled: appscriptConfigData.enabled
          }
        })
        console.log('AppscriptConfig created (id=1)')
      }
    } catch (e) {
      console.warn('Failed to seed AppscriptConfig from data/appscript-config.json — continuing', e)
    }
  } else {
    console.log('No appscript-config snapshot found — skipping AppscriptConfig seeding')
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })