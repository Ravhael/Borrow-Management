import fs from 'fs/promises'
import path from 'path'

async function run() {
  const filePath = path.join(process.cwd(), 'data', 'loans.json')
  const backupPath = path.join(process.cwd(), 'data', `loans.json.bak.${Date.now()}`)

  try {
    // try reading file
    const raw = await fs.readFile(filePath, 'utf8')
    const content = raw.trim()

    // If file exists but is empty or only contains an empty array, we'll replace it
    const isEmpty = content.length === 0
    let parsed: any
    try {
      parsed = content.length ? JSON.parse(content) : []
    } catch (err) {
      console.warn('Existing loans.json is invalid JSON — we will back it up and replace with default template.')
      await fs.copyFile(filePath, backupPath)
      await fs.writeFile(filePath, JSON.stringify([defaultLoanTemplate()], null, 2), 'utf8')
      console.log('Wrote default loan template to', filePath)
      return
    }

    if (isEmpty || (Array.isArray(parsed) && parsed.length === 0)) {
      // backup the existing file
      await fs.copyFile(filePath, backupPath)
      await fs.writeFile(filePath, JSON.stringify([defaultLoanTemplate()], null, 2), 'utf8')
      console.log('Initialized empty loans.json with default loan template (backup at', backupPath, ')')
      return
    }

    const force = process.argv.includes('--force')

    if (force) {
      // backup and overwrite
      await fs.copyFile(filePath, backupPath)
      await fs.writeFile(filePath, JSON.stringify([defaultLoanTemplate()], null, 2), 'utf8')
      console.log('Forced overwrite: replaced loans.json with default template (backup at', backupPath, ')')
      return
    }

    console.log('loans.json already contains data — no change made (use --force to overwrite)')
  } catch (err: any) {
    // File doesn't exist — create parent directory if needed and write template
    if (err.code === 'ENOENT') {
      const dir = path.join(process.cwd(), 'data')
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch {}
      await fs.writeFile(path.join(process.cwd(), 'data', 'loans.json'), JSON.stringify([defaultLoanTemplate()], null, 2), 'utf8')
      console.log('Created loans.json with default template')
      return
    }
    console.error('Unexpected error while initializing loans.json:', err)
    process.exit(1)
  }
}

function defaultLoanTemplate() {
  const now = new Date().toISOString()
  return {
    id: '',
    submittedAt: '',
    isDraft: false,
    entitasId: '',
    borrowerPhone: '',
    borrowerEmail: '',
    borrowerName: '',
    needType: '',
    needDetails: {},
    company: [""],
    outDate: '',
    useDate: '',
    returnDate: '',
    productDetailsText: '',
    pickupMethod: '',
    note: '',
    approvalAgreementFlag: false,
    // provide a fuller default structure for notifications so it's visible in the template
    submitNotifications: {
      companies: {
        "": {
          Marketing: { sent: false, email: '', sentAt: '' },
          Admin: { sent: false, email: '', sentAt: '' }
        }
      }
    },
    approvalNotifications: {
      entitas: {
        "": {
          Head: { sent: false, email: '', sentAt: '' },
          Admin: { sent: false, email: '', sentAt: '' },
          Others: { sent: false, email: '', sentAt: '' },
          Finance: { sent: false, email: '', sentAt: '' }
        }
      },
      companies: {
        "": {
          Head: { sent: false, email: '', sentAt: '' },
          Admin: { sent: false, email: '', sentAt: '' },
          Others: { sent: false, email: '', sentAt: '' },
          Finance: { sent: false, email: '', sentAt: '' },
          Marketing: { sent: false, email: '', sentAt: '' },
          Warehouse: { sent: false, email: '', sentAt: '' }
        }
      }
    },
    approvals: {
      companies: {
        "": { approved: false, approvedBy: '', approvedAt: '', note: '' }
      }
    },
    reminderStatus: {
      "1764125862262_reminder_7_days": {
        sent: false,
        sentAt: '',
        type: 'reminder_7_days',
        notifications: {
          borrower: { sent: false, sentAt: '', email: '' },
          entitas: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' }
            }
          },
          companies: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' },
              Marketing: { sent: false, sentAt: '', email: '' },
              Warehouse: { sent: false, sentAt: '', email: '' }
            }
          }
        }
      },
      "1764125862262_reminder_3_days": {
        sent: false,
        sentAt: '',
        type: 'reminder_3_days',
        notifications: {
          borrower: { sent: false, sentAt: '', email: '' },
          entitas: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' }
            }
          },
          companies: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' },
              Marketing: { sent: false, sentAt: '', email: '' },
              Warehouse: { sent: false, sentAt: '', email: '' }
            }
          }
        }
      },
      "1764125862262_reminder_1_days": {
        sent: false,
        sentAt: '',
        type: 'reminder_1_days',
        notifications: {
          borrower: { sent: false, sentAt: '', email: '' },
          entitas: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' }
            }
          },
          companies: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' },
              Marketing: { sent: false, sentAt: '', email: '' },
              Warehouse: { sent: false, sentAt: '', email: '' }
            }
          }
        }
      },
      "1764125862262_reminder_0_days": {
        sent: false,
        sentAt: '',
        type: 'reminder_0_days',
        notifications: {
          borrower: { sent: false, sentAt: '', email: '' },
          entitas: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' }
            }
          },
          companies: {
            "": {
              Head: { sent: false, sentAt: '', email: '' },
              Admin: { sent: false, sentAt: '', email: '' },
              Others: { sent: false, sentAt: '', email: '' },
              Finance: { sent: false, sentAt: '', email: '' },
              Marketing: { sent: false, sentAt: '', email: '' },
              Warehouse: { sent: false, sentAt: '', email: '' }
            }
          }
        }
      }
    },
    warehouseStatus: {
      status: '',
      processedAt: '',
      processedBy: '',
      returnedAt: '',
      returnedBy: ''
    },
    returnNotifications: {
      entitas: {
        "": {
          Head: { sent: false, sentAt: '', email: '' },
          Admin: { sent: false, sentAt: '', email: '' },
          Others: { sent: false, sentAt: '', email: '' },
          Finance: { sent: false, sentAt: '', email: '' }
        }
      },
      companies: {
        "": {
          Head: { sent: false, sentAt: '', email: '' },
          Admin: { sent: false, sentAt: '', email: '' },
          Others: { sent: false, sentAt: '', email: '' },
          Finance: { sent: false, sentAt: '', email: '' },
          Marketing: { sent: false, sentAt: '', email: '' },
          Warehouse: { sent: false, sentAt: '', email: '' }
        }
      }
    }
    ,
    // extension status — same shape as returnStatus
    // extendStatus is now an array (history of requests)
    extendStatus: [],
    // extension notifications mirror returnNotifications
    extendNotification: {
      entitas: {
        "": {
          Head: { sent: false, sentAt: '', email: '' },
          Admin: { sent: false, sentAt: '', email: '' },
          Others: { sent: false, sentAt: '', email: '' },
          Finance: { sent: false, sentAt: '', email: '' }
        }
      },
      companies: {
        "": {
          Head: { sent: false, sentAt: '', email: '' },
          Admin: { sent: false, sentAt: '', email: '' },
          Others: { sent: false, sentAt: '', email: '' },
          Finance: { sent: false, sentAt: '', email: '' },
          Marketing: { sent: false, sentAt: '', email: '' },
          Warehouse: { sent: false, sentAt: '', email: '' }
        }
      }
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
