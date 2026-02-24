const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { menuGroups } = require('../config/menuGroups')
const { getCanonicalRole } = require('../config/roleConfig')

async function main() {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })
    for (const r of roles) {
      const key = getCanonicalRole(r.name)
      const out = { key, name: r.name, raw: r.allowedMenus }
      const items = []
      if (r.allowedMenus && Array.isArray(r.allowedMenus)) {
        for (const v of r.allowedMenus) {
          const s = String(v)
          if (s.startsWith('/')) items.push(s)
          else {
            const g = menuGroups.find(m => String(m.title).toLowerCase() === String(s).toLowerCase())
            if (g && Array.isArray(g.items)) g.items.forEach(it => items.push(it.href))
          }
        }
      }
      out.allowedItems = Array.from(new Set(items))
      console.log('---')
      console.log(JSON.stringify(out, null, 2))
    }
  } catch (err) {
    console.error('error', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
